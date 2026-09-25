
import React, { useState } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail
} from 'firebase/auth';
import { collection, query, where, getDocs, deleteDoc, doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { motion } from 'motion/react';
import { Mail, Lock, User, School, Trophy, ArrowRight, Loader2, ArrowLeft, KeyRound, CheckCircle } from 'lucide-react';
import Logo from './Logo';
import { trackEvent } from '../services/analytics.ts';
import { toast } from '../services/toast.ts';
import { sendAutomatedWelcomeEmail } from '../services/emailService.ts';
import { academicCoachingCloudService } from '../services/academicCoachingCloudService.ts';

interface AuthProps {
  onBack?: () => void;
}

export type WorkspaceType = 'school' | 'academy';

const Auth: React.FC<AuthProps> = ({ onBack }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [workspaceType, setWorkspaceType] = useState<WorkspaceType>('school');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [academyName, setAcademyName] = useState('');
  const [academySport, setAcademySport] = useState('football');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setResetSent(true);
      toast.success('Password reset email sent! Check your inbox.');
    } catch (err: any) {
      console.error('Password reset error:', err);
      let msg = 'Failed to send password reset email.';
      if (err.code === 'auth/user-not-found') {
        msg = 'No user found with this email address.';
      } else if (err.code === 'auth/invalid-email') {
        msg = 'Please enter a valid email address.';
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const user = userCredential.user;

      // Check if user already has a profile
      const userDocRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userDocRef);
      
      if (!userSnap.exists()) {
        const nowIso = new Date().toISOString();
        if (workspaceType === 'academy') {
          // Initialize Academy Workspace
          const progName = academyName.trim() || (user.displayName ? `${user.displayName} Sports Academy` : 'Elite Sports Academy');
          const program = await academicCoachingCloudService.registerAcademicProgram({
            programName: progName,
            programType: 'after_school_academy',
            sport: academySport,
            coachName: user.displayName || 'Head Coach',
            adminEmail: user.email || ''
          });

          await setDoc(userDocRef, {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || 'Coach',
            workspaceType: 'academy',
            activeWorkspace: 'academy',
            academyId: program.id,
            academyName: progName,
            role: 'admin',
            createdAt: nowIso,
            registrationDate: nowIso,
            nurtureStep1SentAt: nowIso
          });

          localStorage.setItem('smartpe_active_workspace', 'academy');
        } else {
          // Initialize School Workspace
          // Check for pending invited memberships
          const membersRef = collection(db, 'schoolMembers');
          const q = query(membersRef, where('email', '==', user.email));
          const querySnapshot = await getDocs(q);
          
          let schoolId = '';
          let role = 'admin';
          let customSchoolName = '';
          let customSchoolLogo = '';

          if (!querySnapshot.empty) {
            const pendingMemberDoc = querySnapshot.docs.find(d => d.id.startsWith('pending_')) || querySnapshot.docs[0];
            const data = pendingMemberDoc.data();
            schoolId = data.schoolId;
            role = data.role || 'teacher';
            customSchoolName = data.schoolName || '';
            customSchoolLogo = data.schoolLogo || '';
            if (pendingMemberDoc.id.startsWith('pending_')) {
              try {
                await deleteDoc(pendingMemberDoc.ref);
              } catch (e) {
                console.warn("Could not delete pending doc:", e);
              }
            }
          } else {
            schoolId = `school_${user.uid}`;
            const initialSchoolName = schoolName.trim() || (user.displayName ? `${user.displayName} School` : 'PE Partner School');
            await setDoc(doc(db, 'schools', schoolId), {
              id: schoolId,
              name: initialSchoolName,
              adminId: user.uid,
              createdAt: nowIso
            });
          }

          const finalSchoolName = customSchoolName || schoolName.trim() || (user.displayName ? `${user.displayName} School` : 'PE Partner School');
          
          await setDoc(userDocRef, {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || 'Teacher',
            workspaceType: 'school',
            activeWorkspace: 'school',
            schoolName: finalSchoolName,
            schoolLogo: customSchoolLogo,
            schoolId,
            role,
            createdAt: nowIso,
            registrationDate: nowIso,
            nurtureStep1SentAt: nowIso
          });

          await setDoc(doc(db, 'schoolMembers', user.uid), {
            uid: user.uid,
            schoolId: schoolId,
            role,
            displayName: user.displayName || 'Teacher',
            email: user.email,
            schoolName: finalSchoolName,
            schoolLogo: customSchoolLogo
          });

          localStorage.setItem('smartpe_active_workspace', 'school');
        }

        trackEvent('signup', { method: 'google', workspace: workspaceType });
      } else {
        const uData = userSnap.data();
        const activeWs = uData.activeWorkspace || (uData.academyId && !uData.schoolId ? 'academy' : 'school');
        localStorage.setItem('smartpe_active_workspace', activeWs);
      }
    } catch (err: any) {
      console.error('Google Auth Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        // Determine active workspace from user document
        const userDocRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userDocRef);
        if (userSnap.exists()) {
          const uData = userSnap.data();
          const activeWs = uData.activeWorkspace || (uData.academyId && !uData.schoolId ? 'academy' : 'school');
          localStorage.setItem('smartpe_active_workspace', activeWs);
        }
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        await updateProfile(user, { displayName });
        const nowIso = new Date().toISOString();

        if (workspaceType === 'academy') {
          // --- ACADEMY WORKSPACE REGISTRATION ---
          const finalAcademyName = academyName.trim() || (displayName ? `${displayName}'s Sports Academy` : 'Sports Coaching Academy');
          
          const program = await academicCoachingCloudService.registerAcademicProgram({
            programName: finalAcademyName,
            programType: 'after_school_academy',
            sport: academySport,
            coachName: displayName || 'Head Coach',
            adminEmail: user.email || ''
          });

          // Save user record
          await setDoc(doc(db, 'users', user.uid), {
            uid: user.uid,
            email: user.email,
            displayName,
            workspaceType: 'academy',
            activeWorkspace: 'academy',
            academyId: program.id,
            academyName: finalAcademyName,
            role: 'admin',
            createdAt: nowIso,
            registrationDate: nowIso,
            nurtureStep1SentAt: nowIso
          });

          localStorage.setItem('smartpe_active_workspace', 'academy');

          trackEvent('signup', { method: 'email', workspace: 'academy' });
          trackEvent('profile_created', { workspace: 'academy' });
        } else {
          // --- SCHOOL WORKSPACE REGISTRATION ---
          const membersRef = collection(db, 'schoolMembers');
          const q = query(membersRef, where('email', '==', email));
          const querySnapshot = await getDocs(q);
          
          let schoolId = '';
          let role = 'admin';
          let customSchoolName = '';
          let customSchoolLogo = '';

          if (!querySnapshot.empty) {
            // Claim existing pending membership
            const pendingMemberDoc = querySnapshot.docs.find(d => d.id.startsWith('pending_')) || querySnapshot.docs[0];
            const data = pendingMemberDoc.data();
            schoolId = data.schoolId;
            role = data.role || 'teacher';
            customSchoolName = data.schoolName || '';
            customSchoolLogo = data.schoolLogo || '';
            
            if (pendingMemberDoc.id.startsWith('pending_')) {
              try {
                await deleteDoc(pendingMemberDoc.ref);
              } catch (e) {
                console.warn("Could not delete pending doc:", e);
              }
            }
          } else {
            // Create new school
            schoolId = `school_${user.uid}`;
            const initialSchoolName = schoolName.trim() || (displayName ? `${displayName}'s School` : 'SmartPE Member School');
            
            await setDoc(doc(db, 'schools', schoolId), {
              id: schoolId,
              name: initialSchoolName,
              adminId: user.uid,
              createdAt: nowIso
            });
          }
          
          const finalSchoolName = customSchoolName || schoolName.trim() || (displayName ? `${displayName}'s School` : 'SmartPE Member School');

          // Create user document in Firestore
          await setDoc(doc(db, 'users', user.uid), {
            uid: user.uid,
            email: user.email,
            displayName,
            workspaceType: 'school',
            activeWorkspace: 'school',
            schoolName: finalSchoolName,
            schoolLogo: customSchoolLogo,
            schoolId,
            role,
            createdAt: nowIso,
            registrationDate: nowIso,
            nurtureStep1SentAt: nowIso
          });

          // Add as proper school member
          await setDoc(doc(db, 'schoolMembers', user.uid), {
            uid: user.uid,
            schoolId: schoolId,
            role,
            displayName,
            email: user.email,
            schoolName: finalSchoolName,
            schoolLogo: customSchoolLogo
          });

          localStorage.setItem('smartpe_active_workspace', 'school');

          trackEvent('signup', { method: 'email', workspace: 'school' });
          trackEvent('profile_created', { workspace: 'school' });

          // Corporate Automated Welcome Email Dispatch
          if (user.email) {
            sendAutomatedWelcomeEmail(user.email, displayName || 'Physical Education Educator', finalSchoolName)
              .then(res => {
                if (res.success) {
                  console.log('Automated welcome email dispatched:', res);
                }
              })
              .catch(e => console.warn('Welcome email trigger note:', e));
          }
        }
      }
    } catch (err: any) {
      console.error('Auth Error:', err);
      let userFriendlyMessage = 'An unexpected error occurred. Please try again.';
      
      if (err.code === 'auth/email-already-in-use') {
        userFriendlyMessage = 'This email is already registered. Please log in instead or use a different email.';
        setIsLogin(true);
      } else if (err.code === 'auth/operation-not-allowed') {
        userFriendlyMessage = 'Email/Password registration is not enabled for this project. Please contact the administrator or enable it in the Firebase Console.';
      } else if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        userFriendlyMessage = 'Invalid email or password. Please check your credentials.';
      } else if (err.code === 'auth/invalid-email') {
        userFriendlyMessage = 'Please enter a valid email address.';
      } else if (err.code === 'auth/weak-password') {
        userFriendlyMessage = 'Password should be at least 6 characters.';
      } else if (err.message) {
        userFriendlyMessage = err.message;
      }
      
      setError(userFriendlyMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-[2rem] sm:rounded-[2.5rem] border-2 sm:border-4 border-slate-900 p-6 md:p-10 shadow-2xl relative my-auto"
      >
        {onBack && (
          <button 
            onClick={onBack}
            className="absolute left-4 top-4 sm:left-6 sm:top-6 p-2 bg-slate-50 border border-slate-100 hover:bg-slate-100 rounded-xl text-slate-500 hover:text-slate-950 transition-all flex items-center justify-center"
            style={{ width: '40px', height: '40px' }}
            aria-label="Back"
          >
            <ArrowLeft size={20} />
          </button>
        )}

        <div className="flex flex-col items-center mb-6">
          <Logo showText={false} className="mb-3" />
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 uppercase tracking-tighter text-center">
            {isForgotPassword 
              ? 'Reset Password' 
              : isLogin 
                ? 'Welcome Back' 
                : 'Create Account'}
          </h1>
          <p className="text-slate-500 font-medium text-center text-xs sm:text-sm mt-1">
            {isForgotPassword
              ? 'Enter your email to receive a password reset link'
              : isLogin 
                ? 'Log in to access your School or Academy workspace' 
                : 'Select your workspace type to get started'}
          </p>
        </div>

        {/* --- FORGOT PASSWORD VIEW --- */}
        {isForgotPassword ? (
          <form onSubmit={handlePasswordReset} className="space-y-4">
            {resetSent ? (
              <div className="p-4 bg-emerald-50 border-2 border-emerald-200 rounded-2xl text-center space-y-2">
                <CheckCircle className="mx-auto text-emerald-600" size={32} />
                <p className="text-sm font-black text-emerald-900">Check Your Email</p>
                <p className="text-xs text-emerald-700">We've sent a secure password reset link to <strong>{email}</strong>.</p>
              </div>
            ) : (
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="email" 
                  placeholder="Registered Email Address"
                  required
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent rounded-2xl font-bold outline-none focus:border-primary transition-all text-sm"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            )}

            {error && (
              <p className="text-red-500 text-xs font-bold px-2">{error}</p>
            )}

            {!resetSent ? (
              <button 
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-primary text-white border-2 border-slate-900 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-primary-container transition-all shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : (
                  <>
                    <span>Send Reset Link</span>
                    <KeyRound size={18} />
                  </>
                )}
              </button>
            ) : null}

            <button 
              type="button"
              onClick={() => {
                setIsForgotPassword(false);
                setResetSent(false);
                setError(null);
              }}
              className="w-full py-2.5 text-slate-600 font-bold text-xs hover:text-slate-950 transition-colors uppercase tracking-wider text-center"
            >
              ← Back to Login
            </button>
          </form>
        ) : (
          /* --- LOGIN / REGISTER VIEW --- */
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* WORKSPACE SELECTION (Only visible on Registration) */}
            {!isLogin && (
              <div className="space-y-2 mb-4">
                <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 block">
                  Select Workspace Type:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setWorkspaceType('school')}
                    className={`p-3 rounded-2xl border-2 flex flex-col items-center justify-center gap-1.5 transition-all text-center ${
                      workspaceType === 'school'
                        ? 'border-blue-600 bg-blue-50/70 text-blue-950 font-black shadow-sm'
                        : 'border-slate-200 bg-slate-50 text-slate-600 font-bold hover:bg-slate-100'
                    }`}
                  >
                    <School size={22} className={workspaceType === 'school' ? 'text-blue-600' : 'text-slate-400'} />
                    <span className="text-xs uppercase tracking-tight leading-tight">School PE</span>
                    <span className="text-[9px] text-slate-500 font-semibold leading-none">PE & Curriculum</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setWorkspaceType('academy')}
                    className={`p-3 rounded-2xl border-2 flex flex-col items-center justify-center gap-1.5 transition-all text-center ${
                      workspaceType === 'academy'
                        ? 'border-amber-500 bg-amber-50/70 text-amber-950 font-black shadow-sm'
                        : 'border-slate-200 bg-slate-50 text-slate-600 font-bold hover:bg-slate-100'
                    }`}
                  >
                    <Trophy size={22} className={workspaceType === 'academy' ? 'text-amber-500' : 'text-slate-400'} />
                    <span className="text-xs uppercase tracking-tight leading-tight">Coaching & Academy</span>
                    <span className="text-[9px] text-slate-500 font-semibold leading-none">Coaching & Players</span>
                  </button>
                </div>
              </div>
            )}

            {!isLogin && (
              <>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="text" 
                    placeholder={workspaceType === 'academy' ? 'Coach / Director Name' : 'Educator Full Name'}
                    required
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-2 border-transparent rounded-2xl font-bold outline-none focus:border-primary transition-all text-sm"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                  />
                </div>

                {workspaceType === 'school' ? (
                  <div className="relative">
                    <School className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="text" 
                      placeholder="School / Institution Name"
                      required
                      className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-2 border-transparent rounded-2xl font-bold outline-none focus:border-primary transition-all text-sm"
                      value={schoolName}
                      onChange={(e) => setSchoolName(e.target.value)}
                    />
                  </div>
                ) : (
                  <>
                    <div className="relative">
                      <Trophy className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input 
                        type="text" 
                        placeholder="Sports Academy / Club Name"
                        required
                        className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-2 border-transparent rounded-2xl font-bold outline-none focus:border-amber-500 transition-all text-sm"
                        value={academyName}
                        onChange={(e) => setAcademyName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-1">
                        Primary Sport:
                      </label>
                      <select
                        value={academySport}
                        onChange={(e) => setAcademySport(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent rounded-2xl font-bold outline-none focus:border-amber-500 transition-all text-xs text-slate-800"
                      >
                        <option value="football">⚽ Football (Soccer)</option>
                        <option value="basketball">🏀 Basketball</option>
                        <option value="cricket">🏏 Cricket</option>
                        <option value="athletics">🏃 Track & Field (Athletics)</option>
                        <option value="badminton">🏸 Badminton</option>
                        <option value="tennis">🎾 Tennis</option>
                        <option value="volleyball">🏐 Volleyball</option>
                        <option value="swimming">🏊 Swimming</option>
                        <option value="chess">♟️ Chess</option>
                        <option value="tabletennis">🏓 Table Tennis</option>
                        <option value="kabaddi">🤼 Kabaddi</option>
                        <option value="kho_kho">🏃 Kho Kho</option>
                        <option value="skating">🛼 Roller Skating</option>
                      </select>
                    </div>
                  </>
                )}
              </>
            )}

            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="email" 
                placeholder="Email Address"
                required
                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-2 border-transparent rounded-2xl font-bold outline-none focus:border-primary transition-all text-sm"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="password" 
                placeholder="Password (min. 6 characters)"
                required
                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-2 border-transparent rounded-2xl font-bold outline-none focus:border-primary transition-all text-sm"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {isLogin && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotPassword(true);
                    setError(null);
                  }}
                  className="text-xs text-primary font-bold hover:underline"
                >
                  Forgot Password?
                </button>
              </div>
            )}

            {error && (
              <p className="text-red-500 text-xs font-bold px-2">{error}</p>
            )}

            <button 
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-primary text-white border-2 border-slate-900 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-primary-container transition-all shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : (
                <>
                  <span>{isLogin ? 'Log In to Workspace' : `Register ${workspaceType === 'academy' ? 'Academy' : 'School'} Workspace`}</span>
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>
        )}

        {!isForgotPassword && (
          <>
            <div className="mt-6">
              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t-2 border-slate-100"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-4 bg-white text-slate-400 font-black uppercase tracking-widest">Or continue with</span>
                </div>
              </div>

              <button 
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full py-3.5 bg-white text-slate-900 border-2 border-slate-900 rounded-2xl font-black text-xs sm:text-sm uppercase tracking-widest hover:bg-slate-50 transition-all shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] flex items-center justify-center gap-3"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span>Google Account</span>
              </button>
            </div>

            <div className="mt-6 text-center">
              <button 
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError(null);
                }}
                className="text-slate-500 font-bold text-xs sm:text-sm hover:text-primary transition-colors"
              >
                {isLogin ? "Don't have an account? Register" : "Already have an account? Log In"}
              </button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default Auth;

