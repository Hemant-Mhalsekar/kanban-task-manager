import { createContext, useContext, useState, useCallback } from 'react';
import apiClient from '../api/apiClient';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // Token stored in memory only — not localStorage — for XSS safety.
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);

  // Persist token onto the axios instance immediately after setting state
  const saveSession = useCallback((responseData) => {
    const { token: newToken, user: newUser } = responseData;
    setToken(newToken);
    setUser(newUser);
    // Attach to future requests via the interceptor in apiClient.js
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
  }, []);

  const clearSession = useCallback(() => {
    setToken(null);
    setUser(null);
    delete apiClient.defaults.headers.common['Authorization'];
  }, []);

  // ─── register ──────────────────────────────────────────────
  const register = useCallback(async ({ name, email, password }) => {
    const { data } = await apiClient.post('/auth/register', { name, email, password });
    saveSession(data);
    return data;
  }, [saveSession]);

  // ─── login ─────────────────────────────────────────────────
  const login = useCallback(async ({ email, password }) => {
    const { data } = await apiClient.post('/auth/login', { email, password });
    saveSession(data);
    return data;
  }, [saveSession]);

  // ─── logout ────────────────────────────────────────────────
  const logout = useCallback(() => {
    clearSession();
  }, [clearSession]);

  const isAuthenticated = Boolean(token);

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated, register, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};

export default AuthContext;
