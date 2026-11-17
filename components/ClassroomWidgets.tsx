
import React, { useState, useEffect, useRef } from 'react';
import { 
  Clock, 
  RotateCcw, 
  Play, 
  Pause, 
  Plus, 
  Trash2, 
  Save, 
  Download, 
  Trophy, 
  Users, 
  Target, 
  Zap, 
  Timer, 
  RefreshCw,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  AlertCircle,
  Layout,
  ListChecks,
  Dumbbell,
  Gamepad2,
  Layers,
  X,
  Volume2,
  VolumeX
} from 'lucide-react';
import { toast } from '../services/toast.ts';
import { motion, AnimatePresence } from 'framer-motion';

const speakText = (text: string) => {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  }
};

// --- Easy Rubric ---
const EasyRubric = () => {
  const [criteria, setCriteria] = useState([
    { id: '1', name: 'Technical Skill', weight: 40, score: 0 },
    { id: '2', name: 'Tactical Awareness', weight: 30, score: 0 },
    { id: '3', name: 'Teamwork', weight: 30, score: 0 },
  ]);

  const updateScore = (id: string, score: number) => {
    setCriteria(criteria.map(c => c.id === id ? { ...c, score } : c));
  };

  const totalScore = criteria.reduce((acc, c) => acc + (c.score * (c.weight / 100)), 0);

  const handleSaveRubric = () => {
    try {
      const existing = JSON.parse(localStorage.getItem('smartpe_saved_rubrics') || '[]');
      const entry = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        criteria,
        totalScore: Number(totalScore.toFixed(1))
      };
      localStorage.setItem('smartpe_saved_rubrics', JSON.stringify([entry, ...(Array.isArray(existing) ? existing : [])].slice(0, 50)));
      toast.success(`Rubric evaluation saved (${totalScore.toFixed(1)} / 5.0)!`);
    } catch {
      toast.error('Failed to save rubric locally.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 p-6 rounded-3xl text-white">
        <h3 className="text-xl font-black uppercase tracking-tight mb-2">Easy Rubric</h3>
        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Score students with saved rubrics</p>
      </div>

      <div className="space-y-4">
        {criteria.map((c) => (
          <div key={c.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-black text-slate-800 uppercase tracking-tight">{c.name}</h4>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Weight: {c.weight}%</span>
            </div>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  onClick={() => updateScore(c.id, s)}
                  className={`flex-1 py-3 rounded-xl font-black transition-all ${
                    c.score === s 
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 scale-105' 
                      : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-indigo-600 p-8 rounded-[2.5rem] text-white shadow-xl shadow-indigo-200 flex justify-between items-center">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-1">Final Score</p>
          <p className="text-4xl font-black tracking-tighter">{totalScore.toFixed(1)} / 5.0</p>
        </div>
        <button
          type="button"
          onClick={handleSaveRubric}
          title="Save Rubric Evaluation"
          className="p-4 bg-white/20 rounded-2xl hover:bg-white/30 transition-all"
        >
          <Save size={24} />
        </button>
      </div>
    </div>
  );
};

// --- Run-Lap-Tap ---
const RunLapTap = () => {
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [laps, setLaps] = useState<number[]>([]);
  const [sayLouder, setSayLouder] = useState(false);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTime(t => t + 10);
      }, 10);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isRunning]);

  const formatTime = (ms: number) => {
    const min = Math.floor(ms / 60000);
    const sec = Math.floor((ms % 60000) / 1000);
    const centi = Math.floor((ms % 1000) / 10);
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}.${centi.toString().padStart(2, '0')}`;
  };

  const handleLap = () => {
    setLaps([time, ...laps]);
    if (sayLouder) {
      const min = Math.floor(time / 60000);
      const sec = Math.floor((time % 60000) / 1000);
      let timeStr = "";
      if (min > 0) timeStr += `${min} minute${min > 1 ? 's' : ''} `;
      if (sec > 0 || min === 0) timeStr += `${sec} second${sec !== 1 ? 's' : ''}`;
      speakText(`Lap ${laps.length + 1}, at ${timeStr}`);
    }
  };

  const handleReset = () => {
    setIsRunning(false);
    setTime(0);
    setLaps([]);
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 blur-[50px] rounded-full" />
        <button 
          onClick={() => setSayLouder(!sayLouder)}
          className={`absolute top-6 left-6 p-2 rounded-full transition-all ${sayLouder ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-400'}`}
          title="Announce Laps"
        >
          {sayLouder ? <Volume2 size={20} /> : <VolumeX size={20} />}
        </button>
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-4">Run-Lap-Tap</p>
        <h3 className="text-6xl font-black tracking-tighter font-mono mb-8">{formatTime(time)}</h3>
        
        <div className="flex justify-center gap-4">
          <button 
            onClick={() => setIsRunning(!isRunning)}
            className={`w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-xl ${
              isRunning ? 'bg-rose-500 shadow-rose-500/20' : 'bg-emerald-500 shadow-emerald-500/20'
            }`}
          >
            {isRunning ? <Pause size={32} /> : <Play size={32} className="ml-1" />}
          </button>
          <button 
            onClick={handleLap}
            disabled={!isRunning}
            className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-all disabled:opacity-30"
          >
            <Timer size={32} />
          </button>
          <button 
            onClick={handleReset}
            className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-all"
          >
            <RotateCcw size={32} />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50 bg-slate-50/50">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Lap History</h4>
        </div>
        <div className="max-h-64 overflow-y-auto divide-y divide-slate-50">
          {laps.length === 0 ? (
            <div className="p-12 text-center text-slate-300 font-bold italic">No laps recorded</div>
          ) : (
            laps.map((lap, i) => (
              <div key={i} className="p-4 flex justify-between items-center px-8">
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Lap {laps.length - i}</span>
                <span className="text-lg font-black text-slate-800 font-mono">{formatTime(lap)}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

// --- Station Timer ---
const StationTimer = () => {
  const [stations, setStations] = useState(6);
  const [duration, setDuration] = useState(60); // seconds
  const [timeLeft, setTimeLeft] = useState(duration);
  const [currentStation, setCurrentStation] = useState(1);
  const [isRunning, setIsRunning] = useState(false);
  const [sayLouder, setSayLouder] = useState(false);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    if (isRunning && sayLouder) {
      if (timeLeft <= 10 && timeLeft > 0) {
        speakText(timeLeft.toString());
      } else if (timeLeft === 0) {
        if (currentStation < stations) {
          speakText("Next station!");
        } else {
          speakText("Workout complete!");
        }
      }
    }
  }, [timeLeft, isRunning, sayLouder, currentStation, stations]);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(t => t - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      if (currentStation < stations) {
        setCurrentStation(s => s + 1);
        setTimeLeft(duration);
        // Play sound or alert
      } else {
        setIsRunning(false);
      }
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isRunning, timeLeft, currentStation, stations, duration]);

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(duration);
    setCurrentStation(1);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Stations</label>
          <input 
            type="number"
            min={1}
            value={stations} 
            onChange={e => setStations(Math.max(1, parseInt(e.target.value, 10) || 1))}
            className="w-full text-2xl font-black text-slate-800 outline-none bg-transparent"
          />
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Duration (s)</label>
          <input 
            type="number"
            min={1}
            value={duration} 
            onChange={e => {
              const val = Math.max(1, parseInt(e.target.value, 10) || 1);
              setDuration(val);
              if (!isRunning) setTimeLeft(val);
            }}
            className="w-full text-2xl font-black text-slate-800 outline-none bg-transparent"
          />
          <button 
            onClick={() => setSayLouder(!sayLouder)}
            className={`absolute top-4 right-4 p-2 rounded-full transition-all ${sayLouder ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}
            title="Voice Announcements"
          >
            {sayLouder ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>
        </div>
      </div>

      <div className="bg-indigo-600 p-12 rounded-[3rem] text-white text-center shadow-2xl shadow-indigo-200 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-indigo-500 to-indigo-700" />
        <div className="relative z-10">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60 mb-4">Station {currentStation} of {stations}</p>
          <h3 className="text-8xl font-black tracking-tighter mb-8">{timeLeft}s</h3>
          
          <div className="flex justify-center gap-4">
            <button 
              onClick={() => setIsRunning(!isRunning)}
              className="w-20 h-20 bg-white text-indigo-600 rounded-full flex items-center justify-center shadow-xl hover:scale-105 transition-all"
            >
              {isRunning ? <Pause size={32} /> : <Play size={32} className="ml-1" />}
            </button>
            <button 
              onClick={handleReset}
              className="w-20 h-20 bg-white/20 text-white rounded-full flex items-center justify-center hover:bg-white/30 transition-all"
            >
              <RotateCcw size={32} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Spin It ---
const SpinIt = () => {
  const [items, setItems] = useState(['Arjun', 'Priya', 'Rahul', 'Ananya', 'Vikram']);
  const [newItem, setNewItem] = useState('');
  const [winner, setWinner] = useState<string | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const spinTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (spinTimeoutRef.current) clearTimeout(spinTimeoutRef.current);
    };
  }, []);

  const handleSpin = () => {
    if (items.length === 0 || isSpinning) return;
    setIsSpinning(true);
    setWinner(null);
    if (spinTimeoutRef.current) clearTimeout(spinTimeoutRef.current);
    spinTimeoutRef.current = setTimeout(() => {
      const randomIndex = Math.floor(Math.random() * items.length);
      setWinner(items[randomIndex]);
      setIsSpinning(false);
    }, 2000);
  };

  const addItem = () => {
    if (newItem.trim()) {
      setItems([...items, newItem.trim()]);
      setNewItem('');
    }
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm text-center">
        <div className="relative w-48 h-48 mx-auto mb-8">
          <motion.div 
            animate={isSpinning ? { rotate: 360 * 5 } : { rotate: 0 }}
            transition={{ duration: 2, ease: "easeOut" }}
            className="w-full h-full rounded-full border-8 border-slate-900 border-t-orange-500 flex items-center justify-center"
          >
            <RefreshCw size={48} className={`text-slate-200 ${isSpinning ? 'animate-spin' : ''}`} />
          </motion.div>
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -mt-2">
            <div className="w-4 h-8 bg-rose-500 rounded-full shadow-lg" />
          </div>
        </div>

        <AnimatePresence mode="wait">
          {winner ? (
            <motion.div 
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="mb-8"
            >
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">The Winner is</p>
              <h3 className="text-4xl font-black text-orange-500 uppercase tracking-tighter">{winner}</h3>
            </motion.div>
          ) : (
            <div className="h-20" />
          )}
        </AnimatePresence>

        <button 
          onClick={handleSpin}
          disabled={isSpinning || items.length === 0}
          className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
        >
          {isSpinning ? 'Spinning...' : 'Spin It!'}
        </button>
      </div>

      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <div className="flex gap-2 mb-6">
          <input 
            type="text" 
            value={newItem}
            onChange={e => setNewItem(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && addItem()}
            placeholder="Add name..."
            className="flex-1 px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-orange-200 font-bold"
          />
          <button onClick={addItem} className="p-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-all">
            <Plus size={24} />
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {items.map((item, i) => (
            <div key={i} className="px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl flex items-center space-x-2 group">
              <span className="text-sm font-bold text-slate-700">{item}</span>
              <button onClick={() => removeItem(i)} className="text-slate-300 hover:text-rose-500 transition-colors">
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// --- Workout Timer ---
const WorkoutTimer = () => {
  const [work, setWork] = useState(40);
  const [rest, setRest] = useState(20);
  const [rounds, setRounds] = useState(8);
  const [currentRound, setCurrentRound] = useState(1);
  const [isWorkPhase, setIsWorkPhase] = useState(true);
  const [timeLeft, setTimeLeft] = useState(work);
  const [isRunning, setIsRunning] = useState(false);
  const [sayLouder, setSayLouder] = useState(false);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    if (isRunning && sayLouder) {
      if (timeLeft <= 10 && timeLeft > 0) {
        speakText(timeLeft.toString());
      } else if (timeLeft === 0) {
        if (isWorkPhase) {
          speakText("Rest!");
        } else {
          if (currentRound < rounds) {
            speakText("Work!");
          } else {
            speakText("Workout complete!");
          }
        }
      }
    }
  }, [timeLeft, isRunning, sayLouder, isWorkPhase, currentRound, rounds]);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(t => t - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      if (isWorkPhase) {
        setIsWorkPhase(false);
        setTimeLeft(rest);
      } else {
        if (currentRound < rounds) {
          setCurrentRound(r => r + 1);
          setIsWorkPhase(true);
          setTimeLeft(work);
        } else {
          setIsRunning(false);
        }
      }
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isRunning, timeLeft, isWorkPhase, currentRound, rounds, work, rest]);

  const handleReset = () => {
    setIsRunning(false);
    setCurrentRound(1);
    setIsWorkPhase(true);
    setTimeLeft(work);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm relative">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Work</label>
          <input
            type="number"
            min={1}
            value={work}
            onChange={e => {
              const val = Math.max(1, parseInt(e.target.value, 10) || 1);
              setWork(val);
              if (!isRunning && isWorkPhase && currentRound === 1) setTimeLeft(val);
            }}
            className="w-full font-black text-slate-800 outline-none bg-transparent"
          />
          <button 
            onClick={() => setSayLouder(!sayLouder)}
            className={`absolute top-2 right-2 p-1.5 rounded-full transition-all ${sayLouder ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'}`}
            title="Voice Announcements"
          >
            {sayLouder ? <Volume2 size={14} /> : <VolumeX size={14} />}
          </button>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Rest</label>
          <input
            type="number"
            min={0}
            value={rest}
            onChange={e => setRest(Math.max(0, parseInt(e.target.value, 10) || 0))}
            className="w-full font-black text-slate-800 outline-none bg-transparent"
          />
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Rounds</label>
          <input
            type="number"
            min={1}
            value={rounds}
            onChange={e => setRounds(Math.max(1, parseInt(e.target.value, 10) || 1))}
            className="w-full font-black text-slate-800 outline-none bg-transparent"
          />
        </div>
      </div>

      <div className={`p-12 rounded-[3rem] text-white text-center shadow-2xl transition-all duration-500 ${isWorkPhase ? 'bg-emerald-500 shadow-emerald-200' : 'bg-amber-500 shadow-amber-200'}`}>
        <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60 mb-4">Round {currentRound} of {rounds}</p>
        <h3 className="text-2xl font-black uppercase tracking-widest mb-2">{isWorkPhase ? 'WORK' : 'REST'}</h3>
        <h3 className="text-8xl font-black tracking-tighter mb-8">{timeLeft}s</h3>
        
        <div className="flex justify-center gap-4">
          <button onClick={() => setIsRunning(!isRunning)} className="w-20 h-20 bg-white text-slate-900 rounded-full flex items-center justify-center shadow-xl hover:scale-105 transition-all">
            {isRunning ? <Pause size={32} /> : <Play size={32} className="ml-1" />}
          </button>
          <button onClick={handleReset} className="w-20 h-20 bg-white/20 text-white rounded-full flex items-center justify-center hover:bg-white/30 transition-all">
            <RotateCcw size={32} />
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Round Robin ---
const RoundRobin = () => {
  const [teams, setTeams] = useState(['Team A', 'Team B', 'Team C', 'Team D']);
  const [newTeam, setNewTeam] = useState('');

  const generateSchedule = () => {
    const n = teams.length;
    const schedule = [];
    const tempTeams = [...teams];
    if (n % 2 !== 0) tempTeams.push('BYE');
    const numTeams = tempTeams.length;
    const rounds = numTeams - 1;
    const matchesPerRound = numTeams / 2;

    for (let r = 0; r < rounds; r++) {
      const roundMatches = [];
      for (let m = 0; m < matchesPerRound; m++) {
        const t1 = tempTeams[m];
        const t2 = tempTeams[numTeams - 1 - m];
        if (t1 !== 'BYE' && t2 !== 'BYE') {
          roundMatches.push(`${t1} vs ${t2}`);
        }
      }
      schedule.push({ round: r + 1, matches: roundMatches });
      tempTeams.splice(1, 0, tempTeams.pop()!);
    }
    return schedule;
  };

  const schedule = generateSchedule();

  return (
    <div className="space-y-6">
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <div className="flex gap-2 mb-6">
          <input 
            type="text" 
            value={newTeam}
            onChange={e => setNewTeam(e.target.value)}
            placeholder="Add team..."
            className="flex-1 px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none font-bold"
          />
          <button onClick={() => { if(newTeam.trim()) setTeams([...teams, newTeam.trim()]); setNewTeam(''); }} className="p-3 bg-indigo-600 text-white rounded-xl">
            <Plus size={24} />
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {teams.map((t, i) => (
            <span key={i} className="px-3 py-1 bg-slate-50 border border-slate-100 rounded-lg text-xs font-bold text-slate-600">{t}</span>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {schedule.map((r) => (
          <div key={r.round} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Round {r.round}</h4>
            <div className="space-y-2">
              {r.matches.map((m, i) => (
                <div key={i} className="p-3 bg-slate-50 rounded-xl text-sm font-black text-slate-800 text-center uppercase tracking-tight">
                  {m}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- Skill Deck ---
const SkillDeck = () => {
  const skills = [
    { name: 'Dribbling', levels: ['Basic Control', 'Change of Direction', 'Speed Dribbling', 'Advanced Feints'] },
    { name: 'Passing', levels: ['Short Pass', 'Long Pass', 'One-Touch', 'Through Balls'] },
    { name: 'Shooting', levels: ['Inside Foot', 'Laces', 'Volley', 'Curved Shot'] },
  ];

  return (
    <div className="space-y-6">
      {skills.map((skill, i) => (
        <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <h4 className="text-xl font-black text-slate-800 uppercase tracking-tighter mb-6 flex items-center">
            <Target size={20} className="mr-2 text-orange-500" />
            {skill.name}
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {skill.levels.map((level, j) => (
              <div key={j} className="p-6 bg-slate-50 rounded-3xl border border-slate-100 relative group hover:bg-indigo-600 transition-all duration-500">
                <span className="absolute top-4 right-4 text-[10px] font-black text-slate-300 group-hover:text-white/50">Level {j+1}</span>
                <p className="font-black text-slate-800 group-hover:text-white uppercase tracking-tight">{level}</p>
                <div className="mt-4 flex gap-1">
                  {[...Array(4)].map((_, k) => (
                    <div key={k} className={`h-1 flex-1 rounded-full ${k <= j ? 'bg-orange-500' : 'bg-slate-200 group-hover:bg-white/20'}`} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

// --- Main Component ---
const ClassroomWidgets: React.FC = () => {
  const [activeWidget, setActiveWidget] = useState<string | null>(null);

  const widgets = [
    { id: 'rubric', name: 'Easy Rubric', icon: ListChecks, description: 'Score students with saved rubrics', color: 'bg-indigo-500', component: <EasyRubric /> },
    { id: 'laptimer', name: 'Run-Lap-Tap', icon: Timer, description: 'Lap timer for runners', color: 'bg-rose-500', component: <RunLapTap /> },
    { id: 'station', name: 'Station Timer', icon: Clock, description: 'Manage rotation stations', color: 'bg-amber-500', component: <StationTimer /> },
    { id: 'spin', name: 'Spin It', icon: RefreshCw, description: 'Random picker wheel', color: 'bg-emerald-500', component: <SpinIt /> },
    { id: 'workout', name: 'Workout Timer', icon: Dumbbell, description: 'Interval training timer', color: 'bg-blue-500', component: <WorkoutTimer /> },
    { id: 'roundrobin', name: 'Round Robin', icon: Trophy, description: 'Tournament schedules', color: 'bg-purple-500', component: <RoundRobin /> },
    { id: 'skilldeck', name: 'Skill Deck', icon: Layers, description: 'Skill progression display', color: 'bg-orange-500', component: <SkillDeck /> },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl border border-white/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[100px] rounded-full" />
        <div className="relative z-10">
          <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-md border border-white/20 px-4 py-1.5 rounded-full mb-4">
            <Zap size={14} className="text-orange-400" />
            <span className="text-[10px] font-black uppercase tracking-widest">7 Free Classroom Widgets</span>
          </div>
          <h1 className="text-4xl font-black tracking-tighter mb-4">Classroom <span className="text-orange-500">Essentials</span></h1>
          <p className="text-slate-400 text-sm font-medium max-w-md">
            Free tools teachers use in the gym every single lesson. No subscription required — free forever, no login needed.
          </p>
        </div>
      </div>

      {activeWidget ? (
        <div className="space-y-6">
          <button 
            onClick={() => setActiveWidget(null)}
            className="flex items-center space-x-2 text-slate-400 hover:text-slate-900 font-black uppercase tracking-widest text-[10px] transition-colors"
          >
            <ChevronLeft size={16} />
            <span>Back to Widgets</span>
          </button>
          
          <div className="max-w-3xl mx-auto">
            {widgets.find(w => w.id === activeWidget)?.component}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {widgets.map((widget) => (
            <button
              key={widget.id}
              onClick={() => setActiveWidget(widget.id)}
              className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all text-left group relative overflow-hidden"
            >
              <div className={`w-14 h-14 ${widget.color} rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg group-hover:rotate-6 transition-transform`}>
                <widget.icon size={28} />
              </div>
              <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-2">{widget.name}</h3>
              <p className="text-slate-400 text-xs font-medium leading-relaxed mb-6">{widget.description}</p>
              <div className="flex items-center text-[10px] font-black text-indigo-600 uppercase tracking-widest">
                <span>Open Tool</span>
                <ChevronRight size={14} className="ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
              <div className="absolute top-4 right-4 px-2 py-1 bg-slate-50 rounded text-[8px] font-black text-slate-400 uppercase tracking-tighter">Free Forever</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ClassroomWidgets;
