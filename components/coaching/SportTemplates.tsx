import React, { useState, useMemo } from 'react';
import { 
  Trophy, 
  Activity, 
  Target, 
  Layers, 
  ShieldCheck, 
  BookOpen, 
  Flame, 
  Zap,
  CheckCircle2,
  ChevronRight,
  Search,
  Filter,
  Sparkles,
  Sliders,
  Check
} from 'lucide-react';
import { 
  SPORT_TEMPLATES, 
  CoachingSportId, 
  COACHING_SCALE_LABELS,
  SportTemplate 
} from '../../services/academyService';
import { SKILL_PRESETS_META } from '../../services/coachingSkillsDatabase';

export const SportTemplates: React.FC = () => {
  const [selectedSport, setSelectedSport] = useState<CoachingSportId>('football');
  const [selectedPillar, setSelectedPillar] = useState<'all' | 'technical' | 'tactical' | 'physical' | 'gameBehaviour'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPresetFilter, setSelectedPresetFilter] = useState<'all' | 'core' | 'development' | 'master40'>('all');

  const currentTemplate: SportTemplate = SPORT_TEMPLATES[selectedSport] || SPORT_TEMPLATES.football;

  const pillarCounts = useMemo(() => {
    const counts = { technical: 0, tactical: 0, physical: 0, gameBehaviour: 0 };
    currentTemplate.skills.forEach(s => {
      const cat = s.category as keyof typeof counts;
      if (counts[cat] !== undefined) counts[cat]++;
    });
    return counts;
  }, [currentTemplate]);

  const filteredSkills = useMemo(() => {
    return currentTemplate.skills.filter(s => {
      // Pillar filter
      if (selectedPillar !== 'all' && s.category !== selectedPillar) return false;

      // Preset filter
      if (selectedPresetFilter === 'core' && !s.isCore) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches = s.name.toLowerCase().includes(q) || 
                        s.description.toLowerCase().includes(q) || 
                        s.coachingCue.toLowerCase().includes(q);
        if (!matches) return false;
      }

      return true;
    });
  }, [currentTemplate, selectedPillar, selectedPresetFilter, searchQuery]);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-white border-2 border-slate-900 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-md text-[10px] font-black uppercase tracking-wider">
              Curriculum & 40-Skill Libraries
            </span>
            <span className="text-xs text-slate-400 font-bold">
              Standardized 1–5 Youth Coaching Competencies
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-display">
            Sport Frameworks & Skill Matrices
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Explore comprehensive 40-skill frameworks, foundational core criteria, coaching cues, and training drills.
          </p>
        </div>

        {/* Sport Selector Chips */}
        <div className="flex flex-wrap gap-2">
          {Object.values(SPORT_TEMPLATES).map(tmpl => {
            const isSelected = selectedSport === tmpl.id;
            return (
              <button
                key={tmpl.id}
                onClick={() => setSelectedSport(tmpl.id)}
                className={`px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition border-2 flex items-center space-x-2 ${
                  isSelected
                    ? 'bg-slate-900 text-white border-slate-900 shadow-md scale-105'
                    : 'bg-white text-slate-700 border-slate-300 hover:border-slate-900'
                }`}
              >
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: tmpl.color }} />
                <span>{tmpl.name.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Sport Overview Hero */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 border-2 border-slate-900 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs font-black uppercase tracking-wider text-amber-400">
              {currentTemplate.tagline}
            </span>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight mt-0.5">{currentTemplate.name}</h2>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3.5 py-1.5 bg-emerald-500/20 text-emerald-300 rounded-xl text-xs font-black border border-emerald-400/30 flex items-center space-x-1">
              <Trophy className="w-3.5 h-3.5" />
              <span>{currentTemplate.skills.length} Competencies</span>
            </span>
            <span className="px-3.5 py-1.5 bg-slate-800 rounded-xl text-xs font-bold border border-slate-700">
              {currentTemplate.positions.length} Playing Roles
            </span>
          </div>
        </div>

        {/* Pillar Breakdown Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800">
          <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Technical Skills</span>
            <span className="text-base font-black text-emerald-400">{pillarCounts.technical} Criteria</span>
          </div>
          <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Tactical & Game IQ</span>
            <span className="text-base font-black text-blue-400">{pillarCounts.tactical} Criteria</span>
          </div>
          <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Physical Conditioning</span>
            <span className="text-base font-black text-amber-400">{pillarCounts.physical} Criteria</span>
          </div>
          <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Game Behaviour & Mind</span>
            <span className="text-base font-black text-purple-400">{pillarCounts.gameBehaviour} Criteria</span>
          </div>
        </div>

        {/* Positions Pills */}
        <div className="pt-2 border-t border-slate-800">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">Specialized Playing Roles</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
            {currentTemplate.positions.map(pos => (
              <div key={pos.id} className="p-3 bg-slate-800/80 rounded-xl border border-slate-700">
                <p className="text-xs font-black text-amber-300">{pos.name}</p>
                <p className="text-[11px] text-slate-400 leading-snug mt-1">{pos.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Preset Syllabus Packages Overview */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-5 h-5 text-amber-600" />
          <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">
            Flexible Skill Criteria Presets for Coaches
          </h3>
        </div>
        <p className="text-xs text-slate-700 font-medium">
          Coaches and teachers can choose to evaluate basic essentials only (10-12 skills), an intermediate academy syllabus (20 skills), or the complete 40-skill master matrix.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {SKILL_PRESETS_META.filter(p => ['core', 'development', 'master40'].includes(p.id)).map(preset => (
            <div 
              key={preset.id}
              onClick={() => setSelectedPresetFilter(preset.id as any)}
              className={`p-4 bg-white rounded-2xl border-2 transition cursor-pointer ${
                selectedPresetFilter === preset.id 
                  ? 'border-slate-900 ring-2 ring-amber-400 shadow-md' 
                  : 'border-amber-200 hover:border-amber-400'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-amber-100 text-amber-900">
                  {preset.badge}
                </span>
                {selectedPresetFilter === preset.id && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
              </div>
              <h4 className="text-xs font-black text-slate-900">{preset.name}</h4>
              <p className="text-[11px] text-slate-600 mt-1">{preset.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Skills Matrix Explorer */}
      <div className="bg-white border-2 border-slate-900 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b-2 border-slate-100 pb-4 gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">
                Skill Competencies & Coaching Cues
              </h3>
              <span className="px-2 py-0.5 bg-slate-900 text-white rounded text-[10px] font-black">
                {filteredSkills.length} of {currentTemplate.skills.length} Listed
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Browse technical cues, instructional guidance, and baseline scoring scale.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search skills..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded-xl pl-8 pr-3 py-1.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-slate-900 w-36 sm:w-48"
              />
            </div>

            {/* Pillar Filter Tabs */}
            <div className="flex items-center space-x-1 overflow-x-auto">
              {(['all', 'technical', 'tactical', 'physical', 'gameBehaviour'] as const).map(pill => (
                <button
                  key={pill}
                  onClick={() => setSelectedPillar(pill)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition ${
                    selectedPillar === pill
                      ? 'bg-slate-900 text-white shadow-md'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {pill === 'gameBehaviour' ? 'Behaviour' : pill}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Skills Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredSkills.map(skill => {
            const pillarBadgeColor = 
              skill.category === 'technical' ? 'bg-emerald-100 text-emerald-800' :
              skill.category === 'tactical' ? 'bg-blue-100 text-blue-800' :
              skill.category === 'physical' ? 'bg-amber-100 text-amber-900' :
              'bg-purple-100 text-purple-800';

            return (
              <div
                key={skill.id}
                className="p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl space-y-2 hover:border-slate-900 transition"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${pillarBadgeColor}`}>
                      {skill.category}
                    </span>
                    {skill.isCore && (
                      <span className="text-[10px] font-black px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded">
                        ★ Core
                      </span>
                    )}
                  </div>
                  {skill.positionSpecificFor && skill.positionSpecificFor.length > 0 && (
                    <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-blue-100 text-blue-800">
                      {skill.positionSpecificFor.join(', ')}
                    </span>
                  )}
                </div>

                <h4 className="text-sm font-black text-slate-900">{skill.name}</h4>
                <p className="text-xs text-slate-600 font-medium leading-relaxed">{skill.description}</p>

                {skill.coachingCue && (
                  <div className="pt-2 border-t border-slate-200">
                    <span className="text-xs text-emerald-700 font-bold bg-emerald-50/80 px-2.5 py-1 rounded-lg block">
                      💡 Coaching Cue: {skill.coachingCue}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Recommended Training Drills */}
        {currentTemplate.drills && currentTemplate.drills.length > 0 && (
          <div className="pt-6 border-t-2 border-slate-100 space-y-4">
            <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">
              Recommended Training Drills & Protocols
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {currentTemplate.drills.map(drill => (
                <div key={drill.id} className="p-4 bg-blue-50/70 border-2 border-blue-900/20 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-blue-200 text-blue-900 rounded">
                      Focus: {drill.skillName}
                    </span>
                    <span className="text-[10px] font-bold text-slate-500">
                      Intensity: <strong>{drill.intensity}</strong>
                    </span>
                  </div>
                  <h4 className="text-xs font-black text-blue-950">{drill.drillName}</h4>
                  <p className="text-xs text-slate-700 font-medium">{drill.description}</p>
                  <p className="text-[10px] text-blue-700 font-bold">
                    ⏱ Recommended Frequency: {drill.recommendedFrequency}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
