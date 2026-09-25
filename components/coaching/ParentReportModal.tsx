import React, { useRef, useState } from 'react';
import { jsPDF } from 'jspdf';
import { toJpeg } from 'html-to-image';
import { 
  Printer, 
  Share2, 
  X, 
  Award, 
  CheckCircle2, 
  Target, 
  TrendingUp, 
  ShieldCheck, 
  Trophy,
  Copy,
  Check,
  MessageCircle,
  FileText,
  Download,
  Loader2,
  ExternalLink,
  Sparkles,
  Medal,
  Activity,
  Calendar,
  Send
} from 'lucide-react';
import { 
  PlayerAssessmentRecord, 
  PlayerProfileData, 
  SPORT_TEMPLATES, 
  COACHING_SCALE_LABELS, 
  getDevelopmentLevelColor,
  getMeritClassification,
  CoachingSportId,
  CoachingAgeCategory,
  getAgeCategoryColor,
  detectAgeCategory,
  AGE_CATEGORY_BENCHMARKS
} from '../../services/academyService';
import { academicCoachingCloudService } from '../../services/academicCoachingCloudService';
import { showToast } from '../../services/toast';

interface ParentReportModalProps {
  player: PlayerProfileData;
  assessment: PlayerAssessmentRecord;
  history?: PlayerAssessmentRecord[];
  onClose: () => void;
}

export const ParentReportModal: React.FC<ParentReportModalProps> = ({
  player,
  assessment,
  history = [],
  onClose
}) => {
  const printRef = useRef<HTMLDivElement>(null);
  const [reportViewMode, setReportViewMode] = useState<'comprehensive' | 'certificate'>('comprehensive');
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);

  // Retrieve Academy Branding & Setup
  const program = academicCoachingCloudService.getLocalProgram();
  const academyName = program?.programName || 'SmartPE Sports Academy';
  const academyLogo = program?.logoUrl || '';
  const headCoachOrDirector = program?.headCoachName || 'Academy Director';

  const sportTemplate = SPORT_TEMPLATES[assessment.sport as CoachingSportId] || SPORT_TEMPLATES.football;
  const levelStyle = getDevelopmentLevelColor(assessment.developmentLevel);
  const merit = getMeritClassification(assessment.overallScore);

  // Age category calculation and benchmark retrieval
  const detectedCategory = detectAgeCategory(player.age, player.dob, player.gradeOrClass);
  const ageCategory: CoachingAgeCategory = assessment.ageCategory || player.ageCategory || detectedCategory;
  const ageCategoryStyle = getAgeCategoryColor(ageCategory);
  const benchmarkNorm = AGE_CATEGORY_BENCHMARKS[ageCategory];
  const normData = assessment.ageBenchmarkNorm;

  // High-reliability Print Generator that uses a hidden iframe (prevents iframe sandbox popup blockers)
  const handlePrint = () => {
    const content = printRef.current;
    if (!content) {
      window.print();
      return;
    }

    try {
      // 1. Create a dedicated hidden iframe in current DOM
      const iframe = document.createElement('iframe');
      iframe.setAttribute('style', 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden;z-index:-1;');
      document.body.appendChild(iframe);

      const doc = iframe.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write(`
          <!DOCTYPE html>
          <html lang="en">
            <head>
              <meta charset="UTF-8">
              <title>${player.name} - Official Athletic Merit & Development Report | SmartPE India</title>
              <link rel="preconnect" href="https://fonts.googleapis.com">
              <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
              <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800;900&family=Cinzel:wght@700;900&display=swap" rel="stylesheet">
              <style>
                @page {
                  size: A4 portrait;
                  margin: 10mm;
                }
                * {
                  box-sizing: border-box;
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                }
                body {
                  font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                  background-color: #ffffff;
                  color: #0f172a;
                  margin: 0;
                  padding: 12px;
                  font-size: 11px;
                  line-height: 1.45;
                }
                .report-wrapper {
                  max-width: 820px;
                  margin: 0 auto;
                }
                .no-print, button, .print-hide {
                  display: none !important;
                }
                .card, .print-card {
                  background: #ffffff;
                  border: 2px solid #0f172a;
                  border-radius: 14px;
                  padding: 14px;
                  margin-bottom: 12px;
                  page-break-inside: avoid;
                }
                .page-break {
                  page-break-before: always;
                }
                table {
                  width: 100%;
                  border-collapse: collapse;
                  font-size: 10.5px;
                }
                th, td {
                  padding: 6px 8px;
                  text-align: left;
                  border-bottom: 1px solid #e2e8f0;
                }
                th {
                  border-bottom: 2px solid #0f172a;
                  font-weight: 800;
                  text-transform: uppercase;
                  font-size: 9px;
                  color: #475569;
                }
                .grid-2 {
                  display: grid;
                  grid-template-columns: 1fr 1fr;
                  gap: 12px;
                }
                .grid-4 {
                  display: grid;
                  grid-template-columns: repeat(4, 1fr);
                  gap: 8px;
                }
                .score-badge {
                  display: inline-flex;
                  align-items: center;
                  justify-content: center;
                  width: 24px;
                  height: 24px;
                  border-radius: 6px;
                  background: #0f172a;
                  color: #ffffff;
                  font-weight: 900;
                  font-size: 11px;
                }
              </style>
            </head>
            <body>
              <div class="report-wrapper">
                ${content.innerHTML}
              </div>
            </body>
          </html>
        `);
        doc.close();

        setTimeout(() => {
          try {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
          } catch (err) {
            console.warn('Iframe print failed, falling back to window.print():', err);
            window.print();
          } finally {
            setTimeout(() => {
              try {
                document.body.removeChild(iframe);
              } catch (e) {}
            }, 1200);
          }
        }, 350);
        return;
      }

      window.print();
    } catch (e) {
      console.error('Print window error, using window.print() fallback:', e);
      window.print();
    }
  };

  // High-Resolution Direct PDF Exporter using html-to-image and jsPDF
  const handleDownloadPDF = async () => {
    const element = printRef.current;
    if (!element) {
      showToast('Report content not ready', 'error');
      return;
    }

    try {
      setIsExportingPDF(true);
      showToast('Generating official Merit Report PDF...', 'info');

      // Expand scroll container for complete capture
      const originalMaxHeight = element.style.maxHeight;
      const originalOverflow = element.style.overflow;
      const originalBorder = element.style.border;
      const originalBoxShadow = element.style.boxShadow;

      element.style.maxHeight = 'none';
      element.style.overflow = 'visible';
      element.style.border = 'none';
      element.style.boxShadow = 'none';

      // Brief pause to ensure DOM repaint & layout stabilization
      await new Promise(r => setTimeout(r, 150));

      let imgData: string;
      try {
        imgData = await toJpeg(element, {
          quality: 0.95,
          pixelRatio: 2,
          backgroundColor: '#ffffff',
          cacheBust: true,
          filter: (node) => {
            if (node instanceof HTMLElement) {
              return !(
                node.classList?.contains('no-print') || 
                node.classList?.contains('print-hide') || 
                node.tagName === 'BUTTON'
              );
            }
            return true;
          }
        });
      } catch (firstPassError) {
        console.warn('Initial toJpeg pass had font/asset issue, retrying with skipFonts:', firstPassError);
        imgData = await toJpeg(element, {
          quality: 0.95,
          pixelRatio: 2,
          backgroundColor: '#ffffff',
          skipFonts: true,
          filter: (node) => {
            if (node instanceof HTMLElement) {
              return !(
                node.classList?.contains('no-print') || 
                node.classList?.contains('print-hide') || 
                node.tagName === 'BUTTON'
              );
            }
            return true;
          }
        });
      } finally {
        // Restore layout container styles
        element.style.maxHeight = originalMaxHeight;
        element.style.overflow = originalOverflow;
        element.style.border = originalBorder;
        element.style.boxShadow = originalBoxShadow;
      }

      const img = new Image();
      img.src = imgData;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      const isCertificate = reportViewMode === 'certificate';
      const orientation = isCertificate ? 'l' : 'p';
      const pdf = new jsPDF(orientation, 'mm', 'a4');
      const pageWidth = isCertificate ? 297 : 210;
      const pageHeight = isCertificate ? 210 : 297;

      const imgWidth = pageWidth;
      const imgHeight = (img.height * imgWidth) / img.width;

      if (isCertificate) {
        // Fit certificate gracefully onto single landscape sheet
        if (imgHeight > pageHeight) {
          const scale = pageHeight / imgHeight;
          const scaledWidth = imgWidth * scale;
          const xOffset = (pageWidth - scaledWidth) / 2;
          pdf.addImage(imgData, 'JPEG', xOffset, 0, scaledWidth, pageHeight, undefined, 'FAST');
        } else {
          const yOffset = (pageHeight - imgHeight) / 2;
          pdf.addImage(imgData, 'JPEG', 0, yOffset, imgWidth, imgHeight, undefined, 'FAST');
        }
      } else {
        // Multi-page report
        let heightLeft = imgHeight;
        let position = 0;

        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
        heightLeft -= pageHeight;

        while (heightLeft > 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
          heightLeft -= pageHeight;
        }
      }

      // Metadata properties
      pdf.setProperties({
        title: `${player.name} - Athletic Merit & Development Report`,
        subject: `Athletic Performance Evaluation in ${sportTemplate.name}`,
        author: assessment.coachName || 'SmartPE India Coaching Academy',
        keywords: `SmartPE, Athletic Merit, ${sportTemplate.name}, Player Development`,
        creator: 'SmartPE India Player Development Suite'
      });

      const safePlayerName = player.name.replace(/\s+/g, '_');
      const safeSport = sportTemplate.name.replace(/[^a-zA-Z0-9]/g, '_');
      const filePrefix = isCertificate ? 'Merit_Certificate' : 'Merit_Report';
      const filename = `${safePlayerName}_${filePrefix}_${safeSport}.pdf`;

      pdf.save(filename);
      showToast(`Merit Report downloaded successfully as PDF!`, 'success');
    } catch (err) {
      console.error('PDF Export Error:', err);
      showToast('Could not compile PDF directly. Opening print dialog...', 'warning');
      handlePrint();
    } finally {
      setIsExportingPDF(false);
    }
  };

  // Formatted summary for coaches to forward directly to parents on WhatsApp
  const generateWhatsAppSummary = () => {
    return `🏆 *${academyName.toUpperCase()} • ATHLETIC MERIT REPORT*
(Co-Certified with SmartPE India Athletic Evaluation Framework)

👤 *Athlete:* ${player.name} (${player.age} yrs, ${player.gender})
🏅 *Sport:* ${sportTemplate.name} • ${player.position}
📅 *Assessment Cycle:* ${assessment.assessmentType} (${assessment.assessmentDate})
⭐ *Overall Score:* ${assessment.overallScore}/100 [${assessment.developmentLevel}]
🎖️ *Merit Distinction:* ${merit.category} (Grade ${merit.grade})

📊 *Core Developmental Pillars:*
• Technical Execution: ${assessment.domainScores.technical}/100
• Tactical Game Sense: ${assessment.domainScores.tactical}/100
• Physical Attributes: ${assessment.domainScores.physical}/100
• Mindset & Behaviour: ${assessment.domainScores.gameBehaviour}/100

✅ *Key Identified Strengths:*
${assessment.strengths.map(s => `• ${s}`).join('\n')}

🎯 *Key Development Focus for Next Cycle:*
${assessment.developmentPriorities.map(p => `• ${p}`).join('\n')}

💬 *Coach's Observation:*
"${assessment.coachObservation || 'Steady developmental progress and commendable dedication.'}"

${assessment.coachRecommendation ? `🏋️ *Recommended Home Practice:*\n${assessment.coachRecommendation}\n` : ''}
${assessment.nextGoals?.length ? `🚀 *Next 90-Day Goals:*\n${assessment.nextGoals.map(g => `• ${g.goal} (${g.skill})`).join('\n')}\n` : ''}
👨‍🏫 *Evaluated by:* Coach ${assessment.coachName} (${academyName})
🔗 *Digital Merit Report Link:* ${window.location.origin}${window.location.pathname}#merit-report-${assessment.id}`;
  };

  const getShareUrl = () => {
    return `${window.location.origin}${window.location.pathname}#merit-report-${assessment.id}`;
  };

  const handleCopyLink = () => {
    const url = getShareUrl();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => {
        setCopiedLink(true);
        showToast('Merit Report URL copied to clipboard!', 'success');
        setTimeout(() => setCopiedLink(false), 2500);
      }).catch(() => fallbackCopyText(url));
    } else {
      fallbackCopyText(url);
    }
  };

  const handleCopyWhatsApp = () => {
    const text = generateWhatsAppSummary();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        setCopiedSummary(true);
        showToast('WhatsApp summary copied to clipboard!', 'success');
        setTimeout(() => setCopiedSummary(false), 2500);
      }).catch(() => fallbackCopyText(text));
    } else {
      fallbackCopyText(text);
    }
  };

  const handleOpenWhatsAppDirect = () => {
    const text = generateWhatsAppSummary();
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank');
  };

  const handleNativeShare = async () => {
    const shareUrl = getShareUrl();
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: `${player.name} - Athletic Merit Report (${sportTemplate.name})`,
          text: `Review ${player.name}'s Athletic Merit & Development Report for ${sportTemplate.name} (${merit.category}, ${assessment.overallScore}/100).`,
          url: shareUrl
        });
        showToast('Report shared successfully!', 'success');
      } catch (err) {
        // user cancelled or share failed
      }
    } else {
      setIsShareModalOpen(true);
    }
  };

  const fallbackCopyText = (text: string) => {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
      showToast('Copied to clipboard!', 'success');
    } catch (err) {
      showToast('Failed to copy. Please copy link manually.', 'error');
    }
    document.body.removeChild(textArea);
  };

  return (
    <div className="fixed inset-0 z-[300] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="bg-white border-2 border-slate-900 rounded-3xl max-w-4xl w-full max-h-[95vh] flex flex-col overflow-hidden shadow-2xl print:max-h-none print:shadow-none print:border-none print:rounded-none">
        
        {/* Modal Top Control Bar (Hidden in Print) */}
        <div className="bg-slate-900 text-white px-4 sm:px-6 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 flex-shrink-0 print:hidden border-b border-slate-800">
          
          {/* Title & Format Switcher */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 font-black flex items-center justify-center shadow-md">
              <Trophy size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-black uppercase tracking-wider text-white">Athletic Merit Report</h2>
                <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border ${merit.badgeBg} ${merit.badgeText} ${merit.badgeBorder}`}>
                  {merit.grade} • {merit.category}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                {sportTemplate.name} • {player.name} • {assessment.assessmentType}
              </p>
            </div>
          </div>

          {/* View Toggles & Actions */}
          <div className="flex items-center flex-wrap gap-2">
            
            {/* Toggle Format: Comprehensive vs Certificate */}
            <div className="bg-slate-800 p-1 rounded-xl flex items-center space-x-1 border border-slate-700">
              <button
                type="button"
                onClick={() => setReportViewMode('comprehensive')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition ${
                  reportViewMode === 'comprehensive'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span className="flex items-center space-x-1.5">
                  <FileText size={13} />
                  <span className="hidden md:inline">Detailed Report</span>
                  <span className="md:hidden">Report</span>
                </span>
              </button>

              <button
                type="button"
                onClick={() => setReportViewMode('certificate')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition ${
                  reportViewMode === 'certificate'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span className="flex items-center space-x-1.5">
                  <Medal size={13} />
                  <span className="hidden md:inline">Merit Certificate</span>
                  <span className="md:hidden">Certificate</span>
                </span>
              </button>
            </div>

            {/* Share Button */}
            <button
              type="button"
              onClick={() => setIsShareModalOpen(true)}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-600 rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center space-x-1.5 active:scale-95 cursor-pointer"
              title="Share report link or WhatsApp"
            >
              <Share2 size={15} className="text-amber-400" />
              <span className="hidden sm:inline">Share</span>
            </button>

            {/* Download PDF Button */}
            <button
              type="button"
              disabled={isExportingPDF}
              onClick={handleDownloadPDF}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-xs uppercase tracking-wider transition shadow-sm flex items-center space-x-1.5 active:scale-95 cursor-pointer disabled:opacity-50"
              title="Download high-resolution A4 PDF"
            >
              {isExportingPDF ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>Exporting...</span>
                </>
              ) : (
                <>
                  <Download size={15} />
                  <span>PDF</span>
                </>
              )}
            </button>

            {/* Print Button */}
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider transition shadow-sm flex items-center space-x-1.5 active:scale-95 cursor-pointer"
              title="Print official document"
            >
              <Printer size={15} />
              <span className="hidden sm:inline">Print</span>
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition cursor-pointer"
              title="Close"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Share Modal Dialog Overlay */}
        {isShareModalOpen && (
          <div className="fixed inset-0 z-[350] bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white border-3 border-slate-900 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center font-black">
                    <Share2 size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">Share Merit Report</h3>
                    <p className="text-[11px] text-slate-500 font-medium">Forward link or formatted summary to parents</p>
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={() => setIsShareModalOpen(false)}
                  className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-900"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Share Options */}
              <div className="space-y-3">
                
                {/* 1. WhatsApp One-Click Launch */}
                <div className="bg-emerald-50/80 border-2 border-emerald-500/30 rounded-2xl p-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-emerald-900 font-black text-xs uppercase tracking-wider">
                      <MessageCircle size={16} className="text-emerald-600" />
                      <span>WhatsApp Summary</span>
                    </div>
                    <span className="text-[10px] font-black text-emerald-800 bg-emerald-200/80 px-2 py-0.5 rounded">
                      Direct Send
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-950/80 font-medium leading-relaxed">
                    Formatted text with overall score, strengths, coach observation, next goals, and direct report link.
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={handleOpenWhatsAppDirect}
                      className="py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs uppercase tracking-wider transition flex items-center justify-center space-x-1.5 shadow-sm active:scale-95"
                    >
                      <Send size={14} />
                      <span>Send WhatsApp</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleCopyWhatsApp}
                      className="py-2.5 bg-white hover:bg-emerald-100 text-emerald-900 border border-emerald-300 font-black rounded-xl text-xs uppercase tracking-wider transition flex items-center justify-center space-x-1.5"
                    >
                      {copiedSummary ? <Check size={14} /> : <Copy size={14} />}
                      <span>{copiedSummary ? 'Copied!' : 'Copy Text'}</span>
                    </button>
                  </div>
                </div>

                {/* 2. Direct Web Link */}
                <div className="bg-slate-50 border-2 border-slate-200 rounded-2xl p-4 space-y-2.5">
                  <div className="flex items-center justify-between text-slate-900 font-black text-xs uppercase tracking-wider">
                    <div className="flex items-center space-x-2">
                      <FileText size={16} className="text-slate-600" />
                      <span>Direct Web Report Link</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-bold">Public Link</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input 
                      type="text" 
                      readOnly 
                      value={getShareUrl()} 
                      className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-700 font-mono truncate focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-xl text-xs uppercase tracking-wider transition flex items-center space-x-1.5 shrink-0 active:scale-95"
                    >
                      {copiedLink ? <Check size={14} /> : <Copy size={14} />}
                      <span>{copiedLink ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>

                {/* 3. Native Share on Mobile Devices */}
                {typeof navigator !== 'undefined' && typeof navigator.share === 'function' && (
                  <button
                    type="button"
                    onClick={handleNativeShare}
                    className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider transition flex items-center justify-center space-x-2 shadow-sm active:scale-95"
                  >
                    <Share2 size={15} />
                    <span>Open Phone Share Sheet</span>
                  </button>
                )}
              </div>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => setIsShareModalOpen(false)}
                  className="text-xs font-bold text-slate-500 hover:text-slate-800"
                >
                  Close Share Dialog
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Scrollable Printable Document Area */}
        <div ref={printRef} className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 bg-slate-50/50 print:p-0 print:bg-white text-slate-900">
          
          {/* ============================================================ */}
          {/* MODE 1: COMPREHENSIVE MERIT REPORT */}
          {/* ============================================================ */}
          {reportViewMode === 'comprehensive' && (
            <>
              {/* Official Report Header Banner */}
              <div className="bg-white border-2 border-slate-900 rounded-2xl p-5 sm:p-7 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b-2 border-slate-100 pb-5 gap-4">
                  <div className="flex items-start space-x-4">
                    {academyLogo ? (
                      <div className="w-16 h-16 rounded-2xl border-2 border-slate-900 bg-white p-1 flex items-center justify-center shrink-0 shadow-sm overflow-hidden">
                        <img 
                          src={academyLogo} 
                          alt={academyName} 
                          className="w-full h-full object-contain" 
                        />
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-2xl bg-amber-500 text-slate-950 font-black text-2xl flex items-center justify-center shrink-0 shadow-md">
                        {academyName.charAt(0)}
                      </div>
                    )}
                    <div>
                      <div className="flex items-center flex-wrap gap-2 mb-1.5">
                        <span className="px-2.5 py-0.5 bg-slate-900 text-white rounded-md text-[10px] font-black uppercase tracking-wider">
                          {academyName}
                        </span>
                        <span className="px-2.5 py-0.5 bg-amber-100 text-amber-900 rounded-md text-[10px] font-black uppercase tracking-wider border border-amber-300">
                          Co-Certified with SmartPE India
                        </span>
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-900 rounded-md text-[10px] font-black uppercase tracking-wider">
                          {sportTemplate.name}
                        </span>
                      </div>
                      <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                        Player Development & Merit Report
                      </h1>
                      <p className="text-xs text-slate-500 font-semibold mt-1">
                        Comprehensive technical rubric, match intelligence, physical conditioning, and developmental coaching trajectory.
                      </p>
                    </div>
                  </div>

                  {/* Merit Distinction Seal Card */}
                  <div className="flex flex-col items-start sm:items-end justify-center bg-slate-50 p-4 rounded-2xl border-2 border-slate-900 min-w-[190px]">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-0.5">
                      Merit Classification
                    </span>
                    <div className="flex items-center space-x-2">
                      <span className="text-xl font-black text-slate-900">
                        Grade {merit.grade}
                      </span>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase border ${merit.badgeBg} ${merit.badgeText} ${merit.badgeBorder}`}>
                        {merit.category}
                      </span>
                    </div>
                    <span className="text-xs font-black text-slate-700 mt-1.5">
                      Overall Score: <span className="text-amber-600 font-black text-sm">{assessment.overallScore}</span> / 100
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded mt-1 border ${levelStyle.bg} ${levelStyle.text} ${levelStyle.border}`}>
                      Level: {assessment.developmentLevel}
                    </span>
                  </div>
                </div>

                {/* Athlete & Assessment Info Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-5 text-xs">
                  <div>
                    <p className="text-[10px] font-black uppercase text-slate-400">Athlete</p>
                    <p className="text-sm font-black text-slate-900">{player.name}</p>
                    <p className="text-[11px] text-slate-500 font-medium">
                      {player.gradeOrClass || 'Class Standard'} • DOB: {player.dob || `${2024 - player.age}-06-15`}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-slate-400">Sport & Position</p>
                    <p className="text-sm font-black text-slate-900">{sportTemplate.name}</p>
                    <p className="text-[11px] text-slate-500 font-medium">{player.position} ({player.dominantSide})</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-slate-400">Age Division / Cohort</p>
                    <div className="flex items-center space-x-1.5 mt-0.5">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-md border ${ageCategoryStyle.bg} ${ageCategoryStyle.text} ${ageCategoryStyle.border}`}>
                        {ageCategory}
                      </span>
                      <span className="text-[11px] font-bold text-slate-700">
                        {player.age} yrs
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 font-medium mt-0.5">{player.batchOrTeam || 'Academy Squad'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-slate-400">Evaluator & Date</p>
                    <p className="text-sm font-black text-slate-900">Coach {assessment.coachName}</p>
                    <p className="text-[11px] text-slate-500 font-medium">{assessment.assessmentType} ({assessment.assessmentDate})</p>
                  </div>
                </div>
              </div>

              {/* Age Category Performance Benchmark Norms Banner */}
              <div className="bg-gradient-to-r from-amber-500/10 via-slate-50 to-blue-500/10 border-2 border-slate-900 rounded-2xl p-4 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200">
                  <div className="flex items-center space-x-2.5">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wider border ${ageCategoryStyle.bg} ${ageCategoryStyle.text} ${ageCategoryStyle.border}`}>
                      {ageCategory} Coaching Norm
                    </span>
                    <div>
                      <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide">
                        Age-Calibrated Athletic Rubric ({normData?.categoryTitle || benchmarkNorm?.name || `${ageCategory} Coaching Stage`})
                      </h4>
                      <p className="text-[11px] text-slate-500 font-medium">
                        Standardized benchmarks calibrated for {ageCategory} athletic development.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 bg-white px-3 py-1.5 rounded-xl border border-slate-300 self-start sm:self-auto">
                    <Sparkles size={14} className="text-amber-500" />
                    <span className="text-xs font-black text-slate-900">
                      {normData?.cohortStanding || `Top ${Math.max(5, 100 - assessment.overallScore)}% in Category Cohort`}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 text-xs">
                  <div className="bg-white/90 p-2.5 rounded-xl border border-slate-200">
                    <span className="text-[10px] font-black uppercase text-slate-400 block mb-0.5">Developmental Stage</span>
                    <span className="font-bold text-slate-900 text-xs block">
                      {normData?.developmentStage || benchmarkNorm?.developmentStage || 'Youth Athletic Progression'}
                    </span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">
                      Typical: {benchmarkNorm?.typicalClasses || 'Class 7 to 9'}
                    </span>
                  </div>

                  <div className="bg-white/90 p-2.5 rounded-xl border border-slate-200">
                    <span className="text-[10px] font-black uppercase text-slate-400 block mb-0.5">Priority Coaching Focus</span>
                    <span className="font-bold text-slate-900 text-xs block">
                      {benchmarkNorm?.focusAreas?.slice(0, 2).join(' • ') || 'Core skill mechanics & movement agility'}
                    </span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">
                      Milestone: {normData?.stageMilestoneNotes || benchmarkNorm?.transitionMilestone || 'Match tempo adaptation'}
                    </span>
                  </div>

                  <div className="bg-white/90 p-2.5 rounded-xl border border-slate-200">
                    <span className="text-[10px] font-black uppercase text-slate-400 block mb-0.5">Standards & Progression Target</span>
                    <span className="font-bold text-slate-900 text-xs block">
                      {normData?.nextCategoryTarget || benchmarkNorm?.benchmarkDescription || 'Competitive readiness progression'}
                    </span>
                    <span className="text-[10px] text-amber-700 font-bold block mt-0.5">
                      Authority: {normData?.standardAuthority || benchmarkNorm?.standardAuthority || 'Sports Coaching LTAD'}
                    </span>
                  </div>
                </div>
              </div>

              {/* 4 Developmental Pillars Cards */}
              <div>
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-3 flex items-center space-x-1.5">
                  <ShieldCheck size={14} className="text-slate-900" />
                  <span>Core Developmental Pillars (0–100 Scale)</span>
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-white border-2 border-slate-900 rounded-2xl p-4 shadow-sm">
                    <span className="text-[10px] font-black uppercase text-slate-400 block mb-1">Technical Execution</span>
                    <div className="flex items-baseline justify-between">
                      <span className="text-2xl font-black text-slate-900">{assessment.domainScores.technical}</span>
                      <span className="text-[11px] font-bold text-slate-400">/ 100</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 mt-2 overflow-hidden">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${assessment.domainScores.technical}%` }} />
                    </div>
                  </div>

                  <div className="bg-white border-2 border-slate-900 rounded-2xl p-4 shadow-sm">
                    <span className="text-[10px] font-black uppercase text-slate-400 block mb-1">Tactical Game Sense</span>
                    <div className="flex items-baseline justify-between">
                      <span className="text-2xl font-black text-slate-900">{assessment.domainScores.tactical}</span>
                      <span className="text-[11px] font-bold text-slate-400">/ 100</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 mt-2 overflow-hidden">
                      <div className="bg-cyan-600 h-2 rounded-full" style={{ width: `${assessment.domainScores.tactical}%` }} />
                    </div>
                  </div>

                  <div className="bg-white border-2 border-slate-900 rounded-2xl p-4 shadow-sm">
                    <span className="text-[10px] font-black uppercase text-slate-400 block mb-1">Physical Attributes</span>
                    <div className="flex items-baseline justify-between">
                      <span className="text-2xl font-black text-slate-900">{assessment.domainScores.physical}</span>
                      <span className="text-[11px] font-bold text-slate-400">/ 100</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 mt-2 overflow-hidden">
                      <div className="bg-amber-600 h-2 rounded-full" style={{ width: `${assessment.domainScores.physical}%` }} />
                    </div>
                  </div>

                  <div className="bg-white border-2 border-slate-900 rounded-2xl p-4 shadow-sm">
                    <span className="text-[10px] font-black uppercase text-slate-400 block mb-1">Mindset & Behaviour</span>
                    <div className="flex items-baseline justify-between">
                      <span className="text-2xl font-black text-slate-900">{assessment.domainScores.gameBehaviour}</span>
                      <span className="text-[11px] font-bold text-slate-400">/ 100</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 mt-2 overflow-hidden">
                      <div className="bg-emerald-600 h-2 rounded-full" style={{ width: `${assessment.domainScores.gameBehaviour}%` }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Strengths & Development Priorities */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-emerald-50/70 border-2 border-emerald-900/30 rounded-2xl p-5">
                  <h3 className="text-xs font-black uppercase tracking-wider text-emerald-900 flex items-center space-x-2 mb-3">
                    <CheckCircle2 size={16} className="text-emerald-700" />
                    <span>Identified Strengths & Key Assets</span>
                  </h3>
                  <ul className="space-y-2">
                    {assessment.strengths.map((str, idx) => (
                      <li key={idx} className="flex items-start space-x-2 text-xs font-bold text-emerald-950">
                        <span className="w-4 h-4 rounded-full bg-emerald-200 text-emerald-900 flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5 font-black">
                          ✓
                        </span>
                        <span>{str}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-amber-50/70 border-2 border-amber-900/30 rounded-2xl p-5">
                  <h3 className="text-xs font-black uppercase tracking-wider text-amber-900 flex items-center space-x-2 mb-3">
                    <Target size={16} className="text-amber-700" />
                    <span>Development Priorities for Next Cycle</span>
                  </h3>
                  <ul className="space-y-2">
                    {assessment.developmentPriorities.map((prio, idx) => (
                      <li key={idx} className="flex items-start space-x-2 text-xs font-bold text-amber-950">
                        <span className="w-4 h-4 rounded-full bg-amber-200 text-amber-900 flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5 font-black">
                          •
                        </span>
                        <span>{prio}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Detailed Skill Evaluation Table (1–5 Coaching Scale) */}
              <div className="bg-white border-2 border-slate-900 rounded-2xl p-5 sm:p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-4">
                  <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 flex items-center space-x-2">
                    <Activity size={16} className="text-amber-500" />
                    <span>Detailed Skill Evaluation (1–5 Coaching Scale)</span>
                  </h3>
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                    1=Beginning | 2=Developing | 3=Emerging | 4=Proficient | 5=Advanced
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b-2 border-slate-900 text-slate-500 font-black uppercase text-[10px]">
                        <th className="pb-3 pr-4">Skill / Athletic Area</th>
                        <th className="pb-3 px-3">Category</th>
                        <th className="pb-3 px-3 text-center">Score</th>
                        <th className="pb-3 px-3">Proficiency Level</th>
                        <th className="pb-3 pl-4">Coaching Observation & Milestone</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {Object.entries(assessment.skillRatings).map(([skillId, rating]) => {
                        const skill = sportTemplate.skills.find(s => s.id === skillId);
                        const skillName = skill ? skill.name : skillId.replace(/^[a-z]+_/, '').replace(/_/g, ' ');
                        const skillCategory = skill ? skill.category : 'General';
                        const scaleInfo = COACHING_SCALE_LABELS[rating] || COACHING_SCALE_LABELS[3];
                        const obs = assessment.skillObservations[skillId] || (skill ? skill.coachingCue : 'Consistent progression demonstrated.');

                        return (
                          <tr key={skillId} className="hover:bg-slate-50/50">
                            <td className="py-2.5 pr-4 font-bold text-slate-900 capitalize">
                              {skillName}
                              {skill && !skill.isCore && (
                                <span className="ml-2 text-[9px] px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded font-black uppercase">
                                  Positional
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 uppercase text-[10px] font-bold text-slate-500">
                              {skillCategory}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-slate-900 text-white font-black text-xs shadow-xs">
                                {rating}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 font-black text-xs" style={{ color: scaleInfo.color }}>
                              {scaleInfo.title}
                            </td>
                            <td className="py-2.5 pl-4 text-slate-600 font-medium text-[11px] leading-relaxed">
                              {obs}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Coach's Summary & Development Outlook */}
              <div className="bg-white border-2 border-slate-900 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 flex items-center space-x-2">
                  <Award size={18} className="text-amber-500" />
                  <span>Coach's Summary & Development Outlook</span>
                </h3>
                
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <p className="text-xs font-semibold text-slate-800 leading-relaxed italic">
                    "{assessment.coachObservation || 'The athlete continues to show commendable commitment, coachability, and athletic dedication.'}"
                  </p>
                </div>

                {assessment.coachRecommendation && (
                  <div>
                    <p className="text-[11px] font-black uppercase text-slate-500 mb-1">Recommended Practice for Home / Extra Training</p>
                    <p className="text-xs text-slate-700 font-medium leading-relaxed">
                      {assessment.coachRecommendation}
                    </p>
                  </div>
                )}
              </div>

              {/* Next 3-Month Actionable SMART Goals */}
              {assessment.nextGoals && assessment.nextGoals.length > 0 && (
                <div className="bg-blue-50/80 border-2 border-blue-900/30 rounded-2xl p-5 sm:p-6">
                  <h3 className="text-sm font-black uppercase tracking-wider text-blue-950 flex items-center space-x-2 mb-3">
                    <TrendingUp size={18} className="text-blue-700" />
                    <span>Next 3-Month Actionable Development Goals</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {assessment.nextGoals.map((g, idx) => (
                      <div key={g.id || idx} className="bg-white p-4 rounded-xl border border-blue-200 shadow-sm">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-black uppercase text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                            {g.skill}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400">Target: {g.reviewDate || 'Next Cycle'}</span>
                        </div>
                        <p className="text-xs font-black text-slate-900 mt-1">{g.goal}</p>
                        <p className="text-[11px] text-slate-600 font-medium mt-0.5">Benchmark: {g.target}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Official Signatures & Verification Block */}
              <div className="pt-6 border-t-2 border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs text-slate-600">
                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Evaluator Coach</p>
                  <div className="border-b-2 border-slate-300 pb-1">
                    <p className="font-black text-slate-900">Coach {assessment.coachName}</p>
                  </div>
                  <p className="text-[10px] text-slate-400">Verified & Signed</p>
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Head Coach / Academy Director</p>
                  <div className="border-b-2 border-slate-300 pb-1">
                    <p className="font-black text-slate-900">{headCoachOrDirector} ({academyName})</p>
                  </div>
                  <p className="text-[10px] text-slate-400">Official Academy Endorsement</p>
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Parent / Guardian Acknowledgment</p>
                  <div className="border-b-2 border-slate-300 pb-1">
                    <p className="font-medium text-slate-400 italic">Signature: ______________________</p>
                  </div>
                  <p className="text-[10px] text-slate-400">Next Review: {assessment.nextAssessmentDate || '3 Months'}</p>
                </div>
              </div>
            </>
          )}

          {/* ============================================================ */}
          {/* MODE 2: OFFICIAL CERTIFICATE OF ATHLETIC MERIT */}
          {/* ============================================================ */}
          {reportViewMode === 'certificate' && (
            <div className="bg-white border-4 border-slate-900 p-8 sm:p-12 rounded-3xl relative overflow-hidden shadow-xl text-center space-y-6">
              
              {/* Ornate Gold Border Inset */}
              <div className="border-2 border-amber-500/80 p-6 sm:p-8 rounded-2xl relative">
                
                {/* Certificate Top Crest Header with Academy Logo & SmartPE Accreditation */}
                <div className="flex items-center justify-center space-x-4 mb-3">
                  {academyLogo && (
                    <div className="h-16 w-auto max-w-[140px] flex items-center justify-center">
                      <img 
                        src={academyLogo} 
                        alt={academyName} 
                        className="max-h-16 max-w-full object-contain drop-shadow" 
                      />
                    </div>
                  )}
                  {academyLogo && <div className="h-10 w-0.5 bg-amber-400 opacity-60" />}
                  <div className="w-12 h-12 rounded-2xl bg-amber-500 text-slate-950 font-black flex items-center justify-center shadow-lg">
                    <Trophy size={26} />
                  </div>
                </div>

                <p className="text-base sm:text-lg font-black uppercase tracking-[0.25em] text-slate-950 mb-0.5 font-display">
                  {academyName.toUpperCase()}
                </p>

                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-600 mb-2">
                  IN CO-ACADEMIC ACCREDITATION WITH SMARTPE INDIA
                </p>

                <h1 className="text-3xl sm:text-4xl font-black text-slate-900 uppercase tracking-wider font-display mb-2">
                  Certificate of Athletic Merit
                </h1>

                <p className="text-xs text-slate-500 font-serif italic mb-6 max-w-lg mx-auto">
                  This official distinction of athletic performance and developmental achievement is proudly conferred upon
                </p>

                {/* Athlete Name Display */}
                <div className="py-3 px-6 inline-block border-b-2 border-slate-900 mb-4 min-w-[280px]">
                  <h2 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-wide">
                    {player.name}
                  </h2>
                </div>

                <p className="text-xs text-slate-600 font-medium max-w-xl mx-auto leading-relaxed mb-6">
                  For outstanding athletic discipline, technical execution, and distinguished competitive progression in
                </p>

                {/* Sport & Distinction Details Banner */}
                <div className="bg-slate-50 border-2 border-slate-900 rounded-2xl p-5 max-w-xl mx-auto mb-8 grid grid-cols-4 gap-2 text-center">
                  <div className="border-r border-slate-200 pr-2">
                    <p className="text-[10px] font-black uppercase text-slate-400">Sport Category</p>
                    <p className="text-sm font-black text-slate-900">{sportTemplate.name}</p>
                    <p className="text-[10px] text-slate-500 font-bold">{player.position}</p>
                  </div>
                  <div className="border-r border-slate-200 pr-2">
                    <p className="text-[10px] font-black uppercase text-slate-400">Age Division</p>
                    <p className="text-sm font-black text-slate-900">{ageCategory}</p>
                    <p className="text-[10px] text-slate-500 font-bold">{benchmarkNorm?.name || 'Coaching'}</p>
                  </div>
                  <div className="border-r border-slate-200 pr-2">
                    <p className="text-[10px] font-black uppercase text-slate-400">Merit Category</p>
                    <p className="text-sm font-black text-amber-600">{merit.category}</p>
                    <p className="text-[10px] text-slate-500 font-bold">Grade {merit.grade}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-slate-400">Evaluation Score</p>
                    <p className="text-sm font-black text-slate-900">{assessment.overallScore} / 100</p>
                    <p className="text-[10px] text-emerald-600 font-bold">{assessment.developmentLevel}</p>
                  </div>
                </div>

                {/* 4 Pillars Summary Pill */}
                <div className="flex flex-wrap items-center justify-center gap-2 mb-8 text-[11px] font-bold">
                  <span className="px-3 py-1 bg-blue-50 text-blue-900 border border-blue-200 rounded-lg">
                    Technical: {assessment.domainScores.technical}%
                  </span>
                  <span className="px-3 py-1 bg-cyan-50 text-cyan-900 border border-cyan-200 rounded-lg">
                    Tactical: {assessment.domainScores.tactical}%
                  </span>
                  <span className="px-3 py-1 bg-amber-50 text-amber-900 border border-amber-200 rounded-lg">
                    Physical: {assessment.domainScores.physical}%
                  </span>
                  <span className="px-3 py-1 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-lg">
                    Mindset: {assessment.domainScores.gameBehaviour}%
                  </span>
                </div>

                {/* Sign-off Block */}
                <div className="grid grid-cols-2 max-w-lg mx-auto pt-6 border-t-2 border-slate-200 gap-8 text-left">
                  <div>
                    <p className="text-xs font-black text-slate-900">Coach {assessment.coachName}</p>
                    <p className="text-[10px] text-slate-400 font-medium">Evaluator / Lead Sports Coach</p>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">Date: {assessment.assessmentDate}</p>
                  </div>

                  <div className="text-right">
                    <p className="text-xs font-black text-slate-900">{headCoachOrDirector}</p>
                    <p className="text-[10px] text-slate-400 font-medium">{academyName} • SmartPE Board</p>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">ID: #{assessment.id.slice(0, 8)}</p>
                  </div>
                </div>

              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
