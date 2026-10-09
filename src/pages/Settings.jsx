import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api/client.js';

const ADMIN_PICKLIST_KEYS = [
  'customer_segment',
  'industry',
  'geo_location',
  'lead_source',
  'product_interest',
  'current_stage',
];

export default function Settings() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [checklists, setChecklists] = useState({});
  const [stages, setStages] = useState([]);
  const [general, setGeneral] = useState({});
  const [picklists, setPicklists] = useState({});
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const load = () => {
    api.get('/stages').then((res) => setStages(res.data)).catch(() => {});
    api.get('/settings/checklists').then((res) => setChecklists(res.data)).catch(() => {});
    api.get('/settings/general').then((res) => setGeneral(res.data)).catch(() => {});
    api.get('/settings/lead-picklists').then((res) => setPicklists(res.data || {})).catch(() => {});
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const ms = searchParams.get('microsoft');
    if (ms === 'connected') {
      setMessage('Microsoft 365 connected successfully.');
      searchParams.delete('microsoft');
      setSearchParams(searchParams, { replace: true });
    } else if (ms === 'error') {
      setError(searchParams.get('msg') || 'Microsoft connection failed.');
      searchParams.delete('microsoft');
      searchParams.delete('msg');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

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
    setMessage(null);
    setError(null);
    try {
      // Drop empty rows, send only stages that have at least one item
      const payload = {};
      for (const [code, items] of Object.entries(checklists)) {
        const clean = items.filter((i) => i.title && i.title.trim());
        if (clean.length) payload[code] = clean;
      }
      await api.put('/settings/checklists', payload);
      if (general['crm.stale_task_days']) {
        const qualifyProgressOutcomes = String(general['crm.qualify']?.progress_outcomes_text || '')
          .split('\n')
          .map((line) => line.trim())
          .filter(Boolean);
        await api.put('/settings/general', {
          'crm.stale_task_days': Number(general['crm.stale_task_days']),
          'crm.client_id_prefix': general['crm.client_id_prefix'],
          'crm.qualify': {
            max_idle_touches: Number(general['crm.qualify']?.max_idle_touches || 4),
            progress_outcomes: qualifyProgressOutcomes.length
              ? qualifyProgressOutcomes
              : (general['crm.qualify']?.progress_outcomes || ['Demo booked', 'Proposal sent', 'Won']),
          },
        });
      }
      const pickPayload = {};
      for (const key of ADMIN_PICKLIST_KEYS) {
        const text = picklists[key];
        if (typeof text === 'string') {
          pickPayload[key] = text.split('\n').map((l) => l.trim()).filter(Boolean);
        } else if (Array.isArray(text)) {
          pickPayload[key] = text;
        }
      }
      await api.put('/settings/lead-picklists', pickPayload);
      setMessage('Settings saved (checklists, general, lead picklists).');
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed.');
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
    setError(null);
    try {
      const res = await api.get('/settings/lead-picklists');
      const next = res.data?.[key];
      if (Array.isArray(next)) {
        setPicklists((prev) => ({ ...prev, [key]: next }));
        setMessage(`Reloaded "${key}" from server.`);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Reload failed.');
    }
  };

  const restorePicklistDefaults = async (key) => {
    if (!window.confirm(`Restore "${key}" to product defaults? This overwrites saved options for this list only.`)) {
      return;
    }
    setError(null);
    try {
      const res = await api.post(`/settings/lead-picklists/restore/${key}`);
      if (res.data?.picklists) {
        setPicklists(res.data.picklists);
      } else if (Array.isArray(res.data?.options)) {
        setPicklists((prev) => ({ ...prev, [key]: res.data.options }));
      }
      setMessage(`Restored defaults for "${key}".`);
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.errors?.[key]?.[0] || 'Restore failed.');
    }
  };

  return (
    <div>
      <h1 className="page-title">System Settings — Dynamic Checklists</h1>
      {message && <p className="success-text">{message}</p>}
      {error && <p className="error-text">{error}</p>}

      <div className="card">
        <h3>General</h3>
        <div className="grid cols-2" style={{ maxWidth: 480 }}>
          <div className="form-row">
            <label>Stale task threshold (days, dashboard "no change" rule)</label>
            <input
              type="number" min="1" max="90"
              value={general['crm.stale_task_days'] ?? 5}
              onChange={(e) => setGeneral({ ...general, 'crm.stale_task_days': e.target.value })}
            />
          </div>
          <div className="form-row">
            <label>Client ID prefix (legacy setting; new IDs use YYMMDD_Cn)</label>
            <input
              value={general['crm.client_id_prefix'] ?? 'CUS'}
              onChange={(e) => setGeneral({ ...general, 'crm.client_id_prefix': e.target.value })}
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

      <div className="card">
        <h3>Lead picklists (settings-backed)</h3>
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0 }}>{stage.name} <span className="kpi-sub">({stage.code})</span></h3>
            <button className="small" onClick={() => addItem(stage.code)}>+ Add item</button>
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

      <button onClick={saveAll}>Save All Settings</button>
    </div>
  );
}
