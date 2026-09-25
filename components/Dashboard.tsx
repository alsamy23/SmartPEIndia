
import React from 'react';
import { 
  TrendingUp, 
  Users, 
  FileText, 
  Video, 
  Calendar,
  ChevronRight,
  Trophy,
  Sparkles,
  AlertTriangle,
  GraduationCap,
  ArrowRight,
  Clock,
  Trash2,
  Download,
  BookOpen,
  Target,
  Wrench,
  Book,
  Activity,
  Loader2,
  RotateCcw,
  Microscope,
  Dumbbell,
  ClipboardList,
  ClipboardCheck,
  ShieldCheck,
  Mail,
  Zap,
  Timer
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend, BarChart, Bar } from 'recharts';
import { storageService, SavedItem } from '../services/storageService.ts';
import Logo from './Logo.tsx';
import { WeeklyCalendarView } from './WeeklyCalendarView.tsx';

const data = [
  { name: 'Mon', connections: 4 },
  { name: 'Tue', connections: 7 },
  { name: 'Wed', connections: 5 },
  { name: 'Thu', connections: 12 },
  { name: 'Fri', connections: 8 },
  { name: 'Sat', connections: 15 },
  { name: 'Sun', connections: 10 },
];

const containerVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.1,
    }
  }
} as const;

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  show: { 
    opacity: 1, 
    y: 0, 
    transition: { 
      type: "spring" as const, 
      stiffness: 100, 
      damping: 15 
    } 
  }
} as const;

const classProgressData = {
  '8-A': [
    { checkpoint: 'Baseline (July)', speed: 9.8, flexibility: 14.5, endurance: 185 },
    { checkpoint: 'Midline (Nov)', speed: 9.2, flexibility: 16.8, endurance: 165 },
    { checkpoint: 'Year-End (Mar)', speed: 8.5, flexibility: 19.2, endurance: 148 },
  ],
  '7-C': [
    { checkpoint: 'Baseline (July)', speed: 10.4, flexibility: 12.0, endurance: 205 },
    { checkpoint: 'Midline (Nov)', speed: 9.9, flexibility: 14.2, endurance: 182 },
    { checkpoint: 'Year-End (Mar)', speed: 9.1, flexibility: 17.5, endurance: 162 },
  ],
  '9-B': [
    { checkpoint: 'Baseline (July)', speed: 8.9, flexibility: 16.0, endurance: 155 },
    { checkpoint: 'Midline (Nov)', speed: 8.4, flexibility: 18.5, endurance: 140 },
    { checkpoint: 'Year-End (Mar)', speed: 7.9, flexibility: 21.0, endurance: 125 },
  ],
};

const cbseNepStrands = [
  { id: 'S1', name: 'Strand 1: Games & Sports', desc: 'Athletics, team sports, and adventure play.' },
  { id: 'S2', name: 'Strand 2: Health & Fitness', desc: 'Yoga, nutrition, physical literacy checklists, and health checkups.' },
  { id: 'S3', name: 'Strand 3: SEWA', desc: 'Social empowerment, student leadership, hygiene campaigns, and first-aid.' },
  { id: 'S4', name: 'Strand 4: Health Card', desc: 'Ongoing diagnostic health cards and BMI fitness audits.' }
];

const curriculumUnits = [
  {
    id: 'U1',
    term: 1,
    title: 'Athletics & Fundamental Movement Skills',
    strandId: 'S1',
    strandName: 'Games & Sports (Strand 1)',
    description: 'Master sprint block starts, running mechanics, jumping, throwing, and continuous pacing.',
    targetLessons: 4,
    keywords: ['sprint', 'run', 'athletics', 'jump', 'throw', 'speed', 'start', 'relay', 'pacing', 'track', 'field'],
    timeline: 'April - June'
  },
  {
    id: 'U2',
    term: 1,
    title: 'Ball Handling & Sports Mechanics (Football / Basketball)',
    strandId: 'S1',
    strandName: 'Games & Sports (Strand 1)',
    description: 'Drills for ball control, passing, dribbling technique, coordination, and defensive stance.',
    targetLessons: 4,
    keywords: ['football', 'basketball', 'dribble', 'pass', 'layup', 'soccer', 'shooting', 'ball', 'defense', 'handling'],
    timeline: 'July - August'
  },
  {
    id: 'U3',
    term: 1,
    title: 'Nutritional Hygiene & Injury Response First Aid',
    strandId: 'S2',
    strandName: 'Health & Fitness (Strand 2)',
    description: 'Basics of balanced diets, macro/micro nutrients, safe sports warm-ups, and treating minor sprains.',
    targetLessons: 3,
    keywords: ['nutrition', 'diet', 'food', 'sprain', 'injury', 'first aid', 'warm-up', 'hydration', 'hygiene', 'safety'],
    timeline: 'September'
  },
  {
    id: 'U4',
    term: 2,
    title: 'Yoga Asanas & Postural Corrections',
    strandId: 'S2',
    strandName: 'Health & Fitness (Strand 2)',
    description: 'Flexibility development through Surya Namaskar, core strengthening asanas, and correcting slouching postures.',
    targetLessons: 4,
    keywords: ['yoga', 'asana', 'surya', 'stretch', 'posture', 'flexibility', 'slouch', 'breathing', 'pranayama'],
    timeline: 'October - December'
  },
  {
    id: 'U5',
    term: 2,
    title: 'Advanced Team Strategy & Intra-mural Rules',
    strandId: 'S3',
    strandName: 'SEWA (Strand 3)',
    description: 'Offensive and defensive formations, understanding referee hand gestures, and organizing fair-play games.',
    targetLessons: 4,
    keywords: ['referee', 'tactics', 'strategy', 'defense', 'offense', 'formation', 'rules', 'tournament', 'umpire', 'leadership'],
    timeline: 'January'
  },
  {
    id: 'U6',
    term: 2,
    title: 'SEWA Projects & Individual Health Cards',
    strandId: 'S4',
    strandName: 'Health Card (Strand 4)',
    description: 'Completing individual physical literacy profiles, BMI mapping, and conducting physical fitness audits.',
    targetLessons: 3,
    keywords: ['sewa', 'health card', 'profile', 'bmi', 'audit', 'leadership', 'report', 'card', 'scoring', 'record', 'sheet'],
    timeline: 'February - March'
  }
];

const Dashboard: React.FC<{ 
  apiStatus?: 'checking' | 'ok' | 'missing' | 'quota',
  debugInfo?: any,
  onTestConnection?: () => Promise<void>,
  isTesting?: boolean,
  onNavigate?: (tab: any) => void
}> = ({ apiStatus, debugInfo, onTestConnection, isTesting, onNavigate }) => {
  const [history, setHistory] = React.useState<SavedItem[]>([]);
  
  // Interactive Dashboard States
  const [selectedClassProgress, setSelectedClassProgress] = React.useState<'8-A' | '7-C' | '9-B'>('8-A');
  const [selectedMetricType, setSelectedMetricType] = React.useState<'fitness' | 'skills' | 'interventions'>('fitness');
  const [downloadStatus, setDownloadStatus] = React.useState<string | null>(null);
  const [activeDeptTab, setActiveDeptTab] = React.useState<'metrics' | 'inventory' | 'substitutions' | 'house-points'>('metrics');
  const [housePoints, setHousePoints] = React.useState({ Agni: 420, Jal: 380, Prithvi: 450, Vayu: 410 });
  const [sampleOutputTab, setSampleOutputTab] = React.useState<'lesson' | 'rubric' | 'report' | 'inspection'>('lesson');
  const [pitchRoleTab, setPitchRoleTab] = React.useState<'teacher' | 'hod' | 'principal'>('teacher');

  // Curriculum & Strand Overview States
  const [isCurriculumModalOpen, setIsCurriculumModalOpen] = React.useState(false);
  const [selectedCurriculumTerm, setSelectedCurriculumTerm] = React.useState<'all' | '1' | '2'>('all');
  const [selectedCurriculumClass, setSelectedCurriculumClass] = React.useState<string>('Grade 8');

  // Populate realistic CBSE lesson plans to demonstrate full strand progress tracking instantly
  const handleSimulateSyllabus = () => {
    const demoItems = [
      {
        type: 'Lesson Plan' as const,
        title: 'Grade 8 Athletics - 100m Sprint Block Start & Acceleration mechanics',
        content: { sport: 'Athletics', topic: 'Sprint Block Starts', grade: '8' },
        metadata: { strand: 'Strand 1' }
      },
      {
        type: 'Lesson Plan' as const,
        title: 'Grade 8 Athletics - Long Jump Takeoff Technique & Landing safety',
        content: { sport: 'Athletics', topic: 'Long Jump Mechanics', grade: '8' },
        metadata: { strand: 'Strand 1' }
      },
      {
        type: 'Lesson Plan' as const,
        title: 'Grade 8 Football - Inside-of-the-foot Passing & Dynamic Spacing',
        content: { sport: 'Football', topic: 'Passing Drills', grade: '8' },
        metadata: { strand: 'Strand 1' }
      },
      {
        type: 'Lesson Plan' as const,
        title: 'Grade 8 Basketball - Chest Pass & Triple Threat Stance Practice',
        content: { sport: 'Basketball', topic: 'Chest Pass and Stance', grade: '8' },
        metadata: { strand: 'Strand 1' }
      },
      {
        type: 'Lesson Plan' as const,
        title: 'Grade 8 Health - Balanced Diets, Macro-Nutrients & Hydration Plans',
        content: { topic: 'Nutrition and Energy', grade: '8' },
        metadata: { strand: 'Strand 2' }
      },
      {
        type: 'Lesson Plan' as const,
        title: 'Grade 8 Yoga - Surya Namaskar Sequence, Core Stretches & Alignment',
        content: { sport: 'Yoga', topic: 'Surya Namaskar Stretches', grade: '8' },
        metadata: { strand: 'Strand 2' }
      },
      {
        type: 'Lesson Plan' as const,
        title: 'Grade 8 SEWA - Peer First-Aid Responders & Soft Tissue Injury Care',
        content: { topic: 'First Aid Protocols', grade: '8' },
        metadata: { strand: 'Strand 3' }
      },
      {
        type: 'Lesson Plan' as const,
        title: 'Grade 8 Record Keeping - Individual Physical Health Card Audits',
        content: { topic: 'Health Cards & BMI checks', grade: '8' },
        metadata: { strand: 'Strand 4' }
      }
    ];

    demoItems.forEach(item => {
      storageService.saveItem(item);
    });

    // Refresh history
    setHistory(storageService.getAllItems());
  };

  React.useEffect(() => {
    setHistory(storageService.getAllItems());
  }, []);

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    storageService.deleteItem(id);
    setHistory(storageService.getAllItems());
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'Lesson Plan': return <FileText className="text-indigo-500" />;
      case 'Theory': return <GraduationCap className="text-indigo-600" />;
      case 'Skill': return <Target className="text-emerald-500" />;
      case 'Rule': return <Book className="text-amber-500" />;
      case 'Tool': return <Activity className="text-indigo-600" />;
      case 'TestPaper': return <ClipboardList className="text-emerald-500" />;
      default: return <Wrench className="text-slate-500" />;
    }
  };

  return (
    <div className="space-y-6 md:space-y-10 pb-20 overflow-x-hidden relative">
      {/* Persistent Compact Floating Action Toolbar */}
      <div className="sticky top-1 sm:top-2 z-30 w-full mb-2">
        <div className="bg-[#0D2B52]/95 backdrop-blur-md text-white border-2 border-slate-900 rounded-2xl sm:rounded-full p-2 px-3 sm:px-4 shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] flex items-center justify-between gap-2.5 overflow-x-auto custom-scrollbar">
          <div className="flex items-center gap-2 shrink-0 pr-2 border-r border-slate-700/80">
            <span className="w-2 h-2 rounded-full bg-[#D4A017] animate-pulse"></span>
            <span className="text-[10px] font-black uppercase tracking-widest text-[#D4A017] whitespace-nowrap">Quick Tools</span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2.5 overflow-x-auto no-scrollbar py-0.5">
            {[
              { id: 'coaching-academy', label: 'Coaching & Academy', icon: Trophy, color: 'bg-amber-400 text-slate-950 hover:bg-amber-300 font-black shadow-sm' },
              { id: 'planner', label: 'Generate Lesson', icon: Sparkles, color: 'bg-[#D4A017] text-slate-900 hover:bg-[#e0b028] shadow-xs' },
              { id: 'cbse-practical', label: 'CBSE Practical (30M)', icon: ClipboardCheck, color: 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40' },
              { id: 'fitness', label: 'Fitness Test', icon: Activity, color: 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/40' },
              { id: 'testpaper', label: 'Question Paper', icon: ClipboardList, color: 'bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 border border-indigo-500/40' },
              { id: 'principal-dashboard', label: 'Principal Report', icon: ShieldCheck, color: 'bg-sky-500/20 text-sky-300 hover:bg-sky-500/30 border border-sky-500/40' },
              { id: 'parentletters', label: 'Parent Notice', icon: Mail, color: 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40' },
              { id: 'widgets', label: 'PE Timers', icon: Zap, color: 'bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 border border-purple-500/40' }
            ].map((tool) => {
              const IconComp = tool.icon;
              return (
                <button
                  key={tool.id}
                  onClick={() => onNavigate?.(tool.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl sm:rounded-full text-[10.5px] font-black uppercase tracking-wider transition-all whitespace-nowrap active:scale-95 cursor-pointer shrink-0 ${tool.color}`}
                >
                  <IconComp size={13} className="shrink-0" />
                  <span>{tool.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Compact Split Hero Section - Fits Above The Fold */}
      <section className="relative grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center overflow-hidden rounded-[2rem] md:rounded-[3rem] bg-[#F5F7FA] border-4 border-slate-900 p-5 md:p-8 lg:p-9 shadow-[8px_8px_0px_0px_rgba(13,43,82,1)]">
        {/* Background Grid */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'linear-gradient(#0D2B52 1px, transparent 1px), linear-gradient(90deg, #0D2B52 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
        
        {/* Left Side: Copy and details conforming to Official Brand Identity */}
        <div className="lg:col-span-7 relative z-10 space-y-4 md:space-y-5 text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#D4A017]/15 border border-[#D4A017]/40 rounded-full">
            <span className="w-2 h-2 rounded-full bg-[#D4A017] animate-ping"></span>
            <span className="text-[9.5px] font-black uppercase text-[#0D2B52] tracking-widest">Digital PE Department • Built for Indian Schools</span>
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[3.25rem] xl:text-[3.5rem] font-black font-display tracking-tighter leading-[0.95] text-[#0D2B52] uppercase">
              The Digital <br className="hidden md:block"/>
              PE Department.<br/>
              <span className="text-[#D4A017]">School-Ready.</span>
            </h1>
            
            <p className="text-xs sm:text-sm text-[#333333] max-w-lg leading-relaxed font-medium">
              Plan PE lessons, track student fitness, assess practical performance, and maintain school-ready records &mdash; all in one place. Built specifically for physical education teachers, coordinators, and school principals in India.
            </p>
          </div>

          {/* Action Buttons with Brand Styling */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button 
              onClick={() => onNavigate?.('planner')}
              className="group w-full sm:w-auto px-6 py-3.5 bg-[#0D2B52] text-white rounded-full font-black text-xs uppercase tracking-wider transition-all hover:bg-[#164077] hover:-translate-y-0.5 active:translate-y-0 shadow-[3px_3px_0px_0px_rgba(13,43,82,1)] border-2 border-slate-900 text-center flex items-center justify-center space-x-2 cursor-pointer"
            >
              <span>Get Started for Free</span>
              <span className="font-sans font-black text-sm text-[#D4A017]">&rarr;</span>
            </button>
            
            <button 
              onClick={() => onNavigate?.('tools')}
              className="w-full sm:w-auto px-6 py-3.5 bg-white border-2 border-[#0D2B52]/30 text-[#0D2B52] rounded-full font-black text-xs uppercase tracking-wider hover:border-[#0D2B52] hover:bg-slate-50 transition-all text-center flex items-center justify-center cursor-pointer"
            >
              Explore Platform
            </button>
          </div>

          {/* Underneath columns representing three keys */}
          <div className="grid grid-cols-3 gap-3 pt-3.5 border-t border-slate-200">
            {[
              { num: '01', title: 'Plan PE Lessons', desc: 'Syllabus and plans in 60s' },
              { num: '02', title: 'Track Fitness', desc: 'Pre-loaded Khelo India' },
              { num: '03', title: 'School Reports', desc: 'Print-ready compliance' }
            ].map((col, idx) => (
              <div key={idx} className="space-y-0.5">
                <span className="text-[9px] font-black text-[#D4A017] block">{col.num}</span>
                <h4 className="font-black text-[#0D2B52] uppercase tracking-tight text-xs font-display">{col.title}</h4>
                <p className="text-[9.5px] text-slate-600 font-medium leading-tight">{col.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: High fidelity mock scene */}
        <div className="lg:col-span-5 relative h-[310px] sm:h-[340px] md:h-[370px] lg:h-[390px] w-full flex items-center justify-center">
          <div className="absolute inset-0 bg-[#0D2B52] rounded-[2rem] border-4 border-slate-900 shadow-[6px_6px_0px_0px_rgba(13,43,82,1)] overflow-hidden">
            {/* Simulation of a school field atmosphere */}
            <div className="absolute inset-0 bg-cover bg-center opacity-75" style={{ backgroundImage: 'linear-gradient(rgba(13,43,82,0.4), rgba(7,25,51,0.85)), url("https://images.unsplash.com/photo-1544698310-74ea9d1c8258?auto=format&fit=crop&q=80&w=1000")' }}></div>
            
            {/* Top-Left transparent pill: PLAN-TEACH-TRACK */}
            <div className="absolute top-4 left-4 py-1 px-2.5 bg-white/15 backdrop-blur-md rounded-full border border-white/20">
              <span className="text-[8.5px] font-black uppercase text-white tracking-widest flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#D4A017]"></span>
                Plan • Teach • Track
              </span>
            </div>

            {/* Float generated card at top-right */}
            <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-md rounded-xl p-3 shadow-xl border border-white max-w-[190px] z-20">
              <div className="flex items-start gap-2">
                <span className="w-7 h-7 rounded-lg bg-[#D4A017]/15 border border-[#D4A017]/30 flex items-center justify-center text-[#D4A017] font-black shrink-0">
                  <Sparkles size={14} />
                </span>
                <div className="space-y-0.5">
                  <h4 className="text-[10px] font-black uppercase text-slate-900 leading-none">Lesson generated</h4>
                  <p className="text-[8.5px] text-slate-500 font-semibold leading-tight">Grade 8 &bull; Athletics &bull; 47s</p>
                </div>
              </div>
              {/* Progress bar simulation */}
              <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
                <motion.div 
                  initial={{ width: "2%" }}
                  animate={{ width: ["10%", "95%", "95%"] }}
                  transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                  className="bg-[#D4A017] h-full rounded-full"
                ></motion.div>
              </div>
            </div>

            {/* Beautiful illustration layers */}
            <div className="absolute inset-x-4 bottom-4 flex justify-between items-end">
              <div className="bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest text-[#0D2B52] border border-white shadow-md">
                🇮🇳 Indian classroom
              </div>
              <div className="bg-[#0D2B52]/95 text-white px-3 py-1.5 rounded-lg text-[8.5px] font-black uppercase tracking-widest flex items-center gap-1.5 border border-slate-700 shadow-md">
                <span className="w-1.5 h-1.5 rounded-full bg-[#D4A017] animate-pulse"></span>
                <span>Live v4.0</span>
              </div>
            </div>
            
            {/* Big center action logo watermark */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
              <Logo showText={false} className="scale-[2.5] rotate-12" />
            </div>
          </div>
        </div>
      </section>

      {/* 🌟 SCHOOL-READY PITCH, WORKFLOW & PROOF CENTER */}
      <section className="bg-gradient-to-br from-[#F5F7FA] via-white to-slate-50 border-4 border-slate-900 rounded-[3.5rem] p-8 md:p-14 space-y-16 relative overflow-hidden shadow-[12px_12px_0px_0px_rgba(13,43,82,1)]">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#0D2B52]/5 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#D4A017]/10 rounded-full blur-[120px] pointer-events-none"></div>

        {/* Section Header */}
        <div className="text-center space-y-4 max-w-2xl mx-auto pb-6 border-b-4 border-slate-900">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-[#0D2B52]/10 border border-[#0D2B52]/20 rounded-full">
            <span className="w-2 h-2 rounded-full bg-[#D4A017]"></span>
            <span className="text-[10px] font-black uppercase text-[#0D2B52] tracking-widest">School Integration Suite</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-black text-[#0D2B52] tracking-tighter uppercase leading-[0.9] font-display">
            The School-Ready <br />
            <span className="text-[#D4A017] font-black">PE Operating Pitch.</span>
          </h2>
          <p className="text-xs md:text-sm text-[#333333] font-medium leading-relaxed">
            Discover why leading Indian schools are replacing chaotic registers with SmartPE. Here is exactly who it is built for, how the workflow operates, and what you get.
          </p>
        </div>

        {/* 1. Who Should Adopt It First (Stakeholder Engagement) */}
        <div className="space-y-8">
          <div className="text-center">
            <span className="text-[11px] font-black uppercase tracking-widest text-[#D4A017]">STAGE 1: ADOPTION</span>
            <h3 className="text-2xl font-black text-[#0D2B52] uppercase tracking-tight mt-1 font-display">1. Who Is SmartPE Built For?</h3>
            <p className="text-xs text-slate-600 font-semibold max-w-lg mx-auto">Click on your role below to see how SmartPE specifically transforms your daily school physical education responsibilities.</p>
          </div>

          <div className="grid grid-cols-3 max-w-xl mx-auto bg-slate-100 p-2 rounded-2xl border-2 border-slate-900 gap-1">
            {[
              { id: 'teacher', label: 'PE Teachers', icon: Dumbbell },
              { id: 'hod', label: 'Sports Directors', icon: Trophy },
              { id: 'principal', label: 'Principals', icon: ShieldCheck }
            ].map((role) => {
              const Icon = role.icon;
              const isSelected = pitchRoleTab === role.id;
              return (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => setPitchRoleTab(role.id as any)}
                  className={`flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all border-2 ${
                    isSelected
                      ? 'bg-[#0D2B52] text-white border-slate-900 shadow-[3px_3px_0px_0px_rgba(13,43,82,1)] font-black'
                      : 'bg-white text-slate-750 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <Icon size={14} className={isSelected ? 'text-[#D4A017]' : 'text-slate-500'} />
                  <span className="hidden sm:inline">{role.label}</span>
                </button>
              );
            })}
          </div>

          <div className="max-w-4xl mx-auto">
            {pitchRoleTab === 'teacher' && (
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-1 md:grid-cols-12 bg-white border-4 border-slate-900 rounded-[2.5rem] p-6 md:p-10 shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] items-center gap-8"
              >
                <div className="md:col-span-7 space-y-4">
                  <span className="px-3 py-1 bg-[#D4A017]/15 text-[#0D2B52] rounded-lg text-[9px] font-black uppercase tracking-wider">For On-Ground Teachers</span>
                  <h4 className="text-2xl font-black text-[#0D2B52] uppercase font-display">Save Your Evenings: Draft CBSE Plans Instantly</h4>
                  <p className="text-xs text-slate-600 font-medium leading-relaxed">
                    PE Teachers shouldn't spend hours writing repetitive physical education lesson diaries. SmartPE is your daily sidekick on the field.
                  </p>
                  <ul className="space-y-2.5 text-xs text-slate-700 font-semibold">
                    <li className="flex items-center gap-2">
                      <span className="text-emerald-500 font-bold">✓</span>
                      Generate CBSE-compliant lesson logs covering Strands 1-4 in under 60 seconds.
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-emerald-500 font-bold">✓</span>
                      Direct access to pre-loaded skill progression checklists and safety rules on your mobile.
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-emerald-500 font-bold">✓</span>
                      Instant offline logging of student fitness records directly on the playground.
                    </li>
                  </ul>
                  <button type="button" onClick={() => onNavigate?.('planner')} className="mt-2 text-xs font-black uppercase tracking-wider text-[#FF6B00] hover:underline flex items-center gap-1 bg-transparent border-0 cursor-pointer">
                    Try the AI Planner Now &rarr;
                  </button>
                </div>
                <div className="md:col-span-5 bg-orange-50/50 p-6 rounded-[2rem] border-2 border-orange-100 space-y-4">
                  <span className="text-[10px] font-black text-orange-600 uppercase tracking-widest block">Daily Value Metrics</span>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-3 rounded-xl border border-slate-100">
                      <p className="text-2xl font-black text-[#FF6B00]">5+ Hrs</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase">Weekly time saved</p>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-slate-100">
                      <p className="text-2xl font-black text-slate-900">0</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase">Paper registers needed</p>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-500 italic font-semibold">"I used to spend my Sundays writing CBSE lesson diaries. Now I generate them in seconds on my phone." — PE Teacher, Chennai</p>
                </div>
              </motion.div>
            )}

            {pitchRoleTab === 'hod' && (
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-1 md:grid-cols-12 bg-white border-4 border-slate-900 rounded-[2.5rem] p-6 md:p-10 shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] items-center gap-8"
              >
                <div className="md:col-span-7 space-y-4">
                  <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-lg text-[9px] font-black uppercase tracking-wider">For Sports Directors & HoDs</span>
                  <h4 className="text-2xl font-black text-slate-900 uppercase">Complete Department Command & Coordination</h4>
                  <p className="text-xs text-slate-600 font-medium leading-relaxed">
                    Manage your whole staff, physical resources, house tournament points, and class schedules from a single centralized master panel.
                  </p>
                  <ul className="space-y-2.5 text-xs text-slate-700 font-semibold">
                    <li className="flex items-center gap-2">
                      <span className="text-emerald-500 font-bold">✓</span>
                      Track real-time curriculum completion across all classes and teachers.
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-emerald-500 font-bold">✓</span>
                      Assign instant PE class substitution diaries to avoid empty fields.
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-emerald-500 font-bold">✓</span>
                      Keep accurate track of sports equipment stock level and wear-and-tear history.
                    </li>
                  </ul>
                  <button type="button" onClick={() => onNavigate?.('department-office')} className="mt-2 text-xs font-black uppercase tracking-wider text-indigo-600 hover:underline flex items-center gap-1 bg-transparent border-0 cursor-pointer">
                    Open Department Office &rarr;
                  </button>
                </div>
                <div className="md:col-span-5 bg-indigo-50/50 p-6 rounded-[2rem] border-2 border-indigo-100 space-y-4">
                  <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest block">Operational Metrics</span>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-3 rounded-xl border border-slate-100">
                      <p className="text-2xl font-black text-indigo-600">100%</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase">Staff alignment</p>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-slate-100">
                      <p className="text-2xl font-black text-slate-900">Live</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase">Equipment audit</p>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-500 italic font-semibold">"SmartPE gives me perfect visibility. I know exactly which grade is doing which CBSE strand today." — HoD PE, Mumbai</p>
                </div>
              </motion.div>
            )}

            {pitchRoleTab === 'principal' && (
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-1 md:grid-cols-12 bg-white border-4 border-slate-900 rounded-[2.5rem] p-6 md:p-10 shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] items-center gap-8"
              >
                <div className="md:col-span-7 space-y-4">
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-[9px] font-black uppercase tracking-wider">For Principals & Trust Boards</span>
                  <h4 className="text-2xl font-black text-slate-900 uppercase">Audit-Ready Compliance & Parent Brand Trust</h4>
                  <p className="text-xs text-slate-600 font-medium leading-relaxed">
                    Satisfy school inspectors and board audits (CBSE, ICSE, state boards) instantly. Present continuous physical assessment portfolios and build parents' brand trust.
                  </p>
                  <ul className="space-y-2.5 text-xs text-slate-700 font-semibold">
                    <li className="flex items-center gap-2">
                      <span className="text-emerald-500 font-bold">✓</span>
                      1-click generation of CBSE-compliant Health Cards and BMI sheets.
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-emerald-500 font-bold">✓</span>
                      Print-ready, professional inspection folders with evidence-backed curriculum compliance.
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-emerald-500 font-bold">✓</span>
                      Automated professional parent letters for sports day and health alerts.
                    </li>
                  </ul>
                  <button type="button" onClick={() => onNavigate?.('principal-dashboard')} className="mt-2 text-xs font-black uppercase tracking-wider text-emerald-600 hover:underline flex items-center gap-1 bg-transparent border-0 cursor-pointer">
                    View Principal Oversight Dashboard &rarr;
                  </button>
                </div>
                <div className="md:col-span-5 bg-emerald-50/50 p-6 rounded-[2rem] border-2 border-emerald-100 space-y-4">
                  <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest block">Governance Ratings</span>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-3 rounded-xl border border-slate-100">
                      <p className="text-2xl font-black text-emerald-600">Zero</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase">Audit failures</p>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-slate-100">
                      <p className="text-2xl font-black text-slate-900">Custom</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase">Parent reports</p>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-500 italic font-semibold">"For inspections, having physical education records digitized and cataloged in SmartPE is a complete relief." — Principal, Dehradun</p>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* 2. The Main Ground-to-Office PE Workflow */}
        <div className="space-y-10 pt-8 border-t border-slate-200">
          <div className="text-center">
            <span className="text-[11px] font-black uppercase tracking-widest text-[#005BFF]">STAGE 2: WORKFLOW</span>
            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight mt-1">2. How the Ground-to-Office Workflow Works</h3>
            <p className="text-xs text-slate-500 font-semibold max-w-lg mx-auto">See how physical education transitions seamlessly from planning to active ground tracking to final administrative reporting.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-250 hidden md:block -translate-y-1/2 z-0"></div>
            {[
              {
                step: "Phase 01",
                title: "Prep in the Staffroom",
                desc: "Set up class lists, drag-and-drop your yearly curriculum weeks, select CBSE standard strands, and draft deep-drill daily lessons in seconds using the AI Planner.",
                icon: BookOpen,
                color: "border-orange-500 text-orange-500 bg-orange-50"
              },
              {
                step: "Phase 02",
                title: "Measure on the Field",
                desc: "Step out with your phone. Execute the drills, record fitness tests on-the-ground without paper sheets, and use interactive timers or video analysis labs.",
                icon: Dumbbell,
                color: "border-indigo-500 text-indigo-500 bg-indigo-50"
              },
              {
                step: "Phase 03",
                title: "Consolidate & Report",
                desc: "One click aggregates all scores. View automated student health progress cards, print board compliance files for inspectors, and email notifications to parents.",
                icon: FileText,
                color: "border-emerald-500 text-emerald-500 bg-emerald-50"
              }
            ].map((workflow, idx) => {
              const Icon = workflow.icon;
              return (
                <div key={idx} className="relative z-10 bg-white border-4 border-slate-900 rounded-[2.2rem] p-6 space-y-4 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
                  <div className="flex justify-between items-center">
                    <span className="px-3 py-1 bg-slate-900 text-white rounded-lg text-[9px] font-black uppercase tracking-wider">{workflow.step}</span>
                    <span className={`w-10 h-10 rounded-full border-2 flex items-center justify-center font-black ${workflow.color}`}>
                      <Icon size={18} />
                    </span>
                  </div>
                  <h4 className="text-base font-black uppercase text-slate-900">{workflow.title}</h4>
                  <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">{workflow.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. The Actual Results (High Fidelity Sample Outputs Showcase) */}
        <div className="space-y-8 pt-8 border-t border-slate-200">
          <div className="text-center">
            <span className="text-[11px] font-black uppercase tracking-widest text-[#10B981]">STAGE 3: RESULTS & DELIVERABLES</span>
            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight mt-1">3. See the Real Results: Sample Outputs</h3>
            <p className="text-xs text-slate-500 font-semibold max-w-lg mx-auto">Don't take our word for it. Review the actual, board-compliant physical documents and cards generated by the platform instantly.</p>
          </div>

          <div className="bg-slate-950 border-4 border-slate-900 rounded-[2.5rem] p-4 sm:p-8 md:p-10 text-white space-y-8 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)]">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between border-b border-slate-800 pb-6 gap-4">
              <div>
                <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">OUTPUT TEMPLATE EXPLORER</span>
                <h4 className="text-xl font-black uppercase tracking-tight">Interactive High-Fidelity Previews</h4>
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'lesson', label: '📄 CBSE Lesson Plan' },
                  { id: 'rubric', label: '📋 CBSE Skill Rubric' },
                  { id: 'report', label: '📊 Student Health Card' },
                  { id: 'inspection', label: '📂 Board Inspection Folder' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setSampleOutputTab(tab.id as any)}
                    className={`px-3.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border-2 ${
                      sampleOutputTab === tab.id
                        ? 'bg-[#FF6B00] text-white border-slate-900 shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] font-black'
                        : 'bg-slate-900 text-slate-400 border-transparent hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Simulated High Fidelity Document Container */}
            <div className="bg-white text-slate-900 rounded-[2rem] p-4 sm:p-6 md:p-8 min-h-[350px] border-4 border-slate-900 relative overflow-hidden flex flex-col justify-between">
              {/* Decorative Stamp */}
              <div className="absolute top-10 right-10 border-4 border-emerald-500/30 text-emerald-500/30 font-black text-[10px] md:text-xs uppercase tracking-widest px-3 py-1.5 rounded-xl rotate-12 pointer-events-none select-none">
                CBSE-Aligned
              </div>

              {sampleOutputTab === 'lesson' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b-2 border-slate-200 pb-4 gap-2">
                    <div>
                      <span className="text-[9px] font-black uppercase text-[#FF6B00] tracking-wider">SMARTPE DIGITAL DAILY DIARY</span>
                      <h5 className="text-lg md:text-xl font-black uppercase tracking-tight text-slate-900">DAILY PE LESSON PLAN & LOG</h5>
                    </div>
                    <div className="text-left sm:text-right text-[10px] font-mono text-slate-500 font-semibold space-y-0.5">
                      <p>DOC ID: SMP-LP-8427</p>
                      <p>BOARD: CBSE HPE STRAND 1</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs font-bold text-slate-850">
                    <div>
                      <p className="text-[9px] text-slate-400 uppercase">Grade</p>
                      <p className="text-slate-900 font-black">Grade 7-B</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-slate-400 uppercase">Focus Sport</p>
                      <p className="text-slate-900 font-black">Football (Soccer)</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-slate-400 uppercase">Duration</p>
                      <p className="text-slate-900 font-black">40 Minutes</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-slate-400 uppercase">Equipment</p>
                      <p className="text-slate-900 font-black">15 Footballs, 20 Cones</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <p className="text-xs text-slate-750 font-semibold">
                      <strong className="text-slate-900">Core Objectives:</strong> Instantly master ball control using inside/outside foot margins. Execute slalom dribble paths and maintain balanced postural recovery under light pressure.
                    </p>
                    <div className="overflow-x-auto pt-2">
                      <table className="w-full text-left text-[11px] border-collapse font-bold">
                        <thead>
                          <tr className="text-slate-400 uppercase border-b border-slate-200 text-[10px]">
                            <th className="pb-2 w-1/4">Phase & Timing</th>
                            <th className="pb-2 w-1/2">Specific Activities & Drills</th>
                            <th className="pb-2 w-1/4">Coaching & Safety Points</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                          <tr>
                            <td className="py-3 text-orange-600 font-black">01. WARM-UP (10 Mins)</td>
                            <td className="py-3 font-medium">Continuous slow jog across boundaries. Core-joint rotations. Dynamic ball-taps (30 reps/student).</td>
                            <td className="py-3 text-slate-500 font-medium">Maintain safe space between runners; soft ankles during taps.</td>
                          </tr>
                          <tr>
                            <td className="py-3 text-indigo-600 font-black">02. MAIN DRILLS (20 Mins)</td>
                            <td className="py-3 font-medium">Slalom slalom: Dribble through 8 aligned cones spaced 1.5m apart. Return passing. 3 sets each.</td>
                            <td className="py-3 text-slate-500 font-medium">Keep eyes up. Touch ball on every step. Keep ball close to body.</td>
                          </tr>
                          <tr>
                            <td className="py-3 text-emerald-600 font-black">03. COOL-DOWN (10 Mins)</td>
                            <td className="py-3 font-medium">Mild stretching of calves and lower back. Class reflection, score checking, and equipment tally.</td>
                            <td className="py-3 text-slate-500 font-medium">Breathing cycles (Pranayama alignment); inventory counts.</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {sampleOutputTab === 'rubric' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b-2 border-slate-200 pb-4 gap-2">
                    <div>
                      <span className="text-[9px] font-black uppercase text-indigo-600 tracking-wider">OFFICIAL ASSESSMENT RUBRIC MATRIX</span>
                      <h5 className="text-lg md:text-xl font-black uppercase tracking-tight text-slate-900">CBSE BOARD PRACTICAL GRADING MATRIX</h5>
                    </div>
                    <div className="text-left sm:text-right text-[10px] font-mono text-slate-500 font-semibold space-y-0.5">
                      <p>RUB ID: SMP-RB-9941</p>
                      <p>ALIGNED: NEW NEP 2020 CRITERIA</p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-650 font-semibold leading-relaxed">
                    Designed to be printed or pasted on physical registers. Grading standard for <strong className="text-slate-900">High School Practical Sports Examinations</strong>.
                  </p>

                  <div className="overflow-x-auto font-bold">
                    <table className="w-full text-left text-[11px] border-collapse">
                      <thead>
                        <tr className="text-slate-400 uppercase border-b border-slate-200 text-[10px]">
                          <th className="pb-2 w-1/4">Skill Assessed</th>
                          <th className="pb-2 text-emerald-600 w-1/4">Excellent (4-5 Marks)</th>
                          <th className="pb-2 text-indigo-600 w-1/4">Proficient (2-3 Marks)</th>
                          <th className="pb-2 text-rose-600 w-1/4">Beginner (0-1 Marks)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        <tr>
                          <td className="py-3 font-black text-slate-900">Ball Handling</td>
                          <td className="py-3 font-medium">Fluid dribbling under speed, head held high, precise foot margin controls.</td>
                          <td className="py-3 font-medium">Inconsistent pace control, watches ball constantly on the run.</td>
                          <td className="py-3 font-medium">Loses ball frequently; cannot coordinate basic zig-zag dribbles.</td>
                        </tr>
                        <tr>
                          <td className="py-3 font-black text-slate-900">Form & Stance</td>
                          <td className="py-3 font-medium">Perfect knee flexion, athletic low center of gravity, rapid body direction shifts.</td>
                          <td className="py-3 font-medium">Maintains upright posture, slowing lateral deceleration.</td>
                          <td className="py-3 font-medium">Rigid, slouching posture; high risk of trip or minor joint strain.</td>
                        </tr>
                        <tr>
                          <td className="py-3 font-black text-slate-900">Match Ethics</td>
                          <td className="py-3 font-medium">Active vocal support, exemplary fair play, instant alignment with referee rules.</td>
                          <td className="py-3 font-medium">Cooperates with teammates but displays minor focus loss or complaints.</td>
                          <td className="py-3 font-medium">Ignores referee gestures; lacks team collaboration or active defense.</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {sampleOutputTab === 'report' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b-2 border-slate-200 pb-4 gap-2">
                    <div>
                      <span className="text-[9px] font-black uppercase text-emerald-600 tracking-wider">BOARD COMPLIANT STUDENT PROFILE</span>
                      <h5 className="text-lg md:text-xl font-black uppercase tracking-tight text-slate-900">STUDENT FITNESS CARD & HEALTH CARD</h5>
                    </div>
                    <div className="text-left sm:text-right text-[10px] font-mono text-slate-500 font-semibold space-y-0.5">
                      <p>CARD ID: SMP-REP-003</p>
                      <p>PROTOCOL: KHELO INDIA KIFT STANDARDS</p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-250/60">
                    <div className="w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center font-black text-sm uppercase shadow-md">
                      KD
                    </div>
                    <div className="text-xs text-slate-700 font-bold space-y-0.5">
                      <h6 className="text-sm font-black text-slate-900 uppercase">KABIR DUTT (Roll No. 12)</h6>
                      <p>Grade 8-A &bull; Age: 13 Yrs &bull; Weight: 46 kg &bull; Height: 154 cm</p>
                      <p className="text-[10px] text-[#FF6B00]">Last Synced: March 2026 via SmartPE Cloud</p>
                    </div>
                  </div>

                  {/* Fitness parameters with progress bars */}
                  <div className="space-y-3.5">
                    {[
                      { name: "Sit & Reach (Flexibility)", current: "19.2 cm", max: "25 cm", percent: "76%", rating: "Excellent", color: "bg-emerald-500" },
                      { name: "50m Dash (Speed & Acceleration)", current: "8.5s", max: "12s", percent: "70%", rating: "Proficient", color: "bg-indigo-500" },
                      { name: "600m Run/Walk (Cardiovascular)", current: "148s", max: "210s", percent: "82%", rating: "Excellent", color: "bg-emerald-500" },
                    ].map((param, i) => (
                      <div key={i} className="space-y-1.5 text-xs font-bold">
                        <div className="flex justify-between text-slate-800">
                          <span>{param.name}: <strong className="text-slate-900">{param.current}</strong></span>
                          <span className="text-[10px] uppercase tracking-wider text-slate-500">{param.rating}</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
                          <div className={`${param.color} h-full rounded-full`} style={{ width: param.percent }}></div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-[10px] font-black text-[#FF6B00] uppercase tracking-wider font-bold">
                    <span>Overall Health Standing: Healthy BMI ✓</span>
                    <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg">Inspected & Verified</span>
                  </div>
                </div>
              )}

              {sampleOutputTab === 'inspection' && (
                <div className="space-y-6 animate-in fade-in duration-300 font-bold">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b-2 border-slate-200 pb-4 gap-2">
                    <div>
                      <span className="text-[9px] font-black uppercase text-indigo-600 tracking-wider">GOVERNANCE & AUDIT REPORT</span>
                      <h5 className="text-lg md:text-xl font-black uppercase tracking-tight text-slate-900">BOARD COMPLIANCE & INSPECTION CHECKSHEET</h5>
                    </div>
                    <div className="text-left sm:text-right text-[10px] font-mono text-slate-500 font-semibold space-y-0.5">
                      <p>AUD ID: SMP-AUD-2026</p>
                      <p>AUDITOR: OFFICIAL SCHOOL BOARD STANDARDS</p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-650 font-semibold leading-relaxed">
                    Instantly export this folder for inspectors to prove continuous assessment compliance under <strong className="text-slate-900">NEP 2020 Guidelines</strong>.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                      <span className="text-[9px] font-black uppercase text-indigo-600">Syllabus Strands</span>
                      <p className="text-2xl font-black text-slate-900">4 / 4</p>
                      <p className="text-[10px] font-semibold text-slate-500 leading-tight">Fully aligned across Games, Health, SEWA & Health Cards.</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                      <span className="text-[9px] font-black uppercase text-emerald-600">Continuous Assessment</span>
                      <p className="text-2xl font-black text-slate-900">100%</p>
                      <p className="text-[10px] font-semibold text-slate-500 leading-tight">Every student profile contains recorded baseline, midline and final marks.</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                      <span className="text-[9px] font-black uppercase text-amber-600">Audit Evidence</span>
                      <p className="text-2xl font-black text-slate-900">Present</p>
                      <p className="text-[10px] font-semibold text-slate-500 leading-tight">All digital diaries signed, timestamps locked, and secure.</p>
                    </div>
                  </div>

                  <div className="bg-emerald-50/50 p-3.5 rounded-xl border border-emerald-100 flex items-center gap-3">
                    <span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center font-black text-xs">✓</span>
                    <p className="text-[10px] font-bold text-slate-700">Your school PE department is currently ranked as <strong className="text-emerald-700">"Excellent" (Grade A)</strong> in terms of compliance records.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 🛑 THE PROBLEM & THE SOLUTION */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 bg-slate-900 border-4 border-slate-900 rounded-[3.5rem] p-8 md:p-14 relative overflow-hidden text-white shadow-[12px_12px_0px_0px_rgba(255,107,0,1)]">
        <div className="lg:col-span-5 space-y-6">
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#FF6B00]">THE PROBLEM</p>
          <h3 className="text-3xl md:text-5xl font-black uppercase tracking-tight leading-[1.0] text-white">
            PE Departments are drowning in <span className="text-slate-400">manual paperwork.</span>
          </h3>
          <p className="text-sm text-slate-300 font-medium leading-relaxed">
            PE teachers spend hours drafting lesson logs, recording fitness scores in separate spreadsheets, managing equipment inventories, and manually compiling CBSE records. It takes precious time and energy away from teaching students on the field.
          </p>
          <div className="space-y-3 pt-4 border-t border-slate-800">
            {[
              "Hours wasted writing out repetitive lesson diaries",
              "Manual and chaotic fitness score logging on paper",
              "No centralized progress reports for parents and principals"
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-2.5 text-xs text-slate-300 font-bold">
                <span className="text-[#FF6B00]">✕</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-7 bg-[#FFFDF9] border-4 border-slate-900 rounded-[2.5rem] p-6 md:p-10 text-slate-900 flex flex-col justify-between space-y-8 shadow-[4px_4px_0px_0px_rgba(255,107,0,1)]">
          <div className="space-y-4">
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-600">THE SOLUTION (SMARTPE INDIA)</p>
            <h3 className="text-2xl md:text-4xl font-black uppercase tracking-tight leading-[1.0] text-slate-900">
              The Digital PE Department for Indian Schools.
            </h3>
            <p className="text-xs md:text-sm text-slate-600 font-medium leading-relaxed">
              SmartPE India organizes your entire PE department in one platform. From CBSE curriculum mapping to field-ready scoring, fitness tracking, parent letters, and real-time coordinator dashboards.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { title: "Syllabus Maps in 60s", desc: "Instantly align your lesson diaries with CBSE and NEP strands." },
              { title: "Digital Fitness Tracking", desc: "Log scores on the ground without paper sheets." },
              { title: "Principal & Inspector Audit Logs", desc: "Get print-ready compliance reports for school leaders." },
              { title: "Automated Parent Notices", desc: "Generate professional letters for health events automatically." }
            ].map((item, i) => (
              <div key={i} className="bg-slate-50 border-2 border-slate-900 rounded-xl p-4 space-y-1">
                <h4 className="text-xs font-black uppercase text-slate-900 flex items-center gap-1.5">
                  <span className="text-emerald-500">✓</span>
                  {item.title}
                </h4>
                <p className="text-[10px] text-slate-500 font-semibold">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 🚀 HOW IT WORKS */}
      <section className="space-y-12 bg-white border-4 border-slate-900 rounded-[3.5rem] p-8 md:p-14 relative overflow-hidden shadow-[12px_12px_0px_0px_rgba(15,23,42,1)]">
        <div className="absolute inset-0 opacity-[0.01] pointer-events-none" style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
        
        <div className="text-center space-y-3 max-w-xl mx-auto border-b-4 border-slate-900 pb-8">
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#005BFF]">01.1 HOW IT WORKS</p>
          <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter uppercase leading-[0.9]">Smarter PE for <br/><span className="text-[#005BFF]">Your School.</span></h2>
          <p className="text-xs md:text-sm text-slate-600 font-semibold leading-relaxed">
            Three simple phases to transition your PE department from chaotic spreadsheets to organized progress.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
          {[
            { 
              step: "01", 
              title: "Set Up Your Board", 
              desc: "Select your school board (CBSE/ICSE) and class ranges. Draft lesson calendars or map your academic physical education milestones in seconds.",
              pill: "Phase 1: SETUP" 
            },
            { 
              step: "02", 
              title: "Conduct Field Activities", 
              desc: "Record Khelo India fitness tests directly, access class-wise lesson plans on your mobile, and coordinate department items on the ground.",
              pill: "Phase 2: RUN" 
            },
            { 
              step: "03", 
              title: "Print-Ready Reporting", 
              desc: "Generate professional parent report cards, send notice letters, and provide school leadership with instant, compliant progress reports.",
              pill: "Phase 3: CONSOLIDATE" 
            }
          ].map((phase, idx) => (
            <div key={idx} className="bg-slate-50 border-4 border-slate-900 rounded-[2.5rem] p-8 space-y-6 flex flex-col justify-between shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-5xl font-black text-indigo-600">{phase.step}</span>
                  <span className="px-2.5 py-1 bg-slate-900 text-white rounded-lg text-[8px] font-black uppercase tracking-wider">{phase.pill}</span>
                </div>
                <h4 className="text-lg font-black uppercase text-slate-900">{phase.title}</h4>
                <p className="text-xs text-slate-500 font-semibold leading-relaxed">{phase.desc}</p>
              </div>
              <div className="pt-4 border-t border-slate-200 flex items-center gap-1.5 text-[9px] font-black text-indigo-600 uppercase tracking-widest">
                <span>Seamless Workflow</span>
                <span>&bull;</span>
                <span>Zero administrative stress</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Onboarding / Start Here Strip */}
      <section className="bg-slate-900 text-white rounded-[2rem] md:rounded-[3rem] p-8 md:p-12 shadow-2xl relative overflow-hidden border-4 border-slate-900">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-[120px] -mr-48 -mt-48"></div>
        <div className="relative z-10 space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 xl:gap-12">
            <div className="space-y-3 lg:max-w-sm xl:max-w-lg">
              <div className="inline-flex items-center px-4 py-1.5 bg-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest">Interactive Onboarding</div>
              <h3 className="text-3xl md:text-4xl font-black uppercase tracking-tight leading-[1.1]">
                New here? Your first <br/>
                <span className="text-[#FF6B00]">lesson plan</span> in 60 seconds.
              </h3>
              <p className="text-slate-400 text-sm max-w-lg font-medium leading-relaxed">
                Select your topic, generate a draft plan, refine the drills, and start your class with structured preparation.
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 flex-1 w-full">
              {[
                { step: '01', title: 'Pick Topic', desc: 'Select any sport or curriculum target.', tab: 'planner' },
                { step: '02', title: 'Draft Plan', desc: 'Create a custom lesson outline in seconds.', tab: 'planner' },
                { step: '03', title: 'Customize', desc: 'Tailor the activities to your school standards.', tab: 'planner' },
                { step: '04', title: 'Start Class', desc: 'Deliver your lesson on the ground.', tab: 'planner' }
              ].map((item, i) => (
                <button 
                  key={i}
                  onClick={() => onNavigate?.(item.tab)}
                  className="flex flex-col justify-between p-5 lg:p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-[#FF6B00] hover:bg-white/10 transition-all text-left group"
                >
                  <div className="text-3xl lg:text-4xl font-black text-[#005BFF] mb-4 group-hover:text-[#FF6B00] transition-colors">{item.step}</div>
                  <div>
                    <h4 className="text-xs lg:text-sm font-black uppercase tracking-wider text-white mb-2">{item.title}</h4>
                    <p className="text-[11px] lg:text-xs text-slate-400 leading-relaxed font-medium">{item.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Today / Summary Block */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
        <div className="bg-white border-4 border-slate-900 rounded-[2rem] md:rounded-[2.5rem] p-5 md:p-8 flex items-center gap-4 md:gap-6 shadow-[8px_8px_0px_0px_rgba(15,23,42,0.05)]">
          <div className="w-12 h-12 md:w-16 md:h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-900 flex-shrink-0">
            <Calendar className="w-6 h-6 md:w-8 md:h-8" />
          </div>
          <div>
            <p className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Active Plans</p>
            <p className="text-xl md:text-2xl font-black text-slate-900 leading-tight">{history.filter(h => h.type === 'Lesson Plan').length} Planned Today</p>
          </div>
        </div>
        <div className="bg-white border-4 border-slate-900 rounded-[2rem] md:rounded-[2.5rem] p-5 md:p-8 flex items-center gap-4 md:gap-6 shadow-[8px_8px_0px_0px_rgba(15,23,42,0.05)]">
          <div className="w-12 h-12 md:w-16 md:h-16 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 flex-shrink-0">
            <Activity className="w-6 h-6 md:w-8 md:h-8" />
          </div>
          <div>
            <p className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Assessments</p>
            <p className="text-xl md:text-2xl font-black text-slate-900 leading-tight">12 Pending Tasks</p>
          </div>
        </div>
        <div className="bg-indigo-600 border-4 border-slate-900 rounded-[2rem] md:rounded-[2.5rem] p-5 md:p-8 flex items-center gap-4 md:gap-6 shadow-[8px_8px_0px_0px_rgba(79,70,229,0.1)]">
          <div className="w-12 h-12 md:w-16 md:h-16 bg-white/20 rounded-2xl flex items-center justify-center text-white flex-shrink-0">
            <Zap className="w-6 h-6 md:w-8 md:h-8" />
          </div>
          <div className="text-white">
            <p className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-indigo-200 mb-1">Quick Action</p>
            <p className="text-sm md:text-base font-black uppercase leading-tight">Record scores for 7B</p>
          </div>
        </div>
      </section>

      {/* Weekly PE Timetable & Calendar */}
      <section className="relative">
        <WeeklyCalendarView />
      </section>

      {/* Module Groups */}
      <div className="space-y-32">
        {/* TEACH Group */}
        <section className="space-y-12">
          <div className="flex items-end justify-between border-b-4 border-slate-900 pb-8">
            <div className="space-y-4">
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-600">01. PLAN & TEACH</p>
              <h2 className="text-4xl md:text-7xl font-black text-slate-900 tracking-tighter uppercase leading-[0.85]">Lesson Planning <br/> & <span className="text-[#005BFF]">Daily Tools.</span></h2>
              <p className="text-sm text-slate-500 font-extrabold uppercase tracking-widest mt-2 block">Smarter preparation, on and off the field.</p>
            </div>
            <p className="hidden md:block text-slate-500 max-w-xs text-right font-black text-[10px] uppercase tracking-widest leading-relaxed">
              "Generate lesson plans, access field timers, and manage structured class progressions in seconds."
            </p>
          </div>

          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-50px" }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
          >
            {/* PE Lesson Plan */}
            <motion.div 
              variants={cardVariants}
              whileHover={{ scale: 1.02, y: -5 }}
              onClick={() => onNavigate?.('planner')}
              className="lg:col-span-2 group bg-slate-900 text-white rounded-[3rem] p-10 hover:shadow-[12px_12px_0px_0px_rgba(79,70,229,0.3)] transition-all cursor-pointer relative overflow-hidden animate-pulse-subtle"
            >
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                <Sparkles size={120} />
              </div>
              <div className="relative z-10 h-full flex flex-col justify-between space-y-12">
                <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-xl">
                  <Sparkles size={32} />
                </div>
                <div className="space-y-4">
                  <h3 className="text-3xl font-black uppercase tracking-tight">Lesson Plan Builder</h3>
                  <p className="text-slate-400 font-medium">Create detailed physical education lesson plans in under 60 seconds. Aligned with Indian school curriculum structures.</p>
                </div>
                <div className="flex items-center space-x-3 text-indigo-400 font-black text-[10px] uppercase tracking-[0.2em]">
                  <span>Create Lesson Plan</span>
                  <ArrowRight size={18} />
                </div>
              </div>
            </motion.div>

            {/* Widgets */}
            <motion.div 
              variants={cardVariants}
              whileHover={{ scale: 1.02, y: -5 }}
              onClick={() => onNavigate?.('widgets')}
              className="group bg-purple-50 border-4 border-slate-900 rounded-[3rem] p-8 hover:shadow-[12px_12px_0px_0px_rgba(168,85,247,0.2)] transition-all cursor-pointer flex flex-col justify-between"
            >
              <div className="w-16 h-16 bg-purple-500 text-white rounded-2xl flex items-center justify-center shadow-lg">
                <Zap size={32} />
              </div>
              <div className="space-y-4">
                <h3 className="text-2xl font-black uppercase tracking-tight">Field-Ready Tools</h3>
                <p className="text-slate-500 text-sm font-medium">Keep students engaged with interactive ground timers, digital scoreboards, and student group makers.</p>
                <ArrowRight className="text-slate-300 group-hover:text-purple-600 transition-colors" size={24} />
              </div>
            </motion.div>

            {/* Skill Mastery */}
            <motion.div 
              variants={cardVariants}
              whileHover={{ scale: 1.02, y: -5 }}
              onClick={() => onNavigate?.('skillmastery')}
              className="group bg-emerald-50 border-4 border-slate-900 rounded-[3rem] p-8 hover:shadow-[12px_12px_0px_0px_rgba(16,185,129,0.2)] transition-all cursor-pointer flex flex-col justify-between"
            >
              <div className="w-16 h-16 bg-emerald-500 text-white rounded-2xl flex items-center justify-center shadow-lg">
                <Target size={32} />
              </div>
              <div className="space-y-4">
                <h3 className="text-2xl font-black uppercase tracking-tight">Skill Progress Tracker</h3>
                <p className="text-slate-500 text-sm font-medium">Track athletic milestones, safety checklists, and progressive sports training metrics with ease.</p>
                <ArrowRight className="text-slate-300 group-hover:text-emerald-600 transition-colors" size={24} />
              </div>
            </motion.div>
          </motion.div>
        </section>

        {/* 📚 CBSE/NEP CURRICULUM OVERVIEW & ACADEMIC YEAR MAP */}
        <section className="space-y-12 bg-[#FFFDF9] border-4 border-slate-900 rounded-[3.5rem] p-8 md:p-14 relative overflow-hidden shadow-[12px_12px_0px_0px_rgba(15,23,42,1)]">
          <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
          
          <div className="flex flex-col md:flex-row md:items-end justify-between border-b-4 border-slate-900 pb-8 relative z-10">
            <div className="space-y-4">
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-600">01.5 CURRICULUM OVERVIEW</p>
              <h2 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tighter uppercase leading-[0.9]">Board Curriculum <br/> & <span className="text-indigo-600">Strand Mapping.</span></h2>
              <p className="text-sm text-slate-600 font-semibold leading-relaxed max-w-xl">
                Track curriculum milestones across Term 1 and Term 2. Completed logs automatically sync with your generated lesson plan history, verifying alignment with CBSE HPE Strands 1 to 4.
              </p>
            </div>
            
            <div className="mt-4 md:mt-0 flex flex-wrap gap-3">
              <button
                onClick={handleSimulateSyllabus}
                className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-2 border-dashed border-indigo-300 rounded-xl text-xs font-black uppercase tracking-wider transition-all"
                title="Inject realistic completed lesson plans to demonstrate full strand tracking instantly"
              >
                ⚡ Populate Demo Syllabus
              </button>
              
              <span className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 rounded-full text-xs font-black uppercase tracking-widest inline-flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                CBSE/NEP Compliant
              </span>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 relative z-10">
            {cbseNepStrands.map((strand) => {
              // Count plans matching this strand in history
              const plans = history.filter(item => item.type === 'Lesson Plan');
              const matchedCount = plans.filter(p => {
                const titleLower = p.title.toLowerCase();
                const contentStr = typeof p.content === 'string' ? p.content.toLowerCase() : JSON.stringify(p.content || '').toLowerCase();
                
                if (strand.id === 'S1') {
                  return ['sprint', 'run', 'athletics', 'jump', 'throw', 'speed', 'start', 'football', 'basketball', 'dribble', 'pass', 'layup', 'soccer', 'play', 'tactics', 'formation'].some(k => titleLower.includes(k) || contentStr.includes(k));
                }
                if (strand.id === 'S2') {
                  return ['nutrition', 'diet', 'food', 'yoga', 'asana', 'surya', 'stretch', 'posture', 'flexibility', 'slouch', 'breathing'].some(k => titleLower.includes(k) || contentStr.includes(k));
                }
                if (strand.id === 'S3') {
                  return ['sewa', 'referee', 'rules', 'tournament', 'leadership', 'volunteer', 'community'].some(k => titleLower.includes(k) || contentStr.includes(k));
                }
                if (strand.id === 'S4') {
                  return ['health card', 'profile', 'bmi', 'audit', 'report', 'card', 'scoring', 'record'].some(k => titleLower.includes(k) || contentStr.includes(k));
                }
                return false;
              }).length;

              return (
                <div key={strand.id} className="bg-white border-4 border-slate-900 rounded-2xl p-5 space-y-2 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">{strand.id}</span>
                    <span className="text-xs font-black text-slate-900">{matchedCount} Active Plans</span>
                  </div>
                  <h4 className="text-sm font-black uppercase text-slate-800 leading-tight">{strand.name.split(':')[1] || strand.name}</h4>
                  <p className="text-[10px] text-slate-400 font-semibold leading-relaxed">{strand.desc}</p>
                </div>
              );
            })}
          </div>

          {/* Academic Term Mapping & Unit Progress Bars */}
          <div className="space-y-6 relative z-10 pt-4 border-t-2 border-dashed border-slate-200">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-slate-400">Filter Overview:</span>
                <div className="flex gap-1.5">
                  {(['all', '1', '2'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setSelectedCurriculumTerm(t)}
                      className={`px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg border-2 border-slate-900 transition-all ${
                        selectedCurriculumTerm === t 
                          ? 'bg-slate-900 text-white' 
                          : 'bg-white text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {t === 'all' ? 'Full Year' : `Term ${t}`}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-slate-400">Class:</span>
                <select
                  value={selectedCurriculumClass}
                  onChange={(e) => setSelectedCurriculumClass(e.target.value)}
                  className="bg-white border-2 border-slate-900 text-xs font-black uppercase tracking-wider px-3 py-1 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {['Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'].map((gradeOpt) => (
                    <option key={gradeOpt} value={gradeOpt}>{gradeOpt}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Render filtered units */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {curriculumUnits
                .filter(unit => selectedCurriculumTerm === 'all' || unit.term.toString() === selectedCurriculumTerm)
                .map((unit) => {
                  // Get progress details dynamically
                  const lessonPlans = history.filter(item => item.type === 'Lesson Plan');
                  const matchedPlans = lessonPlans.filter(plan => {
                    const titleLower = plan.title.toLowerCase();
                    const contentStr = typeof plan.content === 'string' ? plan.content.toLowerCase() : JSON.stringify(plan.content || '').toLowerCase();
                    return unit.keywords.some(kw => titleLower.includes(kw) || contentStr.includes(kw));
                  });
                  const count = matchedPlans.length;
                  const percentage = Math.min(100, Math.round((count / unit.targetLessons) * 100));

                  return (
                    <div 
                      key={unit.id} 
                      className="bg-white border-4 border-slate-900 rounded-[2rem] p-6 space-y-4 flex flex-col justify-between shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] hover:shadow-[10px_10px_0px_0px_rgba(15,23,42,1)] transition-all"
                    >
                      <div className="space-y-2">
                        <div className="flex justify-between items-start">
                          <span className="text-[9px] font-black uppercase bg-[#FF6B00]/10 border border-[#FF6B00]/20 text-[#FF6B00] px-2 py-0.5 rounded-full">
                            Term {unit.term} • {unit.timeline}
                          </span>
                          <span className="text-[10px] font-mono font-bold text-slate-400">Unit {unit.id}</span>
                        </div>
                        <h4 className="text-lg font-black uppercase text-slate-900 leading-tight pt-1">{unit.title}</h4>
                        <p className="text-[11px] text-slate-500 font-medium leading-relaxed">{unit.description}</p>
                      </div>

                      <div className="space-y-2 pt-2 border-t border-slate-100">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-slate-400 uppercase text-[9px] tracking-wider">{unit.strandName}</span>
                          <span className="font-black text-slate-900">{count} / {unit.targetLessons} Lessons</span>
                        </div>
                        
                        {/* Interactive Progress Bar */}
                        <div className="w-full h-3 bg-slate-100 border-2 border-slate-900 rounded-full overflow-hidden p-[1px]">
                          <div 
                            className="h-full bg-[#005BFF] rounded-full transition-all duration-500" 
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>

                        <div className="flex justify-between items-center pt-2">
                          <span className="text-[10px] font-black text-indigo-600">{percentage}% COMPLETE</span>
                          <button
                            onClick={() => onNavigate?.('planner')}
                            className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-slate-900 hover:text-[#FF6B00] transition-colors"
                          >
                            <span>Draft Plan</span>
                            <ArrowRight size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Trigger Details Button */}
          <div className="flex justify-center pt-4 relative z-10">
            <button
              onClick={() => setIsCurriculumModalOpen(true)}
              className="px-8 py-4 bg-slate-900 hover:bg-slate-800 text-white border-2 border-slate-900 rounded-full font-black text-xs uppercase tracking-widest transition-all shadow-[4px_4px_0px_0px_rgba(255,107,0,1)] hover:-translate-y-0.5 active:translate-y-0"
            >
              📊 Expand Interactive Curriculum Matrix
            </button>
          </div>
        </section>

        {/* 📋 CURRICULUM OVERVIEW HIGH-FIDELITY MODAL OVERLAY */}
        <AnimatePresence>
          {isCurriculumModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 md:p-10"
            >
              <motion.div
                initial={{ scale: 0.9, y: 50, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.9, y: 50, opacity: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 140 }}
                className="bg-[#FFFDF9] border-4 border-slate-900 w-full max-w-5xl rounded-[3rem] shadow-[16px_16px_0px_0px_rgba(15,23,42,1)] overflow-hidden max-h-[85vh] flex flex-col"
              >
                {/* Modal Header */}
                <div className="bg-slate-900 text-white p-6 md:p-8 flex items-center justify-between border-b-4 border-slate-900 flex-shrink-0">
                  <div className="space-y-1">
                    <span className="text-[10px] text-[#FF6B00] font-black uppercase tracking-[0.4em]">BOARD COMPLIANCE MAP</span>
                    <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tight">CBSE HPE Curriculum Mapping</h3>
                  </div>
                  <button 
                    onClick={() => setIsCurriculumModalOpen(false)}
                    className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl border border-white/10 transition-all flex items-center justify-center"
                    aria-label="Close Modal"
                  >
                    <span className="font-bold text-sm">✕</span>
                  </button>
                </div>

                {/* Modal Main Content Container (Scrollable) */}
                <div className="p-6 md:p-10 overflow-y-auto space-y-8 flex-1 custom-scrollbar">
                  {/* Global Overview Row */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-indigo-50 border-4 border-slate-900 rounded-[2rem] p-6 text-center space-y-1">
                      <span className="text-xs font-black text-indigo-400 uppercase">Selected Class</span>
                      <p className="text-3xl font-black text-indigo-900 uppercase">{selectedCurriculumClass}</p>
                      <p className="text-[10px] text-slate-400 font-bold">Academic Cycle: 2026-27</p>
                    </div>

                    <div className="bg-emerald-50 border-4 border-slate-900 rounded-[2rem] p-6 text-center space-y-1">
                      <span className="text-xs font-black text-emerald-400 uppercase">Total Target Units</span>
                      <p className="text-3xl font-black text-emerald-950 uppercase">6 Blocks</p>
                      <p className="text-[10px] text-slate-400 font-bold">Full Syllabus Covered</p>
                    </div>

                    <div className="bg-[#D4A017]/10 border-4 border-slate-900 rounded-[2rem] p-6 text-center space-y-1">
                      <span className="text-xs font-black text-[#0D2B52] uppercase">Active Generated Plans</span>
                      <p className="text-3xl font-black text-[#0D2B52] uppercase">
                        {history.filter(h => h.type === 'Lesson Plan').length} Plans
                      </p>
                      <p className="text-[10px] text-slate-500 font-bold">Saved in Local Vault</p>
                    </div>

                    {/* Overall Progress Calculator */}
                    {(() => {
                      let totalCount = 0;
                      let totalTarget = 0;
                      curriculumUnits.forEach(unit => {
                        const lessonPlans = history.filter(item => item.type === 'Lesson Plan');
                        const matchedCount = lessonPlans.filter(plan => {
                          const titleLower = plan.title.toLowerCase();
                          const contentStr = typeof plan.content === 'string' ? plan.content.toLowerCase() : JSON.stringify(plan.content || '').toLowerCase();
                          return unit.keywords.some(kw => titleLower.includes(kw) || contentStr.includes(kw));
                        }).length;
                        totalCount += matchedCount;
                        totalTarget += unit.targetLessons;
                      });
                      const totalPercentage = Math.min(100, Math.round((totalCount / totalTarget) * 100));

                      return (
                        <div className="bg-[#0D2B52]/10 border-4 border-slate-900 rounded-[2rem] p-6 text-center space-y-1">
                          <span className="text-xs font-black text-[#0D2B52] uppercase">Overall Completion</span>
                          <p className="text-3xl font-black text-[#0D2B52] uppercase">{totalPercentage}%</p>
                          <div className="w-full h-2 bg-slate-200 border border-slate-900 rounded-full overflow-hidden p-[1px] mt-1">
                            <div className="h-full bg-[#0D2B52] rounded-full" style={{ width: `${totalPercentage}%` }}></div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Syllabus Timeline Milestones (Term 1 & 2 Visual Map) */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-black uppercase text-slate-900 border-b-2 border-slate-200 pb-2 flex items-center gap-2">
                      <span>📆 Academic Timeline & Compliance Audit</span>
                    </h4>

                    <div className="space-y-6">
                      {/* Term 1 */}
                      <div className="bg-slate-50 border-4 border-slate-900 rounded-[2.5rem] p-6 space-y-4">
                        <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                          <h5 className="text-base font-black uppercase text-[#0D2B52]">Term 1 (April &mdash; September)</h5>
                          <span className="px-2.5 py-1 bg-[#0D2B52]/10 text-[#0D2B52] text-[9px] font-black uppercase rounded-lg">FMove, Skill mechanics & Safety</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          {curriculumUnits.filter(u => u.term === 1).map(unit => {
                            const matched = history.filter(item => item.type === 'Lesson Plan').filter(plan => {
                              const titleLower = plan.title.toLowerCase();
                              const contentStr = typeof plan.content === 'string' ? plan.content.toLowerCase() : JSON.stringify(plan.content || '').toLowerCase();
                              return unit.keywords.some(kw => titleLower.includes(kw) || contentStr.includes(kw));
                            });

                            return (
                              <div key={unit.id} className="bg-white border-2 border-slate-900 rounded-2xl p-4 space-y-3">
                                <div className="flex justify-between">
                                  <span className="text-[8px] font-mono font-bold text-slate-400">Unit {unit.id}</span>
                                  <span className="text-[9px] font-black uppercase text-[#0D2B52]">{unit.timeline}</span>
                                </div>
                                <h6 className="text-sm font-black uppercase text-slate-900 leading-tight">{unit.title}</h6>
                                
                                <div className="space-y-1">
                                  <div className="flex justify-between text-[10px] font-bold">
                                    <span className="text-slate-400">Lessons Completed:</span>
                                    <span>{matched.length} / {unit.targetLessons}</span>
                                  </div>
                                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-[#0D2B52]" style={{ width: `${Math.min(100, Math.round((matched.length / unit.targetLessons) * 100))}%` }}></div>
                                  </div>
                                </div>

                                {matched.length > 0 ? (
                                  <div className="pt-2 border-t border-slate-100 space-y-1">
                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Matched generated plans:</span>
                                    {matched.map((m, idx) => (
                                      <div key={idx} className="flex items-center gap-1 text-[9px] text-emerald-600 font-bold truncate">
                                        <span>✓</span>
                                        <span className="truncate">{m.title}</span>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-[9px] text-slate-400 font-semibold italic">No generated plans yet</p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Term 2 */}
                      <div className="bg-slate-50 border-4 border-slate-900 rounded-[2.5rem] p-6 space-y-4">
                        <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                          <h5 className="text-base font-black uppercase text-[#D4A017]">Term 2 (October &mdash; March)</h5>
                          <span className="px-2.5 py-1 bg-[#D4A017]/15 text-[#0D2B52] text-[9px] font-black uppercase rounded-lg">Asanas, Team tactics & SEWA</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          {curriculumUnits.filter(u => u.term === 2).map(unit => {
                            const matched = history.filter(item => item.type === 'Lesson Plan').filter(plan => {
                              const titleLower = plan.title.toLowerCase();
                              const contentStr = typeof plan.content === 'string' ? plan.content.toLowerCase() : JSON.stringify(plan.content || '').toLowerCase();
                              return unit.keywords.some(kw => titleLower.includes(kw) || contentStr.includes(kw));
                            });

                            return (
                              <div key={unit.id} className="bg-white border-2 border-slate-900 rounded-2xl p-4 space-y-3">
                                <div className="flex justify-between">
                                  <span className="text-[8px] font-mono font-bold text-slate-400">Unit {unit.id}</span>
                                  <span className="text-[9px] font-black uppercase text-[#D4A017]">{unit.timeline}</span>
                                </div>
                                <h6 className="text-sm font-black uppercase text-slate-900 leading-tight">{unit.title}</h6>
                                
                                <div className="space-y-1">
                                  <div className="flex justify-between text-[10px] font-bold">
                                    <span className="text-slate-400">Lessons Completed:</span>
                                    <span>{matched.length} / {unit.targetLessons}</span>
                                  </div>
                                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-[#FF6B00]" style={{ width: `${Math.min(100, Math.round((matched.length / unit.targetLessons) * 100))}%` }}></div>
                                  </div>
                                </div>

                                {matched.length > 0 ? (
                                  <div className="pt-2 border-t border-slate-100 space-y-1">
                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Matched generated plans:</span>
                                    {matched.map((m, idx) => (
                                      <div key={idx} className="flex items-center gap-1 text-[9px] text-emerald-600 font-bold truncate">
                                        <span>✓</span>
                                        <span className="truncate">{m.title}</span>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-[9px] text-slate-400 font-semibold italic">No generated plans yet</p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="bg-slate-100 border-t-2 border-slate-900 p-6 flex justify-end gap-3 flex-shrink-0">
                  <button
                    onClick={() => setIsCurriculumModalOpen(false)}
                    className="px-6 py-3 bg-white border-2 border-slate-900 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                  >
                    Close Overview
                  </button>
                  <button
                    onClick={() => {
                      setIsCurriculumModalOpen(false);
                      onNavigate?.('planner');
                    }}
                    className="px-6 py-3 bg-[#0D2B52] hover:bg-[#164077] text-white border-2 border-slate-900 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-[2px_2px_0px_0px_rgba(13,43,82,1)]"
                  >
                    Create New Plan Now &rarr;
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ASSESS Group */}
        <section className="space-y-12">
          <div className="flex items-end justify-between border-b-4 border-slate-900 pb-8">
            <div className="space-y-4">
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#D4A017]">02. ASSESS & TRACK</p>
              <h2 className="text-4xl md:text-7xl font-black text-[#0D2B52] tracking-tighter uppercase leading-[0.85] font-display">Fitness & <br/> <span className="text-[#D4A017]">Progress.</span></h2>
              <p className="text-sm text-[#333333] font-bold uppercase tracking-widest mt-2 block">School Fitness & Student Progress Records</p>
            </div>
          </div>

          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-50px" }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
          >
            {/* School Fitness Database */}
            <motion.div 
              variants={cardVariants}
              whileHover={{ scale: 1.01, y: -5 }}
              onClick={() => onNavigate?.('school-overview')}
              className="lg:col-span-2 group bg-[#0D2B52] border-4 border-slate-900 rounded-[3rem] p-10 hover:shadow-[12px_12px_0px_0px_rgba(13,43,82,0.3)] transition-all cursor-pointer relative overflow-hidden"
            >
              <div className="relative z-10 h-full flex flex-col justify-between space-y-12">
                <div className="w-16 h-16 bg-[#D4A017] text-[#0D2B52] rounded-2xl flex items-center justify-center shadow-xl">
                  <Wrench size={32} />
                </div>
                <div className="space-y-4">
                  <div className="inline-flex px-3 py-1 bg-white/10 text-[#D4A017] rounded-full text-[9px] font-black uppercase tracking-widest mb-2">Primary Module</div>
                  <h3 className="text-3xl font-black text-white uppercase tracking-tight font-display">School Fitness Ledger</h3>
                  <p className="text-slate-200 font-medium">Store and organize student health records, daily fitness test results, and Khelo India battery scores in a centralized ledger.</p>
                </div>
                <div className="flex items-center space-x-3 text-[#D4A017] font-black text-[10px] uppercase tracking-[0.2em]">
                  <span>Access Fitness Ledger</span>
                  <ArrowRight size={18} />
                </div>
              </div>
            </motion.div>

            {/* Fitness Tests */}
            <motion.div 
              variants={cardVariants}
              whileHover={{ scale: 1.02, y: -5 }}
              onClick={() => onNavigate?.('fitness')}
              className="group bg-[#D4A017]/10 border-4 border-slate-900 rounded-[3rem] p-8 hover:shadow-[12px_12px_0px_0px_rgba(212,160,23,0.2)] transition-all cursor-pointer flex flex-col justify-between"
            >
              <div className="w-16 h-16 bg-[#0D2B52] text-[#D4A017] rounded-2xl flex items-center justify-center shadow-lg">
                <Activity size={32} />
              </div>
              <div className="space-y-4">
                <h3 className="text-2xl font-black uppercase tracking-tight text-[#0D2B52] font-display">Khelo India Battery</h3>
                <p className="text-slate-600 text-sm font-medium">Record required fitness battery tests. All mandatory age-appropriate CBSE fitness items are pre-loaded.</p>
                <ArrowRight className="text-slate-400 group-hover:text-[#0D2B52] transition-colors" size={24} />
              </div>
            </motion.div>

            {/* Test Generator */}
            <motion.div 
              variants={cardVariants}
              whileHover={{ scale: 1.02, y: -5 }}
              onClick={() => onNavigate?.('testpaper')}
              className="group bg-white border-4 border-slate-900 rounded-[3rem] p-8 hover:shadow-[12px_12px_0px_0px_rgba(13,43,82,0.15)] transition-all cursor-pointer flex flex-col justify-between"
            >
              <div className="w-16 h-16 bg-[#0D2B52] text-white rounded-2xl flex items-center justify-center shadow-lg">
                <ClipboardList size={32} />
              </div>
              <div className="space-y-4">
                <h3 className="text-2xl font-black uppercase tracking-tight text-[#0D2B52] font-display">Theory Test Generator</h3>
                <p className="text-slate-600 text-sm font-medium">Create CBSE-tailored theory question papers, quizzes, and sports mock examinations in one click.</p>
                <ArrowRight className="text-slate-400 group-hover:text-[#0D2B52] transition-colors" size={24} />
              </div>
            </motion.div>
          </motion.div>
        </section>

        {/* 📊 STUDENT PERFORMANCE: Student Progress & Longitudinal Analytics Hub */}
        <section className="space-y-12 bg-white border-4 border-slate-900 rounded-[3.5rem] p-8 md:p-14 relative overflow-hidden shadow-[12px_12px_0px_0px_rgba(13,43,82,1)]">
          <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'linear-gradient(#0D2B52 1px, transparent 1px), linear-gradient(90deg, #0D2B52 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
          
          <div className="flex flex-col md:flex-row md:items-end justify-between border-b-4 border-slate-900 pb-8 relative z-10">
            <div className="space-y-4">
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#D4A017]">02.5 STUDENT PERFORMANCE</p>
              <h2 className="text-4xl md:text-6xl font-black text-[#0D2B52] tracking-tighter uppercase leading-[0.9] font-display">Student Progress & <br/> <span className="text-[#D4A017]">Longitudinal Reports.</span></h2>
              <p className="text-sm text-[#333333] font-medium leading-relaxed max-w-xl">
                Track tangible physical growth and fitness metrics over time. Compare baseline, midline, and year-end fitness batteries to understand and guide student development.
              </p>
            </div>
            <div className="mt-4 md:mt-0">
              <span className="px-4 py-2 bg-[#D4A017]/15 border border-[#D4A017]/40 text-[#0D2B52] rounded-full text-xs font-black uppercase tracking-widest inline-flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#D4A017] animate-pulse"></span>
                Student Analytics Active
              </span>
            </div>
          </div>

          {/* Interactive Core Dashboard Preview */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
            {/* Control Sidebar */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-[#F5F7FA] border-4 border-slate-900 rounded-[2rem] p-6 space-y-6">
                <div>
                  <h4 className="text-xs font-black uppercase text-slate-500 tracking-wider mb-3">1. Select Grade/Class</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {(['8-A', '7-C', '9-B'] as const).map((grade) => (
                      <button
                        key={grade}
                        onClick={() => {
                          setSelectedClassProgress(grade);
                          if (downloadStatus) setDownloadStatus(null);
                        }}
                        className={`py-2 px-3 text-xs font-black rounded-xl border-2 border-slate-900 transition-all ${
                          selectedClassProgress === grade 
                            ? 'bg-[#0D2B52] text-white shadow-[2px_2px_0px_0px_rgba(212,160,23,1)]' 
                            : 'bg-white text-slate-800 hover:bg-slate-100 shadow-[2px_2px_0px_0px_rgba(13,43,82,1)]'
                        }`}
                      >
                        Grade {grade}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-black uppercase text-slate-500 tracking-wider mb-3">2. Select Analytics View</h4>
                  <div className="flex flex-col gap-2">
                    {[
                      { id: 'fitness', label: '📊 Fitness Trends', desc: 'Compare 50m sprint times & flexibility.' },
                      { id: 'skills', label: '🎯 Skill Progression Mastery', desc: 'Assess sports mechanics and grades.' },
                      { id: 'interventions', label: '⚠️ Intervention Flags', desc: 'Identify students at obesity/cardio risk.' },
                    ].map((btn) => (
                      <button
                        key={btn.id}
                        onClick={() => setSelectedMetricType(btn.id as any)}
                        className={`text-left p-3.5 rounded-xl border-2 border-slate-900 transition-all flex flex-col space-y-1 ${
                          selectedMetricType === btn.id 
                            ? 'bg-[#0D2B52] text-white shadow-[3px_3px_0px_0px_rgba(212,160,23,1)]' 
                            : 'bg-white text-slate-800 hover:bg-[#D4A017]/10 shadow-[3px_3px_0px_0px_rgba(13,43,82,1)]'
                        }`}
                      >
                        <span className="text-xs font-black uppercase tracking-wider">{btn.label}</span>
                        <span className={`text-[10px] leading-relaxed ${selectedMetricType === btn.id ? 'text-[#D4A017]' : 'text-slate-500'}`}>{btn.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Parent Report Card Trigger */}
                <div className="pt-4 border-t-2 border-dashed border-slate-200">
                  <button
                    onClick={() => {
                      setDownloadStatus('generating');
                      setTimeout(() => {
                        setDownloadStatus('success');
                      }, 1500);
                    }}
                    disabled={downloadStatus === 'generating'}
                    className="w-full py-3.5 px-5 bg-[#0D2B52] hover:bg-[#164077] text-white border-2 border-slate-900 rounded-xl font-black text-[11px] uppercase tracking-widest transition-all shadow-[3px_3px_0px_0px_rgba(13,43,82,1)] active:translate-y-0.5 active:shadow-none flex items-center justify-center gap-2"
                  >
                    {downloadStatus === 'generating' ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-[#D4A017]" />
                        <span>Compiling Progress Log...</span>
                      </>
                    ) : downloadStatus === 'success' ? (
                      <>
                        <ShieldCheck className="w-4 h-4 text-[#D4A017]" />
                        <span>Downloaded Report Card!</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 text-[#D4A017]" />
                        <span>Download Class Report Card</span>
                      </>
                    )}
                  </button>
                  {downloadStatus === 'success' && (
                    <motion.p 
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-[10px] text-emerald-600 font-bold mt-2 text-center"
                    >
                      ✓ Downloaded: smartpe_grade_{selectedClassProgress}_term_report.pdf
                    </motion.p>
                  )}
                </div>
              </div>
            </div>

            {/* Display Pane */}
            <div className="lg:col-span-8 bg-[#0D2B52] border-4 border-slate-900 rounded-[2rem] p-6 text-white min-h-[350px] flex flex-col justify-between">
              {selectedMetricType === 'fitness' && (
                <div className="space-y-4 h-full flex flex-col justify-between">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <div>
                      <span className="text-[10px] text-[#D4A017] font-bold uppercase tracking-widest">Active Live Dataset &bull; Grade {selectedClassProgress}</span>
                      <h4 className="text-lg font-black uppercase text-white font-display">Khelo India Fitness Battery Progress</h4>
                    </div>
                    <span className="px-2.5 py-1 bg-white/10 text-white rounded-lg text-[9px] font-mono">3 Terms Consolidated</span>
                  </div>

                  <p className="text-xs text-slate-400 max-w-xl">
                    Longitudinal assessment comparing student performance across July (Baseline), November (Midline), and March (Year-End) for Grade {selectedClassProgress}.
                  </p>

                  <div className="h-[180px] w-full bg-slate-900/50 p-2 rounded-xl border border-slate-800">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={classProgressData[selectedClassProgress]} margin={{ top: 10, right: 20, left: -20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2D3748" />
                        <XAxis dataKey="checkpoint" stroke="#94A3B8" fontSize={10} fontWeight="bold" />
                        <YAxis stroke="#94A3B8" fontSize={10} />
                        <Tooltip contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '8px' }} />
                        <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                        <Line name="50m Sprint (Lower = Faster, secs)" type="monotone" dataKey="speed" stroke="#D4A017" strokeWidth={3} activeDot={{ r: 8 }} />
                        <Line name="Sit & Reach (Higher = Better, cm)" type="monotone" dataKey="flexibility" stroke="#0D2B52" strokeWidth={3} />
                        <Line name="600m Run/Walk (Lower = More Endurance, secs)" type="monotone" dataKey="endurance" stroke="#10B981" strokeWidth={3} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="grid grid-cols-3 gap-2 bg-[#0D2B52]/50 border border-white/10 p-3 rounded-xl text-center">
                    <div>
                      <p className="text-[9px] text-slate-300 uppercase font-black">50m Speed Improvement</p>
                      <p className="text-sm font-black text-[#D4A017]">-1.1s (Average)</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-slate-300 uppercase font-black">Flexibility Delta</p>
                      <p className="text-sm font-black text-[#D4A017]">+4.8 cm</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-slate-300 uppercase font-black">Endurance Time Drop</p>
                      <p className="text-sm font-black text-emerald-400">-37s (Average)</p>
                    </div>
                  </div>
                </div>
              )}

              {selectedMetricType === 'skills' && (
                <div className="space-y-4 h-full flex flex-col justify-between">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <div>
                      <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">Technique & Play Mechanics &bull; Grade {selectedClassProgress}</span>
                      <h4 className="text-lg font-black uppercase text-white font-display">CBSE Practical Skill Progression</h4>
                    </div>
                    <span className="px-2.5 py-1 bg-[#10B981]/20 text-[#10B981] rounded-lg text-[9px] font-mono">10-Point Rubric</span>
                  </div>

                  <p className="text-xs text-slate-300">
                    Average student ratings based on continuous practical rubrics generated for curriculum sports modules.
                  </p>

                  <div className="space-y-3 flex-1 justify-center flex flex-col">
                    {[
                      { skill: 'Football: Ball Control & Dribbling Technique', start: 4.5, end: 8.8, color: 'bg-[#0D2B52]' },
                      { skill: 'Basketball: Chest Pass & Layup Mechanics', start: 5.2, end: 8.2, color: 'bg-[#164077]' },
                      { skill: 'Athletics: Sprint Block Start Position', start: 3.8, end: 7.9, color: 'bg-[#D4A017]' },
                    ].map((s, idx) => (
                      <div key={idx} className="space-y-1 bg-[#0D2B52]/80 p-2.5 rounded-lg border border-white/10">
                        <div className="flex justify-between text-[11px] font-bold">
                          <span>{s.skill}</span>
                          <span className="text-slate-300">Baseline {s.start} &rarr; <strong className="text-[#D4A017]">{s.end} / 10</strong></span>
                        </div>
                        <div className="relative w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                          <div className={`absolute top-0 left-0 h-full bg-slate-700`} style={{ width: `${s.start * 10}%` }}></div>
                          <div className={`absolute top-0 left-0 h-full ${s.color}`} style={{ width: `${s.end * 10}%` }}></div>
                        </div>
                        <div className="flex justify-between text-[8px] text-slate-400 uppercase font-black">
                          <span>Initial Level</span>
                          <span>Year-end Mastery Growth: +{Math.round(((s.end - s.start) / s.start) * 100)}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedMetricType === 'interventions' && (
                <div className="space-y-4 h-full flex flex-col justify-between">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <div>
                      <span className="text-[10px] text-[#D4A017] font-bold uppercase tracking-widest">Health & Fitness Indicators &bull; Grade {selectedClassProgress}</span>
                      <h4 className="text-lg font-black uppercase text-white font-display">Student Health & Fitness Feedback</h4>
                    </div>
                    <span className="px-2.5 py-1 bg-[#D4A017]/20 text-[#D4A017] rounded-lg text-[9px] font-mono">Notices Active</span>
                  </div>

                  <p className="text-xs text-slate-300">
                    Identify physical progress notices and view practical action-oriented advice for individual student support.
                  </p>

                  <div className="space-y-2.5 flex-1 justify-center flex flex-col">
                    {[
                      { student: 'Amit R. (Roll 04)', zone: 'Above Recommended BMI (BMI 30.2)', alert: 'Cardio endurance trials trailed 25% below grade average.', action: 'Introduce low-impact aerobic intervals & modified shuttle walks.' },
                      { student: 'Priya K. (Roll 17)', zone: 'Below Recommended BMI (BMI 15.4)', alert: 'Core and leg strength scores indicate fatigue.', action: 'Focus on light bodyweight balance drills & endurance logs.' },
                    ].map((st, i) => (
                      <div key={i} className="p-3 bg-white/5 border border-white/10 rounded-xl space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-black text-[#D4A017]">{st.student}</span>
                          <span className="px-2 py-0.5 bg-[#D4A017]/10 border border-[#D4A017]/30 text-[#D4A017] rounded text-[9px] font-black uppercase">{st.zone}</span>
                        </div>
                        <p className="text-[10px] text-slate-300 font-medium">
                          <strong>Feedback:</strong> {st.alert}
                        </p>
                        <p className="text-[10px] text-emerald-400 font-bold">
                          <strong>💡 Practical Suggestion:</strong> {st.action}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ADMIN Group */}
        <section className="space-y-12">
          <div className="flex items-end justify-between border-b-4 border-slate-900 pb-8">
            <div className="space-y-4">
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#D4A017]">03. COMMUNICATE & MANAGE</p>
              <h2 className="text-4xl md:text-7xl font-black text-[#0D2B52] tracking-tighter uppercase leading-[0.85] font-display">Administrative <br/> <span className="text-[#D4A017]">Workflows.</span></h2>
            </div>
          </div>

          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-50px" }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {/* Parent Letters */}
            <motion.div 
              variants={cardVariants}
              whileHover={{ scale: 1.02 }}
              onClick={() => onNavigate?.('parentletters')}
              className="group bg-[#F5F7FA] border-4 border-slate-900 rounded-[2.5rem] p-8 hover:shadow-[12px_12px_0px_0px_rgba(13,43,82,0.15)] transition-all cursor-pointer"
            >
               <div className="flex items-center gap-6 mb-6">
                 <div className="w-14 h-14 bg-[#0D2B52] text-[#D4A017] rounded-2xl flex items-center justify-center"><Mail size={24}/></div>
                 <h3 className="text-xl font-black uppercase text-[#0D2B52] font-display">Parent Notices</h3>
               </div>
               <p className="text-slate-600 text-xs font-medium mb-6">Create clear parent notifications and announcement letters for upcoming sports events and fitness milestones.</p>
               <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#0D2B52]">
                 <span>Create Notification</span>
                 <ArrowRight size={14} className="text-[#D4A017]" />
               </div>
            </motion.div>

            {/* Yearly Planner */}
            <motion.div 
              variants={cardVariants}
              whileHover={{ scale: 1.02 }}
              onClick={() => onNavigate?.('yearly')}
              className="group bg-[#0D2B52] border-4 border-slate-900 rounded-[2.5rem] p-8 hover:shadow-[12px_12px_0px_0px_rgba(13,43,82,0.25)] transition-all cursor-pointer text-white"
            >
               <div className="flex items-center gap-6 mb-6">
                 <div className="w-14 h-14 bg-[#D4A017] text-[#0D2B52] rounded-2xl flex items-center justify-center"><Calendar size={24}/></div>
                 <h3 className="text-xl font-black uppercase font-display">School PE Calendar</h3>
               </div>
               <p className="text-slate-200 text-xs font-medium mb-6">Map out lesson goals across the full academic year to synchronize with school exams and vacations.</p>
               <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#D4A017]">
                 <span>Organize Calendar</span>
                 <ArrowRight size={14} />
               </div>
            </motion.div>

            {/* Compliance */}
            <motion.div 
              variants={cardVariants}
              whileHover={{ scale: 1.02 }}
              onClick={() => onNavigate?.('compliance')}
              className="group bg-[#D4A017]/10 border-4 border-slate-900 rounded-[2.5rem] p-8 hover:shadow-[12px_12px_0px_0px_rgba(212,160,23,0.2)] transition-all cursor-pointer"
            >
               <div className="flex items-center gap-6 mb-6">
                 <div className="w-14 h-14 bg-[#0D2B52] text-[#D4A017] rounded-2xl flex items-center justify-center"><ShieldCheck size={24}/></div>
                 <h3 className="text-xl font-black uppercase text-[#0D2B52] font-display">Board Compliance</h3>
               </div>
               <p className="text-slate-600 text-xs font-medium mb-6">Verify syllabus logs, sports hours, and testing cards meet current CBSE and national guidelines.</p>
               <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#0D2B52]">
                 <span>Check Alignment</span>
                 <ArrowRight size={14} className="text-[#D4A017]" />
               </div>
            </motion.div>
          </motion.div>
        </section>

        {/* 🏆 LEADERSHIP SUITE: The Principal & HoD Suite */}
        <section className="space-y-12 bg-[#F5F7FA] border-4 border-slate-900 rounded-[3.5rem] p-8 md:p-14 relative overflow-hidden shadow-[12px_12px_0px_0px_rgba(13,43,82,1)]">
          {/* Subtle grid pattern background */}
          <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'linear-gradient(#0D2B52 1px, transparent 1px), linear-gradient(90deg, #0D2B52 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
          
          <div className="flex flex-col md:flex-row md:items-end justify-between border-b-4 border-slate-900 pb-8 relative z-10">
            <div className="space-y-4">
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#D4A017]">04. LEADERSHIP SUITE</p>
              <h2 className="text-4xl md:text-6xl font-black text-[#0D2B52] tracking-tighter uppercase leading-[0.9] font-display">Principals & <br/> <span className="text-[#D4A017]">PE Administrators.</span></h2>
              <p className="text-sm text-[#333333] font-medium leading-relaxed max-w-xl">
                Secure oversight dashboards and physical education reporting for school leaders, principals, and department coordinators.
              </p>
            </div>
            <div className="mt-4 md:mt-0">
              <span className="px-4 py-2 bg-[#D4A017]/15 border border-[#D4A017]/40 text-[#0D2B52] rounded-full text-xs font-black uppercase tracking-widest inline-flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#D4A017] animate-pulse"></span>
                School Reports Ready
              </span>
            </div>
          </div>

          {/* Interactive Navigation Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
            {/* Card 1: Principal Dashboard */}
            <motion.div 
              whileHover={{ scale: 1.01, y: -4 }}
              onClick={() => onNavigate?.('principal-dashboard')}
              className="group bg-[#0D2B52] text-white rounded-[2.5rem] p-8 md:p-10 hover:shadow-[12px_12px_0px_0px_rgba(13,43,82,0.3)] transition-all cursor-pointer relative overflow-hidden border-4 border-slate-900"
            >
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                <ShieldCheck size={120} />
              </div>
              <div className="relative z-10 h-full flex flex-col justify-between space-y-8">
                <div className="flex items-center justify-between">
                  <div className="w-14 h-14 bg-[#D4A017] text-[#0D2B52] rounded-2xl flex items-center justify-center shadow-lg">
                    <ShieldCheck size={28} />
                  </div>
                  <span className="text-[10px] font-black bg-[#D4A017]/20 text-[#D4A017] border border-[#D4A017]/30 px-3 py-1 rounded-full uppercase tracking-wider">Leadership Oversight</span>
                </div>
                <div className="space-y-3">
                  <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tight font-display">Principal Dashboard</h3>
                  <p className="text-slate-200 text-xs md:text-sm font-medium leading-relaxed">
                    A clear overview for school principals and leadership to review PE curriculum milestones, annual athletic calendar progress, medical notices, and school-wide fitness participation rates.
                  </p>
                </div>
                <div className="flex items-center space-x-2 text-[#D4A017] group-hover:text-white transition-colors font-black text-xs uppercase tracking-[0.2em] pt-4">
                  <span>Open Principal Dashboard</span>
                  <ArrowRight size={16} />
                </div>
              </div>
            </motion.div>

            {/* Card 2: PE Department Office */}
            <motion.div 
              whileHover={{ scale: 1.01, y: -4 }}
              onClick={() => onNavigate?.('department-office')}
              className="group bg-white text-slate-900 rounded-[2.5rem] p-8 md:p-10 hover:shadow-[12px_12px_0px_0px_rgba(13,43,82,0.2)] transition-all cursor-pointer relative overflow-hidden border-4 border-slate-900"
            >
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform text-slate-400">
                <Wrench size={120} />
              </div>
              <div className="relative z-10 h-full flex flex-col justify-between space-y-8">
                <div className="flex items-center justify-between">
                  <div className="w-14 h-14 bg-[#0D2B52] text-[#D4A017] rounded-2xl flex items-center justify-center shadow-lg">
                    <Wrench size={28} />
                  </div>
                  <span className="text-[10px] font-black bg-[#D4A017]/15 text-[#0D2B52] border border-[#D4A017]/30 px-3 py-1 rounded-full uppercase tracking-wider">Coordinator Hub</span>
                </div>
                <div className="space-y-3">
                  <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-[#0D2B52] font-display">Coordinator Suite</h3>
                  <p className="text-slate-600 text-xs md:text-sm font-medium leading-relaxed">
                    Coordinating workspace for PE heads and athletic directors. Manage class substitutions when a sports teacher is absent, log sports equipment checkouts, and record Inter-House sports points.
                  </p>
                </div>
                <div className="flex items-center space-x-2 text-[#0D2B52] group-hover:text-[#164077] transition-colors font-black text-xs uppercase tracking-[0.2em] pt-4">
                  <span>Open Coordinator Suite</span>
                  <ArrowRight size={16} className="text-[#D4A017]" />
                </div>
              </div>
            </motion.div>
          </div>

          {/* 🔄 INTERACTIVE TEACHER-TO-PRINCIPAL DATA FLOW PIPELINE */}
          <div className="bg-white border-4 border-slate-900 rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 space-y-8 relative z-10">
            <div className="space-y-2 text-left">
              <h3 className="text-xl md:text-2xl font-black text-[#0D2B52] uppercase tracking-tight flex items-center gap-2 font-display">
                <TrendingUp className="text-[#D4A017]" size={22} />
                How Your PE Department Stays Organized
              </h3>
              <p className="text-xs text-slate-600 font-medium leading-relaxed max-w-2xl">
                Daily inputs from the school playground automatically feed into clean, professional summaries for leadership and board audits.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
              {/* Step 1 */}
              <div className="p-5 bg-[#0D2B52]/5 border-2 border-dashed border-[#0D2B52]/30 rounded-2xl space-y-3 relative">
                <div className="w-10 h-10 rounded-xl bg-[#0D2B52] text-[#D4A017] flex items-center justify-center font-black text-xs shadow-md">1</div>
                <h4 className="text-sm font-black uppercase text-[#0D2B52] font-display">1. Teacher Inputs (Daily)</h4>
                <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                  Teachers click on <strong className="text-[#0D2B52] font-bold">Khelo India Battery</strong> to log student scores, or update daily logs in the <strong className="text-[#0D2B52] font-bold">Coordinator Suite</strong> on the ground.
                </p>
              </div>

              {/* Step 2 */}
              <div className="p-5 bg-[#D4A017]/10 border-2 border-dashed border-[#D4A017]/40 rounded-2xl space-y-3 relative">
                <div className="w-10 h-10 rounded-xl bg-[#0D2B52] text-[#D4A017] flex items-center justify-center font-black text-xs shadow-md">2</div>
                <h4 className="text-sm font-black uppercase text-[#0D2B52] font-display">2. SmartPE Organizes</h4>
                <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                  The central database registers individual scores, tracks lesson plan progress, counts completed curriculum hours, and compiles inter-house sports point tallies.
                </p>
              </div>

              {/* Step 3 */}
              <div className="p-5 bg-[#0D2B52]/5 border-2 border-dashed border-[#0D2B52]/30 rounded-2xl space-y-3 relative">
                <div className="w-10 h-10 rounded-xl bg-[#0D2B52] text-[#D4A017] flex items-center justify-center font-black text-xs shadow-md">3</div>
                <h4 className="text-sm font-black uppercase text-[#0D2B52] font-display">3. Live Principal Review</h4>
                <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                  School leaders access the <strong className="text-[#0D2B52] font-bold">Principal Dashboard</strong> to instantly view compliant, print-ready summaries, annual calendar progress, and student participation metrics.
                </p>
              </div>
            </div>
          </div>

          {/* 🏢 DEPARTMENT OPERATIONS: Live Nerve Center Preview */}
          <div className="bg-[#0D2B52] border-4 border-slate-900 rounded-[2.5rem] p-6 md:p-8 text-white relative z-10 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-white/10 pb-5">
              <div className="space-y-1">
                <span className="text-[10px] text-[#D4A017] font-black uppercase tracking-widest">Live Demo PE Department Nerve Center</span>
                <h3 className="text-xl md:text-2xl font-black uppercase tracking-tight text-white flex items-center gap-2 font-display">
                  <Wrench size={22} className="text-[#D4A017]" />
                  PE Department Nerve Center
                </h3>
                <p className="text-xs text-slate-200 font-medium leading-relaxed max-w-xl">
                  Explore the live administrative workspace used by coordinators to handle daily school sports operations.
                </p>
              </div>
              <div className="mt-4 md:mt-0 flex gap-1 bg-[#091D38] p-1.5 rounded-xl border border-white/10">
                {(['metrics', 'inventory', 'substitutions', 'house-points'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveDeptTab(tab)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                      activeDeptTab === tab
                        ? 'bg-[#D4A017] text-[#0D2B52]'
                        : 'text-slate-300 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {tab.replace('-', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Content Tabs Pane */}
            <div className="bg-[#091D38] rounded-2xl p-5 border border-white/10 min-h-[220px] flex flex-col justify-between">
              {activeDeptTab === 'metrics' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-300">📊 Live Department Metrics & Attendance</h4>
                    <span className="px-2 py-0.5 bg-[#D4A017]/15 border border-[#D4A017]/30 text-[#D4A017] rounded text-[9px] font-mono">Auto-Compiling</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-[#0D2B52] p-4 rounded-xl border border-white/10">
                      <p className="text-[9px] text-slate-300 uppercase font-bold">Daily Attendance</p>
                      <p className="text-2xl font-black text-emerald-400">96.4%</p>
                      <p className="text-[8px] text-slate-300 mt-1">412/427 students active</p>
                    </div>
                    <div className="bg-[#0D2B52] p-4 rounded-xl border border-white/10">
                      <p className="text-[9px] text-slate-300 uppercase font-bold">Class Coverage</p>
                      <p className="text-2xl font-black text-[#D4A017]">100%</p>
                      <p className="text-[8px] text-slate-300 mt-1">All 14 PE periods staffed</p>
                    </div>
                    <div className="bg-[#0D2B52] p-4 rounded-xl border border-white/10">
                      <p className="text-[9px] text-slate-300 uppercase font-bold">Syllabus Completed</p>
                      <p className="text-2xl font-black text-emerald-400">78.5%</p>
                      <p className="text-[8px] text-slate-300 mt-1">On schedule with CBSE blueprint</p>
                    </div>
                    <div className="bg-[#0D2B52] p-4 rounded-xl border border-white/10">
                      <p className="text-[9px] text-slate-300 uppercase font-bold">Active Medical Flags</p>
                      <p className="text-2xl font-black text-[#D4A017]">2 Gaps</p>
                      <p className="text-[8px] text-[#D4A017] font-bold mt-1">✓ Logged with first-aid ward</p>
                    </div>
                  </div>
                </div>
              )}

              {activeDeptTab === 'inventory' && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-300">📦 Athletic Equipment & Resource Ledger</h4>
                    <span className="text-[9px] text-emerald-400 font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                      All Stocks Calibrated
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-[11px]">
                      <thead>
                        <tr className="border-b border-white/10 text-slate-400 font-black uppercase">
                          <th className="pb-2">Sport Item</th>
                          <th className="pb-2">Total Stock</th>
                          <th className="pb-2">Checked Out</th>
                          <th className="pb-2">Available</th>
                          <th className="pb-2">Condition Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-slate-200">
                        <tr>
                          <td className="py-2 font-black text-white">Nivia Footballs (Size 5)</td>
                          <td className="py-2">35</td>
                          <td className="py-2 text-[#D4A017]">5 (Grade 8-A)</td>
                          <td className="py-2 text-emerald-400 font-bold">30</td>
                          <td className="py-2"><span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded text-[9px] font-bold">Excellent</span></td>
                        </tr>
                        <tr>
                          <td className="py-2 font-black text-white">English Willow Cricket Kits</td>
                          <td className="py-2">12</td>
                          <td className="py-2 text-[#D4A017]">2 (Grade 10-C)</td>
                          <td className="py-2 text-emerald-400 font-bold">10</td>
                          <td className="py-2"><span className="px-1.5 py-0.5 bg-[#D4A017]/15 text-[#D4A017] border border-[#D4A017]/30 rounded text-[9px] font-bold">1 Grips Damaged</span></td>
                        </tr>
                        <tr>
                          <td className="py-2 font-black text-white">Anti-Slip PVC Yoga Mats</td>
                          <td className="py-2">150</td>
                          <td className="py-2 text-slate-400">0</td>
                          <td className="py-2 text-emerald-400 font-bold">150</td>
                          <td className="py-2"><span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded text-[9px] font-bold">Clean & Rolled</span></td>
                        </tr>
                        <tr>
                          <td className="py-2 font-black text-white">Yonex Badminton Rackets</td>
                          <td className="py-2">40</td>
                          <td className="py-2 text-[#D4A017]">14 (Grade 7-C)</td>
                          <td className="py-2 text-emerald-400 font-bold">26</td>
                          <td className="py-2"><span className="px-1.5 py-0.5 bg-[#D4A017]/15 text-[#D4A017] border border-[#D4A017]/30 rounded text-[9px] font-bold">2 Broken Strings</span></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeDeptTab === 'substitutions' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-300">🔄 AI-Automated Substitution Scheduler</h4>
                    <span className="px-2 py-0.5 bg-[#D4A017]/15 border border-[#D4A017]/30 text-[#D4A017] rounded text-[9px] font-mono">1 Active Notice</span>
                  </div>
                  <div className="p-4 bg-[#0D2B52] border border-white/10 rounded-xl space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-2.5">
                      <div>
                        <span className="text-[9px] text-[#D4A017] font-black uppercase">Teacher Absent (On Sick Leave)</span>
                        <p className="text-xs font-black text-white">Mr. Devanshu Malhotra (Senior School PE HoD)</p>
                      </div>
                      <div className="text-right sm:text-right">
                        <span className="text-[9px] text-slate-300 font-black uppercase">Schedule Impacted</span>
                        <p className="text-xs font-mono text-[#D4A017]">Period 3 (Grade 8-A Basketball Practical)</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#D4A017] text-[#0D2B52] flex items-center justify-center font-bold text-xs shadow-md">AI</div>
                      <div>
                        <p className="text-xs font-black text-white">Recommended Match Replacement Assigned</p>
                        <p className="text-[10px] text-slate-200 leading-relaxed mt-0.5">
                          <strong>Ms. Meera Nair</strong> has a free slot in Period 3 and is certified in Basketball drills. Substitution roster auto-updated, notification broadcasted to high-school wing coordinator, and lesson plan shared with Ms. Meera Nair's phone app.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeDeptTab === 'house-points' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-300">🏆 Inter-House Championship Standings</h4>
                    <span className="text-[9px] text-[#D4A017] font-bold">Points sync directly with Board Audit Ledgers</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      {[
                        { house: 'Agni House (Navy)', points: housePoints.Agni, color: 'bg-[#0D2B52]', max: 500 },
                        { house: 'Jal House (Gold)', points: housePoints.Jal, color: 'bg-[#D4A017]', max: 500 },
                        { house: 'Prithvi House (Royal Blue)', points: housePoints.Prithvi, color: 'bg-[#164077]', max: 500 },
                        { house: 'Vayu House (Amber Gold)', points: housePoints.Vayu, color: 'bg-[#B8860B]', max: 500 },
                      ].map((h, i) => (
                        <div key={i} className="space-y-1">
                          <div className="flex justify-between text-[11px] font-black">
                            <span>{h.house}</span>
                            <span className="text-[#D4A017]">{h.points} pts</span>
                          </div>
                          <div className="w-full h-2.5 bg-[#0D2B52] border border-white/10 rounded-full overflow-hidden">
                            <div className={`h-full ${h.color} transition-all duration-300`} style={{ width: `${(h.points / h.max) * 100}%` }}></div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="bg-[#0D2B52] p-4 rounded-xl border border-white/10 flex flex-col justify-between space-y-4">
                      <p className="text-[10px] text-slate-200 leading-relaxed">
                        Demonstrate data flow capability. Click the trigger below to simulate awarding victory points to any house and watch the tallies update on the board dynamically.
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => setHousePoints(prev => ({ ...prev, Agni: prev.Agni + 20 }))}
                          className="py-2 px-1 bg-[#D4A017]/15 hover:bg-[#D4A017] text-[#D4A017] hover:text-[#0D2B52] border border-[#D4A017]/30 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all"
                        >
                          +20 Agni
                        </button>
                        <button
                          onClick={() => setHousePoints(prev => ({ ...prev, Jal: prev.Jal + 20 }))}
                          className="py-2 px-1 bg-[#D4A017]/15 hover:bg-[#D4A017] text-[#D4A017] hover:text-[#0D2B52] border border-[#D4A017]/30 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all"
                        >
                          +20 Jal
                        </button>
                        <button
                          onClick={() => setHousePoints(prev => ({ ...prev, Prithvi: prev.Prithvi + 20 }))}
                          className="py-2 px-1 bg-[#D4A017]/15 hover:bg-[#D4A017] text-[#D4A017] hover:text-[#0D2B52] border border-[#D4A017]/30 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all"
                        >
                          +20 Prithvi
                        </button>
                        <button
                          onClick={() => setHousePoints(prev => ({ ...prev, Vayu: prev.Vayu + 20 }))}
                          className="py-2 px-1 bg-[#D4A017]/15 hover:bg-[#D4A017] text-[#D4A017] hover:text-[#0D2B52] border border-[#D4A017]/30 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all"
                        >
                          +20 Vayu
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 📋 CURRICULUM & BOARD COMPLIANCE MATRIX */}
          <div className="bg-[#F5F7FA] border-4 border-slate-900 rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 space-y-6 relative z-10">
            <div className="space-y-2">
              <h3 className="text-lg md:text-xl font-black uppercase tracking-tight text-[#0D2B52] font-display">
                Pre-Loaded Standards Built for Indian Schools
              </h3>
              <p className="text-xs text-slate-600 font-medium max-w-xl leading-relaxed">
                SmartPE comes pre-configured with national physical education guidelines, saving you hours of manual setup.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
              <div className="p-4 border-2 border-slate-900 rounded-xl bg-white space-y-2">
                <span className="text-[9px] font-black uppercase text-[#0D2B52] tracking-wider">CBSE HPE Strand 1-4</span>
                <h4 className="text-xs font-black uppercase text-[#0D2B52] font-display">Mandatory HPE Policy</h4>
                <p className="text-[10px] text-slate-600 font-medium leading-relaxed">
                  Fully integrates Games/Sports, Health & Fitness, SEWA projects, and health activity card record-keeping.
                </p>
              </div>

              <div className="p-4 border-2 border-slate-900 rounded-xl bg-white space-y-2">
                <span className="text-[9px] font-black uppercase text-[#D4A017] tracking-wider">NEP 2020 Guidelines</span>
                <h4 className="text-xs font-black uppercase text-[#0D2B52] font-display">Sports-Integrated Learning</h4>
                <p className="text-[10px] text-slate-600 font-medium leading-relaxed">
                  Supports active physical movement and games as pedagogical tools, with comprehensive progress summaries.
                </p>
              </div>

              <div className="p-4 border-2 border-slate-900 rounded-xl bg-white space-y-2">
                <span className="text-[9px] font-black uppercase text-emerald-600 tracking-wider">Khelo India SPARKS</span>
                <h4 className="text-xs font-black uppercase text-[#0D2B52] font-display">National Fitness Battery</h4>
                <p className="text-[10px] text-slate-600 font-medium leading-relaxed">
                  Pre-loads fitness batteries for age bands 5-8 (BMI, Coordination) and 9-18 (Speed, Strength, Endurance, Flexibility).
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Dynamic CTA Banner matching Repaint Mockup */}
      <section className="bg-[#0D2B52] text-white rounded-[3rem] p-12 md:p-16 border-4 border-slate-900 shadow-[12px_12px_0px_0px_rgba(13,43,82,1)] relative overflow-hidden">
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-[#D4A017]/10 rounded-full blur-[80px]"></div>
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-[#D4A017]/20 rounded-full blur-[80px]"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 max-w-5xl mx-auto">
          <div className="space-y-4 text-center md:text-left">
            <span className="px-4 py-1 bg-[#D4A017]/20 border border-[#D4A017]/40 text-[#D4A017] rounded-full text-[10px] font-black uppercase tracking-widest inline-block">School-Ready System</span>
            <h3 className="text-3xl md:text-5xl font-black uppercase tracking-tight leading-[1.1] font-display">Get Your PE Department <br className="hidden md:block"/> School-Ready in Minutes.</h3>
            <p className="text-slate-200 text-sm font-semibold uppercase tracking-wider">Join physical education teachers and schools building organized, modern programs.</p>
          </div>
          <div>
            <button 
              onClick={() => onNavigate?.('planner')}
              className="px-10 py-6 bg-[#D4A017] text-[#0D2B52] rounded-2xl font-black text-sm uppercase tracking-widest border-2 border-slate-900 hover:bg-[#e0ab1e] hover:shadow-[4px_4px_0px_0px_rgba(13,43,82,1)] active:scale-95 transition-all flex items-center gap-3 whitespace-nowrap shadow-xl"
            >
              <Sparkles size={20} className="text-[#0D2B52]" />
              <span>Get Started for Free</span>
            </button>
          </div>
        </div>
      </section>

      {/* 🤝 TRUST & SYSTEM PROOF: Why schools Trust smartpeindia */}
      <section className="space-y-16 bg-[#F5F7FA] border-4 border-slate-900 rounded-[3.5rem] p-8 md:p-14 relative overflow-hidden shadow-[12px_12px_0px_0px_rgba(13,43,82,1)]">
        <div className="absolute inset-0 opacity-[0.01] pointer-events-none" style={{ backgroundImage: 'linear-gradient(#0D2B52 1px, transparent 1px), linear-gradient(90deg, #0D2B52 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
        
        <div className="flex flex-col md:flex-row md:items-end justify-between border-b-4 border-slate-900 pb-8 relative z-10">
          <div className="space-y-4">
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#D4A017]">05. TRUST & EVIDENCE</p>
            <h2 className="text-4xl md:text-6xl font-black text-[#0D2B52] tracking-tighter uppercase leading-[0.9] font-display">Why Indian Schools <br/> <span className="text-[#D4A017]">Trust SmartPE.</span></h2>
            <p className="text-sm text-[#333333] font-medium leading-relaxed max-w-xl">
              Learn how physical educators, PE heads, and school principals use SmartPE to run organized, measurable, and engaging sports programs.
            </p>
          </div>
          <div className="mt-4 md:mt-0">
            <span className="px-4 py-2 bg-[#D4A017]/15 border border-[#D4A017]/40 text-[#0D2B52] rounded-full text-xs font-black uppercase tracking-widest inline-flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#D4A017] animate-pulse"></span>
              Verified School Network
            </span>
          </div>
        </div>

        {/* Part 1: Who It Is For (Bento Grid) */}
        <div className="space-y-6">
          <h3 className="text-xs font-black uppercase text-slate-500 tracking-widest text-center">🎯 Tailored Roles & Stakeholders</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: 'PE Teachers', role: 'Daily Operations', benefit: 'Instantly assemble CBSE/NCERT-aligned lesson structures. Eliminate manual spreadsheet preparation and save 5+ hours weekly.', color: 'bg-[#D4A017]/15 text-[#0D2B52]' },
              { title: 'HoDs & Directors', role: 'Department Control', benefit: 'Direct supervisor access. Track student growth trends, coordinate substitute coverage plans, and log sports inventory.', color: 'bg-[#0D2B52]/10 text-[#0D2B52]' },
              { title: 'School Principals', role: 'Governance & Brand', benefit: 'Zero-effort board compliance audits. Access print-ready fitness summaries, medical logs, and official performance stats.', color: 'bg-emerald-500/10 text-emerald-800' },
              { title: 'Board Inspectors', role: 'Policy & Compliance', benefit: 'Auditable record accuracy. Instant validation against CBSE strands, NEP 2020 mandates, and Khelo India criteria.', color: 'bg-[#D4A017]/20 text-[#0D2B52]' },
            ].map((role, idx) => (
              <div key={idx} className="bg-white border-4 border-slate-900 rounded-[2rem] p-6 space-y-4 shadow-[4px_4px_0px_0px_rgba(13,43,82,1)] hover:shadow-[8px_8px_0px_0px_rgba(13,43,82,1)] hover:-translate-y-1 transition-all">
                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${role.color}`}>{role.role}</span>
                <h4 className="text-xl font-black uppercase text-[#0D2B52] font-display pt-2">{role.title}</h4>
                <p className="text-xs text-slate-600 font-medium leading-relaxed">{role.benefit}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Part 2: Interactive Real Output Previews */}
        <div className="space-y-6">
          <h3 className="text-xs font-black uppercase text-slate-500 tracking-widest text-center">📄 Real Product Output Previews</h3>
          <div className="bg-[#0D2B52] border-4 border-slate-900 rounded-[2.5rem] p-6 text-white space-y-6">
            <div className="flex flex-wrap items-center justify-between border-b border-white/10 pb-4 gap-4">
              <div>
                <span className="text-[10px] text-[#D4A017] font-bold uppercase">Click below to review real system deliverables</span>
                <h4 className="text-lg font-black uppercase font-display">Document & Report Previews</h4>
              </div>
              <div className="flex gap-2">
                {[
                  { id: 'lesson', label: '📄 AI Lesson Plan' },
                  { id: 'rubric', label: '📋 CBSE Skill Rubric' },
                  { id: 'report', label: '📊 Student Report' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setSampleOutputTab(tab.id as any)}
                    className={`px-3.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border-2 ${
                      sampleOutputTab === tab.id
                        ? 'bg-[#D4A017] text-[#0D2B52] border-slate-900 shadow-[2px_2px_0px_0px_rgba(13,43,82,1)]'
                        : 'bg-[#091D38] text-slate-300 border-transparent hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Document Sandbox Showcase */}
            <div className="bg-[#091D38] border border-white/10 rounded-2xl p-6 min-h-[250px] flex flex-col justify-between">
              {sampleOutputTab === 'lesson' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-[11px] font-mono border-b border-white/10 pb-2 text-slate-300">
                    <span>DOCUMENT ID: SMP-LP-8427</span>
                    <span>STANDARDS: CBSE HPE STRAND 1 (GAMES)</span>
                  </div>
                  <div className="space-y-2">
                    <h5 className="text-base font-black text-white uppercase font-display">TOPIC: Football Dribbling & Ball Control Basics (Grade 7)</h5>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      <strong>Objectives:</strong> Students will learn ball handling mechanics with inside and outside edges of the foot, maintaining close control within a 10m grid.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs pt-2">
                    <div className="bg-[#0D2B52] p-3 rounded-lg border border-white/10 space-y-1">
                      <span className="text-[#D4A017] font-black uppercase text-[9px]">Warm-Up (10 Mins)</span>
                      <p className="text-[10px] text-slate-300 leading-relaxed">Jogging with dynamic joint circles; slow-paced ball-taps.</p>
                    </div>
                    <div className="bg-[#0D2B52] p-3 rounded-lg border border-white/10 space-y-1">
                      <span className="text-white font-black uppercase text-[9px]">Main Practice (20 Mins)</span>
                      <p className="text-[10px] text-slate-300 leading-relaxed">Slalom dribbling between 6 cones set 1.5m apart. 3 sets each foot.</p>
                    </div>
                    <div className="bg-[#0D2B52] p-3 rounded-lg border border-white/10 space-y-1">
                      <span className="text-emerald-400 font-black uppercase text-[9px]">Cool-down (10 Mins)</span>
                      <p className="text-[10px] text-slate-300 leading-relaxed">Lower back static stretches; peer feedback & score logging.</p>
                    </div>
                  </div>
                </div>
              )}

              {sampleOutputTab === 'rubric' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-[11px] font-mono border-b border-white/10 pb-2 text-slate-300">
                    <span>RUBRIC ID: SMP-RB-9941</span>
                    <span>CURRICULUM ALIGNED: HIGH SCHOOL PRACTICAL EXAM</span>
                  </div>
                  <div className="space-y-1">
                    <h5 className="text-base font-black text-white uppercase font-display">CBSE Physical Education Rubric: Basketball (Class 12)</h5>
                    <p className="text-xs text-slate-300">Certified practical grading parameters distributed across customized student skills.</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-[10px] border-collapse">
                      <thead>
                        <tr className="text-slate-400 font-black uppercase border-b border-white/10 pb-1">
                          <th>Parameter Checked</th>
                          <th>Excellent (4-5 pts)</th>
                          <th>Proficient (2-3 pts)</th>
                          <th>Beginner (0-1 pts)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-slate-200">
                        <tr>
                          <td className="py-2 font-black text-white">Ball Handling</td>
                          <td className="py-2">Clean finger-tip control, eyes up, fluid speed changes.</td>
                          <td className="py-2">Palms ball occasionally, eyes glued to the court.</td>
                          <td className="py-2">Loses control frequently, cannot dribble in motion.</td>
                        </tr>
                        <tr>
                          <td className="py-2 font-black text-white">Shooting Form</td>
                          <td className="py-2">Perfect elbow tuck, high release angle, smooth wrist snap.</td>
                          <td className="py-2">Inconsistent guide-hand usage, flat ball arc.</td>
                          <td className="py-2">Pushes ball from chest, lacks lower-body integration.</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {sampleOutputTab === 'report' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-[11px] font-mono border-b border-white/10 pb-2 text-slate-300">
                    <span>REPORT ID: SMP-REP-003</span>
                    <span>STUDENT CARD: INDIVIDUAL KHELO INDIA PROFILE</span>
                  </div>
                  <div className="flex items-center gap-4 bg-[#0D2B52] p-3 rounded-xl border border-white/10">
                    <div className="w-10 h-10 rounded-full bg-[#D4A017] text-[#0D2B52] flex items-center justify-center font-black text-xs uppercase font-display">KD</div>
                    <div>
                      <h5 className="text-sm font-black text-white uppercase font-display">Student: Kabir Dutt (Class 8-A, Roll 12)</h5>
                      <p className="text-[10px] text-slate-300">Academic Year: 2026-27 &bull; Verified via SmartPE</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="p-2.5 bg-[#0D2B52] border border-white/10 rounded-lg">
                      <span className="text-slate-400 font-black text-[9px] uppercase">Baseline (July)</span>
                      <p className="text-sm font-black text-slate-200 mt-1">Sit & Reach: 14 cm</p>
                      <p className="text-[10px] text-[#D4A017] font-bold">BMI Zone: Above recommended</p>
                    </div>
                    <div className="p-2.5 bg-[#0D2B52] border border-white/10 rounded-lg">
                      <span className="text-slate-400 font-black text-[9px] uppercase">Midline (Nov)</span>
                      <p className="text-sm font-black text-slate-200 mt-1">Sit & Reach: 16.5 cm</p>
                      <p className="text-[10px] text-emerald-400 font-bold">BMI Zone: Over recommended</p>
                    </div>
                    <div className="p-2.5 bg-[#10B981]/10 border border-emerald-500/20 rounded-lg">
                      <span className="text-emerald-400 font-black text-[9px] uppercase">Year-End (March)</span>
                      <p className="text-sm font-black text-white mt-1">Sit & Reach: 19.2 cm</p>
                      <p className="text-[10px] text-emerald-400 font-bold">BMI Zone: Healthy BMI ✓</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Part 3: Genuine Pilot Program & Educator Feedback */}
        <div className="space-y-4 pt-4 border-t-2 border-dashed border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs font-black uppercase tracking-wider text-slate-700">Genuine Pilot Feedback & Field Testing</span>
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Early Adopter Pilot Cohort</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
            {[
              { 
                quote: "SmartPE was built directly from our staffroom pain points: calculating Khelo India battery percentiles, generating NEP 2020 lesson plans, and organizing student medical files. Taking hours of repetitive paperwork down to seconds lets coaches stay where they belong — on the field with students.", 
                author: "L. Samy (B.P.E.S, M.P.Ed, M.Phil)", 
                role: "Founder & Physical Education Lead",
                affiliation: "Field Practitioner & 15+ Years PE Veteran" 
              },
              { 
                quote: "During our pilot testing across Grades 1 through 10, having physical literacy benchmarks, automated assessment matrices, and printable CBSE award sheets unified our department records. It eliminated all messy spreadsheet errors.", 
                author: "Physical Education Department Lead", 
                role: "CBSE & ICSE Pilot Program Evaluator",
                affiliation: "Multi-Grade Pilot Testing Cohort" 
              },
              { 
                quote: "The voice skill scorer and age-category progressive skill matrices (U-11 to U-17) made player evaluations during team trials completely frictionless. Parents love receiving clean, transparent printable progress cards.", 
                author: "Senior Grassroots Sports Coach", 
                role: "Youth Athletics & Football Program Pilot",
                affiliation: "Grassroots Sports Coaching Partner" 
              },
            ].map((testimonial, idx) => (
              <div key={idx} className="bg-white border-4 border-slate-900 rounded-[2rem] p-6 space-y-4 flex flex-col justify-between shadow-[4px_4px_0px_0px_rgba(13,43,82,1)]">
                <p className="text-xs text-slate-600 font-semibold italic leading-relaxed">
                  "{testimonial.quote}"
                </p>
                <div className="pt-3 border-t border-slate-200">
                  <p className="text-xs font-black uppercase text-[#0D2B52] font-display">{testimonial.author}</p>
                  <p className="text-[11px] font-bold text-slate-700">{testimonial.role}</p>
                  <p className="text-[10px] font-bold text-[#D4A017] uppercase tracking-wider mt-0.5">{testimonial.affiliation}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Recent Activity / History */}
      <section className="max-w-4xl mx-auto">
        <div className="space-y-10">
          <div className="flex items-center justify-between border-b-4 border-slate-900 pb-6">
            <h3 className="text-4xl font-black uppercase tracking-tight text-[#0D2B52] font-display">Recent Activity</h3>
            <button className="text-[10px] font-black uppercase tracking-[0.3em] text-[#0D2B52] hover:text-[#164077]">Audit Log</button>
          </div>
          
          <div className="space-y-6">
            {history.length === 0 ? (
              <div className="p-20 bg-white rounded-[3rem] border-4 border-slate-900 border-dashed text-center">
                <Clock className="mx-auto text-slate-300 mb-6" size={64} />
                <p className="text-slate-400 font-black text-xl uppercase tracking-tight font-display">No activity recorded</p>
              </div>
            ) : (
              <AnimatePresence>
                {history.slice(0, 5).map((item) => (
                  <motion.div 
                    key={item.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    onClick={() => {
                      if (item.type === 'Lesson Plan') onNavigate?.('planner');
                      if (item.type === 'Theory') onNavigate?.('theory');
                      if (item.type === 'Skill') onNavigate?.('skillmastery');
                      if (item.type === 'Tool') onNavigate?.('fitness');
                    }}
                    className="group bg-white p-8 rounded-[2rem] border-4 border-slate-900 hover:shadow-[12px_12px_0px_0px_rgba(13,43,82,0.2)] transition-all cursor-pointer flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-8">
                      <div className="p-5 bg-[#0D2B52] text-[#D4A017] rounded-2xl transition-colors">
                        {getIcon(item.type)}
                      </div>
                      <div>
                        <p className="text-xl font-black text-[#0D2B52] uppercase tracking-tight font-display">{item.title}</p>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                          {item.type === 'TestPaper' ? 'Question Paper (CBSE)' : item.type}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-6">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-[#0D2B52] transition-colors">Open Resource</span>
                      <button 
                        onClick={(e) => handleDelete(item.id, e)}
                        className="p-4 text-slate-300 hover:text-white hover:bg-[#0D2B52] rounded-2xl transition-all opacity-0 group-hover:opacity-100 border-2 border-transparent hover:border-slate-900"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
    