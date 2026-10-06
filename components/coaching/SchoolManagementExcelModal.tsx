import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  X, 
  Download, 
  CheckCircle2, 
  School, 
  Users, 
  Layers, 
  Award, 
  Sparkles,
  ShieldCheck,
  Calendar,
  Filter
} from 'lucide-react';
import { 
  academyService, 
  PlayerProfileData, 
  PlayerAssessmentRecord,
  SPORT_TEMPLATES,
  CoachingSportId
} from '../../services/academyService';
import { academicCoachingCloudService } from '../../services/academicCoachingCloudService';
import { coachingExcelReportService } from '../../services/coachingExcelReportService';
import { showToast } from '../../services/toast';

interface SchoolManagementExcelModalProps {
  isOpen: boolean;
  onClose: () => void;
  players?: PlayerProfileData[];
  assessments?: PlayerAssessmentRecord[];
  initialSportFilter?: string;
}

export const SchoolManagementExcelModal: React.FC<SchoolManagementExcelModalProps> = ({
  isOpen,
  onClose,
  players,
  assessments,
  initialSportFilter = 'all'
}) => {
  if (!isOpen) return null;

  const resolvedPlayers = players || academyService.getPlayers();
  const resolvedAssessments = assessments || academyService.getAssessments();

  const program = academicCoachingCloudService.getLocalProgram();
  const [programName, setProgramName] = useState(program?.programName || 'SmartPE Sports Academy & PE Department');
  const [headCoachName, setHeadCoachName] = useState(program?.headCoachName || 'Director of Physical Education');
  const [academicYear, setAcademicYear] = useState(`${new Date().getFullYear()}-${new Date().getFullYear() + 1}`);
  const [termTitle, setTermTitle] = useState('Term Evaluation & Student Development Review');
  const [sportFilter, setSportFilter] = useState<string>(initialSportFilter);
  const [isExporting, setIsExporting] = useState(false);

  // Compute live scope metrics
  const targetPlayers = sportFilter === 'all' 
    ? resolvedPlayers 
    : resolvedPlayers.filter(p => p.sport === sportFilter);

  const evaluatedIds = new Set(resolvedAssessments.map(a => a.playerId));
  const evaluatedCount = targetPlayers.filter(p => evaluatedIds.has(p.id)).length;
  const completionRate = targetPlayers.length > 0 
    ? Math.round((evaluatedCount / targetPlayers.length) * 100) 
    : 0;

  const handleExport = () => {
    setIsExporting(true);
    try {
      const success = coachingExcelReportService.exportSchoolManagementExcelReport(
        resolvedPlayers,
        resolvedAssessments,
        {
          programName: programName.trim(),
          headCoachName: headCoachName.trim(),
          academicYear: academicYear.trim(),
          termTitle: termTitle.trim(),
          sportFilter
        }
      );

      if (success) {
        showToast('Official School Management Excel report generated successfully!', 'success');
        onClose();
      } else {
        showToast('Error generating Excel report. Please try again.', 'error');
      }
    } catch (e) {
      console.error('Export error:', e);
      showToast('Error generating Excel report.', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl border-2 border-slate-900 shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="bg-[#0D2B52] text-white p-6 flex items-start justify-between relative overflow-hidden border-b-2 border-slate-900">
          <div className="relative z-10 space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#D4A017]/20 border border-[#D4A017]/40 rounded-full text-[#D4A017] text-[11px] font-black uppercase tracking-wider">
              <FileSpreadsheet size={13} />
              <span>Institutional Management Report</span>
            </div>
            <h2 className="text-xl font-black tracking-tight font-display">
              Export School Management Excel Report
            </h2>
            <p className="text-xs text-slate-300 font-medium max-w-lg">
              Official multi-worksheet spreadsheet submission formatted for School Principals, Management Committees &amp; Board of Trustees.
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
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700">
          
          {/* Cohort Scope Overview Card */}
          <div className="grid grid-cols-3 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center">
            <div>
              <div className="text-[10px] font-black uppercase text-slate-500">Total Cohort</div>
              <div className="text-xl font-black text-slate-900">{targetPlayers.length}</div>
              <div className="text-[10px] text-slate-500">Enrolled Students</div>
            </div>
            <div>
              <div className="text-[10px] font-black uppercase text-slate-500">Evaluations</div>
              <div className="text-xl font-black text-emerald-600">{evaluatedCount}</div>
              <div className="text-[10px] text-emerald-700 font-bold">{completionRate}% Completed</div>
            </div>
            <div>
              <div className="text-[10px] font-black uppercase text-slate-500">Workbook Scope</div>
              <div className="text-xl font-black text-[#0D2B52]">5 Sheets</div>
              <div className="text-[10px] text-slate-500">Multi-Tab .XLSX</div>
            </div>
          </div>

          {/* Form Settings */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-700 mb-1">
                  School / Academy Name
                </label>
                <input
                  type="text"
                  value={programName}
                  onChange={e => setProgramName(e.target.value)}
                  placeholder="e.g. DPS Sports Academy & PE Department"
                  className="w-full bg-white border-2 border-slate-300 focus:border-slate-900 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-700 mb-1">
                  Head Coach / Reporting Authority
                </label>
                <input
                  type="text"
                  value={headCoachName}
                  onChange={e => setHeadCoachName(e.target.value)}
                  placeholder="e.g. Director of Physical Education"
                  className="w-full bg-white border-2 border-slate-300 focus:border-slate-900 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-700 mb-1">
                  Academic Year
                </label>
                <input
                  type="text"
                  value={academicYear}
                  onChange={e => setAcademicYear(e.target.value)}
                  placeholder="2025-2026"
                  className="w-full bg-white border-2 border-slate-300 focus:border-slate-900 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-700 mb-1">
                  Evaluation Term / Cycle
                </label>
                <input
                  type="text"
                  value={termTitle}
                  onChange={e => setTermTitle(e.target.value)}
                  placeholder="Term 1 Review / Annual Assessment"
                  className="w-full bg-white border-2 border-slate-300 focus:border-slate-900 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-700 mb-1">
                Student Cohort / Sport Discipline Filter
              </label>
              <select
                value={sportFilter}
                onChange={e => setSportFilter(e.target.value)}
                className="w-full bg-white border-2 border-slate-300 focus:border-slate-900 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 outline-none"
              >
                <option value="all">Entire Student Body &amp; All Sports Disciplines ({resolvedPlayers.length} Students)</option>
                {Object.values(SPORT_TEMPLATES).map(tmpl => {
                  const cnt = resolvedPlayers.filter(p => p.sport === tmpl.id).length;
                  return (
                    <option key={tmpl.id} value={tmpl.id}>
                      {tmpl.name} ({cnt} students enrolled)
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {/* Included Sheets Specification */}
          <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-2">
            <div className="font-black text-amber-950 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-amber-600" />
              <span>Workbook Structure for School Management Submission:</span>
            </div>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] text-amber-900 font-medium">
              <li className="flex items-center gap-1.5">
                <CheckCircle2 size={13} className="text-emerald-600 flex-shrink-0" />
                <span><strong>Sheet 1:</strong> Executive Summary &amp; 4-Pillar Index</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 size={13} className="text-emerald-600 flex-shrink-0" />
                <span><strong>Sheet 2:</strong> Master Student Roster &amp; Merit Standing</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 size={13} className="text-emerald-600 flex-shrink-0" />
                <span><strong>Sheet 3:</strong> Skill Diagnostics Matrix (Drill Ratings)</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 size={13} className="text-emerald-600 flex-shrink-0" />
                <span><strong>Sheet 4:</strong> Squad &amp; Batch Training Analytics</span>
              </li>
              <li className="flex items-center gap-1.5 sm:col-span-2">
                <CheckCircle2 size={13} className="text-emerald-600 flex-shrink-0" />
                <span><strong>Sheet 5:</strong> Management Statutory Safety &amp; Audit Sign-off</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border-2 border-slate-300 font-bold text-xs text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleExport}
            disabled={isExporting || targetPlayers.length === 0}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 text-white rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-md cursor-pointer transition active:scale-95"
          >
            <Download size={15} />
            <span>{isExporting ? 'Generating Excel Workbook...' : 'Download Management Excel Report (.xlsx)'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
