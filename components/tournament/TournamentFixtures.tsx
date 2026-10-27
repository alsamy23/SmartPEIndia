import React, { useState } from 'react';
import { 
  Trophy, RefreshCw, Sparkles, Layers, Printer, Share2, 
  FileText, Shield, CheckCircle2, ChevronRight, HelpCircle
} from 'lucide-react';
import KnockoutBracket from './KnockoutBracket.tsx';
import RoundRobinLeague from './RoundRobinLeague.tsx';
import CombinationTournament from './CombinationTournament.tsx';
import TournamentPrintPreviewModal from './TournamentPrintPreviewModal.tsx';
import { toast } from '../../services/toast.ts';

export type FixtureMode = 'knockout' | 'roundrobin' | 'combination';

export const TournamentFixtures: React.FC = () => {
  const [fixtureMode, setFixtureMode] = useState<FixtureMode>('knockout');

  // Shared Tournament State across formats
  const [tournamentName, setTournamentName] = useState('Football U-11 Championship');
  const [subTitle, setSubTitle] = useState('Official 16-Team Knockout Fixture');
  const [category, setCategory] = useState('U - 11');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [numTeams, setNumTeams] = useState<number>(16);
  const [teamsList, setTeamsList] = useState<string[]>(() => {
    return Array.from({ length: 16 }, (_, i) => `Team ${i + 1}`);
  });

  // Global Print Preview Modal state
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Quick WhatsApp bulletin trigger
  const handleQuickWhatsApp = () => {
    const text = 
`🏆 *OFFICIAL TOURNAMENT FIXTURES ANNOUNCEMENT*
📌 *Tournament:* ${tournamentName} (${category})
📅 *Date:* ${startDate} | 👥 *Teams:* ${teamsList.length} Teams
🏅 *Current Format:* ${fixtureMode === 'knockout' ? 'Knockout Bracket' : fixtureMode === 'roundrobin' ? 'Round Robin League' : 'Combination Tournament'}
Official CBSE Physical Education Subject Code 048 format.
Generated via SmartPE India Official Tournament Studio.`;
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank');
    toast.success("Opening WhatsApp with tournament summary!");
  };

  return (
    <div className="space-y-8 pb-20 max-w-7xl mx-auto">
      {/* Top Banner & Tagline Header in SmartPE Brand Palette (Navy #0D2B52 & Gold #D4A017) */}
      <div className="bg-[#0D2B52] text-white p-6 sm:p-8 md:p-10 rounded-[2.5rem] border-2 border-[#164077] shadow-xl relative overflow-hidden">
        {/* Subtle decorative brand shapes */}
        <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-[#D4A017]/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute left-1/3 -top-10 w-56 h-56 bg-[#164077]/40 rounded-full blur-2xl pointer-events-none"></div>

        <div className="relative z-10 space-y-4">
          {/* Top Badges & Quick Action Row */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3.5 py-1.5 bg-[#D4A017]/15 border border-[#D4A017]/40 text-[#D4A017] rounded-full text-[11px] font-black uppercase tracking-[0.2em] flex items-center gap-1.5 shadow-xs">
                <Sparkles size={13} className="text-[#D4A017]" />
                <span>Tournament Fixtures</span>
              </span>
              <span className="px-3 py-1 bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 rounded-full text-[10px] font-black uppercase tracking-wider">
                CBSE Class 12 Syllabus Ready
              </span>
            </div>

            {/* Quick Top Print & WhatsApp Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleQuickWhatsApp}
                className="px-3 py-1.5 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md transition-all active:scale-95"
                title="Share quick tournament summary to WhatsApp"
              >
                <Share2 size={13} />
                <span className="hidden sm:inline">WhatsApp</span>
              </button>

              <button
                onClick={() => setIsPrintModalOpen(true)}
                className="px-3.5 py-1.5 bg-[#D4A017] hover:bg-[#b88b14] text-[#0D2B52] rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md transition-all active:scale-95"
                title="Open interactive print preview with A4/A3 paper sizing and Word export"
              >
                <Printer size={13} />
                <span>Print & Preview</span>
              </button>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 pt-1">
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-5xl font-black uppercase tracking-tight text-white font-display">
                Tournament Fixtures Studio
              </h1>
              <p className="text-slate-300 text-xs sm:text-sm md:text-base font-medium mt-2 max-w-2xl leading-relaxed">
                Create official, CBSE-compliant <strong className="text-[#D4A017] font-black">Knockout Brackets</strong>, <strong className="text-emerald-300 font-black">Round Robin League Schedules</strong>, and <strong className="text-amber-200 font-black">Combination Tournaments</strong>.
              </p>
            </div>

            {/* Mode Switcher Tabs - Responsive Segmented Bar on Mobile so Knockout, League & Combination are ALWAYS visible */}
            <div className="w-full lg:w-auto bg-[#08182D]/95 p-1.5 rounded-2xl border border-white/10 shadow-lg flex items-center overflow-x-auto no-scrollbar gap-1.5">
              <button
                type="button"
                onClick={() => setFixtureMode('knockout')}
                className={`flex-1 min-w-[105px] px-3 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shrink-0 ${
                  fixtureMode === 'knockout'
                    ? 'bg-[#D4A017] text-[#0D2B52] shadow-md shadow-amber-950/40 ring-2 ring-[#D4A017]'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <Trophy size={15} className="shrink-0" />
                <span className="whitespace-nowrap">Knockout</span>
              </button>

              <button
                type="button"
                onClick={() => setFixtureMode('roundrobin')}
                className={`flex-1 min-w-[105px] px-3 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shrink-0 ${
                  fixtureMode === 'roundrobin'
                    ? 'bg-[#059669] text-white shadow-md shadow-emerald-950/40 ring-2 ring-emerald-400'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <RefreshCw size={15} className="shrink-0" />
                <span className="whitespace-nowrap">League</span>
              </button>

              <button
                type="button"
                onClick={() => setFixtureMode('combination')}
                className={`flex-1 min-w-[115px] px-3 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shrink-0 ${
                  fixtureMode === 'combination'
                    ? 'bg-[#1D4ED8] text-white shadow-md shadow-blue-950/40 ring-2 ring-blue-400'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <Layers size={15} className="shrink-0" />
                <span className="whitespace-nowrap">Combination</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* RENDER ACTIVE MODE */}
      {fixtureMode === 'knockout' && (
        <KnockoutBracket 
          tournamentName={tournamentName}
          setTournamentName={setTournamentName}
          subTitle={subTitle}
          setSubTitle={setSubTitle}
          category={category}
          setCategory={setCategory}
          startDate={startDate}
          setStartDate={setStartDate}
          numTeams={numTeams}
          setNumTeams={setNumTeams}
          teamsList={teamsList}
          setTeamsList={setTeamsList}
        />
      )}

      {fixtureMode === 'roundrobin' && (
        <RoundRobinLeague 
          tournamentName={tournamentName}
          setTournamentName={setTournamentName}
          subTitle={subTitle}
          setSubTitle={setSubTitle}
          category={category}
          setCategory={setCategory}
          startDate={startDate}
          setStartDate={setStartDate}
          numTeams={numTeams}
          setNumTeams={setNumTeams}
          teamsList={teamsList}
          setTeamsList={setTeamsList}
        />
      )}

      {fixtureMode === 'combination' && (
        <CombinationTournament 
          tournamentName={tournamentName}
          setTournamentName={setTournamentName}
          subTitle={subTitle}
          setSubTitle={setSubTitle}
          category={category}
          setCategory={setCategory}
          startDate={startDate}
          setStartDate={setStartDate}
          numTeams={numTeams}
          setNumTeams={setNumTeams}
          teamsList={teamsList}
          setTeamsList={setTeamsList}
        />
      )}

      {/* Interactive Print Preview Modal */}
      <TournamentPrintPreviewModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        tournamentName={tournamentName}
        subTitle={subTitle}
        category={category}
        sport="Football"
        startDate={startDate}
        startTime="08:00"
        format={fixtureMode}
        teamsList={teamsList}
      />
    </div>
  );
};

export default TournamentFixtures;
