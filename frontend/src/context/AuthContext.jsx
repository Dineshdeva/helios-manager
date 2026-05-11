/**
 * AuthContext — tracks whether the user is authenticated via the BFF session.
 *
 * On mount it calls GET /bff/auth/status. The browser never receives the
 * Helios access token; it only carries a signed HttpOnly session cookie.
 *
 * Also handles the ?auth=success / ?auth=error query params that Okta
 * redirects back with after the Authorization Code flow completes.
 */
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getAuthStatus, postLogout, BFF_BASE } from '../services/api';

const DEFAULT_LOGIN_URL = `${BFF_BASE}/auth/login`;

const AuthContext = createContext({
  authenticated: false,
  user: null,
  loginUrl: DEFAULT_LOGIN_URL,
  loading: true,
  authError: null,
  logout: async () => {},
  refresh: async () => {},
});

export function AuthProvider({ children }) {
  const [state, setState] = useState({
    authenticated: false,
    user: null,
    loginUrl: DEFAULT_LOGIN_URL,
    loading: true,
    authError: null,
  });

  const refresh = useCallback(async () => {
    try {
      const data = await getAuthStatus();
      setState((s) => ({
        ...s,
        authenticated: data.authenticated,
        user: data.user,
        loginUrl: DEFAULT_LOGIN_URL,
        loading: false,
        authError: null,
      }));
    } catch {
      setState((s) => ({ ...s, loading: false }));
    }
  }, []);

  useEffect(() => {
    // Check if Okta just redirected back to us
    const params = new URLSearchParams(window.location.search);
    const authResult = params.get('auth');
    const message = params.get('message');

    if (authResult) {
      // Strip auth params from the URL without a page reload
      const clean = new URL(window.location.href);
      clean.searchParams.delete('auth');
      clean.searchParams.delete('message');
      window.history.replaceState({}, '', clean.toString());
    }

    if (authResult === 'error') {
      setState((s) => ({
        ...s,
        loading: false,
        authError: message || 'Authentication failed.',
      }));
    } else {
      refresh();
    }
  }, [refresh]);

  const logout = useCallback(async () => {
    await postLogout().catch(() => {});
    setState({ authenticated: false, user: null, loginUrl: DEFAULT_LOGIN_URL, loading: false, authError: null });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
