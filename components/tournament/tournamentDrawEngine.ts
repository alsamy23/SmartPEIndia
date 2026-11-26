// Pure TypeScript Tournament Draw, Seeding, Pool & Schedule Engine
// Single source of truth for Vector PDF Generation, Paginated Print Preview, and UI Draws.

export type TournamentFormat = 'knockout' | 'roundrobin' | 'combination';
export type EliminationType = 'single' | 'double';
export type PaperSize = 'A4' | 'A3';
export type ExportViewMode =
  | 'full-bracket'
  | 'round-robin-pools'
  | 'team-view'
  | 'master-schedule'
  | 'complete-pack';

export interface UnifiedMatch {
  id: number;
  matchCode: string; // e.g. M1, M2, WB-M1, LB-M1, GF, P-A1
  stage: string; // e.g. 'Round of 16', 'Quarterfinals', 'Pool A', 'Losers R1'
  roundIndex: number;
  matchIndexInRound: number;
  team1: string;
  team2: string;
  seed1?: number | null;
  seed2?: number | null;
  isBye?: boolean;
  isTeam1Bye?: boolean;
  isTeam2Bye?: boolean;
  advancesTeam?: string;
  advancesSeed?: number | null;
  date: string;
  time: string;
  timeMinutes: number;
  court: string;
  score1?: number | string | null;
  score2?: number | string | null;
  completed?: boolean;
  poolName?: string;
  roundNumber?: number;
}

export interface KnockoutSlotNode {
  slotIndex: number; // 0 .. P-1
  seed: number; // 1 .. P
  teamName: string;
  isBye: boolean;
}

export interface KnockoutRoundData {
  roundIndex: number;
  roundName: string;
  shortName: string;
  matches: UnifiedMatch[];
}

export interface KnockoutDrawTree {
  N: number;
  P: number;
  byesCount: number;
  totalRounds: number;
  slots: KnockoutSlotNode[];
  rounds: KnockoutRoundData[];
  thirdPlaceMatch: UnifiedMatch | null;
  losersRounds: KnockoutRoundData[];
  grandFinalMatch: UnifiedMatch | null;
  allPlayableMatches: UnifiedMatch[];
}

export interface PoolStandingRow {
  pos: number;
  team: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number;
  ga: number;
  gd: number;
  pts: number;
}

export interface PoolData {
  poolName: string;
  teams: string[];
  standings: PoolStandingRow[];
  matches: UnifiedMatch[];
  crossTable: Record<string, Record<string, string>>;
}

export interface TeamScheduleEntry {
  matchCode: string;
  stage: string;
  opponent: string;
  court: string;
  date: string;
  time: string;
  timeMinutes: number;
  scoreDisplay: string;
}

export interface TeamScheduleGroup {
  teamName: string;
  seedOrPool: string;
  matches: TeamScheduleEntry[];
}

export interface TournamentPdfConfig {
  organizationName: string;
  tournamentName: string;
  subTitle?: string;
  sport: string;
  category: string;
  venue: string;
  startDate: string;
  startTime: string;
  format: TournamentFormat;
  eliminationType?: EliminationType;
  paperSize: PaperSize;
  viewMode: ExportViewMode;
  teamsList: string[];
  courtsCount?: number;
  courtPrefix?: string;
  matchDurationMins?: number;
  restGapMins?: number;
  thirdPlaceEnabled?: boolean;
  winPoints?: number;
  drawPoints?: number;
  lossPoints?: number;
  tieBreakerRule?: string;
  directorName?: string;
  chiefRefereeName?: string;
  // Optional pre-existing matches/scores from interactive Round Robin / Combination / Knockout states
  existingMatches?: Array<{
    id?: number | string;
    name?: string;
    roundName?: string;
    roundNumber?: number;
    poolName?: string;
    team1: string;
    team2: string;
    date?: string;
    time?: string;
    court?: string;
    score1?: number | null;
    score2?: number | null;
    completed?: boolean;
  }>;
  existingStandings?: Array<{
    team: string;
    played: number;
    won: number;
    drawn: number;
    lost: number;
    gf: number;
    ga: number;
    gd: number;
    pts: number;
  }>;
  leagueType?: 'single' | 'double';
  matchTimeOverrides?: Record<string, { time?: string; date?: string; court?: string }>;
}

export const truncateText = (text: string, maxChars = 24): string => {
  const clean = (text || '').trim();
  if (clean.length <= maxChars) return clean;
  return `${clean.slice(0, Math.max(1, maxChars - 3)).trimEnd()}...`;
};

export const formatDisplayDate = (dateStr?: string): string => {
  if (!dateStr) return new Date().toLocaleDateString('en-GB');
  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr.trim());
  if (isoMatch) {
    return `${isoMatch[3]}/${isoMatch[2]}/${isoMatch[1]}`;
  }
  return dateStr;
};

export const parseTimeToMinutes = (timeStr?: string): number => {
  if (!timeStr) return 8 * 60;
  const clean = timeStr.trim().toUpperCase();
  const ampmMatch = /^(\d{1,2})[:.](\d{2})\s*(AM|PM)?$/.exec(clean);
  if (ampmMatch) {
    let h = parseInt(ampmMatch[1], 10);
    const m = parseInt(ampmMatch[2], 10);
    const suffix = ampmMatch[3];
    if (suffix === 'PM' && h < 12) h += 12;
    if (suffix === 'AM' && h === 12) h = 0;
    return h * 60 + m;
  }
  return 8 * 60;
};

export const formatMinutesToTime = (totalMins: number): string => {
  const normalized = ((totalMins % (24 * 60)) + 24 * 60) % (24 * 60);
  const h24 = Math.floor(normalized / 60);
  const m = normalized % 60;
  const ampm = h24 >= 12 ? 'PM' : 'AM';
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ampm}`;
};

export const getCourtLabel = (matchIndexZeroBased: number, courtsCount = 2, prefix = 'Field'): string => {
  const safeCourts = Math.max(1, Math.min(16, courtsCount || 2));
  const num = (matchIndexZeroBased % safeCourts) + 1;
  return `${prefix} ${num}`;
};

export const inferCourtPrefix = (sport: string): string => {
  const s = (sport || '').toLowerCase();
  if (
    s.includes('badminton') ||
    s.includes('basketball') ||
    s.includes('volleyball') ||
    s.includes('tennis') ||
    s.includes('kabaddi') ||
    s.includes('kho') ||
    s.includes('handball') ||
    s.includes('throwball')
  ) {
    return 'Court';
  }
  if (s.includes('table tennis')) return 'Table';
  if (s.includes('cricket') || s.includes('football') || s.includes('hockey')) return 'Pitch';
  return 'Field';
};

/**
 * Generates canonical tournament bracket seed placement order for a power-of-2 draw P.
 * Guarantees:
 * - Seed 1 is at the very top of Upper Half (slot 0), Seed 2 at very bottom of Lower Half (slot P-1)
 * - Top half and bottom half stay completely balanced
 * - Slots > N (Byes) always pair against top seeds and NEVER Bye-vs-Bye!
 */
export const generateCanonicalSeedOrder = (P: number): number[] => {
  let order = [1, 2];
  let currentSize = 2;
  while (currentSize < P) {
    currentSize *= 2;
    const next: number[] = [];
    const sum = currentSize + 1;
    for (let i = 0; i < order.length; i++) {
      const seed = order[i];
      if (i % 2 === 0) {
        next.push(seed, sum - seed);
      } else {
        next.push(sum - seed, seed);
      }
    }
    order = next;
  }
  return order;
};

export const getRoundTitle = (roundIdx: number, totalRounds: number): { full: string; short: string } => {
  const roundsFromEnd = totalRounds - 1 - roundIdx;
  if (roundsFromEnd === 0) return { full: 'Grand Final', short: 'FINAL' };
  if (roundsFromEnd === 1) return { full: 'Semifinals', short: 'SF' };
  if (roundsFromEnd === 2) return { full: 'Quarterfinals', short: 'QF' };
  if (roundsFromEnd === 3) return { full: 'Round of 16', short: 'R16' };
  if (roundsFromEnd === 4) return { full: 'Round of 32', short: 'R32' };
  if (roundsFromEnd === 5) return { full: 'Round of 64', short: 'R64' };
  return { full: `Round ${roundIdx + 1}`, short: `R${roundIdx + 1}` };
};

/**
 * Pure Seeded Knockout Bracket Builder (Supports 2..64 Teams, Single or Double Elimination)
 */
export const buildSeededKnockoutDraw = (config: TournamentPdfConfig): KnockoutDrawTree => {
  const cleanTeams = (config.teamsList && config.teamsList.length >= 2
    ? config.teamsList
    : Array.from({ length: 8 }, (_, i) => `Team ${i + 1}`)
  ).slice(0, 64);

  const N = cleanTeams.length;
  const P = Math.min(64, Math.max(4, Math.pow(2, Math.ceil(Math.log2(N)))));
  const totalRounds = Math.log2(P);
  const byesCount = P - N;

  const courtsCount = Math.max(1, config.courtsCount || (N > 16 ? 4 : 2));
  const courtPrefix = config.courtPrefix || inferCourtPrefix(config.sport);
  const matchStep = Math.max(10, (config.matchDurationMins || 35) + (config.restGapMins || 10));
  const baseStartMins = parseTimeToMinutes(config.startTime || '08:30');
  const displayDate = formatDisplayDate(config.startDate);

  const seedOrder = generateCanonicalSeedOrder(P);
  const slots: KnockoutSlotNode[] = seedOrder.map((seed, slotIndex) => {
    const isBye = seed > N;
    return {
      slotIndex,
      seed,
      teamName: isBye ? 'BYE' : (cleanTeams[seed - 1] || `Team ${seed}`),
      isBye
    };
  });

  const rounds: KnockoutRoundData[] = [];
  const allPlayableMatches: UnifiedMatch[] = [];
  let matchCounter = 1;
  let scheduleSlotIdx = 0;

  // Compute time slot allowing simultaneous games across courts
  const nextScheduleMeta = (roundWaveOffsetMins: number) => {
    const wave = Math.floor(scheduleSlotIdx / courtsCount);
    const court = getCourtLabel(scheduleSlotIdx, courtsCount, courtPrefix);
    const timeMins = baseStartMins + roundWaveOffsetMins + wave * matchStep;
    scheduleSlotIdx++;
    return {
      court,
      timeMins,
      time: formatMinutesToTime(timeMins)
    };
  };

  // Track output label & seed from each match in previous round
  interface FeederRef {
    label: string;
    seed: number | null;
    sourceMatchCode: string | null;
  }

  let currentFeeders: FeederRef[] = slots.map((s) => ({
    label: s.isBye ? 'BYE' : s.teamName,
    seed: s.isBye ? null : s.seed,
    sourceMatchCode: null
  }));

  let cumulativeWaveMins = 0;

  for (let r = 0; r < totalRounds; r++) {
    const { full: roundName, short: shortName } = getRoundTitle(r, totalRounds);
    const matchesInRound = currentFeeders.length / 2;
    const roundMatches: UnifiedMatch[] = [];
    const nextFeeders: FeederRef[] = [];

    // Reset schedule wave per round so each round advances cleanly after previous round finishes
    const matchesPerWave = Math.ceil(matchesInRound / courtsCount);
    const roundScheduleStartIdx = scheduleSlotIdx;
    let roundPlayableCounter = 0;

    for (let m = 0; m < matchesInRound; m++) {
      const f1 = currentFeeders[m * 2];
      const f2 = currentFeeders[m * 2 + 1];
      const isTeam1Bye = f1.label === 'BYE';
      const isTeam2Bye = f2.label === 'BYE';
      const isByeMatch = isTeam1Bye || isTeam2Bye;

      if (isByeMatch) {
        const advancing = isTeam1Bye ? f2 : f1;
        const byeMatch: UnifiedMatch = {
          id: -1000 - (r * 100 + m),
          matchCode: 'BYE',
          stage: roundName,
          roundIndex: r,
          matchIndexInRound: m,
          team1: f1.label,
          team2: f2.label,
          seed1: f1.seed,
          seed2: f2.seed,
          isBye: true,
          isTeam1Bye,
          isTeam2Bye,
          advancesTeam: advancing.label,
          advancesSeed: advancing.seed,
          date: displayDate,
          time: 'BYE',
          timeMinutes: baseStartMins + cumulativeWaveMins,
          court: 'Auto Advance'
        };
        roundMatches.push(byeMatch);
        nextFeeders.push({
          label: advancing.label,
          seed: advancing.seed,
          sourceMatchCode: null
        });
      } else {
        const mNum = matchCounter++;
        const code = `M${mNum}`;
        const wave = Math.floor(roundPlayableCounter / courtsCount);
        const court = getCourtLabel(roundPlayableCounter, courtsCount, courtPrefix);
        const timeMins = baseStartMins + cumulativeWaveMins + wave * matchStep;
        roundPlayableCounter++;

        const override = config.matchTimeOverrides?.[code];
        const matchTimeStr = override?.time || formatMinutesToTime(timeMins);
        const match: UnifiedMatch = {
          id: mNum,
          matchCode: code,
          stage: roundName,
          roundIndex: r,
          matchIndexInRound: m,
          team1: f1.label,
          team2: f2.label,
          seed1: f1.seed,
          seed2: f2.seed,
          isBye: false,
          date: override?.date ? formatDisplayDate(override.date) : displayDate,
          time: matchTimeStr,
          timeMinutes: override?.time ? parseTimeToMinutes(override.time) : timeMins,
          court: override?.court || court
        };
        roundMatches.push(match);
        allPlayableMatches.push(match);
        nextFeeders.push({
          label: `Winner ${code}`,
          seed: null,
          sourceMatchCode: code
        });
      }
    }

    const wavesUsed = Math.max(1, Math.ceil(Math.max(1, roundPlayableCounter) / courtsCount));
    if (roundPlayableCounter > 0) {
      cumulativeWaveMins += wavesUsed * matchStep;
    }
    void roundScheduleStartIdx;
    void nextScheduleMeta;
    void matchesPerWave;

    rounds.push({
      roundIndex: r,
      roundName,
      shortName,
      matches: roundMatches
    });
    currentFeeders = nextFeeders;
  }

  // Optional 3rd Place Playoff (from Semifinals losers)
  let thirdPlaceMatch: UnifiedMatch | null = null;
  const sfRound = rounds.length >= 2 ? rounds[rounds.length - 2] : null;
  if (
    config.thirdPlaceEnabled !== false &&
    sfRound &&
    sfRound.matches.length === 2 &&
    !sfRound.matches[0].isBye &&
    !sfRound.matches[1].isBye &&
    config.eliminationType !== 'double'
  ) {
    const sf1 = sfRound.matches[0];
    const sf2 = sfRound.matches[1];
    const mNum = matchCounter++;
    const finalMatch = rounds[rounds.length - 1]?.matches[0];
    const tpTimeMins = Math.max(baseStartMins, (finalMatch?.timeMinutes || baseStartMins + cumulativeWaveMins) - matchStep);
    thirdPlaceMatch = {
      id: mNum,
      matchCode: `M${mNum}`,
      stage: '3rd Place Playoff',
      roundIndex: rounds.length - 1,
      matchIndexInRound: 1,
      team1: `Loser ${sf1.matchCode}`,
      team2: `Loser ${sf2.matchCode}`,
      seed1: null,
      seed2: null,
      isBye: false,
      date: displayDate,
      time: formatMinutesToTime(tpTimeMins),
      timeMinutes: tpTimeMins,
      court: getCourtLabel(1, courtsCount, courtPrefix)
    };
    allPlayableMatches.push(thirdPlaceMatch);
  }

  // Optional Double Elimination (Losers Bracket + Grand Final)
  const losersRounds: KnockoutRoundData[] = [];
  let grandFinalMatch: UnifiedMatch | null = null;

  if (config.eliminationType === 'double' && rounds.length >= 2) {
    // Build canonical Losers Bracket structure dropping from Winners Bracket
    let lbWaveMins = matchStep;
    let lbRoundCounter = 1;
    let currentLbFeeders: FeederRef[] = [];

    // Collect playable matches from WB R1 as initial losers
    const wbR1Playable = rounds[0].matches.filter((m) => !m.isBye);
    for (let i = 0; i < wbR1Playable.length; i++) {
      currentLbFeeders.push({
        label: `Loser ${wbR1Playable[i].matchCode}`,
        seed: null,
        sourceMatchCode: wbR1Playable[i].matchCode
      });
    }

    // Pair WB R1 losers, then interleave subsequent WB round losers
    for (let r = 1; r < rounds.length; r++) {
      // If >= 2 feeders in LB, run an internal LB elimination round first (when needed to balance)
      if (currentLbFeeders.length >= 2) {
        const lbMatchesA: UnifiedMatch[] = [];
        const nextLbA: FeederRef[] = [];
        let playableCount = 0;
        for (let i = 0; i < currentLbFeeders.length; i += 2) {
          if (i + 1 >= currentLbFeeders.length) {
            nextLbA.push(currentLbFeeders[i]);
            continue;
          }
          const mNum = matchCounter++;
          const code = `L${mNum}`;
          const tMins = baseStartMins + lbWaveMins + Math.floor(playableCount / courtsCount) * matchStep;
          const m: UnifiedMatch = {
            id: mNum,
            matchCode: code,
            stage: `Losers Round ${lbRoundCounter}`,
            roundIndex: lbRoundCounter - 1,
            matchIndexInRound: playableCount,
            team1: currentLbFeeders[i].label,
            team2: currentLbFeeders[i + 1].label,
            isBye: false,
            date: displayDate,
            time: formatMinutesToTime(tMins),
            timeMinutes: tMins,
            court: getCourtLabel(playableCount, courtsCount, courtPrefix)
          };
          playableCount++;
          lbMatchesA.push(m);
          allPlayableMatches.push(m);
          nextLbA.push({ label: `Winner ${code}`, seed: null, sourceMatchCode: code });
        }
        if (lbMatchesA.length > 0) {
          losersRounds.push({
            roundIndex: losersRounds.length,
            roundName: `Losers Round ${lbRoundCounter}`,
            shortName: `LR${lbRoundCounter}`,
            matches: lbMatchesA
          });
          lbRoundCounter++;
          lbWaveMins += Math.ceil(playableCount / courtsCount) * matchStep;
        }
        currentLbFeeders = nextLbA;
      }

      // Drop losers from WB round `r`
      const wbDropMatches = rounds[r].matches.filter((m) => !m.isBye);
      if (wbDropMatches.length > 0) {
        const dropFeeders: FeederRef[] = wbDropMatches.map((m) => ({
          label: `Loser ${m.matchCode}`,
          seed: null,
          sourceMatchCode: m.matchCode
        }));

        // Pair each LB survivor with a WB drop-down (reverse order to avoid immediate rematches)
        const combinedCount = Math.min(currentLbFeeders.length, dropFeeders.length);
        const lbMatchesB: UnifiedMatch[] = [];
        const nextLbB: FeederRef[] = [];
        let playableCount = 0;

        for (let i = 0; i < combinedCount; i++) {
          const dropIdx = combinedCount - 1 - i;
          const mNum = matchCounter++;
          const code = `L${mNum}`;
          const tMins = baseStartMins + lbWaveMins + Math.floor(playableCount / courtsCount) * matchStep;
          const m: UnifiedMatch = {
            id: mNum,
            matchCode: code,
            stage: `Losers Round ${lbRoundCounter}`,
            roundIndex: lbRoundCounter - 1,
            matchIndexInRound: playableCount,
            team1: currentLbFeeders[i].label,
            team2: dropFeeders[dropIdx].label,
            isBye: false,
            date: displayDate,
            time: formatMinutesToTime(tMins),
            timeMinutes: tMins,
            court: getCourtLabel(playableCount, courtsCount, courtPrefix)
          };
          playableCount++;
          lbMatchesB.push(m);
          allPlayableMatches.push(m);
          nextLbB.push({ label: `Winner ${code}`, seed: null, sourceMatchCode: code });
        }

        // Any unpaired survivors or drops carry forward
        for (let i = combinedCount; i < currentLbFeeders.length; i++) nextLbB.push(currentLbFeeders[i]);
        for (let i = combinedCount; i < dropFeeders.length; i++) nextLbB.push(dropFeeders[i]);

        if (lbMatchesB.length > 0) {
          losersRounds.push({
            roundIndex: losersRounds.length,
            roundName: `Losers Round ${lbRoundCounter}`,
            shortName: `LR${lbRoundCounter}`,
            matches: lbMatchesB
          });
          lbRoundCounter++;
          lbWaveMins += Math.ceil(playableCount / courtsCount) * matchStep;
        }
        currentLbFeeders = nextLbB;
      }
    }

    // Reduce remaining LB feeders down to 1 Losers Finalist
    while (currentLbFeeders.length >= 2) {
      const lbFinalMatches: UnifiedMatch[] = [];
      const nextLbF: FeederRef[] = [];
      let playableCount = 0;
      for (let i = 0; i < currentLbFeeders.length; i += 2) {
        if (i + 1 >= currentLbFeeders.length) {
          nextLbF.push(currentLbFeeders[i]);
          continue;
        }
        const mNum = matchCounter++;
        const code = `L${mNum}`;
        const tMins = baseStartMins + lbWaveMins + Math.floor(playableCount / courtsCount) * matchStep;
        const stageName = currentLbFeeders.length === 2 ? 'Losers Final' : `Losers Round ${lbRoundCounter}`;
        const m: UnifiedMatch = {
          id: mNum,
          matchCode: code,
          stage: stageName,
          roundIndex: lbRoundCounter - 1,
          matchIndexInRound: playableCount,
          team1: currentLbFeeders[i].label,
          team2: currentLbFeeders[i + 1].label,
          isBye: false,
          date: displayDate,
          time: formatMinutesToTime(tMins),
          timeMinutes: tMins,
          court: getCourtLabel(playableCount, courtsCount, courtPrefix)
        };
        playableCount++;
        lbFinalMatches.push(m);
        allPlayableMatches.push(m);
        nextLbF.push({ label: `Winner ${code}`, seed: null, sourceMatchCode: code });
      }
      losersRounds.push({
        roundIndex: losersRounds.length,
        roundName: currentLbFeeders.length === 2 ? 'Losers Final' : `Losers Round ${lbRoundCounter}`,
        shortName: currentLbFeeders.length === 2 ? 'L-FINAL' : `LR${lbRoundCounter}`,
        matches: lbFinalMatches
      });
      lbRoundCounter++;
      lbWaveMins += matchStep;
      currentLbFeeders = nextLbF;
    }

    // Grand Final
    const wbFinalCode = rounds[rounds.length - 1]?.matches[0]?.matchCode || 'WB-Final';
    const lbWinnerLabel = currentLbFeeders[0]?.label || 'Winner Losers Bracket';
    const gfNum = matchCounter++;
    const gfMins = Math.max(baseStartMins + cumulativeWaveMins, baseStartMins + lbWaveMins);
    grandFinalMatch = {
      id: gfNum,
      matchCode: `GF`,
      stage: 'Grand Final (Reset if LB Wins)',
      roundIndex: losersRounds.length,
      matchIndexInRound: 0,
      team1: `Winner ${wbFinalCode}`,
      team2: lbWinnerLabel,
      isBye: false,
      date: displayDate,
      time: formatMinutesToTime(gfMins),
      timeMinutes: gfMins,
      court: `${courtPrefix} 1 (Center)`
    };
    allPlayableMatches.push(grandFinalMatch);
  }

  return {
    N,
    P,
    byesCount,
    totalRounds,
    slots,
    rounds,
    thirdPlaceMatch,
    losersRounds,
    grandFinalMatch,
    allPlayableMatches
  };
};

/**
 * Pure Round Robin / Pool Generator (Supports both Single League & Multi-Pool Combination)
 */
export const buildPoolsAndStandings = (config: TournamentPdfConfig): {
  pools: PoolData[];
  playoffTree: KnockoutDrawTree | null;
} => {
  const cleanTeams = (config.teamsList && config.teamsList.length >= 2
    ? config.teamsList
    : Array.from({ length: 8 }, (_, i) => `Team ${i + 1}`)
  ).slice(0, 64);

  const courtsCount = Math.max(1, config.courtsCount || 2);
  const courtPrefix = config.courtPrefix || inferCourtPrefix(config.sport);
  const matchStep = Math.max(10, (config.matchDurationMins || 30) + (config.restGapMins || 10));
  const baseStartMins = parseTimeToMinutes(config.startTime || '09:00');
  const displayDate = formatDisplayDate(config.startDate);
  const winPts = config.winPoints ?? 3;
  const drawPts = config.drawPoints ?? 1;
  const lossPts = config.lossPoints ?? 0;

  // Determine pools: Combination splits into 4 Pools (A,B,C,D); Round Robin splits into pools if > 8 teams or 1 league pool if <= 8 (unless > 10 teams -> optional 2 pools or single league)
  const poolGroups: Array<{ name: string; teams: string[] }> = [];

  if (config.format === 'combination') {
    const numPools = cleanTeams.length >= 12 ? 4 : cleanTeams.length >= 6 ? 2 : 1;
    const poolBuckets: string[][] = Array.from({ length: numPools }, () => []);
    cleanTeams.forEach((t, idx) => {
      poolBuckets[idx % numPools].push(t);
    });
    const letters = ['A', 'B', 'C', 'D'];
    poolBuckets.forEach((teams, idx) => {
      if (teams.length >= 2) {
        poolGroups.push({ name: `Pool ${letters[idx]}`, teams });
      }
    });
  } else {
    poolGroups.push({ name: 'League Standings & Schedule', teams: cleanTeams });
  }

  let globalMatchNum = 1;
  const pools: PoolData[] = [];

  poolGroups.forEach((pg, poolIdx) => {
    const teams = [...pg.teams];
    const odd = teams.length % 2 !== 0;
    const rotTeams = odd ? [...teams, '__BYE__'] : [...teams];
    const totalSlots = rotTeams.length;
    const numRounds = totalSlots - 1;
    const matchesPerRound = totalSlots / 2;
    const cycles = config.leagueType === 'double' ? 2 : 1;

    const poolMatches: UnifiedMatch[] = [];
    let waveCounter = 0;

    for (let c = 0; c < cycles; c++) {
      let arr = [...rotTeams];
      for (let r = 0; r < numRounds; r++) {
        const roundNo = c * numRounds + r + 1;
        for (let i = 0; i < matchesPerRound; i++) {
          const tA = arr[i];
          const tB = arr[totalSlots - 1 - i];
          if (tA === '__BYE__' || tB === '__BYE__') continue;

          const team1 = c === 1 ? tB : tA;
          const team2 = c === 1 ? tA : tB;

          // Match with existing interactive scores if provided
          const existing = config.existingMatches?.find(
            (em) =>
              ((em.team1 === team1 && em.team2 === team2) || (em.team1 === team2 && em.team2 === team1)) &&
              (!em.poolName || em.poolName.includes(pg.name) || poolGroups.length === 1)
          );

          const mNum = globalMatchNum++;
          const courtIdx = (waveCounter + poolIdx) % courtsCount;
          const wave = Math.floor(waveCounter / courtsCount);
          const timeMins = baseStartMins + wave * matchStep;
          waveCounter++;

          poolMatches.push({
            id: mNum,
            matchCode: `M${mNum}`,
            stage: `${pg.name} • Round ${roundNo}`,
            poolName: pg.name,
            roundNumber: roundNo,
            roundIndex: roundNo - 1,
            matchIndexInRound: i,
            team1,
            team2,
            date: existing?.date ? formatDisplayDate(existing.date) : displayDate,
            time: existing?.time || formatMinutesToTime(timeMins),
            timeMinutes: existing?.time ? parseTimeToMinutes(existing.time) : timeMins,
            court: existing?.court || `${courtPrefix} ${courtIdx + 1}`,
            score1: existing?.score1 ?? null,
            score2: existing?.score2 ?? null,
            completed: existing?.completed ?? false
          });
        }

        // Clockwise cyclic rotation keeping slot 0 fixed
        const fixed = arr[0];
        const last = arr[arr.length - 1];
        const middle = arr.slice(1, arr.length - 1);
        arr = [fixed, last, ...middle];
      }
    }

    // Compute Standings & Head-to-Head Cross Table
    const statsMap: Record<string, PoolStandingRow> = {};
    const crossTable: Record<string, Record<string, string>> = {};
    teams.forEach((t, idx) => {
      statsMap[t] = {
        pos: idx + 1,
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
      crossTable[t] = {};
      teams.forEach((t2) => {
        crossTable[t][t2] = t === t2 ? 'X' : '';
      });
    });

    poolMatches.forEach((m) => {
      if (
        m.completed &&
        m.score1 !== null &&
        m.score1 !== undefined &&
        m.score2 !== null &&
        m.score2 !== undefined
      ) {
        const s1 = Number(m.score1);
        const s2 = Number(m.score2);
        if (!Number.isNaN(s1) && !Number.isNaN(s2)) {
          if (crossTable[m.team1]) crossTable[m.team1][m.team2] = `${s1}-${s2}`;
          if (crossTable[m.team2]) crossTable[m.team2][m.team1] = `${s2}-${s1}`;

          const st1 = statsMap[m.team1];
          const st2 = statsMap[m.team2];
          if (st1 && st2) {
            st1.played++;
            st2.played++;
            st1.gf += s1;
            st1.ga += s2;
            st2.gf += s2;
            st2.ga += s1;
            if (s1 > s2) {
              st1.won++;
              st2.lost++;
              st1.pts += winPts;
              st2.pts += lossPts;
            } else if (s2 > s1) {
              st2.won++;
              st1.lost++;
              st2.pts += winPts;
              st1.pts += lossPts;
            } else {
              st1.drawn++;
              st2.drawn++;
              st1.pts += drawPts;
              st2.pts += drawPts;
            }
            st1.gd = st1.gf - st1.ga;
            st2.gd = st2.gf - st2.ga;
          }
        }
      }
    });

    const standings = Object.values(statsMap)
      .sort(
        (a, b) =>
          b.pts - a.pts ||
          b.gd - a.gd ||
          b.gf - a.gf ||
          a.team.localeCompare(b.team, undefined, { numeric: true, sensitivity: 'base' })
      )
      .map((row, idx) => ({ ...row, pos: idx + 1 }));

    pools.push({
      poolName: pg.name,
      teams,
      standings,
      matches: poolMatches,
      crossTable
    });
  });

  // For Combination tournaments, Stage 2 Playoff Bracket (top 2 per pool)
  let playoffTree: KnockoutDrawTree | null = null;
  if (config.format === 'combination') {
    const qualifiers: string[] = [];
    if (pools.length === 4) {
      qualifiers.push(
        'Winner Pool A',
        'Runner Pool B',
        'Winner Pool C',
        'Runner Pool D',
        'Winner Pool B',
        'Runner Pool A',
        'Winner Pool D',
        'Runner Pool C'
      );
    } else if (pools.length === 2) {
      qualifiers.push('Winner Pool A', 'Runner Pool B', 'Winner Pool B', 'Runner Pool A');
    } else {
      qualifiers.push('1st League', '4th League', '2nd League', '3rd League');
    }

    const lastPoolTime = pools.flatMap((p) => p.matches).reduce((acc, m) => Math.max(acc, m.timeMinutes), baseStartMins);
    playoffTree = buildSeededKnockoutDraw({
      ...config,
      format: 'knockout',
      eliminationType: 'single',
      teamsList: qualifiers,
      startTime: formatMinutesToTime(lastPoolTime + matchStep)
    });
  }

  return { pools, playoffTree };
};

/**
 * Team-Wise Schedule & Chronological Master Order of Play Builder
 */
export const buildTeamSchedulesAndOrderOfPlay = (config: TournamentPdfConfig): {
  teamSchedules: TeamScheduleGroup[];
  masterOrderOfPlay: UnifiedMatch[];
} => {
  const cleanTeams = (config.teamsList && config.teamsList.length >= 2
    ? config.teamsList
    : Array.from({ length: 8 }, (_, i) => `Team ${i + 1}`)
  ).slice(0, 64);

  let allMatches: UnifiedMatch[] = [];
  const teamTagMap: Record<string, string> = {};

  if (config.format === 'knockout') {
    const tree = buildSeededKnockoutDraw(config);
    allMatches = [...tree.allPlayableMatches];
    tree.slots.forEach((s) => {
      if (!s.isBye) {
        teamTagMap[s.teamName] = `Seed #${s.seed}`;
      }
    });
    // Also add Round 1 Bye automatic advancement rows for teams with Round 1 Byes so they see their reporting round
    tree.rounds[0]?.matches.forEach((m) => {
      if (m.isBye && m.advancesTeam) {
        allMatches.push({
          ...m,
          matchCode: 'BYE',
          stage: 'Round 1 (Bye Advance)',
          team1: m.advancesTeam,
          team2: 'BYE (Advances to R2)',
          court: 'No R1 Match',
          time: 'Auto Advance',
          timeMinutes: m.timeMinutes
        });
      }
    });
  } else {
    const { pools, playoffTree } = buildPoolsAndStandings(config);
    pools.forEach((pool) => {
      pool.teams.forEach((t, idx) => {
        teamTagMap[t] = pools.length > 1 ? `${pool.poolName} • Seed ${idx + 1}` : `League • #${idx + 1}`;
      });
      allMatches.push(...pool.matches);
    });
    if (playoffTree) {
      allMatches.push(...playoffTree.allPlayableMatches);
    }
  }

  // Chronological Master Order of Play (Playable matches only, exclude pure R1 BYEs)
  const masterOrderOfPlay = allMatches
    .filter((m) => !m.isBye)
    .sort((a, b) => a.timeMinutes - b.timeMinutes || a.id - b.id);

  // Build per-team schedule groups in roster order
  const teamSchedules: TeamScheduleGroup[] = cleanTeams.map((teamName, idx) => {
    const matchesForTeam: TeamScheduleEntry[] = [];
    allMatches.forEach((m) => {
      if (m.team1 === teamName || m.team2 === teamName) {
        const isTeam1 = m.team1 === teamName;
        const opponent = isTeam1 ? m.team2 : m.team1;
        const scoreDisplay =
          m.completed && m.score1 !== null && m.score2 !== null
            ? isTeam1
              ? `${m.score1} - ${m.score2}`
              : `${m.score2} - ${m.score1}`
            : m.isBye
            ? 'BYE'
            : '[   ] - [   ]';
        matchesForTeam.push({
          matchCode: m.matchCode,
          stage: m.stage,
          opponent,
          court: m.court,
          date: m.date,
          time: m.time,
          timeMinutes: m.timeMinutes,
          scoreDisplay
        });
      }
    });

    matchesForTeam.sort((a, b) => a.timeMinutes - b.timeMinutes);

    return {
      teamName,
      seedOrPool: teamTagMap[teamName] || `Seed #${idx + 1}`,
      matches: matchesForTeam
    };
  });

  return { teamSchedules, masterOrderOfPlay };
};

/**
 * Computes Bracket Split Pages Metadata for both Vector PDF and Multi-Page Print Preview UI
 */
export interface BracketPageSlice {
  pageNumber: number;
  title: string;
  sectionLabel: string;
  mode: 'single-full' | 'full-with-schedule' | 'slice' | 'final-stage' | 'losers-stage';
  slotStart: number; // inclusive slot index in 0..P-1
  slotEnd: number; // exclusive
  startRound: number;
  endRound: number; // exclusive
  includeThirdPlace?: boolean;
  includeGrandFinal?: boolean;
  isA3BottomWithFinals?: boolean;
}

export const computeKnockoutPaginationPlan = (
  N: number,
  P: number,
  totalRounds: number,
  paperSize: PaperSize,
  eliminationType: EliminationType = 'single'
): BracketPageSlice[] => {
  const pages: BracketPageSlice[] = [];

  if (P <= 8) {
    pages.push({
      pageNumber: 1,
      title: 'Full Draw & Match Schedule',
      sectionLabel: `FULL DRAW (${N} TEAMS) & MATCH SCHEDULE`,
      mode: 'full-with-schedule',
      slotStart: 0,
      slotEnd: P,
      startRound: 0,
      endRound: totalRounds,
      includeThirdPlace: true
    });
  } else if (P === 16) {
    pages.push({
      pageNumber: 1,
      title: '16-Slot Official Knockout Draw',
      sectionLabel: `FULL 16-SLOT KNOCKOUT DRAW (${N} TEAMS)`,
      mode: 'single-full',
      slotStart: 0,
      slotEnd: 16,
      startRound: 0,
      endRound: 4,
      includeThirdPlace: true
    });
  } else if (P === 32) {
    if (paperSize === 'A3') {
      pages.push({
        pageNumber: 1,
        title: '32-Team Master Poster Draw (A3)',
        sectionLabel: `COMPLETE 32-SLOT DRAW (${N} TEAMS)`,
        mode: 'single-full',
        slotStart: 0,
        slotEnd: 32,
        startRound: 0,
        endRound: 5,
        includeThirdPlace: true
      });
    } else {
      // A4 Landscape: 3 Pages (Upper Half 1-16, Lower Half 17-32, Final Stage QF->Final)
      pages.push({
        pageNumber: 1,
        title: 'UPPER HALF DRAW (Top 16)',
        sectionLabel: 'UPPER HALF DRAW (Top 16)',
        mode: 'slice',
        slotStart: 0,
        slotEnd: 16,
        startRound: 0,
        endRound: 2 // R32 (8) -> R16 (4) feeding into QF1, QF2
      });
      pages.push({
        pageNumber: 2,
        title: 'LOWER HALF DRAW (Bottom 16)',
        sectionLabel: 'LOWER HALF DRAW (Bottom 16)',
        mode: 'slice',
        slotStart: 16,
        slotEnd: 32,
        startRound: 0,
        endRound: 2 // R32 (8) -> R16 (4) feeding into QF3, QF4
      });
      pages.push({
        pageNumber: 3,
        title: 'FINAL STAGE (Quarterfinals to Final)',
        sectionLabel: 'FINAL STAGE (Quarterfinals to Final)',
        mode: 'final-stage',
        slotStart: 0,
        slotEnd: 32,
        startRound: 2, // QF -> SF -> Final
        endRound: 5,
        includeThirdPlace: true
      });
    }
  } else {
    // 33 to 64 Teams (P = 64, totalRounds = 6)
    if (paperSize === 'A3') {
      // 2 A3 Landscape Pages: Top 32 + Bottom 32/Finals
      pages.push({
        pageNumber: 1,
        title: 'UPPER HALF DRAW (Top 32)',
        sectionLabel: 'UPPER HALF DRAW (Teams 1–32 • Through Quarterfinals)',
        mode: 'slice',
        slotStart: 0,
        slotEnd: 32,
        startRound: 0,
        endRound: 4 // R64 -> R32 -> R16 -> QF (2 matches)
      });
      pages.push({
        pageNumber: 2,
        title: 'LOWER HALF DRAW (Bottom 32) & FINAL STAGE',
        sectionLabel: 'LOWER HALF DRAW (Teams 33–64) & CHAMPIONSHIP FINALS',
        mode: 'slice',
        slotStart: 32,
        slotEnd: 64,
        startRound: 0,
        endRound: 4,
        isA3BottomWithFinals: true,
        includeThirdPlace: true
      });
    } else {
      // 5 A4 Landscape Pages: Q1 (1-16), Q2 (17-32), Q3 (33-48), Q4 (49-64), Final Stage (QF->Final)
      pages.push({
        pageNumber: 1,
        title: 'QUARTER 1 DRAW (Teams 1–16)',
        sectionLabel: 'QUARTER 1 DRAW (Teams 1–16)',
        mode: 'slice',
        slotStart: 0,
        slotEnd: 16,
        startRound: 0,
        endRound: 3 // R64 -> R32 -> R16
      });
      pages.push({
        pageNumber: 2,
        title: 'QUARTER 2 DRAW (Teams 17–32)',
        sectionLabel: 'QUARTER 2 DRAW (Teams 17–32)',
        mode: 'slice',
        slotStart: 16,
        slotEnd: 32,
        startRound: 0,
        endRound: 3
      });
      pages.push({
        pageNumber: 3,
        title: 'QUARTER 3 DRAW (Teams 33–48)',
        sectionLabel: 'QUARTER 3 DRAW (Teams 33–48)',
        mode: 'slice',
        slotStart: 32,
        slotEnd: 48,
        startRound: 0,
        endRound: 3
      });
      pages.push({
        pageNumber: 4,
        title: 'QUARTER 4 DRAW (Teams 49–64)',
        sectionLabel: 'QUARTER 4 DRAW (Teams 49–64)',
        mode: 'slice',
        slotStart: 48,
        slotEnd: 64,
        startRound: 0,
        endRound: 3
      });
      pages.push({
        pageNumber: 5,
        title: 'FINAL STAGE (Quarterfinals to Final)',
        sectionLabel: 'FINAL STAGE (Quarterfinals to Final)',
        mode: 'final-stage',
        slotStart: 0,
        slotEnd: 64,
        startRound: 3, // QF -> SF -> Final
        endRound: 6,
        includeThirdPlace: true
      });
    }
  }

  if (eliminationType === 'double') {
    pages.push({
      pageNumber: pages.length + 1,
      title: 'LOSERS BRACKET & GRAND FINAL',
      sectionLabel: 'LOSERS BRACKET & GRAND FINAL (DOUBLE ELIMINATION)',
      mode: 'losers-stage',
      slotStart: 0,
      slotEnd: P,
      startRound: 0,
      endRound: totalRounds,
      includeGrandFinal: true
    });
  }

  return pages;
};

/**
 * Formula-injection safe CSV cell escaper
 */
const escapeCsvCell = (raw: string | number | null | undefined): string => {
  const str = String(raw ?? '');
  const safe = /^[=+\-@\t\r]/.test(str) ? `'${str}` : str;
  if (/[",\n\r]/.test(safe)) {
    return `"${safe.replace(/"/g, '""')}"`;
  }
  return safe;
};

/**
 * Exports unified Tournament Matches (and Standings for League/Combination) as clean CSV
 */
export const exportTournamentToCsv = (config: TournamentPdfConfig): string => {
  const lines: string[] = [];
  lines.push(
    [
      'Tournament',
      config.tournamentName || 'School Championship',
      'Sport',
      config.sport || '',
      'Category',
      config.category || '',
      'Venue',
      config.venue || '',
      'Date',
      formatDisplayDate(config.startDate)
    ]
      .map(escapeCsvCell)
      .join(',')
  );
  lines.push('');

  const { masterOrderOfPlay } = buildTeamSchedulesAndOrderOfPlay(config);
  lines.push(
    ['Match #', 'Stage / Round', 'Date', 'Time', 'Court / Field', 'Team 1', 'Score 1', 'Score 2', 'Team 2']
      .map(escapeCsvCell)
      .join(',')
  );

  masterOrderOfPlay.forEach((m) => {
    lines.push(
      [
        m.matchCode,
        m.stage,
        m.date,
        m.time,
        m.court,
        m.team1,
        m.score1 ?? '',
        m.score2 ?? '',
        m.team2
      ]
        .map(escapeCsvCell)
        .join(',')
    );
  });

  if (config.format === 'roundrobin' || config.format === 'combination') {
    const { pools } = buildPoolsAndStandings(config);
    pools.forEach((pool) => {
      lines.push('');
      lines.push([`${pool.poolName} - Standings`].map(escapeCsvCell).join(','));
      lines.push(['Pos', 'Team', 'P', 'W', 'D', 'L', 'GF', 'GA', 'GD', 'PTS'].map(escapeCsvCell).join(','));
      pool.standings.forEach((row) => {
        lines.push(
          [row.pos, row.team, row.played, row.won, row.drawn, row.lost, row.gf, row.ga, row.gd, row.pts]
            .map(escapeCsvCell)
            .join(',')
        );
      });
    });
  }

  return lines.join('\r\n');
};

