import React, { useEffect, useState } from 'react';
import api from '../api/client.js';

export default function Settings() {
  const [checklists, setChecklists] = useState({});
  const [stages, setStages] = useState([]);
  const [general, setGeneral] = useState({});
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const load = () => {
    api.get('/stages').then((res) => setStages(res.data)).catch(() => {});
    api.get('/settings/checklists').then((res) => setChecklists(res.data)).catch(() => {});
    api.get('/settings/general').then((res) => setGeneral(res.data)).catch(() => {});
  };

  useEffect(() => { load(); }, []);

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
        await api.put('/settings/general', { 'crm.stale_task_days': Number(general['crm.stale_task_days']) });
      }
      setMessage('Settings saved. New conversions will use the updated checklists.');
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed.');
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
            <label>Client ID prefix</label>
            <input
              value={general['crm.client_id_prefix'] ?? 'CUS'}
              onChange={(e) => setGeneral({ ...general, 'crm.client_id_prefix': e.target.value })}
            />
          </div>
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
