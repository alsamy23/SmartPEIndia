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
  GraduationCap
} from 'lucide-react';
import { BoardType, YearlyPlan, Language, LessonPlan } from '../types.ts';
import { generateYearlyPlan, generateLessonPlan } from '../services/geminiService.ts';
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
  const [term1Focus, setTerm1Focus] = useState('CBSE Units 1-5: Management of Sporting Events, Children & Women in Sports, Lifestyle Disease Yoga, CWSN, Sports & Nutrition + Term 1 Fitness Tests');
  const [term2Focus, setTerm2Focus] = useState('CBSE Units 6-10: Test & Measurement, Physiology & Injuries, Biomechanics, Psychology, Training in Sports + Board Practical File & Revision');
  
  const [plan, setPlan] = useState<YearlyPlan | null>(null);

  const applyCbsesyllabusDefaults = (selectedGrade: string, track: 'integrated' | 'theory' | 'practical') => {
    const cleanGrade = selectedGrade.trim();
    if (cleanGrade === '12' || cleanGrade === 'Class 12' || cleanGrade === 'Grade 12') {
      if (track === 'practical') {
        setTerm1Focus('Basketball & Football Advanced Match Tactics + SAI Khelo India Fitness Battery');
        setTerm2Focus('Volleyball / Badminton Match Proficiency + 30-Mark CBSE Practical Assessment File & Viva');
      } else {
        setTerm1Focus('CBSE Units 1-5: Management of Sporting Events, Children & Women, Lifestyle Disease Yoga, CWSN, Sports & Nutrition + Fitness Tests');
        setTerm2Focus('CBSE Units 6-10: Test & Measurement, Physiology & Injuries, Biomechanics, Sports Psychology, Training in Sports + Board Practical File & Revision');
      }
    } else if (cleanGrade === '11' || cleanGrade === 'Class 11' || cleanGrade === 'Grade 11') {
      if (track === 'practical') {
        setTerm1Focus('Athletics (Sprints & Relay) + SAI Khelo India Fitness Battery');
        setTerm2Focus('Team Games (Cricket / Basketball) + Practical Assessment Records');
      } else {
        setTerm1Focus('CBSE Units 1-5: Changing Trends & Career, Olympic Values, Yoga, CWSN, Physical Fitness & Wellness + Khelo India Battery');
        setTerm2Focus('CBSE Units 6-10: Test & Measurement, Anatomy & Physiology, Biomechanics, Psychology, Training & Doping + Practical Assessment & Revision');
      }
    } else if (cleanGrade === '9' || cleanGrade === '10' || cleanGrade === 'Class 9' || cleanGrade === 'Class 10') {
      setTerm1Focus('CBSE HPE Strand 1 (Team Sports & Athletics) & Strand 2 (Health, Postural Deformities & Balanced Diet)');
      setTerm2Focus('CBSE HPE Strand 2 (First Aid & Injury Protocols) & Strand 3 & 4 (SEWA Community Action, Yoga & Health Card)');
    } else {
      setTerm1Focus('Locomotor & Manipulative Agility, Fundamental Motor Skills & Khelo India Fitness Battery');
      setTerm2Focus('Team Sports Fundamentals (Football, Basketball, Kho-Kho) & Cooperative Games');
    }
  };

  useEffect(() => {
    const savedPlan = localStorage.getItem('peYearlyPlan');
    if (savedPlan) {
      try {
        const parsed = JSON.parse(savedPlan);
        setPlan(parsed);
        setStep(4);
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

  const getCurriculumPlanLocal = (topic: string, details: string, termFocus: string, currentGrade: string) => {
    const t = (topic || '').toLowerCase();
    const f = (termFocus || '').toLowerCase();
    
    // --- CBSE THEORY UNITS DETECTORS ---
    if (t.includes('event') || t.includes('fixture') || t.includes('tournament') || t.includes('committee') || t.includes('management') || t.includes('intramural') || t.includes('extramural')) {
      return {
        sport: 'CBSE PE Unit 1: Management of Sporting Events',
        objectives: `Understand planning, organizing, staffing, directing, and controlling; master drawing Knockout & League tournament fixtures with exact bye formulas ((N+1)/2, next power of 2 minus N) for Class ${currentGrade} CBSE exams.`,
        warmup: `10 min Concept Starter: Discussion on IPL/Olympic organizational committees (Publicity, Ground, Technical, Refreshment) and pre/during/post responsibilities.`,
        mainDrill: `25 min Theory & Problem Solving: Step-by-step mathematical fixture construction for 11, 13, 19, and 21 teams; calculating total matches (N-1), upper/lower half divisions, and cyclic/staircase league methods.`,
        cooldown: `10 min Board Practice: Solve 2 CBSE past-year 3-mark case studies and 2 MCQs on bye calculation formulas.`,
        assessment: `CBSE Marking Rubric: Fixture diagram accuracy, correct bye placement (lower half bottom, upper half top, etc.), and committee duties recall.`,
        equipment: `Smartboard / Whiteboard, CBSE NCERT PE Textbook, Graph/Chart papers, geometry ruler.`,
        safety: `Ensure students follow structured step-by-step drawing protocols to avoid mathematical fixture calculation errors.`
      };
    }

    if (t.includes('women') || t.includes('child') || t.includes('postur') || t.includes('deform') || t.includes('flat foot') || t.includes('knock knee') || t.includes('lordosis') || t.includes('kyphosis') || t.includes('scoliosis') || t.includes('female athlete')) {
      return {
        sport: 'CBSE PE Unit 2: Children and Women in Sports',
        objectives: `Examine WHO exercise recommendations; diagnose common postural deformities (Kyphosis, Lordosis, Scoliosis, Knock Knees, Flat Foot) and analyze the Female Athlete Triad (Osteoporosis, Amenorrhea, Eating Disorders) for Class ${currentGrade}.`,
        warmup: `10 min Physical Demonstration: Visual posture alignment assessment against plumb lines; observe spine curvature and arch of the foot.`,
        mainDrill: `25 min Corrective Exercises & Theory: Practice corrective yoga/physiotherapy movements (Tadasana for Flat Foot, Gomukhasana for Round Shoulders, Chakrasana for Kyphosis, Padmasana for Knock Knees); analyze physiological factors behind female athlete triad.`,
        cooldown: `10 min Summary & Board Prep: Tabulate deformity vs corrective measures; solve 3 CBSE board assertion-reason questions.`,
        assessment: `Diagnostic evaluation: Accurately matching postural deformities with root causes and corrective exercise protocols.`,
        equipment: `Yoga mats, posture grids, NCERT diagrams, demonstration charts.`,
        safety: `Perform corrective spinal extensions gently; avoid forceful hyperextensions on students with existing spinal discomfort.`
      };
    }

    if (t.includes('lifestyle') || t.includes('obesity') || t.includes('diabetes') || t.includes('asthma') || t.includes('hypertension') || t.includes('back pain') || (t.includes('yoga') && (t.includes('disease') || t.includes('prevent')))) {
      return {
        sport: 'CBSE PE Unit 3: Yoga as Preventive Measure for Lifestyle Diseases',
        objectives: `Master therapeutic yoga asanas for 5 lifestyle disorders (Obesity, Diabetes, Asthma, Hypertension, Back Pain/Arthritis) including procedures, benefits, and contraindications.`,
        warmup: `10 min Gentle Joint Mobilization: Sukshma Vyayama, neck rotations, wrist extensions, and gentle diaphragmatic breathing (Pranayama).`,
        mainDrill: `25 min Asana Practice & Theory: Step-by-step execution and diagnostic justification: Tadasana, Katichakrasana, Pavanmuktasana (Obesity); Bhujangasana, Paschimottanasana (Diabetes); Sukhasana, Matsyasana (Asthma); Tadasana, Vakrasana (Hypertension); Shalabhasana, Vakrasana (Back Pain).`,
        cooldown: `10 min Shavasana & Reflection: Progressive neuromuscular relaxation, breath normalization, and Contraindication checklist recap.`,
        assessment: `Asana Rubric & Board Test: Flawless posture hold, correct breathing rhythm, and reciting contraindications for each condition.`,
        equipment: `Non-slip yoga mats, bolster cushions, textbook asana charts.`,
        safety: `Hypertensive students must NOT perform head-lowering inverted asanas or strenuous breath retentions (Kumbhaka).`
      };
    }

    if (t.includes('cwsn') || t.includes('divyang') || t.includes('special olympic') || t.includes('paralympic') || t.includes('deaflympic') || t.includes('adaptive')) {
      return {
        sport: 'CBSE PE Unit 4: PE & Sports for CWSN (Children with Special Needs)',
        objectives: `Understand adaptive physical education aims, roles of professionals (Counselor, Occupational Therapist, Physiotherapist, PE Teacher, Speech Therapist), and global disability sports organizations.`,
        warmup: `10 min Sensory Awareness Drill: Blindfolded partner walk or seated balloon tapping to build sensory inclusion empathy.`,
        mainDrill: `25 min Curriculum Analysis: Deep dive into Special Olympics Bharat, Paralympics (classification and divisioning), Deaflympics, and inclusion strategies in regular physical education classes.`,
        cooldown: `10 min Group Discussion: Identify 3 inclusive modifications (TREE framework) for school sports day.`,
        assessment: `Knowledge Verification: Differentiating Special Olympics vs Paralympics; articulating the professional roles in IEP (Individualized Education Plan).`,
        equipment: `Bell-balls, blindfolds, wheelchair/seated equipment, inclusion guideline charts.`,
        safety: `Maintain clear, obstruction-free floor space and clear communication cues for all adaptive drills.`
      };
    }

    if (t.includes('nutrition') || t.includes('diet') || t.includes('nutrient') || t.includes('macro') || t.includes('micro') || t.includes('food myth') || t.includes('weight control')) {
      return {
        sport: 'CBSE PE Unit 5: Sports and Nutrition',
        objectives: `Analyze components of a balanced diet, differentiate macro (Carbs, Fats, Proteins) vs micro (Vitamins, Minerals) nutrients, calculate BMI, and debunk dieting pitfalls and food myths for Class ${currentGrade}.`,
        warmup: `10 min Nutrition Log Review: Calculate personal BMI = Weight (kg) / Height (m)², and categorize into WHO BMI categories.`,
        mainDrill: `25 min Core Concepts & Case Studies: Daily calorie requirements for athletes, nutritive vs non-nutritive components (Water, Roughage, Color, Flavor), food intolerances vs food allergies, pitfalls of crash dieting.`,
        cooldown: `10 min Board MCQ Quiz: Review water-soluble (B, C) vs fat-soluble (A, D, E, K) vitamins and their deficiency symptoms.`,
        assessment: `Problem-Solving Rubric: Designing a balanced athlete meal plan and identifying vitamin/mineral deficiencies.`,
        equipment: `Stadiometer, weighing scale, nutrient flashcards, NCERT nutrition tables.`,
        safety: `Discourage unscientific calorie-restriction habits and emphasize wholesome hydration and balanced nourishment.`
      };
    }

    if (t.includes('test') || t.includes('measurement') || t.includes('evaluation') || t.includes('khelo india') || t.includes('barrow') || t.includes('harvard') || t.includes('rikli') || t.includes('fitness battery')) {
      return {
        sport: 'CBSE PE Unit 6: Test and Measurement in Sports',
        objectives: `Conduct SAI Khelo India National Fitness Test battery; compute Fitness Index via Harvard Step Test; administer Barrow 3-item motor ability and Rikli & Jones senior citizen tests.`,
        warmup: `10 min Pulse Check & Dynamic Warm-up: Learn radial/carotid pulse measurement for 15 seconds; light cardiovascular jog.`,
        mainDrill: `25 min Field Lab Station Testing: Administer Harvard Step Test (5-minute step up/down on 20-inch bench, measure recovery pulses at 1-1.5m, 2-2.5m, 3-3.5m) using Fitness Index = (100 x test duration in seconds) / (2 x sum of recovery pulse beats).`,
        cooldown: `10 min Recovery Heart Rate Graphing: Record recovery pulse rates, calculate individual Fitness Index scores, and map to CBSE norms.`,
        assessment: `Standard Protocol Adherence: Metronome cadence precision (30 steps/min), stopwatch timing, and formula calculation accuracy.`,
        equipment: `20-inch sturdy stepping bench / gymnasium box, metronome/audio cadence, stopwatches, heart rate logs.`,
        safety: `Stop immediately if student exhibits extreme dizziness, hyperventilation, or chest discomfort during aerobic trials.`
      };
    }

    if (t.includes('injury') || t.includes('injuries') || t.includes('physiology') || t.includes('first aid') || t.includes('price') || t.includes('fracture') || t.includes('sprain') || t.includes('strain') || t.includes('cardiorespiratory')) {
      return {
        sport: 'CBSE PE Unit 7: Physiology & Injuries in Sports',
        objectives: `Understand physiological factors determining physical fitness components; categorize sports injuries (Soft tissue, Bone, Joint) and demonstrate the PRICE first aid protocol for Class ${currentGrade}.`,
        warmup: `10 min Physiological Observation: Measure resting heart rate vs post-jumping jack heart rate to observe stroke volume and cardiac output responses.`,
        mainDrill: `25 min Injury Classification & First Aid Lab: Soft tissue injuries (Contusion, Abrasion, Laceration, Incision, Sprain vs Strain); Bone fractures (Greenstick, Comminuted, Transverse, Oblique, Impacted); Joint dislocations; Hands-on PRICE application (Protect, Rest, Ice, Compression, Elevation).`,
        cooldown: `10 min Practical Debrief: Wrap a model ankle joint using crepe compression bandage; recite 4-step emergency evaluation.`,
        assessment: `First Aid Mastery Rubric: Correct crepe bandage compression pressure, ice pack application duration (15-20 mins), and differentiation between ligament sprain vs muscle strain.`,
        equipment: `First aid medical kit, ice packs/gel wraps, crepe bandages, triangular slings, injury illustration cards.`,
        safety: `Never apply direct ice directly onto bare skin; always wrap ice in a thin towel to prevent cold burn/frostbite.`
      };
    }

    if (t.includes('biomechanic') || t.includes('lever') || t.includes('newton') || t.includes('equilibrium') || t.includes('friction') || t.includes('projectile')) {
      return {
        sport: 'CBSE PE Unit 8: Biomechanics and Sports',
        objectives: `Apply Newton's 3 Laws of Motion to sports; classify 1st, 2nd, and 3rd Class anatomical levers (Fulcrum, Effort, Load); analyze Centre of Gravity, Equilibrium, and Projectile Motion.`,
        warmup: `10 min Physics-in-Motion Warm-up: Sprint starts and jump stops demonstrating inertia, action-reaction, and wide-base stability.`,
        mainDrill: `25 min Biomechanical Analysis: Class 1 lever (Nodding head / triceps extension - Fulcrum in middle); Class 2 lever (Calf raise / plantar flexion - Load in middle); Class 3 lever (Bicep curl / kicking - Effort in middle); Newton's laws in high jump, swimming starts, and javelin launch angle (45° in vacuum vs ~35°-38° with aerodynamic drag).`,
        cooldown: `10 min Diagram Lab: Draw and label anatomical lever classes; answer 2 CBSE case-study scenario questions.`,
        assessment: `Physics Concept Application: Accurately identifying fulcrum, load, and effort points in body joints during sports movements.`,
        equipment: `Medicine balls, javelins/footballs for launch observation, skeleton anatomical lever model, whiteboard.`,
        safety: `Use controlled weights for lever demonstrations to prevent excessive tendon strain at mechanical disadvantage.`
      };
    }

    if (t.includes('psycholog') || t.includes('personality') || t.includes('motivation') || t.includes('aggression') || t.includes('imagery') || t.includes('self-esteem')) {
      return {
        sport: 'CBSE PE Unit 9: Psychology and Sports',
        objectives: `Analyze personality dimensions (Carl Jung classification & Big Five traits), differentiate intrinsic vs extrinsic motivation, explore exercise adherence, and classify types of sports aggression.`,
        warmup: `10 min Mental Focus Routine: 3 minutes of box breathing (4s in, 4s hold, 4s out, 4s hold) and positive mental imagery for free-throw shooting.`,
        mainDrill: `25 min Psychological Case Studies: Extroverts vs Introverts in sports selection; Big Five (OCEAN: Openness, Conscientiousness, Extraversion, Agreeableness, Neuroticism); Aggression in sports: Hostile (harm intent) vs Instrumental (goal-directed within rules) vs Assertive behavior.`,
        cooldown: `10 min Reflective Journaling: Students identify 2 intrinsic motivators for daily physical fitness and 1 goal-setting strategy.`,
        assessment: `Analytical Rubric: Distinguishing between instrumental aggression and foul play; applying self-talk techniques to athletic performance.`,
        equipment: `Case study reflection worksheets, psychological trait checklists, timer.`,
        safety: `Foster an emotionally safe, non-judgmental classroom environment for personality and mental health discussions.`
      };
    }

    if (t.includes('training') || t.includes('doping') || t.includes('periodization') || t.includes('circuit') || t.includes('fartlek') || t.includes('interval') || t.includes('isometric') || t.includes('isotonic')) {
      return {
        sport: 'CBSE PE Unit 10: Training in Sports & Doping',
        objectives: `Structure training periodization cycles (Micro, Meso, Macro); compare strength training methods (Isometric, Isotonic, Isokinetic); design continuous, interval, and Fartlek endurance sessions; examine WADA/NADA anti-doping regulations.`,
        warmup: `10 min Heart Rate Elevation: Progressive 4-station pulse-raising circuit (skipping, high knees, squat holds, lateral hops).`,
        mainDrill: `25 min Training Methodology & Anti-Doping: Strength methods (Hettinger & Muller isometrics, DeLorme isotonics); Swedish Fartlek speed-play design; Circuit training station layout; WADA Prohibited List (Anabolic steroids, peptide hormones, blood doping, stimulants) and health hazards.`,
        cooldown: `10 min Circuit Cool-Down: Static stretching of major muscle groups, hydration, and review of WADA anti-doping testing protocols.`,
        assessment: `Training Architecture Rubric: Designing an age-appropriate 8-station circuit training routine with proper work-to-rest ratios.`,
        equipment: `Agility cones, medicine balls, skipping ropes, exercise mats, stopwatches, WADA guideline charts.`,
        safety: `Ensure strict work-to-rest intervals (1:1 or 1:2) to prevent overtraining syndrome and acute muscle exhaustion.`
      };
    }

    if (t.includes('olympic') || t.includes('ancient') || t.includes('ioa') || t.includes('values')) {
      return {
        sport: 'CBSE PE: Olympic Value Education',
        objectives: `Understand ancient vs modern Olympic history, Olympic symbols, rings, flag, flame, motto (Citius, Altius, Fortius - Communiter), and the structure of the Indian Olympic Association (IOA).`,
        warmup: `10 min Olympic Trivia Starter: Quick recall of Pierre de Coubertin, 1896 Athens Games, and India's historic Olympic hockey & athletic medals.`,
        mainDrill: `25 min History & Values Lecture: The 5 interlaced Olympic rings representing 5 inhabited continents; Olympic values (Excellence, Friendship, Respect); Paralympic and Special Olympic values; role of IOA in Indian athlete selection.`,
        cooldown: `10 min Board Review: Diagram of Olympic rings with exact color alignment (Blue, Yellow, Black, Green, Red) and past exam questions.`,
        assessment: `Historical & Value Recall: Accurate breakdown of Olympic charter values and IOA governance.`,
        equipment: `Olympic charts, multimedia presentation, worksheets.`,
        safety: `Standard classroom safety.`
      };
    }

    // --- PRACTICAL ON-FIELD SPORTS DETECTORS ---
    if (t.includes('foot') || t.includes('soccer') || f.includes('foot')) {
      return {
        sport: 'Football',
        objectives: `Master inside-foot accuracy, ball-control agility, and spatial positioning during small-sided transition plays suitable for Grade ${currentGrade}.`,
        warmup: `10 min active warm-up: 2 laps slow jog, high knees, ankle dynamic rotations, lateral defensive shuffles.`,
        mainDrill: `25 min core drills: Cones zigzag dribbling sprints, partner push passing across 10m gates with instant return touch, ending with defensive 3v2 keep-away drills.`,
        cooldown: `10 min recovery: Slo-mo recovery walks, static hamstring and groin stretches, team debriefing on foot alignment.`,
        assessment: `Performance evaluation rubric: Passing accuracy, foot contact point, posture alignment under match pressure.`,
        equipment: `Size 4/5 Footballs, marker cones, whistle, stopwatch, primary team bibs.`,
        safety: `Check ground for loose stones, ensure safe spacing between drill channels, keep students hydrated.`
      };
    }
    
    if (t.includes('basket') || f.includes('basket')) {
      return {
        sport: 'Basketball',
        objectives: `Improve chest pass velocity, dribbling ball-handling heights, and proper step layup approach coordination according to Grade ${currentGrade} CBSE syllabus.`,
        warmup: `10 min active warm-up: Sideways sliding runs, fingertip basketball tapping, self-toss backboard catch, calf explosive jumps.`,
        mainDrill: `25 min core drills: Passing lines (double-handed chest & bounce passes), three-player motion weaving tracks ending in lay-ups, static shooting form repetition.`,
        cooldown: `10 min recovery: Arm rotations, overhead shoulder stretches, breathing deceleration routines, group reflection on pass accuracy.`,
        assessment: `Motor control scoring: Correct thumb-down release follow-through, dribbling protective posture, layup foot rhythm.`,
        equipment: `Size 6/7 Basketballs, training cones, team bibs, stopwatch.`,
        safety: `Ensure correct footwear to avoid ankle slips, enforce strict clean defensive contact rules, no hanging on hoops.`
      };
    }

    if (t.includes('volley') || f.includes('volley')) {
      return {
        sport: 'Volleyball',
        objectives: `Establish sturdy underhand bump reception platform and overhand serving mechanics aligned with Class ${currentGrade} standards.`,
        warmup: `10 min active warm-up: Line-shuffling exercises, shoulder clock-wise rotation loops, wrist and finger extension holds, light block jumps.`,
        mainDrill: `25 min core drills: Overhead setting and underhand bumping drills against wall, double-partner bump-overhead sequences, target-court serve practice.`,
        cooldown: `10 min recovery: Standing trunk twists, static arm shoulder crossovers, diaphragmatic breathing cycles.`,
        assessment: `Technical check-list: Arm platform steadiness, contact speed, body balance during high ball receptions.`,
        equipment: `Soft-touch Volleyballs, training nets, cones, whistles.`,
        safety: `Protect hands during spikes, coordinate calling 'mine' for loose balls to avoid collision accidents.`
      };
    }

    if (t.includes('athlet') || t.includes('sprint') || t.includes('run') || f.includes('athlet') || f.includes('fitness')) {
      return {
        sport: 'Athletics & Physical Fitness',
        objectives: `Improve crouch start explosive acceleration, standard pace breathing control, and relay-baton handoff timing protocols.`,
        warmup: `10 min active warm-up: Dynamic leg swings, high knees, butt kicks, progressive acceleration sprints over 30m.`,
        mainDrill: `25 min core drills: Crouch starts from blocks with 15m drive-phase releases, blind baton exchange passes in pairs, mid-distance endurance pacing track laps.`,
        cooldown: `10 min recovery: Deep static quad stretches, slow recovery pacing walks, light chest extensions and deep inhalation.`,
        assessment: `Athletic speed indicators: Acceleration drive angle, baton hand-off exchange safety, track discipline.`,
        equipment: `Baton sticks, starter blocks, stopwatch, measuring tape, lane cones.`,
        safety: `Run strictly in allocated track lanes, wear standard running shoes, clear workspace before throwing/sprinting events.`
      };
    }

    if (t.includes('yoga') || t.includes('asana')) {
      return {
        sport: 'Yoga & Fitness',
        objectives: `Improve posture balance, structural flexibility, and core abdominal endurance tracking via Khelo India fitness tests.`,
        warmup: `10 min active warm-up: Neck rolls, gentle spinal cat-cow arches, joint lubrication circles, light pacing walks.`,
        mainDrill: `25 min core drills: 12-stage Sun Salutation forms (Surya Namaskar) under breathing coordination, followed by core strength sit-ups or static posture balance holds (Vrikshasana).`,
        cooldown: `10 min recovery: Complete Shavasana deep relaxation progressive muscle scanning, controlled deep soundless diaphragmatic breathing cycles.`,
        assessment: `Physical criteria testing: Posture alignment accuracy, flexibility stretch levels (sit-and-reach scores), core muscular endurance counts.`,
        equipment: `Individual eco yoga mats, stopwatch, sit-and-reach assessment boxes.`,
        safety: `Perform poses slowly without jerky force, maintain deep slow breathing, stop instantly if dizziness or joint strain occurs.`
      };
    }

    return {
      sport: termFocus || 'General P.E.',
      objectives: `Enhance general motor skill coordination, cardiorespiratory endurance, and tactical gameplay understanding for Grade ${currentGrade} CBSE syllabus.`,
      warmup: `10 min active warm-up: Intermittent jogging loops, dynamic flexibility stretches, and lateral skip runs.`,
      mainDrill: `25 min core drills: Specific target coordination exercises, partner passing speed trails, and cooperative active team mini-game drills.`,
      cooldown: `10 min recovery: Restorative static stretching, slow-paced recovery breathing, and skill feedback session.`,
      assessment: `Formative observation: Motor coordination, spatial awareness, and peer cooperation.`,
      equipment: `Marker cones, relay batons, soft foam balls, whistle.`,
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
        subject: "Physical Education",
        grade: plan.grade,
        date: week.dates || "Today",
        topic: week.topic,
        period: "1",
        termWeek: `Term ${tIdx + 1} / Wk ${week.weekNumber}`,
        duration: plan.duration || "40 min",
        equipment: defaults.equipment.split(', '),
        teachingAids: ['Whistle', 'Marker cones', 'Tactical board'],
        safety: defaults.safety.split(', '),
        keyVocabulary: [defaults.sport, 'Form', 'Coordination', 'Athleticism'],
        sen: {
          wave1: 'Provide larger markers, gentle speed targets, and frequent rests.',
          wave2: 'Assign peer-mentors, reduce distance bounds, and use colorful equipment.',
          wave3: 'Offer custom one-on-one guided exercises and soft-touch balls.'
        },
        objectives: {
          know: `Know the basic rules, positions, and defensive strategies for ${defaults.sport}.`,
          understand: `Understand body posture mechanics and team communication.`,
          beAbleTo: defaults.objectives
        },
        successCriteria: {
          all: 'Participate actively in warm-up routines and basic skill repetitions with positive attitude.',
          most: 'Execute the core skill correctly during controlled partner drills with steady mechanics.',
          some: 'Apply the skill adaptively in matches or tactical group scenarios.'
        },
        starter: {
          time: '10 min',
          title: 'Dynamic Warm-Up & Physical Prep',
          description: defaults.warmup
        },
        mainActivity: {
          time: '25 min',
          activities: [
            {
              title: 'Skill Adaptation Drill Loop',
              description: defaults.mainDrill,
              coachingPoints: [
                'Maintain high chest posture and visual awareness.',
                'Coordinate breathing cycles with dynamic explosive reps.',
                'Prioritize team-focused spatial spacing.'
              ]
            }
          ]
        },
        plenary: {
          time: '10 min',
          title: 'Cool-down & Review Debate',
          description: defaults.cooldown
        },
        homework: `Practice the target posture repetitions at home; watch professional video highlights.`,
        collaboration: `Partner passing loops during the week; peer scoring sheets review.`,
        differentiation: `Accommodate varied stamina speeds by adjusting court size boundaries.`,
        criticalThinking: `Ask students: "Why is balance critical to pass direction control?"`,
        warmupDiagramPrompt: `Diagram showing standard warmup pathways.`,
        explanationDiagramPrompt: `Diagram showing standard technical skill execution.`,
        gameDiagramPrompt: `Diagram showing standard game training space setup.`
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
      const result = await generateYearlyPlan(grade, board, frequency, calendarText, term1Focus, term2Focus, startDate, duration, language, planTrack);
      setPlan(result);
      localStorage.setItem('peYearlyPlan', JSON.stringify(result));
      setStep(4);
    } catch (err: any) {
      setError(err.message || "Failed to generate plan.");
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
                <th width="50">Week</th>
                <th width="100">Dates</th>
                <th width="80">Status</th>
                <th width="150">Topic</th>
                <th>Details</th>
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
              <td><b>${week.topic || '-'}</b></td>
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
    csv += "Term,Month,Week,Dates,Status,Topic,Details\n";
    
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
              <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles size={14} className="text-[#FF6B00]" />
                  <span>Curriculum Auto-Presets for Grade {grade}:</span>
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => applyCbsesyllabusDefaults('12', planTrack)}
                    className="px-3 py-1.5 bg-white border border-slate-300 hover:border-indigo-500 rounded-lg text-[10px] font-black uppercase text-slate-700 hover:text-indigo-600 transition-colors"
                  >
                    Class 12 Units (048)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyCbsesyllabusDefaults('11', planTrack)}
                    className="px-3 py-1.5 bg-white border border-slate-300 hover:border-indigo-500 rounded-lg text-[10px] font-black uppercase text-slate-700 hover:text-indigo-600 transition-colors"
                  >
                    Class 11 Units (048)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyCbsesyllabusDefaults('10', planTrack)}
                    className="px-3 py-1.5 bg-white border border-slate-300 hover:border-indigo-500 rounded-lg text-[10px] font-black uppercase text-slate-700 hover:text-indigo-600 transition-colors"
                  >
                    Class 9/10 HPE
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="bg-indigo-50 p-6 rounded-3xl border border-indigo-100">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-bold text-indigo-900">Term 1 Focus / Syllabus Units (Apr - Sep)</h4>
                      <span className="text-[10px] font-bold uppercase text-indigo-500 bg-white px-2 py-0.5 rounded">6 Months</span>
                    </div>
                    <textarea 
                      rows={3}
                      value={term1Focus} 
                      onChange={e => setTerm1Focus(e.target.value)} 
                      className="w-full p-4 bg-white border rounded-xl font-bold text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-y" 
                    />
                 </div>
                 <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-bold text-emerald-900">Term 2 Focus / Syllabus Units (Oct - Mar)</h4>
                      <span className="text-[10px] font-bold uppercase text-emerald-600 bg-white px-2 py-0.5 rounded">6 Months</span>
                    </div>
                    <textarea 
                      rows={3}
                      value={term2Focus} 
                      onChange={e => setTerm2Focus(e.target.value)} 
                      className="w-full p-4 bg-white border rounded-xl font-bold text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-300 resize-y" 
                    />
                 </div>
              </div>
              <div className="flex justify-center">
                 <button onClick={handleGenerate} disabled={loading} className="bg-slate-900 text-white px-12 py-5 rounded-2xl font-black text-lg flex items-center space-x-3 shadow-xl hover:scale-105 active:scale-95 transition-all">
                   {loading ? <Loader2 className="animate-spin" /> : <Sparkles size={20} />}
                   <span>{loading ? 'Designing Master Plan...' : 'Generate Plan'}</span>
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

                  {plan.terms?.length === 0 ? (
                    <div className="p-12 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                      <AlertCircle className="mx-auto text-slate-300 mb-4" size={48} />
                      <p className="text-slate-400 font-bold uppercase tracking-widest">No plan data generated. Please try again.</p>
                    </div>
                  ) : (
                    plan.terms?.map((term, tIdx) => (
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
                                        <input 
                                          className="w-full font-black text-slate-800 bg-transparent outline-none focus:text-indigo-600 transition-colors pointer-events-auto" 
                                          value={week.topic} 
                                          onClick={(e) => e.stopPropagation()} // stop popup if clicking input
                                          onChange={(e) => handleUpdatePlan(tIdx, mIdx, wIdx, 'topic', e.target.value)} 
                                        />
                                        
                                        {week.status === 'Instructional' && week.details && (
                                          <div className="mt-3 pt-3 border-t border-slate-100/50">
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
                  )}
                </div>

                {/* Lesson Plan Integrator Modal */}
                {selectedWeekForLesson && (
                  <div className="fixed inset-0 bg-slate-950/65 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white border-4 border-slate-900 rounded-[2.5rem] w-full max-w-2xl p-6 md:p-8 shadow-[12px_12px_0px_0px_rgba(15,23,42,1)] relative max-h-[85vh] overflow-y-auto">
                      {/* Modal Header */}
                      <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4 mb-6">
                        <div>
                          <span className="px-2.5 py-1 bg-indigo-150 text-indigo-700 text-[10px] font-black uppercase tracking-wider rounded-lg">
                            Term {selectedWeekForLesson.termIdx + 1} &bull; Week {selectedWeekForLesson.week.weekNumber} Lesson Integrator
                          </span>
                          <h3 className="text-xl md:text-2xl font-black text-slate-800 uppercase mt-1.5 leading-tight">
                            {selectedWeekForLesson.week.topic}
                          </h3>
                          <p className="text-xs text-slate-400 font-semibold mt-1">
                            Dates: {selectedWeekForLesson.week.dates} &bull; Primary Pacing focused on "{selectedWeekForLesson.termIdx === 0 ? term1Focus : term2Focus}"
                          </p>
                        </div>
                        <button 
                          onClick={() => setSelectedWeekForLesson(null)}
                          className="p-1.5 px-3 bg-slate-100 border border-slate-300 rounded-xl text-slate-500 hover:text-slate-900 font-bold text-xs uppercase"
                        >
                          Close
                        </button>
                      </div>

                      {/* Modal Body */}
                      {(() => {
                        const monthObj = plan?.terms[selectedWeekForLesson.termIdx]?.months[selectedWeekForLesson.monthIdx];
                        const monthName = monthObj ? monthObj.monthName : '';
                        const lessonKey = `${selectedWeekForLesson.termIdx}_${monthName}_${selectedWeekForLesson.weekIdx}`;
                        const aiPlan = weekLessons[lessonKey];
                        const isGenerating = generatingLessonIdx === lessonKey;
                        const termFocus = selectedWeekForLesson.termIdx === 0 ? term1Focus : term2Focus;
                        
                        const defaults = getCurriculumPlanLocal(
                          selectedWeekForLesson.week.topic,
                          selectedWeekForLesson.week.details,
                          termFocus,
                          grade
                        );

                        return (
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
                                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Learning Objectives (CBSE aligned)</h4>
                                <p className="text-xs text-slate-600 font-medium leading-relaxed mt-1">
                                  {aiPlan ? `Know: ${aiPlan.objectives?.know || ''}. Understand: ${aiPlan.objectives?.understand || ''}. Apply: ${aiPlan.objectives?.beAbleTo || ''}` : defaults.objectives}
                                </p>
                              </div>
                            </div>

                            {/* Structure blocks */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                              <div className="bg-rose-50/50 border border-rose-100 rounded-2xl p-4">
                                <div className="flex items-center gap-1.5 mb-1.5 text-rose-700 font-extrabold uppercase text-[10px] tracking-wider">
                                  <Dumbbell size={12} className="text-rose-500 animate-pulse" />
                                  <span>Warm-Up (10m)</span>
                                </div>
                                <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                                  {aiPlan ? `${aiPlan.starter?.title || ''}: ${aiPlan.starter?.description || ''}` : defaults.warmup}
                                </p>
                              </div>

                              <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-4">
                                <div className="flex items-center gap-1.5 mb-1.5 text-indigo-700 font-extrabold uppercase text-[10px] tracking-wider">
                                  <BookOpen size={12} className="text-indigo-500 animate-pulse" />
                                  <span>Central Drills (25m)</span>
                                </div>
                                <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                                  {aiPlan ? ((Array.isArray(aiPlan.mainActivity?.activities) ? aiPlan.mainActivity.activities : []).map(a => `${a.title || 'Drill'}: ${a.description || ''}`).join('; ') || '') : defaults.mainDrill}
                                </p>
                              </div>

                              <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-4">
                                <div className="flex items-center gap-1.5 mb-1.5 text-emerald-700 font-extrabold uppercase text-[10px] tracking-wider">
                                  <Award size={12} className="text-emerald-500" />
                                  <span>Cool-Down (10m)</span>
                                </div>
                                <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                                  {aiPlan ? `${aiPlan.plenary?.title || ''}: ${aiPlan.plenary?.description || ''}` : defaults.cooldown}
                                </p>
                              </div>
                            </div>

                            {/* Equipment & Safety row */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
                              <div className="space-y-1">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Required Equipment</span>
                                <p className="text-xs text-slate-700 font-bold">
                                  {aiPlan ? aiPlan.equipment?.join(', ') : defaults.equipment}
                                </p>
                              </div>
                              <div className="space-y-1">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Safety Warning Indicators</span>
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