import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';

/**
 * AuthContext — JWT-backed session state for CampusKey.
 *
 * On mount: reads ck_token from sessionStorage → calls GET /auth/me to validate
 *           server-side. If the token is expired/invalid, it's cleared and the
 *           user is sent to "/" by ProtectedRoute.
 *
 * Provides:
 *   user        { email } | null
 *   isLoading   true while the initial /auth/me check is in-flight
 *   login(user, token)  — store JWT + set user
 *   logout()            — clear JWT + user
 */

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,      setUser]      = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // ── Rehydrate: validate stored token against /auth/me ─────────────────────
  useEffect(() => {
    const token = sessionStorage.getItem('ck_token');

    if (!token) {
      setIsLoading(false);
      return;
    }

    api.me()
      .then(data => setUser(data.user))
      .catch(() => {
        // Token expired or server unreachable — clear stale state
        sessionStorage.removeItem('ck_token');
        sessionStorage.removeItem('ck_email');
      })
      .finally(() => setIsLoading(false));
  }, []);

  /** Called after successful login or enrolment. */
  const login = useCallback((userData, token) => {
    if (token) sessionStorage.setItem('ck_token', token);
    sessionStorage.setItem('ck_email', userData.email);
    setUser(userData);
  }, []);

  /** Clear all auth state. */
  const logout = useCallback(() => {
    sessionStorage.removeItem('ck_token');
    sessionStorage.removeItem('ck_email');
    sessionStorage.removeItem('ck_welcomed');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
