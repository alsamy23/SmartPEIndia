import React, { useState, useMemo, useRef } from 'react';
import { 
  Layers, Trophy, RefreshCw, Calendar, Clock, Printer, 
  Share2, FileText, Sparkles, Shield, ChevronRight, CheckCircle2,
  Users, AlertCircle, Download, FileSpreadsheet, Image as ImageIcon
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { toast } from '../../services/toast.ts';
import TournamentPrintPreviewModal from './TournamentPrintPreviewModal.tsx';
import { safeOpenExternal, downloadBlobFile } from '../../utils/safeBrowser.ts';
import {
  TournamentPdfConfig,
  exportTournamentToCsv,
  formatDisplayDate
} from './tournamentDrawEngine.ts';
import { buildTournamentVectorPdf } from './TournamentVectorPdf.ts';

interface CombinationTournamentProps {
  sport?: string;
  setSport?: (val: string) => void;
  venue?: string;
  courtsCount?: number;
  tournamentName: string;
  setTournamentName: (val: string) => void;
  subTitle: string;
  setSubTitle: (val: string) => void;
  category: string;
  setCategory: (val: string) => void;
  startDate: string;
  setStartDate: (val: string) => void;
  numTeams: number;
  setNumTeams: (val: number) => void;
  teamsList: string[];
  setTeamsList: React.Dispatch<React.SetStateAction<string[]>>;
}

export const CombinationTournament: React.FC<CombinationTournamentProps> = ({
  sport: controlledSport,
  setSport: setControlledSport,
  venue = 'School Main Sports Ground',
  courtsCount = 2,
  tournamentName,
  setTournamentName,
  subTitle,
  setSubTitle,
  category,
  setCategory,
  startDate,
  setStartDate,
  numTeams,
  setNumTeams,
  teamsList,
  setTeamsList
}) => {
  const [combType, setCombType] = useState<'league-knockout' | 'knockout-league'>('league-knockout');
  const [localSport, setLocalSport] = useState<string>('Football');
  const sport = controlledSport ?? localSport;
  const setSport = setControlledSport ?? setLocalSport;
  const [startTime, setStartTime] = useState('08:30');
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const captureRef = useRef<HTMLDivElement>(null);

  const getSchoolName = () => {
    try {
      return localStorage.getItem('smartpe_school_name') || "SHRADDHA CHILDREN'S ACADEMY";
    } catch {
      return "SHRADDHA CHILDREN'S ACADEMY";
    }
  };

  // Divide teams into 4 pools (Pool A, B, C, D)
  const pools = useMemo(() => {
    const pA: string[] = [];
    const pB: string[] = [];
    const pC: string[] = [];
    const pD: string[] = [];
    
    teamsList.forEach((team, idx) => {
      const rem = idx % 4;
      if (rem === 0) pA.push(team);
      else if (rem === 1) pB.push(team);
      else if (rem === 2) pC.push(team);
      else pD.push(team);
    });

    return [
      { name: 'Pool A (Zone 1)', teams: pA },
      { name: 'Pool B (Zone 2)', teams: pB },
      { name: 'Pool C (Zone 3)', teams: pC },
      { name: 'Pool D (Zone 4)', teams: pD }
    ];
  }, [teamsList]);

  // Generate round-robin match fixtures for each pool
  const poolMatches = useMemo(() => {
    const list: Array<{ poolName: string; matchId: string; team1: string; team2: string; time: string }> = [];
    let counter = 1;

    pools.forEach((pool) => {
      const ts = pool.teams;
      for (let i = 0; i < ts.length; i++) {
        for (let j = i + 1; j < ts.length; j++) {
          list.push({
            poolName: pool.name,
            matchId: `Match ${counter++}`,
            team1: ts[i],
            team2: ts[j],
            time: `${8 + Math.floor((counter * 35) / 60)}:${String((counter * 35) % 60).padStart(2, '0')} AM`
          });
        }
      }
    });

    return list;
  }, [pools]);

  // Knockout Stage Matches (Quarter-Finals & Semi-Finals)
  const playoffMatches = useMemo(() => {
    return [
      {
        roundName: 'Quarter-Finals',
        name: 'QF-1',
        team1: 'Winner Pool A',
        team2: 'Runner-up Pool B',
        time: '02:00 PM'
      },
      {
        roundName: 'Quarter-Finals',
        name: 'QF-2',
        team1: 'Winner Pool C',
        team2: 'Runner-up Pool D',
        time: '02:45 PM'
      },
      {
        roundName: 'Quarter-Finals',
        name: 'QF-3',
        team1: 'Winner Pool B',
        team2: 'Runner-up Pool A',
        time: '03:30 PM'
      },
      {
        roundName: 'Quarter-Finals',
        name: 'QF-4',
        team1: 'Winner Pool D',
        team2: 'Runner-up Pool C',
        time: '04:15 PM'
      },
      {
        roundName: 'Semi-Finals',
        name: 'SF-1',
        team1: 'Winner QF-1',
        team2: 'Winner QF-2',
        time: '05:00 PM'
      },
      {
        roundName: 'Semi-Finals',
        name: 'SF-2',
        team1: 'Winner QF-3',
        team2: 'Winner QF-4',
        time: '05:45 PM'
      },
      {
        roundName: 'Championship Final',
        name: 'FINAL',
        team1: 'Winner SF-1',
        team2: 'Winner SF-2',
        time: '06:45 PM'
      }
    ];
  }, []);

  const [selectedPoolFilter, setSelectedPoolFilter] = useState<string>('all');

  const filteredPoolMatches = useMemo(() => {
    if (selectedPoolFilter === 'all') return poolMatches;
    return poolMatches.filter(m => m.poolName.toLowerCase().includes(selectedPoolFilter.toLowerCase()));
  }, [poolMatches, selectedPoolFilter]);

  const qfMatches = useMemo(() => playoffMatches.filter(m => m.roundName === 'Quarter-Finals'), [playoffMatches]);
  const sfMatches = useMemo(() => playoffMatches.filter(m => m.roundName === 'Semi-Finals'), [playoffMatches]);
  const finalMatch = useMemo(() => playoffMatches.find(m => m.roundName === 'Championship Final'), [playoffMatches]);

  const buildPdfConfig = (): TournamentPdfConfig => ({
    organizationName: getSchoolName(),
    tournamentName,
    subTitle,
    sport,
    category,
    venue,
    startDate,
    startTime,
    format: 'combination',
    paperSize: 'A4',
    viewMode: 'round-robin-pools',
    teamsList,
    courtsCount,
    existingMatches: poolMatches.map((m) => ({
      name: m.matchId,
      roundName: m.poolName,
      poolName: m.poolName,
      team1: m.team1,
      team2: m.team2,
      date: startDate,
      time: m.time
    }))
  });

  const handleDownloadPdf = () => {
    setIsExporting(true);
    try {
      const { doc, fileName } = buildTournamentVectorPdf(buildPdfConfig());
      doc.save(fileName);
      toast.success('Combination Vector PDF downloaded!');
    } catch (err) {
      console.error('Combination PDF error:', err);
      toast.error('Failed to generate PDF.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadCsv = () => {
    try {
      const csv = exportTournamentToCsv(buildPdfConfig());
      const safeName = (tournamentName || 'Combination').replace(/[^a-z0-9]+/gi, '_');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      downloadBlobFile(blob, `${safeName}_Combination.csv`);
      toast.success('Combination CSV exported!');
    } catch (err) {
      console.error('Combination CSV error:', err);
      toast.error('Failed to export CSV.');
    }
  };

  const handleDownloadPng = async () => {
    if (!captureRef.current) {
      toast.error('Sheet is not ready for image export.');
      return;
    }
    setIsExporting(true);
    try {
      const canvas = await html2canvas(captureRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
        logging: false,
        windowWidth: 1200
      });
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
      if (!blob) throw new Error('PNG failed');
      const safeName = (tournamentName || 'Combination').replace(/[^a-z0-9]+/gi, '_');
      downloadBlobFile(blob, `${safeName}_Combination.png`);
      toast.success('High-res PNG downloaded!');
    } catch (err) {
      console.error('Combination PNG error:', err);
      toast.error('Failed to export PNG.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportWord = () => {
    try {
      const esc = (v: string | number | null | undefined) =>
        String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const poolHtml = pools
        .map(
          (p) =>
            `<div style="margin-bottom:10px;"><b>${esc(p.name)}</b>: ${p.teams.map(esc).join(', ')}</div>`
        )
        .join('');
      const matchRows = poolMatches
        .map(
          (m) =>
            `<tr><td>${esc(m.matchId)}</td><td>${esc(m.poolName)}</td><td>${esc(m.time)}</td><td><b>${esc(m.team1)}</b></td><td>vs</td><td><b>${esc(m.team2)}</b></td></tr>`
        )
        .join('');
      const playoffRows = playoffMatches
        .map(
          (pm) =>
            `<tr><td><b>${esc(pm.name)}</b></td><td>${esc(pm.roundName)}</td><td>${esc(pm.time)}</td><td>${esc(pm.team1)}</td><td>vs</td><td>${esc(pm.team2)}</td></tr>`
        )
        .join('');
      const html = `<!DOCTYPE html><html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="utf-8"/><title>${esc(tournamentName)}</title><style>body{font-family:Calibri,Arial,sans-serif;color:#0f172a;padding:18px;}h1{color:#0D2B52;font-size:20px;margin-bottom:4px;}table{width:100%;border-collapse:collapse;margin:12px 0;font-size:11px;}th{background:#0D2B52;color:#fff;padding:6px;border:1px solid #cbd5e1;text-align:left;}td{padding:6px;border:1px solid #cbd5e1;}</style></head><body><h1>${esc(tournamentName)} (${esc(category)})</h1><p>${esc(getSchoolName())} | ${esc(sport)} | ${esc(venue)} | ${esc(formatDisplayDate(startDate))}</p><h3>Stage 1: Pool Division</h3>${poolHtml}<h3>Intra-Pool Schedule</h3><table><thead><tr><th>Match</th><th>Pool</th><th>Time</th><th>Team 1</th><th></th><th>Team 2</th></tr></thead><tbody>${matchRows}</tbody></table><h3>Stage 2: Playoff Bracket</h3><table><thead><tr><th>Code</th><th>Stage</th><th>Time</th><th>Team 1</th><th></th><th>Team 2</th></tr></thead><tbody>${playoffRows}</tbody></table></body></html>`;
      const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
      const safeName = (tournamentName || 'Combination').replace(/[^a-z0-9]+/gi, '_');
      downloadBlobFile(blob, `${safeName}_Combination.doc`);
      toast.success('Word (.doc) document downloaded!');
    } catch (err) {
      console.error('Combination Word error:', err);
      toast.error('Failed to export Word document.');
    }
  };

  const handleWhatsAppQuickShare = () => {
    const text = 
`🏆 *COMBINATION TOURNAMENT FIXTURES (${combType === 'league-knockout' ? 'League-cum-Knockout' : 'Knockout-cum-League'})*
📌 *Tournament:* ${tournamentName} (${category})
⚽ *Sport:* ${sport} | 📅 *Date:* ${startDate}
👥 *Teams:* ${teamsList.length} divided into 4 Pools (Pool A, B, C, D)
🎯 *Stage 1:* Intra-pool Round Robin League (${poolMatches.length} matches)
🏅 *Stage 2:* Knockout Quarter-Finals, Semi-Finals & Championship Final
Official CBSE PE Unit 1 format.`;

    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    safeOpenExternal(url, "Opening WhatsApp with combination fixtures summary!");
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Top Format Selector Card */}
      <div className="bg-white p-4 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] border-2 border-slate-900 shadow-sm space-y-6">
        <div className="flex flex-col gap-4 border-b border-slate-100 pb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#0D2B52] text-[#D4A017] rounded-2xl flex items-center justify-center font-black shrink-0">
              <Layers size={24} />
            </div>
            <div className="min-w-0">
              <h3 className="text-lg sm:text-xl md:text-2xl font-black text-slate-900 uppercase tracking-tight break-words">
                Combination Tournament Studio
              </h3>
              <p className="text-xs font-bold text-slate-500 mt-0.5">
                CBSE Class 12 Syllabus: League-cum-Knockout & Knockout-cum-League Multi-Pool Formats
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 w-full">
            <button
              type="button"
              onClick={handleDownloadPng}
              disabled={isExporting}
              className="min-h-[44px] px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-sm transition-all disabled:opacity-50"
            >
              <ImageIcon size={14} />
              <span>PNG</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isExporting}
              className="min-h-[44px] px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-sm transition-all disabled:opacity-50"
            >
              <Download size={14} />
              <span>PDF</span>
            </button>

            <button
              type="button"
              onClick={handleExportWord}
              className="min-h-[44px] px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-sm transition-all"
            >
              <FileText size={14} />
              <span>Word (.doc)</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadCsv}
              className="min-h-[44px] px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-sm transition-all"
            >
              <FileSpreadsheet size={14} />
              <span>CSV</span>
            </button>

            <button
              type="button"
              onClick={handleWhatsAppQuickShare}
              className="min-h-[44px] px-4 py-2 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-95"
            >
              <Share2 size={14} />
              <span>WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={() => setIsPrintModalOpen(true)}
              className="min-h-[44px] px-4 py-2 bg-[#D4A017] hover:bg-[#b88b14] text-[#0D2B52] rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-95"
            >
              <Printer size={14} />
              <span>Print Preview</span>
            </button>
          </div>
        </div>

        {/* Format Selector Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setCombType('league-knockout')}
            className={`p-4 sm:p-5 rounded-2xl border-2 text-left transition-all ${
              combType === 'league-knockout'
                ? 'border-[#0D2B52] bg-[#0D2B52]/5 ring-2 ring-[#0D2B52]/20'
                : 'border-slate-200 hover:border-slate-300 bg-slate-50'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black uppercase text-[#0D2B52] tracking-wider flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-[#0D2B52] text-white flex items-center justify-center text-xs">1</span>
                League-cum-Knockout (L.C.K.)
              </span>
              {combType === 'league-knockout' && <CheckCircle2 size={16} className="text-[#0D2B52] shrink-0" />}
            </div>
            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              Teams are split into 4 Pools (A, B, C, D) playing round-robin within pools. Top 2 teams per pool qualify for Quarter-Final knockout rounds.
            </p>
          </button>

          <button
            type="button"
            onClick={() => setCombType('knockout-league')}
            className={`p-4 sm:p-5 rounded-2xl border-2 text-left transition-all ${
              combType === 'knockout-league'
                ? 'border-[#0D2B52] bg-[#0D2B52]/5 ring-2 ring-[#0D2B52]/20'
                : 'border-slate-200 hover:border-slate-300 bg-slate-50'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black uppercase text-[#0D2B52] tracking-wider flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-[#0D2B52] text-white flex items-center justify-center text-xs">2</span>
                Knockout-cum-League (K.C.L.)
              </span>
              {combType === 'knockout-league' && <CheckCircle2 size={16} className="text-[#0D2B52] shrink-0" />}
            </div>
            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              Teams play preliminary elimination knockout matches to identify 4 zone winners, who then compete in a final Round-Robin Super League.
            </p>
          </button>
        </div>

        {/* 4 Pools Grid with horizontal swipe on mobile so no vertical sprawl */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-black uppercase tracking-wider text-slate-800">
              Stage 1: 4 Pool Division ({teamsList.length} Total Teams)
            </h4>
            <span className="text-xs font-bold text-slate-500">
              {Math.ceil(teamsList.length / 4)} Teams per Pool
            </span>
          </div>

          <div className="flex sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 overflow-x-auto touch-pan-x no-scrollbar pb-2 sm:pb-0">
            {pools.map((pool, pIdx) => (
              <div key={pIdx} className="min-w-[240px] sm:min-w-0 flex-1 shrink-0 sm:shrink bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="font-black text-xs uppercase text-[#0D2B52]">{pool.name}</span>
                  <span className="text-[10px] font-bold text-slate-500">{pool.teams.length} Teams</span>
                </div>
                <ul className="space-y-1.5 text-xs font-semibold text-slate-700">
                  {pool.teams.map((t, tIdx) => (
                    <li key={tIdx} className="p-1.5 bg-white rounded-lg border border-slate-100 truncate shadow-2xs">
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Intra-Pool League Match Schedule */}
        <div className="space-y-4 pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h4 className="text-sm font-black uppercase tracking-wider text-slate-800">
              Intra-Pool Match Schedule ({filteredPoolMatches.length} of {poolMatches.length} Matches)
            </h4>

            {/* Quick pool filter chips on mobile/desktop */}
            <div className="flex items-center overflow-x-auto touch-pan-x no-scrollbar gap-1.5 pb-1">
              {[
                { id: 'all', label: 'All Pools' },
                { id: 'Pool A', label: 'Pool A' },
                { id: 'Pool B', label: 'Pool B' },
                { id: 'Pool C', label: 'Pool C' },
                { id: 'Pool D', label: 'Pool D' }
              ].map(chip => (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => setSelectedPoolFilter(chip.id)}
                  className={`min-h-[44px] sm:min-h-0 px-3 py-1.5 rounded-lg text-[11px] font-black uppercase whitespace-nowrap transition-all ${
                    selectedPoolFilter === chip.id
                      ? 'bg-[#0D2B52] text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredPoolMatches.map((m, mIdx) => (
              <div key={mIdx} className="p-3 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200 text-xs space-y-1.5 transition-colors">
                <div className="flex justify-between items-center text-[9px] font-black text-slate-400">
                  <span className="text-[#0D2B52] font-black uppercase px-1.5 py-0.5 bg-white rounded border border-slate-200">{m.poolName}</span>
                  <span className="text-rose-600 font-bold flex items-center gap-1">
                    <Clock size={10} />
                    <span>{m.time}</span>
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 pt-1 font-bold text-slate-900">
                  <span className="truncate flex-1 text-right">{m.team1}</span>
                  <span className="text-[10px] text-slate-400 font-black px-1.5 py-0.5 bg-white rounded border border-slate-200 shrink-0">vs</span>
                  <span className="truncate flex-1 text-left">{m.team2}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stage 2 Playoff Knockout Bracket: Horizontal progression on mobile */}
        <div className="space-y-4 pt-6 border-t border-slate-100">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <h4 className="text-sm font-black uppercase tracking-wider text-[#0D2B52] flex items-center gap-2">
              <Trophy size={16} className="text-[#D4A017]" />
              <span>Stage 2: Championship Playoff Stage (Knockout Finals)</span>
            </h4>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Quarter-Finals → Semi-Finals → Championship Final
            </span>
          </div>

          {/* Swipe indicator for mobile */}
          <div className="sm:hidden px-3 py-1.5 bg-indigo-50 border border-indigo-200 rounded-xl text-[10px] font-bold text-indigo-900 flex items-center justify-between">
            <span>Swipe horizontally to view full playoff bracket →</span>
          </div>

          {/* Sequential Playoff Columns with smooth horizontal overflow */}
          <div className="w-full overflow-x-auto touch-pan-x pb-3 -mx-1 px-1">
            <div className="min-w-[700px] grid grid-cols-3 gap-4 items-start">
              {/* Column 1: Quarter-Finals */}
              <div className="space-y-3 bg-slate-50/70 p-3 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="text-[11px] font-black uppercase text-slate-700">Quarter-Finals</span>
                  <span className="text-[10px] font-bold text-slate-400">4 Matches</span>
                </div>
                <div className="space-y-2.5">
                  {qfMatches.map((pm, pIdx) => (
                    <div key={pIdx} className="p-3 bg-white rounded-xl border border-slate-200 text-xs space-y-1 shadow-2xs">
                      <div className="flex justify-between items-center text-[9px] font-black">
                        <span className="text-[#0D2B52] uppercase font-black">{pm.name}</span>
                        <span className="text-rose-600 font-bold">{pm.time}</span>
                      </div>
                      <div className="font-bold text-slate-900 text-[11px] truncate">{pm.team1}</div>
                      <div className="text-[9px] text-slate-400 font-black text-center my-0.5">vs</div>
                      <div className="font-bold text-slate-900 text-[11px] truncate">{pm.team2}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Column 2: Semi-Finals */}
              <div className="space-y-3 bg-indigo-50/60 p-3 rounded-2xl border border-indigo-200/60">
                <div className="flex items-center justify-between border-b border-indigo-200/60 pb-2">
                  <span className="text-[11px] font-black uppercase text-indigo-950">Semi-Finals</span>
                  <span className="text-[10px] font-bold text-indigo-500">2 Matches</span>
                </div>
                <div className="space-y-3 pt-3">
                  {sfMatches.map((pm, pIdx) => (
                    <div key={pIdx} className="p-3.5 bg-white rounded-xl border border-indigo-200 text-xs space-y-1.5 shadow-2xs">
                      <div className="flex justify-between items-center text-[9px] font-black">
                        <span className="text-indigo-900 uppercase font-black">{pm.name}</span>
                        <span className="text-rose-600 font-bold">{pm.time}</span>
                      </div>
                      <div className="font-bold text-slate-900 text-[11px] truncate">{pm.team1}</div>
                      <div className="text-[9px] text-slate-400 font-black text-center my-0.5">vs</div>
                      <div className="font-bold text-slate-900 text-[11px] truncate">{pm.team2}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Column 3: Championship Final */}
              <div className="space-y-3 bg-amber-50/70 p-3 rounded-2xl border border-[#D4A017]/40">
                <div className="flex items-center justify-between border-b border-[#D4A017]/40 pb-2">
                  <span className="text-[11px] font-black uppercase text-[#0D2B52] flex items-center gap-1.5">
                    <Trophy size={13} className="text-[#D4A017]" />
                    <span>Grand Final</span>
                  </span>
                  <span className="text-[10px] font-black text-[#D4A017]">Trophy</span>
                </div>
                <div className="pt-6">
                  {finalMatch && (
                    <div className="p-4 bg-white rounded-xl border-2 border-[#D4A017] text-xs space-y-2 shadow-md">
                      <div className="flex justify-between items-center text-[9px] font-black">
                        <span className="px-2 py-0.5 bg-[#D4A017] text-[#0D2B52] rounded font-black uppercase tracking-wider">
                          FINAL MATCH
                        </span>
                        <span className="text-rose-600 font-bold">{finalMatch.time}</span>
                      </div>
                      <div className="font-black text-slate-900 text-xs truncate pt-1">{finalMatch.team1}</div>
                      <div className="text-[10px] text-amber-700 font-black text-center my-1 bg-amber-100/60 py-0.5 rounded">
                        VS (GOLD MEDAL MATCH)
                      </div>
                      <div className="font-black text-slate-900 text-xs truncate">{finalMatch.team2}</div>
                      <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-center gap-1 text-[10px] font-black text-emerald-600">
                        <CheckCircle2 size={12} />
                        <span>TOURNAMENT CHAMPION</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Off-screen 1200px Capture Sheet for clean mobile PNG Export */}
      <div
        ref={captureRef}
        aria-hidden="true"
        className="fixed left-[-9999px] top-0 w-[1200px] bg-white text-slate-900 p-10 pointer-events-none select-none z-[-1]"
      >
        <div className="border-b-4 border-[#0D2B52] pb-4 mb-6 flex justify-between items-end">
          <div>
            <div className="text-xs font-black uppercase tracking-widest text-[#D4A017]">{getSchoolName()}</div>
            <h2 className="text-3xl font-black uppercase text-[#0D2B52]">{tournamentName}</h2>
            <p className="text-sm font-bold text-slate-600 mt-1">
              {subTitle} • {category} • {sport} • {venue} • {formatDisplayDate(startDate)}
            </p>
          </div>
          <div className="text-right text-xs font-bold text-slate-600">
            <div>Format: {combType === 'league-knockout' ? 'League-cum-Knockout' : 'Knockout-cum-League'}</div>
            <div>{teamsList.length} Teams • 4 Pools</div>
          </div>
        </div>

        <h3 className="text-sm font-black uppercase tracking-wider text-[#0D2B52] mb-2">Stage 1: Pool Division</h3>
        <div className="grid grid-cols-4 gap-4 mb-6">
          {pools.map((pool, idx) => (
            <div key={idx} className="bg-slate-50 border border-slate-300 rounded-xl p-3">
              <div className="text-xs font-black uppercase text-[#0D2B52] border-b border-slate-200 pb-1.5 mb-2">
                {pool.name} ({pool.teams.length})
              </div>
              <ul className="space-y-1 text-xs font-bold text-slate-700">
                {pool.teams.map((t, tIdx) => (
                  <li key={tIdx} className="bg-white border border-slate-200 rounded px-2 py-1">{t}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <h3 className="text-sm font-black uppercase tracking-wider text-[#0D2B52] mb-2">Stage 2: Playoff Knockout Bracket</h3>
        <div className="grid grid-cols-3 gap-4 text-xs">
          <div className="bg-slate-50 border border-slate-300 rounded-xl p-3 space-y-2">
            <div className="font-black uppercase text-[#0D2B52]">Quarter-Finals</div>
            {qfMatches.map((m, i) => (
              <div key={i} className="bg-white border border-slate-200 rounded p-2">
                <div className="font-black text-[10px] text-[#0D2B52]">{m.name} • {m.time}</div>
                <div className="font-bold">{m.team1} vs {m.team2}</div>
              </div>
            ))}
          </div>
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 space-y-2">
            <div className="font-black uppercase text-indigo-950">Semi-Finals</div>
            {sfMatches.map((m, i) => (
              <div key={i} className="bg-white border border-indigo-200 rounded p-2">
                <div className="font-black text-[10px] text-indigo-900">{m.name} • {m.time}</div>
                <div className="font-bold">{m.team1} vs {m.team2}</div>
              </div>
            ))}
          </div>
          <div className="bg-amber-50 border border-[#D4A017] rounded-xl p-3 space-y-2">
            <div className="font-black uppercase text-[#0D2B52]">Championship Final</div>
            {finalMatch && (
              <div className="bg-white border-2 border-[#D4A017] rounded p-3">
                <div className="font-black text-[10px] text-[#0D2B52]">{finalMatch.name} • {finalMatch.time}</div>
                <div className="font-black text-sm mt-1">{finalMatch.team1} vs {finalMatch.team2}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Vector Print & PDF Preview Modal */}
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
        format="combination"
        teamsList={teamsList}
        matches={poolMatches.map((m) => ({
          name: m.matchId,
          roundName: m.poolName,
          poolName: m.poolName,
          team1: m.team1,
          team2: m.team2,
          date: startDate,
          time: m.time
        }))}
      />
    </div>
  );
};

export default CombinationTournament;
