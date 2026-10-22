import { TestPaper } from '../types.ts';

/**
 * High-Yield CBSE Practical Assessment Rubric Fallback
 */
export const buildGamesRubricFallback = (
  sport: string,
  totalMarks: number,
  numSkills: number,
  components: string[] = []
) => {
  const s = (sport || 'General Sports').trim();
  const lower = s.toLowerCase();

  let defaultSkills = [
    { name: 'Core Ball / Implement Control & Grip', criteria: ['Demonstrates correct preparatory stance and body balance', 'Executes fluid hand-eye or foot-eye coordination under pressure'] },
    { name: 'Passing & Tactical Distribution', criteria: ['Accurate trajectory, appropriate speed, and team positioning', 'Scans court/field before releasing pass'] },
    { name: 'Finishing / Scoring Technique', criteria: ['Correct biomechanical kinematic chain and follow-through', 'Consistency and target placement against opposition'] },
    { name: 'Defensive Positioning & Footwork', criteria: ['Maintains low center of gravity and lateral mobility', 'Anticipates opponent moves and enforces clean legal contact'] },
    { name: 'Game Sense & Tactical Decision Making', criteria: ['Understands spatial awareness, transition offense/defense', 'Demonstrates sportsmanship and adheres to official rules'] }
  ];

  if (lower.includes('football') || lower.includes('soccer')) {
    defaultSkills = [
      { name: 'Dribbling & Close Ball Control', criteria: ['Controlled touch with inside/outside of both feet', 'Shields ball effectively with low center of gravity'] },
      { name: 'Short & Long Passing Accuracy', criteria: ['Non-kicking foot planted firmly pointing toward target', 'Crisp ground push-pass and accurate lofted delivery'] },
      { name: 'Shooting Mechanics & Finishing', criteria: ['Strikes through center of ball with laces/instep', 'Controlled follow-through with torso leaning over ball'] },
      { name: 'Ball Trapping & Receiving', criteria: ['Cushions incoming ball with sole, inside foot, or chest', 'Immediately sets ball into space away from opponent'] }
    ];
  } else if (lower.includes('basket')) {
    defaultSkills = [
      { name: 'Dribbling & Crossover Footwork', criteria: ['Fingertip control below waist without looking down', 'Explosive crossover hesitation and protect-arm stance'] },
      { name: 'Passing Mechanics (Chest, Bounce, Overhead)', criteria: ['Steps into pass with two-handed outward thumb snap', 'Delivers crisp passes directly into teammate chest pocket'] },
      { name: 'Shooting Form (BEEF Principles & Layup)', criteria: ['Balance, Eyes, Elbow under ball, Follow-through wrist snap', 'Correct right/left knee lift and backboard angle on layups'] },
      { name: 'Defensive Stance & Rebounding Box-Out', criteria: ['Low athletic stance with active hands and rapid slide steps', 'Physical box-out and aggressive two-handed high-point rebound'] }
    ];
  } else if (lower.includes('badminton')) {
    defaultSkills = [
      { name: 'Grip Technique & Racket Handling', criteria: ['Seamless V-grip transition between forehand and backhand', 'Relaxed fingers tightening at the exact moment of shuttle impact'] },
      { name: 'Service (Low Doubles & High Singles)', criteria: ['Smooth underhand pendulum swing below waist height', 'Consistent trajectory grazing net tape or deep to rear line'] },
      { name: 'Overhead Clear & Drop Shot', criteria: ['Full shoulder rotation with high contact point and forearm pronation', 'Deceptive preparation with soft touch placement just over net'] },
      { name: 'Court Footwork & Shadow Movements', criteria: ['Split-step reaction and chassé recovery back to base center T', 'Lunge landing on heel with knee aligned over toes'] }
    ];
  } else if (lower.includes('cricket')) {
    defaultSkills = [
      { name: 'Batting Stance & Defense', criteria: ['Balanced shoulder-width base with high elbow and eyes level', 'Solid front-foot forward defensive smothering spin and swing'] },
      { name: 'Bowling Grip & Delivery Action', criteria: ['Upright seam grip with consistent smooth gather and release', 'High front-arm pull down and complete hip follow-through'] },
      { name: 'Ground Fielding & Catching', criteria: ['Soft cupped hands under eye line absorbing ball impact', 'Clean scoop pickup and fluent overhand throw to keeper'] },
      { name: 'Running Between Wickets', criteria: ['Loud clear calling (Yes/No/Wait) with bat grounded past crease', 'Sharp turn looking at the ball during the second run'] }
    ];
  } else if (lower.includes('volleyball')) {
    defaultSkills = [
      { name: 'Overhead Setting', criteria: ['Soft fingertip triangle window above forehead', 'Upward leg extension pushing ball cleanly to antenna target'] },
      { name: 'Underhand Forearm Passing (Bumping)', criteria: ['Flat platform with wrists locked together and thumbs parallel', 'Absorbs and redirects ball with knees, no swinging arms'] },
      { name: 'Serving Technique (Underhand / Float)', criteria: ['Consistent ball toss with firm open palm striking ball center', 'No wrist snap for float ball turbulence'] },
      { name: 'Spiking Approach & Block Jump', criteria: ['Dynamic 3-step explosive approach (left-right-left)', 'Straight vertical leap with dynamic arm swing and wrist snap'] }
    ];
  }

  const marksPerSkill = numSkills > 0 ? +(totalMarks / numSkills).toFixed(1) : 5;
  const count = Math.min(numSkills, defaultSkills.length);
  const selectedSkills = defaultSkills.slice(0, count).map(sk => ({
    name: sk.name,
    maxMarks: marksPerSkill,
    criteria: sk.criteria
  }));

  const addComps = components.map(c => ({
    name: c,
    marks: c.includes('Viva') ? 5 : c.includes('Record') ? 5 : 3,
    description: `Official CBSE Practical evaluation component for ${c}.`
  }));

  return {
    title: `${s} CBSE Practical Assessment Rubric`,
    overallSummary: `Standardized CBSE Subject Code 048 assessment rubric for ${s}, evaluating physical execution, motor mechanics, and tactical acumen across ${numSkills} core skills for ${totalMarks} total marks.`,
    skills: selectedSkills,
    additionalComponents: addComps
  };
};

/**
 * High-Yield Unit Plan Fallback
 */
export const buildUnitPlanFallback = (
  topic: string,
  grade: string,
  numberOfLessons: number,
  duration: string,
  curriculum: string = 'CBSE HPE'
) => {
  const t = topic || 'Physical Fitness & Motor Skills';
  const n = Math.max(3, Math.min(numberOfLessons || 6, 8));

  const lessons = [];
  for (let i = 1; i <= n; i++) {
    lessons.push({
      week: i,
      focus: `Lesson ${i}: Progressive Mechanics & Tactical Execution in ${t}`,
      keyLearning: `Understand biomechanical efficiency, safety boundaries, and skill coordination for lesson ${i}.`,
      starter: `Dynamic mobility warm-up: 5-minute jogging with high knees, butt kicks, arm rotations, and core activation.`,
      mainActivity: `Progressive skill circuit: Drill station 1 (isolated form), station 2 (partner execution with feedback), station 3 (conditioned small-sided game context).`,
      plenary: `Cool-down static stretching, breathing regulation, learning recap, and peer-assessment checklist review.`,
      suggestedDrills: [
        `Drill ${i}.1: Technical repetition ladder with coaching cue checkpoints`,
        `Drill ${i}.2: Conditioned 3v3 / 4v4 game enforcing target skill usage`,
        `Drill ${i}.3: Tactical problem-solving scenario under controlled defense`
      ],
      coachingCues: [
        'Maintain balanced athletic ready stance',
        'Head up scanning the field/court',
        'Follow through fully along the intended trajectory'
      ]
    });
  }

  return {
    unitTitle: `Comprehensive Unit Plan: ${t}`,
    grade: `Class ${grade}`,
    curriculum,
    duration: `${duration || '40'} Minutes`,
    numberOfLessons: n,
    overview: `A complete pedagogically scaffolded ${n}-lesson instructional unit on ${t} designed to maximize Active Learning Time (ALT-PE) and align with ${curriculum} standards.`,
    learningObjectives: [
      `Demonstrate proficient motor execution of core fundamentals in ${t}.`,
      `Apply tactical problem-solving and spatial awareness in game situations.`,
      `Exhibit personal safety discipline, peer respect, and fair play values.`,
      `Understand physiological response to vigorous physical activity.`
    ],
    assessmentStrategies: [
      'Teacher observational skill rubric (Formative)',
      'Peer-to-peer checklist verification during practice stations',
      'End-of-unit practical skills demonstration and gameplay evaluation'
    ],
    equipmentNeeded: [
      'Agility markers and boundary cones',
      'Sport-specific regulation balls / equipment',
      'Stopwatches and whistle',
      'Laminated coaching cue cards for stations'
    ],
    weeklyBreakdown: lessons,
    differentiation: {
      support: 'Provide larger target areas, reduced court boundaries, and modified equipment speed/size.',
      extension: 'Introduce passive to active defensive pressure, time limits, and non-dominant side execution.'
    },
    safetyGuidelines: [
      'Check playing surface for obstacles, moisture, or uneven turf before activity.',
      'Enforce mandatory hydration breaks every 15-20 minutes in hot conditions.',
      'Ensure standard personal protective equipment (shin guards, proper footwear) is worn.'
    ]
  };
};

/**
 * AI Tool Center Fallback Content
 */
export const buildAIToolContentFallback = (toolId: string, params: any) => {
  const sport = params?.sport || params?.topic || params?.skill || 'Physical Education';
  const grade = params?.grade || '10';

  const toolGenerators: Record<string, () => any> = {
    'rubric-maker': () => ({
      title: `${sport} 4-Tier Assessment Rubric (CBSE)`,
      content: `Standardized assessment framework for ${sport} evaluating technique, decision making, tactical execution, and sportsmanship.`,
      items: [
        'Beginning (1-2 Marks): Inconsistent body position, limited follow-through, requires constant instructor guidance.',
        'Developing (3-4 Marks): Executes fundamental movement with basic mechanics but struggles under game speed/pressure.',
        'Proficient (5-7 Marks): Fluid, repeatable biomechanical execution with sound spatial awareness and consistent accuracy.',
        'Mastery (8-10 Marks): Exemplary technique under high pressure, intuitive tactical decision making, and leadership on court.'
      ],
      summary: 'Use this 4-tier rubric for continuous formative checks and term practical grading.'
    }),
    'worksheet-maker': () => ({
      title: `${sport} Student Interactive Theory & Practice Worksheet`,
      content: `Curriculum-aligned student study and reflection sheet for Class ${grade} covering rules, terminology, and physical principles.`,
      items: [
        'Section A: Identify the official court/field dimensions and mark player starting positions.',
        'Section B (Match the Following): Match the 5 key referee signals with their corresponding rule violations.',
        'Section C (Short Answer): Explain how Newton\'s Third Law applies during the takeoff or striking phase in this activity.',
        'Section D (Self-Reflection): Document your heart rate immediately post-game and describe two tactical areas for improvement.'
      ],
      summary: 'Distribute during wet weather or classroom theory periods for student portfolio records.'
    }),
    'report-writer': () => ({
      title: 'Class Physical Education Report Card Comments',
      content: 'Exemplary, strength-focused teacher comments for student holistic progress reports.',
      items: [
        'High Achiever: Demonstrates outstanding athletic aptitude, advanced tactical maturity, and exemplary sportsmanship across competitive fixtures.',
        'Consistent Progress: Has made commendable strides in cardiovascular endurance and skill execution; actively participates in group drills.',
        'Developing Confidence: Shows great enthusiasm; with focused practice on footwork and tactical positioning, performance will further accelerate.',
        'Leadership & Teamwork: A natural leader on the field who motivates peers, follows safety protocols, and upholds fair play at all times.'
      ],
      summary: 'Copy and paste into school ERP or report cards with minor personalization.'
    }),
    'game-generator': () => ({
      title: `5 High-Activity PE Games for ${sport}`,
      content: 'Engaging, fast-paced modified games designed to maximize touches and physical activity.',
      items: [
        '1. Grid Tag Reaction: Players dribble inside a 20x20m box while taggers attempt to poke balls away; develops close shielding.',
        '2. 3-Color Continuous Relay: 3 teams compete in rapid transition passing to designated numbered colored cones.',
        '3. End-Zone Touchdown: Fast passing game without dribbling; encourages quick off-the-ball movements and lead cuts.',
        '4. Over-the-River Gauntlet: Defending pairs protect a central neutral zone while attackers try to pierce the line with ground passes.',
        '5. Lightning Tournament: 4v4 short 4-minute matches on micro-pitches with winner staying on.'
      ],
      summary: 'All games require minimal setup and ensure zero wait time for active student participation.'
    }),
    'adapted-pe': () => ({
      title: `Inclusive & Adaptive PE Framework (TREE) for ${sport}`,
      content: 'Concrete adaptations ensuring full inclusion for students with disabilities and diverse motor capabilities.',
      items: [
        'T - Teaching Style: Use multi-sensory demonstrations, peer buddy pairings, and short 2-word verbal cues with visual cue cards.',
        'R - Rules: Allow extra bounces, expanded scoring zones, and modified boundary restarts to promote sustained rallies.',
        'E - Equipment: Use lighter balls, bell-audible balls for visual impairment, lower nets/hoops, and brightly colored boundary markers.',
        'E - Environment: Reduce playing surface dimensions, eliminate high-contrast glare, and ensure smooth level access.'
      ],
      summary: 'Adheres to CBSE Inclusive Education Guidelines and NEP 2020 equitable participation mandates.'
    }),
    'differentiator': () => ({
      title: `Differentiated PE Instruction (Must, Should, Could) for ${sport}`,
      content: 'Three-tiered challenge system ensuring all students are appropriately challenged simultaneously.',
      items: [
        'Tier 1 (Must Do - Core Foundation): Execute 10 consecutive repetitions of the fundamental skill against a stationary target/wall.',
        'Tier 2 (Should Do - Dynamic Partner): Execute the skill dynamically with a partner while moving across a 10m grid.',
        'Tier 3 (Could Do - Tactical Pressure): Execute the skill within a 2v1 or 3v2 contested situation against an active defender.'
      ],
      summary: 'Allows students to progress autonomously based on competency while keeping the entire class unified.'
    }),
    'sports-science': () => ({
      title: `Sports Science Connection: Biomechanics & Physiology in ${sport}`,
      content: 'Bridging physical gameplay with foundational STEM, human biology, and physics concepts.',
      items: [
        'Biomechanics (Levers): Identify how the arm acts as a third-class lever (effort between fulcrum and load) to generate velocity.',
        'Physiology (Energy Systems): Differentiate between the immediate ATP-PC sprint bursts and the aerobic recovery between plays.',
        'Cardiovascular Measurement: Measure resting pulse vs immediate post-drill heart rate to calculate personal recovery rate.',
        'Kinematics: Analyze how altering launch angle (approx. 45 degrees) optimizes projectile distance in throwing and kicking.'
      ],
      summary: 'Ideal for CBSE Class 11 and 12 curriculum integration and experiential science projects.'
    }),
    'ask-advisor': () => ({
      title: 'SmartPE Advisor: Best Practice Recommendation',
      content: 'Authoritative guidance tailored to Indian physical education standards and CBSE circulars.',
      items: [
        'Safety First: Always verify first aid availability, AED location, and heat hydration protocols before strenuous periods.',
        'Curriculum Alignment: Ensure every outdoor session maps directly to CBSE HPE strands or Khelo India assessment batteries.',
        'Maximum Engagement: Avoid line drills where students stand idle; utilize station circuits and small-sided games (3v3/4v4).',
        'Record Keeping: Maintain systematic student fitness cards (BMI, endurance, strength) accessible for parent consultations.'
      ],
      summary: 'Advisory guidance compiled by experienced senior Indian physical education directors.'
    }),
    'lesson-observer': () => ({
      title: 'PE Lesson Observation & Quality Assurance Rubric',
      content: 'Structured peer and administrative observation form for evaluating physical education lesson quality.',
      items: [
        'Active Learning Time (ALT-PE): Minimum 60% of total class duration spent in moderate-to-vigorous physical activity.',
        'Safety & Ground Setup: Boundaries clearly marked, equipment inspected, and clear emergency signals established.',
        'Instructional Clarity: Clear demonstrations under 90 seconds, followed by immediate student practice.',
        'Inclusive Engagement: Active participation of all students regardless of gender, body type, or athletic capability.'
      ],
      summary: 'Suitable for school inspection preparation and internal departmental teacher professional development.'
    }),
    'policy-writer': () => ({
      title: 'School Physical Education & Sports Safety Policy',
      content: 'Comprehensive institutional policy template for sports management and student safety.',
      items: [
        'Mandatory Attire: Regulation school sports uniform with non-marking athletic footwear required for participation.',
        'Extreme Weather Protocols: Outdoor activities transition indoors when Heat Index exceeds 38°C or AQI exceeds 200.',
        'Injury Management: Minor injuries receive on-ground PRICE treatment; concussions or fractures require immediate medical transfer and parent alert.',
        'Equipment Inspection: Weekly inventory checks and quarterly retirement of damaged sports assets.'
      ],
      summary: 'Ready for school principal ratification and management handbook inclusion.'
    })
  };

  const generator = toolGenerators[toolId] || toolGenerators['rubric-maker'];
  return generator();
};

/**
 * CBSE Board Test Paper Fallback (Class 9-12, 35M or 70M)
 */
export const buildTestPaperFallback = (
  grade: string,
  topic: string,
  testType: string,
  timeAllowed: string = '2 Hours',
  maxMarks: number = 35,
  language: string = 'English'
): TestPaper => {
  const cleanGrade = (grade || '12').replace(/\D/g, '') || '12';
  const isSenior = cleanGrade === '11' || cleanGrade === '12';

  if (maxMarks >= 60 || isSenior) {
    // 70 Marks CBSE Subject Code 048 Pattern (37 Questions)
    return {
      title: `CBSE Class ${cleanGrade} Physical Education Examination (Code 048)`,
      grade: `Class ${cleanGrade}`,
      displayGrade: `Grade ${cleanGrade}`,
      subjectCode: '048',
      sessionLabel: 'Academic Session 2025-26',
      testType: testType || 'Annual Examination',
      timeAllowed: timeAllowed || '3 Hours',
      maxMarks: 70,
      generalInstructions: [
        'The question paper consists of 5 sections and 37 questions.',
        'Section A: Questions 1 to 18 are Multiple Choice Questions carrying 1 mark each.',
        'Section B: Questions 19 to 24 are Very Short Answer questions carrying 2 marks each.',
        'Section C: Questions 25 to 30 are Short Answer questions carrying 3 marks each.',
        'Section D: Questions 31 to 33 are Case-Based questions carrying 4 marks each.',
        'Section E: Questions 34 to 37 are Long Answer questions carrying 5 marks each.',
        'All questions are compulsory. Internal choice is provided in some questions.'
      ],
      sections: [
        {
          sectionId: 'Section A',
          heading: 'Section A: Multiple Choice Questions (1 Mark Each)',
          instructions: 'Choose the correct option from the four alternatives provided.',
          questions: [
            { questionNumber: 1, question: 'In a single knockout tournament of 19 teams, how many total byes will be awarded?', marks: 1, options: ['A) 11 Byes', 'B) 13 Byes', 'C) 14 Byes', 'D) 12 Byes'], answer: 'B) 13 Byes' },
            { questionNumber: 2, question: 'Which of the following postural deformities is commonly called "Hollow Back"?', marks: 1, options: ['A) Kyphosis', 'B) Scoliosis', 'C) Lordosis', 'D) Bow Legs'], answer: 'C) Lordosis' },
            { questionNumber: 3, question: 'Newton\'s Third Law of Motion (Action and Reaction) is directly observed during which phase of sprinting?', marks: 1, options: ['A) Arm swing in air', 'B) Block start takeoff against footpads', 'C) Visual focus on finish line', 'D) Chest lean at finish tape'], answer: 'B) Block start takeoff against footpads' },
            { questionNumber: 4, question: 'What is the bench height used for male participants in the Harvard Step Test?', marks: 1, options: ['A) 16 inches', 'B) 18 inches', 'C) 20 inches', 'D) 22 inches'], answer: 'C) 20 inches' },
            { questionNumber: 5, question: 'Which yogic asana is contraindicated for individuals suffering from acute high blood pressure?', marks: 1, options: ['A) Shavasana', 'B) Chakrasana', 'C) Tadasana', 'D) Sukhasana'], answer: 'B) Chakrasana' },
            { questionNumber: 6, question: 'In the PRICE first-aid protocol, what does the letter "C" represent?', marks: 1, options: ['A) Cooling', 'B) Compression', 'C) Circulation', 'D) Care'], answer: 'B) Compression' },
            { questionNumber: 7, question: 'According to WHO physical activity recommendations, adolescents aged 5-17 should accumulate at least:', marks: 1, options: ['A) 30 min moderate activity weekly', 'B) 60 min moderate-to-vigorous activity daily', 'C) 90 min vigorous activity twice weekly', 'D) 45 min light walking daily'], answer: 'B) 60 min moderate-to-vigorous activity daily' },
            { questionNumber: 8, question: 'Fartlek training was introduced by Gösta Holmér in 1937. The Swedish word "Fartlek" literally translates to:', marks: 1, options: ['A) Hill Running', 'B) Speed Play', 'C) Continuous Jogging', 'D) Interval Sprinting'], answer: 'B) Speed Play' },
            { questionNumber: 9, question: 'A tear or stretching of ligament fibers connecting bone to bone is medically termed a:', marks: 1, options: ['A) Strain', 'B) Sprain', 'C) Abrasion', 'D) Contusion'], answer: 'B) Sprain' },
            { questionNumber: 10, question: 'Which macro-nutrient is the primary fuel source for high-intensity muscular contractions?', marks: 1, options: ['A) Dietary Fiber', 'B) Carbohydrates', 'C) Vitamin D', 'D) Minerals'], answer: 'B) Carbohydrates' }
          ]
        },
        {
          sectionId: 'Section B',
          heading: 'Section B: Very Short Answer Questions (2 Marks Each)',
          instructions: 'Answer each question in approximately 30-50 words.',
          questions: [
            { questionNumber: 19, question: 'State any two essential pre-meet responsibilities of the Technical Committee in sports event management.', marks: 2, answer: '1. Inspect sports fields, courts, and equipment to ensure compliance with official specifications. 2. Verify athlete eligibility, draw official match fixtures, and appoint certified referees and judges.' },
            { questionNumber: 20, question: 'Differentiate between Sprain and Strain with appropriate anatomical distinctions.', marks: 2, answer: 'A Sprain is an injury to ligaments (fibrous tissue connecting bone to bone). A Strain is an injury to muscle fibers or tendons (connecting muscle to bone).' },
            { questionNumber: 21, question: 'Mention two corrective asanas to remediate Kyphosis (Round Upper Back).', marks: 2, answer: '1. Bhujangasana (Cobra Pose) expands chest and arches thoracic spine. 2. Chakrasana (Wheel Pose) stretches anterior chest musculature and strengthens erector spinae.' }
          ]
        },
        {
          sectionId: 'Section C',
          heading: 'Section C: Short Answer Questions (3 Marks Each)',
          instructions: 'Answer each question in approximately 80-100 words.',
          questions: [
            { questionNumber: 25, question: 'Explain the procedure of calculating and drawing Byes for a Knockout tournament with 11 participating teams.', marks: 3, answer: 'For N = 11: Total matches = N - 1 = 10 matches. Next power of 2 greater than 11 is 16 (2^4). Total Byes = 16 - 11 = 5 Byes. Upper half teams = (11+1)/2 = 6 teams. Lower half teams = (11-1)/2 = 5 teams. Bye order: 1st Bye to bottom of lower half, 2nd Bye to top of upper half, 3rd Bye to top of lower half, 4th Bye to bottom of upper half, 5th Bye to second from bottom of lower half.' },
            { questionNumber: 26, question: 'Describe the three components comprising the Female Athlete Triad.', marks: 3, answer: '1. Low Energy Availability / Disordered Eating: Insufficient caloric intake relative to exercise energy expenditure. 2. Amenorrhea: Irregular or absent menstrual cycles for three or more consecutive months due to suppressed estrogen. 3. Osteoporosis: Decreased bone mineral density resulting in severe risk of stress fractures.' }
          ]
        },
        {
          sectionId: 'Section D',
          heading: 'Section D: Case-Based Questions (4 Marks Each)',
          instructions: 'Read the sports case scenario carefully and answer the 4 questions that follow.',
          questions: [
            {
              questionNumber: 31,
              question: 'Case Study: School Sports Tournament Planning',
              marks: 4,
              caseStudyText: 'St. Peter\'s Senior Secondary School is organizing the CBSE Regional Basketball Tournament with 14 participating school teams. The sports department is finalizing the knockout fixture schedule within a 3-day window.',
              options: [
                'Q1: Calculate the total number of matches to be played.',
                'Q2: Calculate the number of byes to be distributed.',
                'Q3: State how many teams will be placed in the Upper Half and Lower Half.',
                'Q4: Name the committee responsible for providing certified match officials and scoreboards.'
              ],
              answer: 'Q1: Total matches = 14 - 1 = 13 matches. Q2: Next power of 2 is 16. Byes = 16 - 14 = 2 Byes. Q3: Upper Half = 14/2 = 7 teams; Lower Half = 7 teams. Q4: Technical Committee.'
            }
          ]
        },
        {
          sectionId: 'Section E',
          heading: 'Section E: Long Answer Questions (5 Marks Each)',
          instructions: 'Answer each question in approximately 150-200 words.',
          questions: [
            { questionNumber: 34, question: 'Elucidate the various methods for developing Endurance (Continuous, Interval, and Fartlek) with their physiological benefits.', marks: 5, answer: '1. Continuous Training Method: Exercise performed for prolonged duration (>30 min) without rest at steady heart rate (140-160 bpm); improves cardiac stroke volume and glycogen storage. 2. Interval Training Method: Alternating periods of high-intensity work with controlled incomplete recovery intervals (heart rate returning to ~120-130 bpm before next repetition); develops both aerobic and anaerobic lactic capacity. 3. Fartlek Training Method: Natural speed-play running across varied terrains (forests, hills) with self-regulated pace changes; builds cardiovascular endurance, mental resilience, and neuromuscular adaptation.' },
            { questionNumber: 35, question: 'Define Biomechanics and explain the application of Newton\'s Three Laws of Motion with two sports examples for each law.', marks: 5, answer: 'Biomechanics is the study of internal and external forces acting on the human body and the mechanical effects produced. Law 1 (Inertia): An athlete remains in starting blocks or a ball remains stationary until acted upon by force. Law 2 (Acceleration, F=ma): Greater force applied by sprinter against ground yields greater acceleration; heavier shot put requires greater explosive force. Law 3 (Action-Reaction): High jumper drives takeoff foot downward against floor to be propelled upward into air; swimmer pushes water backward to move forward.' }
          ]
        }
      ],
      markingScheme: {
        header: 'CBSE Physical Education Class 12 (048) Official Marking Scheme & Model Answers',
        sections: [
          {
            sectionId: 'Section A (MCQs)',
            items: [
              { qNo: '1', answer: 'B) 13 Byes (Formula: 32 - 19 = 13)', marks: '1' },
              { qNo: '2', answer: 'C) Lordosis (Hollow back / Inward lumbar curve)', marks: '1' },
              { qNo: '3', answer: 'B) Block start takeoff against footpads', marks: '1' },
              { qNo: '4', answer: 'C) 20 inches (16 inches for females)', marks: '1' },
              { qNo: '5', answer: 'B) Chakrasana (Raises intracranial pressure)', marks: '1' },
              { qNo: '6', answer: 'B) Compression (Prevents localized edema)', marks: '1' }
            ]
          },
          {
            sectionId: 'Section B (Very Short)',
            items: [
              { qNo: '19', answer: '1 Mark each for any two valid pre-meet duties of technical committee (equipment inspection, fixture draws, jury appointment).', marks: '2' },
              { qNo: '20', answer: '1 Mark for defining sprain (ligament), 1 Mark for defining strain (muscle/tendon).', marks: '2' }
            ]
          }
        ]
      }
    };
  }

  // 35 Marks Unit Test / Term Test Pattern (13 Questions)
  return {
    title: `Class ${cleanGrade} Physical Education Term Assessment`,
    grade: `Class ${cleanGrade}`,
    displayGrade: `Grade ${cleanGrade}`,
    subjectCode: '048 / HPE',
    sessionLabel: 'Academic Session 2025-26',
    testType: testType || 'Unit Test',
    timeAllowed: timeAllowed || '1.5 Hours',
    maxMarks: 35,
    generalInstructions: [
      'The question paper consists of 13 questions divided into 4 sections.',
      'Section A: Q1 to Q6 are MCQs carrying 1 mark each.',
      'Section B: Q7 to Q9 are Short Answer questions carrying 2 marks each.',
      'Section C: Q10 to Q12 are Long Answer questions carrying 3 marks each.',
      'Section D: Q13 is a Case Study / Comprehensive question carrying 4 marks.',
      'All questions are compulsory.'
    ],
    sections: [
      {
        sectionId: 'Section A',
        heading: 'Section A: Multiple Choice Questions (6 Marks)',
        instructions: 'Select the most appropriate option.',
        questions: [
          { questionNumber: 1, question: 'What is the formula to calculate BMI?', marks: 1, options: ['A) Weight / Height', 'B) Weight (kg) / [Height (m)]²', 'C) Height / Weight', 'D) Weight × Height'], answer: 'B) Weight (kg) / [Height (m)]²' },
          { questionNumber: 2, question: 'Which test measures upper body muscular endurance in the Khelo India Battery for classes 9-12?', marks: 1, options: ['A) 50m Dash', 'B) Push-Ups (Boys) / Modified Push-Ups (Girls)', 'C) Sit and Reach', 'D) Flamingo Balance'], answer: 'B) Push-Ups (Boys) / Modified Push-Ups (Girls)' },
          { questionNumber: 3, question: 'In sports first aid, ice application during PRICE should initially be limited to:', marks: 1, options: ['A) 60 continuous minutes', 'B) 15-20 minutes every 2-3 hours', 'C) Direct contact without cloth wrap', 'D) Only after 48 hours'], answer: 'B) 15-20 minutes every 2-3 hours' },
          { questionNumber: 4, question: 'Lateral curvature of the spine forming an "S" or "C" shape is termed:', marks: 1, options: ['A) Kyphosis', 'B) Lordosis', 'C) Scoliosis', 'D) Flat Foot'], answer: 'C) Scoliosis' },
          { questionNumber: 5, question: 'A sedentary individual with a BMI of 27.4 is classified as:', marks: 1, options: ['A) Underweight', 'B) Normal weight', 'C) Overweight', 'D) Obese Class I'], answer: 'C) Overweight' },
          { questionNumber: 6, question: 'The ability to change body position rapidly and accurately while maintaining balance is:', marks: 1, options: ['A) Strength', 'B) Flexibility', 'C) Agility', 'D) Power'], answer: 'C) Agility' }
        ]
      },
      {
        sectionId: 'Section B',
        heading: 'Section B: Short Answer Questions (6 Marks)',
        instructions: 'Answer in 30-40 words each.',
        questions: [
          { questionNumber: 7, question: 'List any two physiological benefits of regular warm-up before intense physical activity.', marks: 2, answer: '1. Elevates muscle temperature and decreases viscous resistance, increasing contraction speed. 2. Dilates blood vessels and increases oxygen delivery to active skeletal muscles.' },
          { questionNumber: 8, question: 'State the difference between aerobic and anaerobic exercise with one example of each.', marks: 2, answer: 'Aerobic exercise uses oxygen to generate ATP for sustained moderate activity (e.g., 1500m jogging). Anaerobic exercise generates ATP without oxygen for short explosive bursts (e.g., 100m sprint).' },
          { questionNumber: 9, question: 'What are the two corrective measures for Flat Foot?', marks: 2, answer: '1. Walking on heels and outer edges of feet. 2. Performing Vajrasana and picking up small marbles with toes to strengthen foot arch muscles.' }
        ]
      },
      {
        sectionId: 'Section C',
        heading: 'Section C: Extended Answer Questions (9 Marks)',
        instructions: 'Answer in 60-80 words each.',
        questions: [
          { questionNumber: 10, question: 'Explain the procedure and scoring of the Sit and Reach Test for measuring trunk flexibility.', marks: 3, answer: 'Procedure: Student sits without shoes on the floor with legs fully extended and feet flat against the testing box. Palms placed one on top of the other with knees kept locked flat. Student slowly reaches forward sliding fingers along the measuring scale. The position must be held for 2 seconds. The score is recorded in centimeters from the farthest point reached.' },
          { questionNumber: 11, question: 'Outline the five steps of the PRICE protocol for managing acute soft-tissue injuries.', marks: 3, answer: 'P - Protect (Support injured limb and prevent further trauma). R - Rest (Cease all physical activity immediately). I - Ice (Apply wrapped cold packs for 15-20 min to reduce blood flow and pain). C - Compress (Wrap with elastic crepe bandage to prevent swelling). E - Elevate (Raise injured limb above heart level to assist venous return).' },
          { questionNumber: 12, question: 'Explain the principles of a Balanced Diet and the role of micronutrients in physical fitness.', marks: 3, answer: 'A balanced diet contains adequate proportions of carbohydrates (55-60%), fats (20-25%), and proteins (12-15%) along with essential vitamins, minerals, water, and roughage. Micronutrients (vitamins like B-complex, C, D and minerals like calcium, iron) regulate enzyme functions, maintain bone density, prevent anemia, and optimize oxygen transport.' }
        ]
      },
      {
        sectionId: 'Section D',
        heading: 'Section D: Practical Case Application (4 Marks)',
        instructions: 'Read and answer the applied physical education scenario.',
        questions: [
          {
            questionNumber: 13,
            question: 'Applied Khelo India Fitness Screening Case',
            marks: 4,
            caseStudyText: 'Rohan, a 15-year-old student, completed the Khelo India test battery. His BMI was 16.8 kg/m², his 50m dash was 7.1 seconds (Top 10%), but his Sit and Reach score was 14 cm (Below average).',
            options: [
              '1. State Rohan\'s BMI classification.',
              '2. Identify his primary physical fitness strength.',
              '3. Identify his target area for physical development.',
              '4. Recommend two specific stretches or asanas to remediate his target area.'
            ],
            answer: '1. Underweight (BMI < 18.5). 2. Sprint speed and explosive leg power (50m dash). 3. Lower back and hamstring flexibility (Sit and Reach). 4. Paschimottanasana (Seated Forward Bend) and standing hamstring toe touches.'
          }
        ]
      }
    ],
    markingScheme: {
      header: `Class ${cleanGrade} Physical Education Marking Scheme & Solution Key`,
      sections: [
        {
          sectionId: 'Section A (MCQs)',
          items: [
            { qNo: '1', answer: 'B) Weight (kg) / [Height (m)]²', marks: '1' },
            { qNo: '2', answer: 'B) Push-Ups / Modified Push-Ups', marks: '1' },
            { qNo: '3', answer: 'B) 15-20 minutes every 2-3 hours', marks: '1' },
            { qNo: '4', answer: 'C) Scoliosis', marks: '1' },
            { qNo: '5', answer: 'C) Overweight', marks: '1' },
            { qNo: '6', answer: 'C) Agility', marks: '1' }
          ]
        }
      ]
    }
  };
};
