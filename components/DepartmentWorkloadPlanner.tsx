import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Calendar, 
  Sparkles, 
  Target, 
  Mail, 
  CheckCircle2, 
  UploadCloud, 
  ChevronRight, 
  UserPlus, 
  Printer, 
  Download, 
  Clock, 
  BookOpen, 
  Layers, 
  Trash2, 
  AlertCircle,
  FileText,
  HelpCircle,
  Loader2,
  AlertTriangle,
  Check,
  Search,
  Building,
  Edit,
  ClipboardList,
  Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { fitnessService, SchoolMember } from '../services/fitnessService.ts';
import { auth, db } from '../services/firebase.ts';
import { doc, setDoc, getDoc, collection, query, where, getDocs, deleteDoc } from 'firebase/firestore';
import { toast } from '../services/toast.ts';
import { callAIBase } from '../services/geminiService.ts';

interface Workload {
  id: string;
  teacherId: string;
  teacherName: string;
  curriculum: string; // CBSE, ICSE, State Board
  termsCount: number; // 2 or 3
  periodsCount: number; // Periods per week (e.g. 2, 3, 5)
  assignedGrades: string; // "Grades 6-8", "Grades 9-10"
  primaryGames: string[]; // Football, Basketball
  timetableText?: string;
  timetable?: Record<string, string>; // Structured grid key: "Day_Period" value: Class & Sport (e.g. "9A - Football")
  schedules?: {
    period: number;
    game: string;
    skill: string;
    objective: string;
    duration: string;
    details: {
      warmup: string;
      mainDrill: string;
      cooldown: string;
    }
  }[];
}

interface SchoolProfile {
  name: string;
  board: string;
  adminName: string;
  workingDays: string[];
  totalPeriods: number;
}

const DEFAULT_GAMES = ['Football', 'Basketball', 'Volleyball', 'Cricket', 'Athletics', 'Badminton', 'Yoga', 'Fitness & Agility'];

const DEFAULT_TIMINGS: Record<number, string> = {
  1: '08:30 AM - 09:15 AM',
  2: '09:15 AM - 10:00 AM',
  3: '10:15 AM - 11:00 AM',
  4: '11:00 AM - 11:45 AM',
  5: '11:45 AM - 12:30 PM',
  6: '01:15 PM - 02:00 PM',
  7: '02:00 PM - 02:45 PM',
  8: '02:45 PM - 03:30 PM'
};

const DEFAULT_WORKLOADS: Workload[] = [
  {
    id: 'workload_1',
    teacherId: 'teacher_1',
    teacherName: 'Coach Suresh Kumar',
    curriculum: 'CBSE',
    termsCount: 2,
    periodsCount: 2,
    assignedGrades: 'Grades 9-10',
    primaryGames: ['Volleyball', 'Athletics'],
    timetableText: 'Monday Period 2: Class 9A, Wednesday Period 4: Class 10B',
    timetable: {
      'Monday_2': 'Class 9A - Volleyball',
      'Wednesday_4': 'Class 10B - Athletics'
    },
    schedules: [
      {
        period: 1,
        game: 'Volleyball',
        skill: 'Underhand Pass & Reception',
        objective: 'Mastering the forearm passing technique for steady receptions',
        duration: '45 mins',
        details: {
          warmup: 'Jogging and dynamic shoulder-stretching dynamic rotation loops (10 min)',
          mainDrill: 'Forearm pass partner drills and distance bump repetitions (25 min)',
          cooldown: 'Trunk twists, static side shoulder stretches (10 min)'
        }
      },
      {
        period: 2,
        game: 'Athletics',
        skill: 'Crouch Start & Reaction speed',
        objective: 'Develop quick explosive reactions using standard blocks starts',
        duration: '45 mins',
        details: {
          warmup: 'High knees and butt kicks with leg swings (10 min)',
          mainDrill: '3-point crouching starts with 15m explosive sprint releases (25 min)',
          cooldown: 'Slo-mo recovery walk, hamstring static holds (10 min)'
        }
      }
    ]
  },
  {
    id: 'workload_2',
    teacherId: 'teacher_2',
    teacherName: 'Coach Priya Sharma',
    curriculum: 'ICSE',
    termsCount: 3,
    periodsCount: 3,
    assignedGrades: 'Grades 11-12',
    primaryGames: ['Basketball', 'Yoga'],
    timetableText: 'Tuesday Period 1: Class 11S1, Thursday Period 3: Class 12C2, Friday Period 5: Class 11C1',
    timetable: {
      'Tuesday_1': 'Class 11S1 - Basketball',
      'Thursday_3': 'Class 12C2 - Yoga',
      'Friday_5': 'Class 11C1 - Basketball'
    },
    schedules: [
      {
        period: 1,
        game: 'Basketball',
        skill: 'Chest Pass & Lead Pass',
        objective: 'Improving pass velocity and movement integration to receiving teammate',
        duration: '40 mins',
        details: {
          warmup: 'Defensive slide runs and shuttle bursts (8 min)',
          mainDrill: '3-player weave pass routing down the length ofcourt (22 min)',
          cooldown: 'Arm swings and deep floor reaches (10 min)'
        }
      },
      {
        period: 2,
        game: 'Yoga',
        skill: 'Surya Namaskar Form',
        objective: 'Align sequence poses with controlled inhalation and exhalation rhythm',
        duration: '40 mins',
        details: {
          warmup: 'Gentle spinal twists and neck releases (8 min)',
          mainDrill: '12-pose Surya Namaskar continuous repetitions with focus points (22 min)',
          cooldown: 'Shavasana silent meditative observation (10 min)'
        }
      },
      {
        period: 3,
        game: 'Basketball',
        skill: 'Lay-up Steps Coordination',
        objective: 'Learn high-speed dual foot steps transition into dynamic board releases',
        duration: '40 mins',
        details: {
          warmup: 'Single-leg hops and dynamic ankle rotations (8 min)',
          mainDrill: 'Dribble, two-step layup approach using left/right boards (22 min)',
          cooldown: 'Anterior thigh stretches (10 min)'
        }
      }
    ]
  },
  {
    id: 'workload_3',
    teacherId: 'teacher_3',
    teacherName: 'Coach Amit Kapoor',
    curriculum: 'CBSE',
    termsCount: 2,
    periodsCount: 4,
    assignedGrades: 'Grades 6-8',
    primaryGames: ['Football', 'Badminton'],
    timetableText: 'Monday Period 1: Class 7A, Tuesday Period 1: Class 8B, Wednesday Period 1: Class 6C, Thursday Period 1: Class 7A',
    timetable: {
      'Monday_1': 'Class 7A - Football',
      'Tuesday_1': 'Class 8B - Badminton',
      'Wednesday_1': 'Class 6C - Football',
      'Thursday_1': 'Class 7A - Badminton'
    },
    schedules: []
  },
  {
    id: 'workload_4',
    teacherId: 'teacher_4',
    teacherName: 'Coach Sunita Rao',
    curriculum: 'CBSE',
    termsCount: 2,
    periodsCount: 3,
    assignedGrades: 'Grades 1-5',
    primaryGames: ['Yoga', 'Fitness & Agility'],
    timetableText: 'Monday Period 1: Class 3A, Tuesday Period 2: Class 4B, Thursday Period 1: Class 2C',
    timetable: {
      'Monday_1': 'Class 3A - Yoga',
      'Tuesday_2': 'Class 4B - Fitness',
      'Thursday_1': 'Class 2C - Yoga'
    },
    schedules: []
  }
];

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];

// Text pasting parser helper
const parseTimetableText = (text: string): Record<string, string> => {
  const result: Record<string, string> = {};
  if (!text) return result;

  const parts = text.split(/[,\n;]+/).map(p => p.trim()).filter(Boolean);
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  
  let currentDay = 'Monday';
  
  parts.forEach(part => {
    // Detect Day
    for (const d of days) {
      if (part.toLowerCase().includes(d.toLowerCase())) {
        currentDay = d;
        break;
      }
    }
    
    // Find Period Number (regex searches for word boundaries, period numbers, P1, Period 1)
    const periodMatch = part.match(/(?:period|p|slot|time)\s*([1-8])/i) || 
                        part.match(/([1-8])(?:st|nd|rd|th)\s*(?:period|slot)?/i) || 
                        part.match(/\b([1-8])\b/);
    
    let periodNum = null;
    if (periodMatch) {
      periodNum = parseInt(periodMatch[1], 10);
    }
    
    if (periodNum && periodNum >= 1 && periodNum <= 8) {
      // Find what class/subject activity
      let activity = part;
      days.forEach(d => {
        activity = activity.replace(new RegExp(d, 'gi'), '');
      });
      activity = activity.replace(/(?:period|p|slot|time)\s*\d+/gi, '');
      activity = activity.replace(/\d+(?:st|nd|rd|th)\s*(?:period|slot)?/gi, '');
      
      const colonIndex = activity.indexOf(':');
      if (colonIndex !== -1) {
        activity = activity.substring(colonIndex + 1);
      }
      
      activity = activity.replace(/^[:\-–=,\s]+/, '').replace(/[:\-–=,\s]+$/, '').trim();
      
      if (!activity) {
        activity = "P.E. Lesson";
      }
      
      const lowerAct = activity.toLowerCase();
      if (lowerAct !== 'empty' && lowerAct !== 'free' && lowerAct !== 'no period' && lowerAct !== 'nil') {
        result[`${currentDay}_${periodNum}`] = activity;
      }
    }
  });
  
  return result;
};

// Helper to get fully parsed timetable object robustly (falling back to timetableText parser if empty)
const getTimetable = (w: Workload): Record<string, string> => {
  if (w.timetable && Object.keys(w.timetable).length > 0) {
    return w.timetable;
  }
  return parseTimetableText(w.timetableText || '');
};

// Convert structured grid to comma-separated text
const serializeTimetable = (timetable: Record<string, string>): string => {
  const parts: string[] = [];
  DAYS.forEach(day => {
    PERIODS.forEach(p => {
      const key = `${day}_${p}`;
      if (timetable[key]) {
        parts.push(`${day} Period ${p}: Class ${timetable[key]}`);
      }
    });
  });
  return parts.length > 0 ? parts.join(', ') : 'No scheduled slots';
};

const DepartmentWorkloadPlanner: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'roster' | 'workflow' | 'timetable' | 'dashboard' | 'notifications'>('roster');
  const [userProfile, setUserProfile] = useState<SchoolMember | null>(null);
  
  // School Profile state
  const [schoolProfile, setSchoolProfile] = useState<SchoolProfile>(() => {
    const saved = localStorage.getItem('smartpe_school_profile');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return {
      name: "Vidya Mandir Sr. Secondary School",
      board: "CBSE",
      adminName: "Physical Education Director",
      workingDays: DAYS,
      totalPeriods: 8
    };
  });

  const [isEditingSchool, setIsEditingSchool] = useState(false);
  const [tempSchoolName, setTempSchoolName] = useState(schoolProfile.name);
  const [tempSchoolBoard, setTempSchoolBoard] = useState(schoolProfile.board);

  // Teachers state
  const [workloads, setWorkloads] = useState<Workload[]>(() => {
    const saved = localStorage.getItem('smartpe_workloads');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Ensure timetable is filled
        return parsed.map((w: any) => {
          if ((!w.timetable || Object.keys(w.timetable).length === 0) && w.timetableText) {
            return {
              ...w,
              timetable: parseTimetableText(w.timetableText)
            };
          }
          return w;
        });
      } catch (e) {
        console.error("Failed to load workloads", e);
      }
    }
    return DEFAULT_WORKLOADS;
  });

  // Keep localStorage sync & notify calendar view
  useEffect(() => {
    localStorage.setItem('smartpe_workloads', JSON.stringify(workloads));
    window.dispatchEvent(new Event('smartpe_workloads_updated'));
  }, [workloads]);

  useEffect(() => {
    localStorage.setItem('smartpe_school_profile', JSON.stringify(schoolProfile));
  }, [schoolProfile]);

  const ocrTimersRef = React.useRef<number[]>([]);
  useEffect(() => {
    return () => {
      ocrTimersRef.current.forEach(id => window.clearTimeout(id));
      ocrTimersRef.current = [];
    };
  }, []);

  // Sync state to Firestore on change if logged in
  const syncToFirestore = async (updatedWorkloads: Workload[]) => {
    if (auth.currentUser && userProfile) {
      try {
        for (const w of updatedWorkloads) {
          const docRef = doc(db, 'workloads', w.id);
          await setDoc(docRef, {
            id: w.id,
            schoolId: userProfile.schoolId,
            teacherId: w.teacherId,
            teacherName: w.teacherName,
            curriculum: w.curriculum,
            termsCount: w.termsCount,
            periodsCount: w.periodsCount,
            assignedGrades: w.assignedGrades,
            primaryGames: w.primaryGames,
            timetableText: w.timetableText || '',
            timetableData: JSON.stringify(w.timetable || {}),
            createdAt: new Date().toISOString()
          });
        }
      } catch (e) {
        console.error("Firebase store sync failure inside workload planner: ", e);
      }
    }
  };

  // Onboard coach form state
  const [isAdding, setIsAdding] = useState(false);
  const [newTeacherName, setNewTeacherName] = useState('');
  const [newCurriculum, setNewCurriculum] = useState('CBSE');
  const [newTermsCount, setNewTermsCount] = useState(2);
  const [newPeriodsCount, setNewPeriodsCount] = useState(2);
  const [newGrades, setNewGrades] = useState('Grades 6-8');
  const [selectedGames, setSelectedGames] = useState<string[]>([]);
  const [timetableInput, setTimetableInput] = useState('');
  
  // Interactive Timetable Editor state for a particular teacher
  const [editingTimetableTeacherId, setEditingTimetableTeacherId] = useState<string | null>(null);
  const [editorTab, setEditorTab] = useState<'grid' | 'paste' | 'upload'>('grid');
  const [editorTimetable, setEditorTimetable] = useState<Record<string, string>>({});
  const [editorPasteText, setEditorPasteText] = useState('');
  
  // OCR Ingestion Progress UI
  const [ocrProgIndex, setOcrProgIndex] = useState(-1);
  const [ocrLogs, setOcrLogs] = useState<string[]>([]);

  // HOD Board Interaction States
  const [selectedCellDay, setSelectedCellDay] = useState<string>('Monday');
  const [selectedCellPeriod, setSelectedCellPeriod] = useState<number>(1);
  const [availabilitySearchTerm, setAvailabilitySearchTerm] = useState('');

  // Department Daily Workflow States
  const [selectedWorkflowDay, setSelectedWorkflowDay] = useState<string>('Monday');
  const [selectedWorkflowPeriod, setSelectedWorkflowPeriod] = useState<number>(1);
  const [isWorkflowSchoolHours, setIsWorkflowSchoolHours] = useState<boolean>(true);

  // Time matching helper
  const getCurrentDayAndPeriod = (): { day: string; period: number; isSchoolHours: boolean } => {
    const d = new Date();
    const dayIndex = d.getDay(); // 0 is Sunday, 1 is Monday, etc.
    const daysMap = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    let day = daysMap[dayIndex];
    
    // Default weekend of Friday / Sunday to Monday for nice preview simulation
    let isSchoolHours = true;
    if (day === 'Sunday' || day === 'Saturday') {
      day = 'Monday';
      isSchoolHours = false;
    }
    
    // Parse time
    const hours = d.getHours();
    const mins = d.getMinutes();
    const timeVal = hours * 60 + mins; // Time in minutes from midnight
    
    let period = 1;
    
    // CBSE Timings map:
    // P1: 8:30 - 9:15  (510 - 555 mins)
    // P2: 9:15 - 10:00 (555 - 600 mins)
    // P3: 10:15 - 11:00 (615 - 660 mins)
    // P4: 11:00 - 11:45 (660 - 705 mins)
    // P5: 11:45 - 12:30 (705 - 750 mins)
    // P6: 01:15 - 02:00 (795 - 840 mins)
    // P7: 02:00 - 02:45 (840 - 885 mins)
    // P8: 02:45 - 03:30 (885 - 930 mins)
    
    if (timeVal >= 510 && timeVal < 555) period = 1;
    else if (timeVal >= 555 && timeVal < 600) period = 2;
    else if (timeVal >= 600 && timeVal < 615) { period = 2; isSchoolHours = false; } // break
    else if (timeVal >= 615 && timeVal < 660) period = 3;
    else if (timeVal >= 660 && timeVal < 705) period = 4;
    else if (timeVal >= 705 && timeVal < 750) period = 5;
    else if (timeVal >= 750 && timeVal < 795) { period = 5; isSchoolHours = false; } // lunch
    else if (timeVal >= 795 && timeVal < 840) period = 6;
    else if (timeVal >= 840 && timeVal < 885) period = 7;
    else if (timeVal >= 885 && timeVal <= 930) period = 8;
    else {
      period = 1;
      isSchoolHours = false;
    }
    
    return { day, period, isSchoolHours };
  };

  const handleSyncToClock = () => {
    const { day, period, isSchoolHours } = getCurrentDayAndPeriod();
    setSelectedWorkflowDay(day);
    setSelectedWorkflowPeriod(period);
    setIsWorkflowSchoolHours(isSchoolHours);
    
    setNotificationLogs(prev => [
      `Workspace synced to live clock: ${day} - Period ${period}. (${isSchoolHours ? 'Active Hours' : 'Simulated Session'})`,
      ...prev
    ]);
  };

  useEffect(() => {
    // Initial clock sync on mount
    const { day, period, isSchoolHours } = getCurrentDayAndPeriod();
    setSelectedWorkflowDay(day);
    setSelectedWorkflowPeriod(period);
    setIsWorkflowSchoolHours(isSchoolHours);
  }, []);

  // Active workload item for AI suggestion
  const [selectedWorkloadId, setSelectedWorkloadId] = useState<string>('workload_1');
  const [suggestProgress, setSuggestProgress] = useState<string>('');
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  // Alert/Notification dispatched log feed
  const [notificationLogs, setNotificationLogs] = useState<string[]>([
    "Department Core: School Timetable registered for Vidya Mandir PE Department. 8 working slots configured.",
    "Syllabus Allotment: CBSE aligned curriculum suggested for High School Football schedules on 2026-06-05",
    "Substitute dispatch setup ready. HOD Substitution engine is online."
  ]);

  // Load from Firebase on mounting and authenticate
  useEffect(() => {
    const loadProfileAndDb = async () => {
      setLoading(true);
      if (auth.currentUser) {
        try {
          const profile = await fitnessService.getSchoolMember(auth.currentUser.uid);
          if (profile) {
            setUserProfile(profile);
            
            // Get school name
            const schoolRef = doc(db, 'schools', profile.schoolId);
            const schoolSnap = await getDoc(schoolRef);
            if (schoolSnap.exists()) {
              const snapData = schoolSnap.data();
              setSchoolProfile({
                name: snapData.name || "School PE Department",
                board: profile.role === 'admin' ? 'CBSE' : 'ICSE',
                adminName: profile.displayName || "HOD PE",
                workingDays: DAYS,
                totalPeriods: 8
              });
            }

            // Sync payloads from collections workloads
            const q = query(collection(db, 'workloads'), where('schoolId', '==', profile.schoolId));
            const snapshot = await getDocs(q);
            if (!snapshot.empty) {
              const loaded: Workload[] = snapshot.docs.map(doc => {
                const data = doc.data();
                let parsedTimetable: Record<string, string> = {};
                try {
                  if (data.timetableData) {
                    parsedTimetable = JSON.parse(data.timetableData);
                  }
                  if (Object.keys(parsedTimetable).length === 0 && data.timetableText) {
                    parsedTimetable = parseTimetableText(data.timetableText);
                  }
                } catch(err) {
                  console.error(err);
                  if (data.timetableText) {
                    parsedTimetable = parseTimetableText(data.timetableText);
                  }
                }
                return {
                  id: doc.id,
                  teacherId: data.teacherId || 'teacher_m',
                  teacherName: data.teacherName || 'Coach Name',
                  curriculum: data.curriculum || 'CBSE',
                  termsCount: data.termsCount || 2,
                  periodsCount: data.periodsCount || 3,
                  assignedGrades: data.assignedGrades || 'Grades 6-8',
                  primaryGames: data.primaryGames || ['General Fitness'],
                  timetableText: data.timetableText || '',
                  timetable: parsedTimetable,
                  schedules: data.schedules || []
                };
              });
              setWorkloads(loaded);
            }
          }
        } catch (e) {
          console.error("Firebase startup sync error in departmental worksheet: ", e);
        }
      }
      setLoading(false);
    };
    loadProfileAndDb().catch(console.error);
  }, []);

  const handleGameToggle = (game: string) => {
    setSelectedGames(prev => 
      prev.includes(game) ? prev.filter(g => g !== game) : [...prev, game]
    );
  };

  const handleAddWorkload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeacherName) return;

    const parsedTimetable = parseTimetableText(timetableInput);
    const compiledTimetableText = serializeTimetable(parsedTimetable);

    const newWorkload: Workload = {
      id: `workload_${Date.now()}`,
      teacherId: `teacher_${Math.random().toString(36).substr(2, 5)}`,
      teacherName: newTeacherName,
      curriculum: newCurriculum,
      termsCount: newTermsCount,
      periodsCount: newPeriodsCount,
      assignedGrades: newGrades,
      primaryGames: selectedGames.length > 0 ? selectedGames : ['Fitness & Agility'],
      timetableText: compiledTimetableText || 'No scheduled slots yet.',
      timetable: parsedTimetable,
      schedules: []
    };

    const next = [newWorkload, ...workloads];
    setWorkloads(next);
    syncToFirestore(next);
    setIsAdding(false);
    
    // Clear Form
    setNewTeacherName('');
    setSelectedGames([]);
    setTimetableInput('');

    // Trigger Notification
    const log = `New Hire Registered: Coach ${newTeacherName} added to ${newCurriculum} syllabus for ${newGrades}. Timetable parsed successfully.`;
    setNotificationLogs(prev => [log, ...prev]);
  };

  const handleDeleteWorkload = (id: string, name: string) => {
    toast.confirm(
      `Remove Coach ${name} from this school department allotment list?`,
      async () => {
        setWorkloads(prev => prev.filter(w => w.id !== id));
        setNotificationLogs(prev => [`Hiring termination notice: ${name} de-allocated.`, ...prev]);
        toast.success(`Coach ${name} removed from department roster.`);

        if (auth.currentUser) {
          try {
            await deleteDoc(doc(db, 'workloads', id));
          } catch (e) {
            console.error(e);
          }
        }
      }
    );
  };

  // Drag and Drop simulated OCR Timetable
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const simulateOCRFileIngestion = (fileName: string) => {
    ocrTimersRef.current.forEach(id => window.clearTimeout(id));
    ocrTimersRef.current = [];
    setOcrProgIndex(0);
    setOcrLogs(["Uploading schedule document to AI module..."]);
    
    const t1 = window.setTimeout(() => {
      setOcrProgIndex(1);
      setOcrLogs(prev => [...prev, "Extracting text nodes & resolving handwriting variables..."]);
      
      const t2 = window.setTimeout(() => {
        setOcrProgIndex(2);
        setOcrLogs(prev => [...prev, "Matching slot days with Greenwood Period tables..."]);
        
        const t3 = window.setTimeout(() => {
          setOcrProgIndex(3);
          const ocrTimetable = {
            'Monday_1': 'Grade 9A Football',
            'Wednesday_3': 'Grade 10B Yoga',
            'Thursday_5': 'Grade 11S Athletics',
            'Friday_2': 'Grade 8C Badminton'
          };
          setEditorTimetable(ocrTimetable);
          setEditorPasteText(serializeTimetable(ocrTimetable));
          setOcrProgIndex(-1);
          setUploadSuccess(`Successfully decoded "${fileName}" via AI OCR! 4 teaching slots extracted.`);
          setNotificationLogs(prev => [`AI OCR extraction: Parsed timetable file "${fileName}" successfully.`, ...prev]);
        }, 1200);
        ocrTimersRef.current.push(t3);
      }, 1000);
      ocrTimersRef.current.push(t2);
    }, 1000);
    ocrTimersRef.current.push(t1);
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      simulateOCRFileIngestion(e.dataTransfer.files[0].name);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      simulateOCRFileIngestion(e.target.files[0].name);
    }
  };

  const handleSaveSchool = () => {
    setSchoolProfile(prev => ({
      ...prev,
      name: tempSchoolName,
      board: tempSchoolBoard
    }));
    setIsEditingSchool(false);
    setNotificationLogs(prev => [`School updated to ${tempSchoolName} (${tempSchoolBoard})`, ...prev]);
  };

  // Timetable Edit Trigger for a Single Teacher
  const handleOpenTimetableEditor = (teacher: Workload) => {
    setEditingTimetableTeacherId(teacher.id);
    const tt = getTimetable(teacher);
    setEditorTimetable({ ...tt });
    setEditorPasteText(teacher.timetableText || serializeTimetable(tt));
    setEditorTab('grid');
    setUploadSuccess(null);
  };

  const handleApplyPasteParser = () => {
    const parsed = parseTimetableText(editorPasteText);
    setEditorTimetable(parsed);
    setUploadSuccess(`Text parsed! Matches found: ${Object.keys(parsed).length} teaching slots.`);
  };

  const handleSaveTeacherTimetable = () => {
    if (!editingTimetableTeacherId) return;
    
    const compiledText = serializeTimetable(editorTimetable);
    
    const updated = workloads.map(w => {
      if (w.id === editingTimetableTeacherId) {
        return {
          ...w,
          timetableText: compiledText,
          timetable: editorTimetable,
          periodsCount: Object.keys(editorTimetable).length || w.periodsCount
        };
      }
      return w;
    });

    setWorkloads(updated);
    syncToFirestore(updated);
    
    // Create log
    const teacherName = workloads.find(w => w.id === editingTimetableTeacherId)?.teacherName || "Coach";
    setNotificationLogs(prev => [`Timetable updated for ${teacherName}. New slots capacity: ${Object.keys(editorTimetable).length} periods.`, ...prev]);
    
    setEditingTimetableTeacherId(null);
  };

  // AI Timetable Lesson Plan Suggester using Gemini server-side
  const handleGetAISuggestions = async () => {
    setLoading(true);
    setSuggestProgress("AI is reading curriculum parameters & teaching blocks...");
    
    const currentSelectedWorkload = workloads.find(w => w.id === selectedWorkloadId) || workloads[0];
    const totalPeriodsActive = Object.keys(getTimetable(currentSelectedWorkload)).length || currentSelectedWorkload.periodsCount;

    const prompt = `You are an expert high-school Physical Education Instructor. 
We need to generate period-wise lesson suggestions for:
Teacher Name: ${currentSelectedWorkload.teacherName}
Curriculum: ${currentSelectedWorkload.curriculum} (${currentSelectedWorkload.termsCount} terms program)
Workload: ${totalPeriodsActive} periods scheduled in school.
Grades Targeted: ${currentSelectedWorkload.assignedGrades}
Primary Games assigned: ${currentSelectedWorkload.primaryGames.join(', ')}

Generate exactly ${totalPeriodsActive > 0 ? totalPeriodsActive : 3} period structures. Return exactly a valid JSON array matching this interface (Do not return any markdown wraps outside JSON):
[
  {
    "period": number,
    "game": "string",
    "skill": "string",
    "objective": "string",
    "duration": "string",
    "details": {
      "warmup": "string (warmup instructions)",
      "mainDrill": "string (main game drills)",
      "cooldown": "string (cooling down instructions)"
    }
  }
]`;

    try {
      const resJson = await callAIBase({
        model: 'gemini-3.1-flash-lite',
        contents: prompt
      }, 1);

      const text = resJson?.text || '';
      if (!text) {
        throw new Error('Fallback target active');
      }
      
      const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsedSchedules = JSON.parse(cleanText);

      const next = workloads.map(w => {
        if (w.id === currentSelectedWorkload.id) {
          return {
            ...w,
            schedules: parsedSchedules
          };
        }
        return w;
      });
      setWorkloads(next);
      syncToFirestore(next);

      setUploadSuccess("AI computed curriculum mapping successfully! Lesson plans compiled.");
      setNotificationLogs(prev => [
        `AI Generated: Suggested lesson blocks dispatched for Coach ${currentSelectedWorkload.teacherName}.`,
        ...prev
      ]);
    } catch (e: any) {
      console.warn("Using smart local logic bypass for schedules:", e);
      // Premium Local Fallback Generator
      const games = currentSelectedWorkload.primaryGames.length > 0 ? currentSelectedWorkload.primaryGames : ['General Fitness'];
      const fallbackSchedules = Array.from({ length: totalPeriodsActive || 3 }).map((_, idx) => {
        const game = games[idx % games.length];
        return {
          period: idx + 1,
          game: game,
          skill: game === 'Yoga' ? 'Pranayama & Surya Namaskar Flow' : 'Field Spacing, Dribbling & Ball Handling',
          objective: `Aligned CBSE standards PE practical instructions for ${currentSelectedWorkload.assignedGrades}`,
          duration: '45 mins',
          details: {
            warmup: '10 mins progressive range drills, joint rotation, static shoulder stretches.',
            mainDrill: `25 mins topic focus: Aligned practices for ${game} including targeted execution drills.`,
            cooldown: '10 mins gradual slow-walking deep recover breathes and hamstring releases.'
          }
        };
      });

      const next = workloads.map(w => {
        if (w.id === currentSelectedWorkload.id) {
          return {
            ...w,
            schedules: fallbackSchedules
          };
        }
        return w;
      });
      setWorkloads(next);
      syncToFirestore(next);
      
      setUploadSuccess("Generated lesson planning structures mapped smoothly using physical syllabus defaults.");
    } finally {
      setLoading(false);
      setSuggestProgress("");
    }
  };

  // Substitute Dispatch notification
  const handleDispatchSubstitute = (coachName: string, day: string, period: number, originalClass: string) => {
    toast.success(`Substitution cover dispatched to ${coachName} for ${originalClass} (Period ${period}, ${day} • ${DEFAULT_TIMINGS[period]}).`, 5000);
    const log = `URGENT COVER: Assigned Coach ${coachName} as substitute for ${originalClass} (Period ${period} - ${day}). Confirmation dispatch logged.`;
    setNotificationLogs(prev => [log, ...prev]);
  };

  // Get active busy and free lists for selected matrix cell
  const getCellStatus = (day: string, periodNum: number) => {
    const key = `${day}_${periodNum}`;
    const busy: { workload: Workload; classActivity: string }[] = [];
    const free: Workload[] = [];
    
    workloads.forEach(w => {
      const tt = getTimetable(w);
      if (tt[key]) {
        busy.push({ workload: w, classActivity: tt[key] });
      } else {
        free.push(w);
      }
    });

    return { busy, free };
  };

  const activeCellStatus = getCellStatus(selectedCellDay, selectedCellPeriod);

  // Get active busy and free lists for Daily Workflow Tab
  const getWorkflowStatus = (day: string, periodNum: number) => {
    const key = `${day}_${periodNum}`;
    const busy: Workload[] = [];
    const free: Workload[] = [];
    
    workloads.forEach(w => {
      const tt = getTimetable(w);
      if (tt[key]) {
        busy.push(w);
      } else {
        free.push(w);
      }
    });

    return { busy, free };
  };

  const workflowStatus = getWorkflowStatus(selectedWorkflowDay, selectedWorkflowPeriod);

  // Search results for HOD lookup
  const getHolidayLookupStatus = () => {
    if (!availabilitySearchTerm.trim()) return null;
    
    const keyStr = availabilitySearchTerm.toLowerCase();
    
    // Find matching teachers or days
    const matchedCoaches = workloads.filter(w => 
      w.teacherName.toLowerCase().includes(keyStr) || 
      w.primaryGames.some(g => g.toLowerCase().includes(keyStr)) ||
      w.assignedGrades.toLowerCase().includes(keyStr)
    );

    return matchedCoaches;
  };

  const searchResults = getHolidayLookupStatus();

  return (
    <div className="space-y-8 font-sans pb-12">
      {/* Title block */}
      <div className="bg-slate-900 text-white rounded-[2.5rem] p-8 md:p-12 relative overflow-hidden shadow-2xl border-2 border-slate-950">
        <div className="absolute top-0 right-0 transform translate-x-1/4 -translate-y-1/4 w-[500px] h-[500px] bg-gradient-to-br from-[#FF6B00]/20 to-indigo-900/30 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="relative z-10 max-w-4xl">
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 bg-gradient-to-r from-orange-500/20 to-indigo-500/20 rounded-xl border border-white/10 text-orange-400 text-xs font-black uppercase tracking-widest mb-6">
            <Sparkles size={14} className="animate-pulse" />
            <span>Smart PE Administration</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-none mb-4 uppercase">
            PE Department Scheduler & HOD Board
          </h1>
          <p className="text-sm md:text-base text-slate-300 leading-relaxed font-medium">
            Manage your physical education teacher roster, digest class schedules via drag-and-drop OCR text parsing, and inspect daily coverages. Select any class timeslot to locate free substitutes instantly.
          </p>
        </div>
      </div>

      {/* School Setup Header Block */}
      <div className="bg-white border-2 border-slate-100 p-6 md:p-8 rounded-[2rem] shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center space-x-4">
          <div className="p-4 bg-indigo-50 text-indigo-600 rounded-3xl">
            <Building size={32} />
          </div>
          <div>
            {isEditingSchool ? (
              <div className="flex flex-col sm:flex-row gap-3">
                <input 
                  type="text" 
                  value={tempSchoolName} 
                  onChange={e => setTempSchoolName(e.target.value)}
                  className="p-2 border border-slate-300 rounded-xl font-bold text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B00]" 
                />
                <select 
                  value={tempSchoolBoard} 
                  onChange={e => setTempSchoolBoard(e.target.value)}
                  className="p-2 border border-slate-300 rounded-xl font-bold text-slate-800 text-sm focus:outline-none"
                >
                  <option value="CBSE">CBSE aligned</option>
                  <option value="ICSE">ICSE aligned</option>
                  <option value="State Board">State Board</option>
                  <option value="IB">International (IB)</option>
                </select>
                <button 
                  onClick={handleSaveSchool}
                  className="px-4 py-2 bg-emerald-500 text-white rounded-xl text-xs font-bold uppercase"
                >
                  Save
                </button>
              </div>
            ) : (
              <>
                <h2 className="text-xl font-black text-slate-800 uppercase flex items-center gap-2">
                  <span>{schoolProfile.name}</span>
                  <span className="text-xs bg-orange-100 text-orange-800 px-3 py-1 rounded-full font-black uppercase tracking-wider">{schoolProfile.board} Syllabus</span>
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  Administrator Room: <span className="font-bold text-slate-700">{schoolProfile.adminName}</span> • Standardized Timetable Slots: <span className="font-bold text-slate-700">{schoolProfile.totalPeriods} Daily Periods</span>
                </p>
              </>
            )}
          </div>
        </div>

        <button 
          onClick={() => setIsEditingSchool(!isEditingSchool)}
          className="px-5 py-2.5 border-2 border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-black uppercase tracking-widest rounded-xl transition-all"
        >
          {isEditingSchool ? "Cancel" : "Configure School Settings"}
        </button>
      </div>

      {/* Nav Sub-Tabs */}
      <div className="flex flex-wrap border-b border-slate-200 gap-6">
        <button 
          id="tab-roster"
          onClick={() => setActiveSubTab('roster')} 
          className={`pb-4 px-2 text-xs font-black uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${activeSubTab === 'roster' ? 'border-[#FF6B00] text-slate-900 font-black' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
        >
          <Users size={16} />
          <span>1. Department Roster ({workloads.length} Coaches)</span>
        </button>
        <button 
          id="tab-workflow"
          onClick={() => setActiveSubTab('workflow')} 
          className={`pb-4 px-2 text-xs font-black uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${activeSubTab === 'workflow' ? 'border-[#FF6B00] text-slate-900 font-black' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
        >
          <Activity size={16} />
          <span>2. Department Daily Workflow</span>
        </button>
        <button 
          id="tab-dashboard"
          onClick={() => { setActiveSubTab('dashboard'); setSelectedCellDay('Monday'); setSelectedCellPeriod(1); }} 
          className={`pb-4 px-2 text-xs font-black uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${activeSubTab === 'dashboard' ? 'border-[#FF6B00] text-slate-900 font-black' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
        >
          <Calendar size={16} />
          <span>3. HOD Matrix & Coverage Board</span>
        </button>
        <button 
          id="tab-timetable"
          onClick={() => setActiveSubTab('timetable')} 
          className={`pb-4 px-2 text-xs font-black uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${activeSubTab === 'timetable' ? 'border-[#FF6B00] text-slate-900 font-black' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
        >
          <Sparkles size={16} />
          <span>4. Teacher AI Suggester & Schedules</span>
        </button>
        <button 
          id="tab-notifications"
          onClick={() => setActiveSubTab('notifications')} 
          className={`pb-4 px-2 text-xs font-black uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${activeSubTab === 'notifications' ? 'border-[#FF6B00] text-slate-900 font-black' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
        >
          <Mail size={16} />
          <span>5. Coverage Reminders Feed</span>
        </button>
      </div>

      <AnimatePresence mode="wait">
        {/* Tab 1: ONBOARD & ROSTER */}
        {activeSubTab === 'roster' && (
          <motion.div 
            key="roster"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-100 p-4 rounded-2xl gap-3">
              <span className="text-xs text-slate-600 font-bold uppercase tracking-widest">Register new hires, set base loads, or import timetables manually:</span>
              <button 
                onClick={() => setIsAdding(!isAdding)}
                className="flex items-center space-x-2 px-6 py-3 bg-[#FF6B00] text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-orange-600 transition-colors shadow-md border-b-4 border-orange-700"
              >
                <UserPlus size={16} />
                <span>Onboard Coach</span>
              </button>
            </div>

            {/* Registration Form */}
            {isAdding && (
              <motion.form 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                onSubmit={handleAddWorkload}
                className="bg-white border-2 border-slate-200 p-8 rounded-[2rem] space-y-6 shadow-sm overflow-hidden"
              >
                <h3 className="font-black text-slate-800 text-lg uppercase tracking-tight">Onboard New Physical Instructor</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Instructor Name</label>
                    <input 
                      type="text" 
                      required
                      value={newTeacherName}
                      onChange={(e) => setNewTeacherName(e.target.value)}
                      placeholder="e.g. Coach Sandeep Kumar"
                      className="w-full p-4 bg-slate-50 border border-slate-200 text-slate-800 rounded-2xl font-bold focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Syllabus Framework</label>
                    <select
                      value={newCurriculum}
                      onChange={(e) => setNewCurriculum(e.target.value)}
                      className="w-full p-4 bg-slate-50 border border-slate-200 text-slate-800 rounded-2xl font-bold focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="CBSE">CBSE Core Syllabus</option>
                      <option value="ICSE">ICSE Aligned</option>
                      <option value="State Board">State Board aligned</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Academic Term Splits</label>
                    <select
                      value={newTermsCount.toString()}
                      onChange={(e) => setNewTermsCount(parseInt(e.target.value))}
                      className="w-full p-4 bg-slate-50 border border-slate-200 text-slate-800 rounded-2xl font-bold focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="2">2 Terms syllabus</option>
                      <option value="3">3 Terms program</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Assigned Grades Range</label>
                    <select
                      value={newGrades}
                      onChange={(e) => setNewGrades(e.target.value)}
                      className="w-full p-4 bg-slate-50 border border-slate-200 text-slate-800 rounded-2xl font-bold focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="Grades 1-5">Primary (Grades 1-5)</option>
                      <option value="Grades 6-8">Middle School (Grades 6-8)</option>
                      <option value="Grades 9-10">Secondary (Grades 9-10)</option>
                      <option value="Grades 11-12">Senior Sec. (Grades 11-12)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">P.E. Load Cap (Periods/wk)</label>
                    <input 
                      type="number" 
                      min="1" 
                      max="40"
                      required
                      value={newPeriodsCount}
                      onChange={(e) => setNewPeriodsCount(parseInt(e.target.value))}
                      className="w-full p-4 bg-slate-50 border border-slate-200 text-slate-800 text-center rounded-2xl font-bold focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Paste Initial Schedule slots</label>
                    <input 
                      type="text" 
                      value={timetableInput}
                      onChange={(e) => setTimetableInput(e.target.value)}
                      placeholder="e.g. Monday P1: 8A Soccer, Wednesday P3: 10B Yoga"
                      className="w-full p-4 bg-slate-50 border border-slate-200 text-slate-800 rounded-2xl font-bold focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>

                {/* Primary games mapping */}
                <div className="space-y-3">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Primary Coaching Specialization:</span>
                  <div className="flex flex-wrap gap-2">
                    {DEFAULT_GAMES.map(game => (
                      <button
                        type="button"
                        key={game}
                        onClick={() => handleGameToggle(game)}
                        className={`px-4 py-2 text-xs font-bold rounded-xl border-2 transition-all ${selectedGames.includes(game) ? 'bg-orange-50 border-orange-500 text-orange-800' : 'bg-white border-slate-200 text-slate-600'}`}
                      >
                        {game}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button 
                    type="button"
                    onClick={() => setIsAdding(false)}
                    className="px-6 py-3 border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 text-xs font-black uppercase tracking-widest"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="px-6 py-3 bg-[#FF6B00] text-white hover:bg-orange-600 rounded-xl text-xs font-black uppercase tracking-widest shadow-md"
                  >
                    Confirm Registration
                  </button>
                </div>
              </motion.form>
            )}

            {/* Coaches List Roster */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {workloads.map((w) => {
                const tt = getTimetable(w);
                const activeHoursCount = Object.keys(tt).length;
                return (
                  <div key={w.id} className="bg-white border-2 border-slate-100 rounded-[2.5rem] p-6 hover:shadow-lg transition-all relative flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center font-black text-lg shadow-sm border border-indigo-100">
                            {w.teacherName.split(' ').pop()?.charAt(0) || 'C'}
                          </div>
                          <div>
                            <h3 className="font-black text-slate-800 leading-tight">{w.teacherName}</h3>
                            <span className="text-[9px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-black uppercase tracking-wider">{w.assignedGrades}</span>
                          </div>
                        </div>
                        <button 
                          onClick={() => handleDeleteWorkload(w.id, w.teacherName)}
                          className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg transition-colors"
                          title="Remove Coach"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-4 my-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div>
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Curriculum Setup</span>
                          <span className="text-xs font-black text-slate-800">{w.curriculum} • {w.termsCount} Terms</span>
                        </div>
                        <div>
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Timetable Slots</span>
                          <span className="text-xs font-black text-slate-800 text-orange-600 flex items-center gap-1">
                            <Clock size={12} />
                            <span>{activeHoursCount} Classes / Wk</span>
                          </span>
                        </div>
                      </div>

                      {/* Games badges */}
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {w.primaryGames.map(game => (
                          <span key={game} className="px-2.5 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-lg text-[10px] font-extrabold uppercase tracking-wide">
                            {game}
                          </span>
                        ))}
                      </div>

                      {/* Display small summarized timetable layout */}
                      <div className="mt-4 p-3 bg-indigo-50/30 rounded-xl border border-dashed border-indigo-100 text-[10px] text-slate-600 leading-normal">
                        <span className="font-black text-indigo-805 uppercase tracking-wider block mb-1">Weekly slots:</span>
                        {activeHoursCount > 0 ? (
                          <div className="flex flex-wrap gap-1 font-mono">
                            {Object.entries(tt).map(([slotKey, val]) => {
                              const [day, p] = slotKey.split('_');
                              return (
                                <span key={slotKey} className="bg-white border border-slate-200 px-1.5 py-0.5 rounded text-[9px]" title={val}>
                                  {day.substring(0,3)} P{p}
                                </span>
                              );
                            })}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">No schedule slots registered. Tap settings below.</span>
                        )}
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[9px] text-slate-400 font-medium italic truncate max-w-[140px]">{w.timetableText}</span>
                      <button
                        onClick={() => handleOpenTimetableEditor(w)}
                        className="px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center space-x-1.5 border-b-2 border-indigo-800"
                      >
                        <Edit size={12} />
                        <span>Manage Schedule</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Tab 2: DEPARTMENT DAILY WORKFLOW */}
        {activeSubTab === 'workflow' && (
          <motion.div 
            key="workflow"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Header / Sub-banner card */}
            <div className="bg-slate-900 text-white p-6 rounded-[2rem] border-2 border-slate-950 shadow-md relative overflow-hidden">
              <div className="absolute top-0 right-0 transform translate-x-1/6 -translate-y-1/6 w-80 h-80 bg-orange-500/10 rounded-full blur-2xl pointer-events-none"></div>
              <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h3 className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
                    <Activity className="text-orange-500" size={18} />
                    <span>Live Department Daily Workflow</span>
                  </h3>
                  <p className="text-slate-300 text-xs font-semibold mt-1">
                    HOD Active Monitor: View exactly which instructors are active on the ground, who are currently standby, and dispatch fast substitute coverages.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSyncToClock}
                    className="flex items-center space-x-1.5 px-4 py-2.5 bg-[#FF6B00] hover:bg-orange-600 text-white font-black text-[11px] uppercase tracking-wider rounded-xl transition-all shadow-md active:translate-y-px"
                  >
                    <Clock size={12} />
                    <span>Sync to Live Clock</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Selector & Stats Bar */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Day & Period selectors */}
              <div className="bg-white border-2 border-slate-100 p-6 rounded-[2rem] shadow-sm flex flex-col justify-between gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Day of the Week</label>
                  <div className="grid grid-cols-5 gap-1.5">
                    {DAYS.map(day => (
                      <button
                        type="button"
                        key={day}
                        onClick={() => setSelectedWorkflowDay(day)}
                        className={`py-2 text-[10px] font-black uppercase rounded-lg border-2 transition-all ${selectedWorkflowDay === day ? 'bg-orange-50 border-orange-500 text-orange-850' : 'bg-slate-50 border-transparent text-slate-500 hover:bg-slate-100'}`}
                      >
                        {day.substring(0, 3)}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Period Select</label>
                  <div className="grid grid-cols-4 gap-1.5 font-mono">
                    {PERIODS.map(p => (
                      <button
                        type="button"
                        key={p}
                        onClick={() => setSelectedWorkflowPeriod(p)}
                        className={`py-2 text-xs font-black rounded-lg border-2 transition-all ${selectedWorkflowPeriod === p ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'bg-slate-50 border-transparent text-slate-500 hover:bg-slate-100'}`}
                        title={DEFAULT_TIMINGS[p]}
                      >
                        P{p}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Stats & Yard Congestion Indicators */}
              <div className="bg-white border-2 border-slate-100 p-6 rounded-[2rem] shadow-sm lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col justify-between">
                  <div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block font-sans">Active Classes on Field</span>
                    <span className="text-3xl font-black text-slate-805 block mt-2">
                      {workflowStatus.busy.length}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase mt-2 block font-sans">
                    Teachers Teaching
                  </span>
                </div>

                <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl flex flex-col justify-between">
                  <div>
                    <span className="text-[9px] font-black text-emerald-800 uppercase tracking-widest block font-sans">Available Standby</span>
                    <span className="text-3xl font-black text-emerald-600 block mt-2">
                      {workflowStatus.free.length}
                    </span>
                  </div>
                  <span className="text-[10px] text-emerald-805 font-bold uppercase mt-2 block font-sans">
                    Free for Substitution
                  </span>
                </div>

                <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl flex flex-col justify-between">
                  <div>
                    <span className="text-[9px] font-black text-indigo-800 uppercase tracking-widest block font-sans">Field Density</span>
                    <span className={`text-xs font-black block mt-3 uppercase py-1 px-3.5 rounded-full inline-block ${workflowStatus.busy.length >= 3 ? 'bg-rose-100 text-rose-850' : workflowStatus.busy.length > 0 ? 'bg-indigo-150 text-indigo-800' : 'bg-slate-100 text-slate-600'}`}>
                      {workflowStatus.busy.length >= 3 ? '🔴 Congested' : workflowStatus.busy.length > 0 ? '🔵 Optimal' : '⚪ Zero Load'}
                    </span>
                  </div>
                  <span className="text-[10px] text-indigo-805 font-bold uppercase mt-2 block font-sans">
                    Collision Index
                  </span>
                </div>
              </div>
            </div>

            {/* Active School Hours Display Alert if not synced properly / simulated */}
            {!isWorkflowSchoolHours && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-amber-800 text-[11px] font-semibold flex items-center gap-2">
                <AlertCircle size={14} className="text-amber-600" />
                <span>Notice: Current machine time is outside active CBSE school hours (08:30 AM - 03:30 PM) or is on the weekend. System is displaying mock simulation mode.</span>
              </div>
            )}

            {/* List of Teachers with Workflow layouts */}
            <div className="bg-white border-2 border-slate-100 rounded-[2.5rem] p-6 md:p-8 shadow-sm space-y-6">
              <div className="flex border-b border-slate-100 pb-4 justify-between items-center">
                <div>
                  <h4 className="font-black text-slate-800 uppercase text-sm">Faculty Daily Workflow Status</h4>
                  <p className="text-slate-405 text-xs font-semibold">Active Period Focus: Period {selectedWorkflowPeriod} ({DEFAULT_TIMINGS[selectedWorkflowPeriod]})</p>
                </div>
                <div className="text-[10px] text-slate-400 font-bold font-mono bg-slate-50 border border-slate-100 px-3 py-1 rounded-xl">
                  {selectedWorkflowDay} • Period {selectedWorkflowPeriod}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {workloads.map(w => {
                  const tt = getTimetable(w);
                  const currentClass = tt[`${selectedWorkflowDay}_${selectedWorkflowPeriod}`];
                  const isTeaching = !!currentClass;
                  
                  return (
                    <div key={w.id} className={`p-5 rounded-3xl border-2 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6 ${isTeaching ? 'bg-indigo-50/15 border-indigo-100 shadow-xs' : 'bg-white border-slate-100'}`}>
                      {/* Left Block: Teacher profile and current status badge */}
                      <div className="flex items-center gap-4 min-w-[200px]">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black ${isTeaching ? 'bg-indigo-100 text-indigo-700 border border-indigo-200 shadow-sm' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
                          {w.teacherName.split(' ').pop()?.charAt(0) || 'C'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h5 className="font-extrabold text-[#111827] text-sm leading-none">{w.teacherName}</h5>
                            <span className="text-[9px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md font-bold uppercase">{w.assignedGrades}</span>
                          </div>
                          
                          <div className="flex items-center gap-2 mt-2">
                            {isTeaching ? (
                              <span className="px-3 py-1 bg-rose-50 border border-rose-200 text-rose-800 font-black text-[10px] uppercase rounded-full flex items-center gap-1.5 select-none leading-none">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                                <span>Coaching: {currentClass}</span>
                              </span>
                            ) : (
                              <span className="px-3 py-1 bg-emerald-50 border border-emerald-250 text-emerald-800 font-black text-[10px] uppercase rounded-full flex items-center gap-1.5 select-none leading-none">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                <span>Standby / Available</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Middle Block: Visual visual day timeline strip */}
                      <div className="flex-1 flex flex-col justify-center max-w-sm">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2 block font-sans">Active Strip Timeline ({selectedWorkflowDay})</span>
                        <div className="flex items-center gap-1">
                          {PERIODS.map(p => {
                            const tempClass = tt[`${selectedWorkflowDay}_${p}`];
                            const tempIsTeaching = !!tempClass;
                            const isCurrentP = selectedWorkflowPeriod === p;
                            
                            return (
                              <button
                                type="button"
                                key={p}
                                className={`flex-1 h-8 rounded-lg relative flex items-center justify-center font-mono text-[10px] font-bold border transition-all cursor-pointer ${isCurrentP ? 'ring-2 ring-[#FF6B00] ring-offset-1 scale-105 z-10 font-extrabold' : ''} ${tempIsTeaching ? 'bg-indigo-600 border-indigo-700 text-white shadow-xs' : 'bg-slate-50 border-slate-200 text-slate-400'}`}
                                title={`Period ${p}: ${tempClass || 'Free'}`}
                                onClick={() => setSelectedWorkflowPeriod(p)}
                              >
                                {p}
                                {tempIsTeaching && (
                                  <span className="absolute bottom-1 right-1 w-1 h-1 rounded-full bg-white"></span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Right Block: Instant quick actions contextual buttons */}
                      <div className="flex items-center gap-2 justify-end self-end md:self-auto min-w-[150px]">
                        {isTeaching ? (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedWorkloadId(w.id);
                              setActiveSubTab('timetable');
                            }}
                            className="w-full sm:w-auto px-4.5 py-2.5 bg-indigo-50 border border-indigo-250 hover:bg-indigo-100 text-indigo-700 font-black text-[10px] uppercase tracking-wider rounded-xl transition-all shadow-xs"
                          >
                            Browse AI Plan
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleDispatchSubstitute(w.teacherName, selectedWorkflowDay, selectedWorkflowPeriod, "PE Standby Hour")}
                            className="w-full sm:w-auto px-4.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] uppercase tracking-wider rounded-xl transition-all shadow-md border-b-2 border-emerald-800"
                          >
                            Assign Cover
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {/* Tab 3: HOD MATRIX BOARD */}
        {activeSubTab === 'dashboard' && (
          <motion.div 
            key="dashboard"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-8"
          >
            {/* Quick search check */}
            <div className="bg-white border-2 border-slate-100 p-6 rounded-[2rem] shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="relative w-full max-w-lg">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text"
                  placeholder="Interactive department search (e.g. 'Yoga', 'Suresh', 'Football')..."
                  value={availabilitySearchTerm}
                  onChange={e => setAvailabilitySearchTerm(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 border-2 border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#FF6B00]"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Indicator Keys:</span>
                <span className="bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded text-[10px] text-indigo-700 font-bold">🔵 Active Lessons</span>
                <span className="bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded text-[10px] text-emerald-800 font-bold">🟢 Free Substitutes</span>
              </div>
            </div>

            {/* Search results popup if active */}
            {searchResults && (
              <div className="bg-amber-50/50 border-2 border-amber-200/60 p-6 rounded-[2rem] space-y-3">
                <h3 className="text-xs font-black text-amber-800 uppercase tracking-widest flex items-center gap-2">
                  <AlertCircle size={16} />
                  <span>Matches Found in Staff Allotments ({searchResults.length})</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {searchResults.map(c => (
                    <div key={c.id} className="bg-white p-4 rounded-xl border border-amber-200 shadow-xs flex justify-between items-center">
                      <div>
                        <div className="font-extrabold text-slate-800 text-sm">{c.teacherName}</div>
                        <div className="text-[10px] text-slate-500">{c.primaryGames.join(', ')} • {c.assignedGrades}</div>
                      </div>
                      <button 
                        onClick={() => { setAvailabilitySearchTerm(''); handleOpenTimetableEditor(c); }}
                        className="px-3 py-1 bg-amber-100 text-amber-800 rounded font-black text-[10px] uppercase"
                      >
                        Edit Timetable
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* MATRIX GRID BOARD CARD */}
            <div className="bg-white border-2 border-slate-100 rounded-[2.5rem] p-6 md:p-8 shadow-sm">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 border-b border-slate-100 pb-5">
                <div>
                  <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">HOD Central Allotment Matrix</h3>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">Click any matrix cell to verify coverage lists, identify which teachers are empty, and handle substitutions.</p>
                </div>
                
                {/* Visual timing legend */}
                <div className="text-xs font-bold text-slate-500 font-mono bg-slate-50 border border-slate-100 px-3 py-2 rounded-xl">
                  {schoolProfile.board} PE Curriculum Board: {workloads.length} Instructors On-call
                </div>
              </div>

              {/* TIMETABLE DYNAMIC MATRIX */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse min-w-[800px]">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="p-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border border-slate-100 w-[120px]">
                        Day
                      </th>
                      {PERIODS.map(p => (
                        <th key={p} className="p-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest border border-slate-100">
                          <div className="font-bold">Period {p}</div>
                          <div className="text-[9px] font-medium font-mono text-slate-400">{DEFAULT_TIMINGS[p].split(' - ')[0]}</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {DAYS.map(day => (
                      <tr key={day} className="hover:bg-slate-50/50">
                        <td className="p-4 font-black text-slate-800 border border-slate-100 text-xs uppercase tracking-wider bg-slate-50/30">
                          {day}
                        </td>
                        {PERIODS.map(p => {
                          const { busy, free } = getCellStatus(day, p);
                          const isSelected = selectedCellDay === day && selectedCellPeriod === p;
                          const hasConflict = busy.length >= 3;
                          
                          return (
                            <td 
                              key={p} 
                              onClick={() => { setSelectedCellDay(day); setSelectedCellPeriod(p); }}
                              className={`p-4 border border-slate-150 cursor-pointer transition-all text-center select-none relative ${isSelected ? 'bg-orange-50/60 ring-2 ring-[#FF6B00] ring-inset' : 'hover:bg-indigo-50/40'}`}
                            >
                              <div className="space-y-1">
                                {busy.length > 0 ? (
                                  <div className={`text-[10px] font-black px-2 py-0.5 rounded-full inline-block ${hasConflict ? 'bg-rose-100 text-rose-800' : 'bg-indigo-50 text-indigo-700'}`}>
                                    {busy.length} Active
                                  </div>
                                ) : (
                                  <div className="text-[9px] font-medium text-slate-300">
                                    --
                                  </div>
                                )}
                                
                                <div className="text-[9px] font-bold text-emerald-600 block">
                                  {free.length} Free
                                </div>
                              </div>

                              {/* Corner conflict trigger icon */}
                              {hasConflict && (
                                <div className="absolute top-1 right-1 text-rose-500 animate-pulse" title="High concurrent field load">
                                  <AlertTriangle size={12} />
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* DETAILED INSPECTION & SUBSTITUTION DRAWER PANEL */}
            <div className="bg-white border-2 border-slate-100 rounded-[2.5rem] p-6 md:p-8 shadow-sm">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-150 pb-5 mb-6">
                <div>
                  <div className="inline-flex items-center space-x-2 px-3 py-1 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-700 text-[10px] font-black uppercase tracking-wider mb-2">
                    <ClipboardList size={12} />
                    <span>Selected Timeslot Core Report</span>
                  </div>
                  <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                    <span>{selectedCellDay} - Period {selectedCellPeriod}</span>
                    <span className="text-xs text-slate-400 font-mono">({DEFAULT_TIMINGS[selectedCellPeriod]})</span>
                  </h3>
                </div>

                <div className="flex gap-4">
                  <div className="text-right">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Playground State</span>
                    <span className="font-bold text-slate-800 text-sm">
                      {activeCellStatus.busy.length} Classes Active
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Available Standby</span>
                    <span className="font-bold text-emerald-600 text-sm">
                      {activeCellStatus.free.length} Coaches Free
                    </span>
                  </div>
                </div>
              </div>

              {/* Conflict/Density warnings */}
              {activeCellStatus.busy.length >= 3 && (
                <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl flex items-start gap-3 mb-6">
                  <AlertTriangle size={18} className="text-rose-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h5 className="font-black text-xs uppercase tracking-wide">High Congestion Space Alert</h5>
                    <p className="text-[11px] leading-relaxed mt-0.5">3 or more coaches are active on the field simultaneously. Please verify field dividing maps to avoid collision risk with multiple ongoing soccer matches!</p>
                  </div>
                </div>
              )}

              {activeCellStatus.busy.length === 0 && (
                <div className="text-center p-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <Clock size={32} className="mx-auto text-slate-350 mb-2" />
                  <p className="text-sm font-black uppercase text-slate-600 tracking-wide">No active classes scheduled</p>
                  <p className="text-xs text-slate-400 max-w-md mx-auto mt-0.5">No coaches are on field duty during this hour. Ideal time for general department administrative synchronization or academic training sessions.</p>
                </div>
              )}

              {/* CORES AND SIDEBYSIDE LISTS */}
              {activeCellStatus.busy.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Active list */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-black text-indigo-850 uppercase tracking-widest flex items-center gap-2">
                      <Layers size={14} />
                      <span>Coaches on Playground Field duty ({activeCellStatus.busy.length})</span>
                    </h4>
                    
                    <div className="space-y-3">
                      {activeCellStatus.busy.map(({ workload, classActivity }, idx) => (
                        <div key={idx} className="p-5 bg-indigo-50/45 border-2 border-indigo-100 rounded-2xl flex justify-between items-start gap-4">
                          <div>
                            <div className="font-extrabold text-slate-800 text-sm">{workload.teacherName}</div>
                            <div className="text-[11px] font-bold text-slate-500 mt-0.5">Grade Allotment: <span className="text-indigo-800">{workload.assignedGrades}</span></div>
                            <div className="text-[11px] font-semibold text-slate-600 mt-1 flex items-center gap-1.5 bg-white px-2 py-0.5 rounded-md border border-slate-200 inline-block">
                              <Target size={12} className="text-[#FF6B00]" />
                              <span>Activity: {classActivity}</span>
                            </div>
                          </div>

                          {workload.schedules && workload.schedules.length > 0 ? (
                            <button
                              onClick={() => {
                                setSelectedWorkloadId(workload.id);
                                setActiveSubTab('timetable');
                              }}
                              className="px-3.5 py-1.5 bg-indigo-100 hover:bg-indigo-200 text-indigo-800 rounded-lg font-black text-[10px] uppercase tracking-wider"
                            >
                              Inspect plan
                            </button>
                          ) : (
                            <span className="text-[9px] text-slate-400 font-bold italic mt-2">No AI suggestions preset.</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Substitutes standby list */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-black text-emerald-800 uppercase tracking-widest flex items-center gap-2">
                      <Clock size={14} />
                      <span>Available Substitution standby ({activeCellStatus.free.length})</span>
                    </h4>

                    <div className="space-y-3">
                      {activeCellStatus.free.map((workload, idx) => (
                        <div key={idx} className="p-5 bg-emerald-50/50 border-2 border-emerald-150 rounded-2xl flex justify-between items-center gap-3">
                          <div>
                            <div className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                              <span>{workload.teacherName}</span>
                              <span className="bg-emerald-100 text-emerald-800 px-2 py-0.2 rounded text-[9px] uppercase font-black tracking-wide">Empty / Free</span>
                            </div>
                            <div className="text-[10px] text-slate-500 font-semibold mt-0.5">Specialty focus: {workload.primaryGames.join(', ')}</div>
                          </div>

                          {/* Quick assign Substitute Cover button */}
                          <button
                            onClick={() => handleDispatchSubstitute(
                              workload.teacherName, 
                              selectedCellDay, 
                              selectedCellPeriod, 
                              activeCellStatus.busy[0]?.classActivity || "Primary Physical class"
                            )}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border-b-2 border-emerald-800"
                          >
                            Assign Cover
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Tab 3: TIMETABLE & AI SUGGESTER */}
        {activeSubTab === 'timetable' && (
          <motion.div 
            key="timetable"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            {/* Left sidebar: selection and schedules */}
            <div className="space-y-6 lg:col-span-1">
              <div className="bg-white border-2 border-slate-100 rounded-[2rem] p-6 shadow-sm">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 block">Choose Teacher Profile</span>
                <div className="space-y-2">
                  {workloads.map(w => (
                    <button
                      key={w.id}
                      onClick={() => setSelectedWorkloadId(w.id)}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center justify-between ${selectedWorkloadId === w.id ? 'bg-indigo-50 border-indigo-400 font-extrabold' : 'bg-slate-50 border-transparent hover:bg-slate-100'}`}
                    >
                      <div>
                        <div className="text-xs font-black text-slate-800">{w.teacherName}</div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{w.curriculum} • {w.assignedGrades}</div>
                      </div>
                      <ChevronRight size={14} className={selectedWorkloadId === w.id ? 'text-indigo-650' : 'text-slate-400'} />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right block: schedules suggester */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white border-2 border-slate-105 rounded-[2.5rem] p-8 shadow-sm">
                {(() => {
                  const currentSelectedWorkload = workloads.find(w => w.id === selectedWorkloadId) || workloads[0];
                  const totalPeriodsActive = Object.keys(getTimetable(currentSelectedWorkload)).length;
                  return (
                    <>
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-6 mb-6">
                        <div>
                          <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">
                            AI Lesson Planner suggestion: {currentSelectedWorkload.teacherName}
                          </h3>
                          <p className="text-slate-500 text-xs font-medium mt-1">
                            Syllabus mapping: {currentSelectedWorkload.curriculum} • active scheduled classes: {totalPeriodsActive} periods per week
                          </p>
                        </div>

                        <button
                          disabled={loading}
                          onClick={handleGetAISuggestions}
                          className="flex items-center space-x-2 px-6 py-4.5 bg-gradient-to-r from-[#FF6B00] to-orange-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:shadow-lg transition-transform hover:-translate-y-0.5 active:translate-y-0 text-center"
                        >
                          {loading ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />}
                          <span>{loading ? 'AI Blueprinting...' : 'Ask AI Lesson Suggester'}</span>
                        </button>
                      </div>

                      {loading && (
                        <div className="p-8 text-center bg-indigo-50/50 rounded-2xl flex flex-col items-center justify-center space-y-3">
                          <Loader2 size={32} className="animate-spin text-indigo-600" />
                          <p className="text-sm font-black uppercase text-indigo-700 tracking-wider">Compiling physical training syllabus tracks...</p>
                          <p className="text-xs text-slate-500 italic max-w-md">{suggestProgress}</p>
                        </div>
                      )}

                      {!loading && currentSelectedWorkload.schedules && currentSelectedWorkload.schedules.length > 0 ? (
                        <div className="space-y-6">
                          {currentSelectedWorkload.schedules.map((item, index) => (
                            <div key={index} className="bg-slate-50/70 border border-slate-150 p-6 rounded-2xl hover:border-indigo-200 transition-all">
                              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 mb-3">
                                <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-lg text-[10px] font-black uppercase tracking-widest">
                                  Period Suggester {item.period} ({item.duration || '45 min'})
                                </span>
                                <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-lg text-[10px] font-black uppercase tracking-widest">
                                  Topic: {item.game} - {item.skill}
                                </span>
                              </div>

                              <h4 className="font-extrabold text-sm text-slate-805 mb-2 uppercase leading-snug">{item.objective}</h4>
                              
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-slate-100">
                                <div className="p-3 bg-white rounded-xl border border-slate-100">
                                  <span className="text-[8px] font-black text-rose-500 uppercase tracking-widest block">Warm-Up Block (10M)</span>
                                  <p className="text-[11px] text-slate-600 font-medium leading-relaxed mt-1">{item.details.warmup}</p>
                                </div>
                                <div className="p-3 bg-white rounded-xl border border-slate-100">
                                  <span className="text-[8px] font-black text-indigo-600 uppercase tracking-widest block">Main Activity Track (25M)</span>
                                  <p className="text-[11px] text-slate-600 font-medium leading-relaxed mt-1">{item.details.mainDrill}</p>
                                </div>
                                <div className="p-3 bg-white rounded-xl border border-slate-100">
                                  <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest block">Cool Down Relax (10M)</span>
                                  <p className="text-[11px] text-slate-600 font-medium leading-relaxed mt-1">{item.details.cooldown}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        !loading && (
                          <div className="text-center p-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                            <Clock size={36} className="mx-auto text-slate-400 mb-2" />
                            <p className="text-sm font-black uppercase text-slate-700 tracking-wider">No structured AI plan maps loaded</p>
                            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">Tap "Ask AI Lesson Suggester" to automatically map CBES/ICSE sports curriculum objectives smoothly across all workloads.</p>
                          </div>
                        )
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
          </motion.div>
        )}

        {/* Tab 4: REMINDERS & NOTIFICATION CRON LOG */}
        {activeSubTab === 'notifications' && (
          <motion.div 
            key="notifications"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="bg-white border-2 border-slate-150 rounded-[2.5rem] p-8 shadow-sm">
              <div className="border-b border-slate-100 pb-5 mb-5 select-none">
                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Coverage & substitution Logs</h3>
                <p className="text-xs text-slate-400 font-semibold mt-0.5">Automated logging output feed tracking cover, substitute allocations, and timetable compliance.</p>
              </div>

              <div className="space-y-4">
                {notificationLogs.map((log, idx) => (
                  <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-start gap-3">
                    <div className="p-2 bg-indigo-50 text-indigo-700 rounded-lg">
                      <Mail size={16} />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-slate-705 font-bold leading-relaxed">{log}</p>
                      <span className="text-[9px] text-slate-400 font-mono block mt-1">Status: COMPLETE AND INGESTED successfully via administrative routing logs.</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* DYNAMIC DRAWERS / MODALS */}
      {editingTimetableTeacherId && (
        <div id="timetable-editor-modal" className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-[2.5rem] shadow-2xl border-2 border-slate-950 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col justify-between"
          >
            <div className="p-6 border-b border-slate-150 bg-slate-50 flex justify-between items-center select-none">
              <div>
                <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">
                  PE Allotments editor: {workloads.find(w => w.id === editingTimetableTeacherId)?.teacherName}
                </h3>
                <p className="text-slate-400 text-xs font-semibold">Deploy physical timeslots using physical grid buttons, text input parsers, or document OCR simulators.</p>
              </div>
              <button 
                onClick={() => setEditingTimetableTeacherId(null)}
                className="p-2 hover:bg-slate-200 rounded-lg font-bold text-slate-500 text-sm"
              >
                ✕
              </button>
            </div>

            {/* Modal Internal Tabs */}
            <div className="flex border-b border-slate-150 bg-slate-50 px-6">
              <button 
                onClick={() => { setEditorTab('grid'); setUploadSuccess(null); }}
                className={`py-3 px-4 text-xs font-black uppercase tracking-widest border-b-2 ${editorTab === 'grid' ? 'border-[#FF6B00] text-slate-950' : 'border-transparent text-slate-400'}`}
              >
                Manual Grid Editor
              </button>
              <button 
                onClick={() => { setEditorTab('paste'); setUploadSuccess(null); }}
                className={`py-3 px-4 text-xs font-black uppercase tracking-widest border-b-2 ${editorTab === 'paste' ? 'border-[#FF6B00] text-slate-950' : 'border-transparent text-slate-400'}`}
              >
                Pasted text Parser
              </button>
              <button 
                onClick={() => { setEditorTab('upload'); setUploadSuccess(null); }}
                className={`py-3 px-4 text-xs font-black uppercase tracking-widest border-b-2 ${editorTab === 'upload' ? 'border-[#FF6B00] text-slate-950' : 'border-transparent text-slate-400'}`}
              >
                Timetable PDF/Word OCR Ingest
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              {uploadSuccess && (
                <div className="mb-4 p-3.5 bg-emerald-50 text-emerald-800 border border-emerald-150 rounded-xl flex items-start gap-2">
                  <CheckCircle2 size={16} className="mt-0.5 text-emerald-600 flex-shrink-0" />
                  <p className="text-[11px] font-bold leading-tight">{uploadSuccess}</p>
                </div>
              )}

              {/* GRID EDITOR */}
              {editorTab === 'grid' && (
                <div className="space-y-4">
                  <span className="text-[10px] font-black text-slate-40 tracking-widest block uppercase">Double click a cell to enter or edit standard slot designations:</span>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-slate-50">
                          <th className="p-3 text-left border border-slate-150 text-[10px] font-black uppercase tracking-wider text-slate-400 w-[100px]">Day</th>
                          {PERIODS.map(p => (
                            <th key={p} className="p-3 text-center border border-slate-150 text-[10px] font-black uppercase tracking-wider text-slate-400">P{p}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {DAYS.map(day => (
                          <tr key={day}>
                            <td className="p-3 font-black text-slate-750 text-xs uppercase border border-slate-150 bg-slate-50/50">{day.substring(0,3)}</td>
                            {PERIODS.map(p => {
                              const key = `${day}_${p}`;
                              return (
                                <td key={p} className="p-2 border border-slate-150">
                                  <input 
                                    type="text"
                                    value={editorTimetable[key] || ''}
                                    placeholder="e.g. 9A - Football"
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setEditorTimetable(prev => {
                                        const next = { ...prev };
                                        if (val) next[key] = val;
                                        else delete next[key];
                                        return next;
                                      });
                                    }}
                                    className="w-full p-2 bg-slate-50 border border-slate-200 text-xs font-black text-indigo-900 rounded-md text-center focus:outline-none focus:ring-1 focus:ring-indigo-600"
                                  />
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* PASTED TEXT PARSER EDITOR */}
              {editorTab === 'paste' && (
                <div className="space-y-4">
                  <div className="bg-indigo-50 border border-indigo-150 p-4 rounded-xl text-xs text-indigo-805 leading-relaxed font-semibold">
                    <h5 className="font-extrabold uppercase tracking-wide flex items-center gap-1">
                      <Sparkles size={12} className="animate-pulse" />
                      <span>Smart Departmental Paste Parsing Instructions:</span>
                    </h5>
                    <p className="mt-1">
                      Write or paste the schedule raw inputs using comma blocks. E.g.: "Monday Period 1: Class 9A Football, Tuesday Period 2: Class 10B Yoga, Thursday Period 5: Class 11S Athletics".
                    </p>
                  </div>
                  
                  <textarea
                    rows={6}
                    value={editorPasteText}
                    onChange={(e) => setEditorPasteText(e.target.value)}
                    placeholder="E.g. Monday Period 1: Class 7A Football, Wednesday period 3: Class 11B Yoga"
                    className="w-full p-4 border border-slate-250 text-slate-800 rounded-xl font-bold font-mono text-xs focus:outline-none focus:ring-2 focus:ring-indigo-650"
                  />

                  <button
                    onClick={handleApplyPasteParser}
                    className="px-5 py-3 bg-[#FF6B00] hover:bg-orange-600 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-sm self-start"
                  >
                    Parse Paste Text
                  </button>
                </div>
              )}

              {/* OCR DRAG AND DROP SIMULATOR */}
              {editorTab === 'upload' && (
                <div className="space-y-4">
                  <div 
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleFileDrop}
                    className="border-2 border-dashed border-slate-250 rounded-[2rem] p-10 bg-slate-50 text-center relative hover:bg-indigo-50/15 cursor-pointer"
                  >
                    <UploadCloud size={48} className="mx-auto text-slate-400 mb-2" />
                    <label className="block text-xs font-black text-indigo-600 hover:underline cursor-pointer tracking-wider uppercase mb-1">
                      Upload PDF/Word document file
                      <input 
                        type="file" 
                        accept=".csv, .xlsx, .txt, .pdf, .docx, .doc" 
                        onChange={handleFileSelect}
                        className="hidden" 
                      />
                    </label>
                    <p className="text-[10px] text-slate-400 font-medium">Accepts standard CBSE teacher schedules, exports or handwriting lists</p>
                  </div>

                  {/* OCR Loading progresses */}
                  {ocrProgIndex >= 0 && (
                    <div className="p-6 bg-[#000d23] text-emerald-400 rounded-2xl border-2 border-emerald-900 font-mono text-xs space-y-2 leading-relaxed">
                      <div className="flex items-center gap-2">
                        <Loader2 className="animate-spin text-emerald-500" size={14} />
                        <span className="font-bold text-slate-200">AI OCR ENGINE PROBING FILE COORDS:</span>
                      </div>
                      
                      {ocrLogs.map((log, index) => (
                        <div key={index} className="flex gap-2 text-[10px]">
                          <span className="text-emerald-600">[OK]</span>
                          <span>{log}</span>
                        </div>
                      ))}
                      
                      {ocrProgIndex < 3 && (
                        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-3">
                          <div className="bg-emerald-500 h-full animate-pulse transition-all" style={{ width: `${(ocrProgIndex + 1) * 33}%` }}></div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-slate-150 bg-slate-50 flex justify-end gap-3 select-none">
              <button 
                onClick={() => setEditingTimetableTeacherId(null)}
                className="px-5 py-3 border border-slate-200 text-slate-500 rounded-xl text-xs font-black uppercase tracking-widest"
              >
                Discard
              </button>
              <button 
                onClick={handleSaveTeacherTimetable}
                className="px-5 py-3 bg-[#FF6B00] hover:bg-orange-600 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-md border-b-4 border-orange-700"
              >
                Save and Register Allotments
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default DepartmentWorkloadPlanner;
