import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase.ts';

export interface RouteSEOOverride {
  title?: string;
  description?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  keywords?: string;
  canonicalPath?: string;
}

export interface SEOConfig {
  canonicalUrl: string;
  allowCrawling: boolean;
  metaTitlePrefix: string;
  metaDescription: string;
  socialTitle: string;
  socialDescription: string;
  socialImageUrl: string;
  shareUrlFormat: 'domain_only' | 'vercel';
  sitemapActive: boolean;
  keywords: string;
  author: string;
  siteName: string;
  twitterHandle: string;
  routeOverrides: Record<string, RouteSEOOverride>;
}

export const DEFAULT_SEO_CONFIG: SEOConfig = {
  canonicalUrl: 'https://smartpeindia.app/',
  allowCrawling: true,
  metaTitlePrefix: 'SmartPE India',
  metaDescription: "SmartPE helps Indian schools plan PE lessons, track student fitness, assess sports skills and manage physical education records in one platform.",
  socialTitle: "Physical Education Software for Indian Schools | SmartPE India",
  socialDescription: "SmartPE helps Indian schools plan PE lessons, track student fitness, assess sports skills and manage physical education records in one platform.",
  socialImageUrl: 'https://smartpeindia.app/logo.png',
  shareUrlFormat: 'domain_only',
  sitemapActive: true,
  keywords: 'physical education software, physical education software India, PE teacher software, physical education management system, school PE management, CBSE physical education, CBSE PE lesson planner, student fitness assessment, Khelo India fitness assessment, PE assessment, physical education assessment, PE department management, school sports management, smartpeindia',
  author: 'SmartPE India',
  siteName: 'SmartPE India',
  twitterHandle: '@smartpeindia',
  routeOverrides: {
    dashboard: {
      title: 'Physical Education Software for Indian Schools | SmartPE India',
      description: 'SmartPE helps Indian schools plan PE lessons, track student fitness, assess sports skills and manage physical education records in one platform.',
      keywords: 'physical education software, physical education software India, PE teacher software, physical education management system, school PE management, PE department management',
      canonicalPath: '/'
    },
    'cbse-physical-education': {
      title: 'CBSE Physical Education Tools for Schools | SmartPE India',
      description: 'Plan CBSE PE lessons, manage 30-mark practical assessments, track student fitness, and streamline PE department records with SmartPE India.',
      keywords: 'CBSE physical education, CBSE PE lesson planner, CBSE PE assessment, CBSE physical education resources, CBSE PE teacher tools, practical assessment',
      canonicalPath: '/cbse-physical-education'
    },
    'khelo-india-fitness-assessment': {
      title: 'Khelo India Fitness Assessment for Schools | SmartPE India',
      description: 'Manage student fitness assessment data using SmartPE. Record SAI battery test scores, calculate percentiles, and generate official fitness report cards.',
      keywords: 'Khelo India fitness assessment, student fitness assessment, school fitness assessment, student fitness tracker, PE fitness report card, fitness test calculator',
      canonicalPath: '/khelo-india-fitness-assessment'
    },
    'ai-pe-lesson-planner': {
      title: 'AI PE Lesson Planner for Physical Education Teachers | SmartPE India',
      description: 'Generate structured physical education lesson plans in under 60 seconds. Aligned with CBSE and Indian school sports curricula to save teacher time.',
      keywords: 'AI PE lesson planner, physical education lesson planner, PE lesson plans, structured lesson planning, PE curriculum planning, sports activity planning',
      canonicalPath: '/ai-pe-lesson-planner'
    },
    'physical-education-assessment': {
      title: 'Physical Education Assessment & Fitness Reports | SmartPE India',
      description: 'Comprehensive student fitness assessments, sports skill assessment rubrics, practical scoring, student records, and printable school PE progress reports.',
      keywords: 'PE assessment, physical education assessment, student fitness assessment, sports skill assessment, fitness reports, PE department reporting',
      canonicalPath: '/physical-education-assessment'
    },
    planner: {
      title: 'Smart PE India | PE Lesson Planner (CBSE & ICSE)',
      description: 'Generate comprehensive PE lesson plans with age-appropriate warm-ups, skill drills, safety measures, and equipment checklists in seconds.',
      keywords: 'AI Lesson Planner, Physical Education Lesson Plan, CBSE PE Plan, ICSE Physical Education, smartpeindia',
      canonicalPath: '/#lesson-planner'
    },
    yearly: {
      title: 'Smart PE India | Yearly PE Curriculum & 40-Week Syllabus Planner',
      description: 'Auto-map 40 weeks of physical education curriculum for CBSE and ICSE grades with Smart PE India.',
      keywords: 'Yearly PE Plan, Physical Education Syllabus, Sports Curriculum, CBSE PE Planning',
      canonicalPath: '/#yearly-planner'
    },
    'weekly-planner': {
      title: 'Smart PE India | Academic Weekly PE Planner & Homework Splitter',
      description: 'Plan weekly physical education theory and practical sessions with 1-click homework assignment generators.',
      keywords: 'Weekly PE Planner, PE Homework Generator, Academic Sports Schedule',
      canonicalPath: '/#weekly-planner'
    },
    'workload-planner': {
      title: 'Smart PE India | Department Workload & Timetable Planner',
      description: 'Manage PE teacher period allocations, OCR timetable scanning, and curriculum workloads across school departments.',
      keywords: 'PE Workload Planner, Teacher Timetable OCR, Sports Department Management',
      canonicalPath: '/#workload-planner'
    },
    skillmastery: {
      title: 'Smart PE India | Skill Progressions & Rubrics Hub',
      description: 'Grade-level sports skill progressions, assessment rubrics, and fundamental movement skills tracking.',
      keywords: 'PE Skill Progressions, Assessment Rubrics, Fundamental Movement Skills',
      canonicalPath: '/#skill-progressions'
    },
    theory: {
      title: 'Smart PE India | Theory Master & CBSE Physical Education Study Hub',
      description: 'Complete physical education theory curriculum, study guides, diagrams, and worksheets for Class 9, 10, 11, and 12.',
      keywords: 'CBSE Physical Education Theory, Class 11 PE, Class 12 PE, Sports Science Notes',
      canonicalPath: '/#theory'
    },
    fitness: {
      title: 'Smart PE India | Khelo India Fitness Assessment & Score Calculator',
      description: 'Standardized Khelo India battery tests, BMI calculation, cardiorespiratory endurance, agility, and motor fitness assessment with instant ratings.',
      keywords: 'Khelo India Fitness Test, BMI Calculator, PE Fitness Assessment, Student Fitness Card, SAI Fitness',
      canonicalPath: '/#fitness-tests'
    },
    khelo: {
      title: 'Smart PE India | Khelo India Battery Test Portal & Fitness Cards',
      description: 'Official Khelo India PE battery test engine. Generate official fitness report cards and track student physical literacy standards.',
      keywords: 'Khelo India Battery Test, Fitness Report Card, Ministry of Sports PE, SAI Protocol',
      canonicalPath: '/#khelo-india'
    },
    'tournament-fixtures': {
      title: 'Smart PE India | Tournament Fixtures & Bracket Generator',
      description: 'Generate single knockout, double elimination, and round-robin tournament fixtures with automatic seedings and bye allocations.',
      keywords: 'Tournament Fixture Maker, Knockout Brackets, Sports League Schedule, Intramural Fixtures',
      canonicalPath: '/#tournament-fixtures'
    },
    testpaper: {
      title: 'Smart PE India | PE Question Paper & MCQ Generator',
      description: 'Create CBSE and ICSE physical education exam papers, MCQs, short answers, and answer keys with marking schemes.',
      keywords: 'PE Question Paper Generator, Physical Education Exam Maker, CBSE PE Test Paper',
      canonicalPath: '/#testpaper'
    },
    'skill-analysis': {
      title: 'Smart PE India | AI Sports Skill & Technique Analysis Lab',
      description: 'Compare athlete mechanics, track biomechanics cues, and analyze technique breakdowns for athletics, cricket, basketball, and football.',
      keywords: 'AI Skill Analysis, Sports Technique Analyzer, Biomechanics PE Coach',
      canonicalPath: '/#skill-analysis'
    },
    rules: {
      title: 'Smart PE India | Sports Rules & Regulations AI Assistant',
      description: 'Instant answers for official sports court dimensions, referee signals, foul classifications, and rulebook queries.',
      keywords: 'Sports Rules Bot, Court Dimensions, Referee Handbook, Game Regulations',
      canonicalPath: '/#rules'
    },
    'principal-dashboard': {
      title: 'Smart PE India | Principal & Sports Inspection Dashboard',
      description: 'Inspection-ready school sports reports, physical literacy metrics, department workloads, and student wellness analytics for leadership.',
      keywords: 'Principal Dashboard, School Sports Analytics, PE Inspection Report',
      canonicalPath: '/#principal-dashboard'
    },
    'department-office': {
      title: 'Smart PE India | PE Department Office & Equipment Log',
      description: 'Manage physical education sports inventory, equipment checkouts, substitute teacher coverage, and house points ledgers.',
      keywords: 'PE Department Office, Sports Equipment Inventory, Substitute PE Plan, House System',
      canonicalPath: '/#department-office'
    },
    parentletters: {
      title: 'Smart PE India | Sports Parent Letters & Permission Slips',
      description: 'Generate formal, bilingual parent communications for sports days, fitness assessments, and inter-school tournaments.',
      keywords: 'PE Parent Letters, Sports Day Permission Slip, School Fitness Circular',
      canonicalPath: '/#parentletters'
    },
    widgets: {
      title: 'Smart PE India | PE Classroom Timers, Whistles & Field Widgets',
      description: 'Interactive sports countdown timers, interval training buzzers, digital scoreboards, and field widgets for PE educators.',
      keywords: 'PE Classroom Widgets, Sports Interval Timer, Digital Scoreboard, PE Tools',
      canonicalPath: '/#widgets'
    },
    compliance: {
      title: 'Smart PE India | CBSE & NEP 2020 Sports Compliance Advisor',
      description: 'Ensure school physical education curriculum aligns with National Education Policy (NEP 2020) and CBSE health mandates.',
      keywords: 'NEP 2020 PE Compliance, CBSE Health and Physical Education Guidelines',
      canonicalPath: '/#compliance'
    },
    tools: {
      title: 'Smart PE India | AI Tool Center & Teacher Utilities',
      description: 'All-in-one AI assistant suite for physical education lesson prompts, rubric makers, warm-up generators, and fitness converters.',
      keywords: 'AI PE Tools, Physical Education Utilities, Sports Teacher AI',
      canonicalPath: '/#tools'
    },
    'school-students': {
      title: 'Smart PE India | Student Directory & Fitness Rosters',
      description: 'Manage school student profiles, grade rosters, medical flags, and historical fitness test performance.',
      keywords: 'Student PE Directory, School Fitness Roster, Physical Education Records',
      canonicalPath: '/#students'
    },
    'school-results': {
      title: 'Smart PE India | School Fitness Database & Live Analytics',
      description: 'Real-time school fitness analytics, class-wise distribution graphs, and performance metrics across academic terms.',
      keywords: 'School Fitness Database, PE Analytics, Class Fitness Comparison',
      canonicalPath: '/#school-results'
    },
    'school-teams': {
      title: 'Smart PE India | School Sports Teams & House Squads',
      description: 'Organize school athletic squads, intramural house teams, captain rosters, and training attendance.',
      keywords: 'School Sports Teams, House Squads, Athletic Roster Management',
      canonicalPath: '/#teams'
    },
    'fitness-reports': {
      title: 'Smart PE India | Student Fitness Report Cards & Printouts',
      description: 'Generate and print colorful, comprehensive student physical literacy and Khelo India progress report cards.',
      keywords: 'Student Fitness Report Card, Physical Literacy Card, PE Progress Report',
      canonicalPath: '/#fitness-reports'
    },
    'school-admin': {
      title: 'Smart PE India | School PE Settings & SEO Control Center',
      description: 'Manage physical education team staff access, master timetable OCR ingestion, and search engine optimization settings for smartpeindia.app.',
      keywords: 'School Admin, PE Timetable OCR, School Fitness Management, SEO Controls',
      canonicalPath: '/#school-admin'
    },
    'subscription-plans': {
      title: 'Smart PE India | Pricing Plans & 1-Year Free Pass',
      description: 'Explore 1-Year Free Passes and school subscription plans for physical education teachers and sports departments.',
      keywords: 'Smart PE India Pricing, PE Software Plans, Free PE Tools India',
      canonicalPath: '/#pricing'
    },
    'brand-welcome': {
      title: 'Smart PE India | Educator Brand Hub & Welcome Center',
      description: 'Welcome guide, platform overview, video walkthroughs, and setup guides for physical educators joining Smart PE India.',
      keywords: 'Smart PE India Welcome, PE Platform Tour, Teacher Onboarding',
      canonicalPath: '/#welcome'
    },
    'about': {
      title: 'Smart PE India | About Platform & Founder L. Samy',
      description: 'Discover the story behind Smart PE India and founder Lurtha Samy (L. Samy), empowering physical educators across India.',
      keywords: 'About Smart PE India, L Samy PE, Physical Education Mission India',
      canonicalPath: '/#about'
    },
    'contact': {
      title: 'Smart PE India | Contact Support & School Inquiries',
      description: 'Get in touch with the Smart PE India team for technical support, school implementations, and feature suggestions.',
      keywords: 'Contact Smart PE India, PE Support, School Partnership',
      canonicalPath: '/#contact'
    }
  }
};

const SEO_LOCAL_STORAGE_KEY = 'smartpe_seo_config_v1';

export async function loadSEOConfig(schoolId?: string): Promise<SEOConfig> {
  try {
    // Try local storage cache first for instant load
    const cached = localStorage.getItem(SEO_LOCAL_STORAGE_KEY);
    let initialConfig: SEOConfig = cached ? JSON.parse(cached) : DEFAULT_SEO_CONFIG;

    if (schoolId) {
      const snap = await getDoc(doc(db, 'seo_configs', schoolId));
      if (snap.exists()) {
        const remoteData = snap.data() as Partial<SEOConfig>;
        initialConfig = {
          ...DEFAULT_SEO_CONFIG,
          ...remoteData,
          routeOverrides: {
            ...DEFAULT_SEO_CONFIG.routeOverrides,
            ...(remoteData.routeOverrides || {})
          }
        };
        localStorage.setItem(SEO_LOCAL_STORAGE_KEY, JSON.stringify(initialConfig));
      }
    }
    return initialConfig;
  } catch (err) {
    console.warn("Error loading SEO config, returning default:", err);
    return DEFAULT_SEO_CONFIG;
  }
}

export async function saveSEOConfig(schoolId: string, config: SEOConfig): Promise<void> {
  // Always prioritize canonical URL to smartpeindia.app if left empty
  const sanitizedConfig: SEOConfig = {
    ...config,
    canonicalUrl: config.canonicalUrl?.trim() || 'https://smartpeindia.app/'
  };

  localStorage.setItem(SEO_LOCAL_STORAGE_KEY, JSON.stringify(sanitizedConfig));

  if (schoolId) {
    await setDoc(doc(db, 'seo_configs', schoolId), sanitizedConfig);
  }

  // Dispatch custom event to notify React components to update head dynamically
  window.dispatchEvent(new CustomEvent('seo_config_updated', { detail: sanitizedConfig }));
}
