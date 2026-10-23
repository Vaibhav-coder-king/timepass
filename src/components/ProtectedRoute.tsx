import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, ShieldAlert, ArrowLeft, User, KeyRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth, type UserRole } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export function ProtectedRoute({
  children,
  allowedRoles = ['Hospital', 'Doctor', 'ASHA', 'NGO', 'Admin', 'Family'],
}: ProtectedRouteProps) {
  const { user, isAuthenticated, login, logout, enrollPatientDevice } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // If user is authenticated and has an allowed role, render the protected component
  if (isAuthenticated && user && allowedRoles.includes(user.role)) {
    return <>{children}</>;
  }

  // If authenticated as 'Patient' / 'User', deny access to clinical analytics
  if (isAuthenticated && user && (user.role === 'Patient' || user.role === 'User')) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center p-6 text-center"
        style={{ background: 'rgb(var(--color-surface-bg))' }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full rounded-3xl p-8 space-y-5 border-2 border-amber-200 bg-white shadow-xl dark:bg-slate-900 dark:border-amber-900"
        >
          <div className="w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center mx-auto text-amber-600">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-amber-800 dark:text-amber-400">Restricted Professional Area</h2>
          <p className="text-sm font-medium text-stone-600 dark:text-stone-300">
            You are currently on an active Patient Device Session (<strong>{user.displayName || user.username}</strong>).
            To safeguard mental well-being, raw clinical charts are reserved for authorized caregivers and clinicians.
          </p>
          <div className="flex flex-col gap-3 pt-2">
            <button
              onClick={() => logout()}
              className="w-full py-3.5 rounded-2xl font-bold text-white bg-slate-800 hover:bg-slate-700 transition-all"
            >
              Log in with Clinician / Caregiver Account
            </button>
            <button
              onClick={() => navigate('/')}
              className="w-full py-3.5 rounded-2xl font-bold text-stone-600 bg-stone-100 hover:bg-stone-200 transition-all dark:bg-slate-800 dark:text-stone-200"
            >
              Back to Patient Home
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const success = await login(username, password);
    setIsLoading(false);

    if (!success) {
      setError('Invalid username or password. Check credentials or select a quick demo role.');
    }
  };

  const fillDemo = async (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setError(null);
    setIsLoading(true);
    const success = await login(u, p);
    setIsLoading(false);
    if (!success) {
      setError('Invalid username or password.');
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-5"
      style={{ background: 'rgb(var(--color-surface-bg))' }}
    >
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md rounded-3xl p-6 sm:p-8 bg-white border border-stone-200 shadow-2xl space-y-6 dark:bg-slate-900 dark:border-slate-800"
      >
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            aria-label="Back to Patient Home"
            className="p-2.5 rounded-xl bg-stone-100 text-stone-600 hover:bg-stone-200 transition-all dark:bg-slate-800 dark:text-stone-200"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-violet-50 text-violet-700 font-bold text-xs uppercase tracking-wider dark:bg-violet-950/40 dark:text-violet-300">
            <Lock className="w-3.5 h-3.5" />
            Professional Portal
          </div>
        </div>

        <div className="text-center space-y-1">
          <h2 className="text-2xl font-black text-stone-900 dark:text-white" style={{ fontFamily: 'Nunito, sans-serif' }}>
            Unified Access Portal
          </h2>
          <p className="text-sm font-medium text-stone-500 dark:text-stone-400">
            Authenticate to access role-specific dashboards & patient records
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold leading-relaxed">
            {error}
          </div>
        )}

        <form onSubmit={handleLoginSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
              <User className="w-4 h-4 text-violet-600" /> Username
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="e.g. dr_sharma, asha_kalita, family_carer"
              className="w-full px-4 py-3 rounded-2xl border border-stone-200 bg-stone-50 text-stone-900 font-medium focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm dark:bg-slate-800 dark:border-slate-700 dark:text-white"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
              <KeyRound className="w-4 h-4 text-violet-600" /> Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-2xl border border-stone-200 bg-stone-50 text-stone-900 font-medium focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm dark:bg-slate-800 dark:border-slate-700 dark:text-white"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 rounded-2xl font-bold text-white transition-all shadow-lg active:scale-95 disabled:opacity-60"
            style={{
              background: 'linear-gradient(135deg, rgb(124,92,252) 0%, rgb(99,102,241) 100%)',
            }}
          >
            {isLoading ? 'Authenticating...' : 'Sign In to Portal'}
          </button>
        </form>

        {/* Quick Demo Selector for all 7 platform roles */}
        <div className="pt-2 border-t border-stone-100 dark:border-slate-800">
          <p className="text-[11px] font-bold uppercase tracking-wider text-stone-400 mb-2.5 text-center">
            Quick Switch Portal Roles (Demo)
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => fillDemo('dr_sharma', 'doc123')}
              className="p-2 rounded-xl border border-stone-200 bg-stone-50 hover:bg-violet-50 hover:border-violet-300 text-stone-800 font-bold transition-all text-left dark:bg-slate-800 dark:border-slate-700 dark:text-stone-200"
            >
              🩺 Doctor (Clinician)
            </button>
            <button
              type="button"
              onClick={() => fillDemo('asha_kalita', 'asha123')}
              className="p-2 rounded-xl border border-stone-200 bg-stone-50 hover:bg-violet-50 hover:border-violet-300 text-stone-800 font-bold transition-all text-left dark:bg-slate-800 dark:border-slate-700 dark:text-stone-200"
            >
              🌾 ASHA (Field Worker)
            </button>
            <button
              type="button"
              onClick={() => fillDemo('family_carer', 'fam123')}
              className="p-2 rounded-xl border border-stone-200 bg-stone-50 hover:bg-violet-50 hover:border-violet-300 text-stone-800 font-bold transition-all text-left dark:bg-slate-800 dark:border-slate-700 dark:text-stone-200"
            >
              👨‍👩‍👧 Family (Caregiver)
            </button>
            <button
              type="button"
              onClick={() => fillDemo('admin_hospital', 'hosp123')}
              className="p-2 rounded-xl border border-stone-200 bg-stone-50 hover:bg-violet-50 hover:border-violet-300 text-stone-800 font-bold transition-all text-left dark:bg-slate-800 dark:border-slate-700 dark:text-stone-200"
            >
              🏥 Hospital (Admin)
            </button>
            <button
              type="button"
              onClick={() => fillDemo('ngo_worker', 'ngo123')}
              className="p-2 rounded-xl border border-stone-200 bg-stone-50 hover:bg-violet-50 hover:border-violet-300 text-stone-800 font-bold transition-all text-left dark:bg-slate-800 dark:border-slate-700 dark:text-stone-200"
            >
              🤝 NGO (NER Programmes)
            </button>
            <button
              type="button"
              onClick={() => fillDemo('sys_admin', 'admin123')}
              className="p-2 rounded-xl border border-stone-200 bg-stone-50 hover:bg-violet-50 hover:border-violet-300 text-stone-800 font-bold transition-all text-left dark:bg-slate-800 dark:border-slate-700 dark:text-stone-200"
            >
              ⚙️ System Admin
            </button>
          </div>

          <div className="pt-3">
            <button
              type="button"
              onClick={() => {
                enrollPatientDevice();
                navigate('/');
              }}
              className="w-full py-2.5 rounded-xl border-2 border-dashed border-violet-300 bg-violet-50/50 hover:bg-violet-100/50 text-violet-800 font-bold text-xs transition-all dark:bg-violet-950/20 dark:border-violet-800 dark:text-violet-300"
            >
              ✨ Zero-Password Patient Onboarding (Device Session)
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
