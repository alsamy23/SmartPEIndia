import React, { useState, useEffect } from 'react';
import { 
  X, 
  Database, 
  ShieldCheck, 
  Users, 
  Mail, 
  UserPlus, 
  Copy, 
  Check, 
  Trash2, 
  Building, 
  Trophy, 
  Phone, 
  MapPin, 
  RefreshCw, 
  Layers,
  Sparkles
} from 'lucide-react';
import { 
  academicCoachingCloudService, 
  AcademicCoachingProgram 
} from '../../services/academicCoachingCloudService';
import { academyService, SPORT_TEMPLATES, CoachingSportId } from '../../services/academyService';
import { showToast } from '../../services/toast';
import { auth } from '../../services/firebase';

interface AcademyDatabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDatabaseUpdated?: () => void;
}

export const AcademyDatabaseModal: React.FC<AcademyDatabaseModalProps> = ({
  isOpen,
  onClose,
  onDatabaseUpdated
}) => {
  const [program, setProgram] = useState<AcademicCoachingProgram | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'colleagues' | 'cloud_status'>('details');

  // Academy Form State
  const [academyName, setAcademyName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [headCoachName, setHeadCoachName] = useState('');
  const [selectedSports, setSelectedSports] = useState<string[]>(['football', 'cricket']);
  const [contactNumber, setContactNumber] = useState('');
  const [location, setLocation] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Add Colleague State
  const [colleagueEmail, setColleagueEmail] = useState('');
  const [colleagueName, setColleagueName] = useState('');
  const [isAddingColleague, setIsAddingColleague] = useState(false);

  // Invite code copied feedback
  const [copiedCode, setCopiedCode] = useState(false);

  // Load existing or default data
  useEffect(() => {
    if (!isOpen) return;

    const existing = academicCoachingCloudService.getLocalProgram();
    const currentUser = auth.currentUser;
    const fallbackEmail = currentUser?.email || 'alsamy36@gmail.com';

    if (existing) {
      setProgram(existing);
      setAcademyName(existing.programName || '');
      setAdminEmail(existing.adminEmail || existing.coachEmails[0] || fallbackEmail);
      setHeadCoachName(existing.headCoachName || 'Head Coach');
      setSelectedSports(existing.sportsOffered && existing.sportsOffered.length > 0 ? existing.sportsOffered : [existing.sport || 'football']);
      setContactNumber(existing.contactNumber || '');
      setLocation(existing.location || '');
    } else {
      setAcademyName('SmartPE Sports Academy');
      setAdminEmail(fallbackEmail);
      setHeadCoachName(currentUser?.displayName || 'Head Coach');
      setSelectedSports(['football', 'cricket', 'basketball', 'badminton']);
      setContactNumber('');
      setLocation('Main Academy Ground');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleToggleSport = (sportKey: string) => {
    if (selectedSports.includes(sportKey)) {
      if (selectedSports.length > 1) {
        setSelectedSports(selectedSports.filter(s => s !== sportKey));
      } else {
        showToast('Please select at least one sport for the academy', 'warning');
      }
    } else {
      setSelectedSports([...selectedSports, sportKey]);
    }
  };

  const handleSaveAcademy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!academyName.trim()) {
      showToast('Please enter the Academy or Coaching Name', 'error');
      return;
    }
    if (!adminEmail.trim()) {
      showToast('Please enter the Academy Admin Email', 'error');
      return;
    }

    setIsSaving(true);
    try {
      if (program?.id) {
        // Update existing
        const updated = await academicCoachingCloudService.updateAcademicProgram(program.id, {
          programName: academyName.trim(),
          adminEmail: adminEmail.trim(),
          headCoachName: headCoachName.trim() || 'Head Coach',
          sportsOffered: selectedSports,
          sport: selectedSports[0] || 'football',
          contactNumber: contactNumber.trim(),
          location: location.trim(),
          isCloudSynced: true
        });
        setProgram(updated);
        showToast('Academy Database updated & synchronized with Firebase!', 'success');
      } else {
        // Register new
        const created = await academicCoachingCloudService.registerAcademicProgram({
          programName: academyName.trim(),
          programType: 'after_school_academy',
          sport: selectedSports[0] || 'football',
          sportsOffered: selectedSports,
          coachName: headCoachName.trim() || 'Head Coach',
          adminEmail: adminEmail.trim(),
          contactNumber: contactNumber.trim(),
          location: location.trim()
        });
        setProgram(created);
        showToast('Academy Database created & registered in Firebase!', 'success');
      }

      onDatabaseUpdated?.();
    } catch (err: any) {
      console.error('Failed to save academy database:', err);
      showToast(err?.message || 'Failed to save academy database', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddColleague = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!colleagueEmail.trim()) {
      showToast('Please enter your colleague coach email', 'error');
      return;
    }

    if (!program?.id) {
      showToast('Please save your Academy Database first before adding colleagues', 'warning');
      return;
    }

    setIsAddingColleague(true);
    try {
      const updated = await academicCoachingCloudService.addColleagueCoach(
        program.id,
        colleagueEmail.trim(),
        colleagueName.trim()
      );
      setProgram(updated);
      setColleagueEmail('');
      setColleagueName('');
      showToast(`Colleague ${colleagueEmail} added successfully!`, 'success');
      onDatabaseUpdated?.();
    } catch (err: any) {
      console.error('Add colleague error:', err);
      showToast(err?.message || 'Failed to add colleague coach', 'error');
    } finally {
      setIsAddingColleague(false);
    }
  };

  const handleRemoveColleague = async (email: string) => {
    if (!program?.id) return;
    if (confirm(`Remove colleague ${email} from this academy database?`)) {
      try {
        const updated = await academicCoachingCloudService.removeColleagueCoach(program.id, email);
        setProgram(updated);
        showToast(`Colleague ${email} removed`, 'info');
        onDatabaseUpdated?.();
      } catch (err: any) {
        showToast('Failed to remove colleague', 'error');
      }
    }
  };

  const handleCopyInviteCode = () => {
    if (program?.inviteCode) {
      navigator.clipboard.writeText(program.inviteCode);
      setCopiedCode(true);
      showToast(`Invite Code ${program.inviteCode} copied to clipboard!`, 'success');
      setTimeout(() => setCopiedCode(false), 2500);
    }
  };

  const athletesCount = academyService.getPlayers().length;
  const assessmentsCount = academyService.getAssessments().length;

  return (
    <div className="fixed inset-0 z-[360] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border-2 border-slate-900 rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl animate-slide-up max-h-[92vh] flex flex-col justify-between">
        
        {/* Modal Header */}
        <div>
          <div className="flex items-center justify-between border-b-2 border-slate-100 pb-4">
            <div className="flex items-center space-x-3">
              <div className="w-11 h-11 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shadow-md">
                <Database size={22} />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight font-display">
                    Academy & Coaching Database
                  </h2>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md text-[10px] font-black uppercase tracking-wider flex items-center space-x-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                    <span>Firebase Isolated</span>
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium">
                  Separate cloud database for After School Activities & Private Sports Academies.
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition"
            >
              <X size={20} />
            </button>
          </div>

          {/* Nav Tabs */}
          <div className="flex items-center space-x-2 mt-4 bg-slate-100 p-1.5 rounded-2xl">
            <button
              onClick={() => setActiveTab('details')}
              className={`flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center justify-center space-x-2 ${
                activeTab === 'details'
                  ? 'bg-white text-slate-950 shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Building size={15} />
              <span>Academy Details</span>
            </button>

            <button
              onClick={() => setActiveTab('colleagues')}
              className={`flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center justify-center space-x-2 ${
                activeTab === 'colleagues'
                  ? 'bg-white text-slate-950 shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users size={15} />
              <span>Colleague Coaches ({program?.coachEmails?.length || 1})</span>
            </button>

            <button
              onClick={() => setActiveTab('cloud_status')}
              className={`flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center justify-center space-x-2 ${
                activeTab === 'cloud_status'
                  ? 'bg-white text-slate-950 shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldCheck size={15} />
              <span>Cloud Isolation</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Academy Details Form */}
        {activeTab === 'details' && (
          <form onSubmit={handleSaveAcademy} className="space-y-4 overflow-y-auto pr-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-700 mb-1">
                  Academy / Coaching Name *
                </label>
                <input
                  type="text"
                  required
                  value={academyName}
                  onChange={e => setAcademyName(e.target.value)}
                  placeholder="e.g. Apex Football Academy or Stars Cricket Club"
                  className="w-full bg-slate-50 border-2 border-slate-900 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-700 mb-1">
                  Admin Email *
                </label>
                <input
                  type="email"
                  required
                  value={adminEmail}
                  onChange={e => setAdminEmail(e.target.value)}
                  placeholder="e.g. alsamy36@gmail.com"
                  className="w-full bg-slate-50 border-2 border-slate-900 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-700 mb-1">
                  Head Coach / Director Name
                </label>
                <input
                  type="text"
                  value={headCoachName}
                  onChange={e => setHeadCoachName(e.target.value)}
                  placeholder="e.g. Coach Vikram Roy"
                  className="w-full bg-slate-50 border-2 border-slate-900 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-700 mb-1">
                  Contact Phone / WhatsApp
                </label>
                <input
                  type="text"
                  value={contactNumber}
                  onChange={e => setContactNumber(e.target.value)}
                  placeholder="e.g. +91 98765 43210"
                  className="w-full bg-slate-50 border-2 border-slate-900 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-700 mb-1">
                Training Facility / Ground Location
              </label>
              <input
                type="text"
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="e.g. Turf Ground A, Sector 14, Main Stadium"
                className="w-full bg-slate-50 border-2 border-slate-900 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Sports Offered Multi-Selector */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-black uppercase tracking-wider text-slate-700">
                  Games & Sports Offered (Select All That Apply)
                </label>
                <span className="text-[10px] font-bold text-amber-700">
                  {selectedSports.length} Selected
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {Object.values(SPORT_TEMPLATES).map(tmpl => {
                  const isSelected = selectedSports.includes(tmpl.id);
                  return (
                    <button
                      key={tmpl.id}
                      type="button"
                      onClick={() => handleToggleSport(tmpl.id)}
                      className={`p-2.5 rounded-xl border-2 text-left transition flex items-center justify-between ${
                        isSelected
                          ? 'border-slate-900 bg-amber-50 text-slate-900'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <span className="text-xs font-bold">{tmpl.name}</span>
                      {isSelected && <Check size={14} className="text-amber-600 stroke-[3]" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSaving}
                className="w-full py-3 bg-amber-500 hover:bg-amber-400 disabled:bg-slate-300 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider transition shadow-md flex items-center justify-center space-x-2"
              >
                {isSaving ? (
                  <>
                    <RefreshCw size={15} className="animate-spin" />
                    <span>Saving to Firebase...</span>
                  </>
                ) : (
                  <>
                    <Database size={15} />
                    <span>Save Academy Database to Firebase</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Colleague Coaches Management */}
        {activeTab === 'colleagues' && (
          <div className="space-y-4 overflow-y-auto pr-1">
            
            {/* Invite Code Quick Box */}
            <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-2xl flex items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-900">
                  Academy Colleague Invite Code
                </span>
                <p className="text-lg font-black font-mono tracking-wider text-slate-900">
                  {program?.inviteCode || 'CP-SETUP'}
                </p>
                <p className="text-[11px] text-amber-800 font-medium">
                  Colleagues can type this code in Coaching Hub on their own phone or laptop to join this academy.
                </p>
              </div>

              <button
                type="button"
                onClick={handleCopyInviteCode}
                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center space-x-1.5 shadow-sm"
              >
                {copiedCode ? (
                  <>
                    <Check size={14} className="text-emerald-400" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy size={14} />
                    <span>Copy Code</span>
                  </>
                )}
              </button>
            </div>

            {/* Direct Add Form */}
            <form onSubmit={handleAddColleague} className="p-4 bg-slate-50 border-2 border-slate-900 rounded-2xl space-y-3">
              <div className="flex items-center space-x-2">
                <UserPlus size={16} className="text-amber-600" />
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">
                  Add Colleague / Assistant Coach by Email
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="email"
                  required
                  value={colleagueEmail}
                  onChange={e => setColleagueEmail(e.target.value)}
                  placeholder="Colleague Email (e.g. coach.rahul@gmail.com)"
                  className="bg-white border-2 border-slate-900 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none"
                />
                <input
                  type="text"
                  value={colleagueName}
                  onChange={e => setColleagueName(e.target.value)}
                  placeholder="Colleague Name (e.g. Coach Rahul Sharma)"
                  className="bg-white border-2 border-slate-900 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isAddingColleague || !colleagueEmail.trim()}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white font-black rounded-xl text-xs uppercase tracking-wider transition flex items-center justify-center space-x-2"
              >
                {isAddingColleague ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Adding Colleague...</span>
                  </>
                ) : (
                  <>
                    <UserPlus size={14} />
                    <span>Add Colleague to Academy Database</span>
                  </>
                )}
              </button>
            </form>

            {/* Existing Coaches List */}
            <div>
              <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-700 mb-2">
                Active Academy Coaches ({program?.coachEmails?.length || 1})
              </h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {program?.coachEmails?.map((email, idx) => {
                  const isHead = idx === 0 || email === program.adminEmail;
                  const coachName = program.coachNames?.[idx] || (isHead ? program.headCoachName : 'Assistant Coach');
                  return (
                    <div
                      key={email}
                      className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between shadow-xs"
                    >
                      <div className="flex items-center space-x-2.5">
                        <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center font-black text-slate-700 text-xs">
                          {coachName.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-bold text-slate-900">{coachName}</span>
                            {isHead && (
                              <span className="px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded text-[9px] font-black uppercase">
                                Academy Admin
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-500 font-mono">{email}</span>
                        </div>
                      </div>

                      {!isHead && (
                        <button
                          type="button"
                          onClick={() => handleRemoveColleague(email)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Remove colleague"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Cloud Isolation & Security */}
        {activeTab === 'cloud_status' && (
          <div className="space-y-4 overflow-y-auto pr-1">
            <div className="p-4 bg-emerald-50 border-2 border-emerald-300 rounded-2xl space-y-2">
              <div className="flex items-center space-x-2">
                <ShieldCheck size={20} className="text-emerald-700" />
                <h4 className="text-xs font-black uppercase tracking-wider text-emerald-900">
                  Firebase Database Isolation Verified
                </h4>
              </div>
              <p className="text-xs text-emerald-800 leading-relaxed font-medium">
                The Coaching & Academy database is 100% physically decoupled from the School Physical Education database. Your athlete roster, developmental ratings (1–5 scale), and parent records are stored in dedicated cloud collections:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 font-mono text-[11px]">
                <div className="bg-white p-2.5 rounded-xl border border-emerald-200">
                  <span className="font-bold text-slate-900 block">academic_programs</span>
                  <span className="text-slate-500 text-[10px]">Academy profiles & coach staff</span>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-emerald-200">
                  <span className="font-bold text-slate-900 block">academic_athletes</span>
                  <span className="text-slate-500 text-[10px]">Student player rosters ({athletesCount})</span>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-emerald-200">
                  <span className="font-bold text-slate-900 block">academic_assessments</span>
                  <span className="text-slate-500 text-[10px]">Technical skill ratings ({assessmentsCount})</span>
                </div>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                  Registered Athletes
                </span>
                <span className="text-2xl font-black text-slate-900 font-display">
                  {athletesCount}
                </span>
                <span className="text-[11px] text-slate-500 block mt-0.5">
                  Stored in Academy cloud roster
                </span>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                  Assessments Completed
                </span>
                <span className="text-2xl font-black text-slate-900 font-display">
                  {assessmentsCount}
                </span>
                <span className="text-[11px] text-slate-500 block mt-0.5">
                  Multi-sport developmental records
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="pt-4 border-t-2 border-slate-100 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 font-medium">
            Admin: <strong className="text-slate-900">{adminEmail || 'Configured'}</strong>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-wider transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
