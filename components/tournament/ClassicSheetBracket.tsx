import React, { useRef, useState, useEffect } from 'react';
import { 
  Download, Printer, Sparkles, Edit3, Check, RefreshCw, 
  Copy, Image as ImageIcon, Eye, Grid, LayoutTemplate, Layers, CheckCircle2,
  Calendar, Clock, Shield, Trophy, Share2, FileText
} from 'lucide-react';
import TournamentPrintPreviewModal from './TournamentPrintPreviewModal.tsx';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { toast } from '../../services/toast.ts';
import { trackEvent } from '../../services/analytics.ts';

export interface ClassicSlot {
  slotIndex: number;
  teamName: string;
  isBye: boolean;
  byeLabel?: string;
}

interface ClassicSheetBracketProps {
  sport?: string;
  tournamentName: string;
  subTitle: string;
  category: string;
  startDate: string;
  teamsList: string[];
  firstHalf: number;
  secondHalf: number;
  halfTime: number;
  restGap: number;
  startTime: string;
  showGridLines?: boolean;
}

export const ClassicSheetBracket: React.FC<ClassicSheetBracketProps> = ({
  sport = 'FOOTBALL',
  tournamentName,
  subTitle,
  category,
  startDate,
  teamsList,
  firstHalf,
  secondHalf,
  halfTime,
  restGap,
  startTime,
  showGridLines: initialShowGrid = true
}) => {
  const sheetRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [showGrid, setShowGrid] = useState(initialShowGrid);
  const [customTitle, setCustomTitle] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [customTimes, setCustomTimes] = useState<Record<string, string>>({});
  const [customTeamNames, setCustomTeamNames] = useState<Record<number, string>>({});
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  const handleWhatsAppShare = () => {
    const text = 
`🏆 *OFFICIAL TOURNAMENT FIXTURE DRAW*
📌 *Tournament:* ${tournamentName} (${category})
⚽ *Sport:* ${sport} | 📅 *Date:* ${startDate}
👥 *Teams:* ${teamsList.length} | 🎯 *Byes:* ${byesCount}
⏰ *First Match:* ${startTime}

Official CBSE Physical Education Subject Code 048 format.
Generated via SmartPE India Official Tournament Studio.`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
    toast.success("Opening WhatsApp with tournament bracket draw!");
  };

  // Compute bracket power of 2
  const N = teamsList.length;
  const P = Math.max(4, Math.pow(2, Math.ceil(Math.log2(N || 4))));
  const totalRounds = Math.log2(P); // e.g. 16 -> 4 rounds
  const byesCount = P - N;

  // Format date display for title e.g. [29.08.2026]
  const formattedDateTag = (() => {
    try {
      if (!startDate) return '';
      const [y, m, d] = startDate.split('-');
      if (y && m && d) return `${d}.${m}.${y}`;
      const dt = new Date(startDate);
      const day = String(dt.getDate()).padStart(2, '0');
      const month = String(dt.getMonth() + 1).padStart(2, '0');
      const year = dt.getFullYear();
      return `${day}.${month}.${year}`;
    } catch {
      return startDate;
    }
  })();

  const defaultHeader = `${(sport || 'FOOTBALL').toUpperCase()} ${category ? `${category.toUpperCase()} ` : ''}${formattedDateTag ? `[${formattedDateTag}]` : ''}`.trim();
  const displayTitle = customTitle || defaultHeader;

  // Standard CBSE bye allocation logic
  const byeSlots = new Set<number>();
  const Nu = N % 2 === 0 ? N / 2 : (N + 1) / 2;
  let botLower = P - 1;
  let topUpper = 0;
  let topLower = P / 2;
  let botUpper = P / 2 - 1;

  for (let b = 0; b < byesCount; b++) {
    const step = b % 4;
    if (step === 0) {
      byeSlots.add(botLower);
      botLower -= 2;
      if (botLower < P / 2) botLower = P - 2;
    } else if (step === 1) {
      byeSlots.add(topUpper);
      topUpper += 2;
      if (topUpper >= P / 2) topUpper = 1;
    } else if (step === 2) {
      byeSlots.add(topLower);
      topLower += 2;
      if (topLower >= P) topLower = P / 2 + 1;
    } else if (step === 3) {
      byeSlots.add(botUpper);
      botUpper -= 2;
      if (botUpper < 0) botUpper = P / 2 - 2;
    }
  }

  // Populate slots (0 to P-1)
  const slots: ClassicSlot[] = [];
  let teamCursor = 0;
  for (let i = 0; i < P; i++) {
    const isBye = byeSlots.has(i);
    const assignedTeam = customTeamNames[i] || teamsList[teamCursor] || `Team ${i + 1}`;
    if (teamCursor < teamsList.length) {
      teamCursor++;
    }
    slots.push({
      slotIndex: i,
      teamName: assignedTeam,
      isBye: isBye && byesCount > 0,
      byeLabel: 'BYE'
    });
  }

  // Time calculation helper
  const addMinutes = (baseTime: string, mins: number) => {
    const [hStr, mStr] = (baseTime || '08:00').split(':');
    let h = parseInt(hStr, 10) || 8;
    let m = parseInt(mStr, 10) || 0;
    m += mins;
    h += Math.floor(m / 60);
    m = m % 60;
    const ampm = h >= 12 ? 'PM' : 'AM';
    let h12 = h % 12;
    if (h12 === 0) h12 = 12;
    return `${h12}.${String(m).padStart(2, '0')}${ampm}`;
  };

  const matchDuration = (firstHalf || 15) + (secondHalf || 15) + (halfTime || 5) + (restGap || 10);

  // Pre-calculate round match times
  const roundTimes: string[][] = [];
  let globalMatchIndex = 0;

  for (let r = 0; r < totalRounds; r++) {
    const matchesInRound = Math.pow(2, totalRounds - r - 1);
    const timesForThisRound: string[] = [];
    for (let m = 0; m < matchesInRound; m++) {
      const timeKey = `r${r}_m${m}`;
      if (customTimes[timeKey]) {
        timesForThisRound.push(customTimes[timeKey]);
      } else {
        const calculated = addMinutes(startTime || '08:30', globalMatchIndex * matchDuration);
        timesForThisRound.push(calculated);
      }
      globalMatchIndex++;
    }
    roundTimes.push(timesForThisRound);
  }

  const handleTimeChange = (r: number, m: number, value: string) => {
    setCustomTimes(prev => ({
      ...prev,
      [`r${r}_m${m}`]: value
    }));
  };

  const handleTeamNameChange = (slotIdx: number, value: string) => {
    setCustomTeamNames(prev => ({
      ...prev,
      [slotIdx]: value
    }));
  };

  // Load standard 16-team sample draw with Team 1 - 16 and realistic match timings
  const handleLoad16TeamSample = () => {
    const teams: Record<number, string> = {};
    for (let i = 0; i < 16; i++) {
      teams[i] = `Team ${i + 1}`;
    }
    setCustomTeamNames(teams);
    setCustomTimes({
      // Round 1 (8 matches)
      r0_m0: '9.00AM',
      r0_m1: '9.45AM',
      r0_m2: '10.30AM',
      r0_m3: '11.15AM',
      r0_m4: '12.00PM',
      r0_m5: '12.45PM',
      r0_m6: '1.30PM',
      r0_m7: '2.15PM',
      // Quarter Finals (Round 2, 4 matches)
      r1_m0: '10.45AM',
      r1_m1: '12.30PM',
      r1_m2: '2.30PM',
      r1_m3: '3.15PM',
      // Semi Finals (Round 3, 2 matches)
      r2_m0: '3.45PM',
      r2_m1: '4.30PM',
      // Final (Round 4, 1 match)
      r3_m0: '5.15PM'
    });
    setCustomTitle('FOOTBALL U - 11 [29.08.2026]');
    toast.success("Loaded 16-Team sample draw (Team 1 - 16 with match timings)!");
  };

  // Download as Image (.PNG)
  const handleDownloadImage = async () => {
    if (!sheetRef.current) return;
    setIsExporting(true);
    try {
      const dataUrl = await toPng(sheetRef.current, {
        cacheBust: true,
        pixelRatio: 2.5,
        backgroundColor: '#ffffff'
      });
      const link = document.createElement('a');
      const cleanFileName = `${(sport || 'Tournament').toLowerCase()}_fixture_bracket_${formattedDateTag || 'sheet'}.png`.replace(/[^a-z0-9_.]/gi, '_');
      link.download = cleanFileName;
      link.href = dataUrl;
      link.click();
      toast.success("Tournament Fixture image downloaded successfully!");
      trackEvent('resource_downloaded', { resource_name: `Fixture Bracket (${sport})`, format: 'png', teamsCount: N });
    } catch (err) {
      console.error("Failed to export image:", err);
      toast.error("Failed to export bracket image. Please try Print / Save PDF instead.");
    } finally {
      setIsExporting(false);
    }
  };

  // Export to Word (.doc) with VISUAL BRACKET IMAGE embedded
  const handleExportWordWithImage = async () => {
    if (!sheetRef.current) return;
    setIsExporting(true);
    toast.loading("Generating Word document with bracket image...", { id: 'classic-word' });
    try {
      const dataUrl = await toPng(sheetRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: '#ffffff'
      });

      // Construct matches table
      let tableRows = '';
      let matchNum = 1;
      for (let r = 0; r < totalRounds; r++) {
        const matchesInRound = Math.pow(2, totalRounds - r - 1);
        const roundName = r === totalRounds - 1 ? 'Championship Final' : r === totalRounds - 2 ? 'Semi-Finals' : r === totalRounds - 3 ? 'Quarter-Finals' : `Round ${r + 1}`;
        for (let m = 0; m < matchesInRound; m++) {
          const time = roundTimes[r]?.[m] || 'TBD';
          tableRows += `
            <tr style="text-align:center; background-color:${matchNum % 2 === 0 ? '#f8fafc' : '#ffffff'};">
              <td style="font-weight:bold; color:#0D2B52; padding:6px;">Match ${matchNum++}</td>
              <td style="padding:6px;">${roundName}</td>
              <td style="font-weight:bold; text-align:left; padding:6px 10px;">${r === 0 ? (slots[m * 2]?.teamName || 'TBD') : `Winner of Previous Round`}</td>
              <td style="color:#888; font-weight:bold; padding:6px;">VS</td>
              <td style="font-weight:bold; text-align:left; padding:6px 10px;">${r === 0 ? (slots[m * 2 + 1]?.teamName || 'TBD') : `Winner of Previous Round`}</td>
              <td style="padding:6px;">${formattedDateTag || startDate}</td>
              <td style="font-weight:bold; color:#b91c1c; padding:6px;">${time}</td>
            </tr>
          `;
        }
      }

      // 1. Calculate dynamic image scale to fit strictly on Page 1 (Landscape)
      const origW = sheetRef.current.offsetWidth || 1100;
      const origH = sheetRef.current.offsetHeight || (P * ROW_HEIGHT + 140);

      // Determine dimensions: Standard A4 Landscape is 841.9pt x 595.3pt
      // For N > 16 (e.g. 20, 25 teams), we recommend A3 Landscape (1190.6pt x 841.9pt)
      const isA3 = N > 16;
      const pageSizePtW = isA3 ? '1190.6pt' : '841.9pt';
      const pageSizePtH = isA3 ? '841.9pt' : '595.3pt';

      // Page 1 budget: Available printable height minus header (~44pt) and signatures (~28pt)
      const maxTargetW = isA3 ? 1130 : 785;
      const maxTargetH = isA3 ? 660 : 425;

      // Scale proportionally so the entire bracket tree fits within Page 1
      const scale = Math.min(maxTargetW / origW, maxTargetH / origH, 1);
      const renderWidthPt = Math.max(220, Math.round(origW * scale));
      const renderHeightPt = Math.max(160, Math.round(origH * scale));

      const wordHtml = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head>
          <meta charset="utf-8">
          <title>${displayTitle}</title>
          <!--[if gte mso 9]>
          <xml>
            <w:WordDocument>
              <w:View>Print</w:View>
              <w:Zoom>100</w:Zoom>
              <w:DoNotOptimizeForBrowser/>
            </w:WordDocument>
          </xml>
          <![endif]-->
          <style>
            @page Section1 {
              size: ${pageSizePtW} ${pageSizePtH};
              mso-page-orientation: landscape;
              margin: 14pt 18pt 14pt 18pt;
              mso-header-margin: 0pt;
              mso-footer-margin: 0pt;
            }
            div.Section1 {
              page: Section1;
            }
            body {
              font-family: Arial, Helvetica, sans-serif;
              margin: 0;
              padding: 0;
              color: #1e293b;
            }
            table {
              border-collapse: collapse;
            }
          </style>
        </head>
        <body lang="EN-US">
          <div class="Section1">
            <!-- PAGE 1: 1-PAGE MASTER TOURNAMENT FIXTURE BRACKET -->
            <div style="text-align:center; margin:0 0 3pt 0;">
              <h1 style="color:#0D2B52; font-size:12.5pt; text-transform:uppercase; margin:0; line-height:1.2;">
                SHRADDHA CHILDREN'S ACADEMY
              </h1>
              <div style="color:#64748b; font-size:7.5pt; font-weight:bold; text-transform:uppercase; margin:1pt 0;">
                DEPARTMENT OF PHYSICAL EDUCATION & SPORTS • OFFICIAL DRAW
              </div>
              <div style="color:#D4A017; font-size:10pt; font-weight:bold; text-transform:uppercase; margin:1pt 0;">
                ${displayTitle}
              </div>
              <div style="font-size:7.5pt; color:#475569; margin:1pt 0;">
                <strong>Sport:</strong> ${sport} &nbsp;|&nbsp; 
                <strong>Date:</strong> ${formattedDateTag || startDate} &nbsp;|&nbsp; 
                <strong>First Match:</strong> ${startTime} &nbsp;|&nbsp; 
                <strong>Total Teams:</strong> ${N} &nbsp;|&nbsp; 
                <strong>Upper Half:</strong> ${Nu} &nbsp;|&nbsp; 
                <strong>Lower Half:</strong> ${P - Nu} &nbsp;|&nbsp; 
                <strong>Byes:</strong> ${byesCount} &nbsp;|&nbsp; 
                <strong>Total Matches:</strong> ${N - 1} &nbsp;|&nbsp; 
                <strong>Total Rounds:</strong> ${totalRounds}
              </div>
            </div>

            <!-- Scaled Bracket Drawing (Strictly fits on Page 1 without clipping or spilling) -->
            <div style="text-align:center; margin:2pt 0; padding:0;">
              <img src="${dataUrl}" 
                   width="${renderWidthPt}" 
                   height="${renderHeightPt}" 
                   style="width:${renderWidthPt}pt; height:${renderHeightPt}pt; max-width:100%; border:1px solid #cbd5e1; display:inline-block;" 
                   alt="Tournament Bracket Drawing" />
            </div>

            <!-- Page 1 Signatures -->
            <table style="width:100%; margin-top:4pt; font-size:7.5pt; text-align:center; border:none;">
              <tr>
                <td style="width:33%; border:none; padding:2pt;">____________________________<br/><strong>Physical Education Teacher</strong></td>
                <td style="width:33%; border:none; padding:2pt;">____________________________<br/><strong>Sports Coordinator / HOD</strong></td>
                <td style="width:33%; border:none; padding:2pt;">____________________________<br/><strong>Principal / Headmaster</strong></td>
              </tr>
            </table>

            <!-- EXPLICIT SECTION BREAK TO PAGE 2 (MATCH SCHEDULE & TIMINGS) -->
            <br clear=all style='page-break-before:always; mso-break-type:section-break'>

            <!-- PAGE 2: OFFICIAL MATCH SCHEDULE & TIMINGS -->
            <div style="margin-top:4pt;">
              <div style="text-align:center; margin-bottom:8pt;">
                <h2 style="color:#0D2B52; font-size:13pt; text-transform:uppercase; margin:0 0 2pt 0;">
                  SHRADDHA CHILDREN'S ACADEMY
                </h2>
                <div style="color:#64748b; font-size:8pt; font-weight:bold; text-transform:uppercase; margin:1pt 0;">
                  DEPARTMENT OF PHYSICAL EDUCATION & SPORTS
                </div>
                <div style="color:#D4A017; font-size:11pt; font-weight:bold; text-transform:uppercase; margin:2pt 0;">
                  Official Match Schedule & Timings — ${displayTitle}
                </div>
                <div style="font-size:8pt; color:#475569;">
                  <strong>Discipline:</strong> ${sport} &nbsp;|&nbsp; <strong>Date:</strong> ${formattedDateTag || startDate} &nbsp;|&nbsp; <strong>Total Teams:</strong> ${N} &nbsp;|&nbsp; <strong>Total Matches:</strong> ${N - 1}
                </div>
              </div>

              <table border="1" cellpadding="5" cellspacing="0" style="border-collapse:collapse; width:100%; font-size:8.5pt; font-family:Arial, sans-serif;">
                <tr style="background-color:#0D2B52; color:#ffffff; font-weight:bold; text-align:center;">
                  <th style="padding:5px; color:#ffffff;">Match #</th>
                  <th style="padding:5px; color:#ffffff;">Stage / Round</th>
                  <th style="padding:5px; color:#ffffff;">Team 1</th>
                  <th style="padding:5px; color:#ffffff;">VS</th>
                  <th style="padding:5px; color:#ffffff;">Team 2</th>
                  <th style="padding:5px; color:#ffffff;">Date</th>
                  <th style="padding:5px; color:#ffffff;">Scheduled Time</th>
                </tr>
                ${tableRows}
              </table>

              <!-- Page 2 Signatures -->
              <table style="width:100%; margin-top:24pt; font-size:8pt; text-align:center; border:none;">
                <tr>
                  <td style="width:33%; border:none; padding:4pt;">____________________________<br/><strong>Physical Education Teacher</strong></td>
                  <td style="width:33%; border:none; padding:4pt;">____________________________<br/><strong>Sports Coordinator / HOD</strong></td>
                  <td style="width:33%; border:none; padding:4pt;">____________________________<br/><strong>Principal / Headmaster</strong></td>
                </tr>
              </table>
            </div>
          </div>
        </body>
        </html>
      `;

      const blob = new Blob(['\ufeff', wordHtml], { type: 'application/msword' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(tournamentName || 'Tournament').replace(/\s+/g, '_')}_Official_Fixture_${isA3 ? 'A3' : 'A4'}.doc`;
      a.click();
      URL.revokeObjectURL(url);
      toast.dismiss('classic-word');
      toast.success(`Word document (.doc) exported successfully (${isA3 ? 'A3' : 'A4'} 1-Page Bracket + Schedule)!`);
    } catch (err) {
      console.error(err);
      toast.dismiss('classic-word');
      toast.error("Failed to generate Word document with image.");
    } finally {
      setIsExporting(false);
    }
  };

  // Direct PDF Download (.pdf) via jsPDF
  const handleDownloadPdf = async () => {
    if (!sheetRef.current) return;
    setIsExporting(true);
    toast.loading("Generating official PDF file...", { id: 'classic-pdf' });
    try {
      const imgData = await toPng(sheetRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: '#ffffff'
      });

      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: N > 16 ? 'a3' : 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const margin = 8;
      const imgWidth = pdfWidth - margin * 2;
      const imgHeight = (sheetRef.current.offsetHeight * imgWidth) / sheetRef.current.offsetWidth;

      pdf.addImage(imgData, 'PNG', margin, margin, imgWidth, Math.min(imgHeight, pdfHeight - margin * 2));
      pdf.save(`${(tournamentName || 'Tournament').replace(/\s+/g, '_')}_Official_Fixture_${N}Teams.pdf`);
      toast.dismiss('classic-pdf');
      toast.success("Official PDF file downloaded successfully!");
    } catch (err) {
      console.error(err);
      toast.dismiss('classic-pdf');
      toast.error("Failed to generate PDF. You can also use Print / Save PDF.");
    } finally {
      setIsExporting(false);
    }
  };

  // WhatsApp Share with ACTUAL PDF Document Attachment
  const handleWhatsAppSharePdf = async () => {
    if (!sheetRef.current) return;
    setIsExporting(true);
    toast.loading("Preparing PDF for WhatsApp...", { id: 'classic-wa' });
    try {
      const imgData = await toPng(sheetRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: '#ffffff'
      });

      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: N > 16 ? 'a3' : 'a4'
      });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const margin = 8;
      const imgWidth = pdfWidth - margin * 2;
      const imgHeight = (sheetRef.current.offsetHeight * imgWidth) / sheetRef.current.offsetWidth;
      pdf.addImage(imgData, 'PNG', margin, margin, imgWidth, Math.min(imgHeight, pdfHeight - margin * 2));
      
      const pdfBlob = pdf.output('blob');
      const filename = `${(tournamentName || 'Tournament').replace(/\s+/g, '_')}_Fixture.pdf`;
      const pdfFile = new File([pdfBlob], filename, { type: 'application/pdf' });

      const captionText = 
`🏆 *OFFICIAL TOURNAMENT FIXTURE BRACKET*
📌 *Tournament:* ${tournamentName} (${category})
⚽ *Sport:* ${sport} | 📅 *Date:* ${formattedDateTag || startDate}
⏰ *First Match Time:* ${startTime}
👥 *Teams:* ${N} Teams | 🎯 *Byes:* ${byesCount} Byes
Official CBSE PE Subject Code 048 draw sheet.`;

      // Check if mobile browser can share file directly to WhatsApp
      if (navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
        toast.dismiss('classic-wa');
        await navigator.share({
          files: [pdfFile],
          title: `Tournament Fixture - ${tournamentName}`,
          text: captionText
        });
        toast.success("Shared PDF via WhatsApp!");
        return;
      }

      // Fallback: Download PDF & open WhatsApp
      pdf.save(filename);
      toast.dismiss('classic-wa');
      toast.success("PDF saved! Opening WhatsApp to attach file...");

      const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(
        captionText + '\n\n📄 _(Official Fixture PDF has been downloaded to your device - please attach it now to send)_'
      )}`;
      window.open(waUrl, '_blank');
    } catch (err) {
      console.error(err);
      toast.dismiss('classic-wa');
      toast.error("Could not share PDF. Opening WhatsApp with summary text.");
      handleWhatsAppShare();
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Geometry configuration
  const ROW_HEIGHT = P <= 8 ? 58 : P <= 16 ? 46 : 36;
  const TOTAL_HEIGHT = P * ROW_HEIGHT + 140;
  const SLOT_WIDTH = 260;
  const STEP_COL_WIDTH = 135;

  return (
    <div className="space-y-6">
      {/* Control Bar in Brand Navy & Gold */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-[#0D2B52] text-white p-4 md:p-6 rounded-3xl border border-[#164077] shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#D4A017]/20 border border-[#D4A017]/40 text-[#D4A017] flex items-center justify-center font-black">
            <LayoutTemplate size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-black uppercase tracking-wider text-white">Classic Fixture Sheet</h4>
              <span className="px-2 py-0.5 bg-[#D4A017]/20 text-[#D4A017] border border-[#D4A017]/30 rounded text-[9px] font-black uppercase">
                Official Draw Sheet
              </span>
            </div>
            <p className="text-xs text-slate-300 font-medium mt-0.5">
              Classic lined tournament tree with spreadsheet background & red match times.
            </p>
          </div>
        </div>

        {/* Action Buttons Toolbar with smooth horizontal scroll on mobile */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar w-full lg:w-auto pb-1 lg:pb-0">
          {/* Quick Load 16 Team Sample */}
          <button
            onClick={handleLoad16TeamSample}
            className="shrink-0 px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border bg-white/10 hover:bg-white/20 border-white/20 text-[#D4A017]"
            title="Load standard 16 teams (Team 1 - 16) with sample timings"
          >
            <Sparkles size={14} className="text-[#D4A017]" />
            <span className="whitespace-nowrap">Sample 16 Draw</span>
          </button>

          {/* Toggle Grid Lines */}
          <button
            onClick={() => setShowGrid(!showGrid)}
            className={`shrink-0 px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
              showGrid 
                ? 'bg-[#164077] border-white/20 text-white' 
                : 'bg-slate-900 border-white/10 text-slate-400 hover:text-white'
            }`}
            title="Toggle background spreadsheet grid lines"
          >
            <Grid size={14} />
            <span className="whitespace-nowrap">{showGrid ? 'Grid: ON' : 'Grid: OFF'}</span>
          </button>

          {/* Download Image (.PNG) */}
          <button
            onClick={handleDownloadImage}
            disabled={isExporting}
            className="shrink-0 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-md disabled:opacity-50"
            title="Download high-resolution PNG image"
          >
            {isExporting ? <RefreshCw size={13} className="animate-spin" /> : <ImageIcon size={13} />}
            <span className="whitespace-nowrap">PNG</span>
          </button>

          {/* Export Word (.doc with Bracket Image) */}
          <button
            onClick={handleExportWordWithImage}
            disabled={isExporting}
            className="shrink-0 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-md active:scale-95 disabled:opacity-50"
            title="Export Word document with bracket image and match schedule"
          >
            <FileText size={14} />
            <span className="whitespace-nowrap">Word (.doc)</span>
          </button>

          {/* Download PDF (.pdf) */}
          <button
            onClick={handleDownloadPdf}
            disabled={isExporting}
            className="shrink-0 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-md active:scale-95 disabled:opacity-50"
            title="Download direct PDF file"
          >
            <Download size={14} />
            <span className="whitespace-nowrap">PDF</span>
          </button>

          {/* WhatsApp Share PDF */}
          <button
            onClick={handleWhatsAppSharePdf}
            disabled={isExporting}
            className="shrink-0 px-3.5 py-2 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-md active:scale-95 disabled:opacity-50"
            title="Share tournament bracket PDF directly to WhatsApp"
          >
            <Share2 size={13} />
            <span className="whitespace-nowrap">WhatsApp</span>
          </button>

          {/* Print Preview & Sizing Modal */}
          <button
            onClick={() => setIsPrintModalOpen(true)}
            className="shrink-0 px-4 py-2 bg-[#D4A017] hover:bg-[#b88b14] text-[#0D2B52] rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-md active:scale-95"
            title="Open interactive print preview with A4/A3 paper sizing and Word export"
          >
            <Printer size={14} />
            <span className="whitespace-nowrap">Print Preview</span>
          </button>
        </div>
      </div>

      {/* Printable Sheet Viewport with native touch-scrolling */}
      <div className="bg-slate-100 p-2 sm:p-4 md:p-8 rounded-2xl sm:rounded-[2.5rem] border-2 border-slate-900 shadow-inner">
        {/* Mobile Swipe Guide Banner */}
        <div className="lg:hidden flex items-center justify-between bg-amber-500/10 border border-amber-500/30 text-amber-900 px-3.5 py-2 rounded-xl text-xs font-bold mb-3 shadow-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-base animate-pulse">👉</span>
            <span>Swipe right to view all rounds, timings & final winner</span>
          </div>
          <span className="text-[10px] uppercase font-black bg-amber-500/20 text-amber-900 px-2 py-0.5 rounded-full shrink-0">
            Scroll &rarr;
          </span>
        </div>

        <div className="overflow-x-auto pb-3">
          <div 
            ref={sheetRef}
            className={`mx-auto bg-white p-4 sm:p-6 md:p-12 rounded-2xl shadow-xl transition-all relative border border-slate-300 min-w-[900px] max-w-[1200px] ${
              showGrid ? 'bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:32px_24px]' : ''
            }`}
            style={{ minHeight: `${TOTAL_HEIGHT}px` }}
          >
          {/* Header Title (Red, Bold, Left-Aligned like user image) */}
          <div className="mb-8 border-b-2 border-slate-200 pb-4 flex justify-between items-start">
            <div>
              {isEditingTitle ? (
                <div className="flex items-center gap-2">
                  <input 
                    type="text"
                    value={customTitle || displayTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    placeholder="e.g. FOOTBALL U - 11 [29.08.2026]"
                    className="text-xl md:text-2xl font-black text-red-600 border-2 border-red-400 p-2 rounded-xl outline-none"
                    autoFocus
                  />
                  <button 
                    onClick={() => setIsEditingTitle(false)}
                    className="p-2 bg-emerald-600 text-white rounded-xl text-xs font-bold"
                  >
                    <Check size={16} />
                  </button>
                </div>
              ) : (
                <div className="group flex items-center gap-3">
                  <h1 className="text-xl md:text-3xl font-black tracking-tight text-red-600 uppercase font-sans">
                    {displayTitle}
                  </h1>
                  <button 
                    onClick={() => setIsEditingTitle(true)}
                    className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-slate-700 p-1 transition-all"
                    title="Click to edit title directly"
                  >
                    <Edit3 size={14} />
                  </button>
                </div>
              )}

              {(tournamentName || subTitle) && (
                <p className="text-xs font-black text-slate-600 uppercase tracking-widest mt-1">
                  {tournamentName} {subTitle ? `• ${subTitle}` : ''}
                </p>
              )}
            </div>

            <div className="text-right text-[10px] font-black uppercase tracking-wider text-slate-500">
              <span className="text-indigo-600 font-bold">Knockout Tournament Draw</span>
              <div className="text-slate-900 font-black">{N} Teams • {P} Bracket Lines ({byesCount} Byes)</div>
            </div>
          </div>

          {/* SVG Tree Bracket Engine */}
          <div className="relative w-full" style={{ height: `${P * ROW_HEIGHT}px` }}>
            {/* 1. First Round Team Slot Lines */}
            {slots.map((slot, sIdx) => {
              const isEvenPair = sIdx % 2 === 0;
              const matchIdxInR1 = Math.floor(sIdx / 2);
              const matchTime = roundTimes[0]?.[matchIdxInR1] || '';

              return (
                <div 
                  key={`slot-${sIdx}`}
                  className="absolute left-0 flex flex-col justify-end"
                  style={{ 
                    top: `${sIdx * ROW_HEIGHT}px`, 
                    height: `${ROW_HEIGHT}px`,
                    width: `${SLOT_WIDTH}px`
                  }}
                >
                  {/* Team Name Label sitting directly on the horizontal black line */}
                  <div className="flex items-center justify-between pr-2 mb-0.5">
                    <input
                      type="text"
                      value={slot.teamName}
                      onChange={(e) => handleTeamNameChange(sIdx, e.target.value)}
                      className="text-xs font-black uppercase text-slate-900 tracking-tight bg-transparent outline-none focus:bg-amber-50 rounded px-1 w-[180px] truncate"
                      title="Click to edit team name"
                    />

                    {/* Show Match Time on the second team of each pair in RED font */}
                    {!isEvenPair && matchTime && !slot.isBye && (
                      <input
                        type="text"
                        value={customTimes[`r0_m${matchIdxInR1}`] ?? matchTime}
                        onChange={(e) => handleTimeChange(0, matchIdxInR1, e.target.value)}
                        className="text-[11px] font-black text-red-600 tracking-tighter w-16 text-right bg-transparent outline-none focus:bg-red-50 rounded px-0.5"
                        title="Click to edit match time"
                      />
                    )}

                    {slot.isBye && (
                      <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest px-1">
                        (BYE)
                      </span>
                    )}
                  </div>

                  {/* Horizontal solid black line */}
                  <div className="w-full h-[2px] bg-slate-900"></div>
                </div>
              );
            })}

            {/* 2. SVG Connecting Step Lines & Match Times for all Rounds */}
            <svg 
              className="absolute inset-0 w-full h-full pointer-events-none"
              style={{ overflow: 'visible' }}
            >
              {Array.from({ length: totalRounds }).map((_, rIdx) => {
                const matchesInThisRound = Math.pow(2, totalRounds - rIdx - 1);
                const stepX = SLOT_WIDTH + rIdx * STEP_COL_WIDTH;
                const colWidth = STEP_COL_WIDTH;

                return Array.from({ length: matchesInThisRound }).map((__, mIdx) => {
                  // Span of slots this match covers
                  const slotsSpan = Math.pow(2, rIdx + 1);
                  const topSlotIdx = mIdx * slotsSpan;
                  const bottomSlotIdx = topSlotIdx + slotsSpan - 1;

                  // Center Y positions of top feeder branch and bottom feeder branch
                  const topBranchY = (topSlotIdx + (slotsSpan / 4 - 0.5)) * ROW_HEIGHT + ROW_HEIGHT / 2;
                  const bottomBranchY = (bottomSlotIdx - (slotsSpan / 4 - 0.5)) * ROW_HEIGHT + ROW_HEIGHT / 2;
                  const centerY = (topBranchY + bottomBranchY) / 2;

                  const nextTime = roundTimes[rIdx + 1]?.[Math.floor(mIdx / 2)] || '';
                  const timeKey = `r${rIdx + 1}_m${Math.floor(mIdx / 2)}`;
                  const displayTime = customTimes[timeKey] ?? nextTime;

                  const isLastRound = rIdx === totalRounds - 1;

                  return (
                    <g key={`round-${rIdx}-match-${mIdx}`}>
                      {/* Vertical bracket connector */}
                      <line 
                        x1={stepX} 
                        y1={topBranchY} 
                        x2={stepX} 
                        y2={bottomBranchY} 
                        stroke="#0f172a" 
                        strokeWidth="2" 
                      />

                      {/* Right horizontal advance line */}
                      <line 
                        x1={stepX} 
                        y1={centerY} 
                        x2={stepX + colWidth} 
                        y2={centerY} 
                        stroke="#0f172a" 
                        strokeWidth="2" 
                      />

                      {/* Match Time on next round line in RED */}
                      {!isLastRound && (mIdx % 2 === 1 || matchesInThisRound === 1) && displayTime && (
                        <foreignObject 
                          x={stepX + 6} 
                          y={centerY - 22} 
                          width={95} 
                          height={22}
                          className="pointer-events-auto"
                        >
                          <div className="flex items-center">
                            <input
                              type="text"
                              value={displayTime}
                              onChange={(e) => handleTimeChange(rIdx + 1, Math.floor(mIdx / 2), e.target.value)}
                              className="text-[11px] font-black text-red-600 tracking-tighter bg-transparent outline-none focus:bg-red-50 px-1 rounded w-full"
                              title="Click to edit round match time"
                            />
                          </div>
                        </foreignObject>
                      )}

                      {/* Final match time right on the championship line */}
                      {isLastRound && displayTime && (
                        <foreignObject 
                          x={stepX + 6} 
                          y={centerY - 22} 
                          width={95} 
                          height={22}
                          className="pointer-events-auto"
                        >
                          <div className="flex items-center">
                            <input
                              type="text"
                              value={displayTime}
                              onChange={(e) => handleTimeChange(rIdx + 1, 0, e.target.value)}
                              className="text-[11px] font-black text-red-600 tracking-tighter bg-transparent outline-none focus:bg-red-50 px-1 rounded w-full"
                              title="Click to edit final match time"
                            />
                          </div>
                        </foreignObject>
                      )}

                      {/* Grand Final Winner Marker */}
                      {isLastRound && (
                        <foreignObject 
                          x={stepX + colWidth + 8} 
                          y={centerY - 18} 
                          width={150} 
                          height={36}
                          className="pointer-events-auto"
                        >
                          <div className="bg-amber-100 border-2 border-amber-500 text-amber-950 px-3 py-1 rounded-xl text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                            <Trophy size={14} className="text-amber-600" />
                            <span>WINNER</span>
                          </div>
                        </foreignObject>
                      )}
                    </g>
                  );
                });
              })}
            </svg>
          </div>

          {/* Footer Notes on Sheet */}
          <div className="mt-12 pt-4 border-t border-slate-300 flex flex-col md:flex-row justify-between items-center text-[10px] font-black text-slate-500 uppercase tracking-widest gap-2">
            <span>Official Fixture Draw • CBSE & SGFI Standard Bye Allocation</span>
            <span>Generated via SmartPE Tournament Studio</span>
          </div>
        </div>
      </div>
    </div>

      {/* Interactive Print Preview Modal with A4/A3 page sizing and Word/WhatsApp exports */}
      <TournamentPrintPreviewModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        tournamentName={tournamentName}
        subTitle={subTitle}
        category={category}
        sport={sport}
        startDate={startDate}
        startTime={startTime}
        format="knockout"
        teamsList={teamsList}
        byesCount={byesCount}
        setupFormula={{
          totalTeams: N,
          powerOfTwo: P,
          byesCount: byesCount,
          upperHalfTeams: Nu,
          lowerHalfTeams: P - Nu,
          upperHalfByes: Math.floor(byesCount / 2),
          lowerHalfByes: Math.ceil(byesCount / 2),
          totalMatches: N - 1,
          totalRounds: Math.round(totalRounds)
        }}
      />
    </div>
  );
};

export default ClassicSheetBracket;
