import React, { useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Settings, X, Edit3, CheckCircle2 } from 'lucide-react';

const WeeklyPlannerTool: React.FC = () => {
  const [selectedClass, setSelectedClass] = useState<any>(null);
  
  const days = ['MON 25 May', 'TUE 26 May', 'WED 27 May', 'THU 28 May', 'FRI 29 May'];
  const periods = [
    { name: 'Period 1', time: '08:50' },
    { name: 'Period 2', time: '09:45' },
    { name: 'Period 3', time: '11:00' },
    { name: 'Period 4', time: '11:55' },
    { name: 'Period 5', time: '13:45' },
    { name: 'Period 6', time: '14:40' },
  ];

  const [schedule, setSchedule] = useState<Record<string, Record<number, any>>>({
    0: { // Mon
      0: { title: 'Year 9 PE', subtitle: 'Mastering Volleyball Serving Techniques', color: 'bg-blue-500', ready: true },
      3: { title: 'Year 7 Pe', subtitle: 'Year 7', color: 'bg-emerald-500', ready: false },
      5: { title: 'Year 10 Pe', subtitle: 'Year 10', color: 'bg-orange-500', ready: false }
    },
    1: { // Tue
      2: { title: 'Year 9 PE', subtitle: 'Year 9', color: 'bg-blue-500', ready: false },
      5: { title: 'Year 11 Pe', subtitle: 'Year 11', color: 'bg-purple-500', ready: false }
    },
    3: { // Thu
      3: { title: 'Year 7 Pe', subtitle: 'Year 7 Pe — 2026-05-28', color: 'bg-emerald-500', planned: true }
    },
    4: { // Fri
      0: { title: 'Year 10 Pe', subtitle: 'Year 10', color: 'bg-orange-500', ready: false },
      5: { title: 'Year 11 Pe', subtitle: 'Year 11', color: 'bg-purple-500', ready: false }
    }
  });

  const [addingSlot, setAddingSlot] = useState<{ dayIdx: number; pIdx: number; day: string; period: string } | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newSubtitle, setNewSubtitle] = useState('');

  const handleAddClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addingSlot || !newTitle) return;
    
    setSchedule(prev => {
      const currentDay = prev[addingSlot.dayIdx] || {};
      const colors = ['bg-blue-500', 'bg-emerald-500', 'bg-orange-500', 'bg-purple-500', 'bg-pink-500'];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      
      return {
        ...prev,
        [addingSlot.dayIdx]: {
          ...currentDay,
          [addingSlot.pIdx]: {
            title: newTitle,
            subtitle: newSubtitle,
            color: randomColor,
            ready: true,
          }
        }
      };
    });
    
    setAddingSlot(null);
    setNewTitle('');
    setNewSubtitle('');
  };

  return (
    <div className="bg-white rounded-[1.5rem] border border-slate-200 overflow-hidden shadow-sm font-sans w-full animate-in fade-in">
      {/* Header */}
      <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tighter">Planner</h2>
          <p className="text-slate-500 text-sm font-medium">Term 2 - 4 classes</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="flex items-center rounded-lg border border-slate-200 overflow-hidden bg-white">
            <button className="px-4 py-2 hover:bg-slate-50 font-bold text-xs text-slate-600 flex items-center gap-1 border-r border-slate-200 transition-colors">
              <ChevronLeft size={16} /> Prev
            </button>
            <button className="px-4 py-2 hover:bg-slate-50 font-bold text-xs text-slate-600 border-r border-slate-200 transition-colors">
              Today
            </button>
            <button className="px-4 py-2 hover:bg-slate-50 font-bold text-xs text-slate-600 flex items-center gap-1 transition-colors">
              Next <ChevronRight size={16} />
            </button>
          </div>
          
          <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors">
            <Settings size={14} /> Edit schedule
          </button>
        </div>
      </div>

      <div className="px-6 py-4 flex justify-end">
        <h3 className="text-lg font-black text-slate-800">25 May – 29 May</h3>
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
              const isToday = idx === 3; // Highlight current active day
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
                        setSelectedClass({ ...classData, day: days[dIdx], period: period.name });
                      } else {
                        setAddingSlot({ dayIdx: dIdx, pIdx, day: days[dIdx], period: period.name });
                      }
                    }}
                  >
                    {classData ? (
                      <div className={`h-full ${classData.color} rounded p-2 text-white flex flex-col hover:shadow-md transition-shadow relative overflow-hidden`}>
                        <div className="text-xs font-black truncate">{classData.title}</div>
                        <div className="text-[10px] font-medium opacity-90 truncate leading-tight mt-0.5">{classData.subtitle}</div>
                        
                        {(classData.ready || classData.planned) && (
                          <div className="mt-auto pt-2">
                            <span className="inline-block px-1.5 py-0.5 bg-white/20 rounded text-[8px] font-black uppercase tracking-widest backdrop-blur-sm">
                              {classData.ready ? 'READY' : 'PLANNED'}
                            </span>
                          </div>
                        )}
                        
                        <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="bg-white text-slate-900 px-3 py-1 rounded text-[10px] font-bold shadow-sm">AI Draft Let's Go</span>
                        </div>
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
                   AI-Drafted Lesson
                 </div>
                 <h2 className="text-xl font-black text-slate-800">{selectedClass.title} — {selectedClass.subtitle}</h2>
                 <p className="text-xs text-slate-500 font-bold mt-1">{selectedClass.day} • {selectedClass.period} • CBSE Physical Education & HPE outcomes tagged</p>
               </div>
               <button onClick={() => setSelectedClass(null)} className="p-2 bg-slate-200 text-slate-600 hover:bg-slate-300 rounded-full transition-colors">
                 <X size={20} />
               </button>
             </div>
             
             <div className="flex-1 overflow-y-auto p-6 space-y-6">
               {[
                 { title: 'Warm Up', content: 'Dynamic stretching focusing on shoulders and legs. High knees, lunges, and arm circles.' },
                 { title: 'Learning Intention', content: 'Students will understand and demonstrate the basic technique of an overhand volleyball serve.' },
                 { title: 'Skill Development', content: '1. Stance and ball toss.\n2. Hitting hand shape and contact point.\n3. Follow through and tracking.' },
                 { title: 'Game Context', content: 'Modified 3v3 mini-volleyball with a focus on serving to initiate play and catching the return.' },
                 { title: 'Differentiation', content: 'Use lighter balls or allow serving from a closer line for beginners. Challenge advanced students to serve to specific targets.' },
                 { title: 'Plenary / Cool Down', content: 'Review key serving cues. Light static stretching.' },
               ].map((section, idx) => (
                 <div key={idx} className="bg-white border border-slate-200 rounded-xl p-5 hover:border-indigo-300 transition-colors group cursor-text">
                   <div className="flex items-center justify-between mb-3">
                     <h4 className="font-bold text-xs uppercase tracking-widest text-slate-500 group-hover:text-indigo-600 transition-colors">{section.title}</h4>
                     <Edit3 size={14} className="text-slate-300 group-hover:text-indigo-400 opacity-0 group-hover:opacity-100 transition-all" />
                   </div>
                   <textarea 
                     className="w-full text-sm font-medium text-slate-700 bg-transparent resize-none focus:outline-none" 
                     defaultValue={section.content}
                     rows={section.content.split('\n').length}
                   />
                 </div>
               ))}
             </div>
             
             <div className="p-6 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-4">
               <button onClick={() => setSelectedClass(null)} className="px-6 py-3 bg-white border border-slate-200 text-slate-600 text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-slate-100 transition-colors">
                 Save Draft
               </button>
               <button 
                onClick={() => setSelectedClass(null)}
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
               <button onClick={() => {setAddingSlot(null); setNewTitle(''); setNewSubtitle('');}} className="p-2 bg-slate-200 text-slate-600 hover:bg-slate-300 rounded-full transition-colors">
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
                    Create AI Draft
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
