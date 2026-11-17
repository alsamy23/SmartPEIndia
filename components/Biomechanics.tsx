
import React, { useState } from 'react';
import { Microscope, Loader2, PlayCircle, Image as ImageIcon, BookOpen, AlertCircle } from 'lucide-react';
import { explainBiomechanics, generateLessonDiagram } from '../services/geminiService.ts';
import { BiomechanicsConcept, Language } from '../types.ts';
import { toast } from '../services/toast.ts';

const Biomechanics: React.FC = () => {
  const [sport, setSport] = useState('Cricket');
  const [concept, setConcept] = useState('Projectile Motion in Bowling');
  const [language, setLanguage] = useState<Language>('English');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BiomechanicsConcept | null>(null);

  const handleExplain = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await explainBiomechanics(sport, concept, language);
      let visualUrl: string | undefined;
      try {
        visualUrl = await generateLessonDiagram(data.diagramPrompt, 'biomechanics physics diagram');
      } catch (imgErr) {
        console.warn("Diagram generation failed, showing text explanation:", imgErr);
      }
      setResult({ ...data, diagramUrl: visualUrl });
    } catch (e: any) {
      console.error(e);
      const msg = e?.message || 'Failed to generate biomechanics explanation.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in">
       <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <h2 className="text-3xl font-black mb-4 uppercase tracking-tighter">Visual Biomechanics</h2>
          <p className="text-slate-300 text-lg mb-8">
            Simplify complex physics concepts for Class 11 & 12 PE students with AI-generated visual analogies.
          </p>
          <div className="flex flex-col md:flex-row gap-4">
             <input className="flex-1 bg-white/10 border border-white/20 p-4 rounded-xl outline-none text-white placeholder-slate-400" placeholder="Sport (e.g. High Jump)" value={sport} onChange={e => setSport(e.target.value)} />
             <input className="flex-1 bg-white/10 border border-white/20 p-4 rounded-xl outline-none text-white placeholder-slate-400" placeholder="Concept (e.g. Center of Gravity)" value={concept} onChange={e => setConcept(e.target.value)} />
             <select className="bg-slate-800 border border-white/20 p-4 rounded-xl outline-none text-white" value={language} onChange={e => setLanguage(e.target.value as Language)}>
               <option className="bg-slate-900 text-white" value="English">English</option>
               <option className="bg-slate-900 text-white" value="Hindi">Hindi</option>
               <option className="bg-slate-900 text-white" value="Marathi">Marathi</option>
             </select>
          </div>
          <button onClick={handleExplain} disabled={loading} className="mt-4 bg-indigo-500 hover:bg-indigo-600 px-8 py-3 rounded-xl font-bold transition-all flex items-center space-x-2 disabled:opacity-50">
             {loading ? <Loader2 className="animate-spin" /> : <Microscope size={20} />}
             <span>{loading ? 'Analyzing Physics...' : 'Generate Explanation'}</span>
          </button>
        </div>
        <Microscope className="absolute right-[-40px] bottom-[-40px] w-80 h-80 text-white/5" />
      </div>

      {error && (
        <div className="p-6 bg-rose-50 border-2 border-rose-200 rounded-[2rem] flex items-center gap-3 text-rose-700">
          <AlertCircle size={20} className="flex-shrink-0" />
          <p className="text-sm font-bold">{error}</p>
        </div>
      )}

      {result && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
              <h3 className="text-2xl font-black text-slate-800 mb-4">{typeof result.concept === 'object' ? JSON.stringify(result.concept) : result.concept}</h3>
              <div className="prose prose-slate">
                <p className="text-lg font-medium text-slate-600 mb-6">{typeof result.explanation === 'object' ? JSON.stringify(result.explanation) : result.explanation}</p>
                <div className="bg-indigo-50 p-6 rounded-2xl border-l-4 border-indigo-500">
                  <h4 className="font-bold text-indigo-900 mb-2 uppercase text-xs tracking-widest">Real World Analogy</h4>
                  <p className="text-indigo-800">{typeof result.analogy === 'object' ? JSON.stringify(result.analogy) : result.analogy}</p>
                </div>
              </div>
           </div>
           
           <div className="bg-slate-100 rounded-[2.5rem] p-4 flex items-center justify-center border border-slate-200">
             {result.diagramUrl ? (
               <img src={result.diagramUrl} alt="Biomechanics Diagram" className="rounded-2xl shadow-lg w-full h-auto object-cover" />
             ) : (
               <div className="text-center text-slate-400">
                 <ImageIcon size={48} className="mx-auto mb-2" />
                 <p>Visualizing...</p>
               </div>
             )}
           </div>
        </div>
      )}
    </div>
  );
};

export default Biomechanics;
