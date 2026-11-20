import {
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
  query,
  where,
  onSnapshot
} from 'firebase/firestore';
import { db, auth } from './firebase.ts';
import { logError } from './logService.ts';
import {
  Student,
  FitnessResult,
  CompositeScoringPreset,
  CompositeWeightConfig,
  SportSkillScoreItem,
  DisciplineBreakdown,
  CompositeFitnessSnapshot,
  CompositeFitnessTestBreakdown,
  CompositeTermEvaluation
} from '../types.ts';
import {
  getTestDefinition,
  calculateTestScoreAndLevel,
  extractNeutralBMIHistory
} from './physicalDevelopmentEngine.ts';
import { isBrandSuperAdmin } from '../types.ts';

// =========================================================================
// 1. PRESETS & SPORT SKILL CATALOG (1 TO 8 SKILLS PER SPORT)
// =========================================================================

export const COMPOSITE_PRESETS: Record<
  CompositeScoringPreset,
  { label: string; shortLabel: string; description: string; weights: CompositeWeightConfig }
> = {
  cbse_standard_30_20_50: {
    label: 'Standard CBSE Split (30 + 20 + 50)',
    shortLabel: '30 / 20 / 50 (Standard)',
    description: '30 Fitness Tests • 20 Discipline & Kit • 50 Games & Sports Skills (Classes 4–12)',
    weights: { fitnessMax: 30, disciplineMax: 20, gamesMax: 50 }
  },
  primary_30_30_40: {
    label: 'Primary Balanced Split (30 + 30 + 40)',
    shortLabel: '30 / 30 / 40 (Primary)',
    description: '30 Motor Fitness • 30 Discipline & Participation • 40 Fundamental Games (Classes 1–3)',
    weights: { fitnessMax: 30, disciplineMax: 30, gamesMax: 40 }
  },
  custom: {
    label: 'Custom School Rubric (/100)',
    shortLabel: 'Custom Split',
    description: 'Adjust Fitness, Discipline, and Games weights so total equals 100 marks.',
    weights: { fitnessMax: 30, disciplineMax: 20, gamesMax: 50 }
  }
};

export const SPORT_SKILL_PRESETS: Record<string, string[]> = {
  Football: [
    'Passing & Receiving Accuracy',
    'Dribbling & Ball Control',
    'Shooting & Finishing',
    'Defensive Positioning & Tackling',
    'Teamwork & Game Awareness'
  ],
  Basketball: [
    'Ball Handling & Dribbling',
    'Chest & Bounce Passing',
    'Shooting Form & Lay-up',
    'Defensive Stance & Rebounding',
    'Court Spacing & Teamwork'
  ],
  Cricket: [
    'Batting Grip & Shot Selection',
    'Bowling Action & Line/Length',
    'Ground Fielding & Catching',
    'Throwing Accuracy',
    'Running Between Wickets & Spirit'
  ],
  Athletics: [
    'Starting Stance & Acceleration',
    'Running Form & Stride Mechanics',
    'Pacing & Endurance Control',
    'Jumping / Throwing Technique',
    'Finish & Track Etiquette'
  ],
  Badminton: [
    'Grip & Ready Stance',
    'High & Short Serve',
    'Overhead Clear & Drop Shot',
    'Net Play & Smash Control',
    'Footwork & Court Coverage'
  ],
  'Kho-Kho': [
    'Sitting Box Posture & Take-off',
    'Chain Kho & Pole Dive',
    'Dodging & Zig-Zag Agility',
    'Chasing Speed & Tag Timing',
    'Team Coordination & Rules'
  ],
  Kabaddi: [
    'Cant & Raiding Footwork',
    'Hand & Toe Touch Execution',
    'Ankle & Thigh Hold Technique',
    'Chain Defence Coordination',
    'Tactical Retreating & Fair Play'
  ],
  Volleyball: [
    'Underhand & Overhand Serve',
    'Forearm Pass (Digging)',
    'Overhead Set Accuracy',
    'Attack Approach & Spike',
    'Court Rotation & Communication'
  ],
  'Table Tennis': [
    'Grip & Table Stance',
    'Legal Serve & Spin Control',
    'Forehand & Backhand Drive',
    'Push & Defensive Block',
    'Rally Consistency & Rules'
  ],
  'General PE Games': [
    'Locomotor Balance & Agility',
    'Throwing, Catching & Striking',
    'Following Game Rules & Boundaries',
    'Spatial Awareness & Decision Making',
    'Cooperation & Positive Spirit'
  ]
};

export const DISCIPLINE_CRITERIA = [
  { key: 'uniform', label: 'PE Kit & Grooming', hint: 'Proper sports uniform & footwear' },
  { key: 'punctuality', label: 'Punctuality & Attendance', hint: 'On-time assembly & regular participation' },
  { key: 'sportsmanship', label: 'Fair Play & Respect', hint: 'Accepts umpire decisions & encourages peers' },
  { key: 'safety', label: 'Equipment & Safety Care', hint: 'Follows warm-up & ground safety instructions' }
] as const;

// =========================================================================
// 2. DETERMINISTIC CBSE & GLOBAL SCORING CALCULATORS
// =========================================================================

const TERM_PRIORITY: Record<string, number> = {
  Baseline: 1,
  'Term 1': 2,
  'Term 2': 3,
  'Term 3': 4,
  Annual: 5
};

/**
 * Normalizes a term string so "Baseline", "Term 1", etc. match reliably.
 */
function normalizeTerm(term?: string): string {
  return (term || 'Baseline').trim();
}

/**
 * Pure helper: pulls existing student fitness tests (3 tests, 5 tests, or any count)
 * WITHOUT altering BMI as punitive marks. BMI is attached strictly as neutral health screening.
 */
export function computeFitnessContribution(
  student: Student,
  allResults: FitnessResult[],
  preferredTerm: string,
  fitnessMaxMarks: number
): CompositeFitnessSnapshot {
  const studentResults = allResults.filter(r => r.studentId === student.id);

  // Separate non-punitive BMI screening points
  const bmiHistory = extractNeutralBMIHistory(studentResults);
  const bmiPoint = bmiHistory.length > 0 ? bmiHistory[bmiHistory.length - 1] : undefined;

  // Non-BMI physical tests
  const physicalResults = studentResults.filter(
    r => r.testId !== 'bmi' && !r.testName?.toLowerCase().includes('bmi') && (r.value || '').trim() !== ''
  );

  if (physicalResults.length === 0) {
    return {
      autoScoreOutOf100: 0,
      autoMarksAwarded: 0,
      baselineToTermBonus: 0,
      testsCounted: 0,
      sourceTermUsed: preferredTerm,
      testsSummary: [],
      bmiPoint
    };
  }

  // Group physical results by term
  const byTerm = new Map<string, FitnessResult[]>();
  physicalResults.forEach(r => {
    const t = normalizeTerm(r.term);
    if (!byTerm.has(t)) byTerm.set(t, []);
    byTerm.get(t)!.push(r);
  });

  // Choose source term: exact preferredTerm match first; else latest available term by priority/date
  let sourceTermUsed = preferredTerm;
  let termResults = byTerm.get(normalizeTerm(preferredTerm));

  if (!termResults || termResults.length === 0) {
    const availableTerms = Array.from(byTerm.keys()).sort((a, b) => {
      const pA = TERM_PRIORITY[a] || 0;
      const pB = TERM_PRIORITY[b] || 0;
      if (pA !== pB) return pB - pA;
      return b.localeCompare(a);
    });
    sourceTermUsed = availableTerms[0];
    termResults = byTerm.get(sourceTermUsed) || [];
  }

  // Deduplicate by testId keeping most recent record for the chosen term
  const latestByTest = new Map<string, FitnessResult>();
  termResults.forEach(r => {
    const existing = latestByTest.get(r.testId);
    if (!existing || new Date(r.date).getTime() >= new Date(existing.date).getTime()) {
      latestByTest.set(r.testId, r);
    }
  });

  const testsSummary: CompositeFitnessTestBreakdown[] = [];
  let sumPercent = 0;

  latestByTest.forEach(r => {
    const def = getTestDefinition(r.testId);
    const { scorePercent, level } = calculateTestScoreAndLevel(
      def,
      r.value,
      student.age || 12,
      student.gender || 'Male'
    );
    testsSummary.push({
      testId: r.testId,
      testName: r.testName || def.name,
      rawValue: r.value,
      unit: r.unit || def.unit,
      term: normalizeTerm(r.term),
      scorePercent,
      level
    });
    sumPercent += scorePercent;
  });

  const avgScore = testsSummary.length > 0 ? sumPercent / testsSummary.length : 0;

  // Baseline-to-Term improvement bonus (+0 to +5 pts) if comparing a post-baseline term against Baseline
  let baselineToTermBonus = 0;
  if (sourceTermUsed !== 'Baseline' && byTerm.has('Baseline')) {
    const baselineList = byTerm.get('Baseline')!;
    const baseByTest = new Map<string, number>();
    baselineList.forEach(b => {
      const def = getTestDefinition(b.testId);
      const { scorePercent } = calculateTestScoreAndLevel(
        def,
        b.value,
        student.age || 12,
        student.gender || 'Male'
      );
      baseByTest.set(b.testId, scorePercent);
    });

    let improvedDeltaSum = 0;
    let comparedCount = 0;
    testsSummary.forEach(curr => {
      const baseScore = baseByTest.get(curr.testId);
      if (baseScore !== undefined) {
        improvedDeltaSum += curr.scorePercent - baseScore;
        comparedCount++;
      }
    });

    if (comparedCount > 0) {
      const meanImprovement = improvedDeltaSum / comparedCount;
      if (meanImprovement >= 10) baselineToTermBonus = 5;
      else if (meanImprovement >= 5) baselineToTermBonus = 3;
      else if (meanImprovement > 1) baselineToTermBonus = 2;
    }
  }

  const autoScoreOutOf100 = Math.min(100, Math.round(avgScore + baselineToTermBonus));
  const autoMarksAwarded = Math.min(
    fitnessMaxMarks,
    Math.round((autoScoreOutOf100 / 100) * fitnessMaxMarks)
  );

  return {
    autoScoreOutOf100,
    autoMarksAwarded,
    baselineToTermBonus,
    testsCounted: testsSummary.length,
    sourceTermUsed,
    testsSummary,
    bmiPoint
  };
}

/**
 * Computes scaled discipline marks out of disciplineMax (e.g. 20 or 30).
 */
export function computeDisciplineMarks(
  scores: { uniform: number; punctuality: number; sportsmanship: number; safety: number },
  disciplineMaxMarks: number
): DisciplineBreakdown {
  const clamp = (v: number) => Math.max(0, Math.min(5, Number(v) || 0));
  const uniform = clamp(scores.uniform);
  const punctuality = clamp(scores.punctuality);
  const sportsmanship = clamp(scores.sportsmanship);
  const safety = clamp(scores.safety);
  const rawTotal = uniform + punctuality + sportsmanship + safety; // Out of 20
  const marksAwarded = Math.min(
    disciplineMaxMarks,
    Math.round((rawTotal / 20) * disciplineMaxMarks)
  );

  return {
    uniform,
    punctuality,
    sportsmanship,
    safety,
    rawTotal,
    marksAwarded
  };
}

/**
 * Scales 1-to-8 skills (scored on 1-5, 1-8, or 1-10) accurately into gamesMaxMarks (e.g. 50).
 */
export function computeGamesMarks(
  skills: SportSkillScoreItem[],
  scaleMax: 5 | 8 | 10,
  gamesMaxMarks: number
): { rawTotal: number; rawMax: number; marksAwarded: number } {
  const validSkills = skills.slice(0, 8);
  const rawMax = Math.max(1, validSkills.length) * scaleMax;
  const rawTotal = validSkills.reduce(
    (sum, s) => sum + Math.max(0, Math.min(scaleMax, Number(s.score) || 0)),
    0
  );
  const marksAwarded = Math.min(
    gamesMaxMarks,
    Math.round((rawTotal / rawMax) * gamesMaxMarks)
  );

  return { rawTotal, rawMax, marksAwarded };
}

export function mapScoreToCbseGrade(totalScore: number): CompositeTermEvaluation['cbseGrade'] {
  if (totalScore >= 91) return 'A1';
  if (totalScore >= 81) return 'A2';
  if (totalScore >= 71) return 'B1';
  if (totalScore >= 61) return 'B2';
  if (totalScore >= 51) return 'C1';
  if (totalScore >= 41) return 'C2';
  if (totalScore >= 33) return 'D';
  return 'E';
}

export function mapScoreToCoScholasticGrade(totalScore: number): CompositeTermEvaluation['coScholasticGrade'] {
  if (totalScore >= 75) return 'A';
  if (totalScore >= 50) return 'B';
  return 'C';
}

/**
 * Recalculates total marks & CBSE grades whenever weights, overrides, discipline, or games change.
 */
export function recalculateEvaluationTotals(evalDoc: CompositeTermEvaluation): CompositeTermEvaluation {
  const weights = evalDoc.weights;
  const fitnessMarks =
    evalDoc.fitnessSnapshot.manualOverrideMarks !== undefined
      ? Math.max(0, Math.min(weights.fitnessMax, Math.round(evalDoc.fitnessSnapshot.manualOverrideMarks)))
      : Math.max(0, Math.min(weights.fitnessMax, Math.round((evalDoc.fitnessSnapshot.autoScoreOutOf100 / 100) * weights.fitnessMax)));

  const discipline = computeDisciplineMarks(evalDoc.discipline, weights.disciplineMax);
  const gamesScaled = computeGamesMarks(evalDoc.games.skills, evalDoc.games.scaleMax, weights.gamesMax);

  const totalScore = Math.max(0, Math.min(100, fitnessMarks + discipline.marksAwarded + gamesScaled.marksAwarded));

  return {
    ...evalDoc,
    fitnessSnapshot: {
      ...evalDoc.fitnessSnapshot,
      autoMarksAwarded: Math.min(
        weights.fitnessMax,
        Math.round((evalDoc.fitnessSnapshot.autoScoreOutOf100 / 100) * weights.fitnessMax)
      )
    },
    discipline,
    games: {
      ...evalDoc.games,
      ...gamesScaled
    },
    totalScore,
    cbseGrade: mapScoreToCbseGrade(totalScore),
    coScholasticGrade: mapScoreToCoScholasticGrade(totalScore)
  };
}

export function buildEvaluationDocId(studentId: string, term: string, academicYear: string): string {
  const safeStudent = studentId.replace(/[^a-zA-Z0-9_-]/g, '_');
  const safeTerm = term.replace(/[^a-zA-Z0-9_-]/g, '_');
  const safeYear = academicYear.replace(/[^a-zA-Z0-9_-]/g, '_');
  return `${safeStudent}_${safeYear}_${safeTerm}`;
}

export function createDraftEvaluation(
  student: Student,
  allResults: FitnessResult[],
  options: {
    term: string;
    academicYear: string;
    preset: CompositeScoringPreset;
    weights: CompositeWeightConfig;
    sportName: string;
    scaleMax: 5 | 8 | 10;
    schoolId: string;
    teacherId: string;
  }
): CompositeTermEvaluation {
  const fitnessSnapshot = computeFitnessContribution(
    student,
    allResults,
    options.term,
    options.weights.fitnessMax
  );

  const presetSkills = SPORT_SKILL_PRESETS[options.sportName] || SPORT_SKILL_PRESETS.Football;
  const skills: SportSkillScoreItem[] = presetSkills.map((skillName, idx) => ({
    id: `sk_${idx + 1}`,
    skillName,
    score: 0
  }));

  const discipline = computeDisciplineMarks(
    { uniform: 0, punctuality: 0, sportsmanship: 0, safety: 0 },
    options.weights.disciplineMax
  );

  const gamesCalc = computeGamesMarks(skills, options.scaleMax, options.weights.gamesMax);

  const baseDoc: CompositeTermEvaluation = {
    id: buildEvaluationDocId(student.id, options.term, options.academicYear),
    schoolId: options.schoolId || student.schoolId || `school_${options.teacherId}`,
    teacherId: options.teacherId || student.teacherId || 'teacher',
    studentId: student.id,
    studentName: student.name,
    grade: student.grade,
    section: student.section,
    rollNumber: student.rollNumber || '',
    academicYear: options.academicYear,
    term: options.term,
    preset: options.preset,
    weights: options.weights,
    fitnessSnapshot,
    discipline,
    games: {
      sportName: options.sportName,
      scaleMax: options.scaleMax,
      skills,
      ...gamesCalc
    },
    totalScore: fitnessSnapshot.autoMarksAwarded,
    cbseGrade: mapScoreToCbseGrade(fitnessSnapshot.autoMarksAwarded),
    coScholasticGrade: mapScoreToCoScholasticGrade(fitnessSnapshot.autoMarksAwarded),
    remarks: '',
    updatedAt: new Date().toISOString()
  };

  return recalculateEvaluationTotals(baseDoc);
}

// =========================================================================
// 3. FIRESTORE + LOCAL STORAGE PERSISTENCE (APPEND-ONLY NEW COLLECTION)
// =========================================================================

const LOCAL_COMPOSITE_KEY = 'smartpe_composite_evaluations';

function readLocalEvaluations(): CompositeTermEvaluation[] {
  try {
    const raw = localStorage.getItem(LOCAL_COMPOSITE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLocalEvaluations(items: CompositeTermEvaluation[]) {
  try {
    localStorage.setItem(LOCAL_COMPOSITE_KEY, JSON.stringify(items));
  } catch (err) {
    console.warn('Local composite evaluations write error:', err);
  }
}

export const compositeEvaluationService = {
  saveEvaluation: async (evaluation: CompositeTermEvaluation): Promise<CompositeTermEvaluation> => {
    const finalized = recalculateEvaluationTotals({
      ...evaluation,
      updatedAt: new Date().toISOString()
    });

    // Save locally immediately so zero progress is lost offline
    const localList = readLocalEvaluations();
    writeLocalEvaluations([finalized, ...localList.filter(e => e.id !== finalized.id)]);

    if (auth.currentUser && (typeof navigator === 'undefined' || navigator.onLine)) {
      try {
        await setDoc(doc(db, 'composite_evaluations', finalized.id), finalized, { merge: true });
      } catch (err) {
        logError(err, 'error', {
          context: 'compositeEvaluationService.saveEvaluation',
          evalId: finalized.id
        });
      }
    }

    return finalized;
  },

  subscribeToEvaluations: (
    teacherId: string,
    schoolId: string | undefined,
    isAdmin: boolean,
    callback: (list: CompositeTermEvaluation[]) => void
  ): (() => void) => {
    // Seed immediately from local cache for crisp UX
    callback(readLocalEvaluations());

    if (!auth.currentUser) {
      return () => {};
    }

    const colRef = collection(db, 'composite_evaluations');
    const isSuper = isBrandSuperAdmin(auth.currentUser?.email);
    let q;

    if (isSuper) {
      q = query(colRef);
    } else if (isAdmin && schoolId) {
      q = query(colRef, where('schoolId', '==', schoolId));
    } else if (schoolId) {
      q = query(colRef, where('schoolId', '==', schoolId));
    } else {
      q = query(colRef, where('teacherId', '==', teacherId));
    }

    return onSnapshot(
      q,
      (snapshot) => {
        const remote = snapshot.docs.map(d => d.data() as CompositeTermEvaluation);
        // Merge remote + local unsynced items by updatedAt timestamp
        const mergedMap = new Map<string, CompositeTermEvaluation>();
        readLocalEvaluations().forEach(item => {
          if (!schoolId || item.schoolId === schoolId || item.teacherId === teacherId) {
            mergedMap.set(item.id, item);
          }
        });
        remote.forEach(item => mergedMap.set(item.id, item));
        const merged = Array.from(mergedMap.values());
        writeLocalEvaluations(merged);
        callback(merged);
      },
      (err) => {
        logError(err, 'error', { context: 'compositeEvaluationService.subscribeToEvaluations' });
        callback(readLocalEvaluations());
      }
    );
  },

  getStudentEvaluations: async (studentId: string): Promise<CompositeTermEvaluation[]> => {
    const localMatches = readLocalEvaluations().filter(e => e.studentId === studentId);
    if (!auth.currentUser || (typeof navigator !== 'undefined' && !navigator.onLine)) {
      return localMatches;
    }
    try {
      const q = query(collection(db, 'composite_evaluations'), where('studentId', '==', studentId));
      const snap = await getDocs(q);
      const remote = snap.docs.map(d => d.data() as CompositeTermEvaluation);
      if (remote.length > 0) return remote;
    } catch (err) {
      logError(err, 'error', { context: 'compositeEvaluationService.getStudentEvaluations', studentId });
    }
    return localMatches;
  },

  deleteEvaluation: async (evalId: string): Promise<void> => {
    const localList = readLocalEvaluations();
    writeLocalEvaluations(localList.filter(e => e.id !== evalId));
    if (auth.currentUser) {
      try {
        await deleteDoc(doc(db, 'composite_evaluations', evalId));
      } catch (err) {
        logError(err, 'error', { context: 'compositeEvaluationService.deleteEvaluation', evalId });
      }
    }
  }
};
