import React, { useState, useMemo, useEffect } from 'react';
import {
  Award,
  CheckCircle2,
  ClipboardList,
  Download,
  FileText,
  Heart,
  Plus,
  Search,
  Trash2,
  X,
  ArrowRight,
  Save,
  RotateCcw
} from 'lucide-react';
import {
  Student,
  FitnessResult,
  SchoolMember,
  CompositeScoringPreset,
  CompositeWeightConfig,
  CompositeTermEvaluation,
  SportSkillScoreItem
} from '../../types.ts';
import {
  COMPOSITE_PRESETS,
  SPORT_SKILL_PRESETS,
  DISCIPLINE_CRITERIA,
  computeFitnessContribution,
  recalculateEvaluationTotals,
  createDraftEvaluation,
  compositeEvaluationService,
  buildEvaluationDocId
} from '../../services/compositeEvaluationService.ts';
import { fitnessService } from '../../services/fitnessService.ts';
import { downloadCsvFile } from '../../utils/safeBrowser.ts';
import { toast } from '../../services/toast.ts';
import { auth } from '../../services/firebase.ts';

interface TermCompositeGradingViewProps {
  students: Student[];
  allResults: FitnessResult[];
  evaluations: CompositeTermEvaluation[];
  userProfile: SchoolMember | null;
  onSavedEvaluation: (saved: CompositeTermEvaluation) => void;
  onOpenReportCard: (studentId: string, evaluation: CompositeTermEvaluation) => void;
  onGoToFitnessTests: () => void;
}

const TERMS = ['Term 1', 'Term 2', 'Annual'];
const ACADEMIC_YEARS = ['2025-2026', '2026-2027', '2024-2025'];

export const TermCompositeGradingView: React.FC<TermCompositeGradingViewProps> = ({
  students,
  allResults,
  evaluations,
  userProfile,
  onSavedEvaluation,
  onOpenReportCard,
  onGoToFitnessTests
}) => {
  // Class & Term Scope State
  const [selectedGrade, setSelectedGrade] = useState<string>('ALL');
  const [selectedSection, setSelectedSection] = useState<string>('ALL');
  const [selectedTerm, setSelectedTerm] = useState<string>('Term 1');
  const [academicYear, setAcademicYear] = useState<string>('2025-2026');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Scoring Configuration State (Defaults: 30 Fitness + 20 Discipline + 50 Games)
  const [preset, setPreset] = useState<CompositeScoringPreset>('cbse_standard_30_20_50');
  const [weights, setWeights] = useState<CompositeWeightConfig>(
    COMPOSITE_PRESETS.cbse_standard_30_20_50.weights
  );
  const [defaultSport, setDefaultSport] = useState<string>('Football');
  const [defaultScaleMax, setDefaultScaleMax] = useState<5 | 8 | 10>(8);
  const [gradeDisplayFormat, setGradeDisplayFormat] = useState<'cbse_8pt' | 'co_scholastic'>('cbse_8pt');

  // Active Grading Drawer State
  const [editingEval, setEditingEval] = useState<CompositeTermEvaluation | null>(null);
  const [showOverridePanel, setShowOverridePanel] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);

  const weightsSum = weights.fitnessMax + weights.disciplineMax + weights.gamesMax;
  const isWeightsValid = weightsSum === 100 && weights.fitnessMax >= 0 && weights.disciplineMax >= 0 && weights.gamesMax >= 0;

  const schoolId = userProfile?.schoolId || `school_${auth.currentUser?.uid || 'local'}`;
  const teacherId = auth.currentUser?.uid || 'teacher';

  // Available grades & sections derived from existing student roster
  const availableGrades = useMemo(() => {
    const set = new Set<string>();
    students.forEach(s => {
      if (s.grade) set.add(s.grade.toString().trim());
    });
    return Array.from(set).sort((a, b) => {
      const nA = parseInt(a.replace(/\D/g, ''), 10);
      const nB = parseInt(b.replace(/\D/g, ''), 10);
      if (!isNaN(nA) && !isNaN(nB)) return nA - nB;
      return a.localeCompare(b);
    });
  }, [students]);

  const availableSections = useMemo(() => {
    const set = new Set<string>();
    students.forEach(s => {
      if (selectedGrade === 'ALL' || fitnessService.isGradeMatching(s.grade, selectedGrade)) {
        if (s.section) set.add(s.section.toString().trim().toUpperCase());
      }
    });
    return Array.from(set).sort();
  }, [students, selectedGrade]);

  const filteredStudents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return students.filter(s => {
      if (selectedGrade !== 'ALL' && !fitnessService.isGradeMatching(s.grade, selectedGrade)) return false;
      if (selectedSection !== 'ALL' && s.section?.toUpperCase() !== selectedSection.toUpperCase()) return false;
      if (q && !s.name.toLowerCase().includes(q) && !(s.rollNumber || '').toLowerCase().includes(q)) return false;
      return true;
    });
  }, [students, selectedGrade, selectedSection, searchQuery]);

  // Preset switch handler
  const handleSelectPreset = (nextPreset: CompositeScoringPreset) => {
    setPreset(nextPreset);
    if (nextPreset !== 'custom') {
      setWeights({ ...COMPOSITE_PRESETS[nextPreset].weights });
    }
  };

  // Auto-suggest Primary preset when user picks Classes 1, 2, or 3 (non-intrusive)
  useEffect(() => {
    const numericGrade = parseInt(selectedGrade.replace(/\D/g, ''), 10);
    if (!isNaN(numericGrade) && numericGrade <= 3 && preset === 'cbse_standard_30_20_50') {
      setPreset('primary_30_30_40');
      setWeights({ ...COMPOSITE_PRESETS.primary_30_30_40.weights });
    }
  }, [selectedGrade]);

  // Map saved evaluation for each student in current term & academicYear
  const savedEvalMap = useMemo(() => {
    const map = new Map<string, CompositeTermEvaluation>();
    evaluations.forEach(e => {
      if (e.term === selectedTerm && e.academicYear === academicYear) {
        map.set(e.studentId, e);
      }
    });
    return map;
  }, [evaluations, selectedTerm, academicYear]);

  // Build row view model combining existing fitness records + saved composite evaluation
  const studentRows = useMemo(() => {
    return filteredStudents.map(student => {
      const saved = savedEvalMap.get(student.id);
      const liveFitness = computeFitnessContribution(
        student,
        allResults,
        selectedTerm,
        weights.fitnessMax
      );

      if (saved) {
        // Keep saved discipline & games, but refresh live fitness summary if new tests were entered
        const merged = recalculateEvaluationTotals({
          ...saved,
          weights,
          preset,
          fitnessSnapshot: {
            ...liveFitness,
            manualOverrideMarks: saved.fitnessSnapshot?.manualOverrideMarks,
            overrideReason: saved.fitnessSnapshot?.overrideReason
          }
        });
        return { student, evalDoc: merged, isSaved: true };
      }

      const draft = createDraftEvaluation(student, allResults, {
        term: selectedTerm,
        academicYear,
        preset,
        weights,
        sportName: defaultSport,
        scaleMax: defaultScaleMax,
        schoolId,
        teacherId
      });

      return { student, evalDoc: draft, isSaved: false };
    });
  }, [filteredStudents, savedEvalMap, allResults, selectedTerm, academicYear, weights, preset, defaultSport, defaultScaleMax, schoolId, teacherId]);

  // Class KPIs
  const classStats = useMemo(() => {
    const total = studentRows.length;
    const withFitness = studentRows.filter(r => r.evalDoc.fitnessSnapshot.testsCounted > 0).length;
    const savedCount = studentRows.filter(r => r.isSaved).length;
    const scoredRows = studentRows.filter(r => r.isSaved || r.evalDoc.fitnessSnapshot.testsCounted > 0);
    const avgScore =
      scoredRows.length > 0
        ? Math.round(scoredRows.reduce((s, r) => s + r.evalDoc.totalScore, 0) / scoredRows.length)
        : 0;
    return { total, withFitness, savedCount, avgScore };
  }, [studentRows]);

  // Open Grading Drawer for a student
  const handleOpenStudentGrading = (studentId: string) => {
    const found = studentRows.find(r => r.student.id === studentId);
    if (!found) return;
    setEditingEval(found.evalDoc);
    setShowOverridePanel(found.evalDoc.fitnessSnapshot.manualOverrideMarks !== undefined);
  };

  // Update Discipline Criterion (0..5)
  const updateDisciplineField = (
    key: 'uniform' | 'punctuality' | 'sportsmanship' | 'safety',
    value: number
  ) => {
    if (!editingEval) return;
    const updated = recalculateEvaluationTotals({
      ...editingEval,
      discipline: {
        ...editingEval.discipline,
        [key]: value
      }
    });
    setEditingEval(updated);
  };

  const applyDisciplinePreset = (scorePerCriterion: number) => {
    if (!editingEval) return;
    const updated = recalculateEvaluationTotals({
      ...editingEval,
      discipline: {
        ...editingEval.discipline,
        uniform: scorePerCriterion,
        punctuality: scorePerCriterion,
        sportsmanship: scorePerCriterion,
        safety: scorePerCriterion
      }
    });
    setEditingEval(updated);
  };

  // Sport & Skills Handlers (1 to 8 skills)
  const handleChangeSport = (sportName: string, resetSkills = false) => {
    if (!editingEval) return;
    const defaultList = SPORT_SKILL_PRESETS[sportName] || SPORT_SKILL_PRESETS.Football;
    const nextSkills: SportSkillScoreItem[] = resetSkills
      ? defaultList.map((name, idx) => ({ id: `sk_${idx + 1}`, skillName: name, score: 0 }))
      : editingEval.games.skills;

    const updated = recalculateEvaluationTotals({
      ...editingEval,
      games: {
        ...editingEval.games,
        sportName,
        skills: nextSkills
      }
    });
    setEditingEval(updated);
  };

  const handleChangeScaleMax = (scaleMax: 5 | 8 | 10) => {
    if (!editingEval) return;
    const clampedSkills = editingEval.games.skills.map(sk => ({
      ...sk,
      score: Math.min(scaleMax, sk.score)
    }));
    const updated = recalculateEvaluationTotals({
      ...editingEval,
      games: {
        ...editingEval.games,
        scaleMax,
        skills: clampedSkills
      }
    });
    setEditingEval(updated);
  };

  const handleSkillScoreChange = (idx: number, score: number) => {
    if (!editingEval) return;
    const nextSkills = editingEval.games.skills.map((sk, i) => (i === idx ? { ...sk, score } : sk));
    const updated = recalculateEvaluationTotals({
      ...editingEval,
      games: { ...editingEval.games, skills: nextSkills }
    });
    setEditingEval(updated);
  };

  const handleSkillNameChange = (idx: number, skillName: string) => {
    if (!editingEval) return;
    const nextSkills = editingEval.games.skills.map((sk, i) => (i === idx ? { ...sk, skillName } : sk));
    setEditingEval({
      ...editingEval,
      games: { ...editingEval.games, skills: nextSkills }
    });
  };

  const handleAddSkill = () => {
    if (!editingEval || editingEval.games.skills.length >= 8) return;
    const nextIdx = editingEval.games.skills.length + 1;
    const nextSkills: SportSkillScoreItem[] = [
      ...editingEval.games.skills,
      { id: `sk_${Date.now()}`, skillName: `Skill ${nextIdx}`, score: 0 }
    ];
    const updated = recalculateEvaluationTotals({
      ...editingEval,
      games: { ...editingEval.games, skills: nextSkills }
    });
    setEditingEval(updated);
  };

  const handleRemoveSkill = (idx: number) => {
    if (!editingEval || editingEval.games.skills.length <= 1) return;
    const nextSkills = editingEval.games.skills.filter((_, i) => i !== idx);
    const updated = recalculateEvaluationTotals({
      ...editingEval,
      games: { ...editingEval.games, skills: nextSkills }
    });
    setEditingEval(updated);
  };

  const handleSaveEvaluation = async (mode: 'close' | 'next' | 'report') => {
    if (!editingEval) return;
    if (!isWeightsValid) {
      toast.error('Please ensure Fitness + Discipline + Games weights equal 100 marks.');
      return;
    }
    setSaving(true);
    try {
      const toSave: CompositeTermEvaluation = recalculateEvaluationTotals({
        ...editingEval,
        id: buildEvaluationDocId(editingEval.studentId, selectedTerm, academicYear),
        term: selectedTerm,
        academicYear,
        preset,
        weights,
        schoolId,
        teacherId
      });

      const saved = await compositeEvaluationService.saveEvaluation(toSave);
      onSavedEvaluation(saved);
      setDefaultSport(saved.games.sportName);
      setDefaultScaleMax(saved.games.scaleMax);
      toast.success(`Saved 100M Term Evaluation for ${saved.studentName} (${saved.totalScore}/100 • ${saved.cbseGrade})`);

      if (mode === 'report') {
        setEditingEval(null);
        onOpenReportCard(saved.studentId, saved);
      } else if (mode === 'next') {
        const currentIndex = studentRows.findIndex(r => r.student.id === saved.studentId);
        if (currentIndex !== -1 && currentIndex + 1 < studentRows.length) {
          const nextRow = studentRows[currentIndex + 1];
          // Carry forward sport & scale preference for speed
          setEditingEval({
            ...nextRow.evalDoc,
            games: nextRow.isSaved
              ? nextRow.evalDoc.games
              : {
                  ...nextRow.evalDoc.games,
                  sportName: saved.games.sportName,
                  scaleMax: saved.games.scaleMax
                }
          });
        } else {
          setEditingEval(null);
          toast.success('Reached the end of the class roster!');
        }
      } else {
        setEditingEval(null);
      }
    } catch (err) {
      console.error('Failed to save composite evaluation:', err);
      toast.error('Could not save evaluation. Saved locally offline.');
    } finally {
      setSaving(false);
    }
  };

  // Export Class 100-Mark Marksheet CSV
  const handleExportClassCsv = () => {
    if (studentRows.length === 0) {
      toast.error('No students in current filter to export.');
      return;
    }

    const headers = [
      'Roll No',
      'Student Name',
      'Class',
      'Section',
      'Term',
      'Academic Year',
      'Fitness Tests Count',
      'BMI (Informational)',
      `Fitness Marks (/${weights.fitnessMax})`,
      `Discipline Marks (/${weights.disciplineMax})`,
      'Sport Evaluated',
      `Games Marks (/${weights.gamesMax})`,
      'Total Marks (/100)',
      'CBSE Grade',
      'Co-Scholastic Grade',
      'Status'
    ];

    const rows = studentRows.map(({ student, evalDoc, isSaved }) => {
      const fitnessMarks =
        evalDoc.fitnessSnapshot.manualOverrideMarks !== undefined
          ? evalDoc.fitnessSnapshot.manualOverrideMarks
          : evalDoc.fitnessSnapshot.autoMarksAwarded;
      return [
        student.rollNumber || '-',
        student.name,
        student.grade,
        student.section,
        selectedTerm,
        academicYear,
        evalDoc.fitnessSnapshot.testsCounted,
        evalDoc.fitnessSnapshot.bmiPoint ? `${evalDoc.fitnessSnapshot.bmiPoint.bmi} (${evalDoc.fitnessSnapshot.bmiPoint.statusLabel})` : 'Not Recorded',
        fitnessMarks,
        evalDoc.discipline.marksAwarded,
        evalDoc.games.sportName,
        evalDoc.games.marksAwarded,
        evalDoc.totalScore,
        evalDoc.cbseGrade,
        evalDoc.coScholasticGrade,
        isSaved ? 'Saved' : 'Auto-Draft'
      ];
    });

    const filename = `SmartPE_100M_Marksheet_${selectedGrade}_${selectedSection}_${selectedTerm.replace(/\s+/g, '_')}.csv`;
    downloadCsvFile(filename, headers, rows);
    toast.success(`Downloaded ${studentRows.length} student marksheets!`);
  };

  const gradeBadgeStyle = (g: string) => {
    if (g === 'A1' || g === 'A2' || g === 'A') return 'bg-emerald-100 text-emerald-800 border-emerald-300';
    if (g === 'B1' || g === 'B2' || g === 'B') return 'bg-blue-100 text-blue-800 border-blue-300';
    if (g === 'C1' || g === 'C2' || g === 'C') return 'bg-amber-100 text-amber-800 border-amber-300';
    return 'bg-slate-100 text-slate-700 border-slate-300';
  };

  return (
    <div className="space-y-5">
      {/* Scope & Marking Formula Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
          <div>
            <h2 className="text-base font-black text-[#0D2B52] uppercase tracking-wide flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              Term PE Grading & Report Card (100 Marks)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Existing fitness test scores &amp; BMI are pulled automatically with <strong>zero data deletion</strong>. Add Discipline &amp; Games Skills to generate complete /100 CBSE Report Cards.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setGradeDisplayFormat(prev => (prev === 'cbse_8pt' ? 'co_scholastic' : 'cbse_8pt'))}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold border border-slate-200 transition-all"
            >
              Grade Scale: {gradeDisplayFormat === 'cbse_8pt' ? 'CBSE 8-Point (A1–D)' : 'Co-Scholastic (A–C)'}
            </button>
            <button
              onClick={handleExportClassCsv}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-black uppercase tracking-wide flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              Export Class CSV
            </button>
          </div>
        </div>

        {/* Filters Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
          <div>
            <label className="block font-bold text-slate-600 mb-1">Class / Grade</label>
            <select
              value={selectedGrade}
              onChange={(e) => {
                setSelectedGrade(e.target.value);
                setSelectedSection('ALL');
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Classes ({students.length})</option>
              {availableGrades.map(g => (
                <option key={g} value={g}>Class {g}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-600 mb-1">Section</label>
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Sections</option>
              {availableSections.map(sec => (
                <option key={sec} value={sec}>Section {sec}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-600 mb-1">Assessment Term</label>
            <select
              value={selectedTerm}
              onChange={(e) => setSelectedTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
            >
              {TERMS.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-600 mb-1">Academic Year</label>
            <select
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
            >
              {ACADEMIC_YEARS.map(yr => (
                <option key={yr} value={yr}>{yr}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-600 mb-1">Search Student</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Name or Roll No..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-2 font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Marking Formula Selector (30+20+50 | 30+30+40 | Custom) */}
        <div className="bg-slate-50 rounded-xl border border-slate-200 p-3.5 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-slate-500 mr-1">Marking Split:</span>
            {(['cbse_standard_30_20_50', 'primary_30_30_40', 'custom'] as CompositeScoringPreset[]).map(key => {
              const info = COMPOSITE_PRESETS[key];
              const active = preset === key;
              return (
                <button
                  key={key}
                  onClick={() => handleSelectPreset(key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                    active
                      ? 'bg-[#0D2B52] text-white border-[#0D2B52] shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {info.shortLabel}
                </button>
              );
            })}
          </div>

          {preset === 'custom' ? (
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <label className="flex items-center gap-1 font-bold text-slate-700">
                Fitness:
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={weights.fitnessMax}
                  onChange={(e) => setWeights(w => ({ ...w, fitnessMax: Math.max(0, Number(e.target.value) || 0) }))}
                  className="w-14 bg-white border border-slate-300 rounded-lg px-2 py-1 text-center font-black"
                />
              </label>
              <label className="flex items-center gap-1 font-bold text-slate-700">
                Discipline:
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={weights.disciplineMax}
                  onChange={(e) => setWeights(w => ({ ...w, disciplineMax: Math.max(0, Number(e.target.value) || 0) }))}
                  className="w-14 bg-white border border-slate-300 rounded-lg px-2 py-1 text-center font-black"
                />
              </label>
              <label className="flex items-center gap-1 font-bold text-slate-700">
                Games:
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={weights.gamesMax}
                  onChange={(e) => setWeights(w => ({ ...w, gamesMax: Math.max(0, Number(e.target.value) || 0) }))}
                  className="w-14 bg-white border border-slate-300 rounded-lg px-2 py-1 text-center font-black"
                />
              </label>
              <span className={`px-2.5 py-1 rounded-full font-black text-[11px] border ${
                isWeightsValid ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-rose-100 text-rose-800 border-rose-300'
              }`}>
                Total = {weightsSum}/100
              </span>
            </div>
          ) : (
            <div className="text-xs text-slate-600 font-medium">
              {COMPOSITE_PRESETS[preset].description}
            </div>
          )}
        </div>
      </div>

      {/* Compact Class Overview KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase">Students in Roster</div>
          <div className="text-2xl font-black text-[#0D2B52] mt-1">{classStats.total}</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase">With Fitness Test Data</div>
          <div className="text-2xl font-black text-blue-600 mt-1">
            {classStats.withFitness} <span className="text-xs font-semibold text-slate-400">/ {classStats.total}</span>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase">{selectedTerm} Graded</div>
          <div className="text-2xl font-black text-emerald-600 mt-1">
            {classStats.savedCount} <span className="text-xs font-semibold text-slate-400">/ {classStats.total}</span>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase">Class Avg (Active)</div>
          <div className="text-2xl font-black text-amber-600 mt-1">{classStats.avgScore} <span className="text-xs font-semibold text-slate-400">/ 100</span></div>
        </div>
      </div>

      {/* Class Roster Marksheet Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {studentRows.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <ClipboardList className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-600">No students match the selected class/section filter.</p>
            <button
              onClick={onGoToFitnessTests}
              className="px-4 py-2 bg-[#0D2B52] text-white rounded-xl text-xs font-bold hover:bg-slate-800"
            >
              Go to Step 1: Fitness Tests &amp; Student Setup
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-black uppercase text-slate-500 tracking-wider">
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-3">Fitness Data &amp; BMI</th>
                  <th className="py-3 px-3 text-center">Fitness (/{weights.fitnessMax})</th>
                  <th className="py-3 px-3 text-center">Discipline (/{weights.disciplineMax})</th>
                  <th className="py-3 px-3 text-center">Games (/{weights.gamesMax})</th>
                  <th className="py-3 px-3 text-center">Total (/100)</th>
                  <th className="py-3 px-3 text-center">Grade</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {studentRows.map(({ student, evalDoc, isSaved }) => {
                  const fitnessAwarded =
                    evalDoc.fitnessSnapshot.manualOverrideMarks !== undefined
                      ? evalDoc.fitnessSnapshot.manualOverrideMarks
                      : evalDoc.fitnessSnapshot.autoMarksAwarded;
                  const displayGrade =
                    gradeDisplayFormat === 'cbse_8pt' ? evalDoc.cbseGrade : evalDoc.coScholasticGrade;

                  return (
                    <tr key={student.id} className="hover:bg-blue-50/30 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{student.name}</div>
                        <div className="text-[11px] text-slate-500">
                          Class {student.grade}-{student.section} {student.rollNumber ? `• Roll #${student.rollNumber}` : ''}
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <div className="flex flex-col gap-1">
                          {evalDoc.fitnessSnapshot.testsCounted > 0 ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-md text-[10px] font-bold w-fit">
                              <CheckCircle2 className="w-3 h-3" />
                              {evalDoc.fitnessSnapshot.testsCounted} tests ({evalDoc.fitnessSnapshot.sourceTermUsed})
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">No fitness tests yet</span>
                          )}
                          {evalDoc.fitnessSnapshot.bmiPoint && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-teal-50 text-teal-800 border border-teal-200 rounded-md text-[10px] font-semibold w-fit">
                              <Heart className="w-2.5 h-2.5" />
                              BMI {evalDoc.fitnessSnapshot.bmiPoint.bmi} • {evalDoc.fitnessSnapshot.bmiPoint.statusLabel}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span className="font-black text-slate-900 text-sm">{fitnessAwarded}</span>
                        <span className="text-[10px] text-slate-400 font-semibold block">
                          {evalDoc.fitnessSnapshot.manualOverrideMarks !== undefined
                            ? 'Override'
                            : `${evalDoc.fitnessSnapshot.autoScoreOutOf100}%`}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span className={`font-black text-sm ${isSaved ? 'text-slate-900' : 'text-slate-400'}`}>
                          {evalDoc.discipline.marksAwarded}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span className={`font-black text-sm ${isSaved ? 'text-slate-900' : 'text-slate-400'}`}>
                          {evalDoc.games.marksAwarded}
                        </span>
                        {isSaved && (
                          <span className="text-[10px] text-slate-500 block truncate max-w-[90px] mx-auto">
                            {evalDoc.games.sportName}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span className="text-base font-black text-[#0D2B52]">{evalDoc.totalScore}</span>
                        <span className="text-[10px] text-slate-400">/100</span>
                      </td>

                      <td className="py-3 px-3 text-center">
                        {isSaved ? (
                          <span className={`px-2.5 py-1 rounded-full text-[11px] font-black border ${gradeBadgeStyle(displayGrade)}`}>
                            {displayGrade}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            Pending
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenStudentGrading(student.id)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                              isSaved
                                ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200'
                                : 'bg-[#0D2B52] hover:bg-slate-800 text-white shadow-2xs'
                            }`}
                          >
                            {isSaved ? 'Edit Marks' : 'Grade Student'}
                          </button>
                          <button
                            onClick={() => onOpenReportCard(student.id, evalDoc)}
                            title="Open Printable Report Card"
                            className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg transition-all"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ===================================================================== */}
      {/* TEACHER GRADING DRAWER / MODAL                                        */}
      {/* ===================================================================== */}
      {editingEval && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-4xl max-h-[94vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="px-5 py-4 bg-[#0D2B52] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-amber-400 text-slate-950 rounded-md text-[10px] font-black uppercase">
                    {selectedTerm} • {academicYear}
                  </span>
                  <span className="text-xs text-slate-300">
                    Class {editingEval.grade}-{editingEval.section} {editingEval.rollNumber ? `• Roll #${editingEval.rollNumber}` : ''}
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-black mt-0.5">{editingEval.studentName}</h3>
              </div>

              <div className="flex items-center gap-3">
                <div className="bg-white/10 border border-white/20 rounded-xl px-3.5 py-1.5 text-right">
                  <div className="text-[10px] uppercase text-slate-300 font-bold">Final Score</div>
                  <div className="text-lg font-black text-amber-300">
                    {editingEval.totalScore}/100{' '}
                    <span className="text-xs bg-white text-[#0D2B52] px-2 py-0.5 rounded-full ml-1">
                      {editingEval.cbseGrade} (Co-Sch: {editingEval.coScholasticGrade})
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setEditingEval(null)}
                  className="p-2 hover:bg-white/10 rounded-lg text-slate-300 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-slate-50">
              {/* SECTION 1: AUTO FITNESS TESTS + NON-PUNITIVE BMI */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                  <div>
                    <h4 className="text-sm font-black text-[#0D2B52] uppercase flex items-center gap-2">
                      1. Fitness Tests Score (Max {weights.fitnessMax} Marks)
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-[10px] font-black">
                        Auto-Pulled
                      </span>
                    </h4>
                    <p className="text-xs text-slate-500">
                      Calculated from {editingEval.fitnessSnapshot.testsCounted} recorded test(s) in{' '}
                      <strong>{editingEval.fitnessSnapshot.sourceTermUsed}</strong>
                      {editingEval.fitnessSnapshot.baselineToTermBonus > 0 &&
                        ` (+${editingEval.fitnessSnapshot.baselineToTermBonus}% improvement bonus from Baseline)`}
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-xl font-black text-blue-700">
                      {editingEval.fitnessSnapshot.manualOverrideMarks !== undefined
                        ? editingEval.fitnessSnapshot.manualOverrideMarks
                        : editingEval.fitnessSnapshot.autoMarksAwarded}
                    </span>
                    <span className="text-xs font-bold text-slate-500"> / {weights.fitnessMax} Marks</span>
                  </div>
                </div>

                {editingEval.fitnessSnapshot.testsSummary.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {editingEval.fitnessSnapshot.testsSummary.map((t, idx) => (
                      <div key={idx} className="bg-slate-50 rounded-lg border border-slate-200 px-3 py-2 text-xs flex items-center justify-between">
                        <div className="min-w-0 pr-2">
                          <div className="font-bold text-slate-800 truncate">{t.testName}</div>
                          <div className="text-[11px] text-slate-500">
                            Raw: <strong>{t.rawValue} {t.unit}</strong> • {t.level}
                          </div>
                        </div>
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-md font-black text-[11px] shrink-0">
                          {t.scorePercent}%
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <span className="text-amber-900 font-medium">
                      No fitness test records found yet for {editingEval.studentName}. You can enter them in Step 1 or apply a teacher adjustment below.
                    </span>
                    <button
                      onClick={() => {
                        setEditingEval(null);
                        onGoToFitnessTests();
                      }}
                      className="px-3 py-1.5 bg-amber-600 text-white rounded-lg font-bold text-xs shrink-0"
                    >
                      Enter Fitness Tests →
                    </button>
                  </div>
                )}

                {/* Non-Punitive BMI Display */}
                <div className="bg-teal-50/70 border border-teal-200 rounded-lg px-3 py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 text-teal-900">
                    <Heart className="w-4 h-4 text-teal-600 shrink-0" />
                    {editingEval.fitnessSnapshot.bmiPoint ? (
                      <span>
                        <strong>BMI Screening (Informational Only):</strong> {editingEval.fitnessSnapshot.bmiPoint.bmi} kg/m² ({editingEval.fitnessSnapshot.bmiPoint.statusLabel})
                      </span>
                    ) : (
                      <span>
                        <strong>BMI Screening:</strong> Not recorded yet (BMI never reduces fitness marks).
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowOverridePanel(prev => !prev)}
                    className="text-xs font-bold text-blue-700 hover:underline self-start sm:self-auto"
                  >
                    {showOverridePanel ? 'Hide Override' : 'Medical / Teacher Override?'}
                  </button>
                </div>

                {showOverridePanel && (
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center gap-3 text-xs">
                    <label className="font-bold text-slate-700 flex items-center gap-2">
                      Override Marks (/{weights.fitnessMax}):
                      <input
                        type="number"
                        min={0}
                        max={weights.fitnessMax}
                        value={
                          editingEval.fitnessSnapshot.manualOverrideMarks !== undefined
                            ? editingEval.fitnessSnapshot.manualOverrideMarks
                            : editingEval.fitnessSnapshot.autoMarksAwarded
                        }
                        onChange={(e) => {
                          const val = Math.max(0, Math.min(weights.fitnessMax, Number(e.target.value) || 0));
                          setEditingEval(
                            recalculateEvaluationTotals({
                              ...editingEval,
                              fitnessSnapshot: {
                                ...editingEval.fitnessSnapshot,
                                manualOverrideMarks: val
                              }
                            })
                          );
                        }}
                        className="w-16 bg-white border border-slate-300 rounded-lg px-2 py-1 text-center font-black"
                      />
                    </label>
                    <input
                      type="text"
                      placeholder="Reason (e.g. Medical exemption, sports quota)"
                      value={editingEval.fitnessSnapshot.overrideReason || ''}
                      onChange={(e) =>
                        setEditingEval({
                          ...editingEval,
                          fitnessSnapshot: {
                            ...editingEval.fitnessSnapshot,
                            overrideReason: e.target.value
                          }
                        })
                      }
                      className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-1.5 font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setEditingEval(
                          recalculateEvaluationTotals({
                            ...editingEval,
                            fitnessSnapshot: {
                              ...editingEval.fitnessSnapshot,
                              manualOverrideMarks: undefined,
                              overrideReason: undefined
                            }
                          })
                        );
                        setShowOverridePanel(false);
                      }}
                      className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-bold text-slate-600 hover:bg-slate-100 flex items-center gap-1"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Use Auto
                    </button>
                  </div>
                )}
              </div>

              {/* SECTION 2: DISCIPLINE & SPORTSMANSHIP */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                  <div>
                    <h4 className="text-sm font-black text-[#0D2B52] uppercase">
                      2. Discipline, Kit &amp; Sportsmanship (Max {weights.disciplineMax} Marks)
                    </h4>
                    <p className="text-xs text-slate-500">
                      Rate 4 core habits on 1–5 (auto-scaled to {weights.disciplineMax} marks)
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => applyDisciplinePreset(5)}
                      className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-[11px] font-bold"
                    >
                      Exemplary (5/5)
                    </button>
                    <button
                      type="button"
                      onClick={() => applyDisciplinePreset(4)}
                      className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-lg text-[11px] font-bold"
                    >
                      Good (4/5)
                    </button>
                    <button
                      type="button"
                      onClick={() => applyDisciplinePreset(3)}
                      className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-[11px] font-bold"
                    >
                      Developing (3/5)
                    </button>
                    <div className="ml-2 text-right">
                      <span className="text-xl font-black text-emerald-700">{editingEval.discipline.marksAwarded}</span>
                      <span className="text-xs font-bold text-slate-500"> / {weights.disciplineMax}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {DISCIPLINE_CRITERIA.map(c => {
                    const currentVal = editingEval.discipline[c.key];
                    return (
                      <div key={c.key} className="bg-slate-50 rounded-xl border border-slate-200 p-3 flex items-center justify-between gap-2">
                        <div>
                          <div className="text-xs font-bold text-slate-800">{c.label}</div>
                          <div className="text-[11px] text-slate-500">{c.hint}</div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {[1, 2, 3, 4, 5].map(num => (
                            <button
                              key={num}
                              type="button"
                              onClick={() => updateDisciplineField(c.key, num)}
                              className={`w-7 h-7 rounded-lg text-xs font-black border transition-all ${
                                currentVal === num
                                  ? 'bg-[#0D2B52] text-white border-[#0D2B52] shadow-2xs'
                                  : 'bg-white text-slate-700 border-slate-200 hover:border-blue-400'
                              }`}
                            >
                              {num}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* SECTION 3: GAMES & SPORTS SKILLS (1 TO 8 SKILLS) */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                  <div>
                    <h4 className="text-sm font-black text-[#0D2B52] uppercase">
                      3. Games &amp; Sports Skill Assessment (Max {weights.gamesMax} Marks)
                    </h4>
                    <p className="text-xs text-slate-500">
                      Evaluate 1 to 8 skills per sport. Total raw score scales automatically into {weights.gamesMax} marks.
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-black text-amber-600">{editingEval.games.marksAwarded}</span>
                    <span className="text-xs font-bold text-slate-500"> / {weights.gamesMax} Marks</span>
                    <div className="text-[10px] text-slate-400 font-semibold">
                      Raw: {editingEval.games.rawTotal} / {editingEval.games.rawMax} ({editingEval.games.skills.length} skills &times; {editingEval.games.scaleMax})
                    </div>
                  </div>
                </div>

                {/* Sport & Scale Controls */}
                <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 rounded-xl border border-slate-200 p-3 text-xs">
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="font-bold text-slate-700">Sport:</label>
                    <select
                      value={editingEval.games.sportName}
                      onChange={(e) => handleChangeSport(e.target.value, true)}
                      className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-bold text-slate-800 outline-none"
                    >
                      {Object.keys(SPORT_SKILL_PRESETS).map(sp => (
                        <option key={sp} value={sp}>{sp}</option>
                      ))}
                    </select>

                    <button
                      type="button"
                      onClick={() => handleChangeSport(editingEval.games.sportName, true)}
                      className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-bold text-slate-600 hover:bg-slate-100"
                    >
                      Reset 5 Default Skills
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-slate-700 mr-1">Skill Scale:</span>
                    {([5, 8, 10] as const).map(sc => (
                      <button
                        key={sc}
                        type="button"
                        onClick={() => handleChangeScaleMax(sc)}
                        className={`px-2.5 py-1 rounded-lg font-black border transition-all ${
                          editingEval.games.scaleMax === sc
                            ? 'bg-[#0D2B52] text-white border-[#0D2B52]'
                            : 'bg-white text-slate-700 border-slate-300'
                        }`}
                      >
                        1–{sc}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Dynamic 1-to-8 Skills Rows */}
                <div className="space-y-2">
                  {editingEval.games.skills.map((skill, idx) => (
                    <div key={skill.id} className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1">
                        <span className="w-6 h-6 bg-[#0D2B52] text-white rounded-md flex items-center justify-center text-[11px] font-black shrink-0">
                          {idx + 1}
                        </span>
                        <input
                          type="text"
                          value={skill.skillName}
                          onChange={(e) => handleSkillNameChange(idx, e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div className="flex items-center gap-1 flex-wrap justify-end">
                        {Array.from({ length: editingEval.games.scaleMax }, (_, i) => i + 1).map(val => (
                          <button
                            key={val}
                            type="button"
                            onClick={() => handleSkillScoreChange(idx, val)}
                            className={`w-7 h-7 rounded-lg text-xs font-black border transition-all ${
                              skill.score === val
                                ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-2xs'
                                : 'bg-white text-slate-700 border-slate-200 hover:border-amber-400'
                            }`}
                          >
                            {val}
                          </button>
                        ))}
                        {editingEval.games.skills.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveSkill(idx)}
                            title="Remove skill"
                            className="p-1.5 text-slate-400 hover:text-rose-600 ml-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {editingEval.games.skills.length < 8 && (
                  <button
                    type="button"
                    onClick={handleAddSkill}
                    className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-lg text-xs font-bold flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Another Skill ({editingEval.games.skills.length}/8)
                  </button>
                )}
              </div>

              {/* SECTION 4: TEACHER REMARKS */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-2.5 shadow-2xs text-xs">
                <label className="block font-black text-[#0D2B52] uppercase">
                  4. Teacher Remarks (Shown on Report Card)
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Shows consistent effort, teamwork & positive playground spirit.',
                    'Demonstrates strong athletic speed, agility & sports skill execution.',
                    'Steady growth observed from Baseline fitness measurements.',
                    'Encouraged to maintain regular stamina and flexibility practice.'
                  ].map((chip, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setEditingEval({ ...editingEval, remarks: chip })}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full text-[11px] font-semibold"
                    >
                      + {chip}
                    </button>
                  ))}
                </div>
                <textarea
                  rows={2}
                  value={editingEval.remarks}
                  onChange={(e) => setEditingEval({ ...editingEval, remarks: e.target.value })}
                  placeholder="Optional personalized teacher feedback for parents & report card..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3.5 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setEditingEval(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
              >
                Cancel
              </button>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleSaveEvaluation('report')}
                  className="px-4 py-2 bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300 rounded-xl text-xs font-black flex items-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5" />
                  Save &amp; Report Card
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleSaveEvaluation('close')}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  {saving ? 'Saving...' : 'Save Marks'}
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleSaveEvaluation('next')}
                  className="px-4 py-2 bg-[#0D2B52] hover:bg-slate-800 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm"
                >
                  Save &amp; Next Student
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
