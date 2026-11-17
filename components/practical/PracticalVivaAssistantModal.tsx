import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  BookOpen, 
  HelpCircle, 
  CheckCircle2, 
  ChevronRight, 
  Filter, 
  Shuffle, 
  MessageSquare,
  Award,
  Layers,
  Copy,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { VivaQuestionPrompt, Student } from '../../types.ts';
import { safeCopyToClipboard } from '../../utils/safeBrowser.ts';

interface PracticalVivaAssistantModalProps {
  student?: Student | null;
  selectedGame?: string;
  selectedAsanas?: string[];
  onClose: () => void;
  onApplyScore?: (score: number, notes?: string) => void;
}

const VIVA_QUESTION_BANK: VivaQuestionPrompt[] = [
  // BASKETBALL
  {
    id: 'bb_1',
    category: 'Game',
    subCategory: 'Basketball',
    question: 'What is the standard height of the basketball rim from the court floor, and what are the court dimensions?',
    expectedAnswer: 'The rim is 3.05 meters (10 feet) high. Standard FIBA court dimensions are 28 meters in length by 15 meters in width.',
    marksWeight: 2
  },
  {
    id: 'bb_2',
    category: 'Game',
    subCategory: 'Basketball',
    question: 'Explain the "3-Second Rule", "5-Second Rule", and "24-Second Shot Clock Rule" in basketball.',
    expectedAnswer: '3-Second: Offensive player cannot stay in restricted key area for >3s. 5-Second: Closely guarded player must pass/shoot/dribble within 5s. 24-Second: Team must attempt field goal hitting rim within 24s of gaining possession.',
    marksWeight: 3
  },
  {
    id: 'bb_3',
    category: 'Game',
    subCategory: 'Basketball',
    question: 'What is the difference between a charging foul and a blocking foul?',
    expectedAnswer: 'Charging is an offensive foul where the ball-handler runs into a defender with established legal guarding position. Blocking is a defensive foul when defender moves into the path of an offensive driver without established position.',
    marksWeight: 2
  },
  // FOOTBALL / SOCCER
  {
    id: 'fb_1',
    category: 'Game',
    subCategory: 'Football',
    question: 'Explain the "Offside Rule" according to Law 11 of IFAB.',
    expectedAnswer: 'A player is in an offside position if they are nearer to the opponent’s goal line than both the ball and the second-last opponent at the instant the ball is played to them, unless in their own half.',
    marksWeight: 3
  },
  {
    id: 'fb_2',
    category: 'Game',
    subCategory: 'Football',
    question: 'What are the dimensions of the penalty box and the distance of the penalty spot from the goal line?',
    expectedAnswer: 'The penalty area extends 16.5m (18 yards) from each goalpost. The penalty spot is precisely 11 meters (12 yards) from the center of the goal line.',
    marksWeight: 2
  },
  // VOLLEYBALL
  {
    id: 'vb_1',
    category: 'Game',
    subCategory: 'Volleyball',
    question: 'What is the role and specific playing restrictions of a "Libero" in volleyball?',
    expectedAnswer: 'The Libero is a defensive specialist wearing a contrasting jersey. Restrictions: Cannot attack ball above net height, cannot block or attempt to block, cannot serve (under standard FIVB rules), and cannot set overhead in front of the attack line for an attack.',
    marksWeight: 3
  },
  {
    id: 'vb_2',
    category: 'Game',
    subCategory: 'Volleyball',
    question: 'What is the net height for senior Men and Women in volleyball?',
    expectedAnswer: 'Men: 2.43 meters (7 feet 11⅝ inches). Women: 2.24 meters (7 feet 4⅛ inches). Court dimensions: 18m x 9m with 3m attack line.',
    marksWeight: 2
  },
  // BADMINTON
  {
    id: 'bad_1',
    category: 'Game',
    subCategory: 'Badminton',
    question: 'What is the scoring system in standard BWF badminton, and explain the "setting" rule at 20-all.',
    expectedAnswer: 'Rally point system: Best of 3 games to 21 points. At 20-all, a side must lead by 2 clear points to win. At 29-all, the first side to score the 30th point wins the game.',
    marksWeight: 2
  },
  {
    id: 'bad_2',
    category: 'Game',
    subCategory: 'Badminton',
    question: 'What are the service fault rules regarding racket angle and contact height in badminton?',
    expectedAnswer: 'The shuttle must be contacted below 1.15 meters from the court surface (or below lowest rib under older rules), and the racket shaft must be pointing in a downward direction during contact.',
    marksWeight: 2
  },
  // CRICKET
  {
    id: 'cr_1',
    category: 'Game',
    subCategory: 'Cricket',
    question: 'Name and explain at least 5 ways a batsman can be dismissed in cricket.',
    expectedAnswer: '1. Bowled, 2. Caught, 3. Leg Before Wicket (LBW), 4. Run Out, 5. Stumped, 6. Hit Wicket, 7. Obstructing the field, 8. Timed Out, 9. Hit the ball twice.',
    marksWeight: 3
  },
  // KHO-KHO & KABADDI
  {
    id: 'kk_1',
    category: 'Game',
    subCategory: 'Kho-Kho / Kabaddi',
    question: 'Explain the "Chaser" direction rule in Kho-Kho and the "Bonus Line / Baulk Line" in Kabaddi.',
    expectedAnswer: 'Kho-Kho: Once a active chaser chooses a direction past the cross lane, they cannot change direction without touching the pole. Kabaddi: Raider must cross the Baulk Line for a valid raid; touching foot past Bonus Line with trailing foot in air scores bonus point.',
    marksWeight: 3
  },
  // YOGA ASANAS
  {
    id: 'yo_1',
    category: 'Yoga',
    subCategory: 'Diabetes & Obesity Asanas',
    question: 'Which asana is considered most beneficial for stimulating the pancreas in diabetes, and what are its contraindications?',
    expectedAnswer: 'Ardha Matsyendrasana (Half Lord of the Fishes Pose) or Bhujangasana / Mandukasana. Contraindications: Pregnant women, people with severe spinal injury, peptic ulcers, or recent abdominal surgery must avoid.',
    marksWeight: 3
  },
  {
    id: 'yo_2',
    category: 'Yoga',
    subCategory: 'Asthma & Hypertension',
    question: 'Explain how Gomukhasana and Sukhasana assist individuals suffering from Asthma.',
    expectedAnswer: 'Gomukhasana expands the ribcage, stretches intercostal muscles, and improves lung vital capacity. Sukhasana calms the autonomic nervous system, promoting diaphragmatic deep oxygenation.',
    marksWeight: 2
  },
  {
    id: 'yo_3',
    category: 'Yoga',
    subCategory: 'Postural Alignment',
    question: 'Describe Trikonasana (Triangle Pose) and list its therapeutic benefits for physical posture.',
    expectedAnswer: 'Student stands wide, arms parallel, bending sideways to touch ankle while looking up at opposite hand. Benefits: Corrects scoliosis, strengthens hamstrings, improves lateral spinal flexibility and core stability.',
    marksWeight: 2
  },
  // FITNESS & KHELO INDIA
  {
    id: 'fit_1',
    category: 'Fitness',
    subCategory: 'Khelo India Protocols',
    question: 'What physical component does the "Sit and Reach" test measure, and why must knees remain locked?',
    expectedAnswer: 'Measures hamstring and lower back (lumbar spine) flexibility. Knees must remain flat against the floor to isolate posterior chain muscle length rather than allowing knee flexion to artificially extend reach.',
    marksWeight: 2
  },
  {
    id: 'fit_2',
    category: 'Fitness',
    subCategory: 'Khelo India Protocols',
    question: 'What is the protocol difference between the Partial Curl-Ups test and standard Push-Ups?',
    expectedAnswer: 'Partial Curl-Ups test core abdominal muscular endurance by sliding fingertips 10cm forward on a mat. Push-Ups test upper body pectoral/triceps muscular strength and endurance in a 60s cadence trial.',
    marksWeight: 2
  },
  // GENERAL PE THEORY
  {
    id: 'pe_1',
    category: 'General PE',
    subCategory: 'Sports Injuries & Biomechanics',
    question: 'What does the PRICE / PRICER protocol stand for in acute sports injury management?',
    expectedAnswer: 'P: Protect, R: Rest, I: Ice (cryotherapy), C: Compression, E: Elevation, R: Referral / Rehabilitation.',
    marksWeight: 2
  },
  {
    id: 'pe_2',
    category: 'General PE',
    subCategory: 'Planning & Tournaments',
    question: 'What is a "Bye" in a single knockout tournament, and how is the number of Byes calculated?',
    expectedAnswer: 'A Bye is an advantage given to a team to advance to the next round without playing in round 1. Formula: Number of Byes = Next highest power of 2 minus total number of participating teams (2ⁿ - N).',
    marksWeight: 3
  }
];

export const PracticalVivaAssistantModal: React.FC<PracticalVivaAssistantModalProps> = ({
  student,
  selectedGame,
  selectedAsanas,
  onClose,
  onApplyScore
}) => {
  const [selectedCategory, setSelectedCategory] = useState<'All' | 'Game' | 'Yoga' | 'Fitness' | 'General PE'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null);
  const [showAnswerMap, setShowAnswerMap] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [quickScore, setQuickScore] = useState<number>(5);
  const [notes, setNotes] = useState<string>('');

  const toggleAnswer = (id: string) => {
    setShowAnswerMap(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCopyQuestion = async (q: VivaQuestionPrompt) => {
    const ok = await safeCopyToClipboard(
      `CBSE Viva Question: ${q.question}\nExpected Answer: ${q.expectedAnswer}`,
      'Viva question & answer copied!'
    );
    if (ok) {
      setCopiedId(q.id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  // Filtered list
  const filteredQuestions = VIVA_QUESTION_BANK.filter(q => {
    if (selectedCategory !== 'All' && q.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const matchSearch = q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          q.subCategory.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          q.expectedAnswer.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchSearch) return false;
    }
    return true;
  });

  const getRecommendedQuestions = () => {
    return VIVA_QUESTION_BANK.filter(q => {
      if (selectedGame && q.subCategory.toLowerCase().includes(selectedGame.toLowerCase())) return true;
      if (selectedAsanas && selectedAsanas.length > 0 && q.category === 'Yoga') return true;
      return false;
    });
  };

  const recommendedQuestions = getRecommendedQuestions();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="bg-white w-full max-w-4xl rounded-[2.5rem] shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="bg-[#0D2B52] text-white p-5 sm:p-6 flex items-center justify-between border-b border-indigo-900/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[#D4A017] text-slate-950 rounded-2xl shadow-sm">
              <MessageSquare size={22} className="stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black tracking-tight text-white uppercase">
                  CBSE Viva Voce Examiner Question Bank (Max 5 Marks)
                </h3>
                <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                  PE Subject Code 048
                </span>
              </div>
              <p className="text-xs text-indigo-200 mt-0.5">
                {student ? (
                  <span>Student: <strong>{student.name}</strong> (Roll #{student.rollNumber || 'N/A'}, Class {student.grade}-{student.section})</span>
                ) : (
                  <span>Comprehensive oral question library with standard CBSE model answers</span>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Filters & Selector Bar */}
        <div className="bg-slate-50 p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          {/* Category Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            {(['All', 'Game', 'Yoga', 'Fitness', 'General PE'] as const).map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-[#0D2B52] text-white shadow-sm'
                    : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                {cat === 'All' ? 'All Categories' : cat}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="w-full sm:w-64">
            <input
              type="text"
              placeholder="Search topic or rules..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full px-3.5 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1 custom-scrollbar">
          {/* Recommendations Banner if Student Specific */}
          {recommendedQuestions.length > 0 && selectedCategory === 'All' && !searchQuery && (
            <div className="p-4 bg-amber-50/80 border-2 border-amber-200 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-amber-950 font-black text-xs uppercase tracking-wider">
                <Sparkles size={16} className="text-amber-600" />
                <span>Tailored for Student's Chosen Game ({selectedGame || 'Selected Sport'}) & Yoga Asanas</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {recommendedQuestions.slice(0, 4).map(q => (
                  <div key={q.id} className="p-3 bg-white border border-amber-200 rounded-xl space-y-1.5 shadow-2xs">
                    <div className="flex items-center justify-between text-[10px] font-black text-amber-900 uppercase">
                      <span>{q.subCategory}</span>
                      <span>Weight: {q.marksWeight}M</span>
                    </div>
                    <p className="text-xs text-slate-900 font-bold leading-snug">{q.question}</p>
                    <button
                      onClick={() => toggleAnswer(q.id)}
                      className="text-[11px] font-extrabold text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <span>{showAnswerMap[q.id] ? 'Hide Model Answer' : 'Show Model Answer'}</span>
                    </button>
                    {showAnswerMap[q.id] && (
                      <p className="text-[11.5px] text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-200 leading-relaxed font-medium">
                        <strong>Expected Answer:</strong> {q.expectedAnswer}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Questions Grid */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center justify-between">
              <span>Oral Question Bank ({filteredQuestions.length} Questions)</span>
              <span className="text-[10px] font-bold text-slate-400">Click question to reveal evaluation answer key</span>
            </h4>

            {filteredQuestions.map((q, idx) => {
              const isAnswerOpen = showAnswerMap[q.id];
              return (
                <div
                  key={q.id}
                  className={`p-4 rounded-2xl border-2 transition-all ${
                    isAnswerOpen 
                      ? 'bg-indigo-50/40 border-indigo-200 shadow-sm' 
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[10px] font-black uppercase">
                            {q.category}: {q.subCategory}
                          </span>
                          <span className="text-[10px] font-extrabold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                            {q.marksWeight} Marks Weightage
                          </span>
                        </div>
                        <p className="text-xs font-black text-slate-900 leading-relaxed">
                          {q.question}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleCopyQuestion(q)}
                        className="p-2 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
                        title="Copy Question & Answer to Clipboard"
                      >
                        {copiedId === q.id ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                      </button>
                      <button
                        onClick={() => toggleAnswer(q.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                          isAnswerOpen 
                            ? 'bg-indigo-600 text-white' 
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                      >
                        {isAnswerOpen ? 'Hide Answer' : 'View Answer Key'}
                      </button>
                    </div>
                  </div>

                  {isAnswerOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-3 pt-3 border-t border-indigo-100 text-xs text-slate-700 leading-relaxed space-y-1"
                    >
                      <p className="font-bold text-indigo-950 uppercase text-[10px] tracking-wider">
                        CBSE Expected Model Response:
                      </p>
                      <div className="p-3 bg-white rounded-xl border border-indigo-100 text-slate-800 font-medium">
                        {q.expectedAnswer}
                      </div>
                    </motion.div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Examiner Quick Score Application Footer */}
        {onApplyScore && (
          <div className="bg-slate-900 text-white p-4 sm:p-5 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4 shrink-0">
            <div className="flex items-center gap-3">
              <div>
                <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest">
                  Assign Viva Voce Mark (Out of 5)
                </p>
                <div className="flex items-center gap-1.5 mt-1">
                  {[1, 2, 3, 4, 5].map(score => (
                    <button
                      key={score}
                      type="button"
                      onClick={() => setQuickScore(score)}
                      className={`w-9 h-9 rounded-xl font-black text-xs transition-all cursor-pointer flex items-center justify-center border-2 ${
                        quickScore === score
                          ? 'bg-[#D4A017] text-slate-950 border-white shadow-md scale-105'
                          : 'bg-slate-800 text-white border-slate-700 hover:border-slate-500'
                      }`}
                    >
                      {score}
                    </button>
                  ))}
                </div>
              </div>

              <div className="hidden md:block">
                <input
                  type="text"
                  placeholder="Optional viva feedback/topics asked..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-400 outline-none focus:border-amber-400 w-64"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onApplyScore(quickScore, notes);
                  onClose();
                }}
                className="px-5 py-2.5 bg-[#D4A017] hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 size={16} />
                <span>Apply Score ({quickScore}/5)</span>
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};
export default PracticalVivaAssistantModal;
