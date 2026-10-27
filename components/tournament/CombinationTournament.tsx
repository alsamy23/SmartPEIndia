import React, { useState, useMemo } from 'react';
import { 
  Layers, Trophy, RefreshCw, Calendar, Clock, Printer, 
  Share2, FileText, Sparkles, Shield, ChevronRight, CheckCircle2,
  Users, AlertCircle
} from 'lucide-react';
import { toast } from '../../services/toast.ts';
import TournamentPrintPreviewModal from './TournamentPrintPreviewModal.tsx';

interface CombinationTournamentProps {
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
  const [sport, setSport] = useState<string>('Football');
  const [startTime, setStartTime] = useState('08:30');
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

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
    window.open(url, '_blank');
    toast.success("Opening WhatsApp with combination fixtures summary!");
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Top Format Selector Card */}
      <div className="bg-white p-5 sm:p-8 rounded-[2.5rem] border-2 border-slate-900 shadow-sm space-y-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-slate-100 pb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#0D2B52] text-[#D4A017] rounded-2xl flex items-center justify-center font-black shrink-0">
              <Layers size={24} />
            </div>
            <div>
              <h3 className="text-xl md:text-2xl font-black text-slate-900 uppercase tracking-tight">
                Combination Tournament Studio
              </h3>
              <p className="text-xs font-bold text-slate-500 mt-0.5">
                CBSE Class 12 Syllabus: League-cum-Knockout & Knockout-cum-League Multi-Pool Formats
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            <button
              onClick={() => setIsPrintModalOpen(true)}
              className="flex-1 sm:flex-initial px-4 py-2.5 bg-[#D4A017] hover:bg-[#b88b14] text-[#0D2B52] rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95"
            >
              <Printer size={15} />
              <span>Print Preview</span>
            </button>

            <button
              onClick={handleWhatsAppQuickShare}
              className="flex-1 sm:flex-initial px-4 py-2.5 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95"
            >
              <Share2 size={15} />
              <span>WhatsApp</span>
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

          <div className="flex sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 overflow-x-auto no-scrollbar pb-2 sm:pb-0">
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
            <div className="flex items-center overflow-x-auto no-scrollbar gap-1.5 pb-1">
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
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-black uppercase whitespace-nowrap transition-all ${
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
            <span>👉 Swipe right to view Semi-Finals & Championship Final</span>
          </div>

          {/* Sequential Playoff Columns with smooth horizontal overflow */}
          <div className="overflow-x-auto pb-3 -mx-1 px-1">
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

      {/* Print Preview Modal */}
      <TournamentPrintPreviewModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        tournamentName={tournamentName}
        subTitle={subTitle}
        category={category}
        sport={sport}
        startDate={startDate}
        startTime={startTime}
        format="combination"
        teamsList={teamsList}
        matches={poolMatches.map((m, i) => ({
          name: m.matchId,
          roundName: m.poolName,
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
