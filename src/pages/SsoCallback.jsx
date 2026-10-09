import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function SsoCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { exchangeSsoCode } = useAuth();
  const [message, setMessage] = useState('Completing sign-in...');

  useEffect(() => {
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    if (error) {
      setMessage(decodeURIComponent(error));
      return;
    }
    if (!code) {
      setMessage('Missing sign-in code from identity provider.');
      return;
    }

    exchangeSsoCode(code)
      .then(() => navigate('/', { replace: true }))
      .catch((err) => setMessage(err.response?.data?.message || 'Could not complete SSO login.'));
  }, [exchangeSsoCode, navigate, searchParams]);

  return (
    <div className="login-wrap">
      <div className="login-card">
        <h2>MSS-CRM</h2>
        <p className="kpi-sub">{message}</p>
      </div>
    </div>
  );
}
