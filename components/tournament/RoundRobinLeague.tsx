import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { 
  Trophy, Users, Calendar, Clock, Printer, Plus, RefreshCw, 
  ChevronRight, ArrowRight, Shield, Download, Sparkles, AlertCircle, 
  CheckCircle2, Share2, FileText, Check, Copy, Table, ListFilter, Activity
} from 'lucide-react';
import { toast } from '../../services/toast.ts';
import { trackEvent } from '../../services/analytics.ts';
import { PRESET_SCHOOLS } from './KnockoutBracket.tsx';
import TournamentPrintPreviewModal from './TournamentPrintPreviewModal.tsx';

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

  const printAreaRef = useRef<HTMLDivElement>(null);

  const handleWhatsAppQuickShare = () => {
    const sample = matches.slice(0, 5).map((m, i) => `• *Match ${m.id}* (${m.time}): ${m.team1} vs ${m.team2}`).join('\n');
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
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`, '_blank');
    toast.success("Opening WhatsApp with league schedule!");
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
      return b.gf - a.gf;
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
      <div className="bg-white p-8 rounded-[2.5rem] border-2 border-slate-900 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-6">
          <div>
            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter flex items-center gap-2">
              <RefreshCw size={24} className="text-indigo-600" />
              <span>Round Robin League Configurator</span>
            </h3>
            <p className="text-xs font-bold text-slate-500 mt-1">
              Standard All-Play-All format using Cyclic & Tabular methods with live score entry & standings table.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-indigo-50 border border-indigo-200 text-indigo-800 rounded-xl text-[10px] font-black uppercase tracking-wider">
              {totalMatchesCount} Total Matches
            </span>
            <span className="px-3 py-1 bg-pink-50 border border-pink-200 text-pink-800 rounded-xl text-[10px] font-black uppercase tracking-wider">
              {totalRoundsCount} League Rounds
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Subtitle / Description</label>
            <input 
              type="text" 
              value={subTitle}
              onChange={(e) => setSubTitle(e.target.value)}
              className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl font-bold text-slate-900 outline-none focus:border-indigo-600 transition-all text-sm"
            />
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Category / Division</label>
            <input 
              type="text" 
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl font-bold text-slate-900 outline-none focus:border-indigo-600 transition-all text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pt-2">
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">League Format</label>
            <select
              value={leagueType}
              onChange={(e) => setLeagueType(e.target.value as any)}
              className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl font-bold text-slate-900 outline-none focus:border-indigo-600 transition-all text-sm"
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
              className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl font-bold text-slate-900 outline-none focus:border-indigo-600 transition-all text-sm"
            />
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Start Date</label>
            <input 
              type="date" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl font-bold text-slate-900 outline-none focus:border-indigo-600 transition-all text-sm"
            />
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">First Match Time</label>
            <input 
              type="time" 
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl font-bold text-slate-900 outline-none focus:border-indigo-600 transition-all text-sm"
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
          {/* Sub Tab Switcher with Brand Palette and Actions */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-[#0D2B52] text-white p-4 md:p-6 rounded-3xl border border-[#164077] shadow-lg">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-[#D4A017] block mb-1">
                Round Robin League Workspace
              </span>
              <h3 className="text-xl font-black uppercase tracking-tight">{tournamentName}</h3>
              <p className="text-xs text-slate-300 font-bold mt-0.5">{subTitle} • {category} Round Robin</p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full lg:w-auto">
              <div className="bg-[#08182D]/90 p-1.5 rounded-2xl border border-white/10 grid grid-cols-2 gap-1 sm:flex sm:items-center">
                <button 
                  onClick={() => setActiveSubTab('fixtures')}
                  className={`px-3 py-2 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
                    activeSubTab === 'fixtures' ? 'bg-[#059669] text-white shadow-md' : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <ListFilter size={15} />
                  <span>Fixtures ({matches.length})</span>
                </button>

                <button 
                  onClick={() => setActiveSubTab('table')}
                  className={`px-3 py-2 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
                    activeSubTab === 'table' ? 'bg-[#059669] text-white shadow-md' : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Table size={15} />
                  <span>Standings Table</span>
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button 
                  onClick={handleWhatsAppQuickShare}
                  className="flex-1 sm:flex-initial px-3.5 py-2 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-md active:scale-95"
                  title="Share league fixtures to WhatsApp"
                >
                  <Share2 size={14} />
                  <span>WhatsApp</span>
                </button>

                <button 
                  onClick={() => setIsPrintModalOpen(true)}
                  className="flex-1 sm:flex-initial px-4 py-2 bg-[#D4A017] hover:bg-[#b88b14] text-[#0D2B52] rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-md active:scale-95"
                  title="Open interactive print preview with A4/A3 page sizing and Word export"
                >
                  <Printer size={14} />
                  <span>Print Preview</span>
                </button>
              </div>
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
                <span>👉 Swipe right to view full stats (GD, Points)</span>
              </div>

              <div className="overflow-x-auto pb-2 -mx-1 px-1">
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

      {/* Interactive Print Preview Modal with A4/A3 sizing, Word export and WhatsApp share */}
      <TournamentPrintPreviewModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        tournamentName={tournamentName}
        subTitle={subTitle}
        category={category}
        sport="Football"
        startDate={startDate}
        startTime={startTime}
        format="roundrobin"
        teamsList={teamsList}
        matches={matches.map(m => ({
          name: `Match ${m.id}`,
          roundName: `Round ${m.roundNumber}`,
          team1: m.team1,
          team2: m.team2,
          date: m.date || startDate,
          time: m.time
        }))}
      />
    </div>
  );
};

export default RoundRobinLeague;
