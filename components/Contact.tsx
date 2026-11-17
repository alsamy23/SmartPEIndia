import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, CheckCircle2, MessageSquare, AlertCircle, FileText, Send, HelpCircle, Loader2 } from 'lucide-react';
import { BRAND_EMAILS } from '../types';
import { reportUserFeedback } from '../services/telemetryService.ts';
import { toast } from '../services/toast.ts';

interface ContactProps {
  onNavigate?: (tab: any) => void;
}

const Contact: React.FC<ContactProps> = ({ onNavigate }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: BRAND_EMAILS.contact, // default destination email
    senderEmail: '',
    schoolName: '',
    topic: 'Support',
    message: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const resetTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (resetTimerRef.current !== null) {
        window.clearTimeout(resetTimerRef.current);
      }
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await reportUserFeedback(
        formData.message.trim(),
        formData.senderEmail.trim(),
        {
          name: formData.name.trim(),
          schoolName: formData.schoolName.trim(),
          topic: formData.topic,
          module: 'Contact Page'
        }
      );
      setSubmitted(true);
      toast.success('Message delivered directly to the SmartPE India team!');
      if (resetTimerRef.current !== null) {
        window.clearTimeout(resetTimerRef.current);
      }
      resetTimerRef.current = window.setTimeout(() => {
        setSubmitted(false);
        setFormData({
          name: '',
          email: BRAND_EMAILS.contact,
          senderEmail: '',
          schoolName: '',
          topic: 'Support',
          message: ''
        });
      }, 4000);
    } catch (err: any) {
      console.error('Contact form submission failed:', err);
      toast.error('Could not submit message right now. Please email us directly.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-16 pb-32 overflow-x-hidden">
      {/* Contact Hero Segment */}
      <section className="relative rounded-[2.5rem] md:rounded-[4rem] bg-white border-4 border-slate-900 p-8 md:p-20 shadow-[12px_12px_0px_0px_rgba(10,28,42,1)] overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-[100px] -mr-48 -mt-48 pointer-events-none"></div>
        
        <div className="relative z-10 max-w-4xl space-y-6">
          <span className="px-4 py-1.5 bg-amber-500/10 border-2 border-orange-500/20 rounded-full text-xs font-black uppercase text-[#FF6B00] tracking-widest inline-block">
            Support & Collaboration
          </span>
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black text-slate-900 tracking-tighter leading-[0.9] uppercase">
            Talk to a <br className="hidden sm:block" />
            <span className="text-[#FF6B00]">real educator</span>.
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-slate-600 max-w-3xl leading-relaxed font-semibold">
            Whether you're a PE teacher with a question, a principal looking to roll this out across a school, or a colleague who spotted a bug — your message goes straight to the educator who builds and maintains the platform.
          </p>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-4">
            <a 
              href={`mailto:${BRAND_EMAILS.contact}`}
              className="px-6 py-4 bg-[#0A1C2A] text-white rounded-2xl font-black text-xs uppercase tracking-widest border-2 border-slate-900 hover:bg-slate-800 transition-all shadow-[4px_4px_0px_0px_rgba(255,107,0,0.2)] flex items-center gap-3"
            >
              <Mail size={18} className="text-[#FF6B00]" />
              <span>{BRAND_EMAILS.contact}</span>
            </a>
            <span className="text-xs font-black uppercase tracking-widest text-slate-400">
              ⚡ Typical response within 12 working hours
            </span>
          </div>
        </div>
      </section>

      {/* Grid of Reasons to Write */}
      <section className="space-y-8">
        <div className="text-center md:text-left space-y-2">
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#005BFF]">Channels</span>
          <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight">One inbox. Four reasons to write.</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              num: "01",
              title: "General enquiries",
              desc: "Questions about school rollouts, board integration talks, seminars, or standard feature permissions.",
              email: BRAND_EMAILS.info
            },
            {
              num: "02",
              title: "Teacher support",
              desc: "Account management, class sign-in, or custom metrics calculations help is free for working PE teachers.",
              email: BRAND_EMAILS.contact
            },
            {
              num: "03",
              title: "Bug reports",
              desc: "Spotted a glitch on active screens? Submit details immediately to the developer for a near-instant hotfix.",
              email: BRAND_EMAILS.admin
            },
            {
              num: "04",
              title: "Feature requests",
              desc: "A specific sport diagram or special national test battery you want added? Let us know.",
              email: BRAND_EMAILS.contact
            }
          ].map((item, idx) => (
            <div 
              key={idx} 
              className="bg-white p-6 rounded-3xl border-2 border-slate-300 hover:border-slate-900 transition-all hover:shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] flex flex-col justify-between"
            >
              <div className="space-y-4">
                <span className="text-lg font-black text-slate-300 block">{item.num}</span>
                <h4 className="font-black text-slate-900 uppercase tracking-wider text-sm">{item.title}</h4>
                <p className="text-xs text-slate-500 font-semibold leading-relaxed">{item.desc}</p>
              </div>
              <div className="pt-4 border-t border-slate-100 mt-6 flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400">{item.email}</span>
                <a 
                  href={`mailto:${item.email}?subject=[smartpeindia] ${item.title}`}
                  className="text-xs font-black text-[#FF6B00] hover:text-[#005BFF] transition-colors uppercase tracking-wider inline-flex items-center gap-1.5"
                >
                  <span>Email</span>
                  <span>&rarr;</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Form & Disclaimer row */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
        {/* Left Form */}
        <div className="lg:col-span-7 bg-[#001D3D] text-white p-8 md:p-12 rounded-[2.5rem] border-4 border-slate-900 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] space-y-6">
          <div className="space-y-2">
            <span className="text-[10px] font-black uppercase text-[#FF6B00] tracking-widest">FEEDBACK & ACCIDENT REPORTS</span>
            <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tight">Found a glitch? Tell us — we fix fast.</h3>
            <p className="text-slate-300 text-xs font-medium max-w-xl">
              smartpeindia is built and maintained by a senior educator who ships product daily. There is no support ticket queue, no third-party contractor handover — your report goes right to the creator.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-300 block mb-1 tracking-wider">Your Name</label>
                <input 
                  type="text" 
                  required
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  placeholder="L. Samy"
                  className="w-full bg-white/5 border-2 border-white/15 focus:border-[#FF6B00] rounded-xl px-4 py-3 text-sm text-white outline-none transition-colors"
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-slate-300 block mb-1 tracking-wider">Your Email</label>
                <input 
                  type="email" 
                  required
                  value={formData.senderEmail}
                  onChange={e => setFormData({...formData, senderEmail: e.target.value})}
                  placeholder="samy@school.edu.in"
                  className="w-full bg-white/5 border-2 border-white/15 focus:border-[#FF6B00] rounded-xl px-4 py-3 text-sm text-white outline-none transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-300 block mb-1 tracking-wider">School/College Name</label>
                <input 
                  type="text" 
                  value={formData.schoolName}
                  onChange={e => setFormData({...formData, schoolName: e.target.value})}
                  placeholder="Public PE Academy"
                  className="w-full bg-white/5 border-2 border-white/15 focus:border-[#FF6B00] rounded-xl px-4 py-3 text-sm text-white outline-none transition-colors"
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-slate-300 block mb-1 tracking-wider">Subject / Purpose</label>
                <select 
                  value={formData.topic}
                  onChange={e => setFormData({...formData, topic: e.target.value})}
                  className="w-full bg-slate-900 border-2 border-white/15 focus:border-[#FF6B00] rounded-xl px-4 py-3 text-sm text-white outline-none transition-colors"
                >
                  <option value="Support">Account Support</option>
                  <option value="Bug">Report a Bug / Glitch</option>
                  <option value="Feature">Suggest sports feature</option>
                  <option value="School">School/Roster Setup</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase text-slate-300 block mb-1 tracking-wider">Your message</label>
              <textarea 
                rows={4}
                required
                value={formData.message}
                onChange={e => setFormData({...formData, message: e.target.value})}
                placeholder="Give us details or context directly..."
                className="w-full bg-white/5 border-2 border-white/15 focus:border-[#FF6B00] rounded-xl px-4 py-3 text-sm text-white outline-none transition-colors resize-none"
              />
            </div>

            <button 
              type="submit"
              disabled={isSubmitting || submitted}
              className="w-full py-4 bg-[#FF6B00] text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-orange-600 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  <span>Sending message...</span>
                </>
              ) : submitted ? (
                <>
                  <CheckCircle2 size={16} className="text-white" />
                  <span>Message Sent Successfully!</span>
                </>
              ) : (
                <>
                  <Send size={16} />
                  <span>Send direct message</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Disclaimer Card */}
        <div className="lg:col-span-5 bg-white p-8 md:p-10 rounded-[2.5rem] border-4 border-slate-900 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] flex flex-col justify-between">
          <div className="space-y-6">
            <span className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center text-[#FF6B00] font-black border border-orange-200">
              <AlertCircle size={22} />
            </span>
            <h4 className="font-black text-slate-900 uppercase tracking-tight text-lg">Quietly responsible.</h4>
            <ul className="space-y-4 text-xs font-semibold text-slate-600 leading-relaxed list-none">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 size={16} className="text-[#FF6B00] flex-shrink-0 mt-0.5" />
                <span>We only collect minimal data required to log you in or save lesson planner drafts.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 size={16} className="text-[#FF6B00] flex-shrink-0 mt-0.5" />
                <span>No trackers. No advertisements. No targeted profiling of teachers or children.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 size={16} className="text-[#FF6B00] flex-shrink-0 mt-0.5" />
                <span>All core planning outputs are drafting suggestions. Physical Education teachers must verify safety recommendations before using on school playgrounds.</span>
              </li>
            </ul>
          </div>
          <div className="pt-6 border-t border-slate-100 mt-8 text-[11px] text-slate-400 font-bold uppercase tracking-wider">
            🔐 Privacy & Admin direct: <span className="text-[#0A1C2A]">{BRAND_EMAILS.admin}</span>
          </div>
        </div>
      </section>

      {/* FAQ Row/Accordions */}
      <section className="space-y-8 max-w-4xl mx-auto">
        <div className="text-center space-y-2">
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#005BFF]">Q&A</span>
          <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight">A few quick answers before you write.</h2>
        </div>

        <div className="space-y-4">
          {[
            {
              q: "Is smartpeindia really free?",
              a: "Yes — the core toolkit including physical fitness calculators, lesson builders, and progression lists is 100% free for all PE teachers. Premium administration plans fund our databases, meaning teachers never see ads."
            },
            {
              q: "How fast will I get a reply?",
              a: `Emails sent to ${BRAND_EMAILS.contact} or ${BRAND_EMAILS.info} are usually answered within 12-24 working hours. Standard suggestions are triaged weekly, while critical bug reports on live features are resolved with top priority.`
            },
            {
              q: "Who handles support?",
              a: "L. Samy — the founder and active physical educator. This means you do not speak with outsourced technical support agents; you speak with the physical educator who writes every line of our codebase."
            },
            {
              q: "Can my school roll this out department-wide?",
              a: `Absolutely! Contact us at ${BRAND_EMAILS.contact} with your school's name, board type (CBSE/ICSE/State), and estimated student count. We will help you initialize school directories and student testing profiles.`
            }
          ].map((faq, idx) => (
            <div 
              key={idx} 
              className="bg-white p-6 rounded-2xl border-2 border-slate-205 hover:border-slate-800 transition-colors"
            >
              <h4 className="font-black text-slate-900 uppercase tracking-wide text-sm flex items-center gap-2 mb-2">
                <HelpCircle size={16} className="text-[#FF6B00]" />
                <span>{faq.q}</span>
              </h4>
              <p className="text-xs text-slate-600 font-semibold leading-relaxed pl-6">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Contact;

