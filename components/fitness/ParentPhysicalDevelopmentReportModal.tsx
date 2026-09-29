import React, { useState, useRef } from 'react';
import { jsPDF } from 'jspdf';
import {
  X,
  Printer,
  Download,
  Activity,
  Heart,
  Trophy,
  Users,
  Sparkles,
  Move,
  HeartHandshake,
  CheckCircle2,
  Calendar,
  User,
  ShieldCheck,
  TrendingUp,
  Target,
  ArrowRight,
  HelpCircle,
  Clock,
  ChevronRight,
  Loader2
} from 'lucide-react';
import {
  PhysicalDevelopmentProfile,
  DevelopmentDomainId,
  ParentReportSummary
} from '../../types.ts';
import { DOMAIN_METADATA } from '../../services/physicalDevelopmentEngine.ts';
import { generatePhysicalDevelopmentInsights } from '../../services/physicalDevelopmentAiService.ts';
import Logo from '../Logo.tsx';

interface ParentPhysicalDevelopmentReportModalProps {
  profile: PhysicalDevelopmentProfile;
  isOpen: boolean;
  onClose: () => void;
  schoolName?: string;
  schoolLogo?: string;
}

export const ParentPhysicalDevelopmentReportModal: React.FC<ParentPhysicalDevelopmentReportModalProps> = ({
  profile,
  isOpen,
  onClose,
  schoolName = 'SmartPE Physical Education Department',
  schoolLogo
}) => {
  const [activeViewTab, setActiveViewTab] = useState<'current_report' | 'longitudinal_journey'>('current_report');
  const [aiSummary, setAiSummary] = useState<ParentReportSummary | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handleGenerateAiSummary = async () => {
    setLoadingAi(true);
    try {
      const summary = await generatePhysicalDevelopmentInsights(profile);
      setAiSummary(summary);
    } catch (e) {
      console.warn("AI summary generation error:", e);
    } finally {
      setLoadingAi(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    setDownloadingPdf(true);
    try {
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();

      // Header Banner
      doc.setFillColor(13, 43, 82); // #0D2B52
      doc.rect(0, 0, pageWidth, 28, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('SMARTPE PHYSICAL DEVELOPMENT REPORT', 14, 14);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`${schoolName} • Academic Year ${profile.academicYear}`, 14, 22);

      // Student Meta Box
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(14, 34, pageWidth - 28, 22, 2, 2, 'FD');

      doc.setTextColor(15, 23, 42);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(profile.studentName, 18, 42);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text(`Class: Grade ${profile.grade} - Section ${profile.section}`, 18, 48);
      doc.text(`Assessment Cycle: ${profile.currentTerm}`, 90, 48);
      doc.text(`Overall Band: ${profile.overallLevel}`, 155, 48);

      let yPos = 64;

      // 6 Core Development Domains
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(13, 43, 82);
      doc.text('1. CORE PHYSICAL DEVELOPMENT DOMAINS', 14, yPos);
      yPos += 6;

      const domainKeys = Object.keys(DOMAIN_METADATA) as DevelopmentDomainId[];
      domainKeys.forEach((dKey) => {
        const dScore = profile.domains[dKey];
        const meta = DOMAIN_METADATA[dKey];

        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(14, yPos, pageWidth - 28, 14, 1.5, 1.5, 'FD');

        doc.setFontSize(9.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(15, 23, 42);
        doc.text(meta.name, 18, yPos + 6);

        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 116, 139);
        doc.text(`Level: ${dScore.level} (${dScore.scorePercent}%) • Trend: ${dScore.latestTrend}`, 18, yPos + 11);

        yPos += 16;
      });

      // BMI Development History Section
      yPos += 4;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(13, 43, 82);
      doc.text('2. STATURE & PHYSICAL MEASUREMENT TRACKING (BMI)', 14, yPos);
      yPos += 6;

      if (profile.bmiHistory.length > 0) {
        profile.bmiHistory.forEach(b => {
          doc.setFontSize(8.5);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(51, 65, 85);
          const heightStr = b.heightCm ? ` • Height: ${b.heightCm}cm` : '';
          const weightStr = b.weightKg ? ` • Weight: ${b.weightKg}kg` : '';
          doc.text(`• ${b.term}: ${b.bmi} kg/m² (${b.statusLabel})${heightStr}${weightStr}`, 18, yPos);
          yPos += 5;
        });
      } else {
        doc.setFontSize(8.5);
        doc.setTextColor(100, 116, 139);
        doc.text('• Baseline measurement scheduled for upcoming cycle.', 18, yPos);
        yPos += 5;
      }

      // Development Focus & Next Goal
      yPos += 6;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(13, 43, 82);
      doc.text('3. CURRENT DEVELOPMENT FOCUS & FAMILY SUPPORT', 14, yPos);
      yPos += 6;

      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(`Focus Area: ${profile.developmentFocus?.domainName || 'Movement Agility'} (${profile.developmentFocus?.component || 'Coordination'})`, 18, yPos);
      yPos += 5;

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text(`Current Goal: ${profile.developmentFocus?.suggestedGoal || 'Continue building coordination and confidence in class play.'}`, 18, yPos);
      yPos += 7;

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text('How the Family Can Support at Home:', 18, yPos);
      yPos += 5;

      const familyTips = aiSummary?.howFamilyCanSupport || [
        'Engage in 20-30 minutes of enjoyable active outdoor play or sports on weekends.',
        'Encourage regular walking, skipping games, or cycling together.',
        'Support healthy hydration and restful sleep routines after active days.'
      ];

      familyTips.forEach(tip => {
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(71, 85, 105);
        doc.text(`• ${tip}`, 22, yPos);
        yPos += 5;
      });

      // Footer
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(`Generated by SmartPE India Physical Development Engine • ${new Date().toLocaleDateString()}`, 14, 285);

      doc.save(`Physical_Development_Report_${profile.studentName.replace(/\s+/g, '_')}.pdf`);
    } catch (err) {
      console.error("PDF generation error:", err);
    } finally {
      setDownloadingPdf(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 print:p-0 print:bg-white">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] print:max-h-none print:shadow-none print:border-none">
        
        {/* Modal Top Bar */}
        <div className="px-6 py-4 bg-[#0D2B52] text-white flex items-center justify-between print:hidden">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-400/20 text-amber-300 rounded-lg">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-wide uppercase">Physical Development Report</h2>
              <p className="text-xs text-slate-300">Holistic 6-domain developmental feedback for parents and educators</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all"
            >
              <Printer className="w-3.5 h-3.5" />
              Print
            </button>
            <button
              onClick={handleDownloadPdf}
              disabled={downloadingPdf}
              className="px-3.5 py-1.5 bg-[#D4A017] hover:bg-amber-500 text-slate-950 rounded-lg text-xs font-black uppercase flex items-center gap-1.5 transition-all shadow-sm"
            >
              {downloadingPdf ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
              Export PDF
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-white/10 transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* View Switcher Tabs (Print Hidden) */}
        <div className="px-6 py-2.5 bg-slate-100 border-b border-slate-200 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveViewTab('current_report')}
              className={`px-4 py-1.5 rounded-lg text-xs font-extrabold transition-all ${
                activeViewTab === 'current_report'
                  ? 'bg-white text-[#0D2B52] shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Term Physical Development Report
            </button>
            <button
              onClick={() => setActiveViewTab('longitudinal_journey')}
              className={`px-4 py-1.5 rounded-lg text-xs font-extrabold transition-all flex items-center gap-1.5 ${
                activeViewTab === 'longitudinal_journey'
                  ? 'bg-white text-[#0D2B52] shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              My PE Journey (Multi-Year Trajectory)
            </button>
          </div>

          {!aiSummary && (
            <button
              onClick={handleGenerateAiSummary}
              disabled={loadingAi}
              className="px-3 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all"
            >
              {loadingAi ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-purple-600" />}
              Generate AI Family Summary
            </button>
          )}
        </div>

        {/* Printable Report Content Body */}
        <div ref={printRef} className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 text-slate-800 print:p-4 print:space-y-4">
          
          {/* Header Card */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-200 gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 bg-[#0D2B52] text-white text-[10px] font-black uppercase tracking-wider rounded-full">
                  Physical Development Profile
                </span>
                <span className="text-xs text-slate-500 font-semibold">
                  Cycle: <strong className="text-slate-800">{profile.currentTerm}</strong>
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-[#0D2B52] tracking-tight">
                {profile.studentName}
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 font-medium">
                Grade {profile.grade} &bull; Section {profile.section} &bull; Age {profile.age} &bull; {profile.gender}
              </p>
            </div>

            <div className="flex sm:flex-col items-center sm:items-end justify-between bg-slate-50 sm:bg-transparent p-3 sm:p-0 rounded-xl border sm:border-0 border-slate-200">
              <div className="text-left sm:text-right">
                <div className="text-[11px] font-bold text-slate-500 uppercase">Overall Development Band</div>
                <div className="text-lg font-black text-emerald-600">{profile.overallLevel}</div>
              </div>
              <div className="text-[11px] text-slate-400 font-semibold mt-1">
                Academic Year {profile.academicYear}
              </div>
            </div>
          </div>

          {activeViewTab === 'current_report' ? (
            <>
              {/* Core Purpose Mission Callout */}
              <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-4">
                <h4 className="text-xs font-black text-[#0D2B52] uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  About This Physical Development Report
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Physical Education at <strong>{schoolName}</strong> is focused on fostering lifetime movement confidence, health, teamwork, and individual progress. Rather than a static grade, this profile highlights your child’s actual developmental growth across all physical domains.
                </p>
              </div>

              {/* 6 Core Development Domains Grid */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black uppercase tracking-wider text-[#0D2B52] flex items-center gap-2">
                    <Activity className="w-4 h-4 text-amber-500" />
                    Core Development Domains
                  </h3>
                  <span className="text-xs text-slate-500 font-medium">Evaluated across 6 pillars</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {(Object.keys(DOMAIN_METADATA) as DevelopmentDomainId[]).map((dId) => {
                    const domainScore = profile.domains[dId];
                    const meta = DOMAIN_METADATA[dId];

                    const levelBadgeColors: Record<string, string> = {
                      Advanced: 'bg-purple-100 text-purple-800 border-purple-300',
                      Proficient: 'bg-emerald-100 text-emerald-800 border-emerald-300',
                      Progressing: 'bg-blue-100 text-blue-800 border-blue-300',
                      Developing: 'bg-amber-100 text-amber-800 border-amber-300',
                      Beginning: 'bg-slate-100 text-slate-700 border-slate-300'
                    };

                    return (
                      <div
                        key={dId}
                        className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:border-slate-300 transition-all flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-black text-slate-900">{meta.name}</h4>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase border ${levelBadgeColors[domainScore.level] || 'bg-slate-100'}`}>
                              {domainScore.level}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mb-3">{meta.description}</p>
                        </div>

                        <div>
                          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mb-2">
                            <div
                              className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full transition-all duration-500"
                              style={{ width: `${domainScore.scorePercent}%` }}
                            />
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold">
                            <span>Score: {domainScore.scorePercent}%</span>
                            <span className="flex items-center gap-1 text-slate-700">
                              <TrendingUp className="w-3 h-3 text-emerald-500" />
                              {domainScore.latestTrend}
                            </span>
                          </div>

                          {domainScore.results.length > 0 && (
                            <div className="mt-2.5 pt-2 border-t border-slate-100 space-y-1">
                              {domainScore.results.slice(0, 2).map((res, i) => (
                                <div key={i} className="flex items-center justify-between text-[11px]">
                                  <span className="text-slate-600 font-medium truncate max-w-[180px]">{res.testName}:</span>
                                  <span className="font-bold text-slate-900">
                                    {res.rawValue} {res.unit} {res.formattedChange ? `(${res.formattedChange})` : ''}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Stature & BMI History Section (Preserved Neutrally) */}
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 sm:p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg">
                      <Heart className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                        Physical Growth & Stature History
                      </h4>
                      <p className="text-xs text-slate-500">Longitudinal physical growth measurements over time</p>
                    </div>
                  </div>

                  {profile.currentBMI && (
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-full text-xs font-black">
                      Current: {profile.currentBMI.bmi} kg/m² ({profile.currentBMI.statusLabel})
                    </span>
                  )}
                </div>

                {profile.bmiHistory.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {profile.bmiHistory.map((item, idx) => (
                      <div key={idx} className="bg-white rounded-lg border border-slate-200 p-3">
                        <div className="text-[11px] font-bold text-slate-500 uppercase">{item.term} ({item.date})</div>
                        <div className="text-base font-black text-slate-900 mt-0.5">{item.bmi} kg/m²</div>
                        <div className="text-xs text-slate-600 font-medium">{item.statusLabel}</div>
                        {item.heightCm && item.weightKg && (
                          <div className="text-[10px] text-slate-400 mt-1">
                            Height: {item.heightCm}cm &bull; Weight: {item.weightKg}kg
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">
                    Baseline height and weight measurements will be recorded in the upcoming assessment cycle.
                  </p>
                )}
              </div>

              {/* What is going well & Development Focus */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* What is going well? */}
                <div className="bg-emerald-50/50 border border-emerald-200 rounded-xl p-4 sm:p-5">
                  <h4 className="text-xs font-black text-emerald-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    What Is Going Well?
                  </h4>
                  <ul className="space-y-2 text-xs text-slate-700">
                    {(aiSummary?.whatIsGoingWell || [
                      `Shows strong participation and enthusiasm in Class ${profile.grade} PE sessions.`,
                      `Consistently demonstrates positive sportsmanship and peer cooperation.`,
                      `Shows steady individual physical progress from baseline measurements.`
                    ]).map((pt, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-emerald-500 font-bold">•</span>
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Development Focus & Goal */}
                <div className="bg-purple-50/50 border border-purple-200 rounded-xl p-4 sm:p-5">
                  <h4 className="text-xs font-black text-purple-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Target className="w-4 h-4 text-purple-600" />
                    Targeted Development Focus & Goal
                  </h4>
                  <div className="space-y-2 text-xs text-slate-700">
                    <p>
                      <strong className="text-purple-950 font-bold">Focus Area:</strong> {profile.developmentFocus?.domainName} ({profile.developmentFocus?.component})
                    </p>
                    <p>
                      <strong className="text-purple-950 font-bold">Next Goal:</strong> {profile.developmentFocus?.suggestedGoal}
                    </p>
                    <p className="text-[11px] text-slate-500 italic">
                      Strategy: {profile.developmentFocus?.suggestedStrategy} ({profile.developmentFocus?.suggestedFrequency} for {profile.developmentFocus?.suggestedDuration})
                    </p>
                  </div>
                </div>

              </div>

              {/* How can the family support at home? */}
              <div className="bg-amber-50/40 border border-amber-200 rounded-xl p-4 sm:p-5">
                <h4 className="text-xs font-black text-amber-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <HeartHandshake className="w-4 h-4 text-amber-600" />
                  How Can the Family Support at Home?
                </h4>
                <p className="text-xs text-slate-600 mb-3">
                  Simple, enjoyable physical activities for family weekends to reinforce movement confidence:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs text-slate-700">
                  {(aiSummary?.howFamilyCanSupport || [
                    'Enjoy 20-30 minutes of unstructured outdoor active play, cycling, or ball games on weekends.',
                    'Practice fun skipping rope, balance games, or gentle stretching routines at home.',
                    'Encourage regular hydration and walking together after school.'
                  ]).map((item, i) => (
                    <div key={i} className="bg-white rounded-lg border border-amber-200 p-3 shadow-2xs flex items-start gap-2">
                      <span className="font-black text-amber-600">{i + 1}.</span>
                      <span className="leading-snug">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            /* Longitudinal Journey View across Class 3 to Class 9+ */
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-[#0D2B52] to-[#153e75] text-white p-5 rounded-xl">
                <h3 className="text-base font-black tracking-wide uppercase flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                  My Physical Education Journey
                </h3>
                <p className="text-xs text-slate-200 mt-1">
                  Tracking individual physical growth, skill progression, and health development across school years without comparison or ranking.
                </p>
              </div>

              {/* Multi-Grade Milestones */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {['Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8'].map((cls, idx) => {
                  const isCurrent = cls.includes(profile.grade);
                  return (
                    <div
                      key={idx}
                      className={`p-4 rounded-xl border ${
                        isCurrent
                          ? 'bg-blue-50/80 border-blue-400 ring-2 ring-blue-500/20 shadow-md'
                          : 'bg-white border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-black text-slate-900 uppercase">{cls}</span>
                        {isCurrent && (
                          <span className="px-2 py-0.5 bg-blue-600 text-white rounded-full text-[9px] font-black uppercase">
                            Current Class
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-600 space-y-1">
                        <div>Fitness Band: <strong>{isCurrent ? profile.overallLevel : 'Progressing'}</strong></div>
                        <div>Movement Mastery: <strong>{isCurrent ? profile.domains.movement_skills.level : 'Developing'}</strong></div>
                        <div>Sport Application: <strong>{isCurrent ? profile.domains.sport_skills.level : 'Active Participation'}</strong></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Footer Signature Note */}
          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>SmartPE Physical Development Engine &bull; {schoolName}</span>
            </div>
            <div className="text-[11px] text-slate-400">
              Report Date: {new Date().toLocaleDateString('en-IN', { dateStyle: 'long' })}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
