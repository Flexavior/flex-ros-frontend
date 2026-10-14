import React, { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api/client.js';
import SettingsSectionSaveButton from '../components/SettingsSectionSaveButton.jsx';
import SettingsResultModal from '../components/SettingsResultModal.jsx';
import HelpIcon from '../components/HelpIcon.jsx';
import { help } from '../content/helpText.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useActionFeedback } from '../hooks/useActionFeedback.js';

function formatAuditLine(audit) {
  if (!audit?.events?.length) return null;
  const ts = audit.logged_at ? ` @ ${audit.logged_at}` : '';
  return `settings.updated keys=[${audit.events.join(', ')}]${ts}`;
}

function logSettingsAudit(audit) {
  const line = formatAuditLine(audit);
  if (line) {
    // eslint-disable-next-line no-console
    console.info('[MSS-CRM settings]', line);
  }
  return line;
}

function mergeGeneralFromApi(prev, data) {
  if (!data || typeof data !== 'object') return prev;
  const qualify = data['crm.qualify'] || {};
  return {
    ...prev,
    ...data,
    'crm.qualify': {
      ...(prev['crm.qualify'] || {}),
      ...qualify,
      progress_outcomes_text: qualify.progress_outcomes?.join('\n')
        ?? prev['crm.qualify']?.progress_outcomes_text
        ?? (prev['crm.qualify']?.progress_outcomes || []).join('\n'),
    },
  };
}

function apiErrorMessage(err, fallback) {
  return err?.response?.data?.message
    || (err?.response?.data?.errors && Object.values(err.response.data.errors).flat().join(' '))
    || fallback;
}

function mergeAuditEvents(...audits) {
  const events = [];
  let loggedAt = null;
  for (const a of audits) {
    if (a?.events?.length) events.push(...a.events);
    if (a?.logged_at) loggedAt = a.logged_at;
  }
  if (!events.length) return null;
  return { events, logged_at: loggedAt || new Date().toISOString() };
}

const ADMIN_PICKLIST_KEYS = [
  'organization_type',
  'customer_segment',
  'industry',
  'geo_location',
  'lead_source',
  'product_interest',
  'current_stage',
  'engagement_channel',
  'contact_method',
];

export default function Settings() {
  const { refreshUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [checklists, setChecklists] = useState({});
  const [stages, setStages] = useState([]);
  const [general, setGeneral] = useState({});
  const [picklists, setPicklists] = useState({});
  const [sysNotifications, setSysNotifications] = useState([]);
  const [sysForm, setSysForm] = useState({ body: '', effective_until: '' });
  const [resultModal, setResultModal] = useState({ open: false, type: 'success', message: '', auditLine: null });
  const { busy, runAction } = useActionFeedback();

  const showResult = useCallback((type, message, audit) => {
    const auditLine = logSettingsAudit(audit);
    setResultModal({ open: true, type, message, auditLine });
  }, []);

  const qualifyProgressOutcomes = () => String(general['crm.qualify']?.progress_outcomes_text || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const generalThresholdPayload = () => ({
    'crm.stale_task_days': Number(general['crm.stale_task_days'] ?? 5),
    'crm.qualify': {
      max_idle_touches: Number(general['crm.qualify']?.max_idle_touches || 4),
      progress_outcomes: qualifyProgressOutcomes().length
        ? qualifyProgressOutcomes()
        : (general['crm.qualify']?.progress_outcomes || ['Demo booked', 'Proposal sent', 'Won']),
    },
  });

  const inboxRolesPayload = () => ({
    'crm.inbox_enabled_roles': Array.isArray(general['crm.inbox_enabled_roles'])
      ? general['crm.inbox_enabled_roles']
      : [],
  });

  const loadPicklistsOnly = () => {
    api.get('/settings/lead-picklists').then((res) => setPicklists(res.data || {})).catch(() => {});
  };

  const saveGeneralSection = async () => {
    try {
      const audit = await runAction(async () => {
        const res = await api.put('/settings/general', generalThresholdPayload());
        setGeneral((prev) => mergeGeneralFromApi(prev, res.data));
        return res.data?.audit;
      }, { successMessage: 'General settings saved.' });
      showResult('success', 'General settings saved.', audit);
    } catch (err) {
      showResult('error', apiErrorMessage(err, 'General settings could not be saved.'), null);
    }
  };

  const saveInboxSection = async () => {
    try {
      const audit = await runAction(async () => {
        const res = await api.put('/settings/general', inboxRolesPayload());
        setGeneral((prev) => mergeGeneralFromApi(prev, res.data));
        await refreshUser?.();
        return res.data?.audit;
      }, { successMessage: 'Inbox access saved.' });
      showResult(
        'success',
        'Inbox access saved. CRM users refresh the app or refocus this browser tab to update the Inbox menu.',
        audit,
      );
    } catch (err) {
      showResult('error', apiErrorMessage(err, 'Inbox access could not be saved.'), null);
    }
  };

  const savePicklistsSection = async () => {
    try {
      const audit = await runAction(async () => {
        const pickPayload = {};
        for (const key of ADMIN_PICKLIST_KEYS) {
          const text = picklists[key];
          if (typeof text === 'string') {
            pickPayload[key] = text.split('\n').map((l) => l.trim()).filter(Boolean);
          } else if (Array.isArray(text)) {
            pickPayload[key] = text;
          }
        }
        const res = await api.put('/settings/lead-picklists', pickPayload);
        loadPicklistsOnly();
        return res.data?.audit;
      }, { successMessage: 'Lead picklists saved.' });
      showResult('success', 'Lead picklists saved.', audit);
    } catch (err) {
      showResult('error', apiErrorMessage(err, 'Lead picklists could not be saved.'), null);
    }
  };

  const saveChecklistStage = (stageCode, stageName) => async () => {
    try {
      const audit = await runAction(async () => {
        const items = (checklists[stageCode] || []).filter((i) => i.title && i.title.trim());
        const res = await api.put('/settings/checklists', { [stageCode]: items });
        return res.data?.audit;
      }, { successMessage: `${stageName} checklist saved.` });
      showResult('success', `${stageName} checklist saved.`, audit);
    } catch (err) {
      showResult('error', apiErrorMessage(err, 'Checklist could not be saved.'), null);
    }
  };

  const loadSysNotifications = () => {
    api.get('/settings/system-notifications').then((res) => setSysNotifications(res.data || [])).catch(() => {});
  };

  const load = () => {
    api.get('/stages').then((res) => setStages(res.data)).catch(() => {});
    api.get('/settings/checklists').then((res) => setChecklists(res.data)).catch(() => {});
    api.get('/settings/general').then((res) => setGeneral((prev) => mergeGeneralFromApi(prev, res.data))).catch(() => {});
    api.get('/settings/lead-picklists').then((res) => setPicklists(res.data || {})).catch(() => {});
    loadSysNotifications();
  };

  const publishSystemNotification = async (e) => {
    e.preventDefault();
    try {
      await runAction(async () => {
        await api.post('/settings/system-notifications', {
          body: sysForm.body.trim(),
          effective_until: sysForm.effective_until || null,
        });
        setSysForm({ body: '', effective_until: '' });
        loadSysNotifications();
      }, { successMessage: 'Notification published.' });
      showResult('success', 'System notification published to all users.', { events: ['system_notification.created'], logged_at: new Date().toISOString() });
    } catch (err) {
      showResult('error', apiErrorMessage(err, 'Could not publish notification.'), null);
    }
  };

  const deactivateNotification = async (id) => {
    try {
      await api.patch(`/settings/system-notifications/${id}`, { is_active: false });
      loadSysNotifications();
      showResult('success', 'Notification deactivated.', null);
    } catch (err) {
      showResult('error', apiErrorMessage(err, 'Could not deactivate.'), null);
    }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const ms = searchParams.get('microsoft');
    if (ms === 'connected') {
      showResult('success', 'Microsoft 365 connected successfully.', null);
      searchParams.delete('microsoft');
      setSearchParams(searchParams, { replace: true });
    } else if (ms === 'error') {
      showResult('error', searchParams.get('msg') || 'Microsoft connection failed.', null);
      searchParams.delete('microsoft');
      searchParams.delete('msg');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams, showResult]);

  const addItem = (stageCode) => {
    setChecklists({
      ...checklists,
      [stageCode]: [...(checklists[stageCode] || []), { title: '', is_required: true }],
    });
  };

  const removeItem = (stageCode, idx) => {
    const next = { ...checklists };
    next[stageCode] = next[stageCode].filter((_, i) => i !== idx);
    setChecklists(next);
  };

  const editItem = (stageCode, idx, field, value) => {
    const next = { ...checklists };
    next[stageCode] = next[stageCode].map((item, i) => (i === idx ? { ...item, [field]: value } : item));
    setChecklists(next);
  };

  const saveAll = async () => {
    try {
      const audit = await runAction(async () => {
        const payload = {};
        for (const [code, items] of Object.entries(checklists)) {
          const clean = items.filter((i) => i.title && i.title.trim());
          if (clean.length) payload[code] = clean;
        }
        const checklistRes = await api.put('/settings/checklists', payload);
        const generalRes = await api.put('/settings/general', {
          ...generalThresholdPayload(),
          ...inboxRolesPayload(),
        });
        setGeneral((prev) => mergeGeneralFromApi(prev, generalRes.data));
        const pickPayload = {};
        for (const key of ADMIN_PICKLIST_KEYS) {
          const text = picklists[key];
          if (typeof text === 'string') {
            pickPayload[key] = text.split('\n').map((l) => l.trim()).filter(Boolean);
          } else if (Array.isArray(text)) {
            pickPayload[key] = text;
          }
        }
        const picklistRes = await api.put('/settings/lead-picklists', pickPayload);
        await refreshUser?.();
        load();
        return mergeAuditEvents(
          checklistRes.data?.audit,
          generalRes.data?.audit,
          picklistRes.data?.audit,
        );
      }, { successMessage: 'All settings saved.' });
      showResult('success', 'All settings saved (checklists, general, inbox access, lead picklists).', audit);
    } catch (err) {
      showResult('error', apiErrorMessage(err, 'Save all settings failed.'), null);
    }
  };

  const picklistText = (key) => {
    const v = picklists[key];
    if (Array.isArray(v)) return v.join('\n');
    return typeof v === 'string' ? v : '';
  };

  const setPicklistText = (key, text) => {
    setPicklists({ ...picklists, [key]: text });
  };

  const reloadPicklistKey = async (key) => {
    try {
      const res = await api.get('/settings/lead-picklists');
      const next = res.data?.[key];
      if (Array.isArray(next)) {
        setPicklists((prev) => ({ ...prev, [key]: next }));
        showResult('success', `Reloaded "${key}" from server.`, null);
      }
    } catch (err) {
      showResult('error', apiErrorMessage(err, 'Reload failed.'), null);
    }
  };

  const restorePicklistDefaults = async (key) => {
    if (!window.confirm(`Restore "${key}" to product defaults? This overwrites saved options for this list only.`)) {
      return;
    }
    try {
      const res = await api.post(`/settings/lead-picklists/restore/${key}`);
      if (res.data?.picklists) {
        setPicklists(res.data.picklists);
      } else if (Array.isArray(res.data?.options)) {
        setPicklists((prev) => ({ ...prev, [key]: res.data.options }));
      }
      showResult('success', `Restored defaults for "${key}".`, res.data?.audit);
    } catch (err) {
      showResult(
        'error',
        err.response?.data?.errors?.[key]?.[0] || apiErrorMessage(err, 'Restore failed.'),
        null,
      );
    }
  };

  return (
    <div>
      <h1 className="page-title">System Settings — Dynamic Checklists</h1>

      <SettingsResultModal
        open={resultModal.open}
        type={resultModal.type}
        message={resultModal.message}
        auditLine={resultModal.auditLine}
        onClose={() => setResultModal((m) => ({ ...m, open: false }))}
      />

      <div className="settings-top-grid">
      <div className="card settings-panel-general">
        <div className="settings-card-header">
          <h3>General</h3>
          <SettingsSectionSaveButton
            label="Save General settings"
            disabled={busy}
            onClick={saveGeneralSection}
          />
        </div>
        <div className="grid cols-1 settings-general-fields">
          <div className="form-row">
            <label>Stale task threshold (days, dashboard "no change" rule)</label>
            <input
              type="number" min="1" max="90"
              value={general['crm.stale_task_days'] ?? 5}
              onChange={(e) => setGeneral({ ...general, 'crm.stale_task_days': e.target.value })}
            />
          </div>
          <div className="form-row">
            <label>Qualify idle touch threshold</label>
            <input
              type="number" min="1" max="50"
              value={general['crm.qualify']?.max_idle_touches ?? 4}
              onChange={(e) => setGeneral({
                ...general,
                'crm.qualify': {
                  ...(general['crm.qualify'] || {}),
                  max_idle_touches: e.target.value,
                },
              })}
            />
          </div>
          <div className="form-row" style={{ gridColumn: '1 / -1' }}>
            <label>Qualify progress outcomes (one per line; must match activity outcomes)</label>
            <textarea
              rows={4}
              value={general['crm.qualify']?.progress_outcomes_text
                ?? (general['crm.qualify']?.progress_outcomes || []).join('\n')}
              onChange={(e) => setGeneral({
                ...general,
                'crm.qualify': {
                  ...(general['crm.qualify'] || {}),
                  progress_outcomes_text: e.target.value,
                },
              })}
            />
          </div>
        </div>
      </div>

      <div className="card settings-panel-inbox">
        <div className="settings-card-header">
          <h3>
            Inbox access (by role)
            <HelpIcon text={help.inboxAccessSettings} title="Inbox access" label="Help: Inbox access" />
          </h3>
          <SettingsSectionSaveButton
            label="Save Inbox access"
            disabled={busy}
            onClick={saveInboxSection}
          />
        </div>
        <ul className="settings-role-checklist">
          {(general['crm.inbox_role_catalog'] || []).map(({ code, name }) => {
            const enabled = (general['crm.inbox_enabled_roles'] || []).includes(code);
            const toggle = () => {
              const current = general['crm.inbox_enabled_roles'] || [];
              const next = enabled
                ? current.filter((c) => c !== code)
                : [...new Set([...current, code])];
              setGeneral({ ...general, 'crm.inbox_enabled_roles': next });
            };
            return (
              <li key={code}>
                <label className="settings-role-row">
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={toggle}
                  />
                  <span className="settings-role-label">{name || code}</span>
                </label>
              </li>
            );
          })}
        </ul>
      </div>
      </div>

      <div className="card">
        <h3>System notifications (all users)</h3>
        <p className="kpi-sub">Shown on login with welcome message until effective end date or deactivation.</p>
        <form onSubmit={publishSystemNotification} className="grid cols-2" style={{ alignItems: 'end', marginBottom: 16 }}>
          <div className="form-row" style={{ gridColumn: '1 / -1' }}>
            <label>Message *</label>
            <textarea
              rows={2}
              value={sysForm.body}
              onChange={(e) => setSysForm({ ...sysForm, body: e.target.value })}
              placeholder="System Maintenance on 20-10-2026"
              required
            />
          </div>
          <div className="form-row">
            <label>Effective until (optional)</label>
            <input
              type="datetime-local"
              value={sysForm.effective_until}
              onChange={(e) => setSysForm({ ...sysForm, effective_until: e.target.value })}
            />
          </div>
          <div className="form-row">
            <button type="submit" disabled={busy}>Publish to all users</button>
          </div>
        </form>
        <table>
          <thead><tr><th>Message</th><th>Active</th><th>Until</th><th></th></tr></thead>
          <tbody>
            {sysNotifications.map((n) => (
              <tr key={n.id}>
                <td>{n.body}</td>
                <td>{n.is_active ? 'Yes' : 'No'}</td>
                <td>{n.effective_until ? new Date(n.effective_until).toLocaleString() : '—'}</td>
                <td>
                  {n.is_active && (
                    <button type="button" className="small secondary" onClick={() => deactivateNotification(n.id)}>Deactivate</button>
                  )}
                </td>
              </tr>
            ))}
            {!sysNotifications.length && (
              <tr><td colSpan={4} className="kpi-sub">No notifications published.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="card">
        <div className="settings-card-header">
          <h3>Lead picklists (settings-backed)</h3>
          <SettingsSectionSaveButton
            label="Save lead picklists"
            disabled={busy}
            onClick={savePicklistsSection}
          />
        </div>
        <p className="kpi-sub">
          One option per line. Stored in DB setting <code>crm.lead_picklists</code>.
          Segment = org size; Industry = sector name; Geo = region.
        </p>
        <div className="grid cols-3">
          {ADMIN_PICKLIST_KEYS.map((key) => (
            <div className="form-row" key={key}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                <label>{key.replace(/_/g, ' ')}</label>
                <span style={{ display: 'flex', gap: 6 }}>
                  <button type="button" className="secondary small" onClick={() => reloadPicklistKey(key)}>Reload</button>
                  <button type="button" className="secondary small" onClick={() => restorePicklistDefaults(key)}>Restore defaults</button>
                </span>
              </div>
              <textarea
                rows={8}
                value={picklistText(key)}
                onChange={(e) => setPicklistText(key, e.target.value)}
              />
            </div>
          ))}
        </div>
      </div>

      {stages.map((stage) => (
        <div className="card" key={stage.id}>
          <div className="settings-card-header">
            <h3>{stage.name} <span className="kpi-sub">({stage.code})</span></h3>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <SettingsSectionSaveButton
                label={`Save ${stage.name} checklist`}
                disabled={busy}
                onClick={() => saveChecklistStage(stage.code, stage.name)}
              />
              <button type="button" className="small" onClick={() => addItem(stage.code)}>+ Add item</button>
            </span>
          </div>
          {(checklists[stage.code] || []).map((item, idx) => (
            <div className="checklist-item" key={idx}>
              <input
                style={{ flex: 2 }}
                value={item.title}
                placeholder="Checklist item title, e.g. Bank account opened"
                onChange={(e) => editItem(stage.code, idx, 'title', e.target.value)}
              />
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
                <input
                  type="checkbox"
                  checked={!!item.is_required}
                  onChange={(e) => editItem(stage.code, idx, 'is_required', e.target.checked)}
                />
                required
              </label>
              <button className="small danger" onClick={() => removeItem(stage.code, idx)}>Remove</button>
            </div>
          ))}
          {!(checklists[stage.code] || []).length && (
            <p className="kpi-sub">No items for this stage yet.</p>
          )}
        </div>
      ))}

      <button type="button" disabled={busy} onClick={saveAll}>Save All Settings</button>
    </div>
  );
}
