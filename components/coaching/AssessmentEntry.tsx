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
  Layers
} from 'lucide-react';
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
  TrainingGoal
} from '../../services/academyService';
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
  
  // Assessment fields
  const [sport, setSport] = useState<CoachingSportId>('football');
  const [position, setPosition] = useState<string>('Midfielder');
  const [assessmentType, setAssessmentType] = useState<AssessmentType>('Monthly Review');
  const [assessmentDate, setAssessmentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [coachName, setCoachName] = useState<string>('Coach Vikram Roy');
  const [nextAssessmentDate, setNextAssessmentDate] = useState<string>('');

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
          return;
        }
      }

      // If new assessment, initialize default ratings based on sport template
      const template = SPORT_TEMPLATES[selectedPlayer.sport] || SPORT_TEMPLATES.football;
      const initialRatings: Record<string, number> = {};
      template.skills.forEach(s => {
        if (s.isCore) {
          initialRatings[s.id] = s.defaultScore;
        }
      });

      // Include position-specific skills for current player position
      const posObj = template.positions.find(pos => pos.id.toLowerCase() === selectedPlayer.position.toLowerCase() || pos.name.toLowerCase().includes(selectedPlayer.position.toLowerCase()));
      if (posObj) {
        setIncludedPositionSkills(posObj.skills);
        posObj.skills.forEach(sId => {
          const sObj = template.skills.find(s => s.id === sId);
          if (sObj) {
            initialRatings[sId] = sObj.defaultScore;
          }
        });
      }

      setSkillRatings(initialRatings);
    }
  }, [selectedPlayer, initialAssessmentId]);

  const currentTemplate = SPORT_TEMPLATES[sport] || SPORT_TEMPLATES.football;

  // Real-time score calculations
  const { domainScores, overallScore, developmentLevel, strengths, developmentPriorities } = useMemo(() => {
    const dScores = academyService.calculateDomainBreakdown(sport, skillRatings);
    const allRatings = Object.values(skillRatings);
    const oScore = calculateDevelopmentScore(allRatings);
    const dLevel = getDevelopmentLevel(oScore);
    const { strengths: str, developmentPriorities: prio } = academyService.calculateStrengthsAndPriorities(sport, skillRatings);

    return {
      domainScores: dScores,
      overallScore: oScore,
      developmentLevel: dLevel,
      strengths: str,
      developmentPriorities: prio
    };
  }, [sport, skillRatings]);

  const handleRatingChange = (skillId: string, rating: number) => {
    setSkillRatings(prev => ({ ...prev, [skillId]: rating }));
  };

  const handleObservationChange = (skillId: string, text: string) => {
    setSkillObservations(prev => ({ ...prev, [skillId]: text }));
  };

  const handleTargetChange = (skillId: string, text: string) => {
    setSkillTargets(prev => ({ ...prev, [skillId]: text }));
  };

  const togglePositionalSkill = (skillId: string) => {
    setIncludedPositionSkills(prev => {
      const exists = prev.includes(skillId);
      if (exists) {
        const next = prev.filter(id => id !== skillId);
        setSkillRatings(curr => {
          const c = { ...curr };
          delete c[skillId];
          return c;
        });
        return next;
      } else {
        const skill = currentTemplate.skills.find(s => s.id === skillId);
        if (skill) {
          setSkillRatings(curr => ({ ...curr, [skillId]: skill.defaultScore }));
        }
        return [...prev, skillId];
      }
    });
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

  const handleRemoveGoal = (id: string) => {
    setNextGoals(prev => prev.filter(g => g.id !== id));
  };

  const handleSave = () => {
    if (!selectedPlayer) {
      showToast('Please select a player', 'error');
      return;
    }

    const record: PlayerAssessmentRecord = {
      id: initialAssessmentId || `assess-${Date.now()}`,
      playerId: selectedPlayer.id,
      playerName: selectedPlayer.name,
      sport,
      position,
      assessmentType,
      assessmentDate,
      coachName: coachName || selectedPlayer.coachName || 'Coach',
      skillRatings,
      skillObservations,
      skillTargets,
      includedPositionSkills,
      domainScores,
      overallScore,
      developmentLevel,
      strengths,
      developmentPriorities,
      coachObservation,
      coachRecommendation,
      aiSuggestions: aiSuggestions || undefined,
      nextGoals,
      nextAssessmentDate,
      createdAt: new Date().toISOString()
    };

    academyService.saveAssessment(record);
    showToast(`Assessment saved for ${selectedPlayer.name}! Overall: ${overallScore}/100`, 'success');

    if (onSaved) onSaved(record);
  };

  // Filter skills by category
  const skillsToDisplay = useMemo(() => {
    return currentTemplate.skills.filter(s => {
      // Must be core OR explicitly included positional skill
      const isIncluded = s.isCore || includedPositionSkills.includes(s.id);
      if (!isIncluded) return false;
      if (activePillarFilter === 'all') return true;
      return s.category === activePillarFilter;
    });
  }, [currentTemplate, includedPositionSkills, activePillarFilter]);

  const levelColor = getDevelopmentLevelColor(developmentLevel);

  return (
    <div className="space-y-6 pb-20">
      
      {/* Header & Quick Summary Bar */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 border-2 border-slate-900 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <span className="px-3 py-1 bg-amber-500 text-slate-950 rounded-lg text-xs font-black uppercase tracking-wider">
              1–5 Coaching Scale Entry
            </span>
            <span className="text-xs text-slate-400 font-bold">
              Rapid Tap Interface • Instant Score Normalization
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight font-display">
            Player Development Assessment
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 font-medium mt-1">
            Evaluate technical, tactical, physical, and behavioral progression with seamless score calculation.
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
        <div className="bg-white border-2 border-slate-900 rounded-2xl p-5 shadow-sm space-y-3">
          <label className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center space-x-1.5">
            <User size={15} className="text-slate-900" />
            <span>1. Select Player</span>
          </label>
          <select
            value={selectedPlayerId}
            onChange={e => setSelectedPlayerId(e.target.value)}
            className="w-full bg-slate-50 border-2 border-slate-900 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            {players.map(p => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.sport.toUpperCase()} • {p.position} • {p.age}y)
              </option>
            ))}
          </select>
          {selectedPlayer && (
            <p className="text-[11px] text-slate-500 font-medium">
              Squad: <span className="font-bold text-slate-800">{selectedPlayer.batchOrTeam || 'Individual'}</span> | Dominant: {selectedPlayer.dominantSide}
            </p>
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
                const newSport = e.target.value as CoachingSportId;
                setSport(newSport);
                const tmpl = SPORT_TEMPLATES[newSport] || SPORT_TEMPLATES.football;
                if (tmpl.positions.length > 0) {
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
          <p className="text-[11px] text-slate-400 font-medium">
            Template: {currentTemplate.name} • {currentTemplate.skills.filter(s => s.isCore).length} Core Skills
          </p>
        </div>

        {/* 3. Cycle & Date */}
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
              <option value="Initial Assessment">Initial Assessment</option>
              <option value="Monthly Review">Monthly Review</option>
              <option value="3-Month Review">3-Month Review</option>
              <option value="6-Month Review">6-Month Review</option>
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

      {/* Positional Skills Toggle Drawer */}
      {currentTemplate.positions.length > 0 && (
        <div className="bg-blue-50/70 border-2 border-blue-900/30 rounded-2xl p-5 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center space-x-2">
              <Layers size={18} className="text-blue-700" />
              <h3 className="text-xs font-black uppercase tracking-wider text-blue-950">
                Position-Specific Skills ({position})
              </h3>
            </div>
            <span className="text-[11px] text-blue-700 font-semibold">
              Tap to include or exclude role-specific competencies
            </span>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            {currentTemplate.skills.filter(s => !s.isCore).map(posSkill => {
              const isSelected = includedPositionSkills.includes(posSkill.id);
              return (
                <button
                  key={posSkill.id}
                  onClick={() => togglePositionalSkill(posSkill.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black border transition-all flex items-center space-x-1.5 ${
                    isSelected 
                      ? 'bg-blue-600 text-white border-blue-800 shadow-sm' 
                      : 'bg-white text-slate-700 border-slate-300 hover:border-slate-500'
                  }`}
                >
                  <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] ${isSelected ? 'bg-white text-blue-700 font-black' : 'bg-slate-200 text-slate-600'}`}>
                    {isSelected ? '✓' : '+'}
                  </span>
                  <span>{posSkill.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Skill Assessment Matrix (Mobile-first 1-5 touch interface) */}
      <div className="bg-white border-2 border-slate-900 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        
        {/* Category Tabs / Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b-2 border-slate-100 pb-4 gap-4">
          <div>
            <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">
              Skill Evaluation Matrix
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Tap score 1 to 5 for each competency. Instant scoring & cues displayed below each skill.
            </p>
          </div>

          <div className="flex items-center space-x-1.5 overflow-x-auto pb-2 sm:pb-0">
            {(['all', 'technical', 'tactical', 'physical', 'gameBehaviour'] as const).map(pill => (
              <button
                key={pill}
                onClick={() => setActivePillarFilter(pill)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition ${
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
        <div className="space-y-4">
          {skillsToDisplay.map(skill => {
            const currentScore = skillRatings[skill.id] || 3;
            const currentScale = COACHING_SCALE_LABELS[currentScore];
            const obsText = skillObservations[skill.id] || '';
            const targetText = skillTargets[skill.id] || '';

            return (
              <div 
                key={skill.id}
                className="bg-slate-50/70 border-2 border-slate-200 hover:border-slate-900 rounded-2xl p-4 sm:p-5 transition space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-sm font-black text-slate-900">{skill.name}</h3>
                      <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-slate-200 text-slate-700">
                        {skill.category}
                      </span>
                      {!skill.isCore && (
                        <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-blue-100 text-blue-800">
                          Positional
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">{skill.description}</p>
                  </div>

                  {/* 1 to 5 Big Touch Rating Buttons */}
                  <div className="flex items-center space-x-1.5 self-start sm:self-auto">
                    {[1, 2, 3, 4, 5].map(num => {
                      const isSelected = currentScore === num;
                      const scale = COACHING_SCALE_LABELS[num];
                      return (
                        <button
                          key={num}
                          type="button"
                          onClick={() => handleRatingChange(skill.id, num)}
                          className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl font-black text-sm transition-all flex flex-col items-center justify-center border-2 ${
                            isSelected
                              ? 'bg-slate-900 text-white border-slate-900 shadow-md scale-105 ring-2 ring-amber-400'
                              : 'bg-white text-slate-700 border-slate-300 hover:border-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          <span>{num}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Score Meaning & Coaching Cue */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white p-3 rounded-xl border border-slate-200 text-xs gap-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-black uppercase text-slate-400">Current Rating:</span>
                    <span className="font-black" style={{ color: currentScale.color }}>
                      {currentScore}/5 — {currentScale.title}
                    </span>
                  </div>

                  <div className="text-slate-500 font-medium text-[11px] flex items-center space-x-1">
                    <span className="font-bold text-slate-700">Coaching Cue:</span>
                    <span>{skill.coachingCue}</span>
                  </div>
                </div>

                {/* Optional Note & Target input expandable */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <input
                    type="text"
                    value={obsText}
                    onChange={e => handleObservationChange(skill.id, e.target.value)}
                    placeholder={`Coach observation for ${skill.name} (optional)...`}
                    className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-800"
                  />
                  <input
                    type="text"
                    value={targetText}
                    onChange={e => handleTargetChange(skill.id, e.target.value)}
                    placeholder="Specific development target (e.g. 50 reps daily)..."
                    className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-800"
                  />
                </div>

              </div>
            );
          })}
        </div>

      </div>

      {/* AI Recommendations & Qualitative Feedback Section */}
      <div className="bg-white border-2 border-slate-900 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b-2 border-slate-100 pb-4 gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <Sparkles size={18} className="text-amber-500" />
              <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">
                Coach Feedback & AI Development Assistant
              </h2>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Generate constructive coach observations, strengths, priorities, and 3-month goals with 1 click.
            </p>
          </div>

          <button
            type="button"
            onClick={handleGenerateAi}
            disabled={isGeneratingAi}
            className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider shadow-lg flex items-center justify-center space-x-2 transition active:scale-95 disabled:opacity-50"
          >
            <Sparkles size={16} />
            <span>{isGeneratingAi ? 'Analyzing Skills...' : '⚡ Generate AI Coach Suggestions'}</span>
          </button>
        </div>

        {/* Auto-identified Strengths & Priorities */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-emerald-50 border-2 border-emerald-900/30 rounded-2xl p-4 space-y-2">
            <h4 className="text-xs font-black uppercase tracking-wider text-emerald-900 flex items-center space-x-1.5">
              <span>✓ Auto-Identified Strengths (Score ≥ 4)</span>
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {strengths.map((str, idx) => (
                <span key={idx} className="px-2.5 py-1 bg-white border border-emerald-300 rounded-lg text-xs font-bold text-emerald-950">
                  {str}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-amber-50 border-2 border-amber-900/30 rounded-2xl p-4 space-y-2">
            <h4 className="text-xs font-black uppercase tracking-wider text-amber-900 flex items-center space-x-1.5">
              <span>• Auto-Identified Development Priorities (Score ≤ 3)</span>
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {developmentPriorities.map((prio, idx) => (
                <span key={idx} className="px-2.5 py-1 bg-white border border-amber-300 rounded-lg text-xs font-bold text-amber-950">
                  {prio}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* AI Badge Note if AI was run */}
        {aiSuggestions && (
          <div className="p-4 bg-amber-500/10 border-2 border-amber-500/30 rounded-2xl flex items-start space-x-3">
            <Sparkles size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 bg-amber-500 text-slate-950 rounded text-[9px] font-black uppercase">
                  AI Coach Suggestions Active
                </span>
                <span className="text-xs text-amber-900 font-bold">Suggestions are loaded below and fully editable</span>
              </div>
              <p className="text-xs text-slate-700 font-medium mt-1">
                {aiSuggestions.trainingFocus}
              </p>
            </div>
          </div>
        )}

        {/* Coach Summary & Recommendations inputs */}
        <div className="space-y-4">
          <div>
            <label className="text-xs font-black uppercase tracking-wider text-slate-700 block mb-1.5">
              Coach's Comprehensive Observation
            </label>
            <textarea
              rows={3}
              value={coachObservation}
              onChange={e => setCoachObservation(e.target.value)}
              placeholder="Enter coach summary regarding overall game application, attitude, and tactical presence..."
              className="w-full bg-slate-50 border-2 border-slate-900 rounded-xl p-3 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="text-xs font-black uppercase tracking-wider text-slate-700 block mb-1.5">
              Recommended Home & Academy Training Focus
            </label>
            <input
              type="text"
              value={coachRecommendation}
              onChange={e => setCoachRecommendation(e.target.value)}
              placeholder="e.g. 15-minute daily wall passing, figure-8 dribble cones, and 1v1 small-sided match play..."
              className="w-full bg-slate-50 border-2 border-slate-900 rounded-xl p-3 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>

        {/* Next 3-Month Development Goals Manager */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center space-x-1.5">
              <TrendingUp size={16} className="text-blue-600" />
              <span>Next 3-Month Actionable Goals</span>
            </h3>
            <button
              type="button"
              onClick={handleAddGoal}
              className="px-3 py-1 bg-slate-900 text-white rounded-lg text-xs font-black uppercase tracking-wider hover:bg-slate-800 transition flex items-center space-x-1"
            >
              <Plus size={14} />
              <span>Add Goal</span>
            </button>
          </div>

          {nextGoals.length === 0 ? (
            <p className="text-xs text-slate-400 italic bg-slate-50 p-4 rounded-xl border border-slate-200">
              No specific goals defined yet. Click "Generate AI Coach Suggestions" or "Add Goal" above to create milestones.
            </p>
          ) : (
            <div className="space-y-2">
              {nextGoals.map((g, idx) => (
                <div key={g.id || idx} className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="text"
                      value={g.skill}
                      onChange={e => {
                        const val = e.target.value;
                        setNextGoals(prev => prev.map((item, i) => i === idx ? { ...item, skill: val } : item));
                      }}
                      placeholder="Skill Focus"
                      className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-800"
                    />
                    <input
                      type="text"
                      value={g.goal}
                      onChange={e => {
                        const val = e.target.value;
                        setNextGoals(prev => prev.map((item, i) => i === idx ? { ...item, goal: val } : item));
                      }}
                      placeholder="Development Goal"
                      className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-medium text-slate-800"
                    />
                    <input
                      type="text"
                      value={g.target}
                      onChange={e => {
                        const val = e.target.value;
                        setNextGoals(prev => prev.map((item, i) => i === idx ? { ...item, target: val } : item));
                      }}
                      placeholder="Target Milestone"
                      className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-medium text-slate-800"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveGoal(g.id)}
                    className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition self-end sm:self-auto"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Action Floating / Sticky Save Bar */}
      <div className="sticky bottom-4 z-20 bg-slate-900 border-2 border-slate-900 rounded-2xl p-4 shadow-2xl flex items-center justify-between text-white">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 font-black flex items-center justify-center text-sm">
            {overallScore}
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-wider">{selectedPlayer?.name || 'Player Assessment'}</p>
            <p className="text-[11px] text-slate-400">{assessmentType} • Level: {developmentLevel}</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-black uppercase tracking-wider transition"
            >
              Cancel
            </button>
          )}

          <button
            type="button"
            onClick={handleSave}
            className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-black uppercase tracking-wider shadow-lg flex items-center space-x-2 transition active:scale-95"
          >
            <Save size={16} />
            <span>Save Assessment</span>
          </button>
        </div>
      </div>

    </div>
  );
};
