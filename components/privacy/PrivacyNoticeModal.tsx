import React, { useState, useEffect } from 'react';
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

  useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab, isOpen]);

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
                Educational PE Platform Compliance
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
                  Key Privacy Highlights (India DPDP Principles)
                </div>
                <ul className="list-disc list-inside text-xs text-indigo-900/90 space-y-1 font-semibold">
                  <li>SmartPE processes student names/identifiers, class/section, fitness scores, and CBSE practicals solely for PE educational management under India’s DPDP Act, 2023.</li>
                  <li><strong>We NEVER sell student data, run behavioral tracking, or serve targeted ads.</strong></li>
                  <li><strong>Zero Student PII in AI Prompts:</strong> Only de-identified grade/sport curriculum context is sent to Gemini AI; student names and scores stay in your school database.</li>
                  <li><strong>Sanitized Usage Analytics:</strong> Telemetry strips student names, roll numbers, DOB, emails, and test marks before firing GA4 events.</li>
                  <li><strong>Delete Anytime:</strong> Administrators and users can export or permanently delete their data immediately anytime—no request required.</li>
                </ul>
              </div>

              <section className="space-y-2">
                <h3 className="text-sm font-black uppercase tracking-tight text-slate-900">1. Roles &amp; Information We Process</h3>
                <p>
                  For educator accounts, SmartPE India is the Data Fiduciary. For student records, the Partner School or Academy is the Data Fiduciary (responsible for obtaining parent/guardian consent for under-18 students) and SmartPE acts solely as Data Processor:
                </p>
                <ul className="list-disc list-inside pl-2 space-y-1 text-slate-600 text-xs">
                  <li><strong>Teacher / Admin Information:</strong> Name, professional email, school affiliation, role, and Terms acceptance timestamp at login/registration.</li>
                  <li><strong>Student Educational Data:</strong> Name or student identifier, roll number, class/grade, section, age, gender (for age-graded physical benchmarks), and fitness/skill assessment scores.</li>
                </ul>
              </section>

              <section className="space-y-2">
                <h3 className="text-sm font-black uppercase tracking-tight text-slate-900">2. How We Use Data &amp; Active-Session Offline Caching</h3>
                <p>
                  Data is processed exclusively to:
                </p>
                <ul className="list-disc list-inside pl-2 space-y-1 text-slate-600 text-xs">
                  <li>Compute physical fitness percentiles and BMI ratings according to age- and gender-graded sports benchmarks.</li>
                  <li>Generate printable student physical literacy report cards and CBSE practical award lists.</li>
                  <li>Support outdoor ground assessments via temporary active-session browser caching (automatically cleared when you explicitly sign out or delete data).</li>
                  <li>Deliver educator onboarding and school invite notifications via Brevo transactional email.</li>
                </ul>
              </section>

              <section className="space-y-2">
                <h3 className="text-sm font-black uppercase tracking-tight text-slate-900">3. Tenant Isolation &amp; Access Security</h3>
                <p>
                  SmartPE enforces database-level multi-tenancy rules on Google Cloud Firebase / Firestore. Teachers and staff can only access data belonging to their assigned school or coaching academy. Cross-school access is blocked server-side by Firestore security rules.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-sm font-black uppercase tracking-tight text-slate-900">4. Data Retention, Export &amp; Immediate Deletion Anytime</h3>
                <p>
                  Schools and users retain full data ownership. If you do not wish to continue using SmartPE, you can export a complete JSON/CSV backup and <strong>permanently delete your school or personal data immediately anytime</strong> from <strong>School Settings → Data &amp; Privacy</strong>. School Admins and Platform Admins have direct deletion privileges without needing to wait or file a manual request.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-sm font-black uppercase tracking-tight text-slate-900">5. Privacy Contact</h3>
                <p className="text-xs text-slate-600">
                  For privacy inquiries, data export assistance, parental opt-out requests, or account support (typical response within 72 hours), reach us via Contact &amp; Support or email:
                </p>
                <div className="p-3 bg-slate-100 rounded-xl font-bold text-xs text-slate-800 flex items-center gap-2">
                  <Mail size={16} className="text-indigo-600" />
                  <a href="mailto:contact@smartpeindia.app" className="text-indigo-700 underline">contact@smartpeindia.app</a>
                </div>
              </section>
            </div>
          ) : (
            <div className="bg-white border-2 border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6">
              <section className="space-y-2">
                <h3 className="text-sm font-black uppercase tracking-tight text-slate-900">1. Acceptance on Login &amp; Registration</h3>
                <p>
                  By logging into or registering a workspace on SmartPE India, educators, schools, and coaching academies confirm they have read and agree to these Terms of Service and Privacy Policy. If acting on behalf of a school or academy, you confirm institutional authorization and parental/guardian consent under applicable Indian data protection law (DPDP Act, 2023) before entering minor student data.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-sm font-black uppercase tracking-tight text-slate-900">2. Permitted Educational Use</h3>
                <p>
                  SmartPE is provided to assist schools with Physical Education pedagogy, Khelo India assessment logging, CBSE/ICSE practical marks compilation, and sports coaching management. Users agree to enter only genuine educational and physical assessment information.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-sm font-black uppercase tracking-tight text-slate-900">3. Account Responsibility &amp; Security</h3>
                <p>
                  Educators are responsible for maintaining the confidentiality of their login credentials. Any unauthorized access or credential compromise should be reported immediately to <a href="mailto:contact@smartpeindia.app" className="text-indigo-600 underline font-bold">contact@smartpeindia.app</a>.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-sm font-black uppercase tracking-tight text-slate-900">4. Intellectual Property &amp; School Ownership</h3>
                <p>
                  SmartPE retains all rights to the platform software, algorithms, and interface designs. The partnering school retains full title, rights, and ownership of all student assessment records, custom curriculum notes, and uploaded school branding.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-sm font-black uppercase tracking-tight text-slate-900">5. Discontinuing Use, Export &amp; Immediate Deletion</h3>
                <p>
                  Schools and educators may discontinue using SmartPE at any time, export all records in JSON or CSV formats, and exercise direct self-service deletion inside School Settings → Data &amp; Privacy to permanently remove their data immediately—no approval request required.
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
