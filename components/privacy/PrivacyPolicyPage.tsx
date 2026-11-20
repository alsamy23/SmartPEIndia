import React, { useState } from 'react';
import {
  ShieldCheck,
  FileText,
  Lock,
  Mail,
  CheckCircle2,
  Database,
  Brain,
  WifiOff,
  Scale,
  ArrowRight
} from 'lucide-react';

interface PrivacyPolicyPageProps {
  onNavigate?: (tabId: any) => void;
}

export const PrivacyPolicyPage: React.FC<PrivacyPolicyPageProps> = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'privacy' | 'terms'>('privacy');

  return (
    <div className="max-w-5xl mx-auto space-y-8 py-4 md:py-8">
      {/* Header Banner */}
      <div className="bg-slate-900 text-white rounded-[2.5rem] p-6 sm:p-10 border-4 border-slate-900 shadow-xl space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/20 border border-indigo-400/40 text-indigo-300 rounded-full text-[10px] font-black uppercase tracking-widest">
          <Scale size={14} />
          <span>India DPDP Principles &amp; School Trust</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-black uppercase tracking-tight">
          Privacy Policy &amp; Terms of Service
        </h1>
        <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed font-medium">
          SmartPE India is a PE Digital Platform built for educators. Schools and academies retain full ownership of all student records, fitness assessments, and uploaded institutional branding.
        </p>

        {/* Tab Switcher */}
        <div className="flex flex-wrap gap-2 pt-2">
          <button
            type="button"
            onClick={() => setActiveTab('privacy')}
            className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'privacy'
                ? 'bg-white text-slate-900 shadow-md'
                : 'bg-white/10 text-slate-300 hover:bg-white/20'
            }`}
          >
            <ShieldCheck size={16} />
            <span>Privacy Policy</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('terms')}
            className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'terms'
                ? 'bg-white text-slate-900 shadow-md'
                : 'bg-white/10 text-slate-300 hover:bg-white/20'
            }`}
          >
            <FileText size={16} />
            <span>Terms of Service</span>
          </button>
        </div>
      </div>

      {activeTab === 'privacy' ? (
        <div className="space-y-6">
          {/* 4 Pillar Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border-2 border-slate-900 rounded-2xl p-5 space-y-2 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
              <Lock size={20} className="text-emerald-600" />
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-900">School Isolation</h2>
              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                Firestore tenant rules isolate student and assessment data strictly within your assigned school or academy.
              </p>
            </div>
            <div className="bg-white border-2 border-slate-900 rounded-2xl p-5 space-y-2 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
              <Brain size={20} className="text-indigo-600" />
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-900">Zero Student PII to AI</h2>
              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                AI lesson and question paper generators only receive curriculum grade/sport inputs—never student names or scores.
              </p>
            </div>
            <div className="bg-white border-2 border-slate-900 rounded-2xl p-5 space-y-2 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
              <WifiOff size={20} className="text-amber-600" />
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-900">Offline Field Cache</h2>
              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                Active-session local caching keeps ground tests working offline and clears sensitive records on sign-out.
              </p>
            </div>
            <div className="bg-white border-2 border-slate-900 rounded-2xl p-5 space-y-2 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
              <Database size={20} className="text-sky-600" />
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-900">Delete Anytime</h2>
              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                Export JSON/CSV archives or permanently delete school/account data immediately anytime—no request needed.
              </p>
            </div>
          </div>

          <div className="bg-white border-2 border-slate-200 rounded-[2rem] p-6 sm:p-10 space-y-6 text-slate-700 text-xs sm:text-sm leading-relaxed">
            <section className="space-y-2">
              <h3 className="text-base font-black uppercase tracking-tight text-slate-900">1. Legal Roles &amp; Data We Process (India DPDP Act, 2023)</h3>
              <p>
                SmartPE India operates under India’s Digital Personal Data Protection (DPDP) Act, 2023 principles:
              </p>
              <ul className="list-disc list-inside pl-2 space-y-1 text-slate-600">
                <li><strong>Educator Account Data (SmartPE as Data Fiduciary):</strong> Display name, institutional email address, school/academy affiliation, role, and timestamped Terms &amp; Privacy acceptance recorded on login and signup.</li>
                <li><strong>Student Educational Records (School as Data Fiduciary / SmartPE as Data Processor):</strong> Name/identifier, roll number, grade, section, age, gender, and PE assessment metrics entered by authorized school staff. Schools confirm valid parent/guardian notice and consent for under-18 students under their institutional Data Processing Agreement (DPA).</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h3 className="text-base font-black uppercase tracking-tight text-slate-900">2. Zero Advertising, Zero Sale &amp; Sanitized Analytics</h3>
              <p>
                We <strong>never sell student data</strong>, run behavioral tracking, or serve targeted advertisements to students or minors. Product usage analytics strip student names, roll numbers, emails, phone numbers, dates of birth, and individual marks before recording aggregated feature usage in Google Analytics 4.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="text-base font-black uppercase tracking-tight text-slate-900">3. Infrastructure &amp; Sub-Processors</h3>
              <ul className="list-disc list-inside pl-2 space-y-1 text-slate-600">
                <li><strong>Google Cloud &amp; Firebase:</strong> Authentication and encrypted cloud storage (Google Cloud maintains SOC 2 Type II and ISO 27001 certifications).</li>
                <li><strong>Google Gemini AI:</strong> Curriculum and question-paper drafting using de-identified pedagogical prompts only (zero student PII).</li>
                <li><strong>Brevo Transactional Email:</strong> Account onboarding confirmations and administrator-triggered teacher invitations.</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h3 className="text-base font-black uppercase tracking-tight text-slate-900">4. Anytime Data Export &amp; Immediate Self-Deletion</h3>
              <p>
                If an educator, school, or academy chooses not to continue using SmartPE, they may export their full records in JSON/CSV and <strong>permanently delete their data immediately anytime</strong> directly from <strong>School Settings → Data &amp; Privacy</strong>. School Administrators and Platform Administrators hold direct deletion privileges—no waiting period or manual approval request is required.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="text-base font-black uppercase tracking-tight text-slate-900">5. Privacy &amp; Support Contact</h3>
              <p>
                For institutional DPA queries, parental opt-out requests, or privacy support (typical response within 72 hours), please use the Contact &amp; Support section or email us directly:
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <a
                  href="mailto:contact@smartpeindia.app"
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-slate-800 transition-colors"
                >
                  <Mail size={15} />
                  <span>contact@smartpeindia.app</span>
                </a>
                {onNavigate && (
                  <button
                    type="button"
                    onClick={() => onNavigate('school-admin')}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-indigo-100 transition-colors cursor-pointer"
                  >
                    <span>Open School Data &amp; Privacy Portal</span>
                    <ArrowRight size={15} />
                  </button>
                )}
              </div>
            </section>
          </div>
        </div>
      ) : (
        <div className="bg-white border-2 border-slate-200 rounded-[2rem] p-6 sm:p-10 space-y-6 text-slate-700 text-xs sm:text-sm leading-relaxed">
          <section className="space-y-2">
            <h3 className="text-base font-black uppercase tracking-tight text-slate-900">1. Acceptance on Login &amp; Institutional Authority</h3>
            <p>
              Every user reads and accepts these Terms &amp; Conditions and Privacy Policy before logging into or creating an account on SmartPE India. If registering or acting on behalf of a school or academy, you confirm institutional authority and compliance with applicable parent/guardian consent requirements under India’s DPDP Act, 2023.
            </p>
          </section>
          <section className="space-y-2">
            <h3 className="text-base font-black uppercase tracking-tight text-slate-900">2. Permitted Educational Use</h3>
            <p>
              SmartPE India is an assistive PE Digital Platform designed for lesson planning, CBSE/ICSE theory and practical scoring, fitness test tracking, and sports event fixtures. Users must enter only legitimate academic and physical education data.
            </p>
          </section>
          <section className="space-y-2">
            <h3 className="text-base font-black uppercase tracking-tight text-slate-900">3. Data Ownership &amp; Immediate Termination Anytime</h3>
            <p>
              Schools and academies retain 100% ownership of their student records, assessment histories, and institutional logos. Users and workspace administrators may discontinue using SmartPE at any time, export records, and permanently delete their workspace or account data immediately via School Settings → Data &amp; Privacy or by contacting <a href="mailto:contact@smartpeindia.app" className="text-indigo-600 underline font-bold">contact@smartpeindia.app</a>.
            </p>
          </section>
        </div>
      )}
    </div>
  );
};

export default PrivacyPolicyPage;
