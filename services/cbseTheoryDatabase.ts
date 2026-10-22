import { TheoryContent, BoardType } from '../types.ts';

export interface MindMapData {
  center: string;
  branches: {
    title: string;
    description: string;
    subTopics?: string[];
  }[];
}

// Master curriculum registry for CBSE Physical Education (Classes 9, 10, 11, 12)
export const getComprehensiveMindMapFallback = (grade: string, chapter: string): MindMapData => {
  const cleanGrade = String(grade || '12').trim().toLowerCase();
  const lowerChapter = (chapter || '').toLowerCase();

  // CLASS 12 (CBSE Subject Code 048)
  if (cleanGrade.includes('12') || cleanGrade.includes('xii')) {
    if (lowerChapter.includes('event') || lowerChapter.includes('unit 1') || lowerChapter.includes('management') || lowerChapter.includes('tournament')) {
      return {
        center: 'Unit 1: Management of Sporting Events',
        branches: [
          {
            title: '1. Functions of Sports Management',
            description: 'Core administrative pillars: Planning, Organizing, Staffing, Directing, and Controlling for institutional athletic programs.',
            subTopics: ['Objectives of sports planning', 'Hierarchical administrative structure', 'Staffing & task delegation', 'Monitoring & budget control']
          },
          {
            title: '2. Sports Committees & Responsibilities',
            description: 'Pre-meet, during-meet, and post-meet administrative responsibilities of specialized departmental committees.',
            subTopics: ['Organizing & Technical Committees', 'Publicity & Ground Preparation', 'Reception, Lodging & Boarding', 'First Aid, Medical & Refreshment']
          },
          {
            title: '3. Tournaments & Match Types',
            description: 'Classification of sporting competitions based on elimination, league formats, and logistical time allocations.',
            subTopics: ['Knock-out (Single Elimination)', 'League or Round Robin', 'Combination Tournaments', 'Consolation & Challenge Tournaments']
          },
          {
            title: '4. Knock-Out Fixture Architecture & Byes',
            description: 'Mathematical bye calculations ((N+1)/2, next power of 2 minus N) and seeding placement protocols.',
            subTopics: ['Total matches formula (N - 1)', 'Upper half & Lower half team division', 'Calculating total byes (Next power of 2 - N)', 'Standard bye distribution order']
          },
          {
            title: '5. League Fixtures (Round Robin Methods)',
            description: 'Constructing round-robin league schedules using Cyclic, Staircase, and Tabular methods with points evaluation.',
            subTopics: ['Total league matches (N(N-1)/2)', 'Cyclic method for even/odd teams', 'Staircase method drawing', 'British & American percentage ranking']
          },
          {
            title: '6. Intramural & Extramural Competitions',
            description: 'Distinguishing within-school house competitions from inter-school, zonal, and national sports meets.',
            subTopics: ['Aims & objectives of intramurals', 'Motto: A game for every student', 'Extramural talent identification', 'Inter-school sports calendars']
          },
          {
            title: '7. Community Sports & Mass Programs',
            description: 'Designing community-wide mass participation physical activity initiatives promoting public wellness.',
            subTopics: ['Sports Day & Athletic Meets', 'Health Run & Fun Runs', 'Run for Specific Cause / Unity', 'Fit India & National Sports Day (29 Aug)']
          }
        ]
      };
    }

    if (lowerChapter.includes('women') || lowerChapter.includes('child') || lowerChapter.includes('unit 2') || lowerChapter.includes('postur')) {
      return {
        center: 'Unit 2: Children and Women in Sports',
        branches: [
          {
            title: '1. Exercise Guidelines & Motor Stages',
            description: 'WHO physical activity recommendations across early, middle, and late childhood for motor milestone mastery.',
            subTopics: ['Infancy & Early Childhood (1-5 yrs)', 'Middle Childhood fundamental skills (6-12 yrs)', 'Late Childhood & Adolescence (13-17 yrs)', '60 min daily moderate-to-vigorous physical activity']
          },
          {
            title: '2. Spinal Postural Deformities',
            description: 'Etiology, clinical manifestations, and symptoms of abnormal vertebral column curvatures.',
            subTopics: ['Kyphosis (Round upper back / Hunchback)', 'Lordosis (Inward curvature of lumbar spine)', 'Scoliosis (Lateral S/C-shaped spine deviation)', 'Plumb line posture evaluation']
          },
          {
            title: '3. Lower Extremity Deformities',
            description: 'Structural abnormalities affecting knees and feet impacting gait, balance, and running biomechanics.',
            subTopics: ['Knock Knees (Genu Valgum)', 'Bow Legs (Genu Varum)', 'Flat Foot (Pes Planus)', 'Round Shoulders']
          },
          {
            title: '4. Therapeutic Corrective Measures',
            description: 'Prescriptive corrective physical exercises and therapeutic yogic asanas to restore anatomical alignment.',
            subTopics: ['Tadasana & Vajrasana for Flat Foot', 'Padmasana & Gomukhasana for Knock Knees', 'Chakrasana & Bhujangasana for Kyphosis', 'Halasana & Paschimottanasana for Lordosis']
          },
          {
            title: '5. Female Athletic Considerations',
            description: 'Physiological milestones influencing sports participation, endurance conditioning, and competitive training.',
            subTopics: ['Menarche (Onset of menstruation)', 'Menstrual Cycle phases', 'Menstrual Dysfunctions (Amenorrhea, Dysmenorrhea)', 'Training adaptations during menstruation']
          },
          {
            title: '6. Female Athlete Triad',
            description: 'Interrelated spectrum of three clinical conditions causing serious health risks in competitive female athletes.',
            subTopics: ['Low Energy Availability / Eating Disorders (Anorexia, Bulimia)', 'Amenorrhea (Absence of regular menstrual cycles)', 'Osteoporosis (Premature bone mineral density loss)', 'Clinical intervention & nutritional therapy']
          }
        ]
      };
    }

    if (lowerChapter.includes('yoga') || lowerChapter.includes('lifestyle') || lowerChapter.includes('unit 3') || lowerChapter.includes('obesity') || lowerChapter.includes('diabetes')) {
      return {
        center: 'Unit 3: Yoga as Preventive Measure for Lifestyle Disease',
        branches: [
          {
            title: '1. Obesity Management via Yoga',
            description: 'Etiology of excess adiposity (BMI >= 30) and therapeutic asanas enhancing metabolic rate and endocrine balance.',
            subTopics: ['Tadasana (Palm Tree Pose)', 'Katichakrasana (Standing Spinal Twist)', 'Pawanmuktasana (Wind-relieving Pose)', 'Matsyasana & Halasana contraindications']
          },
          {
            title: '2. Diabetes Mellitus Management',
            description: 'Insulin secretion stimulation and pancreatic beta-cell rejuvenation through targeted abdominal compression asanas.',
            subTopics: ['Bhujangasana (Cobra Pose)', 'Paschimottanasana (Seated Forward Bend)', 'Pawanmuktasana (Abdominal Massage)', 'Ardha Matsyendrasana (Half Spinal Twist)']
          },
          {
            title: '3. Asthma & Respiratory Health',
            description: 'Bronchial passage opening, thoracic cavity expansion, and vital capacity enhancement via yogic postures.',
            subTopics: ['Sukhasana & Gomukhasana (Chest Openers)', 'Chakrasana (Wheel Pose)', 'Matsyasana (Fish Pose)', 'Bhujangasana & Anulom-Vilom Pranayama']
          },
          {
            title: '4. Hypertension (High Blood Pressure)',
            description: 'Sympathetic down-regulation, arterial wall elasticity, and cardiac recovery through soothing restorative asanas.',
            subTopics: ['Tadasana & Katichakrasana', 'Uttanpadasana (Raised Leg Pose)', 'Ardha Halasana (Half Plow)', 'Shavasana (Corpse Pose & Deep Relaxation)']
          },
          {
            title: '5. Back Pain & Lumbar Alignment',
            description: 'Vertebral decompression, spinal cord flexibility, and core lumbo-pelvic stabilizing yogic routines.',
            subTopics: ['Tadasana & Vakrasana (Gentle Twist)', 'Bhujangasana (Gentle Extension)', 'Shalabhasana (Locust Pose)', 'Makarasana & Shavasana recovery']
          },
          {
            title: '6. Contraindications & Safety Protocols',
            description: 'Clinical red-flags and precautions required before prescribing specific asanas to students with chronic conditions.',
            subTopics: ['Hernia & Peptic Ulcer restrictions', 'Severe slip disc & spinal injury precautions', 'High blood pressure forward bending caveats', 'Breathing coordination during posture holds']
          }
        ]
      };
    }

    if (lowerChapter.includes('cwsn') || lowerChapter.includes('divyang') || lowerChapter.includes('unit 4') || lowerChapter.includes('special need') || lowerChapter.includes('adaptive')) {
      return {
        center: 'Unit 4: PE & Sports for CWSN (Children with Special Needs)',
        branches: [
          {
            title: '1. Disability Sports Organizations',
            description: 'Global and Indian governance structures fostering competitive and grassroots sports for differently-abled athletes.',
            subTopics: ['Special Olympics Bharat (Intellectual Disabilities)', 'Paralympics (Physical & Visual Impairments)', 'Deaflympics (Hearing Impairments)', 'IPC Classification codes']
          },
          {
            title: '2. Concept of Classification & Divisioning',
            description: 'Fair competition grouping systems based on functional physical abilities and developmental athletic age.',
            subTopics: ['Functional ability assessments', 'Special Olympics 10% divisioning rule', 'Paralympic point systems (e.g. Wheelchair Basketball)', 'Level-playing field protocols']
          },
          {
            title: '3. Inclusion in Physical Education',
            description: 'Pedagogical philosophy and practical implementation of mainstream inclusive physical education.',
            subTopics: ['Definition & ethical rationale of inclusion', 'Social integration benefits', 'Combating stigma & discrimination', 'Peer-buddy mentoring models']
          },
          {
            title: '4. Adaptive PE Strategies (TREE Model)',
            description: 'Modifying sports environments and instructional methods to facilitate participation for all student capabilities.',
            subTopics: ['Teaching style adaptations', 'Rules & scoring modifications', 'Equipment changes (Auditory/Bright balls)', 'Environment & court boundary scaling']
          },
          {
            title: '5. Multidisciplinary Professional Support',
            description: 'Roles of specialized educators and allied healthcare experts in formulating Individualized Education Plans (IEP).',
            subTopics: ['Physical Education Teachers & Special Educators', 'Occupational Therapists & Physiotherapists', 'Speech Therapists & Audiologists', 'School Counselors & Parent Liaison']
          }
        ]
      };
    }

    if (lowerChapter.includes('nutrition') || lowerChapter.includes('diet') || lowerChapter.includes('unit 5')) {
      return {
        center: 'Unit 5: Sports and Nutrition',
        branches: [
          {
            title: '1. Balanced Diet & Caloric Balance',
            description: 'Constituents of an optimal daily nutritional intake fulfilling energetic demands of athletes and students.',
            subTopics: ['Definition of Balanced Diet', 'Energy balance (Intake vs Expenditure)', 'Basal Metabolic Rate (BMR)', 'Daily caloric needs by sport']
          },
          {
            title: '2. Macro Nutrients',
            description: 'Primary energy-yielding dietary substrates essential for cellular growth, fuel, and athletic performance.',
            subTopics: ['Carbohydrates (Simple vs Complex & Glycemic Index)', 'Fats (Saturated vs Unsaturated & Omega-3s)', 'Proteins (Essential Amino Acids & Muscle Repair)', 'Water & Hydration balance in sports']
          },
          {
            title: '3. Micro Nutrients',
            description: 'Vitamins and minerals acting as catalytic regulators of metabolic, muscular, and neurological functions.',
            subTopics: ['Fat-soluble Vitamins (A, D, E, K)', 'Water-soluble Vitamins (B-complex, C)', 'Major Minerals (Calcium, Phosphorus, Sodium, Potassium)', 'Trace Minerals (Iron, Iodine, Zinc, Copper)']
          },
          {
            title: '4. Nutritive vs Non-Nutritive Components',
            description: 'Differentiating caloric food nutrients from sensory, structural, and physiological dietary compounds.',
            subTopics: ['Fiber/Roughage & Gastrointestinal Health', 'Water as physiological transport medium', 'Flavor compounds & Color compounds', 'Phytochemicals & Artificial Sweeteners']
          },
          {
            title: '5. Weight Control & Healthy BMI',
            description: 'Scientific body composition management through sustainable caloric modulation and exercise adherence.',
            subTopics: ['BMI formula (Weight in kg / Height in m²)', 'WHO BMI categories (Underweight, Normal, Overweight, Obese)', 'Healthy weight management principles', 'Energy expenditure through aerobic vs resistance work']
          },
          {
            title: '6. Diet Pitfalls & Common Food Myths',
            description: 'Critical analysis of hazardous fad diets, eating disorders, and widespread nutritional misconceptions.',
            subTopics: ['Extreme caloric restriction & Starvation mode', 'Skipping meals (Breakfast omission risks)', 'Food Myths: Carbohydrates make you fat', 'Food Myths: Drinking water during meals dilutes digestion']
          }
        ]
      };
    }

    if (lowerChapter.includes('test') || lowerChapter.includes('measurement') || lowerChapter.includes('unit 6') || lowerChapter.includes('khelo')) {
      return {
        center: 'Unit 6: Test and Measurement in Sports',
        branches: [
          {
            title: '1. SAI Khelo India Battery (Ages 5-8)',
            description: 'Mandatory CBSE assessment protocol evaluating fundamental movement skills and body morphology in primary students.',
            subTopics: ['Body Mass Index (Height & Weight)', 'Flamingo Balance Test (Static balance for 60s)', 'Plate Tapping Test (Limb movement speed)', 'Percentile mapping & norms']
          },
          {
            title: '2. SAI Khelo India Battery (Ages 9-18)',
            description: 'National fitness assessment battery evaluating core fitness components across secondary school students.',
            subTopics: ['BMI (Body Composition)', '50m Standing Start Dash (Speed)', '600m Run/Walk (Cardiorespiratory Endurance)', 'Sit & Reach (Hamstring/Lower back flexibility)', 'Partial Curl-ups (Abdominal muscular endurance)', 'Push-ups (Boys) / Modified Push-ups (Girls)']
          },
          {
            title: '3. General Motor Ability (Barrow 3-Item)',
            description: 'Standardized field battery assessing overall motor proficiency and explosive athletic potential.',
            subTopics: ['Standing Broad Jump (Explosive leg power)', 'Zig-Zag Run (Multi-directional agility)', 'Medicine Ball Put (Arm & shoulder girdle power)', 'Scoring tables & aggregate conversion']
          },
          {
            title: '4. Cardiovascular Endurance Tests',
            description: 'Clinical and field evaluations determining aerobic power, stroke volume, and cardiac recovery efficiency.',
            subTopics: ['Harvard Step Test (20-inch box cadence)', 'Fitness Index formula (Duration in sec * 100 / (2 * sum of pulse))', 'Long Form vs Short Form calculation', 'Rockport One-Mile Walk Test']
          },
          {
            title: '5. Senior Citizen Fitness (Rikli & Jones)',
            description: 'Functional fitness test battery evaluating independent living physical capability in aging populations.',
            subTopics: ['Chair Stand Test (Lower body strength)', 'Arm Curl Test (Upper body strength)', 'Chair Sit & Reach Test (Lower body flexibility)', 'Back Scratch Test (Upper body/shoulder flexibility)', 'Eight Foot Up and Go (Agility/Dynamic balance)', 'Six-Minute Walk Test (Aerobic endurance)']
          }
        ]
      };
    }

    if (lowerChapter.includes('physiology') || lowerChapter.includes('injur') || lowerChapter.includes('unit 7') || lowerChapter.includes('first aid')) {
      return {
        center: 'Unit 7: Physiology & Injuries in Sports',
        branches: [
          {
            title: '1. Physiological Determinants of Fitness',
            description: 'Biological factors governing an athlete’s strength, speed, cardiovascular endurance, and joint flexibility.',
            subTopics: ['Fast-Twitch (Type II) vs Slow-Twitch (Type I) muscle fibers', 'Muscle cross-sectional size & explosive recruitment', 'Stroke volume, cardiac output & VO2 Max', 'Joint structure, ligaments & core temperature']
          },
          {
            title: '2. Exercise Effects on Muscular System',
            description: 'Short-term acute and long-term chronic adaptations occurring in skeletal muscle tissue under training load.',
            subTopics: ['Muscle Hypertrophy (Increase in fiber diameter)', 'Mitochondrial density & glycogen storage', 'Capillarization of active muscle beds', 'Delayed Onset Muscle Soreness (DOMS) & lactic clearance']
          },
          {
            title: '3. Exercise Effects on Cardiorespiratory System',
            description: 'Structural and functional cardiovascular adaptations maximizing oxygen delivery to working tissues.',
            subTopics: ['Athletic Bradycardia (Decreased resting heart rate)', 'Increased stroke volume & ejection fraction', 'Cardiac hypertrophy (Athletic heart)', 'Increased vital capacity, tidal volume & alveolar diffusion']
          },
          {
            title: '4. Sports Injuries Classification',
            description: 'Categorizing athletic trauma based on anatomical tissue type and mechanism of injury.',
            subTopics: ['Soft Tissue: Abrasion (Friction scrape), Contusion (Bruise)', 'Soft Tissue: Laceration (Tear), Incision (Sharp cut)', 'Sprain (Ligament stretch/tear) vs Strain (Muscle/tendon tear)', 'Bone Fractures (Simple, Compound, Greenstick, Comminuted)', 'Joint Dislocations (Shoulder, Elbow, Patella)']
          },
          {
            title: '5. First Aid & The PRICE Protocol',
            description: 'Standard acute sports trauma emergency management protocol minimizing swelling and secondary tissue damage.',
            subTopics: ['P: Protect the injured site with splint/sling', 'R: Rest and immediate cessation of movement', 'I: Ice application for 15-20 min intervals', 'C: Compression wrap with elastic crepe bandage', 'E: Elevation above heart level to drain edema']
          }
        ]
      };
    }

    if (lowerChapter.includes('biomechanic') || lowerChapter.includes('lever') || lowerChapter.includes('newton') || lowerChapter.includes('unit 8')) {
      return {
        center: 'Unit 8: Biomechanics and Sports',
        branches: [
          {
            title: '1. Newton’s Laws of Motion in Sports',
            description: 'Applying fundamental Newtonian physical principles to athletic locomotion, sprinting, and throwing mechanics.',
            subTopics: ['First Law (Inertia): Sprint block start, javelin run-up', 'Second Law (Acceleration, F=ma): Ball strike velocity, shot put release', 'Third Law (Action-Reaction): High jump plant, swimming push-off, running stride', 'Momentum conservation during sports impact']
          },
          {
            title: '2. Anatomical Levers in Human Movement',
            description: 'Mechanical advantage principles of human musculoskeletal joints functioning as lever machines.',
            subTopics: ['Class 1 Lever (Fulcrum in middle): Nodding head, triceps elbow extension', 'Class 2 Lever (Load in middle): Calf raise / plantar flexion', 'Class 3 Lever (Effort in middle): Bicep curl, knee flexion, kicking', 'Mechanical advantage & speed trade-offs']
          },
          {
            title: '3. Equilibrium & Centre of Gravity (CG)',
            description: 'Principles of postural stability, base of support, and body weight distribution in athletic stances.',
            subTopics: ['Static Equilibrium (Holding wrestling/gymnastics stance)', 'Dynamic Equilibrium (Running balance, skiing)', 'Centre of Gravity (CG) location in human body', 'Factors increasing stability: Low CG, wider base of support']
          },
          {
            title: '4. Friction in Sports Performance',
            description: 'Frictional forces acting between athletic footwear, sporting implements, and competition surfaces.',
            subTopics: ['Static, Sliding, and Rolling friction', 'Advantages: Spikes in sprinting, studs in football, chalk in gymnastics', 'Disadvantages: Skiing drag, ice skating resistance', 'Frictional optimization in athletic gear design']
          },
          {
            title: '5. Projectile Motion in Athletics',
            description: 'Flight trajectory, aerodynamic drag, and parabolic paths of balls, javelins, discus, and human jumpers.',
            subTopics: ['Angle of release (Theoretical 45° vs ~35°-38° aerodynamic drag)', 'Initial velocity / release speed', 'Height of release above landing ground', 'Gravity and air resistance effects on flight time']
          }
        ]
      };
    }

    if (lowerChapter.includes('psycholog') || lowerChapter.includes('personality') || lowerChapter.includes('unit 9') || lowerChapter.includes('motivation')) {
      return {
        center: 'Unit 9: Psychology and Sports',
        branches: [
          {
            title: '1. Personality in Sports',
            description: 'Psychological traits, temperaments, and behavioral classifications impacting athlete performance.',
            subTopics: ['Carl Jung Classification: Extrovert, Introvert, Ambivert', 'Big Five Model (OCEAN: Openness, Conscientiousness, Extraversion, Agreeableness, Neuroticism)', 'Personality traits of successful athletes', 'Sports selection based on personality type']
          },
          {
            title: '2. Motivation in Athletic Performance',
            description: 'Internal drives and external stimuli influencing engagement, persistence, and championship mindset.',
            subTopics: ['Intrinsic Motivation (Self-satisfaction, mastery, joy of playing)', 'Extrinsic Motivation (Trophies, praise, financial rewards)', 'Goal Setting: SMART framework in sports training', 'Self-determination theory and autonomy']
          },
          {
            title: '3. Exercise Adherence & Behavioral Barriers',
            description: 'Psychological strategies ensuring consistent lifelong commitment to daily physical fitness regimes.',
            subTopics: ['Common adherence barriers (Lack of time, fatigue, low self-efficacy)', 'Strategies: Social support, workout logging, positive reinforcement', 'Transtheoretical stages of change model', 'Combating sedentary relapse']
          },
          {
            title: '4. Aggression in Sports',
            description: 'Differentiating constructive competitive drive from destructive or hostile unsportsmanlike behavior.',
            subTopics: ['Hostile Aggression: Intent to inflict physical harm or injury', 'Instrumental Aggression: Forceful play within rules to secure tactical advantage', 'Assertive Behavior: Energetic, non-injurious rule adherence with intense focus', 'Frustration-Aggression hypothesis & emotional control']
          },
          {
            title: '5. Psychological Attributes & Mental Skills',
            description: 'Cognitive conditioning techniques used by elite athletes to optimize focus, arousal, and confidence.',
            subTopics: ['Mental Imagery & Visualization drills', 'Positive Self-Talk & Thought Stopping', 'Arousal Regulation: Inverted-U hypothesis', 'Pre-competition anxiety management & relaxation routines']
          }
        ]
      };
    }

    // Default Class 12 Unit 10: Training in Sports
    return {
      center: 'Unit 10: Training in Sports',
      branches: [
        {
          title: '1. Principles of Sports Training',
          description: 'Fundamental physiological and pedagogical tenets underlying safe, systematic athletic conditioning.',
          subTopics: ['Principle of Overload & Progression', 'Principle of Specificity (SAID principle)', 'Principle of Reversibility (Use it or lose it)', 'Principle of Individual Differences & Rest/Recovery']
        },
        {
          title: '2. Training Periodization Architecture',
          description: 'Structured cyclical division of annual training seasons to achieve peak athletic form for major championships.',
          subTopics: ['Macrocycle (Annual / Multi-month plan)', 'Mesocycle (Monthly / 2-6 week targeted block)', 'Microcycle (Weekly / 3-7 day training schedule)', 'Preparatory, Competition, and Transition phases']
        },
        {
          title: '3. Strength Development Methods',
          description: 'Conditioning regimens designed to enhance muscular force production and neuromuscular recruitment.',
          subTopics: ['Isometric Exercises (Static contraction, no joint angle change - Hettinger & Muller)', 'Isotonic Exercises (Concentric & Eccentric dynamic contractions - DeLorme)', 'Isokinetic Exercises (Constant angular velocity - Perrine)', 'Maximum Strength vs Explosive Strength vs Strength Endurance']
        },
        {
          title: '4. Endurance Training Methods',
          description: 'Physiological conditioning protocols targeting aerobic capacity, lactic threshold, and stamina.',
          subTopics: ['Continuous Training Method (Slow continuous vs Fast continuous)', 'Interval Training Method (Structured work-to-rest ratio based on heart rate recovery)', 'Fartlek Training Method (Swedish speed-play over natural terrain)', 'Cross-training and aerobic conditioning circuits']
        },
        {
          title: '5. Speed & Flexibility Development',
          description: 'Enhancing reaction time, movement frequency, stride length, and anatomical range of motion.',
          subTopics: ['Acceleration Runs & Pace Races', 'Reaction speed drills (Visual & Auditory stimuli)', 'Active vs Passive Flexibility', 'Ballistic, Static, Dynamic, and PNF stretching techniques']
        },
        {
          title: '6. Circuit Training Design',
          description: 'Multi-station conditioning layout targeting whole-body fitness components through timed work intervals.',
          subTopics: ['Selection of 6 to 10 alternating muscle group stations', 'Station arrangement avoiding adjacent muscle fatigue', 'Work-to-Rest ratio protocols (e.g. 30s work / 30s rest)', 'Progression: Increasing repetitions, reducing recovery, or adding circuits']
        }
      ]
    };
  }

  // CLASS 11 (CBSE Subject Code 048)
  if (cleanGrade.includes('11') || cleanGrade.includes('xi')) {
    if (lowerChapter.includes('trend') || lowerChapter.includes('career') || lowerChapter.includes('unit 1')) {
      return {
        center: 'Unit 1: Changing Trends & Career in PE',
        branches: [
          {
            title: '1. Meaning and Objectives of PE',
            description: 'Holistic definition and developmental aims of modern physical education.',
            subTopics: ['Physical, neuro-muscular, emotional & social development', 'Ancient vs modern physical education concepts', 'National policy on sports']
          },
          {
            title: '2. Career Options in Physical Education',
            description: 'Professional avenues available to sports graduates and certified physical educators.',
            subTopics: ['Teaching & Coaching careers', 'Health & Fitness club training', 'Sports Journalism & Broadcasting', 'Sports Management & Marketing']
          },
          {
            title: '3. Khelo India Programme',
            description: 'Government of India national grassroots sporting revival initiative.',
            subTopics: ['12 Verticals of Khelo India', 'Talent Search and Development', 'Support to National/Regional Academies', 'State level Khelo India centres']
          },
          {
            title: '4. Fit India Movement',
            description: 'Nationwide movement launched on 29 August 2019 promoting active daily living.',
            subTopics: ['Fit India School Certification', 'Fit India Freedom Run', 'Daily active play commitments', 'School fitness protocols']
          }
        ]
      };
    }

    if (lowerChapter.includes('olympic') || lowerChapter.includes('unit 2')) {
      return {
        center: 'Unit 2: Olympic Value Education',
        branches: [
          {
            title: '1. Ancient Olympic Games',
            description: 'Origins, religious significance, and athletic traditions of Ancient Olympia (776 BC to 393 AD).',
            subTopics: ['Coroebus of Elis & foot race', 'Rules & eligibility of competitors', 'Truce of Olympia (Ekecheiria)', 'Decline under Emperor Theodosius']
          },
          {
            title: '2. Modern Olympic Revival',
            description: 'Baron Pierre de Coubertin’s vision and the inaugural 1896 Athens Olympic Games.',
            subTopics: ['Founding of the IOC in 1894', '1896 Athens Games organization', 'Olympic Charter principles', 'Role of modern Host Cities']
          },
          {
            title: '3. Olympic Symbols & Motto',
            description: 'Official insignia representing global peace, athletic solidarity, and excellence.',
            subTopics: ['5 Interlaced Rings (Blue, Yellow, Black, Green, Red)', 'Motto: Citius, Altius, Fortius - Communiter', 'Olympic Flame, Torch Relay, and Flag', 'Olympic Oath for athletes and officials']
          },
          {
            title: '4. Olympic Values & IOA Governance',
            description: 'Ethical core pillars of Olympism and Indian Olympic Association administration.',
            subTopics: ['Values of Excellence, Friendship, and Respect', 'Indian Olympic Association (IOA) founding in 1927', 'Sir Dorabji Tata and Dr. A.G. Noehren', 'National sports federation affiliations']
          }
        ]
      };
    }

    if (lowerChapter.includes('anatomy') || lowerChapter.includes('physiology') || lowerChapter.includes('unit 7')) {
      return {
        center: 'Unit 7: Anatomy & Physiology in Sports',
        branches: [
          {
            title: '1. Human Skeletal System',
            description: 'Classification of bones, axial and appendicular skeleton, and protective anatomical functions.',
            subTopics: ['206 bones breakdown', 'Long, Short, Flat, Irregular bones', 'Types of joints (Fibrous, Cartilaginous, Synovial)', 'Synovial joint types: Ball & socket, Hinge, Pivot']
          },
          {
            title: '2. Muscular System Mechanics',
            description: 'Types of muscle tissues, structural properties, and sliding filament contraction mechanisms.',
            subTopics: ['Skeletal, Smooth, and Cardiac muscle', 'Properties: Excitability, Contractility, Extensibility', 'Structure of sarcomere (Actin & Myosin)', 'Muscle tone and neuromuscular fatigue']
          },
          {
            title: '3. Respiratory System & Lung Volumes',
            description: 'Mechanism of breathing, external and internal respiration, and pulmonary capacities.',
            subTopics: ['Nasal cavity, Pharynx, Trachea, Bronchi, Alveoli', 'Tidal Volume, Vital Capacity, Residual Volume', 'Gas exchange across alveolar-capillary membranes', 'Second wind & Oxygen debt']
          },
          {
            title: '4. Circulatory System & Heart Function',
            description: 'Structure of heart, systemic and pulmonary circulation, and arterial blood pressure dynamics.',
            subTopics: ['4 Chambers of human heart & valves', 'Stroke volume and cardiac output (CO = HR x SV)', 'Systolic vs Diastolic blood pressure response to exercise', 'Arteries, Veins, and Capillaries network']
          }
        ]
      };
    }

    // Default Class 11 Unit
    return {
      center: 'Unit 8: Fundamentals of Kinesiology & Biomechanics in Sports',
      branches: [
        {
          title: '1. Meaning & Scope of Kinesiology',
          description: 'Scientific study of human body mechanics and motion in physical activity and sports.',
          subTopics: ['Definitions and importance in sports performance', 'Preventing injury through movement analysis', 'Role in athletic equipment design']
        },
        {
          title: '2. Anatomical Planes and Axes',
          description: 'Three-dimensional spatial reference frames describing athletic body movements.',
          subTopics: ['Sagittal Plane & Frontal Horizontal Axis', 'Frontal Plane & Sagittal Horizontal Axis', 'Transverse Plane & Vertical Axis', 'Movement planes in running, cartwheels, and pirouettes']
        },
        {
          title: '3. Fundamental Movement Terminology',
          description: 'Standard anatomical motions executed across joints during sporting actions.',
          subTopics: ['Flexion and Extension', 'Abduction and Adduction', 'Circumduction and Rotation', 'Inversion, Eversion, Pronation, and Supination']
        },
        {
          title: '4. Principles of Biomechanics in Sports',
          description: 'Mechanical force applications, momentum, and impulse during track and field events.',
          subTopics: ['Linear vs Angular motion', 'Impact forces and impulse transmission', 'Applying biomechanical principles to sprint starts', 'High jump and long jump trajectory physics']
        }
      ]
    };
  }

  // CLASSES 9 & 10 (CBSE HPE Strands)
  return {
    center: 'CBSE Health & Physical Education (Classes 9 & 10)',
    branches: [
      {
        title: '1. Strand 1: Athletics & Team Sports',
        description: 'Track and field fundamentals, team game rules, and technical skill development.',
        subTopics: ['Sprint starts, relays & pacing', 'Football, Basketball, Volleyball rules', 'Court and field dimensions', 'Official referee signals and scorekeeping']
      },
      {
        title: '2. Strand 2: Health, Hygiene & Posture',
        description: 'Personal hygiene, postural alignment, balanced nutrition, and fitness self-assessment.',
        subTopics: ['Daily water and nutritional requirements', 'Ergonomics in study and sports posture', 'Combating screen fatigue and sedentary lifestyle', 'Rest, sleep, and physical recovery']
      },
      {
        title: '3. Strand 2: First Aid & Safety Protocols',
        description: 'Immediate playground emergency management and injury prevention guidelines.',
        subTopics: ['PRICE protocol for sprains and strains', 'Heat exhaustion and dehydration emergency steps', 'CPR awareness and basic first aid box setup', 'Playground hazard audit checklist']
      },
      {
        title: '4. Strand 3 & 4: SEWA & Health Activity Card',
        description: 'Social empowerment through work and education, alongside mandatory CBSE health card records.',
        subTopics: ['Community fitness and green clean campaigns', 'Peer health mentoring', 'CBSE Health & Activity Card recording', 'Longitudinal physical literacy profiling']
      }
    ]
  };
};

// Master curriculum content generator for Notes, MCQs, and Case Studies
export const getComprehensiveTheoryFallback = (
  grade: string,
  topic: string,
  contentType: 'Notes' | 'MCQ' | 'CaseStudy',
  language: string = 'English'
): TheoryContent => {
  const cleanGrade = String(grade || '12').trim();
  const lowerTopic = (topic || '').toLowerCase();

  // If Case Studies requested
  if (contentType === 'CaseStudy') {
    return {
      title: `${topic} — CBSE Case Studies & Board Marking Scheme`,
      contentType: 'CaseStudy',
      content: `CBSE CLASS ${cleanGrade} PHYSICAL EDUCATION (SUBJECT CODE 048)
CASE STUDY ANALYSIS & BOARD EXAM SOLUTIONS

Case Study 1: Tournament Planning & Byes Calculation in a CBSE School
Delhi Public School is hosting the CBSE Inter-School Football Championship with 19 schools participating. The Physical Education Director formed distinct organizational committees (Publicity, Ground, Technical, Refreshment, and First Aid). To conduct the tournament within 4 days, a Knockout format was chosen. During the coaches' briefing, several team managers inquired about the upper and lower half team allocation and the exact calculation of byes.

Questions based on Case Study 1:
1. What is the total number of matches to be played in this knockout tournament?
2. Calculate the total number of byes to be given to participating teams.
3. How many teams will be placed in the Upper Half and Lower Half respectively?
4. What is the designated order of bye distribution according to standard CBSE rules?

Case Study 2: Female Athlete Triad & Postural Alignment in Senior Athletics
During a pre-season screening for Class 12 athletes at St. Xavier's Academy, the school physical educator observed that Ananya, a 17-year-old state-level 1500m runner, had suffered multiple recurring stress fractures in her tibia and metatarsal bones. Her dietary diary revealed severe caloric restriction (<1200 kcal/day) driven by an intense fear of weight gain, coupled with an absence of regular menstrual cycles for the past 6 months. Her spinal assessment also revealed exaggerated inward curvature of the lower back.

Questions based on Case Study 2:
1. Identify the three interrelated clinical components characterizing the condition observed in Ananya.
2. What is the clinical term for the absence of menstruation for 6 consecutive months in a female athlete?
3. Name the postural deformity indicated by the exaggerated inward curvature of the lumbar spine.
4. Recommend two therapeutic yogic asanas and one nutritional intervention to assist in Ananya's recovery.`,
      questions: [
        {
          question: "Case 1, Q1: What is the total number of matches to be played in a 19-team knockout tournament?",
          answer: "Formula: Total matches = N - 1 = 19 - 1 = 18 matches."
        },
        {
          question: "Case 1, Q2: Calculate the total number of byes to be given to participating teams for 19 teams.",
          answer: "Next power of 2 greater than 19 is 32 (2^5). Total Byes = 32 - 19 = 13 Byes."
        },
        {
          question: "Case 1, Q3: How many teams will be placed in the Upper Half and Lower Half respectively for 19 teams?",
          answer: "Upper Half teams = (N + 1) / 2 = (19 + 1) / 2 = 10 teams. Lower Half teams = (N - 1) / 2 = (19 - 1) / 2 = 9 teams."
        },
        {
          question: "Case 1, Q4: What is the designated order of bye distribution according to CBSE rules?",
          answer: "1st Bye: Bottom of Lower Half. 2nd Bye: Top of Upper Half. 3rd Bye: Top of Lower Half. 4th Bye: Bottom of Upper Half. Subsequent byes follow this exact cyclic sequence."
        },
        {
          question: "Case 2, Q1: Identify the three interrelated clinical components characterizing Ananya's condition.",
          answer: "Female Athlete Triad: (1) Low Energy Availability / Disordered Eating, (2) Amenorrhea (Menstrual dysfunction), and (3) Osteoporosis (Loss of bone mineral density leading to stress fractures)."
        },
        {
          question: "Case 2, Q2: What is the clinical term for the absence of menstruation for 6 consecutive months?",
          answer: "Secondary Amenorrhea."
        },
        {
          question: "Case 2, Q3: Name the postural deformity indicated by the exaggerated inward lumbar curvature.",
          answer: "Lordosis (Hollow back / Saddle back)."
        },
        {
          question: "Case 2, Q4: Recommend two therapeutic yogic asanas and one nutritional intervention for recovery.",
          answer: "Therapeutic Asanas: Halasana (Plow pose) and Paschimottanasana (Seated Forward Bend) to stretch and decompress the lumbar spine. Nutritional intervention: Increase daily caloric intake with energy-dense nutrient foods and supplement with Calcium and Vitamin D3 under sports physician supervision."
        }
      ]
    };
  }

  // If MCQs requested
  if (contentType === 'MCQ') {
    return {
      title: `${topic} — CBSE Board Exam MCQs & Model Solutions`,
      contentType: 'MCQ',
      content: `CBSE CLASS ${cleanGrade} PHYSICAL EDUCATION (CODE 048)
HIGH-YIELD BOARD MULTIPLE CHOICE QUESTIONS (MCQs)

The following board-standard questions strictly reflect the latest CBSE examination pattern with 4 distinct options, correct answers, and concise conceptual rationales.`,
      questions: [
        {
          question: "Q1. In a single knockout tournament of 21 teams, how many total byes will be awarded?",
          answer: "Option C: 11 Byes. (Rationale: Next power of 2 greater than 21 is 32. Total byes = 32 - 21 = 11 byes)."
        },
        {
          question: "Q2. Which of the following postural deformities is characterized by an abnormal lateral (sideways) curvature of the vertebral column?",
          answer: "Option B: Scoliosis. (Rationale: Kyphosis is excessive posterior curvature of thoracic spine; Lordosis is inward lumbar curvature; Scoliosis is lateral deviation forming an 'S' or 'C' shape)."
        },
        {
          question: "Q3. Which yogic asana is contraindicated for individuals suffering from severe peptic ulcers and acute high blood pressure?",
          answer: "Option A: Bhujangasana & Chakrasana. (Rationale: Excessive backward spinal bending increases intra-abdominal and cardiac arterial pressure, triggering complications)."
        },
        {
          question: "Q4. What is the length of the stepping bench used for male participants in the Harvard Step Test?",
          answer: "Option D: 20 inches (50.8 cm). (Rationale: Male bench height is 20 inches; for females it is 16 inches, stepping at 30 steps/min for 5 minutes)."
        },
        {
          question: "Q5. A physical educator observes that a javelin thrower maximizes throwing distance by accelerating along the runway before the launch. Which law of motion explains this momentum transfer?",
          answer: "Option A: Newton's Second Law of Motion (Law of Acceleration, F = ma)."
        },
        {
          question: "Q6. In the PRICE protocol for managing acute sports soft-tissue injuries, what does 'C' stand for?",
          answer: "Option C: Compression. (Rationale: Compression using an elastic crepe bandage prevents pooling of interstitial fluid and reduces localized swelling)."
        },
        {
          question: "Q7. According to Carl Jung's psychological classification, an athlete who is reserved, prefers individual sports, and is reflective is categorized as an:",
          answer: "Option B: Introvert. (Rationale: Introverts focus internal energy on self-reflection and excel in individual precision sports like archery, shooting, and long-distance running)."
        },
        {
          question: "Q8. Swedish Speed-Play endurance training conducted over natural undulating terrain is universally known as:",
          answer: "Option C: Fartlek Training. (Rationale: Introduced by Gösta Holmér in 1937, Fartlek blends continuous aerobic running with sudden pace accelerations)."
        }
      ]
    };
  }

  // Default: Comprehensive Study Notes
  return {
    title: `${topic} — CBSE Master Study Notes (Code 048)`,
    contentType: 'Notes',
    content: `CBSE CLASS ${cleanGrade} PHYSICAL EDUCATION — COMPREHENSIVE STUDY NOTES
CHAPTER TOPIC: ${topic.toUpperCase()}

1. CORE DEFINITION & SYLLABUS OVERVIEW
Physical Education in the Indian secondary curriculum serves as an integrated biological and behavioral science bridging motor fitness, physiology, sports biomechanics, and lifetime wellness.

2. DETAILED CONCEPTUAL BLUEPRINT
• Foundations: Every athletic movement is governed by neuro-muscular recruitment, energy systems (ATP-PC, Glycolytic, Oxidative), and biomechanical lever mechanics.
• Health & Posture: Maintaining neutral plumb-line posture minimizes spinal disc shear forces. Regular therapeutic asanas (Tadasana, Bhujangasana, Gomukhasana) prevent degenerative structural deformities (Kyphosis, Lordosis, Scoliosis, Knock Knees, Flat Foot).
• Training Methodology: The progression of strength (Isometric, Isotonic, Isokinetic), endurance (Continuous, Interval, Fartlek), and flexibility (Static, Dynamic, PNF) must be structured across periodized cycles (Macro, Meso, Micro) with adequate recovery to prevent overtraining syndrome.
• Sports Injuries & First Aid: Soft tissue injuries (sprains, strains, contusions, abrasions) require immediate application of the PRICE protocol (Protect, Rest, Ice, Compression, Elevation) within the acute 24-48 hour window to restrict edema and secondary cellular hypoxia.

3. EXAM-ORIENTED FORMULAS & CALCULATION CHEAT SHEET
• Knockout Tournament Total Matches: M = N - 1
• Knockout Byes Formula: Next Power of 2 (2ⁿ) - N
• Upper Half Teams: (N + 1) / 2 | Lower Half Teams: (N - 1) / 2
• Harvard Step Test Long Form Fitness Index: (Duration in sec × 100) / (2 × Sum of 3 pulse counts at 1-1.5m, 2-2.5m, 3-3.5m)
• Body Mass Index (BMI): Weight in kg / (Height in meters)²
  - < 18.5: Underweight
  - 18.5 - 24.9: Normal Healthy Weight
  - 25.0 - 29.9: Overweight
  - ≥ 30.0: Obese

4. HIGH-YIELD BOARD EXAM SUMMARY POINTS
✓ Always state precise committee duties (Pre, During, and Post event) in 3-mark and 5-mark sports management questions.
✓ When illustrating tournament fixtures, explicitly mark upper/lower half division, step-by-step bye numbering, and match counts.
✓ Differentiate clearly between Sprain (injury to ligaments connecting bone to bone) and Strain (injury to muscle fibers or tendons connecting muscle to bone).
✓ Remember Newton's Third Law (Action-Reaction) is central to high jump takeoff, running track starts, and swimming wall push-offs.`,
    questions: [
      {
        question: "Explain the procedure of calculating Byes in a Knockout tournament with a concrete example of 13 teams.",
        answer: "For 13 teams: (1) Total matches = N - 1 = 12 matches. (2) Next power of 2 greater than 13 is 16. Total Byes = 16 - 13 = 3 Byes. (3) Upper half teams = (13+1)/2 = 7 teams. Lower half teams = (13-1)/2 = 6 teams. (4) 1st Bye goes to Lower Half bottom, 2nd Bye to Upper Half top, 3rd Bye to Lower Half top."
      },
      {
        question: "Differentiate between Isometric and Isotonic exercises with two sports examples for each.",
        answer: "Isometric exercises involve static muscle tension without change in muscle length or visible joint movement (e.g., pushing against a wall, holding a plank). Isotonic exercises involve dynamic contractions with visible movement and change in muscle length, comprising concentric (shortening) and eccentric (lengthening) phases (e.g., bicep curls, squats, bench press)."
      },
      {
        question: "Enumerate any four procedures and benefits of Bhujangasana for postural and lifestyle health.",
        answer: "Procedure: Lie prone on stomach, place palms near chest, inhale and slowly arch the head, neck, and upper trunk upwards keeping navel near floor. Benefits: Strengthens spine and lumbar musculature, relieves chronic backache, stimulates abdominal organs for diabetes management, and opens the chest cavity for asthma relief."
      }
    ]
  };
};
