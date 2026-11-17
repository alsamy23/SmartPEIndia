import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  Sparkles, 
  Plus, 
  X, 
  Check, 
  Printer, 
  Download, 
  FileText, 
  Users, 
  AlertCircle,
  HelpCircle,
  User,
  Activity,
  Dumbbell,
  Compass,
  Loader2
} from 'lucide-react';
import { trackEvent } from '../services/analytics.ts';
import { toast } from '../services/toast.ts';
import { callAIBase } from '../services/geminiService.ts';
import { exportToWord } from '../lib/exportUtils.ts';
import { motion, AnimatePresence } from 'motion/react';

// Re-use same type interface for workloads
interface Workload {
  id: string;
  teacherId: string;
  teacherName: string;
  curriculum: string;
  termsCount: number;
  periodsCount: number;
  assignedGrades: string;
  primaryGames: string[];
  timetableText?: string;
  schedules?: {
    period: number;
    game: string;
    skill: string;
    objective: string;
    duration: string;
    details: {
      warmup: string;
      mainDrill: string;
      cooldown: string;
    }
  }[];
}

interface ParsedSlot {
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  periodNum: number;
  className: string;
  game: string;
  skill: string;
  objective: string;
  duration: string;
  isFallback?: boolean;
  details: {
    warmup: string;
    mainDrill: string;
    cooldown: string;
  };
}

const DEFAULT_WORKLOADS: Workload[] = [
  {
    id: 'workload_1',
    teacherId: 'teacher_1',
    teacherName: 'Coach Suresh Kumar',
    curriculum: 'CBSE',
    termsCount: 2,
    periodsCount: 2,
    assignedGrades: 'Grades 9-10',
    primaryGames: ['Volleyball', 'Athletics'],
    timetableText: 'Monday Period 2: Class 9A, Wednesday Period 4: Class 10B',
    schedules: [
      {
        period: 1,
        game: 'Volleyball',
        skill: 'Underhand Pass & Reception',
        objective: 'Mastering the forearm passing technique for steady receptions',
        duration: '45 mins',
        details: {
          warmup: 'Jogging and dynamic shoulder-stretching dynamic rotation loops (10 min)',
          mainDrill: 'Forearm pass partner drills and distance bump repetitions (25 min)',
          cooldown: 'Trunk twists, static side shoulder stretches (10 min)'
        }
      },
      {
        period: 2,
        game: 'Athletics',
        skill: 'Crouch Start & Reaction speed',
        objective: 'Develop quick explosive reactions using standard blocks starts',
        duration: '45 mins',
        details: {
          warmup: 'High knees and butt kicks with leg swings (10 min)',
          mainDrill: '3-point crouching starts with 15m explosive sprint releases (25 min)',
          cooldown: 'Slo-mo recovery walk, hamstring static holds (10 min)'
        }
      }
    ]
  },
  {
    id: 'workload_2',
    teacherId: 'teacher_2',
    teacherName: 'Coach Priya Sharma',
    curriculum: 'ICSE',
    termsCount: 3,
    periodsCount: 3,
    assignedGrades: 'Grades 11-12',
    primaryGames: ['Basketball', 'Yoga'],
    timetableText: 'Tuesday Period 1: Class 11S1, Thursday Period 3: Class 12C2, Friday Period 5: Class 11C1',
    schedules: [
      {
        period: 1,
        game: 'Basketball',
        skill: 'Chest Pass & Lead Pass',
        objective: 'Improving pass velocity and movement integration to receiving teammate',
        duration: '40 mins',
        details: {
          warmup: 'Defensive slide runs and shuttle bursts (8 min)',
          mainDrill: '3-player weave pass routing down the length ofcourt (22 min)',
          cooldown: 'Arm swings and deep floor reaches (10 min)'
        }
      },
      {
        period: 2,
        game: 'Yoga',
        skill: 'Surya Namaskar Form',
        objective: 'Align sequence poses with controlled inhalation and exhalation rhythm',
        duration: '40 mins',
        details: {
          warmup: 'Gentle spinal twists and neck releases (8 min)',
          mainDrill: '12-pose Surya Namaskar continuous repetitions with focus points (22 min)',
          cooldown: 'Shavasana silent meditative observation (10 min)'
        }
      },
      {
        period: 3,
        game: 'Basketball',
        skill: 'Lay-up Steps Coordination',
        objective: 'Learn high-speed dual foot steps transition into dynamic board releases',
        duration: '40 mins',
        details: {
          warmup: 'Single-leg hops and dynamic ankle rotations (8 min)',
          mainDrill: 'Dribble, two-step layup approach using left/right boards (22 min)',
          cooldown: 'Anterior thigh stretches (10 min)'
        }
      }
    ]
  }
];

const WEEKDAYS: ParsedSlot['day'][] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const PERIOD_ROWS = [1, 2, 3, 4, 5];

export const WeeklyCalendarView: React.FC = () => {
  const [workloads, setWorkloads] = useState<Workload[]>([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('workload_1');
  const [selectedSlot, setSelectedSlot] = useState<ParsedSlot | null>(null);
  const [generatingSlotKey, setGeneratingSlotKey] = useState<string | null>(null);
  
  // Custom slots addition modal/form state
  const [isAddingSlot, setIsAddingSlot] = useState(false);
  const [slotDay, setSlotDay] = useState<ParsedSlot['day']>('Monday');
  const [slotPeriod, setSlotPeriod] = useState<number>(1);
  const [slotClass, setSlotClass] = useState<string>('Class 9A');
  const [slotGame, setSlotGame] = useState<string>('Football');
  const [slotSkill, setSlotSkill] = useState<string>('Dribbling & Ball control');
  const [slotObjective, setSlotObjective] = useState<string>('Develop agility and space-awareness');
  const [slotDuration, setSlotDuration] = useState<string>('45 mins');
  const [customWarmup, setCustomWarmup] = useState<string>('Jogging, high-knees, and ankle dynamic stretches (10 min)');
  const [customDrill, setCustomDrill] = useState<string>('Zigzag dribbling through cones, small space pass reps (25 min)');
  const [customCooldown, setCustomCooldown] = useState<string>('Slo-mo walks, standing quadricep stretches (10 min)');

  const [notification, setNotification] = useState<string | null>(null);

  // Load workloads on mount & check localStorage
  useEffect(() => {
    const saved = localStorage.getItem('smartpe_workloads');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.length > 0) {
          setWorkloads(parsed);
          setSelectedTeacherId(parsed[0].id);
          return;
        }
      } catch (e) {
        console.error("Failed to parse workloads", e);
      }
    }
    setWorkloads(DEFAULT_WORKLOADS);
    setSelectedTeacherId('workload_1');
    localStorage.setItem('smartpe_workloads', JSON.stringify(DEFAULT_WORKLOADS));
  }, []);

  // Sync state between tabs and on focus/custom workload updates
  useEffect(() => {
    const handleSync = () => {
      const saved = localStorage.getItem('smartpe_workloads');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.length > 0) {
            setWorkloads(parsed);
          }
        } catch (e) {
          console.error("Failed to sync workloads", e);
        }
      }
    };
    window.addEventListener('storage', handleSync);
    window.addEventListener('focus', handleSync);
    window.addEventListener('smartpe_workloads_updated', handleSync);
    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('focus', handleSync);
      window.removeEventListener('smartpe_workloads_updated', handleSync);
    };
  }, []);

  const activeTeacher = workloads.find(w => w.id === selectedTeacherId) || workloads[0] || DEFAULT_WORKLOADS[0];

  // Helper parser
  const parseTimetable = (w: Workload): ParsedSlot[] => {
    if (!w) return [];
    const result: ParsedSlot[] = [];
    const text = w.timetableText || '';
    const schedules = w.schedules || [];
    
    const parts = text.split(',').map(p => p.trim()).filter(Boolean);
    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    
    parts.forEach((part, index) => {
      let detectedDay: ParsedSlot['day'] = 'Monday';
      for (const d of daysOfWeek) {
        if (part.toLowerCase().includes(d.toLowerCase())) {
          detectedDay = d as ParsedSlot['day'];
          break;
        }
      }
      
      let periodNum = index + 1;
      const periodMatch = part.match(/(?:period|p)\s*(\d+)/i);
      if (periodMatch) {
        periodNum = parseInt(periodMatch[1], 10);
      }
      
      let className = 'Class General';
      const classMatch = part.match(/(?:class|gr|grade)\s*([0-9a-zA-Z\-]+)/i);
      if (classMatch) {
        className = `Class ${classMatch[1].toUpperCase()}`;
      } else {
        const colonIndex = part.indexOf(':');
        if (colonIndex !== -1) {
          className = part.substring(colonIndex + 1).trim();
        }
      }
      
      const hasRealSchedule = !!schedules.find(s => s.period === periodNum);
      const schedule = schedules.find(s => s.period === periodNum) || schedules[index] || {
        period: periodNum,
        game: w.primaryGames[index % w.primaryGames.length] || 'Physical Agility',
        skill: 'Dynamic Coordination & Speed',
        objective: `Syllabus aligned Physical activities for ${className}`,
        duration: '45 mins',
        details: {
          warmup: '10 mins dynamic range drills: shoulder extensions, leg rotations and warm hikes.',
          mainDrill: '25 mins core activity tracks: Practice passing, game dynamics, and teamwork.',
          cooldown: '10 mins restoration: static posture extension holds and recovery breaths.'
        }
      };
      
      result.push({
        day: detectedDay,
        periodNum: periodNum,
        className: className,
        game: schedule.game,
        skill: schedule.skill,
        objective: schedule.objective,
        duration: schedule.duration || '45 mins',
        isFallback: !hasRealSchedule,
        details: schedule.details
      });
    });
    
    return result;
  };

  const currentSlots = parseTimetable(activeTeacher);

  // Single slot instant AI generation
  const handleGenerateSingleSlot = async (day: string, periodNum: number, className: string, game: string) => {
    const slotKey = `${day}_${periodNum}`;
    setGeneratingSlotKey(slotKey);
    setNotification(`Generating customized PE Lesson for ${className} (${game})...`);

    const prompt = `You are an expert Physical Education teacher.
Generate a highly descriptive lesson plan for:
Day: ${day}
Period: ${periodNum}
Class: ${className}
Game/Sport: ${game}
Curriculum context: CBSE and National Physical Education Framework.

Return exactly a valid JSON object matching this structure (no markdown envelopes):
{
  "period": ${periodNum},
  "game": "${game}",
  "skill": "Write specific skill target (e.g., Volleyball Overhand Serve, Football Passing)",
  "objective": "Clear educational physical development objective",
  "duration": "45 mins",
  "details": {
    "warmup": "Actionable warmup steps and dynamic stretches (10 mins)",
    "mainDrill": "Core drills, team formations, and interactive game guidelines (25 mins)",
    "cooldown": "Slowing down steps, static posture alignment and breathing cycles (10 mins)"
  }
}`;

    try {
      const resJson = await callAIBase({
        model: 'gemini-3.1-flash-lite',
        contents: prompt
      }, 1);

      const text = resJson?.text || '';
      if (!text) {
        throw new Error('AI Engine returned empty response.');
      }

      const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsedPlan = JSON.parse(cleanText);

      // Save into workloads
      setWorkloads(prev => {
        const next = prev.map(w => {
          if (w.id === activeTeacher.id) {
            const currentSchedules = w.schedules || [];
            const filtered = currentSchedules.filter(s => s.period !== periodNum);
            return {
              ...w,
              schedules: [...filtered, parsedPlan]
            };
          }
          return w;
        });
        localStorage.setItem('smartpe_workloads', JSON.stringify(next));
        return next;
      });

      setNotification(`Successfully created professional AI Lesson Plan for ${game}!`);
    } catch (e) {
      console.warn("Falling back to local high-fidelity generator", e);
      
      const fallbackTemplates: Record<string, any> = {
        Football: {
          skill: 'Inside Foot Passing & Receiving',
          objective: 'Develop precision inside-foot pass execution and body orientation positioning on receipt',
          warmup: '10 min light dribble laps + ankle dynamic circles, lateral slides, and quick knee extensions.',
          mainDrill: '25 min teammate wall passing, zigzag cones speed receiving, and 5v5 target gate control play.',
          cooldown: '10 min slow walk cooldown, deep leg static holds and light chest stretches.'
        },
        Volleyball: {
          skill: 'Underhand Bump Pass Reception',
          objective: 'Establish correct forearm platform posture for steady, controlled ball receptions',
          warmup: '10 min continuous shuffling, shoulder rotation loops, and wrist static activation.',
          mainDrill: '25 min partner distance bumps, target basket passing drill, and high-repetition underhand serves receiving.',
          cooldown: '10 min static neck releases, shoulder extensions, and progressive breathing exercises.'
        },
        Basketball: {
          skill: 'Two-Handed Chest Pass Precision',
          objective: 'Build high-velocity chest passing with quick thumbs-down follow-through release',
          warmup: '10 min linear shuttle runs, fingertip ball taps, and explosive calf jumps.',
          mainDrill: '25 min chest pass partner lines, three-man weave drills down length of the court, and active defender scenarios.',
          cooldown: '10 min deep torso stretches, arm curls, and easy recovery pacing.'
        },
        Yoga: {
          skill: 'Sun Salutation (Surya Namaskar) Flow',
          objective: 'Align sequence poses with smooth inhalation and exhalation diaphragmatic cycles',
          warmup: '10 min gentle spinal rotation, neck flexion, and shoulder blade decompression.',
          mainDrill: '25 min practicing 12 key poses of Surya Namaskar with focused adjustments and alignment pauses.',
          cooldown: '10 min progressive Shavasana silent breathing, body scans, and ambient quietude.'
        }
      };

      const gameClean = game.trim();
      const matched = fallbackTemplates[gameClean] || {
        skill: `${game} Dynamic Drills & Coordination`,
        objective: `Promote high motor integration, focus, and core strength using standard ${game} exercises`,
        warmup: '10 min progressive full-body aerobic warmup, hip openers, and light sprints.',
        mainDrill: '25 min core athletic agility drill ladders, team relay races, and structured game positioning.',
        cooldown: '10 min light restoration stretches, deep breathing cycles, and progress review.'
      };

      const localPlan = {
        period: periodNum,
        game: game,
        skill: matched.skill,
        objective: matched.objective,
        duration: '45 mins',
        details: {
          warmup: matched.warmup,
          mainDrill: matched.mainDrill,
          cooldown: matched.cooldown
        }
      };

      setWorkloads(prev => {
        const next = prev.map(w => {
          if (w.id === activeTeacher.id) {
            const currentSchedules = w.schedules || [];
            const filtered = currentSchedules.filter(s => s.period !== periodNum);
            return {
              ...w,
              schedules: [...filtered, localPlan]
            };
          }
          return w;
        });
        localStorage.setItem('smartpe_workloads', JSON.stringify(next));
        return next;
      });

      setNotification(`Lesson Plan prepared: customized ${game} blueprint ready!`);
    } finally {
      setGeneratingSlotKey(null);
      setTimeout(() => setNotification(null), 4000);
    }
  };

  // Generate all pending (needs preparation) slots sequentially
  const handleGenerateAllPending = async () => {
    const pending = currentSlots.filter(s => s.isFallback);
    if (pending.length === 0) {
      setNotification("All upcoming slots have prepared lesson plans!");
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    setNotification(`Starting batch AI compilation for ${pending.length} pending lessons...`);
    for (const slot of pending) {
      await handleGenerateSingleSlot(slot.day, slot.periodNum, slot.className, slot.game);
    }
    setNotification("All pending workload periods successfully prepared!");
  };

  // Save new custom lesson slot directly
  const handleAddSlotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTeacher) return;

    const newTimetableEntry = `${slotDay} Period ${slotPeriod}: ${slotClass}`;
    const newStructuredSchedule = {
      period: slotPeriod,
      game: slotGame,
      skill: slotSkill,
      objective: slotObjective,
      duration: slotDuration,
      details: {
        warmup: customWarmup,
        mainDrill: customDrill,
        cooldown: customCooldown
      }
    };

    const updatedWorkloads = workloads.map(w => {
      if (w.id === activeTeacher.id) {
        const currentTimetableText = w.timetableText || '';
        const updatedTimetableText = currentTimetableText 
          ? `${currentTimetableText}, ${newTimetableEntry}`
          : newTimetableEntry;
        const currentSchedules = w.schedules || [];
        const filteredSchedules = currentSchedules.filter(s => s.period !== slotPeriod);
        
        return {
          ...w,
          timetableText: updatedTimetableText,
          schedules: [...filteredSchedules, newStructuredSchedule],
          periodsCount: w.periodsCount + 1
        };
      }
      return w;
    });

    setWorkloads(updatedWorkloads);
    localStorage.setItem('smartpe_workloads', JSON.stringify(updatedWorkloads));
    setIsAddingSlot(false);

    setNotification(`Successfully added ${slotGame} slot to ${slotDay} Period ${slotPeriod}!`);
    setTimeout(() => setNotification(null), 4000);
  };

  const handlePrint = () => {
    window.print();
  };

  const findActiveSlot = (day: ParsedSlot['day'], period: number): ParsedSlot | undefined => {
    return currentSlots.find(s => s.day === day && s.periodNum === period);
  };

  const fallbackCount = currentSlots.filter(s => s.isFallback).length;

  return (
    <div className="bg-white border-4 border-slate-900 rounded-[2.5rem] p-6 md:p-8 shadow-[12px_12px_0px_0px_rgba(15,23,42,1)] space-y-8 print:border-none print:shadow-none print:p-0">
      
      {/* Top action header bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b-4 border-slate-900 pb-6 print:border-b-2">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="p-1 px-2.5 bg-indigo-100 text-indigo-700 rounded-lg text-[9px] font-black uppercase tracking-widest">
              Live School Timetable Tracker
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight uppercase flex items-center gap-2">
            <Calendar className="text-[#FF6B00]" size={28} />
            <span>Weekly PE Lesson View</span>
          </h2>
          <p className="text-slate-400 text-[11px] md:text-xs font-semibold leading-none">
            Interact with teachers' custom curriculum slots & expand dynamically generated AI lessons.
          </p>
        </div>

        {/* Filters and buttons */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto print:hidden">
          {/* Select filter */}
          <div className="flex items-center space-x-2 bg-slate-50 border-2 border-slate-900 px-3 py-2 rounded-xl">
            <User size={14} className="text-slate-400" />
            <select
              value={selectedTeacherId}
              onChange={(e) => setSelectedTeacherId(e.target.value)}
              className="bg-transparent text-xs font-black uppercase tracking-wider text-slate-800 focus:outline-none cursor-pointer"
            >
              {workloads.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.teacherName} ({w.curriculum})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => {
              setSlotDay('Monday');
              setSlotPeriod(1);
              setIsAddingSlot(true);
            }}
            className="p-3 bg-[#FF6B00] text-white rounded-xl text-xs font-black uppercase tracking-widest border-2 border-slate-900 hover:bg-orange-600 transition-colors shadow-sm flex items-center gap-1.5"
          >
            <Plus size={14} />
            <span>Add Slot</span>
          </button>

          <button
            onClick={handlePrint}
            className="p-3 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-colors shadow-sm flex items-center gap-1.5"
            title="Print Schedule"
          >
            <Printer size={14} />
            <span className="hidden sm:inline">Print</span>
          </button>
        </div>
      </div>

      {/* Flagged Upcoming Weekly Periods Alert Notification Box */}
      <AnimatePresence>
        {fallbackCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-amber-50 border-4 border-slate-900 rounded-[1.5rem] bg-amber-50/70 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-left"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-100 text-amber-800 rounded-xl">
                <AlertCircle size={20} className="animate-bounce" />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-xs font-black text-amber-950 uppercase tracking-wider">Lesson Preparation Required</h4>
                <p className="text-[11px] text-slate-650 font-semibold leading-relaxed">
                  You have <span className="text-[#FF6B00] font-black">{fallbackCount} pending periods</span> this week without configured PE lesson plans. Tap the blinking <span className="bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded text-[9px] uppercase font-black">Due Soon</span> badges on your timetable to prepare plans with AI output instantly.
                </p>
              </div>
            </div>
            <button
              onClick={handleGenerateAllPending}
              className="p-2.5 px-4 bg-slate-900 text-white hover:bg-slate-800 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors flex items-center gap-1.5 w-full md:w-auto justify-center whitespace-nowrap"
            >
              <Sparkles size={11} className="text-amber-400" />
              <span>Auto-Generate All ({fallbackCount})</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success notification toast */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 border-4 border-slate-900 rounded-2xl bg-indigo-50 text-indigo-950 flex items-center gap-2 font-black text-xs"
          >
            <Sparkles size={18} className="text-indigo-600 animate-pulse" />
            <span>{notification}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grid Content Calendar Board */}
      <div className="overflow-x-auto select-none border-2 border-slate-200 rounded-2xl">
        <table className="w-full min-w-[750px] border-collapse bg-slate-50/50">
          <thead>
            <tr className="bg-slate-900 text-white">
              <th className="p-4 border-r border-slate-800 text-left text-xs font-black uppercase tracking-widest w-24">
                Periods
              </th>
              {WEEKDAYS.map(day => (
                <th key={day} className="p-4 text-center text-xs font-black uppercase tracking-widest border-r border-slate-800 last:border-r-0">
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PERIOD_ROWS.map((period) => (
              <tr key={period} className="border-b border-slate-200 last:border-b-0 hover:bg-slate-50/50 transition-colors">
                <td className="p-4 border-r border-slate-200 bg-white font-bold align-middle">
                  <div className="flex flex-col items-start">
                    <span className="text-xs font-black text-slate-800 uppercase tracking-wider">P. {period}</span>
                    <span className="text-[9px] text-slate-400 font-bold tracking-tight">
                      {period === 1 ? '08:30 AM' : period === 2 ? '09:30 AM' : period === 3 ? '10:45 AM' : period === 4 ? '11:45 AM' : '01:45 PM'}
                    </span>
                  </div>
                </td>

                {WEEKDAYS.map((day) => {
                  const slot = findActiveSlot(day, period);
                  const isGenerating = generatingSlotKey === `${day}_${period}`;
                  
                  return (
                    <td 
                      key={day} 
                      className="p-3 border-r border-slate-200 last:border-r-0 align-top h-36 w-[18%]"
                    >
                      {slot ? (
                        <div 
                          onClick={() => setSelectedSlot(slot)}
                          className={`h-full border-2 rounded-xl p-3 cursor-pointer transition-all flex flex-col justify-between hover:shadow-md hover:-translate-y-0.5 ${
                            isGenerating 
                              ? 'bg-slate-100 border-indigo-400 animate-pulse' 
                              : slot.isFallback 
                                ? 'bg-amber-50/30 border-amber-200 hover:border-[#FF6B00] hover:bg-amber-50/65' 
                                : 'bg-indigo-50/65 border-indigo-200 hover:border-[#FF6B00] hover:bg-white'
                          }`}
                        >
                          <div className="space-y-1.5">
                            <div className="flex justify-between items-start gap-1">
                              <span className="px-1.5 py-0.5 bg-indigo-600/10 text-indigo-700 text-[8px] font-black uppercase tracking-widest rounded">
                                {slot.className}
                              </span>
                              
                              {isGenerating ? (
                                <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-700 text-[8px] font-black uppercase tracking-widest rounded flex items-center gap-0.5">
                                  <Loader2 size={10} className="animate-spin text-indigo-600" />
                                  <span>AI Flow</span>
                                </span>
                              ) : slot.isFallback ? (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleGenerateSingleSlot(day, slot.periodNum, slot.className, slot.game);
                                  }}
                                  className="px-1.5 py-0.5 bg-amber-100 ring-2 ring-amber-400 hover:ring-[#FF6B00] hover:bg-amber-200 text-amber-800 text-[8px] font-black uppercase tracking-widest rounded flex items-center gap-0.5 animate-pulse transition-all active:scale-90"
                                  title="Plan due soon! Click to generate lesson with AI"
                                >
                                  <AlertCircle size={8} className="text-amber-600" />
                                  <span>Due Soon</span>
                                </button>
                              ) : (
                                <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 text-[8px] font-black uppercase tracking-widest rounded leading-none">
                                  Ready
                                </span>
                              )}
                            </div>
                            <h4 className="text-xs font-black text-slate-800 uppercase truncate leading-tight mt-1" title={slot.game}>
                              {slot.game}
                            </h4>
                            <p className="text-[10px] text-slate-500 font-medium line-clamp-2 leading-snug">
                              {slot.skill}
                            </p>
                          </div>

                          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[9px] font-bold text-[#FF6B00] uppercase tracking-wider">
                            <span className="flex items-center gap-1">
                              <Sparkles size={8} className={isGenerating ? "animate-spin" : "animate-pulse"} />
                              {slot.isFallback ? 'Auto-Plan' : 'View Plan'}
                            </span>
                            <span className="text-[8px] text-slate-400 font-black">P. {slot.periodNum}</span>
                          </div>
                        </div>
                      ) : (
                        <div 
                          onClick={() => {
                            setSlotDay(day);
                            setSlotPeriod(period);
                            setIsAddingSlot(true);
                          }}
                          className="h-full border border-dashed border-slate-200 bg-white rounded-xl p-3 flex flex-col items-center justify-center text-slate-300 hover:text-[#FF6B00] hover:border-[#FF6B00] group cursor-pointer transition-all"
                        >
                          <Plus size={16} className="mb-1 group-hover:scale-110 transition-transform" />
                          <span className="text-[9px] font-black uppercase tracking-wider">Empty Slot</span>
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Instructions card */}
      <div className="p-4 bg-slate-50 border-2 border-slate-900 border-dashed rounded-2xl flex items-start gap-3">
        <Compass className="text-[#005BFF] flex-shrink-0 mt-0.5" size={18} />
        <div>
          <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest block">Educational Tip</span>
          <p className="text-[11px] text-slate-600 font-bold leading-normal">
            To generate AI lessons automatically for all empty workload periods, navigate to the <span className="text-[#FF6B00] underline cursor-pointer font-black" onClick={() => window.scrollTo({ top: 300, behavior: 'smooth' })}>Workload & Timetable Planner tab</span>. You can also click any empty block directly to register custom lesson plans instantly.
          </p>
        </div>
      </div>

      {/* Lesson Details Drawer / Modal Popup */}
      <AnimatePresence>
        {selectedSlot && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm print:relative print:z-0 print:p-0 print:bg-transparent">
            {/* Backdrop close */}
            <div className="absolute inset-0" onClick={() => setSelectedSlot(null)} />
            
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border-4 border-slate-900 rounded-[2.5rem] w-full max-w-2xl p-6 md:p-8 shadow-2xl relative z-10 overflow-y-auto max-h-[85vh] text-left print:border-none print:shadow-none print:p-0"
            >
              {/* Header */}
              <div className="flex justify-between items-start border-b border-slate-200 pb-4 mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="px-2.5 py-0.5 bg-[#FF6B00]/15 text-[#FF6B05] text-[9px] font-black uppercase tracking-widest rounded-lg">
                      {selectedSlot.day} • Period {selectedSlot.periodNum} Allotment
                    </span>
                    <span className="text-slate-400 text-xs font-medium">({selectedSlot.duration})</span>
                  </div>
                  <h3 className="text-xl md:text-2xl font-black text-slate-900 uppercase tracking-tight">
                    {selectedSlot.game} &mdash; {selectedSlot.className}
                  </h3>
                  <p className="text-xs text-indigo-600 font-black uppercase tracking-wider">{selectedSlot.skill}</p>
                </div>
                <button
                  onClick={() => setSelectedSlot(null)}
                  className="p-1 px-1.5 text-slate-400 hover:text-slate-950 rounded-xl transition-colors print:hidden"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Lesson body details */}
              <div className="space-y-6">
                <div>
                  <span className="text-[10px] font-black text-slate-450 uppercase tracking-widest block mb-1">Lesson Objective</span>
                  <p className="text-xs text-slate-700 font-bold leading-relaxed">{selectedSlot.objective}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-100">
                  <div className="p-4 bg-rose-50/50 border border-rose-100 rounded-2xl space-y-1">
                    <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest block">Warm-Up (10m)</span>
                    <p className="text-[11px] text-slate-650 font-medium leading-relaxed">{selectedSlot.details.warmup}</p>
                  </div>

                  <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl space-y-1">
                    <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest block">Main Activity Track (25m)</span>
                    <p className="text-[11px] text-slate-650 font-medium leading-relaxed">{selectedSlot.details.mainDrill}</p>
                  </div>

                  <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl space-y-1">
                    <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest block">Cooldown & Clean (10m)</span>
                    <p className="text-[11px] text-slate-650 font-medium leading-relaxed">{selectedSlot.details.cooldown}</p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-slate-150 print:hidden">
                <button
                  onClick={() => {
                    if (!selectedSlot) return;
                    const html = `
                      <html>
                        <head><meta charset="utf-8"><title>${selectedSlot.game} Lesson Plan</title></head>
                        <body style="font-family: Arial, sans-serif; padding: 24px; color: #0f172a;">
                          <h1 style="margin-bottom: 4px;">${selectedSlot.game} &mdash; ${selectedSlot.className}</h1>
                          <p style="color: #4f46e5; font-weight: bold; margin-top: 0;">${selectedSlot.skill}</p>
                          <p><strong>Schedule:</strong> ${selectedSlot.day} &bull; Period ${selectedSlot.periodNum} (${selectedSlot.duration})</p>
                          <hr />
                          <h3>Lesson Objective</h3>
                          <p>${selectedSlot.objective}</p>
                          <h3>Warm-Up (10 mins)</h3>
                          <p>${selectedSlot.details.warmup}</p>
                          <h3>Main Activity Track (25 mins)</h3>
                          <p>${selectedSlot.details.mainDrill}</p>
                          <h3>Cooldown &amp; Review (10 mins)</h3>
                          <p>${selectedSlot.details.cooldown}</p>
                        </body>
                      </html>
                    `;
                    const safeName = `${selectedSlot.day}_P${selectedSlot.periodNum}_${selectedSlot.game}`.replace(/[^a-z0-9_-]+/gi, '_');
                    exportToWord(html, `${safeName}_Lesson_Plan.doc`);
                    toast.success('Lesson plan downloaded successfully!');
                    trackEvent('resource_downloaded', {
                      resource_name: selectedSlot.skill || 'Weekly Calendar Lesson Plan',
                      resource_type: 'Lesson Plan',
                      format: 'DOC'
                    });
                  }}
                  className="px-5 py-3 border-2 border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5"
                >
                  <Download size={14} />
                  <span>Download Lesson</span>
                </button>
                <button
                  onClick={() => setSelectedSlot(null)}
                  className="px-5 py-3 bg-slate-900 text-white hover:bg-slate-800 rounded-xl text-[10px] font-black uppercase tracking-widest"
                >
                  Got It, Thanks!
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Custom Slot Modal Form */}
      <AnimatePresence>
        {isAddingSlot && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm">
            <div className="absolute inset-0" onClick={() => setIsAddingSlot(false)} />
            
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border-4 border-slate-900 rounded-[2.5rem] w-full max-w-xl p-6 md:p-8 shadow-2xl relative z-10 overflow-y-auto max-h-[85vh] text-left"
            >
              <div className="flex justify-between items-start border-b border-slate-200 pb-4 mb-6">
                <div>
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Register New Lesson Slot</h3>
                  <p className="text-slate-400 text-xs">Instantly document a custom PE timetable event.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddingSlot(false)}
                  className="p-1 text-slate-400 hover:text-slate-950"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleAddSlotSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 block">Day of the Week</label>
                    <select
                      value={slotDay}
                      onChange={(e) => setSlotDay(e.target.value as ParsedSlot['day'])}
                      className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                    >
                      {WEEKDAYS.map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 block">Period Number</label>
                    <select
                      value={slotPeriod}
                      onChange={(e) => setSlotPeriod(parseInt(e.target.value))}
                      className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                    >
                      {PERIOD_ROWS.map(p => (
                        <option key={p} value={p}>Period {p}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 block">Class Name</label>
                    <input 
                      type="text" 
                      required
                      value={slotClass}
                      onChange={(e) => setSlotClass(e.target.value)}
                      placeholder="e.g. Class 9A"
                      className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 block">Game / Sport</label>
                    <input 
                      type="text" 
                      required
                      value={slotGame}
                      onChange={(e) => setSlotGame(e.target.value)}
                      className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 block">Skill Topic</label>
                  <input 
                    type="text" 
                    required
                    value={slotSkill}
                    onChange={(e) => setSlotSkill(e.target.value)}
                    placeholder="e.g. Inside kick & control receiving"
                    className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 block">Core Objective</label>
                  <textarea 
                    rows={2}
                    required
                    value={slotObjective}
                    onChange={(e) => setSlotObjective(e.target.value)}
                    className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-xs font-bold text-slate-850"
                  />
                </div>

                <div className="border-t border-slate-100 pt-3 space-y-3">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Activity Sections</span>
                  
                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Warm-up Instruction (10 min)</label>
                    <input 
                      type="text"
                      value={customWarmup}
                      onChange={(e) => setCustomWarmup(e.target.value)}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-805"
                    />
                  </div>

                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Main Drill Details (25 min)</label>
                    <input 
                      type="text"
                      value={customDrill}
                      onChange={(e) => setCustomDrill(e.target.value)}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-805"
                    />
                  </div>

                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Cooling Down Steps (10 min)</label>
                    <input 
                      type="text"
                      value={customCooldown}
                      onChange={(e) => setCustomCooldown(e.target.value)}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-805"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setIsAddingSlot(false)}
                    className="px-5 py-3 border border-slate-200 rounded-xl text-slate-500 text-xs font-black uppercase tracking-widest"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-3 bg-[#FF6B00] text-white hover:bg-orange-600 rounded-xl text-xs font-black uppercase tracking-widest shadow-md"
                  >
                    Save Slot Plan
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
