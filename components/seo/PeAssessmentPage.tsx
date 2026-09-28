import React, { useEffect } from 'react';
import { 
  ClipboardCheck, 
  FileText, 
  ArrowRight, 
  CheckCircle2, 
  Activity, 
  Award, 
  ChevronRight, 
  BarChart2, 
  Users, 
  ShieldCheck,
  Zap
} from 'lucide-react';
import { trackEvent } from '../../services/analytics.ts';

interface PeAssessmentPageProps {
  onNavigate: (tab: any) => void;
  onOpenAuth?: () => void;
}

export const PeAssessmentPage: React.FC<PeAssessmentPageProps> = ({
  onNavigate,
  onOpenAuth
}) => {
  useEffect(() => {
    window.scrollTo(0, 0);
    trackEvent('screen_view_custom', { screen_name: 'physical-education-assessment' });

    // Scroll depth tracking
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight <= 0) return;
      const scrolledRatio = scrollY / docHeight;
      if (scrolledRatio >= 0.5 && !sessionStorage.getItem('scrolled_pe_assess_50')) {
        sessionStorage.setItem('scrolled_pe_assess_50', 'true');
        trackEvent('scroll_50', { page_location: '/physical-education-assessment', page_title: 'Physical Education Assessment and Student Fitness Reports' });
      }
      if (scrolledRatio >= 0.9 && !sessionStorage.getItem('scrolled_pe_assess_90')) {
        sessionStorage.setItem('scrolled_pe_assess_90', 'true');
        trackEvent('scroll_90', { page_location: '/physical-education-assessment', page_title: 'Physical Education Assessment and Student Fitness Reports' });
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleCtaClick = (ctaName: string, targetTab: string = 'fitness') => {
    trackEvent('assessment_click', {
      source: 'pe_assessment_landing_page',
      assessment_type: 'comprehensive_pe_assessment'
    });
    trackEvent('hero_cta_click', {
      cta_name: ctaName,
      page_location: '/physical-education-assessment',
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
        <span className="text-slate-900 font-bold">Physical Education Assessment</span>
      </nav>

      {/* Hero Section */}
      <header className="relative bg-gradient-to-br from-[#0D2B52] to-[#164077] text-white rounded-[2.5rem] p-6 sm:p-10 md:p-12 border-4 border-slate-900 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#D4A017]/10 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="relative z-10 max-w-3xl space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#D4A017]/20 border border-[#D4A017]/40 rounded-full">
            <ClipboardCheck size={14} className="text-[#D4A017]" />
            <span className="text-[10px] font-black uppercase tracking-widest text-[#D4A017]">
              Student Assessment & Reporting System
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black font-display uppercase tracking-tight leading-tight">
            Physical Education Assessment and Student Fitness Reports
          </h1>

          <p className="text-sm sm:text-base text-slate-200 leading-relaxed font-medium">
            SmartPE brings together student fitness testing, sports skill assessment rubrics, CBSE 30-mark practical examination scoring, and printable student progress report cards into one school-ready platform.
          </p>

          <div className="pt-2 flex flex-wrap gap-3">
            <button
              onClick={() => handleCtaClick('pe_assess_hero_explore', 'fitness')}
              className="px-6 py-3.5 bg-[#D4A017] hover:bg-[#e0b028] text-slate-950 font-black text-xs uppercase tracking-wider rounded-full shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] border-2 border-slate-900 flex items-center gap-2 transition-all cursor-pointer"
            >
              <span>Explore SmartPE</span>
              <ArrowRight size={16} />
            </button>
            <button
              onClick={() => handleCtaClick('pe_assess_hero_reports', 'fitness-reports')}
              className="px-6 py-3.5 bg-white/10 hover:bg-white/20 text-white font-black text-xs uppercase tracking-wider rounded-full border border-white/30 flex items-center gap-2 transition-all cursor-pointer"
            >
              <span>Sample Report Cards</span>
            </button>
          </div>
        </div>
      </header>

      {/* Assessment Modules Grid */}
      <section className="space-y-6">
        <div className="text-left space-y-2">
          <span className="text-[11px] font-black uppercase tracking-widest text-[#D4A017]">ASSESSMENT CAPABILITIES</span>
          <h2 className="text-2xl sm:text-3xl font-black text-[#0D2B52] font-display uppercase">
            Comprehensive PE Assessment in One Platform
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 max-w-2xl">
            Evaluate physical fitness, skill mechanics, and official board curriculum requirements with clarity:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <div className="bg-white p-6 rounded-2xl border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(13,43,82,1)] space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-900 flex items-center justify-center font-bold">
              <Activity size={20} />
            </div>
            <h3 className="text-base font-black text-[#0D2B52] uppercase font-display">Student Fitness Assessment</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Record standardized fitness tests: BMI, aerobic endurance (600m), speed (50m dash), flexibility (Sit & Reach), and core strength (Curl-ups) with automatic rating percentiles.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(13,43,82,1)] space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-900 flex items-center justify-center font-bold">
              <ClipboardCheck size={20} />
            </div>
            <h3 className="text-base font-black text-[#0D2B52] uppercase font-display">PE Practical Assessment</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Complete digital scoring sheets for Class 11 and 12 CBSE 30-mark practical exams, including physical fitness test scoring, game proficiency evaluations, and viva mark registers.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(13,43,82,1)] space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center font-bold">
              <Award size={20} />
            </div>
            <h3 className="text-base font-black text-[#0D2B52] uppercase font-display">Sports Skill Rubrics</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Graded skill checklists for athletics, football, basketball, cricket, badminton, and yoga to measure technique mechanics and movement execution objectively.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(13,43,82,1)] space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-900 flex items-center justify-center font-bold">
              <Users size={20} />
            </div>
            <h3 className="text-base font-black text-[#0D2B52] uppercase font-display">Cumulative Student Records</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Maintain longitudinal physical education records across academic terms with baseline, midline, and year-end comparison data.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(13,43,82,1)] space-y-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-900 flex items-center justify-center font-bold">
              <FileText size={20} />
            </div>
            <h3 className="text-base font-black text-[#0D2B52] uppercase font-display">Printable Fitness Reports</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Generate student fitness report cards with visual radar graphs, percentile ratings, teacher notes, and personalized lifestyle recommendations for parents.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(13,43,82,1)] space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-900 flex items-center justify-center font-bold">
              <BarChart2 size={20} />
            </div>
            <h3 className="text-base font-black text-[#0D2B52] uppercase font-display">PE Department Reporting</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Instant class-wise wellness breakdowns and sports inspection summaries for PE HODs and school principals to review physical education health metrics.
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
            onClick={() => onNavigate('khelo-india-fitness-assessment')}
            className="p-4 bg-white rounded-xl border border-slate-300 hover:border-slate-900 hover:shadow-md text-left transition-all group"
          >
            <span className="text-[10px] font-black text-[#D4A017] uppercase block">Module</span>
            <h3 className="text-xs font-black text-[#0D2B52] uppercase group-hover:text-blue-700">
              Khelo India Fitness Assessment &rarr;
            </h3>
            <p className="text-[11px] text-slate-500 mt-1">Manage student fitness assessment data and battery test scores.</p>
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
          Elevate Your Physical Education Assessments
        </h2>
        <p className="text-xs sm:text-sm text-slate-200 max-w-xl mx-auto">
          Assess sports skills, automate physical fitness calculations, and provide parents with meaningful physical literacy report cards.
        </p>
        <button
          onClick={() => handleCtaClick('pe_assess_bottom_explore', 'fitness')}
          className="px-8 py-4 bg-[#D4A017] hover:bg-[#e0b028] text-slate-950 font-black text-xs uppercase tracking-widest rounded-full shadow-lg border-2 border-slate-900 inline-flex items-center gap-2 cursor-pointer transition-all"
        >
          <span>Explore SmartPE</span>
          <ArrowRight size={16} />
        </button>
      </footer>
    </div>
  );
};

export default PeAssessmentPage;
