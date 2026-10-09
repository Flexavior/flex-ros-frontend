import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client.js';

export default function Leads() {
  const [leads, setLeads] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [schema, setSchema] = useState({ picklists: {}, custom_fields: { lead: [] } });
  const [statusFilter, setStatusFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [form, setForm] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    lead_source: '',
    current_stage: '',
    notes: '',
    custom_fields: {},
  });
  const [error, setError] = useState(null);

  const load = () => {
    const params = {};
    if (statusFilter) params.current_stage = statusFilter;
    if (sourceFilter) params.lead_source = sourceFilter;

    api.get('/leads', { params })
      .then((res) => setLeads(res.data.data || res.data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load leads.'));
  };

  useEffect(() => {
    api.get('/leads/schema')
      .then((res) => {
        const nextSchema = res.data || { picklists: {}, custom_fields: { lead: [] } };
        setSchema(nextSchema);
        setForm((prev) => ({
          ...prev,
          lead_source: prev.lead_source || (nextSchema.picklists?.lead_source?.[0] || ''),
          current_stage: prev.current_stage || (nextSchema.picklists?.current_stage?.[0] || ''),
        }));
      })
      .catch(() => {});
  }, []);

  useEffect(load, [statusFilter, sourceFilter]);

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      await api.post('/leads', form);
      setForm({
        name: '',
        company: '',
        email: '',
        phone: '',
        lead_source: schema.picklists?.lead_source?.[0] || '',
        current_stage: schema.picklists?.current_stage?.[0] || '',
        notes: '',
        custom_fields: {},
      });
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save lead.');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 className="page-title">Leads</h1>
        <button onClick={() => setShowForm(!showForm)}>{showForm ? 'Close' : '+ New Lead'}</button>
      </div>

      {showForm && (
        <form className="card" onSubmit={submit}>
          <div className="grid cols-3">
            <div className="form-row"><label>Name *</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
            <div className="form-row"><label>Company</label>
              <input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} /></div>
            <div className="form-row"><label>Email</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div className="form-row"><label>Phone</label>
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            <div className="form-row"><label>Lead Source</label>
              <select value={form.lead_source} onChange={(e) => setForm({ ...form, lead_source: e.target.value })}>
                {(schema.picklists?.lead_source || []).map((s) => <option key={s} value={s}>{s}</option>)}
              </select></div>
            <div className="form-row"><label>Current Stage</label>
              <select value={form.current_stage} onChange={(e) => setForm({ ...form, current_stage: e.target.value })}>
                {(schema.picklists?.current_stage || []).map((s) => <option key={s} value={s}>{s}</option>)}
              </select></div>
            <div className="form-row"><label>Notes</label>
              <input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          </div>
          {(schema.custom_fields?.lead || []).length > 0 && (
            <div className="grid cols-3">
              {schema.custom_fields.lead.map((field) => (
                <div className="form-row" key={field.field_key}>
                  <label>{field.label}</label>
                  {field.field_type === 'select' ? (
                    <select
                      value={form.custom_fields[field.field_key] || ''}
                      onChange={(e) => setForm({
                        ...form,
                        custom_fields: { ...form.custom_fields, [field.field_key]: e.target.value },
                      })}
                    >
                      <option value="">Select...</option>
                      {(field.options || []).map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  ) : (
                    <input
                      type={field.field_type === 'date' ? 'date' : 'text'}
                      value={form.custom_fields[field.field_key] || ''}
                      onChange={(e) => setForm({
                        ...form,
                        custom_fields: { ...form.custom_fields, [field.field_key]: e.target.value },
                      })}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
          <button type="submit">Save Lead</button>
        </form>
      )}

      <div className="card">
        <div className="grid cols-3">
          <div className="form-row">
            <label>Filter by stage</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All</option>
              {(schema.picklists?.current_stage || []).map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="form-row">
            <label>Filter by source</label>
            <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)}>
              <option value="">All</option>
              {(schema.picklists?.lead_source || []).map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
        {error && <p className="error-text">{error}</p>}
        <table>
          <thead>
            <tr><th>Name</th><th>Company</th><th>Lead Source</th><th>Current Stage</th><th>Owner</th><th>Client ID</th><th>Last change</th><th></th></tr>
          </thead>
          <tbody>
            {leads.map((l) => (
              <tr key={l.id}>
                <td><Link to={`/leads/${l.id}`}>{l.name}</Link></td>
                <td>{l.company}</td>
                <td>{l.lead_source || l.source || '—'}</td>
                <td><span className="badge pending">{l.current_stage || l.status || '—'}</span></td>
                <td>{l.owner?.name}</td>
                <td>{l.customer?.client_id}</td>
                <td>{l.status_updated_at ? new Date(l.status_updated_at).toLocaleDateString() : '—'}</td>
              </tr>
            ))}
            {!leads.length && <tr><td colSpan={8} className="kpi-sub">No leads yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
