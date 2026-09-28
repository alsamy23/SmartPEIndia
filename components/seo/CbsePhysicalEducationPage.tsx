import React, { useEffect } from 'react';
import { 
  GraduationCap, 
  CheckCircle2, 
  Sparkles, 
  ArrowRight, 
  ClipboardCheck, 
  FileText, 
  Activity, 
  Users, 
  CalendarRange, 
  ShieldCheck, 
  Award,
  ChevronRight,
  BookOpen
} from 'lucide-react';
import { trackEvent } from '../../services/analytics.ts';

interface CbsePhysicalEducationPageProps {
  onNavigate: (tab: any) => void;
  onOpenAuth?: () => void;
}

export const CbsePhysicalEducationPage: React.FC<CbsePhysicalEducationPageProps> = ({
  onNavigate,
  onOpenAuth
}) => {
  useEffect(() => {
    window.scrollTo(0, 0);
    trackEvent('screen_view_custom', { screen_name: 'cbse-physical-education' });

    // Scroll depth tracking
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight <= 0) return;
      const scrolledRatio = scrollY / docHeight;
      if (scrolledRatio >= 0.5 && !sessionStorage.getItem('scrolled_cbse_50')) {
        sessionStorage.setItem('scrolled_cbse_50', 'true');
        trackEvent('scroll_50', { page_location: '/cbse-physical-education', page_title: 'CBSE Physical Education Tools for Schools' });
      }
      if (scrolledRatio >= 0.9 && !sessionStorage.getItem('scrolled_cbse_90')) {
        sessionStorage.setItem('scrolled_cbse_90', 'true');
        trackEvent('scroll_90', { page_location: '/cbse-physical-education', page_title: 'CBSE Physical Education Tools for Schools' });
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleCtaClick = (ctaName: string, targetTab: string = 'dashboard') => {
    trackEvent('hero_cta_click', {
      cta_name: ctaName,
      page_location: '/cbse-physical-education',
      target_tab: targetTab
    });
    if (targetTab === 'auth' && onOpenAuth) {
      onOpenAuth();
    } else {
      onNavigate(targetTab);
    }
  };

  return (
    <div className="space-y-12 pb-20 text-slate-800">
      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="text-xs font-semibold text-slate-500 flex items-center gap-2">
        <button 
          onClick={() => onNavigate('dashboard')} 
          className="hover:text-blue-900 transition-colors flex items-center gap-1 font-bold"
        >
          Home
        </button>
        <ChevronRight size={14} />
        <span className="text-slate-900 font-bold">CBSE Physical Education Tools</span>
      </nav>

      {/* Hero Section */}
      <header className="relative bg-gradient-to-br from-[#0D2B52] to-[#164077] text-white rounded-[2.5rem] p-6 sm:p-10 md:p-12 border-4 border-slate-900 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#D4A017]/10 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="relative z-10 max-w-3xl space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#D4A017]/20 border border-[#D4A017]/40 rounded-full">
            <GraduationCap size={14} className="text-[#D4A017]" />
            <span className="text-[10px] font-black uppercase tracking-widest text-[#D4A017]">
              CBSE & NEP 2020 Physical Education Tools
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black font-display uppercase tracking-tight leading-tight">
            CBSE Physical Education Tools for Schools
          </h1>

          <p className="text-sm sm:text-base text-slate-200 leading-relaxed font-medium">
            SmartPE delivers structured digital tools for Indian schools following the CBSE physical education framework. From Strand 1–4 lesson planning and 30-mark Class 11 & 12 practical assessments to student fitness tracking and department record management.
          </p>

          <div className="pt-2 flex flex-wrap gap-3">
            <button
              onClick={() => handleCtaClick('cbse_hero_explore', 'planner')}
              className="px-6 py-3.5 bg-[#D4A017] hover:bg-[#e0b028] text-slate-950 font-black text-xs uppercase tracking-wider rounded-full shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] border-2 border-slate-900 flex items-center gap-2 transition-all cursor-pointer"
            >
              <span>Explore SmartPE</span>
              <ArrowRight size={16} />
            </button>
            <button
              onClick={() => handleCtaClick('cbse_hero_practical', 'cbse-practical')}
              className="px-6 py-3.5 bg-white/10 hover:bg-white/20 text-white font-black text-xs uppercase tracking-wider rounded-full border border-white/30 flex items-center gap-2 transition-all cursor-pointer"
            >
              <span>30-Mark Practical Hub</span>
            </button>
          </div>
        </div>
      </header>

      {/* Core Workflow Pillars */}
      <section className="space-y-6">
        <div className="text-left space-y-2">
          <span className="text-[11px] font-black uppercase tracking-widest text-[#D4A017]">CURRICULUM ALIGNMENT</span>
          <h2 className="text-2xl sm:text-3xl font-black text-[#0D2B52] font-display uppercase">
            Complete CBSE PE Department Workflow
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 max-w-2xl">
            Streamline everyday physical education duties across four key operational areas:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-2xl border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(13,43,82,1)] space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 border border-blue-300 flex items-center justify-center text-blue-900 font-bold">
              <BookOpen size={20} />
            </div>
            <h3 className="text-base font-black text-[#0D2B52] uppercase font-display">CBSE PE Lesson Planning</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Auto-generate structured daily and weekly PE lesson plans mapped to Strands 1, 2, 3, and 4 with specific warm-ups, safety protocols, drills, and rubrics.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(13,43,82,1)] space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-900 font-bold">
              <ClipboardCheck size={20} />
            </div>
            <h3 className="text-base font-black text-[#0D2B52] uppercase font-display">Practical Assessment (30M)</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Digital award sheets and rubric calculators for Class 11 and Class 12 CBSE Board practical examinations, including physical fitness tests, proficiency in games, and viva voce.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(13,43,82,1)] space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-900 font-bold">
              <Activity size={20} />
            </div>
            <h3 className="text-base font-black text-[#0D2B52] uppercase font-display">Student Fitness Records</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Maintain standardized student health cards, BMI metrics, aerobic capacity, agility, and motor fitness tracking compliant with national physical literacy guidelines.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(13,43,82,1)] space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 border border-purple-300 flex items-center justify-center text-purple-900 font-bold">
              <FileText size={20} />
            </div>
            <h3 className="text-base font-black text-[#0D2B52] uppercase font-display">PE Reports & Logs</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Inspection-ready sports reports for school principals, automated parent communication letters, substitute teacher rosters, and sports equipment inventory tracking.
            </p>
          </div>
        </div>
      </section>

      {/* CBSE Strands Breakdown */}
      <section className="bg-white rounded-3xl border-3 border-slate-900 p-6 md:p-8 space-y-6 shadow-[6px_6px_0px_0px_rgba(13,43,82,1)]">
        <div className="space-y-1">
          <span className="text-[10px] font-black uppercase tracking-widest text-[#D4A017]">CBSE CURRICULUM ARCHITECTURE</span>
          <h2 className="text-xl sm:text-2xl font-black text-[#0D2B52] uppercase font-display">
            Built Around CBSE Health & Physical Education Strands
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-start gap-3">
            <span className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs font-black shrink-0">1</span>
            <div>
              <h3 className="text-sm font-black text-[#0D2B52] uppercase">Strand 1: Athletics, Games & Sports</h3>
              <p className="text-xs text-slate-600 mt-1">Individual athletics, major team sports (football, basketball, cricket, volleyball), and fundamental movement progressions.</p>
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-start gap-3">
            <span className="w-7 h-7 rounded-lg bg-amber-600 text-white flex items-center justify-center text-xs font-black shrink-0">2</span>
            <div>
              <h3 className="text-sm font-black text-[#0D2B52] uppercase">Strand 2: Health, Fitness & Yoga</h3>
              <p className="text-xs text-slate-600 mt-1">Yoga asanas, pranayama, posture correction, nutritional hygiene, and cardiorespiratory endurance development.</p>
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-start gap-3">
            <span className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-xs font-black shrink-0">3</span>
            <div>
              <h3 className="text-sm font-black text-[#0D2B52] uppercase">Strand 3: SEWA (Social Empowerment)</h3>
              <p className="text-xs text-slate-600 mt-1">Student sports leadership, community physical activity campaigns, peer first-aid responders, and fair-play tournament administration.</p>
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-start gap-3">
            <span className="w-7 h-7 rounded-lg bg-purple-600 text-white flex items-center justify-center text-xs font-black shrink-0">4</span>
            <div>
              <h3 className="text-sm font-black text-[#0D2B52] uppercase">Strand 4: Health and Activity Card</h3>
              <p className="text-xs text-slate-600 mt-1">Continuous diagnostic health cards, baseline & midline assessments, and comprehensive physical literacy report cards.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Internal Cross-Linking Navigation */}
      <section className="bg-slate-100 rounded-3xl p-6 md:p-8 border-2 border-slate-300 space-y-4">
        <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
          Explore Related Physical Education Software Modules:
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={() => onNavigate('ai-pe-lesson-planner')}
            className="p-4 bg-white rounded-xl border border-slate-300 hover:border-slate-900 hover:shadow-md text-left transition-all group"
          >
            <span className="text-[10px] font-black text-[#D4A017] uppercase block">Module</span>
            <h3 className="text-xs font-black text-[#0D2B52] uppercase group-hover:text-blue-700">
              AI PE Lesson Planner &rarr;
            </h3>
            <p className="text-[11px] text-slate-500 mt-1">Generate 60-second structured PE lesson plans for CBSE classes.</p>
          </button>

          <button
            onClick={() => onNavigate('physical-education-assessment')}
            className="p-4 bg-white rounded-xl border border-slate-300 hover:border-slate-900 hover:shadow-md text-left transition-all group"
          >
            <span className="text-[10px] font-black text-[#D4A017] uppercase block">Module</span>
            <h3 className="text-xs font-black text-[#0D2B52] uppercase group-hover:text-blue-700">
              PE Assessment & Reports &rarr;
            </h3>
            <p className="text-[11px] text-slate-500 mt-1">Practical assessment rubrics, skill scoring, and student reports.</p>
          </button>

          <button
            onClick={() => onNavigate('khelo-india-fitness-assessment')}
            className="p-4 bg-white rounded-xl border border-slate-300 hover:border-slate-900 hover:shadow-md text-left transition-all group"
          >
            <span className="text-[10px] font-black text-[#D4A017] uppercase block">Module</span>
            <h3 className="text-xs font-black text-[#0D2B52] uppercase group-hover:text-blue-700">
              Khelo India Fitness Assessment &rarr;
            </h3>
            <p className="text-[11px] text-slate-500 mt-1">Manage student fitness assessment data and battery test scores.</p>
          </button>
        </div>
      </section>

      {/* Call to Action Footer Banner */}
      <footer className="bg-[#0D2B52] text-white p-8 rounded-[2rem] border-4 border-slate-900 shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] text-center space-y-4">
        <h2 className="text-2xl sm:text-3xl font-black uppercase font-display">
          Ready to Modernize Your CBSE Physical Education Department?
        </h2>
        <p className="text-xs sm:text-sm text-slate-200 max-w-xl mx-auto">
          Equip your physical education teachers with structured curriculum plans, digital practical award sheets, and automated fitness reports.
        </p>
        <button
          onClick={() => handleCtaClick('cbse_bottom_cta', 'planner')}
          className="px-8 py-4 bg-[#D4A017] hover:bg-[#e0b028] text-slate-950 font-black text-xs uppercase tracking-widest rounded-full shadow-lg border-2 border-slate-900 inline-flex items-center gap-2 cursor-pointer transition-all"
        >
          <span>Explore SmartPE</span>
          <ArrowRight size={16} />
        </button>
      </footer>
    </div>
  );
};

export default CbsePhysicalEducationPage;
