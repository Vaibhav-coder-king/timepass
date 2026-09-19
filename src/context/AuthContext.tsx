import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

export type UserRole = 'Hospital' | 'NGO' | 'Family' | 'User';

export interface AuthUser {
  id: number;
  username: string;
  role: UserRole;
  device_id: string | null;
  region: string | null;
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  role: UserRole | null;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_AUTH_KEY = 'cogniva_auth_state';

const API_URL = `http://${window.location.hostname}:5000/api`;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_AUTH_KEY);
      return stored ? JSON.parse(stored).user : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState<string | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_AUTH_KEY);
      return stored ? JSON.parse(stored).token : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (user && token) {
      localStorage.setItem(STORAGE_AUTH_KEY, JSON.stringify({ user, token }));
    } else {
      localStorage.removeItem(STORAGE_AUTH_KEY);
    }
  }, [user, token]);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const res = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) return false;

      const data = await res.json();
      setUser(data.user);
      setToken(data.token);
      return true;
    } catch (err) {
      console.error('Login error:', err);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        isAuthenticated: !!user && !!token,
        role: user ? user.role : null,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}
