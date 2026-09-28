import { collection, doc, setDoc, getDoc, addDoc, getDocs, query, where, serverTimestamp } from 'firebase/firestore';
import { db, auth } from './firebase';
import { fitnessService, Student, FitnessResult, SchoolMember } from './fitnessService';

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

export const DPA_VERSION = 'v1.0 (2026.1)';

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
    const isSuper = fitnessService.isSuperAdmin();

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
        platform: 'SmartPE Digital PE Assessment Platform',
        version: '1.0'
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
   * Submits a formal School Data Deletion Request (Safe multi-step process)
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
      reason: reason || 'Administrative School Workspace Deletion Request',
      status: 'pending_verification',
      notes: 'Deletion requested via School Admin Data & Privacy Settings. Standard 14-day grace period applied for verification and backup retention.'
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
