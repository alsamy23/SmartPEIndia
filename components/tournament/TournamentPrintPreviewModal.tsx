import React, { useState, useEffect, useMemo } from 'react';
import {
  X, Printer, Download, Share2, FileText, Sparkles, Trophy,
  Layers, Users, CalendarClock, MapPin, ShieldCheck, Building2
} from 'lucide-react';
import { toast } from '../../services/toast.ts';
import { trackEvent } from '../../services/analytics.ts';
import { safeOpenExternal, downloadBlobFile } from '../../utils/safeBrowser.ts';
import {
  PaperSize,
  ExportViewMode,
  TournamentFormat,
  EliminationType,
  TournamentPdfConfig,
  KnockoutDrawTree,
  BracketPageSlice,
  UnifiedMatch,
  PoolData,
  TeamScheduleGroup,
  buildSeededKnockoutDraw,
  buildPoolsAndStandings,
  buildTeamSchedulesAndOrderOfPlay,
  computeKnockoutPaginationPlan,
  exportTournamentToCsv,
  truncateText,
  formatDisplayDate
} from './tournamentDrawEngine.ts';
import { buildTournamentVectorPdf } from './TournamentVectorPdf.ts';

export type { PaperSize, ExportViewMode };

export interface TournamentPrintPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  tournamentName: string;
  subTitle?: string;
  category: string;
  sport: string;
  venue?: string;
  startDate: string;
  startTime: string;
  format: TournamentFormat;
  eliminationType?: EliminationType;
  courtsCount?: number;
  matchDurationMins?: number;
  restGapMins?: number;
  thirdPlaceEnabled?: boolean;
  winPoints?: number;
  drawPoints?: number;
  lossPoints?: number;
  leagueType?: 'single' | 'double';
  teamsList: string[];
  rounds?: any[];
  matches?: any[];
  standings?: any[];
  matchTimeOverrides?: Record<string, { time?: string; date?: string; court?: string }>;
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

interface PreviewPageDescriptor {
  id: string;
  orientation: 'landscape' | 'portrait';
  paperSize: PaperSize;
  sectionLabel: string;
  isRoundRobin: boolean;
  kind: 'knockout-slice' | 'losers-stage' | 'pool-page' | 'team-view-page' | 'master-schedule-page';
  slice?: BracketPageSlice;
  tree?: KnockoutDrawTree;
  pools?: PoolData[];
  teamGroups?: TeamScheduleGroup[];
  scheduleRows?: UnifiedMatch[];
}

const getDefaultSchoolName = () => {
  try {
    return localStorage.getItem('smartpe_school_name') || "SHRADDHA CHILDREN'S ACADEMY";
  } catch {
    return "SHRADDHA CHILDREN'S ACADEMY";
  }
};

export const TournamentPrintPreviewModal: React.FC<TournamentPrintPreviewModalProps> = ({
  isOpen,
  onClose,
  tournamentName,
  subTitle,
  category,
  sport,
  venue: initialVenue = 'School Sports Complex',
  startDate,
  startTime,
  format,
  eliminationType = 'single',
  courtsCount: initialCourts,
  matchDurationMins = 35,
  restGapMins = 10,
  thirdPlaceEnabled = true,
  winPoints = 3,
  drawPoints = 1,
  lossPoints = 0,
  leagueType = 'single',
  teamsList,
  matches = [],
  standings = [],
  matchTimeOverrides
}) => {
  const numTeams = teamsList.length || 16;
  const defaultViewMode: ExportViewMode =
    format === 'knockout' ? 'full-bracket' : 'round-robin-pools';

  const [paperSize, setPaperSize] = useState<PaperSize>('A4');
  const [viewMode, setViewMode] = useState<ExportViewMode>(defaultViewMode);
  const [schoolName, setSchoolName] = useState<string>(getDefaultSchoolName);
  const [venue, setVenue] = useState<string>(initialVenue);
  const [courtsCount, setCourtsCount] = useState<number>(initialCourts || (numTeams > 16 ? 4 : 2));
  const [directorName, setDirectorName] = useState<string>('');
  const [chiefRefereeName, setChiefRefereeName] = useState<string>('');
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    setViewMode(format === 'knockout' ? 'full-bracket' : 'round-robin-pools');
  }, [format]);

  useEffect(() => {
    if (initialVenue) setVenue(initialVenue);
  }, [initialVenue]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const pdfConfig: TournamentPdfConfig = useMemo(
    () => ({
      organizationName: schoolName,
      tournamentName,
      subTitle,
      sport,
      category,
      venue,
      startDate,
      startTime,
      format,
      eliminationType,
      paperSize,
      viewMode,
      teamsList,
      courtsCount,
      matchDurationMins,
      restGapMins,
      thirdPlaceEnabled,
      winPoints,
      drawPoints,
      lossPoints,
      leagueType,
      directorName: directorName.trim() || undefined,
      chiefRefereeName: chiefRefereeName.trim() || undefined,
      existingMatches: matches,
      existingStandings: standings,
      matchTimeOverrides
    }),
    [
      schoolName,
      tournamentName,
      subTitle,
      sport,
      category,
      venue,
      startDate,
      startTime,
      format,
      eliminationType,
      paperSize,
      viewMode,
      teamsList,
      courtsCount,
      matchDurationMins,
      restGapMins,
      thirdPlaceEnabled,
      winPoints,
      drawPoints,
      lossPoints,
      leagueType,
      directorName,
      chiefRefereeName,
      matches,
      standings,
      matchTimeOverrides
    ]
  );

  // Build exact paginated sheets list matching the Vector PDF Engine 1:1
  const previewPages: PreviewPageDescriptor[] = useMemo(() => {
    const pages: PreviewPageDescriptor[] = [];
    const includePrimary =
      viewMode === 'full-bracket' ||
      viewMode === 'round-robin-pools' ||
      viewMode === 'complete-pack';

    if (includePrimary) {
      if (format === 'knockout' && viewMode !== 'round-robin-pools') {
        const tree = buildSeededKnockoutDraw(pdfConfig);
        const plan = computeKnockoutPaginationPlan(
          tree.N,
          tree.P,
          tree.totalRounds,
          paperSize,
          eliminationType
        );
        plan.forEach((slice, idx) => {
          pages.push({
            id: `ko-${idx}-${slice.mode}`,
            orientation: 'landscape',
            paperSize,
            sectionLabel: slice.sectionLabel,
            isRoundRobin: false,
            kind: slice.mode === 'losers-stage' ? 'losers-stage' : 'knockout-slice',
            slice,
            tree
          });
        });
      } else {
        const { pools, playoffTree } = buildPoolsAndStandings(pdfConfig);
        // Group pools cleanly (2 pools per page if teams <= 5 each, else 1 pool per page)
        let bucket: PoolData[] = [];
        pools.forEach((pool) => {
          if (bucket.length > 0 && (bucket.length >= 2 || pool.teams.length > 5 || bucket[0].teams.length > 5)) {
            pages.push({
              id: `pool-${pages.length}`,
              orientation: 'portrait',
              paperSize: 'A4',
              sectionLabel: bucket.map((b) => b.poolName).join(' & ').toUpperCase(),
              isRoundRobin: true,
              kind: 'pool-page',
              pools: bucket
            });
            bucket = [];
          }
          bucket.push(pool);
        });
        if (bucket.length > 0) {
          pages.push({
            id: `pool-${pages.length}`,
            orientation: 'portrait',
            paperSize: 'A4',
            sectionLabel: bucket.map((b) => b.poolName).join(' & ').toUpperCase(),
            isRoundRobin: true,
            kind: 'pool-page',
            pools: bucket
          });
        }
        if (playoffTree) {
          pages.push({
            id: `combo-playoffs-${pages.length}`,
            orientation: 'landscape',
            paperSize,
            sectionLabel: 'STAGE 2: KNOCKOUT PLAYOFF BRACKET',
            isRoundRobin: false,
            kind: 'knockout-slice',
            tree: playoffTree,
            slice: {
              pageNumber: pages.length + 1,
              title: 'Stage 2 Knockout Playoffs',
              sectionLabel: 'STAGE 2: KNOCKOUT PLAYOFF BRACKET',
              mode: 'final-stage',
              slotStart: 0,
              slotEnd: playoffTree.P,
              startRound: 0,
              endRound: playoffTree.totalRounds,
              includeThirdPlace: true
            }
          });
        }
      }
    }

    if (viewMode === 'team-view' || viewMode === 'complete-pack') {
      const { teamSchedules } = buildTeamSchedulesAndOrderOfPlay(pdfConfig);
      // Group 2–3 teams per A4 portrait page without splitting any team block
      let chunk: TeamScheduleGroup[] = [];
      let approxRows = 0;
      teamSchedules.forEach((t) => {
        const rows = Math.max(1, t.matches.length) + 2;
        if (chunk.length > 0 && (chunk.length >= 3 || approxRows + rows > 28)) {
          pages.push({
            id: `teams-${pages.length}`,
            orientation: 'portrait',
            paperSize: 'A4',
            sectionLabel: 'TEAM-WISE FIXTURE SHEETS',
            isRoundRobin: false,
            kind: 'team-view-page',
            teamGroups: chunk
          });
          chunk = [];
          approxRows = 0;
        }
        chunk.push(t);
        approxRows += rows;
      });
      if (chunk.length > 0) {
        pages.push({
          id: `teams-${pages.length}`,
          orientation: 'portrait',
          paperSize: 'A4',
          sectionLabel: 'TEAM-WISE FIXTURE SHEETS',
          isRoundRobin: false,
          kind: 'team-view-page',
          teamGroups: chunk
        });
      }
    }

    if (viewMode === 'master-schedule' || viewMode === 'complete-pack') {
      const { masterOrderOfPlay } = buildTeamSchedulesAndOrderOfPlay(pdfConfig);
      const rowsPerPage = 28;
      for (let i = 0; i < Math.max(1, masterOrderOfPlay.length); i += rowsPerPage) {
        pages.push({
          id: `master-${pages.length}`,
          orientation: 'portrait',
          paperSize: 'A4',
          sectionLabel: 'MASTER ORDER OF PLAY (OFFICIAL DESK)',
          isRoundRobin: false,
          kind: 'master-schedule-page',
          scheduleRows: masterOrderOfPlay.slice(i, i + rowsPerPage)
        });
      }
    }

    return pages;
  }, [pdfConfig, format, viewMode, paperSize, eliminationType]);

  if (!isOpen) return null;

  const formattedDate = formatDisplayDate(startDate);
  const primaryOrientation = previewPages[0]?.orientation || 'landscape';
  const primaryPaper = previewPages[0]?.paperSize || paperSize;

  // Direct Pure Vector PDF Download (Zero DOM screenshots!)
  const handleDownloadPdf = async () => {
    setIsExporting(true);
    toast.loading('Building multi-page Vector PDF...', { id: 'vector-pdf-gen' });
    try {
      const { doc, fileName, pageCount } = buildTournamentVectorPdf(pdfConfig);
      doc.save(fileName);
      toast.dismiss('vector-pdf-gen');
      toast.success(`Downloaded ${pageCount}-page Vector ${paperSize} PDF!`);
      trackEvent('resource_downloaded', {
        resource_name: 'Tournament Vector PDF',
        format: 'pdf',
        paperSize,
        viewMode,
        pageCount
      });
    } catch (err) {
      console.error('Vector PDF export error:', err);
      toast.dismiss('vector-pdf-gen');
      toast.error('Could not generate Vector PDF. Please try Print / Save as PDF.');
    } finally {
      setIsExporting(false);
    }
  };

  // Share Pure Vector PDF on WhatsApp
  const handleWhatsAppSharePdf = async () => {
    setIsExporting(true);
    toast.loading('Preparing official Vector PDF for WhatsApp...', { id: 'wa-vector-pdf' });
    try {
      const { doc, fileName, pageCount } = buildTournamentVectorPdf(pdfConfig);
      const pdfBlob = doc.output('blob');
      const pdfFile = new File([pdfBlob], fileName, { type: 'application/pdf' });

      const caption = `🏆 *OFFICIAL TOURNAMENT FIXTURES (${pageCount} Pages)*
📌 *Tournament:* ${tournamentName} (${category})
⚽ *Sport:* ${sport} | 📍 *Venue:* ${venue}
📅 *Date:* ${formattedDate} | 👥 *Teams:* ${numTeams}
📄 *Sheet Format:* ${paperSize} Official Federation Draw`;

      if (navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
        toast.dismiss('wa-vector-pdf');
        await navigator.share({
          files: [pdfFile],
          title: `${tournamentName} Official Fixtures`,
          text: caption
        });
        toast.success('Shared Vector PDF via WhatsApp!');
        return;
      }

      doc.save(fileName);
      toast.dismiss('wa-vector-pdf');
      toast.success('Vector PDF downloaded! Opening WhatsApp...');
      safeOpenExternal(
        `https://api.whatsapp.com/send?text=${encodeURIComponent(
          caption + '\n\n📄 _(Attach the downloaded official PDF fixture sheet)_'
        )}`
      );
    } catch (err) {
      console.error(err);
      toast.dismiss('wa-vector-pdf');
      toast.error('Failed to prepare PDF share.');
    } finally {
      setIsExporting(false);
    }
  };

  // Clean Paginated Browser Print
  const handlePrint = () => {
    const existingStyle = document.getElementById('dynamic-print-page-style');
    if (existingStyle) existingStyle.remove();

    const styleEl = document.createElement('style');
    styleEl.id = 'dynamic-print-page-style';
    styleEl.innerHTML = `
      @page {
        size: ${primaryPaper} ${primaryOrientation};
        margin: 6mm;
      }
    `;
    document.head.appendChild(styleEl);

    trackEvent('resource_downloaded', {
      resource_name: `Tournament Print (${sport})`,
      format: 'print',
      paperSize: primaryPaper,
      viewMode
    });
    window.print();
  };

  // Structured Word (.doc) export using pure HTML fixture tables (zero blurry raster screenshots)
  const handleExportWord = () => {
    setIsExporting(true);
    try {
      const { masterOrderOfPlay } = buildTeamSchedulesAndOrderOfPlay(pdfConfig);
      const rowsHtml = masterOrderOfPlay
        .map(
          (m, idx) => `
          <tr style="background-color:${idx % 2 === 1 ? '#f8fafc' : '#ffffff'};">
            <td style="padding:5px; text-align:center; font-weight:bold; color:#0D2B52;">${m.matchCode}</td>
            <td style="padding:5px;">${m.stage}</td>
            <td style="padding:5px; text-align:center;">${m.date} • ${m.time}</td>
            <td style="padding:5px; text-align:center;">${m.court}</td>
            <td style="padding:5px; font-weight:bold;">${m.team1}</td>
            <td style="padding:5px; text-align:center;">[ &nbsp; ] - [ &nbsp; ]</td>
            <td style="padding:5px; font-weight:bold;">${m.team2}</td>
          </tr>`
        )
        .join('');

      const wordHtml = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word'>
        <head><meta charset="utf-8"><title>${tournamentName}</title></head>
        <body style="font-family:Arial,sans-serif; color:#0f172a;">
          <div style="background:#0D2B52; color:#fff; padding:12px 16px; border-left:5px solid #D4A017;">
            <div style="font-size:9pt; color:#D4A017; font-weight:bold;">${schoolName.toUpperCase()}</div>
            <h1 style="margin:2px 0; font-size:15pt;">${tournamentName.toUpperCase()}</h1>
            <div style="font-size:9pt;">${sport} • ${category} | Venue: ${venue} | Date: ${formattedDate}</div>
          </div>
          <h3 style="color:#0D2B52; margin:14px 0 6px;">Official Match Schedule (${masterOrderOfPlay.length} Matches)</h3>
          <table border="1" cellspacing="0" cellpadding="4" style="width:100%; border-collapse:collapse; font-size:9pt;">
            <tr style="background:#0D2B52; color:#ffffff;">
              <th>Match #</th><th>Stage</th><th>Date & Time</th><th>Court/Field</th><th>Team A</th><th>Score</th><th>Team B</th>
            </tr>
            ${rowsHtml}
          </table>
          <p style="margin-top:24px; font-size:8.5pt; color:#475569;">
            Tournament Director: _______________________ &nbsp;&nbsp;&nbsp;
            Chief Referee: _______________________ &nbsp;&nbsp;&nbsp;
            Generated via SmartPE India (smartpeindia.app)
          </p>
        </body></html>`;
      const blob = new Blob(['\ufeff', wordHtml], { type: 'application/msword' });
      downloadBlobFile(blob, `${(tournamentName || 'Tournament').replace(/\s+/g, '_')}_Schedule.doc`);
      toast.success('Word (.doc) official schedule exported!');
    } finally {
      setIsExporting(false);
    }
  };

  // Clean RFC-4180 CSV export
  const handleExportCsv = () => {
    setIsExporting(true);
    try {
      const csvContent = exportTournamentToCsv(pdfConfig);
      const blob = new Blob(['\ufeff', csvContent], { type: 'text/csv;charset=utf-8;' });
      downloadBlobFile(blob, `${(tournamentName || 'Tournament').replace(/\s+/g, '_')}_Fixtures.csv`);
      toast.success('CSV fixture & standings sheet exported!');
      trackEvent('resource_downloaded', {
        resource_name: 'Tournament CSV',
        format: 'csv',
        viewMode
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-xs p-2 sm:p-4 no-print-modal-backdrop">
      <div className="bg-[#0D2B52] text-white w-[95vw] max-w-5xl max-h-[92dvh] rounded-2xl sm:rounded-3xl border border-[#164077] shadow-2xl overflow-hidden flex flex-col">
        {/* Top Interactive Controls Header */}
        <div className="shrink-0 p-3 sm:px-5 sm:py-3.5 bg-[#08182D] border-b border-slate-800 flex flex-col gap-2.5 no-print">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-[#D4A017]/20 border border-[#D4A017]/40 text-[#D4A017] flex items-center justify-center shrink-0">
                <Printer size={18} />
              </div>
              <div className="min-w-0">
                <h3 className="text-xs sm:text-base font-black uppercase tracking-wider text-white flex flex-wrap items-center gap-1.5">
                  <span className="truncate">Vector Print & PDF Studio</span>
                  <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded text-[10px] font-black shrink-0">
                    {previewPages.length} {previewPages.length === 1 ? 'PAGE' : 'PAGES'}
                  </span>
                </h3>
                <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
                  Pure crisp vector PDF engine — automatic draw splitting with zero clipping.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="min-w-[44px] min-h-[44px] p-2 bg-white/10 hover:bg-rose-500 text-slate-300 hover:text-white rounded-xl transition-all flex items-center justify-center shrink-0"
              aria-label="Close Print Studio"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Paper Size Selector */}
            <div className="flex items-center bg-[#0D2B52] p-1 rounded-xl border border-white/10 shrink-0">
              <span className="text-[10px] font-black text-slate-400 uppercase px-2">Paper</span>
              {(['A4', 'A3'] as PaperSize[]).map((sz) => (
                <button
                  key={sz}
                  type="button"
                  onClick={() => setPaperSize(sz)}
                  className={`min-h-[36px] px-3 py-1 rounded-lg text-xs font-black transition-all ${
                    paperSize === sz
                      ? 'bg-[#D4A017] text-[#0D2B52] shadow-sm'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  {sz}
                </button>
              ))}
            </div>

            {/* View Mode Selector */}
            <div className="flex flex-wrap items-center bg-[#0D2B52] p-1 rounded-xl border border-white/10 gap-1 flex-1 min-w-0">
              {[
                { id: 'full-bracket' as ExportViewMode, label: 'Full Bracket', icon: Trophy },
                { id: 'round-robin-pools' as ExportViewMode, label: 'Round Robin Pools', icon: Layers },
                { id: 'team-view' as ExportViewMode, label: 'Team View', icon: Users },
                { id: 'master-schedule' as ExportViewMode, label: 'Order of Play', icon: CalendarClock },
                { id: 'complete-pack' as ExportViewMode, label: 'Complete Pack', icon: ShieldCheck }
              ].map((tab) => {
                const Icon = tab.icon;
                const active = viewMode === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setViewMode(tab.id)}
                    className={`min-h-[36px] px-2.5 py-1 rounded-lg text-[11px] font-black flex items-center gap-1.5 transition-all ${
                      active
                        ? 'bg-emerald-500 text-slate-950 shadow-sm'
                        : 'text-slate-300 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon size={13} className="shrink-0" />
                    <span className="whitespace-nowrap">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Official Document Customization Strip */}
        <div className="shrink-0 px-3 sm:px-5 py-2 bg-[#0a2140] border-b border-white/10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 text-xs no-print">
          <div className="flex items-center gap-2 bg-[#08182D] border border-white/10 rounded-xl px-3 py-1.5">
            <Building2 size={14} className="text-[#D4A017] shrink-0" />
            <input
              type="text"
              value={schoolName}
              onChange={(e) => setSchoolName(e.target.value)}
              placeholder="Host School / Org"
              className="bg-transparent text-white font-bold outline-none w-full text-[11px]"
            />
          </div>
          <div className="flex items-center gap-2 bg-[#08182D] border border-white/10 rounded-xl px-3 py-1.5">
            <MapPin size={14} className="text-emerald-400 shrink-0" />
            <input
              type="text"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              placeholder="Tournament Venue"
              className="bg-transparent text-white font-bold outline-none w-full text-[11px]"
            />
          </div>
          <div className="flex items-center justify-between gap-2 bg-[#08182D] border border-white/10 rounded-xl px-3 py-1.5">
            <span className="text-slate-400 font-bold text-[10px] uppercase">Courts / Pitches</span>
            <select
              value={courtsCount}
              onChange={(e) => setCourtsCount(Number(e.target.value))}
              className="bg-[#0D2B52] text-white font-black text-[11px] rounded px-2 py-0.5 outline-none"
            >
              {[1, 2, 3, 4, 6, 8].map((n) => (
                <option key={n} value={n}>
                  {n} {n === 1 ? 'Court' : 'Courts'}
                </option>
              ))}
            </select>
          </div>
          <input
            type="text"
            value={directorName}
            onChange={(e) => setDirectorName(e.target.value)}
            placeholder="Tournament Director (Optional)"
            className="hidden sm:block bg-[#08182D] border border-white/10 rounded-xl px-3 py-1.5 text-white font-bold outline-none text-[11px]"
          />
          <input
            type="text"
            value={chiefRefereeName}
            onChange={(e) => setChiefRefereeName(e.target.value)}
            placeholder="Chief Referee (Optional)"
            className="hidden sm:block bg-[#08182D] border border-white/10 rounded-xl px-3 py-1.5 text-white font-bold outline-none text-[11px]"
          />
        </div>

        {/* Multi-Page Paginated Preview Canvas */}
        <div className="flex-1 overflow-auto p-3 sm:p-6 bg-slate-800/90 space-y-5">
          <div className="sm:hidden bg-amber-500/15 border border-amber-400/30 text-amber-200 px-3 py-1.5 rounded-xl text-[11px] font-bold flex items-center justify-between no-print">
            <span>Swipe horizontally to inspect full print sheet &rarr;</span>
          </div>

          <div id="tournament-print-area" className="space-y-6 flex flex-col items-start lg:items-center w-full overflow-x-auto touch-pan-x pb-2">
            {previewPages.map((page, pageIdx) => {
              const totalPages = previewPages.length;
              const isPortrait = page.orientation === 'portrait';
              const sheetWidthClass = isPortrait
                ? 'min-w-[680px] w-full max-w-[794px]'
                : page.paperSize === 'A3'
                ? 'min-w-[920px] w-full max-w-[1380px]'
                : 'min-w-[820px] w-full max-w-[1123px]';

              return (
                <div
                  key={page.id}
                  className={`tournament-print-page bg-white text-slate-900 shadow-2xl rounded-sm border border-slate-300 p-4 sm:p-7 flex flex-col justify-between ${sheetWidthClass}`}
                  style={{ minHeight: isPortrait ? '960px' : page.paperSize === 'A3' ? '820px' : '680px' }}
                >
                  {/* Official Federation Page Header */}
                  <div className="space-y-4">
                    <div className="bg-[#0D2B52] text-white rounded-lg border-l-4 border-[#D4A017] px-4 py-3 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[#D4A017]">
                          {schoolName || "SHRADDHA CHILDREN'S ACADEMY"}
                        </div>
                        <h2 className="text-base sm:text-lg font-black uppercase tracking-tight leading-tight mt-0.5">
                          {tournamentName || 'OFFICIAL SCHOOL CHAMPIONSHIP'}
                        </h2>
                        <div className="text-[11px] text-blue-100 font-semibold mt-0.5">
                          {sport.toUpperCase()} • {category} &nbsp;|&nbsp; VENUE: {venue.toUpperCase()} &nbsp;|&nbsp; DATE: {formattedDate}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-black text-[#D4A017] uppercase">
                          Page {pageIdx + 1} of {totalPages}
                        </div>
                        <div className="text-[11px] font-bold text-white uppercase tracking-wide mt-0.5">
                          {page.sectionLabel}
                        </div>
                        <div className="text-[10px] text-slate-300 font-semibold">
                          {page.paperSize} {page.orientation.toUpperCase()} • {numTeams} Teams
                        </div>
                      </div>
                    </div>

                    {/* PAGE BODY BY KIND */}
                    {page.kind === 'knockout-slice' && page.tree && page.slice && (
                      <PaginatedKnockoutPreview
                        tree={page.tree}
                        slice={page.slice}
                        matchDurationMins={matchDurationMins}
                        restGapMins={restGapMins}
                        eliminationType={eliminationType}
                      />
                    )}

                    {page.kind === 'losers-stage' && page.tree && (
                      <LosersBracketPreview tree={page.tree} />
                    )}

                    {page.kind === 'pool-page' && page.pools && (
                      <div className="space-y-6">
                        {page.pools.map((pool) => (
                          <PoolSheetPreview key={pool.poolName} pool={pool} />
                        ))}
                      </div>
                    )}

                    {page.kind === 'team-view-page' && page.teamGroups && (
                      <div className="space-y-5">
                        {page.teamGroups.map((tg) => (
                          <div key={tg.teamName} className="border border-slate-300 rounded-lg overflow-hidden break-inside-avoid">
                            <div className="bg-[#0D2B52] text-white px-3.5 py-2 flex items-center justify-between">
                              <span className="font-black text-xs uppercase tracking-wide">
                                {tg.teamName}
                              </span>
                              <span className="text-[10px] font-black text-[#D4A017] uppercase">
                                {tg.seedOrPool} • {tg.matches.length} Matches
                              </span>
                            </div>
                            <table className="w-full text-left border-collapse text-[11px]">
                              <thead>
                                <tr className="bg-slate-100 border-b border-slate-300 text-[10px] font-black uppercase text-[#0D2B52]">
                                  <th className="p-2 w-16 text-center">Match #</th>
                                  <th className="p-2">Stage / Pool</th>
                                  <th className="p-2">Opponent</th>
                                  <th className="p-2 text-center">Court / Field</th>
                                  <th className="p-2 text-center">Reporting Time</th>
                                  <th className="p-2 text-center w-24">Score</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-200 font-semibold">
                                {tg.matches.length === 0 ? (
                                  <tr>
                                    <td colSpan={6} className="p-3 text-center text-slate-400 italic">
                                      Awaiting bracket progression
                                    </td>
                                  </tr>
                                ) : (
                                  tg.matches.map((m, idx) => (
                                    <tr key={`${m.matchCode}-${idx}`} className={idx % 2 === 1 ? 'bg-slate-50' : 'bg-white'}>
                                      <td className="p-2 text-center font-black text-[#0D2B52]">{m.matchCode}</td>
                                      <td className="p-2 text-slate-700">{m.stage}</td>
                                      <td className="p-2 font-bold text-slate-900">{m.opponent}</td>
                                      <td className="p-2 text-center text-slate-700">{m.court}</td>
                                      <td className="p-2 text-center font-bold text-slate-800">{m.date} • {m.time}</td>
                                      <td className="p-2 text-center font-mono text-slate-600">{m.scoreDisplay}</td>
                                    </tr>
                                  ))
                                )}
                              </tbody>
                            </table>
                          </div>
                        ))}
                      </div>
                    )}

                    {page.kind === 'master-schedule-page' && page.scheduleRows && (
                      <div className="border border-slate-300 rounded-lg overflow-hidden">
                        <table className="w-full text-left border-collapse text-[11px]">
                          <thead>
                            <tr className="bg-[#0D2B52] text-white text-[10px] font-black uppercase">
                              <th className="p-2 text-center">M#</th>
                              <th className="p-2 text-center">Time</th>
                              <th className="p-2 text-center">Court / Pitch</th>
                              <th className="p-2">Stage / Round</th>
                              <th className="p-2">Team A</th>
                              <th className="p-2 text-center">Score</th>
                              <th className="p-2">Team B</th>
                              <th className="p-2 text-center">Ref Sign</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200 font-semibold">
                            {page.scheduleRows.map((m, idx) => (
                              <tr key={`${m.matchCode}-${idx}`} className={idx % 2 === 1 ? 'bg-slate-50' : 'bg-white'}>
                                <td className="p-2 text-center font-black text-[#0D2B52]">{m.matchCode}</td>
                                <td className="p-2 text-center font-bold text-slate-800">{m.time}</td>
                                <td className="p-2 text-center text-slate-700">{m.court}</td>
                                <td className="p-2 text-slate-600">{m.stage}</td>
                                <td className="p-2 font-bold text-slate-900">{truncateText(m.team1, 24)}</td>
                                <td className="p-2 text-center font-mono text-slate-500">[ &nbsp; ] - [ &nbsp; ]</td>
                                <td className="p-2 font-bold text-slate-900">{truncateText(m.team2, 24)}</td>
                                <td className="p-2 text-center text-slate-300">______</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Official Page Footer */}
                  <div className="mt-6 pt-3 border-t border-slate-300 flex flex-wrap items-end justify-between gap-4 text-[10px] text-slate-600">
                    <div className="flex items-center gap-8">
                      <div>
                        <div className="w-40 border-b border-slate-400 h-5 mb-1"></div>
                        <div className="font-black text-slate-900 uppercase">
                          {directorName ? `Tournament Director: ${directorName}` : 'Tournament Director (Sign)'}
                        </div>
                      </div>
                      <div>
                        <div className="w-40 border-b border-slate-400 h-5 mb-1"></div>
                        <div className="font-black text-slate-900 uppercase">
                          {chiefRefereeName ? `Chief Referee: ${chiefRefereeName}` : 'Chief Referee (Sign)'}
                        </div>
                      </div>
                    </div>

                    {page.isRoundRobin && (
                      <div className="text-[9px] italic text-slate-500 font-semibold">
                        Tie-Breaker: 1. Points • 2. Head-to-Head • 3. Goal/Point Diff • 4. Goals Scored
                      </div>
                    )}

                    <div className="text-[10px] font-bold text-slate-500 ml-auto">
                      Generated via SmartPE India (smartpeindia.app)
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sticky Bottom Action Footer */}
        <div className="shrink-0 p-3 sm:p-4 bg-[#08182D] border-t border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 text-xs no-print">
          <div className="hidden sm:flex items-center gap-2 text-slate-300">
            <Sparkles size={14} className="text-[#D4A017] shrink-0" />
            <span>
              Vector PDF outputs crisp selectable text & exact {paperSize} federation layouts across{' '}
              <strong className="text-white">{previewPages.length}</strong>{' '}
              {previewPages.length === 1 ? 'page' : 'pages'}.
            </span>
          </div>

          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 w-full lg:w-auto">
            <button
              type="button"
              onClick={handleExportWord}
              disabled={isExporting}
              className="min-h-[44px] px-3 sm:px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-[11px] sm:text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md active:scale-95 disabled:opacity-50"
            >
              <FileText size={14} className="shrink-0" />
              <span>Word (.doc)</span>
            </button>

            <button
              type="button"
              onClick={handleExportCsv}
              disabled={isExporting}
              className="min-h-[44px] px-3 sm:px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-[11px] sm:text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md active:scale-95 disabled:opacity-50"
            >
              <Download size={14} className="shrink-0" />
              <span>CSV</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isExporting}
              className="col-span-2 sm:col-span-1 min-h-[44px] px-3 sm:px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[11px] sm:text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md active:scale-95 disabled:opacity-50"
            >
              <Download size={14} className="shrink-0" />
              <span>Download Vector PDF ({paperSize})</span>
            </button>

            <button
              type="button"
              onClick={handleWhatsAppSharePdf}
              disabled={isExporting}
              className="min-h-[44px] px-3 sm:px-4 py-2 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-xl text-[11px] sm:text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md active:scale-95 disabled:opacity-50"
            >
              <Share2 size={14} className="shrink-0" />
              <span>WhatsApp PDF</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="min-h-[44px] px-4 py-2 bg-[#D4A017] hover:bg-[#b88b14] text-[#0D2B52] rounded-xl text-[11px] sm:text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-lg active:scale-95"
            >
              <Printer size={15} className="shrink-0" />
              <span>Print {paperSize}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ---------- Subcomponents for Crisp Multi-Page Declarative Preview ---------- */

const MatchCardSvgPreview: React.FC<{ match: UnifiedMatch; highlightGold?: boolean }> = ({
  match,
  highlightGold
}) => (
  <div
    className={`rounded-md border text-[10px] overflow-hidden shadow-2xs ${
      match.isBye
        ? 'bg-rose-50/70 border-rose-200'
        : highlightGold
        ? 'bg-amber-50 border-[#D4A017]'
        : 'bg-white border-slate-300'
    }`}
  >
    <div
      className={`px-1.5 py-0.5 flex items-center justify-between text-[8.5px] font-black border-b ${
        match.isBye
          ? 'bg-rose-100/70 border-rose-200 text-rose-700'
          : highlightGold
          ? 'bg-amber-200/70 border-amber-300 text-[#0D2B52]'
          : 'bg-slate-100 border-slate-200 text-slate-600'
      }`}
    >
      <span
        className={`px-1.5 rounded text-white ${
          match.isBye ? 'bg-rose-600' : 'bg-[#0D2B52]'
        }`}
      >
        {match.matchCode}
      </span>
      <span className="truncate ml-1">
        {match.isBye ? 'BYE • Auto Advance' : `${match.time} • ${match.court}`}
      </span>
    </div>

    {[
      { name: match.team1, seed: match.seed1, bye: match.isTeam1Bye || match.team1 === 'BYE', score: match.score1 },
      { name: match.team2, seed: match.seed2, bye: match.isTeam2Bye || match.team2 === 'BYE', score: match.score2 }
    ].map((row, rIdx) => (
      <div
        key={rIdx}
        className={`px-1.5 py-1 flex items-center justify-between gap-1 ${
          rIdx === 1 ? 'border-t border-slate-200/80' : ''
        }`}
      >
        <div className="flex items-center gap-1 min-w-0">
          {row.seed && !row.bye && (
            <span className="text-[8.5px] font-black text-slate-500 shrink-0">[{row.seed}]</span>
          )}
          <span
            className={`truncate font-bold ${
              row.bye ? 'italic text-rose-600' : 'text-slate-900'
            }`}
          >
            {row.bye ? 'BYE' : truncateText(row.name, 24)}
          </span>
        </div>
        {!row.bye && !match.isBye && (
          <div className="w-5 h-3.5 border border-slate-400 bg-white rounded-[2px] text-center text-[8px] font-bold shrink-0">
            {row.score ?? ''}
          </div>
        )}
      </div>
    ))}
  </div>
);

const PaginatedKnockoutPreview: React.FC<{
  tree: KnockoutDrawTree;
  slice: BracketPageSlice;
  matchDurationMins: number;
  restGapMins: number;
  eliminationType: EliminationType;
}> = ({ tree, slice, matchDurationMins, restGapMins, eliminationType }) => {
  const roundCols: Array<{
    roundName: string;
    shortName: string;
    matches: UnifiedMatch[];
    isFinalRound: boolean;
  }> = [];

  const firstRoundMatchStart = Math.floor(slice.slotStart / Math.pow(2, slice.startRound + 1));
  const firstRoundMatchEnd = Math.ceil(slice.slotEnd / Math.pow(2, slice.startRound + 1));
  const firstRoundMatchesVisible = Math.max(1, firstRoundMatchEnd - firstRoundMatchStart);

  for (let absR = slice.startRound; absR < slice.endRound; absR++) {
    const rd = tree.rounds[absR];
    if (!rd) continue;
    const lr = absR - slice.startRound;
    const scaleDiv = Math.pow(2, lr);
    const startIdx = Math.floor(firstRoundMatchStart / scaleDiv);
    const count = Math.max(1, Math.floor(firstRoundMatchesVisible / scaleDiv));
    roundCols.push({
      roundName: rd.roundName,
      shortName: rd.shortName,
      matches: rd.matches.slice(startIdx, startIdx + count),
      isFinalRound: absR === tree.totalRounds - 1
    });
  }

  return (
    <div className={`grid gap-4 ${slice.mode === 'full-with-schedule' ? 'grid-cols-12' : 'grid-cols-1'}`}>
      <div className={slice.mode === 'full-with-schedule' ? 'col-span-8' : 'col-span-1'}>
        <div
          className="grid gap-3 items-stretch"
          style={{ gridTemplateColumns: `repeat(${roundCols.length}, minmax(0, 1fr))` }}
        >
          {roundCols.map((col, cIdx) => (
            <div key={cIdx} className="flex flex-col">
              <div className="bg-[#0D2B52] text-white text-[10px] font-black uppercase text-center py-1 rounded mb-2">
                {col.roundName}
              </div>
              <div className="flex-1 flex flex-col justify-around gap-1.5">
                {col.matches.map((m) => (
                  <MatchCardSvgPreview key={m.id} match={m} highlightGold={col.isFinalRound} />
                ))}
              </div>
              {col.isFinalRound && slice.includeThirdPlace && tree.thirdPlaceMatch && (
                <div className="mt-3 pt-2 border-t border-dashed border-slate-300">
                  <div className="text-[9px] font-black text-slate-500 uppercase mb-1">
                    3rd Place Playoff
                  </div>
                  <MatchCardSvgPreview match={tree.thirdPlaceMatch} />
                </div>
              )}
            </div>
          ))}
        </div>

        {slice.isA3BottomWithFinals && (
          <div className="mt-4 p-3 rounded-lg bg-amber-50/60 border border-[#D4A017]">
            <div className="text-[10px] font-black uppercase text-[#0D2B52] mb-2">
              Championship Stage (Semifinals → Grand Final & 3rd Place)
            </div>
            <div className="grid grid-cols-2 gap-4">
              {tree.rounds.slice(-2).map((rd) => (
                <div key={rd.roundIndex} className="space-y-1.5">
                  <div className="text-[9px] font-black text-slate-600 uppercase">{rd.roundName}</div>
                  {rd.matches.map((m) => (
                    <MatchCardSvgPreview key={m.id} match={m} highlightGold={rd.roundIndex === tree.totalRounds - 1} />
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {slice.mode === 'full-with-schedule' && (
        <div className="col-span-4 bg-slate-50 border border-slate-300 rounded-lg p-3 flex flex-col justify-between">
          <div>
            <div className="bg-[#0D2B52] text-white text-[10px] font-black uppercase text-center py-1 rounded mb-2">
              Match Schedule & Rules Summary
            </div>
            <table className="w-full text-left border-collapse text-[10px]">
              <thead>
                <tr className="bg-slate-200 text-[#0D2B52] font-black uppercase text-[9px]">
                  <th className="p-1">#</th>
                  <th className="p-1">Time / Ct</th>
                  <th className="p-1">Fixture</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {tree.allPlayableMatches.slice(0, 10).map((m) => (
                  <tr key={m.id}>
                    <td className="p-1 font-black text-[#0D2B52]">{m.matchCode}</td>
                    <td className="p-1 text-slate-600 whitespace-nowrap">
                      {m.time}
                      <div className="text-[8.5px]">{m.court}</div>
                    </td>
                    <td className="p-1 font-bold text-slate-900">
                      {truncateText(m.team1, 14)} v {truncateText(m.team2, 14)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-300 text-[9.5px] text-slate-600 space-y-0.5">
            <div className="font-black text-[#0D2B52] uppercase">Tournament Regulations</div>
            <div>• Draw: {tree.N} Teams in {tree.P}-Slot Tree ({tree.byesCount} Byes)</div>
            <div>• Format: {eliminationType === 'double' ? 'Double Elimination' : 'Single Elimination'}</div>
            <div>• Duration: {matchDurationMins} min + {restGapMins} min interval</div>
          </div>
        </div>
      )}
    </div>
  );
};

const LosersBracketPreview: React.FC<{ tree: KnockoutDrawTree }> = ({ tree }) => (
  <div className="space-y-4">
    <div
      className="grid gap-3 items-stretch"
      style={{
        gridTemplateColumns: `repeat(${tree.losersRounds.length + (tree.grandFinalMatch ? 1 : 0)}, minmax(0, 1fr))`
      }}
    >
      {tree.losersRounds.map((lr) => (
        <div key={lr.roundIndex} className="flex flex-col">
          <div className="bg-[#0D2B52] text-white text-[10px] font-black uppercase text-center py-1 rounded mb-2">
            {lr.roundName}
          </div>
          <div className="flex-1 flex flex-col justify-around gap-1.5">
            {lr.matches.map((m) => (
              <MatchCardSvgPreview key={m.id} match={m} />
            ))}
          </div>
        </div>
      ))}
      {tree.grandFinalMatch && (
        <div className="flex flex-col justify-center">
          <div className="bg-[#D4A017] text-[#0D2B52] text-[10px] font-black uppercase text-center py-1 rounded mb-2">
            Grand Final
          </div>
          <MatchCardSvgPreview match={tree.grandFinalMatch} highlightGold />
          <div className="text-[9px] italic text-slate-500 text-center mt-2">
            Bracket Reset match applies if Losers Bracket finalist wins GF.
          </div>
        </div>
      )}
    </div>
  </div>
);

const PoolSheetPreview: React.FC<{ pool: PoolData }> = ({ pool }) => (
  <div className="border border-slate-300 rounded-lg p-3 space-y-3 bg-white">
    <div className="bg-[#0D2B52] text-white px-3 py-1.5 rounded flex items-center justify-between">
      <span className="text-xs font-black uppercase text-[#D4A017]">
        {pool.poolName} ({pool.teams.length} Teams)
      </span>
      <span className="text-[10px] font-bold">{pool.matches.length} Matches</span>
    </div>

    {/* Standings Table */}
    <table className="w-full text-left border-collapse text-[10px] border border-slate-300">
      <thead>
        <tr className="bg-slate-200 text-[#0D2B52] font-black uppercase text-[9px]">
          <th className="p-1.5 text-center border border-slate-300">Pos</th>
          <th className="p-1.5 border border-slate-300">Team / School</th>
          <th className="p-1.5 text-center border border-slate-300">P</th>
          <th className="p-1.5 text-center border border-slate-300">W</th>
          <th className="p-1.5 text-center border border-slate-300">D</th>
          <th className="p-1.5 text-center border border-slate-300">L</th>
          <th className="p-1.5 text-center border border-slate-300">GF</th>
          <th className="p-1.5 text-center border border-slate-300">GA</th>
          <th className="p-1.5 text-center border border-slate-300">GD</th>
          <th className="p-1.5 text-center border border-slate-300">Pts</th>
        </tr>
      </thead>
      <tbody>
        {pool.standings.map((row, idx) => (
          <tr key={row.team} className={idx % 2 === 1 ? 'bg-slate-50' : 'bg-white'}>
            <td className="p-1 text-center font-bold border border-slate-300">{row.pos}</td>
            <td className="p-1 font-bold text-slate-900 border border-slate-300">{truncateText(row.team, 28)}</td>
            <td className="p-1 text-center border border-slate-300">{row.played}</td>
            <td className="p-1 text-center border border-slate-300">{row.won}</td>
            <td className="p-1 text-center border border-slate-300">{row.drawn}</td>
            <td className="p-1 text-center border border-slate-300">{row.lost}</td>
            <td className="p-1 text-center border border-slate-300">{row.gf}</td>
            <td className="p-1 text-center border border-slate-300">{row.ga}</td>
            <td className="p-1 text-center border border-slate-300">{row.gd > 0 ? `+${row.gd}` : row.gd}</td>
            <td className="p-1 text-center font-black text-[#0D2B52] border border-slate-300">{row.pts}</td>
          </tr>
        ))}
      </tbody>
    </table>

    {/* Cross-Table Matrix */}
    {pool.teams.length <= 10 && (
      <div>
        <div className="text-[9.5px] font-black text-[#0D2B52] uppercase mb-1">
          Head-to-Head Cross-Table Matrix
        </div>
        <table className="w-full text-center border-collapse text-[9.5px] border border-slate-300">
          <thead>
            <tr className="bg-slate-100 text-[#0D2B52] font-black">
              <th className="p-1 text-left border border-slate-300">Team</th>
              {pool.teams.map((t, i) => (
                <th key={t} className="p-1 border border-slate-300">
                  {pool.teams.length <= 5 ? truncateText(t, 9) : `T${i + 1}`}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pool.teams.map((rt, rIdx) => (
              <tr key={rt}>
                <td className="p-1 text-left font-bold border border-slate-300">
                  {pool.teams.length > 5 ? `T${rIdx + 1}. ` : ''}
                  {truncateText(rt, 18)}
                </td>
                {pool.teams.map((ct, cIdx) => (
                  <td
                    key={ct}
                    className={`p-1 border border-slate-300 font-bold ${
                      rIdx === cIdx ? 'bg-slate-300' : 'bg-white text-[#0D2B52]'
                    }`}
                  >
                    {rIdx === cIdx ? '' : pool.crossTable[rt]?.[ct] || ''}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}

    {/* Round-by-Round Match Order Table */}
    <div>
      <div className="text-[9.5px] font-black text-[#0D2B52] uppercase mb-1">
        Round-by-Round Match Order
      </div>
      <table className="w-full text-left border-collapse text-[9.5px] border border-slate-300">
        <thead>
          <tr className="bg-[#0D2B52] text-white font-black uppercase text-[8.5px]">
            <th className="p-1 text-center">M#</th>
            <th className="p-1 text-center">Rnd</th>
            <th className="p-1">Date & Time</th>
            <th className="p-1 text-center">Court</th>
            <th className="p-1">Team A</th>
            <th className="p-1 text-center">Score</th>
            <th className="p-1">Team B</th>
            <th className="p-1 text-center">Ref Sign</th>
          </tr>
        </thead>
        <tbody>
          {pool.matches.map((m, idx) => (
            <tr key={m.id} className={idx % 2 === 1 ? 'bg-slate-50' : 'bg-white'}>
              <td className="p-1 text-center font-black text-[#0D2B52] border border-slate-200">{m.matchCode}</td>
              <td className="p-1 text-center border border-slate-200">R{m.roundNumber || 1}</td>
              <td className="p-1 border border-slate-200">{m.date} {m.time}</td>
              <td className="p-1 text-center border border-slate-200">{m.court}</td>
              <td className="p-1 font-bold border border-slate-200">{truncateText(m.team1, 18)}</td>
              <td className="p-1 text-center font-mono border border-slate-200">
                {m.completed && m.score1 !== null && m.score2 !== null
                  ? `${m.score1} - ${m.score2}`
                  : '[  ] - [  ]'}
              </td>
              <td className="p-1 font-bold border border-slate-200">{truncateText(m.team2, 18)}</td>
              <td className="p-1 text-center text-slate-400 border border-slate-200">____</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export default TournamentPrintPreviewModal;
