
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar, FileSpreadsheet, FileText, Gamepad2, Users, Accessibility, 
  Dumbbell, Microscope, MessageSquare, Target, Split, Layout, ChevronLeft, Zap, Loader2, Download, Printer, CheckCircle2,
  Trophy, BookOpen, Layers, Info, AlertCircle, Sparkles, ClipboardCheck, BookMarked, List
} from 'lucide-react';
import { generateAIToolContent } from '../services/geminiService.ts';
import { BoardType } from '../types.ts';
import WeeklyPlannerTool from './WeeklyPlannerTool.tsx';
import UnitPlannerTool from './UnitPlannerTool.tsx';
import MoveCheckTool from './MoveCheckTool.tsx';
import TournamentMaker from './TournamentMaker.tsx';
import SportsDayTracker from './SportsDayTracker.tsx';
import { trackEvent } from '../services/analytics.ts';

interface Tool {
  id: string;
  name: string;
  description: string;
  icon: any;
  color: string;
  custom?: boolean;
}

const tools: Tool[] = [
  { id: 'weekly-planner', name: 'Weekly Planner Grid', description: 'Term dates, periods, classes — draft lessons to your timetable.', icon: Calendar, color: 'bg-indigo-600', custom: true },
  { id: 'movecheck', name: 'MoveCheck AI', description: 'AI webcam rep counter and movement form checker.', icon: Dumbbell, color: 'bg-emerald-500', custom: true },
  { id: 'unit-planner', name: 'Unit Planner', description: 'Generate comprehensive unit plans with standards alignment.', icon: FileText, color: 'bg-blue-500', custom: true },
  { id: 'sports-day-tracker', name: 'Sports Day Points Tracker', description: 'Track house points and individual champions for events.', icon: Trophy, color: 'bg-amber-500', custom: true },
  { id: 'rubric-maker', name: 'Rubric Maker', description: 'Assessment rubrics for any skill and age group.', icon: Layout, color: 'bg-purple-500' },
  { id: 'worksheet-maker', name: 'Worksheet Maker', description: 'Engagement worksheets and theoretical tests.', icon: FileText, color: 'bg-indigo-500' },
  { id: 'report-writer', name: 'Report Writer', description: 'Professional feedback and student report comments.', icon: FileSpreadsheet, color: 'bg-emerald-500' },
  { id: 'game-generator', name: 'PE Games Generator', description: '5 skill-specific games for your class.', icon: Gamepad2, color: 'bg-orange-500' },
  { id: 'tournament-fixtures', name: 'Tournament Fixtures', description: 'Generate Knockout Brackets & Round Robin League Schedules in one place.', icon: Split, color: 'bg-pink-500', custom: true },
  { id: 'round-robin', name: 'Round Robin League', description: 'Generate Round Robin League schedules with live standings table.', icon: Split, color: 'bg-indigo-500', custom: true },
  { id: 'adapted-pe', name: 'Adapted PE', description: 'Inclusion modifications for students with disabilities.', icon: Accessibility, color: 'bg-sky-500' },
  { id: 'differentiator', name: 'Differentiated Instruction', description: 'Tailored modifications for all skill levels.', icon: Target, color: 'bg-red-500' },
  { id: 'sports-science', name: 'Sports Science', description: 'Experiential learning connecting PE with science.', icon: Microscope, color: 'bg-yellow-500' },
  { id: 'ask-advisor', name: 'smartpeindia Advisor', description: 'Get tailored advice on any PE teaching query.', icon: MessageSquare, color: 'bg-slate-700' },
  { id: 'lesson-observer', name: 'Lesson Observator', description: 'Generate constructive peer-feedback forms.', icon: ClipboardCheck, color: 'bg-teal-500' },
  { id: 'policy-writer', name: 'PE Policy Writer', description: 'Draft school-wide PE and safety policies.', icon: BookMarked, color: 'bg-indigo-800' },
];

const AIToolCenter: React.FC = () => {
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>({});

  const handleToolClick = (tool: Tool) => {
    setSelectedTool(tool);
    setResult(null);
    setError(null);
    setFormData({});
    trackEvent('tool_used', { tool_name: tool.name });
    trackEvent('resource_viewed', { resource_name: tool.name, category: 'AI Tools' });
  };

  const runTool = async () => {
    if (!selectedTool) return;
    setLoading(true);
    setError(null);
    try {
      const data = await generateAIToolContent(selectedTool.id, formData);
      setResult(data);
    } catch (e: any) {
      console.error("Tool execution failed:", e);
      setError(e.message || "Failed to generate tool content. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (selectedTool) {
    if (selectedTool.id === 'weekly-planner') {
      return (
        <div className="space-y-6">
          <button 
            onClick={() => setSelectedTool(null)}
            className="flex items-center space-x-2 text-slate-400 hover:text-indigo-600 font-bold uppercase tracking-widest text-xs transition-colors"
          >
            <ChevronLeft size={16} />
            <span>Back to Tool Center</span>
          </button>
          <WeeklyPlannerTool />
        </div>
      );
    }
    
    if (selectedTool.id === 'movecheck') {
      return (
        <div className="space-y-6">
          <button 
            onClick={() => setSelectedTool(null)}
            className="flex items-center space-x-2 text-slate-400 hover:text-indigo-600 font-bold uppercase tracking-widest text-xs transition-colors"
          >
            <ChevronLeft size={16} />
            <span>Back to Tool Center</span>
          </button>
          <MoveCheckTool />
        </div>
      );
    }

    if (selectedTool.id === 'unit-planner') {
      return (
        <div className="space-y-6">
          <button 
            onClick={() => setSelectedTool(null)}
            className="flex items-center space-x-2 text-slate-400 hover:text-indigo-600 font-bold uppercase tracking-widest text-xs transition-colors"
          >
            <ChevronLeft size={16} />
            <span>Back to Tool Center</span>
          </button>
          <UnitPlannerTool />
        </div>
      );
    }

    if (selectedTool.id === 'round-robin' || selectedTool.id === 'tournament-fixtures') {
      return (
        <div className="space-y-6">
          <button 
            onClick={() => setSelectedTool(null)}
            className="flex items-center space-x-2 text-slate-400 hover:text-indigo-600 font-bold uppercase tracking-widest text-xs transition-colors"
          >
            <ChevronLeft size={16} />
            <span>Back to Tool Center</span>
          </button>
          <TournamentMaker />
        </div>
      );
    }

    if (selectedTool.id === 'sports-day-tracker') {
      return (
        <div className="space-y-6">
          <button 
            onClick={() => setSelectedTool(null)}
            className="flex items-center space-x-2 text-slate-400 hover:text-indigo-600 font-bold uppercase tracking-widest text-xs transition-colors"
          >
            <ChevronLeft size={16} />
            <span>Back to Tool Center</span>
          </button>
          <SportsDayTracker />
        </div>
      );
    }

    return (
      <div className="space-y-8 animate-in slide-in-from-right-10 duration-500 pb-20">
        <button 
          onClick={() => setSelectedTool(null)}
          className="flex items-center space-x-2 text-slate-400 hover:text-indigo-600 font-bold uppercase tracking-widest text-xs transition-colors"
        >
          <ChevronLeft size={16} />
          <span>Back to Tool Center</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4">
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 sticky top-8">
              <div className={`w-16 h-16 rounded-2xl ${selectedTool.color} flex items-center justify-center text-white mb-6 shadow-xl`}>
                <selectedTool.icon size={32} />
              </div>
              <h2 className="text-2xl font-black text-slate-800 mb-2 leading-tight">{selectedTool.name}</h2>
              <p className="text-slate-400 text-sm font-medium mb-8">{selectedTool.description}</p>

              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">Topic / Sport / Focus *</label>
                  <input 
                    className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-xl font-bold text-sm text-slate-800 outline-none focus:ring-2 focus:ring-indigo-300" 
                    placeholder="e.g. Badminton Smash, Basketball Dribbling, Nutrition" 
                    value={formData.topic || ''}
                    onChange={e => setFormData({...formData, topic: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">Target Grade / Class</label>
                  <input 
                    className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-xl font-bold text-sm text-slate-800 outline-none focus:ring-2 focus:ring-indigo-300" 
                    placeholder="e.g. Class 12, Grade 9, Class 6" 
                    value={formData.grade || ''}
                    onChange={e => setFormData({...formData, grade: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">Curriculum / Context</label>
                  <input 
                    className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-xl font-bold text-sm text-slate-800 outline-none focus:ring-2 focus:ring-indigo-300" 
                    placeholder="e.g. CBSE 2025-26, ICSE, Khelo India" 
                    value={formData.curriculum || ''}
                    onChange={e => setFormData({...formData, curriculum: e.target.value})} 
                  />
                </div>
                <button 
                  onClick={runTool}
                  disabled={loading || !formData.topic}
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-2xl font-black text-sm shadow-lg hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center space-x-2"
                >
                  {loading ? <Loader2 className="animate-spin" /> : <Zap size={18} />}
                  <span>{loading ? 'Synthesizing...' : 'Build Resource'}</span>
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-8">
            {error && (
              <div className="bg-red-50 border-2 border-red-200 rounded-[2.5rem] p-8 mb-8 flex items-start space-x-4 text-red-700 animate-in zoom-in-95">
                <AlertCircle className="flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-black text-lg uppercase tracking-tight mb-1">Generation Failed</h4>
                  <p className="text-sm font-medium opacity-80 mb-4">{error}</p>
                  <div className="flex flex-wrap gap-3">
                    <button 
                      onClick={runTool}
                      className="px-6 py-2 bg-red-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-red-700 transition-colors"
                    >
                      Retry Generation
                    </button>
                  </div>
                </div>
              </div>
            )}
            {!result && !loading ? (
              <div className="bg-white border-4 border-dashed border-slate-100 rounded-[2.5rem] h-full min-h-[500px] flex flex-col items-center justify-center p-12 text-center">
                <selectedTool.icon size={64} className="text-slate-100 mb-6" />
                <h3 className="text-xl font-black text-slate-800 mb-2 uppercase tracking-tighter">Input Required</h3>
              </div>
            ) : loading ? (
              <div className="bg-white rounded-[2.5rem] h-full flex flex-col items-center justify-center p-12">
                <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
                <p className="text-slate-500 font-black tracking-widest text-sm uppercase">Synthesizing Content...</p>
              </div>
            ) : (
              <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-100 min-h-full animate-in zoom-in-95">
                <div className="flex justify-between items-center mb-8 pb-6 border-b border-slate-100">
                  <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">{result.title || selectedTool.name}</h3>
                </div>
                
                <div className="space-y-8">
                  <div className="prose max-w-none text-slate-600 leading-loose font-medium">
                    {typeof result.content === 'object' ? JSON.stringify(result.content) : result.content}
                  </div>

                  {result.items && result.items.length > 0 && (
                    <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                      <h4 className="flex items-center text-sm font-black text-indigo-900 uppercase tracking-widest mb-4">
                        <List size={16} className="mr-2 text-indigo-500" /> Key Items
                      </h4>
                      <ul className="space-y-3">
                        {result.items.map((item: any, idx: number) => (
                          <li key={idx} className="flex items-start text-slate-700 font-medium text-sm">
                            <span className="w-1.5 h-1.5 bg-indigo-50 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                            {typeof item === 'object' ? JSON.stringify(item) : item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {result.summary && (
                    <div className="bg-indigo-900 text-white p-6 rounded-2xl flex items-start space-x-4">
                      <Sparkles className="flex-shrink-0 text-orange-400" />
                      <div>
                        <h4 className="font-bold text-sm uppercase tracking-wider mb-1 text-indigo-200">AI Summary</h4>
                        <p className="text-sm opacity-90">{typeof result.summary === 'object' ? JSON.stringify(result.summary) : result.summary}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-20">
      <div className="bg-gradient-to-br from-indigo-700 via-indigo-900 to-slate-900 rounded-[3rem] p-12 text-white relative overflow-hidden shadow-2xl">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 bg-white/10 rounded-full border border-white/20 mb-6 backdrop-blur-md">
            <Zap size={14} className="text-orange-400" />
            <span className="text-[10px] font-black uppercase tracking-widest">Premium Mastery Tools</span>
          </div>
          <h2 className="text-5xl font-black mb-6 tracking-tighter leading-none">FREE Professional PE Suite.</h2>
          <p className="text-indigo-200 text-lg mb-0 leading-relaxed font-medium">
            13 High-Impact tools inspired by global best practices, optimized for the Indian curriculum.
          </p>
        </div>
        <Layers className="absolute -right-20 -bottom-20 w-96 h-96 text-white/5 rotate-12" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {tools.map((tool, idx) => (
          <motion.button
            key={tool.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            whileHover={{ y: -8, scale: 1.02 }}
            onClick={() => handleToolClick(tool)}
            className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl transition-all group text-left flex flex-col items-start"
          >
            <div className={`p-4 rounded-2xl ${tool.color} text-white mb-6 group-hover:scale-110 transition-transform shadow-lg`}>
              <tool.icon size={28} />
            </div>
            <h3 className="text-xl font-black text-slate-800 mb-2 tracking-tight leading-tight group-hover:text-indigo-600 transition-colors">{tool.name}</h3>
            <p className="text-sm text-slate-400 font-medium leading-relaxed">{tool.description}</p>
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default AIToolCenter;
    