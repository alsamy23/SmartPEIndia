import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquareHeart, Star, Send, X, CheckCircle2, Loader2 } from 'lucide-react';
import { submitTeacherFeedback } from '../services/superAdminService.ts';
import { toast } from '../services/toast.ts';
import { auth } from '../services/firebase.ts';

interface TeacherFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRequireLogin?: () => void;
}

const FEEDBACK_CATEGORIES = [
  'Lesson Planner',
  'Coaching & Academy',
  'Fitness & Khelo India',
  'Tournament Fixtures',
  'Question Paper Generator',
  'Yearly & Weekly Planner',
  'Feature Request / General'
];

export const TeacherFeedbackModal: React.FC<TeacherFeedbackModalProps> = ({
  isOpen,
  onClose,
  onRequireLogin
}) => {
  const [category, setCategory] = useState(FEEDBACK_CATEGORIES[0]);
  const [rating, setRating] = useState<number>(5);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) {
      toast.error('Please sign in first to send teacher feedback.');
      if (onRequireLogin) onRequireLogin();
      return;
    }
    if (message.trim().length < 3) {
      toast.error('Please write a short feedback note.');
      return;
    }

    setSubmitting(true);
    try {
      await submitTeacherFeedback({
        category,
        rating,
        message: message.trim()
      });
      setSubmitted(true);
      toast.success('Thank you! Your feedback has been sent to the SmartPE team.');
      setTimeout(() => {
        setSubmitted(false);
        setMessage('');
        setRating(5);
        onClose();
      }, 1600);
    } catch (err: any) {
      toast.error(err?.message || 'Could not send feedback right now.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[120] bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            className="bg-white border-4 border-slate-900 rounded-[2rem] p-6 sm:p-8 max-w-lg w-full shadow-[10px_10px_0px_0px_rgba(15,23,42,1)] relative"
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute top-5 right-5 p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors cursor-pointer"
              aria-label="Close Feedback Modal"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md">
                <MessageSquareHeart size={22} />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                  Teacher Feedback
                </h3>
                <p className="text-xs text-slate-500 font-bold">
                  Share how SmartPE works for your classes or suggest a feature
                </p>
              </div>
            </div>

            {submitted ? (
              <div className="py-10 text-center space-y-3">
                <CheckCircle2 size={44} className="mx-auto text-emerald-500" />
                <h4 className="text-lg font-black text-slate-900">Feedback Received!</h4>
                <p className="text-xs text-slate-500 font-medium">
                  Your note appears directly on the Super Admin dashboard.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-2">
                    Your Experience Rating
                  </label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className={`p-2.5 rounded-xl border-2 transition-all cursor-pointer ${
                          rating >= star
                            ? 'bg-amber-50 border-amber-400 text-amber-500'
                            : 'bg-slate-50 border-slate-200 text-slate-300'
                        }`}
                      >
                        <Star size={20} fill={rating >= star ? 'currentColor' : 'none'} />
                      </button>
                    ))}
                    <span className="ml-2 text-xs font-black text-slate-700">
                      {rating} / 5
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-2">
                    Feature / Area
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full p-3.5 bg-slate-50 border-2 border-slate-200 focus:border-indigo-600 rounded-xl text-xs font-bold text-slate-800 outline-none"
                  >
                    {FEEDBACK_CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-2">
                    Your Feedback
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="What helped you save time today? Anything we can improve for teachers?"
                    className="w-full p-3.5 bg-slate-50 border-2 border-slate-200 focus:border-indigo-600 rounded-xl text-xs font-semibold text-slate-800 outline-none resize-none"
                  />
                </div>

                <div className="flex items-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 py-3.5 border-2 border-slate-300 text-slate-700 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white border-2 border-slate-900 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] cursor-pointer disabled:opacity-50"
                  >
                    {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={15} />}
                    <span>{submitting ? 'Sending...' : 'Send Feedback'}</span>
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default TeacherFeedbackModal;
