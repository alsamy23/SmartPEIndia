import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, 
  Sparkles, 
  Download, 
  Printer, 
  Loader2, 
  AlertTriangle, 
  CheckCircle2, 
  ChevronRight, 
  ArrowLeft,
  Settings,
  Plus,
  Trash2,
  Save,
  Trophy,
  Target,
  Activity,
  Dumbbell,
  Timer
} from 'lucide-react';
import { TestPaper, Language } from '../types.ts';
import { generateTestPaper } from '../services/geminiService.ts';
import { storageService } from '../services/storageService.ts';
import { exportToPdf, exportToWord } from '../lib/exportUtils.ts';
import { useRef } from 'react';

const TestPaperGenerator: React.FC = () => {
  const [grade, setGrade] = useState('12');
  const [selectedChapters, setSelectedChapters] = useState<string[]>([]);
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState('Medium');
  const [testType, setTestType] = useState('Unit Test');
  const [timeAllowed, setTimeAllowed] = useState('1.5 Hours');
  const [maxMarks, setMaxMarks] = useState(35);
  const [language, setLanguage] = useState<Language>('English');
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TestPaper | null>(null);
  const [showMarkingScheme, setShowMarkingScheme] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const chapters12 = [
    "Management of Sporting Events",
    "Children & Women in Sports",
    "Yoga as Preventive measure for Lifestyle Disease",
    "Physical Education & Sports for CWSN",
    "Sports & Nutrition",
    "Test & Measurement in Sports",
    "Physiology & Injuries in Sports",
    "Biomechanics & Sports",
    "Psychology & Sports",
    "Training in Sports"
  ];

  const chapters11 = [
    "Changing Trends & Career in Physical Education",
    "Olympic Value Education",
    "Yoga & Yogic Practices",
    "Physical Education & Sports for CWSN (Divyang)",
    "Physical Fitness, Wellness & Lifestyle",
    "Test, Measurement & Evaluation",
    "Fundamentals of Anatomy & Physiology in Sports",
    "Fundamentals of Kinesiology & Biomechanics in Sports",
    "Psychology & Sports",
    "Training & Doping in Sports"
  ];

  const currentChapters = grade === '12' ? chapters12 : chapters11;

  const toggleChapter = (chapter: string) => {
    setSelectedChapters(prev => 
      prev.includes(chapter) 
        ? prev.filter(c => c !== chapter) 
        : [...prev, chapter]
    );
  };

  const handleGradeChange = (newGrade: string) => {
    setGrade(newGrade);
    setSelectedChapters([]);
    if (newGrade === '12' && (testType === 'Pre-Board' || testType === 'Final Exam')) {
      setMaxMarks(70);
      setTimeAllowed('3 Hours');
    }
  };

  const handleTestTypeChange = (newType: string) => {
    setTestType(newType);
    if (grade === '12' && (newType === 'Pre-Board' || newType === 'Final Exam')) {
      setMaxMarks(70);
      setTimeAllowed('3 Hours');
    } else if (newType === 'Unit Test') {
      setMaxMarks(35);
      setTimeAllowed('1.5 Hours');
    }
  };

  const handleGenerate = async () => {
    if (selectedChapters.length === 0) {
      setError("Please select at least one chapter.");
      return;
    }
    setLoading(true);
    setError(null);
    setLoadingStep("Analyzing Curriculum...");
    
    try {
      setTimeout(() => setLoadingStep("Architecting Questions..."), 2000);
      setTimeout(() => setLoadingStep("Optimizing Marks Distribution..."), 5000);
      setTimeout(() => setLoadingStep("Finalizing Formatting..."), 8000);
      
      const topicString = `Units: ${selectedChapters.join(', ')}. Difficulty: ${difficulty}. Custom context: ${topic}`;
      const data = await generateTestPaper(grade, topicString, testType, timeAllowed, maxMarks, language);
      setResult(data);
    } catch (e: any) {
      console.error(e);
      setError(e.message || "Failed to generate question paper (CBSE).");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    if (!result) return;
    storageService.saveItem({
      type: 'TestPaper',
      title: `${result.title} - ${result.grade}`,
      content: result,
      metadata: { grade, topic, testType }
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const reset = () => {
    setResult(null);
    setTopic('');
    setError(null);
  };

  const handleExportPdf = () => {
    exportToPdf(contentRef.current, `TestPaper_${topic.slice(0, 15)}_${grade}`).catch(err => {
      console.error("PDF Export error:", err);
    });
  };

  const handleExportWord = () => {
    if (!result) return;
    
    let html = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word'>
      <head><meta charset='utf-8'><title>${result.title}</title>
      <style>
        body { font-family: Calibri, Arial, sans-serif; padding: 40px; }
        h1 { text-align: center; text-transform: uppercase; font-size: 20px; margin-bottom: 5px; }
        .school-header { text-align: center; font-weight: bold; margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 10px; }
        .exam-meta { display: table; width: 100%; margin-bottom: 20px; font-weight: bold; font-size: 12px; }
        .meta-row { display: table-row; }
        .meta-cell { display: table-cell; padding: 5px; }
        .instructions { font-size: 11px; margin-bottom: 20px; border: 1px solid #000; padding: 10px; }
        .section-header { background-color: #f3f4f6; padding: 5px; font-weight: bold; margin-top: 20px; border: 1px solid #000; font-size: 12px; }
        .question-box { margin-top: 15px; display: table; width: 100%; }
        .q-num { display: table-cell; width: 30px; font-weight: bold; }
        .q-text { display: table-cell; }
        .q-marks { display: table-cell; width: 60px; text-align: right; font-weight: bold; }
        .options { margin-left: 30px; margin-top: 10px; display: table; width: 100%; }
        .opt-row { display: table-row; }
        .opt-cell { display: table-cell; padding: 3px; font-size: 11px; }
      </style>
      </head>
      <body>
        <div class="school-header">
            <h1>${result.title}</h1>
            <div>Subject: Physical Education</div>
        </div>

        <div class="exam-meta">
            <div class="meta-row">
                <div class="meta-cell">Class: ${result.displayGrade || result.grade}</div>
                <div class="meta-cell" style="text-align:right">Max Marks: ${result.maxMarks}</div>
            </div>
            <div class="meta-row">
                <div class="meta-cell">Time Allowed: ${result.timeAllowed}</div>
                <div class="meta-cell" style="text-align:right">Date: ___________</div>
            </div>
        </div>

        <div class="instructions">
            <b>General Instructions:</b>
            <ul>
                ${(result.generalInstructions || []).map(i => `<li>${i}</li>`).join('')}
            </ul>
        </div>

        ${(result.sections || []).map(section => `
            <div class="section-header">
                SECTION ${section.sectionId || ''} ${section.heading ? `- ${section.heading}` : ''}
                <br/><small>${section.instructions || ''}</small>
            </div>
            ${(section.questions || []).map((q, i) => `
                <div class="question-box">
                    <div class="q-num">${q.questionNumber || i+1}.</div>
                    <div class="q-text">
                        ${q.question}
                        ${q.caseStudyText ? `<div style="margin-top:10px; font-style:italic; background:#f9f9f9; padding:5px; border-left:3px solid #ccc">${q.caseStudyText}</div>` : ''}
                        ${q.options ? `
                            <div class="options">
                                <div class="opt-row">
                                    <div class="opt-cell">(A) ${q.options[0]}</div>
                                    <div class="opt-cell">(B) ${q.options[1] || ''}</div>
                                </div>
                                <div class="opt-row">
                                    <div class="opt-cell">(C) ${q.options[2] || ''}</div>
                                    <div class="opt-cell">(D) ${q.options[3] || ''}</div>
                                </div>
                            </div>
                        ` : ''}
                    </div>
                    <div class="q-marks">(${q.marks})</div>
                </div>
            `).join('')}
        `).join('')}
      </body>
      </html>
    `;
    
    exportToWord(html, `TestPaper_${result.title}`);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header Section */}
      <div className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-[2.5rem] p-10 text-white shadow-2xl border border-white/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[100px] rounded-full" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 blur-[100px] rounded-full" />
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-md border border-white/20 px-4 py-1.5 rounded-full">
              <FileText size={14} className="text-emerald-400" />
              <span className="text-[10px] font-black uppercase tracking-widest">Assessment Engine</span>
            </div>
            <h1 className="text-4xl font-black tracking-tighter">Question Paper <span className="text-emerald-500">Generator (CBSE)</span></h1>
            <p className="text-slate-400 text-sm font-medium max-w-md">
              Create professional question papers in seconds using AI.
            </p>
          </div>
          
          <div className="flex bg-white/5 backdrop-blur-md p-1.5 rounded-2xl border border-white/10">
            <button 
              onClick={() => handleGradeChange('11')}
              className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${grade === '11' ? 'bg-emerald-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
            >
              Class 11
            </button>
            <button 
              onClick={() => handleGradeChange('12')}
              className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${grade === '12' ? 'bg-emerald-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
            >
              Class 12
            </button>
          </div>
        </div>
      </div>

      {!result ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Configuration Panel */}
          <div className="lg:col-span-1 space-y-6">
            {grade === '12' && maxMarks === 70 && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl flex items-center space-x-3">
                <CheckCircle2 size={18} className="text-emerald-500" />
                <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">
                  CBSE 048 Blueprint Enabled
                </p>
              </div>
            )}
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
              <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight flex items-center">
                <Settings className="mr-2 text-emerald-500" size={20} />
                Configuration
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Test Type</label>
                  <select 
                    value={testType}
                    onChange={e => handleTestTypeChange(e.target.value)}
                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-200 font-bold text-slate-700"
                  >
                    <option>Unit Test</option>
                    <option>Half Yearly</option>
                    <option>Pre-Board</option>
                    <option>Final Exam</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Time</label>
                    <input 
                      type="text"
                      value={timeAllowed}
                      onChange={e => setTimeAllowed(e.target.value)}
                      className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-200 font-bold text-slate-700"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Marks</label>
                    <input 
                      type="number"
                      value={maxMarks}
                      onChange={e => setMaxMarks(Number(e.target.value))}
                      className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-200 font-bold text-slate-700"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Language</label>
                  <select 
                    value={language}
                    onChange={e => setLanguage(e.target.value as Language)}
                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-200 font-bold text-slate-700"
                  >
                    <option value="English">English</option>
                    <option value="Hindi">Hindi</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Main Input Panel */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm h-full flex flex-col">
              <div className="flex-1 space-y-8">
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-2xl font-black text-slate-800 tracking-tight">Select Chapters</h3>
                    <button 
                      onClick={() => setSelectedChapters(selectedChapters.length === currentChapters.length ? [] : currentChapters)}
                      className="text-[10px] font-black text-emerald-600 uppercase tracking-widest hover:text-emerald-700"
                    >
                      {selectedChapters.length === currentChapters.length ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {currentChapters.map((ch, idx) => (
                      <button
                        key={idx}
                        onClick={() => toggleChapter(ch)}
                        className={`p-4 rounded-2xl text-left border transition-all flex items-start space-x-3 group ${
                          selectedChapters.includes(ch)
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-900 shadow-sm'
                            : 'bg-white border-slate-100 text-slate-600 hover:border-emerald-200'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-md flex-shrink-0 flex items-center justify-center border transition-colors ${
                          selectedChapters.includes(ch) ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-slate-50 border-slate-200'
                        }`}>
                          {selectedChapters.includes(ch) && <CheckCircle2 size={12} />}
                        </div>
                        <span className="text-xs font-bold leading-tight">{ch}</span>
                      </button>
                    ))}
                  </div>

                  <div className="space-y-4 pt-6 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      <h4 className="text-lg font-black text-slate-800 uppercase tracking-tight">Difficulty & Customization</h4>
                      <select 
                        value={difficulty}
                        onChange={e => setDifficulty(e.target.value)}
                        className="p-2 bg-slate-50 border border-slate-100 rounded-lg outline-none font-bold text-[10px] uppercase text-slate-600 tracking-widest"
                      >
                        <option>Easy</option>
                        <option>Medium</option>
                        <option>Hard</option>
                      </select>
                    </div>
                    <textarea 
                      value={topic}
                      onChange={e => setTopic(e.target.value)}
                      placeholder="Optional: Add specific focus points or special requirements..."
                      className="w-full h-32 p-6 bg-slate-50 border border-slate-100 rounded-[2rem] outline-none focus:ring-2 focus:ring-emerald-200 font-bold text-slate-700 resize-none"
                    />
                  </div>
                </div>

                {error && (
                  <div className="p-6 bg-slate-100 border border-slate-200 rounded-[2rem] flex flex-col space-y-4 text-slate-800">
                    <div className="flex items-center space-x-3">
                      <AlertTriangle size={20} className="text-amber-600" />
                      <p className="text-xs font-black uppercase tracking-tight">{error}</p>
                    </div>
                    <div className="pt-2">
                      <button 
                        onClick={handleGenerate}
                        className="w-full py-3 bg-[#0D2B52] text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-[#164077] transition-all shadow-md"
                      >
                        Retry
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <button 
                onClick={handleGenerate}
                disabled={loading}
                className="w-full py-6 bg-slate-900 text-white rounded-[2rem] font-black text-sm uppercase tracking-[0.2em] hover:bg-slate-800 transition-all flex items-center justify-center space-x-4 shadow-xl shadow-slate-900/20 disabled:opacity-50 relative overflow-hidden group"
              >
                {loading ? (
                  <div className="flex items-center space-x-4">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    >
                      <Loader2 size={24} />
                    </motion.div>
                    <div className="flex flex-col items-start translate-y-0.5">
                      <span className="text-[10px] font-black uppercase tracking-widest opacity-50 leading-none mb-1">{loadingStep || 'Architecting'}</span>
                      <span className="text-xs font-black uppercase tracking-widest leading-none">Generating Paper...</span>
                    </div>
                  </div>
                ) : (
                  <>
                    <Sparkles size={24} className="text-emerald-400 group-hover:scale-125 transition-transform" />
                    <span>Generate Test</span>
                  </>
                )}
                
                {loading && (
                  <motion.div 
                    initial={{ x: '-100%' }}
                    animate={{ x: '100%' }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                  />
                )}
              </button>
              
              {loading && (
                <div className="mt-8 flex justify-center space-x-6">
                  {[Trophy, Target, Activity, Dumbbell].map((Icon, i) => (
                    <motion.div
                      key={i}
                      animate={{ 
                        y: [0, -10, 0],
                        opacity: [0.3, 1, 0.3]
                      }}
                      transition={{ 
                        duration: 1.5, 
                        repeat: Infinity, 
                        delay: i * 0.2 
                      }}
                      className="text-emerald-500"
                    >
                      <Icon size={24} />
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Result Header */}
          <div className="flex items-center justify-between">
            <button onClick={reset} className="flex items-center space-x-2 text-slate-500 hover:text-emerald-500 font-black text-xs uppercase tracking-widest">
              <ArrowLeft size={16} />
              <span>Generate New</span>
            </button>
            <div className="flex space-x-3">
              {result.markingScheme && (
                <button 
                  onClick={() => setShowMarkingScheme(!showMarkingScheme)}
                  className={`px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center space-x-2 ${showMarkingScheme ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white border border-slate-200 text-indigo-600 hover:bg-indigo-50'}`}
                >
                  <Sparkles size={16} />
                  <span>{showMarkingScheme ? 'View Question Paper' : 'View Marking Scheme'}</span>
                </button>
              )}
              <button 
                onClick={handleSave}
                disabled={isSaved}
                className={`px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center space-x-2 ${isSaved ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
              >
                {isSaved ? <CheckCircle2 size={16} /> : <Save size={16} />}
                <span>{isSaved ? 'Saved' : 'Save'}</span>
              </button>
              <button 
                onClick={handleExportWord}
                className="px-6 py-3 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center space-x-2"
              >
                <Download size={16} />
                <span>Export DOCX</span>
              </button>
              <button 
                onClick={handleExportPdf}
                className="px-6 py-3 bg-emerald-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-600 transition-all flex items-center space-x-2"
              >
                <Printer size={16} />
                <span>PDF / PRINT</span>
              </button>
            </div>
          </div>

          {/* Test Preview */}
          <AnimatePresence mode="wait">
            <motion.div 
              key={showMarkingScheme ? 'marking-scheme' : 'question-paper'}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              ref={contentRef}
              className="bg-white rounded-[3rem] p-16 border border-slate-100 shadow-2xl max-w-4xl mx-auto print:shadow-none print:border-none print:p-0 relative overflow-hidden"
            >
              {showMarkingScheme ? (
                <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4">
                  <div className="text-center space-y-4 mb-12 border-b-2 border-slate-900 pb-12">
                    <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Marking Scheme</h2>
                    <p className="text-sm font-black uppercase text-slate-500">{result.title}</p>
                    <div className="flex justify-center items-center space-x-8 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      <span>Subject Code: 048</span>
                      <span>Marks: {result.maxMarks}</span>
                    </div>
                  </div>

                  <div className="space-y-10">
                    {result.markingScheme?.sections.map((section, sIdx) => (
                      <div key={sIdx} className="space-y-4">
                        <div className="bg-slate-900 px-6 py-3 rounded-xl border border-slate-800">
                          <h4 className="font-black text-white uppercase tracking-widest text-xs">
                             Marking Guide • Section {section.sectionId}
                          </h4>
                        </div>
                        <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest w-24">Q.No</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Expected Answer / Value Points</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest w-24 text-right">Marks</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {section.items.map((item, iIdx) => (
                                <tr key={iIdx} className="group hover:bg-slate-50/50 transition-colors">
                                  <td className="px-6 py-5 align-top font-black text-slate-400 text-sm">{item.qNo}</td>
                                  <td className="px-6 py-5 align-top">
                                    <div className="text-sm text-slate-800 font-medium whitespace-pre-wrap leading-relaxed">
                                      {item.answer}
                                    </div>
                                  </td>
                                  <td className="px-6 py-5 align-top text-right">
                                    <span className="inline-flex items-center justify-center bg-emerald-50 text-emerald-700 text-[10px] font-black px-2.5 py-1 rounded-md border border-emerald-100 uppercase tracking-widest">
                                      {item.marks}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  {/* Decorative Background */}
                  <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none">
                    <FileText size={200} />
                  </div>

                  <div className="text-center space-y-4 mb-12 border-b-2 border-slate-900 pb-12">
                    <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">{result.title}</h2>
                    <div className="flex justify-center items-center space-x-8 text-sm font-black uppercase tracking-widest text-slate-500">
                      <span>Class: {result.displayGrade || result.grade}</span>
                      <span>Subject: Physical Education</span>
                      <span>Marks: {result.maxMarks}</span>
                      <span>Time: {result.timeAllowed}</span>
                    </div>
                  </div>

                  <div className="space-y-12">
                    {/* Instructions */}
                    <div className="space-y-4">
                      <h4 className="font-black text-slate-900 uppercase tracking-widest text-xs">General Instructions:</h4>
                      <ul className="space-y-2">
                        {Array.isArray(result.generalInstructions) && result.generalInstructions.map((inst, idx) => (
                          <li key={idx} className="text-sm text-slate-600 font-medium flex items-start">
                            <span className="mr-3 text-slate-400">•</span>
                            {typeof inst === 'object' ? JSON.stringify(inst) : inst}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Sections */}
                    {Array.isArray(result.sections) && result.sections.map((section, sIdx) => (
                      <motion.div 
                        key={sIdx} 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: sIdx * 0.1 }}
                        className="space-y-8"
                      >
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex justify-between items-center">
                          <h4 className="font-black text-slate-900 uppercase tracking-widest text-sm">
                            Section {section.sectionId} {section.heading && `- ${section.heading}`}
                          </h4>
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{section.instructions}</span>
                        </div>

                        <div className="space-y-10">
                          {Array.isArray(section.questions) && section.questions.map((q, qIdx) => (
                            <div key={qIdx} className="space-y-6">
                              <div className="flex justify-between items-start gap-6">
                                <div className="flex-1 space-y-4">
                                  <p className="text-lg font-bold text-slate-800 leading-tight">
                                    <span className="mr-4 text-slate-400">{q.questionNumber || qIdx + 1}.</span>
                                    {typeof q.question === 'object' ? JSON.stringify(q.question) : q.question}
                                  </p>
                                  
                                  {q.options && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-10">
                                      {Array.isArray(q.options) && q.options.map((opt, oIdx) => (
                                        <div key={oIdx} className="text-sm text-slate-600 font-medium flex items-center">
                                          <span className="w-6 h-6 bg-slate-50 rounded-md flex items-center justify-center text-[10px] font-black mr-3 border border-slate-100">
                                            {String.fromCharCode(65 + oIdx)}
                                          </span>
                                          {typeof opt === 'object' ? JSON.stringify(opt) : opt}
                                        </div>
                                      ))}
                                    </div>
                                  )}

                                  {q.caseStudyText && (
                                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 text-sm text-slate-600 italic leading-relaxed">
                                      {typeof q.caseStudyText === 'object' ? JSON.stringify(q.caseStudyText) : q.caseStudyText}
                                    </div>
                                  )}

                                  {q.subQuestions && (
                                    <div className="space-y-6 mt-6 pt-6 border-t border-slate-100">
                                      <div className="flex items-center space-x-2 text-emerald-600 mb-4">
                                        <Target size={14} className="font-black" />
                                        <span className="text-[10px] font-black uppercase tracking-widest leading-none">Analysis Questions</span>
                                      </div>
                                      <div className="grid grid-cols-1 gap-6">
                                        {q.subQuestions.map((sq, sqIdx) => (
                                          <div key={sqIdx} className="space-y-3 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                                            <p className="text-sm font-bold text-slate-700 leading-snug">
                                              <span className="mr-2 text-indigo-500 font-black">{q.questionNumber || qIdx + 1}.{sqIdx + 1}</span>
                                              {sq.question}
                                            </p>
                                            {sq.options && (
                                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-6">
                                                {sq.options.map((sopt, soidx) => (
                                                  <div key={soidx} className="text-[11px] text-slate-600 font-medium flex items-center">
                                                    <span className="w-5 h-5 bg-white rounded flex items-center justify-center text-[10px] font-black mr-2 border border-slate-200">
                                                      {String.fromCharCode(97 + soidx)}
                                                    </span>
                                                    {sopt}
                                                  </div>
                                                ))}
                                              </div>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                                <span className="bg-slate-100 px-3 py-1 rounded-lg text-[10px] font-black text-slate-500 uppercase flex-shrink-0">
                                  {q.marks} Mark{q.marks > 1 ? 's' : ''}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default TestPaperGenerator;
