import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '../api/client.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('mss_token');
    if (token) {
      api.get('/auth/me')
        .then((res) => setUser(res.data))
        .catch(() => localStorage.removeItem('mss_token'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const beginSession = (token, me) => {
    localStorage.setItem('mss_token', token);
    setUser(me);
    return me;
  };

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    return beginSession(res.data.token, res.data.user);
  };

  const exchangeSsoCode = async (code) => {
    const res = await api.post('/auth/sso/exchange', { code });
    return beginSession(res.data.token, res.data.user);
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) { /* token may already be invalid */ }
    localStorage.removeItem('mss_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout, exchangeSsoCode, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
