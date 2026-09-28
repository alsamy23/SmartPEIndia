
import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit, 
  deleteDoc,
  onSnapshot,
  getDoc
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { logError } from './logService';
import { offlineCacheService } from './offlineCacheService';
import { 
  Student, 
  Team, 
  FitnessResult, 
  School, 
  SchoolMember, 
  KIFTBattery,
  KIFTGradeCategory,
  PracticalAssessment,
  isBrandSuperAdmin
} from '../types';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  
  const errorString = JSON.stringify(errInfo);
  console.error('Firestore Error: ', errorString);
  logError(error, 'error', errInfo);
  throw new Error(errorString);
}

export type { 
  Student, 
  Team, 
  FitnessResult, 
  School, 
  SchoolMember, 
  KIFTBattery,
  KIFTGradeCategory
};

export const KIFT_BATTERIES: KIFTBattery[] = [
  {
    category: 'Primary',
    grades: ['1', '2', '3'],
    objective: 'Basic motor skills, coordination & body composition',
    tests: [
      { 
        id: 'bmi', 
        name: 'BMI (Height & Weight)', 
        unit: 'kg/m²', 
        description: 'Body Mass Index calculation evaluating stature & weight.',
        duration: 'Untimed (Single Measurement)',
        equipment: ['Stadiometer / Measuring Tape', 'Digital Weighing Scale'],
        scoringGuide: 'Enter weight in kg and height in cm separated by slash (e.g., 28/140). BMI is auto-calculated.',
        protocol: 'Student stands bare-foot on weighing scale for mass in kg. Height measured using stadiometer against a flat wall with heels and shoulders aligned.'
      },
      { 
        id: 'flamingo', 
        name: 'Flamingo Balance Test', 
        unit: 'count', 
        description: 'Single leg balance evaluating static core stability and leg strength.',
        duration: '60 Seconds (1 Minute)',
        equipment: ['Flamingo Balance Beam (50cm x 3cm x 4cm)', 'Stopwatch'],
        scoringGuide: 'Record the total number of falls or balance breaks during the 60-second trial.',
        protocol: 'Student balances on preferred leg on beam, bends free leg back holding foot at instep. Start 60s timer once stable. Each time student loses balance, pause timer and add 1 to count until full 60s of balance is completed.'
      },
      { 
        id: 'plate_tapping', 
        name: 'Plate Tapping Test', 
        unit: 'count', 
        description: 'Tests speed and limb coordination of upper extremities.',
        duration: '30 Seconds',
        equipment: ['Table with 2 Yellow Disc Plates (20cm dia) & 1 Rectangle Plate (30x20cm)', 'Stopwatch'],
        scoringGuide: 'Record total number of taps completed in 30 seconds.',
        protocol: 'Student places non-preferred hand on center rectangle plate. Moves preferred hand back and forth touching two yellow discs as fast as possible. 1 tap = touching disc A and disc B.'
      },
      { 
        id: 'sit_reach', 
        name: 'Sit and Reach Test', 
        unit: 'cm', 
        description: 'Evaluates lower back and hamstring flexibility.',
        duration: '2 Attempts (Best score recorded)',
        equipment: ['Sit and Reach Flexibility Box / Ruler'],
        scoringGuide: 'Record maximum distance reached in cm (to nearest 0.5cm). Best of 2 trials.',
        protocol: 'Student sits with feet bare against box, knees fully extended. Reaches smoothly forward with arms stacked without bouncing. Hold max reach position for 2 seconds.'
      },
      { 
        id: 'shuttle_run', 
        name: 'Shuttle Run (4x10m)', 
        unit: 'seconds', 
        description: 'Evaluates speed, acceleration, agility and turning coordination.',
        duration: 'Timed Run (~10-20 seconds)',
        equipment: ['2 Cones', '2 Wooden Blocks (5x5x10cm)', 'Stopwatch', '10m Runway'],
        scoringGuide: 'Record time taken in seconds (e.g., 11.45) to finish sprint picking up two blocks.',
        protocol: 'Student starts at line, sprints 10m to pick up block 1, returns and places it behind start line, sprints back for block 2, and sprints back across start line.'
      },
      { 
        id: 'sprint_25m', 
        name: '25m Race / Sprint', 
        unit: 'seconds', 
        description: 'Linear speed & acceleration test ideal for compact grounds/indoor halls without 100m tracks.',
        duration: 'Timed Sprint (~4-8 seconds)',
        equipment: ['25m Straight Runway / Hall', 'Measuring Tape', '2 Cones / Chalk Line', 'Stopwatch'],
        scoringGuide: 'Record sprint duration in seconds (e.g. 5.12s) to 0.01s accuracy from standing start.',
        protocol: 'Student takes a standing start behind the 25m start line. On "On Your Mark, GO!" or whistle, sprint 25 meters across the finish line at maximum effort. Ideal for primary grades and schools with limited track space.'
      },
      { 
        id: 'sprint_30m', 
        name: '30m Race / Sprint', 
        unit: 'seconds', 
        description: 'Standard 30m sprint measuring acceleration & speed on compact school tracks.',
        duration: 'Timed Sprint (~5-9 seconds)',
        equipment: ['30m Straight Track / Hall', 'Measuring Tape', 'Cones', 'Stopwatch'],
        scoringGuide: 'Record sprint time in seconds (e.g. 5.85s) to 0.01s accuracy from standing start.',
        protocol: 'Standing start behind the 30m line. On command, student sprints 30 meters at full velocity past the finish line. Standard CBSE metric for schools without full-size 100m tracks.'
      }
    ]
  },
  {
    category: 'Upper Primary',
    grades: ['4', '5'],
    objective: 'Foundational physical fitness components',
    tests: [
      { 
        id: 'bmi', 
        name: 'BMI (Height & Weight)', 
        unit: 'kg/m²', 
        description: 'Body Mass Index calculation.',
        duration: 'Untimed',
        equipment: ['Stadiometer', 'Weighing Scale'],
        scoringGuide: 'Format: "weight_kg / height_cm" (e.g. 32/145).',
        protocol: 'Measure stature height in cm and body mass in kg. System calculates exact BMI and CBSE percentile.'
      },
      { 
        id: 'flamingo', 
        name: 'Flamingo Balance', 
        unit: 'count', 
        description: 'Balance and posture control.',
        duration: '60 Seconds (1 Minute)',
        equipment: ['Balance Beam', 'Stopwatch'],
        scoringGuide: 'Record total balance disruptions/falls in 60s.',
        protocol: 'Balance on dominant leg for 60 seconds total. Count each stumble.'
      },
      { 
        id: 'plate_tapping', 
        name: 'Plate Tapping', 
        unit: 'count', 
        description: 'Speed and reaction coordination.',
        duration: '30 Seconds',
        equipment: ['Tapping Board', 'Stopwatch'],
        scoringGuide: 'Record count of disc taps in 30 seconds.',
        protocol: 'Rapid hand tapping between two side discs for 30s.'
      },
      { 
        id: 'sit_reach', 
        name: 'Sit & Reach', 
        unit: 'cm', 
        description: 'Lower trunk flexibility.',
        duration: '2 Attempts',
        equipment: ['Sit & Reach Box'],
        scoringGuide: 'Record distance reached in cm.',
        protocol: 'Sit barefoot with knees locked, reach forward along measuring ruler.'
      },
      { 
        id: 'broad_jump', 
        name: 'Standing Broad Jump', 
        unit: 'cm', 
        description: 'Explosive leg power.',
        duration: '2 Jumps (Best score)',
        equipment: ['Non-slip Jump Mat / Sand Pit', 'Measuring Tape'],
        scoringGuide: 'Record distance in cm from take-off line to back heel nearest line.',
        protocol: 'Two-legged standing jump. Swing arms and bend knees before explosive takeoff. Measure from line to rear heel landing.'
      },
      { 
        id: 'sprint_50m', 
        name: '50m Sprint', 
        unit: 'seconds', 
        description: 'Maximum linear running speed.',
        duration: 'Timed Sprint (~7-12 seconds)',
        equipment: ['50m Straight Track', 'Cones', 'Stopwatch'],
        scoringGuide: 'Record sprint time in seconds (e.g. 8.42s).',
        protocol: 'Standing start behind line. On "GO", sprint 50m full speed across finish line.'
      },
      { 
        id: 'sprint_25m', 
        name: '25m Race / Sprint (Compact Track)', 
        unit: 'seconds', 
        description: 'Alternative linear speed test for schools without 50m/100m tracks.',
        duration: 'Timed Sprint (~4-7 seconds)',
        equipment: ['25m Straight Track / Hall', 'Cones', 'Stopwatch'],
        scoringGuide: 'Record sprint time in seconds (e.g. 4.85s).',
        protocol: 'Standing start behind 25m mark. Sprint at maximum velocity across finish line. Ideal for compact school facilities.'
      },
      { 
        id: 'sprint_30m', 
        name: '30m Race / Sprint (Compact Track)', 
        unit: 'seconds', 
        description: 'Standard 30m speed and acceleration measurement on compact grounds.',
        duration: 'Timed Sprint (~5-8 seconds)',
        equipment: ['30m Straight Track / Hall', 'Cones', 'Stopwatch'],
        scoringGuide: 'Record sprint time in seconds (e.g. 5.42s).',
        protocol: 'Standing start behind 30m line. Sprint 30 meters at full pace past finish line.'
      }
    ]
  },
  {
    category: 'Middle School',
    grades: ['6', '7', '8'],
    objective: 'Cardiovascular endurance & muscular agility tracking',
    tests: [
      { 
        id: 'bmi', 
        name: 'BMI (Height & Weight)', 
        unit: 'kg/m²', 
        description: 'Body Mass Index.',
        duration: 'Untimed',
        equipment: ['Stadiometer', 'Weighing Scale'],
        scoringGuide: 'Enter weight in kg and height in cm (e.g. 42/155).',
        protocol: 'Standard anthropometric measurement.'
      },
      { 
        id: 'sprint_50m', 
        name: '50m Sprint', 
        unit: 'seconds', 
        description: 'Max running velocity.',
        duration: 'Timed Sprint',
        equipment: ['Stopwatch', '50m Track'],
        scoringGuide: 'Record time in seconds (e.g. 7.85s).',
        protocol: 'High intensity 50m dash from standing start.'
      },
      { 
        id: 'sprint_30m', 
        name: '30m Race / Sprint (Compact Track)', 
        unit: 'seconds', 
        description: 'Speed & acceleration measurement for schools without 100m tracks.',
        duration: 'Timed Sprint',
        equipment: ['30m Track / Ground', 'Stopwatch', 'Cones'],
        scoringGuide: 'Record time in seconds (e.g. 4.95s).',
        protocol: 'High intensity 30m dash from standing start. Standard CBSE metric for compact grounds.'
      },
      { 
        id: 'sprint_25m', 
        name: '25m Race / Sprint (Compact Track)', 
        unit: 'seconds', 
        description: 'Explosive start & short sprint speed evaluation.',
        duration: 'Timed Sprint',
        equipment: ['25m Track / Hall', 'Stopwatch', 'Cones'],
        scoringGuide: 'Record time in seconds (e.g. 4.35s).',
        protocol: 'High-speed 25m sprint from standing start.'
      },
      { 
        id: 'run_600m', 
        name: '600m Run/Walk', 
        unit: 'min:sec', 
        description: 'Cardiovascular aerobic endurance.',
        duration: 'Timed Endurance Run (~2-5 minutes)',
        equipment: ['200m or 400m Oval Track', 'Stopwatch'],
        scoringGuide: 'Record time in MM:SS format (e.g. 2:45).',
        protocol: 'Run or walk 600m as quickly as possible. Time stopped as student crosses finish line.'
      },
      { 
        id: 'broad_jump', 
        name: 'Standing Broad Jump', 
        unit: 'cm', 
        description: 'Lower body explosive muscle power.',
        duration: '2 Jumps',
        equipment: ['Measuring Tape', 'Landing Mat'],
        scoringGuide: 'Record max jump distance in cm.',
        protocol: 'Standing jump with simultaneous foot takeoff.'
      },
      { 
        id: 'sit_reach', 
        name: 'Sit & Reach', 
        unit: 'cm', 
        description: 'Hamstring & lower back flexibility.',
        duration: '2 Attempts',
        equipment: ['Flexibility Box'],
        scoringGuide: 'Record best reach in cm.',
        protocol: 'Slow forward reach holding position for 2 seconds.'
      },
      { 
        id: 'shuttle_4x10', 
        name: '4×10m Shuttle Run', 
        unit: 'seconds', 
        description: 'Agility, direction change & velocity.',
        duration: 'Timed Shuttle (~10-15 seconds)',
        equipment: ['Stopwatch', 'Cones', '2 Blocks'],
        scoringGuide: 'Record time in seconds (e.g. 10.8s).',
        protocol: 'Sprint 10m 4 times, moving 2 wooden blocks across boundary lines.'
      },
      { 
        id: 'pushups', 
        name: 'Push-Ups (Boys) / Modified Push-Ups (Girls)', 
        unit: 'count', 
        description: 'Upper body muscular strength & endurance for Middle School (Class 6-8).',
        duration: '60 Seconds (1 Minute)',
        equipment: ['Exercise Mat', 'Stopwatch / Metronome'],
        scoringGuide: 'Enter total valid repetitions in 60s. Boys: Standard plank push-ups; Girls: Modified push-ups with knees resting on mat.',
        protocol: 'Boys assume standard push-up plank posture (body straight, hands shoulder-width). Girls assume modified push-up posture with knees resting on mat and torso straight. Lower chest to 90-degree elbow bend, then push up to full arm extension. Record maximum completed repetitions in 60 seconds.'
      },
      { 
        id: 'curl_ups', 
        name: 'Sit-Ups / Partial Curl-Ups', 
        unit: 'count', 
        description: 'Abdominal core muscle strength & endurance for Middle School (Class 6-8).',
        duration: '30 Seconds (Official KIFT)',
        equipment: ['Exercise Mat', '10cm Measuring Strip / Tape', 'Stopwatch'],
        scoringGuide: 'Enter total valid repetitions completed in 30 seconds (Official Khelo India Standard).',
        protocol: 'Student lies flat on back with knees bent at 140 degrees, feet flat on floor. Arms extended at sides touching measuring strip. On whistle, curl upper body until fingers slide across 10cm measuring strip. Lower down until head touches mat. Record total valid repetitions completed in 30 seconds.'
      }
    ]
  },
  {
    category: 'Secondary',
    grades: ['9', '10'],
    objective: 'CBSE HPE Strand 1 physical fitness benchmarking',
    tests: [
      { 
        id: 'bmi', 
        name: 'BMI (Height & Weight)', 
        unit: 'kg/m²', 
        description: 'Body Mass Index classification.',
        duration: 'Untimed',
        equipment: ['Stadiometer', 'Weighing Scale'],
        scoringGuide: 'Format: "weight/height" (e.g. 52/165). Auto-categorized.',
        protocol: 'Height in cm and weight in kg entered to compute exact BMI category.'
      },
      { 
        id: 'pushups', 
        name: 'Push-Ups (Boys) / Modified Push-Ups (Girls)', 
        unit: 'count', 
        description: 'Upper body muscular strength & endurance for Secondary School (Class 9-10).',
        duration: '60 Seconds (1 Minute)',
        equipment: ['Exercise Mat', 'Stopwatch / Metronome'],
        scoringGuide: 'Enter total valid repetitions completed in 60 seconds (1 Minute). Boys: Standard plank push-ups; Girls: Modified (knee) push-ups.',
        protocol: 'Boys assume standard push-up plank posture (hands shoulder-width, body straight). Girls assume modified push-up posture with knees resting on mat. Lower chest to 90-degree elbow bend, then extend fully. Record max completed reps in 60s.'
      },
      { 
        id: 'curl_ups', 
        name: 'Sit-Ups / Partial Curl-Ups', 
        unit: 'count', 
        description: 'Abdominal core muscle strength & endurance for Secondary School (Class 9-10).',
        duration: '30s (KIFT) / 60s (CBSE)',
        equipment: ['Exercise Mat', 'Measuring Strip (10cm wide)', 'Stopwatch'],
        scoringGuide: 'Enter total valid curl-up repetitions completed. (Official Khelo India standard: 30 seconds; CBSE 60s cadence supported).',
        protocol: 'Student lies flat on back with knees bent at 140 degrees, feet flat on floor. Arms extended at sides touching measuring strip. Curl upper body until fingers slide across 10cm strip. Lower down until head touches mat. Record valid repetitions in 30s (Official Khelo India) or 60s (CBSE Practical Cadence).'
      },
      { 
        id: 'sit_reach', 
        name: 'Sit & Reach', 
        unit: 'cm', 
        description: 'Flexibility of lower back & hamstrings.',
        duration: '2 Attempts',
        equipment: ['Flexibility Box'],
        scoringGuide: 'Record reach in cm.',
        protocol: 'Stretch forward without bending knees.'
      },
      { 
        id: 'sprint_50m', 
        name: '50m Sprint', 
        unit: 'seconds', 
        description: 'Anaerobic explosive acceleration.',
        duration: 'Timed Sprint',
        equipment: ['Stopwatch', '50m Track'],
        scoringGuide: 'Record time in seconds (e.g. 7.20s).',
        protocol: 'Standing start sprint over 50m.'
      },
      { 
        id: 'sprint_30m', 
        name: '30m Race / Sprint (Compact Track)', 
        unit: 'seconds', 
        description: 'Linear speed & acceleration test for schools without 100m tracks.',
        duration: 'Timed Sprint',
        equipment: ['30m Track / Ground', 'Stopwatch'],
        scoringGuide: 'Record sprint time in seconds (e.g. 4.60s).',
        protocol: 'Standing start sprint over 30m. CBSE metric for compact school grounds.'
      },
      { 
        id: 'sprint_25m', 
        name: '25m Race / Sprint (Compact Track)', 
        unit: 'seconds', 
        description: 'Acceleration & speed test for compact school spaces.',
        duration: 'Timed Sprint',
        equipment: ['25m Track / Corridor', 'Stopwatch'],
        scoringGuide: 'Record sprint time in seconds (e.g. 3.95s).',
        protocol: 'Standing start sprint over 25m.'
      },
      { 
        id: 'run_600m', 
        name: '600m Run / Walk', 
        unit: 'min:sec', 
        description: 'Aerobic endurance capacity.',
        duration: 'Timed Endurance Run',
        equipment: ['Stopwatch', '400m Track'],
        scoringGuide: 'Record time in MM:SS format (e.g. 2:20).',
        protocol: 'Paced 600m continuous run/walk.'
      },
      { 
        id: 'broad_jump', 
        name: 'Standing Broad Jump', 
        unit: 'cm', 
        description: 'Muscular strength and leg power.',
        duration: '2 Attempts',
        equipment: ['Landing Mat', 'Tape'],
        scoringGuide: 'Record best distance in cm.',
        protocol: 'Explosive standing forward jump landing on both feet.'
      },
      { 
        id: 'shuttle_4x10', 
        name: '4×10m Shuttle Run', 
        unit: 'seconds', 
        description: 'Agility & rapid deceleration/acceleration.',
        duration: 'Timed Shuttle',
        equipment: ['Cones', 'Blocks', 'Stopwatch'],
        scoringGuide: 'Record shuttle time in seconds.',
        protocol: '4 lengths of 10m retrieving blocks.'
      }
    ]
  },
  {
    category: 'Senior Secondary',
    grades: ['11', '12'],
    objective: 'High-performance athletic profiling & health wellness',
    tests: [
      { 
        id: 'bmi', 
        name: 'BMI (Height & Weight)', 
        unit: 'kg/m²', 
        description: 'Body Mass Index profiling.',
        duration: 'Untimed',
        equipment: ['Stadiometer', 'Weighing Scale'],
        scoringGuide: 'Format: "weight/height" (e.g. 60/172).',
        protocol: 'Measurement of height and weight for secondary PE profiling.'
      },
      { 
        id: 'pushups', 
        name: 'Push-Ups (Boys) / Modified Push-Ups (Girls)', 
        unit: 'count', 
        description: 'Upper body push muscular strength & endurance for Senior Secondary (Class 11-12).',
        duration: '60 Seconds (1 Minute)',
        equipment: ['Exercise Mat', 'Stopwatch'],
        scoringGuide: 'Enter total valid repetitions completed in 60 seconds (1 Minute). Boys: standard plank push-ups; Girls: modified knee push-ups.',
        protocol: '60-second timed push-up test. Boys: standard plank push-ups; Girls: modified knee push-ups.'
      },
      { 
        id: 'curl_ups', 
        name: 'Sit-Ups / Partial Curl-Ups', 
        unit: 'count', 
        description: 'Abdominal core endurance & stamina for Senior Secondary (Class 11-12 Board Practical).',
        duration: '60 Seconds (1 Minute CBSE Board)',
        equipment: ['Mat', 'Measuring Strip (10cm)', 'Stopwatch'],
        scoringGuide: 'Enter total valid repetitions completed in 60 seconds (1 Minute) for CBSE Senior Secondary Board Practical.',
        protocol: 'Student lies flat on back with knees bent, feet flat on floor. Execute controlled curl-ups sliding fingers 10cm forward on mat. Record total valid completed repetitions in 60 seconds (1 Minute).'
      },
      { 
        id: 'sit_reach', 
        name: 'Sit & Reach', 
        unit: 'cm', 
        description: 'Spinal & hamstring elasticity.',
        duration: '2 Attempts',
        equipment: ['Flexibility Box'],
        scoringGuide: 'Record best reach in cm.',
        protocol: 'Hamstring & lower lumbar flexibility check.'
      },
      { 
        id: 'sprint_50m', 
        name: '50m Sprint', 
        unit: 'seconds', 
        description: 'Sprint acceleration & maximum speed.',
        duration: 'Timed Sprint',
        equipment: ['50m Track', 'Stopwatch'],
        scoringGuide: 'Record time in seconds (e.g. 6.95s).',
        protocol: 'Maximum effort 50m sprint.'
      },
      { 
        id: 'sprint_30m', 
        name: '30m Race / Sprint (Compact Track)', 
        unit: 'seconds', 
        description: 'Acceleration & speed metric for schools without 100m tracks.',
        duration: 'Timed Sprint',
        equipment: ['30m Track / Ground', 'Stopwatch'],
        scoringGuide: 'Record sprint time in seconds (e.g. 4.35s).',
        protocol: 'Maximum effort 30m sprint from standing start. Standard CBSE alternative for compact campus grounds.'
      },
      { 
        id: 'sprint_25m', 
        name: '25m Race / Sprint (Compact Track)', 
        unit: 'seconds', 
        description: 'Speed & acceleration metric for compact campus facilities.',
        duration: 'Timed Sprint',
        equipment: ['25m Track / Hall', 'Stopwatch'],
        scoringGuide: 'Record sprint time in seconds (e.g. 3.75s).',
        protocol: 'Maximum effort 25m sprint from standing start.'
      },
      { 
        id: 'run_600m', 
        name: '600m Run / Walk', 
        unit: 'min:sec', 
        description: 'Aerobic endurance capacity for campus tracks.',
        duration: 'Timed Endurance Run',
        equipment: ['Stopwatch', '400m Track'],
        scoringGuide: 'Record time in MM:SS format (e.g. 2:15).',
        protocol: 'Paced 600m continuous run/walk.'
      },
      { 
        id: 'run_long', 
        name: '1000m (Boys) / 800m (Girls)', 
        unit: 'min:sec', 
        description: 'Cardiorespiratory fitness & stamina.',
        duration: 'Timed Long Run (~3-6 minutes)',
        equipment: ['Running Track', 'Stopwatch'],
        scoringGuide: 'Record time in MM:SS format (e.g. 3:45 for 1000m or 3:10 for 800m).',
        protocol: 'Continuous run over 1000m for male students or 800m for female students.'
      },
      { 
        id: 'broad_jump', 
        name: 'Standing Broad Jump', 
        unit: 'cm', 
        description: 'Leg power & muscle velocity.',
        duration: '2 Attempts',
        equipment: ['Jump Mat / Tape'],
        scoringGuide: 'Record distance in cm.',
        protocol: 'Standing horizontal broad jump.'
      },
      { 
        id: 'shuttle_4x10', 
        name: '4×10m Shuttle Run', 
        unit: 'seconds', 
        description: 'Multi-directional agility & footwork.',
        duration: 'Timed Shuttle',
        equipment: ['Cones', 'Stopwatch'],
        scoringGuide: 'Record time in seconds.',
        protocol: 'High speed direction change run.'
      }
    ]
  }
];

// In-memory cache to prevent redundant Firestore reads and laggy UI tab switching
const schoolMemberCache: { [uid: string]: SchoolMember | null } = {};
const schoolCache: { [schoolId: string]: School | null } = {};

export const fitnessService = {
  // School Management
  saveSchool: async (school: School) => {
    const path = `schools/${school.id}`;
    try {
      await setDoc(doc(db, 'schools', school.id), school);
      schoolCache[school.id] = school; // cache
      // Also set the admin as a member
      const member = {
        uid: school.adminId,
        schoolId: school.id,
        role: 'admin',
        schoolName: school.name,
        schoolLogo: school.logoUrl
      };
      await setDoc(doc(db, 'schoolMembers', school.adminId), member, { merge: true });
      schoolMemberCache[school.adminId] = member as any; // cache
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  },

  updateSchool: async (schoolId: string, data: Partial<School>) => {
    const path = `schools/${schoolId}`;
    try {
      await setDoc(doc(db, 'schools', schoolId), data, { merge: true });
      if (schoolCache[schoolId]) {
        schoolCache[schoolId] = { ...schoolCache[schoolId]!, ...data };
      } else {
        delete schoolCache[schoolId];
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  },

  getSchool: async (schoolId: string, forceFresh = false): Promise<School | null> => {
    if (!forceFresh && schoolCache[schoolId] !== undefined) {
      return schoolCache[schoolId];
    }
    try {
      const docSnap = await getDoc(doc(db, 'schools', schoolId));
      const school = docSnap.exists() ? docSnap.data() as School : null;
      schoolCache[schoolId] = school;
      return school;
    } catch (err) {
      logError(err, 'error', { context: 'getSchool failed', schoolId });
      return null;
    }
  },

  deleteSchoolMember: async (uid: string) => {
    const path = `schoolMembers/${uid}`;
    try {
      await deleteDoc(doc(db, 'schoolMembers', uid));
      delete schoolMemberCache[uid];
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  },

  getSchoolMember: async (uid: string): Promise<SchoolMember | null> => {
    if (schoolMemberCache[uid] !== undefined && schoolMemberCache[uid] !== null) {
      return schoolMemberCache[uid];
    }
    try {
      const docSnap = await getDoc(doc(db, 'schoolMembers', uid));
      if (docSnap.exists()) {
        const res = docSnap.data() as SchoolMember;
        schoolMemberCache[uid] = res;
        return res;
      }

      // Check if there is an invited record with matching email
      const userEmail = auth.currentUser?.email;
      if (userEmail) {
        const q = query(collection(db, 'schoolMembers'), where('email', '==', userEmail));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const matchDoc = snap.docs.find(d => d.id !== uid) || snap.docs[0];
          const data = matchDoc.data();
          const memberRecord: SchoolMember = {
            uid: uid,
            schoolId: data.schoolId || `school_${uid}`,
            role: data.role || 'teacher',
            displayName: auth.currentUser?.displayName || data.displayName || 'Teacher',
            email: userEmail,
            schoolName: data.schoolName || '',
            schoolLogo: data.schoolLogo || ''
          };

          await setDoc(doc(db, 'schoolMembers', uid), memberRecord, { merge: true });
          await setDoc(doc(db, 'users', uid), {
            uid: uid,
            email: userEmail,
            displayName: memberRecord.displayName,
            schoolId: memberRecord.schoolId,
            schoolName: memberRecord.schoolName,
            schoolLogo: memberRecord.schoolLogo,
            role: memberRecord.role
          }, { merge: true });

          if (matchDoc.id.startsWith('pending_')) {
            try {
              await deleteDoc(doc(db, 'schoolMembers', matchDoc.id));
            } catch (e) {
              console.warn("Could not delete pending member doc:", e);
            }
          }

          schoolMemberCache[uid] = memberRecord;
          return memberRecord;
        }
      }

      // Check users/{uid}
      const userSnap = await getDoc(doc(db, 'users', uid));
      if (userSnap.exists()) {
        const uData = userSnap.data();
        if (uData.schoolId) {
          const memberRecord: SchoolMember = {
            uid: uid,
            schoolId: uData.schoolId,
            role: uData.role || 'teacher',
            displayName: uData.displayName || auth.currentUser?.displayName || 'Teacher',
            email: uData.email || auth.currentUser?.email || '',
            schoolName: uData.schoolName || '',
            schoolLogo: uData.schoolLogo || ''
          };
          await setDoc(doc(db, 'schoolMembers', uid), memberRecord, { merge: true });
          schoolMemberCache[uid] = memberRecord;
          return memberRecord;
        }
      }

      if (auth.currentUser) {
        const fallbackRecord: SchoolMember = {
          uid: uid,
          schoolId: `personal_${uid}`,
          role: 'teacher',
          displayName: auth.currentUser.displayName || 'Teacher',
          email: auth.currentUser.email || ''
        };
        schoolMemberCache[uid] = fallbackRecord;
        return fallbackRecord;
      }

      schoolMemberCache[uid] = null;
      return null;
    } catch (err) {
      logError(err, 'error', { context: 'getSchoolMember failed', uid });
      return null;
    }
  },

  addTeamMember: async (member: SchoolMember) => {
    try {
      await setDoc(doc(db, 'schoolMembers', member.uid), member);
      schoolMemberCache[member.uid] = member;
    } catch (err) {
      logError(err, 'error', { context: 'addTeamMember failed', memberUid: member.uid });
      throw err;
    }
  },

  getSchoolMembers: async (schoolId: string): Promise<SchoolMember[]> => {
    try {
      const q = query(collection(db, 'schoolMembers'), where('schoolId', '==', schoolId));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data() as SchoolMember);
    } catch (err) {
      logError(err, 'error', { context: 'getSchoolMembers failed', schoolId });
      return [];
    }
  },

  // Students
  saveStudent: async (student: Student) => {
    const path = `students/${student.id}`;
    if (!student.schoolId) {
      student.schoolId = `personal_${student.teacherId}`;
    }

    // Save to offline local storage immediately
    offlineCacheService.saveStudentOffline(student);

    // If online, save to Firestore
    if (typeof navigator === 'undefined' || navigator.onLine) {
      try {
        await setDoc(doc(db, 'students', student.id), student);
      } catch (err) {
        console.warn('Firestore save failed, preserved in offline queue:', err);
      }
    }
  },

  bulkSaveStudents: async (students: Student[]) => {
    // Save all to local offline cache
    students.forEach(student => {
      offlineCacheService.saveStudentOffline(student);
    });

    if (typeof navigator === 'undefined' || navigator.onLine) {
      const promises = students.map(student => setDoc(doc(db, 'students', student.id), student));
      try {
        await Promise.all(promises);
      } catch (err) {
        console.warn('Bulk Firestore write failed, preserved in offline queue:', err);
      }
    }
  },
  
  isSuperAdmin: () => {
    return isBrandSuperAdmin(auth.currentUser?.email);
  },

  getAllSchools: async (): Promise<School[]> => {
    try {
      const snapshot = await getDocs(collection(db, 'schools'));
      return snapshot.docs.map(doc => doc.data() as School);
    } catch (err) {
      logError(err, 'error', { context: 'getAllSchools failed' });
      return [];
    }
  },

  getAllRegisteredUsers: async (): Promise<any[]> => {
    try {
      const userMap = new Map<string, any>();

      // 1. Fetch from 'users' collection
      try {
        const usersSnap = await getDocs(collection(db, 'users'));
        usersSnap.docs.forEach(doc => {
          const data = doc.data();
          userMap.set(doc.id, { uid: doc.id, ...data });
        });
      } catch (e) {}

      // 2. Fetch from 'schoolMembers' collection to supplement missing users or names
      try {
        const membersSnap = await getDocs(collection(db, 'schoolMembers'));
        membersSnap.docs.forEach(doc => {
          const data = doc.data();
          const uid = data.uid || doc.id;
          const existing = userMap.get(uid);
          if (existing) {
            if (!existing.displayName && data.displayName) existing.displayName = data.displayName;
            if (!existing.email && data.email) existing.email = data.email;
            if (!existing.schoolName && data.schoolName) existing.schoolName = data.schoolName;
            if (!existing.role && data.role) existing.role = data.role;
          } else {
            userMap.set(uid, {
              uid,
              displayName: data.displayName || (data.email ? data.email.split('@')[0] : 'Educator'),
              email: data.email || '',
              schoolName: data.schoolName || 'School',
              role: data.role || 'teacher',
              workspaceType: 'school',
              createdAt: data.createdAt || new Date().toISOString()
            });
          }
        });
      } catch (e) {}

      // 3. Fetch from 'academic_programs' to supplement coaches whose records might not be in 'users'
      try {
        const progsSnap = await getDocs(collection(db, 'academic_programs'));
        progsSnap.docs.forEach(doc => {
          const prog = doc.data();
          const progName = prog.programName || 'Sports Academy';

          // Head coach
          if (prog.headCoachId) {
            const existing = userMap.get(prog.headCoachId);
            if (existing) {
              if (!existing.academyName) existing.academyName = progName;
              if (existing.workspaceType !== 'school') existing.workspaceType = 'academy';
            } else {
              userMap.set(prog.headCoachId, {
                uid: prog.headCoachId,
                displayName: prog.headCoachName || (prog.adminEmail ? prog.adminEmail.split('@')[0] : 'Head Coach'),
                email: prog.adminEmail || '',
                academyName: progName,
                role: 'admin',
                workspaceType: 'academy',
                createdAt: prog.createdAt || new Date().toISOString()
              });
            }
          }

          // Teachers list in academy
          if (Array.isArray(prog.teachersList)) {
            prog.teachersList.forEach((teacher: any, idx: number) => {
              const email = (teacher.email || '').trim().toLowerCase();
              if (email) {
                let foundUid = '';
                for (const [uid, u] of userMap.entries()) {
                  if (u.email?.toLowerCase() === email) {
                    foundUid = uid;
                    if (!u.displayName || u.displayName === 'Registered User') {
                      u.displayName = teacher.name || email.split('@')[0];
                    }
                    u.academyName = progName;
                    break;
                  }
                }
                if (!foundUid) {
                  const syntheticUid = `coach_${prog.id}_${idx}`;
                  userMap.set(syntheticUid, {
                    uid: syntheticUid,
                    displayName: teacher.name || email.split('@')[0],
                    email,
                    academyName: progName,
                    role: teacher.role || 'coach',
                    workspaceType: 'academy',
                    createdAt: teacher.addedAt || prog.createdAt || new Date().toISOString()
                  });
                }
              }
            });
          }

          // Coach emails array
          if (Array.isArray(prog.coachEmails)) {
            prog.coachEmails.forEach((cEmail: string, idx: number) => {
              const email = (cEmail || '').trim().toLowerCase();
              if (email) {
                let found = false;
                for (const u of userMap.values()) {
                  if (u.email?.toLowerCase() === email) {
                    found = true;
                    const cName = prog.coachNames?.[idx];
                    if (cName && (!u.displayName || u.displayName === 'Registered User')) {
                      u.displayName = cName;
                    }
                    break;
                  }
                }
                if (!found) {
                  const cName = prog.coachNames?.[idx] || email.split('@')[0];
                  const cUid = prog.coachUids?.[idx] || `coach_${prog.id}_c_${idx}`;
                  userMap.set(cUid, {
                    uid: cUid,
                    displayName: cName,
                    email,
                    academyName: progName,
                    role: 'coach',
                    workspaceType: 'academy',
                    createdAt: prog.createdAt || new Date().toISOString()
                  });
                }
              }
            });
          }
        });
      } catch (e) {}

      // Clean up display names: if displayName is missing, infer from email
      const result = Array.from(userMap.values()).map(u => ({
        ...u,
        displayName: u.displayName || (u.email ? u.email.split('@')[0] : 'Registered User')
      }));

      return result;
    } catch (err) {
      logError(err, 'error', { context: 'getAllRegisteredUsers failed' });
      return [];
    }
  },

  getAllAcademicPrograms: async (): Promise<any[]> => {
    try {
      const snapshot = await getDocs(collection(db, 'academic_programs'));
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (err) {
      logError(err, 'error', { context: 'getAllAcademicPrograms failed' });
      return [];
    }
  },

  getStudents: async (teacherId: string, schoolId?: string, isAdmin = false): Promise<Student[]> => {
    try {
      if (isBrandSuperAdmin(auth.currentUser?.email)) {
        const snapshot = await getDocs(collection(db, 'students'));
        const data = snapshot.docs.map((doc: any) => doc.data() as Student);
        offlineCacheService.saveStudentsToOfflineCache(data);
        return data;
      }

      let data: Student[] = [];
      const effectiveSchoolId = schoolId || (teacherId ? `personal_${teacherId}` : undefined);
      
      if (effectiveSchoolId) {
        const qSchool = query(collection(db, 'students'), where('schoolId', '==', effectiveSchoolId));
        const snapSchool = await getDocs(qSchool);
        data = snapSchool.docs.map((doc: any) => doc.data() as Student);
      }

      if (data.length === 0 && teacherId) {
        const qTeacher = query(collection(db, 'students'), where('teacherId', '==', teacherId));
        const snapTeacher = await getDocs(qTeacher);
        data = snapTeacher.docs.map((doc: any) => doc.data() as Student);
      }

      if (data.length > 0) {
        offlineCacheService.saveStudentsToOfflineCache(data);
        return data;
      }

      const cached = offlineCacheService.getStudentsFromOfflineCache();
      return cached && cached.length > 0 ? cached : data;
    } catch (err) {
      logError(err, 'error', { context: 'getStudents failed', teacherId, schoolId, isAdmin });
      const cached = offlineCacheService.getStudentsFromOfflineCache();
      return cached;
    }
  },

  deleteStudent: async (id: string, schoolId?: string) => {
    const studentPath = `students/${id}`;
    // Delete from local cache
    offlineCacheService.deleteStudentOffline(id);

    if (typeof navigator === 'undefined' || navigator.onLine) {
      try {
        let q;
        if (schoolId) {
          q = query(collection(db, 'results'), where('schoolId', '==', schoolId), where('studentId', '==', id));
        } else {
          q = query(collection(db, 'results'), where('studentId', '==', id));
        }
        const snapshot = await getDocs(q);
        
        const deletePromises = snapshot.docs.map(docSnap => deleteDoc(doc(db, 'results', docSnap.id)));
        await Promise.all(deletePromises);
        await deleteDoc(doc(db, 'students', id));
      } catch (err) {
        console.warn('Firestore delete failed, queued offline:', err);
      }
    }
  },

  bulkDeleteStudents: async (studentIds: string[], schoolId?: string, onProgress?: (processed: number, total: number) => void) => {
    if (!studentIds || studentIds.length === 0) return;
    try {
      // Process in chunks of 25 using Firestore 'in' query for results
      const chunkSize = 25;
      let processed = 0;
      const total = studentIds.length;

      for (let i = 0; i < studentIds.length; i += chunkSize) {
        const chunk = studentIds.slice(i, i + chunkSize);
        
        // 1. Delete associated test results for chunk of students
        let resultsQuery;
        if (schoolId) {
          resultsQuery = query(collection(db, 'results'), where('schoolId', '==', schoolId), where('studentId', 'in', chunk));
        } else {
          resultsQuery = query(collection(db, 'results'), where('studentId', 'in', chunk));
        }

        const resultsSnap = await getDocs(resultsQuery);
        const resultDeletePromises = resultsSnap.docs.map(docSnap => deleteDoc(doc(db, 'results', docSnap.id)));
        await Promise.all(resultDeletePromises);

        // 2. Delete student docs
        const studentDeletePromises = chunk.map(id => deleteDoc(doc(db, 'students', id)));
        await Promise.all(studentDeletePromises);

        processed += chunk.length;
        if (onProgress) {
          onProgress(processed, total);
        }
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, 'bulk_students_delete');
      throw err;
    }
  },

  // Teams
  saveTeam: async (team: Team) => {
    const path = `teams/${team.id}`;
    try {
      await setDoc(doc(db, 'teams', team.id), team);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  },

  getTeams: async (teacherId: string, schoolId?: string, isAdmin = false): Promise<Team[]> => {
    try {
      if (isBrandSuperAdmin(auth.currentUser?.email)) {
        const snapshot = await getDocs(collection(db, 'teams'));
        return snapshot.docs.map((doc: any) => doc.data() as Team);
      }
      
      let data: Team[] = [];
      const effectiveSchoolId = schoolId || (teacherId ? `personal_${teacherId}` : undefined);
      if (effectiveSchoolId) {
        const qSchool = query(collection(db, 'teams'), where('schoolId', '==', effectiveSchoolId));
        const snapSchool = await getDocs(qSchool);
        data = snapSchool.docs.map((doc: any) => doc.data() as Team);
      }

      if (data.length === 0 && teacherId) {
        const qTeacher = query(collection(db, 'teams'), where('teacherId', '==', teacherId));
        const snapTeacher = await getDocs(qTeacher);
        data = snapTeacher.docs.map((doc: any) => doc.data() as Team);
      }

      return data;
    } catch (err) {
      logError(err, 'error', { context: 'getTeams failed', teacherId, schoolId, isAdmin });
      return [];
    }
  },

  // Results
  saveResult: async (result: FitnessResult) => {
    const path = `results/${result.id}`;
    // Default schoolId for records not specifically linked
    if (!result.schoolId) {
      result.schoolId = `personal_${result.teacherId}`;
    }
    try {
      await setDoc(doc(db, 'results', result.id), result);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  },

  getRecentResults: async (teacherId: string, schoolId?: string, isAdmin = false, limitCount = 10): Promise<FitnessResult[]> => {
    try {
      let q;
      const effectiveSchoolId = schoolId || (teacherId ? `personal_${teacherId}` : undefined);
      if (isBrandSuperAdmin(auth.currentUser?.email)) {
        q = query(
          collection(db, 'results'), 
          orderBy('date', 'desc'),
          limit(limitCount)
        );
      } else if (effectiveSchoolId) {
        q = query(
          collection(db, 'results'), 
          where('schoolId', '==', effectiveSchoolId),
          orderBy('date', 'desc'),
          limit(limitCount)
        );
      } else {
        q = query(
          collection(db, 'results'), 
          where('teacherId', '==', teacherId),
          orderBy('date', 'desc'),
          limit(limitCount)
        );
      }
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc: any) => doc.data() as FitnessResult);
    } catch (err) {
      logError(err, 'error', { context: 'getRecentResults failed', teacherId, schoolId, isAdmin });
      return [];
    }
  },

  // Real-time listeners
  deleteResult: async (id: string) => {
    const path = `results/${id}`;
    try {
      await deleteDoc(doc(db, 'results', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  },

  subscribeToResults: (teacherId: string, schoolId: string | undefined, isAdmin: boolean, callback: (results: FitnessResult[]) => void) => {
    let q;
    const effectiveSchoolId = schoolId || `personal_${teacherId}`;
    if (isBrandSuperAdmin(auth.currentUser?.email)) {
      q = query(
        collection(db, 'results'), 
        limit(5000)
      );
    } else {
      q = query(
        collection(db, 'results'), 
        where('schoolId', '==', effectiveSchoolId),
        limit(5000)
      );
    }
    return onSnapshot(q, (snapshot: any) => {
      const results = snapshot.docs.map((doc: any) => doc.data() as FitnessResult);
      // Sort locally by date desc
      results.sort((a: FitnessResult, b: FitnessResult) => new Date(b.date).getTime() - new Date(a.date).getTime());
      callback(results);
    }, (error: any) => {
      console.warn("Firestore results subscription notice:", error?.message || error);
    });
  },

  subscribeToStudentResults: (studentId: string, schoolId: string | undefined, callback: (results: FitnessResult[]) => void) => {
    const effectiveSchoolId = schoolId || (auth.currentUser ? `personal_${auth.currentUser.uid}` : '');
    const q = query(
      collection(db, 'results'), 
      where('schoolId', '==', effectiveSchoolId),
      where('studentId', '==', studentId)
    );
    return onSnapshot(q, (snapshot: any) => {
      const results = snapshot.docs.map((doc: any) => doc.data() as FitnessResult);
      // Sort locally by date desc
      results.sort((a: FitnessResult, b: FitnessResult) => new Date(b.date).getTime() - new Date(a.date).getTime());
      callback(results);
    }, (error: any) => {
      console.warn("Firestore student results subscription notice:", error?.message || error);
    });
  },

  getAllSchoolResultsOnce: async (teacherId: string, schoolId?: string, isAdmin = false): Promise<FitnessResult[]> => {
    try {
      let q;
      const effectiveSchoolId = schoolId || `personal_${teacherId}`;
      if (isBrandSuperAdmin(auth.currentUser?.email)) {
        q = query(collection(db, 'results'));
      } else {
        q = query(collection(db, 'results'), where('schoolId', '==', effectiveSchoolId));
      }
      const snapshot = await getDocs(q);
      const results = snapshot.docs.map((doc: any) => doc.data() as FitnessResult);
      results.sort((a: FitnessResult, b: FitnessResult) => new Date(b.date).getTime() - new Date(a.date).getTime());
      return results;
    } catch (err) {
      logError(err, 'error', { context: 'getAllSchoolResultsOnce failed' });
      return [];
    }
  },

  subscribeToStudents: (teacherId: string, schoolId: string | undefined, isAdmin: boolean, callback: (students: Student[]) => void) => {
    let q;
    const effectiveSchoolId = schoolId || `personal_${teacherId}`;
    if (isBrandSuperAdmin(auth.currentUser?.email)) {
      q = query(collection(db, 'students'));
    } else {
      q = query(collection(db, 'students'), where('schoolId', '==', effectiveSchoolId));
    }

    // Immediately trigger callback with offline cache if available for instant non-blocking load
    const cachedStudents = offlineCacheService.getStudentsFromOfflineCache();
    if (cachedStudents.length > 0) {
      callback(cachedStudents);
    }

    return onSnapshot(q, (snapshot: any) => {
      const data = snapshot.docs.map((doc: any) => doc.data() as Student);
      // Cache latest students locally
      offlineCacheService.saveStudentsToOfflineCache(data);
      callback(data);
    }, (error: any) => {
      console.warn("Firestore students subscription notice (fallback to offline):", error?.message || error);
      const offlineStudents = offlineCacheService.getStudentsFromOfflineCache();
      callback(offlineStudents);
    });
  },

  subscribeToTeams: (teacherId: string, schoolId: string | undefined, isAdmin: boolean, callback: (teams: Team[]) => void) => {
    let q;
    const effectiveSchoolId = schoolId || `personal_${teacherId}`;
    if (isBrandSuperAdmin(auth.currentUser?.email)) {
      q = query(collection(db, 'teams'));
    } else {
      q = query(collection(db, 'teams'), where('schoolId', '==', effectiveSchoolId));
    }
    return onSnapshot(q, (snapshot: any) => {
      callback(snapshot.docs.map((doc: any) => doc.data() as Team));
    }, (error: any) => {
      console.warn("Firestore teams subscription notice:", error?.message || error);
    });
  },

  // Helper to match grade variations (e.g., '12', 'Grade 12', 'Class 12', 'XII', '12th')
  isGradeMatching: (studentGrade: string | number | undefined, targetGrade: string): boolean => {
    if (!studentGrade) return false;
    if (targetGrade === 'ALL' || targetGrade === 'all') return true;
    const sGrade = studentGrade.toString().trim().toUpperCase();
    const tGrade = targetGrade.toString().trim().toUpperCase();
    if (sGrade === tGrade) return true;

    const cleanS = sGrade.replace(/[^0-9]/g, '');
    const cleanT = tGrade.replace(/[^0-9]/g, '');
    if (cleanS && cleanT && cleanS === cleanT) return true;

    const romanMap: Record<string, string> = {
      'I': '1', 'II': '2', 'III': '3', 'IV': '4', 'V': '5',
      'VI': '6', 'VII': '7', 'VIII': '8', 'IX': '9', 'X': '10',
      'XI': '11', 'XII': '12', '11TH': '11', '12TH': '12'
    };
    const normS = romanMap[sGrade] || cleanS || sGrade;
    const normT = romanMap[tGrade] || cleanT || tGrade;
    return normS === normT;
  },

  // Helper to get battery by grade
  getBatteryForGrade: (grade: string | number): KIFTBattery | undefined => {
    if (grade === undefined || grade === null) return undefined;
    const strGrade = grade.toString().trim().toUpperCase();
    const cleanNum = strGrade.replace(/[^0-9]/g, '');

    // Exact grade array match or clean numeric grade match
    const matched = KIFT_BATTERIES.find(b => 
      b.grades.includes(strGrade) || 
      (cleanNum !== '' && b.grades.includes(cleanNum))
    );
    if (matched) return matched;

    // Roman numeral mapping for classes (e.g., 'XII' -> '12', 'XI' -> '11')
    const romanMap: Record<string, string> = {
      'I': '1', 'II': '2', 'III': '3', 'IV': '4', 'V': '5',
      'VI': '6', 'VII': '7', 'VIII': '8', 'IX': '9', 'X': '10',
      'XI': '11', 'XII': '12', '11TH': '11', '12TH': '12'
    };
    const mapped = romanMap[strGrade];
    if (mapped) {
      return KIFT_BATTERIES.find(b => b.grades.includes(mapped));
    }

    return undefined;
  },

  // CBSE Practical Assessments (30 Marks System)
  savePracticalAssessment: async (assessment: PracticalAssessment) => {
    const path = `practical_assessments/${assessment.id}`;
    if (!assessment.schoolId) {
      assessment.schoolId = `personal_${assessment.teacherId}`;
    }
    // Local storage persistence
    try {
      const stored = localStorage.getItem('smartpe_practical_assessments') || '[]';
      const parsed: PracticalAssessment[] = JSON.parse(stored);
      const updated = [assessment, ...parsed.filter(p => p.id !== assessment.id)];
      localStorage.setItem('smartpe_practical_assessments', JSON.stringify(updated.slice(0, 1000)));
    } catch (e) {
      console.warn("Local practical storage write error:", e);
    }

    if (typeof navigator === 'undefined' || navigator.onLine) {
      try {
        await setDoc(doc(db, 'practical_assessments', assessment.id), assessment);
      } catch (err) {
        console.warn('Firestore practical assessment save failed, cached locally:', err);
      }
    }
  },

  bulkSavePracticalAssessments: async (assessments: PracticalAssessment[]) => {
    try {
      const stored = localStorage.getItem('smartpe_practical_assessments') || '[]';
      const parsed: PracticalAssessment[] = JSON.parse(stored);
      const map = new Map<string, PracticalAssessment>();
      assessments.forEach(a => map.set(a.id, a));
      parsed.forEach(p => {
        if (!map.has(p.id)) map.set(p.id, p);
      });
      localStorage.setItem('smartpe_practical_assessments', JSON.stringify(Array.from(map.values()).slice(0, 1000)));
    } catch (e) {
      console.warn("Local practical bulk storage write error:", e);
    }

    if (typeof navigator === 'undefined' || navigator.onLine) {
      try {
        const promises = assessments.map(a => setDoc(doc(db, 'practical_assessments', a.id), a));
        await Promise.all(promises);
      } catch (err) {
        console.warn('Firestore practical assessment bulk save failed:', err);
      }
    }
  },

  getPracticalAssessments: async (teacherId: string, schoolId?: string): Promise<PracticalAssessment[]> => {
    try {
      let q;
      const effectiveSchoolId = schoolId || `personal_${teacherId}`;
      if (isBrandSuperAdmin(auth.currentUser?.email)) {
        q = query(collection(db, 'practical_assessments'), limit(2000));
      } else {
        q = query(collection(db, 'practical_assessments'), where('schoolId', '==', effectiveSchoolId), limit(2000));
      }
      const snapshot = await getDocs(q);
      const list = snapshot.docs.map(doc => doc.data() as PracticalAssessment);
      if (list.length > 0) {
        return list;
      }
    } catch (err) {
      console.warn('Firestore practical assessment fetch failed, reading local storage:', err);
    }

    // Fallback to local storage
    try {
      const stored = localStorage.getItem('smartpe_practical_assessments');
      if (stored) {
        const parsed: PracticalAssessment[] = JSON.parse(stored);
        return parsed;
      }
    } catch (e) {
      console.warn("Error reading local practical storage:", e);
    }
    return [];
  },

  deletePracticalAssessment: async (id: string) => {
    try {
      const stored = localStorage.getItem('smartpe_practical_assessments') || '[]';
      const parsed: PracticalAssessment[] = JSON.parse(stored);
      const filtered = parsed.filter(p => p.id !== id);
      localStorage.setItem('smartpe_practical_assessments', JSON.stringify(filtered));
    } catch (e) {
      console.warn("Error deleting from local practical storage:", e);
    }

    if (typeof navigator === 'undefined' || navigator.onLine) {
      try {
        await deleteDoc(doc(db, 'practical_assessments', id));
      } catch (err) {
        console.warn("Error deleting practical assessment from Firestore:", err);
      }
    }
  },

  subscribeToPracticalAssessments: (teacherId: string, schoolId: string | undefined, callback: (assessments: PracticalAssessment[]) => void) => {
    // Initial local read
    try {
      const stored = localStorage.getItem('smartpe_practical_assessments');
      if (stored) {
        callback(JSON.parse(stored));
      }
    } catch (e) {
      // ignore
    }

    let q;
    const effectiveSchoolId = schoolId || `personal_${teacherId}`;
    if (isBrandSuperAdmin(auth.currentUser?.email)) {
      q = query(collection(db, 'practical_assessments'), limit(2000));
    } else {
      q = query(collection(db, 'practical_assessments'), where('schoolId', '==', effectiveSchoolId), limit(2000));
    }

    return onSnapshot(q, (snapshot: any) => {
      const data = snapshot.docs.map((doc: any) => doc.data() as PracticalAssessment);
      try {
        localStorage.setItem('smartpe_practical_assessments', JSON.stringify(data));
      } catch (e) {
        // ignore
      }
      callback(data);
    }, (error: any) => {
      console.warn("Firestore subscription error for practical_assessments:", error);
    });
  }
};
