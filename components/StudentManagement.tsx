
import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  MoreVertical, 
  Trash2, 
  Edit2, 
  UserPlus,
  FileUp,
  FileText,
  Download,
  Filter,
  Loader2,
  X,
  Sparkles,
  ChevronRight,
  Check,
  Printer,
  CheckSquare,
  Square,
  AlertTriangle,
  Activity,
  ClipboardCheck,
  Award,
  Zap,
  UserCheck,
  TrendingUp,
  LineChart
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { jsPDF } from 'jspdf';
import { fitnessService, Student, SchoolMember, FitnessResult } from '../services/fitnessService.ts';
import { PracticalAssessment, isBrandSuperAdmin } from '../types.ts';
import { isGradeMatching } from './PracticalAssessmentHub.tsx';
import { auth } from '../services/firebase.ts';
import { toast } from '../services/toast.ts';
import { calculateExactBMI } from '../utils/bmiUtils.ts';
import { IndividualStudentProfileModal } from './fitness/IndividualStudentProfileModal.tsx';

interface StudentManagementProps {
  onNavigate?: (tab: any) => void;
  onSelectStudent?: (id: string) => void;
  highlightStudentId?: string | null;
}

const StudentManagement: React.FC<StudentManagementProps> = ({ onNavigate, onSelectStudent, highlightStudentId }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [practicalMap, setPracticalMap] = useState<Record<string, PracticalAssessment>>({});
  const [resultCountMap, setResultCountMap] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [selectedSection, setSelectedSection] = useState<string>('all');
  const [isAdding, setIsAdding] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [userProfile, setUserProfile] = useState<SchoolMember | null>(null);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
  const [isGeneratingBulkPDF, setIsGeneratingBulkPDF] = useState(false);
  const [bulkProgressText, setBulkProgressText] = useState('');
  const [isDeleteAllModalOpen, setIsDeleteAllModalOpen] = useState(false);
  const [confirmDeleteText, setConfirmDeleteText] = useState('');
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [selectedProfileStudent, setSelectedProfileStudent] = useState<Student | null>(null);
  const [studentToPurge, setStudentToPurge] = useState<Student | null>(null);
  const [isDeletingBulk, setIsDeletingBulk] = useState(false);
  const [isBulkPurgeModalOpen, setIsBulkPurgeModalOpen] = useState(false);
  const [deleteProgressText, setDeleteProgressText] = useState('');
  const [seedingGrade12, setSeedingGrade12] = useState(false);
  const [seedingDemoSchool, setSeedingDemoSchool] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const isSuperAdmin = isBrandSuperAdmin(auth.currentUser?.email);
  const isAdmin = isSuperAdmin || userProfile?.role === 'admin';

  // Close predictive dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDownloadTemplate = () => {
    const csvContent = "Name,Roll Number,Grade,Section,Gender,Age\nJohn Doe,101,1,A,Male,6\nJane Smith,102,1,B,Female,6";
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "student_import_template_blank.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadSampleCsv = () => {
    const csvContent = 
`Name,Roll Number,Grade,Section,Gender,Age
Aarav Patel,501,5,A,Male,10
Ananya Sharma,502,5,A,Female,10
Kabir Roy,503,5,B,Male,11
Diya Iyer,801,8,A,Female,13
Rohan Gupta,802,8,A,Male,13
Ishita Sen,803,8,B,Female,14
Mohammed Farhan,1001,10,A,Male,15
Sneha Reddy,1002,10,A,Female,15
Vikram Joshi,1003,10,B,Male,16
Arjun Malhotra,1201,12,A,Male,17
Tanvi Nair,1202,12,A,Female,17
Kabir Dutt,1203,12,B,Male,18`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "smartpe_sample_students_dummy_data.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Downloaded sample CSV with 12 pre-filled students ready to import!");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !auth.currentUser) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim());
      
      const newStudents: Student[] = [];
      
      let schoolId = userProfile?.schoolId;
      if (!schoolId) {
        schoolId = isSuperAdmin ? 'master_registry' : `personal_${auth.currentUser?.uid}`;
      }
      
      // Skip header
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',');
        if (values.length < 6 || !auth.currentUser) continue;
        
        const student: Student = {
          id: Math.random().toString(36).substr(2, 9),
          name: values[0].trim(),
          rollNumber: values[1].trim(),
          grade: values[2].trim(),
          section: values[3].trim(),
          gender: values[4].trim() as any,
          age: parseInt(values[5].trim()) || 6,
          teacherId: auth.currentUser?.uid || 'temp',
          schoolId: schoolId,
          attendance: 0,
          performance: 'Average'
        };
        newStudents.push(student);
      }

      if (newStudents.length > 0) {
        setLoading(true);
        try {
          await fitnessService.bulkSaveStudents(newStudents);
          alert(`Successfully imported ${newStudents.length} students.`);
          setIsImporting(false);
        } catch (err) {
          console.error(err);
          alert('Failed to import students. Check file format.');
        } finally {
          setLoading(false);
        }
      }
    };
    reader.readAsText(file);
  };
  const [newStudent, setNewStudent] = useState<Partial<Student>>({
    name: '',
    rollNumber: '',
    grade: '1',
    section: 'A',
    gender: 'Male',
    age: 6
  });

  useEffect(() => {
    let unsubStudents: (() => void) | undefined;
    let unsubPractical: (() => void) | undefined;
    let unsubResults: (() => void) | undefined;

    const fetchProfileAndStudents = async () => {
      if (!auth.currentUser) {
        setLoading(false);
        return;
      }

      try {
        const profile = await fitnessService.getSchoolMember(auth.currentUser.uid);
        setUserProfile(profile);

        const isAdmin = profile?.role === 'admin' || isSuperAdmin;
        const schoolId = profile?.schoolId;

        // Subscribe to students (Super Admin will get all via service logic)
        unsubStudents = fitnessService.subscribeToStudents(
          auth.currentUser.uid,
          schoolId,
          isAdmin,
          (data) => {
            setStudents(data);
            setLoading(false);
          }
        );

        // Subscribe to practical assessments to show 30M board status
        unsubPractical = fitnessService.subscribeToPracticalAssessments(
          auth.currentUser.uid,
          schoolId,
          (data) => {
            const map: Record<string, PracticalAssessment> = {};
            data.forEach(p => { map[p.studentId] = p; });
            setPracticalMap(map);
          }
        );

        // Subscribe to fitness results to show test battery completion
        unsubResults = fitnessService.subscribeToResults(
          auth.currentUser.uid,
          schoolId,
          isAdmin,
          (resList) => {
            const countMap: Record<string, number> = {};
            resList.forEach(r => {
              countMap[r.studentId] = (countMap[r.studentId] || 0) + 1;
            });
            setResultCountMap(countMap);
          }
        );
      } catch (err) {
        console.error("Error in StudentManagement data fetch:", err);
        setLoading(false);
      }
    };

    fetchProfileAndStudents().catch(err => console.error("Unhandled error in StudentManagement fetch:", err));
    
    return () => {
      unsubStudents?.();
      unsubPractical?.();
      unsubResults?.();
    };
  }, [auth.currentUser?.uid]);

  useEffect(() => {
    if (highlightStudentId && students.length > 0) {
      const student = students.find(s => s.id === highlightStudentId);
      if (student) {
        setSearchTerm(student.name);
      }
    }
  }, [highlightStudentId, students]);

  const handleDeleteStudent = async (studentId: string) => {
    if (!isAdmin) {
      toast.error('Only school administrators can delete student records.');
      return;
    }
    if (!auth.currentUser) return;

    setLoading(true);
    try {
      await fitnessService.deleteStudent(studentId, userProfile?.schoolId);
      toast.success("Student and all associated fitness records permanently purged.");
      setStudentToPurge(null);
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to delete student: " + formatErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const formatFitnessError = (err: any): string => {
    try {
      const parsed = JSON.parse(err.message);
      if (parsed.error) {
        if (parsed.error.includes('permission') || parsed.error.includes('insufficient')) {
          return "Access denied. Check if your school profile is properly registered.";
        }
        return `Error: ${parsed.error}`;
      }
    } catch (e) {}
    return err.message || "An unexpected error occurred.";
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudent.name || !newStudent.rollNumber || !auth.currentUser) {
      alert('Please ensure you are logged in.');
      return;
    }

    try {
      let schoolId = userProfile?.schoolId;
      if (!schoolId) {
        schoolId = isSuperAdmin ? 'master_registry' : `personal_${auth.currentUser?.uid}`;
      }

      const student: Student = {
        ...newStudent as Student,
        id: Math.random().toString(36).substr(2, 9),
        teacherId: auth.currentUser.uid,
        schoolId: schoolId,
        attendance: 0,
        performance: 'Average'
      };

      await fitnessService.saveStudent(student);
      setIsAdding(false);
      setNewStudent({
        name: '',
        rollNumber: '',
        grade: '1',
        section: 'A',
        gender: 'Male',
        age: 6
      });
    } catch (err: any) {
      console.error(err);
      alert(formatFitnessError(err));
    }
  };

  const formatErrorMessage = (err: any) => {
    if (!err) return 'An unknown error occurred.';
    const msg = err.message || String(err);
    try {
      const parsed = JSON.parse(msg);
      if (parsed && parsed.error) {
        return parsed.error;
      }
    } catch {
      // Not JSON
    }
    return msg;
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this student?')) {
      try {
        await fitnessService.deleteStudent(id, userProfile?.schoolId);
        toast.success('Student deleted successfully.');
      } catch (err) {
        console.error(err);
        toast.error('Failed to delete student: ' + formatErrorMessage(err));
      }
    }
  };

  // Standard CBSE Grades (1 to 12) merged with any existing student grades
  const standardGrades = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
  const availableGrades = Array.from(new Set([...standardGrades, ...students.map(s => s.grade.toString().trim())])).sort((a, b) => {
    const numA = parseInt(a.replace(/[^0-9]/g, '')) || 0;
    const numB = parseInt(b.replace(/[^0-9]/g, '')) || 0;
    return numA - numB;
  });

  const availableSections = Array.from(new Set(students.map(s => s.section))).sort();

  // Helper to highlight matching text substrings
  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text;
    const trimmedQuery = query.trim();
    const parts = text.split(new RegExp(`(${trimmedQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) => 
          part.toLowerCase() === trimmedQuery.toLowerCase() ? (
            <mark key={i} className="bg-amber-200 text-slate-900 font-extrabold rounded px-1 py-0.5">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </span>
    );
  };

  const filteredStudents = students.filter(s => {
    const matchesSearch = !searchTerm.trim() || 
      s.name.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
      s.rollNumber.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
      s.grade.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
      s.section.toLowerCase().includes(searchTerm.toLowerCase().trim());

    const matchesGrade = selectedGrade === 'all' || isGradeMatching(s.grade, selectedGrade);
    const matchesSection = selectedSection === 'all' || s.section === selectedSection;

    return matchesSearch && matchesGrade && matchesSection;
  });

  const handleSeedGrade12Batch = async () => {
    setSeedingGrade12(true);
    try {
      const currentTeacherId = auth.currentUser?.uid || 'guest_teacher';
      const schoolId = userProfile?.schoolId || (auth.currentUser ? `personal_${auth.currentUser.uid}` : 'master_registry');

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

  const handleSeedDemoSchoolAndStudents = async () => {
    if (seedingDemoSchool) return;
    setSeedingDemoSchool(true);
    try {
      const currentTeacherId = auth.currentUser?.uid || 'guest_teacher';
      const schoolId = userProfile?.schoolId || (auth.currentUser ? `personal_${auth.currentUser.uid}` : 'master_registry');

      const demoStudents: Student[] = [
        // Primary - Class 5
        { id: `demo_501_${Date.now()}`, rollNumber: '501', name: 'Aarav Patel', grade: '5', section: 'A', gender: 'Male', age: 10, schoolId, teacherId: currentTeacherId, attendance: 95, performance: 'Excellent' },
        { id: `demo_502_${Date.now()}`, rollNumber: '502', name: 'Ananya Sharma', grade: '5', section: 'A', gender: 'Female', age: 10, schoolId, teacherId: currentTeacherId, attendance: 92, performance: 'Good' },
        { id: `demo_503_${Date.now()}`, rollNumber: '503', name: 'Kabir Roy', grade: '5', section: 'B', gender: 'Male', age: 11, schoolId, teacherId: currentTeacherId, attendance: 88, performance: 'Good' },

        // Middle - Class 8
        { id: `demo_801_${Date.now()}`, rollNumber: '801', name: 'Diya Iyer', grade: '8', section: 'A', gender: 'Female', age: 13, schoolId, teacherId: currentTeacherId, attendance: 96, performance: 'Excellent' },
        { id: `demo_802_${Date.now()}`, rollNumber: '802', name: 'Rohan Gupta', grade: '8', section: 'A', gender: 'Male', age: 13, schoolId, teacherId: currentTeacherId, attendance: 90, performance: 'Good' },
        { id: `demo_803_${Date.now()}`, rollNumber: '803', name: 'Ishita Sen', grade: '8', section: 'B', gender: 'Female', age: 14, schoolId, teacherId: currentTeacherId, attendance: 94, performance: 'Excellent' },

        // Secondary - Class 10
        { id: `demo_1001_${Date.now()}`, rollNumber: '1001', name: 'Mohammed Farhan', grade: '10', section: 'A', gender: 'Male', age: 15, schoolId, teacherId: currentTeacherId, attendance: 91, performance: 'Good' },
        { id: `demo_1002_${Date.now()}`, rollNumber: '1002', name: 'Sneha Reddy', grade: '10', section: 'A', gender: 'Female', age: 15, schoolId, teacherId: currentTeacherId, attendance: 97, performance: 'Excellent' },
        { id: `demo_1003_${Date.now()}`, rollNumber: '1003', name: 'Vikram Joshi', grade: '10', section: 'B', gender: 'Male', age: 16, schoolId, teacherId: currentTeacherId, attendance: 86, performance: 'Average' },

        // Senior CBSE - Class 12
        { id: `demo_1201_${Date.now()}`, rollNumber: '1201', name: 'Arjun Malhotra', grade: '12', section: 'A', gender: 'Male', age: 17, schoolId, teacherId: currentTeacherId, attendance: 95, performance: 'Excellent' },
        { id: `demo_1202_${Date.now()}`, rollNumber: '1202', name: 'Tanvi Nair', grade: '12', section: 'A', gender: 'Female', age: 17, schoolId, teacherId: currentTeacherId, attendance: 98, performance: 'Excellent' },
        { id: `demo_1203_${Date.now()}`, rollNumber: '1203', name: 'Kabir Dutt', grade: '12', section: 'B', gender: 'Male', age: 18, schoolId, teacherId: currentTeacherId, attendance: 89, performance: 'Good' },
      ];

      // Save student roster
      await fitnessService.bulkSaveStudents(demoStudents);

      // Create multi-term test scores for all demo students
      const demoResults: FitnessResult[] = [];
      const testBatteries = [
        { testId: 'bmi', testName: 'BMI (Height & Weight)', unit: 'kg/m²', valB: 18.2, valT1: 18.6 },
        { testId: 'sprint_50m', testName: '50m Sprint Speed', unit: 'sec', valB: 9.6, valT1: 9.0 },
        { testId: 'run_600m', testName: '600m Endurance Run', unit: 'min:sec', valB: '3:15', valT1: '2:58' },
        { testId: 'sit_reach', testName: 'Sit & Reach Flexibility', unit: 'cm', valB: 14, valT1: 17 },
        { testId: 'broad_jump', testName: 'Standing Broad Jump', unit: 'cm', valB: 142, valT1: 156 },
        { testId: 'shuttle_4x10', testName: '4×10m Shuttle Run', unit: 'sec', valB: 13.8, valT1: 12.9 },
      ];

      for (const st of demoStudents) {
        const ageOffset = (st.age - 10) * 0.1;
        for (const tb of testBatteries) {
          let valBStr = String(tb.valB);
          let valT1Str = String(tb.valT1);
          if (typeof tb.valB === 'number' && typeof tb.valT1 === 'number') {
            const numB = (tb.valB + (st.gender === 'Male' ? 0.3 : -0.2) + ageOffset).toFixed(1);
            const numT1 = (tb.valT1 + (st.gender === 'Male' ? 0.3 : -0.2) + ageOffset).toFixed(1);
            valBStr = numB;
            valT1Str = numT1;
          }

          demoResults.push({
            id: `${st.id}_${tb.testId}_baseline`,
            teacherId: currentTeacherId,
            schoolId,
            studentId: st.id,
            testId: tb.testId,
            testName: tb.testName,
            value: valBStr,
            unit: tb.unit,
            date: '2024-09-12',
            term: 'Baseline',
            rating: 'Average'
          });

          demoResults.push({
            id: `${st.id}_${tb.testId}_term1`,
            teacherId: currentTeacherId,
            schoolId,
            studentId: st.id,
            testId: tb.testId,
            testName: tb.testName,
            value: valT1Str,
            unit: tb.unit,
            date: '2024-12-15',
            term: 'Term 1',
            rating: 'Good'
          });
        }
      }

      await Promise.all(demoResults.map(r => fitnessService.saveResult(r)));

      // Save CBSE Practical 30-mark assessments for Class 12 students
      const grade12Students = demoStudents.filter(s => s.grade === '12');
      for (const g12 of grade12Students) {
        await fitnessService.savePracticalAssessment({
          id: `practical_${g12.id}`,
          studentId: g12.id,
          studentName: g12.name,
          rollNumber: g12.rollNumber,
          grade: g12.grade,
          section: g12.section,
          gender: g12.gender,
          academicYear: '2024-25',
          examType: 'CBSE Board Practical Final',
          schoolId,
          teacherId: currentTeacherId,
          date: '2025-01-20',
          fitnessTestScore: 6,
          yogicPracticesScore: 6,
          gameProficiencyScore: 7,
          recordFileScore: 4,
          vivaVoceScore: 4,
          totalMarks: 27,
          totalMarksInWords: 'Twenty Seven',
          examinerRemarks: 'Exemplary physical aptitude, consistent leadership in games, and fluent viva responses.',
          status: 'completed'
        });
      }

      setSelectedGrade('all');
      toast.success('Successfully populated 12 sample students across Classes 5, 8, 10 & 12 with Baseline & Term 1 Fitness Test results & CBSE Practicals!');
    } catch (e) {
      console.error(e);
      toast.error('Failed to seed demo school data');
    } finally {
      setSeedingDemoSchool(false);
    }
  };

  // Top predictive suggestions for dropdown
  const predictiveSuggestions = searchTerm.trim()
    ? students
        .filter(s => 
          s.name.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
          s.rollNumber.toLowerCase().includes(searchTerm.toLowerCase().trim())
        )
        .slice(0, 6)
    : [];

  // Bulk selection helper handlers
  const toggleSelectStudent = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedStudentIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAllFiltered = () => {
    const filteredIds = filteredStudents.map(s => s.id);
    const allSelected = filteredIds.length > 0 && filteredIds.every(id => selectedStudentIds.has(id));

    setSelectedStudentIds(prev => {
      const next = new Set(prev);
      if (allSelected) {
        filteredIds.forEach(id => next.delete(id));
      } else {
        filteredIds.forEach(id => next.add(id));
      }
      return next;
    });
  };

  const handleClearSelection = () => {
    setSelectedStudentIds(new Set());
  };

  // Bulk PDF Generation Handler
  const handleGenerateBulkPDF = async () => {
    const selectedList = students.filter(s => selectedStudentIds.has(s.id));
    if (selectedList.length === 0) {
      toast.error('Please select at least one student to print fitness report cards.');
      return;
    }

    setIsGeneratingBulkPDF(true);
    setBulkProgressText(`Fetching fitness records for ${selectedList.length} students...`);

    try {
      let allResults: FitnessResult[] = [];
      if (auth.currentUser) {
        const teacherId = auth.currentUser.uid;
        const schoolId = userProfile?.schoolId || (isSuperAdmin ? 'master_registry' : `personal_${teacherId}`);
        allResults = await fitnessService.getAllSchoolResultsOnce(teacherId, schoolId, userProfile?.role === 'admin' || isSuperAdmin);
      }

      // Group results by studentId
      const resultsByStudent = new Map<string, FitnessResult[]>();
      allResults.forEach(r => {
        if (!resultsByStudent.has(r.studentId)) {
          resultsByStudent.set(r.studentId, []);
        }
        resultsByStudent.get(r.studentId)!.push(r);
      });

      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = doc.internal.pageSize.getWidth(); // 210
      const pageHeight = doc.internal.pageSize.getHeight(); // 297
      const margin = 12;
      const contentWidth = pageWidth - (margin * 2); // 186

      const schoolName = userProfile?.schoolName || (isSuperAdmin ? 'CBSE SMART PE MASTER ACADEMY' : 'CBSE AFFILIATED PE DEPARTMENT');

      selectedList.forEach((student, index) => {
        setBulkProgressText(`Generating Report Card ${index + 1} of ${selectedList.length}: ${student.name}...`);

        if (index > 0) {
          doc.addPage();
        }

        const studentResults = resultsByStudent.get(student.id) || [];

        // Render Outer Border
        doc.setLineWidth(0.6);
        doc.setDrawColor(30, 27, 75); // Deep Indigo
        doc.rect(margin - 2, margin - 2, contentWidth + 4, pageHeight - (margin * 2) + 4);

        doc.setLineWidth(0.2);
        doc.setDrawColor(203, 213, 225); // Slate 300
        doc.rect(margin, margin, contentWidth, pageHeight - (margin * 2));

        let currentY = margin + 4;

        // Header Banner
        doc.setFillColor(30, 27, 75); // Deep Navy
        doc.rect(margin, currentY, contentWidth, 24, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text('CENTRAL BOARD OF SECONDARY EDUCATION (CBSE)', pageWidth / 2, currentY + 7, { align: 'center' });

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('KHELO INDIA FITNESS TEST (KIFT) - INDIVIDUAL REPORT CARD', pageWidth / 2, currentY + 13, { align: 'center' });

        doc.setFontSize(8);
        doc.setTextColor(224, 231, 255);
        doc.text(`${schoolName.toUpperCase()} | SESSION: 2025-26 | OFFICIAL FITNESS COMPLIANCE`, pageWidth / 2, currentY + 19, { align: 'center' });

        currentY += 28;

        // Student Profile Header Box
        doc.setFillColor(248, 250, 252);
        doc.rect(margin, currentY, contentWidth, 26, 'F');
        doc.setDrawColor(226, 232, 240);
        doc.rect(margin, currentY, contentWidth, 26, 'S');

        doc.setTextColor(30, 41, 59);
        doc.setFontSize(9);

        // Row 1
        doc.setFont('helvetica', 'bold');
        doc.text('Student Name:', margin + 4, currentY + 7);
        doc.setFont('helvetica', 'normal');
        doc.text(student.name, margin + 28, currentY + 7);

        doc.setFont('helvetica', 'bold');
        doc.text('Roll Number:', margin + 98, currentY + 7);
        doc.setFont('helvetica', 'normal');
        doc.text(student.rollNumber, margin + 120, currentY + 7);

        doc.setFont('helvetica', 'bold');
        doc.text('Class & Sec:', margin + 148, currentY + 7);
        doc.setFont('helvetica', 'normal');
        doc.text(`${student.grade} - ${student.section}`, margin + 168, currentY + 7);

        // Row 2
        doc.setFont('helvetica', 'bold');
        doc.text('Age / Gender:', margin + 4, currentY + 15);
        doc.setFont('helvetica', 'normal');
        doc.text(`${student.age} Yrs / ${student.gender}`, margin + 28, currentY + 15);

        doc.setFont('helvetica', 'bold');
        doc.text('Date of Issue:', margin + 98, currentY + 15);
        doc.setFont('helvetica', 'normal');
        doc.text(new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }), margin + 120, currentY + 15);

        doc.setFont('helvetica', 'bold');
        doc.text('CBSE Battery:', margin + 148, currentY + 15);
        doc.setFont('helvetica', 'normal');
        const battery = fitnessService.getBatteryForGrade(student.grade);
        doc.text(battery ? battery.category : 'General PE Battery', margin + 170, currentY + 15);

        // Row 3
        doc.setFont('helvetica', 'bold');
        doc.text('HPE Status:', margin + 4, currentY + 22);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(16, 185, 129);
        doc.text('Compliant with CBSE Health & Physical Education (HPE) Mainstream Guidelines', margin + 28, currentY + 22);

        currentY += 32;

        // Results Table Header
        doc.setFillColor(49, 46, 129); // Indigo 900
        doc.rect(margin, currentY, contentWidth, 8, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);

        doc.text('S.NO', margin + 3, currentY + 5.5);
        doc.text('FITNESS TEST PARAMETER', margin + 14, currentY + 5.5);
        doc.text('TERM / PHASE', margin + 74, currentY + 5.5);
        doc.text('SCORE / VALUE', margin + 104, currentY + 5.5);
        doc.text('CBSE RATING / LEVEL', margin + 145, currentY + 5.5);

        currentY += 8;

        let displayRows: { name: string; term: string; score: string; rating: string }[] = [];

        if (studentResults.length > 0) {
          displayRows = studentResults.map(r => {
            let scoreText = `${r.value} ${r.unit || ''}`.trim();
            let ratingText = r.rating || 'Recorded';

            if (r.testId === 'bmi' || r.testName.toLowerCase().includes('bmi')) {
              const bmiRes = calculateExactBMI(r.value);
              scoreText = bmiRes.formattedDisplay || `${bmiRes.bmi} kg/m²`;
              ratingText = bmiRes.category;
            }

            return {
              name: r.testName,
              term: r.term || 'Baseline',
              score: scoreText,
              rating: ratingText
            };
          });
        } else {
          const defaultBatteryTests = battery ? battery.tests : [
            { name: 'Body Mass Index (BMI)', unit: 'kg/m²' },
            { name: '50m Dash Sprint', unit: 'sec' },
            { name: '600m Run / Walk', unit: 'min:sec' },
            { name: 'Sit & Reach Flexibility', unit: 'cm' },
            { name: 'Partial Curl-up Core Test', unit: 'reps' },
            { name: 'Flexed Arm Hang Upper Body', unit: 'sec' }
          ];

          displayRows = defaultBatteryTests.map(t => ({
            name: t.name,
            term: 'Baseline',
            score: 'Pending Assessment',
            rating: 'Needs Assessment'
          }));
        }

        doc.setFontSize(8);

        displayRows.forEach((row, rIdx) => {
          const isEven = rIdx % 2 === 0;
          doc.setFillColor(isEven ? 255 : 248, isEven ? 255 : 250, isEven ? 255 : 252);
          doc.rect(margin, currentY, contentWidth, 8, 'F');
          doc.setDrawColor(226, 232, 240);
          doc.rect(margin, currentY, contentWidth, 8, 'S');

          doc.setTextColor(51, 65, 85);

          // S.No
          doc.setFont('helvetica', 'normal');
          doc.text(String(rIdx + 1), margin + 4, currentY + 5.5);

          // Name
          doc.setFont('helvetica', 'bold');
          doc.text(row.name.length > 30 ? row.name.substring(0, 28) + '...' : row.name, margin + 14, currentY + 5.5);

          // Term
          doc.setFont('helvetica', 'normal');
          doc.text(row.term, margin + 74, currentY + 5.5);

          // Score
          doc.setFont('helvetica', 'bold');
          doc.text(row.score, margin + 104, currentY + 5.5);

          // Rating
          if (row.rating.includes('Normal') || row.rating.includes('Excellent') || row.rating.includes('Elite')) {
            doc.setTextColor(21, 128, 61);
          } else if (row.rating.includes('Satisfactory') || row.rating.includes('Good')) {
            doc.setTextColor(3, 105, 161);
          } else if (row.rating.includes('Underweight') || row.rating.includes('Overweight') || row.rating.includes('Obese') || row.rating.includes('Needs')) {
            doc.setTextColor(185, 28, 28);
          } else {
            doc.setTextColor(71, 85, 105);
          }

          doc.setFont('helvetica', 'bold');
          doc.text(row.rating, margin + 145, currentY + 5.5);

          currentY += 8;
        });

        currentY += 4;

        // PE Teacher Guidance Box
        doc.setFillColor(238, 242, 255);
        doc.rect(margin, currentY, contentWidth, 30, 'F');
        doc.setDrawColor(199, 210, 254);
        doc.rect(margin, currentY, contentWidth, 30, 'S');

        doc.setTextColor(49, 46, 129);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.text("PHYSICAL EDUCATION TEACHER'S ASSESSMENT & GUIDANCE", margin + 4, currentY + 6);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(30, 41, 59);

        const bmiResult = studentResults.find(r => r.testId === 'bmi' || r.testName.toLowerCase().includes('bmi'));
        let guidanceText = `${student.name} demonstrates active participation in daily Physical Education activities. Recommended to maintain 30 minutes of daily active outdoor games, structured stretching, and hydration as mandated under CBSE HPE Strand 1 guidelines.`;

        if (bmiResult) {
          const bmiRes = calculateExactBMI(bmiResult.value);
          guidanceText = `${student.name}: ${bmiRes.details} Regular participation in CBSE Khelo India physical fitness drills is advised.`;
        }

        const splitText = doc.splitTextToSize(guidanceText, contentWidth - 8);
        doc.text(splitText, margin + 4, currentY + 13);

        currentY += 36;

        // CBSE Performance Descriptors
        doc.setFillColor(248, 250, 252);
        doc.rect(margin, currentY, contentWidth, 18, 'F');
        doc.setDrawColor(226, 232, 240);
        doc.rect(margin, currentY, contentWidth, 18, 'S');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(71, 85, 105);
        doc.text("CBSE KIFT PERFORMANCE BENCHMARKS & NORMS:", margin + 4, currentY + 5);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.text("• Normal Weight (BMI 14.0 - 22.0 kg/m²): Optimal physical stature for child development.", margin + 4, currentY + 9);
        doc.text("• Excellent / Satisfactory: Standard physical endurance meeting national Khelo India benchmarks.", margin + 4, currentY + 13);
        doc.text("• Needs Improvement: Focus area requiring guided physical training & structured activity.", margin + 4, currentY + 17);

        currentY += 24;

        // Signatures
        doc.setDrawColor(203, 213, 225);
        doc.setLineWidth(0.3);

        const colW = contentWidth / 3;

        // Sig 1
        doc.line(margin + 6, currentY + 16, margin + colW - 6, currentY + 16);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(30, 41, 59);
        doc.text("Physical Education Teacher", margin + colW / 2, currentY + 20, { align: 'center' });
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.text("Signature & Date", margin + colW / 2, currentY + 24, { align: 'center' });

        // Sig 2
        doc.line(margin + colW + 6, currentY + 16, margin + (colW * 2) - 6, currentY + 16);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.text("Class Teacher", margin + (colW * 1.5), currentY + 20, { align: 'center' });
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.text("Signature & Remarks", margin + (colW * 1.5), currentY + 24, { align: 'center' });

        // Sig 3
        doc.line(margin + (colW * 2) + 6, currentY + 16, margin + contentWidth - 6, currentY + 16);
        doc.setFont('helvetica', 'bold');
        doc.text("Principal / Headmaster", margin + (colW * 2.5), currentY + 20, { align: 'center' });
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.text("Signature & School Seal", margin + (colW * 2.5), currentY + 24, { align: 'center' });

        // Footer
        doc.setFontSize(7);
        doc.setTextColor(100, 116, 139);
        doc.text("Generated via SmartPE India • CBSE Mainstreaming Health & Physical Education System", pageWidth / 2, pageHeight - margin - 3, { align: 'center' });
      });

      const gradeSuffix = selectedGrade !== 'all' ? `_Grade${selectedGrade}` : '';
      const fileName = `CBSE_Bulk_Fitness_Reports${gradeSuffix}_${selectedList.length}_Students.pdf`;
      doc.save(fileName);

      toast.success(`Bulk PDF generated successfully! ${selectedList.length} student report cards compiled.`);
    } catch (error: any) {
      console.error('Bulk PDF Generation Error:', error);
      toast.error('Failed to generate bulk PDF: ' + (error?.message || 'Unknown error'));
    } finally {
      setIsGeneratingBulkPDF(false);
      setBulkProgressText('');
    }
  };

  const handleUpdateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    try {
      await fitnessService.saveStudent(editingStudent);
      toast.success(`Updated details for ${editingStudent.name}.`);
      setEditingStudent(null);
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to update student: ' + formatErrorMessage(err));
    }
  };

  // Bulk Delete / Purge Selected Students
  const handleDeleteSelectedStudents = async () => {
    if (!isAdmin) {
      toast.error('Only school administrators can delete student records.');
      return;
    }
    const selectedList = students.filter(s => selectedStudentIds.has(s.id));
    if (selectedList.length === 0) return;

    setIsDeletingBulk(true);
    setDeleteProgressText(`Purging 0 of ${selectedList.length} selected student(s)...`);

    try {
      const selectedIds = Array.from(selectedStudentIds);
      await fitnessService.bulkDeleteStudents(selectedIds, userProfile?.schoolId, (processed, total) => {
        setDeleteProgressText(`Purging ${processed} of ${total} selected student(s)...`);
      });
      toast.success(`Successfully purged ${selectedList.length} student(s) and their fitness test records.`);
      setSelectedStudentIds(new Set());
      setIsBulkPurgeModalOpen(false);
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to delete selected students: ' + formatErrorMessage(err));
    } finally {
      setIsDeletingBulk(false);
      setDeleteProgressText('');
    }
  };

  // Delete All / Purge Entire School Roster
  const handleDeleteAllStudents = async () => {
    if (!isAdmin) {
      toast.error('Only school administrators can purge school records.');
      return;
    }
    if (students.length === 0) {
      toast.error('There are no students to delete.');
      return;
    }

    const normalizedInput = confirmDeleteText.trim().toUpperCase();
    if (normalizedInput !== 'DELETE ALL' && normalizedInput !== 'PURGE' && normalizedInput !== 'PURGE ALL') {
      toast.error('Please type "PURGE" or "DELETE ALL" to confirm permanently clearing the school database.');
      return;
    }

    setIsDeletingBulk(true);
    const totalCount = students.length;
    setDeleteProgressText(`Purging 0 of ${totalCount} student records and scores...`);

    try {
      const allIds = students.map(s => s.id);
      await fitnessService.bulkDeleteStudents(allIds, userProfile?.schoolId, (processed, total) => {
        setDeleteProgressText(`Purging ${processed} of ${total} student records...`);
      });
      toast.success(`Successfully purged all ${totalCount} student records and test history from the school database.`);
      setSelectedStudentIds(new Set());
      setIsDeleteAllModalOpen(false);
      setConfirmDeleteText('');
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to clear school roster: ' + formatErrorMessage(err));
    } finally {
      setIsDeletingBulk(false);
      setDeleteProgressText('');
    }
  };

  if (loading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tighter">Student Directory</h2>
          <p className="text-slate-500 font-medium">Manage student profiles, search records instantly, and track class & section statistics.</p>
        </div>
        <div className="flex items-center gap-3">
          {students.length > 0 && isAdmin && (
            <button 
              onClick={() => {
                setConfirmDeleteText('');
                setIsDeleteAllModalOpen(true);
              }}
              className="px-5 py-3 bg-rose-50 text-rose-700 border-2 border-rose-900 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-rose-100 transition-all shadow-[4px_4px_0px_0px_rgba(159,18,57,1)] flex items-center gap-2"
              title="Delete all student records in school roster (Admin Only)"
            >
              <Trash2 size={16} />
              <span className="hidden sm:inline">Delete All Students</span>
            </button>
          )}
          <button 
            onClick={handleSeedDemoSchoolAndStudents}
            disabled={seedingDemoSchool}
            className="px-5 py-3 bg-[#0D2B52] hover:bg-[#164077] text-[#D4A017] border-2 border-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            title="Populate 12 sample students across Classes 5, 8, 10, 12 with full multi-term fitness results and CBSE practicals"
          >
            {seedingDemoSchool ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            <span>⚡ Seed Demo School (12 Students)</span>
          </button>
          <button 
            onClick={() => setIsImporting(true)}
            className="px-6 py-3 bg-white border-2 border-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] flex items-center gap-2"
          >
            <FileUp size={16} />
            <span>Import Student Data</span>
          </button>
          <button 
            onClick={() => setIsAdding(true)}
            className="px-6 py-3 bg-indigo-600 text-white border-2 border-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] flex items-center gap-2"
          >
            <UserPlus size={16} />
            <span>Add Student</span>
          </button>
        </div>
      </div>

      {/* Database Isolation Architecture Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white px-6 py-3.5 rounded-2xl border-2 border-slate-900 flex flex-wrap items-center justify-between gap-3 text-xs shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400/50" />
          <span className="font-bold text-slate-200">
            Database Architecture: <strong className="text-white">Strict Three-Way Collection Isolation</strong>
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 text-[11px] font-medium text-indigo-200">
          <span className="bg-white/10 px-3 py-1 rounded-lg border border-white/10">👤 Student Roster: <code className="text-amber-300 font-mono font-bold">students</code></span>
          <span className="bg-white/10 px-3 py-1 rounded-lg border border-white/10">🏃 Fitness Tests: <code className="text-amber-300 font-mono font-bold">results</code></span>
          <span className="bg-white/10 px-3 py-1 rounded-lg border border-white/10">📝 CBSE Practical (30M): <code className="text-emerald-300 font-mono font-bold">practical_assessments</code></span>
        </div>
      </div>

      {/* Directory Overview Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border-2 border-slate-900 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-black">
            <Users size={22} />
          </div>
          <div>
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total School Roster</div>
            <div className="text-2xl font-black text-slate-900">{students.length} Students</div>
            <div className="text-[11px] font-bold text-slate-500">Entire school database</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border-2 border-slate-900 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black">
            <Filter size={22} />
          </div>
          <div>
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Classes & Sections</div>
            <div className="text-2xl font-black text-slate-900">{availableGrades.length} Grades • {availableSections.length || 1} Sections</div>
            <div className="text-[11px] font-bold text-slate-500">Standard CBSE Grade range</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border-2 border-slate-900 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-black">
            <CheckSquare size={22} />
          </div>
          <div>
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Current View Selection</div>
            <div className="text-2xl font-black text-slate-900">{filteredStudents.length} Students</div>
            <div className="text-[11px] font-bold text-slate-500">
              {selectedGrade === 'all' ? 'All Classes' : `Grade ${selectedGrade}`} {selectedSection === 'all' ? '' : `• Sec ${selectedSection}`}
            </div>
          </div>
        </div>
      </div>

      {/* Predictive Search & Filter Bar */}
      <div className="bg-white p-6 rounded-[2rem] border-2 border-slate-900 space-y-4 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center">
          {/* Main Predictive Input Box with Dropdown */}
          <div className="flex-1 relative" ref={searchContainerRef}>
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-600" size={20} />
            <input 
              type="text" 
              placeholder="Predictive Search by name or roll number (e.g. 'Aarav', '101')..." 
              className="w-full pl-12 pr-12 py-4 bg-slate-50 border-2 border-slate-200 focus:border-indigo-600 rounded-2xl font-bold outline-none text-slate-800 placeholder-slate-400 transition-all text-sm md:text-base shadow-inner"
              value={searchTerm}
              onChange={e => {
                setSearchTerm(e.target.value);
                setIsSearchFocused(true);
              }}
              onFocus={() => setIsSearchFocused(true)}
              onKeyDown={e => {
                if (e.key === 'Escape') setIsSearchFocused(false);
              }}
            />
            {searchTerm && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setIsSearchFocused(false);
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 hover:bg-slate-200 rounded-xl text-slate-500 transition-colors"
                title="Clear Search"
              >
                <X size={16} />
              </button>
            )}

            {/* Predictive Auto-Suggest Dropdown Menu */}
            <AnimatePresence>
              {isSearchFocused && searchTerm.trim().length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.98 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl border-2 border-slate-900 shadow-2xl z-40 overflow-hidden max-h-80 overflow-y-auto divide-y divide-slate-100"
                >
                  <div className="p-3 bg-indigo-50/80 border-b border-indigo-100 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-indigo-900 font-black text-[10px] uppercase tracking-widest">
                      <Sparkles size={14} className="text-indigo-600 animate-pulse" />
                      <span>Predictive Matches ({predictiveSuggestions.length})</span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-500">Press Esc to close</span>
                  </div>

                  {predictiveSuggestions.length === 0 ? (
                    <div className="p-6 text-center text-slate-500 font-bold text-xs">
                      No matching students found for "{searchTerm}". Try another name or roll number.
                    </div>
                  ) : (
                    predictiveSuggestions.map(student => (
                      <button
                        key={student.id}
                        onClick={() => {
                          setSearchTerm(student.name);
                          setIsSearchFocused(false);
                          onSelectStudent?.(student.id);
                        }}
                        className="w-full p-4 hover:bg-indigo-50/70 transition-colors flex items-center justify-between text-left group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white font-black text-xs flex items-center justify-center shadow-sm">
                            {student.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-black text-slate-900 text-sm uppercase tracking-tight group-hover:text-indigo-600 transition-colors">
                              {highlightMatch(student.name, searchTerm)}
                            </div>
                            <div className="text-xs font-bold text-slate-500">
                              Roll No: {highlightMatch(student.rollNumber, searchTerm)} • {student.gender}, {student.age} yrs
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="px-2.5 py-1 bg-slate-100 group-hover:bg-indigo-100 text-slate-800 group-hover:text-indigo-800 rounded-lg text-[10px] font-black uppercase tracking-widest">
                            Grade {student.grade}-{student.section}
                          </span>
                          <ChevronRight size={16} className="text-slate-400 group-hover:text-indigo-600 transition-transform group-hover:translate-x-0.5" />
                        </div>
                      </button>
                    ))
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Result Counter & Active Filter Reset */}
          <div className="flex items-center justify-between lg:justify-end gap-3 min-w-[200px]">
            <div className="px-4 py-3 bg-indigo-50 border border-indigo-200 rounded-2xl flex items-center gap-2">
              <Users size={16} className="text-indigo-600" />
              <span className="text-xs font-black text-indigo-900 uppercase tracking-tight">
                {filteredStudents.length} of {students.length} Students
              </span>
            </div>

            {(searchTerm || selectedGrade !== 'all' || selectedSection !== 'all') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedGrade('all');
                  setSelectedSection('all');
                }}
                className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-black text-xs uppercase tracking-wider transition-colors flex items-center gap-1.5"
                title="Reset all filters"
              >
                <X size={14} />
                <span>Clear</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick Filter Pills (Grades & Sections) */}
        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-2">
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2 flex items-center gap-1">
            <Filter size={12} />
            <span>Class Filter:</span>
          </div>

          <button
            onClick={() => setSelectedGrade('all')}
            className={`px-3.5 py-1.5 rounded-xl font-black text-[11px] uppercase tracking-wider transition-all ${
              selectedGrade === 'all'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Classes ({students.length})
          </button>

          {availableGrades.map(grade => {
            const gradeCount = students.filter(s => isGradeMatching(s.grade, grade)).length;
            return (
              <button
                key={grade}
                onClick={() => setSelectedGrade(selectedGrade === grade ? 'all' : grade)}
                className={`px-3.5 py-1.5 rounded-xl font-black text-[11px] uppercase tracking-wider transition-all ${
                  selectedGrade === grade
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                    : gradeCount > 0
                      ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                }`}
              >
                Grade {grade} ({gradeCount})
              </button>
            );
          })}

          {availableSections.length > 0 && (
            <>
              <div className="h-4 w-px bg-slate-200 mx-2" />
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-1">Section:</div>
              <button
                onClick={() => setSelectedSection('all')}
                className={`px-3 py-1 rounded-lg font-black text-[10px] uppercase tracking-wider transition-all ${
                  selectedSection === 'all'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All Sec
              </button>
              {availableSections.map(sec => {
                const secCount = students.filter(s => 
                  (selectedGrade === 'all' || isGradeMatching(s.grade, selectedGrade)) && s.section === sec
                ).length;
                return (
                  <button
                    key={sec}
                    onClick={() => setSelectedSection(selectedSection === sec ? 'all' : sec)}
                    className={`px-3 py-1 rounded-lg font-black text-[10px] uppercase tracking-wider transition-all ${
                      selectedSection === sec
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Sec {sec} ({secCount})
                  </button>
                );
              })}
            </>
          )}
        </div>
      </div>

      {/* Student List Table */}
      <div className="bg-white rounded-[2.5rem] border-2 border-slate-900 overflow-hidden shadow-sm relative">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b-2 border-slate-900">
              <th className="p-6 w-12 text-center">
                <button
                  onClick={toggleSelectAllFiltered}
                  className="text-slate-500 hover:text-indigo-600 transition-colors p-1"
                  title="Select / Deselect All Filtered Students"
                >
                  {filteredStudents.length > 0 && filteredStudents.every(s => selectedStudentIds.has(s.id)) ? (
                    <CheckSquare size={18} className="text-indigo-600" />
                  ) : (
                    <Square size={18} className="text-slate-400" />
                  )}
                </button>
              </th>
              <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Student Candidate</th>
              <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Register / Roll No</th>
              <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Class & Sec</th>
              <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Gender / Age</th>
              <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Test & Practical Status</th>
              <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Direct Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredStudents.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-16 text-center">
                  <div className="space-y-4 max-w-md mx-auto">
                    <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto text-indigo-600">
                      <Users size={32} />
                    </div>
                    <div>
                      <p className="font-black text-slate-900 text-base uppercase tracking-tight">
                        {selectedGrade !== 'all' ? `No Students in Grade ${selectedGrade}` : 'No Students Found'}
                      </p>
                      <p className="text-xs text-slate-500 font-medium mt-1">
                        {selectedGrade === '12' || selectedGrade === '11'
                          ? `There are currently no Class ${selectedGrade} candidates in the student roster.`
                          : 'Try clearing your filters or searching with a different keyword.'}
                      </p>
                    </div>

                    <div className="pt-2 flex flex-wrap items-center justify-center gap-2.5">
                      <button
                        onClick={handleSeedDemoSchoolAndStudents}
                        disabled={seedingDemoSchool}
                        className="px-4 py-2.5 bg-[#0D2B52] hover:bg-[#164077] text-[#D4A017] border-2 border-slate-900 rounded-xl font-black text-xs uppercase tracking-wider shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                        title="Seed 12 students across Classes 5, 8, 10 & 12 with multi-term fitness scores & practicals"
                      >
                        {seedingDemoSchool ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                        <span>⚡ Seed Demo School (12 Students)</span>
                      </button>
                      {(selectedGrade === '12' || selectedGrade === 'all') && (
                        <button
                          onClick={handleSeedGrade12Batch}
                          disabled={seedingGrade12}
                          className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white border-2 border-slate-900 rounded-xl font-black text-xs uppercase tracking-wider shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                        >
                          {seedingGrade12 ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                          <span>⚡ Quick Add 10 Class 12</span>
                        </button>
                      )}
                      <button 
                        onClick={() => {
                          setNewStudent(prev => ({ ...prev, grade: selectedGrade !== 'all' ? selectedGrade : '12' }));
                          setIsAdding(true);
                        }}
                        className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                      >
                        <UserPlus size={14} />
                        <span>Add Student {selectedGrade !== 'all' ? `to Grade ${selectedGrade}` : ''}</span>
                      </button>
                      {(searchTerm || selectedGrade !== 'all' || selectedSection !== 'all') && (
                        <button 
                          onClick={() => {
                            setSearchTerm('');
                            setSelectedGrade('all');
                            setSelectedSection('all');
                          }}
                          className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-black text-xs uppercase tracking-wider transition-all"
                        >
                          Clear Filters
                        </button>
                      )}
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              filteredStudents.map(student => {
                const resCount = resultCountMap[student.id] || 0;
                const practical = practicalMap[student.id];
                const isSenior = isGradeMatching(student.grade, '11') || isGradeMatching(student.grade, '12');

                return (
                  <tr 
                    key={student.id} 
                    className={`transition-colors group ${
                      selectedStudentIds.has(student.id) 
                        ? 'bg-indigo-50/70 border-l-4 border-l-indigo-600' 
                        : highlightStudentId === student.id 
                          ? 'bg-indigo-50/50' 
                          : 'hover:bg-slate-50'
                    }`}
                  >
                    <td className="p-6 w-12 text-center" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={(e) => toggleSelectStudent(student.id, e)}
                        className="text-slate-500 hover:text-indigo-600 transition-colors p-1"
                        title={selectedStudentIds.has(student.id) ? "Deselect student" : "Select student for bulk print"}
                      >
                        {selectedStudentIds.has(student.id) ? (
                          <CheckSquare size={18} className="text-indigo-600" />
                        ) : (
                          <Square size={18} className="text-slate-300 group-hover:text-slate-400" />
                        )}
                      </button>
                    </td>
                    <td className="p-6">
                      <div 
                        onClick={() => setSelectedProfileStudent(student)}
                        className="flex items-center gap-4 cursor-pointer group/student hover:opacity-90 transition-opacity"
                        title="Click to view full student profile & D3 fitness growth progress"
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs transition-transform group-hover/student:scale-105 ${
                          selectedStudentIds.has(student.id) || highlightStudentId === student.id 
                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' 
                            : 'bg-indigo-50 text-indigo-600 group-hover/student:bg-indigo-600 group-hover/student:text-white'
                        }`}>
                          {student.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <span className="font-black text-slate-900 group-hover/student:text-indigo-600 uppercase tracking-tight block transition-colors">
                            {highlightMatch(student.name, searchTerm)}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-slate-400">ID: {student.id.slice(-6)}</span>
                            <span className="text-[9px] font-black uppercase text-indigo-600 bg-indigo-50 px-1.5 py-0.2 rounded group-hover/student:bg-indigo-100">
                              View Profile →
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-6">
                      <span className="font-bold text-slate-700 font-mono text-xs bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                        {highlightMatch(student.rollNumber || 'N/A', searchTerm)}
                      </span>
                    </td>
                    <td className="p-6">
                      <div className="flex items-center gap-1.5">
                        <span className="inline-flex px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg text-[10px] font-black uppercase tracking-widest">
                          Grade {student.grade}
                        </span>
                        <span className="inline-flex px-2 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-[10px] font-black uppercase tracking-widest">
                          {student.section}
                        </span>
                      </div>
                    </td>
                    <td className="p-6">
                      <span className="text-xs font-bold text-slate-600">{student.gender}, {student.age} yrs</span>
                    </td>
                    <td className="p-6">
                      <div className="flex flex-col gap-1.5">
                        {/* Fitness Result Indicator */}
                        {resCount > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md text-[10px] font-black tracking-wide w-fit">
                            <Activity size={11} className="text-emerald-600" />
                            <span>KIFT: {resCount} Tests Logged</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-500 rounded-md text-[10px] font-bold w-fit">
                            <span>KIFT Pending</span>
                          </span>
                        )}

                        {/* CBSE Practical Indicator */}
                        {isSenior && (
                          practical ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-900 border border-amber-300 rounded-md text-[10px] font-black tracking-wide w-fit">
                              <ClipboardCheck size={11} className="text-amber-600" />
                              <span>CBSE: {practical.totalMarks}/30 Marks</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-md text-[10px] font-bold w-fit">
                              <span>30M Practical Pending</span>
                            </span>
                          )
                        )}
                      </div>
                    </td>
                    <td className="p-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button 
                          onClick={() => setSelectedProfileStudent(student)}
                          className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all flex items-center gap-1 text-[10px] font-black uppercase tracking-wider shadow-2xs cursor-pointer"
                          title="View Individual Student Profile & D3 Progress Over Time"
                        >
                          <TrendingUp size={13} className="text-[#D4A017]" />
                          <span className="hidden xl:inline">Growth Curve</span>
                        </button>

                        <button 
                          onClick={() => {
                            if (onNavigate) {
                              onNavigate('fitness');
                            }
                          }}
                          className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg transition-colors flex items-center gap-1 text-[10px] font-black uppercase tracking-wider"
                          title="Record Khelo India Fitness Tests for this student"
                        >
                          <Activity size={13} />
                          <span className="hidden xl:inline">Fitness</span>
                        </button>
                        
                        {isSenior && (
                          <button 
                            onClick={() => {
                              if (onNavigate) {
                                onNavigate('cbse-practical');
                              }
                            }}
                            className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-lg transition-colors flex items-center gap-1 text-[10px] font-black uppercase tracking-wider"
                            title="Evaluate 30-mark CBSE Practical Examination"
                          >
                            <ClipboardCheck size={13} className="text-amber-700" />
                            <span className="hidden xl:inline">30M Practical</span>
                          </button>
                        )}

                        <button 
                          onClick={() => onSelectStudent?.(student.id)}
                          className="p-1.5 hover:bg-emerald-50 text-emerald-600 rounded-lg transition-colors flex items-center gap-1"
                          title="View Comprehensive Report Card"
                        >
                          <FileText size={16} />
                        </button>
                        <button 
                          onClick={() => setEditingStudent(student)}
                          className="p-1.5 hover:bg-indigo-50 text-indigo-600 rounded-lg transition-colors"
                          title="Edit Student Profile"
                        >
                          <Edit2 size={16} />
                        </button>
                        {isAdmin && (
                          <button 
                            onClick={() => setStudentToPurge(student)}
                            className="p-1.5 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
                            title="Purge / Delete Student Record Permanently (Admin Only)"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Floating Bulk Action Bar */}
      <AnimatePresence>
        {selectedStudentIds.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900 text-white p-4 px-6 rounded-2xl shadow-2xl border-2 border-slate-700 flex flex-wrap items-center justify-between gap-4 max-w-2xl w-11/12"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-500 text-white font-black text-xs flex items-center justify-center">
                {selectedStudentIds.size}
              </div>
              <div>
                <div className="font-black text-xs uppercase tracking-wider text-slate-200">
                  {selectedStudentIds.size} {selectedStudentIds.size === 1 ? 'Student' : 'Students'} Selected
                </div>
                <div className="text-[10px] text-slate-400 font-bold">
                  Ready for multi-report batch export or permanent purge
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isAdmin && (
                <button
                  onClick={() => setIsBulkPurgeModalOpen(true)}
                  disabled={isDeletingBulk || isGeneratingBulkPDF}
                  className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2 shadow-md shadow-rose-900/50 disabled:opacity-50 cursor-pointer"
                  title="Purge selected student records permanently"
                >
                  {isDeletingBulk ? (
                    <Loader2 size={16} className="animate-spin text-white" />
                  ) : (
                    <Trash2 size={16} />
                  )}
                  <span>Purge Selected ({selectedStudentIds.size})</span>
                </button>
              )}

              <button
                onClick={handleGenerateBulkPDF}
                disabled={isGeneratingBulkPDF || isDeletingBulk}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2 shadow-md shadow-indigo-900/50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGeneratingBulkPDF ? (
                  <Loader2 size={16} className="animate-spin text-white" />
                ) : (
                  <Printer size={16} />
                )}
                <span>{isGeneratingBulkPDF ? 'Generating PDF...' : 'Print Bulk PDF Reports'}</span>
              </button>

              <button
                onClick={handleClearSelection}
                disabled={isGeneratingBulkPDF}
                className="px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-black text-xs uppercase tracking-wider transition-colors"
                title="Deselect All"
              >
                <X size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Generating PDF Modal/Overlay */}
      <AnimatePresence>
        {isGeneratingBulkPDF && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <div className="bg-white rounded-3xl p-8 max-w-md w-full border-2 border-slate-900 text-center space-y-4 shadow-2xl">
              <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto text-indigo-600 border border-indigo-100">
                <Printer size={32} className="animate-bounce" />
              </div>
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Generating Bulk PDF Reports</h3>
              <p className="text-xs text-slate-500 font-bold">{bulkProgressText}</p>
              <div className="flex items-center justify-center gap-2 text-indigo-600 font-black text-xs uppercase tracking-wider pt-2">
                <Loader2 size={18} className="animate-spin" />
                <span>Compiling Report Cards...</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Deleting Progress Overlay */}
      <AnimatePresence>
        {isDeletingBulk && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <div className="bg-white rounded-3xl p-8 max-w-md w-full border-2 border-slate-900 text-center space-y-4 shadow-2xl">
              <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto text-rose-600 border border-rose-100">
                <Trash2 size={32} className="animate-bounce" />
              </div>
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Deleting Student Data</h3>
              <p className="text-xs text-slate-500 font-bold">{deleteProgressText}</p>
              <div className="flex items-center justify-center gap-2 text-rose-600 font-black text-xs uppercase tracking-wider pt-2">
                <Loader2 size={18} className="animate-spin" />
                <span>Updating School Database...</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Purge / Delete Permanently Single Student Modal */}
      <AnimatePresence>
        {studentToPurge && (
          <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-[2.5rem] border-4 border-slate-900 p-8 max-w-lg w-full shadow-2xl space-y-6"
            >
              <div className="flex items-center justify-between border-b-2 border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-rose-100 text-rose-600 rounded-2xl border-2 border-rose-300">
                    <Trash2 size={24} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Purge Student Record</h3>
                    <p className="text-xs font-bold text-rose-600">Irreversible Permanent Deletion</p>
                  </div>
                </div>
                <button
                  onClick={() => setStudentToPurge(null)}
                  className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-700 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Student Name</span>
                  <span className="font-extrabold text-sm text-slate-900">{studentToPurge.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Roll / Reg No</span>
                  <span className="font-bold text-xs text-slate-700 font-mono">{studentToPurge.rollNumber}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Class & Section</span>
                  <span className="font-bold text-xs text-slate-700">Grade {studentToPurge.grade} - Section {studentToPurge.section}</span>
                </div>
              </div>

              <div className="bg-rose-50 border-2 border-rose-200 rounded-2xl p-4 text-xs font-medium text-rose-900 space-y-2">
                <p className="font-black uppercase tracking-wider text-rose-700 flex items-center gap-1.5">
                  <AlertTriangle size={16} /> What will be purged permanently:
                </p>
                <ul className="list-disc list-inside space-y-1 text-[11px] text-rose-900/90 font-medium">
                  <li>Student roster registration profile from cloud database</li>
                  <li>All recorded CBSE / Khelo India fitness test attempts & scores</li>
                  <li>Historical BMI metrics, radar charts, and progress trends</li>
                  <li>Local offline browser storage and pending sync queue entries</li>
                </ul>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setStudentToPurge(null)}
                  className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-black text-xs uppercase tracking-widest transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteStudent(studentToPurge.id)}
                  className="px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-[4px_4px_0px_0px_rgba(159,18,57,1)] flex items-center gap-2 cursor-pointer"
                >
                  <Trash2 size={16} />
                  <span>Purge Permanently</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Bulk Purge Selected Students Modal */}
      <AnimatePresence>
        {isBulkPurgeModalOpen && (
          <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-[2.5rem] border-4 border-slate-900 p-8 max-w-lg w-full shadow-2xl space-y-6"
            >
              <div className="flex items-center justify-between border-b-2 border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-rose-100 text-rose-600 rounded-2xl border-2 border-rose-300">
                    <Trash2 size={24} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Purge {selectedStudentIds.size} Students</h3>
                    <p className="text-xs font-bold text-rose-600">Batch Permanent Deletion</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsBulkPurgeModalOpen(false)}
                  className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-700 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="bg-rose-50 border-2 border-rose-200 rounded-2xl p-4 text-xs font-medium text-rose-900 space-y-2">
                <p className="font-black uppercase tracking-wider text-rose-700 flex items-center gap-1.5">
                  <AlertTriangle size={16} /> Warning: Permanent Data Purge
                </p>
                <p>
                  You are about to permanently delete <strong>{selectedStudentIds.size} selected students</strong> and purge all their historical fitness test records from the school database.
                </p>
                <p className="text-[11px] text-rose-800">
                  This action cannot be undone. All report cards, test histories, and scores for these {selectedStudentIds.size} students will be deleted immediately.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setIsBulkPurgeModalOpen(false)}
                  className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-black text-xs uppercase tracking-widest transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteSelectedStudents}
                  disabled={isDeletingBulk}
                  className="px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-[4px_4px_0px_0px_rgba(159,18,57,1)] disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
                >
                  {isDeletingBulk ? <Loader2 size={16} className="animate-spin text-white" /> : <Trash2 size={16} />}
                  <span>Confirm Purge ({selectedStudentIds.size})</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete All Students / Reset Roster Modal */}
      <AnimatePresence>
        {isDeleteAllModalOpen && (
          <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-[2.5rem] border-4 border-slate-900 p-8 max-w-lg w-full shadow-2xl space-y-6"
            >
              <div className="flex items-center justify-between border-b-2 border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-rose-100 text-rose-600 rounded-2xl border-2 border-rose-300">
                    <AlertTriangle size={24} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Purge Entire School Roster</h3>
                    <p className="text-xs font-bold text-rose-600">Danger Zone: Irreversible Action</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsDeleteAllModalOpen(false)}
                  className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-700 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="bg-rose-50 border-2 border-rose-200 rounded-2xl p-4 text-xs font-medium text-rose-900 space-y-2">
                <p className="font-black uppercase tracking-wider text-rose-700 flex items-center gap-1.5">
                  <AlertTriangle size={16} /> Warning: Complete Database Purge
                </p>
                <p>
                  This action will permanently delete <strong>ALL {students.length} students</strong> currently registered in your school directory along with all their recorded CBSE fitness test results, metrics, and historical data.
                </p>
                <p className="text-[11px] text-rose-800">
                  Use this option when resetting the school database for a new academic year or before re-uploading an updated master CSV list.
                </p>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
                  Type <span className="text-rose-600 underline font-black">PURGE</span> or <span className="text-rose-600 underline font-black">DELETE ALL</span> to confirm:
                </label>
                <input
                  type="text"
                  value={confirmDeleteText}
                  onChange={e => setConfirmDeleteText(e.target.value)}
                  placeholder="Type PURGE or DELETE ALL..."
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-300 focus:border-rose-600 rounded-2xl font-bold outline-none text-slate-900 uppercase tracking-wider text-sm transition-all"
                  autoFocus
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setIsDeleteAllModalOpen(false)}
                  className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-black text-xs uppercase tracking-widest transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAllStudents}
                  disabled={
                    confirmDeleteText.trim().toUpperCase() !== 'DELETE ALL' && 
                    confirmDeleteText.trim().toUpperCase() !== 'PURGE' &&
                    confirmDeleteText.trim().toUpperCase() !== 'PURGE ALL'
                  }
                  className="px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-[4px_4px_0px_0px_rgba(159,18,57,1)] disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
                >
                  <Trash2 size={16} />
                  <span>Purge Entire Database</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Student Modal */}
      {isAdding && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-[2.5rem] border-4 border-slate-900 p-10 max-w-xl w-full shadow-2xl"
          >
            <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter mb-8">Add New Student</h3>
            <form onSubmit={handleAddStudent} className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Full Name</label>
                  <input 
                    type="text" 
                    required
                    className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl font-bold outline-none focus:border-indigo-600 transition-all"
                    value={newStudent.name}
                    onChange={e => setNewStudent({...newStudent, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Roll Number</label>
                  <input 
                    type="text" 
                    required
                    className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl font-bold outline-none focus:border-indigo-600 transition-all"
                    value={newStudent.rollNumber}
                    onChange={e => setNewStudent({...newStudent, rollNumber: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Age</label>
                  <input 
                    type="number" 
                    required
                    className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl font-bold outline-none focus:border-indigo-600 transition-all"
                    value={newStudent.age}
                    onChange={e => setNewStudent({...newStudent, age: parseInt(e.target.value)})}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Grade</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. 10"
                    className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl font-bold outline-none focus:border-indigo-600 transition-all"
                    value={newStudent.grade}
                    onChange={e => setNewStudent({...newStudent, grade: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Section</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. A"
                    className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl font-bold outline-none focus:border-indigo-600 transition-all"
                    value={newStudent.section}
                    onChange={e => setNewStudent({...newStudent, section: e.target.value})}
                  />
                </div>
              </div>

              <div className="flex items-center gap-4 pt-4">
                <button 
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="flex-1 py-4 border-2 border-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-4 bg-indigo-600 text-white border-2 border-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]"
                >
                  Save Student
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Edit Student Modal */}
      {editingStudent && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-[2.5rem] border-4 border-slate-900 p-10 max-w-xl w-full shadow-2xl"
          >
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Edit Student Profile</h3>
                <p className="text-slate-500 font-medium text-xs">Update details for {editingStudent.name}</p>
              </div>
              <button 
                onClick={() => setEditingStudent(null)}
                className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUpdateStudent} className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Full Name</label>
                  <input 
                    type="text" 
                    required
                    className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl font-bold outline-none focus:border-indigo-600 transition-all text-slate-900"
                    value={editingStudent.name}
                    onChange={e => setEditingStudent({...editingStudent, name: e.target.value})}
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Register / Roll Number</label>
                  <input 
                    type="text" 
                    required
                    className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl font-bold outline-none focus:border-indigo-600 transition-all text-slate-900"
                    value={editingStudent.rollNumber}
                    onChange={e => setEditingStudent({...editingStudent, rollNumber: e.target.value})}
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Age (Years)</label>
                  <input 
                    type="number" 
                    required
                    min={3}
                    max={25}
                    className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl font-bold outline-none focus:border-indigo-600 transition-all text-slate-900"
                    value={editingStudent.age}
                    onChange={e => setEditingStudent({...editingStudent, age: parseInt(e.target.value) || 0})}
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Class / Grade</label>
                  <input 
                    type="text" 
                    required
                    className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl font-bold outline-none focus:border-indigo-600 transition-all text-slate-900"
                    value={editingStudent.grade}
                    onChange={e => setEditingStudent({...editingStudent, grade: e.target.value})}
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Section</label>
                  <input 
                    type="text" 
                    required
                    className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl font-bold outline-none focus:border-indigo-600 transition-all text-slate-900"
                    value={editingStudent.section}
                    onChange={e => setEditingStudent({...editingStudent, section: e.target.value})}
                  />
                </div>

                <div className="col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Gender</label>
                  <select
                    value={editingStudent.gender}
                    onChange={e => setEditingStudent({...editingStudent, gender: e.target.value as any})}
                    className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl font-bold outline-none focus:border-indigo-600 transition-all text-slate-900"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-4 pt-4">
                <button 
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="flex-1 py-4 border-2 border-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-4 bg-indigo-600 text-white border-2 border-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]"
                >
                  Update Profile
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Import Modal */}
      {isImporting && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-[2.5rem] border-4 border-slate-900 p-10 max-w-xl w-full shadow-2xl"
          >
            <div className="flex justify-between items-start mb-8">
              <div>
                <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter mb-2">Import Students</h3>
                <p className="text-slate-500 font-medium text-sm">Upload a CSV file to add multiple students at once.</p>
              </div>
              <button 
                onClick={() => setIsImporting(false)}
                className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <Trash2 size={24} className="text-slate-400 rotate-45" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="p-8 border-4 border-dashed border-slate-100 rounded-[2rem] flex flex-col items-center text-center">
                <FileUp size={48} className="text-indigo-600 mb-4" />
                <p className="font-black text-slate-900 uppercase tracking-tight mb-2">Choose CSV File</p>
                <p className="text-xs text-slate-400 font-bold mb-6">Format: Name, Roll No, Grade, Section, Gender, Age</p>
                <input 
                  type="file" 
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="hidden" 
                  id="csvUpload" 
                />
                <label 
                  htmlFor="csvUpload"
                  className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest cursor-pointer hover:bg-slate-800 transition-all shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]"
                >
                  Select File
                </label>
              </div>

              <div className="p-6 bg-indigo-50 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-0.5">CSV Downloads</p>
                    <p className="text-xs font-black text-indigo-900 uppercase tracking-tight">Need Starter Data or Template?</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={handleDownloadTemplate}
                      className="px-3 py-2 bg-white border-2 border-indigo-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:bg-indigo-100 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                      title="Download blank CSV template"
                    >
                      <Download size={13} />
                      <span>Blank Template</span>
                    </button>
                    <button 
                      onClick={handleDownloadSampleCsv}
                      className="px-3 py-2 bg-indigo-600 border-2 border-indigo-700 rounded-xl text-[10px] font-black uppercase tracking-widest text-white hover:bg-indigo-700 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                      title="Download sample CSV populated with 12 dummy students across Classes 5, 8, 10, 12"
                    >
                      <Sparkles size={13} />
                      <span>Sample Dummy CSV</span>
                    </button>
                  </div>
                </div>

                <div className="pt-3 border-t border-indigo-200/60 flex items-center justify-between">
                  <span className="text-[11px] font-medium text-indigo-800">
                    Or skip CSV upload & seed right now into Firestore:
                  </span>
                  <button
                    onClick={() => {
                      handleSeedDemoSchoolAndStudents();
                      setIsImporting(false);
                    }}
                    disabled={seedingDemoSchool}
                    className="px-3 py-1.5 bg-[#0D2B52] hover:bg-[#164077] text-[#D4A017] rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {seedingDemoSchool ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                    <span>⚡ Instant Seed School</span>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Individual Student Profile & D3 Progress Modal */}
      {selectedProfileStudent && (
        <IndividualStudentProfileModal
          student={selectedProfileStudent}
          isOpen={Boolean(selectedProfileStudent)}
          onClose={() => setSelectedProfileStudent(null)}
          onNavigateToFitness={(studentId) => {
            if (onNavigate) {
              onNavigate('fitness');
            }
          }}
          onNavigateToReportCard={(studentId) => {
            if (onSelectStudent) {
              onSelectStudent(studentId);
            }
          }}
          onNavigateToPractical={(studentId) => {
            if (onNavigate) {
              onNavigate('cbse-practical');
            }
          }}
          practicalAssessment={practicalMap[selectedProfileStudent.id] || null}
        />
      )}
    </div>
  );
};

export default StudentManagement;
