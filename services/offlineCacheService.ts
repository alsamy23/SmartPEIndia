import { Student, LessonPlan, BoardType, Language } from '../types.ts';
import { SavedItem, storageService } from './storageService.ts';

const OFFLINE_STUDENTS_KEY = 'smartpe_offline_students';
const PENDING_STUDENTS_KEY = 'smartpe_pending_student_sync';
const OFFLINE_LAST_SYNC_KEY = 'smartpe_students_last_sync';

export interface PendingStudentSync {
  student: Student;
  action: 'create' | 'update' | 'delete';
  timestamp: number;
}

// Pre-packaged offline PE Lesson Plan templates for outdoor field sessions
export const PRELOADED_OFFLINE_LESSON_PLANS: (SavedItem & { id: string })[] = [
  {
    id: 'offline_lp_football_dribbling',
    type: 'Lesson Plan',
    title: 'Football - Ball Control & Dribbling Skills (Grade 6-8)',
    timestamp: Date.now() - 86400000 * 2,
    metadata: { sport: 'Football', grade: '6-8', topic: 'Dribbling & Ball Control', date: new Date().toISOString().split('T')[0] },
    content: {
      teacher: 'PE Coach',
      subject: 'Physical Education',
      grade: '6-8',
      date: new Date().toISOString().split('T')[0],
      topic: 'Football - Dribbling with Inside/Outside of Foot',
      period: '1',
      termWeek: 'Term 1 / Wk 2',
      duration: '40 Minutes',
      equipment: ['15 Cones', '10 Footballs', '8 Bibs', '1 Whistle', '1 Stopwatch'],
      teachingAids: ['Whistle', 'Tactical Clipboard', 'Marker Discs'],
      safety: ['Ensure pitch is clear of loose rocks/debris', 'Shin guards recommended', 'Keep distance between slalom lanes'],
      keyVocabulary: ['Instep', 'Dribbling', 'Spatial Awareness', 'Ball Control'],
      sen: {
        wave1: 'Wider cone gates for students needing larger target zones.',
        wave2: 'Partner assistance with guided foot touch cues.',
        wave3: 'Stationary ball control and gentle tapping drills.'
      },
      objectives: {
        know: 'Master close ball control using inside and outside instep while moving at variable pace.',
        understand: 'Demonstrate spatial awareness when changing directions past cones or defenders.',
        beAbleTo: 'Apply controlled dribbling in small-sided 4v4 game situations.'
      },
      successCriteria: {
        all: 'Maintain ball control within 1.5m during slalom dribbling.',
        most: 'Dribble smoothly using both feet while keeping head elevated.',
        some: 'Execute deceptive cuts and maintain possession against active pressure.'
      },
      starter: {
        time: '8 min',
        title: 'Dynamic Pulse Raiser & Movement Prep',
        description: 'Dynamic jogging with high knees, butt kicks, arm circles, and quick shuttle sprints.'
      },
      mainActivity: {
        time: '25 min',
        activities: [
          {
            title: 'Cone Slalom Dribble',
            description: 'Dribble through a line of 6 cones using short, soft touches with the inside of right/left foot.',
            coachingPoints: ['Use pinky toe touch for outside cuts', 'Keep knees bent and center of gravity low', 'Soft, rhythmic taps']
          },
          {
            title: 'Box Dribble & Cut',
            description: 'Dribble inside a 10x10m square, execute an inside-hook turn on coach whistle signal.',
            coachingPoints: ['Plant non-kicking foot firmly', 'Accelerate immediately after executing the turn', 'Scan space before turning']
          },
          {
            title: '4v4 Mini Game with 3-Touch Minimum',
            description: 'Small-sided 4v4 game on a 25x15m pitch with mini goals. Teams must complete at least 3 dribble touches before passing.',
            coachingPoints: ['Communicate with teammates', 'Protect the ball using body positioning', 'Transition quickly from defense to attack']
          }
        ]
      },
      plenary: {
        time: '7 min',
        title: 'Cool Down & Technical Review',
        description: 'Light walk around pitch, calf and hamstring stretches, guided reflection on foot control.'
      },
      homework: 'Practice 10 minutes of daily two-foot sole taps and inside-outside touches at home.',
      collaboration: 'Pair dribble challenges and supportive team communication.',
      differentiation: 'Vary lane distance from 1.5m to 3m based on skill tier.',
      criticalThinking: 'Ask students when it is advantageous to dribble versus passing early.',
      warmupDiagramPrompt: 'Grid layout with cones spaced 2m apart for shuttle dribbling drills',
      explanationDiagramPrompt: 'Demonstration of inside instep touch and stopping ball with sole of foot',
      gameDiagramPrompt: '25x15m pitch with 2 mini goal posts and 4 player teams in distinct bibs'
    } as LessonPlan
  },
  {
    id: 'offline_lp_basketball_passing',
    type: 'Lesson Plan',
    title: 'Basketball - Chest Pass & Bounce Pass Mechanics (Grade 9-10)',
    timestamp: Date.now() - 86400000 * 3,
    metadata: { sport: 'Basketball', grade: '9-10', topic: 'Chest & Bounce Passing', date: new Date().toISOString().split('T')[0] },
    content: {
      teacher: 'PE Coach',
      subject: 'Physical Education',
      grade: '9-10',
      date: new Date().toISOString().split('T')[0],
      topic: 'Chest Pass, Bounce Pass & Receiving Position',
      period: '1',
      termWeek: 'Term 1 / Wk 3',
      duration: '45 Minutes',
      equipment: ['12 Basketballs', '10 Cones', '2 Whistles', 'Marking Tape'],
      teachingAids: ['Whistle', 'Floor Marking Dots', 'Court Diagram'],
      safety: ['Maintain safe distance between pairs to prevent stray ball collisions', 'Ensure court surface is dry and slip-free'],
      keyVocabulary: ['Triple Threat', 'Snap Release', 'Follow-Through', 'Pivot Foot'],
      sen: {
        wave1: 'Use slightly lighter basketballs and shorter passing distances.',
        wave2: 'Assign experienced partner for stationary passing cues.',
        wave3: 'Seated or chest-height bounce pass against a rebound wall.'
      },
      objectives: {
        know: 'Execute chest pass with thumbs pointing down and wrists snapping outward.',
        understand: 'Execute bounce pass hitting floor 2/3 distance toward the receiver.',
        beAbleTo: 'Adopt triple-threat receiving stance upon catching the ball in live drills.'
      },
      successCriteria: {
        all: 'Step into passes and push from the chest towards receiver.',
        most: 'Consistent thumb-down wrist snap and accurate 2/3 distance bounce pass.',
        some: 'Deliver crisp passes under defender pressure with no telegraphing.'
      },
      starter: {
        time: '10 min',
        title: 'Dribble Tag & Shoulder Warmup',
        description: 'Basketball dribble tag inside the half-court key followed by dynamic shoulder and torso rotations.'
      },
      mainActivity: {
        time: '25 min',
        activities: [
          {
            title: 'Stationary Pair Passing',
            description: 'Stationary partners 4m apart practice 20 chest passes and 20 bounce passes with step-through motion.',
            coachingPoints: ['Step forward with dominant foot', 'Snap wrists outward with thumbs pointed down', 'Target teammate chest level']
          },
          {
            title: '3-Player Running Weave',
            description: 'Running across court passing in 3-player lanes finishing with an uncontested layup.',
            coachingPoints: ['Lead the receiver with pass in stride', 'Call out teammate name', 'Run behind the player you just passed to']
          },
          {
            title: '5v5 Half-Court 5-Pass Game',
            description: '5v5 Half-Court Game with 5-pass rule: Every possession must complete 5 successful passes before taking a shot.',
            coachingPoints: ['V-cut to create separation from defender', 'Make bounce passes around outstretched arms', 'Maintain triple-threat stance']
          }
        ]
      },
      plenary: {
        time: '10 min',
        title: 'Cool Down & Passing Review',
        description: 'Gentle walk, shoulder and wrist extensor stretches, group debrief on passing accuracy.'
      },
      homework: 'Wall passing drills (50 chest passes, 50 bounce passes) focusing on wrist snap.',
      collaboration: 'Encourage constant vocal communication on court.',
      differentiation: 'Adjust distance from 3m to 6m based on arm strength.',
      criticalThinking: 'Ask students why bounce passes are harder to intercept than chest passes.',
      warmupDiagramPrompt: 'Half court grid with students dribbling while attempting to tag partners',
      explanationDiagramPrompt: 'Biomechanical wrist snap and thumb rotation for chest and bounce passes',
      gameDiagramPrompt: 'Half court 5v5 positioning with passing trajectories'
    } as LessonPlan
  },
  {
    id: 'offline_lp_athletics_sprint',
    type: 'Lesson Plan',
    title: 'Athletics - 100m Crouch Start & Sprint Acceleration (Grade 5-8)',
    timestamp: Date.now() - 86400000 * 4,
    metadata: { sport: 'Athletics', grade: '5-8', topic: 'Sprint Start & Acceleration', date: new Date().toISOString().split('T')[0] },
    content: {
      teacher: 'PE Coach',
      subject: 'Physical Education',
      grade: '5-8',
      date: new Date().toISOString().split('T')[0],
      topic: '100m Crouch Start Commands & High Knee Acceleration',
      period: '1',
      termWeek: 'Term 1 / Wk 4',
      duration: '40 Minutes',
      equipment: ['10 Cones', '1 Starting Clapper/Whistle', '2 Stopwatches', 'Measuring Tape'],
      teachingAids: ['Starting Clapper', 'Start Line Tape', 'Stopwatch'],
      safety: ['Ensure track is dry and non-slippery', 'Allow 5m deceleration space past finish line'],
      keyVocabulary: ['Crouch Start', 'Drive Phase', 'Reaction Time', 'Arm Cadence'],
      sen: {
        wave1: 'Standing start option for students with knee or ankle mobility restrictions.',
        wave2: 'Visual start cue (hand drop) alongside whistle for auditory sensitivity.',
        wave3: 'Reduced sprint distance (15m-20m) with extended rest intervals.'
      },
      objectives: {
        know: 'Demonstrate "On Your Marks", "Set", and "Go" crouch start positioning.',
        understand: 'Maintain drive phase angle for the first 15 meters of sprint.',
        beAbleTo: 'Execute high knee drive, relaxed shoulders, and 90-degree arm swing in sprints.'
      },
      successCriteria: {
        all: 'Respond quickly to start commands and complete the sprint without slowing prematurely.',
        most: 'Hips held higher than shoulders in "Set" position with explosive initial push.',
        some: 'Seamless transition from drive phase angle into upright maximum-velocity sprinting.'
      },
      starter: {
        time: '10 min',
        title: 'ABC Running Warmup Drills',
        description: 'High knees, A-skips, B-skips, heel kicks, and 3x20m progressive strideouts.'
      },
      mainActivity: {
        time: '23 min',
        activities: [
          {
            title: 'Crouch Start Mechanics & Commands',
            description: 'Practice "On Your Marks" (knee down, fingers arched behind line) & "Set" (hips elevated above shoulders).',
            coachingPoints: ['Fingers arched behind the line', 'Head neutral looking down at track', 'Weight balanced over hands and lead foot']
          },
          {
            title: '15m Drive Phase Explosion Runs',
            description: 'Sprint out from crouch start focusing on low head and aggressive arm drives for first 15m.',
            coachingPoints: ['Drive elbows back violently', 'Push the ground away behind you', 'Do not pop upright on step 1']
          },
          {
            title: '4x50m Shuttle Relay Challenge',
            description: '4x50m sprint relay teams competing with baton handoffs in designated exchange zones.',
            coachingPoints: ['Hold baton firmly at lower third', 'Match incoming runner pace', 'Communicate handoff with clear visual/verbal cues']
          }
        ]
      },
      plenary: {
        time: '7 min',
        title: 'Cool Down & Sprint Analysis',
        description: '400m slow cooldown jog, quad, calf, and groin stretches.'
      },
      homework: 'Wall-drive drills (3 sets of 10 knee drives per leg) for sprint angle muscle memory.',
      collaboration: 'Cheering teammates in relay races and timing each other with stopwatches.',
      differentiation: 'Allow starting blocks or tiered lane starts for equalized competition.',
      criticalThinking: 'Discuss how reaction time and initial 10m drive dictate 100m sprint success.',
      warmupDiagramPrompt: 'Straight track lanes with cones marking 10m, 20m, 30m sprint zones',
      explanationDiagramPrompt: 'Side profile angle showing On Your Marks, Set, and Explosive Start body angles',
      gameDiagramPrompt: '4-lane 50m track layout with baton exchange box highlighted'
    } as LessonPlan
  }
];

export const offlineCacheService = {
  // Save fetched student directory to local storage for offline use
  saveStudentsToOfflineCache: (students: Student[]): void => {
    try {
      localStorage.setItem(OFFLINE_STUDENTS_KEY, JSON.stringify(students));
      localStorage.setItem(OFFLINE_LAST_SYNC_KEY, Date.now().toString());
    } catch (e) {
      console.warn('Failed to save students to offline cache:', e);
    }
  },

  // Retrieve cached student directory
  getStudentsFromOfflineCache: (): Student[] => {
    try {
      const data = localStorage.getItem(OFFLINE_STUDENTS_KEY);
      if (!data) return [];
      return JSON.parse(data) as Student[];
    } catch (e) {
      console.error('Failed to read offline students cache:', e);
      return [];
    }
  },

  // Save a student offline (creates or updates in local cache and enqueues sync)
  saveStudentOffline: (student: Student): Student[] => {
    const currentStudents = offlineCacheService.getStudentsFromOfflineCache();
    const index = currentStudents.findIndex(s => s.id === student.id);
    
    if (index >= 0) {
      currentStudents[index] = student;
    } else {
      currentStudents.unshift(student);
    }

    // Save updated list
    offlineCacheService.saveStudentsToOfflineCache(currentStudents);

    // Queue for background server sync
    offlineCacheService.enqueueStudentSync(student, index >= 0 ? 'update' : 'create');

    return currentStudents;
  },

  // Delete student offline
  deleteStudentOffline: (studentId: string): Student[] => {
    const currentStudents = offlineCacheService.getStudentsFromOfflineCache();
    const filtered = currentStudents.filter(s => s.id !== studentId);
    offlineCacheService.saveStudentsToOfflineCache(filtered);

    // Find student for sync
    const target = currentStudents.find(s => s.id === studentId);
    if (target) {
      offlineCacheService.enqueueStudentSync(target, 'delete');
    }
    return filtered;
  },

  // Queue changes made offline
  enqueueStudentSync: (student: Student, action: 'create' | 'update' | 'delete'): void => {
    try {
      const queue = offlineCacheService.getPendingStudentSyncQueue();
      // Remove existing pending items for same student if any
      const filtered = queue.filter(item => item.student.id !== student.id);
      filtered.push({
        student,
        action,
        timestamp: Date.now()
      });
      localStorage.setItem(PENDING_STUDENTS_KEY, JSON.stringify(filtered));
    } catch (e) {
      console.error('Failed to enqueue offline student sync:', e);
    }
  },

  // Get pending queue
  getPendingStudentSyncQueue: (): PendingStudentSync[] => {
    try {
      const data = localStorage.getItem(PENDING_STUDENTS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },

  // Clear queue after successful sync
  clearPendingStudentSyncQueue: (): void => {
    localStorage.removeItem(PENDING_STUDENTS_KEY);
  },

  // Get saved lesson plans including preloaded field templates
  getOfflineLessonPlans: (): SavedItem[] => {
    const userSaved = storageService.getAllItems();
    // Combine user saved plans with preloaded field templates if user hasn't saved them yet
    const existingIds = new Set(userSaved.map(item => item.id));
    const merged = [...userSaved];

    PRELOADED_OFFLINE_LESSON_PLANS.forEach(template => {
      if (!existingIds.has(template.id)) {
        merged.push(template);
      }
    });

    return merged;
  },

  // Get sync status metadata
  getOfflineStatus: (): { isOffline: boolean; cachedStudentCount: number; pendingSyncCount: number; lastSyncTime: number | null } => {
    const isOffline = typeof navigator !== 'undefined' ? !navigator.onLine : false;
    const cachedStudents = offlineCacheService.getStudentsFromOfflineCache();
    const pendingQueue = offlineCacheService.getPendingStudentSyncQueue();
    const lastSyncStr = localStorage.getItem(OFFLINE_LAST_SYNC_KEY);

    return {
      isOffline,
      cachedStudentCount: cachedStudents.length,
      pendingSyncCount: pendingQueue.length,
      lastSyncTime: lastSyncStr ? parseInt(lastSyncStr, 10) : null
    };
  }
};
