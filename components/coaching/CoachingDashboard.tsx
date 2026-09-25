import React, { useState, useMemo } from 'react';
import { 
  Trophy, 
  Users, 
  ClipboardCheck, 
  TrendingUp, 
  Calendar, 
  Plus, 
  ArrowRight, 
  Sparkles, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  FileText,
  Activity,
  Layers,
  ChevronRight,
  Search,
  Filter,
  CheckSquare,
  Square,
  Trash2,
  DollarSign,
  CreditCard,
  Award
} from 'lucide-react';
import { 
  academyService, 
  PlayerProfileData, 
  PlayerAssessmentRecord, 
  SPORT_TEMPLATES, 
  CoachingSportId,
  AssessmentType,
  getDevelopmentLevelColor 
} from '../../services/academyService';
import { showToast } from '../../services/toast';

interface CoachingDashboardProps {
  onNavigateTab: (subTab: string, contextId?: string) => void;
  onNewAssessment: (playerId?: string) => void;
  onNewPlayer: () => void;
  onViewReport: (player: PlayerProfileData, assessment: PlayerAssessmentRecord) => void;
}

export const CoachingDashboard: React.FC<CoachingDashboardProps> = ({
  onNavigateTab,
  onNewAssessment,
  onNewPlayer,
  onViewReport
}) => {
  const [playersList, setPlayersList] = useState<PlayerProfileData[]>(() => academyService.getPlayers());
  const assessments = useMemo(() => academyService.getAssessments(), [playersList]);
  const batches = useMemo(() => academyService.getBatches(), []);

  // Game-wise filtering state
  const [selectedSport, setSelectedSport] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [cycleFilter, setCycleFilter] = useState<string>('all');
  const [feeFilter, setFeeFilter] = useState<string>('all');
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());

  const refreshPlayers = () => {
    setPlayersList(academyService.getPlayers());
  };

  // Compute key stats
  const totalPlayers = playersList.length;
  const activePlayers = playersList.filter(p => p.active).length;
  const totalAssessments = assessments.length;

  // Assessments due
  const upcomingReviews = useMemo(() => {
    return playersList.map(p => {
      const latest = academyService.getLatestAssessmentForPlayer(p.id);
      return {
        player: p,
        latestAssessment: latest,
        nextDate: latest?.nextAssessmentDate || p.createdAt
      };
    }).sort((a, b) => new Date(a.nextDate).getTime() - new Date(b.nextDate).getTime());
  }, [playersList]);

  // Improving players
  const improvingCount = useMemo(() => {
    let count = 0;
    playersList.forEach(p => {
      const history = academyService.getAssessmentsForPlayer(p.id);
      if (history.length >= 2) {
        if (history[history.length - 1].overallScore > history[0].overallScore) {
          count++;
        }
      }
    });
    return count;
  }, [playersList]);

  // Recent assessments list
  const recentAssessments = useMemo(() => {
    return [...assessments]
      .sort((a, b) => new Date(b.assessmentDate).getTime() - new Date(a.assessmentDate).getTime())
      .slice(0, 5);
  }, [assessments]);

  // Sport distribution counts
  const sportCounts = useMemo(() => {
    const map = new Map<string, number>();
    playersList.forEach(p => {
      map.set(p.sport, (map.get(p.sport) || 0) + 1);
    });
    return Object.values(SPORT_TEMPLATES).map(tmpl => ({
      sport: tmpl.id,
      name: tmpl.name,
      color: tmpl.color,
      count: map.get(tmpl.id) || 0
    }));
  }, [playersList]);

  // Filtered game-wise students
  const filteredStudents = useMemo(() => {
    return playersList.filter(p => {
      if (selectedSport !== 'all' && p.sport !== selectedSport) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = p.name.toLowerCase().includes(q);
        const matchPos = p.position.toLowerCase().includes(q);
        const matchSquad = p.batchOrTeam?.toLowerCase().includes(q);
        if (!matchName && !matchPos && !matchSquad) return false;
      }
      if (feeFilter !== 'all') {
        const status = p.feeStatus || 'Paid';
        if (feeFilter === 'paid' && status !== 'Paid') return false;
        if (feeFilter === 'due' && status !== 'Due') return false;
      }
      if (cycleFilter !== 'all') {
        const latest = academyService.getLatestAssessmentForPlayer(p.id);
        if (!latest || latest.assessmentType !== cycleFilter) return false;
      }
      return true;
    });
  }, [playersList, selectedSport, searchQuery, feeFilter, cycleFilter]);

  // Bulk operations
  const handleToggleSelectStudent = (id: string) => {
    setSelectedStudentIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAllFiltered = () => {
    if (selectedStudentIds.size === filteredStudents.length && filteredStudents.length > 0) {
      setSelectedStudentIds(new Set());
    } else {
      setSelectedStudentIds(new Set(filteredStudents.map(s => s.id)));
    }
  };

  const handleBulkDeleteStudents = () => {
    if (selectedStudentIds.size === 0) return;
    const count = selectedStudentIds.size;
    if (window.confirm(`Are you sure you want to delete ${count} selected student profile(s) from the academy cloud database?`)) {
      academyService.deletePlayersBulk(Array.from(selectedStudentIds));
      setSelectedStudentIds(new Set());
      refreshPlayers();
      showToast(`Successfully deleted ${count} athlete profiles`, 'success');
    }
  };

  const handleDeleteSingleStudent = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete ${name}'s profile?`)) {
      academyService.deletePlayer(id);
      setSelectedStudentIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      refreshPlayers();
      showToast(`${name} removed from roster`, 'info');
    }
  };

  const handleToggleFeeStatus = (student: PlayerProfileData) => {
    const nextStatus = student.feeStatus === 'Due' ? 'Paid' : 'Due';
    const updated: PlayerProfileData = {
      ...student,
      feeStatus: nextStatus,
      monthlyFeeAmount: student.monthlyFeeAmount || 1500
    };
    academyService.savePlayer(updated);
    refreshPlayers();
    showToast(`Smart Fee status updated to ${nextStatus} for ${student.name}`, 'success');
  };

  return (
    <div className="space-y-6">
      
      {/* Welcome & Quick Action Hero Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950 text-white rounded-3xl p-6 sm:p-8 border-2 border-slate-900 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center space-x-2">
              <span className="px-3 py-1 bg-amber-500 text-slate-950 rounded-lg text-xs font-black uppercase tracking-wider">
                Coaching & Academy
              </span>
              <span className="text-xs text-blue-300 font-bold hidden sm:inline">
                Player Development & Roster Hub
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight font-display text-white">
              Academy Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed">
              Select sport-wise player rosters (Football, Basketball, Cricket, etc.), evaluate baseline & cycle progress, track Smart Fee status, and generate co-branded player development reports.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
            <button
              onClick={() => {
                const samplePlayer = playersList[0];
                const sampleAssess = assessments.find(a => a.playerId === samplePlayer?.id) || assessments[0];
                if (samplePlayer && sampleAssess) {
                  onViewReport(samplePlayer, sampleAssess);
                } else {
                  showToast('Add athletes and assessments first', 'info');
                }
              }}
              className="w-full sm:w-auto px-5 py-3 bg-white hover:bg-slate-100 text-slate-900 font-black rounded-2xl text-xs uppercase tracking-wider transition shadow-lg flex items-center justify-center space-x-2 active:scale-95 border-2 border-slate-900"
            >
              <FileText size={18} className="text-amber-500" />
              <span>Preview Report</span>
            </button>
            <button
              onClick={() => onNewAssessment()}
              className="w-full sm:w-auto px-5 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-2xl text-xs uppercase tracking-wider transition shadow-lg shadow-amber-500/20 flex items-center justify-center space-x-2 active:scale-95"
            >
              <ClipboardCheck size={18} />
              <span>+ New Assessment</span>
            </button>
            <button
              onClick={onNewPlayer}
              className="w-full sm:w-auto px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-2xl text-xs uppercase tracking-wider transition shadow-lg shadow-blue-600/20 flex items-center justify-center space-x-2 active:scale-95"
            >
              <Plus size={18} />
              <span>+ Add Athlete</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Stat Overview Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Active Players */}
        <div 
          onClick={() => onNavigateTab('players')}
          className="bg-white border-2 border-slate-900 rounded-2xl p-5 shadow-sm hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Players</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition">
              <Users size={16} />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-black text-slate-900">{totalPlayers}</span>
            <span className="text-xs font-bold text-emerald-600">({activePlayers} Active)</span>
          </div>
          <p className="text-[11px] text-slate-500 font-medium mt-1">Across all squads & sports</p>
        </div>

        {/* Assessments Completed */}
        <div 
          onClick={() => onNavigateTab('reports')}
          className="bg-white border-2 border-slate-900 rounded-2xl p-5 shadow-sm hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Evaluations Logged</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition">
              <ClipboardCheck size={16} />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-black text-slate-900">{totalAssessments}</span>
            <span className="text-xs font-bold text-slate-400">Cycles</span>
          </div>
          <p className="text-[11px] text-slate-500 font-medium mt-1">1–5 scale developmental records</p>
        </div>

        {/* Players Improving */}
        <div 
          onClick={() => onNavigateTab('skill-progress')}
          className="bg-white border-2 border-slate-900 rounded-2xl p-5 shadow-sm hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Progression Rate</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition">
              <TrendingUp size={16} />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-black text-slate-900">{improvingCount}</span>
            <span className="text-xs font-bold text-emerald-600">Positive Trend</span>
          </div>
          <p className="text-[11px] text-slate-500 font-medium mt-1">Multi-cycle growth confirmed</p>
        </div>

        {/* Batches & Teams */}
        <div 
          onClick={() => onNavigateTab('teams-batches')}
          className="bg-white border-2 border-slate-900 rounded-2xl p-5 shadow-sm hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Batches & Squads</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-110 transition">
              <Layers size={16} />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-black text-slate-900">{batches.length}</span>
            <span className="text-xs font-bold text-slate-400">Active</span>
          </div>
          <p className="text-[11px] text-slate-500 font-medium mt-1">Group & 1-on-1 programs</p>
        </div>
      </div>

      {/* ============================================================ */}
      {/* GAME-WISE STUDENT ROSTER & RAPID ASSESSMENT HUB */}
      {/* ============================================================ */}
      <div className="bg-white border-2 border-slate-900 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        
        {/* Section Title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-2 border-slate-100 pb-5">
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <span className="px-2.5 py-0.5 bg-amber-500 text-slate-950 rounded-md text-[10px] font-black uppercase tracking-wider">
                Live Roster Dashboard
              </span>
              <span className="text-xs font-bold text-slate-500">
                Sport-Wise Selection & Direct Assessment
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Sport-Wise Player Roster
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Select any sport to view registered players, assess their skills (Baseline, Monthly, 3-Month, Review Period, etc.), manage Smart Fee status, and print/share reports.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => onNavigateTab('players')}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center space-x-1.5"
            >
              <span>Full Player Directory</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {/* Game Selector Chips */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedSport('all')}
            className={`px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-wider whitespace-nowrap transition flex items-center space-x-2 shrink-0 ${
              selectedSport === 'all'
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <span>All Games</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] ${
              selectedSport === 'all' ? 'bg-amber-400 text-slate-950 font-black' : 'bg-slate-200 text-slate-700'
            }`}>
              {playersList.length}
            </span>
          </button>

          {sportCounts.map(tmpl => (
            <button
              key={tmpl.sport}
              type="button"
              onClick={() => setSelectedSport(tmpl.sport)}
              className={`px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-wider whitespace-nowrap transition flex items-center space-x-2 shrink-0 ${
                selectedSport === tmpl.sport
                  ? 'bg-amber-500 text-slate-950 border-2 border-slate-900 shadow-md font-black'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <div 
                className="w-2.5 h-2.5 rounded-full" 
                style={{ backgroundColor: tmpl.color }} 
              />
              <span>{tmpl.name}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                selectedSport === tmpl.sport ? 'bg-slate-950 text-white font-black' : 'bg-slate-200 text-slate-700'
              }`}>
                {tmpl.count}
              </span>
            </button>
          ))}
        </div>

        {/* Filter Controls Bar */}
        <div className="bg-slate-50 border-2 border-slate-200 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          
          <div className="flex flex-wrap items-center gap-2 flex-1">
            {/* Search */}
            <div className="relative min-w-[200px] flex-1 max-w-xs">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search athlete or squad..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-slate-900"
              />
            </div>

            {/* Assessment Cycle Filter */}
            <select
              value={cycleFilter}
              onChange={e => setCycleFilter(e.target.value)}
              className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none"
            >
              <option value="all">All Assessment Cycles</option>
              <option value="Baseline Assessment">Baseline Assessment</option>
              <option value="Monthly Review">Monthly Review</option>
              <option value="3-Month Review">3-Month Review</option>
              <option value="Term 1 Evaluation">Term 1 Evaluation</option>
              <option value="Term 2 Evaluation">Term 2 Evaluation</option>
              <option value="6-Month Review">6-Month Review</option>
              <option value="Annual / Final Assessment">Annual Assessment</option>
            </select>

            {/* Smart Fee Status Filter */}
            <select
              value={feeFilter}
              onChange={e => setFeeFilter(e.target.value)}
              className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none"
            >
              <option value="all">All Fee Statuses</option>
              <option value="paid">Smart Fee: Paid</option>
              <option value="due">Smart Fee: Due</option>
            </select>
          </div>

          {/* Action Row: Selection & Bulk Actions */}
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={handleSelectAllFiltered}
              className="flex items-center space-x-1.5 font-black text-slate-700 hover:text-slate-950"
            >
              {selectedStudentIds.size > 0 && selectedStudentIds.size === filteredStudents.length ? (
                <CheckSquare size={16} className="text-amber-500" />
              ) : (
                <Square size={16} className="text-slate-400" />
              )}
              <span>
                {selectedStudentIds.size === filteredStudents.length && filteredStudents.length > 0
                  ? 'Deselect All'
                  : `Select All (${filteredStudents.length})`}
              </span>
            </button>

            {selectedStudentIds.size > 0 && (
              <button
                type="button"
                onClick={handleBulkDeleteStudents}
                className="px-3.5 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-xl font-black uppercase tracking-wider text-[11px] flex items-center space-x-1 transition shadow-sm animate-pulse"
              >
                <Trash2 size={13} />
                <span>Delete Selected ({selectedStudentIds.size})</span>
              </button>
            )}
          </div>
        </div>

        {/* Students Table / Grid */}
        {filteredStudents.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 space-y-3">
            <p className="text-sm font-black text-slate-700">No athletes found matching criteria.</p>
            <p className="text-xs text-slate-400">Try changing the game selector or search query.</p>
            <button
              onClick={onNewPlayer}
              className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-slate-800 transition"
            >
              + Enroll Athlete to {selectedSport === 'all' ? 'Academy' : SPORT_TEMPLATES[selectedSport as CoachingSportId]?.name}
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-200 text-[10px] font-black uppercase tracking-wider text-slate-400 bg-slate-50/50">
                  <th className="py-3 px-3 w-8"></th>
                  <th className="py-3 px-3">Athlete</th>
                  <th className="py-3 px-3">Sport & Role</th>
                  <th className="py-3 px-3">Latest Assessment</th>
                  <th className="py-3 px-3">Smart Fee</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredStudents.map(student => {
                  const sportTmpl = SPORT_TEMPLATES[student.sport] || SPORT_TEMPLATES.football;
                  const latestAssess = academyService.getLatestAssessmentForPlayer(student.id);
                  const levelStyle = latestAssess ? getDevelopmentLevelColor(latestAssess.developmentLevel) : null;
                  const isSelected = selectedStudentIds.has(student.id);
                  const isFeePaid = student.feeStatus !== 'Due';

                  return (
                    <tr 
                      key={student.id}
                      className={`hover:bg-slate-50/80 transition ${isSelected ? 'bg-amber-50/30' : ''}`}
                    >
                      {/* Checkbox */}
                      <td className="py-3.5 px-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectStudent(student.id)}
                          className="w-4 h-4 rounded text-amber-500 border-2 border-slate-900 focus:ring-0 cursor-pointer accent-amber-500"
                        />
                      </td>

                      {/* Athlete Info */}
                      <td className="py-3.5 px-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-900 text-amber-400 font-black flex items-center justify-center text-sm shrink-0">
                            {student.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-black text-slate-900 hover:text-blue-600 transition">
                              {student.name}
                            </p>
                            <p className="text-[11px] text-slate-400 font-medium">
                              {student.age} yrs • {student.batchOrTeam || 'Squad Batch'}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Sport & Role */}
                      <td className="py-3.5 px-3">
                        <div>
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-800 rounded text-[10px] font-black uppercase">
                            {sportTmpl.name}
                          </span>
                          <p className="text-[11px] text-slate-500 font-semibold mt-0.5">
                            {student.position}
                          </p>
                        </div>
                      </td>

                      {/* Assessment Status */}
                      <td className="py-3.5 px-3">
                        {latestAssess ? (
                          <div className="space-y-0.5">
                            <div className="flex items-center space-x-1.5">
                              <span className="font-black text-slate-900 text-xs">
                                {latestAssess.overallScore}/100
                              </span>
                              <span className={`px-1.5 py-0.2 rounded text-[9px] font-black uppercase border ${levelStyle?.bg} ${levelStyle?.text} ${levelStyle?.border}`}>
                                {latestAssess.developmentLevel}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-400 font-medium">
                              {latestAssess.assessmentType} ({latestAssess.assessmentDate})
                            </p>
                          </div>
                        ) : (
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-400 rounded text-[10px] font-bold">
                            Pending First Review
                          </span>
                        )}
                      </td>

                      {/* Smart Fee Status Badge & Toggle */}
                      <td className="py-3.5 px-3">
                        <button
                          type="button"
                          onClick={() => handleToggleFeeStatus(student)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition flex items-center space-x-1 ${
                            isFeePaid 
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' 
                              : 'bg-red-100 text-red-800 hover:bg-red-200'
                          }`}
                          title="Click to toggle fee payment status"
                        >
                          <CreditCard size={12} />
                          <span>{isFeePaid ? 'Paid' : 'Due (₹1,500)'}</span>
                        </button>
                      </td>

                      {/* Action Buttons */}
                      <td className="py-3.5 px-3 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            onClick={() => onNewAssessment(student.id)}
                            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-[11px] uppercase tracking-wider transition shadow-sm"
                            title="Conduct assessment for student"
                          >
                            Assess
                          </button>

                          {latestAssess && (
                            <button
                              onClick={() => onViewReport(student, latestAssess)}
                              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-xl text-[11px] uppercase tracking-wider transition shadow-sm flex items-center space-x-1"
                              title="Open Parent Report"
                            >
                              <FileText size={12} />
                              <span className="hidden sm:inline">Report</span>
                            </button>
                          )}

                          <button
                            onClick={() => handleDeleteSingleStudent(student.id, student.name)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Delete profile"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* Two Column Layout: Recent Evaluations & Upcoming Reassessments */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Recent Evaluations */}
        <div className="lg:col-span-2 bg-white border-2 border-slate-900 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b-2 border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-black text-slate-900 uppercase tracking-tight">
                Recent Player Evaluations
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Latest completed development reports with instant parent review.
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('reports')}
              className="text-xs font-black uppercase tracking-wider text-blue-600 hover:text-blue-800 flex items-center space-x-1"
            >
              <span>View All</span>
              <ChevronRight size={14} />
            </button>
          </div>

          <div className="space-y-3">
            {recentAssessments.map(record => {
              const player = playersList.find(p => p.id === record.playerId);
              const sportTemplate = SPORT_TEMPLATES[record.sport] || SPORT_TEMPLATES.football;
              const levelStyle = getDevelopmentLevelColor(record.developmentLevel);

              return (
                <div
                  key={record.id}
                  className="bg-slate-50 hover:bg-slate-100/80 border-2 border-slate-200 hover:border-slate-900 rounded-2xl p-4 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center space-x-3.5">
                    <div className="w-12 h-12 rounded-xl bg-slate-900 text-amber-400 font-black flex items-center justify-center text-base flex-shrink-0">
                      {record.overallScore}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="text-sm font-black text-slate-900">{record.playerName}</h3>
                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase border ${levelStyle.bg} ${levelStyle.text} ${levelStyle.border}`}>
                          {record.developmentLevel}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">
                        {sportTemplate.name} • {record.position} • {record.assessmentType} ({record.assessmentDate})
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {player && (
                      <button
                        onClick={() => onViewReport(player, record)}
                        className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-wider transition shadow-sm flex items-center space-x-1.5"
                      >
                        <FileText size={14} className="text-amber-400" />
                        <span>View Report</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Col: Scheduled Reviews & Frameworks */}
        <div className="space-y-6">
          
          {/* Upcoming Reviews */}
          <div className="bg-white border-2 border-slate-900 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center space-x-2">
              <Calendar size={18} className="text-blue-600" />
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                Scheduled Reviews
              </h2>
            </div>

            <div className="space-y-2.5">
              {upcomingReviews.slice(0, 4).map(({ player, latestAssessment, nextDate }) => (
                <div key={player.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-black text-slate-900">{player.name}</p>
                    <p className="text-[11px] text-slate-500">{player.sport.toUpperCase()} • {player.batchOrTeam || '1-on-1'}</p>
                  </div>
                  <button
                    onClick={() => onNewAssessment(player.id)}
                    className="px-2.5 py-1 bg-slate-900 text-white rounded-lg text-[10px] font-black uppercase tracking-wider hover:bg-slate-800 transition"
                  >
                    Assess
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Supported Sport Frameworks */}
          <div className="bg-slate-900 text-white border-2 border-slate-900 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black uppercase tracking-tight text-white flex items-center space-x-2">
                <Trophy size={16} className="text-amber-400" />
                <span>Sport Frameworks</span>
              </h2>
              <span className="text-[10px] font-bold text-slate-400">Extensible</span>
            </div>

            <div className="space-y-2">
              {Object.values(SPORT_TEMPLATES).map(tmpl => (
                <div
                  key={tmpl.id}
                  onClick={() => onNavigateTab('sports')}
                  className="p-2.5 bg-slate-800/80 hover:bg-slate-800 rounded-xl border border-slate-700 transition cursor-pointer flex items-center justify-between"
                >
                  <div className="flex items-center space-x-2.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: tmpl.color }} />
                    <span className="text-xs font-black text-slate-200">{tmpl.name}</span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400">
                    {tmpl.skills.length} Skills
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
