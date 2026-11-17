
import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Users, 
  TrendingUp, 
  Plus, 
  Search, 
  Filter, 
  ChevronRight, 
  Clock,
  Trophy,
  ArrowUpRight,
  Loader2,
  Trash2,
  Download
} from 'lucide-react';
import { motion } from 'motion/react';
import { fitnessService, FitnessResult, Team, Student, SchoolMember, School } from '../services/fitnessService.ts';
import { isBrandSuperAdmin, BRAND_EMAILS } from '../types';
import { auth } from '../services/firebase.ts';
import { toast } from '../services/toast.ts';
import { downloadCsvFile } from '../utils/safeBrowser.ts';

interface FitnessDashboardProps {
  onNavigate: (tab: any) => void;
  onSelectStudent?: (id: string) => void;
}

const FitnessDashboard: React.FC<FitnessDashboardProps> = ({ onNavigate, onSelectStudent }) => {
  const [results, setResults] = useState<FitnessResult[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<SchoolMember | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const isSuperAdmin = isBrandSuperAdmin(auth.currentUser?.email);

  useEffect(() => {
    let unsubResults: (() => void) | undefined;
    let unsubTeams: (() => void) | undefined;
    let unsubStudents: (() => void) | undefined;

    const fetchProfileAndData = async () => {
      if (!auth.currentUser) {
        setLoading(false);
        return;
      }

      try {
        const profile = await fitnessService.getSchoolMember(auth.currentUser.uid);
        setUserProfile(profile);

        if (isSuperAdmin) {
          const allSchools = await fitnessService.getAllSchools();
          setSchools(allSchools);
        }

        const isAdmin = profile?.role === 'admin' || isSuperAdmin;
        const schoolId = profile?.schoolId;

        unsubResults = fitnessService.subscribeToResults(
          auth.currentUser.uid,
          schoolId,
          isAdmin,
          setResults
        );
        unsubTeams = fitnessService.subscribeToTeams(
          auth.currentUser.uid,
          schoolId,
          isAdmin,
          setTeams
        );
        unsubStudents = fitnessService.subscribeToStudents(
          auth.currentUser.uid,
          schoolId,
          isAdmin,
          (data) => {
            setStudents(data);
            setLoading(false);
          }
        );
      } catch (err) {
        console.error("Error in FitnessDashboard data fetch:", err);
        setLoading(false);
      }
    };

    fetchProfileAndData().catch(err => console.error("Unhandled error in dashboard fetch:", err));
    
    return () => {
      unsubResults?.();
      unsubTeams?.();
      unsubStudents?.();
    };
  }, [auth.currentUser?.uid]);

  const handleDeleteResult = (e: React.MouseEvent, resultId: string) => {
    e.stopPropagation();
    toast.confirm("Delete this result forever?", async () => {
      try {
        await fitnessService.deleteResult(resultId);
        toast.success("Fitness result deleted.");
      } catch (err) {
        console.error(err);
        toast.error("Delete failed. Please try again.");
      }
    });
  };

  const todayPrefix = new Date().toISOString().split('T')[0];
  const resultsTodayList = results.filter(r => typeof r.date === 'string' && r.date.startsWith(todayPrefix));

  const stats = {
    totalStudents: students.length,
    resultsToday: resultsTodayList.length,
    activeStudentsToday: new Set(resultsTodayList.map(r => r.studentId)).size,
    totalTracked: results.length
  };

  const getStudentName = (id: string) => {
    const student = students.find(s => s.id === id);
    if (!student) return `Student ${id.substring(0, 4)}`;
    
    if (isSuperAdmin) {
      const school = schools.find(s => s.id === student.schoolId);
      return `${student.name} (${school?.name || 'Manual'})`;
    }
    return student.name;
  };

  const filteredResults = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return results;
    return results.filter(r => {
      const sName = getStudentName(r.studentId).toLowerCase();
      return (
        sName.includes(q) ||
        (r.testName || '').toLowerCase().includes(q) ||
        (r.rating || '').toLowerCase().includes(q)
      );
    });
  }, [results, students, schools, searchQuery, isSuperAdmin]);

  const handleExportCSV = () => {
    if (results.length === 0) {
      toast.error("No results to export.");
      return;
    }

    const headers = ['Student Name', 'Test Name', 'Value', 'Unit', 'Rating', 'Term', 'Date'];
    const rows = results.map(r => [
      getStudentName(r.studentId),
      r.testName,
      r.value,
      r.unit || '',
      r.rating || '',
      r.term || '',
      r.date ? new Date(r.date).toLocaleDateString() : ''
    ]);
    downloadCsvFile(`fitness_results_${new Date().toISOString().split('T')[0]}.csv`, headers, rows);
    toast.success("Fitness results exported to CSV!");
  };

  if (loading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-indigo-600 mb-1">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest">{isSuperAdmin ? 'Global Platform' : 'Live Results'}</span>
          </div>
          <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tighter">{isSuperAdmin ? 'Super Admin Dashboard' : 'School Overview'}</h2>
          <p className="text-slate-500 font-medium">{isSuperAdmin ? `Full platform oversight for ${auth.currentUser?.email || BRAND_EMAILS.admin}` : 'Real-time fitness data from every student in your school.'}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button 
            onClick={handleExportCSV}
            className="px-6 py-3 bg-white border border-slate-200 rounded-2xl font-black text-xs text-slate-600 uppercase tracking-widest hover:bg-slate-50 hover:text-indigo-600 transition-all shadow-sm flex items-center gap-2"
          >
            <Download size={16} />
            <span>Export CSV</span>
          </button>
          <button 
            onClick={() => onNavigate('school-students')}
            className="px-6 py-3 bg-white border-2 border-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]"
          >
            Manage Students
          </button>
          <button 
            onClick={() => onNavigate('school-teams')}
            className="px-6 py-3 bg-indigo-600 text-white border-2 border-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] flex items-center gap-2"
          >
            <Plus size={16} />
            <span>Create Team</span>
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div 
          whileHover={{ y: -5 }}
          className="bg-white p-8 rounded-[2.5rem] border-2 border-slate-900 shadow-[8px_8px_0px_0px_rgba(79,70,229,0.1)]"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600">
              <Activity size={24} />
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Last 24 Hours</span>
          </div>
          <div className="space-y-1">
            <h3 className="text-5xl font-black text-slate-900">{stats.resultsToday}</h3>
            <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Results Today</p>
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ y: -5 }}
          className="bg-white p-8 rounded-[2.5rem] border-2 border-slate-900 shadow-[8px_8px_0px_0px_rgba(16,185,129,0.1)]"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600">
              <Users size={24} />
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Now</span>
          </div>
          <div className="space-y-1">
            <h3 className="text-5xl font-black text-slate-900">{stats.activeStudentsToday}</h3>
            <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Active Students</p>
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ y: -5 }}
          className="bg-white p-8 rounded-[2.5rem] border-2 border-slate-900 shadow-[8px_8px_0px_0px_rgba(249,115,22,0.1)]"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="p-3 bg-orange-50 rounded-2xl text-orange-600">
              <TrendingUp size={24} />
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lifetime</span>
          </div>
          <div className="space-y-1">
            <h3 className="text-5xl font-black text-slate-900">{stats.totalTracked}</h3>
            <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Total Tracked</p>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Live Feed */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white rounded-[2.5rem] border-2 border-slate-900 overflow-hidden">
            <div className="p-8 border-b-2 border-slate-900 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock className="text-slate-400" size={20} />
                <h3 className="font-black text-lg uppercase tracking-tight">Recent Activity</h3>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search results..." 
                    className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {filteredResults.length === 0 ? (
                <div className="p-20 text-center space-y-4">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
                    <Activity size={32} className="text-slate-200" />
                  </div>
                  <div className="space-y-2">
                    <p className="font-black text-slate-900 uppercase tracking-tight">
                      {results.length === 0 ? 'No results yet' : 'No matching results'}
                    </p>
                    <p className="text-slate-400 text-sm font-medium max-w-xs mx-auto">
                      {results.length === 0
                        ? 'Start a testing session or create a team to see live results here.'
                        : 'Try searching by a different student name, test name, or rating.'}
                    </p>
                  </div>
                  {results.length === 0 ? (
                    <button 
                      onClick={() => onNavigate('fitness')}
                      className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all"
                    >
                      Start Testing
                    </button>
                  ) : (
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="px-6 py-3 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all"
                    >
                      Clear Search
                    </button>
                  )}
                </div>
              ) : (
                filteredResults.slice(0, 15).map((result) => (
                  <div 
                    key={result.id} 
                    onClick={() => onSelectStudent?.(result.studentId)}
                    className="w-full p-6 hover:bg-slate-50 transition-colors flex items-center justify-between group text-left border-none cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 font-black">
                        {getStudentName(result.studentId).substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-black text-slate-900 uppercase tracking-tight">{getStudentName(result.studentId)}</h4>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          <span>{result.testName}</span>
                          <span>•</span>
                          <span>{new Date(result.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-xl font-black text-slate-900">{result.value} {result.unit}</div>
                        <div className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">{result.rating || 'Good'}</div>
                      </div>
                      <button 
                        onClick={(e) => handleDeleteResult(e, result.id)}
                        className="p-3 hover:bg-red-50 text-red-400 hover:text-red-600 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                        title="Delete Result"
                      >
                        <Trash2 size={16} />
                      </button>
                      <div className="flex items-center gap-2">
                         <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">View Report</span>
                         <ChevronRight size={20} className="text-slate-200 group-hover:text-indigo-600 transition-colors" />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Sidebar: Teams & Quick Actions */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="text-xl font-black uppercase tracking-tight mb-2">Teams Overview</h3>
              <p className="text-slate-400 text-sm font-medium mb-6">Manage your classes and sports squads.</p>
              
              <div className="space-y-3">
                {teams.length === 0 ? (
                  <div className="p-6 border-2 border-dashed border-slate-800 rounded-2xl text-center">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">No teams created</p>
                    <button 
                      onClick={() => onNavigate('school-teams')}
                      className="w-full py-3 bg-white text-slate-900 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 transition-all"
                    >
                      Create First Team
                    </button>
                  </div>
                ) : (
                  teams.map(team => (
                    <button
                      type="button"
                      key={team.id}
                      onClick={() => onNavigate('school-teams')}
                      className="w-full text-left p-4 bg-slate-800 rounded-2xl flex items-center justify-between hover:bg-slate-700 transition-colors cursor-pointer group"
                    >
                      <div>
                        <h4 className="font-black text-sm uppercase tracking-tight">{team.name}</h4>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{team.studentIds.length} Students</p>
                      </div>
                      <ArrowUpRight size={16} className="text-slate-600 group-hover:text-white transition-colors" />
                    </button>
                  ))
                )}
              </div>
            </div>
            <Trophy className="absolute right-[-20px] bottom-[-20px] w-32 h-32 text-white/5 -rotate-12" />
          </div>

          <div className="bg-indigo-50 rounded-[2.5rem] p-8 border-2 border-indigo-100">
            <h3 className="text-lg font-black text-indigo-900 uppercase tracking-tight mb-4">Quick Reports</h3>
            <div className="space-y-3">
              <button 
                onClick={() => onNavigate('fitness-reports')}
                className="w-full p-4 bg-white rounded-2xl border border-indigo-100 text-left hover:shadow-md transition-all group"
              >
                <span className="block text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Term 1</span>
                <span className="block font-bold text-indigo-900">Class Progress Report</span>
              </button>
              <button 
                onClick={() => onNavigate('fitness-reports')}
                className="w-full p-4 bg-white rounded-2xl border border-indigo-100 text-left hover:shadow-md transition-all group"
              >
                <span className="block text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Health</span>
                <span className="block font-bold text-indigo-900">BMI Distribution</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FitnessDashboard;
