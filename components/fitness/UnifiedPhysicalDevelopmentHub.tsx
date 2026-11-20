import React, { useState, useEffect, useMemo } from 'react';
import {
  Activity,
  Users,
  Search,
  Filter,
  Check,
  CheckCheck,
  Save,
  TrendingUp,
  Sparkles,
  ChevronRight,
  User,
  Heart,
  Trophy,
  Target,
  FileText,
  Printer,
  Download,
  AlertCircle,
  Plus,
  Trash2,
  Calendar,
  Layers,
  ArrowRight,
  Loader2,
  SlidersHorizontal,
  Info,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Zap,
  Move
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  fitnessService,
  FitnessResult,
  Student,
  Team,
  SchoolMember
} from '../../services/fitnessService.ts';
import {
  DevelopmentDomainId,
  DevelopmentLevel,
  TestDefinition,
  PhysicalDevelopmentProfile,
  InterventionRecord,
  CompositeTermEvaluation
} from '../../types.ts';
import {
  MASTER_TEST_DEFINITIONS,
  DOMAIN_METADATA,
  STANDARD_RUBRIC_LEVELS,
  getTestDefinition,
  calculateTestScoreAndLevel,
  calculateResultGrowth,
  aggregatePhysicalDevelopmentProfile,
  physicalDevelopmentStorage
} from '../../services/physicalDevelopmentEngine.ts';
import {
  compositeEvaluationService,
  computeFitnessContribution
} from '../../services/compositeEvaluationService.ts';
import FitnessTests from '../FitnessTests.tsx';
import { TermCompositeGradingView } from './TermCompositeGradingView.tsx';
import { ParentPhysicalDevelopmentReportModal } from './ParentPhysicalDevelopmentReportModal.tsx';
import { toast } from '../../services/toast.ts';
import { auth } from '../../services/firebase.ts';

export type UnifiedHubMode = 'fitness_tests' | 'term_grading' | 'student_profile' | 'fast_entry' | 'interventions';

interface UnifiedPhysicalDevelopmentHubProps {
  onNavigate?: (tab: any) => void;
  initialStudentId?: string;
  initialMode?: UnifiedHubMode;
}

export const UnifiedPhysicalDevelopmentHub: React.FC<UnifiedPhysicalDevelopmentHubProps> = ({
  onNavigate,
  initialStudentId,
  initialMode = 'fitness_tests'
}) => {
  // Navigation / Mode state
  const [hubMode, setHubMode] = useState<UnifiedHubMode>(initialMode);

  useEffect(() => {
    setHubMode(initialMode);
  }, [initialMode]);

  // Loaded data (seeded synchronously from localStorage cache where available for zero-delay mount)
  const [students, setStudents] = useState<Student[]>(() => {
    try {
      const raw = localStorage.getItem('smartpe_offline_students');
      return raw ? (JSON.parse(raw) as Student[]) : [];
    } catch {
      return [];
    }
  });
  const [allResults, setAllResults] = useState<FitnessResult[]>([]);
  const [evaluations, setEvaluations] = useState<CompositeTermEvaluation[]>([]);
  const [interventions, setInterventions] = useState<InterventionRecord[]>(() => {
    try {
      const raw = localStorage.getItem('smartpe_interventions_data');
      return raw ? (JSON.parse(raw) as InterventionRecord[]) : [];
    } catch {
      return [];
    }
  });
  const [isSyncing, setIsSyncing] = useState(false);
  const [userProfile, setUserProfile] = useState<SchoolMember | null>(() => {
    return auth.currentUser ? fitnessService.getCachedSchoolMember(auth.currentUser.uid) : null;
  });

  // Workflow Selection State: Class -> Section -> Term -> Domain -> Test
  const [selectedGrade, setSelectedGrade] = useState<string>('ALL');
  const [selectedSection, setSelectedSection] = useState<string>('ALL');
  const [selectedTerm, setSelectedTerm] = useState<string>('Baseline');
  const [selectedDomain, setSelectedDomain] = useState<DevelopmentDomainId>('fitness');
  const [selectedTestId, setSelectedTestId] = useState<string>('sprint_20m');

  // Batch Entry Values: { [studentId]: rawValue }
  const [batchRawValues, setBatchRawValues] = useState<{ [studentId: string]: string }>({});
  const [isSavingBatch, setIsSavingBatch] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Profile View State
  const [selectedProfileStudentId, setSelectedProfileStudentId] = useState<string>(initialStudentId || '');
  const [profileSearchQuery, setProfileSearchQuery] = useState('');
  const [showParentReportModal, setShowParentReportModal] = useState(false);
  const [reportCompositeEval, setReportCompositeEval] = useState<CompositeTermEvaluation | null>(null);

  // Intervention Modal / Form State
  const [editingIntervention, setEditingIntervention] = useState<Partial<InterventionRecord> | null>(null);
  const [showInterventionModal, setShowInterventionModal] = useState(false);

  // 1. Parallel, Non-Blocking Data Fetch & Multiplexed Firestore Subscriptions
  useEffect(() => {
    let active = true;
    let unsubStudents: (() => void) | undefined;
    let unsubResults: (() => void) | undefined;
    let unsubEvaluations: (() => void) | undefined;

    const uid = auth.currentUser?.uid;
    if (!uid) {
      setIsSyncing(false);
      return;
    }

    const startSubscriptions = (member: SchoolMember | null) => {
      if (!active) return;
      const schoolId = member?.schoolId;
      const isAdmin = member?.role === 'admin';

      // Fetch interventions in background without blocking students/results render
      physicalDevelopmentStorage
        .getInterventions(undefined, schoolId)
        .then((loadedInterventions) => {
          if (active) setInterventions(loadedInterventions);
        })
        .catch(() => {});

      unsubStudents = fitnessService.subscribeToStudents(
        uid,
        schoolId,
        isAdmin,
        (studentList) => {
          if (!active) return;
          setStudents(studentList);
          setSelectedProfileStudentId((prev) => prev || initialStudentId || studentList[0]?.id || '');
        }
      );

      unsubResults = fitnessService.subscribeToResults(
        uid,
        schoolId,
        isAdmin,
        (resultsList) => {
          if (!active) return;
          setAllResults(resultsList);
          setIsSyncing(false);
        }
      );

      unsubEvaluations = compositeEvaluationService.subscribeToEvaluations(
        uid,
        schoolId,
        isAdmin,
        (evalList) => {
          if (!active) return;
          setEvaluations(evalList);
        }
      );
    };

    const cachedMember = fitnessService.getCachedSchoolMember(uid);
    if (cachedMember) {
      setUserProfile(cachedMember);
      startSubscriptions(cachedMember);
    } else {
      setIsSyncing(true);
      fitnessService
        .getSchoolMember(uid)
        .then((member) => {
          if (!active) return;
          setUserProfile(member);
          startSubscriptions(member);
        })
        .catch(() => {
          if (active) setIsSyncing(false);
        });
    }

    // Safety fallback so subtle syncing badge never spins forever offline
    const syncTimer = window.setTimeout(() => {
      if (active) setIsSyncing(false);
    }, 3500);

    return () => {
      active = false;
      window.clearTimeout(syncTimer);
      unsubStudents?.();
      unsubResults?.();
      unsubEvaluations?.();
    };
  }, [auth.currentUser?.uid]);

  // Extract available unique grades & sections
  const availableGrades = useMemo(() => {
    const gradesSet = new Set<string>();
    students.forEach(s => {
      if (s.grade) gradesSet.add(s.grade.toString().trim());
    });
    return Array.from(gradesSet).sort((a, b) => {
      const numA = parseInt(a.replace(/\D/g, ''), 10);
      const numB = parseInt(b.replace(/\D/g, ''), 10);
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
      return a.localeCompare(b);
    });
  }, [students]);

  const availableSections = useMemo(() => {
    const sectionsSet = new Set<string>();
    students.forEach(s => {
      if (selectedGrade === 'ALL' || fitnessService.isGradeMatching(s.grade, selectedGrade)) {
        if (s.section) sectionsSet.add(s.section.toString().trim().toUpperCase());
      }
    });
    return Array.from(sectionsSet).sort();
  }, [students, selectedGrade]);

  // Filtered Students for Fast Entry Grid
  const filteredEntryStudents = useMemo(() => {
    return students.filter(s => {
      if (selectedGrade !== 'ALL' && !fitnessService.isGradeMatching(s.grade, selectedGrade)) return false;
      if (selectedSection !== 'ALL' && s.section?.toUpperCase() !== selectedSection.toUpperCase()) return false;
      return true;
    });
  }, [students, selectedGrade, selectedSection]);

  // Available tests for chosen domain & grade
  const availableTestsForDomain = useMemo(() => {
    return MASTER_TEST_DEFINITIONS.filter(t => t.domain === selectedDomain);
  }, [selectedDomain]);

  const currentTestDef = useMemo(() => {
    return getTestDefinition(selectedTestId);
  }, [selectedTestId]);

  // Sync batch raw values when test/term/class changes
  useEffect(() => {
    const initialBatch: { [studentId: string]: string } = {};
    filteredEntryStudents.forEach(s => {
      // Look up existing result for this student, testId, and term
      const existing = allResults.find(
        r => r.studentId === s.id && r.testId === selectedTestId && (r.term === selectedTerm || (!r.term && selectedTerm === 'Baseline'))
      );
      if (existing && existing.value !== undefined) {
        initialBatch[s.id] = existing.value;
      }
    });
    setBatchRawValues(initialBatch);
  }, [selectedTestId, selectedTerm, selectedGrade, selectedSection, filteredEntryStudents.length, allResults.length]);

  // Active Student Profile Object
  const activeStudent = useMemo(() => {
    return students.find(s => s.id === selectedProfileStudentId) || students[0];
  }, [students, selectedProfileStudentId]);

  const activeStudentProfile = useMemo<PhysicalDevelopmentProfile | null>(() => {
    if (!activeStudent) return null;
    const studentResults = allResults.filter(r => r.studentId === activeStudent.id);
    return aggregatePhysicalDevelopmentProfile(activeStudent, studentResults, interventions);
  }, [activeStudent, allResults, interventions]);

  const activeStudentEvaluation = useMemo(() => {
    if (!activeStudent) return null;
    const saved = evaluations
      .filter(e => e.studentId === activeStudent.id)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0];
    return saved || null;
  }, [activeStudent, evaluations]);

  // Handle Quick Batch Save
  const handleSaveBatchResults = async () => {
    setIsSavingBatch(true);
    setSaveSuccessMsg(null);
    try {
      const today = new Date().toISOString().split('T')[0];
      const schoolId = userProfile?.schoolId || `school_${auth.currentUser?.uid}`;
      const teacherId = auth.currentUser?.uid || 'teacher';

      const savePromises = Object.entries(batchRawValues).map(async ([studentId, val]) => {
        if (!val || val.trim() === '') return;

        const student = students.find(s => s.id === studentId);
        const { scorePercent, level, rating } = calculateTestScoreAndLevel(
          currentTestDef,
          val,
          student?.age || 12,
          student?.gender || 'Male'
        );

        const resultDoc: FitnessResult = {
          id: `${studentId}_${selectedTestId}_${selectedTerm.replace(/\s+/g, '_')}`,
          studentId,
          teacherId,
          schoolId,
          testId: selectedTestId,
          testName: currentTestDef.name,
          value: val.trim(),
          unit: currentTestDef.unit,
          date: today,
          term: selectedTerm,
          rating: level,
          percentile: scorePercent
        };

        await fitnessService.saveResult(resultDoc);
      });

      await Promise.all(savePromises);
      toast.success(`Saved results for ${Object.keys(batchRawValues).filter(k => batchRawValues[k]).length} students!`);
      setSaveSuccessMsg(`Calculated and saved assessment results successfully.`);
      setTimeout(() => setSaveSuccessMsg(null), 4000);
    } catch (err) {
      console.error("Batch save error:", err);
      toast.error("Failed to save results. Check connection.");
    } finally {
      setIsSavingBatch(false);
    }
  };

  // Accept Development Focus as Active Intervention
  const handleAcceptFocus = async () => {
    if (!activeStudentProfile || !activeStudentProfile.developmentFocus) return;
    const focus = activeStudentProfile.developmentFocus;
    const newIntervention: InterventionRecord = {
      id: `int_${activeStudentProfile.studentId}_${Date.now()}`,
      studentId: activeStudentProfile.studentId,
      studentName: activeStudentProfile.studentName,
      schoolId: activeStudentProfile.schoolId,
      teacherId: auth.currentUser?.uid || 'teacher',
      area: `${focus.domainName} (${focus.component})`,
      goal: focus.suggestedGoal,
      strategy: focus.suggestedStrategy,
      frequency: focus.suggestedFrequency,
      duration: focus.suggestedDuration,
      responsibleTeacher: userProfile?.displayName || 'PE Teacher',
      startDate: new Date().toISOString().split('T')[0],
      reviewDate: new Date(Date.now() + 28 * 86400000).toISOString().split('T')[0],
      status: 'Active',
      updatedAt: new Date().toISOString()
    };

    await physicalDevelopmentStorage.saveIntervention(newIntervention);
    setInterventions(prev => [newIntervention, ...prev.filter(i => i.id !== newIntervention.id)]);
    toast.success(`Active intervention created for ${activeStudentProfile.studentName}!`);
  };

  // Save / Edit Intervention
  const handleSaveInterventionForm = async () => {
    if (!editingIntervention || !editingIntervention.studentId || !editingIntervention.goal) {
      toast.error("Please enter a valid goal.");
      return;
    }

    const fullRecord: InterventionRecord = {
      id: editingIntervention.id || `int_${editingIntervention.studentId}_${Date.now()}`,
      studentId: editingIntervention.studentId,
      studentName: editingIntervention.studentName || activeStudent?.name || 'Student',
      schoolId: userProfile?.schoolId || 'school',
      teacherId: auth.currentUser?.uid || 'teacher',
      area: editingIntervention.area || 'Movement Coordination',
      goal: editingIntervention.goal,
      strategy: editingIntervention.strategy || 'Small-group progressive drills',
      frequency: editingIntervention.frequency || '2 times per week',
      duration: editingIntervention.duration || '4 weeks',
      responsibleTeacher: editingIntervention.responsibleTeacher || userProfile?.displayName || 'PE Teacher',
      startDate: editingIntervention.startDate || new Date().toISOString().split('T')[0],
      reviewDate: editingIntervention.reviewDate || new Date(Date.now() + 28 * 86400000).toISOString().split('T')[0],
      status: editingIntervention.status || 'Active',
      reassessmentOutcome: editingIntervention.reassessmentOutcome,
      reassessmentNotes: editingIntervention.reassessmentNotes,
      updatedAt: new Date().toISOString()
    };

    await physicalDevelopmentStorage.saveIntervention(fullRecord);
    setInterventions(prev => [fullRecord, ...prev.filter(i => i.id !== fullRecord.id)]);
    setShowInterventionModal(false);
    setEditingIntervention(null);
    toast.success("Intervention record updated!");
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-2 sm:px-4 py-4">
      
      {/* Top Banner & Unified Option-1 Mode Navigation */}
      <div className="bg-gradient-to-r from-[#0D2B52] via-[#153e75] to-[#0a203d] rounded-2xl p-5 sm:p-6 text-white shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="px-2.5 py-0.5 bg-[#D4A017] text-slate-950 text-[10px] font-black uppercase tracking-wider rounded-full">
                Unified PE Hub &bull; Zero Data Loss
              </span>
              <span className="text-xs text-slate-300 font-medium">
                Fitness Tests &amp; BMI &bull; 100-Mark Term Grading &bull; Report Cards
              </span>
              {isSyncing && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-white/10 text-slate-200 rounded-full text-[10px] font-bold">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Syncing latest records...
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-black font-display tracking-tight text-white uppercase">
              PE Fitness &amp; Development
            </h1>
            <p className="text-xs sm:text-sm text-slate-200 max-w-2xl mt-1 leading-relaxed">
              Record playground fitness tests &amp; BMI once. SmartPE automatically converts your saved fitness scores into 30 marks, combines Discipline (20) &amp; Games Skills (50), and builds complete 100-mark CBSE Report Cards.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 bg-white/10 p-1.5 rounded-xl backdrop-blur-xs border border-white/15">
          <button
            onClick={() => setHubMode('fitness_tests')}
            className={`px-3.5 py-2 rounded-lg text-xs font-black tracking-wide transition-all flex items-center gap-1.5 ${
              hubMode === 'fitness_tests'
                ? 'bg-white text-[#0D2B52] shadow-md'
                : 'text-white hover:bg-white/10'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-amber-500" />
            1. Fitness Tests &amp; BMI
          </button>
          <button
            onClick={() => setHubMode('term_grading')}
            className={`px-3.5 py-2 rounded-lg text-xs font-black tracking-wide transition-all flex items-center gap-1.5 ${
              hubMode === 'term_grading'
                ? 'bg-white text-[#0D2B52] shadow-md'
                : 'text-white hover:bg-white/10'
            }`}
          >
            <Trophy className="w-3.5 h-3.5 text-emerald-500" />
            2. Term Grading (100M)
          </button>
          <button
            onClick={() => setHubMode('student_profile')}
            className={`px-3.5 py-2 rounded-lg text-xs font-black tracking-wide transition-all flex items-center gap-1.5 ${
              hubMode === 'student_profile'
                ? 'bg-white text-[#0D2B52] shadow-md'
                : 'text-white hover:bg-white/10'
            }`}
          >
            <User className="w-3.5 h-3.5 text-blue-500" />
            3. Profile &amp; Report Card ({students.length})
          </button>
          <button
            onClick={() => setHubMode('fast_entry')}
            className={`px-3.5 py-2 rounded-lg text-xs font-black tracking-wide transition-all flex items-center gap-1.5 ${
              hubMode === 'fast_entry'
                ? 'bg-white text-[#0D2B52] shadow-md'
                : 'text-white hover:bg-white/10'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-500" />
            4. 6-Domain Grid
          </button>
          <button
            onClick={() => setHubMode('interventions')}
            className={`px-3.5 py-2 rounded-lg text-xs font-black tracking-wide transition-all flex items-center gap-1.5 ${
              hubMode === 'interventions'
                ? 'bg-white text-[#0D2B52] shadow-md'
                : 'text-white hover:bg-white/10'
            }`}
          >
            <Target className="w-3.5 h-3.5 text-purple-400" />
            5. Interventions ({interventions.length})
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* STEP 1: FITNESS TESTS & BMI (EMBEDDED EXISTING MODULE, ZERO DATA LOSS)    */}
      {/* ========================================================================= */}
      {hubMode === 'fitness_tests' && (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-xs text-blue-950">
              <strong className="font-black uppercase tracking-wide block sm:inline mr-2">
                Connected Workflow:
              </strong>
              Any Baseline, Term 1, or Term 2 fitness tests &amp; BMI saved below automatically flow into{' '}
              <strong>Step 2: Term Grading (30 + 20 + 50 = 100)</strong>.
            </div>
            <button
              onClick={() => setHubMode('term_grading')}
              className="px-4 py-2 bg-[#0D2B52] hover:bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-wide flex items-center gap-1.5 shrink-0 shadow-sm transition-all"
            >
              Go to Step 2: Term Grading (100M)
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <FitnessTests
            sharedStudents={students}
            sharedResults={allResults}
            sharedUserProfile={userProfile}
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 2: 100-MARK TERM GRADING (30 FITNESS + 20 DISCIPLINE + 50 GAMES)     */}
      {/* ========================================================================= */}
      {hubMode === 'term_grading' && (
        <TermCompositeGradingView
          students={students}
          allResults={allResults}
          evaluations={evaluations}
          userProfile={userProfile}
          onSavedEvaluation={(saved) => {
            setEvaluations(prev => [saved, ...prev.filter(e => e.id !== saved.id)]);
          }}
          onOpenReportCard={(studentId, evalDoc) => {
            setSelectedProfileStudentId(studentId);
            setReportCompositeEval(evalDoc);
            setShowParentReportModal(true);
          }}
          onGoToFitnessTests={() => setHubMode('fitness_tests')}
        />
      )}

      {/* ========================================================================= */}
      {/* MODE 1: RAPID ASSESSMENT ENTRY (CLASS -> SECTION -> CYCLE -> DOMAIN -> TEST) */}
      {/* ========================================================================= */}
      {hubMode === 'fast_entry' && (
        <div className="space-y-5">
          
          {/* Workflow Selector Bar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-[#0D2B52] flex items-center gap-2">
                <span className="w-5 h-5 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-[11px] font-black">1</span>
                Select Assessment Scope
              </h3>
              <span className="text-xs text-slate-500 font-semibold">
                {filteredEntryStudents.length} Students in Scope
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 text-xs">
              
              {/* 1. Class */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Class / Grade</label>
                <select
                  value={selectedGrade}
                  onChange={(e) => {
                    setSelectedGrade(e.target.value);
                    setSelectedSection('ALL');
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="ALL">All Grades ({students.length})</option>
                  {availableGrades.map(g => (
                    <option key={g} value={g}>Grade {g}</option>
                  ))}
                </select>
              </div>

              {/* 2. Section */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Section</label>
                <select
                  value={selectedSection}
                  onChange={(e) => setSelectedSection(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="ALL">All Sections</option>
                  {availableSections.map(s => (
                    <option key={s} value={s}>Section {s}</option>
                  ))}
                </select>
              </div>

              {/* 3. Assessment Cycle / Term */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Assessment Cycle</label>
                <select
                  value={selectedTerm}
                  onChange={(e) => setSelectedTerm(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="Baseline">Baseline (Diagnostic)</option>
                  <option value="Term 1">Term 1 (Mid-Term)</option>
                  <option value="Term 2">Term 2</option>
                  <option value="Term 3">Term 3</option>
                  <option value="Annual">Annual Summative</option>
                </select>
              </div>

              {/* 4. Domain */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Development Domain</label>
                <select
                  value={selectedDomain}
                  onChange={(e) => {
                    const newDomain = e.target.value as DevelopmentDomainId;
                    setSelectedDomain(newDomain);
                    const firstTest = MASTER_TEST_DEFINITIONS.find(t => t.domain === newDomain);
                    if (firstTest) setSelectedTestId(firstTest.id);
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  {(Object.keys(DOMAIN_METADATA) as DevelopmentDomainId[]).map(dId => (
                    <option key={dId} value={dId}>{DOMAIN_METADATA[dId].name}</option>
                  ))}
                </select>
              </div>

              {/* 5. Specific Test */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Test Item</label>
                <select
                  value={selectedTestId}
                  onChange={(e) => setSelectedTestId(e.target.value)}
                  className="w-full bg-blue-50 border border-blue-300 rounded-xl px-3 py-2 font-bold text-blue-950 focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  {availableTestsForDomain.map(t => (
                    <option key={t.id} value={t.id}>{t.name} ({t.unit})</option>
                  ))}
                </select>
              </div>

            </div>

            {/* Test Info Pill */}
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-blue-100 text-blue-700 rounded-lg">
                  <Activity className="w-4 h-4" />
                </span>
                <div>
                  <span className="font-black text-slate-900">{currentTestDef.name}:</span>{' '}
                  <span className="text-slate-600">{currentTestDef.description}</span>
                </div>
              </div>
              <div className="text-[11px] text-slate-500 font-semibold shrink-0">
                Direction:{' '}
                <strong className="text-slate-800 uppercase">
                  {currentTestDef.direction.replace(/_/g, ' ')}
                </strong>{' '}
                &bull; Unit: <strong className="text-slate-800">{currentTestDef.unit}</strong>
              </div>
            </div>
          </div>

          {/* Rapid Student Entry Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            
            <div className="p-4 sm:p-5 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-black uppercase text-[#0D2B52]">
                  Assessment Entry Grid &bull; {currentTestDef.name}
                </h3>
                <p className="text-xs text-slate-500">
                  Enter raw values below. SmartPE calculates performance level and growth deltas in real-time.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleSaveBatchResults}
                  disabled={isSavingBatch || filteredEntryStudents.length === 0}
                  className="px-5 py-2.5 bg-[#0D2B52] hover:bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all shadow-md"
                >
                  {isSavingBatch ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 text-[#D4A017]" />}
                  Save All Class Results
                </button>
              </div>
            </div>

            {saveSuccessMsg && (
              <div className="px-5 py-2.5 bg-emerald-50 text-emerald-800 border-b border-emerald-200 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                {saveSuccessMsg}
              </div>
            )}

            {filteredEntryStudents.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                No students found matching Grade {selectedGrade} and Section {selectedSection}.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100/80 text-slate-700 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-200">
                      <th className="py-3 px-4 w-12">#</th>
                      <th className="py-3 px-4">Student Name</th>
                      <th className="py-3 px-4">Class & Sec</th>
                      <th className="py-3 px-4 w-52">Raw Result Input ({currentTestDef.unit})</th>
                      <th className="py-3 px-4">Auto-Calculated Level</th>
                      <th className="py-3 px-4">Longitudinal Growth</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredEntryStudents.map((student, idx) => {
                      const rawVal = batchRawValues[student.id] || '';
                      const prevResult = allResults.find(
                        r => r.studentId === student.id && r.testId === selectedTestId && r.term !== selectedTerm
                      );
                      const { scorePercent, level, rating } = calculateTestScoreAndLevel(
                        currentTestDef,
                        rawVal,
                        student.age || 12,
                        student.gender || 'Male'
                      );
                      const { changeDelta, formattedChange, trend } = calculateResultGrowth(
                        currentTestDef,
                        rawVal,
                        prevResult?.value
                      );

                      const levelColors: Record<string, string> = {
                        Advanced: 'bg-purple-100 text-purple-800 border-purple-300',
                        Proficient: 'bg-emerald-100 text-emerald-800 border-emerald-300',
                        Progressing: 'bg-blue-100 text-blue-800 border-blue-300',
                        Developing: 'bg-amber-100 text-amber-800 border-amber-300',
                        Beginning: 'bg-slate-100 text-slate-700 border-slate-300'
                      };

                      return (
                        <tr key={student.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4 font-bold text-slate-400">{idx + 1}</td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900">{student.name}</div>
                            <div className="text-[10px] text-slate-400">Roll: {student.rollNumber || 'N/A'}</div>
                          </td>
                          <td className="py-3 px-4 text-slate-600 font-semibold">
                            G{student.grade} - {student.section}
                          </td>
                          <td className="py-3 px-4">
                            {currentTestDef.measurementType === 'rubric' ? (
                              <select
                                value={rawVal}
                                onChange={(e) => setBatchRawValues(prev => ({ ...prev, [student.id]: e.target.value }))}
                                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                              >
                                <option value="">Select Rubric (1-4)...</option>
                                <option value="1">1 — Beginning</option>
                                <option value="2">2 — Developing</option>
                                <option value="3">3 — Proficient</option>
                                <option value="4">4 — Advanced</option>
                              </select>
                            ) : currentTestDef.id === 'bmi' ? (
                              <input
                                type="text"
                                placeholder="kg / cm (e.g. 28/140)"
                                value={rawVal}
                                onChange={(e) => setBatchRawValues(prev => ({ ...prev, [student.id]: e.target.value }))}
                                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                              />
                            ) : (
                              <input
                                type="text"
                                placeholder={`Enter ${currentTestDef.unit}...`}
                                value={rawVal}
                                onChange={(e) => setBatchRawValues(prev => ({ ...prev, [student.id]: e.target.value }))}
                                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                              />
                            )}
                          </td>
                          <td className="py-3 px-4">
                            {rawVal ? (
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase border ${levelColors[level]}`}>
                                {level} ({scorePercent}%)
                              </span>
                            ) : (
                              <span className="text-slate-400 text-[11px] italic">Awaiting Input</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            {rawVal ? (
                              <div className="flex items-center gap-1.5 text-[11px]">
                                <span className="font-bold text-slate-700">{formattedChange || trend}</span>
                              </div>
                            ) : (
                              <span className="text-slate-400 text-[11px]">—</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => {
                                setSelectedProfileStudentId(student.id);
                                setHubMode('student_profile');
                              }}
                              className="px-2.5 py-1 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg text-xs font-bold transition-all"
                            >
                              View Profile →
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 2: INDIVIDUAL STUDENT PHYSICAL DEVELOPMENT PROFILE */}
      {/* ========================================================================= */}
      {hubMode === 'student_profile' && activeStudentProfile && (
        <div className="space-y-6">
          
          {/* Profile Header & Student Selector */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 text-[#0D2B52] rounded-2xl flex items-center justify-center font-black text-lg">
                {activeStudentProfile.studentName.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-black text-slate-900">{activeStudentProfile.studentName}</h2>
                  <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase rounded-full border border-emerald-300">
                    {activeStudentProfile.overallLevel}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Grade {activeStudentProfile.grade} - Section {activeStudentProfile.section} &bull; Age {activeStudentProfile.age} &bull; Cycle: {activeStudentProfile.currentTerm}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedProfileStudentId}
                onChange={(e) => setSelectedProfileStudentId(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none"
              >
                {students.map(s => (
                  <option key={s.id} value={s.id}>{s.name} (Grade {s.grade}-{s.section})</option>
                ))}
              </select>

              <button
                onClick={() => {
                  setReportCompositeEval(activeStudentEvaluation);
                  setShowParentReportModal(true);
                }}
                className="px-4 py-2 bg-[#D4A017] hover:bg-amber-500 text-slate-950 rounded-xl text-xs font-black uppercase tracking-wide flex items-center gap-1.5 transition-all shadow-sm"
              >
                <FileText className="w-4 h-4" />
                Generate Parent Report
              </button>
            </div>
          </div>

          {/* 100-Mark Term PE Grading Summary Card */}
          {(() => {
            const liveFitness = activeStudent
              ? computeFitnessContribution(activeStudent, allResults, 'Term 1', 30)
              : null;
            return (
              <div className="bg-gradient-to-r from-slate-50 to-blue-50/70 rounded-2xl border border-blue-200 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                {activeStudentEvaluation ? (
                  <>
                    <div>
                      <span className="px-2 py-0.5 bg-[#0D2B52] text-white rounded-md text-[10px] font-black uppercase">
                        Saved Term Scorecard ({activeStudentEvaluation.term})
                      </span>
                      <div className="text-sm font-black text-[#0D2B52] mt-1">
                        Total: {activeStudentEvaluation.totalScore} / 100 &bull; CBSE Grade {activeStudentEvaluation.cbseGrade} ({activeStudentEvaluation.coScholasticGrade})
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Fitness: <strong>{activeStudentEvaluation.fitnessSnapshot.manualOverrideMarks ?? activeStudentEvaluation.fitnessSnapshot.autoMarksAwarded}/{activeStudentEvaluation.weights.fitnessMax}</strong> &bull; Discipline: <strong>{activeStudentEvaluation.discipline.marksAwarded}/{activeStudentEvaluation.weights.disciplineMax}</strong> &bull; Games ({activeStudentEvaluation.games.sportName}): <strong>{activeStudentEvaluation.games.marksAwarded}/{activeStudentEvaluation.weights.gamesMax}</strong>
                      </p>
                    </div>
                    <button
                      onClick={() => setHubMode('term_grading')}
                      className="px-4 py-2 bg-[#0D2B52] hover:bg-slate-800 text-white rounded-xl text-xs font-bold shrink-0"
                    >
                      Edit Term Marks →
                    </button>
                  </>
                ) : (
                  <>
                    <div>
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-900 rounded-md text-[10px] font-black uppercase">
                        Auto-Ready Fitness Score
                      </span>
                      <div className="text-sm font-black text-[#0D2B52] mt-1">
                        Fitness Contribution Ready: {liveFitness?.autoMarksAwarded || 0} / 30 Marks ({liveFitness?.testsCounted || 0} tests recorded)
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Add Discipline (20) and Games Skills (50) in Step 2 to finalize this student&apos;s 100-mark CBSE Report Card.
                      </p>
                    </div>
                    <button
                      onClick={() => setHubMode('term_grading')}
                      className="px-4 py-2 bg-[#0D2B52] hover:bg-slate-800 text-white rounded-xl text-xs font-bold shrink-0"
                    >
                      Grade in Step 2 (100M) →
                    </button>
                  </>
                )}
              </div>
            );
          })()}

          {/* 6 Core Domains Radar/Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {(Object.keys(DOMAIN_METADATA) as DevelopmentDomainId[]).map(dId => {
              const dScore = activeStudentProfile.domains[dId];
              const meta = DOMAIN_METADATA[dId];

              const badgeColors: Record<string, string> = {
                Advanced: 'bg-purple-100 text-purple-800 border-purple-300',
                Proficient: 'bg-emerald-100 text-emerald-800 border-emerald-300',
                Progressing: 'bg-blue-100 text-blue-800 border-blue-300',
                Developing: 'bg-amber-100 text-amber-800 border-amber-300',
                Beginning: 'bg-slate-100 text-slate-700 border-slate-300'
              };

              return (
                <div key={dId} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs font-black uppercase tracking-wider text-[#0D2B52]">{meta.name}</h4>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase border ${badgeColors[dScore.level]}`}>
                        {dScore.level}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mb-3">{meta.description}</p>
                  </div>

                  <div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mb-2">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full"
                        style={{ width: `${dScore.scorePercent}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold mb-2">
                      <span>Score: {dScore.scorePercent}%</span>
                      <span className="flex items-center gap-1 text-slate-700">
                        <TrendingUp className="w-3 h-3 text-emerald-500" />
                        {dScore.latestTrend}
                      </span>
                    </div>

                    {dScore.results.length > 0 && (
                      <div className="pt-2 border-t border-slate-100 space-y-1">
                        {dScore.results.map((res, i) => (
                          <div key={i} className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-600 truncate max-w-[140px]">{res.testName}:</span>
                            <span className="font-bold text-slate-900">{res.rawValue} {res.unit}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Stature / BMI Longitudinal History (Neutral Presentation) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-emerald-600" />
                <h3 className="text-xs font-black uppercase tracking-wider text-[#0D2B52]">
                  Stature & BMI Longitudinal History
                </h3>
              </div>
              {activeStudentProfile.currentBMI && (
                <span className="text-xs font-bold text-slate-700">
                  Current: {activeStudentProfile.currentBMI.bmi} kg/m² ({activeStudentProfile.currentBMI.statusLabel})
                </span>
              )}
            </div>

            {activeStudentProfile.bmiHistory.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                {activeStudentProfile.bmiHistory.map((pt, idx) => (
                  <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                    <div className="text-[10px] font-bold text-slate-400 uppercase">{pt.term} ({pt.date})</div>
                    <div className="text-sm font-black text-slate-900">{pt.bmi} kg/m²</div>
                    <div className="text-xs text-slate-600 font-medium">{pt.statusLabel}</div>
                    {pt.heightCm && pt.weightKg && (
                      <div className="text-[10px] text-slate-400 mt-1">
                        Height: {pt.heightCm}cm &bull; Weight: {pt.weightKg}kg
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No historical BMI records found.</p>
            )}
          </div>

          {/* Suggested Development Focus & Teacher Decision Buttons */}
          {activeStudentProfile.developmentFocus && (
            <div className="bg-purple-50/60 border border-purple-200 rounded-2xl p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-purple-700" />
                  <h3 className="text-sm font-black uppercase tracking-wide text-purple-950">
                    Suggested Development Focus
                  </h3>
                </div>
                <span className="text-xs font-semibold text-purple-700">
                  Evidence: {activeStudentProfile.developmentFocus.evidence}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-800">
                <div className="bg-white p-3.5 rounded-xl border border-purple-200">
                  <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Target Area & Goal</div>
                  <div className="font-bold text-purple-950">{activeStudentProfile.developmentFocus.suggestedGoal}</div>
                </div>
                <div className="bg-white p-3.5 rounded-xl border border-purple-200">
                  <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Recommended Strategy</div>
                  <div className="text-slate-700">{activeStudentProfile.developmentFocus.suggestedStrategy}</div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={handleAcceptFocus}
                  className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white text-xs font-black uppercase rounded-xl transition-all shadow-sm"
                >
                  Accept & Activate Intervention
                </button>
                <button
                  onClick={() => {
                    setEditingIntervention({
                      studentId: activeStudentProfile.studentId,
                      studentName: activeStudentProfile.studentName,
                      area: `${activeStudentProfile.developmentFocus?.domainName} (${activeStudentProfile.developmentFocus?.component})`,
                      goal: activeStudentProfile.developmentFocus?.suggestedGoal,
                      strategy: activeStudentProfile.developmentFocus?.suggestedStrategy,
                      frequency: '2 times per week',
                      duration: '4 weeks',
                      status: 'Active'
                    });
                    setShowInterventionModal(true);
                  }}
                  className="px-3.5 py-2 bg-white border border-purple-300 text-purple-900 text-xs font-bold rounded-xl hover:bg-purple-50 transition-all"
                >
                  Edit Goal
                </button>
              </div>
            </div>
          )}

        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 3: ACTIVE INTERVENTIONS & REASSESSMENT TRACKER */}
      {/* ========================================================================= */}
      {hubMode === 'interventions' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-black uppercase text-[#0D2B52]">
                Development Interventions & Reassessment Log
              </h3>
              <p className="text-xs text-slate-500">
                Track baseline &bull; intervention strategy &bull; reassessment outcomes across all classes.
              </p>
            </div>

            <button
              onClick={() => {
                setEditingIntervention({
                  studentId: activeStudent?.id,
                  studentName: activeStudent?.name,
                  area: 'Movement Skills (Agility & Balance)',
                  goal: 'Improve change-of-direction speed and balance control.',
                  strategy: 'Twice-weekly 10-minute cone ladder drills.',
                  frequency: '2 times per week',
                  duration: '4 weeks',
                  status: 'Active'
                });
                setShowInterventionModal(true);
              }}
              className="px-4 py-2 bg-[#0D2B52] hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              New Intervention
            </button>
          </div>

          {interventions.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              No active interventions currently logged. Accept a suggested focus from any student's profile to begin.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {interventions.map((item) => (
                <div key={item.id} className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-900 text-sm">{item.studentName || 'Student'}</div>
                      <div className="text-[11px] text-purple-700 font-semibold">{item.area}</div>
                    </div>
                    <span className="px-2 py-0.5 bg-purple-100 text-purple-800 text-[10px] font-black uppercase rounded-full">
                      {item.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-700"><strong>Goal:</strong> {item.goal}</p>
                  <p className="text-xs text-slate-600"><strong>Strategy:</strong> {item.strategy} ({item.frequency} for {item.duration})</p>

                  {item.reassessmentOutcome && (
                    <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-semibold text-emerald-800">
                      Reassessment: {item.reassessmentOutcome}
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                    <button
                      onClick={() => {
                        setEditingIntervention(item);
                        setShowInterventionModal(true);
                      }}
                      className="text-xs text-blue-600 font-bold hover:underline"
                    >
                      Log Reassessment
                    </button>
                    <button
                      onClick={() => {
                        toast.confirm("Remove this intervention?", async () => {
                          await physicalDevelopmentStorage.deleteIntervention(item.id);
                          setInterventions(prev => prev.filter(i => i.id !== item.id));
                          toast.success("Intervention removed.");
                        });
                      }}
                      className="text-xs text-slate-400 hover:text-red-600"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Intervention Modal */}
      {showInterventionModal && editingIntervention && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <h3 className="text-base font-black text-[#0D2B52] uppercase">
              {editingIntervention.id ? 'Edit Intervention & Reassessment' : 'Create Student Intervention'}
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Target Area / Domain</label>
                <input
                  type="text"
                  value={editingIntervention.area || ''}
                  onChange={(e) => setEditingIntervention(prev => ({ ...prev, area: e.target.value }))}
                  className="w-full border border-slate-200 rounded-lg p-2 font-medium outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Development Goal</label>
                <input
                  type="text"
                  value={editingIntervention.goal || ''}
                  onChange={(e) => setEditingIntervention(prev => ({ ...prev, goal: e.target.value }))}
                  className="w-full border border-slate-200 rounded-lg p-2 font-medium outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Intervention Strategy</label>
                <textarea
                  rows={2}
                  value={editingIntervention.strategy || ''}
                  onChange={(e) => setEditingIntervention(prev => ({ ...prev, strategy: e.target.value }))}
                  className="w-full border border-slate-200 rounded-lg p-2 font-medium outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Frequency</label>
                  <input
                    type="text"
                    value={editingIntervention.frequency || '2 times per week'}
                    onChange={(e) => setEditingIntervention(prev => ({ ...prev, frequency: e.target.value }))}
                    className="w-full border border-slate-200 rounded-lg p-2 font-medium outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Duration</label>
                  <input
                    type="text"
                    value={editingIntervention.duration || '4 weeks'}
                    onChange={(e) => setEditingIntervention(prev => ({ ...prev, duration: e.target.value }))}
                    className="w-full border border-slate-200 rounded-lg p-2 font-medium outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Reassessment Outcome</label>
                <select
                  value={editingIntervention.reassessmentOutcome || ''}
                  onChange={(e) => setEditingIntervention(prev => ({ ...prev, reassessmentOutcome: e.target.value as any }))}
                  className="w-full border border-slate-200 rounded-lg p-2 font-medium outline-none"
                >
                  <option value="">Pending Reassessment...</option>
                  <option value="Improvement observed">Improvement observed</option>
                  <option value="Partially improved">Partially improved</option>
                  <option value="No significant change">No significant change</option>
                  <option value="Further support recommended">Further support recommended</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  setShowInterventionModal(false);
                  setEditingIntervention(null);
                }}
                className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-lg text-xs hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveInterventionForm}
                className="px-4 py-2 bg-[#0D2B52] text-white font-bold rounded-lg text-xs hover:bg-slate-800"
              >
                Save Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Parent Physical Development Report Modal */}
      {showParentReportModal && activeStudentProfile && (
        <ParentPhysicalDevelopmentReportModal
          profile={activeStudentProfile}
          compositeEvaluation={reportCompositeEval ?? activeStudentEvaluation}
          isOpen={showParentReportModal}
          onClose={() => {
            setShowParentReportModal(false);
            setReportCompositeEval(null);
          }}
          schoolName={userProfile?.schoolName || 'SmartPE Physical Education Department'}
        />
      )}

    </div>
  );
};
