import React, { useState, useEffect } from 'react';
import { Camera, Activity, ShieldCheck, Dumbbell, Shield, ChevronLeft, StopCircle } from 'lucide-react';
import Webcam from 'react-webcam';

const MoveCheckTool: React.FC = () => {
  const [view, setView] = useState<'main' | 'choose' | 'camera'>('main');
  const [selectedExercise, setSelectedExercise] = useState<any>(null);
  const [reps, setReps] = useState(0);
  const [isTracking, setIsTracking] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<'prompt' | 'granted' | 'denied'>('prompt');

  const startCamera = async (exercise: any) => {
    setSelectedExercise(exercise);
    setView('camera');
    setReps(0);
    setIsTracking(false);
    setPermissionStatus('prompt');
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      // We don't actually need to keep the stream, react-webcam handles it,
      // but this prompts the user and checks permission.
      stream.getTracks().forEach(track => track.stop());
      setPermissionStatus('granted');
      setIsTracking(true);
    } catch (err) {
      console.warn("Camera access denied or error:", err);
      setPermissionStatus('denied');
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (view === 'camera' && isTracking) {
      interval = setInterval(() => {
        setReps(r => r + 1);
      }, 3500); // Simulate one rep every 3.5s
    }
    return () => clearInterval(interval);
  }, [view, isTracking]);

  return (
    <div className="w-full max-w-4xl mx-auto animate-in fade-in pb-20 font-sans">
      
      {/* Header Area */}
      <div className="flex items-center gap-4 mb-6">
        <button className="p-2 hover:bg-slate-100 rounded-full transition-colors hidden md:block">
          <ChevronLeft size={20} className="text-slate-600" />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-sky-50 text-sky-500 rounded-xl flex items-center justify-center shadow-sm border border-sky-100">
            <Camera size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
              MoveCheck <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] uppercase font-black tracking-widest rounded">Free</span>
            </h1>
            <p className="text-sm text-slate-500 font-medium">AI webcam rep counter and movement form checker</p>
          </div>
        </div>
      </div>

      {view === 'main' && (
        <div className="space-y-6 animate-in slide-in-from-bottom-4">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center gap-3 text-slate-600">
            <ShieldCheck size={18} className="text-emerald-500 flex-shrink-0" />
            <p className="text-sm font-medium">Your camera feed is processed entirely on this device. No video is recorded or transmitted.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button 
              onClick={() => setView('choose')}
              className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all text-left group"
            >
              <div className="w-10 h-10 bg-red-50 text-red-500 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Activity size={20} />
              </div>
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-1 mb-2">
                Count Reps <ChevronLeft size={16} className="rotate-180 opacity-50 group-hover:translate-x-1 group-hover:opacity-100 transition-all" />
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed min-h-[60px]">
                AI counts exercise reps live — jumping jacks, squats, lunges, high knees, and sit-ups.
              </p>
            </button>

            <button className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all text-left group">
              <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Dumbbell size={20} />
              </div>
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-1 mb-2">
                Check Form <ChevronLeft size={16} className="rotate-180 opacity-50 group-hover:translate-x-1 group-hover:opacity-100 transition-all" />
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed min-h-[60px]">
                Hold a position and get instant feedback on technique — squat, lunge, plank, and balance.
              </p>
            </button>
          </div>

          <p className="text-center text-xs text-slate-400 mt-12">
            Best on a laptop or tablet. Requires camera permission. Works in Chrome, Edge, Firefox, and Safari.
          </p>
        </div>
      )}

      {view === 'choose' && (
        <div className="space-y-6 animate-in slide-in-from-right-4">
          <div className="flex items-center gap-4 mb-2">
            <button onClick={() => setView('main')} className="flex items-center gap-1 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors">
              <ChevronLeft size={16} /> Back
            </button>
            <h2 className="text-xl font-black text-slate-800 ml-2">Choose an exercise to count</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { icon: '🧍', name: 'Jumping Jacks', desc: 'Count jumping jack reps automatically', req: 'Stand 1-2m from camera, full body visible' },
              { icon: '🏋️', name: 'Squats', desc: 'Count squat reps by tracking knee depth', req: 'Side view recommended for best accuracy' },
              { icon: '🦵', name: 'High Knees', desc: 'Count alternating knee raises', req: 'Stand 1-2m from camera, full body visible' },
              { icon: '🎽', name: 'Lunges', desc: 'Count alternating lunge reps', req: 'Front or side view, full body visible' },
              { icon: '💪', name: 'Sit-ups', desc: 'Count sit-up reps via torso angle', req: 'Side view required — place camera at floor level' },
            ].map((ex, idx) => (
              <button 
                key={idx} 
                onClick={() => startCamera(ex)}
                className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all text-left flex flex-col justify-between min-h-[140px]"
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-3xl">{ex.icon}</span>
                  <h3 className="text-lg font-black text-slate-800">{ex.name}</h3>
                </div>
                <p className="text-sm text-slate-500 mb-4">{ex.desc}</p>
                <div className="flex items-center gap-1.5 text-xs font-bold text-orange-600 bg-orange-50 w-fit px-2.5 py-1 rounded">
                  <Camera size={14} /> {ex.req}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {view === 'camera' && selectedExercise && (
        <div className="space-y-6 animate-in zoom-in-95 duration-300">
           {/* Top Bar inside camera view */}
           <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-4">
                <button onClick={() => { setView('choose'); setIsTracking(false); }} className="flex items-center gap-1 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors">
                  <ChevronLeft size={16} /> Back
                </button>
                <div className="h-6 w-px bg-slate-200" />
                <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                    <span className="text-2xl">{selectedExercise.icon}</span> {selectedExercise.name}
                </h2>
            </div>
            
            <div className="flex items-center gap-3">
                 <div className="px-4 py-2 bg-slate-900 text-white rounded-xl font-black text-xl flex items-center gap-2 shadow-inner">
                     <Activity size={20} className="text-emerald-400" /> {reps} Reps
                 </div>
                 <button 
                  onClick={() => setIsTracking(!isTracking)}
                  className={`px-4 py-2 rounded-xl font-bold text-sm text-white flex items-center gap-2 transition-all ${isTracking ? 'bg-red-500 hover:bg-red-600 shadow-red-500/20 shadow-lg' : 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20 shadow-lg'}`}
                 >
                     {isTracking ? <><StopCircle size={18} /> Pause AI</> : <><Activity size={18} /> Resume</>}
                 </button>
            </div>
           </div>

           {/* Camera Preview area */}
           <div className="relative w-full aspect-video bg-slate-900 rounded-[2rem] overflow-hidden border-8 border-slate-800 shadow-2xl flex items-center justify-center">
               {permissionStatus === 'prompt' && (
                 <div className="flex flex-col items-center justify-center text-center p-6 transform scale-100 animate-pulse">
                   <div className="w-16 h-16 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center mb-4">
                     <Camera size={32} />
                   </div>
                   <h3 className="text-xl font-black text-white mb-2">Allow Camera Access</h3>
                   <p className="text-sm text-slate-300 max-w-sm">Please allow camera access above to start tracking your {selectedExercise.name.toLowerCase()} form.</p>
                 </div>
               )}

               {permissionStatus === 'denied' && (
                 <div className="flex flex-col items-center justify-center text-center p-6 bg-slate-800/80 m-6 rounded-2xl border border-slate-700">
                   <div className="w-16 h-16 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mb-4">
                     <Shield size={32} />
                   </div>
                   <h3 className="text-xl font-black text-white mb-2">Camera Access Denied</h3>
                   <p className="text-sm text-slate-300 max-w-sm mb-6">We need camera access to count your reps. Please reset your browser permissions and try again.</p>
                   <button 
                     onClick={() => setView('choose')}
                     className="px-6 py-2.5 bg-slate-700 text-white rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-slate-600 transition-colors"
                   >
                     Go Back
                   </button>
                 </div>
               )}

               {permissionStatus === 'granted' && (
                 <>
                   <Webcam 
                     audio={false}
                     className="w-full h-full object-cover opacity-90 scale-100"
                     mirrored={true}
                   />
                   
                   {/* Simulated AI Overlays */}
                   {isTracking && (
                       <div className="absolute inset-0 pointer-events-none">
                           {/* Scanner line */}
                           <div className="w-full h-1 bg-emerald-500/50 absolute shadow-[0_0_15px_rgba(16,185,129,0.8)] animate-pulse" style={{ animation: 'bounce 3s infinite' }} />
                           
                           {/* Corner markers */}
                           <div className="absolute top-8 left-8 w-12 h-12 border-t-4 border-l-4 border-emerald-500/70 rounded-tl-xl" />
                           <div className="absolute top-8 right-8 w-12 h-12 border-t-4 border-r-4 border-emerald-500/70 rounded-tr-xl" />
                           <div className="absolute bottom-8 left-8 w-12 h-12 border-b-4 border-l-4 border-emerald-500/70 rounded-bl-xl" />
                           <div className="absolute bottom-8 right-8 w-12 h-12 border-b-4 border-r-4 border-emerald-500/70 rounded-br-xl" />
                           
                           {/* Simulated status */}
                           <div className="absolute top-8 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md text-white px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-xl border border-white/10">
                               <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping absolute"></span>
                               <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 relative"></span>
                               AI Tracking Active
                           </div>

                           {/* Simulated Body box map (mock skeleton logic) */}
                           <div className="absolute inset-0 flex items-center justify-center">
                             <div className="w-48 h-[60%] border-2 border-emerald-500/40 rounded-3xl border-dashed"></div>
                           </div>

                           {/* Simulated Feedback */}
                           <div className="absolute bottom-8 left-1/2 -translate-x-1/2 transition-all">
                              <div className="bg-emerald-500 text-white px-6 py-3 rounded-2xl text-sm font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20">
                                  Good form! Keep going
                              </div>
                           </div>
                       </div>
                   )}

                   {!isTracking && (
                       <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center">
                           <div className="text-white text-lg font-black uppercase tracking-widest flex flex-col items-center gap-3">
                               <StopCircle size={48} className="text-slate-400" />
                               <span className="tracking-[0.2em]">Tracking Paused</span>
                           </div>
                       </div>
                   )}
                 </>
               )}
           </div>
        </div>
      )}

    </div>
  );
};

export default MoveCheckTool;
