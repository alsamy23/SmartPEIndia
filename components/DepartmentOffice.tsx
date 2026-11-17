import React, { useState } from 'react';
import { 
  ClipboardList, 
  Dumbbell, 
  Trophy, 
  Sparkles, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Calendar, 
  AlertTriangle, 
  Download, 
  Printer, 
  Search, 
  Layers, 
  FileText 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from '../services/toast.ts';

interface EquipmentItem {
  id: string;
  name: string;
  total: number;
  available: number;
  condition: 'Excellent' | 'Good' | 'Damaged' | 'Needs Service';
  location: string;
}

interface HouseScore {
  id: string;
  house: string;
  color: string;
  points: number;
  gold: number;
  silver: number;
  bronze: number;
}

export const DepartmentOffice: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'substitute' | 'equipment' | 'house-points'>('substitute');

  // 1. SUBSTITUTE PLANS STATE
  const [subGrade, setSubGrade] = useState('Grade 6-8');
  const [subLocation, setSubLocation] = useState<'Indoor' | 'No-Ground (Rain)' | 'Classroom' | 'Small Corridor'>('Indoor');
  const [subSize, setSubSize] = useState<'Standard (20-30)' | 'Large Class (40-60)' | 'Small Class (<15)'>('Standard (20-30)');
  const [subEquipment, setSubEquipment] = useState<'None' | 'Cones Only' | 'Full Equipment'>('Cones Only');
  const [generatedSubPlan, setGeneratedSubPlan] = useState<any | null>(null);
  const [subLoading, setSubLoading] = useState(false);

  // 2. EQUIPMENT LOG STATE
  const [equipmentList, setEquipmentList] = useState<EquipmentItem[]>([
    { id: '1', name: 'Size 5 Footballs (Nivia)', total: 15, available: 12, condition: 'Good', location: 'Rack A' },
    { id: '2', name: 'Agility Training Cones', total: 60, available: 50, condition: 'Excellent', location: 'Box 3' },
    { id: '3', name: 'Badminton Rackets (Yonex)', total: 24, available: 18, condition: 'Good', location: 'Cabinet B' },
    { id: '4', name: 'First Aid Kit (Full)', total: 3, available: 3, condition: 'Excellent', location: 'PE Office Desk' },
    { id: '5', name: 'Stopwatch (Casio)', total: 5, available: 4, condition: 'Needs Service', location: 'Drawer 1' },
  ]);
  const [newEqName, setNewEqName] = useState('');
  const [newEqTotal, setNewEqTotal] = useState(10);
  const [newEqCondition, setNewEqCondition] = useState<'Excellent' | 'Good' | 'Damaged' | 'Needs Service'>('Good');
  const [newEqLocation, setNewEqLocation] = useState('');
  const [isAddingEq, setIsAddingEq] = useState(false);

  // 3. HOUSE POINTS STATE
  const [houseScores, setHouseScores] = useState<HouseScore[]>([
    { id: '1', house: 'Agni (Red House)', color: 'bg-rose-600 border-rose-800 text-rose-600', points: 340, gold: 8, silver: 5, bronze: 6 },
    { id: '2', house: 'Jal (Blue House)', color: 'bg-blue-600 border-blue-800 text-blue-600', points: 280, gold: 5, silver: 7, bronze: 4 },
    { id: '3', house: 'Prithvi (Green House)', color: 'bg-emerald-600 border-emerald-800 text-emerald-600', points: 310, gold: 6, silver: 6, bronze: 8 },
    { id: '4', house: 'Vayu (Yellow House)', color: 'bg-amber-400 border-amber-600 text-amber-500', points: 250, gold: 4, silver: 4, bronze: 6 },
  ]);
  const [selectedHouseForPoints, setSelectedHouseForPoints] = useState('1');
  const [pointsAmount, setPointsAmount] = useState(20);
  const [pointsReason, setPointsReason] = useState('Inter-House Relay Winners');
  const [medalType, setMedalType] = useState<'None' | 'Gold' | 'Silver' | 'Bronze'>('Gold');

  const handleGenerateSubstitutePlan = () => {
    setSubLoading(true);
    setTimeout(() => {
      // Create high-fidelity localized PE-specific sub plan
      const plan = {
        title: `Substitute Emergency PE Plan: ${subGrade}`,
        focus: `${subLocation} Adaptation & Core Movement Coordination`,
        classSize: subSize,
        space: subLocation,
        equipmentNeeded: subEquipment === 'None' ? 'Zero equipment needed. Standard school uniforms acceptable.' : 'Agility cones/markers or simple chalk drawings.',
        objectives: [
          'Develop spatial awareness and reactive motor control in constrained spaces.',
          'Foster cooperation, coordination, and team strategizing without heavy sport assets.',
          'Execute functional cardiovascular endurance sequences safely.'
        ],
        warmup: {
          title: 'Dynamic Space Deceleration (8 Minutes)',
          steps: [
            'Space Walking (2 min): Students walk around designated bounds. On 1 whistle, freeze; on 2 whistles, change direction.',
            'Shadow Jumps (3 min): In-place light jumps, high knees, ankle circles, shoulder mobility rotations.',
            'Reaction Stance (3 min): Quick-response core drills. "Ground" = touch floor, "Sky" = jump up, "Right" = lateral hop.'
          ]
        },
        mainActivities: [
          {
            name: 'Activity 1: The Reactive Mirror Drill',
            duration: '15 Minutes',
            desc: 'Divide students into pairs facing each other 1.5 meters apart. Leader performs slow, controlled multi-directional movements (squats, lateral steps, lunges, balance on one leg). Partner must mirror with zero latency. Switch leaders every 2 minutes. Focus: Joint stabilization, motor mimicry, focus.'
          },
          {
            name: subLocation === 'Classroom' ? 'Activity 2: Memory Ball Sequence (Desk-safe)' : 'Activity 2: Speed-Grid Relays (Cones)',
            duration: '15 Minutes',
            desc: subLocation === 'Classroom' 
              ? 'Students sit in teams. A light object (like a crumpled paper/pouch) is passed underhand across a sequence. If anyone drops it, restart. Introduce vocal cues (e.g. state a PE theory muscle when passing). Develops coordination and memory.'
              : 'Construct a simple grid using chalk or cones. Teams sprint, touch specific nodes in dynamic patterns (shuttle run, zigzag), and return to high-five the next runner. Encourages interval agility and team vocal support.'
          }
        ],
        cooldown: {
          title: 'Deceleration Stretching & Reflection (7 Minutes)',
          steps: [
            'Deep breathing: 4s inhale, 4s hold, 4s exhale (repeat 5 times).',
            'Static seated hamstring and back stretch holds.',
            'Brief Q&A: Ask students how body balance changes when lateral velocity shifts.'
          ]
        }
      };
      setGeneratedSubPlan(plan);
      setSubLoading(false);
    }, 1000);
  };

  const handleAddEquipment = () => {
    if (!newEqName.trim() || !newEqLocation.trim()) {
      toast.error('Please enter both an equipment title and storage location.');
      return;
    }
    const safeTotal = Math.max(1, Number(newEqTotal) || 1);
    const item: EquipmentItem = {
      id: Date.now().toString(),
      name: newEqName.trim(),
      total: safeTotal,
      available: safeTotal,
      condition: newEqCondition,
      location: newEqLocation.trim(),
    };
    setEquipmentList([item, ...equipmentList]);
    setNewEqName('');
    setNewEqLocation('');
    setIsAddingEq(false);
    toast.success(`Added ${item.name} (${safeTotal}) to equipment log.`);
  };

  const handleDeleteEquipment = (id: string) => {
    setEquipmentList(equipmentList.filter(item => item.id !== id));
    toast.info('Equipment item removed.');
  };

  const handleApplyHousePoints = () => {
    const safePoints = Math.max(0, Number(pointsAmount) || 0);
    setHouseScores(prev => prev.map(hs => {
      if (hs.id === selectedHouseForPoints) {
        let g = hs.gold;
        let s = hs.silver;
        let b = hs.bronze;
        if (medalType === 'Gold') g += 1;
        if (medalType === 'Silver') s += 1;
        if (medalType === 'Bronze') b += 1;

        return {
          ...hs,
          points: hs.points + safePoints,
          gold: g,
          silver: s,
          bronze: b
        };
      }
      return hs;
    }));
    toast.success(`Successfully awarded +${safePoints} points to house for: "${pointsReason || 'House Event'}"`);
  };

  return (
    <div className="space-y-10 pb-24">
      {/* Title */}
      <div className="border-b-4 border-slate-900 pb-8 space-y-2">
        <h1 className="text-3xl md:text-5xl font-black text-slate-900 uppercase">
          PE Department Office
        </h1>
        <p className="text-sm text-slate-500 font-bold uppercase tracking-wider">
          The Operational System of the PE Staffroom: Substitute Plans, Equipment Assets, and Scoreboards
        </p>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-3 gap-2 md:gap-4 max-w-4xl">
        {[
          { id: 'substitute', label: 'Substitute Plans', icon: FileText },
          { id: 'equipment', label: 'Equipment Log', icon: Dumbbell },
          { id: 'house-points', label: 'House Points', icon: Trophy },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center justify-center space-x-2 py-4 border-4 border-slate-900 rounded-2xl text-xs font-black uppercase tracking-wider transition-all ${
              activeTab === tab.id 
                ? 'bg-slate-900 text-white shadow-[4px_4px_0px_0px_rgba(255,107,0,1)]' 
                : 'bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            <tab.icon size={16} />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* Tab 1: SUBSTITUTE PLANS */}
        {activeTab === 'substitute' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8"
          >
            {/* Parameters Block */}
            <div className="lg:col-span-5 bg-white border-4 border-slate-900 rounded-[2rem] p-6 space-y-6">
              <h3 className="text-lg font-black text-slate-900 uppercase flex items-center">
                <Sparkles className="mr-2 text-indigo-600 animate-pulse" size={18} />
                Substitute Generator
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-black text-slate-500 uppercase block mb-1.5">Target Grade</label>
                  <select
                    value={subGrade}
                    onChange={(e) => setSubGrade(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-900 rounded-xl text-xs font-black uppercase focus:outline-none"
                  >
                    <option>Grade 1-2</option>
                    <option>Grade 3-5</option>
                    <option>Grade 6-8</option>
                    <option>Grade 9-10</option>
                    <option>Grade 11-12</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-black text-slate-500 uppercase block mb-1.5">Space Limit / Weather Option</label>
                  <select
                    value={subLocation}
                    onChange={(e) => setSubLocation(e.target.value as any)}
                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-900 rounded-xl text-xs font-black uppercase focus:outline-none"
                  >
                    <option value="Indoor">Indoor Hallway</option>
                    <option value="No-Ground (Rain)">Under Shed / Rainy Day</option>
                    <option value="Classroom">Classroom (Desk Bound)</option>
                    <option value="Small Corridor">Small Corridor</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-black text-slate-500 uppercase block mb-1.5">Class Volume</label>
                  <select
                    value={subSize}
                    onChange={(e) => setSubSize(e.target.value as any)}
                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-900 rounded-xl text-xs font-black uppercase focus:outline-none"
                  >
                    <option value="Small Class (<15)">Small Class (&lt;15 students)</option>
                    <option value="Standard (20-30)">Standard (20-30 students)</option>
                    <option value="Large Class (40-60)">Large / Combined Class (40-60 students)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-black text-slate-500 uppercase block mb-1.5">Equipment Constraints</label>
                  <select
                    value={subEquipment}
                    onChange={(e) => setSubEquipment(e.target.value as any)}
                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-900 rounded-xl text-xs font-black uppercase focus:outline-none"
                  >
                    <option value="None">Zero Equipment (Bodyweight/Paper)</option>
                    <option value="Cones Only">Cones & Chalk Only</option>
                    <option value="Full Equipment">Standard PE Equipment</option>
                  </select>
                </div>

                <button
                  onClick={handleGenerateSubstitutePlan}
                  disabled={subLoading}
                  className="w-full py-4 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-widest border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] hover:bg-indigo-700 transition-all active:translate-y-0.5 active:shadow-none"
                >
                  {subLoading ? 'Structuring Session Plan...' : 'Generate Emergency Plan'}
                </button>
              </div>
            </div>

            {/* Output Block */}
            <div className="lg:col-span-7">
              {generatedSubPlan ? (
                <div className="bg-[#FFFDF9] border-4 border-slate-900 rounded-[2rem] p-6 md:p-8 space-y-6 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)]">
                  <div className="flex justify-between items-start border-b-2 border-slate-200 pb-4">
                    <div>
                      <h4 className="text-xl font-black text-slate-900 uppercase">{generatedSubPlan.title}</h4>
                      <p className="text-xs text-[#FF6B00] font-black uppercase tracking-wider mt-1">{generatedSubPlan.focus}</p>
                    </div>
                    <button 
                      onClick={() => window.print()}
                      className="p-2 border-2 border-slate-900 rounded-xl hover:bg-slate-50 transition-colors"
                      title="Print Plan"
                    >
                      <Printer size={16} />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 border-2 border-slate-900 rounded-2xl p-4 text-[11px] font-bold uppercase text-slate-700">
                    <div>
                      <span className="text-slate-400 block text-[9px] font-black">Grades</span>
                      {subGrade}
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px] font-black">Space</span>
                      {generatedSubPlan.space}
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px] font-black">Group Size</span>
                      {generatedSubPlan.classSize}
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px] font-black">Equipment</span>
                      {subEquipment}
                    </div>
                  </div>

                  {/* Objectives */}
                  <div className="space-y-2">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Expected Outcomes</span>
                    <ul className="list-disc pl-5 text-xs text-slate-600 font-medium space-y-1">
                      {generatedSubPlan.objectives.map((obj: string, i: number) => (
                        <li key={i}>{obj}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Warmup */}
                  <div className="space-y-3 bg-indigo-50/50 p-4 rounded-2xl border-2 border-slate-900">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-black text-indigo-900 uppercase">Warm-up Drill</span>
                      <span className="text-[10px] font-black bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-md border border-indigo-200">8 MIN</span>
                    </div>
                    <h5 className="font-bold text-slate-900 text-sm">{generatedSubPlan.warmup.title}</h5>
                    <ul className="text-xs text-slate-600 font-medium space-y-2 pl-4 list-decimal">
                      {generatedSubPlan.warmup.steps.map((st: string, i: number) => (
                        <li key={i} className="leading-relaxed">{st}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Activities */}
                  <div className="space-y-4">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest block">Main Lesson Drills</span>
                    {generatedSubPlan.mainActivities.map((act: any, i: number) => (
                      <div key={i} className="p-4 border-2 border-slate-900 rounded-2xl space-y-2 bg-white">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-1.5">
                          <h6 className="font-bold text-slate-900 text-sm">{act.name}</h6>
                          <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md border border-emerald-200 uppercase">{act.duration}</span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed font-semibold">{act.desc}</p>
                      </div>
                    ))}
                  </div>

                  {/* Cooldown */}
                  <div className="space-y-3 bg-amber-50/50 p-4 rounded-2xl border-2 border-slate-900">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-black text-amber-900 uppercase">Recovery & Debrief</span>
                      <span className="text-[10px] font-black bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md border border-amber-200">7 MIN</span>
                    </div>
                    <h5 className="font-bold text-slate-900 text-sm">{generatedSubPlan.cooldown.title}</h5>
                    <ul className="text-xs text-slate-600 font-medium space-y-2 pl-4 list-decimal">
                      {generatedSubPlan.cooldown.steps.map((st: string, i: number) => (
                        <li key={i} className="leading-relaxed">{st}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="h-full min-h-[350px] border-4 border-dashed border-slate-300 rounded-[2rem] flex flex-col items-center justify-center p-8 text-center text-slate-400 bg-slate-50">
                  <FileText className="mb-4" size={48} />
                  <p className="font-bold text-slate-700 uppercase">Emergency Plan Window</p>
                  <p className="text-xs max-w-sm mt-1">Configure class limits and environmental constraints on the left, then click Generate to create an inspection-ready physical class plan.</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Tab 2: SPORTS EQUIPMENT LOG */}
        {activeTab === 'equipment' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Header controls */}
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-black text-slate-900 uppercase">Sports Asset Directory</h3>
              <button
                onClick={() => setIsAddingEq(!isAddingEq)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-widest border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] flex items-center space-x-1.5 active:translate-y-0.5"
              >
                <Plus size={14} />
                <span>Add Item</span>
              </button>
            </div>

            {/* Quick Add Form */}
            {isAddingEq && (
              <div className="p-6 bg-slate-50 border-4 border-slate-900 rounded-2xl grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">Item Title</label>
                  <input
                    type="text"
                    value={newEqName}
                    onChange={(e) => setNewEqName(e.target.value)}
                    placeholder="e.g. Size 4 Footballs"
                    className="w-full px-3 py-2 bg-white border-2 border-slate-900 rounded-lg text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">Total Quantity</label>
                  <input
                    type="number"
                    min={1}
                    value={newEqTotal}
                    onChange={(e) => setNewEqTotal(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="w-full px-3 py-2 bg-white border-2 border-slate-900 rounded-lg text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">Storage Location</label>
                  <input
                    type="text"
                    value={newEqLocation}
                    onChange={(e) => setNewEqLocation(e.target.value)}
                    placeholder="e.g. Cabinet C"
                    className="w-full px-3 py-2 bg-white border-2 border-slate-900 rounded-lg text-xs font-bold"
                  />
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={handleAddEquipment}
                    className="flex-1 py-2 bg-emerald-600 text-white rounded-lg text-xs font-black uppercase border-2 border-slate-900"
                  >
                    Save Asset
                  </button>
                  <button
                    onClick={() => setIsAddingEq(false)}
                    className="py-2 px-3 bg-white text-slate-700 border-2 border-slate-900 rounded-lg text-xs font-black uppercase"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Asset Table */}
            <div className="bg-white border-4 border-slate-900 rounded-2xl overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-wider border-b-4 border-slate-900">
                    <th className="p-4">Item Name</th>
                    <th className="p-4">Quantity</th>
                    <th className="p-4">Status & Quality</th>
                    <th className="p-4">Location</th>
                    <th className="p-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-slate-100 text-xs font-bold">
                  {equipmentList.map((eq) => (
                    <tr key={eq.id} className="hover:bg-slate-50">
                      <td className="p-4 font-black text-slate-800">{eq.name}</td>
                      <td className="p-4 text-slate-600">
                        Total: <strong className="text-slate-950 font-black">{eq.total}</strong> &bull; Available: {eq.available}
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase border ${
                          eq.condition === 'Excellent' ? 'bg-emerald-50 text-emerald-700 border-emerald-300' :
                          eq.condition === 'Good' ? 'bg-indigo-50 text-indigo-700 border-indigo-300' :
                          eq.condition === 'Needs Service' ? 'bg-amber-50 text-amber-700 border-amber-300' :
                          'bg-rose-50 text-rose-700 border-rose-300'
                        }`}>
                          {eq.condition}
                        </span>
                      </td>
                      <td className="p-4 text-slate-500 font-semibold">{eq.location}</td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => handleDeleteEquipment(eq.id)}
                          className="text-rose-600 hover:text-rose-800 p-1 rounded-lg hover:bg-rose-50 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* Tab 3: HOUSE POINTS */}
        {activeTab === 'house-points' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8"
          >
            {/* Scoreboard */}
            <div className="lg:col-span-7 bg-white border-4 border-slate-900 rounded-[2rem] p-6 space-y-6">
              <h3 className="text-lg font-black text-slate-900 uppercase flex items-center border-b border-slate-100 pb-3">
                <Trophy className="mr-2 text-amber-500" size={20} />
                Agni / Jal / Prithvi / Vayu Scoreboard
              </h3>

              <div className="space-y-4">
                {houseScores.map((hs) => (
                  <div key={hs.id} className="p-5 border-4 border-slate-900 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <span className={`w-5 h-5 rounded-full border-2 border-slate-900 ${hs.color.split(' ')[0]}`}></span>
                      <div>
                        <h4 className="font-black text-slate-900 text-sm uppercase">{hs.house}</h4>
                        <div className="flex items-center space-x-3 text-[10px] font-bold text-slate-500 uppercase mt-1">
                          <span className="flex items-center"><span className="text-amber-500 mr-1 font-black">🥇</span> {hs.gold} Gold</span>
                          <span className="flex items-center"><span className="text-slate-400 mr-1 font-black">🥈</span> {hs.silver} Silver</span>
                          <span className="flex items-center"><span className="text-amber-700 mr-1 font-black">🥉</span> {hs.bronze} Bronze</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-black text-slate-900 block leading-none">{hs.points}</span>
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Points</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Adjuster */}
            <div className="lg:col-span-5 bg-[#FFFDF9] border-4 border-slate-900 rounded-[2rem] p-6 space-y-6">
              <h3 className="text-lg font-black text-slate-900 uppercase">Award House Points</h3>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-black text-slate-500 uppercase block mb-1.5">Select House</label>
                  <select
                    value={selectedHouseForPoints}
                    onChange={(e) => setSelectedHouseForPoints(e.target.value)}
                    className="w-full px-4 py-3 bg-white border-2 border-slate-900 rounded-xl text-xs font-black uppercase focus:outline-none"
                  >
                    {houseScores.map((hs) => (
                      <option key={hs.id} value={hs.id}>{hs.house}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-black text-slate-500 uppercase block mb-1.5">Action Points</label>
                  <input
                    type="number"
                    min={0}
                    value={pointsAmount}
                    onChange={(e) => setPointsAmount(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    className="w-full px-4 py-3 bg-white border-2 border-slate-900 rounded-xl text-xs font-black"
                  />
                </div>

                <div>
                  <label className="text-xs font-black text-slate-500 uppercase block mb-1.5">Award / Medal Tier</label>
                  <select
                    value={medalType}
                    onChange={(e) => setMedalType(e.target.value as any)}
                    className="w-full px-4 py-3 bg-white border-2 border-slate-900 rounded-xl text-xs font-black uppercase focus:outline-none"
                  >
                    <option value="None">No Medal (Points Only)</option>
                    <option value="Gold">Gold Medal (+1 tally)</option>
                    <option value="Silver">Silver Medal (+1 tally)</option>
                    <option value="Bronze">Bronze Medal (+1 tally)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-black text-slate-500 uppercase block mb-1.5">Reason / Event Title</label>
                  <input
                    type="text"
                    value={pointsReason}
                    onChange={(e) => setPointsReason(e.target.value)}
                    className="w-full px-4 py-3 bg-white border-2 border-slate-900 rounded-xl text-xs font-bold"
                  />
                </div>

                <button
                  onClick={handleApplyHousePoints}
                  className="w-full py-4 bg-[#FF6B00] text-white rounded-xl font-black text-xs uppercase tracking-widest border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] hover:bg-orange-600 transition-all active:translate-y-0.5 active:shadow-none"
                >
                  Award Points
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DepartmentOffice;
