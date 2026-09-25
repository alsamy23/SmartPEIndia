import React, { useState, useMemo, useCallback } from 'react';
import { 
  X, 
  Check, 
  Search, 
  Target, 
  CheckCircle2, 
  Square, 
  CheckSquare, 
  Sparkles,
  Info
} from 'lucide-react';
import { 
  SPORT_TEMPLATES, 
  CoachingSportId, 
  PlayerProfileData,
  academyService
} from '../../services/academyService';
import { 
  SKILL_PRESETS_META, 
  SkillPresetType, 
  getPresetSkillIdsForSport 
} from '../../services/coachingSkillsDatabase';
import { showToast } from '../../services/toast';

interface SkillSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  sport: CoachingSportId;
  position?: string;
  athlete?: PlayerProfileData | null;
  initialSelectedSkillIds?: string[];
  initialPreset?: SkillPresetType;
  onApply: (selectedSkillIds: string[], preset: SkillPresetType, saveToAthleteProfile?: boolean) => void;
  title?: string;
  allowSaveToProfile?: boolean;
}

export const SkillSelectionModal: React.FC<SkillSelectionModalProps> = ({
  isOpen,
  onClose,
  sport,
  position,
  athlete,
  initialSelectedSkillIds,
  initialPreset = 'custom',
  onApply,
  title = 'Choose Skills to Assess',
  allowSaveToProfile = true
}) => {
  const sportTemplate = SPORT_TEMPLATES[sport] || SPORT_TEMPLATES.football;
  const allSkills = sportTemplate.skills || [];

  const [selectedPreset, setSelectedPreset] = useState<SkillPresetType>(() => {
    if (initialPreset && initialPreset !== 'custom') return initialPreset;
    if (athlete?.skillPlanPreset) return athlete.skillPlanPreset;
    if (athlete?.selectedSkillIds && athlete.selectedSkillIds.length > 0) return 'custom';
    return 'core';
  });

  const [selectedSkillIds, setSelectedSkillIds] = useState<Set<string>>(() => {
    if (initialSelectedSkillIds && initialSelectedSkillIds.length > 0) {
      return new Set(initialSelectedSkillIds);
    }
    if (athlete?.selectedSkillIds && athlete.selectedSkillIds.length > 0) {
      return new Set(athlete.selectedSkillIds);
    }
    const coreIds = getPresetSkillIdsForSport(sport, 'core', allSkills, sportTemplate.positions, position || athlete?.position);
    return new Set(coreIds);
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPillar, setSelectedPillar] = useState<'all' | 'technical' | 'tactical' | 'physical' | 'gameBehaviour'>('all');
  const [saveToAthleteProfile, setSaveToAthleteProfile] = useState<boolean>(true);

  // Pillar statistics
  const pillarStats = useMemo(() => {
    const stats = {
      technical: { total: 0, selected: 0 },
      tactical: { total: 0, selected: 0 },
      physical: { total: 0, selected: 0 },
      gameBehaviour: { total: 0, selected: 0 }
    };

    allSkills.forEach(skill => {
      const cat = skill.category as keyof typeof stats;
      if (stats[cat]) {
        stats[cat].total += 1;
        if (selectedSkillIds.has(skill.id)) {
          stats[cat].selected += 1;
        }
      }
    });

    return stats;
  }, [allSkills, selectedSkillIds]);

  const filteredSkills = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return allSkills.filter(skill => {
      const matchPillar = selectedPillar === 'all' || skill.category === selectedPillar;
      if (!matchPillar) return false;
      if (!q) return true;
      return (
        skill.name.toLowerCase().includes(q) ||
        skill.description.toLowerCase().includes(q) ||
        (skill.coachingCue && skill.coachingCue.toLowerCase().includes(q))
      );
    });
  }, [allSkills, selectedPillar, searchQuery]);

  const handleApplyPreset = useCallback((preset: SkillPresetType) => {
    setSelectedPreset(preset);
    const ids = getPresetSkillIdsForSport(sport, preset, allSkills, sportTemplate.positions, position || athlete?.position);
    setSelectedSkillIds(new Set(ids));
  }, [sport, allSkills, sportTemplate.positions, position, athlete?.position]);

  const handleToggleSkill = useCallback((skillId: string) => {
    setSelectedPreset('custom');
    setSelectedSkillIds(prev => {
      const next = new Set(prev);
      if (next.has(skillId)) {
        next.delete(skillId);
      } else {
        next.add(skillId);
      }
      return next;
    });
  }, []);

  const handleSelectAllInView = useCallback(() => {
    setSelectedPreset('custom');
    setSelectedSkillIds(prev => {
      const next = new Set(prev);
      filteredSkills.forEach(s => next.add(s.id));
      return next;
    });
  }, [filteredSkills]);

  const handleDeselectAllInView = useCallback(() => {
    setSelectedPreset('custom');
    setSelectedSkillIds(prev => {
      const next = new Set(prev);
      filteredSkills.forEach(s => next.delete(s.id));
      return next;
    });
  }, [filteredSkills]);

  const handleSave = () => {
    if (selectedSkillIds.size === 0) {
      showToast('Please select at least one skill to assess', 'warning');
      return;
    }

    const finalSkillArray = Array.from(selectedSkillIds);

    if (saveToAthleteProfile && athlete) {
      const updatedAthlete: PlayerProfileData = {
        ...athlete,
        selectedSkillIds: finalSkillArray,
        skillPlanPreset: selectedPreset
      };
      academyService.savePlayer(updatedAthlete);
      showToast(`Saved ${finalSkillArray.length} skills to ${athlete.name}'s profile!`, 'success');
    }

    onApply(finalSkillArray, selectedPreset, saveToAthleteProfile);
    onClose();
  };

  if (!isOpen) return null;

  const totalCount = allSkills.length;
  const selectedCount = selectedSkillIds.size;
  const coveragePercent = Math.round((selectedCount / (totalCount || 1)) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-2 sm:p-4 overflow-hidden animate-fade-in">
      <div className="bg-white border-2 border-slate-900 rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-5xl h-[94vh] flex flex-col overflow-hidden">
        
        {/* Compact Modal Header */}
        <div className="bg-slate-900 text-white px-4 sm:px-6 py-3 border-b-2 border-slate-900 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded text-[10px] font-black uppercase tracking-wider border border-emerald-400/30">
                  {sportTemplate.name} • {totalCount} Skills Total
                </span>
                {athlete && (
                  <span className="text-xs text-amber-300 font-bold">
                    Student: {athlete.name}
                  </span>
                )}
              </div>
              <h2 className="text-base sm:text-lg font-black tracking-tight">{title}</h2>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Compact Preset Selector Bar */}
        <div className="bg-slate-50 border-b border-slate-200 px-4 sm:px-6 py-2.5 flex-shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-black uppercase text-slate-600 flex items-center space-x-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Quick Skill Levels:</span>
              </span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { id: 'core', label: 'Basic (12)', badge: '12 Skills' },
                  { id: 'development', label: 'Standard (20)', badge: '20 Skills' },
                  { id: 'master40', label: 'All (40)', badge: '40 Skills' },
                  { id: 'positional', label: 'Role Specific', badge: 'By Position' }
                ].map(p => {
                  const isSelected = selectedPreset === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleApplyPreset(p.id as SkillPresetType)}
                      className={`px-3 py-1 rounded-xl text-xs font-black transition border ${
                        isSelected
                          ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                          : 'bg-white text-slate-700 border-slate-300 hover:border-slate-800'
                      }`}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="text-xs font-black text-slate-800 bg-white px-3 py-1 rounded-xl border border-slate-200 shadow-xs self-start sm:self-auto">
              <span className="text-emerald-700 font-extrabold">{selectedCount}</span> of {totalCount} Skills Chosen ({coveragePercent}%)
            </div>
          </div>
        </div>

        {/* Filter & Search Toolbar */}
        <div className="px-4 sm:px-6 py-2 bg-white border-b border-slate-200 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2 flex-shrink-0">
          {/* Category Tabs */}
          <div className="flex flex-wrap gap-1">
            {[
              { id: 'all', label: `All (${allSkills.length})` },
              { id: 'technical', label: `Technical (${pillarStats.technical.selected}/${pillarStats.technical.total})` },
              { id: 'tactical', label: `Tactics (${pillarStats.tactical.selected}/${pillarStats.tactical.total})` },
              { id: 'physical', label: `Fitness (${pillarStats.physical.selected}/${pillarStats.physical.total})` },
              { id: 'gameBehaviour', label: `Conduct (${pillarStats.gameBehaviour.selected}/${pillarStats.gameBehaviour.total})` }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedPillar(tab.id as any)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                  selectedPillar === tab.id
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Box & Quick Select Buttons */}
          <div className="flex items-center space-x-2">
            <div className="relative flex-1 md:w-52">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search skill name or cue..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-7 pr-2.5 py-1 text-xs font-medium focus:outline-none focus:border-slate-900"
              />
            </div>
            <button
              type="button"
              onClick={handleSelectAllInView}
              className="px-2.5 py-1 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 rounded-lg text-xs font-bold border border-emerald-300 transition whitespace-nowrap"
            >
              Select All
            </button>
            <button
              type="button"
              onClick={handleDeselectAllInView}
              className="px-2.5 py-1 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-lg text-xs font-bold border border-slate-300 transition whitespace-nowrap"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Spacious Scrollable Skills Grid */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 bg-slate-50/70">
          {filteredSkills.length === 0 ? (
            <div className="text-center py-10 bg-white rounded-2xl border border-slate-200">
              <Info className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700">No skills match your search</p>
              <p className="text-xs text-slate-400">Try typing a different word or select 'All'.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {filteredSkills.map(skill => {
                const isSelected = selectedSkillIds.has(skill.id);
                const pillarBadgeColor = 
                  skill.category === 'technical' ? 'bg-emerald-100 text-emerald-800' :
                  skill.category === 'tactical' ? 'bg-blue-100 text-blue-800' :
                  skill.category === 'physical' ? 'bg-amber-100 text-amber-900' :
                  'bg-purple-100 text-purple-800';

                return (
                  <div
                    key={skill.id}
                    onClick={() => handleToggleSkill(skill.id)}
                    className={`p-3 rounded-xl border-2 transition cursor-pointer flex items-start space-x-2.5 ${
                      isSelected
                        ? 'bg-white border-slate-900 shadow-sm ring-1 ring-slate-900/10'
                        : 'bg-white/80 border-slate-200 hover:border-slate-400 opacity-75 hover:opacity-100'
                    }`}
                  >
                    <div className="pt-0.5 flex-shrink-0">
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-1.5 mb-1 flex-wrap gap-y-0.5">
                        <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${pillarBadgeColor}`}>
                          {skill.category === 'gameBehaviour' ? 'Conduct' : skill.category}
                        </span>
                        {skill.isCore && (
                          <span className="text-[9px] font-black px-1.5 py-0.5 bg-amber-100 text-amber-900 rounded">
                            ★ Basic
                          </span>
                        )}
                      </div>
                      
                      <h4 className="text-xs font-black text-slate-900 leading-snug">{skill.name}</h4>
                      <p className="text-[11px] text-slate-600 line-clamp-2 mt-0.5">{skill.description}</p>
                      
                      {skill.coachingCue && (
                        <p className="text-[10px] text-emerald-800 font-semibold mt-1 bg-emerald-50 px-1.5 py-0.5 rounded inline-block">
                          Tip: {skill.coachingCue}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-4 sm:px-6 py-3 bg-white border-t-2 border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-2.5 flex-shrink-0">
          <div className="flex items-center space-x-2">
            {allowSaveToProfile && athlete && (
              <label className="flex items-center space-x-2 text-xs font-bold text-slate-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={saveToAthleteProfile}
                  onChange={e => setSaveToAthleteProfile(e.target.checked)}
                  className="rounded border-slate-300 text-slate-900 focus:ring-slate-900 w-4 h-4"
                />
                <span>Save these selected skills to {athlete.name}'s profile</span>
              </label>
            )}
          </div>

          <div className="flex items-center space-x-2 justify-end w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border-2 border-slate-300 text-slate-700 font-bold text-xs hover:border-slate-900 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs shadow-md transition flex items-center space-x-1.5"
            >
              <Check className="w-4 h-4 text-emerald-400" />
              <span>Apply {selectedCount} Skills</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
