import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  HelpCircle, 
  FileText, 
  Loader2, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  GraduationCap, 
  Languages,
  ArrowLeft,
  Share2,
  Printer,
  ChevronRight,
  Zap,
  Target,
  Search,
  ShieldCheck,
  Save
} from 'lucide-react';
import { BoardType, TheoryContent, Language } from '../types.ts';
import { generateTheoryContent, generateMindMap } from '../services/geminiService.ts';
import { storageService } from '../services/storageService.ts';
import { exportToPdf, exportToWord } from '../lib/exportUtils.ts';
import { useRef } from 'react';

const CHAPTERS_9 = [
  "Strand 1: Athletics, Track Events & Sprint Mechanics",
  "Strand 1: Team Sports Fundamentals & Game Rules (Football, Basketball, Cricket)",
  "Strand 2: Health, Personal Hygiene & Physical Growth Dynamics",
  "Strand 2: Nutrition, Hydration & Sports Safety Protocols",
  "Strand 2: Basic First Aid & Sports Injury Prevention",
  "Strand 3 & 4: SEWA, Yoga Asanas & Fitness Profiling"
];

const CHAPTERS_10 = [
  "Strand 1: Major Games & Athletics Tactics (Track, Jumps, Throws)",
  "Strand 1: Indigenous Games (Kabaddi, Kho-Kho) & Racket Sports",
  "Strand 2: Physical Fitness Benchmarking (Khelo India Battery & BMI)",
  "Strand 2: Health, Postural Deformities & Balanced Nutrition",
  "Strand 3: SEWA & Community Health Action",
  "Strand 4: Health & Activity Card Assessment"
];

const CHAPTERS_11 = [
  "Unit 1: Changing Trends & Career in Physical Education",
  "Unit 2: Olympic Value Education",
  "Unit 3: Yoga & Yogic Practices",
  "Unit 4: Physical Education & Sports for CWSN (Divyang)",
  "Unit 5: Physical Fitness, Wellness and Lifestyle",
  "Unit 6: Test, Measurements & Evaluation",
  "Unit 7: Fundamentals of Anatomy & Physiology in Sports",
  "Unit 8: Fundamentals of Kinesiology & Biomechanics in Sports",
  "Unit 9: Psychology and Sports",
  "Unit 10: Training & Doping in Sports"
];

const CHAPTERS_12 = [
  "Unit 1: Management of Sporting Events",
  "Unit 2: Children and Women in Sports",
  "Unit 3: Yoga as Preventive Measure for Lifestyle Disease",
  "Unit 4: Physical Education & Sports for CWSN (Divyang)",
  "Unit 5: Sports & Nutrition",
  "Unit 6: Test and Measurement in Sports",
  "Unit 7: Physiology & Injuries in Sports",
  "Unit 8: Biomechanics and Sports",
  "Unit 9: Psychology and Sports",
  "Unit 10: Training in Sports"
];

const TheoryHub: React.FC = () => {
  const [grade, setGrade] = useState('12');
  const [board, setBoard] = useState<BoardType>(BoardType.CBSE);
  const [selectedChapter, setSelectedChapter] = useState<string | null>(null);
  const [customTopic, setCustomTopic] = useState('');
  const [viewMode, setViewMode] = useState<'chapters' | 'mindmap' | 'content'>('chapters');
  const [mindMapData, setMindMapData] = useState<any>(null);
  const [selectedBranch, setSelectedBranch] = useState<any>(null);
  const [contentType, setContentType] = useState<'Notes' | 'MCQ' | 'CaseStudy'>('Notes');
  const [language, setLanguage] = useState<Language>('English');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TheoryContent | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const handleSaveToHistory = () => {
    if (!result) return;
    storageService.saveItem({
      type: 'Theory',
      title: `${result.title} (${contentType})`,
      content: result,
      metadata: { grade, board, chapter: selectedChapter, topic: selectedBranch?.title, contentType }
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleExportPdf = () => {
    exportToPdf(contentRef.current, `Theory_${result?.title}_Grade${grade}`).catch(err => {
      console.error("PDF Export error:", err);
    });
  };

  const handleExportWord = () => {
    if (!result) return;
    
    const html = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word'>
      <head><meta charset='utf-8'><title>PE Theory: ${result.title}</title>
      <style>
        body { font-family: Calibri, Arial, sans-serif; padding: 20px; }
        h1 { color: #1e3a8a; font-size: 24px; border-bottom: 2px solid #1e3a8a; margin-bottom: 10px; }
        .meta { color: #666; font-size: 11px; margin-bottom: 20px; }
        .content { font-size: 13px; line-height: 1.6; white-space: pre-wrap; margin-bottom: 30px; }
        .question-box { border: 1px solid #ddd; padding: 15px; margin-bottom: 15px; border-radius: 8px; }
        .question { font-weight: bold; margin-bottom: 10px; }
        .answer { color: #059669; font-style: italic; }
      </style>
      </head>
      <body>
        <h1>${result.title}</h1>
        <div class="meta">Class ${grade} • ${selectedChapter} • ${contentType}</div>
        
        <div class="content">${result.content}</div>
        
        ${result.questions && result.questions.length > 0 ? `
          <h2>Questions & Answers</h2>
          ${result.questions.map((q, i) => `
            <div class="question-box">
              <div class="question">${i+1}. ${q.question}</div>
              <div class="answer"><b>Answer:</b> ${q.answer}</div>
            </div>
          `).join('')}
        ` : ''}
      </body>
      </html>
    `;
    
    exportToWord(html, `Theory_${result.title}_Grade${grade}`);
  };

  const getChaptersForGrade = () => {
    switch (grade) {
      case '9': return CHAPTERS_9;
      case '10': return CHAPTERS_10;
      case '11': return CHAPTERS_11;
      case '12': return CHAPTERS_12;
      default: return CHAPTERS_12;
    }
  };

  const chapters = getChaptersForGrade();

  const handleChapterSelect = async (chapter: string) => {
    setSelectedChapter(chapter);
    setLoading(true);
    setError(null);
    setViewMode('mindmap');
    try {
      const data = await generateMindMap(grade, chapter, board);
      if (!data || !data.branches || !Array.isArray(data.branches)) {
        console.error("Malformed mind map response:", data);
        throw new Error("Invalid mind map data received from AI. Please try again.");
      }
      setMindMapData(data);
    } catch (e: any) {
      console.error(e);
      setError(e.message || "Failed to generate mind map. Please try again.");
      // Don't reset view mode, let the error state show in the mindmap view
    } finally {
      setLoading(false);
    }
  };

  const handleFullChapterGenerate = async (type: 'Notes' | 'MCQ' | 'CaseStudy') => {
    if (!selectedChapter) return;
    setContentType(type);
    setLoading(true);
    setError(null);
    setViewMode('content');
    try {
      const data = await generateTheoryContent(grade, `Full Chapter: ${selectedChapter}`, board, type, language);
      setResult(data);
    } catch (e: any) {
      console.error(e);
      setError(e.message || "Failed to generate chapter content.");
    } finally {
      setLoading(false);
    }
  };

  const handleCustomSearch = () => {
    if (!customTopic.trim()) return;
    handleChapterSelect(customTopic);
  };

  const handleBranchSelect = async (branch: any, type: 'Notes' | 'MCQ' | 'CaseStudy') => {
    setSelectedBranch(branch);
    setContentType(type);
    setLoading(true);
    setError(null);
    setViewMode('content');
    try {
      const data = await generateTheoryContent(grade, `${selectedChapter}: ${branch.title}`, board, type, language);
      setResult(data);
    } catch (e: any) {
      console.error(e);
      setError(e.message || "Failed to generate topic content. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const resetView = () => {
    setViewMode('chapters');
    setSelectedChapter(null);
    setMindMapData(null);
    setResult(null);
    setSelectedBranch(null);
    setCustomTopic('');
    setError(null);
  };

  const backToMindMap = () => {
    setViewMode('mindmap');
    setResult(null);
    setSelectedBranch(null);
    setError(null);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header Section */}
      <div className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-[2.5rem] p-10 text-white shadow-2xl border border-white/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/10 blur-[100px] rounded-full" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 blur-[100px] rounded-full" />
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-md border border-white/20 px-4 py-1.5 rounded-full">
              <GraduationCap size={14} className="text-rose-400" />
              <span className="text-[10px] font-black uppercase tracking-widest">CBSE Curriculum 2025-26</span>
            </div>
            <h1 className="text-4xl font-black tracking-tighter">Theory <span className="text-rose-500">Master</span></h1>
            <p className="text-slate-400 text-sm font-medium max-w-md">
              Master the CBSE Physical Education syllabus with interactive mind maps, detailed notes, and practice MCQs.
            </p>
          </div>
          
          <div className="flex flex-wrap bg-white/5 backdrop-blur-md p-1.5 rounded-2xl border border-white/10 gap-1">
            <button 
              onClick={() => { setGrade('9'); resetView(); }}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${grade === '9' ? 'bg-rose-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
            >
              Class 9
            </button>
            <button 
              onClick={() => { setGrade('10'); resetView(); }}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${grade === '10' ? 'bg-rose-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
            >
              Class 10
            </button>
            <button 
              onClick={() => { setGrade('11'); resetView(); }}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${grade === '11' ? 'bg-rose-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
            >
              Class 11
            </button>
            <button 
              onClick={() => { setGrade('12'); resetView(); }}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${grade === '12' ? 'bg-rose-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
            >
              Class 12
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="min-h-[600px]">
        {viewMode === 'chapters' && (
          <div className="space-y-8">
            {/* Search Bar */}
            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center space-x-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input 
                  type="text"
                  value={customTopic}
                  onChange={e => setCustomTopic(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleCustomSearch()}
                  placeholder="Search for any specific topic (e.g. Biomechanics, Sports Management)..."
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-rose-200 font-bold text-slate-700"
                />
              </div>
              <button 
                onClick={handleCustomSearch}
                className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all"
              >
                Search Topic
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {chapters.map((chapter, idx) => (
                <button 
                  key={idx}
                  onClick={() => handleChapterSelect(chapter)}
                  className="group bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:border-rose-200 transition-all text-left relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <BookOpen size={64} className="text-rose-500" />
                  </div>
                  <div className="relative z-10 space-y-4">
                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center font-black text-slate-400 group-hover:bg-rose-500 group-hover:text-white transition-colors">
                      {idx + 1}
                    </div>
                    <h3 className="text-lg font-black text-slate-800 leading-tight group-hover:text-rose-600 transition-colors">{chapter}</h3>
                    <div className="flex items-center text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-rose-400">
                      <span>Explore Mind Map</span>
                      <ChevronRight size={14} className="ml-1" />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {viewMode === 'mindmap' && (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <button onClick={resetView} className="flex items-center space-x-2 text-slate-500 hover:text-rose-500 font-black text-xs uppercase tracking-widest">
                <ArrowLeft size={16} />
                <span>Back to Chapters</span>
              </button>
              <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">{selectedChapter}</h2>
            </div>

            {loading ? (
              <div className="bg-white rounded-[3rem] h-[500px] flex flex-col items-center justify-center border border-slate-100 shadow-sm">
                <Loader2 className="w-12 h-12 text-rose-500 animate-spin mb-4" />
                <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Mapping Curriculum...</p>
              </div>
            ) : error ? (
              <div className="bg-white rounded-[3rem] h-[500px] flex flex-col items-center justify-center border border-slate-100 shadow-sm p-12 text-center">
                <div className="p-4 bg-rose-50 text-rose-500 rounded-full mb-6">
                  <AlertTriangle size={48} />
                </div>
                <h3 className="text-xl font-black text-slate-800 mb-2 uppercase tracking-tight">Generation Failed</h3>
                <p className="text-slate-400 text-sm mb-8 max-w-md">{error}</p>
                <div className="flex flex-wrap gap-4 justify-center">
                  <button 
                    onClick={() => selectedChapter && handleChapterSelect(selectedChapter)}
                    className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center space-x-2"
                  >
                    <Zap size={16} />
                    <span>Try Again</span>
                  </button>
                </div>
              </div>
            ) : mindMapData && (
              <div className="space-y-8">
                {/* Full Chapter Actions */}
                <div className="bg-slate-900 rounded-[2rem] p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-rose-500 rounded-2xl">
                      <BookOpen size={24} />
                    </div>
                    <div>
                      <h4 className="font-black uppercase tracking-tight">Full Chapter Resources</h4>
                      <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Generate comprehensive materials for the entire unit</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button 
                      onClick={() => handleFullChapterGenerate('Notes')}
                      className="px-6 py-3 bg-white/10 hover:bg-rose-500 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-white/10"
                    >
                      Full Notes
                    </button>
                    <button 
                      onClick={() => handleFullChapterGenerate('MCQ')}
                      className="px-6 py-3 bg-white/10 hover:bg-rose-500 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-white/10"
                    >
                      Full MCQs
                    </button>
                    <button 
                      onClick={() => handleFullChapterGenerate('CaseStudy')}
                      className="px-6 py-3 bg-white/10 hover:bg-rose-500 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-white/10"
                    >
                      Full Cases
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-[3rem] p-12 border border-slate-100 shadow-sm min-h-[600px]">
                  {/* Central Node */}
                  <div className="flex justify-center mb-16">
                    <div className="w-80 bg-slate-900 rounded-[2rem] p-8 text-center shadow-2xl border-4 border-rose-500 relative">
                      <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 w-1 h-16 bg-gradient-to-b from-rose-500 to-slate-200" />
                      <span className="text-white font-black text-xl leading-tight uppercase tracking-tighter">{typeof mindMapData.center === 'object' ? JSON.stringify(mindMapData.center) : mindMapData.center}</span>
                    </div>
                  </div>

                  {/* Branches Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {mindMapData.branches.map((branch: any, idx: number) => (
                      <div 
                        key={idx}
                        className="bg-white p-8 rounded-[2.5rem] border-2 border-slate-50 shadow-lg hover:border-rose-500 hover:shadow-rose-100 transition-all group relative"
                      >
                        <div className="absolute -top-4 -left-4 w-10 h-10 bg-rose-500 rounded-xl flex items-center justify-center text-white font-black shadow-lg">
                          {idx + 1}
                        </div>
                        <h4 className="font-black text-slate-800 text-lg mb-3 uppercase tracking-tight leading-tight group-hover:text-rose-600 transition-colors">{typeof branch.title === 'object' ? JSON.stringify(branch.title) : branch.title}</h4>
                        <p className="text-xs text-slate-400 font-medium mb-6 leading-relaxed">{typeof branch.description === 'object' ? JSON.stringify(branch.description) : branch.description}</p>
                        
                        {branch.subTopics && branch.subTopics.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-6">
                            {branch.subTopics.slice(0, 3).map((st: string, sidx: number) => (
                              <span key={sidx} className="text-[9px] font-black uppercase tracking-widest bg-slate-50 text-slate-400 px-2 py-1 rounded-md">
                                {st}
                              </span>
                            ))}
                          </div>
                        )}

                        <div className="grid grid-cols-3 gap-2">
                          <button 
                            onClick={() => handleBranchSelect(branch, 'Notes')}
                            className="py-3 bg-slate-50 hover:bg-rose-500 hover:text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"
                          >
                            Notes
                          </button>
                          <button 
                            onClick={() => handleBranchSelect(branch, 'MCQ')}
                            className="py-3 bg-slate-50 hover:bg-rose-500 hover:text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"
                          >
                            MCQs
                          </button>
                          <button 
                            onClick={() => handleBranchSelect(branch, 'CaseStudy')}
                            className="py-3 bg-slate-50 hover:bg-rose-500 hover:text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"
                          >
                            Cases
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {viewMode === 'content' && (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <button onClick={backToMindMap} className="flex items-center space-x-2 text-slate-500 hover:text-rose-500 font-black text-xs uppercase tracking-widest">
                <ArrowLeft size={16} />
                <span>Back to Mind Map</span>
              </button>
              <div className="flex items-center space-x-4">
                <span className="bg-rose-100 text-rose-700 text-[10px] font-black uppercase px-3 py-1 rounded-full">
                  {contentType === 'CaseStudy' ? 'Case-Based Study' : contentType}
                </span>
                <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">{selectedBranch?.title}</h2>
              </div>
            </div>

            {loading ? (
              <div className="bg-white rounded-[3rem] h-[500px] flex flex-col items-center justify-center border border-slate-100 shadow-sm">
                <Loader2 className="w-12 h-12 text-rose-500 animate-spin mb-4" />
                <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Generating Study Material...</p>
              </div>
            ) : error ? (
              <div className="bg-white rounded-[3rem] h-[500px] flex flex-col items-center justify-center border border-slate-100 shadow-sm p-12 text-center">
                <div className="p-4 bg-rose-50 text-rose-500 rounded-full mb-6">
                  <AlertTriangle size={48} />
                </div>
                <h3 className="text-xl font-black text-slate-800 mb-2 uppercase tracking-tight">Generation Failed</h3>
                <p className="text-slate-400 text-sm mb-8 max-w-md">{error}</p>
                <div className="flex flex-wrap gap-4 justify-center">
                  <button 
                    onClick={() => backToMindMap()}
                    className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all"
                  >
                    Back to Mind Map
                  </button>
                </div>
              </div>
            ) : result && (
              <div className="bg-white rounded-[3rem] p-12 border border-slate-100 shadow-sm">
                <div className="flex justify-between items-center mb-10 pb-6 border-b border-slate-100">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-rose-500 rounded-2xl text-white shadow-lg shadow-rose-200">
                      {contentType === 'Notes' ? <FileText size={24} /> : <HelpCircle size={24} />}
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-slate-800 tracking-tight">{result.title}</h3>
                      <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">CBSE Class {grade} • {selectedChapter}</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button 
                      onClick={handleSaveToHistory}
                      disabled={isSaved}
                      className={`p-3 rounded-xl transition-all flex items-center space-x-2 ${isSaved ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-slate-50 text-slate-400 hover:text-rose-600'}`}
                      title="Save to History"
                    >
                      {isSaved ? <CheckCircle2 size={20} /> : <Save size={20} />}
                      {isSaved && <span className="text-[10px] font-black uppercase tracking-widest">Saved</span>}
                    </button>
                    <button onClick={handleExportWord} className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:text-blue-600 transition-colors" title="Export to Word">
                      <FileText size={20} />
                    </button>
                    <button onClick={handleExportPdf} className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:text-rose-600 transition-colors" title="Export to PDF">
                      <Download size={20} />
                    </button>
                    <button onClick={() => window.print()} className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:text-slate-900 transition-colors" title="Print">
                      <Printer size={20} />
                    </button>
                  </div>
                </div>

                <div className="prose prose-slate max-w-none" ref={contentRef}>
                  {result.content && (
                    <div className="mb-12 text-slate-600 font-medium leading-relaxed whitespace-pre-wrap bg-slate-50 p-8 rounded-[2rem] border border-slate-100">
                      {typeof result.content === 'object' ? JSON.stringify(result.content) : result.content}
                    </div>
                  )}

                  {result.questions && result.questions.length > 0 && (
                    <div className="space-y-8">
                      <div className="flex items-center space-x-3 mb-6">
                        <div className="w-1.5 h-8 bg-rose-500 rounded-full" />
                        <h4 className="text-xl font-black text-slate-800 uppercase tracking-tight">
                          {contentType === 'CaseStudy' ? 'Case Analysis & Questions' : 'Practice Assessment'}
                        </h4>
                      </div>
                      <div className="grid grid-cols-1 gap-6">
                        {result.questions.map((q, idx) => (
                          <div key={idx} className="bg-white p-8 rounded-[2rem] border border-slate-100 hover:border-rose-200 transition-all group shadow-sm">
                            <div className="flex items-start space-x-4">
                              <span className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-xs font-black text-white shadow-sm">
                                {idx + 1}
                              </span>
                              <div className="flex-1 space-y-4">
                                <p className="font-bold text-slate-800 text-lg leading-tight">
                                  {typeof q.question === 'object' ? JSON.stringify(q.question) : q.question}
                                </p>
                                <div className="p-5 bg-emerald-50/50 border border-emerald-100 rounded-2xl">
                                  <p className="text-sm text-emerald-700 font-bold">
                                    <span className="text-[10px] uppercase tracking-widest opacity-60 block mb-1">Correct Answer / Explanation</span>
                                    {typeof q.answer === 'object' ? JSON.stringify(q.answer) : q.answer}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 flex items-start space-x-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
            <Zap size={24} />
          </div>
          <div>
            <h4 className="font-black text-slate-800 uppercase tracking-tight text-sm mb-1">NCERT Reference</h4>
            <p className="text-[10px] text-slate-400 font-medium leading-relaxed">Content generated using NCERT and CBSE 2025-26 latest guidelines.</p>
          </div>
        </div>
        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 flex items-start space-x-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
            <Target size={24} />
          </div>
          <div>
            <h4 className="font-black text-slate-800 uppercase tracking-tight text-sm mb-1">Board Pattern</h4>
            <p className="text-[10px] text-slate-400 font-medium leading-relaxed">Case-based studies and MCQs follow the latest board sample paper patterns.</p>
          </div>
        </div>
        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 flex items-start space-x-4">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl">
            <Languages size={24} />
          </div>
          <div>
            <h4 className="font-black text-slate-800 uppercase tracking-tight text-sm mb-1">Short & Precise</h4>
            <p className="text-[10px] text-slate-400 font-medium leading-relaxed">Explanations designed for quick understanding and high retention.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TheoryHub;
