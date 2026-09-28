import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Send, 
  Copy, 
  Check, 
  ExternalLink, 
  ShieldCheck, 
  Mail, 
  Server, 
  Key, 
  ArrowRight,
  Info,
  Clock
} from 'lucide-react';
import { toast } from '../services/toast';
import { getBrevoLiveStatus, sendBrevoTestEmail, BrevoLiveStatus } from '../services/emailService';

interface BrevoSetupHubProps {
  userEmail?: string | null;
  onNavigateToNurture?: () => void;
}

export const BrevoSetupHub: React.FC<BrevoSetupHubProps> = ({ 
  userEmail = 'alsamy36@gmail.com',
  onNavigateToNurture
}) => {
  const [status, setStatus] = useState<BrevoLiveStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [testEmail, setTestEmail] = useState(userEmail || 'alsamy36@gmail.com');
  const [sendingTest, setSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; messageId?: string } | null>(null);
  const [copiedEnv, setCopiedEnv] = useState(false);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const data = await getBrevoLiveStatus();
      setStatus(data);
    } catch {
      toast.error('Could not connect to email service diagnostics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleSendTest = async () => {
    if (!testEmail || !testEmail.includes('@')) {
      toast.error('Please enter a valid recipient email address');
      return;
    }

    setSendingTest(true);
    setTestResult(null);
    try {
      const res = await sendBrevoTestEmail(testEmail);
      setTestResult({
        success: res.success,
        message: res.message
      });

      if (res.success) {
        toast.success(`Test email dispatched to ${testEmail}!`);
      } else {
        toast.error(res.message || 'Failed to dispatch test email');
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Network error occurred while testing'
      });
      toast.error('Test dispatch failed');
    } finally {
      setSendingTest(false);
    }
  };

  const envSnippet = `# Brevo (Sendinblue) Transactional Email Configuration
# 300 Free Emails / Day • No Credit Card Required
BREVO_API_KEY=your_brevo_v3_api_key_here
FROM_EMAIL="Smart PE India <alsamy36@gmail.com>"`;

  const handleCopyEnv = () => {
    navigator.clipboard.writeText(envSnippet);
    setCopiedEnv(true);
    toast.success('.env configuration copied to clipboard!');
    setTimeout(() => setCopiedEnv(false), 3000);
  };

  return (
    <div className="space-y-8">
      {/* Hero Banner */}
      <div className="bg-[#0D2B52] text-white p-8 md:p-10 rounded-[2.5rem] border-4 border-slate-900 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-12 -mt-12 w-72 h-72 bg-[#D4A017]/15 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1 bg-[#D4A017] text-[#0D2B52] rounded-full text-xs font-black uppercase tracking-wider">
              <Zap size={14} />
              <span>Brevo Transactional Email Engine</span>
            </div>
            <h2 className="text-2xl md:text-4xl font-black font-display uppercase tracking-tight">
              Brevo (Sendinblue) Setup & Diagnostic Console
            </h2>
            <p className="text-slate-300 text-sm md:text-base leading-relaxed">
              Connect <a href="https://www.brevo.com" target="_blank" rel="noopener noreferrer" className="text-[#D4A017] underline font-bold hover:text-white">Brevo.com</a> to power automated educator welcome emails, 1-Year Free Founding Pass notifications, and the 3-part pedagogical nurture sequence with <strong>300 free emails per day</strong>.
            </p>
          </div>

          {/* Quick Status Pill */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 p-5 rounded-2xl text-center min-w-[220px] space-y-2">
            <p className="text-[10px] uppercase font-black tracking-widest text-[#D4A017]">Brevo Status</p>
            {loading ? (
              <div className="flex items-center justify-center space-x-2 text-white font-bold text-sm">
                <RefreshCw size={16} className="animate-spin text-[#D4A017]" />
                <span>Checking...</span>
              </div>
            ) : status?.connected ? (
              <div className="space-y-1">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full text-xs font-black uppercase tracking-wide">
                  <CheckCircle2 size={13} className="text-emerald-400" />
                  <span>Connected</span>
                </span>
                <p className="text-xs text-slate-300 font-medium">300 Free/Day Active</p>
              </div>
            ) : status?.apiKeyFound ? (
              <div className="space-y-1">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full text-xs font-black uppercase tracking-wide">
                  <AlertCircle size={13} className="text-amber-400" />
                  <span>Key Pending</span>
                </span>
                <p className="text-[11px] text-amber-200">Auth error with Brevo API</p>
              </div>
            ) : (
              <div className="space-y-1">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-500/20 text-rose-300 border border-rose-500/40 rounded-full text-xs font-black uppercase tracking-wide">
                  <AlertCircle size={13} className="text-rose-400" />
                  <span>Not Configured</span>
                </span>
                <p className="text-[11px] text-slate-300">Set key in .env</p>
              </div>
            )}

            <button
              onClick={fetchStatus}
              disabled={loading}
              className="mt-2 text-[11px] font-bold text-slate-300 hover:text-white flex items-center justify-center gap-1 mx-auto cursor-pointer"
            >
              <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
              <span>Refresh Status</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Status Details & Live Test */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Card 1: Connection & Account Details */}
        <div className="bg-white p-6 md:p-8 rounded-[2rem] border-2 border-slate-900 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-[#0D2B52] text-[#D4A017] flex items-center justify-center shadow-md">
                <Server size={20} />
              </div>
              <div>
                <h3 className="text-lg font-black uppercase text-slate-900 tracking-tight">Brevo Service Status</h3>
                <p className="text-xs text-slate-500 font-bold">API v3 SMTP Integration</p>
              </div>
            </div>

            <button
              onClick={fetchStatus}
              className="p-2 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-all cursor-pointer"
              title="Refresh connection status"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin text-primary' : ''} />
            </button>
          </div>

          {/* Diagnostic Metrics */}
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-sm">
              <span className="font-bold text-slate-600 flex items-center gap-2">
                <Key size={15} className="text-[#0D2B52]" />
                <span>BREVO_API_KEY</span>
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-black uppercase ${
                status?.apiKeyFound 
                  ? 'bg-emerald-100 text-emerald-800' 
                  : 'bg-rose-100 text-rose-800'
              }`}>
                {status?.apiKeyFound ? 'Configured in Environment' : 'Missing from .env'}
              </span>
            </div>

            <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-sm">
              <span className="font-bold text-slate-600 flex items-center gap-2">
                <Mail size={15} className="text-[#0D2B52]" />
                <span>Sender Email (FROM_EMAIL)</span>
              </span>
              <span className="font-mono text-xs font-bold text-slate-900 truncate max-w-[200px]" title={status?.fromEmail}>
                {status?.fromEmail || 'alsamy36@gmail.com'}
              </span>
            </div>

            <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-sm">
              <span className="font-bold text-slate-600 flex items-center gap-2">
                <ShieldCheck size={15} className="text-[#0D2B52]" />
                <span>Sender Verification</span>
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-black uppercase flex items-center gap-1 ${
                status?.senderVerified 
                  ? 'bg-emerald-100 text-emerald-800' 
                  : status?.connected 
                    ? 'bg-amber-100 text-amber-800' 
                    : 'bg-slate-200 text-slate-600'
              }`}>
                {status?.senderVerified ? (
                  <>
                    <Check size={12} />
                    <span>Verified on Brevo</span>
                  </>
                ) : status?.connected ? (
                  <>
                    <AlertCircle size={12} />
                    <span>Action Required</span>
                  </>
                ) : (
                  <span>Pending Setup</span>
                )}
              </span>
            </div>

            {status?.account && (
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 space-y-1.5 text-xs text-emerald-900">
                <div className="flex justify-between font-bold">
                  <span>Brevo Account Owner:</span>
                  <span className="font-mono">{status.account.email}</span>
                </div>
                {status.account.companyName && (
                  <div className="flex justify-between font-bold">
                    <span>Account / Company:</span>
                    <span>{status.account.companyName}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold">
                  <span>Plan / Daily Limit:</span>
                  <span className="text-emerald-700 uppercase font-black">
                    {status.account.planType} • 300 emails/day
                  </span>
                </div>
              </div>
            )}

            {/* Error Message Alert */}
            {status?.error && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs space-y-1.5 text-rose-900">
                <div className="flex items-center gap-2 font-black uppercase text-rose-800">
                  <AlertCircle size={15} className="text-rose-600" />
                  <span>Diagnostics Note:</span>
                </div>
                <p className="font-medium text-slate-700">{status.error}</p>
              </div>
            )}
          </div>

          {/* Brevo Action Link */}
          <div className="pt-2 flex items-center justify-between border-t border-slate-200 text-xs">
            <span className="text-slate-500 font-bold">Brevo Dashboard:</span>
            <a
              href="https://app.brevo.com/settings/keys/api"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#0D2B52] font-black uppercase tracking-wider flex items-center gap-1 hover:text-[#D4A017] transition-colors"
            >
              <span>Brevo API Keys Page</span>
              <ExternalLink size={13} />
            </a>
          </div>
        </div>

        {/* Card 2: Live Test Dispatcher */}
        <div className="bg-white p-6 md:p-8 rounded-[2rem] border-2 border-slate-900 shadow-xl space-y-6">
          <div className="flex items-center space-x-3 border-b border-slate-200 pb-4">
            <div className="w-10 h-10 rounded-xl bg-[#D4A017] text-[#0D2B52] flex items-center justify-center shadow-md">
              <Send size={20} />
            </div>
            <div>
              <h3 className="text-lg font-black uppercase text-slate-900 tracking-tight">Send Live Test Email</h3>
              <p className="text-xs text-slate-500 font-bold">Verify end-to-end inbox delivery</p>
            </div>
          </div>

          <p className="text-xs md:text-sm text-slate-600 leading-relaxed">
            Dispatch a real branded test email via Brevo to confirm that credentials, sender identity, and inbox delivery are fully operational.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-700 mb-1 flex items-center gap-1.5">
                <Mail size={13} className="text-primary" />
                <span>Recipient Email for Test</span>
              </label>
              <input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="alsamy36@gmail.com"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl font-bold text-sm text-slate-900 focus:outline-none focus:border-primary focus:bg-white transition-all"
              />
            </div>

            <button
              onClick={handleSendTest}
              disabled={sendingTest || !testEmail}
              className="w-full py-4 bg-[#0D2B52] text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-[#153e75] disabled:opacity-50 transition-all flex items-center justify-center space-x-2 shadow-lg cursor-pointer"
            >
              {sendingTest ? (
                <>
                  <RefreshCw size={16} className="animate-spin text-[#D4A017]" />
                  <span>Dispatching Test Email...</span>
                </>
              ) : (
                <>
                  <Send size={16} className="text-[#D4A017]" />
                  <span>Send Test Email Now</span>
                </>
              )}
            </button>

            {/* Test Result Feedback */}
            {testResult && (
              <div className={`p-4 rounded-xl border text-xs font-bold space-y-1 ${
                testResult.success 
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900' 
                  : 'bg-rose-50 border-rose-300 text-rose-900'
              }`}>
                <div className="flex items-center gap-2">
                  {testResult.success ? (
                    <CheckCircle2 size={16} className="text-emerald-600" />
                  ) : (
                    <AlertCircle size={16} className="text-rose-600" />
                  )}
                  <span className="font-black uppercase">
                    {testResult.success ? 'Dispatch Successful!' : 'Dispatch Error'}
                  </span>
                </div>
                <p className="font-medium text-slate-700 pl-6 leading-relaxed">
                  {testResult.message}
                </p>
              </div>
            )}

            <div className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-xl text-xs text-amber-900 space-y-1">
              <div className="flex items-center gap-1.5 font-black uppercase text-amber-800">
                <Info size={14} />
                <span>Tip: Check Your Inbox / Spam</span>
              </div>
              <p className="font-medium text-amber-900/80 leading-relaxed">
                When sending via Brevo for the first time, check both your primary inbox and spam folder. Add <span className="font-mono font-bold">{status?.fromEmail || 'alsamy36@gmail.com'}</span> to your contacts to ensure 100% primary inbox placement.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Step-by-Step Setup Guide */}
      <div className="bg-white p-6 md:p-10 rounded-[2.5rem] border-2 border-slate-900 shadow-xl space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-900 rounded-full text-xs font-black uppercase tracking-wider mb-2">
              <Zap size={13} className="text-amber-600" />
              <span>Quick 4-Step Walkthrough</span>
            </div>
            <h3 className="text-2xl font-black text-slate-900 uppercase font-display">
              How to Connect Brevo in 3 Minutes
            </h3>
            <p className="text-slate-600 text-xs md:text-sm font-medium mt-1">
              Follow these simple steps to activate free transactional emails on Brevo.com
            </p>
          </div>

          <a
            href="https://www.brevo.com"
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-3 bg-[#0D2B52] text-white font-black text-xs uppercase tracking-wider rounded-xl hover:bg-[#153e75] transition-all flex items-center gap-2 shadow-md w-fit"
          >
            <span>Open Brevo.com</span>
            <ExternalLink size={14} className="text-[#D4A017]" />
          </a>
        </div>

        {/* 4 Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Step 1 */}
          <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 relative hover:bg-white hover:border-[#0D2B52] transition-all">
            <div className="w-8 h-8 rounded-full bg-[#0D2B52] text-[#D4A017] flex items-center justify-center font-black text-sm">
              1
            </div>
            <h4 className="font-black text-slate-900 uppercase text-sm">Create Free Account</h4>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Sign up at <a href="https://www.brevo.com" target="_blank" rel="noopener noreferrer" className="text-primary font-bold underline">brevo.com</a> using your email (e.g., <span className="font-bold">alsamy36@gmail.com</span>). No credit card required. Free tier includes 300 emails/day forever.
            </p>
          </div>

          {/* Step 2 */}
          <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 relative hover:bg-white hover:border-[#0D2B52] transition-all">
            <div className="w-8 h-8 rounded-full bg-[#0D2B52] text-[#D4A017] flex items-center justify-center font-black text-sm">
              2
            </div>
            <h4 className="font-black text-slate-900 uppercase text-sm">Verify Sender Email</h4>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              In Brevo, go to <strong>Senders & IPs → Senders</strong> (<a href="https://app.brevo.com/senders" target="_blank" rel="noopener noreferrer" className="text-primary font-bold underline">direct link</a>). Verify that <span className="font-bold">alsamy36@gmail.com</span> is listed and marked as Active.
            </p>
          </div>

          {/* Step 3 */}
          <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 relative hover:bg-white hover:border-[#0D2B52] transition-all">
            <div className="w-8 h-8 rounded-full bg-[#0D2B52] text-[#D4A017] flex items-center justify-center font-black text-sm">
              3
            </div>
            <h4 className="font-black text-slate-900 uppercase text-sm">Generate API Key (v3)</h4>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Go to <strong>SMTP & API → API Keys</strong> (<a href="https://app.brevo.com/settings/keys/api" target="_blank" rel="noopener noreferrer" className="text-primary font-bold underline">direct link</a>). Click <strong>"Generate a new API key"</strong>, name it <em>Smart PE India</em>, and copy the key string (starts with <span className="font-mono font-bold">xkeysib-</span>).
            </p>
          </div>

          {/* Step 4 */}
          <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 relative hover:bg-white hover:border-[#0D2B52] transition-all">
            <div className="w-8 h-8 rounded-full bg-[#0D2B52] text-[#D4A017] flex items-center justify-center font-black text-sm">
              4
            </div>
            <h4 className="font-black text-slate-900 uppercase text-sm">Add to Environment</h4>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Set <span className="font-mono font-bold">BREVO_API_KEY</span> and <span className="font-mono font-bold">FROM_EMAIL</span> in your <span className="font-mono font-bold">.env</span> file. Then click <strong>"Refresh Status"</strong> above or test with the dispatcher.
            </p>
          </div>
        </div>

        {/* Copyable .env Block */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Server size={14} className="text-primary" />
              <span>Environment Configuration (.env snippet)</span>
            </label>

            <button
              onClick={handleCopyEnv}
              className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-lg transition-all flex items-center gap-1.5 border border-slate-300 cursor-pointer"
            >
              {copiedEnv ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
              <span>{copiedEnv ? 'Copied!' : 'Copy .env snippet'}</span>
            </button>
          </div>

          <pre className="p-4 bg-slate-950 text-slate-100 rounded-2xl text-xs font-mono overflow-x-auto border-2 border-slate-800 leading-relaxed">
            <code>{envSnippet}</code>
          </pre>
        </div>

        {/* What Brevo Powers in Smart PE India */}
        <div className="pt-6 border-t border-slate-200 space-y-4">
          <h4 className="text-base font-black uppercase text-slate-900">
            Automations Powered by Brevo in Smart PE India:
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <p className="text-xs font-black uppercase text-[#0D2B52] flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-emerald-600" />
                <span>Instant Welcome Pass (Day 0)</span>
              </p>
              <p className="text-xs text-slate-600">
                Dispatches the 1-Year Free Founding Pass confirmation immediately when a new educator registers.
              </p>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <p className="text-xs font-black uppercase text-[#0D2B52] flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-emerald-600" />
                <span>3-Part Nurture Sequence</span>
              </p>
              <p className="text-xs text-slate-600">
                Automated drip guides on Day 2 (AI Lesson Planner) and Day 5 (Khelo India Fitness Battery).
              </p>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <p className="text-xs font-black uppercase text-[#0D2B52] flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-emerald-600" />
                <span>Feature Announcements</span>
              </p>
              <p className="text-xs text-slate-600">
                Broadcast new syllabus updates, CBSE question paper generators, and sports fixtures to your teachers.
              </p>
            </div>
          </div>

          {onNavigateToNurture && (
            <div className="pt-2 flex justify-end">
              <button
                onClick={onNavigateToNurture}
                className="text-xs font-black uppercase tracking-wider text-[#0D2B52] hover:text-[#D4A017] flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span>Go to 3-Part Nurture Sequence Hub</span>
                <ArrowRight size={14} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BrevoSetupHub;
