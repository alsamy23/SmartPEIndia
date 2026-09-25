
import React, { useState, useEffect, useCallback, useMemo, useTransition } from 'react';
import { HelmetProvider } from 'react-helmet-async';
import { SEOHead } from './components/SEOHead.tsx';
import { OfflineBanner } from './components/OfflineBanner.tsx';
import { 
  Users, 
  BookOpen, 
  Sparkles, 
  LayoutDashboard, 
  Menu, 
  X, 
  Dumbbell, 
  Target, 
  ShieldCheck, 
  TrendingUp, 
  Wrench, 
  Wifi, 
  AlertTriangle, 
  CalendarRange, 
  RotateCcw, 
  Loader2, 
  GraduationCap, 
  Trophy, 
  Microscope, 
  Book, 
  Activity, 
  AlertCircle, 
  ClipboardList, 
  ClipboardCheck, 
  FileText, 
  UserCheck, 
  Mail, 
  Zap, 
  Shield, 
  Video, 
  Terminal,
  School
} from 'lucide-react';
import Dashboard from './components/Dashboard.tsx';
import AIPlanner from './components/AIPlanner.tsx';
import YearlyPlanner from './components/YearlyPlanner.tsx';
import SkillMastery from './components/SkillMastery.tsx';
import ComplianceAdvisor from './components/ComplianceAdvisor.tsx';
import AIToolCenter from './components/AIToolCenter.tsx';
import TheoryHub from './components/TheoryHub.tsx';
import About from './components/About.tsx';
import Contact from './components/Contact.tsx';
import KheloIndia from './components/KheloIndia.tsx';
import RulesBot from './components/RulesBot.tsx';
import FitnessTests from './components/FitnessTests.tsx';
import FitnessDashboard from './components/FitnessDashboard.tsx';
import StudentManagement from './components/StudentManagement.tsx';
import TeamManagement from './components/TeamManagement.tsx';
import TestPaperGenerator from './components/TestPaperGenerator.tsx';
import TournamentMaker from './components/TournamentMaker.tsx';
import ParentLetters from './components/ParentLetters.tsx';
import ClassroomWidgets from './components/ClassroomWidgets.tsx';
import Disclaimer from './components/Disclaimer.tsx';
import Logo from './components/Logo.tsx';
import ErrorBoundary from './components/ErrorBoundary.tsx';
import Auth from './components/Auth.tsx';
import FitnessManagementIntro from './components/FitnessManagementIntro.tsx';
import SchoolAdmin from './components/SchoolAdmin.tsx';
import FitnessReports from './components/FitnessReports.tsx';
import SkillAnalysis from './components/SkillAnalysis.tsx';
import AdminLogs from './components/AdminLogs.tsx';
import DepartmentWorkloadPlanner from './components/DepartmentWorkloadPlanner.tsx';
import AcademicWeeklyPlanner from './components/AcademicWeeklyPlanner.tsx';
import PrincipalDashboard from './components/PrincipalDashboard.tsx';
import DepartmentOffice from './components/DepartmentOffice.tsx';
import BrandWelcomeHub from './components/BrandWelcomeHub.tsx';
import PricingAndPlans from './components/PricingAndPlans.tsx';
import WelcomeOnboardingModal from './components/WelcomeOnboardingModal.tsx';
import PracticalAssessmentHub from './components/PracticalAssessmentHub.tsx';
import { CoachingAcademyHub } from './components/coaching/CoachingAcademyHub.tsx';
import { GlobalSearch } from './components/GlobalSearch.tsx';
import { VoiceAgentModal } from './components/VoiceAgentModal.tsx';
import { SpotlightBanner, SpotlightData } from './components/SpotlightBanner.tsx';
import { FloatingVoiceAgentButton } from './components/FloatingVoiceAgentButton.tsx';
import { logError } from './services/logService.ts';
import { fitnessService } from './services/fitnessService.ts';
import { auth } from './services/firebase.ts';
import { onAuthStateChanged, User as FirebaseUser, signOut } from 'firebase/auth';
import { trackEvent } from './services/analytics.ts';
import { toast, SHOW_TOAST_EVENT, SHOW_CONFIRM_EVENT, ToastConfig, ConfirmConfig } from './services/toast.ts';

type Tab = 'dashboard' | 'planner' | 'yearly' | 'weekly-planner' | 'skillmastery' | 'workload-planner' | 'compliance' | 'tools' | 'theory' | 'khelo' | 'rules' | 'fitness' | 'cbse-practical' | 'coaching-assessment' | 'coaching-academy' | 'testpaper' | 'tournament-fixtures' | 'parentletters' | 'widgets' | 'school-results' | 'school-students' | 'school-teams' | 'school-overview' | 'school-admin' | 'skill-analysis' | 'logs' | 'fitness-reports' | 'about' | 'contact' | 'principal-dashboard' | 'department-office' | 'brand-welcome' | 'subscription-plans';

import { BoardType, Language } from './types.ts';

// Static Navigation Catalog (Moved outside to ensure stable memory reference)
const navigation = [
  { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },

  { 
    section: 'Coaching & Academy',
    items: [
      { id: 'coaching-academy', name: 'Coaching & Academy', icon: Trophy, isNew: true, subtitle: 'Individual player development, sports library, assessments & parent reports.' },
    ]
  },
  
  { 
    section: 'Plan',
    items: [
      { id: 'planner', name: 'PE Lesson Plan', icon: Sparkles, subtitle: 'Generate today\'s PE lesson in under 60 seconds.' },
      { id: 'yearly', name: 'Yearly Planner', icon: CalendarRange, subtitle: 'Auto-map 40 weeks of PE for your classes.' },
      { id: 'weekly-planner', name: 'Weekly Academic Planner', icon: CalendarRange, subtitle: '1-click lesson & homework splitter for classes.' },
      { id: 'workload-planner', name: 'Workload & Timetable', icon: CalendarRange, subtitle: 'Schedules, curriculum slots, and lessons suggester.' },
      { id: 'skillmastery', name: 'Skill Progressions', icon: Target, subtitle: 'Long-term curriculum maps and checklists.' },
      { id: 'theory', name: 'Theory Master (CBSE)', icon: GraduationCap, subtitle: 'Resources matched to CBSE guidelines.' },
    ]
  },

  { 
    section: 'Assess',
    items: [
      { id: 'cbse-practical', name: 'CBSE Practical (30M)', icon: ClipboardCheck, subtitle: 'Class 11 & 12 30-mark practical scoring & award sheet.' },
      { id: 'fitness', name: 'Student Fitness Assessment', icon: Activity, subtitle: 'All Khelo India & standard fitness tests pre-loaded.' },
      { id: 'khelo', name: 'Khelo India Battery', icon: Trophy, subtitle: 'Official battery tests and student profiles.' },
      { id: 'tournament-fixtures', name: 'Tournament Fixtures', icon: Trophy, subtitle: 'Generate Knockout Brackets & Round Robin League schedules.' },
      { id: 'testpaper', name: 'Question Paper Generator', icon: ClipboardList, subtitle: 'Create MCQ and theory papers for PE.' },
      { id: 'skill-analysis', name: 'Skill Analysis Lab', icon: Video, subtitle: 'Compare and analyze sports techniques.' },
      { id: 'rules', name: 'Game Rules Bot', icon: Book, subtitle: 'Ask AI about sports rules and doubts.' },
    ]
  },

  { 
    section: 'Record',
    items: [
      { id: 'principal-dashboard', name: 'Principal Dashboard', icon: ShieldCheck, subtitle: 'Deliver inspection-ready reports to decision makers.' },
      { id: 'school-students', name: 'Student Directory', icon: Users, protected: true },
      { id: 'school-overview', name: 'School Fitness Database', icon: Zap, subtitle: 'Store and track every student\'s scores.' },
      { id: 'school-results', name: 'Live Results', icon: Activity, protected: true },
      { id: 'fitness-reports', name: 'Fitness Reports', icon: FileText, protected: true, subtitle: 'Generate progress and performance reports.' },
    ]
  },

  { 
    section: 'Communicate & Admin',
    items: [
      { id: 'department-office', name: 'PE Department Office', icon: ClipboardList, subtitle: 'Substitute plans, equipment logs, and house points.' },
      { id: 'parentletters', name: 'Parent Letters', icon: Mail, subtitle: 'Draft ready-to-print letters for parents.' },
      { id: 'school-teams', name: 'Teams/Classes', icon: UserCheck, protected: true },
      { id: 'widgets', name: 'PE Classroom Widgets', icon: Zap, subtitle: 'Interactive timers and tools.' },
      { id: 'compliance', name: 'State Compliance', icon: ShieldCheck, subtitle: 'CBSE and NEP 2020 alignment.' },
      { id: 'tools', name: 'AI Tool Center', icon: Wrench, subtitle: 'AI tools that save you time daily.' },
      { id: 'school-admin', name: 'School Settings', icon: Shield, protected: true },
      { id: 'logs', name: 'System Logs', icon: Terminal, protected: true, subtitle: 'Monitor real-time error reports.' },
    ]
  },

  { 
    section: 'Corporate Info',
    items: [
      { id: 'brand-welcome', name: 'Brand & Welcome Hub', icon: Sparkles, subtitle: 'Welcome guide, promo video, & welcome email generator.' },
      { id: 'subscription-plans', name: 'Plans & Free Pass', icon: Zap, subtitle: 'View 1-Year Free Pass & affordable school plans.' },
      { id: 'about', name: 'About smartpeindia', icon: GraduationCap, subtitle: 'Meet the founder L. Samy and the mission.' },
      { id: 'contact', name: 'Contact & Support', icon: Mail, subtitle: 'Get help, report a bug, or collaborate directly.' },
    ]
  }
];

// Static permission selector
const isProtectedTab = (tabId: string) => {
  for (const item of navigation) {
    if ('section' in item && item.items) {
      if (item.items.some((i: any) => i.id === tabId && i.protected)) return true;
    } else if ('id' in item && (item as any).id === tabId && (item as any).protected) {
      return true;
    }
  }
  return false;
};

// Memoized Mobile Header Component
interface MobileHeaderProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  schoolName?: string | null;
  schoolLogo?: string | null;
  onOpenVoiceAgent?: () => void;
}
const MobileHeader: React.FC<MobileHeaderProps> = React.memo(({ isSidebarOpen, setIsSidebarOpen, schoolName, schoolLogo, onOpenVoiceAgent }) => {
  return (
    <header className="md:hidden sticky top-0 bg-white backdrop-blur-xl text-slate-900 px-4 py-3 flex items-center justify-between z-30 border-b border-slate-200 shadow-sm print:hidden">
      <div className="flex-grow-0 flex-shrink-0">
        <Logo variant="color" size="md" customLogoUrl={schoolLogo} customSchoolName={schoolName} />
      </div>
      <div className="flex items-center gap-2 ml-auto">
        {onOpenVoiceAgent && (
          <button
            type="button"
            onClick={onOpenVoiceAgent}
            className="p-2 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-2xl active:scale-90 transition-all flex items-center justify-center gap-1 text-xs font-black"
            aria-label="Open Voice AI Assistant"
            title="Voice Assistant"
          >
            <Sparkles size={16} className="text-amber-500 animate-pulse" />
            <span className="text-[10px]">Voice AI</span>
          </button>
        )}
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
          className="p-2.5 bg-slate-100 border border-slate-200 rounded-2xl active:scale-90 transition-all flex items-center justify-center hover:bg-slate-200 text-slate-700"
          aria-label="Toggle Navigation Menu"
        >
          {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>
    </header>
  );
});

// Memoized Sidebar Component to isolate re-render triggers during tab transition
interface SidebarProps {
  activeTab: Tab;
  handleTabChange: (tabId: Tab) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  apiStatus: 'checking' | 'ok' | 'missing' | 'quota';
  handleSelectKey: () => void;
  user: FirebaseUser | null;
  handleLogout: () => void;
  setIsAuthView: (view: boolean) => void;
  schoolName?: string | null;
  schoolLogo?: string | null;
  activeWorkspace: 'school' | 'academy';
  setActiveWorkspace: (ws: 'school' | 'academy') => void;
}
const Sidebar: React.FC<SidebarProps> = React.memo(({
  activeTab,
  handleTabChange,
  isSidebarOpen,
  setIsSidebarOpen,
  apiStatus,
  handleSelectKey,
  user,
  handleLogout,
  setIsAuthView,
  schoolName,
  schoolLogo,
  activeWorkspace,
  setActiveWorkspace
}) => {
  return (
    <aside className={`
      fixed inset-y-0 left-0 z-50 w-80 bg-slate-950 text-white transform transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1) md:relative md:translate-x-0
      ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      border-r border-white/5
      print:hidden
    `}>
      {/* Sidebar Header with Logo and Close Button (Mobile Only) */}
      <div className="p-6 md:p-10 flex items-center border-b border-white/5 md:border-b-0">
        <div className="flex-grow-0 flex-shrink-0">
          <Logo variant="light" className="scale-95 origin-left" customLogoUrl={schoolLogo} customSchoolName={schoolName} />
        </div>
        <button 
          onClick={() => setIsSidebarOpen(false)}
          className="md:hidden ml-auto flex-shrink-0 p-2.5 bg-white/5 border border-white/10 rounded-2xl active:scale-90 transition-all flex items-center justify-center hover:bg-white/10 text-slate-400 hover:text-white"
          aria-label="Close Navigation Menu"
        >
          <X size={18} />
        </button>
      </div>

      {/* Workspace Switcher Selector */}
      <div className="mx-6 mb-4 p-1.5 bg-slate-900 border border-white/10 rounded-2xl shadow-inner">
        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-2 py-1 mb-1 flex items-center justify-between">
          <span>Active Workspace</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={() => {
              setActiveWorkspace('school');
              localStorage.setItem('smartpe_active_workspace', 'school');
              handleTabChange('dashboard');
            }}
            className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl font-black text-[11px] uppercase tracking-wider transition-all ${
              activeWorkspace === 'school'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30 ring-1 ring-white/20'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <School size={14} />
            <span>School PE</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveWorkspace('academy');
              localStorage.setItem('smartpe_active_workspace', 'academy');
              handleTabChange('coaching-academy');
            }}
            className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl font-black text-[11px] uppercase tracking-wider transition-all ${
              activeWorkspace === 'academy'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-900/30 ring-1 ring-white/20'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Trophy size={14} />
            <span>Coaching & Academy</span>
          </button>
        </div>
      </div>

      {/* API Status Badge - Interactive */}
      <div className="mx-6 mb-4">
        <button 
          onClick={handleSelectKey}
          className="w-full bg-slate-800/80 border border-slate-700/80 rounded-2xl p-3 flex items-center justify-between hover:bg-slate-800 transition-all group"
        >
          <div className="flex items-center space-x-3">
            <div className={`w-2 h-2 rounded-full ${
              apiStatus === 'ok' 
                ? 'bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.6)]' 
                : 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]'
            }`}></div>
            <div className="flex flex-col items-start">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-200">
                {apiStatus === 'ok' ? 'AI Connected' : 'AI Engine Ready'}
              </span>
            </div>
          </div>
          <Wifi size={12} className="text-slate-400 group-hover:text-white transition-colors" />
        </button>
      </div>

      <nav className="mt-2 px-4 space-y-1.5 overflow-y-auto max-h-[calc(100vh-420px)] custom-scrollbar">
        {navigation.map((item, idx) => {
          if ('section' in item && item.items) {
            return (
              <div key={`section-${idx}`} className="py-3">
                <p className="px-6 mb-2 text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">{item.section}</p>
                <div className="space-y-1">
                  {item.items.map((subItem) => (
                    <button
                      key={subItem.id}
                      onClick={() => handleTabChange(subItem.id as Tab)}
                      className={`
                        w-full flex items-center justify-start text-left space-x-4 px-6 py-3.5 rounded-2xl transition-all duration-300 relative group
                        ${activeTab === subItem.id 
                          ? 'bg-white text-on-surface shadow-2xl shadow-white/5 scale-[1.02] font-black font-sans' 
                          : 'text-slate-500 hover:bg-white/5 hover:text-white font-bold font-sans'}
                      `}
                    >
                      <subItem.icon size={20} className={`flex-shrink-0 ${activeTab === subItem.id ? 'text-primary' : 'text-slate-600 group-hover:text-white'}`} />
                      <span className="text-sm tracking-wide uppercase font-display text-left flex-1 leading-snug">{subItem.name}</span>
                      {(subItem as any).isNew && activeTab !== subItem.id && (
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 w-2 h-2 bg-secondary rounded-full animate-pulse"></span>
                      )}
                      {activeTab === subItem.id && <div className="ml-auto w-1.5 h-1.5 bg-primary rounded-full"></div>}
                    </button>
                  ))}
                </div>
              </div>
            );
          }
          if ('id' in item) {
            return (
              <button
                key={item.id}
                onClick={() => handleTabChange(item.id as Tab)}
                className={`
                  w-full flex items-center justify-start text-left space-x-4 px-6 py-3.5 rounded-2xl transition-all duration-300 relative group
                  ${activeTab === item.id 
                    ? 'bg-white text-on-surface shadow-2xl shadow-white/5 scale-[1.02] font-black' 
                    : 'text-slate-500 hover:bg-white/5 hover:text-white font-bold'}
                `}
              >
                <item.icon size={20} className={`flex-shrink-0 ${activeTab === item.id ? 'text-primary' : 'text-slate-600 group-hover:text-white'}`} />
                <span className="text-sm tracking-wide uppercase font-display text-left flex-1 leading-snug">{item.name}</span>
                {(item as any).isNew && activeTab !== item.id && (
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 w-2 h-2 bg-secondary rounded-full animate-pulse"></span>
                )}
                {activeTab === item.id && <div className="ml-auto w-1.5 h-1.5 bg-primary rounded-full"></div>}
              </button>
            );
          }
          return null;
        })}
      </nav>

      {/* Profile Footer */}
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-slate-950 border-t border-white/5">
        {user ? (
          <div className="w-full bg-white/5 rounded-[2rem] p-4 flex items-center space-x-4">
            <div className="relative">
              <div className="w-12 h-12 bg-primary rounded-2xl border-2 border-primary/30 flex items-center justify-center text-white font-black text-lg font-display">
                {user.displayName?.charAt(0) || user.email?.charAt(0)}
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-secondary border-2 border-slate-950 rounded-full"></div>
            </div>
            <div className="overflow-hidden text-left flex-1">
              <p className="text-sm font-black truncate leading-none mb-1 text-white font-display uppercase">{user.displayName || 'Teacher'}</p>
              <p className="text-[10px] text-slate-500 font-bold uppercase truncate tracking-widest">{user.email}</p>
            </div>
            <button 
              onClick={() => {
                handleLogout();
                setIsSidebarOpen(false);
              }}
              className="p-2 hover:bg-white/10 rounded-xl text-slate-500 hover:text-white transition-colors flex items-center justify-center border border-white/10 hover:border-white/30"
              title="Logout"
              style={{ width: '36px', height: '36px' }}
            >
              <RotateCcw size={16} />
            </button>
          </div>
        ) : (
          <button 
            onClick={() => {
              setIsAuthView(true);
              setIsSidebarOpen(false);
            }}
            className="w-full py-4 bg-primary text-white border-2 border-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-primary-container transition-all shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] flex items-center justify-center gap-2"
          >
            <Users size={16} />
            <span>Teacher Login</span>
          </button>
        )}
      </div>
    </aside>
  );
});

// Memoized Sticky Header Component to encapsulate Logo and GlobalSearch
interface StickyHeaderProps {
  activeTab: Tab;
  handleTabChange: (tabId: Tab) => void;
  setHighlightStudentId: (id: string | null) => void;
  schoolName?: string | null;
  schoolLogo?: string | null;
  activeWorkspace: 'school' | 'academy';
  setActiveWorkspace: (ws: 'school' | 'academy') => void;
  onOpenVoiceAgent?: () => void;
}
const StickyHeader: React.FC<StickyHeaderProps> = React.memo(({
  activeTab,
  handleTabChange,
  setHighlightStudentId,
  schoolName,
  schoolLogo,
  activeWorkspace,
  setActiveWorkspace,
  onOpenVoiceAgent
}) => {
  return (
    <div className="relative md:sticky md:top-0 z-20 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 py-3 md:px-8 md:py-3.5 print:hidden shadow-sm flex items-center justify-between gap-4">
      {/* Primary Header dedicated to Smart PE / Custom School Logo */}
      <div className="hidden md:flex items-center gap-4">
        <div className="cursor-pointer" onClick={() => handleTabChange('dashboard')}>
          <Logo variant="color" size="lg" customLogoUrl={schoolLogo} customSchoolName={schoolName} />
        </div>

        {/* Quick Workspace Switch Pill in Header */}
        <button
          type="button"
          onClick={() => {
            const nextWs = activeWorkspace === 'school' ? 'academy' : 'school';
            setActiveWorkspace(nextWs);
            localStorage.setItem('smartpe_active_workspace', nextWs);
            handleTabChange(nextWs === 'academy' ? 'coaching-academy' : 'dashboard');
          }}
          className={`hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-black uppercase tracking-wider transition-all shadow-sm ${
            activeWorkspace === 'academy'
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-900 hover:bg-amber-500/20'
              : 'bg-blue-500/10 border-blue-500/30 text-blue-900 hover:bg-blue-500/20'
          }`}
          title="Toggle between School and Academy workspaces"
        >
          {activeWorkspace === 'academy' ? (
            <>
              <Trophy size={14} className="text-amber-600" />
              <span>🏆 Coaching & Academy</span>
            </>
          ) : (
            <>
              <School size={14} className="text-blue-600" />
              <span>🏫 School PE</span>
            </>
          )}
        </button>

        {/* Voice AI Guide Pill */}
        {onOpenVoiceAgent && (
          <button
            type="button"
            onClick={onOpenVoiceAgent}
            className="hidden xl:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200/80 text-indigo-900 hover:bg-indigo-100/70 text-xs font-black uppercase tracking-wider transition-all shadow-sm hover:scale-105 active:scale-95"
            title="Ask Voice AI Assistant & Find Features"
          >
            <Sparkles size={14} className="text-amber-500 animate-pulse" />
            <span>Voice Guide</span>
          </button>
        )}
      </div>

      <div className="w-full md:max-w-xs lg:max-w-sm">
        <GlobalSearch 
          onOpenVoiceAgent={onOpenVoiceAgent}
          onNavigate={(tabId, data) => {
            handleTabChange(tabId as Tab);
            if (data?.studentId) {
              setHighlightStudentId(data.studentId);
            } else {
              setHighlightStudentId(null);
            }
          }} 
        />
      </div>
    </div>
  );
});

// Memoized Mobile Bottom Navigation component
interface MobileBottomNavProps {
  activeTab: Tab;
  handleTabChange: (tabId: Tab) => void;
}
const MobileBottomNav: React.FC<MobileBottomNavProps> = React.memo(({ activeTab, handleTabChange }) => {
  const bottomItems = useMemo(() => [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Home' },
    { id: 'planner', icon: Sparkles, label: 'Planner' },
    { id: 'testpaper', icon: ClipboardList, label: 'Tests' },
    { id: 'tools', icon: Wrench, label: 'Tools' },
    { id: 'theory', icon: GraduationCap, label: 'Theory' }
  ] as const, []);

  return (
    <nav className="md:hidden fixed bottom-4 left-4 right-4 bg-white/90 backdrop-blur-xl border border-slate-150/60 p-2 rounded-[1.75rem] flex justify-around items-center z-40 shadow-[0_8px_30px_rgb(0,0,0,0.08)] print:hidden">
      {bottomItems.map((item) => {
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => handleTabChange(item.id as Tab)}
            className={`flex flex-col items-center justify-center py-2 px-3.5 rounded-2xl transition-all duration-300 active:scale-90 relative ${
              isActive 
                ? 'text-primary bg-primary/5 font-extrabold' 
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <item.icon size={18} className={`transition-transform duration-300 ${isActive ? 'scale-110 stroke-[2.5px]' : 'stroke-[2px]'}`} />
            <span className={`text-[8.5px] font-black uppercase tracking-widest mt-1 transition-all duration-300 ${isActive ? 'text-primary opacity-100' : 'text-slate-400 opacity-70'}`}>
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
});

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>(() => {
    const savedWs = localStorage.getItem('smartpe_active_workspace');
    return savedWs === 'academy' ? 'coaching-academy' : 'dashboard';
  });
  const [activeWorkspace, setActiveWorkspace] = useState<'school' | 'academy'>(() => {
    return (localStorage.getItem('smartpe_active_workspace') as 'school' | 'academy') || 'school';
  });
  const [isPending, startTransition] = useTransition();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [apiStatus, setApiStatus] = useState<'checking' | 'ok' | 'missing' | 'quota'>('checking');
  const [aiProviders, setAiProviders] = useState<{ gemini: boolean, groq: boolean }>({ gemini: false, groq: false });
  const [apiSource, setApiSource] = useState<string>('');
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [isKeyDialogOpen, setIsKeyDialogOpen] = useState(false);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [schoolBranding, setSchoolBranding] = useState<{ schoolName: string | null; schoolLogo: string | null }>(() => {
    return {
      schoolName: localStorage.getItem('smartpe_school_name') || null,
      schoolLogo: localStorage.getItem('smartpe_school_logo') || null
    };
  });
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isAuthView, setIsAuthView] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [selectedReportStudentId, setSelectedReportStudentId] = useState<string | null>(null);
  const [coachingReportId, setCoachingReportId] = useState<string | null>(null);
  const [highlightStudentId, setHighlightStudentId] = useState<string | null>(null);
  const [isVoiceAgentOpen, setIsVoiceAgentOpen] = useState(false);
  const [spotlightInfo, setSpotlightInfo] = useState<SpotlightData | null>(null);
  const [toasts, setToasts] = useState<ToastConfig[]>([]);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmConfig | null>(null);

  // Link-sharing and direct hash deep link handler for athletic merit reports
  useEffect(() => {
    const handleUrlHashOrQuery = () => {
      const hash = window.location.hash;
      const searchParams = new URLSearchParams(window.location.search);
      const repId = searchParams.get('reportId') || 
                    searchParams.get('meritReportId') ||
                    (hash.startsWith('#merit-report-') ? hash.replace('#merit-report-', '') : null) ||
                    (hash.startsWith('#report-') ? hash.replace('#report-', '') : null);

      if (repId) {
        setCoachingReportId(repId);
        setActiveTab('coaching-academy');
      }
    };

    handleUrlHashOrQuery();
    window.addEventListener('hashchange', handleUrlHashOrQuery);
    return () => window.removeEventListener('hashchange', handleUrlHashOrQuery);
  }, []);

  useEffect(() => {
    const handleToastEvent = (e: Event) => {
      const customEvent = e as CustomEvent<ToastConfig>;
      if (customEvent.detail) {
        const newToast = customEvent.detail;
        setToasts(prev => [...prev, newToast]);
        if (newToast.duration !== 0) {
          setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== newToast.id));
          }, newToast.duration || 3000);
        }
      }
    };

    const handleConfirmEvent = (e: Event) => {
      const customEvent = e as CustomEvent<ConfirmConfig>;
      if (customEvent.detail) {
        setConfirmDialog(customEvent.detail);
      }
    };

    window.addEventListener(SHOW_TOAST_EVENT, handleToastEvent);
    window.addEventListener(SHOW_CONFIRM_EVENT, handleConfirmEvent);

    return () => {
      window.removeEventListener(SHOW_TOAST_EVENT, handleToastEvent);
      window.removeEventListener(SHOW_CONFIRM_EVENT, handleConfirmEvent);
    };
  }, []);

  // Synchronize browser history with Sidebar view to handle Android hardware back button natively
  useEffect(() => {
    if (isSidebarOpen) {
      window.history.pushState({ sidebarOpen: true }, '');
      
      const handlePopState = (e: PopStateEvent) => {
        setIsSidebarOpen(false);
      };
      
      window.addEventListener('popstate', handlePopState);
      return () => {
        window.removeEventListener('popstate', handlePopState);
      };
    }
  }, [isSidebarOpen]);

  // Synchronize browser history with Login view to handle Android hardware back button natively
  useEffect(() => {
    if (isAuthView) {
      window.history.pushState({ authOpen: true }, '');
      
      const handlePopState = (e: PopStateEvent) => {
        setIsAuthView(false);
      };
      
      window.addEventListener('popstate', handlePopState);
      return () => {
        window.removeEventListener('popstate', handlePopState);
      };
    }
  }, [isAuthView]);

  const handleCloseAuth = useCallback(() => {
    if (window.history.state?.authOpen) {
      window.history.back();
    } else {
      setIsAuthView(false);
    }
  }, []);
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser: FirebaseUser | null) => {
      console.log("Auth state changed:", currentUser?.email);
      setUser(currentUser);
      setIsAuthReady(true);
      if (currentUser) {
        setIsAuthView(false); // Reset auth view when user logs in
        // Show welcome onboarding modal for logged-in session if first time
        if (!sessionStorage.getItem('welcome_modal_shown')) {
          setShowWelcomeModal(true);
          sessionStorage.setItem('welcome_modal_shown', 'true');
        }
      }
    }, (error) => {
      console.error("Auth state change error:", error);
      try {
        logError(error, 'error', { context: 'onAuthStateChanged failed' }).catch(() => {});
      } catch (e) {}
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  // Listen to live school branding updates globally
  useEffect(() => {
    const handleBrandingUpdated = (e: Event) => {
      const customEvent = e as CustomEvent<{ schoolName?: string; schoolLogo?: string }>;
      if (customEvent.detail) {
        const name = customEvent.detail.schoolName || null;
        const logo = customEvent.detail.schoolLogo || null;
        if (name) localStorage.setItem('smartpe_school_name', name);
        if (logo) localStorage.setItem('smartpe_school_logo', logo);
        setSchoolBranding({
          schoolName: name,
          schoolLogo: logo
        });
      }
    };

    window.addEventListener('school_branding_updated', handleBrandingUpdated);
    return () => {
      window.removeEventListener('school_branding_updated', handleBrandingUpdated);
    };
  }, []);

  // Fetch registered school branding from Firestore when user logs in
  useEffect(() => {
    if (!user?.uid) return;

    let isMounted = true;
    const fetchBranding = async () => {
      try {
        const member = await fitnessService.getSchoolMember(user.uid);
        if (member && isMounted) {
          let name = member.schoolName || null;
          let logo = member.schoolLogo || null;

          if (member.schoolId) {
            const schoolData = await fitnessService.getSchool(member.schoolId, true);
            if (schoolData) {
              if (schoolData.name) name = schoolData.name;
              if (schoolData.logoUrl) logo = schoolData.logoUrl;
            }
          }

          if (name) localStorage.setItem('smartpe_school_name', name);
          if (logo) localStorage.setItem('smartpe_school_logo', logo);
          setSchoolBranding({ schoolName: name, schoolLogo: logo });
        }
      } catch (err) {
        console.error("Error fetching school branding:", err);
      }
    };

    fetchBranding();
  }, [user?.uid]);

  const handleLogout = useCallback(() => {
    toast.confirm('Are you sure you want to log out?', async () => {
      try {
        await signOut(auth);
      } catch (err) {
        console.error(err);
      }
    });
  }, []);

  const checkApiStatus = useCallback(async (retryCount = 0) => {
    try {
      console.log("Checking API health...");
      const response = await fetch(`/api/health?t=${Date.now()}`); // Cache busting
      
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      const text = await response.text();
      const contentType = response.headers.get("content-type");
      
      if (!contentType || !contentType.includes("application/json")) {
        if (retryCount < 2) {
          console.log(`Retrying health check (${retryCount + 1}/2)...`);
          setTimeout(() => checkApiStatus(retryCount + 1).catch(() => {}), 2000);
          return;
        }
        setApiStatus('missing');
        return;
      }

      const data = JSON.parse(text);
      
      if (data.status === 'ok') {
        setApiStatus('ok');
        setAiProviders({ gemini: data.hasGemini, groq: data.hasGroq });
        setApiSource(data.hasGemini ? 'Gemini' : 'Groq');
        setDebugInfo(data);
        if (isKeyDialogOpen && (data.hasGemini || data.hasGroq)) {
          setIsKeyDialogOpen(false);
        }
      } else if (data.status === 'error' && (data.message?.toLowerCase().includes('429') || data.message?.toLowerCase().includes('quota'))) {
        setApiStatus('quota');
        setAiProviders({ gemini: false, groq: false });
        setApiSource('');
      } else {
        setApiStatus('missing');
        setAiProviders({ gemini: false, groq: false });
        setApiSource('');
      }
    } catch (error: any) {
      console.warn("Health check probe note:", error?.message || error);
      
      if (retryCount < 2) {
        setTimeout(() => checkApiStatus(retryCount + 1).catch(() => {}), 2000);
      } else {
        setApiStatus('missing');
      }
    }
  }, [isKeyDialogOpen]);

  useEffect(() => {
    const handleRejection = (e: PromiseRejectionEvent) => {
      // Suppress Vite's red error overlay for background promise rejections
      e.preventDefault();
      console.debug("Silenced background promise rejection:", e.reason);
    };
    const handleError = (e: ErrorEvent) => {
      // Only prevent default if it's a known non-critical error or vite WebSocket error
      if (e.message && (e.message.includes('WebSocket') || e.message.includes('fetch'))) {
        e.preventDefault();
      }
    };
    
    window.addEventListener('unhandledrejection', handleRejection);
    window.addEventListener('error', handleError);
    
    return () => {
      window.removeEventListener('unhandledrejection', handleRejection);
      window.removeEventListener('error', handleError);
    };
  }, []);

  useEffect(() => {
    checkApiStatus().catch(() => {});

    
    // Check if key was selected if we're still missing it, but less frequently
    const interval = setInterval(() => {
      // Small optimization: only check if we are in missing state and the api key might have been set
      if (apiStatus === 'missing' && window.aistudio) {
        const checkKey = async () => {
          try {
            const hasKey = await window.aistudio!.hasSelectedApiKey();
            if (hasKey) {
              await checkApiStatus();
            }
          } catch (e) {
            // Silently catch background errors to avoid annoying the user
            console.debug("Background check silenced:", e);
          }
        };
        checkKey().catch(() => {});
      }
    }, 45000); // 45 seconds is sufficient for background checks
    
    return () => clearInterval(interval);
  }, [apiStatus, checkApiStatus]); // Re-run when apiStatus changes to missing

  const handleSelectKey = useCallback(async () => {
    try {
      if (window.aistudio) {
        await window.aistudio.openSelectKey();
        // Assume success as per guidelines
        setApiStatus('ok');
        setIsKeyDialogOpen(false);
        // Re-check health after a short delay to be sure
        setTimeout(() => checkApiStatus().catch(console.error), 3000);
      }
    } catch (err) {
      console.error(err);
    }
  }, [checkApiStatus]);

  const triggerKeySelector = useCallback(async () => {
    try {
      await handleSelectKey();
    } catch (err) {
      console.error(err);
    }
  }, [handleSelectKey]);

  const handleTestConnection = useCallback(async () => {
    setIsTesting(true);
    setGlobalError(null);
    try {
      const response = await fetch('/api/ai/test');
      const text = await response.text();
      
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error(`Server returned non-JSON response: ${text.substring(0, 50)}...`);
      }

      if (!text) throw new Error("Empty response from server");
      
      const data = JSON.parse(text);
      if (data.message) {
        alert("Success: " + data.message);
        checkApiStatus().catch(console.error);
      } else {
        const err = data.error || "Unknown error";
        setGlobalError(err);
        alert("Error: " + err);
      }
    } catch (error: any) {
      setGlobalError(error.message);
      alert("Test failed: " + error.message);
    } finally {
      setIsTesting(false);
    }
  }, [checkApiStatus]);

  const handleResetKey = useCallback(async () => {
    try {
      if (window.aistudio) {
        // There isn't a direct 'clear' but we can re-open or just refresh
        await window.aistudio.openSelectKey();
        checkApiStatus().catch(console.error);
      }
    } catch (err) {
      console.error(err);
    }
  }, [checkApiStatus]);

  // Unified memoized transition handler to switch routes easily and prevent layout delay
  const handleTabChange = useCallback((tabId: Tab) => {
    // Analytics: track screen transitions
    trackEvent('screen_view_custom', { screen_name: tabId, previous_screen: activeTab });

    // Analytics: track if a tool is used
    const toolTabs: Record<string, string> = {
      'planner': 'AI Lesson Planner',
      'yearly': 'Yearly Planner',
      'weekly-planner': 'Weekly Academic Planner',
      'workload-planner': 'Workload & Timetable',
      'khelo': 'Khelo India Calculator',
      'testpaper': 'Question Paper Generator',
      'skill-analysis': 'Skill Analysis Lab',
      'rules': 'Game Rules Bot',
      'widgets': 'Classroom Widgets'
    };
    if (toolTabs[tabId]) {
      trackEvent('tool_used', { tool_name: toolTabs[tabId] });
    }

    startTransition(() => {
      setActiveTab(tabId);
    });
    setHighlightStudentId(null);
    if (window.history.state?.sidebarOpen) {
      window.history.back();
    } else {
      setIsSidebarOpen(false);
    }
  }, [activeTab]);

  const renderContent = () => {
    if (isProtectedTab(activeTab)) {
      if (!isAuthReady) {
        return (
          <div className="h-full min-h-[400px] flex flex-col items-center justify-center">
            <Loader2 className="animate-spin text-primary mb-4" size={48} />
            <p className="text-slate-500 font-medium">Verifying access...</p>
          </div>
        );
      }
      if (!user) {
        return <FitnessManagementIntro onLogin={() => setIsAuthView(true)} onTryDemo={() => handleTabChange('fitness')} />;
      }
    }

    switch (activeTab) {
      case 'dashboard': return <Dashboard apiStatus={apiStatus} debugInfo={debugInfo} onTestConnection={handleTestConnection} isTesting={isTesting} onNavigate={handleTabChange} />;
      case 'yearly': return <YearlyPlanner onNavigate={handleTabChange} />;
      case 'weekly-planner': return <AcademicWeeklyPlanner />;
      case 'workload-planner': return <DepartmentWorkloadPlanner />;
      case 'principal-dashboard': return <PrincipalDashboard onNavigate={handleTabChange} />;
      case 'department-office': return <DepartmentOffice />;
      case 'tools': return <AIToolCenter />;
      case 'theory': return <TheoryHub />;
      case 'planner': return <AIPlanner />;
      case 'skillmastery': return <SkillMastery />;
      case 'compliance': return <ComplianceAdvisor />;
      case 'khelo': return <KheloIndia />;
      case 'rules': return <RulesBot />;
      case 'fitness': return <FitnessTests />;
      case 'cbse-practical': return <PracticalAssessmentHub />;
      case 'coaching-assessment':
      case 'coaching-academy': return <CoachingAcademyHub onSwitchToSchoolPe={() => handleTabChange('dashboard')} initialReportId={coachingReportId || undefined} />;
      case 'school-results': return <FitnessDashboard onNavigate={handleTabChange} onSelectStudent={(id) => { setSelectedReportStudentId(id); setActiveTab('fitness-reports'); }} />;
      case 'school-students': return <StudentManagement onNavigate={handleTabChange} onSelectStudent={(id) => { setSelectedReportStudentId(id); setActiveTab('fitness-reports'); }} highlightStudentId={highlightStudentId} />;
      case 'school-teams': return <TeamManagement />;
      case 'school-admin': return <SchoolAdmin />;
      case 'logs': return <AdminLogs />;
      case 'fitness-reports': return <FitnessReports initialStudentId={selectedReportStudentId || undefined} />;
      case 'testpaper': return <TestPaperGenerator />;
      case 'tournament-fixtures': return <TournamentMaker />;
      case 'parentletters': return <ParentLetters />;
      case 'widgets': return <ClassroomWidgets />;
      case 'skill-analysis': return <SkillAnalysis />;
      case 'brand-welcome': return <BrandWelcomeHub userEmail={user?.email} userName={user?.displayName} onNavigateToPlans={() => handleTabChange('subscription-plans')} />;
      case 'subscription-plans': return <PricingAndPlans userEmail={user?.email} />;
      case 'school-overview': return <FitnessManagementIntro onLogin={() => {
        if (auth.currentUser) {
          handleTabChange('school-results');
        } else {
          setIsAuthView(true);
        }
      }} onTryDemo={() => handleTabChange('fitness')} />;
      case 'about': return <About onNavigate={handleTabChange} />;
      case 'contact': return <Contact onNavigate={handleTabChange} />;
      default: return <Dashboard apiStatus={apiStatus} debugInfo={debugInfo} onTestConnection={handleTestConnection} isTesting={isTesting} onNavigate={handleTabChange} />;
    }
  };

  if (!user && isAuthView) {
    return (
      <ErrorBoundary>
        <Auth onBack={handleCloseAuth} />
      </ErrorBoundary>
    );
  }

  return (
    <HelmetProvider>
      <SEOHead activeTab={activeTab} />
      <ErrorBoundary>
        <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row overflow-hidden h-screen print:h-auto print:overflow-visible font-sans">
        {/* Toast Notification Container */}
        <div className="fixed bottom-6 right-6 z-[200] space-y-3 max-w-sm w-full pointer-events-none">
          {toasts.map(t => (
            <div
              key={t.id}
              className="p-4 rounded-2xl shadow-xl border-4 border-slate-900 pointer-events-auto flex items-center space-x-3 text-xs font-black uppercase tracking-wider animate-slide-up bg-white text-slate-900"
            >
              <div className={`w-3.5 h-3.5 rounded-full flex-shrink-0 ${
                t.type === 'success' ? 'bg-emerald-500' : t.type === 'error' ? 'bg-rose-500' : 'bg-[#D4A017]'
              }`} />
              <p className="flex-1 text-slate-900 leading-tight">{t.message}</p>
              <button
                onClick={() => setToasts(prev => prev.filter(item => item.id !== t.id))}
                className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-900 transition-colors pointer-events-auto"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>

        {/* Custom Confirm Dialog Overlay */}
        {confirmDialog && (
          <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-[250] flex items-center justify-center p-4 pointer-events-auto">
            <div className="bg-[#FFFDF9] border-4 border-slate-900 rounded-[2rem] p-6 max-w-md w-full shadow-[12px_12px_0px_0px_rgba(15,23,42,1)] space-y-6 animate-slide-up">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-black shadow-md flex-shrink-0 border-2 border-slate-900">
                  <AlertTriangle size={24} />
                </div>
                <div className="space-y-1.5 flex-1">
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Confirmation Required</h3>
                  <p className="text-xs text-slate-600 font-bold leading-relaxed">{confirmDialog.message}</p>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => {
                    if (confirmDialog.onCancel) confirmDialog.onCancel();
                    setConfirmDialog(null);
                  }}
                  className="px-5 py-3 border-2 border-slate-900 hover:bg-slate-50 text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    confirmDialog.onConfirm();
                    setConfirmDialog(null);
                  }}
                  className="px-5 py-3 bg-slate-900 hover:bg-slate-800 text-white border-2 border-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}

        {/* API Key Selection Modal - Enhanced with instructions */}
      {isKeyDialogOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl">
          <div className="bg-white rounded-[2.5rem] p-10 max-w-lg w-full shadow-2xl border border-slate-100 animate-slide-up">
            <div className="flex justify-between items-start mb-8">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                <ShieldCheck size={32} />
              </div>
              <button onClick={() => setIsKeyDialogOpen(false)} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400">
                <X size={20} />
              </button>
            </div>
            
            <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tight font-display uppercase">AI Setup Guide</h2>
            
            <div className="space-y-6 mb-8">
              <div className="p-5 bg-primary/5 rounded-3xl border-2 border-primary/10 shadow-sm">
                <p className="text-sm font-black text-primary mb-3 flex items-center uppercase tracking-widest">
                  <span className="w-8 h-8 bg-primary text-white rounded-xl flex items-center justify-center text-xs mr-3 shadow-lg shadow-primary/20">1</span>
                  Option A: Paid Gemini Key
                </p>
                <p className="text-xs text-primary/70 mb-5 leading-relaxed font-medium">
                  The standard AI engine. If you see "Expired Key" or "Quota" errors, click below to renew, select, or upgrade to a key from a paid project.
                </p>
                <button 
                  onClick={triggerKeySelector}
                  className="w-full py-4 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-primary/90 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-primary/20 flex items-center justify-center space-x-3"
                >
                  <Sparkles size={18} />
                  <span>Renew / Upgrade Key</span>
                </button>
              </div>

              <div className="p-5 bg-[#D4A017]/10 rounded-3xl border-2 border-[#D4A017]/30 shadow-sm">
                <p className="text-sm font-black text-[#0D2B52] mb-3 flex items-center uppercase tracking-widest">
                  <span className="w-8 h-8 bg-[#0D2B52] text-[#D4A017] rounded-xl flex items-center justify-center text-xs mr-3 shadow-lg shadow-[#0D2B52]/20">2</span>
                  Option B: Groq Key
                </p>
                <div className="mb-4 p-3 bg-white/80 rounded-2xl border border-[#D4A017]/40">
                  <p className="text-[11px] text-[#0D2B52] font-black flex items-center mb-1 uppercase tracking-widest">
                    <AlertCircle size={14} className="mr-2 text-[#D4A017]" />
                    GETTING A "NO PAID PROJECT" ERROR?
                  </p>
                  <p className="text-[10px] text-slate-700 leading-tight">
                    If Gemini shows a "No Paid Project" error, skip it! Use Groq instead—it's free, 10x faster, and doesn't require a paid Google account.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={handleTestConnection}
                    disabled={isTesting}
                    className="py-3 bg-white border-2 border-[#0D2B52]/20 text-[#0D2B52] rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 transition-all flex items-center justify-center space-x-2"
                  >
                    {isTesting ? <Loader2 className="animate-spin" size={14} /> : <RotateCcw size={14} />}
                    <span>{isTesting ? 'Verifying...' : 'Verify'}</span>
                  </button>
                  <button 
                    onClick={() => window.location.reload()}
                    className="py-3 bg-[#0D2B52] text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-[#164077] transition-all flex items-center justify-center space-x-2"
                  >
                    <RotateCcw size={14} />
                    <span>Force Refresh</span>
                  </button>
                </div>
              </div>
            </div>

            <p className="text-center text-[11px] text-slate-400 font-medium">
              Need a key? Get one at <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-primary underline">aistudio.google.com</a>
            </p>
          </div>
        </div>
      )}

        {/* Outdoor Offline Status Banner */}
        <OfflineBanner />

        {/* Mobile Header */}
        <MobileHeader 
          isSidebarOpen={isSidebarOpen} 
          setIsSidebarOpen={setIsSidebarOpen} 
          schoolName={schoolBranding.schoolName}
          schoolLogo={schoolBranding.schoolLogo}
          onOpenVoiceAgent={() => setIsVoiceAgentOpen(true)}
        />

        {/* Mobile Sidebar Backdrop */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Navigation Sidebar */}
        <Sidebar 
          isSidebarOpen={isSidebarOpen} 
          activeTab={activeTab} 
          apiStatus={apiStatus} 
          user={user} 
          handleTabChange={handleTabChange} 
          handleSelectKey={handleSelectKey} 
          handleLogout={handleLogout} 
          setIsAuthView={setIsAuthView} 
          setIsSidebarOpen={setIsSidebarOpen} 
          schoolName={schoolBranding.schoolName}
          schoolLogo={schoolBranding.schoolLogo}
          activeWorkspace={activeWorkspace}
          setActiveWorkspace={setActiveWorkspace}
        />

        {/* Content Area */}
        <main className={`flex-1 overflow-y-auto bg-slate-50 relative print:overflow-visible print:h-auto print:bg-white pb-32 ${isSidebarOpen ? 'hidden md:block' : ''}`}>
          <StickyHeader 
            activeTab={activeTab} 
            handleTabChange={handleTabChange} 
            setHighlightStudentId={setHighlightStudentId} 
            schoolName={schoolBranding.schoolName}
            schoolLogo={schoolBranding.schoolLogo}
            activeWorkspace={activeWorkspace}
            setActiveWorkspace={setActiveWorkspace}
            onOpenVoiceAgent={() => setIsVoiceAgentOpen(true)}
          />

          {/* Voice Guide Spotlight Beacon on Screen */}
          <SpotlightBanner
            spotlight={spotlightInfo}
            onDismiss={() => setSpotlightInfo(null)}
          />
          {globalError && (
            <div className="max-w-7xl mx-auto px-6 pt-6 md:px-12">
              <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 flex items-center space-x-4 text-red-700">
                <AlertTriangle className="flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-black uppercase tracking-tight">System Error Detected</p>
                  <p className="text-xs font-medium opacity-80 mb-2">{globalError}</p>
                  <button 
                    onClick={handleSelectKey}
                    className="px-4 py-1.5 bg-red-600 text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-red-700 transition-colors shadow-sm"
                  >
                    Setup AI / Fix Connection
                  </button>
                </div>
                <button 
                  onClick={() => setGlobalError(null)}
                  className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          )}
          <div className="max-w-7xl mx-auto p-3 sm:p-4 md:p-6 lg:p-6 min-h-full print:p-0 pb-20 md:pb-6">
            {renderContent()}
          </div>
          <Disclaimer />

          {/* Floating Voice AI Copilot Button */}
          <FloatingVoiceAgentButton 
            onClick={() => setIsVoiceAgentOpen(true)} 
            isOpen={isVoiceAgentOpen} 
          />

          {/* Voice AI Assistant & Feature Guide Modal */}
          <VoiceAgentModal
            isOpen={isVoiceAgentOpen}
            onClose={() => setIsVoiceAgentOpen(false)}
            onNavigate={(tabId, spotlight) => {
              handleTabChange(tabId as Tab);
              if (spotlight) {
                setSpotlightInfo({ ...spotlight, tabId });
              }
            }}
          />

          {/* Welcome Onboarding Modal for New / Signed-In Users */}
          <WelcomeOnboardingModal
            isOpen={showWelcomeModal}
            onClose={() => setShowWelcomeModal(false)}
            userName={user?.displayName || user?.email?.split('@')[0] || 'Educator'}
            schoolName="Smart PE Partner School"
            onNavigateTab={handleTabChange}
          />

          {/* Mobile Bottom Navigation - Displayed exclusively for School PE, hidden in Coaching & Academy to avoid layout collision */}
          {activeWorkspace !== 'academy' && activeTab !== 'coaching-academy' && activeTab !== 'coaching-assessment' && (
            <MobileBottomNav 
              activeTab={activeTab} 
              handleTabChange={handleTabChange} 
            />
          )}
        </main>
    </div>
  </ErrorBoundary>
</HelmetProvider>
);
};

export default App;
    