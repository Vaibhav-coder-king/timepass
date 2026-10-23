import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import {
  ArrowLeft,
  AlertTriangle,
  RefreshCw,
  LogOut,
  Calendar,
  Clock,
  FileText,
} from 'lucide-react';
import { type AnalyticsData, fetchAnalytics } from '../services/syncService';
import { useAuth, type UserRole } from '../context/AuthContext';
import { getUnsyncedCount, getSessions } from '../utils/storage';

type LoadState = 'loading' | 'success' | 'error' | 'offline';

function toChartData(
  labels: string[],
  rawValues: number[],
  movingAvg: number[],
  rawKey: string,
  avgKey: string
) {
  return labels.map((label, i) => ({
    name: label,
    [rawKey]: rawValues[i],
    [avgKey]: movingAvg[i],
  }));
}

function CognivaTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-2xl px-4 py-3 shadow-xl bg-white border border-stone-200 min-w-[150px] dark:bg-slate-900 dark:border-slate-700"
    >
      <div className="flex items-center gap-1.5 font-bold text-xs mb-1.5 text-indigo-900 border-b pb-1 dark:text-indigo-300">
        <Calendar className="w-3.5 h-3.5 text-indigo-500" />
        <span>{label}</span>
      </div>
      {payload.map(p => (
        <p key={p.name} className="font-semibold text-sm" style={{ color: p.color }}>
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
}

export function CaregiverDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [currentDateTime, setCurrentDateTime] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'overview' | 'radar' | 'patients' | 'sync' | 'schemes'>('overview');

  const role: UserRole = user?.role || 'Family';

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentDateTime(
        now.toLocaleDateString('en-IN', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
        }) +
          ' · ' +
          now.toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
          })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const load = async () => {
    setLoadState('loading');
    try {
      const result = await fetchAnalytics();
      setData(result);
      setLoadState('success');
    } catch {
      setLoadState(navigator.onLine ? 'error' : 'offline');
    }
  };

  useEffect(() => {
    load();
  }, []);

  const mmSource = data?.MEMORY_MATCH;
  const dsSource = data?.DAILY_SEQUENCE;

  const mmTimeData = mmSource
    ? toChartData(mmSource.labels, mmSource.raw_time, mmSource.moving_avg_time, 'Raw (sec)', '3-Session Avg')
    : [];

  const dsErrorData = dsSource
    ? toChartData(dsSource.labels, dsSource.raw_errors, dsSource.moving_avg_errors, 'Errors', 'Moving Avg')
    : [];

  // Default radar data across the 5 neurocognitive modules
  const radarData = (data?.radar_scores as { domain: string; score: number; module: string }[]) || [
    { domain: 'Visuospatial', score: 82, module: 'Clock Draw' },
    { domain: 'Attention', score: 78, module: 'Audio Stroop' },
    { domain: 'Orientation', score: 88, module: 'Reality Anchor' },
    { domain: 'Auditory Rec', score: 74, module: 'Acoustic Rec' },
    { domain: 'Motor Stability', score: 91, module: 'Tremor Telemetry' },
  ];

  const unsyncedCount = getUnsyncedCount();
  const allLocalSessions = getSessions();

  return (
    <div
      className="min-h-screen w-full pb-24"
      style={{ background: 'rgb(var(--color-surface-bg))' }}
    >
      {/* ── Top Header ──────────────────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-20 flex items-center justify-between px-5 pt-6 pb-4"
        style={{
          background: 'rgba(var(--color-surface-bg), 0.95)',
          backdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(0,0,0,0.07)',
        }}
      >
        <button
          onClick={() => navigate('/')}
          aria-label="Back to patient home"
          className="flex items-center justify-center rounded-2xl active:scale-95 transition-all"
          style={{
            width: 50,
            height: 50,
            background: 'rgba(var(--color-primary),0.08)',
            color: 'rgb(var(--color-text-secondary))',
          }}
        >
          <ArrowLeft className="w-6 h-6" />
        </button>

        <div className="text-center">
          <h1
            className="font-extrabold text-[rgb(var(--color-text-primary))]"
            style={{ fontFamily: 'Nunito, Inter, sans-serif', fontSize: 'var(--text-lg)' }}
          >
            {role === 'Doctor'
              ? 'Clinician Observation Portal'
              : role === 'ASHA'
              ? 'ASHA Field Worker Desk'
              : role === 'Hospital'
              ? 'Institutional Healthcare Portal'
              : role === 'NGO'
              ? 'Community Programme Hub'
              : role === 'Admin'
              ? 'System Admin Console'
              : 'Family Caregiver Insights'}
          </h1>
          <p
            className="text-[rgb(var(--color-text-secondary))] flex items-center justify-center gap-1"
            style={{ fontSize: 'var(--text-xs)' }}
          >
            <Clock className="w-3 h-3 text-[rgb(var(--color-primary))]" />
            <span>{currentDateTime}</span>
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={load}
            aria-label="Refresh data"
            disabled={loadState === 'loading'}
            className="flex items-center justify-center rounded-2xl active:scale-95 transition-all text-violet-600 bg-violet-50 dark:bg-violet-950/40"
            style={{ width: 44, height: 44 }}
          >
            <RefreshCw className={`w-5 h-5 ${loadState === 'loading' ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => {
              logout();
              navigate('/');
            }}
            aria-label="Sign out"
            title="Sign out to unified portal"
            className="flex items-center justify-center rounded-2xl active:scale-95 transition-all text-stone-500 bg-stone-100 dark:bg-slate-800"
            style={{ width: 44, height: 44 }}
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ── Role Identity Banner ────────────────────────────────────────────── */}
      <div className="px-5 pt-3">
        <div className="p-3.5 rounded-2xl bg-white border border-stone-200/80 shadow-sm flex items-center justify-between dark:bg-slate-900 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center text-violet-700 font-bold dark:bg-violet-900/40 dark:text-violet-300">
              {role === 'Doctor' ? '🩺' : role === 'ASHA' ? '🌾' : role === 'Hospital' ? '🏥' : role === 'NGO' ? '🤝' : role === 'Admin' ? '⚙️' : '👨‍👩‍👧'}
            </div>
            <div>
              <p className="font-extrabold text-xs text-stone-900 dark:text-white">
                {user?.displayName || user?.username || 'Authenticated User'}
              </p>
              <p className="text-[11px] font-semibold text-stone-500 dark:text-stone-400">
                Role: <span className="text-violet-600 font-bold">{role}</span> · Scope:{' '}
                <span className="font-bold">{user?.region || user?.device_id || 'Global (NER)'}</span>
              </p>
            </div>
          </div>

          <button
            onClick={() => navigate('/govt-hub')}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 font-bold text-xs dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-300"
          >
            <FileText className="w-3 h-3 text-amber-600" />
            <span>Govt Hub</span>
          </button>
        </div>
      </div>

      {/* ── Attention Flag (Observation support only, never autonomous diagnosis) ── */}
      {data?.attention_needed && (
        <div className="px-5 pt-3">
          <div className="p-4 rounded-3xl bg-amber-50 border-2 border-amber-200 text-amber-900 space-y-1.5 dark:bg-amber-950/20 dark:border-amber-900/50 dark:text-amber-300">
            <div className="flex items-center gap-2 font-black text-sm">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <span>Observation Notice: Error Trend Detected</span>
            </div>
            <p className="text-xs font-medium leading-relaxed">
              Consecutive error counts exceeded the baseline threshold over the last 3 recorded sessions. Recommended: review session duration and encourage relaxed rest or gentle guidance before next gameplay.
            </p>
          </div>
        </div>
      )}

      {/* ── Sub-Navigation for Multi-Module Views ────────────────────────────── */}
      <div className="px-5 pt-4">
        <div className="flex gap-2 border-b border-stone-200 pb-2 dark:border-slate-800">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all ${
              activeTab === 'overview'
                ? 'bg-violet-600 text-white'
                : 'text-stone-600 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-slate-800'
            }`}
          >
            📊 Performance Curves
          </button>

          {(role === 'Doctor' || role === 'Hospital' || role === 'Admin') && (
            <button
              onClick={() => setActiveTab('radar')}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all ${
                activeTab === 'radar'
                  ? 'bg-violet-600 text-white'
                  : 'text-stone-600 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-slate-800'
              }`}
            >
              🕸️ 5-Axis Neuro Radar
            </button>
          )}

          {(role === 'ASHA' || role === 'Hospital' || role === 'NGO') && (
            <button
              onClick={() => setActiveTab('patients')}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all ${
                activeTab === 'patients'
                  ? 'bg-violet-600 text-white'
                  : 'text-stone-600 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-slate-800'
              }`}
            >
              👥 Community Caseload
            </button>
          )}

          <button
            onClick={() => setActiveTab('sync')}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all ${
              activeTab === 'sync'
                ? 'bg-violet-600 text-white'
                : 'text-stone-600 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-slate-800'
            }`}
          >
            🔄 Sync Queue ({unsyncedCount})
          </button>
        </div>
      </div>

      {/* ── TAB 1: 5-Axis Neurocognitive Radar Chart (Doctor / Clinician) ───── */}
      {activeTab === 'radar' && (
        <div className="px-5 pt-4 space-y-4">
          <div className="rounded-3xl p-5 bg-white border border-stone-200/80 shadow-md space-y-3 dark:bg-slate-900 dark:border-slate-800">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-violet-600 bg-violet-50 px-2 py-0.5 rounded-md dark:bg-violet-950/40">
                Observation Baseline
              </span>
              <h3 className="text-base font-extrabold text-stone-900 mt-1 dark:text-white">
                Five-Axis Task Performance Profile
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Hypothesized cognitive domain engagement from the 5 neurocognitive modules. (Non-diagnostic task indices).
              </p>
            </div>

            <div className="w-full h-64 sm:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#cbd5e1" />
                  <PolarAngleAxis dataKey="domain" tick={{ fill: '#64748b', fontSize: 11, fontWeight: 700 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#94a3b8" />
                  <Radar
                    name="Performance Index"
                    dataKey="score"
                    stroke="#7c3aed"
                    fill="#8b5cf6"
                    fillOpacity={0.45}
                  />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-stone-100 dark:border-slate-800">
              {radarData.map(r => (
                <div key={r.domain} className="p-2.5 rounded-xl bg-stone-50 border border-stone-100 dark:bg-slate-800 dark:border-slate-700">
                  <p className="font-extrabold text-stone-800 dark:text-stone-200">{r.domain}</p>
                  <p className="text-[11px] text-stone-500 font-semibold">{r.module}: <strong className="text-violet-600">{r.score}%</strong></p>
                </div>
              ))}
            </div>

            <p className="text-[11px] text-stone-400 text-center italic">
              Notice: Radar domain scores reflect simulated task proficiency and interaction telemetry. They do not constitute clinical neurological diagnostics.
            </p>
          </div>
        </div>
      )}

      {/* ── TAB 2: Performance Curves & Longitudinal Trends ─────────────────── */}
      {activeTab === 'overview' && (
        <div className="px-5 pt-4 space-y-5">
          {/* Memory Match Charts */}
          <div className="rounded-3xl p-5 bg-white border border-stone-200/80 shadow-md space-y-3 dark:bg-slate-900 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-stone-900 dark:text-white">
                  Memory Match — Response Time
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  Seconds per completed pair trial (Raw vs 3-session moving average)
                </p>
              </div>
            </div>

            {mmTimeData.length === 0 ? (
              <p className="text-xs text-stone-400 py-6 text-center">No Memory Match sessions recorded yet.</p>
            ) : (
              <div className="w-full h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={mmTimeData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} />
                    <YAxis tick={{ fontSize: 10, fill: '#64748b' }} unit="s" />
                    <Tooltip content={<CognivaTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line type="monotone" dataKey="Raw (sec)" stroke="#f97316" strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="3-Session Avg" stroke="#7c3aed" strokeWidth={2.5} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Daily Sequence Charts */}
          <div className="rounded-3xl p-5 bg-white border border-stone-200/80 shadow-md space-y-3 dark:bg-slate-900 dark:border-slate-800">
            <div>
              <h3 className="text-base font-extrabold text-stone-900 dark:text-white">
                Daily Sequence — Error Frequency
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Number of ordering misplacements before correct sequence completion
              </p>
            </div>

            {dsErrorData.length === 0 ? (
              <p className="text-xs text-stone-400 py-6 text-center">No Daily Sequence sessions recorded yet.</p>
            ) : (
              <div className="w-full h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dsErrorData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} />
                    <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
                    <Tooltip content={<CognivaTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line type="monotone" dataKey="Errors" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="Moving Avg" stroke="#3b82f6" strokeWidth={2.5} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 3: ASHA Community Caseload & Field Visit ──────────────────────── */}
      {activeTab === 'patients' && (
        <div className="px-5 pt-4 space-y-4">
          <div className="rounded-3xl p-5 bg-white border border-stone-200/80 shadow-md space-y-4 dark:bg-slate-900 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-stone-900 dark:text-white">
                  Field Caseload (Assam / Kamrup Sector)
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  Enrolled elder patients under community surveillance
                </p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                4 Patients
              </span>
            </div>

            <div className="space-y-2.5">
              {[
                { name: 'Arun (P-101)', age: 74, village: 'Kamrup Rural', lastPlay: 'Today, 10:15 AM', status: 'Active', compliance: '92%' },
                { name: 'Mina (P-102)', age: 68, village: 'Hajo Sector', lastPlay: 'Yesterday', status: 'Check-in Needed', compliance: '65%' },
                { name: 'Bhaben (P-103)', age: 81, village: 'Dispur Ward 4', lastPlay: '3 days ago', status: 'Visit Scheduled', compliance: '40%' },
                { name: 'Pranab (P-104)', age: 72, village: 'Sonapur', lastPlay: 'Today, 8:30 AM', status: 'Active', compliance: '88%' },
              ].map(pt => (
                <div key={pt.name} className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200/60 flex items-center justify-between dark:bg-slate-800/80 dark:border-slate-700">
                  <div>
                    <p className="font-extrabold text-sm text-stone-900 dark:text-white">{pt.name}</p>
                    <p className="text-xs text-stone-500 font-medium">Age {pt.age} · {pt.village}</p>
                    <p className="text-[11px] text-stone-400 mt-0.5">Last game: {pt.lastPlay}</p>
                  </div>
                  <div className="text-right space-y-1">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                      pt.status === 'Active'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                      {pt.status}
                    </span>
                    <p className="text-xs font-bold text-violet-700 dark:text-violet-300">{pt.compliance}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Field Checklist */}
            <div className="p-4 rounded-2xl bg-violet-50/60 border border-violet-100 space-y-2 dark:bg-violet-950/20 dark:border-violet-900/40">
              <p className="text-xs font-black text-violet-900 dark:text-violet-300">
                ✅ ASHA Field-Visit Routine:
              </p>
              <ul className="text-xs text-violet-950/80 space-y-1.5 list-disc list-inside font-medium dark:text-violet-200">
                <li>Check patient's temporal orientation (Reality Anchor).</li>
                <li>Verify PM-JAY 70+ Ayushman Card enrolment.</li>
                <li>Confirm morning & evening medicine taken from Reminders.</li>
                <li>Sync completed offline sessions when WiFi/4G hotspot is active.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 4: Sync Queue & Offline Persistence ──────────────────────────── */}
      {activeTab === 'sync' && (
        <div className="px-5 pt-4 space-y-4">
          <div className="rounded-3xl p-5 bg-white border border-stone-200/80 shadow-md space-y-3 dark:bg-slate-900 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-stone-900 dark:text-white">
                  Local Queue Telemetry
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  Sessions stored on device awaiting server receipt
                </p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                unsyncedCount === 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
              }`}>
                {unsyncedCount === 0 ? 'Queue Clean' : `${unsyncedCount} Queued`}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/60 text-xs space-y-2 dark:bg-slate-800 dark:border-slate-700">
              <div className="flex justify-between">
                <span className="text-stone-500">Total Local Sessions:</span>
                <strong className="text-stone-900 dark:text-white">{allLocalSessions.length}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Unacknowledged Records:</span>
                <strong className="text-amber-600">{unsyncedCount}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Network State:</span>
                <strong className={navigator.onLine ? 'text-emerald-600' : 'text-amber-600'}>
                  {navigator.onLine ? 'Online (4G / WiFi)' : 'Offline (Disconnected)'}
                </strong>
              </div>
            </div>

            <button
              onClick={load}
              className="w-full py-3 rounded-2xl font-bold text-white bg-violet-600 hover:bg-violet-700 transition-all text-xs shadow-md"
            >
              Trigger Batch Sync Now
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
