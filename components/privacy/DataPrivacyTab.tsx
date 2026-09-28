import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  FileText, 
  Download, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle, 
  Lock, 
  Mail, 
  Printer, 
  Building, 
  ExternalLink, 
  RefreshCw, 
  Database,
  Cloud,
  Server,
  KeyRound,
  FileSpreadsheet,
  FileCode,
  Check,
  AlertCircle
} from 'lucide-react';
import { auth } from '../../services/firebase';
import { toast } from '../../services/toast';
import { 
  privacyAuditService, 
  DPAStatus, 
  DPA_VERSION, 
  DeletionRequest 
} from '../../services/privacyAuditService';
import { SchoolDPAModal } from './SchoolDPAModal';
import { PrivacyNoticeModal } from './PrivacyNoticeModal';

interface DataPrivacyTabProps {
  schoolId: string;
  schoolName: string;
  isAdmin: boolean;
}

export const DataPrivacyTab: React.FC<DataPrivacyTabProps> = ({
  schoolId,
  schoolName = 'Partner School',
  isAdmin
}) => {
  const [dpaStatus, setDpaStatus] = useState<DPAStatus>({ accepted: false, version: DPA_VERSION });
  const [deletionRequest, setDeletionRequest] = useState<DeletionRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<'json' | 'csv'>('json');

  // Modals
  const [isDPAModalOpen, setIsDPAModalOpen] = useState(false);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [privacyModalTab, setPrivacyModalTab] = useState<'privacy' | 'terms'>('privacy');
  
  // Safe Deletion Workflow Modal
  const [isDeletionModalOpen, setIsDeletionModalOpen] = useState(false);
  const [deletionConfirmText, setDeletionConfirmText] = useState('');
  const [deletionReason, setDeletionReason] = useState('');
  const [submittingDeletion, setSubmittingDeletion] = useState(false);

  useEffect(() => {
    loadPrivacyStatus();
  }, [schoolId]);

  const loadPrivacyStatus = async () => {
    setLoading(true);
    try {
      const [dpa, delReq] = await Promise.all([
        privacyAuditService.getDPAStatus(schoolId),
        privacyAuditService.getActiveDeletionRequest(schoolId)
      ]);
      setDpaStatus(dpa);
      setDeletionRequest(delReq);
    } catch (err) {
      console.warn('Error loading privacy status:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptDPA = async () => {
    const user = auth.currentUser;
    if (!user) return;
    try {
      const updated = await privacyAuditService.acceptDPA(
        schoolId,
        user.email || 'admin@school.edu',
        user.displayName || 'School Administrator'
      );
      setDpaStatus(updated);
      toast.success('School Data Processing Agreement successfully signed & recorded!');
    } catch (err) {
      toast.error('Could not save DPA acceptance.');
    }
  };

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const data = await privacyAuditService.exportSchoolData(schoolId, auth.currentUser?.uid);
      const timestamp = new Date().toISOString().split('T')[0];

      if (exportFormat === 'json') {
        const jsonStr = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `smartpe_school_export_${schoolId}_${timestamp}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        // Structured CSV Export of Students & Results
        const studentsHeader = "Name,RollNumber,Grade,Section,Gender,Age\n";
        const studentRows = (data.students || []).map((s: any) => 
          `"${s.name || ''}","${s.rollNumber || ''}","${s.grade || ''}","${s.section || ''}","${s.gender || ''}",${s.age || ''}`
        ).join('\n');
        
        const blob = new Blob([studentsHeader + studentRows], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `smartpe_students_export_${schoolId}_${timestamp}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      toast.success('School data package exported successfully.');
    } catch (err) {
      console.error('Data export error:', err);
      toast.error('Failed to export school data.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleSubmitDeletionRequest = async () => {
    const expected = (schoolName || 'CONFIRM').trim().toUpperCase();
    if (deletionConfirmText.trim().toUpperCase() !== expected && deletionConfirmText.trim().toUpperCase() !== 'DELETE') {
      toast.error(`Please type "${schoolName}" to confirm.`);
      return;
    }

    setSubmittingDeletion(true);
    try {
      const req = await privacyAuditService.submitDeletionRequest(
        schoolId,
        schoolName,
        deletionReason
      );
      setDeletionRequest(req);
      setIsDeletionModalOpen(false);
      setDeletionConfirmText('');
      setDeletionReason('');
      toast.success('Formal school data deletion request submitted. Our compliance team has been notified.');
    } catch (err) {
      toast.error('Could not submit deletion request.');
    } finally {
      setSubmittingDeletion(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border-4 border-slate-900 p-8 rounded-[2.5rem] text-white shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] relative overflow-hidden">
        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="inline-flex px-3 py-1 border border-indigo-400/40 bg-indigo-950/80 text-indigo-300 rounded-lg text-[9px] font-black uppercase tracking-widest mb-2">
                Data Protection & Privacy Architecture
              </span>
              <h3 className="text-2xl sm:text-3xl font-black uppercase tracking-tighter">
                School Data Governance & Privacy Center
              </h3>
              <p className="text-slate-400 text-xs sm:text-sm max-w-2xl mt-1">
                Manage your institution's Data Processing Agreement (DPA), download full student assessment archives, and review sub-processor safeguards.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={loadPrivacyStatus}
                disabled={loading}
                className="px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer"
              >
                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                <span>Refresh Status</span>
              </button>
            </div>
          </div>

          {/* Key Privacy Promises Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-white/10 text-xs">
            <div className="p-3 bg-white/5 border border-white/10 rounded-2xl">
              <div className="font-black text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 size={16} /> Zero Sale of Data
              </div>
              <p className="text-[11px] text-slate-300 mt-1 font-medium">SmartPE never sells, leases, or trades student or school information.</p>
            </div>

            <div className="p-3 bg-white/5 border border-white/10 rounded-2xl">
              <div className="font-black text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 size={16} /> No Targeted Ads
              </div>
              <p className="text-[11px] text-slate-300 mt-1 font-medium">No behavioral tracking or advertising profiles built from student scores.</p>
            </div>

            <div className="p-3 bg-white/5 border border-white/10 rounded-2xl">
              <div className="font-black text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 size={16} /> Strict Tenant Isolation
              </div>
              <p className="text-[11px] text-slate-300 mt-1 font-medium">Student data is cryptographically and server-side isolated to your school.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Pending Deletion Alert if Active */}
      {deletionRequest && deletionRequest.status === 'pending_verification' && (
        <div className="p-6 bg-rose-50 border-4 border-rose-500 rounded-[2rem] shadow-[4px_4px_0px_0px_rgba(225,29,72,1)] space-y-2">
          <div className="flex items-center gap-3">
            <AlertTriangle className="text-rose-600" size={24} />
            <div>
              <h4 className="font-black text-rose-950 uppercase tracking-tight text-sm sm:text-base">
                School Data Deletion Request In Review
              </h4>
              <p className="text-xs text-rose-800 font-semibold">
                Requested on {new Date(deletionRequest.requestedAt).toLocaleDateString()} by {deletionRequest.requestedByEmail}.
              </p>
            </div>
          </div>
          <p className="text-xs text-rose-900/90 font-medium pl-9">
            Our compliance team is verifying this request. A 14-day retention buffer applies before permanent purging to protect against accidental administrative data loss. If this request was made in error, contact <a href="mailto:contact@smartpeindia.app" className="underline font-bold">contact@smartpeindia.app</a> immediately.
          </p>
        </div>
      )}

      {/* Main Governance Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Card 1: School Data Processing Agreement (DPA) */}
        <div className="bg-white border-4 border-slate-900 rounded-[2.5rem] p-6 sm:p-8 shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 border-2 border-indigo-200 flex items-center justify-center text-indigo-600">
                <FileText size={24} />
              </div>
              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                dpaStatus.accepted 
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800' 
                  : 'bg-amber-50 border-amber-300 text-amber-800'
              }`}>
                {dpaStatus.accepted ? 'DPA Executed' : 'Action Required'}
              </span>
            </div>

            <div>
              <h4 className="text-xl font-black uppercase tracking-tight text-slate-900">
                School Data Processing Agreement (DPA)
              </h4>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Formal legal agreement governing data fiduciary (School) and data processor (SmartPE) obligations, DPDP Act alignment, and student data safeguards.
              </p>
            </div>

            {/* DPA Live Status Details */}
            <div className="p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Agreement Version</span>
                <span className="font-bold text-slate-900">{dpaStatus.version || DPA_VERSION}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Status</span>
                <span className={`font-black ${dpaStatus.accepted ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {dpaStatus.accepted ? '✓ Formally Accepted' : '⚠ Pending Review & Acceptance'}
                </span>
              </div>
              {dpaStatus.accepted && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Accepted On</span>
                    <span className="font-bold text-slate-800">
                      {dpaStatus.acceptedAt ? new Date(dpaStatus.acceptedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'On Record'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Accepted By</span>
                    <span className="font-bold text-slate-800 truncate max-w-[200px]">{dpaStatus.acceptedBy || 'School Administrator'}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-slate-100">
            <button
              onClick={() => setIsDPAModalOpen(true)}
              className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-xs uppercase tracking-wider transition-all shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] flex items-center gap-2 cursor-pointer"
            >
              <FileText size={16} />
              <span>{dpaStatus.accepted ? 'View / Print DPA' : 'Review & Sign DPA'}</span>
            </button>
            <button
              onClick={() => {
                setIsDPAModalOpen(true);
                setTimeout(() => window.print(), 300);
              }}
              className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs uppercase tracking-wider transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Printer size={16} />
              <span>Printable PDF</span>
            </button>
          </div>
        </div>

        {/* Card 2: Export School Data Archive */}
        <div className="bg-white border-4 border-slate-900 rounded-[2.5rem] p-6 sm:p-8 shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center text-emerald-600">
              <Download size={24} />
            </div>

            <div>
              <h4 className="text-xl font-black uppercase tracking-tight text-slate-900">
                Export School Data Archive
              </h4>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Download an unencumbered, complete archive of all student rosters, Khelo India fitness test scores, and CBSE 30M practical records.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
                Choose Archive Format:
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setExportFormat('json')}
                  className={`p-3 rounded-xl border-2 flex items-center justify-center gap-2 text-xs font-bold transition-all cursor-pointer ${
                    exportFormat === 'json'
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-900 font-black'
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <FileCode size={16} />
                  <span>Structured JSON</span>
                </button>
                <button
                  type="button"
                  onClick={() => setExportFormat('csv')}
                  className={`p-3 rounded-xl border-2 flex items-center justify-center gap-2 text-xs font-bold transition-all cursor-pointer ${
                    exportFormat === 'csv'
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-900 font-black'
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <FileSpreadsheet size={16} />
                  <span>Students CSV</span>
                </button>
              </div>
            </div>

            <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs text-emerald-900 font-medium">
              ✓ Includes: Student Profiles, Fitness Battery Scores, Practical Assessments, and Department Timetables.
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <button
              onClick={handleExportData}
              disabled={isExporting}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black text-xs uppercase tracking-wider transition-all shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isExporting ? (
                <span>Compiling Archive...</span>
              ) : (
                <>
                  <Download size={16} />
                  <span>Download Complete School Archive</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Card 3: Terms, Policies & Privacy Contact */}
        <div className="bg-white border-4 border-slate-900 rounded-[2.5rem] p-6 sm:p-8 shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border-2 border-amber-200 flex items-center justify-center text-amber-600">
              <ShieldCheck size={24} />
            </div>

            <div>
              <h4 className="text-xl font-black uppercase tracking-tight text-slate-900">
                Terms of Service & Privacy Notice
              </h4>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Review transparent operational notices, permitted educational use, and data protection officer contact channels.
              </p>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => {
                  setPrivacyModalTab('privacy');
                  setIsPrivacyModalOpen(true);
                }}
                className="w-full p-3.5 bg-slate-50 hover:bg-slate-100 border-2 border-slate-200 rounded-xl text-xs font-black uppercase tracking-wider text-slate-800 flex items-center justify-between transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <ShieldCheck size={16} className="text-indigo-600" />
                  <span>Read Full Privacy Notice</span>
                </div>
                <ExternalLink size={14} className="text-slate-400" />
              </button>

              <button
                onClick={() => {
                  setPrivacyModalTab('terms');
                  setIsPrivacyModalOpen(true);
                }}
                className="w-full p-3.5 bg-slate-50 hover:bg-slate-100 border-2 border-slate-200 rounded-xl text-xs font-black uppercase tracking-wider text-slate-800 flex items-center justify-between transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <FileText size={16} className="text-indigo-600" />
                  <span>Read Terms of Service</span>
                </div>
                <ExternalLink size={14} className="text-slate-400" />
              </button>
            </div>
          </div>

          <div className="p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl text-xs space-y-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
              Official Privacy & DPO Contact:
            </span>
            <div className="font-bold text-slate-800 flex items-center gap-2">
              <Mail size={14} className="text-indigo-600" />
              <a href="mailto:contact@smartpeindia.app" className="hover:underline text-indigo-600">
                contact@smartpeindia.app
              </a>
            </div>
          </div>
        </div>

        {/* Card 4: Sub-Processors & Infrastructure Disclosure */}
        <div className="bg-white border-4 border-slate-900 rounded-[2.5rem] p-6 sm:p-8 shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-sky-50 border-2 border-sky-200 flex items-center justify-center text-sky-600">
              <Server size={24} />
            </div>

            <div>
              <h4 className="text-xl font-black uppercase tracking-tight text-slate-900">
                Sub-Processors & Security Architecture
              </h4>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Verified cloud infrastructure providers processing application data under strict processor agreements.
              </p>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div>
                  <div className="font-black text-slate-900">Google Cloud / Firebase</div>
                  <div className="text-[10px] text-slate-500">Database & Identity • AES-256 at rest</div>
                </div>
                <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Primary DB
                </span>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div>
                  <div className="font-black text-slate-900">Google Gemini AI Engine</div>
                  <div className="text-[10px] text-slate-500">Curriculum & Pedagogy • Zero Student PII</div>
                </div>
                <span className="text-[10px] font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                  AI Assisting
                </span>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div>
                  <div className="font-black text-slate-900">Corporate SMTP & Email Engine</div>
                  <div className="text-[10px] text-slate-500">Transactional Alerts & Welcome Onboarding</div>
                </div>
                <span className="text-[10px] font-black text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                  Transactional
                </span>
              </div>
            </div>
          </div>

          <div className="pt-2 text-[11px] text-slate-500 font-medium">
            🔒 All sub-processors adhere to SOC 2 Type II and ISO 27001 data protection standards.
          </div>
        </div>
      </div>

      {/* Card 5: Safe School Workspace Deletion */}
      <div className="bg-rose-50/50 border-4 border-rose-900/40 rounded-[2.5rem] p-6 sm:p-8 shadow-[6px_6px_0px_0px_rgba(159,18,57,0.2)] space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <h4 className="text-xl font-black uppercase tracking-tight text-rose-950 flex items-center gap-2">
              <Trash2 size={20} className="text-rose-600" />
              Request School Workspace Deletion
            </h4>
            <p className="text-xs text-rose-900/80 font-medium max-w-2xl">
              Initiates a formal data purging workflow for this school workspace. To prevent accidental data loss, deletions undergo multi-step confirmation and a standard 14-day security grace period.
            </p>
          </div>

          <button
            onClick={() => setIsDeletionModalOpen(true)}
            className="px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-black text-xs uppercase tracking-wider transition-all shadow-[2px_2px_0px_0px_rgba(159,18,57,1)] flex items-center gap-2 cursor-pointer"
          >
            <Trash2 size={16} />
            <span>Request Deletion</span>
          </button>
        </div>
      </div>

      {/* DPA Modal */}
      <SchoolDPAModal
        isOpen={isDPAModalOpen}
        onClose={() => setIsDPAModalOpen(false)}
        schoolName={schoolName}
        isAccepted={dpaStatus.accepted}
        acceptedAt={dpaStatus.acceptedAt}
        acceptedBy={dpaStatus.acceptedBy}
        onAccept={handleAcceptDPA}
      />

      {/* Privacy Notice / Terms Modal */}
      <PrivacyNoticeModal
        isOpen={isPrivacyModalOpen}
        onClose={() => setIsPrivacyModalOpen(false)}
        defaultTab={privacyModalTab}
      />

      {/* Safe School Deletion Modal */}
      {isDeletionModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] border-4 border-slate-900 max-w-lg w-full p-8 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b-2 border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-rose-100 text-rose-600 rounded-2xl border-2 border-rose-300">
                  <Trash2 size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Request School Deletion</h3>
                  <p className="text-xs font-bold text-rose-600">Safe Multi-Step Deletion Workflow</p>
                </div>
              </div>
              <button
                onClick={() => setIsDeletionModalOpen(false)}
                className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <div className="bg-rose-50 border-2 border-rose-200 rounded-2xl p-4 text-xs font-medium text-rose-900 space-y-2">
              <p className="font-black uppercase tracking-wider text-rose-700 flex items-center gap-1.5">
                <AlertTriangle size={16} /> Important Retention Information:
              </p>
              <ul className="list-disc list-inside space-y-1 text-[11px] text-rose-900/90 font-medium">
                <li>This will mark the entire workspace for <strong>{schoolName}</strong> for decommissioning.</li>
                <li>Please export all student records and practical assessment PDFs before proceeding.</li>
                <li>Data required for legally mandated audit logs and security timestamps will be preserved according to statutory retention rules.</li>
              </ul>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 block">
                  Optional Reason for Deletion:
                </label>
                <input
                  type="text"
                  placeholder="e.g. End of academic year / school migration"
                  value={deletionReason}
                  onChange={(e) => setDeletionReason(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-rose-600"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-700 mb-1 block">
                  Type <span className="font-black text-rose-600 select-all">"{schoolName}"</span> or <span className="font-black text-rose-600">"DELETE"</span> to confirm:
                </label>
                <input
                  type="text"
                  placeholder="Type school name..."
                  value={deletionConfirmText}
                  onChange={(e) => setDeletionConfirmText(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-300 rounded-xl text-xs font-black outline-none focus:border-rose-600 uppercase"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setIsDeletionModalOpen(false)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitDeletionRequest}
                disabled={
                  submittingDeletion ||
                  (deletionConfirmText.trim().toUpperCase() !== (schoolName || '').trim().toUpperCase() &&
                   deletionConfirmText.trim().toUpperCase() !== 'DELETE')
                }
                className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-black text-xs uppercase tracking-wider transition-all shadow-[2px_2px_0px_0px_rgba(159,18,57,1)] disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
              >
                {submittingDeletion ? 'Submitting...' : 'Submit Deletion Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
