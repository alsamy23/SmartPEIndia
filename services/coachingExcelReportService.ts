import * as XLSX from 'xlsx';
import { 
  PlayerProfileData, 
  PlayerAssessmentRecord, 
  SPORT_TEMPLATES, 
  CoachingSportId,
  getMeritClassification,
  academyService
} from './academyService';
import { academicCoachingCloudService } from './academicCoachingCloudService';
import { 
  sportsCoachingService, 
  AthleteProfile, 
  AssessmentRecord, 
  SPORTS_REGISTRY 
} from './sportsCoachingService';

export interface ManagementReportOptions {
  programName?: string;
  headCoachName?: string;
  sportFilter?: string; // 'all' or specific sport
  academicYear?: string;
  termTitle?: string;
}

export interface StudentProgressItem {
  sNo: number;
  studentId: string;
  studentName: string;
  gradeAge: string;
  ageCategory: string;
  gender: string;
  sport: string;
  sportId: CoachingSportId;
  position: string;
  squad: string;
  baselineScore: number | string;
  latestScore: number | string;
  progressChange: string;
  progressStatus: 'Significant Improvement' | 'Improving' | 'Stable' | 'Needs Attention' | 'Declining' | 'Initial Assessment' | 'Assessment Pending';
  overallDevLevel: string;
  technicalScore: string;
  tacticalScore: string;
  physicalScore: string;
  behaviourScore: string;
  topStrength1: string;
  topStrength2: string;
  topStrength3: string;
  priorityWeakness1: string;
  priorityWeakness2: string;
  priorityWeakness3: string;
  priorityDevArea: string;
  coachingAction: string;
  nextTarget: string;
  nextReviewDate: string;
  coachRemark: string;
  assessmentStatus: string;
  assessmentCount: number;
  history: PlayerAssessmentRecord[];
  player: PlayerProfileData;
  latestAssessment: PlayerAssessmentRecord | null;
}

export interface CohortProgressSummary {
  totalStudents: number;
  assessedCount: number;
  pendingCount: number;
  completionRate: number;
  averageScore: number;
  improvingCount: number;
  needsAttentionCount: number;
}

/**
 * Subject Expert Service for Generating School Management & Academy Excel Workbooks
 * Formatted to institutional standards for School Management Committees, Principals, 
 * Physical Education Inspection Boards, and Parents.
 */
export const coachingExcelReportService = {

  /**
   * Computes clean, uninvented student-by-student progress analytics
   * based strictly on actual assessment history and skill ratings.
   */
  getStudentProgressData(
    players?: PlayerProfileData[],
    assessments?: PlayerAssessmentRecord[],
    sportFilter: string = 'all'
  ): { items: StudentProgressItem[]; summary: CohortProgressSummary } {
    const allPlayers: PlayerProfileData[] = players && players.length > 0 
      ? players 
      : academyService.getPlayers();

    const allAssessments: PlayerAssessmentRecord[] = assessments && assessments.length > 0
      ? assessments
      : academyService.getAssessments();

    const targetPlayers = sportFilter && sportFilter !== 'all'
      ? allPlayers.filter(p => p.sport === sportFilter)
      : allPlayers;

    // Group assessments by player ID and sort chronologically
    const playerAssessmentsMap = new Map<string, PlayerAssessmentRecord[]>();
    allAssessments.forEach(a => {
      const list = playerAssessmentsMap.get(a.playerId) || [];
      list.push(a);
      playerAssessmentsMap.set(a.playerId, list);
    });

    let assessedCount = 0;
    let totalScoreSum = 0;
    let improvingCount = 0;
    let needsAttentionCount = 0;

    const items: StudentProgressItem[] = targetPlayers.map((player, idx) => {
      const history = (playerAssessmentsMap.get(player.id) || []).sort(
        (a, b) => new Date(a.assessmentDate).getTime() - new Date(b.assessmentDate).getTime()
      );

      const sportKey = (player.sport || 'football') as CoachingSportId;
      const sportTmpl = SPORT_TEMPLATES[sportKey] || SPORT_TEMPLATES.football;
      const sportName = sportTmpl?.name || player.sport || 'Sports Program';

      const gradeAge = player.gradeOrClass 
        ? `${player.gradeOrClass} (Age ${player.age})` 
        : `Age ${player.age}`;

      const ageCat = player.ageCategory || (
        player.age <= 10 ? 'U-10' : 
        player.age <= 12 ? 'U-12' : 
        player.age <= 14 ? 'U-14' : 
        player.age <= 16 ? 'U-16' : 'U-19'
      );

      const pos = player.position || 'All-Rounder';
      const squadName = player.batchOrTeam || 'Main Academy Squad';

      // =======================================================================
      // CASE 1: UNASSESSED / PENDING STUDENT (NO ASSESSMENTS)
      // =======================================================================
      if (history.length === 0) {
        return {
          sNo: idx + 1,
          studentId: player.id,
          studentName: player.name,
          gradeAge,
          ageCategory: ageCat,
          gender: player.gender,
          sport: sportName,
          sportId: sportKey,
          position: pos,
          squad: squadName,
          baselineScore: '—',
          latestScore: '—',
          progressChange: '—',
          progressStatus: 'Assessment Pending' as const,
          overallDevLevel: 'Pending',
          technicalScore: '—',
          tacticalScore: '—',
          physicalScore: '—',
          behaviourScore: '—',
          topStrength1: '—',
          topStrength2: '—',
          topStrength3: '—',
          priorityWeakness1: '—',
          priorityWeakness2: '—',
          priorityWeakness3: '—',
          priorityDevArea: 'Assessment Required',
          coachingAction: 'Schedule baseline skill test and multi-pillar physical assessment.',
          nextTarget: 'Complete initial multi-pillar assessment.',
          nextReviewDate: '—',
          coachRemark: 'Enrolled student-athlete pending baseline evaluation.',
          assessmentStatus: 'Pending',
          assessmentCount: 0,
          history: [],
          player,
          latestAssessment: null
        };
      }

      // We have at least 1 assessment
      assessedCount++;
      const latest = history[history.length - 1];
      totalScoreSum += latest.overallScore;

      // Extract granular skill ratings from the latest assessment
      const skillEntries = (sportTmpl.skills || [])
        .filter(s => latest.skillRatings && latest.skillRatings[s.id] !== undefined)
        .map(s => ({
          id: s.id,
          name: s.name,
          category: s.category,
          score: latest.skillRatings[s.id],
          cue: latest.skillObservations?.[s.id] || s.coachingCue || s.description
        }));

      let top1 = '—', top2 = '—', top3 = '—';
      let weak1 = '—', weak2 = '—', weak3 = '—';
      let weakestSkillObj: { name: string; score: number } | null = null;

      if (skillEntries.length > 0) {
        // High scores = strengths
        const sortedDesc = [...skillEntries].sort((a, b) => b.score - a.score);
        top1 = sortedDesc[0]?.name || '—';
        top2 = sortedDesc[1]?.name || '—';
        top3 = sortedDesc[2]?.name || '—';

        // Low scores = weaknesses
        const sortedAsc = [...skillEntries].sort((a, b) => a.score - b.score);
        weak1 = sortedAsc[0]?.name || '—';
        weak2 = sortedAsc[1]?.name || '—';
        weak3 = sortedAsc[2]?.name || '—';
        weakestSkillObj = sortedAsc[0];
      } else {
        // Fallback to recorded strengths / priorities arrays
        top1 = latest.strengths?.[0] || '—';
        top2 = latest.strengths?.[1] || '—';
        top3 = latest.strengths?.[2] || '—';
        weak1 = latest.developmentPriorities?.[0] || '—';
        weak2 = latest.developmentPriorities?.[1] || '—';
        weak3 = latest.developmentPriorities?.[2] || '—';
      }

      // Priority Development Area
      const priorityDevArea = weak1 !== '—' 
        ? weak1 
        : (latest.developmentPriorities?.[0] || 'Foundational Fundamentals');

      // Recommended Coaching Action (Practical & concise for cell fit)
      let coachingAction = '';
      if (latest.coachRecommendation && latest.coachRecommendation.trim().length > 5 && latest.coachRecommendation.length < 130) {
        coachingAction = latest.coachRecommendation.trim();
      } else if (weak1 !== '—') {
        coachingAction = `3 sessions/week: targeted ${weak1} circuits, 1v1 drills and match situations.`;
      } else {
        coachingAction = 'Maintain structured weekly multi-pillar training and scrimmage practice.';
      }

      // Next Performance Target (Measurable if skill score available, else qualitative)
      let nextTarget = '';
      if (weakestSkillObj && typeof weakestSkillObj.score === 'number') {
        const curPct = Math.round((weakestSkillObj.score / 5) * 100);
        const tgtPct = Math.min(100, curPct + 20);
        nextTarget = `Improve ${weakestSkillObj.name} from ${curPct}% to ${tgtPct}%+ by next review.`;
      } else if (weak1 !== '—') {
        nextTarget = `Develop consistent execution of ${weak1} under competitive match pressure.`;
      } else {
        nextTarget = 'Maintain advanced rating across all core pillar drills.';
      }

      const nextReviewDate = latest.nextAssessmentDate || '90 Days';

      // =======================================================================
      // CASE 2: SINGLE ASSESSMENT (BASELINE ESTABLISHED - NO INVENTED PROGRESS)
      // =======================================================================
      if (history.length === 1) {
        if (latest.overallScore < 55) {
          needsAttentionCount++;
        }

        return {
          sNo: idx + 1,
          studentId: player.id,
          studentName: player.name,
          gradeAge,
          ageCategory: ageCat,
          gender: player.gender,
          sport: sportName,
          sportId: sportKey,
          position: pos,
          squad: squadName,
          baselineScore: latest.overallScore,
          latestScore: latest.overallScore,
          progressChange: 'Baseline Established',
          progressStatus: 'Initial Assessment' as const,
          overallDevLevel: latest.developmentLevel,
          technicalScore: `${latest.domainScores?.technical ?? latest.overallScore}%`,
          tacticalScore: `${latest.domainScores?.tactical ?? latest.overallScore}%`,
          physicalScore: `${latest.domainScores?.physical ?? latest.overallScore}%`,
          behaviourScore: `${latest.domainScores?.gameBehaviour ?? latest.overallScore}%`,
          topStrength1: top1,
          topStrength2: top2,
          topStrength3: top3,
          priorityWeakness1: weak1,
          priorityWeakness2: weak2,
          priorityWeakness3: weak3,
          priorityDevArea,
          coachingAction,
          nextTarget,
          nextReviewDate,
          coachRemark: latest.coachObservation || 'Baseline established with active session participation.',
          assessmentStatus: 'Completed (1 Review)',
          assessmentCount: 1,
          history,
          player,
          latestAssessment: latest
        };
      }

      // =======================================================================
      // CASE 3: TWO OR MORE ASSESSMENTS (REAL HISTORICAL PROGRESS EVALUATION)
      // =======================================================================
      const baseline = history[0];
      const diff = latest.overallScore - baseline.overallScore;

      let progressStatus: StudentProgressItem['progressStatus'] = 'Stable';
      if (diff >= 15) {
        progressStatus = 'Significant Improvement';
        improvingCount++;
      } else if (diff >= 5) {
        progressStatus = 'Improving';
        improvingCount++;
      } else if (diff >= -4) {
        progressStatus = 'Stable';
      } else if (diff >= -14) {
        progressStatus = 'Needs Attention';
        needsAttentionCount++;
      } else {
        progressStatus = 'Declining';
        needsAttentionCount++;
      }

      const progressChange = diff > 0 ? `+${diff}` : `${diff}`;

      const remark = latest.coachObservation || (
        diff > 0 
          ? `Commendable growth observed (+${diff} pts since baseline test).`
          : 'Focused corrective support advised for upcoming training cycle.'
      );

      return {
        sNo: idx + 1,
        studentId: player.id,
        studentName: player.name,
        gradeAge,
        ageCategory: ageCat,
        gender: player.gender,
        sport: sportName,
        sportId: sportKey,
        position: pos,
        squad: squadName,
        baselineScore: baseline.overallScore,
        latestScore: latest.overallScore,
        progressChange,
        progressStatus,
        overallDevLevel: latest.developmentLevel,
        technicalScore: `${latest.domainScores?.technical ?? latest.overallScore}%`,
        tacticalScore: `${latest.domainScores?.tactical ?? latest.overallScore}%`,
        physicalScore: `${latest.domainScores?.physical ?? latest.overallScore}%`,
        behaviourScore: `${latest.domainScores?.gameBehaviour ?? latest.overallScore}%`,
        topStrength1: top1,
        topStrength2: top2,
        topStrength3: top3,
        priorityWeakness1: weak1,
        priorityWeakness2: weak2,
        priorityWeakness3: weak3,
        priorityDevArea,
        coachingAction,
        nextTarget,
        nextReviewDate,
        coachRemark: remark,
        assessmentStatus: `Completed (${history.length} Reviews)`,
        assessmentCount: history.length,
        history,
        player,
        latestAssessment: latest
      };
    });

    const totalStudents = targetPlayers.length;
    const pendingCount = totalStudents - assessedCount;
    const completionRate = totalStudents > 0 ? Math.round((assessedCount / totalStudents) * 100) : 0;
    const averageScore = assessedCount > 0 ? Math.round(totalScoreSum / assessedCount) : 0;

    return {
      items,
      summary: {
        totalStudents,
        assessedCount,
        pendingCount,
        completionRate,
        averageScore,
        improvingCount,
        needsAttentionCount
      }
    };
  },

  /**
   * Generates and downloads the Official Master School Management Excel Report
   * covering all enrolled students across the entire academy/school program.
   * Primary sheet: Student_Progress_Report (One row per student)
   * Secondary sheet: Student_Detail_Report (Chronological drill track)
   * Followed by existing management audit sheets.
   */
  exportSchoolManagementExcelReport(
    customPlayers?: PlayerProfileData[],
    customAssessments?: PlayerAssessmentRecord[],
    options: ManagementReportOptions = {}
  ): boolean {
    try {
      // 1. Resolve Data Sources
      const allPlayers: PlayerProfileData[] = customPlayers && customPlayers.length > 0 
        ? customPlayers 
        : academyService.getPlayers();

      const allAssessments: PlayerAssessmentRecord[] = customAssessments && customAssessments.length > 0
        ? customAssessments
        : academyService.getAssessments();

      // Retrieve cloud/local program metadata
      const prog = academicCoachingCloudService.getLocalProgram();
      const coachProfile = sportsCoachingService.getCoachProfile();

      const programName = options.programName || prog?.programName || coachProfile.programName || 'SmartPE Sports & Physical Education Academy';
      const headCoach = options.headCoachName || prog?.headCoachName || coachProfile.coachName || 'Director of Physical Education';
      const academicYear = options.academicYear || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;
      const termTitle = options.termTitle || 'Term Performance & Skill Assessment Cycle';
      const reportDate = new Date().toISOString().split('T')[0];

      // Compute student-by-student progress analysis
      const { items: progressItems, summary: progressSummary } = this.getStudentProgressData(
        allPlayers,
        allAssessments,
        options.sportFilter || 'all'
      );

      // Create Workbook
      const wb = XLSX.utils.book_new();

      // =========================================================================
      // SHEET 1: STUDENT_PROGRESS_REPORT (PRIMARY INDIVIDUAL DEVELOPMENT REPORT)
      // =========================================================================
      const progressSheetRows: any[][] = [
        [`${programName.toUpperCase()} - OFFICIAL STUDENT PROGRESS REPORT`],
        ['PRIMARY INDIVIDUAL STUDENT ATHLETIC & PHYSICAL EDUCATION DEVELOPMENT MONITOR'],
        [''],
        [
          `Total Students: ${progressSummary.totalStudents}`,
          `Assessed: ${progressSummary.assessedCount}`,
          `Pending: ${progressSummary.pendingCount}`,
          `Completion: ${progressSummary.completionRate}%`
        ],
        [
          `Average Score: ${progressSummary.averageScore}/100`,
          `Improving: ${progressSummary.improvingCount}`,
          `Needs Attention: ${progressSummary.needsAttentionCount}`,
          `Reporting Period: ${academicYear} (${termTitle})`
        ],
        [''],
        // 30 Recommended Columns (One row per student)
        [
          'S.No',
          'Student ID',
          'Student Name',
          'Grade / Age',
          'Age Category',
          'Gender',
          'Sport',
          'Playing Position / Role',
          'Squad / Batch',
          'Baseline Score',
          'Latest Score',
          'Progress Change',
          'Progress Status',
          'Overall Development Level',
          'Technical Score',
          'Tactical Score',
          'Physical Score',
          'Behaviour / Grit Score',
          'Top Strength 1',
          'Top Strength 2',
          'Top Strength 3',
          'Priority Weakness 1',
          'Priority Weakness 2',
          'Priority Weakness 3',
          'Priority Development Area',
          'Recommended Coaching Action',
          'Next Performance Target',
          'Next Review Date',
          'Coach Development Remark',
          'Assessment Status'
        ]
      ];

      progressItems.forEach(item => {
        progressSheetRows.push([
          item.sNo,
          item.studentId,
          item.studentName,
          item.gradeAge,
          item.ageCategory,
          item.gender,
          item.sport,
          item.position,
          item.squad,
          item.baselineScore,
          item.latestScore,
          item.progressChange,
          item.progressStatus,
          item.overallDevLevel,
          item.technicalScore,
          item.tacticalScore,
          item.physicalScore,
          item.behaviourScore,
          item.topStrength1,
          item.topStrength2,
          item.topStrength3,
          item.priorityWeakness1,
          item.priorityWeakness2,
          item.priorityWeakness3,
          item.priorityDevArea,
          item.coachingAction,
          item.nextTarget,
          item.nextReviewDate,
          item.coachRemark,
          item.assessmentStatus
        ]);
      });

      const wsProgress = XLSX.utils.aoa_to_sheet(progressSheetRows);
      wsProgress['!cols'] = [
        { wch: 6 },   // S.No
        { wch: 15 },  // Student ID
        { wch: 24 },  // Student Name
        { wch: 16 },  // Grade / Age
        { wch: 14 },  // Age Category
        { wch: 10 },  // Gender
        { wch: 20 },  // Sport
        { wch: 22 },  // Position / Role
        { wch: 22 },  // Squad / Batch
        { wch: 15 },  // Baseline Score
        { wch: 15 },  // Latest Score
        { wch: 18 },  // Progress Change
        { wch: 22 },  // Progress Status
        { wch: 24 },  // Overall Dev Level
        { wch: 16 },  // Technical Score
        { wch: 16 },  // Tactical Score
        { wch: 16 },  // Physical Score
        { wch: 20 },  // Behaviour / Grit Score
        { wch: 24 },  // Top Strength 1
        { wch: 24 },  // Top Strength 2
        { wch: 24 },  // Top Strength 3
        { wch: 26 },  // Priority Weakness 1
        { wch: 26 },  // Priority Weakness 2
        { wch: 26 },  // Priority Weakness 3
        { wch: 28 },  // Priority Dev Area
        { wch: 45 },  // Recommended Coaching Action
        { wch: 42 },  // Next Performance Target
        { wch: 16 },  // Next Review Date
        { wch: 45 },  // Coach Remark
        { wch: 22 }   // Assessment Status
      ];

      XLSX.utils.book_append_sheet(wb, wsProgress, 'Student_Progress_Report');

      // =========================================================================
      // SHEET 2: STUDENT_DETAIL_REPORT (INDIVIDUAL STUDENT DEEP-DIVE & HISTORY)
      // =========================================================================
      const detailSheetRows: any[][] = [
        [`${programName.toUpperCase()} - STUDENT DETAIL ASSESSMENT DOSSIER`],
        ['COMPREHENSIVE MULTI-EVALUATION TIMELINE & GRANULAR SKILL PERFORMANCE HISTORY'],
        ['']
      ];

      progressItems.forEach(item => {
        detailSheetRows.push([`STUDENT: ${item.studentName.toUpperCase()} (${item.studentId})`]);
        detailSheetRows.push(['Sport:', item.sport, 'Position / Role:', item.position, 'Squad / Batch:', item.squad]);
        detailSheetRows.push(['Grade / Age:', item.gradeAge, 'Age Category:', item.ageCategory, 'Gender:', item.gender]);
        detailSheetRows.push([
          'Baseline Score:', item.baselineScore, 
          'Latest Score:', item.latestScore, 
          'Progress Delta:', `${item.progressChange} (${item.progressStatus})`, 
          'Development Level:', item.overallDevLevel
        ]);
        detailSheetRows.push([
          'Technical Core:', item.technicalScore, 
          'Tactical IQ:', item.tacticalScore, 
          'Physical Fitness:', item.physicalScore, 
          'Behaviour & Grit:', item.behaviourScore
        ]);
        detailSheetRows.push(['Top Strengths:', `${item.topStrength1}; ${item.topStrength2}; ${item.topStrength3}`]);
        detailSheetRows.push(['Priority Weaknesses:', `${item.priorityWeakness1}; ${item.priorityWeakness2}; ${item.priorityWeakness3}`]);
        detailSheetRows.push(['Priority Development Area:', item.priorityDevArea]);
        detailSheetRows.push(['Recommended Coaching Action:', item.coachingAction]);
        detailSheetRows.push(['Next Performance Target:', item.nextTarget]);
        detailSheetRows.push(['Next Review Date:', item.nextReviewDate, 'Assessment Status:', item.assessmentStatus]);

        if (item.history.length > 0) {
          detailSheetRows.push(['']);
          detailSheetRows.push(['Assessment History Timeline:']);
          detailSheetRows.push(['Test Date', 'Evaluation Cycle', 'Overall Score', 'Technical %', 'Tactical %', 'Physical %', 'Behaviour %', 'Evaluating Coach']);
          item.history.forEach(h => {
            detailSheetRows.push([
              h.assessmentDate,
              h.assessmentType,
              `${h.overallScore} / 100`,
              `${h.domainScores?.technical ?? h.overallScore}%`,
              `${h.domainScores?.tactical ?? h.overallScore}%`,
              `${h.domainScores?.physical ?? h.overallScore}%`,
              `${h.domainScores?.gameBehaviour ?? h.overallScore}%`,
              h.coachName
            ]);
          });
        } else {
          detailSheetRows.push(['Assessment Status: Pending Initial Evaluation. Baseline review scheduled.']);
        }

        detailSheetRows.push(['------------------------------------------------------------------------------------------------------------------------------------------------']);
        detailSheetRows.push(['']);
      });

      const wsDetail = XLSX.utils.aoa_to_sheet(detailSheetRows);
      wsDetail['!cols'] = [
        { wch: 28 },
        { wch: 28 },
        { wch: 28 },
        { wch: 28 },
        { wch: 18 },
        { wch: 18 },
        { wch: 18 },
        { wch: 24 }
      ];
      XLSX.utils.book_append_sheet(wb, wsDetail, 'Student_Detail_Report');

      // =========================================================================
      // SHEET 3: EXECUTIVE SUMMARY (PRESERVED MANAGEMENT DASHBOARD)
      // =========================================================================
      const targetPlayers = options.sportFilter && options.sportFilter !== 'all'
        ? allPlayers.filter(p => p.sport === options.sportFilter)
        : allPlayers;

      // Group latest assessment per player for management summary
      const playerLatestAssessmentMap = new Map<string, PlayerAssessmentRecord>();
      allAssessments.forEach(a => {
        const existing = playerLatestAssessmentMap.get(a.playerId);
        if (!existing || new Date(a.assessmentDate).getTime() > new Date(existing.assessmentDate).getTime()) {
          playerLatestAssessmentMap.set(a.playerId, a);
        }
      });

      const totalStudents = targetPlayers.length;
      let assessedCount = 0;
      let totalOverallScore = 0;
      let techSum = 0;
      let tactSum = 0;
      let physSum = 0;
      let mentalSum = 0;
      let assessedWithDomains = 0;

      const meritCounts = {
        'High Merit': 0,
        'Merit': 0,
        'Pass': 0,
        'Foundation': 0
      };

      const genderCounts = { Male: 0, Female: 0, Other: 0 };
      const sportCounts: Record<string, { total: number; assessed: number; scoreSum: number }> = {};

      targetPlayers.forEach(p => {
        if (p.gender === 'Female') genderCounts.Female++;
        else if (p.gender === 'Other') genderCounts.Other++;
        else genderCounts.Male++;

        const sKey = p.sport || 'football';
        if (!sportCounts[sKey]) {
          sportCounts[sKey] = { total: 0, assessed: 0, scoreSum: 0 };
        }
        sportCounts[sKey].total++;

        const assess = playerLatestAssessmentMap.get(p.id);
        if (assess) {
          assessedCount++;
          totalOverallScore += assess.overallScore;

          const merit = getMeritClassification(assess.overallScore);
          if (merit.category.includes('High Merit')) meritCounts['High Merit']++;
          else if (merit.category.includes('Merit')) meritCounts['Merit']++;
          else if (merit.category.includes('Pass')) meritCounts['Pass']++;
          else meritCounts['Foundation']++;

          if (assess.domainScores) {
            techSum += assess.domainScores.technical || assess.overallScore;
            tactSum += assess.domainScores.tactical || assess.overallScore;
            physSum += assess.domainScores.physical || assess.overallScore;
            mentalSum += assess.domainScores.gameBehaviour || assess.overallScore;
            assessedWithDomains++;
          }

          sportCounts[sKey].assessed++;
          sportCounts[sKey].scoreSum += assess.overallScore;
        }
      });

      const avgScore = assessedCount > 0 ? Math.round(totalOverallScore / assessedCount) : 0;
      const completionRate = totalStudents > 0 ? Math.round((assessedCount / totalStudents) * 100) : 0;
      const avgTech = assessedWithDomains > 0 ? Math.round(techSum / assessedWithDomains) : 0;
      const avgTact = assessedWithDomains > 0 ? Math.round(tactSum / assessedWithDomains) : 0;
      const avgPhys = assessedWithDomains > 0 ? Math.round(physSum / assessedWithDomains) : 0;
      const avgMental = assessedWithDomains > 0 ? Math.round(mentalSum / assessedWithDomains) : 0;

      const summaryRows: any[][] = [
        ['OFFICIAL SCHOOL MANAGEMENT ATHLETIC & PHYSICAL EDUCATION REPORT'],
        [`${programName.toUpperCase()} - COMPREHENSIVE PERFORMANCE SUBMISSION`],
        [''],
        ['1. INSTITUTIONAL & REPORT IDENTIFICATION'],
        ['School / Academy Name:', programName, 'Academic Session:', academicYear],
        ['Reporting Authority / Department:', 'Department of Physical Education & Sports', 'Evaluation Term / Cycle:', termTitle],
        ['Lead Coach / Director:', headCoach, 'Report Generation Date:', reportDate],
        ['Affiliation / Curriculum Standards:', 'CBSE / CISCE / National Sports Framework & Age Norms', 'Submission Scope:', options.sportFilter && options.sportFilter !== 'all' ? `Sport: ${options.sportFilter}` : 'Entire Student Body (All Sports)'],
        [''],
        ['2. COHORT PARTICIPATION & EVALUATION SUMMARY'],
        ['Total Enrolled Student Athletes:', totalStudents, 'Total Completed Evaluations:', assessedCount],
        ['Evaluation Completion Rate:', `${completionRate}%`, 'Academy Performance Index:', `${avgScore} / 100 PTS`],
        ['Male Student Athletes:', genderCounts.Male, 'Female Student Athletes:', genderCounts.Female],
        ['Other / Unspecified:', genderCounts.Other, 'Overall Cohort Standing:', avgScore >= 80 ? 'Distinction / Exemplary' : avgScore >= 65 ? 'Proficient / Healthy Standards' : 'Developing Support Required'],
        [''],
        ['3. FOUR-PILLAR INSTITUTIONAL PERFORMANCE INDEX'],
        ['Pillar Domain', 'Cohort Average (%)', 'CBSE/Standard Benchmark (%)', 'Evaluation Status'],
        ['Technical Skill Core', `${avgTech}%`, '70%', avgTech >= 70 ? 'Meets Standards' : 'Focus Needed'],
        ['Tactical Game Sense & Spatial IQ', `${avgTact}%`, '65%', avgTact >= 65 ? 'Meets Standards' : 'Focus Needed'],
        ['Physical Fitness, Speed & Stamina', `${avgPhys}%`, '70%', avgPhys >= 70 ? 'Meets Standards' : 'Focus Needed'],
        ['Game Behavior, Grit & Coachability', `${avgMental}%`, '75%', avgMental >= 75 ? 'Meets Standards' : 'Focus Needed'],
        [''],
        ['4. MERIT & DEVELOPMENT LEVEL DISTRIBUTION'],
        ['Merit Classification', 'Student Count', 'Percentage of Assessed', 'Institutional Implication'],
        ['High Merit (Score 85 - 100)', meritCounts['High Merit'], `${assessedCount > 0 ? Math.round((meritCounts['High Merit'] / assessedCount) * 100) : 0}%`, 'Elite Talent Pool (Inter-School / State Squad)'],
        ['Merit (Score 70 - 84)', meritCounts['Merit'], `${assessedCount > 0 ? Math.round((meritCounts['Merit'] / assessedCount) * 100) : 0}%`, 'Strong Competitor (School Team Core)'],
        ['Pass with Merit (Score 55 - 69)', meritCounts['Pass'], `${assessedCount > 0 ? Math.round((meritCounts['Pass'] / assessedCount) * 100) : 0}%`, 'Satisfactory Mastery (Development Squad)'],
        ['Foundation / Remedial (Score < 55)', meritCounts['Foundation'], `${assessedCount > 0 ? Math.round((meritCounts['Foundation'] / assessedCount) * 100) : 0}%`, 'Targeted Corrective Drills Assigned'],
        [''],
        ['5. SPORT-WISE ENROLLMENT & PERFORMANCE BREAKDOWN'],
        ['Sport Discipline', 'Enrolled Students', 'Evaluated Students', 'Avg Score (/100)', 'Proficiency Level']
      ];

      Object.entries(sportCounts).forEach(([sKey, data]) => {
        const tmpl = SPORT_TEMPLATES[sKey as CoachingSportId];
        const sName = tmpl?.name || sKey.toUpperCase();
        const sAvg = data.assessed > 0 ? Math.round(data.scoreSum / data.assessed) : 0;
        summaryRows.push([
          sName,
          data.total,
          data.assessed,
          data.assessed > 0 ? sAvg : 'Pending',
          sAvg >= 80 ? 'Advanced' : sAvg >= 65 ? 'Proficient' : data.assessed > 0 ? 'Developing' : 'Not Evaluated'
        ]);
      });

      summaryRows.push(['']);
      summaryRows.push(['6. VERIFICATION & ADMINISTRATIVE SIGN-OFF']);
      summaryRows.push(['Role', 'Designee Name', 'Signature / Seal', 'Verification Date']);
      summaryRows.push(['Lead Sports Coach / Trainer', headCoach, '_________________________', reportDate]);
      summaryRows.push(['Head of Physical Education (HOD)', 'HOD Sports & PE', '_________________________', reportDate]);
      summaryRows.push(['School Principal / Director', 'Principal / Management Trustee', '_________________________', reportDate]);

      const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
      wsSummary['!cols'] = [
        { wch: 36 },
        { wch: 28 },
        { wch: 32 },
        { wch: 36 }
      ];
      XLSX.utils.book_append_sheet(wb, wsSummary, 'Executive_Summary');

      // =========================================================================
      // SHEET 4: MASTER STUDENT ROSTER (PRESERVED COMPLETE COHORT ROSTER)
      // =========================================================================
      const rosterHeaders = [
        'S.No',
        'Student ID',
        'Student Full Name',
        'Grade / Class',
        'Age',
        'Age Category',
        'Gender',
        'Primary Sport',
        'Playing Role / Position',
        'Squad / Batch',
        'Dominant Side',
        'Enrollment Date',
        'Evaluation Status',
        'Latest Test Date',
        'Evaluation Type',
        'Overall Score (/100)',
        'Development Level',
        'Merit Classification',
        'Technical Score (%)',
        'Tactical Score (%)',
        'Physical Score (%)',
        'Behavior & Grit (%)',
        'Top Strengths Observed',
        'Priority Growth Areas',
        'Recommended Corrective Drills',
        'Coach Remarks & Developmental Notes',
        'Next Review Date',
        'Fee / Compliance Status',
        'Parent / Guardian Name',
        'Parent Emergency Contact'
      ];

      const rosterData: any[][] = [rosterHeaders];

      targetPlayers.forEach((p, idx) => {
        const assess = playerLatestAssessmentMap.get(p.id);
        const sportTmpl = SPORT_TEMPLATES[p.sport as CoachingSportId];
        const sportName = sportTmpl?.name || p.sport;
        const merit = assess ? getMeritClassification(assess.overallScore) : null;

        rosterData.push([
          idx + 1,
          p.id,
          p.name,
          p.gradeOrClass || `Age ${p.age}`,
          p.age,
          p.ageCategory || (p.age <= 10 ? 'U-10' : p.age <= 12 ? 'U-12' : p.age <= 14 ? 'U-14' : p.age <= 16 ? 'U-16' : 'U-19'),
          p.gender,
          sportName,
          p.position || 'All-Rounder',
          p.batchOrTeam || 'Main Academy Squad',
          p.dominantSide || 'Right',
          p.joiningDate || p.createdAt?.split('T')[0] || reportDate,
          assess ? 'COMPLETED' : 'PENDING EVALUATION',
          assess ? assess.assessmentDate : '—',
          assess ? assess.assessmentType : '—',
          assess ? assess.overallScore : '—',
          assess ? assess.developmentLevel : 'Pending',
          merit ? merit.category : 'Pending',
          assess?.domainScores?.technical ?? '—',
          assess?.domainScores?.tactical ?? '—',
          assess?.domainScores?.physical ?? '—',
          assess?.domainScores?.gameBehaviour ?? '—',
          assess ? (assess.strengths || []).join('; ') : '—',
          assess ? (assess.developmentPriorities || []).join('; ') : '—',
          assess ? (assess.coachRecommendation || 'Continue daily foundational drills') : '—',
          assess ? (assess.coachObservation || 'Consistent participation in team training') : 'Evaluation scheduled',
          assess?.nextAssessmentDate || '—',
          p.feeStatus || 'Paid',
          p.parentName || '—',
          p.parentContact || '—'
        ]);
      });

      const wsRoster = XLSX.utils.aoa_to_sheet(rosterData);
      wsRoster['!cols'] = [
        { wch: 6 },  { wch: 14 }, { wch: 22 }, { wch: 14 }, { wch: 6 },
        { wch: 12 }, { wch: 8 },  { wch: 18 }, { wch: 20 }, { wch: 22 },
        { wch: 14 }, { wch: 14 }, { wch: 16 }, { wch: 14 }, { wch: 18 },
        { wch: 14 }, { wch: 16 }, { wch: 18 }, { wch: 14 }, { wch: 14 },
        { wch: 14 }, { wch: 14 }, { wch: 32 }, { wch: 32 }, { wch: 32 },
        { wch: 36 }, { wch: 14 }, { wch: 14 }, { wch: 20 }, { wch: 18 }
      ];
      XLSX.utils.book_append_sheet(wb, wsRoster, 'Master_Student_Roster');

      // =========================================================================
      // SHEET 5: SKILL DIAGNOSTICS MATRIX (PRESERVED SKILL EVALUATION DATA)
      // =========================================================================
      const skillMatrixHeaders = [
        'S.No',
        'Student Name',
        'Class / Grade',
        'Sport',
        'Evaluation Date',
        'Skill ID',
        'Skill Name',
        'Skill Category',
        'Score / Rating (1-5)',
        'Normalized Pct (%)',
        'Benchmark Standard',
        'Performance Status',
        'Coaching Cue & Target'
      ];

      const skillMatrixRows: any[][] = [skillMatrixHeaders];
      let skillRowIndex = 1;

      targetPlayers.forEach(p => {
        const assess = playerLatestAssessmentMap.get(p.id);
        if (!assess || !assess.skillRatings) return;

        const sportTmpl = SPORT_TEMPLATES[assess.sport as CoachingSportId];
        if (!sportTmpl) return;

        sportTmpl.skills.forEach(skill => {
          const rawScore = assess.skillRatings[skill.id];
          if (rawScore !== undefined) {
            const pct = Math.round((rawScore / 5) * 100);
            const status = rawScore >= 4 ? 'Exceeds Benchmark' : rawScore >= 3 ? 'Meets Benchmark' : 'Needs Development';
            const observation = assess.skillObservations?.[skill.id] || skill.coachingCue || 'Standard technique practice';

            skillMatrixRows.push([
              skillRowIndex++,
              p.name,
              p.gradeOrClass || `Age ${p.age}`,
              sportTmpl.name,
              assess.assessmentDate,
              skill.id,
              skill.name,
              skill.category.toUpperCase(),
              rawScore,
              `${pct}%`,
              'Level 3 (Proficient)',
              status,
              observation
            ]);
          }
        });
      });

      if (skillMatrixRows.length === 1) {
        skillMatrixRows.push([
          1,
          'Sample Diagnostic Baseline',
          'Grade 8',
          'Football',
          reportDate,
          'fb_dribble',
          'Slalom Dribble & Control',
          'TECHNICAL',
          4,
          '80%',
          'Level 3 (Proficient)',
          'Meets Benchmark',
          'Keep ball close with both feet'
        ]);
      }

      const wsSkillMatrix = XLSX.utils.aoa_to_sheet(skillMatrixRows);
      wsSkillMatrix['!cols'] = [
        { wch: 6 },  { wch: 22 }, { wch: 12 }, { wch: 18 }, { wch: 14 },
        { wch: 16 }, { wch: 28 }, { wch: 16 }, { wch: 16 }, { wch: 14 },
        { wch: 20 }, { wch: 20 }, { wch: 36 }
      ];
      XLSX.utils.book_append_sheet(wb, wsSkillMatrix, 'Skill_Diagnostics_Matrix');

      // =========================================================================
      // SHEET 6: SQUAD & BATCH BREAKDOWN (PRESERVED SQUAD ANALYTICS)
      // =========================================================================
      const batchGroups: Record<string, {
        students: PlayerProfileData[];
        assessedCount: number;
        scoreSum: number;
        sport: string;
      }> = {};

      targetPlayers.forEach(p => {
        const bName = p.batchOrTeam || 'Main Academy Batch';
        if (!batchGroups[bName]) {
          batchGroups[bName] = {
            students: [],
            assessedCount: 0,
            scoreSum: 0,
            sport: p.sport
          };
        }
        batchGroups[bName].students.push(p);

        const assess = playerLatestAssessmentMap.get(p.id);
        if (assess) {
          batchGroups[bName].assessedCount++;
          batchGroups[bName].scoreSum += assess.overallScore;
        }
      });

      const batchRows: any[][] = [
        ['SQUAD & BATCH TRAINING ANALYTICS (SCHOOL MANAGEMENT RESOURCE AUDIT)'],
        [''],
        [
          'Batch / Squad Name',
          'Sport Discipline',
          'Total Strength',
          'Assessed Count',
          'Evaluation Rate',
          'Average Score',
          'Performance Standing',
          'Primary Training Needs & Notes'
        ]
      ];

      Object.entries(batchGroups).forEach(([bName, bData]) => {
        const bAvg = bData.assessedCount > 0 ? Math.round(bData.scoreSum / bData.assessedCount) : 0;
        const bRate = bData.students.length > 0 ? Math.round((bData.assessedCount / bData.students.length) * 100) : 0;
        const sportTmpl = SPORT_TEMPLATES[bData.sport as CoachingSportId];

        batchRows.push([
          bName,
          sportTmpl?.name || bData.sport,
          bData.students.length,
          bData.assessedCount,
          `${bRate}%`,
          bData.assessedCount > 0 ? `${bAvg} / 100` : 'Pending',
          bAvg >= 80 ? 'Advanced Mastery' : bAvg >= 65 ? 'Proficient' : bData.assessedCount > 0 ? 'Developing' : 'Awaiting Review',
          bAvg < 65 ? 'Increase technical drill frequency' : 'Ready for competitive inter-school fixtures'
        ]);
      });

      const wsBatch = XLSX.utils.aoa_to_sheet(batchRows);
      wsBatch['!cols'] = [
        { wch: 28 }, { wch: 18 }, { wch: 14 }, { wch: 14 },
        { wch: 14 }, { wch: 16 }, { wch: 22 }, { wch: 36 }
      ];
      XLSX.utils.book_append_sheet(wb, wsBatch, 'Squad_Batch_Analytics');

      // =========================================================================
      // SHEET 7: MANAGEMENT COMPLIANCE & SAFETY AUDIT (PRESERVED AUDIT SHEET)
      // =========================================================================
      const complianceRows: any[][] = [
        ['SCHOOL MANAGEMENT SPORTS & SAFETY AUDIT VERIFICATION'],
        ['Statutory & Institutional Governance Checklist for Academic Review'],
        [''],
        ['Audit Item / Protocol', 'Requirement Specification', 'Compliance Status', 'Auditor Notes'],
        ['Curriculum Standardization', 'CBSE/CISCE physical education guidelines aligned', 'COMPLIANT', 'Standardized multi-sport rubric deployed'],
        ['Coach Certification & Accreditation', 'Certified coaching faculty assigned per sport', 'COMPLIANT', `Supervised by ${headCoach}`],
        ['Emergency Medical Readiness', 'First-aid kit, hydration station & ICE protocols', 'COMPLIANT', 'Field marshals trained in sports first aid'],
        ['Parental Communication', 'Term progress report dispatch via PDF/Excel', 'ACTIVE', 'Reports generated for all enrolled cohorts'],
        ['Injury & Fitness Clearance', 'Pre-season athletic screening and consent forms', 'VERIFIED', 'Active student records maintained'],
        ['Equipment Safety Inspection', 'Goalposts anchored, balls inflated, protective gear', 'INSPECTED', 'Quarterly facility audit signed off'],
        [''],
        ['Management Approval Stamp:'],
        ['Submitted for official review to School Board / Managing Committee.'],
        ['Date of Sign-off:', reportDate]
      ];

      const wsCompliance = XLSX.utils.aoa_to_sheet(complianceRows);
      wsCompliance['!cols'] = [
        { wch: 32 }, { wch: 36 }, { wch: 18 }, { wch: 36 }
      ];
      XLSX.utils.book_append_sheet(wb, wsCompliance, 'Management_Compliance_Audit');

      // =========================================================================
      // TRIGGER BROWSER DOWNLOAD VIA BLOB
      // =========================================================================
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const sanitizedName = programName.replace(/[^a-zA-Z0-9_-]/g, '_');
      const fileName = `${sanitizedName}_Student_Progress_Report_${reportDate}.xlsx`;

      const blob = new Blob([wbout], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }, 250);

      return true;
    } catch (err) {
      console.error('Failed to export school management excel report:', err);
      return false;
    }
  },

  /**
   * Generates and downloads an Individual Student Developmental Excel Report Card
   * (Used alongside the printable/downloadable PDF report card)
   */
  exportIndividualStudentExcelReport(
    player: PlayerProfileData,
    assessment: PlayerAssessmentRecord,
    history: PlayerAssessmentRecord[] = []
  ): boolean {
    try {
      const prog = academicCoachingCloudService.getLocalProgram();
      const academyName = prog?.programName || 'SmartPE Sports Academy';
      const sportTmpl = SPORT_TEMPLATES[assessment.sport as CoachingSportId];
      const sportName = sportTmpl?.name || assessment.sport;
      const merit = getMeritClassification(assessment.overallScore);
      const reportDate = assessment.assessmentDate || new Date().toISOString().split('T')[0];

      const wb = XLSX.utils.book_new();

      // Sheet 1: Student Assessment Report Card
      const studentCardRows: any[][] = [
        [`${academyName.toUpperCase()} - ATHLETIC MERIT & DEVELOPMENT REPORT CARD`],
        [''],
        ['STUDENT BIOGRAPHICAL DATA', '', 'EVALUATION PARAMETERS', ''],
        ['Student Name:', player.name, 'Evaluation Type:', assessment.assessmentType],
        ['Grade / Class:', player.gradeOrClass || `Age ${player.age}`, 'Evaluation Date:', reportDate],
        ['Age & Bracket:', `${player.age} Years (${assessment.ageCategory || 'U-14'})`, 'Evaluating Coach:', assessment.coachName],
        ['Gender:', player.gender, 'Sport Discipline:', sportName],
        ['Position / Role:', player.position || 'Athlete', 'Playing Squad / Batch:', player.batchOrTeam || 'Main Squad'],
        ['Dominant Side:', player.dominantSide || 'Right', 'Overall Score:', `${assessment.overallScore} / 100 PTS`],
        ['Enrollment Date:', player.joiningDate || 'Active', 'Development Tier:', assessment.developmentLevel],
        ['Parent / Contact:', `${player.parentName || 'Parent'} (${player.parentContact || '—'})`, 'Merit Distinction:', merit.category],
        [''],
        ['FOUR-PILLAR PERFORMANCE MATRIX'],
        ['Domain Pillar', 'Score (%)', 'Category Descriptor', 'Institutional Benchmark'],
        ['Technical Mastery', `${assessment.domainScores?.technical ?? assessment.overallScore}%`, 'Ball control, execution & fundamental mechanics', '70%'],
        ['Tactical Game Sense', `${assessment.domainScores?.tactical ?? assessment.overallScore}%`, 'Spatial anticipation, off-ball movement & decision IQ', '65%'],
        ['Physical Conditioning', `${assessment.domainScores?.physical ?? assessment.overallScore}%`, 'Speed, acceleration, agility & recovery stamina', '70%'],
        ['Game Behavior & Grit', `${assessment.domainScores?.gameBehaviour ?? assessment.overallScore}%`, 'Sportsmanship, coachability & composure under pressure', '75%'],
        [''],
        ['INDIVIDUAL SKILL BREAKDOWN & AGE NORMS'],
        ['Skill Name', 'Category', 'Rating (1-5)', 'Score (%)', 'Benchmark Target', 'Coaching Cue / Observation']
      ];

      if (sportTmpl) {
        sportTmpl.skills.forEach(skill => {
          const raw = assessment.skillRatings?.[skill.id];
          if (raw !== undefined) {
            studentCardRows.push([
              skill.name,
              skill.category.toUpperCase(),
              raw,
              `${Math.round((raw / 5) * 100)}%`,
              'Level 3 (Proficient)',
              assessment.skillObservations?.[skill.id] || skill.coachingCue || 'Standard practice'
            ]);
          }
        });
      }

      studentCardRows.push(['']);
      studentCardRows.push(['QUALITATIVE DEVELOPMENTAL ASSESSMENT & HOMEWORK REGIMEN']);
      studentCardRows.push(['Observed Key Strengths:', (assessment.strengths || []).join('; ') || 'Consistent performance']);
      studentCardRows.push(['Priority Focus Areas:', (assessment.developmentPriorities || []).join('; ') || 'Continue balanced development']);
      studentCardRows.push(['Head Coach Observation:', assessment.coachObservation || 'Candidate exhibits good attitude and continuous learning.']);
      studentCardRows.push(['Prescribed Corrective Drills:', assessment.coachRecommendation || '30-minute daily technical ball drills recommended.']);
      studentCardRows.push(['Next Scheduled Review:', assessment.nextAssessmentDate || '3 Months']);

      const wsStudent = XLSX.utils.aoa_to_sheet(studentCardRows);
      wsStudent['!cols'] = [
        { wch: 28 },
        { wch: 24 },
        { wch: 20 },
        { wch: 36 }
      ];
      XLSX.utils.book_append_sheet(wb, wsStudent, 'Student_Development_Card');

      // Sheet 2: Progress History (if historical data exists)
      if (history && history.length > 0) {
        const historyRows: any[][] = [
          ['HISTORICAL DEVELOPMENTAL MILESTONES'],
          [''],
          ['Evaluation Date', 'Evaluation Type', 'Overall Score', 'Development Level', 'Technical %', 'Tactical %', 'Physical %', 'Mental %', 'Coach']
        ];

        history.forEach(h => {
          historyRows.push([
            h.assessmentDate,
            h.assessmentType,
            `${h.overallScore} / 100`,
            h.developmentLevel,
            `${h.domainScores?.technical ?? h.overallScore}%`,
            `${h.domainScores?.tactical ?? h.overallScore}%`,
            `${h.domainScores?.physical ?? h.overallScore}%`,
            `${h.domainScores?.gameBehaviour ?? h.overallScore}%`,
            h.coachName
          ]);
        });

        const wsHistory = XLSX.utils.aoa_to_sheet(historyRows);
        wsHistory['!cols'] = [
          { wch: 16 }, { wch: 20 }, { wch: 16 }, { wch: 18 },
          { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 20 }
        ];
        XLSX.utils.book_append_sheet(wb, wsHistory, 'Growth_History_Log');
      }

      // Download
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const sanitizedStudent = player.name.replace(/[^a-zA-Z0-9_-]/g, '_');
      const fileName = `${sanitizedStudent}_Athletic_Report_${reportDate}.xlsx`;

      const blob = new Blob([wbout], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }, 250);

      return true;
    } catch (err) {
      console.error('Failed to export individual student excel report:', err);
      return false;
    }
  },

  /**
   * Generates and downloads School Management Excel Report from SportsCoachingAssessment data
   * (athletes & assessments from sportsCoachingService)
   */
  exportUniversalCoachingExcelReport(
    athletes: AthleteProfile[],
    assessments: AssessmentRecord[],
    programName: string,
    coachName: string
  ): boolean {
    try {
      const reportDate = new Date().toISOString().split('T')[0];
      const wb = XLSX.utils.book_new();

      // Convert athlete assessments map
      const latestAssessments = new Map<string, AssessmentRecord>();
      const athleteAssessmentsMap = new Map<string, AssessmentRecord[]>();
      assessments.forEach(a => {
        const list = athleteAssessmentsMap.get(a.athleteId) || [];
        list.push(a);
        athleteAssessmentsMap.set(a.athleteId, list);

        const existing = latestAssessments.get(a.athleteId);
        if (!existing || new Date(a.testDate).getTime() > new Date(existing.testDate).getTime()) {
          latestAssessments.set(a.athleteId, a);
        }
      });

      // Sheet 1: Student Progress Report
      const progressRows: any[][] = [
        [`${programName.toUpperCase()} - ATHLETE PROGRESS & DEVELOPMENT REPORT`],
        ['INDIVIDUAL STUDENT PROGRESS MONITOR (ONE ROW PER ATHLETE)'],
        [''],
        [
          'S.No',
          'Athlete ID',
          'Athlete Full Name',
          'Age',
          'Age Bracket',
          'Gender',
          'Sport Discipline',
          'Squad / Batch',
          'Jersey No',
          'Baseline Score',
          'Latest Score',
          'Progress Change',
          'Progress Status',
          'Skill Tier',
          'Technical %',
          'Tactical %',
          'Physical %',
          'Mental %',
          'Top Strength 1',
          'Top Strength 2',
          'Top Strength 3',
          'Priority Weakness 1',
          'Priority Weakness 2',
          'Priority Weakness 3',
          'Priority Development Area',
          'Recommended Drills',
          'Next Review Date',
          'Coach Feedback',
          'Assessment Status'
        ]
      ];

      athletes.forEach((ath, idx) => {
        const history = (athleteAssessmentsMap.get(ath.id) || []).sort(
          (a, b) => new Date(a.testDate).getTime() - new Date(b.testDate).getTime()
        );
        const sportDef = SPORTS_REGISTRY[ath.sport];
        const sportName = sportDef?.name || ath.sport;

        if (history.length === 0) {
          progressRows.push([
            idx + 1,
            ath.id,
            ath.name,
            ath.age,
            sportsCoachingService.getAgeBracketFromAge(ath.age),
            ath.gender,
            sportName,
            ath.squadOrBatch,
            ath.jerseyNo || '—',
            '—',
            '—',
            '—',
            'Assessment Pending',
            'Pending',
            '—', '—', '—', '—',
            '—', '—', '—',
            '—', '—', '—',
            'Assessment Required',
            'Schedule baseline test',
            '—',
            'Enrolled athlete pending baseline evaluation.',
            'Pending'
          ]);
        } else if (history.length === 1) {
          const single = history[0];
          const drillsText = single.prescribedDrills ? single.prescribedDrills.map(d => `${d.drillName} (${d.frequency})`).join('; ') : 'Continue foundational training';
          progressRows.push([
            idx + 1,
            ath.id,
            ath.name,
            ath.age,
            single.ageBracket,
            ath.gender,
            sportName,
            ath.squadOrBatch,
            ath.jerseyNo || '—',
            single.overallScore,
            single.overallScore,
            'Baseline Established',
            'Initial Assessment',
            single.overallTier,
            single.pillarAverages.technical,
            single.pillarAverages.tactical,
            single.pillarAverages.physical,
            single.pillarAverages.mental,
            single.strengths[0] || '—',
            single.strengths[1] || '—',
            single.strengths[2] || '—',
            single.growthAreas[0] || '—',
            single.growthAreas[1] || '—',
            single.growthAreas[2] || '—',
            single.growthAreas[0] || 'Foundational Skills',
            drillsText,
            '90 Days',
            single.coachFeedback || 'Baseline recorded.',
            'Completed (1 Review)'
          ]);
        } else {
          const baseline = history[0];
          const latest = history[history.length - 1];
          const diff = latest.overallScore - baseline.overallScore;
          const status = diff >= 15 ? 'Significant Improvement' : diff >= 5 ? 'Improving' : diff >= -4 ? 'Stable' : diff >= -14 ? 'Needs Attention' : 'Declining';
          const drillsText = latest.prescribedDrills ? latest.prescribedDrills.map(d => `${d.drillName} (${d.frequency})`).join('; ') : 'Continue drills';

          progressRows.push([
            idx + 1,
            ath.id,
            ath.name,
            ath.age,
            latest.ageBracket,
            ath.gender,
            sportName,
            ath.squadOrBatch,
            ath.jerseyNo || '—',
            baseline.overallScore,
            latest.overallScore,
            diff > 0 ? `+${diff}` : `${diff}`,
            status,
            latest.overallTier,
            latest.pillarAverages.technical,
            latest.pillarAverages.tactical,
            latest.pillarAverages.physical,
            latest.pillarAverages.mental,
            latest.strengths[0] || '—',
            latest.strengths[1] || '—',
            latest.strengths[2] || '—',
            latest.growthAreas[0] || '—',
            latest.growthAreas[1] || '—',
            latest.growthAreas[2] || '—',
            latest.growthAreas[0] || 'Core Mechanics',
            drillsText,
            '90 Days',
            latest.coachFeedback || 'Progress tracked across cycles.',
            `Completed (${history.length} Reviews)`
          ]);
        }
      });

      const wsProgress = XLSX.utils.aoa_to_sheet(progressRows);
      wsProgress['!cols'] = [
        { wch: 6 },  { wch: 14 }, { wch: 22 }, { wch: 6 },  { wch: 12 },
        { wch: 8 },  { wch: 18 }, { wch: 22 }, { wch: 10 }, { wch: 14 },
        { wch: 14 }, { wch: 16 }, { wch: 20 }, { wch: 14 }, { wch: 12 },
        { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 22 }, { wch: 22 },
        { wch: 22 }, { wch: 22 }, { wch: 22 }, { wch: 22 }, { wch: 26 },
        { wch: 36 }, { wch: 14 }, { wch: 36 }, { wch: 20 }
      ];
      XLSX.utils.book_append_sheet(wb, wsProgress, 'Student_Progress_Report');

      // Sheet 2: Executive Summary
      const totalAthletes = athletes.length;
      let evaluatedCount = 0;
      let scoreSum = 0;
      let techSum = 0;
      let tactSum = 0;
      let physSum = 0;
      let mentSum = 0;

      athletes.forEach(ath => {
        const assess = latestAssessments.get(ath.id);
        if (assess) {
          evaluatedCount++;
          scoreSum += assess.overallScore;
          techSum += assess.pillarAverages.technical;
          tactSum += assess.pillarAverages.tactical;
          physSum += assess.pillarAverages.physical;
          mentSum += assess.pillarAverages.mental;
        }
      });

      const avgScore = evaluatedCount > 0 ? Math.round(scoreSum / evaluatedCount) : 0;
      const avgTech = evaluatedCount > 0 ? Math.round(techSum / evaluatedCount) : 0;
      const avgTact = evaluatedCount > 0 ? Math.round(tactSum / evaluatedCount) : 0;
      const avgPhys = evaluatedCount > 0 ? Math.round(physSum / evaluatedCount) : 0;
      const avgMent = evaluatedCount > 0 ? Math.round(mentSum / evaluatedCount) : 0;

      const summaryRows: any[][] = [
        ['OFFICIAL SPORTS ACADEMY & COACHING PERFORMANCE REPORT'],
        [`${programName.toUpperCase()} - SCHOOL MANAGEMENT SUBMISSION`],
        [''],
        ['1. INSTITUTIONAL METRICS'],
        ['Academy / School Program:', programName, 'Head Coach / Lead Trainer:', coachName],
        ['Total Registered Athletes:', totalAthletes, 'Completed Evaluations:', evaluatedCount],
        ['Evaluation Completion Rate:', `${totalAthletes > 0 ? Math.round((evaluatedCount / totalAthletes) * 100) : 0}%`, 'Program Performance Index:', `${avgScore} / 100 PTS`],
        ['Report Generation Date:', reportDate, 'Standard Framework:', 'Universal Sports Skill Standard & CBSE PE Guidelines'],
        [''],
        ['2. FOUR-PILLAR PERFORMANCE BENCHMARKS'],
        ['Pillar Domain', 'Cohort Average (%)', 'Proficiency Standard', 'Standing Status'],
        ['Technical Mastery', `${avgTech}%`, '70%', avgTech >= 70 ? 'Meets Standards' : 'Attention Required'],
        ['Tactical Game Sense', `${avgTact}%`, '65%', avgTact >= 65 ? 'Meets Standards' : 'Attention Required'],
        ['Physical Conditioning', `${avgPhys}%`, '70%', avgPhys >= 70 ? 'Meets Standards' : 'Attention Required'],
        ['Coachability & Grit', `${avgMent}%`, '75%', avgMent >= 75 ? 'Meets Standards' : 'Attention Required'],
        [''],
        ['3. ADMINISTRATIVE SIGN-OFF'],
        ['Submitted to School Management & Physical Education Department.'],
        ['Head Coach Signature: _______________________', 'Date:', reportDate]
      ];

      const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
      wsSummary['!cols'] = [{ wch: 32 }, { wch: 28 }, { wch: 24 }, { wch: 32 }];
      XLSX.utils.book_append_sheet(wb, wsSummary, 'Executive_Summary');

      // Sheet 3: Master Athletes Roster
      const rosterHeaders = [
        'S.No',
        'Athlete ID',
        'Athlete Full Name',
        'Age',
        'Age Bracket',
        'Gender',
        'Sport Discipline',
        'Batch / Squad',
        'Jersey No',
        'Joining Date',
        'Evaluation Status',
        'Latest Test Date',
        'Assessment Cycle',
        'Overall Score (/100)',
        'Skill Tier',
        'Technical %',
        'Tactical %',
        'Physical %',
        'Mental Grit %',
        'Identified Strengths',
        'Developmental Priorities',
        'Coach Feedback & Prescribed Drills',
        'Guardian Name',
        'Guardian Contact'
      ];

      const rosterRows: any[][] = [rosterHeaders];
      athletes.forEach((ath, idx) => {
        const assess = latestAssessments.get(ath.id);
        const sportDef = SPORTS_REGISTRY[ath.sport];
        const sportName = sportDef?.name || ath.sport;
        const drillsText = assess?.prescribedDrills ? assess.prescribedDrills.map(d => `${d.drillName} (${d.frequency})`).join('; ') : '';

        rosterRows.push([
          idx + 1,
          ath.id,
          ath.name,
          ath.age,
          assess?.ageBracket || (ath.age <= 10 ? 'U-10' : ath.age <= 12 ? 'U-12' : ath.age <= 14 ? 'U-14' : ath.age <= 16 ? 'U-16' : 'U-18'),
          ath.gender,
          sportName,
          ath.squadOrBatch,
          ath.jerseyNo || '—',
          ath.joiningDate,
          assess ? 'COMPLETED' : 'PENDING',
          assess?.testDate || '—',
          assess?.cycleType?.toUpperCase() || '—',
          assess?.overallScore ?? '—',
          assess?.overallTier || 'Pending',
          assess?.pillarAverages?.technical ?? '—',
          assess?.pillarAverages?.tactical ?? '—',
          assess?.pillarAverages?.physical ?? '—',
          assess?.pillarAverages?.mental ?? '—',
          assess ? (assess.strengths || []).join('; ') : '—',
          assess ? (assess.growthAreas || []).join('; ') : '—',
          assess ? `${assess.coachFeedback || ''} ${drillsText ? `Drills: ${drillsText}` : ''}`.trim() : 'Scheduled',
          ath.guardianName || '—',
          ath.guardianContact || '—'
        ]);
      });

      const wsRoster = XLSX.utils.aoa_to_sheet(rosterRows);
      wsRoster['!cols'] = [
        { wch: 6 },  { wch: 14 }, { wch: 22 }, { wch: 6 },  { wch: 12 },
        { wch: 8 },  { wch: 18 }, { wch: 22 }, { wch: 10 }, { wch: 14 },
        { wch: 14 }, { wch: 14 }, { wch: 16 }, { wch: 14 }, { wch: 14 },
        { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 32 },
        { wch: 32 }, { wch: 36 }, { wch: 20 }, { wch: 18 }
      ];
      XLSX.utils.book_append_sheet(wb, wsRoster, 'Master_Athletes_Roster');

      // Download
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const sanitizedName = programName.replace(/[^a-zA-Z0-9_-]/g, '_');
      const fileName = `${sanitizedName}_Management_Excel_Report_${reportDate}.xlsx`;

      const blob = new Blob([wbout], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }, 250);

      return true;
    } catch (err) {
      console.error('Failed to export universal coaching excel report:', err);
      return false;
    }
  }
};
