import { jsPDF } from 'jspdf';
import {
  TournamentPdfConfig,
  UnifiedMatch,
  KnockoutDrawTree,
  BracketPageSlice,
  PoolData,
  TeamScheduleGroup,
  buildSeededKnockoutDraw,
  buildPoolsAndStandings,
  buildTeamSchedulesAndOrderOfPlay,
  computeKnockoutPaginationPlan,
  truncateText,
  formatDisplayDate
} from './tournamentDrawEngine.ts';

interface PageMetaRecord {
  pageNumber: number;
  sectionLabel: string;
  isRoundRobinPage: boolean;
}

const NAVY: [number, number, number] = [13, 43, 82];
const GOLD: [number, number, number] = [212, 160, 23];
const SLATE_DARK: [number, number, number] = [15, 23, 42];
const SLATE_MED: [number, number, number] = [71, 85, 105];
const SLATE_BORDER: [number, number, number] = [148, 163, 184];
const SLATE_LIGHT: [number, number, number] = [241, 245, 249];
const ZEBRA_BG: [number, number, number] = [248, 250, 252];
const ROSE_BG: [number, number, number] = [254, 242, 242];
const ROSE_TXT: [number, number, number] = [185, 28, 28];
const GOLD_TINT: [number, number, number] = [254, 249, 195];

const HEADER_H = 24;
const FOOTER_H = 15;
const MARGIN_X = 11;
const MARGIN_TOP = 8;
const MARGIN_BOTTOM = 7;

const getContentBounds = (doc: jsPDF) => {
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const contentX = MARGIN_X;
  const contentW = pageW - MARGIN_X * 2;
  const contentTop = MARGIN_TOP + HEADER_H + 3;
  const contentBottom = pageH - MARGIN_BOTTOM - FOOTER_H - 2;
  const contentH = contentBottom - contentTop;
  return { pageW, pageH, contentX, contentW, contentTop, contentBottom, contentH };
};

/**
 * Stamps Official Header & Official Footer across all generated pages with exact "Page X of Y"
 */
const stampHeadersAndFooters = (
  doc: jsPDF,
  config: TournamentPdfConfig,
  pageMetas: PageMetaRecord[]
) => {
  const totalPages = doc.getNumberOfPages();
  const displayDate = formatDisplayDate(config.startDate);
  const orgName = (config.organizationName || "SHRADDHA CHILDREN'S ACADEMY").toUpperCase();
  const tourneyName = (config.tournamentName || 'OFFICIAL SCHOOL CHAMPIONSHIP').toUpperCase();
  const metaLine = `${(config.sport || 'Sports').toUpperCase()} • ${config.category || 'OPEN'}  |  VENUE: ${(config.venue || 'School Sports Complex').toUpperCase()}  |  DATE: ${displayDate}`;

  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    const meta = pageMetas[p - 1] || {
      pageNumber: p,
      sectionLabel: 'OFFICIAL TOURNAMENT FIXTURE',
      isRoundRobinPage: false
    };
    const { pageW, pageH } = getContentBounds(doc);
    const boxW = pageW - MARGIN_X * 2;

    // --- TOP HEADER BANNER ---
    doc.setFillColor(...NAVY);
    doc.roundedRect(MARGIN_X, MARGIN_TOP, boxW, HEADER_H, 1.5, 1.5, 'F');

    // Left Gold Accent Stripe
    doc.setFillColor(...GOLD);
    doc.rect(MARGIN_X, MARGIN_TOP, 2.5, HEADER_H, 'F');

    // Organization Name
    doc.setTextColor(...GOLD);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text(truncateText(orgName, 64), MARGIN_X + 5.5, MARGIN_TOP + 5.2);

    // Tournament Name
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(truncateText(tourneyName, 54), MARGIN_X + 5.5, MARGIN_TOP + 11.8);

    // Sport / Category / Venue / Date line
    doc.setTextColor(219, 234, 254);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text(metaLine, MARGIN_X + 5.5, MARGIN_TOP + 18.2);

    // Right Side Page Counter & Section Label Badge
    const rightX = pageW - MARGIN_X - 4;
    doc.setTextColor(...GOLD);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text(`Page ${p} of ${totalPages}`, rightX, MARGIN_TOP + 6.5, { align: 'right' });

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text(truncateText(meta.sectionLabel.toUpperCase(), 48), rightX, MARGIN_TOP + 12.2, { align: 'right' });

    doc.setTextColor(148, 163, 184);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.text(
      `${config.teamsList?.length || 0} TEAMS • ${(config.format || 'knockout').toUpperCase()}`,
      rightX,
      MARGIN_TOP + 18.2,
      { align: 'right' }
    );

    // --- BOTTOM FOOTER BAR ---
    const footerTop = pageH - MARGIN_BOTTOM - FOOTER_H;
    doc.setDrawColor(...SLATE_BORDER);
    doc.setLineWidth(0.3);
    doc.line(MARGIN_X, footerTop, pageW - MARGIN_X, footerTop);

    // Signature Line 1: Tournament Director
    const sig1X = MARGIN_X;
    const sig2X = MARGIN_X + 58;
    const sigY = footerTop + 7.2;

    doc.setDrawColor(100, 116, 139);
    doc.setLineWidth(0.25);
    doc.line(sig1X, sigY, sig1X + 46, sigY);
    doc.line(sig2X, sigY, sig2X + 46, sigY);

    doc.setTextColor(...SLATE_DARK);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.8);
    doc.text(
      config.directorName ? `Tournament Director: ${truncateText(config.directorName, 22)}` : 'Tournament Director (Sign)',
      sig1X,
      sigY + 3.4
    );
    doc.text(
      config.chiefRefereeName ? `Chief Referee: ${truncateText(config.chiefRefereeName, 22)}` : 'Chief Referee (Sign)',
      sig2X,
      sigY + 3.4
    );

    // Tie-Breaker Note (Round Robin / Combination pages)
    if (meta.isRoundRobinPage) {
      const tieNote =
        config.tieBreakerRule ||
        'Tie-Breaker: 1. Points  2. Head-to-Head  3. Goal/Point Diff  4. Goals Scored';
      doc.setTextColor(...SLATE_MED);
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(6.3);
      doc.text(truncateText(tieNote, 82), pageW / 2 + 12, sigY + 0.5, { align: 'center' });
    }

    // Subtle SmartPE India Branding
    doc.setTextColor(...SLATE_MED);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.text('Generated via SmartPE India (smartpeindia.app)', pageW - MARGIN_X, sigY + 3.4, {
      align: 'right'
    });
  }
};

/**
 * Renders a Standardized Vector Match Card at (x, y, w, h)
 */
const drawVectorMatchCard = (
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  match: UnifiedMatch,
  opts?: { highlightGold?: boolean; compact?: boolean }
) => {
  const compact = opts?.compact || h < 12.5;
  const headerStripH = compact ? 3.4 : 4.2;
  const bodyH = h - headerStripH;
  const rowH = bodyH / 2;

  // Outer card background & border
  if (match.isBye) {
    doc.setFillColor(...ROSE_BG);
    doc.setDrawColor(252, 165, 165);
  } else if (opts?.highlightGold) {
    doc.setFillColor(...GOLD_TINT);
    doc.setDrawColor(...GOLD);
  } else {
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(...SLATE_BORDER);
  }
  doc.setLineWidth(0.32);
  doc.roundedRect(x, y, w, h, 1.1, 1.1, 'FD');

  // Header strip inside card
  if (match.isBye) {
    doc.setFillColor(254, 226, 226);
  } else if (opts?.highlightGold) {
    doc.setFillColor(253, 230, 138);
  } else {
    doc.setFillColor(...SLATE_LIGHT);
  }
  doc.rect(x + 0.2, y + 0.2, w - 0.4, headerStripH, 'F');

  // Match Code Badge (e.g. M1 or BYE)
  const badgeW = Math.min(10.5, Math.max(7.2, match.matchCode.length * 1.9 + 3));
  doc.setFillColor(...(match.isBye ? ROSE_TXT : NAVY));
  doc.roundedRect(x + 0.8, y + 0.55, badgeW, headerStripH - 0.9, 0.7, 0.7, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(compact ? 5.2 : 5.8);
  doc.text(match.matchCode, x + 0.8 + badgeW / 2, y + headerStripH - 0.95, { align: 'center' });

  // Time & Court label on right of header strip
  const timeCourt = match.isBye
    ? 'BYE • Auto Advance'
    : `${match.time} • ${match.court}`;
  doc.setTextColor(...(match.isBye ? ROSE_TXT : SLATE_MED));
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(compact ? 4.9 : 5.4);
  doc.text(truncateText(timeCourt, 26), x + w - 1.2, y + headerStripH - 0.95, { align: 'right' });

  // Score Box Dimensions
  const scoreBoxW = compact ? 4.4 : 5.4;
  const scoreBoxH = Math.max(2.6, rowH - 1.1);
  const scoreBoxX = x + w - scoreBoxW - 1.1;

  // Row 1 & Row 2
  const rows = [
    {
      name: match.team1,
      seed: match.seed1,
      isByeSide: match.isTeam1Bye || match.team1 === 'BYE',
      score: match.score1
    },
    {
      name: match.team2,
      seed: match.seed2,
      isByeSide: match.isTeam2Bye || match.team2 === 'BYE',
      score: match.score2
    }
  ];

  rows.forEach((row, idx) => {
    const rowTop = y + headerStripH + idx * rowH;
    if (idx === 1) {
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.2);
      doc.line(x + 0.6, rowTop, x + w - 0.6, rowTop);
    }

    const textY = rowTop + rowH / 2 + (compact ? 0.8 : 1.0);
    let cursorX = x + 1.4;

    if (row.seed && !row.isByeSide) {
      doc.setTextColor(...SLATE_MED);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(compact ? 5.2 : 5.8);
      const seedStr = `[${row.seed}]`;
      doc.text(seedStr, cursorX, textY);
      cursorX += doc.getTextWidth(seedStr) + 1.0;
    }

    const maxChars = Math.max(12, Math.floor((scoreBoxX - cursorX - 1.2) / (compact ? 1.25 : 1.4)));
    const label = row.isByeSide ? 'BYE' : truncateText(row.name, Math.min(24, maxChars));

    doc.setTextColor(...(row.isByeSide ? ROSE_TXT : SLATE_DARK));
    doc.setFont('helvetica', row.isByeSide ? 'italic' : 'bold');
    doc.setFontSize(compact ? 5.8 : 6.6);
    doc.text(label, cursorX, textY);

    // Writable Score Box
    if (!row.isByeSide && !match.isBye) {
      const boxY = rowTop + (rowH - scoreBoxH) / 2;
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(...SLATE_BORDER);
      doc.setLineWidth(0.22);
      doc.rect(scoreBoxX, boxY, scoreBoxW, scoreBoxH, 'FD');
      if (row.score !== null && row.score !== undefined && row.score !== '') {
        doc.setTextColor(...SLATE_DARK);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(compact ? 5.6 : 6.2);
        doc.text(String(row.score), scoreBoxX + scoreBoxW / 2, textY, { align: 'center' });
      }
    }
  });
};

/**
 * Draws an orthogonal step bracket connector between two feeder boxes and target box
 */
const drawBracketElbow = (
  doc: jsPDF,
  xFromRight: number,
  yTopCenter: number,
  yBotCenter: number,
  xToLeft: number,
  yTargetCenter: number
) => {
  const midX = xFromRight + (xToLeft - xFromRight) * 0.5;
  doc.setDrawColor(71, 85, 105);
  doc.setLineWidth(0.32);
  doc.line(xFromRight, yTopCenter, midX, yTopCenter);
  doc.line(xFromRight, yBotCenter, midX, yBotCenter);
  doc.line(midX, yTopCenter, midX, yBotCenter);
  doc.line(midX, yTargetCenter, xToLeft, yTargetCenter);
};

/**
 * Renders a Knockout Bracket Grid Slice inside bounding area (areaX, areaY, areaW, areaH)
 */
const renderBracketArea = (
  doc: jsPDF,
  tree: KnockoutDrawTree,
  slice: BracketPageSlice,
  areaX: number,
  areaY: number,
  areaW: number,
  areaH: number,
  options?: { reserveWinnerBadge?: boolean }
) => {
  const roundCount = slice.endRound - slice.startRound;
  if (roundCount <= 0) return;

  const firstRoundMatchStart = Math.floor(slice.slotStart / Math.pow(2, slice.startRound + 1));
  const firstRoundMatchEnd = Math.ceil(slice.slotEnd / Math.pow(2, slice.startRound + 1));
  const firstRoundMatchesVisible = Math.max(1, firstRoundMatchEnd - firstRoundMatchStart);

  // Column widths & gaps
  const winnerPanelW = options?.reserveWinnerBadge ? 28 : 0;
  const colGap = roundCount >= 5 ? 6.5 : roundCount === 4 ? 8 : 11;
  const cardW = Math.min(62, Math.max(36, (areaW - winnerPanelW - colGap * (roundCount - 1)) / roundCount));
  const roundHeaderH = 6.5;
  const gridTop = areaY + roundHeaderH;
  const gridH = areaH - roundHeaderH;

  // Store center coordinates [localRoundIdx][localMatchIdx] = { x, y, w, h }
  const coords: Array<Array<{ x: number; y: number; w: number; h: number }>> = [];

  for (let lr = 0; lr < roundCount; lr++) {
    const absRoundIdx = slice.startRound + lr;
    const roundData = tree.rounds[absRoundIdx];
    if (!roundData) continue;

    const colX = areaX + lr * (cardW + colGap);

    // Column Header Pill Bar
    doc.setFillColor(...NAVY);
    doc.roundedRect(colX, areaY, cardW, 4.8, 0.8, 0.8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.text(roundData.roundName.toUpperCase(), colX + cardW / 2, areaY + 3.4, { align: 'center' });

    const scaleDiv = Math.pow(2, lr);
    const startIdx = Math.floor(firstRoundMatchStart / scaleDiv);
    const matchesInSlice = Math.max(1, Math.floor(firstRoundMatchesVisible / scaleDiv));
    const slotSpanH = gridH / matchesInSlice;
    const cardH = Math.min(18.5, Math.max(9.2, slotSpanH * 0.78));

    coords[lr] = [];

    for (let lm = 0; lm < matchesInSlice; lm++) {
      const absMatchIdx = startIdx + lm;
      const match = roundData.matches[absMatchIdx];
      if (!match) continue;

      let cardY = gridTop + lm * slotSpanH + (slotSpanH - cardH) / 2;
      if (lr > 0 && coords[lr - 1]?.[lm * 2] && coords[lr - 1]?.[lm * 2 + 1]) {
        const topC = coords[lr - 1][lm * 2];
        const botC = coords[lr - 1][lm * 2 + 1];
        const midY = (topC.y + topC.h / 2 + botC.y + botC.h / 2) / 2;
        cardY = midY - cardH / 2;
      }

      const isFinalMatch = absRoundIdx === tree.totalRounds - 1 && lm === 0;
      drawVectorMatchCard(doc, colX, cardY, cardW, cardH, match, {
        highlightGold: isFinalMatch,
        compact: matchesInSlice >= 12
      });

      coords[lr].push({ x: colX, y: cardY, w: cardW, h: cardH });

      // Draw elbow connector from previous visible round pair
      if (lr > 0 && coords[lr - 1]?.[lm * 2] && coords[lr - 1]?.[lm * 2 + 1]) {
        const prevTop = coords[lr - 1][lm * 2];
        const prevBot = coords[lr - 1][lm * 2 + 1];
        drawBracketElbow(
          doc,
          prevTop.x + prevTop.w,
          prevTop.y + prevTop.h / 2,
          prevBot.y + prevBot.h / 2,
          colX,
          cardY + cardH / 2
        );
      }

      // If this is a feeder slice page (Upper/Lower Half or Quarter), show feeder arrow to Quarterfinals / Semifinals
      if (slice.mode === 'slice' && !slice.isA3BottomWithFinals && lr === roundCount - 1) {
        const targetAbsMatch = Math.floor(absMatchIdx / 2);
        const nextRoundShort = tree.rounds[absRoundIdx + 1]?.shortName || 'QF';
        const arrowX1 = colX + cardW;
        const arrowY = cardY + cardH / 2;
        doc.setDrawColor(...GOLD);
        doc.setLineWidth(0.5);
        doc.line(arrowX1, arrowY, arrowX1 + 4, arrowY);
        doc.setFillColor(...GOLD);
        doc.roundedRect(arrowX1 + 4, arrowY - 2.6, 15.5, 5.2, 0.8, 0.8, 'F');
        doc.setTextColor(...NAVY);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(5.5);
        doc.text(`TO ${nextRoundShort}${targetAbsMatch + 1}`, arrowX1 + 11.75, arrowY + 0.9, {
          align: 'center'
        });
      }

      // Champion Badge if Grand Final
      if (isFinalMatch && options?.reserveWinnerBadge) {
        const badgeX = colX + cardW + 4.5;
        const badgeY = cardY + cardH / 2 - 6;
        doc.setDrawColor(...GOLD);
        doc.setLineWidth(0.5);
        doc.line(colX + cardW, cardY + cardH / 2, badgeX, cardY + cardH / 2);
        doc.setFillColor(...GOLD_TINT);
        doc.roundedRect(badgeX, badgeY, 23, 12, 1.2, 1.2, 'FD');
        doc.setTextColor(...NAVY);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.5);
        doc.text('CHAMPION', badgeX + 11.5, badgeY + 4.5, { align: 'center' });
        doc.setDrawColor(...SLATE_BORDER);
        doc.line(badgeX + 2, badgeY + 9.2, badgeX + 21, badgeY + 9.2);
      }
    }
  }

  // Optional 3rd Place Playoff box under Championship Final
  if (slice.includeThirdPlace && tree.thirdPlaceMatch && roundCount >= 2) {
    const lastCol = coords[roundCount - 1]?.[0];
    if (lastCol) {
      const tpW = Math.min(cardW, 56);
      const tpH = 14.5;
      const tpX = lastCol.x;
      const tpY = Math.min(areaY + areaH - tpH - 1, lastCol.y + lastCol.h + 12);
      if (tpY > lastCol.y + lastCol.h + 4) {
        doc.setTextColor(...SLATE_MED);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6);
        doc.text('3RD PLACE PLAYOFF (BRONZE)', tpX, tpY - 1.5);
        drawVectorMatchCard(doc, tpX, tpY, tpW, tpH, tree.thirdPlaceMatch);
      }
    }
  }
};

/**
 * Renders Right-Side Match Schedule + Rules Summary Panel (used for <= 8 Teams on 1 Page A4 Landscape)
 */
const renderCompactScheduleSidebar = (
  doc: jsPDF,
  tree: KnockoutDrawTree,
  config: TournamentPdfConfig,
  panelX: number,
  panelY: number,
  panelW: number,
  panelH: number
) => {
  doc.setFillColor(...ZEBRA_BG);
  doc.setDrawColor(...SLATE_BORDER);
  doc.setLineWidth(0.3);
  doc.roundedRect(panelX, panelY, panelW, panelH, 1.4, 1.4, 'FD');

  doc.setFillColor(...NAVY);
  doc.roundedRect(panelX, panelY, panelW, 5.5, 1.2, 1.2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text('MATCH SCHEDULE & RULES SUMMARY', panelX + panelW / 2, panelY + 3.9, { align: 'center' });

  let curY = panelY + 8.5;
  const colWidths = [9, 15, 34, 18]; // Code | Stage | Matchup | Time/Court

  // Table header
  doc.setFillColor(226, 232, 240);
  doc.rect(panelX + 2, curY - 3, panelW - 4, 4.5, 'F');
  doc.setTextColor(...SLATE_DARK);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5.5);
  doc.text('#', panelX + 3.5, curY);
  doc.text('TIME/CT', panelX + 2 + colWidths[0], curY);
  doc.text('FIXTURE', panelX + 2 + colWidths[0] + colWidths[1], curY);
  doc.text('SCORE', panelX + panelW - 3.5, curY, { align: 'right' });
  curY += 3.2;

  const playable = tree.allPlayableMatches.slice(0, 12);
  playable.forEach((m, idx) => {
    if (curY + 6.5 > panelY + panelH - 28) return;
    if (idx % 2 === 1) {
      doc.setFillColor(255, 255, 255);
      doc.rect(panelX + 2, curY - 2.2, panelW - 4, 6.2, 'F');
    }
    doc.setTextColor(...NAVY);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5.8);
    doc.text(m.matchCode, panelX + 3.5, curY + 1.2);

    doc.setTextColor(...SLATE_MED);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.2);
    doc.text(m.time.replace(' ', ''), panelX + 2 + colWidths[0], curY + 0.4);
    doc.text(truncateText(m.court, 10), panelX + 2 + colWidths[0], curY + 2.8);

    doc.setTextColor(...SLATE_DARK);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5.4);
    const matchup = `${truncateText(m.team1, 13)} v ${truncateText(m.team2, 13)}`;
    doc.text(matchup, panelX + 2 + colWidths[0] + colWidths[1], curY + 1.4);

    // Score blank box
    doc.setDrawColor(...SLATE_BORDER);
    doc.rect(panelX + panelW - 14, curY - 1, 11, 3.8, 'S');
    curY += 6.2;
  });

  // Rules summary block at bottom of sidebar
  const rulesY = panelY + panelH - 25;
  doc.setDrawColor(...SLATE_BORDER);
  doc.line(panelX + 2, rulesY, panelX + panelW - 2, rulesY);
  doc.setTextColor(...NAVY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.2);
  doc.text('TOURNAMENT REGULATIONS & BYE DATA', panelX + 3, rulesY + 4);

  doc.setTextColor(...SLATE_MED);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.5);
  const rulesLines = [
    `• Draw Size: ${tree.N} Teams in ${tree.P}-Slot Tree (${tree.byesCount} Byes)`,
    `• Format: ${config.eliminationType === 'double' ? 'Double Elimination' : 'Single Elimination Knockout'}`,
    `• Match Duration: ${config.matchDurationMins || 35} mins (+ ${config.restGapMins || 10} min interval)`,
    `• Report at assigned pitch 15 mins prior to kick-off.`
  ];
  rulesLines.forEach((line, i) => {
    doc.text(line, panelX + 3, rulesY + 8.5 + i * 3.8);
  });
};

/**
 * Renders Knockout Bracket Pages onto `doc`
 */
const renderKnockoutSection = (
  doc: jsPDF,
  config: TournamentPdfConfig,
  pageMetas: PageMetaRecord[],
  isFirstSection: boolean
) => {
  const tree = buildSeededKnockoutDraw(config);
  const pagination = computeKnockoutPaginationPlan(
    tree.N,
    tree.P,
    tree.totalRounds,
    config.paperSize,
    config.eliminationType || 'single'
  );

  pagination.forEach((slice, idx) => {
    if (!(isFirstSection && idx === 0)) {
      doc.addPage(config.paperSize.toLowerCase() as 'a4' | 'a3', 'landscape');
    }
    pageMetas.push({
      pageNumber: pageMetas.length + 1,
      sectionLabel: slice.sectionLabel,
      isRoundRobinPage: false
    });

    const { contentX, contentW, contentTop, contentH } = getContentBounds(doc);

    if (slice.mode === 'full-with-schedule') {
      const bracketW = contentW * 0.68;
      const sidebarW = contentW - bracketW - 5;
      renderBracketArea(doc, tree, slice, contentX, contentTop, bracketW, contentH, {
        reserveWinnerBadge: true
      });
      renderCompactScheduleSidebar(
        doc,
        tree,
        config,
        contentX + bracketW + 5,
        contentTop,
        sidebarW,
        contentH
      );
    } else if (slice.isA3BottomWithFinals) {
      // 64-team A3 Page 2: Left 70% Bottom 32 Tree, Right 28% Championship Stage (SF -> Final)
      const leftW = contentW * 0.7;
      const rightW = contentW - leftW - 6;
      renderBracketArea(doc, tree, slice, contentX, contentTop, leftW, contentH);

      const finalSlice: BracketPageSlice = {
        ...slice,
        mode: 'final-stage',
        slotStart: 0,
        slotEnd: tree.P,
        startRound: tree.totalRounds - 2, // SF -> Final
        endRound: tree.totalRounds,
        includeThirdPlace: true,
        isA3BottomWithFinals: false
      };
      const panelX = contentX + leftW + 6;
      doc.setFillColor(...ZEBRA_BG);
      doc.setDrawColor(...GOLD);
      doc.setLineWidth(0.4);
      doc.roundedRect(panelX - 2, contentTop - 1, rightW + 2, contentH + 2, 1.5, 1.5, 'FD');
      renderBracketArea(doc, tree, finalSlice, panelX, contentTop + 2, rightW - 2, contentH - 4, {
        reserveWinnerBadge: true
      });
    } else if (slice.mode === 'losers-stage') {
      renderLosersAndGrandFinalPage(doc, tree, contentX, contentTop, contentW, contentH);
    } else {
      const reserveWinner = slice.mode === 'single-full' || slice.mode === 'final-stage';
      renderBracketArea(doc, tree, slice, contentX, contentTop, contentW, contentH, {
        reserveWinnerBadge: reserveWinner
      });
    }
  });
};

/**
 * Renders Double-Elimination Losers Bracket + Grand Final onto a dedicated Landscape Page
 */
const renderLosersAndGrandFinalPage = (
  doc: jsPDF,
  tree: KnockoutDrawTree,
  areaX: number,
  areaY: number,
  areaW: number,
  areaH: number
) => {
  const cols = tree.losersRounds.length + (tree.grandFinalMatch ? 1 : 0);
  if (cols === 0) return;

  const colGap = 5.5;
  const cardW = Math.min(54, Math.max(32, (areaW - colGap * (cols - 1)) / cols));
  const gridTop = areaY + 7;
  const gridH = areaH - 7;

  tree.losersRounds.forEach((lr, cIdx) => {
    const colX = areaX + cIdx * (cardW + colGap);
    doc.setFillColor(...NAVY);
    doc.roundedRect(colX, areaY, cardW, 4.8, 0.8, 0.8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.2);
    doc.text(lr.roundName.toUpperCase(), colX + cardW / 2, areaY + 3.4, { align: 'center' });

    const count = Math.max(1, lr.matches.length);
    const slotH = gridH / count;
    const cardH = Math.min(16, Math.max(9.5, slotH * 0.76));

    lr.matches.forEach((m, mIdx) => {
      const cardY = gridTop + mIdx * slotH + (slotH - cardH) / 2;
      drawVectorMatchCard(doc, colX, cardY, cardW, cardH, m, { compact: count >= 8 });
    });
  });

  if (tree.grandFinalMatch) {
    const gfX = areaX + tree.losersRounds.length * (cardW + colGap);
    doc.setFillColor(...GOLD);
    doc.roundedRect(gfX, areaY, cardW, 4.8, 0.8, 0.8, 'F');
    doc.setTextColor(...NAVY);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.4);
    doc.text('GRAND FINAL', gfX + cardW / 2, areaY + 3.4, { align: 'center' });

    const gfH = 18;
    const gfY = gridTop + gridH / 2 - gfH / 2;
    drawVectorMatchCard(doc, gfX, gfY, cardW, gfH, tree.grandFinalMatch, { highlightGold: true });

    doc.setTextColor(...SLATE_MED);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(5.5);
    doc.text('Bracket Reset match applies if', gfX + cardW / 2, gfY + gfH + 4.5, { align: 'center' });
    doc.text('Losers Bracket finalist wins GF.', gfX + cardW / 2, gfY + gfH + 7.5, { align: 'center' });
  }
};

/**
 * Renders Round Robin Pools (A4 Portrait, 1 or 2 Pools per page) + Stage 2 Playoffs if Combination
 */
const renderRoundRobinPoolsSection = (
  doc: jsPDF,
  config: TournamentPdfConfig,
  pageMetas: PageMetaRecord[],
  isFirstSection: boolean
) => {
  const { pools, playoffTree } = buildPoolsAndStandings(config);

  const ensurePortraitPage = (label: string, firstPoolPage: boolean) => {
    if (!(isFirstSection && firstPoolPage)) {
      doc.addPage('a4', 'portrait');
    }
    pageMetas.push({
      pageNumber: pageMetas.length + 1,
      sectionLabel: label,
      isRoundRobinPage: true
    });
    return getContentBounds(doc);
  };

  let curBounds = ensurePortraitPage(
    config.format === 'combination' ? 'STAGE 1: POOL STANDINGS & SCHEDULES' : 'ROUND ROBIN STANDINGS & MATCH SCHEDULE',
    true
  );
  let curY = curBounds.contentTop;
  let poolsOnCurrentPage = 0;

  const drawPoolStandingsAndMatrix = (pool: PoolData, startY: number): number => {
    const x = curBounds.contentX;
    const w = curBounds.contentW;
    let y = startY;

    // Pool Section Header Strip
    doc.setFillColor(...NAVY);
    doc.roundedRect(x, y, w, 6, 1, 1, 'F');
    doc.setTextColor(...GOLD);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.2);
    doc.text(`${pool.poolName.toUpperCase()} (${pool.teams.length} TEAMS)`, x + 3, y + 4.2);
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(6.5);
    doc.text(`${pool.matches.length} SCHEDULED MATCHES`, x + w - 3, y + 4.2, { align: 'right' });
    y += 8;

    // 1. Official Standings Table: Pos | Team/School | P | W | D | L | GF | GA | GD | Pts
    const standingsCols = [
      { label: 'POS', w: 9, align: 'center' as const },
      { label: 'TEAM / SCHOOL', w: 72, align: 'left' as const },
      { label: 'P', w: 10, align: 'center' as const },
      { label: 'W', w: 10, align: 'center' as const },
      { label: 'D', w: 10, align: 'center' as const },
      { label: 'L', w: 10, align: 'center' as const },
      { label: 'GF', w: 12, align: 'center' as const },
      { label: 'GA', w: 12, align: 'center' as const },
      { label: 'GD', w: 13, align: 'center' as const },
      { label: 'PTS', w: 18, align: 'center' as const }
    ];
    // Adjust Team width dynamically to fill exact w (188mm)
    const fixedW = standingsCols.reduce((a, c, idx) => (idx === 1 ? a : a + c.w), 0);
    standingsCols[1].w = w - fixedW;

    const drawTableHeader = (hdrY: number) => {
      doc.setFillColor(226, 232, 240);
      doc.setDrawColor(...SLATE_BORDER);
      doc.setLineWidth(0.25);
      doc.rect(x, hdrY, w, 5.2, 'FD');
      let cx = x;
      doc.setTextColor(...NAVY);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.2);
      standingsCols.forEach((col) => {
        const tx = col.align === 'center' ? cx + col.w / 2 : cx + 2;
        doc.text(col.label, tx, hdrY + 3.6, { align: col.align });
        cx += col.w;
      });
    };

    drawTableHeader(y);
    y += 5.2;

    const rowH = 5.0;
    pool.standings.forEach((row, idx) => {
      doc.setFillColor(...(idx % 2 === 1 ? ZEBRA_BG : ([255, 255, 255] as [number, number, number])));
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.2);
      doc.rect(x, y, w, rowH, 'FD');

      let cx = x;
      const vals = [
        String(row.pos),
        truncateText(row.team, 28),
        String(row.played),
        String(row.won),
        String(row.drawn),
        String(row.lost),
        String(row.gf),
        String(row.ga),
        row.gd > 0 ? `+${row.gd}` : String(row.gd),
        String(row.pts)
      ];
      standingsCols.forEach((col, cIdx) => {
        if (cIdx > 0) doc.line(cx, y, cx, y + rowH);
        doc.setTextColor(...(cIdx === 9 ? NAVY : SLATE_DARK));
        doc.setFont('helvetica', cIdx === 1 || cIdx === 9 ? 'bold' : 'normal');
        doc.setFontSize(6.4);
        const tx = col.align === 'center' ? cx + col.w / 2 : cx + 2;
        doc.text(vals[cIdx], tx, y + 3.5, { align: col.align });
        cx += col.w;
      });
      y += rowH;
    });

    y += 3.5;

    // 2. Cross-Table Matrix (when team count <= 10 so matrix stays crisp & readable)
    if (pool.teams.length <= 10) {
      doc.setTextColor(...NAVY);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.6);
      doc.text('HEAD-TO-HEAD CROSS-TABLE MATRIX', x, y + 2.2);
      y += 3.5;

      const nT = pool.teams.length;
      const nameColW = Math.min(54, Math.max(38, w * 0.28));
      const cellW = (w - nameColW) / nT;
      const mRowH = 4.6;

      // Matrix Header
      doc.setFillColor(226, 232, 240);
      doc.setDrawColor(...SLATE_BORDER);
      doc.rect(x, y, w, mRowH, 'FD');
      doc.setTextColor(...NAVY);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(5.5);
      doc.text('TEAM', x + 2, y + 3.2);
      pool.teams.forEach((t, tIdx) => {
        const cx = x + nameColW + tIdx * cellW;
        doc.line(cx, y, cx, y + mRowH);
        const shortTag = nT <= 5 ? truncateText(t, 9) : `T${tIdx + 1}`;
        doc.text(shortTag, cx + cellW / 2, y + 3.2, { align: 'center' });
      });
      y += mRowH;

      pool.teams.forEach((rowTeam, rIdx) => {
        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(203, 213, 225);
        doc.rect(x, y, w, mRowH, 'FD');

        doc.setTextColor(...SLATE_DARK);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(5.6);
        doc.text(`${nT > 5 ? `T${rIdx + 1}. ` : ''}${truncateText(rowTeam, 18)}`, x + 1.8, y + 3.2);

        pool.teams.forEach((colTeam, cIdx) => {
          const cx = x + nameColW + cIdx * cellW;
          if (rIdx === cIdx) {
            doc.setFillColor(203, 213, 225);
            doc.rect(cx, y, cellW, mRowH, 'FD');
          } else {
            doc.line(cx, y, cx, y + mRowH);
            const score = pool.crossTable[rowTeam]?.[colTeam] || '';
            if (score) {
              doc.setTextColor(...NAVY);
              doc.setFont('helvetica', 'bold');
              doc.setFontSize(5.5);
              doc.text(score, cx + cellW / 2, y + 3.2, { align: 'center' });
            }
          }
        });
        y += mRowH;
      });
      y += 3.5;
    }

    return y;
  };

  const drawMatchOrderTable = (pool: PoolData, startY: number): number => {
    const x = curBounds.contentX;
    const w = curBounds.contentW;
    let y = startY;

    // Columns: Match # | Round | Date & Time | Pitch/Court | Team A | Score Box [ ]-[ ] | Team B | Referee Sign
    const cols = [
      { label: 'M#', w: 12, align: 'center' as const },
      { label: 'RND', w: 13, align: 'center' as const },
      { label: 'DATE & TIME', w: 30, align: 'left' as const },
      { label: 'COURT', w: 18, align: 'center' as const },
      { label: 'TEAM A', w: 36, align: 'left' as const },
      { label: 'SCORE', w: 20, align: 'center' as const },
      { label: 'TEAM B', w: 36, align: 'left' as const },
      { label: 'REF SIGN', w: 23, align: 'center' as const }
    ];
    const usedW = cols.reduce((acc, c) => acc + c.w, 0);
    cols[4].w += (w - usedW) / 2;
    cols[6].w += (w - usedW) / 2;

    const drawSubHeadingAndCols = (topY: number, continuation = false) => {
      doc.setTextColor(...NAVY);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.8);
      doc.text(
        `${pool.poolName.toUpperCase()} — ROUND-BY-ROUND MATCH ORDER${continuation ? ' (CONT.)' : ''}`,
        x,
        topY + 2.5
      );
      const hY = topY + 3.8;
      doc.setFillColor(...NAVY);
      doc.rect(x, hY, w, 5.2, 'F');
      let cx = x;
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(5.6);
      cols.forEach((col) => {
        const tx = col.align === 'center' ? cx + col.w / 2 : cx + 1.8;
        doc.text(col.label, tx, hY + 3.6, { align: col.align });
        cx += col.w;
      });
      return hY + 5.2;
    };

    if (y + 15 > curBounds.contentBottom) {
      curBounds = ensurePortraitPage(`${pool.poolName.toUpperCase()} — MATCH ORDER`, false);
      y = curBounds.contentTop;
      poolsOnCurrentPage = 0;
    }

    y = drawSubHeadingAndCols(y, false);

    const rowH = 5.4;
    pool.matches.forEach((m, idx) => {
      if (y + rowH > curBounds.contentBottom) {
        curBounds = ensurePortraitPage(`${pool.poolName.toUpperCase()} — MATCH ORDER (CONT.)`, false);
        y = drawSubHeadingAndCols(curBounds.contentTop, true);
        poolsOnCurrentPage = 0;
      }

      doc.setFillColor(...(idx % 2 === 1 ? ZEBRA_BG : ([255, 255, 255] as [number, number, number])));
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.2);
      doc.rect(x, y, w, rowH, 'FD');

      let cx = x;
      cols.forEach((col, cIdx) => {
        if (cIdx > 0) doc.line(cx, y, cx, y + rowH);
        const tx = col.align === 'center' ? cx + col.w / 2 : cx + 1.8;
        const ty = y + 3.7;
        doc.setTextColor(...SLATE_DARK);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(5.9);

        if (cIdx === 0) {
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(...NAVY);
          doc.text(m.matchCode, tx, ty, { align: 'center' });
        } else if (cIdx === 1) {
          doc.text(`R${m.roundNumber || 1}`, tx, ty, { align: 'center' });
        } else if (cIdx === 2) {
          doc.text(`${m.date} ${m.time}`, tx, ty);
        } else if (cIdx === 3) {
          doc.text(truncateText(m.court, 10), tx, ty, { align: 'center' });
        } else if (cIdx === 4) {
          doc.setFont('helvetica', 'bold');
          doc.text(truncateText(m.team1, 18), tx, ty);
        } else if (cIdx === 5) {
          // Score Box [  ] - [  ]
          const bW = 6.2;
          const bH = 3.6;
          const bY = y + (rowH - bH) / 2;
          const midX = cx + col.w / 2;
          doc.setFillColor(255, 255, 255);
          doc.setDrawColor(...SLATE_BORDER);
          doc.rect(midX - bW - 1.5, bY, bW, bH, 'FD');
          doc.rect(midX + 1.5, bY, bW, bH, 'FD');
          doc.text('-', midX, ty, { align: 'center' });
          if (m.completed && m.score1 !== null && m.score2 !== null) {
            doc.setFont('helvetica', 'bold');
            doc.text(String(m.score1), midX - bW / 2 - 1.5, ty, { align: 'center' });
            doc.text(String(m.score2), midX + bW / 2 + 1.5, ty, { align: 'center' });
          }
        } else if (cIdx === 6) {
          doc.setFont('helvetica', 'bold');
          doc.text(truncateText(m.team2, 18), tx, ty);
        }
        cx += col.w;
      });

      y += rowH;
    });

    return y;
  };

  pools.forEach((pool, pIdx) => {
    const estStandingsH = 12 + pool.standings.length * 5 + (pool.teams.length <= 10 ? 8 + (pool.teams.length + 1) * 4.6 : 0);
    const estMatchOrderH = 10 + Math.min(pool.matches.length, 10) * 5.4;
    const estTotalH = estStandingsH + estMatchOrderH;

    // Fit 1 or 2 pools per A4 portrait page cleanly
    if (
      pIdx > 0 &&
      (poolsOnCurrentPage >= 2 || pool.teams.length > 5 || curY + estTotalH > curBounds.contentBottom)
    ) {
      curBounds = ensurePortraitPage(`${pool.poolName.toUpperCase()} — STANDINGS & SCHEDULE`, false);
      curY = curBounds.contentTop;
      poolsOnCurrentPage = 0;
    }

    curY = drawPoolStandingsAndMatrix(pool, curY);
    curY = drawMatchOrderTable(pool, curY);
    curY += 7;
    poolsOnCurrentPage++;
  });

  // For Combination Tournament, append Stage 2 Playoff Knockout Bracket on Landscape Page
  if (playoffTree) {
    doc.addPage(config.paperSize.toLowerCase() as 'a4' | 'a3', 'landscape');
    pageMetas.push({
      pageNumber: pageMetas.length + 1,
      sectionLabel: 'STAGE 2: KNOCKOUT PLAYOFF BRACKET',
      isRoundRobinPage: false
    });
    const bounds = getContentBounds(doc);
    renderBracketArea(
      doc,
      playoffTree,
      {
        pageNumber: pageMetas.length,
        title: 'Stage 2 Knockout Playoffs',
        sectionLabel: 'STAGE 2 KNOCKOUT PLAYOFFS',
        mode: 'final-stage',
        slotStart: 0,
        slotEnd: playoffTree.P,
        startRound: 0,
        endRound: playoffTree.totalRounds,
        includeThirdPlace: true
      },
      bounds.contentX,
      bounds.contentTop,
      bounds.contentW,
      bounds.contentH,
      { reserveWinnerBadge: true }
    );
  }
};

/**
 * Renders Team-Wise View (2–3 teams per A4 Portrait page, NEVER splitting a team block mid-table)
 */
const renderTeamWiseViewSection = (
  doc: jsPDF,
  teamSchedules: TeamScheduleGroup[],
  pageMetas: PageMetaRecord[],
  isFirstSection: boolean
) => {
  const newPage = (first: boolean) => {
    if (!(isFirstSection && first)) {
      doc.addPage('a4', 'portrait');
    }
    pageMetas.push({
      pageNumber: pageMetas.length + 1,
      sectionLabel: 'TEAM-WISE FIXTURE SHEETS',
      isRoundRobinPage: false
    });
    return getContentBounds(doc);
  };

  let bounds = newPage(true);
  let curY = bounds.contentTop;
  let blocksOnPage = 0;

  const cols = [
    { label: 'MATCH #', w: 17, align: 'center' as const },
    { label: 'STAGE / POOL', w: 34, align: 'left' as const },
    { label: 'OPPONENT', w: 56, align: 'left' as const },
    { label: 'COURT / FIELD', w: 25, align: 'center' as const },
    { label: 'REPORT TIME', w: 30, align: 'center' as const },
    { label: 'SCORE', w: 26, align: 'center' as const }
  ];
  const sumW = cols.reduce((s, c) => s + c.w, 0);
  cols[2].w += bounds.contentW - sumW;

  teamSchedules.forEach((team) => {
    const rowsCount = Math.max(1, team.matches.length);
    const blockHeight = 14 + rowsCount * 5.6 + 5;

    // Never split a team block across pages; keep max 3 teams per A4 page for crisp noticeboard readability
    if (
      blocksOnPage > 0 &&
      (blocksOnPage >= 3 || curY + blockHeight > bounds.contentBottom)
    ) {
      bounds = newPage(false);
      curY = bounds.contentTop;
      blocksOnPage = 0;
    }

    const x = bounds.contentX;
    const w = bounds.contentW;

    // Team Header Bar
    doc.setFillColor(...NAVY);
    doc.roundedRect(x, curY, w, 6.8, 1, 1, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.2);
    doc.text(truncateText(team.teamName.toUpperCase(), 34), x + 3, curY + 4.7);

    doc.setTextColor(...GOLD);
    doc.setFontSize(7.2);
    doc.text(
      `${team.seedOrPool.toUpperCase()}  •  ${team.matches.length} SCHEDULED ${team.matches.length === 1 ? 'MATCH' : 'MATCHES'}`,
      x + w - 3,
      curY + 4.7,
      { align: 'right' }
    );
    curY += 6.8;

    // Table Header
    doc.setFillColor(226, 232, 240);
    doc.setDrawColor(...SLATE_BORDER);
    doc.rect(x, curY, w, 5, 'FD');
    let cx = x;
    doc.setTextColor(...NAVY);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5.8);
    cols.forEach((col) => {
      const tx = col.align === 'center' ? cx + col.w / 2 : cx + 2;
      doc.text(col.label, tx, curY + 3.5, { align: col.align });
      cx += col.w;
    });
    curY += 5;

    if (team.matches.length === 0) {
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(203, 213, 225);
      doc.rect(x, curY, w, 5.6, 'FD');
      doc.setTextColor(...SLATE_MED);
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(6.2);
      doc.text('Awaiting bracket progression / knockout pairing', x + w / 2, curY + 3.8, { align: 'center' });
      curY += 5.6;
    } else {
      team.matches.forEach((m, rIdx) => {
        doc.setFillColor(...(rIdx % 2 === 1 ? ZEBRA_BG : ([255, 255, 255] as [number, number, number])));
        doc.setDrawColor(203, 213, 225);
        doc.rect(x, curY, w, 5.6, 'FD');

        let rcx = x;
        const rowVals = [
          m.matchCode,
          truncateText(m.stage, 20),
          truncateText(m.opponent, 24),
          truncateText(m.court, 13),
          `${m.date} • ${m.time}`,
          m.scoreDisplay
        ];
        cols.forEach((col, cIdx) => {
          if (cIdx > 0) doc.line(rcx, curY, rcx, curY + 5.6);
          doc.setTextColor(...(cIdx === 0 ? NAVY : SLATE_DARK));
          doc.setFont('helvetica', cIdx === 0 || cIdx === 2 ? 'bold' : 'normal');
          doc.setFontSize(6.2);
          const tx = col.align === 'center' ? rcx + col.w / 2 : rcx + 2;
          doc.text(rowVals[cIdx], tx, curY + 3.8, { align: col.align });
          rcx += col.w;
        });
        curY += 5.6;
      });
    }

    curY += 6;
    blocksOnPage++;
  });
};

/**
 * Renders Chronological Master Order of Play (A4 Portrait)
 */
const renderMasterOrderOfPlaySection = (
  doc: jsPDF,
  matches: UnifiedMatch[],
  pageMetas: PageMetaRecord[],
  isFirstSection: boolean
) => {
  const newPage = (first: boolean) => {
    if (!(isFirstSection && first)) {
      doc.addPage('a4', 'portrait');
    }
    pageMetas.push({
      pageNumber: pageMetas.length + 1,
      sectionLabel: 'MASTER ORDER OF PLAY (OFFICIAL DESK)',
      isRoundRobinPage: false
    });
    return getContentBounds(doc);
  };

  let bounds = newPage(true);
  const x = bounds.contentX;
  const w = bounds.contentW;

  const cols = [
    { label: 'M#', w: 12, align: 'center' as const },
    { label: 'TIME', w: 22, align: 'center' as const },
    { label: 'COURT / PITCH', w: 24, align: 'center' as const },
    { label: 'STAGE / ROUND', w: 28, align: 'left' as const },
    { label: 'TEAM A', w: 35, align: 'left' as const },
    { label: 'SCORE', w: 20, align: 'center' as const },
    { label: 'TEAM B', w: 35, align: 'left' as const },
    { label: 'REF SIGN', w: 14, align: 'center' as const }
  ];
  const used = cols.reduce((acc, c) => acc + c.w, 0);
  cols[4].w += (w - used) / 2;
  cols[6].w += (w - used) / 2;

  const drawHeaderRow = (topY: number) => {
    doc.setFillColor(...NAVY);
    doc.rect(x, topY, w, 5.6, 'F');
    let cx = x;
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5.8);
    cols.forEach((col) => {
      const tx = col.align === 'center' ? cx + col.w / 2 : cx + 1.8;
      doc.text(col.label, tx, topY + 3.8, { align: col.align });
      cx += col.w;
    });
    return topY + 5.6;
  };

  let curY = drawHeaderRow(bounds.contentTop);
  const rowH = 5.6;

  matches.forEach((m, idx) => {
    if (curY + rowH > bounds.contentBottom) {
      bounds = newPage(false);
      curY = drawHeaderRow(bounds.contentTop);
    }

    doc.setFillColor(...(idx % 2 === 1 ? ZEBRA_BG : ([255, 255, 255] as [number, number, number])));
    doc.setDrawColor(203, 213, 225);
    doc.rect(x, curY, w, rowH, 'FD');

    let cx = x;
    cols.forEach((col, cIdx) => {
      if (cIdx > 0) doc.line(cx, curY, cx, curY + rowH);
      const tx = col.align === 'center' ? cx + col.w / 2 : cx + 1.8;
      const ty = curY + 3.8;
      doc.setTextColor(...SLATE_DARK);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(5.9);

      if (cIdx === 0) {
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...NAVY);
        doc.text(m.matchCode, tx, ty, { align: 'center' });
      } else if (cIdx === 1) {
        doc.setFont('helvetica', 'bold');
        doc.text(m.time, tx, ty, { align: 'center' });
      } else if (cIdx === 2) {
        doc.text(truncateText(m.court, 13), tx, ty, { align: 'center' });
      } else if (cIdx === 3) {
        doc.text(truncateText(m.stage, 16), tx, ty);
      } else if (cIdx === 4) {
        doc.setFont('helvetica', 'bold');
        doc.text(truncateText(m.team1, 18), tx, ty);
      } else if (cIdx === 5) {
        const bW = 6.0;
        const bH = 3.6;
        const bY = curY + (rowH - bH) / 2;
        const midX = cx + col.w / 2;
        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(...SLATE_BORDER);
        doc.rect(midX - bW - 1.4, bY, bW, bH, 'FD');
        doc.rect(midX + 1.4, bY, bW, bH, 'FD');
        doc.text('-', midX, ty, { align: 'center' });
      } else if (cIdx === 6) {
        doc.setFont('helvetica', 'bold');
        doc.text(truncateText(m.team2, 18), tx, ty);
      }
      cx += col.w;
    });

    curY += rowH;
  });
};

/**
 * Main Pure Vector PDF Document Builder
 * Never uses html2canvas, toPng, or DOM screenshots.
 */
export const buildTournamentVectorPdf = (config: TournamentPdfConfig): {
  doc: jsPDF;
  fileName: string;
  pageCount: number;
} => {
  const effectiveView = config.viewMode;
  const startsPortrait =
    effectiveView === 'team-view' ||
    effectiveView === 'master-schedule' ||
    effectiveView === 'round-robin-pools' ||
    (effectiveView === 'complete-pack' && config.format !== 'knockout') ||
    (effectiveView === 'full-bracket' && config.format !== 'knockout');

  const initialFormat = startsPortrait ? 'a4' : (config.paperSize.toLowerCase() as 'a4' | 'a3');
  const initialOrientation = startsPortrait ? 'portrait' : 'landscape';

  const doc = new jsPDF({
    orientation: initialOrientation,
    unit: 'mm',
    format: initialFormat
  });

  const pageMetas: PageMetaRecord[] = [];
  let isFirstSection = true;

  const includePrimaryDraw =
    effectiveView === 'full-bracket' ||
    effectiveView === 'round-robin-pools' ||
    effectiveView === 'complete-pack';

  if (includePrimaryDraw) {
    if (config.format === 'knockout' && effectiveView !== 'round-robin-pools') {
      renderKnockoutSection(doc, config, pageMetas, isFirstSection);
    } else {
      renderRoundRobinPoolsSection(doc, config, pageMetas, isFirstSection);
    }
    isFirstSection = false;
  }

  if (effectiveView === 'team-view' || effectiveView === 'complete-pack') {
    const { teamSchedules } = buildTeamSchedulesAndOrderOfPlay(config);
    renderTeamWiseViewSection(doc, teamSchedules, pageMetas, isFirstSection);
    isFirstSection = false;
  }

  if (effectiveView === 'master-schedule' || effectiveView === 'complete-pack') {
    const { masterOrderOfPlay } = buildTeamSchedulesAndOrderOfPlay(config);
    renderMasterOrderOfPlaySection(doc, masterOrderOfPlay, pageMetas, isFirstSection);
    isFirstSection = false;
  }

  stampHeadersAndFooters(doc, config, pageMetas);

  const safeSlug = (config.tournamentName || 'Tournament').replace(/[^a-z0-9]+/gi, '_').replace(/^_|_$/g, '');
  const fileName = `${safeSlug}_Official_${config.paperSize}_${config.viewMode}.pdf`;

  return {
    doc,
    fileName,
    pageCount: doc.getNumberOfPages()
  };
};

export const downloadTournamentVectorPdf = (config: TournamentPdfConfig) => {
  const { doc, fileName, pageCount } = buildTournamentVectorPdf(config);
  doc.save(fileName);
  return { fileName, pageCount };
};
