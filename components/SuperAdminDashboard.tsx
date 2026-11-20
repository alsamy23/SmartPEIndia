import React, { useState, useEffect, useMemo } from 'react';
import {
  Shield,
  Building,
  Users,
  Trophy,
  Download,
  MessageSquareHeart,
  RefreshCw,
  Search,
  ChevronDown,
  ChevronUp,
  Clock,
  Mail,
  Trash2,
  Loader2,
  CheckCircle2,
  Star,
  Sparkles,
  BookOpen,
  FileText,
  Activity,
  ShieldCheck,
  Copy,
  X,
  BarChart3
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { auth } from '../services/firebase.ts';
import { isBrandSuperAdmin } from '../types.ts';
import {
  fetchSuperAdminOverview,
  SuperAdminOverviewData,
  TeacherFeedbackRecord,
  updateTeacherFeedbackStatus,
  deleteTeacherFeedback
} from '../services/superAdminService.ts';
import { userActivityService, LoginActivityRecord } from '../services/userActivityService.ts';
import { privacyAuditService } from '../services/privacyAuditService.ts';
import { toast } from '../services/toast.ts';
import { downloadCsvFile, safeCopyToClipboard } from '../utils/safeBrowser.ts';

type SuperAdminTab = 'overview' | 'schools' | 'coaching' | 'users' | 'feedback';

interface SuperAdminDashboardProps {
  onNavigate?: (tab: any) => void;
}

export const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState<SuperAdminTab>('overview');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<SuperAdminOverviewData>({
    schoolsWithTeachers: [],
    unassignedTeachers: [],
    totalAssignedTeachers: 0,
    registeredUsers: [],
    academicPrograms: [],
    totalAcademyCoaches: 0,
    usageEvents: [],
    feedbackList: []
  });
  const [recentLogins, setRecentLogins] = useState<LoginActivityRecord[]>([]);

  // Filters & Expand States
  const [schoolSearch, setSchoolSearch] = useState('');
  const [expandedSchoolIds, setExpandedSchoolIds] = useState<Record<string, boolean>>({});
  const [userSearch, setUserSearch] = useState('');
  const [userFilter, setUserFilter] = useState<'all' | 'school' | 'academy' | 'active7d'>('all');
  const [feedbackFilter, setFeedbackFilter] = useState<'all' | 'new' | 'reviewed' | 'resolved'>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [updatingFeedbackId, setUpdatingFeedbackId] = useState<string | null>(null);

  const isSuperAdmin = isBrandSuperAdmin(auth.currentUser?.email);

  const loadData = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const overview = await fetchSuperAdminOverview();
      setData(overview);
      if (isManualRefresh) {
        toast.success('Super Admin dashboard refreshed!');
      }
    } catch (err: any) {
      console.error('Failed to load Super Admin overview:', err);
      toast.error(err?.message || 'Unable to load platform overview.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!isSuperAdmin) {
      setLoading(false);
      return;
    }
    loadData(false);
    const unsub = userActivityService.subscribeToRecentLogins(60, (records) => {
      setRecentLogins(records);
    });
    return () => unsub();
  }, [isSuperAdmin]);

  // Derived analytics (Zero student data!)
  const stats = useMemo(() => {
    const now = Date.now();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    const oneDayMs = 24 * 60 * 60 * 1000;

    let active7d = 0;
    let active24h = 0;
    let totalVisits = 0;

    data.registeredUsers.forEach((u) => {
      totalVisits += Number(u.loginCount || 1);
      const last = u.lastActiveAt || u.lastLoginAt;
      if (last) {
        const diff = now - new Date(last).getTime();
        if (!isNaN(diff)) {
          if (diff <= sevenDaysMs) active7d++;
          if (diff <= oneDayMs) active24h++;
        }
      }
    });

    const downloadEvents = data.usageEvents.filter((e) => e.eventType === 'resource_downloaded');
    const lessonEvents = data.usageEvents.filter((e) =>
      `${e.featureName} ${e.category || ''}`.toLowerCase().includes('lesson') ||
      `${e.featureName} ${e.category || ''}`.toLowerCase().includes('planner')
    );
    const coachingEvents = data.usageEvents.filter((e) =>
      `${e.featureName} ${e.category || ''}`.toLowerCase().includes('coaching') ||
      e.workspaceType === 'academy'
    );

    const featureMap = new Map<string, { name: string; uses: number; downloads: number; total: number }>();
    data.usageEvents.forEach((e) => {
      const label = e.category || e.featureName || 'Other Tool';
      const entry = featureMap.get(label) || { name: label, uses: 0, downloads: 0, total: 0 };
      if (e.eventType === 'resource_downloaded') entry.downloads++;
      else entry.uses++;
      entry.total++;
      featureMap.set(label, entry);
    });

    const featureChartData = Array.from(featureMap.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);

    const userUsageCountMap = new Map<string, { actions: number; downloads: number }>();
    data.usageEvents.forEach((e) => {
      if (!e.uid) return;
      const cur = userUsageCountMap.get(e.uid) || { actions: 0, downloads: 0 };
      cur.actions++;
      if (e.eventType === 'resource_downloaded') cur.downloads++;
      userUsageCountMap.set(e.uid, cur);
    });

    const newFeedbackCount = data.feedbackList.filter((f) => f.status === 'new').length;

    return {
      active7d,
      active24h,
      totalVisits,
      downloadEvents,
      lessonEventsCount: lessonEvents.length,
      coachingEventsCount: coachingEvents.length,
      featureChartData,
      userUsageCountMap,
      newFeedbackCount
    };
  }, [data]);

  const toggleSchoolExpand = (schoolId: string) => {
    setExpandedSchoolIds((prev) => ({ ...prev, [schoolId]: !prev[schoolId] }));
  };

  const handleDeleteSchool = (school: any) => {
    toast.confirm(
      `Permanently delete school "${school.name}" and its workspace data?`,
      async () => {
        setDeletingId(school.id);
        try {
          const res = await privacyAuditService.deleteSchoolWorkspaceData(school.id, {
            deleteSchoolRecord: true,
            deleteCurrentUserAccount: false,
            reason: 'Super Admin oversight deletion'
          });
          setData((prev) => ({
            ...prev,
            schoolsWithTeachers: prev.schoolsWithTeachers.filter((s) => s.school.id !== school.id)
          }));
          toast.success(`Deleted "${school.name}" (${res.deletedRecordsCount} records cleared).`);
        } catch (err) {
          toast.error('Failed to delete school workspace.');
        } finally {
          setDeletingId(null);
        }
      }
    );
  };

  const handleDeleteAcademy = (prog: any) => {
    toast.confirm(
      `Permanently delete coaching academy "${prog.programName}"?`,
      async () => {
        setDeletingId(prog.id);
        try {
          const res = await privacyAuditService.deleteAcademyProgramData(prog.id);
          setData((prev) => ({
            ...prev,
            academicPrograms: prev.academicPrograms.filter((p) => p.id !== prog.id)
          }));
          toast.success(`Deleted "${prog.programName}" (${res.deletedRecordsCount} records cleared).`);
        } catch (err) {
          toast.error('Failed to delete coaching academy.');
        } finally {
          setDeletingId(null);
        }
      }
    );
  };

  const handleDeleteUser = (targetUser: any) => {
    if (targetUser.email?.toLowerCase() === auth.currentUser?.email?.toLowerCase()) {
      toast.error('Cannot delete your own active Super Admin account.');
      return;
    }
    const label = targetUser.displayName || targetUser.email || targetUser.uid;
    toast.confirm(
      `Permanently delete user "${label}" and their owned workspace data?`,
      async () => {
        setDeletingId(targetUser.uid);
        try {
          const summary = await privacyAuditService.superAdminDeleteUserAndData({
            uid: targetUser.uid,
            email: targetUser.email,
            schoolId: targetUser.schoolId,
            academyId: targetUser.academyId,
            role: targetUser.role,
            deleteOwnedWorkspace: true
          });
          setData((prev) => ({
            ...prev,
            registeredUsers: prev.registeredUsers.filter((u) => u.uid !== targetUser.uid)
          }));
          toast.success(`Removed user & ${summary.deletedRecordsCount} records.`);
        } catch (err) {
          toast.error('Failed to delete user.');
        } finally {
          setDeletingId(null);
        }
      }
    );
  };

  const handleFeedbackStatus = async (fb: TeacherFeedbackRecord, nextStatus: 'new' | 'reviewed' | 'resolved') => {
    if (fb.source === 'support_log') {
      toast.info('Contact support logs are archived automatically.');
      return;
    }
    setUpdatingFeedbackId(fb.id);
    try {
      await updateTeacherFeedbackStatus(fb, nextStatus);
      setData((prev) => ({
        ...prev,
        feedbackList: prev.feedbackList.map((item) =>
          item.id === fb.id ? { ...item, status: nextStatus, updatedAt: new Date().toISOString() } : item
        )
      }));
      toast.success(`Marked feedback as ${nextStatus}.`);
    } catch (err) {
      toast.error('Could not update feedback status.');
    } finally {
      setUpdatingFeedbackId(null);
    }
  };

  const handleDeleteFeedback = (fb: TeacherFeedbackRecord) => {
    if (fb.source === 'support_log') return;
    toast.confirm('Delete this teacher feedback entry?', async () => {
      setUpdatingFeedbackId(fb.id);
      try {
        await deleteTeacherFeedback(fb.id);
        setData((prev) => ({
          ...prev,
          feedbackList: prev.feedbackList.filter((item) => item.id !== fb.id)
        }));
        toast.success('Feedback entry deleted.');
      } catch (err) {
        toast.error('Failed to delete feedback.');
      } finally {
        setUpdatingFeedbackId(null);
      }
    });
  };

  const handleExportSummaryCsv = () => {
    const headers = ['School Name', 'School ID', 'Assigned Teachers', 'Admins', 'Teachers', 'Timetables', 'Created At'];
    const rows = data.schoolsWithTeachers.map((entry) => [
      entry.school.name || 'School',
      entry.school.id,
      entry.assignedTeachers.length,
      entry.adminCount,
      entry.teacherCount,
      entry.workloadsCount,
      entry.school.createdAt || ''
    ]);
    downloadCsvFile(`smartpe_schools_teachers_summary_${new Date().toISOString().split('T')[0]}.csv`, headers, rows);
    toast.success('Schools & assigned teachers report exported (zero student data).');
  };

  if (!isSuperAdmin) {
    return (
      <div className="p-16 text-center space-y-4">
        <Shield size={42} className="mx-auto text-rose-500" />
        <h2 className="text-2xl font-black text-slate-900 uppercase">Super Admin Access Only</h2>
        <p className="text-sm text-slate-500">This command center is restricted to verified platform administrators.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="animate-spin text-indigo-600" size={44} />
        <p className="text-xs font-black uppercase tracking-widest text-slate-500">
          Loading Super Admin Overview...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20 animate-in fade-in">
      {/* Top Dark Command Header */}
      <div className="bg-gradient-to-br from-slate-950 via-[#0D2B52] to-slate-900 text-white p-6 sm:p-8 rounded-[2.5rem] border-2 border-slate-900 shadow-xl space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/15 border border-emerald-400/40 text-emerald-300 rounded-full text-[10px] font-black uppercase tracking-widest">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Super Admin Command Center</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 border border-white/15 text-slate-200 rounded-full text-[10px] font-bold">
                <ShieldCheck size={12} className="text-emerald-300" />
                <span>Teacher &amp; School View Only (Student Data Hidden)</span>
              </span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black uppercase tracking-tight">
              SmartPE Platform Dashboard
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm max-w-2xl">
              Monitor registered schools, assigned teachers, active app users, lesson &amp; coaching downloads, and teacher feedback in one place.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => loadData(true)}
              disabled={refreshing}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer"
            >
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
            <button
              type="button"
              onClick={handleExportSummaryCsv}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-md transition-all cursor-pointer"
            >
              <Download size={14} />
              <span>Export School Report</span>
            </button>
            {onNavigate && (
              <button
                type="button"
                onClick={() => onNavigate('school-admin')}
                className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-md transition-all cursor-pointer"
              >
                <Shield size={14} />
                <span>School Settings</span>
              </button>
            )}
          </div>
        </div>

        {/* 6 KPI Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-4 border-t border-white/10">
          <button
            type="button"
            onClick={() => setActiveTab('schools')}
            className="text-left bg-white/5 hover:bg-white/10 border border-white/10 p-4 rounded-2xl transition-all cursor-pointer"
          >
            <div className="flex items-center justify-between text-indigo-300">
              <span className="text-[10px] font-black uppercase tracking-wider">Schools</span>
              <Building size={15} />
            </div>
            <div className="text-2xl font-black mt-1">{data.schoolsWithTeachers.length}</div>
            <div className="text-[10px] text-slate-300 font-semibold mt-0.5">Registered Institutions</div>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('schools')}
            className="text-left bg-white/5 hover:bg-white/10 border border-white/10 p-4 rounded-2xl transition-all cursor-pointer"
          >
            <div className="flex items-center justify-between text-emerald-300">
              <span className="text-[10px] font-black uppercase tracking-wider">Assigned Staff</span>
              <Users size={15} />
            </div>
            <div className="text-2xl font-black mt-1">{data.totalAssignedTeachers}</div>
            <div className="text-[10px] text-slate-300 font-semibold mt-0.5">Teachers in Schools</div>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('users')}
            className="text-left bg-white/5 hover:bg-white/10 border border-white/10 p-4 rounded-2xl transition-all cursor-pointer"
          >
            <div className="flex items-center justify-between text-sky-300">
              <span className="text-[10px] font-black uppercase tracking-wider">App Users</span>
              <Activity size={15} />
            </div>
            <div className="text-2xl font-black mt-1">{data.registeredUsers.length}</div>
            <div className="text-[10px] text-emerald-300 font-bold mt-0.5">
              {stats.active7d} active last 7d
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('coaching')}
            className="text-left bg-white/5 hover:bg-white/10 border border-white/10 p-4 rounded-2xl transition-all cursor-pointer"
          >
            <div className="flex items-center justify-between text-amber-300">
              <span className="text-[10px] font-black uppercase tracking-wider">Coaching</span>
              <Trophy size={15} />
            </div>
            <div className="text-2xl font-black mt-1">{data.academicPrograms.length}</div>
            <div className="text-[10px] text-slate-300 font-semibold mt-0.5">
              {data.totalAcademyCoaches} coaches assigned
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className="text-left bg-white/5 hover:bg-white/10 border border-white/10 p-4 rounded-2xl transition-all cursor-pointer"
          >
            <div className="flex items-center justify-between text-purple-300">
              <span className="text-[10px] font-black uppercase tracking-wider">Downloads</span>
              <Download size={15} />
            </div>
            <div className="text-2xl font-black mt-1">{stats.downloadEvents.length}</div>
            <div className="text-[10px] text-slate-300 font-semibold mt-0.5">
              {data.usageEvents.length} total tool actions
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('feedback')}
            className="text-left bg-white/5 hover:bg-white/10 border border-white/10 p-4 rounded-2xl transition-all cursor-pointer"
          >
            <div className="flex items-center justify-between text-rose-300">
              <span className="text-[10px] font-black uppercase tracking-wider">Feedback</span>
              <MessageSquareHeart size={15} />
            </div>
            <div className="text-2xl font-black mt-1">{data.feedbackList.length}</div>
            <div className="text-[10px] text-amber-300 font-bold mt-0.5">
              {stats.newFeedbackCount} new unread
            </div>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 bg-white p-2 rounded-2xl border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
        {[
          { id: 'overview', label: 'App Usage & Downloads', icon: BarChart3 },
          { id: 'schools', label: `Schools & Assigned Teachers (${data.schoolsWithTeachers.length})`, icon: Building },
          { id: 'coaching', label: `Coaching & Academies (${data.academicPrograms.length})`, icon: Trophy },
          { id: 'users', label: `All Users (${data.registeredUsers.length})`, icon: Users },
          { id: 'feedback', label: `Teacher Feedback (${data.feedbackList.length})`, icon: MessageSquareHeart }
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as SuperAdminTab)}
              className={`flex-1 min-w-[160px] py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                active ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Icon size={15} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW, APP USAGE & DOWNLOADS */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Feature & Download Breakdown */}
            <div className="lg:col-span-7 bg-white border-2 border-slate-900 rounded-[2rem] p-6 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                    <Sparkles size={18} className="text-indigo-600" />
                    <span>Tool Usage &amp; Lesson / Coaching Activity</span>
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Tracks which tools teachers open and download most (Lesson Plans, Coaching, Question Papers, Planners).
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-xs font-black text-indigo-700">{stats.lessonEventsCount} Lesson Actions</div>
                  <div className="text-[11px] font-bold text-amber-700">{stats.coachingEventsCount} Coaching Actions</div>
                </div>
              </div>

              {stats.featureChartData.length === 0 ? (
                <div className="p-10 text-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl text-slate-500 text-xs font-bold">
                  Live usage tracking is active. As teachers open tools or download PDFs/Word/Excel files, counts appear here automatically.
                </div>
              ) : (
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.featureChartData} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 700 }} interval={0} angle={-15} textAnchor="end" height={50} />
                      <YAxis tick={{ fontSize: 11, fontWeight: 700 }} allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="uses" name="Tool Opens / Views" fill="#4f46e5" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="downloads" name="Downloads (PDF/Word/Excel)" fill="#10b981" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Live Sign-In Feed */}
            <div className="lg:col-span-5 bg-white border-2 border-slate-900 rounded-[2rem] p-6 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                  <span>Live Teacher Logins</span>
                </h3>
                <span className="text-[11px] font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                  {stats.active24h} active today
                </span>
              </div>

              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {recentLogins.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-8 font-bold">No recent logins captured yet.</p>
                ) : (
                  recentLogins.slice(0, 15).map((entry, idx) => (
                    <div
                      key={entry.id || idx}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <div className="font-black text-xs text-slate-900 truncate">
                          {entry.displayName || 'Educator'}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate">
                          {entry.schoolName || 'Partner School'} • {entry.workspaceType === 'academy' ? 'Coaching' : 'School PE'}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-[10px] font-black text-emerald-700">
                          {entry.timestamp ? new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'}
                        </div>
                        <div className="text-[9px] text-slate-400">
                          {entry.timestamp ? new Date(entry.timestamp).toLocaleDateString() : ''}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Recent Lesson & Coaching Downloads Feed */}
          <div className="bg-white border-2 border-slate-900 rounded-[2rem] p-6 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                  <Download size={18} className="text-emerald-600" />
                  <span>Recent Downloads &amp; Generated Resources</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Shows which teacher downloaded lesson plans, question papers, yearly plans, or coaching reports (no student details shown).
                </p>
              </div>
              <span className="text-xs font-black text-slate-600 bg-slate-100 px-3 py-1 rounded-xl">
                {stats.downloadEvents.length} Downloads Logged
              </span>
            </div>

            {data.usageEvents.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-xs font-bold text-slate-500">
                No tool usage or download events logged yet.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-wider">
                      <th className="p-3.5">Teacher</th>
                      <th className="p-3.5">School / Club</th>
                      <th className="p-3.5">Action</th>
                      <th className="p-3.5">Resource / Tool</th>
                      <th className="p-3.5">Format</th>
                      <th className="p-3.5">When</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                    {data.usageEvents.slice(0, 40).map((evt) => (
                      <tr key={evt.id} className="hover:bg-slate-50">
                        <td className="p-3.5">
                          <div className="font-black text-slate-900">{evt.userName || 'Teacher'}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{evt.userEmail || '—'}</div>
                        </td>
                        <td className="p-3.5">{evt.schoolName || 'School'}</td>
                        <td className="p-3.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                            evt.eventType === 'resource_downloaded'
                              ? 'bg-emerald-100 text-emerald-800'
                              : evt.eventType === 'resource_shared'
                              ? 'bg-sky-100 text-sky-800'
                              : 'bg-indigo-100 text-indigo-800'
                          }`}>
                            {evt.eventType === 'resource_downloaded'
                              ? 'Downloaded'
                              : evt.eventType === 'resource_shared'
                              ? 'Shared'
                              : evt.eventType === 'resource_viewed'
                              ? 'Generated'
                              : 'Opened'}
                          </span>
                        </td>
                        <td className="p-3.5 font-bold text-slate-900">
                          {evt.featureName}
                          {evt.category && evt.category !== evt.featureName && (
                            <span className="ml-1.5 text-[10px] text-slate-400">({evt.category})</span>
                          )}
                        </td>
                        <td className="p-3.5 text-[11px] font-mono text-slate-500">{evt.format || 'Web'}</td>
                        <td className="p-3.5 text-[11px] text-slate-500 whitespace-nowrap">
                          {evt.timestamp ? new Date(evt.timestamp).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: REGISTERED SCHOOLS & ASSIGNED TEACHERS */}
      {activeTab === 'schools' && (
        <div className="space-y-6">
          <div className="bg-white border-2 border-slate-900 p-6 rounded-[2rem] shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                  Registered Schools &amp; Assigned Teachers ({data.schoolsWithTeachers.length})
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Click any school to inspect how many teachers are assigned, their roles, and last login activity.
                </p>
              </div>
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  value={schoolSearch}
                  onChange={(e) => setSchoolSearch(e.target.value)}
                  placeholder="Search school name or teacher email..."
                  className="w-full pl-10 pr-8 py-2.5 bg-slate-50 border-2 border-slate-200 focus:border-indigo-600 rounded-xl text-xs font-bold outline-none"
                />
                {schoolSearch && (
                  <button
                    type="button"
                    onClick={() => setSchoolSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            {data.schoolsWithTeachers.length === 0 ? (
              <div className="p-12 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 font-bold text-sm">
                No schools registered yet.
              </div>
            ) : (
              <div className="space-y-4">
                {data.schoolsWithTeachers
                  .filter((entry) => {
                    if (!schoolSearch.trim()) return true;
                    const q = schoolSearch.toLowerCase();
                    if ((entry.school.name || '').toLowerCase().includes(q)) return true;
                    return entry.assignedTeachers.some(
                      (t) =>
                        (t.displayName || '').toLowerCase().includes(q) ||
                        (t.email || '').toLowerCase().includes(q)
                    );
                  })
                  .map((entry) => {
                    const isExpanded = !!expandedSchoolIds[entry.school.id];
                    return (
                      <div
                        key={entry.school.id}
                        className="border-2 border-slate-200 hover:border-slate-900 rounded-2xl overflow-hidden transition-all bg-slate-50/70"
                      >
                        <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="font-black text-base text-slate-900">
                                {entry.school.name || 'Partner School'}
                              </h4>
                              <span className="px-2.5 py-0.5 bg-indigo-100 text-indigo-800 rounded-lg text-[10px] font-black uppercase">
                                {entry.assignedTeachers.length} {entry.assignedTeachers.length === 1 ? 'Teacher' : 'Teachers'} Assigned
                              </span>
                              <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-lg text-[10px] font-black uppercase">
                                {entry.adminCount} Admin • {entry.teacherCount} Staff
                              </span>
                              {entry.workloadsCount > 0 && (
                                <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 rounded-lg text-[10px] font-black uppercase">
                                  {entry.workloadsCount} Timetables
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono">
                              School ID: {entry.school.id} • Created:{' '}
                              {entry.school.createdAt ? new Date(entry.school.createdAt).toLocaleDateString() : '—'}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => toggleSchoolExpand(entry.school.id)}
                              className="px-3.5 py-2 bg-white hover:bg-indigo-50 border border-slate-300 rounded-xl text-xs font-black text-slate-800 flex items-center gap-1.5 cursor-pointer"
                            >
                              {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                              <span>{isExpanded ? 'Hide Teachers' : 'View Teachers'}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteSchool(entry.school)}
                              disabled={deletingId === entry.school.id}
                              className="px-3 py-2 bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white border border-rose-200 rounded-xl text-xs font-black flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-40"
                            >
                              {deletingId === entry.school.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                              <span>Delete</span>
                            </button>
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="border-t border-slate-200 bg-white p-4">
                            {entry.assignedTeachers.length === 0 ? (
                              <p className="text-xs text-slate-400 font-bold text-center py-4">
                                No staff members assigned under this school ID yet.
                              </p>
                            ) : (
                              <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse text-xs">
                                  <thead>
                                    <tr className="text-[10px] font-black uppercase text-slate-400 border-b border-slate-200">
                                      <th className="py-2 px-3">Teacher Name</th>
                                      <th className="py-2 px-3">Email</th>
                                      <th className="py-2 px-3">Assigned Role</th>
                                      <th className="py-2 px-3">Status</th>
                                      <th className="py-2 px-3 text-right">Contact</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                                    {entry.assignedTeachers.map((m) => (
                                      <tr key={m.uid}>
                                        <td className="py-2.5 px-3 font-black text-slate-900">
                                          {m.displayName || m.email?.split('@')[0] || 'Teacher'}
                                        </td>
                                        <td className="py-2.5 px-3 font-mono text-slate-600">{m.email || '—'}</td>
                                        <td className="py-2.5 px-3">
                                          <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                                            m.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-slate-100 text-slate-700'
                                          }`}>
                                            {m.role || 'teacher'}
                                          </span>
                                        </td>
                                        <td className="py-2.5 px-3 text-[11px]">
                                          {String(m.uid).startsWith('pending_') ? (
                                            <span className="text-amber-600 font-bold">Invited (Pending Sign-In)</span>
                                          ) : (
                                            <span className="text-emerald-600 font-bold">Active Member</span>
                                          )}
                                        </td>
                                        <td className="py-2.5 px-3 text-right">
                                          {m.email && (
                                            <a
                                              href={`mailto:${m.email}`}
                                              className="inline-flex items-center gap-1 text-indigo-600 hover:underline text-[11px] font-bold"
                                            >
                                              <Mail size={12} />
                                              <span>Email</span>
                                            </a>
                                          )}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: COACHING ACADEMIES & COACHES (ZERO ATHLETE/STUDENT DATA) */}
      {activeTab === 'coaching' && (
        <div className="bg-white border-2 border-slate-900 p-6 rounded-[2rem] shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                Coaching Academies &amp; Assigned Coaches ({data.academicPrograms.length})
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Shows registered coaching programs, head coaches, and co-coaches only. Student/athlete rosters are excluded.
              </p>
            </div>
            <div className="px-3.5 py-2 bg-amber-50 border border-amber-200 rounded-xl text-xs font-black text-amber-800">
              {stats.coachingEventsCount} Coaching Usage / Download Events
            </div>
          </div>

          {data.academicPrograms.length === 0 ? (
            <div className="p-12 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 font-bold text-sm">
              No coaching academies registered yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.academicPrograms.map((prog) => {
                const coachCount = Math.max(
                  1,
                  Array.isArray(prog.coachEmails) ? prog.coachEmails.length : 0,
                  Array.isArray(prog.teachersList) ? prog.teachersList.length : 0
                );
                return (
                  <div key={prog.id} className="p-5 bg-slate-50 border-2 border-slate-200 hover:border-slate-900 rounded-2xl space-y-3 transition-all">
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 rounded text-[10px] font-black uppercase">
                        {prog.sport || 'Multi-Sport'}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeleteAcademy(prog)}
                        disabled={deletingId === prog.id}
                        className="p-1.5 bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white border border-rose-200 rounded-lg transition-colors cursor-pointer"
                        title="Delete Academy"
                      >
                        {deletingId === prog.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                      </button>
                    </div>
                    <div>
                      <h4 className="font-black text-slate-900 text-base">{prog.programName || 'Sports Academy'}</h4>
                      <p className="text-xs text-slate-600 font-semibold mt-0.5">
                        Head Coach: {prog.headCoachName || prog.adminEmail || 'Coach'}
                      </p>
                      {prog.adminEmail && (
                        <p className="text-[11px] font-mono text-slate-500">{prog.adminEmail}</p>
                      )}
                    </div>
                    <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[11px] font-bold text-slate-600">
                      <span>{coachCount} {coachCount === 1 ? 'Coach' : 'Coaches'} Assigned</span>
                      <span className="font-mono text-[10px] text-slate-400">Code: {prog.inviteCode || '—'}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: ALL APP USERS */}
      {activeTab === 'users' && (
        <div className="bg-white border-2 border-slate-900 p-6 rounded-[2rem] shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search teacher name, email, or school/club..."
                className="w-full pl-11 pr-8 py-3 bg-slate-50 border-2 border-slate-200 focus:border-indigo-600 rounded-xl text-xs font-bold outline-none"
              />
              {userSearch && (
                <button
                  type="button"
                  onClick={() => setUserSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {[
                { id: 'all', label: `All (${data.registeredUsers.length})` },
                { id: 'school', label: 'School PE' },
                { id: 'academy', label: 'Coaching / Club' },
                { id: 'active7d', label: `Active 7d (${stats.active7d})` }
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setUserFilter(f.id as any)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider border cursor-pointer ${
                    userFilter === f.id
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border-2 border-slate-900">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-wider">
                  <th className="p-3.5">Educator / Coach</th>
                  <th className="p-3.5">Email</th>
                  <th className="p-3.5">School / Academy</th>
                  <th className="p-3.5">Role</th>
                  <th className="p-3.5">App Usage &amp; Downloads</th>
                  <th className="p-3.5">Visits</th>
                  <th className="p-3.5">Last Active</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-semibold text-slate-700 bg-white">
                {data.registeredUsers
                  .filter((u) => {
                    if (userFilter === 'school') return u.workspaceType !== 'academy';
                    if (userFilter === 'academy') return u.workspaceType === 'academy';
                    if (userFilter === 'active7d') {
                      const last = u.lastActiveAt || u.lastLoginAt;
                      return last && Date.now() - new Date(last).getTime() <= 7 * 24 * 60 * 60 * 1000;
                    }
                    return true;
                  })
                  .filter((u) => {
                    if (!userSearch.trim()) return true;
                    const q = userSearch.toLowerCase();
                    return (
                      (u.displayName || '').toLowerCase().includes(q) ||
                      (u.email || '').toLowerCase().includes(q) ||
                      (u.schoolName || u.academyName || '').toLowerCase().includes(q)
                    );
                  })
                  .map((u, idx) => {
                    const usage = stats.userUsageCountMap.get(u.uid) || { actions: 0, downloads: 0 };
                    const last = u.lastActiveAt || u.lastLoginAt;
                    return (
                      <tr key={u.uid || idx} className="hover:bg-indigo-50/40">
                        <td className="p-3.5 font-black text-slate-900">{u.displayName || 'Teacher'}</td>
                        <td className="p-3.5 font-mono text-slate-600">{u.email || '—'}</td>
                        <td className="p-3.5">{u.schoolName || u.academyName || 'Independent'}</td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-black uppercase">
                            {u.role || 'teacher'}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <span className="text-indigo-700 font-black">{usage.actions}</span> actions •{' '}
                          <span className="text-emerald-700 font-black">{usage.downloads}</span> downloads
                        </td>
                        <td className="p-3.5">{u.loginCount || 1}</td>
                        <td className="p-3.5 text-[11px] text-slate-500">
                          {last ? new Date(last).toLocaleDateString() : 'Registered'}
                        </td>
                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => safeCopyToClipboard(u.uid || '', 'Copied UID')}
                              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 cursor-pointer"
                              title="Copy UID"
                            >
                              <Copy size={13} />
                            </button>
                            {u.email && (
                              <a
                                href={`mailto:${u.email}`}
                                className="p-1.5 hover:bg-indigo-100 rounded-lg text-indigo-600"
                                title="Email Teacher"
                              >
                                <Mail size={13} />
                              </a>
                            )}
                            <button
                              type="button"
                              onClick={() => handleDeleteUser(u)}
                              disabled={deletingId === u.uid || u.email?.toLowerCase() === auth.currentUser?.email?.toLowerCase()}
                              className="p-1.5 hover:bg-rose-100 rounded-lg text-rose-600 cursor-pointer disabled:opacity-30"
                              title="Delete User"
                            >
                              {deletingId === u.uid ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: TEACHER FEEDBACK */}
      {activeTab === 'feedback' && (
        <div className="bg-white border-2 border-slate-900 p-6 rounded-[2rem] shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                Teacher Feedback &amp; Feature Requests ({data.feedbackList.length})
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Direct feedback, ratings, and suggestions submitted by PE teachers and coaches.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {(['all', 'new', 'reviewed', 'resolved'] as const).map((statusKey) => (
                <button
                  key={statusKey}
                  type="button"
                  onClick={() => setFeedbackFilter(statusKey)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase border cursor-pointer ${
                    feedbackFilter === statusKey
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {statusKey}
                </button>
              ))}
            </div>
          </div>

          {data.feedbackList.length === 0 ? (
            <div className="p-12 text-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl space-y-2">
              <MessageSquareHeart size={36} className="mx-auto text-slate-300" />
              <p className="font-black text-sm text-slate-600">No teacher feedback submitted yet.</p>
              <p className="text-xs text-slate-400">
                Teachers can submit ratings &amp; notes anytime from the &ldquo;Give Feedback&rdquo; button or Contact page.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {data.feedbackList
                .filter((fb) => feedbackFilter === 'all' || fb.status === feedbackFilter)
                .map((fb) => (
                  <div
                    key={fb.id}
                    className="p-5 bg-slate-50 border-2 border-slate-200 rounded-2xl flex flex-col md:flex-row justify-between gap-4"
                  >
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-black text-sm text-slate-900">{fb.teacherName}</span>
                        <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded text-[10px] font-black uppercase">
                          {fb.category}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                          fb.status === 'resolved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : fb.status === 'reviewed'
                            ? 'bg-sky-100 text-sky-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {fb.status}
                        </span>
                        <div className="flex items-center gap-0.5 text-amber-500">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star key={s} size={13} fill={fb.rating >= s ? 'currentColor' : 'none'} />
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-slate-700 font-semibold leading-relaxed bg-white p-3.5 rounded-xl border border-slate-200">
                        {fb.message}
                      </p>
                      <div className="text-[11px] text-slate-500 font-medium flex flex-wrap items-center gap-3">
                        <span>{fb.schoolName || 'School'}</span>
                        {fb.teacherEmail && <span className="font-mono">{fb.teacherEmail}</span>}
                        <span>
                          {fb.createdAt ? new Date(fb.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </div>
                    </div>

                    <div className="flex md:flex-col items-end justify-between gap-2 shrink-0">
                      {fb.source !== 'support_log' && (
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            disabled={updatingFeedbackId === fb.id}
                            onClick={() => handleFeedbackStatus(fb, 'reviewed')}
                            className="px-2.5 py-1.5 bg-white hover:bg-sky-50 border border-slate-300 text-sky-700 rounded-lg text-[10px] font-black uppercase cursor-pointer"
                          >
                            Reviewed
                          </button>
                          <button
                            type="button"
                            disabled={updatingFeedbackId === fb.id}
                            onClick={() => handleFeedbackStatus(fb, 'resolved')}
                            className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-black uppercase cursor-pointer"
                          >
                            Resolve
                          </button>
                          <button
                            type="button"
                            disabled={updatingFeedbackId === fb.id}
                            onClick={() => handleDeleteFeedback(fb)}
                            className="p-1.5 bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white border border-rose-200 rounded-lg cursor-pointer"
                            title="Delete Feedback"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      )}
                      {fb.teacherEmail && (
                        <a
                          href={`mailto:${fb.teacherEmail}?subject=Re: Your SmartPE Feedback (${fb.category})`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-[10px] font-black uppercase"
                        >
                          <Mail size={12} />
                          <span>Reply</span>
                        </a>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SuperAdminDashboard;
