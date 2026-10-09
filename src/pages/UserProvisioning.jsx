import React, { useEffect, useState } from 'react';
import api from '../api/client.js';
import HelpIcon from '../components/HelpIcon.jsx';
import { help } from '../content/helpText.js';

export default function UserProvisioning() {
  const [payload, setPayload] = useState(null);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [pendingOnly, setPendingOnly] = useState(true);

  const load = () => {
    api.get('/users/provisioning', { params: { pending_only: pendingOnly ? 1 : 0 } })
      .then((res) => setPayload(res.data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load users.'));
  };

  useEffect(load, [pendingOnly]);

  const assign = async (userId, roleCode, teamId) => {
    setMessage(null);
    setError(null);
    try {
      await api.put(`/users/${userId}/assign-role`, {
        role_code: roleCode,
        team_id: teamId || null,
      });
      setMessage('Role updated.');
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Assignment failed.');
    }
  };

  if (!payload && !error) return <div className="card">Loading users…</div>;

  const assignable = payload?.assignable_roles || [];
  const teams = payload?.teams || [];

  return (
    <div>
      <h1 className="page-title">
        User provisioning
        <HelpIcon text={help.ssoProvisioning} label="Help: SSO provisioning" />
      </h1>
      <p className="kpi-sub">
        New Microsoft SSO sign-ins receive the <strong>Staff</strong> role
        {payload?.staff_role_id ? ` (role id ${payload.staff_role_id})` : ''}.
        Assign operational roles here.
      </p>
      {message && <p className="success-text">{message}</p>}
      {error && <p className="error-text">{error}</p>}

      <div className="card">
        <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input type="checkbox" checked={pendingOnly} onChange={(e) => setPendingOnly(e.target.checked)} />
          Show pending SSO / unassigned team only
        </label>
      </div>

      <div className="card table-scroll">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Current role</th>
              <th>SSO</th>
              <th>Team</th>
              <th>Assign role</th>
            </tr>
          </thead>
          <tbody>
            {(payload?.users || []).map((u) => (
              <UserRow
                key={u.id}
                user={u}
                assignable={assignable}
                teams={teams}
                onAssign={assign}
              />
            ))}
            {!payload?.users?.length && (
              <tr><td colSpan={6} className="kpi-sub">No users in this view.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function UserRow({ user, assignable, teams, onAssign }) {
  const [roleCode, setRoleCode] = useState('sales');
  const [teamId, setTeamId] = useState(user.team?.id || teams[0]?.id || '');

  return (
    <tr>
      <td>{user.name}</td>
      <td>{user.email}</td>
      <td>{user.role?.name}</td>
      <td>{(user.sso_providers || []).join(', ') || '—'}</td>
      <td>{user.team?.name || '—'}</td>
      <td>
        <div className="provision-actions">
          <select value={roleCode} onChange={(e) => setRoleCode(e.target.value)} aria-label={`Role for ${user.name}`}>
            {assignable.map((r) => (
              <option key={r.code} value={r.code}>{r.name}</option>
            ))}
          </select>
          <select value={teamId} onChange={(e) => setTeamId(e.target.value)} aria-label={`Team for ${user.name}`}>
            <option value="">No team</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
          <button type="button" className="small" onClick={() => onAssign(user.id, roleCode, teamId)}>
            Save
          </button>
        </div>
      </td>
    </tr>
  );
}
