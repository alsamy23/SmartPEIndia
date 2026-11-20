import {
  collection,
  doc,
  setDoc,
  getDoc,
  addDoc,
  getDocs,
  deleteDoc,
  writeBatch,
  query,
  where,
  serverTimestamp,
  DocumentReference
} from 'firebase/firestore';
import { deleteUser, signOut } from 'firebase/auth';
import { db, auth } from './firebase';
import { fitnessService } from './fitnessService';
import { offlineCacheService } from './offlineCacheService';

export interface PrivacyAuditEvent {
  eventType:
    | 'login'
    | 'failed_login'
    | 'dpa_accepted'
    | 'student_data_exported'
    | 'deletion_requested'
    | 'deletion_cancelled'
    | 'deletion_completed'
    | 'role_changed'
    | 'privacy_policy_viewed';
  schoolId?: string;
  userId?: string;
  userEmail?: string;
  details?: Record<string, any>;
  timestamp?: any;
}

export interface DPAStatus {
  accepted: boolean;
  acceptedAt?: string | null;
  acceptedBy?: string | null;
  version: string;
}

export interface DeletionRequest {
  id?: string;
  schoolId: string;
  schoolName: string;
  requestedByUid: string;
  requestedByEmail: string;
  requestedAt: string;
  reason?: string;
  status: 'pending_verification' | 'in_review' | 'completed' | 'cancelled';
  notes?: string;
}

export interface InstantDeletionSummary {
  deletedRecordsCount: number;
  authAccountDeleted: boolean;
  requiresRecentLogin?: boolean;
  collectionsCleared: string[];
}

export const DPA_VERSION = 'v1.1 (2026.2)';

/**
 * Sanitizes event parameters so that no student PII or assessment scores are stored in audit logs
 */
function sanitizeAuditDetails(details?: Record<string, any>): Record<string, any> {
  if (!details) return {};
  const clean: Record<string, any> = {};
  const blockedKeys = [
    'studentName', 'student_name', 'name', 'rollNumber', 'dob', 'dateOfBirth',
    'phone', 'address', 'medical', 'score', 'marks', 'bmi', 'result'
  ];

  for (const [key, val] of Object.entries(details)) {
    if (!blockedKeys.includes(key) && typeof val !== 'function') {
      if (typeof val === 'object' && val !== null) {
        clean[key] = Array.isArray(val) ? `count:${val.length}` : '[object]';
      } else {
        clean[key] = val;
      }
    }
  }
  return clean;
}

/**
 * Deletes an array of DocumentReferences in batches of 400 to respect Firestore's 500-op batch cap.
 */
async function commitBatchDeletes(refs: DocumentReference[]): Promise<number> {
  if (!refs.length) return 0;
  let totalDeleted = 0;
  const CHUNK_SIZE = 400;
  for (let i = 0; i < refs.length; i += CHUNK_SIZE) {
    const chunk = refs.slice(i, i + CHUNK_SIZE);
    const batch = writeBatch(db);
    chunk.forEach((ref) => batch.delete(ref));
    await batch.commit();
    totalDeleted += chunk.length;
  }
  return totalDeleted;
}

/**
 * Queries a collection by field==value and batch-deletes all matching documents.
 */
async function deleteMatchingDocs(colName: string, field: string, value: string): Promise<number> {
  if (!value) return 0;
  try {
    const q = query(collection(db, colName), where(field, '==', value));
    const snap = await getDocs(q);
    if (snap.empty) return 0;
    return await commitBatchDeletes(snap.docs.map((d) => d.ref));
  } catch (err) {
    console.warn(`Batch delete skipped or failed for ${colName} (${field}=${value}):`, err);
    return 0;
  }
}

export const privacyAuditService = {
  /**
   * Records a security & privacy relevant event in Firestore without logging student PII
   */
  recordEvent: async (
    eventType: PrivacyAuditEvent['eventType'],
    schoolId?: string,
    details?: Record<string, any>
  ): Promise<void> => {
    try {
      const user = auth.currentUser;
      const logEntry = {
        eventType,
        schoolId: schoolId || 'personal',
        userId: user?.uid || 'anonymous',
        userEmail: user?.email || undefined,
        details: sanitizeAuditDetails(details),
        createdAt: new Date().toISOString(),
        serverTimestamp: serverTimestamp()
      };

      await addDoc(collection(db, 'privacy_audit_logs'), logEntry);
    } catch (err) {
      // Fail safely to not disrupt user flows
      console.warn('Could not write privacy audit log:', err);
    }
  },

  /**
   * Retrieves the current DPA acceptance status for a school
   */
  getDPAStatus: async (schoolId: string): Promise<DPAStatus> => {
    try {
      if (!schoolId) {
        return { accepted: false, version: DPA_VERSION };
      }
      const schoolRef = doc(db, 'schools', schoolId);
      const snap = await getDoc(schoolRef);
      if (snap.exists()) {
        const data = snap.data();
        if (data.dpaAccepted) {
          return {
            accepted: true,
            acceptedAt: data.dpaAcceptedAt || null,
            acceptedBy: data.dpaAcceptedBy || null,
            version: data.dpaVersion || DPA_VERSION
          };
        }
      }
      // Check local cache if offline
      const local = localStorage.getItem(`smartpe_dpa_${schoolId}`);
      if (local) {
        return JSON.parse(local);
      }
    } catch (err) {
      console.warn('Failed to fetch DPA status:', err);
    }
    return { accepted: false, version: DPA_VERSION };
  },

  /**
   * Accepts the School Data Processing Agreement on behalf of the institution
   */
  acceptDPA: async (schoolId: string, userEmail: string, userName?: string): Promise<DPAStatus> => {
    const nowIso = new Date().toISOString();
    const status: DPAStatus = {
      accepted: true,
      acceptedAt: nowIso,
      acceptedBy: `${userName || 'School Administrator'} (${userEmail})`,
      version: DPA_VERSION
    };

    try {
      if (schoolId) {
        const schoolRef = doc(db, 'schools', schoolId);
        await setDoc(schoolRef, {
          dpaAccepted: true,
          dpaAcceptedAt: status.acceptedAt,
          dpaAcceptedBy: status.acceptedBy,
          dpaVersion: status.version
        }, { merge: true });
      }

      localStorage.setItem(`smartpe_dpa_${schoolId}`, JSON.stringify(status));

      await privacyAuditService.recordEvent('dpa_accepted', schoolId, {
        acceptedBy: userEmail,
        version: DPA_VERSION
      });
    } catch (err) {
      console.error('Error recording DPA acceptance:', err);
      // Fallback local storage
      localStorage.setItem(`smartpe_dpa_${schoolId}`, JSON.stringify(status));
    }

    return status;
  },

  /**
   * Gathers all data associated with the school for a structured, safe data export
   */
  exportSchoolData: async (schoolId: string, teacherId?: string): Promise<any> => {
    const user = auth.currentUser;

    let workloads: any[] = [];
    try {
      if (schoolId) {
        const qWorkload = query(collection(db, 'workloads'), where('schoolId', '==', schoolId));
        const snap = await getDocs(qWorkload);
        workloads = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      }
    } catch (e) {
      console.warn('Could not fetch workloads for export:', e);
    }

    const [students, teams, results, practicals] = await Promise.all([
      fitnessService.getStudents(teacherId || user?.uid || '', schoolId, true),
      fitnessService.getTeams(teacherId || user?.uid || '', schoolId, true),
      fitnessService.getAllSchoolResultsOnce(teacherId || user?.uid || '', schoolId, true),
      fitnessService.getPracticalAssessments(teacherId || user?.uid || '', schoolId)
    ]);

    await privacyAuditService.recordEvent('student_data_exported', schoolId, {
      studentCount: students.length,
      resultCount: results.length,
      practicalCount: practicals.length,
      exportedBy: user?.email
    });

    return {
      metadata: {
        exportDate: new Date().toISOString(),
        schoolId,
        exportedBy: user?.email || 'Authorized User',
        platform: 'SmartPE PE Digital Platform',
        version: '1.1'
      },
      summary: {
        totalStudents: students.length,
        totalFitnessResults: results.length,
        totalPracticalAssessments: practicals.length,
        totalTeams: teams.length,
        totalWorkloadEntries: workloads.length
      },
      students,
      fitnessResults: results,
      practicalAssessments: practicals,
      teams,
      workloads
    };
  },

  /**
   * Immediately deletes all data for a school workspace.
   * Child collections are deleted FIRST while school membership & school doc still validate admin access.
   * No approval request or waiting period required.
   */
  deleteSchoolWorkspaceData: async (
    schoolId: string,
    options?: { deleteSchoolRecord?: boolean; deleteCurrentUserAccount?: boolean; reason?: string }
  ): Promise<InstantDeletionSummary> => {
    const currentUser = auth.currentUser;
    const collectionsCleared: string[] = [];
    let deletedRecordsCount = 0;

    // 1. Delete all child records FIRST (while school doc + membership remain valid for security rules)
    const schoolCollections = [
      'students',
      'results',
      'teams',
      'practical_assessments',
      'composite_evaluations',
      'interventions',
      'workloads'
    ];

    for (const colName of schoolCollections) {
      const count = await deleteMatchingDocs(colName, 'schoolId', schoolId);
      if (count > 0) {
        deletedRecordsCount += count;
        collectionsCleared.push(colName);
      }
    }

    // Also delete Sports Day doc for this school if present
    try {
      const sdRef = doc(db, 'sportsDays', schoolId);
      const sdSnap = await getDoc(sdRef);
      if (sdSnap.exists()) {
        await deleteDoc(sdRef);
        deletedRecordsCount += 1;
        collectionsCleared.push('sportsDays');
      }
    } catch (err) {
      console.warn('Could not delete sportsDays doc:', err);
    }

    // Clear any historical deletion requests for this school
    await deleteMatchingDocs('deletion_requests', 'schoolId', schoolId);

    // 2. Log sanitized completion audit entry before deleting membership/account
    await privacyAuditService.recordEvent('deletion_completed', schoolId, {
      deletedRecordsCount,
      collectionsCount: collectionsCleared.length,
      deleteSchoolRecord: Boolean(options?.deleteSchoolRecord || options?.deleteCurrentUserAccount),
      reason: options?.reason || 'Immediate self-service or admin deletion'
    });

    // 3. If deleting the whole school record or closing account
    if (options?.deleteSchoolRecord || options?.deleteCurrentUserAccount) {
      const membersDeleted = await deleteMatchingDocs('schoolMembers', 'schoolId', schoolId);
      if (membersDeleted > 0) {
        deletedRecordsCount += membersDeleted;
        collectionsCleared.push('schoolMembers');
      }

      try {
        const schoolRef = doc(db, 'schools', schoolId);
        const schoolSnap = await getDoc(schoolRef);
        if (schoolSnap.exists()) {
          await deleteDoc(schoolRef);
          deletedRecordsCount += 1;
          collectionsCleared.push('schools');
        }
      } catch (err) {
        console.warn('Could not delete school document:', err);
      }
    }

    // 4. Clear browser offline caches so no deleted student data lingers on device
    try {
      offlineCacheService.clearSensitiveCacheOnLogout();
      localStorage.removeItem('smartpe_practical_assessments');
      localStorage.removeItem('smartpe_pending_student_sync');
      localStorage.removeItem(`smartpe_dpa_${schoolId}`);
      localStorage.removeItem(`smartpe_deletion_req_${schoolId}`);
    } catch (e) {}

    // 5. If closing current user's account completely
    let authAccountDeleted = false;
    let requiresRecentLogin = false;

    if (options?.deleteCurrentUserAccount && currentUser) {
      try {
        await deleteDoc(doc(db, 'users', currentUser.uid));
        deletedRecordsCount += 1;
        collectionsCleared.push('users');
      } catch (err) {
        console.warn('Could not delete current user Firestore profile:', err);
      }

      try {
        localStorage.removeItem('smartpe_active_workspace');
        await deleteUser(currentUser);
        authAccountDeleted = true;
      } catch (authErr: any) {
        if (authErr?.code === 'auth/requires-recent-login') {
          requiresRecentLogin = true;
        } else {
          console.warn('Auth user deletion note:', authErr);
        }
        try {
          await signOut(auth);
        } catch (e) {}
      }
    }

    return {
      deletedRecordsCount,
      authAccountDeleted,
      requiresRecentLogin,
      collectionsCleared
    };
  },

  /**
   * Allows any individual educator/coach to delete their own profile, personal workspace data, and account anytime.
   */
  deletePersonalAccountData: async (reason?: string): Promise<InstantDeletionSummary> => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('No authenticated user found.');
    }

    const uid = currentUser.uid;
    const personalSchoolId = `personal_${uid}`;
    const collectionsCleared: string[] = [];
    let deletedRecordsCount = 0;

    // Delete personal-workspace and teacher-owned documents while auth is active
    const ownerCols = [
      'students',
      'results',
      'teams',
      'practical_assessments',
      'composite_evaluations',
      'interventions',
      'workloads'
    ];

    for (const colName of ownerCols) {
      const c1 = await deleteMatchingDocs(colName, 'schoolId', personalSchoolId);
      const c2 = await deleteMatchingDocs(colName, 'teacherId', uid);
      if (c1 + c2 > 0) {
        deletedRecordsCount += c1 + c2;
        collectionsCleared.push(colName);
      }
    }

    await privacyAuditService.recordEvent('deletion_completed', personalSchoolId, {
      deletedRecordsCount,
      scope: 'personal_account_closure',
      reason: reason || 'User chose to discontinue using platform'
    });

    // Delete schoolMembers/{uid} and users/{uid}
    try {
      const memRef = doc(db, 'schoolMembers', uid);
      if ((await getDoc(memRef)).exists()) {
        await deleteDoc(memRef);
        deletedRecordsCount += 1;
        collectionsCleared.push('schoolMembers');
      }
    } catch (err) {
      console.warn('Could not delete schoolMembers doc:', err);
    }

    try {
      const userRef = doc(db, 'users', uid);
      if ((await getDoc(userRef)).exists()) {
        await deleteDoc(userRef);
        deletedRecordsCount += 1;
        collectionsCleared.push('users');
      }
    } catch (err) {
      console.warn('Could not delete users doc:', err);
    }

    try {
      offlineCacheService.clearSensitiveCacheOnLogout();
      localStorage.removeItem('smartpe_practical_assessments');
      localStorage.removeItem('smartpe_pending_student_sync');
      localStorage.removeItem('smartpe_active_workspace');
    } catch (e) {}

    let authAccountDeleted = false;
    let requiresRecentLogin = false;

    try {
      await deleteUser(currentUser);
      authAccountDeleted = true;
    } catch (authErr: any) {
      if (authErr?.code === 'auth/requires-recent-login') {
        requiresRecentLogin = true;
      }
      try {
        await signOut(auth);
      } catch (e) {}
    }

    return {
      deletedRecordsCount,
      authAccountDeleted,
      requiresRecentLogin,
      collectionsCleared
    };
  },

  /**
   * Direct Admin / Super Admin privilege: Delete an Academy program & all its athletes/assessments immediately.
   */
  deleteAcademyProgramData: async (programId: string): Promise<InstantDeletionSummary> => {
    const collectionsCleared: string[] = [];
    let deletedRecordsCount = 0;

    // Delete athletes & assessments FIRST while academy doc exists
    const athCount = await deleteMatchingDocs('academic_athletes', 'programId', programId);
    if (athCount > 0) {
      deletedRecordsCount += athCount;
      collectionsCleared.push('academic_athletes');
    }

    const assCount = await deleteMatchingDocs('academic_assessments', 'programId', programId);
    if (assCount > 0) {
      deletedRecordsCount += assCount;
      collectionsCleared.push('academic_assessments');
    }

    await privacyAuditService.recordEvent('deletion_completed', programId, {
      deletedRecordsCount,
      scope: 'academy_program_deleted'
    });

    try {
      const progRef = doc(db, 'academic_programs', programId);
      if ((await getDoc(progRef)).exists()) {
        await deleteDoc(progRef);
        deletedRecordsCount += 1;
        collectionsCleared.push('academic_programs');
      }
    } catch (err) {
      console.warn('Could not delete academic_program doc:', err);
    }

    try {
      localStorage.removeItem('smartpe_academic_program');
    } catch (e) {}

    return {
      deletedRecordsCount,
      authAccountDeleted: false,
      collectionsCleared
    };
  },

  /**
   * Super Admin Direct Delete Privilege: Immediately remove any user's profile, membership, activity logs,
   * and optionally their personal/school/academy records — no approval request needed.
   */
  superAdminDeleteUserAndData: async (target: {
    uid: string;
    email?: string;
    schoolId?: string;
    academyId?: string;
    role?: string;
    deleteOwnedWorkspace?: boolean;
  }): Promise<InstantDeletionSummary> => {
    const collectionsCleared: string[] = [];
    let deletedRecordsCount = 0;

    // 1. Delete teacher-authored & personal records if requested
    if (target.deleteOwnedWorkspace) {
      const targetPersonalId = `personal_${target.uid}`;
      const cols = [
        'students',
        'results',
        'teams',
        'practical_assessments',
        'composite_evaluations',
        'interventions',
        'workloads'
      ];
      for (const colName of cols) {
        const c1 = await deleteMatchingDocs(colName, 'teacherId', target.uid);
        const c2 = await deleteMatchingDocs(colName, 'schoolId', targetPersonalId);
        if (c1 + c2 > 0) {
          deletedRecordsCount += c1 + c2;
          collectionsCleared.push(colName);
        }
      }

      if (target.schoolId && target.role === 'admin' && !target.schoolId.startsWith('personal_')) {
        const schoolRes = await privacyAuditService.deleteSchoolWorkspaceData(target.schoolId, {
          deleteSchoolRecord: true,
          deleteCurrentUserAccount: false,
          reason: 'Super Admin direct workspace deletion'
        });
        deletedRecordsCount += schoolRes.deletedRecordsCount;
        schoolRes.collectionsCleared.forEach((c) => {
          if (!collectionsCleared.includes(c)) collectionsCleared.push(c);
        });
      }

      if (target.academyId) {
        const acadRes = await privacyAuditService.deleteAcademyProgramData(target.academyId);
        deletedRecordsCount += acadRes.deletedRecordsCount;
        acadRes.collectionsCleared.forEach((c) => {
          if (!collectionsCleared.includes(c)) collectionsCleared.push(c);
        });
      }
    }

    // 2. Delete schoolMembers/{uid}, users/{uid}, and login_activity for uid
    try {
      const memRef = doc(db, 'schoolMembers', target.uid);
      if ((await getDoc(memRef)).exists()) {
        await deleteDoc(memRef);
        deletedRecordsCount += 1;
        collectionsCleared.push('schoolMembers');
      }
    } catch (e) {}

    try {
      const userRef = doc(db, 'users', target.uid);
      if ((await getDoc(userRef)).exists()) {
        await deleteDoc(userRef);
        deletedRecordsCount += 1;
        collectionsCleared.push('users');
      }
    } catch (e) {}

    const logCount = await deleteMatchingDocs('login_activity', 'uid', target.uid);
    if (logCount > 0) {
      deletedRecordsCount += logCount;
      collectionsCleared.push('login_activity');
    }

    await privacyAuditService.recordEvent('deletion_completed', target.schoolId || 'super_admin', {
      targetUid: target.uid,
      deletedRecordsCount,
      scope: 'super_admin_direct_delete'
    });

    return {
      deletedRecordsCount,
      authAccountDeleted: false,
      collectionsCleared
    };
  },

  /**
   * Submits a formal School Data Deletion Request (kept for backward compatibility if needed)
   */
  submitDeletionRequest: async (
    schoolId: string,
    schoolName: string,
    reason?: string
  ): Promise<DeletionRequest> => {
    const user = auth.currentUser;
    const nowIso = new Date().toISOString();

    const requestData: DeletionRequest = {
      schoolId,
      schoolName: schoolName || 'School Workspace',
      requestedByUid: user?.uid || '',
      requestedByEmail: user?.email || '',
      requestedAt: nowIso,
      reason: reason || 'Administrative School Workspace Deletion',
      status: 'pending_verification',
      notes: 'Deletion recorded via School Admin Data & Privacy Settings.'
    };

    try {
      const ref = await addDoc(collection(db, 'deletion_requests'), requestData);
      requestData.id = ref.id;

      await privacyAuditService.recordEvent('deletion_requested', schoolId, {
        schoolName,
        requestedBy: user?.email,
        requestId: ref.id
      });
    } catch (err) {
      console.warn('Error saving deletion request in Firestore:', err);
    }

    localStorage.setItem(`smartpe_deletion_req_${schoolId}`, JSON.stringify(requestData));
    return requestData;
  },

  /**
   * Gets any active deletion request for a school
   */
  getActiveDeletionRequest: async (schoolId: string): Promise<DeletionRequest | null> => {
    try {
      if (!schoolId) return null;
      const q = query(
        collection(db, 'deletion_requests'),
        where('schoolId', '==', schoolId),
        where('status', 'in', ['pending_verification', 'in_review'])
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        const docSnap = snap.docs[0];
        return { id: docSnap.id, ...docSnap.data() } as DeletionRequest;
      }
      const local = localStorage.getItem(`smartpe_deletion_req_${schoolId}`);
      if (local) {
        return JSON.parse(local);
      }
    } catch (err) {
      console.warn('Error checking active deletion request:', err);
    }
    return null;
  }
};
