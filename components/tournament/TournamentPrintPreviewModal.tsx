import React, { useState, useRef, useEffect } from 'react';
import { 
  X, Printer, Download, Share2, FileText, Check, Copy, 
  Sparkles, AlertCircle, Info, ChevronRight, Layers, Trophy, 
  Calendar, Clock, Shield, Maximize2, Minimize2, ZoomIn, ZoomOut,
  ChevronDown
} from 'lucide-react';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { toast } from '../../services/toast.ts';
import { trackEvent } from '../../services/analytics.ts';

export type PaperSize = 'A4' | 'A3';
export type Orientation = 'landscape' | 'portrait';

export interface TournamentPrintPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  tournamentName: string;
  subTitle?: string;
  category: string;
  sport: string;
  startDate: string;
  startTime: string;
  format: 'knockout' | 'roundrobin' | 'combination';
  teamsList: string[];
  rounds?: any[];
  matches?: any[];
  byesCount?: number;
  setupFormula?: {
    totalTeams: number;
    powerOfTwo: number;
    byesCount: number;
    upperHalfTeams: number;
    lowerHalfTeams: number;
    upperHalfByes: number;
    lowerHalfByes: number;
    totalMatches: number;
    totalRounds: number;
  };
}

export const TournamentPrintPreviewModal: React.FC<TournamentPrintPreviewModalProps> = ({
  isOpen,
  onClose,
  tournamentName,
  subTitle,
  category,
  sport,
  startDate,
  startTime,
  format,
  teamsList,
  rounds = [],
  matches = [],
  byesCount: initialByesCount,
  setupFormula
}) => {
  const printSheetRef = useRef<HTMLDivElement>(null);

  // Print Layout Preferences
  const numTeams = teamsList.length || 16;
  const recommendedPaper: PaperSize = numTeams > 16 ? 'A3' : 'A4';
  const [paperSize, setPaperSize] = useState<PaperSize>(recommendedPaper);
  const [orientation, setOrientation] = useState<Orientation>('landscape');
  const [previewTab, setPreviewTab] = useState<'bracket' | 'table' | 'byes'>('bracket');
  const [isExporting, setIsExporting] = useState(false);
  const [schoolName, setSchoolName] = useState("SHRADDHA CHILDREN'S ACADEMY");
  const [showWhatsAppDropdown, setShowWhatsAppDropdown] = useState(false);

  // Keep paper recommendation updated if teams change
  useEffect(() => {
    if (numTeams > 16) {
      setPaperSize('A3');
    } else {
      setPaperSize('A4');
    }
  }, [numTeams]);

  // Handle ESC key to dismiss modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Bracket Mathematics for Classic Lined Tree
  const N = teamsList.length || 16;
  const P = Math.max(4, Math.pow(2, Math.ceil(Math.log2(N || 4))));
  const totalRounds = Math.log2(P);
  const calcByesCount = initialByesCount ?? (P - N);
  const Nu = N % 2 === 0 ? N / 2 : (N + 1) / 2;

  // Compute CBSE Bye Allocation Slots
  const byeSlots = new Set<number>();
  let botLower = P - 1;
  let topUpper = 0;
  let topLower = P / 2;
  let botUpper = P / 2 - 1;

  for (let b = 0; b < calcByesCount; b++) {
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
  const slots: Array<{ slotIndex: number; teamName: string; isBye: boolean }> = [];
  let teamCursor = 0;
  for (let i = 0; i < P; i++) {
    const isBye = byeSlots.has(i) && calcByesCount > 0;
    const assignedTeam = teamsList[teamCursor] || `Team ${i + 1}`;
    if (teamCursor < teamsList.length) {
      teamCursor++;
    }
    slots.push({
      slotIndex: i,
      teamName: assignedTeam,
      isBye
    });
  }

  // Calculate standard match times
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

  const matchDuration = 45;
  const roundTimes: string[][] = [];
  let globalMatchIndex = 0;

  for (let r = 0; r < totalRounds; r++) {
    const matchesInRound = Math.pow(2, totalRounds - r - 1);
    const timesForThisRound: string[] = [];
    for (let m = 0; m < matchesInRound; m++) {
      timesForThisRound.push(addMinutes(startTime || '08:00', globalMatchIndex * matchDuration));
      globalMatchIndex++;
    }
    roundTimes.push(timesForThisRound);
  }

  // Layout sizing geometry
  const ROW_HEIGHT = P <= 8 ? 56 : P <= 16 ? 44 : 36;
  const SLOT_WIDTH = 250;
  const STEP_COL_WIDTH = 135;

  // Format date helper
  const formattedDate = (() => {
    try {
      if (!startDate) return new Date().toLocaleDateString('en-GB');
      const parts = startDate.split('-');
      if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
      return startDate;
    } catch {
      return startDate;
    }
  })();

  // Native Print with dynamic @page sizing injection
  const handlePrint = () => {
    const existingStyle = document.getElementById('dynamic-print-page-style');
    if (existingStyle) existingStyle.remove();

    const styleEl = document.createElement('style');
    styleEl.id = 'dynamic-print-page-style';
    styleEl.innerHTML = `
      @page {
        size: ${paperSize} ${orientation};
        margin: 8mm;
      }
      @media print {
        body * {
          visibility: hidden;
        }
        #tournament-print-area, #tournament-print-area * {
          visibility: visible;
        }
        #tournament-print-area {
          position: fixed;
          left: 0;
          top: 0;
          width: 100vw;
          height: 100vh;
          margin: 0;
          padding: 8mm;
          background: white !important;
          color: black !important;
          box-shadow: none !important;
          border: none !important;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
      }
    `;
    document.head.appendChild(styleEl);

    trackEvent('resource_downloaded', {
      resource_name: `Tournament Fixture Print (${sport})`,
      format: 'pdf',
      paperSize,
      orientation
    });

    window.print();
  };

  // Direct PDF Download (.pdf) via jsPDF
  const handleDownloadPdf = async () => {
    if (!printSheetRef.current) return;
    setIsExporting(true);
    toast.loading("Generating high-resolution PDF document...", { id: 'pdf-gen' });
    try {
      const dataUrl = await toPng(printSheetRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: '#ffffff'
      });

      const pdf = new jsPDF({
        orientation: orientation === 'portrait' ? 'portrait' : 'landscape',
        unit: 'mm',
        format: paperSize.toLowerCase()
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const margin = 8;
      const imgWidth = pdfWidth - margin * 2;
      const imgHeight = (printSheetRef.current.offsetHeight * imgWidth) / printSheetRef.current.offsetWidth;

      pdf.addImage(dataUrl, 'PNG', margin, margin, imgWidth, Math.min(imgHeight, pdfHeight - margin * 2));
      const cleanFileName = `${(tournamentName || 'Tournament').replace(/\s+/g, '_')}_Official_Fixture_${paperSize}.pdf`;
      pdf.save(cleanFileName);

      toast.dismiss('pdf-gen');
      toast.success(`Official ${paperSize} PDF file downloaded successfully!`);
      trackEvent('resource_downloaded', { resource_name: 'Tournament Fixture PDF', format: 'pdf' });
    } catch (err) {
      console.error(err);
      toast.dismiss('pdf-gen');
      toast.error("Failed to generate PDF. You can also use Print / Save PDF.");
    } finally {
      setIsExporting(false);
    }
  };

  // Export to Microsoft Word (.doc) with VISUAL BRACKET IMAGE embedded + complete match schedule table
  const handleExportWord = async () => {
    setIsExporting(true);
    toast.loading("Capturing bracket image & creating Word document...", { id: 'word-export' });
    try {
      const title = `${tournamentName || 'Tournament'} - ${category || ''} Fixtures`;
      const dateStr = formattedDate;

      // 1. Ensure bracket tab is active so bracket canvas is fully mounted
      if (previewTab !== 'bracket') {
        setPreviewTab('bracket');
        await new Promise(resolve => setTimeout(resolve, 150));
      }

      // 2. Identify bracket tree canvas or fallback to print sheet
      const bracketCanvas = document.getElementById('tournament-bracket-tree-canvas') || printSheetRef.current;
      if (!bracketCanvas) throw new Error("Bracket canvas element not found");

      const origW = bracketCanvas.offsetWidth || 1050;
      const origH = bracketCanvas.offsetHeight || (P * ROW_HEIGHT + 60);

      // 3. Determine paper size and landscape constraints
      const isA3 = paperSize === 'A3';
      const pageSizePtW = isA3 ? '1190.6pt' : '841.9pt';
      const pageSizePtH = isA3 ? '841.9pt' : '595.3pt';

      // Page 1 budget: Available printable height minus header (~45pt) and signatures (~28pt)
      const maxTargetW = isA3 ? 1130 : 785;
      const maxTargetH = isA3 ? 660 : 425;

      // Scale proportionally so the entire bracket fits within Page 1
      const scale = Math.min(maxTargetW / origW, maxTargetH / origH, 1);
      const renderWidthPt = Math.max(220, Math.round(origW * scale));
      const renderHeightPt = Math.max(160, Math.round(origH * scale));

      // 4. Capture visual bracket drawing as high-res PNG
      const imgDataUrl = await toPng(bracketCanvas, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: '#ffffff'
      });

      // 5. Build sequential matches table for Page 2
      let tableRows = '';
      if (matches && matches.length > 0) {
        tableRows = matches.map((m: any, idx: number) => `
          <tr style="text-align:center; background-color:${idx % 2 === 0 ? '#f8fafc' : '#ffffff'};">
            <td style="font-weight:bold; color:#0D2B52; padding:5px;">${m.name || `Match ${idx + 1}`}</td>
            <td style="padding:5px;">${m.roundName || 'Knockout Round'}</td>
            <td style="font-weight:bold; text-align:left; padding:5px 8px;">${m.team1 || 'TBD'}</td>
            <td style="font-weight:bold; color:#888888; padding:5px;">VS</td>
            <td style="font-weight:bold; text-align:left; padding:5px 8px;">${m.team2 || 'TBD'}</td>
            <td style="padding:5px;">${m.date || dateStr}</td>
            <td style="font-weight:bold; color:#b91c1c; padding:5px;">${m.time || startTime || 'TBD'}</td>
          </tr>
        `).join('');
      } else {
        let mCount = 1;
        for (let r = 0; r < totalRounds; r++) {
          const count = Math.pow(2, totalRounds - r - 1);
          const rName = r === totalRounds - 1 ? 'Championship Final' : r === totalRounds - 2 ? 'Semi-Final' : r === totalRounds - 3 ? 'Quarter-Final' : `Round ${r + 1}`;
          for (let m = 0; m < count; m++) {
            tableRows += `
              <tr style="text-align:center; background-color:${mCount % 2 === 0 ? '#f8fafc' : '#ffffff'};">
                <td style="font-weight:bold; color:#0D2B52; padding:5px;">Match ${mCount++}</td>
                <td style="padding:5px;">${rName}</td>
                <td style="font-weight:bold; text-align:left; padding:5px 8px;">${r === 0 ? (slots[m * 2]?.teamName || 'TBD') : 'Winner of Previous Round'}</td>
                <td style="font-weight:bold; color:#888; padding:5px;">VS</td>
                <td style="font-weight:bold; text-align:left; padding:5px 8px;">${r === 0 ? (slots[m * 2 + 1]?.teamName || 'TBD') : 'Winner of Previous Round'}</td>
                <td style="padding:5px;">${dateStr}</td>
                <td style="font-weight:bold; color:#b91c1c; padding:5px;">${roundTimes[r]?.[m] || startTime}</td>
              </tr>
            `;
          }
        }
      }

      // 6. Complete Word Document with MSO Landscape formatting
      const fullDoc = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head>
          <meta charset="utf-8">
          <title>${title}</title>
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
                ${schoolName || "DEPARTMENT OF PHYSICAL EDUCATION & SPORTS"}
              </h1>
              <div style="color:#64748b; font-size:7.5pt; font-weight:bold; text-transform:uppercase; margin:1pt 0;">
                OFFICIAL TOURNAMENT FIXTURE BRACKET TREE
              </div>
              <div style="color:#D4A017; font-size:10pt; font-weight:bold; text-transform:uppercase; margin:1pt 0;">
                ${title}
              </div>
              <div style="font-size:7.5pt; color:#475569; margin:1pt 0;">
                <strong>Sport:</strong> ${sport} &nbsp;|&nbsp; 
                <strong>Date:</strong> ${dateStr} &nbsp;|&nbsp; 
                <strong>Reporting Time:</strong> ${startTime} &nbsp;|&nbsp; 
                <strong>Total Teams:</strong> ${N} &nbsp;|&nbsp; 
                <strong>Upper Half:</strong> ${Nu} &nbsp;|&nbsp; 
                <strong>Lower Half:</strong> ${P - Nu} &nbsp;|&nbsp; 
                <strong>Byes:</strong> ${calcByesCount} &nbsp;|&nbsp; 
                <strong>Total Matches:</strong> ${N - 1} &nbsp;|&nbsp; 
                <strong>Rounds:</strong> ${totalRounds}
              </div>
            </div>

            <!-- Scaled Bracket Drawing (Strictly fits on Page 1 without clipping or spilling) -->
            <div style="text-align:center; margin:2pt 0; padding:0;">
              <img src="${imgDataUrl}" 
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
              <div style="text-align:center; margin-bottom:6pt;">
                <h2 style="color:#0D2B52; font-size:12.5pt; text-transform:uppercase; margin:0 0 2pt 0;">
                  ${schoolName}
                </h2>
                <div style="color:#64748b; font-size:7.5pt; font-weight:bold; text-transform:uppercase; margin:1pt 0;">
                  DEPARTMENT OF PHYSICAL EDUCATION & SPORTS
                </div>
                <div style="color:#D4A017; font-size:10.5pt; font-weight:bold; text-transform:uppercase; margin:1pt 0;">
                  Official Match Schedule & Timings — ${title}
                </div>
                <div style="font-size:7.5pt; color:#475569;">
                  <strong>Discipline:</strong> ${sport} &nbsp;|&nbsp; <strong>Date:</strong> ${dateStr} &nbsp;|&nbsp; <strong>Total Teams:</strong> ${N} &nbsp;|&nbsp; <strong>Total Matches:</strong> ${N - 1}
                </div>
              </div>

              <!-- CBSE Unit 1 Mathematical Calculations -->
              <div style="background-color:#f8fafc; padding:6pt 8pt; border:1px solid #cbd5e1; margin-bottom:8pt; font-size:7.5pt; line-height:1.4;">
                <strong>CBSE Physical Education Code 048 - Mathematical Summary:</strong> 
                Teams (N): <strong>${N}</strong> | Upper Half: <strong>${Nu}</strong> | Lower Half: <strong>${P - Nu}</strong> | Next Power of 2: <strong>${P}</strong> | Byes: <strong>${calcByesCount}</strong> (Upper: ${Math.floor(calcByesCount / 2)}, Lower: ${Math.ceil(calcByesCount / 2)}) | Matches: <strong>${N - 1}</strong> | Rounds: <strong>${totalRounds}</strong>
              </div>

              <!-- Match Schedule Table -->
              <table border="1" cellpadding="5" cellspacing="0" style="border-collapse:collapse; width:100%; font-size:8pt; font-family:Arial, sans-serif;">
                <tr style="background-color:#0D2B52; color:#ffffff; font-weight:bold; text-align:center;">
                  <th style="padding:4px; color:#ffffff;">Match #</th>
                  <th style="padding:4px; color:#ffffff;">Stage / Round</th>
                  <th style="padding:4px; color:#ffffff;">Team 1</th>
                  <th style="padding:4px; color:#ffffff;">VS</th>
                  <th style="padding:4px; color:#ffffff;">Team 2</th>
                  <th style="padding:4px; color:#ffffff;">Date</th>
                  <th style="padding:4px; color:#ffffff;">Scheduled Time</th>
                </tr>
                ${tableRows}
              </table>

              <!-- Page 2 Signatures -->
              <table style="width:100%; margin-top:20pt; font-size:7.5pt; text-align:center; border:none;">
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

      const blob = new Blob(['\ufeff', fullDoc], { type: 'application/msword' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(tournamentName || 'Tournament').replace(/\s+/g, '_')}_Official_Fixture_${paperSize}.doc`;
      a.click();
      URL.revokeObjectURL(url);

      toast.dismiss('word-export');
      toast.success(`Word document (.doc) exported successfully (${paperSize} 1-Page Bracket + Schedule)!`);
      trackEvent('resource_downloaded', { resource_name: 'Tournament Fixtures Word', format: 'doc' });
    } catch (err) {
      console.error(err);
      toast.dismiss('word-export');
      toast.error("Failed to export Word document.");
    } finally {
      setIsExporting(false);
    }
  };

  // WhatsApp Share with ACTUAL PDF File attachment support
  const handleWhatsAppSharePdf = async () => {
    setShowWhatsAppDropdown(false);
    if (!printSheetRef.current) return;
    setIsExporting(true);
    toast.loading("Generating PDF file for WhatsApp...", { id: 'wa-pdf' });
    try {
      const dataUrl = await toPng(printSheetRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: '#ffffff'
      });

      const pdf = new jsPDF({
        orientation: orientation === 'portrait' ? 'portrait' : 'landscape',
        unit: 'mm',
        format: paperSize.toLowerCase()
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const margin = 8;
      const imgWidth = pdfWidth - margin * 2;
      const imgHeight = (printSheetRef.current.offsetHeight * imgWidth) / printSheetRef.current.offsetWidth;
      pdf.addImage(dataUrl, 'PNG', margin, margin, imgWidth, Math.min(imgHeight, pdfHeight - margin * 2));

      const pdfBlob = pdf.output('blob');
      const filename = `${(tournamentName || 'Tournament').replace(/\s+/g, '_')}_Official_Fixture.pdf`;
      const pdfFile = new File([pdfBlob], filename, { type: 'application/pdf' });

      const captionMessage = 
`🏆 *OFFICIAL TOURNAMENT FIXTURES (PDF)*
🏫 *${schoolName}*
📌 *Event:* ${tournamentName} (${category})
⚽ *Sport:* ${sport} | 📅 *Date:* ${formattedDate}
⏰ *First Match:* ${startTime} | 👥 *Teams:* ${N}
🎯 *Byes:* ${calcByesCount} Teams
Official CBSE Physical Education Code 048 Tournament Sheet.`;

      // 1. Mobile Web Share API: Shares the actual PDF document file directly into WhatsApp!
      if (navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
        toast.dismiss('wa-pdf');
        await navigator.share({
          files: [pdfFile],
          title: `Tournament Fixture - ${tournamentName}`,
          text: captionMessage
        });
        toast.success("Shared PDF document via WhatsApp!");
        trackEvent('tool_used', { tool_name: 'Tournament WhatsApp PDF Share', category: format, sport, teamsCount: N });
        return;
      }

      // 2. Desktop Fallback: Downloads PDF to device and opens WhatsApp Web with the bulletin
      pdf.save(filename);
      toast.dismiss('wa-pdf');
      toast.success("Official PDF downloaded! Opening WhatsApp to attach file...");

      const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(
        captionMessage + '\n\n📄 _(Official Fixture PDF has been downloaded to your downloads folder. Please attach it now to send to this chat.)_'
      )}`;
      window.open(waUrl, '_blank');
      trackEvent('tool_used', { tool_name: 'Tournament WhatsApp PDF Share', category: format, sport, teamsCount: N });
    } catch (err) {
      console.error(err);
      toast.dismiss('wa-pdf');
      toast.error("Could not share PDF directly. Opening WhatsApp with text summary.");
      handleWhatsAppShareText();
    } finally {
      setIsExporting(false);
    }
  };

  // WhatsApp Share with ACTUAL PNG Image attachment
  const handleWhatsAppShareImage = async () => {
    setShowWhatsAppDropdown(false);
    if (!printSheetRef.current) return;
    setIsExporting(true);
    toast.loading("Generating bracket image for WhatsApp...", { id: 'wa-img' });
    try {
      const dataUrl = await toPng(printSheetRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: '#ffffff'
      });

      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const filename = `${(tournamentName || 'Tournament').replace(/\s+/g, '_')}_Fixture.png`;
      const imgFile = new File([blob], filename, { type: 'image/png' });

      const captionMessage = 
`🏆 *OFFICIAL TOURNAMENT FIXTURES BRACKET DRAW*
🏫 *${schoolName}*
📌 *Event:* ${tournamentName} (${category})
⚽ *Sport:* ${sport} | 📅 *Date:* ${formattedDate}
⏰ *First Match:* ${startTime} | 👥 *Teams:* ${N}
🎯 *Byes:* ${calcByesCount} Teams
Official CBSE Physical Education Code 048 Tournament Sheet.`;

      if (navigator.canShare && navigator.canShare({ files: [imgFile] })) {
        toast.dismiss('wa-img');
        await navigator.share({
          files: [imgFile],
          title: `Tournament Fixture Bracket - ${tournamentName}`,
          text: captionMessage
        });
        toast.success("Shared bracket image via WhatsApp!");
        return;
      }

      // Desktop fallback: Download image and open WhatsApp
      const link = document.createElement('a');
      link.download = filename;
      link.href = dataUrl;
      link.click();
      toast.dismiss('wa-img');
      toast.success("Bracket image downloaded! Opening WhatsApp...");

      const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(
        captionMessage + '\n\n🖼️ _(Bracket image downloaded to your device - attach it now to send)_'
      )}`;
      window.open(waUrl, '_blank');
    } catch (err) {
      console.error(err);
      toast.dismiss('wa-img');
      toast.error("Could not share image. Opening WhatsApp with text summary.");
      handleWhatsAppShareText();
    } finally {
      setIsExporting(false);
    }
  };

  // WhatsApp Quick Text Bulletin
  const handleWhatsAppShareText = () => {
    setShowWhatsAppDropdown(false);
    const title = `${tournamentName || 'Tournament'} (${category || 'General'})`;
    const dateStr = formattedDate;

    let schedulePreview = '';
    if (matches && matches.length > 0) {
      schedulePreview = matches.slice(0, 6).map((m: any, i: number) => 
        `• *${m.name || `Match ${i + 1}`}* (${m.time || startTime}): ${m.team1 || 'TBD'} vs ${m.team2 || 'TBD'}`
      ).join('\n');
      if (matches.length > 6) {
        schedulePreview += `\n• ... and ${matches.length - 6} more official matches.`;
      }
    }

    const message = 
`🏆 *OFFICIAL TOURNAMENT FIXTURES ANNOUNCEMENT*
🏫 *${schoolName}*
📌 *Event:* ${title}
⚽ *Sport:* ${sport} | 📅 *Date:* ${dateStr}
⏰ *First Match Time:* ${startTime}
👥 *Total Teams:* ${numTeams} Teams | *Format:* ${format.toUpperCase()}
🎯 *Byes:* ${calcByesCount} Teams

📋 *MATCH FIXTURES SCHEDULE:*
${schedulePreview}

📄 _Official CBSE PE Code 048 Tournament Sheet generated via SmartPE India._`;

    const encodedText = encodeURIComponent(message);
    const waUrl = `https://api.whatsapp.com/send?text=${encodedText}`;
    window.open(waUrl, '_blank');
    toast.success("Opening WhatsApp with tournament bulletin!");
  };

  // Download High-Resolution Image (.PNG)
  const handleDownloadImage = async () => {
    if (!printSheetRef.current) return;
    setIsExporting(true);
    try {
      const dataUrl = await toPng(printSheetRef.current, {
        cacheBust: true,
        pixelRatio: 2.5,
        backgroundColor: '#ffffff'
      });
      const link = document.createElement('a');
      link.download = `${(tournamentName || 'tournament').toLowerCase()}_${paperSize.toLowerCase()}_fixture.png`;
      link.href = dataUrl;
      link.click();
      toast.success(`Tournament Fixtures saved as ${paperSize} Image!`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate image. Please try Print / Save PDF instead.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-slate-900 border-2 border-slate-800 rounded-[2.5rem] shadow-2xl w-full max-w-6xl max-h-[94vh] flex flex-col overflow-hidden text-white">
        
        {/* Top Modal Header */}
        <div className="p-4 sm:p-6 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#08182D]">
          <div className="flex items-center justify-between gap-3 w-full md:w-auto">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#D4A017]/20 border border-[#D4A017]/40 text-[#D4A017] flex items-center justify-center font-black shrink-0">
                <Printer size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-black uppercase tracking-tight text-white">
                    Official Tournament Print Preview & Export Studio
                  </h3>
                  <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[9px] font-black uppercase bg-[#D4A017]/20 text-[#D4A017] border border-[#D4A017]/40">
                    CBSE Code 048 Ready
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-medium">
                  {tournamentName} • {category} • {numTeams} Teams • {sport}
                </p>
              </div>
            </div>

            {/* Quick close button on mobile */}
            <button
              onClick={onClose}
              className="md:hidden w-8 h-8 rounded-xl bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center shrink-0"
              title="Close modal"
            >
              <X size={16} />
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-end md:self-auto relative">
            {/* WhatsApp Share with PDF Attachment Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowWhatsAppDropdown(!showWhatsAppDropdown)}
                className="px-3.5 py-2 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-emerald-950/40 transition-all active:scale-95"
                title="Share official tournament PDF, Image or text to WhatsApp"
              >
                <Share2 size={14} />
                <span>Share WhatsApp</span>
                <ChevronDown size={13} />
              </button>

              {showWhatsAppDropdown && (
                <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-2 z-50 text-left space-y-1">
                  <button
                    onClick={handleWhatsAppSharePdf}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold hover:bg-white/10 flex items-center gap-2 text-emerald-400 transition-all"
                  >
                    <FileText size={15} />
                    <div>
                      <div className="font-black text-white">Share PDF Document</div>
                      <div className="text-[10px] text-slate-400">Sends actual .pdf file directly</div>
                    </div>
                  </button>

                  <button
                    onClick={handleWhatsAppShareImage}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold hover:bg-white/10 flex items-center gap-2 text-[#D4A017] transition-all"
                  >
                    <Download size={15} />
                    <div>
                      <div className="font-black text-white">Share Bracket Image</div>
                      <div className="text-[10px] text-slate-400">Sends high-res tree PNG</div>
                    </div>
                  </button>

                  <button
                    onClick={handleWhatsAppShareText}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold hover:bg-white/10 flex items-center gap-2 text-slate-300 transition-all"
                  >
                    <Copy size={15} />
                    <div>
                      <div className="font-black text-white">Share Match Bulletin</div>
                      <div className="text-[10px] text-slate-400">Quick text schedule message</div>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* Word Export Button (With Bracket Image Embedded!) */}
            <button
              onClick={handleExportWord}
              disabled={isExporting}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all active:scale-95 shadow-md disabled:opacity-50"
              title="Download editable Microsoft Word document (.doc) with bracket image and match table"
            >
              <FileText size={14} />
              <span>Export Word (.doc)</span>
            </button>

            {/* Direct PDF Download */}
            <button
              onClick={handleDownloadPdf}
              disabled={isExporting}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all active:scale-95 shadow-md disabled:opacity-50"
              title="Download direct PDF document (.pdf)"
            >
              <Download size={14} />
              <span>Download PDF</span>
            </button>

            {/* Native Print Dialog */}
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-[#D4A017] hover:bg-[#b88b14] text-[#0D2B52] rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all active:scale-95 shadow-md"
            >
              <Printer size={15} />
              <span>Print</span>
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-all"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Configuration Toolbar */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs">
          {/* Paper Size & Recommendations */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Paper Format:</span>
            
            <button
              onClick={() => setPaperSize('A4')}
              className={`px-3 py-1.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 border ${
                paperSize === 'A4'
                  ? 'bg-[#164077] border-[#D4A017] text-white shadow'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <span>A4 Sheet</span>
              <span className="text-[9px] text-[#D4A017] font-bold">(&le; 16 Teams)</span>
            </button>

            <button
              onClick={() => setPaperSize('A3')}
              className={`px-3 py-1.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 border ${
                paperSize === 'A3'
                  ? 'bg-[#164077] border-[#D4A017] text-white shadow'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <span>A3 Sheet</span>
              <span className="text-[9px] text-emerald-400 font-bold">(17-32 Teams)</span>
            </button>

            {/* Orientation */}
            <div className="h-4 w-[1px] bg-slate-800 mx-1 hidden sm:block"></div>
            
            <button
              onClick={() => setOrientation('landscape')}
              className={`px-3 py-1.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all ${
                orientation === 'landscape'
                  ? 'bg-slate-800 text-white border border-slate-700'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Landscape (Best for Bracket Tree)
            </button>

            <button
              onClick={() => setOrientation('portrait')}
              className={`px-3 py-1.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all ${
                orientation === 'portrait'
                  ? 'bg-slate-800 text-white border border-slate-700'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Portrait (Best for Table)
            </button>
          </div>

          {/* View Tab & Image Download */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPreviewTab('bracket')}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs uppercase transition-all ${
                previewTab === 'bracket' ? 'bg-[#0D2B52] text-[#D4A017] border border-[#D4A017]/40' : 'text-slate-400 hover:text-white'
              }`}
            >
              Lined Bracket Tree
            </button>
            <button
              onClick={() => setPreviewTab('table')}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs uppercase transition-all ${
                previewTab === 'table' ? 'bg-[#0D2B52] text-[#D4A017] border border-[#D4A017]/40' : 'text-slate-400 hover:text-white'
              }`}
            >
              Match Schedule
            </button>
            <button
              onClick={() => setPreviewTab('byes')}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs uppercase transition-all ${
                previewTab === 'byes' ? 'bg-[#0D2B52] text-[#D4A017] border border-[#D4A017]/40' : 'text-slate-400 hover:text-white'
              }`}
            >
              CBSE Formulas
            </button>

            <div className="h-4 w-[1px] bg-slate-800 mx-1"></div>

            <button
              onClick={handleDownloadImage}
              disabled={isExporting}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
              title="Save current preview as high-resolution PNG image"
            >
              <Download size={13} />
              <span>PNG Image</span>
            </button>
          </div>
        </div>

        {/* Paper Sizing Recommendation Banner */}
        <div className="px-6 py-2.5 bg-[#0D2B52]/40 border-b border-slate-800 text-xs flex items-center justify-between text-slate-300">
          <div className="flex items-center gap-2">
            <Info size={14} className="text-[#D4A017] shrink-0" />
            {numTeams > 16 ? (
              <span>
                <strong className="text-amber-300">{numTeams} Teams Detected:</strong> We recommend <strong className="text-white">A3 Landscape</strong> paper. A3 provides double the width so 5 rounds, match numbers, and timings print with zero crowding.
              </span>
            ) : (
              <span>
                <strong className="text-emerald-400">{numTeams} Teams Detected:</strong> Standard <strong className="text-white">A4 Landscape</strong> fits this fixture cleanly on a single page for sports notice boards.
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span className="text-[10px] font-black uppercase text-slate-400">Target Paper:</span>
            <span className="px-2 py-0.5 rounded bg-slate-800 text-[#D4A017] font-black text-[10px]">
              {paperSize} {orientation.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Printable Preview Canvas (Scrollable viewport) */}
        <div className="flex-1 overflow-auto p-4 sm:p-8 bg-slate-950 flex justify-center">
          <div 
            id="tournament-print-area"
            ref={printSheetRef}
            className={`bg-white text-slate-900 rounded-2xl shadow-2xl p-6 sm:p-10 transition-all ${
              paperSize === 'A3' ? 'min-w-[1100px] max-w-[1300px]' : 'min-w-[850px] max-w-[1050px]'
            } bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:32px_24px]`}
            style={{
              fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
            }}
          >
            {/* Official School Header */}
            <div className="text-center border-b-2 border-slate-900 pb-4 mb-6 bg-white/90 p-4 rounded-xl">
              <input
                type="text"
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                className="w-full text-center text-xl sm:text-2xl font-black uppercase tracking-tight text-[#0D2B52] bg-transparent outline-none focus:bg-slate-50"
                title="Click to edit school or academy name"
              />
              <div className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 mt-1">
                DEPARTMENT OF PHYSICAL EDUCATION & SPORTS • OFFICIAL TOURNAMENT FIXTURE
              </div>
              <div className="text-base sm:text-lg font-black text-slate-900 uppercase mt-2 tracking-tight">
                {tournamentName || 'Annual Sports Championship'}
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3 text-xs font-bold text-slate-600 mt-1">
                <span className="text-[#0D2B52] font-black uppercase">Category: {category || 'Open'}</span>
                <span>•</span>
                <span>Sport: {sport}</span>
                <span>•</span>
                <span>Date: {formattedDate}</span>
                <span>•</span>
                <span>Reporting Time: {startTime}</span>
                <span>•</span>
                <span className="text-emerald-700 font-black">Total Teams: {numTeams}</span>
                <span>•</span>
                <span className="text-rose-600 font-black">Byes: {calcByesCount}</span>
              </div>
            </div>

            {/* PREVIEW CONTENT BASED ON TAB */}
            {previewTab === 'bracket' && (
              <div className="space-y-6">
                {/* Visual Lined Bracket Tree Drawing (Connecting Teams & Red Times) */}
                <div id="tournament-bracket-tree-canvas" className="bg-white p-6 rounded-2xl border-2 border-slate-300 shadow-sm relative overflow-x-auto">
                  <div className="relative w-full" style={{ height: `${P * ROW_HEIGHT + 30}px`, minWidth: `${SLOT_WIDTH + totalRounds * STEP_COL_WIDTH + 80}px` }}>
                    {/* 1. Team Slot Lines */}
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
                          {/* Team Name Label and Match Time */}
                          <div className="flex items-center justify-between pr-2 mb-0.5">
                            <span className="text-xs font-black uppercase text-slate-900 tracking-tight truncate w-[170px]">
                              {slot.teamName}
                            </span>

                            {/* Show Match Time on the second team of each pair in RED font */}
                            {!isEvenPair && matchTime && !slot.isBye && (
                              <span className="text-[11px] font-black text-red-600 tracking-tighter">
                                {matchTime}
                              </span>
                            )}

                            {slot.isBye && (
                              <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest px-1">
                                (BYE)
                              </span>
                            )}
                          </div>

                          {/* Solid horizontal black line */}
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
                          const slotsSpan = Math.pow(2, rIdx + 1);
                          const topSlotIdx = mIdx * slotsSpan;
                          const bottomSlotIdx = topSlotIdx + slotsSpan - 1;

                          const topBranchY = (topSlotIdx + (slotsSpan / 4 - 0.5)) * ROW_HEIGHT + ROW_HEIGHT / 2;
                          const bottomBranchY = (bottomSlotIdx - (slotsSpan / 4 - 0.5)) * ROW_HEIGHT + ROW_HEIGHT / 2;
                          const centerY = (topBranchY + bottomBranchY) / 2;

                          const nextTime = roundTimes[rIdx + 1]?.[Math.floor(mIdx / 2)] || '';
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

                              {/* Match Time in RED on advance line */}
                              {!isLastRound && (mIdx % 2 === 1 || matchesInThisRound === 1) && nextTime && (
                                <text
                                  x={stepX + 6}
                                  y={centerY - 6}
                                  fill="#dc2626"
                                  fontSize="11"
                                  fontWeight="900"
                                  fontFamily="sans-serif"
                                >
                                  {nextTime}
                                </text>
                              )}

                              {/* Final match time */}
                              {isLastRound && nextTime && (
                                <text
                                  x={stepX + 6}
                                  y={centerY - 6}
                                  fill="#dc2626"
                                  fontSize="11"
                                  fontWeight="900"
                                  fontFamily="sans-serif"
                                >
                                  {nextTime}
                                </text>
                              )}

                              {/* Winner box on championship final */}
                              {isLastRound && (
                                <g transform={`translate(${stepX + colWidth + 8}, ${centerY - 14})`}>
                                  <rect
                                    width="100"
                                    height="28"
                                    rx="8"
                                    fill="#fef3c7"
                                    stroke="#f59e0b"
                                    strokeWidth="2"
                                  />
                                  <text
                                    x="50"
                                    y="18"
                                    fill="#78350f"
                                    fontSize="10"
                                    fontWeight="900"
                                    textAnchor="middle"
                                    fontFamily="sans-serif"
                                  >
                                    WINNER
                                  </text>
                                </g>
                              )}
                            </g>
                          );
                        });
                      })}
                    </svg>
                  </div>
                </div>
              </div>
            )}

            {previewTab === 'table' && (
              <div className="space-y-4 bg-white p-6 rounded-2xl border border-slate-200">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b-2 border-slate-900 bg-slate-100 text-[10px] font-black uppercase text-slate-600">
                        <th className="p-2.5">Match #</th>
                        <th className="p-2.5">Stage / Round</th>
                        <th className="p-2.5">Team 1</th>
                        <th className="p-2.5 text-center">VS</th>
                        <th className="p-2.5">Team 2</th>
                        <th className="p-2.5">Date</th>
                        <th className="p-2.5">Match Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 font-semibold text-slate-800">
                      {matches && matches.length > 0 ? (
                        matches.map((m: any, idx: number) => (
                          <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
                            <td className="p-2.5 font-black text-[#0D2B52]">{m.name || `Match ${idx + 1}`}</td>
                            <td className="p-2.5">{m.roundName || 'Knockout Round'}</td>
                            <td className="p-2.5 font-bold uppercase text-slate-900">{m.team1 || 'TBD'}</td>
                            <td className="p-2.5 text-center text-slate-400 font-black text-[10px]">VS</td>
                            <td className="p-2.5 font-bold uppercase text-slate-900">{m.team2 || 'TBD'}</td>
                            <td className="p-2.5 text-slate-600">{m.date || formattedDate}</td>
                            <td className="p-2.5 font-black text-red-600">{m.time || startTime || 'TBD'}</td>
                          </tr>
                        ))
                      ) : (
                        Array.from({ length: totalRounds }).flatMap((_, r) => {
                          const count = Math.pow(2, totalRounds - r - 1);
                          const rName = r === totalRounds - 1 ? 'Championship Final' : r === totalRounds - 2 ? 'Semi-Final' : r === totalRounds - 3 ? 'Quarter-Final' : `Round ${r + 1}`;
                          return Array.from({ length: count }).map((__, m) => ({
                            name: `Match`,
                            roundName: rName,
                            team1: r === 0 ? (slots[m * 2]?.teamName || 'TBD') : 'Winner of Previous Round',
                            team2: r === 0 ? (slots[m * 2 + 1]?.teamName || 'TBD') : 'Winner of Previous Round',
                            time: roundTimes[r]?.[m] || startTime
                          }));
                        }).map((m: any, idx: number) => (
                          <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
                            <td className="p-2.5 font-black text-[#0D2B52]">Match {idx + 1}</td>
                            <td className="p-2.5">{m.roundName}</td>
                            <td className="p-2.5 font-bold uppercase text-slate-900">{m.team1}</td>
                            <td className="p-2.5 text-center text-slate-400 font-black text-[10px]">VS</td>
                            <td className="p-2.5 font-bold uppercase text-slate-900">{m.team2}</td>
                            <td className="p-2.5 text-slate-600">{formattedDate}</td>
                            <td className="p-2.5 font-black text-red-600">{m.time}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {previewTab === 'byes' && (
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
                  <h4 className="font-black text-base uppercase text-[#0D2B52] tracking-tight">
                    CBSE PE Code 048 - Mathematical Fixture Formulas
                  </h4>

                  <div className="space-y-3 text-xs text-slate-700">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <strong>1. Division into Upper and Lower Halves:</strong><br />
                      • For N = {N}: Upper Half Nu = <strong>{Nu} Teams</strong> | Lower Half Nl = <strong>{P - Nu} Teams</strong>.<br />
                      • (If N is odd, Upper Half Nu = (N + 1) / 2 and Lower Half Nl = (N - 1) / 2).
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <strong>2. Allocation of Byes (Nb = Power of 2 - N):</strong><br />
                      • Next power of 2 &ge; {N} is <strong>{P}</strong>.<br />
                      • Number of Byes: {P} - {N} = <strong>{calcByesCount} Byes</strong>.<br />
                      • Upper Half Byes: <strong>{Math.floor(calcByesCount / 2)}</strong> | Lower Half Byes: <strong>{Math.ceil(calcByesCount / 2)}</strong>.<br />
                      • <em>CBSE Rule:</em> 1st Bye &rarr; Bottom of Lower Half, 2nd Bye &rarr; Top of Upper Half, 3rd Bye &rarr; Top of Lower Half, 4th Bye &rarr; Bottom of Upper Half.
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <strong>3. Matches & Rounds:</strong><br />
                      • Total Matches = N - 1 = {N} - 1 = <strong>{N - 1} Matches</strong>.<br />
                      • Total Rounds = log2({P}) = <strong>{totalRounds} Rounds</strong>.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Official Sign-Off Block */}
            <div className="mt-12 pt-8 border-t-2 border-slate-900 grid grid-cols-3 gap-6 text-center text-xs bg-white/90 p-4 rounded-xl">
              <div>
                <div className="h-10 border-b border-dashed border-slate-300 mb-2"></div>
                <div className="font-black text-slate-900 uppercase">PE Teacher / In-Charge</div>
                <div className="text-[10px] text-slate-400">Department of PE</div>
              </div>
              <div>
                <div className="h-10 border-b border-dashed border-slate-300 mb-2"></div>
                <div className="font-black text-slate-900 uppercase">Sports Coordinator / HOD</div>
                <div className="text-[10px] text-slate-400">Organizing Committee</div>
              </div>
              <div>
                <div className="h-10 border-b border-dashed border-slate-300 mb-2"></div>
                <div className="font-black text-slate-900 uppercase">Principal / Headmaster</div>
                <div className="text-[10px] text-slate-400">Approval Seal</div>
              </div>
            </div>

            {/* Bottom Footer Tag */}
            <div className="mt-6 pt-3 border-t border-slate-200 flex justify-between items-center text-[9px] font-bold text-slate-400 uppercase tracking-widest bg-white/90 px-4 py-2 rounded-lg">
              <span>SmartPE India Official Tournament Studio</span>
              <span>CBSE Physical Education Class 11 & 12 (Subject Code 048)</span>
              <span>Generated on {new Date().toLocaleDateString('en-GB')}</span>
            </div>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 bg-[#08182D] border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <Sparkles size={14} className="text-[#D4A017]" />
            <span>Word export includes the visual bracket tree picture + complete schedule table.</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportWord}
              disabled={isExporting}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md active:scale-95 disabled:opacity-50"
            >
              <FileText size={14} />
              <span>Word (.doc + Image)</span>
            </button>

            <button
              onClick={handleDownloadPdf}
              disabled={isExporting}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md active:scale-95 disabled:opacity-50"
            >
              <Download size={14} />
              <span>Download PDF</span>
            </button>

            <button
              onClick={handleWhatsAppSharePdf}
              disabled={isExporting}
              className="px-4 py-2 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md transition-all active:scale-95 disabled:opacity-50"
            >
              <Share2 size={14} />
              <span>WhatsApp PDF</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-5 py-2 bg-[#D4A017] hover:bg-[#b88b14] text-[#0D2B52] rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-amber-950/40"
            >
              <Printer size={15} />
              <span>Print {paperSize} Fixture</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default TournamentPrintPreviewModal;
