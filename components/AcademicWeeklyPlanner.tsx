import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  Download, 
  Plus, 
  Trash2, 
  Save, 
  Printer, 
  BookOpen, 
  FileSpreadsheet, 
  CheckCircle2, 
  GraduationCap, 
  CalendarDays,
  Loader2,
  FolderOpen,
  ArrowRight
} from 'lucide-react';
import { generateWeeklyAcademicPlan, WeeklyAcademicPlan, WeeklyAcademicPlanRow } from '../services/geminiService.ts';
import { Language } from '../types.ts';
import { downloadBlobFile } from '../utils/safeBrowser.ts';
import { toast } from '../services/toast.ts';

const AcademicWeeklyPlanner: React.FC = () => {
  // Navigation & load states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const bannerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const schoolName = (typeof window !== 'undefined' && localStorage.getItem('smartpe_school_name')) || 'SmartPE Partner School';

  useEffect(() => {
    return () => {
      if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current);
    };
  }, []);

  const showSuccessBanner = (msg: string, duration = 3000) => {
    setSuccess(msg);
    if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current);
    bannerTimerRef.current = setTimeout(() => setSuccess(null), duration);
  };

  // Form input states
  const [classLabel, setClassLabel] = useState('Grade VI');
  const [section, setSection] = useState('A, B & C');
  const [weekNo, setWeekNo] = useState('1');
  const [weekOf, setWeekOf] = useState('04/06 to 12/06');
  const [topic, setTopic] = useState('Basketball: Dribbling & Ball Handling');
  const [language, setLanguage] = useState<Language>('English');

  // Currently viewed plan
  const [currentPlan, setCurrentPlan] = useState<WeeklyAcademicPlan>({
    classLabel: 'Grade VI',
    section: 'A, B & C',
    weekNo: '1',
    weekOf: '04/06 to 12/06',
    rows: [
      {
        subject: 'Physical Education',
        concept: 'Basketball Dribbling: Fingertip Control & Low Dribbles',
        learningObjective: 'Develop fingertip touch sensitivity and steady knee-flex posture.',
        studentPrep: 'Watch a 3-minute video on basic stationary ball-handling mechanics.',
        homework: 'Perform 100 stationary low dribbles on each hand daily.',
        deadline: 'Next class session',
        test: 'Perform 30 continuous low dribbles without losing control or looking down.',
        additionalRemarks: 'Proper athletic sneakers required; practice on safe flat surface.'
      },
      {
        subject: 'Physical Education',
        concept: 'Basketball Dribbling: High & Protective Dribbling',
        learningObjective: 'Master switching dribbling heights while keeping non-dribbling arm active for protection.',
        studentPrep: 'Practice 2 minutes of wrist-warming finger taps before class.',
        homework: 'Practice high-to-low transitions (10 of each) for 3 sets.',
        deadline: 'End of week',
        test: 'Demonstrate protective body alignment against a static defender.',
        additionalRemarks: 'Keep elbow tucked close to the torso; maintain peripheral awareness.'
      }
    ]
  });

  // Yearly plan data source
  const [yearlyPlan, setYearlyPlan] = useState<any | null>(null);
  const [yearlyWeeksList, setYearlyWeeksList] = useState<{
    id: string;
    label: string;
    topic: string;
    details: string;
    dates: string;
    grade: string;
  }[]>([]);

  // Saved weekly plans history
  const [savedPlans, setSavedPlans] = useState<WeeklyAcademicPlan[]>([]);
  const [selectedSavedIndex, setSelectedSavedIndex] = useState<number>(-1);

  // Load yearly plan and saved weekly plans on mount
  useEffect(() => {
    // 1. Yearly plan check
    const savedYearly = localStorage.getItem('peYearlyPlan');
    if (savedYearly) {
      try {
        const parsed = JSON.parse(savedYearly);
        setYearlyPlan(parsed);
        setClassLabel(`Grade ${parsed.grade || 'VI'}`);

        // Flat-map weeks for quick selection
        const weeks: any[] = [];
        parsed.terms?.forEach((term: any, tIdx: number) => {
          term.months?.forEach((month: any, mIdx: number) => {
            month.weeks?.forEach((week: any, wIdx: number) => {
              if (week.status === 'Instructional') {
                weeks.push({
                  id: `${tIdx}_${mIdx}_${wIdx}`,
                  label: `${term.termName} - ${month.monthName} - Wk ${week.weekNumber}`,
                  topic: week.topic,
                  details: week.details || '',
                  dates: week.dates || '',
                  grade: parsed.grade
                });
              }
            });
          });
        });
        setYearlyWeeksList(weeks);
      } catch (e) {
        console.error("Failed to parse yearly plan inside weekly planner", e);
      }
    }

    // 2. Saved weekly plans
    const savedWeekly = localStorage.getItem('peWeeklyAcademicPlans');
    if (savedWeekly) {
      try {
        const parsed = JSON.parse(savedWeekly);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSavedPlans(parsed);
          setCurrentPlan(parsed[0]);
          setSelectedSavedIndex(0);
          // Sync input fields
          setClassLabel(parsed[0].classLabel || 'Grade VI');
          setSection(parsed[0].section || 'A, B & C');
          setWeekNo(parsed[0].weekNo || '1');
          setWeekOf(parsed[0].weekOf || '04/06 to 12/06');
        }
      } catch (e) {
        console.error("Failed to parse saved weekly plans", e);
      }
    }
  }, []);

  // Handle choosing a week from the Yearly Planner
  const handleSelectYearlyWeek = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (!val) return;
    const selected = yearlyWeeksList.find(w => w.id === val);
    if (selected) {
      setTopic(selected.topic);
      setWeekOf(selected.dates || '04/06 to 12/06');
      
      // Try to parse week number from label
      const match = selected.label.match(/Wk (\d+)/);
      if (match && match[1]) {
        setWeekNo(match[1]);
      }
      setClassLabel(`Grade ${selected.grade}`);
      
      showSuccessBanner(`Synced week topic "${selected.topic}" from Yearly Planner!`);
    }
  };

  // One-click AI generation
  const handleAIGenerate = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const planResult = await generateWeeklyAcademicPlan(
        classLabel,
        section,
        weekNo,
        weekOf,
        topic,
        language
      );
      
      setCurrentPlan(planResult);
      setSuccess("Successfully generated a structured Weekly Academic Planner using AI!");
      
      // Auto save to history
      const updated = [planResult, ...savedPlans.filter(p => !(p.classLabel === planResult.classLabel && p.weekNo === planResult.weekNo))];
      setSavedPlans(updated);
      localStorage.setItem('peWeeklyAcademicPlans', JSON.stringify(updated));
      setSelectedSavedIndex(0);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to generate plan. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle cell edit directly in the table
  const handleCellChange = (rowIdx: number, field: keyof WeeklyAcademicPlanRow, val: string) => {
    const updatedRows = [...currentPlan.rows];
    updatedRows[rowIdx] = {
      ...updatedRows[rowIdx],
      [field]: val
    };
    const updatedPlan = {
      ...currentPlan,
      rows: updatedRows
    };
    setCurrentPlan(updatedPlan);
  };

  // Add new blank row to the table
  const handleAddRow = () => {
    const newRow: WeeklyAcademicPlanRow = {
      subject: 'Physical Education',
      concept: 'New Concept/Skill Drill',
      learningObjective: 'Enter objective...',
      studentPrep: 'Enter prep...',
      homework: 'Enter homework...',
      deadline: 'Enter deadline...',
      test: 'Enter micro-test...',
      additionalRemarks: 'Enter remarks...'
    };
    const updatedPlan = {
      ...currentPlan,
      rows: [...currentPlan.rows, newRow]
    };
    setCurrentPlan(updatedPlan);
  };

  // Delete row from table
  const handleDeleteRow = (idx: number) => {
    const updatedRows = currentPlan.rows.filter((_, i) => i !== idx);
    const updatedPlan = {
      ...currentPlan,
      rows: updatedRows
    };
    setCurrentPlan(updatedPlan);
  };

  // Manual save of the current plan to local memory
  const handleSavePlan = () => {
    // Update headers first
    const planToSave = {
      ...currentPlan,
      classLabel,
      section,
      weekNo,
      weekOf
    };
    setCurrentPlan(planToSave);

    // Filter duplicates
    const existIdx = savedPlans.findIndex(p => p.classLabel === planToSave.classLabel && p.weekNo === planToSave.weekNo);
    let updated: WeeklyAcademicPlan[] = [];
    if (existIdx >= 0) {
      updated = [...savedPlans];
      updated[existIdx] = planToSave;
    } else {
      updated = [planToSave, ...savedPlans];
    }

    setSavedPlans(updated);
    localStorage.setItem('peWeeklyAcademicPlans', JSON.stringify(updated));
    setSelectedSavedIndex(updated.indexOf(planToSave));
    
    showSuccessBanner("Weekly Academic Planner saved successfully to your database!");
  };

  // Load a saved plan from list
  const handleLoadSavedPlan = (idx: number) => {
    if (idx < 0 || idx >= savedPlans.length) return;
    const plan = savedPlans[idx];
    setCurrentPlan(plan);
    setSelectedSavedIndex(idx);
    
    // Sync headers
    setClassLabel(plan.classLabel || 'Grade VI');
    setSection(plan.section || 'A, B & C');
    setWeekNo(plan.weekNo || '1');
    setWeekOf(plan.weekOf || '04/06 to 12/06');

    showSuccessBanner(`Loaded planner for ${plan.classLabel} Week ${plan.weekNo}!`, 2500);
  };

  // Export to CSV
  const handleExportCSV = () => {
    let csv = "\uFEFF"; // UTF-8 BOM
    csv += "WEEKLY ACADEMIC PLANNER\n";
    csv += `Class,${classLabel.replace(/"/g, '""')}\n`;
    csv += `Section,${section.replace(/"/g, '""')}\n`;
    csv += `Week No.,${weekNo.replace(/"/g, '""')}\n`;
    csv += `Week of,${weekOf.replace(/"/g, '""')}\n\n`;
    csv += "SUBJECT,Concept,Learning objective,Student Preparation before the class (if any),Home work,Deadline,Test,Additional remarks\n";

    currentPlan.rows.forEach(row => {
      const line = [
        `"${(row.subject || '').replace(/"/g, '""')}"`,
        `"${(row.concept || '').replace(/"/g, '""')}"`,
        `"${(row.learningObjective || '').replace(/"/g, '""')}"`,
        `"${(row.studentPrep || '').replace(/"/g, '""')}"`,
        `"${(row.homework || '').replace(/"/g, '""')}"`,
        `"${(row.deadline || '').replace(/"/g, '""')}"`,
        `"${(row.test || '').replace(/"/g, '""')}"`,
        `"${(row.additionalRemarks || '').replace(/"/g, '""')}"`
      ];
      csv += line.join(",") + "\n";
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    downloadBlobFile(blob, `Weekly_Academic_Planner_${classLabel.replace(/\s+/g, '_')}_Week_${weekNo}.csv`);
    toast.success('Weekly planner exported to CSV!');
  };

  // Trigger standard browser print
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-8 animate-slide-up pb-20">
      {/* Header Banner */}
      <div className="flex justify-between items-center print:hidden">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tighter uppercase">Weekly Academic Planner</h2>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">One-click AI curriculum distribution and homework tracker</p>
        </div>
      </div>

      {/* Main Form controls for generation */}
      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border-2 border-slate-100 print:hidden space-y-6">
        <div className="flex items-center gap-3 border-b pb-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-550 text-white bg-indigo-600 flex items-center justify-center">
            <Sparkles size={20} />
          </div>
          <div>
            <h3 className="font-black text-slate-800 uppercase text-sm">Automated Lesson & Homework Split</h3>
            <p className="text-xs text-slate-400 font-semibold">Generate a structured weekly table split based on any topic or skill in one click.</p>
          </div>
        </div>

        {/* Load from Yearly Plan Syncer */}
        {yearlyWeeksList.length > 0 ? (
          <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <CalendarDays className="text-indigo-600 shrink-0" size={18} />
              <div className="text-left">
                <span className="text-xs font-black text-indigo-900 uppercase tracking-wider block">Sync with Yearly Planner</span>
                <span className="text-[11px] font-semibold text-indigo-700">Restore or map weeks directly from your active 40-week PE pacing.</span>
              </div>
            </div>
            <div className="w-full md:w-80">
              <select 
                onChange={handleSelectYearlyWeek}
                defaultValue=""
                className="w-full p-2.5 bg-white border border-indigo-200 text-xs font-bold rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                <option value="" disabled>-- Choose week to load topic --</option>
                {yearlyWeeksList.map(w => (
                  <option key={w.id} value={w.id}>
                    {w.label}: {w.topic.substring(0, 35)}...
                  </option>
                ))}
              </select>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-left">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Pacing Synchronization</span>
            <p className="text-xs font-medium text-slate-500 mt-0.5">
              No Yearly Plan generated yet. You can build one in the <strong>Yearly Planner</strong> tab to sync weekly topics automatically.
            </p>
          </div>
        )}

        {/* Inputs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5">Class / Grade</label>
            <input 
              type="text" 
              value={classLabel} 
              onChange={e => setClassLabel(e.target.value)} 
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm text-slate-800"
              placeholder="e.g. Grade XII"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5">Sections</label>
            <input 
              type="text" 
              value={section} 
              onChange={e => setSection(e.target.value)} 
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm text-slate-800"
              placeholder="e.g. A, B & C"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5">Week Number</label>
            <input 
              type="text" 
              value={weekNo} 
              onChange={e => setWeekNo(e.target.value)} 
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm text-slate-800"
              placeholder="e.g. 1"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5">Week Of (Dates Range)</label>
            <input 
              type="text" 
              value={weekOf} 
              onChange={e => setWeekOf(e.target.value)} 
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm text-slate-800"
              placeholder="e.g. 04/06 to 12/06"
            />
          </div>
        </div>

        {/* Topic Input */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5">Weekly Core Skill / Topic to Split</label>
            <input 
              type="text" 
              value={topic} 
              onChange={e => setTopic(e.target.value)} 
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm text-slate-800"
              placeholder="e.g. Basketball: Dribbling & Ball Handling"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5">Language</label>
            <select 
              value={language} 
              onChange={e => setLanguage(e.target.value as Language)} 
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm text-slate-850"
            >
              <option value="English">English</option>
              <option value="Hindi">Hindi</option>
              <option value="Marathi">Marathi</option>
              <option value="Tamil">Tamil</option>
              <option value="Bengali">Bengali</option>
            </select>
          </div>
        </div>

        {/* Generate Button */}
        <div className="flex justify-end gap-3 pt-2">
          {savedPlans.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold">
              <FolderOpen size={14} />
              <span>History Database:</span>
              <select 
                value={selectedSavedIndex}
                onChange={e => handleLoadSavedPlan(Number(e.target.value))}
                className="p-1.5 bg-slate-100 border rounded-lg text-xs font-bold text-slate-700 outline-none"
              >
                <option value={-1} disabled>-- Select saved planner --</option>
                {savedPlans.map((p, idx) => (
                  <option key={idx} value={idx}>
                    {p.classLabel} - Wk {p.weekNo} ({p.rows.length} rows)
                  </option>
                ))}
              </select>
            </div>
          )}

          <button 
            type="button"
            onClick={handleAIGenerate}
            disabled={loading}
            className="px-6 py-3 bg-slate-900 hover:bg-[#005BFF] text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50 shadow-md"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            <span>{loading ? "Generating Planner..." : "1-Click AI Generate"}</span>
          </button>
        </div>
      </div>

      {/* Message indicators */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-100 text-rose-800 text-xs font-bold rounded-2xl flex items-center gap-2 print:hidden animate-in fade-in">
          <span className="w-1.5 h-1.5 bg-rose-600 rounded-full animate-ping"></span>
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs font-bold rounded-2xl flex items-center gap-2 print:hidden animate-in fade-in">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Spreadsheet Presentation Stage */}
      <div className="bg-white rounded-[2.5rem] border-2 border-slate-150 shadow-sm p-8 space-y-6 relative overflow-hidden print:border-0 print:p-0 print:shadow-none">
        
        {/* Document Header block modeled after high-end academic plan */}
        <div className="text-center space-y-3 pb-6 border-b-2 border-slate-900">
          <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight uppercase">
            {schoolName}
          </h1>
          <div className="bg-slate-900 text-white py-1.5 px-4 rounded-lg inline-block text-xs font-black tracking-widest uppercase">
            WEEKLY ACADEMIC PLANNER
          </div>
          
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 border-2 border-slate-900 p-4 rounded-xl mt-4 font-bold text-xs text-slate-800 bg-slate-50 text-left">
            <div>
              <span className="text-[10px] font-black text-slate-400 uppercase block tracking-wider">Class:</span>
              <span className="text-sm text-slate-900">{classLabel || '-'}</span>
            </div>
            <div>
              <span className="text-[10px] font-black text-slate-400 uppercase block tracking-wider">Section:</span>
              <span className="text-sm text-slate-900">{section || '-'}</span>
            </div>
            <div>
              <span className="text-[10px] font-black text-slate-400 uppercase block tracking-wider">Week No:</span>
              <span className="text-sm text-slate-900">{weekNo || '-'}</span>
            </div>
            <div>
              <span className="text-[10px] font-black text-slate-400 uppercase block tracking-wider">Week of:</span>
              <span className="text-sm text-slate-900">{weekOf || '-'}</span>
            </div>
          </div>
        </div>

        {/* Action controls just above the spreadsheet */}
        <div className="flex justify-between items-center print:hidden">
          <div className="text-xs text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
            <span>Spreadsheet Editor</span>
            <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-700 text-[8px] rounded uppercase font-black">Live Edit cells</span>
          </div>
          <div className="flex items-center gap-2">
            <button 
              type="button"
              onClick={handleAddRow}
              className="p-2 bg-slate-50 border hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1"
              title="Add subject/concept row"
            >
              <Plus size={14} />
              <span>Add Row</span>
            </button>
            <button 
              type="button"
              onClick={handleSavePlan}
              className="p-2 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold flex items-center gap-1"
              title="Save current planner state"
            >
              <Save size={14} />
              <span>Save Plan</span>
            </button>
            <button 
              type="button"
              onClick={handleExportCSV}
              className="p-2 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold flex items-center gap-1"
              title="Export as CSV/Excel"
            >
              <FileSpreadsheet size={14} />
              <span>Excel CSV</span>
            </button>
            <button 
              type="button"
              onClick={handlePrint}
              className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm"
              title="Print document"
            >
              <Printer size={14} />
              <span>Print</span>
            </button>
          </div>
        </div>

        {/* Real HTML Spreadsheet Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-300">
          <table className="w-full text-left border-collapse table-fixed min-w-[900px] text-xs">
            <thead>
              <tr className="bg-slate-900 text-white font-black text-[10px] tracking-wider uppercase divide-x divide-slate-750">
                <th className="p-3 w-32">SUBJECT</th>
                <th className="p-3 w-48">Concept</th>
                <th className="p-3 w-48">Learning target</th>
                <th className="p-3 w-48">Student Preparation before the class(if any)</th>
                <th className="p-3 w-40">Home work</th>
                <th className="p-3 w-28">Deadline</th>
                <th className="p-3 w-40">Test</th>
                <th className="p-3 w-40">Additional remarks</th>
                <th className="p-3 w-16 text-center print:hidden">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-300">
              {currentPlan.rows.map((row, idx) => (
                <tr key={idx} className="divide-x divide-slate-200 hover:bg-slate-50/50 transition-colors">
                  {/* Subject Cell */}
                  <td className="p-2 font-bold text-slate-800 align-top">
                    <textarea 
                      value={row.subject} 
                      onChange={e => handleCellChange(idx, 'subject', e.target.value)}
                      className="w-full bg-transparent resize-none border-0 p-1 focus:ring-1 focus:ring-indigo-400 focus:bg-white rounded font-bold h-16 leading-relaxed outline-none"
                    />
                  </td>
                  {/* Concept Cell */}
                  <td className="p-2 font-semibold text-slate-700 align-top">
                    <textarea 
                      value={row.concept} 
                      onChange={e => handleCellChange(idx, 'concept', e.target.value)}
                      className="w-full bg-transparent resize-none border-0 p-1 focus:ring-1 focus:ring-indigo-400 focus:bg-white rounded h-20 leading-relaxed outline-none"
                    />
                  </td>
                  {/* Learning Target / Objective */}
                  <td className="p-2 text-slate-650 align-top">
                    <textarea 
                      value={row.learningObjective} 
                      onChange={e => handleCellChange(idx, 'learningObjective', e.target.value)}
                      className="w-full bg-transparent resize-none border-0 p-1 focus:ring-1 focus:ring-indigo-400 focus:bg-white rounded h-20 leading-relaxed outline-none"
                    />
                  </td>
                  {/* Student Prep */}
                  <td className="p-2 text-slate-600 align-top">
                    <textarea 
                      value={row.studentPrep} 
                      onChange={e => handleCellChange(idx, 'studentPrep', e.target.value)}
                      className="w-full bg-transparent resize-none border-0 p-1 focus:ring-1 focus:ring-indigo-400 focus:bg-white rounded h-20 leading-relaxed outline-none font-medium"
                      placeholder="N/A"
                    />
                  </td>
                  {/* Homework */}
                  <td className="p-2 text-slate-650 align-top">
                    <textarea 
                      value={row.homework} 
                      onChange={e => handleCellChange(idx, 'homework', e.target.value)}
                      className="w-full bg-transparent resize-none border-0 p-1 focus:ring-1 focus:ring-indigo-400 focus:bg-white rounded h-20 leading-relaxed outline-none"
                    />
                  </td>
                  {/* Deadline */}
                  <td className="p-2 text-slate-600 align-top">
                    <textarea 
                      value={row.deadline} 
                      onChange={e => handleCellChange(idx, 'deadline', e.target.value)}
                      className="w-full bg-transparent resize-none border-0 p-1 focus:ring-1 focus:ring-indigo-400 focus:bg-white rounded h-16 leading-relaxed outline-none"
                    />
                  </td>
                  {/* Test */}
                  <td className="p-2 text-slate-650 align-top font-medium">
                    <textarea 
                      value={row.test} 
                      onChange={e => handleCellChange(idx, 'test', e.target.value)}
                      className="w-full bg-transparent resize-none border-0 p-1 focus:ring-1 focus:ring-indigo-400 focus:bg-white rounded h-20 leading-relaxed outline-none"
                    />
                  </td>
                  {/* Additional Remarks */}
                  <td className="p-2 text-slate-600 align-top italic">
                    <textarea 
                      value={row.additionalRemarks} 
                      onChange={e => handleCellChange(idx, 'additionalRemarks', e.target.value)}
                      className="w-full bg-transparent resize-none border-0 p-1 focus:ring-1 focus:ring-indigo-400 focus:bg-white rounded h-20 leading-relaxed outline-none"
                    />
                  </td>
                  {/* Actions (Delete Row) */}
                  <td className="p-2 text-center align-middle print:hidden">
                    <button 
                      type="button"
                      onClick={() => handleDeleteRow(idx)}
                      disabled={currentPlan.rows.length <= 1}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-30"
                      title="Delete Row"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Dynamic remarks footer */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-500 font-bold text-left leading-relaxed">
          <span className="text-slate-800 uppercase tracking-widest text-[9.5px] block mb-1">Spreadsheet Instructions</span>
          All cells are live-editable! Click on any block to change text directly. Changes can be saved to your local database browser memory or exported to Microsoft Excel and Google Sheets as standard CSV.
        </div>
      </div>
    </div>
  );
};

export default AcademicWeeklyPlanner;
