import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client.js';

const STATUSES = ['new', 'contacted', 'qualified', 'appointment', 'converted', 'lost'];
const SOURCES = ['referral', 'viber', 'telegram', 'web', 'event', 'discord', 'teams', 'other'];

export default function Leads() {
  const [leads, setLeads] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [form, setForm] = useState({ name: '', company: '', email: '', phone: '', source: 'referral', notes: '' });
  const [error, setError] = useState(null);

  const load = () => {
    api.get('/leads', { params: statusFilter ? { status: statusFilter } : {} })
      .then((res) => setLeads(res.data.data || res.data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load leads.'));
  };

  useEffect(load, [statusFilter]);

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      await api.post('/leads', form);
      setForm({ name: '', company: '', email: '', phone: '', source: 'referral', notes: '' });
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
            <div className="form-row"><label>Source</label>
              <select value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })}>
                {SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select></div>
            <div className="form-row"><label>Notes</label>
              <input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          </div>
          <button type="submit">Save Lead</button>
        </form>
      )}

      <div className="card">
        <div className="form-row" style={{ maxWidth: 220 }}>
          <label>Filter by status</label>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        {error && <p className="error-text">{error}</p>}
        <table>
          <thead>
            <tr><th>Name</th><th>Company</th><th>Source</th><th>Status</th><th>Owner</th><th>Client ID</th><th>Last change</th><th></th></tr>
          </thead>
          <tbody>
            {leads.map((l) => (
              <tr key={l.id}>
                <td><Link to={`/leads/${l.id}`}>{l.name}</Link></td>
                <td>{l.company}</td>
                <td>{l.source}</td>
                <td><span className={`badge ${l.status}`}>{l.status}</span></td>
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
