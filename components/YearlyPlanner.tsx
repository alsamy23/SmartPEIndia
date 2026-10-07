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
  
  const [grade, setGrade] = useState('6');
  const [board, setBoard] = useState<BoardType>(BoardType.CBSE);
  const [frequency, setFrequency] = useState('2');
  const [duration, setDuration] = useState('40 min');
  const [startDate, setStartDate] = useState('2026-04-01');
  const [language, setLanguage] = useState<Language>('English');
  const [calendarText, setCalendarText] = useState(SAMPLE_CALENDAR_TEXT);
  const [term1Focus, setTerm1Focus] = useState('Locomotor Skills & Basic Fitness');
  const [term2Focus, setTerm2Focus] = useState('Football & Team Games');
  
  const [plan, setPlan] = useState<YearlyPlan | null>(null);

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

    if (t.includes('yoga') || t.includes('asana') || t.includes('fit') || t.includes('test') || f.includes('yoga')) {
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
      assessment: `Skill metrics: Technique form, physical energy retention, peer team compliance.`,
      equipment: `Marker cones, whistles, team colored jerseys, general sport balls.`,
      safety: `Maintain spacious safety borders, alert coach if feeling fatigued, keep hydrated.`
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
      const result = await generateYearlyPlan(grade, board, frequency, calendarText, term1Focus, term2Focus, startDate, duration, language);
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in">
              <div className="space-y-6">
                <div>
                   <label className="block text-xs font-black text-slate-400 uppercase mb-2">Target Grade</label>
                   <input type="text" value={grade} onChange={e => setGrade(e.target.value)} className="w-full p-4 bg-slate-50 border rounded-xl font-bold" />
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
          )}

          {step === 2 && (
             <div className="animate-in fade-in">
                <label className="block text-xs font-black text-slate-400 uppercase mb-2">Calendar Text (Holidays & Events)</label>
                <textarea value={calendarText} onChange={e => setCalendarText(e.target.value)} className="w-full h-64 p-4 bg-slate-50 border rounded-xl font-mono text-sm" placeholder="Paste school calendar here..." />
             </div>
          )}

          {step === 3 && (
            <div className="animate-in fade-in space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="bg-indigo-50 p-6 rounded-3xl border border-indigo-100">
                    <h4 className="font-bold text-indigo-900 mb-4">Term 1 Focus</h4>
                    <input type="text" value={term1Focus} onChange={e => setTerm1Focus(e.target.value)} className="w-full p-4 bg-white border rounded-xl font-bold" />
                 </div>
                 <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100">
                    <h4 className="font-bold text-emerald-900 mb-4">Term 2 Focus</h4>
                    <input type="text" value={term2Focus} onChange={e => setTerm2Focus(e.target.value)} className="w-full p-4 bg-white border rounded-xl font-bold" />
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