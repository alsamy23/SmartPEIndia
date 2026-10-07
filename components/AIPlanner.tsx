
import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Loader2, Download, Printer, RotateCcw, Image as ImageIcon, Clock, GraduationCap, AlertCircle, PlayCircle, Layers, ClipboardList, Target, User, CalendarDays, BookOpen, PenTool, Languages, FileText, Save, CheckCircle2, ShieldCheck, WifiOff, ZapOff, KeyRound, X, ChevronRight } from 'lucide-react';
import { LessonPlan, Language, BoardType } from '../types.ts';
import { generateLessonPlan, generateLessonDiagram, normalizeLessonPlan } from '../services/geminiService.ts';
import { storageService } from '../services/storageService.ts';
import { offlineCacheService, PRELOADED_OFFLINE_LESSON_PLANS } from '../services/offlineCacheService.ts';
import { exportToPdf, exportToWord } from '../lib/exportUtils.ts';
import { trackEvent } from '../services/analytics.ts';

declare var html2pdf: any;

const AIPlanner: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [error, setError] = useState<{ message: string; type: 'network' | 'quota' | 'key' | 'blocked' | 'generic' } | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const [teacherName, setTeacherName] = useState('Mr. Coach');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [board, setBoard] = useState<BoardType>(BoardType.CBSE);
  const [grade, setGrade] = useState('6');
  const [sport, setSport] = useState('Football');
  const [topic, setTopic] = useState('Dribbling and Passing');
  const [duration, setDuration] = useState('40 min');
  const [language, setLanguage] = useState<Language>('English');
  const [equipment, setEquipment] = useState<string[]>(['Cones', 'Footballs']);
  
  const EQUIPMENT_OPTIONS = [
    "Cones", "Bibs / Pinnies", "Footballs", "Basketballs", 
    "Volleyballs", "Tennis Balls", "Whistle", "Stopwatch", 
    "Agility Ladders", "Skipping Ropes", "Hula Hoops", "Mats"
  ];
  
  const [plan, setPlan] = useState<LessonPlan | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [showOfflineModal, setShowOfflineModal] = useState(false);

  const handleLoadOfflineTemplate = (item: typeof PRELOADED_OFFLINE_LESSON_PLANS[0]) => {
    const normalized = normalizeLessonPlan(item.content, {
      topic: item.metadata?.topic || item.title,
      subject: item.metadata?.sport || 'Physical Education',
      grade: item.metadata?.grade || '6-8',
      date: new Date().toISOString().split('T')[0]
    });
    setPlan(normalized);
    setSport(item.metadata?.sport || 'PE Activity');
    setTopic(item.metadata?.topic || 'Field Skills');
    setShowOfflineModal(false);
  };

  const handleSaveToHistory = () => {
    if (!plan) return;
    storageService.saveItem({
      type: 'Lesson Plan',
      title: `${sport} - ${topic} (Grade ${grade})`,
      content: plan,
      metadata: { sport, grade, topic, date }
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleGenerate = async () => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setShowOfflineModal(true);
      setError({
        message: 'Outdoor Offline Mode Active: You are currently offline. Select from pre-loaded PE field templates or saved plans below.',
        type: 'network'
      });
      return;
    }

    setLoading(true);
    setLoadingStep(`Generating in ${language}...`);
    setError(null);
    try {
      const generated = await generateLessonPlan(
        board, 
        grade, 
        sport, 
        topic, 
        teacherName, 
        duration, 
        date,
        language,
        equipment.join(', ') || 'None'
      );
      
      const normalizedPlan = normalizeLessonPlan({ 
        ...generated, 
        period: "1",
        termWeek: "Term 1 / Wk 2",
        teacher: teacherName,
        date: date,
        duration: duration
      });
      setPlan(normalizedPlan);

      setLoadingStep('Visualizing Drills...');
      
      // Parallel generation for speed
      const [warmupUrl, explanationUrl, gameUrl] = await Promise.all([
        generateLessonDiagram(normalizedPlan.warmupDiagramPrompt, 'warmup drill'),
        generateLessonDiagram(normalizedPlan.explanationDiagramPrompt, 'technical skill demonstration'),
        generateLessonDiagram(normalizedPlan.gameDiagramPrompt, 'small sided game')
      ]);
      
      setPlan(prev => prev ? ({ 
        ...prev, 
        warmupDiagramUrl: warmupUrl, 
        explanationDiagramUrl: explanationUrl,
        gameDiagramUrl: gameUrl 
      }) : null);

      trackEvent('resource_viewed', {
        resource_name: `${sport} - ${topic} (Grade ${grade})`,
        category: 'Lesson Plan'
      });

    } catch (err: any) {
      console.error(err);
      const message = err.message || "An unexpected error occurred.";
      let type: 'network' | 'quota' | 'key' | 'blocked' | 'generic' = 'generic';

      if (message.includes("Internet") || message.includes("network")) type = 'network';
      else if (message.includes("Quota") || message.includes("RESOURCE_EXHAUSTED")) type = 'quota';
      else if (message.includes("API_KEY_INVALID") || message.includes("api key not valid")) type = 'key';
      else if (message.includes("blocked") || message.includes("safety")) type = 'blocked';

      setError({ message, type });
    } finally {
      setLoading(false);
      setLoadingStep('');
    }
  };

  const handleExportPdf = () => {
    trackEvent('resource_downloaded', {
      resource_name: plan ? plan.topic : `${sport} - ${topic} (Grade ${grade})`,
      resource_type: 'Lesson Plan',
      format: 'PDF'
    });
    exportToPdf(contentRef.current, `LessonPlan_${sport}_${grade}_${language}`).catch(err => {
      console.error("PDF Export error:", err);
    });
  };

  const handleExportWord = () => {
    if (!plan) return;
    
    trackEvent('resource_downloaded', {
      resource_name: plan.topic,
      resource_type: 'Lesson Plan',
      format: 'Word'
    });
    
    const html = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word'>
      <head><meta charset='utf-8'><title>PE Lesson Plan</title>
      <style>
        body { font-family: Calibri, Arial, sans-serif; padding: 20px; }
        h1 { color: #1e3a8a; text-transform: uppercase; font-size: 24px; border-bottom: 2px solid #1e3a8a; }
        h2 { color: #4f46e5; border-bottom: 2px solid #e5e7eb; padding-bottom: 5px; font-size: 18px; margin-top: 20px; }
        .section-title { font-weight: bold; color: #1e3a8a; text-transform: uppercase; font-size: 14px; margin-top: 20px; border-bottom: 1px solid #eee; padding-bottom: 5px; }
        .meta { color: #666; font-size: 12px; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th, td { border: 1px solid #d1d5db; padding: 8px; text-align: left; font-size: 12px; }
        th { background-color: #f3f4f6; font-weight: bold; }
        ul { margin-top: 5px; }
        li { margin-bottom: 5px; font-size: 12px; }
      </style>
      </head>
      <body>
        <h1>${sport}: ${plan.topic}</h1>
        <div class="meta">
            <b>Grade:</b> ${grade} | <b>Board:</b> ${board} | <b>Teacher:</b> ${plan.teacher}<br/>
            <b>Date:</b> ${plan.date} | <b>Duration:</b> ${plan.duration} | <b>Period:</b> ${plan.period}
        </div>
        
        <div class="section-title">Learning Objectives</div>
        <ul>
          <li><b>Know:</b> ${plan.objectives?.know || 'TBD'}</li>
          <li><b>Understand:</b> ${plan.objectives?.understand || 'TBD'}</li>
          <li><b>Apply:</b> ${plan.objectives?.beAbleTo || 'TBD'}</li>
        </ul>

        <div class="section-title">Success Criteria</div>
        <ul>
          <li><b>All:</b> ${plan.successCriteria?.all || 'TBD'}</li>
          <li><b>Most:</b> ${plan.successCriteria?.most || 'TBD'}</li>
          <li><b>Some:</b> ${plan.successCriteria?.some || 'TBD'}</li>
        </ul>

        <div class="section-title">Equipment & Safety</div>
        <p><b>Equipment:</b> ${Array.isArray(plan.equipment) ? plan.equipment.join(', ') : (plan.equipment || 'None')}</p>
        <p><b>Teaching Aids:</b> ${Array.isArray(plan.teachingAids) ? plan.teachingAids.join(', ') : (plan.teachingAids || 'None')}</p>
        <p><b>Safety:</b> ${Array.isArray(plan.safety) ? plan.safety.join(', ') : (plan.safety || 'Standard PE safety protocols')}</p>
        <p><b>Vocabulary:</b> ${Array.isArray(plan.keyVocabulary) ? plan.keyVocabulary.join(', ') : (plan.keyVocabulary || 'None')}</p>

        <div class="section-title">1. Starter Activity (${plan.starter?.time || '10 min'})</div>
        <p><b>${plan.starter?.title || 'Warm-up'}</b></p>
        <p>${plan.starter?.description || 'General warm-up.'}</p>

        <div class="section-title">2. Main Activities (${plan.mainActivity?.time || '30 min'})</div>
        ${(Array.isArray(plan.mainActivity?.activities) ? plan.mainActivity.activities : []).map((act, i) => `
          <p><b>${i+1}. ${act.title || 'Activity'}</b></p>
          <p>${act.description || ''}</p>
          <p><i>Coaching Points: ${Array.isArray(act.coachingPoints) ? act.coachingPoints.join(', ') : (act.coachingPoints || '')}</i></p>
        `).join('')}

        <div class="section-title">3. Plenary & Cooling Down (${plan.plenary?.time || '10 min'})</div>
        <p><b>${plan.plenary?.title || 'Cool Down'}</b></p>
        <p>${plan.plenary?.description || 'Gentle stretching and review.'}</p>

        <div class="section-title">Differentiation & Assessment</div>
        <p><b>Differentiation:</b> ${plan.differentiation || 'N/A'}</p>
        <p><b>Assessment:</b> ${plan.criticalThinking || 'N/A'}</p>
      </body>
      </html>
    `;

    exportToWord(html, `LessonPlan_${sport}_${grade}`);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
      <div className="lg:col-span-4 space-y-8 animate-slide-up print:hidden">
        <div className="bg-white p-8 rounded-[2rem] shadow-xl shadow-indigo-100/50 border border-slate-100 sticky top-8">
          <div className="flex items-center space-x-4 mb-8">
            <div className="p-3 bg-indigo-600 rounded-2xl text-white shadow-lg shadow-indigo-200 rotate-2">
              <Sparkles size={24} />
            </div>
            <div>
              <h3 className="font-black text-xl text-slate-800 tracking-tighter uppercase leading-none">PE Lesson Plan</h3>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Curriculum Design Studio</p>
            </div>
          </div>
          
          <div className="space-y-5">
             {/* Language Selector */}
            <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                <label className="flex items-center text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-2 px-1">
                    <Languages size={12} className="mr-1" /> Output Language
                </label>
                <select 
                    className="w-full bg-white border border-indigo-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-indigo-900 text-sm"
                    value={language}
                    onChange={e => setLanguage(e.target.value as Language)}
                >
                    <option value="English">English</option>
                    <option value="Hindi">Hindi (हिंदी)</option>
                    <option value="Marathi">Marathi (मराठी)</option>
                    <option value="Tamil">Tamil (தமிழ்)</option>
                    <option value="Bengali">Bengali (বাংলা)</option>
                </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="group">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Teacher</label>
                <input type="text" className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-100 font-bold text-slate-700 text-sm" value={teacherName} onChange={e => setTeacherName(e.target.value)} />
               </div>
               <div className="group">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Date</label>
                <input type="date" className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-100 font-bold text-slate-700 text-sm" value={date} onChange={e => setDate(e.target.value)} />
               </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="group">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Board</label>
                <select 
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-100 font-bold text-slate-700 text-sm"
                  value={board}
                  onChange={e => setBoard(e.target.value as BoardType)}
                >
                  {Object.values(BoardType).map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div className="group">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Grade</label>
                <select 
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-100 font-bold text-slate-700 text-sm"
                  value={grade}
                  onChange={e => setGrade(e.target.value)}
                >
                  {[...Array(12)].map((_, i) => <option key={i} value={String(i + 1)}>{i + 1}</option>)}
                </select>
              </div>
            </div>

            <div className="group">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Sport / Activity</label>
              <input type="text" className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-100 font-bold text-slate-700 text-sm" value={sport} onChange={e => setSport(e.target.value)} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="group">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Specific Topic</label>
                <input type="text" className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-100 font-bold text-slate-700 text-sm" value={topic} onChange={e => setTopic(e.target.value)} />
              </div>
              <div className="group">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Duration</label>
                <select 
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-100 font-bold text-slate-700 text-sm"
                  value={duration}
                  onChange={e => setDuration(e.target.value)}
                >
                  <option value="30 min">30 Minutes</option>
                  <option value="40 min">40 Minutes</option>
                  <option value="45 min">45 Minutes</option>
                  <option value="50 min">50 Minutes</option>
                  <option value="60 min">60 Minutes</option>
                  <option value="90 min">90 Minutes</option>
                </select>
              </div>
            </div>

            <div className="group">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1 flex justify-between items-center">
                <span>Smart Equipment</span>
                <span className="text-indigo-500 normal-case font-bold">{equipment.length} selected</span>
              </label>
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex flex-wrap gap-2 max-h-48 overflow-y-auto">
                {EQUIPMENT_OPTIONS.map(item => {
                  const isSelected = equipment.includes(item);
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setEquipment(prev => isSelected ? prev.filter(i => i !== item) : [...prev, item])}
                      className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all flex items-center ${
                        isSelected 
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' 
                          : 'bg-white text-slate-500 border border-slate-200 hover:border-indigo-300 hover:text-indigo-600'
                      }`}
                    >
                      {isSelected && <CheckCircle2 size={12} className="mr-1" />}
                      <span>{item}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <button 
              onClick={handleGenerate} 
              disabled={loading} 
              className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center space-x-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="animate-spin" /> : <Sparkles size={20} />}
              <span className="text-sm uppercase tracking-wider">{loading ? loadingStep || 'Processing...' : 'Generate Plan'}</span>
            </button>

            <button 
              onClick={() => setShowOfflineModal(true)} 
              type="button"
              className="w-full py-3.5 bg-amber-500 text-slate-950 border-2 border-amber-600 rounded-2xl font-extrabold shadow-md hover:bg-amber-400 transition-all flex items-center justify-center space-x-2 cursor-pointer"
            >
              <WifiOff size={16} />
              <span className="text-xs uppercase tracking-wider">⚡ Offline Field Templates & Plans</span>
            </button>
            
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 rounded-xl border-2 flex flex-col space-y-3 ${
                  error.type === 'quota' ? 'bg-amber-50 border-amber-200 text-amber-900' :
                  error.type === 'key' ? 'bg-indigo-50 border-indigo-200 text-indigo-900' :
                  'bg-red-50 border-red-200 text-red-900'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className="mt-0.5">
                    {error.type === 'network' && <WifiOff size={18} />}
                    {error.type === 'quota' && <ZapOff size={18} />}
                    {error.type === 'key' && <KeyRound size={18} />}
                    {(error.type === 'blocked' || error.type === 'generic') && <AlertCircle size={18} />}
                  </div>
                  <div>
                    <h5 className="font-black text-[10px] uppercase tracking-widest mb-1">
                      {error.type === 'network' ? 'Connection Error' :
                       error.type === 'quota' ? 'System Busy / Quota' :
                       error.type === 'key' ? 'License / API Issue' :
                       error.type === 'blocked' ? 'Content Blocked' : 'Intelligence Error'}
                    </h5>
                    <p className="text-xs font-bold leading-relaxed">{error.message}</p>
                    
                    {error.type === 'quota' && (
                      <p className="text-[10px] mt-2 opacity-70 italic font-medium">Tip: Try simplifying the lesson topic or using a different browser session.</p>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button 
                    onClick={handleGenerate}
                    className={`w-full py-2.5 rounded-lg font-black text-xs uppercase tracking-widest transition-all ${
                      error.type === 'quota' ? 'bg-amber-900 text-white hover:bg-black' :
                      error.type === 'key' ? 'bg-indigo-900 text-white hover:bg-indigo-800' :
                      'bg-red-900 text-white hover:bg-black'
                    }`}
                  >
                    Try Again
                  </button>
                </div>
              </motion.div>
            )}

            {/* Security Note */}
            <div className="pt-4 border-t border-slate-100">
               <div className="flex items-center space-x-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                  <ShieldCheck size={12} className="text-emerald-500" />
                  <span>Privacy & Security Audit Pass</span>
               </div>
               <p className="text-[9px] text-slate-400 mt-1 leading-tight font-medium">
                  We collect NO personally identifiable information (PII) beyond what you provide for your lesson records. API keys are strictly server-side (zero exposure).
               </p>
            </div>
          </div>
        </div>
      </div>

      <div className="lg:col-span-8">
           {!plan ? (
             <div className="bg-white border-4 border-dashed border-slate-100 rounded-[2.5rem] h-full min-h-[600px] flex flex-col items-center justify-center p-12 text-center relative overflow-hidden">
               {/* Architect Blueprint Background Elements */}
               <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
               
               <motion.div 
                 initial={{ scale: 0.9, opacity: 0 }}
                 animate={{ scale: 1, opacity: 1 }}
                 className="relative z-10"
               >
                 <div className="w-32 h-32 bg-slate-50 rounded-[2rem] flex items-center justify-center mb-8 shadow-inner border border-slate-100 mx-auto">
                   <PenTool size={48} className="text-indigo-400" />
                 </div>
                 <h3 className="text-4xl font-black text-slate-900 mb-4 uppercase tracking-tighter">Architect's Canvas</h3>
                 <p className="text-slate-400 font-medium max-w-sm mx-auto text-lg leading-relaxed">
                   Configure your parameters on the left to begin designing your professional PE curriculum.
                 </p>
                 
                 {/* Animated Decorative Elements */}
                 <div className="mt-12 flex justify-center space-x-4">
                   {[1,2,3].map(i => (
                     <motion.div 
                       key={i}
                       animate={{ y: [0, -10, 0] }}
                       transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
                       className="w-3 h-3 rounded-full bg-indigo-200"
                     />
                   ))}
                 </div>
               </motion.div>
             </div>
           ) : (
             <div className="bg-white rounded-[2.5rem] p-12 shadow-sm border border-slate-100 animate-in fade-in slide-in-from-bottom-8 duration-700">
               <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-10 pb-6 border-b border-slate-100 print:hidden gap-4">
                 <h2 className="text-2xl md:text-3xl font-black text-slate-800 uppercase tracking-tighter">Plan Preview</h2>
                 <div className="flex flex-wrap gap-2 md:gap-3">
                    <button 
                      onClick={handleSaveToHistory}
                      disabled={isSaved}
                      className={`px-4 md:px-6 py-2.5 md:py-3 rounded-xl font-bold flex items-center space-x-2 transition-all shadow-lg text-xs md:text-sm ${isSaved ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'}`}
                    >
                      {isSaved ? <CheckCircle2 size={18} /> : <Save size={18} />}
                      <span>{isSaved ? 'Saved' : 'Save'}</span>
                    </button>
                    <button onClick={() => {setPlan(null); setLanguage('English');}} className="p-2.5 md:p-3 text-slate-400 hover:text-indigo-600 font-bold flex items-center space-x-2 text-xs md:text-sm">
                       <RotateCcw size={14} /> <span>Reset</span>
                    </button>
                    <button onClick={handleExportWord} className="bg-blue-50 text-blue-700 px-4 md:px-6 py-2.5 md:py-3 rounded-xl font-bold flex items-center space-x-2 hover:bg-blue-100 transition-all text-xs md:text-sm">
                       <FileText size={16} /> <span>Word</span>
                     </button>
                     <button onClick={handleExportPdf} className="bg-indigo-600 text-white px-4 md:px-6 py-2.5 md:py-3 rounded-xl font-bold flex items-center space-x-2 shadow-lg hover:bg-indigo-700 transition-all text-xs md:text-sm">
                        <Download size={16} /> <span>PDF</span>
                    </button>
                 </div>
               </div>

               {/* Printable Area */}
               <div ref={contentRef} className="space-y-8 text-slate-900" id="print-area">
                  <div className="flex justify-between items-start border-b-2 border-slate-900 pb-6 mb-8">
                    <div>
                      <h1 className="text-4xl font-black uppercase tracking-tighter mb-2">{sport}</h1>
                      <input 
                        className="text-xl text-slate-600 font-medium bg-transparent border-b border-transparent hover:border-slate-200 focus:border-indigo-500 outline-none w-full"
                        value={plan.topic}
                        onChange={(e) => setPlan({...plan, topic: e.target.value})}
                      />
                    </div>
                    <div className="text-right">
                       <div className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Grade {grade}</div>
                       <div className="text-lg font-black">{board} Curriculum</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-4 mb-8 bg-slate-50 p-6 rounded-2xl border border-slate-100 print:bg-transparent print:border-slate-300">
                     <div>
                       <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Date</span>
                       <span className="font-bold">{plan.date}</span>
                     </div>
                     <div>
                       <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Duration</span>
                       <span className="font-bold">{plan.duration}</span>
                     </div>
                     <div>
                       <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Teacher</span>
                       <span className="font-bold">{plan.teacher}</span>
                     </div>
                     <div>
                       <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Period</span>
                       <span className="font-bold">{plan.period}</span>
                     </div>
                  </div>

                  {/* Equipment & Safety */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                     <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                        <h4 className="font-black text-slate-800 uppercase tracking-widest text-xs mb-3">Equipment & Teaching Aids</h4>
                        <div className="flex flex-wrap gap-2 mb-4">
                           {(Array.isArray(plan.equipment) ? plan.equipment : (typeof plan.equipment === 'string' && plan.equipment ? [plan.equipment] : [])).map((item, i) => (
                             <span key={i} className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600">{typeof item === 'object' ? JSON.stringify(item) : String(item)}</span>
                           ))}
                        </div>
                        <div className="flex flex-wrap gap-2">
                           {(Array.isArray(plan.teachingAids) ? plan.teachingAids : (typeof plan.teachingAids === 'string' && plan.teachingAids ? [plan.teachingAids] : [])).map((item, i) => (
                             <span key={i} className="px-3 py-1 bg-indigo-50 border border-indigo-100 rounded-lg text-xs font-bold text-indigo-600">{typeof item === 'object' ? JSON.stringify(item) : String(item)}</span>
                           ))}
                        </div>
                     </div>
                     <div className="bg-red-50 p-6 rounded-2xl border border-red-100">
                        <h4 className="font-black text-red-800 uppercase tracking-widest text-xs mb-3">Safety & Vocabulary</h4>
                        <ul className="list-disc list-inside space-y-1 mb-4">
                           {(Array.isArray(plan.safety) ? plan.safety : (typeof plan.safety === 'string' && plan.safety ? [plan.safety] : [])).map((item, i) => (
                             <li key={i} className="text-xs font-bold text-red-700">{typeof item === 'object' ? JSON.stringify(item) : String(item)}</li>
                           ))}
                        </ul>
                        <div className="flex flex-wrap gap-2">
                           {(Array.isArray(plan.keyVocabulary) ? plan.keyVocabulary : (typeof plan.keyVocabulary === 'string' && plan.keyVocabulary ? [plan.keyVocabulary] : [])).map((item, i) => (
                             <span key={i} className="px-2 py-1 bg-white border border-slate-200 rounded text-[10px] font-black uppercase tracking-tighter text-slate-500">{typeof item === 'object' ? JSON.stringify(item) : String(item)}</span>
                           ))}
                        </div>
                     </div>
                  </div>

                  {/* Learning Objectives */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                     <div className="space-y-4">
                        <h4 className="font-black text-indigo-600 uppercase tracking-widest text-sm border-b pb-2">Learning Objectives</h4>
                        <div className="space-y-3">
                           <div className="flex items-start">
                             <span className="w-2 h-2 bg-indigo-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                             <p className="text-sm"><strong>Know:</strong> {plan.objectives?.know || 'TBD'}</p>
                           </div>
                           <div className="flex items-start">
                             <span className="w-2 h-2 bg-indigo-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                             <p className="text-sm"><strong>Understand:</strong> {plan.objectives?.understand || 'TBD'}</p>
                           </div>
                           <div className="flex items-start">
                             <span className="w-2 h-2 bg-indigo-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                             <p className="text-sm"><strong>Apply:</strong> {plan.objectives?.beAbleTo || 'TBD'}</p>
                           </div>
                        </div>
                     </div>
                     <div className="space-y-4">
                        <h4 className="font-black text-emerald-600 uppercase tracking-widest text-sm border-b pb-2">Success Criteria</h4>
                        <div className="space-y-3">
                           <div className="flex items-start">
                             <Target size={14} className="mt-1 mr-3 text-emerald-500 flex-shrink-0" />
                             <p className="text-sm"><strong>All:</strong> {plan.successCriteria?.all || 'TBD'}</p>
                           </div>
                           <div className="flex items-start">
                             <Target size={14} className="mt-1 mr-3 text-emerald-500 flex-shrink-0" />
                             <p className="text-sm"><strong>Most:</strong> {plan.successCriteria?.most || 'TBD'}</p>
                           </div>
                           <div className="flex items-start">
                             <Target size={14} className="mt-1 mr-3 text-emerald-500 flex-shrink-0" />
                             <p className="text-sm"><strong>Some:</strong> {plan.successCriteria?.some || 'TBD'}</p>
                           </div>
                        </div>
                     </div>
                  </div>

                  {/* Lesson Phases */}
                  <div className="space-y-6">
                    {/* Starter */}
                    <div className="border-l-4 border-indigo-500 pl-6 py-2">
                       <div className="flex justify-between items-center mb-2">
                          <h4 className="font-black text-slate-800 text-lg">1. Starter Activity</h4>
                          <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-black rounded-full uppercase">{typeof plan.starter?.time === 'object' ? JSON.stringify(plan.starter?.time) : plan.starter?.time}</span>
                       </div>
                       <p className="font-bold text-slate-700 mb-1">{typeof plan.starter?.title === 'object' ? JSON.stringify(plan.starter?.title) : plan.starter?.title}</p>
                       <p className="text-slate-600 text-sm mb-4 leading-relaxed">{typeof plan.starter?.description === 'object' ? JSON.stringify(plan.starter?.description) : plan.starter?.description}</p>
                       {plan.warmupDiagramUrl && (
                         <div className="w-48 h-32 bg-slate-100 rounded-xl overflow-hidden border border-slate-200">
                           <img src={plan.warmupDiagramUrl} className="w-full h-full object-cover" alt="Warmup" />
                         </div>
                       )}
                    </div>

                    {/* Main */}
                    <div className="border-l-4 border-orange-500 pl-6 py-2">
                       <div className="flex justify-between items-center mb-4">
                          <h4 className="font-black text-slate-800 text-lg">2. Main Activities</h4>
                          <span className="px-3 py-1 bg-orange-50 text-orange-700 text-xs font-black rounded-full uppercase">{typeof plan.mainActivity?.time === 'object' ? JSON.stringify(plan.mainActivity?.time) : plan.mainActivity?.time}</span>
                       </div>
                       
                        <div className="space-y-6">
                         {(Array.isArray(plan.mainActivity?.activities) ? plan.mainActivity.activities : []).map((act, i) => (
                           <div key={i} className="bg-slate-50 p-5 rounded-2xl print:bg-transparent print:p-0 print:mb-4">
                              <h5 className="font-bold text-slate-800 mb-2 flex items-center">
                                <span className="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs mr-2">{i+1}</span>
                                {typeof act.title === 'object' ? JSON.stringify(act.title) : String(act.title || `Activity ${i+1}`)}
                              </h5>
                              <p className="text-slate-600 text-sm mb-3 leading-relaxed">{typeof act.description === 'object' ? JSON.stringify(act.description) : String(act.description || '')}</p>
                              <div>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Coaching Points</span>
                                <div className="flex flex-wrap gap-2 mt-2">
                                  {(Array.isArray(act.coachingPoints) ? act.coachingPoints : (typeof act.coachingPoints === 'string' && act.coachingPoints ? [act.coachingPoints] : [])).map((cp, cpi) => (
                                    <span key={cpi} className="px-2 py-1 bg-white border border-slate-200 rounded text-xs text-slate-600">
                                      {typeof cp === 'object' ? JSON.stringify(cp) : String(cp)}
                                    </span>
                                  ))}
                                </div>
                              </div>
                           </div>
                         ))}
                       </div>
                       
                       <div className="flex gap-4 mt-4">
                          {plan.explanationDiagramUrl && (
                            <div className="w-1/2 h-40 bg-slate-100 rounded-xl overflow-hidden border border-slate-200 relative">
                              <span className="absolute top-2 left-2 bg-black/50 text-white text-[10px] font-bold px-2 py-1 rounded">Technical</span>
                              <img src={plan.explanationDiagramUrl} className="w-full h-full object-cover" alt="Drill" />
                            </div>
                          )}
                          {plan.gameDiagramUrl && (
                            <div className="w-1/2 h-40 bg-slate-100 rounded-xl overflow-hidden border border-slate-200 relative">
                               <span className="absolute top-2 left-2 bg-black/50 text-white text-[10px] font-bold px-2 py-1 rounded">Game</span>
                              <img src={plan.gameDiagramUrl} className="w-full h-full object-cover" alt="Game" />
                            </div>
                          )}
                       </div>
                    </div>

                    {/* Plenary */}
                    <div className="border-l-4 border-emerald-500 pl-6 py-2">
                       <div className="flex justify-between items-center mb-2">
                          <h4 className="font-black text-slate-800 text-lg">3. Plenary & Cooling Down</h4>
                          <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-black rounded-full uppercase">{typeof plan.plenary?.time === 'object' ? JSON.stringify(plan.plenary?.time) : plan.plenary?.time}</span>
                       </div>
                       <p className="font-bold text-slate-700 mb-1">{typeof plan.plenary?.title === 'object' ? JSON.stringify(plan.plenary?.title) : plan.plenary?.title}</p>
                       <p className="text-slate-600 text-sm leading-relaxed">{typeof plan.plenary?.description === 'object' ? JSON.stringify(plan.plenary?.description) : plan.plenary?.description}</p>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="grid grid-cols-2 gap-8 pt-8 border-t border-slate-200 mt-8">
                     <div>
                       <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Differentiation (SEN/High Ability)</h5>
                       <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg">{typeof plan.differentiation === 'object' ? JSON.stringify(plan.differentiation) : plan.differentiation}</p>
                     </div>
                     <div>
                       <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Assessment Opportunities</h5>
                       <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg">{typeof plan.criticalThinking === 'object' ? JSON.stringify(plan.criticalThinking) : plan.criticalThinking}</p>
                     </div>
                  </div>
               </div>
             </div>
           )}
        </div>

        {/* Offline Field Templates Modal */}
        <AnimatePresence>
          {showOfflineModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fadeIn">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full max-h-[85vh] overflow-y-auto border-2 border-slate-900 shadow-2xl relative"
              >
                <button 
                  onClick={() => setShowOfflineModal(false)}
                  className="absolute top-5 right-5 p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-700 transition-all cursor-pointer"
                >
                  <X size={20} />
                </button>

                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-amber-500 text-slate-950 rounded-2xl font-black">
                    <WifiOff size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Outdoor Offline PE Field Templates</h3>
                    <p className="text-xs font-bold text-slate-500">Access cached & pre-loaded PE lesson plans with zero internet connection required</p>
                  </div>
                </div>

                <div className="space-y-4 mb-6">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">Pre-Loaded Sports & Activities</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {offlineCacheService.getOfflineLessonPlans().map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleLoadOfflineTemplate(item)}
                        className="p-4 bg-slate-50 hover:bg-amber-50 border-2 border-slate-200 hover:border-amber-500 rounded-2xl text-left transition-all group flex flex-col justify-between cursor-pointer"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-black uppercase tracking-wider bg-amber-200 text-amber-900 px-2 py-0.5 rounded-md">
                              {item.metadata?.sport || item.type}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400">{item.metadata?.grade ? `Grade ${item.metadata.grade}` : 'Field Plan'}</span>
                          </div>
                          <h5 className="font-extrabold text-sm text-slate-900 group-hover:text-amber-900 transition-colors line-clamp-2">
                            {item.title}
                          </h5>
                        </div>
                        <div className="mt-3 flex items-center justify-between text-[11px] font-black text-amber-600">
                          <span>Load Offline Plan</span>
                          <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-indigo-50 border border-indigo-200 p-4 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-2 text-indigo-900 text-xs font-bold">
                    <ShieldCheck size={18} className="text-indigo-600 shrink-0" />
                    <span>All loaded plans can be printed or exported to PDF offline!</span>
                  </div>
                  <button
                    onClick={() => setShowOfflineModal(false)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-indigo-700 transition-all cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  };

export default AIPlanner;
