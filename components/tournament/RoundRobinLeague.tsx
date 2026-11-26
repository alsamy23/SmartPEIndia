import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { 
  Trophy, Users, Calendar, Clock, Printer, Plus, RefreshCw, 
  ChevronRight, ArrowRight, Shield, Download, Sparkles, AlertCircle, 
  CheckCircle2, Share2, FileText, Check, Copy, Table, ListFilter, Activity,
  FileSpreadsheet, Image as ImageIcon
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { toast } from '../../services/toast.ts';
import { trackEvent } from '../../services/analytics.ts';
import { PRESET_SCHOOLS } from './KnockoutBracket.tsx';
import TournamentPrintPreviewModal from './TournamentPrintPreviewModal.tsx';
import { safeOpenExternal, downloadBlobFile } from '../../utils/safeBrowser.ts';
import {
  TournamentPdfConfig,
  exportTournamentToCsv,
  formatDisplayDate
} from './tournamentDrawEngine.ts';
import { buildTournamentVectorPdf } from './TournamentVectorPdf.ts';

export interface RoundRobinMatch {
  id: number;
  roundNumber: number;
  roundName: string;
  team1: string;
  team2: string;
  time: string;
  date: string;
  score1: number | null;
  score2: number | null;
  completed: boolean;
}

export interface TeamStanding {
  team: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number; // goals for
  ga: number; // goals against
  gd: number; // goal difference
  pts: number; // points
}

interface RoundRobinLeagueProps {
  sport?: string;
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

export const RoundRobinLeague: React.FC<RoundRobinLeagueProps> = ({
  sport = 'Football',
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
  // Format options
  const [leagueType, setLeagueType] = useState<'single' | 'double'>('single');
  const [winPoints, setWinPoints] = useState<number>(3);
  const [drawPoints, setDrawPoints] = useState<number>(1);
  const [lossPoints, setLossPoints] = useState<number>(0);

  // Timings
  const [matchDuration, setMatchDuration] = useState<number>(30); // total minutes per match
  const [restGap, setRestGap] = useState<number>(10);
  const [startTime, setStartTime] = useState('09:00');

  // Multi-day
  const [numDays, setNumDays] = useState<number>(1);

  // Active view tab inside Round Robin
  const [activeSubTab, setActiveSubTab] = useState<'fixtures' | 'table' | 'matrix'>('fixtures');

  // Generated Matches & Scores State
  const [matches, setMatches] = useState<RoundRobinMatch[]>([]);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const printAreaRef = useRef<HTMLDivElement>(null);
  const captureRef = useRef<HTMLDivElement>(null);

  const getSchoolName = () => {
    try {
      return localStorage.getItem('smartpe_school_name') || "SHRADDHA CHILDREN'S ACADEMY";
    } catch {
      return "SHRADDHA CHILDREN'S ACADEMY";
    }
  };

  const buildPdfConfig = (): TournamentPdfConfig => ({
    organizationName: getSchoolName(),
    tournamentName,
    subTitle,
    sport,
    category,
    venue,
    startDate,
    startTime,
    format: 'roundrobin',
    paperSize: 'A4',
    viewMode: 'round-robin-pools',
    teamsList,
    courtsCount,
    matchDurationMins: matchDuration,
    restGapMins: restGap,
    winPoints,
    drawPoints,
    lossPoints,
    leagueType,
    existingStandings: standings,
    existingMatches: matches.map((m) => ({
      name: `Match ${m.id}`,
      roundName: `Round ${m.roundNumber}`,
      roundNumber: m.roundNumber,
      team1: m.team1,
      team2: m.team2,
      date: m.date || startDate,
      time: m.time,
      score1: m.score1,
      score2: m.score2,
      completed: m.completed
    }))
  });

  const handleDownloadPdf = async () => {
    setIsExporting(true);
    try {
      const { doc, fileName } = buildTournamentVectorPdf(buildPdfConfig());
      doc.save(fileName);
      toast.success('Official Vector PDF downloaded!');
      trackEvent('resource_downloaded', {
        resource_name: `${tournamentName || 'League'} Schedule`,
        resource_type: 'Round Robin League PDF',
        format: 'PDF'
      });
    } catch (err) {
      console.error('PDF export failed:', err);
      toast.error('Failed to generate PDF.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadCsv = () => {
    try {
      const csv = exportTournamentToCsv(buildPdfConfig());
      const safeName = (tournamentName || 'League').replace(/[^a-z0-9]+/gi, '_');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      downloadBlobFile(blob, `${safeName}_RoundRobin.csv`);
      toast.success('League CSV exported!');
      trackEvent('resource_downloaded', {
        resource_name: `${tournamentName || 'League'} Schedule`,
        resource_type: 'Round Robin League CSV',
        format: 'CSV'
      });
    } catch (err) {
      console.error('CSV export failed:', err);
      toast.error('Failed to export CSV.');
    }
  };

  const handleDownloadPng = async () => {
    if (!captureRef.current) {
      toast.error('League sheet is not ready for image export.');
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
      if (!blob) throw new Error('PNG generation failed');
      const safeName = (tournamentName || 'League').replace(/[^a-z0-9]+/gi, '_');
      downloadBlobFile(blob, `${safeName}_RoundRobin.png`);
      toast.success('High-res PNG downloaded!');
      trackEvent('resource_downloaded', {
        resource_name: `${tournamentName || 'League'} Sheet`,
        resource_type: 'Round Robin League PNG',
        format: 'PNG'
      });
    } catch (err) {
      console.error('PNG export failed:', err);
      toast.error('Failed to export PNG image.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportWord = () => {
    try {
      const safeTitle = (tournamentName || 'Round Robin League').replace(/</g, '&lt;');
      const esc = (v: string | number | null | undefined) =>
        String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const standingsRows = standings
        .map(
          (st, idx) =>
            `<tr><td style="text-align:center;">${idx + 1}</td><td><b>${esc(st.team)}</b></td><td style="text-align:center;">${st.played}</td><td style="text-align:center;">${st.won}</td><td style="text-align:center;">${st.drawn}</td><td style="text-align:center;">${st.lost}</td><td style="text-align:center;">${st.gf}</td><td style="text-align:center;">${st.ga}</td><td style="text-align:center;">${st.gd > 0 ? `+${st.gd}` : st.gd}</td><td style="text-align:center;font-weight:bold;">${st.pts}</td></tr>`
        )
        .join('');
      const matchRows = matches
        .map(
          (m) =>
            `<tr><td>Match #${m.id}</td><td>Round ${m.roundNumber}</td><td>${esc(m.date)}</td><td>${esc(m.time)}</td><td><b>${esc(m.team1)}</b></td><td style="text-align:center;">${m.completed && m.score1 !== null && m.score2 !== null ? `${m.score1} - ${m.score2}` : 'vs'}</td><td><b>${esc(m.team2)}</b></td></tr>`
        )
        .join('');
      const html = `<!DOCTYPE html><html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="utf-8"/><title>${safeTitle}</title><style>body{font-family:Calibri,Arial,sans-serif;color:#0f172a;padding:18px;}h1{color:#0D2B52;margin-bottom:4px;font-size:20px;}p.meta{color:#475569;font-size:12px;margin-top:0;}table{width:100%;border-collapse:collapse;margin:12px 0;font-size:11px;}th{background:#0D2B52;color:#fff;padding:6px;border:1px solid #cbd5e1;text-align:left;}td{padding:6px;border:1px solid #cbd5e1;}</style></head><body><h1>${safeTitle} (${esc(category)})</h1><p class="meta">${esc(getSchoolName())} | ${esc(sport)} | ${esc(venue)} | Start: ${esc(formatDisplayDate(startDate))}</p><h3>League Standings Table</h3><table><thead><tr><th>Pos</th><th>Team</th><th>P</th><th>W</th><th>D</th><th>L</th><th>GF</th><th>GA</th><th>GD</th><th>PTS</th></tr></thead><tbody>${standingsRows}</tbody></table><h3>Round Robin Match Schedule</h3><table><thead><tr><th>Match</th><th>Round</th><th>Date</th><th>Time</th><th>Team 1</th><th>Score</th><th>Team 2</th></tr></thead><tbody>${matchRows}</tbody></table></body></html>`;
      const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
      const safeName = (tournamentName || 'League').replace(/[^a-z0-9]+/gi, '_');
      downloadBlobFile(blob, `${safeName}_RoundRobin.doc`);
      toast.success('Word (.doc) document downloaded!');
      trackEvent('resource_downloaded', {
        resource_name: `${tournamentName || 'League'} Schedule`,
        resource_type: 'Round Robin League Word',
        format: 'DOC'
      });
    } catch (err) {
      console.error('Word export failed:', err);
      toast.error('Failed to export Word document.');
    }
  };

  const handleWhatsAppQuickShare = () => {
    const sample = matches.slice(0, 5).map((m) => `• *Match ${m.id}* (${m.time}): ${m.team1} vs ${m.team2}`).join('\n');
    const msg = 
`🏆 *ROUND ROBIN LEAGUE FIXTURES*
📌 *Tournament:* ${tournamentName} (${category})
📅 *Date:* ${startDate} | 👥 *Teams:* ${teamsList.length} Teams
🔄 *Format:* Round Robin League (${leagueType === 'single' ? 'Single Leg' : 'Double Leg'})
📊 *Total Matches:* ${matches.length} Matches

📋 *OPENING MATCHES:*
${sample}
${matches.length > 5 ? `\n• ... and ${matches.length - 5} more matches.` : ''}

Generated via SmartPE India Official Tournament Studio.`;
    safeOpenExternal(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`, "Opening WhatsApp with league schedule!");
  };

  // Team roster handlers
  const handleNumTeamsChange = (n: number) => {
    setNumTeams(n);
    setTeamsList(prev => {
      const currentList = [...prev];
      if (n > currentList.length) {
        for (let i = currentList.length; i < n; i++) {
          currentList.push(`Team ${i + 1}`);
        }
      } else {
        currentList.length = n;
      }
      return currentList;
    });
  };

  const handleTeamNameChange = (idx: number, value: string) => {
    setTeamsList(prev => {
      const update = [...prev];
      update[idx] = value;
      return update;
    });
  };

  const addMinutesToTime = (timeStr: string, minutes: number): string => {
    const [h, m] = (timeStr || '09:00').split(':').map(Number);
    const date = new Date();
    date.setHours(h || 9);
    date.setMinutes((m || 0) + minutes);
    
    let hours = date.getHours();
    const mins = String(date.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${String(hours).padStart(2, '0')}:${mins} ${ampm}`;
  };

  // Generate Round Robin Fixtures using standard Cyclic Method algorithm
  const generateRoundRobin = () => {
    const N = teamsList.length;
    if (N < 2) return;

    let teams = [...teamsList];
    let isOdd = false;
    if (N % 2 !== 0) {
      isOdd = true;
      teams.push("BYE");
    }

    const totalTeams = teams.length;
    const numRounds = totalTeams - 1;
    const matchesPerRound = totalTeams / 2;

    const roundBlockDuration = matchDuration + restGap;
    let matchCounter = 1;

    const generatedMatches: RoundRobinMatch[] = [];

    const formatDateObj = (dayOffset: number) => {
      const dateObj = new Date(startDate);
      dateObj.setDate(dateObj.getDate() + dayOffset);
      const day = String(dateObj.getDate()).padStart(2, '0');
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const year = dateObj.getFullYear();
      return `${day}-${month}-${year}`;
    };

    // Cyclic Method Rotation
    // In each round, team 0 stays fixed, other teams rotate clockwise
    for (let cycle = 0; cycle < (leagueType === 'double' ? 2 : 1); cycle++) {
      let currentArr = [...teams];

      for (let r = 0; r < numRounds; r++) {
        const roundNum = cycle * numRounds + r + 1;
        const dayIdx = Math.min(numDays - 1, Math.floor((roundNum - 1) / Math.ceil((numRounds * (leagueType === 'double' ? 2 : 1)) / numDays)));
        const matchDate = formatDateObj(dayIdx);

        let matchInRound = 0;
        for (let i = 0; i < matchesPerRound; i++) {
          const teamA = currentArr[i];
          const teamB = currentArr[totalTeams - 1 - i];

          // Skip if dummy BYE match
          if (teamA === "BYE" || teamB === "BYE") {
            continue;
          }

          const matchTime = addMinutesToTime(startTime, matchInRound * roundBlockDuration);
          matchInRound++;

          // In second cycle (double round robin), swap home/away
          const t1 = cycle === 1 ? teamB : teamA;
          const t2 = cycle === 1 ? teamA : teamB;

          generatedMatches.push({
            id: matchCounter++,
            roundNumber: roundNum,
            roundName: `Round ${roundNum}`,
            team1: t1,
            team2: t2,
            time: matchTime,
            date: matchDate,
            score1: null,
            score2: null,
            completed: false
          });
        }

        // Rotate currentArr clockwise keeping index 0 fixed
        const fixed = currentArr[0];
        const last = currentArr[currentArr.length - 1];
        const rest = currentArr.slice(1, currentArr.length - 1);
        currentArr = [fixed, last, ...rest];
      }
    }

    setMatches(generatedMatches);
    setHasGenerated(true);
    toast.success("Round Robin League fixtures generated!");
    trackEvent('tool_used', { tool_name: 'Round Robin League Generator' });
  };

  useEffect(() => {
    if (!hasGenerated && teamsList.length >= 2) {
      generateRoundRobin();
    }
  }, []);

  // Update match score and recalculate standings live
  const handleScoreChange = (matchId: number, team1Score: string, team2Score: string) => {
    setMatches(prev => prev.map(m => {
      if (m.id === matchId) {
        const s1 = team1Score === '' ? null : parseInt(team1Score);
        const s2 = team2Score === '' ? null : parseInt(team2Score);
        const isCompleted = s1 !== null && !isNaN(s1) && s2 !== null && !isNaN(s2);
        return {
          ...m,
          score1: s1,
          score2: s2,
          completed: isCompleted
        };
      }
      return m;
    }));
  };

  // Calculate League Standings Table live from matches
  const calculateStandings = (): TeamStanding[] => {
    const tableMap: Record<string, TeamStanding> = {};

    teamsList.forEach(t => {
      tableMap[t] = {
        team: t,
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        gf: 0,
        ga: 0,
        gd: 0,
        pts: 0
      };
    });

    matches.forEach(m => {
      if (m.completed && m.score1 !== null && m.score2 !== null) {
        const t1 = tableMap[m.team1];
        const t2 = tableMap[m.team2];

        if (t1 && t2) {
          t1.played += 1;
          t2.played += 1;

          t1.gf += m.score1;
          t1.ga += m.score2;
          t2.gf += m.score2;
          t2.ga += m.score1;

          if (m.score1 > m.score2) {
            t1.won += 1;
            t1.pts += winPoints;
            t2.lost += 1;
            t2.pts += lossPoints;
          } else if (m.score2 > m.score1) {
            t2.won += 1;
            t2.pts += winPoints;
            t1.lost += 1;
            t1.pts += lossPoints;
          } else {
            t1.drawn += 1;
            t1.pts += drawPoints;
            t2.drawn += 1;
            t2.pts += drawPoints;
          }

          t1.gd = t1.gf - t1.ga;
          t2.gd = t2.gf - t2.ga;
        }
      }
    });

    return Object.values(tableMap).sort((a, b) => {
      if (b.pts !== a.pts) return b.pts - a.pts;
      if (b.gd !== a.gd) return b.gd - a.gd;
      if (b.gf !== a.gf) return b.gf - a.gf;
      return a.team.localeCompare(b.team, undefined, { numeric: true, sensitivity: 'base' });
    });
  };

  const standings = calculateStandings();

  // Metrics calculation
  const N = teamsList.length;
  const singleMatchesCount = (N * (N - 1)) / 2;
  const totalMatchesCount = leagueType === 'double' ? singleMatchesCount * 2 : singleMatchesCount;
  const totalRoundsCount = N % 2 === 0 ? (N - 1) * (leagueType === 'double' ? 2 : 1) : N * (leagueType === 'double' ? 2 : 1);

  const handleTriggerPrint = () => {
    window.print();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Configuration Card */}
      <div className="bg-white p-4 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] border-2 border-slate-900 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-6">
          <div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 uppercase tracking-tighter flex items-center gap-2">
              <RefreshCw size={24} className="text-indigo-600 shrink-0" />
              <span>Round Robin League Configurator</span>
            </h3>
            <p className="text-xs font-bold text-slate-500 mt-1">
              Standard All-Play-All format using Cyclic & Tabular methods with live score entry & standings table.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 bg-indigo-50 border border-indigo-200 text-indigo-800 rounded-xl text-[10px] font-black uppercase tracking-wider">
              {totalMatchesCount} Total Matches
            </span>
            <span className="px-3 py-1 bg-pink-50 border border-pink-200 text-pink-800 rounded-xl text-[10px] font-black uppercase tracking-wider">
              {totalRoundsCount} League Rounds
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Tournament Name</label>
            <input 
              type="text" 
              value={tournamentName}
              onChange={(e) => setTournamentName(e.target.value)}
              className="w-full min-h-[44px] px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-2xl font-bold text-slate-900 outline-none focus:border-indigo-600 transition-all text-sm"
            />
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Subtitle / Description</label>
            <input 
              type="text" 
              value={subTitle}
              onChange={(e) => setSubTitle(e.target.value)}
              className="w-full min-h-[44px] px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-2xl font-bold text-slate-900 outline-none focus:border-indigo-600 transition-all text-sm"
            />
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Category / Division</label>
            <input 
              type="text" 
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full min-h-[44px] px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-2xl font-bold text-slate-900 outline-none focus:border-indigo-600 transition-all text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 pt-2">
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">League Format</label>
            <select
              value={leagueType}
              onChange={(e) => setLeagueType(e.target.value as any)}
              className="w-full min-h-[44px] px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-2xl font-bold text-slate-900 outline-none focus:border-indigo-600 transition-all text-sm"
            >
              <option value="single">Single Round Robin (All Play Once)</option>
              <option value="double">Double Round Robin (Home & Away)</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Number of Teams</label>
            <input 
              type="number" 
              min={3}
              max={20}
              value={numTeams}
              onChange={(e) => handleNumTeamsChange(parseInt(e.target.value) || 3)}
              className="w-full min-h-[44px] px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-2xl font-bold text-slate-900 outline-none focus:border-indigo-600 transition-all text-sm"
            />
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Start Date</label>
            <input 
              type="date" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full min-h-[44px] px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-2xl font-bold text-slate-900 outline-none focus:border-indigo-600 transition-all text-sm"
            />
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">First Match Time</label>
            <input 
              type="time" 
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full min-h-[44px] px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-2xl font-bold text-slate-900 outline-none focus:border-indigo-600 transition-all text-sm"
            />
          </div>
        </div>

        {/* Points System Breakdown */}
        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
          <h4 className="text-xs font-black uppercase tracking-widest text-slate-700">Points & Match Duration</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Points for Win</label>
              <input 
                type="number" 
                value={winPoints}
                onChange={(e) => setWinPoints(parseInt(e.target.value) || 0)}
                className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold text-xs"
              />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Points for Draw</label>
              <input 
                type="number" 
                value={drawPoints}
                onChange={(e) => setDrawPoints(parseInt(e.target.value) || 0)}
                className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold text-xs"
              />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Points for Loss</label>
              <input 
                type="number" 
                value={lossPoints}
                onChange={(e) => setLossPoints(parseInt(e.target.value) || 0)}
                className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold text-xs"
              />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Match Duration (Mins)</label>
              <input 
                type="number" 
                value={matchDuration}
                onChange={(e) => setMatchDuration(parseInt(e.target.value) || 0)}
                className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold text-xs"
              />
            </div>
          </div>
        </div>

        {/* Teams List */}
        <div className="space-y-3">
          <label className="text-xs font-black uppercase tracking-widest text-slate-700 block">
            Teams List ({teamsList.length} Teams)
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-56 overflow-y-auto p-2 bg-slate-50 rounded-2xl border border-slate-200 custom-scrollbar">
            {teamsList.map((team, idx) => (
              <div key={idx} className="flex items-center gap-2 bg-white p-2.5 rounded-xl border border-slate-200">
                <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-700 font-black text-[10px] flex items-center justify-center flex-shrink-0">
                  {idx + 1}
                </span>
                <input 
                  type="text" 
                  value={team}
                  onChange={(e) => handleTeamNameChange(idx, e.target.value)}
                  className="w-full text-xs font-bold text-slate-800 bg-transparent outline-none"
                />
              </div>
            ))}
          </div>
        </div>

        <button 
          onClick={generateRoundRobin}
          className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 text-white border-2 border-slate-900 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] flex items-center justify-center gap-3"
        >
          <Sparkles size={20} />
          <span>Generate Round Robin League Fixtures</span>
        </button>
      </div>

      {/* CBSE Formula Board */}
      <div className="bg-white p-6 rounded-[2rem] border-2 border-slate-900 shadow-sm grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center">
          <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Matches</div>
          <div className="text-2xl font-black text-slate-900">{totalMatchesCount}</div>
          <div className="text-[9px] font-bold text-slate-400 mt-1">Formula: N(N-1)/2</div>
        </div>
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center">
          <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Rounds</div>
          <div className="text-2xl font-black text-indigo-600">{totalRoundsCount}</div>
          <div className="text-[9px] font-bold text-slate-400 mt-1">{N % 2 === 0 ? "N - 1 (Even)" : "N (Odd + Bye)"}</div>
        </div>
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center">
          <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Matches Per Round</div>
          <div className="text-2xl font-black text-slate-900">{Math.floor(N / 2)}</div>
        </div>
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center">
          <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Byes Per Round</div>
          <div className="text-2xl font-black text-pink-600">{N % 2 === 0 ? "0" : "1"}</div>
        </div>
      </div>

      {/* Fixture Schedule & Live Table */}
      {hasGenerated && matches.length > 0 && (
        <div className="space-y-6" ref={printAreaRef}>
          {/* Sub Tab Switcher with Brand Palette and Full Mobile/Desktop Export Actions */}
          <div className="flex flex-col gap-4 bg-[#0D2B52] text-white p-4 sm:p-6 rounded-3xl border border-[#164077] shadow-lg">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div className="min-w-0">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#D4A017] block mb-1">
                  Round Robin League Workspace
                </span>
                <h3 className="text-lg sm:text-xl font-black uppercase tracking-tight break-words">{tournamentName}</h3>
                <p className="text-xs text-slate-300 font-bold mt-0.5 break-words">{subTitle} • {category} Round Robin</p>
              </div>

              <div className="bg-[#08182D]/90 p-1.5 rounded-2xl border border-white/10 grid grid-cols-2 gap-1.5 w-full lg:w-auto sm:flex sm:items-center">
                <button 
                  type="button"
                  onClick={() => setActiveSubTab('fixtures')}
                  className={`min-h-[44px] px-3 py-2 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
                    activeSubTab === 'fixtures' ? 'bg-[#059669] text-white shadow-md' : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <ListFilter size={15} />
                  <span>Fixtures ({matches.length})</span>
                </button>

                <button 
                  type="button"
                  onClick={() => setActiveSubTab('table')}
                  className={`min-h-[44px] px-3 py-2 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
                    activeSubTab === 'table' ? 'bg-[#059669] text-white shadow-md' : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Table size={15} />
                  <span>Standings Table</span>
                </button>
              </div>
            </div>

            {/* Always-Visible Export Action Bar across Mobile, Tablet & Laptop */}
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={handleDownloadPng}
                disabled={isExporting}
                className="min-h-[44px] px-3 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <ImageIcon size={14} />
                <span>PNG</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={isExporting}
                className="min-h-[44px] px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
              >
                <Download size={14} />
                <span>PDF</span>
              </button>

              <button
                type="button"
                onClick={handleExportWord}
                className="min-h-[44px] px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-sm"
              >
                <FileText size={14} />
                <span>Word (.doc)</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadCsv}
                className="min-h-[44px] px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-sm"
              >
                <FileSpreadsheet size={14} />
                <span>CSV</span>
              </button>

              <button 
                type="button"
                onClick={handleWhatsAppQuickShare}
                className="min-h-[44px] px-3.5 py-2 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-md active:scale-95"
                title="Share league fixtures to WhatsApp"
              >
                <Share2 size={14} />
                <span>WhatsApp</span>
              </button>

              <button 
                type="button"
                onClick={() => setIsPrintModalOpen(true)}
                className="min-h-[44px] px-4 py-2 bg-[#D4A017] hover:bg-[#b88b14] text-[#0D2B52] rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-md active:scale-95"
                title="Open interactive print preview with A4/A3 page sizing and Word export"
              >
                <Printer size={14} />
                <span>Print Preview</span>
              </button>
            </div>
          </div>

          {/* VIEW 1: FIXTURES LIST WITH SCORE ENTRY */}
          {activeSubTab === 'fixtures' && (
            <div className="space-y-6">
              {Array.from({ length: totalRoundsCount }, (_, i) => i + 1).map(roundNum => {
                const roundMatches = matches.filter(m => m.roundNumber === roundNum);
                if (roundMatches.length === 0) return null;

                return (
                  <div key={roundNum} className="bg-white p-6 rounded-[2rem] border-2 border-slate-900 shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                        <span className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-black">
                          R{roundNum}
                        </span>
                        <span>Round {roundNum}</span>
                      </h4>
                      <span className="text-xs font-bold text-slate-400">{roundMatches[0]?.date}</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {roundMatches.map(m => (
                        <div key={m.id} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                          <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase">
                            <span>Match #{m.id}</span>
                            <span className="flex items-center gap-1 text-slate-600">
                              <Clock size={12} />
                              <span>{m.time}</span>
                            </span>
                          </div>

                          <div className="flex items-center justify-between gap-2">
                            <div className="flex-1 min-w-0 text-xs font-bold text-slate-900 text-right truncate">
                              {m.team1}
                            </div>

                            {/* Score Inputs - fixed width container so mobile never squishes */}
                            <div className="shrink-0 flex items-center justify-center gap-1.5 px-2 py-1 bg-white border border-slate-200 rounded-xl shadow-xs">
                              <input 
                                type="number" 
                                min={0}
                                placeholder="-"
                                value={m.score1 !== null ? m.score1 : ''}
                                onChange={(e) => handleScoreChange(m.id, e.target.value, m.score2 !== null ? String(m.score2) : '')}
                                aria-label={`${m.team1} score`}
                                className="w-8 h-8 sm:w-9 sm:h-9 bg-slate-50 border border-slate-300 rounded-lg text-center font-black text-xs sm:text-sm outline-none focus:border-indigo-600 focus:bg-white"
                              />
                              <span className="text-xs font-black text-slate-400">:</span>
                              <input 
                                type="number" 
                                min={0}
                                placeholder="-"
                                value={m.score2 !== null ? m.score2 : ''}
                                onChange={(e) => handleScoreChange(m.id, m.score1 !== null ? String(m.score1) : '', e.target.value)}
                                aria-label={`${m.team2} score`}
                                className="w-8 h-8 sm:w-9 sm:h-9 bg-slate-50 border border-slate-300 rounded-lg text-center font-black text-xs sm:text-sm outline-none focus:border-indigo-600 focus:bg-white"
                              />
                            </div>

                            <div className="flex-1 min-w-0 text-xs font-bold text-slate-900 text-left truncate">
                              {m.team2}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* VIEW 2: LEAGUE STANDINGS TABLE */}
          {activeSubTab === 'table' && (
            <div className="bg-white p-5 sm:p-8 rounded-[2.5rem] border-2 border-slate-900 shadow-sm space-y-4 sm:space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 pb-4">
                <h4 className="text-lg sm:text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                  <Trophy size={22} className="text-amber-500 shrink-0" />
                  <span>League Standings Table</span>
                </h4>
                <span className="text-[11px] sm:text-xs font-bold text-slate-500">
                  Win = {winPoints}pts • Draw = {drawPoints}pts • Loss = {lossPoints}pts
                </span>
              </div>

              {/* Mobile swipe helper banner */}
              <div className="sm:hidden px-3 py-1.5 bg-amber-50 border border-amber-200/80 rounded-xl text-[10px] font-bold text-amber-900 flex items-center justify-between">
                <span>Swipe horizontally to view full table →</span>
              </div>

              <div className="w-full overflow-x-auto touch-pan-x pb-2 -mx-1 px-1">
                <table className="w-full min-w-[580px] text-left border-collapse">
                  <thead>
                    <tr className="border-b-2 border-slate-900 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      <th className="p-3 w-12 text-center">Pos</th>
                      <th className="p-3">Team</th>
                      <th className="p-3 text-center">P</th>
                      <th className="p-3 text-center">W</th>
                      <th className="p-3 text-center">D</th>
                      <th className="p-3 text-center">L</th>
                      <th className="p-3 text-center">GF</th>
                      <th className="p-3 text-center">GA</th>
                      <th className="p-3 text-center">GD</th>
                      <th className="p-3 text-center font-black text-slate-900">PTS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {standings.map((st, idx) => (
                      <tr 
                        key={st.team}
                        className={`border-b border-slate-200 ${
                          idx === 0 ? 'bg-amber-50/50 font-black' : 'font-bold'
                        }`}
                      >
                        <td className="p-3 text-center">
                          <span className={`w-6 h-6 rounded-lg text-xs font-black inline-flex items-center justify-center ${
                            idx === 0 ? 'bg-amber-400 text-slate-900' :
                            idx === 1 ? 'bg-slate-300 text-slate-900' :
                            idx === 2 ? 'bg-amber-700 text-white' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {idx + 1}
                          </span>
                        </td>
                        <td className="p-3 text-xs text-slate-900">{st.team}</td>
                        <td className="p-3 text-center text-xs text-slate-600">{st.played}</td>
                        <td className="p-3 text-center text-xs text-emerald-600">{st.won}</td>
                        <td className="p-3 text-center text-xs text-amber-600">{st.drawn}</td>
                        <td className="p-3 text-center text-xs text-rose-600">{st.lost}</td>
                        <td className="p-3 text-center text-xs text-slate-600">{st.gf}</td>
                        <td className="p-3 text-center text-xs text-slate-600">{st.ga}</td>
                        <td className="p-3 text-center text-xs text-slate-900">{st.gd > 0 ? `+${st.gd}` : st.gd}</td>
                        <td className="p-3 text-center text-sm font-black text-indigo-600">{st.pts}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Off-screen Fixed 1200px Sheet for crisp PNG Export regardless of mobile viewport width */}
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
            <div>Format: {leagueType === 'single' ? 'Single Round Robin' : 'Double Round Robin'}</div>
            <div>{teamsList.length} Teams • {matches.length} Matches</div>
          </div>
        </div>

        <h3 className="text-sm font-black uppercase tracking-wider text-[#0D2B52] mb-2">League Standings Table</h3>
        <table className="w-full border-collapse text-xs mb-6">
          <thead>
            <tr className="bg-[#0D2B52] text-white">
              <th className="p-2 border border-slate-300 text-center w-12">Pos</th>
              <th className="p-2 border border-slate-300 text-left">Team</th>
              <th className="p-2 border border-slate-300 text-center">P</th>
              <th className="p-2 border border-slate-300 text-center">W</th>
              <th className="p-2 border border-slate-300 text-center">D</th>
              <th className="p-2 border border-slate-300 text-center">L</th>
              <th className="p-2 border border-slate-300 text-center">GF</th>
              <th className="p-2 border border-slate-300 text-center">GA</th>
              <th className="p-2 border border-slate-300 text-center">GD</th>
              <th className="p-2 border border-slate-300 text-center">PTS</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((st, idx) => (
              <tr key={st.team} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                <td className="p-2 border border-slate-300 text-center font-bold">{idx + 1}</td>
                <td className="p-2 border border-slate-300 font-bold">{st.team}</td>
                <td className="p-2 border border-slate-300 text-center">{st.played}</td>
                <td className="p-2 border border-slate-300 text-center">{st.won}</td>
                <td className="p-2 border border-slate-300 text-center">{st.drawn}</td>
                <td className="p-2 border border-slate-300 text-center">{st.lost}</td>
                <td className="p-2 border border-slate-300 text-center">{st.gf}</td>
                <td className="p-2 border border-slate-300 text-center">{st.ga}</td>
                <td className="p-2 border border-slate-300 text-center">{st.gd > 0 ? `+${st.gd}` : st.gd}</td>
                <td className="p-2 border border-slate-300 text-center font-black">{st.pts}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <h3 className="text-sm font-black uppercase tracking-wider text-[#0D2B52] mb-2">Match Schedule</h3>
        <div className="grid grid-cols-2 gap-3 text-xs">
          {matches.slice(0, 24).map((m) => (
            <div key={m.id} className="border border-slate-300 rounded-lg p-2.5 flex items-center justify-between bg-slate-50">
              <span className="font-black text-[#0D2B52]">M{m.id} (R{m.roundNumber})</span>
              <span className="font-bold flex-1 text-center px-2">
                {m.team1} {m.completed && m.score1 !== null && m.score2 !== null ? `${m.score1}-${m.score2}` : 'vs'} {m.team2}
              </span>
              <span className="text-slate-600 font-semibold">{m.time}</span>
            </div>
          ))}
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
        matchDurationMins={matchDuration}
        restGapMins={restGap}
        winPoints={winPoints}
        drawPoints={drawPoints}
        lossPoints={lossPoints}
        leagueType={leagueType}
        format="roundrobin"
        teamsList={teamsList}
        standings={standings}
        matches={matches.map(m => ({
          name: `Match ${m.id}`,
          roundName: `Round ${m.roundNumber}`,
          roundNumber: m.roundNumber,
          team1: m.team1,
          team2: m.team2,
          date: m.date || startDate,
          time: m.time,
          score1: m.score1,
          score2: m.score2,
          completed: m.completed
        }))}
      />
    </div>
  );
};

export default RoundRobinLeague;
