import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  Loader2, 
  Square, 
  Sparkles, 
  Check, 
  AlertCircle, 
  X, 
  ArrowRight, 
  Lock, 
  RefreshCw, 
  ExternalLink,
  Volume2
} from 'lucide-react';
import { 
  transcriptionService, 
  isMicPermissionDenied, 
  requestMicrophonePermission, 
  checkMicrophonePermissionState, 
  isInIframe, 
  isSpeechRecognitionSupported 
} from '../services/transcriptionService';
import { showToast } from '../services/toast';

interface VoiceTranscribeButtonProps {
  onTranscribe: (text: string) => void;
  promptContext?: string;
  buttonLabel?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  variant?: 'solid' | 'outline' | 'ghost' | 'pill';
  autoSendPrompt?: boolean;
}

export const VoiceTranscribeButton: React.FC<VoiceTranscribeButtonProps> = ({
  onTranscribe,
  promptContext = 'Transcribe this voice audio for physical education and sports coaching.',
  buttonLabel,
  size = 'md',
  className = '',
  variant = 'solid',
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [isAskingPermission, setIsAskingPermission] = useState(false);
  const [permissionState, setPermissionState] = useState<'prompt' | 'granted' | 'denied' | 'unsupported'>('prompt');
  const [fallbackText, setFallbackText] = useState('');
  const [isSpeechRecognizing, setIsSpeechRecognizing] = useState(false);
  const speechRecognizerRef = useRef<{ stop: () => void; abort: () => void } | null>(null);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    if (isRecording) {
      setRecordDuration(0);
      timerRef.current = setInterval(() => {
        setRecordDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (speechRecognizerRef.current) {
        speechRecognizerRef.current.abort();
      }
    };
  }, [isRecording]);

  const handleStart = async () => {
    try {
      const state = await checkMicrophonePermissionState();
      setPermissionState(state);

      if (state === 'granted') {
        // Permission is already granted by browser
        await transcriptionService.startRecording();
        setIsRecording(true);
        showToast('Listening... Speak your question or note', 'info');
      } else {
        // Permission needs to be requested or was previously denied
        setShowPermissionModal(true);
      }
    } catch (err: any) {
      if (isMicPermissionDenied(err)) {
        setPermissionState('denied');
        setShowPermissionModal(true);
      } else {
        showToast(err.message || 'Microphone error', 'error');
      }
    }
  };

  const handleAskAndEnablePermission = async () => {
    setIsAskingPermission(true);
    try {
      showToast('Please click "Allow" in your browser prompt', 'info');
      const granted = await requestMicrophonePermission();
      if (granted) {
        setPermissionState('granted');
        setShowPermissionModal(false);
        // Automatically start recording once permission granted
        await transcriptionService.startRecording();
        setIsRecording(true);
        showToast('Microphone enabled! Listening...', 'success');
      } else {
        setPermissionState('denied');
        showToast('Microphone access was denied. See instructions below.', 'warning');
      }
    } catch (err: any) {
      if (isMicPermissionDenied(err)) {
        setPermissionState('denied');
        showToast('Microphone permission blocked. See browser steps below.', 'warning');
      } else {
        showToast(err.message || 'Could not access microphone', 'error');
      }
    } finally {
      setIsAskingPermission(false);
    }
  };

  const handleStartWebSpeech = () => {
    if (!isSpeechRecognitionSupported()) {
      showToast('Live browser speech recognition is not supported in this browser.', 'warning');
      return;
    }

    try {
      setIsSpeechRecognizing(true);
      showToast('Listening with live speech recognition...', 'info');

      speechRecognizerRef.current = transcriptionService.startSpeechRecognition({
        onResult: (transcript, isFinal) => {
          setFallbackText(transcript);
          if (isFinal && transcript.trim()) {
            setIsSpeechRecognizing(false);
            onTranscribe(transcript.trim());
            setShowPermissionModal(false);
            showToast('Voice recognized successfully!', 'success');
          }
        },
        onError: (err) => {
          console.warn('Speech recognition error:', err);
          setIsSpeechRecognizing(false);
          showToast('Speech recognition ended. You can type or retry.', 'info');
        },
        onEnd: () => {
          setIsSpeechRecognizing(false);
        },
      });
    } catch (err: any) {
      setIsSpeechRecognizing(false);
      showToast('Failed to start speech recognition', 'error');
    }
  };

  const handleStopAndTranscribe = async () => {
    if (!isRecording) return;
    setIsRecording(false);
    setIsTranscribing(true);

    try {
      const { blob, mimeType } = await transcriptionService.stopRecording();
      if (blob.size < 500) {
        showToast('Recording too short. Please hold mic and speak.', 'warning');
        setIsTranscribing(false);
        return;
      }

      showToast('Transcribing audio with Gemini...', 'info');
      const result = await transcriptionService.transcribeAudio(blob, mimeType, promptContext);

      if (result.text && result.text.trim()) {
        onTranscribe(result.text.trim());
        showToast('Voice transcribed successfully!', 'success');
      } else {
        showToast('No speech detected in audio. Please try again.', 'warning');
      }
    } catch (err: any) {
      console.warn('Audio transcription failed:', err);
      showToast(err.message || 'Audio transcription failed', 'error');
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleCancel = () => {
    transcriptionService.cancelRecording();
    setIsRecording(false);
    setIsTranscribing(false);
    if (speechRecognizerRef.current) {
      speechRecognizerRef.current.abort();
      setIsSpeechRecognizing(false);
    }
  };

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  const getContextSuggestions = () => {
    const ctx = (promptContext || '').toLowerCase();
    if (ctx.includes('search')) {
      return [
        'Khelo India Fitness Battery Tests',
        'CBSE Class 11 Lesson Plans',
        'Basketball Tournament Rules & Dimensions',
        'Student BMI & Growth Calculator',
        'Coaching Batches & Skill Mastery',
      ];
    }
    if (ctx.includes('skill') || ctx.includes('score') || ctx.includes('rate') || ctx.includes('observation')) {
      return [
        'Dribbling 8/10: Excellent close control & acceleration',
        'Passing 7/10: Good accuracy, working on weak-foot passes',
        'Shooting 9/10: Powerful and composed strike on target',
        'High aerobic stamina & defensive positioning',
        'Needs conditioning drills for agility & recovery',
      ];
    }
    if (ctx.includes('target') || ctx.includes('goal')) {
      return [
        'Improve weak-foot shooting accuracy by 25%',
        'Increase aerobic endurance for full match duration',
        'Master 1v1 defensive containment and recovery',
      ];
    }
    return [
      'CBSE Physical Education Curriculum',
      'Khelo India Battery Scoring',
      'Sports Day Tournament Fixtures',
    ];
  };

  const handleApplyFallbackText = (textToApply: string) => {
    if (textToApply && textToApply.trim()) {
      onTranscribe(textToApply.trim());
      setShowPermissionModal(false);
      setFallbackText('');
      showToast('Text applied successfully!', 'success');
    }
  };

  // Render Recording active state
  if (isRecording) {
    return (
      <div className={`inline-flex items-center gap-1.5 bg-rose-600 text-white rounded-2xl px-3 py-1.5 text-xs font-black shadow-lg animate-pulse ${className}`}>
        <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
        <span>Rec {formatSeconds(recordDuration)}</span>
        <button
          type="button"
          onClick={handleStopAndTranscribe}
          title="Stop and transcribe"
          className="ml-1 p-1 bg-white text-rose-700 hover:bg-rose-100 rounded-lg transition"
        >
          <Square size={12} className="fill-current" />
        </button>
        <button
          type="button"
          onClick={handleCancel}
          title="Cancel"
          className="p-1 hover:bg-rose-700 rounded-lg text-rose-200 hover:text-white transition"
        >
          <MicOff size={12} />
        </button>
      </div>
    );
  }

  // Render Transcribing active state
  if (isTranscribing) {
    return (
      <div className={`inline-flex items-center gap-2 bg-indigo-600 text-white rounded-2xl px-3 py-1.5 text-xs font-black shadow-md ${className}`}>
        <Loader2 size={14} className="animate-spin text-indigo-200" />
        <span>Transcribing with Gemini...</span>
      </div>
    );
  }

  // Idle trigger button styles
  const sizeClasses = {
    sm: 'p-1.5 text-xs',
    md: 'p-2 text-xs',
    lg: 'px-3 py-2 text-sm',
  }[size];

  const inIframeEnv = isInIframe();

  return (
    <>
      <button
        type="button"
        onClick={handleStart}
        title="Speak with microphone (Voice Transcription)"
        className={`group inline-flex items-center gap-1.5 rounded-xl font-bold transition active:scale-95 ${
          variant === 'solid'
            ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-sm'
            : variant === 'outline'
            ? 'border-2 border-slate-300 hover:border-slate-900 bg-white text-slate-700 hover:text-slate-950'
            : variant === 'pill'
            ? 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200'
            : 'text-slate-500 hover:text-indigo-600 hover:bg-slate-100'
        } ${sizeClasses} ${className}`}
      >
        <Mic size={size === 'lg' ? 18 : 15} className="text-current group-hover:scale-110 transition" />
        {buttonLabel && <span>{buttonLabel}</span>}
      </button>

      {/* Voice / Permission Request & Helper Modal */}
      {showPermissionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border-4 border-slate-900 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-amber-500 text-white flex items-center justify-center border-2 border-amber-600 shadow-md">
                  <Mic className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-base font-black uppercase tracking-tight text-slate-900">
                    Enable Microphone to Speak
                  </h3>
                  <p className="text-xs text-slate-500 font-semibold">
                    Hands-free voice rating, observation dictation & search
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowPermissionModal(false);
                  if (speechRecognizerRef.current) speechRecognizerRef.current.abort();
                }}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Permission Ask Card */}
            <div className="p-4 bg-gradient-to-br from-amber-50 via-orange-50/40 to-slate-50 border-2 border-amber-300 rounded-2xl space-y-3">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-amber-900">
                <Sparkles size={14} className="text-amber-600" />
                <span>Microphone Permission Request</span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed font-medium">
                SmartPE uses your microphone to transcribe your speech into text. Click below to allow microphone access in your browser.
              </p>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleAskAndEnablePermission}
                  disabled={isAskingPermission}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-sm transition active:scale-95"
                >
                  {isAskingPermission ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Asking Browser...</span>
                    </>
                  ) : (
                    <>
                      <Mic size={14} />
                      <span>🎙️ Ask & Allow Microphone</span>
                    </>
                  )}
                </button>

                {isSpeechRecognitionSupported() && (
                  <button
                    type="button"
                    onClick={handleStartWebSpeech}
                    disabled={isSpeechRecognizing}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 rounded-xl text-xs font-bold transition active:scale-95"
                  >
                    {isSpeechRecognizing ? (
                      <>
                        <Loader2 size={13} className="animate-spin" />
                        <span>Listening Live...</span>
                      </>
                    ) : (
                      <>
                        <Volume2 size={13} />
                        <span>Try Live Recognition</span>
                      </>
                    )}
                  </button>
                )}

                {inIframeEnv && (
                  <a
                    href={typeof window !== 'undefined' ? window.location.href : '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-xl text-xs font-bold transition"
                  >
                    <ExternalLink size={13} />
                    <span>Open in Full Tab</span>
                  </a>
                )}
              </div>

              {/* Step-by-step browser unblock instructions if denied or in iframe */}
              {(permissionState === 'denied' || inIframeEnv) && (
                <div className="mt-2 pt-2 border-t border-amber-200 text-[11px] text-amber-900 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <Lock size={12} className="text-amber-700" />
                    <span>How to unblock if your browser didn't prompt:</span>
                  </div>
                  <p className="text-amber-800">
                    1. Click the <strong>Lock (🔒)</strong> or site settings icon in your browser address bar.
                  </p>
                  <p className="text-amber-800">
                    2. Toggle <strong>Microphone to "Allow"</strong>.
                  </p>
                  <p className="text-amber-800">
                    3. Click <strong>Ask & Allow Microphone</strong> above or refresh.
                  </p>
                </div>
              )}
            </div>

            {/* Direct Text / Dictation Input */}
            <div className="space-y-2">
              <label className="text-xs font-black uppercase text-slate-700 tracking-wider flex items-center justify-between">
                <span>Type or Paste Spoken Note:</span>
                {isSpeechRecognizing && (
                  <span className="text-[10px] text-indigo-600 font-bold animate-pulse">
                    Live dictation active...
                  </span>
                )}
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={fallbackText}
                  onChange={(e) => setFallbackText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleApplyFallbackText(fallbackText);
                    }
                  }}
                  placeholder="e.g. Dribbling 8, or search topic..."
                  className="flex-1 px-3.5 py-2.5 bg-slate-50 border-2 border-slate-200 focus:border-primary rounded-xl text-xs font-medium text-slate-900 focus:outline-none"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => handleApplyFallbackText(fallbackText)}
                  disabled={!fallbackText.trim()}
                  className="px-4 py-2.5 bg-primary hover:bg-primary-dark disabled:opacity-50 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition active:scale-95"
                >
                  <span>Apply</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            </div>

            {/* Quick Suggestions Chips */}
            <div className="space-y-2">
              <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider">
                Quick Sports & PE Suggestions:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {getContextSuggestions().map((chip, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleApplyFallbackText(chip)}
                    className="text-left px-2.5 py-1.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-300 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 transition"
                  >
                    + {chip}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowPermissionModal(false);
                  if (speechRecognizerRef.current) speechRecognizerRef.current.abort();
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

