import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  Printer, 
  Search, 
  Trash2, 
  Trophy, 
  Calendar, 
  User, 
  Award,
  Sparkles,
  Download,
  Share2,
  Medal,
  Activity
} from 'lucide-react';
import { 
  academyService, 
  PlayerAssessmentRecord, 
  PlayerProfileData, 
  SPORT_TEMPLATES, 
  getDevelopmentLevelColor,
  getMeritClassification,
  CoachingSportId,
  createPlayerFromAssessment
} from '../../services/academyService';
import { showToast } from '../../services/toast';

interface CoachingReportsViewProps {
  onViewReport: (player: PlayerProfileData, assessment: PlayerAssessmentRecord) => void;
  onNewAssessment: (playerId?: string) => void;
}

export const CoachingReportsView: React.FC<CoachingReportsViewProps> = ({
  onViewReport,
  onNewAssessment
}) => {
  const [assessments, setAssessments] = useState<PlayerAssessmentRecord[]>(() => academyService.getAssessments());
  const [players, setPlayers] = useState<PlayerProfileData[]>(() => academyService.getPlayers());
  const [searchQuery, setSearchQuery] = useState('');
  const [sportFilter, setSportFilter] = useState('all');

  const refreshData = () => {
    setAssessments(academyService.getAssessments());
    setPlayers(academyService.getPlayers());
  };

  const filteredAssessments = useMemo(() => {
    return assessments.filter(a => {
      const matchSearch = a.playerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          a.coachName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          a.assessmentType.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          a.position.toLowerCase().includes(searchQuery.toLowerCase());
      const matchSport = sportFilter === 'all' || a.sport === sportFilter;
      return matchSearch && matchSport;
    }).sort((a, b) => new Date(b.assessmentDate).getTime() - new Date(a.assessmentDate).getTime());
  }, [assessments, searchQuery, sportFilter]);

  // Sports counts for filter chips
  const sportCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    assessments.forEach(a => {
      counts[a.sport] = (counts[a.sport] || 0) + 1;
    });
    return counts;
  }, [assessments]);

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Delete merit report record for ${name}?`)) {
      academyService.deleteAssessment(id);
      refreshData();
      showToast('Assessment deleted', 'success');
    }
  };

  // Preview or generate a quick sample merit report for any chosen sport category
  const handlePreviewSportSample = (targetSport: string) => {
    const sportKey = (targetSport === 'all' ? 'football' : targetSport) as CoachingSportId;
    const existing = assessments.find(a => a.sport === sportKey);
    
    if (existing) {
      const p = players.find(player => player.id === existing.playerId) || createPlayerFromAssessment(existing);
      onViewReport(p, existing);
      return;
    }

    // Generate instant preview record for sport
    const tmpl = SPORT_TEMPLATES[sportKey] || SPORT_TEMPLATES.football;
    const sampleRatings: Record<string, number> = {};
    tmpl.skills.forEach((s, idx) => {
      sampleRatings[s.id] = (idx % 2 === 0) ? 4 : 5;
    });

    const sampleAssessment: PlayerAssessmentRecord = {
      id: `sample-${sportKey}-${Date.now()}`,
      playerId: `player-sample-${sportKey}`,
      playerName: `Cadet ${tmpl.name} Exemplar`,
      sport: sportKey,
      position: tmpl.positions[0]?.name || 'Athlete',
      assessmentType: '3-Month Review',
      assessmentDate: new Date().toISOString().split('T')[0],
      coachName: 'Coach Vikram Roy',
      skillRatings: sampleRatings,
      skillObservations: {},
      skillTargets: {},
      includedPositionSkills: [],
      domainScores: {
        technical: 86,
        tactical: 82,
        physical: 88,
        gameBehaviour: 92
      },
      overallScore: 87,
      developmentLevel: 'Proficient',
      strengths: [
        'Exceptional footwork and body balance',
        'Consistently quick decision making under defensive pressure',
        'Outstanding coachability and sportsmanship'
      ],
      developmentPriorities: [
        'Fine-tune transition recovery speed during high-intensity phases',
        'Maintain tactical communication across full match duration'
      ],
      coachObservation: `Exemplary performance demonstrating high technical mastery and match composure in ${tmpl.name}. Candidate qualifies for High Merit distinction.`,
      coachRecommendation: 'Continue 30-minute individual technical ball/racket drills 3 times a week.',
      nextGoals: [
        {
          id: 'goal-sample-1',
          playerId: `player-sample-${sportKey}`,
          goal: 'Master off-side positional anticipation',
          skill: 'Tactical Game Sense',
          target: '90% drill accuracy',
          startDate: new Date().toISOString().split('T')[0],
          reviewDate: new Date().toISOString().split('T')[0],
          status: 'In Progress'
        }
      ],
      nextAssessmentDate: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString()
    };

    const samplePlayer: PlayerProfileData = {
      id: `player-sample-${sportKey}`,
      name: `Cadet ${tmpl.name} Exemplar`,
      dob: '2012-05-15',
      age: 12,
      gender: 'Male',
      sport: sportKey,
      position: tmpl.positions[0]?.name || 'Athlete',
      batchOrTeam: `${tmpl.name} Junior Academy`,
      coachName: 'Coach Vikram Roy',
      joiningDate: '2023-01-10',
      parentName: 'Ramesh Sharma',
      parentContact: '+91 98765 43210',
      dominantSide: 'Right',
      previousExperience: '2 years school academy training',
      playerGoals: 'Reach state division squad',
      createdAt: new Date().toISOString(),
      active: true
    };

    onViewReport(samplePlayer, sampleAssessment);
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-white border-2 border-slate-900 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="px-2.5 py-0.5 bg-blue-100 text-blue-900 rounded-md text-[10px] font-black uppercase tracking-wider">
              Evaluations Archive & Merit Reports
            </span>
            <span className="text-xs text-slate-400 font-bold">
              {assessments.length} Completed Reports Across 12 Sports
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-display">
            Athletic Merit Records & Reports
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Export, print, and share standardized SmartPE India player development reports and merit certificates with parents.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => handlePreviewSportSample(sportFilter)}
            className="px-4 py-3 bg-white hover:bg-slate-100 text-slate-900 border-2 border-slate-900 font-black rounded-2xl text-xs uppercase tracking-wider transition flex items-center justify-center space-x-2 active:scale-95 shadow-sm"
          >
            <Trophy size={16} className="text-amber-500" />
            <span>Preview Merit Report</span>
          </button>
          
          <button
            type="button"
            onClick={() => onNewAssessment()}
            className="px-5 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-2xl text-xs uppercase tracking-wider transition shadow-md flex items-center justify-center space-x-2 active:scale-95"
          >
            <FileText size={18} />
            <span>+ Conduct Assessment</span>
          </button>
        </div>
      </div>

      {/* Search and Sport Filter Bar */}
      <div className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2 relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by player name, coach, position, or assessment type..."
              className="w-full bg-white border-2 border-slate-900 rounded-2xl pl-10 pr-4 py-2.5 text-xs font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Sport Category Filter with all 12 sports */}
          <div>
            <select
              value={sportFilter}
              onChange={e => setSportFilter(e.target.value)}
              className="w-full bg-white border-2 border-slate-900 rounded-2xl px-4 py-2.5 text-xs font-bold text-slate-900 focus:outline-none"
            >
              <option value="all">All Sports Categories ({assessments.length})</option>
              {Object.values(SPORT_TEMPLATES).map(tmpl => (
                <option key={tmpl.id} value={tmpl.id}>
                  {tmpl.name} {sportCounts[tmpl.id] ? `(${sportCounts[tmpl.id]})` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick Sport Category Chips */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-[11px] scrollbar-none">
          <button
            type="button"
            onClick={() => setSportFilter('all')}
            className={`px-3 py-1 rounded-xl font-bold uppercase tracking-wider whitespace-nowrap transition ${
              sportFilter === 'all'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white border border-slate-300 text-slate-600 hover:bg-slate-100'
            }`}
          >
            All Sports ({assessments.length})
          </button>
          {Object.values(SPORT_TEMPLATES).map(tmpl => {
            const count = sportCounts[tmpl.id] || 0;
            return (
              <button
                key={tmpl.id}
                type="button"
                onClick={() => setSportFilter(tmpl.id)}
                className={`px-3 py-1 rounded-xl font-bold whitespace-nowrap transition flex items-center space-x-1 ${
                  sportFilter === tmpl.id
                    ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                    : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span>{tmpl.name}</span>
                {count > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 bg-slate-900/10 text-slate-900 rounded text-[10px] font-black">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Assessments List */}
      <div className="space-y-3">
        {filteredAssessments.length === 0 ? (
          <div className="text-center py-14 bg-white border-2 border-slate-900 rounded-3xl p-6 space-y-3">
            <FileText size={42} className="mx-auto text-slate-300" />
            <h3 className="text-base font-black text-slate-800">
              No Merit Reports Found for {sportFilter === 'all' ? 'this query' : SPORT_TEMPLATES[sportFilter as CoachingSportId]?.name || sportFilter}
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              You can conduct a new evaluation or preview a sample merit report to review the multi-sport formatting.
            </p>
            <div className="pt-2 flex items-center justify-center space-x-3">
              <button
                type="button"
                onClick={() => handlePreviewSportSample(sportFilter)}
                className="px-4 py-2 bg-slate-900 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-sm"
              >
                Generate Sample Report
              </button>
              <button
                type="button"
                onClick={() => onNewAssessment()}
                className="px-4 py-2 bg-amber-500 text-slate-950 text-xs font-black uppercase tracking-wider rounded-xl shadow-sm"
              >
                Start Evaluation
              </button>
            </div>
          </div>
        ) : (
          filteredAssessments.map(record => {
            const player = players.find(p => p.id === record.playerId) || createPlayerFromAssessment(record);
            const sportTemplate = SPORT_TEMPLATES[record.sport as CoachingSportId] || SPORT_TEMPLATES.football;
            const levelStyle = getDevelopmentLevelColor(record.developmentLevel);
            const merit = getMeritClassification(record.overallScore);

            return (
              <div
                key={record.id}
                className="bg-white border-2 border-slate-900 rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-center space-x-3.5">
                  
                  {/* Score & Merit Badge */}
                  <div className="flex flex-col items-center justify-center w-14 h-14 rounded-2xl bg-slate-900 text-amber-400 font-black flex-shrink-0 shadow-sm">
                    <span className="text-base leading-none">{record.overallScore}</span>
                    <span className="text-[9px] uppercase tracking-tighter text-slate-400 font-bold mt-0.5">
                      {merit.grade}
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center flex-wrap gap-1.5">
                      <h3 className="text-sm font-black text-slate-900">{record.playerName}</h3>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase border ${levelStyle.bg} ${levelStyle.text} ${levelStyle.border}`}>
                        {record.developmentLevel}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase border ${merit.badgeBg} ${merit.badgeText} ${merit.badgeBorder}`}>
                        {merit.category}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      <span className="font-bold text-slate-800">{sportTemplate.name}</span> • {record.position} • {record.assessmentType}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Evaluated on {record.assessmentDate} by Coach {record.coachName}
                    </p>
                  </div>
                </div>

                {/* Pillar Mini Indicators & Action Buttons */}
                <div className="flex items-center flex-wrap sm:flex-nowrap gap-2 self-end sm:self-center">
                  
                  <div className="hidden lg:flex items-center space-x-2 text-[10px] font-bold text-slate-500 mr-2">
                    <span title="Technical" className="px-1.5 py-0.5 bg-blue-50 text-blue-800 rounded">
                      T: {record.domainScores?.technical ?? '-'}
                    </span>
                    <span title="Tactical" className="px-1.5 py-0.5 bg-cyan-50 text-cyan-800 rounded">
                      Tac: {record.domainScores?.tactical ?? '-'}
                    </span>
                    <span title="Physical" className="px-1.5 py-0.5 bg-amber-50 text-amber-800 rounded">
                      P: {record.domainScores?.physical ?? '-'}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => onViewReport(player, record)}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center space-x-1.5 shadow-sm active:scale-95"
                  >
                    <FileText size={14} className="text-amber-400" />
                    <span>View Merit Report</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(record.id, record.playerName)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
                    title="Delete Record"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
