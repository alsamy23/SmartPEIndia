import React, { useState } from 'react';
import { 
  Mail, 
  Sparkles, 
  Download, 
  Printer, 
  Loader2, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowLeft,
  User,
  MessageSquare,
  FileText,
  Save,
  Share2
} from 'lucide-react';
import { Language } from '../types.ts';
import { generateParentLetter } from '../services/geminiService.ts';
import { storageService } from '../services/storageService.ts';
import { safeOpenExternal } from '../utils/safeBrowser.ts';

const PURPOSES = [
  "Progress Update",
  "Injury/Incident Report",
  "Sports Day Invitation",
  "Low Attendance Warning",
  "Outstanding Achievement",
  "Equipment Reminder",
  "Medical Fitness Certificate Required",
  "Khelo India Selection"
];

const ParentLetters: React.FC = () => {
  const [studentName, setStudentName] = useState('');
  const [teacherName, setTeacherName] = useState('Mr. L. Samy');
  const [purpose, setPurpose] = useState(PURPOSES[0]);
  const [details, setDetails] = useState('');
  const [language, setLanguage] = useState<Language>('English');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  const handleGenerate = async () => {
    if (!studentName.trim()) {
      setError("Please enter the student's name.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const letter = await generateParentLetter(studentName, teacherName, purpose, details, language);
      setResult(letter);
    } catch (e: any) {
      console.error(e);
      setError(e.message || "Failed to generate letter.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    if (!result) return;
    storageService.saveItem({
      type: 'ParentLetter',
      title: `Letter for ${studentName} - ${purpose}`,
      content: result,
      metadata: { studentName, teacherName, purpose, language }
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShareWhatsApp = () => {
    if (!result) return;
    const text = `Parent Letter for ${studentName}\n\n${result}`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    safeOpenExternal(url, 'Opening WhatsApp...');
  };

  const reset = () => {
    setResult(null);
    setStudentName('');
    setDetails('');
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
              <Mail size={14} className="text-[#D4A017]" />
              <span className="text-[10px] font-black uppercase tracking-widest">Communication Hub</span>
            </div>
            <h1 className="text-4xl font-black tracking-tighter">Parent <span className="text-[#D4A017]">Letters</span></h1>
            <p className="text-slate-400 text-sm font-medium max-w-md">
              AI-written professional letters to parents in seconds.
            </p>
          </div>
        </div>
      </div>

      {!result ? (
        <div className="max-w-3xl mx-auto">
          <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Student Name *</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="text"
                    value={studentName}
                    onChange={e => setStudentName(e.target.value)}
                    placeholder="e.g. Priya Patel"
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-rose-200 font-bold text-slate-700"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Teacher Name</label>
                <div className="relative">
                  <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="text"
                    value={teacherName}
                    onChange={e => setTeacherName(e.target.value)}
                    placeholder="e.g. Mr. L. Samy"
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-rose-200 font-bold text-slate-700"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Purpose of Letter</label>
              <select 
                value={purpose}
                onChange={e => setPurpose(e.target.value)}
                className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-rose-200 font-bold text-slate-700"
              >
                {PURPOSES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Additional Details (optional)</label>
              <div className="relative">
                <MessageSquare className="absolute left-4 top-4 text-slate-400" size={18} />
                <textarea 
                  value={details}
                  onChange={e => setDetails(e.target.value)}
                  placeholder="Any specific details to include..."
                  className="w-full h-32 pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-rose-200 font-bold text-slate-700 resize-none"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Language</label>
              <select 
                value={language}
                onChange={e => setLanguage(e.target.value as Language)}
                className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-rose-200 font-bold text-slate-700"
              >
                <option value="English">English</option>
                <option value="Hindi">Hindi</option>
                <option value="Marathi">Marathi</option>
                <option value="Tamil">Tamil</option>
                <option value="Bengali">Bengali</option>
              </select>
            </div>

            {error && (
              <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center space-x-3 text-rose-600">
                <AlertTriangle size={20} />
                <p className="text-xs font-black uppercase tracking-tight">{error}</p>
              </div>
            )}

            <button 
              onClick={handleGenerate}
              disabled={loading}
              className="w-full py-6 bg-slate-900 text-white rounded-[2rem] font-black text-sm uppercase tracking-[0.2em] hover:bg-slate-800 transition-all flex items-center justify-center space-x-4 shadow-xl shadow-slate-900/20 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={24} />
                  <span>Writing Letter...</span>
                </>
              ) : (
                <>
                  <Sparkles size={24} className="text-rose-400" />
                  <span>Generate Letter</span>
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <button onClick={reset} className="flex items-center space-x-2 text-slate-500 hover:text-rose-500 font-black text-xs uppercase tracking-widest">
              <ArrowLeft size={16} />
              <span>Back to Form</span>
            </button>
            <div className="flex space-x-3">
              <button 
                onClick={handleSave}
                disabled={isSaved}
                className={`px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center space-x-2 ${isSaved ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
              >
                {isSaved ? <CheckCircle2 size={16} /> : <Save size={16} />}
                <span>{isSaved ? 'Saved' : 'Save'}</span>
              </button>
              <button 
                onClick={handleShareWhatsApp}
                className="p-3 bg-white border border-slate-200 text-slate-600 rounded-xl hover:text-emerald-600 transition-colors"
                title="Share via WhatsApp"
              >
                <Share2 size={20} />
              </button>
              <button 
                onClick={handlePrint}
                className="p-3 bg-[#0D2B52] text-white rounded-xl hover:bg-[#164077] transition-all"
                title="Print Letter"
              >
                <Printer size={20} />
              </button>
            </div>
          </div>

          <div className="bg-white rounded-[3rem] p-12 md:p-16 border border-slate-100 shadow-2xl max-w-4xl mx-auto print:shadow-none print:border-none print:p-0 print-letter-target">
            <div className="prose prose-slate max-w-none">
              <div className="whitespace-pre-wrap font-serif text-slate-800 leading-relaxed text-lg">
                {typeof result === 'object' ? JSON.stringify(result) : result}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParentLetters;
