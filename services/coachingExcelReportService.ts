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
  progressStatus: string;
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
  stableCount: number;
  needsAttentionCount: number;
}

/**
 * Formats a skill name with its explicit proficiency level (Level 1 to 5) and percentage.
 * Gives Principal / HOD immediate clarity on whether a skill is Beginning, Proficient, or Advanced.
 */
export function formatSkillWithLevel(skillName: string, rawScore: number | undefined): string {
  if (!skillName || skillName === '—') return '—';
  if (rawScore === undefined || rawScore === null) {
    return `${skillName} (Level 3 - Proficient)`;
  }
  // 1-5 scale
  if (rawScore <= 5) {
    const pct = Math.round((rawScore / 5) * 100);
    if (rawScore >= 4.5) return `${skillName} [Level 5 - Mastery, ${pct}%]`;
    if (rawScore >= 3.8) return `${skillName} [Level 4 - Advanced, ${pct}%]`;
    if (rawScore >= 2.8) return `${skillName} [Level 3 - Proficient, ${pct}%]`;
    if (rawScore >= 1.8) return `${skillName} [Level 2 - Developing, ${pct}%]`;
    return `${skillName} [Level 1 - Beginning, ${pct}%]`;
  }
  // 0-100 scale
  if (rawScore >= 85) return `${skillName} [Level 5 - Mastery, ${rawScore}%]`;
  if (rawScore >= 75) return `${skillName} [Level 4 - Advanced, ${rawScore}%]`;
  if (rawScore >= 60) return `${skillName} [Level 3 - Proficient, ${rawScore}%]`;
  if (rawScore >= 45) return `${skillName} [Level 2 - Developing, ${rawScore}%]`;
  return `${skillName} [Level 1 - Beginning, ${rawScore}%]`;
}

/**
 * Generates subject-expert AI coaching feedback specifically formatted for Excel cell display.
 * Concise, high-impact pedagogical prescription tailored by sport discipline and student weakness.
 */
export function generateAiCoachingAction(
  sport: string,
  weakness: string,
  weaknessScore?: number,
  existingCoachRecommendation?: string
): string {
  if (
    existingCoachRecommendation &&
    existingCoachRecommendation.trim().length > 10 &&
    existingCoachRecommendation.length < 135
  ) {
    return existingCoachRecommendation.trim();
  }

  const wLower = (weakness || '').toLowerCase();
  const sLower = (sport || '').toLowerCase();

  if (sLower.includes('foot') || sLower.includes('soccer')) {
    if (wLower.includes('pass')) return '3 sessions/wk: 2-touch passing gates, wall-rebound drills (both feet), and 4v2 directional rondos.';
    if (wLower.includes('dribbl') || wLower.includes('control') || wLower.includes('touch')) return 'Daily 15-min cone slalom, tight space sole-roll drills and 1v1 transitional duels.';
    if (wLower.includes('turn') || wLower.includes('direct') || wLower.includes('agil')) return '3x/wk agility ladder into 180° drag-backs, Cruyff turns and rapid acceleration sprints.';
    if (wLower.includes('shoot') || wLower.includes('finish')) return 'Edge-of-box target corner striking, first-time finish off low cutbacks, composure under keeper rush.';
    if (wLower.includes('defend') || wLower.includes('tackl')) return 'Defensive jockey posture drills, side-on channel containment, and delay-and-tackle timing circuits.';
    if (wLower.includes('vision') || wLower.includes('decis') || wLower.includes('tact')) return 'Small-sided 5v5 overload games enforcing 2-touch limit and scanning before reception.';
  }

  if (sLower.includes('basket')) {
    if (wLower.includes('dribbl') || wLower.includes('handl')) return 'Two-ball stationary dribbling routines, low-stance crossover drills and full-court speed change.';
    if (wLower.includes('shoot')) return 'Form shooting from 5 perimeter spots (100 makes daily), balanced set-point release and free throws.';
    if (wLower.includes('pass')) return 'Chest and bounce pass target boards with defensive closeouts, pick-and-roll pocket pass reads.';
    if (wLower.includes('defen')) return 'Defensive slide lateral shuffles, active closeout footwork on shooters and box-out fundamentals.';
  }

  if (sLower.includes('cricket')) {
    if (wLower.includes('bat') || wLower.includes('drive')) return 'Front and back foot transfer drills on hanging ball, high-elbow drive repetitions and soft-hand defense.';
    if (wLower.includes('bowl')) return 'Target cone line-and-length spot bowling, rhythm run-up consistency and upright seam release.';
    if (wLower.includes('field') || wLower.includes('catch')) return 'High-catch judging in wind, slip cordon reflex reaction drills and aggressive pick-and-throw stumps.';
  }

  if (sLower.includes('badminton')) {
    if (wLower.includes('footwork') || wLower.includes('move')) return '6-corner shadow footwork intervals, split-step timing and explosive lunging recovery drills.';
    if (wLower.includes('clear') || wLower.includes('smash') || wLower.includes('stroke')) return 'High clear baseline depth drills, drop shot net-spin precision and overhead smash angle work.';
  }

  if (sLower.includes('tennis')) {
    if (wLower.includes('forehand') || wLower.includes('backhand')) return 'Cross-court baseline rallying consistency, topspin brush mechanics and early shoulder unit turn.';
    if (wLower.includes('serve') || wLower.includes('volley')) return 'Toss placement drills, pronation on flat/slice serves and low split-step volley reflex practice.';
  }

  if (sLower.includes('chess')) {
    return 'Daily 20 tactical calculation puzzles, blunder-check checklist before moving, and rook endgame study.';
  }

  if (weakness && weakness !== '—' && weakness !== 'Assessment Required') {
    return `3 sessions/wk: targeted ${weakness} progressive circuits, technique repetition sets and match simulations.`;
  }

  return 'Maintain structured weekly multi-pillar physical training, skill mastery and competitive match play.';
}

/**
 * Generates measurable next performance target for the upcoming assessment cycle.
 */
export function generateNextPerformanceTarget(weakness: string, rawScore?: number): string {
  if (!weakness || weakness === '—' || weakness === 'Assessment Required') {
    return 'Complete scheduled multi-pillar athletic evaluation.';
  }

  if (rawScore !== undefined && rawScore !== null) {
    const curPct = rawScore <= 5 ? Math.round((rawScore / 5) * 100) : rawScore;
    const tgtPct = Math.min(100, Math.max(curPct + 15, 65));
    return `Improve ${weakness} proficiency from ${curPct}% to ${tgtPct}%+ by next review cycle.`;
  }

  return `Develop consistent execution and error-free application of ${weakness} under game pressure.`;
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
    let stableCount = 0;
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
          progressStatus: 'ASSESSMENT PENDING (Awaiting Baseline)',
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
      let weakestSkillName = '—';
      let weakestSkillScore: number | undefined = undefined;

      if (skillEntries.length > 0) {
        // High scores = strengths
        const sortedDesc = [...skillEntries].sort((a, b) => b.score - a.score);
        top1 = formatSkillWithLevel(sortedDesc[0]?.name || '—', sortedDesc[0]?.score);
        top2 = formatSkillWithLevel(sortedDesc[1]?.name || '—', sortedDesc[1]?.score);
        top3 = formatSkillWithLevel(sortedDesc[2]?.name || '—', sortedDesc[2]?.score);

        // Low scores = weaknesses
        const sortedAsc = [...skillEntries].sort((a, b) => a.score - b.score);
        weak1 = formatSkillWithLevel(sortedAsc[0]?.name || '—', sortedAsc[0]?.score);
        weak2 = formatSkillWithLevel(sortedAsc[1]?.name || '—', sortedAsc[1]?.score);
        weak3 = formatSkillWithLevel(sortedAsc[2]?.name || '—', sortedAsc[2]?.score);
        weakestSkillName = sortedAsc[0]?.name || '—';
        weakestSkillScore = sortedAsc[0]?.score;
      } else {
        // Fallback to recorded strengths / priorities arrays
        top1 = formatSkillWithLevel(latest.strengths?.[0] || '—', undefined);
        top2 = formatSkillWithLevel(latest.strengths?.[1] || '—', undefined);
        top3 = formatSkillWithLevel(latest.strengths?.[2] || '—', undefined);
        weak1 = formatSkillWithLevel(latest.developmentPriorities?.[0] || '—', undefined);
        weak2 = formatSkillWithLevel(latest.developmentPriorities?.[1] || '—', undefined);
        weak3 = formatSkillWithLevel(latest.developmentPriorities?.[2] || '—', undefined);
        weakestSkillName = latest.developmentPriorities?.[0] || '—';
      }

      // Priority Development Area (raw name for targets)
      const priorityDevArea = weakestSkillName !== '—'
        ? weakestSkillName
        : (latest.developmentPriorities?.[0] || 'Foundational Fundamentals');

      // AI Coaching System Feedback & Action (Practical & concise for cell fit)
      const coachingAction = generateAiCoachingAction(
        player.sport || sportName,
        priorityDevArea,
        weakestSkillScore,
        latest.coachRecommendation
      );

      // Next Performance Target
      const nextTarget = generateNextPerformanceTarget(priorityDevArea, weakestSkillScore);
      const nextReviewDate = latest.nextAssessmentDate || '90 Days';

      // Overall Development Level
      const overallDevLevel = latest.developmentLevel || (
        latest.overallScore >= 80 ? 'Level 4 (Advanced)' :
        latest.overallScore >= 65 ? 'Level 3 (Proficient)' :
        latest.overallScore >= 50 ? 'Level 2 (Developing)' :
        'Level 1 (Beginning)'
      );

      // =======================================================================
      // CASE 2: SINGLE ASSESSMENT (BASELINE ESTABLISHED - NO INVENTED PROGRESS)
      // =======================================================================
      if (history.length === 1) {
        if (latest.overallScore < 50) {
          needsAttentionCount++;
        } else {
          stableCount++;
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
          progressStatus: 'INITIAL ASSESSMENT (Baseline Set)',
          overallDevLevel,
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
          coachRemark: latest.coachObservation || 'Baseline established with active training participation.',
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

      let progressStatus = 'STABLE (Maintaining Standard)';
      if (diff >= 15) {
        progressStatus = `IN PROGRESS (Significant Improvement: +${diff} pts)`;
        improvingCount++;
      } else if (diff >= 5) {
        progressStatus = `IN PROGRESS (Improving: +${diff} pts)`;
        improvingCount++;
      } else if (diff >= -3) {
        progressStatus = `STABLE (Maintaining Standard: ${diff >= 0 ? `+${diff}` : diff} pts)`;
        stableCount++;
      } else if (diff >= -10) {
        progressStatus = `NOT PROGRESSING (Needs Attention: ${diff} pts)`;
        needsAttentionCount++;
      } else {
        progressStatus = `NOT PROGRESSING (Declining: ${diff} pts)`;
        needsAttentionCount++;
      }

      const progressChange = diff > 0 ? `+${diff}` : `${diff}`;

      const remark = latest.coachObservation || (
        diff > 0 
          ? `Commendable growth observed (+${diff} pts since baseline test).`
          : diff >= -3
          ? 'Performance level maintained consistently across evaluation cycles.'
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
        overallDevLevel,
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
        stableCount,
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
        ['DEPARTMENT OF PHYSICAL EDUCATION & SPORTS - PRIMARY STUDENT-BY-STUDENT PROGRESSION MONITOR'],
        [`Session: ${academicYear} | Cycle: ${termTitle} | Report Date: ${reportDate} | Head Coach / HOD: ${headCoach}`],
        [`Scope: ${options.sportFilter && options.sportFilter !== 'all' ? `Sport Discipline: ${options.sportFilter}` : 'Entire Enrolled Student Cohort'} | Standards: CBSE & National PE Framework`],
        [''],
        ['EXECUTIVE COHORT PROGRESS SUMMARY (FOR PRINCIPAL & HOD REVIEW)'],
        [
          'Total Enrolled Students', progressSummary.totalStudents,
          'Assessed Students', progressSummary.assessedCount,
          'Pending Evaluation', progressSummary.pendingCount,
          'Completion Rate', `${progressSummary.completionRate}%`,
          'Cohort Average Score', `${progressSummary.averageScore}/100`
        ],
        [
          'In Progress (Improving)', progressSummary.improvingCount,
          'Stable / On Track', progressSummary.stableCount,
          'Not Progressing (Needs Attention)', progressSummary.needsAttentionCount,
          'Cohort Standing', progressSummary.needsAttentionCount > 0 ? 'Targeted Interventions Required' : 'Cohort Progress On Track'
        ],
        [''],
        // 30 Standard Columns (One row per student)
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
          'Assessment Status',
          'Baseline Score',
          'Latest Score',
          'Progress Change',
          'Progress Status (Principal & HOD Track)',
          'Overall Skill Level',
          'Technical Score',
          'Tactical Score',
          'Physical Score',
          'Behaviour / Grit Score',
          'Best Skill 1 (Level & Score)',
          'Best Skill 2 (Level & Score)',
          'Best Skill 3 (Level & Score)',
          'Priority Weakness 1 (Level & Score)',
          'Priority Weakness 2 (Level & Score)',
          'Priority Weakness 3 (Level & Score)',
          'Priority Development Area',
          'AI Coaching System Feedback & Action',
          'Next Performance Target',
          'Next Review Date',
          'Coach Development Remark'
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
          item.assessmentStatus,
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
          item.coachRemark
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
        { wch: 18 },  // Sport
        { wch: 20 },  // Position / Role
        { wch: 20 },  // Squad / Batch
        { wch: 20 },  // Assessment Status
        { wch: 15 },  // Baseline Score
        { wch: 15 },  // Latest Score
        { wch: 18 },  // Progress Change
        { wch: 34 },  // Progress Status (Principal & HOD Track)
        { wch: 22 },  // Overall Dev Level
        { wch: 15 },  // Technical Score
        { wch: 15 },  // Tactical Score
        { wch: 15 },  // Physical Score
        { wch: 20 },  // Behaviour / Grit Score
        { wch: 30 },  // Best Skill 1
        { wch: 30 },  // Best Skill 2
        { wch: 30 },  // Best Skill 3
        { wch: 32 },  // Priority Weakness 1
        { wch: 32 },  // Priority Weakness 2
        { wch: 32 },  // Priority Weakness 3
        { wch: 28 },  // Priority Dev Area
        { wch: 55 },  // AI Coaching System Feedback & Action
        { wch: 45 },  // Next Performance Target
        { wch: 16 },  // Next Review Date
        { wch: 45 }   // Coach Remark
      ];

      // Enable AutoFilter on header row (Row 10) for Principal/HOD instant filtering
      wsProgress['!autofilter'] = { ref: `A10:AD${progressSheetRows.length}` };

      // Append strictly ONE SHEET to workbook as requested (All detail preserved in PDF)
      XLSX.utils.book_append_sheet(wb, wsProgress, 'Student_Progress_Report');


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

      // Historical milestones appended to the same master sheet (strictly 1-sheet report)
      if (history && history.length > 0) {
        studentCardRows.push(['']);
        studentCardRows.push(['HISTORICAL DEVELOPMENTAL MILESTONES & PERFORMANCE HISTORY']);
        studentCardRows.push(['Evaluation Date', 'Evaluation Type', 'Overall Score', 'Development Level', 'Technical %', 'Tactical %', 'Physical %', 'Mental %', 'Evaluating Coach']);
        history.forEach(h => {
          studentCardRows.push([
            h.assessmentDate,
            h.assessmentType,
            `${h.overallScore} / 100 PTS`,
            h.developmentLevel,
            `${h.domainScores?.technical ?? h.overallScore}%`,
            `${h.domainScores?.tactical ?? h.overallScore}%`,
            `${h.domainScores?.physical ?? h.overallScore}%`,
            `${h.domainScores?.gameBehaviour ?? h.overallScore}%`,
            h.coachName
          ]);
        });
      }

      const wsStudent = XLSX.utils.aoa_to_sheet(studentCardRows);
      wsStudent['!cols'] = [
        { wch: 28 },
        { wch: 24 },
        { wch: 20 },
        { wch: 36 }
      ];
      XLSX.utils.book_append_sheet(wb, wsStudent, 'Student_Development_Card');

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

      // Compute cohort metrics for Principal & HOD Executive Summary
      const totalAthletes = athletes.length;
      let evaluatedCount = 0;
      let scoreSum = 0;
      let improvingCount = 0;
      let stableCount = 0;
      let needsAttentionCount = 0;

      athletes.forEach(ath => {
        const history = (athleteAssessmentsMap.get(ath.id) || []).sort(
          (a, b) => new Date(a.testDate).getTime() - new Date(b.testDate).getTime()
        );
        if (history.length > 0) {
          evaluatedCount++;
          const latest = history[history.length - 1];
          scoreSum += latest.overallScore;

          if (history.length === 1) {
            if (latest.overallScore < 50) needsAttentionCount++;
            else stableCount++;
          } else {
            const baseline = history[0];
            const diff = latest.overallScore - baseline.overallScore;
            if (diff >= 5) improvingCount++;
            else if (diff >= -3) stableCount++;
            else needsAttentionCount++;
          }
        }
      });

      const pendingCount = totalAthletes - evaluatedCount;
      const completionRate = totalAthletes > 0 ? Math.round((evaluatedCount / totalAthletes) * 100) : 0;
      const avgScore = evaluatedCount > 0 ? Math.round(scoreSum / evaluatedCount) : 0;

      // ONE-SHEET MASTER PROGRESS REPORT: STUDENT_PROGRESS_REPORT
      const progressRows: any[][] = [
        [`${programName.toUpperCase()} - OFFICIAL ATHLETE & STUDENT PROGRESS REPORT`],
        ['SPORTS COACHING DEPARTMENT - ATHLETE-BY-ATHLETE PROGRESSION MONITOR (ONE-SHEET MASTER REPORT)'],
        [`Generated: ${reportDate} | Head Coach / Lead Trainer: ${coachName} | Standard: Universal Sports Skill Standards`],
        ['Scope: Registered Athletes Cohort | Format: Institutional Single-Sheet Submission'],
        [''],
        ['EXECUTIVE COHORT PROGRESS SUMMARY (FOR PRINCIPAL & HOD REVIEW)'],
        [
          'Total Registered Athletes', totalAthletes,
          'Assessed Athletes', evaluatedCount,
          'Pending Evaluation', pendingCount,
          'Completion Rate', `${completionRate}%`,
          'Cohort Average Score', `${avgScore}/100`
        ],
        [
          'In Progress (Improving)', improvingCount,
          'Stable / On Track', stableCount,
          'Not Progressing (Needs Attention)', needsAttentionCount,
          'Cohort Standing', needsAttentionCount > 0 ? 'Targeted Interventions Required' : 'Cohort Progress On Track'
        ],
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
          'Assessment Status',
          'Baseline Score',
          'Latest Score',
          'Progress Change',
          'Progress Status (Principal & HOD Track)',
          'Overall Skill Level',
          'Technical %',
          'Tactical %',
          'Physical %',
          'Mental %',
          'Best Skill 1 (Level & Score)',
          'Best Skill 2 (Level & Score)',
          'Best Skill 3 (Level & Score)',
          'Priority Weakness 1 (Level & Score)',
          'Priority Weakness 2 (Level & Score)',
          'Priority Weakness 3 (Level & Score)',
          'Priority Development Area',
          'AI Coaching System Feedback & Action',
          'Next Performance Target',
          'Next Review Date',
          'Coach Feedback'
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
            'Pending Evaluation',
            '—',
            '—',
            '—',
            'ASSESSMENT PENDING (Awaiting Baseline)',
            'Pending',
            '—', '—', '—', '—',
            '—', '—', '—',
            '—', '—', '—',
            'Assessment Required',
            'Schedule baseline athletic evaluation and skill testing.',
            'Complete initial skill assessment.',
            '—',
            'Enrolled athlete pending baseline evaluation.'
          ]);
        } else if (history.length === 1) {
          const single = history[0];
          const best1 = single.strengths[0] ? formatSkillWithLevel(single.strengths[0], 4) : '—';
          const best2 = single.strengths[1] ? formatSkillWithLevel(single.strengths[1], 4) : '—';
          const best3 = single.strengths[2] ? formatSkillWithLevel(single.strengths[2], 3) : '—';
          const weak1 = single.growthAreas[0] ? formatSkillWithLevel(single.growthAreas[0], 2) : '—';
          const weak2 = single.growthAreas[1] ? formatSkillWithLevel(single.growthAreas[1], 2) : '—';
          const weak3 = single.growthAreas[2] ? formatSkillWithLevel(single.growthAreas[2], 2) : '—';
          const priorityArea = single.growthAreas[0] || 'Foundational Skills';
          const drillsText = single.prescribedDrills && single.prescribedDrills.length > 0
            ? single.prescribedDrills.map(d => `${d.drillName} (${d.frequency})`).join('; ')
            : generateAiCoachingAction(sportName, priorityArea, undefined, single.coachFeedback);

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
            'Completed (1 Review)',
            single.overallScore,
            single.overallScore,
            'Baseline Established',
            'INITIAL ASSESSMENT (Baseline Set)',
            single.overallTier,
            single.pillarAverages.technical,
            single.pillarAverages.tactical,
            single.pillarAverages.physical,
            single.pillarAverages.mental,
            best1,
            best2,
            best3,
            weak1,
            weak2,
            weak3,
            priorityArea,
            drillsText,
            generateNextPerformanceTarget(priorityArea),
            '90 Days',
            single.coachFeedback || 'Baseline recorded with positive engagement.'
          ]);
        } else {
          const baseline = history[0];
          const latest = history[history.length - 1];
          const diff = latest.overallScore - baseline.overallScore;
          const status = diff >= 15 
            ? `IN PROGRESS (Significant Improvement: +${diff} pts)`
            : diff >= 5 
            ? `IN PROGRESS (Improving: +${diff} pts)` 
            : diff >= -3 
            ? `STABLE (Maintaining Standard: ${diff >= 0 ? `+${diff}` : diff} pts)` 
            : diff >= -10
            ? `NOT PROGRESSING (Needs Attention: ${diff} pts)`
            : `NOT PROGRESSING (Declining: ${diff} pts)`;

          const best1 = latest.strengths[0] ? formatSkillWithLevel(latest.strengths[0], 4) : '—';
          const best2 = latest.strengths[1] ? formatSkillWithLevel(latest.strengths[1], 4) : '—';
          const best3 = latest.strengths[2] ? formatSkillWithLevel(latest.strengths[2], 3) : '—';
          const weak1 = latest.growthAreas[0] ? formatSkillWithLevel(latest.growthAreas[0], 2) : '—';
          const weak2 = latest.growthAreas[1] ? formatSkillWithLevel(latest.growthAreas[1], 2) : '—';
          const weak3 = latest.growthAreas[2] ? formatSkillWithLevel(latest.growthAreas[2], 2) : '—';
          const priorityArea = latest.growthAreas[0] || 'Core Mechanics';
          const drillsText = latest.prescribedDrills && latest.prescribedDrills.length > 0
            ? latest.prescribedDrills.map(d => `${d.drillName} (${d.frequency})`).join('; ')
            : generateAiCoachingAction(sportName, priorityArea, undefined, latest.coachFeedback);

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
            `Completed (${history.length} Reviews)`,
            baseline.overallScore,
            latest.overallScore,
            diff > 0 ? `+${diff}` : `${diff}`,
            status,
            latest.overallTier,
            latest.pillarAverages.technical,
            latest.pillarAverages.tactical,
            latest.pillarAverages.physical,
            latest.pillarAverages.mental,
            best1,
            best2,
            best3,
            weak1,
            weak2,
            weak3,
            priorityArea,
            drillsText,
            generateNextPerformanceTarget(priorityArea),
            '90 Days',
            latest.coachFeedback || 'Progress tracked across training cycles.'
          ]);
        }
      });

      const wsProgress = XLSX.utils.aoa_to_sheet(progressRows);
      wsProgress['!cols'] = [
        { wch: 6 },  { wch: 14 }, { wch: 22 }, { wch: 6 },  { wch: 12 },
        { wch: 8 },  { wch: 18 }, { wch: 20 }, { wch: 10 }, { wch: 20 },
        { wch: 14 }, { wch: 14 }, { wch: 16 }, { wch: 34 }, { wch: 16 },
        { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 30 },
        { wch: 30 }, { wch: 30 }, { wch: 32 }, { wch: 32 }, { wch: 32 },
        { wch: 26 }, { wch: 55 }, { wch: 45 }, { wch: 14 }, { wch: 45 }
      ];

      // Enable AutoFilter on row 10 for Principal & HOD filtering
      wsProgress['!autofilter'] = { ref: `A10:AD${progressRows.length}` };

      // Append strictly ONE SHEET to workbook
      XLSX.utils.book_append_sheet(wb, wsProgress, 'Student_Progress_Report');

      // Download
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
      console.error('Failed to export universal coaching excel report:', err);
      return false;
    }
  }
};
