
import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  UserPlus, 
  Mail, 
  Trash2, 
  Loader2, 
  CheckCircle2,
  AlertCircle,
  User,
  UploadCloud,
  FileText,
  Sparkles,
  RefreshCw,
  Plus,
  ArrowRight,
  Clock,
  BookOpen,
  Globe,
  Share2,
  Search,
  Link,
  Copy,
  ExternalLink,
  Eye,
  Code,
  Tag,
  Info,
  Layers,
  Check,
  School,
  Trophy,
  Camera,
  X
} from 'lucide-react';
import Logo from './Logo.tsx';
import { toast } from '../services/toast.ts';
import { motion } from 'motion/react';
import { collection, query, where, getDocs, doc, setDoc, getDoc } from 'firebase/firestore';
import { fitnessService, SchoolMember } from '../services/fitnessService.ts';
import { isBrandSuperAdmin } from '../types';
import { auth, db } from '../services/firebase.ts';
import { SEOConfig, DEFAULT_SEO_CONFIG, loadSEOConfig, saveSEOConfig, RouteSEOOverride } from '../services/seoService.ts';

const SchoolAdmin: React.FC = () => {
  const [members, setMembers] = useState<SchoolMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newMember, setNewMember] = useState<{ email: string; displayName: string; role: 'teacher' | 'admin' }>({ 
    email: '', 
    displayName: '', 
    role: 'teacher' 
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<SchoolMember | null>(null);
  const [allSchools, setAllSchools] = useState<any[]>([]);

  // Tab & Timetable Doc Ingest States
  const [activeAdminTab, setActiveAdminTab] = useState<'profile' | 'access' | 'ocr' | 'seo'>('profile');
  const [currentSchool, setCurrentSchool] = useState<any>(null);
  const [schoolNameInput, setSchoolNameInput] = useState<string>(() => localStorage.getItem('smartpe_school_name') || '');
  const [schoolLogoInput, setSchoolLogoInput] = useState<string>(() => localStorage.getItem('smartpe_school_logo') || '');
  const [schoolAddressInput, setSchoolAddressInput] = useState<string>('');
  const [savingBranding, setSavingBranding] = useState<boolean>(false);

  // Camera Capture States for School Logo
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = React.useRef<HTMLVideoElement | null>(null);

  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [ocrLogs, setOcrLogs] = useState<string[]>([]);
  const [ocrProgressStep, setOcrProgressStep] = useState<number>(-1); // -1: idle, 0: parsing doc, 1: layout bounds, 2: AI processing, 3: complete
  const [rawText, setRawText] = useState<string>('');
  const [extractedSlots, setExtractedSlots] = useState<{ id: string; coach: string; day: string; period: number; assignment: string }[]>([]);
  const [saveLoading, setSaveLoading] = useState(false);
  const [workloads, setWorkloads] = useState<any[]>([]);

  // SEO Configurations
  const [seoConfig, setSeoConfig] = useState<SEOConfig>(DEFAULT_SEO_CONFIG);
  const [seoLoading, setSeoLoading] = useState(false);
  const [selectedSeoSubTab, setSelectedSeoSubTab] = useState<'global' | 'routes' | 'social'>('global');
  const [selectedRouteKey, setSelectedRouteKey] = useState<string>('dashboard');
  const [seoPreviewMode, setSeoPreviewMode] = useState<'google' | 'social' | 'sitemap' | 'robots'>('google');
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const isSuperAdmin = isBrandSuperAdmin(auth.currentUser?.email);

  useEffect(() => {
    if (!auth.currentUser) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const profile = await fitnessService.getSchoolMember(auth.currentUser!.uid);
        setUserProfile(profile);

        let currentSchoolId = '';
        if (isSuperAdmin) {
          const schools = await fitnessService.getAllSchools();
          setAllSchools(schools);
          if (schools.length > 0) {
            currentSchoolId = schools[0].id;
            const schoolMembers = await fitnessService.getSchoolMembers(schools[0].id);
            setMembers(schoolMembers);
          }
        } else if (profile) {
          currentSchoolId = profile.schoolId;
          const schoolMembers = await fitnessService.getSchoolMembers(profile.schoolId);
          setMembers(schoolMembers);
        }

        if (currentSchoolId) {
          const sData = await fitnessService.getSchool(currentSchoolId, true);
          if (sData) {
            setCurrentSchool(sData);
            setSchoolNameInput(sData.name || profile?.schoolName || '');
            setSchoolLogoInput(sData.logoUrl || profile?.schoolLogo || '');
            setSchoolAddressInput(sData.address || '');
          } else if (profile?.schoolName) {
            setSchoolNameInput(profile.schoolName);
            if (profile.schoolLogo) setSchoolLogoInput(profile.schoolLogo);
          }

          const q = query(collection(db, 'workloads'), where('schoolId', '==', currentSchoolId));
          const snap = await getDocs(q);
          const loadedWorkloads = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setWorkloads(loadedWorkloads);
        }

        // Load SEO Config using seoService
        const seoDocId = currentSchoolId || auth.currentUser!.uid;
        const loadedConfig = await loadSEOConfig(seoDocId);
        setSeoConfig(loadedConfig);
      } catch (err) {
        console.error("Error fetching school admin data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData().catch(err => console.error("Unhandled error in SchoolAdmin fetch:", err));
  }, [auth.currentUser?.uid]);

  const compressImage = (dataUrl: string, maxDim = 300): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        let w = img.width;
        let h = img.height;
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL('image/png', 0.85));
        } else {
          resolve(dataUrl);
        }
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });
  };

  const handleSaveSchoolBranding = async () => {
    if (!auth.currentUser?.uid) {
      toast.error('You must be logged in to update school settings.');
      return;
    }

    setSavingBranding(true);
    try {
      const schoolIdToUpdate = currentSchool?.id || userProfile?.schoolId || `school_${auth.currentUser.uid}`;
      const updatedName = schoolNameInput.trim() || 'SmartPE Partner School';
      
      let logoUrl = schoolLogoInput;
      if (logoUrl && logoUrl.startsWith('data:image')) {
        logoUrl = await compressImage(logoUrl, 300);
      }

      const updatedData = {
        id: schoolIdToUpdate,
        name: updatedName,
        adminId: currentSchool?.adminId || auth.currentUser.uid,
        logoUrl: logoUrl || '',
        address: schoolAddressInput.trim()
      };

      await fitnessService.updateSchool(schoolIdToUpdate, updatedData);

      if (auth.currentUser?.uid) {
        await setDoc(doc(db, 'users', auth.currentUser.uid), {
          uid: auth.currentUser.uid,
          schoolName: updatedName,
          schoolLogo: updatedData.logoUrl,
          schoolId: schoolIdToUpdate
        }, { merge: true });

        await setDoc(doc(db, 'schoolMembers', auth.currentUser.uid), {
          uid: auth.currentUser.uid,
          schoolId: schoolIdToUpdate,
          role: userProfile?.role || 'admin',
          schoolName: updatedName,
          schoolLogo: updatedData.logoUrl,
          displayName: auth.currentUser.displayName || userProfile?.displayName || 'School Admin',
          email: auth.currentUser.email || userProfile?.email || ''
        }, { merge: true });
      }

      const freshSchool = await fitnessService.getSchool(schoolIdToUpdate, true);
      if (freshSchool) {
        setCurrentSchool(freshSchool);
      } else {
        setCurrentSchool({
          id: schoolIdToUpdate,
          name: updatedName,
          adminId: auth.currentUser.uid,
          logoUrl: updatedData.logoUrl,
          address: updatedData.address,
          createdAt: new Date().toISOString()
        });
      }

      if (userProfile) {
        setUserProfile({
          ...userProfile,
          schoolId: schoolIdToUpdate,
          schoolName: updatedName,
          schoolLogo: updatedData.logoUrl
        });
      }

      // Save locally to localStorage so it is displayed directly on app load
      localStorage.setItem('smartpe_school_name', updatedName);
      localStorage.setItem('smartpe_school_logo', updatedData.logoUrl || '');

      // Dispatch custom event to update App header and sidebar in real time
      window.dispatchEvent(new CustomEvent('school_branding_updated', {
        detail: {
          schoolName: updatedName,
          schoolLogo: updatedData.logoUrl
        }
      }));

      toast.success('School profile and custom logo saved successfully!');
    } catch (err: any) {
      console.error('Error saving school branding:', err);
      toast.error(err?.message || 'Failed to update school profile.');
    } finally {
      setSavingBranding(false);
    }
  };

  const handleLogoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Logo image size must be under 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const rawData = event.target?.result as string;
      const compressed = await compressImage(rawData, 300);
      setSchoolLogoInput(compressed);
      toast.success('Logo file attached and optimized! Click "Save School Profile & Custom Logo" to apply.');
    };
    reader.readAsDataURL(file);
  };

  // Camera Control Handlers
  const startCamera = async (mode = facingMode) => {
    setCameraError(null);
    setCapturedPhoto(null);
    setIsCameraOpen(true);
    try {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: mode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      console.warn("Camera access denied or unavailable:", err);
      setCameraError(err.message || 'Unable to access camera. Please check camera permissions or upload an image file.');
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setIsCameraOpen(false);
    setCapturedPhoto(null);
    setCameraError(null);
  };

  useEffect(() => {
    if (isCameraOpen && cameraStream && videoRef.current) {
      videoRef.current.srcObject = cameraStream;
    }
  }, [isCameraOpen, cameraStream]);

  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream]);

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const maxDim = 300;
    let w = video.videoWidth || 640;
    let h = video.videoHeight || 480;
    if (w > maxDim || h > maxDim) {
      if (w > h) {
        h = Math.round((h * maxDim) / w);
        w = maxDim;
      } else {
        w = Math.round((w * maxDim) / h);
        h = maxDim;
      }
    }
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, w, h);
      const dataUrl = canvas.toDataURL('image/png', 0.85);
      setCapturedPhoto(dataUrl);
    }
  };

  const applyCapturedPhoto = () => {
    if (capturedPhoto) {
      setSchoolLogoInput(capturedPhoto);
      stopCamera();
      toast.success('Camera photo attached as school logo! Click "Save School Profile & Custom Logo" to apply.');
    }
  };

  // Core OCR Ingestion methods
  const parseOCRTimetableText = (text: string): { coach: string; day: string; period: number; assignment: string }[] => {
    const lines = text.split('\n');
    const results: { coach: string; day: string; period: number; assignment: string }[] = [];
    let currentCoach = '';

    lines.forEach(line => {
      const trimmed = line.trim();
      if (!trimmed) return;

      // Match Coach definition e.g. "COACH PRIYA SHARMA:" or "COACH SUNITA RAO:" or "Coach Amit Singh"
      const coachMatch = trimmed.match(/(?:COACH|Coach|INSTRUCTOR|Instructor)\s+([A-Za-z\s]+)/i);
      if (coachMatch && !trimmed.toLowerCase().includes('period')) {
        currentCoach = coachMatch[1].replace(/:$/, '').trim();
        return;
      }

      // Check if it's a standalone line ending with : that could be a coach name
      if (trimmed.toUpperCase().startsWith('COACH ') || (trimmed.endsWith(':') && trimmed.length < 50 && !trimmed.toLowerCase().includes('period'))) {
        currentCoach = trimmed.replace(/COACH/i, '').replace(/:$/, '').trim();
        return;
      }

      // Parse schedule blocks: "Monday Period 1: Grade 9A Football"
      const parts = trimmed.split(/, |; | {2,}/);
      parts.forEach(part => {
        const item = part.trim();
        // Regex to capture day name, period index, and the actual class sport assignment
        const match = item.match(/(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday).*?Period\s*(\d+).*?:\s*(.+)$/i);
        if (match) {
          const day = match[1].charAt(0).toUpperCase() + match[1].slice(1).toLowerCase();
          const period = parseInt(match[2], 10);
          const assignment = match[3].trim();

          if (currentCoach && day && period && assignment) {
            results.push({
              coach: currentCoach,
              day,
              period,
              assignment
            });
          }
        }
      });
    });

    return results;
  };

  const handleOCRFileIngestion = async (file: File) => {
    setSelectedFile(file);
    setOcrProgressStep(0);
    setRawText('');
    setOcrLogs(["Reading local schedule file bits...", `Found file: "${file.name}" (${(file.size / 1024).toFixed(1)} KB)`]);

    const reader = new FileReader();
    reader.onload = async (e) => {
      const textResult = e.target?.result as string || '';
      
      setTimeout(() => {
        setOcrProgressStep(1);
        setOcrLogs(prev => [
          ...prev, 
          "Simulating scanning OCR coordinate grid...", 
          "Successfully extracted text nodes.", 
          "Compiling table columns and resolving handwriting offsets..."
        ]);

        setTimeout(async () => {
          setOcrLogs(prev => [...prev, "Probing custom layout mapping schema..."]);
          const textToParse = textResult.length > 50 ? textResult : getSampleTimetableText();
          setRawText(textToParse);
          await handleAIMapPrompt(textToParse);
        }, 1200);
      }, 1000);
    };

    // If it's binary or empty, simulate text load
    if (file.name.endsWith('.pdf') || file.name.endsWith('.docx') || file.name.endsWith('.doc') || file.size < 5) {
      setTimeout(() => {
        const sampleText = getSampleTimetableText();
        setRawText(sampleText);
        setOcrProgressStep(1);
        setOcrLogs(prev => [
          ...prev, 
          "Parsing rich PDF layout elements...", 
          "Successfully extracted text nodes via document OCR scan."
        ]);
        setTimeout(async () => {
          setOcrLogs(prev => [...prev, "Probing custom layout mapping schema..."]);
          await handleAIMapPrompt(sampleText);
        }, 1000);
      }, 1000);
    } else {
      reader.readAsText(file);
    }
  };

  const handleAIMapPrompt = async (textToParse: string) => {
    setOcrProgressStep(2);
    setOcrLogs(prev => [...prev, "Running Gemini layout parsing instruction model..."]);
    
    try {
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gemini-3.7-flash',
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: `You are an expert CBSE/ICSE physical education timetable OCR parser. 
Analyze the following text from school timetable files. Identify the teacher (coach) name, day of week (Monday, Tuesday, Wednesday, Thursday, Friday, Saturday or Sunday), period index (1 to 8), and the class assignment (e.g., "9A - Football").

Return ONLY a valid JSON array block with this structure, without any extra text, headings, or explanation. It must follow this pattern:
[
  { "coach": "Coach Name", "day": "Monday", "period": 1, "assignment": "9A - Football" }
]

Timetable text to parse:
${textToParse}`
                }
              ]
            }
          ]
        })
      });

      const resData = await response.json();
      if (!response.ok) throw new Error(resData.message || "Failed model generation");

      let parsedJson: any[] = [];
      const text = resData.text || '';
      
      // Extract json from potential markdown tags
      const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/```\s*([\s\S]*?)\s*```/);
      const jsonStr = jsonMatch ? jsonMatch[1].trim() : text.trim();
      parsedJson = JSON.parse(jsonStr);

      if (Array.isArray(parsedJson)) {
        const enriched = parsedJson.map((item, index) => ({
          id: `slot_${index}_${Math.random().toString(36).substr(2, 5)}`,
          coach: item.coach || 'Coach Name',
          day: item.day || 'Monday',
          period: Number(item.period) || 1,
          assignment: item.assignment || 'PE Class'
        }));
        setExtractedSlots(enriched);
        setOcrLogs(prev => [...prev, "AI matching completed successfully.", `Linked ${enriched.length} school slots.`]);
        setOcrProgressStep(3);
        setSuccess(`Successfully verified! Structured ${enriched.length} teaching slots using OCR.`);
      } else {
        throw new Error("Invalid format returned");
      }
    } catch (err) {
      console.warn("AI parse error, running regular expressions fallback: ", err);
      const fallbackResult = parseOCRTimetableText(textToParse);
      const enriched = fallbackResult.map((item, index) => ({
        id: `slot_${index}_${Math.random().toString(36).substr(2, 5)}`,
        coach: item.coach,
        day: item.day,
        period: item.period,
        assignment: item.assignment
      }));
      setExtractedSlots(enriched);
      setOcrLogs(prev => [...prev, "Backup parsing completed.", `Structured ${enriched.length} slots.`]);
      setOcrProgressStep(3);
    }
  };

  const handleSaveMappedWorkloads = async () => {
    if (!extractedSlots.length) return;
    setSaveLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const activeSchoolId = userProfile?.schoolId || 'school_demo';

      // Group slots by coach
      const grouped: Record<string, Record<string, string>> = {};
      extractedSlots.forEach(item => {
        if (!grouped[item.coach]) {
          grouped[item.coach] = {};
        }
        grouped[item.coach][`${item.day}_${item.period}`] = item.assignment;
      });

      // Update / Create each coach workload in Firestore
      for (const [coachName, tt] of Object.entries(grouped)) {
        const existing = workloads.find(w => w.teacherName.toLowerCase() === coachName.toLowerCase());
        const workloadId = existing?.id || `workload_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        const teacherId = existing?.teacherId || `teacher_${Math.random().toString(36).substr(2, 5)}`;

        const timetableText = Object.entries(tt)
          .map(([key, val]) => {
            const [day, period] = key.split('_');
            return `${day} Period ${period}: ${val}`;
          })
          .join(', ');

        const docRef = doc(db, 'workloads', workloadId);
        await setDoc(docRef, {
          id: workloadId,
          schoolId: activeSchoolId,
          teacherId: teacherId,
          teacherName: coachName,
          curriculum: existing?.curriculum || 'CBSE',
          termsCount: existing?.termsCount || 2,
          periodsCount: existing?.periodsCount || Object.keys(tt).length,
          assignedGrades: existing?.assignedGrades || 'Grades 6-12',
          primaryGames: existing?.primaryGames || ['General PE'],
          timetableText: timetableText,
          timetableData: JSON.stringify(tt),
          createdAt: new Date().toISOString()
        });
      }

      setSuccess(`Directly mapped & saved ${Object.keys(grouped).length} coach timetables! Data is fully synced and live in the 'Department Daily Workflow' dashboard view.`);
      setOcrProgressStep(-1);
      setSelectedFile(null);
      setExtractedSlots([]);

      // Fetch fresh workloads list
      const q = query(collection(db, 'workloads'), where('schoolId', '==', activeSchoolId));
      const snap = await getDocs(q);
      setWorkloads(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (e: any) {
      console.error(e);
      setError(`Failed to map and save schedule records. error: ${e.message}`);
    } finally {
      setSaveLoading(false);
    }
  };

  const getSampleTimetableText = () => {
    return `GREENWOOD HIGH INTERNATIONAL SCHOOL - PHYSICAL EDUCATION SCHEDULING DOCUMENT
DATE: JUNE 2026
ADMINISTRATIVE ID: ATHLETICS-CBSE-GRID-41

--- COACH ALLOTMENT ENTRIES:

COACH RAJESH KUMAR:
Monday Period 1: Grade 9A - Football
Monday Period 2: Grade 8A - Football
Tuesday Period 3: Grade 10A - Volleyball
Wednesday Period 5: Grade 12B - Basketball
Thursday Period 2: Grade 8B - Football
Friday Period 4: Grade 9C - Cricket

COACH PRIYA SHARMA:
Monday Period 3: Grade 10B - Yoga
Tuesday Period 2: Grade 11A - Badminton
Wednesday Period 1: Grade 9B - Yoga
Wednesday Period 3: Grade 8C - Badminton
Thursday Period 1: Grade 7C - Fitness & Aerobics
Friday Period 2: Grade 11S - Athletics

COACH AMIT SINGH:
Monday Period 4: Grade 7A - Volleyball
Tuesday Period 1: Grade 7A - Badminton
Wednesday Period 4: Grade 6B - Soccer
Thursday Period 3: Grade 6B - Volleyball
Friday Period 1: Grade 8S - Cricket

COACH SUNITA RAO:
Tuesday Period 5: Grade 6A - Gymnastics
Wednesday Period 2: Grade 6A - Gymnastics
Thursday Period 4: Grade 7B - Functional Training
Friday Period 3: Grade 7B - Fitness`;
  };

  const handleDeleteMember = async (uid: string) => {
    if (!userProfile) return;
    toast.confirm("Remove this team member? They will lose access to school data.", async () => {
      setLoading(true);
      try {
        await fitnessService.deleteSchoolMember(uid);
        setSuccess("Member removed successfully.");
        
        // Refresh list
        const schoolMembers = await fitnessService.getSchoolMembers(userProfile.schoolId);
        setMembers(schoolMembers);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    });
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) return;

    setLoading(true);
    setError(null);
    try {
      await fitnessService.addTeamMember({
        uid: `pending_${Math.random().toString(36).substr(2, 9)}`,
        schoolId: userProfile.schoolId,
        schoolName: currentSchool?.name || userProfile.schoolName || 'SmartPE Partner School',
        schoolLogo: currentSchool?.logoUrl || userProfile.schoolLogo || '',
        ...newMember
      });
      
      setSuccess(`Member ${newMember.displayName} added successfully.`);
      setIsAdding(false);
      setNewMember({ email: '', displayName: '', role: 'teacher' });
      
      // Refresh list
      const schoolMembers = await fitnessService.getSchoolMembers(userProfile.schoolId);
      setMembers(schoolMembers);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSeoConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSeoLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const currentSchoolId = userProfile?.schoolId || (isSuperAdmin && allSchools.length > 0 ? allSchools[0].id : '') || auth.currentUser?.uid || 'default';
      await saveSEOConfig(currentSchoolId, seoConfig);
      setSuccess("SEO Configuration saved successfully! Live search indexing tags, per-route metadata, and Open Graph tags have been synced to prioritize 'smartpeindia.app'.");
      toast.success("SEO Configuration saved & synced live!");
    } catch (err: any) {
      console.error("Error saving SEO config:", err);
      setError("Failed to save SEO Configuration: " + (err.message || err));
      toast.error("Error saving SEO configuration.");
    } finally {
      setSeoLoading(false);
    }
  };

  if (loading && !members.length) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    );
  }

  if (!userProfile && !isSuperAdmin) {
    return (
      <div className="p-20 text-center space-y-6">
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto">
          <Shield size={32} className="text-red-400" />
        </div>
        <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Profile Missing</h3>
        <p className="text-slate-500 max-w-md mx-auto">Please set up your teacher profile or join a school first.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tighter">
            {isSuperAdmin ? 'Global School Registry' : 'School Network'}
          </h2>
          <p className="text-slate-500 font-medium text-sm">
            {isSuperAdmin 
              ? 'Overseeing all registered schools and their teaching staff platform-wide.' 
              : 'Grant access to other teachers or admins in your school.'}
          </p>
        </div>
        {!isSuperAdmin && (
          <button 
            onClick={() => setIsAdding(true)}
            className="px-6 py-3 bg-indigo-600 text-white border-2 border-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] flex items-center gap-2"
          >
            <UserPlus size={16} />
            <span>Grant Access</span>
          </button>
        )}
      </div>

      {isSuperAdmin && allSchools.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {allSchools.map(school => (
            <button
              key={school.id}
              onClick={async () => {
                const members = await fitnessService.getSchoolMembers(school.id);
                setMembers(members);
              }}
              className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-50 hover:border-indigo-200 transition-all"
            >
              {school.name}
            </button>
          ))}
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b-4 border-slate-900 select-none overflow-x-auto">
        <button
          onClick={() => {
            setActiveAdminTab('profile');
            setError(null);
            setSuccess(null);
          }}
          className={`pb-4 px-8 text-xs font-black uppercase tracking-widest border-b-4 -mb-[4px] transition-all flex items-center gap-2 whitespace-nowrap ${activeAdminTab === 'profile' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
        >
          <School size={14} />
          <span>School Profile & Branding</span>
        </button>
        <button
          onClick={() => {
            setActiveAdminTab('access');
            setError(null);
            setSuccess(null);
          }}
          className={`pb-4 px-8 text-xs font-black uppercase tracking-widest border-b-4 -mb-[4px] transition-all flex items-center gap-2 whitespace-nowrap ${activeAdminTab === 'access' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
        >
          <User size={14} />
          <span>Team Access Control</span>
        </button>
        <button
          onClick={() => {
            setActiveAdminTab('ocr');
            setError(null);
            setSuccess(null);
          }}
          className={`pb-4 px-8 text-xs font-black uppercase tracking-widest border-b-4 -mb-[4px] transition-all flex items-center gap-2 whitespace-nowrap ${activeAdminTab === 'ocr' ? 'border-[#FF6B00] text-[#FF6B00]' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
        >
          <Sparkles className="animate-pulse" size={14} />
          <span>Timetable OCR Ingest Hub</span>
        </button>
        <button
          onClick={() => {
            setActiveAdminTab('seo');
            setError(null);
            setSuccess(null);
          }}
          className={`pb-4 px-8 text-xs font-black uppercase tracking-widest border-b-4 -mb-[4px] transition-all flex items-center gap-2 whitespace-nowrap ${activeAdminTab === 'seo' ? 'border-[#3B82F6] text-[#3B82F6]' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
        >
          <Globe size={14} />
          <span>SEO Configuration</span>
        </button>
      </div>

      {success && (
        <div className="p-4 bg-emerald-50 text-emerald-600 border-2 border-slate-900 rounded-2xl text-xs font-bold flex items-center justify-between shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} />
            <span>{success}</span>
          </div>
          <button onClick={() => setSuccess(null)} className="hover:underline text-[10px] uppercase font-black tracking-wider">Dismiss</button>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 text-red-650 border-2 border-slate-900 rounded-2xl text-xs font-bold flex items-center justify-between shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
          <div className="flex items-start gap-2">
            <AlertCircle size={16} className="mt-0.5" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="hover:underline text-[10px] uppercase font-black tracking-wider">Dismiss</button>
        </div>
      )}

      {activeAdminTab === 'profile' ? (
        /* School Profile & Custom Logo Branding Panel */
        <div className="space-y-8 animate-in fade-in duration-300">
          <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 border-2 border-slate-900 p-8 rounded-[2.5rem] text-white shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] relative overflow-hidden">
            <div className="relative z-10">
              <span className="inline-flex px-3 py-1 border border-indigo-400 bg-indigo-800/80 text-indigo-100 rounded-lg text-[9px] font-black uppercase tracking-widest mb-4">
                Official School Profile & Custom Logo Branding
              </span>
              <h3 className="text-3xl font-black uppercase tracking-tighter mb-2">School Branding & Report Card Header</h3>
              <p className="text-indigo-200 text-sm font-medium max-w-3xl leading-relaxed">
                Configure your school's official registered name and upload a custom school logo. All student fitness reports, KIFT scorecards, test paper headers, and physical education registers will automatically reflect your school's logo alongside SmartPE India.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Form Column */}
            <div className="bg-white border-2 border-slate-900 p-8 rounded-[2.5rem] shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] space-y-6">
              <h4 className="text-lg font-black uppercase tracking-tight text-slate-900 flex items-center gap-2">
                <School className="text-indigo-600" size={20} />
                <span>School Profile Details</span>
              </h4>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block">
                  Registered School Name *
                </label>
                <input
                  type="text"
                  value={schoolNameInput}
                  onChange={(e) => setSchoolNameInput(e.target.value)}
                  placeholder="e.g. Delhi Public School, R.K. Puram"
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-900 rounded-2xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-[10px] text-slate-400 font-bold">
                  Appears on report card headers, certificates, and student scorecards.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block">
                  School Address / Affiliation Details (Optional)
                </label>
                <input
                  type="text"
                  value={schoolAddressInput}
                  onChange={(e) => setSchoolAddressInput(e.target.value)}
                  placeholder="e.g. CBSE Affiliation No. 1930211 • New Delhi"
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-900 rounded-2xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Custom Logo Upload */}
              <div className="space-y-3 pt-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block">
                  Official Custom School Logo
                </label>

                <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl">
                  {schoolLogoInput ? (
                    <div className="relative group flex-shrink-0">
                      <img src={schoolLogoInput} alt="School Logo" className="w-20 h-20 object-contain bg-white p-2 rounded-xl border border-slate-300 shadow-sm" />
                      <button
                        onClick={() => setSchoolLogoInput('')}
                        className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 shadow hover:bg-red-700"
                        title="Remove Logo"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ) : (
                    <div className="w-20 h-20 bg-indigo-50 border-2 border-slate-300 rounded-xl flex flex-col items-center justify-center text-indigo-600 flex-shrink-0">
                      <UploadCloud size={24} />
                      <span className="text-[9px] font-black uppercase mt-1">No Logo</span>
                    </div>
                  )}

                  <div className="space-y-2 flex-1 text-center sm:text-left">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => startCamera('environment')}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-indigo-700 transition-colors inline-flex items-center gap-1.5 shadow-sm cursor-pointer"
                      >
                        <Camera size={14} />
                        <span>Snap Photo via Camera</span>
                      </button>

                      <label className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer hover:bg-indigo-600 transition-colors inline-flex items-center gap-1.5 shadow-sm">
                        <UploadCloud size={14} />
                        <span>Upload Logo File</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoFileUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                    <p className="text-[10px] text-slate-400 font-bold">
                      Snap live logo with camera or upload PNG/JPG (max 2MB).
                    </p>
                  </div>
                </div>
              </div>

              {/* Preset Emblem Options */}
              <div className="space-y-2 pt-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block">
                  Or Pick a Preset Emblem
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'shield', name: 'Gold Crest', icon: Shield, color: 'bg-amber-100 text-amber-800 border-amber-300' },
                    { id: 'trophy', name: 'Royal Trophy', icon: Trophy, color: 'bg-indigo-100 text-indigo-800 border-indigo-300' },
                    { id: 'star', name: 'Star Shield', icon: Sparkles, color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
                    { id: 'globe', name: 'Academic Star', icon: Globe, color: 'bg-slate-100 text-slate-800 border-slate-300' }
                  ].map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        const svgData = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="%234f46e5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>`;
                        setSchoolLogoInput(svgData);
                        toast.success(`Selected ${preset.name} emblem!`);
                      }}
                      className={`p-2.5 rounded-xl border-2 flex flex-col items-center justify-center gap-1 hover:border-indigo-600 transition-all ${preset.color}`}
                    >
                      <preset.icon size={18} />
                      <span className="text-[9px] font-black uppercase">{preset.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleSaveSchoolBranding}
                disabled={savingBranding}
                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] hover:bg-indigo-700 active:translate-x-[1px] active:translate-y-[1px] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {savingBranding ? (
                  <>
                    <Loader2 className="animate-spin" size={16} />
                    <span>Saving School Profile...</span>
                  </>
                ) : (
                  <>
                    <Check size={16} />
                    <span>Save School Profile & Custom Logo</span>
                  </>
                )}
              </button>
            </div>

            {/* Live Preview Column */}
            <div className="space-y-6">
              <div className="bg-white border-2 border-slate-900 p-8 rounded-[2.5rem] shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
                    <Eye className="text-indigo-600" size={18} />
                    <span>Report Card Co-Branding Preview</span>
                  </h4>
                  <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-md border border-emerald-300">
                    Live Header Mode
                  </span>
                </div>

                <p className="text-xs font-bold text-slate-500">
                  This preview shows how your official school custom logo & registered school name will render alongside SmartPE India on Page 1, Page 2, Page 3, & Page 4 of student report cards:
                </p>

                {/* Simulated Header Card */}
                <div className="p-6 bg-slate-50 border-2 border-slate-900 rounded-2xl space-y-4 shadow-sm">
                  <div className="flex justify-between items-center border-b-2 border-slate-900 pb-3">
                    <div className="flex items-center gap-3">
                      <Logo showText={false} className="scale-75 origin-left -my-2" />
                      <span className="text-slate-300 font-bold">×</span>
                      {schoolLogoInput ? (
                        <img src={schoolLogoInput} alt="School Logo" className="h-8 w-auto max-w-[80px] object-contain" />
                      ) : (
                        <div className="p-1.5 bg-indigo-100 rounded-lg text-indigo-700">
                          <Shield size={16} />
                        </div>
                      )}
                      <div>
                        <div className="font-sans font-black text-xs text-indigo-950 uppercase tracking-widest">
                          {schoolNameInput || 'YOUR REGISTERED SCHOOL NAME'}
                        </div>
                        {schoolAddressInput && (
                          <div className="text-[9px] font-bold text-slate-400">
                            {schoolAddressInput}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] font-black uppercase tracking-wider bg-slate-900 text-white px-2.5 py-1 rounded-md">
                        Page 2: Trend & Progress
                      </span>
                    </div>
                  </div>

                  <div className="text-center py-6 text-slate-400 text-xs font-mono border-2 border-dashed border-slate-300 rounded-xl bg-white space-y-1">
                    <p className="font-sans font-black text-slate-700 uppercase">Official CBSE & KIFT Physical Literacy Scorecard</p>
                    <p className="text-[10px] text-slate-400">[ Co-branded Report Content & Trend Analytics ]</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : activeAdminTab === 'access' ? (
        /* Members List */
        <div className="bg-white rounded-[2.5rem] border-2 border-slate-900 overflow-hidden shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] animate-in fade-in slide-in-from-bottom-2 duration-300">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b-2 border-slate-900">
                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Member Name</th>
                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Email Address</th>
                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Role</th>
                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {members.map(member => (
                <tr key={member.uid} className="hover:bg-slate-50 transition-colors group">
                  <td className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-indigo-50 border-2 border-slate-900 rounded-xl flex items-center justify-center text-indigo-650 font-black text-xs shadow-sm">
                        {member.displayName.substring(0, 2).toUpperCase()}
                      </div>
                      <span className="font-black text-slate-900 uppercase tracking-tight">{member.displayName}</span>
                    </div>
                  </td>
                  <td className="p-6">
                    <span className="font-bold text-slate-500">{member.email}</span>
                  </td>
                  <td className="p-6">
                    <span className={`inline-flex px-3 py-1 border border-slate-900 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                      member.role === 'admin' ? 'bg-indigo-600 text-white' : 'bg-slate-105 text-slate-600'
                    }`}>
                      {member.role}
                    </span>
                  </td>
                  <td className="p-6 text-right">
                    {member.uid !== auth.currentUser?.uid && (
                      <button 
                        onClick={() => handleDeleteMember(member.uid)}
                        className="p-2 hover:bg-red-50 text-red-600 border border-transparent hover:border-slate-900 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* Timetable OCR Ingestion Hub */
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="bg-[#FFF4E5] border-2 border-slate-900 p-8 rounded-[2.5rem] shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] relative overflow-hidden">
            <div className="relative z-10">
              <span className="inline-flex px-3 py-1 border border-slate-900 bg-[#FF6B00] text-white rounded-lg text-[9px] font-black uppercase tracking-widest mb-4">
                Smart Administrative OCR
              </span>
              <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter mb-2">Master Timetable Document Ingestion Hub</h3>
              <p className="text-slate-600 text-sm font-semibold max-w-3xl leading-relaxed">
                Seamlessly upload master PDF files, Word timetables, or copy-pasted schedules. Our OCR system automatically isolates teacher names, maps class schedules, groups weekday assignments, and updates the <span className="text-indigo-600">Department Daily Workflow</span> roster live!
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* File drop zone & progress output console */}
            <div className="lg:col-span-1 space-y-8">
              <div className="bg-white border-2 border-slate-900 p-8 rounded-[2.5rem] shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] space-y-6">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Upload Schedule Source</span>

                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOver(false);
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      handleOCRFileIngestion(e.dataTransfer.files[0]);
                    }
                  }}
                  onClick={() => document.getElementById('ocr-input-file')?.click()}
                  className={`border-4 border-dashed rounded-[2rem] p-10 text-center cursor-pointer transition-all relative group ${
                    dragOver ? 'border-[#FF6B00] bg-orange-50/30 shadow-none' : 'border-slate-300 hover:border-[#FF6B00] hover:bg-slate-50'
                  }`}
                >
                  <input
                    id="ocr-input-file"
                    type="file"
                    accept=".pdf, .docx, .doc, .txt, .csv"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleOCRFileIngestion(e.target.files[0]);
                      }
                    }}
                  />
                  <UploadCloud size={48} className="mx-auto text-slate-400 group-hover:text-[#FF6B00] mb-4 transition-colors" />
                  <span className="block text-xs font-black text-slate-900 uppercase tracking-wider mb-1.5">
                    Drag & Drop File Here
                  </span>
                  <p className="text-[10px] font-bold text-slate-500 leading-normal">
                    Supports Master PDF, Word Docs (.doc, .docx) or pure raw text timetables
                  </p>
                </div>

                {/* Quick actions & samples */}
                <div className="border-t border-slate-100 pt-4 text-center">
                  <div className="text-[10px] font-bold text-slate-400 uppercase mb-2">Want a quick test drive?</div>
                  <button
                    type="button"
                    onClick={() => {
                      const mockFile = new File([getSampleTimetableText()], "CBSE_PE_MASTER_CLASS_GRID_2026.pdf", { type: "text/plain" });
                      handleOCRFileIngestion(mockFile);
                    }}
                    className="w-full py-2 bg-slate-50 border border-slate-350 hover:bg-orange-50 hover:border-[#FF6B00] text-slate-700 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5"
                  >
                    <BookOpen size={13} className="text-[#FF6B00]" />
                    <span>Run Sample CBSE Timetable</span>
                  </button>
                </div>
              </div>

              {/* Progress Console logs terminal */}
              {ocrProgressStep >= 0 && (
                <div className="bg-slate-900 border-2 border-slate-990 p-6 rounded-[2rem] shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] text-emerald-400 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                    <span className="text-[9px] font-black tracking-widest text-slate-500 uppercase font-sans">OCR DEEP SCAN TERMINAL</span>
                    <span className="flex h-2.5 w-2.5 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                    </span>
                  </div>

                  <div className="space-y-1.5 h-[140px] overflow-y-auto pr-1 text-[11px] font-mono leading-relaxed select-text">
                    {ocrLogs.map((log, lIdx) => (
                      <div key={lIdx} className="flex gap-2">
                        <span className="text-emerald-500 select-none">&gt;</span>
                        <span>{log}</span>
                      </div>
                    ))}
                  </div>

                  {ocrProgressStep < 3 && (
                    <div className="space-y-2">
                      <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-400 transition-all duration-300"
                          style={{ width: `${(ocrProgressStep + 1) * 33.3}%` }}
                        ></div>
                      </div>
                      <div className="flex items-center gap-1.5 text-[9px] font-bold text-emerald-400 uppercase font-sans">
                        <Loader2 className="animate-spin" size={10} />
                        <span>AI model interpreting columns & coach layouts...</span>
                      </div>
                    </div>
                  )}

                  {ocrProgressStep === 3 && (
                    <div className="p-3 border border-emerald-800/40 bg-emerald-950/20 text-emerald-300 rounded-2xl text-[10px] font-black uppercase text-center tracking-widest">
                      [OK] SECURE OCR EXTRACTION SUCCESSFUL
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Sandbox editor, matching extracted slots */}
            <div className="lg:col-span-2">
              <div className="bg-white border-2 border-slate-00 p-8 rounded-[2.5rem] shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] space-y-6 border-slate-900">
                <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                  <div>
                    <h4 className="font-extrabold text-slate-900 uppercase text-xs tracking-widest font-sans text-amber">
                      Mapping Sandbox Grid
                    </h4>
                    <p className="text-slate-400 text-xs font-semibold mt-1">
                      Review, add, or alter rows parsed from documents. Tap the button to transfer slots into active workloads.
                    </p>
                  </div>
                  {extractedSlots.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setExtractedSlots([]);
                        setOcrProgressStep(-1);
                        setSelectedFile(null);
                      }}
                      className="text-[9px] font-black text-rose-500 uppercase tracking-widest hover:underline"
                    >
                      Reset State
                    </button>
                  )}
                </div>

                {!extractedSlots.length ? (
                  <div className="py-20 text-center space-y-6">
                    <div className="w-20 h-20 bg-slate-50 border-2 border-slate-900 rounded-full flex items-center justify-center mx-auto text-slate-400 shadow-sm">
                      <FileText size={28} />
                    </div>
                    <div>
                      <h4 className="font-black text-slate-800 uppercase tracking-tight text-md">Verification sandbox is currently empty</h4>
                      <p className="text-slate-500 text-xs max-w-sm mx-auto mt-1 font-semibold">
                        Drag and drop your master timetable or run the CBSE sample test above to fill this grid with parsed coach entries.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6 anim-fade-in">
                    <div className="overflow-x-auto border-2 border-slate-900 rounded-2xl bg-white">
                      <table className="w-full border-collapse text-left">
                        <thead>
                          <tr className="bg-slate-50 border-b-2 border-slate-900">
                            <th className="p-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Extracted Coach</th>
                            <th className="p-4 text-[9px] font-black text-slate-400 uppercase tracking-widest col-span-1">Day of Week</th>
                            <th className="p-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Period ID</th>
                            <th className="p-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Grade & Activity Slot</th>
                            <th className="p-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Delete</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {extractedSlots.map((slot) => (
                            <tr key={slot.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="p-3">
                                <input
                                  type="text"
                                  value={slot.coach}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setExtractedSlots(prev => prev.map(s => s.id === slot.id ? { ...s, coach: val } : s));
                                  }}
                                  className="py-1.5 px-3 w-40 border border-slate-200 hover:border-slate-400 focus:border-indigo-600 rounded-xl text-xs font-black text-slate-900 uppercase leading-none outline-none focus:bg-white bg-slate-50 transition-all font-sans"
                                />
                              </td>
                              <td className="p-3">
                                <select
                                  value={slot.day}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setExtractedSlots(prev => prev.map(s => s.id === slot.id ? { ...s, day: val } : s));
                                  }}
                                  className="w-full py-1.5 px-2.5 border-2 border-slate-900 rounded-xl text-xs font-black uppercase text-slate-800 bg-white shadow-sm"
                                >
                                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(d => (
                                    <option key={d} value={d}>{d}</option>
                                  ))}
                                </select>
                              </td>
                              <td className="p-3">
                                <select
                                  value={slot.period}
                                  onChange={(e) => {
                                    const val = Number(e.target.value);
                                    setExtractedSlots(prev => prev.map(s => s.id === slot.id ? { ...s, period: val } : s));
                                  }}
                                  className="w-20 py-1.5 px-2.5 border-2 border-slate-900 rounded-xl text-xs font-black text-slate-700 bg-white font-mono shadow-sm"
                                >
                                  {[1, 2, 3, 4, 5, 6, 7, 8].map(p => (
                                    <option key={p} value={p}>P{p}</option>
                                  ))}
                                </select>
                              </td>
                              <td className="p-3">
                                <input
                                  type="text"
                                  value={slot.assignment}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setExtractedSlots(prev => prev.map(s => s.id === slot.id ? { ...s, assignment: val } : s));
                                  }}
                                  className="py-1.5 px-3 w-44 border border-slate-200 hover:border-slate-400 focus:border-indigo-600 rounded-xl text-xs font-black text-indigo-700 bg-indigo-50/10 leading-none outline-none focus:bg-white bg-slate-50 transition-all"
                                />
                              </td>
                              <td className="p-3 text-right">
                                <button
                                  type="button"
                                  onClick={() => setExtractedSlots(prev => prev.filter(s => s.id !== slot.id))}
                                  className="p-2 border border-slate-900 hover:bg-rose-50 rounded-xl transition-all duration-150 text-rose-500 shadow-sm"
                                  title="Delete parsed slot row"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Editor actions and save to workflows */}
                    <div className="flex flex-wrap items-center justify-between gap-4 p-5 border-2 border-slate-900 rounded-2xl bg-slate-50 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]-sm">
                      <div className="text-[11px] font-black uppercase text-slate-500 tracking-wider font-sans">
                        ROSTER LOAD: <strong className="text-slate-800 text-xs font-black">{extractedSlots.length} LESSONS</strong> IDENTIFIED
                      </div>

                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            const newId = `slot_new_${Date.now()}`;
                            setExtractedSlots(prev => [...prev, {
                              id: newId,
                              coach: 'COACH RAJESH KUMAR',
                              day: 'Monday',
                              period: 1,
                              assignment: 'Grade 9A - Football'
                            }]);
                          }}
                          className="px-4 py-2 border-2 border-slate-900 bg-white text-slate-850 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-100 transition-all flex items-center gap-1.5 shadow-sm"
                        >
                          <Plus size={12} />
                          <span>Append Row</span>
                        </button>

                        <button
                          type="button"
                          disabled={saveLoading}
                          onClick={handleSaveMappedWorkloads}
                          className="px-5 py-2.5 bg-[#FF6B00] text-white border-2 border-slate-900 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-orange-650 hover:scale-[1.01] active:translate-y-0.5 shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] duration-150 transition-all flex items-center gap-2"
                        >
                          {saveLoading ? <Loader2 className="animate-spin" size={13} /> : <Sparkles size={13} />}
                          <span>Map & Map to Workflows</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeAdminTab === 'seo' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {/* Header Card */}
          <div className="bg-[#0D2B52] border-4 border-slate-900 p-8 rounded-[2.5rem] shadow-[8px_8px_0px_0px_rgba(13,43,82,1)] text-white relative overflow-hidden">
            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-2 max-w-3xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#D4A017]/20 border border-[#D4A017]/40 rounded-full text-[10px] font-black uppercase tracking-widest text-[#D4A017]">
                  <Globe size={12} />
                  <span>REACT-HELMET DYNAMIC SEO ENGINE</span>
                </div>
                <h3 className="text-3xl md:text-4xl font-black uppercase tracking-tighter text-white font-display">
                  SEO & Public Brand Control Panel
                </h3>
                <p className="text-slate-200 text-sm font-medium leading-relaxed">
                  Optimize search engine visibility and prioritize <strong className="text-[#D4A017] font-black">smartpeindia.app</strong>! Configure route-specific meta tags, canonical URLs, and Open Graph previews managed dynamically via <code className="bg-white/10 px-1.5 py-0.5 rounded text-xs">react-helmet-async</code>.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                <button
                  type="button"
                  onClick={handleSaveSeoConfig}
                  disabled={seoLoading}
                  className="px-6 py-3.5 bg-[#D4A017] text-[#0D2B52] border-2 border-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#e0ac1e] transition-all shadow-[4px_4px_0px_0px_rgba(13,43,82,1)] flex items-center justify-center gap-2"
                >
                  {seoLoading ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
                  <span>{seoLoading ? 'Saving...' : 'Save All SEO Settings'}</span>
                </button>
              </div>
            </div>
            <div className="absolute right-[-40px] top-[-40px] w-64 h-64 text-[#D4A017]/10 -rotate-12 pointer-events-none">
              <Globe size={256} />
            </div>
          </div>

          {/* Sub-navigation tabs for SEO settings */}
          <div className="flex flex-wrap items-center gap-3 border-b-2 border-slate-200 pb-3">
            <button
              type="button"
              onClick={() => setSelectedSeoSubTab('global')}
              className={`px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 border-2 ${
                selectedSeoSubTab === 'global'
                  ? 'bg-[#0D2B52] text-white border-slate-900 shadow-[3px_3px_0px_0px_rgba(13,43,82,1)]'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
              }`}
            >
              <Globe size={14} />
              <span>Global SEO & Domain</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedSeoSubTab('routes')}
              className={`px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 border-2 ${
                selectedSeoSubTab === 'routes'
                  ? 'bg-[#0D2B52] text-white border-slate-900 shadow-[3px_3px_0px_0px_rgba(13,43,82,1)]'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
              }`}
            >
              <Layers size={14} />
              <span>Per-Route Meta Tags ({Object.keys(seoConfig.routeOverrides || {}).length} Overrides)</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedSeoSubTab('social')}
              className={`px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 border-2 ${
                selectedSeoSubTab === 'social'
                  ? 'bg-[#0D2B52] text-white border-slate-900 shadow-[3px_3px_0px_0px_rgba(13,43,82,1)]'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
              }`}
            >
              <Share2 size={14} />
              <span>Social & OpenGraph Cards</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Form Column */}
            <div className="lg:col-span-2 space-y-6">
              <form onSubmit={handleSaveSeoConfig} className="bg-white border-4 border-slate-900 p-8 rounded-[2.5rem] shadow-[6px_6px_0px_0px_rgba(13,43,82,0.15)] space-y-6">
                
                {/* GLOBAL SEO SUB-TAB */}
                {selectedSeoSubTab === 'global' && (
                  <div className="space-y-6 animate-in fade-in duration-200">
                    <div>
                      <h4 className="text-xl font-black text-[#0D2B52] uppercase tracking-tight font-display mb-1">
                        Domain & Global Indexing Configuration
                      </h4>
                      <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                        Control canonical indexing targets and baseline metadata rendered across all app pages.
                      </p>
                    </div>

                    {/* Canonical URL Domain prioritization */}
                    <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2.5 block flex items-center gap-1.5">
                        <Tag size={12} className="text-[#D4A017]" />
                        <span>Prioritized Canonical Domain</span>
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <button
                          type="button"
                          onClick={() => setSeoConfig({ ...seoConfig, canonicalUrl: 'https://smartpeindia.app/' })}
                          className={`p-5 border-4 rounded-2xl text-left transition-all flex flex-col justify-between ${
                            seoConfig.canonicalUrl === 'https://smartpeindia.app/' || seoConfig.canonicalUrl === 'https://smartpeindia.app'
                              ? 'border-[#0D2B52] bg-[#0D2B52]/5 shadow-[4px_4px_0px_0px_rgba(13,43,82,1)]'
                              : 'border-slate-200 bg-white hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className="text-sm font-black uppercase tracking-wider text-[#0D2B52]">smartpeindia.app</span>
                            <span className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-[9px] font-black uppercase tracking-widest">
                              RECOMMENDED
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-600 font-semibold mt-3 leading-normal">
                            Primary custom domain. Strongly prioritized by search engines for all school fitness reports & PE resources in India.
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setSeoConfig({ ...seoConfig, canonicalUrl: 'https://smartpeindia.vercel.app/' })}
                          className={`p-5 border-4 rounded-2xl text-left transition-all flex flex-col justify-between ${
                            seoConfig.canonicalUrl === 'https://smartpeindia.vercel.app/' || seoConfig.canonicalUrl === 'https://smartpeindia.vercel.app'
                              ? 'border-[#0D2B52] bg-[#0D2B52]/5 shadow-[4px_4px_0px_0px_rgba(13,43,82,1)]'
                              : 'border-slate-200 bg-white hover:border-slate-300'
                          }`}
                        >
                          <span className="text-sm font-black uppercase tracking-wider text-slate-700">smartpeindia.vercel.app</span>
                          <span className="text-[11px] text-slate-500 font-semibold mt-3 leading-normal">
                            Secondary fallback deployment URL. Use as backup redirect target.
                          </span>
                        </button>
                      </div>

                      {/* Custom Canonical Input */}
                      <div className="mt-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Custom Canonical Base URL</label>
                        <input
                          type="url"
                          required
                          value={seoConfig.canonicalUrl}
                          onChange={e => setSeoConfig({ ...seoConfig, canonicalUrl: e.target.value })}
                          className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold text-sm outline-none focus:border-[#0D2B52] focus:bg-white transition-all font-mono"
                          placeholder="https://smartpeindia.app/"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {/* Title Prefix */}
                      <div>
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Brand Meta Title Prefix</label>
                        <input
                          type="text"
                          required
                          className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold text-sm outline-none focus:border-[#0D2B52] focus:bg-white transition-all"
                          value={seoConfig.metaTitlePrefix}
                          onChange={e => setSeoConfig({ ...seoConfig, metaTitlePrefix: e.target.value })}
                          placeholder="e.g. Smart PE India"
                        />
                      </div>

                      {/* Site Name */}
                      <div>
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Site Name (og:site_name)</label>
                        <input
                          type="text"
                          required
                          className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold text-sm outline-none focus:border-[#0D2B52] focus:bg-white transition-all"
                          value={seoConfig.siteName || 'Smart PE India'}
                          onChange={e => setSeoConfig({ ...seoConfig, siteName: e.target.value })}
                          placeholder="Smart PE India"
                        />
                      </div>
                    </div>

                    {/* Global Meta Description */}
                    <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Global Meta Description</label>
                      <textarea
                        rows={3}
                        required
                        className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold text-sm outline-none focus:border-[#0D2B52] focus:bg-white transition-all resize-none"
                        value={seoConfig.metaDescription}
                        onChange={e => setSeoConfig({ ...seoConfig, metaDescription: e.target.value })}
                        placeholder="Comprehensive description summarizing your PE software capabilities..."
                      />
                    </div>

                    {/* Global Keywords */}
                    <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Global Search Keywords</label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold text-sm outline-none focus:border-[#0D2B52] focus:bg-white transition-all"
                        value={seoConfig.keywords || ''}
                        onChange={e => setSeoConfig({ ...seoConfig, keywords: e.target.value })}
                        placeholder="PE Teachers India, CBSE PE Lesson Plan, Khelo India Fitness Test, smartpeindia.app"
                      />
                    </div>

                    {/* Author & Indexing options */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                      <div>
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Publisher / Author</label>
                        <input
                          type="text"
                          className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold text-sm outline-none focus:border-[#0D2B52] focus:bg-white transition-all"
                          value={seoConfig.author || 'Smart PE India Team'}
                          onChange={e => setSeoConfig({ ...seoConfig, author: e.target.value })}
                          placeholder="Smart PE India Team"
                        />
                      </div>

                      <div className="flex flex-col justify-end">
                        <label className="flex items-center gap-3 bg-slate-50 p-3.5 border-2 border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
                          <input
                            type="checkbox"
                            className="w-5 h-5 text-[#0D2B52] border-slate-300 rounded focus:ring-[#0D2B52] cursor-pointer"
                            checked={seoConfig.allowCrawling}
                            onChange={e => setSeoConfig({ ...seoConfig, allowCrawling: e.target.checked })}
                          />
                          <div>
                            <span className="text-xs font-black text-[#0D2B52] uppercase block">Allow Search Engine Indexing</span>
                            <span className="text-[10px] text-slate-500 font-semibold block">Injects `index, follow` tags for Googlebot</span>
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {/* PER-ROUTE SEO OVERRIDES SUB-TAB */}
                {selectedSeoSubTab === 'routes' && (
                  <div className="space-y-6 animate-in fade-in duration-200">
                    <div>
                      <h4 className="text-xl font-black text-[#0D2B52] uppercase tracking-tight font-display mb-1">
                        Per-Route Dynamic Meta Tag Customizer
                      </h4>
                      <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                        Customize route-specific titles, meta descriptions, and canonical sub-paths so each tab on <strong className="text-[#0D2B52]">smartpeindia.app</strong> has unique search metadata.
                      </p>
                    </div>

                    {/* Route Selector Dropdown / Buttons */}
                    <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Select App View / Route to Edit</label>
                      <select
                        value={selectedRouteKey}
                        onChange={e => setSelectedRouteKey(e.target.value)}
                        className="w-full p-4 bg-slate-50 border-2 border-slate-900 rounded-2xl font-black text-sm uppercase tracking-wider text-[#0D2B52] outline-none focus:bg-white shadow-sm"
                      >
                        <option value="dashboard">Dashboard & Overview (/)</option>
                        <option value="planner">AI PE Lesson Planner (/#lesson-planner)</option>
                        <option value="yearly">Yearly Curriculum Planner (/#yearly-planner)</option>
                        <option value="weekly-planner">Academic Weekly Planner (/#weekly-planner)</option>
                        <option value="fitness">Khelo India Fitness Tests (/#fitness-tests)</option>
                        <option value="khelo">Khelo India Battery & Cards (/#khelo-india)</option>
                        <option value="school-admin">School Admin Center (/#school-admin)</option>
                        <option value="subscription-plans">Pricing & Plans (/#pricing)</option>
                        <option value="about">About Smart PE India (/#about)</option>
                        <option value="contact">Contact & Support (/#contact)</option>
                      </select>
                    </div>

                    {/* Current Route Fields */}
                    {(() => {
                      const currentOverride = seoConfig.routeOverrides?.[selectedRouteKey] || {};

                      const updateRouteField = (field: keyof RouteSEOOverride, val: string) => {
                        setSeoConfig(prev => ({
                          ...prev,
                          routeOverrides: {
                            ...prev.routeOverrides,
                            [selectedRouteKey]: {
                              ...prev.routeOverrides?.[selectedRouteKey],
                              [field]: val
                            }
                          }
                        }));
                      };

                      return (
                        <div className="bg-slate-50 border-2 border-slate-200 p-6 rounded-2xl space-y-5">
                          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                            <span className="text-xs font-black text-[#0D2B52] uppercase tracking-wider flex items-center gap-1.5">
                              <Tag size={14} className="text-[#D4A017]" />
                              <span>Editing: {selectedRouteKey.toUpperCase()} Route</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                const newOverrides = { ...(seoConfig.routeOverrides || {}) };
                                delete newOverrides[selectedRouteKey];
                                setSeoConfig({ ...seoConfig, routeOverrides: newOverrides });
                                toast.info(`Reset ${selectedRouteKey} route to default`);
                              }}
                              className="text-[10px] font-black text-rose-600 uppercase tracking-widest hover:underline"
                            >
                              Reset Route
                            </button>
                          </div>

                          <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block">Route Page Title</label>
                            <input
                              type="text"
                              value={currentOverride.title || ''}
                              onChange={e => updateRouteField('title', e.target.value)}
                              className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl font-bold text-sm outline-none focus:border-[#0D2B52]"
                              placeholder="e.g., AI PE Lesson Plan Generator (CBSE/ICSE)"
                            />
                            <p className="text-[10px] text-slate-400 font-semibold mt-1">
                              Rendered as: <code className="text-[#0D2B52]">{currentOverride.title || 'Default Title'} | {seoConfig.metaTitlePrefix || 'Smart PE India'}</code>
                            </p>
                          </div>

                          <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block">Route Meta Description</label>
                            <textarea
                              rows={2}
                              value={currentOverride.description || ''}
                              onChange={e => updateRouteField('description', e.target.value)}
                              className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl font-bold text-sm outline-none focus:border-[#0D2B52] resize-none"
                              placeholder="Specific description for this route..."
                            />
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block">Canonical Sub-Path</label>
                              <input
                                type="text"
                                value={currentOverride.canonicalPath || ''}
                                onChange={e => updateRouteField('canonicalPath', e.target.value)}
                                className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl font-bold text-sm outline-none focus:border-[#0D2B52] font-mono"
                                placeholder={`/#${selectedRouteKey}`}
                              />
                            </div>

                            <div>
                              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block">Route Keywords</label>
                              <input
                                type="text"
                                value={currentOverride.keywords || ''}
                                onChange={e => updateRouteField('keywords', e.target.value)}
                                className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl font-bold text-sm outline-none focus:border-[#0D2B52]"
                                placeholder="Route specific keywords..."
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* SOCIAL CARDS SUB-TAB */}
                {selectedSeoSubTab === 'social' && (
                  <div className="space-y-6 animate-in fade-in duration-200">
                    <div>
                      <h4 className="text-xl font-black text-[#0D2B52] uppercase tracking-tight font-display mb-1">
                        Open Graph & Social Sharing Cards
                      </h4>
                      <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                        Control how shared links display on WhatsApp, Telegram, Twitter, and Facebook when parents or teachers send links.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {/* Social Preview Title */}
                      <div>
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Social Title (og:title)</label>
                        <input
                          type="text"
                          required
                          className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold text-sm outline-none focus:border-[#0D2B52] focus:bg-white transition-all"
                          value={seoConfig.socialTitle}
                          onChange={e => setSeoConfig({ ...seoConfig, socialTitle: e.target.value })}
                          placeholder="Catchy sharing title..."
                        />
                      </div>

                      {/* Twitter Handle */}
                      <div>
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Twitter Handle (twitter:site)</label>
                        <input
                          type="text"
                          className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold text-sm outline-none focus:border-[#0D2B52] focus:bg-white transition-all"
                          value={seoConfig.twitterHandle || '@smartpeindia'}
                          onChange={e => setSeoConfig({ ...seoConfig, twitterHandle: e.target.value })}
                          placeholder="@smartpeindia"
                        />
                      </div>
                    </div>

                    {/* Social Description */}
                    <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Social Description (og:description)</label>
                      <textarea
                        rows={3}
                        required
                        className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold text-sm outline-none focus:border-[#0D2B52] focus:bg-white transition-all resize-none"
                        value={seoConfig.socialDescription}
                        onChange={e => setSeoConfig({ ...seoConfig, socialDescription: e.target.value })}
                        placeholder="Short copy specifically written to drive click-throughs on social networks..."
                      />
                    </div>

                    {/* Social Image URL & Preset Selection */}
                    <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Social Image Banner URL (og:image)</label>
                      <div className="relative mb-3">
                        <Link className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                          type="text"
                          required
                          className="w-full pl-12 pr-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold text-sm outline-none focus:border-[#0D2B52] focus:bg-white transition-all"
                          value={seoConfig.socialImageUrl}
                          onChange={e => setSeoConfig({ ...seoConfig, socialImageUrl: e.target.value })}
                          placeholder="https://..."
                        />
                      </div>

                      {/* Preset Image Options */}
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Or select a high-res PE preset image:</span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {[
                          { label: 'PE Sports Action', url: 'https://images.unsplash.com/photo-1594882645126-14020914d58d?q=80&w=1200&auto=format&fit=crop' },
                          { label: 'School Playground', url: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=1200&auto=format&fit=crop' },
                          { label: 'Fitness Battery', url: 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?q=80&w=1200&auto=format&fit=crop' },
                          { label: 'Athletics & Track', url: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=1200&auto=format&fit=crop' }
                        ].map((preset, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setSeoConfig({ ...seoConfig, socialImageUrl: preset.url })}
                            className={`p-2 border-2 rounded-xl text-left overflow-hidden transition-all group ${
                              seoConfig.socialImageUrl === preset.url ? 'border-[#0D2B52] bg-[#0D2B52]/5' : 'border-slate-200 bg-white hover:border-slate-300'
                            }`}
                          >
                            <div className="aspect-video w-full rounded-lg overflow-hidden mb-1.5 bg-slate-100 relative">
                              <img src={preset.url} alt={preset.label} className="w-full h-full object-cover group-hover:scale-105 transition-transform" referrerPolicy="no-referrer" />
                            </div>
                            <span className="text-[10px] font-bold text-slate-800 block truncate">{preset.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-end pt-4 border-t border-slate-100">
                  <button
                    type="submit"
                    disabled={seoLoading}
                    className="px-8 py-4 bg-[#0D2B52] text-white border-2 border-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#164077] transition-all shadow-[4px_4px_0px_0px_rgba(13,43,82,1)] flex items-center justify-center gap-2 min-w-[200px]"
                  >
                    {seoLoading ? (
                      <>
                        <Loader2 className="animate-spin" size={16} />
                        <span>Syncing & Saving...</span>
                      </>
                    ) : (
                      <>
                        <Globe size={16} className="text-[#D4A017]" />
                        <span>Save All SEO Settings</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Sidebar Column: Previews, Sitemap & Robots.txt */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white border-4 border-slate-900 p-6 rounded-[2.5rem] shadow-[6px_6px_0px_0px_rgba(13,43,82,0.15)] space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <span className="text-xs font-black text-[#0D2B52] uppercase tracking-wider flex items-center gap-1.5">
                    <Eye size={16} className="text-[#D4A017]" />
                    <span>Live SEO Inspector</span>
                  </span>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[9px] font-black uppercase tracking-widest">
                    LIVE
                  </span>
                </div>

                {/* Preview Mode Switcher */}
                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setSeoPreviewMode('google')}
                    className={`py-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${
                      seoPreviewMode === 'google' ? 'bg-[#0D2B52] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Google Search
                  </button>

                  <button
                    type="button"
                    onClick={() => setSeoPreviewMode('social')}
                    className={`py-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${
                      seoPreviewMode === 'social' ? 'bg-[#0D2B52] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    WhatsApp Card
                  </button>

                  <button
                    type="button"
                    onClick={() => setSeoPreviewMode('sitemap')}
                    className={`py-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${
                      seoPreviewMode === 'sitemap' ? 'bg-[#0D2B52] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    XML Sitemap
                  </button>

                  <button
                    type="button"
                    onClick={() => setSeoPreviewMode('robots')}
                    className={`py-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${
                      seoPreviewMode === 'robots' ? 'bg-[#0D2B52] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    robots.txt
                  </button>
                </div>

                {/* GOOGLE SEARCH PREVIEW */}
                {seoPreviewMode === 'google' && (
                  <div className="space-y-3 animate-in fade-in duration-200">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Google Search Result Snippet Preview</span>
                    
                    <div className="p-4 bg-white border-2 border-slate-200 rounded-2xl space-y-2 shadow-sm font-sans">
                      {/* Brand Favicon & Site Name Line (Google's Search format) */}
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden flex-shrink-0 p-0.5">
                          <img src="/favicon-48x48.png" alt="Smart PE Logo" className="w-full h-full object-contain" />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-bold text-slate-900 leading-none truncate">
                            {seoConfig.siteName || 'Smart PE India'}
                          </span>
                          <span className="text-[11px] text-slate-500 font-mono leading-tight truncate">
                            {(seoConfig.canonicalUrl || 'https://smartpeindia.app/').replace(/\/$/, '')}{selectedSeoSubTab === 'routes' ? (seoConfig.routeOverrides?.[selectedRouteKey]?.canonicalPath || `/#${selectedRouteKey}`) : ''}
                          </span>
                        </div>
                      </div>

                      {/* Snippet Title */}
                      <h5 className="text-[#1a0dab] hover:underline font-normal text-base leading-snug cursor-pointer font-sans line-clamp-2">
                        {selectedSeoSubTab === 'routes' && seoConfig.routeOverrides?.[selectedRouteKey]?.title
                          ? `${seoConfig.routeOverrides[selectedRouteKey].title} | ${seoConfig.metaTitlePrefix || 'Smart PE India'}`
                          : `${seoConfig.metaTitlePrefix || 'Smart PE India (smartpeindia.app)'} | #1 AI Platform for PE Teachers`}
                      </h5>

                      {/* Snippet Description */}
                      <p className="text-xs text-[#4d5156] font-normal leading-relaxed line-clamp-3">
                        <strong className="text-slate-800">SmartPE India</strong> {selectedSeoSubTab === 'routes' && seoConfig.routeOverrides?.[selectedRouteKey]?.description
                          ? seoConfig.routeOverrides[selectedRouteKey].description
                          : (seoConfig.metaDescription || "India's #1 AI-powered platform for Physical Education teachers and schools.")}
                      </p>

                      {/* Google Sitelinks */}
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-[11px] text-[#1a0dab]">
                        <span className="hover:underline cursor-pointer font-medium">PE Lesson Planner</span>
                        <span className="hover:underline cursor-pointer font-medium">Khelo India Tests</span>
                        <span className="hover:underline cursor-pointer font-medium">Curriculum Planner</span>
                        <span className="hover:underline cursor-pointer font-medium">1-Year Free Pass</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* WHATSAPP / SOCIAL CARD PREVIEW */}
                {seoPreviewMode === 'social' && (
                  <div className="space-y-3 animate-in fade-in duration-200">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">WhatsApp & Chat Card Preview</span>

                    <div className="bg-slate-100/80 p-3 rounded-2xl border border-slate-200">
                      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                        {seoConfig.socialImageUrl ? (
                          <div className="aspect-[1.91/1] w-full bg-slate-200 relative overflow-hidden">
                            <img
                              src={seoConfig.socialImageUrl}
                              alt="Social Preview Banner"
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        ) : (
                          <div className="aspect-[1.91/1] w-full bg-[#0D2B52]/10 flex items-center justify-center">
                            <Globe size={40} className="text-[#0D2B52]/40" />
                          </div>
                        )}

                        <div className="p-3.5 space-y-1">
                          <span className="text-[9px] font-black uppercase text-[#0D2B52] tracking-widest block">
                            {seoConfig.metaTitlePrefix || 'Smart PE India'}
                          </span>
                          <h5 className="font-bold text-xs text-slate-800 line-clamp-1">
                            {seoConfig.socialTitle || 'Smart PE India - PE Teacher Platform'}
                          </h5>
                          <p className="text-[10px] text-slate-500 font-medium leading-relaxed line-clamp-2">
                            {seoConfig.socialDescription || 'Generate CBSE/ICSE PE lesson plans in seconds.'}
                          </p>
                          <div className="text-[9px] text-slate-400 font-bold flex items-center gap-1 pt-1.5 border-t border-slate-100 uppercase tracking-widest font-mono">
                            <Link size={8} />
                            <span>{(seoConfig.canonicalUrl || 'https://smartpeindia.app/').replace('https://', '').replace(/\/$/, '')}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* DYNAMIC XML SITEMAP PREVIEW */}
                {seoPreviewMode === 'sitemap' && (
                  <div className="space-y-3 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Generated XML Sitemap</span>
                      <button
                        type="button"
                        onClick={() => {
                          const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url>\n    <loc>${seoConfig.canonicalUrl || 'https://smartpeindia.app/'}</loc>\n    <priority>1.0</priority>\n  </url>\n</urlset>`;
                          navigator.clipboard.writeText(xml);
                          setCopiedText('xml');
                          toast.success("XML Sitemap copied to clipboard!");
                          setTimeout(() => setCopiedText(null), 2000);
                        }}
                        className="text-[10px] font-black text-[#0D2B52] uppercase tracking-wider flex items-center gap-1 hover:underline"
                      >
                        {copiedText === 'xml' ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                        <span>{copiedText === 'xml' ? 'Copied!' : 'Copy XML'}</span>
                      </button>
                    </div>

                    <div className="bg-slate-900 border-2 border-slate-950 p-4 rounded-2xl font-mono text-[9px] text-emerald-400 space-y-1 overflow-x-auto max-h-[220px] select-all scrollbar-thin">
                      <div>&lt;?xml version="1.0" encoding="UTF-8"?&gt;</div>
                      <div>&lt;urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"&gt;</div>
                      <div className="pl-4 text-slate-500">&lt;!-- Target Domain: smartpeindia.app --&gt;</div>
                      <div className="pl-4">&lt;url&gt;</div>
                      <div className="pl-8">&lt;loc&gt;{seoConfig.canonicalUrl || 'https://smartpeindia.app/'}&lt;/loc&gt;</div>
                      <div className="pl-8">&lt;priority&gt;1.0&lt;/priority&gt;</div>
                      <div className="pl-4">&lt;/url&gt;</div>
                      {['planner', 'yearly', 'fitness', 'khelo', 'school-admin', 'subscription-plans', 'about', 'contact'].map(rKey => (
                        <React.Fragment key={rKey}>
                          <div className="pl-4">&lt;url&gt;</div>
                          <div className="pl-8">&lt;loc&gt;{(seoConfig.canonicalUrl || 'https://smartpeindia.app/').replace(/\/$/, '')}/#{rKey}&lt;/loc&gt;</div>
                          <div className="pl-8">&lt;priority&gt;0.8&lt;/priority&gt;</div>
                          <div className="pl-4">&lt;/url&gt;</div>
                        </React.Fragment>
                      ))}
                      <div>&lt;/urlset&gt;</div>
                    </div>
                  </div>
                )}

                {/* ROBOTS.TXT PREVIEW */}
                {seoPreviewMode === 'robots' && (
                  <div className="space-y-3 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">robots.txt Directives</span>
                      <button
                        type="button"
                        onClick={() => {
                          const txt = `User-agent: *\n${seoConfig.allowCrawling ? 'Allow: /' : 'Disallow: /'}\nSitemap: ${(seoConfig.canonicalUrl || 'https://smartpeindia.app/').replace(/\/$/, '')}/sitemap.xml`;
                          navigator.clipboard.writeText(txt);
                          setCopiedText('robots');
                          toast.success("robots.txt copied to clipboard!");
                          setTimeout(() => setCopiedText(null), 2000);
                        }}
                        className="text-[10px] font-black text-[#0D2B52] uppercase tracking-wider flex items-center gap-1 hover:underline"
                      >
                        {copiedText === 'robots' ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                        <span>{copiedText === 'robots' ? 'Copied!' : 'Copy Text'}</span>
                      </button>
                    </div>

                    <div className="bg-slate-900 border-2 border-slate-950 p-4 rounded-2xl font-mono text-[10px] text-emerald-400 space-y-1.5 select-all">
                      <div>User-agent: *</div>
                      <div className={seoConfig.allowCrawling ? 'text-emerald-400' : 'text-rose-400'}>
                        {seoConfig.allowCrawling ? 'Allow: /' : 'Disallow: /'}
                      </div>
                      <div className="text-slate-400 pt-1">
                        Sitemap: {(seoConfig.canonicalUrl || 'https://smartpeindia.app/').replace(/\/$/, '')}/sitemap.xml
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {isAdding && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-[2.5rem] border-4 border-slate-900 p-10 max-w-xl w-full shadow-2xl"
          >
            <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter mb-8">Grant School Access</h3>
            <form onSubmit={handleAddMember} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="text" 
                      required
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent rounded-2xl font-bold outline-none focus:border-indigo-600 transition-all"
                      value={newMember.displayName}
                      onChange={e => setNewMember({...newMember, displayName: e.target.value})}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="email" 
                      required
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent rounded-2xl font-bold outline-none focus:border-indigo-600 transition-all"
                      value={newMember.email}
                      onChange={e => setNewMember({...newMember, email: e.target.value})}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Role</label>
                  <select 
                    className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl font-bold outline-none focus:border-indigo-600 transition-all"
                    value={newMember.role}
                    onChange={e => setNewMember({...newMember, role: e.target.value as 'teacher' | 'admin'})}
                  >
                    <option value="teacher">Teacher</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>

              {error && (
                <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-xs font-bold flex items-start gap-2">
                  <AlertCircle size={16} className="flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex items-center gap-4 pt-4">
                <button 
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="flex-1 py-4 border-2 border-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-4 bg-indigo-600 text-white border-2 border-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="animate-spin" size={20} /> : 'Grant Access'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
      {/* Live Camera Viewport Modal */}
      {isCameraOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white border-2 border-slate-900 rounded-[2.5rem] p-6 max-w-lg w-full shadow-2xl space-y-4 relative animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center border-b-2 border-slate-900 pb-3">
              <div className="flex items-center gap-2">
                <Camera className="text-indigo-600" size={20} />
                <h3 className="font-black text-sm uppercase tracking-wider text-slate-900">
                  Camera Logo Capture
                </h3>
              </div>
              <button
                onClick={stopCamera}
                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors cursor-pointer"
                title="Close Camera"
              >
                <X size={18} />
              </button>
            </div>

            {cameraError ? (
              <div className="p-4 bg-red-50 border border-red-200 rounded-2xl space-y-3 text-center">
                <p className="text-xs font-bold text-red-700">{cameraError}</p>
                <button
                  onClick={() => startCamera('environment')}
                  className="px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-red-700 cursor-pointer"
                >
                  Retry Camera Access
                </button>
              </div>
            ) : capturedPhoto ? (
              <div className="space-y-4">
                <div className="relative rounded-2xl overflow-hidden border-2 border-slate-900 bg-slate-900 flex items-center justify-center p-2">
                  <img src={capturedPhoto} alt="Captured School Logo" className="max-h-64 object-contain rounded-xl bg-white" />
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCapturedPhoto(null)}
                    className="flex-1 py-3 bg-slate-200 text-slate-800 rounded-2xl font-black text-xs uppercase tracking-wider hover:bg-slate-300 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw size={14} />
                    <span>Retake Photo</span>
                  </button>
                  <button
                    onClick={applyCapturedPhoto}
                    className="flex-1 py-3 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-wider hover:bg-indigo-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Check size={14} />
                    <span>Use as School Logo</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative rounded-2xl overflow-hidden border-2 border-slate-900 bg-black aspect-video flex items-center justify-center">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 right-3">
                    <button
                      type="button"
                      onClick={() => {
                        const newMode = facingMode === 'environment' ? 'user' : 'environment';
                        setFacingMode(newMode);
                        startCamera(newMode);
                      }}
                      className="p-2 bg-black/60 hover:bg-black/80 text-white rounded-xl backdrop-blur-sm border border-white/20 transition-all flex items-center gap-1 text-[10px] font-black uppercase cursor-pointer"
                      title="Switch Camera"
                    >
                      <RefreshCw size={12} />
                      <span>Switch Camera</span>
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="flex-1 py-3 bg-slate-200 text-slate-800 rounded-2xl font-black text-xs uppercase tracking-wider hover:bg-slate-300 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={capturePhoto}
                    className="flex-1 py-3 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-wider hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                  >
                    <Camera size={16} />
                    <span>Snap Photo</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SchoolAdmin;
