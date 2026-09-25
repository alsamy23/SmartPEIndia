import React, { useEffect, useState } from 'react';
import { Sparkles, X, Compass, ArrowRight, CheckCircle2, Volume2, VolumeX } from 'lucide-react';
import { voiceAgentService } from '../services/voiceAgentService';

export interface SpotlightData {
  title: string;
  guidance: string;
  category?: string;
  tabId: string;
  audioText?: string;
}

interface SpotlightBannerProps {
  spotlight: SpotlightData | null;
  onDismiss: () => void;
}

export const SpotlightBanner: React.FC<SpotlightBannerProps> = ({ spotlight, onDismiss }) => {
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    if (spotlight && spotlight.audioText && !isMuted) {
      voiceAgentService.speakText(spotlight.audioText);
    }
    return () => {
      voiceAgentService.stopSpeaking();
    };
  }, [spotlight, isMuted]);

  if (!spotlight) return null;

  return (
    <div className="sticky top-0 z-40 bg-gradient-to-r from-blue-600 via-indigo-600 to-primary text-white shadow-xl px-4 py-3 border-b-2 border-white/20 animate-in fade-in slide-in-from-top duration-300">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-start md:items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center flex-shrink-0 border border-white/30 shadow-inner">
            <Compass className="w-5 h-5 text-white animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-black uppercase tracking-wider text-blue-100">
                Voice Spotlight Guide
              </span>
              <h4 className="text-sm font-black tracking-wide text-white">
                {spotlight.title}
              </h4>
            </div>
            <p className="text-xs text-blue-100 mt-0.5 font-medium leading-relaxed">
              {spotlight.guidance}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end md:self-center flex-shrink-0">
          <button
            type="button"
            onClick={() => {
              if (isMuted) {
                setIsMuted(false);
                if (spotlight.audioText) voiceAgentService.speakText(spotlight.audioText);
              } else {
                setIsMuted(true);
                voiceAgentService.stopSpeaking();
              }
            }}
            className="p-1.5 rounded-xl bg-white/15 hover:bg-white/25 transition-all text-white text-xs flex items-center gap-1.5"
            title={isMuted ? "Unmute spoken voice guide" : "Mute voice"}
          >
            {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} className="animate-pulse" />}
            <span className="text-[10px] font-bold hidden sm:inline">{isMuted ? "Muted" : "Voice On"}</span>
          </button>

          <button
            type="button"
            onClick={onDismiss}
            className="px-3 py-1.5 rounded-xl bg-white text-slate-900 hover:bg-blue-50 font-black text-xs uppercase tracking-wider transition-all shadow flex items-center gap-1 active:scale-95"
          >
            <CheckCircle2 size={14} className="text-emerald-600" />
            <span>Got it</span>
          </button>

          <button
            type="button"
            onClick={onDismiss}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all"
            aria-label="Close spotlight"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
