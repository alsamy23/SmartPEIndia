import React, { useState, useEffect } from 'react';
import { 
  Mail, 
  Sparkles, 
  Send, 
  CheckCircle2, 
  Clock, 
  Zap, 
  Calendar, 
  Copy, 
  Check, 
  Download, 
  Code2, 
  FileText, 
  Eye, 
  UserCheck, 
  Building, 
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Award,
  ChevronRight,
  BookOpen,
  Trophy
} from 'lucide-react';
import { toast } from '../services/toast';
import { trackEvent } from '../services/analytics';
import { 
  triggerNurtureStep, 
  evaluateNurtureSequence, 
  fetchNurturePreview, 
  getEmailConfigStatus,
  EmailServiceStatus,
  NurtureEvaluationResult
} from '../services/emailService';

interface NurtureSequenceHubProps {
  userEmail?: string | null;
  userName?: string | null;
  schoolName?: string | null;
  registrationDate?: string | null;
  onNavigateToBrevo?: () => void;
}

export const NurtureSequenceHub: React.FC<NurtureSequenceHubProps> = ({
  userEmail = 'teacher@school.edu.in',
  userName = 'Physical Education Educator',
  schoolName = 'Smart PE Partner School',
  registrationDate,
  onNavigateToBrevo
}) => {
  const [selectedStep, setSelectedStep] = useState<1 | 2 | 3>(1);
  const [recipientEmail, setRecipientEmail] = useState(userEmail || '');
  const [customName, setCustomName] = useState(userName || 'Physical Education Educator');
  const [customSchool, setCustomSchool] = useState(schoolName || 'Smart PE Partner School');
  const [emailConfig, setEmailConfig] = useState<EmailServiceStatus | null>(null);

  // Simulation state
  const [simulatedDaysAgo, setSimulatedDaysAgo] = useState<number>(0);
  const [step1SentAt, setStep1SentAt] = useState<string | null>(new Date().toISOString());
  const [step2SentAt, setStep2SentAt] = useState<string | null>(null);
  const [step3SentAt, setStep3SentAt] = useState<string | null>(null);
  const [evaluating, setEvaluating] = useState<boolean>(false);
  const [lastEvalResult, setLastEvalResult] = useState<NurtureEvaluationResult | null>(null);

  // Preview data
  const [previewData, setPreviewData] = useState<{
    step: number;
    stepName: string;
    triggerDay: string;
    subject: string;
    html: string;
    text: string;
  } | null>(null);
  const [previewMode, setPreviewMode] = useState<'iframe' | 'html' | 'text'>('iframe');
  const [copiedHtml, setCopiedHtml] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [sendingStep, setSendingStep] = useState<number | null>(null);

  // Load email configuration status
  useEffect(() => {
    getEmailConfigStatus().then(status => setEmailConfig(status));
  }, []);

  // Fetch email template preview when selected step, name, or school changes
  useEffect(() => {
    fetchNurturePreview(selectedStep, customName, customSchool).then(data => {
      setPreviewData(data);
    });
  }, [selectedStep, customName, customSchool]);

  const handleSimulateDate = (daysAgo: number) => {
    setSimulatedDaysAgo(daysAgo);
    if (daysAgo === 0) {
      setStep1SentAt(new Date().toISOString());
      setStep2SentAt(null);
      setStep3SentAt(null);
    } else if (daysAgo >= 2 && daysAgo < 5) {
      setStep1SentAt(new Date(Date.now() - daysAgo * 86400000).toISOString());
      setStep2SentAt(null);
      setStep3SentAt(null);
    } else if (daysAgo >= 5) {
      setStep1SentAt(new Date(Date.now() - daysAgo * 86400000).toISOString());
      setStep2SentAt(new Date(Date.now() - (daysAgo - 2) * 86400000).toISOString());
      setStep3SentAt(null);
    }
  };

  const handleEvaluateSequence = async () => {
    if (!recipientEmail || !recipientEmail.includes('@')) {
      toast.error('Please enter a valid recipient email address');
      return;
    }

    setEvaluating(true);
    try {
      const regDate = new Date(Date.now() - simulatedDaysAgo * 86400000).toISOString();
      const result = await evaluateNurtureSequence({
        toEmail: recipientEmail,
        recipientName: customName,
        schoolName: customSchool,
        createdAt: regDate,
        step1SentAt,
        step2SentAt,
        step3SentAt
      });

      setLastEvalResult(result);

      if (result.updatedStatus) {
        setStep1SentAt(result.updatedStatus.step1SentAt);
        setStep2SentAt(result.updatedStatus.step2SentAt);
        setStep3SentAt(result.updatedStatus.step3SentAt);
      }

      if (result.dispatchedStep) {
        toast.success(`Triggered Part ${result.dispatchedStep}: ${result.stepName}!`);
        trackEvent('tool_used', { tool_name: `nurture_step_${result.dispatchedStep}_triggered`, category: 'marketing' });
      } else {
        toast.info(result.message);
      }
    } catch (err: any) {
      toast.error(err.message || 'Evaluation failed');
    } finally {
      setEvaluating(false);
    }
  };

  const handleDirectTrigger = async (step: 1 | 2 | 3) => {
    if (!recipientEmail || !recipientEmail.includes('@')) {
      toast.error('Please enter a valid recipient email address');
      return;
    }

    setSendingStep(step);
    try {
      const res = await triggerNurtureStep(recipientEmail, step, customName, customSchool);
      if (res.success) {
        toast.success(`Part ${step} (${res.stepName}) sent to ${recipientEmail}!`);
        const nowIso = new Date().toISOString();
        if (step === 1) setStep1SentAt(nowIso);
        if (step === 2) setStep2SentAt(nowIso);
        if (step === 3) setStep3SentAt(nowIso);
        trackEvent('tool_used', { tool_name: `manual_nurture_step_${step}`, category: 'marketing' });
      } else {
        toast.error(res.message);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to trigger nurture step');
    } finally {
      setSendingStep(null);
    }
  };

  const handleCopyHtml = () => {
    if (!previewData) return;
    navigator.clipboard.writeText(previewData.html);
    setCopiedHtml(true);
    toast.success(`Part ${selectedStep} HTML copied to clipboard!`);
    setTimeout(() => setCopiedHtml(false), 2500);
  };

  const handleCopyText = () => {
    if (!previewData) return;
    navigator.clipboard.writeText(`Subject: ${previewData.subject}\n\n${previewData.text}`);
    setCopiedText(true);
    toast.success(`Part ${selectedStep} plain text copied!`);
    setTimeout(() => setCopiedText(false), 2500);
  };

  const handleDownloadHtml = () => {
    if (!previewData) return;
    const blob = new Blob([previewData.html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Smart_PE_Nurture_Part_${selectedStep}_${previewData.triggerDay}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Downloaded HTML file!');
  };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-[#0D2B52] text-white p-8 rounded-[2.5rem] border-4 border-slate-900 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-12 -mt-12 w-64 h-64 bg-[#D4A017]/15 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1 bg-[#D4A017] text-[#0D2B52] rounded-full text-xs font-black uppercase tracking-wider">
              <Zap size={14} />
              <span>Automated Educator Nurture Engine</span>
            </div>
            <h2 className="text-2xl md:text-4xl font-black font-display uppercase tracking-tight">
              3-Part Email Nurture Sequence
            </h2>
            <p className="text-slate-300 text-sm md:text-base leading-relaxed">
              Every educator who registers on Smart PE India automatically enters this corporate 3-stage nurture sequence to maximize activation, classroom adoption, and school-wide impact.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md border border-white/20 p-5 rounded-2xl text-center min-w-[200px] space-y-1.5">
            <p className="text-[10px] uppercase font-black tracking-widest text-[#D4A017]">Active Email Provider</p>
            <p className="text-lg font-black uppercase text-white tracking-wide">
              {emailConfig?.provider === 'brevo' ? '⚡ Brevo API (Active)' : emailConfig?.provider === 'resend' ? '🚀 Resend API (Active)' : emailConfig?.provider === 'smtp' ? '📬 SMTP / Gmail' : '🖥️ Corporate Simulator'}
            </p>
            <p className="text-[11px] text-slate-300">
              {emailConfig?.fromEmail || 'welcome@smartpeindia.app'}
            </p>
            {onNavigateToBrevo && (
              <button
                onClick={onNavigateToBrevo}
                className="mt-1 text-[11px] font-bold text-[#D4A017] hover:text-white underline block mx-auto cursor-pointer"
              >
                ⚙️ Brevo Setup & Test
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3 Steps Visual Sequence Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Step 1 Card */}
        <div 
          onClick={() => setSelectedStep(1)}
          className={`cursor-pointer p-6 rounded-[2rem] border-2 transition-all space-y-4 relative ${
            selectedStep === 1 
              ? 'bg-white border-[#0D2B52] shadow-[4px_4px_0px_0px_rgba(13,43,82,1)] ring-2 ring-[#0D2B52]/20' 
              : 'bg-slate-50 border-slate-300 hover:bg-white hover:border-slate-400'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="px-3 py-1 bg-amber-100 text-amber-900 rounded-full text-xs font-black uppercase tracking-wider">
              Day 0 • Immediate
            </span>
            <span className="w-8 h-8 rounded-full bg-[#0D2B52] text-white flex items-center justify-center font-black text-xs">
              1
            </span>
          </div>
          <div>
            <h3 className="text-lg font-black text-[#0D2B52] uppercase font-display">Welcome & 1-Year Pass</h3>
            <p className="text-xs text-slate-600 font-medium mt-1 leading-relaxed">
              Confirms account activation, unlocks the 1-Year Free Founding Pass, and outlines the 6 core pillars of the portal.
            </p>
          </div>
          <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs font-bold text-slate-700">
            <span className="flex items-center gap-1 text-emerald-700">
              <CheckCircle2 size={14} />
              <span>Activation CTA</span>
            </span>
            <button 
              onClick={(e) => { e.stopPropagation(); handleDirectTrigger(1); }}
              disabled={sendingStep === 1}
              className="text-primary hover:underline flex items-center gap-1 font-black"
            >
              <span>{sendingStep === 1 ? 'Sending...' : 'Test Send'}</span>
              <Send size={12} />
            </button>
          </div>
        </div>

        {/* Step 2 Card */}
        <div 
          onClick={() => setSelectedStep(2)}
          className={`cursor-pointer p-6 rounded-[2rem] border-2 transition-all space-y-4 relative ${
            selectedStep === 2 
              ? 'bg-white border-[#0D2B52] shadow-[4px_4px_0px_0px_rgba(13,43,82,1)] ring-2 ring-[#0D2B52]/20' 
              : 'bg-slate-50 border-slate-300 hover:bg-white hover:border-slate-400'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="px-3 py-1 bg-blue-100 text-blue-900 rounded-full text-xs font-black uppercase tracking-wider">
              Day 2 • Value Delivery
            </span>
            <span className="w-8 h-8 rounded-full bg-[#0D2B52] text-white flex items-center justify-center font-black text-xs">
              2
            </span>
          </div>
          <div>
            <h3 className="text-lg font-black text-[#0D2B52] uppercase font-display">AI PE Lesson Planner</h3>
            <p className="text-xs text-slate-600 font-medium mt-1 leading-relaxed">
              Focuses on saving 3+ hours per week by generating 60-second CBSE & ICSE structured 40-minute plans with safety cues.
            </p>
          </div>
          <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs font-bold text-slate-700">
            <span className="flex items-center gap-1 text-blue-700">
              <Zap size={14} />
              <span>Generate Plan CTA</span>
            </span>
            <button 
              onClick={(e) => { e.stopPropagation(); handleDirectTrigger(2); }}
              disabled={sendingStep === 2}
              className="text-primary hover:underline flex items-center gap-1 font-black"
            >
              <span>{sendingStep === 2 ? 'Sending...' : 'Test Send'}</span>
              <Send size={12} />
            </button>
          </div>
        </div>

        {/* Step 3 Card */}
        <div 
          onClick={() => setSelectedStep(3)}
          className={`cursor-pointer p-6 rounded-[2rem] border-2 transition-all space-y-4 relative ${
            selectedStep === 3 
              ? 'bg-white border-[#0D2B52] shadow-[4px_4px_0px_0px_rgba(13,43,82,1)] ring-2 ring-[#0D2B52]/20' 
              : 'bg-slate-50 border-slate-300 hover:bg-white hover:border-slate-400'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="px-3 py-1 bg-emerald-100 text-emerald-900 rounded-full text-xs font-black uppercase tracking-wider">
              Day 5 • High Impact
            </span>
            <span className="w-8 h-8 rounded-full bg-[#0D2B52] text-white flex items-center justify-center font-black text-xs">
              3
            </span>
          </div>
          <div>
            <h3 className="text-lg font-black text-[#0D2B52] uppercase font-display">Khelo India & Fitness</h3>
            <p className="text-xs text-slate-600 font-medium mt-1 leading-relaxed">
              Showcases official SAI 8-test battery, instant national percentile computations, and 1-click printable Student Health Cards.
            </p>
          </div>
          <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs font-bold text-slate-700">
            <span className="flex items-center gap-1 text-emerald-700">
              <Trophy size={14} />
              <span>Assessment CTA</span>
            </span>
            <button 
              onClick={(e) => { e.stopPropagation(); handleDirectTrigger(3); }}
              disabled={sendingStep === 3}
              className="text-primary hover:underline flex items-center gap-1 font-black"
            >
              <span>{sendingStep === 3 ? 'Sending...' : 'Test Send'}</span>
              <Send size={12} />
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Registration Date Simulator & Automation Trigger */}
      <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border-2 border-slate-900 shadow-xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-100 text-indigo-900 rounded-full text-xs font-black uppercase tracking-wider mb-2">
              <Clock size={13} className="text-indigo-600" />
              <span>Automated Schedule Simulator</span>
            </div>
            <h3 className="text-xl font-black text-slate-900 uppercase font-display">
              Test Registration Date & Auto-Trigger Logic
            </h3>
            <p className="text-slate-600 text-xs md:text-sm font-medium mt-0.5">
              Simulate a teacher's registration date to test how the automated evaluator schedules Part 1, Part 2, and Part 3.
            </p>
          </div>

          <button
            onClick={handleEvaluateSequence}
            disabled={evaluating}
            className="px-6 py-3.5 bg-[#0D2B52] text-white font-black text-xs uppercase tracking-wider rounded-xl hover:bg-[#153e75] disabled:opacity-50 transition-all flex items-center gap-2 shadow-lg cursor-pointer"
          >
            <RefreshCw size={15} className={evaluating ? 'animate-spin' : ''} />
            <span>{evaluating ? 'Evaluating...' : '⚡ Evaluate & Trigger Next Due Email'}</span>
          </button>
        </div>

        {/* Date Simulation Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <button
            onClick={() => handleSimulateDate(0)}
            className={`p-3.5 rounded-2xl border-2 text-left transition-all ${
              simulatedDaysAgo === 0 
                ? 'bg-slate-900 text-white border-slate-900 shadow-md' 
                : 'bg-slate-50 border-slate-300 hover:bg-slate-100 text-slate-800'
            }`}
          >
            <p className="text-[10px] font-black uppercase tracking-wider text-[#D4A017]">Registration Today</p>
            <p className="text-sm font-black">Day 0 (Welcome Pass)</p>
          </button>

          <button
            onClick={() => handleSimulateDate(2)}
            className={`p-3.5 rounded-2xl border-2 text-left transition-all ${
              simulatedDaysAgo === 2 
                ? 'bg-slate-900 text-white border-slate-900 shadow-md' 
                : 'bg-slate-50 border-slate-300 hover:bg-slate-100 text-slate-800'
            }`}
          >
            <p className="text-[10px] font-black uppercase tracking-wider text-[#D4A017]">Registered 2 Days Ago</p>
            <p className="text-sm font-black">Day 2 (AI Lesson Planner)</p>
          </button>

          <button
            onClick={() => handleSimulateDate(5)}
            className={`p-3.5 rounded-2xl border-2 text-left transition-all ${
              simulatedDaysAgo === 5 
                ? 'bg-slate-900 text-white border-slate-900 shadow-md' 
                : 'bg-slate-50 border-slate-300 hover:bg-slate-100 text-slate-800'
            }`}
          >
            <p className="text-[10px] font-black uppercase tracking-wider text-[#D4A017]">Registered 5 Days Ago</p>
            <p className="text-sm font-black">Day 5 (Khelo India Tests)</p>
          </button>

          <button
            onClick={() => handleSimulateDate(10)}
            className={`p-3.5 rounded-2xl border-2 text-left transition-all ${
              simulatedDaysAgo === 10 
                ? 'bg-slate-900 text-white border-slate-900 shadow-md' 
                : 'bg-slate-50 border-slate-300 hover:bg-slate-100 text-slate-800'
            }`}
          >
            <p className="text-[10px] font-black uppercase tracking-wider text-[#D4A017]">Registered 10+ Days Ago</p>
            <p className="text-sm font-black">All Completed</p>
          </button>
        </div>

        {/* Current User Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200">
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${step1SentAt ? 'bg-emerald-500' : 'bg-amber-400'}`}></div>
            <div>
              <p className="text-[11px] font-black uppercase tracking-wider text-slate-700">Part 1 (Day 0)</p>
              <p className="text-xs font-bold text-slate-500">{step1SentAt ? 'Dispatched' : 'Pending Day 0'}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${step2SentAt ? 'bg-emerald-500' : simulatedDaysAgo >= 2 ? 'bg-blue-500 animate-pulse' : 'bg-slate-300'}`}></div>
            <div>
              <p className="text-[11px] font-black uppercase tracking-wider text-slate-700">Part 2 (Day 2)</p>
              <p className="text-xs font-bold text-slate-500">
                {step2SentAt ? 'Dispatched' : simulatedDaysAgo >= 2 ? '⚡ Due Now (Day 2+)' : 'Scheduled for Day 2'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${step3SentAt ? 'bg-emerald-500' : simulatedDaysAgo >= 5 ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></div>
            <div>
              <p className="text-[11px] font-black uppercase tracking-wider text-slate-700">Part 3 (Day 5)</p>
              <p className="text-xs font-bold text-slate-500">
                {step3SentAt ? 'Dispatched' : simulatedDaysAgo >= 5 ? '⚡ Due Now (Day 5+)' : 'Scheduled for Day 5'}
              </p>
            </div>
          </div>
        </div>

        {/* Evaluation Output Note */}
        {lastEvalResult && (
          <div className={`p-4 rounded-2xl border text-xs font-bold flex items-start gap-3 ${
            lastEvalResult.dispatchedStep ? 'bg-emerald-50 border-emerald-300 text-emerald-900' : 'bg-blue-50 border-blue-200 text-blue-900'
          }`}>
            <CheckCircle2 size={16} className={lastEvalResult.dispatchedStep ? 'text-emerald-600 mt-0.5' : 'text-blue-600 mt-0.5'} />
            <div className="space-y-0.5">
              <p className="font-black uppercase tracking-wide">
                {lastEvalResult.dispatchedStep ? `Triggered: Part ${lastEvalResult.dispatchedStep} (${lastEvalResult.stepName})` : 'Status Evaluated'}
              </p>
              <p className="font-medium text-slate-700">{lastEvalResult.message}</p>
            </div>
          </div>
        )}
      </div>

      {/* Template Inspector & Live Preview Area */}
      <div className="bg-white p-6 md:p-10 rounded-[2.5rem] border-2 border-slate-900 shadow-xl space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-900 rounded-full text-xs font-black uppercase tracking-wider mb-2">
              <Sparkles size={13} className="text-amber-600" />
              <span>Step {selectedStep} Preview • {previewData?.triggerDay}</span>
            </div>
            <h3 className="text-2xl font-black text-slate-900 uppercase font-display">
              {previewData?.stepName || `Part ${selectedStep}`}
            </h3>
            <p className="text-slate-600 text-xs md:text-sm font-medium mt-1">
              Subject: <span className="font-bold text-slate-900">{previewData?.subject}</span>
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleCopyHtml}
              className="px-4 py-2.5 bg-[#0D2B52] text-white font-black text-xs uppercase tracking-wider rounded-xl hover:bg-[#153e75] transition-all flex items-center gap-2 shadow-md"
            >
              {copiedHtml ? <Check size={15} className="text-emerald-400" /> : <Code2 size={15} />}
              <span>{copiedHtml ? 'HTML Copied!' : 'Copy Raw HTML'}</span>
            </button>

            <button
              onClick={handleDownloadHtml}
              className="px-4 py-2.5 bg-slate-100 text-slate-800 font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-slate-200 transition-all flex items-center gap-2 border border-slate-300"
            >
              <Download size={15} />
              <span>Download .HTML</span>
            </button>

            <button
              onClick={handleCopyText}
              className="px-4 py-2.5 bg-slate-100 text-slate-800 font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-slate-200 transition-all flex items-center gap-2 border border-slate-300"
            >
              {copiedText ? <Check size={15} className="text-emerald-600" /> : <FileText size={15} />}
              <span>{copiedText ? 'Text Copied!' : 'Copy Plain Text'}</span>
            </button>
          </div>
        </div>

        {/* Recipient Details Editor */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200">
          <div>
            <label className="block text-[11px] font-black uppercase tracking-wider text-slate-700 mb-1 flex items-center gap-1.5">
              <UserCheck size={13} className="text-primary" />
              <span>Recipient Name</span>
            </label>
            <input
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="e.g., Rajesh Sharma"
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl font-bold text-sm text-slate-900 focus:outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-[11px] font-black uppercase tracking-wider text-slate-700 mb-1 flex items-center gap-1.5">
              <Building size={13} className="text-primary" />
              <span>School / Institution Name</span>
            </label>
            <input
              type="text"
              value={customSchool}
              onChange={(e) => setCustomSchool(e.target.value)}
              placeholder="e.g., Delhi Public School"
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl font-bold text-sm text-slate-900 focus:outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-[11px] font-black uppercase tracking-wider text-slate-700 mb-1 flex items-center gap-1.5">
              <Mail size={13} className="text-primary" />
              <span>Recipient Email Address</span>
            </label>
            <input
              type="email"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              placeholder="e.g., teacher@school.edu.in"
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl font-bold text-sm text-slate-900 focus:outline-none focus:border-primary"
            />
          </div>
        </div>

        {/* View Mode Toggle Buttons */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
          <button
            onClick={() => setPreviewMode('iframe')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all ${
              previewMode === 'iframe'
                ? 'bg-primary text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Eye size={14} />
            <span>Rendered Live Preview</span>
          </button>

          <button
            onClick={() => setPreviewMode('html')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all ${
              previewMode === 'html'
                ? 'bg-primary text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Code2 size={14} />
            <span>Raw HTML Code</span>
          </button>

          <button
            onClick={() => setPreviewMode('text')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all ${
              previewMode === 'text'
                ? 'bg-primary text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <FileText size={14} />
            <span>Plain Text</span>
          </button>
        </div>

        {/* Render Preview Content */}
        {previewMode === 'iframe' && previewData && (
          <div className="border-2 border-slate-300 rounded-2xl overflow-hidden shadow-inner bg-slate-200 p-2 sm:p-6 flex justify-center">
            <iframe
              title={`Nurture Step ${selectedStep} Preview`}
              srcDoc={previewData.html}
              className="w-full max-w-[650px] h-[780px] bg-white rounded-xl shadow-lg border border-slate-300"
            />
          </div>
        )}

        {previewMode === 'html' && previewData && (
          <pre className="p-4 bg-slate-950 text-slate-100 rounded-2xl text-xs font-mono overflow-x-auto max-h-[550px] border-2 border-slate-800 leading-relaxed custom-scrollbar">
            <code>{previewData.html}</code>
          </pre>
        )}

        {previewMode === 'text' && previewData && (
          <textarea
            readOnly
            rows={16}
            value={previewData.text}
            className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl font-mono text-xs text-slate-800 outline-none leading-relaxed"
          />
        )}

        {/* Direct Action Dispatch Footer */}
        <div className="pt-2 flex flex-wrap items-center gap-4">
          <button
            onClick={() => handleDirectTrigger(selectedStep)}
            disabled={!recipientEmail || sendingStep !== null}
            className="px-8 py-4 bg-[#0D2B52] text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-[#153e75] disabled:opacity-50 transition-all flex items-center space-x-2 shadow-lg cursor-pointer"
          >
            <Send size={16} className="text-[#D4A017]" />
            <span>{sendingStep === selectedStep ? 'Dispatching...' : `Send Part ${selectedStep} to ${recipientEmail || 'Email'}`}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default NurtureSequenceHub;
