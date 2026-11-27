import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Trophy, Users, Calendar, Clock, Printer, Trash2, Plus, RefreshCw, 
  ChevronRight, ArrowRight, Shield, Download, Sparkles, AlertCircle, CheckCircle2, HelpCircle,
  ExternalLink, Share2, FileText, Check, Copy, LayoutTemplate, Grid, ListOrdered, Image as ImageIcon
} from 'lucide-react';
import { toast } from '../../services/toast.ts';
import { trackEvent } from '../../services/analytics.ts';
import { reportTournamentFailure } from '../../services/telemetryService.ts';
import ClassicSheetBracket from './ClassicSheetBracket.tsx';
import TournamentPrintPreviewModal from './TournamentPrintPreviewModal.tsx';
import { safeOpenExternal, downloadBlobFile } from '../../utils/safeBrowser.ts';
import {
  EliminationType,
  TournamentPdfConfig,
  UnifiedMatch,
  buildSeededKnockoutDraw,
  exportTournamentToCsv,
  formatDisplayDate,
  formatMinutesToTime,
  parseTimeToMinutes
} from './tournamentDrawEngine.ts';
import { buildTournamentVectorPdf } from './TournamentVectorPdf.ts';

export interface Match {
  id: number;
  name: string; // e.g. "Match - 1"
  roundName: string; // e.g. "I - Round"
  team1: string; // "School A" or "Winner of Match X"
  team2: string; // "School B" or "Winner of Match Y"
  time: string; // "08:15 AM"
  date: string;
  isBye?: boolean;
}

export const SAMPLE_IMAGE_TEAMS = [
  "Team 1",
  "Team 2",
  "Team 3",
  "Team 4",
  "Team 5",
  "Team 6",
  "Team 7",
  "Team 8",
  "Team 9",
  "Team 10",
  "Team 11",
  "Team 12",
  "Team 13",
  "Team 14",
  "Team 15",
  "Team 16"
];

export const PRESET_SCHOOLS = [
  "Team 1",
  "Team 2",
  "Team 3",
  "Team 4",
  "Team 5",
  "Team 6",
  "Team 7",
  "Team 8",
  "Team 9",
  "Team 10",
  "Team 11",
  "Team 12",
  "Team 13",
  "Team 14",
  "Team 15",
  "Team 16"
];

export const POPULAR_SPORTS = [
  'Football',
  'Basketball',
  'Volleyball',
  'Cricket',
  'Badminton',
  'Kabaddi',
  'Kho-Kho',
  'Handball',
  'Table Tennis',
  'Tennis',
  'Athletics / Intramurals',
  'Throwball'
];

interface KnockoutBracketProps {
  sport?: string;
  setSport?: (val: string) => void;
  venue?: string;
  setVenue?: (val: string) => void;
  startTime?: string;
  setStartTime?: (val: string) => void;
  courtsCount?: number;
  setCourtsCount?: (val: number) => void;
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

export const KnockoutBracket: React.FC<KnockoutBracketProps> = ({
  sport: controlledSport,
  setSport: setControlledSport,
  venue: controlledVenue,
  setVenue: setControlledVenue,
  startTime: controlledStartTime,
  setStartTime: setControlledStartTime,
  courtsCount: controlledCourtsCount,
  setCourtsCount: setControlledCourtsCount,
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
  // Sport, Venue, Courts & Elimination Type
  const [localSport, setLocalSport] = useState<string>('Football');
  const sport = controlledSport ?? localSport;
  const setSport = setControlledSport ?? setLocalSport;

  const [localVenue, setLocalVenue] = useState<string>('School Main Sports Ground');
  const venue = controlledVenue ?? localVenue;
  const setVenue = setControlledVenue ?? setLocalVenue;

  const [localCourtsCount, setLocalCourtsCount] = useState<number>(2);
  const courtsCount = controlledCourtsCount ?? localCourtsCount;
  const setCourtsCount = setControlledCourtsCount ?? setLocalCourtsCount;

  const [eliminationType, setEliminationType] = useState<EliminationType>('single');

  // Timings & Durations
  const [firstHalf, setFirstHalf] = useState<number>(15);
  const [secondHalf, setSecondHalf] = useState<number>(15);
  const [halfTime, setHalfTime] = useState<number>(5);
  const [restGap, setRestGap] = useState<number>(10);
  const [localStartTime, setLocalStartTime] = useState('08:00');
  const startTime = controlledStartTime ?? localStartTime;
  const setStartTime = setControlledStartTime ?? setLocalStartTime;

  // Third Place Preference
  const [thirdPlaceMode, setThirdPlaceMode] = useState<'none' | 'same' | 'different'>('same');
  const [thirdPlaceDate, setThirdPlaceDate] = useState(new Date().toISOString().split('T')[0]);
  const [thirdPlaceTime, setThirdPlaceTime] = useState('15:15');

  // Format Switcher Tab: 'classic-sheet' | 'cards' | 'table'
  const [activeViewMode, setActiveViewMode] = useState<'classic-sheet' | 'cards' | 'table'>('classic-sheet');

  // Multi-Day Tournament States
  interface DailyConfig {
    date: string;
    startTime: string;
    endTime: string;
  }
  const [numDays, setNumDays] = useState<number>(1);
  const [dailyConfigs, setDailyConfigs] = useState<DailyConfig[]>(() => [
    { date: new Date().toISOString().split('T')[0], startTime: '08:00', endTime: '16:30' }
  ]);
  const [roundDayAssignments, setRoundDayAssignments] = useState<Record<string, number>>({});

  // Keep dailyConfigs in sync with numDays, startDate, and startTime
  useEffect(() => {
    setDailyConfigs(prev => {
      const arr = [...prev];
      if (numDays > arr.length) {
        for (let i = arr.length; i < numDays; i++) {
          const baseDate = new Date(startDate || new Date());
          baseDate.setDate(baseDate.getDate() + i);
          const dayStr = baseDate.toISOString().split('T')[0];
          arr.push({
            date: dayStr,
            startTime: startTime || '08:00',
            endTime: '16:30'
          });
        }
      } else if (numDays < arr.length) {
        arr.length = numDays;
      }
      if (arr[0]) {
        arr[0].date = startDate;
        arr[0].startTime = startTime;
      }
      return arr;
    });
  }, [numDays, startDate, startTime]);

  const getDefaultRoundDay = (roundName: string, totalRoundsCount: number, roundIndex: number, days: number): number => {
    if (days <= 1) return 1;
    if (days === 2) {
      if (roundName.includes("Final") || roundName.includes("Semi") || roundName.includes("Third")) {
        return 2;
      }
      return 1;
    }
    if (days === 3) {
      if (roundName.includes("Final") || roundName.includes("Third")) {
        return 3;
      }
      if (roundName.includes("Semi")) {
        return 2;
      }
      if (roundIndex < Math.floor(totalRoundsCount / 2)) {
        return 1;
      }
      return 2;
    }
    return Math.min(days, Math.floor((roundIndex / totalRoundsCount) * days) + 1);
  };

  // Computed Schedule Bracket Data (Unified with ClassicSheetBracket & Vector PDF)
  const [generatedRounds, setGeneratedRounds] = useState<Array<{ name: string; matches: Array<Match & { court?: string; seed1?: number | null; seed2?: number | null }> }>>([]);
  const [thirdPlaceMatch, setThirdPlaceMatch] = useState<(Match & { court?: string }) | null>(null);
  const [byeSeeds, setByeSeeds] = useState<Set<number>>(new Set());
  const [matchTimeOverrides, setMatchTimeOverrides] = useState<Record<string, { time?: string; date?: string }>>({});
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  const printAreaRef = useRef<HTMLDivElement>(null);

  const setup = React.useMemo(() => {
    const N = teamsList.length;
    const P = Math.min(64, Math.max(4, Math.pow(2, Math.ceil(Math.log2(N || 2)))));
    const byesCount = Math.max(0, P - N);
    const Nu = N % 2 === 0 ? N / 2 : (N + 1) / 2;
    const Nl = N % 2 === 0 ? N / 2 : (N - 1) / 2;
    return { N, P, byesCount, Nu, Nl, byeSeeds };
  }, [teamsList.length, byeSeeds]);

  const buildUnifiedConfig = (overrides?: Record<string, { time?: string; date?: string }>): TournamentPdfConfig => ({
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
    teamsList,
    courtsCount,
    matchDurationMins: firstHalf + secondHalf + halfTime,
    restGapMins: restGap,
    thirdPlaceEnabled: thirdPlaceMode !== 'none',
    matchTimeOverrides: overrides ?? matchTimeOverrides
  });

  const handleWhatsAppQuickShare = () => {
    const allMatches = generatedRounds.flatMap((r) => r.matches);
    const sample = allMatches
      .slice(0, 5)
      .map((m, i) => `• *${m.name || `M${i + 1}`}* (${m.time || startTime}): ${m.team1} vs ${m.team2}`)
      .join('\n');
    const msg =
`🏆 *KNOCKOUT TOURNAMENT FIXTURES*
📌 *Tournament:* ${tournamentName} (${category})
⚽ *Sport:* ${sport} | 📅 *Date:* ${startDate}
👥 *Teams:* ${teamsList.length} | 🎯 *Byes:* ${setup.byesCount}
⏰ *First Match Time:* ${startTime}

📋 *SCHEDULE PREVIEW:*
${sample}
${allMatches.length > 5 ? `\n• ... and ${allMatches.length - 5} more official matches.` : ''}

Official CBSE PE Code 048 format.
Generated via SmartPE India Official Tournament Studio.`;
    safeOpenExternal(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`, "Opening WhatsApp with knockout tournament fixtures!");
  };

  // Quick load sample button
  const loadSampleFootballPreset = () => {
    setSport('Football');
    setCategory('U - 11');
    setStartDate('2026-08-29');
    setStartTime('08:30');
    setNumTeams(16);
    setTeamsList(SAMPLE_IMAGE_TEAMS);
    setTournamentName('Football U-11 Championship');
    setSubTitle('Official 16-Team Knockout Fixture');
    setActiveViewMode('classic-sheet');
    toast.success("Loaded 16-Team Sample Draw (Team 1 to Team 16 with unified timings)!");
  };

  // Update teams array length when numTeams changes
  const handleNumTeamsChange = (n: number) => {
    setNumTeams(n);
    setTeamsList((prev) => {
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
    setTeamsList((prev) => {
      const update = [...prev];
      update[idx] = value;
      return update;
    });
  };

  const handleBulkPaste = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const list = e.target.value
      .split('\n')
      .map((x) => x.trim())
      .filter(Boolean);
    if (list.length > 0) {
      setNumTeams(list.length);
      setTeamsList(list);
    }
  };

  const buildKnockoutBrackets = () => {
    const N = teamsList.length;
    if (N < 2) return;

    const baseTree = buildSeededKnockoutDraw(buildUnifiedConfig({}));

    // Collect Round 1 Bye recipients cleanly for roster badges
    const r1ByeSet = new Set<number>();
    baseTree.rounds[0]?.matches.forEach((m) => {
      if (m.isBye && m.advancesSeed) {
        r1ByeSet.add(m.advancesSeed);
      }
    });
    setByeSeeds(r1ByeSet);

    // Optional multi-day overrides mapped cleanly onto unified matchCodes
    const nextOverrides: Record<string, { time?: string; date?: string }> = {};
    if (numDays > 1) {
      const matchStep = Math.max(10, firstHalf + secondHalf + halfTime + restGap);
      const dayCounters: Record<number, number> = {};
      baseTree.rounds.forEach((rd, rIdx) => {
        const assignedDay =
          roundDayAssignments[rd.roundName] ||
          getDefaultRoundDay(rd.roundName, baseTree.rounds.length, rIdx, numDays);
        const dayCfg = dailyConfigs[assignedDay - 1] || dailyConfigs[0];
        const dayBaseMins = parseTimeToMinutes(dayCfg?.startTime || startTime);
        const dayDate = dayCfg?.date || startDate;

        rd.matches
          .filter((m) => !m.isBye)
          .forEach((m) => {
            const slot = dayCounters[assignedDay] || 0;
            const wave = Math.floor(slot / Math.max(1, courtsCount));
            const tMins = dayBaseMins + wave * matchStep;
            dayCounters[assignedDay] = slot + 1;
            nextOverrides[m.matchCode] = {
              date: dayDate,
              time: formatMinutesToTime(tMins)
            };
          });
      });
    }

    if (baseTree.thirdPlaceMatch && thirdPlaceMode === 'different') {
      nextOverrides[baseTree.thirdPlaceMatch.matchCode] = {
        date: thirdPlaceDate,
        time: formatMinutesToTime(parseTimeToMinutes(thirdPlaceTime))
      };
    }

    setMatchTimeOverrides(nextOverrides);
    const finalTree = Object.keys(nextOverrides).length > 0
      ? buildSeededKnockoutDraw(buildUnifiedConfig(nextOverrides))
      : baseTree;

    const mappedRounds = finalTree.rounds
      .map((rd) => ({
        name: rd.roundName,
        matches: rd.matches
          .filter((m) => !m.isBye)
          .map((m: UnifiedMatch) => ({
            id: m.id,
            name: m.matchCode,
            roundName: m.stage,
            team1: m.seed1 ? `[${m.seed1}] ${m.team1}` : m.team1,
            team2: m.seed2 ? `[${m.seed2}] ${m.team2}` : m.team2,
            seed1: m.seed1,
            seed2: m.seed2,
            time: m.time,
            date: m.date,
            court: m.court,
            isBye: false
          }))
      }))
      .filter((rd) => rd.matches.length > 0);

    setGeneratedRounds(mappedRounds);
    setThirdPlaceMatch(
      finalTree.thirdPlaceMatch
        ? {
            id: finalTree.thirdPlaceMatch.id,
            name: finalTree.thirdPlaceMatch.matchCode,
            roundName: finalTree.thirdPlaceMatch.stage,
            team1: finalTree.thirdPlaceMatch.team1,
            team2: finalTree.thirdPlaceMatch.team2,
            time: finalTree.thirdPlaceMatch.time,
            date: finalTree.thirdPlaceMatch.date,
            court: finalTree.thirdPlaceMatch.court
          }
        : null
    );
  };

  const handleGenerate = () => {
    try {
      if (teamsList.length < 2) {
        toast.error("Please add at least 2 teams to generate a tournament fixture.");
        reportTournamentFailure(
          new Error("Tried to generate fixture with fewer than 2 teams"),
          "Knockout Fixture Generator",
          { teamsCount: teamsList.length }
        ).catch(() => {});
        return;
      }
      buildKnockoutBrackets();
      toast.success("Unified knockout fixture generated successfully!");
      trackEvent('tool_used', { tool_name: 'Knockout Bracket Generator' });
    } catch (err: any) {
      console.error("Fixture generation error:", err);
      toast.error("Failed to generate fixture. Please check your team names and timings.");
      reportTournamentFailure(err, "Knockout Bracket Generator", {
        teamsCount: teamsList.length,
        numDays,
        startTime,
        startDate
      }).catch(() => {});
    }
  };

  useEffect(() => {
    buildKnockoutBrackets();
  }, [
    teamsList,
    startTime,
    startDate,
    firstHalf,
    secondHalf,
    halfTime,
    restGap,
    courtsCount,
    eliminationType,
    thirdPlaceMode,
    thirdPlaceDate,
    thirdPlaceTime,
    numDays
  ]);

  const handleDirectVectorPdf = () => {
    try {
      const { doc, fileName, pageCount } = buildTournamentVectorPdf(buildUnifiedConfig());
      doc.save(fileName);
      toast.success(`Downloaded ${pageCount}-page Vector PDF!`);
      trackEvent('resource_downloaded', {
        resource_name: `Knockout Bracket Vector PDF (${sport})`,
        resource_type: 'Tournament Fixtures',
        format: 'pdf',
        pageCount
      });
    } catch (err) {
      console.error(err);
      toast.error('Could not generate Vector PDF.');
    }
  };

  const handleExportCsv = () => {
    const csv = exportTournamentToCsv(buildUnifiedConfig());
    const blob = new Blob(['\ufeff', csv], { type: 'text/csv;charset=utf-8;' });
    downloadBlobFile(blob, `${(tournamentName || 'Tournament').replace(/\s+/g, '_')}_Fixtures.csv`);
    toast.success('CSV fixture sheet downloaded!');
  };

  const handleExportWordTable = () => {
    const config = buildUnifiedConfig();
    const { rounds, thirdPlaceMatch: tp } = buildSeededKnockoutDraw(config);
    const playable = [...rounds.flatMap((r) => r.matches.filter((m) => !m.isBye)), ...(tp ? [tp] : [])];
    const rowsHtml = playable
      .map(
        (m, idx) => `
        <tr style="background:${idx % 2 === 1 ? '#f8fafc' : '#fff'};">
          <td style="padding:6px; font-weight:bold; text-align:center;">${m.matchCode}</td>
          <td style="padding:6px;">${m.stage}</td>
          <td style="padding:6px; font-weight:bold;">${m.team1}</td>
          <td style="padding:6px; text-align:center;">VS</td>
          <td style="padding:6px; font-weight:bold;">${m.team2}</td>
          <td style="padding:6px; text-align:center;">${m.date} • ${m.time}</td>
          <td style="padding:6px; text-align:center;">${m.court}</td>
        </tr>`
      )
      .join('');
    const html = `<html><head><meta charset="utf-8"></head><body style="font-family:Arial,sans-serif;">
      <h2>${tournamentName} (${sport} • ${category})</h2>
      <p>Venue: ${venue} | Date: ${formatDisplayDate(startDate)}</p>
      <table border="1" cellspacing="0" cellpadding="4" style="width:100%; border-collapse:collapse; font-size:10pt;">
        <tr style="background:#0D2B52; color:#fff;"><th>Match</th><th>Stage</th><th>Team 1</th><th>VS</th><th>Team 2</th><th>Date & Time</th><th>Court</th></tr>
        ${rowsHtml}
      </table>
    </body></html>`;
    downloadBlobFile(new Blob(['\ufeff', html], { type: 'application/msword' }), `${(tournamentName || 'Tournament').replace(/\s+/g, '_')}_Matches.doc`);
    toast.success('Word (.doc) match schedule exported!');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Form Setup Card */}
      <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border-2 border-slate-900 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-6">
          <div>
            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter flex items-center gap-2">
              <Trophy size={24} className="text-amber-500" />
              <span>Knockout Bracket Configurator</span>
            </h3>
            <p className="text-xs font-bold text-slate-500 mt-1">
              Supports both <strong className="text-red-600">Classic Sheet Tree (Image format)</strong> and <strong className="text-indigo-600">Versus Match Cards</strong>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={loadSampleFootballPreset}
              className="px-3.5 py-2 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-sm"
              title="Load 16 teams (Team 1 to Team 16) with sample match timings"
            >
              <Sparkles size={14} className="text-red-500" />
              <span>Load 16-Team Sample Draw (Team 1 - 16)</span>
            </button>

            <span className="px-3 py-1 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-[10px] font-black uppercase tracking-wider">
              {teamsList.length} Teams
            </span>
            <span className="px-3 py-1 bg-indigo-50 border border-indigo-200 text-indigo-800 rounded-xl text-[10px] font-black uppercase tracking-wider">
              {setup.byesCount} Byes
            </span>
          </div>
        </div>

        {/* Sport, Tournament Name, Category */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Sport Discipline</label>
            <select
              value={sport}
              onChange={(e) => setSport(e.target.value)}
              className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl font-bold text-slate-900 outline-none focus:border-indigo-600 transition-all text-sm"
            >
              {POPULAR_SPORTS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Tournament Name</label>
            <input 
              type="text" 
              value={tournamentName}
              onChange={(e) => setTournamentName(e.target.value)}
              className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl font-bold text-slate-900 outline-none focus:border-indigo-600 transition-all text-sm"
            />
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Age Category / Division</label>
            <input 
              type="text" 
              value={category}
              placeholder="e.g. U - 11, U - 14, Senior Boys"
              onChange={(e) => setCategory(e.target.value)}
              className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl font-bold text-slate-900 outline-none focus:border-indigo-600 transition-all text-sm"
            />
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Subtitle / Sub-category</label>
            <input 
              type="text" 
              value={subTitle}
              onChange={(e) => setSubTitle(e.target.value)}
              className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl font-bold text-slate-900 outline-none focus:border-indigo-600 transition-all text-sm"
            />
          </div>
        </div>

        {/* Date, Teams Count, Duration */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 pt-2">
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Number of Teams</label>
            <input 
              type="number" 
              min={2}
              max={64}
              value={numTeams}
              onChange={(e) => handleNumTeamsChange(parseInt(e.target.value) || 2)}
              className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl font-bold text-slate-900 outline-none focus:border-indigo-600 transition-all text-sm"
            />
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Tournament Date</label>
            <input 
              type="date" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl font-bold text-slate-900 outline-none focus:border-indigo-600 transition-all text-sm"
            />
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">First Match Start Time</label>
            <input 
              type="time" 
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl font-bold text-slate-900 outline-none focus:border-indigo-600 transition-all text-sm"
            />
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Tournament Duration (Days)</label>
            <select
              value={numDays}
              onChange={(e) => setNumDays(parseInt(e.target.value))}
              className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl font-bold text-slate-900 outline-none focus:border-indigo-600 transition-all text-sm"
            >
              <option value={1}>Single Day Event</option>
              <option value={2}>2 Days Championship</option>
              <option value={3}>3 Days Championship</option>
            </select>
          </div>
        </div>

        {/* Elimination Format, Venue & Courts/Pitches */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Elimination Format</label>
            <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-100 rounded-2xl border border-slate-200">
              <button
                type="button"
                onClick={() => setEliminationType('single')}
                className={`py-2.5 px-3 rounded-xl text-xs font-black uppercase transition-all ${
                  eliminationType === 'single'
                    ? 'bg-[#0D2B52] text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Single KO
              </button>
              <button
                type="button"
                onClick={() => setEliminationType('double')}
                className={`py-2.5 px-3 rounded-xl text-xs font-black uppercase transition-all ${
                  eliminationType === 'double'
                    ? 'bg-[#0D2B52] text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Double Elim
              </button>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Venue / Ground</label>
            <input
              type="text"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              placeholder="e.g. Main Stadium / Indoor Hall"
              className="w-full p-3.5 bg-slate-50 border-2 border-slate-200 rounded-2xl font-bold text-slate-900 outline-none focus:border-indigo-600 transition-all text-sm"
            />
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Active Courts / Pitches</label>
            <select
              value={courtsCount}
              onChange={(e) => setCourtsCount(parseInt(e.target.value, 10))}
              className="w-full p-3.5 bg-slate-50 border-2 border-slate-200 rounded-2xl font-bold text-slate-900 outline-none focus:border-indigo-600 transition-all text-sm"
            >
              {[1, 2, 3, 4, 6, 8].map((n) => (
                <option key={n} value={n}>{n} {n === 1 ? 'Court / Pitch' : 'Courts / Pitches'}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Timings breakdown */}
        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-700 flex items-center gap-2">
              <Clock size={16} className="text-indigo-600" />
              <span>Match Duration & Rest Interval Settings</span>
            </h4>
            <span className="text-[11px] font-bold text-indigo-600">Total Match Block: {firstHalf + secondHalf + halfTime + restGap} mins</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">1st Half (Mins)</label>
              <input 
                type="number" 
                min={0}
                value={firstHalf}
                onChange={(e) => setFirstHalf(parseInt(e.target.value) || 0)}
                className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold text-xs"
              />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">2nd Half (Mins)</label>
              <input 
                type="number" 
                min={0}
                value={secondHalf}
                onChange={(e) => setSecondHalf(parseInt(e.target.value) || 0)}
                className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold text-xs"
              />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Half-Time Break (Mins)</label>
              <input 
                type="number" 
                min={0}
                value={halfTime}
                onChange={(e) => setHalfTime(parseInt(e.target.value) || 0)}
                className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold text-xs"
              />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Gap Between Matches (Mins)</label>
              <input 
                type="number" 
                min={0}
                value={restGap}
                onChange={(e) => setRestGap(parseInt(e.target.value) || 0)}
                className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold text-xs"
              />
            </div>
          </div>
        </div>

        {/* Team Roster Customization */}
        <div className="space-y-4 pt-2">
          <div className="flex justify-between items-center">
            <label className="text-xs font-black uppercase tracking-widest text-slate-700 flex items-center gap-2">
              <Users size={16} className="text-indigo-600" />
              <span>Participating Team Roster ({teamsList.length} Teams / Schools)</span>
            </label>
            <span className="text-[10px] font-bold text-slate-400">Edit individual names or paste below</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 lg:max-h-64 lg:overflow-y-auto p-2 bg-slate-50 rounded-2xl border border-slate-200 custom-scrollbar">
            {teamsList.map((team, idx) => {
              const isBye = setup.byeSeeds.has(idx + 1);
              return (
                <div key={idx} className="flex items-center gap-2 bg-white p-2.5 rounded-xl border border-slate-200">
                  <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-600 font-black text-[10px] flex items-center justify-center flex-shrink-0">
                    {idx + 1}
                  </span>
                  <input 
                    type="text" 
                    value={team}
                    onChange={(e) => handleTeamNameChange(idx, e.target.value)}
                    className="w-full text-xs font-bold text-slate-800 bg-transparent outline-none uppercase"
                  />
                  {isBye && (
                    <span className="px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded text-[9px] font-black uppercase flex-shrink-0">
                      1st Bye
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Bulk Paste Schools (One team per line)</label>
            <textarea 
              rows={3}
              placeholder="Paste list of participating schools line by line..."
              onChange={handleBulkPaste}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl font-medium text-xs text-slate-800 outline-none focus:border-indigo-600 transition-all uppercase"
            />
          </div>
        </div>

        {/* Generate Button */}
        <button 
          onClick={handleGenerate}
          className="w-full py-4 md:py-5 bg-indigo-600 hover:bg-indigo-700 text-white border-2 border-slate-900 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] flex items-center justify-center gap-3 cursor-pointer"
        >
          <Sparkles size={20} />
          <span>Update & Regenerate Fixture Schedule</span>
        </button>
      </div>

      {/* CBSE Formula Statistics Board */}
      <div className="bg-white p-6 rounded-[2rem] border-2 border-slate-900 shadow-sm grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center">
          <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Teams (N)</div>
          <div className="text-2xl font-black text-slate-900">{setup.N}</div>
        </div>
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center">
          <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Next Power of 2 (P)</div>
          <div className="text-2xl font-black text-slate-900">{setup.P}</div>
        </div>
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center">
          <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Byes (P - N)</div>
          <div className="text-2xl font-black text-indigo-600">{setup.byesCount}</div>
        </div>
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center">
          <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Upper Half (Nu)</div>
          <div className="text-2xl font-black text-slate-900">{setup.Nu}</div>
        </div>
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center col-span-2 md:col-span-1">
          <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Lower Half (Nl)</div>
          <div className="text-2xl font-black text-slate-900">{setup.Nl}</div>
        </div>
      </div>

      {/* VIEW MODE SELECTION TABS & EXPORT ACTIONS */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-[#0D2B52] text-white p-4 md:p-6 rounded-3xl shadow-lg border border-[#164077]">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-[#D4A017] block mb-1">
            Choose Preferred Bracket Layout
          </span>
          <h3 className="text-lg md:text-xl font-black uppercase tracking-tight">
            {tournamentName || 'Championship Draw'}
          </h3>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full lg:w-auto">
          {/* 3 View Tabs */}
          <div className="bg-[#08182D]/90 p-1.5 rounded-2xl border border-white/10 grid grid-cols-3 gap-1 sm:flex sm:items-center">
            <button
              onClick={() => setActiveViewMode('classic-sheet')}
              className={`px-3 py-2 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                activeViewMode === 'classic-sheet'
                  ? 'bg-[#D4A017] text-[#0D2B52] shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <LayoutTemplate size={14} />
              <span className="truncate">Classic Sheet</span>
            </button>

            <button
              onClick={() => setActiveViewMode('cards')}
              className={`px-3 py-2 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                activeViewMode === 'cards'
                  ? 'bg-[#164077] text-white border border-[#D4A017]/40 shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Trophy size={14} />
              <span className="truncate">Cards</span>
            </button>

            <button
              onClick={() => setActiveViewMode('table')}
              className={`px-3 py-2 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                activeViewMode === 'table'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <ListOrdered size={14} />
              <span className="truncate">Table</span>
            </button>
          </div>

          {/* Quick Action Buttons (Always visible across mobile, tablet & laptop) */}
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleDirectVectorPdf}
              className="min-h-[44px] px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all"
              title="Download pure Vector PDF"
            >
              <Download size={14} className="shrink-0" />
              <span>PDF</span>
            </button>

            <button
              type="button"
              onClick={handleExportCsv}
              className="min-h-[44px] px-3.5 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all"
              title="Download CSV spreadsheet"
            >
              <Download size={14} className="shrink-0" />
              <span>CSV</span>
            </button>

            <button
              type="button"
              onClick={handleWhatsAppQuickShare}
              className="min-h-[44px] px-3.5 py-2 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all"
              title="Share knockout fixtures to WhatsApp"
            >
              <Share2 size={14} className="shrink-0" />
              <span>WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={() => setIsPrintModalOpen(true)}
              className="min-h-[44px] px-4 py-2 bg-[#D4A017] hover:bg-[#b88b14] text-[#0D2B52] rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all"
              title="Open print preview with A4/A3 page sizing and Word export"
            >
              <Printer size={14} className="shrink-0" />
              <span>Print Preview</span>
            </button>
          </div>
        </div>
      </div>

      {/* RENDER SELECTED VIEW FORMAT */}
      {activeViewMode === 'classic-sheet' && (
        <ClassicSheetBracket 
          sport={sport}
          tournamentName={tournamentName}
          subTitle={subTitle}
          category={category}
          venue={venue}
          startDate={startDate}
          teamsList={teamsList}
          firstHalf={firstHalf}
          secondHalf={secondHalf}
          halfTime={halfTime}
          restGap={restGap}
          startTime={startTime}
          courtsCount={courtsCount}
          eliminationType={eliminationType}
          thirdPlaceEnabled={thirdPlaceMode !== 'none'}
          showGridLines={true}
        />
      )}

      {activeViewMode === 'cards' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-5 sm:p-6 rounded-[2rem] border-2 border-slate-900 shadow-sm">
            <div>
              <h4 className="text-lg font-black text-slate-900 uppercase">Versus Match Cards</h4>
              <p className="text-xs text-slate-500 font-bold">Round-by-round seeded match pairings with unified timings & courts.</p>
            </div>
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleDirectVectorPdf}
                className="min-h-[44px] px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5"
              >
                <Download size={15} />
                <span>PDF</span>
              </button>
              <button
                type="button"
                onClick={handleExportWordTable}
                className="min-h-[44px] px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5"
              >
                <FileText size={15} />
                <span>Word (.doc)</span>
              </button>
              <button
                type="button"
                onClick={handleExportCsv}
                className="min-h-[44px] px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5"
              >
                <Download size={15} />
                <span>CSV</span>
              </button>
              <button
                type="button"
                onClick={() => setIsPrintModalOpen(true)}
                className="min-h-[44px] px-4 py-2 bg-[#D4A017] hover:bg-[#b88b14] text-[#0D2B52] rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5"
              >
                <Printer size={15} />
                <span>Print Preview</span>
              </button>
            </div>
          </div>

          <div ref={printAreaRef} className="print-bracket-canvas space-y-8">
            {generatedRounds.map((round: any, rIdx: number) => (
              <div key={rIdx} className="bg-white p-6 rounded-[2rem] border-2 border-slate-900 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                    <span className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-black">
                      R{rIdx + 1}
                    </span>
                    <span>{round.name}</span>
                  </h4>
                  <span className="text-xs font-black uppercase tracking-widest text-slate-400">
                    {round.matches.length} Matches
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {round.matches.map((match: Match) => (
                    <div key={match.id} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                      <div className="flex justify-between items-center border-b border-slate-200/60 pb-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-lg border border-indigo-100">
                          {match.name}
                        </span>
                        {match.time && (
                          <span className="text-[10px] font-black text-slate-500 flex items-center gap-1">
                            <Clock size={12} />
                            <span>{match.time}</span>
                          </span>
                        )}
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-200">
                          <span className="text-xs font-bold text-slate-900 uppercase">{match.team1}</span>
                          <span className="text-[10px] font-black text-slate-400 uppercase">Team 1</span>
                        </div>
                        <div className="text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">VS</div>
                        <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-200">
                          <span className="text-xs font-bold text-slate-900 uppercase">{match.team2}</span>
                          <span className="text-[10px] font-black text-slate-400 uppercase">Team 2</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {thirdPlaceMatch && (
              <div className="bg-amber-50/50 p-6 rounded-[2rem] border-2 border-amber-300 shadow-sm space-y-4">
                <h4 className="text-lg font-black text-amber-900 uppercase tracking-tight flex items-center gap-2">
                  <Trophy size={20} className="text-amber-600" />
                  <span>3rd Place Play-Off Match</span>
                </h4>

                <div className="bg-white p-4 rounded-2xl border border-amber-200 max-w-md space-y-3">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-600">
                      {thirdPlaceMatch.name}
                    </span>
                    {thirdPlaceMatch.time && (
                      <span className="text-[10px] font-black text-slate-500 flex items-center gap-1">
                        <Clock size={12} />
                        <span>{thirdPlaceMatch.time}</span>
                      </span>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 uppercase">
                      {thirdPlaceMatch.team1}
                    </div>
                    <div className="text-center text-[10px] font-black text-slate-400 uppercase">VS</div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 uppercase">
                      {thirdPlaceMatch.team2}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeViewMode === 'table' && (
        <div className="bg-white p-4 sm:p-6 md:p-8 rounded-[2rem] sm:rounded-[2.5rem] border-2 border-slate-900 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-4">
            <div>
              <h4 className="text-lg font-black text-slate-900 uppercase">Official Match Fixture Table</h4>
              <p className="text-xs text-slate-500 font-bold">Unified seeded match list matching Classic Sheet & Vector PDF.</p>
            </div>
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleDirectVectorPdf}
                className="min-h-[44px] px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5"
              >
                <Download size={14} />
                <span>PDF</span>
              </button>
              <button
                type="button"
                onClick={handleExportWordTable}
                className="min-h-[44px] px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5"
              >
                <FileText size={14} />
                <span>Word (.doc)</span>
              </button>
              <button
                type="button"
                onClick={handleExportCsv}
                className="min-h-[44px] px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5"
              >
                <Download size={14} />
                <span>CSV</span>
              </button>
              <button
                type="button"
                onClick={() => setIsPrintModalOpen(true)}
                className="min-h-[44px] px-4 py-2 bg-[#D4A017] hover:bg-[#b88b14] text-[#0D2B52] rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5"
              >
                <Printer size={14} />
                <span>Print Preview</span>
              </button>
            </div>
          </div>

          <div className="sm:hidden px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-xl text-[11px] font-bold text-amber-900">
            Swipe horizontally to view full schedule table &rarr;
          </div>

          <div className="w-full overflow-x-auto [touch-action:pan-x_pan-y] pb-2">
            <table className="w-full min-w-[680px] text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-900 bg-slate-50 text-[10px] font-black uppercase tracking-wider text-slate-500">
                  <th className="p-3">Match #</th>
                  <th className="p-3">Stage / Round</th>
                  <th className="p-3">Team 1</th>
                  <th className="p-3 text-center">VS</th>
                  <th className="p-3">Team 2</th>
                  <th className="p-3">Court</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Scheduled Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-bold text-slate-800">
                {generatedRounds.flatMap((round) => round.matches).map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50">
                    <td className="p-3 font-black text-indigo-600">{m.name}</td>
                    <td className="p-3">{m.roundName}</td>
                    <td className="p-3 uppercase text-slate-900">{m.team1}</td>
                    <td className="p-3 text-center text-slate-400 font-black text-[10px]">VS</td>
                    <td className="p-3 uppercase text-slate-900">{m.team2}</td>
                    <td className="p-3 text-slate-600">{m.court || 'Field 1'}</td>
                    <td className="p-3 text-slate-600 whitespace-nowrap">{m.date || startDate}</td>
                    <td className="p-3 font-black text-red-600 whitespace-nowrap">{m.time || 'TBD'}</td>
                  </tr>
                ))}
                {thirdPlaceMatch && (
                  <tr className="bg-amber-50/40 hover:bg-amber-50">
                    <td className="p-3 font-black text-amber-700">{thirdPlaceMatch.name}</td>
                    <td className="p-3">{thirdPlaceMatch.roundName}</td>
                    <td className="p-3 uppercase text-slate-900">{thirdPlaceMatch.team1}</td>
                    <td className="p-3 text-center text-slate-400 font-black text-[10px]">VS</td>
                    <td className="p-3 uppercase text-slate-900">{thirdPlaceMatch.team2}</td>
                    <td className="p-3 text-slate-600">{thirdPlaceMatch.court || 'Field 2'}</td>
                    <td className="p-3 text-slate-600 whitespace-nowrap">{thirdPlaceMatch.date || startDate}</td>
                    <td className="p-3 font-black text-red-600 whitespace-nowrap">{thirdPlaceMatch.time || 'TBD'}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

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
        matchDurationMins={firstHalf + secondHalf + halfTime}
        restGapMins={restGap}
        thirdPlaceEnabled={thirdPlaceMode !== 'none'}
        format="knockout"
        teamsList={teamsList}
        matchTimeOverrides={matchTimeOverrides}
        rounds={generatedRounds}
        matches={generatedRounds.flatMap((round) => round.matches)}
        byesCount={setup.byesCount}
        setupFormula={{
          totalTeams: setup.N,
          powerOfTwo: setup.P,
          byesCount: setup.byesCount,
          upperHalfTeams: setup.Nu,
          lowerHalfTeams: setup.Nl,
          upperHalfByes: Math.floor(setup.byesCount / 2),
          lowerHalfByes: Math.ceil(setup.byesCount / 2),
          totalMatches: Math.max(0, setup.N - 1),
          totalRounds: Math.ceil(Math.log2(setup.P || 2))
        }}
      />
    </div>
  );
};

export default KnockoutBracket;
