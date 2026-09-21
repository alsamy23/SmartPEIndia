import React, { useMemo } from 'react';
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
  ChevronRight
} from 'lucide-react';
import { 
  academyService, 
  PlayerProfileData, 
  PlayerAssessmentRecord, 
  SPORT_TEMPLATES, 
  getDevelopmentLevelColor 
} from '../../services/academyService';

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
  const players = useMemo(() => academyService.getPlayers(), []);
  const assessments = useMemo(() => academyService.getAssessments(), []);
  const batches = useMemo(() => academyService.getBatches(), []);

  // Compute key stats
  const totalPlayers = players.length;
  const activePlayers = players.filter(p => p.active).length;
  const totalAssessments = assessments.length;

  // Assessments due (where nextAssessmentDate is past or within 14 days)
  const now = new Date();
  const upcomingReviews = useMemo(() => {
    return players.map(p => {
      const latest = academyService.getLatestAssessmentForPlayer(p.id);
      return {
        player: p,
        latestAssessment: latest,
        nextDate: latest?.nextAssessmentDate || p.createdAt
      };
    }).sort((a, b) => new Date(a.nextDate).getTime() - new Date(b.nextDate).getTime());
  }, [players]);

  // Improving players (players who have >= 2 assessments and latest > first)
  const improvingCount = useMemo(() => {
    let count = 0;
    players.forEach(p => {
      const history = academyService.getAssessmentsForPlayer(p.id);
      if (history.length >= 2) {
        if (history[history.length - 1].overallScore > history[0].overallScore) {
          count++;
        }
      }
    });
    return count;
  }, [players]);

  // Recent assessments list
  const recentAssessments = useMemo(() => {
    return [...assessments]
      .sort((a, b) => new Date(b.assessmentDate).getTime() - new Date(a.assessmentDate).getTime())
      .slice(0, 5);
  }, [assessments]);

  return (
    <div className="space-y-6">
      
      {/* Welcome & Quick Action Hero Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950 text-white rounded-3xl p-6 sm:p-8 border-2 border-slate-900 shadow-xl relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center space-x-2">
              <span className="px-3 py-1 bg-amber-500 text-slate-950 rounded-lg text-xs font-black uppercase tracking-wider">
                Athletic Development Engine
              </span>
              <span className="text-xs text-blue-300 font-bold hidden sm:inline">
                School & Academy Coaching Hub
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight font-display text-white">
              Coach & Squad Command Hub
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed">
              Track individual athlete development journeys across sports, score 1–5 technical & tactical competencies, generate longitudinal progress charts, and deliver professional parent reports.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
            <button
              onClick={() => {
                const dummyPlayer = players.find(p => p.id === 'player-fb-01') || players[0];
                const dummyAssessment = assessments.find(a => a.playerId === dummyPlayer.id) || assessments[0];
                if (dummyPlayer && dummyAssessment) {
                  onViewReport(dummyPlayer, dummyAssessment);
                }
              }}
              className="w-full sm:w-auto px-5 py-3 bg-white hover:bg-slate-100 text-slate-900 font-black rounded-2xl text-xs uppercase tracking-wider transition shadow-lg flex items-center justify-center space-x-2 active:scale-95 border-2 border-slate-900"
            >
              <FileText size={18} className="text-amber-500" />
              <span>Preview Sample Report</span>
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
              const player = players.find(p => p.id === record.playerId);
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
                        {sportTemplate.name} • {record.position} • {record.assessmentType}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Date: {record.assessmentDate} • Evaluated by {record.coachName}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 self-end sm:self-center">
                    {player && (
                      <button
                        onClick={() => onViewReport(player, record)}
                        className="px-3.5 py-1.5 bg-white border-2 border-slate-900 hover:bg-slate-900 hover:text-white text-slate-900 rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center space-x-1.5"
                      >
                        <FileText size={14} />
                        <span>Parent Report</span>
                      </button>
                    )}
                    <button
                      onClick={() => onNewAssessment(record.playerId)}
                      className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-black uppercase tracking-wider transition shadow-sm flex items-center space-x-1"
                      title="Conduct next cycle review"
                    >
                      <Plus size={14} />
                      <span>Reassess</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 1 Col: Upcoming Review Reminders & Sport Frameworks */}
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
