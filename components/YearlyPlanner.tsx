import React, { useState, useRef, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  Sparkles, 
  ChevronRight, 
  ChevronLeft, 
  Save, 
  Download, 
  AlertTriangle,
  CheckCircle2,
  FileText,
  Loader2,
  CalendarDays,
  FileJson,
  AlertCircle,
  FileSpreadsheet,
  FileType,
  RotateCcw,
  Languages,
  BookOpen,
  Award,
  ShieldCheck,
  Dumbbell,
  GraduationCap,
  Trophy,
  Target,
  Presentation,
  Eye,
  Flame,
  Layers
} from 'lucide-react';
import { BoardType, YearlyPlan, Language, LessonPlan } from '../types.ts';
import { generateYearlyPlan, generateLessonPlan, buildComprehensiveYearlyPlanFallback } from '../services/geminiService.ts';
import { exportToPdf, exportToWord, exportYearlyPlanToIcs } from '../lib/exportUtils.ts';

declare var html2pdf: any;

const SAMPLE_CALENDAR_TEXT = `01.04.2026 Commencement
15.08.2026 Independence Day
02.10.2026 Gandhi Jayanti
14.10.2026 Pooja Holidays
24.12.2026 Christmas Holidays`;

interface YearlyPlannerProps {
  onNavigate?: (tab: any) => void;
}

const YearlyPlanner: React.FC<YearlyPlannerProps> = ({ onNavigate }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  
  const [grade, setGrade] = useState('12');
  const [board, setBoard] = useState<BoardType>(BoardType.CBSE);
  const [frequency, setFrequency] = useState('2');
  const [duration, setDuration] = useState('40 min');
  const [startDate, setStartDate] = useState('2026-04-01');
  const [language, setLanguage] = useState<Language>('English');
  const [calendarText, setCalendarText] = useState(SAMPLE_CALENDAR_TEXT);
  const [planTrack, setPlanTrack] = useState<'integrated' | 'theory' | 'practical'>('integrated');
  const [term1Game, setTerm1Game] = useState('Football & Athletics Track');
  const [term2Game, setTerm2Game] = useState('Basketball & Volleyball');
  const [term1Focus, setTerm1Focus] = useState('CBSE Units 1-5: Management of Sporting Events, Children & Women in Sports, Lifestyle Disease Yoga, CWSN, Sports & Nutrition + Term 1 Fitness Tests');
  const [term2Focus, setTerm2Focus] = useState('CBSE Units 6-10: Test & Measurement, Physiology & Injuries, Biomechanics, Psychology, Training in Sports + Board Practical File & Revision');
  const [viewMode, setViewMode] = useState<'integrated' | 'theory' | 'games'>('integrated');
  const [modalLessonType, setModalLessonType] = useState<'theory' | 'games'>('theory');
  
  const [plan, setPlan] = useState<YearlyPlan | null>(null);

  const applyCbsesyllabusDefaults = (selectedGrade: string, track: 'integrated' | 'theory' | 'practical') => {
    const cleanGrade = (selectedGrade || '12').trim().toLowerCase();
    if (cleanGrade.includes('12') || cleanGrade.includes('xii')) {
      setTerm1Game('Football & Athletics Track');
      setTerm2Game('Basketball & Volleyball');
      if (track === 'practical') {
        setTerm1Focus('Basketball & Football Advanced Match Tactics + SAI Khelo India Fitness Battery');
        setTerm2Focus('Volleyball / Badminton Match Proficiency + 30-Mark CBSE Practical Assessment File & Viva');
      } else {
        setTerm1Focus('CBSE Units 1-5: Management of Sporting Events, Children & Women, Lifestyle Disease Yoga, CWSN, Sports & Nutrition + Fitness Tests');
        setTerm2Focus('CBSE Units 6-10: Test & Measurement, Physiology & Injuries, Biomechanics, Sports Psychology, Training in Sports + Board Practical File & Revision');
      }
    } else if (cleanGrade.includes('11') || cleanGrade.includes('xi')) {
      setTerm1Game('Athletics (Sprints & Relay)');
      setTerm2Game('Cricket & Basketball');
      if (track === 'practical') {
        setTerm1Focus('Athletics (Sprints & Relay) + SAI Khelo India Fitness Battery');
        setTerm2Focus('Team Games (Cricket / Basketball) + Practical Assessment Records');
      } else {
        setTerm1Focus('CBSE Units 1-5: Changing Trends & Career, Olympic Values, Yoga, CWSN, Physical Fitness & Wellness + Khelo India Battery');
        setTerm2Focus('CBSE Units 6-10: Test & Measurement, Anatomy & Physiology, Biomechanics, Psychology, Training & Doping + Practical Assessment & Revision');
      }
    } else if (cleanGrade.includes('9') || cleanGrade.includes('10')) {
      setTerm1Game('Football & Kho-Kho');
      setTerm2Game('Badminton & Table Tennis');
      setTerm1Focus('CBSE HPE Strand 1 (Team Sports & Athletics) & Strand 2 (Health, Postural Deformities & Balanced Diet)');
      setTerm2Focus('CBSE HPE Strand 2 (First Aid & Injury Protocols) & Strand 3 & 4 (SEWA Community Action, Yoga & Health Card)');
    } else {
      setTerm1Game('Fundamental Agility & Tag Games');
      setTerm2Game('Team Sports Fundamentals (Football, Kho-Kho)');
      setTerm1Focus('Locomotor & Manipulative Agility, Fundamental Motor Skills & Khelo India Fitness Battery');
      setTerm2Focus('Team Sports Fundamentals (Football, Basketball, Kho-Kho) & Cooperative Games');
    }
  };

  useEffect(() => {
    const savedPlan = localStorage.getItem('peYearlyPlan');
    if (savedPlan) {
      try {
        const parsed = JSON.parse(savedPlan);
        if (parsed && Array.isArray(parsed.terms) && parsed.terms.length > 0 && parsed.terms.some((t: any) => Array.isArray(t.months) && t.months.length > 0)) {
          setPlan(parsed);
          setStep(4);
        } else {
          // If saved plan is empty or corrupted (e.g. image_f995d5fd.png scenario), auto-populate with the complete 48-week plan!
          const fallback = buildComprehensiveYearlyPlanFallback(grade || '12', board, duration, term1Focus, term2Focus, planTrack, term1Game, term2Game);
          setPlan(fallback);
          localStorage.setItem('peYearlyPlan', JSON.stringify(fallback));
          setStep(4);
        }
      } catch (e) {
        console.error("Failed to load saved yearly plan", e);
      }
    }
  }, []);

  // Curriculum integration & sync states
  const [selectedWeekForLesson, setSelectedWeekForLesson] = useState<{
    termIdx: number;
    monthIdx: number;
    weekIdx: number;
    week: any;
  } | null>(null);
  const [generatingLessonIdx, setGeneratingLessonIdx] = useState<string | null>(null);
  const [weekLessons, setWeekLessons] = useState<Record<string, LessonPlan>>({});
  const [lessonGeneratingError, setLessonGeneratingError] = useState<string | null>(null);

  const getSportFromWeek = (topicText: string, termFocus: string) => {
    if (!topicText) return termFocus;
    const lowerTopic = topicText.toLowerCase();
    const games = ['football', 'basketball', 'volleyball', 'cricket', 'athletics', 'yoga', 'badminton', 'kabaddi', 'kho kho', 'tennis'];
    for (const game of games) {
      if (lowerTopic.includes(game)) {
        return game.charAt(0).toUpperCase() + game.slice(1);
      }
    }
    return termFocus || 'General Fitness';
  };

  const getCurriculumPlanLocal = (
    topic: string, 
    details: string, 
    termFocus: string, 
    currentGrade: string,
    forcedMode?: 'theory' | 'games',
    sportOverride?: string
  ) => {
    const t = (topic || '').toLowerCase();
    const f = (sportOverride || termFocus || '').toLowerCase();
    
    // --- CBSE THEORY UNITS DETECTORS ---
    if (forcedMode !== 'games') {
      if (t.includes('event') || t.includes('fixture') || t.includes('tournament') || t.includes('committee') || t.includes('management') || t.includes('intramural') || t.includes('extramural')) {
      const starter = { time: '10 min', title: 'Concept Starter & Real-World Hook', description: 'Discussion on IPL / Olympic organizing committees (Technical, Ground, Reception, Publicity, Logistics) and pre/during/post-event duties.' };
      const demonstration = { time: '10 min', title: 'Teacher Concept Breakdown & Formula Demonstration', description: 'Step-by-step mathematical demonstration: calculating total matches (N-1), upper/lower half division ((N+1)/2, (N-1)/2), and next power of 2 bye allocation formula (2ⁿ - N).' };
      const activity1 = { time: '15 min', title: 'Activity 1: Guided Fixture Construction Drills', description: 'Students draw full knockout tournament fixtures for 11, 13, 19, and 21 teams with exact bye allocation rules (1st bye bottom of lower half, 2nd bye top of upper half, etc.).' };
      const activity2 = { time: '10 min', title: 'Activity 2: CBSE Board Exam PYQ & Case Studies', description: 'Solve 2 CBSE past-year 3-mark case studies on committee responsibilities and 2 numerical MCQs on cyclic/staircase league fixtures.' };
      const plenary = { time: '10 min', title: 'Plenary & Mind Map Review', description: 'Interactive recap of bye formula rules, common calculation pitfalls, and review of practice homework questions.' };
      return {
        isTheory: true,
        sport: 'CBSE PE Unit 1: Management of Sporting Events',
        objectives: `Understand planning, organizing, staffing, directing, and controlling; master drawing Knockout & League tournament fixtures with exact bye formulas ((N+1)/2, next power of 2 minus N) for Class ${currentGrade} CBSE exams.`,
        starter,
        demonstration,
        activity1,
        activity2,
        plenary,
        warmup: `${starter.time} ${starter.title}: ${starter.description}`,
        mainDrill: `${demonstration.title} & ${activity1.title}: ${demonstration.description} | ${activity1.description}`,
        cooldown: `${plenary.time} ${plenary.title}: ${plenary.description}`,
        assessment: `CBSE Marking Rubric: Fixture diagram accuracy, correct bye placement (lower half bottom, upper half top, etc.), and committee duties recall.`,
        equipment: `Smartboard / Whiteboard, CBSE NCERT PE Textbook, Graph/Chart papers, geometry ruler.`,
        safety: `Ensure students follow structured step-by-step drawing protocols to avoid mathematical fixture calculation errors.`
      };
    }

    if (t.includes('women') || t.includes('child') || t.includes('postur') || t.includes('deform') || t.includes('flat foot') || t.includes('knock knee') || t.includes('lordosis') || t.includes('kyphosis') || t.includes('scoliosis') || t.includes('female athlete')) {
      const starter = { time: '10 min', title: 'Diagnostic Plumb-Line Hook', description: 'Visual posture alignment assessment against plumb lines; observe spine curvature and arch of the foot.' };
      const demonstration = { time: '10 min', title: 'Teacher Concept Breakdown & Deformity Diagnostics', description: 'Biomechanical causes and symptoms of Kyphosis, Lordosis, Scoliosis, Knock Knees, Bow Legs, Flat Foot, and the Female Athlete Triad (Osteoporosis, Amenorrhea, Eating Disorders).' };
      const activity1 = { time: '15 min', title: 'Activity 1: Corrective Exercise Practice & Analysis', description: 'Practice and prescribe corrective yoga/physiotherapy movements (Tadasana for Flat Foot, Gomukhasana for Round Shoulders, Chakrasana for Kyphosis, Padmasana for Knock Knees).' };
      const activity2 = { time: '10 min', title: 'Activity 2: CBSE Board Exam PYQs & Case Studies', description: 'Analyze 5-mark case studies on female athlete triad risk factors and WHO physical activity guidelines for children.' };
      const plenary = { time: '10 min', title: 'Plenary & Mind Map Review', description: 'Summary table of postural deformity vs corrective protocols and 3 quick board assertion-reason questions.' };
      return {
        isTheory: true,
        sport: 'CBSE PE Unit 2: Children and Women in Sports',
        objectives: `Examine WHO exercise recommendations; diagnose common postural deformities (Kyphosis, Lordosis, Scoliosis, Knock Knees, Flat Foot) and analyze the Female Athlete Triad (Osteoporosis, Amenorrhea, Eating Disorders) for Class ${currentGrade}.`,
        starter,
        demonstration,
        activity1,
        activity2,
        plenary,
        warmup: `${starter.time} ${starter.title}: ${starter.description}`,
        mainDrill: `${demonstration.title} & ${activity1.title}: ${demonstration.description} | ${activity1.description}`,
        cooldown: `${plenary.time} ${plenary.title}: ${plenary.description}`,
        assessment: `Diagnostic evaluation: Accurately matching postural deformities with root causes and corrective exercise protocols.`,
        equipment: `Yoga mats, posture grids, NCERT diagrams, demonstration charts.`,
        safety: `Perform corrective spinal extensions gently; avoid forceful hyperextensions on students with existing spinal discomfort.`
      };
    }

    if (t.includes('lifestyle') || t.includes('obesity') || t.includes('diabetes') || t.includes('asthma') || t.includes('hypertension') || t.includes('back pain') || (t.includes('yoga') && (t.includes('disease') || t.includes('prevent')))) {
      const starter = { time: '10 min', title: 'Pranayama & Joint Mobilization Hook', description: 'Sukshma Vyayama, neck rotations, wrist extensions, and gentle diaphragmatic Anulom-Vilom breathing.' };
      const demonstration = { time: '10 min', title: 'Teacher Asana Demonstration & Pathology Lecture', description: 'Diagnostic justification, benefits, and strict contraindications for Obesity (Tadasana, Katichakrasana), Diabetes (Bhujangasana, Paschimottanasana), and Hypertension.' };
      const activity1 = { time: '15 min', title: 'Activity 1: Therapeutic Asana Execution Lab', description: 'Students practice alignment holds for Asthma (Sukhasana, Matsyasana), Hypertension (Tadasana, Vakrasana), and Back Pain (Shalabhasana, Bhujangasana).' };
      const activity2 = { time: '10 min', title: 'Activity 2: Contraindications & CBSE Case Questions', description: 'Match pathologies with prohibited asanas (e.g. why hypertensive individuals avoid inversions and Kapalabhati); solve 3-mark therapeutic prescription questions.' };
      const plenary = { time: '10 min', title: 'Plenary Shavasana & Review', description: 'Shavasana neuromuscular relaxation, physiological recovery check, and summary of exam contraindication keywords.' };
      return {
        isTheory: true,
        sport: 'CBSE PE Unit 3: Yoga as Preventive Measure for Lifestyle Diseases',
        objectives: `Master therapeutic yoga asanas for 5 lifestyle disorders (Obesity, Diabetes, Asthma, Hypertension, Back Pain/Arthritis) including procedures, benefits, and contraindications.`,
        starter,
        demonstration,
        activity1,
        activity2,
        plenary,
        warmup: `${starter.time} ${starter.title}: ${starter.description}`,
        mainDrill: `${demonstration.title} & ${activity1.title}: ${demonstration.description} | ${activity1.description}`,
        cooldown: `${plenary.time} ${plenary.title}: ${plenary.description}`,
        assessment: `Asana Rubric & Board Test: Flawless posture hold, correct breathing rhythm, and reciting contraindications for each condition.`,
        equipment: `Non-slip yoga mats, bolster cushions, textbook asana charts.`,
        safety: `Hypertensive students must NOT perform head-lowering inverted asanas or strenuous breath retentions (Kumbhaka).`
      };
    }

    if (t.includes('cwsn') || t.includes('divyang') || t.includes('special olympic') || t.includes('paralympic') || t.includes('deaflympic') || t.includes('adaptive')) {
      const starter = { time: '10 min', title: 'Sensory Inclusion Empathy Hook', description: 'Blindfolded partner walk or seated balloon tapping to experience sensory and mobility adaptation.' };
      const demonstration = { time: '10 min', title: 'Teacher Adaptive Principles & TREE Framework', description: 'Instruction on the TREE model (Teaching style, Rules, Equipment, Environment) and professional roles (Physiotherapist, Occupational Therapist, Speech Therapist, Counselor) in IEP.' };
      const activity1 = { time: '15 min', title: 'Activity 1: Disability Sports Comparative Analysis', description: 'Comparative deep-dive: Special Olympics Bharat (intellectual disabilities, divisioning), Paralympics (functional classification), and Deaflympics.' };
      const activity2 = { time: '10 min', title: 'Activity 2: Inclusive Sports Day Design Challenge', description: 'Students formulate inclusive modifications for a school sports event; solve 2 CBSE past-year 3-mark questions on IEP implementation.' };
      const plenary = { time: '10 min', title: 'Plenary & Mind Map Review', description: 'Debrief on person-first terminology, Paralympic values, and key takeaways for school accessibility.' };
      return {
        isTheory: true,
        sport: 'CBSE PE Unit 4: PE & Sports for CWSN (Children with Special Needs)',
        objectives: `Understand adaptive physical education aims, roles of professionals (Counselor, Occupational Therapist, Physiotherapist, PE Teacher, Speech Therapist), and global disability sports organizations.`,
        starter,
        demonstration,
        activity1,
        activity2,
        plenary,
        warmup: `${starter.time} ${starter.title}: ${starter.description}`,
        mainDrill: `${demonstration.title} & ${activity1.title}: ${demonstration.description} | ${activity1.description}`,
        cooldown: `${plenary.time} ${plenary.title}: ${plenary.description}`,
        assessment: `Knowledge Verification: Differentiating Special Olympics vs Paralympics; articulating professional roles in IEP (Individualized Education Plan).`,
        equipment: `Bell-balls, blindfolds, wheelchair/seated equipment, inclusion guideline charts.`,
        safety: `Maintain clear, obstruction-free floor space and clear communication cues for all adaptive drills.`
      };
    }

    if (t.includes('nutrition') || t.includes('diet') || t.includes('nutrient') || t.includes('macro') || t.includes('micro') || t.includes('food myth') || t.includes('weight control')) {
      const starter = { time: '10 min', title: 'Nutrition Log & BMI Computation Hook', description: 'Calculate individual BMI = Weight (kg) / Height (m)², map to WHO categories, and discuss basal metabolic rate.' };
      const demonstration = { time: '10 min', title: 'Teacher Macronutrient & Micronutrient Breakdown', description: 'Nutritive vs non-nutritive components (Water, Roughage, Flavor); Macro (Carbs, Proteins, Fats) vs Micro (Vitamins, Minerals); Food intolerances vs food allergies.' };
      const activity1 = { time: '15 min', title: 'Activity 1: Athlete Diet Design & Caloric Balance', description: 'Students construct a balanced 2400-calorie athlete meal plan balancing macronutrient ratios (60% Carbs, 15% Protein, 25% Fat) and hydration schedule.' };
      const activity2 = { time: '10 min', title: 'Activity 2: Food Myths & CBSE Board Case Questions', description: 'Debunking crash dieting pitfalls; solve 2 CBSE 3-mark questions on water-soluble (B, C) vs fat-soluble (A, D, E, K) vitamin deficiency symptoms.' };
      const plenary = { time: '10 min', title: 'Plenary & Mind Map Review', description: 'Flashcard recap on deficiency diseases (Scurvy, Rickets, Beriberi, Anemia) and daily hydration benchmarks.' };
      return {
        isTheory: true,
        sport: 'CBSE PE Unit 5: Sports and Nutrition',
        objectives: `Analyze components of a balanced diet, differentiate macro (Carbs, Fats, Proteins) vs micro (Vitamins, Minerals) nutrients, calculate BMI, and debunk dieting pitfalls and food myths for Class ${currentGrade}.`,
        starter,
        demonstration,
        activity1,
        activity2,
        plenary,
        warmup: `${starter.time} ${starter.title}: ${starter.description}`,
        mainDrill: `${demonstration.title} & ${activity1.title}: ${demonstration.description} | ${activity1.description}`,
        cooldown: `${plenary.time} ${plenary.title}: ${plenary.description}`,
        assessment: `Problem-Solving Rubric: Designing a balanced athlete meal plan and identifying vitamin/mineral deficiencies.`,
        equipment: `Stadiometer, weighing scale, nutrient flashcards, NCERT nutrition tables.`,
        safety: `Discourage unscientific calorie-restriction habits and emphasize wholesome hydration and balanced nourishment.`
      };
    }

    if (t.includes('test') || t.includes('measurement') || t.includes('evaluation') || t.includes('khelo india') || t.includes('barrow') || t.includes('harvard') || t.includes('rikli') || t.includes('fitness battery')) {
      const starter = { time: '10 min', title: 'Heart Rate & Metric Check Hook', description: 'Learn radial/carotid pulse measurement for 15 seconds; compute resting heart rate and discuss recovery pulse.' };
      const demonstration = { time: '10 min', title: 'Teacher Test Protocol & Formula Calibration', description: 'Protocols and calibration for SAI Khelo India battery and Harvard Step Test: Fitness Index = (100 × duration in sec) / (2 × sum of recovery pulses).' };
      const activity1 = { time: '15 min', title: 'Activity 1: Field Testing & Fitness Index Computation', description: 'Administer Harvard Step Test (5-min step up/down on 20-inch bench); log recovery pulses at 1-1.5m, 2-2.5m, 3-3.5m and compute Fitness Index.' };
      const activity2 = { time: '10 min', title: 'Activity 2: Motor Ability & Senior Citizen Batteries', description: 'Solve CBSE 3-mark questions comparing Barrow 3-item motor ability test vs Rikli & Jones senior citizen test protocols.' };
      const plenary = { time: '10 min', title: 'Plenary & Score Norms Mapping', description: 'Map student Fitness Index scores to CBSE national percentiles; review test objectivity, reliability, and validity.' };
      return {
        isTheory: true,
        sport: 'CBSE PE Unit 6: Test and Measurement in Sports',
        objectives: `Conduct SAI Khelo India National Fitness Test battery; compute Fitness Index via Harvard Step Test; administer Barrow 3-item motor ability and Rikli & Jones senior citizen tests.`,
        starter,
        demonstration,
        activity1,
        activity2,
        plenary,
        warmup: `${starter.time} ${starter.title}: ${starter.description}`,
        mainDrill: `${demonstration.title} & ${activity1.title}: ${demonstration.description} | ${activity1.description}`,
        cooldown: `${plenary.time} ${plenary.title}: ${plenary.description}`,
        assessment: `Standard Protocol Adherence: Metronome cadence precision (30 steps/min), stopwatch timing, and formula calculation accuracy.`,
        equipment: `20-inch sturdy stepping bench / gymnasium box, metronome/audio cadence, stopwatches, heart rate logs.`,
        safety: `Stop immediately if student exhibits extreme dizziness, hyperventilation, or chest discomfort during aerobic trials.`
      };
    }

    if (t.includes('injury') || t.includes('injuries') || t.includes('physiology') || t.includes('first aid') || t.includes('price') || t.includes('fracture') || t.includes('sprain') || t.includes('strain') || t.includes('cardiorespiratory')) {
      const starter = { time: '10 min', title: 'Physiological Observation Hook', description: 'Compare resting heart rate vs post-1 minute jumping jack heart rate to observe stroke volume and cardiorespiratory response.' };
      const demonstration = { time: '10 min', title: 'Teacher Injury Classification & PRICE Demonstration', description: 'Categorize Soft tissue (Contusion, Abrasion, Laceration, Sprain vs Strain), Bone fractures (Greenstick, Comminuted), Joint dislocations; hands-on PRICE protocol.' };
      const activity1 = { time: '15 min', title: 'Activity 1: Hands-on Compression & First Aid Lab', description: 'Practice wrapping ankle and wrist joints with crepe compression bandages; position arm slings and review cold compress safety rules.' };
      const activity2 = { time: '10 min', title: 'Activity 2: CBSE Board Exam PYQs & Case Studies', description: 'Differentiate ligament sprain vs tendon strain; solve 2 CBSE past-year 3-mark scenario-based emergency sports first aid questions.' };
      const plenary = { time: '10 min', title: 'Plenary & First Aid Protocol Review', description: 'Recap 4-step on-field emergency triage: Protect, Rest, Ice, Compress, Elevate; emergency medical dispatch guidelines.' };
      return {
        isTheory: true,
        sport: 'CBSE PE Unit 7: Physiology & Injuries in Sports',
        objectives: `Understand physiological factors determining physical fitness components; categorize sports injuries (Soft tissue, Bone, Joint) and demonstrate the PRICE first aid protocol for Class ${currentGrade}.`,
        starter,
        demonstration,
        activity1,
        activity2,
        plenary,
        warmup: `${starter.time} ${starter.title}: ${starter.description}`,
        mainDrill: `${demonstration.title} & ${activity1.title}: ${demonstration.description} | ${activity1.description}`,
        cooldown: `${plenary.time} ${plenary.title}: ${plenary.description}`,
        assessment: `First Aid Mastery Rubric: Correct crepe bandage compression pressure, ice pack application duration (15-20 mins), and differentiation between ligament sprain vs muscle strain.`,
        equipment: `First aid medical kit, ice packs/gel wraps, crepe bandages, triangular slings, injury illustration cards.`,
        safety: `Never apply direct ice directly onto bare skin; always wrap ice in a thin towel to prevent cold burn/frostbite.`
      };
    }

    if (t.includes('biomechanic') || t.includes('lever') || t.includes('newton') || t.includes('equilibrium') || t.includes('friction') || t.includes('projectile')) {
      const starter = { time: '10 min', title: 'Physics-in-Motion Hook', description: 'Sprint starts and jump stops demonstrating Newton\'s laws (inertia, action-reaction) and wide-base stability.' };
      const demonstration = { time: '10 min', title: 'Teacher Biomechanics & Anatomical Levers Lecture', description: 'Newton\'s 3 Laws in sports; Anatomical Levers: Class 1 (Fulcrum in middle - neck extension), Class 2 (Load in middle - calf raise), Class 3 (Effort in middle - bicep curl); projectile trajectory factors.' };
      const activity1 = { time: '15 min', title: 'Activity 1: Anatomical Lever & Movement Lab', description: 'Students diagram body joints during sports actions (kicking football, javelin release, high jump approach) and identify fulcrum, effort, and load.' };
      const activity2 = { time: '10 min', title: 'Activity 2: Projectile Motion & CBSE Board Questions', description: 'Solve 3 CBSE board assertion-reason questions on optimum release angles (45° vacuum vs ~35°-38° aerodynamic drag) and dynamic equilibrium.' };
      const plenary = { time: '10 min', title: 'Plenary & Mind Map Review', description: 'Recap mechanical advantage formulas (Effort Arm / Load Arm) and key projectile motion formulas for CBSE exam.' };
      return {
        isTheory: true,
        sport: 'CBSE PE Unit 8: Biomechanics and Sports',
        objectives: `Apply Newton's 3 Laws of Motion to sports; classify 1st, 2nd, and 3rd Class anatomical levers (Fulcrum, Effort, Load); analyze Centre of Gravity, Equilibrium, and Projectile Motion.`,
        starter,
        demonstration,
        activity1,
        activity2,
        plenary,
        warmup: `${starter.time} ${starter.title}: ${starter.description}`,
        mainDrill: `${demonstration.title} & ${activity1.title}: ${demonstration.description} | ${activity1.description}`,
        cooldown: `${plenary.time} ${plenary.title}: ${plenary.description}`,
        assessment: `Physics Concept Application: Accurately identifying fulcrum, load, and effort points in body joints during sports movements.`,
        equipment: `Medicine balls, javelins/footballs for launch observation, skeleton anatomical lever model, whiteboard.`,
        safety: `Use controlled weights for lever demonstrations to prevent excessive tendon strain at mechanical disadvantage.`
      };
    }

    if (t.includes('psycholog') || t.includes('personality') || t.includes('motivation') || t.includes('aggression') || t.includes('imagery') || t.includes('self-esteem')) {
      const starter = { time: '10 min', title: 'Mental Focus & Box-Breathing Hook', description: '3 minutes of box breathing (4s in, 4s hold, 4s out, 4s hold) and positive mental imagery for competitive focus.' };
      const demonstration = { time: '10 min', title: 'Teacher Psychological Profiling Lecture', description: 'Carl Jung classification (Introvert, Extrovert) & Big Five (OCEAN); Intrinsic vs Extrinsic motivation; Aggression in sports: Hostile vs Instrumental vs Assertive behavior.' };
      const activity1 = { time: '15 min', title: 'Activity 1: Athlete Behavioral Case Studies', description: 'Analyze competitive athletic scenarios to identify motivation techniques (goal setting, self-talk, reinforcement) and arousal regulation.' };
      const activity2 = { time: '10 min', title: 'Activity 2: CBSE Board Exam PYQs & Case Studies', description: 'Evaluate CBSE 5-mark case studies distinguishing between assertive play and foul aggression; exercise adherence barriers.' };
      const plenary = { time: '10 min', title: 'Plenary & Mind Map Review', description: 'Mind map summary of psychological traits and student self-reflection journal entries.' };
      return {
        isTheory: true,
        sport: 'CBSE PE Unit 9: Psychology and Sports',
        objectives: `Analyze personality dimensions (Carl Jung classification & Big Five traits), differentiate intrinsic vs extrinsic motivation, explore exercise adherence, and classify types of sports aggression.`,
        starter,
        demonstration,
        activity1,
        activity2,
        plenary,
        warmup: `${starter.time} ${starter.title}: ${starter.description}`,
        mainDrill: `${demonstration.title} & ${activity1.title}: ${demonstration.description} | ${activity1.description}`,
        cooldown: `${plenary.time} ${plenary.title}: ${plenary.description}`,
        assessment: `Analytical Rubric: Distinguishing between instrumental aggression and foul play; applying self-talk techniques to athletic performance.`,
        equipment: `Case study reflection worksheets, psychological trait checklists, timer.`,
        safety: `Foster an emotionally safe, non-judgmental classroom environment for personality and mental health discussions.`
      };
    }

    if (t.includes('training') || t.includes('doping') || t.includes('periodization') || t.includes('circuit') || t.includes('fartlek') || t.includes('interval') || t.includes('isometric') || t.includes('isotonic')) {
      const starter = { time: '10 min', title: 'Heart Rate Elevation & Circuit Hook', description: 'Progressive 4-station pulse-raising circuit (skipping, high knees, squat holds, lateral hops) with target training zone calculation.' };
      const demonstration = { time: '10 min', title: 'Teacher Periodization & Anti-Doping Lecture', description: 'Periodization (Micro, Meso, Macro cycles); Strength methods (Isometric, Isotonic, Isokinetic); Fartlek speed-play; WADA / NADA prohibited substances and anti-doping procedures.' };
      const activity1 = { time: '15 min', title: 'Activity 1: Circuit Training Design Lab', description: 'Students architect an age-appropriate 8-station circuit training routine with 1:1 work-to-rest ratio and calculate Karvonen target heart rate zones.' };
      const activity2 = { time: '10 min', title: 'Activity 2: Doping Hazards & CBSE Board Questions', description: 'Examine physical and psychological hazards of anabolic steroids; solve 2 CBSE past-year 3-mark questions on Fartlek vs Interval training.' };
      const plenary = { time: '10 min', title: 'Plenary & Fair Play Debrief', description: 'Circuit cool-down static stretches, hydration review, and key takeaways on clean sportsmanship and anti-doping codes.' };
      return {
        isTheory: true,
        sport: 'CBSE PE Unit 10: Training in Sports & Doping',
        objectives: `Structure training periodization cycles (Micro, Meso, Macro); compare strength training methods (Isometric, Isotonic, Isokinetic); design continuous, interval, and Fartlek endurance sessions; examine WADA/NADA anti-doping regulations.`,
        starter,
        demonstration,
        activity1,
        activity2,
        plenary,
        warmup: `${starter.time} ${starter.title}: ${starter.description}`,
        mainDrill: `${demonstration.title} & ${activity1.title}: ${demonstration.description} | ${activity1.description}`,
        cooldown: `${plenary.time} ${plenary.title}: ${plenary.description}`,
        assessment: `Training Architecture Rubric: Designing an age-appropriate 8-station circuit training routine with proper work-to-rest ratios.`,
        equipment: `Agility cones, medicine balls, skipping ropes, exercise mats, stopwatches, WADA guideline charts.`,
        safety: `Ensure strict work-to-rest intervals (1:1 or 1:2) to prevent overtraining syndrome and acute muscle exhaustion.`
      };
    }

    if (t.includes('olympic') || t.includes('ancient') || t.includes('ioa') || t.includes('values')) {
      const starter = { time: '10 min', title: 'Olympic Trivia Starter & Historical Hook', description: 'Quick recall of Pierre de Coubertin, 1896 Athens Games, and India\'s historic Olympic hockey & athletic medal legacy.' };
      const demonstration = { time: '10 min', title: 'Teacher Olympic Charter & Values Lecture', description: 'The 5 interlaced Olympic rings representing 5 inhabited continents; Olympic values (Excellence, Friendship, Respect); structure of IOA (Indian Olympic Association).' };
      const activity1 = { time: '15 min', title: 'Activity 1: Olympic Governance & Value Analysis', description: 'Comparative analysis of Olympic vs Paralympic vs Special Olympic values; outlining IOA athlete selection and support criteria.' };
      const activity2 = { time: '10 min', title: 'Activity 2: CBSE Board Exam PYQ Review', description: 'Diagram Olympic rings with exact color alignment (Blue, Yellow, Black, Green, Red); solve 3 CBSE past exam questions on IOC charter ethics.' };
      const plenary = { time: '10 min', title: 'Plenary & Mind Map Summary', description: 'Recap Olympic motto (Citius, Altius, Fortius - Communiter), flame lighting traditions, and fair play ethics.' };
      return {
        isTheory: true,
        sport: 'CBSE PE: Olympic Value Education',
        objectives: `Understand ancient vs modern Olympic history, Olympic symbols, rings, flag, flame, motto (Citius, Altius, Fortius - Communiter), and the structure of the Indian Olympic Association (IOA).`,
        starter,
        demonstration,
        activity1,
        activity2,
        plenary,
        warmup: `${starter.time} ${starter.title}: ${starter.description}`,
        mainDrill: `${demonstration.title} & ${activity1.title}: ${demonstration.description} | ${activity1.description}`,
        cooldown: `${plenary.time} ${plenary.title}: ${plenary.description}`,
        assessment: `Historical & Value Recall: Accurate breakdown of Olympic charter values and IOA governance.`,
        equipment: `Olympic charts, multimedia presentation, worksheets.`,
        safety: `Standard classroom safety.`
      };
    }

    if (forcedMode === 'theory') {
      const starter = { time: '10 min', title: 'CBSE PE Theory Concept Starter', description: 'Real-world sporting case scenario discussion and prior knowledge diagnostics.' };
      const demonstration = { time: '10 min', title: 'Teacher Concept Explanation & Formulas', description: 'Direct instruction on syllabus definitions, key physiological or organizational principles, and board exam marking criteria.' };
      const activity1 = { time: '15 min', title: 'Activity 1: Analytical Drills & Problem Solving', description: 'Worksheet calculations, fixture diagramming, or diagnostic categorization in small groups.' };
      const activity2 = { time: '10 min', title: 'Activity 2: CBSE Board Past Year Questions (PYQs)', description: 'Solving 3-mark and 5-mark CBSE previous year questions with step-by-step marking rubrics.' };
      const plenary = { time: '10 min', title: 'Plenary Mind Map & Assessment Debrief', description: 'Mind map summary on whiteboard and exit slip verification of key terms.' };
      return {
        isTheory: true,
        sport: 'CBSE Physical Education Theory (Code 048)',
        objectives: `Understand core concepts, definitions, and board examination problem solving for Class ${currentGrade}.`,
        starter, demonstration, activity1, activity2, plenary,
        warmup: `${starter.time} ${starter.title}: ${starter.description}`,
        mainDrill: `${demonstration.title} & ${activity1.title}: ${demonstration.description} | ${activity1.description}`,
        cooldown: `${plenary.time} ${plenary.title}: ${plenary.description}`,
        assessment: `CBSE Marking Rubric: Accurate definitions, logical diagrams, and step-by-step numerical/case reasoning.`,
        equipment: `NCERT PE Textbook, whiteboard/markers, CBSE past question papers.`,
        safety: `Classroom ergonomics, clear note-taking protocols.`
      };
    }
  }

  // --- PRACTICAL ON-FIELD SPORTS DETECTORS ---
  if (t.includes('foot') || t.includes('soccer') || f.includes('foot')) {
      const starter = { time: '10 min', title: 'Dynamic Warm-Up & Mobility', description: '2 slow laps jogging, dynamic ankle and groin mobility rotations, high knees, lateral defensive shuffles.' };
      const demonstration = { time: '10 min', title: 'Skill Demonstration & Coaching Cues', description: 'Coach demonstration of inside-of-foot passing mechanics, non-kicking foot placement alongside the ball, and head-up spatial scanning.' };
      const activity1 = { time: '15 min', title: 'Activity 1: Skill Progression & Passing Gates', description: 'Cones zigzag dribbling sprints and partner push passing across 10m gates with instant 2-touch return rhythm.' };
      const activity2 = { time: '15 min', title: 'Activity 2: Small-Sided Game & Tactical Play', description: '4v4 transition possession game in a 20x20m pitch with neutral pivot players, reinforcing passing under defensive pressure.' };
      const plenary = { time: '10 min', title: 'Cool-Down & Feedback Debrief', description: 'Slow recovery walk, static hamstring and quadriceps stretching, team debrief on passing accuracy and spatial awareness.' };
      return {
        isTheory: false,
        sport: 'Football',
        objectives: `Master inside-foot accuracy, ball-control agility, and spatial positioning during small-sided transition plays suitable for Grade ${currentGrade}.`,
        starter,
        demonstration,
        activity1,
        activity2,
        plenary,
        warmup: `${starter.time} ${starter.title}: ${starter.description}`,
        mainDrill: `${demonstration.title} & ${activity1.title}: ${demonstration.description} | ${activity1.description}`,
        cooldown: `${plenary.time} ${plenary.title}: ${plenary.description}`,
        assessment: `Performance evaluation rubric: Passing accuracy, foot contact point, posture alignment under match pressure.`,
        equipment: `Size 4/5 Footballs, marker cones, whistle, stopwatch, primary team bibs.`,
        safety: `Check ground for loose stones, ensure safe spacing between drill channels, keep students hydrated.`
      };
    }
    
    if (t.includes('basket') || f.includes('basket')) {
      const starter = { time: '10 min', title: 'Dynamic Warm-Up & Ball Taps', description: 'Sideways sliding runs, fingertip basketball control tapping, self-toss backboard catch, calf explosive jumps.' };
      const demonstration = { time: '10 min', title: 'Skill Demonstration & Coaching Cues', description: 'Coach demonstration of chest pass follow-through (thumbs pointing down), protected dribbling stance, and right-left-up layup foot rhythm.' };
      const activity1 = { time: '15 min', title: 'Activity 1: Passing Lines & Layup Weave', description: '3-player motion weaving tracks ending in lay-ups, paired with stationary shooting form repetition against the backboard.' };
      const activity2 = { time: '15 min', title: 'Activity 2: Half-Court Scrimmage & Application', description: '3v3 half-court scrimmage with mandatory 3-pass rule before shooting to enforce ball movement and spatial screening.' };
      const plenary = { time: '10 min', title: 'Cool-Down & Feedback Debrief', description: 'Arm rotations, overhead shoulder stretches, breathing deceleration routines, group reflection on turnover prevention.' };
      return {
        isTheory: false,
        sport: 'Basketball',
        objectives: `Improve chest pass velocity, dribbling ball-handling heights, and proper step layup approach coordination according to Grade ${currentGrade} CBSE syllabus.`,
        starter,
        demonstration,
        activity1,
        activity2,
        plenary,
        warmup: `${starter.time} ${starter.title}: ${starter.description}`,
        mainDrill: `${demonstration.title} & ${activity1.title}: ${demonstration.description} | ${activity1.description}`,
        cooldown: `${plenary.time} ${plenary.title}: ${plenary.description}`,
        assessment: `Motor control scoring: Correct thumb-down release follow-through, dribbling protective posture, layup foot rhythm.`,
        equipment: `Size 6/7 Basketballs, training cones, team bibs, stopwatch.`,
        safety: `Ensure correct footwear to avoid ankle slips, enforce strict clean defensive contact rules, no hanging on hoops.`
      };
    }

    if (t.includes('volley') || f.includes('volley')) {
      const starter = { time: '10 min', title: 'Dynamic Warm-Up & Line Shuffles', description: 'Line-shuffling exercises, shoulder clock-wise rotation loops, wrist and finger extension holds, light block jumps.' };
      const demonstration = { time: '10 min', title: 'Skill Demonstration & Coaching Cues', description: 'Coach demonstration of underhand bump platform (locked elbows, flat forearms) and high overhead finger setting position.' };
      const activity1 = { time: '15 min', title: 'Activity 1: Platform Bump & Setting Drills', description: 'Wall bump-setting repetitions (20 reps continuous) followed by double-partner bump-overhead sequences across the attack line.' };
      const activity2 = { time: '15 min', title: 'Activity 2: Mini-Volleyball Game & Target Serve', description: '3v3 modified court game enforcing the 3-touch rule (Bump-Set-Spike) and target-court underhand serve accuracy.' };
      const plenary = { time: '10 min', title: 'Cool-Down & Feedback Debrief', description: 'Standing trunk twists, static arm shoulder crossovers, diaphragmatic breathing cycles, peer feedback on platform steadiness.' };
      return {
        isTheory: false,
        sport: 'Volleyball',
        objectives: `Establish sturdy underhand bump reception platform and overhand serving mechanics aligned with Class ${currentGrade} standards.`,
        starter,
        demonstration,
        activity1,
        activity2,
        plenary,
        warmup: `${starter.time} ${starter.title}: ${starter.description}`,
        mainDrill: `${demonstration.title} & ${activity1.title}: ${demonstration.description} | ${activity1.description}`,
        cooldown: `${plenary.time} ${plenary.title}: ${plenary.description}`,
        assessment: `Technical check-list: Arm platform steadiness, contact speed, body balance during high ball receptions.`,
        equipment: `Soft-touch Volleyballs, training nets, cones, whistles.`,
        safety: `Protect hands during spikes, coordinate calling 'mine' for loose balls to avoid collision accidents.`
      };
    }

    if (t.includes('athlet') || t.includes('sprint') || t.includes('run') || f.includes('athlet') || f.includes('fitness')) {
      const starter = { time: '10 min', title: 'Dynamic Warm-Up & Strides', description: 'Dynamic leg swings, high knees, butt kicks, A-skips, B-skips, and progressive 30m acceleration strides.' };
      const demonstration = { time: '10 min', title: 'Skill Demonstration & Coaching Cues', description: 'Coach demonstration of crouch start on blocks (On your marks, Set, Go), drive phase body angle (45°), and baton exchange visual window.' };
      const activity1 = { time: '15 min', title: 'Activity 1: Sprint Acceleration & Baton Pass Drills', description: '15-meter block drive explosions paired with 4x100m upsweep/downsweep baton pass drills inside the official 20m exchange zone.' };
      const activity2 = { time: '15 min', title: 'Activity 2: Relay Trials & Pacing Lap', description: 'Timed 4x100m shuttle relay competitions with official lane discipline followed by mid-distance paced track lap.' };
      const plenary = { time: '10 min', title: 'Cool-Down & Feedback Debrief', description: '400m slow recovery walk, deep static quad and hamstring stretches, timing analysis and technique feedback.' };
      return {
        isTheory: false,
        sport: 'Athletics & Physical Fitness',
        objectives: `Improve crouch start explosive acceleration, standard pace breathing control, and relay-baton handoff timing protocols.`,
        starter,
        demonstration,
        activity1,
        activity2,
        plenary,
        warmup: `${starter.time} ${starter.title}: ${starter.description}`,
        mainDrill: `${demonstration.title} & ${activity1.title}: ${demonstration.description} | ${activity1.description}`,
        cooldown: `${plenary.time} ${plenary.title}: ${plenary.description}`,
        assessment: `Athletic speed indicators: Acceleration drive angle, baton hand-off exchange safety, track discipline.`,
        equipment: `Baton sticks, starter blocks, stopwatch, measuring tape, lane cones.`,
        safety: `Run strictly in allocated track lanes, wear standard running shoes, clear workspace before throwing/sprinting events.`
      };
    }

    if (t.includes('cricket') || f.includes('cricket')) {
      const starter = { time: '10 min', title: 'Dynamic Warm-Up & Arm Rotations', description: '2 laps light jog, shoulder rotator cuff mobility circles, wrist extensions, high knees and lateral boundary slides.' };
      const demonstration = { time: '10 min', title: 'Batting Stance & Straight Drive Mechanics', description: 'Coach demonstration of grip (V-shape), balanced stance, high backlift, leading shoulder into the ball, and head over the front foot.' };
      const activity1 = { time: '15 min', title: 'Activity 1: Front Foot Drive & Bowling Run-up Drills', description: 'Stationary tee drive repetitions (15 reps per student) paired with bowling run-up, bound, and high-arm delivery action across 22 yards.' };
      const activity2 = { time: '15 min', title: 'Activity 2: Long Barrier Fielding & Match Scrimmage', description: 'Long barrier ground fielding drills, wicket-keeper returns, and 6-over pairs cricket match emphasizing call and run communication.' };
      const plenary = { time: '10 min', title: 'Cool-Down & Feedback Debrief', description: 'Shoulder crossover stretches, hamstring recovery holds, slow breathing and review of cricket laws (LBW, No-ball).' };
      return {
        isTheory: false,
        sport: 'Cricket',
        objectives: `Master grip, stance, and front-foot straight drive mechanics alongside bowling release and long-barrier fielding skills for Grade ${currentGrade}.`,
        starter, demonstration, activity1, activity2, plenary,
        warmup: `${starter.time} ${starter.title}: ${starter.description}`,
        mainDrill: `${demonstration.title} & ${activity1.title}: ${demonstration.description} | ${activity1.description}`,
        cooldown: `${plenary.time} ${plenary.title}: ${plenary.description}`,
        assessment: `Technical scoring rubric: Front-foot placement, high elbow follow-through, bowling arm extension without chucking.`,
        equipment: `Cricket bats, leather/tennis balls, batting tees, stumps, boundary cones.`,
        safety: `Ensure protective gear (pads, gloves, helmets) when playing with hard balls; safe 15m radius around batting nets.`
      };
    }

    if (t.includes('badminton') || f.includes('badminton')) {
      const starter = { time: '10 min', title: 'Dynamic Warm-Up & Agility Shuffles', description: 'Lunge steps, scissor-step lateral shuffles, wrist rotations, and light shuttle tap catches.' };
      const demonstration = { time: '10 min', title: 'Forehand Grip & Overhead Clear Mechanics', description: 'Coach demonstration of pistol forehand grip, non-racket shoulder pointing at shuttle, high contact point, and pronation follow-through.' };
      const activity1 = { time: '15 min', title: 'Activity 1: Overhead High Clear & Net Play Drills', description: 'Corner-to-corner feeding drills: 20 overhead clears deep to rear court paired with soft net drops and tumble recovery.' };
      const activity2 = { time: '15 min', title: 'Activity 2: Half-Court Singles / Doubles Rally Game', description: 'Half-court singles rallies with mandatory clear-drop sequences; practicing low short service into the service box.' };
      const plenary = { time: '10 min', title: 'Cool-Down & Grip Debrief', description: 'Wrist flexor stretches, calf static stretch, deep breathing, and review of service court rules (even right, odd left).' };
      return {
        isTheory: false,
        sport: 'Badminton',
        objectives: `Execute proper forehand overhead high clears, scissor-step footwork, and tactical net drops in match play for Grade ${currentGrade}.`,
        starter, demonstration, activity1, activity2, plenary,
        warmup: `${starter.time} ${starter.title}: ${starter.description}`,
        mainDrill: `${demonstration.title} & ${activity1.title}: ${demonstration.description} | ${activity1.description}`,
        cooldown: `${plenary.time} ${plenary.title}: ${plenary.description}`,
        assessment: `Footwork & Stroke Rubric: High contact point extension, weight transfer from rear to front foot, court recovery speed.`,
        equipment: `Badminton rackets, feather/nylon shuttlecocks, regulation net, boundary court cones.`,
        safety: `Ensure non-marking sports shoes on court to avoid knee twists; keep safe distance between adjacent court pairs.`
      };
    }

    if (t.includes('table tennis') || t.includes('tt') || f.includes('table tennis')) {
      const starter = { time: '10 min', title: 'Reflex Warm-Up & Eye-Hand Coordination', description: 'Side-to-side shuffle steps, ball bounce challenges on racket face (forehand and backhand 50 continuous taps).' };
      const demonstration = { time: '10 min', title: 'Forehand Counter-Hit & Stance Demonstration', description: 'Coach demonstration of ready stance (knees bent, weight on balls of feet), waist-level backswing, brushing contact, and eyebrow finish.' };
      const activity1 = { time: '15 min', title: 'Activity 1: Cross-Court Counter & Multi-Ball Drills', description: 'Cross-court forehand rally target practice (30 balls continuous) followed by multi-ball short push return training.' };
      const activity2 = { time: '15 min', title: 'Activity 2: 11-Point Match Play with Service Variation', description: 'Regulated 11-point singles matches with legal service toss (minimum 16cm vertical throw without spin).' };
      const plenary = { time: '10 min', title: 'Cool-Down & Debrief', description: 'Shoulder and forearm flexor stretches, wrist mobility circles, review of legal service rules.' };
      return {
        isTheory: false,
        sport: 'Table Tennis',
        objectives: `Master ready stance, forehand counter-hit topspin consistency, and legal service toss for Grade ${currentGrade}.`,
        starter, demonstration, activity1, activity2, plenary,
        warmup: `${starter.time} ${starter.title}: ${starter.description}`,
        mainDrill: `${demonstration.title} & ${activity1.title}: ${demonstration.description} | ${activity1.description}`,
        cooldown: `${plenary.time} ${plenary.title}: ${plenary.description}`,
        assessment: `Rally endurance and stance accuracy: Maintaining balanced low centre of gravity during rapid exchanges.`,
        equipment: `Table tennis tables, ITTF approved balls, rackets, net gauges.`,
        safety: `Clear area around tables of spare balls and bags to prevent tripping.`
      };
    }

    if (t.includes('kho') || f.includes('kho') || t.includes('kabaddi') || f.includes('kabaddi')) {
      const starter = { time: '10 min', title: 'Agility Warm-Up & Zigzag Sprints', description: 'Fast feet ladder runs, lateral cone hops, ankle rotations, and 10-meter burst accelerations.' };
      const demonstration = { time: '10 min', title: 'Dodging Techniques & Pole Dive Mechanics', description: 'Coach demonstration of fake body feints, sudden 180° turns, pole dive reach, and sitting chaser tap signals ("Kho!").' };
      const activity1 = { time: '15 min', title: 'Activity 1: Ring Play & Chaser Pursuit Drills', description: '3-defender evasive ring movement inside the court paired with sitting chasers giving loud, clean Kho touches.' };
      const activity2 = { time: '15 min', title: 'Activity 2: Official Kho-Kho Mini Match (7-Minute Innings)', description: 'Full competitive innings applying official fouls rules (cross-lane, out-of-bounds, sudden direction change).' };
      const plenary = { time: '10 min', title: 'Cool-Down & Stamina Recovery', description: 'Hamstring and calf static stretches, quad pull holds, hydration and sportsmanship reflection.' };
      return {
        isTheory: false,
        sport: 'Kho-Kho & Traditional Games',
        objectives: `Develop explosive zigzag agility, tactical running in rings, and coordinated chaser communication for Grade ${currentGrade}.`,
        starter, demonstration, activity1, activity2, plenary,
        warmup: `${starter.time} ${starter.title}: ${starter.description}`,
        mainDrill: `${demonstration.title} & ${activity1.title}: ${demonstration.description} | ${activity1.description}`,
        cooldown: `${plenary.time} ${plenary.title}: ${plenary.description}`,
        assessment: `Agility & Decision Making: Quick reaction to 'Kho' calls, evasion timing without stepping over boundaries.`,
        equipment: `Kho-Kho wooden poles, stopwatch, lime powder court markings, team bibs.`,
        safety: `Ensure soft, stone-free court surface; inspect footwear for traction to prevent ankle sprains.`
      };
    }

    if (t.includes('yoga') || t.includes('asana')) {
      const starter = { time: '10 min', title: 'Dynamic Warm-Up & Mobilization', description: 'Neck rolls, gentle spinal cat-cow arches, joint lubrication circles, light pacing walks.' };
      const demonstration = { time: '10 min', title: 'Skill Demonstration & Breathing Synchronization', description: 'Instructor demonstration of 12-stage Surya Namaskar (Sun Salutation) with synchronized inhalation and exhalation rhythm.' };
      const activity1 = { time: '15 min', title: 'Activity 1: Asana Alignment & Balance Holds', description: 'Step-by-step posture holds of Vrikshasana (Tree pose), Virabhadrasana (Warrior pose), and core abdominal holds (Navasana).' };
      const activity2 = { time: '15 min', title: 'Activity 2: Flexibility Sequence & Partner Stretches', description: 'Partner-assisted hamstring and thoracic stretches, followed by timed plank holds to build core stability.' };
      const plenary = { time: '10 min', title: 'Cool-Down & Shavasana Relaxation', description: 'Complete Shavasana deep relaxation progressive muscle scanning, controlled deep soundless diaphragmatic breathing cycles.' };
      return {
        isTheory: false,
        sport: 'Yoga & Fitness',
        objectives: `Improve posture balance, structural flexibility, and core abdominal endurance tracking via Khelo India fitness tests.`,
        starter,
        demonstration,
        activity1,
        activity2,
        plenary,
        warmup: `${starter.time} ${starter.title}: ${starter.description}`,
        mainDrill: `${demonstration.title} & ${activity1.title}: ${demonstration.description} | ${activity1.description}`,
        cooldown: `${plenary.time} ${plenary.title}: ${plenary.description}`,
        assessment: `Physical criteria testing: Posture alignment accuracy, flexibility stretch levels (sit-and-reach scores), core muscular endurance counts.`,
        equipment: `Individual eco yoga mats, stopwatch, sit-and-reach assessment boxes.`,
        safety: `Perform poses slowly without jerky force, maintain deep slow breathing, stop instantly if dizziness or joint strain occurs.`
      };
    }

    const starter = { time: '10 min', title: 'Dynamic Warm-Up & Mobility Loops', description: 'Intermittent jogging loops, dynamic flexibility stretches, and lateral skip runs.' };
    const demonstration = { time: '10 min', title: 'Skill Demonstration & Movement Principles', description: 'Coach demonstration of target coordination exercises, footwork agility, and safe body spatial positioning.' };
    const activity1 = { time: '15 min', title: 'Activity 1: Skill Coordination Drills', description: 'Partner passing speed trails, agility cone ladders, and movement reaction drills.' };
    const activity2 = { time: '15 min', title: 'Activity 2: Cooperative Team Mini-Games', description: 'Active team mini-game drills enforcing tactical positioning, communication, and sportsmanship.' };
    const plenary = { time: '10 min', title: 'Cool-Down & Reflection Debrief', description: 'Restorative static stretching, slow-paced recovery breathing, and skill feedback session.' };
    return {
      isTheory: false,
      sport: sportOverride || termFocus || 'Practical Sports & Games',
      objectives: `Enhance motor skill coordination, sport-specific technique, and tactical gameplay understanding for Grade ${currentGrade} CBSE syllabus.`,
      starter,
      demonstration,
      activity1,
      activity2,
      plenary,
      warmup: `${starter.time} ${starter.title}: ${starter.description}`,
      mainDrill: `${demonstration.title} & ${activity1.title}: ${demonstration.description} | ${activity1.description}`,
      cooldown: `${plenary.time} ${plenary.title}: ${plenary.description}`,
      assessment: `Formative observation: Technical execution, spatial awareness, and peer cooperation.`,
      equipment: `Marker cones, relay batons, sports balls, whistle, bibs.`,
      safety: `Maintain designated operating zones, encourage regular hydration, inspect playing ground for hazards.`
    };
  };

  const handleGenerateLessonForWeek = async (tIdx: number, mIdx: number, wIdx: number, week: any) => {
    if (!plan) return;
    const key = `${tIdx}_${mIdx}_${wIdx}`;
    setGeneratingLessonIdx(key);
    setLessonGeneratingError(null);
    
    const termFocus = tIdx === 0 ? term1Focus : term2Focus;
    const sportName = getSportFromWeek(week.topic, termFocus);

    try {
      const generated = await generateLessonPlan(
        plan.board as BoardType || BoardType.CBSE,
        plan.grade,
        sportName,
        week.topic,
        "PE Coach",
        plan.duration || "40 min",
        week.dates || "Today",
        language,
        "Cones, Marker Bibs, whistle, sport balls"
      );

      setWeekLessons(prev => ({
        ...prev,
        [key]: {
          ...generated,
          period: "1",
          termWeek: `Term ${tIdx + 1} / Wk ${week.weekNumber}`,
          teacher: "PE Coach",
          date: week.dates || "Today",
          duration: plan.duration || "40 min"
        }
      }));
      setLessonGeneratingError("Successfully compiled detailed AI lesson plan!");
    } catch (err: any) {
      console.warn("AI Lesson Gen failed, falling back to senior curriculum local engine", err);
      const defaults = getCurriculumPlanLocal(week.topic, week.details, termFocus, plan.grade);
      
      const localPlan: LessonPlan = {
        teacher: "PE Coach",
        subject: defaults.isTheory ? "Physical Education (CBSE Theory Code 048)" : "Physical Education (Practical)",
        grade: plan.grade,
        date: week.dates || "Today",
        topic: week.topic,
        period: "1",
        termWeek: `Term ${tIdx + 1} / Wk ${week.weekNumber}`,
        duration: plan.duration || "40 min",
        equipment: defaults.equipment.split(', '),
        teachingAids: defaults.isTheory ? ['NCERT PE Textbook', 'Whiteboard / Smartboard', 'Past Year Board Exam Papers', 'Calculation Charts'] : ['Whistle', 'Marker Cones', 'Team Bibs', 'Stopwatch'],
        safety: defaults.safety.split(', '),
        keyVocabulary: [defaults.sport, 'Form', 'Analysis', 'Assessment'],
        sen: {
          wave1: defaults.isTheory ? 'Provide printed summary flashcards and larger diagram prints.' : 'Provide larger markers, gentle speed targets, and frequent rests.',
          wave2: defaults.isTheory ? 'Pair with study buddy for peer formula checking and step-by-step guidance.' : 'Assign peer-mentors, reduce distance bounds, and use colorful equipment.',
          wave3: defaults.isTheory ? 'Provide one-on-one guided review of formulas and key definitions.' : 'Offer custom one-on-one guided exercises and soft-touch balls.'
        },
        objectives: {
          know: defaults.objectives.split(';')[0] || defaults.objectives,
          understand: defaults.objectives.split(';')[1] || 'Understand foundational biomechanics, rules, and physiological concepts.',
          beAbleTo: defaults.objectives
        },
        successCriteria: {
          all: defaults.isTheory ? 'Identify core terms and understand primary principles.' : 'Participate actively in warm-up routines and basic skill repetitions with positive attitude.',
          most: defaults.isTheory ? 'Solve standard problems and explain concepts accurately.' : 'Execute the core skill correctly during controlled partner drills with steady mechanics.',
          some: defaults.isTheory ? 'Analyze complex case studies and construct advanced fixtures independently.' : 'Apply the skill adaptively in matches or tactical group scenarios.'
        },
        starter: {
          time: defaults.starter.time,
          title: defaults.starter.title,
          description: defaults.starter.description
        },
        mainActivity: {
          time: '35 min',
          activities: [
            {
              title: defaults.demonstration.title,
              description: defaults.demonstration.description,
              coachingPoints: defaults.isTheory ? [
                'Highlight key NCERT definitions and terms.',
                'Demonstrate step-by-step formula derivations and diagram layouts.',
                'Address common student misconception points.'
              ] : [
                'Demonstrate proper body alignment and stance.',
                'Show correct contact point and execution speed.',
                'Provide clear 2-word verbal cues for students.'
              ]
            },
            {
              title: defaults.activity1.title,
              description: defaults.activity1.description,
              coachingPoints: defaults.isTheory ? [
                'Verify mathematical calculations and formula applications.',
                'Encourage peer verification of fixture drawings.',
                'Check bye placements step-by-step.'
              ] : [
                'Maintain high chest posture and visual awareness.',
                'Coordinate breathing cycles with dynamic explosive reps.',
                'Prioritize proper court/field spacing.'
              ]
            },
            {
              title: defaults.activity2.title,
              description: defaults.activity2.description,
              coachingPoints: defaults.isTheory ? [
                'Train for CBSE 3-mark and 5-mark answer structuring.',
                'Practice time management under timed exam conditions.',
                'Review assertion-reason logic rigorously.'
              ] : [
                'Apply skill under realistic match pressure.',
                'Encourage team communication and sportspersonship.',
                'Follow official game rules strictly.'
              ]
            }
          ]
        },
        plenary: {
          time: defaults.plenary.time,
          title: defaults.plenary.title,
          description: defaults.plenary.description
        },
        homework: defaults.isTheory ? 'Review chapter notes and solve 2 CBSE past-year 3-mark questions.' : 'Practice 10 minutes of daily core mobility at home; review technique.',
        collaboration: defaults.isTheory ? 'Group study problem-solving and peer checking.' : 'Pair drills and small-sided team play.',
        differentiation: defaults.isTheory ? 'Tiered worksheets: foundational MCQs for Tier 1, advanced case studies for Tier 2.' : 'Tiered progression distances based on student confidence.',
        criticalThinking: defaults.isTheory ? 'Ask students to justify fixture placement or physiological response mechanisms.' : 'Ask students: "Why is balance critical to pass direction control?"',
        warmupDiagramPrompt: defaults.isTheory ? 'Concept mind map flowchart diagram' : 'Warmup drill grid layout',
        explanationDiagramPrompt: defaults.isTheory ? 'CBSE formula calculation table or diagram' : 'Skill drill technical demonstration',
        gameDiagramPrompt: defaults.isTheory ? 'Board exam case study layout chart' : 'Small sided game pitch layout'
      };

      setWeekLessons(prev => ({
        ...prev,
        [key]: localPlan
      }));
      setLessonGeneratingError("Synced standard syllabus lesson plan (AI request thresholds met).");
    } finally {
      setGeneratingLessonIdx(null);
    }
  };

  const handleExportTermLessonsExcel = (tIdx: number) => {
    if (!plan || !plan.terms || !plan.terms[tIdx]) {
      alert("No plan available.");
      return;
    }
    const term = plan.terms[tIdx];
    const termFocus = tIdx === 0 ? term1Focus : term2Focus;

    let csv = "\uFEFF"; // BOM for UTF-8
    csv += "Term,Month,Week,Dates,Status,Lesson Topic,Discipline / Sport,Learning Objectives (CBSE),Warm-up Drills (10-Min),Main Activity Details (25-Min),Cool-down & Alignment (10-Min),Assessment Indicators,Equipment Needed,Safety Checklist Indicators\n";
    
    term.months?.forEach(month => {
      const safeMonth = month.monthName.replace(/"/g, '""');
      month.weeks?.forEach((week, wIdx) => {
        const key = `${tIdx}_${month.monthName}_${wIdx}`;
        const aiPlan = weekLessons[key];
        
        let objectives = "";
        let warmup = "";
        let mainDrill = "";
        let cooldown = "";
        let assessment = "";
        let equipment = "";
        let safety = "";
        let sportName = "";

        if (aiPlan) {
          sportName = termFocus;
          objectives = `Know: ${aiPlan.objectives?.know || ''}. Understand: ${aiPlan.objectives?.understand || ''}. Apply: ${aiPlan.objectives?.beAbleTo || ''}`;
          warmup = `${aiPlan.starter?.time || ''} - ${aiPlan.starter?.title || ''}: ${aiPlan.starter?.description || ''}`;
          const drillList = Array.isArray(aiPlan.mainActivity?.activities) ? aiPlan.mainActivity.activities : [];
          mainDrill = `${aiPlan.mainActivity?.time || '25m'} - Activities: ` + (drillList.map(a => `${a.title || 'Drill'}: ${a.description || ''}`).join('; ') || '');
          cooldown = `${aiPlan.plenary?.time || ''} - ${aiPlan.plenary?.title || ''}: ${aiPlan.plenary?.description || ''}`;
          assessment = `Success Criteria: ALL (${aiPlan.successCriteria?.all || ''}) MOST (${aiPlan.successCriteria?.most || ''}).`;
          equipment = Array.isArray(aiPlan.equipment) ? aiPlan.equipment.join(', ') : (aiPlan.equipment || '');
          safety = Array.isArray(aiPlan.safety) ? aiPlan.safety.join('; ') : (aiPlan.safety || '');
        } else {
          const defaults = getCurriculumPlanLocal(week.topic, week.details, termFocus, grade);
          sportName = defaults.sport;
          objectives = defaults.objectives;
          warmup = defaults.warmup;
          mainDrill = defaults.mainDrill;
          cooldown = defaults.cooldown;
          assessment = defaults.assessment;
          equipment = defaults.equipment;
          safety = defaults.safety;
        }

        const row = [
          `"${term.termName.replace(/"/g, '""')}"`,
          `"${safeMonth}"`,
          `"${week.weekNumber}"`,
          `"${(week.dates || '').replace(/"/g, '""')}"`,
          `"${week.status}"`,
          `"${(week.topic || '').replace(/"/g, '""')}"`,
          `"${sportName.replace(/"/g, '""')}"`,
          `"${objectives.replace(/"/g, '""')}"`,
          `"${warmup.replace(/"/g, '""')}"`,
          `"${mainDrill.replace(/"/g, '""')}"`,
          `"${cooldown.replace(/"/g, '""')}"`,
          `"${assessment.replace(/"/g, '""')}"`,
          `"${equipment.replace(/"/g, '""')}"`,
          `"${safety.replace(/"/g, '""')}"`
        ];
        csv += row.join(",") + "\n";
      });
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `PE_${term.termName.replace(/\s+/g, '_')}_Grade${grade}_Detailed_Lessons.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      let result = await generateYearlyPlan(
        grade, 
        board, 
        frequency, 
        calendarText, 
        term1Focus, 
        term2Focus, 
        startDate, 
        duration, 
        language, 
        planTrack,
        term1Game,
        term2Game
      );
      if (!result || !Array.isArray(result.terms) || result.terms.length === 0 || !result.terms.some((t: any) => Array.isArray(t.months) && t.months.length > 0)) {
        result = buildComprehensiveYearlyPlanFallback(grade, board, duration, term1Focus, term2Focus, planTrack, term1Game, term2Game);
      }
      setPlan(result);
      localStorage.setItem('peYearlyPlan', JSON.stringify(result));
      setStep(4);
    } catch (err: any) {
      console.warn("AI generation failed, deploying full CBSE yearly plan fallback:", err);
      const fallback = buildComprehensiveYearlyPlanFallback(grade, board, duration, term1Focus, term2Focus, planTrack, term1Game, term2Game);
      setPlan(fallback);
      localStorage.setItem('peYearlyPlan', JSON.stringify(fallback));
      setStep(4);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePlan = (t: number, m: number, w: number, field: any, value: string) => {
    if (!plan || !plan.terms) return;
    const newPlan = { ...plan };
    if (newPlan.terms[t]?.months?.[m]?.weeks?.[w]) {
        newPlan.terms[t].months[m].weeks[w] = { ...newPlan.terms[t].months[m].weeks[w], [field]: value };
        setPlan(newPlan);
        localStorage.setItem('peYearlyPlan', JSON.stringify(newPlan));
    }
  };

  const handleExportPdf = () => {
    exportToPdf(contentRef.current, `PE_Yearly_Plan_Grade${grade}_${board}`).catch(err => {
      console.error("PDF Export error:", err);
    });
  };

  const handleExportWord = () => {
    if (!plan || !plan.terms || plan.terms.length === 0) {
      alert("No data available to export.");
      return;
    }

    let html = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word'>
      <head><meta charset='utf-8'><title>PE Yearly Plan</title>
      <style>
        body { font-family: Calibri, Arial, sans-serif; padding: 20px; }
        h1 { color: #1e3a8a; text-transform: uppercase; font-size: 22px; }
        h2 { color: #4f46e5; border-bottom: 2px solid #e5e7eb; padding-bottom: 5px; font-size: 18px; margin-top: 20px; }
        h3 { color: #374151; margin-top: 20px; font-size: 16px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th, td { border: 1px solid #d1d5db; padding: 8px; text-align: left; font-size: 11px; }
        th { background-color: #f3f4f6; font-weight: bold; }
        .holiday { background-color: #fff7ed; color: #9a3412; }
      </style>
      </head>
      <body>
        <h1>PE Yearly Planner - Grade ${plan.grade} (${plan.board})</h1>
        <p>Academic Year: ${plan.academicYear} | Sessions: ${frequency}/week | Duration: ${plan.duration}</p>
        <p>Generated on: ${plan.generatedDate}</p>
    `;

    plan.terms.forEach(term => {
      html += `<h2>${term.termName}</h2>`;
      term.months?.forEach(month => {
        html += `<h3>${month.monthName}</h3>`;
        html += `
          <table>
            <thead>
              <tr>
                <th width="40">Week</th>
                <th width="85">Dates</th>
                <th width="75">Status</th>
                <th width="150">CBSE Theory Scheme (Code 048)</th>
                <th width="150">On-Field Game & Sport Skill</th>
                <th>Instructional Guide / Details</th>
              </tr>
            </thead>
            <tbody>
        `;
        month.weeks?.forEach(week => {
          const isHoliday = week.status !== 'Instructional';
          html += `
            <tr class="${isHoliday ? 'holiday' : ''}">
              <td>${week.weekNumber}</td>
              <td>${week.dates || '-'}</td>
              <td>${week.status}</td>
              <td><b>${week.theoryTopic || week.topic || '-'}</b></td>
              <td>${week.gameSkill || '-'}</td>
              <td>${week.details || '-'}</td>
            </tr>
          `;
        });
        html += `</tbody></table>`;
      });
    });

    html += `</body></html>`;

    exportToWord(html, `PE_Yearly_Plan_Grade${grade}`);
  };

  const handleExportExcel = () => {
    if (!plan || !plan.terms || plan.terms.length === 0) {
      alert("No data available to export.");
      return;
    }

    let csv = "\uFEFF"; // BOM for UTF-8
    csv += "Term,Month,Week,Dates,Status,CBSE Theory Scheme (Code 048),On-Field Game & Sport Skill,Summary Topic,Details\n";
    
    plan.terms.forEach(term => {
      const safeTerm = term.termName.replace(/"/g, '""');
      term.months?.forEach(month => {
        const safeMonth = month.monthName.replace(/"/g, '""');
        month.weeks?.forEach(week => {
          const row = [
            `"${safeTerm}"`,
            `"${safeMonth}"`,
            `"${week.weekNumber}"`,
            `"${(week.dates || '').replace(/"/g, '""')}"`,
            `"${week.status}"`,
            `"${(week.theoryTopic || week.topic || '').replace(/"/g, '""')}"`,
            `"${(week.gameSkill || '').replace(/"/g, '""')}"`,
            `"${(week.topic || '').replace(/"/g, '""')}"`,
            `"${(week.details || '').replace(/"/g, '""')}"`
          ];
          csv += row.join(",") + "\n";
        });
      });
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `PE_Yearly_Plan_Grade${grade}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportCalendarIcs = () => {
    if (!plan || !plan.terms || plan.terms.length === 0) {
      alert("No curriculum plan available to export.");
      return;
    }

    exportYearlyPlanToIcs(plan, {
      term1Focus,
      term2Focus,
      startDate: plan.startDate || startDate,
      filename: `PE_40Week_Curriculum_Grade${plan.grade || grade}_${plan.board || board}.ics`
    });
  };

  return (
    <div className="space-y-8 animate-slide-up pb-20">
      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border-2 border-slate-100 print:shadow-none print:p-0">
        <div className="flex justify-between items-center mb-8 print:hidden">
          <div>
            <h2 className="text-3xl font-black text-slate-800 tracking-tighter uppercase">Yearly Planner</h2>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Syllabus pacing made efficient</p>
          </div>
          {step === 4 && (
             <button onClick={() => {setStep(1); setPlan(null); localStorage.removeItem('peYearlyPlan');}} className="flex items-center space-x-2 text-slate-400 font-bold hover:text-[#005BFF] transition-colors">
                <RotateCcw size={18} />
                <span>Start New Plan</span>
             </button>
          )}
        </div>

        {/* AI Generator Integration Banner */}
        <div className="bg-gradient-to-r from-orange-500/10 to-indigo-500/10 border-2 border-orange-500/20 p-6 rounded-3xl mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 print:hidden">
          <div className="flex items-center gap-4">
            <span className="w-12 h-12 rounded-2xl bg-[#FF6B00] text-white flex items-center justify-center shadow-lg shadow-orange-500/20">
              <Sparkles size={24} className="animate-pulse" />
            </span>
            <div>
              <h4 className="font-black text-slate-900 uppercase tracking-wide text-sm flex items-center gap-2">
                <span>Generative AI Curriculum Planner</span>
                <span className="px-2 py-0.5 bg-orange-500 text-white rounded text-[8px] tracking-[0.2em] font-black uppercase">Active</span>
              </h4>
              <p className="text-xs font-semibold text-slate-600 leading-relaxed mt-0.5">
                Automatically mapping physical education cycles, syllabus weights, sporting seasons, CBSE standards, and school calendar holidays using Gemini.
              </p>
            </div>
          </div>
          <div className="px-4 py-2 bg-[#001D3D] text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-sm">
            AI pacing active
          </div>
        </div>

        <div className="mt-8">
          {step === 1 && (
            <div className="space-y-8 animate-in fade-in">
              {/* Curriculum Track Selector */}
              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200">
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-3">
                  Curriculum Plan Track (CBSE & Indian Schools)
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setPlanTrack('integrated');
                      applyCbsesyllabusDefaults(grade, 'integrated');
                    }}
                    className={`p-4 rounded-2xl border-2 text-left transition-all ${
                      planTrack === 'integrated'
                        ? 'border-indigo-600 bg-indigo-50/70 shadow-sm'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-black uppercase text-indigo-950">Integrated Track</span>
                      <span className="text-[9px] px-2 py-0.5 bg-indigo-600 text-white rounded font-bold">Recommended</span>
                    </div>
                    <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                      Theory Units + Practical Assessments (Standard for Classes 9, 10, 11 & 12).
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPlanTrack('theory');
                      applyCbsesyllabusDefaults(grade, 'theory');
                    }}
                    className={`p-4 rounded-2xl border-2 text-left transition-all ${
                      planTrack === 'theory'
                        ? 'border-indigo-600 bg-indigo-50/70 shadow-sm'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-black uppercase text-indigo-950">Theory Syllabus Only</span>
                      <span className="text-[9px] px-2 py-0.5 bg-slate-900 text-white rounded font-bold">70 Marks</span>
                    </div>
                    <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                      CBSE Code 048 textbook units, classroom pedagogy, and board exam pacing.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPlanTrack('practical');
                      applyCbsesyllabusDefaults(grade, 'practical');
                    }}
                    className={`p-4 rounded-2xl border-2 text-left transition-all ${
                      planTrack === 'practical'
                        ? 'border-indigo-600 bg-indigo-50/70 shadow-sm'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-black uppercase text-indigo-950">Practical & Sports Only</span>
                      <span className="text-[9px] px-2 py-0.5 bg-emerald-600 text-white rounded font-bold">On-Field</span>
                    </div>
                    <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                      Field sport drills, motor skills, and Khelo India fitness tests (Grades 1-8).
                    </p>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                     <label className="block text-xs font-black text-slate-400 uppercase mb-2">Target Grade / Class</label>
                     <div className="flex gap-2">
                       <input 
                         type="text" 
                         value={grade} 
                         onChange={e => {
                           const val = e.target.value;
                           setGrade(val);
                           applyCbsesyllabusDefaults(val, planTrack);
                         }} 
                         className="flex-1 p-4 bg-slate-50 border rounded-xl font-bold" 
                         placeholder="e.g., 12, 11, 10, 9, 8"
                       />
                       <select 
                         onChange={e => {
                           if (e.target.value) {
                             setGrade(e.target.value);
                             applyCbsesyllabusDefaults(e.target.value, planTrack);
                           }
                         }} 
                         className="p-4 bg-slate-100 border rounded-xl font-bold text-xs"
                         value={['9','10','11','12'].includes(grade) ? grade : ''}
                       >
                         <option value="">Quick Select</option>
                         <option value="12">Class 12 (Board)</option>
                         <option value="11">Class 11</option>
                         <option value="10">Class 10 (HPE)</option>
                         <option value="9">Class 9 (HPE)</option>
                         <option value="8">Grade 8</option>
                         <option value="7">Grade 7</option>
                         <option value="6">Grade 6</option>
                       </select>
                     </div>
                  </div>
                  <div>
                     <label className="block text-xs font-black text-slate-400 uppercase mb-2">Board</label>
                     <select value={board} onChange={e => setBoard(e.target.value as BoardType)} className="w-full p-4 bg-slate-50 border rounded-xl font-bold">
                       {Object.values(BoardType).map(b => <option key={b} value={b}>{b}</option>)}
                     </select>
                  </div>
                </div>
                <div className="space-y-6">
                  <div><label className="block text-xs font-black text-slate-400 uppercase mb-2">Duration</label>
                  <input type="text" value={duration} onChange={e => setDuration(e.target.value)} className="w-full p-4 bg-slate-50 border rounded-xl font-bold" /></div>
                  <div><label className="block text-xs font-black text-slate-400 uppercase mb-2">Start Date</label>
                  <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full p-4 bg-slate-50 border rounded-xl font-bold" /></div>
                  
                  {/* Language Selector */}
                  <div>
                     <label className="block text-xs font-black text-slate-400 uppercase mb-2 flex items-center">
                       <Languages size={14} className="mr-1" /> Language
                     </label>
                     <select value={language} onChange={e => setLanguage(e.target.value as Language)} className="w-full p-4 bg-slate-50 border rounded-xl font-bold">
                       <option value="English">English</option>
                       <option value="Hindi">Hindi</option>
                       <option value="Marathi">Marathi</option>
                       <option value="Tamil">Tamil</option>
                       <option value="Bengali">Bengali</option>
                     </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
             <div className="animate-in fade-in">
                <label className="block text-xs font-black text-slate-400 uppercase mb-2">Calendar Text (Holidays & Events)</label>
                <textarea value={calendarText} onChange={e => setCalendarText(e.target.value)} className="w-full h-64 p-4 bg-slate-50 border rounded-xl font-mono text-sm" placeholder="Paste school calendar here..." />
             </div>
          )}

          {step === 3 && (
            <div className="animate-in fade-in space-y-8">
              {/* Syllabus Presets Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-5 bg-indigo-50/60 rounded-3xl border border-indigo-150">
                <div>
                  <span className="text-xs font-black text-indigo-950 uppercase tracking-wider flex items-center gap-2">
                    <Sparkles size={16} className="text-[#FF6B00]" />
                    <span>Curriculum Auto-Presets for Grade {grade}:</span>
                  </span>
                  <p className="text-[11px] text-slate-600 font-medium mt-0.5">
                    Click any preset to automatically populate syllabus-aligned theory chapters and term sport games.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => applyCbsesyllabusDefaults('12', planTrack)}
                    className="px-3.5 py-2 bg-white border border-slate-300 hover:border-indigo-500 rounded-xl text-[10px] font-black uppercase text-slate-700 hover:text-indigo-600 transition-colors shadow-sm"
                  >
                    Class 12 Units (048)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyCbsesyllabusDefaults('11', planTrack)}
                    className="px-3.5 py-2 bg-white border border-slate-300 hover:border-indigo-500 rounded-xl text-[10px] font-black uppercase text-slate-700 hover:text-indigo-600 transition-colors shadow-sm"
                  >
                    Class 11 Units (048)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyCbsesyllabusDefaults('10', planTrack)}
                    className="px-3.5 py-2 bg-white border border-slate-300 hover:border-indigo-500 rounded-xl text-[10px] font-black uppercase text-slate-700 hover:text-indigo-600 transition-colors shadow-sm"
                  >
                    Class 9/10 HPE
                  </button>
                  <button
                    type="button"
                    onClick={() => applyCbsesyllabusDefaults('8', planTrack)}
                    className="px-3.5 py-2 bg-white border border-slate-300 hover:border-indigo-500 rounded-xl text-[10px] font-black uppercase text-slate-700 hover:text-indigo-600 transition-colors shadow-sm"
                  >
                    Grades 1-8 Literacy
                  </button>
                </div>
              </div>

              {/* Term 1 & Term 2 Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 {/* Term 1 Configuration */}
                 <div className="bg-indigo-50/70 p-6 rounded-[2rem] border-2 border-indigo-200/80 space-y-4">
                    <div className="flex items-center justify-between border-b border-indigo-200/60 pb-3">
                      <div>
                        <h4 className="font-black text-indigo-950 uppercase text-sm">Term 1 (Apr to Sep)</h4>
                        <span className="text-[10px] font-bold text-indigo-600 uppercase">First 6 Months &bull; 24 Weeks</span>
                      </div>
                      <span className="px-2.5 py-1 bg-indigo-600 text-white rounded-lg text-[9px] font-black uppercase tracking-wider">
                        Theory + Sports
                      </span>
                    </div>

                    {/* Term 1 Sport / Game Input */}
                    <div>
                      <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                        <span>Chosen Sport / Game Focus</span>
                        <span className="text-[9px] text-indigo-600 font-bold lowercase">on-field practical</span>
                      </label>
                      <input 
                        type="text"
                        value={term1Game}
                        onChange={e => setTerm1Game(e.target.value)}
                        placeholder="e.g. Football & Athletics Track"
                        className="w-full p-3 bg-white border border-indigo-200 rounded-xl font-bold text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      />
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {['Football', 'Basketball', 'Athletics', 'Volleyball', 'Yoga', 'Kho-Kho'].map(g => (
                          <button
                            key={g}
                            type="button"
                            onClick={() => setTerm1Game(prev => prev.includes(g) ? prev : `${g} & Athletics`)}
                            className="px-2 py-0.5 bg-white/80 hover:bg-white text-[9px] font-bold text-slate-600 rounded-md border border-indigo-150 transition-colors"
                          >
                            + {g}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Term 1 Theory Focus */}
                    <div>
                      <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                        <span>CBSE Theory Units / Health Syllabus</span>
                        <span className="text-[9px] text-indigo-600 font-bold lowercase">classroom syllabus</span>
                      </label>
                      <textarea 
                        rows={3}
                        value={term1Focus} 
                        onChange={e => setTerm1Focus(e.target.value)} 
                        className="w-full p-3.5 bg-white border border-indigo-200 rounded-xl font-bold text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-y" 
                      />
                    </div>
                 </div>

                 {/* Term 2 Configuration */}
                 <div className="bg-emerald-50/70 p-6 rounded-[2rem] border-2 border-emerald-200/80 space-y-4">
                    <div className="flex items-center justify-between border-b border-emerald-200/60 pb-3">
                      <div>
                        <h4 className="font-black text-emerald-950 uppercase text-sm">Term 2 (Oct to Mar)</h4>
                        <span className="text-[10px] font-bold text-emerald-700 uppercase">Second 6 Months &bull; 24 Weeks</span>
                      </div>
                      <span className="px-2.5 py-1 bg-emerald-700 text-white rounded-lg text-[9px] font-black uppercase tracking-wider">
                        Theory + Board Prep
                      </span>
                    </div>

                    {/* Term 2 Sport / Game Input */}
                    <div>
                      <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                        <span>Chosen Sport / Game Focus</span>
                        <span className="text-[9px] text-emerald-700 font-bold lowercase">on-field practical</span>
                      </label>
                      <input 
                        type="text"
                        value={term2Game}
                        onChange={e => setTerm2Game(e.target.value)}
                        placeholder="e.g. Basketball & Volleyball"
                        className="w-full p-3 bg-white border border-emerald-200 rounded-xl font-bold text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                      />
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {['Basketball', 'Volleyball', 'Cricket', 'Badminton', 'Table Tennis', 'Kabaddi'].map(g => (
                          <button
                            key={g}
                            type="button"
                            onClick={() => setTerm2Game(prev => prev.includes(g) ? prev : `${g} & Match Tactics`)}
                            className="px-2 py-0.5 bg-white/80 hover:bg-white text-[9px] font-bold text-slate-600 rounded-md border border-emerald-150 transition-colors"
                          >
                            + {g}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Term 2 Theory Focus */}
                    <div>
                      <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                        <span>CBSE Theory Units / Board Practical Prep</span>
                        <span className="text-[9px] text-emerald-700 font-bold lowercase">classroom syllabus</span>
                      </label>
                      <textarea 
                        rows={3}
                        value={term2Focus} 
                        onChange={e => setTerm2Focus(e.target.value)} 
                        className="w-full p-3.5 bg-white border border-emerald-200 rounded-xl font-bold text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-y" 
                      />
                    </div>
                 </div>
              </div>

              <div className="flex justify-center">
                 <button onClick={handleGenerate} disabled={loading} className="bg-slate-900 text-white px-12 py-5 rounded-2xl font-black text-lg flex items-center space-x-3 shadow-xl hover:scale-105 active:scale-95 transition-all">
                   {loading ? <Loader2 className="animate-spin" /> : <Sparkles size={20} />}
                   <span>{loading ? 'Designing Master Plan...' : 'Generate Full Year Plan (48 Weeks)'}</span>
                 </button>
              </div>
            </div>
          )}

          {step === 4 && plan && (
             <div className="animate-in fade-in slide-in-from-bottom-12 space-y-12">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b pb-6 print:hidden gap-4">
                   <div>
                     <h3 className="text-3xl font-black text-slate-800 uppercase tracking-tighter">Grade {plan.grade} Plan</h3>
                     <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">{plan.academicYear} | {plan.board}</p>
                   </div>
                   <div className="flex flex-wrap gap-2 md:gap-3">
                     <button onClick={handleExportCalendarIcs} className="flex items-center space-x-2 px-4 md:px-6 py-2.5 md:py-3 bg-purple-50 text-purple-700 rounded-xl font-bold hover:bg-purple-100 border border-purple-200/80 transition-all text-xs md:text-sm shadow-sm active:scale-95" title="Download 40-week mapped curriculum as an .ics file">
                        <CalendarIcon size={16} className="text-purple-600" />
                        <span>Calendar (.ics)</span>
                     </button>
                     <button onClick={handleExportExcel} className="flex items-center space-x-2 px-4 md:px-6 py-2.5 md:py-3 bg-emerald-50 text-emerald-700 rounded-xl font-bold hover:bg-emerald-100 transition-colors text-xs md:text-sm">
                        <FileSpreadsheet size={16} />
                        <span>Excel</span>
                     </button>
                     <button onClick={handleExportWord} className="flex items-center space-x-2 px-4 md:px-6 py-2.5 md:py-3 bg-blue-50 text-blue-700 rounded-xl font-bold hover:bg-blue-100 transition-colors text-xs md:text-sm">
                        <FileText size={16} />
                        <span>Word</span>
                     </button>
                     <button onClick={handleExportPdf} className="flex items-center space-x-2 px-4 md:px-6 py-2.5 md:py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 text-xs md:text-sm">
                        <Download size={16} />
                        <span>PDF</span>
                     </button>
                   </div>
                </div>

                <div ref={contentRef} className="print:p-4">
                  <div className="hidden print:block mb-8 border-b-2 border-slate-900 pb-4">
                    <h1 className="text-2xl font-black uppercase tracking-tighter">PE Yearly Planner: Grade {plan.grade}</h1>
                    <p className="font-bold text-slate-500">{plan.board} | Academic Year: {plan.academicYear}</p>
                  </div>

                  {!plan.terms || plan.terms.length === 0 ? (
                    <div className="p-12 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 space-y-4">
                      <AlertCircle className="mx-auto text-amber-500 mb-2" size={48} />
                      <h4 className="text-xl font-black uppercase text-slate-800">No Plan Data Found in Session</h4>
                      <p className="text-slate-500 text-xs font-semibold max-w-md mx-auto">
                        Your yearly plan data was reset or incomplete. Click below to instantly generate the full 48-week Grade {plan.grade || grade} CBSE syllabus plan with integrated theory and sports.
                      </p>
                      <button
                        onClick={() => {
                          const recovered = buildComprehensiveYearlyPlanFallback(plan.grade || grade || '12', board, duration, term1Focus, term2Focus, planTrack, term1Game, term2Game);
                          setPlan(recovered);
                          localStorage.setItem('peYearlyPlan', JSON.stringify(recovered));
                        }}
                        className="px-8 py-4 bg-[#0D2B52] hover:bg-[#164077] text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center gap-2 mx-auto transition-all"
                      >
                        <Sparkles size={16} className="text-[#D4A017]" />
                        <span>Generate Complete 48-Week Grade {plan.grade || grade} Master Plan</span>
                      </button>
                    </div>
                  ) : (
                    <div>
                      {/* Curriculum Track View Mode Switcher */}
                      <div className="mb-10 p-4 bg-slate-50 border-2 border-slate-200/90 rounded-3xl print:hidden flex flex-col md:flex-row items-center justify-between gap-4 shadow-xs">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-700 shrink-0">
                            <Layers size={20} />
                          </div>
                          <div>
                            <span className="text-xs font-black uppercase text-slate-800 tracking-wider block">Curriculum Display View</span>
                            <p className="text-[11px] text-slate-500 font-semibold">Choose to view On-Field Games, CBSE Theory Scheme of Work, or Dual-Track Integrated format</p>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-white border border-slate-200 rounded-2xl shadow-xs">
                          <button
                            type="button"
                            onClick={() => setViewMode('integrated')}
                            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all ${
                              viewMode === 'integrated'
                                ? 'bg-slate-900 text-white shadow-md'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                            }`}
                          >
                            <Layers size={14} />
                            <span>Dual-Track Integrated</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setViewMode('theory')}
                            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all ${
                              viewMode === 'theory'
                                ? 'bg-indigo-600 text-white shadow-md'
                                : 'text-slate-600 hover:text-indigo-600 hover:bg-indigo-50/50'
                            }`}
                          >
                            <BookOpen size={14} />
                            <span>CBSE Theory Scheme (Code 048)</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setViewMode('games')}
                            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all ${
                              viewMode === 'games'
                                ? 'bg-emerald-600 text-white shadow-md'
                                : 'text-slate-600 hover:text-emerald-600 hover:bg-emerald-50/50'
                            }`}
                          >
                            <Trophy size={14} />
                            <span>On-Field Games Curriculum</span>
                          </button>
                        </div>
                      </div>

                      {plan.terms?.map((term, tIdx) => (
                      <div key={tIdx} className="mb-16 last:mb-0">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 border-b-2 border-slate-900 pb-4">
                           <div className="flex items-center space-x-4">
                              <div className="h-8 w-2 bg-indigo-600 rounded-full"></div>
                              <h4 className="text-3xl font-black text-slate-800 uppercase tracking-tighter">{term.termName}</h4>
                              <span className="text-[10px] font-bold text-slate-400 hidden sm:inline uppercase tracking-[0.2em] border-l pl-4">Indian Academic Cycle</span>
                           </div>
                           <div className="flex flex-wrap items-center gap-2">
                             <button 
                               onClick={() => {
                                 exportYearlyPlanToIcs({
                                   ...plan,
                                   terms: [term]
                                 }, {
                                   term1Focus,
                                   term2Focus,
                                   startDate: plan.startDate || startDate,
                                   filename: `PE_${term.termName.replace(/\s+/g, '_')}_Grade${plan.grade || grade}_Curriculum.ics`
                                 });
                               }}
                               type="button"
                               className="flex items-center space-x-1.5 px-3 py-2 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-xl font-bold border border-purple-200/80 text-xs transition-all active:scale-95 print:hidden shrink-0"
                               title={`Download ${term.termName} schedule as .ics calendar`}
                             >
                               <CalendarIcon size={13} className="text-purple-600" />
                               <span>{term.termName} .ics</span>
                             </button>
                             <button 
                               onClick={() => handleExportTermLessonsExcel(tIdx)}
                               type="button"
                               className="flex items-center space-x-2 px-4 py-2.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl font-bold border border-emerald-500/20 text-xs transition-all active:scale-95 print:hidden shrink-0"
                               title="Export entire term detailed curriculum with drills, objectives, assessments and safety to CSV"
                             >
                               <FileSpreadsheet size={14} className="text-emerald-600 animate-pulse" />
                               <span>Export Full {term.termName} Lesson Plans (Excel)</span>
                             </button>
                           </div>
                        </div>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                          {term.months?.map((month, mIdx) => (
                            <div key={mIdx} className="bg-white border-2 border-slate-50 rounded-[2.5rem] p-8 shadow-sm hover:shadow-md transition-shadow">
                               <h5 className="font-black text-indigo-600 mb-6 uppercase tracking-widest text-sm border-b pb-4">
                                 {month.monthName}
                               </h5>
                               <div className="space-y-4">
                                 {month.weeks?.map((week, wIdx) => {
                                   const lessonKey = `${tIdx}_${month.monthName}_${wIdx}`;
                                   const hasSyncedLesson = !!weekLessons[lessonKey];

                                   return (
                                     <div 
                                       key={wIdx} 
                                       onClick={() => {
                                         if (week.status === 'Instructional') {
                                           setModalLessonType(viewMode === 'games' ? 'games' : 'theory');
                                           setSelectedWeekForLesson({
                                             termIdx: tIdx,
                                             monthIdx: mIdx,
                                             weekIdx: wIdx,
                                             week: week
                                           });
                                           setLessonGeneratingError(null);
                                         }
                                       }}
                                       className={`p-5 rounded-2xl border transition-all relative ${
                                         week.status === 'Instructional' 
                                           ? 'bg-slate-50/50 border-slate-100 hover:border-indigo-400 hover:bg-indigo-50/10 cursor-pointer shadow-sm hover:shadow' 
                                           : 'bg-orange-50/50 border-orange-100'
                                       }`}
                                     >
                                        <div className="flex justify-between items-center text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">
                                          <span className="flex items-center"><CalendarDays size={10} className="mr-1" /> Week {week.weekNumber}</span>
                                          <span>{week.dates}</span>
                                        </div>

                                        {viewMode === 'integrated' ? (
                                          <div className="space-y-2 mb-2" onClick={(e) => e.stopPropagation()}>
                                            {/* Theory Scheme */}
                                            <div className="p-2.5 bg-indigo-50/70 border border-indigo-150 rounded-xl">
                                              <div className="flex items-center justify-between mb-1">
                                                <span className="text-[9px] font-black text-indigo-700 uppercase tracking-wider flex items-center gap-1">
                                                  <BookOpen size={10} /> CBSE Theory Scheme (048)
                                                </span>
                                              </div>
                                              <input 
                                                className="w-full font-bold text-xs text-indigo-950 bg-transparent outline-none focus:text-indigo-600 transition-colors pointer-events-auto" 
                                                value={week.theoryTopic ?? (week.topic.includes(' | Game:') ? week.topic.split(' | Game:')[0].replace(/^Theory:\s*/, '') : week.topic)} 
                                                placeholder="CBSE Theory Unit / Topic"
                                                onChange={(e) => handleUpdatePlan(tIdx, mIdx, wIdx, 'theoryTopic', e.target.value)} 
                                              />
                                            </div>

                                            {/* Game Progression */}
                                            <div className="p-2.5 bg-emerald-50/70 border border-emerald-150 rounded-xl">
                                              <div className="flex items-center justify-between mb-1">
                                                <span className="text-[9px] font-black text-emerald-700 uppercase tracking-wider flex items-center gap-1">
                                                  <Trophy size={10} /> On-Field Game & Skill Drill
                                                </span>
                                              </div>
                                              <input 
                                                className="w-full font-bold text-xs text-emerald-950 bg-transparent outline-none focus:text-emerald-700 transition-colors pointer-events-auto" 
                                                value={week.gameSkill ?? (week.topic.includes(' | Game:') ? week.topic.split(' | Game:')[1] : week.topic)} 
                                                placeholder="On-Field Game Skill / Tactical Drill"
                                                onChange={(e) => handleUpdatePlan(tIdx, mIdx, wIdx, 'gameSkill', e.target.value)} 
                                              />
                                            </div>
                                          </div>
                                        ) : viewMode === 'theory' ? (
                                          <div className="p-2.5 bg-indigo-50/70 border border-indigo-150 rounded-xl mb-2" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex items-center justify-between mb-1">
                                              <span className="text-[9px] font-black text-indigo-700 uppercase tracking-wider flex items-center gap-1">
                                                <BookOpen size={10} /> CBSE Theory Scheme of Work (Code 048)
                                              </span>
                                            </div>
                                            <input 
                                              className="w-full font-black text-xs text-indigo-950 bg-transparent outline-none focus:text-indigo-600 transition-colors pointer-events-auto" 
                                              value={week.theoryTopic ?? (week.topic.includes(' | Game:') ? week.topic.split(' | Game:')[0].replace(/^Theory:\s*/, '') : week.topic)} 
                                              placeholder="CBSE Theory Unit / Topic"
                                              onChange={(e) => handleUpdatePlan(tIdx, mIdx, wIdx, 'theoryTopic', e.target.value)} 
                                            />
                                          </div>
                                        ) : (
                                          <div className="p-2.5 bg-emerald-50/70 border border-emerald-150 rounded-xl mb-2" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex items-center justify-between mb-1">
                                              <span className="text-[9px] font-black text-emerald-700 uppercase tracking-wider flex items-center gap-1">
                                                <Trophy size={10} /> On-Field Game Skill & Coaching Progression
                                              </span>
                                            </div>
                                            <input 
                                              className="w-full font-black text-xs text-emerald-950 bg-transparent outline-none focus:text-emerald-700 transition-colors pointer-events-auto" 
                                              value={week.gameSkill ?? (week.topic.includes(' | Game:') ? week.topic.split(' | Game:')[1] : week.topic)} 
                                              placeholder="On-Field Game Skill / Tactical Drill"
                                              onChange={(e) => handleUpdatePlan(tIdx, mIdx, wIdx, 'gameSkill', e.target.value)} 
                                            />
                                          </div>
                                        )}
                                        
                                        {week.status === 'Instructional' && week.details && (
                                          <div className="mt-2 pt-2 border-t border-slate-100/50">
                                            <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest block mb-1">Instructional Guide:</span>
                                            <p className="text-xs text-slate-600 font-medium leading-relaxed italic">
                                              {week.details}
                                            </p>
                                          </div>
                                        )}

                                        {week.status !== 'Instructional' && (
                                          <p className="text-xs text-slate-500 mt-2 font-bold uppercase tracking-wide">
                                            {week.details}
                                          </p>
                                        )}

                                        <div className="mt-4 pt-3 border-t border-slate-100/60 flex items-center justify-between">
                                          <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-widest ${week.status === 'Instructional' ? 'bg-indigo-100 text-indigo-600' : 'bg-orange-100 text-orange-600'}`}>
                                            {week.status}
                                          </span>
                                          
                                          {week.status === 'Instructional' && (
                                            <div className="flex items-center gap-2 print:hidden" onClick={e => e.stopPropagation()}>
                                              {onNavigate && (
                                                <button
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    onNavigate('weekly-planner');
                                                  }}
                                                  className="text-[9px] font-black text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-all uppercase border-2 border-indigo-150 px-2.5 py-1 rounded-xl bg-white hover:bg-indigo-50/50"
                                                  title="Go to Weekly Academic Planner"
                                                >
                                                  Weekly Planner &rarr;
                                                </button>
                                              )}
                                              <span className={`text-[9.5px] font-black uppercase tracking-wider flex items-center gap-1 transition-colors ${hasSyncedLesson ? 'text-emerald-600' : 'text-[#FF6B00]'}`}>
                                                <Sparkles size={11} className={hasSyncedLesson ? "" : "animate-pulse"} />
                                                {hasSyncedLesson ? 'Synced & Ready' : 'Integrate'}
                                              </span>
                                            </div>
                                          )}
                                        </div>
                                     </div>
                                   );
                                 })}
                               </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                    }
                  </div>
                  )}
                </div>

                {/* Lesson Plan Integrator Modal */}
                {selectedWeekForLesson && (
                  <div className="fixed inset-0 bg-slate-950/65 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white border-4 border-slate-900 rounded-[2.5rem] w-full max-w-3xl p-6 md:p-8 shadow-[12px_12px_0px_0px_rgba(15,23,42,1)] relative max-h-[85vh] overflow-y-auto">
                      {/* Modal Body Helper */}
                      {(() => {
                        const lessonKey = `${selectedWeekForLesson.termIdx}_${selectedWeekForLesson.monthIdx}_${selectedWeekForLesson.weekIdx}`;
                        const aiPlan = weekLessons[lessonKey];
                        const isGenerating = generatingLessonIdx === lessonKey;
                        const termFocus = selectedWeekForLesson.termIdx === 0 ? term1Focus : term2Focus;
                        const chosenGame = selectedWeekForLesson.termIdx === 0 ? term1Game : term2Game;
                        
                        const activeType = modalLessonType;
                        const activeTopic = activeType === 'theory' 
                          ? (selectedWeekForLesson.week.theoryTopic || selectedWeekForLesson.week.topic)
                          : (selectedWeekForLesson.week.gameSkill || `${chosenGame} — Technical Drills & Match Play`);

                        const defaults = getCurriculumPlanLocal(
                          activeTopic,
                          selectedWeekForLesson.week.details,
                          termFocus,
                          grade,
                          activeType,
                          chosenGame
                        );

                        return (
                          <div>
                            {/* Modal Header */}
                            <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4 mb-4">
                              <div>
                                <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg inline-flex items-center gap-1.5 ${activeType === 'theory' ? 'bg-indigo-100 text-indigo-900 border border-indigo-200' : 'bg-emerald-100 text-emerald-900 border border-emerald-200'}`}>
                                  {activeType === 'theory' ? <BookOpen size={12} className="text-indigo-600" /> : <Trophy size={12} className="text-emerald-600" />}
                                  Term {selectedWeekForLesson.termIdx + 1} &bull; Week {selectedWeekForLesson.week.weekNumber} &bull; {activeType === 'theory' ? 'CBSE Theory Unit (Code 048)' : `On-Field Game: ${chosenGame}`}
                                </span>
                                <h3 className="text-xl md:text-2xl font-black text-slate-800 uppercase mt-2 leading-tight">
                                  {activeTopic}
                                </h3>
                                <p className="text-xs text-slate-500 font-semibold mt-1">
                                  Dates: {selectedWeekForLesson.week.dates} &bull; {activeType === 'theory' ? 'CBSE Syllabus Pacing: Units 1-10 complete by Nov 30, Pre-Boards in Dec, Practical in Jan' : `Practical Sport: ${chosenGame}`}
                                </p>
                              </div>
                              <button 
                                onClick={() => setSelectedWeekForLesson(null)}
                                className="p-1.5 px-3 bg-slate-100 border border-slate-300 rounded-xl text-slate-500 hover:text-slate-900 font-bold text-xs uppercase"
                              >
                                Close
                              </button>
                            </div>

                            {/* View Option Toggle Switcher inside Modal */}
                            <div className="flex items-center gap-2 p-1.5 bg-slate-100 border border-slate-200 rounded-2xl mb-6">
                              <button
                                type="button"
                                onClick={() => setModalLessonType('theory')}
                                className={`flex-1 py-2.5 px-3 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                                  activeType === 'theory'
                                    ? 'bg-indigo-600 text-white shadow-md'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                                }`}
                              >
                                <BookOpen size={14} />
                                <span>CBSE Theory Scheme Lesson (5-Stage)</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setModalLessonType('games')}
                                className={`flex-1 py-2.5 px-3 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                                  activeType === 'games'
                                    ? 'bg-emerald-600 text-white shadow-md'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                                }`}
                              >
                                <Trophy size={14} />
                                <span>On-Field Game Lesson Plan (5-Stage)</span>
                              </button>
                            </div>

                            <div className="space-y-6 text-left">
                              {lessonGeneratingError && (
                                <div className="p-3.5 bg-indigo-50 border border-indigo-200 text-indigo-950 text-xs font-bold rounded-xl flex items-center gap-2">
                                  <Sparkles size={16} className="text-indigo-600 flex-shrink-0 animate-pulse" />
                                  <span>{lessonGeneratingError}</span>
                                </div>
                              )}

                              {/* Summary card */}
                              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Pedagogical Details</span>
                                <p className="text-xs text-slate-750 font-semibold leading-relaxed mt-1">
                                  {selectedWeekForLesson.week.details}
                                </p>
                              </div>

                              {/* Objective */}
                              <div className="flex gap-3">
                                <GraduationCap className="text-[#FF6B00] shrink-0 mt-0.5" size={20} />
                                <div>
                                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Learning Objectives ({defaults.isTheory ? 'CBSE Theory' : 'PE Competency'})</h4>
                                  <p className="text-xs text-slate-600 font-medium leading-relaxed mt-1">
                                    {aiPlan ? `Know: ${aiPlan.objectives?.know || ''}. Understand: ${aiPlan.objectives?.understand || ''}. Apply: ${aiPlan.objectives?.beAbleTo || ''}` : defaults.objectives}
                                  </p>
                                </div>
                              </div>

                              {/* 5-Phase Lesson Structure */}
                              <div className="space-y-3 pt-2">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                                  Structured 5-Stage Session Plan ({defaults.isTheory ? 'Theory Classroom Format' : 'On-Field Sports Format'})
                                </span>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  {/* Phase 1: Starter / Warm-up */}
                                  <div className={`rounded-2xl p-4 border ${defaults.isTheory ? 'bg-indigo-50/60 border-indigo-200' : 'bg-rose-50/60 border-rose-200'}`}>
                                    <div className={`flex items-center gap-1.5 mb-1.5 font-extrabold uppercase text-[10px] tracking-wider ${defaults.isTheory ? 'text-indigo-700' : 'text-rose-700'}`}>
                                      {defaults.isTheory ? <Sparkles size={13} className="text-indigo-500 animate-pulse" /> : <Flame size={13} className="text-rose-500 animate-pulse" />}
                                      <span>{defaults.isTheory ? '1. Concept Starter & Hook (10m)' : '1. Dynamic Warm-Up (10m)'}</span>
                                    </div>
                                    <p className="text-[11px] text-slate-650 font-medium leading-relaxed">
                                      {aiPlan ? `${aiPlan.starter?.title || ''}: ${aiPlan.starter?.description || ''}` : `${defaults.starter.title}: ${defaults.starter.description}`}
                                    </p>
                                  </div>

                                  {/* Phase 2: Demonstration */}
                                  <div className="bg-amber-50/60 border border-amber-200 rounded-2xl p-4">
                                    <div className="flex items-center gap-1.5 mb-1.5 text-amber-800 font-extrabold uppercase text-[10px] tracking-wider">
                                      {defaults.isTheory ? <Presentation size={13} className="text-amber-600" /> : <Eye size={13} className="text-amber-600" />}
                                      <span>{defaults.isTheory ? '2. Demonstration & Lecture (10m)' : '2. Skill Demonstration & Technique (10m)'}</span>
                                    </div>
                                    <p className="text-[11px] text-slate-650 font-medium leading-relaxed">
                                      {aiPlan?.mainActivity?.activities?.[0] ? `${aiPlan.mainActivity.activities[0].title}: ${aiPlan.mainActivity.activities[0].description}` : `${defaults.demonstration.title}: ${defaults.demonstration.description}`}
                                    </p>
                                  </div>

                                  {/* Phase 3: Activity 1 */}
                                  <div className="bg-sky-50/60 border border-sky-200 rounded-2xl p-4">
                                    <div className="flex items-center gap-1.5 mb-1.5 text-sky-800 font-extrabold uppercase text-[10px] tracking-wider">
                                      {defaults.isTheory ? <FileSpreadsheet size={13} className="text-sky-600" /> : <Target size={13} className="text-sky-600" />}
                                      <span>{defaults.isTheory ? '3. Activity 1: Theory Drills & Numericals (15m)' : '3. Activity 1: Skill Progression Drills (15m)'}</span>
                                    </div>
                                    <p className="text-[11px] text-slate-650 font-medium leading-relaxed">
                                      {aiPlan?.mainActivity?.activities?.[1] ? `${aiPlan.mainActivity.activities[1].title}: ${aiPlan.mainActivity.activities[1].description}` : `${defaults.activity1.title}: ${defaults.activity1.description}`}
                                    </p>
                                  </div>

                                  {/* Phase 4: Activity 2 */}
                                  <div className={`rounded-2xl p-4 border ${defaults.isTheory ? 'bg-purple-50/60 border-purple-200' : 'bg-orange-50/60 border-orange-200'}`}>
                                    <div className={`flex items-center gap-1.5 mb-1.5 font-extrabold uppercase text-[10px] tracking-wider ${defaults.isTheory ? 'text-purple-800' : 'text-orange-800'}`}>
                                      {defaults.isTheory ? <GraduationCap size={13} className="text-purple-600" /> : <Trophy size={13} className="text-orange-600" />}
                                      <span>{defaults.isTheory ? '4. Activity 2: CBSE Board PYQs & Cases (10m)' : '4. Activity 2: Game Situation / Match Play (15m)'}</span>
                                    </div>
                                    <p className="text-[11px] text-slate-650 font-medium leading-relaxed">
                                      {aiPlan?.mainActivity?.activities?.[2] ? `${aiPlan.mainActivity.activities[2].title}: ${aiPlan.mainActivity.activities[2].description}` : `${defaults.activity2.title}: ${defaults.activity2.description}`}
                                    </p>
                                  </div>
                                </div>

                                {/* Phase 5: Plenary / Cool Down (Full Width) */}
                                <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-4">
                                  <div className="flex items-center gap-1.5 mb-1.5 text-emerald-800 font-extrabold uppercase text-[10px] tracking-wider">
                                    <CheckCircle2 size={13} className="text-emerald-600" />
                                    <span>{defaults.isTheory ? '5. Plenary & Mind Map Review (10m)' : '5. Cool-Down & Feedback Debrief (10m)'}</span>
                                  </div>
                                  <p className="text-[11px] text-slate-650 font-medium leading-relaxed">
                                    {aiPlan ? `${aiPlan.plenary?.title || ''}: ${aiPlan.plenary?.description || ''}` : `${defaults.plenary.title}: ${defaults.plenary.description}`}
                                  </p>
                                </div>
                              </div>

                              {/* Equipment & Safety row */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
                                <div className="space-y-1">
                                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Required Resources</span>
                                  <p className="text-xs text-slate-700 font-bold">
                                    {aiPlan ? aiPlan.equipment?.join(', ') : defaults.equipment}
                                  </p>
                                </div>
                                <div className="space-y-1">
                                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Safety & Precaution Indicators</span>
                                  <p className="text-xs text-rose-700 font-bold">
                                    {aiPlan ? aiPlan.safety?.join('; ') : defaults.safety}
                                  </p>
                                </div>
                              </div>

                            {/* Actions footer inside Modal */}
                            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 border-t">
                              <button
                                onClick={() => handleGenerateLessonForWeek(
                                  selectedWeekForLesson.termIdx,
                                  selectedWeekForLesson.monthIdx,
                                  selectedWeekForLesson.weekIdx,
                                  selectedWeekForLesson.week
                                )}
                                type="button"
                                disabled={isGenerating}
                                className="w-full sm:w-auto px-5 py-3 bg-gradient-to-r from-[#FF6B00] to-orange-600 hover:from-orange-600 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-sm flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 shrink-0"
                              >
                                {isGenerating ? <Loader2 className="animate-spin" size={14} /> : <Sparkles size={14} className="text-amber-300 animate-pulse" />}
                                <span>{aiPlan ? 'Regenerate lesson with AI' : 'Activate Deep AI Lesson'}</span>
                              </button>

                              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                                {onNavigate && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedWeekForLesson(null);
                                      onNavigate('weekly-planner');
                                    }}
                                    className="px-5 py-3 bg-indigo-50 border-2 border-indigo-200 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-black uppercase tracking-wider w-full sm:w-auto text-center flex items-center justify-center gap-1.5"
                                  >
                                    <CalendarDays size={14} />
                                    <span>Weekly Planner</span>
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => setSelectedWeekForLesson(null)}
                                  className="px-5 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-wider w-full sm:w-auto text-center"
                                >
                                  Got It
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                      })()}
                    </div>
                  </div>
                )}
             </div>
          )}

          {step < 4 && (
            <div className="flex justify-between mt-12 pt-8 border-t print:hidden">
              <button onClick={() => setStep(s => Math.max(1, s - 1))} disabled={step === 1} className="text-slate-400 font-bold uppercase tracking-widest text-xs hover:text-slate-800 transition-colors disabled:opacity-30">Back</button>
              {step < 3 && (
                <button onClick={() => setStep(s => s + 1)} className="bg-indigo-50 text-indigo-600 px-10 py-4 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-indigo-100 transition-all flex items-center space-x-2">
                  <span>Continue</span>
                  <ChevronRight size={16} />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default YearlyPlanner;