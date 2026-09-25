
import React, { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import { 
  Heart, 
  Zap, 
  Dumbbell, 
  Move, 
  Timer, 
  StretchHorizontal, 
  User, 
  ChevronRight, 
  ArrowLeft, 
  Calculator, 
  Loader2, 
  AlertCircle, 
  CheckCircle2,
  Info,
  Trophy,
  History,
  Activity,
  Save,
  Gamepad2,
  FileText,
  Printer,
  Download,
  X,
  Share2,
  Users,
  Search,
  Check,
  CheckCheck,
  ListFilter,
  Table,
  FileSpreadsheet,
  Upload,
  ArrowDown,
  ArrowUp,
  LayoutGrid,
  SlidersHorizontal,
  Layers,
  Plus,
  Minus,
  Smartphone,
  Laptop,
  Filter,
  FastForward,
  ArrowRight,
  Play,
  Video
} from 'lucide-react';
import { evaluateFitnessTests } from '../services/geminiService.ts';
import { FitnessAssessment, KIFTBattery, KIFTTest, FitnessResult } from '../types.ts';
import { storageService } from '../services/storageService.ts';
import { fitnessService, Student, KIFT_BATTERIES } from '../services/fitnessService.ts';
import { calculateExactBMI, parseFitnessValue, getDescriptiveFieldInfo } from '../utils/bmiUtils.ts';
import { auth } from '../services/firebase.ts';
import { toast } from '../services/toast.ts';
import GamesProficiencyGenerator from './GamesProficiencyGenerator.tsx';
import { TestGuideModal } from './fitness/TestGuideModal.tsx';
import { TestVideoModal } from './fitness/TestVideoModal.tsx';
import { BMISpectrumGauge } from './fitness/BMISpectrumGauge.tsx';
import { TestFieldTooltip } from './fitness/TestFieldTooltip.tsx';
import { IndividualStudentProfileModal } from './fitness/IndividualStudentProfileModal.tsx';
import { D3StudentProgressChart } from './fitness/D3StudentProgressChart.tsx';

const ADMIN_EMAILS = ['admin@smartpeindia.app', 'contact@smartpeindia.app', 'info@smartpeindia.app'];
const isAdminUser = (email?: string | null) => {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
};

const FitnessTests: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'fitness' | 'games'>('fitness');
  const [selectedBattery, setSelectedBattery] = useState<KIFTBattery | null>(null);

  const [selectedTest, setSelectedTest] = useState<KIFTTest | null>(null);
  const [testSelectionFilter, setTestSelectionFilter] = useState<string>('all'); // 'all', 'custom', or specific test id
  const [customSelectedTestIds, setCustomSelectedTestIds] = useState<string[]>([]);
  const [viewLayoutMode, setViewLayoutMode] = useState<'cards' | 'table'>('cards');
  const [activeGuideTest, setActiveGuideTest] = useState<KIFTTest | null>(null);
  const [activeVideoTest, setActiveVideoTest] = useState<KIFTTest | null>(null);
  const [age, setAge] = useState('10');
  const [gender, setGender] = useState('Male');
  const [testValue, setTestValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<FitnessAssessment | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedGradeFilter, setSelectedGradeFilter] = useState('ALL');
  const [selectedSectionFilter, setSelectedSectionFilter] = useState('ALL');
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [entryMode, setEntryMode] = useState<'batch' | 'single'>('batch');
  const [batchScores, setBatchScores] = useState<{ [studentId: string]: string }>({});
  const [batchSaving, setBatchSaving] = useState(false);
  const [batchSavedStatus, setBatchSavedStatus] = useState<{ [studentId: string]: boolean }>({});
  const [selectedTerm, setSelectedTerm] = useState('Baseline');
  const [userProfile, setUserProfile] = useState<any>(null);
  const [studentResults, setStudentResults] = useState<FitnessResult[]>([]);
  const [allResults, setAllResults] = useState<FitnessResult[]>([]);
  const [showReportModal, setShowReportModal] = useState(false);
  const [profileModalStudent, setProfileModalStudent] = useState<Student | null>(null);
  const [sequentialMode, setSequentialMode] = useState<boolean>(true);
  const [activeFocusCoord, setActiveFocusCoord] = useState<{ sIdx: number; tIdx: number } | null>(null);

  const formatFitnessError = (err: any): string => {
    try {
      // Try to parse the JSON error string from handleFirestoreError
      const parsed = JSON.parse(err.message);
      if (parsed.error) {
        if (parsed.error.includes('permission') || parsed.error.includes('insufficient')) {
          return "Access Denied: You don't have permission to perform this action. Check if your school profile is properly registered.";
        }
        if (parsed.error.includes('offline') || parsed.error.includes('unavailable')) {
          return "Network Error: Please check your internet connection and try again.";
        }
        if (parsed.error.includes('quota')) {
          return "Quota Exceeded: The daily limit for database operations has been reached. Please try again later.";
        }
        return `Database Error: ${parsed.error}`;
      }
    } catch (e) {
      // Fallback for non-JSON errors
      if (err.message?.includes('network') || err.message?.includes('failed to fetch')) {
        return "Connection Error: Unable to reach the server. Please check your network.";
      }
    }
    return err.message || "An unexpected error occurred. Please try again.";
  };

  /**
   * Helper to accurately match a test result in the database for a given student, test, and term.
   */
  const findSavedResult = (
    studentId: string, 
    testId: string, 
    testName: string, 
    term: string, 
    resultsList: FitnessResult[]
  ): FitnessResult | undefined => {
    if (!resultsList || resultsList.length === 0 || !studentId) return undefined;

    const studentMatchingResults = resultsList.filter(r => 
      r.studentId === studentId && 
      (r.term === term || (!r.term && term === 'Baseline'))
    );

    if (studentMatchingResults.length === 0) return undefined;

    const tId = (testId || '').toLowerCase().trim();
    const tName = (testName || '').toLowerCase().trim();

    return studentMatchingResults.find(r => {
      const rId = (r.testId || '').toLowerCase().trim();
      const rName = (r.testName || '').toLowerCase().trim();

      // 1. Exact ID match (Strongest)
      if (rId && rId === tId) return true;

      // 2. Exact Name match
      if (rName && tName && rName === tName) return true;

      // 3. Strict isolated test matching:

      // Sit & Reach (Flexibility) - strictly forbidden from matching curl_ups or sit-ups
      if (tId === 'sit_reach' || tName.includes('sit & reach') || tName.includes('reach flexibility') || tName.includes('reach distance')) {
        if (rId === 'curl_ups' || rId === 'pushups') return false;
        if (rName.includes('curl') || rName.includes('push') || rName.includes('sit-up') || rName.includes('sit up') || rName.includes('situp')) return false;
        return rId === 'sit_reach' || rName.includes('reach') || rName.includes('sit & reach') || rName.includes('sit and reach');
      }

      // Sit-Ups / Partial Curl-Ups - strictly forbidden from matching sit & reach
      if (tId === 'curl_ups' || tName.includes('curl') || tName.includes('sit-up') || tName.includes('sit up') || tName.includes('situp')) {
        if (rId === 'sit_reach' || rId === 'pushups') return false;
        if (rName.includes('reach') || rName.includes('push')) return false;
        return rId === 'curl_ups' || rName.includes('curl') || rName.includes('sit-up') || rName.includes('sit up') || rName.includes('situp');
      }

      // Push-Ups / Modified Push-Ups - strictly isolated
      if (tId === 'pushups' || tName.includes('push')) {
        if (rId === 'curl_ups' || rId === 'sit_reach') return false;
        if (rName.includes('curl') || rName.includes('reach') || rName.includes('sit')) return false;
        return rId === 'pushups' || rName.includes('push');
      }

      // 25m Sprint
      if (tId === 'sprint_25m' || tName.includes('25m') || tName.includes('25 meter')) {
        if (rId === 'sprint_50m' || rId === 'sprint_30m' || rId === 'run_600m') return false;
        return rId === 'sprint_25m' || (rName.includes('25') && (rName.includes('sprint') || rName.includes('meter') || rName.includes('run') || rName.includes('dash')));
      }

      // 30m Sprint
      if (tId === 'sprint_30m' || tName.includes('30m') || tName.includes('30 meter')) {
        if (rId === 'sprint_50m' || rId === 'sprint_25m' || rId === 'run_600m') return false;
        return rId === 'sprint_30m' || (rName.includes('30') && (rName.includes('sprint') || rName.includes('meter') || rName.includes('run') || rName.includes('dash')));
      }

      // 50m Sprint
      if (tId === 'sprint_50m' || tName.includes('50m') || tName.includes('50 meter')) {
        if (rId === 'sprint_25m' || rId === 'sprint_30m' || rId === 'run_600m') return false;
        return (rId === 'sprint_50m' || rName.includes('50m') || rName.includes('50 meter') || rName.includes('50 mts') || rName.includes('dash')) &&
               !rId.includes('25') && !rId.includes('30') && !rName.includes('25') && !rName.includes('30');
      }

      // Shuttle Run
      if (tId === 'shuttle_4x10' || tId === 'shuttle_run' || tName.includes('shuttle')) {
        return rId === 'shuttle_4x10' || rId === 'shuttle_run' || rName.includes('shuttle') || rName.includes('4x10') || rName.includes('4×10');
      }

      // 600m Run/Walk
      if (tId === 'run_600m' || tName.includes('600')) {
        if (rId === 'run_long') return false;
        return (rId === 'run_600m' || rName.includes('600')) && !rName.includes('1000') && !rName.includes('800');
      }

      // Long Endurance Run (800m / 1000m)
      if (tId === 'run_long' || tName.includes('1000m') || tName.includes('800m')) {
        if (rId === 'run_600m') return false;
        return rId === 'run_long' || rName.includes('1000m') || rName.includes('800m') || rName.includes('long run');
      }

      // BMI
      if (tId === 'bmi' || tName.includes('bmi') || tName.includes('height & weight') || tName.includes('body mass')) {
        return rId === 'bmi' || rName.includes('bmi') || rName.includes('height & weight') || rName.includes('body mass');
      }

      // Standing Broad Jump
      if (tId === 'broad_jump' || tName.includes('broad jump') || tName.includes('standing jump')) {
        return (rId === 'broad_jump' || rName.includes('broad') || rName.includes('standing jump')) && !rName.includes('vertical');
      }

      // Flamingo Balance
      if (tId === 'flamingo' || tName.includes('flamingo')) {
        return rId === 'flamingo' || rName.includes('flamingo');
      }

      // Plate Tapping
      if (tId === 'plate_tapping' || tName.includes('plate tap') || tName.includes('tapping')) {
        return rId === 'plate_tapping' || rName.includes('plate') || rName.includes('tapping');
      }

      return false;
    });
  };

  useEffect(() => {
    let unsubStudents: (() => void) | undefined;
    let unsubResults: (() => void) | undefined;

    const fetchProfileData = async () => {
      if (auth.currentUser) {
        const profile = await fitnessService.getSchoolMember(auth.currentUser.uid);
        setUserProfile(profile);
        
        try {
          const isAdmin = profile?.role === 'admin';
          const schoolId = profile?.schoolId;
          
          unsubStudents = fitnessService.subscribeToStudents(auth.currentUser.uid, schoolId, isAdmin, setStudents);
          unsubResults = fitnessService.subscribeToResults(auth.currentUser.uid, schoolId, isAdmin, (fetched) => {
            setAllResults(fetched);
          });
        } catch (err) {
          console.error("Error subscribing to data in FitnessTests:", err);
        }
      }
    };
    fetchProfileData();
    
    return () => {
      unsubStudents?.();
      unsubResults?.();
    };
  }, [auth.currentUser?.uid]);

  // When grade filter changes, auto-select corresponding battery and filter available tests
  useEffect(() => {
    if (selectedGradeFilter && selectedGradeFilter !== 'ALL') {
      const matchingBattery = fitnessService.getBatteryForGrade(selectedGradeFilter);
      if (matchingBattery) {
        if (!selectedBattery || selectedBattery.category !== matchingBattery.category) {
          setSelectedBattery(matchingBattery);
          const isCurrentTestValid = selectedTest && matchingBattery.tests.some(t => t.id === selectedTest.id);
          const defaultTest = isCurrentTestValid 
            ? selectedTest 
            : (matchingBattery.tests.find(t => t.id === 'pushups') || matchingBattery.tests[0]);
          setSelectedTest(defaultTest);
          if (testSelectionFilter !== 'all' && testSelectionFilter !== 'custom') {
            setTestSelectionFilter(defaultTest.id);
          }
          setCustomSelectedTestIds(prev => {
            const valid = prev.filter(id => matchingBattery.tests.some(t => t.id === id));
            return valid.length > 0 ? valid : [matchingBattery.tests[0].id, matchingBattery.tests[1]?.id || matchingBattery.tests[0].id];
          });
        }
      }
    }
  }, [selectedGradeFilter]);

  // Synchronize batch scores and saved indicators with database results
  useEffect(() => {
    const currentTests = selectedBattery ? selectedBattery.tests : (selectedTest ? [selectedTest] : []);
    if (currentTests.length === 0 || students.length === 0) return;

    setBatchScores(prev => {
      const next = { ...prev };
      students.forEach(student => {
        currentTests.forEach(testItem => {
          const cellKey = `${student.id}_${testItem.id}`;
          // Only populate if not in middle of unsaved user typing
          if (batchSavedStatus[cellKey] !== false) {
            const saved = findSavedResult(student.id, testItem.id, testItem.name, selectedTerm, allResults || []);
            if (saved && saved.value) {
              next[cellKey] = saved.value;
            } else if (allResults && allResults.length > 0) {
              // Clear stale value if not saved in current term
              delete next[cellKey];
            }
          }
        });
      });
      return next;
    });

    setBatchSavedStatus(prev => {
      const next = { ...prev };
      students.forEach(student => {
        currentTests.forEach(testItem => {
          const cellKey = `${student.id}_${testItem.id}`;
          if (prev[cellKey] !== false) {
            const saved = findSavedResult(student.id, testItem.id, testItem.name, selectedTerm, allResults || []);
            if (saved && saved.value) {
              next[cellKey] = true;
            } else {
              delete next[cellKey];
            }
          }
        });
      });
      return next;
    });
  }, [allResults, selectedTerm, selectedBattery, selectedTest, students]);

  // In single student mode, auto-fill testValue when student, test, or term changes
  useEffect(() => {
    if (selectedStudentId && selectedTest) {
      const saved = findSavedResult(selectedStudentId, selectedTest.id, selectedTest.name, selectedTerm, allResults);
      if (saved && saved.value) {
        setTestValue(saved.value);
        setIsSaved(true);
        setResult(null);
      } else {
        setTestValue('');
        setIsSaved(false);
        setResult(null);
      }
    }
  }, [selectedStudentId, selectedTest?.id, selectedTerm, allResults]);

  useEffect(() => {
    let unsubStudentResults: (() => void) | undefined;
    if (selectedStudentId && auth.currentUser) {
      const student = students.find(s => s.id === selectedStudentId);
      const schoolId = student?.schoolId || userProfile?.schoolId;
      unsubStudentResults = fitnessService.subscribeToStudentResults(selectedStudentId, schoolId, setStudentResults);
    } else {
      setStudentResults([]);
    }
    return () => unsubStudentResults?.();
  }, [selectedStudentId, students, userProfile, auth.currentUser?.uid]);

  /**
   * Generates a printer-friendly, CBSE-compliant PDF report card for a single student's fitness results.
   */
  const generateStudentCbsePdfReportCard = (targetStudentId?: string) => {
    const studentIdToUse = targetStudentId || selectedStudentId;
    const student = students.find(s => s.id === studentIdToUse);

    // Basic details
    const name = student ? student.name : (selectedStudentId ? 'Student Record' : 'Student');
    const roll = student ? student.rollNumber : 'PE-' + Math.floor(1000 + Math.random() * 9000);
    const grade = student ? student.grade : (age ? (parseInt(age) > 5 ? (parseInt(age) - 5).toString() : '5') : 'N/A');
    const section = student ? student.section : 'A';
    const studentAgeVal = student ? student.age : age;
    const studentGenderVal = student ? student.gender : gender;

    const schoolName = userProfile?.schoolName || userProfile?.schoolId || 'CENTRAL BOARD OF SECONDARY EDUCATION (CBSE)';

    // Gather test results
    let combinedTests: Array<{
      testName: string;
      value: string;
      unit: string;
      term: string;
      rating: string;
      percentile: string | number;
      recommendation: string;
    }> = [];

    // Filter saved student results for this student
    const savedForStudent = studentResults.filter(r => r.studentId === studentIdToUse);

    if (savedForStudent.length > 0) {
      savedForStudent.forEach(r => {
        let displayVal = r.value;
        let unitStr = r.unit || '';
        let ratingStr = r.rating || 'Recorded';

        if (r.testId === 'bmi' || r.testName.toLowerCase().includes('bmi')) {
          const bmiRes = calculateExactBMI(r.value);
          displayVal = `${bmiRes.bmi} (${bmiRes.category})`;
          unitStr = 'kg/m²';
          ratingStr = bmiRes.category;
        }

        combinedTests.push({
          testName: r.testName,
          value: displayVal,
          unit: unitStr,
          term: r.term || selectedTerm,
          rating: ratingStr,
          percentile: r.percentile !== undefined && r.percentile !== null && !isNaN(r.percentile) ? r.percentile : '-',
          recommendation: 'Maintains active participation in physical activities under CBSE HPE guidelines.'
        });
      });
    }

    // Append current assessment result if available
    if (result && result.tests) {
      result.tests.forEach(t => {
        const exists = combinedTests.some(c => c.testName === t.testName && c.term === selectedTerm);
        if (!exists) {
          combinedTests.push({
            testName: t.testName,
            value: t.score,
            unit: selectedTest?.unit || '',
            term: selectedTerm,
            rating: t.rating,
            percentile: t.percentile || '-',
            recommendation: t.recommendation || 'Regular training recommended.'
          });
        }
      });
    }

    // Fallback if no test result exists yet
    if (combinedTests.length === 0 && selectedTest) {
      combinedTests.push({
        testName: selectedTest.name,
        value: testValue || 'Recorded',
        unit: selectedTest.unit || '',
        term: selectedTerm,
        rating: 'Recorded',
        percentile: '-',
        recommendation: 'Baseline assessment recorded under CBSE Khelo India Fitness Test battery.'
      });
    }

    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = doc.internal.pageSize.getWidth(); // 210
      const pageHeight = doc.internal.pageSize.getHeight(); // 297
      const margin = 12;
      const contentWidth = pageWidth - (margin * 2); // 186

      // Outer Page Frame
      doc.setLineWidth(0.6);
      doc.setDrawColor(30, 27, 75); // Deep Indigo
      doc.rect(margin - 2, margin - 2, contentWidth + 4, pageHeight - (margin * 2) + 4);

      doc.setLineWidth(0.2);
      doc.setDrawColor(203, 213, 225); // Slate 300
      doc.rect(margin, margin, contentWidth, pageHeight - (margin * 2));

      let currentY = margin + 4;

      // 1. Header Banner
      doc.setFillColor(30, 27, 75); // Deep Navy
      doc.rect(margin, currentY, contentWidth, 24, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.text('CENTRAL BOARD OF SECONDARY EDUCATION (CBSE)', pageWidth / 2, currentY + 7, { align: 'center' });

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('KHELO INDIA FITNESS TEST (KIFT) - STUDENT REPORT CARD', pageWidth / 2, currentY + 13, { align: 'center' });

      doc.setFontSize(8);
      doc.setTextColor(224, 231, 255);
      doc.text(`${schoolName.toUpperCase()} | SESSION: 2025-26 | PHASE: ${selectedTerm.toUpperCase()}`, pageWidth / 2, currentY + 19, { align: 'center' });

      currentY += 28;

      // 2. Student Profile Grid
      doc.setFillColor(248, 250, 252); // Slate 50
      doc.rect(margin, currentY, contentWidth, 26, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.rect(margin, currentY, contentWidth, 26, 'S');

      doc.setTextColor(30, 41, 59);
      doc.setFontSize(9);

      // Row 1
      doc.setFont('helvetica', 'bold');
      doc.text('Student Name:', margin + 4, currentY + 7);
      doc.setFont('helvetica', 'normal');
      doc.text(name, margin + 28, currentY + 7);

      doc.setFont('helvetica', 'bold');
      doc.text('Roll Number:', margin + 98, currentY + 7);
      doc.setFont('helvetica', 'normal');
      doc.text(roll, margin + 120, currentY + 7);

      doc.setFont('helvetica', 'bold');
      doc.text('Class & Sec:', margin + 148, currentY + 7);
      doc.setFont('helvetica', 'normal');
      doc.text(`${grade} - ${section}`, margin + 168, currentY + 7);

      // Row 2
      doc.setFont('helvetica', 'bold');
      doc.text('Age / Gender:', margin + 4, currentY + 15);
      doc.setFont('helvetica', 'normal');
      doc.text(`${studentAgeVal} Yrs / ${studentGenderVal}`, margin + 28, currentY + 15);

      doc.setFont('helvetica', 'bold');
      doc.text('Date of Test:', margin + 98, currentY + 15);
      doc.setFont('helvetica', 'normal');
      doc.text(new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }), margin + 120, currentY + 15);

      doc.setFont('helvetica', 'bold');
      doc.text('CBSE Battery:', margin + 148, currentY + 15);
      doc.setFont('helvetica', 'normal');
      const batteryCategory = selectedBattery?.category || fitnessService.getBatteryForGrade(grade)?.category || 'Middle School';
      doc.text(batteryCategory, margin + 170, currentY + 15);

      // Row 3
      doc.setFont('helvetica', 'bold');
      doc.text('HPE Status:', margin + 4, currentY + 22);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(16, 185, 129); // Emerald green
      doc.text('Compliant with CBSE Health & Physical Education (HPE) Mainstream Guidelines', margin + 28, currentY + 22);

      currentY += 32;

      // 3. Fitness Battery Results Table Header
      doc.setFillColor(49, 46, 129); // Indigo 900
      doc.rect(margin, currentY, contentWidth, 8, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);

      doc.text('S.NO', margin + 3, currentY + 5.5);
      doc.text('FITNESS TEST PARAMETER', margin + 14, currentY + 5.5);
      doc.text('TERM', margin + 74, currentY + 5.5);
      doc.text('SCORE / VALUE', margin + 98, currentY + 5.5);
      doc.text('PERCENTILE', margin + 130, currentY + 5.5);
      doc.text('CBSE RATING', margin + 154, currentY + 5.5);

      currentY += 8;

      // Rows
      doc.setFontSize(8);

      combinedTests.forEach((t, idx) => {
        const isEven = idx % 2 === 0;
        doc.setFillColor(isEven ? 255 : 248, isEven ? 255 : 250, isEven ? 255 : 252);
        doc.rect(margin, currentY, contentWidth, 8, 'F');
        doc.setDrawColor(226, 232, 240);
        doc.rect(margin, currentY, contentWidth, 8, 'S');

        doc.setTextColor(51, 65, 85);

        // S.No
        doc.setFont('helvetica', 'normal');
        doc.text(String(idx + 1), margin + 4, currentY + 5.5);

        // Name
        doc.setFont('helvetica', 'bold');
        doc.text(t.testName.length > 32 ? t.testName.substring(0, 30) + '...' : t.testName, margin + 14, currentY + 5.5);

        // Term
        doc.setFont('helvetica', 'normal');
        doc.text(t.term, margin + 74, currentY + 5.5);

        // Score
        doc.setFont('helvetica', 'bold');
        doc.text(`${t.value} ${t.unit}`, margin + 98, currentY + 5.5);

        // Percentile
        doc.setFont('helvetica', 'normal');
        const pctStr = t.percentile && t.percentile !== '-' ? `${t.percentile} %ile` : 'Standard';
        doc.text(pctStr, margin + 130, currentY + 5.5);

        // Rating
        const ratingStr = t.rating || 'Recorded';
        if (ratingStr === 'Elite' || ratingStr === 'Excellent') {
          doc.setTextColor(21, 128, 61);
        } else if (ratingStr === 'Good' || ratingStr === 'Satisfactory') {
          doc.setTextColor(3, 105, 161);
        } else if (ratingStr === 'Needs Improvement') {
          doc.setTextColor(185, 28, 28);
        } else {
          doc.setTextColor(71, 85, 105);
        }
        doc.setFont('helvetica', 'bold');
        doc.text(ratingStr, margin + 154, currentY + 5.5);

        currentY += 8;
      });

      currentY += 4;

      // 4. PE Teacher Assessment Box
      doc.setFillColor(238, 242, 255);
      doc.rect(margin, currentY, contentWidth, 32, 'F');
      doc.setDrawColor(199, 210, 254);
      doc.rect(margin, currentY, contentWidth, 32, 'S');

      doc.setTextColor(49, 46, 129);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text("PHYSICAL EDUCATION TEACHER'S ASSESSMENT & GUIDANCE", margin + 4, currentY + 6);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(30, 41, 59);

      const summary = result?.overallSummary || 
        `${name} shows satisfactory physical growth and active participation across test batteries. Recommended to maintain daily 30-minute moderate physical activity and hydration to enhance agility and cardiovascular stamina as specified under CBSE HPE Strand 1 guidelines.`;

      const splitText = doc.splitTextToSize(summary, contentWidth - 8);
      doc.text(splitText, margin + 4, currentY + 12);

      currentY += 38;

      // 5. CBSE Descriptors Legend
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, currentY, contentWidth, 18, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.rect(margin, currentY, contentWidth, 18, 'S');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      doc.text("CBSE KIFT PERFORMANCE DESCRIPTORS:", margin + 4, currentY + 5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.text("• Elite / Excellent (>85th Percentile): Superior physical capacity & motor coordination.", margin + 4, currentY + 9);
      doc.text("• Good / Satisfactory (50th - 85th Percentile): Healthy physical standard meeting national benchmarks.", margin + 4, currentY + 13);
      doc.text("• Needs Improvement (<50th Percentile): Target area requiring guided physical training & practice.", margin + 4, currentY + 17);

      currentY += 24;

      // 6. Signatures
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.3);

      const colW = contentWidth / 3;

      // Sig 1
      doc.line(margin + 6, currentY + 18, margin + colW - 6, currentY + 18);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(30, 41, 59);
      doc.text("Physical Education Teacher", margin + colW / 2, currentY + 22, { align: 'center' });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.text("Signature & Date", margin + colW / 2, currentY + 26, { align: 'center' });

      // Sig 2
      doc.line(margin + colW + 6, currentY + 18, margin + (colW * 2) - 6, currentY + 18);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text("Class Teacher", margin + (colW * 1.5), currentY + 22, { align: 'center' });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.text("Signature & Remarks", margin + (colW * 1.5), currentY + 26, { align: 'center' });

      // Sig 3
      doc.line(margin + (colW * 2) + 6, currentY + 18, margin + contentWidth - 6, currentY + 18);
      doc.setFont('helvetica', 'bold');
      doc.text("Principal / Headmaster", margin + (colW * 2.5), currentY + 22, { align: 'center' });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.text("Signature & School Seal", margin + (colW * 2.5), currentY + 26, { align: 'center' });

      // Footer
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      doc.text("Issued under CBSE Circular No. Acad-11/2018 for Mainstreaming Health & Physical Education (HPE) and Khelo India Fitness Assessment Protocols.", pageWidth / 2, pageHeight - margin - 3, { align: 'center' });

      const fileName = `${name.replace(/\s+/g, '_')}_CBSE_Fitness_Report_Card.pdf`;
      doc.save(fileName);
      toast.success(`CBSE Fitness Report Card generated for ${name}!`);
    } catch (err: any) {
      console.error("PDF generation failed:", err);
      toast.error(`Failed to generate PDF: ${err.message || 'Error occurred'}`);
    }
  };

  const handleBatteryClick = (battery: KIFTBattery) => {
    setSelectedBattery(battery);
    const defaultTest = (battery.category === 'Middle School' || battery.category === 'Secondary' || battery.category === 'Senior Secondary')
      ? (battery.tests.find(t => t.id === 'pushups') || battery.tests[0])
      : battery.tests[0];
    setSelectedTest(defaultTest);
    setTestSelectionFilter('all');
    setCustomSelectedTestIds(battery.tests.map(t => t.id));
    setResult(null);
    if (selectedGradeFilter !== 'ALL' && !battery.grades.some(g => fitnessService.isGradeMatching(selectedGradeFilter, g))) {
      setSelectedGradeFilter(battery.grades[0]);
    }
  };

  const handleGradeFilterChange = (newGrade: string) => {
    setSelectedGradeFilter(newGrade);
    if (newGrade && newGrade !== 'ALL') {
      const matchingBattery = fitnessService.getBatteryForGrade(newGrade);
      if (matchingBattery) {
        setSelectedBattery(matchingBattery);
        const isCurrentTestValid = selectedTest && matchingBattery.tests.some(t => t.id === selectedTest.id);
        const defaultTest = isCurrentTestValid 
          ? selectedTest 
          : (matchingBattery.tests.find(t => t.id === 'pushups') || matchingBattery.tests[0]);
        setSelectedTest(defaultTest);
        setCustomSelectedTestIds(prev => {
          const valid = prev.filter(id => matchingBattery.tests.some(t => t.id === id));
          return valid.length > 0 ? valid : matchingBattery.tests.map(t => t.id);
        });
      }
    }
  };

  const handleTestClick = (test: KIFTTest) => {
    setSelectedTest(test);
    setTestSelectionFilter('custom');
    setCustomSelectedTestIds([test.id]);
    setResult(null);
    setTestValue('');
  };

  /**
   * Returns the list of tests to display and record in the active view:
   * - 1 focused single test (e.g. pushups, 50m dash)
   * - Picked 1, 2, 3+ custom selected tests
   * - Full 8-test battery spreadsheet
   */
  const getActiveTests = (): KIFTTest[] => {
    if (!selectedBattery || !selectedBattery.tests || selectedBattery.tests.length === 0) {
      return selectedTest ? [selectedTest] : [];
    }
    if (testSelectionFilter === 'all') {
      return selectedBattery.tests;
    }
    if (testSelectionFilter && testSelectionFilter !== 'custom' && testSelectionFilter !== 'single') {
      const matched = selectedBattery.tests.find(t => t.id === testSelectionFilter);
      if (matched) return [matched];
    }
    const filtered = selectedBattery.tests.filter(t => customSelectedTestIds.includes(t.id));
    if (filtered.length > 0) return filtered;
    if (selectedTest && selectedBattery.tests.some(t => t.id === selectedTest.id)) {
      return [selectedTest];
    }
    return [selectedBattery.tests[0]];
  };

  /**
   * Helper to increment/decrement repetition or numeric scores directly with quick touch steppers
   */
  const handleQuickAdjustScore = (studentId: string, testItem: KIFTTest, delta: number) => {
    const cellKey = `${studentId}_${testItem.id}`;
    const currentValStr = batchScores[cellKey] ?? '';
    let currentNum = parseFloat(currentValStr);
    if (isNaN(currentNum)) currentNum = 0;
    const nextNum = Math.max(0, currentNum + delta);
    const nextValStr = nextNum.toString();
    
    setBatchScores(prev => ({
      ...prev,
      [cellKey]: nextValStr
    }));
    setBatchSavedStatus(prev => ({
      ...prev,
      [cellKey]: false
    }));
  };

  const handleStudentChange = (id: string) => {
    setSelectedStudentId(id);
    const student = students.find(s => s.id === id);
    if (student) {
      setAge(student.age.toString());
      setGender(student.gender);
      setSelectedGradeFilter(student.grade);
      
      // Automatically select the correct battery for the student's grade (Middle School for classes 6, 7, 8)
      const battery = fitnessService.getBatteryForGrade(student.grade);
      if (battery) {
        setSelectedBattery(battery);
        const isCurrentTestValid = selectedTest && battery.tests.some(t => t.id === selectedTest.id);
        const defaultTest = isCurrentTestValid 
          ? selectedTest 
          : (battery.tests.find(t => t.id === 'pushups') || battery.tests[0]);
        setSelectedTest(defaultTest);
        setTestSelectionFilter(defaultTest.id);
        setCustomSelectedTestIds([defaultTest.id]);
      }
    }
  };

  const handleCalculate = async () => {
    if (!selectedBattery || !selectedTest || !testValue) {
      setError("Please enter a result for the test.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await evaluateFitnessTests(age, gender, selectedBattery.category, selectedTest.name, testValue);
      setResult(data);
    } catch (e: any) {
      console.error(e);
      setError(e.message || "Assessment failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDirectly = async () => {
    if (!auth.currentUser || !selectedTest || !testValue) return;

    const student = students.find(s => s.id === selectedStudentId);
    let schoolId = student?.schoolId || userProfile?.schoolId;

    if (!schoolId) {
      if (isAdminUser(auth.currentUser.email)) {
        schoolId = 'master_registry';
      } else {
        schoolId = `personal_${auth.currentUser.uid}`;
      }
    }

    setLoading(true);
    try {
      let directRating = 'Recorded';
      if (selectedTest.id === 'bmi' || selectedTest.name.toLowerCase().includes('bmi')) {
        const bmiRes = calculateExactBMI(testValue);
        directRating = bmiRes.category;
      }

      const existing = findSavedResult(selectedStudentId || 'manual_entry', selectedTest.id, selectedTest.name, selectedTerm, allResults);
      const resultId = existing ? existing.id : (selectedStudentId ? `${selectedStudentId}_${selectedTest.id}_${selectedTerm.replace(/\s+/g, '_')}` : Math.random().toString(36).substr(2, 9));

      await fitnessService.saveResult({
        id: resultId,
        teacherId: auth.currentUser.uid,
        schoolId: schoolId,
        studentId: selectedStudentId || 'manual_entry',
        testId: selectedTest.id,
        testName: selectedTest.name,
        value: testValue,
        unit: selectedTest.unit,
        date: new Date().toISOString(),
        term: selectedTerm,
        rating: directRating,
        percentile: 0
      });

      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
      setError(null);
    } catch (err: any) {
      console.error("Direct save failed:", err);
      const errorMsg = formatFitnessError(err);
      setError(errorMsg + " (Verification failed - check school ID)");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!result) return;

    if (!auth.currentUser) {
      setError("Please log in as a teacher to save results to your school database.");
      return;
    }
    
    try {
      // Save to general history
      storageService.saveItem({
        type: 'Tool',
        title: `${selectedTest?.name} Assessment`,
        content: result,
        metadata: { age, gender, category: selectedBattery?.category, test: selectedTest?.name, value: testValue }
      });

      // Save to school database if student is selected
      if (selectedStudentId || userProfile?.schoolId || isAdminUser(auth.currentUser.email)) {
        const student = students.find(s => s.id === selectedStudentId);
        let schoolId = student?.schoolId || userProfile?.schoolId;
        
        if (!schoolId) {
          if (isAdminUser(auth.currentUser.email)) {
            schoolId = 'master_registry';
          } else {
            schoolId = `personal_${auth.currentUser.uid}`;
          }
        }

        const existing = findSavedResult(selectedStudentId || 'manual_entry', selectedTest?.id || '', selectedTest?.name || '', selectedTerm, allResults);
        const resultId = existing ? existing.id : (selectedStudentId ? `${selectedStudentId}_${selectedTest?.id}_${selectedTerm.replace(/\s+/g, '_')}` : Math.random().toString(36).substr(2, 9));

        await fitnessService.saveResult({
          id: resultId,
          teacherId: auth.currentUser.uid,
          schoolId: schoolId,
          studentId: selectedStudentId || 'manual_entry',
          testId: selectedTest?.id || '',
          testName: selectedTest?.name || '',
          value: testValue,
          unit: selectedTest?.unit || '',
          date: new Date().toISOString(),
          term: selectedTerm,
          rating: result.tests[0]?.rating,
          percentile: parseFloat(result.tests[0]?.percentile)
        });
      }

      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
      setError(null);
    } catch (err: any) {
      console.error("AI Save failed:", err);
      const errorMsg = formatFitnessError(err);
      setError(errorMsg + " (AI Save error)");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAndNextStudent = async () => {
    if (!testValue) return;
    if (!result) {
      setLoading(true);
      try {
        await handleSaveDirectly();
      } finally {
        setLoading(false);
      }
    } else {
      handleSave();
    }

    // Advance to next student in filtered list
    const currentIdx = filteredStudentsForSelect.findIndex(s => s.id === selectedStudentId);
    if (currentIdx !== -1 && currentIdx + 1 < filteredStudentsForSelect.length) {
      const nextStudent = filteredStudentsForSelect[currentIdx + 1];
      handleStudentChange(nextStudent.id);
      setTestValue('');
      setResult(null);
      toast.success(`Advanced to next student: ${nextStudent.name}`);
    } else {
      toast.success("Saved! Reached end of student list.");
    }
  };

  const handleBatchSave = async () => {
    if (!auth.currentUser) {
      setError("Please log in before saving class scores.");
      return;
    }

    const currentTests = getActiveTests();
    if (currentTests.length === 0) {
      setError("Please select a fitness test or battery first.");
      return;
    }

    setBatchSaving(true);
    setError(null);
    let savedCount = 0;

    try {
      for (const student of filteredStudentsForSelect) {
        let schoolId = student.schoolId || userProfile?.schoolId;
        if (!schoolId) {
          schoolId = isAdminUser(auth.currentUser.email) ? 'master_registry' : `personal_${auth.currentUser.uid}`;
        }

        for (const testItem of currentTests) {
          const cellKey = `${student.id}_${testItem.id}`;
          const val = (batchScores[cellKey] || '').trim();
          if (val) {
            let cellRating = 'Recorded';
            if (testItem.id === 'bmi' || testItem.name.toLowerCase().includes('bmi')) {
              cellRating = calculateExactBMI(val).category;
            }

            const existing = findSavedResult(student.id, testItem.id, testItem.name, selectedTerm, allResults);
            const resultId = existing ? existing.id : `${student.id}_${testItem.id}_${selectedTerm.replace(/\s+/g, '_')}`;

            await fitnessService.saveResult({
              id: resultId,
              teacherId: auth.currentUser.uid,
              schoolId: schoolId,
              studentId: student.id,
              testId: testItem.id,
              testName: testItem.name,
              value: val,
              unit: testItem.unit,
              date: new Date().toISOString(),
              term: selectedTerm,
              rating: cellRating,
              percentile: 0
            });

            setBatchSavedStatus(prev => ({
              ...prev,
              [cellKey]: true
            }));
            savedCount++;
          }
        }
      }

      if (savedCount === 0) {
        setError("Please enter scores in the field boxes before clicking save.");
        return;
      }

      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3500);
      toast.success(`Successfully saved ${savedCount} fitness test scores!`);
    } catch (err: any) {
      console.error("Batch save failed:", err);
      setError(formatFitnessError(err));
    } finally {
      setBatchSaving(false);
    }
  };

  const handleSingleRowSave = async (student: Student, testItem?: KIFTTest) => {
    if (!auth.currentUser) return;
    const currentTests = testItem ? [testItem] : getActiveTests();
    if (currentTests.length === 0) return;

    try {
      let schoolId = student.schoolId || userProfile?.schoolId;
      if (!schoolId) {
        schoolId = isAdminUser(auth.currentUser.email) ? 'master_registry' : `personal_${auth.currentUser.uid}`;
      }

      let rowSavedCount = 0;
      for (const t of currentTests) {
        const cellKey = `${student.id}_${t.id}`;
        const val = (batchScores[cellKey] || '')?.trim();
        if (val) {
          let singleRating = 'Recorded';
          if (t.id === 'bmi' || t.name.toLowerCase().includes('bmi')) {
            singleRating = calculateExactBMI(val).category;
          }

          const existing = findSavedResult(student.id, t.id, t.name, selectedTerm, allResults);
          const resultId = existing ? existing.id : `${student.id}_${t.id}_${selectedTerm.replace(/\s+/g, '_')}`;

          await fitnessService.saveResult({
            id: resultId,
            teacherId: auth.currentUser.uid,
            schoolId: schoolId,
            studentId: student.id,
            testId: t.id,
            testName: t.name,
            value: val,
            unit: t.unit,
            date: new Date().toISOString(),
            term: selectedTerm,
            rating: singleRating,
            percentile: 0
          });

          setBatchSavedStatus(prev => ({
            ...prev,
            [cellKey]: true
          }));
          rowSavedCount++;
        }
      }

      if (rowSavedCount > 0) {
        toast.success(`Saved ${rowSavedCount} score(s) for ${student.name}`);
      } else {
        toast.error(`Please enter a score for ${student.name} first`);
      }
    } catch (err: any) {
      toast.error("Failed to save score");
    }
  };

  const handleExportCsvTemplate = () => {
    if (filteredStudentsForSelect.length === 0) {
      toast.error("No students in current filter to export.");
      return;
    }
    const currentTests = getActiveTests();
    const headers = ['Roll Number', 'Student Name', 'Grade', 'Section', 'Gender', ...currentTests.map(t => `${t.name} (${t.unit})`)];
    
    const rows = filteredStudentsForSelect.map(s => [
      s.rollNumber || '',
      `"${s.name}"`,
      s.grade || '',
      s.section || '',
      s.gender || '',
      ...currentTests.map(t => batchScores[`${s.id}_${t.id}`] || '')
    ]);

    const csvStr = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Fitness_Data_Grid_Gr${selectedGradeFilter}_Sec${selectedSectionFilter}_${selectedTerm}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Spreadsheet CSV exported successfully!");
  };

  const handleImportCsv = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        if (!text) return;
        const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
        if (lines.length < 2) {
          toast.error("CSV file is empty or missing data rows.");
          return;
        }

        const currentTests = getActiveTests();
        let importedCount = 0;

        for (let i = 1; i < lines.length; i++) {
          const row = lines[i].split(',').map(cell => cell.trim().replace(/^"|"$/g, ''));
          const rollNum = row[0];
          const studentName = row[1]?.toLowerCase();

          const matchedStudent = filteredStudentsForSelect.find(s => 
            (rollNum && s.rollNumber && s.rollNumber === rollNum) ||
            (studentName && s.name.toLowerCase() === studentName)
          );

          if (matchedStudent) {
            currentTests.forEach((t, tIdx) => {
              const val = row[5 + tIdx];
              if (val && val !== '') {
                setBatchScores(prev => ({
                  ...prev,
                  [`${matchedStudent.id}_${t.id}`]: val
                }));
                setBatchSavedStatus(prev => ({
                  ...prev,
                  [`${matchedStudent.id}_${t.id}`]: false
                }));
                importedCount++;
              }
            });
          }
        }

        if (importedCount > 0) {
          toast.success(`Imported ${importedCount} scores from CSV!`);
        } else {
          toast.error("Could not match student names or roll numbers in the uploaded CSV.");
        }
      } catch (err) {
        console.error("CSV Parse Error:", err);
        toast.error("Failed to parse CSV file.");
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  /**
   * Sequential Data Entry Navigation: Auto-focuses next or previous student input field
   * and smoothly scrolls the card/row into center view.
   */
  const focusNextStudent = (
    studentIdx: number,
    testIdx: number,
    totalStudents: number,
    totalTests: number,
    direction: 'next' | 'prev' = 'next'
  ) => {
    let nextStudentIdx = studentIdx;
    let nextTestIdx = testIdx;

    if (direction === 'next') {
      if (studentIdx + 1 < totalStudents) {
        nextStudentIdx = studentIdx + 1;
      } else if (testIdx + 1 < totalTests) {
        // Reached bottom of current test column in multi-test mode
        nextStudentIdx = 0;
        nextTestIdx = testIdx + 1;
        toast.success("Completed column! Auto-advancing to top of next test.");
      } else {
        toast.success("🎉 Reached end of student list! All scores ready.");
        return;
      }
    } else {
      if (studentIdx > 0) {
        nextStudentIdx = studentIdx - 1;
      } else if (testIdx > 0) {
        nextStudentIdx = totalStudents - 1;
        nextTestIdx = testIdx - 1;
      } else {
        return;
      }
    }

    setActiveFocusCoord({ sIdx: nextStudentIdx, tIdx: nextTestIdx });

    const inputId = `grid-input-${nextStudentIdx}-${nextTestIdx}`;
    const targetEl = document.getElementById(inputId) as HTMLInputElement;
    if (targetEl) {
      targetEl.focus();
      targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => {
        targetEl.select?.();
      }, 40);
    }
  };

  const handleGridKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    studentIdx: number,
    testIdx: number,
    totalStudents: number,
    totalTests: number
  ) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (e.shiftKey) {
        focusNextStudent(studentIdx, testIdx, totalStudents, totalTests, 'prev');
      } else {
        focusNextStudent(studentIdx, testIdx, totalStudents, totalTests, 'next');
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      focusNextStudent(studentIdx, testIdx, totalStudents, totalTests, 'next');
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      focusNextStudent(studentIdx, testIdx, totalStudents, totalTests, 'prev');
    }
  };

  // Get unique grades and sections for filter dropdowns
  const uniqueGrades = Array.from(new Set(students.map(s => s.grade)))
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

  const uniqueSections = Array.from(new Set(students.map(s => s.section)))
    .filter(Boolean)
    .sort();

  // Filter students based on grade, section, and roll number or name search
  const filteredStudentsForSelect = students.filter(s => {
    const matchesGrade = !selectedGradeFilter || selectedGradeFilter === 'ALL' || fitnessService.isGradeMatching(s.grade, selectedGradeFilter);
    const matchesSection = !selectedSectionFilter || selectedSectionFilter === 'ALL' || s.section === selectedSectionFilter;
    const queryLower = studentSearchQuery.toLowerCase().trim();
    const matchesSearch = !queryLower || 
      s.name.toLowerCase().includes(queryLower) || 
      (s.rollNumber && s.rollNumber.toLowerCase().includes(queryLower));
    return matchesGrade && matchesSection && matchesSearch;
  }).sort((a, b) => {
    if (a.rollNumber && b.rollNumber) {
      return a.rollNumber.localeCompare(b.rollNumber, undefined, { numeric: true });
    }
    return a.name.localeCompare(b.name);
  });

  // Count unsaved batch scores across all visible students and tests
  const currentTestsForCount = getActiveTests();
  const unsavedBatchCount = filteredStudentsForSelect.reduce((count, s) => {
    let studentUnsaved = false;
    currentTestsForCount.forEach(t => {
      const cellKey = `${s.id}_${t.id}`;
      const val = (batchScores[cellKey] || '').trim();
      const isSaved = batchSavedStatus[cellKey] || false;
      if (val && !isSaved) {
        studentUnsaved = true;
      }
    });
    return count + (studentUnsaved ? 1 : 0);
  }, 0);

  // Ensure currently selected student is always presented in the dropdown
  const isSelectedInFiltered = filteredStudentsForSelect.some(s => s.id === selectedStudentId);
  const finalStudentsList = [...filteredStudentsForSelect];
  if (selectedStudentId && !isSelectedInFiltered) {
    const currentStudent = students.find(s => s.id === selectedStudentId);
    if (currentStudent) {
      finalStudentsList.unshift(currentStudent);
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in pb-32 sm:pb-36">
      {/* Top Level Nav toggle */}
      <div className="flex bg-slate-100 p-1.5 rounded-2xl w-fit mb-8 shadow-inner border border-slate-200/60">
        <button 
          onClick={() => setActiveTab('fitness')}
          className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-black uppercase text-xs tracking-widest transition-all ${
            activeTab === 'fitness' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Activity size={16} />
          <span>KIFT Fitness Logs</span>
        </button>
        <button 
          onClick={() => setActiveTab('games')}
          className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-black uppercase text-xs tracking-widest transition-all ${
            activeTab === 'games' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Gamepad2 size={16} />
          <span>Games Proficiency</span>
        </button>
      </div>

      {activeTab === 'games' ? (
        <GamesProficiencyGenerator students={students} userProfile={userProfile} />
      ) : (
        <div className="space-y-8">
          {/* School Setup Warning */}
          {!userProfile?.schoolId && (
            <div className="bg-orange-50 border-2 border-orange-100 p-6 rounded-[2rem] flex items-start gap-4">
              <AlertCircle className="text-orange-600 flex-shrink-0" size={24} />
              <div>
                <h4 className="font-black text-orange-900 uppercase tracking-tight mb-1 text-sm">School Profile Required</h4>
                <p className="text-orange-700/70 text-xs font-medium leading-relaxed">
                  To save fitness results, you must first register your school in the <strong className="text-orange-900">School Admin</strong> tab. 
                  Currently, results can only be analyzed but not saved to the permanent database.
                </p>
              </div>
            </div>
          )}

          {/* Header */}
          <div className="bg-indigo-900 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden">
            <div className="relative z-10 max-w-2xl">
              <h2 className="text-4xl font-black mb-4 uppercase tracking-tighter">Student Fitness Assessment</h2>
              <p className="text-indigo-200 text-lg font-medium leading-relaxed">
                Standardized Khelo India (KIFT) and physical literacy batteries for Primary to Senior Secondary grades.
              </p>
            </div>
            <Trophy className="absolute right-[-20px] bottom-[-40px] w-64 h-64 text-white/10 rotate-12" />
          </div>

          {!selectedBattery ? (
        <div className="space-y-6">
          {/* Quick Grade Filter Bar */}
          <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                  <Filter size={16} className="text-indigo-600" />
                  <span>Jump Directly by Class / Grade</span>
                </h3>
                <p className="text-xs text-slate-500 font-medium">Select your grade to automatically filter tests and load the corresponding CBSE KIFT battery.</p>
              </div>
              <span className="text-[10px] font-black text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-full uppercase tracking-wider">
                Middle School (Gr 6-8): Includes Modified Push-Ups
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 pt-1">
              <button
                onClick={() => handleGradeFilterChange('1')}
                className="p-3.5 min-h-[56px] bg-slate-50 hover:bg-indigo-50 hover:border-indigo-300 border border-slate-200 rounded-2xl text-left transition-all group cursor-pointer active:scale-98"
              >
                <div className="text-[10.5px] font-black text-slate-400 group-hover:text-indigo-600 uppercase tracking-widest">Classes 1–3</div>
                <div className="text-xs sm:text-sm font-black text-slate-800 group-hover:text-indigo-900">Primary Battery</div>
              </button>

              <button
                onClick={() => handleGradeFilterChange('4')}
                className="p-3.5 min-h-[56px] bg-slate-50 hover:bg-indigo-50 hover:border-indigo-300 border border-slate-200 rounded-2xl text-left transition-all group cursor-pointer active:scale-98"
              >
                <div className="text-[10.5px] font-black text-slate-400 group-hover:text-indigo-600 uppercase tracking-widest">Classes 4–5</div>
                <div className="text-xs sm:text-sm font-black text-slate-800 group-hover:text-indigo-900">Upper Primary</div>
              </button>

              <button
                onClick={() => handleGradeFilterChange('6')}
                className="p-3.5 min-h-[56px] bg-indigo-50/90 hover:bg-indigo-100 border-2 border-indigo-300 rounded-2xl text-left transition-all group cursor-pointer shadow-sm active:scale-98"
              >
                <div className="text-[10.5px] font-black text-indigo-700 uppercase tracking-widest flex items-center gap-1">
                  <span>Classes 6–8</span>
                  <span className="bg-indigo-600 text-white text-[8.5px] px-1.5 py-0.5 rounded font-black">POPULAR</span>
                </div>
                <div className="text-xs sm:text-sm font-black text-indigo-950">Middle School (Push-Ups)</div>
              </button>

              <button
                onClick={() => handleGradeFilterChange('9')}
                className="p-3.5 min-h-[56px] bg-slate-50 hover:bg-indigo-50 hover:border-indigo-300 border border-slate-200 rounded-2xl text-left transition-all group cursor-pointer active:scale-98"
              >
                <div className="text-[10.5px] font-black text-slate-400 group-hover:text-indigo-600 uppercase tracking-widest">Classes 9–10</div>
                <div className="text-xs sm:text-sm font-black text-slate-800 group-hover:text-indigo-900">Secondary Battery</div>
              </button>

              <button
                onClick={() => handleGradeFilterChange('11')}
                className="p-3.5 min-h-[56px] bg-slate-50 hover:bg-indigo-50 hover:border-indigo-300 border border-slate-200 rounded-2xl text-left transition-all group cursor-pointer active:scale-98"
              >
                <div className="text-[10.5px] font-black text-slate-400 group-hover:text-indigo-600 uppercase tracking-widest">Classes 11–12</div>
                <div className="text-xs sm:text-sm font-black text-slate-800 group-hover:text-indigo-900">Senior Secondary</div>
              </button>
            </div>

            {/* Quick numeric buttons */}
            <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-100">
              <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest mr-1">Quick Grade:</span>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(gr => {
                const isMiddle = gr >= 6 && gr <= 8;
                return (
                  <button
                    key={gr}
                    onClick={() => handleGradeFilterChange(gr.toString())}
                    className={`min-w-[44px] min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center active:scale-95 ${
                      isMiddle 
                        ? 'bg-indigo-100 text-indigo-900 hover:bg-indigo-200 border-2 border-indigo-300 shadow-xs' 
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                    }`}
                    title={isMiddle ? `Class ${gr} (Middle School - Modified Push-Ups)` : `Class ${gr}`}
                  >
                    Class {gr}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Batteries Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {KIFT_BATTERIES.map((battery) => (
            <button
              key={battery.category}
              onClick={() => handleBatteryClick(battery)}
              className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-xl hover:scale-[1.02] transition-all text-left group"
            >
              <div className="p-4 bg-indigo-50 rounded-2xl w-fit mb-6 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <Activity size={32} />
              </div>
              <h3 className="font-black text-xl text-slate-800 mb-2 leading-tight uppercase tracking-tight">{battery.category}</h3>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-4">Grades: {battery.grades.join(', ')}</p>
              <p className="text-slate-500 text-sm font-medium leading-relaxed mb-6">{battery.objective}</p>
              <div className="mt-auto flex items-center text-indigo-600 text-xs font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                <span>View {battery.tests.length} Tests</span>
                <ChevronRight size={14} className="ml-1" />
              </div>
            </button>
          ))}
          </div>
        </div>
      ) : (
        /* Battery View */
        <div className="space-y-8">
          <button 
            onClick={() => setSelectedBattery(null)}
            className="flex items-center space-x-2 text-slate-400 hover:text-indigo-600 font-bold uppercase text-xs tracking-widest transition-colors"
          >
            <ArrowLeft size={16} />
            <span>Back to Batteries</span>
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Sidebar: Tests in Battery */}
            <div className="order-2 lg:order-1 lg:col-span-4 space-y-4">
              <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="p-2 bg-indigo-50 rounded-xl">
                    <Activity size={20} className="text-indigo-600" />
                  </div>
                  <h3 className="font-black text-lg text-slate-800 uppercase tracking-tight">{selectedBattery.category} Tests</h3>
                </div>
                <div className="space-y-2">
                  {selectedBattery.tests.map((test) => (
                    <div 
                      key={test.id}
                      className={`p-3 rounded-xl transition-all flex items-center justify-between group ${
                        selectedTest?.id === test.id 
                          ? 'bg-indigo-600 text-white shadow-lg' 
                          : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <button
                        onClick={() => handleTestClick(test)}
                        className="flex-1 text-left flex flex-col cursor-pointer"
                      >
                        <span className="font-bold text-sm leading-tight">{test.name}</span>
                        {test.duration && (
                          <span className={`text-[10px] font-black uppercase tracking-wider mt-1 flex items-center gap-1 ${
                            selectedTest?.id === test.id ? 'text-indigo-200' : 'text-slate-500'
                          }`}>
                            <Timer size={11} />
                            {test.duration}
                          </span>
                        )}
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveVideoTest(test);
                        }}
                        className={`p-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shrink-0 ml-1.5 ${
                          selectedTest?.id === test.id 
                            ? 'bg-[#D4A017] hover:bg-amber-400 text-slate-950 shadow-sm' 
                            : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/80'
                        }`}
                        title="Watch Official Video Demonstration"
                      >
                        <Play size={12} className="fill-current" />
                        <span className="text-[10px] font-extrabold hidden sm:inline uppercase">Video</span>
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveGuideTest(test);
                        }}
                        className={`p-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shrink-0 ml-1 ${
                          selectedTest?.id === test.id 
                            ? 'bg-white/20 hover:bg-white/30 text-white' 
                            : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700'
                        }`}
                        title="View Official CBSE Test Guide & Rules"
                      >
                        <Info size={14} />
                        <span className="text-[10px] font-extrabold hidden sm:inline uppercase">Guide</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {selectedTest && (
                <div className="bg-indigo-50 p-6 rounded-[2rem] border border-indigo-100 space-y-3">
                  <div className="flex items-center justify-between text-indigo-900">
                    <div className="flex items-center space-x-2">
                      <Info size={16} className="text-indigo-600" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Selected Test Protocol</span>
                    </div>
                    {selectedTest.duration && (
                      <span className="px-2.5 py-0.5 bg-indigo-100 text-indigo-800 rounded-full text-[9px] font-black uppercase">
                        {selectedTest.duration}
                      </span>
                    )}
                  </div>
                  <p className="text-indigo-950/80 text-xs leading-relaxed font-medium">
                    {selectedTest.description}
                  </p>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      onClick={() => setActiveVideoTest(selectedTest)}
                      className="py-2.5 px-3 bg-[#D4A017] hover:bg-amber-500 text-slate-950 rounded-xl text-xs font-black uppercase tracking-wider shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      title="Watch Official Video Demonstration"
                    >
                      <Play size={13} className="fill-slate-950" />
                      <span>Video Demo</span>
                    </button>
                    <button
                      onClick={() => setActiveGuideTest(selectedTest)}
                      className="py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      title="View Full CBSE Guide Pop-Up"
                    >
                      <Info size={13} />
                      <span>CBSE Guide</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Main Content: Input & Results */}
            <div className="order-1 lg:order-2 lg:col-span-8 space-y-6">
              {!selectedTest ? (
                <div className="bg-white border-4 border-dashed border-slate-100 rounded-[2.5rem] h-full flex flex-col items-center justify-center p-12 text-center text-slate-400 min-h-[400px]">
                  <Activity size={48} className="mb-4 text-slate-200" />
                  <p className="font-bold uppercase tracking-tight">Select a test from the {selectedBattery.category} battery to begin.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Mode Switcher Tabs */}
                  <div className="flex bg-slate-100 p-2 rounded-2xl border border-slate-200 gap-1.5">
                    <button 
                      onClick={() => setEntryMode('batch')}
                      className={`flex-1 min-h-[48px] py-3.5 px-4 rounded-xl font-black uppercase text-xs sm:text-sm tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 ${
                        entryMode === 'batch' 
                          ? 'bg-[#0D2B52] text-white shadow-md' 
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                      }`}
                    >
                      <Users size={18} className="text-[#D4A017] shrink-0" />
                      <span className="truncate">Class Roster Batch Entry ({filteredStudentsForSelect.length})</span>
                    </button>
                    <button 
                      onClick={() => setEntryMode('single')}
                      className={`flex-1 min-h-[48px] py-3.5 px-4 rounded-xl font-black uppercase text-xs sm:text-sm tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 ${
                        entryMode === 'single' 
                          ? 'bg-[#0D2B52] text-white shadow-md' 
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                      }`}
                    >
                      <User size={18} className="text-[#D4A017] shrink-0" />
                      <span className="truncate">Single Student Search</span>
                    </button>
                  </div>

                  {/* Top Class & Test Filter Toolbar */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 bg-slate-50 p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-sm">
                    <div>
                      <label className="text-[10.5px] font-black text-slate-600 uppercase tracking-widest mb-1.5 block">1. Class / Grade</label>
                      <select 
                        className="w-full min-h-[46px] p-3 bg-white border border-slate-300 rounded-xl font-bold text-xs sm:text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-slate-800 cursor-pointer shadow-2xs"
                        value={selectedGradeFilter}
                        onChange={e => handleGradeFilterChange(e.target.value)}
                      >
                        <option value="ALL">All Grades ({uniqueGrades.length > 0 ? uniqueGrades.join(', ') : 'All'})</option>
                        <optgroup label="Middle School (Classes 6, 7, 8) — Modified Push-Ups">
                          <option value="6">Class 6 (Middle School)</option>
                          <option value="7">Class 7 (Middle School)</option>
                          <option value="8">Class 8 (Middle School)</option>
                        </optgroup>
                        <optgroup label="Primary (Classes 1, 2, 3)">
                          <option value="1">Class 1 (Primary)</option>
                          <option value="2">Class 2 (Primary)</option>
                          <option value="3">Class 3 (Primary)</option>
                        </optgroup>
                        <optgroup label="Upper Primary (Classes 4, 5)">
                          <option value="4">Class 4 (Upper Primary)</option>
                          <option value="5">Class 5 (Upper Primary)</option>
                        </optgroup>
                        <optgroup label="Secondary (Classes 9, 10)">
                          <option value="9">Class 9 (Secondary)</option>
                          <option value="10">Class 10 (Secondary)</option>
                        </optgroup>
                        <optgroup label="Senior Secondary (Classes 11, 12)">
                          <option value="11">Class 11 (Senior Sec)</option>
                          <option value="12">Class 12 (Senior Sec)</option>
                        </optgroup>
                        {uniqueGrades.filter(g => !['1','2','3','4','5','6','7','8','9','10','11','12'].includes(g)).length > 0 && (
                          <optgroup label="Other School Classes">
                            {uniqueGrades.filter(g => !['1','2','3','4','5','6','7','8','9','10','11','12'].includes(g)).map(g => (
                              <option key={g} value={g}>Class {g}</option>
                            ))}
                          </optgroup>
                        )}
                      </select>
                    </div>

                    <div>
                      <label className="text-[10.5px] font-black text-slate-600 uppercase tracking-widest mb-1.5 block">2. Section</label>
                      <select 
                        className="w-full min-h-[46px] p-3 bg-white border border-slate-300 rounded-xl font-bold text-xs sm:text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-slate-800 cursor-pointer shadow-2xs"
                        value={selectedSectionFilter}
                        onChange={e => setSelectedSectionFilter(e.target.value)}
                      >
                        <option value="ALL">All Sections ({uniqueSections.length})</option>
                        {uniqueSections.map(s => (
                          <option key={s} value={s}>Section {s}</option>
                        ))}
                      </select>
                    </div>

                    {/* Test Selection Dropdown (Filtered automatically by grade/battery) */}
                    <div>
                      <label className="text-[10.5px] font-black text-indigo-800 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                        <SlidersHorizontal size={12} className="text-indigo-600" />
                        <span>3. Today's Test(s)</span>
                      </label>
                      <select 
                        className="w-full min-h-[46px] p-3 bg-indigo-50/80 border-2 border-indigo-200 rounded-xl font-black text-xs sm:text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-indigo-950 cursor-pointer shadow-2xs"
                        value={
                          testSelectionFilter === 'all'
                            ? 'all'
                            : testSelectionFilter === 'custom' || customSelectedTestIds.length > 1
                              ? 'custom'
                              : (customSelectedTestIds[0] || selectedTest?.id || selectedBattery?.tests[0]?.id || '')
                        }
                        onChange={e => {
                          const val = e.target.value;
                          setTestSelectionFilter(val);
                          if (val === 'all') {
                            if (selectedBattery) {
                              setCustomSelectedTestIds(selectedBattery.tests.map(t => t.id));
                            }
                          } else if (val === 'custom') {
                            if (selectedBattery) {
                              if (customSelectedTestIds.length <= 1) {
                                setCustomSelectedTestIds([
                                  selectedBattery.tests[0].id, 
                                  selectedBattery.tests[1]?.id || selectedBattery.tests[0].id
                                ]);
                              }
                            }
                          } else if (selectedBattery) {
                            const found = selectedBattery.tests.find(t => t.id === val);
                            if (found) {
                              setSelectedTest(found);
                              setCustomSelectedTestIds([found.id]);
                            }
                          }
                        }}
                      >
                        <optgroup label={`${selectedBattery?.category || 'Active'} Individual Tests (Single Test)`}>
                          {selectedBattery?.tests.map(t => (
                            <option key={t.id} value={t.id}>
                              {t.id === 'pushups' ? '⭐ 🎯 ' : '🎯 '}{t.name} {t.duration ? `(${t.duration})` : `(${t.unit})`}
                            </option>
                          ))}
                        </optgroup>
                        <optgroup label="Multi-Test Options">
                          <option value="custom">
                            ✨ Multi-Select ({customSelectedTestIds.length > 1 && customSelectedTestIds.length < (selectedBattery?.tests.length || 8) ? `${customSelectedTestIds.length} Tests Selected` : 'Pick 1, 2, or 3 Tests'})
                          </option>
                          <option value="all">📊 All Tests ({selectedBattery?.tests.length || 8} Tests Full Battery)</option>
                        </optgroup>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10.5px] font-black text-slate-600 uppercase tracking-widest mb-1.5 block">4. Term / Phase</label>
                      <select 
                        className="w-full min-h-[46px] p-3 bg-white border border-slate-300 rounded-xl font-bold text-xs sm:text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-slate-800 cursor-pointer shadow-2xs"
                        value={selectedTerm}
                        onChange={e => setSelectedTerm(e.target.value)}
                      >
                        <option value="Baseline">Baseline</option>
                        <option value="Term 1">Term 1</option>
                        <option value="Term 2">Term 2</option>
                        <option value="Final">Final Report</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10.5px] font-black text-slate-600 uppercase tracking-widest mb-1.5 block">5. Student Search</label>
                      <div className="relative">
                        <input 
                          type="text"
                          placeholder="Search roll / name..."
                          className="w-full min-h-[46px] p-3 pl-9 pr-8 bg-white border border-slate-300 rounded-xl font-bold text-xs sm:text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-slate-800 shadow-2xs"
                          value={studentSearchQuery}
                          onChange={e => setStudentSearchQuery(e.target.value)}
                        />
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        {studentSearchQuery && (
                          <button 
                            type="button"
                            onClick={() => setStudentSearchQuery('')} 
                            className="w-8 h-8 rounded-full flex items-center justify-center absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                            title="Clear search"
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Interactive Quick-Test Switcher & Multi-Test Selector */}
                  {selectedBattery && (
                    <div id="test-selection-chips" className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4 scroll-mt-20">
                      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-2.5">
                          <span className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-sm shrink-0 border border-indigo-100">
                            <Activity size={18} />
                          </span>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                                Test Selection &bull; {selectedBattery.category}
                              </h4>
                              <span className="px-2.5 py-0.5 bg-indigo-100 text-indigo-900 font-black text-[11px] rounded-full">
                                {getActiveTests().length} of {selectedBattery.tests.length} Active
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 font-medium">
                              {getActiveTests().length === selectedBattery.tests.length
                                ? 'Displaying all battery tests across the roster'
                                : getActiveTests().length === 1
                                  ? `Focused on single test: ${getActiveTests()[0]?.name}`
                                  : `Displaying ${getActiveTests().length} selected tests: ${getActiveTests().map(t => t.name).join(', ')}`}
                            </p>
                          </div>
                        </div>

                        {/* 3-Way Mode Segmented Switch */}
                        <div className="flex items-center gap-1 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
                          <button
                            type="button"
                            onClick={() => {
                              const target = selectedTest?.id || selectedBattery.tests[0].id;
                              setTestSelectionFilter('custom');
                              const t = selectedBattery.tests.find(item => item.id === target) || selectedBattery.tests[0];
                              setSelectedTest(t);
                              setCustomSelectedTestIds([target]);
                            }}
                            className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 ${
                              getActiveTests().length === 1
                                ? 'bg-white text-indigo-700 shadow-sm font-black'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            <span>🎯 Single Test</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setTestSelectionFilter('custom');
                              if (customSelectedTestIds.length <= 1 || customSelectedTestIds.length === selectedBattery.tests.length) {
                                setCustomSelectedTestIds([
                                  selectedBattery.tests[0].id, 
                                  selectedBattery.tests[1]?.id || selectedBattery.tests[0].id
                                ]);
                              }
                            }}
                            className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 ${
                              getActiveTests().length > 1 && getActiveTests().length < selectedBattery.tests.length
                                ? 'bg-white text-indigo-700 shadow-sm font-black'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            <span>📑 Pick 1-3 Tests</span>
                            {getActiveTests().length > 1 && getActiveTests().length < selectedBattery.tests.length && (
                              <span className="px-2 py-0.5 bg-indigo-600 text-white rounded-md text-[10px] font-black">
                                {getActiveTests().length}
                              </span>
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setTestSelectionFilter('all');
                              setCustomSelectedTestIds(selectedBattery.tests.map(t => t.id));
                            }}
                            className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 ${
                              getActiveTests().length === selectedBattery.tests.length
                                ? 'bg-white text-indigo-700 shadow-sm font-black'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            <span>📊 All Tests ({selectedBattery.tests.length})</span>
                          </button>
                        </div>
                      </div>

                      {/* Test Chips Grid with direct touch toggling */}
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2.5 text-xs bg-indigo-50/70 p-3 rounded-2xl border border-indigo-100">
                          <span className="font-bold text-indigo-950 flex items-center gap-1.5">
                            <span>👉 Tap any test chip below to toggle it ON or OFF:</span>
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                if (selectedBattery.tests.length >= 2) {
                                  setTestSelectionFilter('custom');
                                  setCustomSelectedTestIds([selectedBattery.tests[0].id, selectedBattery.tests[1].id]);
                                }
                              }}
                              className="min-h-[38px] px-3 py-1.5 bg-white hover:bg-indigo-100 text-indigo-700 rounded-xl font-black text-xs border border-indigo-200 shadow-2xs cursor-pointer active:scale-95 transition-all"
                            >
                              Pick First 2
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (selectedBattery.tests.length >= 3) {
                                  setTestSelectionFilter('custom');
                                  setCustomSelectedTestIds([selectedBattery.tests[0].id, selectedBattery.tests[1].id, selectedBattery.tests[2].id]);
                                }
                              }}
                              className="min-h-[38px] px-3 py-1.5 bg-white hover:bg-indigo-100 text-indigo-700 rounded-xl font-black text-xs border border-indigo-200 shadow-2xs cursor-pointer active:scale-95 transition-all"
                            >
                              Pick First 3
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setTestSelectionFilter('all');
                                setCustomSelectedTestIds(selectedBattery.tests.map(t => t.id));
                              }}
                              className="min-h-[38px] px-3 py-1.5 bg-white hover:bg-indigo-100 text-indigo-700 rounded-xl font-black text-xs border border-indigo-200 shadow-2xs cursor-pointer active:scale-95 transition-all"
                            >
                              Select All
                            </button>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2.5 pt-1">
                          {selectedBattery.tests.map(test => {
                            const activeList = getActiveTests();
                            const isTestActive = activeList.some(t => t.id === test.id);

                            return (
                              <div
                                key={test.id}
                                className={`min-h-[48px] rounded-2xl text-xs sm:text-sm font-black transition-all flex items-center border shadow-2xs ${
                                  isTestActive
                                    ? 'bg-[#0D2B52] text-white border-slate-900 shadow-md ring-2 ring-[#D4A017]'
                                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200 opacity-85 hover:opacity-100'
                                }`}
                              >
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (isTestActive) {
                                      if (activeList.length > 1) {
                                        const nextIds = activeList.filter(t => t.id !== test.id).map(t => t.id);
                                        setTestSelectionFilter('custom');
                                        setCustomSelectedTestIds(nextIds);
                                      } else {
                                        toast.error("Please keep at least 1 test selected.");
                                      }
                                    } else {
                                      const nextIds = [...activeList.map(t => t.id), test.id];
                                      setTestSelectionFilter('custom');
                                      setCustomSelectedTestIds(nextIds);
                                      setSelectedTest(test);
                                    }
                                  }}
                                  className="flex-1 py-3 pl-3.5 pr-1.5 flex items-center gap-2.5 cursor-pointer select-none active:scale-98"
                                >
                                  <span className={`w-5 h-5 rounded-lg flex items-center justify-center text-xs font-black transition-all shrink-0 ${
                                    isTestActive ? 'bg-[#D4A017] text-slate-950 shadow-xs' : 'bg-slate-200 text-transparent border border-slate-300'
                                  }`}>
                                    ✓
                                  </span>
                                  <span className="truncate">{test.name}</span>
                                  {test.duration && (
                                    <span className={`text-[10px] px-2 py-0.5 rounded-md font-black shrink-0 ${
                                      isTestActive
                                        ? 'bg-white/20 text-[#D4A017]' 
                                        : 'bg-slate-200 text-slate-700'
                                    }`}>
                                      {test.duration.includes('60') ? '60s' : test.duration.includes('30') ? '30s' : test.duration}
                                    </span>
                                  )}
                                </button>

                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveGuideTest(test);
                                  }}
                                  className={`w-8 h-8 mr-2 rounded-xl flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                                    isTestActive
                                      ? 'bg-white/15 hover:bg-[#D4A017] hover:text-slate-950 text-slate-200'
                                      : 'hover:bg-indigo-600 hover:text-white text-indigo-700 bg-indigo-50 border border-indigo-100'
                                  }`}
                                  title={`Tap for ${test.name} purpose and execution method`}
                                  aria-label={`Tap for ${test.name} purpose and execution method`}
                                >
                                  <Info size={14} />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Middle School Battery & Test Filter Banner */}
                  {(selectedBattery?.category === 'Middle School' || ['6', '7', '8'].includes(selectedGradeFilter)) && (
                    <div className="bg-indigo-50/90 border-2 border-indigo-200/80 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-xs">
                      <div className="flex items-center gap-2.5 text-xs text-indigo-950">
                        <span className="px-2.5 py-1 bg-indigo-600 text-white rounded-lg text-[10.5px] font-black uppercase tracking-wider shrink-0">
                          Middle School (Grades 6, 7, 8)
                        </span>
                        <span className="font-semibold">
                          CBSE Khelo India Middle School tests active. Features <strong>Modified Push-Ups</strong> for girls (knee-supported), standard plank push-ups for boys (60s), and <strong>Partial Curl-Ups</strong>.
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            const pushTest = selectedBattery?.tests.find(t => t.id === 'pushups');
                            if (pushTest) {
                              setSelectedTest(pushTest);
                              setTestSelectionFilter('pushups');
                            }
                          }}
                          className="min-h-[42px] px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer shadow-xs transition-all flex items-center gap-1.5 shrink-0 active:scale-95"
                        >
                          <span>Focus Push-Ups</span>
                        </button>
                        <button
                          onClick={() => {
                            const curlTest = selectedBattery?.tests.find(t => t.id === 'curl_ups');
                            if (curlTest) {
                              setSelectedTest(curlTest);
                              setTestSelectionFilter('curl_ups');
                            }
                          }}
                          className="min-h-[42px] px-3.5 py-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-900 border border-indigo-200 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer shadow-xs transition-all flex items-center gap-1.5 shrink-0 active:scale-95"
                        >
                          <span>Focus Curl-Ups</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Secondary School Battery & Test Filter Banner (Grades 9 & 10) */}
                  {(selectedBattery?.category === 'Secondary' || ['9', '10'].includes(selectedGradeFilter)) && (
                    <div className="bg-emerald-50/90 border-2 border-emerald-200/80 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-xs">
                      <div className="flex items-center gap-2.5 text-xs text-emerald-950">
                        <span className="px-2.5 py-1 bg-emerald-700 text-white rounded-lg text-[10.5px] font-black uppercase tracking-wider shrink-0">
                          Secondary School (Grades 9 & 10)
                        </span>
                        <span className="font-semibold">
                          CBSE HPE Secondary tests active. Standard plank push-ups for boys, <strong>Modified Push-Ups</strong> for girls (60s), <strong>Sit-Ups / Partial Curl-Ups</strong>, Sit & Reach, and 600m Run.
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            const pushTest = selectedBattery?.tests.find(t => t.id === 'pushups');
                            if (pushTest) {
                              setSelectedTest(pushTest);
                              setTestSelectionFilter('pushups');
                            }
                          }}
                          className="min-h-[42px] px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer shadow-xs transition-all flex items-center gap-1.5 shrink-0 active:scale-95"
                        >
                          <span>Focus Push-Ups</span>
                        </button>
                        <button
                          onClick={() => {
                            const curlTest = selectedBattery?.tests.find(t => t.id === 'curl_ups');
                            if (curlTest) {
                              setSelectedTest(curlTest);
                              setTestSelectionFilter('curl_ups');
                            }
                          }}
                          className="min-h-[42px] px-3.5 py-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border border-emerald-200 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer shadow-xs transition-all flex items-center gap-1.5 shrink-0 active:scale-95"
                        >
                          <span>Focus Partial Curl-Ups</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Senior Secondary School Battery & Test Filter Banner (Grades 11 & 12) */}
                  {(selectedBattery?.category === 'Senior Secondary' || ['11', '12'].includes(selectedGradeFilter)) && (
                    <div className="bg-amber-50/90 border-2 border-amber-200/80 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-xs">
                      <div className="flex items-center gap-2.5 text-xs text-amber-950">
                        <span className="px-2.5 py-1 bg-amber-600 text-white rounded-lg text-[10.5px] font-black uppercase tracking-wider shrink-0">
                          Senior Secondary (Grades 11 & 12)
                        </span>
                        <span className="font-semibold">
                          CBSE Khelo India Senior Secondary tests active. Features <strong>Push-Ups / Modified Push-Ups (60s)</strong>, <strong>Sit-Ups / Partial Curl-Ups</strong>, 1000m/800m Run, and Sit & Reach.
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            const pushTest = selectedBattery?.tests.find(t => t.id === 'pushups');
                            if (pushTest) {
                              setSelectedTest(pushTest);
                              setTestSelectionFilter('pushups');
                            }
                          }}
                          className="min-h-[42px] px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer shadow-xs transition-all flex items-center gap-1.5 shrink-0 active:scale-95"
                        >
                          <span>Focus Push-Ups</span>
                        </button>
                        <button
                          onClick={() => {
                            const curlTest = selectedBattery?.tests.find(t => t.id === 'curl_ups');
                            if (curlTest) {
                              setSelectedTest(curlTest);
                              setTestSelectionFilter('curl_ups');
                            }
                          }}
                          className="min-h-[42px] px-3.5 py-2 bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-200 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer shadow-xs transition-all flex items-center gap-1.5 shrink-0 active:scale-95"
                        >
                          <span>Focus Partial Curl-Ups</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {entryMode === 'batch' ? (
                    /* SPREADSHEET OR MOBILE CARDS FITNESS DATA ENTRY */
                    <div className="bg-white p-5 sm:p-6 rounded-[2.5rem] shadow-sm border border-slate-200 space-y-5">
                      {/* Grid Header & Quick Action Bar */}
                      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
                        <div>
                          <div className="flex items-center gap-2">
                            <Activity size={18} className="text-[#0D2B52]" />
                            <h3 className="text-base font-black text-[#0D2B52] uppercase tracking-tight">
                              Class Fitness Testing ({filteredStudentsForSelect.length} Students)
                            </h3>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 font-medium mt-0.5">
                            <span>Showing:</span>
                            <span className="bg-indigo-50 text-indigo-800 font-extrabold px-2 py-0.5 rounded-md text-[11px]">
                              {getActiveTests().length === 1 
                                ? `🎯 ${getActiveTests()[0].name}` 
                                : `⚡ ${getActiveTests().length} Active Tests`}
                            </span>
                            <span>&bull; Phase: <strong>{selectedTerm}</strong></span>
                          </div>
                        </div>

                        {/* View Mode Switcher + Actions */}
                        <div className="flex flex-wrap items-center gap-2">
                          {/* Sequential Data Entry Mode Switch */}
                          <button
                            type="button"
                            onClick={() => {
                              setSequentialMode(prev => {
                                const nextVal = !prev;
                                if (nextVal) {
                                  toast.success("Sequential Entry Mode Enabled: Auto-advances to next student upon pressing Enter or Next!");
                                } else {
                                  toast.success("Sequential Entry Mode Disabled");
                                }
                                return nextVal;
                              });
                            }}
                            className={`min-h-[42px] px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all border cursor-pointer active:scale-95 ${
                              sequentialMode
                                ? 'bg-amber-400 hover:bg-amber-500 text-slate-950 border-amber-500 shadow-sm'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                            }`}
                            title="Sequential Data Entry: Automatically jumps focus to next student's test score on Enter/Next"
                          >
                            <Zap size={14} className={sequentialMode ? 'fill-slate-950 text-slate-950 animate-pulse' : 'text-slate-500'} />
                            <span className="hidden sm:inline">Sequential Mode</span>
                            <span className={`px-2 py-0.5 text-[10px] rounded-md font-black ${sequentialMode ? 'bg-slate-950 text-amber-400' : 'bg-slate-200 text-slate-700'}`}>
                              {sequentialMode ? 'ON' : 'OFF'}
                            </span>
                          </button>

                          {/* Layout Mode Toggle (Cards vs Table) */}
                          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                            <button
                              onClick={() => setViewLayoutMode('cards')}
                              className={`min-h-[40px] px-3.5 py-2 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 ${
                                viewLayoutMode === 'cards'
                                  ? 'bg-white text-indigo-700 shadow-sm'
                                  : 'text-slate-600 hover:text-slate-900'
                              }`}
                              title="Mobile-Friendly Touch Cards with Steppers"
                            >
                              <Smartphone size={14} />
                              <span className="hidden sm:inline">Field Cards</span>
                              <span className="sm:hidden">Cards</span>
                            </button>
                            <button
                              onClick={() => setViewLayoutMode('table')}
                              className={`min-h-[40px] px-3.5 py-2 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 ${
                                viewLayoutMode === 'table'
                                  ? 'bg-white text-indigo-700 shadow-sm'
                                  : 'text-slate-600 hover:text-slate-900'
                              }`}
                              title="Compact Spreadsheet Table Grid"
                            >
                              <Table size={14} />
                              <span className="hidden sm:inline">Table Grid</span>
                              <span className="sm:hidden">Table</span>
                            </button>
                          </div>

                          {selectedTest && (
                            <button
                              onClick={() => setActiveVideoTest(selectedTest)}
                              className="min-h-[42px] px-3.5 py-2 bg-[#D4A017] hover:bg-amber-400 text-slate-950 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-sm border border-amber-500 active:scale-95"
                              title="Watch official demonstration video for current test"
                            >
                              <Play size={13} className="fill-slate-950" />
                              <span className="hidden sm:inline">Video Demo</span>
                              <span className="sm:hidden">Video</span>
                            </button>
                          )}

                          <button
                            onClick={handleExportCsvTemplate}
                            className="min-h-[42px] px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 border border-slate-200"
                            title="Export Class Fitness Spreadsheet as CSV"
                          >
                            <FileSpreadsheet size={14} className="text-emerald-600" />
                            <span className="hidden md:inline">Export CSV</span>
                          </button>

                          <label className="min-h-[42px] px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 border border-slate-200">
                            <Upload size={14} className="text-indigo-600" />
                            <span className="hidden md:inline">Import CSV</span>
                            <input 
                              type="file" 
                              accept=".csv" 
                              className="hidden" 
                              onChange={handleImportCsv}
                            />
                          </label>

                          <button
                            onClick={handleBatchSave}
                            disabled={batchSaving || filteredStudentsForSelect.length === 0}
                            className="min-h-[42px] px-4 py-2 bg-[#0D2B52] hover:bg-[#164077] text-white border-2 border-slate-900 rounded-xl font-black text-xs uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] disabled:opacity-50 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                          >
                            {batchSaving ? (
                              <Loader2 size={16} className="animate-spin text-[#D4A017]" />
                            ) : isSaved ? (
                              <CheckCircle2 size={16} className="text-emerald-400" />
                            ) : (
                              <Save size={16} className="text-[#D4A017]" />
                            )}
                            <span>{batchSaving ? 'Saving...' : isSaved ? 'Saved!' : `Save All (${unsavedBatchCount})`}</span>
                          </button>
                        </div>
                      </div>

                      {/* Content Area: Field Cards or Table Grid */}
                      {filteredStudentsForSelect.length === 0 ? (
                        <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400">
                          <Users size={32} className="mx-auto mb-2 text-slate-300" />
                          <p className="font-bold text-xs uppercase">No students found matching this class / search filter.</p>
                          <p className="text-[10px] text-slate-400 mt-1">Try changing the Class or Section filter above, or add students in the Student Management tab.</p>
                        </div>
                      ) : viewLayoutMode === 'cards' ? (
                        /* MOBILE-FIRST FIELD CARDS MODE */
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {filteredStudentsForSelect.map((student, sIdx) => {
                              const activeTests = getActiveTests();
                              const isCardActive = activeFocusCoord?.sIdx === sIdx;
                              // Check if all active tests are saved for this student
                              const allSaved = activeTests.every(t => {
                                const cellKey = `${student.id}_${t.id}`;
                                return batchSavedStatus[cellKey] || false;
                              });
                              const hasAnyScore = activeTests.some(t => {
                                const cellKey = `${student.id}_${t.id}`;
                                return (batchScores[cellKey] || '').trim() !== '';
                              });

                              return (
                                <div 
                                  key={student.id}
                                  className={`p-4 sm:p-5 rounded-3xl border-2 transition-all relative ${
                                    isCardActive
                                      ? 'ring-2 ring-indigo-500 border-indigo-500 shadow-md bg-indigo-50/40'
                                      : allSaved && hasAnyScore
                                        ? 'bg-emerald-50/40 border-emerald-300/80 shadow-sm'
                                        : hasAnyScore
                                          ? 'bg-amber-50/30 border-amber-300 shadow-sm'
                                          : 'bg-slate-50/60 border-slate-200 hover:border-indigo-200'
                                  }`}
                                >
                                  {/* Student Header */}
                                  <div className="flex items-start justify-between gap-2 mb-3.5 pb-2.5 border-b border-slate-200/80">
                                    <div className="flex items-center gap-3">
                                      <span className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shadow-xs ${
                                        isCardActive ? 'bg-indigo-600 text-white animate-pulse' : 'bg-[#0D2B52] text-[#D4A017]'
                                      }`}>
                                        #{student.rollNumber || (sIdx + 1)}
                                      </span>
                                      <div>
                                        <div className="flex items-center gap-2">
                                          <h4 className="font-extrabold text-sm sm:text-base text-slate-900 leading-tight truncate max-w-[160px]" title={student.name}>
                                            {student.name}
                                          </h4>
                                          {isCardActive && (
                                            <span className="px-2 py-0.5 bg-indigo-600 text-white text-[9.5px] font-black rounded-md uppercase tracking-wider">
                                              Active
                                            </span>
                                          )}
                                        </div>
                                        <p className="text-xs text-slate-500 font-medium">
                                          Gr {student.grade}-{student.section} &bull; {student.gender}, {student.age} yrs
                                        </p>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                      {allSaved && hasAnyScore ? (
                                        <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full font-black text-[11px] flex items-center gap-1">
                                          <Check size={12} /> Saved
                                        </span>
                                      ) : hasAnyScore ? (
                                        <span className="px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full font-black text-[11px]">
                                          Unsaved
                                        </span>
                                      ) : null}

                                      <button
                                        onClick={() => handleSingleRowSave(student)}
                                        className="min-w-[44px] min-h-[44px] flex items-center justify-center bg-white hover:bg-[#0D2B52] hover:text-white text-slate-700 rounded-xl border border-slate-200 text-xs transition-colors cursor-pointer active:scale-95 shadow-2xs"
                                        title="Save this student's scores"
                                        aria-label="Save this student's scores"
                                      >
                                        <Save size={16} />
                                      </button>
                                    </div>
                                  </div>

                                  {/* Test Inputs */}
                                  <div className="space-y-3.5">
                                    {activeTests.map((test, tIdx) => {
                                      const cellKey = `${student.id}_${test.id}`;
                                      const currentVal = batchScores[cellKey] ?? '';
                                      const isSavedCell = batchSavedStatus[cellKey] ?? false;
                                      const fieldInfo = getDescriptiveFieldInfo(test, { category: selectedBattery?.category, grade: student.grade, age: student.age });
                                      const isRepetitionTest = test.unit.toLowerCase().includes('count') || test.unit.toLowerCase().includes('reps') || test.name.toLowerCase().includes('push') || test.name.toLowerCase().includes('sit-up') || test.name.toLowerCase().includes('curl');

                                      return (
                                        <div key={test.id} className="bg-white p-3.5 rounded-2xl border border-slate-200 space-y-2.5 shadow-2xs">
                                          <div className="flex items-center justify-between gap-1 text-xs">
                                            <span className="font-extrabold text-slate-900 truncate text-xs sm:text-sm" title={test.name}>
                                              {test.name}
                                            </span>
                                            <div className="flex items-center gap-1.5 shrink-0">
                                              {test.duration && (
                                                <span className="text-[10px] font-black text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/60">
                                                  ⏱️ {test.duration}
                                                </span>
                                              )}
                                              <TestFieldTooltip 
                                                test={test} 
                                                onOpenModal={setActiveGuideTest} 
                                                compact 
                                                categoryName={selectedBattery?.category}
                                                grade={student.grade}
                                                age={student.age}
                                              />
                                            </div>
                                          </div>

                                          <div className="flex items-center gap-2">
                                            <div className="relative flex-1">
                                              <input
                                                id={`grid-input-${sIdx}-${tIdx}`}
                                                type="text"
                                                inputMode="decimal"
                                                placeholder={fieldInfo.placeholder}
                                                onFocus={() => setActiveFocusCoord({ sIdx, tIdx })}
                                                onKeyDown={e => handleGridKeyDown(e, sIdx, tIdx, filteredStudentsForSelect.length, activeTests.length)}
                                                className={`w-full min-h-[46px] p-3 font-black text-sm sm:text-base rounded-xl border-2 outline-none transition-all ${
                                                  isSavedCell 
                                                    ? 'bg-emerald-50/80 border-emerald-400 text-emerald-950 focus:ring-2 focus:ring-emerald-500' 
                                                    : currentVal 
                                                      ? 'bg-amber-50/80 border-amber-400 text-amber-950 focus:ring-2 focus:ring-amber-500' 
                                                      : 'bg-white border-slate-200 text-slate-900 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100'
                                                }`}
                                                value={currentVal}
                                                onChange={e => {
                                                  const val = e.target.value;
                                                  setBatchScores(prev => ({
                                                    ...prev,
                                                    [cellKey]: val
                                                  }));
                                                  setBatchSavedStatus(prev => ({
                                                    ...prev,
                                                    [cellKey]: false
                                                  }));
                                                }}
                                              />
                                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
                                                {test.unit}
                                              </span>
                                            </div>

                                            {/* Quick Stepper Buttons for Repetitions / Count with 44px+ hit targets */}
                                            {isRepetitionTest && (
                                              <div className="flex items-center gap-1.5 shrink-0">
                                                <button
                                                  type="button"
                                                  onClick={() => handleQuickAdjustScore(student.id, test, -1)}
                                                  className="min-w-[44px] min-h-[46px] rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-black text-sm flex items-center justify-center transition-colors cursor-pointer active:scale-95 border border-slate-200"
                                                  title="Subtract 1"
                                                  aria-label="Subtract 1"
                                                >
                                                  -1
                                                </button>
                                                <button
                                                  type="button"
                                                  onClick={() => handleQuickAdjustScore(student.id, test, 1)}
                                                  className="min-w-[44px] min-h-[46px] rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-black text-sm flex items-center justify-center transition-colors cursor-pointer active:scale-95 border border-indigo-200"
                                                  title="Add 1"
                                                  aria-label="Add 1"
                                                >
                                                  +1
                                                </button>
                                                <button
                                                  type="button"
                                                  onClick={() => handleQuickAdjustScore(student.id, test, 5)}
                                                  className="min-w-[44px] min-h-[46px] px-2.5 rounded-xl bg-[#0D2B52] hover:bg-[#164077] text-white font-black text-xs flex items-center justify-center transition-colors cursor-pointer active:scale-95"
                                                  title="Add 5"
                                                  aria-label="Add 5"
                                                >
                                                  +5
                                                </button>
                                              </div>
                                            )}

                                            {/* Quick 1-Tap Advance Button for Touch/Mobile */}
                                            <button
                                              type="button"
                                              onClick={() => focusNextStudent(sIdx, tIdx, filteredStudentsForSelect.length, activeTests.length, 'next')}
                                              className="min-w-[44px] min-h-[46px] px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs flex items-center justify-center gap-1 transition-colors shadow-xs cursor-pointer active:scale-95 shrink-0"
                                              title="Advance to next student (Enter ➔)"
                                              aria-label="Advance to next student"
                                            >
                                              <span className="hidden sm:inline">Next</span>
                                              <ArrowDown size={16} />
                                            </button>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        /* SPREADSHEET TABLE GRID MODE */
                        <div className="space-y-2">
                          <div className="overflow-x-auto border border-slate-200 rounded-2xl max-h-[520px] shadow-inner custom-scrollbar">
                            {(() => {
                              const currentTests = getActiveTests();

                              return (
                                <table className="w-full text-left border-collapse bg-white">
                                  <thead>
                                    <tr className="bg-[#0D2B52] text-white text-[10px] font-black uppercase tracking-wider sticky top-0 z-20">
                                      <th className="p-3 border-r border-slate-700 w-12 text-center select-none">Roll</th>
                                      <th className="p-3 border-r border-slate-700 min-w-[150px] select-none">Student Name</th>
                                      <th className="p-3 border-r border-slate-700 w-20 text-center select-none">Class</th>
                                      {currentTests.map((t, tIdx) => {
                                        const fieldInfo = getDescriptiveFieldInfo(t);
                                        return (
                                          <th key={t.id} className="p-3 border-r border-slate-700 min-w-[155px] text-center select-none group">
                                            <div className="flex items-center justify-center gap-1">
                                              <div className="truncate max-w-[110px]" title={`${t.name} - ${fieldInfo.label}`}>{t.name}</div>
                                              <TestFieldTooltip test={t} onOpenModal={setActiveGuideTest} compact />
                                            </div>
                                            <div className="text-[9px] font-bold text-[#D4A017] flex items-center justify-center gap-1 mt-0.5">
                                              <span>{fieldInfo.shortLabel}</span>
                                              {t.duration && (
                                                <span className="text-[8.5px] bg-white/10 px-1.5 py-0.2 rounded text-slate-200">
                                                  {t.duration.includes('60') ? '⏱️ 60s' : t.duration.includes('30') ? '⏱️ 30s' : t.duration.includes('min') ? '⏱️ MM:SS' : ''}
                                                </span>
                                              )}
                                            </div>
                                          </th>
                                        );
                                      })}
                                      <th className="p-3 text-center w-14 select-none">Save</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {filteredStudentsForSelect.map((student, sIdx) => {
                                      const isRowActive = activeFocusCoord?.sIdx === sIdx;

                                      return (
                                        <tr key={student.id} className={`border-b border-slate-100 transition-colors text-xs ${
                                          isRowActive ? 'bg-indigo-50/60 font-medium' : 'hover:bg-slate-50/80'
                                        }`}>
                                          <td className={`p-2 font-black text-slate-900 border-r border-slate-100 text-center ${
                                            isRowActive ? 'bg-indigo-100/70 text-indigo-900' : 'bg-slate-50/60'
                                          }`}>
                                            {student.rollNumber || (sIdx + 1)}
                                          </td>
                                          <td className="p-2 font-bold text-slate-800 border-r border-slate-100">
                                            <div className="flex items-center gap-1.5">
                                              <span className="truncate max-w-[150px]" title={student.name}>{student.name}</span>
                                              {isRowActive && (
                                                <span className="px-1.5 py-0.2 bg-indigo-600 text-white text-[8px] font-black rounded uppercase">
                                                  Active
                                                </span>
                                              )}
                                            </div>
                                            <div className="text-[9px] font-medium text-slate-400">{student.gender} &bull; {student.age} yrs</div>
                                          </td>
                                          <td className="p-2 font-semibold text-slate-600 border-r border-slate-100 text-center text-[10px]">
                                            Gr {student.grade}-{student.section}
                                          </td>

                                          {currentTests.map((test, tIdx) => {
                                            const cellKey = `${student.id}_${test.id}`;
                                            const currentVal = batchScores[cellKey] ?? '';
                                            const isSavedCell = batchSavedStatus[cellKey] ?? false;
                                            const fieldInfo = getDescriptiveFieldInfo(test, { category: selectedBattery?.category, grade: student.grade, age: student.age });

                                            return (
                                              <td key={test.id} className="p-1 border-r border-slate-100 text-center">
                                                <div className="relative">
                                                  <input
                                                    id={`grid-input-${sIdx}-${tIdx}`}
                                                    type="text"
                                                    inputMode="decimal"
                                                    placeholder={fieldInfo.placeholder}
                                                    title={`${test.name}: ${fieldInfo.label} (${fieldInfo.hint})`}
                                                    onFocus={() => setActiveFocusCoord({ sIdx, tIdx })}
                                                    onKeyDown={e => handleGridKeyDown(e, sIdx, tIdx, filteredStudentsForSelect.length, currentTests.length)}
                                                    className={`w-full p-2 text-center font-black text-xs rounded-xl border-2 outline-none transition-all ${
                                                      isSavedCell 
                                                        ? 'bg-emerald-50/90 border-emerald-300 text-emerald-900 focus:ring-2 focus:ring-emerald-500' 
                                                        : currentVal 
                                                          ? 'bg-amber-50/90 border-amber-300 text-amber-900 focus:ring-2 focus:ring-amber-500' 
                                                          : 'bg-white border-slate-200 text-slate-900 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100'
                                                    }`}
                                                    value={currentVal}
                                                    onChange={e => {
                                                      const val = e.target.value;
                                                      setBatchScores(prev => ({
                                                        ...prev,
                                                        [cellKey]: val
                                                      }));
                                                      setBatchSavedStatus(prev => ({
                                                        ...prev,
                                                        [cellKey]: false
                                                      }));
                                                    }}
                                                  />
                                                  {isSavedCell && (
                                                    <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-emerald-600 pointer-events-none">
                                                      <Check size={12} />
                                                    </span>
                                                  )}
                                                </div>
                                              </td>
                                            );
                                          })}

                                          <td className="p-1 text-center">
                                            <button
                                              onClick={() => handleSingleRowSave(student)}
                                              className="p-2 bg-slate-100 hover:bg-[#0D2B52] hover:text-white text-slate-700 rounded-xl text-xs transition-colors cursor-pointer"
                                              title="Save Row Scores"
                                            >
                                              <Save size={14} />
                                            </button>
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              );
                            })()}
                          </div>

                          <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold px-2 pt-1">
                            <span>Tip: Press Enter to move down rows, Shift+Enter to move up.</span>
                            <span className="text-emerald-600 font-extrabold flex items-center gap-1">
                              <CheckCircle2 size={12} /> Green cells = Saved to DB
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Mobile Floating Quick Sequential Navigation Dock */}
                      {sequentialMode && filteredStudentsForSelect.length > 0 && activeFocusCoord && (
                        <div className="sticky bottom-20 sm:bottom-24 z-30 w-full max-w-md mx-auto bg-[#0D2B52] text-white p-3 rounded-2xl shadow-2xl border-2 border-[#D4A017] flex items-center justify-between gap-2 backdrop-blur-md">
                          <div className="min-w-0 flex-1 pl-1">
                            <div className="flex items-center gap-1.5 text-[10px] text-[#D4A017] font-black uppercase tracking-wider">
                              <Zap size={11} className="fill-[#D4A017] animate-pulse" />
                              <span>Active Student ({activeFocusCoord.sIdx + 1}/{filteredStudentsForSelect.length})</span>
                            </div>
                            <div className="font-extrabold text-xs text-white truncate">
                              #{filteredStudentsForSelect[activeFocusCoord.sIdx]?.rollNumber || (activeFocusCoord.sIdx + 1)} {filteredStudentsForSelect[activeFocusCoord.sIdx]?.name}
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => focusNextStudent(activeFocusCoord.sIdx, activeFocusCoord.tIdx, filteredStudentsForSelect.length, getActiveTests().length, 'prev')}
                              disabled={activeFocusCoord.sIdx === 0 && activeFocusCoord.tIdx === 0}
                              className="px-2.5 py-1.5 bg-white/10 hover:bg-white/20 disabled:opacity-30 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                              title="Previous Student (Shift+Enter / Up)"
                            >
                              <ArrowUp size={14} />
                              <span className="hidden sm:inline">Prev</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => focusNextStudent(activeFocusCoord.sIdx, activeFocusCoord.tIdx, filteredStudentsForSelect.length, getActiveTests().length, 'next')}
                              className="px-3 py-1.5 bg-[#D4A017] hover:bg-[#b88b14] text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider transition-all flex items-center gap-1 shadow-md cursor-pointer"
                              title="Next Student (Enter / Down)"
                            >
                              <span>Next Student</span>
                              <ArrowDown size={14} />
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Error display */}
                      {error && (
                        <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-xs font-bold flex items-start space-x-2">
                          <AlertCircle size={16} className="flex-shrink-0" />
                          <span>{error}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* SINGLE STUDENT SEARCH & ENTRY MODE */
                    <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-6">
                      {/* Search Grid Cards for Quick Selection */}
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">
                          Select Student from School List ({filteredStudentsForSelect.length} matching)
                        </label>

                        {/* Interactive Student Pill Picker */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1 mb-4 custom-scrollbar">
                          {filteredStudentsForSelect.slice(0, 18).map(s => (
                            <button
                              key={s.id}
                              onClick={() => handleStudentChange(s.id)}
                              className={`p-2.5 rounded-xl text-left border-2 transition-all cursor-pointer flex items-center justify-between ${
                                selectedStudentId === s.id
                                  ? 'bg-indigo-600 text-white border-indigo-700 shadow-sm'
                                  : 'bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-700'
                              }`}
                            >
                              <div className="truncate">
                                <p className="font-bold text-xs truncate">{s.name}</p>
                                <p className={`text-[9.5px] ${selectedStudentId === s.id ? 'text-indigo-200' : 'text-slate-400'}`}>
                                  Roll #{s.rollNumber || 'N/A'} &bull; Gr {s.grade}-{s.section}
                                </p>
                              </div>
                              {selectedStudentId === s.id && <CheckCircle2 size={14} className="shrink-0 ml-1 text-emerald-300" />}
                            </button>
                          ))}
                        </div>

                        {/* Fallback Select Dropdown */}
                        <select 
                          className={`w-full p-3 border-2 rounded-2xl font-bold text-xs outline-none transition-all ${
                            selectedStudentId 
                              ? 'bg-indigo-50 border-indigo-200 text-indigo-900 focus:ring-2 focus:ring-indigo-500' 
                              : 'bg-slate-50 border-slate-100 text-slate-600 focus:ring-2 focus:ring-indigo-500'
                          }`}
                          value={selectedStudentId}
                          onChange={e => handleStudentChange(e.target.value)}
                        >
                          <option value="">Manual Entry (Not Linked)</option>
                          {finalStudentsList.map(s => (
                            <option key={s.id} value={s.id}>{s.name} (Roll #{s.rollNumber || 'N/A'} - Grade {s.grade} {s.section})</option>
                          ))}
                        </select>

                        <div className="flex flex-wrap items-center justify-between mt-3 gap-2">
                          {selectedStudentId ? (
                            <div className="flex items-center gap-2">
                              <p className="text-[10px] font-bold text-indigo-700 flex items-center gap-1">
                                <CheckCircle2 size={12} className="text-emerald-600" />
                                <span>Linked: <strong>{students.find(s => s.id === selectedStudentId)?.name}</strong></span>
                              </p>
                              <button
                                type="button"
                                onClick={() => {
                                  const std = students.find(s => s.id === selectedStudentId);
                                  if (std) setProfileModalStudent(std);
                                }}
                                className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-colors border border-indigo-200"
                                title="View D3 Progress Curve & Athletic Profile for this student"
                              >
                                <Activity size={12} className="text-indigo-600" />
                                <span>View Progress Curve</span>
                              </button>
                            </div>
                          ) : <div />}
                          <button
                            onClick={() => generateStudentCbsePdfReportCard()}
                            className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-sm cursor-pointer"
                            title="Generate printer-friendly CBSE PDF Report Card for Student"
                          >
                            <FileText size={14} />
                            <span>Generate CBSE PDF Report Card</span>
                          </button>
                        </div>
                      </div>

                      {/* Direct Test Selector for Active Student Battery */}
                      <div className="pt-4 border-t border-slate-100">
                        <label className="text-[10px] font-black text-indigo-900 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                          <SlidersHorizontal size={12} className="text-indigo-600" />
                          <span>Assessment Test ({selectedBattery?.category || 'Active Battery'} - {selectedBattery?.tests.length || 0} Tests for Grade {selectedGradeFilter !== 'ALL' ? selectedGradeFilter : ''})</span>
                        </label>
                        <select 
                          className="w-full p-3 bg-indigo-50/70 border-2 border-indigo-200 rounded-xl font-black text-xs text-indigo-950 outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer"
                          value={selectedTest?.id || ''}
                          onChange={e => {
                            const found = selectedBattery?.tests.find(t => t.id === e.target.value);
                            if (found) {
                              handleTestClick(found);
                            }
                          }}
                        >
                          {selectedBattery?.tests.map(t => (
                            <option key={t.id} value={t.id}>
                              {t.id === 'pushups' ? '⭐ 🎯 ' : '🎯 '}{t.name} {t.duration ? `(${t.duration})` : `(${t.unit})`}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex flex-wrap gap-4 pt-4 border-t border-slate-100">
                        <div className="flex-1 min-w-[130px]">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Age</label>
                          <select 
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                            value={age}
                            disabled={!!selectedStudentId}
                            onChange={e => setAge(e.target.value)}
                          >
                            {[...Array(60)].map((_, i) => <option key={i} value={i+5}>{i+5} Years</option>)}
                          </select>
                        </div>

                        <div className="flex-1 min-w-[130px]">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Gender</label>
                          <select 
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                            value={gender}
                            disabled={!!selectedStudentId}
                            onChange={e => setGender(e.target.value)}
                          >
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                          </select>
                        </div>

                        {(() => {
                          const currentStudent = students.find(s => s.id === selectedStudentId);
                          const studentGrade = currentStudent?.grade || selectedGradeFilter;
                          const studentAge = currentStudent?.age || (age ? Number(age) : undefined);
                          const fieldInfo = getDescriptiveFieldInfo(selectedTest, { 
                            category: selectedBattery?.category, 
                            grade: studentGrade, 
                            age: studentAge 
                          });

                          return (
                            <div className="flex-[2] min-w-[220px]">
                              <div className="flex flex-wrap justify-between items-center gap-2 mb-1.5">
                                <div className="flex items-center gap-2">
                                  <label className="text-[10px] font-black text-indigo-950 uppercase tracking-widest block">
                                    {fieldInfo.label}
                                  </label>
                                  {selectedTest && (
                                    <TestFieldTooltip 
                                      test={selectedTest} 
                                      onOpenModal={setActiveGuideTest} 
                                      categoryName={selectedBattery?.category}
                                      grade={studentGrade}
                                      age={studentAge}
                                    />
                                  )}
                                </div>
                                <div className="flex items-center gap-1.5">
                                  {selectedTest && (
                                    <button
                                      type="button"
                                      onClick={() => setActiveVideoTest(selectedTest)}
                                      className="px-2 py-0.5 bg-[#D4A017] hover:bg-amber-400 text-slate-950 rounded-md text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-xs cursor-pointer"
                                      title="Watch Official Form Video Demo"
                                    >
                                      <Play size={10} className="fill-slate-950" />
                                      <span>Video Demo</span>
                                    </button>
                                  )}
                                  {selectedTest.duration && (
                                    <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100 flex items-center gap-1">
                                      <Timer size={11} />
                                      {selectedTest.duration}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                <input 
                                  type="text"
                                  inputMode="decimal"
                                  placeholder={fieldInfo.placeholder}
                                  title={fieldInfo.hint}
                                  className="flex-1 min-w-[140px] p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                                  value={testValue}
                                  onKeyDown={e => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      handleSaveAndNextStudent();
                                    }
                                  }}
                                  onChange={e => {
                                    setTestValue(e.target.value);
                                    setResult(null);
                                  }}
                                />
                                <button 
                                  onClick={handleCalculate}
                                  disabled={loading || !testValue}
                                  className="bg-indigo-600 text-white px-4 py-3 rounded-xl font-black text-xs uppercase tracking-wider hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                                  title="Analyze Performance"
                                >
                                  {loading ? <Loader2 className="animate-spin" size={14} /> : <Calculator size={14} />}
                                  <span>Analyze</span>
                                </button>
                                <button 
                                  onClick={async () => {
                                    if (!testValue) return;
                                    if (!result) {
                                      setLoading(true);
                                      try {
                                        await handleSaveDirectly();
                                      } finally {
                                        setLoading(false);
                                      }
                                    } else {
                                      handleSave();
                                    }
                                  }}
                                  disabled={loading || !testValue}
                                  className={`px-4 py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                                    isSaved ? 'bg-emerald-500 text-white' : 'bg-slate-900 text-white hover:bg-slate-800'
                                  }`}
                                  title="Save score for this student"
                                >
                                  {isSaved ? <CheckCircle2 size={14} /> : <Save size={14} />}
                                  <span>{isSaved ? 'Saved' : 'Save'}</span>
                                </button>

                                {/* Save & Next Student Sequential Quick Action */}
                                <button
                                  type="button"
                                  onClick={handleSaveAndNextStudent}
                                  disabled={loading || !testValue}
                                  className="px-4 py-3 bg-[#D4A017] hover:bg-[#b88b14] text-slate-950 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer"
                                  title="Save and automatically select the next student (Enter)"
                                >
                                  <span>Save & Next</span>
                                  <FastForward size={14} />
                                </button>
                              </div>
                              <p className="text-[11px] font-medium text-slate-500 mt-1.5 flex items-center gap-1">
                                <Info size={12} className="text-indigo-500 shrink-0" />
                                <span>{fieldInfo.hint}</span>
                              </p>
                            </div>
                          );
                        })()}
                      </div>

                      {/* Explicit Protocol & Timing Guidance Card */}
                      {(() => {
                        const currentStudent = students.find(s => s.id === selectedStudentId);
                        const studentGrade = currentStudent?.grade || selectedGradeFilter;
                        const studentAge = currentStudent?.age || (age ? Number(age) : 0);
                        const isSenior = selectedBattery?.category?.toLowerCase().includes('senior') || ['11', '12'].includes(String(studentGrade)) || studentAge >= 16;
                        const isMiddle = selectedBattery?.category?.toLowerCase().includes('middle') || ['6', '7', '8'].includes(String(studentGrade)) || (studentAge >= 11 && studentAge <= 13);

                        return (
                          <div className="p-4 bg-amber-50/70 rounded-2xl border border-amber-200/80 space-y-2">
                            <div className="flex items-start justify-between gap-4">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <Timer size={16} className="text-amber-700 shrink-0" />
                                  <span className="font-black text-xs text-amber-950 uppercase tracking-tight">
                                    {selectedTest.name} &bull; {
                                      selectedTest.id === 'curl_ups'
                                        ? (isSenior ? '60 Seconds (1 Minute CBSE Board)' : isMiddle ? '30 Seconds (Official Khelo India)' : '30s Khelo India / 60s CBSE Cadence')
                                        : (selectedTest.duration || 'Standard Trial')
                                    }
                                  </span>
                                </div>
                                <p className="text-xs text-amber-900/80 font-medium leading-relaxed">
                                  {selectedTest.id === 'curl_ups'
                                    ? (isSenior 
                                        ? 'CBSE Senior Secondary (Grades 11 & 12) Physical Education protocol: Count total completed valid repetitions in 60 seconds (1 minute).'
                                        : isMiddle 
                                          ? 'Khelo India Middle School (Grades 6–8) protocol: Count total valid curl-ups completed in 30 seconds sliding fingers across 10cm measuring strip.'
                                          : 'Secondary (Grades 9–10): Count total valid curl-ups in 30 seconds (Official Khelo India) or 60 seconds (CBSE Cadence).')
                                    : (selectedTest.scoringGuide || selectedTest.description)}
                                </p>
                              </div>
                              <button
                                onClick={() => setActiveGuideTest(selectedTest)}
                                className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-[11px] font-black uppercase tracking-wider transition-all shrink-0 cursor-pointer shadow-xs"
                              >
                                View Guide Pop-Up
                              </button>
                            </div>

                            {/* Specific 30s vs 60s Protocol Pill Notice for Curl-Ups */}
                            {selectedTest.id === 'curl_ups' && (
                              <div className="pt-2 border-t border-amber-200/60 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-amber-950">Active Standard:</span>
                                  <span className={`px-2 py-0.5 rounded font-extrabold text-[10px] uppercase ${
                                    isSenior ? 'bg-amber-200 text-amber-900' : 'bg-indigo-100 text-indigo-900'
                                  }`}>
                                    {isSenior ? '60s CBSE Board Practical' : isMiddle ? '30s Khelo India (10cm strip)' : '30s KIFT / 60s Cadence'}
                                  </span>
                                </div>
                                <span className="text-slate-500 font-semibold">
                                  Target Range: <strong className="text-slate-800">{isSenior ? '20–48 reps (60s)' : '12–26 reps (30s)'}</strong>
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      {/* Live BMI Gauge Visualization if test is BMI or value is provided */}
                      {(selectedTest.id === 'bmi' || selectedTest.name.toLowerCase().includes('bmi')) && testValue && (
                        <BMISpectrumGauge 
                          bmiResult={calculateExactBMI(testValue)}
                          studentName={students.find(s => s.id === selectedStudentId)?.name}
                        />
                      )}

                      {error && (
                        <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-xs font-bold flex items-start space-x-2">
                          <AlertCircle size={16} className="flex-shrink-0" />
                          <span>{error}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Result Card */}
                  {result && (
                    <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 animate-slide-up">
                      <div className="flex flex-wrap justify-between items-center mb-8 pb-4 border-b border-slate-100 gap-4">
                        <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Assessment Report</h3>
                        <div className="flex flex-wrap items-center gap-3">
                          <button 
                            onClick={() => generateStudentCbsePdfReportCard()}
                            className="flex items-center space-x-2 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all bg-emerald-600 hover:bg-emerald-700 text-white shadow-md cursor-pointer"
                            title="Download CBSE Compliant PDF Report Card"
                          >
                            <FileText size={16} />
                            <span>Download CBSE PDF Report</span>
                          </button>
                          <button 
                            onClick={handleSave}
                            disabled={isSaved}
                            className={`flex items-center space-x-2 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none cursor-pointer ${
                              isSaved 
                                ? 'bg-emerald-500 text-white' 
                                : 'bg-indigo-600 text-white hover:bg-indigo-700'
                            }`}
                          >
                            {isSaved ? <CheckCircle2 size={16} /> : <Save size={16} />}
                            <span>{isSaved ? 'Student Result Saved' : 'Confirm & Save Result'}</span>
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        {result.tests.map((res, idx) => (
                          <div key={idx} className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{res.testName}</h4>
                            <div className="flex items-baseline space-x-2 mb-3">
                              <span className="text-3xl font-black text-slate-900">{res.score}</span>
                              <span className="text-xs font-bold text-indigo-600">{res.percentile} %ile</span>
                            </div>
                            <span className={`inline-block px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                              res.rating === 'Elite' ? 'bg-yellow-400 text-yellow-900' :
                              res.rating === 'Excellent' ? 'bg-indigo-600 text-white' :
                              res.rating === 'Good' ? 'bg-emerald-100 text-emerald-700' :
                              res.rating === 'Average' ? 'bg-slate-200 text-slate-600' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {res.rating}
                            </span>
                            <p className="mt-4 text-xs text-slate-500 leading-relaxed font-medium">
                              {res.recommendation}
                            </p>
                          </div>
                        ))}
                      </div>

                      <div className="bg-indigo-50 rounded-3xl p-8 border border-indigo-100 flex items-start space-x-6">
                        <div className="p-4 bg-white rounded-2xl shadow-sm">
                          <Trophy className="text-indigo-600" size={32} />
                        </div>
                        <div>
                          <h4 className="font-black text-indigo-900 text-lg mb-2 uppercase tracking-tight">Expert Summary</h4>
                          <p className="text-indigo-800/70 leading-relaxed font-medium">
                            {result.overallSummary}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* PERSISTENT FLOATING MOBILE STICKY SAVE BAR */}
                  <div className="fixed bottom-0 left-0 right-0 z-50 p-3.5 bg-[#0D2B52] border-t-4 border-[#D4A017] shadow-[0_-8px_25px_rgba(0,0,0,0.35)] md:hidden flex items-center justify-between gap-3">
                    <div className="text-white min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#D4A017] animate-pulse"></span>
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#D4A017] truncate">
                          {getActiveTests().length === 1 
                            ? getActiveTests()[0].name 
                            : `${getActiveTests().length} Active Tests (${getActiveTests().map(t => t.name).join(', ')})`}
                        </p>
                      </div>
                      <p className="text-xs font-extrabold text-white truncate">
                        {entryMode === 'batch' 
                          ? `${unsavedBatchCount} scores pending save` 
                          : testValue 
                            ? `Value: ${testValue} ${selectedTest?.unit || ''}` 
                            : 'Enter test score above'}
                      </p>
                    </div>

                    <button
                      onClick={entryMode === 'batch' ? handleBatchSave : async () => {
                        if (!testValue) return;
                        if (!result) {
                          setLoading(true);
                          try { await handleSaveDirectly(); } finally { setLoading(false); }
                        } else { handleSave(); }
                      }}
                      disabled={entryMode === 'batch' ? (batchSaving || unsavedBatchCount === 0) : (!testValue || loading)}
                      className="px-5 py-3 bg-[#D4A017] hover:bg-[#e0b028] text-slate-900 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg border-2 border-slate-900 active:scale-95 disabled:opacity-50 transition-all flex items-center gap-2 shrink-0 cursor-pointer"
                    >
                      {batchSaving || loading ? (
                        <Loader2 size={16} className="animate-spin text-slate-900" />
                      ) : isSaved ? (
                        <CheckCircle2 size={16} className="text-emerald-900" />
                      ) : (
                        <Save size={16} className="text-slate-900" />
                      )}
                      <span>{isSaved ? 'Saved!' : 'SAVE FIT SCORES'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
     </div>
    )}

    {/* CBSE Test Guide Pop-Up Modal */}
    {activeGuideTest && (
      <TestGuideModal
        test={activeGuideTest}
        categoryName={selectedBattery?.category}
        onClose={() => setActiveGuideTest(null)}
        onOpenVideo={(t) => {
          setActiveGuideTest(null);
          setActiveVideoTest(t);
        }}
      />
    )}

    {/* Official Video Demonstration Player Modal */}
    {activeVideoTest && (
      <TestVideoModal
        test={activeVideoTest}
        battery={selectedBattery}
        categoryName={selectedBattery?.category}
        onClose={() => setActiveVideoTest(null)}
        onSelectTest={(t) => {
          setSelectedTest(t);
        }}
      />
    )}

    {/* Persistent Fixed Footer Bar with Real-Time 'Selected Tests' Counter & Actions */}
    {(selectedBattery || selectedTest) && (
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#0D2B52]/95 text-white backdrop-blur-md border-t-2 border-[#D4A017] px-3 sm:px-6 py-3 shadow-[0_-6px_25px_rgba(0,0,0,0.25)] transition-all">
        {(() => {
          const activeTests = getActiveTests();
          const totalBatteryTests = selectedBattery?.tests.length || (activeTests.length > 0 ? activeTests.length : 8);
          const isAllSelected = selectedBattery ? activeTests.length === selectedBattery.tests.length : false;
          const isSingleSelected = activeTests.length === 1;

          return (
            <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
              {/* Left Section: Selected Tests Counter Badge & Active Test Chips */}
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                {/* Real-time Persistent Counter Badge */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <div className="min-h-[42px] px-3.5 py-2 bg-[#D4A017] text-slate-950 rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-md">
                    <CheckCheck size={17} className="text-slate-950 shrink-0" />
                    <span>
                      {isAllSelected 
                        ? `All ${activeTests.length} Tests Active` 
                        : isSingleSelected 
                          ? `1 Test Active (${activeTests[0]?.name?.split(' ')[0] || ''})` 
                          : `${activeTests.length} of ${totalBatteryTests} Tests Active`}
                    </span>
                  </div>
                </div>

                {/* Horizontal Scrollable Active Test Chips */}
                <div className="hidden md:flex items-center gap-2 overflow-x-auto custom-scrollbar max-w-md lg:max-w-xl py-1">
                  {activeTests.map(t => (
                    <span 
                      key={t.id}
                      className="min-h-[34px] inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 bg-white/10 border border-white/20 hover:bg-white/20 text-white rounded-xl text-xs font-bold shrink-0 transition-colors"
                      title={t.name}
                    >
                      <span className="truncate max-w-[120px]">{t.name}</span>
                      
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveGuideTest(t);
                        }}
                        className="w-5 h-5 rounded-full hover:bg-indigo-500 text-[#D4A017] hover:text-white flex items-center justify-center text-xs cursor-pointer transition-colors"
                        title={`View ${t.name} purpose & execution method`}
                        aria-label={`View ${t.name} purpose & execution method`}
                      >
                        <Info size={12} />
                      </button>

                      {activeTests.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            const nextIds = activeTests.filter(item => item.id !== t.id).map(item => item.id);
                            setTestSelectionFilter('custom');
                            setCustomSelectedTestIds(nextIds);
                          }}
                          className="w-5 h-5 rounded-full hover:bg-red-500 text-white/80 hover:text-white flex items-center justify-center text-xs cursor-pointer transition-colors"
                          title={`Remove ${t.name}`}
                          aria-label={`Remove ${t.name}`}
                        >
                          &times;
                        </button>
                      )}
                    </span>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      const el = document.getElementById('test-selection-chips');
                      if (el) {
                        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }
                    }}
                    className="min-h-[34px] text-xs font-bold text-[#D4A017] hover:underline px-2.5 py-1 shrink-0 flex items-center gap-1 cursor-pointer"
                  >
                    <span>+ Edit Pick</span>
                  </button>
                </div>

                {/* Mobile Active Test Name Preview */}
                <div className="md:hidden truncate text-xs text-slate-300 font-medium">
                  {activeTests.map(t => t.name).join(', ')}
                </div>
              </div>

              {/* Middle Section: Quick Preset Toggles */}
              {selectedBattery && (
                <div className="hidden sm:flex items-center gap-1 bg-white/10 p-1.5 rounded-2xl border border-white/10 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      const target = selectedTest?.id || selectedBattery.tests[0].id;
                      setTestSelectionFilter('custom');
                      const t = selectedBattery.tests.find(item => item.id === target) || selectedBattery.tests[0];
                      setSelectedTest(t);
                      setCustomSelectedTestIds([target]);
                    }}
                    className={`min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer active:scale-95 ${
                      activeTests.length === 1 ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-200 hover:text-white'
                    }`}
                  >
                    1 Test
                  </button>
                  {selectedBattery.tests.length >= 2 && (
                    <button
                      type="button"
                      onClick={() => {
                        setTestSelectionFilter('custom');
                        setCustomSelectedTestIds([selectedBattery.tests[0].id, selectedBattery.tests[1].id]);
                      }}
                      className={`min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer active:scale-95 ${
                        activeTests.length === 2 ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-200 hover:text-white'
                      }`}
                    >
                      Pick 2
                    </button>
                  )}
                  {selectedBattery.tests.length >= 3 && (
                    <button
                      type="button"
                      onClick={() => {
                        setTestSelectionFilter('custom');
                        setCustomSelectedTestIds([selectedBattery.tests[0].id, selectedBattery.tests[1].id, selectedBattery.tests[2].id]);
                      }}
                      className={`min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer active:scale-95 ${
                        activeTests.length === 3 ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-200 hover:text-white'
                      }`}
                    >
                      Pick 3
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setTestSelectionFilter('all');
                      setCustomSelectedTestIds(selectedBattery.tests.map(t => t.id));
                    }}
                    className={`min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer active:scale-95 ${
                      isAllSelected ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-200 hover:text-white'
                    }`}
                  >
                    All ({totalBatteryTests})
                  </button>
                </div>
              )}

              {/* Right Section: Layout Toggle & Batch Save / Student Counts */}
              <div className="flex items-center gap-2.5 shrink-0">
                {entryMode === 'batch' && filteredStudentsForSelect.length > 0 && (
                  <>
                    <div className="flex bg-white/10 p-1 rounded-xl border border-white/10">
                      <button
                        type="button"
                        onClick={() => setViewLayoutMode('cards')}
                        className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 ${
                          viewLayoutMode === 'cards' ? 'bg-[#D4A017] text-slate-950 shadow-xs' : 'text-slate-300 hover:text-white'
                        }`}
                        title="Mobile Cards View"
                      >
                        <Smartphone size={14} />
                        <span className="hidden sm:inline">Cards</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setViewLayoutMode('table')}
                        className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 ${
                          viewLayoutMode === 'table' ? 'bg-[#D4A017] text-slate-950 shadow-xs' : 'text-slate-300 hover:text-white'
                        }`}
                        title="Spreadsheet Table Grid"
                      >
                        <Table size={14} />
                        <span className="hidden sm:inline">Table</span>
                      </button>
                    </div>

                    <div className="hidden lg:block text-xs font-bold text-slate-300">
                      <span>{filteredStudentsForSelect.length} stds</span>
                      {unsavedBatchCount > 0 && (
                        <span className="ml-1 text-amber-300 font-black">({unsavedBatchCount} unsaved)</span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={handleBatchSave}
                      disabled={batchSaving || filteredStudentsForSelect.length === 0}
                      className="min-h-[44px] px-4 py-2 bg-[#D4A017] hover:bg-[#c49312] text-slate-950 border border-amber-300 rounded-xl font-black text-xs uppercase tracking-wider shadow-md flex items-center gap-2 disabled:opacity-50 cursor-pointer active:scale-95 transition-all"
                    >
                      {batchSaving ? (
                        <Loader2 size={15} className="animate-spin text-slate-950" />
                      ) : isSaved ? (
                        <CheckCircle2 size={15} className="text-emerald-950" />
                      ) : (
                        <Save size={15} className="text-slate-950" />
                      )}
                      <span>{batchSaving ? 'Saving...' : isSaved ? 'Saved!' : `Save All (${unsavedBatchCount})`}</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })()}
      </div>
    )}

    {/* Individual Student Profile & D3 Progress Modal */}
    {profileModalStudent && (
      <IndividualStudentProfileModal
        student={profileModalStudent}
        isOpen={Boolean(profileModalStudent)}
        onClose={() => setProfileModalStudent(null)}
        onNavigateToFitness={(studentId) => {
          setSelectedStudentId(studentId);
          setEntryMode('single');
        }}
        onNavigateToReportCard={(studentId) => {
          generateStudentCbsePdfReportCard(studentId);
        }}
      />
    )}
  </div>
  );
};

export default FitnessTests;
