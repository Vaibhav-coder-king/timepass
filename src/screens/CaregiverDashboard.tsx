import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import {
  ArrowLeft,
  AlertTriangle,
  BarChart2,
  RefreshCw,
  Stethoscope,
  LogOut,
  Calendar,
  Clock,
  TrendingUp,
} from 'lucide-react';
import { type AnalyticsData, fetchAnalytics } from '../services/syncService';
import { useAuth } from '../context/AuthContext';

// ─── Types ────────────────────────────────────────────────────────────────────

type LoadState = 'loading' | 'success' | 'error' | 'offline';

// ─── Recharts data transformer ────────────────────────────────────────────────

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

// ─── Tooltip styling ──────────────────────────────────────────────────────────

function CognivaTooltip({ active, payload, label }: {
  active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-2xl px-4 py-3 shadow-xl"
      style={{ background: '#fff', border: '1.5px solid rgba(124,92,252,0.18)', minWidth: 150 }}
    >
      <div className="flex items-center gap-1.5 font-bold text-xs mb-1.5 text-indigo-900 border-b pb-1">
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

// ─── Fallback Sample Data for Visual Graph Preview ────────────────────────────

const SAMPLE_MEMORY_MATCH = {
  labels: ['18 Oct 10:15', '19 Oct 11:30', '20 Oct 15:45', '21 Oct 09:20', '21 Oct 16:10'],
  raw_time: [42, 38, 35, 32, 29],
  moving_avg_time: [42, 40, 38.3, 35, 32],
  raw_errors: [4, 3, 3, 2, 1],
  moving_avg_errors: [4, 3.5, 3.3, 2.7, 2],
};

const SAMPLE_DAILY_SEQUENCE = {
  labels: ['18 Oct 10:25', '19 Oct 11:40', '20 Oct 15:55', '21 Oct 09:30', '21 Oct 16:20'],
  raw_time: [35, 30, 28, 25, 22],
  moving_avg_time: [35, 32.5, 31, 27.6, 25],
  raw_errors: [3, 2, 2, 1, 1],
  moving_avg_errors: [3, 2.5, 2.3, 1.7, 1.3],
};

// ─── CaregiverDashboard ───────────────────────────────────────────────────────

export function CaregiverDashboard() {
  const navigate   = useNavigate();
  const { user, logout } = useAuth();
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [data,      setData]      = useState<AnalyticsData | null>(null);
  const [lastFetch, setLastFetch] = useState<string>('');
  const [currentDateTime, setCurrentDateTime] = useState<string>('');
  const [useSampleDataIfEmpty, setUseSampleDataIfEmpty] = useState<boolean>(true);

  // Live clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentDateTime(
        now.toLocaleDateString('en-IN', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }) +
          ' · ' +
          now.toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
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
      const now = new Date();
      setLastFetch(
        now.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) +
          ', ' +
          now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
      );
      setLoadState('success');
    } catch {
      setLoadState(navigator.onLine ? 'error' : 'offline');
    }
  };

  useEffect(() => { load(); }, []);

  // Determine active dataset (real or reference sample)
  const hasRealMMData = (data?.MEMORY_MATCH?.labels?.length ?? 0) > 0;
  const hasRealDSData = (data?.DAILY_SEQUENCE?.labels?.length ?? 0) > 0;

  const mmSource = hasRealMMData ? data!.MEMORY_MATCH : (useSampleDataIfEmpty ? SAMPLE_MEMORY_MATCH : null);
  const dsSource = hasRealDSData ? data!.DAILY_SEQUENCE : (useSampleDataIfEmpty ? SAMPLE_DAILY_SEQUENCE : null);

  const mmTimeData = mmSource
    ? toChartData(mmSource.labels, mmSource.raw_time, mmSource.moving_avg_time, 'Raw', 'Avg (3-session)')
    : [];

  const mmErrorData = mmSource
    ? toChartData(mmSource.labels, mmSource.raw_errors, mmSource.moving_avg_errors, 'Errors', 'Moving Avg')
    : [];

  const dsTimeData = dsSource
    ? toChartData(dsSource.labels, dsSource.raw_time, dsSource.moving_avg_time, 'Raw', 'Avg (3-session)')
    : [];

  const dsErrorData = dsSource
    ? toChartData(dsSource.labels, dsSource.raw_errors, dsSource.moving_avg_errors, 'Errors', 'Moving Avg')
    : [];

  return (
    <div
      className="min-h-screen w-full"
      style={{ background: 'rgb(var(--color-surface-bg))' }}
    >
      {/* ── Header ────────────────────────────────────────────────────────── */}
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
          className="flex items-center justify-center rounded-2xl active:scale-95 active:opacity-80 transition-all"
          style={{ width: 52, height: 52, background: 'rgba(var(--color-primary),0.08)', color: 'rgb(var(--color-text-secondary))' }}
        >
          <ArrowLeft className="w-6 h-6" />
        </button>

        <div className="text-center">
          <h1
            className="font-extrabold text-[rgb(var(--color-text-primary))]"
            style={{ fontFamily: 'Nunito, Inter, sans-serif', fontSize: 'var(--text-xl)' }}
          >
            Care Insights
          </h1>
          {lastFetch && (
            <p className="text-[rgb(var(--color-text-secondary))] flex items-center justify-center gap-1 mt-0.5" style={{ fontSize: 'var(--text-xs)' }}>
              <Clock className="w-3 h-3 text-[rgb(var(--color-primary))]" />
              <span>Synced {lastFetch}</span>
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {user && (
            <div className="hidden sm:flex flex-col items-end text-right">
              <span className="text-xs font-extrabold text-[rgb(var(--color-text-primary))]">
                {user.username}
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300 uppercase tracking-wider">
                {user.role} {user.region ? `· ${user.region}` : ''}
              </span>
            </div>
          )}

          <button
            onClick={load}
            aria-label="Refresh analytics"
            disabled={loadState === 'loading'}
            className="flex items-center justify-center rounded-2xl transition-all disabled:opacity-40 active:scale-95 active:opacity-80"
            style={{ width: 48, height: 48, background: 'rgba(var(--color-primary),0.08)', color: 'rgb(var(--color-primary))' }}
          >
            <motion.div
              animate={loadState === 'loading' ? { rotate: 360 } : { rotate: 0 }}
              transition={loadState === 'loading' ? { duration: 1, repeat: Infinity, ease: 'linear' } : {}}
            >
              <RefreshCw className="w-5 h-5" />
            </motion.div>
          </button>

          <button
            onClick={() => { logout(); navigate('/'); }}
            aria-label="Log out of caregiver dashboard"
            title="Log out"
            className="flex items-center justify-center rounded-2xl transition-all active:scale-95 active:opacity-80 border border-transparent dark:bg-slate-800 dark:text-white dark:border-blue-400"
            style={{ width: 48, height: 48, background: 'rgba(239,68,68,0.1)', color: 'rgb(239,68,68)' }}
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* ── Real-Time Date & Time Overview Banner ───────────────────────── */}
      <div className="px-5 pt-4">
        <div
          className="rounded-3xl p-4 flex items-center justify-between border"
          style={{
            background: 'linear-gradient(135deg, rgba(124,92,252,0.08) 0%, rgba(249,115,22,0.05) 100%)',
            borderColor: 'rgba(124,92,252,0.15)',
          }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/15 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-[rgb(var(--color-text-secondary))] uppercase tracking-wider">
                Monitoring Session Time
              </p>
              <p className="font-extrabold text-sm text-[rgb(var(--color-text-primary))]">
                {currentDateTime || 'Loading current time…'}
              </p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/10 text-emerald-600 font-bold text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Active Care Log</span>
          </div>
        </div>
      </div>

      {/* ── Action Buttons ────────────────────────────────────────────── */}
      <div className="px-5 pt-3 pb-2 space-y-3">
        <motion.button
          onClick={() => navigate('/triage')}
          whileTap={{ scale: 0.96 }}
          transition={{ type: 'spring', damping: 18, stiffness: 300 }}
          className="w-full flex items-center justify-center gap-3 rounded-3xl font-bold text-white active:opacity-90 transition-all border border-transparent dark:bg-slate-800 dark:text-white dark:border-blue-400"
          style={{
            height: 60,
            fontSize: 'var(--text-base)',
            background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
            boxShadow: 'var(--shadow-float)',
          }}
          aria-label="Start cognitive triage assessment"
        >
          <Stethoscope className="w-5 h-5" aria-hidden="true" />
          Clinical Triage Assessment (Offline)
        </motion.button>
      </div>

      {/* ── Body ──────────────────────────────────────────────────────────── */}
      <main className="px-5 pb-12 pt-2 space-y-6">

        {/* Loading */}
        {loadState === 'loading' && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            >
              <BarChart2 className="w-10 h-10" style={{ color: 'rgb(var(--color-primary))' }} />
            </motion.div>
            <p style={{ fontSize: 'var(--text-lg)', color: 'rgb(var(--color-text-secondary))' }}>
              Loading patient insights…
            </p>
          </div>
        )}

        {/* Error / Offline with option to view reference graph */}
        {(loadState === 'error' || loadState === 'offline') && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl p-6 text-center"
            style={{
              background: 'rgba(249,115,22,0.08)',
              border: '1.5px solid rgba(249,115,22,0.25)',
            }}
          >
            <p className="text-4xl mb-3" aria-hidden="true">
              {loadState === 'offline' ? '📶' : '🔌'}
            </p>
            <p
              className="font-bold text-[rgb(var(--color-text-primary))] mb-1"
              style={{ fontSize: 'var(--text-xl)' }}
            >
              {loadState === 'offline' ? 'Offline Mode Active' : 'Backend Server Reconnecting'}
            </p>
            <p
              className="text-[rgb(var(--color-text-secondary))] mb-4"
              style={{ fontSize: 'var(--text-base)' }}
            >
              {loadState === 'offline'
                ? 'Showing cached reference trajectory. Connect to backend to sync latest sessions.'
                : 'Showing standard clinical trajectory. Backend will sync automatically.'}
            </p>
            <button
              onClick={load}
              className="font-bold rounded-3xl text-white px-8 active:scale-95 active:opacity-80 transition-all"
              style={{ height: 50, fontSize: 'var(--text-base)', background: 'rgb(var(--color-secondary))' }}
            >
              Retry Sync
            </button>
          </motion.div>
        )}

        {/* Success or preview graphs */}
        <AnimatePresence>
          {((loadState === 'success' && data) || (loadState !== 'loading' && useSampleDataIfEmpty)) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              {/* ── Attention Alert ─────────────────────────────────────────── */}
              {data?.attention_needed && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-4 rounded-3xl p-5"
                  role="alert"
                  style={{
                    background: 'rgba(251,191,36,0.12)',
                    border: '2px solid rgba(251,191,36,0.4)',
                  }}
                >
                  <AlertTriangle className="w-7 h-7 flex-shrink-0 mt-0.5" style={{ color: 'rgb(180,130,0)' }} aria-hidden="true" />
                  <div>
                    <p
                      className="font-bold mb-1"
                      style={{ fontSize: 'var(--text-lg)', color: 'rgb(120,85,0)' }}
                    >
                      Attention Suggested
                    </p>
                    <p
                      className="leading-relaxed"
                      style={{ fontSize: 'var(--text-base)', color: 'rgb(140,100,0)' }}
                    >
                      Patient is experiencing increased friction in recent sessions. Consider adjusting the daily routine or taking a short break from games.
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Sample baseline indicator badge if displaying reference data */}
              {!hasRealMMData && !hasRealDSData && (
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-amber-600" />
                    <span className="text-xs font-semibold">
                      Displaying Reference Cognitive Graph (Play games to record live patient telemetry)
                    </span>
                  </div>
                  <button
                    onClick={() => setUseSampleDataIfEmpty(!useSampleDataIfEmpty)}
                    className="text-xs font-bold underline px-2"
                  >
                    {useSampleDataIfEmpty ? 'Hide Reference' : 'Show Reference'}
                  </button>
                </div>
              )}

              {/* ── Summary cards ──────────────────────────────────────────── */}
              <SummaryCard
                title="Memory Match"
                emoji="🧩"
                sessions={hasRealMMData ? data!.MEMORY_MATCH : SAMPLE_MEMORY_MATCH}
                isSample={!hasRealMMData}
                color="rgb(124,92,252)"
              />

              <SummaryCard
                title="Daily Sequence"
                emoji="🌅"
                sessions={hasRealDSData ? data!.DAILY_SEQUENCE : SAMPLE_DAILY_SEQUENCE}
                isSample={!hasRealDSData}
                color="rgb(249,115,22)"
              />

              {/* ── Charts — Memory Match ───────────────────────────────────── */}
              {mmTimeData.length > 0 && (
                <ChartCard
                  title="Memory Match — Response Time"
                  subtitle="Response duration in seconds over dates & times (downward trend indicates cognitive speed improvement)"
                  tag={!hasRealMMData ? 'Reference Baseline' : undefined}
                >
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={mmTimeData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.07)" />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} tickLine={false} />
                      <YAxis tick={{ fontSize: 11 }} tickLine={false} unit="s" />
                      <Tooltip content={<CognivaTooltip />} />
                      <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                      <Line type="monotone" dataKey="Raw" stroke="rgba(124,92,252,0.35)" strokeWidth={1.5} dot={{ r: 3 }} />
                      <Line type="monotone" dataKey="Avg (3-session)" stroke="rgb(124,92,252)" strokeWidth={2.5} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartCard>
              )}

              {mmErrorData.length > 0 && (
                <ChartCard
                  title="Memory Match — Accuracy & Error Trend"
                  subtitle="Error count per recorded session over date/time (lower is better)"
                  tag={!hasRealMMData ? 'Reference Baseline' : undefined}
                >
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={mmErrorData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.07)" />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} tickLine={false} />
                      <YAxis tick={{ fontSize: 11 }} tickLine={false} allowDecimals={false} />
                      <Tooltip content={<CognivaTooltip />} />
                      <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                      <Line type="monotone" dataKey="Errors" stroke="rgba(249,115,22,0.35)" strokeWidth={1.5} dot={{ r: 3 }} />
                      <Line type="monotone" dataKey="Moving Avg" stroke="rgb(249,115,22)" strokeWidth={2.5} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartCard>
              )}

              {/* ── Charts — Daily Sequence ─────────────────────────────────── */}
              {dsTimeData.length > 0 && (
                <ChartCard
                  title="Daily Sequence — Completion Time"
                  subtitle="Seconds to complete sequential daily living tasks across timeline"
                  tag={!hasRealDSData ? 'Reference Baseline' : undefined}
                >
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={dsTimeData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.07)" />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} tickLine={false} />
                      <YAxis tick={{ fontSize: 11 }} tickLine={false} unit="s" />
                      <Tooltip content={<CognivaTooltip />} />
                      <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                      <Line type="monotone" dataKey="Raw" stroke="rgba(16,185,129,0.35)" strokeWidth={1.5} dot={{ r: 3 }} />
                      <Line type="monotone" dataKey="Avg (3-session)" stroke="rgb(16,185,129)" strokeWidth={2.5} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartCard>
              )}

              {dsErrorData.length > 0 && (
                <ChartCard
                  title="Daily Sequence — Sequence Errors"
                  subtitle="Misplaced steps recorded per session date and time"
                  tag={!hasRealDSData ? 'Reference Baseline' : undefined}
                >
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={dsErrorData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.07)" />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} tickLine={false} />
                      <YAxis tick={{ fontSize: 11 }} tickLine={false} allowDecimals={false} />
                      <Tooltip content={<CognivaTooltip />} />
                      <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                      <Line type="monotone" dataKey="Errors" stroke="rgba(167,139,250,0.35)" strokeWidth={1.5} dot={{ r: 3 }} />
                      <Line type="monotone" dataKey="Moving Avg" stroke="rgb(124,92,252)" strokeWidth={2.5} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartCard>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface SummaryCardProps {
  title: string;
  emoji: string;
  sessions: {
    labels: string[];
    raw_time: number[];
    raw_errors: number[];
  };
  isSample?: boolean;
  color: string;
}

function SummaryCard({ title, emoji, sessions, isSample, color }: SummaryCardProps) {
  const totalSessions = sessions.labels.length;
  const avgTime = totalSessions > 0
    ? Math.round(sessions.raw_time.reduce((a, b) => a + b, 0) / totalSessions) : 0;
  const avgErrors = totalSessions > 0
    ? (sessions.raw_errors.reduce((a, b) => a + b, 0) / totalSessions).toFixed(1) : '—';

  return (
    <div
      className="rounded-3xl p-5"
      style={{ background: 'rgb(var(--color-surface-card))', boxShadow: 'var(--shadow-card)' }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className="flex-shrink-0 flex items-center justify-center rounded-2xl text-3xl"
            style={{ width: 56, height: 56, background: `${color}18` }}
            aria-hidden="true"
          >
            {emoji}
          </div>
          <div>
            <h2 className="font-extrabold text-[rgb(var(--color-text-primary))]" style={{ fontFamily: 'Nunito', fontSize: 'var(--text-lg)' }}>
              {title}
            </h2>
            <p className="text-[rgb(var(--color-text-secondary))]" style={{ fontSize: 'var(--text-sm)' }}>
              {totalSessions} session{totalSessions !== 1 ? 's' : ''} recorded {isSample ? '(Reference)' : ''}
            </p>
          </div>
        </div>
        {isSample && (
          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded-lg bg-indigo-500/10 text-indigo-600">
            Baseline
          </span>
        )}
      </div>

      <div className="flex gap-3">
        {[
          { label: 'Avg Time', value: totalSessions > 0 ? `${avgTime}s` : '—', emoji: '⏱️' },
          { label: 'Avg Errors', value: String(avgErrors), emoji: '🔁' },
          { label: 'Sessions', value: String(totalSessions), emoji: '📋' },
        ].map(({ label, value, emoji: e }) => (
          <div
            key={label}
            className="flex-1 flex flex-col items-center gap-0.5 rounded-2xl py-3"
            style={{ background: 'rgba(0,0,0,0.03)' }}
          >
            <span className="text-lg" aria-hidden="true">{e}</span>
            <span className="font-extrabold text-[rgb(var(--color-text-primary))]" style={{ fontSize: 'var(--text-lg)' }}>{value}</span>
            <span className="font-medium text-[rgb(var(--color-text-secondary))]" style={{ fontSize: 'var(--text-xs)' }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface ChartCardProps {
  title: string;
  subtitle: string;
  tag?: string;
  children: React.ReactNode;
}

function ChartCard({ title, subtitle, tag, children }: ChartCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl p-5"
      style={{ background: 'rgb(var(--color-surface-card))', boxShadow: 'var(--shadow-card)' }}
    >
      <div className="flex items-start justify-between gap-2 mb-0.5">
        <h3
          className="font-bold text-[rgb(var(--color-text-primary))]"
          style={{ fontSize: 'var(--text-base)' }}
        >
          {title}
        </h3>
        {tag && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300">
            {tag}
          </span>
        )}
      </div>
      <p
        className="text-[rgb(var(--color-text-secondary))] mb-4"
        style={{ fontSize: 'var(--text-xs)' }}
      >
        {subtitle}
      </p>
      {children}
    </motion.div>
  );
}
