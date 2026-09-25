import { storageService } from './storageService';

export type CoachProgramType = 'school_team' | 'after_school_academy' | 'sports_club' | 'individual_coach';
export type AgeBracket = 'U-8' | 'U-10' | 'U-12' | 'U-14' | 'U-16' | 'U-18';
export type AssessmentCycle = 'baseline' | 'midterm' | 'summative' | 'monthly';
export type SkillTier = 'Novice' | 'Developing' | 'Proficient' | 'Advanced' | 'Elite';

export interface AgeNorm {
  novice: number;
  developing: number;
  proficient: number;
  advanced: number;
  elite: number;
  lowerIsBetter?: boolean;
}

export interface SkillDefinition {
  id: string;
  name: string;
  category: 'technical' | 'tactical' | 'physical' | 'mental';
  unit: string;
  testType: 'time' | 'count' | 'accuracy' | 'rating';
  description: string;
  protocol: string;
  equipment: string[];
  coneSetup?: string;
  ageNorms: Record<AgeBracket, AgeNorm>;
  defaultScore: number;
}

export interface CorrectiveDrill {
  skillId: string;
  drillName: string;
  triggerCondition: string;
  focus: string;
  description: string;
  weeklyFrequency: string;
  intensity: string;
}

export interface SportDefinition {
  id: string;
  name: string;
  tagline: string;
  iconName: string;
  governingBody: string;
  color: string;
  ageBrackets: AgeBracket[];
  skills: SkillDefinition[];
  correctiveDrills: CorrectiveDrill[];
  gameSenseRubric: {
    title: string;
    description: string;
    levels: { score: number; label: string; behavioralAnchor: string }[];
  };
}

export interface AthleteProfile {
  id: string;
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  sport: string;
  programType: CoachProgramType;
  squadOrBatch: string;
  jerseyNo?: string;
  guardianName?: string;
  guardianContact?: string;
  notes?: string;
  joiningDate: string;
}

export interface AssessmentRecord {
  id: string;
  athleteId: string;
  sportId: string;
  cycleType: AssessmentCycle;
  cycleNumber: number;
  testDate: string;
  ageBracket: AgeBracket;
  coachName: string;
  programName: string;
  scores: Record<string, number>;
  pillarAverages: {
    technical: number;
    tactical: number;
    physical: number;
    mental: number;
  };
  overallScore: number;
  overallTier: SkillTier;
  strengths: string[];
  growthAreas: string[];
  coachFeedback: string;
  prescribedDrills: {
    drillName: string;
    focus: string;
    frequency: string;
    description: string;
  }[];
}

export const SPORTS_REGISTRY: Record<string, SportDefinition> = {
  football: {
    id: 'football',
    name: 'Football (Soccer)',
    tagline: 'FIFA & UEFA Grassroots to Youth Development Standard',
    iconName: 'Activity',
    governingBody: 'FIFA / AIFF / UEFA Grassroots Framework',
    color: '#10B981',
    ageBrackets: ['U-8', 'U-10', 'U-12', 'U-14', 'U-16', 'U-18'],
    skills: [
      {
        id: 'fb_dribble_slalom',
        name: 'Slalom Dribble & Ball Control',
        category: 'technical',
        unit: 'seconds',
        testType: 'time',
        description: 'Timed weaving through 6 cones spaced 2 meters apart, turning around end cone and returning.',
        protocol: 'Player starts behind line with ball, weaves through 6 cones (2m apart), loops around the 6th cone and weaves back. Timer stops on crossing start line.',
        equipment: ['6 Cones', 'Size 4/5 Football', 'Stopwatch'],
        coneSetup: '6 cones in straight line with 2.0m spacing',
        defaultScore: 14.5,
        ageNorms: {
          'U-8': { novice: 24, developing: 20, proficient: 17, advanced: 14.5, elite: 12.5, lowerIsBetter: true },
          'U-10': { novice: 21, developing: 17.5, proficient: 15, advanced: 13, elite: 11.2, lowerIsBetter: true },
          'U-12': { novice: 18, developing: 15.5, proficient: 13.5, advanced: 11.8, elite: 10.2, lowerIsBetter: true },
          'U-14': { novice: 16, developing: 14, proficient: 12.2, advanced: 10.8, elite: 9.4, lowerIsBetter: true },
          'U-16': { novice: 14.5, developing: 12.8, proficient: 11.2, advanced: 9.9, elite: 8.8, lowerIsBetter: true },
          'U-18': { novice: 13.5, developing: 11.9, proficient: 10.5, advanced: 9.3, elite: 8.2, lowerIsBetter: true }
        }
      },
      {
        id: 'fb_target_passing',
        name: 'Target Passing & First Touch',
        category: 'technical',
        unit: 'hits / 10',
        testType: 'accuracy',
        description: 'Passing through 1-meter target gates from varying distances (10m - 20m based on age).',
        protocol: '10 passes attempted alternately using dominant and non-dominant foot into designated 1.0m target mini-goal.',
        equipment: ['2 Mini Target Gates / Cones', '10 Balls', 'Marking Tape'],
        defaultScore: 6,
        ageNorms: {
          'U-8': { novice: 2, developing: 4, proficient: 6, advanced: 8, elite: 9 },
          'U-10': { novice: 3, developing: 5, proficient: 7, advanced: 8, elite: 10 },
          'U-12': { novice: 4, developing: 6, proficient: 7, advanced: 9, elite: 10 },
          'U-14': { novice: 4, developing: 6, proficient: 8, advanced: 9, elite: 10 },
          'U-16': { novice: 5, developing: 7, proficient: 8, advanced: 9, elite: 10 },
          'U-18': { novice: 6, developing: 7, proficient: 9, advanced: 10, elite: 10 }
        }
      },
      {
        id: 'fb_shooting_accuracy',
        name: 'Shooting & Finishing Precision',
        category: 'technical',
        unit: 'goals / 10',
        testType: 'accuracy',
        description: 'Striking rolling balls from edge of penalty box into target quadrants (top and bottom corners).',
        protocol: '10 strikes from designated shooting line into target corners. 1 point for on target, 2 points for corner pocket.',
        equipment: ['Full/Mini Goal with corner targets', 'Balls'],
        defaultScore: 5,
        ageNorms: {
          'U-8': { novice: 2, developing: 4, proficient: 6, advanced: 7, elite: 9 },
          'U-10': { novice: 3, developing: 5, proficient: 6, advanced: 8, elite: 9 },
          'U-12': { novice: 3, developing: 5, proficient: 7, advanced: 8, elite: 10 },
          'U-14': { novice: 4, developing: 6, proficient: 7, advanced: 9, elite: 10 },
          'U-16': { novice: 5, developing: 7, proficient: 8, advanced: 9, elite: 10 },
          'U-18': { novice: 5, developing: 7, proficient: 9, advanced: 10, elite: 10 }
        }
      },
      {
        id: 'fb_juggling_mastery',
        name: 'Ball Mastery & Juggling Control',
        category: 'technical',
        unit: 'reps in 60s',
        testType: 'count',
        description: 'Maximum consecutive aerial juggles using feet, thighs, and head without ball touching ground.',
        protocol: '60-second trial. Player juggles continuously. Highest consecutive streak is recorded.',
        equipment: ['Standard Football', 'Flat surface'],
        defaultScore: 25,
        ageNorms: {
          'U-8': { novice: 3, developing: 6, proficient: 12, advanced: 25, elite: 40 },
          'U-10': { novice: 5, developing: 12, proficient: 25, advanced: 50, elite: 80 },
          'U-12': { novice: 10, developing: 25, proficient: 50, advanced: 90, elite: 140 },
          'U-14': { novice: 20, developing: 45, proficient: 80, advanced: 130, elite: 200 },
          'U-16': { novice: 35, developing: 70, proficient: 110, advanced: 170, elite: 250 },
          'U-18': { novice: 45, developing: 85, proficient: 130, advanced: 200, elite: 300 }
        }
      },
      {
        id: 'fb_game_sense',
        name: 'Tactical Game Sense & Spatial Decision',
        category: 'tactical',
        unit: 'rating / 10',
        testType: 'rating',
        description: 'Evaluation in 3v3 / 5v5 small-sided games: Spatial awareness, off-ball movement, anticipation, and 1v1 decision-making.',
        protocol: 'Coach assesses during 15-minute conditioned match play against standardized rubric.',
        equipment: ['Small Sided Pitch', 'Bibs'],
        defaultScore: 7,
        ageNorms: {
          'U-8': { novice: 3, developing: 5, proficient: 7, advanced: 8.5, elite: 10 },
          'U-10': { novice: 3, developing: 5, proficient: 7, advanced: 8.5, elite: 10 },
          'U-12': { novice: 3.5, developing: 5.5, proficient: 7, advanced: 8.5, elite: 10 },
          'U-14': { novice: 4, developing: 6, proficient: 7.5, advanced: 9, elite: 10 },
          'U-16': { novice: 4, developing: 6, proficient: 7.5, advanced: 9, elite: 10 },
          'U-18': { novice: 5, developing: 6.5, proficient: 8, advanced: 9.5, elite: 10 }
        }
      },
      {
        id: 'fb_sprint_agility',
        name: '20m Acceleration & Change of Direction',
        category: 'physical',
        unit: 'seconds',
        testType: 'time',
        description: '20m straight sprint with a 5m deceleration turn.',
        protocol: 'Player sprints 20m from static athletic start. Stop timing at 20m finish line.',
        equipment: ['Cones', 'Timing gates / Stopwatch'],
        defaultScore: 3.5,
        ageNorms: {
          'U-8': { novice: 5.2, developing: 4.6, proficient: 4.1, advanced: 3.7, elite: 3.3, lowerIsBetter: true },
          'U-10': { novice: 4.8, developing: 4.2, proficient: 3.8, advanced: 3.4, elite: 3.1, lowerIsBetter: true },
          'U-12': { novice: 4.3, developing: 3.9, proficient: 3.5, advanced: 3.2, elite: 2.9, lowerIsBetter: true },
          'U-14': { novice: 3.9, developing: 3.5, proficient: 3.2, advanced: 2.95, elite: 2.75, lowerIsBetter: true },
          'U-16': { novice: 3.6, developing: 3.25, proficient: 2.98, advanced: 2.80, elite: 2.62, lowerIsBetter: true },
          'U-18': { novice: 3.4, developing: 3.10, proficient: 2.85, advanced: 2.70, elite: 2.52, lowerIsBetter: true }
        }
      },
      {
        id: 'fb_coachability',
        name: 'Coachability & Work Ethic',
        category: 'mental',
        unit: 'rating / 10',
        testType: 'rating',
        description: 'Attitude to feedback, sportsmanship, defensive recovery commitment, and communication with teammates.',
        protocol: 'Observation across warm-up, drills, match play, and post-session review.',
        equipment: ['Checklist'],
        defaultScore: 8,
        ageNorms: {
          'U-8': { novice: 4, developing: 6, proficient: 7.5, advanced: 9, elite: 10 },
          'U-10': { novice: 4, developing: 6, proficient: 7.5, advanced: 9, elite: 10 },
          'U-12': { novice: 4.5, developing: 6.5, proficient: 8, advanced: 9, elite: 10 },
          'U-14': { novice: 5, developing: 7, proficient: 8, advanced: 9.5, elite: 10 },
          'U-16': { novice: 5, developing: 7, proficient: 8.5, advanced: 9.5, elite: 10 },
          'U-18': { novice: 5.5, developing: 7.5, proficient: 8.5, advanced: 9.5, elite: 10 }
        }
      }
    ],
    correctiveDrills: [
      {
        skillId: 'fb_dribble_slalom',
        drillName: 'Figure-8 Tight Cone Weave + Sole Rollouts',
        triggerCondition: 'Dribbling slalom is in Novice or Developing tier',
        focus: 'Close ball control, ankle fluidity, and using inside/outside edges of both feet.',
        description: 'Set 2 cones 1.5m apart. Player completes figure-8 loops using right foot only (10 reps), left foot only (10 reps), then alternating sole rolls.',
        weeklyFrequency: '3 sessions/week, 12 mins per session',
        intensity: 'Moderate-High speed with focus on zero ball separation'
      },
      {
        skillId: 'fb_target_passing',
        drillName: '2-Touch Wall Rebound & Gate Sniping',
        triggerCondition: 'Passing accuracy below 70%',
        focus: 'Open body shape, locked ankle, firm weighted pass, and directional first touch.',
        description: 'Stand 5m from flat rebound board/wall with two mini-cones as a 1m gate. Strike into wall, receive across body on touch 1, pass back through gate on touch 2.',
        weeklyFrequency: '4 sessions/week, 100 reps per day',
        intensity: 'High technical focus'
      },
      {
        skillId: 'fb_shooting_accuracy',
        drillName: 'Corner Pocket Precision Finishing from Rolling Feed',
        triggerCondition: 'Shooting accuracy below 60%',
        focus: 'Plant foot pointing to target, knee over ball, striking with laces vs instep curve.',
        description: 'Partner rolls ball across top of penalty box. Striker approaches dynamically, targets bottom-right or bottom-left corner with low driven strikes.',
        weeklyFrequency: '2 sessions/week, 30 strikes per session',
        intensity: 'Match tempo'
      },
      {
        skillId: 'fb_game_sense',
        drillName: '3v1 & 4v2 Rondo with Split Pass Rule',
        triggerCondition: 'Game sense rating <= 6/10',
        focus: 'Head scanning (looking over shoulder before receiving), body orientation, creating passing angles.',
        description: 'In an 8x8m box, 4 perimeter players keep possession against 2 defenders in center. Bonus point for passing through the two defenders (split pass).',
        weeklyFrequency: 'Every team session, 15 mins warmup',
        intensity: 'High cognitive load'
      }
    ],
    gameSenseRubric: {
      title: 'FIFA Grassroots Game Sense Rubric',
      description: 'Standardized evaluation of match intelligence in small-sided play.',
      levels: [
        { score: 2, label: 'Novice', behavioralAnchor: 'Ball watching, static positioning, panics under light pressure.' },
        { score: 5, label: 'Developing', behavioralAnchor: 'Moves toward ball, makes safe backwards passes, looks up occasionally.' },
        { score: 7, label: 'Proficient', behavioralAnchor: 'Scans before receiving, creates triangles for teammates, supports off-ball.' },
        { score: 9, label: 'Advanced', behavioralAnchor: 'Anticipates turnovers, executes progressive passes, controls game tempo.' },
        { score: 10, label: 'Elite', behavioralAnchor: 'Dominates spatial transitions, orchestrates teammates, clinical decision making.' }
      ]
    }
  },

  basketball: {
    id: 'basketball',
    name: 'Basketball',
    tagline: 'FIBA / NBA Youth Skill Assessment Standard',
    iconName: 'Target',
    governingBody: 'FIBA / Jr. NBA / BFI Guidelines',
    color: '#F59E0B',
    ageBrackets: ['U-8', 'U-10', 'U-12', 'U-14', 'U-16', 'U-18'],
    skills: [
      {
        id: 'bb_control_dribble',
        name: 'Full Court Speed Dribble & Crossover',
        category: 'technical',
        unit: 'seconds',
        testType: 'time',
        description: 'Zig-zag dribbling through 5 cone stations with crossover, between-the-legs, and spin changes.',
        protocol: 'Player navigates 28m court across 5 cone markers, executing designated dribble move at each cone, finishing with a layup.',
        equipment: ['5 Cones', 'Basketball (Size 5/6/7)', 'Stopwatch'],
        defaultScore: 16.0,
        ageNorms: {
          'U-8': { novice: 26, developing: 22, proficient: 18.5, advanced: 16, elite: 14, lowerIsBetter: true },
          'U-10': { novice: 23, developing: 19, proficient: 16.2, advanced: 14, elite: 12.5, lowerIsBetter: true },
          'U-12': { novice: 20, developing: 16.5, proficient: 14.2, advanced: 12.5, elite: 11.2, lowerIsBetter: true },
          'U-14': { novice: 18, developing: 15, proficient: 13, advanced: 11.5, elite: 10.2, lowerIsBetter: true },
          'U-16': { novice: 16.5, developing: 13.8, proficient: 12.1, advanced: 10.8, elite: 9.6, lowerIsBetter: true },
          'U-18': { novice: 15.2, developing: 12.9, proficient: 11.4, advanced: 10.1, elite: 9.1, lowerIsBetter: true }
        }
      },
      {
        id: 'bb_spot_shooting',
        name: 'Spot Shooting & Free Throw Consistency',
        category: 'technical',
        unit: 'baskets / 10',
        testType: 'accuracy',
        description: '10 shots taken from 5 perimeter spots (corners, wings, free-throw line).',
        protocol: '2 shots from each of 5 designated floor spots within 45 seconds.',
        equipment: ['Regulation Basket', 'Balls', 'Floor Markers'],
        defaultScore: 5,
        ageNorms: {
          'U-8': { novice: 2, developing: 4, proficient: 5, advanced: 7, elite: 8 },
          'U-10': { novice: 2, developing: 4, proficient: 6, advanced: 7, elite: 9 },
          'U-12': { novice: 3, developing: 5, proficient: 6, advanced: 8, elite: 9 },
          'U-14': { novice: 3, developing: 5, proficient: 7, advanced: 8, elite: 10 },
          'U-16': { novice: 4, developing: 6, proficient: 7, advanced: 9, elite: 10 },
          'U-18': { novice: 4, developing: 6, proficient: 8, advanced: 9, elite: 10 }
        }
      },
      {
        id: 'bb_passing_accuracy',
        name: 'Chest & Bounce Pass Wall Target Test',
        category: 'technical',
        unit: 'passes in 30s',
        testType: 'count',
        description: 'Continuous rapid chest and bounce passes against a 60cm target square from 3 meters.',
        protocol: 'Player stands behind 3m line and makes maximum accurate passes inside target square in 30 seconds.',
        equipment: ['Target Wall with 60cm square', 'Stopwatch', 'Ball'],
        defaultScore: 22,
        ageNorms: {
          'U-8': { novice: 10, developing: 14, proficient: 18, advanced: 23, elite: 28 },
          'U-10': { novice: 13, developing: 17, proficient: 22, advanced: 27, elite: 32 },
          'U-12': { novice: 16, developing: 21, proficient: 26, advanced: 31, elite: 37 },
          'U-14': { novice: 19, developing: 24, proficient: 30, advanced: 35, elite: 42 },
          'U-16': { novice: 22, developing: 28, proficient: 34, advanced: 40, elite: 47 },
          'U-18': { novice: 25, developing: 31, proficient: 37, advanced: 43, elite: 50 }
        }
      },
      {
        id: 'bb_court_vision',
        name: 'Court Vision & 3v3 Tactical IQ',
        category: 'tactical',
        unit: 'rating / 10',
        testType: 'rating',
        description: 'Read-and-react offensive spacing, backdoor cuts, defensive box-out, and help-and-recover rotations.',
        protocol: '10-minute conditioned half-court 3v3 game evaluated by coach.',
        equipment: ['Half Court', 'Bibs'],
        defaultScore: 7,
        ageNorms: {
          'U-8': { novice: 3, developing: 5, proficient: 7, advanced: 8.5, elite: 10 },
          'U-10': { novice: 3, developing: 5, proficient: 7, advanced: 8.5, elite: 10 },
          'U-12': { novice: 3.5, developing: 5.5, proficient: 7, advanced: 8.5, elite: 10 },
          'U-14': { novice: 4, developing: 6, proficient: 7.5, advanced: 9, elite: 10 },
          'U-16': { novice: 4, developing: 6.5, proficient: 8, advanced: 9.5, elite: 10 },
          'U-18': { novice: 5, developing: 7, proficient: 8.5, advanced: 9.5, elite: 10 }
        }
      },
      {
        id: 'bb_lane_agility',
        name: 'Lane Agility & Lateral Slide Test',
        category: 'physical',
        unit: 'seconds',
        testType: 'time',
        description: 'NBA combine standard: Sprinting, defensive sliding, and backpedaling around free-throw lane key.',
        protocol: 'Start at baseline corner of key, sprint up, slide across free throw line, backpedal down, slide back to start.',
        equipment: ['Key Marking', 'Stopwatch'],
        defaultScore: 13.5,
        ageNorms: {
          'U-8': { novice: 22, developing: 19, proficient: 16.5, advanced: 14.5, elite: 13, lowerIsBetter: true },
          'U-10': { novice: 20, developing: 17, proficient: 15, advanced: 13.2, elite: 11.8, lowerIsBetter: true },
          'U-12': { novice: 17.5, developing: 15.2, proficient: 13.4, advanced: 12, elite: 10.8, lowerIsBetter: true },
          'U-14': { novice: 15.8, developing: 13.9, proficient: 12.3, advanced: 11.1, elite: 10.0, lowerIsBetter: true },
          'U-16': { novice: 14.5, developing: 12.8, proficient: 11.4, advanced: 10.4, elite: 9.4, lowerIsBetter: true },
          'U-18': { novice: 13.8, developing: 12.1, proficient: 10.8, advanced: 9.8, elite: 8.9, lowerIsBetter: true }
        }
      },
      {
        id: 'bb_coachability',
        name: 'Defensive Intensity & Coachability',
        category: 'mental',
        unit: 'rating / 10',
        testType: 'rating',
        description: 'Defensive hustle, boxing out, verbal communication on switches, and positive bench energy.',
        protocol: 'Observation across drills and competitive play.',
        equipment: ['Checklist'],
        defaultScore: 8,
        ageNorms: {
          'U-8': { novice: 4, developing: 6, proficient: 7.5, advanced: 9, elite: 10 },
          'U-10': { novice: 4, developing: 6, proficient: 7.5, advanced: 9, elite: 10 },
          'U-12': { novice: 4.5, developing: 6.5, proficient: 8, advanced: 9, elite: 10 },
          'U-14': { novice: 5, developing: 7, proficient: 8, advanced: 9.5, elite: 10 },
          'U-16': { novice: 5, developing: 7, proficient: 8.5, advanced: 9.5, elite: 10 },
          'U-18': { novice: 5.5, developing: 7.5, proficient: 8.5, advanced: 9.5, elite: 10 }
        }
      }
    ],
    correctiveDrills: [
      {
        skillId: 'bb_control_dribble',
        drillName: 'Two-Ball Simultaneous & Alternating Pound Dribble',
        triggerCondition: 'Dribbling agility is in Developing or Novice tier',
        focus: 'Off-hand dexterity, fingertips control without looking down at ball.',
        description: 'Dribble two basketballs simultaneously at knee height (60s), waist height (60s), alternating rhythm (60s), and high-low crossovers.',
        weeklyFrequency: '4 days/week, 10 mins before practice',
        intensity: 'High rhythm focus'
      },
      {
        skillId: 'bb_spot_shooting',
        drillName: 'BEEF Mechanics + 1-Hand Form Shooting from 3 Feet',
        triggerCondition: 'Shooting percentage below 50%',
        focus: 'Balance, Elbow under ball, Eyes on rim, Follow-through with high goose-neck wrist snap.',
        description: 'Stand 1 meter from basket. Shoot with shooting hand only (guide hand behind back). Make 20 swishes before stepping back 1 meter.',
        weeklyFrequency: 'Daily warm-up, 50 makes',
        intensity: 'Slow, precise biomechanical groove'
      }
    ],
    gameSenseRubric: {
      title: 'FIBA Youth Game Intelligence Rubric',
      description: 'Assesses court spacing, passing reads, and defensive rotation.',
      levels: [
        { score: 2, label: 'Novice', behavioralAnchor: 'Crowds ball handler, loses player on defense, misses open passing lanes.' },
        { score: 5, label: 'Developing', behavioralAnchor: 'Maintains basic wing spacing, attempts chest passes, slow to rotate on defense.' },
        { score: 7, label: 'Proficient', behavioralAnchor: 'Executes pass-and-cut, communicates on screens, plays solid on-ball defense.' },
        { score: 9, label: 'Advanced', behavioralAnchor: 'Creates driving lanes for teammates, anticipates passes for steals, high-IQ shot selection.' },
        { score: 10, label: 'Elite', behavioralAnchor: 'Commanding floor general, manipulates defense with eyes, elite tempo control.' }
      ]
    }
  },

  cricket: {
    id: 'cricket',
    name: 'Cricket',
    tagline: 'ICC & BCCI Long-Term Player Development Framework',
    iconName: 'Trophy',
    governingBody: 'ICC / BCCI / National Cricket Academy (NCA)',
    color: '#3B82F6',
    ageBrackets: ['U-8', 'U-10', 'U-12', 'U-14', 'U-16', 'U-18'],
    skills: [
      {
        id: 'ck_batting_technique',
        name: 'Batting Technique & Shot Execution',
        category: 'technical',
        unit: 'rating / 10',
        testType: 'rating',
        description: 'Evaluation of grip, stance, backlift, front-foot drive, back-foot defense, and pull shot against throwdowns.',
        protocol: '15 throwdowns across full and short lengths. Assessed for head over ball, balance, high elbow, and clean timing.',
        equipment: ['Bat', 'Pads / Helmet', 'Balls', 'Throwdown device'],
        defaultScore: 7,
        ageNorms: {
          'U-8': { novice: 3, developing: 5, proficient: 7, advanced: 8.5, elite: 10 },
          'U-10': { novice: 3, developing: 5, proficient: 7, advanced: 8.5, elite: 10 },
          'U-12': { novice: 3.5, developing: 5.5, proficient: 7, advanced: 8.5, elite: 10 },
          'U-14': { novice: 4, developing: 6, proficient: 7.5, advanced: 9, elite: 10 },
          'U-16': { novice: 4.5, developing: 6.5, proficient: 8, advanced: 9.5, elite: 10 },
          'U-18': { novice: 5, developing: 7, proficient: 8.5, advanced: 9.5, elite: 10 }
        }
      },
      {
        id: 'ck_bowling_accuracy',
        name: 'Bowling Line & Length Target Pitching',
        category: 'technical',
        unit: 'target hits / 12',
        testType: 'accuracy',
        description: 'Bowler delivers 12 legal deliveries aiming at a 1m x 1m Good Length target mat on off-stump channel.',
        protocol: '12 balls bowled from regulation pitch distance (16m - 20.12m based on age). 1 point for pitching inside target zone.',
        equipment: ['Target Mat (1m x 1m)', 'Stumps', 'Cricket balls'],
        defaultScore: 6,
        ageNorms: {
          'U-8': { novice: 2, developing: 4, proficient: 6, advanced: 8, elite: 10 },
          'U-10': { novice: 2, developing: 4, proficient: 6, advanced: 8, elite: 11 },
          'U-12': { novice: 3, developing: 5, proficient: 7, advanced: 9, elite: 11 },
          'U-14': { novice: 3, developing: 5, proficient: 8, advanced: 10, elite: 12 },
          'U-16': { novice: 4, developing: 6, proficient: 8, advanced: 10, elite: 12 },
          'U-18': { novice: 4, developing: 7, proficient: 9, advanced: 11, elite: 12 }
        }
      },
      {
        id: 'ck_fielding_direct_hit',
        name: 'Ground Fielding & Direct Hit Throwing',
        category: 'technical',
        unit: 'stump hits / 10',
        testType: 'accuracy',
        description: 'Attacking a rolling ball at cover/midwicket, pick up on the run and throw at a single stump from 20 meters.',
        protocol: '10 repetitions. Player charges in, picks up cleanly with dominant hand, releases under balance targeting single stump.',
        equipment: ['1 Stump', 'Balls', 'Measuring tape'],
        defaultScore: 4,
        ageNorms: {
          'U-8': { novice: 1, developing: 2, proficient: 4, advanced: 6, elite: 8 },
          'U-10': { novice: 1, developing: 3, proficient: 5, advanced: 7, elite: 8 },
          'U-12': { novice: 2, developing: 4, proficient: 5, advanced: 7, elite: 9 },
          'U-14': { novice: 2, developing: 4, proficient: 6, advanced: 8, elite: 9 },
          'U-16': { novice: 3, developing: 5, proficient: 7, advanced: 8, elite: 10 },
          'U-18': { novice: 3, developing: 5, proficient: 7, advanced: 9, elite: 10 }
        }
      },
      {
        id: 'ck_match_iq',
        name: 'Match Sense & Strike Rotation',
        category: 'tactical',
        unit: 'rating / 10',
        testType: 'rating',
        description: 'Calling for runs, finding gaps, setting intelligent field placements, and bowling to match situation.',
        protocol: 'Evaluated during middle-practice match simulation.',
        equipment: ['Match gear'],
        defaultScore: 7,
        ageNorms: {
          'U-8': { novice: 3, developing: 5, proficient: 7, advanced: 8.5, elite: 10 },
          'U-10': { novice: 3, developing: 5, proficient: 7, advanced: 8.5, elite: 10 },
          'U-12': { novice: 3.5, developing: 5.5, proficient: 7, advanced: 8.5, elite: 10 },
          'U-14': { novice: 4, developing: 6, proficient: 7.5, advanced: 9, elite: 10 },
          'U-16': { novice: 4.5, developing: 6.5, proficient: 8, advanced: 9.5, elite: 10 },
          'U-18': { novice: 5, developing: 7, proficient: 8.5, advanced: 9.5, elite: 10 }
        }
      },
      {
        id: 'ck_shuttle_speed',
        name: '2x18m Running Between Wickets Sprint',
        category: 'physical',
        unit: 'seconds',
        testType: 'time',
        description: 'Sprint 2 runs between batting creases in full protective gear with bat grounded over line on turn.',
        protocol: 'Start from batting stance, sprint to opposite crease, slide bat past line, turn 180° and sprint back.',
        equipment: ['Pads, Gloves, Helmet, Bat', '22 Yards Pitch / 18m Creases', 'Stopwatch'],
        defaultScore: 7.8,
        ageNorms: {
          'U-8': { novice: 11.5, developing: 10.2, proficient: 9.2, advanced: 8.4, elite: 7.6, lowerIsBetter: true },
          'U-10': { novice: 10.5, developing: 9.4, proficient: 8.5, advanced: 7.8, elite: 7.1, lowerIsBetter: true },
          'U-12': { novice: 9.6, developing: 8.6, proficient: 7.9, advanced: 7.2, elite: 6.6, lowerIsBetter: true },
          'U-14': { novice: 8.8, developing: 7.9, proficient: 7.2, advanced: 6.7, elite: 6.2, lowerIsBetter: true },
          'U-16': { novice: 8.2, developing: 7.4, proficient: 6.8, advanced: 6.3, elite: 5.85, lowerIsBetter: true },
          'U-18': { novice: 7.8, developing: 7.0, proficient: 6.4, advanced: 5.95, elite: 5.55, lowerIsBetter: true }
        }
      },
      {
        id: 'ck_temperament',
        name: 'Match Temperament & Grit under Pressure',
        category: 'mental',
        unit: 'rating / 10',
        testType: 'rating',
        description: 'Focus during tight spells, bounce-back ability after drop/mistake, positive body language.',
        protocol: 'Observation during competitive nets and match play.',
        equipment: ['Checklist'],
        defaultScore: 8,
        ageNorms: {
          'U-8': { novice: 4, developing: 6, proficient: 7.5, advanced: 9, elite: 10 },
          'U-10': { novice: 4, developing: 6, proficient: 7.5, advanced: 9, elite: 10 },
          'U-12': { novice: 4.5, developing: 6.5, proficient: 8, advanced: 9, elite: 10 },
          'U-14': { novice: 5, developing: 7, proficient: 8, advanced: 9.5, elite: 10 },
          'U-16': { novice: 5, developing: 7, proficient: 8.5, advanced: 9.5, elite: 10 },
          'U-18': { novice: 5.5, developing: 7.5, proficient: 8.5, advanced: 9.5, elite: 10 }
        }
      }
    ],
    correctiveDrills: [
      {
        skillId: 'ck_bowling_accuracy',
        drillName: 'Towel Landing & String Channel Target Bowling',
        triggerCondition: 'Bowling accuracy below 50% target hits',
        focus: 'Consistent release point, front arm pull down, braced front knee at delivery stride.',
        description: 'Place a small towel on the good length zone (6-8m from batsman stumps). Bowler aims to hit the towel 18 times out of 24 deliveries.',
        weeklyFrequency: '3 sessions/week, 48 balls per session',
        intensity: 'Focused target work'
      },
      {
        skillId: 'ck_batting_technique',
        drillName: 'Hanging Ball Drill + Front Knee Alignment Drives',
        triggerCondition: 'Batting technique rating <= 6/10',
        focus: 'Presenting full face of bat, head still over ball, high front elbow.',
        description: 'Suspend tennis ball from ceiling at knee height. Player drives through the V with bottom hand loose (top hand dominance) for 100 repetitions.',
        weeklyFrequency: 'Daily home practice, 100 reps',
        intensity: 'Technical muscle memory'
      }
    ],
    gameSenseRubric: {
      title: 'BCCI/ICC Match IQ Rubric',
      description: 'Evaluation of field placement, game awareness, and situational decisions.',
      levels: [
        { score: 2, label: 'Novice', behavioralAnchor: 'Does not know field boundaries, calls late for runs, bowls random lengths.' },
        { score: 5, label: 'Developing', behavioralAnchor: 'Understands basic off/leg side, rotates strike occasionally, follows captain commands.' },
        { score: 7, label: 'Proficient', behavioralAnchor: 'Sets field to own bowling plan, calls YES/NO loudly, runs hard on boundary hits.' },
        { score: 9, label: 'Advanced', behavioralAnchor: 'Manipulates fielders with delicate placement, reads batsman weaknesses quickly.' },
        { score: 10, label: 'Elite', behavioralAnchor: 'Master match reader, controls momentum, executes clutch plans consistently.' }
      ]
    }
  },

  badminton: {
    id: 'badminton',
    name: 'Badminton',
    tagline: 'BWF (Badminton World Federation) Junior Athlete Rubric',
    iconName: 'Zap',
    governingBody: 'BWF / BAI (Badminton Association of India)',
    color: '#8B5CF6',
    ageBrackets: ['U-8', 'U-10', 'U-12', 'U-14', 'U-16', 'U-18'],
    skills: [
      {
        id: 'bd_high_clear',
        name: 'High Overhead Clear & Drop Precision',
        category: 'technical',
        unit: 'target hits / 10',
        testType: 'accuracy',
        description: 'Hitting overhead clears from rear court into the rear 76cm tramline box.',
        protocol: '10 feeds from net feeder. Player executes full overhead stroke. Points scored for shuttles landing in deep back zone.',
        equipment: ['Racket', 'Shuttles', 'Court Markings'],
        defaultScore: 6,
        ageNorms: {
          'U-8': { novice: 2, developing: 4, proficient: 5, advanced: 7, elite: 9 },
          'U-10': { novice: 2, developing: 4, proficient: 6, advanced: 8, elite: 9 },
          'U-12': { novice: 3, developing: 5, proficient: 7, advanced: 8, elite: 10 },
          'U-14': { novice: 4, developing: 6, proficient: 7, advanced: 9, elite: 10 },
          'U-16': { novice: 4, developing: 6, proficient: 8, advanced: 9, elite: 10 },
          'U-18': { novice: 5, developing: 7, proficient: 8, advanced: 10, elite: 10 }
        }
      },
      {
        id: 'bd_short_serve',
        name: 'Low Short Serve Consistency',
        category: 'technical',
        unit: 'serves in / 10',
        testType: 'accuracy',
        description: 'Backhand short serve skimming tape (within 10cm above net) and landing inside service line.',
        protocol: '10 consecutive serves into right and left service boxes.',
        equipment: ['Racket', 'Shuttles', 'String guide above net'],
        defaultScore: 7,
        ageNorms: {
          'U-8': { novice: 3, developing: 5, proficient: 6, advanced: 8, elite: 9 },
          'U-10': { novice: 3, developing: 5, proficient: 7, advanced: 8, elite: 10 },
          'U-12': { novice: 4, developing: 6, proficient: 7, advanced: 9, elite: 10 },
          'U-14': { novice: 4, developing: 6, proficient: 8, advanced: 9, elite: 10 },
          'U-16': { novice: 5, developing: 7, proficient: 8, advanced: 10, elite: 10 },
          'U-18': { novice: 5, developing: 7, proficient: 9, advanced: 10, elite: 10 }
        }
      },
      {
        id: 'bd_footwork_six_corner',
        name: '6-Corner Court Footwork Speed',
        category: 'physical',
        unit: 'seconds',
        testType: 'time',
        description: 'Timed shuttle run touching all 6 court corners from center base in randomized sequence.',
        protocol: 'Start at center base T. Move to each of the 6 corners, touch floor, and recover to center base for each corner.',
        equipment: ['Court', 'Stopwatch'],
        defaultScore: 16.5,
        ageNorms: {
          'U-8': { novice: 26, developing: 22, proficient: 18.5, advanced: 16, elite: 14, lowerIsBetter: true },
          'U-10': { novice: 23, developing: 19.5, proficient: 16.5, advanced: 14.2, elite: 12.5, lowerIsBetter: true },
          'U-12': { novice: 20, developing: 17, proficient: 14.5, advanced: 12.8, elite: 11.2, lowerIsBetter: true },
          'U-14': { novice: 18, developing: 15.2, proficient: 13.1, advanced: 11.6, elite: 10.2, lowerIsBetter: true },
          'U-16': { novice: 16.2, developing: 13.8, proficient: 12.0, advanced: 10.7, elite: 9.5, lowerIsBetter: true },
          'U-18': { novice: 15.0, developing: 12.8, proficient: 11.2, advanced: 10.0, elite: 8.9, lowerIsBetter: true }
        }
      },
      {
        id: 'bd_rally_tactics',
        name: 'Rally Shot Selection & Anticipation',
        category: 'tactical',
        unit: 'rating / 10',
        testType: 'rating',
        description: 'Changing rally pace, moving opponent to 4 corners, anticipating loose returns, and smash defense.',
        protocol: '1-set singles match simulation assessed by coach.',
        equipment: ['Court', 'Shuttles'],
        defaultScore: 7,
        ageNorms: {
          'U-8': { novice: 3, developing: 5, proficient: 7, advanced: 8.5, elite: 10 },
          'U-10': { novice: 3, developing: 5, proficient: 7, advanced: 8.5, elite: 10 },
          'U-12': { novice: 3.5, developing: 5.5, proficient: 7, advanced: 8.5, elite: 10 },
          'U-14': { novice: 4, developing: 6, proficient: 7.5, advanced: 9, elite: 10 },
          'U-16': { novice: 4.5, developing: 6.5, proficient: 8, advanced: 9.5, elite: 10 },
          'U-18': { novice: 5, developing: 7, proficient: 8.5, advanced: 9.5, elite: 10 }
        }
      },
      {
        id: 'bd_mental_focus',
        name: 'Mental Composure & Tactical Patience',
        category: 'mental',
        unit: 'rating / 10',
        testType: 'rating',
        description: 'Focus during long rallies, emotional control after unforced errors, tactical adaptability.',
        protocol: 'Observation during competitive play.',
        equipment: ['Checklist'],
        defaultScore: 8,
        ageNorms: {
          'U-8': { novice: 4, developing: 6, proficient: 7.5, advanced: 9, elite: 10 },
          'U-10': { novice: 4, developing: 6, proficient: 7.5, advanced: 9, elite: 10 },
          'U-12': { novice: 4.5, developing: 6.5, proficient: 8, advanced: 9, elite: 10 },
          'U-14': { novice: 5, developing: 7, proficient: 8, advanced: 9.5, elite: 10 },
          'U-16': { novice: 5, developing: 7, proficient: 8.5, advanced: 9.5, elite: 10 },
          'U-18': { novice: 5.5, developing: 7.5, proficient: 8.5, advanced: 9.5, elite: 10 }
        }
      }
    ],
    correctiveDrills: [
      {
        skillId: 'bd_footwork_six_corner',
        drillName: 'Shadow Badminton 6-Corner Split-Step Matrix',
        triggerCondition: 'Footwork speed in Developing or Novice tier',
        focus: 'Active split-step on opponent hit, low center of gravity, scissor kick in rear court.',
        description: 'Complete 3 sets of 20 shadow footwork points with coach pointing random corners with racket.',
        weeklyFrequency: '4 sessions/week, 15 mins',
        intensity: 'High explosive anaerobic capacity'
      }
    ],
    gameSenseRubric: {
      title: 'BWF Junior Game Sense Rubric',
      description: 'Evaluates court awareness, deceptive wrist work, and tactical patience.',
      levels: [
        { score: 2, label: 'Novice', behavioralAnchor: 'Stands flat-footed, clears straight to opponent smash zone, rushes shots.' },
        { score: 5, label: 'Developing', behavioralAnchor: 'Recovers to base, plays basic clear-and-drop, struggles with backhand corner.' },
        { score: 7, label: 'Proficient', behavioralAnchor: 'Changes shot depth, reads opponent body cues, defends smashes with crosscourt lifts.' },
        { score: 9, label: 'Advanced', behavioralAnchor: 'Uses hold-and-flick deceptive net play, dictates rally tempo effortlessly.' },
        { score: 10, label: 'Elite', behavioralAnchor: 'Flawless tactical discipline, punishes weak returns, elite stamina and composure.' }
      ]
    }
  },

  athletics: {
    id: 'athletics',
    name: 'Athletics (Track & Field)',
    tagline: 'World Athletics & IAAF Youth Athlete Development',
    iconName: 'Activity',
    governingBody: 'World Athletics / AFI (Athletics Federation of India)',
    color: '#EF4444',
    ageBrackets: ['U-8', 'U-10', 'U-12', 'U-14', 'U-16', 'U-18'],
    skills: [
      {
        id: 'ath_30m_fly_sprint',
        name: '30m Fly Sprint Acceleration',
        category: 'physical',
        unit: 'seconds',
        testType: 'time',
        description: 'Sprint through 30m timing zone with a 10m rolling acceleration start.',
        protocol: 'Athlete builds maximum speed in 10m run-in, timer measures the flying 30m split.',
        equipment: ['Timing gates / High-speed camera', 'Track'],
        defaultScore: 4.1,
        ageNorms: {
          'U-8': { novice: 6.0, developing: 5.3, proficient: 4.7, advanced: 4.2, elite: 3.8, lowerIsBetter: true },
          'U-10': { novice: 5.5, developing: 4.8, proficient: 4.3, advanced: 3.9, elite: 3.5, lowerIsBetter: true },
          'U-12': { novice: 5.0, developing: 4.4, proficient: 3.95, advanced: 3.6, elite: 3.3, lowerIsBetter: true },
          'U-14': { novice: 4.6, developing: 4.05, proficient: 3.65, advanced: 3.35, elite: 3.1, lowerIsBetter: true },
          'U-16': { novice: 4.25, developing: 3.75, proficient: 3.40, advanced: 3.15, elite: 2.92, lowerIsBetter: true },
          'U-18': { novice: 4.0, developing: 3.55, proficient: 3.22, advanced: 3.0, elite: 2.78, lowerIsBetter: true }
        }
      },
      {
        id: 'ath_standing_broad_jump',
        name: 'Standing Broad Jump (Explosive Power)',
        category: 'physical',
        unit: 'cm',
        testType: 'count',
        description: 'Two-footed horizontal jump from stationary start, measured to heel mark.',
        protocol: 'Athlete swings arms, loads hips, jumps forward landing on both feet without stepping back.',
        equipment: ['Jump Mat / Measuring Tape'],
        defaultScore: 165,
        ageNorms: {
          'U-8': { novice: 90, developing: 110, proficient: 130, advanced: 150, elite: 170 },
          'U-10': { novice: 110, developing: 130, proficient: 150, advanced: 175, elite: 195 },
          'U-12': { novice: 130, developing: 155, proficient: 175, advanced: 200, elite: 220 },
          'U-14': { novice: 150, developing: 175, proficient: 200, advanced: 225, elite: 250 },
          'U-16': { novice: 170, developing: 195, proficient: 220, advanced: 245, elite: 275 },
          'U-18': { novice: 185, developing: 215, proficient: 240, advanced: 265, elite: 295 }
        }
      },
      {
        id: 'ath_running_mechanics',
        name: 'Sprint Mechanics & Posture',
        category: 'technical',
        unit: 'rating / 10',
        testType: 'rating',
        description: 'Tall posture, dorsiflexed ankle, front-side knee punch, rhythmic arm drive, and ground strike under center of mass.',
        protocol: 'High-speed video review or coach visual assessment over 60m sprint.',
        equipment: ['Track'],
        defaultScore: 7,
        ageNorms: {
          'U-8': { novice: 3, developing: 5, proficient: 7, advanced: 8.5, elite: 10 },
          'U-10': { novice: 3, developing: 5, proficient: 7, advanced: 8.5, elite: 10 },
          'U-12': { novice: 3.5, developing: 5.5, proficient: 7, advanced: 8.5, elite: 10 },
          'U-14': { novice: 4, developing: 6, proficient: 7.5, advanced: 9, elite: 10 },
          'U-16': { novice: 4.5, developing: 6.5, proficient: 8, advanced: 9.5, elite: 10 },
          'U-18': { novice: 5, developing: 7, proficient: 8.5, advanced: 9.5, elite: 10 }
        }
      },
      {
        id: 'ath_pacing_strategy',
        name: 'Pacing & Race Strategy IQ',
        category: 'tactical',
        unit: 'rating / 10',
        testType: 'rating',
        description: 'Energy distribution over distance, lane discipline, corner acceleration, and kick timing.',
        protocol: 'Evaluated in 400m / 800m time trials.',
        equipment: ['Track'],
        defaultScore: 7,
        ageNorms: {
          'U-8': { novice: 3, developing: 5, proficient: 7, advanced: 8.5, elite: 10 },
          'U-10': { novice: 3, developing: 5, proficient: 7, advanced: 8.5, elite: 10 },
          'U-12': { novice: 3.5, developing: 5.5, proficient: 7, advanced: 8.5, elite: 10 },
          'U-14': { novice: 4, developing: 6, proficient: 7.5, advanced: 9, elite: 10 },
          'U-16': { novice: 4.5, developing: 6.5, proficient: 8, advanced: 9.5, elite: 10 },
          'U-18': { novice: 5, developing: 7, proficient: 8.5, advanced: 9.5, elite: 10 }
        }
      },
      {
        id: 'ath_mental_grit',
        name: 'Grit, Focus & Competitive Drive',
        category: 'mental',
        unit: 'rating / 10',
        testType: 'rating',
        description: 'Overcoming lactic burn, warm-up discipline, pre-race focus, and competitive resilience.',
        protocol: 'Observation across interval training and time trials.',
        equipment: ['Checklist'],
        defaultScore: 8,
        ageNorms: {
          'U-8': { novice: 4, developing: 6, proficient: 7.5, advanced: 9, elite: 10 },
          'U-10': { novice: 4, developing: 6, proficient: 7.5, advanced: 9, elite: 10 },
          'U-12': { novice: 4.5, developing: 6.5, proficient: 8, advanced: 9, elite: 10 },
          'U-14': { novice: 5, developing: 7, proficient: 8, advanced: 9.5, elite: 10 },
          'U-16': { novice: 5, developing: 7, proficient: 8.5, advanced: 9.5, elite: 10 },
          'U-18': { novice: 5.5, developing: 7.5, proficient: 8.5, advanced: 9.5, elite: 10 }
        }
      }
    ],
    correctiveDrills: [
      {
        skillId: 'ath_running_mechanics',
        drillName: 'A-Skips, B-Skips & High Knee Wall Drives',
        triggerCondition: 'Running mechanics rating <= 6/10',
        focus: 'Triple extension (ankle, knee, hip), tall posture, striking active on balls of feet.',
        description: 'Perform 3 sets x 30m of A-skips with tall spine, followed by 30s wall sprint angle holds.',
        weeklyFrequency: 'Daily pre-run warm up',
        intensity: 'Dynamic coordination'
      }
    ],
    gameSenseRubric: {
      title: 'World Athletics Race Strategy Rubric',
      description: 'Evaluates race pacing, mental toughness, and transition mechanics.',
      levels: [
        { score: 2, label: 'Novice', behavioralAnchor: 'Starts too fast, dies on final bend, collapses posture under fatigue.' },
        { score: 5, label: 'Developing', behavioralAnchor: 'Maintains even pace for 60% of race, struggles with surge tactics.' },
        { score: 7, label: 'Proficient', behavioralAnchor: 'Negative split execution, smooth curve transitions, strong finishing kick.' },
        { score: 9, label: 'Advanced', behavioralAnchor: 'Tactical positioning in pack, drafts efficiently, accelerates on command.' },
        { score: 10, label: 'Elite', behavioralAnchor: 'Flawless pacing precision, championship race maturity, world-class kick.' }
      ]
    }
  }
};

const ATHLETES_STORAGE_KEY = 'smartpe_coaching_athletes';
const ASSESSMENTS_STORAGE_KEY = 'smartpe_coaching_assessments';
const COACH_PROFILE_STORAGE_KEY = 'smartpe_coach_profile';

export interface CoachProfile {
  id: string;
  coachName: string;
  programName: string;
  programType: CoachProgramType;
  primarySport: string;
  city: string;
  licenseOrExperience: string;
  email?: string;
  phone?: string;
}

const DEFAULT_COACH_PROFILE: CoachProfile = {
  id: 'coach_default',
  coachName: 'Coach Suresh Nair',
  programName: 'Pinnacle Sports Coaching Academy & After-School Club',
  programType: 'after_school_academy',
  primarySport: 'football',
  city: 'Bengaluru / Mumbai',
  licenseOrExperience: 'AFC B-License & Senior PE Lead'
};

const SAMPLE_ATHLETES: AthleteProfile[] = [
  {
    id: 'ath_101',
    name: 'Aarav Sharma',
    age: 13,
    gender: 'Male',
    sport: 'football',
    programType: 'after_school_academy',
    squadOrBatch: 'U-14 Development Squad',
    jerseyNo: '10',
    guardianName: 'Rajesh Sharma',
    guardianContact: '+91 98765 43210',
    joiningDate: '2025-06-15',
    notes: 'Natural left foot, strong vision, working on sprint agility.'
  },
  {
    id: 'ath_102',
    name: 'Diya Patel',
    age: 12,
    gender: 'Female',
    sport: 'football',
    programType: 'school_team',
    squadOrBatch: 'Girls Sub-Junior Team',
    jerseyNo: '7',
    guardianName: 'Meera Patel',
    guardianContact: '+91 98111 22334',
    joiningDate: '2025-08-01',
    notes: 'Exceptional ball control and dribbling pace.'
  },
  {
    id: 'ath_103',
    name: 'Rohan Deshmukh',
    age: 15,
    gender: 'Male',
    sport: 'basketball',
    programType: 'sports_club',
    squadOrBatch: 'U-16 Varsity Tigers',
    jerseyNo: '23',
    guardianName: 'Sunil Deshmukh',
    guardianContact: '+91 97654 32109',
    joiningDate: '2025-04-10',
    notes: 'Point guard with high court vision and solid perimeter shot.'
  },
  {
    id: 'ath_104',
    name: 'Ananya Reddy',
    age: 11,
    gender: 'Female',
    sport: 'cricket',
    programType: 'individual_coach',
    squadOrBatch: 'U-12 Elite Academy',
    jerseyNo: '18',
    guardianName: 'Venkatesh Reddy',
    guardianContact: '+91 99887 76655',
    joiningDate: '2025-07-20',
    notes: 'Top order opening batter with classic front foot technique.'
  }
];

export const sportsCoachingService = {
  getCoachProfile: (): CoachProfile => {
    try {
      const stored = localStorage.getItem(COACH_PROFILE_STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error('Failed to load coach profile', e);
    }
    return DEFAULT_COACH_PROFILE;
  },

  saveCoachProfile: (profile: CoachProfile): void => {
    try {
      localStorage.setItem(COACH_PROFILE_STORAGE_KEY, JSON.stringify(profile));
    } catch (e) {
      console.error('Failed to save coach profile', e);
    }
  },

  getAllAthletes: (): AthleteProfile[] => {
    try {
      const stored = localStorage.getItem(ATHLETES_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Failed to load athletes', e);
    }
    // Seed initial samples if empty
    localStorage.setItem(ATHLETES_STORAGE_KEY, JSON.stringify(SAMPLE_ATHLETES));
    return SAMPLE_ATHLETES;
  },

  saveAthlete: (athlete: Omit<AthleteProfile, 'id'> & { id?: string }): AthleteProfile => {
    const list = sportsCoachingService.getAllAthletes();
    const id = athlete.id || `ath_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    const fullAthlete: AthleteProfile = { ...athlete, id };
    
    const index = list.findIndex(a => a.id === id);
    if (index >= 0) {
      list[index] = fullAthlete;
    } else {
      list.unshift(fullAthlete);
    }
    localStorage.setItem(ATHLETES_STORAGE_KEY, JSON.stringify(list));
    return fullAthlete;
  },

  deleteAthlete: (athleteId: string): void => {
    const list = sportsCoachingService.getAllAthletes().filter(a => a.id !== athleteId);
    localStorage.setItem(ATHLETES_STORAGE_KEY, JSON.stringify(list));
    
    // Also cleanup assessments
    const assessments = sportsCoachingService.getAllAssessments().filter(a => a.athleteId !== athleteId);
    localStorage.setItem(ASSESSMENTS_STORAGE_KEY, JSON.stringify(assessments));
  },

  getAllAssessments: (): AssessmentRecord[] => {
    try {
      const stored = localStorage.getItem(ASSESSMENTS_STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error('Failed to load assessments', e);
    }
    return [];
  },

  getAssessmentsForAthlete: (athleteId: string): AssessmentRecord[] => {
    return sportsCoachingService.getAllAssessments()
      .filter(a => a.athleteId === athleteId)
      .sort((a, b) => new Date(a.testDate).getTime() - new Date(b.testDate).getTime());
  },

  getAgeBracketFromAge: (age: number): AgeBracket => {
    if (age <= 8) return 'U-8';
    if (age <= 10) return 'U-10';
    if (age <= 12) return 'U-12';
    if (age <= 14) return 'U-14';
    if (age <= 16) return 'U-16';
    return 'U-18';
  },

  calculateSkillTier: (score: number, skill: SkillDefinition, ageBracket: AgeBracket): SkillTier => {
    const norm = skill.ageNorms[ageBracket] || skill.ageNorms['U-14'];
    const lowerIsBetter = !!norm.lowerIsBetter;

    if (lowerIsBetter) {
      if (score <= norm.elite) return 'Elite';
      if (score <= norm.advanced) return 'Advanced';
      if (score <= norm.proficient) return 'Proficient';
      if (score <= norm.developing) return 'Developing';
      return 'Novice';
    } else {
      if (score >= norm.elite) return 'Elite';
      if (score >= norm.advanced) return 'Advanced';
      if (score >= norm.proficient) return 'Proficient';
      if (score >= norm.developing) return 'Developing';
      return 'Novice';
    }
  },

  calculateSkillPercentage: (score: number, skill: SkillDefinition, ageBracket: AgeBracket): number => {
    const norm = skill.ageNorms[ageBracket] || skill.ageNorms['U-14'];
    const lowerIsBetter = !!norm.lowerIsBetter;

    if (lowerIsBetter) {
      // Best possible is elite (100%), worst baseline is novice or higher (40%)
      if (score <= norm.elite) return 100;
      if (score >= norm.novice) return 40;
      const range = norm.novice - norm.elite;
      const progress = (norm.novice - score) / range;
      return Math.round(40 + progress * 60);
    } else {
      if (score >= norm.elite) return 100;
      if (score <= 0) return 0;
      const pct = (score / norm.elite) * 100;
      return Math.min(100, Math.max(20, Math.round(pct)));
    }
  },

  generateAssessmentResult: (
    athlete: AthleteProfile,
    sport: SportDefinition,
    cycleType: AssessmentCycle,
    scores: Record<string, number>,
    coachName: string,
    programName: string
  ): AssessmentRecord => {
    const ageBracket = sportsCoachingService.getAgeBracketFromAge(athlete.age);
    const existingAssessments = sportsCoachingService.getAssessmentsForAthlete(athlete.id);
    const cycleNumber = existingAssessments.length + 1;

    let techSum = 0, techCount = 0;
    let tactSum = 0, tactCount = 0;
    let physSum = 0, physCount = 0;
    let mentSum = 0, mentCount = 0;

    const strengths: string[] = [];
    const growthAreas: string[] = [];
    const prescribedDrills: AssessmentRecord['prescribedDrills'] = [];

    sport.skills.forEach(skill => {
      const val = scores[skill.id] !== undefined ? scores[skill.id] : skill.defaultScore;
      const pct = sportsCoachingService.calculateSkillPercentage(val, skill, ageBracket);
      const tier = sportsCoachingService.calculateSkillTier(val, skill, ageBracket);

      if (skill.category === 'technical') {
        techSum += pct;
        techCount++;
      } else if (skill.category === 'tactical') {
        tactSum += pct;
        tactCount++;
      } else if (skill.category === 'physical') {
        physSum += pct;
        physCount++;
      } else if (skill.category === 'mental') {
        mentSum += pct;
        mentCount++;
      }

      if (tier === 'Elite' || tier === 'Advanced') {
        strengths.push(`${skill.name} (${tier} tier: ${val} ${skill.unit})`);
      } else if (tier === 'Novice' || tier === 'Developing') {
        growthAreas.push(`${skill.name} (${tier} tier: ${val} ${skill.unit})`);
        
        // Find matched corrective drill
        const matchDrill = sport.correctiveDrills.find(d => d.skillId === skill.id);
        if (matchDrill) {
          prescribedDrills.push({
            drillName: matchDrill.drillName,
            focus: matchDrill.focus,
            frequency: matchDrill.weeklyFrequency,
            description: matchDrill.description
          });
        }
      }
    });

    const technical = techCount > 0 ? Math.round(techSum / techCount) : 70;
    const tactical = tactCount > 0 ? Math.round(tactSum / tactCount) : 70;
    const physical = physCount > 0 ? Math.round(physSum / physCount) : 70;
    const mental = mentCount > 0 ? Math.round(mentSum / mentCount) : 75;

    const overallScore = Math.round((technical * 0.35) + (tactical * 0.25) + (physical * 0.25) + (mental * 0.15));

    let overallTier: SkillTier = 'Proficient';
    if (overallScore >= 90) overallTier = 'Elite';
    else if (overallScore >= 80) overallTier = 'Advanced';
    else if (overallScore >= 65) overallTier = 'Proficient';
    else if (overallScore >= 50) overallTier = 'Developing';
    else overallTier = 'Novice';

    // Auto-generate coach notes based on performance
    const feedback = `${athlete.name} completed the ${cycleType.toUpperCase()} assessment for ${sport.name} (${ageBracket} bracket). Overall rating is ${overallScore}/100 (${overallTier}). ` +
      (strengths.length > 0 ? `Key strengths observed in ${strengths.slice(0, 2).join(' and ')}. ` : '') +
      (growthAreas.length > 0 ? `Primary developmental focus is required on ${growthAreas.slice(0, 2).join(' and ')}. ` : 'Consistent performance across all pillars. ') +
      `Recommended practice regimen has been assigned to enhance game readiness.`;

    const record: AssessmentRecord = {
      id: `eval_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      athleteId: athlete.id,
      sportId: sport.id,
      cycleType,
      cycleNumber,
      testDate: new Date().toISOString().split('T')[0],
      ageBracket,
      coachName: coachName || 'Head Coach',
      programName: programName || 'Sports Training Academy',
      scores,
      pillarAverages: {
        technical,
        tactical,
        physical,
        mental
      },
      overallScore,
      overallTier,
      strengths,
      growthAreas,
      coachFeedback: feedback,
      prescribedDrills
    };

    const all = sportsCoachingService.getAllAssessments();
    all.unshift(record);
    localStorage.setItem(ASSESSMENTS_STORAGE_KEY, JSON.stringify(all));

    return record;
  },

  saveAssessment: (assessment: AssessmentRecord): void => {
    const all = sportsCoachingService.getAllAssessments();
    const existingIndex = all.findIndex(a => a.id === assessment.id);
    if (existingIndex >= 0) {
      all[existingIndex] = assessment;
    } else {
      all.unshift(assessment);
    }
    localStorage.setItem(ASSESSMENTS_STORAGE_KEY, JSON.stringify(all));
  },

  deleteAssessment: (assessmentId: string): void => {
    const list = sportsCoachingService.getAllAssessments().filter(a => a.id !== assessmentId);
    localStorage.setItem(ASSESSMENTS_STORAGE_KEY, JSON.stringify(list));
  }
};
