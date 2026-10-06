import React from 'react';
import { 
  X, 
  FileSpreadsheet, 
  TrendingUp, 
  Award, 
  Target, 
  Calendar, 
  User, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  Activity, 
  Sparkles,
  FileText,
  Clock
} from 'lucide-react';
import { StudentProgressItem, coachingExcelReportService } from '../../services/coachingExcelReportService';
import { SPORT_TEMPLATES, CoachingSportId } from '../../services/academyService';
import { showToast } from '../../services/toast';

interface StudentProgressDetailModalProps {
  item: StudentProgressItem | null;
  onClose: () => void;
  onViewMeritReport?: () => void;
}

export const StudentProgressDetailModal: React.FC<StudentProgressDetailModalProps> = ({
  item,
  onClose,
  onViewMeritReport
}) => {
  if (!item) return null;

  const sportTmpl = SPORT_TEMPLATES[item.sportId] || SPORT_TEMPLATES.football;
  const isAssessed = item.assessmentCount > 0;

  const handleDownloadExcel = () => {
    if (!item.latestAssessment) {
      showToast('Cannot export Excel card for unassessed student. Baseline test required.', 'error');
      return;
    }
    const success = coachingExcelReportService.exportIndividualStudentExcelReport(
      item.player,
      item.latestAssessment,
      item.history
    );
    if (success) {
      showToast(`Excel progress dossier downloaded for ${item.studentName}!`, 'success');
    }
  };

  const getProgressStatusBadge = (status: StudentProgressItem['progressStatus']) => {
    switch (status) {
      case 'Significant Improvement':
        return 'bg-purple-100 text-purple-900 border-purple-300';
      case 'Improving':
        return 'bg-emerald-100 text-emerald-900 border-emerald-300';
      case 'Stable':
        return 'bg-blue-100 text-blue-900 border-blue-300';
      case 'Needs Attention':
        return 'bg-amber-100 text-amber-900 border-amber-300';
      case 'Declining':
        return 'bg-rose-100 text-rose-900 border-rose-300';
      case 'Initial Assessment':
        return 'bg-cyan-100 text-cyan-900 border-cyan-300';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl border-2 border-slate-900 shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="bg-[#0D2B52] text-white p-6 flex items-start justify-between relative overflow-hidden border-b-2 border-slate-900">
          <div className="relative z-10 space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#D4A017]/20 border border-[#D4A017]/40 rounded-full text-[#D4A017] text-[11px] font-black uppercase tracking-wider">
              <Activity size={13} />
              <span>Student Development Dossier &bull; {item.sport}</span>
            </div>
            <h2 className="text-2xl font-black tracking-tight font-display text-white">
              {item.studentName}
            </h2>
            <p className="text-xs text-slate-300 font-medium">
              {item.gradeAge} &bull; {item.position} &bull; {item.squad} &bull; ID: {item.studentId}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-300 hover:text-white p-2 rounded-xl hover:bg-white/10 transition cursor-pointer relative z-10"
            aria-label="Close dialog"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-700">

          {/* Performance & Progress Card */}
          <div className="p-5 bg-slate-50 rounded-2xl border-2 border-slate-900 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Overall Performance</span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-2xl font-black text-slate-900">
                    {item.latestScore !== '—' ? `${item.latestScore}/100` : 'Pending'}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${getProgressStatusBadge(item.progressStatus)}`}>
                    {item.progressStatus}
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Progress Trajectory</span>
                <div className="font-black text-slate-900 text-sm mt-0.5">
                  {item.assessmentCount >= 2 ? (
                    <span className="text-emerald-700 font-black">
                      {item.baselineScore} &rarr; {item.latestScore} ({item.progressChange} pts)
                    </span>
                  ) : item.assessmentCount === 1 ? (
                    <span className="text-cyan-800 font-bold">Baseline: {item.latestScore} pts</span>
                  ) : (
                    <span className="text-slate-400">Baseline Assessment Pending</span>
                  )}
                </div>
              </div>
            </div>

            {/* 4 Pillars Grid */}
            <div>
              <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider block mb-2">
                Four-Pillar Performance Matrix
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
                <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                  <div className="text-lg font-black text-blue-900">{item.technicalScore}</div>
                  <div className="text-[10px] font-black uppercase text-slate-500 mt-0.5">Technical</div>
                </div>
                <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                  <div className="text-lg font-black text-cyan-900">{item.tacticalScore}</div>
                  <div className="text-[10px] font-black uppercase text-slate-500 mt-0.5">Tactical IQ</div>
                </div>
                <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                  <div className="text-lg font-black text-amber-900">{item.physicalScore}</div>
                  <div className="text-[10px] font-black uppercase text-slate-500 mt-0.5">Physical</div>
                </div>
                <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                  <div className="text-lg font-black text-purple-900">{item.behaviourScore}</div>
                  <div className="text-[10px] font-black uppercase text-slate-500 mt-0.5">Grit &amp; Mindset</div>
                </div>
              </div>
            </div>
          </div>

          {/* Strengths & Weaknesses Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Top Strengths */}
            <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200 space-y-2">
              <div className="flex items-center gap-1.5 text-emerald-950 font-black text-[11px] uppercase tracking-wider">
                <CheckCircle2 size={14} className="text-emerald-600" />
                <span>Top Demonstrated Strengths:</span>
              </div>
              <ul className="space-y-1 text-xs text-emerald-900 font-bold">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                  <span>{item.topStrength1}</span>
                </li>
                {item.topStrength2 !== '—' && (
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                    <span>{item.topStrength2}</span>
                  </li>
                )}
                {item.topStrength3 !== '—' && (
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                    <span>{item.topStrength3}</span>
                  </li>
                )}
              </ul>
            </div>

            {/* Priority Weaknesses */}
            <div className="p-4 bg-amber-50/70 rounded-2xl border border-amber-200 space-y-2">
              <div className="flex items-center gap-1.5 text-amber-950 font-black text-[11px] uppercase tracking-wider">
                <Target size={14} className="text-amber-600" />
                <span>Priority Development Weaknesses:</span>
              </div>
              <ul className="space-y-1 text-xs text-amber-900 font-bold">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                  <span>{item.priorityWeakness1}</span>
                </li>
                {item.priorityWeakness2 !== '—' && (
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                    <span>{item.priorityWeakness2}</span>
                  </li>
                )}
                {item.priorityWeakness3 !== '—' && (
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                    <span>{item.priorityWeakness3}</span>
                  </li>
                )}
              </ul>
            </div>
          </div>

          {/* Action & Targets */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <div>
              <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider block">
                Primary Development Focus Area:
              </span>
              <div className="font-black text-slate-900 text-sm mt-0.5">
                {item.priorityDevArea}
              </div>
            </div>

            <div>
              <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider block">
                Recommended Coaching Action Regimen:
              </span>
              <p className="text-xs text-slate-700 font-medium leading-relaxed mt-0.5">
                {item.coachingAction}
              </p>
            </div>

            <div>
              <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider block">
                Next Measurable Performance Target:
              </span>
              <div className="font-bold text-indigo-700 mt-0.5">
                {item.nextTarget}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-[11px] text-slate-500 font-medium">
              <span>Next Review Date: <strong>{item.nextReviewDate}</strong></span>
              <span>Status: <strong className="text-slate-900">{item.assessmentStatus}</strong></span>
            </div>
          </div>

          {/* Historical Assessment Track Table (if 2+ assessments exist) */}
          {item.history.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                <Clock size={14} className="text-[#D4A017]" />
                <span>Historical Review Milestones ({item.history.length} Completed)</span>
              </h4>
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-[10px] font-black uppercase text-slate-600">
                    <tr>
                      <th className="p-2 border-b">Date</th>
                      <th className="p-2 border-b">Review Type</th>
                      <th className="p-2 border-b">Overall</th>
                      <th className="p-2 border-b">Level</th>
                      <th className="p-2 border-b">Tech</th>
                      <th className="p-2 border-b">Tact</th>
                      <th className="p-2 border-b">Phys</th>
                      <th className="p-2 border-b">Coach</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {item.history.map((h, i) => (
                      <tr key={h.id || i} className="hover:bg-slate-50">
                        <td className="p-2 font-bold">{h.assessmentDate}</td>
                        <td className="p-2">{h.assessmentType}</td>
                        <td className="p-2 font-black text-slate-900">{h.overallScore}/100</td>
                        <td className="p-2">{h.developmentLevel}</td>
                        <td className="p-2">{h.domainScores?.technical ?? '—'}%</td>
                        <td className="p-2">{h.domainScores?.tactical ?? '—'}%</td>
                        <td className="p-2">{h.domainScores?.physical ?? '—'}%</td>
                        <td className="p-2 text-slate-500">{h.coachName}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-300 font-bold text-xs text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            Close
          </button>

          <div className="flex items-center gap-2">
            {onViewMeritReport && isAssessed && (
              <button
                type="button"
                onClick={onViewMeritReport}
                className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
              >
                <FileText size={14} className="text-amber-400" />
                <span>View Full Merit Card / PDF</span>
              </button>
            )}

            {isAssessed && (
              <button
                type="button"
                onClick={handleDownloadExcel}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-md transition active:scale-95 cursor-pointer"
              >
                <FileSpreadsheet size={15} />
                <span>Export Student Excel (.xlsx)</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
