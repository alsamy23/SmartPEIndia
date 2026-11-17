import React, { useState, useMemo, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Settings, X, Edit3, CheckCircle2, Trash2 } from 'lucide-react';
import { toast } from '../services/toast.ts';

interface LessonSection {
  title: string;
  content: string;
}

const DEFAULT_SECTIONS = (title = 'PE Class', subtitle = 'Core Physical Skill'): LessonSection[] => [
  { title: 'Warm Up', content: `Dynamic stretching focusing on shoulders and legs for ${title}. High knees, lunges, and arm circles.` },
  { title: 'Learning Intention', content: `Students will understand and demonstrate the basic technique of ${subtitle}.` },
  { title: 'Skill Development', content: '1. Stance and ready position.\n2. Core technique mechanics.\n3. Follow through and tracking.' },
  { title: 'Game Context', content: `Modified small-sided 3v3 activity applying ${subtitle} in a supportive game setting.` },
  { title: 'Differentiation', content: 'Use lighter equipment or shorter distances for beginners. Challenge advanced students with target accuracy.' },
  { title: 'Plenary / Cool Down', content: 'Review key cues and gentle static stretching.' },
];

const INITIAL_SCHEDULE: Record<string, Record<number, any>> = {
  0: {
    0: { title: 'Year 9 PE', subtitle: 'Mastering Volleyball Serving Techniques', color: 'bg-blue-500', ready: true },
    3: { title: 'Year 7 PE', subtitle: 'Agility & Movement Games', color: 'bg-emerald-500', ready: false },
    5: { title: 'Year 10 PE', subtitle: 'Track & Relay Transitions', color: 'bg-orange-500', ready: false }
  },
  1: {
    2: { title: 'Year 9 PE', subtitle: 'Basketball Passing Drills', color: 'bg-blue-500', ready: false },
    5: { title: 'Year 11 PE', subtitle: 'Biomechanics Lab Practical', color: 'bg-purple-500', ready: false }
  },
  3: {
    3: { title: 'Year 7 PE', subtitle: 'Badminton Grip & Footwork', color: 'bg-emerald-500', planned: true }
  },
  4: {
    0: { title: 'Year 10 PE', subtitle: 'Football Passing Accuracy', color: 'bg-orange-500', ready: false },
    5: { title: 'Year 11 PE', subtitle: 'Yoga & Breathing Rhythm', color: 'bg-purple-500', ready: false }
  }
};

const STORAGE_KEY = 'smartpe_weekly_planner_grid';

const WeeklyPlannerTool: React.FC = () => {
  const [weekOffset, setWeekOffset] = useState(0);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedClass, setSelectedClass] = useState<{ dayIdx: number; pIdx: number; day: string; period: string; data: any } | null>(null);
  const [lessonSections, setLessonSections] = useState<LessonSection[]>([]);

  const { days, weekRangeLabel, todayDayIdx } = useMemo(() => {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon...
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(now);
    monday.setDate(now.getDate() + diffToMonday + weekOffset * 7);

    const monthShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const dayNames = ['MON', 'TUE', 'WED', 'THU', 'FRI'];

    const computedDays = dayNames.map((name, idx) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + idx);
      return `${name} ${d.getDate()} ${monthShort[d.getMonth()]}`;
    });

    const friday = new Date(monday);
    friday.setDate(monday.getDate() + 4);
    const rangeLabel = `${monday.getDate()} ${monthShort[monday.getMonth()]} – ${friday.getDate()} ${monthShort[friday.getMonth()]}`;
    const currentDayIdx = weekOffset === 0 ? Math.min(4, Math.max(0, dayOfWeek - 1)) : -1;

    return { days: computedDays, weekRangeLabel: rangeLabel, todayDayIdx: currentDayIdx };
  }, [weekOffset]);

  const periods = [
    { name: 'Period 1', time: '08:50' },
    { name: 'Period 2', time: '09:45' },
    { name: 'Period 3', time: '11:00' },
    { name: 'Period 4', time: '11:55' },
    { name: 'Period 5', time: '13:45' },
    { name: 'Period 6', time: '14:40' },
  ];

  const [schedule, setSchedule] = useState<Record<string, Record<number, any>>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore storage errors
    }
    return INITIAL_SCHEDULE;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(schedule));
    } catch {
      // ignore storage errors
    }
  }, [schedule]);

  const [addingSlot, setAddingSlot] = useState<{ dayIdx: number; pIdx: number; day: string; period: string } | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newSubtitle, setNewSubtitle] = useState('');

  const openLessonEditor = (dayIdx: number, pIdx: number, day: string, period: string, data: any) => {
    setSelectedClass({ dayIdx, pIdx, day, period, data });
    setLessonSections(
      Array.isArray(data.lessonSections) && data.lessonSections.length > 0
        ? data.lessonSections
        : DEFAULT_SECTIONS(data.title, data.subtitle)
    );
  };

  const handleSaveLessonModal = (markReady: boolean) => {
    if (!selectedClass) return;
    const { dayIdx, pIdx, data } = selectedClass;
    setSchedule(prev => ({
      ...prev,
      [dayIdx]: {
        ...(prev[dayIdx] || {}),
        [pIdx]: {
          ...data,
          lessonSections,
          ready: markReady ? true : data.ready,
          planned: true
        }
      }
    }));
    toast.success(markReady ? 'Lesson marked Ready to Teach!' : 'Lesson draft saved!');
    setSelectedClass(null);
  };

  const handleDeleteSlot = (e: React.MouseEvent, dayIdx: number, pIdx: number) => {
    e.stopPropagation();
    setSchedule(prev => {
      const daySlots = { ...(prev[dayIdx] || {}) };
      delete daySlots[pIdx];
      return { ...prev, [dayIdx]: daySlots };
    });
    toast.info('Timetable slot removed.');
  };

  const handleAddClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addingSlot || !newTitle.trim()) return;
    const colors = ['bg-blue-500', 'bg-emerald-500', 'bg-orange-500', 'bg-purple-500', 'bg-pink-500'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    setSchedule(prev => {
      const currentDay = prev[addingSlot.dayIdx] || {};
      return {
        ...prev,
        [addingSlot.dayIdx]: {
          ...currentDay,
          [addingSlot.pIdx]: {
            title: newTitle.trim(),
            subtitle: newSubtitle.trim(),
            color: randomColor,
            ready: true,
            lessonSections: DEFAULT_SECTIONS(newTitle.trim(), newSubtitle.trim())
          }
        }
      };
    });

    toast.success(`Added ${newTitle.trim()} to ${addingSlot.day}`);
    setAddingSlot(null);
    setNewTitle('');
    setNewSubtitle('');
  };

  const totalClassesCount = Object.values(schedule).reduce(
    (sum, dayMap) => sum + Object.keys(dayMap || {}).length,
    0
  );

  return (
    <div className="bg-white rounded-[1.5rem] border border-slate-200 overflow-hidden shadow-sm font-sans w-full animate-in fade-in">
      {/* Header */}
      <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tighter">Planner</h2>
          <p className="text-slate-500 text-sm font-medium">{totalClassesCount} scheduled classes this week</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="flex items-center rounded-lg border border-slate-200 overflow-hidden bg-white">
            <button
              type="button"
              onClick={() => setWeekOffset(w => w - 1)}
              className="px-4 py-2 hover:bg-slate-50 font-bold text-xs text-slate-600 flex items-center gap-1 border-r border-slate-200 transition-colors"
            >
              <ChevronLeft size={16} /> Prev
            </button>
            <button
              type="button"
              onClick={() => setWeekOffset(0)}
              className={`px-4 py-2 hover:bg-slate-50 font-bold text-xs border-r border-slate-200 transition-colors ${weekOffset === 0 ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600'}`}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => setWeekOffset(w => w + 1)}
              className="px-4 py-2 hover:bg-slate-50 font-bold text-xs text-slate-600 flex items-center gap-1 transition-colors"
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
          
          <button
            type="button"
            onClick={() => setIsEditMode(!isEditMode)}
            className={`flex items-center gap-2 px-4 py-2 border rounded-lg text-xs font-bold transition-colors ${isEditMode ? 'bg-slate-900 border-slate-900 text-white' : 'border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
          >
            <Settings size={14} /> {isEditMode ? 'Done Editing' : 'Edit schedule'}
          </button>
        </div>
      </div>

      <div className="px-6 py-4 flex items-center justify-between">
        <span className="text-xs font-bold text-slate-400">
          {isEditMode ? 'Edit Mode: Click any slot to remove or click empty cells to add.' : 'Click any class card to edit its lesson plan.'}
        </span>
        <h3 className="text-lg font-black text-slate-800">{weekRangeLabel}</h3>
      </div>

      {/* Grid */}
      <div className="overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Header Row */}
          <div className="grid grid-cols-[100px_1fr_1fr_1fr_1fr_1fr] border-y border-slate-200 bg-slate-50/50">
            <div className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest border-r border-slate-200">
              Period
            </div>
            {days.map((day, idx) => {
              const [dayName, ...dateParts] = day.split(' ');
              const isToday = idx === todayDayIdx;
              return (
                <div key={idx} className={`p-4 border-r border-slate-200 last:border-0 ${isToday ? 'bg-amber-50/50' : ''}`}>
                  <div className={`text-[10px] font-black uppercase tracking-widest ${isToday ? 'text-[#D4A017]' : 'text-slate-500'}`}>{dayName}</div>
                  <div className={`text-sm font-bold mt-0.5 ${isToday ? 'text-[#0D2B52]' : 'text-slate-900'}`}>{dateParts.join(' ')}</div>
                </div>
              );
            })}
          </div>

          {/* Time Slots */}
          {periods.map((period, pIdx) => (
            <div key={pIdx} className="grid grid-cols-[100px_1fr_1fr_1fr_1fr_1fr] border-b border-slate-200 last:border-0">
              <div className="p-4 border-r border-slate-200 bg-slate-50/30">
                <div className="text-xs font-black text-slate-700">{period.name}</div>
                <div className="text-[10px] font-bold text-slate-400 mt-1">{period.time}</div>
              </div>
              
              {[0, 1, 2, 3, 4].map(dIdx => {
                const classData = schedule[dIdx]?.[pIdx];
                return (
                  <div 
                    key={dIdx} 
                    className="p-1 border-r border-slate-200 last:border-0 min-h-[90px] group cursor-pointer hover:bg-slate-50 transition-colors relative"
                    onClick={() => {
                      if (classData) {
                        openLessonEditor(dIdx, pIdx, days[dIdx], period.name, classData);
                      } else {
                        setAddingSlot({ dayIdx: dIdx, pIdx, day: days[dIdx], period: period.name });
                      }
                    }}
                  >
                    {classData ? (
                      <div className={`h-full ${classData.color} rounded p-2 text-white flex flex-col hover:shadow-md transition-shadow relative overflow-hidden`}>
                        {isEditMode && (
                          <button
                            type="button"
                            onClick={(e) => handleDeleteSlot(e, dIdx, pIdx)}
                            className="absolute top-1.5 right-1.5 z-20 p-1 bg-rose-600 text-white rounded-md hover:bg-rose-700 shadow"
                            title="Remove slot"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                        <div className="text-xs font-black truncate pr-5">{classData.title}</div>
                        <div className="text-[10px] font-medium opacity-90 truncate leading-tight mt-0.5">{classData.subtitle}</div>
                        
                        {(classData.ready || classData.planned) && (
                          <div className="mt-auto pt-2">
                            <span className="inline-block px-1.5 py-0.5 bg-white/20 rounded text-[8px] font-black uppercase tracking-widest backdrop-blur-sm">
                              {classData.ready ? 'READY' : 'PLANNED'}
                            </span>
                          </div>
                        )}
                        
                        {!isEditMode && (
                          <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="bg-white text-slate-900 px-3 py-1 rounded text-[10px] font-bold shadow-sm">Edit Lesson Plan</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="h-full w-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-slate-400">
                        <span className="text-[10px] font-bold uppercase tracking-widest">+ Add</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Lesson Editor Modal */}
      {selectedClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-2xl max-h-[90vh] rounded-[2rem] shadow-2xl flex flex-col overflow-hidden">
             <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
               <div>
                 <div className="text-[10px] font-black uppercase text-indigo-600 tracking-widest mb-1.5 flex items-center gap-2">
                   <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                   Lesson Plan Editor
                 </div>
                 <h2 className="text-xl font-black text-slate-800">{selectedClass.data.title} — {selectedClass.data.subtitle}</h2>
                 <p className="text-xs text-slate-500 font-bold mt-1">{selectedClass.day} • {selectedClass.period} • CBSE Physical Education &amp; HPE outcomes tagged</p>
               </div>
               <button type="button" onClick={() => setSelectedClass(null)} className="p-2 bg-slate-200 text-slate-600 hover:bg-slate-300 rounded-full transition-colors">
                 <X size={20} />
               </button>
             </div>
             
             <div className="flex-1 overflow-y-auto p-6 space-y-6">
               {lessonSections.map((section, idx) => (
                 <div key={idx} className="bg-white border border-slate-200 rounded-xl p-5 hover:border-indigo-300 transition-colors group cursor-text">
                   <div className="flex items-center justify-between mb-3">
                     <h4 className="font-bold text-xs uppercase tracking-widest text-slate-500 group-hover:text-indigo-600 transition-colors">{section.title}</h4>
                     <Edit3 size={14} className="text-slate-300 group-hover:text-indigo-400 opacity-0 group-hover:opacity-100 transition-all" />
                   </div>
                   <textarea 
                     className="w-full text-sm font-medium text-slate-700 bg-transparent resize-none focus:outline-none" 
                     value={section.content}
                     onChange={(e) => {
                       const next = [...lessonSections];
                       next[idx] = { ...next[idx], content: e.target.value };
                       setLessonSections(next);
                     }}
                     rows={Math.max(2, section.content.split('\n').length)}
                   />
                 </div>
               ))}
             </div>
             
             <div className="p-6 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-4">
               <button
                 type="button"
                 onClick={() => handleSaveLessonModal(false)}
                 className="px-6 py-3 bg-white border border-slate-200 text-slate-600 text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-slate-100 transition-colors"
               >
                 Save Draft
               </button>
               <button 
                 type="button"
                 onClick={() => handleSaveLessonModal(true)}
                 className="px-8 py-3 bg-indigo-600 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-indigo-700 hover:scale-105 active:scale-95 transition-all shadow-md flex items-center gap-2"
               >
                 <CheckCircle2 size={16} /> Teach this lesson
               </button>
             </div>
          </div>
        </div>
      )}

      {/* Add New Class Modal */}
      {addingSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-[2rem] shadow-2xl flex flex-col overflow-hidden">
             <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
               <div>
                 <h2 className="text-xl font-black text-slate-800">Add Class</h2>
                 <p className="text-xs text-slate-500 font-bold mt-1">{addingSlot.day} • {addingSlot.period}</p>
               </div>
               <button type="button" onClick={() => {setAddingSlot(null); setNewTitle(''); setNewSubtitle('');}} className="p-2 bg-slate-200 text-slate-600 hover:bg-slate-300 rounded-full transition-colors">
                 <X size={20} />
               </button>
             </div>
             
             <form onSubmit={handleAddClass} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-widest">Class Name</label>
                  <input autoFocus required type="text" value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="e.g., Year 8 PE" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-widest">Topic / Unit</label>
                  <input required type="text" value={newSubtitle} onChange={e => setNewSubtitle(e.target.value)} placeholder="e.g., Net & Wall: Volleyball Intro" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium" />
                </div>
                
                <div className="pt-4 flex justify-end gap-3">
                  <button type="button" onClick={() => {setAddingSlot(null); setNewTitle(''); setNewSubtitle('');}} className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 font-bold uppercase tracking-widest text-xs rounded-xl hover:bg-slate-50 transition-colors">
                    Cancel
                  </button>
                  <button type="submit" className="px-6 py-2.5 bg-[#FF6B00] text-white font-black uppercase tracking-widest text-xs rounded-xl hover:bg-orange-600 shadow-md transition-colors flex items-center gap-2">
                    Create Lesson Slot
                  </button>
                </div>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default WeeklyPlannerTool;
