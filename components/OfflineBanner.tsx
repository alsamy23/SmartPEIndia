import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw, CheckCircle2, ShieldCheck, Database, Layers } from 'lucide-react';
import { offlineCacheService } from '../services/offlineCacheService.ts';
import { fitnessService } from '../services/fitnessService.ts';
import { toast } from '../services/toast.ts';

interface OfflineBannerProps {
  onSyncComplete?: () => void;
}

export const OfflineBanner: React.FC<OfflineBannerProps> = ({ onSyncComplete }) => {
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [justCameOnline, setJustCameOnline] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [status, setStatus] = useState(offlineCacheService.getOfflineStatus());
  const [isDismissed, setIsDismissed] = useState<boolean>(false);

  const refreshStatus = () => {
    setStatus(offlineCacheService.getOfflineStatus());
  };

  const checkServerConnectivity = async (): Promise<boolean> => {
    try {
      const controller = new AbortController();
      const timer = window.setTimeout(() => controller.abort(), 3500);
      const res = await fetch(`/api/health?t=${Date.now()}`, {
        cache: 'no-store',
        signal: controller.signal
      });
      window.clearTimeout(timer);
      return res.ok;
    } catch {
      return false;
    }
  };

  const handleSyncPending = async () => {
    const queue = offlineCacheService.getPendingStudentSyncQueue();
    if (queue.length === 0) {
      toast.info('No pending offline student records to sync.');
      return;
    }

    setIsSyncing(true);
    try {
      for (const item of queue) {
        if (item.action === 'create' || item.action === 'update') {
          await fitnessService.saveStudent(item.student);
        } else if (item.action === 'delete') {
          await fitnessService.deleteStudent(item.student.id, item.student.schoolId);
        }
      }
      offlineCacheService.clearPendingStudentSyncQueue();
      refreshStatus();
      toast.success(`Successfully synced ${queue.length} offline student record(s)!`);
      if (onSyncComplete) onSyncComplete();
    } catch (err) {
      console.error('Failed to sync offline queue:', err);
      toast.error('Failed to sync some offline records. Will retry when connection stabilizes.');
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    // Verify if browser actually lacks connectivity when navigator.onLine is false
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      checkServerConnectivity().then((reachable) => {
        if (mounted && !reachable) {
          setIsOffline(true);
          refreshStatus();
        }
      });
    }

    const handleOnline = async () => {
      if (!mounted) return;
      setIsOffline(false);
      setJustCameOnline(true);
      setIsDismissed(false);
      refreshStatus();

      // Attempt automatic sync when coming online
      const queue = offlineCacheService.getPendingStudentSyncQueue();
      if (queue.length > 0) {
        await handleSyncPending();
      }

      setTimeout(() => {
        if (mounted) setJustCameOnline(false);
      }, 5000);
    };

    const handleOffline = async () => {
      const reachable = await checkServerConnectivity();
      if (!mounted || reachable) return;
      setIsOffline(true);
      setJustCameOnline(false);
      setIsDismissed(false);
      refreshStatus();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Periodic check
    const interval = setInterval(refreshStatus, 10000);

    return () => {
      mounted = false;
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  if (isDismissed) return null;

  if (isOffline) {
    return (
      <div id="offline-status-banner" className="w-full bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white px-4 py-2 text-xs font-bold shadow-sm border-b border-amber-500/30 flex items-center justify-between flex-wrap gap-2 transition-all">
        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-200 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-100"></span>
          </span>
          <div className="flex items-center gap-1.5">
            <WifiOff size={15} className="shrink-0 text-amber-200" />
            <span>Outdoor Offline Mode Active:</span>
          </div>
          <span className="font-normal text-amber-100 hidden sm:inline">
            Accessing cached Student Directory ({status.cachedStudentCount} students) & Lesson Plans.
          </span>
          {status.pendingSyncCount > 0 && (
            <span className="bg-amber-900/60 text-amber-200 px-2 py-0.5 rounded-md text-[10px] font-black border border-amber-400/40">
              {status.pendingSyncCount} edit(s) pending sync
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsDismissed(true)}
            className="text-amber-200 hover:text-white text-[11px] font-extrabold underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      </div>
    );
  }

  if (justCameOnline) {
    return (
      <div id="online-sync-banner" className="bg-emerald-600 text-white px-4 py-2 text-xs font-bold shadow-md flex items-center justify-between flex-wrap gap-2 animate-slide-up">
        <div className="flex items-center gap-2">
          <Wifi size={15} className="shrink-0 text-emerald-200" />
          <span>Back Online! Student Directory & Lesson Plans synchronized with server.</span>
        </div>
        <button
          onClick={() => setJustCameOnline(false)}
          className="text-emerald-200 hover:text-white text-[10px] font-black uppercase cursor-pointer"
        >
          Close
        </button>
      </div>
    );
  }

  return null;
};
