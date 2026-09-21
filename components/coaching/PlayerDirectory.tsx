import React, { useState, useMemo } from 'react';
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
  Upload
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
import { StudentImportModal } from './StudentImportModal';
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

  // Add / Edit Modal State
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<PlayerProfileData | null>(null);

  // Student Import Modal State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Player Profile Modal State (with 6 tabs)
  const [profilePlayer, setProfilePlayer] = useState<PlayerProfileData | null>(null);
  const [activeProfileTab, setActiveProfileTab] = useState<'overview' | 'assessments' | 'skills' | 'training' | 'progress' | 'reports'>('overview');

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
    active: true
  });

  const refreshPlayers = () => {
    setPlayers(academyService.getPlayers());
  };

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
    return players.filter(p => {
      const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.parentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.position.toLowerCase().includes(searchQuery.toLowerCase());
      const matchSport = sportFilter === 'all' || p.sport === sportFilter;
      const matchBatch = batchFilter === 'all' || p.batchOrTeam === batchFilter;
      return matchSearch && matchSport && matchBatch;
    });
  }, [players, searchQuery, sportFilter, batchFilter]);

  const handleOpenAdd = () => {
    setEditingPlayer(null);
    setFormData({
      name: '',
      dob: '2012-01-01',
      age: 12,
      gender: 'Male',
      sport: 'football',
      position: 'Midfielder',
      batchOrTeam: 'U-12 Squad',
      coachName: 'Coach Vikram Roy',
      joiningDate: new Date().toISOString().split('T')[0],
      parentName: '',
      parentContact: '',
      dominantSide: 'Right Foot / Right Hand',
      previousExperience: '',
      playerGoals: '',
      medicalNotes: '',
      active: true
    });
    setIsAddEditOpen(true);
  };

  const handleOpenEdit = (player: PlayerProfileData) => {
    setEditingPlayer(player);
    setFormData({ ...player });
    setIsAddEditOpen(true);
  };

  const handleSavePlayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      showToast('Please enter athlete name', 'error');
      return;
    }

    const newRecord: PlayerProfileData = {
      id: editingPlayer ? editingPlayer.id : `athlete-${Date.now()}`,
      name: formData.name || 'Unnamed Athlete',
      dob: formData.dob || '2012-01-01',
      age: Number(formData.age) || 12,
      gender: (formData.gender as any) || 'Male',
      sport: (formData.sport as any) || 'football',
      position: formData.position || 'All-Rounder',
      batchOrTeam: formData.batchOrTeam || '',
      coachName: formData.coachName || 'Coach',
      coachId: formData.coachId || 'coach-001',
      joiningDate: formData.joiningDate || new Date().toISOString().split('T')[0],
      parentName: formData.parentName || '',
      parentContact: formData.parentContact || '',
      dominantSide: formData.dominantSide || 'Right Foot / Right Hand',
      previousExperience: formData.previousExperience || '',
      playerGoals: formData.playerGoals || '',
      medicalNotes: formData.medicalNotes || '',
      createdAt: editingPlayer ? editingPlayer.createdAt : new Date().toISOString(),
      active: formData.active ?? true
    };

    academyService.savePlayer(newRecord);
    refreshPlayers();
    setIsAddEditOpen(false);
    showToast(`Athlete profile for ${newRecord.name} saved successfully!`, 'success');
  };

  const handleDeletePlayer = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to remove athlete ${name}?`)) {
      academyService.deletePlayer(id);
      refreshPlayers();
      if (profilePlayer?.id === id) {
        setProfilePlayer(null);
      }
      showToast('Athlete removed', 'success');
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

  return (
    <div className="space-y-6">
      
      {/* Header & Controls */}
      <div className="bg-white border-2 border-slate-900 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 rounded-md text-[10px] font-black uppercase tracking-wider">
              Athletes & Squad Roster
            </span>
            <span className="text-xs text-slate-400 font-bold">
              {players.length} Registered Athletes
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-display">
            Athletes & Squad Directory
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Manage comprehensive athletic profiles, developmental history, and parent records across all sports.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="px-4 py-3 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-2xl text-xs uppercase tracking-wider transition shadow-md flex items-center justify-center space-x-2 active:scale-95"
          >
            <Upload size={16} className="text-amber-400" />
            <span>Upload Student List (CSV / Bulk)</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="px-5 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-2xl text-xs uppercase tracking-wider transition shadow-md flex items-center justify-center space-x-2 active:scale-95"
          >
            <Plus size={18} />
            <span>+ Add Athlete Profile</span>
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
            placeholder="Search by athlete, parent, position..."
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
            <option value="all">All Squads & Batches</option>
            {batches.map(b => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Game-wise Quick Chips (Instant Game Filter) */}
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

      {/* Players Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPlayers.map(player => {
          const sportTemplate = SPORT_TEMPLATES[player.sport] || SPORT_TEMPLATES.football;
          const playerAssessments = academyService.getAssessmentsForPlayer(player.id);
          const latest = playerAssessments.length > 0 ? playerAssessments[playerAssessments.length - 1] : null;
          const levelStyle = latest ? getDevelopmentLevelColor(latest.developmentLevel) : null;

          return (
            <div
              key={player.id}
              className="bg-white border-2 border-slate-900 rounded-3xl p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4 group"
            >
              <div>
                {/* Top Badge & Status */}
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                    {sportTemplate.name}
                  </span>
                  {latest ? (
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-md border ${levelStyle?.bg} ${levelStyle?.text} ${levelStyle?.border}`}>
                      Level: {latest.developmentLevel} ({latest.overallScore}/100)
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-slate-400">
                      Pending First Review
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
                    <p className="text-[11px] text-slate-400 font-medium">
                      Squad: <span className="text-slate-700 font-bold">{player.batchOrTeam || 'Individual Player'}</span>
                    </p>
                  </div>
                </div>

                {/* Strengths / Key Goals snippet */}
                {latest?.strengths && latest.strengths.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Key Strengths</p>
                    <div className="flex flex-wrap gap-1">
                      {latest.strengths.slice(0, 2).map((s, idx) => (
                        <span key={idx} className="px-2 py-0.5 bg-emerald-50 text-emerald-800 rounded text-[10px] font-bold border border-emerald-200">
                          ✓ {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Card Action Buttons */}
              <div className="pt-3 border-t-2 border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => {
                    setProfilePlayer(player);
                    setActiveProfileTab('overview');
                  }}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-900 hover:text-white text-slate-900 rounded-xl text-xs font-black uppercase tracking-wider transition text-center"
                >
                  View Profile
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
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Player Modal */}
      {isAddEditOpen && (
        <div className="fixed inset-0 z-[320] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border-2 border-slate-900 rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl animate-slide-up max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b-2 border-slate-100 pb-4">
              <div>
                <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                  {editingPlayer ? 'Edit Player Profile' : 'Register New Player'}
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  Complete athletic profile for coaching and parent communication.
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 uppercase tracking-wider mb-1">Player Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name || ''}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Aarav Sharma"
                    className="w-full bg-slate-50 border-2 border-slate-900 rounded-xl px-3 py-2 text-xs font-bold text-slate-900"
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

                <div>
                  <label className="block text-slate-700 uppercase tracking-wider mb-1">Sport</label>
                  <select
                    value={formData.sport || 'football'}
                    onChange={e => {
                      const newSport = e.target.value as CoachingSportId;
                      const tmpl = SPORT_TEMPLATES[newSport] || SPORT_TEMPLATES.football;
                      const defaultPos = tmpl.positions[0]?.name || 'All-Rounder';
                      setFormData({ ...formData, sport: newSport, position: defaultPos });
                    }}
                    className="w-full bg-slate-50 border-2 border-slate-900 rounded-xl px-3 py-2 text-xs font-bold text-slate-900"
                  >
                    {Object.values(SPORT_TEMPLATES).map(tmpl => (
                      <option key={tmpl.id} value={tmpl.id}>
                        {tmpl.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 uppercase tracking-wider mb-1">Playing Role / Position</label>
                  <div className="space-y-1">
                    <select
                      value={formData.position || ''}
                      onChange={e => setFormData({ ...formData, position: e.target.value })}
                      className="w-full bg-slate-50 border-2 border-slate-900 rounded-xl px-3 py-2 text-xs font-bold text-slate-900"
                    >
                      {SPORT_TEMPLATES[formData.sport as CoachingSportId || 'football']?.positions.map(pos => (
                        <option key={pos.id} value={pos.name}>
                          {pos.name}
                        </option>
                      ))}
                      <option value="All-Rounder">All-Rounder / General</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 uppercase tracking-wider mb-1">Batch / Squad / Team</label>
                  <input
                    type="text"
                    value={formData.batchOrTeam || ''}
                    onChange={e => setFormData({ ...formData, batchOrTeam: e.target.value })}
                    placeholder="e.g. U-12 Elite Squad or 1-on-1"
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

              <div>
                <label className="block text-slate-700 uppercase tracking-wider mb-1">Player's Personal Goals</label>
                <textarea
                  rows={2}
                  value={formData.playerGoals || ''}
                  onChange={e => setFormData({ ...formData, playerGoals: e.target.value })}
                  placeholder="e.g. Master weak-foot passing and qualify for state trials..."
                  className="w-full bg-slate-50 border-2 border-slate-900 rounded-xl p-2.5 text-xs font-medium text-slate-900"
                />
              </div>

              <div>
                <label className="block text-slate-700 uppercase tracking-wider mb-1">Medical & Injury Notes (Optional)</label>
                <input
                  type="text"
                  value={formData.medicalNotes || ''}
                  onChange={e => setFormData({ ...formData, medicalNotes: e.target.value })}
                  placeholder="e.g. Past minor ankle sprain; fully cleared for match play"
                  className="w-full bg-slate-50 border-2 border-slate-900 rounded-xl px-3 py-2 text-xs font-medium text-slate-900"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t-2 border-slate-100">
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
                  Save Player Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Comprehensive Player Profile Modal with 6 Tabs */}
      {profilePlayer && (
        <div className="fixed inset-0 z-[310] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white border-2 border-slate-900 rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl">
            
            {/* Profile Modal Top Hero Header */}
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
                    {profilePlayer.position} • {profilePlayer.age} Years • {profilePlayer.batchOrTeam || 'Individual'}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2 self-end sm:self-center">
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
                      <h4 className="font-black uppercase tracking-wider text-blue-950 mb-1">Player's Aspirations & Goals</h4>
                      <p className="text-slate-700 font-medium">{profilePlayer.playerGoals}</p>
                    </div>
                  )}

                  {profilePlayer.medicalNotes && (
                    <div className="p-4 bg-amber-50/70 border-2 border-amber-900/20 rounded-2xl">
                      <h4 className="font-black uppercase tracking-wider text-amber-950 mb-1">Medical & Injury Notes</h4>
                      <p className="text-slate-700 font-medium">{profilePlayer.medicalNotes}</p>
                    </div>
                  )}

                  <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100">
                    <button
                      onClick={() => handleDeletePlayer(profilePlayer.id, profilePlayer.name)}
                      className="px-4 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-xl text-xs font-black uppercase tracking-wider transition"
                    >
                      Delete Player
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
                        + Conduct Baseline Assessment
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
                  {latestAssessment ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">
                          Latest Competencies ({latestAssessment.assessmentType})
                        </h4>
                        <span className="text-xs font-black text-slate-900">
                          Score: {latestAssessment.overallScore}/100
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
                                <p className="text-xs font-bold text-slate-900">{skillObj?.name || sId}</p>
                                <p className="text-[10px] font-medium" style={{ color: scale.color }}>
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
                    <p className="text-xs text-slate-400 italic">No skills assessed yet.</p>
                  )}
                </div>
              )}

              {/* Tab 4: Training & Goals */}
              {activeProfileTab === 'training' && (
                <div className="space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">
                    Active 3-Month Development Goals
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

              {/* Tab 5: Progress Charts */}
              {activeProfileTab === 'progress' && (
                <div className="space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">
                    Longitudinal Score Progression
                  </h4>
                  {profileAssessments.length >= 1 ? (
                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                        <span>Cycle</span>
                        <span>Overall Development Score</span>
                      </div>
                      <div className="space-y-2">
                        {profileAssessments.map((a, idx) => (
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
                    <p className="text-xs text-slate-400 italic">Need at least 1 assessment to track progress.</p>
                  )}
                </div>
              )}

              {/* Tab 6: Reports */}
              {activeProfileTab === 'reports' && (
                <div className="space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">
                    Parent Reports Generator
                  </h4>
                  {latestAssessment ? (
                    <div className="p-5 bg-amber-50/70 border-2 border-amber-900/30 rounded-2xl flex items-center justify-between">
                      <div>
                        <p className="text-sm font-black text-amber-950">Official SmartPE India Report Ready</p>
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

    </div>
  );
};
