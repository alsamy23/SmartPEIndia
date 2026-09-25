import React, { useState, useEffect, useMemo } from 'react';
import { 
  Trophy, 
  Sparkles, 
  Check, 
  ChevronRight, 
  User, 
  Calendar, 
  ShieldCheck, 
  Target, 
  Activity, 
  TrendingUp, 
  Save, 
  Printer, 
  ArrowLeft,
  Plus,
  Trash2,
  HelpCircle,
  Clock,
  Layers,
  Sliders,
  CheckCircle2,
  Filter,
  Search
} from 'lucide-react';
import { VoiceTranscribeButton } from '../VoiceTranscribeButton';
import { 
  academyService, 
  PlayerProfileData, 
  PlayerAssessmentRecord, 
  CoachingSportId, 
  AssessmentType, 
  SPORT_TEMPLATES, 
  COACHING_SCALE_LABELS, 
  calculateDevelopmentScore, 
  getDevelopmentLevel, 
  getDevelopmentLevelColor,
  detectAgeCategory,
  TrainingGoal
} from '../../services/academyService';
import { 
  SkillPresetType, 
  getPresetSkillIdsForSport, 
  SKILL_PRESETS_META 
} from '../../services/coachingSkillsDatabase';
import { SkillSelectionModal } from './SkillSelectionModal';
import { generateAiCoachingRecommendations } from '../../services/coachingAiService';
import { showToast } from '../../services/toast';

interface AssessmentEntryProps {
  initialPlayerId?: string;
  initialAssessmentId?: string;
  onSaved?: (assessment: PlayerAssessmentRecord) => void;
  onCancel?: () => void;
  onViewReport?: (player: PlayerProfileData, assessment: PlayerAssessmentRecord) => void;
}

export const AssessmentEntry: React.FC<AssessmentEntryProps> = ({
  initialPlayerId,
  initialAssessmentId,
  onSaved,
  onCancel,
  onViewReport
}) => {
  const [players, setPlayers] = useState<PlayerProfileData[]>([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>(initialPlayerId || '');
  const [ageCategoryFilter, setAgeCategoryFilter] = useState<string>('all');
  
  // Assessment fields
  const [sport, setSport] = useState<CoachingSportId>('football');
  const [position, setPosition] = useState<string>('Midfielder');
  const [assessmentType, setAssessmentType] = useState<AssessmentType>('Monthly Review');
  const [assessmentDate, setAssessmentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [coachName, setCoachName] = useState<string>('Coach Vikram Roy');
  const [nextAssessmentDate, setNextAssessmentDate] = useState<string>('');

  // Skill Scope & Selection
  const [skillScope, setSkillScope] = useState<SkillPresetType>('core');
  const [activeSkillIds, setActiveSkillIds] = useState<string[]>([]);
  const [isSkillModalOpen, setIsSkillModalOpen] = useState<boolean>(false);
  const [syncToAthleteProfile, setSyncToAthleteProfile] = useState<boolean>(true);

  // Skill ratings (1 to 5)
  const [skillRatings, setSkillRatings] = useState<Record<string, number>>({});
  const [skillObservations, setSkillObservations] = useState<Record<string, string>>({});
  const [skillTargets, setSkillTargets] = useState<Record<string, string>>({});
  
  // Positional skill toggle
  const [includedPositionSkills, setIncludedPositionSkills] = useState<string[]>([]);

  // Qualitative notes
  const [coachObservation, setCoachObservation] = useState<string>('');
  const [coachRecommendation, setCoachRecommendation] = useState<string>('');
  
  // AI Suggestions
  const [isGeneratingAi, setIsGeneratingAi] = useState<boolean>(false);
  const [aiSuggestions, setAiSuggestions] = useState<PlayerAssessmentRecord['aiSuggestions'] | null>(null);

  // Goals
  const [nextGoals, setNextGoals] = useState<TrainingGoal[]>([]);

  // Filter category in evaluation screen
  const [activePillarFilter, setActivePillarFilter] = useState<'all' | 'technical' | 'tactical' | 'physical' | 'gameBehaviour'>('all');
  const [searchSkillQuery, setSearchSkillQuery] = useState<string>('');

  // Load players
  useEffect(() => {
    const list = academyService.getPlayers();
    setPlayers(list);
    if (!selectedPlayerId && list.length > 0) {
      setSelectedPlayerId(list[0].id);
    }
  }, []);

  // Set default 3-month review date
  useEffect(() => {
    const date = new Date(assessmentDate || new Date());
    date.setMonth(date.getMonth() + 3);
    setNextAssessmentDate(date.toISOString().split('T')[0]);
  }, [assessmentDate]);

  // When player changes, populate default sport and position
  const selectedPlayer = useMemo(() => {
    return players.find(p => p.id === selectedPlayerId) || null;
  }, [players, selectedPlayerId]);

  const filteredPlayers = useMemo(() => {
    if (ageCategoryFilter === 'all') return players;
    return players.filter(p => {
      const cat = p.ageCategory || detectAgeCategory(p.age, p.dob);
      return cat === ageCategoryFilter;
    });
  }, [players, ageCategoryFilter]);

  const currentTemplate = SPORT_TEMPLATES[sport] || SPORT_TEMPLATES.football;
  const allSportSkills = currentTemplate.skills || [];

  // Initialize or synchronize skill list when player or sport changes
  useEffect(() => {
    if (selectedPlayer) {
      setSport(selectedPlayer.sport);
      setPosition(selectedPlayer.position);
      if (selectedPlayer.coachName) {
        setCoachName(selectedPlayer.coachName);
      }

      // Check if existing assessment passed
      if (initialAssessmentId) {
        const existing = academyService.getAssessments().find(a => a.id === initialAssessmentId);
        if (existing) {
          setSport(existing.sport);
          setPosition(existing.position);
          setAssessmentType(existing.assessmentType);
          setAssessmentDate(existing.assessmentDate);
          setCoachName(existing.coachName);
          setSkillRatings(existing.skillRatings);
          setSkillObservations(existing.skillObservations || {});
          setSkillTargets(existing.skillTargets || {});
          setIncludedPositionSkills(existing.includedPositionSkills || []);
          setCoachObservation(existing.coachObservation || '');
          setCoachRecommendation(existing.coachRecommendation || '');
          setNextGoals(existing.nextGoals || []);
          setNextAssessmentDate(existing.nextAssessmentDate || '');
          
          if (existing.assessedSkillIds && existing.assessedSkillIds.length > 0) {
            setActiveSkillIds(existing.assessedSkillIds);
            setSkillScope('custom');
          } else {
            setActiveSkillIds(Object.keys(existing.skillRatings));
          }
          return;
        }
      }

      // Set skill scope based on athlete profile
      const template = SPORT_TEMPLATES[selectedPlayer.sport] || SPORT_TEMPLATES.football;
      let targetSkillIds: string[] = [];

      if (selectedPlayer.selectedSkillIds && selectedPlayer.selectedSkillIds.length > 0) {
        targetSkillIds = selectedPlayer.selectedSkillIds;
        setSkillScope(selectedPlayer.skillPlanPreset || 'custom');
      } else {
        // Default to Core 10-12 skills
        targetSkillIds = getPresetSkillIdsForSport(
          selectedPlayer.sport, 
          'core', 
          template.skills, 
          template.positions, 
          selectedPlayer.position
        );
        setSkillScope('core');
      }

      setActiveSkillIds(targetSkillIds);

      // Initialize default ratings for the selected skills
      const initialRatings: Record<string, number> = {};
      targetSkillIds.forEach(id => {
        const sObj = template.skills.find(s => s.id === id);
        initialRatings[id] = sObj?.defaultScore || 3;
      });

      setSkillRatings(initialRatings);
    }
  }, [selectedPlayer, initialAssessmentId]);

  // Handle Preset Scope Changes
  const handleSelectScopePreset = (preset: SkillPresetType) => {
    setSkillScope(preset);
    const ids = getPresetSkillIdsForSport(
      sport, 
      preset, 
      allSportSkills, 
      currentTemplate.positions, 
      position
    );
    setActiveSkillIds(ids);

    // Update ratings object: keep existing ratings, initialize new ones with defaultScore
    setSkillRatings(prev => {
      const nextRatings: Record<string, number> = {};
      ids.forEach(id => {
        if (prev[id] !== undefined) {
          nextRatings[id] = prev[id];
        } else {
          const sObj = allSportSkills.find(s => s.id === id);
          nextRatings[id] = sObj?.defaultScore || 3;
        }
      });
      return nextRatings;
    });

    showToast(`Switched to ${preset === 'master40' ? 'All 40 Skills' : preset === 'core' ? 'Core 12 Skills' : 'Development 20 Skills'}`, 'info');
  };

  const handleApplyCustomSkills = (newSkillIds: string[], preset: SkillPresetType, savedToProfile?: boolean) => {
    setActiveSkillIds(newSkillIds);
    setSkillScope(preset);

    setSkillRatings(prev => {
      const nextRatings: Record<string, number> = {};
      newSkillIds.forEach(id => {
        if (prev[id] !== undefined) {
          nextRatings[id] = prev[id];
        } else {
          const sObj = allSportSkills.find(s => s.id === id);
          nextRatings[id] = sObj?.defaultScore || 3;
        }
      });
      return nextRatings;
    });

    if (savedToProfile) {
      setPlayers(academyService.getPlayers());
    }
  };

  // Real-time score calculations over actively assessed skills
  const { domainScores, overallScore, developmentLevel, strengths, developmentPriorities } = useMemo(() => {
    // Only calculate domain breakdown using active rated skills
    const filteredRatings: Record<string, number> = {};
    activeSkillIds.forEach(id => {
      if (skillRatings[id] !== undefined) {
        filteredRatings[id] = skillRatings[id];
      }
    });

    const dScores = academyService.calculateDomainBreakdown(sport, filteredRatings);
    const allRatings = Object.values(filteredRatings);
    const oScore = calculateDevelopmentScore(allRatings);
    const dLevel = getDevelopmentLevel(oScore);
    const { strengths: str, developmentPriorities: prio } = academyService.calculateStrengthsAndPriorities(sport, filteredRatings);

    return {
      domainScores: dScores,
      overallScore: oScore,
      developmentLevel: dLevel,
      strengths: str,
      developmentPriorities: prio
    };
  }, [sport, skillRatings, activeSkillIds]);

  const handleRatingChange = (skillId: string, rating: number) => {
    setSkillRatings(prev => ({ ...prev, [skillId]: rating }));
  };

  const handleObservationChange = (skillId: string, text: string) => {
    setSkillObservations(prev => ({ ...prev, [skillId]: text }));
  };

  const handleTargetChange = (skillId: string, text: string) => {
    setSkillTargets(prev => ({ ...prev, [skillId]: text }));
  };

  // AI Recommendations
  const handleGenerateAi = async () => {
    if (!selectedPlayer) {
      showToast('Please select a player first', 'warning');
      return;
    }

    setIsGeneratingAi(true);
    try {
      const res = await generateAiCoachingRecommendations(
        selectedPlayer,
        sport,
        position,
        assessmentType,
        skillRatings,
        coachObservation
      );

      setAiSuggestions({
        summary: res.summary,
        strengthsNotes: res.strengthsNotes,
        prioritiesNotes: res.prioritiesNotes,
        trainingFocus: res.trainingFocus,
        suggestedGoals: res.suggestedGoals.map(g => g.goal)
      });

      // Populate coach notes if empty
      if (!coachObservation) {
        setCoachObservation(res.summary);
      }
      if (!coachRecommendation) {
        setCoachRecommendation(res.trainingFocus);
      }

      // Add suggested goals to nextGoals
      if (res.suggestedGoals && res.suggestedGoals.length > 0) {
        const newGoals: TrainingGoal[] = res.suggestedGoals.map((g, idx) => ({
          id: `goal-${Date.now()}-${idx}`,
          playerId: selectedPlayer.id,
          goal: g.goal,
          skill: g.skill,
          target: g.target,
          startDate: assessmentDate,
          reviewDate: nextAssessmentDate,
          status: 'In Progress'
        }));
        setNextGoals(newGoals);
      }

      showToast('AI Coach Recommendations generated successfully!', 'success');
    } catch (e) {
      console.error(e);
      showToast('Failed to generate AI suggestions', 'error');
    } finally {
      setIsGeneratingAi(false);
    }
  };

  // Add a manual goal
  const handleAddGoal = () => {
    const newGoal: TrainingGoal = {
      id: `goal-${Date.now()}`,
      playerId: selectedPlayerId,
      goal: 'Improve key technical consistency',
      skill: developmentPriorities[0] || 'Core Technique',
      target: 'Achieve 80% accuracy in drills',
      startDate: assessmentDate,
      reviewDate: nextAssessmentDate,
      status: 'In Progress'
    };
    setNextGoals(prev => [...prev, newGoal]);
  };

  // Smart Voice Skill Scoring & Feedback Dictation
  const handleVoiceSkillScoring = (spokenText: string) => {
    if (!spokenText || !spokenText.trim()) return;
    const text = spokenText.toLowerCase();

    let matchedCount = 0;
    const newRatings = { ...skillRatings };
    const numWords: Record<string, number> = {
      'one': 1, '1': 1,
      'two': 2, '2': 2,
      'three': 3, '3': 3,
      'four': 4, '4': 4,
      'five': 5, '5': 5
    };

    allSportSkills.forEach(skill => {
      const sName = skill.name.toLowerCase();
      const firstWord = sName.split(' ')[0];
      if (text.includes(sName) || (firstWord.length > 4 && text.includes(firstWord))) {
        // Regex to extract score after or before the skill mention
        const targetWord = text.includes(sName) ? sName : firstWord;
        const regex = new RegExp(`(?:${targetWord})[^0-9a-z]{0,12}(?:is|level|score|rating|to)?\\s*([1-5]|one|two|three|four|five)`, 'i');
        const match = text.match(regex);
        if (match && match[1]) {
          const val = numWords[match[1].toLowerCase()] || parseInt(match[1]);
          if (val >= 1 && val <= 5) {
            newRatings[skill.id] = val;
            matchedCount++;
          }
        }
      }
    });

    if (matchedCount > 0) {
      setSkillRatings(newRatings);
      showToast(`Voice updated ${matchedCount} skill scores automatically!`, 'success');
    } else {
      setCoachObservation(prev => prev ? `${prev} ${spokenText}` : spokenText);
      showToast(`Added to Coach Observation: "${spokenText.slice(0, 45)}..."`, 'info');
    }
  };

  const handleRemoveGoal = (id: string) => {
    setNextGoals(prev => prev.filter(g => g.id !== id));
  };

  const handleSave = () => {
    if (!selectedPlayer) {
      showToast('Please select a player to evaluate', 'error');
      return;
    }

    if (activeSkillIds.length === 0) {
      showToast('Please select at least one skill to assess', 'warning');
      return;
    }

    // Filter skill ratings to only active skills
    const filteredRatings: Record<string, number> = {};
    activeSkillIds.forEach(id => {
      filteredRatings[id] = skillRatings[id] || 3;
    });

    const newRecord: PlayerAssessmentRecord = {
      id: initialAssessmentId || `assess-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      playerId: selectedPlayer.id,
      playerName: selectedPlayer.name,
      sport,
      position,
      ageCategory: selectedPlayer.ageCategory || detectAgeCategory(selectedPlayer.age, selectedPlayer.dob),
      gradeOrClass: selectedPlayer.gradeOrClass,
      ageAtAssessment: selectedPlayer.age,
      assessmentType,
      assessmentDate,
      coachName,
      skillRatings: filteredRatings,
      skillObservations,
      skillTargets,
      includedPositionSkills,
      assessedSkillIds: activeSkillIds,
      domainScores,
      overallScore,
      developmentLevel,
      strengths,
      developmentPriorities,
      coachObservation: coachObservation || `Athlete evaluated across ${activeSkillIds.length} competencies. Overall development rating: ${overallScore}/100.`,
      coachRecommendation: coachRecommendation || 'Continue regular academy practice focusing on high-tempo technical consistency.',
      aiSuggestions: aiSuggestions || undefined,
      nextGoals,
      nextAssessmentDate,
      createdAt: new Date().toISOString()
    };

    academyService.saveAssessment(newRecord);

    // Optionally sync active skills to player's permanent profile
    if (syncToAthleteProfile && selectedPlayer) {
      const updatedPlayer: PlayerProfileData = {
        ...selectedPlayer,
        selectedSkillIds: activeSkillIds,
        skillPlanPreset: skillScope
      };
      academyService.savePlayer(updatedPlayer);
    }

    showToast(`Assessment saved successfully for ${selectedPlayer.name}! (${activeSkillIds.length} skills evaluated)`, 'success');
    
    if (onSaved) {
      onSaved(newRecord);
    }
  };

  // Filter skills to display in the evaluation list
  const activeSkillIdSet = useMemo(() => new Set(activeSkillIds), [activeSkillIds]);

  const skillsToDisplay = useMemo(() => {
    return allSportSkills.filter(s => {
      // Must be in active skill selection
      if (!activeSkillIdSet.has(s.id)) return false;
      
      // Pillar filter
      if (activePillarFilter !== 'all' && s.category !== activePillarFilter) return false;

      // Search query
      if (searchSkillQuery.trim()) {
        const q = searchSkillQuery.toLowerCase();
        const matches = s.name.toLowerCase().includes(q) || 
                        s.description.toLowerCase().includes(q) || 
                        s.coachingCue.toLowerCase().includes(q);
        if (!matches) return false;
      }

      return true;
    });
  }, [allSportSkills, activeSkillIdSet, activePillarFilter, searchSkillQuery]);

  const levelColor = getDevelopmentLevelColor(developmentLevel);

  return (
    <div className="space-y-6 pb-36 sm:pb-28">
      
      {/* Header & Quick Summary Bar */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 border-2 border-slate-900 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <span className="px-3 py-1 bg-amber-500 text-slate-950 rounded-lg text-xs font-black uppercase tracking-wider">
              1–5 Coaching Scale Entry
            </span>
            <span className="text-xs text-slate-400 font-bold">
              Custom Skill Criteria • Rapid Tap Interface
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight font-display">
            Player Development Assessment
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 font-medium mt-1">
            Evaluate basic foundation essentials or up to 40 comprehensive skills tailored to each athlete.
          </p>
        </div>

        {/* Real-time calculated score widget */}
        <div className="flex items-center space-x-4 bg-slate-800/80 p-4 rounded-2xl border border-slate-700">
          <div className="text-right">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
              Development Level
            </span>
            <span className={`text-base font-black px-2.5 py-0.5 rounded-lg border ${levelColor.bg} ${levelColor.text} ${levelColor.border}`}>
              {developmentLevel}
            </span>
          </div>

          <div className="h-10 w-px bg-slate-700" />

          <div className="text-center">
            <span className="text-3xl font-black text-amber-400 tracking-tight">{overallScore}</span>
            <span className="text-[10px] font-bold text-slate-400 block uppercase">/ 100 Score</span>
          </div>
        </div>
      </div>

      {/* Configuration Cards: Player, Sport, Position, Cycle */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 1. Player Selection */}
        <div className="bg-white border-2 border-slate-900 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between gap-2">
            <label className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center space-x-1.5 shrink-0">
              <User size={15} className="text-slate-900" />
              <span>1. Select Player</span>
            </label>
            <select
              value={ageCategoryFilter}
              onChange={e => setAgeCategoryFilter(e.target.value)}
              className="bg-slate-100 text-slate-800 border border-slate-300 rounded-lg px-2 py-1 text-[11px] font-bold outline-none"
              aria-label="Filter by age category"
            >
              <option value="all">All Age Categories</option>
              <option value="U-10">U-10</option>
              <option value="U-12">U-12</option>
              <option value="U-14">U-14</option>
              <option value="U-16">U-16</option>
              <option value="U-18">U-18</option>
              <option value="Senior">Senior</option>
            </select>
          </div>

          <select
            value={selectedPlayerId}
            onChange={e => setSelectedPlayerId(e.target.value)}
            className="w-full bg-slate-50 border-2 border-slate-900 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            {filteredPlayers.map(p => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.sport.toUpperCase()} • {p.position} • {p.age}y)
              </option>
            ))}
          </select>

          {/* Quick Athlete Tap Strip */}
          {filteredPlayers.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-1 pt-0.5 scrollbar-none">
              {filteredPlayers.slice(0, 10).map(p => {
                const isSelected = p.id === selectedPlayerId;
                const cat = p.ageCategory || detectAgeCategory(p.age, p.dob);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedPlayerId(p.id)}
                    className={`px-2.5 py-1.5 rounded-xl text-left border flex-shrink-0 transition-all ${
                      isSelected
                        ? 'border-amber-500 bg-amber-50 ring-2 ring-amber-400'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <p className="text-[11px] font-black truncate max-w-[100px] text-slate-900">{p.name}</p>
                    <p className="text-[9px] text-slate-500 font-bold">{cat} • {p.age}y</p>
                  </button>
                );
              })}
            </div>
          )}

          {selectedPlayer && (
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex items-start space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-slate-900 text-amber-400 font-black flex items-center justify-center text-xs shrink-0 shadow-sm">
                {selectedPlayer.name.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center space-x-1.5 flex-wrap">
                  <span className="text-xs font-black text-slate-900">{selectedPlayer.name}</span>
                  <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 text-[9px] font-black rounded">
                    {selectedPlayer.ageCategory || detectAgeCategory(selectedPlayer.age, selectedPlayer.dob)} Division
                  </span>
                  <span className="text-[10px] text-slate-500 font-bold">Age {selectedPlayer.age}</span>
                </div>
                <p className="text-[10px] text-slate-500 font-medium truncate mt-0.5">
                  Batch: <strong className="text-slate-700">{selectedPlayer.batchOrTeam || 'Individual'}</strong> | Dominant: {selectedPlayer.dominantSide}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* 2. Sport & Playing Role */}
        <div className="bg-white border-2 border-slate-900 rounded-2xl p-5 shadow-sm space-y-3">
          <label className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center space-x-1.5">
            <Activity size={15} className="text-slate-900" />
            <span>2. Sport & Playing Role</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            <select
              value={sport}
              onChange={e => {
                const s = e.target.value as CoachingSportId;
                setSport(s);
                const tmpl = SPORT_TEMPLATES[s];
                if (tmpl && tmpl.positions.length > 0) {
                  setPosition(tmpl.positions[0].name);
                }
              }}
              className="bg-slate-50 border-2 border-slate-900 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none"
            >
              {Object.values(SPORT_TEMPLATES).map(tmpl => (
                <option key={tmpl.id} value={tmpl.id}>
                  {tmpl.name}
                </option>
              ))}
            </select>

            <select
              value={position}
              onChange={e => setPosition(e.target.value)}
              className="bg-slate-50 border-2 border-slate-900 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none"
            >
              {currentTemplate.positions.map(pos => (
                <option key={pos.id} value={pos.name}>
                  {pos.name}
                </option>
              ))}
            </select>
          </div>
          <p className="text-[11px] text-slate-500 font-medium leading-tight">
            {currentTemplate.tagline}
          </p>
        </div>

        {/* 3. Assessment Cycle & Date */}
        <div className="bg-white border-2 border-slate-900 rounded-2xl p-5 shadow-sm space-y-3">
          <label className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center space-x-1.5">
            <Calendar size={15} className="text-slate-900" />
            <span>3. Assessment Cycle & Date</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            <select
              value={assessmentType}
              onChange={e => setAssessmentType(e.target.value as AssessmentType)}
              className="bg-slate-50 border-2 border-slate-900 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none"
            >
              <option value="Baseline Assessment">Baseline Assessment</option>
              <option value="Monthly Review">Monthly Review</option>
              <option value="3-Month Review">3-Month Review</option>
              <option value="Term 1 Evaluation">Term 1 Evaluation</option>
              <option value="Term 2 Evaluation">Term 2 Evaluation</option>
              <option value="6-Month Review">6-Month Review</option>
              <option value="Annual / Final Assessment">Annual / Final Assessment</option>
              <option value="Initial Assessment">Initial Assessment</option>
              <option value="Custom Assessment">Custom Assessment</option>
            </select>

            <input
              type="date"
              value={assessmentDate}
              onChange={e => setAssessmentDate(e.target.value)}
              className="bg-slate-50 border-2 border-slate-900 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none"
            />
          </div>
          <input
            type="text"
            value={coachName}
            onChange={e => setCoachName(e.target.value)}
            placeholder="Coach Name"
            className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-800"
          />
        </div>
      </div>

      {/* SKILL SELECTION CRITERIA BAR (Allows Coach to choose how many skills to assess) */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 text-white rounded-3xl p-5 sm:p-6 border-2 border-slate-900 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400 text-slate-950 font-black flex items-center justify-center">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 bg-amber-400/20 px-2 py-0.5 rounded border border-amber-400/30">
                  Skill Selection Criteria
                </span>
                <span className="text-xs text-slate-300 font-bold">
                  {sport.toUpperCase()} ({allSportSkills.length} Total in Library)
                </span>
              </div>
              <h3 className="text-lg font-black tracking-tight mt-0.5">
                Assessing {activeSkillIds.length} of {allSportSkills.length} Skills
              </h3>
            </div>
          </div>

          {/* Modal Trigger Button */}
          <button
            type="button"
            onClick={() => setIsSkillModalOpen(true)}
            className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-2xl text-xs uppercase tracking-wider transition shadow-md flex items-center justify-center space-x-2 active:scale-95"
          >
            <Sliders className="w-4 h-4" />
            <span>Customize & Pick Skills ({activeSkillIds.length})</span>
          </button>
        </div>

        {/* Quick Preset Buttons */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-800">
          <span className="text-[11px] font-bold text-slate-400 mr-1">Quick Presets:</span>
          
          {selectedPlayer?.selectedSkillIds && selectedPlayer.selectedSkillIds.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setActiveSkillIds(selectedPlayer.selectedSkillIds || []);
                setSkillScope(selectedPlayer.skillPlanPreset || 'custom');
                showToast(`Loaded ${selectedPlayer.name}'s assigned skills (${selectedPlayer.selectedSkillIds?.length})`, 'info');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition border flex items-center space-x-1.5 ${
                skillScope === 'custom' && activeSkillIds.length === selectedPlayer.selectedSkillIds.length
                  ? 'bg-amber-400 text-slate-950 border-amber-400 shadow'
                  : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
              }`}
            >
              <span>👤 {selectedPlayer.name}'s Profile Plan ({selectedPlayer.selectedSkillIds.length})</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => handleSelectScopePreset('core')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition border flex items-center space-x-1.5 ${
              skillScope === 'core'
                ? 'bg-amber-400 text-slate-950 border-amber-400 shadow'
                : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
            }`}
          >
            <span>⚡ Core Basics (12 Skills)</span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectScopePreset('development')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition border flex items-center space-x-1.5 ${
              skillScope === 'development'
                ? 'bg-amber-400 text-slate-950 border-amber-400 shadow'
                : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
            }`}
          >
            <span>🎯 Development Track (20 Skills)</span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectScopePreset('master40')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition border flex items-center space-x-1.5 ${
              skillScope === 'master40'
                ? 'bg-amber-400 text-slate-950 border-amber-400 shadow'
                : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
            }`}
          >
            <span>🏆 Full Matrix ({allSportSkills.length} Skills)</span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectScopePreset('positional')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition border flex items-center space-x-1.5 ${
              skillScope === 'positional'
                ? 'bg-amber-400 text-slate-950 border-amber-400 shadow'
                : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
            }`}
          >
            <span>🛡️ Role Focus ({position})</span>
          </button>
        </div>
      </div>

      {/* Main Skill Assessment Matrix (Mobile-first 1-5 touch interface) */}
      <div className="bg-white border-2 border-slate-900 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        
        {/* Category Tabs & Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b-2 border-slate-100 pb-4 gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">
                Skill Evaluation Matrix
              </h2>
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[10px] font-black">
                {skillsToDisplay.length} in View
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Tap score 1 to 5 for each competency. Instant scoring & cues displayed below each skill.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Voice Skill Scorer Action */}
            <VoiceTranscribeButton
              onTranscribe={handleVoiceSkillScoring}
              promptContext={`This is a sports coach rating athlete skills for ${sport}. Example voice inputs: 'Dribbling 4, shooting 5, passing 3' or observations.`}
              buttonLabel="Speak Skill Scores"
              size="sm"
              variant="pill"
            />

            {/* Search Input with Voice */}
            <div className="relative flex items-center">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search skills..."
                value={searchSkillQuery}
                onChange={e => setSearchSkillQuery(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded-xl pl-8 pr-8 py-1.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-slate-900 w-36 sm:w-44"
              />
              <div className="absolute right-1 top-1/2 -translate-y-1/2">
                <VoiceTranscribeButton
                  onTranscribe={(text) => setSearchSkillQuery(text)}
                  promptContext={`Search sports skill names for ${sport}`}
                  size="sm"
                  variant="ghost"
                />
              </div>
            </div>

            {/* Pillar Filter Buttons */}
            <div className="flex items-center space-x-1 overflow-x-auto">
              {(['all', 'technical', 'tactical', 'physical', 'gameBehaviour'] as const).map(pill => (
                <button
                  key={pill}
                  onClick={() => setActivePillarFilter(pill)}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition ${
                    activePillarFilter === pill
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

        {/* 1-5 Coaching Scale Reference Banner */}
        <div className="grid grid-cols-5 gap-1.5 p-3 bg-slate-50 rounded-2xl border border-slate-200 text-center">
          {[1, 2, 3, 4, 5].map(scaleNum => {
            const sc = COACHING_SCALE_LABELS[scaleNum];
            return (
              <div key={scaleNum} className="p-1">
                <span className="text-xs font-black block" style={{ color: sc.color }}>
                  {scaleNum} • {sc.title}
                </span>
                <span className="text-[9px] text-slate-400 leading-tight hidden sm:block mt-0.5">
                  {sc.description.split(',')[0]}
                </span>
              </div>
            );
          })}
        </div>

        {/* Skill Cards Grid */}
        {skillsToDisplay.length === 0 ? (
          <div className="text-center py-10 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <Target className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-sm font-bold text-slate-700">No skills match the current filter</p>
            <button
              type="button"
              onClick={() => {
                setActivePillarFilter('all');
                setSearchSkillQuery('');
              }}
              className="text-xs text-blue-600 font-bold hover:underline"
            >
              Reset filters
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {skillsToDisplay.map(skill => {
              const currentScore = skillRatings[skill.id] || 3;
              const currentScale = COACHING_SCALE_LABELS[currentScore];
              const obs = skillObservations[skill.id] || '';
              const tgt = skillTargets[skill.id] || '';

              const pillarBadgeColor = 
                skill.category === 'technical' ? 'bg-emerald-100 text-emerald-800' :
                skill.category === 'tactical' ? 'bg-blue-100 text-blue-800' :
                skill.category === 'physical' ? 'bg-amber-100 text-amber-900' :
                'bg-purple-100 text-purple-800';

              return (
                <div 
                  key={skill.id}
                  className="bg-white border-2 border-slate-200 hover:border-slate-900 rounded-2xl p-4 sm:p-5 transition-all space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${pillarBadgeColor}`}>
                          {skill.category}
                        </span>
                        {skill.isCore && (
                          <span className="text-[10px] font-black px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded">
                            ★ Core
                          </span>
                        )}
                        <h3 className="text-sm sm:text-base font-black text-slate-900">
                          {skill.name}
                        </h3>
                      </div>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">
                        {skill.description}
                      </p>
                    </div>

                    {/* 1-5 Quick Tap Score Buttons */}
                    <div className="flex items-center space-x-1.5 bg-slate-100 p-1.5 rounded-2xl shrink-0 self-start sm:self-center">
                      {[1, 2, 3, 4, 5].map(score => {
                        const isSelected = currentScore === score;
                        const sc = COACHING_SCALE_LABELS[score];
                        return (
                          <button
                            key={score}
                            type="button"
                            onClick={() => handleRatingChange(skill.id, score)}
                            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl font-black text-xs sm:text-sm transition-all flex flex-col items-center justify-center ${
                              isSelected
                                ? 'bg-slate-900 text-white shadow-md scale-105'
                                : 'bg-white text-slate-700 hover:bg-slate-200'
                            }`}
                            style={{
                              borderColor: isSelected ? sc.color : undefined,
                              borderWidth: isSelected ? '2px' : '1px'
                            }}
                          >
                            <span>{score}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Coaching Cue & Scale Description */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2 pt-2 border-t border-slate-100">
                    <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-1 rounded-lg">
                      💡 Coaching Cue: {skill.coachingCue}
                    </span>
                    <span className="font-bold text-slate-700">
                      Level: <strong style={{ color: currentScale.color }}>{currentScale.title}</strong>
                    </span>
                  </div>

                  {/* Observations & Targets expandable input */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    <input
                      type="text"
                      placeholder="Observation / feedback for this skill..."
                      value={obs}
                      onChange={e => handleObservationChange(skill.id, e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-900"
                    />
                    <input
                      type="text"
                      placeholder="Specific target / corrective drill..."
                      value={tgt}
                      onChange={e => handleTargetChange(skill.id, e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-900"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* AI Coaching Recommendations & Feedback Section */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white border-2 border-slate-900 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <h3 className="text-lg font-black">AI Coaching Synthesizer</h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Instantly generate comprehensive developmental summary, strengths, priority drills, and actionable goals.
            </p>
          </div>

          <button
            type="button"
            onClick={handleGenerateAi}
            disabled={isGeneratingAi}
            className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-2xl text-xs uppercase tracking-wider transition shadow-md flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isGeneratingAi ? 'Synthesizing...' : 'Generate AI Report & Goals'}</span>
          </button>
        </div>

        {/* Qualitative Notes Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase tracking-wider text-slate-400 block">
                Coach Qualitative Observation
              </label>
              <VoiceTranscribeButton
                onTranscribe={(text) => setCoachObservation(prev => prev ? `${prev} ${text}` : text)}
                promptContext={`This is a sports coach speaking qualitative training observations for a ${sport} athlete.`}
                buttonLabel="Dictate Note"
                size="sm"
                variant="pill"
              />
            </div>
            <textarea
              rows={3}
              value={coachObservation}
              onChange={e => setCoachObservation(e.target.value)}
              placeholder="Detailed technical and behavioural observations from training & match play (or tap 'Dictate Note' to speak)..."
              className="w-full bg-slate-800 border border-slate-700 rounded-2xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase tracking-wider text-slate-400 block">
                Coach Recommendations & Parent Guidance
              </label>
              <VoiceTranscribeButton
                onTranscribe={(text) => setCoachRecommendation(prev => prev ? `${prev} ${text}` : text)}
                promptContext={`This is a sports coach speaking actionable recommendations and parent advice for a ${sport} student.`}
                buttonLabel="Dictate Guidance"
                size="sm"
                variant="pill"
              />
            </div>
            <textarea
              rows={3}
              value={coachRecommendation}
              onChange={e => setCoachRecommendation(e.target.value)}
              placeholder="Recommended training focus, home practice drills, and encouragement (or tap 'Dictate Guidance' to speak)..."
              className="w-full bg-slate-800 border border-slate-700 rounded-2xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
            />
          </div>
        </div>

        {/* 3-Month Training Goals */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-black uppercase tracking-wider text-slate-400">
              3-Month Development Goals
            </label>
            <button
              type="button"
              onClick={handleAddGoal}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-xl text-xs font-bold border border-slate-700 flex items-center space-x-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Goal</span>
            </button>
          </div>

          {nextGoals.length === 0 ? (
            <p className="text-xs text-slate-500 italic bg-slate-800/40 p-4 rounded-2xl border border-slate-800">
              No training goals added yet. Click "+ Add Goal" or generate via AI.
            </p>
          ) : (
            <div className="space-y-2">
              {nextGoals.map((g, idx) => (
                <div key={g.id || idx} className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-black text-white">{g.goal}</p>
                    <p className="text-[11px] text-slate-400">Skill: {g.skill} | Target: {g.target}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveGoal(g.id)}
                    className="p-1.5 text-slate-400 hover:text-red-400 self-end sm:self-center"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Floating Bottom Action Dock */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t-2 border-slate-900 px-4 py-3 shadow-2xl flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center space-x-3">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-2xl font-black text-xs uppercase tracking-wider transition"
            >
              Cancel
            </button>
          )}

          <label className="hidden sm:flex items-center space-x-2 text-xs font-bold text-slate-700 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={syncToAthleteProfile}
              onChange={e => setSyncToAthleteProfile(e.target.checked)}
              className="rounded border-slate-300 text-slate-900 focus:ring-slate-900 w-4 h-4"
            />
            <span>Reflect {activeSkillIds.length} skills to {selectedPlayer?.name || 'Athlete'}'s profile</span>
          </label>
        </div>

        <div className="flex items-center space-x-3">
          <div className="text-right mr-2 hidden sm:block">
            <span className="text-[10px] font-bold text-slate-400 block uppercase">Calculated Overall</span>
            <span className="text-sm font-black text-slate-900">{overallScore}/100 • {developmentLevel}</span>
          </div>

          <button
            type="button"
            onClick={handleSave}
            className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-2xl text-xs sm:text-sm uppercase tracking-wider shadow-xl transition flex items-center space-x-2 active:scale-95"
          >
            <Save className="w-4 h-4 text-emerald-400" />
            <span>Save Assessment ({activeSkillIds.length} Skills)</span>
          </button>
        </div>
      </div>

      {/* Skill Selection Modal */}
      {isSkillModalOpen && (
        <SkillSelectionModal
          isOpen={isSkillModalOpen}
          onClose={() => setIsSkillModalOpen(false)}
          sport={sport}
          position={position}
          athlete={selectedPlayer}
          initialSelectedSkillIds={activeSkillIds}
          initialPreset={skillScope}
          onApply={handleApplyCustomSkills}
          title={`Configure Skills for ${selectedPlayer?.name || 'Athlete'}`}
        />
      )}

    </div>
  );
};
