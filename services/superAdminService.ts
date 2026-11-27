import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  limit,
  where
} from 'firebase/firestore';
import { auth, db } from './firebase.ts';
import { fitnessService, School, SchoolMember } from './fitnessService.ts';
import { LoginActivityRecord } from './userActivityService.ts';
import { isBrandSuperAdmin } from '../types.ts';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export type UsageEventType = 'tool_used' | 'resource_downloaded' | 'resource_viewed' | 'resource_shared';

export interface UsageEventRecord {
  id: string;
  uid: string;
  userEmail?: string;
  userName?: string;
  schoolName?: string;
  workspaceType?: 'school' | 'academy';
  eventType: UsageEventType;
  featureName: string;
  category?: string;
  format?: string;
  timestamp: string;
}

export interface TeacherFeedbackRecord {
  id: string;
  uid: string;
  teacherName: string;
  teacherEmail?: string;
  schoolName?: string;
  workspaceType?: 'school' | 'academy';
  category: string;
  rating: number;
  message: string;
  status: 'new' | 'reviewed' | 'resolved';
  adminNote?: string;
  createdAt: string;
  updatedAt?: string;
  source?: 'teacher_feedback' | 'support_log';
}

export interface SchoolWithTeachers {
  school: School;
  assignedTeachers: SchoolMember[];
  adminCount: number;
  teacherCount: number;
  workloadsCount: number;
}

export interface SuperAdminOverviewData {
  schoolsWithTeachers: SchoolWithTeachers[];
  unassignedTeachers: SchoolMember[];
  totalAssignedTeachers: number;
  registeredUsers: any[];
  academicPrograms: any[];
  totalAcademyCoaches: number;
  usageEvents: UsageEventRecord[];
  feedbackList: TeacherFeedbackRecord[];
  loginActivity: LoginActivityRecord[];
}

function cleanStr(val: unknown, maxLen: number): string {
  if (val === null || val === undefined) return '';
  return String(val).trim().slice(0, maxLen);
}

function makeSafeDocId(prefix: string): string {
  const rand = Math.random().toString(36).replace(/[^a-z0-9]/g, '').slice(0, 8) || 'id';
  return `${prefix}_${Date.now()}_${rand}`;
}

/**
 * Records a sanitized tool usage or download event to Firestore.
 * Strictly zero student PII is ever accepted or written.
 */
export async function recordUsageEventToFirestore(params: {
  eventType: UsageEventType;
  featureName: string;
  category?: string;
  format?: string;
}): Promise<void> {
  try {
    const user = auth.currentUser;
    if (!user || !user.uid) return;

    const featureName = cleanStr(params.featureName, 160);
    if (!featureName) return;

    const id = makeSafeDocId('evt');
    const savedWs = typeof window !== 'undefined' ? localStorage.getItem('smartpe_active_workspace') : null;
    const workspaceType: 'school' | 'academy' = savedWs === 'academy' ? 'academy' : 'school';
    const cachedSchool = typeof window !== 'undefined' ? localStorage.getItem('smartpe_school_name') : null;

    const payload: UsageEventRecord = {
      id,
      uid: user.uid,
      userEmail: cleanStr(user.email, 200),
      userName: cleanStr(user.displayName || user.email?.split('@')[0] || 'Educator', 160),
      schoolName: cleanStr(cachedSchool || (workspaceType === 'academy' ? 'Sports Academy' : 'School'), 200),
      workspaceType,
      eventType: params.eventType,
      featureName,
      timestamp: new Date().toISOString(),
      ...(params.category ? { category: cleanStr(params.category, 100) } : {}),
      ...(params.format ? { format: cleanStr(params.format, 40) } : {})
    };

    await setDoc(doc(db, 'usage_events', id), payload);
  } catch {
    // Non-fatal background usage tracking — never block teacher workflow
  }
}

/**
 * Submits educator feedback directly to Firestore teacher_feedback collection.
 */
export async function submitTeacherFeedback(input: {
  category: string;
  rating: number;
  message: string;
  teacherName?: string;
  teacherEmail?: string;
  schoolName?: string;
  workspaceType?: 'school' | 'academy';
}): Promise<TeacherFeedbackRecord> {
  const user = auth.currentUser;
  if (!user || !user.uid) {
    throw new Error('Please sign in to submit feedback.');
  }

  const cleanMessage = cleanStr(input.message, 2000);
  if (cleanMessage.length < 3) {
    throw new Error('Please enter at least 3 characters of feedback.');
  }

  const id = makeSafeDocId('fb');
  const nowIso = new Date().toISOString();
  const savedWs = typeof window !== 'undefined' ? localStorage.getItem('smartpe_active_workspace') : null;
  const cachedSchool = typeof window !== 'undefined' ? localStorage.getItem('smartpe_school_name') : null;

  const record: TeacherFeedbackRecord = {
    id,
    uid: user.uid,
    teacherName: cleanStr(input.teacherName || user.displayName || user.email?.split('@')[0] || 'PE Teacher', 120),
    teacherEmail: cleanStr(input.teacherEmail || user.email, 200),
    schoolName: cleanStr(input.schoolName || cachedSchool || 'SmartPE Educator', 200),
    workspaceType: input.workspaceType || (savedWs === 'academy' ? 'academy' : 'school'),
    category: cleanStr(input.category || 'General', 80),
    rating: Math.min(5, Math.max(1, Math.round(Number(input.rating) || 5))),
    message: cleanMessage,
    status: 'new',
    createdAt: nowIso
  };

  try {
    await setDoc(doc(db, 'teacher_feedback', id), record);
    return record;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `teacher_feedback/${id}`);
  }
}

/**
 * Super Admin: Update feedback status and optional admin note.
 */
export async function updateTeacherFeedbackStatus(
  feedback: TeacherFeedbackRecord,
  status: 'new' | 'reviewed' | 'resolved',
  adminNote?: string
): Promise<void> {
  if (!isBrandSuperAdmin(auth.currentUser?.email)) {
    throw new Error('Super Admin authorization required.');
  }
  const path = `teacher_feedback/${feedback.id}`;
  try {
    await updateDoc(doc(db, 'teacher_feedback', feedback.id), {
      status,
      updatedAt: new Date().toISOString(),
      ...(adminNote !== undefined ? { adminNote: cleanStr(adminNote, 500) } : {})
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * Super Admin: Delete a feedback record.
 */
export async function deleteTeacherFeedback(feedbackId: string): Promise<void> {
  const path = `teacher_feedback/${feedbackId}`;
  try {
    await deleteDoc(doc(db, 'teacher_feedback', feedbackId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Fetches complete Super Admin oversight dataset:
 * - Registered Schools & Assigned Teachers per school
 * - App Users & Coaching Programs (Coaches only)
 * - Tool Usage & Downloads (Lesson Plans, Coaching, Papers, Fixtures, etc.)
 * - Teacher Feedback
 *
 * Strictly NEVER reads student/athlete PII collections.
 */
export async function fetchSuperAdminOverview(): Promise<SuperAdminOverviewData> {
  if (!isBrandSuperAdmin(auth.currentUser?.email)) {
    throw new Error('Super Admin access required.');
  }

  const [
    schools,
    registeredUsers,
    academicPrograms,
    membersSnap,
    workloadsSnap,
    usageSnap,
    feedbackSnap,
    supportFeedbackSnap,
    loginActivitySnap
  ] = await Promise.all([
    fitnessService.getAllSchools(),
    fitnessService.getAllRegisteredUsers(),
    fitnessService.getAllAcademicPrograms(),
    getDocs(collection(db, 'schoolMembers')).catch(err => handleFirestoreError(err, OperationType.LIST, 'schoolMembers')),
    getDocs(collection(db, 'workloads')).catch(() => null),
    getDocs(query(collection(db, 'usage_events'), orderBy('timestamp', 'desc'), limit(500))).catch(() => null),
    getDocs(query(collection(db, 'teacher_feedback'), orderBy('createdAt', 'desc'), limit(200))).catch(() => null),
    getDocs(query(collection(db, 'system_logs'), where('category', '==', 'USER_FEEDBACK'), limit(100))).catch(() => null),
    getDocs(query(collection(db, 'login_activity'), orderBy('timestamp', 'desc'), limit(500))).catch(() => null)
  ]);

  const allMembers: SchoolMember[] = membersSnap.docs.map(d => ({
    uid: d.id,
    ...(d.data() as Omit<SchoolMember, 'uid'>)
  }));

  // Count workloads per schoolId without inspecting any student data
  const workloadCountsBySchool = new Map<string, number>();
  if (workloadsSnap) {
    workloadsSnap.docs.forEach(d => {
      const sId = d.data()?.schoolId;
      if (sId) {
        workloadCountsBySchool.set(sId, (workloadCountsBySchool.get(sId) || 0) + 1);
      }
    });
  }

  // Group assigned teachers by schoolId
  const membersBySchool = new Map<string, SchoolMember[]>();
  const schoolIdSet = new Set(schools.map(s => s.id));
  const unassignedTeachers: SchoolMember[] = [];

  allMembers.forEach(m => {
    if (m.schoolId && schoolIdSet.has(m.schoolId)) {
      const list = membersBySchool.get(m.schoolId) || [];
      list.push(m);
      membersBySchool.set(m.schoolId, list);
    } else {
      unassignedTeachers.push(m);
    }
  });

  const schoolsWithTeachers: SchoolWithTeachers[] = schools
    .map(school => {
      const assigned = membersBySchool.get(school.id) || [];
      const adminCount = assigned.filter(m => m.role === 'admin').length;
      const teacherCount = assigned.filter(m => m.role !== 'admin').length;
      return {
        school,
        assignedTeachers: assigned,
        adminCount,
        teacherCount,
        workloadsCount: workloadCountsBySchool.get(school.id) || 0
      };
    })
    .sort((a, b) => b.assignedTeachers.length - a.assignedTeachers.length);

  // Total coaches assigned across Coaching Academies
  let totalAcademyCoaches = 0;
  academicPrograms.forEach(prog => {
    const coachEmails = Array.isArray(prog.coachEmails) ? prog.coachEmails.length : 0;
    const teachersList = Array.isArray(prog.teachersList) ? prog.teachersList.length : 0;
    totalAcademyCoaches += Math.max(1, coachEmails, teachersList);
  });

  const usageEvents: UsageEventRecord[] = usageSnap
    ? usageSnap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<UsageEventRecord, 'id'>) }))
    : [];

  // Merge primary teacher_feedback + legacy USER_FEEDBACK from system_logs
  const primaryFeedback: TeacherFeedbackRecord[] = feedbackSnap
    ? feedbackSnap.docs.map(d => ({
        id: d.id,
        ...(d.data() as Omit<TeacherFeedbackRecord, 'id'>),
        source: 'teacher_feedback' as const
      }))
    : [];

  const supportFeedback: TeacherFeedbackRecord[] = supportFeedbackSnap
    ? supportFeedbackSnap.docs.map(d => {
        const data = d.data();
        const details = typeof data.details === 'string' ? (() => { try { return JSON.parse(data.details); } catch { return {}; } })() : (data.details || {});
        const ts = data.timestamp?.toDate ? data.timestamp.toDate().toISOString() : (data.timestamp || new Date().toISOString());
        return {
          id: `log_${d.id}`,
          uid: data.userId || 'guest',
          teacherName: details?.name || data.userEmail?.split('@')[0] || 'Educator',
          teacherEmail: data.userEmail || '',
          schoolName: details?.schoolName || 'Contact / Support',
          workspaceType: 'school',
          category: details?.topic || data.module || 'Support Feedback',
          rating: 5,
          message: data.message || data.title || '',
          status: 'new',
          createdAt: ts,
          source: 'support_log' as const
        };
      })
    : [];

  const feedbackList = [...primaryFeedback, ...supportFeedback].sort((a, b) =>
    (b.createdAt || '').localeCompare(a.createdAt || '')
  );

  const loginActivity: LoginActivityRecord[] = loginActivitySnap
    ? loginActivitySnap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<LoginActivityRecord, 'id'>) }))
    : [];

  return {
    schoolsWithTeachers,
    unassignedTeachers,
    totalAssignedTeachers: allMembers.length,
    registeredUsers,
    academicPrograms,
    totalAcademyCoaches,
    usageEvents,
    feedbackList,
    loginActivity
  };
}
