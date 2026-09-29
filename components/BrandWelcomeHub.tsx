import React, { useState, useMemo } from 'react';
import { 
  Sparkles, 
  Mail, 
  Copy, 
  Check, 
  Play, 
  Gift, 
  Calendar, 
  ShieldCheck, 
  Send, 
  Share2, 
  Download, 
  Zap, 
  Award, 
  ExternalLink,
  ChevronRight,
  BookOpen,
  Trophy,
  ClipboardList,
  Eye,
  Code2,
  FileText,
  UserCheck,
  Building
} from 'lucide-react';
import Logo from './Logo';
import { toast } from '../services/toast';
import { trackEvent } from '../services/analytics';
import { sendAutomatedWelcomeEmail, sendFeatureAnnouncementEmail, getEmailConfigStatus, generateWelcomeEmailHtml } from '../services/emailService';
import NurtureSequenceHub from './NurtureSequenceHub';
import BrevoSetupHub from './BrevoSetupHub';

interface BrandWelcomeHubProps {
  userEmail?: string | null;
  userName?: string | null;
  schoolName?: string | null;
  onNavigateToPlans?: () => void;
}

export const BrandWelcomeHub: React.FC<BrandWelcomeHubProps> = ({
  userEmail = 'teacher@school.edu.in',
  userName = 'Physical Education Educator',
  schoolName = 'Smart PE Partner School',
  onNavigateToPlans
}) => {
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedHtml, setCopiedHtml] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState(userEmail || '');
  const [customRecipientName, setCustomRecipientName] = useState(userName || 'Physical Education Educator');
  const [customSchoolName, setCustomSchoolName] = useState(schoolName || 'Smart PE Partner School');
  const [emailViewMode, setEmailViewMode] = useState<'preview' | 'html' | 'text'>('preview');
  const [isSending, setIsSending] = useState(false);
  const [activeTab, setActiveTab] = useState<'welcome' | 'brevo' | 'nurture' | 'video' | 'email'>('welcome');

  // Dynamically compute the personalized HTML & plain text template
  const generatedEmail = useMemo(() => {
    return generateWelcomeEmailHtml(customRecipientName, customSchoolName);
  }, [customRecipientName, customSchoolName]);

  const [emailSubject, setEmailSubject] = useState(generatedEmail.subject);

  // Keep subject in sync if name changes and subject hasn't been manually altered too much
  React.useEffect(() => {
    setEmailSubject(generatedEmail.subject);
  }, [generatedEmail.subject]);

  const handleCopyText = () => {
    navigator.clipboard.writeText(`Subject: ${emailSubject}\n\n${generatedEmail.text}`);
    setCopiedEmail(true);
    toast.success('Welcome Email plain-text copied to clipboard!');
    trackEvent('resource_viewed', { resource_name: 'welcome_email_template_text', category: 'onboarding' });
    setTimeout(() => setCopiedEmail(false), 2500);
  };

  const handleCopyHtml = () => {
    navigator.clipboard.writeText(generatedEmail.html);
    setCopiedHtml(true);
    toast.success('Welcome Email HTML Template copied to clipboard! Ready to paste into any email client or CRM.');
    trackEvent('resource_viewed', { resource_name: 'welcome_email_template_html', category: 'onboarding' });
    setTimeout(() => setCopiedHtml(false), 2500);
  };

  const handleDownloadHtmlFile = () => {
    const blob = new Blob([generatedEmail.html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Smart_PE_India_Welcome_Email_${customRecipientName.replace(/\s+/g, '_')}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Downloaded Welcome Email as .html file!');
  };

  const handleSendMailto = () => {
    const mailtoUrl = `mailto:${recipientEmail}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(generatedEmail.text)}`;
    window.open(mailtoUrl, '_blank');
    trackEvent('tool_used', { tool_name: 'send_welcome_email', category: 'onboarding' });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 p-4 md:p-8">
      {/* Top Banner & Founding Pass Badge */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white rounded-[2.5rem] p-8 md:p-12 border-4 border-slate-900 shadow-2xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 bg-primary/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-black uppercase tracking-widest">
              <Gift size={14} className="animate-bounce" />
              <span>1-Year Free Access Active</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight uppercase font-display">
              Welcome to <span className="text-primary-container">Smart PE India</span>
            </h1>
            <p className="text-slate-300 font-medium text-base md:text-lg leading-relaxed">
              Empowering Physical Education Teachers across India with AI Lesson Planning, Khelo India Assessments, CBSE Question Generators & Digital Sports Management.
            </p>
            <div className="pt-2 flex flex-wrap items-center gap-4 text-xs font-bold text-slate-300">
              <span className="flex items-center space-x-1.5 bg-white/10 px-3 py-1.5 rounded-xl border border-white/10">
                <ShieldCheck size={14} className="text-emerald-400" />
                <span>Founding Educator Pass</span>
              </span>
              <span className="flex items-center space-x-1.5 bg-white/10 px-3 py-1.5 rounded-xl border border-white/10">
                <Calendar size={14} className="text-amber-400" />
                <span>Valid: 1 Full Year (365 Days)</span>
              </span>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-3xl text-center space-y-3 w-full md:w-auto min-w-[240px]">
            <p className="text-xs uppercase tracking-widest font-black text-slate-300">License Status</p>
            <p className="text-2xl font-black text-emerald-400 uppercase tracking-tight">Active Free Pass</p>
            <p className="text-[11px] text-slate-300 font-medium">₹0 Charged • Full Access Unlocked</p>
            {onNavigateToPlans && (
              <button
                onClick={onNavigateToPlans}
                className="w-full py-2.5 px-4 bg-primary text-white rounded-xl font-black text-xs uppercase tracking-wider hover:bg-primary-container transition-all flex items-center justify-center space-x-1.5 shadow-lg"
              >
                <span>View All Plans</span>
                <ChevronRight size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Interactive Tabs */}
      <div className="flex flex-wrap gap-2 border-b-2 border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('welcome')}
          className={`px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center space-x-2 ${
            activeTab === 'welcome'
              ? 'bg-slate-900 text-white shadow-lg'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Sparkles size={16} />
          <span>Brand Showcase</span>
        </button>

        <button
          onClick={() => setActiveTab('brevo')}
          className={`px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center space-x-2 ${
            activeTab === 'brevo'
              ? 'bg-[#0D2B52] text-[#D4A017] shadow-lg ring-2 ring-[#D4A017]'
              : 'bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100'
          }`}
        >
          <Zap size={16} className="text-[#D4A017]" />
          <span>⚡ Brevo Email Setup</span>
        </button>

        <button
          onClick={() => setActiveTab('nurture')}
          className={`px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center space-x-2 ${
            activeTab === 'nurture'
              ? 'bg-slate-900 text-white shadow-lg'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Zap size={16} className="text-amber-400" />
          <span>3-Part Nurture Sequence</span>
        </button>

        <button
          onClick={() => setActiveTab('video')}
          className={`px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center space-x-2 ${
            activeTab === 'video'
              ? 'bg-slate-900 text-white shadow-lg'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Play size={16} />
          <span>Promo Video & Tour</span>
        </button>

        <button
          onClick={() => setActiveTab('email')}
          className={`px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center space-x-2 ${
            activeTab === 'email'
              ? 'bg-slate-900 text-white shadow-lg'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Mail size={16} />
          <span>Send Welcome Email</span>
        </button>
      </div>

      {/* TAB: BREVO EMAIL SETUP */}
      {activeTab === 'brevo' && (
        <BrevoSetupHub
          userEmail={recipientEmail}
          onNavigateToNurture={() => setActiveTab('nurture')}
        />
      )}

      {/* TAB: 3-PART NURTURE SEQUENCE */}
      {activeTab === 'nurture' && (
        <NurtureSequenceHub
          userEmail={recipientEmail}
          userName={customRecipientName}
          schoolName={customSchoolName}
          onNavigateToBrevo={() => setActiveTab('brevo')}
        />
      )}

      {/* TAB 1: BRAND SHOWCASE */}
      {activeTab === 'welcome' && (
        <div className="space-y-8">
          {/* Official Brand Identity Card */}
          <div className="bg-[#0D2B52] text-white p-8 md:p-10 rounded-[2.5rem] border-4 border-slate-900 shadow-xl relative overflow-hidden">
            <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-[#D4A017]/10 rounded-full blur-2xl pointer-events-none"></div>
            <div className="relative z-10 space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/10 pb-6">
                <div>
                  <div className="inline-flex items-center space-x-2 px-3 py-1 bg-[#D4A017] text-[#0D2B52] rounded-full text-[10px] font-black uppercase tracking-widest mb-2">
                    Official Brand Guidelines & Colors
                  </div>
                  <h2 className="text-3xl font-black font-display tracking-tight uppercase">SMART PE INDIA</h2>
                  <p className="text-[#D4A017] font-bold text-sm tracking-wide mt-0.5">Plan Smarter. Teach Better.</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Logo size="lg" variant="light" />
                </div>
              </div>

              {/* Swatches Grid */}
              <div className="space-y-3">
                <p className="text-xs font-black uppercase tracking-widest text-slate-300">Official Brand Palette</p>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <div className="bg-[#0D2B52] border-2 border-white/20 p-3.5 rounded-2xl text-center space-y-1">
                    <div className="w-full h-8 bg-[#0D2B52] rounded-xl border border-white/30"></div>
                    <p className="text-[11px] font-black uppercase tracking-wider text-white">#0D2B52</p>
                    <p className="text-[9px] text-slate-300 font-bold">Deep Navy</p>
                  </div>
                  <div className="bg-[#D4A017] text-[#0D2B52] p-3.5 rounded-2xl text-center space-y-1">
                    <div className="w-full h-8 bg-[#D4A017] rounded-xl border border-black/10"></div>
                    <p className="text-[11px] font-black uppercase tracking-wider">#D4A017</p>
                    <p className="text-[9px] font-bold">Gold Accent</p>
                  </div>
                  <div className="bg-white text-slate-900 p-3.5 rounded-2xl text-center space-y-1">
                    <div className="w-full h-8 bg-white rounded-xl border border-slate-300"></div>
                    <p className="text-[11px] font-black uppercase tracking-wider">#FFFFFF</p>
                    <p className="text-[9px] text-slate-500 font-bold">Pure White</p>
                  </div>
                  <div className="bg-[#333333] text-white p-3.5 rounded-2xl text-center space-y-1">
                    <div className="w-full h-8 bg-[#333333] rounded-xl border border-white/20"></div>
                    <p className="text-[11px] font-black uppercase tracking-wider">#333333</p>
                    <p className="text-[9px] text-slate-300 font-bold">Charcoal</p>
                  </div>
                  <div className="bg-[#F5F7FA] text-slate-900 p-3.5 rounded-2xl text-center space-y-1">
                    <div className="w-full h-8 bg-[#F5F7FA] rounded-xl border border-slate-300"></div>
                    <p className="text-[11px] font-black uppercase tracking-wider">#F5F7FA</p>
                    <p className="text-[9px] text-slate-500 font-bold">Canvas Gray</p>
                  </div>
                </div>
              </div>

              {/* Typography & Slogan Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="bg-white/5 border border-white/10 p-4 rounded-2xl space-y-1.5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#D4A017]">Primary Typography</p>
                  <p className="text-sm font-black font-display tracking-tight text-white">Montserrat Bold (Headings)</p>
                  <p className="text-xs font-normal font-sans text-slate-300">Poppins Regular (Body Text & Controls)</p>
                </div>
                <div className="bg-white/5 border border-white/10 p-4 rounded-2xl space-y-1.5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#D4A017]">Brand Taglines & Slogans</p>
                  <p className="text-xs font-bold text-white">"Empowering PE Teachers, Building Stronger Generations"</p>
                  <p className="text-[11px] text-slate-300">"The Future of Physical Education is Here!"</p>
                </div>
              </div>
            </div>
          </div>

          {/* Feature Highlights Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-8 rounded-[2rem] border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] space-y-4">
              <div className="w-12 h-12 bg-[#0D2B52]/10 text-[#0D2B52] rounded-2xl flex items-center justify-center">
                <Zap size={24} />
              </div>
              <h3 className="text-xl font-black text-slate-900 uppercase font-display">AI PE Lesson Planner</h3>
              <p className="text-sm text-slate-600 font-medium leading-relaxed">
                Generate complete 40-minute physical education lesson plans tailored for CBSE, ICSE, or State boards in under 60 seconds with warmup diagrams.
              </p>
            </div>

            <div className="bg-white p-8 rounded-[2rem] border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] space-y-4">
              <div className="w-12 h-12 bg-[#D4A017]/15 text-[#D4A017] rounded-2xl flex items-center justify-center">
                <Trophy size={24} />
              </div>
              <h3 className="text-xl font-black text-slate-900 uppercase font-display">Khelo India Battery</h3>
              <p className="text-sm text-slate-600 font-medium leading-relaxed">
                Pre-loaded official Govt. of India fitness battery tests (BMI, 50m sprint, Sit & Reach, Flamingo Balance) with auto-computed percentile scores.
              </p>
            </div>

            <div className="bg-white p-8 rounded-[2rem] border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] space-y-4">
              <div className="w-12 h-12 bg-emerald-500/10 text-emerald-700 rounded-2xl flex items-center justify-center">
                <ClipboardList size={24} />
              </div>
              <h3 className="text-xl font-black text-slate-900 uppercase font-display">Question Paper Generator</h3>
              <p className="text-sm text-slate-600 font-medium leading-relaxed">
                Create official board-pattern term exams, MCQs, case-based questions, and detailed marking schemes ready for printing in 1 click.
              </p>
            </div>
          </div>

          {/* Bottom Pillars Banner from Brand Sheet */}
          <div className="bg-slate-900 text-white p-6 rounded-3xl border-2 border-slate-900 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="space-y-1 p-2">
              <p className="text-xs font-black text-[#D4A017] uppercase tracking-wider">Smarter Planning</p>
              <p className="text-[10px] text-slate-300 uppercase tracking-widest font-bold">AI Powered</p>
            </div>
            <div className="space-y-1 p-2 border-l border-slate-800">
              <p className="text-xs font-black text-[#D4A017] uppercase tracking-wider">Easy Management</p>
              <p className="text-[10px] text-slate-300 uppercase tracking-widest font-bold">All In One</p>
            </div>
            <div className="space-y-1 p-2 border-l border-slate-800">
              <p className="text-xs font-black text-[#D4A017] uppercase tracking-wider">Real Time Insights</p>
              <p className="text-[10px] text-slate-300 uppercase tracking-widest font-bold">Better Decisions</p>
            </div>
            <div className="space-y-1 p-2 border-l border-slate-800">
              <p className="text-xs font-black text-[#D4A017] uppercase tracking-wider">Secure & Reliable</p>
              <p className="text-[10px] text-slate-300 uppercase tracking-widest font-bold">Your Data, Our Priority</p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PROMO VIDEO & TOUR */}
      {activeTab === 'video' && (
        <div className="bg-white p-8 md:p-12 rounded-[2.5rem] border-2 border-slate-900 shadow-xl space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black text-slate-900 uppercase">Smart PE India Product Presentation</h2>
              <p className="text-slate-500 text-sm font-medium mt-1">
                Watch how Physical Education Teachers transform their department operations in minutes.
              </p>
            </div>
          </div>

          {/* Interactive Promo Showcase Player Card */}
          <div className="relative aspect-video w-full bg-slate-950 rounded-3xl overflow-hidden border-4 border-slate-900 flex flex-col items-center justify-center p-8 text-center text-white shadow-2xl group">
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/80 to-transparent z-10"></div>
            <div className="relative z-20 space-y-4 max-w-xl">
              <div className="w-20 h-20 bg-primary text-white rounded-full flex items-center justify-center mx-auto shadow-2xl group-hover:scale-110 transition-transform cursor-pointer">
                <Play size={36} className="ml-1" />
              </div>
              <h3 className="text-2xl font-black uppercase tracking-tight font-display">
                Smart PE India Platform Tour
              </h3>
              <p className="text-sm text-slate-300 font-medium leading-relaxed">
                Experience the complete walkthrough: From 60-second AI Lesson Generation to Principal Inspection Dashboard & Khelo India Scorecards.
              </p>
              <div className="pt-2 flex justify-center gap-3">
                <a
                  href="https://smartpeindia.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3 bg-white text-slate-900 font-black text-xs uppercase tracking-wider rounded-xl hover:bg-slate-100 transition-all flex items-center space-x-2"
                >
                  <span>Open Live Portal</span>
                  <ExternalLink size={14} />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: BRANDED HTML WELCOME EMAIL */}
      {activeTab === 'email' && (
        <div className="bg-white p-6 md:p-10 rounded-[2.5rem] border-2 border-slate-900 shadow-xl space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 pb-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-900 rounded-full text-xs font-black uppercase tracking-wider mb-2">
                <Sparkles size={13} className="text-amber-600" />
                <span>Responsive HTML Template</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-slate-900 uppercase font-display">Official HTML Welcome Email</h2>
              <p className="text-slate-600 text-sm font-medium mt-1">
                Personalized welcome email with official Smart PE India branding, personalized name greeting, and complete key benefits overview.
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleCopyHtml}
                className="px-4 py-2.5 bg-[#0D2B52] text-white font-black text-xs uppercase tracking-wider rounded-xl hover:bg-[#153e75] transition-all flex items-center gap-2 shadow-md"
                title="Copy ready-to-use HTML code for Mailchimp, SendGrid, or Gmail"
              >
                {copiedHtml ? <Check size={15} className="text-emerald-400" /> : <Code2 size={15} />}
                <span>{copiedHtml ? 'HTML Copied!' : 'Copy Raw HTML'}</span>
              </button>

              <button
                onClick={handleDownloadHtmlFile}
                className="px-4 py-2.5 bg-slate-100 text-slate-800 font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-slate-200 transition-all flex items-center gap-2 border border-slate-300"
                title="Download HTML email template file"
              >
                <Download size={15} />
                <span>Download .HTML</span>
              </button>

              <button
                onClick={handleCopyText}
                className="px-4 py-2.5 bg-slate-100 text-slate-800 font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-slate-200 transition-all flex items-center gap-2 border border-slate-300"
                title="Copy plain-text version"
              >
                {copiedEmail ? <Check size={15} className="text-emerald-600" /> : <FileText size={15} />}
                <span>{copiedEmail ? 'Text Copied!' : 'Copy Plain Text'}</span>
              </button>
            </div>
          </div>

          {/* Personalization Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-700 mb-1 flex items-center gap-1.5">
                <UserCheck size={13} className="text-primary" />
                <span>Recipient Name (Personalized Greeting)</span>
              </label>
              <input
                type="text"
                value={customRecipientName}
                onChange={(e) => setCustomRecipientName(e.target.value)}
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
                value={customSchoolName}
                onChange={(e) => setCustomSchoolName(e.target.value)}
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

          {/* View Mode Switcher */}
          <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setEmailViewMode('preview')}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all ${
                  emailViewMode === 'preview'
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Eye size={14} />
                <span>Live Rendered Preview</span>
              </button>

              <button
                onClick={() => setEmailViewMode('html')}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all ${
                  emailViewMode === 'html'
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Code2 size={14} />
                <span>Raw HTML Template Code</span>
              </button>

              <button
                onClick={() => setEmailViewMode('text')}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all ${
                  emailViewMode === 'text'
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <FileText size={14} />
                <span>Plain Text</span>
              </button>
            </div>

            <div className="text-xs font-bold text-slate-500 hidden sm:block">
              Subject: <span className="text-slate-800 font-mono">{generatedEmail.subject}</span>
            </div>
          </div>

          {/* Render Mode Content */}
          {emailViewMode === 'preview' && (
            <div className="space-y-3">
              <div className="p-3 bg-slate-100 rounded-xl text-xs font-bold text-slate-600 flex items-center justify-between border border-slate-200">
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
                  <span>Email Client Preview (Desktop & Mobile Friendly • 620px Max Width)</span>
                </span>
                <span className="text-[11px] text-slate-400 font-mono">From: Smart PE India &lt;welcome@smartpeindia.app&gt;</span>
              </div>
              <div className="border-2 border-slate-300 rounded-2xl overflow-hidden shadow-inner bg-slate-200 p-2 sm:p-6 flex justify-center">
                <iframe
                  title="Welcome Email HTML Preview"
                  srcDoc={generatedEmail.html}
                  className="w-full max-w-[650px] h-[780px] bg-white rounded-xl shadow-lg border border-slate-300"
                />
              </div>
            </div>
          )}

          {emailViewMode === 'html' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600">
                  Ready to copy and paste into any email system (Brevo, SendGrid, Mailchimp, Resend, Nodemailer, Gmail HTML):
                </span>
                <button
                  onClick={handleCopyHtml}
                  className="px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-bold flex items-center gap-1"
                >
                  {copiedHtml ? <Check size={13} /> : <Copy size={13} />}
                  <span>{copiedHtml ? 'Copied' : 'Copy Code'}</span>
                </button>
              </div>
              <pre className="p-4 bg-slate-950 text-slate-100 rounded-2xl text-xs font-mono overflow-x-auto max-h-[550px] border-2 border-slate-800 leading-relaxed custom-scrollbar">
                <code>{generatedEmail.html}</code>
              </pre>
            </div>
          )}

          {emailViewMode === 'text' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600">
                  Plain text fallback format:
                </span>
                <button
                  onClick={handleCopyText}
                  className="px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-bold flex items-center gap-1"
                >
                  {copiedEmail ? <Check size={13} /> : <Copy size={13} />}
                  <span>{copiedEmail ? 'Copied' : 'Copy Text'}</span>
                </button>
              </div>
              <textarea
                readOnly
                rows={16}
                value={generatedEmail.text}
                className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl font-mono text-xs text-slate-800 outline-none leading-relaxed"
              />
            </div>
          )}

          {/* Bottom Send Dispatch Buttons */}
          <div className="pt-2 flex flex-wrap gap-4 items-center">
            <button
              onClick={async () => {
                if (!recipientEmail || !recipientEmail.includes('@')) {
                  toast.error('Please enter a valid recipient email address');
                  return;
                }
                setIsSending(true);
                try {
                  const result = await sendAutomatedWelcomeEmail(
                    recipientEmail,
                    customRecipientName || 'Physical Education Educator',
                    customSchoolName || 'Smart PE Partner School'
                  );
                  if (result.success) {
                    toast.success(`Personalized HTML Welcome Email dispatched to ${recipientEmail}!`);
                  } else {
                    toast.info(`Dispatched: ${result.message}`);
                  }
                } catch (err: any) {
                  toast.error(err.message || 'Failed to dispatch email');
                } finally {
                  setIsSending(false);
                }
              }}
              disabled={!recipientEmail || isSending}
              className="px-8 py-4 bg-[#0D2B52] text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-[#153e75] disabled:opacity-50 transition-all flex items-center space-x-2 shadow-lg cursor-pointer"
            >
              <Zap size={16} className="text-amber-400" />
              <span>{isSending ? 'Dispatching Personalized HTML Email...' : '⚡ Send Test Welcome Email via Brevo'}</span>
            </button>
          </div>

          {/* Info Card */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 space-y-1">
            <p className="font-bold text-slate-800 flex items-center gap-1.5">
              <ShieldCheck size={15} className="text-emerald-600" />
              <span>Automated Onboarding Dispatch Active</span>
            </p>
            <p>
              Every new Physical Education teacher registering via Google or Email on <strong className="text-slate-800">smartpeindia.app</strong> automatically receives this personalized HTML welcome email highlighting their 1-Year Free Founding Pass and instant access to the AI Lesson Planner, Khelo India Assessment Battery, CBSE Theory Master, and Inspection Dashboards.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default BrandWelcomeHub;
