import React from 'react';
import { Sparkles, Mic, Compass } from 'lucide-react';

interface FloatingVoiceAgentButtonProps {
  onClick: () => void;
  isOpen: boolean;
}

export const FloatingVoiceAgentButton: React.FC<FloatingVoiceAgentButtonProps> = ({ onClick, isOpen }) => {
  if (isOpen) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 sm:right-6 z-40 print:hidden flex flex-col items-end gap-2 group">
      {/* Tooltip badge on hover */}
      <div className="hidden lg:flex items-center gap-1.5 bg-slate-950/90 text-white text-[11px] font-bold px-3 py-1.5 rounded-full shadow-lg border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none transform translate-y-1 group-hover:translate-y-0">
        <Sparkles size={13} className="text-amber-300" />
        <span>Ask Voice AI / Find Features</span>
      </div>

      <button
        type="button"
        onClick={onClick}
        className="relative flex items-center gap-2.5 px-4 py-3.5 bg-gradient-to-tr from-primary via-indigo-600 to-blue-600 text-white font-black text-xs uppercase tracking-wider rounded-full shadow-[0_8px_25px_rgba(79,70,229,0.45)] hover:shadow-[0_12px_30px_rgba(79,70,229,0.65)] hover:scale-105 active:scale-95 transition-all border-2 border-white/30 backdrop-blur-sm"
        aria-label="Open Voice AI Assistant & Feature Guide"
      >
        <div className="relative">
          <span className="absolute -inset-1 rounded-full bg-white/40 animate-ping" />
          <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
            <Mic className="w-3.5 h-3.5 text-white animate-pulse" />
          </div>
        </div>
        <span className="hidden sm:inline font-black tracking-wide">Voice Guide</span>
      </button>
    </div>
  );
};
