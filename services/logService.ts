
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from './firebase';
import { reportIncident, isBenignError } from './telemetryService';

export interface AppErrorLog {
  message: string;
  stack?: string;
  componentStack?: string;
  userId?: string;
  userEmail?: string;
  platform: string;
  url: string;
  timestamp: any;
  type: 'error' | 'promise_rejection' | 'react_error';
}

export const logError = async (error: any, type: AppErrorLog['type'] = 'error', extraInfo?: any) => {
  try {
    const msg = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;

    // Filter out common dev/environment noise (e.g. Vite HMR WebSocket closes, AbortController, ResizeObserver)
    if (isBenignError(msg, stack || extraInfo)) {
      return;
    }

    const user = auth.currentUser;
    const log: AppErrorLog = {
      message: msg,
      stack: error instanceof Error ? error.stack : undefined,
      componentStack: extraInfo?.componentStack,
      userId: user?.uid,
      userEmail: user?.email || undefined,
      platform: navigator.userAgent,
      url: window.location.href,
      timestamp: serverTimestamp(),
      type
    };

    // Log to console as well for dev visibility
    console.group(`🔴 Remote Log [${type}]`);
    console.error(error);
    console.groupEnd();

    // Forward to server telemetry (works for guest visitors too & alerts admin)
    reportIncident({
      category: type === 'react_error' ? 'CRITICAL_RUNTIME_ERROR' : 'CRITICAL_RUNTIME_ERROR',
      title: `Client Error [${type}]: ${msg.slice(0, 60)}`,
      message: msg,
      module: 'Client UI',
      details: { stack: log.stack, componentStack: log.componentStack }
    }).catch(() => {});

    if (user) {
      await addDoc(collection(db, 'system_logs'), log);
    }
  } catch (err) {
    // Fail silently to avoid infinite loops if Firestore fails
    console.warn("Failed to send remote log:", err);
  }
};

