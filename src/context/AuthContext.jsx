import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '../api/client.js';

const AuthContext = createContext(null);

function isValidSessionUser(data) {
  return data && typeof data === 'object' && data.role && typeof data.role.code === 'string';
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('mss_token');
    if (!token) {
      setLoading(false);
      return undefined;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);

    api.get('/auth/me', { signal: controller.signal })
      .then((res) => {
        if (isValidSessionUser(res.data)) {
          setUser(res.data);
        } else {
          localStorage.removeItem('mss_token');
        }
      })
      .catch(() => localStorage.removeItem('mss_token'))
      .finally(() => {
        clearTimeout(timer);
        setLoading(false);
      });

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, []);

  const beginSession = (token, me, welcomeKind) => {
    localStorage.setItem('mss_token', token);
    const merged = welcomeKind ? { ...me, welcome_kind: welcomeKind } : me;
    setUser(merged);
    return merged;
  };

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (!res.data?.token || !isValidSessionUser(res.data.user)) {
      throw new Error('Login response was invalid. Check API URL (VITE_API_BASE_URL) and server status.');
    }
    return beginSession(res.data.token, res.data.user, res.data.user.welcome_kind);
  };

  const exchangeSsoCode = async (code) => {
    const res = await api.post('/auth/sso/exchange', { code });
    return beginSession(res.data.token, res.data.user, res.data.user.welcome_kind);
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) { /* token may already be invalid */ }
    localStorage.removeItem('mss_token');
    setUser(null);
  };

  const refreshUser = async () => {
    const token = localStorage.getItem('mss_token');
    if (!token) return null;
    try {
      const res = await api.get('/auth/me');
      if (isValidSessionUser(res.data)) {
        setUser(res.data);
        return res.data;
      }
    } catch (e) {
      /* keep existing session on transient errors */
    }
    return null;
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout, exchangeSsoCode, refreshUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
