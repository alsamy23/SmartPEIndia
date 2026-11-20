
import React, { useState } from 'react';
import { Activity, Trophy, ChevronRight, Calculator, RefreshCw, Loader2, Award, ClipboardList, AlertCircle, Info, Zap, Share2 } from 'lucide-react';
import { evaluateKheloIndiaScores } from '../services/geminiService.ts';
import { FitnessAssessment } from '../types.ts';
import { getDescriptiveFieldInfo } from '../utils/bmiUtils.ts';
import { safeOpenExternal } from '../utils/safeBrowser.ts';
import { trackEvent } from '../services/analytics.ts';

const KheloIndia: React.FC = () => {
  const [age, setAge] = useState('12');
  const [gender, setGender] = useState('Male');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<FitnessAssessment | null>(null);
  const [sprintTrackType, setSprintTrackType] = useState<'50m' | '30m' | '25m'>('50m');

  // Battery tests with support for 25m and 30m races, Sit-ups, and gender-specific Push-ups
  const [tests, setTests] = useState([
    { name: '50m Dash', value: '' },
    { name: '600m Run/Walk', value: '' },
    { name: 'Sit & Reach', value: '' },
    { name: 'Sit-Ups / Partial Curl Up (60s)', value: '' },
    { name: 'Push Ups (Boys - 60s)', value: '' }
  ]);

  const handleGenderChange = (newGender: string) => {
    setGender(newGender);
    const pushupName = newGender === 'Female' ? 'Modified Push Ups (Girls - Knees on Mat)' : 'Push Ups (Boys - Standard Plank)';
    setTests(prev => {
      return prev.map(t => {
        if (t.name.toLowerCase().includes('push')) {
          return { ...t, name: pushupName };
        }
        return t;
      });
    });
  };

  const handleSprintTypeChange = (type: '50m' | '30m' | '25m') => {
    setSprintTrackType(type);
    const sprintName = type === '25m' ? '25m Race / Sprint' : type === '30m' ? '30m Race / Sprint' : '50m Dash';
    setTests(prev => {
      const next = [...prev];
      const sprintIdx = next.findIndex(t => t.name.includes('50m') || t.name.includes('30m') || t.name.includes('25m') || t.name.includes('Dash') || t.name.includes('Sprint') || t.name.includes('Race'));
      if (sprintIdx !== -1) {
        next[sprintIdx] = { ...next[sprintIdx], name: sprintName };
      } else {
        next.unshift({ name: sprintName, value: '' });
      }
      return next;
    });
  };

  const handleTestChange = (index: number, val: string) => {
    const newTests = [...tests];
    newTests[index].value = val;
    setTests(newTests);
    setError(null);
  };

  const calculate = async () => {
    // Basic validation
    const hasData = tests.some(t => t.value.trim() !== '');
    if (!hasData) {
      setError("Please enter results for at least one test to calculate scores.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await evaluateKheloIndiaScores(age, gender, tests);
      if (!data || !data.tests || data.tests.length === 0) {
        throw new Error("Received empty analysis.");
      }
      setResult(data);
    } catch (e) {
      console.error(e);
      setError('Assessment failed. The AI could not process the data. Please ensure values are clear (e.g. "8.5s" or "12cm").');
    } finally {
      setLoading(false);
    }
  };

  const handleShareWhatsApp = () => {
    const categoryLabel = `Age ${age} (${gender === 'Male' ? 'Boy' : 'Girl'})`;
    const text = result
      ? `🏃 *KHELO INDIA FITNESS BENCHMARK*\n📊 *Category:* ${categoryLabel}\n🏅 *Tests Evaluated:* ${result.tests?.length || 0} SAI Battery Tests\n\nCheck Khelo India percentiles & CBSE fitness ratings for free:\nhttps://smartpeindia.app/khelo-india`
      : `🏃 *FREE KHELO INDIA FITNESS CALCULATOR*\nInstant percentile & medal ratings for school PE teachers (50m/30m/25m sprint, 600m run, sit & reach, curl-ups & push-ups).\n\nTry it on SmartPE India:\nhttps://smartpeindia.app/khelo-india`;
    trackEvent('resource_shared', {
      resource_type: 'Khelo India Calculator',
      channel: 'WhatsApp'
    });
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    safeOpenExternal(waUrl, "Opening WhatsApp to share Khelo India Calculator!");
  };

  return (
    <div className="space-y-8 animate-in fade-in pb-20">
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-[2.5rem] p-10 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-4xl font-black mb-4 uppercase tracking-tighter">Khelo India Assessment</h2>
            <p className="text-orange-100 max-w-xl text-lg font-medium leading-relaxed">
              Instant percentile calculations and medal criteria based on the official National Fitness Protocols and CBSE metrics.
            </p>
          </div>
          <button
            type="button"
            onClick={handleShareWhatsApp}
            className="self-start sm:self-center px-4 py-2.5 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg transition-all active:scale-95 shrink-0 cursor-pointer"
          >
            <Share2 size={15} />
            <span>Share on WhatsApp</span>
          </button>
        </div>
        <Trophy className="absolute right-[-20px] bottom-[-40px] w-64 h-64 text-white/10 rotate-12" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
            <h3 className="font-black text-xl text-slate-800 mb-6 flex items-center">
              <ClipboardList className="mr-2 text-indigo-600" /> Student Data
            </h3>
            
            <div className="grid grid-cols-2 gap-4 mb-5">
               <div>
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Age</label>
                 <select className="w-full mt-2 p-3 bg-slate-50 border rounded-xl font-bold text-xs" value={age} onChange={e => setAge(e.target.value)}>
                   {[...Array(14)].map((_, i) => <option key={i} value={i+5}>{i+5} Years</option>)}
                 </select>
               </div>
               <div>
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Gender</label>
                 <select className="w-full mt-2 p-3 bg-slate-50 border rounded-xl font-bold text-xs" value={gender} onChange={e => handleGenderChange(e.target.value)}>
                   <option value="Male">Boy</option>
                   <option value="Female">Girl</option>
                 </select>
               </div>
            </div>

            {/* Sprint Distance Track Selector */}
            <div className="mb-6 p-3 bg-slate-50 rounded-2xl border border-slate-200">
              <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>School Running Track Metric</span>
                <span className="text-orange-600 text-[9px] font-extrabold">CBSE Metric</span>
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => handleSprintTypeChange('50m')}
                  className={`py-2 px-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    sprintTrackType === '50m' 
                      ? 'bg-[#0D2B52] text-white shadow-xs' 
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  50m Track
                </button>
                <button
                  type="button"
                  onClick={() => handleSprintTypeChange('30m')}
                  className={`py-2 px-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    sprintTrackType === '30m' 
                      ? 'bg-[#0D2B52] text-white shadow-xs' 
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                  title="30m Race / Sprint for schools with compact tracks"
                >
                  30m Race
                </button>
                <button
                  type="button"
                  onClick={() => handleSprintTypeChange('25m')}
                  className={`py-2 px-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    sprintTrackType === '25m' 
                      ? 'bg-[#0D2B52] text-white shadow-xs' 
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                  title="25m Race / Sprint for compact school grounds"
                >
                  25m Race
                </button>
              </div>
              <p className="text-[9.5px] text-slate-500 font-medium mt-1.5">
                {sprintTrackType === '50m' && 'Standard 50m straight sprint.'}
                {sprintTrackType === '30m' && 'CBSE standard sprint metric for compact school grounds.'}
                {sprintTrackType === '25m' && 'Ideal for primary grades & schools without a 100m running track.'}
              </p>
            </div>

            <div className="space-y-4">
              {tests.map((t, i) => {
                const fieldInfo = getDescriptiveFieldInfo({ name: t.name });
                return (
                  <div key={i}>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-bold text-slate-800 block">{t.name}</label>
                      <span className="text-[10px] font-black text-orange-600 bg-orange-50 px-2 py-0.5 rounded border border-orange-100">
                        {fieldInfo.shortLabel}
                      </span>
                    </div>
                    <input 
                      type="text" 
                      placeholder={fieldInfo.placeholder} 
                      title={fieldInfo.hint}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-200 transition-all text-xs font-bold"
                      value={t.value}
                      onChange={(e) => handleTestChange(i, e.target.value)}
                    />
                    <p className="text-[10px] text-slate-400 font-medium mt-1 flex items-center gap-1">
                      <Info size={11} className="text-orange-500 shrink-0" />
                      <span>{fieldInfo.hint}</span>
                    </p>
                  </div>
                );
              })}
            </div>

            {error && (
              <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-xl text-xs font-bold flex items-start">
                 <AlertCircle size={16} className="mr-2 flex-shrink-0" />
                 {error}
              </div>
            )}

            <button 
              onClick={calculate}
              disabled={loading}
              className="w-full mt-6 py-4 bg-slate-900 text-white rounded-xl font-black shadow-lg hover:scale-[1.02] transition-all flex items-center justify-center space-x-2"
            >
              {loading ? <Loader2 className="animate-spin" /> : <Calculator size={20} />}
              <span>{loading ? 'Analyzing...' : 'Calculate Score'}</span>
            </button>
          </div>
        </div>

        <div className="lg:col-span-8">
          {!result ? (
            <div className="bg-white border-4 border-dashed border-slate-100 rounded-[2.5rem] h-full flex flex-col items-center justify-center p-12 text-center text-slate-400 min-h-[400px]">
               <Activity size={48} className="mb-4 text-slate-200" />
               <p className="font-bold">Enter test data to see performance analysis.</p>
            </div>
          ) : (
            <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 animate-slide-up">
               <div className="flex flex-wrap justify-between items-center gap-3 mb-8 border-b pb-4">
                 <h3 className="text-2xl font-black text-slate-800">Performance Report</h3>
                 <div className="flex items-center gap-2">
                   <button
                     type="button"
                     onClick={handleShareWhatsApp}
                     className="px-3.5 py-2 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                   >
                     <Share2 size={14} />
                     <span>Share on WhatsApp</span>
                   </button>
                   <button onClick={() => setResult(null)} className="p-2 text-slate-400 hover:text-orange-500" title="Reset results">
                     <RefreshCw size={20} />
                   </button>
                 </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  {result.tests?.map((res, idx) => (
                    <div key={idx} className={`p-6 rounded-2xl border ${res.rating === 'Elite' ? 'bg-yellow-50 border-yellow-200' : 'bg-slate-50 border-slate-100'}`}>
                       <h4 className="font-bold text-slate-700 mb-2 text-sm">{res.testName}</h4>
                       <div className="flex items-end space-x-2 mb-2">
                         <span className="text-2xl font-black text-slate-900">{res.score}</span>
                         <span className="text-xs font-bold text-slate-400 mb-1">{res.percentile} %ile</span>
                       </div>
                       <span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${
                         res.rating === 'Elite' ? 'bg-yellow-400 text-yellow-900' :
                         res.rating === 'Good' ? 'bg-emerald-100 text-emerald-700' :
                         'bg-slate-200 text-slate-600'
                       }`}>
                         {res.rating}
                       </span>
                       <p className="mt-3 text-xs text-slate-500 leading-snug">{res.recommendation}</p>
                    </div>
                  ))}
               </div>

               <div className="bg-indigo-50 rounded-2xl p-6 border border-indigo-100 flex items-start space-x-4">
                 <div className="p-3 bg-white rounded-xl shadow-sm">
                   <Award className="text-indigo-600" size={24} />
                 </div>
                 <div>
                   <h4 className="font-black text-indigo-900 mb-1">Coach's Summary</h4>
                   <p className="text-indigo-800/80 text-sm leading-relaxed">{result.overallSummary}</p>
                 </div>
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default KheloIndia;
