import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  Mic, 
  MicOff, 
  Search, 
  X, 
  ArrowRight, 
  Volume2, 
  VolumeX, 
  Compass, 
  BookOpen, 
  Trophy, 
  Activity, 
  ClipboardList, 
  Mail, 
  Zap, 
  FileText, 
  Globe, 
  Loader2, 
  CheckCircle2, 
  MessageSquare,
  HelpCircle,
  Play,
  AlertCircle,
  Lock,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import { 
  voiceAgentService, 
  VoiceAgentResponse, 
  VoiceFeatureAction, 
  APP_FEATURES_CATALOG 
} from '../services/voiceAgentService';
import { 
  transcriptionService, 
  isMicPermissionDenied, 
  requestMicrophonePermission, 
  checkMicrophonePermissionState, 
  isInIframe, 
  isSpeechRecognitionSupported 
} from '../services/transcriptionService';
import { showToast } from '../services/toast';

interface VoiceAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tabId: string, spotlightData?: { title: string; guidance: string; audioText?: string }) => void;
}

export const VoiceAgentModal: React.FC<VoiceAgentModalProps> = ({
  isOpen,
  onClose,
  onNavigate
}) => {
  const [queryText, setQueryText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [micBlocked, setMicBlocked] = useState(false);
  const [showPermissionPrompt, setShowPermissionPrompt] = useState(false);
  const [isAskingPermission, setIsAskingPermission] = useState(false);
  const [isLiveRecognizing, setIsLiveRecognizing] = useState(false);
  const speechRecognizerRef = useRef<{ stop: () => void; abort: () => void } | null>(null);
  const [currentResponse, setCurrentResponse] = useState<VoiceAgentResponse | null>(null);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('all');
  const [catalogSearch, setCatalogSearch] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [viewMode, setViewMode] = useState<'voice' | 'catalog'>('voice');

  const timerRef = useRef<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Recording Timer
  useEffect(() => {
    if (isRecording) {
      setRecordSeconds(0);
      timerRef.current = setInterval(() => {
        setRecordSeconds(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

  useEffect(() => {
    if (isOpen) {
      // Pre-focus input if open
      setTimeout(() => inputRef.current?.focus(), 150);
    } else {
      voiceAgentService.stopSpeaking();
      transcriptionService.cancelRecording();
      setIsRecording(false);
      if (speechRecognizerRef.current) {
        speechRecognizerRef.current.abort();
        setIsLiveRecognizing(false);
      }
    }
  }, [isOpen]);

  const handleStartVoice = async () => {
    try {
      const permState = await checkMicrophonePermissionState();
      if (permState === 'granted') {
        voiceAgentService.stopSpeaking();
        await transcriptionService.startRecording();
        setIsRecording(true);
        setMicBlocked(false);
        setShowPermissionPrompt(false);
        showToast('Listening... Speak in any language', 'info');
      } else {
        // Need to ask for permission
        setShowPermissionPrompt(true);
      }
    } catch (err: any) {
      if (isMicPermissionDenied(err)) {
        setShowPermissionPrompt(true);
        setMicBlocked(true);
      } else {
        console.warn('Voice recording error:', err);
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
        setMicBlocked(false);
        setShowPermissionPrompt(false);
        voiceAgentService.stopSpeaking();
        await transcriptionService.startRecording();
        setIsRecording(true);
        showToast('Microphone enabled! Listening...', 'success');
      } else {
        setMicBlocked(true);
        showToast('Microphone was not allowed. See instructions below.', 'warning');
      }
    } catch (err: any) {
      if (isMicPermissionDenied(err)) {
        setMicBlocked(true);
        showToast('Microphone permission blocked. See browser steps below.', 'warning');
      } else {
        showToast(err.message || 'Could not access microphone', 'error');
      }
    } finally {
      setIsAskingPermission(false);
    }
  };

  const handleStartLiveSpeech = () => {
    if (!isSpeechRecognitionSupported()) {
      showToast('Live speech recognition is not supported in this browser.', 'warning');
      return;
    }

    try {
      voiceAgentService.stopSpeaking();
      setIsLiveRecognizing(true);
      showToast('Listening live... Speak in any language', 'info');

      speechRecognizerRef.current = transcriptionService.startSpeechRecognition({
        onResult: (transcript, isFinal) => {
          setQueryText(transcript);
          if (isFinal && transcript.trim()) {
            setIsLiveRecognizing(false);
            setShowPermissionPrompt(false);
            setMicBlocked(false);
            executeQuery(transcript.trim());
          }
        },
        onError: (err) => {
          console.warn('Live speech recognition error:', err);
          setIsLiveRecognizing(false);
        },
        onEnd: () => {
          setIsLiveRecognizing(false);
        },
      });
    } catch (err: any) {
      setIsLiveRecognizing(false);
      showToast('Failed to start speech recognition', 'error');
    }
  };

  const handleStopAndProcessVoice = async () => {
    if (!isRecording) return;
    setIsRecording(false);
    setIsProcessing(true);

    try {
      const { blob, mimeType } = await transcriptionService.stopRecording();
      if (blob.size < 400) {
        showToast('Speech was too short. Please try speaking again.', 'warning');
        setIsProcessing(false);
        return;
      }

      showToast('Transcribing your voice with Gemini...', 'info');
      const transcribeResult = await transcriptionService.transcribeAudio(
        blob, 
        mimeType, 
        'Transcribe this voice query for Physical Education, sports rules, lesson plans, or fitness assessments.'
      );

      const spoken = transcribeResult.text?.trim();
      if (!spoken) {
        showToast('No speech detected. Please try again or type below.', 'warning');
        setIsProcessing(false);
        return;
      }

      setQueryText(spoken);
      await executeQuery(spoken);
    } catch (err: any) {
      console.warn('Voice processing error:', err);
      showToast(err.message || 'Failed to process voice query', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const executeQuery = async (query: string) => {
    if (!query || query.trim().length === 0) return;
    setIsProcessing(true);

    try {
      const response = await voiceAgentService.resolveWithAI(query);
      setCurrentResponse(response);

      if (response.spokenAudioText && !isMuted) {
        voiceAgentService.speakText(response.spokenAudioText);
      }
    } catch (err: any) {
      console.warn('Failed to resolve query:', err);
      showToast('Could not analyze query. Try selecting a feature from the directory.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (queryText.trim()) {
      executeQuery(queryText);
    }
  };

  const handleNavigateToFeature = (feature: VoiceFeatureAction) => {
    voiceAgentService.stopSpeaking();
    onNavigate(feature.tabId, {
      title: feature.featureTitle,
      guidance: feature.screenGuidance,
      audioText: feature.spokenGuide
    });
    onClose();
  };

  const filteredCatalog = APP_FEATURES_CATALOG.filter(item => {
    const matchesCategory = activeCategoryFilter === 'all' || item.category.toLowerCase().includes(activeCategoryFilter.toLowerCase());
    const matchesSearch = !catalogSearch || 
      item.featureTitle.toLowerCase().includes(catalogSearch.toLowerCase()) || 
      item.spokenGuide.toLowerCase().includes(catalogSearch.toLowerCase()) ||
      item.keywords.some(k => k.toLowerCase().includes(catalogSearch.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const samplePrompts = [
    { text: 'Add players to coaching batches & rate skills', icon: '🏆' },
    { text: 'Create daily PE lesson plan for Grade 7', icon: '📋' },
    { text: 'Enter student fitness test scores & BMI', icon: '🏃' },
    { text: 'What are the official rules of Carrom & Chess?', icon: '♟️' },
    { text: 'Make a 16-team knockout tournament fixture', icon: '🥇' },
    { text: 'CBSE Class 12 30-mark practical scoring', icon: '📝' },
    { text: 'Draft parent consent letter for tournament', icon: '✉️' }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Header Bar */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-primary text-white px-5 py-4 flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
              <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black tracking-wide text-white">
                  Voice AI Assistant & Feature Guide
                </h3>
                <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                  Multilingual AI
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Speak in Hindi, English, Tamil, Telugu, or any language to discover and open features
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (isMuted) {
                  setIsMuted(false);
                  if (currentResponse?.spokenAudioText) voiceAgentService.speakText(currentResponse.spokenAudioText);
                } else {
                  setIsMuted(true);
                  voiceAgentService.stopSpeaking();
                }
              }}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all text-xs flex items-center gap-1.5"
              title={isMuted ? "Unmute spoken replies" : "Mute spoken replies"}
            >
              {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} className="text-amber-300" />}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all active:scale-95"
              aria-label="Close Voice Assistant"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Mode Switcher (Voice Copilot vs Feature Directory) */}
        <div className="px-5 pt-3 pb-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 bg-slate-200/80 p-1 rounded-2xl">
            <button
              type="button"
              onClick={() => setViewMode('voice')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all ${
                viewMode === 'voice' 
                  ? 'bg-white text-primary shadow-sm' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🎙️ Voice Assistant
            </button>
            <button
              type="button"
              onClick={() => setViewMode('catalog')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all ${
                viewMode === 'catalog' 
                  ? 'bg-white text-primary shadow-sm' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              📑 All Features Catalog ({APP_FEATURES_CATALOG.length})
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
            <Globe size={13} className="text-primary" />
            <span>Understands 10+ Indian Languages</span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          
          {viewMode === 'voice' ? (
            <>
              {/* Giant Voice Record Section */}
              <div className="bg-gradient-to-br from-indigo-50/70 via-blue-50/50 to-slate-50 p-5 rounded-3xl border border-indigo-100/80 flex flex-col items-center justify-center text-center shadow-inner">
                {/* Permission Request or Blocked Guidance Card */}
                {(showPermissionPrompt || micBlocked) && (
                  <div className="w-full max-w-xl mb-4 p-5 bg-gradient-to-br from-amber-50 to-orange-50/60 border-2 border-amber-300 rounded-3xl text-left shadow-sm space-y-3.5 animate-in fade-in duration-150">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-sm shrink-0">
                          <Mic className="w-5 h-5 animate-pulse" />
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                            Enable Microphone to Speak
                          </h4>
                          <p className="text-xs text-slate-600 mt-0.5 leading-relaxed font-medium">
                            SmartPE uses your microphone to transcribe sports questions, CBSE curriculum queries, and coaching requests in any language.
                          </p>
                        </div>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => {
                          setShowPermissionPrompt(false);
                          setMicBlocked(false);
                        }} 
                        className="text-slate-400 hover:text-slate-800 p-1"
                        aria-label="Close permission prompt"
                      >
                        <X size={16} />
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={handleAskAndEnablePermission}
                        disabled={isAskingPermission}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 text-white rounded-2xl font-black text-xs uppercase tracking-wider shadow-md hover:scale-105 active:scale-95 transition-all"
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
                          onClick={handleStartLiveSpeech}
                          disabled={isLiveRecognizing}
                          className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 rounded-2xl font-black text-xs uppercase tracking-wider transition-all"
                        >
                          {isLiveRecognizing ? (
                            <>
                              <Loader2 size={13} className="animate-spin" />
                              <span>Listening Live...</span>
                            </>
                          ) : (
                            <>
                              <Volume2 size={13} />
                              <span>⚡ Try Live Recognition</span>
                            </>
                          )}
                        </button>
                      )}

                      {isInIframe() && (
                        <a
                          href={typeof window !== 'undefined' ? window.location.href : '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white hover:bg-slate-50 border-2 border-slate-300 text-slate-800 rounded-2xl font-black text-xs uppercase tracking-wider shadow-sm transition-all"
                        >
                          <ExternalLink size={13} />
                          <span>Open in Full Tab</span>
                        </a>
                      )}
                    </div>

                    {/* Clear browser step instructions */}
                    <div className="text-[11px] text-slate-600 bg-white/80 p-3 rounded-2xl border border-amber-200/80 space-y-1">
                      <div className="font-bold flex items-center gap-1.5 text-amber-900">
                        <Lock size={12} className="text-amber-700" />
                        <span>If your browser blocked the prompt previously:</span>
                      </div>
                      <p>1. Look at your browser address bar at the top.</p>
                      <p>2. Click the <strong>Lock (🔒)</strong> or site settings icon next to the URL.</p>
                      <p>3. Set <strong>Microphone</strong> to <strong>Allow</strong>, then tap <strong>Ask & Allow Microphone</strong> above.</p>
                    </div>
                  </div>
                )}

                {isRecording ? (
                  <div className="flex flex-col items-center space-y-3">
                    <div className="relative">
                      <span className="absolute -inset-2 rounded-full bg-rose-500/20 animate-ping" />
                      <button
                        type="button"
                        onClick={handleStopAndProcessVoice}
                        className="relative w-20 h-20 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-xl hover:bg-rose-700 active:scale-95 transition-all"
                      >
                        <MicOff className="w-8 h-8 animate-pulse" />
                      </button>
                    </div>
                    <div>
                      <div className="text-sm font-black text-rose-700">Listening to your voice ({recordSeconds}s)...</div>
                      <div className="text-xs text-slate-500 mt-0.5">Click the red button when finished speaking</div>
                    </div>
                  </div>
                ) : isProcessing ? (
                  <div className="flex flex-col items-center space-y-3 py-4">
                    <Loader2 className="w-10 h-10 text-primary animate-spin" />
                    <div className="text-sm font-bold text-slate-700">Understanding your query & finding features...</div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center space-y-3">
                    <button
                      type="button"
                      onClick={handleStartVoice}
                      className="w-20 h-20 rounded-full bg-gradient-to-tr from-primary to-indigo-600 text-white flex items-center justify-center shadow-lg hover:shadow-indigo-200/80 hover:scale-105 active:scale-95 transition-all"
                      title="Tap to speak"
                    >
                      <Mic className="w-8 h-8" />
                    </button>
                    <div>
                      <div className="text-sm font-black text-slate-800">Tap Microphone to Speak</div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        Ask where any tool is, request sports rules, or discover what this app can do
                      </div>
                    </div>
                  </div>
                )}

                {/* Text input fallback form */}
                <form onSubmit={handleTextSubmit} className="w-full max-w-xl mt-4 flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                      ref={inputRef}
                      type="text"
                      value={queryText}
                      onChange={(e) => setQueryText(e.target.value)}
                      placeholder="Or type here: e.g. 'Where is coaching batch player skill rating?'"
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!queryText.trim() || isProcessing}
                    className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-black text-xs rounded-2xl transition-all shadow active:scale-95 flex items-center gap-1.5"
                  >
                    <span>Ask</span>
                    <ArrowRight size={14} />
                  </button>
                </form>
              </div>

              {/* Resolved AI Response Display */}
              {currentResponse && (
                <div className="bg-white rounded-3xl border-2 border-primary/20 p-5 shadow-lg space-y-4 animate-in fade-in zoom-in-95 duration-200">
                  <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        {currentResponse.understoodIntent}
                      </span>
                    </div>
                    {currentResponse.matchedFeature && (
                      <span className="px-2.5 py-1 rounded-full bg-primary/10 text-primary font-black text-[11px] uppercase tracking-wider">
                        {currentResponse.matchedFeature.category}
                      </span>
                    )}
                  </div>

                  <div className="text-sm font-medium text-slate-800 leading-relaxed">
                    {currentResponse.directAnswer}
                  </div>

                  {currentResponse.matchedFeature && (
                    <div className="bg-blue-50/70 border border-blue-200/80 rounded-2xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div>
                        <div className="text-xs font-black text-blue-900 flex items-center gap-1.5">
                          <Compass size={14} className="text-primary" />
                          <span>Screen Spotlight Guide:</span>
                        </div>
                        <div className="text-xs text-blue-800 mt-0.5">
                          {currentResponse.matchedFeature.screenGuidance}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleNavigateToFeature(currentResponse.matchedFeature!)}
                        className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-xl font-black text-xs uppercase tracking-wider transition-all shadow flex items-center gap-1.5 active:scale-95 flex-shrink-0"
                      >
                        <span>Show on Screen</span>
                        <ArrowRight size={14} />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* "Try Asking" Quick Suggestion Chips */}
              <div className="space-y-2">
                <div className="text-xs font-black text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                  <HelpCircle size={14} className="text-primary" />
                  <span>Try Asking (Click to test):</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {samplePrompts.map((prompt, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setQueryText(prompt.text);
                        executeQuery(prompt.text);
                      }}
                      className="p-3 bg-slate-50 hover:bg-indigo-50/70 border border-slate-200 hover:border-indigo-200 rounded-2xl text-left transition-all group flex items-start gap-2.5"
                    >
                      <span className="text-base">{prompt.icon}</span>
                      <span className="text-xs font-semibold text-slate-700 group-hover:text-primary leading-tight">
                        "{prompt.text}"
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            /* Full Feature Directory / Catalog View */
            <div className="space-y-4">
              {/* Category Pills & Search */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                  {['all', 'Plan', 'Assess', 'Coaching', 'Communicate', 'Record'].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setActiveCategoryFilter(cat)}
                      className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                        activeCategoryFilter === cat 
                          ? 'bg-slate-900 text-white shadow' 
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {cat === 'all' ? 'All Features' : cat}
                    </button>
                  ))}
                </div>

                <div className="relative min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  <input
                    type="text"
                    value={catalogSearch}
                    onChange={(e) => setCatalogSearch(e.target.value)}
                    placeholder="Search feature..."
                    className="w-full pl-9 pr-3 py-1.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              {/* Feature Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredCatalog.map((feat) => (
                  <div
                    key={feat.tabId}
                    className="p-4 bg-slate-50 hover:bg-white border border-slate-200 hover:border-primary/40 rounded-2xl transition-all shadow-sm flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 bg-slate-200/60 px-2 py-0.5 rounded-md">
                          {feat.category}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            if (!isMuted) voiceAgentService.speakText(feat.spokenGuide);
                          }}
                          className="p-1 rounded-lg hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-all"
                          title="Listen to feature description"
                        >
                          <Volume2 size={14} />
                        </button>
                      </div>
                      <h4 className="text-xs font-black text-slate-900 group-hover:text-primary transition-colors">
                        {feat.featureTitle}
                      </h4>
                      <p className="text-[11.5px] text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                        {feat.spokenGuide}
                      </p>
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-200/60 flex items-center justify-between">
                      <span className="text-[10.5px] text-slate-500 font-medium truncate max-w-[170px]">
                        👉 {feat.screenGuidance.split('.')[0]}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleNavigateToFeature(feat)}
                        className="px-3 py-1 bg-slate-900 group-hover:bg-primary text-white rounded-xl font-black text-[11px] uppercase tracking-wider transition-all flex items-center gap-1 active:scale-95 flex-shrink-0"
                      >
                        <span>Open</span>
                        <ArrowRight size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700">Universal PE Navigation</span>
            <span>•</span>
            <span>Optimized for Mobile, Tablet & Multi-Screen Classrooms</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-bold text-slate-600 hover:text-slate-900"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
