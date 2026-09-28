import React, { useEffect } from 'react';
import { 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  BookOpen, 
  ShieldCheck, 
  ChevronRight, 
  Target, 
  Layers, 
  Zap,
  CalendarRange
} from 'lucide-react';
import { trackEvent } from '../../services/analytics.ts';

interface AiLessonPlannerPageProps {
  onNavigate: (tab: any) => void;
  onOpenAuth?: () => void;
}

export const AiLessonPlannerPage: React.FC<AiLessonPlannerPageProps> = ({
  onNavigate,
  onOpenAuth
}) => {
  useEffect(() => {
    window.scrollTo(0, 0);
    trackEvent('screen_view_custom', { screen_name: 'ai-pe-lesson-planner' });

    // Scroll depth tracking
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight <= 0) return;
      const scrolledRatio = scrollY / docHeight;
      if (scrolledRatio >= 0.5 && !sessionStorage.getItem('scrolled_planner_50')) {
        sessionStorage.setItem('scrolled_planner_50', 'true');
        trackEvent('scroll_50', { page_location: '/ai-pe-lesson-planner', page_title: 'AI PE Lesson Planner for Physical Education Teachers' });
      }
      if (scrolledRatio >= 0.9 && !sessionStorage.getItem('scrolled_planner_90')) {
        sessionStorage.setItem('scrolled_planner_90', 'true');
        trackEvent('scroll_90', { page_location: '/ai-pe-lesson-planner', page_title: 'AI PE Lesson Planner for Physical Education Teachers' });
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleCtaClick = (ctaName: string, targetTab: string = 'planner') => {
    trackEvent('lesson_planner_click', {
      source: 'ai_planner_landing_page'
    });
    trackEvent('hero_cta_click', {
      cta_name: ctaName,
      page_location: '/ai-pe-lesson-planner',
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
        <span className="text-slate-900 font-bold">AI PE Lesson Planner</span>
      </nav>

      {/* Hero Section */}
      <header className="relative bg-gradient-to-br from-[#0D2B52] to-[#164077] text-white rounded-[2.5rem] p-6 sm:p-10 md:p-12 border-4 border-slate-900 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#D4A017]/15 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="relative z-10 max-w-3xl space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#D4A017]/20 border border-[#D4A017]/40 rounded-full">
            <Sparkles size={14} className="text-[#D4A017]" />
            <span className="text-[10px] font-black uppercase tracking-widest text-[#D4A017]">
              Smart Physical Education Planning
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black font-display uppercase tracking-tight leading-tight">
            AI Physical Education Lesson Planner
          </h1>

          <p className="text-sm sm:text-base text-slate-200 leading-relaxed font-medium">
            Generate structured, age-appropriate physical education lesson plans in under 60 seconds. SmartPE helps Indian PE teachers plan daily sports activities, organize term-wise curricula, and reduce administrative paperwork.
          </p>

          <div className="pt-2 flex flex-wrap gap-3">
            <button
              onClick={() => handleCtaClick('ai_hero_try', 'planner')}
              className="px-6 py-3.5 bg-[#D4A017] hover:bg-[#e0b028] text-slate-950 font-black text-xs uppercase tracking-wider rounded-full shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] border-2 border-slate-900 flex items-center gap-2 transition-all cursor-pointer"
            >
              <span>Try SmartPE</span>
              <ArrowRight size={16} />
            </button>
            <button
              onClick={() => handleCtaClick('ai_hero_yearly', 'yearly')}
              className="px-6 py-3.5 bg-white/10 hover:bg-white/20 text-white font-black text-xs uppercase tracking-wider rounded-full border border-white/30 flex items-center gap-2 transition-all cursor-pointer"
            >
              <span>40-Week Curriculum Planner</span>
            </button>
          </div>
        </div>
      </header>

      {/* Structured Lesson Architecture */}
      <section className="space-y-6">
        <div className="text-left space-y-2">
          <span className="text-[11px] font-black uppercase tracking-widest text-[#D4A017]">LESSON PLAN STRUCTURE</span>
          <h2 className="text-2xl sm:text-3xl font-black text-[#0D2B52] font-display uppercase">
            What Every Generated PE Lesson Plan Includes
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 max-w-2xl">
            Each lesson plan is formatted for easy field execution and school administrative review:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <div className="bg-white p-6 rounded-2xl border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(13,43,82,1)] space-y-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-900 flex items-center justify-center font-bold text-xs">1</div>
            <h3 className="text-sm font-black text-[#0D2B52] uppercase font-display">Dynamic Warm-Up</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              5–10 minute pulse-raisers, joint mobility routines, and sport-specific movement patterns designed to prevent injuries.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(13,43,82,1)] space-y-2">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-900 flex items-center justify-center font-bold text-xs">2</div>
            <h3 className="text-sm font-black text-[#0D2B52] uppercase font-display">Progressive Skill Drills</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Step-by-step fundamental mechanics, teaching cues, player positioning, and difficulty progressions (introductory to advanced).
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(13,43,82,1)] space-y-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-900 flex items-center justify-center font-bold text-xs">3</div>
            <h3 className="text-sm font-black text-[#0D2B52] uppercase font-display">Small-Sided Lead-Up Game</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Modified game situations to apply taught skills under active play, fostering teamwork and strategic decision-making.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(13,43,82,1)] space-y-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-900 flex items-center justify-center font-bold text-xs">4</div>
            <h3 className="text-sm font-black text-[#0D2B52] uppercase font-display">Cool-Down & Static Stretches</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Heart-rate recovery exercises and major muscle group stretches paired with a quick student reflection debrief.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(13,43,82,1)] space-y-2">
            <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-900 flex items-center justify-center font-bold text-xs">5</div>
            <h3 className="text-sm font-black text-[#0D2B52] uppercase font-display">Safety & Ground Precautions</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Equipment checks, spacing guidelines, hydration reminders, and weather-appropriate ground modifications.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(13,43,82,1)] space-y-2">
            <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-900 flex items-center justify-center font-bold text-xs">6</div>
            <h3 className="text-sm font-black text-[#0D2B52] uppercase font-display">Assessment Rubric & Outcomes</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Clear learning objectives and observable skill criteria to easily grade student progress and effort.
            </p>
          </div>
        </div>
      </section>

      {/* Broad Sports Library */}
      <section className="bg-slate-50 rounded-3xl border-2 border-slate-900 p-6 md:p-8 space-y-6">
        <div className="space-y-1">
          <span className="text-[10px] font-black uppercase tracking-widest text-[#D4A017]">CURRICULUM VERSATILITY</span>
          <h2 className="text-xl sm:text-2xl font-black text-[#0D2B52] uppercase font-display">
            Supports All Major Indian School Sports & Activities
          </h2>
          <p className="text-xs text-slate-600">
            Generate grade-aligned lesson plans across track, court, field, and indoor disciplines:
          </p>
        </div>

        <div className="flex flex-wrap gap-2 pt-2">
          {[
            'Track & Field (Athletics)',
            'Football / Soccer',
            'Basketball',
            'Cricket',
            'Badminton',
            'Volleyball',
            'Yoga & Pranayama',
            'Kho-Kho',
            'Kabaddi',
            'Table Tennis',
            'Handball',
            'Gymnastics Basics',
            'Aerobics & Fitness',
            'Indigenous Indian Games'
          ].map((sport, idx) => (
            <span 
              key={idx} 
              className="px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 shadow-xs"
            >
              {sport}
            </span>
          ))}
        </div>
      </section>

      {/* Internal Cross-Linking Navigation */}
      <section className="bg-slate-100 rounded-3xl p-6 md:p-8 border-2 border-slate-300 space-y-4">
        <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
          Explore Other SmartPE Physical Education Tools:
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={() => onNavigate('cbse-physical-education')}
            className="p-4 bg-white rounded-xl border border-slate-300 hover:border-slate-900 hover:shadow-md text-left transition-all group"
          >
            <span className="text-[10px] font-black text-[#D4A017] uppercase block">Module</span>
            <h3 className="text-xs font-black text-[#0D2B52] uppercase group-hover:text-blue-700">
              CBSE PE Tools for Schools &rarr;
            </h3>
            <p className="text-[11px] text-slate-500 mt-1">Strand mapping, practical exam rubrics, and CBSE department records.</p>
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

      {/* Call to Action Footer */}
      <footer className="bg-[#0D2B52] text-white p-8 rounded-[2rem] border-4 border-slate-900 shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] text-center space-y-4">
        <h2 className="text-2xl sm:text-3xl font-black uppercase font-display">
          Save Hours on Physical Education Lesson Planning
        </h2>
        <p className="text-xs sm:text-sm text-slate-200 max-w-xl mx-auto">
          Create structured, print-ready PE lesson plans customized to your school’s available equipment and grade level.
        </p>
        <button
          onClick={() => handleCtaClick('ai_bottom_try', 'planner')}
          className="px-8 py-4 bg-[#D4A017] hover:bg-[#e0b028] text-slate-950 font-black text-xs uppercase tracking-widest rounded-full shadow-lg border-2 border-slate-900 inline-flex items-center gap-2 cursor-pointer transition-all"
        >
          <span>Try SmartPE</span>
          <ArrowRight size={16} />
        </button>
      </footer>
    </div>
  );
};

export default AiLessonPlannerPage;
