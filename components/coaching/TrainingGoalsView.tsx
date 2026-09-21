import React, { useState, useMemo } from 'react';
import { 
  Target, 
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  Plus, 
  Trash2, 
  User, 
  Award, 
  Activity,
  Zap,
  Filter
} from 'lucide-react';
import { 
  academyService, 
  PlayerProfileData, 
  TrainingGoal, 
  SPORT_TEMPLATES 
} from '../../services/academyService';
import { showToast } from '../../services/toast';

export const TrainingGoalsView: React.FC = () => {
  const players = useMemo(() => academyService.getPlayers(), []);
  const assessments = useMemo(() => academyService.getAssessments(), []);

  const [selectedPlayerFilter, setSelectedPlayerFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Collect all goals from latest assessments
  const allGoalsWithPlayer = useMemo(() => {
    const list: { player: PlayerProfileData; goal: TrainingGoal; assessmentId: string }[] = [];
    players.forEach(p => {
      const latest = academyService.getLatestAssessmentForPlayer(p.id);
      if (latest && latest.nextGoals) {
        latest.nextGoals.forEach(g => {
          list.push({ player: p, goal: g, assessmentId: latest.id });
        });
      }
    });
    return list;
  }, [players, assessments]);

  const filteredGoals = useMemo(() => {
    return allGoalsWithPlayer.filter(item => {
      const matchPlayer = selectedPlayerFilter === 'all' || item.player.id === selectedPlayerFilter;
      const matchStatus = statusFilter === 'all' || item.goal.status === statusFilter;
      return matchPlayer && matchStatus;
    });
  }, [allGoalsWithPlayer, selectedPlayerFilter, statusFilter]);

  const handleToggleStatus = (assessmentId: string, goalId: string) => {
    const all = academyService.getAssessments();
    const assess = all.find(a => a.id === assessmentId);
    if (assess && assess.nextGoals) {
      const target = assess.nextGoals.find(g => g.id === goalId);
      if (target) {
        if (target.status === 'Not Started') target.status = 'In Progress';
        else if (target.status === 'In Progress') target.status = 'Achieved';
        else target.status = 'In Progress';

        academyService.saveAssessment(assess);
        showToast(`Goal status updated to ${target.status}`, 'success');
        // Force refresh by re-reading
        window.dispatchEvent(new Event('storage'));
      }
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-white border-2 border-slate-900 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 rounded-md text-[10px] font-black uppercase tracking-wider">
              Target Milestones & Action Plans
            </span>
            <span className="text-xs text-slate-400 font-bold">
              Next 3-Month Development Focus
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-display">
            Training Goals & Development Action Plans
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Link identified assessment priorities to specific, measurable milestones and track status.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <select
            value={selectedPlayerFilter}
            onChange={e => setSelectedPlayerFilter(e.target.value)}
            className="bg-slate-50 border-2 border-slate-900 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none"
          >
            <option value="all">All Athletes</option>
            {players.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-slate-50 border-2 border-slate-900 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="In Progress">In Progress</option>
            <option value="Achieved">Achieved</option>
            <option value="Not Started">Not Started</option>
          </select>
        </div>
      </div>

      {/* Goals Cards List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredGoals.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-white border-2 border-slate-900 rounded-3xl p-6">
            <Target size={36} className="mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-black text-slate-700">No active goals match the filter.</p>
            <p className="text-xs text-slate-400 mt-1">Goals are created during assessment evaluation or via AI suggestions.</p>
          </div>
        ) : (
          filteredGoals.map(({ player, goal, assessmentId }) => {
            const isAchieved = goal.status === 'Achieved';

            return (
              <div
                key={goal.id}
                className="bg-white border-2 border-slate-900 rounded-3xl p-5 shadow-sm hover:shadow-md transition space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 rounded-md text-[10px] font-black uppercase">
                      {goal.skill}
                    </span>
                    <button
                      onClick={() => handleToggleStatus(assessmentId, goal.id)}
                      className={`px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider transition border ${
                        isAchieved
                          ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                          : 'bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200'
                      }`}
                    >
                      {goal.status} {isAchieved ? '✓' : '↻'}
                    </button>
                  </div>

                  <h3 className="text-sm font-black text-slate-900 leading-snug">
                    {goal.goal}
                  </h3>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-1">
                    <p><span className="font-bold text-slate-900">Target Milestone:</span> {goal.target}</p>
                    <p className="text-[11px] text-slate-500">Review Window: {goal.startDate} → {goal.reviewDate || 'Next Cycle'}</p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 rounded-full bg-slate-900 text-amber-400 flex items-center justify-center font-black text-[10px]">
                      {player.name.charAt(0)}
                    </div>
                    <span className="font-bold text-slate-800">{player.name}</span>
                  </div>
                  <span className="text-[11px]">{player.sport.toUpperCase()} • {player.position}</span>
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
