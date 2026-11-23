
import React, { useState, useEffect } from 'react';
import { X, ShieldAlert, Info, ChevronDown, ChevronUp } from 'lucide-react';

const Disclaimer: React.FC = () => {
  const [isDismissed, setIsDismissed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('smartpe_disclaimer_dismissed') === 'true';
    } catch {
      return false;
    }
  });

  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const handleDismiss = () => {
    setIsDismissed(true);
    try {
      localStorage.setItem('smartpe_disclaimer_dismissed', 'true');
    } catch (e) {
      console.error(e);
    }
  };

  const handleReopen = () => {
    setIsDismissed(false);
    setIsExpanded(true);
    try {
      localStorage.removeItem('smartpe_disclaimer_dismissed');
    } catch (e) {
      console.error(e);
    }
  };

  // If dismissed, render a tiny, discrete info chip in the bottom-left corner so users can review if needed without blocking the UI
  if (isDismissed) {
    return (
      <button
        onClick={handleReopen}
        title="View Community Disclaimer & Platform Affiliation"
        className="fixed bottom-24 md:bottom-4 left-3 md:left-[21rem] z-30 bg-slate-900/80 hover:bg-slate-900 backdrop-blur-md text-slate-400 hover:text-amber-400 border border-slate-700/60 rounded-full px-2.5 py-1 text-[10px] font-bold flex items-center gap-1.5 shadow-lg transition-all hover:scale-105 print:hidden group"
      >
        <ShieldAlert size={12} className="text-amber-400" />
        <span className="hidden sm:inline">Independent Platform Info</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-[5.5rem] md:bottom-4 left-2 right-20 md:left-[21rem] md:right-auto md:max-w-[min(28rem,calc(100vw-35rem))] z-30 print:hidden animate-in slide-in-from-bottom-2 duration-200">
      <div className="bg-slate-900/95 backdrop-blur-md text-slate-300 px-3.5 py-2.5 rounded-2xl border border-slate-700/80 shadow-2xl shadow-black/50 text-xs">
        {/* Compact Top Bar */}
        <div className="flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-5 h-5 rounded-md bg-amber-500/10 border border-amber-500/30 flex items-center justify-center flex-shrink-0 text-amber-400">
              <ShieldAlert size={12} />
            </span>
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-[11px] font-black text-white uppercase tracking-wider truncate">
                Unofficial PE Platform
              </span>
              <span className="text-[10px] text-slate-400 hidden sm:inline truncate">
                • Independent Educational Tool
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors"
              title={isExpanded ? "Collapse details" : "Read full disclaimer"}
            >
              {isExpanded ? (
                <>Less <ChevronDown size={12} /></>
              ) : (
                <>Details <ChevronUp size={12} /></>
              )}
            </button>

            <button
              onClick={handleDismiss}
              className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors"
              title="Dismiss disclaimer"
              aria-label="Dismiss disclaimer"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Expandable detailed legal statement */}
        {isExpanded && (
          <div className="mt-2 pt-2 border-t border-slate-800 text-[11px] leading-relaxed text-slate-400 animate-in fade-in duration-150 space-y-1">
            <p>
              <strong className="text-slate-200">Smart PE India</strong> is an independent educational aid and is <span className="text-amber-400 font-bold">NOT affiliated</span> with the Ministry of Youth Affairs and Sports, Khelo India, CBSE, or NCERT.
            </p>
            <p className="text-[10px] text-slate-500">
              All logos and trademarks belong to their respective owners. AI-generated lesson content should be verified by certified school professionals before implementation.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Disclaimer;

