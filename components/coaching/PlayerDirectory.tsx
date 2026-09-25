import React, { useState, useMemo, useCallback } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  User, 
  Calendar, 
  ShieldCheck, 
  Phone, 
  Mail, 
  Award, 
  TrendingUp, 
  Activity, 
  FileText, 
  Trash2, 
  Edit3, 
  ChevronRight, 
  X, 
  CheckCircle2, 
  Target, 
  Sparkles,
  Layers,
  Heart,
  Upload,
  CheckSquare,
  Square,
  Sliders,
  Check
} from 'lucide-react';
import { 
  academyService, 
  PlayerProfileData, 
  PlayerAssessmentRecord, 
  CoachingSportId, 
  SPORT_TEMPLATES, 
  COACHING_SCALE_LABELS, 
  getDevelopmentLevelColor 
} from '../../services/academyService';
import { 
  SkillPresetType, 
  getPresetSkillIdsForSport, 
  SKILL_PRESETS_META 
} from '../../services/coachingSkillsDatabase';
import { StudentImportModal } from './StudentImportModal';
import { SkillSelectionModal } from './SkillSelectionModal';
import { showToast } from '../../services/toast';

interface PlayerDirectoryProps {
  onNewAssessment: (playerId: string) => void;
  onViewReport: (player: PlayerProfileData, assessment: PlayerAssessmentRecord) => void;
}

export const PlayerDirectory: React.FC<PlayerDirectoryProps> = ({
  onNewAssessment,
  onViewReport
}) => {
  const [players, setPlayers] = useState<PlayerProfileData[]>(() => academyService.getPlayers());
  const [searchQuery, setSearchQuery] = useState('');
  const [sportFilter, setSportFilter] = useState<string>('all');
  const [batchFilter, setBatchFilter] = useState<string>('all');
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<Set<string>>(new Set());

  // Add / Edit Modal State
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<PlayerProfileData | null>(null);

  // Student Import Modal State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Player Profile Modal State (with 6 tabs)
  const [profilePlayer, setProfilePlayer] = useState<PlayerProfileData | null>(null);
  const [activeProfileTab, setActiveProfileTab] = useState<'overview' | 'assessments' | 'skills' | 'training' | 'progress' | 'reports'>('overview');

  // Skill Selection Configuration Modal State
  const [skillConfigAthlete, setSkillConfigAthlete] = useState<PlayerProfileData | null>(null);
  const [isSkillConfigOpen, setIsSkillConfigOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'profile' | 'form'>('profile');

  // Form State for Add / Edit
  const [formData, setFormData] = useState<Partial<PlayerProfileData>>({
    name: '',
    dob: '2012-01-01',
    age: 12,
    gender: 'Male',
    sport: 'football',
    position: 'Midfielder',
    batchOrTeam: '',
    coachName: 'Coach Vikram Roy',
    joiningDate: new Date().toISOString().split('T')[0],
    parentName: '',
    parentContact: '',
    dominantSide: 'Right Foot / Right Hand',
    previousExperience: '',
    playerGoals: '',
    medicalNotes: '',
    selectedSkillIds: [],
    skillPlanPreset: 'core',
    active: true
  });

  const refreshPlayers = useCallback(() => {
    setPlayers(academyService.getPlayers());
  }, []);

  // Batches list for filter
  const batches = useMemo(() => {
    const set = new Set<string>();
    players.forEach(p => {
      if (p.batchOrTeam) set.add(p.batchOrTeam);
    });
    return Array.from(set);
  }, [players]);

  // Active Sports with player counts for game-wise filtering
  const activeSportsWithCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    players.forEach(p => {
      counts[p.sport] = (counts[p.sport] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([sportKey, count]) => ({
        sport: sportKey,
        count,
        name: SPORT_TEMPLATES[sportKey as CoachingSportId]?.name || sportKey
      }))
      .sort((a, b) => b.count - a.count);
  }, [players]);

  // Filtered Players
  const filteredPlayers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return players.filter(p => {
      const matchSearch = !q || 
                          p.name.toLowerCase().includes(q) ||
                          p.parentName.toLowerCase().includes(q) ||
                          p.position.toLowerCase().includes(q);
      const matchSport = sportFilter === 'all' || p.sport === sportFilter;
      const matchBatch = batchFilter === 'all' || p.batchOrTeam === batchFilter;
      return matchSearch && matchSport && matchBatch;
    });
  }, [players, searchQuery, sportFilter, batchFilter]);

  const handleOpenAdd = () => {
    setEditingPlayer(null);
    const defaultSport: CoachingSportId = 'football';
    const tmpl = SPORT_TEMPLATES[defaultSport];
    const defaultSkills = getPresetSkillIdsForSport(defaultSport, 'core', tmpl.skills, tmpl.positions, 'Midfielder');

    setFormData({
      name: '',
      dob: '2012-01-01',
      age: 12,
      gender: 'Male',
      sport: defaultSport,
      position: 'Midfielder',
      batchOrTeam: 'Morning Batch A',
      coachName: 'Coach Vikram Roy',
      joiningDate: new Date().toISOString().split('T')[0],
      parentName: '',
      parentContact: '',
      dominantSide: 'Right Foot / Right Hand',
      previousExperience: '',
      playerGoals: '',
      medicalNotes: '',
      selectedSkillIds: defaultSkills,
      skillPlanPreset: 'core',
      active: true
    });
    setIsAddEditOpen(true);
  };

  const handleOpenEdit = (player: PlayerProfileData) => {
    setEditingPlayer(player);
    const tmpl = SPORT_TEMPLATES[player.sport] || SPORT_TEMPLATES.football;
    const initialSkills = player.selectedSkillIds && player.selectedSkillIds.length > 0
      ? player.selectedSkillIds
      : getPresetSkillIdsForSport(player.sport, player.skillPlanPreset || 'core', tmpl.skills, tmpl.positions, player.position);

    setFormData({ 
      ...player,
      selectedSkillIds: initialSkills,
      skillPlanPreset: player.skillPlanPreset || 'core'
    });
    setIsAddEditOpen(true);
  };

  const handleSportChangeInForm = (newSport: CoachingSportId) => {
    const tmpl = SPORT_TEMPLATES[newSport] || SPORT_TEMPLATES.football;
    const defaultPos = tmpl.positions[0]?.name || 'All-Rounder';
    const preset = formData.skillPlanPreset || 'core';
    const newSkills = getPresetSkillIdsForSport(newSport, preset, tmpl.skills, tmpl.positions, defaultPos);

    setFormData(prev => ({
      ...prev,
      sport: newSport,
      position: defaultPos,
      selectedSkillIds: newSkills
    }));
  };

  const handlePresetChangeInForm = (preset: SkillPresetType) => {
    const s = (formData.sport as CoachingSportId) || 'football';
    const tmpl = SPORT_TEMPLATES[s] || SPORT_TEMPLATES.football;
    const ids = getPresetSkillIdsForSport(s, preset, tmpl.skills, tmpl.positions, formData.position);
    
    setFormData(prev => ({
      ...prev,
      skillPlanPreset: preset,
      selectedSkillIds: ids
    }));
  };

  const handleOpenCustomSkillsFromForm = () => {
    setModalMode('form');
    setIsSkillConfigOpen(true);
  };

  const handleSavePlayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      showToast('Please enter student / player name', 'error');
      return;
    }

    const s = (formData.sport as CoachingSportId) || 'football';
    const tmpl = SPORT_TEMPLATES[s] || SPORT_TEMPLATES.football;
    const finalSkills = formData.selectedSkillIds && formData.selectedSkillIds.length > 0
      ? formData.selectedSkillIds
      : getPresetSkillIdsForSport(s, formData.skillPlanPreset || 'core', tmpl.skills, tmpl.positions, formData.position);

    const newRecord: PlayerProfileData = {
      id: editingPlayer ? editingPlayer.id : `athlete-${Date.now()}`,
      name: formData.name || 'Unnamed Player',
      dob: formData.dob || '2012-01-01',
      age: Number(formData.age) || 12,
      gender: (formData.gender as any) || 'Male',
      sport: s,
      position: formData.position || 'All-Rounder',
      batchOrTeam: formData.batchOrTeam || 'General Batch',
      coachName: formData.coachName || 'Coach',
      coachId: formData.coachId || 'coach-001',
      joiningDate: formData.joiningDate || new Date().toISOString().split('T')[0],
      parentName: formData.parentName || '',
      parentContact: formData.parentContact || '',
      dominantSide: formData.dominantSide || 'Right Foot / Right Hand',
      previousExperience: formData.previousExperience || '',
      playerGoals: formData.playerGoals || '',
      medicalNotes: formData.medicalNotes || '',
      selectedSkillIds: finalSkills,
      skillPlanPreset: formData.skillPlanPreset || 'core',
      createdAt: editingPlayer ? editingPlayer.createdAt : new Date().toISOString(),
      active: formData.active ?? true
    };

    academyService.savePlayer(newRecord);
    refreshPlayers();
    setIsAddEditOpen(false);
    showToast(`Player profile for ${newRecord.name} saved successfully! (${finalSkills.length} skills set)`, 'success');
  };

  const handleDeletePlayer = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to remove player ${name}?`)) {
      academyService.deletePlayer(id);
      setSelectedPlayerIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      refreshPlayers();
      if (profilePlayer?.id === id) {
        setProfilePlayer(null);
      }
      showToast('Player removed', 'success');
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedPlayerIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAllFiltered = () => {
    if (selectedPlayerIds.size === filteredPlayers.length && filteredPlayers.length > 0) {
      setSelectedPlayerIds(new Set());
    } else {
      setSelectedPlayerIds(new Set(filteredPlayers.map(p => p.id)));
    }
  };

  const handleBulkDelete = () => {
    if (selectedPlayerIds.size === 0) return;
    const count = selectedPlayerIds.size;
    if (window.confirm(`Are you sure you want to delete ${count} selected player(s)?`)) {
      const deletedCount = academyService.deletePlayersBulk(Array.from(selectedPlayerIds));
      setSelectedPlayerIds(new Set());
      refreshPlayers();
      showToast(`Deleted ${deletedCount} player profiles!`, 'success');
    }
  };

  const handleDeleteSportBatch = (sport: CoachingSportId, sportName: string) => {
    const sportAthletes = players.filter(p => p.sport === sport);
    if (sportAthletes.length === 0) return;
    if (window.confirm(`Are you sure you want to delete ALL ${sportAthletes.length} players enrolled in ${sportName}?`)) {
      const count = academyService.deletePlayersBySport(sport);
      setSelectedPlayerIds(new Set());
      refreshPlayers();
      showToast(`Deleted all ${count} players from ${sportName}`, 'info');
    }
  };

  // Profile data for active player modal
  const profileAssessments = useMemo(() => {
    if (!profilePlayer) return [];
    return academyService.getAssessmentsForPlayer(profilePlayer.id);
  }, [profilePlayer]);

  const latestAssessment = useMemo(() => {
    if (profileAssessments.length === 0) return null;
    return profileAssessments[profileAssessments.length - 1];
  }, [profileAssessments]);

  const profileGoals = useMemo(() => {
    return latestAssessment?.nextGoals || [];
  }, [latestAssessment]);

  const currentFormTemplate = SPORT_TEMPLATES[(formData.sport as CoachingSportId) || 'football'] || SPORT_TEMPLATES.football;

  return (
    <div className="space-y-6">
      
      {/* Header & Controls */}
      <div className="bg-white border-2 border-slate-900 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 rounded-md text-[10px] font-black uppercase tracking-wider">
              Students & Batches
            </span>
            <span className="text-xs text-slate-400 font-bold">
              {players.length} Registered Students
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-display">
            Student & Player Directory
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Manage player details, choose skills to assess (12 basic, 20 standard, or all 40), and track progress.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="px-4 py-3 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-2xl text-xs uppercase tracking-wider transition shadow-md flex items-center justify-center space-x-2 active:scale-95"
          >
            <Upload size={16} className="text-amber-400" />
            <span>Upload Student List (CSV / Excel)</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="px-5 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-2xl text-xs uppercase tracking-wider transition shadow-md flex items-center justify-center space-x-2 active:scale-95"
          >
            <Plus size={18} />
            <span>+ Add New Player</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by student, parent, position..."
            className="w-full bg-white border-2 border-slate-900 rounded-2xl pl-10 pr-4 py-2.5 text-xs font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div>
          <select
            value={sportFilter}
            onChange={e => setSportFilter(e.target.value)}
            className="w-full bg-white border-2 border-slate-900 rounded-2xl px-4 py-2.5 text-xs font-bold text-slate-900 focus:outline-none"
          >
            <option value="all">All Sports ({Object.keys(SPORT_TEMPLATES).length} Games)</option>
            {Object.values(SPORT_TEMPLATES).map(tmpl => (
              <option key={tmpl.id} value={tmpl.id}>
                {tmpl.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={batchFilter}
            onChange={e => setBatchFilter(e.target.value)}
            className="w-full bg-white border-2 border-slate-900 rounded-2xl px-4 py-2.5 text-xs font-bold text-slate-900 focus:outline-none"
          >
            <option value="all">All Batches & Groups</option>
            {batches.map(b => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Game-wise Quick Chips */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
        <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 mr-1 shrink-0">
          Game-wise:
        </span>

        <button
          type="button"
          onClick={() => setSportFilter('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider whitespace-nowrap transition flex items-center space-x-1.5 shrink-0 ${
            sportFilter === 'all'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <span>All Games</span>
          <span className={`px-1.5 py-0.2 rounded-md text-[10px] ${
            sportFilter === 'all' ? 'bg-amber-400 text-slate-950 font-black' : 'bg-slate-100 text-slate-600'
          }`}>
            {players.length}
          </span>
        </button>

        {activeSportsWithCounts.map(({ sport, count, name }) => (
          <button
            key={sport}
            type="button"
            onClick={() => setSportFilter(sport)}
            className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider whitespace-nowrap transition flex items-center space-x-1.5 shrink-0 ${
              sportFilter === sport
                ? 'bg-amber-500 text-slate-950 border-2 border-slate-900 shadow-sm font-black'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <span>{name}</span>
            <span className={`px-1.5 py-0.2 rounded-md text-[10px] ${
              sportFilter === sport ? 'bg-slate-950 text-white font-black' : 'bg-slate-100 text-slate-600'
            }`}>
              {count}
            </span>
          </button>
        ))}
      </div>

      {/* List Controls: Bulk Operations & Selection */}
      <div className="bg-slate-50 border-2 border-slate-200 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={handleSelectAllFiltered}
            className="flex items-center space-x-1.5 font-black text-slate-800 hover:text-slate-950"
          >
            {selectedPlayerIds.size > 0 && selectedPlayerIds.size === filteredPlayers.length ? (
              <CheckSquare size={16} className="text-amber-500" />
            ) : (
              <Square size={16} className="text-slate-400" />
            )}
            <span>
              {selectedPlayerIds.size === filteredPlayers.length && filteredPlayers.length > 0
                ? 'Deselect All'
                : `Select All (${filteredPlayers.length})`}
            </span>
          </button>
          <span className="text-slate-400 font-bold">|</span>
          <span className="text-slate-500 font-medium">
            Showing <strong className="text-slate-900">{filteredPlayers.length}</strong> of {players.length} registered students
          </span>
        </div>

        <div className="flex items-center space-x-2">
          {/* Delete Sport Batch Button if specific sport filter is active */}
          {sportFilter !== 'all' && (
            <button
              type="button"
              onClick={() => handleDeleteSportBatch(sportFilter as CoachingSportId, SPORT_TEMPLATES[sportFilter as CoachingSportId]?.name || sportFilter)}
              className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-[11px] font-black uppercase tracking-wider transition flex items-center space-x-1"
            >
              <Trash2 size={13} />
              <span>Delete {SPORT_TEMPLATES[sportFilter as CoachingSportId]?.name || sportFilter} Batch</span>
            </button>
          )}

          {/* Bulk Delete Button when items are selected */}
          {selectedPlayerIds.size > 0 && (
            <button
              type="button"
              onClick={handleBulkDelete}
              className="px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-[11px] font-black uppercase tracking-wider transition flex items-center space-x-1.5 shadow-sm animate-pulse"
            >
              <Trash2 size={14} />
              <span>Delete Selected ({selectedPlayerIds.size})</span>
            </button>
          )}
        </div>
      </div>

      {/* Players Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPlayers.map(player => {
          const sportTemplate = SPORT_TEMPLATES[player.sport] || SPORT_TEMPLATES.football;
          const playerAssessments = academyService.getAssessmentsForPlayer(player.id);
          const latest = playerAssessments.length > 0 ? playerAssessments[playerAssessments.length - 1] : null;
          const levelStyle = latest ? getDevelopmentLevelColor(latest.developmentLevel) : null;
          const isSelected = selectedPlayerIds.has(player.id);
          const configuredSkillsCount = player.selectedSkillIds?.length || 12;

          return (
            <div
              key={player.id}
              className={`bg-white border-2 rounded-3xl p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4 group relative ${
                isSelected ? 'border-amber-500 bg-amber-50/20 ring-2 ring-amber-400' : 'border-slate-900'
              }`}
            >
              <div>
                {/* Top Badge, Checkbox & Status */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleSelect(player.id)}
                      className="w-4 h-4 rounded text-amber-500 border-2 border-slate-900 focus:ring-0 cursor-pointer accent-amber-500"
                    />
                    <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                      {sportTemplate.name}
                    </span>
                  </div>

                  {latest ? (
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-md border ${levelStyle?.bg} ${levelStyle?.text} ${levelStyle?.border}`}>
                      Level: {latest.developmentLevel} ({latest.overallScore}/100)
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-slate-400">
                      Pending Assessment
                    </span>
                  )}
                </div>

                {/* Player Name & Role */}
                <div className="flex items-start space-x-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-900 text-amber-400 font-black flex items-center justify-center text-base flex-shrink-0">
                    {player.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900 leading-tight group-hover:text-blue-600 transition">
                      {player.name}
                    </h3>
                    <p className="text-xs text-slate-500 font-semibold mt-0.5">
                      {player.position} • {player.age} yrs • {player.gender}
                    </p>
                    <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                      Batch: <span className="text-slate-800 font-bold">{player.batchOrTeam || 'Individual'}</span>
                    </p>
                  </div>
                </div>

                {/* Skill Plan Badge on Card */}
                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 font-semibold">Configured Skills:</span>
                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 rounded font-black border border-emerald-200">
                    {configuredSkillsCount} Skills ({player.skillPlanPreset === 'master40' ? 'All 40' : player.skillPlanPreset === 'development' ? '20 Standard' : player.skillPlanPreset === 'core' ? '12 Basic' : 'Custom'})
                  </span>
                </div>
              </div>

              {/* Card Action Buttons */}
              <div className="pt-3 border-t-2 border-slate-100 flex items-center justify-between gap-1.5 flex-wrap">
                <button
                  onClick={() => {
                    setProfilePlayer(player);
                    setActiveProfileTab('overview');
                  }}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-900 hover:text-white text-slate-900 rounded-xl text-xs font-black uppercase tracking-wider transition text-center min-w-[85px]"
                >
                  View Profile
                </button>

                <button
                  onClick={() => {
                    setSkillConfigAthlete(player);
                    setModalMode('profile');
                    setIsSkillConfigOpen(true);
                  }}
                  className="px-2.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-black transition flex items-center space-x-1"
                  title="Configure skills for this student"
                >
                  <Sliders size={13} />
                  <span>{configuredSkillsCount} Skills</span>
                </button>

                <button
                  onClick={() => onNewAssessment(player.id)}
                  className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-black uppercase tracking-wider transition shadow-sm"
                  title="Conduct Assessment"
                >
                  Assess
                </button>

                <button
                  onClick={() => handleOpenEdit(player)}
                  className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition"
                  title="Edit details"
                >
                  <Edit3 size={15} />
                </button>

                <button
                  onClick={() => handleDeletePlayer(player.id, player.name)}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition"
                  title="Delete student profile"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Player Modal */}
      {isAddEditOpen && (
        <div className="fixed inset-0 z-[320] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white border-2 border-slate-900 rounded-3xl max-w-3xl w-full p-5 sm:p-7 space-y-5 shadow-2xl animate-slide-up max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b-2 border-slate-100 pb-3">
              <div>
                <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                  {editingPlayer ? `Edit Student Profile (${editingPlayer.name})` : 'Register New Student / Player'}
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  Select game, batch, and skill level (12 basic, 20 standard, or all 40 skills).
                </p>
              </div>
              <button
                onClick={() => setIsAddEditOpen(false)}
                className="p-2 hover:bg-slate-100 rounded-xl text-slate-400"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSavePlayer} className="space-y-4 text-xs font-bold">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-slate-700 uppercase tracking-wider mb-1">Student Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name || ''}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Aarav Sharma"
                    className="w-full bg-slate-50 border-2 border-slate-900 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 uppercase tracking-wider mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={formData.dob || ''}
                    onChange={e => {
                      const dobVal = e.target.value;
                      const birthYear = new Date(dobVal).getFullYear();
                      const currentYear = new Date().getFullYear();
                      const calculatedAge = currentYear - birthYear;
                      setFormData({ ...formData, dob: dobVal, age: calculatedAge > 0 ? calculatedAge : 12 });
                    }}
                    className="w-full bg-slate-50 border-2 border-slate-900 rounded-xl px-3 py-2 text-xs font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 uppercase tracking-wider mb-1">Age & Gender</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      value={formData.age || 12}
                      onChange={e => setFormData({ ...formData, age: Number(e.target.value) })}
                      placeholder="Age"
                      className="w-full bg-slate-50 border-2 border-slate-900 rounded-xl px-3 py-2 text-xs font-bold text-slate-900"
                    />
                    <select
                      value={formData.gender || 'Male'}
                      onChange={e => setFormData({ ...formData, gender: e.target.value as any })}
                      className="w-full bg-slate-50 border-2 border-slate-900 rounded-xl px-3 py-2 text-xs font-bold text-slate-900"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                {/* Sport Selection (All 12 Sports) */}
                <div>
                  <label className="block text-slate-700 uppercase tracking-wider mb-1">Sport / Game *</label>
                  <select
                    value={formData.sport || 'football'}
                    onChange={e => handleSportChangeInForm(e.target.value as CoachingSportId)}
                    className="w-full bg-amber-50 border-2 border-slate-900 rounded-xl px-3 py-2 text-xs font-black text-slate-900 focus:outline-none"
                  >
                    {Object.values(SPORT_TEMPLATES).map(tmpl => (
                      <option key={tmpl.id} value={tmpl.id}>
                        {tmpl.name} ({tmpl.skills.length} Skills Available)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 uppercase tracking-wider mb-1">Playing Role / Position</label>
                  <select
                    value={formData.position || ''}
                    onChange={e => setFormData({ ...formData, position: e.target.value })}
                    className="w-full bg-slate-50 border-2 border-slate-900 rounded-xl px-3 py-2 text-xs font-bold text-slate-900"
                  >
                    {currentFormTemplate.positions.map(pos => (
                      <option key={pos.id} value={pos.name}>
                        {pos.name}
                      </option>
                    ))}
                    <option value="All-Rounder">All-Rounder / General</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 uppercase tracking-wider mb-1">Batch / Group</label>
                  <input
                    type="text"
                    value={formData.batchOrTeam || ''}
                    onChange={e => setFormData({ ...formData, batchOrTeam: e.target.value })}
                    placeholder="e.g. Morning Batch A, Weekend U-12"
                    className="w-full bg-slate-50 border-2 border-slate-900 rounded-xl px-3 py-2 text-xs font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 uppercase tracking-wider mb-1">Assigned Coach</label>
                  <input
                    type="text"
                    value={formData.coachName || ''}
                    onChange={e => setFormData({ ...formData, coachName: e.target.value })}
                    placeholder="Coach Name"
                    className="w-full bg-slate-50 border-2 border-slate-900 rounded-xl px-3 py-2 text-xs font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 uppercase tracking-wider mb-1">Dominant Foot / Hand</label>
                  <select
                    value={formData.dominantSide || 'Right Foot / Right Hand'}
                    onChange={e => setFormData({ ...formData, dominantSide: e.target.value })}
                    className="w-full bg-slate-50 border-2 border-slate-900 rounded-xl px-3 py-2 text-xs font-bold text-slate-900"
                  >
                    <option value="Right Foot / Right Hand">Right Foot / Right Hand</option>
                    <option value="Left Foot / Left Hand">Left Foot / Left Hand</option>
                    <option value="Ambidextrous / Both">Ambidextrous / Both</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 uppercase tracking-wider mb-1">Parent / Guardian Name</label>
                  <input
                    type="text"
                    value={formData.parentName || ''}
                    onChange={e => setFormData({ ...formData, parentName: e.target.value })}
                    placeholder="Parent Name"
                    className="w-full bg-slate-50 border-2 border-slate-900 rounded-xl px-3 py-2 text-xs font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 uppercase tracking-wider mb-1">Parent Contact / Phone</label>
                  <input
                    type="text"
                    value={formData.parentContact || ''}
                    onChange={e => setFormData({ ...formData, parentContact: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full bg-slate-50 border-2 border-slate-900 rounded-xl px-3 py-2 text-xs font-bold text-slate-900"
                  />
                </div>
              </div>

              {/* SKILL LEVEL SELECTOR (Direct on the Form) */}
              <div className="bg-slate-900 text-white p-4 rounded-2xl border-2 border-slate-900 space-y-2.5">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center space-x-2">
                    <span className="w-6 h-6 rounded-lg bg-amber-400 text-slate-950 font-black flex items-center justify-center text-xs">
                      ★
                    </span>
                    <span className="text-xs font-black uppercase tracking-wider text-amber-300">
                      Skill Level to Assess for {formData.name || 'this Student'}:
                    </span>
                  </div>
                  <span className="text-xs font-black bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-400/30">
                    {formData.selectedSkillIds?.length || 12} Skills Active
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'core', label: 'Basic Skills (12)', desc: 'Fundamental essentials' },
                    { id: 'development', label: 'Standard (20)', desc: 'Core + Development' },
                    { id: 'master40', label: 'All Skills (40)', desc: 'Full game mastery' },
                    { id: 'positional', label: 'Role Specific', desc: `Focus on ${formData.position}` }
                  ].map(p => {
                    const isSelected = formData.skillPlanPreset === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handlePresetChangeInForm(p.id as SkillPresetType)}
                        className={`p-2 rounded-xl text-left transition border ${
                          isSelected
                            ? 'bg-amber-400 text-slate-950 border-amber-400 font-black shadow-md'
                            : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
                        }`}
                      >
                        <p className="text-[11px] font-black">{p.label}</p>
                        <p className={`text-[9px] ${isSelected ? 'text-slate-800 font-bold' : 'text-slate-400'}`}>{p.desc}</p>
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between pt-1">
                  <p className="text-[10px] text-slate-300">
                    Want to hand-pick specific skills?
                  </p>
                  <button
                    type="button"
                    onClick={handleOpenCustomSkillsFromForm}
                    className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-400/40 rounded-lg text-xs font-bold transition flex items-center space-x-1"
                  >
                    <Sliders size={12} />
                    <span>Customize Skill List</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 uppercase tracking-wider mb-1">Student's Goals (Optional)</label>
                <textarea
                  rows={2}
                  value={formData.playerGoals || ''}
                  onChange={e => setFormData({ ...formData, playerGoals: e.target.value })}
                  placeholder="e.g. Master weak-foot passing and improve match stamina..."
                  className="w-full bg-slate-50 border-2 border-slate-900 rounded-xl p-2.5 text-xs font-medium text-slate-900"
                />
              </div>

              <div>
                <label className="block text-slate-700 uppercase tracking-wider mb-1">Health & Injury Notes (Optional)</label>
                <input
                  type="text"
                  value={formData.medicalNotes || ''}
                  onChange={e => setFormData({ ...formData, medicalNotes: e.target.value })}
                  placeholder="e.g. Cleared for all activities"
                  className="w-full bg-slate-50 border-2 border-slate-900 rounded-xl px-3 py-2 text-xs font-medium text-slate-900"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t-2 border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddEditOpen(false)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl uppercase tracking-wider font-black text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl uppercase tracking-wider font-black text-xs shadow-md"
                >
                  Save Student Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Student Profile Modal with 6 Tabs */}
      {profilePlayer && (
        <div className="fixed inset-0 z-[310] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white border-2 border-slate-900 rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl">
            
            {/* Profile Modal Top Header */}
            <div className="bg-slate-900 text-white p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 flex-shrink-0">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 rounded-2xl bg-amber-500 text-slate-950 font-black text-2xl flex items-center justify-center shadow-lg">
                  {profilePlayer.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h2 className="text-xl font-black">{profilePlayer.name}</h2>
                    <span className="px-2.5 py-0.5 bg-blue-500 text-white rounded-md text-[10px] font-black uppercase tracking-wider">
                      {profilePlayer.sport}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 font-medium mt-0.5">
                    {profilePlayer.position} • {profilePlayer.age} Years • Batch: {profilePlayer.batchOrTeam || 'Individual'}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2 self-end sm:self-center">
                <button
                  type="button"
                  onClick={() => handleDeletePlayer(profilePlayer.id, profilePlayer.name)}
                  className="px-3.5 py-2 bg-red-600/90 hover:bg-red-600 text-white font-black rounded-xl text-xs uppercase tracking-wider flex items-center space-x-1.5 transition shadow"
                  title="Delete this student profile"
                >
                  <Trash2 size={14} />
                  <span>Delete Profile</span>
                </button>
                <button
                  onClick={() => onNewAssessment(profilePlayer.id)}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider shadow-md"
                >
                  + Conduct Assessment
                </button>
                <button
                  onClick={() => setProfilePlayer(null)}
                  className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* 6 Tabs Navigation Bar */}
            <div className="bg-slate-100 border-b-2 border-slate-200 px-6 flex items-center space-x-2 overflow-x-auto flex-shrink-0">
              {(['overview', 'assessments', 'skills', 'training', 'progress', 'reports'] as const).map(tabKey => (
                <button
                  key={tabKey}
                  onClick={() => setActiveProfileTab(tabKey)}
                  className={`py-3 px-4 text-xs font-black uppercase tracking-wider border-b-2 transition whitespace-nowrap ${
                    activeProfileTab === tabKey
                      ? 'border-slate-900 text-slate-900 bg-white rounded-t-xl'
                      : 'border-transparent text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {tabKey}
                </button>
              ))}
            </div>

            {/* Modal Body Tab Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Tab 1: Overview */}
              {activeProfileTab === 'overview' && (
                <div className="space-y-6 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                      <span className="text-[10px] font-black uppercase text-slate-400 block mb-1">Basic Profile</span>
                      <p className="font-bold text-slate-900">DOB: {profilePlayer.dob}</p>
                      <p className="text-slate-600 font-medium">Age: {profilePlayer.age} • {profilePlayer.gender}</p>
                      <p className="text-slate-600 font-medium">Joined: {profilePlayer.joiningDate}</p>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                      <span className="text-[10px] font-black uppercase text-slate-400 block mb-1">Athletic Setup</span>
                      <p className="font-bold text-slate-900">Sport: {profilePlayer.sport.toUpperCase()}</p>
                      <p className="text-slate-600 font-medium">Role: {profilePlayer.position}</p>
                      <p className="text-slate-600 font-medium">Side: {profilePlayer.dominantSide}</p>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                      <span className="text-[10px] font-black uppercase text-slate-400 block mb-1">Parent Contacts</span>
                      <p className="font-bold text-slate-900">{profilePlayer.parentName || 'Parent / Guardian'}</p>
                      <p className="text-slate-600 font-medium">{profilePlayer.parentContact || 'No contact provided'}</p>
                      <p className="text-slate-500 text-[11px]">Coach: {profilePlayer.coachName}</p>
                    </div>
                  </div>

                  {profilePlayer.playerGoals && (
                    <div className="p-4 bg-blue-50/70 border-2 border-blue-900/20 rounded-2xl">
                      <h4 className="font-black uppercase tracking-wider text-blue-950 mb-1">Student's Goals</h4>
                      <p className="text-slate-700 font-medium">{profilePlayer.playerGoals}</p>
                    </div>
                  )}

                  {profilePlayer.medicalNotes && (
                    <div className="p-4 bg-amber-50/70 border-2 border-amber-900/20 rounded-2xl">
                      <h4 className="font-black uppercase tracking-wider text-amber-950 mb-1">Health Notes</h4>
                      <p className="text-slate-700 font-medium">{profilePlayer.medicalNotes}</p>
                    </div>
                  )}

                  <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100">
                    <button
                      onClick={() => handleDeletePlayer(profilePlayer.id, profilePlayer.name)}
                      className="px-4 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-xl text-xs font-black uppercase tracking-wider transition"
                    >
                      Delete Profile
                    </button>
                    <button
                      onClick={() => {
                        handleOpenEdit(profilePlayer);
                        setProfilePlayer(null);
                      }}
                      className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-wider transition"
                    >
                      Edit Profile
                    </button>
                  </div>
                </div>
              )}

              {/* Tab 2: Assessments History */}
              {activeProfileTab === 'assessments' && (
                <div className="space-y-4">
                  {profileAssessments.length === 0 ? (
                    <div className="text-center py-10 bg-slate-50 rounded-2xl border border-slate-200">
                      <p className="text-sm font-bold text-slate-600">No assessments logged yet for {profilePlayer.name}.</p>
                      <button
                        onClick={() => onNewAssessment(profilePlayer.id)}
                        className="mt-3 px-4 py-2 bg-amber-500 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider"
                      >
                        + Conduct Assessment Now
                      </button>
                    </div>
                  ) : (
                    profileAssessments.map(record => {
                      const levelStyle = getDevelopmentLevelColor(record.developmentLevel);
                      return (
                        <div
                          key={record.id}
                          className="bg-slate-50 border-2 border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 rounded-xl bg-slate-900 text-amber-400 font-black flex items-center justify-center text-base">
                              {record.overallScore}
                            </div>
                            <div>
                              <div className="flex items-center space-x-2">
                                <h4 className="text-sm font-black text-slate-900">{record.assessmentType}</h4>
                                <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase border ${levelStyle.bg} ${levelStyle.text} ${levelStyle.border}`}>
                                  {record.developmentLevel}
                                </span>
                              </div>
                              <p className="text-xs text-slate-500 font-medium">
                                Date: {record.assessmentDate} • Evaluated by {record.coachName}
                              </p>
                            </div>
                          </div>

                          <button
                            onClick={() => onViewReport(profilePlayer, record)}
                            className="px-4 py-2 bg-white border-2 border-slate-900 hover:bg-slate-900 hover:text-white rounded-xl text-xs font-black uppercase tracking-wider transition"
                          >
                            View Parent Report
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* Tab 3: Skills Breakdown */}
              {activeProfileTab === 'skills' && (
                <div className="space-y-4">
                  {/* Skill Plan Configuration Header */}
                  <div className="bg-slate-900 text-white p-4 rounded-2xl border border-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-0.5 bg-amber-400 text-slate-950 rounded text-[10px] font-black uppercase tracking-wider">
                          {profilePlayer.skillPlanPreset === 'master40' ? '🏆 All 40 Skills' :
                           profilePlayer.skillPlanPreset === 'development' ? '🎯 20 Standard Skills' :
                           profilePlayer.skillPlanPreset === 'core' ? '⚡ 12 Basic Skills' : '✏️ Custom Skills'}
                        </span>
                        <span className="text-xs text-slate-300 font-bold">
                          {profilePlayer.selectedSkillIds?.length || 12} Skills Active
                        </span>
                      </div>
                      <h4 className="text-sm font-black mt-1">
                        Active Skills List for {profilePlayer.name}
                      </h4>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setSkillConfigAthlete(profilePlayer);
                        setModalMode('profile');
                        setIsSkillConfigOpen(true);
                      }}
                      className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider transition shadow flex items-center space-x-1.5 self-start sm:self-center active:scale-95"
                    >
                      <Sliders size={14} />
                      <span>Choose Skills to Assess</span>
                    </button>
                  </div>

                  {latestAssessment ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">
                          Latest Skill Ratings ({latestAssessment.assessmentType})
                        </h4>
                        <span className="text-xs font-black text-slate-900">
                          Overall Score: {latestAssessment.overallScore}/100
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {Object.entries(latestAssessment.skillRatings).map(([sId, rating]) => {
                          const scale = COACHING_SCALE_LABELS[rating] || COACHING_SCALE_LABELS[3];
                          const tmpl = SPORT_TEMPLATES[profilePlayer.sport] || SPORT_TEMPLATES.football;
                          const skillObj = tmpl.skills.find(s => s.id === sId);
                          return (
                            <div key={sId} className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between">
                              <div>
                                <div className="flex items-center space-x-1.5">
                                  <span className="text-[9px] font-black uppercase px-1.5 py-0.2 bg-slate-200 text-slate-800 rounded">
                                    {skillObj?.category === 'gameBehaviour' ? 'conduct' : skillObj?.category || 'skill'}
                                  </span>
                                  <p className="text-xs font-bold text-slate-900">{skillObj?.name || sId}</p>
                                </div>
                                <p className="text-[10px] font-medium mt-0.5" style={{ color: scale.color }}>
                                  {scale.title}
                                </p>
                              </div>
                              <span className="w-8 h-8 rounded-lg bg-slate-900 text-white font-black text-xs flex items-center justify-center">
                                {rating}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                      <p className="text-xs text-slate-500 font-bold">No evaluation logged yet.</p>
                      <button
                        onClick={() => onNewAssessment(profilePlayer.id)}
                        className="px-4 py-2 bg-amber-500 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider"
                      >
                        + Conduct Assessment Now
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 4: Training & Goals */}
              {activeProfileTab === 'training' && (
                <div className="space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">
                    Active Development Goals
                  </h4>
                  {profileGoals.length === 0 ? (
                    <p className="text-xs text-slate-400 italic bg-slate-50 p-4 rounded-xl">No active training goals set.</p>
                  ) : (
                    <div className="space-y-2">
                      {profileGoals.map((g, idx) => (
                        <div key={g.id || idx} className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                          <div className="flex items-center justify-between mb-1">
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-[10px] font-black uppercase">
                              {g.skill}
                            </span>
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              {g.status}
                            </span>
                          </div>
                          <p className="text-xs font-black text-slate-900">{g.goal}</p>
                          <p className="text-[11px] text-slate-600 font-medium">Target: {g.target}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tab 5: Progress */}
              {activeProfileTab === 'progress' && (
                <div className="space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">
                    Score Progress Over Time
                  </h4>
                  {profileAssessments.length >= 1 ? (
                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                        <span>Cycle</span>
                        <span>Development Score</span>
                      </div>
                      <div className="space-y-2">
                        {profileAssessments.map(a => (
                          <div key={a.id} className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-black text-slate-900">{a.assessmentType} ({a.assessmentDate})</span>
                              <span className="font-black text-blue-600">{a.overallScore} / 100</span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                              <div 
                                className="bg-blue-600 h-3 rounded-full transition-all"
                                style={{ width: `${a.overallScore}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">Need at least 1 assessment to show progress chart.</p>
                  )}
                </div>
              )}

              {/* Tab 6: Reports */}
              {activeProfileTab === 'reports' && (
                <div className="space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">
                    Parent Report
                  </h4>
                  {latestAssessment ? (
                    <div className="p-5 bg-amber-50/70 border-2 border-amber-900/30 rounded-2xl flex items-center justify-between">
                      <div>
                        <p className="text-sm font-black text-amber-950">Official Assessment Report Ready</p>
                        <p className="text-xs text-slate-600 font-medium">
                          Latest: {latestAssessment.assessmentType} ({latestAssessment.assessmentDate})
                        </p>
                      </div>
                      <button
                        onClick={() => onViewReport(profilePlayer, latestAssessment)}
                        className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider transition shadow-md"
                      >
                        Open Parent Report
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">No report available yet. Run an assessment first.</p>
                  )}
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* Student Import Modal */}
      <StudentImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportComplete={refreshPlayers}
      />

      {/* Skill Selection Configuration Modal */}
      {isSkillConfigOpen && (
        <SkillSelectionModal
          isOpen={isSkillConfigOpen}
          onClose={() => {
            setIsSkillConfigOpen(false);
            setSkillConfigAthlete(null);
          }}
          sport={modalMode === 'form' ? ((formData.sport as CoachingSportId) || 'football') : (skillConfigAthlete?.sport || 'football')}
          position={modalMode === 'form' ? formData.position : skillConfigAthlete?.position}
          athlete={modalMode === 'form' ? null : skillConfigAthlete}
          initialSelectedSkillIds={modalMode === 'form' ? formData.selectedSkillIds : skillConfigAthlete?.selectedSkillIds}
          initialPreset={modalMode === 'form' ? formData.skillPlanPreset : (skillConfigAthlete?.skillPlanPreset || 'custom')}
          allowSaveToProfile={modalMode === 'profile'}
          onApply={(newSkillIds, preset) => {
            if (modalMode === 'form') {
              setFormData(prev => ({
                ...prev,
                selectedSkillIds: newSkillIds,
                skillPlanPreset: preset
              }));
              showToast(`Applied ${newSkillIds.length} skills to student form!`, 'success');
            } else if (skillConfigAthlete) {
              const updated: PlayerProfileData = {
                ...skillConfigAthlete,
                selectedSkillIds: newSkillIds,
                skillPlanPreset: preset
              };
              academyService.savePlayer(updated);
              refreshPlayers();
              if (profilePlayer?.id === updated.id) {
                setProfilePlayer(updated);
              }
              showToast(`Configured ${newSkillIds.length} skills for ${updated.name}!`, 'success');
            }
          }}
          title={modalMode === 'form' ? 'Choose Skills for this Student' : `Configure Skills for ${skillConfigAthlete?.name}`}
        />
      )}

    </div>
  );
};
