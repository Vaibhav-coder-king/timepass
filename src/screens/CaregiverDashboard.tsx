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
  BarChart2,
} from 'lucide-react';
import { type AnalyticsData, type GameStats, fetchAnalytics } from '../services/syncService';
import { useAuth, type UserRole } from '../context/AuthContext';
import { getUnsyncedCount, getSessions } from '../utils/storage';
import { HUB_GAMES, GAME_REGISTRY } from '../utils/gameRegistry';

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
      className="rounded-2xl px-4 py-3 shadow-xl bg-white border border-stone-200 min-w-[150px] dark:bg-slate-900 dark:border-slate-700 text-stone-900 dark:text-stone-100"
    >
      <div className="flex items-center gap-1.5 font-bold text-xs mb-1.5 text-indigo-900 border-b pb-1 border-stone-200 dark:border-slate-800 dark:text-indigo-300">
        <Calendar className="w-3.5 h-3.5 text-indigo-500" />
        <span>{label}</span>
      </div>
      {payload.map(p => (
        <p key={p.name} className="font-semibold text-xs py-0.5 flex items-center justify-between gap-3">
          <span className="text-stone-600 dark:text-stone-300">{p.name}:</span>
          <span className="font-bold" style={{ color: p.color }}>{p.value}</span>
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
  const [selectedGameId, setSelectedGameId] = useState<string>('all');
  const [dateRange, setDateRange] = useState<'all' | '7d' | '30d'>('all');

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

  const getStats = (gameId: string): GameStats => {
    if (data?.games && data.games[gameId]) {
      return data.games[gameId];
    }
    if (data && data[gameId]) {
      return data[gameId] as GameStats;
    }
    return {
      labels: [],
      raw_time: [],
      raw_errors: [],
      moving_avg_time: [],
      moving_avg_errors: [],
      session_count: 0,
      avg_time: 0,
      avg_errors: 0,
    };
  };

  // Filter stats by date range if applicable
  const getFilteredChartData = (stats: GameStats, type: 'time' | 'errors') => {
    if (!stats || !stats.labels || stats.labels.length === 0) return [];
    let labels = stats.labels;
    let raw = type === 'time' ? stats.raw_time : stats.raw_errors;
    let avg = type === 'time' ? stats.moving_avg_time : stats.moving_avg_errors;

    if (dateRange === '7d') {
      labels = labels.slice(-7);
      raw = raw.slice(-7);
      avg = avg.slice(-7);
    } else if (dateRange === '30d') {
      labels = labels.slice(-15);
      raw = raw.slice(-15);
      avg = avg.slice(-15);
    }

    const rawKey = type === 'time' ? 'Raw (sec)' : 'Errors';
    const avgKey = type === 'time' ? '3-Session Avg' : 'Moving Avg';
    return toChartData(labels, raw, avg, rawKey, avgKey);
  };

  // Default radar data across active game modules
  const radarData = (data?.radar_scores as { domain: string; score: number; module: string }[]) || [
    { domain: 'Visual Recall', score: 85, module: 'Memory Match' },
    { domain: 'Routine Recall', score: 82, module: 'Daily Sequence' },
    { domain: 'Attention', score: 78, module: 'Listen & Tap' },
    { domain: 'Orientation', score: 88, module: "Today's World" },
    { domain: 'Auditory Rec', score: 74, module: 'Sounds Around' },
    { domain: 'Motor Stability', score: 91, module: 'Steady Hand' },
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

      {/* ── TAB 2: Performance Curves & Longitudinal Trends (ALL GAMES) ────── */}
      {activeTab === 'overview' && (
        <div className="px-5 pt-4 space-y-6">
          {/* Controls: Game Selector & Date Range Filter */}
          <div className="rounded-3xl p-5 bg-white border border-stone-200/80 shadow-sm space-y-4 dark:bg-slate-900 dark:border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-extrabold text-stone-900 dark:text-white flex items-center gap-2">
                  <BarChart2 className="w-5 h-5 text-violet-600" />
                  Cognitive Performance Analytics
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  Real longitudinal metrics across all 8 neurocognitive game modules
                </p>
              </div>

              {/* Date Range Selector */}
              <div className="flex items-center gap-1.5 bg-stone-100 p-1 rounded-2xl dark:bg-slate-800">
                {(['all', '7d', '30d'] as const).map(range => (
                  <button
                    key={range}
                    onClick={() => setDateRange(range)}
                    className={`px-3 py-1 text-xs font-bold rounded-xl transition-all ${
                      dateRange === range
                        ? 'bg-white shadow text-violet-700 dark:bg-slate-700 dark:text-violet-300'
                        : 'text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200'
                    }`}
                  >
                    {range === 'all' ? 'All Time' : range === '7d' ? 'Past 7d' : 'Past 30d'}
                  </button>
                ))}
              </div>
            </div>

            {/* Game Selector Chips */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 no-scrollbar">
              <button
                onClick={() => setSelectedGameId('all')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  selectedGameId === 'all'
                    ? 'bg-violet-600 text-white shadow'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200 dark:bg-slate-800 dark:text-stone-300'
                }`}
              >
                <span>🌐 All Games Overview</span>
              </button>

              {HUB_GAMES.map(game => {
                const stats = getStats(game.id);
                const hasData = stats.session_count > 0;
                const isSelected = selectedGameId === game.id;
                return (
                  <button
                    key={game.id}
                    onClick={() => setSelectedGameId(game.id)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-violet-600 text-white shadow'
                        : 'bg-stone-100 text-stone-600 hover:bg-stone-200 dark:bg-slate-800 dark:text-stone-300'
                    }`}
                  >
                    <span>{game.emoji}</span>
                    <span>{game.title}</span>
                    {hasData && (
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                        isSelected ? 'bg-violet-800 text-violet-200' : 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300'
                      }`}>
                        {stats.session_count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* VIEW A: ALL GAMES OVERVIEW */}
          {selectedGameId === 'all' && (
            <div className="space-y-5">
              {/* Overall Multi-Game Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-2xl bg-white border border-stone-200/80 shadow-sm dark:bg-slate-900 dark:border-slate-800">
                  <p className="text-[11px] font-bold text-stone-500 uppercase tracking-wider dark:text-stone-400">Total Sessions</p>
                  <p className="text-2xl font-extrabold text-stone-900 mt-1 dark:text-white">
                    {data?.session_count ?? HUB_GAMES.reduce((acc, g) => acc + getStats(g.id).session_count, 0)}
                  </p>
                  <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">Recorded patient trials</p>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-stone-200/80 shadow-sm dark:bg-slate-900 dark:border-slate-800">
                  <p className="text-[11px] font-bold text-stone-500 uppercase tracking-wider dark:text-stone-400">Active Modules</p>
                  <p className="text-2xl font-extrabold text-stone-900 mt-1 dark:text-white">
                    {HUB_GAMES.filter(g => getStats(g.id).session_count > 0).length} / {HUB_GAMES.length}
                  </p>
                  <p className="text-[11px] text-violet-600 font-semibold mt-0.5">Modules with baseline</p>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-stone-200/80 shadow-sm dark:bg-slate-900 dark:border-slate-800">
                  <p className="text-[11px] font-bold text-stone-500 uppercase tracking-wider dark:text-stone-400">Cognitive Status</p>
                  <p className="text-lg font-extrabold text-emerald-600 mt-1 dark:text-emerald-400">
                    {data?.attention_needed ? 'Needs Review' : 'Stable'}
                  </p>
                  <p className="text-[11px] text-stone-500 font-semibold mt-0.5">Rolling 3-day error rate</p>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-stone-200/80 shadow-sm dark:bg-slate-900 dark:border-slate-800">
                  <p className="text-[11px] font-bold text-stone-500 uppercase tracking-wider dark:text-stone-400">Domain Balance</p>
                  <p className="text-lg font-extrabold text-stone-900 mt-1 dark:text-white">
                    5-Axis Active
                  </p>
                  <p className="text-[11px] text-stone-500 font-semibold mt-0.5">Visual, motor, orientation</p>
                </div>
              </div>

              {/* Render an Individual Performance Chart card for EVERY registered game */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {HUB_GAMES.map(game => {
                  const stats = getStats(game.id);
                  const timeChartData = getFilteredChartData(stats, 'time');
                  const errorChartData = getFilteredChartData(stats, 'errors');
                  const hasData = stats.session_count > 0;

                  return (
                    <div
                      key={game.id}
                      className="rounded-3xl p-5 bg-white border border-stone-200/80 shadow-sm space-y-3 dark:bg-slate-900 dark:border-slate-800 flex flex-col justify-between"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-3xl" aria-hidden="true">{game.emoji}</span>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-base font-extrabold text-stone-900 dark:text-white">
                                {game.title}
                              </h4>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300">
                                {game.domain}
                              </span>
                            </div>
                            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                              {game.metricLabel} (Target: {game.unit})
                            </p>
                          </div>
                        </div>

                        {hasData ? (
                          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-xl dark:bg-emerald-950/40 dark:text-emerald-400">
                            {stats.session_count} session{stats.session_count === 1 ? '' : 's'}
                          </span>
                        ) : (
                          <span className="text-xs font-semibold text-stone-400 bg-stone-100 px-2.5 py-1 rounded-xl dark:bg-slate-800 dark:text-stone-500">
                            No data
                          </span>
                        )}
                      </div>

                      {/* Chart or Empty State */}
                      <div className="pt-2">
                        {hasData && timeChartData.length > 0 ? (
                          <div className="w-full h-44">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={timeChartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#64748b' }} />
                                <YAxis tick={{ fontSize: 9, fill: '#64748b' }} unit="s" />
                                <Tooltip content={<CognivaTooltip />} />
                                <Legend wrapperStyle={{ fontSize: 10 }} />
                                <Line type="monotone" dataKey="Raw (sec)" stroke="#f97316" strokeWidth={2} dot={{ r: 2.5 }} />
                                <Line type="monotone" dataKey="3-Session Avg" stroke="#7c3aed" strokeWidth={2.5} />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        ) : hasData && errorChartData.length > 0 ? (
                          <div className="w-full h-44">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={errorChartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#64748b' }} />
                                <YAxis tick={{ fontSize: 9, fill: '#64748b' }} />
                                <Tooltip content={<CognivaTooltip />} />
                                <Legend wrapperStyle={{ fontSize: 10 }} />
                                <Line type="monotone" dataKey="Errors" stroke="#ef4444" strokeWidth={2} dot={{ r: 2.5 }} />
                                <Line type="monotone" dataKey="Moving Avg" stroke="#3b82f6" strokeWidth={2.5} />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        ) : (
                          <div className="h-40 flex flex-col items-center justify-center text-center p-4 rounded-2xl bg-stone-50/70 border border-dashed border-stone-200 dark:bg-slate-800/50 dark:border-slate-800">
                            <span className="text-2xl mb-1 opacity-60">{game.emoji}</span>
                            <p className="text-xs font-bold text-stone-700 dark:text-stone-300">
                              No recorded sessions for {game.title} yet
                            </p>
                            <p className="text-[11px] text-stone-400 dark:text-stone-500 mt-1 max-w-xs">
                              Have the patient complete a trial to display longitudinal curves here.
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Footer metrics if available */}
                      {hasData && (
                        <div className="flex items-center justify-between text-[11px] font-semibold text-stone-500 pt-2 border-t border-stone-100 dark:border-slate-800 dark:text-stone-400">
                          <span>Avg Time: <strong className="text-stone-900 dark:text-white">{stats.avg_time ?? 0}s</strong></span>
                          <span>Avg Errors: <strong className="text-stone-900 dark:text-white">{stats.avg_errors ?? 0}</strong></span>
                          <button
                            onClick={() => setSelectedGameId(game.id)}
                            className="text-violet-600 hover:underline font-bold"
                          >
                            Detailed View →
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* VIEW B: INDIVIDUAL SELECTED GAME PERFORMANCE */}
          {selectedGameId !== 'all' && (() => {
            const game = GAME_REGISTRY[selectedGameId as keyof typeof GAME_REGISTRY] || HUB_GAMES.find(g => g.id === selectedGameId);
            const stats = getStats(selectedGameId);
            const timeData = getFilteredChartData(stats, 'time');
            const errorData = getFilteredChartData(stats, 'errors');
            const hasData = stats.session_count > 0;

            if (!game) return null;

            return (
              <div className="space-y-5">
                {/* Game Hero Card */}
                <div className="rounded-3xl p-6 bg-white border border-stone-200/80 shadow-sm dark:bg-slate-900 dark:border-slate-800">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-sm" style={{ background: game.gradient.from }}>
                        {game.emoji}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-xl font-extrabold text-stone-900 dark:text-white">
                            {game.title}
                          </h3>
                          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300">
                            {game.domain}
                          </span>
                        </div>
                        <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 max-w-xl">
                          {game.description}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedGameId('all')}
                      className="px-4 py-2 rounded-xl text-xs font-bold border border-stone-200 hover:bg-stone-50 dark:border-slate-700 dark:hover:bg-slate-800 transition-all self-start sm:self-auto"
                    >
                      ← Back to All Games
                    </button>
                  </div>

                  {/* Summary Bar */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-stone-100 dark:border-slate-800">
                    <div className="p-3 rounded-xl bg-stone-50 dark:bg-slate-800">
                      <p className="text-[10px] font-bold text-stone-400 uppercase">Recorded Plays</p>
                      <p className="text-lg font-extrabold text-stone-900 dark:text-white">{stats.session_count}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-stone-50 dark:bg-slate-800">
                      <p className="text-[10px] font-bold text-stone-400 uppercase">Average Duration</p>
                      <p className="text-lg font-extrabold text-violet-600 dark:text-violet-400">{stats.avg_time ?? 0}s</p>
                    </div>
                    <div className="p-3 rounded-xl bg-stone-50 dark:bg-slate-800">
                      <p className="text-[10px] font-bold text-stone-400 uppercase">Average Errors</p>
                      <p className="text-lg font-extrabold text-amber-600 dark:text-amber-400">{stats.avg_errors ?? 0}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-stone-50 dark:bg-slate-800">
                      <p className="text-[10px] font-bold text-stone-400 uppercase">Difficulty Tier</p>
                      <p className="text-lg font-extrabold text-stone-900 dark:text-white">{game.difficulty.split('—')[0]}</p>
                    </div>
                  </div>
                </div>

                {/* Performance Charts */}
                {hasData ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Time Curve */}
                    <div className="rounded-3xl p-5 bg-white border border-stone-200/80 shadow-sm space-y-3 dark:bg-slate-900 dark:border-slate-800">
                      <div>
                        <h4 className="text-base font-extrabold text-stone-900 dark:text-white">
                          Response Time & Speed Curve
                        </h4>
                        <p className="text-xs text-stone-500 dark:text-stone-400">
                          Seconds per session trial (Raw vs 3-session moving average)
                        </p>
                      </div>

                      <div className="w-full h-56">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={timeData}>
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
                    </div>

                    {/* Error Curve */}
                    <div className="rounded-3xl p-5 bg-white border border-stone-200/80 shadow-sm space-y-3 dark:bg-slate-900 dark:border-slate-800">
                      <div>
                        <h4 className="text-base font-extrabold text-stone-900 dark:text-white">
                          Error Frequency & Mistake Curve
                        </h4>
                        <p className="text-xs text-stone-500 dark:text-stone-400">
                          Unassisted missteps and retry counts per session
                        </p>
                      </div>

                      <div className="w-full h-56">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={errorData}>
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
                    </div>
                  </div>
                ) : (
                  <div className="rounded-3xl p-12 bg-white border border-stone-200/80 shadow-sm text-center space-y-3 dark:bg-slate-900 dark:border-slate-800">
                    <div className="w-16 h-16 rounded-full bg-violet-100 dark:bg-slate-800 text-3xl mx-auto flex items-center justify-center">
                      {game.emoji}
                    </div>
                    <h4 className="text-lg font-extrabold text-stone-900 dark:text-white">
                      No Recorded Sessions for {game.title}
                    </h4>
                    <p className="text-sm text-stone-500 dark:text-stone-400 max-w-md mx-auto leading-relaxed">
                      {game.title} is designed to exercise <strong>{game.domain}</strong>.
                      Once the patient plays this game on their device, their response time, errors, and progress over time will automatically appear in this chart.
                    </p>
                    <div className="pt-2">
                      <button
                        onClick={() => navigate(game.route)}
                        className="px-5 py-2.5 rounded-xl font-bold bg-violet-600 text-white hover:bg-violet-700 transition-all text-xs"
                      >
                        Launch {game.title} to Test
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
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
