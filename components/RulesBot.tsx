import React, { useState, useRef, useEffect } from 'react';
import { 
  MessageSquare, 
  Send, 
  Book, 
  User, 
  Bot, 
  Loader2, 
  Mic, 
  Volume2, 
  Sparkles, 
  HelpCircle, 
  Gamepad2, 
  Trophy, 
  Flame, 
  CheckCircle2,
  RotateCcw
} from 'lucide-react';
import { getSportsRule } from '../services/geminiService.ts';
import { Language } from '../types.ts';
import { VoiceTranscribeButton } from './VoiceTranscribeButton';

interface RuleDoubtPreset {
  sport: string;
  category: 'board' | 'field' | 'court' | 'combat';
  question: string;
}

const COMMON_DOUBTS: RuleDoubtPreset[] = [
  { sport: 'Chess', category: 'board', question: 'What is En Passant pawn capture and when can it be performed?' },
  { sport: 'Chess', category: 'board', question: 'What are the 5 exact conditions for a draw in Chess (Stalemate, 50-move rule, etc.)?' },
  { sport: 'Carrom', category: 'board', question: 'What happens if the Queen is pocketed without covering it with a carrom-man on the next stroke?' },
  { sport: 'Carrom', category: 'board', question: 'Can a player strike backwards using thumb or index finger according to official ICF rules?' },
  { sport: 'Kabaddi', category: 'field', question: 'What are the rules regarding the Bonus Line and Cant during a raid in Pro Kabaddi / AKFI?' },
  { sport: 'Badminton', category: 'court', question: 'Is the shuttle considered IN or OUT if it touches the boundary tape line during a rally?' },
  { sport: 'Football', category: 'field', question: 'Can a player be in an offside position directly from a throw-in or corner kick?' },
  { sport: 'Cricket', category: 'field', question: 'Explain the Dead Ball and LBW (Leg Before Wicket) umpire criteria under MCC Law.' },
  { sport: 'Table Tennis', category: 'court', question: 'What is the correct ball toss height (16 cm) during an official ITTF legal serve?' },
  { sport: 'Volleyball', category: 'court', question: 'Can a player touch the net or cross the center line during a block?' },
  { sport: 'Basketball', category: 'court', question: 'What is the 3-second key violation and 8-second backcourt rule?' },
];

const ALL_SPORTS_AND_GAMES = [
  // Board & Table Games
  { id: 'Chess', name: 'Chess (Board Game)', icon: '♟️', type: 'board' },
  { id: 'Carrom', name: 'Carrom (Board Game)', icon: '⚪', type: 'board' },
  { id: 'Table Tennis', name: 'Table Tennis (Ping Pong)', icon: '🏓', type: 'board' },
  
  // Field & Court Sports
  { id: 'Kabaddi', name: 'Kabaddi (AKFI / Pro Kabaddi)', icon: '🤼', type: 'court' },
  { id: 'Kho-Kho', name: 'Kho-Kho', icon: '🏃', type: 'field' },
  { id: 'Cricket', name: 'Cricket (BCCI / ICC / MCC)', icon: '🏏', type: 'field' },
  { id: 'Football', name: 'Football / Soccer (FIFA)', icon: '⚽', type: 'field' },
  { id: 'Basketball', name: 'Basketball (FIBA)', icon: '🏀', type: 'court' },
  { id: 'Volleyball', name: 'Volleyball (FIVB)', icon: '🏐', type: 'court' },
  { id: 'Badminton', name: 'Badminton (BWF)', icon: '🏸', type: 'court' },
  { id: 'Tennis', name: 'Tennis (ITF)', icon: '🎾', type: 'court' },
  { id: 'Athletics', name: 'Athletics & Track/Field', icon: '👟', type: 'field' },
  { id: 'Hockey', name: 'Field Hockey (FIH)', icon: '🏑', type: 'field' },
  { id: 'Swimming', name: 'Swimming (FINA/World Aquatics)', icon: '🏊', type: 'pool' },
  { id: 'Yoga', name: 'Yoga & Asanas (Ministry of AYUSH)', icon: '🧘', type: 'indoor' },
];

const RulesBot: React.FC = () => {
  const [messages, setMessages] = useState<{ role: 'user' | 'bot'; text: string; timestamp?: string }[]>([
    {
      role: 'bot',
      text: 'Namaste Coaches & Teachers! I am your Official Sports & Board Games Rules Engine.\n\n🎙️ You can speak directly with your microphone to ask any rule doubt (e.g. Chess En Passant, Carrom Queen cover, Kabaddi Bonus, or Football Offside).',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sport, setSport] = useState('Chess');
  const [language, setLanguage] = useState<Language>('English');
  const [filterType, setFilterType] = useState<'all' | 'board' | 'court' | 'field'>('all');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleSend = async (customQuery?: string) => {
    const userMsg = (customQuery || input).trim();
    if (!userMsg) return;

    setInput('');
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setMessages(prev => [...prev, { role: 'user', text: userMsg, timestamp: now }]);
    setLoading(true);

    try {
      const response = await getSportsRule(sport, userMsg, language);
      setMessages(prev => [
        ...prev,
        {
          role: 'bot',
          text: response || "I couldn't find information on that rule. Please verify the official rule handbook.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } catch (e: any) {
      setMessages(prev => [
        ...prev,
        {
          role: 'bot',
          text: `⚠️ Could not retrieve rule right now: ${e?.message || 'Network error'}. Please try again.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleVoiceTranscribed = (transcribedText: string) => {
    setInput(transcribedText);
    handleSend(transcribedText);
  };

  const filteredSports = ALL_SPORTS_AND_GAMES.filter(s => {
    if (filterType === 'all') return true;
    if (filterType === 'board') return s.type === 'board';
    if (filterType === 'court') return s.type === 'court' || s.type === 'indoor';
    if (filterType === 'field') return s.type === 'field' || s.type === 'pool';
    return true;
  });

  const relevantDoubts = COMMON_DOUBTS.filter(d => d.sport.toLowerCase() === sport.toLowerCase());

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col bg-white rounded-3xl shadow-xl border-2 border-slate-900 overflow-hidden">
      
      {/* Header */}
      <div className="bg-slate-900 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between text-white gap-3 border-b-2 border-slate-900">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-amber-500 text-slate-950 rounded-2xl font-black shadow">
            <Book size={20} />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-black text-base text-white">Rule Book & Board Games Engine</h3>
              <span className="px-2 py-0.5 bg-amber-400/20 text-amber-300 text-[10px] font-black uppercase rounded border border-amber-400/30">
                Voice Enabled 🎙️
              </span>
            </div>
            <p className="text-xs text-slate-300 font-medium">Official Rulebooks for Board Games, Field & Court Sports</p>
          </div>
        </div>

        {/* Sport & Language Picker */}
        <div className="flex items-center gap-2 flex-wrap">
          <select 
            className="bg-slate-800 text-white border border-slate-700 text-xs font-bold rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-amber-400" 
            value={sport} 
            onChange={e => setSport(e.target.value)}
          >
            {ALL_SPORTS_AND_GAMES.map(s => (
              <option key={s.id} value={s.id}>
                {s.icon} {s.name}
              </option>
            ))}
          </select>

          <select 
            className="bg-slate-800 text-white border border-slate-700 text-xs font-bold rounded-xl px-2.5 py-2 outline-none focus:ring-2 focus:ring-amber-400" 
            value={language} 
            onChange={e => setLanguage(e.target.value as any)}
          >
            <option value="English">🇬🇧 ENG</option>
            <option value="Hindi">🇮🇳 HIN</option>
            <option value="Marathi">🇮🇳 MAR</option>
            <option value="Tamil">🇮🇳 TAM</option>
          </select>
        </div>
      </div>

      {/* Quick Category Bar */}
      <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 flex items-center justify-between gap-2 overflow-x-auto text-xs">
        <div className="flex items-center space-x-1">
          <span className="text-[11px] font-black text-slate-500 uppercase mr-1">Filter:</span>
          {(['all', 'board', 'court', 'field'] as const).map(cat => (
            <button
              key={cat}
              onClick={() => setFilterType(cat)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase transition ${
                filterType === cat
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              {cat === 'all' ? 'All Games' : cat === 'board' ? '♟️ Board Games' : cat === 'court' ? '🏸 Court Games' : '⚽ Field Sports'}
            </button>
          ))}
        </div>

        {relevantDoubts.length > 0 && (
          <div className="hidden md:flex items-center space-x-1.5">
            <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md">
              Quick Rule Doubts:
            </span>
            {relevantDoubts.slice(0, 2).map((d, i) => (
              <button
                key={i}
                onClick={() => handleSend(d.question)}
                className="px-2 py-0.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-md text-[11px] font-semibold truncate max-w-[200px]"
                title={d.question}
              >
                {d.question}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50" ref={scrollRef}>
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] sm:max-w-[75%] p-4 rounded-3xl shadow-sm space-y-1.5 ${
              m.role === 'user' 
                ? 'bg-slate-900 text-white rounded-br-none' 
                : 'bg-white text-slate-800 rounded-bl-none border-2 border-slate-200'
            }`}>
              <div className="flex items-center justify-between space-x-2 border-b border-white/10 pb-1">
                <div className="flex items-center space-x-1.5 opacity-80 text-[10px] font-black uppercase tracking-wider">
                  {m.role === 'user' ? <User size={13} className="text-amber-400" /> : <Bot size={13} className="text-emerald-500" />}
                  <span>{m.role === 'user' ? 'Teacher / Coach (Voice/Text)' : `${sport} Rule Official`}</span>
                </div>
                {m.timestamp && (
                  <span className="text-[9px] opacity-60 font-semibold">{m.timestamp}</span>
                )}
              </div>
              <p className="text-xs sm:text-sm font-medium leading-relaxed whitespace-pre-wrap">{m.text}</p>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-white p-4 rounded-3xl rounded-bl-none border-2 border-slate-200 shadow-sm flex items-center space-x-2">
              <Loader2 className="animate-spin text-amber-500" size={18} />
              <span className="text-xs font-bold text-slate-600">Checking official rule book regulations...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input Bar with Voice Transcription Mic Button */}
      <div className="p-3 sm:p-4 bg-white border-t-2 border-slate-200">
        <div className="flex items-center space-x-2 bg-slate-50 p-1.5 sm:p-2 rounded-2xl border-2 border-slate-900 focus-within:ring-2 focus-within:ring-amber-400 transition-all">
          
          {/* Voice Input Button */}
          <VoiceTranscribeButton
            onTranscribe={handleVoiceTranscribed}
            promptContext={`This audio is a sports teacher or coach speaking a question about ${sport} rules and regulations. Transcribe clearly.`}
            size="md"
            variant="solid"
          />

          <input 
            className="flex-1 bg-transparent px-2 sm:px-3 py-2 outline-none font-bold text-xs sm:text-sm text-slate-800 placeholder-slate-400"
            placeholder={`Ask any rule or tap 🎙️ to speak doubt for ${sport}...`}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !loading && handleSend()}
          />

          <button 
            onClick={() => handleSend()}
            disabled={loading || !input.trim()}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-wider disabled:opacity-40 transition-colors flex items-center space-x-1.5 active:scale-95"
          >
            <Send size={15} />
            <span className="hidden sm:inline">Ask</span>
          </button>
        </div>

        <div className="flex items-center justify-between text-[10px] text-slate-400 px-2 pt-1 font-semibold">
          <span>🎙️ Powered by Gemini Voice Transcription (gemini-3.5-transcribe)</span>
          <span>Official rules: FIFA, ICC, FIDE, ICF, AKFI, BWF, ITTF</span>
        </div>
      </div>
    </div>
  );
};

export default RulesBot;
