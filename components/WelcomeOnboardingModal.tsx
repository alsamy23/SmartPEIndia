import React from 'react';
import { Sparkles, Gift, CheckCircle2, ArrowRight, X, Mail, Play, ShieldCheck, Trophy, ClipboardList } from 'lucide-react';
import Logo from './Logo';

interface WelcomeOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName?: string | null;
  schoolName?: string | null;
  onNavigateTab: (tab: any) => void;
}

export const WelcomeOnboardingModal: React.FC<WelcomeOnboardingModalProps> = ({
  isOpen,
  onClose,
  userName = 'Educator',
  schoolName = 'Smart PE School',
  onNavigateTab
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white max-w-2xl w-full rounded-[2.5rem] border-4 border-slate-900 p-6 md:p-10 shadow-2xl relative my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 w-10 h-10 bg-slate-100 hover:bg-slate-200 rounded-full font-black text-slate-500 hover:text-slate-900 flex items-center justify-center transition-all"
          aria-label="Close"
        >
          <X size={20} />
        </button>

        {/* Content */}
        <div className="space-y-6">
          <div className="flex items-center space-x-3">
            <Logo showText={false} />
            <div>
              <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 text-[10px] font-black uppercase tracking-widest rounded-full">
                1-Year Free Founding Educator Pass Active
              </span>
              <h2 className="text-2xl md:text-3xl font-black text-slate-900 uppercase font-display mt-1">
                Welcome, {userName}!
              </h2>
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white p-6 rounded-3xl border-2 border-slate-900 shadow-md space-y-3">
            <div className="flex items-center space-x-2 text-emerald-400 font-black text-xs uppercase tracking-wider">
              <Gift size={16} />
              <span>Smart PE India Registration Confirmation</span>
            </div>
            <p className="text-sm font-medium leading-relaxed text-slate-200">
              Your account for <strong className="text-white">{schoolName || 'your school'}</strong> has been activated with full 365-day free access to all Physical Education AI tools, lesson planners, and Khelo India fitness scorecards.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl text-center space-y-1">
              <Sparkles size={20} className="text-primary mx-auto" />
              <p className="text-xs font-black text-slate-900 uppercase">AI Lesson Plans</p>
              <p className="text-[10px] text-slate-500 font-medium">60-sec CBSE generators</p>
            </div>
            <div className="p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl text-center space-y-1">
              <Trophy size={20} className="text-amber-500 mx-auto" />
              <p className="text-xs font-black text-slate-900 uppercase">Khelo India</p>
              <p className="text-[10px] text-slate-500 font-medium">Govt. battery scores</p>
            </div>
            <div className="p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl text-center space-y-1">
              <ClipboardList size={20} className="text-emerald-600 mx-auto" />
              <p className="text-xs font-black text-slate-900 uppercase">Question Papers</p>
              <p className="text-[10px] text-slate-500 font-medium">Board pattern tests</p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="space-y-3 pt-2">
            <button
              onClick={() => {
                onClose();
                onNavigateTab('planner');
              }}
              className="w-full py-4 bg-[#0D2B52] text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#153e75] transition-all shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] flex items-center justify-center space-x-2 cursor-pointer"
            >
              <Sparkles size={16} className="text-[#D4A017]" />
              <span>Start Generating PE Lessons Now</span>
              <ArrowRight size={16} />
            </button>

            <button
              onClick={() => {
                onClose();
                onNavigateTab('dashboard');
              }}
              className="w-full py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border-2 border-slate-300 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center space-x-2 cursor-pointer"
            >
              <span>Go to Main Dashboard</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeOnboardingModal;
