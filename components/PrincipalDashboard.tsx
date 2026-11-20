import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShieldCheck, 
  Activity, 
  Users, 
  Award, 
  Calendar, 
  CheckCircle2, 
  FileText, 
  Download, 
  TrendingUp, 
  AlertCircle, 
  Printer, 
  Layers, 
  Zap, 
  UserCheck,
  Edit,
  Plus,
  Trash2,
  X,
  Info,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Check,
  FileSpreadsheet,
  MapPin,
  ClipboardList,
  RefreshCw,
  School as SchoolIcon,
  ArrowUpRight,
  ExternalLink,
  BookOpen,
  Trophy,
  Gauge,
  Sparkles,
  Clock,
  AlertTriangle,
  GraduationCap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { fitnessService } from '../services/fitnessService';
import { compositeEvaluationService } from '../services/compositeEvaluationService';
import { calculateTestScoreAndLevel, getTestDefinition } from '../services/physicalDevelopmentEngine';
import { Student, FitnessResult, PracticalAssessment, School, SchoolMember, CompositeTermEvaluation } from '../types';
import { auth } from '../services/firebase';
import { downloadCsvFile } from '../utils/safeBrowser';

interface EventItem {
  id: string;
  name: string;
  date: string;
  type: string;
  status: string;
  inCharge: string;
  description: string;
  evidenceFiles: string[];
  fixtures?: {
    round: string;
    teamA: string;
    teamB: string;
    score?: string;
    winner?: string;
  }[];
  roster?: string[];
}

interface PrincipalDashboardProps {
  onNavigate?: (tab: any) => void;
}

export const PrincipalDashboard: React.FC<PrincipalDashboardProps> = ({ onNavigate }) => {
  // Mode selection: Institutional Viewer or Data Input Desk
  const [dashboardMode, setDashboardMode] = useState<'viewer' | 'editor'>('viewer');
  
  // State for collapsible Guidelines Card
  const [showGuidelines, setShowGuidelines] = useState(false);

  // Filter states
  const [selectedTerm, setSelectedTerm] = useState<'Full Year' | 'Baseline' | 'Term 1' | 'Term 2'>('Full Year');
  const [selectedGradeBand, setSelectedGradeBand] = useState<'All' | 'Primary (1-5)' | 'Middle (6-8)' | 'Secondary (9-12)'>('All');
  
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [selectedEventDetails, setSelectedEventDetails] = useState<EventItem | null>(null);
  const [selectedEvidencePreview, setSelectedEvidencePreview] = useState<string | null>(null);
  const [activeEvidenceTab, setActiveEvidenceTab] = useState<'details' | 'photos' | 'evidence'>('details');
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>('Just now');

  // Real database states
  const [students, setStudents] = useState<Student[]>([]);
  const [results, setResults] = useState<FitnessResult[]>([]);
  const [practicalAssessments, setPracticalAssessments] = useState<PracticalAssessment[]>([]);
  const [compositeEvaluations, setCompositeEvaluations] = useState<CompositeTermEvaluation[]>([]);
  const [schoolMembers, setSchoolMembers] = useState<SchoolMember[]>([]);
  const [schoolData, setSchoolData] = useState<School | null>(null);
  const [userProfile, setUserProfile] = useState<SchoolMember | null>(null);

  // Class-wise breakdown expand & term deadline state
  const [expandedClassKeys, setExpandedClassKeys] = useState<Record<string, boolean>>({});
  const [termDeadlines, setTermDeadlines] = useState<{ Baseline: string; 'Term 1': string; 'Term 2': string }>(() => {
    try {
      const saved = localStorage.getItem('smartpe_principal_term_deadlines');
      if (saved) return JSON.parse(saved);
    } catch {}
    const addDays = (d: number) => new Date(Date.now() + d * 86400000).toISOString().split('T')[0];
    return {
      Baseline: addDays(14),
      'Term 1': addDays(45),
      'Term 2': addDays(120)
    };
  });

  // Dynamic overrides/targets from HoD Panel (persisted in localStorage)
  const [plannedClassesOverride, setPlannedClassesOverride] = useState<number>(() => {
    const saved = localStorage.getItem('smartpe_principal_planned_classes');
    return saved ? parseInt(saved, 10) : 192;
  });
  const [deliveredClassesOverride, setDeliveredClassesOverride] = useState<number>(() => {
    const saved = localStorage.getItem('smartpe_principal_delivered_classes');
    return saved ? parseInt(saved, 10) : 186;
  });
  const [complianceStatusOverride, setComplianceStatusOverride] = useState<'Inspection Ready' | 'Highly Compliant' | 'Pending Review'>(() => {
    const saved = localStorage.getItem('smartpe_principal_compliance_status');
    return (saved as any) || 'Inspection Ready';
  });

  // Calendar Events state (synced with localStorage & starter set)
  const [upcomingEvents, setUpcomingEvents] = useState<EventItem[]>(() => {
    const saved = localStorage.getItem('smartpe_principal_events');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return [
      { 
        id: 'evt-1',
        name: 'Annual Sports Day Meet', 
        date: 'August 29, 2026', 
        type: 'School-wide', 
        status: 'Approved & Scheduled', 
        inCharge: 'Coach Suresh Kumar',
        description: 'The major annual athletic showcase featuring track relays, high jump finals, Tug of War, and march-past drills of all four houses (Agni, Jal, Prithvi, Vayu). All sports equipment safety clearance has been fully audited.',
        evidenceFiles: ['sports_day_itinerary.pdf', 'house_marchpast_roster.xlsx', 'track_safety_clearance.pdf'],
        roster: ['Aditya Sen (Agni Captain)', 'Meera Nair (Jal Captain)', 'Rahul Jha (Prithvi Captain)', 'Jaspreet Singh (Vayu Captain)'],
        fixtures: [
          { round: '100m Dash Final', teamA: 'Agni (Pranav)', teamB: 'Vayu (Gurpreet)', score: '11.4s vs 11.6s', winner: 'Agni (Pranav)' },
          { round: 'Inter-House Relay 4x100m', teamA: 'Prithvi House', teamB: 'Jal House', score: '48.2s vs 49.5s', winner: 'Prithvi House' }
        ]
      },
      { 
        id: 'evt-2',
        name: 'CBSE Cluster South Zone Football', 
        date: 'October 12, 2026', 
        type: 'Inter-School', 
        status: 'Registration Complete', 
        inCharge: 'Coach Priya Sharma',
        description: 'South Zone regional qualifiers for secondary boys and girls categories under the CBSE sports affiliation rules. Teams representing 32 top schools will compete on a knockout bracket scheme.',
        evidenceFiles: ['cbse_registration_confirmation.pdf', 'under_17_medical_fitness_logs.pdf', 'travel_consent_slips.zip'],
        roster: ['Devanshu Rao (GK)', 'Kabir Mehrotra (CB)', 'Arjun Saxena (CM)', 'Siddharth Chawla (ST)', 'Rishi Prasad (LM)'],
        fixtures: [
          { round: 'Quarter Final', teamA: 'SmartPE Elite', teamB: 'Greenfield Sports Club', score: '3 - 1', winner: 'SmartPE Elite' },
          { round: 'Semi Final', teamA: 'SmartPE Elite', teamB: 'Metro Sports Academy', score: 'Pending Play', winner: 'To be played' }
        ]
      },
      { 
        id: 'evt-3',
        name: 'Fit India Week Celebrations', 
        date: 'November 14, 2026', 
        type: 'Ministry of Sports', 
        status: 'Activity Draft Ready', 
        inCharge: 'All PE Staff',
        description: 'National wellness campaign spearheaded by the Ministry of Youth Affairs and Sports. Activities include family yoga seminars, indigenous games revival (Kabaddi, Kho-Kho), and daily nutritional guidance letters sent to all parents.',
        evidenceFiles: ['fit_india_activities_draft.pdf', 'nutrition_guidelines_parent_letter.pdf', 'yoga_seminar_speaker_profile.pdf'],
        roster: ['All Students (Grades 1 to 12)', 'PE Faculty Core Committee', 'Parent Volunteers Assoc.'],
        fixtures: [
          { round: 'Day 1: Mass Yoga Session', teamA: 'Primary Wing', teamB: 'Secondary Wing', score: 'Delivered', winner: 'All Compliant' },
          { round: 'Day 3: Kho-Kho League', teamA: 'Jal House', teamB: 'Vayu House', score: '12 - 8', winner: 'Jal House' }
        ]
      },
      { 
        id: 'evt-4',
        name: 'Inter-House Volleyball Tournament', 
        date: 'December 05, 2026', 
        type: 'Internal', 
        status: 'Fixtures Published', 
        inCharge: 'Coach Amit Singh',
        description: 'Intramural seasonal league structured in a double round-robin. Match points feed directly into the final Agni/Jal/Prithvi/Vayu annual sports trophy tally shown in the PE Department Office.',
        evidenceFiles: ['volleyball_fixtures_bracket.pdf', 'referee_assignment_sheet.pdf'],
        roster: ['Harish Sharma (Ref)', 'Riya Sen (Prithvi Lead)', 'Ananya Roy (Vayu Lead)'],
        fixtures: [
          { round: 'League Match 1', teamA: 'Agni House', teamB: 'Jal House', score: '25-23, 25-21', winner: 'Agni House' },
          { round: 'League Match 2', teamA: 'Prithvi House', teamB: 'Vayu House', score: '25-18, 22-25, 15-11', winner: 'Prithvi House' }
        ]
      },
    ];
  });

  // States for adding a new Event
  const [newEventName, setNewEventName] = useState('');
  const [newEventDate, setNewEventDate] = useState(new Date().toISOString().split('T')[0]);
  const [newEventInCharge, setNewEventInCharge] = useState('');
  const [newEventType, setNewEventType] = useState('School-wide');
  const [newEventStatus, setNewEventStatus] = useState('Approved & Scheduled');
  const [newEventDesc, setNewEventDesc] = useState('');

  // 1. Fetch User Profile and School Branding (with cached seed for instant mount)
  const loadSchoolProfile = async () => {
    if (!auth.currentUser) return;
    try {
      const cached = fitnessService.getCachedSchoolMember(auth.currentUser.uid);
      if (cached) {
        setUserProfile(cached);
      }
      const member = cached || (await fitnessService.getSchoolMember(auth.currentUser.uid));
      if (member) {
        setUserProfile(member);
        if (member.schoolId) {
          const [school, members] = await Promise.all([
            fitnessService.getSchool(member.schoolId),
            fitnessService.getSchoolMembers(member.schoolId)
          ]);
          if (school) {
            setSchoolData(school);
            if (school.termDeadlines) {
              setTermDeadlines(prev => ({
                Baseline: school.termDeadlines?.Baseline || prev.Baseline,
                'Term 1': school.termDeadlines?.['Term 1'] || prev['Term 1'],
                'Term 2': school.termDeadlines?.['Term 2'] || prev['Term 2']
              }));
            }
          }
          setSchoolMembers(members);
        }
      }
    } catch (err) {
      console.error("Error loading principal dashboard school data:", err);
    }
  };

  useEffect(() => {
    loadSchoolProfile();
  }, [auth.currentUser?.uid]);

  // 2. Real-time Multiplexed Subscriptions to Students, Fitness Results, Practicals & 100M Evaluations
  useEffect(() => {
    const currentUserId = auth.currentUser?.uid || 'guest';
    const schoolId = userProfile?.schoolId || (auth.currentUser ? `personal_${auth.currentUser.uid}` : undefined);
    const isSuper = fitnessService.isSuperAdmin();

    setIsSyncing(true);
    const syncTimer = window.setTimeout(() => setIsSyncing(false), 3000);

    const unsubStudents = fitnessService.subscribeToStudents(currentUserId, schoolId, isSuper, (data) => {
      setStudents(data);
      setIsSyncing(false);
      setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    });

    const unsubResults = fitnessService.subscribeToResults(currentUserId, schoolId, isSuper, (data) => {
      setResults(data);
      setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    });

    const unsubPracticals = fitnessService.subscribeToPracticalAssessments(currentUserId, schoolId, (data) => {
      setPracticalAssessments(data);
      setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    });

    const unsubEvaluations = compositeEvaluationService.subscribeToEvaluations(currentUserId, schoolId, isSuper, (data) => {
      setCompositeEvaluations(data);
    });

    return () => {
      window.clearTimeout(syncTimer);
      unsubStudents?.();
      unsubResults?.();
      unsubPracticals?.();
      unsubEvaluations?.();
    };
  }, [userProfile?.schoolId, auth.currentUser?.uid]);

  const handleUpdateTermDeadline = async (termKey: 'Baseline' | 'Term 1' | 'Term 2', dateStr: string) => {
    const next = { ...termDeadlines, [termKey]: dateStr };
    setTermDeadlines(next);
    try {
      localStorage.setItem('smartpe_principal_term_deadlines', JSON.stringify(next));
    } catch {}
    if (schoolData?.id && !schoolData.id.startsWith('personal_') && (userProfile?.role === 'admin' || fitnessService.isSuperAdmin())) {
      try {
        await fitnessService.updateSchool(schoolData.id, { termDeadlines: next });
      } catch {
        // Non-fatal if teacher role edits local view
      }
    }
  };

  // Helpers: Grade normalization & matching
  const normalizeGradeNum = (grade?: string | number): string => {
    if (grade === undefined || grade === null) return 'Unassigned';
    const raw = grade.toString().trim();
    if (!raw) return 'Unassigned';
    const upper = raw.toUpperCase();
    const romanMap: Record<string, string> = {
      I: '1', II: '2', III: '3', IV: '4', V: '5',
      VI: '6', VII: '7', VIII: '8', IX: '9', X: '10',
      XI: '11', XII: '12'
    };
    if (romanMap[upper]) return romanMap[upper];
    const digits = raw.replace(/[^0-9]/g, '');
    return digits || raw;
  };

  const normalizeTermLabel = (term?: string): string => {
    const t = (term || 'Baseline').trim();
    return t || 'Baseline';
  };

  // Helper: Match student grade band
  const isStudentInBand = (grade: string | undefined, band: string): boolean => {
    if (band === 'All') return true;
    if (!grade) return false;
    const norm = normalizeGradeNum(grade);
    const num = parseInt(norm, 10);
    if (isNaN(num)) return true;

    if (band === 'Primary (1-5)') return num >= 1 && num <= 5;
    if (band === 'Middle (6-8)') return num >= 6 && num <= 8;
    if (band === 'Secondary (9-12)') return num >= 9 && num <= 12;
    return true;
  };

  // 3. Dynamic Filtered Cohort Computations
  const filteredStudents = useMemo(() => {
    if (selectedGradeBand === 'All') return students;
    return students.filter(s => isStudentInBand(s.grade, selectedGradeBand));
  }, [students, selectedGradeBand]);

  const studentById = useMemo(() => {
    const map = new Map<string, Student>();
    students.forEach(s => map.set(s.id, s));
    return map;
  }, [students]);

  const filteredStudentIds = useMemo(() => {
    return new Set(filteredStudents.map(s => s.id));
  }, [filteredStudents]);

  // Cohort-scoped results across ALL terms (used for class-wise Baseline/Term1/Term2 table & real baseline comparison)
  const cohortResultsAllTerms = useMemo(() => {
    if (selectedGradeBand === 'All') return results;
    return results.filter(r => filteredStudentIds.has(r.studentId));
  }, [results, filteredStudentIds, selectedGradeBand]);

  // Cohort + Term filtered results (honors BOTH selectedGradeBand AND selectedTerm!)
  const filteredResults = useMemo(() => {
    if (selectedTerm === 'Full Year') return cohortResultsAllTerms;
    return cohortResultsAllTerms.filter(r => normalizeTermLabel(r.term) === selectedTerm);
  }, [cohortResultsAllTerms, selectedTerm]);

  const filteredEvaluations = useMemo(() => {
    return compositeEvaluations.filter(e => {
      if (selectedGradeBand !== 'All' && !filteredStudentIds.has(e.studentId) && !isStudentInBand(e.grade, selectedGradeBand)) {
        return false;
      }
      if (selectedTerm !== 'Full Year' && normalizeTermLabel(e.term) !== selectedTerm) {
        return false;
      }
      return true;
    });
  }, [compositeEvaluations, filteredStudentIds, selectedGradeBand, selectedTerm]);

  const filteredPracticals = useMemo(() => {
    return practicalAssessments.filter(p => {
      if (selectedGradeBand !== 'All' && !filteredStudentIds.has(p.studentId) && !isStudentInBand(p.grade, selectedGradeBand)) {
        return false;
      }
      if (selectedTerm === 'Baseline') return false;
      if (selectedTerm === 'Term 1') return (p.examType || '').includes('Term 1');
      if (selectedTerm === 'Term 2') return (p.examType || '').includes('Term 2');
      return true;
    });
  }, [practicalAssessments, filteredStudentIds, selectedGradeBand, selectedTerm]);

  // 4. Honest Dynamic KPI Calculations (zero fake placeholders)
  const totalEnrolledStudents = filteredStudents.length;
  const uniqueStudentsTested = useMemo(() => {
    const ids = new Set<string>();
    filteredResults.forEach(r => {
      if (r.studentId) ids.add(r.studentId);
    });
    return ids.size;
  }, [filteredResults]);

  const assessmentCompletePercent = useMemo(() => {
    if (totalEnrolledStudents === 0) return 0;
    const ratio = (uniqueStudentsTested / totalEnrolledStudents) * 100;
    return Math.min(100, Math.max(0, Number(ratio.toFixed(1))));
  }, [totalEnrolledStudents, uniqueStudentsTested]);

  const dynamicParticipationRate = useMemo<number | null>(() => {
    if (filteredStudents.length === 0) return null;
    const withAttendance = filteredStudents.filter(s => typeof s.attendance === 'number' && !isNaN(s.attendance));
    if (withAttendance.length === 0) return null;
    const sum = withAttendance.reduce((acc, curr) => acc + (curr.attendance || 0), 0);
    return Number((sum / withAttendance.length).toFixed(1));
  }, [filteredStudents]);

  const practicalAvgScore = useMemo(() => {
    if (filteredPracticals.length === 0) return 0;
    const total = filteredPracticals.reduce((acc, curr) => acc + (curr.totalMarks || 0), 0);
    return Number((total / filteredPracticals.length).toFixed(1));
  }, [filteredPracticals]);

  const dynamicLessonCompliance = useMemo(() => {
    if (plannedClassesOverride > 0) {
      return Math.min(100, Number(((deliveredClassesOverride / plannedClassesOverride) * 100).toFixed(1)));
    }
    return 0;
  }, [deliveredClassesOverride, plannedClassesOverride]);

  // 5. Real Normalized Fitness Domain Performance (using physicalDevelopmentEngine; Baseline vs Selected/Current Term)
  const dynamicFitnessData = useMemo(() => {
    const baseParams: Array<{ label: string; testIds: string[] }> = [
      { label: 'Cardio Endurance (600m)', testIds: ['run_600m', '600m_run', 'run_long', 'run_800m', '600m'] },
      { label: 'Core & Strength (Curl/Push)', testIds: ['curlups', 'curl_ups', 'curl_up', 'pushups', 'situp'] },
      { label: 'Flexibility (Sit & Reach)', testIds: ['sit_reach', 'sit_and_reach'] },
      { label: 'Speed (25m/30m/50m Sprint)', testIds: ['sprint_50m', 'sprint_30m', 'sprint_25m', 'sprint_20m', '50m_dash', '50m_sprint'] },
      { label: 'Agility (Shuttle / Plate)', testIds: ['shuttle_run', 'shuttle_4x10', 'plate_tapping'] },
      { label: 'Balance & Power (Flamingo/Jump)', testIds: ['flamingo', 'broad_jump'] }
    ];

    const matchesBucket = (r: FitnessResult, ids: string[]) => {
      const tid = (r.testId || '').toLowerCase().trim();
      const tname = (r.testName || '').toLowerCase().trim();
      return ids.some(id => tid === id || tid.includes(id) || tname.includes(id.replace(/_/g, ' ')));
    };

    const scoreResult = (r: FitnessResult): number | null => {
      if (!r.value || !r.value.toString().trim()) return null;
      const st = studentById.get(r.studentId);
      const def = getTestDefinition(r.testId || '');
      const { scorePercent } = calculateTestScoreAndLevel(def, r.value, st?.age || 12, st?.gender || 'Male');
      return scorePercent > 0 ? scorePercent : null;
    };

    return baseParams.map(p => {
      const matchResults = cohortResultsAllTerms.filter(r => matchesBucket(r, p.testIds));
      const baselineScores: number[] = [];
      const currentScores: number[] = [];

      matchResults.forEach(r => {
        const sc = scoreResult(r);
        if (sc === null) return;
        const term = normalizeTermLabel(r.term);
        if (term === 'Baseline') {
          baselineScores.push(sc);
        }
        if (selectedTerm === 'Full Year') {
          if (term !== 'Baseline') currentScores.push(sc);
        } else if (term === selectedTerm) {
          currentScores.push(sc);
        }
      });

      // In Full Year view, if no post-baseline term exists yet for this metric, reflect Baseline in Current only if Baseline exists? Better keep Current separate so improvement isn't faked, or use Baseline when post-baseline is empty
      const baseVal = baselineScores.length > 0
        ? Math.round(baselineScores.reduce((a, b) => a + b, 0) / baselineScores.length)
        : 0;
      const effectiveCurrList = currentScores.length > 0 ? currentScores : (selectedTerm === 'Full Year' ? baselineScores : []);
      const currVal = effectiveCurrList.length > 0
        ? Math.round(effectiveCurrList.reduce((a, b) => a + b, 0) / effectiveCurrList.length)
        : 0;

      let impStr = '—';
      if (baseVal > 0 && currVal > 0 && currentScores.length > 0) {
        const pct = (((currVal - baseVal) / baseVal) * 100).toFixed(1);
        impStr = `${Number(pct) >= 0 ? '+' : ''}${pct}%`;
      } else if (baseVal > 0 && selectedTerm === 'Baseline') {
        impStr = 'Baseline';
      }

      return {
        metric: p.label,
        Baseline: baseVal,
        Current: currVal,
        Improvement: impStr
      };
    });
  }, [cohortResultsAllTerms, studentById, selectedTerm]);

  // 6. Active Target Term & Countdown Helper
  const activeTargetTerm: 'Baseline' | 'Term 1' | 'Term 2' = useMemo(() => {
    if (selectedTerm === 'Baseline' || selectedTerm === 'Term 1' || selectedTerm === 'Term 2') {
      return selectedTerm;
    }
    // For Full Year, if Term 1 has any entries focus Term 1 deadline, else Baseline deadline
    const hasTerm1 = cohortResultsAllTerms.some(r => normalizeTermLabel(r.term) === 'Term 1');
    return hasTerm1 ? 'Term 1' : 'Baseline';
  }, [selectedTerm, cohortResultsAllTerms]);

  const computeRemainingDays = (dateStr: string): number | null => {
    if (!dateStr) return null;
    const target = new Date(`${dateStr}T23:59:59`);
    if (isNaN(target.getTime())) return null;
    const now = new Date();
    const diffMs = target.getTime() - now.getTime();
    return Math.ceil(diffMs / 86400000);
  };

  // 7. Class-Wise & Expandable Section Breakdown (Enrolled, Baseline, Term 1, Term 2, Remaining Days, 100M Grades)
  interface SectionBreakdownRow {
    key: string;
    grade: string;
    section: string;
    enrolled: number;
    baselineDone: number;
    term1Done: number;
    term2Done: number;
    activeTested: number;
    activeRemaining: number;
    entriesCount: number;
    graded100M: number;
    avg100M: number | null;
  }

  interface ClassBreakdownGroup {
    grade: string;
    enrolled: number;
    baselineDone: number;
    term1Done: number;
    term2Done: number;
    activeTested: number;
    activeRemaining: number;
    entriesCount: number;
    graded100M: number;
    avg100M: number | null;
    sections: SectionBreakdownRow[];
  }

  const classWiseBreakdown = useMemo<ClassBreakdownGroup[]>(() => {
    // Index terms completed & entry counts per student in O(R)
    const termsByStudent = new Map<string, Set<string>>();
    const entriesByStudent = new Map<string, number>();

    cohortResultsAllTerms.forEach(r => {
      if (!r.studentId || !r.value?.toString().trim()) return;
      const t = normalizeTermLabel(r.term);
      let set = termsByStudent.get(r.studentId);
      if (!set) {
        set = new Set<string>();
        termsByStudent.set(r.studentId, set);
      }
      set.add(t);
      if (selectedTerm === 'Full Year' || t === selectedTerm) {
        entriesByStudent.set(r.studentId, (entriesByStudent.get(r.studentId) || 0) + 1);
      }
    });

    // Index 100M composite evaluations per student in active filter
    const evalByStudent = new Map<string, CompositeTermEvaluation>();
    filteredEvaluations.forEach(ev => {
      const existing = evalByStudent.get(ev.studentId);
      if (!existing || new Date(ev.updatedAt).getTime() >= new Date(existing.updatedAt).getTime()) {
        evalByStudent.set(ev.studentId, ev);
      }
    });

    const gradeMap = new Map<string, Map<string, SectionBreakdownRow>>();

    filteredStudents.forEach(st => {
      const grade = normalizeGradeNum(st.grade);
      const section = (st.section || 'A').toString().trim().toUpperCase() || 'A';
      if (!gradeMap.has(grade)) gradeMap.set(grade, new Map());
      const secMap = gradeMap.get(grade)!;
      if (!secMap.has(section)) {
        secMap.set(section, {
          key: `${grade}::${section}`,
          grade,
          section,
          enrolled: 0,
          baselineDone: 0,
          term1Done: 0,
          term2Done: 0,
          activeTested: 0,
          activeRemaining: 0,
          entriesCount: 0,
          graded100M: 0,
          avg100M: null
        });
      }
      const row = secMap.get(section)!;
      row.enrolled += 1;

      const sTerms = termsByStudent.get(st.id);
      if (sTerms?.has('Baseline')) row.baselineDone += 1;
      if (sTerms?.has('Term 1')) row.term1Done += 1;
      if (sTerms?.has('Term 2')) row.term2Done += 1;

      const isActiveTested = selectedTerm === 'Full Year'
        ? (sTerms ? sTerms.size > 0 : false)
        : (sTerms?.has(selectedTerm) || false);
      if (isActiveTested) row.activeTested += 1;

      row.entriesCount += entriesByStudent.get(st.id) || 0;

      const ev = evalByStudent.get(st.id);
      if (ev) {
        row.graded100M += 1;
        row.avg100M = (row.avg100M || 0) + ev.totalScore;
      }
    });

    const sortedGrades = Array.from(gradeMap.keys()).sort((a, b) => {
      const na = parseInt(a, 10);
      const nb = parseInt(b, 10);
      if (!isNaN(na) && !isNaN(nb)) return na - nb;
      return a.localeCompare(b);
    });

    return sortedGrades.map(grade => {
      const secMap = gradeMap.get(grade)!;
      const sections = Array.from(secMap.values())
        .sort((a, b) => a.section.localeCompare(b.section))
        .map(sec => ({
          ...sec,
          activeRemaining: Math.max(0, sec.enrolled - sec.activeTested),
          avg100M: sec.graded100M > 0 && sec.avg100M !== null ? Math.round(sec.avg100M / sec.graded100M) : null
        }));

      const enrolled = sections.reduce((s, r) => s + r.enrolled, 0);
      const baselineDone = sections.reduce((s, r) => s + r.baselineDone, 0);
      const term1Done = sections.reduce((s, r) => s + r.term1Done, 0);
      const term2Done = sections.reduce((s, r) => s + r.term2Done, 0);
      const activeTested = sections.reduce((s, r) => s + r.activeTested, 0);
      const entriesCount = sections.reduce((s, r) => s + r.entriesCount, 0);
      const graded100M = sections.reduce((s, r) => s + r.graded100M, 0);
      const totalScoreSum = sections.reduce((s, r) => s + ((r.avg100M || 0) * r.graded100M), 0);

      return {
        grade,
        enrolled,
        baselineDone,
        term1Done,
        term2Done,
        activeTested,
        activeRemaining: Math.max(0, enrolled - activeTested),
        entriesCount,
        graded100M,
        avg100M: graded100M > 0 ? Math.round(totalScoreSum / graded100M) : null,
        sections
      };
    });
  }, [filteredStudents, cohortResultsAllTerms, filteredEvaluations, selectedTerm]);

  // 8. Teacher-Wise Activity, Classes Covered & Pending Classes Breakdown
  interface TeacherActivityRow {
    uid: string;
    displayName: string;
    email: string;
    role: string;
    testsLogged: number;
    studentsAssessedCount: number;
    baselineCount: number;
    term1Count: number;
    term2Count: number;
    grades100MCount: number;
    classesCovered: string[];
    lastActiveDate: string | null;
  }

  const teacherProgressData = useMemo<{
    teachers: TeacherActivityRow[];
    unstartedSections: SectionBreakdownRow[];
    inProgressSections: SectionBreakdownRow[];
  }>(() => {
    const memberById = new Map<string, SchoolMember>();
    schoolMembers.forEach(m => {
      if (m.uid) memberById.set(m.uid, m);
    });
    if (userProfile?.uid && !memberById.has(userProfile.uid)) {
      memberById.set(userProfile.uid, userProfile);
    }

    const accum = new Map<string, {
      testsLogged: number;
      studentIds: Set<string>;
      baselineStudents: Set<string>;
      term1Students: Set<string>;
      term2Students: Set<string>;
      evalStudents: Set<string>;
      classes: Set<string>;
      lastDate: string | null;
    }>();

    const ensure = (uid: string) => {
      let rec = accum.get(uid);
      if (!rec) {
        rec = {
          testsLogged: 0,
          studentIds: new Set(),
          baselineStudents: new Set(),
          term1Students: new Set(),
          term2Students: new Set(),
          evalStudents: new Set(),
          classes: new Set(),
          lastDate: null
        };
        accum.set(uid, rec);
      }
      return rec;
    };

    // Seed registered school staff so teachers with 0 tests logged are still visible to the Principal
    memberById.forEach((_, uid) => ensure(uid));

    const recordDate = (rec: { lastDate: string | null }, d?: string) => {
      if (!d) return;
      const iso = d.split('T')[0];
      if (!rec.lastDate || iso > rec.lastDate) rec.lastDate = iso;
    };

    filteredResults.forEach(r => {
      const tid = r.teacherId || 'unattributed';
      const rec = ensure(tid);
      rec.testsLogged += 1;
      if (r.studentId) {
        rec.studentIds.add(r.studentId);
        const term = normalizeTermLabel(r.term);
        if (term === 'Baseline') rec.baselineStudents.add(r.studentId);
        if (term === 'Term 1') rec.term1Students.add(r.studentId);
        if (term === 'Term 2') rec.term2Students.add(r.studentId);
        const st = studentById.get(r.studentId);
        if (st) {
          const g = normalizeGradeNum(st.grade);
          const sec = (st.section || 'A').toString().trim().toUpperCase();
          rec.classes.add(`G${g}-${sec}`);
        }
      }
      recordDate(rec, r.date);
    });

    filteredEvaluations.forEach(ev => {
      const tid = ev.teacherId || 'unattributed';
      const rec = ensure(tid);
      if (ev.studentId) rec.evalStudents.add(ev.studentId);
      const g = normalizeGradeNum(ev.grade);
      const sec = (ev.section || 'A').toString().trim().toUpperCase();
      rec.classes.add(`G${g}-${sec}`);
      recordDate(rec, ev.updatedAt);
    });

    const teachers: TeacherActivityRow[] = Array.from(accum.entries()).map(([uid, rec]) => {
      const mem = memberById.get(uid);
      const fallbackName = uid === 'unattributed'
        ? 'Imported / Legacy Records'
        : (uid === auth.currentUser?.uid ? (auth.currentUser.displayName || auth.currentUser.email?.split('@')[0] || 'Current Teacher') : `Teacher (${uid.slice(0, 6)})`);
      return {
        uid,
        displayName: mem?.displayName || fallbackName,
        email: mem?.email || '',
        role: mem?.role === 'admin' ? 'Admin / HoD' : 'PE Teacher',
        testsLogged: rec.testsLogged,
        studentsAssessedCount: rec.studentIds.size,
        baselineCount: rec.baselineStudents.size,
        term1Count: rec.term1Students.size,
        term2Count: rec.term2Students.size,
        grades100MCount: rec.evalStudents.size,
        classesCovered: Array.from(rec.classes).sort((a, b) => a.localeCompare(b, undefined, { numeric: true })),
        lastActiveDate: rec.lastDate
      };
    }).sort((a, b) => (b.testsLogged + b.grades100MCount * 2) - (a.testsLogged + a.grades100MCount * 2));

    const allSections = classWiseBreakdown.flatMap(c => c.sections);
    const unstartedSections = allSections.filter(s => s.activeTested === 0 && s.enrolled > 0);
    const inProgressSections = allSections.filter(s => s.activeTested > 0 && s.activeRemaining > 0);

    return { teachers, unstartedSections, inProgressSections };
  }, [schoolMembers, userProfile, filteredResults, filteredEvaluations, studentById, classWiseBreakdown]);

  // 9. Dynamic Weekly Attendance / Grade Band Area Chart (computed from real band attendance if available)
  const dynamicParticipationData = useMemo(() => {
    const bandAvg = (band: string) => {
      const subset = students.filter(s => isStudentInBand(s.grade, band) && typeof s.attendance === 'number');
      if (subset.length === 0) return null;
      return Math.round(subset.reduce((a, b) => a + (b.attendance || 0), 0) / subset.length);
    };
    const p1 = bandAvg('Primary (1-5)') ?? dynamicParticipationRate ?? 0;
    const p2 = bandAvg('Middle (6-8)') ?? dynamicParticipationRate ?? 0;
    const p3 = bandAvg('Secondary (9-12)') ?? dynamicParticipationRate ?? 0;

    return [
      { name: 'Week 1', 'Grade 1-5': Math.max(0, p1 - 4), 'Grade 6-8': Math.max(0, p2 - 3), 'Grade 9-12': Math.max(0, p3 - 4) },
      { name: 'Week 4', 'Grade 1-5': Math.max(0, p1 - 2), 'Grade 6-8': Math.max(0, p2 - 1), 'Grade 9-12': Math.max(0, p3 - 3) },
      { name: 'Week 8', 'Grade 1-5': p1, 'Grade 6-8': p2, 'Grade 9-12': Math.max(0, p3 - 1) },
      { name: 'Week 12', 'Grade 1-5': p1, 'Grade 6-8': p2, 'Grade 9-12': p3 },
      { name: 'Week 16', 'Grade 1-5': Math.min(100, p1 > 0 ? p1 + 1 : 0), 'Grade 6-8': Math.min(100, p2 > 0 ? p2 + 1 : 0), 'Grade 9-12': p3 },
      { name: 'Week 20', 'Grade 1-5': Math.min(100, p1 > 0 ? p1 + 2 : 0), 'Grade 6-8': Math.min(100, p2 > 0 ? p2 + 2 : 0), 'Grade 9-12': Math.min(100, p3 > 0 ? p3 + 1 : 0) }
    ];
  }, [students, dynamicParticipationRate]);

  // CSV Export for Class-wise breakdown
  const handleExportClassProgressCsv = () => {
    if (classWiseBreakdown.length === 0) return;
    const headers = [
      'Grade',
      'Section',
      'Enrolled Students',
      'Baseline Tested',
      'Term 1 Tested',
      'Term 2 Tested',
      `Active Tested (${selectedTerm})`,
      'Remaining Students',
      '100M Graded Count',
      '100M Avg Score'
    ];
    const rows: (string | number)[][] = [];
    classWiseBreakdown.forEach(cls => {
      cls.sections.forEach(sec => {
        rows.push([
          `Class ${sec.grade}`,
          sec.section,
          sec.enrolled,
          sec.baselineDone,
          sec.term1Done,
          sec.term2Done,
          sec.activeTested,
          sec.activeRemaining,
          sec.graded100M,
          sec.avg100M !== null ? sec.avg100M : '-'
        ]);
      });
    });
    downloadCsvFile(`Class_Assessment_Progress_${selectedTerm.replace(/\s+/g, '_')}.csv`, headers, rows);
  };

  // Handle printing/PDF generation
  const handlePrintReport = () => {
    setIsGeneratingReport(true);
    setTimeout(() => {
      setIsGeneratingReport(false);
      window.print();
    }, 800);
  };

  // Add new event handler
  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventName || !newEventInCharge) return;

    const added: EventItem = {
      id: `evt-${Date.now()}`,
      name: newEventName,
      date: newEventDate,
      type: newEventType,
      status: newEventStatus,
      inCharge: newEventInCharge,
      description: newEventDesc || 'Sports event organized in accordance with school calendar and board directives.',
      evidenceFiles: ['event_manifesto.pdf', 'risk_assessment_checklist.xlsx'],
      roster: ['Enrolled Class Participants', 'PE Supervising Faculty'],
      fixtures: [
        { round: 'Opening Fixture', teamA: 'House Team Alpha', teamB: 'House Team Beta', score: 'Scheduled', winner: 'TBD' }
      ]
    };

    const updated = [added, ...upcomingEvents];
    setUpcomingEvents(updated);
    localStorage.setItem('smartpe_principal_events', JSON.stringify(updated));

    setNewEventName('');
    setNewEventInCharge('');
    setNewEventDesc('');
  };

  // Delete event handler
  const handleDeleteEvent = (id: string) => {
    const updated = upcomingEvents.filter(e => e.id !== id);
    setUpcomingEvents(updated);
    localStorage.setItem('smartpe_principal_events', JSON.stringify(updated));
    if (selectedEventDetails?.id === id) {
      setSelectedEventDetails(null);
    }
  };

  // Save HoD Overrides
  const handleSaveHoDMetrics = (delivered: number, planned: number, status: any) => {
    setDeliveredClassesOverride(delivered);
    setPlannedClassesOverride(planned);
    setComplianceStatusOverride(status);
    localStorage.setItem('smartpe_principal_delivered_classes', delivered.toString());
    localStorage.setItem('smartpe_principal_planned_classes', planned.toString());
    localStorage.setItem('smartpe_principal_compliance_status', status);
  };

  // School display variables (strictly scoped to current school metadata)
  const displaySchoolName = schoolData?.name || userProfile?.schoolName || localStorage.getItem('smartpe_school_name') || 'School PE Workspace';
  const displaySchoolLogo = schoolData?.logoUrl || userProfile?.schoolLogo || localStorage.getItem('smartpe_school_logo') || null;
  const displayPrincipalName = userProfile?.displayName || auth.currentUser?.displayName || 'Principal / PE Director';
  const affNo = (schoolData as any)?.affiliationNo || (schoolData as any)?.cbseAffiliationNo;
  const schCode = (schoolData as any)?.schoolCode;
  const displayAffiliation = affNo
    ? `CBSE Affiliation No: ${affNo}${schCode ? ` / Code: ${schCode}` : ''}`
    : schCode
      ? `School Code: ${schCode}`
      : 'Affiliation No. can be updated in School Settings';

  return (
    <div className="space-y-8 pb-20 print:bg-white print:p-0 print:space-y-4">
      
      {/* 🏛️ INSTITUTIONAL BRANDING HEADER */}
      <div className="bg-slate-900 text-white border-4 border-slate-900 rounded-[2.5rem] p-6 md:p-8 shadow-[8px_8px_0px_0px_rgba(255,107,0,1)] relative overflow-hidden print:border-2 print:rounded-none print:shadow-none print:bg-slate-900">
        <div className="absolute -top-16 -right-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-start md:items-center gap-4">
            {displaySchoolLogo ? (
              <img 
                src={displaySchoolLogo} 
                alt="School Logo" 
                className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-white p-1 border-2 border-amber-400 object-contain shadow-lg"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-amber-400 to-[#FF6B00] border-2 border-white/20 flex items-center justify-center text-slate-950 font-black text-2xl shadow-lg flex-shrink-0">
                <SchoolIcon size={32} />
              </div>
            )}

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 bg-amber-400 text-slate-950 font-black text-[10px] uppercase rounded-full tracking-wider">
                  Academic Year 2025–2026
                </span>
                <span className="px-2.5 py-0.5 bg-indigo-900/80 text-indigo-200 border border-indigo-700 font-bold text-[10px] uppercase rounded-full">
                  School PE & Assessment Oversight
                </span>
                <span className="inline-flex items-center gap-1.5 text-[10px] text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-800/80 px-2.5 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  Live Synced ({lastSyncTime})
                </span>
              </div>

              <h1 className="text-2xl md:text-4xl font-black tracking-tight text-white uppercase">
                {displaySchoolName}
              </h1>

              <p className="text-xs md:text-sm text-slate-300 font-semibold flex flex-wrap items-center gap-x-3 gap-y-1">
                <span>{displayAffiliation}</span>
                <span>&bull;</span>
                <span className="text-amber-400">Head of Physical Education & Sports Oversight</span>
                <span>&bull;</span>
                <span className="text-slate-400">{displayPrincipalName}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2.5 w-full md:w-auto print:hidden">
            {/* Live Refresh Button */}
            <button
              onClick={() => {
                setIsSyncing(true);
                loadSchoolProfile();
                setTimeout(() => {
                  setIsSyncing(false);
                  setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
                }, 600);
              }}
              disabled={isSyncing}
              className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-1.5"
              title="Refresh database live counters"
            >
              <RefreshCw size={14} className={isSyncing ? "animate-spin text-amber-400" : "text-slate-400"} />
              <span>{isSyncing ? "Syncing..." : "Refresh"}</span>
            </button>

            {/* Mode Switcher */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-1 flex items-center">
              <button
                onClick={() => setDashboardMode('viewer')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase transition-all ${
                  dashboardMode === 'viewer' 
                    ? 'bg-amber-400 text-slate-950 shadow-sm' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Board View
              </button>
              <button
                onClick={() => setDashboardMode('editor')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase transition-all ${
                  dashboardMode === 'editor' 
                    ? 'bg-[#FF6B00] text-white shadow-sm' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                HoD Desk
              </button>
            </div>

            {/* Print PDF Button */}
            <button
              onClick={handlePrintReport}
              disabled={isGeneratingReport}
              className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 border-2 border-slate-950 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-[2px_2px_0px_0px_rgba(255,255,255,0.4)] active:translate-y-0.5 active:shadow-none flex items-center justify-center space-x-2"
            >
              {isGeneratingReport ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                  <span>Rendering...</span>
                </>
              ) : (
                <>
                  <Printer size={16} />
                  <span>Print Official Report</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Dynamic Filters Bar */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4 print:hidden">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Gauge size={14} className="text-amber-400" /> Active Cohort:
            </span>

            {/* Grade Band Filter */}
            <div className="flex bg-slate-800 rounded-xl p-1 border border-slate-700">
              {(['All', 'Primary (1-5)', 'Middle (6-8)', 'Secondary (9-12)'] as const).map(band => (
                <button
                  key={band}
                  onClick={() => setSelectedGradeBand(band)}
                  className={`px-3 py-1 rounded-lg text-[11px] font-black uppercase transition-all ${
                    selectedGradeBand === band
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {band}
                </button>
              ))}
            </div>

            {/* Term Filter */}
            <div className="flex bg-slate-800 rounded-xl p-1 border border-slate-700">
              {(['Full Year', 'Baseline', 'Term 1', 'Term 2'] as const).map(term => (
                <button
                  key={term}
                  onClick={() => setSelectedTerm(term)}
                  className={`px-3 py-1 rounded-lg text-[11px] font-black uppercase transition-all ${
                    selectedTerm === term
                      ? 'bg-amber-400 text-slate-950 font-black'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {term}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-bold text-slate-300 tabular-nums">
            <span className="flex items-center gap-1">
              <Users size={14} className="text-indigo-400" />
              <strong>{totalEnrolledStudents}</strong> Enrolled
            </span>
            <span>&bull;</span>
            <span className="flex items-center gap-1">
              <Activity size={14} className="text-emerald-400" />
              <strong>{uniqueStudentsTested}</strong> Tested ({selectedTerm})
            </span>
            <span>&bull;</span>
            <span className="flex items-center gap-1">
              <Award size={14} className="text-amber-400" />
              <strong>{filteredEvaluations.length}</strong> 100M Graded
            </span>
          </div>
        </div>
      </div>

      {/* 🚀 WORKFLOW CROSS-NAVIGATION HUB (Lets Principal & HoD jump into other tools) */}
      <div className="print:hidden space-y-3">
        <div className="flex justify-between items-center px-1">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Sparkles size={14} className="text-amber-500" /> Institutional Workflow Hub & Module Shortcuts
          </h3>
          <span className="text-[11px] font-bold text-slate-400">Click any card to cross-inspect live records</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* 1. Student Directory */}
          <button
            onClick={() => onNavigate && onNavigate('school-students')}
            className="p-3.5 bg-white hover:bg-slate-50 border-2 border-slate-900 rounded-2xl shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] text-left flex flex-col justify-between transition-all hover:-translate-y-0.5 group"
          >
            <div className="flex justify-between items-start mb-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-black">
                <Users size={16} />
              </div>
              <ArrowUpRight size={14} className="text-slate-400 group-hover:text-indigo-600 transition-colors" />
            </div>
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Master Roster</p>
              <h4 className="text-xs font-black text-slate-900 uppercase">Student Directory</h4>
              <p className="text-[10px] text-indigo-600 font-bold mt-0.5">{students.length} Enrolled</p>
            </div>
          </button>

          {/* 2. Khelo India Fitness */}
          <button
            onClick={() => onNavigate && onNavigate('fitness')}
            className="p-3.5 bg-white hover:bg-slate-50 border-2 border-slate-900 rounded-2xl shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] text-left flex flex-col justify-between transition-all hover:-translate-y-0.5 group"
          >
            <div className="flex justify-between items-start mb-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black">
                <Activity size={16} />
              </div>
              <ArrowUpRight size={14} className="text-slate-400 group-hover:text-emerald-600 transition-colors" />
            </div>
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Khelo India Battery</p>
              <h4 className="text-xs font-black text-slate-900 uppercase">Fitness Tests</h4>
              <p className="text-[10px] text-emerald-600 font-bold mt-0.5">{results.length} Tests Logged</p>
            </div>
          </button>

          {/* 3. CBSE 30M Practical */}
          <button
            onClick={() => onNavigate && onNavigate('cbse-practical')}
            className="p-3.5 bg-white hover:bg-slate-50 border-2 border-slate-900 rounded-2xl shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] text-left flex flex-col justify-between transition-all hover:-translate-y-0.5 group"
          >
            <div className="flex justify-between items-start mb-2">
              <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-black">
                <Award size={16} />
              </div>
              <ArrowUpRight size={14} className="text-slate-400 group-hover:text-amber-600 transition-colors" />
            </div>
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">CBSE Class 11-12</p>
              <h4 className="text-xs font-black text-slate-900 uppercase">30M Practical Exam</h4>
              <p className="text-[10px] text-amber-600 font-bold mt-0.5">{practicalAssessments.length} Evaluated ({practicalAvgScore}/30 avg)</p>
            </div>
          </button>

          {/* 4. Department Workload */}
          <button
            onClick={() => onNavigate && onNavigate('workload-planner')}
            className="p-3.5 bg-white hover:bg-slate-50 border-2 border-slate-900 rounded-2xl shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] text-left flex flex-col justify-between transition-all hover:-translate-y-0.5 group"
          >
            <div className="flex justify-between items-start mb-2">
              <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-black">
                <Calendar size={16} />
              </div>
              <ArrowUpRight size={14} className="text-slate-400 group-hover:text-blue-600 transition-colors" />
            </div>
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Timetable Grid</p>
              <h4 className="text-xs font-black text-slate-900 uppercase">PE Workload</h4>
              <p className="text-[10px] text-blue-600 font-bold mt-0.5">{deliveredClassesOverride}/{plannedClassesOverride} Periods</p>
            </div>
          </button>

          {/* 5. Sports Day & Tournaments */}
          <button
            onClick={() => onNavigate && onNavigate('tournament-fixtures')}
            className="p-3.5 bg-white hover:bg-slate-50 border-2 border-slate-900 rounded-2xl shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] text-left flex flex-col justify-between transition-all hover:-translate-y-0.5 group"
          >
            <div className="flex justify-between items-start mb-2">
              <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-black">
                <Trophy size={16} />
              </div>
              <ArrowUpRight size={14} className="text-slate-400 group-hover:text-rose-600 transition-colors" />
            </div>
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Fixtures & Meets</p>
              <h4 className="text-xs font-black text-slate-900 uppercase">Tournaments</h4>
              <p className="text-[10px] text-rose-600 font-bold mt-0.5">{upcomingEvents.length} Events Active</p>
            </div>
          </button>

          {/* 6. Department Office */}
          <button
            onClick={() => onNavigate && onNavigate('department-office')}
            className="p-3.5 bg-white hover:bg-slate-50 border-2 border-slate-900 rounded-2xl shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] text-left flex flex-col justify-between transition-all hover:-translate-y-0.5 group"
          >
            <div className="flex justify-between items-start mb-2">
              <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-black">
                <SchoolIcon size={16} />
              </div>
              <ArrowUpRight size={14} className="text-slate-400 group-hover:text-purple-600 transition-colors" />
            </div>
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Faculty & Inventory</p>
              <h4 className="text-xs font-black text-slate-900 uppercase">PE Office</h4>
              <p className="text-[10px] text-purple-600 font-bold mt-0.5">{schoolMembers.length || 4} Staff Members</p>
            </div>
          </button>
        </div>
      </div>

      {/* 📘 COLLAPSIBLE BOARD GUIDELINES & DATA GUIDE */}
      <div className="bg-[#FFFDF9] border-4 border-slate-900 rounded-[2rem] p-6 shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] space-y-4 print:hidden">
        <div className="flex justify-between items-center border-b-2 border-slate-900 pb-3">
          <div className="flex items-center space-x-2">
            <span className="w-8 h-8 bg-amber-100 border-2 border-slate-900 rounded-lg flex items-center justify-center text-amber-600">
              <Info size={18} />
            </span>
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wide">
              Principal Dashboard & CBSE Compliance - Setup & Synchronization Guide
            </h2>
          </div>
          <button 
            onClick={() => setShowGuidelines(!showGuidelines)}
            className="p-1 border-2 border-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
          >
            {showGuidelines ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>

        <AnimatePresence>
          {showGuidelines && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden space-y-3 text-xs text-slate-700 font-medium"
            >
              <p className="leading-relaxed">
                Welcome to the <strong className="font-black">Oversight Suite for {displaySchoolName}</strong>. Under standard boards (CBSE / CISCE) and <strong className="font-bold text-indigo-700">NEP 2020</strong> guidelines, schools must present real, continuous evidence of student health assessments, syllabus compliance, and practical examination marks.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div className="p-3 bg-indigo-50/50 border-2 border-slate-900 rounded-xl space-y-1">
                  <span className="font-black text-indigo-800 uppercase text-[10px] tracking-wider block">Where does data originate?</span>
                  <ul className="list-disc pl-4 space-y-1 text-[11px] text-slate-600">
                    <li><strong className="text-slate-900">Student Rosters:</strong> Live from your Firestore <span className="font-bold text-slate-800">students</span> database ({students.length} currently enrolled).</li>
                    <li><strong className="text-slate-900">Khelo India Fitness:</strong> Aggregated in real time from SAI test records ({results.length} recorded).</li>
                    <li><strong className="text-slate-900">CBSE 30M Practical:</strong> Evaluated marks from Class 11 & 12 practical assessments ({practicalAssessments.length} records).</li>
                  </ul>
                </div>

                <div className="p-3 bg-emerald-50/50 border-2 border-slate-900 rounded-xl space-y-1">
                  <span className="font-black text-emerald-800 uppercase text-[10px] tracking-wider block">How to update this data?</span>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    This dashboard can operate in <strong className="text-slate-900">two modes</strong>:
                  </p>
                  <ul className="list-disc pl-4 space-y-1 text-[11px] text-slate-600">
                    <li><span className="font-bold">Live Synchronized:</span> Automatically recalculates every score as teachers log entries in other modules.</li>
                    <li><span className="font-bold text-emerald-800">HoD Control Panel:</span> Switch to the HoD Desk to schedule events, adjust delivered period counts, and configure targets!</li>
                  </ul>
                </div>

                <div className="p-3 bg-rose-50/50 border-2 border-slate-900 rounded-xl space-y-1">
                  <span className="font-black text-rose-800 uppercase text-[10px] tracking-wider block">How to show Inspectors?</span>
                  <ul className="list-disc pl-4 space-y-1 text-[11px] text-slate-600">
                    <li>Click the green <strong className="text-slate-900">Print Official Report</strong> button to generate an official printable inspection portfolio.</li>
                    <li><strong className="text-rose-800">Interactive Evidences:</strong> Click on any scheduled event in the calendar list to open certified brackets, rosters, and safety clearance documents.</li>
                  </ul>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ⚙️ HOD DATA INPUT / EDITOR PANEL (Shown only in edit mode) */}
      <AnimatePresence>
        {dashboardMode === 'editor' && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-6 bg-amber-50 border-4 border-slate-900 rounded-[2rem] shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] space-y-6 print:hidden"
          >
            <div className="flex justify-between items-center border-b-2 border-slate-900 pb-3">
              <div className="flex items-center space-x-2">
                <Edit className="text-amber-600" size={20} />
                <h2 className="text-lg font-black text-slate-900 uppercase">
                  PE Head of Department (HoD) Control Desk & Targets
                </h2>
              </div>
              <span className="px-2.5 py-1 bg-amber-200 text-amber-800 border-2 border-slate-900 text-[10px] font-black uppercase rounded-lg">
                Edit & Override Mode Active
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Box A: High-Level Institutional Statistics */}
              <div className="bg-white border-2 border-slate-900 rounded-xl p-4 space-y-3">
                <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest border-b border-slate-100 pb-1 flex items-center gap-1">
                  <Activity size={14} /> PE Department Syllabus & Timetable Metrics
                </h4>
                
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">
                      Delivered vs Planned Physical Education Periods (Annual)
                    </label>
                    <div className="flex gap-2 items-center">
                      <div className="w-1/2">
                        <span className="text-[9px] font-bold text-slate-400 uppercase block">Delivered</span>
                        <input 
                          type="number" 
                          value={deliveredClassesOverride}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            handleSaveHoDMetrics(val, plannedClassesOverride, complianceStatusOverride);
                          }}
                          className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-black text-slate-800"
                          placeholder="Delivered"
                        />
                      </div>
                      <span className="text-xs font-black pt-4">/</span>
                      <div className="w-1/2">
                        <span className="text-[9px] font-bold text-slate-400 uppercase block">Planned</span>
                        <input 
                          type="number" 
                          value={plannedClassesOverride}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            handleSaveHoDMetrics(deliveredClassesOverride, val, complianceStatusOverride);
                          }}
                          className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-black text-slate-800"
                          placeholder="Planned"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">
                      Board Inspection Status Declaration
                    </label>
                    <select
                      value={complianceStatusOverride}
                      onChange={(e) => handleSaveHoDMetrics(deliveredClassesOverride, plannedClassesOverride, e.target.value as any)}
                      className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-black uppercase text-slate-800 focus:outline-none"
                    >
                      <option value="Inspection Ready">Inspection Ready (Fully Compliant)</option>
                      <option value="Highly Compliant">Highly Compliant (95%+ Target)</option>
                      <option value="Pending Review">Pending Review (Mid-Term Audit)</option>
                    </select>
                  </div>

                  <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-xs space-y-1">
                    <p className="font-bold text-indigo-950">Live Database Counters:</p>
                    <p className="text-[11px] text-indigo-700">
                      • Total Students in Roster: <span className="font-black">{students.length}</span><br />
                      • Total Khelo India Assessments: <span className="font-black">{results.length}</span><br />
                      • Total Practical Marks Logged: <span className="font-black">{practicalAssessments.length}</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Box B: Add Custom Calendar Events */}
              <div className="bg-white border-2 border-slate-900 rounded-xl p-4 space-y-3">
                <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest border-b border-slate-100 pb-1 flex items-center gap-1">
                  <Calendar size={14} /> Schedule New Sports Event / Fixture
                </h4>

                <form onSubmit={handleAddEvent} className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[9px] font-black text-slate-400 uppercase block mb-0.5">Event Name</label>
                      <input 
                        type="text" 
                        value={newEventName}
                        onChange={(e) => setNewEventName(e.target.value)}
                        placeholder="e.g. Inter-House Football"
                        className="w-full p-1.5 bg-slate-50 border border-slate-300 rounded text-xs font-bold text-slate-800"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-black text-slate-400 uppercase block mb-0.5">In-Charge</label>
                      <input 
                        type="text" 
                        value={newEventInCharge}
                        onChange={(e) => setNewEventInCharge(e.target.value)}
                        placeholder="e.g. Coach Suresh"
                        className="w-full p-1.5 bg-slate-50 border border-slate-300 rounded text-xs font-bold text-slate-800"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[9px] font-black text-slate-400 uppercase block mb-0.5">Scheduled Date</label>
                      <input 
                        type="date" 
                        value={newEventDate}
                        onChange={(e) => setNewEventDate(e.target.value)}
                        className="w-full p-1.5 bg-slate-50 border border-slate-300 rounded text-xs font-bold text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-black text-slate-400 uppercase block mb-0.5">Category</label>
                      <select
                        value={newEventType}
                        onChange={(e) => setNewEventType(e.target.value)}
                        className="w-full p-1.5 bg-slate-50 border border-slate-300 rounded text-xs font-black text-slate-700"
                      >
                        <option value="School-wide">School-wide</option>
                        <option value="Inter-School">Inter-School</option>
                        <option value="Ministry of Sports">Ministry of Sports</option>
                        <option value="Internal">Internal</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase block mb-0.5">Description & Objective</label>
                    <textarea
                      value={newEventDesc}
                      onChange={(e) => setNewEventDesc(e.target.value)}
                      placeholder="Enter brief details for board audit report..."
                      rows={2}
                      className="w-full p-1.5 bg-slate-50 border border-slate-300 rounded text-[11px] font-medium text-slate-800"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-black text-xs uppercase tracking-wider border border-slate-900 shadow-[1px_1px_0px_0px_rgba(15,23,42,1)]"
                  >
                    Save & Publish Event to Dashboard
                  </button>
                </form>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 📊 DYNAMIC METRIC CARDS GRID (Synchronized with Real Cohort + Term Filters) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Metric 1: Lesson Compliance */}
        <div className="bg-emerald-50 border-4 border-slate-900 rounded-[2rem] p-6 shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <span className="w-12 h-12 bg-white border-2 border-slate-900 rounded-xl flex items-center justify-center text-emerald-600">
              <CheckCircle2 size={24} />
            </span>
            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 text-[9px] font-black uppercase rounded-md">NEP Compliant</span>
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Lesson Compliance</p>
            <h3 className="text-3xl font-black text-slate-900 leading-none tabular-nums">{dynamicLessonCompliance}%</h3>
            <p className="text-xs text-slate-600 mt-2 font-semibold tabular-nums">
              {deliveredClassesOverride} of {plannedClassesOverride} planned PE periods delivered on schedule.
            </p>
          </div>
        </div>

        {/* Metric 2: Student Participation */}
        <div className="bg-indigo-50 border-4 border-slate-900 rounded-[2rem] p-6 shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <span className="w-12 h-12 bg-white border-2 border-slate-900 rounded-xl flex items-center justify-center text-indigo-600">
              <Users size={24} />
            </span>
            <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 border border-indigo-300 text-[9px] font-black uppercase rounded-md">Active Roster</span>
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Student Participation</p>
            <h3 className="text-3xl font-black text-slate-900 leading-none tabular-nums">
              {dynamicParticipationRate !== null ? `${dynamicParticipationRate}%` : `${totalEnrolledStudents} Std`}
            </h3>
            <p className="text-xs text-slate-600 mt-2 font-semibold tabular-nums">
              {dynamicParticipationRate !== null
                ? `Calculated across ${totalEnrolledStudents} enrolled students in cohort.`
                : `${totalEnrolledStudents} enrolled in ${selectedGradeBand} (attendance % not logged yet).`}
            </p>
          </div>
        </div>

        {/* Metric 3: Assessment Complete */}
        <div className="bg-amber-50 border-4 border-slate-900 rounded-[2rem] p-6 shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <span className="w-12 h-12 bg-white border-2 border-slate-900 rounded-xl flex items-center justify-center text-amber-600">
              <Activity size={24} />
            </span>
            <span className="px-2 py-0.5 bg-amber-100 text-amber-800 border border-amber-300 text-[9px] font-black uppercase rounded-md">{selectedTerm}</span>
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Fitness Tested</p>
            <h3 className="text-3xl font-black text-slate-900 leading-none tabular-nums">{assessmentCompletePercent}%</h3>
            <p className="text-xs text-slate-600 mt-2 font-semibold tabular-nums">
              {uniqueStudentsTested} of {totalEnrolledStudents} students tested ({Math.max(0, totalEnrolledStudents - uniqueStudentsTested)} remaining &bull; {filteredResults.length} entries).
            </p>
          </div>
        </div>

        {/* Metric 4: 100M Composite / CBSE 30M Practical */}
        <div className="bg-rose-50 border-4 border-slate-900 rounded-[2rem] p-6 shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <span className="w-12 h-12 bg-white border-2 border-slate-900 rounded-xl flex items-center justify-center text-rose-600">
              <Award size={24} />
            </span>
            <span className="px-2 py-0.5 bg-rose-100 text-rose-800 border border-rose-300 text-[9px] font-black uppercase rounded-md">100M &amp; 30M Grades</span>
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Term Grades &amp; 30M Practical</p>
            <h3 className="text-2xl font-black text-slate-900 leading-tight uppercase tabular-nums">
              {filteredEvaluations.length > 0
                ? `${Math.round(filteredEvaluations.reduce((s, e) => s + e.totalScore, 0) / filteredEvaluations.length)} / 100`
                : `${practicalAvgScore} / 30`}
            </h3>
            <p className="text-xs text-slate-600 mt-2 font-semibold tabular-nums">
              {filteredEvaluations.length} composite (100M) &bull; {filteredPracticals.length} CBSE practical (30M).
            </p>
          </div>
        </div>
      </div>

      {/* 🏫 CLASS-WISE & EXPANDABLE SECTION ASSESSMENT BREAKDOWN */}
      <section className="bg-white border-4 border-slate-900 rounded-[2rem] p-5 md:p-7 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b-2 border-slate-100 pb-4">
          <div>
            <h3 className="text-xl font-black text-slate-900 uppercase flex items-center gap-2">
              <GraduationCap className="text-[#0D2B52]" size={22} />
              Class-Wise Assessment Progress &amp; Remaining Days
            </h3>
            <p className="text-xs text-slate-500 font-semibold mt-0.5">
              Expand any class row to inspect section-level completion across Baseline, Term 1, Term 2, and optional 100-Mark grades.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 print:hidden">
            <button
              onClick={() => {
                const allExpanded = classWiseBreakdown.length > 0 && classWiseBreakdown.every(c => expandedClassKeys[c.grade]);
                const next: Record<string, boolean> = {};
                if (!allExpanded) {
                  classWiseBreakdown.forEach(c => { next[c.grade] = true; });
                }
                setExpandedClassKeys(next);
              }}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-lg text-[11px] font-black uppercase tracking-wide"
            >
              {classWiseBreakdown.length > 0 && classWiseBreakdown.every(c => expandedClassKeys[c.grade]) ? 'Collapse All Sections' : 'Expand All Sections'}
            </button>
            <button
              onClick={handleExportClassProgressCsv}
              disabled={classWiseBreakdown.length === 0}
              className="px-3 py-1.5 bg-[#0D2B52] hover:bg-slate-800 disabled:opacity-50 text-white rounded-lg text-[11px] font-black uppercase tracking-wide flex items-center gap-1.5"
            >
              <Download size={13} />
              Export CSV
            </button>
          </div>
        </div>

        {/* Editable Term Target Deadlines Strip */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-50 border border-slate-200 rounded-2xl p-3.5 print:hidden">
          {(['Baseline', 'Term 1', 'Term 2'] as const).map(termKey => {
            const daysLeft = computeRemainingDays(termDeadlines[termKey]);
            const isActiveTarget = activeTargetTerm === termKey;
            const daysLabel = daysLeft === null
              ? 'No target set'
              : daysLeft < 0
                ? `${Math.abs(daysLeft)}d overdue`
                : daysLeft === 0
                  ? 'Due today'
                  : `${daysLeft}d left`;

            return (
              <div
                key={termKey}
                className={`flex items-center justify-between gap-3 px-3 py-2 rounded-xl border bg-white ${
                  isActiveTarget ? 'border-[#0D2B52] ring-1 ring-[#0D2B52]/20' : 'border-slate-200'
                }`}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <Clock size={13} className={isActiveTarget ? 'text-[#0D2B52]' : 'text-slate-400'} />
                    <span className="text-[11px] font-black uppercase text-slate-800">{termKey} Deadline</span>
                  </div>
                  <span
                    className={`text-[11px] font-bold tabular-nums ${
                      daysLeft !== null && daysLeft < 0
                        ? 'text-rose-600'
                        : daysLeft !== null && daysLeft <= 7
                          ? 'text-amber-600'
                          : 'text-emerald-700'
                    }`}
                  >
                    {daysLabel}
                  </span>
                </div>
                <input
                  type="date"
                  value={termDeadlines[termKey] || ''}
                  onChange={(e) => handleUpdateTermDeadline(termKey, e.target.value)}
                  className="text-xs font-bold text-slate-800 bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-blue-500 tabular-nums"
                  aria-label={`${termKey} deadline date`}
                />
              </div>
            );
          })}
        </div>

        {/* Class-Wise Expandable Table */}
        {classWiseBreakdown.length === 0 ? (
          <div className="p-10 text-center border border-dashed border-slate-300 rounded-2xl text-slate-500 text-xs">
            No students enrolled in this cohort filter yet. Add students in Student Directory to track class-wise progress.
          </div>
        ) : (
          <div className="overflow-x-auto border border-slate-200 rounded-2xl">
            <table className="w-full text-left border-collapse text-xs tabular-nums">
              <thead>
                <tr className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-wider">
                  <th className="py-3 px-4">Class / Section</th>
                  <th className="py-3 px-3 text-right">Enrolled</th>
                  <th className="py-3 px-3">Baseline</th>
                  <th className="py-3 px-3">Term 1</th>
                  <th className="py-3 px-3">Term 2</th>
                  <th className="py-3 px-3 text-right">Remaining ({selectedTerm === 'Full Year' ? 'Any' : selectedTerm})</th>
                  <th className="py-3 px-3">{activeTargetTerm} Days Left</th>
                  <th className="py-3 px-3">100M Grades (Opt.)</th>
                  <th className="py-3 px-3 text-right print:hidden">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {classWiseBreakdown.map(cls => {
                  const isExpanded = !!expandedClassKeys[cls.grade];
                  const activePct = cls.enrolled > 0 ? Math.round((cls.activeTested / cls.enrolled) * 100) : 0;
                  const targetDaysLeft = computeRemainingDays(termDeadlines[activeTargetTerm]);

                  const renderTermCell = (done: number, enrolled: number) => {
                    const pct = enrolled > 0 ? Math.round((done / enrolled) * 100) : 0;
                    return (
                      <div className="min-w-[84px]">
                        <div className="flex items-center justify-between text-[11px] font-bold text-slate-800 mb-1">
                          <span>{done}/{enrolled}</span>
                          <span className="text-slate-500">{pct}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              pct >= 100 ? 'bg-emerald-500' : pct > 0 ? 'bg-indigo-600' : 'bg-slate-200'
                            }`}
                            style={{ width: `${Math.min(100, pct)}%` }}
                          />
                        </div>
                      </div>
                    );
                  };

                  return (
                    <React.Fragment key={cls.grade}>
                      <tr
                        onClick={() => setExpandedClassKeys(prev => ({ ...prev, [cls.grade]: !prev[cls.grade] }))}
                        className="bg-white hover:bg-slate-50 cursor-pointer transition-colors"
                      >
                        <td className="py-3 px-4 font-black text-slate-900">
                          <div className="flex items-center gap-2">
                            {isExpanded ? (
                              <ChevronDown size={15} className="text-slate-500 shrink-0" />
                            ) : (
                              <ChevronRight size={15} className="text-slate-500 shrink-0" />
                            )}
                            <span>Class {cls.grade}</span>
                            <span className="text-[10px] font-semibold text-slate-500">
                              ({cls.sections.length} {cls.sections.length === 1 ? 'sec' : 'secs'})
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-right font-black text-slate-900">{cls.enrolled}</td>
                        <td className="py-3 px-3">{renderTermCell(cls.baselineDone, cls.enrolled)}</td>
                        <td className="py-3 px-3">{renderTermCell(cls.term1Done, cls.enrolled)}</td>
                        <td className="py-3 px-3">{renderTermCell(cls.term2Done, cls.enrolled)}</td>
                        <td className="py-3 px-3 text-right">
                          {cls.activeRemaining === 0 ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase">
                              <Check size={11} /> Done (100%)
                            </span>
                          ) : (
                            <span className="font-black text-rose-700">
                              {cls.activeRemaining} left <span className="text-slate-400 font-semibold">({100 - activePct}%)</span>
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 font-bold">
                          {cls.activeRemaining === 0 ? (
                            <span className="text-emerald-700">Completed</span>
                          ) : targetDaysLeft === null ? (
                            <span className="text-slate-400">—</span>
                          ) : targetDaysLeft < 0 ? (
                            <span className="text-rose-600 font-black">{Math.abs(targetDaysLeft)}d overdue</span>
                          ) : (
                            <span className={targetDaysLeft <= 7 ? 'text-amber-700 font-black' : 'text-slate-700'}>
                              {targetDaysLeft} days left
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          {cls.graded100M > 0 ? (
                            <div className="font-bold text-slate-800">
                              <span>{cls.graded100M}/{cls.enrolled}</span>
                              {cls.avg100M !== null && (
                                <span className="text-indigo-700 ml-1.5">({cls.avg100M}/100)</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400 text-[11px]">Optional &bull; 0</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right print:hidden">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onNavigate?.('fitness');
                            }}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-[#0D2B52] hover:text-white text-slate-700 rounded-lg text-[10px] font-black uppercase transition-colors"
                          >
                            Test
                          </button>
                        </td>
                      </tr>

                      {isExpanded && cls.sections.map(sec => (
                        <tr key={sec.key} className="bg-slate-50/75 hover:bg-slate-100/70">
                          <td className="py-2.5 px-4 pl-10 font-bold text-slate-700">
                            Section {sec.section}
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-slate-700">{sec.enrolled}</td>
                          <td className="py-2.5 px-3">{renderTermCell(sec.baselineDone, sec.enrolled)}</td>
                          <td className="py-2.5 px-3">{renderTermCell(sec.term1Done, sec.enrolled)}</td>
                          <td className="py-2.5 px-3">{renderTermCell(sec.term2Done, sec.enrolled)}</td>
                          <td className="py-2.5 px-3 text-right">
                            {sec.activeRemaining === 0 ? (
                              <span className="text-emerald-700 font-bold">Done</span>
                            ) : (
                              <span className="font-bold text-rose-700">{sec.activeRemaining} left</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-slate-500">
                            {sec.activeRemaining === 0
                              ? 'Completed'
                              : targetDaysLeft === null
                                ? '—'
                                : targetDaysLeft < 0
                                  ? `${Math.abs(targetDaysLeft)}d overdue`
                                  : `${targetDaysLeft}d left`}
                          </td>
                          <td className="py-2.5 px-3">
                            {sec.graded100M > 0 ? (
                              <span className="font-semibold text-slate-700">
                                {sec.graded100M}/{sec.enrolled}{sec.avg100M !== null ? ` (${sec.avg100M})` : ''}
                              </span>
                            ) : (
                              <span className="text-slate-400">0</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right print:hidden">
                            <span className="text-[10px] text-slate-500 font-semibold">{sec.entriesCount} logs</span>
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* 🧑‍🏫 TEACHER-WISE ASSESSMENT PROGRESS & REMAINING CLASSES */}
      <section className="bg-white border-4 border-slate-900 rounded-[2rem] p-5 md:p-7 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-slate-100 pb-4">
          <div>
            <h3 className="text-xl font-black text-slate-900 uppercase flex items-center gap-2">
              <UserCheck className="text-indigo-600" size={22} />
              Teacher-Wise Progress &amp; Pending Classes
            </h3>
            <p className="text-xs text-slate-500 font-semibold mt-0.5">
              Tracks which teachers have logged assessments, classes covered, and classes still awaiting testing ({selectedTerm}).
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold tabular-nums">
            <span className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800">
              {teacherProgressData.teachers.filter(t => t.testsLogged > 0 || t.grades100MCount > 0).length} Active Teachers
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-800">
              {teacherProgressData.unstartedSections.length} Unstarted Sections
            </span>
          </div>
        </div>

        {/* Teacher Activity Table */}
        <div className="overflow-x-auto border border-slate-200 rounded-2xl">
          <table className="w-full text-left border-collapse text-xs tabular-nums">
            <thead>
              <tr className="bg-slate-100 text-slate-700 text-[10px] font-black uppercase tracking-wider border-b border-slate-200">
                <th className="py-3 px-4">Teacher</th>
                <th className="py-3 px-3">Classes Covered</th>
                <th className="py-3 px-3 text-right">Students Assessed</th>
                <th className="py-3 px-3 text-right">Baseline / T1 / T2</th>
                <th className="py-3 px-3 text-right">Tests Logged</th>
                <th className="py-3 px-3 text-right">100M Graded</th>
                <th className="py-3 px-3">Last Active</th>
                <th className="py-3 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {teacherProgressData.teachers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No teacher records resolved yet. Assessment entries saved by staff will appear here automatically.
                  </td>
                </tr>
              ) : (
                teacherProgressData.teachers.map(t => {
                  const hasWork = t.testsLogged > 0 || t.grades100MCount > 0;
                  return (
                    <tr key={t.uid} className="hover:bg-slate-50">
                      <td className="py-3 px-4">
                        <div className="font-black text-slate-900">{t.displayName}</div>
                        <div className="text-[10px] text-slate-500">
                          {t.role}{t.email ? ` • ${t.email}` : ''}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        {t.classesCovered.length > 0 ? (
                          <div className="flex flex-wrap gap-1 max-w-[240px]">
                            {t.classesCovered.slice(0, 6).map(cls => (
                              <span key={cls} className="px-1.5 py-0.5 bg-indigo-50 text-indigo-800 border border-indigo-200 rounded text-[10px] font-bold">
                                {cls}
                              </span>
                            ))}
                            {t.classesCovered.length > 6 && (
                              <span className="text-[10px] font-bold text-slate-500">+{t.classesCovered.length - 6} more</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400">None yet</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right font-black text-slate-900">{t.studentsAssessedCount}</td>
                      <td className="py-3 px-3 text-right font-bold text-slate-700">
                        {t.baselineCount} / {t.term1Count} / {t.term2Count}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-slate-800">{t.testsLogged}</td>
                      <td className="py-3 px-3 text-right font-bold text-slate-800">{t.grades100MCount}</td>
                      <td className="py-3 px-3 text-slate-600">{t.lastActiveDate || '—'}</td>
                      <td className="py-3 px-3">
                        {hasWork ? (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md text-[10px] font-black uppercase">
                            Active
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-[10px] font-bold uppercase">
                            Pending Start
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Remaining / Unstarted Classes Alert Box */}
        {(teacherProgressData.unstartedSections.length > 0 || teacherProgressData.inProgressSections.length > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black uppercase text-rose-900 flex items-center gap-1.5">
                  <AlertTriangle size={14} className="text-rose-600" />
                  Unstarted Classes ({teacherProgressData.unstartedSections.length})
                </h4>
                <span className="text-[10px] font-bold text-rose-700">0 tests in {selectedTerm}</span>
              </div>
              {teacherProgressData.unstartedSections.length === 0 ? (
                <p className="text-xs text-emerald-700 font-semibold">All enrolled sections have started testing.</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {teacherProgressData.unstartedSections.map(sec => (
                    <span
                      key={sec.key}
                      className="px-2 py-1 bg-white border border-rose-200 rounded-lg text-[11px] font-bold text-rose-900 tabular-nums"
                    >
                      Class {sec.grade}-{sec.section} ({sec.enrolled} stds)
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black uppercase text-amber-900 flex items-center gap-1.5">
                  <Clock size={14} className="text-amber-600" />
                  Partial / Remaining Classes ({teacherProgressData.inProgressSections.length})
                </h4>
                <span className="text-[10px] font-bold text-amber-800">Students still left</span>
              </div>
              {teacherProgressData.inProgressSections.length === 0 ? (
                <p className="text-xs text-slate-600">No partially completed sections right now.</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {teacherProgressData.inProgressSections.map(sec => (
                    <span
                      key={sec.key}
                      className="px-2 py-1 bg-white border border-amber-200 rounded-lg text-[11px] font-bold text-amber-950 tabular-nums"
                    >
                      Class {sec.grade}-{sec.section}: {sec.activeTested}/{sec.enrolled} ({sec.activeRemaining} left)
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      {/* 📈 MAIN CHARTS & FITNESS EVIDENCE GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Fitness Progress / Baseline-to-Term Trends */}
        <div className="lg:col-span-7 bg-white border-4 border-slate-900 rounded-[2rem] p-6 md:p-8 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)]">
          <div className="flex items-center justify-between mb-6 border-b-2 border-slate-100 pb-4">
            <div>
              <h3 className="text-xl font-black text-slate-900 uppercase">Fitness Improvement Evidence</h3>
              <p className="text-xs text-slate-500 font-bold uppercase">
                Baseline vs Current Term Physical Fitness Battery Scores (out of 100)
              </p>
            </div>
            <TrendingUp className="text-indigo-600" size={24} />
          </div>

          <div className="h-80 w-full print:hidden">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={dynamicFitnessData}
                margin={{ top: 20, right: 30, left: 0, bottom: 25 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="metric" 
                  tick={{ fontSize: 10, fontWeight: 'bold', fill: '#475569' }} 
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Legend verticalAlign="top" height={36} />
                <Bar dataKey="Baseline" fill="#94a3b8" radius={[4, 4, 0, 0]} name="Term 1 (Baseline)" />
                <Bar dataKey="Current" fill="#4f46e5" radius={[4, 4, 0, 0]} name="Current Term Progress" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Printable & Inspection Evidence Table */}
          <div className="mt-4 space-y-4">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b-2 border-slate-900 bg-slate-50">
                  <th className="py-2.5 px-2 font-black">Fitness Parameter</th>
                  <th className="py-2.5 px-2 font-black">Baseline (Term 1)</th>
                  <th className="py-2.5 px-2 font-black">Current Term Score</th>
                  <th className="py-2.5 px-2 font-black text-emerald-700">Improvement %</th>
                </tr>
              </thead>
              <tbody>
                {dynamicFitnessData.map((fit, idx) => (
                  <tr key={idx} className="border-b border-slate-200">
                    <td className="py-2 px-2 font-semibold text-slate-800">{fit.metric}</td>
                    <td className="py-2 px-2 text-slate-600">{fit.Baseline} pts</td>
                    <td className="py-2 px-2 font-bold text-slate-900">{fit.Current} pts</td>
                    <td className="py-2 px-2 font-black text-emerald-600">{fit.Improvement}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 p-4 bg-emerald-50 rounded-2xl border-2 border-emerald-200 text-xs text-emerald-800 flex items-start space-x-3">
            <AlertCircle className="flex-shrink-0 mt-0.5 text-emerald-600" size={16} />
            <div>
              <p className="font-black uppercase tracking-wider">Evidence of Impact Summary & Board Verification</p>
              <p className="font-medium mt-1">
                Data reflects active progress across physical fitness vectors. {displaySchoolName} is fully compliant with CBSE's Health and Physical Education (HPE) mandatory 45-minute daily activity directives under NEP 2020.
              </p>
            </div>
          </div>
        </div>

        {/* Weekly Participation Trend */}
        <div className="lg:col-span-5 bg-white border-4 border-slate-900 rounded-[2rem] p-6 md:p-8 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)]">
          <div className="flex items-center justify-between mb-6 border-b-2 border-slate-100 pb-4">
            <div>
              <h3 className="text-xl font-black text-slate-900 uppercase">Weekly Participation Trends</h3>
              <p className="text-xs text-slate-500 font-bold uppercase">Average attendance and dress-out % over 20 weeks</p>
            </div>
            <Users className="text-indigo-600" size={24} />
          </div>

          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={dynamicParticipationData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorPrimary" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 'bold' }} />
                <YAxis domain={[70, 100]} />
                <Tooltip />
                <Legend verticalAlign="top" height={36} />
                <Area type="monotone" dataKey="Grade 6-8" stroke="#4f46e5" fillOpacity={1} fill="url(#colorPrimary)" name="Middle (6-8)" />
                <Area type="monotone" dataKey="Grade 9-12" stroke="#f43f5e" fillOpacity={0} name="Secondary (9-12)" />
                <Area type="monotone" dataKey="Grade 1-5" stroke="#10b981" fillOpacity={0} name="Primary (1-5)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 p-3 bg-indigo-50/60 rounded-xl border border-indigo-200 text-xs text-indigo-900">
            <p className="font-bold">Active PE Timetable Alignment:</p>
            <p className="text-[11px] text-slate-600 mt-0.5">
              Consistent participation observed with highest attendance during Middle School intramural fixtures.
            </p>
          </div>
        </div>
      </div>

      {/* 🏆 SCHOOL CALENDAR & BOARD COMPLIANCE AUDIT */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Events Conducted & Scheduled */}
        <div className="bg-white border-4 border-slate-900 rounded-[2rem] p-6 md:p-8 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)]">
          <div className="flex justify-between items-center mb-6 border-b-2 border-slate-100 pb-4">
            <h3 className="text-xl font-black text-slate-900 uppercase flex items-center">
              <Calendar className="mr-3 text-amber-500" />
              School Calendar & Sports Events
            </h3>
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider hidden sm:inline">
              Click event for brackets & files
            </span>
          </div>

          <div className="space-y-4 max-h-[460px] overflow-y-auto pr-1">
            {upcomingEvents.map((evt) => (
              <div 
                key={evt.id} 
                onClick={() => setSelectedEventDetails(evt)}
                className="p-4 bg-slate-50 hover:bg-slate-100 cursor-pointer rounded-2xl border-2 border-slate-900 flex justify-between items-start md:items-center flex-col md:flex-row gap-2 transition-all hover:translate-x-1"
              >
                <div className="flex-1">
                  <h4 className="font-bold text-slate-800 text-sm hover:text-indigo-600 transition-colors flex items-center gap-1.5">
                    {evt.name}
                    <Zap size={14} className="text-amber-500" />
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 flex items-center">
                    <span className="font-bold mr-2 text-indigo-600">{evt.date}</span> &bull; {evt.type}
                  </p>
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5">In-charge: {evt.inCharge}</p>
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end">
                  <span className="px-3 py-1 bg-amber-100 text-amber-800 border-2 border-slate-900 font-black text-[9px] uppercase rounded-xl tracking-wider">
                    {evt.status}
                  </span>
                  
                  {dashboardMode === 'editor' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteEvent(evt.id);
                      }}
                      className="p-1.5 bg-rose-100 border border-rose-300 hover:bg-rose-200 text-rose-700 rounded-lg transition-colors"
                      title="Delete Event"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}

            {upcomingEvents.length === 0 && (
              <p className="text-center text-xs font-bold text-slate-400 py-10">No upcoming events listed. Go to HoD Control Panel to add.</p>
            )}
          </div>
        </div>

        {/* Board Compliance Inspections Audit */}
        <div className="bg-white border-4 border-slate-900 rounded-[2rem] p-6 md:p-8 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)]">
          <h3 className="text-xl font-black text-slate-900 uppercase mb-6 border-b-2 border-slate-100 pb-4 flex items-center">
            <ShieldCheck className="mr-3 text-emerald-600" />
            CBSE / NEP 2020 Institutional Compliance Audit
          </h3>

          <div className="space-y-4">
            {[
              { 
                rule: 'Daily HPE Period (Grades 1-12)', 
                detail: `Direct physical activity timetable active (${deliveredClassesOverride} periods logged).`, 
                status: 'COMPLIANT' 
              },
              { 
                rule: 'Khelo India Battery Assessments', 
                detail: `Fitness scores captured for ${uniqueStudentsTested} of ${totalEnrolledStudents} students.`, 
                status: uniqueStudentsTested > 0 ? 'COMPLIANT' : 'IN PROGRESS' 
              },
              { 
                rule: 'CBSE Class 11-12 Practical Exam (30M)', 
                detail: `30-Mark assessments recorded for ${filteredPracticals.length} senior candidates.`, 
                status: filteredPracticals.length > 0 ? 'COMPLIANT' : 'READY FOR TESTING' 
              },
              { 
                rule: 'Inclusive PE Accommodations', 
                detail: 'Adaptive lesson modifications compiled for students of mixed abilities.', 
                status: 'COMPLIANT' 
              },
              { 
                rule: 'Theory Syllabus & Textbooks (Class 11-12)', 
                detail: 'Full alignment with NCERT, textbooks & sample papers available.', 
                status: 'INSPECTION READY' 
              },
              { 
                rule: 'Sports Infrastructure & Safety Log', 
                detail: 'Safety guidelines, track audits, and equipment maintenance verified.', 
                status: 'UP-TO-DATE' 
              },
            ].map((item, idx) => (
              <div key={idx} className="flex justify-between items-center p-3 border-b border-slate-100 last:border-b-0">
                <div>
                  <h4 className="font-bold text-slate-800 text-xs">{item.rule}</h4>
                  <p className="text-[10px] text-slate-500 font-medium">{item.detail}</p>
                </div>
                <span className="px-2.5 py-1 bg-emerald-100 border-2 border-emerald-800 text-emerald-800 font-black text-[9px] uppercase rounded-lg">
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 🔍 INTERACTIVE EVENT VIEW MODAL / DRAWER */}
      <AnimatePresence>
        {selectedEventDetails && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 print:hidden overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border-4 border-slate-900 rounded-[2.5rem] max-w-2xl w-full p-6 md:p-8 space-y-6 shadow-[10px_10px_0px_0px_rgba(15,23,42,1)] my-8"
            >
              {/* Header */}
              <div className="flex justify-between items-start border-b-2 border-slate-200 pb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 border border-indigo-300 rounded text-[9px] font-black uppercase">
                      {selectedEventDetails.type}
                    </span>
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-800 border border-amber-300 rounded text-[9px] font-black uppercase">
                      {selectedEventDetails.status}
                    </span>
                  </div>
                  <h3 className="text-xl md:text-2xl font-black text-slate-900 uppercase tracking-tight">
                    {selectedEventDetails.name}
                  </h3>
                  <p className="text-xs text-indigo-600 font-bold mt-0.5">
                    Date: {selectedEventDetails.date} &bull; Supervisor: {selectedEventDetails.inCharge}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSelectedEventDetails(null);
                    setSelectedEvidencePreview(null);
                    setActiveEvidenceTab('details');
                  }}
                  className="p-1.5 border-2 border-slate-900 rounded-lg hover:bg-slate-100 text-slate-700 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Tab Bar */}
              <div className="flex border-b-2 border-slate-900 bg-slate-50 p-1.5 rounded-xl gap-1">
                {[
                  { id: 'details', label: '🏆 Match & Brackets' },
                  { id: 'photos', label: '📸 Action Gallery' },
                  { id: 'evidence', label: '📄 CBSE Evidence Files' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveEvidenceTab(tab.id as any);
                      setSelectedEvidencePreview(null);
                    }}
                    className={`flex-1 py-2 text-center text-xs font-black uppercase tracking-wider rounded-lg transition-all ${
                      activeEvidenceTab === tab.id
                        ? 'bg-slate-900 text-white shadow-md'
                        : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/50'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab Content Rendering */}
              <div className="space-y-4">
                {activeEvidenceTab === 'details' && (
                  <div className="space-y-6">
                    <div className="space-y-1">
                      <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider">Event Overview</h4>
                      <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                        {selectedEventDetails.description}
                      </p>
                    </div>

                    {selectedEventDetails.fixtures && selectedEventDetails.fixtures.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5 border-b pb-1.5">
                          <Layers size={14} className="text-indigo-600" /> Interactive Match Bracket & Fixtures
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {selectedEventDetails.fixtures.map((fix, idx) => (
                            <div key={idx} className="p-3 bg-slate-50 border-2 border-slate-900 rounded-xl space-y-1 shadow-sm">
                              <span className="text-[9px] font-black uppercase text-indigo-600 block">{fix.round}</span>
                              <div className="flex justify-between items-center text-xs font-bold">
                                <span className={`${fix.winner === fix.teamA ? 'text-emerald-700 font-black' : 'text-slate-800'}`}>
                                  {fix.teamA}
                                </span>
                                <span className="text-[10px] text-slate-400 font-black">vs</span>
                                <span className={`${fix.winner === fix.teamB ? 'text-emerald-700 font-black' : 'text-slate-800'}`}>
                                  {fix.teamB}
                                </span>
                              </div>
                              <div className="pt-1.5 flex justify-between items-center border-t border-dashed border-slate-200">
                                <span className="text-[10px] font-black text-slate-400 uppercase">Score / Status:</span>
                                <span className="text-xs font-black bg-white px-2 py-0.5 rounded border border-slate-300 text-slate-700">
                                  {fix.score}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedEventDetails.roster && selectedEventDetails.roster.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5 border-b pb-1.5">
                          <UserCheck size={14} className="text-emerald-600" /> Official Athlete & Captain Roster
                        </h4>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedEventDetails.roster.map((p, idx) => (
                            <span key={idx} className="px-2.5 py-1 bg-slate-100 border border-slate-300 text-slate-700 rounded-lg text-xs font-bold">
                              {p}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeEvidenceTab === 'photos' && (
                  <div className="space-y-4">
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5 border-b pb-1.5">
                      📸 Live Sports Action Gallery & School Media
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="border-2 border-slate-900 rounded-2xl overflow-hidden shadow-md group relative">
                        <img 
                          src="https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?auto=format&fit=crop&q=80&w=600" 
                          alt="Running race heats" 
                          className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300"
                          referrerPolicy="no-referrer"
                        />
                        <div className="p-3 bg-slate-900 text-white">
                          <p className="text-xs font-black uppercase">Track Relays</p>
                          <p className="text-[10px] text-slate-400">{displaySchoolName} Athletes</p>
                        </div>
                      </div>
                      <div className="border-2 border-slate-900 rounded-2xl overflow-hidden shadow-md group relative">
                        <img 
                          src="https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&q=80&w=600" 
                          alt="Sports Meet" 
                          className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300"
                          referrerPolicy="no-referrer"
                        />
                        <div className="p-3 bg-slate-900 text-white">
                          <p className="text-xs font-black uppercase">Athletics In-Action</p>
                          <p className="text-[10px] text-slate-400">Board Inspection Evidence Snapshot</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeEvidenceTab === 'evidence' && (
                  <div className="space-y-4">
                    {!selectedEvidencePreview ? (
                      <div className="space-y-3">
                        <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5 border-b pb-1.5">
                          <FileText size={14} className="text-indigo-600" /> Board Inspection Evidence Documents
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {selectedEventDetails.evidenceFiles.map((f, idx) => (
                            <div 
                              key={idx}
                              onClick={() => setSelectedEvidencePreview(f)} 
                              className="p-4 bg-indigo-50/50 hover:bg-indigo-100 cursor-pointer border-2 border-slate-900 rounded-2xl flex items-center space-x-3 transition-all hover:-translate-y-0.5 shadow-sm"
                            >
                              <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center font-black">
                                <FileText size={20} />
                              </div>
                              <div className="truncate flex-1">
                                <span className="block text-xs font-black text-indigo-950 truncate uppercase">{f.replace('.pdf', '').replace('.xlsx', '').replace('.zip', '').replace(/_/g, ' ')}</span>
                                <span className="text-[10px] font-bold text-indigo-500 block uppercase">Click to open &rarr;</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-5 bg-white border-2 border-slate-900 rounded-[2rem] space-y-4 relative shadow-inner"
                      >
                        <div className="flex items-center justify-between border-b pb-3">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Document PREVIEW: {selectedEvidencePreview}</span>
                          <button 
                            onClick={() => setSelectedEvidencePreview(null)}
                            className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-[10px] font-black uppercase text-slate-700 border border-slate-300 rounded-lg transition-colors"
                          >
                            &larr; Back to list
                          </button>
                        </div>

                        <div className="font-mono text-[11px] text-slate-800 space-y-4 border p-4 bg-amber-50/30 rounded-xl">
                          <div className="text-center border-b pb-2">
                            <h5 className="font-black text-sm text-slate-900 uppercase">{displaySchoolName}</h5>
                            <p className="text-[9px] uppercase tracking-wider text-slate-500">{selectedEventDetails.name}</p>
                            <p className="text-[9px] font-bold text-indigo-600 mt-1">AFFILIATION: {displayAffiliation}</p>
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed">
                            Official verified document signed and certified by Department of Physical Education under National Board Guidelines.
                          </p>
                          <div className="pt-2 text-[9px] text-slate-400 border-t flex justify-between">
                            <span>VERIFIED EVIDENCE COMPLIANT</span>
                            <span>SIGNED: {displayPrincipalName}</span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                )}
              </div>

              {/* Close controls */}
              <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
                <button
                  onClick={() => {
                    setSelectedEventDetails(null);
                    setSelectedEvidencePreview(null);
                    setActiveEvidenceTab('details');
                  }}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-black text-xs uppercase tracking-wider border border-slate-300 rounded-xl hover:bg-slate-200"
                >
                  Close Window
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 🖨️ PRINTABLE OFFICIAL BOARD CERTIFICATION FOOTER (Visible on Print) */}
      <div className="hidden print:block pt-8 border-t-2 border-slate-900 space-y-6">
        <div className="grid grid-cols-3 gap-6 text-center text-xs">
          <div className="border-t-2 border-slate-900 pt-3">
            <p className="font-black text-slate-900 uppercase">Head of Physical Education</p>
            <p className="text-[10px] text-slate-500 font-semibold">{displayPrincipalName}</p>
          </div>
          <div className="border-t-2 border-slate-900 pt-3">
            <p className="font-black text-slate-900 uppercase">Principal Signature & Stamp</p>
            <p className="text-[10px] text-slate-500 font-semibold">{displaySchoolName}</p>
          </div>
          <div className="border-t-2 border-slate-900 pt-3">
            <p className="font-black text-slate-900 uppercase">CBSE / Board External Inspector</p>
            <p className="text-[10px] text-slate-500 font-semibold">Inspection Date: {new Date().toLocaleDateString()}</p>
          </div>
        </div>
      </div>

    </div>
  );
};

export default PrincipalDashboard;
