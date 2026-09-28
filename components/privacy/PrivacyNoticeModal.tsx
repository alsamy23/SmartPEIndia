import React, { useState } from 'react';
import { 
  ShieldCheck, 
  FileText, 
  Lock, 
  X, 
  Printer, 
  CheckCircle2, 
  Building2, 
  Users, 
  Mail,
  Scale
} from 'lucide-react';

interface PrivacyNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'privacy' | 'terms';
}

export const PrivacyNoticeModal: React.FC<PrivacyNoticeModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'privacy'
}) => {
  const [activeTab, setActiveTab] = useState<'privacy' | 'terms'>(defaultTab);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-[2.5rem] border-4 border-slate-900 max-w-4xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh] my-auto">
        {/* Modal Header */}
        <div className="p-6 sm:p-8 bg-slate-900 text-white flex items-center justify-between border-b-4 border-slate-900">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border-2 border-indigo-400 flex items-center justify-center text-indigo-400">
              <Scale size={28} />
            </div>
            <div>
              <span className="px-2.5 py-0.5 bg-indigo-400/20 text-indigo-300 border border-indigo-400/40 rounded text-[9px] font-black uppercase tracking-widest">
                Educational PE SaaS Compliance
              </span>
              <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white mt-1">
                Terms of Service & Privacy Notice
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold"
              title="Print Policy"
            >
              <Printer size={16} />
              <span className="hidden sm:inline">Print</span>
            </button>
            <button
              onClick={onClose}
              className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b-2 border-slate-200 bg-slate-100 px-6 pt-2">
          <button
            onClick={() => setActiveTab('privacy')}
            className={`px-6 py-3 text-xs font-black uppercase tracking-wider border-b-2 -mb-[2px] transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'privacy'
                ? 'border-indigo-600 text-indigo-600 bg-white rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <ShieldCheck size={16} />
            <span>Privacy Notice</span>
          </button>
          <button
            onClick={() => setActiveTab('terms')}
            className={`px-6 py-3 text-xs font-black uppercase tracking-wider border-b-2 -mb-[2px] transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'terms'
                ? 'border-indigo-600 text-indigo-600 bg-white rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <FileText size={16} />
            <span>Terms of Service</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 text-slate-700 text-xs sm:text-sm leading-relaxed font-medium bg-slate-50">
          {activeTab === 'privacy' ? (
            <div className="bg-white border-2 border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6">
              {/* Highlight summary banner */}
              <div className="p-4 bg-indigo-50 border-2 border-indigo-200 rounded-2xl space-y-2">
                <div className="font-black text-indigo-950 text-sm uppercase tracking-wide flex items-center gap-2">
                  <ShieldCheck size={18} className="text-indigo-600" />
                  Key Privacy Highlights
                </div>
                <ul className="list-disc list-inside text-xs text-indigo-900/90 space-y-1 font-semibold">
                  <li>SmartPE processes student names, class/section, fitness scores, and CBSE practicals solely for PE educational management.</li>
                  <li><strong>We NEVER sell student data or build advertising profiles.</strong></li>
                  <li>No targeted advertising or third-party marketing trackers.</li>
                  <li>School data is strictly restricted to authorized staff of your institution.</li>
                  <li>Users enter only data necessary for physical education learning objectives.</li>
                </ul>
              </div>

              <section className="space-y-2">
                <h3 className="text-sm font-black uppercase tracking-tight text-slate-900">1. Information We Process</h3>
                <p>
                  To provide curriculum planning, fitness test calculation (Khelo India benchmarks), CBSE Class 11-12 practical exam grading, and student report card generation, SmartPE processes:
                </p>
                <ul className="list-disc list-inside pl-2 space-y-1 text-slate-600 text-xs">
                  <li><strong>Teacher / Admin Information:</strong> Name, professional email, school affiliation, and role.</li>
                  <li><strong>Student Educational Data:</strong> Name or student identifier, roll number, class/grade, section, age, gender (for age-graded physical benchmarks), and fitness/skill assessment scores.</li>
                </ul>
              </section>

              <section className="space-y-2">
                <h3 className="text-sm font-black uppercase tracking-tight text-slate-900">2. How We Use Data</h3>
                <p>
                  Data is processed exclusively to:
                </p>
                <ul className="list-disc list-inside pl-2 space-y-1 text-slate-600 text-xs">
                  <li>Compute physical fitness percentiles and BMI ratings according to national sports benchmarks.</li>
                  <li>Generate printable student physical literacy report cards and CBSE practical award lists.</li>
                  <li>Organize school timetables, sports day track events, and sports academy cohorts.</li>
                  <li>Provide customer support and security verification to authorized school administrators.</li>
                </ul>
              </section>

              <section className="space-y-2">
                <h3 className="text-sm font-black uppercase tracking-tight text-slate-900">3. Tenant Isolation & Access Security</h3>
                <p>
                  SmartPE enforces database-level multi-tenancy rules. Teachers and staff can only access data belonging to their assigned school or coaching academy. Cross-school access is strictly blocked server-side by Firestore security rules.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-sm font-black uppercase tracking-tight text-slate-900">4. Data Retention & School Control</h3>
                <p>
                  Schools maintain full data ownership. School administrators can export a full data backup at any time or submit a formal deletion request through the School Admin Data & Privacy portal.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-sm font-black uppercase tracking-tight text-slate-900">5. Privacy Contact</h3>
                <p className="text-xs text-slate-600">
                  For privacy inquiries, audit requests, or data protection officer inquiries:
                </p>
                <div className="p-3 bg-slate-100 rounded-xl font-bold text-xs text-slate-800 flex items-center gap-2">
                  <Mail size={16} className="text-indigo-600" />
                  <span>contact@smartpeindia.app</span>
                </div>
              </section>
            </div>
          ) : (
            <div className="bg-white border-2 border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6">
              <section className="space-y-2">
                <h3 className="text-sm font-black uppercase tracking-tight text-slate-900">1. Acceptance of Terms</h3>
                <p>
                  By registering or using the SmartPE platform, educators, schools, and coaching academies agree to be bound by these Terms of Service. If you are registering on behalf of a school, you represent that you have authority to bind the institution.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-sm font-black uppercase tracking-tight text-slate-900">2. Permitted Educational Use</h3>
                <p>
                  SmartPE is provided to assist schools with Physical Education pedagogy, Khelo India assessment logging, CBSE/ICSE practical marks compilation, and sports coaching management. Users agree to enter only genuine educational and physical assessment information.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-sm font-black uppercase tracking-tight text-slate-900">3. Account Responsibility & Security</h3>
                <p>
                  Educators are responsible for maintaining the confidentiality of their login credentials. Any unauthorized access or credential compromise should be reported immediately to <a href="mailto:contact@smartpeindia.app" className="text-indigo-600 underline font-bold">contact@smartpeindia.app</a>.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-sm font-black uppercase tracking-tight text-slate-900">4. Intellectual Property & School Ownership</h3>
                <p>
                  SmartPE retains all rights to the platform software, algorithms, and interface designs. The partnering school retains full title, rights, and ownership of all student assessment records, custom curriculum notes, and uploaded school branding.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-sm font-black uppercase tracking-tight text-slate-900">5. Termination & Data Export</h3>
                <p>
                  Schools may terminate usage at any time and export all student assessment records in standard JSON or CSV formats before requesting workspace deletion.
                </p>
              </section>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-6 bg-white border-t-2 border-slate-900 flex items-center justify-between">
          <div className="text-xs text-slate-500 font-medium">
            SmartPE India • Data Privacy & Compliance
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
};
