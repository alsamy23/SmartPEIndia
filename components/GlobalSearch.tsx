import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, Loader2, BookOpen, User, ArrowRight, LayoutDashboard, Wrench, GraduationCap, X, FileText, Sparkles, Filter, Check, Trophy, CalendarRange } from 'lucide-react';
import { VoiceTranscribeButton } from './VoiceTranscribeButton';
import { fitnessService, Student } from '../services/fitnessService.ts';
import { isBrandSuperAdmin } from '../types';
import { auth } from '../services/firebase.ts';
import { onAuthStateChanged } from 'firebase/auth';

interface GlobalSearchProps {
  onNavigate: (tabId: string, data?: any) => void;
  onOpenVoiceAgent?: () => void;
}

type SearchCategory = 'all' | 'tools' | 'students' | 'resources';

interface SearchItem {
  category: 'tool' | 'resource' | 'student';
  title: string;
  tabId: string;
  subtitle?: string;
  id?: string;
  meta?: {
    classGrade?: string;
    section?: string;
    rollNumber?: string;
    gender?: string;
  };
}

const MODULES: Omit<SearchItem, 'category'>[] = [
  { title: 'Dashboard', tabId: 'dashboard', subtitle: 'Main school overview & quick stats' },
  { title: 'Academy & Player Dev', tabId: 'coaching-academy', subtitle: 'Sports academy rosters, technical ratings, drills & reports' },
  { title: 'PE Lesson Plan Generator', tabId: 'planner', subtitle: 'Create CBSE/ICSE lesson plans in under 60s' },
  { title: 'Tournament Fixtures (Knockout & League)', tabId: 'tournament-fixtures', subtitle: 'Brackets, fixture tables & schedules' },
  { title: 'Question Paper Generator', tabId: 'testpaper', subtitle: 'MCQ & Theory exam papers for PE' },
  { title: 'Fitness Tests & Data Entry', tabId: 'fitness', subtitle: 'Khelo India & CBSE fitness assessments' },
  { title: 'Khelo India Assessment Info', tabId: 'khelo', subtitle: 'Protocol details & percentile calculator' },
  { title: 'School Fitness Database', tabId: 'school-overview', subtitle: 'Platform fitness overview' },
  { title: 'Fitness Reports & Cards', tabId: 'fitness-reports', subtitle: 'Generate individual student fitness report cards' },
  { title: 'Live Test Results', tabId: 'school-results', subtitle: 'Monitor & inspect student test scores' },
  { title: 'Student Directory', tabId: 'school-students', subtitle: 'Manage student profiles & records' },
  { title: 'Teams & Classes', tabId: 'school-teams', subtitle: 'Manage classes, sections, and sports teams' },
  { title: 'Parent Letters & Communications', tabId: 'parentletters', subtitle: 'Draft emails & letters for parents' },
  { title: 'Yearly Curriculum Planner', tabId: 'yearly', subtitle: '40 week structured PE curriculum' },
  { title: 'Weekly Academic Planner', tabId: 'weekly-planner', subtitle: 'Lesson & homework splitter for classes' },
  { title: 'Workload & Timetable Planner', tabId: 'workload-planner', subtitle: 'Schedules and curriculum slots planner' },
  { title: 'PE Classroom Widgets', tabId: 'widgets', subtitle: 'Timers, scoreboards & classroom tools' },
  { title: 'Skill Progressions', tabId: 'skillmastery', subtitle: 'Long-term skill checklists & progressions' },
  { title: 'Skill Analysis Lab', tabId: 'skill-analysis', subtitle: 'Compare techniques & biomechanics' },
  { title: 'State & Board Compliance', tabId: 'compliance', subtitle: 'NEP 2020 & CBSE norms checklist' },
  { title: 'School Settings & Admin', tabId: 'school-admin', subtitle: 'Manage members, permissions & settings' },
  { title: 'System Logs', tabId: 'logs', subtitle: 'Error tracking & system activity' },
  { title: 'Game Rules Bot', tabId: 'rules', subtitle: 'AI Sports rulebook assistant' },
  { title: 'Theory Master', tabId: 'theory', subtitle: 'CBSE / ICSE PE Theory syllabus & notes' },
  { title: 'AI Tool Center', tabId: 'tools', subtitle: 'All PE teacher AI utilities' },
  { title: 'Principal Dashboard', tabId: 'principal-dashboard', subtitle: 'High-level school health & PE summary' },
  { title: 'Department Office', tabId: 'department-office', subtitle: 'PE department workload & assets' },
];

const RESOURCES: Omit<SearchItem, 'category'>[] = [
  { title: 'Changing Trends & Career in PE', tabId: 'theory', subtitle: 'Class 11 - Unit 1' },
  { title: 'Olympism & Olympic Movement', tabId: 'theory', subtitle: 'Class 11 - Unit 2' },
  { title: 'Yoga & Holistic Wellness', tabId: 'theory', subtitle: 'Class 11 - Unit 3 / Class 12 - Unit 3' },
  { title: 'Physical Education & Sports for CWSN', tabId: 'theory', subtitle: 'Class 11/12 - Unit 4' },
  { title: 'Physical Fitness, Health and Wellness', tabId: 'theory', subtitle: 'Class 11 - Unit 5' },
  { title: 'Test, Measurement & Evaluation', tabId: 'theory', subtitle: 'Class 11/12 - Unit 6' },
  { title: 'Anatomy, Physiology in Sports', tabId: 'theory', subtitle: 'Class 11 - Unit 7 / Class 12 - Unit 7' },
  { title: 'Kinesiology and Biomechanics', tabId: 'theory', subtitle: 'Class 11 - Unit 8 / Class 12 - Unit 8' },
  { title: 'Psychology & Sports', tabId: 'theory', subtitle: 'Class 11/12 - Unit 9' },
  { title: 'Training and Doping in Sports', tabId: 'theory', subtitle: 'Class 11/12 - Unit 10' },
  { title: 'Management of Sporting Events', tabId: 'theory', subtitle: 'Class 12 - Unit 1' },
  { title: 'Children & Women in Sports', tabId: 'theory', subtitle: 'Class 12 - Unit 2' },
  { title: 'Sports & Nutrition', tabId: 'theory', subtitle: 'Class 12 - Unit 5' },
];

export const GlobalSearch: React.FC<GlobalSearchProps> = ({ onNavigate, onOpenVoiceAgent }) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<SearchCategory>('all');
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [students, setStudents] = useState<Student[]>([]);
  const [loadingStudents, setLoadingStudents] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let unsubStudents: (() => void) | undefined;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    
    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setLoadingStudents(true);
        try {
          const profile = await fitnessService.getSchoolMember(user.uid);
          const isSuperAdmin = isBrandSuperAdmin(user.email);
          const isAdmin = profile?.role === 'admin' || isSuperAdmin;
          const schoolId = profile?.schoolId;
          
          unsubStudents = fitnessService.subscribeToStudents(
            user.uid,
            schoolId,
            isAdmin,
            (data) => {
              setStudents(data);
              setLoadingStudents(false);
            }
          );
        } catch (e) {
          console.error("Error fetching students for global search", e);
          setLoadingStudents(false);
        }
      } else {
        setStudents([]);
        unsubStudents?.();
        setLoadingStudents(false);
      }
    });

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      unsubAuth();
      unsubStudents?.();
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Compute matches across categories
  const { allMatches, toolMatches, studentMatches, resourceMatches } = useMemo(() => {
    if (!query.trim()) {
      return { allMatches: [], toolMatches: [], studentMatches: [], resourceMatches: [] };
    }

    const term = query.toLowerCase().trim();

    const tools: SearchItem[] = MODULES.filter(mod => 
      mod.title.toLowerCase().includes(term) || 
      mod.subtitle?.toLowerCase().includes(term) || 
      mod.tabId.toLowerCase().includes(term)
    ).map(mod => ({ ...mod, category: 'tool' }));

    const resources: SearchItem[] = RESOURCES.filter(res => 
      res.title.toLowerCase().includes(term) || 
      res.subtitle?.toLowerCase().includes(term)
    ).map(res => ({ ...res, category: 'resource' }));

    const stds: SearchItem[] = students.filter(std => {
      const nameMatch = std.name.toLowerCase().includes(term);
      const rollMatch = std.rollNumber?.toLowerCase().includes(term);
      const classMatch = std.grade?.toLowerCase().includes(term);
      const sectionMatch = std.section?.toLowerCase().includes(term);
      return nameMatch || rollMatch || classMatch || sectionMatch;
    }).map(std => {
      const classInfo = std.grade ? `Class ${std.grade}${std.section ? `-${std.section}` : ''}` : '';
      const rollInfo = std.rollNumber ? `Roll #${std.rollNumber}` : '';
      const metaStr = [classInfo, rollInfo, std.gender].filter(Boolean).join(' • ');

      return {
        category: 'student',
        title: std.name,
        subtitle: metaStr || 'Student Record',
        tabId: 'fitness-reports',
        id: std.id,
        meta: {
          classGrade: std.grade,
          section: std.section,
          rollNumber: std.rollNumber,
          gender: std.gender
        }
      };
    });

    return {
      allMatches: [...tools, ...stds, ...resources],
      toolMatches: tools,
      studentMatches: stds,
      resourceMatches: resources
    };
  }, [query, students]);

  // Filter results based on active tab
  const filteredResults = useMemo(() => {
    if (activeFilter === 'tools') return toolMatches;
    if (activeFilter === 'students') return studentMatches;
    if (activeFilter === 'resources') return resourceMatches;
    return allMatches;
  }, [activeFilter, allMatches, toolMatches, studentMatches, resourceMatches]);

  // Reset keyboard selection index when query or filter changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query, activeFilter]);

  const handleSelect = (item: SearchItem, targetTab?: string) => {
    setQuery('');
    setIsOpen(false);
    
    const destination = targetTab || item.tabId;
    if (item.category === 'student') {
      onNavigate(destination, { studentId: item.id });
    } else {
      onNavigate(destination);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || filteredResults.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % filteredResults.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredResults.length) % filteredResults.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const selected = filteredResults[selectedIndex];
      if (selected) {
        handleSelect(selected);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const clearSearch = () => {
    setQuery('');
    setIsOpen(false);
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto z-50 text-left" ref={containerRef}>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
          <Search size={18} />
        </div>
        <input
          ref={inputRef}
          type="text"
          className="block w-full pl-10 pr-28 py-2.5 bg-white/90 backdrop-blur-md border border-slate-200 rounded-xl leading-5 placeholder-slate-400 text-slate-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-xs font-bold shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
          placeholder="Search students, tools, or theory (Ctrl+K)..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
        />
        <div className="absolute inset-y-0 right-0 pr-2 flex items-center gap-1.5">
          {onOpenVoiceAgent && (
            <button
              type="button"
              onClick={onOpenVoiceAgent}
              className="p-1.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors flex items-center gap-1 text-[10px] font-black uppercase tracking-wider"
              title="Open Voice AI Assistant & Feature Guide"
            >
              <Sparkles size={13} className="text-amber-500 animate-pulse" />
              <span className="hidden md:inline">Voice AI</span>
            </button>
          )}
          <VoiceTranscribeButton
            onTranscribe={(text) => {
              setQuery(text);
              setIsOpen(true);
            }}
            promptContext="Transcribe this search query for physical education students, drills, tools, or sports syllabus."
            size="sm"
            variant="ghost"
          />
          {!query && (
            <span className="text-[9px] uppercase font-black tracking-widest text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 hidden sm:inline">
              Ctrl K
            </span>
          )}
          {query && (
            <button 
              onClick={clearSearch}
              className="p-1 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              title="Clear search"
            >
              <X size={15} />
            </button>
          )}
        </div>
      </div>

      {isOpen && query.trim().length > 0 && (
        <div className="absolute top-full mt-2 w-full bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden transform opacity-100 scale-100 transition-all origin-top z-50">
          {/* Category Filter Pills Bar */}
          <div className="p-2.5 bg-slate-50/90 border-b border-slate-100 flex items-center gap-1.5 overflow-x-auto custom-scrollbar">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeFilter === 'all'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span>All Results</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[9px] ${
                activeFilter === 'all' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
              }`}>
                {allMatches.length}
              </span>
            </button>

            <button
              onClick={() => setActiveFilter('tools')}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeFilter === 'tools'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Wrench size={12} />
              <span>Tools ({toolMatches.length})</span>
            </button>

            <button
              onClick={() => setActiveFilter('students')}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeFilter === 'students'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <User size={12} />
              <span>Students ({studentMatches.length})</span>
            </button>

            <button
              onClick={() => setActiveFilter('resources')}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeFilter === 'resources'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <BookOpen size={12} />
              <span>Theory ({resourceMatches.length})</span>
            </button>
          </div>

          {/* Results List */}
          {filteredResults.length > 0 ? (
            <ul className="max-h-96 overflow-y-auto custom-scrollbar divide-y divide-slate-100">
              {filteredResults.map((item, index) => {
                const isSelected = index === selectedIndex;

                return (
                  <li key={`${item.category}-${item.id || item.title}-${index}`}>
                    <div
                      onClick={() => handleSelect(item)}
                      className={`w-full px-4 py-3 flex items-center space-x-3 transition-colors text-left group cursor-pointer ${
                        isSelected ? 'bg-indigo-50/90' : 'hover:bg-slate-50/80'
                      }`}
                    >
                      {/* Icon Container */}
                      <div className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                        item.category === 'student' 
                          ? 'bg-emerald-100 text-emerald-700' 
                          : item.category === 'tool' 
                          ? 'bg-indigo-100 text-indigo-700' 
                          : 'bg-amber-100 text-amber-700'
                      }`}>
                        {item.category === 'student' && <User size={18} />}
                        {item.category === 'tool' && <Wrench size={18} />}
                        {item.category === 'resource' && <BookOpen size={18} />}
                      </div>

                      {/* Info & Subtitle */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-black text-slate-900 truncate">
                            {item.title}
                          </p>

                          {/* Category Badge */}
                          <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded border ${
                            item.category === 'student' 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                              : item.category === 'tool' 
                              ? 'bg-indigo-50 text-indigo-700 border-indigo-200' 
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                            {item.category === 'student' ? 'Student' : item.category === 'tool' ? 'Tool' : 'Theory'}
                          </span>
                        </div>

                        {item.subtitle && (
                          <p className="text-[11px] font-medium text-slate-500 truncate mt-0.5">
                            {item.subtitle}
                          </p>
                        )}
                      </div>

                      {/* Quick Jump Options for Students vs Tools */}
                      {item.category === 'student' ? (
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelect(item, 'fitness-reports');
                            }}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[9px] font-black uppercase tracking-wider transition-all"
                            title="Jump to Student Fitness Report Card"
                          >
                            Report
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelect(item, 'school-students');
                            }}
                            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-[9px] font-black uppercase tracking-wider transition-all"
                            title="Jump to Directory Profile"
                          >
                            Profile
                          </button>
                        </div>
                      ) : (
                        <div className="flex-shrink-0 text-slate-300 group-hover:text-indigo-600 transition-colors">
                          <ArrowRight size={16} className="transform group-hover:translate-x-1 transition-transform" />
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="px-6 py-10 text-center">
              <Search size={28} className="mx-auto text-slate-300 mb-3" />
              <p className="text-xs font-black text-slate-900 mb-1">
                No {activeFilter === 'all' ? 'results' : activeFilter} found for "{query}"
              </p>
              {allMatches.length > 0 && activeFilter !== 'all' ? (
                <div className="mt-3">
                  <p className="text-[11px] font-medium text-slate-500 mb-2">
                    Found {allMatches.length} matching item(s) in other categories!
                  </p>
                  <button
                    onClick={() => setActiveFilter('all')}
                    className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-[10px] font-black uppercase tracking-wider hover:bg-indigo-700 transition-all cursor-pointer"
                  >
                    View All Results
                  </button>
                </div>
              ) : (
                <p className="text-[11px] font-medium text-slate-500">
                  Try checking spelling, roll number, or searching for a general keyword like 'Lesson', 'Pushup', or 'Sprint'.
                </p>
              )}
            </div>
          )}

          {/* Quick Footer */}
          <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            <span>Use ↑ ↓ to navigate, Enter to select</span>
            <span>Esc to close</span>
          </div>
        </div>
      )}
    </div>
  );
};

