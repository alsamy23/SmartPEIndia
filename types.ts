
export enum BoardType {
  CBSE = 'CBSE',
  ICSE = 'ICSE',
  STATE = 'State Board',
  IB = 'IB'
}

export type Language = 'English' | 'Hindi' | 'Marathi' | 'Tamil' | 'Bengali';

export interface TeacherProfile {
  id: string;
  name: string;
  location: string;
  board: BoardType;
  specialization: string[];
  experience: number;
  avatar: string;
}

export interface LessonPlan {
  // Header Info
  teacher: string;
  subject: string;
  grade: string;
  date: string;
  topic: string;
  period: string;
  termWeek: string;
  duration: string;

  // Framework
  equipment: string[];
  teachingAids: string[];
  safety: string[];
  keyVocabulary: string[];
  sen?: {
    wave1: string;
    wave2: string;
    wave3: string;
  };
  objectives?: {
    know: string;
    understand: string;
    beAbleTo: string;
  };
  successCriteria?: {
    all: string;
    most: string;
    some: string;
  };

  // Structure
  starter?: {
    time: string;
    title: string;
    description: string;
  };
  mainActivity?: {
    time: string;
    activities: {
      title: string;
      description: string;
      coachingPoints: string[];
    }[];
  };
  plenary?: {
    time: string;
    title: string;
    description: string;
  };

  // Footer Info
  homework: string;
  collaboration: string;
  differentiation: string;
  criticalThinking: string;

  // Visuals
  warmupDiagramPrompt: string;
  warmupDiagramUrl?: string;
  explanationDiagramPrompt: string;
  explanationDiagramUrl?: string;
  gameDiagramPrompt: string;
  gameDiagramUrl?: string;
}

export interface UnitPlan {
  unitTitle: string;
  duration: string;
  weeklyBreakdown: {
    week: number;
    focus: string;
    keyLearning: string;
    suggestedDrills: string[];
  }[];
}

export interface Rubric {
  topic: string;
  categories: {
    name: string;
    levels: {
      name: string;
      description: string;
    }[];
  }[];
}

export interface TheoryContent {
  title: string;
  contentType: 'Notes' | 'MCQ' | 'CaseStudy';
  content: string;
  questions: {
    question: string;
    answer: string;
    type: string;
  }[];
}

export interface Worksheet {
  title: string;
  content: {
    sectionTitle: string;
    questions: {
      question: string;
      type: 'MCQ' | 'Short' | 'Reflective';
      options?: string[];
    }[];
  }[];
}

export interface SkillProgression {
  skillName: string;
  level: string;
  phases: {
    phaseName: string;
    drills: string[];
    technicalFocus: string;
    diagramPrompt: string;
    diagramUrl?: string;
  }[];
}

export interface YearlyPlan {
  grade: string;
  board: string;
  academicYear: string;
  duration: string;
  startDate?: string;
  generatedDate: string;
  terms: {
    termName: string;
    months: {
      monthName: string;
      weeks: {
        weekNumber: number;
        status: 'Instructional' | 'Holiday' | 'Exam' | 'Event';
        dates: string;
        topic: string;
        details: string;
      }[];
    }[];
  }[];
}

export interface FitnessAssessment {
  studentName: string;
  age: number;
  gender: 'Male' | 'Female';
  tests: {
    testName: string;
    score: string;
    percentile: string;
    rating: 'Needs Improvement' | 'Average' | 'Good' | 'Excellent' | 'Elite';
    recommendation: string;
  }[];
  overallSummary: string;
}

export interface BiomechanicsConcept {
  concept: string;
  sportApplication: string;
  explanation: string;
  analogy: string;
  diagramPrompt: string;
  diagramUrl?: string;
}

export interface TestPaper {
  title: string;
  grade: string;
  displayGrade?: string;
  subjectCode?: string;
  sessionLabel?: string;
  testType: string;
  timeAllowed: string;
  maxMarks: number;
  generalInstructions: string[];
  sections: {
    sectionId: string;
    heading?: string;
    questionRange?: string;
    instructions: string;
    questions: {
      questionNumber?: number;
      question: string;
      marks: number;
      options?: string[];
      answer?: string;
      caseStudyText?: string;
      internalChoice?: string;
      caseStudyImagePrompt?: string;
      subQuestions?: {
        question: string;
        options: string[];
        answer: string;
      }[];
      figureLabel?: string;
      visuallyImpairedAlternative?: string;
    }[];
  }[];
  markingScheme?: {
    header: string;
    sections: {
      sectionId: string;
      items: {
        qNo: string;
        answer: string;
        marks: string;
      }[];
    }[];
  };
}

export interface Student {
  id: string;
  name: string;
  rollNumber: string;
  grade: string;
  section: string;
  gender: 'Male' | 'Female';
  age: number;
  schoolId: string;
  teacherId: string;
  attendance?: number;
  performance?: 'Excellent' | 'Good' | 'Average' | 'Needs Improvement';
  lastAssessment?: string;
}

export interface Team {
  id: string;
  name: string;
  grade: string;
  section: string;
  studentIds: string[];
  teacherId: string;
  schoolId: string;
}

export interface School {
  id: string;
  name: string;
  adminId: string;
  address?: string;
  logoUrl?: string;
  code?: string;
  createdAt: string;
}

export interface SchoolMember {
  uid: string;
  schoolId: string;
  role: 'admin' | 'teacher';
  displayName: string;
  email: string;
  schoolName?: string;
  schoolLogo?: string;
}

export interface FitnessResult {
  id: string;
  studentId: string;
  teacherId: string;
  schoolId: string;
  testId: string;
  testName: string;
  value: string;
  unit: string;
  date: string;
  term: string;
  rating?: string;
  percentile?: number;
}

export type KIFTGradeCategory = 'Primary' | 'Upper Primary' | 'Middle School' | 'Secondary' | 'Senior Secondary';

export interface KIFTTest {
  id: string;
  name: string;
  unit: string;
  description: string;
  duration?: string;      // e.g. "60 Seconds (1 Minute)" or "30 Seconds"
  protocol?: string;      // Detailed step-by-step procedure according to CBSE / Khelo India
  equipment?: string[];   // e.g. ["Mat", "Stopwatch", "Cones"]
  scoringGuide?: string;  // e.g. "Count total completed valid push-ups in 60s"
}

export interface KIFTBattery {
  category: KIFTGradeCategory;
  grades: string[];
  objective: string;
  tests: KIFTTest[];
}

export interface PracticalAssessment {
  id: string;
  studentId: string;
  studentName: string;
  rollNumber: string;
  grade: string;
  section: string;
  gender: 'Male' | 'Female';
  academicYear: string;
  examType: 'CBSE Board Practical Final' | 'Pre-Board Practical' | 'Term 1 Internal Practical' | 'Term 2 Internal Practical' | 'Mid-Term Evaluation';
  schoolId: string;
  teacherId: string;
  date: string;
  
  // CBSE 30-Mark Split Breakdown
  fitnessTestScore: number;         // Max 7 Marks
  fitnessDetails?: {
    testName?: string;
    rawValue?: string;
    rating?: string;
  };
  
  yogicPracticesScore: number;      // Max 7 Marks
  yogaAsanasSelected?: string[];
  
  gameProficiencyScore: number;     // Max 7 Marks
  gameSelected?: string;
  gameSkillsDemonstrated?: string[];
  
  recordFileScore: number;          // Max 5 Marks
  recordNotes?: string;
  
  vivaVoceScore: number;            // Max 5 Marks
  vivaTopics?: string[];
  vivaNotes?: string;
  
  totalMarks: number;               // Max 30 Marks (Sum of 7+7+7+5+5)
  totalMarksInWords?: string;
  examinerRemarks?: string;
  status: 'completed' | 'draft' | 'absent';
}

export interface VivaQuestionPrompt {
  id: string;
  category: 'Game' | 'Yoga' | 'Fitness' | 'General PE';
  subCategory: string;
  question: string;
  expectedAnswer: string;
  marksWeight: number;
}

// Brand communication and super-administrator emails
export const BRAND_EMAILS = {
  admin: 'admin@smartpeindia.app',
  contact: 'contact@smartpeindia.app',
  info: 'info@smartpeindia.app',
  support: 'contact@smartpeindia.app',
  privacy: 'admin@smartpeindia.app',
  feedback: 'info@smartpeindia.app'
} as const;

export const SUPER_ADMIN_EMAILS = [
  'admin@smartpeindia.app',
  'contact@smartpeindia.app',
  'info@smartpeindia.app'
];

export const isBrandSuperAdmin = (email?: string | null): boolean => {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  return SUPER_ADMIN_EMAILS.some(e => e.toLowerCase() === normalized);
};

declare global {
  interface Window {
    aistudio?: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}
