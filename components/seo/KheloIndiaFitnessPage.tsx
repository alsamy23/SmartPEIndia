import React, { useEffect } from 'react';
import { 
  Activity, 
  Trophy, 
  ArrowRight, 
  CheckCircle2, 
  FileText, 
  ShieldCheck, 
  ChevronRight, 
  BarChart3, 
  Users, 
  Zap,
  BookOpen
} from 'lucide-react';
import { trackEvent } from '../../services/analytics.ts';

interface KheloIndiaFitnessPageProps {
  onNavigate: (tab: any) => void;
  onOpenAuth?: () => void;
}

export const KheloIndiaFitnessPage: React.FC<KheloIndiaFitnessPageProps> = ({
  onNavigate,
  onOpenAuth
}) => {
  useEffect(() => {
    window.scrollTo(0, 0);
    trackEvent('screen_view_custom', { screen_name: 'khelo-india-fitness-assessment' });

    // Scroll depth tracking
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight <= 0) return;
      const scrolledRatio = scrollY / docHeight;
      if (scrolledRatio >= 0.5 && !sessionStorage.getItem('scrolled_khelo_50')) {
        sessionStorage.setItem('scrolled_khelo_50', 'true');
        trackEvent('scroll_50', { page_location: '/khelo-india-fitness-assessment', page_title: 'Khelo India Fitness Assessment for Schools' });
      }
      if (scrolledRatio >= 0.9 && !sessionStorage.getItem('scrolled_khelo_90')) {
        sessionStorage.setItem('scrolled_khelo_90', 'true');
        trackEvent('scroll_90', { page_location: '/khelo-india-fitness-assessment', page_title: 'Khelo India Fitness Assessment for Schools' });
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleCtaClick = (ctaName: string, targetTab: string = 'fitness') => {
    trackEvent('fitness_assessment_click', {
      source: 'khelo_landing_page',
      assessment_type: 'khelo_battery'
    });
    trackEvent('hero_cta_click', {
      cta_name: ctaName,
      page_location: '/khelo-india-fitness-assessment',
      target_tab: targetTab
    });
    onNavigate(targetTab);
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
        <span className="text-slate-900 font-bold">Khelo India Fitness Assessment</span>
      </nav>

      {/* Hero Section */}
      <header className="relative bg-gradient-to-br from-[#0D2B52] to-[#164077] text-white rounded-[2.5rem] p-6 sm:p-10 md:p-12 border-4 border-slate-900 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="relative z-10 max-w-3xl space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-400/20 border border-emerald-400/40 rounded-full">
            <Activity size={14} className="text-emerald-400" />
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-300">
              Student Fitness Assessment Platform
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black font-display uppercase tracking-tight leading-tight">
            Khelo India Fitness Assessment for Schools
          </h1>

          <p className="text-sm sm:text-base text-slate-200 leading-relaxed font-medium">
            Manage student fitness assessment data using SmartPE. Easily record official Sports Authority of India (SAI) battery test parameters, calculate student percentiles and ratings instantly, and generate inspection-ready school fitness report cards.
          </p>

          <div className="pt-2 flex flex-wrap gap-3">
            <button
              onClick={() => handleCtaClick('khelo_hero_explore', 'fitness')}
              className="px-6 py-3.5 bg-[#D4A017] hover:bg-[#e0b028] text-slate-950 font-black text-xs uppercase tracking-wider rounded-full shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] border-2 border-slate-900 flex items-center gap-2 transition-all cursor-pointer"
            >
              <span>Explore Fitness Assessment</span>
              <ArrowRight size={16} />
            </button>
            <button
              onClick={() => handleCtaClick('khelo_hero_battery', 'khelo')}
              className="px-6 py-3.5 bg-white/10 hover:bg-white/20 text-white font-black text-xs uppercase tracking-wider rounded-full border border-white/30 flex items-center gap-2 transition-all cursor-pointer"
            >
              <span>Khelo India Battery Portal</span>
            </button>
          </div>
        </div>
      </header>

      {/* How SmartPE Helps Schools */}
      <section className="space-y-6">
        <div className="text-left space-y-2">
          <span className="text-[11px] font-black uppercase tracking-widest text-[#D4A017]">BATTERY TEST PROTOCOLS</span>
          <h2 className="text-2xl sm:text-3xl font-black text-[#0D2B52] font-display uppercase">
            Record, Organize and Report Student Fitness Data
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 max-w-2xl">
            SmartPE enables PE teachers to conduct paperless field assessments for both primary and senior school age groups:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Age Group 5-8 */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border-3 border-slate-900 shadow-[6px_6px_0px_0px_rgba(13,43,82,1)] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b-2 border-slate-200">
              <span className="px-3 py-1 bg-amber-100 text-amber-900 rounded-full font-black text-xs uppercase">Class 1 to 3</span>
              <span className="text-xs font-bold text-slate-500">Age 5–8 Years</span>
            </div>
            <h3 className="text-lg font-black text-[#0D2B52] uppercase font-display">Foundation Fitness Battery</h3>
            <ul className="space-y-2.5 text-xs text-slate-700">
              <li className="flex items-start gap-2">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Body Composition (BMI):</strong> Height (cm) and Weight (kg) measurement with age-gender norm benchmarking.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Flamingo Balance Test:</strong> Static balance on preferred foot to evaluate posture and stability.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Plate Tapping Test:</strong> Speed and limb coordination assessment over 25 cycles.</span>
              </li>
            </ul>
          </div>

          {/* Age Group 9-18+ */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border-3 border-slate-900 shadow-[6px_6px_0px_0px_rgba(13,43,82,1)] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b-2 border-slate-200">
              <span className="px-3 py-1 bg-blue-100 text-blue-900 rounded-full font-black text-xs uppercase">Class 4 to 12</span>
              <span className="text-xs font-bold text-slate-500">Age 9–18+ Years</span>
            </div>
            <h3 className="text-lg font-black text-[#0D2B52] uppercase font-display">Comprehensive Fitness Battery</h3>
            <ul className="space-y-2.5 text-xs text-slate-700">
              <li className="flex items-start gap-2">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>50m Dash (Standing Start):</strong> Measures sprint speed and acceleration power.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>600m Run / Walk:</strong> Assesses aerobic cardiorespiratory endurance.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Sit & Reach Test:</strong> Measures hamstring and lower back flexibility.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Partial Curl-Ups (30s):</strong> Core abdominal strength and endurance.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Push-Ups / Modified Push-Ups:</strong> Upper body muscular strength and endurance.</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Key Advantages */}
      <section className="bg-slate-50 rounded-3xl border-2 border-slate-900 p-6 md:p-8 space-y-6">
        <div className="space-y-1">
          <span className="text-[10px] font-black uppercase tracking-widest text-[#D4A017]">EFFICIENCY & REPORTING</span>
          <h2 className="text-xl sm:text-2xl font-black text-[#0D2B52] uppercase font-display">
            Why Indian Schools Choose SmartPE for Fitness Tracking
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-2">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-900 flex items-center justify-center font-bold">
              <Zap size={18} />
            </div>
            <h3 className="text-sm font-black text-[#0D2B52] uppercase">Instant Rating Calculation</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Automatic scoring, percentile assignment, and rating bands (Needs Work, Fair, Good, Excellent) as per standard youth fitness norms.
            </p>
          </div>

          <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-900 flex items-center justify-center font-bold">
              <FileText size={18} />
            </div>
            <h3 className="text-sm font-black text-[#0D2B52] uppercase">Print-Ready Report Cards</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Generate individual student physical literacy report cards complete with radar charts, benchmark badges, and teacher feedback.
            </p>
          </div>

          <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-2">
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-900 flex items-center justify-center font-bold">
              <BarChart3 size={18} />
            </div>
            <h3 className="text-sm font-black text-[#0D2B52] uppercase">School-Wide Analytics</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Class-by-class fitness distribution charts to help coordinators and school leadership monitor physical well-being across grades.
            </p>
          </div>
        </div>
      </section>

      {/* Internal Cross-Linking Navigation */}
      <section className="bg-slate-100 rounded-3xl p-6 md:p-8 border-2 border-slate-300 space-y-4">
        <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
          Explore Other Physical Education Software Features:
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={() => onNavigate('physical-education-assessment')}
            className="p-4 bg-white rounded-xl border border-slate-300 hover:border-slate-900 hover:shadow-md text-left transition-all group"
          >
            <span className="text-[10px] font-black text-[#D4A017] uppercase block">Module</span>
            <h3 className="text-xs font-black text-[#0D2B52] uppercase group-hover:text-blue-700">
              PE Assessment & Reports &rarr;
            </h3>
            <p className="text-[11px] text-slate-500 mt-1">Classroom and field sports assessment rubrics & student report cards.</p>
          </button>

          <button
            onClick={() => onNavigate('cbse-physical-education')}
            className="p-4 bg-white rounded-xl border border-slate-300 hover:border-slate-900 hover:shadow-md text-left transition-all group"
          >
            <span className="text-[10px] font-black text-[#D4A017] uppercase block">Module</span>
            <h3 className="text-xs font-black text-[#0D2B52] uppercase group-hover:text-blue-700">
              CBSE PE Tools for Schools &rarr;
            </h3>
            <p className="text-[11px] text-slate-500 mt-1">Curriculum planning, practical assessments (30M), and department workflow.</p>
          </button>

          <button
            onClick={() => onNavigate('ai-pe-lesson-planner')}
            className="p-4 bg-white rounded-xl border border-slate-300 hover:border-slate-900 hover:shadow-md text-left transition-all group"
          >
            <span className="text-[10px] font-black text-[#D4A017] uppercase block">Module</span>
            <h3 className="text-xs font-black text-[#0D2B52] uppercase group-hover:text-blue-700">
              AI PE Lesson Planner &rarr;
            </h3>
            <p className="text-[11px] text-slate-500 mt-1">Structured 60-second lesson planning with safety and skill drills.</p>
          </button>
        </div>
      </section>

      {/* Call to Action Footer */}
      <footer className="bg-[#0D2B52] text-white p-8 rounded-[2rem] border-4 border-slate-900 shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] text-center space-y-4">
        <h2 className="text-2xl sm:text-3xl font-black uppercase font-display">
          Start Managing Student Fitness Assessment Data Today
        </h2>
        <p className="text-xs sm:text-sm text-slate-200 max-w-xl mx-auto">
          Test battery scores, evaluate physical literacy, and deliver colorful student fitness report cards in minutes.
        </p>
        <button
          onClick={() => handleCtaClick('khelo_bottom_cta', 'fitness')}
          className="px-8 py-4 bg-[#D4A017] hover:bg-[#e0b028] text-slate-950 font-black text-xs uppercase tracking-widest rounded-full shadow-lg border-2 border-slate-900 inline-flex items-center gap-2 cursor-pointer transition-all"
        >
          <span>Explore Fitness Assessment</span>
          <ArrowRight size={16} />
        </button>
      </footer>
    </div>
  );
};

export default KheloIndiaFitnessPage;
