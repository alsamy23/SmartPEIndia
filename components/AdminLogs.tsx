import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';
import { 
  Terminal, AlertCircle, Clock, Globe, User, ExternalLink, 
  Copy, Check, Send, Settings, MessageCircle, ShieldCheck, 
  RefreshCw, CheckCircle2, Filter, AlertTriangle, Zap, Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  getLocalIncidents, 
  IncidentReport, 
  formatAIStudioPrompt, 
  buildWhatsAppSupportUrl,
  isBenignError 
} from '../services/telemetryService';

interface TelemetryConfigState {
  adminAlertEmail: string;
  adminWhatsAppNumber: string;
  emailAlertsEnabled: boolean;
}

const AdminLogs: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'all' | 'ai' | 'auth' | 'fitness' | 'tournament' | 'feedback' | 'settings'>('all');
  const [firestoreLogs, setFirestoreLogs] = useState<any[]>([]);
  const [serverIncidents, setServerIncidents] = useState<IncidentReport[]>([]);
  const [localIncidents, setLocalIncidents] = useState<IncidentReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Settings State
  const [config, setConfig] = useState<TelemetryConfigState>({
    adminAlertEmail: 'alsamy36@gmail.com',
    adminWhatsAppNumber: '919443389025',
    emailAlertsEnabled: true
  });
  const [savingConfig, setSavingConfig] = useState(false);
  const [configSavedToast, setConfigSavedToast] = useState(false);
  const [testingAlert, setTestingAlert] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; waUrl?: string } | null>(null);

  // API Health status
  const [healthStatus, setHealthStatus] = useState<{
    status: string;
    hasGemini: boolean;
    hasGroq: boolean;
    emailProvider?: string;
  } | null>(null);

  // Load server incidents and config
  const fetchTelemetryData = async () => {
    try {
      const [incidentsRes, configRes, healthRes] = await Promise.all([
        fetch('/api/telemetry/incidents').then(r => r.json()).catch(() => ({ incidents: [] })),
        fetch('/api/telemetry/config').then(r => r.json()).catch(() => null),
        fetch('/api/health').then(r => r.json()).catch(() => null)
      ]);

      if (incidentsRes?.incidents) {
        setServerIncidents(incidentsRes.incidents);
      }
      if (configRes?.config) {
        setConfig(configRes.config);
      }
      if (healthRes) {
        setHealthStatus(healthRes);
      }
    } catch (err) {
      console.warn('Telemetry load failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // 1. Fetch server incidents
    fetchTelemetryData();

    // 2. Fetch local storage incidents
    setLocalIncidents(getLocalIncidents());

    // 3. Listen to real-time firestore system_logs if authenticated
    const q = query(
      collection(db, 'system_logs'),
      orderBy('timestamp', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      try {
        const docs = snapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id
        }));
        setFirestoreLogs(docs);
      } catch (err) {
        // Non-blocking
      }
      setLoading(false);
    }, () => {
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Merge and deduplicate all incident streams
  const mergedLogs: IncidentReport[] = React.useMemo(() => {
    const list: IncidentReport[] = [...serverIncidents];

    // Merge from local incidents
    localIncidents.forEach(loc => {
      if (!list.some(item => item.id === loc.id || (item.message === loc.message && item.timestamp === loc.timestamp))) {
        list.push(loc);
      }
    });

    // Merge from firestore logs
    firestoreLogs.forEach(fs => {
      const id = fs.id || 'fs_' + Math.random();
      if (!list.some(item => item.id === id || item.message === fs.message)) {
        list.push({
          id,
          category: fs.category || (fs.type === 'react_error' ? 'CRITICAL_RUNTIME_ERROR' : 'CRITICAL_RUNTIME_ERROR'),
          title: fs.title || fs.message?.slice(0, 50) || 'Firestore Error Log',
          message: fs.message || 'No message',
          module: fs.module || 'System',
          details: fs.stack || fs.details,
          timestamp: fs.timestamp?.toDate ? fs.timestamp.toDate().toISOString() : new Date().toISOString(),
          userContext: {
            email: fs.userEmail,
            uid: fs.userId,
            pageUrl: fs.url
          }
        });
      }
    });

    return list
      .filter(item => !isBenignError(item.message, item.details) && !isBenignError(item.title, item.details))
      .sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());
  }, [serverIncidents, localIncidents, firestoreLogs]);

  // Filter logs by tab
  const filteredLogs = mergedLogs.filter(log => {
    if (activeTab === 'all') return true;
    if (activeTab === 'ai') return log.category === 'AI_GENERATION_FAILED';
    if (activeTab === 'auth') return log.category === 'AUTH_LOGIN_FAILED';
    if (activeTab === 'fitness') return log.category === 'FITNESS_TEST_FAILED';
    if (activeTab === 'tournament') return log.category === 'TOURNAMENT_CHECKIN_FAILED';
    if (activeTab === 'feedback') return log.category === 'USER_FEEDBACK' || !!log.userNote;
    return true;
  });

  const handleCopyPrompt = (incident: IncidentReport) => {
    const prompt = formatAIStudioPrompt(incident);
    navigator.clipboard.writeText(prompt);
    setCopiedId(incident.id || incident.message);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleOpenWhatsAppAlert = (incident: IncidentReport) => {
    const url = buildWhatsAppSupportUrl(config.adminWhatsAppNumber, incident);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleClearLogs = async () => {
    if (!window.confirm('Are you sure you want to clear telemetry incident history?')) return;
    try {
      localStorage.removeItem('smartpe_incident_logs');
      setLocalIncidents([]);
      await fetch('/api/telemetry/incidents', { method: 'DELETE' });
      setServerIncidents([]);
    } catch (err) {
      console.error('Failed to clear incident logs:', err);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingConfig(true);
    try {
      const res = await fetch('/api/telemetry/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      if (res.ok) {
        setConfigSavedToast(true);
        setTimeout(() => setConfigSavedToast(false), 3000);
      }
    } catch (err) {
      console.error('Config save failed:', err);
    } finally {
      setSavingConfig(false);
    }
  };

  const handleSendTestAlert = async () => {
    setTestingAlert(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/telemetry/test-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetEmail: config.adminAlertEmail,
          targetPhone: config.adminWhatsAppNumber
        })
      });
      const data = await res.json();
      if (data.success) {
        setTestResult({
          success: true,
          message: `Test email dispatched to ${config.adminAlertEmail}!`,
          waUrl: data.whatsappAlertUrl
        });
      } else {
        setTestResult({
          success: false,
          message: data.error || 'Failed to trigger alert test'
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Network error triggering alert test'
      });
    } finally {
      setTestingAlert(false);
    }
  };

  const getCategoryBadge = (cat?: string) => {
    switch (cat) {
      case 'AI_GENERATION_FAILED':
        return <span className="px-2.5 py-1 bg-amber-100 text-amber-800 border border-amber-200 rounded-full text-[10px] font-black uppercase">AI Key / Quota</span>;
      case 'AUTH_LOGIN_FAILED':
        return <span className="px-2.5 py-1 bg-rose-100 text-rose-800 border border-rose-200 rounded-full text-[10px] font-black uppercase">Login / Auth</span>;
      case 'FITNESS_TEST_FAILED':
        return <span className="px-2.5 py-1 bg-indigo-100 text-indigo-800 border border-indigo-200 rounded-full text-[10px] font-black uppercase">Fitness Test</span>;
      case 'TOURNAMENT_CHECKIN_FAILED':
        return <span className="px-2.5 py-1 bg-purple-100 text-purple-800 border border-purple-200 rounded-full text-[10px] font-black uppercase">Tournament Check-in</span>;
      case 'USER_FEEDBACK':
        return <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-full text-[10px] font-black uppercase">Visitor Report</span>;
      default:
        return <span className="px-2.5 py-1 bg-slate-100 text-slate-800 border border-slate-200 rounded-full text-[10px] font-black uppercase">System Incident</span>;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-slate-900 text-white rounded-2xl shadow-xl shadow-slate-200">
            <Terminal size={26} />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 font-display uppercase tracking-tight">
              Incident & Telemetry Command
            </h1>
            <p className="text-slate-500 font-medium text-xs md:text-sm">
              Instant alerts for visitor failures • Automated Email & WhatsApp dispatch • One-Click AI Studio rectification
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => { setLoading(true); fetchTelemetryData(); }}
            className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl transition-all shadow-sm flex items-center gap-1.5 text-xs font-bold"
            title="Refresh incident list"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            <span>Refresh</span>
          </button>
          <button
            onClick={handleClearLogs}
            className="p-2.5 bg-white border border-rose-200 hover:bg-rose-50 text-rose-600 rounded-xl transition-all shadow-sm flex items-center gap-1.5 text-xs font-bold"
            title="Clear all incident history"
          >
            <Trash2 size={14} />
            <span>Clear Logs</span>
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
              activeTab === 'settings' 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' 
                : 'bg-slate-900 text-white hover:bg-slate-800'
            }`}
          >
            <Settings size={14} />
            <span>Alert Settings</span>
          </button>
        </div>
      </div>

      {/* Live System Status Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">Total Incidents</span>
            <span className="text-2xl font-black text-slate-900">{mergedLogs.length}</span>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <AlertCircle size={20} />
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">AI Quota Issues</span>
            <span className="text-2xl font-black text-amber-600">
              {mergedLogs.filter(l => l.category === 'AI_GENERATION_FAILED').length}
            </span>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Zap size={20} />
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">Visitor Reports</span>
            <span className="text-2xl font-black text-emerald-600">
              {mergedLogs.filter(l => l.category === 'USER_FEEDBACK' || !!l.userNote).length}
            </span>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <MessageCircle size={20} />
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">Email Alerting</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`h-2.5 w-2.5 rounded-full ${config.emailAlertsEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
              <span className="text-xs font-black text-slate-800">
                {config.emailAlertsEnabled ? 'Active (Brevo)' : 'Disabled'}
              </span>
            </div>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <ShieldCheck size={20} />
          </div>
        </div>
      </div>

      {/* Navigation Filter Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
        {[
          { id: 'all', label: 'All Incidents', count: mergedLogs.length },
          { id: 'ai', label: 'AI Key / Quota', count: mergedLogs.filter(l => l.category === 'AI_GENERATION_FAILED').length },
          { id: 'auth', label: 'Login & Access', count: mergedLogs.filter(l => l.category === 'AUTH_LOGIN_FAILED').length },
          { id: 'fitness', label: 'Fitness Tests', count: mergedLogs.filter(l => l.category === 'FITNESS_TEST_FAILED').length },
          { id: 'tournament', label: 'Tournament Check-in', count: mergedLogs.filter(l => l.category === 'TOURNAMENT_CHECKIN_FAILED').length },
          { id: 'feedback', label: 'Visitor Reports', count: mergedLogs.filter(l => l.category === 'USER_FEEDBACK' || !!l.userNote).length },
          { id: 'settings', label: '⚙️ Settings & Alert Tests' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
              activeTab === tab.id
                ? 'bg-white text-slate-900 shadow-md border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <span>{tab.label}</span>
            {typeof tab.count === 'number' && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                activeTab === tab.id ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* TAB: SETTINGS & ALERT TESTING */}
      {activeTab === 'settings' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
          <div className="max-w-2xl">
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">
              Real-Time Alert Channels & Settings
            </h2>
            <p className="text-slate-500 text-xs md:text-sm mt-1 leading-relaxed">
              When any user or visitor faces a failure (AI generation timeout, fitness test login error, or tournament check-in issue), SmartPE will automatically send an email intimation and generate a WhatsApp message so you can immediately copy the diagnostics and fix it in AI Studio.
            </p>
          </div>

          <form onSubmit={handleSaveConfig} className="max-w-2xl space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase text-slate-700">
                Admin Notification Email (Receives Automated Incident Reports)
              </label>
              <input
                type="email"
                required
                value={config.adminAlertEmail}
                onChange={(e) => setConfig({ ...config, adminAlertEmail: e.target.value })}
                className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold text-slate-900"
                placeholder="alsamy36@gmail.com"
              />
              <span className="text-[11px] text-slate-400 block">
                Emails are dispatched via Brevo transactional service with ready-to-copy AI Studio prompt blocks.
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase text-slate-700">
                Admin WhatsApp Number (Country Code + Number, e.g. 919443389025)
              </label>
              <input
                type="text"
                required
                value={config.adminWhatsAppNumber}
                onChange={(e) => setConfig({ ...config, adminWhatsAppNumber: e.target.value })}
                className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold text-slate-900"
                placeholder="919443389025"
              />
              <span className="text-[11px] text-slate-400 block">
                Visitors can tap to chat with you on WhatsApp with pre-filled error codes, and you can receive 1-tap WhatsApp alert messages.
              </span>
            </div>

            <div className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
              <input
                type="checkbox"
                id="emailAlertsToggle"
                checked={config.emailAlertsEnabled}
                onChange={(e) => setConfig({ ...config, emailAlertsEnabled: e.target.checked })}
                className="h-4 w-4 text-indigo-600 rounded focus:ring-indigo-500"
              />
              <label htmlFor="emailAlertsToggle" className="text-xs font-bold text-slate-800 cursor-pointer">
                Enable Instant Email Alerts on Critical Errors (Throttled to avoid inbox flooding)
              </label>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={savingConfig}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-2"
              >
                {savingConfig ? <span>Saving...</span> : <span>Save Alert Settings</span>}
              </button>

              <button
                type="button"
                onClick={handleSendTestAlert}
                disabled={testingAlert}
                className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all flex items-center gap-2"
              >
                {testingAlert ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
                <span>Send Test Alert Now</span>
              </button>
            </div>

            {configSavedToast && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-600" />
                <span>Alert configuration saved successfully!</span>
              </div>
            )}

            {testResult && (
              <div className={`p-4 rounded-2xl border text-xs font-medium space-y-2 ${
                testResult.success ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}>
                <div className="flex items-center gap-2">
                  {testResult.success ? <CheckCircle2 size={18} className="text-emerald-600" /> : <AlertTriangle size={18} className="text-rose-600" />}
                  <span className="font-bold">{testResult.message}</span>
                </div>
                {testResult.waUrl && (
                  <div>
                    <a
                      href={testResult.waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-lg font-bold text-[11px] uppercase tracking-wider hover:bg-emerald-700"
                    >
                      <MessageCircle size={14} />
                      <span>Open WhatsApp Test Message</span>
                    </a>
                  </div>
                )}
              </div>
            )}
          </form>
        </div>
      )}

      {/* TAB: INCIDENTS LIST */}
      {activeTab !== 'settings' && (
        <div className="space-y-4">
          {loading ? (
            <div className="h-64 flex items-center justify-center bg-white border border-slate-200 rounded-3xl">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl py-20 text-center space-y-3">
              <CheckCircle2 size={40} className="text-emerald-500 mx-auto" />
              <h3 className="text-base font-black text-slate-800">No Incidents Recorded</h3>
              <p className="text-slate-400 text-xs font-medium max-w-md mx-auto">
                No errors match this filter. When any teacher or visitor faces an issue, it will immediately appear here and dispatch an alert.
              </p>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {filteredLogs.map((incident, idx) => {
                const incId = incident.id || `inc_${idx}`;
                const isCopied = copiedId === (incident.id || incident.message);

                return (
                  <motion.div
                    key={incId}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-lg transition-all space-y-3"
                  >
                    {/* Top Card Row */}
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        {getCategoryBadge(incident.category)}
                        <span className="text-xs font-bold text-slate-800">
                          Module: <strong>{incident.module}</strong>
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-[11px] text-slate-400">
                        <span className="flex items-center gap-1 font-mono">
                          <Clock size={12} />
                          {incident.timestamp ? new Date(incident.timestamp).toLocaleString() : 'Recent'}
                        </span>
                        {incident.userContext?.pageUrl && (
                          <span className="flex items-center gap-1 font-mono truncate max-w-[160px] bg-slate-50 px-2 py-0.5 rounded">
                            <Globe size={10} />
                            {incident.userContext.pageUrl.replace(/^https?:\/\/[^/]+/, '')}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Middle Row: Title & Error */}
                    <div className="flex items-start gap-3">
                      <AlertCircle size={20} className="text-rose-500 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-black text-slate-900 leading-snug">
                          {incident.title}
                        </h3>
                        <p className="text-xs text-rose-600 font-mono mt-1 bg-rose-50/70 p-2 rounded-lg border border-rose-100 break-all">
                          {incident.message}
                        </p>

                        {/* User feedback note if present */}
                        {incident.userNote && (
                          <div className="mt-2 p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 font-medium">
                            <span className="font-bold block text-[10px] uppercase text-amber-700">Visitor Explanation:</span>
                            "{incident.userNote}"
                            {incident.userContact && (
                              <span className="block mt-1 font-bold text-indigo-700 text-[11px]">
                                Contact Provided: {incident.userContact}
                              </span>
                            )}
                          </div>
                        )}

                        {incident.userContext?.email && (
                          <div className="flex items-center gap-1.5 text-xs text-indigo-600 font-bold mt-2">
                            <User size={12} />
                            <span>User: {incident.userContext.email}</span>
                          </div>
                        )}

                        {/* Stack trace / Details dropdown */}
                        {incident.details && (
                          <details className="mt-2 text-xs">
                            <summary className="text-[11px] font-bold text-slate-500 cursor-pointer hover:text-slate-800">
                              View Technical Details & Stack Trace
                            </summary>
                            <pre className="mt-2 p-3 bg-slate-900 text-slate-300 rounded-xl font-mono text-[10px] overflow-x-auto max-h-40">
                              {typeof incident.details === 'object' 
                                ? JSON.stringify(incident.details, null, 2) 
                                : String(incident.details)}
                            </pre>
                          </details>
                        )}
                      </div>
                    </div>

                    {/* Actions Row */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                      <div className="text-[10px] text-slate-400 font-mono">
                        Incident ID: <code>{incident.id || 'local'}</code>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpenWhatsAppAlert(incident)}
                          className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                        >
                          <MessageCircle size={13} />
                          <span>WhatsApp Alert</span>
                        </button>

                        <button
                          onClick={() => handleCopyPrompt(incident)}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                            isCopied 
                              ? 'bg-emerald-600 text-white shadow-md' 
                              : 'bg-slate-900 hover:bg-slate-800 text-white'
                          }`}
                        >
                          {isCopied ? (
                            <>
                              <Check size={14} />
                              <span>Copied for AI Studio!</span>
                            </>
                          ) : (
                            <>
                              <Copy size={13} />
                              <span>Copy AI Studio Prompt</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminLogs;
