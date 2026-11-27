import { collection, doc, setDoc, getDoc, getDocs, query, orderBy, limit, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { User as FirebaseUser } from 'firebase/auth';
import { db } from './firebase.ts';

export interface LoginActivityRecord {
  id: string;
  uid: string;
  email: string;
  displayName: string;
  schoolName: string;
  workspaceType: 'school' | 'academy';
  timestamp: string;
  userAgent?: string;
  platform?: string;
}

const SESSION_LOGIN_PREFIX = 'smartpe_session_login_';
const PRESENCE_PREFIX = 'smartpe_presence_';
const INTERACTIVE_AUTH_KEY = 'smartpe_interactive_auth_ts';

export const userActivityService = {
  markInteractiveAuthInProgress: (): void => {
    try {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(INTERACTIVE_AUTH_KEY, String(Date.now()));
      }
    } catch {
      // ignore
    }
  },

  clearInteractiveAuthInProgress: (): void => {
    try {
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem(INTERACTIVE_AUTH_KEY);
      }
    } catch {
      // ignore
    }
  },

  isInteractiveAuthInProgress: (): boolean => {
    try {
      if (typeof window === 'undefined') return false;
      const ts = Number(sessionStorage.getItem(INTERACTIVE_AUTH_KEY) || 0);
      return ts > 0 && Date.now() - ts < 15000;
    } catch {
      return false;
    }
  },

  markLoginRecordedForSession: (uid: string): void => {
    try {
      if (typeof window !== 'undefined' && uid) {
        sessionStorage.setItem(`${SESSION_LOGIN_PREFIX}${uid}`, String(Date.now()));
      }
    } catch {
      // ignore storage restrictions
    }
  },

  hasLoginRecordedForSession: (uid: string): boolean => {
    try {
      if (typeof window === 'undefined' || !uid) return false;
      const val = sessionStorage.getItem(`${SESSION_LOGIN_PREFIX}${uid}`);
      if (!val) return false;
      // Treat as same login session for up to 12 hours within the active browser session
      return Date.now() - Number(val) < 12 * 60 * 60 * 1000;
    } catch {
      return false;
    }
  },

  /**
   * Records a user login event into Firestore and increments login counts
   */
  recordUserLogin: async (
    user: FirebaseUser, 
    extra?: { workspaceType?: string; orgName?: string; role?: string; privacyAcceptedAt?: string; privacyVersion?: string }
  ): Promise<void> => {
    try {
      if (!user || !user.uid) return;
      userActivityService.markLoginRecordedForSession(user.uid);

      const nowIso = new Date().toISOString();
      const cleanEmail = (user.email || '').trim().toLowerCase();
      const cleanName = user.displayName?.trim() || cleanEmail.split('@')[0] || 'Teacher';

      // 1. Fetch current user document to get existing stats
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      const existingData = userSnap.exists() ? userSnap.data() : {};

      const currentCount = typeof existingData.loginCount === 'number' ? existingData.loginCount : 0;
      const workspaceType = (extra?.workspaceType || existingData.workspaceType || (existingData.academyId ? 'academy' : 'school')) as 'school' | 'academy';
      const schoolName = extra?.orgName || existingData.schoolName || existingData.academyName || (workspaceType === 'academy' ? 'Sports Academy' : `${cleanName}'s Partner School`);
      const resolvedSchoolId = existingData.schoolId || (workspaceType === 'school' ? `school_${user.uid}` : undefined);
      const resolvedRole = extra?.role || existingData.role || 'admin';
      const createdAt = existingData.createdAt || existingData.registrationDate || user.metadata?.creationTime || nowIso;

      // 2. Update user profile with latest activity timestamps & guaranteed core fields
      await setDoc(userRef, {
        uid: user.uid,
        email: cleanEmail,
        displayName: existingData.displayName || cleanName,
        createdAt,
        registrationDate: existingData.registrationDate || createdAt,
        lastLoginAt: nowIso,
        lastActiveAt: nowIso,
        loginCount: currentCount + 1,
        workspaceType,
        activeWorkspace: existingData.activeWorkspace || workspaceType,
        ...(workspaceType === 'academy'
          ? { academyName: schoolName }
          : { schoolName, ...(resolvedSchoolId ? { schoolId: resolvedSchoolId } : {}) }),
        role: resolvedRole,
        ...(extra?.privacyAcceptedAt ? {
          privacyAcceptedAt: extra.privacyAcceptedAt,
          privacyVersion: extra.privacyVersion || '2026-11'
        } : {}),
        updatedAt: nowIso
      }, { merge: true });

      if (typeof window !== 'undefined' && schoolName) {
        try {
          localStorage.setItem('smartpe_school_name', schoolName);
        } catch {
          // ignore
        }
      }

      // 2b. Ensure school & schoolMembers record exist if user has a school workspace without membership doc
      if (workspaceType === 'school' && resolvedSchoolId === `school_${user.uid}`) {
        try {
          const memberRef = doc(db, 'schoolMembers', user.uid);
          const memberSnap = await getDoc(memberRef);
          if (!memberSnap.exists()) {
            const schoolRef = doc(db, 'schools', resolvedSchoolId);
            const schoolSnap = await getDoc(schoolRef);
            if (!schoolSnap.exists()) {
              await setDoc(schoolRef, {
                id: resolvedSchoolId,
                name: schoolName,
                adminId: user.uid,
                createdAt
              }, { merge: true });
            }
            await setDoc(memberRef, {
              uid: user.uid,
              schoolId: resolvedSchoolId,
              role: resolvedRole,
              displayName: existingData.displayName || cleanName,
              email: cleanEmail,
              schoolName,
              createdAt
            }, { merge: true });
          }
        } catch {
          // Non-fatal fallback
        }
      }

      // 3. Create a discrete log entry for real-time live login monitoring
      const logCol = collection(db, 'login_activity');
      const logDoc = doc(logCol);
      await setDoc(logDoc, {
        id: logDoc.id,
        uid: user.uid,
        email: cleanEmail,
        displayName: existingData.displayName || cleanName,
        schoolName,
        workspaceType,
        timestamp: nowIso,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Web Browser',
        platform: typeof navigator !== 'undefined' ? (navigator.platform || 'Web') : 'Web'
      });
    } catch (err) {
      console.warn('User activity recording notice (non-fatal):', err);
    }
  },

  /**
   * Ensures any active Firebase Auth user (including returning persisted sessions or incomplete signups)
   * has a complete Firestore profile and records one session entry per browser session without double-counting.
   */
  ensureUserProfileAndSession: async (user: FirebaseUser): Promise<void> => {
    try {
      if (!user || !user.uid) return;

      // If interactive signup/login in Auth.tsx is actively writing the profile, wait briefly so we don't race
      if (userActivityService.isInteractiveAuthInProgress()) {
        await new Promise((resolve) => setTimeout(resolve, 3500));
      }

      const nowIso = new Date().toISOString();
      const cleanEmail = (user.email || '').trim().toLowerCase();
      const cleanName = user.displayName?.trim() || cleanEmail.split('@')[0] || 'Educator';

      if (userActivityService.hasLoginRecordedForSession(user.uid)) {
        await userActivityService.recordUserPresence(user);
        return;
      }

      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        // Backfill missing Firestore profile for an existing Firebase Auth account
        const savedWs = typeof window !== 'undefined' && localStorage.getItem('smartpe_active_workspace') === 'academy'
          ? 'academy'
          : 'school';
        const fallbackSchoolName = `${cleanName}'s Partner School`;
        await userActivityService.recordUserLogin(user, {
          workspaceType: savedWs,
          orgName: savedWs === 'academy' ? `${cleanName}'s Sports Academy` : fallbackSchoolName,
          role: 'admin'
        });
        return;
      }

      const data = userSnap.data() || {};
      const lastLoginMs = data.lastLoginAt ? new Date(data.lastLoginAt).getTime() : 0;
      const recentlyLoggedIn = lastLoginMs > 0 && Date.now() - lastLoginMs < 20 * 1000;

      // If Auth.tsx just recorded a login within the last 20 seconds, do not double-count
      if (recentlyLoggedIn) {
        userActivityService.markLoginRecordedForSession(user.uid);
        await userActivityService.recordUserPresence(user);
        return;
      }

      const needsFieldBackfill = !data.uid || !data.email || !data.displayName || !data.createdAt;
      const resolvedSchool = data.schoolName || data.academyName || '';
      if (typeof window !== 'undefined' && resolvedSchool) {
        try {
          localStorage.setItem('smartpe_school_name', resolvedSchool);
        } catch {
          // ignore
        }
      }

      if (needsFieldBackfill || !userActivityService.hasLoginRecordedForSession(user.uid)) {
        await userActivityService.recordUserLogin(user, {
          workspaceType: data.workspaceType || (data.academyId ? 'academy' : 'school'),
          orgName: resolvedSchool || undefined,
          role: data.role
        });
      } else {
        await setDoc(userRef, { lastActiveAt: nowIso }, { merge: true });
      }
    } catch (err) {
      console.warn('Session profile sync notice (non-fatal):', err);
    }
  },

  /**
   * Heartbeat / presence ping to keep lastActiveAt fresh once per session
   */
  recordUserPresence: async (user: FirebaseUser): Promise<void> => {
    try {
      if (!user || !user.uid) return;
      const key = `${PRESENCE_PREFIX}${user.uid}`;
      const lastPing = sessionStorage.getItem(key);
      const now = Date.now();
      
      // Throttle presence updates to once every 30 minutes per browser session
      if (lastPing && now - Number(lastPing) < 30 * 60 * 1000) {
        return;
      }
      sessionStorage.setItem(key, String(now));

      const nowIso = new Date().toISOString();
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        lastActiveAt: nowIso
      }, { merge: true });
    } catch (e) {
      // Non-fatal
    }
  },

  /**
   * Fetch recent logins for Super Admin overview
   */
  getRecentLogins: async (max = 200): Promise<LoginActivityRecord[]> => {
    try {
      const q = query(
        collection(db, 'login_activity'),
        orderBy('timestamp', 'desc'),
        limit(max)
      );
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as LoginActivityRecord));
    } catch (err) {
      console.warn('Failed to fetch login activity:', err);
      return [];
    }
  },

  /**
   * Real-time subscription to live logins
   */
  subscribeToRecentLogins: (max = 200, callback: (records: LoginActivityRecord[]) => void) => {
    try {
      const q = query(
        collection(db, 'login_activity'),
        orderBy('timestamp', 'desc'),
        limit(max)
      );
      return onSnapshot(q, (snap) => {
        const records = snap.docs.map(d => ({ id: d.id, ...d.data() } as LoginActivityRecord));
        callback(records);
      }, (error) => {
        console.warn('Real-time login monitor fallback:', error);
      });
    } catch (err) {
      console.warn('Could not subscribe to login activity:', err);
      return () => {};
    }
  }
};
