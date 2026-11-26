import React, { useRef, useState, useMemo } from 'react';
import {
  Download, Printer, Sparkles, Edit3, Check, RefreshCw,
  Image as ImageIcon, Grid, LayoutTemplate, Trophy, Share2, FileText
} from 'lucide-react';
import TournamentPrintPreviewModal from './TournamentPrintPreviewModal.tsx';
import { toPng } from 'html-to-image';
import { toast } from '../../services/toast.ts';
import { trackEvent } from '../../services/analytics.ts';
import { safeOpenExternal, downloadBlobFile } from '../../utils/safeBrowser.ts';
import {
  EliminationType,
  TournamentPdfConfig,
  UnifiedMatch,
  buildSeededKnockoutDraw,
  exportTournamentToCsv
} from './tournamentDrawEngine.ts';
import { buildTournamentVectorPdf } from './TournamentVectorPdf.ts';

export interface ClassicSlot {
  slotIndex: number;
  seed: number;
  teamName: string;
  isBye: boolean;
  byeLabel?: string;
}

interface ClassicSheetBracketProps {
  sport?: string;
  tournamentName: string;
  subTitle: string;
  category: string;
  venue?: string;
  startDate: string;
  teamsList: string[];
  firstHalf: number;
  secondHalf: number;
  halfTime: number;
  restGap: number;
  startTime: string;
  courtsCount?: number;
  eliminationType?: EliminationType;
  thirdPlaceEnabled?: boolean;
  showGridLines?: boolean;
}

export const ClassicSheetBracket: React.FC<ClassicSheetBracketProps> = ({
  sport = 'FOOTBALL',
  tournamentName,
  subTitle,
  category,
  venue = 'School Main Sports Ground',
  startDate,
  teamsList,
  firstHalf,
  secondHalf,
  halfTime,
  restGap,
  startTime,
  courtsCount = 2,
  eliminationType = 'single',
  thirdPlaceEnabled = true,
  showGridLines: initialShowGrid = true
}) => {
  const sheetRef = useRef<HTMLDivElement>(null);
  const captureRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [showGrid, setShowGrid] = useState(initialShowGrid);
  const [customTitle, setCustomTitle] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [customTimes, setCustomTimes] = useState<Record<string, { time?: string }>>({});
  const [customTeamNames, setCustomTeamNames] = useState<Record<number, string>>({});
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  const N = teamsList.length;
  const P = Math.min(64, Math.max(4, Math.pow(2, Math.ceil(Math.log2(N || 4)))));
  const totalRounds = Math.log2(P);
  const byesCount = Math.max(0, P - N);
  const Nu = N % 2 === 0 ? N / 2 : (N + 1) / 2;

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

  // Apply inline team name edits mapped cleanly back to seed order
  const effectiveTeamsList = useMemo(() => {
    return Array.from({ length: N }, (_, idx) => {
      const seedNum = idx + 1;
      return customTeamNames[seedNum] ?? teamsList[idx] ?? `Team ${seedNum}`;
    });
  }, [N, teamsList, customTeamNames]);

  const pdfConfig: TournamentPdfConfig = useMemo(
    () => ({
      organizationName: (() => {
        try {
          return localStorage.getItem('smartpe_school_name') || "SHRADDHA CHILDREN'S ACADEMY";
        } catch {
          return "SHRADDHA CHILDREN'S ACADEMY";
        }
      })(),
      tournamentName,
      subTitle,
      sport,
      category,
      venue,
      startDate,
      startTime,
      format: 'knockout',
      eliminationType,
      paperSize: 'A4',
      viewMode: 'full-bracket',
      teamsList: effectiveTeamsList,
      courtsCount,
      matchDurationMins: (firstHalf || 15) + (secondHalf || 15) + (halfTime || 5),
      restGapMins: restGap || 10,
      thirdPlaceEnabled,
      matchTimeOverrides: customTimes
    }),
    [
      tournamentName,
      subTitle,
      sport,
      category,
      venue,
      startDate,
      startTime,
      eliminationType,
      effectiveTeamsList,
      courtsCount,
      firstHalf,
      secondHalf,
      halfTime,
      restGap,
      thirdPlaceEnabled,
      customTimes
    ]
  );

  // Unified Draw Engine: Guarantees identical pairings & timings across Classic Sheet, Cards, Table & PDF!
  const drawTree = useMemo(() => buildSeededKnockoutDraw(pdfConfig), [pdfConfig]);

  const slots: ClassicSlot[] = useMemo(
    () =>
      drawTree.slots.map((s) => ({
        slotIndex: s.slotIndex,
        seed: s.seed,
        teamName: s.teamName,
        isBye: s.isBye,
        byeLabel: 'BYE'
      })),
    [drawTree.slots]
  );

  const handleWhatsAppShare = () => {
    const text =
`🏆 *OFFICIAL TOURNAMENT FIXTURE DRAW*
📌 *Tournament:* ${tournamentName} (${category})
⚽ *Sport:* ${sport} | 📍 *Venue:* ${venue}
📅 *Date:* ${startDate} | 👥 *Teams:* ${teamsList.length} | 🎯 *Byes:* ${byesCount}
⏰ *First Match:* ${startTime}

Official CBSE / Federation Standard Draw.
Generated via SmartPE India (smartpeindia.app).`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    safeOpenExternal(url, "Opening WhatsApp with tournament bracket draw!");
  };

  const handleTimeChange = (matchCode: string, value: string) => {
    setCustomTimes((prev) => ({
      ...prev,
      [matchCode]: { time: value }
    }));
  };

  const handleTeamNameChange = (seed: number, value: string) => {
    setCustomTeamNames((prev) => ({
      ...prev,
      [seed]: value
    }));
  };

  const handleLoad16TeamSample = () => {
    const teams: Record<number, string> = {};
    for (let i = 1; i <= 16; i++) {
      teams[i] = `Team ${i}`;
    }
    setCustomTeamNames(teams);
    setCustomTimes({});
    setCustomTitle(`FOOTBALL U - 11 [${formattedDateTag || '29.08.2026'}]`);
    toast.success("Loaded 16-Team seeded sample draw with synchronized match timings!");
  };

  // Download as Image (.PNG) using dedicated off-screen 1200px capture container so mobile never clips
  const handleDownloadImage = async () => {
    const targetNode = captureRef.current || sheetRef.current;
    if (!targetNode) return;
    setIsExporting(true);
    try {
      const dataUrl = await toPng(targetNode, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
        width: 1200
      });
      const link = document.createElement('a');
      const cleanFileName = `${(sport || 'Tournament').toLowerCase()}_fixture_bracket_${formattedDateTag || 'sheet'}.png`.replace(/[^a-z0-9_.]/gi, '_');
      link.download = cleanFileName;
      link.href = dataUrl;
      link.click();
      toast.success("Tournament Fixture PNG downloaded cleanly!");
      trackEvent('resource_downloaded', { resource_name: `Fixture Bracket (${sport})`, format: 'png', teamsCount: N });
    } catch (err) {
      console.error("Failed to export image:", err);
      toast.error("Failed to export bracket image. Please try Vector PDF instead.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportCsv = () => {
    setIsExporting(true);
    try {
      const csv = exportTournamentToCsv(pdfConfig);
      const blob = new Blob(['\ufeff', csv], { type: 'text/csv;charset=utf-8;' });
      downloadBlobFile(blob, `${(tournamentName || 'Tournament').replace(/\s+/g, '_')}_Knockout_Fixtures.csv`);
      toast.success('CSV fixture sheet downloaded!');
      trackEvent('resource_downloaded', { resource_name: `Knockout CSV (${sport})`, format: 'csv', teamsCount: N });
    } finally {
      setIsExporting(false);
    }
  };

  // Export to Word (.doc) with VISUAL BRACKET IMAGE embedded from off-screen 1200px container
  const handleExportWordWithImage = async () => {
    const targetNode = captureRef.current || sheetRef.current;
    if (!targetNode) return;
    setIsExporting(true);
    toast.loading("Generating Word document with bracket image...", { id: 'classic-word' });
    try {
      const dataUrl = await toPng(targetNode, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
        width: 1200
      });

      // Construct matches table directly from unified drawTree so pairings & timings match 100%
      const tableRows = drawTree.allPlayableMatches
        .map(
          (m: UnifiedMatch, idx: number) => `
          <tr style="text-align:center; background-color:${idx % 2 === 1 ? '#f8fafc' : '#ffffff'};">
            <td style="font-weight:bold; color:#0D2B52; padding:6px;">${m.matchCode}</td>
            <td style="padding:6px;">${m.stage}</td>
            <td style="font-weight:bold; text-align:left; padding:6px 10px;">${m.team1}</td>
            <td style="color:#888; font-weight:bold; padding:6px;">VS</td>
            <td style="font-weight:bold; text-align:left; padding:6px 10px;">${m.team2}</td>
            <td style="padding:6px;">${m.date} • ${m.court}</td>
            <td style="font-weight:bold; color:#b91c1c; padding:6px;">${m.time}</td>
          </tr>
        `
        )
        .join('');

      // 1. Calculate dynamic image scale to fit strictly on Page 1 (Landscape)
      const origW = 1200;
      const origH = targetNode.offsetHeight || (P * ROW_HEIGHT + 160);

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
      downloadBlobFile(blob, `${(tournamentName || 'Tournament').replace(/\s+/g, '_')}_Official_Fixture_${isA3 ? 'A3' : 'A4'}.doc`);
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

  // Pure Vector PDF Download (.pdf) via TournamentVectorPdf (Zero DOM screenshots!)
  const handleDownloadPdf = async () => {
    setIsExporting(true);
    toast.loading("Generating pure vector multi-page PDF...", { id: 'classic-pdf' });
    try {
      const { doc, fileName, pageCount } = buildTournamentVectorPdf(pdfConfig);
      doc.save(fileName);
      toast.dismiss('classic-pdf');
      toast.success(`Official ${pageCount}-page Vector PDF downloaded!`);
      trackEvent('resource_downloaded', { resource_name: `Vector Bracket PDF (${sport})`, format: 'pdf', pageCount });
    } catch (err) {
      console.error(err);
      toast.dismiss('classic-pdf');
      toast.error("Failed to generate Vector PDF. Try opening Print Preview.");
    } finally {
      setIsExporting(false);
    }
  };

  // WhatsApp Share with ACTUAL Vector PDF Document Attachment
  const handleWhatsAppSharePdf = async () => {
    setIsExporting(true);
    toast.loading("Preparing official Vector PDF for WhatsApp...", { id: 'classic-wa' });
    try {
      const { doc, fileName, pageCount } = buildTournamentVectorPdf(pdfConfig);
      const pdfBlob = doc.output('blob');
      const pdfFile = new File([pdfBlob], fileName, { type: 'application/pdf' });

      const captionText = 
`🏆 *OFFICIAL TOURNAMENT FIXTURE BRACKET (${pageCount} Pages)*
📌 *Tournament:* ${tournamentName} (${category})
⚽ *Sport:* ${sport} | 📍 *Venue:* ${venue}
📅 *Date:* ${formattedDateTag || startDate} | ⏰ *Start:* ${startTime}
👥 *Teams:* ${N} Teams | 🎯 *Byes:* ${byesCount} Byes
Official CBSE / Federation standard draw.`;

      if (navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
        toast.dismiss('classic-wa');
        await navigator.share({
          files: [pdfFile],
          title: `Tournament Fixture - ${tournamentName}`,
          text: captionText
        });
        toast.success("Shared Vector PDF via WhatsApp!");
        return;
      }

      doc.save(fileName);
      toast.dismiss('classic-wa');
      toast.success("Vector PDF saved! Opening WhatsApp to attach file...");

      const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(
        captionText + '\n\n📄 _(Official Fixture PDF has been downloaded - please attach it to send)_'
      )}`;
      safeOpenExternal(waUrl);
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
    setIsPrintModalOpen(true);
  };

  // Geometry configuration
  const ROW_HEIGHT = P <= 8 ? 58 : P <= 16 ? 46 : 36;
  const TOTAL_HEIGHT = P * ROW_HEIGHT + 140;
  const SLOT_WIDTH = 260;
  const STEP_COL_WIDTH = 135;

  const renderBracketContent = (isStaticCapture: boolean) => (
    <>
      {/* Header Title (Responsive wrap so right-edge badge never clips) */}
      <div className="mb-6 border-b-2 border-slate-200 pb-4 flex flex-col sm:flex-row flex-wrap justify-between items-start gap-3">
        <div className="min-w-0 flex-1">
          {!isStaticCapture && isEditingTitle ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={customTitle || displayTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="e.g. FOOTBALL U - 11 [29.08.2026]"
                className="text-lg md:text-2xl font-black text-red-600 border-2 border-red-400 p-2 rounded-xl outline-none w-full max-w-md"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setIsEditingTitle(false)}
                className="p-2 bg-emerald-600 text-white rounded-xl text-xs font-bold min-h-[40px] min-w-[40px] flex items-center justify-center"
              >
                <Check size={16} />
              </button>
            </div>
          ) : (
            <div className="group flex items-center gap-2.5 flex-wrap">
              <h1 className="text-lg sm:text-xl md:text-3xl font-black tracking-tight text-red-600 uppercase font-sans break-words">
                {displayTitle}
              </h1>
              {!isStaticCapture && (
                <button
                  type="button"
                  onClick={() => setIsEditingTitle(true)}
                  className="opacity-70 sm:opacity-0 group-hover:opacity-100 text-slate-400 hover:text-slate-700 p-1.5 transition-all"
                  title="Click to edit title directly"
                >
                  <Edit3 size={14} />
                </button>
              )}
            </div>
          )}

          {(tournamentName || subTitle) && (
            <p className="text-xs font-black text-slate-600 uppercase tracking-widest mt-1 break-words">
              {tournamentName} {subTitle ? `• ${subTitle}` : ''}
            </p>
          )}
        </div>

        <div className="sm:text-right text-[10px] font-black uppercase tracking-wider text-slate-500 shrink-0 max-w-full">
          <span className="text-indigo-600 font-bold block">Knockout Tournament Draw</span>
          <div className="text-slate-900 font-black whitespace-nowrap">
            {N} Teams • {P} Bracket Lines ({byesCount} Byes)
          </div>
        </div>
      </div>

      {/* SVG Tree Bracket Engine */}
      <div className="relative w-full" style={{ height: `${P * ROW_HEIGHT}px` }}>
        {/* 1. First Round Team Slot Lines */}
        {slots.map((slot, sIdx) => {
          const isEvenPair = sIdx % 2 === 0;
          const matchIdxInR1 = Math.floor(sIdx / 2);
          const r1Match = drawTree.rounds[0]?.matches[matchIdxInR1];
          const matchTime = r1Match && !r1Match.isBye ? r1Match.time : '';

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
                {isStaticCapture ? (
                  <span className="text-xs font-black uppercase text-slate-900 tracking-tight px-1 truncate max-w-[175px]">
                    {!slot.isBye ? `[${slot.seed}] ${slot.teamName}` : 'BYE'}
                  </span>
                ) : (
                  <div className="flex items-center gap-1 min-w-0">
                    {!slot.isBye && (
                      <span className="text-[10px] font-black text-slate-400 shrink-0">[{slot.seed}]</span>
                    )}
                    <input
                      type="text"
                      value={slot.teamName}
                      disabled={slot.isBye}
                      onChange={(e) => handleTeamNameChange(slot.seed, e.target.value)}
                      className="text-xs font-black uppercase text-slate-900 tracking-tight bg-transparent outline-none focus:bg-amber-50 rounded px-1 w-[155px] truncate disabled:text-rose-500 disabled:italic"
                      title={slot.isBye ? 'Symmetrical Bye Slot' : 'Click to edit team name'}
                    />
                  </div>
                )}

                {/* Show R1 Match Code & Time on the second team of each playable pair */}
                {!isEvenPair && r1Match && !r1Match.isBye && matchTime && (
                  isStaticCapture ? (
                    <span className="text-[10px] font-black text-red-600 tracking-tighter whitespace-nowrap">
                      {r1Match.matchCode} • {matchTime}
                    </span>
                  ) : (
                    <input
                      type="text"
                      value={customTimes[r1Match.matchCode]?.time ?? matchTime}
                      onChange={(e) => handleTimeChange(r1Match.matchCode, e.target.value)}
                      className="text-[10px] font-black text-red-600 tracking-tighter w-16 text-right bg-transparent outline-none focus:bg-red-50 rounded px-0.5"
                      title={`${r1Match.matchCode} (${r1Match.court}) — Click to edit time`}
                    />
                  )
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
              const slotsSpan = Math.pow(2, rIdx + 1);
              const topSlotIdx = mIdx * slotsSpan;
              const bottomSlotIdx = topSlotIdx + slotsSpan - 1;

              const topBranchY = (topSlotIdx + (slotsSpan / 4 - 0.5)) * ROW_HEIGHT + ROW_HEIGHT / 2;
              const bottomBranchY = (bottomSlotIdx - (slotsSpan / 4 - 0.5)) * ROW_HEIGHT + ROW_HEIGHT / 2;
              const centerY = (topBranchY + bottomBranchY) / 2;

              const nextRoundMatch = drawTree.rounds[rIdx + 1]?.matches[Math.floor(mIdx / 2)];
              const isLastRound = rIdx === totalRounds - 1;
              const displayTime = nextRoundMatch && !nextRoundMatch.isBye ? nextRoundMatch.time : '';

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

                  {/* Match Time on next round line in RED (from unified drawTree!) */}
                  {!isLastRound && (mIdx % 2 === 1 || matchesInThisRound === 1) && nextRoundMatch && !nextRoundMatch.isBye && displayTime && (
                    <foreignObject
                      x={stepX + 6}
                      y={centerY - 22}
                      width={118}
                      height={22}
                      className="pointer-events-auto"
                    >
                      <div className="flex items-center gap-1">
                        <span className="text-[9px] font-black text-[#0D2B52]">{nextRoundMatch.matchCode}</span>
                        {isStaticCapture ? (
                          <span className="text-[10px] font-black text-red-600 tracking-tighter whitespace-nowrap">
                            {displayTime}
                          </span>
                        ) : (
                          <input
                            type="text"
                            value={customTimes[nextRoundMatch.matchCode]?.time ?? displayTime}
                            onChange={(e) => handleTimeChange(nextRoundMatch.matchCode, e.target.value)}
                            className="text-[10px] font-black text-red-600 tracking-tighter bg-transparent outline-none focus:bg-red-50 px-0.5 rounded w-16"
                            title={`${nextRoundMatch.stage} (${nextRoundMatch.court})`}
                          />
                        )}
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
                        <Trophy size={14} className="text-amber-600 shrink-0" />
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
    </>
  );

  return (
    <div className="space-y-6">
      {/* Control Bar in Brand Navy & Gold */}
      <div className="flex flex-col gap-4 bg-[#0D2B52] text-white p-4 md:p-6 rounded-3xl border border-[#164077] shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#D4A017]/20 border border-[#D4A017]/40 text-[#D4A017] flex items-center justify-center font-black shrink-0">
            <LayoutTemplate size={20} />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="text-sm font-black uppercase tracking-wider text-white">Classic Fixture Sheet</h4>
              <span className="px-2 py-0.5 bg-[#D4A017]/20 text-[#D4A017] border border-[#D4A017]/30 rounded text-[9px] font-black uppercase">
                Official Draw Sheet
              </span>
            </div>
            <p className="text-xs text-slate-300 font-medium mt-0.5">
              Classic lined tournament tree with spreadsheet background & unified match times.
            </p>
          </div>
        </div>

        {/* Wrapped 2-column Grid on Mobile, Flex Row on Tablet/Desktop (Never hidden, min-h 44px) */}
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 w-full">
          <button
            type="button"
            onClick={handleLoad16TeamSample}
            className="min-h-[44px] px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border bg-white/10 hover:bg-white/20 border-white/20 text-[#D4A017]"
            title="Load standard 16 teams (Team 1 - 16) with unified timings"
          >
            <Sparkles size={14} className="text-[#D4A017] shrink-0" />
            <span className="truncate">Sample 16 Draw</span>
          </button>

          <button
            type="button"
            onClick={() => setShowGrid(!showGrid)}
            className={`min-h-[44px] px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border ${
              showGrid
                ? 'bg-[#164077] border-white/20 text-white'
                : 'bg-slate-900 border-white/10 text-slate-400 hover:text-white'
            }`}
            title="Toggle background spreadsheet grid lines"
          >
            <Grid size={14} className="shrink-0" />
            <span className="whitespace-nowrap">{showGrid ? 'Grid: ON' : 'Grid: OFF'}</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadImage}
            disabled={isExporting}
            className="min-h-[44px] px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-md disabled:opacity-50"
            title="Download high-resolution PNG image"
          >
            {isExporting ? <RefreshCw size={13} className="animate-spin shrink-0" /> : <ImageIcon size={13} className="shrink-0" />}
            <span>PNG</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={isExporting}
            className="min-h-[44px] px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-md active:scale-95 disabled:opacity-50"
            title="Download pure Vector PDF file"
          >
            <Download size={14} className="shrink-0" />
            <span>PDF</span>
          </button>

          <button
            type="button"
            onClick={handleExportWordWithImage}
            disabled={isExporting}
            className="min-h-[44px] px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-md active:scale-95 disabled:opacity-50"
            title="Export Word document with bracket image and match schedule"
          >
            <FileText size={14} className="shrink-0" />
            <span>Word (.doc)</span>
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            disabled={isExporting}
            className="min-h-[44px] px-3.5 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-md active:scale-95 disabled:opacity-50"
            title="Export match fixture sheet as CSV"
          >
            <Download size={14} className="shrink-0" />
            <span>CSV</span>
          </button>

          <button
            type="button"
            onClick={handleWhatsAppSharePdf}
            disabled={isExporting}
            className="min-h-[44px] px-3.5 py-2 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-md active:scale-95 disabled:opacity-50"
            title="Share tournament bracket PDF directly to WhatsApp"
          >
            <Share2 size={13} className="shrink-0" />
            <span>WhatsApp</span>
          </button>

          <button
            type="button"
            onClick={() => setIsPrintModalOpen(true)}
            className="min-h-[44px] px-4 py-2 bg-[#D4A017] hover:bg-[#b88b14] text-[#0D2B52] rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-md active:scale-95"
            title="Open interactive print preview with A4/A3 paper sizing and Word export"
          >
            <Printer size={14} className="shrink-0" />
            <span>Print Preview</span>
          </button>
        </div>
      </div>

      {/* Printable Sheet Viewport with native touch-scrolling */}
      <div className="bg-slate-100 p-2 sm:p-4 md:p-8 rounded-2xl sm:rounded-[2.5rem] border-2 border-slate-900 shadow-inner">
        {/* Mobile Swipe Guide Banner */}
        <div className="lg:hidden flex items-center justify-between bg-amber-500/10 border border-amber-500/30 text-amber-900 px-3.5 py-2 rounded-xl text-xs font-bold mb-3 shadow-xs">
          <span>Swipe horizontally to view full bracket &rarr;</span>
        </div>

        <div className="w-full overflow-x-auto touch-pan-x pb-3">
          <div
            ref={sheetRef}
            className={`mx-auto bg-white p-4 sm:p-6 md:p-10 rounded-2xl shadow-xl transition-all relative border border-slate-300 min-w-[1020px] max-w-[1200px] ${
              showGrid ? 'bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:32px_24px]' : ''
            }`}
            style={{ minHeight: `${TOTAL_HEIGHT}px` }}
          >
            {renderBracketContent(false)}
          </div>
        </div>
      </div>

      {/* Dedicated Off-Screen 1200px Fixed-Width Capture Container for crisp PNG exports on Mobile */}
      <div
        className="fixed left-[-9999px] top-0 w-[1200px] pointer-events-none bg-white"
        aria-hidden="true"
      >
        <div
          ref={captureRef}
          className={`w-[1200px] bg-white p-10 relative border border-slate-300 ${
            showGrid ? 'bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:32px_24px]' : ''
          }`}
          style={{ minHeight: `${TOTAL_HEIGHT}px` }}
        >
          {renderBracketContent(true)}
        </div>
      </div>

      {/* Interactive Vector Print & PDF Preview Modal */}
      <TournamentPrintPreviewModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        tournamentName={tournamentName}
        subTitle={subTitle}
        category={category}
        sport={sport}
        venue={venue}
        startDate={startDate}
        startTime={startTime}
        courtsCount={courtsCount}
        eliminationType={eliminationType}
        matchDurationMins={(firstHalf || 15) + (secondHalf || 15) + (halfTime || 5)}
        restGapMins={restGap || 10}
        thirdPlaceEnabled={thirdPlaceEnabled}
        format="knockout"
        teamsList={effectiveTeamsList}
        matchTimeOverrides={customTimes}
        byesCount={byesCount}
        setupFormula={{
          totalTeams: N,
          powerOfTwo: P,
          byesCount: byesCount,
          upperHalfTeams: Nu,
          lowerHalfTeams: P - Nu,
          upperHalfByes: Math.floor(byesCount / 2),
          lowerHalfByes: Math.ceil(byesCount / 2),
          totalMatches: Math.max(0, N - 1),
          totalRounds: Math.round(totalRounds)
        }}
      />
    </div>
  );
};

export default ClassicSheetBracket;
