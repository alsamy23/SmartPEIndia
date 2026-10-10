import React, { useState, useRef } from 'react';
import { 
  BookOpen, 
  Loader2, 
  Sparkles, 
  Download, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  RotateCcw, 
  ShieldCheck, 
  Layers, 
  Dumbbell,
  Clock,
  GraduationCap
} from 'lucide-react';
import { generateUnitPlan } from '../services/geminiService.ts';
import { exportToPdf, exportToWord } from '../lib/exportUtils.ts';

const UnitPlannerTool: React.FC = () => {
  const [topic, setTopic] = useState('Volleyball: Serving & Spiking Techniques');
  const [grade, setGrade] = useState('Grade 9');
  const [numberOfLessons, setNumberOfLessons] = useState(6);
  const [duration, setDuration] = useState('45');
  const [curriculum, setCurriculum] = useState('CBSE');
  const [learningObjectives, setLearningObjectives] = useState('Master overhand float serve accuracy and 3-step spike approach positioning.');
  const [assessmentStrategies, setAssessmentStrategies] = useState('Peer observation checklist and 10-ball target court serving accuracy rubric.');
  const [availableEquipment, setAvailableEquipment] = useState('10 Volleyballs, training net, marker cones, whistle, boundary strips.');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unitPlan, setUnitPlan] = useState<any | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const data = await generateUnitPlan(
        topic,
        grade,
        Number(numberOfLessons) || 6,
        duration,
        curriculum,
        learningObjectives,
        assessmentStrategies,
        availableEquipment
      );
      setUnitPlan(data);
    } catch (err: any) {
      console.error("Unit plan generation failed:", err);
      setError(err?.message || "Failed to generate Unit Plan. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleExportPdf = () => {
    if (!unitPlan) return;
    exportToPdf(contentRef.current, `Unit_Plan_${unitPlan.unitTitle?.replace(/\s+/g, '_')}_${grade}`).catch(err => {
      console.error("PDF export error:", err);
    });
  };

  const handleExportWord = () => {
    if (!unitPlan) return;
    const lessonsHtml = (unitPlan.weeklyBreakdown || []).map((l: any) => `
      <div style="margin-bottom: 20px; border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px;">
        <h3 style="color: #4338ca; margin-top: 0;">Lesson ${l.week}: ${l.focus}</h3>
        <p><b>Key Learning:</b> ${l.keyLearning}</p>
        <p><b>Starter (Warm-up):</b> ${l.starter || 'Dynamic joint mobilization and sport-specific warm-up'}</p>
        <p><b>Main Activities & Drills:</b> ${l.mainActivity || (l.suggestedDrills || []).join('; ')}</p>
        <p><b>Cool-down (Plenary):</b> ${l.plenary || 'Static stretching and reflective questioning'}</p>
        ${l.coachingCues && l.coachingCues.length > 0 ? `<p><b>Coaching Points:</b> ${l.coachingCues.join(', ')}</p>` : ''}
      </div>
    `).join('');

    const html = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word'>
      <head><meta charset='utf-8'><title>${unitPlan.unitTitle}</title>
      <style>
        body { font-family: Calibri, Arial, sans-serif; padding: 25px; line-height: 1.5; }
        h1 { color: #1e3a8a; font-size: 24px; border-bottom: 2px solid #1e3a8a; padding-bottom: 8px; }
        h2 { color: #374151; font-size: 18px; margin-top: 20px; }
        .meta { color: #64748b; font-size: 12px; margin-bottom: 20px; }
        .box { background: #f8fafc; border: 1px solid #cbd5e1; padding: 12px; border-radius: 6px; margin-bottom: 15px; }
      </style>
      </head>
      <body>
        <h1>${unitPlan.unitTitle}</h1>
        <div class="meta">Grade: ${grade} &bull; Curriculum: ${curriculum} &bull; Duration: ${numberOfLessons} Lessons (${duration} mins each)</div>
        <p><b>Overview:</b> ${unitPlan.overview}</p>
        
        <h2>Learning Objectives</h2>
        <ul>${(unitPlan.learningObjectives || []).map((obj: string) => `<li>${obj}</li>`).join('')}</ul>

        <h2>Assessment & Safety</h2>
        <div class="box">
          <p><b>Assessments:</b> ${(unitPlan.assessmentStrategies || []).join('; ')}</p>
          <p><b>Safety Guidelines:</b> ${(unitPlan.safetyGuidelines || []).join('; ')}</p>
          <p><b>Equipment Needed:</b> ${(unitPlan.equipmentNeeded || []).join(', ')}</p>
        </div>

        <h2>Lesson Breakdown</h2>
        ${lessonsHtml}
      </body>
      </html>
    `;

    exportToWord(html, `Unit_Plan_${unitPlan.unitTitle?.replace(/\s+/g, '_')}_${grade}`);
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 animate-in fade-in pb-16">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-800 to-slate-900 rounded-[2.5rem] p-8 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 text-white shadow-inner">
            <BookOpen size={28} />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-wider mb-1.5 border border-white/10">
              <Sparkles size={12} className="text-amber-400" />
              <span>CBSE & National Standards Aligned</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight">AI Unit Planner</h2>
            <p className="text-xs text-blue-200 font-medium">Build complete multi-lesson curricular unit progressions in seconds</p>
          </div>
        </div>

        {unitPlan && (
          <button 
            onClick={() => setUnitPlan(null)}
            className="flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors border border-white/20"
          >
            <RotateCcw size={14} />
            <span>New Unit Plan</span>
          </button>
        )}
      </div>

      {!unitPlan ? (
        <div className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-bold flex items-center gap-3">
                <AlertCircle size={18} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">Topic / Sport Focus *</label>
                <input 
                  required 
                  type="text" 
                  value={topic}
                  onChange={e => setTopic(e.target.value)}
                  placeholder="e.g., Basketball: Passing & Fast Breaks, Athletics, Yoga for Lifestyle" 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-all" 
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">Class / Grade Level *</label>
                <input 
                  required 
                  type="text" 
                  value={grade}
                  onChange={e => setGrade(e.target.value)}
                  placeholder="e.g., Grade 9, Class 11, Class 12, Grade 6" 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-all" 
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">Number of Lessons / Weeks</label>
                <input 
                  required 
                  type="number" 
                  min={2}
                  max={12}
                  value={numberOfLessons}
                  onChange={e => setNumberOfLessons(Number(e.target.value))}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-all" 
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">Lesson Duration (Minutes)</label>
                <input 
                  type="text" 
                  value={duration}
                  onChange={e => setDuration(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-all" 
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">Curriculum Standards</label>
                <select 
                  value={curriculum}
                  onChange={e => setCurriculum(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-all"
                >
                  <option value="CBSE">CBSE (Physical Education & HPE)</option>
                  <option value="ICSE">ICSE / ISC Sports Curriculum</option>
                  <option value="State Board">State Board Guidelines</option>
                  <option value="National">National Curriculum Framework (NCF)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">Available Equipment</label>
                <input 
                  type="text"
                  value={availableEquipment}
                  onChange={e => setAvailableEquipment(e.target.value)}
                  placeholder="Cones, balls, mats, whistles..." 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-all" 
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">Key Learning Objectives (Optional)</label>
              <textarea 
                rows={2} 
                value={learningObjectives}
                onChange={e => setLearningObjectives(e.target.value)}
                placeholder="Specific motor skill or cognitive goals for this unit..." 
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-all resize-y" 
              />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">Assessment Strategies (Optional)</label>
              <textarea 
                rows={2} 
                value={assessmentStrategies}
                onChange={e => setAssessmentStrategies(e.target.value)}
                placeholder="Rubrics, peer scoring, game performance observation..." 
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-all resize-y" 
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button 
                type="submit" 
                disabled={loading}
                className="w-full md:w-auto px-10 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm uppercase tracking-widest rounded-2xl shadow-xl flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
              >
                {loading ? (
                  <><Loader2 size={18} className="animate-spin" /> Architecting Unit Plan...</>
                ) : (
                  <><Sparkles size={18} /> Generate Unit Plan</>
                )}
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* Generated Plan View */
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div>
              <span className="text-[10px] font-black uppercase text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md">
                {unitPlan.curriculum || curriculum} &bull; {grade}
              </span>
              <h3 className="text-xl font-black text-slate-800 mt-1">{unitPlan.unitTitle}</h3>
            </div>

            <div className="flex items-center gap-3">
              <button 
                onClick={handleExportWord}
                className="px-4 py-2.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
              >
                <FileText size={15} />
                <span>Word</span>
              </button>
              <button 
                onClick={handleExportPdf}
                className="px-4 py-2.5 bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
              >
                <Download size={15} />
                <span>PDF</span>
              </button>
            </div>
          </div>

          <div ref={contentRef} className="space-y-6 bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
            {/* Overview Card */}
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center gap-2 text-indigo-700 font-black text-xs uppercase tracking-wider">
                <GraduationCap size={16} />
                <span>Unit Overview & Pedagogy</span>
              </div>
              <p className="text-xs md:text-sm text-slate-700 leading-relaxed font-medium">
                {unitPlan.overview}
              </p>
            </div>

            {/* Objectives & Assessments */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 bg-emerald-50/50 rounded-2xl border border-emerald-100 space-y-3">
                <h4 className="text-xs font-black text-emerald-800 uppercase tracking-wider flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-600" />
                  <span>Learning Objectives</span>
                </h4>
                <ul className="space-y-1.5">
                  {(unitPlan.learningObjectives || []).map((obj: string, i: number) => (
                    <li key={i} className="text-xs text-slate-700 font-medium flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-1.5 shrink-0" />
                      <span>{obj}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-6 bg-amber-50/50 rounded-2xl border border-amber-100 space-y-3">
                <h4 className="text-xs font-black text-amber-800 uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck size={16} className="text-amber-600" />
                  <span>Assessments & Safety</span>
                </h4>
                <div className="space-y-2 text-xs text-slate-700 font-medium">
                  {unitPlan.assessmentStrategies && (
                    <p><b className="text-slate-900">Assessments:</b> {unitPlan.assessmentStrategies.join('; ')}</p>
                  )}
                  {unitPlan.safetyGuidelines && (
                    <p><b className="text-slate-900">Safety:</b> {unitPlan.safetyGuidelines.join('; ')}</p>
                  )}
                  {unitPlan.equipmentNeeded && (
                    <p><b className="text-slate-900">Equipment:</b> {unitPlan.equipmentNeeded.join(', ')}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Lesson-by-Lesson Progression */}
            <div className="space-y-4 pt-4">
              <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Layers size={18} className="text-indigo-600" />
                <span>Lesson-by-Lesson Pacing Breakdown ({unitPlan.weeklyBreakdown?.length || 0} Lessons)</span>
              </h4>

              <div className="space-y-4">
                {(unitPlan.weeklyBreakdown || []).map((lesson: any, idx: number) => (
                  <div key={idx} className="p-5 bg-slate-50/70 border border-slate-200 rounded-2xl hover:border-indigo-300 transition-all space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 bg-indigo-600 text-white rounded-lg flex items-center justify-center text-xs font-black">
                          {lesson.week || idx + 1}
                        </span>
                        <h5 className="font-black text-slate-800 text-sm">{lesson.focus}</h5>
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        {duration} min session
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 font-medium">
                      <b className="text-slate-800">Target Outcome:</b> {lesson.keyLearning}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1 text-xs">
                      {lesson.starter && (
                        <div className="p-3 bg-white rounded-xl border border-slate-200">
                          <span className="text-[9px] font-black uppercase text-rose-600 block mb-1">Starter Warm-up</span>
                          <p className="text-slate-600 font-medium">{lesson.starter}</p>
                        </div>
                      )}
                      <div className="p-3 bg-white rounded-xl border border-slate-200 md:col-span-1">
                        <span className="text-[9px] font-black uppercase text-indigo-600 block mb-1">Core Activities / Drills</span>
                        <p className="text-slate-600 font-medium">{lesson.mainActivity || (lesson.suggestedDrills || []).join('; ')}</p>
                      </div>
                      {lesson.plenary && (
                        <div className="p-3 bg-white rounded-xl border border-slate-200">
                          <span className="text-[9px] font-black uppercase text-emerald-600 block mb-1">Cool-down & Review</span>
                          <p className="text-slate-600 font-medium">{lesson.plenary}</p>
                        </div>
                      )}
                    </div>

                    {lesson.coachingCues && lesson.coachingCues.length > 0 && (
                      <div className="text-[11px] text-indigo-900 bg-indigo-50/80 p-2.5 rounded-xl border border-indigo-100 flex items-center gap-2">
                        <Dumbbell size={13} className="text-indigo-600 shrink-0" />
                        <span><b>Coaching Cues:</b> {lesson.coachingCues.join(' &bull; ')}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UnitPlannerTool;
