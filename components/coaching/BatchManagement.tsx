import React, { useState, useMemo } from 'react';
import { 
  Layers, 
  Plus, 
  Users, 
  Trophy, 
  Calendar, 
  MapPin, 
  ArrowRight, 
  Edit3, 
  Trash2, 
  X, 
  CheckCircle2, 
  ChevronRight,
  ClipboardCheck
} from 'lucide-react';
import { 
  academyService, 
  BatchTeamGroup, 
  PlayerProfileData, 
  CoachingSportId, 
  SPORT_TEMPLATES 
} from '../../services/academyService';
import { showToast } from '../../services/toast';

interface BatchManagementProps {
  onNewAssessment: (playerId: string) => void;
  onNavigateTab: (subTab: string) => void;
}

export const BatchManagement: React.FC<BatchManagementProps> = ({
  onNewAssessment,
  onNavigateTab
}) => {
  const [batches, setBatches] = useState<BatchTeamGroup[]>(() => academyService.getBatches());
  const [players, setPlayers] = useState<PlayerProfileData[]>(() => academyService.getPlayers());
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState<BatchTeamGroup | null>(null);

  const [formData, setFormData] = useState<Partial<BatchTeamGroup>>({
    name: '',
    sport: 'football',
    ageGroup: 'U-12',
    coachName: 'Coach Vikram Roy',
    trainingSchedule: 'Mon, Wed, Fri 4:30 PM - 6:00 PM',
    location: 'Main Turf Ground',
    playerIds: []
  });

  const refreshData = () => {
    setBatches(academyService.getBatches());
    setPlayers(academyService.getPlayers());
  };

  const handleOpenAdd = () => {
    setEditingBatch(null);
    setFormData({
      name: '',
      sport: 'football',
      ageGroup: 'U-12',
      coachName: 'Coach Vikram Roy',
      trainingSchedule: 'Mon, Wed, Fri 4:30 PM - 6:00 PM',
      location: 'Main Turf Ground',
      playerIds: []
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (batch: BatchTeamGroup) => {
    setEditingBatch(batch);
    setFormData({ ...batch });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      showToast('Please enter batch name', 'error');
      return;
    }

    const record: BatchTeamGroup = {
      id: editingBatch ? editingBatch.id : `batch-${Date.now()}`,
      name: formData.name || 'Unnamed Squad',
      sport: (formData.sport as any) || 'football',
      ageGroup: formData.ageGroup || 'U-12',
      coachName: formData.coachName || 'Coach',
      trainingSchedule: formData.trainingSchedule || '',
      location: formData.location || '',
      playerIds: formData.playerIds || [],
      createdAt: editingBatch ? editingBatch.createdAt : new Date().toISOString()
    };

    academyService.saveBatch(record);
    refreshData();
    setIsModalOpen(false);
    showToast(`Batch ${record.name} saved!`, 'success');
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Delete batch "${name}"?`)) {
      academyService.deleteBatch(id);
      refreshData();
      showToast('Batch removed', 'success');
    }
  };

  const togglePlayerInBatch = (playerId: string) => {
    const current = formData.playerIds || [];
    if (current.includes(playerId)) {
      setFormData({ ...formData, playerIds: current.filter(id => id !== playerId) });
    } else {
      setFormData({ ...formData, playerIds: [...current, playerId] });
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-white border-2 border-slate-900 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="px-2.5 py-0.5 bg-purple-100 text-purple-800 rounded-md text-[10px] font-black uppercase tracking-wider">
              Academy & Squad Groups
            </span>
            <span className="text-xs text-slate-400 font-bold">
              {batches.length} Active Batches
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-display">
            Squads & Batch Management
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Group players by age bracket, academy team, and training slot for fast batch tracking.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-5 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-2xl text-xs uppercase tracking-wider transition shadow-md flex items-center justify-center space-x-2 active:scale-95"
        >
          <Plus size={18} />
          <span>+ Create New Squad</span>
        </button>
      </div>

      {/* Batches Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {batches.map(batch => {
          const sportTemplate = SPORT_TEMPLATES[batch.sport] || SPORT_TEMPLATES.football;
          const assignedPlayers = players.filter(p => batch.playerIds.includes(p.id) || p.batchOrTeam === batch.name);

          return (
            <div
              key={batch.id}
              className="bg-white border-2 border-slate-900 rounded-3xl p-6 shadow-sm hover:shadow-md transition space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 rounded-lg text-[10px] font-black uppercase tracking-wider border border-slate-200">
                    {sportTemplate.name}
                  </span>
                  <span className="px-2.5 py-0.5 bg-blue-50 text-blue-800 rounded-md text-[10px] font-black uppercase border border-blue-200">
                    {batch.ageGroup}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-black text-slate-900 leading-tight">
                    {batch.name}
                  </h3>
                  <p className="text-xs text-slate-500 font-semibold mt-0.5">
                    Lead Coach: {batch.coachName}
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5 text-xs text-slate-600">
                  {batch.trainingSchedule && (
                    <div className="flex items-center space-x-2">
                      <Calendar size={14} className="text-slate-400" />
                      <span className="font-medium">{batch.trainingSchedule}</span>
                    </div>
                  )}
                  {batch.location && (
                    <div className="flex items-center space-x-2">
                      <MapPin size={14} className="text-slate-400" />
                      <span className="font-medium">{batch.location}</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-2">
                    <Users size={14} className="text-slate-400" />
                    <span className="font-bold text-slate-900">{assignedPlayers.length} Enrolled Athletes</span>
                  </div>
                </div>

                {/* Enrolled Players Mini List */}
                {assignedPlayers.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase text-slate-400">Roster</p>
                    <div className="flex flex-wrap gap-1">
                      {assignedPlayers.map(p => (
                        <span key={p.id} className="px-2 py-0.5 bg-slate-100 rounded-md text-[11px] font-bold text-slate-800 border border-slate-200">
                          {p.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="pt-3 border-t-2 border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => {
                    if (assignedPlayers.length > 0) {
                      onNewAssessment(assignedPlayers[0].id);
                    } else {
                      showToast('No players enrolled in this batch yet', 'warning');
                    }
                  }}
                  className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-wider transition text-center"
                >
                  Assess Batch
                </button>

                <button
                  onClick={() => handleOpenEdit(batch)}
                  className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition"
                >
                  <Edit3 size={16} />
                </button>
                <button
                  onClick={() => handleDelete(batch.id, batch.name)}
                  className="p-2 text-rose-400 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Batch Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[320] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border-2 border-slate-900 rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl animate-slide-up max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b-2 border-slate-100 pb-4">
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                {editingBatch ? 'Edit Squad / Batch' : 'Create New Squad'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-slate-100 rounded-xl text-slate-400"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs font-bold">
              <div>
                <label className="block text-slate-700 uppercase tracking-wider mb-1">Squad / Batch Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name || ''}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Chennai FA - U12 Squad"
                  className="w-full bg-slate-50 border-2 border-slate-900 rounded-xl px-3 py-2 text-xs font-bold text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 uppercase tracking-wider mb-1">Sport</label>
                  <select
                    value={formData.sport || 'football'}
                    onChange={e => setFormData({ ...formData, sport: e.target.value as CoachingSportId })}
                    className="w-full bg-slate-50 border-2 border-slate-900 rounded-xl px-3 py-2 text-xs font-bold text-slate-900"
                  >
                    <option value="football">Football</option>
                    <option value="basketball">Basketball</option>
                    <option value="tennis">Tennis</option>
                    <option value="cricket">Cricket</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 uppercase tracking-wider mb-1">Age Bracket</label>
                  <input
                    type="text"
                    value={formData.ageGroup || 'U-12'}
                    onChange={e => setFormData({ ...formData, ageGroup: e.target.value })}
                    placeholder="e.g. U-10, U-14, Senior"
                    className="w-full bg-slate-50 border-2 border-slate-900 rounded-xl px-3 py-2 text-xs font-bold text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 uppercase tracking-wider mb-1">Lead Coach Name</label>
                <input
                  type="text"
                  value={formData.coachName || ''}
                  onChange={e => setFormData({ ...formData, coachName: e.target.value })}
                  placeholder="Coach Name"
                  className="w-full bg-slate-50 border-2 border-slate-900 rounded-xl px-3 py-2 text-xs font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-slate-700 uppercase tracking-wider mb-1">Training Schedule</label>
                <input
                  type="text"
                  value={formData.trainingSchedule || ''}
                  onChange={e => setFormData({ ...formData, trainingSchedule: e.target.value })}
                  placeholder="e.g. Mon, Wed, Fri 4:30 PM - 6:00 PM"
                  className="w-full bg-slate-50 border-2 border-slate-900 rounded-xl px-3 py-2 text-xs font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-slate-700 uppercase tracking-wider mb-1">Training Venue / Location</label>
                <input
                  type="text"
                  value={formData.location || ''}
                  onChange={e => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g. Main Turf Pitch 1"
                  className="w-full bg-slate-50 border-2 border-slate-900 rounded-xl px-3 py-2 text-xs font-bold text-slate-900"
                />
              </div>

              {/* Player Multi-Select */}
              <div>
                <label className="block text-slate-700 uppercase tracking-wider mb-1.5">
                  Select Athletes to Enroll
                </label>
                <div className="max-h-40 overflow-y-auto bg-slate-50 border border-slate-300 rounded-xl p-2 space-y-1">
                  {players.map(p => {
                    const isSelected = (formData.playerIds || []).includes(p.id);
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => togglePlayerInBatch(p.id)}
                        className={`w-full p-2 rounded-lg text-left flex items-center justify-between text-xs transition ${
                          isSelected ? 'bg-blue-600 text-white font-bold' : 'hover:bg-slate-200 text-slate-800'
                        }`}
                      >
                        <span>{p.name} ({p.sport.toUpperCase()} • {p.position})</span>
                        <span className="text-[10px] uppercase font-black">{isSelected ? 'Enrolled ✓' : '+ Add'}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs uppercase tracking-wider font-black"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-slate-900 text-white rounded-xl text-xs uppercase tracking-wider font-black shadow-md"
                >
                  Save Squad
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
