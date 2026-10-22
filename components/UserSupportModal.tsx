import React, { useState, useEffect } from 'react';
import { 
  MessageCircle, AlertTriangle, Send, X, CheckCircle, 
  HelpCircle, Copy, Check, ExternalLink, ShieldAlert, Cpu
} from 'lucide-react';
import { 
  reportUserFeedback, 
  buildWhatsAppSupportUrl, 
  formatAIStudioPrompt, 
  getLocalIncidents, 
  IncidentReport 
} from '../services/telemetryService';
import { motion, AnimatePresence } from 'motion/react';

interface UserSupportModalProps {
  adminWhatsAppNumber?: string;
  adminEmail?: string;
}

export const UserSupportModal: React.FC<UserSupportModalProps> = ({
  adminWhatsAppNumber = '919443389025',
  adminEmail = 'admin@smartpeindia.app'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'whatsapp' | 'report' | 'diagnostics'>('whatsapp');
  
  // Recent captured error if any
  const [recentIncident, setRecentIncident] = useState<IncidentReport | null>(null);
  const [hasNewAlert, setHasNewAlert] = useState(false);

  // Form state
  const [userNote, setUserNote] = useState('');
  const [userContact, setUserContact] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  // Listen to incidents in real-time
  useEffect(() => {
    const checkLocal = () => {
      const logs = getLocalIncidents();
      if (logs.length > 0) {
        setRecentIncident(logs[0]);
      }
    };
    checkLocal();

    const handleIncidentEvent = (e: any) => {
      const detail = e.detail as IncidentReport;
      if (detail && detail.category !== 'USER_FEEDBACK') {
        setRecentIncident(detail);
        setHasNewAlert(true);
      }
    };

    window.addEventListener('smartpe:incident_reported', handleIncidentEvent);
    return () => {
      window.removeEventListener('smartpe:incident_reported', handleIncidentEvent);
    };
  }, []);

  const handleOpen = () => {
    setIsOpen(true);
    setHasNewAlert(false);
  };

  const handleWhatsAppClick = () => {
    const waUrl = buildWhatsAppSupportUrl(adminWhatsAppNumber, recentIncident || undefined, userNote || undefined);
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userNote.trim()) return;

    setSubmitting(true);
    try {
      await reportUserFeedback(userNote, userContact, {
        recentIncident,
        pageUrl: window.location.href
      });
      setSubmitted(true);
      setUserNote('');
      setTimeout(() => {
        setSubmitted(false);
        setIsOpen(false);
      }, 3500);
    } catch (err) {
      console.error('Failed to submit report:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyPrompt = () => {
    if (!recentIncident) return;
    const prompt = formatAIStudioPrompt(recentIncident);
    navigator.clipboard.writeText(prompt);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2500);
  };

  return (
    <>
      {/* Floating Support & Alert Trigger (Bottom Right) */}
      <aside aria-label="Support and feedback" className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
        {/* Subtle Alert Bubble if a background error occurred */}
        <AnimatePresence>
          {hasNewAlert && recentIncident && !isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 15, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="mb-3 max-w-xs bg-slate-900 border-2 border-rose-500 text-white p-3.5 rounded-2xl shadow-2xl flex items-start gap-3 cursor-pointer"
              onClick={handleOpen}
            >
              <div className="p-2 bg-rose-500/20 text-rose-400 rounded-xl flex-shrink-0">
                <AlertTriangle size={18} />
              </div>
              <div className="flex-1">
                <p className="text-xs font-black uppercase text-rose-400 tracking-wide">
                  Experiencing an Issue?
                </p>
                <p className="text-[11px] text-slate-300 font-medium line-clamp-2 mt-0.5">
                  {recentIncident.title || 'An action could not complete.'} Click to get instant WhatsApp help or report it!
                </p>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); setHasNewAlert(false); }}
                className="text-slate-400 hover:text-white"
              >
                <X size={14} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Floating Trigger Button */}
        <button
          onClick={handleOpen}
          aria-label="Need Help or Report Issue"
          className="group relative flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-800 text-white rounded-full shadow-2xl hover:shadow-emerald-500/30 transition-all duration-300 hover:scale-105 border-2 border-emerald-400/40"
        >
          <div className="relative">
            <MessageCircle size={20} className="text-emerald-200 group-hover:rotate-12 transition-transform" />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-300"></span>
            </span>
          </div>
          <span className="text-xs font-black uppercase tracking-wider hidden sm:inline-block">
            Support & Help
          </span>
        </button>
      </aside>

      {/* Support & Problem Reporting Modal */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 relative">
                <button
                  onClick={() => setIsOpen(false)}
                  className="absolute top-5 right-5 p-2 bg-white/10 hover:bg-white/20 rounded-full text-slate-300 hover:text-white transition-colors"
                >
                  <X size={18} />
                </button>
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-2xl border border-emerald-500/30">
                    <MessageCircle size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black uppercase tracking-tight text-white font-display">
                      SmartPE Instant Support
                    </h2>
                    <p className="text-xs text-slate-300 font-medium mt-0.5">
                      Direct WhatsApp assistance & automated incident alert system
                    </p>
                  </div>
                </div>

                {/* Sub Tabs */}
                <div className="flex bg-black/30 p-1 rounded-xl mt-5 gap-1 border border-white/10">
                  <button
                    onClick={() => setActiveTab('whatsapp')}
                    className={`flex-1 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                      activeTab === 'whatsapp' 
                        ? 'bg-emerald-600 text-white shadow-md' 
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    <MessageCircle size={14} />
                    <span>WhatsApp</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('report')}
                    className={`flex-1 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                      activeTab === 'report' 
                        ? 'bg-indigo-600 text-white shadow-md' 
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    <AlertTriangle size={14} />
                    <span>Report Issue</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('diagnostics')}
                    className={`flex-1 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                      activeTab === 'diagnostics' 
                        ? 'bg-slate-800 text-white shadow-md' 
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    <Cpu size={14} />
                    <span>AI Prompt</span>
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto space-y-5">
                {/* TAB 1: WhatsApp Support */}
                {activeTab === 'whatsapp' && (
                  <div className="space-y-4">
                    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-emerald-950">
                      <div className="flex items-center gap-2 mb-1">
                        <CheckCircle size={18} className="text-emerald-600 flex-shrink-0" />
                        <h3 className="text-sm font-black uppercase text-emerald-900">
                          Fastest Resolution via WhatsApp
                        </h3>
                      </div>
                      <p className="text-xs text-emerald-800 leading-relaxed">
                        Speak directly with our team. If you faced an error (AI Plan quota, login issue, or tournament check-in), we can rectify it immediately!
                      </p>
                    </div>

                    {recentIncident && (
                      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-1">
                        <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                          Auto-Detected Error Context
                        </span>
                        <p className="text-xs font-bold text-slate-800">
                          {recentIncident.title}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate">
                          {recentIncident.message}
                        </p>
                      </div>
                    )}

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-700 block">
                        Optional: Briefly explain what you were trying to do
                      </label>
                      <input
                        type="text"
                        value={userNote}
                        onChange={(e) => setUserNote(e.target.value)}
                        placeholder="e.g. Trying to generate Class 12 CBSE plan or login to fitness test..."
                        className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                      />
                    </div>

                    <button
                      onClick={handleWhatsAppClick}
                      className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm uppercase tracking-wider rounded-2xl shadow-xl shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
                    >
                      <MessageCircle size={18} />
                      <span>Chat on WhatsApp Now ({adminWhatsAppNumber})</span>
                      <ExternalLink size={14} className="opacity-75" />
                    </button>
                    
                    <p className="text-[11px] text-center text-slate-400">
                      Opens WhatsApp Web or App with pre-filled diagnostics.
                    </p>
                  </div>
                )}

                {/* TAB 2: Report an Issue */}
                {activeTab === 'report' && (
                  <div>
                    {submitted ? (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center space-y-2">
                        <CheckCircle size={36} className="text-emerald-600 mx-auto" />
                        <h4 className="text-base font-black text-emerald-900">Incident Reported!</h4>
                        <p className="text-xs text-emerald-700">
                          Our technical team has been notified via Email and WhatsApp. We are investigating and resolving this.
                        </p>
                      </div>
                    ) : (
                      <form onSubmit={handleSubmitReport} className="space-y-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-black uppercase text-slate-700">
                            What problem did you face? *
                          </label>
                          <textarea
                            required
                            rows={3}
                            value={userNote}
                            onChange={(e) => setUserNote(e.target.value)}
                            placeholder="Describe what failed (e.g. API key didn't generate results, couldn't log into fitness test, tournament check-in error)..."
                            className="w-full p-3 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-black uppercase text-slate-700">
                            Your WhatsApp Number or Email (Optional for updates)
                          </label>
                          <input
                            type="text"
                            value={userContact}
                            onChange={(e) => setUserContact(e.target.value)}
                            placeholder="e.g. +91 98765 43210 or yourname@school.com"
                            className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                          />
                        </div>

                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-[11px] text-slate-500 flex items-center gap-2">
                          <ShieldAlert size={16} className="text-indigo-600 flex-shrink-0" />
                          <span>
                            Automated error code, page URL, and device diagnostics will be included automatically.
                          </span>
                        </div>

                        <button
                          type="submit"
                          disabled={submitting || !userNote.trim()}
                          className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all"
                        >
                          {submitting ? (
                            <span>Sending Telemetry Alert...</span>
                          ) : (
                            <>
                              <Send size={15} />
                              <span>Submit Problem & Alert Admin</span>
                            </>
                          )}
                        </button>
                      </form>
                    )}
                  </div>
                )}

                {/* TAB 3: Developer / AI Prompt */}
                {activeTab === 'diagnostics' && (
                  <div className="space-y-4">
                    <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 text-indigo-950">
                      <div className="flex items-center gap-2 mb-1">
                        <Cpu size={18} className="text-indigo-600 flex-shrink-0" />
                        <h4 className="text-xs font-black uppercase text-indigo-900">
                          One-Click AI Studio Prompt
                        </h4>
                      </div>
                      <p className="text-[11px] text-indigo-800 leading-relaxed">
                        Copy this prompt and paste it directly into your AI Studio conversation. The assistant will immediately know the exact error and rectify it!
                      </p>
                    </div>

                    {recentIncident ? (
                      <div className="space-y-2">
                        <div className="bg-slate-900 text-emerald-400 p-3 rounded-xl font-mono text-[11px] overflow-x-auto max-h-48 border border-slate-800">
                          <pre className="whitespace-pre-wrap">{formatAIStudioPrompt(recentIncident)}</pre>
                        </div>

                        <button
                          onClick={handleCopyPrompt}
                          className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 shadow-md transition-all"
                        >
                          {copiedPrompt ? (
                            <>
                              <Check size={16} className="text-emerald-400" />
                              <span className="text-emerald-400">Copied to Clipboard!</span>
                            </>
                          ) : (
                            <>
                              <Copy size={16} />
                              <span>Copy Prompt for AI Studio Developer</span>
                            </>
                          )}
                        </button>
                      </div>
                    ) : (
                      <div className="p-6 bg-slate-50 border border-dashed border-slate-300 rounded-2xl text-center text-slate-500 text-xs">
                        No recent errors captured. System is healthy!
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
