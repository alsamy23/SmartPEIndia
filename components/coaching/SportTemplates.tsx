import React, { useState } from 'react';
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
  ChevronRight
} from 'lucide-react';
import { 
  SPORT_TEMPLATES, 
  CoachingSportId, 
  COACHING_SCALE_LABELS,
  SportTemplate 
} from '../../services/academyService';

export const SportTemplates: React.FC = () => {
  const [selectedSport, setSelectedSport] = useState<CoachingSportId>('football');
  const [selectedPillar, setSelectedPillar] = useState<'all' | 'technical' | 'tactical' | 'physical' | 'gameBehaviour'>('all');

  const currentTemplate: SportTemplate = SPORT_TEMPLATES[selectedSport] || SPORT_TEMPLATES.football;

  const filteredSkills = currentTemplate.skills.filter(s => {
    if (selectedPillar === 'all') return true;
    return s.category === selectedPillar;
  });

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-white border-2 border-slate-900 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-md text-[10px] font-black uppercase tracking-wider">
              Curriculum & Skill Libraries
            </span>
            <span className="text-xs text-slate-400 font-bold">
              Standardized 1–5 Youth Coaching Competencies
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-display">
            Sport Frameworks & Skill Libraries
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Explore core and positional competencies, coaching cues, and recommended drills across sports.
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="text-xs font-black uppercase tracking-wider text-amber-400">
              {currentTemplate.tagline}
            </span>
            <h2 className="text-2xl font-black tracking-tight">{currentTemplate.name}</h2>
          </div>
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 bg-slate-800 rounded-xl text-xs font-bold border border-slate-700">
              {currentTemplate.skills.length} Competencies
            </span>
            <span className="px-3 py-1 bg-slate-800 rounded-xl text-xs font-bold border border-slate-700">
              {currentTemplate.positions.length} Playing Roles
            </span>
          </div>
        </div>

        {/* Positions Pills */}
        <div className="pt-2 border-t border-slate-800">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">Available Playing Roles</p>
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

      {/* Pillar Filter Tabs */}
      <div className="bg-white border-2 border-slate-900 rounded-3xl p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b-2 border-slate-100 pb-4 gap-4">
          <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">
            Skill Competencies & Coaching Cues
          </h3>

          <div className="flex items-center space-x-1.5 overflow-x-auto pb-2 sm:pb-0">
            {(['all', 'technical', 'tactical', 'physical', 'gameBehaviour'] as const).map(pill => (
              <button
                key={pill}
                onClick={() => setSelectedPillar(pill)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition ${
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

        {/* Skills Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredSkills.map(skill => (
            <div
              key={skill.id}
              className="p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl space-y-2 hover:border-slate-900 transition"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <h4 className="text-sm font-black text-slate-900">{skill.name}</h4>
                  <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-slate-200 text-slate-700">
                    {skill.category}
                  </span>
                </div>
                {!skill.isCore && (
                  <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-blue-100 text-blue-800">
                    Positional
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                {skill.description}
              </p>

              <div className="p-2.5 bg-white rounded-xl border border-slate-200 text-[11px] text-slate-700 flex items-start space-x-2">
                <span className="font-bold text-slate-900 flex-shrink-0">Coaching Cue:</span>
                <span className="italic">{skill.coachingCue}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recommended Drills Section */}
      {currentTemplate.drills && currentTemplate.drills.length > 0 && (
        <div className="bg-white border-2 border-slate-900 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
          <div className="flex items-center space-x-2">
            <Zap size={20} className="text-amber-500" />
            <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">
              Recommended Corrective & Mastery Drills
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {currentTemplate.drills.map(drill => (
              <div key={drill.id} className="p-5 bg-amber-50/60 border-2 border-amber-900/20 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 bg-amber-200 text-amber-900 rounded-md text-[10px] font-black uppercase">
                    {drill.skillName}
                  </span>
                  <span className="text-[10px] font-bold text-slate-500">
                    {drill.intensity} Intensity
                  </span>
                </div>

                <h4 className="text-sm font-black text-slate-900">{drill.drillName}</h4>
                <p className="text-xs text-slate-600 font-medium leading-relaxed">{drill.description}</p>

                <div className="pt-2 border-t border-amber-200 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Frequency: <strong className="text-slate-800">{drill.recommendedFrequency}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
