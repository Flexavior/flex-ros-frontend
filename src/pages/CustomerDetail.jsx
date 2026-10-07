import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/client.js';
import MicrosoftEmailPanel from '../components/MicrosoftEmailPanel.jsx';

export default function CustomerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [agreement, setAgreement] = useState({ type: 'nda', title: '', signatory_name: '' });
  const [dependency, setDependency] = useState({ title: '', type: 'external' });
  const [launchTitle, setLaunchTitle] = useState('');

  const load = () => {
    api.get(`/customers/${id}`)
      .then((res) => setData(res.data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load customer.'));
  };

  useEffect(load, [id]);

  if (error) return <div className="card"><p className="error-text">{error}</p></div>;
  if (!data) return <div className="card">Loading…</div>;

  const { customer, checklists } = data;

  const toggleItem = async (itemId, isDone) => {
    await api.put(`/customers/${id}/checklist/${itemId}`, { is_done: !isDone });
    load();
  };

  const addAgreement = async (e) => {
    e.preventDefault();
    try {
      await api.post('/agreements', { ...agreement, customer_id: customer.id });
      setAgreement({ type: 'nda', title: '', signatory_name: '' });
      setMessage('Agreement recorded.');
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not add agreement.');
    }
  };

  const signAgreement = async (a) => {
    try {
      await api.put(`/agreements/${a.id}`, { status: 'signed' });
      setMessage(`${a.type.toUpperCase()} marked signed.`);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Sign-off requires approver role.');
    }
  };

  const addLaunchPlan = async (e) => {
    e.preventDefault();
    try {
      await api.post('/launch-plans', { customer_id: customer.id, title: launchTitle });
      setLaunchTitle('');
      setMessage('Launch plan created.');
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create launch plan.');
    }
  };

  const addDependency = async (planId) => {
    try {
      await api.post(`/launch-plans/${planId}/dependencies`, dependency);
      setDependency({ title: '', type: 'external' });
      setMessage('Dependency added.');
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not add dependency.');
    }
  };

  const completeDependency = async (depId, status) => {
    await api.put(`/launch-dependencies/${depId}`, { status: status || 'done' });
    load();
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <h1 className="page-title">{customer.client_id} — {customer.name}</h1>
        <button className="secondary" onClick={() => navigate('/customers')}>← Back</button>
      </div>
      {message && <p className="success-text">{message}</p>}
      {error && <p className="error-text">{error}</p>}

      <MicrosoftEmailPanel sendUrl={`/customers/${id}/email`} disabled={!customer.email} />

      <div className="grid cols-2">
        <div className="card">
          <h3>Agreements (NDA / MoU / Contract)</h3>
          <table>
            <thead><tr><th>Type</th><th>Title</th><th>Status</th><th>Signed</th><th></th></tr></thead>
            <tbody>
              {(customer.agreements || []).map((a) => (
                <tr key={a.id}>
                  <td><strong>{a.type.toUpperCase()}</strong></td>
                  <td>{a.title}</td>
                  <td><span className={`badge ${a.status === 'signed' ? 'approved' : 'pending'}`}>{a.status}</span></td>
                  <td>{a.signed_at ? new Date(a.signed_at).toLocaleDateString() : '—'}</td>
                  <td>{a.status !== 'signed' && <button className="small" onClick={() => signAgreement(a)}>Sign off</button>}</td>
                </tr>
              ))}
              {!(customer.agreements || []).length && <tr><td colSpan={5} className="kpi-sub">None recorded.</td></tr>}
            </tbody>
          </table>
          <form onSubmit={addAgreement} style={{ marginTop: 12 }}>
            <div className="grid cols-3">
              <div className="form-row"><label>Type</label>
                <select value={agreement.type} onChange={(e) => setAgreement({ ...agreement, type: e.target.value })}>
                  <option value="nda">NDA</option><option value="mou">MoU</option><option value="contract">Contract</option>
                </select></div>
              <div className="form-row"><label>Title *</label>
                <input value={agreement.title} onChange={(e) => setAgreement({ ...agreement, title: e.target.value })} required /></div>
              <div className="form-row"><label>Signatory</label>
                <input value={agreement.signatory_name} onChange={(e) => setAgreement({ ...agreement, signatory_name: e.target.value })} /></div>
            </div>
            <button type="submit" className="small">Record Agreement</button>
          </form>
        </div>

        <div className="card">
          <h3>Stage Checklists</h3>
          {Object.entries(checklists || {}).map(([stage, group]) => (
            <div key={stage} style={{ marginBottom: 14 }}>
              <strong>{stage}</strong>
              <div className="progress-bar" style={{ margin: '6px 0' }}>
                <div style={{ width: `${group.percent}%` }} />
              </div>
              {group.items.map((item) => (
                <div className="checklist-item" key={item.id}>
                  <input
                    type="checkbox"
                    checked={item.is_done}
                    onChange={() => toggleItem(item.checklist_item_id ?? item.id, item.is_done)}
                    id={`chk-${item.id}`}
                  />
                  <label htmlFor={`chk-${item.id}`}>
                    {item.title} {item.is_required && <span className="error-text">*</span>}
                    {item.done_by && <span className="kpi-sub"> — {item.done_by}</span>}
                  </label>
                </div>
              ))}
            </div>
          ))}
          {!Object.keys(checklists || {}).length && <p className="kpi-sub">No checklists instantiated.</p>}
        </div>
      </div>

      <div className="card">
        <h3>Launch Plans &amp; Dependencies</h3>
        <div className="grid cols-2">
          {(customer.launch_plans || []).map((plan) => (
            <div key={plan.id} style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 12 }}>
              <strong>{plan.title}</strong>
              <p className="kpi-sub">Target: {plan.target_date || '—'} · Status: <span className={`badge ${plan.status === 'launched' ? 'approved' : 'pending'}`}>{plan.status}</span></p>
              <table>
                <tbody>
                  {(plan.dependencies || []).map((d) => (
                    <tr key={d.id}>
                      <td>{d.title} <span className="kpi-sub">({d.type})</span></td>
                      <td><span className={`badge ${d.status === 'done' ? 'approved' : 'pending'}`}>{d.status}</span></td>
                      <td>{d.status !== 'done' && <button className="small" onClick={() => completeDependency(d.id)}>Mark done</button>}</td>
                    </tr>
                  ))}
                  {!(plan.dependencies || []).length && <tr><td className="kpi-sub">No dependencies.</td></tr>}
                </tbody>
              </table>
              <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                <input placeholder="e.g. Mobile app released" value={dependency.title} onChange={(e) => setDependency({ ...dependency, title: e.target.value })} />
                <button className="small" onClick={() => addDependency(plan.id)}>+ Dependency</button>
              </div>
            </div>
          ))}
        </div>
        <form onSubmit={addLaunchPlan} style={{ marginTop: 12, display: 'flex', gap: 6 }}>
          <input placeholder="New launch plan title" value={launchTitle} onChange={(e) => setLaunchTitle(e.target.value)} required />
          <button type="submit">+ Launch Plan</button>
        </form>
      </div>
    </div>
  );
}
