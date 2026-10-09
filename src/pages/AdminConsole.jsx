import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client.js';
import HelpIcon from '../components/HelpIcon.jsx';
import { help } from '../content/helpText.js';

export default function AdminConsole() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get('/admin/overview')
      .then((res) => setData(res.data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load admin overview.'));
  }, []);

  if (error) {
    return (
      <div className="card">
        <p className="error-text">{error}</p>
      </div>
    );
  }

  if (!data) return <div className="card">Loading admin console…</div>;

  return (
    <div>
      <h1 className="page-title">
        Admin Console
        <HelpIcon text={help.adminConsole} label="Help: admin console" />
      </h1>
      <p className="kpi-sub">Support users, system configuration, and integration health.</p>

      <div className="grid cols-4">
        <div className="card kpi">
          <div className="kpi-label">Active users</div>
          <div className="kpi-value">{data.users?.active ?? 0}</div>
          <div className="kpi-sub">of {data.users?.total ?? 0} total</div>
        </div>
        <div className="card kpi">
          <div className="kpi-label">Awaiting role assignment</div>
          <div className="kpi-value">{data.users?.awaiting_role_assignment ?? 0}</div>
          <div className="kpi-sub">SSO / Staff queue</div>
        </div>
        <div className="card kpi">
          <div className="kpi-label">Stale task rule</div>
          <div className="kpi-value">{data.crm?.stale_task_days ?? 5}d</div>
          <div className="kpi-sub">prefix {data.crm?.client_id_prefix ?? 'CUS'}</div>
        </div>
        <div className="card kpi">
          <div className="kpi-label">Inbox live (Reverb)</div>
          <div className="kpi-value">{data.realtime?.inbox_live_updates ? 'On' : 'Off'}</div>
          <div className="kpi-sub">{data.realtime?.broadcast_driver}</div>
        </div>
      </div>

      <div className="grid cols-2">
        <div className="card">
          <h3>Quick actions</h3>
          <ul className="admin-link-list">
            <li><Link to="/settings">System Settings</Link> — checklists, stale days, Client ID prefix</li>
            <li><Link to="/people">User provisioning</Link> — assign SSO users to Sales / Marketing / CS</li>
            <li><Link to="/">CRM Dashboard</Link> — org metrics (same as other roles, scoped)</li>
            <li><Link to="/inbox">Inbox</Link> — omnichannel conversations (Reverb live refresh)</li>
          </ul>
        </div>
        <div className="card">
          <h3>
            Authentication &amp; realtime
            <HelpIcon text={help.reverbInbox} label="Help: Reverb and notifications" />
          </h3>
          <table>
            <tbody>
              <tr><td>Microsoft SSO (settings flag)</td><td>{data.auth?.sso_microsoft_enabled ? 'Enabled' : 'Disabled'}</td></tr>
              <tr><td>Google SSO (settings flag)</td><td>{data.auth?.sso_google_enabled ? 'Enabled' : 'Disabled'}</td></tr>
              <tr><td>Broadcast driver</td><td>{data.realtime?.broadcast_driver}</td></tr>
              <tr><td>Reverb app key set</td><td>{data.realtime?.reverb_configured ? 'Yes' : 'No'}</td></tr>
            </tbody>
          </table>
          <p className="kpi-sub" style={{ marginTop: 12 }}>
            Reverb delivers <strong>inbox message</strong> events to connected agents—not lead pipeline push notifications.
            Lead alerts use dashboard stale lists and manual refresh until a future notification CR.
          </p>
        </div>
      </div>
    </div>
  );
}
