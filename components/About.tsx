import React from 'react';
import { motion } from 'motion/react';
import { Award, GraduationCap, Globe, Shield, Sparkles, Send, Mail, CheckCircle2, ChevronRight, MessageSquare } from 'lucide-react';

interface AboutProps {
  onNavigate?: (tab: any) => void;
}

const About: React.FC<AboutProps> = ({ onNavigate }) => {
  return (
    <div className="space-y-16 pb-32 overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative rounded-[2.5rem] md:rounded-[4rem] bg-white border-4 border-slate-900 p-8 md:p-20 shadow-[12px_12px_0px_0px_rgba(10,28,42,1)] overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] -mr-48 -mt-48 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-orange-500/10 rounded-full blur-[100px] -ml-48 -mb-48 pointer-events-none"></div>
        
        <div className="relative z-10 max-w-4xl space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-orange-500/10 border-2 border-orange-500/20 rounded-full text-xs font-black uppercase text-orange-600 tracking-widest">
            <Sparkles size={14} />
            <span>About smartpeindia</span>
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black text-slate-900 tracking-tighter leading-[0.9] uppercase">
            Built by an <span className="text-[#005BFF]">educator</span>.<br/>
            For <span className="text-[#FF6B00]">PE teachers</span>.
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-slate-600 max-w-3xl leading-relaxed font-semibold">
            smartpeindia is the daily operating system for a school's PE department — lesson plans, fitness data, classroom tools, reports and parent communication, in one app. It exists because the person who built it has spent years in PE staffrooms across India and abroad, and knew exactly what the job needs.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
            <button
              onClick={() => onNavigate?.('planner')}
              className="w-full sm:w-auto px-8 py-5 bg-[#FF6B00] text-white rounded-2xl font-black text-xs uppercase tracking-widest border-2 border-slate-900 hover:bg-orange-600 hover:-translate-y-1 active:translate-y-0 transition-all shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] flex items-center justify-center gap-3"
            >
              <span>Start Planning — Free</span>
              <ChevronRight size={16} />
            </button>
            <button
              onClick={() => onNavigate?.('contact')}
              className="w-full sm:w-auto px-8 py-5 bg-white text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest border-2 border-slate-900 hover:bg-slate-50 hover:shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] transition-all flex items-center justify-center gap-3"
            >
              <MessageSquare size={16} />
              <span>Talk to the team</span>
            </button>
          </div>
        </div>
      </section>

      {/* Meet the Founder Section */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Left biography */}
        <div className="lg:col-span-7 bg-white p-8 md:p-12 rounded-[2.5rem] border-4 border-slate-900 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] space-y-6">
          <div className="space-y-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#005BFF]">01. OUR FOUNDER</span>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight uppercase leading-snug">
              Built by a qualified educator — for every PE teacher in India.
            </h2>
          </div>

          <div className="space-y-4 text-slate-600 font-semibold leading-relaxed text-sm md:text-base">
            <p>
              smartpeindia is built by <strong className="text-slate-950 font-black">L. Samy</strong> — a qualified physical educator holding the highest academic qualifications in the field: <span className="bg-amber-100 text-[#001D3D] px-2 py-0.5 rounded font-black text-xs">B.P.E.S</span>, <span className="bg-amber-100 text-[#001D3D] px-2 py-0.5 rounded font-black text-xs">M.P.Ed</span>, <span className="bg-amber-100 text-[#001D3D] px-2 py-0.5 rounded font-black text-xs">M.Phil</span>, and a <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded font-black text-xs">Post-Graduate Diploma in Yoga</span>. With international exposure and hands-on experience across multiple school boards, L. Samy knows what works in the classroom — and what wastes a teacher's time.
            </p>
            <p>
              smartpeindia was built out of that direct experience: a clean, purpose-driven tool to help every PE teacher plan better lessons, run smarter classes, and turn paperwork into an organized platform. No committees. No consultants. A working educator building the tool they wished they had — and giving it away free to every PE teacher in India.
            </p>
          </div>

          {/* Academic Badges */}
          <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-100">
            {['B.P.E.S, M.P.Ed, M.Phil', 'PG Diploma in Yoga', 'International Exposure', 'NEP 2020 curriculum expertise'].map((badge, idx) => (
              <span key={idx} className="px-3.5 py-1.5 bg-slate-100 rounded-full text-xs font-black text-slate-800 uppercase tracking-wider border border-slate-200">
                {badge}
              </span>
            ))}
          </div>
        </div>

        {/* Right feature cards mimicking the mockup */}
        <div className="lg:col-span-5 space-y-6">
          {[
            {
              icon: GraduationCap,
              color: 'text-indigo-600 bg-indigo-50 border-indigo-100',
              title: 'Academic depth',
              desc: 'Built by a physical educator hold high level qualification in B.P.E.S, M.P.Ed, M.Phil, and a PG Diploma in Yoga'
            },
            {
              icon: Globe,
              color: 'text-[#FF6B00] bg-orange-50 border-orange-100',
              title: 'Cross-border experience',
              desc: 'Based on teaching and coaching across India and abroad — uniting global standards with Indian school ground realities'
            },
            {
              icon: Award,
              color: 'text-emerald-600 bg-emerald-50 border-emerald-100',
              title: 'Curriculum-first',
              desc: 'Aligned with CBSE Physical Education, ICSE guidelines, NEP 2020, and Khelo India–aligned fitness testing protocols'
            },
            {
              icon: Shield,
              color: 'text-cyan-600 bg-cyan-50 border-cyan-100',
              title: 'Free for teachers',
              desc: 'Core PE planning and assessment tools are free for teachers. Funded by optional school workspace plans, never commercial ads'
            }
          ].map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <div 
                key={idx} 
                className="bg-white p-6 rounded-3xl border-2 border-slate-300 hover:border-slate-900 transition-all shadow-[4px_4px_0px_0px_rgba(15,23,42,0.05)] hover:shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] flex gap-4"
              >
                <div className={`w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center border font-black ${feature.color}`}>
                  <Icon size={20} />
                </div>
                <div className="space-y-1">
                  <h4 className="font-black text-slate-905 uppercase tracking-wide text-sm">{feature.title}</h4>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">{feature.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Give evenings back block (Deep Dark Navy Blue background) */}
      <section className="bg-[#001D3D] text-white rounded-[3rem] p-8 md:p-16 border-4 border-slate-900 shadow-[12px_12px_0px_0px_rgba(15,23,42,1)] overflow-hidden relative">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/10 rounded-full blur-[80px] pointer-events-none"></div>
        
        <div className="relative z-10 max-w-4xl space-y-6 mb-12">
          <span className="px-4 py-1.5 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-widest inline-block text-[#FF6B00]">02. OUR MISSION</span>
          <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight leading-[1.1]">
            Give every Indian PE teacher <br className="hidden sm:block" />
            their evenings back.
          </h2>
          <p className="text-slate-300 text-sm md:text-base font-medium max-w-3xl leading-relaxed">
            A PE teacher in an Indian school is, on a given day, a coach, curriculum planner, data analyst, parent liaison, and event manager — usually with limited budget for digital tools. smartpeindia consolidates that whole workflow into one mobile-first PE digital platform with free core teacher tools. That's the entire mission.
          </p>
        </div>

        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              title: "Teachers first",
              desc: "Every feature begins with one question — does it save a PE teacher their evening train of paperwork?"
            },
            {
              title: "Curriculum-honest",
              desc: "No fluff. Pure academic plans, drills, benchmarks, structured schedules, correct period timings and safety notes."
            },
            {
              title: "Mobile-respecting",
              desc: "Most PE teachers plan on a phone between running on physical grounds. The app is crafted with mobile-first precision."
            },
            {
              title: "Quietly Indian",
              desc: "Aligned by default with CBSE/ICSE framework requirements and Khelo India testing Protocols."
            }
          ].map((item, idx) => (
            <div key={idx} className="p-6 bg-white/5 border border-white/10 rounded-2xl flex flex-col justify-between hover:bg-white/10 transition-colors">
              <h4 className="font-black text-white uppercase tracking-wider text-xs mb-3 border-b border-white/10 pb-2">{item.title}</h4>
              <p className="text-[11px] text-slate-300 font-medium leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* School-grade layout disclaimer */}
      <section className="bg-slate-50 border-4 border-slate-900 border-dashed rounded-[3rem] p-8 md:p-12 text-center max-w-3xl mx-auto space-y-4">
        <h3 className="font-black text-slate-900 uppercase tracking-tight text-lg">School-grade by design, not by marketing.</h3>
        <p className="text-xs text-slate-500 font-semibold leading-relaxed">
          We pride ourselves on solid engineering. There are no distracting ads, no selling of student data, and no useless bells and whistles. Only physical education, digitized with care.
        </p>
      </section>
    </div>
  );
};

export default About;
