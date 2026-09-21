import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  BarChart3, 
  User, 
  Activity, 
  Award, 
  CheckCircle2, 
  Calendar, 
  ShieldCheck, 
  ChevronRight,
  Flame,
  ArrowUpRight
} from 'lucide-react';
import { 
  academyService, 
  PlayerProfileData, 
  PlayerAssessmentRecord, 
  SPORT_TEMPLATES, 
  COACHING_SCALE_LABELS, 
  getDevelopmentLevelColor 
} from '../../services/academyService';

export const SkillProgressView: React.FC = () => {
  const players = useMemo(() => academyService.getPlayers(), []);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>(players[0]?.id || '');

  const selectedPlayer = useMemo(() => {
    return players.find(p => p.id === selectedPlayerId) || null;
  }, [players, selectedPlayerId]);

  const playerAssessments = useMemo(() => {
    if (!selectedPlayerId) return [];
    return academyService.getAssessmentsForPlayer(selectedPlayerId);
  }, [selectedPlayerId]);

  const latestAssessment = useMemo(() => {
    return playerAssessments.length > 0 ? playerAssessments[playerAssessments.length - 1] : null;
  }, [playerAssessments]);

  const firstAssessment = useMemo(() => {
    return playerAssessments.length > 0 ? playerAssessments[0] : null;
  }, [playerAssessments]);

  const sportTemplate = useMemo(() => {
    if (!selectedPlayer) return SPORT_TEMPLATES.football;
    return SPORT_TEMPLATES[selectedPlayer.sport] || SPORT_TEMPLATES.football;
  }, [selectedPlayer]);

  // Improvement calculation
  const scoreDiff = useMemo(() => {
    if (!latestAssessment || !firstAssessment || playerAssessments.length < 2) return 0;
    return latestAssessment.overallScore - firstAssessment.overallScore;
  }, [latestAssessment, firstAssessment, playerAssessments]);

  return (
    <div className="space-y-6">
      
      {/* Header & Player Selector */}
      <div className="bg-white border-2 border-slate-900 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 rounded-md text-[10px] font-black uppercase tracking-wider">
              Longitudinal Development Tracker
            </span>
            <span className="text-xs text-slate-400 font-bold">
              Skill Trajectories & Multi-Cycle Trends
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-display">
            Skill Progress & Analytics
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Visualize horizontal skill ratings, domain radar balances, and cycle-over-cycle progress.
          </p>
        </div>

        {/* Player Selector dropdown */}
        <div className="w-full md:w-72">
          <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
            Select Athlete
          </label>
          <select
            value={selectedPlayerId}
            onChange={e => setSelectedPlayerId(e.target.value)}
            className="w-full bg-slate-50 border-2 border-slate-900 rounded-2xl px-4 py-2.5 text-xs font-bold text-slate-900 focus:outline-none"
          >
            {players.map(p => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.sport.toUpperCase()} • {p.position})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Hero Progression Banner for Selected Player */}
      {selectedPlayer && (
        <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 border-2 border-slate-900 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-2xl bg-amber-500 text-slate-950 font-black text-2xl flex items-center justify-center shadow-lg flex-shrink-0">
              {selectedPlayer.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-black">{selectedPlayer.name}</h2>
                <span className="px-2.5 py-0.5 bg-blue-500 text-white rounded-md text-[10px] font-black uppercase">
                  {sportTemplate.name}
                </span>
              </div>
              <p className="text-xs text-slate-300 font-medium mt-0.5">
                {selectedPlayer.position} • Squad: {selectedPlayer.batchOrTeam || 'Individual'} • Evaluated across {playerAssessments.length} cycles
              </p>
            </div>
          </div>

          {/* Score Metrics */}
          <div className="flex items-center space-x-4 bg-slate-800/80 p-4 rounded-2xl border border-slate-700">
            <div className="text-right">
              <span className="text-[10px] font-black uppercase text-slate-400 block">Current Level</span>
              <span className="text-sm font-black text-amber-400">
                {latestAssessment?.developmentLevel || 'Pending'}
              </span>
            </div>
            <div className="h-10 w-px bg-slate-700" />
            <div className="text-center">
              <span className="text-2xl font-black text-white">{latestAssessment?.overallScore || 0}</span>
              <span className="text-[9px] font-bold text-slate-400 block uppercase">/ 100 Score</span>
            </div>
            {playerAssessments.length >= 2 && (
              <>
                <div className="h-10 w-px bg-slate-700" />
                <div className="text-left">
                  <span className="text-[10px] font-black uppercase text-slate-400 block">Net Growth</span>
                  <span className={`text-sm font-black flex items-center ${scoreDiff >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    <ArrowUpRight size={14} className="mr-0.5" />
                    +{scoreDiff} pts
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Longitudinal Progress Chart (Initial -> 3-Month -> 6-Month) */}
      <div className="bg-white border-2 border-slate-900 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b-2 border-slate-100 pb-4 gap-2">
          <div>
            <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">
              Longitudinal Development Progression
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Overall development score trend across consecutive assessment review milestones.
            </p>
          </div>
          <span className="text-xs font-bold text-slate-400">
            {playerAssessments.length} Assessment Milestones Recorded
          </span>
        </div>

        {playerAssessments.length === 0 ? (
          <p className="text-xs text-slate-400 italic py-8 text-center bg-slate-50 rounded-2xl">
            No assessment milestones recorded yet for this player.
          </p>
        ) : (
          <div className="space-y-4">
            {/* Visual Step-by-Step Milestones */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {playerAssessments.map((record, idx) => {
                const levelStyle = getDevelopmentLevelColor(record.developmentLevel);
                return (
                  <div 
                    key={record.id}
                    className="p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl space-y-3 relative overflow-hidden"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase text-slate-400">
                        Milestone {idx + 1}
                      </span>
                      <span className="text-[10px] font-bold text-slate-500">{record.assessmentDate}</span>
                    </div>

                    <div>
                      <h4 className="text-sm font-black text-slate-900">{record.assessmentType}</h4>
                      <span className={`inline-block mt-1 text-[9px] font-black px-2 py-0.5 rounded border ${levelStyle.bg} ${levelStyle.text} ${levelStyle.border}`}>
                        {record.developmentLevel}
                      </span>
                    </div>

                    <div className="flex items-baseline justify-between pt-2 border-t border-slate-200">
                      <span className="text-2xl font-black text-slate-900">{record.overallScore}</span>
                      <span className="text-xs font-bold text-slate-400">/ 100 points</span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                      <div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: `${record.overallScore}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Horizontal Skill Bar Chart (1–5 Coaching Scale) */}
      {latestAssessment && (
        <div className="bg-white border-2 border-slate-900 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b-2 border-slate-100 pb-4 gap-2">
            <div>
              <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">
                Skill Competency Breakdown (1–5 Coaching Scale)
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Visual rating across each individual assessed technical, tactical, and behavioral skill.
              </p>
            </div>
            <span className="text-xs font-black text-blue-700 bg-blue-50 px-3 py-1 rounded-xl border border-blue-200">
              Latest: {latestAssessment.assessmentType}
            </span>
          </div>

          <div className="space-y-3.5">
            {Object.entries(latestAssessment.skillRatings).map(([skillId, rating]) => {
              const skillObj = sportTemplate.skills.find(s => s.id === skillId);
              if (!skillObj) return null;
              const scale = COACHING_SCALE_LABELS[rating] || COACHING_SCALE_LABELS[3];
              const percentage = (rating / 5) * 100;

              // Check if initial rating existed to show delta
              const initialRating = firstAssessment?.skillRatings[skillId];
              const delta = initialRating !== undefined ? rating - initialRating : 0;

              return (
                <div key={skillId} className="space-y-1.5 p-3 rounded-2xl bg-slate-50/70 border border-slate-200">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-black text-slate-900">{skillObj.name}</span>
                      <span className="text-[9px] px-1.5 py-0.2 bg-slate-200 text-slate-700 rounded uppercase font-black">
                        {skillObj.category}
                      </span>
                    </div>

                    <div className="flex items-center space-x-3">
                      {delta !== 0 && (
                        <span className={`text-[10px] font-black ${delta > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
                          {delta > 0 ? `+${delta} pts growth` : `${delta} pts`}
                        </span>
                      )}
                      <span className="font-black" style={{ color: scale.color }}>
                        {rating} / 5 • {scale.title}
                      </span>
                    </div>
                  </div>

                  {/* Horizontal Bar */}
                  <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                    <div
                      className="h-3 rounded-full transition-all duration-500"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: scale.color
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4 Pillars Comparison Cards */}
      {latestAssessment && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border-2 border-slate-900 rounded-2xl p-4 shadow-sm">
            <span className="text-[10px] font-black uppercase text-slate-400 block mb-1">Technical Domain</span>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black text-slate-900">{latestAssessment.domainScores.technical}</span>
              <span className="text-xs font-bold text-slate-400">/ 100</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 mt-2">
              <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${latestAssessment.domainScores.technical}%` }} />
            </div>
          </div>

          <div className="bg-white border-2 border-slate-900 rounded-2xl p-4 shadow-sm">
            <span className="text-[10px] font-black uppercase text-slate-400 block mb-1">Tactical Domain</span>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black text-slate-900">{latestAssessment.domainScores.tactical}</span>
              <span className="text-xs font-bold text-slate-400">/ 100</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 mt-2">
              <div className="bg-cyan-600 h-2 rounded-full" style={{ width: `${latestAssessment.domainScores.tactical}%` }} />
            </div>
          </div>

          <div className="bg-white border-2 border-slate-900 rounded-2xl p-4 shadow-sm">
            <span className="text-[10px] font-black uppercase text-slate-400 block mb-1">Physical Domain</span>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black text-slate-900">{latestAssessment.domainScores.physical}</span>
              <span className="text-xs font-bold text-slate-400">/ 100</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 mt-2">
              <div className="bg-amber-600 h-2 rounded-full" style={{ width: `${latestAssessment.domainScores.physical}%` }} />
            </div>
          </div>

          <div className="bg-white border-2 border-slate-900 rounded-2xl p-4 shadow-sm">
            <span className="text-[10px] font-black uppercase text-slate-400 block mb-1">Behaviour Domain</span>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black text-slate-900">{latestAssessment.domainScores.gameBehaviour}</span>
              <span className="text-xs font-bold text-slate-400">/ 100</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 mt-2">
              <div className="bg-emerald-600 h-2 rounded-full" style={{ width: `${latestAssessment.domainScores.gameBehaviour}%` }} />
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
