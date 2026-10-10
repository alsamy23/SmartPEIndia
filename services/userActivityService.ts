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

export const userActivityService = {
  /**
   * Records a user login event into Firestore and increments login counts
   */
  recordUserLogin: async (
    user: FirebaseUser, 
    extra?: { workspaceType?: string; orgName?: string; role?: string }
  ): Promise<void> => {
    try {
      if (!user || !user.uid) return;
      const nowIso = new Date().toISOString();
      const cleanEmail = (user.email || '').trim().toLowerCase();
      const cleanName = user.displayName?.trim() || cleanEmail.split('@')[0] || 'Teacher';

      // 1. Fetch current user document to get existing stats
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      const existingData = userSnap.exists() ? userSnap.data() : {};

      const currentCount = typeof existingData.loginCount === 'number' ? existingData.loginCount : 0;
      const workspaceType = extra?.workspaceType || existingData.workspaceType || (existingData.academyId ? 'academy' : 'school');
      const schoolName = extra?.orgName || existingData.schoolName || existingData.academyName || (workspaceType === 'academy' ? 'Sports Academy' : 'School');

      // 2. Update user profile with latest activity timestamps
      await setDoc(userRef, {
        uid: user.uid,
        email: cleanEmail,
        displayName: existingData.displayName || cleanName,
        lastLoginAt: nowIso,
        lastActiveAt: nowIso,
        loginCount: currentCount + 1,
        workspaceType,
        schoolName,
        role: extra?.role || existingData.role || 'teacher',
        updatedAt: nowIso
      }, { merge: true });

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
   * Heartbeat / presence ping to keep lastActiveAt fresh once per session
   */
  recordUserPresence: async (user: FirebaseUser): Promise<void> => {
    try {
      if (!user || !user.uid) return;
      const key = `smartpe_presence_${user.uid}`;
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
  getRecentLogins: async (max = 50): Promise<LoginActivityRecord[]> => {
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
  subscribeToRecentLogins: (max = 50, callback: (records: LoginActivityRecord[]) => void) => {
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
