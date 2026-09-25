import { storageService } from './storageService';
import { academicCoachingCloudService } from './academicCoachingCloudService';
import { 
  FOOTBALL_SKILLS, 
  BASKETBALL_SKILLS, 
  CRICKET_SKILLS, 
  CHESS_SKILLS,
  TENNIS_SKILLS,
  BADMINTON_SKILLS,
  ATHLETICS_SKILLS,
  VOLLEYBALL_SKILLS,
  KABADDI_SKILLS,
  TABLE_TENNIS_SKILLS,
  SWIMMING_SKILLS,
  YOGA_FITNESS_SKILLS, 
  SkillPresetType,
  getPresetSkillIdsForSport,
  SKILL_PRESETS_META
} from './coachingSkillsDatabase';

export type CoachingSportId = 
  | 'football' 
  | 'basketball' 
  | 'tennis' 
  | 'cricket'
  | 'chess'
  | 'badminton'
  | 'athletics'
  | 'volleyball'
  | 'kabaddi'
  | 'table-tennis'
  | 'swimming'
  | 'yoga-fitness';

export type AssessmentType = 
  | 'Baseline Assessment'
  | 'Monthly Review' 
  | '3-Month Review' 
  | 'Term 1 Evaluation'
  | 'Term 2 Evaluation'
  | '6-Month Review' 
  | 'Annual / Final Assessment'
  | 'Initial Assessment' 
  | 'Custom Assessment';

export type DevelopmentLevel = 
  | 'Beginning' 
  | 'Developing' 
  | 'Progressing' 
  | 'Proficient' 
  | 'Advanced';

export type CoachingAgeCategory = 
  | 'U-10' 
  | 'U-12' 
  | 'U-13' 
  | 'U-14' 
  | 'U-16' 
  | 'U-17' 
  | 'U-19' 
  | 'Senior';

export interface SkillItem {
  id: string;
  name: string;
  category: 'technical' | 'tactical' | 'physical' | 'gameBehaviour';
  isCore: boolean;
  positionSpecificFor?: string[]; // e.g. ['Goalkeeper', 'Defender']
  description: string;
  coachingCue: string;
  defaultScore: number;
}

export interface PositionRole {
  id: string;
  name: string;
  skills: string[]; // skill IDs specific to this role
  description: string;
}

export interface TrainingDrillItem {
  id: string;
  skillId: string;
  skillName: string;
  drillName: string;
  focus: string;
  description: string;
  recommendedFrequency: string;
  intensity: 'Low' | 'Moderate' | 'High' | 'Match Tempo';
}

export interface SportTemplate {
  id: CoachingSportId;
  name: string;
  tagline: string;
  icon: string;
  color: string;
  positions: PositionRole[];
  skills: SkillItem[];
  drills: TrainingDrillItem[];
}

export interface PlayerProfileData {
  id: string;
  name: string;
  dob: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  sport: CoachingSportId;
  position: string;
  gradeOrClass?: string; // e.g., 'Class 8', 'Grade 7'
  ageCategory?: CoachingAgeCategory; // 'U-10', 'U-12', 'U-13', 'U-14', 'U-16', 'U-17', 'U-19', 'Senior'
  batchOrTeam?: string;
  coachName: string;
  coachId?: string;
  joiningDate: string;
  parentName: string;
  parentContact: string;
  photoUrl?: string;
  dominantSide: string; // e.g., 'Right Foot / Right Hand'
  previousExperience: string;
  playerGoals: string;
  medicalNotes?: string;
  feeStatus?: 'Paid' | 'Due' | 'Exempt' | 'Partial';
  monthlyFeeAmount?: number;
  feeDueDate?: string;
  selectedSkillIds?: string[]; // IDs of customized skills tracked for this athlete
  skillPlanPreset?: SkillPresetType; // 'core' | 'development' | 'master40' | 'positional' | 'custom'
  createdAt: string;
  active: boolean;
}

export interface TrainingGoal {
  id: string;
  playerId: string;
  goal: string;
  skill: string;
  target: string;
  startDate: string;
  reviewDate: string;
  status: 'Not Started' | 'In Progress' | 'Achieved';
}

export interface PlayerAssessmentRecord {
  id: string;
  playerId: string;
  playerName: string;
  sport: CoachingSportId;
  position: string;
  ageCategory?: CoachingAgeCategory;
  gradeOrClass?: string;
  ageAtAssessment?: number;
  assessmentType: AssessmentType;
  assessmentDate: string;
  coachName: string;
  
  // 1-5 Ratings per skill ID
  skillRatings: Record<string, number>;
  
  // Optional observations & development targets per skill
  skillObservations: Record<string, string>;
  skillTargets: Record<string, string>;
  
  // Positional skills and assessed skill IDs included in this assessment
  includedPositionSkills: string[];
  assessedSkillIds?: string[];

  // Domain scores normalized (0-100)
  domainScores: {
    technical: number;
    tactical: number;
    physical: number;
    gameBehaviour: number;
  };

  // Overall score normalized (0-100)
  overallScore: number;
  developmentLevel: DevelopmentLevel;

  // Age-category performance measurement & benchmark norm
  ageBenchmarkNorm?: {
    ageCategory: CoachingAgeCategory;
    categoryTitle: string;
    developmentStage: string;
    cohortStanding: string;
    percentileEst: number;
    standardAuthority: string;
    stageMilestoneNotes: string;
    nextCategoryTarget: string;
  };

  // Auto-identified strengths & development priorities
  strengths: string[];
  developmentPriorities: string[];

  // Qualitative notes
  coachObservation: string;
  coachRecommendation: string;
  aiSuggestions?: {
    summary: string;
    strengthsNotes: string;
    prioritiesNotes: string;
    trainingFocus: string;
    suggestedGoals: string[];
  };
  
  // Next goals & review
  nextGoals: TrainingGoal[];
  nextAssessmentDate: string;
  createdAt: string;
}

export interface BatchTeamGroup {
  id: string;
  name: string;
  sport: CoachingSportId;
  ageGroup: string; // e.g. "U-10", "U-14", "Senior Squad"
  coachName: string;
  playerIds: string[];
  trainingSchedule?: string;
  location?: string;
  createdAt: string;
}

// Normalized rating helper: 1-5 scale to 100 points
export function calculateDevelopmentScore(ratings: number[]): number {
  if (ratings.length === 0) return 0;
  const sum = ratings.reduce((a, b) => a + b, 0);
  const avg = sum / ratings.length;
  return Math.round((avg / 5) * 100);
}

// Development level classification
export function getDevelopmentLevel(score: number): DevelopmentLevel {
  if (score >= 90) return 'Advanced';
  if (score >= 75) return 'Proficient';
  if (score >= 60) return 'Progressing';
  if (score >= 40) return 'Developing';
  return 'Beginning';
}

export function getDevelopmentLevelColor(level: DevelopmentLevel): { bg: string; text: string; border: string } {
  switch (level) {
    case 'Advanced':
      return { bg: 'bg-emerald-500/10', text: 'text-emerald-700', border: 'border-emerald-500/30' };
    case 'Proficient':
      return { bg: 'bg-blue-500/10', text: 'text-blue-700', border: 'border-blue-500/30' };
    case 'Progressing':
      return { bg: 'bg-cyan-500/10', text: 'text-cyan-700', border: 'border-cyan-500/30' };
    case 'Developing':
      return { bg: 'bg-amber-500/10', text: 'text-amber-700', border: 'border-amber-500/30' };
    case 'Beginning':
    default:
      return { bg: 'bg-slate-500/10', text: 'text-slate-700', border: 'border-slate-500/30' };
  }
}

// Coaching scale rating labels (1 to 5)
export const COACHING_SCALE_LABELS: Record<number, { title: string; description: string; color: string }> = {
  1: { title: 'Beginning', description: 'Exploring mechanics, requires continuous guidance and setup', color: '#94A3B8' },
  2: { title: 'Developing', description: 'Executes core basics with emerging consistency at lower tempo', color: '#F59E0B' },
  3: { title: 'Emerging Competence', description: 'Reliable under moderate tempo, building game application', color: '#06B6D4' },
  4: { title: 'Proficient', description: 'Confident, fluent execution under pressure and dynamic game play', color: '#3B82F6' },
  5: { title: 'Advanced', description: 'Masterful, autonomous, adapts instinctively at match intensity', color: '#10B981' }
};

export interface MeritClassification {
  category: 'Elite Distinction' | 'High Merit' | 'Merit Award' | 'Progressing Competence' | 'Developing Foundations';
  grade: 'A+' | 'A' | 'B+' | 'B' | 'C';
  label: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  ribbonColor: string;
  sealColor: string;
  description: string;
}

export function getMeritClassification(score: number): MeritClassification {
  if (score >= 90) {
    return {
      category: 'Elite Distinction',
      grade: 'A+',
      label: 'Distinction with Honours',
      badgeBg: 'bg-amber-500',
      badgeText: 'text-slate-950 font-black',
      badgeBorder: 'border-amber-400',
      ribbonColor: '#F59E0B',
      sealColor: '#B45309',
      description: 'Exceptional mastery across technical execution, tactical awareness, and physical benchmarks.'
    };
  } else if (score >= 80) {
    return {
      category: 'High Merit',
      grade: 'A',
      label: 'First Class Merit',
      badgeBg: 'bg-emerald-500',
      badgeText: 'text-white font-black',
      badgeBorder: 'border-emerald-600',
      ribbonColor: '#10B981',
      sealColor: '#047857',
      description: 'Superior technical proficiency with strong tactical game intelligence and consistent execution.'
    };
  } else if (score >= 70) {
    return {
      category: 'Merit Award',
      grade: 'B+',
      label: 'Commended Merit',
      badgeBg: 'bg-blue-600',
      badgeText: 'text-white font-black',
      badgeBorder: 'border-blue-700',
      ribbonColor: '#2563EB',
      sealColor: '#1D4ED8',
      description: 'Solid competitive baseline with consistent fundamental application under match conditions.'
    };
  } else if (score >= 60) {
    return {
      category: 'Progressing Competence',
      grade: 'B',
      label: 'Progressing Competence',
      badgeBg: 'bg-cyan-600',
      badgeText: 'text-white font-black',
      badgeBorder: 'border-cyan-700',
      ribbonColor: '#0891B2',
      sealColor: '#0E7490',
      description: 'Demonstrating reliable understanding of core patterns with ongoing developmental refinement.'
    };
  } else {
    return {
      category: 'Developing Foundations',
      grade: 'C',
      label: 'Developing Foundations',
      badgeBg: 'bg-slate-700',
      badgeText: 'text-white font-black',
      badgeBorder: 'border-slate-800',
      ribbonColor: '#475569',
      sealColor: '#334155',
      description: 'Focusing on building foundational motor habits and basic athletic skill mechanics.'
    };
  }
}

// --- Age Category & Performance Measurement Benchmark Helpers ---
export function calculateAgeFromDob(dobString: string, referenceDate: Date = new Date()): number {
  if (!dobString || typeof dobString !== 'string') return 13;
  const clean = dobString.trim();
  let date: Date | null = null;
  
  // Format DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = clean.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (dmyMatch) {
    const day = parseInt(dmyMatch[1], 10);
    const month = parseInt(dmyMatch[2], 10) - 1;
    const year = parseInt(dmyMatch[3], 10);
    date = new Date(year, month, day);
  } else {
    // Standard ISO format YYYY-MM-DD or YYYY/MM/DD
    const ymdMatch = clean.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
    if (ymdMatch) {
      const year = parseInt(ymdMatch[1], 10);
      const month = parseInt(ymdMatch[2], 10) - 1;
      const day = parseInt(ymdMatch[3], 10);
      date = new Date(year, month, day);
    } else {
      const parsed = new Date(clean);
      if (!isNaN(parsed.getTime())) {
        date = parsed;
      }
    }
  }

  if (!date || isNaN(date.getTime())) {
    return 13;
  }

  let age = referenceDate.getFullYear() - date.getFullYear();
  const m = referenceDate.getMonth() - date.getMonth();
  if (m < 0 || (m === 0 && referenceDate.getDate() < date.getDate())) {
    age--;
  }
  return Math.max(5, Math.min(65, age));
}

export function detectAgeCategory(age?: number, dob?: string, gradeOrClass?: string): CoachingAgeCategory {
  let computedAge = typeof age === 'number' && !isNaN(age) ? age : 0;
  
  if (dob) {
    computedAge = calculateAgeFromDob(dob);
  } else if ((!computedAge || computedAge <= 0) && gradeOrClass) {
    const classNum = parseInt(gradeOrClass.replace(/[^0-9]/g, ''), 10);
    if (classNum >= 1 && classNum <= 12) {
      computedAge = classNum + 5; // e.g. Class 1 = 6, Class 7 = 12, Class 8 = 13, Class 9 = 14, Class 10 = 15
    }
  }

  if (computedAge <= 0) computedAge = 13;

  // Youth sports coaching standards:
  // Under-10: <= 10
  // Under-12: 11 - 12
  // Under-13: 13
  // Under-14: 14
  // Under-16: 15 - 16
  // Under-17: 17
  // Under-19: 18 - 19
  // Senior: 20+
  if (computedAge <= 10) return 'U-10';
  if (computedAge <= 12) return 'U-12';
  if (computedAge === 13) return 'U-13';
  if (computedAge === 14) return 'U-14';
  if (computedAge <= 16) return 'U-16';
  if (computedAge === 17) return 'U-17';
  if (computedAge <= 19) return 'U-19';
  return 'Senior';
}

export function getAgeCategoryColor(category: CoachingAgeCategory): { bg: string; text: string; border: string; badge: string; pill: string } {
  switch (category) {
    case 'U-10':
      return { bg: 'bg-rose-500/10', text: 'text-rose-700', border: 'border-rose-300', badge: 'bg-rose-600 text-white', pill: 'bg-rose-100 text-rose-800' };
    case 'U-12':
      return { bg: 'bg-orange-500/10', text: 'text-orange-700', border: 'border-orange-300', badge: 'bg-orange-600 text-white', pill: 'bg-orange-100 text-orange-800' };
    case 'U-13':
      return { bg: 'bg-emerald-500/10', text: 'text-emerald-700', border: 'border-emerald-300', badge: 'bg-emerald-600 text-white', pill: 'bg-emerald-100 text-emerald-800' };
    case 'U-14':
      return { bg: 'bg-amber-500/10', text: 'text-amber-800', border: 'border-amber-300', badge: 'bg-amber-500 text-slate-950 font-black', pill: 'bg-amber-100 text-amber-900 font-bold' };
    case 'U-16':
      return { bg: 'bg-blue-500/10', text: 'text-blue-700', border: 'border-blue-300', badge: 'bg-blue-600 text-white', pill: 'bg-blue-100 text-blue-800' };
    case 'U-17':
      return { bg: 'bg-indigo-500/10', text: 'text-indigo-700', border: 'border-indigo-300', badge: 'bg-indigo-600 text-white', pill: 'bg-indigo-100 text-indigo-800' };
    case 'U-19':
      return { bg: 'bg-purple-500/10', text: 'text-purple-700', border: 'border-purple-300', badge: 'bg-purple-600 text-white', pill: 'bg-purple-100 text-purple-800' };
    case 'Senior':
    default:
      return { bg: 'bg-slate-500/10', text: 'text-slate-800', border: 'border-slate-300', badge: 'bg-slate-800 text-white', pill: 'bg-slate-100 text-slate-800' };
  }
}

export interface AgeCategoryBenchmark {
  category: CoachingAgeCategory;
  name: string;
  ageRange: string;
  typicalClasses: string;
  developmentStage: string;
  standardAuthority: string;
  focusAreas: string[];
  evaluationPillars: {
    technicalWeight: number;
    tacticalWeight: number;
    physicalWeight: number;
    behaviourWeight: number;
  };
  benchmarkDescription: string;
  transitionMilestone: string;
}

export const AGE_CATEGORY_BENCHMARKS: Record<CoachingAgeCategory, AgeCategoryBenchmark> = {
  'U-10': {
    category: 'U-10',
    name: 'Under-10 Foundation Stage',
    ageRange: '8 to 10 Years',
    typicalClasses: 'Classes 3 to 5',
    developmentStage: 'Agility, Balance, Coordination (ABC) & Movement Literacy',
    standardAuthority: 'Grassroots Long-Term Athlete Development (LTAD)',
    focusAreas: ['Foundational movement mechanics', 'Ball & equipment touch joy', 'Multi-directional agility', 'Sportsmanship & joy of play'],
    evaluationPillars: { technicalWeight: 45, tacticalWeight: 15, physicalWeight: 20, behaviourWeight: 20 },
    benchmarkDescription: 'Measured on joy of participation, movement literacy, basic technique, and following instructions.',
    transitionMilestone: 'Develop bilateral motor coordination and comfort with sport-specific ball contact before stepping up to U-12 squad.'
  },
  'U-12': {
    category: 'U-12',
    name: 'Under-12 Skill Acquisition Stage',
    ageRange: '11 to 12 Years',
    typicalClasses: 'Classes 6 to 7',
    developmentStage: 'Core Technique Mastery & Introductory Small-Sided Play',
    standardAuthority: 'Sub-Junior Academy & District Development Framework',
    focusAreas: ['Technical mechanics under light pressure', '2v1 / 3v2 decision making', 'Aerobic base building', 'Team communication'],
    evaluationPillars: { technicalWeight: 40, tacticalWeight: 25, physicalWeight: 20, behaviourWeight: 15 },
    benchmarkDescription: 'Evaluated against fundamental motor patterns, foundational sport technique, and introductory game rules.',
    transitionMilestone: 'Consolidate 2-touch efficiency and positional orientation for competitive transition into U-13 division.'
  },
  'U-13': {
    category: 'U-13',
    name: 'Under-13 Transition Stage',
    ageRange: '13 Years',
    typicalClasses: 'Classes 7 to 8',
    developmentStage: 'Transitional Speed & Peripheral Vision',
    standardAuthority: 'Inter-School & District Youth Competitive League Standards',
    focusAreas: ['First touch redirection', 'Spacing & peripheral scanning', 'Speed of reaction', 'Composure and coachability'],
    evaluationPillars: { technicalWeight: 35, tacticalWeight: 30, physicalWeight: 20, behaviourWeight: 15 },
    benchmarkDescription: 'Tested on rapid decision making in small spaces, transitional speed, and tactical game sense.',
    transitionMilestone: 'Master game tempo modulation and physical resilience under pressing before competing in full U-14 brackets.'
  },
  'U-14': {
    category: 'U-14',
    name: 'Under-14 Youth Development Stage',
    ageRange: '14 Years',
    typicalClasses: 'Classes 8 to 9',
    developmentStage: 'Competitive Game Intelligence & Speed-Endurance',
    standardAuthority: 'Sports Authority of India (SAI) & Khelo India U-14 Youth Academy Standards',
    focusAreas: ['Match-pace technical execution', 'Tactical systems & off-ball running', 'Anaerobic threshold & core power', 'Mental resilience in matches'],
    evaluationPillars: { technicalWeight: 35, tacticalWeight: 30, physicalWeight: 20, behaviourWeight: 15 },
    benchmarkDescription: 'Standardized against official SAI / Khelo India U-14 Youth Academy competitive benchmarks.',
    transitionMilestone: 'Excel in positional tactical specialization and high-intensity match stamina to qualify for U-16 junior squads.'
  },
  'U-16': {
    category: 'U-16',
    name: 'Under-16 Junior Performance Stage',
    ageRange: '15 to 16 Years',
    typicalClasses: 'Classes 9 to 11',
    developmentStage: 'Tactical Rigor & High-Intensity Execution',
    standardAuthority: 'State Junior Championship & School Games Federation of India (SGFI) Standards',
    focusAreas: ['Advanced positional specialization', 'High-tempo tactical transitions', 'Power, speed endurance, agility', 'Leadership & competitive grit'],
    evaluationPillars: { technicalWeight: 30, tacticalWeight: 35, physicalWeight: 25, behaviourWeight: 10 },
    benchmarkDescription: 'Measured against State and National Junior Championship level technical & physical standards.',
    transitionMilestone: 'Perform with tactical discipline and peak match velocity under full-court / full-field pressing.'
  },
  'U-17': {
    category: 'U-17',
    name: 'Under-17 Advanced Junior Stage',
    ageRange: '16 to 17 Years',
    typicalClasses: 'Classes 10 to 12',
    developmentStage: 'Pre-Elite Refinement & Strategic Composure',
    standardAuthority: 'National School Games (SGFI) & Youth Federation Rosters',
    focusAreas: ['Elite execution under high pressing', 'Game plan adaptability', 'Peak strength and acceleration', 'Match temperament'],
    evaluationPillars: { technicalWeight: 30, tacticalWeight: 35, physicalWeight: 25, behaviourWeight: 10 },
    benchmarkDescription: 'Evaluated against National School Games (SGFI) and Junior Federation standards.',
    transitionMilestone: 'Exhibit tactical leadership and varsity-level athletic composure.'
  },
  'U-19': {
    category: 'U-19',
    name: 'Under-19 Senior Youth Stage',
    ageRange: '18 to 19 Years',
    typicalClasses: 'Class 12 / College 1st Year',
    developmentStage: 'Elite Performance & Competitive Mastery',
    standardAuthority: 'National Youth League & Inter-University Division 1 Standards',
    focusAreas: ['Professional-grade precision', 'Complex tactical systems', 'Peak physical conditioning', 'Clutch match performance'],
    evaluationPillars: { technicalWeight: 25, tacticalWeight: 40, physicalWeight: 25, behaviourWeight: 10 },
    benchmarkDescription: 'Measured against University, National Youth League, and Senior state tryout benchmarks.',
    transitionMilestone: 'Seamless transition into Senior club competitions and professional scouting trials.'
  },
  'Senior': {
    category: 'Senior',
    name: 'Senior / Open Elite Stage',
    ageRange: '20+ Years',
    typicalClasses: 'Collegiate / Club / Senior',
    developmentStage: 'Peak Athletic Competence',
    standardAuthority: 'Senior Club & National Federation Standards',
    focusAreas: ['Maximal tactical autonomy', 'Specialist execution', 'Physical peak endurance', 'Match leadership'],
    evaluationPillars: { technicalWeight: 25, tacticalWeight: 40, physicalWeight: 25, behaviourWeight: 10 },
    benchmarkDescription: 'Benchmarked against Senior Club and Professional League performance baselines.',
    transitionMilestone: 'Maintain elite athletic conditioning and high-leverage tactical consistency.'
  }
};

export function calculateAgePerformanceBenchmark(
  category: CoachingAgeCategory,
  score: number,
  domainScores?: { technical: number; tactical: number; physical: number; gameBehaviour: number }
): PlayerAssessmentRecord['ageBenchmarkNorm'] {
  const meta = AGE_CATEGORY_BENCHMARKS[category] || AGE_CATEGORY_BENCHMARKS['U-14'];
  
  // Estimate cohort percentile based on overall score (normalized against age expectation)
  let percentile = 50;
  let standing = 'Developing in Cohort';

  if (score >= 90) {
    percentile = 96;
    standing = `Top 5% in ${category} Division`;
  } else if (score >= 80) {
    percentile = 86;
    standing = `Top 15% in ${category} Division`;
  } else if (score >= 70) {
    percentile = 72;
    standing = `Top 30% in ${category} Division`;
  } else if (score >= 60) {
    percentile = 55;
    standing = `Above Average in ${category} Division`;
  } else if (score >= 40) {
    percentile = 38;
    standing = `Developing Baseline in ${category} Division`;
  } else {
    percentile = 20;
    standing = `Foundational Stage in ${category} Division`;
  }

  // Age-adjusted score: weights aligned with age developmental stage
  let ageAdjusted = score;
  if (domainScores) {
    const p = meta.evaluationPillars;
    const weighted = (
      (domainScores.technical * p.technicalWeight) +
      (domainScores.tactical * p.tacticalWeight) +
      (domainScores.physical * p.physicalWeight) +
      (domainScores.gameBehaviour * p.behaviourWeight)
    ) / 100;
    ageAdjusted = Math.round(weighted);
  }

  return {
    ageCategory: category,
    categoryTitle: meta.name,
    developmentStage: meta.developmentStage,
    cohortStanding: standing,
    percentileEst: percentile,
    standardAuthority: meta.standardAuthority,
    stageMilestoneNotes: meta.benchmarkDescription,
    nextCategoryTarget: meta.transitionMilestone
  };
}

export function createPlayerFromAssessment(record: PlayerAssessmentRecord | any): PlayerProfileData {
  const age = record.age || record.ageAtAssessment || 13;
  const dob = record.dob || `20${14 - age}-05-15`;
  const gradeOrClass = record.gradeOrClass || (age <= 10 ? 'Class 4' : age <= 12 ? 'Class 6' : age === 13 ? 'Class 7' : age === 14 ? 'Class 8' : age <= 16 ? 'Class 10' : 'Class 12');
  const ageCategory = record.ageCategory || detectAgeCategory(age, dob, gradeOrClass);

  return {
    id: record.playerId || record.athleteId || `player-${record.id}`,
    name: record.playerName || record.athleteName || 'Athlete',
    dob: dob,
    age: age,
    gender: record.gender || 'Male',
    sport: record.sport || 'football',
    position: record.position || 'Player',
    gradeOrClass: gradeOrClass,
    ageCategory: ageCategory,
    batchOrTeam: record.batchOrTeam || `Academy ${ageCategory} Squad`,
    coachName: record.coachName || record.evaluatorCoach || 'Coach',
    joiningDate: record.assessmentDate || new Date().toISOString().split('T')[0],
    parentName: record.parentName || 'Parent / Guardian',
    parentContact: record.parentContact || '',
    dominantSide: 'Right',
    previousExperience: '',
    playerGoals: '',
    createdAt: new Date().toISOString(),
    active: true
  };
}

// Comprehensive Sport Templates
export const SPORT_TEMPLATES: Record<CoachingSportId, SportTemplate> = {
  football: {
    id: 'football',
    name: 'Football (Soccer)',
    tagline: 'Grassroots, School & Academy Player Development Framework',
    icon: 'Activity',
    color: '#10B981',
    positions: [
      {
        id: 'Goalkeeper',
        name: 'Goalkeeper',
        description: 'Handling, distribution, shot stopping, and 1v1 defense in the box.',
        skills: ['fb_ball_control', 'fb_first_touch_directional', 'fb_tackling_block', 'fb_scanning_preorientation', 'fb_positioning_spacing']
      },
      {
        id: 'Defender',
        name: 'Defender (CB / Fullback)',
        description: 'Tackling, interceptions, aerial duels, and build-up from back.',
        skills: ['fb_tackling_block', 'fb_interception_anticipation', 'fb_heading_technique', 'fb_buildup_angles', 'fb_positioning_spacing']
      },
      {
        id: 'Midfielder',
        name: 'Midfielder (CM / CAM / CDM)',
        description: 'Scanning, passing range, transitions, ball retention under pressure.',
        skills: ['fb_scanning_preorientation', 'fb_short_passing', 'fb_long_passing', 'fb_shielding_retention', 'fb_transition_attack_to_defense']
      },
      {
        id: 'Forward',
        name: 'Forward / Winger / Striker',
        description: 'Finishing, off-ball runs, 1v1 attacking, chance creation in final third.',
        skills: ['fb_shooting_accuracy', 'fb_shooting_power', 'fb_1v1_attacking', 'fb_offball_movement', 'fb_turning_cod']
      }
    ],
    skills: FOOTBALL_SKILLS,
    drills: [
      {
        id: 'fb_drill_dribble',
        skillId: 'fb_dribbling_close',
        skillName: 'Dribbling & Ball Control',
        drillName: 'Tight Cones Figure-8 Weave + 1v1 Gate Drive',
        focus: 'Close touches, sole rolls, explosive burst out of tight space.',
        description: 'Set 6 cones in zigzag 1.5m apart. Player executes quick inside/outside touches, exits around gate, and takes on passive defender with speed change.',
        recommendedFrequency: '15 mins, 3x / week',
        intensity: 'High'
      },
      {
        id: 'fb_drill_passing',
        skillId: 'fb_short_passing',
        skillName: 'Short Passing & Receiving',
        drillName: '4v1 / 5v2 High-Tempo Rondo Square',
        focus: 'Two-touch passing, scanning over shoulder, body open to receive.',
        description: '10x10m grid. 4 perimeter players circulate ball against 1 central presser. Max 2 touches per player.',
        recommendedFrequency: '20 mins every session',
        intensity: 'High'
      }
    ]
  },

  basketball: {
    id: 'basketball',
    name: 'Basketball',
    tagline: 'Technical Mechanics, Floor Spacing & Game IQ System',
    icon: 'Target',
    color: '#F59E0B',
    positions: [
      { id: 'Guard', name: 'Guard (Point / Shooting Guard)', description: 'Playmaking, ball handling, perimeter shooting, and on-ball perimeter defense.', skills: ['bb_dribbling_both_hands', 'bb_crossover_moves', 'bb_catch_and_shoot', 'bb_onball_defense_stance', 'bb_pnr_ballhandler'] },
      { id: 'Forward', name: 'Forward (Small / Power Forward)', description: 'Mid-range shooting, slashing, wing rebounding, and defensive versatility.', skills: ['bb_pullup_jumper', 'bb_closeout_technique', 'bb_boxout_mechanics', 'bb_helpside_defense'] },
      { id: 'Center', name: 'Center / Big', description: 'Post scoring, rim protection, box-outs, screen setting, and paint presence.', skills: ['bb_post_moves', 'bb_boxout_mechanics', 'bb_pnr_screener', 'bb_vertical_leap'] }
    ],
    skills: BASKETBALL_SKILLS,
    drills: [
      {
        id: 'bb_drill_mikan',
        skillId: 'bb_layup_right_hand',
        skillName: 'Layup Execution',
        drillName: 'Continuous Mikan Drill + Reverse Finishes',
        focus: 'Left and right hand touch under rim, high release point.',
        description: 'Alternate right and left layups off glass for 60 seconds without letting ball hit the floor.',
        recommendedFrequency: '5 mins daily warmup',
        intensity: 'Moderate'
      }
    ]
  },

  cricket: {
    id: 'cricket',
    name: 'Cricket',
    tagline: 'Technical Batting, Bowling Accuracy & Fielding Precision Framework',
    icon: 'Award',
    color: '#3B82F6',
    positions: [
      { id: 'Batter', name: 'Batter (Top / Middle Order)', description: 'Shot selection, footwork, front/back foot defense, strike rotation.', skills: ['ck_bat_stance_grip', 'ck_bat_front_foot_def', 'ck_bat_back_foot_def', 'ck_strike_rotation', 'ck_gap_finding_placement'] },
      { id: 'Fast Bowler', name: 'Pace Bowler', description: 'Run-up rhythm, release point, seam presentation, swing, yorkers.', skills: ['ck_bowl_runup_rhythm', 'ck_bowl_seam_presentation', 'ck_bowl_line_length', 'ck_bowl_yorker_bouncer'] },
      { id: 'Spin Bowler', name: 'Spin Bowler (Off / Leg / Left Arm)', description: 'Flight, drift, turn, variations, field setting discipline.', skills: ['ck_spin_revs_grip', 'ck_spin_flight_drift', 'ck_bowl_line_length'] },
      { id: 'Wicketkeeper', name: 'Wicketkeeper', description: 'Glovework, standing up to spin, diving takes, stumping reflexes.', skills: ['ck_wicketkeeping_glovework', 'ck_fielding_catching_slips', 'ck_drs_review_awareness'] },
      { id: 'All-Rounder', name: 'All-Rounder', description: 'Impact with both bat and ball, high fielding leadership.', skills: ['ck_bat_cover_straight_drive', 'ck_bowl_line_length', 'ck_fielding_direct_hit', 'ck_game_phase_tempo'] }
    ],
    skills: CRICKET_SKILLS,
    drills: [
      {
        id: 'ck_drill_target_bowl',
        skillId: 'ck_bowl_line_length',
        skillName: 'Line & Length Consistency',
        drillName: 'Spot Bowling Target Pitch Drill',
        focus: 'Hitting 2x2ft target mat on good length 6 out of 6 balls.',
        description: 'Bowler delivers 4 overs targeting a colored marker on 5-6m good length zone with full match run-up.',
        recommendedFrequency: '3x weekly net session',
        intensity: 'High'
      }
    ]
  },

  tennis: {
    id: 'tennis',
    name: 'Tennis',
    tagline: 'Stroke Biomechanics, Footwork Rhythm & Point Construction',
    icon: 'Flame',
    color: '#8B5CF6',
    positions: [
      { id: 'All-Court Player', name: 'All-Court Player', description: 'Balanced baseline power, net transition, touch volleys, and complete court coverage.', skills: ['tn_forehand_topspin', 'tn_backhand_drive', 'tn_serve_flat_slice', 'tn_forehand_volley', 'tn_split_step_timing'] },
      { id: 'Baseline Aggressor', name: 'Baseline Aggressor', description: 'Heavy topspin, deep baseline rallying, angle creation, and aggressive return.', skills: ['tn_forehand_topspin', 'tn_backhand_drive', 'tn_serve_flat_slice'] },
      { id: 'Serve & Volley', name: 'Serve & Volley / Doubles Specialist', description: 'First serve percentage, quick split-step, first volley touch, and overhead smashes.', skills: ['tn_serve_flat_slice', 'tn_forehand_volley', 'tn_backhand_volley', 'tn_overhead_smash'] }
    ],
    skills: TENNIS_SKILLS,
    drills: [
      {
        id: 'tn_drill_crosscourt',
        skillId: 'tn_forehand_topspin',
        skillName: 'Forehand Topspin',
        drillName: 'Crosscourt Deep Target Rally (50-Ball Challenge)',
        focus: 'Consistent topspin depth past the service line.',
        description: 'Two players rally diagonally crosscourt, scoring points only when balls land in the deep target zone.',
        recommendedFrequency: '20 mins, 3x / week',
        intensity: 'Moderate'
      }
    ]
  },

  chess: {
    id: 'chess',
    name: 'Chess',
    tagline: 'Tactical Calculation, Strategic Planning & Cognitive Endurance',
    icon: 'ShieldCheck',
    color: '#0D2B52',
    positions: [
      { id: 'Classical / Rapid Player', name: 'Competitive Tournament Player', description: 'Full board vision, opening preparation, deep calculation, and endgame conversion.', skills: ['ch_opening_principles', 'ch_forks_pins', 'ch_calculation_depth', 'ch_king_pawn_endgame', 'ch_time_management_clock'] },
      { id: 'Junior Grassroots', name: 'Grassroots & Scholastic Player', description: 'Piece values, basic checkmates, avoiding blunders, and disciplined move validation.', skills: ['ch_forks_pins', 'ch_blunder_check_filter', 'ch_basic_mating_patterns', 'ch_sportsmanship_handshake'] }
    ],
    skills: CHESS_SKILLS,
    drills: [
      {
        id: 'ch_drill_puzzle',
        skillId: 'ch_forks_pins',
        skillName: 'Tactical Pattern Recognition',
        drillName: 'Puzzle Rush & Thematic Tactical Blitz',
        focus: 'Solving 20 thematic puzzles (forks/pins) under 5 minutes.',
        description: 'Player solves categorized tactical puzzles daily to build fast pattern recognition.',
        recommendedFrequency: '15 mins daily',
        intensity: 'Moderate'
      }
    ]
  },

  badminton: {
    id: 'badminton',
    name: 'Badminton',
    tagline: 'High-Speed Footwork, Racket Deception & Smash Precision',
    icon: 'Zap',
    color: '#EC4899',
    positions: [
      { id: 'Singles Specialist', name: 'Singles Specialist', description: 'Endurance rallies, corner-to-corner recovery, deep clears, and drop shots.', skills: ['bm_six_corner_footwork', 'bm_forehand_smash', 'bm_drop_shot_fast', 'bm_high_clear', 'bm_smash_defense_block'] },
      { id: 'Doubles Specialist', name: 'Doubles Specialist', description: 'Front-court interceptions, drive exchanges, flat game, and rapid rotation.', skills: ['bm_net_kill_tap', 'bm_flat_drive_exchange', 'bm_short_low_serve', 'bm_doubles_rotation'] }
    ],
    skills: BADMINTON_SKILLS,
    drills: [
      {
        id: 'bm_drill_shadow',
        skillId: 'bm_six_corner_footwork',
        skillName: '6-Corner Court Footwork',
        drillName: '6-Corner Shadow Footwork Routine (20 Reps x 3 Sets)',
        focus: 'Fluid movement to all 4 corners and net with split-step at center.',
        description: 'Coach points to random court corners. Player performs explosive split-step, arrives in balance, executes imaginary stroke, and springs back.',
        recommendedFrequency: '15 mins before every session',
        intensity: 'High'
      }
    ]
  },

  athletics: {
    id: 'athletics',
    name: 'Athletics (Track & Field)',
    tagline: 'Sprint Biomechanics, Endurance Pacing & Field Event Power',
    icon: 'Trophy',
    color: '#EF4444',
    positions: [
      { id: 'Sprinter', name: 'Sprinter (100m / 200m / 400m)', description: 'Block starts, drive phase, upright sprint mechanics, and speed endurance.', skills: ['ath_block_start_setup', 'ath_acceleration_drive_phase', 'ath_top_speed_mechanics', 'ath_speed_endurance_finish'] },
      { id: 'Middle / Long Distance', name: 'Middle & Long Distance (800m - 5000m)', description: 'Aerobic threshold, race lap pacing, kick finish, and oxygen economy.', skills: ['ath_middle_distance_stride', 'ath_distance_pacing_laps', 'ath_kick_finish_surge', 'ath_vo2_max_aerobic_engine'] },
      { id: 'Jumps Specialist', name: 'Jumper (Long / High / Triple Jump)', description: 'Runway speed, plant foot angle, takeoff lift, and flight landing.', skills: ['ath_long_jump_approach', 'ath_long_jump_takeoff_flight', 'ath_plyometric_bounding_power'] },
      { id: 'Throws Specialist', name: 'Thrower (Shot Put / Javelin / Discus)', description: 'Rotational kinetic chain, explosive release velocity, and core power.', skills: ['ath_shot_put_glide_rotation', 'ath_javelin_cross_steps', 'ath_ankle_stiffness_elasticity'] }
    ],
    skills: ATHLETICS_SKILLS,
    drills: [
      {
        id: 'ath_drill_a_skips',
        skillId: 'ath_sprint_posture',
        skillName: 'Sprint Posture & Mechanics',
        drillName: 'A-Skips, B-Skips & High Knee Wall Drives',
        focus: 'Knee lift, dorsiflexion, explosive downward claw action.',
        description: 'Perform 3 sets of 30m dynamic A-skips focusing on rhythmic arm action and stiff ground contact.',
        recommendedFrequency: 'Daily track warmup',
        intensity: 'Moderate'
      }
    ]
  },

  volleyball: {
    id: 'volleyball',
    name: 'Volleyball',
    tagline: 'Pass, Set, Spike & Collective Court Chemistry System',
    icon: 'Activity',
    color: '#06B6D4',
    positions: [
      { id: 'Setter', name: 'Setter', description: 'Tempo setting, jump sets, offensive distribution, and second-touch leadership.', skills: ['vb_overhead_set_fingerwork', 'vb_back_set_execution', 'vb_setter_dump_attack'] },
      { id: 'Attacker / Hitter', name: 'Outside / Opposite Hitter', description: 'Approach footwork, vertical leap, attacking line/cross, block timing.', skills: ['vb_spike_approach_footwork', 'vb_spike_arm_swing_snap', 'vb_line_and_cross_spike', 'vb_block_footwork_seal'] },
      { id: 'Middle Blocker', name: 'Middle Blocker', description: 'Lateral seal blocks, quick attacks (A/B balls), reading opponent setter.', skills: ['vb_block_footwork_seal', 'vb_quick_attack_tempo', 'vb_deciding_line_vs_cross_block'] },
      { id: 'Libero', name: 'Libero / Defensive Specialist', description: 'Serve receive platform, pancake dives, chase-down defense, vocal leader.', skills: ['vb_forearm_pass_platform', 'vb_floor_defense_dive', 'vb_freeball_pass_target', 'vb_serve_receive_seam'] }
    ],
    skills: VOLLEYBALL_SKILLS,
    drills: [
      {
        id: 'vb_drill_butterfly',
        skillId: 'vb_forearm_pass_platform',
        skillName: 'Forearm Passing',
        drillName: 'Serve-Receive Target Accuracy Butterfly Drill',
        focus: 'Passing accurately into the setter target ring with 85%+ success.',
        description: 'Server serves to passers who must pass into a target basket placed at position 2/3.',
        recommendedFrequency: '20 mins every session',
        intensity: 'Moderate'
      }
    ]
  },

  kabaddi: {
    id: 'kabaddi',
    name: 'Kabaddi',
    tagline: 'Raiding Agility, Cant Discipline & Chain Defensive Grip Framework',
    icon: 'ShieldCheck',
    color: '#F97316',
    positions: [
      { id: 'Raider', name: 'Raider (Lead / Support Raider)', description: 'Cant maintenance, toe touches, hand touches, dubki evasion, and bonus line jumps.', skills: ['kb_cant_breath_chant', 'kb_toe_touch_sweep', 'kb_dubki_evasion', 'kb_bonus_line_crossing', 'kb_turning_escape_burst'] },
      { id: 'Corner Defender', name: 'Corner Defender (Left / Right Corner)', description: 'Ankle catch, diving tackle, orchestrating chain movement, corner holds.', skills: ['kb_ankle_catch_corner', 'kb_chain_tackle_hold', 'kb_diving_ankle_hold', 'kb_super_tackle_strategy'] },
      { id: 'Cover Defender', name: 'Cover Defender (Left / Right Cover)', description: 'Dash block, thigh hold, waist hold, stopping raider midline reach.', skills: ['kb_dash_block_cover', 'kb_thigh_hold_grip', 'kb_waist_hold_back', 'kb_chain_coordination_movement'] }
    ],
    skills: KABADDI_SKILLS,
    drills: [
      {
        id: 'kb_drill_toe_touch',
        skillId: 'kb_toe_touch_sweep',
        skillName: 'Toe Touch Skill',
        drillName: '3-Cone Rapid Toe Touch & Midline Sprint',
        focus: 'Stepping into 3 simulated defender cones, touching low, and springing back across midline.',
        description: 'Raider enters mat, feints left, executes right toe touch on cone, and sprints past baulk line in under 6 seconds.',
        recommendedFrequency: '15 mins, 3x / week',
        intensity: 'High'
      }
    ]
  },

  'table-tennis': {
    id: 'table-tennis',
    name: 'Table Tennis',
    tagline: 'Spin Recognition, Rapid Stroke Transitions & Reflex Dominance',
    icon: 'Target',
    color: '#14B8A6',
    positions: [
      { id: 'Attacking Looper', name: 'Attacking Looper (Forehand / Backhand)', description: 'Topspin loops, fast third-ball attacks, counter-looping, and active footwork.', skills: ['tt_forehand_topspin_loop', 'tt_backhand_topspin_loop', 'tt_pendulum_serve_spin', 'tt_third_ball_attack_plan'] },
      { id: 'All-Round / Defender', name: 'All-Round / Modern Chopper', description: 'Heavy backspin chops, tactical blocks, push variations, and counter-attacks.', skills: ['tt_chop_defense_backspin', 'tt_active_block_placement', 'tt_reading_serve_spin_grip'] }
    ],
    skills: TABLE_TENNIS_SKILLS,
    drills: [
      {
        id: 'tt_drill_falkenberg',
        skillId: 'tt_falkenberg_footwork',
        skillName: 'Footwork & Pivot Step',
        drillName: 'Falkenberg 3-Ball Footwork Drill',
        focus: 'Backhand, Pivot Forehand, Wide Forehand transition sequence.',
        description: 'Player hits backhand from backhand corner, pivots to hit forehand from backhand corner, then shifts across to hit forehand from wide corner.',
        recommendedFrequency: '20 mins every practice',
        intensity: 'High'
      }
    ]
  },

  swimming: {
    id: 'swimming',
    name: 'Swimming',
    tagline: 'Hydrodynamic Efficiency, Stroke Mechanics & Lap Endurance System',
    icon: 'Award',
    color: '#0284C7',
    positions: [
      { id: 'Freestyle / Sprint', name: 'Freestyle & Sprint Specialist', description: 'Streamlined body roll, high elbow catch, 6-beat kick rhythm, and flip turns.', skills: ['sw_freestyle_evf_catch', 'sw_freestyle_flutter_kick', 'sw_freestyle_flip_turn', 'sw_streamline_off_wall'] },
      { id: 'Individual Medley', name: 'All-Stroke / IM Specialist', description: 'Proficiency across Butterfly, Backstroke, Breaststroke, and Freestyle.', skills: ['sw_breaststroke_whip_kick', 'sw_backstroke_arm_rotation', 'sw_butterfly_dolphin_undulation', 'sw_medley_transition_turns'] },
      { id: 'Distance Swimmer', name: 'Distance Specialist (400m - 1500m)', description: 'Aerobic pacing, 2-beat kick efficiency, stroke count optimization, and endurance.', skills: ['sw_pacing_even_splits', 'sw_stroke_count_efficiency', 'sw_aerobic_vo2_lap_stamina'] }
    ],
    skills: SWIMMING_SKILLS,
    drills: [
      {
        id: 'sw_drill_catchup',
        skillId: 'sw_freestyle_evf_catch',
        skillName: 'Freestyle Stroke Mechanics',
        drillName: 'Catch-Up Drill with Kickboard / Finger-Tip Drag',
        focus: 'Full stroke extension and high elbow recovery over water.',
        description: 'Swim 4x50m freestyle where one hand waits extended in front until the recovering hand touches it before initiating next pull.',
        recommendedFrequency: '15 mins per session',
        intensity: 'Moderate'
      }
    ]
  },

  'yoga-fitness': {
    id: 'yoga-fitness',
    name: 'Yoga & Physical Fitness',
    tagline: 'Asana Alignment, Pranayama Control & Holistic Athletic Mobility',
    icon: 'Sparkles',
    color: '#84CC16',
    positions: [
      { id: 'General Fitness Athlete', name: 'Functional Fitness & Athletic Conditioning', description: 'Core strength, cardiovascular fitness, functional mobility, and injury prevention.', skills: ['yg_plank_core_hold', 'yg_functional_squat_mechanics', 'yg_hamstring_flexibility_range', 'yg_athletic_mobility_routine'] },
      { id: 'Yoga Practitioner', name: 'Hatha / Ashtanga Yoga Practitioner', description: 'Asana stability, Surya Namaskar flow, balance postures, and pranayama.', skills: ['yg_surya_namaskar_12flow', 'yg_vrikshasana_tree_balance', 'yg_anulom_vilom_pranayama', 'yg_mental_stillness_meditation'] }
    ],
    skills: YOGA_FITNESS_SKILLS,
    drills: [
      {
        id: 'yg_drill_flow',
        skillId: 'yg_surya_namaskar_12flow',
        skillName: 'Surya Namaskar Flow',
        drillName: '6 Rounds Surya Namaskar Breath-Synchronized Flow',
        focus: 'Smooth transition between postures with full breath awareness.',
        description: 'Perform 6 rounds of Surya Namaskar at moderate tempo holding each pose for 3 deep breaths.',
        recommendedFrequency: 'Daily 15 mins morning session',
        intensity: 'Moderate'
      }
    ]
  }
};

const PLAYERS_KEY = 'smartpe_academy_athletes_v2';
const ASSESSMENTS_KEY = 'smartpe_academy_evaluations_v2';
const BATCHES_KEY = 'smartpe_academy_squads_v2';

const SEED_PLAYERS: PlayerProfileData[] = [
  {
    id: 'player-fb-01',
    name: 'Aarav Sharma',
    dob: '2012-05-14',
    age: 12,
    gender: 'Male',
    sport: 'football',
    position: 'Midfielder',
    batchOrTeam: 'U-12 Squad',
    coachName: 'Coach Vikram Roy',
    coachId: 'coach-001',
    joiningDate: '2023-06-10',
    parentName: 'Sunil Sharma',
    parentContact: '+91 98765 43210',
    dominantSide: 'Right Foot / Right Hand',
    previousExperience: '2 years school training',
    playerGoals: 'Improve weak-foot passing and transition speed to make state squad',
    medicalNotes: 'No current injuries. Past mild ankle sprain fully recovered.',
    createdAt: '2023-06-10T10:00:00.000Z',
    active: true
  },
  {
    id: 'player-fb-02',
    name: 'Diya Patel',
    dob: '2011-09-22',
    age: 13,
    gender: 'Female',
    sport: 'football',
    position: 'Forward',
    batchOrTeam: 'U-14 Junior Squad',
    coachName: 'Coach Vikram Roy',
    coachId: 'coach-001',
    joiningDate: '2023-08-15',
    parentName: 'Kavita Patel',
    parentContact: '+91 98123 45678',
    dominantSide: 'Left Foot / Left Hand',
    previousExperience: 'Districts championship U-12 finalist',
    playerGoals: 'Enhance shooting accuracy under high pressure and 1v1 attacking',
    medicalNotes: 'None',
    createdAt: '2023-08-15T10:00:00.000Z',
    active: true
  },
  {
    id: 'player-bb-01',
    name: 'Rohan Deshmukh',
    dob: '2010-03-18',
    age: 14,
    gender: 'Male',
    sport: 'basketball',
    position: 'Guard',
    batchOrTeam: 'U-14 Titans',
    coachName: 'Coach Ananya Sen',
    coachId: 'coach-002',
    joiningDate: '2024-01-05',
    parentName: 'Prakash Deshmukh',
    parentContact: '+91 97654 32109',
    dominantSide: 'Right Hand',
    previousExperience: '1 year club training',
    playerGoals: 'Develop confident pull-up jumpers and perimeter defense',
    medicalNotes: 'None',
    createdAt: '2024-01-05T10:00:00.000Z',
    active: true
  },
  {
    id: 'player-ck-01',
    name: 'Karan Mehra',
    dob: '2011-11-04',
    age: 13,
    gender: 'Male',
    sport: 'cricket',
    position: 'Batter',
    batchOrTeam: 'U-14 Cricket Excellence',
    coachName: 'Coach Rajesh Kumar',
    coachId: 'coach-003',
    joiningDate: '2023-11-20',
    parentName: 'Anita Mehra',
    parentContact: '+91 99887 76655',
    dominantSide: 'Right Hand Batter / Right Arm Off-Spin',
    previousExperience: 'School U-12 captain',
    playerGoals: 'Master front foot driving and running between wickets',
    medicalNotes: 'None',
    createdAt: '2023-11-20T10:00:00.000Z',
    active: true
  },
  {
    id: 'player-ch-01',
    name: 'Ananya Iyer',
    dob: '2013-04-12',
    age: 11,
    gender: 'Female',
    sport: 'chess',
    position: 'Competitive Tournament Player',
    batchOrTeam: 'Scholastic Chess Club',
    coachName: 'Coach Viswanathan P.',
    coachId: 'coach-004',
    joiningDate: '2024-02-01',
    parentName: 'Ramesh Iyer',
    parentContact: '+91 98450 12345',
    dominantSide: 'Right Hand',
    previousExperience: 'State U-11 Ranked Player',
    playerGoals: 'Improve rook endgame technique and speed of tactical puzzle solving',
    medicalNotes: 'None',
    createdAt: '2024-02-01T10:00:00.000Z',
    active: true
  },
  {
    id: 'player-bm-01',
    name: 'Sameer Verma',
    dob: '2012-08-19',
    age: 12,
    gender: 'Male',
    sport: 'badminton',
    position: 'Singles Specialist',
    batchOrTeam: 'U-12 Badminton Squad',
    coachName: 'Coach Saina Joseph',
    coachId: 'coach-005',
    joiningDate: '2023-10-15',
    parentName: 'Deepak Verma',
    parentContact: '+91 97110 54321',
    dominantSide: 'Right Hand',
    previousExperience: 'Inter-School singles runner-up',
    playerGoals: 'Sharpen crosscourt drop shots and improve 6-corner court recovery',
    medicalNotes: 'None',
    createdAt: '2023-10-15T10:00:00.000Z',
    active: true
  }
];

const SEED_ASSESSMENTS: PlayerAssessmentRecord[] = [
  {
    id: 'assess-aarav-01',
    playerId: 'player-fb-01',
    playerName: 'Aarav Sharma',
    sport: 'football',
    position: 'Midfielder',
    assessmentType: 'Initial Assessment',
    assessmentDate: '2023-09-15',
    coachName: 'Coach Vikram Roy',
    skillRatings: {
      fb_ball_control: 3,
      fb_first_touch: 3,
      fb_dribbling: 2,
      fb_turning_cod: 3,
      fb_short_passing: 3,
      fb_long_passing: 2,
      fb_receiving: 3,
      fb_shooting_technique: 2,
      fb_shooting_accuracy: 2,
      fb_finishing: 2,
      fb_1v1_attacking: 2,
      fb_weak_foot: 2,
      fb_positioning: 3,
      fb_decision_making: 3,
      fb_off_ball_movement: 3,
      fb_defensive_awareness: 3,
      fb_speed: 3,
      fb_agility: 3,
      fb_communication: 4,
      fb_coachability: 4,
      fb_mid_scanning: 3,
      fb_mid_passing_range: 2,
      fb_mid_decision: 3,
      fb_mid_retention: 3,
      fb_mid_transition: 3
    },
    skillObservations: {
      fb_dribbling: 'Good close control at slow speed, but loses ball during high-speed acceleration.',
      fb_weak_foot: 'Relies 90% on right foot. Hesitant to pass with left.',
      fb_short_passing: 'Clean instep contact with good passing weight.'
    },
    skillTargets: {
      fb_dribbling: 'Improve slalom speed and head-up vision while driving.',
      fb_weak_foot: 'Complete 50 left-foot wall passes in every warmup.'
    },
    includedPositionSkills: ['fb_mid_scanning', 'fb_mid_passing_range', 'fb_mid_decision', 'fb_mid_retention', 'fb_mid_transition'],
    domainScores: {
      technical: 52,
      tactical: 60,
      physical: 60,
      gameBehaviour: 80
    },
    overallScore: 58,
    developmentLevel: 'Developing',
    strengths: ['Communication & Teamwork', 'Coachability & Discipline', 'Short Passing', 'Receiving'],
    developmentPriorities: ['Weak Foot Competence', 'Dribbling', 'Shooting Accuracy', 'Long Passing'],
    coachObservation: 'Aarav is an exceptionally coachable athlete with a natural eye for passing. His baseline shows strong enthusiasm and spatial discipline. Priority focus for the next cycle is weak-foot passing and high-speed dribbling control.',
    coachRecommendation: 'Encourage daily 10-minute left foot wall rebounds at home and high-tempo small sided rondo games.',
    nextGoals: [],
    nextAssessmentDate: '2023-12-15',
    createdAt: '2023-09-15T10:00:00.000Z'
  },
  {
    id: 'assess-aarav-03',
    playerId: 'player-fb-01',
    playerName: 'Aarav Sharma',
    sport: 'football',
    position: 'Midfielder',
    assessmentType: '6-Month Review',
    assessmentDate: '2024-03-15',
    coachName: 'Coach Vikram Roy',
    skillRatings: {
      fb_ball_control: 4,
      fb_first_touch: 4,
      fb_dribbling: 4,
      fb_turning_cod: 4,
      fb_short_passing: 5,
      fb_long_passing: 4,
      fb_receiving: 4,
      fb_shooting_technique: 3,
      fb_shooting_accuracy: 3,
      fb_finishing: 3,
      fb_1v1_attacking: 4,
      fb_weak_foot: 4,
      fb_positioning: 4,
      fb_decision_making: 4,
      fb_off_ball_movement: 4,
      fb_defensive_awareness: 4,
      fb_speed: 4,
      fb_agility: 4,
      fb_communication: 5,
      fb_coachability: 5,
      fb_mid_scanning: 5,
      fb_mid_passing_range: 4,
      fb_mid_decision: 4,
      fb_mid_retention: 4,
      fb_mid_transition: 4
    },
    skillObservations: {
      fb_short_passing: 'Mastery level ground passing. Weighted accurately into running channels.',
      fb_mid_scanning: 'Scans over shoulder 4-5 times before receiving. Great spatial awareness.',
      fb_weak_foot: 'Now consistently distributes with left foot under active pressure.',
      fb_shooting_accuracy: 'Shooting technique is clean; consistency under heavy pressing is the next step.'
    },
    skillTargets: {
      fb_shooting_accuracy: 'Improve corner pocket finishing from outside the box.',
      fb_decision_making: 'Master progressive line-breaking through balls in tight matches.'
    },
    includedPositionSkills: ['fb_mid_scanning', 'fb_mid_passing_range', 'fb_mid_decision', 'fb_mid_retention', 'fb_mid_transition'],
    domainScores: {
      technical: 78,
      tactical: 80,
      physical: 80,
      gameBehaviour: 100
    },
    overallScore: 78,
    developmentLevel: 'Proficient',
    strengths: ['Short Passing', 'Pre-Orientation & Scanning', 'Communication & Teamwork', 'Coachability & Discipline', 'Ball Control'],
    developmentPriorities: ['Shooting Accuracy', 'Finishing'],
    coachObservation: 'Outstanding 6-month journey. Aarav has progressed from 58 (Developing) to 78 (Proficient). He commands the central midfield with poise, scanning, and consistent 2-touch passing.',
    coachRecommendation: 'Ready to take on vice-captaincy duties in upcoming regional matches. Focus training on edge-of-box finishing and direct free kicks.',
    nextGoals: [
      {
        id: 'goal-01',
        playerId: 'player-fb-01',
        goal: 'Improve shooting accuracy into corner pockets under pressure',
        skill: 'Shooting Accuracy',
        target: 'Score 7 out of 10 rolling feeds into corner quadrants',
        startDate: '2024-03-20',
        reviewDate: '2024-06-20',
        status: 'In Progress'
      },
      {
        id: 'goal-02',
        playerId: 'player-fb-01',
        goal: 'Enhance weak-foot passing consistency across 15+ meters',
        skill: 'Weak Foot Competence',
        target: 'Hit 8/10 target gates with left foot from 15 meters',
        startDate: '2024-03-20',
        reviewDate: '2024-06-20',
        status: 'In Progress'
      }
    ],
    nextAssessmentDate: '2024-06-15',
    createdAt: '2024-03-15T10:00:00.000Z'
  }
];

const SEED_BATCHES: BatchTeamGroup[] = [
  {
    id: 'batch-u12-fb',
    name: 'Football Development - U12 Squad',
    sport: 'football',
    ageGroup: 'U-12',
    coachName: 'Coach Vikram Roy',
    playerIds: ['player-fb-01'],
    trainingSchedule: 'Mon, Wed, Fri 4:30 PM - 6:00 PM',
    location: 'Main Turf Ground',
    createdAt: '2023-06-01T10:00:00.000Z'
  },
  {
    id: 'batch-u14-fb',
    name: 'Junior Strikers - U14 Batch',
    sport: 'football',
    ageGroup: 'U-14',
    coachName: 'Coach Vikram Roy',
    playerIds: ['player-fb-02'],
    trainingSchedule: 'Tue, Thu, Sat 5:00 PM - 6:30 PM',
    location: 'Turf Pitch 2',
    createdAt: '2023-08-01T10:00:00.000Z'
  },
  {
    id: 'batch-u14-bb',
    name: 'Hoops Excellence - U14 Squad',
    sport: 'basketball',
    ageGroup: 'U-14',
    coachName: 'Coach Ananya Sen',
    playerIds: ['player-bb-01'],
    trainingSchedule: 'Mon, Wed, Fri 6:00 AM - 7:30 AM',
    location: 'Indoor Court A',
    createdAt: '2024-01-01T10:00:00.000Z'
  }
];

const getLocalData = <T>(key: string): T | null => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch (e) {
    console.error(`Failed to parse ${key}`, e);
    return null;
  }
};

const setLocalData = <T>(key: string, data: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error(`Failed to store ${key}`, e);
  }
};

class AcademyService {
  // --- Players / Athletes ---
  getPlayers(): PlayerProfileData[] {
    const raw = getLocalData<PlayerProfileData[]>(PLAYERS_KEY);
    if (!raw || raw.length === 0) {
      setLocalData(PLAYERS_KEY, SEED_PLAYERS);
      return SEED_PLAYERS;
    }
    return raw;
  }

  getPlayerById(id: string): PlayerProfileData | null {
    const players = this.getPlayers();
    return players.find(p => p.id === id) || null;
  }

  savePlayer(player: PlayerProfileData): void {
    const players = this.getPlayers();
    const existingIndex = players.findIndex(p => p.id === player.id);
    let updated: PlayerProfileData[];
    if (existingIndex >= 0) {
      updated = [...players];
      updated[existingIndex] = player;
    } else {
      updated = [player, ...players];
    }
    setLocalData(PLAYERS_KEY, updated);

    // Sync to Cloud if an Academic Program is active
    const activeProgram = academicCoachingCloudService.getLocalProgram();
    if (activeProgram?.id) {
      academicCoachingCloudService.saveCloudAthlete({
        id: player.id,
        name: player.name,
        age: player.age,
        gender: player.gender,
        sport: player.sport,
        programType: activeProgram.programType,
        squadOrBatch: player.batchOrTeam || 'Academy Batch',
        jerseyNo: '',
        guardianName: player.parentName,
        guardianContact: player.parentContact,
        notes: player.medicalNotes || player.playerGoals || '',
        joiningDate: player.joiningDate
      }, activeProgram.id).catch(err => console.warn('Cloud sync error for single player:', err));
    }
  }

  deletePlayer(id: string): void {
    const players = this.getPlayers().filter(p => p.id !== id);
    setLocalData(PLAYERS_KEY, players);

    // Sync deletion to Cloud
    const activeProgram = academicCoachingCloudService.getLocalProgram();
    if (activeProgram?.id) {
      academicCoachingCloudService.deleteCloudAthlete(id).catch(err => console.warn('Cloud athlete deletion error:', err));
    }
  }

  deletePlayersBulk(ids: string[]): number {
    if (!ids || ids.length === 0) return 0;
    const idSet = new Set(ids);
    const existing = this.getPlayers();
    const remaining = existing.filter(p => !idSet.has(p.id));
    const deletedCount = existing.length - remaining.length;
    setLocalData(PLAYERS_KEY, remaining);

    // Sync batch deletion to Cloud
    const activeProgram = academicCoachingCloudService.getLocalProgram();
    if (activeProgram?.id) {
      academicCoachingCloudService.deleteCloudAthletesBatch(ids).catch(err => console.warn('Cloud batch athlete deletion error:', err));
    }

    return deletedCount;
  }

  deletePlayersBySport(sport: CoachingSportId): number {
    const existing = this.getPlayers();
    const toDelete = existing.filter(p => p.sport === sport).map(p => p.id);
    return this.deletePlayersBulk(toDelete);
  }

  // --- Bulk Import Students from CSV/Excel or Paste List ---
  importBulkStudents(
    students: Array<{
      name: string;
      sport?: CoachingSportId;
      age?: number;
      gender?: 'Male' | 'Female' | 'Other';
      dob?: string;
      gradeOrClass?: string;
      ageCategory?: CoachingAgeCategory;
      batchOrTeam?: string;
      position?: string;
      parentName?: string;
      parentContact?: string;
      medicalNotes?: string;
      jerseyNo?: string;
      previousExperience?: string;
      playerGoals?: string;
    }>,
    defaultSport: CoachingSportId = 'football',
    defaultBatch: string = 'Academy Batch'
  ): number {
    const existing = this.getPlayers();
    const existingKeys = new Set(existing.map(p => `${p.name.trim().toLowerCase()}_${p.sport}`));
    
    const toAdd: PlayerProfileData[] = [];
    students.forEach((st, idx) => {
      if (!st.name || !st.name.trim()) return;
      const cleanName = st.name.trim();
      const sportChoice = st.sport || defaultSport;
      const dedupeKey = `${cleanName.toLowerCase()}_${sportChoice}`;
      
      if (!existingKeys.has(dedupeKey)) {
        existingKeys.add(dedupeKey);
        const template = SPORT_TEMPLATES[sportChoice] || SPORT_TEMPLATES.football;
        const defaultPosition = template.positions[0]?.name || 'All-Rounder';
        
        // Calculate age robustly from DOB, age, or grade
        let parsedAge = Number(st.age) || 0;
        if (st.dob) {
          parsedAge = calculateAgeFromDob(st.dob);
        } else if (parsedAge <= 0 && st.gradeOrClass) {
          const classNum = parseInt(st.gradeOrClass.replace(/[^0-9]/g, ''), 10);
          if (classNum >= 1 && classNum <= 12) parsedAge = classNum + 5;
        }
        if (parsedAge <= 0) parsedAge = 13;

        const birthYear = new Date().getFullYear() - parsedAge;
        const finalDob = st.dob || `${birthYear}-05-15`;
        const detectedCategory = st.ageCategory || detectAgeCategory(parsedAge, finalDob, st.gradeOrClass);
        const batchName = st.batchOrTeam && st.batchOrTeam !== 'Academy Batch' 
          ? st.batchOrTeam 
          : defaultBatch !== 'Academy Batch' 
            ? defaultBatch 
            : `${SPORT_TEMPLATES[sportChoice]?.name || 'Academy'} ${detectedCategory} Squad`;

        toAdd.push({
          id: `athlete-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 4)}`,
          name: cleanName,
          dob: finalDob,
          age: parsedAge,
          gender: st.gender || 'Male',
          sport: sportChoice,
          position: st.position || defaultPosition,
          gradeOrClass: st.gradeOrClass || (parsedAge <= 10 ? 'Class 4' : parsedAge <= 12 ? 'Class 6' : parsedAge === 13 ? 'Class 7' : parsedAge === 14 ? 'Class 8' : parsedAge <= 16 ? 'Class 10' : 'Class 12'),
          ageCategory: detectedCategory,
          batchOrTeam: batchName,
          coachName: 'Academy Coach',
          joiningDate: new Date().toISOString().split('T')[0],
          parentName: st.parentName || 'Parent / Guardian',
          parentContact: st.parentContact || '',
          dominantSide: 'Right Foot / Right Hand',
          previousExperience: st.previousExperience || `Youth ${detectedCategory} Academy Program Training`,
          playerGoals: st.playerGoals || 'Master technical fundamentals, tactical vision & match composure',
          medicalNotes: st.medicalNotes || '',
          createdAt: new Date().toISOString(),
          active: true
        });
      }
    });

    if (toAdd.length > 0) {
      const updated = [...toAdd, ...existing];
      setLocalData(PLAYERS_KEY, updated);

      // Cloud Firestore batch synchronization
      const activeProgram = academicCoachingCloudService.getLocalProgram();
      if (activeProgram?.id) {
        academicCoachingCloudService.saveCloudAthletesBatch(
          toAdd.map(p => ({
            id: p.id,
            name: p.name,
            age: p.age,
            gender: p.gender,
            sport: p.sport,
            programType: activeProgram.programType,
            squadOrBatch: p.batchOrTeam || 'Academy Batch',
            jerseyNo: '',
            guardianName: p.parentName,
            guardianContact: p.parentContact,
            notes: p.medicalNotes || p.playerGoals || '',
            joiningDate: p.joiningDate
          })),
          activeProgram.id
        ).catch(err => console.warn('Cloud batch athletes sync warning:', err));
      }
    }

    return toAdd.length;
  }

  // --- Fast Import from School PE Database or Class Roster ---
  importStudentsFromSchool(
    schoolStudents: Array<{
      id?: string;
      name: string;
      grade?: string;
      gender?: string;
      dob?: string;
      age?: number;
      parentName?: string;
      parentContact?: string;
      sport?: CoachingSportId;
      position?: string;
    }>,
    defaultSport: CoachingSportId = 'football'
  ): number {
    const existing = this.getPlayers();
    const existingNames = new Set(existing.map(p => p.name.trim().toLowerCase()));
    
    const toAdd: PlayerProfileData[] = [];
    schoolStudents.forEach(st => {
      if (!st.name || !st.name.trim()) return;
      if (!existingNames.has(st.name.trim().toLowerCase())) {
        existingNames.add(st.name.trim().toLowerCase());
        const sportChoice = st.sport || defaultSport;
        const template = SPORT_TEMPLATES[sportChoice] || SPORT_TEMPLATES.football;
        const defaultPosition = template.positions[0]?.name || 'All-Rounder';
        const parsedAge = st.age || (st.dob ? calculateAgeFromDob(st.dob) : 13);
        const gradeStr = st.grade ? (st.grade.toLowerCase().includes('class') ? st.grade : `Class ${st.grade}`) : undefined;
        const category = detectAgeCategory(parsedAge, st.dob, gradeStr);

        toAdd.push({
          id: `athlete-${st.id || Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          name: st.name.trim(),
          dob: st.dob || `20${14 - parsedAge}-01-01`,
          age: parsedAge,
          gender: (st.gender === 'Female' ? 'Female' : 'Male'),
          sport: sportChoice,
          position: st.position || defaultPosition,
          gradeOrClass: gradeStr,
          ageCategory: category,
          batchOrTeam: st.grade ? `Class ${st.grade} PE (${category})` : `School PE (${category})`,
          coachName: 'PE Department Coach',
          joiningDate: new Date().toISOString().split('T')[0],
          parentName: st.parentName || 'Parent / Guardian',
          parentContact: st.parentContact || '',
          dominantSide: 'Right Hand / Right Foot',
          previousExperience: 'School Physical Education Curriculum',
          playerGoals: 'Develop fundamental athletic motor skills, game intelligence and sportsmanship',
          createdAt: new Date().toISOString(),
          active: true
        });
      }
    });

    if (toAdd.length > 0) {
      const updated = [...toAdd, ...existing];
      setLocalData(PLAYERS_KEY, updated);

      // Cloud Firestore sync
      const activeProgram = academicCoachingCloudService.getLocalProgram();
      if (activeProgram?.id) {
        academicCoachingCloudService.saveCloudAthletesBatch(
          toAdd.map(p => ({
            id: p.id,
            name: p.name,
            age: p.age,
            gender: p.gender,
            sport: p.sport,
            programType: activeProgram.programType,
            squadOrBatch: p.batchOrTeam || 'School Cohort',
            jerseyNo: '',
            guardianName: p.parentName,
            guardianContact: p.parentContact,
            notes: p.playerGoals,
            joiningDate: p.joiningDate
          })),
          activeProgram.id
        ).catch(err => console.warn('Cloud batch athletes sync warning:', err));
      }
    }
    return toAdd.length;
  }

  // --- Assessments ---
  getAssessments(): PlayerAssessmentRecord[] {
    const raw = getLocalData<PlayerAssessmentRecord[]>(ASSESSMENTS_KEY);
    if (!raw || raw.length === 0) {
      setLocalData(ASSESSMENTS_KEY, SEED_ASSESSMENTS);
      return SEED_ASSESSMENTS;
    }
    return raw;
  }

  getAssessmentById(id: string): PlayerAssessmentRecord | undefined {
    return this.getAssessments().find(a => a.id === id);
  }

  getAssessmentsForPlayer(playerId: string): PlayerAssessmentRecord[] {
    const all = this.getAssessments();
    return all
      .filter(a => a.playerId === playerId)
      .sort((a, b) => new Date(a.assessmentDate).getTime() - new Date(b.assessmentDate).getTime());
  }

  getLatestAssessmentForPlayer(playerId: string): PlayerAssessmentRecord | null {
    const history = this.getAssessmentsForPlayer(playerId);
    return history.length > 0 ? history[history.length - 1] : null;
  }

  saveAssessment(record: PlayerAssessmentRecord): void {
    // Ensure ageCategory, gradeOrClass, and ageBenchmarkNorm are set
    const player = this.getPlayerById(record.playerId);
    const age = record.ageAtAssessment || player?.age || 13;
    const dob = player?.dob || `20${14 - age}-05-15`;
    const gradeOrClass = record.gradeOrClass || player?.gradeOrClass;
    const ageCategory = record.ageCategory || player?.ageCategory || detectAgeCategory(age, dob, gradeOrClass);
    
    const benchmarkNorm = record.ageBenchmarkNorm || calculateAgePerformanceBenchmark(
      ageCategory,
      record.overallScore,
      record.domainScores
    );

    const enrichedRecord: PlayerAssessmentRecord = {
      ...record,
      ageAtAssessment: age,
      gradeOrClass: gradeOrClass,
      ageCategory: ageCategory,
      ageBenchmarkNorm: benchmarkNorm
    };

    const assessments = this.getAssessments();
    const existingIndex = assessments.findIndex(a => a.id === enrichedRecord.id);
    let updated: PlayerAssessmentRecord[];
    if (existingIndex >= 0) {
      updated = [...assessments];
      updated[existingIndex] = enrichedRecord;
    } else {
      updated = [enrichedRecord, ...assessments];
    }
    setLocalData(ASSESSMENTS_KEY, updated);

    // Sync to Cloud Firestore if Academy program is active
    const activeProgram = academicCoachingCloudService.getLocalProgram();
    if (activeProgram?.id) {
      academicCoachingCloudService.saveCloudAssessment({
        id: enrichedRecord.id,
        programId: activeProgram.id,
        athleteId: enrichedRecord.playerId,
        athleteName: enrichedRecord.playerName,
        sport: enrichedRecord.sport,
        assessmentDate: enrichedRecord.assessmentDate,
        evaluatorCoach: enrichedRecord.coachName,
        overallScore: enrichedRecord.overallScore,
        skillBreakdown: enrichedRecord.skillRatings,
        coachNotes: `${enrichedRecord.coachObservation || ''} | ${enrichedRecord.coachRecommendation || ''}`,
        actionPlan: enrichedRecord.nextGoals?.map(g => `${g.skill}: ${g.goal}`).join('; ') || ''
      }, activeProgram.id).catch(err => console.warn('Cloud assessment sync warning:', err));
    }
  }

  deleteAssessment(id: string): void {
    const updated = this.getAssessments().filter(a => a.id !== id);
    setLocalData(ASSESSMENTS_KEY, updated);
  }

  // --- Batches / Squads ---
  getBatches(): BatchTeamGroup[] {
    const raw = getLocalData<BatchTeamGroup[]>(BATCHES_KEY);
    if (!raw || raw.length === 0) {
      setLocalData(BATCHES_KEY, SEED_BATCHES);
      return SEED_BATCHES;
    }
    return raw;
  }

  saveBatch(batch: BatchTeamGroup): void {
    const batches = this.getBatches();
    const idx = batches.findIndex(b => b.id === batch.id);
    let updated: BatchTeamGroup[];
    if (idx >= 0) {
      updated = [...batches];
      updated[idx] = batch;
    } else {
      updated = [batch, ...batches];
    }
    setLocalData(BATCHES_KEY, updated);
  }

  deleteBatch(id: string): void {
    const updated = this.getBatches().filter(b => b.id !== id);
    setLocalData(BATCHES_KEY, updated);
  }

  // --- Goals ---
  getGoalsForPlayer(playerId: string): TrainingGoal[] {
    const latestAssessment = this.getLatestAssessmentForPlayer(playerId);
    return latestAssessment?.nextGoals || [];
  }

  saveGoalsForPlayer(playerId: string, goals: TrainingGoal[]): void {
    const latest = this.getLatestAssessmentForPlayer(playerId);
    if (latest) {
      latest.nextGoals = goals;
      this.saveAssessment(latest);
    }
  }

  // --- Automatic Strengths & Development Priorities Calculation ---
  calculateStrengthsAndPriorities(
    sport: CoachingSportId,
    ratings: Record<string, number>,
    playerHistory: PlayerAssessmentRecord[] = []
  ): { strengths: string[]; developmentPriorities: string[] } {
    const template = SPORT_TEMPLATES[sport] || SPORT_TEMPLATES.football;
    const skillNameMap = new Map<string, string>();
    template.skills.forEach(s => skillNameMap.set(s.id, s.name));

    const ratedItems = Object.entries(ratings).map(([id, rating]) => ({
      id,
      name: skillNameMap.get(id) || id,
      rating
    }));

    if (ratedItems.length === 0) {
      return { strengths: ['Eager to Learn', 'Enthusiastic'], developmentPriorities: ['Core Fundamentals'] };
    }

    const sortedDesc = [...ratedItems].sort((a, b) => b.rating - a.rating);
    const sortedAsc = [...ratedItems].sort((a, b) => a.rating - b.rating);

    const highRatings = sortedDesc.filter(item => item.rating >= 4);
    let strengths: string[] = [];
    if (highRatings.length >= 3) {
      strengths = highRatings.slice(0, 4).map(s => s.name);
    } else {
      strengths = sortedDesc.slice(0, 3).map(s => s.name);
    }

    const lowRatings = sortedAsc.filter(item => item.rating <= 3);
    let priorities: string[] = [];
    if (lowRatings.length >= 2) {
      priorities = lowRatings.slice(0, 3).map(p => p.name);
    } else {
      priorities = sortedAsc.slice(0, 2).map(p => p.name);
    }

    return { strengths, developmentPriorities: priorities };
  }

  // Calculate domain averages from ratings map
  calculateDomainBreakdown(
    sport: CoachingSportId,
    ratings: Record<string, number>
  ): { technical: number; tactical: number; physical: number; gameBehaviour: number } {
    const template = SPORT_TEMPLATES[sport] || SPORT_TEMPLATES.football;
    const techRatings: number[] = [];
    const tactRatings: number[] = [];
    const physRatings: number[] = [];
    const behavRatings: number[] = [];

    template.skills.forEach(skill => {
      const score = ratings[skill.id];
      if (score !== undefined) {
        if (skill.category === 'technical') techRatings.push(score);
        else if (skill.category === 'tactical') tactRatings.push(score);
        else if (skill.category === 'physical') physRatings.push(score);
        else if (skill.category === 'gameBehaviour') behavRatings.push(score);
      }
    });

    return {
      technical: calculateDevelopmentScore(techRatings),
      tactical: calculateDevelopmentScore(tactRatings),
      physical: calculateDevelopmentScore(physRatings),
      gameBehaviour: calculateDevelopmentScore(behavRatings)
    };
  }

  // Suggested training drills based on development priorities
  getSuggestedDrillsForPriorities(sport: CoachingSportId, priorities: string[]): TrainingDrillItem[] {
    const template = SPORT_TEMPLATES[sport] || SPORT_TEMPLATES.football;
    if (!template.drills || template.drills.length === 0) return [];

    const matched = template.drills.filter(d => 
      priorities.some(p => p.toLowerCase().includes(d.skillName.toLowerCase()) || d.skillName.toLowerCase().includes(p.toLowerCase()))
    );

    return matched.length > 0 ? matched : template.drills.slice(0, 3);
  }
}

export const academyService = new AcademyService();
