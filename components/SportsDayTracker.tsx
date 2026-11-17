import React, { useState, useEffect, useRef } from 'react';
import { Trophy, Save, Upload, Shield, Award, Medal, Users, UserPlus, Plus, X } from 'lucide-react';
import { auth, db } from '../services/firebase.ts';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { fitnessService, SchoolMember } from '../services/fitnessService.ts';
import { isBrandSuperAdmin } from '../types';
import { toast } from '../services/toast.ts';

const DEFAULT_HOUSES = ['MARS', 'NEPTUNE', 'URANUS', 'VENUS'];

const DEFAULT_EVENTS = [
  { id: '1', name: '800 MTS', category: 'SUPER SENIOR', gender: 'B', mars: 0, neptune: 0, uranus: 0, venus: 0 },
  { id: '2', name: '800 MTS', category: 'SUPER SENIOR', gender: 'G', mars: 0, neptune: 0, uranus: 0, venus: 0 },
  { id: '3', name: '400 MTS', category: 'SENIORS', gender: 'B', mars: 0, neptune: 0, uranus: 0, venus: 0 },
  { id: '4', name: '400 MTS', category: 'SENIORS', gender: 'G', mars: 0, neptune: 0, uranus: 0, venus: 0 },
  { id: '5', name: '100 MTS', category: 'SENIORS', gender: 'G', mars: 0, neptune: 0, uranus: 0, venus: 0 },
  { id: '6', name: '100 MTS', category: 'SENIORS', gender: 'B', mars: 0, neptune: 0, uranus: 0, venus: 0 },
  { id: '7', name: '75 MTS', category: 'Grade 3', gender: 'B', mars: 0, neptune: 0, uranus: 0, venus: 0 },
  { id: '8', name: '75 MTS', category: 'Grade 3', gender: 'G', mars: 0, neptune: 0, uranus: 0, venus: 0 },
  { id: '9', name: '75 MTS', category: 'Grade 4', gender: 'B', mars: 0, neptune: 0, uranus: 0, venus: 0 },
  { id: '10', name: '75 MTS', category: 'Grade 4', gender: 'G', mars: 0, neptune: 0, uranus: 0, venus: 0 },
  { id: '11', name: '75 MTS', category: 'Grade 5', gender: 'B', mars: 0, neptune: 0, uranus: 0, venus: 0 },
  { id: '12', name: '75 MTS', category: 'Grade 5', gender: 'G', mars: 0, neptune: 0, uranus: 0, venus: 0 },
  { id: '13', name: '100 MTS', category: 'SUB JUNIOR', gender: 'B', mars: 0, neptune: 0, uranus: 0, venus: 0 },
  { id: '14', name: '100 MTS', category: 'SUB JUNIOR', gender: 'G', mars: 0, neptune: 0, uranus: 0, venus: 0 },
  { id: '15', name: '100 MTS', category: 'JUNIOR', gender: 'B', mars: 0, neptune: 0, uranus: 0, venus: 0 },
  { id: '16', name: '100 MTS', category: 'JUNIOR', gender: 'G', mars: 0, neptune: 0, uranus: 0, venus: 0 },
  { id: '17', name: '100 MTS', category: 'SUPER SENIOR', gender: 'B', mars: 0, neptune: 0, uranus: 0, venus: 0 },
  { id: '18', name: '100 MTS', category: 'SUPER SENIOR', gender: 'G', mars: 0, neptune: 0, uranus: 0, venus: 0 },
  { id: '19', name: '50 MTS HURDLES', category: 'Grade 3', gender: 'B', mars: 0, neptune: 0, uranus: 0, venus: 0 },
  { id: '20', name: '50 MTS HURDLES', category: 'Grade 3', gender: 'G', mars: 0, neptune: 0, uranus: 0, venus: 0 },
  { id: '21', name: '200 MTS', category: 'SUPER SENIOR', gender: 'B', mars: 0, neptune: 0, uranus: 0, venus: 0 },
  { id: '22', name: '200 MTS', category: 'SUPER SENIOR', gender: 'G', mars: 0, neptune: 0, uranus: 0, venus: 0 },
  { id: '23', name: '200 MTS', category: 'SENIORS', gender: 'B', mars: 0, neptune: 0, uranus: 0, venus: 0 },
  { id: '24', name: '200 MTS', category: 'SENIORS', gender: 'G', mars: 0, neptune: 0, uranus: 0, venus: 0 },
  { id: '25', name: '200 MTS', category: 'JUNIOR', gender: 'B', mars: 0, neptune: 0, uranus: 0, venus: 0 },
  { id: '26', name: '200 MTS', category: 'JUNIOR', gender: 'G', mars: 0, neptune: 0, uranus: 0, venus: 0 },
  { id: '27', name: '200 MTS', category: 'SUB JUNIOR', gender: 'B', mars: 0, neptune: 0, uranus: 0, venus: 0 },
  { id: '28', name: '200 MTS', category: 'SUB JUNIOR', gender: 'G', mars: 0, neptune: 0, uranus: 0, venus: 0 },
  { id: '29', name: '4*25 MTS RELAY', category: 'Grade 4', gender: 'B', mars: 0, neptune: 0, uranus: 0, venus: 0 },
  { id: '30', name: '4*25 MTS RELAY', category: 'Grade 4', gender: 'G', mars: 0, neptune: 0, uranus: 0, venus: 0 },
  { id: '31', name: '4*25 MTS RELAY', category: 'Grade 5', gender: 'B', mars: 0, neptune: 0, uranus: 0, venus: 0 },
  { id: '32', name: '4*25 MTS RELAY', category: 'Grade 5', gender: 'G', mars: 0, neptune: 0, uranus: 0, venus: 0 },
  { id: '33', name: '4*100 MTS RELAY', category: 'SUB JUNIOR', gender: 'B', mars: 0, neptune: 0, uranus: 0, venus: 0 },
  { id: '34', name: '4*100 MTS RELAY', category: 'SUB JUNIOR', gender: 'G', mars: 0, neptune: 0, uranus: 0, venus: 0 },
  { id: '35', name: '4*100 MTS RELAY', category: 'JUNIOR', gender: 'B', mars: 0, neptune: 0, uranus: 0, venus: 0 },
  { id: '36', name: '4*100 MTS RELAY', category: 'JUNIOR', gender: 'G', mars: 0, neptune: 0, uranus: 0, venus: 0 },
  { id: '37', name: '4*100 MTS RELAY', category: 'SENIORS', gender: 'B', mars: 0, neptune: 0, uranus: 0, venus: 0 },
  { id: '38', name: '4*100 MTS RELAY', category: 'SENIORS', gender: 'G', mars: 0, neptune: 0, uranus: 0, venus: 0 },
  { id: '39', name: '4*100 MTS RELAY', category: 'SUPER SENIOR', gender: 'B', mars: 0, neptune: 0, uranus: 0, venus: 0 },
  { id: '40', name: '4*100 MTS RELAY', category: 'SUPER SENIOR', gender: 'G', mars: 0, neptune: 0, uranus: 0, venus: 0 },
  { id: '41', name: 'MIXED RELAY', category: 'ALL', gender: 'MIX', mars: 0, neptune: 0, uranus: 0, venus: 0 },
  { id: '42', name: 'March past', category: 'ALL', gender: 'ALL', mars: 0, neptune: 0, uranus: 0, venus: 0 },
];

const INDIVIDUAL_CHAMPIONS = [
  { id: 'c1', title: 'Super Senior Boys' },
  { id: 'c2', title: 'Super Senior Girls' },
  { id: 'c3', title: 'Senior Boys' },
  { id: 'c4', title: 'Senior Girls' },
  { id: 'c5', title: 'Junior Boys' },
  { id: 'c6', title: 'Junior Girls' },
  { id: 'c7', title: 'Sub Junior Boys' },
  { id: 'c8', title: 'Sub Junior Girls' },
];

const INITIAL_BASE_SCORE = { mars: 692, neptune: 557, uranus: 348, venus: 515 };

const SportsDayTracker: React.FC = () => {
  const [houses, setHouses] = useState(DEFAULT_HOUSES);
  const [events, setEvents] = useState<any[]>(DEFAULT_EVENTS);
  const [baseScores, setBaseScores] = useState<{ [key: string]: number }>(INITIAL_BASE_SCORE);
  const [champions, setChampions] = useState<{ [key: string]: { name: string, house: string, events: string } }>({});
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [isEditingSettings, setIsEditingSettings] = useState(false);
  const [isAddingHouse, setIsAddingHouse] = useState(false);
  const [newHouseName, setNewHouseName] = useState('');
  const [isAddingEvent, setIsAddingEvent] = useState(false);
  const [newEventName, setNewEventName] = useState('');
  const [newEventCategory, setNewEventCategory] = useState('SENIORS');
  const [newEventGender, setNewEventGender] = useState('B');
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    let unsub: (() => void) | undefined;

    const fetchProfileAndData = async () => {
      if (!auth.currentUser) {
        // Fallback to local storage for unauthenticated users
        const savedData = localStorage.getItem('sportsDayData');
        if (savedData) {
          try {
            const parsed = JSON.parse(savedData);
            if (parsed.houses) setHouses(parsed.houses);
            if (parsed.events) setEvents(parsed.events);
            if (parsed.baseScores) setBaseScores(parsed.baseScores);
            if (parsed.champions) setChampions(parsed.champions);
          } catch (e) {
            console.error("Failed to load local sports day data", e);
          }
        }
        setLoading(false);
        return;
      }

      try {
        const profile = await fitnessService.getSchoolMember(auth.currentUser.uid);
        const isSuperAdmin = isBrandSuperAdmin(auth.currentUser.email);
        
        let sId = profile?.schoolId;
        if (!sId) {
          sId = isSuperAdmin ? 'master_registry' : `personal_${auth.currentUser.uid}`;
        }
        setSchoolId(sId);

        unsub = onSnapshot(doc(db, 'sportsDays', sId), (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.houses) setHouses(JSON.parse(data.houses));
            if (data.events) setEvents(JSON.parse(data.events));
            if (data.baseScores) setBaseScores(JSON.parse(data.baseScores));
            if (data.champions) setChampions(JSON.parse(data.champions));
          } else {
            // Load from local storage as fallback for first time setup if exists
            const savedData = localStorage.getItem('sportsDayData');
            if (savedData) {
              try {
                const parsed = JSON.parse(savedData);
                if (parsed.houses) setHouses(parsed.houses);
                if (parsed.events) setEvents(parsed.events);
                if (parsed.baseScores) setBaseScores(parsed.baseScores);
                if (parsed.champions) setChampions(parsed.champions);
              } catch (e) {
                console.error("Failed to load local sports day data", e);
              }
            }
          }
          setLoading(false);
        }, (error) => {
           console.error('Firestore Error: ', error);
           setLoading(false);
        });

      } catch (err) {
        console.error("Error in SportsDayTracker data fetch:", err);
        setLoading(false);
      }
    };

    fetchProfileAndData();

    return () => unsub?.();
  }, [auth.currentUser?.uid]);

  const handleScoreChange = (id: string, house: string, value: string) => {
    const numValue = value === '' ? 0 : parseInt(value, 10);
    if (isNaN(numValue)) return;
    
    setEvents(events.map(ev => 
      ev.id === id ? { ...ev, [house]: numValue } : ev
    ));
    setSaved(false);
  };

  const handleBaseScoreChange = (house: string, value: string) => {
    const numValue = value === '' ? 0 : parseInt(value, 10);
    if (isNaN(numValue)) return;
    
    setBaseScores({ ...baseScores, [house]: numValue });
    setSaved(false);
  };

  const handleChampionChange = (id: string, field: string, value: string) => {
    setChampions({
      ...champions,
      [id]: {
        ...champions[id] || { name: '', house: '', events: '' },
        [field]: value
      }
    });
    setSaved(false);
  };

  const saveData = async () => {
    // Always save to local storage as backup / for unauthenticated users
    localStorage.setItem('sportsDayData', JSON.stringify({ houses, events, baseScores, champions }));
    
    if (!schoolId || !auth.currentUser) {
      setSaved(true);
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => setSaved(false), 3000);
      return;
    }
    
    try {
      await setDoc(doc(db, 'sportsDays', schoolId), {
        schoolId,
        houses: JSON.stringify(houses),
        events: JSON.stringify(events),
        baseScores: JSON.stringify(baseScores),
        champions: JSON.stringify(champions),
        updatedAt: new Date().toISOString(),
        updatedBy: auth.currentUser.uid
      });
      
      setSaved(true);
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error("Failed to save sports day data:", err);
      toast.error("Failed to save data. Please check permissions.");
    }
  };

  const getHouseTotal = (house: string) => {
    return events.reduce((sum, ev) => {
       const score = ev[house] !== undefined ? ev[house] : ev[house.toLowerCase()];
       return sum + (score as number || 0);
    }, 0);
  };

  const getGrandTotal = (house: string) => {
    const base = baseScores[house] !== undefined ? baseScores[house] : baseScores[house.toLowerCase()];
    return (base || 0) + getHouseTotal(house);
  };

  const handleAddHouse = (e?: React.FormEvent) => {
    e?.preventDefault();
    const cleaned = newHouseName.trim().toUpperCase();
    if (!cleaned) {
      toast.error("Please enter a house name.");
      return;
    }
    if (houses.some(h => h.toUpperCase() === cleaned)) {
      toast.error(`House "${cleaned}" already exists.`);
      return;
    }
    setHouses([...houses, cleaned]);
    setBaseScores({ ...baseScores, [cleaned]: 0 });
    setNewHouseName('');
    setIsAddingHouse(false);
    setSaved(false);
    toast.success(`House "${cleaned}" added!`);
  };

  const handleRemoveHouse = (houseToRemove: string) => {
    toast.confirm(`Are you sure you want to remove ${houseToRemove}? This will not delete points from existing events, but will hide the house from the tracker.`, () => {
      setHouses(houses.filter(h => h !== houseToRemove));
      setSaved(false);
    });
  };

  const handleAddEvent = (e?: React.FormEvent) => {
    e?.preventDefault();
    const name = newEventName.trim().toUpperCase();
    const category = newEventCategory.trim().toUpperCase();
    const gender = newEventGender.trim().toUpperCase();
    if (!name || !category || !gender) {
      toast.error("Please fill in event name, category, and gender.");
      return;
    }
    const newEvent: any = { id: Date.now().toString(), name, category, gender };
    houses.forEach(h => { newEvent[h] = 0; });
    setEvents([...events, newEvent]);
    setNewEventName('');
    setIsAddingEvent(false);
    setSaved(false);
    toast.success(`Event "${name}" added!`);
  };

  const handleRemoveEvent = (idToRemove: string) => {
    toast.confirm("Are you sure you want to remove this event?", () => {
      setEvents(events.filter(e => e.id !== idToRemove));
      setSaved(false);
    });
  };

  const getEventScore = (ev: any, house: string) => {
    return ev[house] !== undefined ? ev[house] : ev[house.toLowerCase()] || '';
  };

  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8 min-h-screen animate-in zoom-in-95">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 pb-6 border-b border-slate-100">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <Trophy className="text-yellow-500" size={32} />
            Sports Day Points Tracker
          </h2>
          <p className="text-slate-500 font-medium mt-2">Manage house points and track individual champions across all events.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setIsEditingSettings(!isEditingSettings)}
            className={`flex items-center space-x-2 px-6 py-3 rounded-2xl font-bold transition-all ${isEditingSettings ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
          >
            <span>{isEditingSettings ? 'Close Settings' : 'Edit Settings'}</span>
          </button>
          <button 
            onClick={saveData}
            className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-md"
          >
            <Save size={18} />
            <span>{saved ? 'Saved!' : 'Save Progress'}</span>
          </button>
        </div>
      </div>

      {!auth.currentUser && (
        <div className="mb-8 bg-blue-50 border border-blue-200 text-blue-800 rounded-2xl p-4 flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-3">
            <Shield className="text-blue-500" />
            <div>
              <p className="font-bold">You are currently using offline mode.</p>
              <p className="text-sm">Sign in and ask your admin to add you as a teacher to collaborate and share data with other teachers in real-time.</p>
            </div>
          </div>
        </div>
      )}

      {isEditingSettings && (
        <div className="mb-10 bg-slate-50 p-6 rounded-2xl border border-slate-200 animate-in fade-in slide-in-from-top-4 space-y-6">
          <h3 className="text-xl font-black text-slate-800">Tracker Settings</h3>
          
          <div>
            <h4 className="font-bold text-slate-700 mb-2">Houses</h4>
            <div className="flex flex-wrap gap-2 mb-3">
              {houses.map(house => (
                <div key={house} className="bg-white border border-slate-200 rounded-lg px-4 py-2 flex items-center gap-2">
                  <span className="font-bold text-sm text-indigo-700">{house}</span>
                  <button type="button" onClick={() => handleRemoveHouse(house)} className="text-red-500 hover:text-red-700 font-black px-1">&times;</button>
                </div>
              ))}
              {!isAddingHouse && (
                <button type="button" onClick={() => setIsAddingHouse(true)} className="bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg px-4 py-2 text-sm font-bold hover:bg-indigo-200">+ Add House</button>
              )}
            </div>
            {isAddingHouse && (
              <form onSubmit={handleAddHouse} className="flex flex-wrap items-center gap-2 bg-white p-3 rounded-xl border border-indigo-200">
                <input
                  type="text"
                  value={newHouseName}
                  onChange={e => setNewHouseName(e.target.value)}
                  placeholder="House name (e.g. JUPITER)"
                  className="flex-1 min-w-[180px] px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-400"
                />
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-black uppercase">Add</button>
                <button type="button" onClick={() => { setIsAddingHouse(false); setNewHouseName(''); }} className="px-3 py-2 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold">Cancel</button>
              </form>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold text-slate-700">Events</h4>
              {!isAddingEvent && (
                <button type="button" onClick={() => setIsAddingEvent(true)} className="bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg px-4 py-2 text-sm font-bold hover:bg-indigo-200">+ Add New Event</button>
              )}
            </div>
            {isAddingEvent && (
              <form onSubmit={handleAddEvent} className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-white p-4 rounded-xl border border-indigo-200">
                <input
                  type="text"
                  value={newEventName}
                  onChange={e => setNewEventName(e.target.value)}
                  placeholder="Event name (e.g. 100 MTS)"
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-400"
                />
                <input
                  type="text"
                  value={newEventCategory}
                  onChange={e => setNewEventCategory(e.target.value)}
                  placeholder="Category (e.g. SENIORS)"
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-400"
                />
                <select
                  value={newEventGender}
                  onChange={e => setNewEventGender(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-400"
                >
                  <option value="B">Boys (B)</option>
                  <option value="G">Girls (G)</option>
                  <option value="MIX">Mixed (MIX)</option>
                  <option value="ALL">All</option>
                </select>
                <div className="flex items-center gap-2">
                  <button type="submit" className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-black uppercase">Add Event</button>
                  <button type="button" onClick={() => { setIsAddingEvent(false); setNewEventName(''); }} className="px-3 py-2 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold">Cancel</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-10">
        {houses.map((house) => (
          <div key={house} className="bg-slate-50 rounded-3xl p-6 border border-slate-100 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Shield size={64} />
            </div>
            <h3 className="text-lg font-black text-slate-700 mb-1">{house}</h3>
            <div className="text-4xl font-black text-indigo-600 my-4">
              {getGrandTotal(house)}
            </div>
            <div className="flex justify-between items-center text-sm font-medium text-slate-500 mt-4 pt-4 border-t border-slate-200">
              <span>Base: <input type="number" value={baseScores[house] !== undefined ? baseScores[house] : baseScores[house.toLowerCase()] || 0} onChange={(e) => handleBaseScoreChange(house, e.target.value)} className="w-16 bg-white border border-slate-200 rounded px-2 py-1 text-center font-bold inline-block ml-1" /></span>
              <span>New: +{getHouseTotal(house)}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="mb-12">
        <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
          <Users className="text-indigo-500" /> Event Scoring
        </h3>
        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100">
                <th className="py-4 px-6 font-bold text-slate-700 text-sm uppercase tracking-wider">Game / Event</th>
                <th className="py-4 px-6 font-bold text-slate-700 text-sm uppercase tracking-wider">Category</th>
                <th className="py-4 px-6 font-bold text-slate-700 text-sm uppercase tracking-wider text-center">B/G</th>
                {houses.map(house => (
                  <th key={house} className="py-4 px-6 font-black text-slate-800 text-sm uppercase tracking-wider text-center">{house}</th>
                ))}
                {isEditingSettings && <th className="py-4 px-6"></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {events.map((ev, index) => (
                <tr key={ev.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-6 font-bold text-slate-800 text-sm">{ev.name}</td>
                  <td className="py-3 px-6 text-slate-600 text-sm font-medium">{ev.category}</td>
                  <td className="py-3 px-6 text-center text-slate-600 text-sm font-black">{ev.gender}</td>
                  {houses.map(house => (
                    <td key={house} className="py-3 px-6 text-center">
                      <input 
                        type="number" 
                        min="0"
                        className="w-16 text-center py-2 px-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-bold"
                        value={getEventScore(ev, house)}
                        onChange={(e) => handleScoreChange(ev.id, house, e.target.value)}
                      />
                    </td>
                  ))}
                  {isEditingSettings && (
                     <td className="py-3 px-6 text-center">
                       <button onClick={() => handleRemoveEvent(ev.id)} className="text-red-500 hover:text-red-700 font-bold text-sm">Remove</button>
                     </td>
                  )}
                </tr>
              ))}
              <tr className="bg-indigo-50">
                <td colSpan={3} className="py-4 px-6 font-black text-indigo-900 text-right uppercase tracking-wider">Final Total Points</td>
                {houses.map(house => (
                  <td key={house} className="py-4 px-6 font-black text-indigo-700 text-center text-lg">{getGrandTotal(house)}</td>
                ))}
                {isEditingSettings && <td></td>}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
          <Medal className="text-yellow-500" /> Individual Champions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {INDIVIDUAL_CHAMPIONS.map(champ => {
            const data = champions[champ.id] || { name: '', house: '', events: '' };
            return (
              <div key={champ.id} className="bg-white border-2 border-slate-100 rounded-3xl p-6 hover:border-indigo-100 transition-colors">
                <h4 className="font-black text-lg text-indigo-900 mb-4 uppercase tracking-tight flex items-center gap-2">
                  <Award size={20} className="text-indigo-400" /> {champ.title}
                </h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Student Name</label>
                    <input 
                      type="text" 
                      placeholder="Enter full name"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      value={data.name}
                      onChange={(e) => handleChampionChange(champ.id, 'name', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">House</label>
                    <select 
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      value={data.house}
                      onChange={(e) => handleChampionChange(champ.id, 'house', e.target.value)}
                    >
                      <option value="">Select House</option>
                      {houses.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Events Won & Points</label>
                    <textarea 
                      placeholder="e.g. 100m (10 pts), 200m (10 pts) - Total 20"
                      rows={2}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      value={data.events}
                      onChange={(e) => handleChampionChange(champ.id, 'events', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SportsDayTracker;
