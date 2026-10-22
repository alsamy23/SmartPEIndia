import { auth, db } from './firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export type IncidentCategory = 
  | 'AI_GENERATION_FAILED' 
  | 'AUTH_LOGIN_FAILED' 
  | 'FITNESS_TEST_FAILED' 
  | 'TOURNAMENT_CHECKIN_FAILED' 
  | 'CRITICAL_RUNTIME_ERROR' 
  | 'USER_FEEDBACK';

export interface IncidentReport {
  id?: string;
  category: IncidentCategory;
  title: string;
  message: string;
  module: string;
  details?: any;
  userContact?: string;
  userNote?: string;
  timestamp?: string;
  userContext?: {
    email?: string;
    uid?: string;
    role?: string;
    isGuest?: boolean;
    pageUrl?: string;
    userAgent?: string;
  };
}

const LOCAL_STORAGE_KEY = 'smartpe_incident_logs';
const MAX_LOCAL_LOGS = 50;

/**
 * Reads locally persisted incidents from localStorage
 */
export const getLocalIncidents = (): IncidentReport[] => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
};

/**
 * Saves an incident to localStorage
 */
const saveLocalIncident = (incident: IncidentReport) => {
  try {
    const list = getLocalIncidents();
    list.unshift(incident);
    if (list.length > MAX_LOCAL_LOGS) {
      list.length = MAX_LOCAL_LOGS;
    }
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    // Ignore storage quota errors
  }
};

/**
 * Helper to check if an error is normal development/browser noise
 * (e.g., Vite HMR WebSocket disconnects in iframe/proxy environments, AbortController cancellations, ResizeObserver loops)
 */
export const isBenignError = (msg?: string, stackOrDetails?: any): boolean => {
  if (!msg && !stackOrDetails) return false;
  const combined = `${msg || ''} ${typeof stackOrDetails === 'object' ? JSON.stringify(stackOrDetails) : String(stackOrDetails || '')}`.toLowerCase();

  const benignPatterns = [
    'websocket',
    '@vite/client',
    'vite',
    'hmr',
    'hot-update',
    'resizeobserver',
    'aborterror',
    'abort',
    'canceled',
    'cancelled',
    'networkerror',
    'failed to fetch',
    'load failed',
    'script error',
    'chrome-extension',
    'moz-extension',
    'safari-extension',
    'auth/popup-closed-by-user',
    'auth/cancelled-popup-request',
    'auth/user-cancelled'
  ];

  return benignPatterns.some(pattern => combined.includes(pattern));
};

/**
 * Universal incident and failure reporting pipeline
 */
export const reportIncident = async (payload: IncidentReport): Promise<{ success: boolean; whatsappAlertUrl?: string; incidentId?: string }> => {
  // Ignore harmless browser noise, Vite HMR WebSocket closures, and fetch aborts
  if (isBenignError(payload.message, payload.details) || isBenignError(payload.title, payload.details)) {
    return { success: true };
  }

  const currentUser = auth.currentUser;
  const isGuest = !currentUser;

  const enriched: IncidentReport = {
    ...payload,
    id: payload.id || 'inc_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    timestamp: payload.timestamp || new Date().toISOString(),
    userContext: {
      email: currentUser?.email || undefined,
      uid: currentUser?.uid || undefined,
      role: (currentUser as any)?.role || (isGuest ? 'Guest Visitor' : 'Authenticated Teacher'),
      isGuest,
      pageUrl: window.location.href,
      userAgent: navigator.userAgent,
      ...(payload.userContext || {})
    }
  };

  // 1. Always save in localStorage so diagnostics are never lost
  saveLocalIncident(enriched);

  // 2. Dispatch a local browser event so UI components (like Admin Logs or Help widget) can react
  try {
    window.dispatchEvent(new CustomEvent('smartpe:incident_reported', { detail: enriched }));
  } catch (e) {
    // Ignore
  }

  // 3. Try Firestore if user is authenticated (system_logs collection)
  if (currentUser) {
    try {
      addDoc(collection(db, 'system_logs'), {
        category: enriched.category,
        title: enriched.title,
        message: enriched.message,
        module: enriched.module,
        details: enriched.details ? JSON.stringify(enriched.details).slice(0, 2000) : null,
        url: enriched.userContext?.pageUrl,
        userId: currentUser.uid,
        userEmail: currentUser.email,
        timestamp: serverTimestamp()
      }).catch(() => {
        // Non-blocking firestore write
      });
    } catch (e) {
      // Non-blocking
    }
  }

  // 4. Send to Server Telemetry endpoint (Dispatches automated Email & generates WhatsApp link)
  try {
    const res = await fetch('/api/telemetry/incident', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(enriched)
    });

    if (res.ok) {
      const data = await res.json();
      return {
        success: true,
        incidentId: data.incidentId || enriched.id,
        whatsappAlertUrl: data.whatsappAlertUrl
      };
    }
  } catch (err) {
    console.warn('[Telemetry] Server report could not be dispatched (offline/network):', err);
  }

  // Fallback WhatsApp link if server is unreachable
  const cleanPhone = '919443389025';
  const fallbackWaText = `🚨 SmartPE Incident: ${enriched.category} in ${enriched.module}\nError: ${enriched.message.slice(0, 100)}\nReporter: ${enriched.userContext?.email || 'Guest'}`;
  const whatsappAlertUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(fallbackWaText)}`;

  return { success: true, incidentId: enriched.id, whatsappAlertUrl };
};

/**
 * Specialized Reporter: AI Generation / Quota Failure
 */
export const reportAIFailure = async (error: any, moduleName: string, promptInfo?: any) => {
  const errMsg = error?.message || String(error);
  const isQuota = errMsg.toLowerCase().includes('quota') || errMsg.toLowerCase().includes('rate limit') || errMsg.toLowerCase().includes('429');
  const isTimeout = errMsg.toLowerCase().includes('timeout') || errMsg.toLowerCase().includes('aborted');

  const title = isQuota 
    ? `AI Quota Exceeded in ${moduleName}` 
    : (isTimeout ? `AI Generation Timeout in ${moduleName}` : `AI Generation Failed in ${moduleName}`);

  return reportIncident({
    category: 'AI_GENERATION_FAILED',
    title,
    message: errMsg,
    module: moduleName,
    details: {
      isQuota,
      isTimeout,
      promptInfo: typeof promptInfo === 'object' ? promptInfo : { summary: String(promptInfo).slice(0, 250) }
    }
  });
};

/**
 * Specialized Reporter: Auth / Login Failure
 */
export const reportAuthFailure = async (error: any, screenName: string, context?: any) => {
  const errMsg = error?.message || String(error);
  return reportIncident({
    category: 'AUTH_LOGIN_FAILED',
    title: `Login / Authentication Error in ${screenName}`,
    message: errMsg,
    module: screenName,
    details: context
  });
};

/**
 * Specialized Reporter: Fitness Test / Student Access Failure
 */
export const reportFitnessTestFailure = async (error: any, actionName: string, context?: any) => {
  const errMsg = error?.message || String(error);
  return reportIncident({
    category: 'FITNESS_TEST_FAILED',
    title: `Fitness Test Failure: ${actionName}`,
    message: errMsg,
    module: 'Khelo India & Fitness Assessment Hub',
    details: context
  });
};

/**
 * Specialized Reporter: Tournament Check-in / Bracket Failure
 */
export const reportTournamentFailure = async (error: any, actionName: string, context?: any) => {
  const errMsg = error?.message || String(error);
  return reportIncident({
    category: 'TOURNAMENT_CHECKIN_FAILED',
    title: `Tournament Check-in Error: ${actionName}`,
    message: errMsg,
    module: 'Tournament Fixtures Studio',
    details: context
  });
};

/**
 * Specialized Reporter: User Feedback / Problem Report
 */
export const reportUserFeedback = async (userNote: string, userContact: string, context?: any) => {
  return reportIncident({
    category: 'USER_FEEDBACK',
    title: `Visitor Problem Report: "${userNote.slice(0, 50)}..."`,
    message: userNote,
    module: context?.module || 'Visitor Help Widget',
    userContact,
    userNote,
    details: context
  });
};

/**
 * Helper to build pre-formatted WhatsApp Click-to-Chat URL
 */
export const buildWhatsAppSupportUrl = (phone: string, incident?: IncidentReport, userMessage?: string) => {
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  let text = `Hello SmartPE Support,\n\n`;
  if (userMessage) {
    text += `${userMessage}\n\n`;
  }
  if (incident) {
    text += `*Details:*\n- Module: ${incident.module}\n- Issue: ${incident.title}\n- Error: ${incident.message?.slice(0, 100)}\n- Page: ${window.location.hash || window.location.pathname}\n\n`;
  }
  text += `Please help me resolve this.`;
  return `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(text)}`;
};

/**
 * Formats an incident into a prompt ready for AI Studio
 */
export const formatAIStudioPrompt = (incident: IncidentReport): string => {
  return `Fix the following issue in SmartPE India:
- Module: ${incident.module}
- Category: ${incident.category}
- Summary: ${incident.title}
- Error: ${incident.message}
- Page URL: ${incident.userContext?.pageUrl || 'SmartPE App'}
- Technical Details:
${typeof incident.details === 'object' ? JSON.stringify(incident.details, null, 2) : String(incident.details || '')}

Please inspect the code and implement the necessary fix.`;
};

/**
 * Auto-capture unhandled errors & unhandled promise rejections
 */
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    if (!reason) return;
    const msg = reason instanceof Error ? reason.message : String(reason);
    const stack = reason instanceof Error ? reason.stack : undefined;

    // Filter out common dev/browser noise like Vite HMR WebSocket disconnects, AbortError, etc.
    if (isBenignError(msg, stack || reason)) {
      return;
    }

    reportIncident({
      category: 'CRITICAL_RUNTIME_ERROR',
      title: 'Unhandled Promise Rejection',
      message: msg,
      module: 'Client Runtime',
      details: { stack }
    }).catch(() => {});
  });
}
