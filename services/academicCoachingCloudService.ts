import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  deleteDoc, 
  updateDoc, 
  arrayUnion 
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { AthleteProfile, AssessmentRecord, CoachProgramType } from './sportsCoachingService';
import { logError } from './logService';

export interface AcademicCoachingProgram {
  id: string;
  programName: string;
  programType: CoachProgramType;
  sport: string;
  sportsOffered?: string[];
  headCoachId: string;
  headCoachName: string;
  adminEmail?: string;
  coachEmails: string[];
  coachNames: string[];
  coachUids: string[];
  inviteCode: string;
  trialExpiresAt: string;
  createdAt: string;
  isCloudSynced: boolean;
  contactNumber?: string;
  location?: string;
}

const LOCAL_PROGRAM_KEY = 'smartpe_academic_coaching_program';
const LOCAL_ATHLETES_KEY = 'smartpe_sports_academy_athletes';
const LOCAL_ASSESSMENTS_KEY = 'smartpe_sports_academy_assessments';

export const academicCoachingCloudService = {
  /**
   * Calculates the remaining days and hours in the 5-Day Academic Access Window
   */
  calculateRemainingTrialDays(trialExpiresAt: string): { 
    days: number; 
    hours: number; 
    totalHoursLeft: number;
    isExpired: boolean; 
    formatted: string 
  } {
    if (!trialExpiresAt) {
      return { days: 5, hours: 0, totalHoursLeft: 120, isExpired: false, formatted: '5 Days' };
    }
    const expiryTime = new Date(trialExpiresAt).getTime();
    const now = Date.now();
    const diffMs = expiryTime - now;

    if (diffMs <= 0) {
      return { days: 0, hours: 0, totalHoursLeft: 0, isExpired: true, formatted: 'Expired' };
    }

    const totalHours = Math.floor(diffMs / (1000 * 60 * 60));
    const days = Math.floor(totalHours / 24);
    const hours = totalHours % 24;

    let formatted = '';
    if (days > 0) {
      formatted = `${days}d ${hours}h`;
    } else {
      formatted = `${hours}h remaining`;
    }

    return { days, hours, totalHoursLeft: totalHours, isExpired: false, formatted };
  },

  /**
   * Generates a clean 6-character group invite code (e.g. CP-942)
   */
  generateInviteCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'CP-';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  },

  /**
   * Loads local cached active academic program
   */
  getLocalProgram(): AcademicCoachingProgram | null {
    try {
      const stored = localStorage.getItem(LOCAL_PROGRAM_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error('Failed to read local coaching program', e);
    }
    return null;
  },

  /**
   * Saves local program cache
   */
  setLocalProgram(program: AcademicCoachingProgram): void {
    try {
      localStorage.setItem(LOCAL_PROGRAM_KEY, JSON.stringify(program));
    } catch (e) {
      console.error('Failed to cache coaching program', e);
    }
  },

  /**
   * Registers a new Academic Coaching Program in Cloud Firestore with 5-Day Access
   */
  async registerAcademicProgram(params: {
    programName: string;
    programType: CoachProgramType;
    sport: string;
    sportsOffered?: string[];
    coachName: string;
    adminEmail?: string;
    contactNumber?: string;
    location?: string;
  }): Promise<AcademicCoachingProgram> {
    const user = auth.currentUser;
    const coachUid = user?.uid || `guest_coach_${Date.now()}`;
    const coachEmail = params.adminEmail?.trim() || user?.email || 'coach@academic.smartpe.in';
    const programId = `acad_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    
    // Exactly 5 days from registration
    const now = new Date();
    const trialDate = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);
    const trialExpiresAt = trialDate.toISOString();
    const inviteCode = this.generateInviteCode();

    const program: AcademicCoachingProgram = {
      id: programId,
      programName: params.programName.trim(),
      programType: params.programType,
      sport: params.sport,
      sportsOffered: params.sportsOffered && params.sportsOffered.length > 0 ? params.sportsOffered : [params.sport],
      headCoachId: coachUid,
      headCoachName: params.coachName.trim() || 'Head Coach',
      adminEmail: coachEmail,
      coachEmails: [coachEmail],
      coachNames: [params.coachName.trim() || 'Head Coach'],
      coachUids: [coachUid],
      inviteCode,
      trialExpiresAt,
      createdAt: now.toISOString(),
      isCloudSynced: true,
      contactNumber: params.contactNumber || '',
      location: params.location || ''
    };

    // Save locally immediately
    this.setLocalProgram(program);

    // Save to Firestore if user is authenticated or guest
    try {
      await setDoc(doc(db, 'academic_programs', programId), program);
    } catch (err) {
      console.warn('Firestore offline or failed to save academic program, relying on local backup:', err);
      logError(err, 'error', { action: 'registerAcademicProgram', programId });
    }

    return program;
  },

  /**
   * Updates an existing Academic Coaching Program in Firestore & Local Cache
   */
  async updateAcademicProgram(
    programId: string,
    updates: Partial<AcademicCoachingProgram>
  ): Promise<AcademicCoachingProgram> {
    const current = this.getLocalProgram();
    const updated: AcademicCoachingProgram = {
      ...(current || {
        id: programId,
        programName: 'Sports Academy',
        programType: 'after_school_academy',
        sport: 'football',
        headCoachId: auth.currentUser?.uid || 'coach',
        headCoachName: 'Head Coach',
        coachEmails: [],
        coachNames: [],
        coachUids: [],
        inviteCode: this.generateInviteCode(),
        trialExpiresAt: new Date(Date.now() + 5 * 86400000).toISOString(),
        createdAt: new Date().toISOString(),
        isCloudSynced: true
      }),
      ...updates,
      id: programId
    };

    this.setLocalProgram(updated);

    try {
      await updateDoc(doc(db, 'academic_programs', programId), updates);
    } catch (err) {
      console.warn('Could not update academic program in Firestore:', err);
    }

    return updated;
  },

  /**
   * Directly adds a colleague coach by email to the Academy Database
   */
  async addColleagueCoach(
    programId: string,
    colleagueEmail: string,
    colleagueName?: string
  ): Promise<AcademicCoachingProgram> {
    const email = colleagueEmail.trim().toLowerCase();
    const name = colleagueName?.trim() || email.split('@')[0] || 'Colleague Coach';
    const current = this.getLocalProgram();

    if (!current) throw new Error('No active academy database found.');
    if (current.coachEmails.map(e => e.toLowerCase()).includes(email)) {
      throw new Error(`Coach with email ${email} is already registered in this academy.`);
    }

    const updatedEmails = [...current.coachEmails, email];
    const updatedNames = [...current.coachNames, name];

    const updatedProg: AcademicCoachingProgram = {
      ...current,
      coachEmails: updatedEmails,
      coachNames: updatedNames
    };

    this.setLocalProgram(updatedProg);

    try {
      await updateDoc(doc(db, 'academic_programs', programId), {
        coachEmails: arrayUnion(email),
        coachNames: arrayUnion(name)
      });
    } catch (err) {
      console.warn('Firestore addColleagueCoach warning:', err);
    }

    return updatedProg;
  },

  /**
   * Removes a colleague coach from the Academy Database
   */
  async removeColleagueCoach(
    programId: string,
    colleagueEmail: string
  ): Promise<AcademicCoachingProgram> {
    const email = colleagueEmail.trim().toLowerCase();
    const current = this.getLocalProgram();
    if (!current) throw new Error('No active academy database found.');

    const idx = current.coachEmails.findIndex(e => e.toLowerCase() === email);
    if (idx === -1) return current;

    const updatedEmails = current.coachEmails.filter((_, i) => i !== idx);
    const updatedNames = current.coachNames.filter((_, i) => i !== idx);

    const updatedProg: AcademicCoachingProgram = {
      ...current,
      coachEmails: updatedEmails,
      coachNames: updatedNames
    };

    this.setLocalProgram(updatedProg);

    try {
      await updateDoc(doc(db, 'academic_programs', programId), {
        coachEmails: updatedEmails,
        coachNames: updatedNames
      });
    } catch (err) {
      console.warn('Firestore removeColleagueCoach warning:', err);
    }

    return updatedProg;
  },

  /**
   * Allows 1 or 2 colleague teachers to join a group using the 6-character Invite Code
   */
  async joinProgramWithInviteCode(
    inviteCode: string,
    coachName: string
  ): Promise<AcademicCoachingProgram> {
    const cleanCode = inviteCode.trim().toUpperCase();
    const user = auth.currentUser;
    const coachUid = user?.uid || `coach_${Date.now()}`;
    const coachEmail = user?.email || 'assistant@academic.smartpe.in';
    const cleanCoachName = coachName.trim() || 'Co-Coach';

    try {
      const q = query(collection(db, 'academic_programs'), where('inviteCode', '==', cleanCode));
      const snap = await getDocs(q);

      if (snap.empty) {
        throw new Error(`Invalid Invite Code "${cleanCode}". Please verify with your lead coach.`);
      }

      const programDoc = snap.docs[0];
      const programData = programDoc.data() as AcademicCoachingProgram;

      // Ensure coach limit (Single coach or 1-2 teachers in group = max 3 coaches)
      if (!programData.coachUids.includes(coachUid)) {
        if (programData.coachUids.length >= 3) {
          throw new Error('This coaching group has reached its maximum cohort limit of 3 coaches for the 5-day academic pass.');
        }

        await updateDoc(programDoc.ref, {
          coachUids: arrayUnion(coachUid),
          coachNames: arrayUnion(cleanCoachName),
          coachEmails: arrayUnion(coachEmail)
        });

        programData.coachUids.push(coachUid);
        programData.coachNames.push(cleanCoachName);
        programData.coachEmails.push(coachEmail);
      }

      this.setLocalProgram(programData);
      return programData;
    } catch (error: any) {
      console.error('Failed to join coaching group:', error);
      throw error;
    }
  },

  /**
   * Saves an Athlete to Firestore under the Academic Coaching Program
   */
  async saveCloudAthlete(
    athlete: Omit<AthleteProfile, 'id'> & { id?: string },
    programId: string
  ): Promise<AthleteProfile> {
    const user = auth.currentUser;
    const id = athlete.id || `ath_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    const fullAthlete: AthleteProfile = {
      ...athlete,
      id
    };

    // Save to local cache first
    try {
      const raw = localStorage.getItem(LOCAL_ATHLETES_KEY);
      const list: AthleteProfile[] = raw ? JSON.parse(raw) : [];
      const idx = list.findIndex(a => a.id === id);
      if (idx >= 0) list[idx] = fullAthlete;
      else list.unshift(fullAthlete);
      localStorage.setItem(LOCAL_ATHLETES_KEY, JSON.stringify(list));
    } catch (e) {
      console.error('Local athlete cache error', e);
    }

    // Save to Firestore
    try {
      await setDoc(doc(db, 'academic_athletes', id), {
        ...fullAthlete,
        programId,
        createdByCoachId: user?.uid || 'coach',
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      console.warn('Could not sync athlete to Firestore, cached locally:', err);
    }

    return fullAthlete;
  },

  /**
   * Bulk saves multiple Athletes to Firestore and local storage (e.g. 30-40 students at once)
   */
  async saveCloudAthletesBatch(
    athletes: (Omit<AthleteProfile, 'id'> & { id?: string })[],
    programId: string
  ): Promise<number> {
    const user = auth.currentUser;
    const now = new Date().toISOString();
    
    // Read local cache
    let list: AthleteProfile[] = [];
    try {
      const raw = localStorage.getItem(LOCAL_ATHLETES_KEY);
      if (raw) list = JSON.parse(raw);
    } catch (e) {}

    const fullAthletes: AthleteProfile[] = athletes.map((a, idx) => ({
      ...a,
      id: a.id || `ath_${Date.now()}_${idx}_${Math.random().toString(36).substr(2, 4)}`
    }));

    // Update local cache
    fullAthletes.forEach(fa => {
      const existingIdx = list.findIndex(item => item.id === fa.id || (item.name.toLowerCase() === fa.name.toLowerCase() && item.sport === fa.sport));
      if (existingIdx >= 0) {
        list[existingIdx] = fa;
      } else {
        list.unshift(fa);
      }
    });

    try {
      localStorage.setItem(LOCAL_ATHLETES_KEY, JSON.stringify(list));
    } catch (e) {
      console.error('Failed to update local athlete batch cache', e);
    }

    // Save to Firestore in batches/parallel
    try {
      await Promise.all(
        fullAthletes.map(fa => 
          setDoc(doc(db, 'academic_athletes', fa.id), {
            ...fa,
            programId,
            createdByCoachId: user?.uid || 'coach',
            updatedAt: now
          })
        )
      );
    } catch (err) {
      console.warn('Could not sync some batch athletes to Firestore (saved locally):', err);
    }

    return fullAthletes.length;
  },

  /**
   * Saves an Assessment to Firestore under the Academic Coaching Program
   */
  async saveCloudAssessment(
    assessment: AssessmentRecord | any,
    programId: string
  ): Promise<any> {
    // Save locally
    try {
      const raw = localStorage.getItem(LOCAL_ASSESSMENTS_KEY);
      const list: AssessmentRecord[] = raw ? JSON.parse(raw) : [];
      const idx = list.findIndex(a => a.id === assessment.id);
      if (idx >= 0) list[idx] = assessment;
      else list.unshift(assessment);
      localStorage.setItem(LOCAL_ASSESSMENTS_KEY, JSON.stringify(list));
    } catch (e) {
      console.error('Local assessment cache error', e);
    }

    // Save to Firestore
    try {
      await setDoc(doc(db, 'academic_assessments', assessment.id), {
        ...assessment,
        programId,
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      console.warn('Could not sync assessment to Firestore, cached locally:', err);
    }

    return assessment;
  },

  /**
   * Fetches all athletes for an Academic Program from Firestore (with local fallback)
   */
  async fetchCloudAthletes(programId: string): Promise<AthleteProfile[]> {
    try {
      const q = query(collection(db, 'academic_athletes'), where('programId', '==', programId));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const athletes = snap.docs.map(d => {
          const data = d.data();
          return {
            id: data.id || d.id,
            name: data.name,
            age: data.age,
            gender: data.gender,
            sport: data.sport,
            programType: data.programType,
            squadOrBatch: data.squadOrBatch,
            jerseyNo: data.jerseyNo,
            guardianName: data.guardianName,
            guardianContact: data.guardianContact,
            notes: data.notes,
            joiningDate: data.joiningDate
          } as AthleteProfile;
        });

        // Update local cache
        localStorage.setItem(LOCAL_ATHLETES_KEY, JSON.stringify(athletes));
        return athletes;
      }
    } catch (err) {
      console.warn('Cloud athletes fetch failed or offline, reading local cache:', err);
    }

    // Fallback to local storage
    try {
      const stored = localStorage.getItem(LOCAL_ATHLETES_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return [];
  },

  /**
   * Fetches all assessments for an Academic Program from Firestore (with local fallback)
   */
  async fetchCloudAssessments(programId: string): Promise<AssessmentRecord[]> {
    try {
      const q = query(collection(db, 'academic_assessments'), where('programId', '==', programId));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const assessments = snap.docs.map(d => d.data() as AssessmentRecord);
        localStorage.setItem(LOCAL_ASSESSMENTS_KEY, JSON.stringify(assessments));
        return assessments;
      }
    } catch (err) {
      console.warn('Cloud assessments fetch failed or offline, reading local cache:', err);
    }

    // Fallback to local storage
    try {
      const stored = localStorage.getItem(LOCAL_ASSESSMENTS_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return [];
  },

  /**
   * Fetches a single assessment by ID from Firestore (with local fallback) for link-sharing
   */
  async fetchSingleCloudAssessment(assessmentId: string): Promise<any | null> {
    // Check local storage first
    try {
      const raw = localStorage.getItem(LOCAL_ASSESSMENTS_KEY);
      if (raw) {
        const list = JSON.parse(raw);
        const found = list.find((a: any) => a.id === assessmentId);
        if (found) return found;
      }
    } catch (e) {}

    // Check academyService assessments
    try {
      const rawAcad = localStorage.getItem('smartpe_academy_assessments_v1');
      if (rawAcad) {
        const list = JSON.parse(rawAcad);
        const found = list.find((a: any) => a.id === assessmentId);
        if (found) return found;
      }
    } catch (e) {}

    // Query Firestore collection 'academic_assessments'
    try {
      const snap = await getDoc(doc(db, 'academic_assessments', assessmentId));
      if (snap.exists()) {
        return snap.data();
      }
    } catch (err) {
      console.warn('Could not fetch cloud assessment by id:', err);
    }

    return null;
  },

  /**
   * Deletes an athlete from both Firestore and local storage
   */
  async deleteCloudAthlete(athleteId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'academic_athletes', athleteId));
    } catch (err) {
      console.warn('Cloud athlete deletion error:', err);
    }

    try {
      const raw = localStorage.getItem(LOCAL_ATHLETES_KEY);
      if (raw) {
        const list: AthleteProfile[] = JSON.parse(raw);
        const filtered = list.filter(a => a.id !== athleteId);
        localStorage.setItem(LOCAL_ATHLETES_KEY, JSON.stringify(filtered));
      }
    } catch (e) {}
  },

  /**
   * Deletes an assessment from both Firestore and local storage
   */
  async deleteCloudAssessment(assessmentId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'academic_assessments', assessmentId));
    } catch (err) {
      console.warn('Cloud assessment deletion error:', err);
    }

    try {
      const raw = localStorage.getItem(LOCAL_ASSESSMENTS_KEY);
      if (raw) {
        const list: AssessmentRecord[] = JSON.parse(raw);
        const filtered = list.filter(a => a.id !== assessmentId);
        localStorage.setItem(LOCAL_ASSESSMENTS_KEY, JSON.stringify(filtered));
      }
    } catch (e) {}
  }
};
