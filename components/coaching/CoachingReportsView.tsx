import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  Printer, 
  Search, 
  Trash2, 
  Trophy, 
  Calendar, 
  User, 
  Award,
  Sparkles,
  Download,
  Share2,
  Medal,
  Activity,
  FileSpreadsheet,
  TrendingUp,
  Target,
  CheckCircle2,
  AlertCircle,
  Eye,
  SlidersHorizontal,
  Clock,
  ArrowUpRight
} from 'lucide-react';
import { 
  academyService, 
  PlayerAssessmentRecord, 
  PlayerProfileData, 
  SPORT_TEMPLATES, 
  getDevelopmentLevelColor,
  getMeritClassification,
  CoachingSportId,
  createPlayerFromAssessment
} from '../../services/academyService';
import { 
  coachingExcelReportService, 
  StudentProgressItem 
} from '../../services/coachingExcelReportService';
import { SchoolManagementExcelModal } from './SchoolManagementExcelModal';
import { StudentProgressDetailModal } from './StudentProgressDetailModal';
import { showToast } from '../../services/toast';

interface CoachingReportsViewProps {
  onViewReport: (player: PlayerProfileData, assessment: PlayerAssessmentRecord) => void;
  onNewAssessment: (playerId?: string) => void;
}

export const CoachingReportsView: React.FC<CoachingReportsViewProps> = ({
  onViewReport,
  onNewAssessment
}) => {
  const [assessments, setAssessments] = useState<PlayerAssessmentRecord[]>(() => academyService.getAssessments());
  const [players, setPlayers] = useState<PlayerProfileData[]>(() => academyService.getPlayers());
  const [searchQuery, setSearchQuery] = useState('');
  const [sportFilter, setSportFilter] = useState('all');
  const [activeReportTab, setActiveReportTab] = useState<'progress' | 'merit'>('progress');
  const [statusFilter, setStatusFilter] = useState<'all' | 'improving' | 'stable' | 'attention' | 'pending'>('all');
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);
  const [selectedProgressItem, setSelectedProgressItem] = useState<StudentProgressItem | null>(null);

  const refreshData = () => {
    setAssessments(academyService.getAssessments());
    setPlayers(academyService.getPlayers());
  };

  // Compute student-by-student progress data & cohort summary
  const { items: allProgressItems, summary: progressSummary } = useMemo(() => {
    return coachingExcelReportService.getStudentProgressData(players, assessments, sportFilter);
  }, [players, assessments, sportFilter]);

  // Filter progress items for display
  const filteredProgressItems = useMemo(() => {
    return allProgressItems.filter(item => {
      const matchSearch = item.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.studentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.position.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.squad.toLowerCase().includes(searchQuery.toLowerCase());
      
      let matchStatus = true;
      if (statusFilter === 'improving') {
        matchStatus = item.progressStatus === 'Significant Improvement' || item.progressStatus === 'Improving';
      } else if (statusFilter === 'stable') {
        matchStatus = item.progressStatus === 'Stable' || item.progressStatus === 'Initial Assessment';
      } else if (statusFilter === 'attention') {
        matchStatus = item.progressStatus === 'Needs Attention' || item.progressStatus === 'Declining';
      } else if (statusFilter === 'pending') {
        matchStatus = item.progressStatus === 'Assessment Pending';
      }

      return matchSearch && matchStatus;
    });
  }, [allProgressItems, searchQuery, statusFilter]);

  // Filtered merit assessments for the archive tab
  const filteredAssessments = useMemo(() => {
    return assessments.filter(a => {
      const matchSearch = a.playerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          a.coachName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          a.assessmentType.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          a.position.toLowerCase().includes(searchQuery.toLowerCase());
      const matchSport = sportFilter === 'all' || a.sport === sportFilter;
      return matchSearch && matchSport;
    }).sort((a, b) => new Date(b.assessmentDate).getTime() - new Date(a.assessmentDate).getTime());
  }, [assessments, searchQuery, sportFilter]);

  // Sports counts for filter chips
  const sportCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    players.forEach(p => {
      counts[p.sport] = (counts[p.sport] || 0) + 1;
    });
    return counts;
  }, [players]);

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Delete merit report record for ${name}?`)) {
      academyService.deleteAssessment(id);
      refreshData();
      showToast('Assessment deleted', 'success');
    }
  };

  // Preview or generate a quick sample merit report for any chosen sport category
  const handlePreviewSportSample = (targetSport: string) => {
    const sportKey = (targetSport === 'all' ? 'football' : targetSport) as CoachingSportId;
    const existing = assessments.find(a => a.sport === sportKey);
    
    if (existing) {
      const p = players.find(player => player.id === existing.playerId) || createPlayerFromAssessment(existing);
      onViewReport(p, existing);
      return;
    }

    const tmpl = SPORT_TEMPLATES[sportKey] || SPORT_TEMPLATES.football;
    const sampleRatings: Record<string, number> = {};
    tmpl.skills.forEach((s, idx) => {
      sampleRatings[s.id] = (idx % 2 === 0) ? 4 : 5;
    });

    const sampleAssessment: PlayerAssessmentRecord = {
      id: `sample-${sportKey}-${Date.now()}`,
      playerId: `player-sample-${sportKey}`,
      playerName: `Cadet ${tmpl.name} Exemplar`,
      sport: sportKey,
      position: tmpl.positions[0]?.name || 'Athlete',
      assessmentType: '3-Month Review',
      assessmentDate: new Date().toISOString().split('T')[0],
      coachName: 'Coach Vikram Roy',
      skillRatings: sampleRatings,
      skillObservations: {},
      skillTargets: {},
      includedPositionSkills: [],
      domainScores: {
        technical: 86,
        tactical: 82,
        physical: 88,
        gameBehaviour: 92
      },
      overallScore: 87,
      developmentLevel: 'Proficient',
      strengths: [
        'Exceptional footwork and body balance',
        'Consistently quick decision making under defensive pressure',
        'Outstanding coachability and sportsmanship'
      ],
      developmentPriorities: [
        'Fine-tune transition recovery speed during high-intensity phases',
        'Maintain tactical communication across full match duration'
      ],
      coachObservation: `Exemplary performance demonstrating high technical mastery and match composure in ${tmpl.name}. Candidate qualifies for High Merit distinction.`,
      coachRecommendation: 'Continue 30-minute individual technical ball/racket drills 3 times a week.',
      nextGoals: [],
      nextAssessmentDate: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString()
    };

    const samplePlayer: PlayerProfileData = {
      id: `player-sample-${sportKey}`,
      name: `Cadet ${tmpl.name} Exemplar`,
      dob: '2012-05-15',
      age: 12,
      gender: 'Male',
      sport: sportKey,
      position: tmpl.positions[0]?.name || 'Athlete',
      batchOrTeam: `${tmpl.name} Junior Academy`,
      coachName: 'Coach Vikram Roy',
      joiningDate: '2023-01-10',
      parentName: 'Ramesh Sharma',
      parentContact: '+91 98765 43210',
      dominantSide: 'Right',
      previousExperience: '2 years school academy training',
      playerGoals: 'Reach state division squad',
      createdAt: new Date().toISOString(),
      active: true
    };

    onViewReport(samplePlayer, sampleAssessment);
  };

  const handleInstantExcelDownload = () => {
    const success = coachingExcelReportService.exportSchoolManagementExcelReport(players, assessments, {
      sportFilter
    });
    if (success) {
      showToast('Student Progress Report (.xlsx) downloaded successfully!', 'success');
    }
  };

  const getProgressBadgeColor = (status: StudentProgressItem['progressStatus']) => {
    switch (status) {
      case 'Significant Improvement':
        return 'bg-purple-100 text-purple-900 border-purple-300';
      case 'Improving':
        return 'bg-emerald-100 text-emerald-900 border-emerald-300';
      case 'Stable':
        return 'bg-blue-100 text-blue-900 border-blue-300';
      case 'Needs Attention':
        return 'bg-amber-100 text-amber-900 border-amber-300';
      case 'Declining':
        return 'bg-rose-100 text-rose-900 border-rose-300';
      case 'Initial Assessment':
        return 'bg-cyan-100 text-cyan-900 border-cyan-300';
      default:
        return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-white border-2 border-slate-900 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="px-2.5 py-0.5 bg-blue-100 text-blue-900 rounded-md text-[10px] font-black uppercase tracking-wider">
              Student Progress &amp; Academic Report System
            </span>
            <span className="text-xs text-slate-400 font-bold">
              {players.length} Enrolled Students &bull; {assessments.length} Reviews Completed
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-display">
            Student-by-Student Progress Reports
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Monitor real individual performance growth, strengths, weaknesses, coaching targets, and next review dates across all enrolled students.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleInstantExcelDownload}
            className="px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl text-xs uppercase tracking-wider transition shadow-md flex items-center justify-center space-x-2 active:scale-95 cursor-pointer"
            title="Download primary Student_Progress_Report Excel workbook"
          >
            <FileSpreadsheet size={16} className="text-white" />
            <span>Export Progress Excel (.xlsx)</span>
          </button>

          <button
            type="button"
            onClick={() => setIsExcelModalOpen(true)}
            className="px-3.5 py-3 bg-white hover:bg-slate-100 text-slate-800 border-2 border-slate-900 font-black rounded-2xl text-xs uppercase tracking-wider transition flex items-center justify-center space-x-1.5 active:scale-95 shadow-sm cursor-pointer"
            title="Configure report title, session, and management options"
          >
            <SlidersHorizontal size={15} />
            <span className="hidden sm:inline">Report Options</span>
          </button>
          
          <button
            type="button"
            onClick={() => onNewAssessment()}
            className="px-4 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-2xl text-xs uppercase tracking-wider transition shadow-md flex items-center justify-center space-x-2 active:scale-95 cursor-pointer"
          >
            <FileText size={16} />
            <span>+ Conduct Test</span>
          </button>
        </div>
      </div>

      {/* Primary Report View Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setActiveReportTab('progress')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition flex items-center gap-2 border ${
              activeReportTab === 'progress'
                ? 'bg-[#0D2B52] text-white border-slate-900 shadow-md ring-2 ring-[#D4A017]'
                : 'bg-white text-slate-700 hover:bg-slate-100 border-slate-200'
            }`}
          >
            <TrendingUp size={15} className="text-[#D4A017]" />
            <span>1. Student Progress Report ({players.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveReportTab('merit')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition flex items-center gap-2 border ${
              activeReportTab === 'merit'
                ? 'bg-[#0D2B52] text-white border-slate-900 shadow-md ring-2 ring-[#D4A017]'
                : 'bg-white text-slate-700 hover:bg-slate-100 border-slate-200'
            }`}
          >
            <Award size={15} className="text-amber-500" />
            <span>2. Merit Certificates &amp; Archive ({assessments.length})</span>
          </button>
        </div>

        <span className="text-[11px] font-bold text-slate-400 hidden md:inline">
          {activeReportTab === 'progress' ? 'One row per student progress monitor' : 'Printable certificates & archive'}
        </span>
      </div>

      {/* ========================================================================= */}
      {/* VIEW TAB 1: PRIMARY STUDENT-BY-STUDENT PROGRESS REPORT                    */}
      {/* ========================================================================= */}
      {activeReportTab === 'progress' && (
        <div className="space-y-5">
          
          {/* Dynamic Cohort Progress Summary Block */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            <div className="p-3.5 bg-white rounded-2xl border-2 border-slate-900 shadow-sm text-center">
              <span className="text-[10px] font-black uppercase text-slate-500 block">Total Students</span>
              <span className="text-xl font-black text-slate-900 block mt-0.5">{progressSummary.totalStudents}</span>
              <span className="text-[10px] text-slate-400 font-bold">Enrolled Cohort</span>
            </div>

            <div className="p-3.5 bg-white rounded-2xl border-2 border-slate-900 shadow-sm text-center">
              <span className="text-[10px] font-black uppercase text-slate-500 block">Assessed</span>
              <span className="text-xl font-black text-emerald-600 block mt-0.5">{progressSummary.assessedCount}</span>
              <span className="text-[10px] text-emerald-700 font-bold">Evaluated</span>
            </div>

            <div className="p-3.5 bg-white rounded-2xl border-2 border-slate-900 shadow-sm text-center">
              <span className="text-[10px] font-black uppercase text-slate-500 block">Pending</span>
              <span className="text-xl font-black text-amber-600 block mt-0.5">{progressSummary.pendingCount}</span>
              <span className="text-[10px] text-amber-700 font-bold">Needs Baseline</span>
            </div>

            <div className="p-3.5 bg-white rounded-2xl border-2 border-slate-900 shadow-sm text-center">
              <span className="text-[10px] font-black uppercase text-slate-500 block">Completion</span>
              <span className="text-xl font-black text-blue-700 block mt-0.5">{progressSummary.completionRate}%</span>
              <span className="text-[10px] text-blue-600 font-bold">Roster Assessed</span>
            </div>

            <div className="p-3.5 bg-white rounded-2xl border-2 border-slate-900 shadow-sm text-center">
              <span className="text-[10px] font-black uppercase text-slate-500 block">Avg Score</span>
              <span className="text-xl font-black text-slate-900 block mt-0.5">
                {progressSummary.averageScore > 0 ? `${progressSummary.averageScore}/100` : '—'}
              </span>
              <span className="text-[10px] text-slate-400 font-bold">Cohort Mean</span>
            </div>

            <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-300 text-center">
              <span className="text-[10px] font-black uppercase text-emerald-800 block">Improving</span>
              <span className="text-xl font-black text-emerald-700 block mt-0.5">{progressSummary.improvingCount}</span>
              <span className="text-[10px] text-emerald-600 font-bold">Growth Delta</span>
            </div>

            <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-300 text-center">
              <span className="text-[10px] font-black uppercase text-amber-800 block">Needs Attention</span>
              <span className="text-xl font-black text-amber-700 block mt-0.5">{progressSummary.needsAttentionCount}</span>
              <span className="text-[10px] text-amber-600 font-bold">Focus Drills</span>
            </div>
          </div>

          {/* Search, Sport & Status Filter Bar */}
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2 relative">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search student by name, roll ID, position, or squad..."
                  className="w-full bg-white border-2 border-slate-900 rounded-2xl pl-10 pr-4 py-2.5 text-xs font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <select
                  value={sportFilter}
                  onChange={e => setSportFilter(e.target.value)}
                  className="w-full bg-white border-2 border-slate-900 rounded-2xl px-4 py-2.5 text-xs font-bold text-slate-900 focus:outline-none"
                >
                  <option value="all">All Sports Disciplines ({players.length} Students)</option>
                  {Object.values(SPORT_TEMPLATES).map(tmpl => (
                    <option key={tmpl.id} value={tmpl.id}>
                      {tmpl.name} ({sportCounts[tmpl.id] || 0} students)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Quick Status Filter Chips */}
            <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-[11px] scrollbar-none">
              <span className="text-[10px] font-black uppercase text-slate-400 mr-1">Status Filter:</span>
              {[
                { id: 'all', label: `All Students (${allProgressItems.length})` },
                { id: 'improving', label: `Improving (${progressSummary.improvingCount})` },
                { id: 'stable', label: `Stable / Initial` },
                { id: 'attention', label: `Needs Attention (${progressSummary.needsAttentionCount})` },
                { id: 'pending', label: `Pending Baseline (${progressSummary.pendingCount})` }
              ].map(f => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setStatusFilter(f.id as any)}
                  className={`px-3 py-1 rounded-xl font-bold whitespace-nowrap transition cursor-pointer ${
                    statusFilter === f.id
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Progress Table: ONE ROW PER STUDENT */}
          <div className="bg-white border-2 border-slate-900 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#0D2B52] text-white text-[10px] font-black uppercase tracking-wider">
                  <tr>
                    <th className="p-3 w-12 border-b border-slate-800">#</th>
                    <th className="p-3 border-b border-slate-800">Student Name</th>
                    <th className="p-3 border-b border-slate-800">Grade &amp; Age</th>
                    <th className="p-3 border-b border-slate-800">Sport &amp; Position</th>
                    <th className="p-3 border-b border-slate-800">Squad / Batch</th>
                    <th className="p-3 border-b border-slate-800 text-center">Baseline</th>
                    <th className="p-3 border-b border-slate-800 text-center">Latest</th>
                    <th className="p-3 border-b border-slate-800 text-center">Progress</th>
                    <th className="p-3 border-b border-slate-800 text-center">Status</th>
                    <th className="p-3 border-b border-slate-800">Top Strengths</th>
                    <th className="p-3 border-b border-slate-800">Priority Weakness</th>
                    <th className="p-3 border-b border-slate-800 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredProgressItems.length === 0 ? (
                    <tr>
                      <td colSpan={12} className="p-10 text-center text-slate-500 space-y-2">
                        <AlertCircle size={28} className="mx-auto text-slate-400" />
                        <div className="font-bold">No students found matching your query.</div>
                        <p className="text-[11px] text-slate-400">Try adjusting your search terms or filter selection.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredProgressItems.map(item => (
                      <tr 
                        key={item.studentId}
                        onClick={() => setSelectedProgressItem(item)}
                        className="hover:bg-slate-50 transition cursor-pointer"
                      >
                        <td className="p-3 font-bold text-slate-400">{item.sNo}</td>
                        
                        <td className="p-3">
                          <div className="font-black text-slate-900 flex items-center gap-1.5">
                            <span>{item.studentName}</span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono">{item.studentId}</span>
                        </td>

                        <td className="p-3 font-medium text-slate-600 whitespace-nowrap">
                          {item.gradeAge}
                          <span className="text-[10px] text-slate-400 block font-bold">{item.ageCategory}</span>
                        </td>

                        <td className="p-3">
                          <div className="font-bold text-slate-800">{item.sport}</div>
                          <span className="text-[11px] text-slate-500">{item.position}</span>
                        </td>

                        <td className="p-3 font-medium text-slate-600 truncate max-w-[140px]">
                          {item.squad}
                        </td>

                        <td className="p-3 text-center font-bold text-slate-700">
                          {item.baselineScore !== '—' ? `${item.baselineScore}` : <span className="text-slate-300">—</span>}
                        </td>

                        <td className="p-3 text-center font-black text-slate-900">
                          {item.latestScore !== '—' ? `${item.latestScore}/100` : <span className="text-slate-300">—</span>}
                        </td>

                        <td className="p-3 text-center whitespace-nowrap">
                          {item.progressChange.startsWith('+') ? (
                            <span className="text-emerald-700 font-black px-2 py-0.5 bg-emerald-100 rounded text-xs">
                              {item.progressChange}
                            </span>
                          ) : item.progressChange.startsWith('-') ? (
                            <span className="text-rose-700 font-black px-2 py-0.5 bg-rose-100 rounded text-xs">
                              {item.progressChange}
                            </span>
                          ) : item.progressChange === 'Baseline Established' ? (
                            <span className="text-cyan-800 font-bold text-[10px] px-1.5 py-0.5 bg-cyan-50 rounded">
                              Baseline Est.
                            </span>
                          ) : (
                            <span className="text-slate-300 font-bold">—</span>
                          )}
                        </td>

                        <td className="p-3 text-center whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border ${getProgressBadgeColor(item.progressStatus)}`}>
                            {item.progressStatus}
                          </span>
                        </td>

                        <td className="p-3 max-w-[180px]">
                          {item.topStrength1 !== '—' ? (
                            <div className="truncate text-emerald-800 font-bold" title={`${item.topStrength1}, ${item.topStrength2}`}>
                              {item.topStrength1}
                            </div>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>

                        <td className="p-3 max-w-[180px]">
                          {item.priorityWeakness1 !== '—' ? (
                            <div className="truncate text-amber-900 font-medium" title={item.priorityWeakness1}>
                              {item.priorityWeakness1}
                            </div>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">Assessment Required</span>
                          )}
                        </td>

                        <td className="p-3 text-right whitespace-nowrap" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setSelectedProgressItem(item)}
                              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-[11px] font-bold transition cursor-pointer flex items-center gap-1"
                              title="View complete student progress dossier"
                            >
                              <Eye size={13} />
                              <span className="hidden lg:inline">Dossier</span>
                            </button>

                            {item.latestAssessment ? (
                              <button
                                type="button"
                                onClick={() => onViewReport(item.player, item.latestAssessment!)}
                                className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-amber-400 rounded-lg text-[11px] font-black transition cursor-pointer flex items-center gap-1"
                                title="View official printable certificate / PDF"
                              >
                                <FileText size={13} />
                                <span className="hidden lg:inline">PDF</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => onNewAssessment(item.studentId)}
                                className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-[11px] font-black transition cursor-pointer flex items-center gap-1"
                                title="Conduct baseline evaluation"
                              >
                                <Target size={13} />
                                <span>Assess</span>
                              </button>
                            )}

                            {item.latestAssessment && (
                              <button
                                type="button"
                                onClick={() => {
                                  const success = coachingExcelReportService.exportIndividualStudentExcelReport(item.player, item.latestAssessment!, item.history);
                                  if (success) showToast(`Excel report downloaded for ${item.studentName}!`, 'success');
                                }}
                                className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded-lg border border-emerald-200 transition"
                                title="Download individual student Excel card"
                              >
                                <FileSpreadsheet size={14} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW TAB 2: MERIT CERTIFICATES & ARCHIVE VIEW                             */}
      {/* ========================================================================= */}
      {activeReportTab === 'merit' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2">
            <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">
              Official Merit Cards &amp; Evaluation History ({assessments.length} Records)
            </h3>
            <button
              type="button"
              onClick={() => handlePreviewSportSample(sportFilter)}
              className="px-3.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <Trophy size={14} className="text-amber-500" />
              <span>Preview Exemplar Certificate</span>
            </button>
          </div>

          <div className="space-y-3">
            {filteredAssessments.length === 0 ? (
              <div className="text-center py-14 bg-white border-2 border-slate-900 rounded-3xl p-6 space-y-3">
                <FileText size={42} className="mx-auto text-slate-300" />
                <h3 className="text-base font-black text-slate-800">
                  No Merit Reports Found
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Complete an evaluation for an enrolled student to generate their official printable Merit Card and Certificate.
                </p>
                <div className="pt-2 flex items-center justify-center space-x-3">
                  <button
                    type="button"
                    onClick={() => onNewAssessment()}
                    className="px-4 py-2 bg-amber-500 text-slate-950 text-xs font-black uppercase tracking-wider rounded-xl shadow-sm cursor-pointer"
                  >
                    Conduct Evaluation
                  </button>
                </div>
              </div>
            ) : (
              filteredAssessments.map(record => {
                const player = players.find(p => p.id === record.playerId) || createPlayerFromAssessment(record);
                const sportTemplate = SPORT_TEMPLATES[record.sport as CoachingSportId] || SPORT_TEMPLATES.football;
                const levelStyle = getDevelopmentLevelColor(record.developmentLevel);
                const merit = getMeritClassification(record.overallScore);

                return (
                  <div
                    key={record.id}
                    className="bg-white border-2 border-slate-900 rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-center space-x-3.5">
                      
                      {/* Score & Merit Badge */}
                      <div className="flex flex-col items-center justify-center w-14 h-14 rounded-2xl bg-slate-900 text-amber-400 font-black flex-shrink-0 shadow-sm">
                        <span className="text-base leading-none">{record.overallScore}</span>
                        <span className="text-[9px] uppercase tracking-tighter text-slate-400 font-bold mt-0.5">
                          {merit.grade}
                        </span>
                      </div>

                      <div>
                        <div className="flex items-center flex-wrap gap-1.5">
                          <h3 className="text-sm font-black text-slate-900">{record.playerName}</h3>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase border ${levelStyle.bg} ${levelStyle.text} ${levelStyle.border}`}>
                            {record.developmentLevel}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase border ${merit.badgeBg} ${merit.badgeText} ${merit.badgeBorder}`}>
                            {merit.category}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">
                          <span className="font-bold text-slate-800">{sportTemplate.name}</span> &bull; {record.position} &bull; {record.assessmentType}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Evaluated on {record.assessmentDate} by Coach {record.coachName}
                        </p>
                      </div>
                    </div>

                    {/* Pillar Mini Indicators & Action Buttons */}
                    <div className="flex items-center flex-wrap sm:flex-nowrap gap-2 self-end sm:self-center">
                      
                      <div className="hidden lg:flex items-center space-x-2 text-[10px] font-bold text-slate-500 mr-2">
                        <span title="Technical" className="px-1.5 py-0.5 bg-blue-50 text-blue-800 rounded">
                          T: {record.domainScores?.technical ?? '-'}
                        </span>
                        <span title="Tactical" className="px-1.5 py-0.5 bg-cyan-50 text-cyan-800 rounded">
                          Tac: {record.domainScores?.tactical ?? '-'}
                        </span>
                        <span title="Physical" className="px-1.5 py-0.5 bg-amber-50 text-amber-800 rounded">
                          P: {record.domainScores?.physical ?? '-'}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => onViewReport(player, record)}
                        className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center space-x-1.5 shadow-sm active:scale-95 cursor-pointer"
                      >
                        <FileText size={14} className="text-amber-400" />
                        <span>View Merit Report</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const success = coachingExcelReportService.exportIndividualStudentExcelReport(player, record);
                          if (success) {
                            showToast(`Excel report downloaded for ${player.name}!`, 'success');
                          }
                        }}
                        className="p-2 text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 rounded-xl transition border border-emerald-200 cursor-pointer"
                        title={`Download ${player.name} Excel Report Card`}
                      >
                        <FileSpreadsheet size={16} />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(record.id, record.playerName)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                        title="Delete Record"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Student Detail Report Modal */}
      {selectedProgressItem && (
        <StudentProgressDetailModal
          item={selectedProgressItem}
          onClose={() => setSelectedProgressItem(null)}
          onViewMeritReport={
            selectedProgressItem.latestAssessment
              ? () => {
                  const p = selectedProgressItem.player;
                  const a = selectedProgressItem.latestAssessment!;
                  setSelectedProgressItem(null);
                  onViewReport(p, a);
                }
              : undefined
          }
        />
      )}

      {/* School Management Excel Export Dialog */}
      <SchoolManagementExcelModal
        isOpen={isExcelModalOpen}
        onClose={() => setIsExcelModalOpen(false)}
        players={players}
        assessments={assessments}
        initialSportFilter={sportFilter}
      />

    </div>
  );
};
