import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Download, 
  Printer, 
  CheckCircle2, 
  X, 
  FileText, 
  Lock, 
  Building2, 
  Calendar, 
  UserCheck,
  AlertCircle
} from 'lucide-react';
import { DPA_VERSION } from '../../services/privacyAuditService';

interface SchoolDPAModalProps {
  isOpen: boolean;
  onClose: () => void;
  schoolName?: string;
  isAccepted: boolean;
  acceptedAt?: string | null;
  acceptedBy?: string | null;
  onAccept?: () => Promise<void>;
}

export const SchoolDPAModal: React.FC<SchoolDPAModalProps> = ({
  isOpen,
  onClose,
  schoolName = 'Partner Educational Institution',
  isAccepted,
  acceptedAt,
  acceptedBy,
  onAccept
}) => {
  const [isAccepting, setIsAccepting] = useState(false);
  const [acceptConfirmed, setAcceptConfirmed] = useState(false);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleAcceptAgreement = async () => {
    if (!onAccept) return;
    setIsAccepting(true);
    try {
      await onAccept();
      setAcceptConfirmed(true);
    } catch (err) {
      console.error('Error accepting DPA:', err);
    } finally {
      setIsAccepting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-[2.5rem] border-4 border-slate-900 max-w-4xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh] my-auto">
        {/* Modal Header */}
        <div className="p-6 sm:p-8 bg-slate-900 text-white flex items-center justify-between border-b-4 border-slate-900 relative">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-emerald-400">
              <ShieldCheck size={28} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 bg-emerald-400/20 text-emerald-300 border border-emerald-400/40 rounded text-[9px] font-black uppercase tracking-widest">
                  Legal Agreement {DPA_VERSION}
                </span>
                {isAccepted && (
                  <span className="px-2.5 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-400/40 rounded text-[9px] font-black uppercase tracking-widest flex items-center gap-1">
                    <CheckCircle2 size={10} />
                    Active on Record
                  </span>
                )}
              </div>
              <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white mt-1">
                School Data Processing Agreement (DPA)
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold"
              title="Print or Save as PDF"
            >
              <Printer size={16} />
              <span className="hidden sm:inline">Print / PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Scrollable Agreement Content */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 text-slate-700 text-xs sm:text-sm leading-relaxed font-medium bg-slate-50">
          {/* Institutional Header Card */}
          <div className="bg-white border-2 border-slate-900 rounded-2xl p-5 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Data Fiduciary / Institution</span>
                <span className="font-black text-slate-900 text-sm sm:text-base">{schoolName}</span>
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Data Processor</span>
                <span className="font-black text-slate-900 text-sm sm:text-base">SmartPE India</span>
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Effective Version</span>
                <span className="font-black text-indigo-600 text-sm">{DPA_VERSION}</span>
              </div>
            </div>

            {isAccepted && (
              <div className="pt-1 flex items-center gap-2 text-xs text-emerald-700 font-bold">
                <CheckCircle2 size={16} className="text-emerald-600" />
                <span>
                  Agreement executed on {acceptedAt ? new Date(acceptedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Record'} by {acceptedBy || 'School Administrator'}.
                </span>
              </div>
            )}
          </div>

          {/* Agreement Clauses */}
          <div className="bg-white border-2 border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6">
            <section className="space-y-2">
              <h3 className="text-sm sm:text-base font-black uppercase tracking-tight text-slate-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs">1</span>
                Scope, Purpose & Legal Roles
              </h3>
              <p>
                This Data Processing Agreement ("<strong>Agreement</strong>") governs the processing of student, educator, and physical education assessment data by <strong>SmartPE India</strong> ("<strong>Data Processor</strong>") on behalf of the partnering school, academy, or educational institution ("<strong>Data Fiduciary</strong>").
              </p>
              <p>
                SmartPE processes student fitness records solely to facilitate digital PE curriculum delivery, Khelo India Fitness Assessment scoring, CBSE Board Practical Examination grading (Strands 1–4), timetable scheduling, and academic physical literacy reporting.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="text-sm sm:text-base font-black uppercase tracking-tight text-slate-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs">2</span>
                Categories of Student Data Processed
              </h3>
              <p>
                Data processing is strictly restricted to educational PE requirements:
              </p>
              <ul className="list-disc list-inside pl-2 space-y-1 text-slate-600 font-semibold text-xs">
                <li><strong>Student Identifiers:</strong> Name or student enrollment/roll number, Grade, and Section.</li>
                <li><strong>Demographics for Standardized Norms:</strong> Age, Gender (strictly required to compute Khelo India and WHO percentile fitness benchmarks).</li>
                <li><strong>Physical Assessment Metrics:</strong> Height, Weight (for automated BMI percentiles), Sit-and-Reach (flexibility), Curl-ups / Push-ups (strength), Shuttle Run / 600m Run (endurance).</li>
                <li><strong>CBSE Practical Exam Records:</strong> 30-Mark Board practical assessments, portfolio logs, teacher observations.</li>
              </ul>
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs font-bold">
                🔒 <strong>Data Minimization Guarantee:</strong> SmartPE does not collect or require student home addresses, personal telephone numbers, Aadhaar numbers, or unrelated medical histories.
              </div>
            </section>

            <section className="space-y-2">
              <h3 className="text-sm sm:text-base font-black uppercase tracking-tight text-slate-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs">3</span>
                Strict Prohibitions (No Sale, No Targeted Ads)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl">
                  <div className="font-black text-rose-800 text-xs uppercase tracking-wider">Zero Sale of Data</div>
                  <p className="text-[11px] text-rose-900/90 mt-1 font-medium">SmartPE will never sell, lease, monetize, or trade student records or school rosters to any third party.</p>
                </div>
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl">
                  <div className="font-black text-rose-800 text-xs uppercase tracking-wider">No Targeted Advertising</div>
                  <p className="text-[11px] text-rose-900/90 mt-1 font-medium">No behavioral profiling, commercial tracking, or marketing advertisements are conducted on student data.</p>
                </div>
              </div>
            </section>

            <section className="space-y-2">
              <h3 className="text-sm sm:text-base font-black uppercase tracking-tight text-slate-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs">4</span>
                Security, Access Control & Encryption
              </h3>
              <p>
                SmartPE implements robust organizational and technical safeguards:
              </p>
              <ul className="list-disc list-inside pl-2 space-y-1 text-slate-600 font-semibold text-xs">
                <li><strong>Role-Based Access Control (RBAC):</strong> Student records are accessible solely to authenticated teachers and administrators belonging to the specific school.</li>
                <li><strong>Tenant Isolation:</strong> Firestore database security rules enforce cryptographic and server-side tenancy boundaries preventing cross-school access.</li>
                <li><strong>Encryption:</strong> 256-bit TLS/HTTPS in transit and AES-256 cloud encryption at rest via Google Cloud / Firebase infrastructure.</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h3 className="text-sm sm:text-base font-black uppercase tracking-tight text-slate-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs">5</span>
                Data Retention, Export & Safe Deletion
              </h3>
              <p>
                The School retains complete ownership of all data. The School Administrator can:
              </p>
              <ul className="list-disc list-inside pl-2 space-y-1 text-slate-600 font-semibold text-xs">
                <li><strong>Export Data:</strong> Download a full, structured export of all student profiles, test scores, and assessments at any time.</li>
                <li><strong>Request Deletion:</strong> Initiate a formal workspace deletion request. To prevent accidental loss, deletion requests undergo a multi-step administrative verification with a 14-day retention buffer before irreversible purging.</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h3 className="text-sm sm:text-base font-black uppercase tracking-tight text-slate-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs">6</span>
                Breach Notification & Support Cooperation
              </h3>
              <p>
                In the unlikely event of a confirmed security incident impacting school data, SmartPE will notify the designated School Administrator without undue delay and within 72 hours of verification, providing details and remedial actions taken.
              </p>
              <p className="text-xs text-slate-500">
                Official Privacy & Data Protection Contact: <a href="mailto:contact@smartpeindia.app" className="font-bold text-indigo-600 underline">contact@smartpeindia.app</a>
              </p>
            </section>
          </div>
        </div>

        {/* Modal Footer / Acceptance Action */}
        <div className="p-6 bg-white border-t-2 border-slate-900 flex flex-wrap items-center justify-between gap-4">
          <div className="text-xs text-slate-500">
            {isAccepted ? (
              <span className="font-bold text-emerald-600 flex items-center gap-1.5">
                <CheckCircle2 size={16} />
                Agreement is formally active for {schoolName}.
              </span>
            ) : (
              <span>Review and accept this agreement to register institutional compliance.</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
            >
              Close
            </button>

            {!isAccepted && onAccept && (
              <button
                onClick={handleAcceptAgreement}
                disabled={isAccepting}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black text-xs uppercase tracking-wider transition-all shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isAccepting ? (
                  <span>Saving...</span>
                ) : (
                  <>
                    <CheckCircle2 size={16} />
                    <span>Accept Data Processing Agreement</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
