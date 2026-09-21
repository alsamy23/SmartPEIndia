
import React, { useState, useEffect, useRef } from 'react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { toJpeg } from 'html-to-image';
import { 
  FileText, 
  Download, 
  Printer, 
  ChevronRight, 
  Search, 
  Filter, 
  TrendingUp, 
  TrendingDown,
  Users, 
  User,
  Activity,
  ArrowLeft,
  Calendar,
  BarChart3,
  Trophy,
  Zap,
  Info,
  Loader2,
  Database,
  Sparkles,
  Shield,
  UploadCloud,
  Trash2,
  Check,
  ChevronDown,
  X,
  School as SchoolIcon
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  LineChart,
  Line,
  Legend
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { fitnessService, KIFT_BATTERIES } from '../services/fitnessService.ts';
import type { Student, FitnessResult, Team, SchoolMember, School } from '../types.ts';
import { 
  parseFitnessValue, 
  calculateExactBMI, 
  calculateTestTrend, 
  formatTestDisplayValue 
} from '../utils/bmiUtils.ts';
import { auth } from '../services/firebase.ts';
import { toast } from '../services/toast.ts';
import Logo from './Logo.tsx';
import { D3StudentProgressChart } from './fitness/D3StudentProgressChart.tsx';
import { StudentGrowthComparisonChart } from './fitness/StudentGrowthComparisonChart.tsx';

interface FitnessReportsProps {
  initialStudentId?: string;
}

const FitnessReports: React.FC<FitnessReportsProps> = ({ initialStudentId }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [results, setResults] = useState<FitnessResult[]>([]);
  const [studentSpecificResults, setStudentSpecificResults] = useState<FitnessResult[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  
  // Playground states
  const [generatingDemo, setGeneratingDemo] = useState(false);
  const [showDbExplorer, setShowDbExplorer] = useState(false);
  const [activeDbTab, setActiveDbTab] = useState<'student' | 'results' | 'rubric'>('student');
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<'individual' | 'class' | 'school'>('individual');
  const [selectedId, setSelectedId] = useState<string>(initialStudentId || '');
  const [reportData, setReportData] = useState<any>(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  // Searchable dropdown state for Student & Class report selection
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedViaStudent, setSelectedViaStudent] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Click outside & Escape key listeners to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Autofocus search input when dropdown opens
  useEffect(() => {
    if (isDropdownOpen) {
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 60);
      return () => clearTimeout(timer);
    }
  }, [isDropdownOpen]);

  useEffect(() => {
    if (initialStudentId) {
      setSelectedId(initialStudentId);
      setSelectedType('individual');
    }
  }, [initialStudentId]);

  const [isGenerating, setIsGenerating] = useState(false);
  const [userProfile, setUserProfile] = useState<SchoolMember | null>(null);
  const [school, setSchool] = useState<School | null>(null);
  const [editableSchoolName, setEditableSchoolName] = useState("SmartPE Public School");
  const [schoolLogoUrl, setSchoolLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    let unsubResults: (() => void) | undefined;
    let unsubTeams: (() => void) | undefined;
    let unsubStudents: (() => void) | undefined;

    const fetchAllData = async () => {
      if (!auth.currentUser) {
        setLoading(false);
        return;
      }

      try {
        const profile = await fitnessService.getSchoolMember(auth.currentUser.uid);
        setUserProfile(profile);

        if (profile) {
          try {
            const schoolData = await fitnessService.getSchool(profile.schoolId, true);
            setSchool(schoolData);
            if (schoolData?.name) {
              setEditableSchoolName(schoolData.name);
            } else if (profile.schoolName) {
              setEditableSchoolName(profile.schoolName);
            }

            if (schoolData?.logoUrl) {
              setSchoolLogoUrl(schoolData.logoUrl);
            } else if (profile.schoolLogo) {
              setSchoolLogoUrl(profile.schoolLogo);
            }
          } catch (schoolErr) {
            console.error("Error loading school info:", schoolErr);
          }

          const isAdmin = profile.role === 'admin';
          unsubResults = fitnessService.subscribeToResults(
            auth.currentUser.uid,
            profile.schoolId,
            isAdmin,
            setResults
          );
          unsubTeams = fitnessService.subscribeToTeams(
            auth.currentUser.uid,
            profile.schoolId,
            isAdmin,
            setTeams
          );
          unsubStudents = fitnessService.subscribeToStudents(
            auth.currentUser.uid,
            profile.schoolId,
            isAdmin,
            (data) => {
              setStudents(data);
              setLoading(false);
            }
          );
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error("Error in FitnessReports data fetch:", err);
        setLoading(false);
      }
    };

    fetchAllData();
    
    return () => {
      unsubResults?.();
      unsubTeams?.();
      unsubStudents?.();
    };
  }, [auth.currentUser?.uid]);

  useEffect(() => {
    let unsubStudentResults: (() => void) | undefined;

    if (selectedType === 'individual' && selectedId) {
      const student = students.find(s => s.id === selectedId);
      const schoolId = student?.schoolId || userProfile?.schoolId;
      unsubStudentResults = fitnessService.subscribeToStudentResults(selectedId, schoolId, setStudentSpecificResults);
    } else {
      setStudentSpecificResults([]);
    }

    return () => unsubStudentResults?.();
  }, [selectedId, selectedType, students, userProfile]);

  const calculateAvg = (resultsList: FitnessResult[]) => {
    if (resultsList.length === 0) return 'N/A';
    const sum = resultsList.reduce((acc, r) => acc + parseFitnessValue(r.value), 0);
    return (sum / resultsList.length).toFixed(1);
  };

  const groupCount = (list: any[], key: string) => {
    return list.reduce((acc, item) => {
      const val = item[key];
      acc[val] = (acc[val] || 0) + 1;
      return acc;
    }, {});
  };

  const parseValue = (val: string) => {
    return parseFitnessValue(val);
  };

  // Dynamically group students into grade/section options so all registered KG to Grade 12 students are selectable
  const dynamicClassOptions = React.useMemo(() => {
    const classMap: Record<string, { id: string; name: string; grade: string; section: string; studentIds: string[] }> = {};

    students.forEach(s => {
      const g = (s.grade || 'Unassigned').toString().trim();
      const sec = (s.section || '').toString().trim();
      const classKey = sec ? `class_${g}_sec_${sec}` : `class_${g}`;
      const className = sec ? `Grade ${g} - Section ${sec}` : `Grade ${g}`;

      if (!classMap[classKey]) {
        classMap[classKey] = {
          id: classKey,
          name: className,
          grade: g,
          section: sec,
          studentIds: []
        };
      }
      classMap[classKey].studentIds.push(s.id);
    });

    const gradeOrder = ['NURSERY', 'KG', 'LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
    
    return Object.values(classMap).sort((a, b) => {
      const gA = a.grade.toUpperCase();
      const gB = b.grade.toUpperCase();
      const idxA = gradeOrder.indexOf(gA);
      const idxB = gradeOrder.indexOf(gB);

      if (idxA !== -1 && idxB !== -1) {
        if (idxA !== idxB) return idxA - idxB;
        return a.section.localeCompare(b.section);
      }
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;

      const numA = parseInt(gA, 10);
      const numB = parseInt(gB, 10);
      if (!isNaN(numA) && !isNaN(numB)) {
        if (numA !== numB) return numA - numB;
        return a.section.localeCompare(b.section);
      }

      return a.name.localeCompare(b.name);
    });
  }, [students]);

  // In class mode: students matching the search query so teacher can click student name to select their class
  const matchingStudentsForClass = React.useMemo(() => {
    if (selectedType !== 'class' || !searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return students.filter(s => 
      s.name.toLowerCase().includes(q) || 
      (s.rollNumber && s.rollNumber.toLowerCase().includes(q))
    ).slice(0, 15);
  }, [selectedType, searchQuery, students]);

  // Classes matching the search query (by class name or containing matching students)
  const filteredClassOptions = React.useMemo(() => {
    if (selectedType !== 'class') return [];
    if (!searchQuery.trim()) return dynamicClassOptions;
    const q = searchQuery.toLowerCase().trim();
    return dynamicClassOptions.filter(c => {
      if (c.name.toLowerCase().includes(q) || c.grade.toLowerCase().includes(q) || (c.section && c.section.toLowerCase().includes(q))) {
        return true;
      }
      return c.studentIds.some(sid => {
        const st = students.find(s => s.id === sid);
        return st && (st.name.toLowerCase().includes(q) || (st.rollNumber && st.rollNumber.toLowerCase().includes(q)));
      });
    });
  }, [selectedType, searchQuery, dynamicClassOptions, students]);

  // Teams matching search
  const filteredTeams = React.useMemo(() => {
    if (selectedType !== 'class') return [];
    if (!searchQuery.trim()) return teams;
    const q = searchQuery.toLowerCase().trim();
    return teams.filter(t => 
      t.name.toLowerCase().includes(q) || 
      (t.grade && t.grade.toLowerCase().includes(q))
    );
  }, [selectedType, searchQuery, teams]);

  // In individual (student) mode: students matching search query
  const filteredStudents = React.useMemo(() => {
    if (selectedType !== 'individual') return [];
    if (!searchQuery.trim()) return students;
    const q = searchQuery.toLowerCase().trim();
    return students.filter(s => 
      s.name.toLowerCase().includes(q) ||
      (s.rollNumber && s.rollNumber.toLowerCase().includes(q)) ||
      (s.grade && `grade ${s.grade}`.toLowerCase().includes(q)) ||
      (s.section && `section ${s.section}`.toLowerCase().includes(q))
    );
  }, [selectedType, searchQuery, students]);

  // Selected item display label for dropdown trigger
  const selectedDisplayLabel = React.useMemo(() => {
    if (!selectedId) {
      return selectedType === 'individual' ? 'Choose Student...' : 'Choose Class...';
    }
    if (selectedType === 'individual') {
      const s = students.find(st => st.id === selectedId);
      if (s) {
        return `${s.name} (${s.rollNumber || 'PE'}) - Grade ${s.grade}${s.section ? `-${s.section}` : ''}`;
      }
      return selectedId;
    }
    if (selectedType === 'class') {
      const c = dynamicClassOptions.find(opt => opt.id === selectedId);
      if (c) {
        return `${c.name} (${c.studentIds.length} Students)`;
      }
      const t = teams.find(tm => tm.id === selectedId);
      if (t) {
        return `${t.name} (Grade ${t.grade})`;
      }
      return selectedId;
    }
    return selectedId;
  }, [selectedId, selectedType, students, dynamicClassOptions, teams]);

  // Selection handlers
  const handleSelectClassViaStudent = (student: Student) => {
    const matchedClass = dynamicClassOptions.find(c => c.studentIds.includes(student.id))
      || dynamicClassOptions.find(c => c.grade === student.grade && (!c.section || c.section === student.section));
    
    if (matchedClass) {
      setSelectedId(matchedClass.id);
    } else {
      const sec = (student.section || '').toString().trim();
      const g = (student.grade || 'Unassigned').toString().trim();
      setSelectedId(sec ? `class_${g}_sec_${sec}` : `class_${g}`);
    }
    setSelectedViaStudent(student.name);
    setIsDropdownOpen(false);
    setSearchQuery('');
  };

  const handleSelectClass = (classId: string) => {
    setSelectedId(classId);
    setSelectedViaStudent(null);
    setIsDropdownOpen(false);
    setSearchQuery('');
  };

  const handleSelectTeam = (teamId: string) => {
    setSelectedId(teamId);
    setSelectedViaStudent(null);
    setIsDropdownOpen(false);
    setSearchQuery('');
  };

  const handleSelectStudent = (studentId: string) => {
    setSelectedId(studentId);
    setSelectedViaStudent(null);
    setIsDropdownOpen(false);
    setSearchQuery('');
  };

  const generateReport = React.useCallback(() => {
    if (!selectedId && selectedType !== 'school') return;
    
    setIsGenerating(true);
    
    // Simulate generation delay
    setTimeout(() => {
      let data: any = {};
      
      if (selectedType === 'individual') {
        const student = students.find(s => s.id === selectedId);
        // Use studentSpecificResults if available, fallback to general results filter
        const studentResults = studentSpecificResults.length > 0 
          ? studentSpecificResults 
          : results.filter(r => r.studentId === selectedId);
        
        // Group by term
        const byTerm: Record<string, FitnessResult[]> = {};
        studentResults.forEach(r => {
          if (!byTerm[r.term]) byTerm[r.term] = [];
          byTerm[r.term].push(r);
        });

        // Separate physical and rubric results for cleaner visual charting
        const physicalResults = studentResults.filter(r => !r.testId.startsWith('rubric_'));

        // Prep chart data - use latest for radar
        const latestByTest: Record<string, FitnessResult> = {};
        physicalResults.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).forEach(r => {
          if (!latestByTest[r.testId]) {
            latestByTest[r.testId] = r;
          }
        });

        const radarData = Object.values(latestByTest).map(r => ({
          subject: r.testName.split('(')[0].trim(),
          A: parseValue(r.value),
          fullMark: 100
        }));

        const progressData = physicalResults.reduce((acc: any, r) => {
          const existing = acc.find((item: any) => item.term === r.term);
          if (existing) {
            existing[r.testName] = parseValue(r.value);
          } else {
            acc.push({ term: r.term, [r.testName]: parseValue(r.value) });
          }
          return acc;
        }, []).sort((a: any, b: any) => {
          const order = ['Baseline', 'Term 1', 'Term 2', 'Final'];
          return order.indexOf(a.term) - order.indexOf(b.term);
        });

        // Comparison benchmarks - compare student averages vs school averages for same tests
        const comparisonData = Object.values(latestByTest).map(r => {
          const sameTestResults = results.filter(res => res.testId === r.testId);
          const schoolAvg = sameTestResults.length > 0 
            ? sameTestResults.reduce((sum, res) => sum + parseValue(res.value), 0) / sameTestResults.length
            : 0;
            
          return {
            name: r.testName.split('(')[0].trim(),
            student: parseValue(r.value),
            average: parseFloat(schoolAvg.toFixed(1))
          };
        });

        // Calculate dynamic feedback based on actual scores
        const feedbackItems: { testName: string; rating: string; status: 'Excellent' | 'Satisfactory' | 'Needs Improvement'; details: string; isImprovement: boolean }[] = [];
        const strengths: string[] = [];
        const improvements: string[] = [];
        let totalImprovementCount = 0;

        // Get latest result for ALL tests including rubrics
        const latestAllByTest: Record<string, FitnessResult> = {};
        [...studentResults].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).forEach(r => {
          if (!latestAllByTest[r.testId]) {
            latestAllByTest[r.testId] = r;
          }
        });

        Object.entries(latestAllByTest).forEach(([testId, result]) => {
          const val = parseValue(result.value);
          const name = result.testName.split('(')[0].trim();
          
          // Get baseline & subsequent terms if they exist
          const baselineResult = studentResults.find(r => r.testId === testId && r.term === 'Baseline');
          const term1Result = studentResults.find(r => r.testId === testId && r.term === 'Term 1');
          const term2Result = studentResults.find(r => r.testId === testId && r.term === 'Term 2');
          
          const baselineVal = baselineResult ? parseValue(baselineResult.value) : null;
          const term1Val = term1Result ? parseValue(term1Result.value) : null;
          const term2Val = term2Result ? parseValue(term2Result.value) : null;
          
          let rating: string = 'Satisfactory';
          let status: 'Excellent' | 'Satisfactory' | 'Needs Improvement' = 'Satisfactory';
          let details = '';
          let isImprovement = false;

          // Check if there was improvement across terms
          if (baselineVal !== null) {
            const currentVal = term2Val ?? term1Val ?? val;
            if (testId === 'sprint_50m' || testId === 'shuttle_4x10' || testId === 'run_600m') {
              // Lower is better for timed sprints/runs
              if (currentVal < baselineVal) {
                isImprovement = true;
                totalImprovementCount++;
              }
            } else {
              // Higher is better for jumps, flexibility, and rubrics
              if (currentVal > baselineVal) {
                isImprovement = true;
                totalImprovementCount++;
              }
            }
          }

          // Specific test rating rules
          if (testId === 'bmi' || name.toLowerCase().includes('bmi')) {
            const bmiRes = calculateExactBMI(result.value);
            rating = `${bmiRes.category} (${bmiRes.bmi} kg/m²)`;
            status = bmiRes.rating;
            details = bmiRes.details;
          } else if (testId === 'sprint_50m') {
            if (val < 8.5) {
              rating = 'Excellent (Exceptional Speed)';
              status = 'Excellent';
              details = 'Outstanding sprint timing! Displays elite starting velocity and stride acceleration.';
            } else if (val <= 10.0) {
              rating = 'Satisfactory (Good Pace)';
              status = 'Satisfactory';
              details = 'Displays a healthy, active speed level. Focus on explosive knee drives to further lower the sprint timing.';
            } else {
              rating = 'Needs Improvement (Below Average)';
              status = 'Needs Improvement';
              details = 'Acceleration is slightly below peak level. Wall-sprints and high-knees exercises are recommended to build rapid acceleration.';
            }
          } else if (testId === 'shuttle_4x10') {
            if (val < 12.0) {
              rating = 'Excellent (Superb Agility)';
              status = 'Excellent';
              details = 'Outstanding balance and reaction times! Quick direction changes show top-tier ankle stability and muscle control.';
            } else if (val <= 14.5) {
              rating = 'Satisfactory (Healthy Agility)';
              status = 'Satisfactory';
              details = 'Good change of direction. Focus on keeping the center of gravity low when turning around cones to shave off precious seconds.';
            } else {
              rating = 'Needs Improvement (Below Average)';
              status = 'Needs Improvement';
              details = 'Reaction times are slightly slower. Cone lateral bounds and ladder drills are highly recommended.';
            }
          } else if (testId === 'run_600m') {
            if (val < 160) { // 2:40
              rating = 'Excellent (High Endurance)';
              status = 'Excellent';
              details = 'Excellent cardiovascular efficiency! Displays very fast recovery rates and high aerobic stamina.';
            } else if (val <= 210) { // 3:30
              rating = 'Satisfactory (Good Stamina)';
              status = 'Satisfactory';
              details = 'Satisfactory cardiovascular endurance. Continuous jogging of 15-20 mins will expand aerobic capacity further.';
            } else {
              rating = 'Needs Improvement (Below Average)';
              status = 'Needs Improvement';
              details = 'Cardiovascular stamina requires building up. Standard interval walking/jogging and lap training will improve endurance.';
            }
          } else if (testId === 'broad_jump') {
            if (val > 160) {
              rating = 'Excellent (Powerful Leap)';
              status = 'Excellent';
              details = 'Exceptional explosive lower-body strength! Excellent hip extension and coordinated landing mechanics.';
            } else if (val >= 130) {
              rating = 'Satisfactory (Good Power)';
              status = 'Satisfactory';
              details = 'Good explosive leaping strength. Squat jumps and skipping will help build faster vertical/horizontal drive.';
            } else {
              rating = 'Needs Improvement (Below Average)';
              status = 'Needs Improvement';
              details = 'Lower-body drive is below par. Focused calf raises, squats, and broad-jump repetitions are recommended.';
            }
          } else if (testId === 'sit_reach') {
            if (val > 18) {
              rating = 'Excellent (High Flexibility)';
              status = 'Excellent';
              details = 'Elite hamstring and lower-back flexibility. Reduced risk of muscle strain during rigorous sports.';
            } else if (val >= 10) {
              rating = 'Satisfactory (Good Range)';
              status = 'Satisfactory';
              details = 'Healthy, acceptable range of motion. Continuous static stretching pre/post-workouts will maintain and improve this flexibility.';
            } else {
              rating = 'Needs Improvement (Below Average)';
              status = 'Needs Improvement';
              details = 'Hamstring and posterior muscles are tight. Focus on hamstring stretches, seated forward bends, and yoga stretches daily.';
            }
          } else if (testId.startsWith('rubric_')) {
            if (val >= 9) {
              rating = 'Mastery (Excellent)';
              status = 'Excellent';
              details = 'Demonstrates supreme skill command. High game IQ, superb positioning, and execution of complex tactical play.';
            } else if (val >= 7) {
              rating = 'Advanced (Satisfactory)';
              status = 'Excellent';
              details = 'Strong technical proficiency. Accurate distribution and spatial control under match pressure.';
            } else if (val >= 5) {
              rating = 'Proficient (Satisfactory)';
              status = 'Satisfactory';
              details = 'Healthy competency in basic rules and dribble patterns. Maintain teamwork and target practice.';
            } else {
              rating = 'Developing (Needs Improvement)';
              status = 'Needs Improvement';
              details = 'Working to grasp core positioning and consistent ball-touch control. Practice wall-passes and 1v1 play.';
            }
          } else {
            if (val >= 80) {
              rating = 'Excellent';
              status = 'Excellent';
              details = 'Outstanding competence and skill integration across general physical tasks.';
            } else if (val >= 50) {
              rating = 'Satisfactory';
              status = 'Satisfactory';
              details = 'Achieved target performance criteria. Regular physical activities will support continued fitness.';
            } else {
              rating = 'Needs Improvement';
              status = 'Needs Improvement';
              details = 'Below peer average. Needs guided physical guidance, continuous practices, and motor-skill games.';
            }
          }

          feedbackItems.push({
            testName: name,
            rating,
            status,
            details,
            isImprovement
          });

          if (status === 'Excellent' || (status === 'Satisfactory' && isImprovement)) {
            strengths.push(`${name}: Rated as ${rating}. ${details}`);
          } else if (status === 'Needs Improvement') {
            improvements.push(`${name}: Rated as ${rating}. ${details}`);
          }
        });

        // Generate overall summary narrative
        let computedSummary = "";
        if (student?.name) {
          const improvementText = totalImprovementCount > 0 
            ? `shows remarkable developmental progress, demonstrating measurable improvement in ${totalImprovementCount} fitness criteria since baseline tests.`
            : `maintains robust physical capabilities with solid athletic interest.`;
            
          const topStrength = strengths.length > 0 
            ? `Particularly outstanding progress or high competency was demonstrated in ${strengths[0].split(':')[0].trim()}.` 
            : "";
            
          const keyImprovement = improvements.length > 0
            ? `To further elevate performance, specialized focus is recommended in ${improvements[0].split(':')[0].trim()}.`
            : "No critical areas require correction. Continue staying active and healthy!";

          computedSummary = `${student.name} ${improvementText} ${topStrength} ${keyImprovement}`;
        } else {
          computedSummary = "Consistent physical growth observed across multiple testing metrics.";
        }

        data = {
          title: `Fitness Report: ${student?.name}`,
          subtitle: `Roll No: ${student?.rollNumber} | Grade: ${student?.grade}-${student?.section}`,
          student,
          studentResults, // Store filtered results directly
          byTerm,
          terms: ['Baseline', 'Term 1', 'Term 2', 'Final'].filter(t => byTerm[t]),
          overallSummary: computedSummary,
          feedbackItems,
          strengths,
          improvements,
          radarData,
          progressData,
          latestByTest,
          comparisonData
        };
      } else if (selectedType === 'class') {
        let targetStudents: Student[] = [];
        let className = '';
        let classSubtitle = '';

        const dynamicOption = dynamicClassOptions.find(c => c.id === selectedId);
        const team = teams.find(t => t.id === selectedId);

        if (dynamicOption) {
          targetStudents = students.filter(s => dynamicOption.studentIds.includes(s.id));
          className = dynamicOption.name;
          classSubtitle = `Grade: ${dynamicOption.grade}${dynamicOption.section ? `-${dynamicOption.section}` : ''} | Total Students: ${targetStudents.length}`;
        } else if (team) {
          targetStudents = team.studentIds && team.studentIds.length > 0 
            ? students.filter(s => team.studentIds.includes(s.id))
            : students.filter(s => s.grade === team.grade && (!team.section || s.section === team.section));
          className = team.name;
          classSubtitle = `Grade: ${team.grade}${team.section ? `-${team.section}` : ''} | Total Students: ${targetStudents.length}`;
        } else {
          targetStudents = students.filter(s => s.grade === selectedId || `class_${s.grade}` === selectedId);
          className = `Class ${selectedId || 'All'}`;
          classSubtitle = `Total Students: ${targetStudents.length}`;
        }

        const teamResults = results.filter(r => targetStudents.some(s => s.id === r.studentId));
        
        // Distribution of tests
        const testCounts = groupCount(teamResults, 'testName');
        const distributionData = Object.entries(testCounts).map(([name, count]) => ({
          name: name.split('(')[0].trim(),
          count
        }));

        // Average scores by test for the class
        const testAverages: Record<string, { sum: number, count: number, unit: string }> = {};
        teamResults.forEach(r => {
          if (!testAverages[r.testName]) {
            testAverages[r.testName] = { sum: 0, count: 0, unit: r.unit };
          }
          const val = parseValue(r.value);
          if (!isNaN(val)) {
            testAverages[r.testName].sum += val;
            testAverages[r.testName].count += 1;
          }
        });

        const classAverageData = Object.entries(testAverages).map(([name, stats]) => ({
          name: name.split('(')[0].trim(),
          average: stats.count > 0 ? parseFloat((stats.sum / stats.count).toFixed(1)) : 0,
          unit: stats.unit
        }));

        const assessedCount = new Set(teamResults.map(r => r.studentId)).size;
        const participationPct = targetStudents.length > 0 
          ? `${Math.round((assessedCount / targetStudents.length) * 100)}%`
          : '0%';

        data = {
          title: `Class Progress Report: ${className}`,
          subtitle: classSubtitle,
          team: team || dynamicOption,
          studentCount: targetStudents.length,
          avgBmi: calculateAvg(teamResults.filter(r => r.testId === 'bmi')),
          participation: participationPct,
          testCounts,
          distributionData,
          classAverageData,
          totalAssessments: teamResults.length
        };
      } else {
        // School-wide analysis
        const gradeStats: Record<string, { total: number, results: number, avg: number, bmiSum: number, bmiCount: number }> = {};
        const schoolTestAverages: Record<string, { sum: number, count: number }> = {};
        
        results.forEach(r => {
          const student = students.find(s => s.id === r.studentId);
          if (!student) return;
          
          const gradeKey = (student.grade || 'Unassigned').toString().trim();

          if (!gradeStats[gradeKey]) {
            gradeStats[gradeKey] = { total: 0, results: 0, avg: 0, bmiSum: 0, bmiCount: 0 };
          }
          
          const val = parseValue(r.value);
          if (!isNaN(val)) {
            gradeStats[gradeKey].avg += val;
            gradeStats[gradeKey].results += 1;

            if (r.testId === 'bmi') {
              gradeStats[gradeKey].bmiSum += val;
              gradeStats[gradeKey].bmiCount += 1;
            }
          }

          if (!schoolTestAverages[r.testName]) {
            schoolTestAverages[r.testName] = { sum: 0, count: 0 };
          }
          if (!isNaN(val)) {
            schoolTestAverages[r.testName].sum += val;
            schoolTestAverages[r.testName].count += 1;
          }
        });

        const barChartData = Object.entries(gradeStats).map(([grade, stats]) => ({
          grade: `Grade ${grade}`,
          average: stats.results > 0 ? parseFloat((stats.avg / stats.results).toFixed(1)) : 0,
          bmi: stats.bmiCount > 0 ? parseFloat((stats.bmiSum / stats.bmiCount).toFixed(1)) : 0
        })).sort((a, b) => a.grade.localeCompare(b.grade));

        const schoolAverages = Object.entries(schoolTestAverages).map(([name, stats]) => ({
          name: name.split('(')[0].trim(),
          average: stats.count > 0 ? parseFloat((stats.sum / stats.count).toFixed(1)) : 0
        }));

        Object.keys(gradeStats).forEach(grade => {
          gradeStats[grade].avg = gradeStats[grade].results > 0 
            ? gradeStats[grade].avg / gradeStats[grade].results 
            : 0;
        });

        // Identify grades needing improvement
        const sortedGrades = Object.entries(gradeStats)
          .filter(([_, stats]) => stats.results > 0)
          .sort((a, b) => a[1].avg - b[1].avg);
        
        const focusGrades = sortedGrades.slice(0, Math.ceil(sortedGrades.length * 0.3)).map(g => g[0]);

        data = {
          title: "School-wide Fitness Overview",
          subtitle: `Total Students: ${students.length} | Academic Year: 2024-25`,
          totalResults: results.length,
          topPerformers: students.slice(0, 5),
          testDistribution: groupCount(results, 'testName'),
          gradeStats,
          focusGrades: focusGrades || [],
          totalStudents: students.length,
          barChartData,
          schoolAverages
        };
      }
      
      setReportData(data);
      setIsGenerating(false);
    }, 1000);
  }, [selectedId, selectedType, students, results, teams, studentSpecificResults, dynamicClassOptions]);

  useEffect(() => {
    if (initialStudentId && students.length > 0 && results.length > 0) {
      generateReport();
    }
  }, [initialStudentId, students.length, results.length, generateReport]);

  // Auto generate report when scope is changed to 'school'
  useEffect(() => {
    if (selectedType === 'school' && students.length > 0) {
      generateReport();
    }
  }, [selectedType, students.length, generateReport]);

  // Also trigger if student results subscription updates for the selected student
  useEffect(() => {
    if (selectedType === 'individual' && selectedId && studentSpecificResults.length > 0) {
      generateReport();
    }
  }, [studentSpecificResults.length, selectedId, selectedType]);

  const handleGenerateDummyData = async () => {
    if (generatingDemo) return;
    try {
      setGeneratingDemo(true);
      const teacherId = auth.currentUser?.uid || 'temp_teacher_id';
      const schoolId = userProfile?.schoolId || `personal_${teacherId}`;
      const studentId = 'demo_kabir_dutt';

      const demoStudent: Student = {
        id: studentId,
        teacherId,
        schoolId,
        name: 'Kabir Dutt',
        rollNumber: 'PE-2026-07',
        grade: '8',
        section: 'A',
        gender: 'Male',
        age: 13,
        attendance: 94,
        performance: 'Excellent'
      };

      // 10 tests across 3 terms = 30 results
      const testCases = [
        // BMI
        { testId: 'bmi', testName: 'BMI (Height & Weight)', unit: 'kg/m²', valB: '18.2', valT1: '18.5', valT2: '18.7' },
        // Speed
        { testId: 'sprint_50m', testName: '50m Sprint Speed', unit: 'sec', valB: '9.2', valT1: '8.8', valT2: '8.4' },
        // Endurance
        { testId: 'run_600m', testName: '600m Endurance Run', unit: 'min:sec', valB: '3:05', valT1: '2:55', valT2: '2:42' },
        // Power
        { testId: 'broad_jump', testName: 'Standing Broad Jump', unit: 'cm', valB: '145', valT1: '155', valT2: '165' },
        // Flexibility
        { testId: 'sit_reach', testName: 'Sit & Reach Flexibility', unit: 'cm', valB: '14', valT1: '17', valT2: '19' },
        // Agility
        { testId: 'shuttle_4x10', testName: '4×10m Shuttle Run', unit: 'sec', valB: '13.5', valT1: '12.8', valT2: '12.2' },
        
        // GAME RUBRICS (Football Skills out of 10)
        { testId: 'rubric_fb_dribble', testName: 'Football: Dribbling & Control (Rubric)', unit: 'rating', valB: '5', valT1: '7', valT2: '9' },
        { testId: 'rubric_fb_pass', testName: 'Football: Passing & Accuracy (Rubric)', unit: 'rating', valB: '4', valT1: '6', valT2: '8' },
        { testId: 'rubric_fb_shoot', testName: 'Football: Shooting & Form (Rubric)', unit: 'rating', valB: '4', valT1: '5', valT2: '8' },
        { testId: 'rubric_fb_tactics', testName: 'Football: Positioning & Tactics (Rubric)', unit: 'rating', valB: '3', valT1: '6', valT2: '9' }
      ];

      const getRubricRating = (val: number) => {
        if (val >= 9) return 'Mastery';
        if (val >= 7) return 'Advanced';
        if (val >= 5) return 'Proficient';
        if (val >= 3) return 'Developing';
        return 'Novice';
      };

      const resultsToSave: FitnessResult[] = [];

      testCases.forEach(test => {
        const isRubric = test.testId.startsWith('rubric_');
        // Baseline
        resultsToSave.push({
          id: `${studentId}_${test.testId}_baseline`,
          teacherId,
          schoolId,
          studentId,
          testId: test.testId,
          testName: test.testName,
          value: test.valB,
          unit: test.unit,
          date: '2024-09-10',
          term: 'Baseline',
          rating: isRubric ? getRubricRating(parseFloat(test.valB)) : 'Average'
        });

        // Term 1
        resultsToSave.push({
          id: `${studentId}_${test.testId}_term1`,
          teacherId,
          schoolId,
          studentId,
          testId: test.testId,
          testName: test.testName,
          value: test.valT1,
          unit: test.unit,
          date: '2024-12-12',
          term: 'Term 1',
          rating: isRubric ? getRubricRating(parseFloat(test.valT1)) : 'Good'
        });

        // Term 2
        resultsToSave.push({
          id: `${studentId}_${test.testId}_term2`,
          teacherId,
          schoolId,
          studentId,
          testId: test.testId,
          testName: test.testName,
          value: test.valT2,
          unit: test.unit,
          date: '2025-03-15',
          term: 'Term 2',
          rating: isRubric ? getRubricRating(parseFloat(test.valT2)) : 'Excellent'
        });
      });

      // Save to Firestore
      await fitnessService.saveStudent(demoStudent);
      const resultPromises = resultsToSave.map(res => fitnessService.saveResult(res));
      await Promise.all(resultPromises);

      // Select student in the UI
      setSelectedType('individual');
      setSelectedId(studentId);

      toast.success('Successfully populated "Kabir Dutt" with Baseline, Term 1 & Term 2 marks and Football rubrics in Firestore!');
    } catch (err) {
      console.error('Error generating demo database data:', err);
      toast.error('Failed to create demo database entry in Firestore.');
    } finally {
      setGeneratingDemo(false);
    }
  };

  const triggerPrintFriendlyPDF = () => {
    try {
      const reportElement = reportRef.current;
      if (!reportElement) {
        toast.error("Could not find the report element to print.");
        return;
      }

      // Ensure dynamic CSS media print rules are loaded
      const printStyleId = 'smartpe-fitness-print-media-rules';
      let styleTag = document.getElementById(printStyleId) as HTMLStyleElement | null;
      if (!styleTag) {
        styleTag = document.createElement('style');
        styleTag.id = printStyleId;
        document.head.appendChild(styleTag);
      }

      styleTag.innerHTML = `
        @media print {
          @page {
            size: A4 portrait;
            margin: 0mm !important;
          }

          *, *::before, *::after {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }

          body {
            background: #ffffff !important;
            color: #0f172a !important;
            margin: 0 !important;
            padding: 0 !important;
            font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
          }

          /* Hide application UI, sidebars, navigation, modals, and buttons */
          nav,
          header,
          aside,
          button,
          input,
          select,
          .print\\:hidden,
          .no-print,
          .no-print-area,
          .sidebar,
          .app-header,
          .disclaimer-banner,
          .toast,
          #report-action-buttons {
            display: none !important;
            visibility: hidden !important;
          }

          /* Unconstrain scroll containers for complete multi-page output */
          html, body, #root, main, [class*="overflow-hidden"], [class*="overflow-y-auto"], [class*="max-h-"] {
            overflow: visible !important;
            height: auto !important;
            max-height: none !important;
            position: static !important;
            background: transparent !important;
          }

          #fitness-report-printable-area {
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            overflow: visible !important;
            max-height: none !important;
            height: auto !important;
            width: 100% !important;
            display: block !important;
            background: #ffffff !important;
          }

          /* Hide interactive report header bar inside the report */
          #fitness-report-printable-area > div:first-child {
            display: none !important;
          }

          #fitness-report-printable-area > div:nth-child(2) {
            padding: 0 !important;
            margin: 0 !important;
            background: transparent !important;
          }

          /* Each page section is formatted as a standalone A4 document */
          .pdf-page-section {
            width: 210mm !important;
            min-height: 297mm !important;
            max-height: 297mm !important;
            height: 297mm !important;
            box-sizing: border-box !important;
            margin: 0 auto !important;
            padding: 16mm 14mm !important;
            border: none !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            overflow: hidden !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            background: #ffffff !important;
            page-break-after: always !important;
            break-after: page !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            position: relative !important;
          }

          .pdf-page-section:last-of-type {
            page-break-after: auto !important;
            break-after: auto !important;
          }

          svg {
            max-width: 100% !important;
            overflow: visible !important;
          }

          .recharts-responsive-container {
            width: 100% !important;
          }
        }
      `;

      // Set clean document title for the default PDF filename
      const originalTitle = document.title;
      const studentName = reportData?.student?.name ? reportData.student.name.replace(/\s+/g, '_') : 'Student';
      const grade = reportData?.student?.grade ? `_Grade_${reportData.student.grade}` : '';
      const section = reportData?.student?.section ? `_${reportData.student.section}` : '';
      const cleanFileName = `${studentName}_Fitness_Report${grade}${section}_SmartPE`;

      document.title = cleanFileName;

      toast.info("Opening print dialog. In the Destination drop-down, select 'Save as PDF' to download your file.", 5000);

      // Clean up title after print dialog closes
      const restoreTitle = () => {
        document.title = originalTitle;
        window.removeEventListener('afterprint', restoreTitle);
      };
      window.addEventListener('afterprint', restoreTitle);

      // Execute window.print()
      window.print();

      // Fallback cleanup timer
      setTimeout(restoreTitle, 6000);
    } catch (e) {
      console.error("Direct window.print() failed, falling back to print iframe:", e);
      handlePrint();
    }
  };

  const handlePrint = () => {
    try {
      const reportElement = reportRef.current;
      if (!reportElement) {
        toast.error("Could not find the report element to print.");
        return;
      }

      toast.info("Preparing your print layout...");

      // Create a hidden iframe
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      iframe.style.zIndex = '-9999';
      document.body.appendChild(iframe);

      const iframeDoc = iframe.contentWindow?.document;
      if (!iframeDoc) {
        toast.error("Could not initialize printing context.");
        return;
      }

      // Copy all styles and link tags from main document to print iframe
      let stylesHtml = '';
      document.querySelectorAll('link[rel="stylesheet"], style').forEach((node) => {
        stylesHtml += node.outerHTML;
      });

      // Extract raw report HTML
      const reportHtml = reportElement.innerHTML;

      iframeDoc.open();
      iframeDoc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${reportData ? reportData.title : 'Fitness Report'}</title>
            ${stylesHtml}
            <style>
              @page {
                size: A4 portrait;
                margin: 0;
              }
              body {
                background: white !important;
                color: #0f172a !important;
                font-family: system-ui, -apple-system, sans-serif;
                margin: 0 !important;
                padding: 0 !important;
              }
              .pdf-page-section {
                width: 210mm !important;
                height: 297mm !important;
                box-sizing: border-box !important;
                page-break-after: always !important;
                break-after: page !important;
                margin: 0 !important;
                padding: 20mm !important;
                border: none !important;
                box-shadow: none !important;
                overflow: hidden !important;
                display: flex !important;
                flex-direction: column !important;
                justify-content: space-between !important;
                background-color: white !important;
              }
              /* Hide navigation or action elements from the print */
              .print\\:hidden, button, .no-print {
                display: none !important;
              }
              /* Support background graphics and colors on all browsers */
              * {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              .grid {
                display: grid !important;
              }
            </style>
          </head>
          <body>
            <div>
              ${reportHtml}
            </div>
            <script>
              window.onload = function() {
                setTimeout(function() {
                  window.focus();
                  window.print();
                  setTimeout(function() {
                    window.parent.document.body.removeChild(window.frameElement);
                  }, 1000);
                }, 1200);
              };
            </script>
          </body>
        </html>
      `);
      iframeDoc.close();
    } catch (e) {
      console.error("Print failed:", e);
      window.focus();
      window.print();
    }
  };

  const exportToPDF = async () => {
    if (!reportRef.current) {
      toast.error("Could not find the report element to generate PDF.");
      return;
    }

    setDownloadingPdf(true);
    toast.info("Generating your high-quality, neat multi-page PDF report. Please wait...");

    try {
      const el = reportRef.current;
      
      // Select all `.pdf-page-section` elements inside the report
      const pageElements = el.querySelectorAll<HTMLElement>('.pdf-page-section');
      
      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4',
        compress: true
      });
      const pageWidth = 210; // mm
      const pageHeight = 297; // mm

      if (pageElements.length > 0) {
        for (let i = 0; i < pageElements.length; i++) {
          const pageEl = pageElements[i];
          
          if (i > 0) {
            pdf.addPage('a4', 'p');
          }

          // Standardize width and height to exact A4 proportions (794px × 1123px) during capture
          const prevWidth = pageEl.style.width;
          const prevMaxWidth = pageEl.style.maxWidth;
          const prevMinHeight = pageEl.style.minHeight;
          const prevMaxHeight = pageEl.style.maxHeight;
          const prevBoxShadow = pageEl.style.boxShadow;
          const prevBorder = pageEl.style.border;

          pageEl.style.width = '794px';
          pageEl.style.maxWidth = '794px';
          pageEl.style.minHeight = '1123px';
          pageEl.style.maxHeight = '1123px';
          pageEl.style.boxShadow = 'none';
          pageEl.style.border = 'none';

          // Brief delay for reflow
          await new Promise((resolve) => setTimeout(resolve, 60));

          // Use html-to-image with pixelRatio: 2 for high definition crispness
          const dataUrl = await toJpeg(pageEl, {
            quality: 0.98,
            pixelRatio: 2,
            backgroundColor: '#ffffff',
            filter: (node) => {
              if (node instanceof HTMLElement) {
                if (node.classList.contains('print:hidden') || node.classList.contains('no-print') || node.tagName === 'BUTTON') {
                  return false;
                }
              }
              return true;
            }
          });

          // Restore styles immediately
          pageEl.style.width = prevWidth;
          pageEl.style.maxWidth = prevMaxWidth;
          pageEl.style.minHeight = prevMinHeight;
          pageEl.style.maxHeight = prevMaxHeight;
          pageEl.style.boxShadow = prevBoxShadow;
          pageEl.style.border = prevBorder;

          // Render image filling the A4 page proportionally
          const imgProps = pdf.getImageProperties(dataUrl);
          const renderWidth = pageWidth;
          const renderHeight = (imgProps.height * renderWidth) / imgProps.width;

          if (renderHeight > pageHeight) {
            const scale = pageHeight / renderHeight;
            const scaledWidth = renderWidth * scale;
            const xOffset = (pageWidth - scaledWidth) / 2;
            pdf.addImage(dataUrl, 'JPEG', xOffset, 0, scaledWidth, pageHeight, undefined, 'FAST');
          } else {
            pdf.addImage(dataUrl, 'JPEG', 0, 0, renderWidth, renderHeight, undefined, 'FAST');
          }
        }
      } else {
        // Fallback for screens with no `.pdf-page-section` (e.g., class or school reports)
        const originalMaxHeight = el.style.maxHeight;
        const originalOverflow = el.style.overflow;
        const originalBorder = el.style.border;
        const originalBoxShadow = el.style.boxShadow;

        el.style.maxHeight = 'none';
        el.style.overflow = 'visible';
        el.style.border = 'none';
        el.style.boxShadow = 'none';

        await new Promise((resolve) => setTimeout(resolve, 400));

        const dataUrl = await toJpeg(el, {
          quality: 0.95,
          pixelRatio: 2,
          backgroundColor: '#ffffff',
          filter: (node) => {
            if (node instanceof HTMLElement) {
              if (node.classList.contains('print:hidden') || node.classList.contains('no-print') || node.tagName === 'BUTTON') {
                return false;
              }
            }
            return true;
          }
        });

        // Restore original styling safely
        el.style.maxHeight = originalMaxHeight;
        el.style.overflow = originalOverflow;
        el.style.border = originalBorder;
        el.style.boxShadow = originalBoxShadow;

        const img = new Image();
        img.src = dataUrl;
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
        });

        const imgHeight = (img.height * pageWidth) / img.width;
        let heightLeft = imgHeight;
        let position = 0;

        // Add first page
        pdf.addImage(dataUrl, 'JPEG', 0, position, pageWidth, imgHeight);
        heightLeft -= pageHeight;

        // Add extra pages if needed
        while (heightLeft >= 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(dataUrl, 'JPEG', 0, position, pageWidth, imgHeight);
          heightLeft -= pageHeight;
        }
      }

      const name = reportData ? reportData.title.replace(/\s+/g, '_').toLowerCase() : 'fitness_report';
      pdf.save(`${name}.pdf`);
      toast.success("PDF Report downloaded successfully!");
    } catch (error) {
      console.error("PDF high-fidelity generation failed, using html2canvas fallback:", error);
      
      try {
        const el = reportRef.current;
        const canvas = await html2canvas(el, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
          logging: false,
          ignoreElements: (node) => {
            return node.classList.contains('print:hidden') || node.classList.contains('no-print') || node.tagName === 'BUTTON';
          },
          onclone: (clonedDoc) => {
            const card = clonedDoc.querySelector('.max-h-\\[80vh\\]') as HTMLElement;
            if (card) {
              card.style.maxHeight = 'none';
              card.style.overflow = 'visible';
              card.style.border = 'none';
              card.style.boxShadow = 'none';
            }
          }
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgWidth = 210;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);
        const name = reportData ? reportData.title.replace(/\s+/g, '_').toLowerCase() : 'fitness_report';
        pdf.save(`${name}.pdf`);
        toast.success("PDF downloaded successfully via fallback!");
      } catch (fbErr) {
        console.error("Fallback failed:", fbErr);
        toast.error("Could not download PDF directly in this sandbox. Try standard Print!");
      }
    } finally {
      setDownloadingPdf(false);
    }
  };

  const exportToCSV = () => {
    if (!reportData) return;

    let csvContent = "";
    const filename = `${reportData.title.replace(/\s+/g, '_').toLowerCase()}_export.csv`;

    if (selectedType === 'individual') {
      const headers = ["Test Name", "Baseline", "Term 1", "Term 2", "Final", "Unit"];
      csvContent += headers.join(",") + "\n";

      const testGroups = (reportData.studentResults || []).reduce((acc: any, r: FitnessResult) => {
        if (!acc[r.testName]) acc[r.testName] = { baseline: '', term1: '', term2: '', final: '', unit: r.unit };
        if (r.term === 'Baseline') acc[r.testName].baseline = r.value;
        if (r.term === 'Term 1') acc[r.testName].term1 = r.value;
        if (r.term === 'Term 2') acc[r.testName].term2 = r.value;
        if (r.term === 'Final') acc[r.testName].final = r.value;
        return acc;
      }, {});

      Object.entries(testGroups).forEach(([name, data]: [string, any]) => {
        csvContent += `"${name}",${data.baseline},${data.term1},${data.term2},${data.final},"${data.unit}"\n`;
      });
    } else if (selectedType === 'class') {
      const headers = ["Test Name", "Assessment Count"];
      csvContent += headers.join(",") + "\n";
      
      Object.entries(reportData.testDistribution || reportData.testCounts || {}).forEach(([name, count]) => {
        csvContent += `"${name}",${count}\n`;
      });
    } else if (selectedType === 'school') {
      const headers = ["Grade", "Average Score", "Average BMI", "Assessments Completed"];
      csvContent += headers.join(",") + "\n";
      
      Object.entries(reportData.gradeStats || {}).forEach(([grade, stats]: [string, any]) => {
        const avgScore = stats.results > 0 ? (stats.avg / stats.results).toFixed(1) : "0.0";
        const avgBmi = stats.bmiCount > 0 ? (stats.bmiSum / stats.bmiCount).toFixed(1) : "0.0";
        csvContent += `"Grade ${grade}",${avgScore},${avgBmi},${stats.results}\n`;
      });
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDeleteResult = async (resultId: string) => {
    if (!window.confirm("Are you sure you want to delete this fitness result? This action cannot be undone.")) return;
    
    try {
      await fitnessService.deleteResult(resultId);
      // The real-time listener will update the UI automatically
    } catch (err) {
      console.error("Error deleting result:", err);
      alert("Failed to delete result. Please try again.");
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
    <div className="space-y-8 animate-in fade-in pb-36">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tighter">Fitness Reports</h2>
          <p className="text-slate-500 font-medium">Generate professional progress reports and data comparisons.</p>
        </div>
      </div>

      {/* ⚡ Database & Rubrics Playground */}
      <div className="bg-slate-50 border-2 border-slate-900 rounded-[2.5rem] p-8 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] print:hidden space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b-2 border-dashed border-slate-200">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-500 rounded-2xl border-2 border-slate-900 text-white">
              <Zap size={28} className="fill-current" />
            </div>
            <div>
              <h3 className="text-xl font-black uppercase tracking-tight text-slate-900">Database & Rubrics Playground</h3>
              <p className="text-xs font-bold text-slate-500">
                Generate dummy PE records (Baseline, Term 1 & 2) and skill rubrics, and explore how they map inside Firestore.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleGenerateDummyData}
              disabled={generatingDemo}
              className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white border-2 border-slate-900 rounded-xl font-black text-xs uppercase tracking-wider shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] transition-all flex items-center gap-2"
            >
              <Sparkles size={16} className="animate-pulse" />
              <span>{generatingDemo ? 'Populating...' : '⚡ Generate Dummy Student Data'}</span>
            </button>
            <button
              onClick={() => setShowDbExplorer(!showDbExplorer)}
              className="px-5 py-3 bg-white hover:bg-slate-50 text-slate-800 border-2 border-slate-900 rounded-xl font-black text-xs uppercase tracking-wider shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] transition-all flex items-center gap-2"
            >
              <Database size={16} />
              <span>{showDbExplorer ? 'Hide Firestore Explorer' : '📂 View Database Schema'}</span>
            </button>
          </div>
        </div>

        {/* DB Schema Explorer Panel */}
        {showDbExplorer && (
          <div className="bg-slate-900 rounded-3xl p-6 text-white font-mono text-xs border-2 border-slate-900 shadow-inner space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-800 pb-3 gap-2">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></span>
                <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
                <span className="w-3 h-3 rounded-full bg-green-500"></span>
                <span className="text-[10px] text-slate-400 font-bold ml-2 uppercase tracking-wider">FIRESTORE SCHEMA VIEWER</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {(['student', 'results', 'rubric'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveDbTab(tab)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] uppercase font-black tracking-widest transition-all ${
                      activeDbTab === tab 
                        ? 'bg-indigo-600 text-white' 
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {tab === 'student' ? 'Student Doc' : tab === 'results' ? 'Physical Result Doc' : 'Sport Rubric Doc'}
                  </button>
                ))}
              </div>
            </div>

            {activeDbTab === 'student' && (
              <div className="space-y-3">
                <div className="text-slate-400 font-sans">
                  <p className="font-bold text-slate-300 mb-1">Collection Path: <code className="text-indigo-400 bg-slate-800 px-1.5 py-0.5 rounded">/students/demo_kabir_dutt</code></p>
                  <p className="text-[11px]">Stores the core student metadata, roll numbers, demographics, and cumulative grades.</p>
                </div>
                <pre className="bg-slate-950 p-4 rounded-xl overflow-x-auto text-emerald-400 max-h-64">
{`{
  "id": "demo_kabir_dutt",
  "name": "Kabir Dutt",
  "rollNumber": "PE-2026-07",
  "grade": "8",
  "section": "A",
  "gender": "Male",
  "age": 13,
  "dob": "2013-05-15",
  "attendance": 94,
  "performance": "Excellent",
  "teacherId": "auth_current_user_uid",
  "schoolId": "personal_auth_current_user_uid"
}`}
                </pre>
              </div>
            )}

            {activeDbTab === 'results' && (
              <div className="space-y-3">
                <div className="text-slate-400 font-sans">
                  <p className="font-bold text-slate-300 mb-1">Collection Path: <code className="text-indigo-400 bg-slate-800 px-1.5 py-0.5 rounded">/results/demo_kabir_dutt_sprint_50m_baseline</code></p>
                  <p className="text-[11px]">Stores a single physical measurement result linked back to a student ID and associated with a particular term (Baseline, Term 1, or Term 2).</p>
                </div>
                <pre className="bg-slate-950 p-4 rounded-xl overflow-x-auto text-emerald-400 max-h-64">
{`{
  "id": "demo_kabir_dutt_sprint_50m_baseline",
  "studentId": "demo_kabir_dutt",
  "testId": "sprint_50m",
  "testName": "50m Sprint Speed",
  "value": "9.2",
  "unit": "sec",
  "date": "2024-09-10",
  "term": "Baseline",
  "rating": "Average",
  "teacherId": "auth_current_user_uid",
  "schoolId": "personal_auth_current_user_uid"
}`}
                </pre>
              </div>
            )}

            {activeDbTab === 'rubric' && (
              <div className="space-y-3">
                <div className="text-slate-400 font-sans">
                  <p className="font-bold text-slate-300 mb-1">Collection Path: <code className="text-indigo-400 bg-slate-800 px-1.5 py-0.5 rounded">/results/demo_kabir_dutt_rubric_fb_dribble_term2</code></p>
                  <p className="text-[11px]">Stores a qualitative sport skill rubric evaluation out of 10. We use <code className="text-amber-400 font-mono">testId</code> prefix <code className="text-amber-400 font-mono">rubric_</code> and specify the unit as <code className="text-amber-400 font-mono">"rating"</code> so that the app separates it from standard physical measurements in charts while displaying it in matrices!</p>
                </div>
                <pre className="bg-slate-950 p-4 rounded-xl overflow-x-auto text-emerald-400 max-h-64">
{`{
  "id": "demo_kabir_dutt_rubric_fb_dribble_term2",
  "studentId": "demo_kabir_dutt",
  "testId": "rubric_fb_dribble",
  "testName": "Football: Dribbling & Control (Rubric)",
  "value": "9",
  "unit": "rating",
  "date": "2025-03-15",
  "term": "Term 2",
  "rating": "Mastery",
  "teacherId": "auth_current_user_uid",
  "schoolId": "personal_auth_current_user_uid"
}`}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* Step-by-Step Reporting Guide */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-white border border-slate-200 rounded-[2rem] p-6 font-sans">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-indigo-600 font-black text-xs uppercase tracking-wider">
              <span className="w-5 h-5 flex items-center justify-center bg-indigo-100 text-indigo-600 font-black rounded-full text-[10px]">1</span>
              <span>Generate or Select</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed font-semibold">
              Click the button above to populate Kabir Dutt's records. Alternatively, select any other student from the list in the configuration sidebar.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-indigo-600 font-black text-xs uppercase tracking-wider">
              <span className="w-5 h-5 flex items-center justify-center bg-indigo-100 text-indigo-600 font-black rounded-full text-[10px]">2</span>
              <span>Review Performance & Rubrics</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed font-semibold">
              The dashboard immediately compiles a visual progress report showing the physical radar, multi-term progress lines, and custom Football Game Rubrics.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-indigo-600 font-black text-xs uppercase tracking-wider">
              <span className="w-5 h-5 flex items-center justify-center bg-indigo-100 text-indigo-600 font-black rounded-full text-[10px]">3</span>
              <span>Download & Print PDF</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed font-semibold">
              <strong className="text-indigo-600">Download Branded PDF:</strong> Click the <strong className="text-[#0D2B52]">"Download PDF"</strong> button on the report menu to export branded, print-ready multi-page documents. <strong className="text-indigo-600">Spreadsheets:</strong> Use <strong className="text-slate-800">"Excel / CSV"</strong> for bulk data.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Report Configuration */}
        <div className="lg:col-span-4 space-y-6 print:hidden">
          <div className="bg-white p-8 rounded-[2.5rem] border-2 border-slate-900 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)]">
            <h3 className="text-xl font-black uppercase tracking-tight mb-6">Report Config</h3>
            
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Report Scope</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'individual', label: 'Student', icon: User },
                    { id: 'class', label: 'Class', icon: Users },
                    { id: 'school', label: 'School', icon: Activity }
                  ].map(type => (
                    <button
                      key={type.id}
                      onClick={() => { setSelectedType(type.id as any); setSelectedId(''); }}
                      className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all ${
                        selectedType === type.id 
                          ? 'bg-indigo-600 border-slate-900 text-white shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]' 
                          : 'bg-slate-50 border-transparent text-slate-400 hover:bg-slate-100'
                      }`}
                    >
                      <type.icon size={20} className="mb-2" />
                      <span className="text-[10px] font-black uppercase tracking-widest">{type.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {selectedType !== 'school' && (
                <div className="relative" ref={dropdownRef}>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center justify-between">
                    <span>Select {selectedType === 'individual' ? 'Student' : 'Class'}</span>
                    {selectedType === 'class' ? (
                      <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full">
                        Search by student name or class
                      </span>
                    ) : (
                      <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full">
                        Search student name or roll
                      </span>
                    )}
                  </label>

                  {/* Dropdown Trigger Box */}
                  <button
                    type="button"
                    onClick={() => setIsDropdownOpen(prev => !prev)}
                    className={`w-full p-3.5 bg-slate-50 border-2 rounded-2xl font-bold text-xs text-left transition-all flex items-center justify-between cursor-pointer ${
                      isDropdownOpen 
                        ? 'border-indigo-600 bg-white ring-2 ring-indigo-500/20 shadow-sm' 
                        : selectedId 
                          ? 'border-slate-900 bg-white text-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]' 
                          : 'border-slate-200 text-slate-400 hover:border-slate-400 hover:bg-slate-100/70'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 truncate pr-2">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                        selectedId ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'
                      }`}>
                        {selectedType === 'individual' ? <User size={14} /> : <Users size={14} />}
                      </div>
                      <span className={`truncate ${selectedId ? 'font-black text-slate-900 text-xs' : 'font-semibold text-slate-400'}`}>
                        {selectedDisplayLabel}
                      </span>
                    </div>

                    <div className="flex items-center space-x-1 shrink-0 text-slate-400">
                      {selectedId && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedId('');
                            setSelectedViaStudent(null);
                            setSearchQuery('');
                          }}
                          className="p-1 hover:bg-slate-100 hover:text-slate-700 rounded-lg transition cursor-pointer"
                          title="Clear selection"
                        >
                          <X size={14} />
                        </button>
                      )}
                      <ChevronDown size={16} className={`transition-transform duration-200 ${isDropdownOpen ? 'rotate-180 text-indigo-600' : ''}`} />
                    </div>
                  </button>

                  {/* Selected via Student Tag */}
                  {selectedId && selectedType === 'class' && selectedViaStudent && (
                    <div className="mt-2 flex items-center gap-1.5 text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-1.5 rounded-xl">
                      <Sparkles size={12} className="text-indigo-500 shrink-0" />
                      <span>Class selected via student: <strong className="font-black text-indigo-950">{selectedViaStudent}</strong></span>
                    </div>
                  )}

                  {/* Dropdown Menu Popover */}
                  {isDropdownOpen && (
                    <div className="absolute left-0 right-0 top-full mt-2 z-50 bg-white border-2 border-slate-900 rounded-2xl shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] p-3 space-y-2.5">
                      {/* Search Input Box */}
                      <div className="relative">
                        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          ref={searchInputRef}
                          type="text"
                          value={searchQuery}
                          onChange={e => setSearchQuery(e.target.value)}
                          placeholder={
                            selectedType === 'class'
                              ? "Type student name (e.g. Kabir, Diya) or class name..."
                              : "Search student by name, roll, or grade..."
                          }
                          className="w-full bg-slate-50 border-2 border-slate-900 rounded-xl pl-9 pr-8 py-2 text-xs font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        {searchQuery && (
                          <button
                            type="button"
                            onClick={() => setSearchQuery('')}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer"
                          >
                            <X size={13} />
                          </button>
                        )}
                      </div>

                      {/* Class Scope View */}
                      {selectedType === 'class' && (
                        <div className="max-h-64 overflow-y-auto space-y-2.5 pr-1 divide-y divide-slate-100">
                          {/* 1. Quick Tip when search is empty */}
                          {!searchQuery.trim() && (
                            <div className="p-2 bg-indigo-50/80 border border-indigo-100 rounded-xl text-[11px] text-indigo-800 font-medium flex items-center gap-2">
                              <Sparkles size={13} className="text-indigo-600 shrink-0" />
                              <span>Tip: Type a student's name above to quickly select their class!</span>
                            </div>
                          )}

                          {/* 2. Students Found matching the search */}
                          {searchQuery.trim() && matchingStudentsForClass.length > 0 && (
                            <div className="space-y-1.5 pb-1">
                              <div className="text-[10px] font-black uppercase tracking-wider text-amber-800 bg-amber-50 px-2 py-1 rounded-md flex items-center justify-between">
                                <span className="flex items-center gap-1">
                                  <User size={12} />
                                  <span>Students Found — Click to Select Class</span>
                                </span>
                                <span className="font-mono text-[9px] font-bold">{matchingStudentsForClass.length}</span>
                              </div>
                              <div className="space-y-1">
                                {matchingStudentsForClass.map(s => {
                                  const classObj = dynamicClassOptions.find(c => c.studentIds.includes(s.id));
                                  const className = classObj ? classObj.name : `Grade ${s.grade}${s.section ? `-${s.section}` : ''}`;
                                  return (
                                    <button
                                      key={s.id}
                                      type="button"
                                      onClick={() => handleSelectClassViaStudent(s)}
                                      className="w-full p-2 bg-slate-50 hover:bg-amber-100/70 rounded-xl text-left border border-slate-200 hover:border-amber-400 transition flex items-center justify-between group cursor-pointer"
                                    >
                                      <div className="flex items-center space-x-2 truncate">
                                        <div className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 font-black text-[10px] flex items-center justify-center shrink-0">
                                          {s.name.charAt(0)}
                                        </div>
                                        <div className="truncate">
                                          <p className="text-xs font-black text-slate-900 group-hover:text-amber-950 truncate">
                                            {s.name} {s.rollNumber && <span className="font-normal text-[10px] text-slate-500 font-mono">#{s.rollNumber}</span>}
                                          </p>
                                          <p className="text-[10px] text-slate-500 font-semibold truncate">
                                            In: <strong className="text-indigo-600">{className}</strong>
                                          </p>
                                        </div>
                                      </div>
                                      <span className="px-2 py-0.5 bg-amber-500 text-slate-950 rounded text-[9px] font-black uppercase tracking-wider shrink-0 group-hover:bg-amber-400 transition">
                                        Select Class →
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* 3. Classes by Grade & Section */}
                          <div className="pt-2 space-y-1.5">
                            <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-1 flex items-center justify-between">
                              <span>Classes & Sections</span>
                              <span className="text-[9px]">{filteredClassOptions.length}</span>
                            </div>
                            {filteredClassOptions.length === 0 && (!searchQuery.trim() || matchingStudentsForClass.length === 0) ? (
                              <div className="p-4 text-center text-xs font-bold text-slate-400">
                                No classes or students matched "{searchQuery}".
                              </div>
                            ) : (
                              <div className="space-y-1">
                                {filteredClassOptions.map(c => {
                                  const isSelected = selectedId === c.id;
                                  return (
                                    <button
                                      key={c.id}
                                      type="button"
                                      onClick={() => handleSelectClass(c.id)}
                                      className={`w-full p-2.5 rounded-xl text-left transition flex items-center justify-between border cursor-pointer ${
                                        isSelected
                                          ? 'bg-indigo-600 text-white border-slate-900 shadow-sm font-black'
                                          : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200'
                                      }`}
                                    >
                                      <div className="flex items-center space-x-2">
                                        <SchoolIcon size={14} className={isSelected ? 'text-white' : 'text-slate-400'} />
                                        <span className="text-xs font-bold">{c.name}</span>
                                      </div>
                                      <div className="flex items-center space-x-1.5">
                                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                                          isSelected ? 'bg-indigo-700 text-white' : 'bg-slate-100 text-slate-600'
                                        }`}>
                                          {c.studentIds.length} Students
                                        </span>
                                        {isSelected && <Check size={14} className="text-amber-400 font-bold" />}
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>

                          {/* 4. Saved Teams & Groups */}
                          {filteredTeams.length > 0 && (
                            <div className="pt-2 space-y-1.5">
                              <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-1 flex items-center justify-between">
                                <span>Saved Teams & Squads</span>
                                <span className="text-[9px]">{filteredTeams.length}</span>
                              </div>
                              <div className="space-y-1">
                                {filteredTeams.map(t => {
                                  const isSelected = selectedId === t.id;
                                  return (
                                    <button
                                      key={t.id}
                                      type="button"
                                      onClick={() => handleSelectTeam(t.id)}
                                      className={`w-full p-2.5 rounded-xl text-left transition flex items-center justify-between border cursor-pointer ${
                                        isSelected
                                          ? 'bg-indigo-600 text-white border-slate-900 shadow-sm font-black'
                                          : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200'
                                      }`}
                                    >
                                      <div className="flex items-center space-x-2">
                                        <Users size={14} className={isSelected ? 'text-white' : 'text-slate-400'} />
                                        <span className="text-xs font-bold">{t.name}</span>
                                      </div>
                                      <div className="flex items-center space-x-1.5">
                                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                                          isSelected ? 'bg-indigo-700 text-white' : 'bg-slate-100 text-slate-600'
                                        }`}>
                                          Grade {t.grade}
                                        </span>
                                        {isSelected && <Check size={14} className="text-amber-400 font-bold" />}
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Individual (Student) Scope View */}
                      {selectedType === 'individual' && (
                        <div className="max-h-64 overflow-y-auto space-y-1 pr-1">
                          <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-1 pb-1 flex items-center justify-between">
                            <span>Registered Students</span>
                            <span className="text-[9px]">{filteredStudents.length} of {students.length}</span>
                          </div>
                          {filteredStudents.length === 0 ? (
                            <div className="p-4 text-center text-xs font-bold text-slate-400">
                              No students found matching "{searchQuery}".
                            </div>
                          ) : (
                            filteredStudents.map(s => {
                              const isSelected = selectedId === s.id;
                              return (
                                <button
                                  key={s.id}
                                  type="button"
                                  onClick={() => handleSelectStudent(s.id)}
                                  className={`w-full p-2.5 rounded-xl text-left transition flex items-center justify-between border cursor-pointer ${
                                    isSelected
                                      ? 'bg-indigo-600 text-white border-slate-900 shadow-sm font-black'
                                      : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200'
                                  }`}
                                >
                                  <div className="flex items-center space-x-2.5 truncate">
                                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                                      isSelected ? 'bg-white text-indigo-700' : 'bg-indigo-100 text-indigo-700'
                                    }`}>
                                      {s.name.charAt(0)}
                                    </div>
                                    <div className="truncate">
                                      <p className={`text-xs font-black truncate ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                                        {s.name}
                                      </p>
                                      <p className={`text-[10px] truncate ${isSelected ? 'text-indigo-200' : 'text-slate-500'}`}>
                                        Roll: {s.rollNumber || 'PE'} • Grade {s.grade}{s.section ? `-${s.section}` : ''} • {s.gender || 'Student'}
                                      </p>
                                    </div>
                                  </div>
                                  {isSelected && <Check size={16} className="text-amber-400 font-bold shrink-0 ml-2" />}
                                </button>
                              );
                            })
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="flex flex-col gap-2.5">
                <button 
                  onClick={generateReport}
                  disabled={isGenerating || (!selectedId && selectedType !== 'school')}
                  className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  {isGenerating ? <Loader2 className="animate-spin" size={16} /> : <FileText size={16} />}
                  <span>Generate Report</span>
                </button>

                {reportData && (
                  <button 
                    onClick={exportToPDF}
                    disabled={downloadingPdf}
                    className="w-full py-3.5 bg-[#0D2B52] hover:bg-[#164077] text-white border-2 border-slate-900 rounded-2xl font-black text-xs uppercase tracking-wider shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    title="Export Branded PDF Document"
                  >
                    {downloadingPdf ? (
                      <Loader2 size={16} className="animate-spin text-[#D4A017]" />
                    ) : (
                      <Download size={16} className="text-[#D4A017]" />
                    )}
                    <span>{downloadingPdf ? 'Exporting PDF...' : 'Download PDF'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="bg-indigo-50 p-8 rounded-[2.5rem] border-2 border-indigo-100">
            <h4 className="text-sm font-black text-indigo-900 uppercase tracking-tight mb-4 flex items-center gap-2">
              <TrendingUp size={16} />
              <span>Report Types</span>
            </h4>
            <div className="space-y-2">
              {[
                { name: 'Baseline vs Term 1', desc: 'Initial assessment comparison' },
                { name: 'Full Academic Year', desc: 'Progress across all 3 terms' },
                { name: 'BMI & Growth', desc: 'Physical health tracking' }
              ].map(item => (
                <div key={item.name} className="p-4 bg-white/50 rounded-xl">
                  <p className="text-xs font-black text-indigo-900 uppercase tracking-tight">{item.name}</p>
                  <p className="text-[10px] font-bold text-indigo-400">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Report Preview */}
        <div className="lg:col-span-8">
          <AnimatePresence mode="wait">
            {!reportData ? (
              <motion.div 
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="bg-white border-4 border-dashed border-slate-100 rounded-[3rem] h-full flex flex-col items-center justify-center p-12 text-center text-slate-400 min-h-[500px]"
              >
                <BarChart3 size={64} className="mb-6 text-slate-100" />
                <h3 className="text-2xl font-black uppercase tracking-tight mb-2">No Report Selected</h3>
                <p className="max-w-xs font-medium">Select a student or class and click generate to view the fitness analysis.</p>
              </motion.div>
            ) : (
              <motion.div 
                ref={reportRef}
                id="fitness-report-printable-area"
                key="report"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-[3rem] border-2 border-slate-900 overflow-hidden shadow-2xl overflow-y-auto max-h-[80vh] print:max-h-none print:border-none print:shadow-none print:overflow-visible"
              >
                {/* Report Header */}
                <div className="p-10 border-b-2 border-slate-900 bg-slate-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:bg-white">
                  <div>
                    <div className="flex items-center gap-2 text-indigo-600 mb-2">
                      <Trophy size={20} />
                      <span className="text-[10px] font-black uppercase tracking-widest">KIFT Performance Report</span>
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter leading-none mb-1">{reportData.title}</h1>
                    <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">{reportData.subtitle}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 print:hidden" id="report-action-buttons">
                    {/* Primary Button: Print-Friendly PDF using window.print() & CSS media print rules */}
                    <button 
                      onClick={triggerPrintFriendlyPDF}
                      className="px-4 py-3 bg-[#0D2B52] hover:bg-[#164077] text-white border-2 border-slate-900 rounded-xl font-black text-xs uppercase tracking-wider shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] transition-all flex items-center gap-2 cursor-pointer"
                      title="Download print-friendly PDF using browser print engine (Ctrl+P -> Save as PDF)"
                    >
                      <Printer size={16} className="text-[#D4A017]" />
                      <span>Print-Friendly PDF</span>
                    </button>
                    <button 
                      onClick={exportToPDF}
                      disabled={downloadingPdf}
                      className="px-4 py-3 bg-white hover:bg-slate-50 text-slate-800 border-2 border-slate-900 rounded-xl font-black text-xs uppercase tracking-wider shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] disabled:bg-slate-400 disabled:shadow-none active:translate-x-[1px] active:translate-y-[1px] active:shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] transition-all flex items-center gap-2 cursor-pointer"
                      title="Direct PDF Export via Canvas"
                    >
                      {downloadingPdf ? (
                        <Loader2 size={16} className="animate-spin text-indigo-600" />
                      ) : (
                        <Download size={16} className="text-indigo-600" />
                      )}
                      <span>{downloadingPdf ? 'Exporting PDF...' : 'Download PDF'}</span>
                    </button>
                    <button 
                      onClick={handlePrint}
                      className="px-4 py-3 bg-white hover:bg-slate-50 text-slate-800 border-2 border-slate-900 rounded-xl font-black text-xs uppercase tracking-wider shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] transition-all flex items-center gap-2 cursor-pointer"
                      title="Quick Print Document"
                    >
                      <FileText size={16} />
                      <span>Print</span>
                    </button>
                    <button 
                      onClick={exportToCSV}
                      className="px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white border-2 border-slate-900 rounded-xl font-black text-xs uppercase tracking-wider shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] transition-all flex items-center gap-2 cursor-pointer"
                      title="Export to CSV"
                    >
                      <Download size={16} />
                      <span>Excel / CSV</span>
                    </button>
                  </div>
                </div>

                {/* Report Body */}
                <div className="p-6 md:p-10 bg-slate-50 space-y-12 print:p-0 print:space-y-0">
                  {selectedType === 'individual' ? (
                    <>
                      {/* Interactive School Branding Banner */}
                      <div className="p-4 bg-indigo-50 border-2 border-indigo-200 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 print:hidden shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-sm">
                            <Shield size={20} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-black uppercase text-indigo-950 tracking-wide">
                                Active School Branding: <span className="text-indigo-600 underline decoration-dashed">{editableSchoolName}</span>
                              </span>
                            </div>
                            <p className="text-[10px] font-bold text-slate-500 mt-0.5">
                              Upload your custom school logo or click and edit the school name in any header below. All reports automatically reflect your branding.
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <label className="px-3 py-2 bg-white text-indigo-900 border-2 border-indigo-300 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer hover:bg-indigo-100 transition-colors flex items-center gap-1.5 shadow-sm">
                            <UploadCloud size={14} className="text-indigo-600" />
                            <span>{schoolLogoUrl ? 'Change Custom Logo' : 'Upload School Logo'}</span>
                            <input
                              type="file"
                              accept="image/png, image/jpeg, image/webp"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                const reader = new FileReader();
                                reader.onload = (event) => {
                                  const logoData = event.target?.result as string;
                                  setSchoolLogoUrl(logoData);
                                  if (school?.id) {
                                    fitnessService.updateSchool(school.id, { logoUrl: logoData });
                                  }
                                  toast.success('School custom logo saved for all report cards!');
                                };
                                reader.readAsDataURL(file);
                              }}
                              className="hidden"
                            />
                          </label>
                          {schoolLogoUrl && (
                            <button
                              onClick={() => {
                                setSchoolLogoUrl(null);
                                if (school?.id) {
                                  fitnessService.updateSchool(school.id, { logoUrl: '' });
                                }
                                toast.success('Custom logo removed');
                              }}
                              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                              title="Remove Custom Logo"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}

                          <button
                            onClick={triggerPrintFriendlyPDF}
                            className="px-3.5 py-2 bg-[#0D2B52] hover:bg-[#164077] text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition-all cursor-pointer whitespace-nowrap"
                            title="Print-Friendly PDF for currently displayed student"
                          >
                            <Printer size={14} className="text-[#D4A017]" />
                            <span>Print-Friendly PDF</span>
                          </button>
                        </div>
                      </div>

                      {/* Student Fitness Growth vs Class Averages (Recharts Line Chart) */}
                      {reportData.student && (
                        <div className="print:hidden space-y-6">
                          <StudentGrowthComparisonChart 
                            student={reportData.student} 
                            results={reportData.studentResults || []}
                            allStudents={students}
                            allResults={results}
                          />

                          {/* Secondary D3 Progress Explorer */}
                          <D3StudentProgressChart 
                            student={reportData.student} 
                            results={reportData.studentResults || []} 
                          />
                        </div>
                      )}

                      {/* PAGE 1: STUDENT OVERVIEW & FITNESS RADAR */}
                      <div id="pdf-page-1" className="pdf-page-section bg-white p-8 sm:p-10 rounded-3xl border-2 border-slate-900 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] flex flex-col justify-between relative overflow-hidden mx-auto" style={{ width: '100%', maxWidth: '794px', minHeight: '1123px', maxHeight: '1123px', boxSizing: 'border-box' }}>
                        {/* Subtle Confidential Watermark */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden z-0 opacity-[0.025] p-10">
                          <div className="flex flex-col items-center justify-center -rotate-30 transform select-none">
                            <div className="text-slate-900 font-sans font-black text-8xl uppercase tracking-[0.2em] whitespace-nowrap">
                              CONFIDENTIAL
                            </div>
                            <div className="text-indigo-950 font-sans font-black text-base uppercase tracking-[0.5em] whitespace-nowrap mt-4">
                              SmartPE India System
                            </div>
                          </div>
                        </div>

                        {/* Page 1 Header with SmartPE India Logo & Registered School Logo */}
                        <div className="border-b-2 border-slate-900 pb-3 flex justify-between items-start bg-white relative z-10">
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-3">
                              <Logo variant="color" showText={true} className="scale-90 origin-left" />
                              <span className="text-slate-300 font-black text-lg">×</span>
                              {schoolLogoUrl ? (
                                <img src={schoolLogoUrl} alt={editableSchoolName} className="h-9 w-auto max-w-[120px] object-contain" />
                              ) : (
                                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 border border-indigo-200 rounded-lg text-indigo-700">
                                  <Shield size={14} />
                                  <span className="text-[10px] font-black uppercase text-indigo-900 truncate max-w-[140px]">{editableSchoolName}</span>
                                </div>
                              )}
                            </div>
                            <div>
                              <div className="print:hidden">
                                <input
                                  type="text"
                                  value={editableSchoolName}
                                  onChange={(e) => {
                                    setEditableSchoolName(e.target.value);
                                    if (school?.id) {
                                      fitnessService.updateSchool(school.id, { name: e.target.value });
                                    }
                                  }}
                                  placeholder="Enter School Name"
                                  className="text-xs font-black uppercase tracking-wider text-indigo-950 bg-transparent border-b border-dashed border-indigo-300 hover:border-indigo-600 focus:border-indigo-600 focus:outline-none py-0.5 px-1 w-full max-w-[320px] transition-all"
                                  title="Click to edit school name"
                                />
                              </div>
                              <div className="hidden print:block">
                                <h2 className="text-xs font-black uppercase tracking-wider text-indigo-950">{editableSchoolName}</h2>
                              </div>
                              <div className="flex items-center gap-2 text-slate-400 mt-1">
                                <Trophy size={11} className="text-amber-500" />
                                <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">KIFT Performance Report Card • Confidential Record</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right flex flex-col items-end justify-between h-full pt-0.5">
                            <span className="text-[10px] font-black uppercase tracking-wider bg-slate-900 text-white px-3 py-1.5 rounded-lg shadow-sm whitespace-nowrap">
                              {reportData.student?.name}
                            </span>
                            <div className="text-[9px] text-slate-500 font-bold mt-1.5 whitespace-nowrap">
                              Roll No: {reportData.student?.rollNumber || 'PE-01'} • Grade {reportData.student?.grade}-{reportData.student?.section}
                            </div>
                            <div className="text-[8px] text-slate-400 font-semibold mt-0.5">
                              Term: {reportData.terms[reportData.terms.length - 1] || 'Term 2'} (2025-26)
                            </div>
                          </div>
                        </div>

                        {/* KPI Highlights Row */}
                        <div className="grid grid-cols-3 gap-4 my-2 relative z-10">
                          <div className="p-4 bg-indigo-600 rounded-2xl text-white shadow-sm flex flex-col justify-between">
                            <div className="flex items-center justify-between opacity-80 mb-1">
                              <span className="text-[9px] font-black uppercase tracking-wider">Evaluation Phase</span>
                              <Trophy size={16} />
                            </div>
                            <div className="text-xl sm:text-2xl font-black whitespace-nowrap tracking-tight">
                              {reportData.terms.length > 0 ? reportData.terms[reportData.terms.length - 1] : 'No Data'}
                            </div>
                            <p className="text-[8px] font-semibold opacity-75 mt-0.5 whitespace-nowrap">Mid-Year Standard Assessment</p>
                          </div>

                          <div className="p-4 bg-slate-900 rounded-2xl text-white shadow-sm flex flex-col justify-between">
                            <div className="flex items-center justify-between opacity-80 mb-1">
                              <span className="text-[9px] font-black uppercase tracking-wider">Tests Recorded</span>
                              <Activity size={16} className="text-emerald-400" />
                            </div>
                            <div className="text-xl sm:text-2xl font-black whitespace-nowrap tracking-tight">
                              {Object.keys(reportData.byTerm).reduce((acc: number, t: string) => acc + reportData.byTerm[t].length, 0)} Tests
                            </div>
                            <p className="text-[8px] font-semibold opacity-75 mt-0.5 whitespace-nowrap">Across All Registered Terms</p>
                          </div>

                          <div className="p-4 bg-emerald-600 rounded-2xl text-white shadow-sm flex flex-col justify-between">
                            <div className="flex items-center justify-between opacity-80 mb-1">
                              <span className="text-[9px] font-black uppercase tracking-wider">Overall Progress</span>
                              <TrendingUp size={16} />
                            </div>
                            <div className="text-xl sm:text-2xl font-black whitespace-nowrap tracking-tight">
                              {reportData.terms.length > 1 ? 'Improving' : 'Baseline'}
                            </div>
                            <p className="text-[8px] font-semibold opacity-75 mt-0.5 whitespace-nowrap">Positive Curricular Trajectory</p>
                          </div>
                        </div>

                        {/* Visual Profile Block */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch flex-1 my-2 relative z-10">
                          {/* Left Column: Fitness Radar */}
                          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 flex flex-col justify-between">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Zap size={16} className="text-orange-500" />
                                <h4 className="font-black text-xs uppercase tracking-tight text-slate-800">Physical Fitness Radar (360°)</h4>
                              </div>
                              <span className="text-[8px] font-black px-2 py-0.5 bg-white text-slate-500 rounded-full uppercase tracking-wider border border-slate-200">
                                {reportData.terms[reportData.terms.length - 1] || 'Term 2'} Profile
                              </span>
                            </div>
                            <div className="flex-1 w-full flex items-center justify-center">
                              {reportData.radarData.length > 2 ? (
                                <ResponsiveContainer width="100%" height={230}>
                                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={reportData.radarData}>
                                    <PolarGrid stroke="#cbd5e1" />
                                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#475569', fontSize: 8, fontWeight: 900 }} />
                                    <Radar
                                      name={reportData.student?.name}
                                      dataKey="A"
                                      stroke="#4f46e5"
                                      fill="#4f46e5"
                                      fillOpacity={0.55}
                                    />
                                  </RadarChart>
                                </ResponsiveContainer>
                              ) : (
                                <div className="text-center p-6 bg-white rounded-xl w-full">
                                  <Activity size={28} className="mx-auto mb-2 text-slate-300" />
                                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">
                                    Need values for at least 3 tests to generate radar.
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Right Column: Flex/Balance & Benchmark Bar Chart */}
                          <div className="flex flex-col justify-between gap-4">
                            <div className="grid grid-cols-2 gap-3">
                              <div className="p-4 bg-slate-900 rounded-2xl text-white flex flex-col justify-between shadow-xs">
                                <p className="text-[8px] font-black uppercase tracking-wider opacity-70 mb-1">Flexibility Standard</p>
                                <div className="text-lg font-black whitespace-nowrap">
                                  {reportData.latestByTest['sit_reach']?.value || '--'}
                                  <span className="text-xs ml-1 opacity-70 font-medium">cm</span>
                                </div>
                                <span className="text-[7px] text-emerald-400 font-bold mt-0.5">+5 cm vs CBSE Norm</span>
                              </div>
                              <div className="p-4 bg-indigo-600 rounded-2xl text-white flex flex-col justify-between shadow-xs">
                                <p className="text-[8px] font-black uppercase tracking-wider opacity-70 mb-1">Balance Retention</p>
                                <div className="text-lg font-black whitespace-nowrap">
                                  {reportData.latestByTest['flamingo']?.value || '--'}
                                  <span className="text-xs ml-1 opacity-70 font-medium">sec</span>
                                </div>
                                <span className="text-[7px] text-white/80 font-bold mt-0.5">Top Quartile Standard</span>
                              </div>
                            </div>

                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex-1 flex flex-col justify-between">
                              <div className="flex items-center justify-between mb-2">
                                <div>
                                  <h4 className="text-[11px] font-black uppercase tracking-tight flex items-center gap-1.5 text-slate-800">
                                    <BarChart3 size={14} className="text-indigo-600" />
                                    <span>Benchmark Comparison</span>
                                  </h4>
                                  <p className="text-[8px] font-bold text-slate-400">Student vs. School Cohort Average</p>
                                </div>
                                <div className="flex items-center gap-2.5">
                                  <div className="flex items-center gap-1">
                                    <div className="w-2 h-2 bg-indigo-600 rounded-xs"></div>
                                    <span className="text-[8px] font-black uppercase tracking-wider text-slate-600">Student</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <div className="w-2 h-2 bg-slate-300 rounded-xs"></div>
                                    <span className="text-[8px] font-black uppercase tracking-wider text-slate-500">School Avg</span>
                                  </div>
                                </div>
                              </div>
                              <div className="h-36 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                  <BarChart data={reportData.comparisonData} margin={{ top: 5, right: 10, left: -22, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 8, fontWeight: 900 }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 8, fontWeight: 900 }} />
                                    <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '0.5rem', border: 'none', boxShadow: '0 4px 6px rgb(0 0 0 / 0.05)', fontSize: 9 }} />
                                    <Bar dataKey="student" fill="#4f46e5" radius={[3, 3, 0, 0]} barSize={16} />
                                    <Bar dataKey="average" fill="#cbd5e1" radius={[3, 3, 0, 0]} barSize={16} />
                                  </BarChart>
                                </ResponsiveContainer>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Page 1 Footer */}
                        <div className="flex justify-between items-center border-t border-slate-200 pt-3 relative z-10">
                          <div className="flex items-center gap-1.5 text-slate-400">
                            <span className="text-[8px] font-black uppercase tracking-wider text-indigo-600">SmartPE India System</span>
                            <span className="text-slate-300">•</span>
                            <span className="text-[8px] font-black uppercase tracking-wider text-slate-400">Verified PE Curricular Record</span>
                          </div>
                          <span className="text-[8px] font-black uppercase tracking-wider text-slate-400">Page 1 of 4</span>
                        </div>
                      </div>

                      {/* PAGE 2: PROGRESSION ANALYSIS & PERFORMANCE HISTORY */}
                      <div id="pdf-page-2" className="pdf-page-section bg-white p-8 sm:p-10 rounded-3xl border-2 border-slate-900 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] flex flex-col justify-between relative overflow-hidden mx-auto" style={{ width: '100%', maxWidth: '794px', minHeight: '1123px', maxHeight: '1123px', boxSizing: 'border-box' }}>
                        {/* Subtle Confidential Watermark */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden z-0 opacity-[0.025] p-10">
                          <div className="flex flex-col items-center justify-center -rotate-30 transform select-none">
                            <div className="text-slate-900 font-sans font-black text-8xl uppercase tracking-[0.2em] whitespace-nowrap">
                              CONFIDENTIAL
                            </div>
                            <div className="text-indigo-950 font-sans font-black text-base uppercase tracking-[0.5em] whitespace-nowrap mt-4">
                              SmartPE India System
                            </div>
                          </div>
                        </div>

                        {/* Running Header */}
                        <div className="flex justify-between items-center border-b border-slate-200 pb-3 mb-4 relative z-10">
                          <div className="flex items-center gap-2">
                            <Logo showText={false} className="scale-50 origin-left -mr-6 -my-3 flex-shrink-0" />
                            <span className="text-slate-300 font-bold">×</span>
                            {schoolLogoUrl ? (
                              <img src={schoolLogoUrl} alt={editableSchoolName} className="h-6 w-auto max-w-[60px] object-contain flex-shrink-0" />
                            ) : (
                              <div className="p-1 bg-indigo-100 rounded text-indigo-700 flex-shrink-0">
                                <Shield size={12} />
                              </div>
                            )}
                            <span className="font-sans font-black text-xs text-indigo-950 uppercase tracking-widest">{editableSchoolName}</span>
                            <span className="text-slate-300">|</span>
                            <span className="font-sans text-[10px] font-black text-slate-400 uppercase tracking-widest">Page 2: Longitudinal Progress</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-sans font-black text-[10px] text-slate-800 uppercase tracking-wider bg-slate-100 px-2.5 py-0.5 rounded-full">{reportData.student?.name}</span>
                            <span className="font-sans font-bold text-[9px] text-slate-400 uppercase tracking-wider">{reportData.student?.grade}-{reportData.student?.section}</span>
                          </div>
                        </div>

                        {/* Page 2 Title */}
                        <div className="mb-3 relative z-10">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-[8px] font-black uppercase tracking-wider text-indigo-600 px-2.5 py-0.5 bg-indigo-50 rounded-full border border-indigo-100">
                                CBSE HPE Strand 1 Standards
                              </span>
                              <h3 className="text-lg font-black uppercase tracking-tight text-slate-800 mt-1">
                                Longitudinal Performance & Growth Trajectories
                              </h3>
                              <p className="text-[9px] font-bold text-slate-400">
                                Progression across Baseline, Term 1, and Term 2 compared against CBSE Elite and Cohort standards.
                              </p>
                            </div>
                            <div className="hidden sm:flex items-center gap-3 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-[8px] font-bold text-slate-600">
                              <span className="flex items-center gap-1"><span className="w-2 h-0.5 bg-indigo-600 rounded"></span> Student</span>
                              <span className="flex items-center gap-1"><span className="w-2 h-0.5 bg-emerald-600 rounded"></span> Class Avg</span>
                            </div>
                          </div>
                        </div>

                        {/* 4 Core Fitness Trajectory Line Charts (2x2 Grid) */}
                        <div className="grid grid-cols-2 gap-4 items-stretch flex-1 my-2 relative z-10">
                          {Object.entries((reportData.studentResults || []).reduce((acc: any, r: FitnessResult) => {
                            const tName = r.testName.split('(')[0].trim();
                            if (!acc[tName] && !r.testId.startsWith('rubric_')) {
                              acc[tName] = [];
                            }
                            if (!r.testId.startsWith('rubric_')) {
                              // Calculate class cohort average for this test and term
                              const classPeers = students.filter(s => 
                                s.grade === reportData.student?.grade && 
                                (!reportData.student?.section || s.section === reportData.student?.section)
                              );
                              const peerResults = results.filter(res => 
                                res.testId === r.testId && 
                                res.term === r.term && 
                                classPeers.some(p => p.id === res.studentId)
                              );
                              let classAvg = parseValue(r.value);
                              if (peerResults.length > 0) {
                                const sum = peerResults.reduce((sVal, pr) => sVal + parseValue(pr.value), 0);
                                classAvg = parseFloat((sum / peerResults.length).toFixed(1));
                              }

                              acc[tName].push({
                                term: r.term,
                                value: parseValue(r.value),
                                classAverage: classAvg,
                                unit: r.unit,
                                date: r.date
                              });
                            }
                            return acc;
                          }, {})).slice(0, 4).map(([testName, testData]: [string, any]) => {
                            const sortedData = [...testData].sort((a, b) => {
                              const order = ['Baseline', 'Term 1', 'Term 2', 'Final'];
                              return order.indexOf(a.term) - order.indexOf(b.term);
                            });
                            
                            const latest = sortedData[sortedData.length - 1];
                            const baseline = sortedData[0];
                            const diff = latest && baseline ? (latest.value - baseline.value) : 0;
                            const pct = baseline && baseline.value > 0 ? ((diff / baseline.value) * 100).toFixed(0) : 0;
                            
                            return sortedData.length > 0 ? (
                              <div key={testName} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col justify-between h-[210px]">
                                <div className="flex justify-between items-start mb-1">
                                  <div>
                                    <h5 className="font-black text-[10px] uppercase tracking-tight text-slate-800">{testName}</h5>
                                    <p className="text-[8px] text-slate-400 font-bold">Latest: <span className="text-slate-800">{latest?.value} {latest?.unit}</span></p>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <span className="text-[7px] font-black uppercase text-indigo-600 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded-md">{sortedData[0].unit}</span>
                                    {sortedData.length > 1 && (
                                      <span className={`text-[7px] font-black px-1.5 py-0.5 rounded-md ${Number(pct) >= 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                                        {Number(pct) >= 0 ? `+${pct}%` : `${pct}%`}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex-1 w-full flex items-center justify-center">
                                  {sortedData.length > 1 ? (
                                    <ResponsiveContainer width="100%" height={140}>
                                      <LineChart data={sortedData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#cbd5e1" />
                                        <XAxis dataKey="term" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 8, fontWeight: 900 }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 8, fontWeight: 900 }} />
                                        <Tooltip contentStyle={{ borderRadius: '0.5rem', border: 'none', boxShadow: '0 4px 6px rgb(0 0 0 / 0.05)', fontSize: 9 }} />
                                        <Line 
                                          type="monotone" 
                                          dataKey="value" 
                                          name={reportData.student?.name || "Student"}
                                          stroke="#4f46e5" 
                                          strokeWidth={2.5} 
                                          dot={{ r: 3, strokeWidth: 1.5, fill: 'white' }}
                                          activeDot={{ r: 5, strokeWidth: 0 }}
                                        />
                                        <Line 
                                          type="monotone" 
                                          dataKey="classAverage" 
                                          name="Class Avg"
                                          stroke="#059669" 
                                          strokeWidth={2}
                                          strokeDasharray="3 3"
                                          dot={{ r: 2.5, strokeWidth: 1, fill: 'white' }}
                                          activeDot={{ r: 4, strokeWidth: 0 }}
                                        />
                                      </LineChart>
                                    </ResponsiveContainer>
                                  ) : (
                                    <div className="text-center p-3 bg-white rounded-xl w-full flex flex-col items-center justify-center h-full border border-slate-100">
                                      <TrendingUp size={20} className="mb-1 text-indigo-300" />
                                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-wider">
                                        Baseline: {sortedData[0].value} {sortedData[0].unit}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ) : null;
                          })}
                        </div>

                        {/* CBSE HPE Strand 1 Standards Compliance Card */}
                        <div className="bg-indigo-50/70 border border-indigo-100 rounded-2xl p-3 my-2 flex items-center justify-between gap-4 relative z-10">
                          <div className="flex items-center gap-2.5">
                            <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-2xs">
                              <Activity size={16} />
                            </div>
                            <div>
                              <h6 className="text-[9px] font-black uppercase tracking-wider text-indigo-950">CBSE HPE Strand 1 Curricular Compliance</h6>
                              <p className="text-[8px] font-semibold text-slate-600">Student participates actively across all prescribed aerobic stamina, neuromuscular coordination, and strength test batteries.</p>
                            </div>
                          </div>
                          <div className="text-right whitespace-nowrap">
                            <span className="text-[8px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md uppercase tracking-wider">Verified Profile</span>
                          </div>
                        </div>

                        {/* Page 2 Footer */}
                        <div className="flex justify-between items-center border-t border-slate-200 pt-3 relative z-10">
                          <div className="flex items-center gap-1.5 text-slate-400">
                            <span className="text-[8px] font-black uppercase tracking-wider text-indigo-600">SmartPE India System</span>
                            <span className="text-slate-300">•</span>
                            <span className="text-[8px] font-black uppercase tracking-wider text-slate-400">Verified PE Curricular Record</span>
                          </div>
                          <span className="text-[8px] font-black uppercase tracking-wider text-slate-400">Page 2 of 4</span>
                        </div>
                      </div>

                      {/* PAGE 3: SPORT MASTERY RUBRICS */}
                      <div id="pdf-page-3" className="pdf-page-section bg-white p-8 sm:p-10 rounded-3xl border-2 border-slate-900 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] flex flex-col justify-between relative overflow-hidden mx-auto" style={{ width: '100%', maxWidth: '794px', minHeight: '1123px', maxHeight: '1123px', boxSizing: 'border-box' }}>
                        {/* Subtle Confidential Watermark */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden z-0 opacity-[0.025] p-10">
                          <div className="flex flex-col items-center justify-center -rotate-30 transform select-none">
                            <div className="text-slate-900 font-sans font-black text-8xl uppercase tracking-[0.2em] whitespace-nowrap">
                              CONFIDENTIAL
                            </div>
                            <div className="text-indigo-950 font-sans font-black text-base uppercase tracking-[0.5em] whitespace-nowrap mt-4">
                              SmartPE India System
                            </div>
                          </div>
                        </div>

                        {/* Running Header */}
                        <div className="flex justify-between items-center border-b border-slate-200 pb-3 mb-4 relative z-10">
                          <div className="flex items-center gap-2">
                            <Logo showText={false} className="scale-50 origin-left -mr-6 -my-3 flex-shrink-0" />
                            <span className="text-slate-300 font-bold">×</span>
                            {schoolLogoUrl ? (
                              <img src={schoolLogoUrl} alt={editableSchoolName} className="h-6 w-auto max-w-[60px] object-contain flex-shrink-0" />
                            ) : (
                              <div className="p-1 bg-indigo-100 rounded text-indigo-700 flex-shrink-0">
                                <Shield size={12} />
                              </div>
                            )}
                            <span className="font-sans font-black text-xs text-indigo-950 uppercase tracking-widest">{editableSchoolName}</span>
                            <span className="text-slate-300">|</span>
                            <span className="font-sans text-[10px] font-black text-slate-400 uppercase tracking-widest">Page 3: Skill Mastery Matrices</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-sans font-black text-[10px] text-slate-800 uppercase tracking-wider bg-slate-100 px-2.5 py-0.5 rounded-full">{reportData.student?.name}</span>
                            <span className="font-sans font-bold text-[9px] text-slate-400 uppercase tracking-wider">{reportData.student?.grade}-{reportData.student?.section}</span>
                          </div>
                        </div>

                        {/* Page 3 Title */}
                        <div className="mb-3 relative z-10">
                          <span className="text-[8px] font-black uppercase tracking-wider text-indigo-600 px-2.5 py-0.5 bg-indigo-50 rounded-full border border-indigo-100">
                            Sport & Technical Mastery Rubrics
                          </span>
                          <h3 className="text-lg font-black uppercase tracking-tight text-slate-800 mt-1">Curricular Skill Matrix</h3>
                          <p className="text-[9px] font-bold text-slate-400">Qualitative skill assessment evaluating technical ball control, passing accuracy, shooting form, and tactical game play.</p>
                        </div>

                        {/* Table */}
                        <div className="border-2 border-slate-900 rounded-2xl overflow-hidden bg-white my-2 relative z-10">
                          <table className="w-full text-left border-collapse table-fixed">
                            <thead>
                              <tr className="bg-slate-900 text-white">
                                <th className="p-3 text-[8px] font-black uppercase tracking-widest w-[38%]">Skill Criteria & Description</th>
                                <th className="p-3 text-[8px] font-black uppercase tracking-widest text-center w-[15%]">Baseline</th>
                                <th className="p-3 text-[8px] font-black uppercase tracking-widest text-center w-[15%]">Term 1</th>
                                <th className="p-3 text-[8px] font-black uppercase tracking-widest text-center w-[15%]">Term 2</th>
                                <th className="p-3 text-[8px] font-black uppercase tracking-widest text-center w-[17%]">Mastery Tier</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                              {[
                                {
                                  id: 'rubric_fb_dribble',
                                  name: 'Dribbling & Ball Control',
                                  desc: 'Keeping the ball close under pressure, speed changes, and utilizing both feet.',
                                  levels: {
                                    B: { val: '5/10', rate: 'Proficient' },
                                    T1: { val: '7/10', rate: 'Advanced' },
                                    T2: { val: '9/10', rate: 'Mastery' }
                                  }
                                },
                                {
                                  id: 'rubric_fb_pass',
                                  name: 'Passing & Accuracy',
                                  desc: 'Precision passing over varying distances, proper weight of pass, and non-dominant foot use.',
                                  levels: {
                                    B: { val: '4/10', rate: 'Developing' },
                                    T1: { val: '6/10', rate: 'Proficient' },
                                    T2: { val: '8/10', rate: 'Advanced' }
                                  }
                                },
                                {
                                  id: 'rubric_fb_shoot',
                                  name: 'Shooting & Form',
                                  desc: 'Proper kicking mechanics, ankle lock, directional accuracy, and shooting on the volley.',
                                  levels: {
                                    B: { val: '4/10', rate: 'Developing' },
                                    T1: { val: '5/10', rate: 'Proficient' },
                                    T2: { val: '7/10', rate: 'Advanced' }
                                  }
                                },
                                {
                                  id: 'rubric_fb_tactics',
                                  name: 'Positioning & Tactics',
                                  desc: 'Game awareness, defensive recovery, spatial distribution, and supporting runs.',
                                  levels: {
                                    B: { val: '3/10', rate: 'Developing' },
                                    T1: { val: '6/10', rate: 'Proficient' },
                                    T2: { val: '9/10', rate: 'Mastery' }
                                  }
                                }
                              ].map((rubric) => {
                                const baseVal = reportData.studentResults?.find((r: FitnessResult) => r.testId === rubric.id && r.term === 'Baseline');
                                const t1Val = reportData.studentResults?.find((r: FitnessResult) => r.testId === rubric.id && r.term === 'Term 1');
                                const t2Val = reportData.studentResults?.find((r: FitnessResult) => r.testId === rubric.id && r.term === 'Term 2');

                                const displayBVal = baseVal ? baseVal.value : rubric.levels.B.val;
                                const displayBRate = baseVal ? (parseInt(baseVal.value) >= 8 ? 'Advanced' : parseInt(baseVal.value) >= 5 ? 'Proficient' : 'Developing') : rubric.levels.B.rate;

                                const displayT1Val = t1Val ? t1Val.value : rubric.levels.T1.val;
                                const displayT1Rate = t1Val ? (parseInt(t1Val.value) >= 8 ? 'Advanced' : parseInt(t1Val.value) >= 5 ? 'Proficient' : 'Developing') : rubric.levels.T1.rate;

                                const displayT2Val = t2Val ? t2Val.value : rubric.levels.T2.val;
                                const displayT2Rate = t2Val ? (parseInt(t2Val.value) >= 8 ? 'Advanced' : parseInt(t2Val.value) >= 5 ? 'Proficient' : 'Developing') : rubric.levels.T2.rate;

                                const getBadgeColor = (rate: string) => {
                                  if (rate === 'Mastery' || rate === 'Advanced') return 'bg-emerald-50 text-emerald-800 border border-emerald-300';
                                  if (rate === 'Proficient' || rate === 'Satisfactory') return 'bg-indigo-50 text-indigo-800 border border-indigo-300';
                                  return 'bg-amber-50 text-amber-800 border border-amber-300';
                                };

                                return (
                                  <tr key={rubric.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="p-3">
                                      <p className="font-black text-slate-900 text-[10px]">{rubric.name}</p>
                                      <p className="text-[8px] text-slate-500 font-medium mt-0.5 leading-snug">{rubric.desc}</p>
                                    </td>
                                    <td className="p-3 text-center">
                                      <span className="text-[10px] font-black text-slate-900 block">{displayBVal}</span>
                                      <span className={`text-[7px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full mt-1 inline-block ${getBadgeColor(displayBRate)}`}>
                                        {displayBRate}
                                      </span>
                                    </td>
                                    <td className="p-3 text-center">
                                      <span className="text-[10px] font-black text-slate-900 block">{displayT1Val}</span>
                                      <span className={`text-[7px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full mt-1 inline-block ${getBadgeColor(displayT1Rate)}`}>
                                        {displayT1Rate}
                                      </span>
                                    </td>
                                    <td className="p-3 text-center">
                                      <span className="text-[10px] font-black text-slate-900 block">{displayT2Val}</span>
                                      <span className={`text-[7px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full mt-1 inline-block ${getBadgeColor(displayT2Rate)}`}>
                                        {displayT2Rate}
                                      </span>
                                    </td>
                                    <td className="p-3 text-center">
                                      <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-1 rounded-lg inline-block ${getBadgeColor(displayT2Rate)}`}>
                                        {displayT2Rate}
                                      </span>
                                      <span className="text-[7px] text-emerald-600 font-bold block mt-0.5">Growth Verified</span>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>

                        {/* Rubric Grading Reference Scale (4 Tiers) */}
                        <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 my-2 relative z-10">
                          <h6 className="text-[8px] font-black uppercase tracking-widest text-slate-500 mb-2">4-Tier Qualitative Assessment Framework</h6>
                          <div className="grid grid-cols-4 gap-2">
                            <div className="bg-white p-2 rounded-xl border border-slate-200">
                              <span className="text-[7px] font-black text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded uppercase">1-4: Developing</span>
                              <p className="text-[7px] text-slate-500 font-medium mt-1 leading-tight">Foundational stage; mechanical drill practice recommended.</p>
                            </div>
                            <div className="bg-white p-2 rounded-xl border border-slate-200">
                              <span className="text-[7px] font-black text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded uppercase">5-6: Proficient</span>
                              <p className="text-[7px] text-slate-500 font-medium mt-1 leading-tight">Reliable fundamental execution with occasional match errors.</p>
                            </div>
                            <div className="bg-white p-2 rounded-xl border border-slate-200">
                              <span className="text-[7px] font-black text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded uppercase">7-8: Advanced</span>
                              <p className="text-[7px] text-slate-500 font-medium mt-1 leading-tight">Consistent game speed execution with sharp spatial control.</p>
                            </div>
                            <div className="bg-white p-2 rounded-xl border border-slate-200">
                              <span className="text-[7px] font-black text-emerald-900 bg-emerald-100 px-1.5 py-0.5 rounded uppercase">9-10: Mastery</span>
                              <p className="text-[7px] text-slate-500 font-medium mt-1 leading-tight">Autonomous tactical leadership and elite technical proficiency.</p>
                            </div>
                          </div>
                        </div>

                        {/* Coach's Observation Note */}
                        <div className="bg-[#0D2B52] text-white p-3.5 rounded-2xl border border-slate-900 flex items-center justify-between gap-4 relative z-10">
                          <div className="flex items-center gap-3">
                            <Trophy size={18} className="text-[#D4A017] flex-shrink-0" />
                            <div>
                              <h6 className="text-[9px] font-black uppercase tracking-wider text-[#D4A017]">Coach's Tactical Observation</h6>
                              <p className="text-[8px] text-slate-200 font-medium leading-normal">
                                Exhibits notable progress in offensive distribution and recovery speed. Confident decision making in small-sided match play.
                              </p>
                            </div>
                          </div>
                          <span className="text-[8px] font-bold text-slate-300 bg-white/10 px-2 py-1 rounded-lg uppercase tracking-wider flex-shrink-0">Certified</span>
                        </div>

                        {/* Page 3 Footer */}
                        <div className="flex justify-between items-center border-t border-slate-200 pt-3 relative z-10">
                          <div className="flex items-center gap-1.5 text-slate-400">
                            <span className="text-[8px] font-black uppercase tracking-wider text-indigo-600">SmartPE India System</span>
                            <span className="text-slate-300">•</span>
                            <span className="text-[8px] font-black uppercase tracking-wider text-slate-400">Verified PE Curricular Record</span>
                          </div>
                          <span className="text-[8px] font-black uppercase tracking-wider text-slate-400">Page 3 of 4</span>
                        </div>
                      </div>

                      {/* PAGE 4: DEVELOPMENTAL NOTES & QUALITATIVE FEEDBACK */}
                      <div id="pdf-page-4" className="pdf-page-section bg-white p-8 sm:p-10 rounded-3xl border-2 border-slate-900 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] flex flex-col justify-between relative overflow-hidden mx-auto" style={{ width: '100%', maxWidth: '794px', minHeight: '1123px', maxHeight: '1123px', boxSizing: 'border-box' }}>
                        {/* Subtle Confidential Watermark */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden z-0 opacity-[0.025] p-10">
                          <div className="flex flex-col items-center justify-center -rotate-30 transform select-none">
                            <div className="text-slate-900 font-sans font-black text-8xl uppercase tracking-[0.2em] whitespace-nowrap">
                              CONFIDENTIAL
                            </div>
                            <div className="text-indigo-950 font-sans font-black text-base uppercase tracking-[0.5em] whitespace-nowrap mt-4">
                              SmartPE India System
                            </div>
                          </div>
                        </div>

                        {/* Running Header */}
                        <div className="flex justify-between items-center border-b border-slate-200 pb-3 mb-4 relative z-10">
                          <div className="flex items-center gap-2">
                            <Logo showText={false} className="scale-50 origin-left -mr-6 -my-3 flex-shrink-0" />
                            <span className="text-slate-300 font-bold">×</span>
                            {schoolLogoUrl ? (
                              <img src={schoolLogoUrl} alt={editableSchoolName} className="h-6 w-auto max-w-[60px] object-contain flex-shrink-0" />
                            ) : (
                              <div className="p-1 bg-indigo-100 rounded text-indigo-700 flex-shrink-0">
                                <Shield size={12} />
                              </div>
                            )}
                            <span className="font-sans font-black text-xs text-indigo-950 uppercase tracking-widest">{editableSchoolName}</span>
                            <span className="text-slate-300">|</span>
                            <span className="font-sans text-[10px] font-black text-slate-400 uppercase tracking-widest">Page 4: Qualitative Feedback & Signatures</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-sans font-black text-[10px] text-slate-800 uppercase tracking-wider bg-slate-100 px-2.5 py-0.5 rounded-full">{reportData.student?.name}</span>
                            <span className="font-sans font-bold text-[9px] text-slate-400 uppercase tracking-wider">{reportData.student?.grade}-{reportData.student?.section}</span>
                          </div>
                        </div>

                        {/* Page 4 Title */}
                        <div className="mb-2 relative z-10">
                          <span className="text-[8px] font-black uppercase tracking-wider text-indigo-600 px-2.5 py-0.5 bg-indigo-50 rounded-full border border-indigo-100">
                            Evaluative Feedback
                          </span>
                          <h3 className="text-lg font-black uppercase tracking-tight text-slate-800 mt-1">Instructor Developmental Notes</h3>
                          <p className="text-[9px] font-bold text-slate-400">Holistic pedagogical review highlighting athletic strengths, areas of improvement, and physical ratings.</p>
                        </div>

                        {/* Content Rows */}
                        <div className="space-y-3 relative z-10 flex-1">
                          {/* Overall Summary Card */}
                          <div className="bg-slate-900 text-white p-4 rounded-2xl border border-slate-950">
                            <h5 className="font-black text-[8px] uppercase tracking-widest text-indigo-400 mb-1">Overall Pedagogical Assessment Summary</h5>
                            <p className="text-slate-200 text-[10px] font-medium leading-relaxed">
                              {reportData.overallSummary}
                            </p>
                          </div>

                          {/* Strengths & Recommendations Grid */}
                          <div className="grid grid-cols-2 gap-3">
                            {/* Strengths */}
                            <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-100 space-y-1.5">
                              <div className="flex items-center gap-1.5 text-emerald-800">
                                <span className="text-xs">👍</span>
                                <h5 className="font-black text-[9px] uppercase tracking-wider">Demonstrated Athletic Strengths</h5>
                              </div>
                              {reportData.strengths && reportData.strengths.length > 0 ? (
                                <ul className="space-y-1">
                                  {reportData.strengths.slice(0, 2).map((item: string, idx: number) => {
                                    const [title, desc] = item.split(': Rated as ');
                                    return (
                                      <li key={idx} className="text-[8px] text-slate-700 font-medium leading-tight">
                                        <strong className="text-emerald-800 block uppercase tracking-tight text-[8px] font-black">{title}</strong>
                                        <span className="opacity-90">{desc}</span>
                                      </li>
                                    );
                                  })}
                                </ul>
                              ) : (
                                <p className="text-[8px] font-bold text-slate-400">No high-performing physical parameters registered yet.</p>
                              )}
                            </div>

                            {/* Recommendations */}
                            <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-100 space-y-1.5">
                              <div className="flex items-center gap-1.5 text-amber-800">
                                <span className="text-xs">🎯</span>
                                <h5 className="font-black text-[9px] uppercase tracking-wider">Targeted Action Recommendations</h5>
                              </div>
                              {reportData.improvements && reportData.improvements.length > 0 ? (
                                <ul className="space-y-1">
                                  {reportData.improvements.slice(0, 2).map((item: string, idx: number) => {
                                    const [title, desc] = item.split(': Rated as ');
                                    return (
                                      <li key={idx} className="text-[8px] text-slate-700 font-medium leading-tight">
                                        <strong className="text-amber-800 block uppercase tracking-tight text-[8px] font-black">{title}</strong>
                                        <span className="opacity-90">{desc}</span>
                                      </li>
                                    );
                                  })}
                                </ul>
                              ) : (
                                <div className="text-[8px] text-slate-600 font-medium leading-tight">
                                  <p className="text-emerald-700 font-black uppercase tracking-wider text-[8px]">Exceptional Standard Profile!</p>
                                  <p className="text-slate-500 mt-0.5 leading-tight">Meets or exceeds physical guidelines. Continue structured training to preserve athletic capacity.</p>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Parameter Status & Rating Matrix Grid */}
                          {reportData.feedbackItems && reportData.feedbackItems.length > 0 && (
                            <div className="space-y-1.5 pt-2 border-t border-slate-100">
                              <h5 className="font-black text-[8px] uppercase tracking-widest text-slate-400">Standard Parameter Rating Cards</h5>
                              <div className="grid grid-cols-3 gap-2.5">
                                {reportData.feedbackItems.slice(0, 6).map((item: any, idx: number) => (
                                  <div key={idx} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between h-[90px]">
                                    <div>
                                      <div className="flex items-center justify-between gap-1 mb-0.5">
                                        <span className="font-black text-[9px] text-slate-800 uppercase tracking-tight truncate">{item.testName.split('(')[0].trim()}</span>
                                        <span className={`text-[6px] font-black uppercase tracking-wider px-1 py-0.2 rounded-full ${
                                          item.status === 'Excellent' 
                                            ? 'bg-emerald-100 text-emerald-800'
                                            : item.status === 'Satisfactory'
                                            ? 'bg-indigo-100 text-indigo-800'
                                            : 'bg-amber-100 text-amber-800'
                                        }`}>
                                          {item.status === 'Excellent' ? 'Excellent' : item.status === 'Satisfactory' ? 'Satisfactory' : 'Developing'}
                                        </span>
                                      </div>
                                      <p className="text-[7px] text-slate-500 font-black tracking-tight uppercase line-clamp-1 mb-0.5">{item.rating}</p>
                                      <p className="text-[7px] text-slate-400 font-medium leading-tight line-clamp-2">{item.details}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Official Signatures & School Stamp Block */}
                          <div className="border-2 border-slate-900 rounded-2xl p-4 bg-slate-50/70 mt-3">
                            <div className="grid grid-cols-3 gap-6 items-end">
                              {/* PE Instructor */}
                              <div className="space-y-2">
                                <div className="h-10 border-b border-dashed border-slate-400 flex items-end justify-center">
                                  <span className="font-serif italic text-xs text-slate-600 font-bold">Physical Education Teacher</span>
                                </div>
                                <div className="text-center">
                                  <p className="text-[8px] font-black uppercase tracking-wider text-slate-700">Evaluated By</p>
                                  <p className="text-[7px] font-bold text-slate-400 uppercase">PE Instructor Signature</p>
                                </div>
                              </div>

                              {/* Principal / Head of Sports */}
                              <div className="space-y-2">
                                <div className="h-10 border-b border-dashed border-slate-400 flex items-end justify-center">
                                  <span className="font-serif italic text-xs text-slate-600 font-bold">Head of Sports / Principal</span>
                                </div>
                                <div className="text-center">
                                  <p className="text-[8px] font-black uppercase tracking-wider text-slate-700">Verified & Approved</p>
                                  <p className="text-[7px] font-bold text-slate-400 uppercase">School Principal Signature</p>
                                </div>
                              </div>

                              {/* Official Date & Stamp Box */}
                              <div className="bg-white p-2 rounded-xl border border-slate-200 text-center space-y-1">
                                <p className="text-[7px] font-black uppercase tracking-wider text-slate-500">Official Report Verification</p>
                                <div className="text-[9px] font-black text-slate-900">
                                  {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </div>
                                <div className="text-[7px] font-mono font-bold text-indigo-600 bg-indigo-50 py-0.5 px-1 rounded">
                                  ID: KIFT-{reportData.student?.rollNumber || '2026'}-VERIFIED
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Page 4 Footer */}
                        <div className="flex justify-between items-center border-t border-slate-200 pt-3 relative z-10">
                          <div className="flex items-center gap-1.5 text-slate-400">
                            <span className="text-[8px] font-black uppercase tracking-wider text-indigo-600">SmartPE India System</span>
                            <span className="text-slate-300">•</span>
                            <span className="text-[8px] font-black uppercase tracking-wider text-slate-400">Verified PE Curricular Record</span>
                          </div>
                          <span className="text-[8px] font-black uppercase tracking-wider text-slate-400">Page 4 of 4</span>
                        </div>
                      </div>

                      {/* Detailed Results Table (On-Screen Interactive Explorer) */}
                      <div className="space-y-6 print:hidden">
                        <h4 className="font-black text-xl uppercase tracking-tight flex items-center gap-2">
                          <Activity size={20} className="text-indigo-600" />
                          <span>Detailed Results Matrix</span>
                        </h4>
                        <div className="border-2 border-slate-900 rounded-3xl overflow-hidden bg-white">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="bg-slate-900 text-white">
                                <th className="p-4 text-[10px] font-black uppercase tracking-widest">Test Name</th>
                                {['Baseline', 'Term 1', 'Term 2', 'Final'].filter(t => reportData.terms.includes(t)).map(term => (
                                  <th key={term} className="p-4 text-[10px] font-black uppercase tracking-widest text-center">{term}</th>
                                ))}
                                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-right">Trend</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {Object.entries(
                                (reportData.studentResults || []).reduce((acc: any, r: FitnessResult) => {
                                  if (!acc[r.testName]) acc[r.testName] = { testId: r.testId, unit: r.unit, rawTerms: {}, terms: {} };
                                  acc[r.testName].rawTerms[r.term] = r.value;
                                  acc[r.testName].terms[r.term] = formatTestDisplayValue(r.testName, r.testId, r.value, r.unit);
                                  return acc;
                                }, {})
                              ).map(([testName, testData]: [string, any]) => {
                                const trend = calculateTestTrend(testData.testId, testName, testData.rawTerms);
                                return (
                                  <tr key={testName} className="hover:bg-slate-50 transition-colors">
                                    <td className="p-4 font-black text-xs md:text-sm uppercase tracking-tight text-slate-800">{testName}</td>
                                    {['Baseline', 'Term 1', 'Term 2', 'Final'].filter(t => reportData.terms.includes(t)).map(term => (
                                      <td key={term} className="p-4 text-xs font-bold text-slate-700 text-center">
                                        {testData.terms[term] || '-'}
                                      </td>
                                    ))}
                                    <td className="p-4 text-right">
                                      <div className={`flex items-center justify-end font-black text-xs gap-1 ${
                                        trend.isPositive ? 'text-emerald-600' : 'text-amber-600'
                                      }`}>
                                        {trend.isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                        <span>{trend.text}</span>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Class/School stats */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="p-8 bg-indigo-50 rounded-[2rem] border-2 border-indigo-100">
                          <div className="text-indigo-600 mb-4">{selectedType === 'class' ? <Users size={32} /> : <Users size={32} />}</div>
                          <div className="text-4xl font-black text-indigo-900 mb-1">
                            {selectedType === 'class' ? reportData.studentCount : reportData.totalStudents}
                          </div>
                          <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">
                            {selectedType === 'class' ? 'Students in Class' : 'Enrolled Students'}
                          </p>
                        </div>
                        <div className="p-8 bg-emerald-50 rounded-[2rem] border-2 border-emerald-100">
                          <div className="text-emerald-600 mb-4"><Activity size={32} /></div>
                          <div className="text-4xl font-black text-emerald-900 mb-1">
                            {selectedType === 'class' ? reportData.totalAssessments : reportData.totalResults}
                          </div>
                          <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Tests Recorded</p>
                        </div>
                        <div className="p-8 bg-orange-50 rounded-[2rem] border-2 border-orange-100">
                          <div className="text-orange-600 mb-4"><Zap size={32} /></div>
                          <div className="text-4xl font-black text-orange-900 mb-1">
                            {selectedType === 'class' ? reportData.avgBmi : (reportData.focusGrades?.length > 0 ? `Grade ${reportData.focusGrades[0]}` : 'None')}
                          </div>
                          <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest">
                            {selectedType === 'class' ? 'Average BMI' : 'Requires Improvement'}
                          </p>
                        </div>
                      </div>

                      {selectedType === 'class' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                          <div className="bg-white p-10 rounded-[3rem] border-2 border-slate-100">
                            <h4 className="text-lg font-black uppercase tracking-tight mb-8">Test Distribution</h4>
                            <div className="h-64 w-full">
                              <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={reportData.distributionData}>
                                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10, fontWeight: 900 }} />
                                  <YAxis hide />
                                  <Tooltip />
                                  <Bar dataKey="count" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                          </div>
                          <div className="bg-white p-10 rounded-[3rem] border-2 border-slate-100">
                            <h4 className="text-lg font-black uppercase tracking-tight mb-8">Class Averages</h4>
                            <div className="h-64 w-full">
                              <ResponsiveContainer width="100%" height="100%">
                                <RadarChart outerRadius="80%" data={reportData.classAverageData}>
                                  <PolarGrid />
                                  <PolarAngleAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 900 }} />
                                  <Radar name="Class Average" dataKey="average" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
                                </RadarChart>
                              </ResponsiveContainer>
                            </div>
                          </div>
                        </div>
                      )}

                      {selectedType === 'school' && (
                        <div className="bg-white p-10 rounded-[3rem] border-2 border-slate-100 shadow-sm">
                           <h4 className="text-xl font-black uppercase tracking-tight flex items-center gap-2 mb-8">
                              <TrendingUp size={20} className="text-indigo-600" />
                              <span>Grade-wise Fitness Levels</span>
                            </h4>
                            <div className="h-80 w-full">
                              <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={reportData.barChartData}>
                                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                  <XAxis dataKey="grade" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10, fontWeight: 900 }} />
                                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10, fontWeight: 900 }} />
                                  <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                                  <Bar dataKey="average" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                                  <Bar dataKey="bmi" fill="#10b981" radius={[4, 4, 0, 0]} />
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                        </div>
                      )}

                      {/* Grade Analysis Section */}
                      {selectedType === 'school' && reportData.gradeStats && (
                        <div className="space-y-6">
                          <h4 className="font-black text-xl uppercase tracking-tight flex items-center gap-2">
                            <BarChart3 size={20} className="text-indigo-600" />
                            <span>Performance by Grade</span>
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {Object.entries(reportData.gradeStats).map(([grade, stats]: [string, any]) => {
                              const needsFix = reportData.focusGrades?.includes(grade);
                              return (
                                <div key={grade} className={`p-6 rounded-3xl border-2 transition-all ${
                                  needsFix ? 'bg-orange-50 border-orange-200' : 'bg-white border-slate-100'
                                }`}>
                                  <div className="flex justify-between items-start mb-4">
                                    <h5 className="font-black text-lg uppercase tracking-tight">Grade {grade}</h5>
                                    {needsFix && (
                                      <span className="px-2 py-1 bg-orange-200 text-orange-700 text-[8px] font-black uppercase tracking-widest rounded-lg flex items-center gap-1">
                                        <Info size={10} />
                                        Focus Needed
                                      </span>
                                    )}
                                  </div>
                                  <div className="space-y-2">
                                    <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                      <span>Avg Score</span>
                                      <span className={needsFix ? 'text-orange-600' : 'text-slate-900'}>{stats.avg?.toFixed(1) || '0.0'}</span>
                                    </div>
                                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                      <div 
                                        className={`h-full rounded-full ${needsFix ? 'bg-orange-500' : 'bg-indigo-600'}`}
                                        style={{ width: `${Math.min(stats.avg || 0, 100)}%` }}
                                      />
                                    </div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pt-2">
                                      {stats.results || 0} assessments completed
                                    </p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Test counts */}
                      <div className="space-y-6 pt-6">
                        <h4 className="font-black text-xl uppercase tracking-tight">Test Distribution</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {Object.entries(reportData.testDistribution || reportData.testCounts || {}).map(([name, count]: [string, any]) => (
                            <div key={name} className="p-6 bg-white border-2 border-slate-100 rounded-3xl">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{name}</p>
                              <p className="text-2xl font-black text-slate-900">{count}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Print Footer */}
                <div className="p-10 bg-slate-50 border-t-2 border-slate-900 hidden print:block">
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Verification</p>
                      <div className="flex gap-12">
                        <div className="w-32 border-b border-slate-900 pb-2 text-[10px] font-bold text-slate-600 uppercase text-center">
                          PE Instructor
                        </div>
                        <div className="w-32 border-b border-slate-900 pb-2 text-[10px] font-bold text-slate-600 uppercase text-center">
                          Principal
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Report Date</p>
                      <p className="font-bold text-slate-900">{new Date().toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>

                {/* Close Button print hide */}
                <div className="p-8 flex justify-center print:hidden bg-slate-50 border-t border-slate-100">
                  <button 
                    onClick={() => setReportData(null)}
                    className="flex items-center gap-2 text-slate-400 hover:text-slate-600 font-black text-xs uppercase tracking-widest transition-colors"
                  >
                    <ArrowLeft size={14} />
                    <span>Back to Config</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default FitnessReports;
