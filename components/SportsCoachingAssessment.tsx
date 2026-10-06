import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Trophy, 
  Target, 
  Activity, 
  Zap, 
  Users, 
  UserPlus, 
  Award, 
  TrendingUp, 
  CheckCircle2, 
  AlertCircle, 
  Printer, 
  Download, 
  Calendar, 
  Clock, 
  Compass, 
  ShieldCheck, 
  Sparkles, 
  FileText, 
  Edit3, 
  Trash2, 
  ArrowRight, 
  ArrowUpRight, 
  ChevronRight, 
  BrainCircuit, 
  HelpCircle, 
  Check, 
  Layers, 
  RotateCcw,
  Sliders,
  BadgeCheck,
  Building,
  School,
  Flame,
  Dumbbell,
  Cloud,
  RefreshCw,
  Copy,
  Share2,
  Globe,
  Key,
  UserCheck,
  AlertTriangle,
  ExternalLink,
  FileSpreadsheet
} from 'lucide-react';
import { 
  sportsCoachingService, 
  SPORTS_REGISTRY, 
  SportDefinition, 
  AthleteProfile, 
  AssessmentRecord, 
  CoachProgramType, 
  AgeBracket, 
  AssessmentCycle,
  CoachProfile,
  SkillDefinition
} from '../services/sportsCoachingService';
import { 
  academicCoachingCloudService, 
  AcademicCoachingProgram 
} from '../services/academicCoachingCloudService';
import { coachingExcelReportService } from '../services/coachingExcelReportService';
import { PlayerProfileData, PlayerAssessmentRecord } from '../services/academyService';
import { toast } from '../services/toast';

export const SportsCoachingAssessment: React.FC = () => {
  // Academic Coaching Cloud Program (Independent from School Database)
  const [academicProgram, setAcademicProgram] = useState<AcademicCoachingProgram | null>(() => 
    academicCoachingCloudService.getLocalProgram()
  );
  const [isAcademicModalOpen, setIsAcademicModalOpen] = useState(false);
  const [academicModalTab, setAcademicModalTab] = useState<'register' | 'join'>('register');
  const [isSyncingCloud, setIsSyncingCloud] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Coach & Academy Profile
  const [coachProfile, setCoachProfile] = useState<CoachProfile>(() => sportsCoachingService.getCoachProfile());
  const [isEditingCoach, setIsEditingCoach] = useState(false);
  const [coachForm, setCoachForm] = useState<CoachProfile>(coachProfile);

  // Academic Registration Form
  const [regProgramName, setRegProgramName] = useState(coachProfile.programName || 'Elite Sports Coaching Academy');
  const [regProgramType, setRegProgramType] = useState<CoachProgramType>(coachProfile.programType || 'after_school_academy');
  const [regSport, setRegSport] = useState('football');
  const [regCoachName, setRegCoachName] = useState(coachProfile.coachName || 'Head Coach');

  // Join Existing Group Form (1-2 Co-Coaches)
  const [joinInviteCode, setJoinInviteCode] = useState('');
  const [joinCoachName, setJoinCoachName] = useState('');

  // 5-Day Access Window Status
  const trialStatus = useMemo(() => {
    if (!academicProgram?.trialExpiresAt) {
      return { days: 5, hours: 0, totalHoursLeft: 120, isExpired: false, formatted: '5 Days Free Pass' };
    }
    return academicCoachingCloudService.calculateRemainingTrialDays(academicProgram.trialExpiresAt);
  }, [academicProgram?.trialExpiresAt]);

  // Active Sport & Age Bracket
  const [selectedSportId, setSelectedSportId] = useState<string>('football');
  const activeSport: SportDefinition = SPORTS_REGISTRY[selectedSportId] || SPORTS_REGISTRY.football;

  // Active View Tab inside the Coaching Hub
  const [activeTab, setActiveTab] = useState<'assess' | 'progress' | 'passport' | 'roster' | 'protocols'>('assess');

  // Athletes list and selected athlete
  const [athletes, setAthletes] = useState<AthleteProfile[]>(() => sportsCoachingService.getAllAthletes());
  const [selectedAthleteId, setSelectedAthleteId] = useState<string>(() => {
    const all = sportsCoachingService.getAllAthletes();
    return all.length > 0 ? all[0].id : '';
  });

  // Assessment Entry State
  const [cycleType, setCycleType] = useState<AssessmentCycle>('baseline');
  const [scores, setScores] = useState<Record<string, number>>({});
  const [testDate, setTestDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [customCoachNotes, setCustomCoachNotes] = useState<string>('');

  // Athlete Creation Modal State
  const [isAddAthleteOpen, setIsAddAthleteOpen] = useState(false);
  const [newAthleteName, setNewAthleteName] = useState('');
  const [newAthleteAge, setNewAthleteAge] = useState<number>(12);
  const [newAthleteGender, setNewAthleteGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [newAthleteSquad, setNewAthleteSquad] = useState('U-12 Squad');
  const [newAthleteJersey, setNewAthleteJersey] = useState('');
  const [newAthleteGuardian, setNewAthleteGuardian] = useState('');
  const [newAthleteContact, setNewAthleteContact] = useState('');

  // Selected athlete entity
  const currentAthlete = useMemo(() => {
    return athletes.find(a => a.id === selectedAthleteId) || athletes[0] || null;
  }, [athletes, selectedAthleteId]);

  // Derived athlete age bracket
  const athleteAgeBracket: AgeBracket = useMemo(() => {
    if (!currentAthlete) return 'U-12';
    return sportsCoachingService.getAgeBracketFromAge(currentAthlete.age);
  }, [currentAthlete]);

  // Athlete's historical assessments
  const athleteAssessments = useMemo(() => {
    if (!currentAthlete) return [];
    return sportsCoachingService.getAssessmentsForAthlete(currentAthlete.id);
  }, [currentAthlete, athletes]);

  // Latest & Baseline assessment records
  const baselineAssessment = useMemo(() => {
    return athleteAssessments.find(a => a.cycleType === 'baseline') || athleteAssessments[0] || null;
  }, [athleteAssessments]);

  const latestAssessment = useMemo(() => {
    return athleteAssessments.length > 0 ? athleteAssessments[athleteAssessments.length - 1] : null;
  }, [athleteAssessments]);

  // Initialize scores with active sport default scores whenever sport or athlete changes
  useEffect(() => {
    const initialScores: Record<string, number> = {};
    activeSport.skills.forEach(skill => {
      // If athlete already has an assessment for this sport, pre-fill with latest values or default
      if (latestAssessment && latestAssessment.sportId === activeSport.id && latestAssessment.scores[skill.id] !== undefined) {
        initialScores[skill.id] = latestAssessment.scores[skill.id];
      } else {
        initialScores[skill.id] = skill.defaultScore;
      }
    });
    setScores(initialScores);
  }, [activeSport, selectedAthleteId, latestAssessment]);

  // Auto-sync with Firestore when Academic Program is active
  useEffect(() => {
    if (academicProgram?.id) {
      setIsSyncingCloud(true);
      Promise.all([
        academicCoachingCloudService.fetchCloudAthletes(academicProgram.id),
        academicCoachingCloudService.fetchCloudAssessments(academicProgram.id)
      ]).then(([cloudAthletes]) => {
        if (cloudAthletes && cloudAthletes.length > 0) {
          setAthletes(cloudAthletes);
          if (!selectedAthleteId) {
            setSelectedAthleteId(cloudAthletes[0].id);
          }
        }
      }).catch(err => {
        console.warn('Initial cloud sync notice:', err);
      }).finally(() => {
        setIsSyncingCloud(false);
      });
    }
  }, [academicProgram?.id]);

  // Handlers
  const handleScoreChange = (skillId: string, value: number) => {
    setScores(prev => ({
      ...prev,
      [skillId]: value
    }));
  };

  const handleCopyInviteCode = () => {
    if (!academicProgram?.inviteCode) return;
    navigator.clipboard.writeText(academicProgram.inviteCode);
    setCopiedCode(true);
    toast.success(`Invite Code ${academicProgram.inviteCode} copied! Share with your colleague teacher.`);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleManualCloudSync = async () => {
    if (!academicProgram?.id) {
      setIsAcademicModalOpen(true);
      return;
    }
    setIsSyncingCloud(true);
    try {
      const [cloudAthletes] = await Promise.all([
        academicCoachingCloudService.fetchCloudAthletes(academicProgram.id),
        academicCoachingCloudService.fetchCloudAssessments(academicProgram.id)
      ]);
      if (cloudAthletes && cloudAthletes.length > 0) {
        setAthletes(cloudAthletes);
      }
      toast.success('Cloud data synchronized successfully!');
    } catch (err) {
      toast.error('Could not sync cloud data.');
    } finally {
      setIsSyncingCloud(false);
    }
  };

  const handleRegisterProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regProgramName.trim()) {
      toast.error('Program or Academy name is required.');
      return;
    }
    try {
      const prog = await academicCoachingCloudService.registerAcademicProgram({
        programName: regProgramName.trim(),
        programType: regProgramType,
        sport: regSport,
        coachName: regCoachName.trim()
      });
      setAcademicProgram(prog);
      setCoachProfile(prev => ({
        ...prev,
        programName: prog.programName,
        coachName: prog.headCoachName,
        programType: prog.programType
      }));
      setIsAcademicModalOpen(false);
      toast.success(`🎉 Academic Coaching Program registered! 5-Day Full Cloud Access active. Invite Code: ${prog.inviteCode}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to register academic program.');
    }
  };

  const handleJoinProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinInviteCode.trim()) {
      toast.error('Please enter the 6-character Invite Code.');
      return;
    }
    try {
      const prog = await academicCoachingCloudService.joinProgramWithInviteCode(
        joinInviteCode.trim(),
        joinCoachName.trim() || 'Co-Coach'
      );
      setAcademicProgram(prog);
      setCoachProfile(prev => ({
        ...prev,
        programName: prog.programName,
        programType: prog.programType
      }));
      setIsAcademicModalOpen(false);
      
      const groupAthletes = await academicCoachingCloudService.fetchCloudAthletes(prog.id);
      if (groupAthletes.length > 0) {
        setAthletes(groupAthletes);
        setSelectedAthleteId(groupAthletes[0].id);
      }
      toast.success(`🤝 Connected to ${prog.programName}! Student roster and assessments loaded.`);
    } catch (err: any) {
      toast.error(err.message || 'Invalid invite code or group full.');
    }
  };

  const handleSaveAssessment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentAthlete) {
      toast.error('Please select or add an athlete first.');
      return;
    }

    const newRecord = sportsCoachingService.generateAssessmentResult(
      currentAthlete,
      activeSport,
      cycleType,
      scores,
      coachProfile.coachName,
      coachProfile.programName
    );

    if (customCoachNotes.trim()) {
      newRecord.coachFeedback = `${newRecord.coachFeedback} [Coach Note]: ${customCoachNotes.trim()}`;
    }

    // Save locally
    sportsCoachingService.saveAssessment(newRecord);

    // Save to Cloud if Academic Program is registered
    if (academicProgram?.id) {
      academicCoachingCloudService.saveCloudAssessment(newRecord, academicProgram.id).catch(err => {
        console.warn('Cloud assessment background save:', err);
      });
    }

    toast.success(`✅ ${cycleType.toUpperCase()} assessment saved for ${currentAthlete.name}! Score: ${newRecord.overallScore}/100 (${newRecord.overallTier})`);
    setActiveTab('passport');
  };

  const handleCreateAthlete = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAthleteName.trim()) {
      toast.error('Athlete name is required.');
      return;
    }

    const saved = sportsCoachingService.saveAthlete({
      name: newAthleteName.trim(),
      age: Number(newAthleteAge) || 12,
      gender: newAthleteGender,
      sport: selectedSportId,
      programType: coachProfile.programType,
      squadOrBatch: newAthleteSquad || 'Academy Squad',
      jerseyNo: newAthleteJersey || undefined,
      guardianName: newAthleteGuardian || undefined,
      guardianContact: newAthleteContact || undefined,
      joiningDate: new Date().toISOString().split('T')[0]
    });

    // Save to Cloud if Academic Program is active
    if (academicProgram?.id) {
      academicCoachingCloudService.saveCloudAthlete(saved, academicProgram.id).catch(err => {
        console.warn('Cloud athlete background save:', err);
      });
    }

    const updatedList = sportsCoachingService.getAllAthletes();
    setAthletes(updatedList);
    setSelectedAthleteId(saved.id);
    setIsAddAthleteOpen(false);
    setNewAthleteName('');
    toast.success(`🏆 Athlete ${saved.name} registered successfully!`);
  };

  const handleDeleteAthlete = (athleteId: string, athleteName: string) => {
    sportsCoachingService.deleteAthlete(athleteId);
    if (academicProgram?.id) {
      academicCoachingCloudService.deleteCloudAthlete(athleteId);
    }
    const updatedList = sportsCoachingService.getAllAthletes();
    setAthletes(updatedList);
    if (selectedAthleteId === athleteId) {
      setSelectedAthleteId(updatedList.length > 0 ? updatedList[0].id : '');
    }
    toast.info(`Athlete ${athleteName} removed.`);
  };

  const handleSaveCoachProfile = (e: React.FormEvent) => {
    e.preventDefault();
    sportsCoachingService.saveCoachProfile(coachForm);
    setCoachProfile(coachForm);
    setIsEditingCoach(false);
    toast.success('Coach & Program profile updated!');
  };

  const handlePrintPassport = () => {
    window.print();
  };

  const handleExportManagementExcel = () => {
    try {
      const allAssess = sportsCoachingService.getAllAssessments();
      const success = coachingExcelReportService.exportUniversalCoachingExcelReport(
        athletes,
        allAssess,
        coachProfile.programName || 'Sports Coaching Academy',
        coachProfile.coachName || 'Head Coach'
      );
      if (success) {
        toast.success('School Management Excel Report generated for entire student squad!');
      } else {
        toast.error('Failed to generate Excel report.');
      }
    } catch (e) {
      console.error(e);
      toast.error('Error generating Excel report.');
    }
  };

  const handleExportAthleteExcel = () => {
    if (!currentAthlete || !latestAssessment) {
      toast.error('No assessment available to export.');
      return;
    }
    try {
      const playerProfile: PlayerProfileData = {
        id: currentAthlete.id,
        name: currentAthlete.name,
        dob: currentAthlete.joiningDate,
        age: currentAthlete.age,
        gender: currentAthlete.gender,
        sport: (currentAthlete.sport as any) || 'football',
        position: currentAthlete.squadOrBatch || 'Athlete',
        batchOrTeam: currentAthlete.squadOrBatch,
        coachName: coachProfile.coachName,
        joiningDate: currentAthlete.joiningDate,
        parentName: currentAthlete.guardianName || '',
        parentContact: currentAthlete.guardianContact || '',
        dominantSide: 'Right',
        previousExperience: 'Grassroots',
        playerGoals: 'Skill Development',
        createdAt: currentAthlete.joiningDate,
        active: true
      };

      const playerAssess: PlayerAssessmentRecord = {
        id: latestAssessment.id,
        playerId: currentAthlete.id,
        playerName: currentAthlete.name,
        sport: (currentAthlete.sport as any) || 'football',
        position: currentAthlete.squadOrBatch || 'Athlete',
        assessmentType: latestAssessment.cycleType === 'baseline' ? 'Baseline Assessment' : 'Monthly Review',
        assessmentDate: latestAssessment.testDate,
        coachName: latestAssessment.coachName,
        skillRatings: latestAssessment.scores,
        skillObservations: {},
        skillTargets: {},
        includedPositionSkills: [],
        domainScores: {
          technical: latestAssessment.pillarAverages.technical,
          tactical: latestAssessment.pillarAverages.tactical,
          physical: latestAssessment.pillarAverages.physical,
          gameBehaviour: latestAssessment.pillarAverages.mental
        },
        overallScore: latestAssessment.overallScore,
        developmentLevel: latestAssessment.overallTier === 'Elite' || latestAssessment.overallTier === 'Advanced' ? 'Advanced' : latestAssessment.overallTier === 'Proficient' ? 'Proficient' : 'Developing',
        strengths: latestAssessment.strengths,
        developmentPriorities: latestAssessment.growthAreas,
        coachObservation: latestAssessment.coachFeedback,
        coachRecommendation: latestAssessment.prescribedDrills.map(d => `${d.drillName}: ${d.description} (${d.frequency})`).join('\n'),
        nextGoals: [],
        nextAssessmentDate: '',
        createdAt: latestAssessment.testDate
      };

      const success = coachingExcelReportService.exportIndividualStudentExcelReport(playerProfile, playerAssess);
      if (success) {
        toast.success(`Excel report downloaded for ${currentAthlete.name}!`);
      }
    } catch (e) {
      console.error(e);
      toast.error('Error exporting athlete Excel report.');
    }
  };

  // Calculate Progress Delta between Baseline and Latest
  const progressDelta = useMemo(() => {
    if (!baselineAssessment || !latestAssessment || baselineAssessment.id === latestAssessment.id) {
      return null;
    }
    const diff = latestAssessment.overallScore - baselineAssessment.overallScore;
    const pct = baselineAssessment.overallScore > 0 
      ? Math.round((diff / baselineAssessment.overallScore) * 100) 
      : 0;
    return { diff, pct };
  }, [baselineAssessment, latestAssessment]);

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-24">
      {/* Top Banner & Header */}
      <div className="bg-[#0D2B52] rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border-2 border-slate-900">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#D4A017]/20 border border-[#D4A017]/40 rounded-full text-[#D4A017] text-xs font-black uppercase tracking-wider">
              <Trophy size={14} />
              <span>Universal Sports Coaching &amp; Skill Assessment Standard</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white font-display">
              Sports Academy &amp; Coaching Hub
            </h1>
            <p className="text-sm sm:text-base text-slate-200 font-medium leading-relaxed">
              Standardized baseline testing, age-banded rubrics, game sense evaluation, and developmental passports for school coaches, after-school academies, and club trainers.
            </p>
          </div>

          {/* Coach & Program Badge Card */}
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 flex flex-col gap-2 min-w-[260px]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                {coachProfile.programType === 'school_team' && <School size={14} className="text-emerald-400" />}
                {coachProfile.programType === 'after_school_academy' && <Flame size={14} className="text-amber-400" />}
                {coachProfile.programType === 'sports_club' && <Building size={14} className="text-blue-400" />}
                {coachProfile.programType === 'individual_coach' && <Dumbbell size={14} className="text-purple-400" />}
                <span className="capitalize">{coachProfile.programType.replace(/_/g, ' ')}</span>
              </div>
              <button
                onClick={() => {
                  setCoachForm(coachProfile);
                  setIsEditingCoach(true);
                }}
                className="p-1.5 hover:bg-white/20 rounded-lg text-slate-200 hover:text-white transition-all text-xs font-bold flex items-center gap-1"
                title="Edit Coach Profile"
              >
                <Edit3 size={13} />
                <span>Edit</span>
              </button>
            </div>
            <div>
              <h3 className="text-sm font-black text-white truncate">{coachProfile.programName}</h3>
              <p className="text-xs text-[#D4A017] font-bold truncate">{coachProfile.coachName}</p>
            </div>
            <div className="text-[11px] text-slate-300 flex items-center justify-between pt-1 border-t border-white/10">
              <span>{coachProfile.city}</span>
              <span className="font-semibold text-emerald-300">{athletes.length} Registered Athletes</span>
            </div>
          </div>
        </div>
      </div>

      {/* Dual Program Architecture & Academic Cloud Synchronization Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-5 sm:p-6 text-white border-2 border-indigo-900 shadow-md space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 border border-emerald-500/40 rounded-full text-emerald-400 text-xs font-black uppercase tracking-wider">
                <Cloud size={13} className={isSyncingCloud ? 'animate-spin' : ''} />
                <span>{academicProgram ? 'Cloud Connected (Firestore)' : 'Academic Program Cloud Hub'}</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#D4A017]/20 border border-[#D4A017]/40 rounded-full text-[#D4A017] text-xs font-black uppercase tracking-wider">
                <Clock size={13} />
                <span>5-Day Academic Access: {trialStatus.formatted}</span>
              </span>
              {academicProgram && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-500/20 border border-blue-500/40 rounded-full text-blue-300 text-xs font-bold">
                  <UserCheck size={13} />
                  <span>{academicProgram.coachNames.length} Coach(es) in Group</span>
                </span>
              )}
            </div>

            <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
              <span>{academicProgram ? academicProgram.programName : 'Academic Sports Coaching Program'}</span>
              {academicProgram && (
                <span className="text-xs font-semibold text-slate-300">({academicProgram.sport.toUpperCase()})</span>
              )}
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              <strong className="text-amber-400">Independent Academic Database:</strong> Distinct from the formal School Database &amp; Principal Registry. Designed for single coaches or 1–2 colleague teachers in a coaching group to register athletes, enter test scores, and track developmental progress across the globe.
            </p>
          </div>

          {/* Action / Invite Controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            {academicProgram ? (
              <>
                {/* 6-Character Invite Code Chip */}
                <div className="bg-white/10 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white/20 flex items-center justify-between sm:justify-start gap-3">
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">Group Invite Code</div>
                    <div className="text-sm font-black font-mono tracking-widest text-[#D4A017]">{academicProgram.inviteCode}</div>
                  </div>
                  <button
                    onClick={handleCopyInviteCode}
                    className="p-1.5 hover:bg-white/20 rounded-xl text-slate-200 hover:text-white transition-all text-xs font-bold flex items-center gap-1"
                    title="Share code with 1-2 colleague teachers"
                  >
                    {copiedCode ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    <span className="text-[11px]">{copiedCode ? 'Copied' : 'Share'}</span>
                  </button>
                </div>

                {/* Cloud Sync Button */}
                <button
                  onClick={handleManualCloudSync}
                  disabled={isSyncingCloud}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-sm"
                >
                  <RefreshCw size={14} className={isSyncingCloud ? 'animate-spin' : ''} />
                  <span>{isSyncingCloud ? 'Syncing...' : 'Sync Cloud'}</span>
                </button>

                {/* Switch / Change Program */}
                <button
                  onClick={() => setIsAcademicModalOpen(true)}
                  className="px-3.5 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-2xl text-xs font-bold transition-all text-center"
                >
                  Manage Group
                </button>
              </>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => {
                    setAcademicModalTab('register');
                    setIsAcademicModalOpen(true);
                  }}
                  className="px-5 py-3 bg-[#D4A017] hover:bg-amber-400 text-slate-950 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl cursor-pointer"
                >
                  <Cloud size={16} />
                  <span>Register Academic Program (5-Day Pass)</span>
                </button>
                <button
                  onClick={() => {
                    setAcademicModalTab('join');
                    setIsAcademicModalOpen(true);
                  }}
                  className="px-4 py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-2xl text-xs font-bold transition-all text-center cursor-pointer"
                >
                  Join with Code
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Co-Teachers Cohort Indicator */}
        {academicProgram && academicProgram.coachNames.length > 0 && (
          <div className="pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-400">Coaching Staff (Max 3 in Group):</span>
              <div className="flex items-center gap-1.5">
                {academicProgram.coachNames.map((name, i) => (
                  <span key={i} className="bg-indigo-900/60 border border-indigo-700/50 px-2 py-0.5 rounded-lg text-[11px] font-semibold text-slate-200">
                    {name} {i === 0 ? '(Lead)' : '(Co-Coach)'}
                  </span>
                ))}
              </div>
            </div>
            <span className="text-[11px] text-slate-400">
              Colleague teachers can enter invite code <strong>{academicProgram.inviteCode}</strong> to share this student roster.
            </span>
          </div>
        )}
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-3">
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: 'assess', label: '1. Conduct Test', icon: Activity, badge: 'Baseline / Retest' },
            { id: 'progress', label: '2. Athlete Progress & Radar', icon: TrendingUp, badge: `${athleteAssessments.length} Tests` },
            { id: 'passport', label: '3. Player Passport & Report', icon: FileText, badge: 'Print Ready' },
            { id: 'roster', label: '4. Squad Roster', icon: Users, badge: `${athletes.length} Athletes` },
            { id: 'protocols', label: '5. Universal Protocols Guide', icon: Compass }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 border ${
                activeTab === tab.id
                  ? 'bg-[#0D2B52] text-white border-slate-900 shadow-md ring-2 ring-[#D4A017]'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border-slate-200'
              }`}
            >
              <tab.icon size={15} />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-extrabold ${
                  activeTab === tab.id ? 'bg-[#D4A017] text-slate-950' : 'bg-slate-100 text-slate-600'
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Quick Add Athlete Button */}
        <button
          onClick={() => setIsAddAthleteOpen(true)}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-sm transition-all cursor-pointer"
        >
          <UserPlus size={15} />
          <span>+ Add New Athlete</span>
        </button>
      </div>

      {/* Sport Selector Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-widest text-slate-500">Selected Sport / Game:</span>
            <span className="text-xs font-black text-[#0D2B52] uppercase">{activeSport.name}</span>
          </div>
          <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
            Standard: {activeSport.governingBody}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
          {Object.values(SPORTS_REGISTRY).map(sport => {
            const isSelected = selectedSportId === sport.id;
            return (
              <button
                key={sport.id}
                onClick={() => setSelectedSportId(sport.id)}
                className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between gap-1 cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-50 border-indigo-600 ring-2 ring-indigo-500 shadow-sm'
                    : 'bg-slate-50/70 hover:bg-slate-100 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-900 truncate">{sport.name}</span>
                  {isSelected && <CheckCircle2 size={15} className="text-indigo-600 flex-shrink-0" />}
                </div>
                <span className="text-[10px] text-slate-500 font-medium line-clamp-1">{sport.tagline}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Athlete Banner & Selector Bar */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-4 sm:p-5 rounded-3xl text-white shadow-md flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-xl font-black text-[#D4A017] shadow-inner">
            {currentAthlete ? currentAthlete.name.charAt(0) : '?'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-white">{currentAthlete?.name || 'No Athlete Selected'}</h2>
              {currentAthlete?.jerseyNo && (
                <span className="px-2 py-0.5 bg-[#D4A017] text-slate-950 text-[10px] font-black rounded-md">
                  #{currentAthlete.jerseyNo}
                </span>
              )}
              <span className="px-2 py-0.5 bg-white/20 text-white text-[10px] font-bold rounded-md uppercase">
                {athleteAgeBracket} ({currentAthlete?.age || 12} yrs)
              </span>
            </div>
            <p className="text-xs text-slate-300 font-medium">
              {currentAthlete?.squadOrBatch} &bull; {currentAthlete?.gender} &bull; {athleteAssessments.length} Test Cycles Completed
            </p>
          </div>
        </div>

        {/* Athlete Switcher Dropdown */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-slate-300">Switch Athlete:</label>
          <select
            value={selectedAthleteId}
            onChange={e => setSelectedAthleteId(e.target.value)}
            className="p-2.5 bg-white text-slate-900 rounded-xl font-black text-xs outline-none border border-slate-300 shadow-sm cursor-pointer"
          >
            {athletes.map(a => (
              <option key={a.id} value={a.id}>
                {a.name} ({a.age}y - {a.squadOrBatch})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: CONDUCT TEST & RECORD ASSESSMENT                                  */}
      {/* ========================================================================= */}
      {activeTab === 'assess' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Test Entry Form */}
          <div className="lg:col-span-8 space-y-6">
            <form onSubmit={handleSaveAssessment} className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                    <Activity size={18} className="text-indigo-600" />
                    <span>Skill &amp; Game Sense Score Entry</span>
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Enter measured physical times, target counts, and game sense rubrics.
                  </p>
                </div>

                {/* Cycle Selector */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500">Test Cycle:</span>
                  <select
                    value={cycleType}
                    onChange={e => setCycleType(e.target.value as AssessmentCycle)}
                    className="p-2 bg-indigo-50 border border-indigo-200 text-indigo-950 font-black text-xs rounded-xl outline-none"
                  >
                    <option value="baseline">1️⃣ Baseline Test (Initial)</option>
                    <option value="midterm">2️⃣ Mid-Term Progress Check</option>
                    <option value="summative">3️⃣ Summative / Final Term</option>
                    <option value="monthly">📅 Monthly Check-in</option>
                  </select>
                </div>
              </div>

              {/* Skills Scorecards Grid */}
              <div className="space-y-4">
                {activeSport.skills.map((skill, index) => {
                  const currentVal = scores[skill.id] !== undefined ? scores[skill.id] : skill.defaultScore;
                  const tier = sportsCoachingService.calculateSkillTier(currentVal, skill, athleteAgeBracket);
                  const norm = skill.ageNorms[athleteAgeBracket] || skill.ageNorms['U-14'];

                  return (
                    <div 
                      key={skill.id}
                      className="p-4 sm:p-5 rounded-2xl border border-slate-200 hover:border-indigo-300 transition-all bg-slate-50/50 space-y-3"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="space-y-1 max-w-md">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-slate-200 text-slate-700 text-[10px] font-black rounded uppercase">
                              {skill.category}
                            </span>
                            <h4 className="text-sm font-black text-slate-900">{skill.name}</h4>
                          </div>
                          <p className="text-xs text-slate-500 leading-snug">{skill.description}</p>
                        </div>

                        {/* Current Tier Badge */}
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-1 rounded-xl text-xs font-black uppercase tracking-wider ${
                            tier === 'Elite' ? 'bg-purple-100 text-purple-900 border border-purple-300' :
                            tier === 'Advanced' ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' :
                            tier === 'Proficient' ? 'bg-blue-100 text-blue-900 border border-blue-300' :
                            tier === 'Developing' ? 'bg-amber-100 text-amber-900 border border-amber-300' :
                            'bg-rose-100 text-rose-900 border border-rose-300'
                          }`}>
                            {tier}
                          </span>
                        </div>
                      </div>

                      {/* Input Control Based on Test Type */}
                      <div className="pt-2 flex flex-wrap items-center justify-between gap-4 border-t border-slate-200/60">
                        <div className="flex items-center gap-3">
                          <label className="text-xs font-bold text-slate-700">Measured Value ({skill.unit}):</label>
                          <div className="relative">
                            <input
                              type="number"
                              step={skill.unit === 'seconds' ? '0.1' : '1'}
                              value={currentVal}
                              onChange={e => handleScoreChange(skill.id, parseFloat(e.target.value) || 0)}
                              className="w-28 p-2 text-center bg-white border-2 border-slate-300 focus:border-indigo-600 rounded-xl font-black text-sm outline-none transition-all"
                            />
                          </div>
                        </div>

                        {/* Benchmark Guide Chips */}
                        <div className="text-[11px] text-slate-500 font-medium flex items-center gap-2">
                          <span>{athleteAgeBracket} Norms:</span>
                          <span className="text-slate-700 font-bold">
                            Proficient: {norm.proficient} {skill.unit} &bull; Elite: {norm.elite} {skill.unit}
                          </span>
                        </div>
                      </div>

                      {/* Slider for Rating Type */}
                      {skill.testType === 'rating' && (
                        <div className="pt-1">
                          <input
                            type="range"
                            min="1"
                            max="10"
                            step="0.5"
                            value={currentVal}
                            onChange={e => handleScoreChange(skill.id, parseFloat(e.target.value))}
                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                          />
                          <div className="flex justify-between text-[10px] text-slate-400 font-bold px-1">
                            <span>1 (Novice)</span>
                            <span>5 (Developing)</span>
                            <span>7 (Proficient)</span>
                            <span>9 (Advanced)</span>
                            <span>10 (Elite Master)</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Coach Custom Notes */}
              <div className="space-y-2 pt-2">
                <label className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Edit3 size={14} className="text-indigo-600" />
                  <span>Coach Developmental Notes &amp; Observations:</span>
                </label>
                <textarea
                  rows={3}
                  value={customCoachNotes}
                  onChange={e => setCustomCoachNotes(e.target.value)}
                  placeholder="e.g., Showed high willingness to track back defensively. Dribble control was crisp, but needs to keep head up when attacking the box."
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  className="px-8 py-3.5 bg-[#0D2B52] hover:bg-[#164077] text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg flex items-center gap-2 cursor-pointer active:scale-95"
                >
                  <CheckCircle2 size={16} className="text-[#D4A017]" />
                  <span>Save Assessment &amp; Generate Passport</span>
                </button>
              </div>
            </form>
          </div>

          {/* Right Column: Testing Guidelines & Game Sense Rubric */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-sm font-black text-[#0D2B52] uppercase tracking-wide flex items-center gap-2 font-display">
                <BrainCircuit size={18} className="text-[#D4A017]" />
                <span>{activeSport.gameSenseRubric.title}</span>
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {activeSport.gameSenseRubric.description}
              </p>

              <div className="space-y-2.5 pt-2">
                {activeSport.gameSenseRubric.levels.map(lvl => (
                  <div key={lvl.score} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                    <div className="flex items-center justify-between font-black">
                      <span className="text-[#0D2B52]">{lvl.label}</span>
                      <span className="px-1.5 py-0.5 bg-slate-200 rounded text-[10px] text-slate-700">
                        {lvl.score}/10 pts
                      </span>
                    </div>
                    <p className="text-slate-600 font-medium text-[11px] leading-relaxed">
                      {lvl.behavioralAnchor}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Summary of Age Bracket Norms */}
            <div className="bg-indigo-50/70 p-5 rounded-3xl border border-indigo-200 space-y-3">
              <h4 className="text-xs font-black text-indigo-950 uppercase tracking-wide flex items-center gap-1.5">
                <ShieldCheck size={16} className="text-indigo-600" />
                <span>Age Band: {athleteAgeBracket} Assessment Standards</span>
              </h4>
              <p className="text-[11px] text-indigo-900 leading-relaxed font-medium">
                Standardized against international youth athlete developmental pathways (LTAD). Scores are calculated with weighted dimensions:
              </p>
              <ul className="text-[11px] text-indigo-900/80 space-y-1 font-semibold list-disc pl-4">
                <li>Technical Core Skills: 35% Weight</li>
                <li>Tactical &amp; Game IQ: 25% Weight</li>
                <li>Physical &amp; Agility: 25% Weight</li>
                <li>Coachability &amp; Mental: 15% Weight</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: ATHLETE PROGRESS & RADAR EVOLUTION                                 */}
      {/* ========================================================================= */}
      {activeTab === 'progress' && (
        <div className="space-y-6">
          {/* Progress Delta Top Banner */}
          {progressDelta ? (
            <div className="bg-emerald-50 border-2 border-emerald-300 p-6 rounded-3xl flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black text-2xl shadow-md">
                  +{progressDelta.pct}%
                </div>
                <div>
                  <h3 className="text-base font-black text-emerald-950 uppercase">
                    Developmental Growth &bull; Baseline to Current
                  </h3>
                  <p className="text-xs text-emerald-800 font-medium">
                    {currentAthlete?.name} has shown a <strong>{progressDelta.diff > 0 ? `+${progressDelta.diff} points` : `${progressDelta.diff} points`}</strong> improvement in overall skill mastery!
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-[10px] uppercase font-bold text-slate-500">Initial Baseline</div>
                  <div className="text-base font-black text-slate-700">{baselineAssessment?.overallScore} / 100</div>
                </div>
                <ArrowRight size={20} className="text-slate-400" />
                <div className="text-left">
                  <div className="text-[10px] uppercase font-bold text-emerald-600">Current Score</div>
                  <div className="text-base font-black text-emerald-700">{latestAssessment?.overallScore} / 100</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-blue-50 border border-blue-200 p-5 rounded-3xl flex items-center justify-between">
              <div className="flex items-center gap-3 text-xs text-blue-900 font-medium">
                <AlertCircle size={18} className="text-blue-600" />
                <span>
                  {athleteAssessments.length === 1 
                    ? "Only Baseline test recorded so far. Conduct a Mid-term or Summative test to view comparative growth percentages!"
                    : "No assessments recorded yet for this athlete. Click 'Conduct Test' to start."}
                </span>
              </div>
              <button
                onClick={() => setActiveTab('assess')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-xl cursor-pointer"
              >
                Record Test Now
              </button>
            </div>
          )}

          {/* 4-Pillar Breakdown Cards */}
          {latestAssessment && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Technical Core', score: latestAssessment.pillarAverages.technical, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-200' },
                { label: 'Tactical & Game IQ', score: latestAssessment.pillarAverages.tactical, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
                { label: 'Physical & Agility', score: latestAssessment.pillarAverages.physical, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
                { label: 'Coachability & Grit', score: latestAssessment.pillarAverages.mental, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' }
              ].map(pillar => (
                <div key={pillar.label} className={`p-5 rounded-3xl border ${pillar.border} ${pillar.bg} space-y-2`}>
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">{pillar.label}</span>
                  <div className="flex items-baseline justify-between">
                    <span className={`text-3xl font-black ${pillar.color}`}>{pillar.score}%</span>
                    <span className="text-xs font-bold text-slate-600">
                      {pillar.score >= 85 ? 'Elite' : pillar.score >= 70 ? 'Proficient' : 'Developing'}
                    </span>
                  </div>
                  <div className="w-full bg-white/80 rounded-full h-2 overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${
                        pillar.score >= 85 ? 'bg-purple-600' : pillar.score >= 70 ? 'bg-emerald-500' : 'bg-amber-500'
                      }`}
                      style={{ width: `${pillar.score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Historical Assessments Timeline */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <h3 className="text-base font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
              <Calendar size={18} className="text-indigo-600" />
              <span>Assessment History for {currentAthlete?.name}</span>
            </h3>

            {athleteAssessments.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">No assessments found. Complete a test to build the player profile.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 uppercase font-black tracking-wider text-[10px] border-b border-slate-200">
                      <th className="p-3.5 rounded-l-xl">Test Date</th>
                      <th className="p-3.5">Cycle Type</th>
                      <th className="p-3.5">Sport</th>
                      <th className="p-3.5">Age Bracket</th>
                      <th className="p-3.5">Overall Rating</th>
                      <th className="p-3.5">Tier</th>
                      <th className="p-3.5 rounded-r-xl text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {athleteAssessments.map(rec => (
                      <tr key={rec.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3.5 font-bold text-slate-900">{rec.testDate}</td>
                        <td className="p-3.5 capitalize font-black text-indigo-700">
                          {rec.cycleType === 'baseline' ? '🏁 Baseline Test' : `📈 ${rec.cycleType}`}
                        </td>
                        <td className="p-3.5 capitalize">{rec.sportId}</td>
                        <td className="p-3.5 font-bold">{rec.ageBracket}</td>
                        <td className="p-3.5 font-black text-slate-900 text-sm">{rec.overallScore} / 100</td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 bg-slate-100 rounded-md text-[10px] font-black uppercase text-slate-800">
                            {rec.overallTier}
                          </span>
                        </td>
                        <td className="p-3.5 text-right">
                          <button
                            onClick={() => {
                              sportsCoachingService.deleteAssessment(rec.id);
                              // Trigger re-render by updating athletes reference
                              setAthletes([...sportsCoachingService.getAllAthletes()]);
                              toast.info('Assessment record deleted');
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-all"
                            title="Delete Record"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: PRINTABLE PLAYER DEVELOPMENTAL PASSPORT & REPORT CARD               */}
      {/* ========================================================================= */}
      {activeTab === 'passport' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between print:hidden">
            <div>
              <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">
                Official Player Developmental Passport
              </h3>
              <p className="text-xs text-slate-500">
                Print-ready comprehensive assessment card for parents, coaches, and school inspection.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={handlePrintPassport}
                className="px-4 py-2.5 bg-[#0D2B52] hover:bg-[#164077] text-white rounded-2xl font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-md cursor-pointer transition-all active:scale-95"
                title="Print or save as PDF"
              >
                <Printer size={15} className="text-[#D4A017]" />
                <span>Print / Download PDF</span>
              </button>

              <button
                onClick={handleExportAthleteExcel}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-md cursor-pointer transition-all active:scale-95"
                title="Export this student's individual Excel report card"
              >
                <FileSpreadsheet size={15} />
                <span>Export Student Excel</span>
              </button>

              <button
                onClick={handleExportManagementExcel}
                className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-[#D4A017] border-2 border-[#D4A017] rounded-2xl font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-md cursor-pointer transition-all active:scale-95"
                title="Export complete school management Excel report for all students in squad"
              >
                <FileSpreadsheet size={15} />
                <span>School Management Excel (Entire Squad)</span>
              </button>
            </div>
          </div>

          {latestAssessment ? (
            <div className="bg-white p-8 sm:p-10 rounded-[2.5rem] border-4 border-slate-900 shadow-2xl space-y-8 print:p-0 print:border-none print:shadow-none max-w-4xl mx-auto">
              {/* Header Certificate Style */}
              <div className="border-b-4 border-slate-900 pb-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
                <div>
                  <div className="text-[11px] font-black uppercase tracking-[0.2em] text-[#D4A017] flex items-center justify-center sm:justify-start gap-1.5 mb-1">
                    <Trophy size={14} />
                    <span>{coachProfile.programName}</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900 uppercase font-display tracking-tight">
                    Sports Skill &amp; Game IQ Passport
                  </h1>
                  <p className="text-xs text-slate-500 font-bold">
                    Official Assessment Standard &bull; {activeSport.name} ({activeSport.governingBody})
                  </p>
                </div>

                <div className="text-center sm:text-right bg-slate-50 p-3 rounded-2xl border-2 border-slate-900">
                  <div className="text-[10px] font-black uppercase text-slate-500">Assessment Tier</div>
                  <div className="text-xl font-black text-[#0D2B52] uppercase">{latestAssessment.overallTier}</div>
                  <div className="text-xs font-bold text-emerald-600">{latestAssessment.overallScore}/100 Pts</div>
                </div>
              </div>

              {/* Player Bio Card */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-2xl border-2 border-slate-900 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Athlete Name</span>
                  <div className="font-black text-slate-900 text-sm truncate">{currentAthlete?.name}</div>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Age Band</span>
                  <div className="font-black text-slate-900 text-sm">{athleteAgeBracket} ({currentAthlete?.age} Years)</div>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Batch / Squad</span>
                  <div className="font-black text-slate-900 text-sm truncate">{currentAthlete?.squadOrBatch}</div>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Evaluation Date</span>
                  <div className="font-black text-slate-900 text-sm">{latestAssessment.testDate}</div>
                </div>
              </div>

              {/* 4 Pillars Progress Meters */}
              <div className="space-y-4">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b pb-1">
                  Four-Pillar Performance Matrix
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  {[
                    { label: 'Technical Core', val: latestAssessment.pillarAverages.technical },
                    { label: 'Tactical Game Sense', val: latestAssessment.pillarAverages.tactical },
                    { label: 'Physical & Agility', val: latestAssessment.pillarAverages.physical },
                    { label: 'Coachability & Grit', val: latestAssessment.pillarAverages.mental }
                  ].map(p => (
                    <div key={p.label} className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="text-2xl font-black text-slate-900">{p.val}%</div>
                      <div className="text-[10px] font-bold text-slate-500 uppercase mt-1">{p.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Detailed Skill Breakdown Table */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b pb-1">
                  Individual Skill Scores vs Universal Norms
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border border-slate-200">
                    <thead className="bg-slate-100 text-[10px] font-black uppercase text-slate-700">
                      <tr>
                        <th className="p-2.5 border-b">Skill Name</th>
                        <th className="p-2.5 border-b">Category</th>
                        <th className="p-2.5 border-b">Score / Unit</th>
                        <th className="p-2.5 border-b">Proficient Target</th>
                        <th className="p-2.5 border-b">Tier Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {activeSport.skills.map(skill => {
                        const val = latestAssessment.scores[skill.id] || skill.defaultScore;
                        const tier = sportsCoachingService.calculateSkillTier(val, skill, athleteAgeBracket);
                        const norm = skill.ageNorms[athleteAgeBracket] || skill.ageNorms['U-14'];

                        return (
                          <tr key={skill.id}>
                            <td className="p-2.5 font-bold text-slate-900">{skill.name}</td>
                            <td className="p-2.5 capitalize text-slate-600">{skill.category}</td>
                            <td className="p-2.5 font-black text-indigo-700">{val} {skill.unit}</td>
                            <td className="p-2.5 text-slate-600">{norm.proficient} {skill.unit}</td>
                            <td className="p-2.5 font-bold">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                                tier === 'Elite' ? 'bg-purple-100 text-purple-900' :
                                tier === 'Advanced' ? 'bg-emerald-100 text-emerald-900' :
                                tier === 'Proficient' ? 'bg-blue-100 text-blue-900' :
                                'bg-amber-100 text-amber-900'
                              }`}>
                                {tier}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Coach's Developmental Prescription & Feedback */}
              <div className="p-5 bg-slate-50 rounded-2xl border-2 border-slate-900 space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-[#D4A017]" />
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">
                    Coach's Developmental Analysis &amp; Corrective Regimen
                  </h4>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed font-medium">
                  {latestAssessment.coachFeedback}
                </p>

                {latestAssessment.prescribedDrills.length > 0 && (
                  <div className="pt-2 space-y-2">
                    <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                      Prescribed Corrective Drills (Weekly Homework):
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {latestAssessment.prescribedDrills.map((drill, idx) => (
                        <div key={idx} className="p-3 bg-white rounded-xl border border-slate-200 text-[11px] space-y-1">
                          <div className="font-black text-[#0D2B52]">{drill.drillName}</div>
                          <div className="text-slate-500 font-medium">{drill.description}</div>
                          <div className="text-[10px] font-bold text-indigo-600">{drill.frequency}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Signatures & Seal */}
              <div className="pt-8 border-t-2 border-slate-300 flex flex-wrap items-center justify-between gap-6 text-xs">
                <div className="text-center">
                  <div className="w-40 border-b-2 border-slate-900 pb-1 mb-1 font-bold text-slate-900">{coachProfile.coachName}</div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Head Coach / Lead Trainer</span>
                </div>
                <div className="text-center">
                  <div className="w-40 border-b-2 border-slate-900 pb-1 mb-1 font-bold text-slate-900">Academy Director / PE Head</div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Institutional Verification</span>
                </div>
                <div className="text-center">
                  <div className="w-40 border-b-2 border-slate-900 pb-1 mb-1 font-bold text-slate-900">&nbsp;</div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Parent / Guardian Signature</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white p-12 text-center rounded-3xl border border-slate-200 space-y-3">
              <AlertCircle size={32} className="mx-auto text-amber-500" />
              <h4 className="text-base font-black text-slate-900">No Assessment Record Available</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Please complete a Baseline or Skill Assessment for this athlete to generate their official printable Passport.
              </p>
              <button
                onClick={() => setActiveTab('assess')}
                className="px-6 py-2.5 bg-[#0D2B52] text-white rounded-xl font-black text-xs uppercase cursor-pointer"
              >
                Conduct Test Now
              </button>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: SQUAD ROSTER & ATHLETE MANAGEMENT                                   */}
      {/* ========================================================================= */}
      {activeTab === 'roster' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">
                Squad &amp; Academy Athlete Roster ({athletes.length} Registered)
              </h3>
              <p className="text-xs text-slate-500">
                Manage players across school teams, after-school academy batches, and private coaching slots.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleExportManagementExcel}
                className="px-4 py-2 bg-[#0D2B52] hover:bg-[#164077] text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
                title="Export complete school management Excel report for all registered athletes"
              >
                <FileSpreadsheet size={14} className="text-[#D4A017]" />
                <span>Export Management Excel (Entire Squad)</span>
              </button>

              <button
                onClick={() => setIsAddAthleteOpen(true)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
              >
                <UserPlus size={14} />
                <span>+ Register New Athlete</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {athletes.map(athlete => {
              const assessments = sportsCoachingService.getAssessmentsForAthlete(athlete.id);
              const latest = assessments[assessments.length - 1];

              return (
                <div
                  key={athlete.id}
                  className={`p-5 rounded-2xl border transition-all space-y-3 cursor-pointer ${
                    selectedAthleteId === athlete.id
                      ? 'bg-indigo-50/80 border-indigo-500 ring-2 ring-indigo-400 shadow-sm'
                      : 'bg-slate-50/60 hover:bg-slate-100/80 border-slate-200'
                  }`}
                  onClick={() => setSelectedAthleteId(athlete.id)}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-black text-slate-900">{athlete.name}</h4>
                        {athlete.jerseyNo && (
                          <span className="px-1.5 py-0.2 bg-[#D4A017] text-slate-950 font-black text-[9px] rounded">
                            #{athlete.jerseyNo}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 font-medium">
                        {athlete.squadOrBatch} &bull; {athlete.age} yrs ({sportsCoachingService.getAgeBracketFromAge(athlete.age)})
                      </p>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteAthlete(athlete.id, athlete.name);
                      }}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded"
                      title="Remove Athlete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <div className="text-xs text-slate-600 flex items-center justify-between pt-2 border-t border-slate-200/70">
                    <span>Tests: <strong>{assessments.length}</strong></span>
                    {latest ? (
                      <span className="font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded text-[10px]">
                        Latest: {latest.overallScore}% ({latest.overallTier})
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[10px]">No test yet</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: UNIVERSAL TESTING PROTOCOLS GUIDE                                    */}
      {/* ========================================================================= */}
      {activeTab === 'protocols' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div>
            <h3 className="text-base font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
              <Compass size={18} className="text-indigo-600" />
              <span>Universal Scientific Skill Assessment Protocols: {activeSport.name}</span>
            </h3>
            <p className="text-xs text-slate-500">
              Official setup instructions, cone dimensions, and scoring procedures backed by {activeSport.governingBody}.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {activeSport.skills.map(skill => (
              <div key={skill.id} className="p-5 rounded-2xl border border-slate-200 bg-slate-50 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-black text-[#0D2B52]">{skill.name}</h4>
                  <span className="px-2 py-0.5 bg-slate-200 text-slate-700 text-[10px] font-black rounded uppercase">
                    {skill.category}
                  </span>
                </div>
                <p className="text-xs text-slate-600 font-medium leading-relaxed">
                  <strong>Protocol:</strong> {skill.protocol}
                </p>
                {skill.coneSetup && (
                  <div className="p-2.5 bg-white rounded-xl border border-slate-200 text-[11px] text-slate-700">
                    <strong>📍 Field/Cone Setup:</strong> {skill.coneSetup}
                  </div>
                )}
                <div className="text-[11px] text-slate-500 space-y-1">
                  <div><strong>Equipment:</strong> {skill.equipment.join(', ')}</div>
                  <div><strong>Scoring Unit:</strong> {skill.unit} ({skill.testType})</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD NEW ATHLETE                                                    */}
      {/* ========================================================================= */}
      {isAddAthleteOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[300] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border-2 border-slate-900 space-y-5 animate-slide-up">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-black text-slate-900 uppercase">Register New Athlete</h3>
              <button onClick={() => setIsAddAthleteOpen(false)} className="p-1 text-slate-400 hover:text-slate-900">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateAthlete} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Athlete Full Name *</label>
                <input
                  type="text"
                  required
                  value={newAthleteName}
                  onChange={e => setNewAthleteName(e.target.value)}
                  placeholder="e.g. Aryan Singh"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Age (Years) *</label>
                  <input
                    type="number"
                    min="5"
                    max="21"
                    required
                    value={newAthleteAge}
                    onChange={e => setNewAthleteAge(parseInt(e.target.value) || 12)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Gender *</label>
                  <select
                    value={newAthleteGender}
                    onChange={e => setNewAthleteGender(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold outline-none"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Squad / Batch / Class</label>
                  <input
                    type="text"
                    value={newAthleteSquad}
                    onChange={e => setNewAthleteSquad(e.target.value)}
                    placeholder="e.g. U-14 Elite / Class 8B"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Jersey / Roll No.</label>
                  <input
                    type="text"
                    value={newAthleteJersey}
                    onChange={e => setNewAthleteJersey(e.target.value)}
                    placeholder="e.g. 10"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Guardian Name</label>
                  <input
                    type="text"
                    value={newAthleteGuardian}
                    onChange={e => setNewAthleteGuardian(e.target.value)}
                    placeholder="e.g. Parent Name"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Guardian Contact</label>
                  <input
                    type="text"
                    value={newAthleteContact}
                    onChange={e => setNewAthleteContact(e.target.value)}
                    placeholder="e.g. +91 98765..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddAthleteOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-600 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0D2B52] text-white rounded-xl font-black uppercase tracking-wider"
                >
                  Save &amp; Start Testing
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EDIT COACH & PROGRAM PROFILE                                       */}
      {/* ========================================================================= */}
      {isEditingCoach && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[300] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border-2 border-slate-900 space-y-5 animate-slide-up">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-black text-slate-900 uppercase">Coach &amp; Program Profile</h3>
              <button onClick={() => setIsEditingCoach(false)} className="p-1 text-slate-400 hover:text-slate-900">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCoachProfile} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Program Type</label>
                <select
                  value={coachForm.programType}
                  onChange={e => setCoachForm({ ...coachForm, programType: e.target.value as CoachProgramType })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold outline-none"
                >
                  <option value="school_team">🏫 School PE / Varsity Team</option>
                  <option value="after_school_academy">⚡ After-School Activity / ECA Academy</option>
                  <option value="sports_club">🏆 Sports Club / Private Academy</option>
                  <option value="individual_coach">👤 Individual 1-on-1 Personal Trainer</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">School / Academy / Club Name *</label>
                <input
                  type="text"
                  required
                  value={coachForm.programName}
                  onChange={e => setCoachForm({ ...coachForm, programName: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Coach / Lead Trainer Name *</label>
                <input
                  type="text"
                  required
                  value={coachForm.coachName}
                  onChange={e => setCoachForm({ ...coachForm, coachName: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Location / City</label>
                <input
                  type="text"
                  value={coachForm.city}
                  onChange={e => setCoachForm({ ...coachForm, city: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold outline-none"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditingCoach(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-600 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0D2B52] text-white rounded-xl font-black uppercase tracking-wider"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ACADEMIC COACHING REGISTRATION & GROUP INVITE                      */}
      {/* ========================================================================= */}
      {isAcademicModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[300] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border-2 border-slate-900 space-y-5 animate-slide-up">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-[#D4A017] bg-slate-900 px-2 py-0.5 rounded">
                  Cloud Synchronization
                </span>
                <h3 className="text-base font-black text-slate-900 uppercase mt-1">
                  Academic Coaching Program &amp; Pass
                </h3>
              </div>
              <button 
                onClick={() => setIsAcademicModalOpen(false)} 
                className="p-1 text-slate-400 hover:text-slate-900 rounded-lg"
              >
                ✕
              </button>
            </div>

            {/* Tab switch between Register and Join */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl">
              <button
                type="button"
                onClick={() => setAcademicModalTab('register')}
                className={`py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all ${
                  academicModalTab === 'register'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                1. New Academy (Solo / Lead)
              </button>
              <button
                type="button"
                onClick={() => setAcademicModalTab('join')}
                className={`py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all ${
                  academicModalTab === 'join'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                2. Join Group (Invite Code)
              </button>
            </div>

            {/* TAB 1: REGISTER NEW ACADEMIC PROGRAM */}
            {academicModalTab === 'register' && (
              <form onSubmit={handleRegisterProgram} className="space-y-4 text-xs">
                <div className="p-3 bg-indigo-50/80 rounded-2xl border border-indigo-200 text-indigo-900 space-y-1">
                  <div className="font-black flex items-center gap-1.5">
                    <Sparkles size={14} className="text-indigo-600" />
                    <span>Instant 5-Day All-Access Academic Pass</span>
                  </div>
                  <p className="text-[11px] text-indigo-800 leading-relaxed font-medium">
                    Creates a dedicated cloud database for student testing and progress tracking. Automatically generates a 6-character Invite Code so 1–2 colleague teachers or assistant coaches can join and share student access.
                  </p>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Academic Program / Academy Name *</label>
                  <input
                    type="text"
                    required
                    value={regProgramName}
                    onChange={e => setRegProgramName(e.target.value)}
                    placeholder="e.g. Apex Football Academy / St. Mary's Sports Coaching"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Program Type</label>
                    <select
                      value={regProgramType}
                      onChange={e => setRegProgramType(e.target.value as CoachProgramType)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold outline-none"
                    >
                      <option value="school_team">🏫 School PE / Varsity Team</option>
                      <option value="after_school_academy">⚡ After-School Sports Academy</option>
                      <option value="sports_club">🏆 Sports Club / Private Academy</option>
                      <option value="individual_coach">👤 Individual Coach / Trainer</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Primary Sport</label>
                    <select
                      value={regSport}
                      onChange={e => {
                        setRegSport(e.target.value);
                        setSelectedSportId(e.target.value);
                      }}
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold outline-none capitalize"
                    >
                      {Object.values(SPORTS_REGISTRY).map(sport => (
                        <option key={sport.id} value={sport.id}>{sport.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Lead Coach / Teacher Name *</label>
                  <input
                    type="text"
                    required
                    value={regCoachName}
                    onChange={e => setRegCoachName(e.target.value)}
                    placeholder="e.g. Coach David Miller"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold outline-none"
                  />
                </div>

                <div className="pt-3 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAcademicModalOpen(false)}
                    className="px-4 py-2 border border-slate-300 rounded-xl text-slate-600 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-[#0D2B52] hover:bg-slate-900 text-white rounded-xl font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md"
                  >
                    <Cloud size={14} />
                    <span>Activate 5-Day Academic Cloud Pass</span>
                  </button>
                </div>
              </form>
            )}

            {/* TAB 2: JOIN AN EXISTING COACHING GROUP */}
            {academicModalTab === 'join' && (
              <form onSubmit={handleJoinProgram} className="space-y-4 text-xs">
                <div className="p-3 bg-amber-50/80 rounded-2xl border border-amber-200 text-amber-950 space-y-1">
                  <div className="font-black flex items-center gap-1.5 text-amber-900">
                    <Users size={14} />
                    <span>Join Colleague Teacher / Coach Cohort</span>
                  </div>
                  <p className="text-[11px] text-amber-900/90 leading-relaxed font-medium">
                    Working together with another PE teacher or coach? Enter their 6-character Invite Code to instantly access their students, enter test results, and track skill progress together.
                  </p>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">6-Character Invite Code *</label>
                  <input
                    type="text"
                    required
                    value={joinInviteCode}
                    onChange={e => setJoinInviteCode(e.target.value.toUpperCase())}
                    placeholder="e.g. CP-8924"
                    maxLength={10}
                    className="w-full p-3 bg-slate-50 border-2 border-indigo-300 focus:border-indigo-600 rounded-xl font-mono text-base font-black tracking-widest uppercase outline-none text-slate-900"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Ask the lead coach for their program invite code found in their Coaching Hub banner.
                  </span>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Your Coach / Teacher Name *</label>
                  <input
                    type="text"
                    required
                    value={joinCoachName}
                    onChange={e => setJoinCoachName(e.target.value)}
                    placeholder="e.g. Coach Anjali Sharma"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold outline-none"
                  />
                </div>

                <div className="pt-3 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAcademicModalOpen(false)}
                    className="px-4 py-2 border border-slate-300 rounded-xl text-slate-600 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md"
                  >
                    <UserCheck size={14} />
                    <span>Join Cohort &amp; Load Students</span>
                  </button>
                </div>
              </form>
            )}

            <div className="pt-2 border-t border-slate-100 text-center">
              <span className="text-[10px] text-slate-400">
                🔒 Independent Academic Coaching standard &bull; Fully compliant with universal sports LTAD guidelines
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SportsCoachingAssessment;
