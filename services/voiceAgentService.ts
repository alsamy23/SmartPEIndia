/**
 * SmartPE Voice Agent & Feature Navigator Service
 * Provides multilingual voice query understanding, intent mapping, feature resolution,
 * and conversational guidance for Physical Education teachers and sports coaches.
 */

export interface VoiceFeatureAction {
  tabId: string;
  featureTitle: string;
  category: string;
  keywords: string[];
  spokenGuide: string;
  screenGuidance: string;
  quickActionLabel: string;
  sampleQuestions: string[];
  iconName: string;
}

export interface VoiceAgentResponse {
  query: string;
  understoodIntent: string;
  matchedFeature: VoiceFeatureAction | null;
  directAnswer: string;
  spokenAudioText: string;
  recommendedActions?: {
    label: string;
    tabId: string;
    actionType?: string;
  }[];
  isDirectAnswerOnly?: boolean;
}

export const APP_FEATURES_CATALOG: VoiceFeatureAction[] = [
  {
    tabId: 'coaching-academy',
    featureTitle: 'Coaching & Academy (Batches & Skills)',
    category: 'Coaching & Academy',
    keywords: [
      'batch', 'batches', 'academy', 'coaching', 'player skill', 'skill level', 
      'skills level', 'rating', 'skills 20', '12 basic skills', 'add player', 
      'sports batch', 'cricket batch', 'football batch', 'tennis batch', 'basketball batch', 
      'player rating', 'badminton batch', 'swimming batch', 'player report'
    ],
    spokenGuide: 'The Coaching and Academy hub lets you manage sports batches, evaluate individual player skills across 12 to 20 game-specific technical levels, and generate printable parent reports.',
    screenGuidance: 'Click the "Batches & Rosters" tab to select a sport batch, or click "Add Player" to evaluate your players on the 12 to 20 technical skills checklist.',
    quickActionLabel: 'Open Coaching Academy & Batches',
    sampleQuestions: [
      'Where can I add players to sports batches?',
      'Show me player skill levels and ratings',
      'How to evaluate 20 basic skills for basketball or tennis?'
    ],
    iconName: 'Trophy'
  },
  {
    tabId: 'planner',
    featureTitle: 'PE Lesson Plan Generator',
    category: 'Plan',
    keywords: [
      'lesson', 'lesson plan', 'period plan', 'daily plan', 'warmup', 
      'cooldown', 'cbse lesson', 'icse lesson', 'generate plan', 'today plan'
    ],
    spokenGuide: 'The PE Lesson Plan Generator creates complete CBSE and state aligned 45-minute lesson plans with warm-ups, main activities, safety tips, and cool-downs in under 60 seconds.',
    screenGuidance: 'Select your grade level, sports topic, and duration, then click "Generate Lesson Plan" to create or download your plan.',
    quickActionLabel: 'Create Daily Lesson Plan',
    sampleQuestions: [
      'Create a basketball lesson plan for grade 7',
      'Where can I make today\'s PE period plan?',
      'Generate lesson plan with warmup and cooldown'
    ],
    iconName: 'Sparkles'
  },
  {
    tabId: 'yearly',
    featureTitle: '40-Week Yearly Curriculum Planner',
    category: 'Plan',
    keywords: [
      'yearly', 'yearly plan', 'curriculum', '40 weeks', 'annual plan', 
      'syllabus', 'term plan', 'year plan', 'academic year'
    ],
    spokenGuide: 'The Yearly Planner maps out a 40-week physical education syllabus divided into Term 1 and Term 2 according to age and sports units.',
    screenGuidance: 'Choose your class grade and sports focus to view or export the full 40-week curriculum chart.',
    quickActionLabel: 'Open Yearly Curriculum Planner',
    sampleQuestions: [
      'Where is the 40 week yearly syllabus plan?',
      'Show annual curriculum breakdown for classes'
    ],
    iconName: 'CalendarRange'
  },
  {
    tabId: 'weekly-planner',
    featureTitle: 'Weekly Academic Lesson Splitter',
    category: 'Plan',
    keywords: [
      'weekly', 'week plan', 'timetable', 'split lesson', 'homework', 'period schedule'
    ],
    spokenGuide: 'The Weekly Academic Planner breaks down your curriculum into weekly lesson units and practical field drills.',
    screenGuidance: 'Select the class to see Monday through Friday scheduled practicals and theory topics.',
    quickActionLabel: 'Open Weekly Academic Planner',
    sampleQuestions: [
      'Where can I plan weekly PE periods?',
      'Split lesson plans by weekly timetable'
    ],
    iconName: 'CalendarRange'
  },
  {
    tabId: 'workload-planner',
    featureTitle: 'Workload & Timetable Planner',
    category: 'Plan',
    keywords: [
      'workload', 'teacher periods', 'substitute', 'workload planner', 'teacher schedule', 'duty'
    ],
    spokenGuide: 'The Workload Planner organizes PE teacher period allocation, ground availability, and duty schedules.',
    screenGuidance: 'Inspect your weekly period quota and playground slots to balance teaching workload.',
    quickActionLabel: 'Open Workload & Timetable',
    sampleQuestions: [
      'How do I balance PE teacher workload and ground slots?'
    ],
    iconName: 'CalendarRange'
  },
  {
    tabId: 'fitness',
    featureTitle: 'Student Fitness Assessment & Battery',
    category: 'Assess',
    keywords: [
      'fitness', 'fitness test', 'bmi', 'sit and reach', '50m', '600m', 
      'pushups', 'curl ups', 'assess students', 'fitness score', 'test battery', 'enter scores'
    ],
    spokenGuide: 'The Student Fitness Assessment lets you record official Khelo India test scores including BMI, 50-meter dash, 600-meter run, sit and reach flexibility, and strength tests.',
    screenGuidance: 'Select class and section, then enter test measurements or use voice input to log student scores directly.',
    quickActionLabel: 'Enter Student Fitness Scores',
    sampleQuestions: [
      'Where can I enter student fitness test scores?',
      'How to test BMI, 50m dash, and flexibility?',
      'Record Khelo India fitness battery scores'
    ],
    iconName: 'Activity'
  },
  {
    tabId: 'cbse-practical',
    featureTitle: 'CBSE Class 11 & 12 Practical (30 Marks)',
    category: 'Assess',
    keywords: [
      'cbse practical', '30 marks', 'practical exam', 'viva', 'physical fitness test', 
      'class 11 practical', 'class 12 practical', 'practical score', 'award sheet'
    ],
    spokenGuide: 'The CBSE Practical Hub manages official Class 11 and 12 30-mark practical exams with instant viva scoring, record book marks, and printable board award sheets.',
    screenGuidance: 'Choose Class 11 or 12, select your sports specialty, and grade students across the 4 CBSE practical components.',
    quickActionLabel: 'Open CBSE Practical (30M) Hub',
    sampleQuestions: [
      'Where is the CBSE 30-mark practical sheet?',
      'How to grade Class 12 physical education practical exam?'
    ],
    iconName: 'ClipboardCheck'
  },
  {
    tabId: 'tournament-fixtures',
    featureTitle: 'Tournament Fixtures & Brackets',
    category: 'Assess',
    keywords: [
      'tournament', 'fixture', 'bracket', 'knockout', 'league', 
      'round robin', 'matches', 'sports day', 'draws', 'byes'
    ],
    spokenGuide: 'The Tournament Maker creates instant single elimination knockout brackets with automatic byes, as well as round-robin league schedules with points tables.',
    screenGuidance: 'Enter team names or number of teams, choose Knockout or Round Robin, and click "Generate Fixture" to print or save.',
    quickActionLabel: 'Create Tournament Fixture',
    sampleQuestions: [
      'How to generate a 16-team knockout fixture bracket?',
      'Create sports day league tournament table'
    ],
    iconName: 'Trophy'
  },
  {
    tabId: 'rules',
    featureTitle: 'Game Rules Bot & Board Games',
    category: 'Assess',
    keywords: [
      'rules', 'rule', 'doubt', 'board game', 'chess', 'carrom', 'scrabble', 
      'badminton rules', 'table tennis rules', 'football rules', 'referee', 'foul', 'court size'
    ],
    spokenGuide: 'The Game Rules Bot provides instant clarification on official rules, court dimensions, player positions, and referee signals for outdoor sports and indoor board games like Chess, Carrom, and Scrabble.',
    screenGuidance: 'Pick any sport or board game from the top selector, or speak your doubt into the microphone to get an immediate verified rule explanation.',
    quickActionLabel: 'Ask Game Rules & Board Games',
    sampleQuestions: [
      'What are the official rules of Carrom or Chess?',
      'Explain offside rule in football or service rule in badminton'
    ],
    iconName: 'Book'
  },
  {
    tabId: 'testpaper',
    featureTitle: 'Question Paper Generator',
    category: 'Assess',
    keywords: [
      'test paper', 'question paper', 'exam', 'mcq', 'theory exam', 'unit test', 'term exam'
    ],
    spokenGuide: 'The Question Paper Generator builds CBSE-pattern theory test papers with MCQs, short answers, case studies, and full answer keys with marking schemes.',
    screenGuidance: 'Select Class, syllabus units, total marks, and difficulty to generate ready-to-print question papers.',
    quickActionLabel: 'Generate PE Question Paper',
    sampleQuestions: [
      'Create a 35 mark unit test paper with answer key',
      'Where can I make Physical Education exam question papers?'
    ],
    iconName: 'ClipboardList'
  },
  {
    tabId: 'fitness-reports',
    featureTitle: 'Fitness Reports & Report Cards',
    category: 'Record',
    keywords: [
      'report', 'report card', 'fitness report', 'student card', 'progress card', 'print report'
    ],
    spokenGuide: 'The Fitness Reports hub generates individual student fitness report cards with percentile badges, health recommendations, and parent signatures.',
    screenGuidance: 'Filter by student or class to preview and print official fitness report cards in bulk or individually.',
    quickActionLabel: 'Generate Student Fitness Report Cards',
    sampleQuestions: [
      'Where do I download student fitness report cards?',
      'Generate printable fitness cards for parents'
    ],
    iconName: 'FileText'
  },
  {
    tabId: 'parentletters',
    featureTitle: 'Parent Letters & Notices',
    category: 'Communicate & Admin',
    keywords: [
      'parent', 'parent letter', 'notice', 'consent form', 'injury letter', 'sports day letter', 'medical consent'
    ],
    spokenGuide: 'Parent Letters drafts formal school notices for sports day participation, tournament travel consent, fitness health alerts, and injury reports.',
    screenGuidance: 'Select a letter template, customize student name and event date, then copy or print the signed letter.',
    quickActionLabel: 'Draft Parent Consent Letters',
    sampleQuestions: [
      'Draft a parent consent letter for tournament travel',
      'Where can I write sports day circulars for parents?'
    ],
    iconName: 'Mail'
  },
  {
    tabId: 'widgets',
    featureTitle: 'PE Classroom Widgets & Tools',
    category: 'Communicate & Admin',
    keywords: [
      'widget', 'timer', 'stopwatch', 'scoreboard', 'whistle', 'interval timer', 'beep test audio', 'counter'
    ],
    spokenGuide: 'Classroom Widgets includes giant digital interval timers, whistle sounds, live match scoreboards, and student group randomizers for active playground periods.',
    screenGuidance: 'Click the widget you need on the field: interval timer, match scoreboard, or whistle sound.',
    quickActionLabel: 'Open Field Widgets & Timers',
    sampleQuestions: [
      'Where is the interval timer and scoreboard?',
      'Open PE classroom stopwatch and whistle'
    ],
    iconName: 'Zap'
  },
  {
    tabId: 'department-office',
    featureTitle: 'PE Department Office & Assets',
    category: 'Communicate & Admin',
    keywords: [
      'department', 'office', 'equipment', 'inventory', 'stock', 'house points', 'sports stock', 'balls count'
    ],
    spokenGuide: 'The Department Office manages sports equipment inventory, ground booking, inter-house points tally, and substitute teacher plans.',
    screenGuidance: 'Review equipment stock, check out sports gear to teachers, and record inter-house competition points.',
    quickActionLabel: 'Open PE Department Office',
    sampleQuestions: [
      'Where do I manage sports equipment inventory and house points?'
    ],
    iconName: 'ClipboardList'
  },
  {
    tabId: 'principal-dashboard',
    featureTitle: 'Principal Health & PE Dashboard',
    category: 'Record',
    keywords: [
      'principal', 'admin report', 'school health', 'inspection', 'management summary', 'executive'
    ],
    spokenGuide: 'The Principal Dashboard provides executive-level summaries of whole-school physical fitness, participation rates, and inspection-ready compliance data.',
    screenGuidance: 'View school-wide BMI distributions, top athlete achievements, and term health trends.',
    quickActionLabel: 'Open Principal Dashboard',
    sampleQuestions: [
      'Show principal executive report for school fitness'
    ],
    iconName: 'ShieldCheck'
  },
  {
    tabId: 'theory',
    featureTitle: 'Theory Master (CBSE Syllabus Notes)',
    category: 'Plan',
    keywords: [
      'theory', 'cbse notes', 'chapter', 'biomechanics', 'anatomy', 'physiology', 'yoga', 'olympic', 'class 11 theory', 'class 12 theory'
    ],
    spokenGuide: 'Theory Master includes complete syllabus study notes, chapter summaries, diagrams, and revision flashcards for CBSE Class 11 and 12 Physical Education.',
    screenGuidance: 'Select Class 11 or 12 to read or teach unit notes on Yoga, Anatomy, Biomechanics, Sports Psychology, and Training.',
    quickActionLabel: 'Open PE Theory Master',
    sampleQuestions: [
      'Where can I find Class 12 Biomechanics or Yoga notes?'
    ],
    iconName: 'GraduationCap'
  },
  {
    tabId: 'subscription-plans',
    featureTitle: 'Plans & 1-Year Free Pass',
    category: 'Corporate Info',
    keywords: [
      'price', 'pricing', 'free pass', 'plans', 'cost', 'subscription', 'license', 'school pricing'
    ],
    spokenGuide: 'SmartPE offers a 1-Year Free Pass for PE educators, along with full school-wide multi-teacher institutional plans.',
    screenGuidance: 'View available subscription tiers or activate your 1-Year Free Pass with one click.',
    quickActionLabel: 'View Subscription & Free Pass',
    sampleQuestions: [
      'How much does smartpe cost and how to activate 1 year free pass?'
    ],
    iconName: 'Zap'
  }
];

export class VoiceAgentService {
  /**
   * Fast rule-based intent resolver (Instant zero-latency response)
   */
  resolveFastIntent(rawQuery: string): VoiceAgentResponse | null {
    const q = rawQuery.toLowerCase().trim();
    if (!q || q.length < 2) return null;

    let bestMatch: VoiceFeatureAction | null = null;
    let maxScore = 0;

    for (const feature of APP_FEATURES_CATALOG) {
      let score = 0;
      
      // Match keywords
      for (const kw of feature.keywords) {
        if (q.includes(kw)) {
          score += kw.length > 5 ? 3 : 2;
        }
      }

      // Check title match
      if (q.includes(feature.featureTitle.toLowerCase())) {
        score += 5;
      }

      // Check category match
      if (q.includes(feature.category.toLowerCase())) {
        score += 1;
      }

      if (score > maxScore) {
        maxScore = score;
        bestMatch = feature;
      }
    }

    if (bestMatch && maxScore >= 2) {
      return {
        query: rawQuery,
        understoodIntent: `Looking for ${bestMatch.featureTitle}`,
        matchedFeature: bestMatch,
        directAnswer: bestMatch.spokenGuide,
        spokenAudioText: bestMatch.spokenGuide,
        recommendedActions: [
          {
            label: bestMatch.quickActionLabel,
            tabId: bestMatch.tabId,
            actionType: 'navigate'
          }
        ]
      };
    }

    return null;
  }

  /**
   * Deep AI intent resolver using Gemini backend proxy (handles multilingual input, Indian languages, complex sports queries)
   */
  async resolveWithAI(spokenQuery: string, languageHint?: string): Promise<VoiceAgentResponse> {
    // Try fast resolution first
    const fast = this.resolveFastIntent(spokenQuery);
    if (fast) return fast;

    try {
      const catalogSummary = APP_FEATURES_CATALOG.map(f => ({
        tabId: f.tabId,
        title: f.featureTitle,
        category: f.category,
        description: f.spokenGuide
      }));

      const systemPrompt = `You are the AI Voice Navigator & Sports Expert Copilot for "SmartPE India" (the world-class physical education platform by L. Samy).
The user spoke a query in any language (English, Hindi, Tamil, Telugu, Marathi, Bengali, etc.).

Your job:
1. Identify the user's intent. If they spoke in a regional language, understand the meaning.
2. Match their request to the best destination in our application catalog from this list:
${JSON.stringify(catalogSummary, null, 2)}

3. Respond in concise JSON with these fields:
{
  "understoodIntent": "Clear short phrase describing what user wants",
  "matchedTabId": "exact tabId from catalog or null if general question",
  "directAnswer": "Short, clear answer in very simple words (2-3 sentences max). No AI jargon.",
  "spokenAudioText": "Clean conversational speech text that can be spoken via Text-To-Speech to the teacher on the field.",
  "screenGuidance": "1 sentence explaining where on that screen to look or click (e.g. 'Click Add Player at the top to score 20 skill levels')."
}`;

      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [
                { text: `${systemPrompt}\n\nUser Voice Query: "${spokenQuery}"` }
              ]
            }
          ],
          config: {
            responseMimeType: 'application/json',
            temperature: 0.2
          }
        })
      });

      if (!response.ok) {
        throw new Error(`AI request failed with status ${response.status}`);
      }

      const rawData = await response.json();
      let text = rawData?.candidates?.[0]?.content?.parts?.[0]?.text || rawData?.text || '{}';
      
      // Clean possible markdown code fences
      text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(text);

      let matchedFeature: VoiceFeatureAction | null = null;
      if (parsed.matchedTabId) {
        matchedFeature = APP_FEATURES_CATALOG.find(f => f.tabId === parsed.matchedTabId) || null;
      }

      return {
        query: spokenQuery,
        understoodIntent: parsed.understoodIntent || 'Navigation & PE Guidance',
        matchedFeature,
        directAnswer: parsed.directAnswer || (matchedFeature ? matchedFeature.spokenGuide : 'I can help you navigate to any PE tool or answering sports questions.'),
        spokenAudioText: parsed.spokenAudioText || parsed.directAnswer || '',
        recommendedActions: matchedFeature ? [
          {
            label: matchedFeature.quickActionLabel,
            tabId: matchedFeature.tabId
          }
        ] : []
      };
    } catch (err: any) {
      console.warn('AI resolution failed, falling back to general catalog:', err);
      // Fallback
      return {
        query: spokenQuery,
        understoodIntent: 'Explore SmartPE Features',
        matchedFeature: APP_FEATURES_CATALOG[0],
        directAnswer: 'You can explore all coaching batches, lesson planners, fitness tests, tournament fixtures, and board game rules using the menu.',
        spokenAudioText: 'You can explore all coaching batches, lesson planners, fitness tests, and tournament fixtures from the menu.',
        recommendedActions: [
          { label: 'Open Coaching & Batches', tabId: 'coaching-academy' },
          { label: 'Open Fitness Tests', tabId: 'fitness' }
        ]
      };
    }
  }

  /**
   * Speak audio aloud using browser Web Speech API (Text-To-Speech)
   */
  speakText(text: string): void {
    if (!('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel(); // Stop any active speech
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      
      // Try finding Indian English or English voice if available
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(v => v.lang.includes('en-IN') || v.lang.includes('en-GB') || v.lang.includes('en-US'));
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }
      
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis error:', e);
    }
  }

  /**
   * Stop active speech output
   */
  stopSpeaking(): void {
    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {
        // ignore
      }
    }
  }
}

export const voiceAgentService = new VoiceAgentService();
