import {
  DevelopmentDomainId,
  DevelopmentLevel,
  TestDefinition,
  CalculatedTestResult,
  DomainScore,
  BMIDevelopmentPoint,
  DevelopmentFocusSuggestion,
  InterventionRecord,
  PhysicalDevelopmentProfile,
  Student,
  FitnessResult
} from '../types.ts';
import { parseFitnessValue } from '../utils/bmiUtils.ts';
import { db, auth } from './firebase.ts';
import { collection, doc, setDoc, getDocs, query, where, deleteDoc } from 'firebase/firestore';

// =========================================================================
// 1. MASTER TEST DEFINITIONS CATALOG
// =========================================================================

export const DOMAIN_METADATA: Record<DevelopmentDomainId, { name: string; description: string; iconName: string; colorClass: string }> = {
  fitness: {
    name: 'Fitness Development',
    description: 'Physical capacity including speed, endurance, power, strength, flexibility, agility, balance, and healthy stature.',
    iconName: 'Activity',
    colorClass: 'text-amber-600 bg-amber-50 border-amber-200'
  },
  movement_skills: {
    name: 'Movement Skills',
    description: 'Fundamental motor skills, spatial coordination, balance, agility, and locomotion control.',
    iconName: 'Move',
    colorClass: 'text-blue-600 bg-blue-50 border-blue-200'
  },
  sport_skills: {
    name: 'Sport Skills',
    description: 'Technical proficiency, ball handling, game play application, and tactical decision making.',
    iconName: 'Trophy',
    colorClass: 'text-emerald-600 bg-emerald-50 border-emerald-200'
  },
  participation: {
    name: 'Participation & Engagement',
    description: 'Effort, activity consistency, preparedness, and active engagement during PE sessions.',
    iconName: 'HeartHandshake',
    colorClass: 'text-purple-600 bg-purple-50 border-purple-200'
  },
  teamwork: {
    name: 'Teamwork & Social Development',
    description: 'Cooperation, sportsmanship, court communication, peer respect, and fair play.',
    iconName: 'Users',
    colorClass: 'text-indigo-600 bg-indigo-50 border-indigo-200'
  },
  personal_dev: {
    name: 'Personal Development',
    description: 'Goal-setting, resilience, personal reflection, confidence, and self-improvement.',
    iconName: 'Sparkles',
    colorClass: 'text-teal-600 bg-teal-50 border-teal-200'
  }
};

export const STANDARD_RUBRIC_LEVELS = [
  { level: 1, label: 'Beginning', description: 'Requires direct teacher guidance to attempt the movement or skill.' },
  { level: 2, label: 'Developing', description: 'Demonstrates basic technique with occasional inconsistency in execution.' },
  { level: 3, label: 'Proficient', description: 'Consistent and controlled execution during practice drills and structured play.' },
  { level: 4, label: 'Advanced', description: 'Exceptional fluid mastery applied spontaneously during dynamic game play.' }
];

export const MASTER_TEST_DEFINITIONS: TestDefinition[] = [
  // -------------------------------------------------------------------------
  // DOMAIN 1: FITNESS DEVELOPMENT
  // -------------------------------------------------------------------------
  {
    id: 'bmi',
    name: 'BMI (Height & Weight Stature)',
    domain: 'fitness',
    component: 'Body Composition & Stature',
    classGrades: ['ALL'],
    unit: 'kg/m²',
    measurementType: 'composite_bmi',
    direction: 'higher_is_better',
    scoringMethod: 'bmi_standard',
    description: 'Body Mass Index tracking height & weight stature development.',
    equipment: ['Stadiometer / Measuring Tape', 'Digital Scale'],
    protocol: 'Record weight in kg and height in cm separated by slash (e.g. 28/140).'
  },
  {
    id: 'sprint_20m',
    name: '20m Sprint / Acceleration',
    domain: 'fitness',
    component: 'Speed & Acceleration',
    classGrades: ['1', '2', '3', '4', '5'],
    unit: 'seconds',
    measurementType: 'numeric',
    direction: 'lower_is_better',
    scoringMethod: 'benchmark',
    description: 'Short sprint evaluating acceleration and explosive start speed.',
    equipment: ['20m Straight Runway', 'Stopwatch', '2 Cones'],
    protocol: 'Standing start behind line. Sprint at maximum velocity across 20m mark.'
  },
  {
    id: 'sprint_25m',
    name: '25m Sprint (Compact Track)',
    domain: 'fitness',
    component: 'Speed & Acceleration',
    classGrades: ['ALL'],
    unit: 'seconds',
    measurementType: 'numeric',
    direction: 'lower_is_better',
    scoringMethod: 'benchmark',
    description: 'Speed sprint adapted for compact grounds or indoor courts.',
    equipment: ['25m Straight Track', 'Stopwatch', 'Cones'],
    protocol: 'Standing start. Sprint at full effort 25 meters across finish line.'
  },
  {
    id: 'sprint_30m',
    name: '30m Sprint (Compact Track)',
    domain: 'fitness',
    component: 'Speed & Acceleration',
    classGrades: ['ALL'],
    unit: 'seconds',
    measurementType: 'numeric',
    direction: 'lower_is_better',
    scoringMethod: 'benchmark',
    description: 'CBSE alternative sprint on compact campus tracks.',
    equipment: ['30m Track', 'Stopwatch', 'Cones'],
    protocol: 'Standing start. Sprint 30 meters at full velocity across finish line.'
  },
  {
    id: 'sprint_50m',
    name: '50m Sprint (Khelo India)',
    domain: 'fitness',
    component: 'Maximum Velocity & Speed',
    classGrades: ['4', '5', '6', '7', '8', '9', '10', '11', '12'],
    unit: 'seconds',
    measurementType: 'numeric',
    direction: 'lower_is_better',
    scoringMethod: 'percentile',
    description: 'Official Khelo India 50m sprint measuring maximum linear speed.',
    equipment: ['50m Straight Track', 'Stopwatch', 'Cones'],
    protocol: 'Standing start behind line. Sprint 50m full power.'
  },
  {
    id: 'sit_reach',
    name: 'Sit and Reach (Flexibility)',
    domain: 'fitness',
    component: 'Hamstring & Spinal Flexibility',
    classGrades: ['ALL'],
    unit: 'cm',
    measurementType: 'numeric',
    direction: 'higher_is_better',
    scoringMethod: 'percentile',
    description: 'Evaluates lower back and hamstring flexibility.',
    equipment: ['Sit & Reach Box / Ruler'],
    protocol: 'Sit with knees locked flat, reach forward smoothly along measuring ruler.'
  },
  {
    id: 'broad_jump',
    name: 'Standing Broad Jump (Leg Power)',
    domain: 'fitness',
    component: 'Explosive Leg Power',
    classGrades: ['ALL'],
    unit: 'cm',
    measurementType: 'numeric',
    direction: 'higher_is_better',
    scoringMethod: 'percentile',
    description: 'Measures explosive horizontal leg power.',
    equipment: ['Non-slip Jump Mat / Tape'],
    protocol: 'Two-legged jump from line. Measure distance to closest rear heel.'
  },
  {
    id: 'flamingo',
    name: 'Flamingo Balance (Core & Leg)',
    domain: 'fitness',
    component: 'Static Balance & Core Stability',
    classGrades: ['1', '2', '3', '4', '5'],
    unit: 'count',
    measurementType: 'numeric',
    direction: 'lower_is_better',
    scoringMethod: 'benchmark',
    description: 'Measures single-leg balance over 60 seconds (lower fall count is better).',
    equipment: ['Balance Beam', 'Stopwatch'],
    protocol: 'Stand on preferred leg on beam for 60s. Record count of stumbles/falls.'
  },
  {
    id: 'plate_tapping',
    name: 'Plate Tapping (Upper Limb Speed)',
    domain: 'fitness',
    component: 'Limb Speed & Coordination',
    classGrades: ['1', '2', '3', '4', '5'],
    unit: 'count',
    measurementType: 'numeric',
    direction: 'higher_is_better',
    scoringMethod: 'benchmark',
    description: 'Measures upper-limb movement velocity over 30 seconds.',
    equipment: ['Tapping Board', 'Stopwatch'],
    protocol: 'Tap between two discs as fast as possible for 30s. Record total taps.'
  },
  {
    id: 'pushups',
    name: 'Push-ups (Upper Body Strength)',
    domain: 'fitness',
    component: 'Upper Body Muscular Endurance',
    classGrades: ['6', '7', '8', '9', '10', '11', '12'],
    unit: 'count',
    measurementType: 'numeric',
    direction: 'higher_is_better',
    scoringMethod: 'benchmark',
    description: 'Standard 60-second push-ups (or modified knee push-ups).',
    equipment: ['Exercise Mat', 'Stopwatch'],
    protocol: 'Complete maximum controlled full-range push-ups in 60 seconds.'
  },
  {
    id: 'curlups',
    name: 'Partial Curl-ups (Abdominal Core)',
    domain: 'fitness',
    component: 'Abdominal & Core Strength',
    classGrades: ['6', '7', '8', '9', '10', '11', '12'],
    unit: 'count',
    measurementType: 'numeric',
    direction: 'higher_is_better',
    scoringMethod: 'benchmark',
    description: 'Controlled 60-second partial curl-ups measuring abdominal endurance.',
    equipment: ['Exercise Mat', 'Measuring Strip', 'Stopwatch'],
    protocol: 'Controlled curl-ups sliding fingers 10cm forward on mat in 60s.'
  },
  {
    id: 'shuttle_4x10',
    name: '4×10m Shuttle Run (Agility)',
    domain: 'fitness',
    component: 'Agility & Change of Direction',
    classGrades: ['ALL'],
    unit: 'seconds',
    measurementType: 'numeric',
    direction: 'lower_is_better',
    scoringMethod: 'benchmark',
    description: 'Shuttle sprint picking up wooden blocks measuring multi-directional agility.',
    equipment: ['2 Cones', '2 Blocks', 'Stopwatch'],
    protocol: 'Sprint 10m, pick block, return across line, sprint for 2nd block.'
  },
  {
    id: 'run_600m',
    name: '600m Run / Walk (Cardio)',
    domain: 'fitness',
    component: 'Cardiorespiratory Endurance',
    classGrades: ['4', '5', '6', '7', '8', '9', '10', '11', '12'],
    unit: 'min:sec',
    measurementType: 'time_mm_ss',
    direction: 'lower_is_better',
    scoringMethod: 'percentile',
    description: 'Timed 600m run/walk evaluating aerobic endurance on school tracks.',
    equipment: ['Track / Ground', 'Stopwatch'],
    protocol: 'Continuous paced run/walk over 600 meters. Record MM:SS.'
  },
  {
    id: 'run_long',
    name: '800m (G) / 1000m (B) Endurance Run',
    domain: 'fitness',
    component: 'Aerobic Stamina & Capacity',
    classGrades: ['8', '9', '10', '11', '12'],
    unit: 'min:sec',
    measurementType: 'time_mm_ss',
    direction: 'lower_is_better',
    scoringMethod: 'percentile',
    description: 'Long-distance aerobic capacity run.',
    equipment: ['Track', 'Stopwatch'],
    protocol: 'Paced continuous run (800m for female, 1000m for male). Record MM:SS.'
  },

  // -------------------------------------------------------------------------
  // DOMAIN 2: MOVEMENT SKILLS
  // -------------------------------------------------------------------------
  {
    id: 'balance_stability',
    name: 'Dynamic Balance & Posture',
    domain: 'movement_skills',
    component: 'Balance & Core Stability',
    classGrades: ['ALL'],
    unit: 'rubric 1-4',
    measurementType: 'rubric',
    direction: 'rubric',
    scoringMethod: 'rubric_level',
    rubricLevels: STANDARD_RUBRIC_LEVELS,
    description: 'Maintains balance while moving, turning, stopping, and balancing on narrow paths.'
  },
  {
    id: 'bilateral_coordination',
    name: 'Bilateral Coordination & Rhythm',
    domain: 'movement_skills',
    component: 'Movement Coordination',
    classGrades: ['ALL'],
    unit: 'rubric 1-4',
    measurementType: 'rubric',
    direction: 'rubric',
    scoringMethod: 'rubric_level',
    rubricLevels: STANDARD_RUBRIC_LEVELS,
    description: 'Coordinated simultaneous use of both sides of body (cross-body movement, rhythmic marching).'
  },
  {
    id: 'jumping_landing',
    name: 'Jumping, Hopping & Safe Landing',
    domain: 'movement_skills',
    component: 'Locomotor & Plyometrics',
    classGrades: ['ALL'],
    unit: 'rubric 1-4',
    measurementType: 'rubric',
    direction: 'rubric',
    scoringMethod: 'rubric_level',
    rubricLevels: STANDARD_RUBRIC_LEVELS,
    description: 'Proper knee-flexion takeoff, aerial stability, and quiet two-foot landing with bent knees.'
  },
  {
    id: 'running_mechanics',
    name: 'Running Form & Sprint Mechanics',
    domain: 'movement_skills',
    component: 'Locomotion Mechanics',
    classGrades: ['ALL'],
    unit: 'rubric 1-4',
    measurementType: 'rubric',
    direction: 'rubric',
    scoringMethod: 'rubric_level',
    rubricLevels: STANDARD_RUBRIC_LEVELS,
    description: 'Proper high knee drive, arm swing from shoulders, upright torso, and forefoot strike.'
  },
  {
    id: 'throwing_accuracy',
    name: 'Throwing Form & Target Accuracy',
    domain: 'movement_skills',
    component: 'Manipulative Skills',
    classGrades: ['ALL'],
    unit: 'rubric 1-4',
    measurementType: 'rubric',
    direction: 'rubric',
    scoringMethod: 'rubric_level',
    rubricLevels: STANDARD_RUBRIC_LEVELS,
    description: 'Step with opposite foot, hip rotation, arm follow-through, and target release.'
  },
  {
    id: 'catching_tracking',
    name: 'Visual Tracking & Two-Hand Catching',
    domain: 'movement_skills',
    component: 'Manipulative Skills',
    classGrades: ['ALL'],
    unit: 'rubric 1-4',
    measurementType: 'rubric',
    direction: 'rubric',
    scoringMethod: 'rubric_level',
    rubricLevels: STANDARD_RUBRIC_LEVELS,
    description: 'Tracks airborne ball with eyes, reaches with soft hands, and absorbs force toward chest.'
  },
  {
    id: 'kicking_striking',
    name: 'Kicking & Lower-Limb Striking',
    domain: 'movement_skills',
    component: 'Manipulative Skills',
    classGrades: ['ALL'],
    unit: 'rubric 1-4',
    measurementType: 'rubric',
    direction: 'rubric',
    scoringMethod: 'rubric_level',
    rubricLevels: STANDARD_RUBRIC_LEVELS,
    description: 'Plant foot beside ball, instep strike, and fluid hip follow-through toward target.'
  },
  {
    id: 'spatial_awareness',
    name: 'Spatial Awareness & Direction Change',
    domain: 'movement_skills',
    component: 'Spatial & Perceptual Motor',
    classGrades: ['ALL'],
    unit: 'rubric 1-4',
    measurementType: 'rubric',
    direction: 'rubric',
    scoringMethod: 'rubric_level',
    rubricLevels: STANDARD_RUBRIC_LEVELS,
    description: 'Navigates open spaces, avoids collisions, and executes sharp cuts without losing speed.'
  },

  // -------------------------------------------------------------------------
  // DOMAIN 3: SPORT SKILLS
  // -------------------------------------------------------------------------
  {
    id: 'sport_ball_control',
    name: 'Ball Control & Handling (Multi-Sport)',
    domain: 'sport_skills',
    component: 'Ball Control & Manipulation',
    classGrades: ['ALL'],
    unit: 'rubric 1-4',
    measurementType: 'rubric',
    direction: 'rubric',
    scoringMethod: 'rubric_level',
    rubricLevels: STANDARD_RUBRIC_LEVELS,
    description: 'Proficiency in receiving, trapping, dribbling, or handling the sport-specific ball under pressure.'
  },
  {
    id: 'sport_passing_accuracy',
    name: 'Passing & Target Delivery',
    domain: 'sport_skills',
    component: 'Passing & Distribution',
    classGrades: ['ALL'],
    unit: 'rubric 1-4',
    measurementType: 'rubric',
    direction: 'rubric',
    scoringMethod: 'rubric_level',
    rubricLevels: STANDARD_RUBRIC_LEVELS,
    description: 'Accurately delivers passes to teammates with appropriate weight, timing, and trajectory.'
  },
  {
    id: 'sport_scoring_shooting',
    name: 'Shooting & Scoring Technique',
    domain: 'sport_skills',
    component: 'Finishing & Scoring',
    classGrades: ['ALL'],
    unit: 'rubric 1-4',
    measurementType: 'rubric',
    direction: 'rubric',
    scoringMethod: 'rubric_level',
    rubricLevels: STANDARD_RUBRIC_LEVELS,
    description: 'Execution of scoring technique (shot on goal, basket, smash, boundary hit) with composure.'
  },
  {
    id: 'sport_tactical_decision',
    name: 'Tactical Awareness & Decision Making',
    domain: 'sport_skills',
    component: 'Tactical Decision Making',
    classGrades: ['4', '5', '6', '7', '8', '9', '10', '11', '12'],
    unit: 'rubric 1-4',
    measurementType: 'rubric',
    direction: 'rubric',
    scoringMethod: 'rubric_level',
    rubricLevels: STANDARD_RUBRIC_LEVELS,
    description: 'Reads game flow, chooses optimal options (pass vs drive), and maintains positional discipline.'
  },

  // -------------------------------------------------------------------------
  // DOMAIN 4: PARTICIPATION & ENGAGEMENT
  // -------------------------------------------------------------------------
  {
    id: 'participation_effort',
    name: 'Active Effort & Activity Engagement',
    domain: 'participation',
    component: 'Physical Effort',
    classGrades: ['ALL'],
    unit: 'rubric 1-4',
    measurementType: 'rubric',
    direction: 'rubric',
    scoringMethod: 'rubric_level',
    rubricLevels: STANDARD_RUBRIC_LEVELS,
    description: 'Consistently demonstrates sustained physical effort during warm-ups, skill drills, and games.'
  },
  {
    id: 'participation_consistency',
    name: 'Preparedness & Consistency',
    domain: 'participation',
    component: 'Session Readiness',
    classGrades: ['ALL'],
    unit: 'rubric 1-4',
    measurementType: 'rubric',
    direction: 'rubric',
    scoringMethod: 'rubric_level',
    rubricLevels: STANDARD_RUBRIC_LEVELS,
    description: 'Arrives in proper sports attire, listens actively to teacher cues, and participates reliably.'
  },

  // -------------------------------------------------------------------------
  // DOMAIN 5: TEAMWORK & SOCIAL DEVELOPMENT
  // -------------------------------------------------------------------------
  {
    id: 'teamwork_cooperation',
    name: 'Peer Cooperation & Communication',
    domain: 'teamwork',
    component: 'Collaboration',
    classGrades: ['ALL'],
    unit: 'rubric 1-4',
    measurementType: 'rubric',
    direction: 'rubric',
    scoringMethod: 'rubric_level',
    rubricLevels: STANDARD_RUBRIC_LEVELS,
    description: 'Works harmoniously with all peers, shares equipment, and communicates positively on court.'
  },
  {
    id: 'teamwork_sportsmanship',
    name: 'Fair Play, Respect & Sportsmanship',
    domain: 'teamwork',
    component: 'Fair Play & Respect',
    classGrades: ['ALL'],
    unit: 'rubric 1-4',
    measurementType: 'rubric',
    direction: 'rubric',
    scoringMethod: 'rubric_level',
    rubricLevels: STANDARD_RUBRIC_LEVELS,
    description: 'Respects referee calls, congratulates peers, handles victory and defeat with dignity.'
  },

  // -------------------------------------------------------------------------
  // DOMAIN 6: PERSONAL DEVELOPMENT
  // -------------------------------------------------------------------------
  {
    id: 'personal_persistence',
    name: 'Persistence & Growth Mindset',
    domain: 'personal_dev',
    component: 'Resilience',
    classGrades: ['ALL'],
    unit: 'rubric 1-4',
    measurementType: 'rubric',
    direction: 'rubric',
    scoringMethod: 'rubric_level',
    rubricLevels: STANDARD_RUBRIC_LEVELS,
    description: 'Persists through difficult drills, demonstrates determination, and strives for improvement.'
  },
  {
    id: 'personal_confidence',
    name: 'Movement Confidence & Initiative',
    domain: 'personal_dev',
    component: 'Self-Efficacy & Confidence',
    classGrades: ['ALL'],
    unit: 'rubric 1-4',
    measurementType: 'rubric',
    direction: 'rubric',
    scoringMethod: 'rubric_level',
    rubricLevels: STANDARD_RUBRIC_LEVELS,
    description: 'Displays self-confidence in trying new physical challenges and volunteering for leadership roles.'
  }
];

// Map lookup by ID
export const TEST_DEFINITIONS_MAP = new Map<string, TestDefinition>(
  MASTER_TEST_DEFINITIONS.map(t => [t.id, t])
);

export function getTestDefinition(testId: string): TestDefinition {
  const found = TEST_DEFINITIONS_MAP.get(testId);
  if (found) return found;

  // Fallback dynamic test definition
  return {
    id: testId,
    name: testId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    domain: 'fitness',
    component: 'General Fitness',
    classGrades: ['ALL'],
    unit: 'score',
    measurementType: 'numeric',
    direction: 'higher_is_better',
    scoringMethod: 'percentile',
    description: 'Standard physical education assessment item.'
  };
}

// =========================================================================
// 2. DETERMINISTIC CALCULATION ENGINE
// =========================================================================

/**
 * Maps score percent (0-100) into 5 Standard Development Levels
 */
export function scoreToDevelopmentLevel(scorePercent: number): DevelopmentLevel {
  if (scorePercent >= 85) return 'Advanced';
  if (scorePercent >= 70) return 'Proficient';
  if (scorePercent >= 55) return 'Progressing';
  if (scorePercent >= 40) return 'Developing';
  return 'Beginning';
}

/**
 * Converts development level to a 0-100 score percent baseline
 */
export function levelToScorePercent(level: DevelopmentLevel): number {
  switch (level) {
    case 'Advanced': return 92;
    case 'Proficient': return 78;
    case 'Progressing': return 62;
    case 'Developing': return 48;
    case 'Beginning': return 32;
    default: return 50;
  }
}

/**
 * Deterministically evaluates raw assessment value against test direction and benchmarks
 */
export function calculateTestScoreAndLevel(
  testDef: TestDefinition,
  rawValue: string,
  age = 12,
  gender: 'Male' | 'Female' = 'Male'
): { parsedNumeric: number; scorePercent: number; level: DevelopmentLevel; rating: string } {
  const clean = (rawValue || '').toString().trim();
  if (!clean) {
    return { parsedNumeric: 0, scorePercent: 0, level: 'Beginning', rating: 'Not Assessed' };
  }

  // 1. BMI Calculation
  if (testDef.id === 'bmi' || testDef.measurementType === 'composite_bmi') {
    const bmiVal = parseFitnessValue(clean);
    let scorePercent = 50;
    let level: DevelopmentLevel = 'Developing';
    let rating = 'Healthy Range';

    if (bmiVal <= 0) {
      return { parsedNumeric: 0, scorePercent: 0, level: 'Beginning', rating: 'Not Assessed' };
    }

    if (bmiVal >= 18.5 && bmiVal <= 24.9) {
      scorePercent = 88;
      level = 'Proficient';
      rating = 'Healthy Stature';
    } else if ((bmiVal >= 17.0 && bmiVal < 18.5) || (bmiVal > 24.9 && bmiVal <= 27.5)) {
      scorePercent = 70;
      level = 'Progressing';
      rating = bmiVal < 18.5 ? 'Developing Stature' : 'Active Growth Phase';
    } else if ((bmiVal >= 15.0 && bmiVal < 17.0) || (bmiVal > 27.5 && bmiVal <= 30.0)) {
      scorePercent = 55;
      level = 'Developing';
      rating = bmiVal < 17.0 ? 'Lower Stature Range' : 'Higher Stature Range';
    } else {
      scorePercent = 40;
      level = 'Beginning';
      rating = bmiVal < 15.0 ? 'Support Recommended' : 'Physical Activity Focus';
    }

    return { parsedNumeric: bmiVal, scorePercent, level, rating };
  }

  // 2. Rubric Calculations (1 to 4 or 1 to 5)
  if (testDef.measurementType === 'rubric' || testDef.direction === 'rubric') {
    const rubricVal = parseFloat(clean);
    if (!isNaN(rubricVal) && rubricVal >= 1 && rubricVal <= 5) {
      let scorePercent = 25;
      let level: DevelopmentLevel = 'Beginning';
      if (rubricVal >= 4) {
        scorePercent = 95;
        level = 'Advanced';
      } else if (rubricVal >= 3) {
        scorePercent = 75;
        level = 'Proficient';
      } else if (rubricVal >= 2) {
        scorePercent = 55;
        level = 'Progressing';
      } else if (rubricVal >= 1.5) {
        scorePercent = 40;
        level = 'Developing';
      } else {
        scorePercent = 25;
        level = 'Beginning';
      }
      return { parsedNumeric: rubricVal, scorePercent, level, rating: level };
    }
  }

  // 3. Time mm:ss (e.g. 600m or 800m run)
  if (testDef.measurementType === 'time_mm_ss' || clean.includes(':')) {
    const minutes = parseFitnessValue(clean);
    let scorePercent = 60;
    if (minutes > 0) {
      // 600m benchmarks: ~2.5m is great, >4.5m needs development
      if (minutes <= 2.5) scorePercent = 92;
      else if (minutes <= 3.2) scorePercent = 78;
      else if (minutes <= 4.0) scorePercent = 64;
      else if (minutes <= 5.0) scorePercent = 50;
      else scorePercent = 35;
    }
    const level = scoreToDevelopmentLevel(scorePercent);
    return { parsedNumeric: minutes, scorePercent, level, rating: level };
  }

  // 4. Standard Numeric (Sprint, sit reach, broad jump, pushups)
  const numVal = parseFitnessValue(clean);
  let scorePercent = 50;

  if (testDef.id.includes('sprint') || testDef.direction === 'lower_is_better') {
    // Sprints (lower is better)
    if (testDef.id === 'sprint_20m' || testDef.id === 'sprint_25m') {
      if (numVal <= 4.2) scorePercent = 90;
      else if (numVal <= 5.0) scorePercent = 78;
      else if (numVal <= 5.8) scorePercent = 65;
      else if (numVal <= 6.8) scorePercent = 50;
      else scorePercent = 35;
    } else if (testDef.id === 'sprint_50m') {
      if (numVal <= 7.5) scorePercent = 92;
      else if (numVal <= 8.5) scorePercent = 80;
      else if (numVal <= 9.8) scorePercent = 65;
      else if (numVal <= 11.2) scorePercent = 50;
      else scorePercent = 35;
    } else if (testDef.id === 'shuttle_4x10' || testDef.id.includes('shuttle')) {
      if (numVal <= 10.5) scorePercent = 90;
      else if (numVal <= 12.0) scorePercent = 78;
      else if (numVal <= 13.5) scorePercent = 65;
      else if (numVal <= 15.5) scorePercent = 50;
      else scorePercent = 35;
    } else if (testDef.id === 'flamingo') {
      // Stumble count in 60s
      if (numVal <= 2) scorePercent = 92;
      else if (numVal <= 5) scorePercent = 78;
      else if (numVal <= 9) scorePercent = 62;
      else if (numVal <= 14) scorePercent = 48;
      else scorePercent = 30;
    } else {
      scorePercent = Math.max(20, Math.min(95, 100 - (numVal * 5)));
    }
  } else {
    // Higher is better (sit reach, broad jump, plate tapping, pushups, curlups)
    if (testDef.id === 'sit_reach') {
      if (numVal >= 25) scorePercent = 92;
      else if (numVal >= 18) scorePercent = 80;
      else if (numVal >= 12) scorePercent = 65;
      else if (numVal >= 6) scorePercent = 50;
      else scorePercent = 35;
    } else if (testDef.id === 'broad_jump') {
      if (numVal >= 170) scorePercent = 92;
      else if (numVal >= 140) scorePercent = 78;
      else if (numVal >= 115) scorePercent = 65;
      else if (numVal >= 90) scorePercent = 50;
      else scorePercent = 35;
    } else if (testDef.id === 'plate_tapping') {
      if (numVal >= 35) scorePercent = 92;
      else if (numVal >= 28) scorePercent = 80;
      else if (numVal >= 22) scorePercent = 65;
      else if (numVal >= 16) scorePercent = 50;
      else scorePercent = 35;
    } else if (testDef.id === 'pushups' || testDef.id === 'curlups') {
      if (numVal >= 30) scorePercent = 92;
      else if (numVal >= 22) scorePercent = 78;
      else if (numVal >= 14) scorePercent = 64;
      else if (numVal >= 8) scorePercent = 50;
      else scorePercent = 35;
    } else {
      scorePercent = Math.max(25, Math.min(95, numVal * 2.5));
    }
  }

  const level = scoreToDevelopmentLevel(scorePercent);
  return { parsedNumeric: numVal, scorePercent, level, rating: level };
}

/**
 * Deterministically computes growth delta and trend between previous and current values
 */
export function calculateResultGrowth(
  testDef: TestDefinition,
  currentRaw: string,
  previousRaw?: string
): {
  changeDelta?: number;
  formattedChange?: string;
  trend: 'Improving' | 'Steady' | 'Needs Support' | 'Baseline established';
} {
  if (!previousRaw || previousRaw.trim() === '' || !currentRaw || currentRaw.trim() === '') {
    return { trend: 'Baseline established' };
  }

  const currentNum = parseFitnessValue(currentRaw);
  const previousNum = parseFitnessValue(previousRaw);

  if (previousNum === 0 && currentNum === 0) {
    return { trend: 'Baseline established' };
  }

  // Direction: lower is better (Sprints, Shuttle Run, Flamingo falls)
  if (testDef.direction === 'lower_is_better') {
    const rawDiff = previousNum - currentNum; // positive when current is smaller (better)
    const rounded = Math.round(rawDiff * 100) / 100;

    if (Math.abs(rounded) < 0.05) {
      return { changeDelta: 0, formattedChange: '0.0s (Steady)', trend: 'Steady' };
    }
    if (rounded > 0) {
      return {
        changeDelta: rounded,
        formattedChange: `-${Math.abs(rounded).toFixed(2)} ${testDef.unit} faster ⚡`,
        trend: 'Improving'
      };
    }
    return {
      changeDelta: rounded,
      formattedChange: `+${Math.abs(rounded).toFixed(2)} ${testDef.unit} (Needs support)`,
      trend: 'Needs Support'
    };
  }

  // Direction: rubric or higher is better
  const diff = currentNum - previousNum;
  const rounded = Math.round(diff * 10) / 10;

  if (Math.abs(rounded) < 0.2) {
    return { changeDelta: 0, formattedChange: 'No change (Steady)', trend: 'Steady' };
  }

  if (testDef.measurementType === 'rubric' || testDef.direction === 'rubric') {
    if (diff > 0) {
      return {
        changeDelta: diff,
        formattedChange: `+${Math.abs(Math.round(diff))} Level growth 📈`,
        trend: 'Improving'
      };
    }
    return {
      changeDelta: diff,
      formattedChange: `${diff} Level`,
      trend: 'Needs Support'
    };
  }

  if (diff > 0) {
    return {
      changeDelta: rounded,
      formattedChange: `+${rounded} ${testDef.unit} growth 📈`,
      trend: 'Improving'
    };
  }

  return {
    changeDelta: rounded,
    formattedChange: `${rounded} ${testDef.unit}`,
    trend: 'Needs Support'
  };
}

// =========================================================================
// 3. BMI HISTORICAL AGGREGATION (PRESERVING ALL DATA NEUTRALLY)
// =========================================================================

/**
 * Extracts and sorts all existing BMI measurements neutrally without medical risk terminology.
 */
export function extractNeutralBMIHistory(allStudentResults: FitnessResult[]): BMIDevelopmentPoint[] {
  const bmiResults = allStudentResults
    .filter(r => r.testId === 'bmi' || r.testName?.toLowerCase().includes('bmi'))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const points: BMIDevelopmentPoint[] = [];

  bmiResults.forEach(r => {
    const raw = (r.value || '').toString().trim();
    let weightKg: number | undefined;
    let heightCm: number | undefined;
    let bmiVal = 0;

    if (raw.includes('/') || raw.includes(',')) {
      const parts = raw.split(/[\/,]/).map(p => parseFloat(p.trim()));
      if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1]) && parts[0] > 0 && parts[1] > 0) {
        weightKg = parts[0];
        heightCm = parts[1];
        if (heightCm > 30) {
          const m = heightCm / 100;
          bmiVal = parseFloat((weightKg / (m * m)).toFixed(1));
        }
      }
    }

    if (bmiVal === 0) {
      bmiVal = parseFitnessValue(raw);
    }

    if (bmiVal > 0) {
      let statusLabel = 'Healthy Stature Range';
      if (bmiVal < 17.0) statusLabel = 'Developing Stature Range';
      else if (bmiVal >= 17.0 && bmiVal < 18.5) statusLabel = 'Active Growth Phase';
      else if (bmiVal >= 18.5 && bmiVal <= 24.9) statusLabel = 'Healthy Stature Range';
      else if (bmiVal > 24.9 && bmiVal <= 28.0) statusLabel = 'Active Strength Range';
      else statusLabel = 'Physical Activity Focus';

      points.push({
        date: r.date || new Date().toISOString().split('T')[0],
        term: r.term || 'Baseline',
        bmi: bmiVal,
        heightCm,
        weightKg,
        statusLabel
      });
    }
  });

  return points;
}

// =========================================================================
// 4. UNIFIED PHYSICAL DEVELOPMENT PROFILE AGGREGATOR
// =========================================================================

/**
 * Aggregates all existing and new results into the 6 Core Development Domains.
 * Existing assessment collections remain the unmodified source of truth.
 */
export function aggregatePhysicalDevelopmentProfile(
  student: Student,
  allStudentResults: FitnessResult[],
  interventions: InterventionRecord[] = []
): PhysicalDevelopmentProfile {
  const termsSet = new Set<string>();
  allStudentResults.forEach(r => {
    if (r.term) termsSet.add(r.term);
  });
  if (termsSet.size === 0) termsSet.add('Baseline');

  const termsOrder = ['Baseline', 'Term 1', 'Term 2', 'Term 3', 'Annual'];
  const allRecordedTerms = Array.from(termsSet).sort((a, b) => {
    const idxA = termsOrder.indexOf(a);
    const idxB = termsOrder.indexOf(b);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    return a.localeCompare(b);
  });

  const currentTerm = allRecordedTerms[allRecordedTerms.length - 1] || 'Baseline';
  const previousTerm = allRecordedTerms.length > 1 ? allRecordedTerms[allRecordedTerms.length - 2] : undefined;

  // Initialize 6 domains
  const domainResultsMap: Record<DevelopmentDomainId, CalculatedTestResult[]> = {
    fitness: [],
    movement_skills: [],
    sport_skills: [],
    participation: [],
    teamwork: [],
    personal_dev: []
  };

  // Group latest results by testId
  const latestByTestId = new Map<string, FitnessResult>();
  const previousByTestId = new Map<string, FitnessResult>();

  allStudentResults.forEach(r => {
    if (r.term === currentTerm || (!r.term && currentTerm === 'Baseline')) {
      latestByTestId.set(r.testId, r);
    } else if (previousTerm && r.term === previousTerm) {
      previousByTestId.set(r.testId, r);
    }
  });

  // Calculate results for all known test records
  latestByTestId.forEach((r, testId) => {
    const testDef = getTestDefinition(testId);
    const prevResult = previousByTestId.get(testId);
    const prevValue = prevResult?.value;

    const { parsedNumeric, scorePercent, level, rating } = calculateTestScoreAndLevel(
      testDef,
      r.value,
      student.age || 12,
      student.gender || 'Male'
    );

    const { changeDelta, formattedChange, trend } = calculateResultGrowth(
      testDef,
      r.value,
      prevValue
    );

    const calculatedItem: CalculatedTestResult = {
      testId,
      testName: r.testName || testDef.name,
      domain: testDef.domain,
      component: testDef.component,
      rawValue: r.value,
      parsedNumeric,
      unit: testDef.unit,
      direction: testDef.direction,
      term: r.term || currentTerm,
      date: r.date || new Date().toISOString().split('T')[0],
      level,
      scorePercent,
      previousValue: prevValue,
      previousNumeric: prevValue ? parseFitnessValue(prevValue) : undefined,
      changeDelta,
      formattedChange,
      trend,
      rating: r.rating || rating
    };

    domainResultsMap[testDef.domain].push(calculatedItem);
  });

  // Build domain scores
  const domains: Record<DevelopmentDomainId, DomainScore> = {} as any;
  let totalScoreSum = 0;
  let domainsWithDataCount = 0;

  (Object.keys(DOMAIN_METADATA) as DevelopmentDomainId[]).forEach(dId => {
    const items = domainResultsMap[dId];
    if (items.length > 0) {
      const avgScore = Math.round(items.reduce((acc, curr) => acc + curr.scorePercent, 0) / items.length);
      const level = scoreToDevelopmentLevel(avgScore);
      
      // Determine overall trend in domain
      const improvingCount = items.filter(i => i.trend === 'Improving').length;
      const needsSupportCount = items.filter(i => i.trend === 'Needs Support').length;
      let latestTrend: 'Improving' | 'Steady' | 'Needs Support' | 'Baseline established' = 'Baseline established';
      if (improvingCount > 0 && improvingCount >= needsSupportCount) latestTrend = 'Improving';
      else if (needsSupportCount > 0) latestTrend = 'Needs Support';
      else if (items.some(i => i.trend === 'Steady')) latestTrend = 'Steady';

      totalScoreSum += avgScore;
      domainsWithDataCount++;

      domains[dId] = {
        domainId: dId,
        domainName: DOMAIN_METADATA[dId].name,
        level,
        scorePercent: avgScore,
        testsCount: items.length,
        latestTrend,
        growthFromBaseline: items.some(i => i.changeDelta && i.changeDelta > 0) ? 8 : 0,
        evidenceSummary: `${items.length} assessment${items.length > 1 ? 's' : ''} evaluated across ${DOMAIN_METADATA[dId].name.toLowerCase()}.`,
        results: items
      };
    } else {
      // Default empty domain state
      domains[dId] = {
        domainId: dId,
        domainName: DOMAIN_METADATA[dId].name,
        level: 'Developing',
        scorePercent: 50,
        testsCount: 0,
        latestTrend: 'Baseline established',
        growthFromBaseline: 0,
        evidenceSummary: 'Baseline assessment pending for this domain.',
        results: []
      };
    }
  });

  const overallAvg = domainsWithDataCount > 0 ? Math.round(totalScoreSum / domainsWithDataCount) : 55;
  const overallLevel = scoreToDevelopmentLevel(overallAvg);

  const bmiHistory = extractNeutralBMIHistory(allStudentResults);
  const currentBMI = bmiHistory.length > 0 ? bmiHistory[bmiHistory.length - 1] : undefined;

  // Development focus suggestion
  const focusSuggestion = identifyDevelopmentFocusSuggestion(domains, student);

  const profile: PhysicalDevelopmentProfile = {
    studentId: student.id,
    studentName: student.name,
    grade: student.grade,
    section: student.section,
    gender: student.gender || 'Male',
    age: student.age || 12,
    schoolId: student.schoolId,
    teacherId: student.teacherId,
    academicYear: '2025-2026',
    currentTerm,
    overallLevel,
    overallGrowthScore: 6,
    domains,
    bmiHistory,
    currentBMI,
    developmentFocus: focusSuggestion,
    activeInterventions: interventions.filter(i => i.studentId === student.id),
    allRecordedTerms,
    lastAssessedDate: allStudentResults[0]?.date || new Date().toISOString().split('T')[0]
  };

  return profile;
}

/**
 * Deterministically identifies the primary development focus area needing supportive drills
 */
function identifyDevelopmentFocusSuggestion(
  domains: Record<DevelopmentDomainId, DomainScore>,
  student: Student
): DevelopmentFocusSuggestion | undefined {
  // Find domain with lowest score percent and at least some evidence or pending growth
  const domainEntries = Object.entries(domains) as [DevelopmentDomainId, DomainScore][];
  const sorted = domainEntries
    .filter(([_, score]) => score.testsCount > 0)
    .sort((a, b) => a[1].scorePercent - b[1].scorePercent);

  if (sorted.length === 0) {
    return {
      domainId: 'movement_skills',
      domainName: 'Movement Skills',
      component: 'Fundamental Locomotor Coordination',
      currentLevel: 'Developing',
      evidence: 'Baseline physical assessment suggested to establish individual trajectory.',
      suggestedGoal: 'Establish foundational agility and movement confidence.',
      suggestedStrategy: '10-minute structured agility ladder and balance games twice weekly.',
      suggestedFrequency: '2 times per week',
      suggestedDuration: '4 weeks'
    };
  }

  const lowest = sorted[0];
  const domainId = lowest[0];
  const domainScore = lowest[1];

  let component = 'Agility & Coordination';
  let suggestedGoal = 'Enhance movement efficiency and consistency.';
  let suggestedStrategy = 'Small-group progressive drills with focused feedback.';

  if (domainId === 'fitness') {
    component = 'Aerobic Endurance & Flexibility';
    suggestedGoal = 'Gradually build cardiorespiratory endurance and lower-lumbar mobility.';
    suggestedStrategy = 'Paced interval jogging games, shuttle runs, and structured dynamic stretching.';
  } else if (domainId === 'movement_skills') {
    component = 'Balance & Change of Direction';
    suggestedGoal = 'Improve spatial balance, deceleration control, and quick direction shifts.';
    suggestedStrategy = 'Cone zig-zag drills, single-leg hopscotch, and reactive movement games.';
  } else if (domainId === 'sport_skills') {
    component = 'Ball Control & Passing Accuracy';
    suggestedGoal = 'Develop consistent ball reception and target delivery under low pressure.';
    suggestedStrategy = 'Paired partner passing routines and 3v1 possession games.';
  } else if (domainId === 'participation') {
    component = 'Active Engagement & Warm-up Effort';
    suggestedGoal = 'Boost continuous enthusiasm and participation during activity stations.';
    suggestedStrategy = 'Assign peer buddy roles and rotating station captain responsibilities.';
  } else if (domainId === 'teamwork') {
    component = 'Court Communication & Fair Play';
    suggestedGoal = 'Promote positive calling, teammate encouragement, and structured collaboration.';
    suggestedStrategy = 'Cooperative small-team challenges and reflective huddles.';
  } else {
    component = 'Persistence & Goal Setting';
    suggestedGoal = 'Build self-confidence and personal determination during skill attempts.';
    suggestedStrategy = 'Individual milestone tracking and positive reinforcement.';
  }

  return {
    domainId,
    domainName: domainScore.domainName,
    component,
    currentLevel: domainScore.level,
    evidence: `Lowest relative score in ${domainScore.domainName} (${domainScore.scorePercent}% • ${domainScore.level}).`,
    suggestedGoal,
    suggestedStrategy,
    suggestedFrequency: '2 times per week',
    suggestedDuration: '4 weeks'
  };
}

// =========================================================================
// 5. INTERVENTION & REASSESSMENT PERSISTENCE
// =========================================================================

const LOCAL_INTERVENTIONS_KEY = 'smartpe_interventions_data';

export const physicalDevelopmentStorage = {
  saveIntervention: async (intervention: InterventionRecord) => {
    try {
      const stored = localStorage.getItem(LOCAL_INTERVENTIONS_KEY) || '[]';
      const parsed: InterventionRecord[] = JSON.parse(stored);
      const updated = [intervention, ...parsed.filter(i => i.id !== intervention.id)];
      localStorage.setItem(LOCAL_INTERVENTIONS_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn("Local intervention write error:", e);
    }

    if (typeof navigator === 'undefined' || navigator.onLine) {
      try {
        await setDoc(doc(db, 'interventions', intervention.id), intervention, { merge: true });
      } catch (err) {
        console.warn("Firestore intervention save note (cached locally):", err);
      }
    }
  },

  getInterventions: async (studentId?: string, schoolId?: string): Promise<InterventionRecord[]> => {
    let list: InterventionRecord[] = [];
    try {
      const stored = localStorage.getItem(LOCAL_INTERVENTIONS_KEY);
      if (stored) {
        list = JSON.parse(stored);
      }
    } catch (e) {}

    if (typeof navigator === 'undefined' || navigator.onLine) {
      try {
        let q;
        if (studentId) {
          q = query(collection(db, 'interventions'), where('studentId', '==', studentId));
        } else if (schoolId) {
          q = query(collection(db, 'interventions'), where('schoolId', '==', schoolId));
        } else {
          q = query(collection(db, 'interventions'));
        }
        const snap = await getDocs(q);
        const remote = snap.docs.map(d => d.data() as InterventionRecord);
        if (remote.length > 0) {
          list = remote;
          localStorage.setItem(LOCAL_INTERVENTIONS_KEY, JSON.stringify(remote));
        }
      } catch (e) {}
    }

    if (studentId) {
      return list.filter(i => i.studentId === studentId);
    }
    return list;
  },

  deleteIntervention: async (id: string) => {
    try {
      const stored = localStorage.getItem(LOCAL_INTERVENTIONS_KEY) || '[]';
      const parsed: InterventionRecord[] = JSON.parse(stored);
      const filtered = parsed.filter(i => i.id !== id);
      localStorage.setItem(LOCAL_INTERVENTIONS_KEY, JSON.stringify(filtered));
    } catch (e) {}

    try {
      await deleteDoc(doc(db, 'interventions', id));
    } catch (e) {}
  }
};
