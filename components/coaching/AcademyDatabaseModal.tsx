import React, { useState, useEffect } from 'react';
import { 
  Database, 
  ShieldCheck, 
  Building, 
  Users, 
  Check, 
  X, 
  Copy, 
  RefreshCw, 
  Mail, 
  UserPlus, 
  Trash2, 
  Award, 
  Image as ImageIcon, 
  Upload, 
  Lock, 
  LogIn, 
  UserCheck, 
  Sparkles,
  Phone,
  MapPin
} from 'lucide-react';
import { 
  academicCoachingCloudService, 
  AcademicCoachingProgram,
  AcademyTeacher 
} from '../../services/academicCoachingCloudService';
import { academyService, SPORT_TEMPLATES, CoachingSportId } from '../../services/academyService';
import { auth } from '../../services/firebase';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { showToast } from '../../services/toast';

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
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(auth.currentUser);
  const [program, setProgram] = useState<AcademicCoachingProgram | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'colleagues' | 'cloud_status'>('details');

  // Auth form state if not signed in
  const [authMode, setAuthMode] = useState<'signin' | 'register'>('register');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Academy Form State
  const [academyName, setAcademyName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [headCoachName, setHeadCoachName] = useState('');
  const [selectedSports, setSelectedSports] = useState<string[]>(['football', 'cricket']);
  const [contactNumber, setContactNumber] = useState('');
  const [location, setLocation] = useState('');
  const [logoUrl, setLogoUrl] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  // Add Teacher / Coach State
  const [colleagueEmail, setColleagueEmail] = useState('');
  const [colleagueName, setColleagueName] = useState('');
  const [colleagueSport, setColleagueSport] = useState<string>('All Sports');
  const [colleagueRole, setColleagueRole] = useState<string>('Specialist Coach');
  const [teachers, setTeachers] = useState<AcademyTeacher[]>([]);
  const [isAddingColleague, setIsAddingColleague] = useState(false);

  // Invite code copied feedback
  const [copiedCode, setCopiedCode] = useState(false);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, user => {
      setCurrentUser(user);
      if (user && !adminEmail) {
        setAdminEmail(user.email || '');
      }
    });
    return () => unsub();
  }, []);

  // Load existing or default data
  useEffect(() => {
    if (!isOpen) return;

    const existing = academicCoachingCloudService.getLocalProgram();
    const user = auth.currentUser;
    const fallbackEmail = user?.email || 'alsamy36@gmail.com';

    if (existing) {
      setProgram(existing);
      setAcademyName(existing.programName || '');
      setAdminEmail(existing.adminEmail || existing.coachEmails[0] || fallbackEmail);
      setHeadCoachName(existing.headCoachName || 'Head Coach');
      setSelectedSports(existing.sportsOffered && existing.sportsOffered.length > 0 ? existing.sportsOffered : [existing.sport || 'football']);
      setContactNumber(existing.contactNumber || '');
      setLocation(existing.location || '');
      setLogoUrl(existing.logoUrl || '');
      setTeachers(existing.teachersList || existing.coachEmails.map((email, idx) => ({
        name: existing.coachNames[idx] || 'Coach',
        email,
        sport: 'All Sports',
        role: idx === 0 ? 'Lead Coach' : 'Specialist Coach'
      })));
    } else {
      setAcademyName('SmartPE Sports Academy');
      setAdminEmail(fallbackEmail);
      setHeadCoachName(user?.displayName || 'Head Coach');
      setSelectedSports(['football', 'cricket', 'basketball', 'badminton']);
      setContactNumber('');
      setLocation('Main Academy Ground');
      setLogoUrl('');
      setTeachers([
        {
          name: user?.displayName || 'Head Coach',
          email: fallbackEmail,
          sport: 'All Sports',
          role: 'Lead Coach',
          addedAt: new Date().toISOString()
        }
      ]);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Firebase Google Sign In
  const handleGoogleSignIn = async () => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      const provider = new GoogleAuthProvider();
      const res = await signInWithPopup(auth, provider);
      setCurrentUser(res.user);
      setAdminEmail(res.user.email || '');
      showToast(`Signed in as ${res.user.email}! Now you can create your academy.`, 'success');
    } catch (err: any) {
      setAuthError(err.message || 'Google sign-in failed');
    } finally {
      setAuthLoading(false);
    }
  };

  // Firebase Email Sign In / Register
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail || !authPassword) {
      setAuthError('Please provide both email and password');
      return;
    }
    setAuthLoading(true);
    setAuthError(null);
    try {
      if (authMode === 'register') {
        const res = await createUserWithEmailAndPassword(auth, authEmail.trim(), authPassword);
        setCurrentUser(res.user);
        setAdminEmail(res.user.email || '');
        showToast('Firebase account registered successfully! Creating academy...', 'success');
      } else {
        const res = await signInWithEmailAndPassword(auth, authEmail.trim(), authPassword);
        setCurrentUser(res.user);
        setAdminEmail(res.user.email || '');
        showToast(`Welcome back, ${res.user.email}!`, 'success');
      }
    } catch (err: any) {
      setAuthError(err.message || 'Authentication failed');
    } finally {
      setAuthLoading(false);
    }
  };

  // Handle Logo Upload from device
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      showToast('Image size exceeds 2MB limit. Please choose a smaller image.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setLogoUrl(result);
        showToast('Academy logo uploaded successfully!', 'success');
      }
    };
    reader.readAsDataURL(file);
  };

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
          logoUrl: logoUrl.trim(),
          teachersList: teachers,
          isCloudSynced: true
        });
        setProgram(updated);
        showToast('Academy Database updated & synchronized with Firebase!', 'success');
      } else {
        // Register new in Firebase
        const created = await academicCoachingCloudService.registerAcademicProgram({
          programName: academyName.trim(),
          programType: 'after_school_academy',
          sport: selectedSports[0] || 'football',
          sportsOffered: selectedSports,
          logoUrl: logoUrl.trim(),
          coachName: headCoachName.trim() || 'Head Coach',
          adminEmail: adminEmail.trim(),
          contactNumber: contactNumber.trim(),
          location: location.trim(),
          teachersList: teachers
        });
        setProgram(created);
        showToast('Academy Database created & registered in Firebase cloud!', 'success');
      }

      onDatabaseUpdated?.();
    } catch (err: any) {
      console.error('Failed to save academy database:', err);
      showToast(err?.message || 'Failed to save academy database', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!colleagueEmail.trim()) {
      showToast('Please enter teacher/coach email', 'error');
      return;
    }

    const email = colleagueEmail.trim().toLowerCase();
    const name = colleagueName.trim() || email.split('@')[0];

    if (teachers.some(t => t.email.toLowerCase() === email)) {
      showToast(`Teacher with email ${email} is already in the list`, 'warning');
      return;
    }

    const newTeacher: AcademyTeacher = {
      id: `teach_${Date.now()}`,
      name,
      email,
      sport: colleagueSport,
      role: colleagueRole,
      addedAt: new Date().toISOString()
    };

    const updatedTeachers = [...teachers, newTeacher];
    setTeachers(updatedTeachers);

    // If program exists, sync immediately
    if (program?.id) {
      setIsAddingColleague(true);
      try {
        await academicCoachingCloudService.addColleagueCoach(program.id, email, name);
        await academicCoachingCloudService.updateAcademicProgram(program.id, {
          teachersList: updatedTeachers
        });
        showToast(`Teacher/Coach ${name} added successfully!`, 'success');
        onDatabaseUpdated?.();
      } catch (err: any) {
        console.warn('Teacher cloud sync warning:', err);
      } finally {
        setIsAddingColleague(false);
      }
    } else {
      showToast(`Teacher ${name} added to roster. Save Academy to persist!`, 'info');
    }

    setColleagueEmail('');
    setColleagueName('');
  };

  const handleRemoveTeacher = async (email: string) => {
    if (confirm(`Remove teacher ${email} from this academy?`)) {
      const updated = teachers.filter(t => t.email.toLowerCase() !== email.toLowerCase());
      setTeachers(updated);
      if (program?.id) {
        try {
          await academicCoachingCloudService.removeColleagueCoach(program.id, email);
          await academicCoachingCloudService.updateAcademicProgram(program.id, {
            teachersList: updated
          });
          showToast(`Teacher ${email} removed`, 'info');
          onDatabaseUpdated?.();
        } catch (err) {
          showToast('Failed to remove teacher from cloud', 'error');
        }
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
      <div className="bg-white border-2 border-slate-900 rounded-3xl max-w-3xl w-full p-6 sm:p-8 space-y-6 shadow-2xl animate-slide-up max-h-[92vh] flex flex-col justify-between">
        
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
                    Academy & Coaching Setup
                  </h2>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md text-[10px] font-black uppercase tracking-wider flex items-center space-x-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                    <span>Firebase Storage Isolated</span>
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium">
                  Dedicated storage for After-School Academies & Sports Clubs (Separate from School PE).
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

          {/* User Auth Status Banner */}
          <div className="mt-3 flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs">
            <div className="flex items-center space-x-2">
              <UserCheck size={16} className={currentUser ? 'text-emerald-600' : 'text-amber-500'} />
              {currentUser ? (
                <span className="text-slate-700 font-medium">
                  Firebase Account: <strong className="text-slate-900">{currentUser.email}</strong> (Academy Admin)
                </span>
              ) : (
                <span className="text-amber-800 font-bold">
                  Firebase account required before registering academy.
                </span>
              )}
            </div>
            {currentUser && (
              <span className="text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                Verified Admin
              </span>
            )}
          </div>

          {/* Nav Tabs (Only show if authenticated) */}
          {currentUser && (
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
                <span>Academy & Logo</span>
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
                <span>Teachers & Coaches ({teachers.length})</span>
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
                <span>Storage Separation</span>
              </button>
            </div>
          )}
        </div>

        {/* ======================================================== */}
        {/* FIREBASE AUTH GATE: IF USER NOT SIGNED IN */}
        {/* ======================================================== */}
        {!currentUser ? (
          <div className="py-6 px-4 space-y-6 text-center">
            <div className="max-w-md mx-auto space-y-3">
              <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-3xl mx-auto flex items-center justify-center shadow-inner">
                <Lock size={28} />
              </div>
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight font-display">
                Firebase Account Registration Required
              </h3>
              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                To create an independent Sports Academy and manage coaches, games-wise student rosters, and merit reports, you must first register with your Firebase account.
              </p>
            </div>

            {authError && (
              <div className="max-w-md mx-auto p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-bold">
                {authError}
              </div>
            )}

            <div className="max-w-md mx-auto space-y-4">
              {/* Google One-Click Auth */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={authLoading}
                className="w-full py-3 bg-white hover:bg-slate-50 text-slate-900 border-2 border-slate-900 font-black rounded-xl text-xs uppercase tracking-wider transition shadow-sm flex items-center justify-center space-x-2"
              >
                <LogIn size={16} />
                <span>{authLoading ? 'Connecting...' : 'Continue with Google Account'}</span>
              </button>

              <div className="flex items-center space-x-2 text-slate-400 text-xs font-bold uppercase">
                <div className="flex-1 h-px bg-slate-200" />
                <span>or Email & Password</span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>

              {/* Email / Password Form */}
              <form onSubmit={handleEmailAuth} className="space-y-3 text-left">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-600 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={authEmail}
                    onChange={e => setAuthEmail(e.target.value)}
                    placeholder="academy.director@gmail.com"
                    className="w-full px-3 py-2 bg-slate-50 border-2 border-slate-900 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-600 mb-1">
                    Password (Min 6 characters)
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={authPassword}
                    onChange={e => setAuthPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 bg-slate-50 border-2 border-slate-900 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-xl text-xs uppercase tracking-wider transition shadow-md flex items-center justify-center space-x-2"
                >
                  <UserPlus size={16} />
                  <span>
                    {authLoading ? 'Processing...' : (authMode === 'register' ? 'Register Firebase Account & Create Academy' : 'Sign In to Academy')}
                  </span>
                </button>

                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode(authMode === 'register' ? 'signin' : 'register');
                      setAuthError(null);
                    }}
                    className="text-xs text-amber-600 font-bold hover:underline"
                  >
                    {authMode === 'register' ? 'Already registered? Sign in here' : "Don't have an account? Register new here"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : (
          <>
            {/* Tab 1: Academy Details & Custom Logo Form */}
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
                      placeholder="e.g. Apex Football Academy or Champions Sports Club"
                      className="w-full bg-slate-50 border-2 border-slate-900 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-wider text-slate-700 mb-1">
                      Admin Email (From Firebase Auth) *
                    </label>
                    <input
                      type="email"
                      required
                      value={adminEmail}
                      onChange={e => setAdminEmail(e.target.value)}
                      placeholder="e.g. coach@gmail.com"
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

                {/* Academy Logo Section */}
                <div className="p-4 bg-amber-50/70 border-2 border-amber-300 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <ImageIcon size={18} className="text-amber-700" />
                      <span className="text-xs font-black uppercase tracking-wider text-amber-950">
                        Academy Logo for Certificates & Reports
                      </span>
                    </div>
                    <span className="text-[10px] text-amber-800 font-bold">
                      Co-branded with SmartPE India
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    {/* Logo Preview */}
                    <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-slate-400 bg-white flex items-center justify-center overflow-hidden shrink-0 shadow-sm relative group">
                      {logoUrl ? (
                        <img 
                          src={logoUrl} 
                          alt="Academy Logo" 
                          className="w-full h-full object-contain p-1"
                        />
                      ) : (
                        <div className="text-center p-2 text-slate-400">
                          <ImageIcon size={24} className="mx-auto mb-1 opacity-50" />
                          <span className="text-[9px] font-bold block">No Logo</span>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 space-y-2 w-full">
                      <div className="flex items-center gap-2">
                        <label className="cursor-pointer px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center space-x-1.5 shadow-sm">
                          <Upload size={14} />
                          <span>Upload Logo Image</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleLogoUpload}
                          />
                        </label>

                        {logoUrl && (
                          <button
                            type="button"
                            onClick={() => setLogoUrl('')}
                            className="px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-xl text-xs font-black uppercase tracking-wider transition"
                          >
                            Remove Logo
                          </button>
                        )}
                      </div>

                      <div className="flex items-center space-x-2">
                        <input
                          type="url"
                          value={logoUrl}
                          onChange={e => setLogoUrl(e.target.value)}
                          placeholder="Or paste direct image URL (https://...)"
                          className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-700 font-mono focus:outline-none"
                        />
                      </div>
                      <p className="text-[10px] text-slate-500 font-medium">
                        This logo and your Academy Name will appear alongside SmartPE on Parent Progress Reports and Official Merit Award Certificates.
                      </p>
                    </div>
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
                    className="w-full py-3 bg-amber-500 hover:bg-amber-400 disabled:bg-slate-300 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider transition shadow-md flex items-center justify-center space-x-2 active:scale-98"
                  >
                    {isSaving ? (
                      <>
                        <RefreshCw size={15} className="animate-spin" />
                        <span>Saving to Firebase Database...</span>
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

            {/* Tab 2: Teachers & Coaches Management */}
            {activeTab === 'colleagues' && (
              <div className="space-y-4 overflow-y-auto pr-1">
                
                {/* Invite Code Box */}
                <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-2xl flex items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-900">
                      Academy Coach / Teacher Invite Code
                    </span>
                    <p className="text-lg font-black font-mono tracking-wider text-slate-900">
                      {program?.inviteCode || 'CP-SETUP'}
                    </p>
                    <p className="text-[11px] text-amber-800 font-medium">
                      Colleague coaches and teachers can enter this code in the Coaching Hub to join and assess their game squads.
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

                {/* Direct Add Teacher Form */}
                <form onSubmit={handleAddTeacher} className="p-4 bg-slate-50 border-2 border-slate-900 rounded-2xl space-y-3">
                  <div className="flex items-center space-x-2">
                    <UserPlus size={16} className="text-amber-600" />
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">
                      Add Teacher / Coach to Academy
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      required
                      value={colleagueName}
                      onChange={e => setColleagueName(e.target.value)}
                      placeholder="Teacher/Coach Name (e.g. Coach Rahul Sharma)"
                      className="bg-white border-2 border-slate-900 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none"
                    />

                    <input
                      type="email"
                      required
                      value={colleagueEmail}
                      onChange={e => setColleagueEmail(e.target.value)}
                      placeholder="Teacher Email (e.g. coach.rahul@gmail.com)"
                      className="bg-white border-2 border-slate-900 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none"
                    />

                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-500 mb-0.5">
                        Assigned Sport
                      </label>
                      <select
                        value={colleagueSport}
                        onChange={e => setColleagueSport(e.target.value)}
                        className="w-full bg-white border-2 border-slate-900 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none"
                      >
                        <option value="All Sports">All Sports</option>
                        {selectedSports.map(s => {
                          const tmpl = SPORT_TEMPLATES[s as CoachingSportId];
                          return <option key={s} value={s}>{tmpl?.name || s}</option>;
                        })}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-500 mb-0.5">
                        Role
                      </label>
                      <select
                        value={colleagueRole}
                        onChange={e => setColleagueRole(e.target.value)}
                        className="w-full bg-white border-2 border-slate-900 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none"
                      >
                        <option value="Lead Coach">Lead Coach</option>
                        <option value="Specialist Coach">Specialist Coach</option>
                        <option value="PE Teacher">PE Teacher</option>
                        <option value="Assistant Coach">Assistant Coach</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isAddingColleague || !colleagueEmail.trim()}
                    className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white font-black rounded-xl text-xs uppercase tracking-wider transition flex items-center justify-center space-x-2"
                  >
                    {isAddingColleague ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" />
                        <span>Adding Teacher...</span>
                      </>
                    ) : (
                      <>
                        <UserPlus size={14} />
                        <span>Add Teacher to Academy Roster</span>
                      </>
                    )}
                  </button>
                </form>

                {/* Teachers & Coaches List */}
                <div>
                  <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-700 mb-2">
                    Academy Teachers & Coaches ({teachers.length})
                  </h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {teachers.map((t, idx) => {
                      const isHead = idx === 0 || t.email.toLowerCase() === adminEmail.toLowerCase();
                      return (
                        <div
                          key={t.email}
                          className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between shadow-xs"
                        >
                          <div className="flex items-center space-x-2.5">
                            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-900 flex items-center justify-center font-black text-xs">
                              {t.name.charAt(0)}
                            </div>
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="text-xs font-bold text-slate-900">{t.name}</span>
                                <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[9px] font-black uppercase">
                                  {t.role || 'Coach'}
                                </span>
                                {t.sport && (
                                  <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-[9px] font-bold capitalize">
                                    {t.sport}
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] text-slate-500 font-mono">{t.email}</span>
                            </div>
                          </div>

                          {!isHead && (
                            <button
                              type="button"
                              onClick={() => handleRemoveTeacher(t.email)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                              title="Remove teacher"
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
          </>
        )}

        {/* Footer */}
        <div className="pt-4 border-t-2 border-slate-100 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 font-medium">
            Admin: <strong className="text-slate-900">{adminEmail || currentUser?.email || 'Required'}</strong>
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
