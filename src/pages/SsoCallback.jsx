import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function SsoCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { exchangeSsoCode } = useAuth();
  const [message, setMessage] = useState('Completing sign-in...');
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    if (error) {
      setIsError(true);
      setMessage(decodeURIComponent(error.replace(/\+/g, ' ')));
      return;
    }
    if (!code) {
      setIsError(true);
      setMessage('Missing sign-in code from identity provider.');
      return;
    }

    exchangeSsoCode(code)
      .then(() => navigate('/', { replace: true }))
      .catch((err) => {
        setIsError(true);
        setMessage(err.response?.data?.message || 'Could not complete SSO login.');
      });
  }, [exchangeSsoCode, navigate, searchParams]);

  return (
    <div className="login-wrap">
      <div className="login-card">
        <h2>MSS-CRM</h2>
        <p className={isError ? 'error-text' : 'kpi-sub'}>{message}</p>
        {isError && (
          <p style={{ marginTop: 12 }}>
            <Link to="/login">Back to sign in</Link>
            {' · '}
            If you were connecting Microsoft 365 mail, use Connect on the customer page again after fixing server redirect URIs (mail vs SSO).
          </p>
        )}
      </div>
    </div>
  );
}
