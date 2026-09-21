import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Upload, 
  Users, 
  CheckCircle2, 
  School, 
  ArrowRight, 
  FileText, 
  Sparkles,
  Search,
  Filter,
  Download,
  AlertCircle,
  FileSpreadsheet,
  Check
} from 'lucide-react';
import { 
  academyService, 
  CoachingSportId, 
  CoachingAgeCategory,
  SPORT_TEMPLATES,
  calculateAgeFromDob,
  detectAgeCategory,
  getAgeCategoryColor,
  AGE_CATEGORY_BENCHMARKS
} from '../../services/academyService';
import { fitnessService } from '../../services/fitnessService';
import { offlineCacheService } from '../../services/offlineCacheService';
import { Student } from '../../types';
import { showToast } from '../../services/toast';

interface StudentImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
}

export interface ParsedCsvAthlete {
  name: string;
  gradeOrClass: string;
  dob: string;
  age: number;
  ageCategory: CoachingAgeCategory;
  sport: CoachingSportId;
  gender: 'Male' | 'Female' | 'Other';
  batchOrTeam: string;
  parentContact: string;
  medicalNotes: string;
}

export const StudentImportModal: React.FC<StudentImportModalProps> = ({
  isOpen,
  onClose,
  onImportComplete
}) => {
  const [activeTab, setActiveTab] = useState<'csv_upload' | 'paste_list' | 'school_db'>('csv_upload');
  
  // CSV Upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [csvFileName, setCsvFileName] = useState<string>('');
  const [parsedCsvAthletes, setParsedCsvAthletes] = useState<ParsedCsvAthlete[]>([]);
  const [csvDefaultSport, setCsvDefaultSport] = useState<CoachingSportId>('football');
  const [csvDefaultBatch, setCsvDefaultBatch] = useState<string>('Academy Squad');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [showTemplateGuide, setShowTemplateGuide] = useState<boolean>(true);

  // Paste list state
  const [pastedNames, setPastedNames] = useState<string>('');
  const [pasteBatch, setPasteBatch] = useState<string>('U-14 Coaching Squad');
  const [pasteSport, setPasteSport] = useState<CoachingSportId>('football');
  const [pasteGender, setPasteGender] = useState<'Male' | 'Female'>('Male');
  const [pasteAge, setPasteAge] = useState<number>(13);
  const [pasteClass, setPasteClass] = useState<string>('Class 8');
  const [pasteAgeCategory, setPasteAgeCategory] = useState<CoachingAgeCategory>('U-14');

  // School Database state
  const [schoolStudents, setSchoolStudents] = useState<Student[]>([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
  const [gradeFilter, setGradeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSport, setSelectedSport] = useState<CoachingSportId>('football');

  // Load school students for tab 3
  useEffect(() => {
    if (!isOpen) return;

    const loadStudents = async () => {
      setIsLoadingStudents(true);
      try {
        const cached = offlineCacheService.getStudentsFromOfflineCache();
        let list = await fitnessService.getStudents('all_teachers', undefined, true);
        if ((!list || list.length === 0) && cached && cached.length > 0) {
          list = cached;
        }

        if (list && list.length > 0) {
          setSchoolStudents(list);
          setSelectedStudentIds(new Set(list.slice(0, 15).map(s => s.id)));
        } else {
          // Fallback sample data
          const fallbackStudents: Student[] = [
            { id: 'fb-1', name: 'Aarav Sharma', grade: '8', section: 'A', gender: 'Male', rollNumber: '01', age: 14, schoolId: 'master', teacherId: 'teacher-pe-1' },
            { id: 'fb-2', name: 'Diya Patel', grade: '7', section: 'B', gender: 'Female', rollNumber: '02', age: 13, schoolId: 'master', teacherId: 'teacher-pe-1' },
            { id: 'fb-3', name: 'Karan Mehra', grade: '9', section: 'A', gender: 'Male', rollNumber: '03', age: 15, schoolId: 'master', teacherId: 'teacher-pe-1' },
            { id: 'fb-4', name: 'Sneha Reddy', grade: '8', section: 'B', gender: 'Female', rollNumber: '04', age: 14, schoolId: 'master', teacherId: 'teacher-pe-1' },
            { id: 'fb-5', name: 'Rohan Deshmukh', grade: '10', section: 'A', gender: 'Male', rollNumber: '05', age: 16, schoolId: 'master', teacherId: 'teacher-pe-1' },
            { id: 'fb-6', name: 'Ananya Iyer', grade: '6', section: 'C', gender: 'Female', rollNumber: '06', age: 12, schoolId: 'master', teacherId: 'teacher-pe-1' },
            { id: 'fb-7', name: 'Kabir Singh', grade: '7', section: 'C', gender: 'Male', rollNumber: '07', age: 13, schoolId: 'master', teacherId: 'teacher-pe-1' },
            { id: 'fb-8', name: 'Ishita Roy', grade: '8', section: 'A', gender: 'Female', rollNumber: '08', age: 14, schoolId: 'master', teacherId: 'teacher-pe-1' }
          ];
          setSchoolStudents(fallbackStudents);
          setSelectedStudentIds(new Set(fallbackStudents.map(s => s.id)));
        }
      } catch (err) {
        console.error('Error loading students:', err);
      } finally {
        setIsLoadingStudents(false);
      }
    };

    loadStudents();
  }, [isOpen]);

  if (!isOpen) return null;

  // --- CSV / Excel parsing helpers ---
  const normalizeSport = (input: string, fallback: CoachingSportId): CoachingSportId => {
    if (!input) return fallback;
    const clean = input.toLowerCase().replace(/[^a-z]/g, '');
    if (clean.includes('foot') || clean.includes('soccer')) return 'football';
    if (clean.includes('crick')) return 'cricket';
    if (clean.includes('basket')) return 'basketball';
    if (clean.includes('badm')) return 'badminton';
    if (clean.includes('tenni') && !clean.includes('table')) return 'tennis';
    if (clean.includes('table') || clean.includes('tt') || clean.includes('ping')) return 'table-tennis';
    if (clean.includes('athlet') || clean.includes('track') || clean.includes('run')) return 'athletics';
    if (clean.includes('swim')) return 'swimming';
    if (clean.includes('volley')) return 'volleyball';
    if (clean.includes('kabad')) return 'kabaddi';
    if (clean.includes('chess')) return 'chess';
    if (clean.includes('yoga') || clean.includes('fitn')) return 'yoga-fitness';
    return fallback;
  };

  const parseCsvText = (text: string) => {
    const rawLines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
    if (rawLines.length === 0) {
      showToast('Uploaded file is empty', 'error');
      return;
    }

    // Check if line 0 is a header
    const firstLineLower = rawLines[0].toLowerCase();
    const hasHeader = 
      firstLineLower.includes('name') || 
      firstLineLower.includes('student') || 
      firstLineLower.includes('athlete') ||
      firstLineLower.includes('class') ||
      firstLineLower.includes('birth');
      
    const dataLines = hasHeader ? rawLines.slice(1) : rawLines;

    // Detect delimiter (, or ; or tab)
    const sampleLine = dataLines[0] || rawLines[0];
    const delimiter = sampleLine.includes('\t') ? '\t' : sampleLine.includes(';') ? ';' : ',';

    const headerCols = hasHeader 
      ? rawLines[0].split(delimiter).map(c => c.trim().toLowerCase().replace(/['"]/g, ''))
      : [];

    const nameIdx = headerCols.findIndex(c => c.includes('name') || c.includes('student') || c.includes('athlete'));
    const classIdx = headerCols.findIndex(c => c.includes('class') || c.includes('grade') || c.includes('std'));
    const dobIdx = headerCols.findIndex(c => c.includes('dob') || c.includes('birth') || c.includes('bday') || c.includes('date'));
    const ageIdx = headerCols.findIndex(c => c === 'age' || c.includes('age'));
    const sportIdx = headerCols.findIndex(c => c.includes('sport') || c.includes('game') || c.includes('activity'));
    const genderIdx = headerCols.findIndex(c => c.includes('gender') || c.includes('sex'));
    const batchIdx = headerCols.findIndex(c => c.includes('batch') || c.includes('squad') || c.includes('team'));
    const contactIdx = headerCols.findIndex(c => c.includes('contact') || c.includes('phone') || c.includes('mobile') || c.includes('parent'));
    const notesIdx = headerCols.findIndex(c => c.includes('note') || c.includes('medical') || c.includes('remark'));

    const parsed: ParsedCsvAthlete[] = [];

    dataLines.forEach((line) => {
      const parts = line.split(delimiter).map(p => p.trim().replace(/^["']|["']$/g, ''));
      if (parts.length === 0 || !parts[0]) return;

      let name = '';
      let classRaw = '';
      let dobRaw = '';
      let ageRaw = '';
      let sportRaw = '';
      let genderRaw = '';
      let batchRaw = '';
      let contactRaw = '';
      let notesRaw = '';

      if (hasHeader) {
        name = nameIdx >= 0 ? (parts[nameIdx] || '') : (parts[0] || '');
        classRaw = classIdx >= 0 ? (parts[classIdx] || '') : '';
        dobRaw = dobIdx >= 0 ? (parts[dobIdx] || '') : '';
        ageRaw = ageIdx >= 0 ? (parts[ageIdx] || '') : '';
        sportRaw = sportIdx >= 0 ? (parts[sportIdx] || '') : '';
        genderRaw = genderIdx >= 0 ? (parts[genderIdx] || '') : '';
        batchRaw = batchIdx >= 0 ? (parts[batchIdx] || '') : '';
        contactRaw = contactIdx >= 0 ? (parts[contactIdx] || '') : '';
        notesRaw = notesIdx >= 0 ? (parts[notesIdx] || '') : '';
      } else {
        // Fallback positional: Name, Class, Date of Birth, Game/Sport, Gender, Contact, Notes
        name = parts[0] || '';
        classRaw = parts[1] || '';
        dobRaw = parts[2] || '';
        sportRaw = parts[3] || '';
        genderRaw = parts[4] || '';
        contactRaw = parts[5] || '';
        notesRaw = parts[6] || '';
      }

      // Clean leading roll numbers or bullet marks if present
      const cleanName = name.replace(/^(\d+[\.\-\)]|\*|\-)\s*/, '').trim();
      if (!cleanName) return;

      // Robust Age & DOB extraction
      let parsedAge = 0;
      let finalDob = dobRaw ? dobRaw.trim() : '';

      if (finalDob) {
        parsedAge = calculateAgeFromDob(finalDob);
      } else if (ageRaw) {
        parsedAge = parseInt(ageRaw, 10) || 0;
      } else if (classRaw) {
        const classNum = parseInt(classRaw.replace(/[^0-9]/g, ''), 10);
        if (classNum >= 1 && classNum <= 12) {
          parsedAge = classNum + 5;
        }
      }

      if (parsedAge <= 0) parsedAge = 13;
      if (!finalDob) {
        const birthYear = new Date().getFullYear() - parsedAge;
        finalDob = `${birthYear}-05-15`;
      }

      const finalClass = classRaw.trim() || (parsedAge <= 10 ? 'Class 4' : parsedAge <= 12 ? 'Class 6' : parsedAge === 13 ? 'Class 7' : parsedAge === 14 ? 'Class 8' : parsedAge <= 16 ? 'Class 10' : 'Class 12');
      
      // Auto-detect sports coaching age category (U-10, U-12, U-13, U-14, U-16, etc.)
      const detectedCategory = detectAgeCategory(parsedAge, finalDob, finalClass);
      const parsedSport = normalizeSport(sportRaw, csvDefaultSport);
      const parsedGender: 'Male' | 'Female' | 'Other' = 
        genderRaw.toLowerCase().startsWith('f') ? 'Female' : 'Male';

      const squadName = batchRaw.trim() || `${SPORT_TEMPLATES[parsedSport]?.name || 'Academy'} ${detectedCategory} Squad`;

      parsed.push({
        name: cleanName,
        gradeOrClass: finalClass,
        dob: finalDob,
        age: parsedAge,
        ageCategory: detectedCategory,
        sport: parsedSport,
        gender: parsedGender,
        batchOrTeam: squadName,
        parentContact: contactRaw.trim(),
        medicalNotes: notesRaw.trim()
      });
    });

    if (parsed.length === 0) {
      showToast('Could not parse any valid student names from file', 'error');
      return;
    }

    setParsedCsvAthletes(parsed);
    showToast(`Detected ${parsed.length} athletes with sports age categories (U-13, U-14, U-16)!`, 'success');
  };

  const handleUpdateAthleteCategory = (index: number, newCategory: CoachingAgeCategory) => {
    setParsedCsvAthletes(prev => {
      const next = [...prev];
      if (next[index]) {
        next[index] = {
          ...next[index],
          ageCategory: newCategory,
          batchOrTeam: `${SPORT_TEMPLATES[next[index].sport]?.name || 'Academy'} ${newCategory} Squad`
        };
      }
      return next;
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      parseCsvText(text);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    setCsvFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      parseCsvText(text);
    };
    reader.readAsText(file);
  };

  const SAMPLE_CSV_CONTENT = 
`Name,Class,Date of Birth,Game/Sport,Gender,Parent Contact,Medical Notes
Aarav Sharma,Class 8,2012-05-15,Football,Male,9876543210,None
Diya Patel,Class 7,2013-08-20,Badminton,Female,9876543211,Asthma inhaler as needed
Karan Mehra,Class 9,2011-03-12,Cricket,Male,9876543212,None
Sneha Reddy,Class 8,2012-11-04,Athletics,Female,9876543213,Allergic to dust
Rohan Deshmukh,Class 10,2010-06-25,Basketball,Male,9876543214,None
Ananya Iyer,Class 6,2014-04-18,Tennis,Female,9876543215,None
Arjun Nair,Class 8,2012-02-28,Football,Male,9876543216,None
Priya Sen,Class 5,2015-09-30,Swimming,Female,9876543217,None
Kabir Verma,Class 7,2013-02-09,Table Tennis,Male,9876543218,None
Tanvi Joshi,Class 8,2012-07-14,Yoga & Fitness,Female,9876543219,None
Vikram Chauhan,Class 11,2009-12-01,Kabaddi,Male,9876543220,None`;

  const handleDownloadTemplate = () => {
    const blob = new Blob([SAMPLE_CSV_CONTENT], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'smartpe_age_category_students_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Downloaded Academy Students CSV template with Name, Class & Date of Birth!', 'info');
  };

  const handleLoadSampleTemplate = () => {
    setCsvFileName('sample_age_category_roster.csv');
    parseCsvText(SAMPLE_CSV_CONTENT);
  };

  const handleImportParsedCsv = () => {
    if (parsedCsvAthletes.length === 0) {
      showToast('No parsed students to import. Please upload a CSV file first.', 'error');
      return;
    }

    const count = academyService.importBulkStudents(
      parsedCsvAthletes.map(a => ({
        name: a.name,
        sport: a.sport,
        gradeOrClass: a.gradeOrClass,
        dob: a.dob,
        age: a.age,
        ageCategory: a.ageCategory,
        gender: a.gender,
        batchOrTeam: a.batchOrTeam,
        parentContact: a.parentContact,
        medicalNotes: a.medicalNotes
      })),
      csvDefaultSport,
      csvDefaultBatch
    );

    showToast(`Successfully added ${count} athletes with detected age categories to Academy roster!`, 'success');
    onImportComplete();
    onClose();
  };

  // --- Paste list import ---
  const handleImportFromPasted = () => {
    const lines = pastedNames
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    if (lines.length === 0) {
      showToast('Please enter or paste at least one student name', 'error');
      return;
    }

    const payload = lines.map((name) => {
      // If coach pasted "Aarav Sharma, Cricket" or "Aarav Sharma - 14"
      const parts = name.split(/,|\t|-/).map(p => p.trim());
      const cleanName = parts[0].replace(/^(\d+[\.\-\)]|\*|\-)\s*/, '').trim();
      const possibleSport = parts[1] ? normalizeSport(parts[1], pasteSport) : pasteSport;
      const possibleAge = parts[2] ? (parseInt(parts[2], 10) || pasteAge) : pasteAge;
      const birthYear = new Date().getFullYear() - possibleAge;
      const dob = `${birthYear}-05-15`;
      const detectedCat = detectAgeCategory(possibleAge, dob, pasteClass);

      return {
        name: cleanName,
        sport: possibleSport,
        age: possibleAge,
        dob: dob,
        gradeOrClass: pasteClass,
        ageCategory: detectedCat,
        gender: pasteGender,
        batchOrTeam: pasteBatch || `${SPORT_TEMPLATES[possibleSport]?.name || 'Academy'} ${detectedCat} Squad`
      };
    });

    const count = academyService.importBulkStudents(payload, pasteSport, pasteBatch);
    showToast(`Successfully imported ${count} student profiles into ${SPORT_TEMPLATES[pasteSport]?.name}!`, 'success');
    onImportComplete();
    onClose();
  };

  // --- School PE database import ---
  const filteredSchoolStudents = schoolStudents.filter(s => {
    const matchGrade = gradeFilter === 'all' || s.grade === gradeFilter;
    const matchSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        (s.rollNumber && s.rollNumber.includes(searchQuery));
    return matchGrade && matchSearch;
  });

  const availableGrades = Array.from(new Set(schoolStudents.map(s => s.grade))).sort();

  const handleToggleStudent = (id: string) => {
    const next = new Set(selectedStudentIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedStudentIds(next);
  };

  const handleToggleSelectAll = () => {
    if (selectedStudentIds.size === filteredSchoolStudents.length) {
      setSelectedStudentIds(new Set());
    } else {
      setSelectedStudentIds(new Set(filteredSchoolStudents.map(s => s.id)));
    }
  };

  const handleImportFromSchool = () => {
    const toImport = schoolStudents.filter(s => selectedStudentIds.has(s.id));
    if (toImport.length === 0) {
      showToast('Please select at least one student to import', 'error');
      return;
    }

    const payload = toImport.map(s => ({
      id: s.id,
      name: s.name,
      grade: s.grade,
      gender: s.gender,
      age: s.age || 13,
      dob: `20${14 - (s.age || 13)}-05-15`,
      parentName: 'Parent / Guardian',
      sport: selectedSport,
      position: SPORT_TEMPLATES[selectedSport]?.positions[0]?.name || 'All-Rounder'
    }));

    const count = academyService.importStudentsFromSchool(payload, selectedSport);
    showToast(`Successfully imported ${count} students into ${SPORT_TEMPLATES[selectedSport]?.name} roster!`, 'success');
    onImportComplete();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[350] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border-2 border-slate-900 rounded-3xl max-w-3xl w-full p-6 sm:p-8 space-y-6 shadow-2xl animate-slide-up max-h-[92vh] flex flex-col justify-between">
        
        {/* Header */}
        <div>
          <div className="flex items-center justify-between border-b-2 border-slate-100 pb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shadow-md">
                <Upload size={20} />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight font-display">
                    Bulk Student Roster Upload
                  </h2>
                  <span className="px-2 py-0.5 bg-amber-100 text-amber-900 rounded-md text-[10px] font-black uppercase tracking-wider">
                    Academy Database
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium">
                  Easily upload 30 to 40+ students at once via CSV file, copy-paste names, or School PE roster.
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition"
            >
              <X size={20} />
            </button>
          </div>

          {/* 3 Nav Tabs */}
          <div className="flex items-center space-x-2 mt-4 bg-slate-100 p-1.5 rounded-2xl">
            <button
              onClick={() => setActiveTab('csv_upload')}
              className={`flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center justify-center space-x-2 ${
                activeTab === 'csv_upload'
                  ? 'bg-white text-slate-950 shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileSpreadsheet size={15} />
              <span>CSV / Excel Upload (30-40+ Students)</span>
            </button>

            <button
              onClick={() => setActiveTab('paste_list')}
              className={`flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center justify-center space-x-2 ${
                activeTab === 'paste_list'
                  ? 'bg-white text-slate-950 shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText size={15} />
              <span>Copy-Paste Names</span>
            </button>

            <button
              onClick={() => setActiveTab('school_db')}
              className={`flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center justify-center space-x-2 ${
                activeTab === 'school_db'
                  ? 'bg-white text-slate-950 shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <School size={15} />
              <span>From School PE ({schoolStudents.length})</span>
            </button>
          </div>
        </div>

        {/* TAB 1: CSV FILE UPLOAD */}
        {activeTab === 'csv_upload' && (
          <div className="space-y-4 overflow-y-auto pr-1">
            
            {/* Template Header & 1-Click Sample Actions */}
            <div className="p-4 bg-amber-50/80 border-2 border-amber-300/80 rounded-2xl space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center space-x-2">
                    <Sparkles size={16} className="text-amber-700" />
                    <span className="text-xs font-black text-amber-950 uppercase tracking-wide">
                      Coaching Age Category Template (.CSV)
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-900/80 font-medium mt-0.5">
                    Required Columns: <strong className="font-bold">Name</strong>, <strong className="font-bold">Class</strong>, <strong className="font-bold">Date of Birth</strong>, Game/Sport, Gender.
                  </p>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={handleDownloadTemplate}
                    className="px-3.5 py-2 bg-white hover:bg-amber-100 text-slate-900 border-2 border-slate-900 rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center space-x-1.5 shadow-xs active:scale-95"
                  >
                    <Download size={13} className="text-amber-600" />
                    <span>Download Sample CSV</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleLoadSampleTemplate}
                    className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 border-2 border-slate-900 rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center space-x-1.5 shadow-xs active:scale-95"
                  >
                    <Users size={13} />
                    <span>Load 11 Athletes Sample</span>
                  </button>
                </div>
              </div>

              {/* Age Category Detection Explanation Banner */}
              <div className="pt-2.5 border-t border-amber-200/80 grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                <div className="bg-white/80 p-2 rounded-xl border border-amber-200/60">
                  <span className="font-black text-slate-900 block uppercase text-[10px] text-amber-700">Automatic Age Detection</span>
                  <span className="text-slate-600 font-medium">Calculates precise age from Date of Birth or School Class.</span>
                </div>
                <div className="bg-white/80 p-2 rounded-xl border border-amber-200/60">
                  <span className="font-black text-slate-900 block uppercase text-[10px] text-amber-700">Sports Category Brackets</span>
                  <span className="text-slate-600 font-medium">Maps directly to <strong>U-13</strong>, <strong>U-14</strong>, <strong>U-16</strong>, <strong>U-12</strong> & <strong>U-17</strong>.</span>
                </div>
                <div className="bg-white/80 p-2 rounded-xl border border-amber-200/60">
                  <span className="font-black text-slate-900 block uppercase text-[10px] text-amber-700">Age-Normalized Reports</span>
                  <span className="text-slate-600 font-medium">Calibrates stamina, skill & speed benchmarks on merit report cards.</span>
                </div>
              </div>
            </div>

            {/* Default sport and batch fallback */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-700 mb-1">
                  Default Game / Sport (If unassigned in file)
                </label>
                <select
                  value={csvDefaultSport}
                  onChange={e => setCsvDefaultSport(e.target.value as CoachingSportId)}
                  className="w-full bg-white border-2 border-slate-900 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none"
                >
                  {Object.values(SPORT_TEMPLATES).map(tmpl => (
                    <option key={tmpl.id} value={tmpl.id}>
                      {tmpl.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-700 mb-1">
                  Default Batch / Squad Name
                </label>
                <input
                  type="text"
                  value={csvDefaultBatch}
                  onChange={e => setCsvDefaultBatch(e.target.value)}
                  placeholder="e.g. Academy Evening Batch or Coaching Squad"
                  className="w-full bg-white border-2 border-slate-900 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none"
                />
              </div>
            </div>

            {/* Drag & Drop Box */}
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-3xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center space-y-2 ${
                isDragging 
                  ? 'border-amber-500 bg-amber-50/50' 
                  : 'border-slate-300 hover:border-slate-900 bg-slate-50/70 hover:bg-slate-50'
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                accept=".csv,.txt"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="w-12 h-12 rounded-2xl bg-white border-2 border-slate-900 text-slate-900 flex items-center justify-center font-black shadow-sm">
                <FileSpreadsheet size={24} className="text-amber-500" />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-slate-900">
                  {csvFileName ? `Selected File: ${csvFileName}` : 'Click to Browse or Drag & Drop .CSV File'}
                </p>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                  Template with Name, Class & Date of Birth automatically categorizes athletes into U-13, U-14, U-16.
                </p>
              </div>
            </div>

            {/* Parsed Athletes Preview Table with Age Category Detection */}
            {parsedCsvAthletes.length > 0 && (
              <div className="border-2 border-slate-900 rounded-2xl overflow-hidden shadow-xs space-y-0">
                {/* Header with Category Breakdown */}
                <div className="bg-slate-900 text-white px-4 py-3">
                  <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                    <div className="flex items-center space-x-2">
                      <CheckCircle2 size={16} className="text-emerald-400" />
                      <span className="text-xs font-black uppercase tracking-wider">
                        {parsedCsvAthletes.length} Athletes Detected & Categorized
                      </span>
                    </div>
                    <span className="text-[10px] text-amber-300 font-mono bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800">
                      Coaching Age Benchmarks Active
                    </span>
                  </div>

                  {/* Category Summary Pills */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Cohorts:</span>
                    {(['U-10', 'U-12', 'U-13', 'U-14', 'U-16', 'U-17', 'U-19'] as CoachingAgeCategory[]).map(cat => {
                      const count = parsedCsvAthletes.filter(a => a.ageCategory === cat).length;
                      if (count === 0) return null;
                      const style = getAgeCategoryColor(cat);
                      return (
                        <span 
                          key={cat}
                          className={`text-[10px] font-black px-2 py-0.5 rounded-md border flex items-center space-x-1 ${style.bg} ${style.text} ${style.border}`}
                        >
                          <span>{cat}</span>
                          <span className="bg-white/60 px-1 rounded text-[9px]">{count}</span>
                        </span>
                      );
                    })}
                  </div>
                </div>

                {/* Table Rows */}
                <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 bg-white">
                  {parsedCsvAthletes.map((ath, idx) => {
                    const catStyle = getAgeCategoryColor(ath.ageCategory);
                    const benchmark = AGE_CATEGORY_BENCHMARKS[ath.ageCategory];

                    return (
                      <div key={idx} className="px-4 py-2.5 text-xs flex flex-col sm:flex-row sm:items-center justify-between hover:bg-slate-50 gap-2">
                        <div className="flex items-center space-x-2.5">
                          <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-black text-[10px] flex-shrink-0">
                            {idx + 1}
                          </span>
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-bold text-slate-900">{ath.name}</span>
                              <span className="px-1.5 py-0.2 bg-slate-100 text-slate-700 rounded text-[10px] font-bold">
                                {ath.gradeOrClass}
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-400">
                              DOB: {ath.dob} • Age {ath.age} yrs • {ath.gender}
                            </span>
                          </div>
                        </div>

                        {/* Category and Sport Pills */}
                        <div className="flex items-center space-x-2 self-end sm:self-auto">
                          {/* Age Category Selector */}
                          <select
                            value={ath.ageCategory}
                            onChange={(e) => handleUpdateAthleteCategory(idx, e.target.value as CoachingAgeCategory)}
                            className={`text-[10px] font-black px-2 py-1 rounded-md border cursor-pointer focus:outline-none ${catStyle.bg} ${catStyle.text} ${catStyle.border}`}
                            title={`Developmental Stage: ${benchmark?.developmentStage || benchmark?.name || ''}`}
                          >
                            <option value="U-10">U-10 (Foundation)</option>
                            <option value="U-12">U-12 (Skill Acquiring)</option>
                            <option value="U-13">U-13 (Junior Prep)</option>
                            <option value="U-14">U-14 (Youth Dev)</option>
                            <option value="U-16">U-16 (Competitive)</option>
                            <option value="U-17">U-17 (Advanced)</option>
                            <option value="U-19">U-19 (Pre-Elite)</option>
                            <option value="Senior">Senior</option>
                          </select>

                          <span className="px-2 py-0.5 bg-amber-100 text-amber-900 rounded-md text-[10px] font-black uppercase">
                            {SPORT_TEMPLATES[ath.sport]?.name || ath.sport}
                          </span>

                          <span className="text-[11px] text-slate-500 font-medium hidden md:inline">
                            {ath.batchOrTeam}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: COPY-PASTE NAMES */}
        {activeTab === 'paste_list' && (
          <div className="space-y-4 overflow-y-auto pr-1">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-700 mb-1">
                  Assign Game / Sport
                </label>
                <select
                  value={pasteSport}
                  onChange={e => setPasteSport(e.target.value as CoachingSportId)}
                  className="w-full bg-white border-2 border-slate-900 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none"
                >
                  {Object.values(SPORT_TEMPLATES).map(tmpl => (
                    <option key={tmpl.id} value={tmpl.id}>
                      {tmpl.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-700 mb-1">
                  Target Age Category
                </label>
                <select
                  value={pasteAgeCategory}
                  onChange={e => {
                    const cat = e.target.value as CoachingAgeCategory;
                    setPasteAgeCategory(cat);
                    if (cat === 'U-13') { setPasteAge(13); setPasteClass('Class 7'); }
                    else if (cat === 'U-14') { setPasteAge(14); setPasteClass('Class 8'); }
                    else if (cat === 'U-16') { setPasteAge(16); setPasteClass('Class 10'); }
                    else if (cat === 'U-12') { setPasteAge(12); setPasteClass('Class 6'); }
                  }}
                  className="w-full bg-white border-2 border-slate-900 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none"
                >
                  <option value="U-10">U-10 (Under 10)</option>
                  <option value="U-12">U-12 (Under 12)</option>
                  <option value="U-13">U-13 (Under 13)</option>
                  <option value="U-14">U-14 (Under 14)</option>
                  <option value="U-16">U-16 (Under 16)</option>
                  <option value="U-17">U-17 (Under 17)</option>
                  <option value="U-19">U-19 (Under 19)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-700 mb-1">
                  School Class / Grade
                </label>
                <input
                  type="text"
                  value={pasteClass}
                  onChange={e => setPasteClass(e.target.value)}
                  placeholder="e.g. Class 8"
                  className="w-full bg-white border-2 border-slate-900 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-700 mb-1">
                  Batch / Squad
                </label>
                <input
                  type="text"
                  value={pasteBatch}
                  onChange={e => setPasteBatch(e.target.value)}
                  placeholder="e.g. U-14 Football Batch"
                  className="w-full bg-white border-2 border-slate-900 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-black uppercase tracking-wider text-slate-900">
                  Paste Student Names (One per line)
                </label>
                <span className="text-[11px] text-slate-500 font-medium">
                  {pastedNames.split('\n').filter(n => n.trim().length > 0).length} names detected
                </span>
              </div>
              <textarea
                rows={6}
                value={pastedNames}
                onChange={e => setPastedNames(e.target.value)}
                placeholder={`Aarav Sharma\nDiya Patel\nKaran Mehra\nSneha Reddy\nRohan Deshmukh\nAnanya Iyer\nKabir Singh\nIshita Roy`}
                className="w-full bg-slate-50 border-2 border-slate-900 rounded-2xl p-4 text-xs font-mono font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <p className="text-[11px] text-slate-500 font-medium mt-1">
                Tip: Names pasted here will automatically be tagged with your selected Age Category ({pasteAgeCategory}) and Class ({pasteClass}).
              </p>
            </div>
          </div>
        )}

        {/* TAB 3: FROM SCHOOL PE */}
        {activeTab === 'school_db' && (
          <div className="space-y-4 overflow-y-auto pr-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-700 mb-1">
                  Assign Academy Game / Sport
                </label>
                <select
                  value={selectedSport}
                  onChange={e => setSelectedSport(e.target.value as CoachingSportId)}
                  className="w-full bg-white border-2 border-slate-900 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none"
                >
                  {Object.values(SPORT_TEMPLATES).map(tmpl => (
                    <option key={tmpl.id} value={tmpl.id}>
                      {tmpl.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-700 mb-1">
                  Filter School Grade
                </label>
                <select
                  value={gradeFilter}
                  onChange={e => setGradeFilter(e.target.value)}
                  className="w-full bg-white border-2 border-slate-900 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none"
                >
                  <option value="all">All Grades ({schoolStudents.length} Students)</option>
                  {availableGrades.map(g => (
                    <option key={g} value={g}>
                      Class {g}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search student name or roll..."
                className="w-64 bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-900 focus:outline-none"
              />

              <button
                type="button"
                onClick={handleToggleSelectAll}
                className="text-xs font-black text-amber-600 hover:text-amber-700 uppercase tracking-wider"
              >
                {selectedStudentIds.size === filteredSchoolStudents.length ? 'Deselect All' : 'Select All Filtered'}
              </button>
            </div>

            {/* Students List with Detected Age Categories */}
            <div className="border border-slate-200 rounded-2xl max-h-52 overflow-y-auto divide-y divide-slate-100 bg-white">
              {filteredSchoolStudents.map(st => {
                const isSelected = selectedStudentIds.has(st.id);
                const detectedCat = detectAgeCategory(st.age || 13, undefined, st.grade);
                const catColor = getAgeCategoryColor(detectedCat);

                return (
                  <label
                    key={st.id}
                    className={`px-4 py-2.5 flex items-center justify-between cursor-pointer transition ${
                      isSelected ? 'bg-amber-50/50' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleStudent(st.id)}
                        className="rounded text-amber-500 focus:ring-amber-400 h-4 w-4 border-slate-300"
                      />
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-bold text-slate-900">{st.name}</span>
                          <span className={`text-[10px] font-black px-1.5 py-0.5 rounded border ${catColor.bg} ${catColor.text} ${catColor.border}`}>
                            {detectedCat}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500">
                          Class {st.grade} • Roll {st.rollNumber || 'N/A'} • {st.gender}
                        </span>
                      </div>
                    </div>

                    <span className="text-[10px] font-bold text-slate-400">
                      Age {st.age || 13}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="pt-4 border-t-2 border-slate-100 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black uppercase tracking-wider transition"
          >
            Cancel
          </button>

          {activeTab === 'csv_upload' && (
            <button
              type="button"
              onClick={handleImportParsedCsv}
              disabled={parsedCsvAthletes.length === 0}
              className="px-6 py-3 bg-amber-500 hover:bg-amber-400 disabled:bg-slate-300 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider transition shadow-md flex items-center space-x-2 active:scale-95"
            >
              <span>Import {parsedCsvAthletes.length || 0} Athletes to Academy Database</span>
              <ArrowRight size={16} />
            </button>
          )}

          {activeTab === 'paste_list' && (
            <button
              type="button"
              onClick={handleImportFromPasted}
              disabled={!pastedNames.trim()}
              className="px-6 py-3 bg-amber-500 hover:bg-amber-400 disabled:bg-slate-300 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider transition shadow-md flex items-center space-x-2 active:scale-95"
            >
              <span>Import Pasted Students</span>
              <ArrowRight size={16} />
            </button>
          )}

          {activeTab === 'school_db' && (
            <button
              type="button"
              onClick={handleImportFromSchool}
              disabled={selectedStudentIds.size === 0}
              className="px-6 py-3 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white rounded-xl text-xs font-black uppercase tracking-wider transition shadow-md flex items-center space-x-2 active:scale-95"
            >
              <span>Import {selectedStudentIds.size} Students</span>
              <ArrowRight size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
