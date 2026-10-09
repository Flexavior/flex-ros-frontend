import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../api/client.js';
import { resolvePostLoginPath } from '../auth/crmAccess.js';

function safeReturnUrl(raw) {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//')) return '/';
  return raw.length > 200 ? '/' : raw;
}

export default function Login() {
  const { login, user, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const rawReturn = searchParams.get('returnUrl');
  const returnUrl = safeReturnUrl(rawReturn);
  const [email, setEmail] = useState('ceo@mss.test');
  const [password, setPassword] = useState('password');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [ssoConfig, setSsoConfig] = useState({ microsoft: false, google: false });
  const [ssoBusy, setSsoBusy] = useState('');

  useEffect(() => {
    api.get('/auth/sso/config')
      .then((res) => setSsoConfig(res.data || {}))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!loading && user) {
      navigate(resolvePostLoginPath(user, rawReturn, returnUrl), { replace: true });
    }
  }, [loading, user, navigate, returnUrl, rawReturn]);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const me = await login(email, password);
      navigate(resolvePostLoginPath(me, rawReturn, returnUrl), { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Check your credentials.');
    } finally {
      setBusy(false);
    }
  };

  const startSso = async (provider) => {
    setError(null);
    setSsoBusy(provider);
    try {
      const res = await api.get(`/auth/sso/${provider}/redirect`);
      window.location.href = res.data.url;
    } catch (err) {
      setError(err.response?.data?.message || `Could not start ${provider} sign-in.`);
      setSsoBusy('');
    }
  };

  if (loading) {
    return (
      <div className="login-wrap">
        <div className="login-card"><p className="kpi-sub">Checking session…</p></div>
      </div>
    );
  }

  return (
    <div className="login-wrap">
      <form className="login-card" onSubmit={submit}>
        <h2>MSS-CRM</h2>
        <p className="kpi-sub">Sign in to your workspace</p>
        <div className="form-row">
          <label>Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="form-row">
          <label>Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        {error && <p className="error-text">{error}</p>}
        <button type="submit" disabled={busy} style={{ width: '100%' }}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
        {(ssoConfig.microsoft || ssoConfig.google) && (
          <>
            <p className="kpi-sub" style={{ textAlign: 'center', margin: '14px 0 8px' }}>or continue with</p>
            <div className="grid cols-2" style={{ gap: 8 }}>
              {ssoConfig.microsoft && (
                <button
                  type="button"
                  className="secondary"
                  disabled={!!ssoBusy}
                  onClick={() => startSso('microsoft')}
                >
                  {ssoBusy === 'microsoft' ? 'Connecting…' : 'Microsoft'}
                </button>
              )}
              {ssoConfig.google && (
                <button
                  type="button"
                  className="secondary"
                  disabled={!!ssoBusy}
                  onClick={() => startSso('google')}
                >
                  {ssoBusy === 'google' ? 'Connecting…' : 'Google'}
                </button>
              )}
            </div>
          </>
        )}
      </form>
    </div>
  );
}
