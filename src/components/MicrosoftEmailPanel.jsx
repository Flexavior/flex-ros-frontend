import React, { useEffect, useState } from 'react';
import api from '../api/client.js';

export default function MicrosoftEmailPanel({ sendUrl, disabled }) {
  const [msStatus, setMsStatus] = useState(null);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const loadStatus = () => {
    api.get('/integrations/microsoft/status')
      .then((res) => setMsStatus(res.data))
      .catch(() => setMsStatus({ configured: false, connected: false }));
  };

  useEffect(loadStatus, []);

  const connect = async () => {
    setError(null);
    try {
      const res = await api.post('/integrations/microsoft/connect');
      window.location.href = res.data.url;
    } catch (err) {
      setError(err.response?.data?.message || 'Could not start Microsoft sign-in.');
    }
  };

  const send = async (e) => {
    e.preventDefault();
    if (!sendUrl || disabled) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      await api.post(sendUrl, { subject, body });
      setMessage('Email sent from your Microsoft 365 mailbox.');
      setSubject('');
      setBody('');
    } catch (err) {
      setError(err.response?.data?.message || 'Send failed.');
    } finally {
      setBusy(false);
    }
  };

  if (!msStatus) {
    return <div className="card"><p className="kpi-sub">Loading Microsoft 365…</p></div>;
  }

  if (!msStatus.configured) {
    return (
      <div className="card">
        <h3>Email (Microsoft 365)</h3>
        <p className="kpi-sub">Server Azure app is not configured yet (AZURE_CLIENT_ID).</p>
      </div>
    );
  }

  if (!msStatus.connected) {
    return (
      <div className="card">
        <h3>Email (Microsoft 365)</h3>
        <p className="kpi-sub">Connect your Business Basic mailbox to send email to this contact.</p>
        {error && <p className="error-text">{error}</p>}
        <button type="button" onClick={connect}>Connect Microsoft 365</button>
      </div>
    );
  }

  return (
    <div className="card">
      <h3>Email (Microsoft 365)</h3>
      <p className="kpi-sub">Sending as {msStatus.mailbox_upn || 'connected mailbox'}</p>
      {disabled && <p className="error-text">Add a contact email to enable send.</p>}
      <form onSubmit={send}>
        <div className="form-row">
          <label>Subject</label>
          <input value={subject} onChange={(e) => setSubject(e.target.value)} required disabled={disabled || busy} />
        </div>
        <div className="form-row">
          <label>Message</label>
          <textarea rows={4} value={body} onChange={(e) => setBody(e.target.value)} required disabled={disabled || busy} />
        </div>
        {message && <p className="success-text">{message}</p>}
        {error && <p className="error-text">{error}</p>}
        <button type="submit" disabled={disabled || busy}>Send email</button>
      </form>
    </div>
  );
}
