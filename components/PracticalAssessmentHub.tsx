import React, { useState, useEffect, useMemo } from 'react';
import { 
  ClipboardCheck, 
  Award, 
  Users, 
  Activity, 
  Sparkles, 
  FileSpreadsheet, 
  FileText, 
  Save, 
  CheckCircle2, 
  AlertCircle, 
  ChevronRight, 
  ChevronLeft, 
  Search, 
  Filter, 
  Plus, 
  Minus, 
  Download, 
  Loader2, 
  HelpCircle, 
  Info, 
  MessageSquare, 
  SlidersHorizontal,
  Smartphone,
  Table,
  Zap,
  RotateCcw,
  Check,
  GraduationCap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { fitnessService, Student, School, SchoolMember } from '../services/fitnessService.ts';
import { PracticalAssessment } from '../types.ts';
import { auth } from '../services/firebase.ts';
import { toast } from '../services/toast.ts';
import { PracticalVivaAssistantModal } from './practical/PracticalVivaAssistantModal.tsx';
import { generateCbsePracticalAwardSheetPdf } from './practical/CbseAwardSheetPdf.ts';
import { downloadCsvFile } from '../utils/safeBrowser.ts';

const CBSE_GAMES_LIST = [
  'Basketball',
  'Football',
  'Volleyball',
  'Badminton',
  'Cricket',
  'Kho-Kho',
  'Kabaddi',
  'Athletics (Track & Field)',
  'Table Tennis',
  'Handball',
  'Hockey',
  'Yoga & Gymnastics'
];

const CBSE_YOGA_ASANAS = [
  { name: 'Bhujangasana (Cobra Pose)', category: 'Diabetes / Asthma' },
  { name: 'Paschimottanasana (Seated Forward Bend)', category: 'Diabetes / Obesity' },
  { name: 'Trikonasana (Triangle Pose)', category: 'Obesity / Posture' },
  { name: 'Ardha Matsyendrasana (Half Fish Pose)', category: 'Diabetes / Spine' },
  { name: 'Vajrasana (Diamond Pose)', category: 'Hypertension / Digestion' },
  { name: 'Pavanmuktasana (Wind-Relieving Pose)', category: 'Diabetes / Hypertension' },
  { name: 'Tadasana (Mountain Pose)', category: 'Hypertension / Posture' },
  { name: 'Gomukhasana (Cow Face Pose)', category: 'Asthma / Shoulders' },
  { name: 'Chakrasana (Wheel Pose)', category: 'Asthma / Core Flexibility' },
  { name: 'Matsyasana (Fish Pose)', category: 'Asthma / Respiratory' },
  { name: 'Shavasana (Corpse Pose)', category: 'Hypertension / Relaxation' },
  { name: 'Ardha Chakrasana (Half Wheel Pose)', category: 'Hypertension / Obesity' }
];

const getCbseGradeBand = (total: number): { grade: string; color: string; label: string } => {
  if (total >= 28) return { grade: 'A1', color: 'bg-emerald-100 text-emerald-800 border-emerald-300', label: 'Outstanding (28-30)' };
  if (total >= 25) return { grade: 'A2', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Excellent (25-27)' };
  if (total >= 22) return { grade: 'B1', color: 'bg-indigo-100 text-indigo-800 border-indigo-300', label: 'Very Good (22-24)' };
  if (total >= 19) return { grade: 'B2', color: 'bg-indigo-50 text-indigo-700 border-indigo-200', label: 'Good (19-21)' };
  if (total >= 16) return { grade: 'C1', color: 'bg-amber-100 text-amber-800 border-amber-300', label: 'Average (16-18)' };
  if (total >= 13) return { grade: 'C2', color: 'bg-amber-50 text-amber-700 border-amber-200', label: 'Fair (13-15)' };
  if (total >= 10) return { grade: 'D', color: 'bg-orange-100 text-orange-800 border-orange-300', label: 'Marginal (10-12)' };
  return { grade: 'E', color: 'bg-rose-100 text-rose-800 border-rose-300', label: 'Needs Improvement (<10)' };
};

// Helper to match grade variations (e.g., '12', 'Grade 12', 'Class 12', 'XII', '12th')
export const isGradeMatching = (studentGrade: string | number | undefined, targetGrade: string): boolean => {
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
};

export const PracticalAssessmentHub: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [assessments, setAssessments] = useState<Record<string, PracticalAssessment>>({});
  const [school, setSchool] = useState<School | null>(null);
  const [userProfile, setUserProfile] = useState<SchoolMember | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [seedingGrade12, setSeedingGrade12] = useState<boolean>(false);

  // Filters & State
  const [selectedGrade, setSelectedGrade] = useState<string>('12');
  const [selectedSection, setSelectedSection] = useState<string>('ALL');
  const [selectedExamType, setSelectedExamType] = useState<'CBSE Board Practical Final' | 'Pre-Board Practical' | 'Term 1 Internal Practical' | 'Term 2 Internal Practical' | 'Mid-Term Evaluation'>('CBSE Board Practical Final');
  const [academicYear, setAcademicYear] = useState<string>('2025-2026');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [activeStudentId, setActiveStudentId] = useState<string | null>(null);
  const [showVivaModal, setShowVivaModal] = useState<boolean>(false);
  const [vivaStudentTarget, setVivaStudentTarget] = useState<Student | null>(null);

  // Examiner Metadata for PDF
  const [internalExaminer, setInternalExaminer] = useState<string>('');
  const [externalExaminer, setExternalExaminer] = useState<string>('');
  const [centerCode, setCenterCode] = useState<string>('');

  // Initial load and real-time subscriptions
  useEffect(() => {
    let unsubStudents: (() => void) | undefined;
    let unsubPractical: (() => void) | undefined;
    const currentTeacherId = auth.currentUser?.uid || 'guest_teacher';

    const loadDataAndSubscribe = async () => {
      setLoading(true);
      try {
        const schoolMember = await fitnessService.getSchoolMember(currentTeacherId);
        setUserProfile(schoolMember);
        const schoolId = schoolMember?.schoolId;
        const isAdmin = schoolMember?.role === 'admin' || fitnessService.isSuperAdmin();

        if (schoolId) {
          const s = await fitnessService.getSchool(schoolId);
          setSchool(s);
          if (s?.code) setCenterCode(s.code);
        }
        if (schoolMember?.displayName) {
          setInternalExaminer(schoolMember.displayName);
        }

        // Subscriptions using verified schoolId
        unsubStudents = fitnessService.subscribeToStudents(currentTeacherId, schoolId, isAdmin, (list) => {
          setStudents(list);
          setLoading(false);
        });

        unsubPractical = fitnessService.subscribeToPracticalAssessments(currentTeacherId, schoolId, (list) => {
          const map: Record<string, PracticalAssessment> = {};
          list.forEach(a => {
            map[a.studentId] = a;
          });
          setAssessments(map);
        });
      } catch (err) {
        console.error("Failed to load practical assessments:", err);
        setLoading(false);
      }
    };

    loadDataAndSubscribe();

    return () => {
      unsubStudents?.();
      unsubPractical?.();
    };
  }, [auth.currentUser?.uid]);

  // Seed sample Grade 12 students if empty
  const handleSeedGrade12 = async () => {
    setSeedingGrade12(true);
    try {
      const currentTeacherId = auth.currentUser?.uid || 'guest_teacher';
      const schoolMember = await fitnessService.getSchoolMember(currentTeacherId);
      const schoolId = schoolMember?.schoolId || (auth.currentUser ? `personal_${auth.currentUser.uid}` : 'master_registry');

      const sampleGrade12: Student[] = [
        { id: `std_1201_${Date.now()}`, rollNumber: '1201', name: 'Aarav Sharma', grade: '12', section: 'A', gender: 'Male', age: 17, schoolId, teacherId: currentTeacherId, attendance: 95, performance: 'Excellent' },
        { id: `std_1202_${Date.now()}`, rollNumber: '1202', name: 'Diya Patel', grade: '12', section: 'A', gender: 'Female', age: 17, schoolId, teacherId: currentTeacherId, attendance: 92, performance: 'Good' },
        { id: `std_1203_${Date.now()}`, rollNumber: '1203', name: 'Rohan Verma', grade: '12', section: 'A', gender: 'Male', age: 18, schoolId, teacherId: currentTeacherId, attendance: 88, performance: 'Good' },
        { id: `std_1204_${Date.now()}`, rollNumber: '1204', name: 'Ananya Iyer', grade: '12', section: 'A', gender: 'Female', age: 17, schoolId, teacherId: currentTeacherId, attendance: 96, performance: 'Excellent' },
        { id: `std_1205_${Date.now()}`, rollNumber: '1205', name: 'Kabir Singh', grade: '12', section: 'A', gender: 'Male', age: 18, schoolId, teacherId: currentTeacherId, attendance: 85, performance: 'Average' },
        { id: `std_1206_${Date.now()}`, rollNumber: '1206', name: 'Ishita Kapoor', grade: '12', section: 'A', gender: 'Female', age: 17, schoolId, teacherId: currentTeacherId, attendance: 94, performance: 'Excellent' },
        { id: `std_1207_${Date.now()}`, rollNumber: '1207', name: 'Mohammed Farhan', grade: '12', section: 'A', gender: 'Male', age: 17, schoolId, teacherId: currentTeacherId, attendance: 90, performance: 'Good' },
        { id: `std_1208_${Date.now()}`, rollNumber: '1208', name: 'Sneha Reddy', grade: '12', section: 'A', gender: 'Female', age: 17, schoolId, teacherId: currentTeacherId, attendance: 93, performance: 'Good' },
        { id: `std_1209_${Date.now()}`, rollNumber: '1209', name: 'Vikram Joshi', grade: '12', section: 'A', gender: 'Male', age: 18, schoolId, teacherId: currentTeacherId, attendance: 89, performance: 'Good' },
        { id: `std_1210_${Date.now()}`, rollNumber: '1210', name: 'Tanvi Nair', grade: '12', section: 'A', gender: 'Female', age: 17, schoolId, teacherId: currentTeacherId, attendance: 97, performance: 'Excellent' },
      ];

      await fitnessService.bulkSaveStudents(sampleGrade12);
      setSelectedGrade('12');
      toast.success('Successfully linked and created 10 CBSE Grade 12 students in the database!');
    } catch (e) {
      console.error(e);
      toast.error('Failed to seed Grade 12 students');
    } finally {
      setSeedingGrade12(false);
    }
  };

  // Filtered Students List with robust Grade Matching
  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      if (selectedGrade !== 'ALL') {
        if (!isGradeMatching(s.grade, selectedGrade)) return false;
      }
      if (selectedSection !== 'ALL' && s.section !== selectedSection) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchName = s.name.toLowerCase().includes(query);
        const matchRoll = (s.rollNumber || '').toLowerCase().includes(query);
        if (!matchName && !matchRoll) return false;
      }
      return true;
    }).sort((a, b) => {
      const rA = parseInt(a.rollNumber) || 0;
      const rB = parseInt(b.rollNumber) || 0;
      if (rA && rB) return rA - rB;
      return a.name.localeCompare(b.name);
    });
  }, [students, selectedGrade, selectedSection, searchQuery]);

  // Handle Score Updates
  const updateScoreField = (
    student: Student,
    field: 'fitnessTestScore' | 'yogicPracticesScore' | 'gameProficiencyScore' | 'recordFileScore' | 'vivaVoceScore' | 'gameSelected' | 'status',
    value: any
  ) => {
    setIsSaved(false);
    const existing = assessments[student.id] || {
      id: `prac_${student.id}_${selectedExamType.replace(/\s+/g, '_')}`,
      studentId: student.id,
      studentName: student.name,
      rollNumber: student.rollNumber || '',
      grade: student.grade,
      section: student.section,
      gender: student.gender,
      academicYear: academicYear,
      examType: selectedExamType,
      schoolId: student.schoolId || '',
      teacherId: auth.currentUser?.uid || 'teacher',
      date: new Date().toISOString().split('T')[0],
      fitnessTestScore: 0,
      yogicPracticesScore: 0,
      gameProficiencyScore: 0,
      gameSelected: 'Basketball',
      yogaAsanasSelected: ['Bhujangasana (Cobra Pose)', 'Trikonasana (Triangle Pose)'],
      recordFileScore: 0,
      vivaVoceScore: 0,
      totalMarks: 0,
      status: 'completed'
    };

    let updated = { ...existing, [field]: value };

    // Clamping limits
    if (field === 'fitnessTestScore') updated.fitnessTestScore = Math.min(7, Math.max(0, Number(value) || 0));
    if (field === 'yogicPracticesScore') updated.yogicPracticesScore = Math.min(7, Math.max(0, Number(value) || 0));
    if (field === 'gameProficiencyScore') updated.gameProficiencyScore = Math.min(7, Math.max(0, Number(value) || 0));
    if (field === 'recordFileScore') updated.recordFileScore = Math.min(5, Math.max(0, Number(value) || 0));
    if (field === 'vivaVoceScore') updated.vivaVoceScore = Math.min(5, Math.max(0, Number(value) || 0));

    // Recompute total marks (Sum out of 30)
    if (updated.status === 'absent') {
      updated.totalMarks = 0;
    } else {
      updated.totalMarks = (
        updated.fitnessTestScore +
        updated.yogicPracticesScore +
        updated.gameProficiencyScore +
        updated.recordFileScore +
        updated.vivaVoceScore
      );
    }

    setAssessments(prev => ({
      ...prev,
      [student.id]: updated
    }));
  };

  // Quick Preset Scoring (e.g. Full Marks, Good Marks)
  const applyPresetForStudent = (student: Student, preset: 'excellent' | 'good' | 'average') => {
    let fit = 6, yoga = 6, game = 6, rec = 5, viva = 5;
    if (preset === 'excellent') {
      fit = 7; yoga = 7; game = 7; rec = 5; viva = 5; // 30/30
    } else if (preset === 'good') {
      fit = 6; yoga = 6; game = 6; rec = 4; viva = 4; // 26/30
    } else if (preset === 'average') {
      fit = 5; yoga = 5; game = 5; rec = 4; viva = 3; // 22/30
    }

    const currentTeacherId = auth.currentUser?.uid || 'teacher';
    const updated: PracticalAssessment = {
      id: `prac_${student.id}_${selectedExamType.replace(/\s+/g, '_')}`,
      studentId: student.id,
      studentName: student.name,
      rollNumber: student.rollNumber || '',
      grade: student.grade,
      section: student.section,
      gender: student.gender,
      academicYear: academicYear,
      examType: selectedExamType,
      schoolId: student.schoolId || '',
      teacherId: currentTeacherId,
      date: new Date().toISOString().split('T')[0],
      fitnessTestScore: fit,
      yogicPracticesScore: yoga,
      gameProficiencyScore: game,
      gameSelected: assessments[student.id]?.gameSelected || 'Basketball',
      yogaAsanasSelected: assessments[student.id]?.yogaAsanasSelected || ['Bhujangasana (Cobra Pose)', 'Trikonasana (Triangle Pose)'],
      recordFileScore: rec,
      vivaVoceScore: viva,
      totalMarks: fit + yoga + game + rec + viva,
      status: 'completed'
    };

    setAssessments(prev => ({
      ...prev,
      [student.id]: updated
    }));
    setIsSaved(false);
  };

  // Save All Assessments to DB & LocalStorage
  const handleSaveAll = async () => {
    setSaving(true);
    try {
      const itemsToSave = filteredStudents.map(s => {
        const item = assessments[s.id];
        if (item) return item;
        return {
          id: `prac_${s.id}_${selectedExamType.replace(/\s+/g, '_')}`,
          studentId: s.id,
          studentName: s.name,
          rollNumber: s.rollNumber || '',
          grade: s.grade,
          section: s.section,
          gender: s.gender,
          academicYear: academicYear,
          examType: selectedExamType,
          schoolId: s.schoolId || '',
          teacherId: auth.currentUser?.uid || 'teacher',
          date: new Date().toISOString().split('T')[0],
          fitnessTestScore: 0,
          yogicPracticesScore: 0,
          gameProficiencyScore: 0,
          recordFileScore: 0,
          vivaVoceScore: 0,
          totalMarks: 0,
          status: 'draft'
        } as PracticalAssessment;
      });

      await fitnessService.bulkSavePracticalAssessments(itemsToSave);
      setIsSaved(true);
      toast.success(`Successfully saved practical marks for ${itemsToSave.length} students!`);
    } catch (e) {
      console.error(e);
      toast.error("Failed to save practical marks");
    } finally {
      setSaving(false);
    }
  };

  // Export PDF Award List
  const handleExportPdf = () => {
    const listToExport = filteredStudents.map(s => {
      return assessments[s.id] || {
        id: `prac_${s.id}`,
        studentId: s.id,
        studentName: s.name,
        rollNumber: s.rollNumber || '',
        grade: s.grade,
        section: s.section,
        gender: s.gender,
        academicYear,
        examType: selectedExamType,
        schoolId: s.schoolId || '',
        teacherId: 'teacher',
        date: new Date().toISOString().split('T')[0],
        fitnessTestScore: 0,
        yogicPracticesScore: 0,
        gameProficiencyScore: 0,
        recordFileScore: 0,
        vivaVoceScore: 0,
        totalMarks: 0,
        status: 'draft'
      };
    });

    generateCbsePracticalAwardSheetPdf(listToExport, {
      school,
      academicYear,
      grade: selectedGrade,
      section: selectedSection,
      examType: selectedExamType,
      internalExaminerName: internalExaminer,
      externalExaminerName: externalExaminer,
      centerCode: centerCode
    });

    toast.success("CBSE Practical Award Sheet (30 Marks) Generated & Downloaded!");
  };

  // Export CSV for CBSE OASIS
  const handleExportCsv = () => {
    const headers = [
      'S.No',
      'Roll Number',
      'Student Name',
      'Gender',
      'Class',
      'Section',
      'Physical Fitness (Max 7)',
      'Yogic Practices (Max 7)',
      'Game Proficiency (Max 7)',
      'Record File (Max 5)',
      'Viva Voce (Max 5)',
      'Total Marks (Max 30)',
      'CBSE Grade',
      'Status'
    ];

    const rows = filteredStudents.map((s, idx) => {
      const a = assessments[s.id];
      const isAbsent = a?.status === 'absent';
      const tot = isAbsent ? 0 : (a?.totalMarks || 0);
      const grade = isAbsent ? 'AB' : getCbseGradeBand(tot).grade;

      return [
        idx + 1,
        s.rollNumber || '',
        s.name,
        s.gender,
        s.grade,
        s.section,
        isAbsent ? 'AB' : (a?.fitnessTestScore ?? 0),
        isAbsent ? 'AB' : (a?.yogicPracticesScore ?? 0),
        isAbsent ? 'AB' : (a?.gameProficiencyScore ?? 0),
        isAbsent ? 'AB' : (a?.recordFileScore ?? 0),
        isAbsent ? 'AB' : (a?.vivaVoceScore ?? 0),
        isAbsent ? 'AB' : tot,
        grade,
        a?.status || 'draft'
      ];
    });

    downloadCsvFile(
      `CBSE_Practical_Marks_Class_${selectedGrade}_${selectedSection}_${academicYear}.csv`,
      headers,
      rows
    );

    toast.success("Exported CSV successfully for CBSE portal!");
  };

  // Analytics Metrics
  const metrics = useMemo(() => {
    const total = filteredStudents.length;
    let evaluated = 0;
    let totalScoreSum = 0;
    let absentCount = 0;

    filteredStudents.forEach(s => {
      const a = assessments[s.id];
      if (a) {
        if (a.status === 'absent') {
          absentCount++;
          evaluated++;
        } else if (a.totalMarks > 0 || a.status === 'completed') {
          evaluated++;
          totalScoreSum += a.totalMarks;
        }
      }
    });

    const validEvaluated = evaluated - absentCount;
    const avgScore = validEvaluated > 0 ? (totalScoreSum / validEvaluated).toFixed(1) : '0.0';

    return {
      total,
      evaluated,
      pending: total - evaluated,
      avgScore,
      absentCount
    };
  }, [filteredStudents, assessments]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in">
      {/* Top Header Card */}
      <div className="bg-[#0D2B52] text-white p-6 sm:p-8 rounded-[2.5rem] shadow-xl border-2 border-slate-900 relative overflow-hidden">
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="bg-[#D4A017] text-slate-950 px-3 py-0.5 rounded-full text-xs font-black uppercase tracking-wider">
                Subject Code 048
              </span>
              <span className="bg-white/10 text-indigo-200 px-3 py-0.5 rounded-full text-xs font-black uppercase">
                30 Marks External / Internal Practical
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white uppercase">
              CBSE Physical Education Practical Exam (30 Marks)
            </h1>
            <p className="text-sm text-indigo-100/80 max-w-2xl font-medium">
              Grade 11 & 12 standardized practical scoring portal: 5 Criteria (Fitness 7M + Yoga 7M + Game 7M + Record 5M + Viva 5M) with official award sheet generation.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleExportCsv}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer border border-white/20"
              title="Export CSV for CBSE OASIS Portal"
            >
              <FileSpreadsheet size={15} className="text-emerald-400" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={handleExportPdf}
              className="px-4 py-2.5 bg-[#D4A017] hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 shadow-md cursor-pointer"
              title="Download Print-Ready CBSE Marks Award Sheet PDF with Signature Blocks"
            >
              <Download size={15} />
              <span>CBSE Award Sheet (PDF)</span>
            </button>
          </div>
        </div>

        {/* 30-Mark Criterion Architecture Visual Pill Row */}
        <div className="mt-6 pt-6 border-t border-white/10 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <div className="bg-white/5 p-3 rounded-2xl border border-white/10">
            <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest block">Criterion 1</span>
            <p className="text-xs font-black text-white">Physical Fitness (SAI/KIFT)</p>
            <span className="text-[11px] font-bold text-indigo-200">Max 7 Marks</span>
          </div>

          <div className="bg-white/5 p-3 rounded-2xl border border-white/10">
            <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest block">Criterion 2</span>
            <p className="text-xs font-black text-white">Yogic Practices (Asanas)</p>
            <span className="text-[11px] font-bold text-indigo-200">Max 7 Marks</span>
          </div>

          <div className="bg-white/5 p-3 rounded-2xl border border-white/10">
            <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest block">Criterion 3</span>
            <p className="text-xs font-black text-white">Game Proficiency Skill</p>
            <span className="text-[11px] font-bold text-indigo-200">Max 7 Marks</span>
          </div>

          <div className="bg-white/5 p-3 rounded-2xl border border-white/10">
            <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest block">Criterion 4</span>
            <p className="text-xs font-black text-white">Practical Record File</p>
            <span className="text-[11px] font-bold text-indigo-200">Max 5 Marks</span>
          </div>

          <div className="bg-white/5 p-3 rounded-2xl border border-white/10">
            <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest block">Criterion 5</span>
            <p className="text-xs font-black text-white">Viva Voce (Oral Exam)</p>
            <span className="text-[11px] font-bold text-indigo-200">Max 5 Marks</span>
          </div>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className="p-3 bg-indigo-50 text-indigo-700 rounded-xl">
            <Users size={20} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Eligible Students</p>
            <p className="text-xl font-black text-slate-900">{metrics.total}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl">
            <ClipboardCheck size={20} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Assessed & Logged</p>
            <p className="text-xl font-black text-slate-900">{metrics.evaluated}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className="p-3 bg-amber-50 text-amber-700 rounded-xl">
            <Activity size={20} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Pending Evaluation</p>
            <p className="text-xl font-black text-slate-900">{metrics.pending}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className="p-3 bg-[#0D2B52] text-[#D4A017] rounded-xl">
            <Award size={20} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Class Avg / 30</p>
            <p className="text-xl font-black text-slate-900">{metrics.avgScore} <span className="text-xs text-slate-400 font-bold">/ 30</span></p>
          </div>
        </div>
      </div>

      {/* Roster Filters & Toolbar */}
      <div className="bg-white p-5 sm:p-6 rounded-[2rem] border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Class, Section, & Exam Selectors */}
          <div className="flex flex-wrap items-center gap-3">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Class / Grade</label>
              <select
                value={selectedGrade}
                onChange={e => setSelectedGrade(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="12">Class 12 (Senior Board)</option>
                <option value="11">Class 11 (Senior Secondary)</option>
                <option value="ALL">All Senior Classes</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Section</label>
              <select
                value={selectedSection}
                onChange={e => setSelectedSection(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ALL">All Sections</option>
                <option value="A">Section A</option>
                <option value="B">Section B</option>
                <option value="C">Section C</option>
                <option value="D">Section D</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Exam Session</label>
              <select
                value={selectedExamType}
                onChange={e => setSelectedExamType(e.target.value as any)}
                className="px-3 py-2 bg-indigo-50 border border-indigo-200 rounded-xl text-xs font-black text-indigo-950 outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="CBSE Board Practical Final">CBSE Board Practical Final</option>
                <option value="Pre-Board Practical">Pre-Board Practical Exam</option>
                <option value="Term 1 Internal Practical">Term 1 Internal Practical</option>
                <option value="Term 2 Internal Practical">Term 2 Internal Practical</option>
                <option value="Mid-Term Evaluation">Mid-Term Evaluation</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Session Year</label>
              <input
                type="text"
                value={academicYear}
                onChange={e => setAcademicYear(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 w-28"
              />
            </div>
          </div>

          {/* View Toggle & Save Button */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* View Mode Toggle */}
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer ${
                  viewMode === 'table' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Table size={13} />
                <span>Table Grid</span>
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer ${
                  viewMode === 'cards' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Smartphone size={13} />
                <span>Field Cards</span>
              </button>
            </div>

            {/* Save All Button */}
            <button
              onClick={handleSaveAll}
              disabled={saving || filteredStudents.length === 0}
              className="px-5 py-2.5 bg-[#0D2B52] hover:bg-[#164077] text-white border-2 border-slate-900 rounded-xl font-black text-xs uppercase tracking-wider shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {saving ? (
                <Loader2 size={15} className="animate-spin text-[#D4A017]" />
              ) : isSaved ? (
                <CheckCircle2 size={15} className="text-emerald-400" />
              ) : (
                <Save size={15} className="text-[#D4A017]" />
              )}
              <span>{saving ? 'Saving...' : isSaved ? 'Marks Saved!' : 'Save All Marks'}</span>
            </button>
          </div>
        </div>

        {/* Search Input Bar */}
        <div className="pt-2">
          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search candidate by name or CBSE roll number..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Database Isolation Architecture Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white px-5 py-3 rounded-2xl border border-indigo-500/30 flex flex-wrap items-center justify-between gap-3 text-xs shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-bold text-slate-200">
            Database Architecture: <strong className="text-white">Strict Collection Separation Enforced</strong>
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-[11px] font-medium text-indigo-200">
          <span className="bg-white/10 px-2.5 py-1 rounded-lg">👤 Student Roster: <code className="text-amber-300 font-mono">students</code></span>
          <span className="bg-white/10 px-2.5 py-1 rounded-lg">🏃 Fitness Battery: <code className="text-amber-300 font-mono">results</code></span>
          <span className="bg-white/10 px-2.5 py-1 rounded-lg">📝 30M Practical Exam: <code className="text-emerald-300 font-mono">practical_assessments</code></span>
        </div>
      </div>

      {/* Main Scoring Roster Area */}
      {filteredStudents.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-[2.5rem] border border-dashed border-slate-200 text-slate-400 space-y-4">
          <Users size={40} className="mx-auto text-slate-300" />
          <div className="space-y-1 max-w-md mx-auto">
            <p className="font-black text-base uppercase text-slate-800">
              No students found in {selectedGrade === 'ALL' ? 'Senior Classes' : `Grade ${selectedGrade}`}
            </p>
            <p className="text-xs text-slate-500">
              Click below to automatically create and link 10 realistic CBSE Grade 12 students to your database roster, or add them via the Student Directory.
            </p>
          </div>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={handleSeedGrade12}
              disabled={seedingGrade12}
              className="px-5 py-3 bg-[#0D2B52] hover:bg-[#164077] text-[#D4A017] border-2 border-slate-900 rounded-2xl font-black text-xs uppercase tracking-wider shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {seedingGrade12 ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
              <span>⚡ Generate & Link 10 CBSE Grade 12 Students</span>
            </button>
            <button
              onClick={() => setSelectedGrade('ALL')}
              className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer"
            >
              View All Classes ({students.length})
            </button>
          </div>
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE SPREADSHEET GRID MODE */
        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white font-black text-[11px] uppercase tracking-wider border-b border-slate-800">
                  <th className="p-3.5 pl-5 w-12 text-center">#</th>
                  <th className="p-3.5 w-28">Roll No</th>
                  <th className="p-3.5 min-w-[160px]">Student Name</th>
                  <th className="p-3.5 w-16 text-center">Sex</th>
                  <th className="p-3.5 text-center bg-indigo-950/60 w-28">
                    Fitness
                    <span className="block text-[9px] text-[#D4A017] font-bold">Max 7</span>
                  </th>
                  <th className="p-3.5 text-center bg-indigo-950/40 w-28">
                    Yoga
                    <span className="block text-[9px] text-[#D4A017] font-bold">Max 7</span>
                  </th>
                  <th className="p-3.5 text-center bg-indigo-950/60 w-32">
                    Game / Sport
                    <span className="block text-[9px] text-[#D4A017] font-bold">Max 7</span>
                  </th>
                  <th className="p-3.5 text-center bg-indigo-950/40 w-28">
                    Record File
                    <span className="block text-[9px] text-[#D4A017] font-bold">Max 5</span>
                  </th>
                  <th className="p-3.5 text-center bg-indigo-950/60 w-28">
                    Viva Voce
                    <span className="block text-[9px] text-[#D4A017] font-bold">Max 5</span>
                  </th>
                  <th className="p-3.5 text-center bg-slate-950 w-24">
                    Total
                    <span className="block text-[9px] text-emerald-400 font-bold">/ 30</span>
                  </th>
                  <th className="p-3.5 text-center w-20">Grade</th>
                  <th className="p-3.5 pr-5 text-right w-24">Quick Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {filteredStudents.map((student, idx) => {
                  const assessment = assessments[student.id] || {
                    fitnessTestScore: 0,
                    yogicPracticesScore: 0,
                    gameProficiencyScore: 0,
                    gameSelected: 'Basketball',
                    recordFileScore: 0,
                    vivaVoceScore: 0,
                    totalMarks: 0,
                    status: 'draft'
                  };

                  const isAbsent = assessment.status === 'absent';
                  const total = isAbsent ? 0 : (
                    (assessment.fitnessTestScore || 0) +
                    (assessment.yogicPracticesScore || 0) +
                    (assessment.gameProficiencyScore || 0) +
                    (assessment.recordFileScore || 0) +
                    (assessment.vivaVoceScore || 0)
                  );

                  const gradeInfo = isAbsent ? { grade: 'AB', color: 'bg-rose-100 text-rose-800 border-rose-300' } : getCbseGradeBand(total);

                  return (
                    <tr key={student.id} className={`hover:bg-slate-50/80 transition-colors ${idx % 2 === 1 ? 'bg-slate-50/30' : ''}`}>
                      <td className="p-3.5 pl-5 text-center font-bold text-slate-400 text-[11px]">
                        {idx + 1}
                      </td>
                      <td className="p-3.5 font-mono font-bold text-indigo-900">
                        {student.rollNumber || `PE-${idx + 1}`}
                      </td>
                      <td className="p-3.5">
                        <p className="font-black text-slate-900">{student.name}</p>
                        <p className="text-[10px] text-slate-400">Class {student.grade}-{student.section}</p>
                      </td>
                      <td className="p-3.5 text-center font-bold text-slate-600">
                        {student.gender === 'Female' ? 'F' : 'M'}
                      </td>

                      {/* Fitness Score (Max 7) */}
                      <td className="p-2 text-center bg-indigo-50/20">
                        <input
                          type="number"
                          min="0"
                          max="7"
                          disabled={isAbsent}
                          value={isAbsent ? '' : (assessment.fitnessTestScore || '')}
                          placeholder="0-7"
                          onChange={e => updateScoreField(student, 'fitnessTestScore', e.target.value)}
                          className="w-16 p-1.5 text-center font-black text-xs bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-100"
                        />
                      </td>

                      {/* Yoga Score (Max 7) */}
                      <td className="p-2 text-center bg-indigo-50/10">
                        <input
                          type="number"
                          min="0"
                          max="7"
                          disabled={isAbsent}
                          value={isAbsent ? '' : (assessment.yogicPracticesScore || '')}
                          placeholder="0-7"
                          onChange={e => updateScoreField(student, 'yogicPracticesScore', e.target.value)}
                          className="w-16 p-1.5 text-center font-black text-xs bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-100"
                        />
                      </td>

                      {/* Game Score (Max 7) */}
                      <td className="p-2 text-center bg-indigo-50/20">
                        <input
                          type="number"
                          min="0"
                          max="7"
                          disabled={isAbsent}
                          value={isAbsent ? '' : (assessment.gameProficiencyScore || '')}
                          placeholder="0-7"
                          onChange={e => updateScoreField(student, 'gameProficiencyScore', e.target.value)}
                          className="w-16 p-1.5 text-center font-black text-xs bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-100"
                        />
                      </td>

                      {/* Record File (Max 5) */}
                      <td className="p-2 text-center bg-indigo-50/10">
                        <input
                          type="number"
                          min="0"
                          max="5"
                          disabled={isAbsent}
                          value={isAbsent ? '' : (assessment.recordFileScore || '')}
                          placeholder="0-5"
                          onChange={e => updateScoreField(student, 'recordFileScore', e.target.value)}
                          className="w-16 p-1.5 text-center font-black text-xs bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-100"
                        />
                      </td>

                      {/* Viva Voce (Max 5) */}
                      <td className="p-2 text-center bg-indigo-50/20">
                        <div className="flex items-center justify-center gap-1">
                          <input
                            type="number"
                            min="0"
                            max="5"
                            disabled={isAbsent}
                            value={isAbsent ? '' : (assessment.vivaVoceScore || '')}
                            placeholder="0-5"
                            onChange={e => updateScoreField(student, 'vivaVoceScore', e.target.value)}
                            className="w-14 p-1.5 text-center font-black text-xs bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-100"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setVivaStudentTarget(student);
                              setShowVivaModal(true);
                            }}
                            className="p-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-lg transition-all cursor-pointer"
                            title="Open Viva Questions Helper"
                          >
                            <MessageSquare size={13} />
                          </button>
                        </div>
                      </td>

                      {/* Total Marks (/ 30) */}
                      <td className="p-3.5 text-center font-black text-sm text-slate-900 bg-slate-100/50">
                        {isAbsent ? (
                          <span className="text-rose-600 font-bold">AB</span>
                        ) : (
                          <span>{total} <span className="text-[10px] text-slate-400 font-normal">/30</span></span>
                        )}
                      </td>

                      {/* Grade Badge */}
                      <td className="p-3.5 text-center">
                        <span className={`px-2 py-0.5 rounded-md font-black text-[11px] border ${gradeInfo.color}`}>
                          {gradeInfo.grade}
                        </span>
                      </td>

                      {/* Quick Action */}
                      <td className="p-3.5 pr-5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => applyPresetForStudent(student, 'excellent')}
                            className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-md text-[10px] font-black uppercase transition-all cursor-pointer"
                            title="Set Full 30/30 Marks"
                          >
                            30M
                          </button>
                          <button
                            onClick={() => updateScoreField(student, 'status', isAbsent ? 'completed' : 'absent')}
                            className={`px-2 py-1 rounded-md text-[10px] font-black uppercase transition-all cursor-pointer ${
                              isAbsent ? 'bg-rose-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                            }`}
                            title="Toggle Absent Status"
                          >
                            {isAbsent ? 'Mark Present' : 'Absent'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* FIELD CARDS TOUCH MODE */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStudents.map((student, idx) => {
            const assessment = assessments[student.id] || {
              fitnessTestScore: 0,
              yogicPracticesScore: 0,
              gameProficiencyScore: 0,
              gameSelected: 'Basketball',
              yogaAsanasSelected: ['Bhujangasana (Cobra Pose)', 'Trikonasana (Triangle Pose)'],
              recordFileScore: 0,
              vivaVoceScore: 0,
              totalMarks: 0,
              status: 'draft'
            };

            const isAbsent = assessment.status === 'absent';
            const total = isAbsent ? 0 : (
              (assessment.fitnessTestScore || 0) +
              (assessment.yogicPracticesScore || 0) +
              (assessment.gameProficiencyScore || 0) +
              (assessment.recordFileScore || 0) +
              (assessment.vivaVoceScore || 0)
            );
            const gradeInfo = isAbsent ? { grade: 'AB', color: 'bg-rose-100 text-rose-800 border-rose-300' } : getCbseGradeBand(total);

            return (
              <div
                key={student.id}
                className="bg-white rounded-3xl p-5 border-2 border-slate-200 shadow-xs space-y-4 hover:border-indigo-300 transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-100">
                    <div>
                      <span className="text-[10px] font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                        Roll #{student.rollNumber || idx + 1}
                      </span>
                      <h4 className="text-base font-black text-slate-900 mt-1">{student.name}</h4>
                      <p className="text-xs text-slate-400 font-medium">Class {student.grade}-{student.section} &bull; {student.gender}</p>
                    </div>

                    <div className="text-right">
                      <span className={`px-2.5 py-1 rounded-lg font-black text-xs border ${gradeInfo.color}`}>
                        {gradeInfo.grade} ({total}/30)
                      </span>
                    </div>
                  </div>

                  {/* 5 Criteria Steppers */}
                  <div className="space-y-2.5 pt-3">
                    {/* Fitness (Max 7) */}
                    <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                      <div>
                        <span className="text-xs font-black text-slate-800">1. Physical Fitness</span>
                        <span className="text-[10px] text-slate-400 block font-bold">SAI KIFT Battery (Max 7)</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => updateScoreField(student, 'fitnessTestScore', Math.max(0, (assessment.fitnessTestScore || 0) - 1))}
                          className="w-7 h-7 bg-white hover:bg-slate-200 text-slate-700 rounded-lg flex items-center justify-center font-bold border border-slate-300 cursor-pointer"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="w-8 text-center font-black text-sm text-indigo-900">{assessment.fitnessTestScore || 0}</span>
                        <button
                          type="button"
                          onClick={() => updateScoreField(student, 'fitnessTestScore', Math.min(7, (assessment.fitnessTestScore || 0) + 1))}
                          className="w-7 h-7 bg-white hover:bg-slate-200 text-slate-700 rounded-lg flex items-center justify-center font-bold border border-slate-300 cursor-pointer"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                    </div>

                    {/* Yogic Practices (Max 7) */}
                    <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                      <div>
                        <span className="text-xs font-black text-slate-800">2. Yogic Practices</span>
                        <span className="text-[10px] text-slate-400 block font-bold">Asana Posture (Max 7)</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => updateScoreField(student, 'yogicPracticesScore', Math.max(0, (assessment.yogicPracticesScore || 0) - 1))}
                          className="w-7 h-7 bg-white hover:bg-slate-200 text-slate-700 rounded-lg flex items-center justify-center font-bold border border-slate-300 cursor-pointer"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="w-8 text-center font-black text-sm text-indigo-900">{assessment.yogicPracticesScore || 0}</span>
                        <button
                          type="button"
                          onClick={() => updateScoreField(student, 'yogicPracticesScore', Math.min(7, (assessment.yogicPracticesScore || 0) + 1))}
                          className="w-7 h-7 bg-white hover:bg-slate-200 text-slate-700 rounded-lg flex items-center justify-center font-bold border border-slate-300 cursor-pointer"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                    </div>

                    {/* Game Proficiency (Max 7) */}
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs font-black text-slate-800">3. Game Proficiency</span>
                          <span className="text-[10px] text-slate-400 block font-bold">Skills & Match Play (Max 7)</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => updateScoreField(student, 'gameProficiencyScore', Math.max(0, (assessment.gameProficiencyScore || 0) - 1))}
                            className="w-7 h-7 bg-white hover:bg-slate-200 text-slate-700 rounded-lg flex items-center justify-center font-bold border border-slate-300 cursor-pointer"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="w-8 text-center font-black text-sm text-indigo-900">{assessment.gameProficiencyScore || 0}</span>
                          <button
                            type="button"
                            onClick={() => updateScoreField(student, 'gameProficiencyScore', Math.min(7, (assessment.gameProficiencyScore || 0) + 1))}
                            className="w-7 h-7 bg-white hover:bg-slate-200 text-slate-700 rounded-lg flex items-center justify-center font-bold border border-slate-300 cursor-pointer"
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                      </div>

                      {/* Sport Selector */}
                      <select
                        value={assessment.gameSelected || 'Basketball'}
                        onChange={e => updateScoreField(student, 'gameSelected', e.target.value)}
                        className="w-full px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-[11px] font-bold text-slate-700 outline-none"
                      >
                        {CBSE_GAMES_LIST.map(g => (
                          <option key={g} value={g}>{g}</option>
                        ))}
                      </select>
                    </div>

                    {/* Record File (Max 5) */}
                    <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                      <div>
                        <span className="text-xs font-black text-slate-800">4. Record File</span>
                        <span className="text-[10px] text-slate-400 block font-bold">Fitness Log & Asanas (Max 5)</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => updateScoreField(student, 'recordFileScore', Math.max(0, (assessment.recordFileScore || 0) - 1))}
                          className="w-7 h-7 bg-white hover:bg-slate-200 text-slate-700 rounded-lg flex items-center justify-center font-bold border border-slate-300 cursor-pointer"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="w-8 text-center font-black text-sm text-indigo-900">{assessment.recordFileScore || 0}</span>
                        <button
                          type="button"
                          onClick={() => updateScoreField(student, 'recordFileScore', Math.min(5, (assessment.recordFileScore || 0) + 1))}
                          className="w-7 h-7 bg-white hover:bg-slate-200 text-slate-700 rounded-lg flex items-center justify-center font-bold border border-slate-300 cursor-pointer"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                    </div>

                    {/* Viva Voce (Max 5) */}
                    <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                      <div>
                        <span className="text-xs font-black text-slate-800">5. Viva Voce</span>
                        <span className="text-[10px] text-slate-400 block font-bold">Oral Questions (Max 5)</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setVivaStudentTarget(student);
                            setShowVivaModal(true);
                          }}
                          className="px-2 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-lg text-[10px] font-black uppercase flex items-center gap-1 cursor-pointer"
                          title="Generate Viva Questions"
                        >
                          <MessageSquare size={11} />
                          <span>Helper</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => updateScoreField(student, 'vivaVoceScore', Math.max(0, (assessment.vivaVoceScore || 0) - 1))}
                          className="w-7 h-7 bg-white hover:bg-slate-200 text-slate-700 rounded-lg flex items-center justify-center font-bold border border-slate-300 cursor-pointer"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="w-8 text-center font-black text-sm text-indigo-900">{assessment.vivaVoceScore || 0}</span>
                        <button
                          type="button"
                          onClick={() => updateScoreField(student, 'vivaVoceScore', Math.min(5, (assessment.vivaVoceScore || 0) + 1))}
                          className="w-7 h-7 bg-white hover:bg-slate-200 text-slate-700 rounded-lg flex items-center justify-center font-bold border border-slate-300 cursor-pointer"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Preset Actions Footer */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => applyPresetForStudent(student, 'excellent')}
                    className="flex-1 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-black text-[10px] uppercase rounded-lg transition-all cursor-pointer text-center"
                  >
                    Full 30M
                  </button>
                  <button
                    onClick={() => applyPresetForStudent(student, 'good')}
                    className="flex-1 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 font-black text-[10px] uppercase rounded-lg transition-all cursor-pointer text-center"
                  >
                    Good 26M
                  </button>
                  <button
                    onClick={() => updateScoreField(student, 'status', isAbsent ? 'completed' : 'absent')}
                    className={`px-2.5 py-1.5 font-black text-[10px] uppercase rounded-lg transition-all cursor-pointer ${
                      isAbsent ? 'bg-rose-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                    }`}
                  >
                    {isAbsent ? 'Present' : 'Absent'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Oral Viva Assistant Modal */}
      {showVivaModal && (
        <PracticalVivaAssistantModal
          student={vivaStudentTarget}
          selectedGame={vivaStudentTarget ? assessments[vivaStudentTarget.id]?.gameSelected : undefined}
          selectedAsanas={vivaStudentTarget ? assessments[vivaStudentTarget.id]?.yogaAsanasSelected : undefined}
          onClose={() => {
            setShowVivaModal(false);
            setVivaStudentTarget(null);
          }}
          onApplyScore={(score, notes) => {
            if (vivaStudentTarget) {
              updateScoreField(vivaStudentTarget, 'vivaVoceScore', score);
              if (notes) {
                const existing = assessments[vivaStudentTarget.id];
                if (existing) {
                  setAssessments(prev => ({
                    ...prev,
                    [vivaStudentTarget.id]: {
                      ...existing,
                      vivaNotes: notes
                    }
                  }));
                }
              }
            }
          }}
        />
      )}
    </div>
  );
};

export default PracticalAssessmentHub;
