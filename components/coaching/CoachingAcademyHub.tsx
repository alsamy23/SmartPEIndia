import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  Users, 
  Layers, 
  BookOpen, 
  ClipboardCheck, 
  Target, 
  TrendingUp, 
  FileText, 
  Printer, 
  Sparkles, 
  ArrowLeft,
  Activity,
  Calendar,
  Zap,
  School,
  Database
} from 'lucide-react';
import { CoachingDashboard } from './CoachingDashboard';
import { PlayerDirectory } from './PlayerDirectory';
import { BatchManagement } from './BatchManagement';
import { SportTemplates } from './SportTemplates';
import { AssessmentEntry } from './AssessmentEntry';
import { TrainingGoalsView } from './TrainingGoalsView';
import { SkillProgressView } from './SkillProgressView';
import { CoachingReportsView } from './CoachingReportsView';
import { ParentReportModal } from './ParentReportModal';
import { AcademyDatabaseModal } from './AcademyDatabaseModal';
import { 
  academyService, 
  PlayerProfileData, 
  PlayerAssessmentRecord,
  createPlayerFromAssessment 
} from '../../services/academyService';
import { 
  academicCoachingCloudService, 
  AcademicCoachingProgram 
} from '../../services/academicCoachingCloudService';

interface CoachingAcademyHubProps {
  onSwitchToSchoolPe?: () => void;
  initialReportId?: string;
}

export type CoachingSubTab = 
  | 'dashboard' 
  | 'players' 
  | 'teams-batches' 
  | 'sports' 
  | 'assessments' 
  | 'training-plans' 
  | 'skill-progress' 
  | 'reports';

export const CoachingAcademyHub: React.FC<CoachingAcademyHubProps> = ({
  onSwitchToSchoolPe,
  initialReportId
}) => {
  const [activeTab, setActiveTab] = useState<CoachingSubTab>('dashboard');
  const [targetPlayerIdForAssessment, setTargetPlayerIdForAssessment] = useState<string | undefined>(undefined);
  const [isDatabaseModalOpen, setIsDatabaseModalOpen] = useState(false);
  const [activeProgram, setActiveProgram] = useState<AcademicCoachingProgram | null>(() => 
    academicCoachingCloudService.getLocalProgram()
  );

  useEffect(() => {
    setActiveProgram(academicCoachingCloudService.getLocalProgram());
  }, [isDatabaseModalOpen]);

  // Active Parent Report Modal state
  const [reportData, setReportData] = useState<{
    player: PlayerProfileData;
    assessment: PlayerAssessmentRecord;
  } | null>(null);

  // Link-Sharing & URL Hash Resolver: automatically opens shared merit reports
  useEffect(() => {
    const resolveReport = async (reportId: string) => {
      // 1. Check local academyService
      let assess = academyService.getAssessmentById(reportId);
      
      // 2. If not in memory/local storage, check cloud service
      if (!assess) {
        const cloudData = await academicCoachingCloudService.fetchSingleCloudAssessment(reportId);
        if (cloudData) {
          assess = cloudData as PlayerAssessmentRecord;
        }
      }

      if (assess) {
        let p = academyService.getPlayerById(assess.playerId);
        if (!p) {
          p = createPlayerFromAssessment(assess);
        }
        setReportData({ player: p, assessment: assess });
      }
    };

    if (initialReportId) {
      resolveReport(initialReportId);
      return;
    }

    const checkHash = () => {
      const hash = window.location.hash;
      const search = new URLSearchParams(window.location.search);
      const repId = search.get('reportId') ||
                    search.get('meritReportId') ||
                    (hash.startsWith('#merit-report-') ? hash.replace('#merit-report-', '') : null) ||
                    (hash.startsWith('#report-') ? hash.replace('#report-', '') : null);
      if (repId) {
        resolveReport(repId);
      }
    };

    checkHash();
    window.addEventListener('hashchange', checkHash);
    return () => window.removeEventListener('hashchange', checkHash);
  }, [initialReportId]);

  const handleStartAssessment = (playerId?: string) => {
    setTargetPlayerIdForAssessment(playerId);
    setActiveTab('assessments');
  };

  const handleOpenReport = (player: PlayerProfileData, assessment: PlayerAssessmentRecord) => {
    setReportData({ player, assessment });
  };

  return (
    <div className="min-h-screen bg-slate-100/60 pb-16">
      
      {/* Top Distinct Mode Header Banner */}
      <div className="bg-slate-900 text-white border-b-2 border-slate-900 sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          
          {/* Logo & Mode indicator */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shadow-md">
              <Trophy size={20} />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-black uppercase tracking-wider text-amber-400">
                  SmartPE India
                </span>
                <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded text-[10px] font-black uppercase border border-amber-500/30">
                  Coaching & Academy
                </span>
              </div>
              <h2 className="text-sm font-black text-white">
                Coaching & Academy Workspace
              </h2>
            </div>
          </div>

          {/* Right Header Actions: Academy Settings & Switch back to School PE */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsDatabaseModalOpen(true)}
              className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider transition shadow-sm flex items-center space-x-2 active:scale-95"
            >
              <Database size={15} />
              <span className="hidden sm:inline font-black">
                {activeProgram?.programName ? activeProgram.programName : 'Academy Settings'}
              </span>
              <span className="sm:hidden font-black">Settings</span>
              <span className="w-2 h-2 rounded-full bg-emerald-950 animate-pulse ml-0.5" title="Firebase Isolated Cloud Sync" />
            </button>

            {onSwitchToSchoolPe && (
              <button
                onClick={onSwitchToSchoolPe}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition flex items-center space-x-2"
              >
                <School size={15} className="text-blue-400" />
                <span className="hidden sm:inline">Switch to</span>
                <span className="font-black text-white">School PE</span>
              </button>
            )}
          </div>
        </div>

        {/* Standardized Primary Navigation Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center space-x-1 overflow-x-auto py-1 border-t border-slate-800 scrollbar-none">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: Activity },
            { id: 'players', label: 'Players', icon: Users },
            { id: 'teams-batches', label: 'Teams & Batches', icon: Layers },
            { id: 'sports', label: 'Sports', icon: BookOpen },
            { id: 'assessments', label: 'Assessments', icon: ClipboardCheck },
            { id: 'skill-progress', label: 'Player Development', icon: TrendingUp },
            { id: 'reports', label: 'Reports', icon: FileText },
            { id: 'training-plans', label: 'Training Goals', icon: Target }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as CoachingSubTab)}
                className={`py-2 px-3.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center space-x-2 transition whitespace-nowrap ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon size={15} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Tab Content View Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        
        {activeTab === 'dashboard' && (
          <CoachingDashboard
            onNavigateTab={tab => setActiveTab(tab as CoachingSubTab)}
            onNewAssessment={handleStartAssessment}
            onNewPlayer={() => setActiveTab('players')}
            onViewReport={handleOpenReport}
          />
        )}

        {activeTab === 'players' && (
          <PlayerDirectory
            onNewAssessment={handleStartAssessment}
            onViewReport={handleOpenReport}
          />
        )}

        {activeTab === 'teams-batches' && (
          <BatchManagement
            onNewAssessment={handleStartAssessment}
            onNavigateTab={tab => setActiveTab(tab as CoachingSubTab)}
          />
        )}

        {activeTab === 'sports' && (
          <SportTemplates />
        )}

        {activeTab === 'assessments' && (
          <AssessmentEntry
            initialPlayerId={targetPlayerIdForAssessment}
            onSaved={record => {
              const p = academyService.getPlayers().find(player => player.id === record.playerId);
              if (p) {
                handleOpenReport(p, record);
              }
              setActiveTab('reports');
            }}
            onCancel={() => setActiveTab('dashboard')}
            onViewReport={handleOpenReport}
          />
        )}

        {activeTab === 'training-plans' && (
          <TrainingGoalsView />
        )}

        {activeTab === 'skill-progress' && (
          <SkillProgressView />
        )}

        {activeTab === 'reports' && (
          <CoachingReportsView
            onViewReport={handleOpenReport}
            onNewAssessment={handleStartAssessment}
          />
        )}

      </div>

      {/* Parent Report Modal (Universal Print / Share) */}
      {reportData && (
        <ParentReportModal
          player={reportData.player}
          assessment={reportData.assessment}
          onClose={() => setReportData(null)}
        />
      )}

      {/* Academy Database & Colleague Management Modal */}
      <AcademyDatabaseModal
        isOpen={isDatabaseModalOpen}
        onClose={() => setIsDatabaseModalOpen(false)}
        onDatabaseUpdated={() => {
          setActiveProgram(academicCoachingCloudService.getLocalProgram());
        }}
      />

    </div>
  );
};
