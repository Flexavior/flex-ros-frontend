import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/client.js';
import MicrosoftEmailPanel from '../components/MicrosoftEmailPanel.jsx';

export default function LeadDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lead, setLead] = useState(null);
  const [schema, setSchema] = useState({ picklists: {}, custom_fields: { lead: [], engagement: [] } });
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [engagement, setEngagement] = useState({
    channel: 'call',
    summary: '',
    contact_method: '',
    purpose: '',
    activity_outcome: '',
    next_action: '',
    next_follow_up_at: '',
    notes: '',
    custom_fields: {},
  });
  const [appointment, setAppointment] = useState({ title: '', scheduled_at: '', location: '' });
  const [convertProducts, setConvertProducts] = useState([]);
  const [products, setProducts] = useState([]);

  const load = () => {
    api.get(`/leads/${id}`)
      .then((res) => setLead(res.data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load lead.'));
    api.get('/products-services').then((res) => setProducts(res.data)).catch(() => {});
  };

  useEffect(() => {
    api.get('/leads/schema')
      .then((res) => {
        const nextSchema = res.data || { picklists: {}, custom_fields: { lead: [], engagement: [] } };
        setSchema(nextSchema);
        setEngagement((prev) => ({
          ...prev,
          contact_method: prev.contact_method || (nextSchema.picklists?.contact_method?.[0] || ''),
          activity_outcome: prev.activity_outcome || (nextSchema.picklists?.activity_outcome?.[0] || ''),
        }));
      })
      .catch(() => {});
  }, []);

  useEffect(load, [id]);

  if (error) return <div className="card"><p className="error-text">{error}</p> <Link to="/leads">Back to leads</Link></div>;
  if (!lead) return <div className="card">Loading…</div>;

  const changeStatus = async (current_stage) => {
    try {
      await api.put(`/leads/${id}`, { current_stage });
      setMessage('Stage updated.');
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Update failed.');
    }
  };

  const logEngagement = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/leads/${id}/engagements`, engagement);
      setEngagement({
        channel: 'call',
        summary: '',
        contact_method: schema.picklists?.contact_method?.[0] || '',
        purpose: '',
        activity_outcome: schema.picklists?.activity_outcome?.[0] || '',
        next_action: '',
        next_follow_up_at: '',
        notes: '',
        custom_fields: {},
      });
      setMessage('Engagement logged — stale timer reset.');
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not log engagement.');
    }
  };

  const scheduleAppointment = async (e) => {
    e.preventDefault();
    try {
      await api.post('/appointments', { ...appointment, lead_id: Number(id) });
      setAppointment({ title: '', scheduled_at: '', location: '' });
      setMessage('Appointment scheduled.');
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not schedule appointment.');
    }
  };

  const convert = async () => {
    try {
      const res = await api.post(`/leads/${id}/convert`, { product_service_ids: convertProducts.map(Number) });
      setMessage(`Converted! Client ID: ${res.data.client_id}`);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Conversion failed.');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <h1 className="page-title">{lead.name} {lead.company ? `· ${lead.company}` : ''}</h1>
        <button className="secondary" onClick={() => navigate('/leads')}>← Back</button>
      </div>
      {message && <p className="success-text">{message}</p>}
      {error && <p className="error-text">{error}</p>}

      <div className="grid cols-3">
        <div className="card">
          <h3>Pipeline Stage</h3>
          <p><span className="badge pending">{lead.current_stage || lead.status}</span></p>
          <div className="form-row">
            <label>Move to</label>
            <select value="" onChange={(e) => e.target.value && changeStatus(e.target.value)}>
              <option value="">Select stage…</option>
              {(schema.picklists?.current_stage || []).map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <p className="kpi-sub">Last status change: {lead.status_updated_at ? new Date(lead.status_updated_at).toLocaleString() : '—'}</p>
          <p className="kpi-sub">Source: {lead.lead_source || lead.source || '—'} · Phone: {lead.phone || '—'} · Email: {lead.email || '—'}</p>
          <p className="kpi-sub">Interest: {lead.product_interest || '—'} · Segment: {lead.customer_segment || '—'}</p>
          {lead.customer && <p>Client: <Link to={`/customers/${lead.customer.id}`}>{lead.customer.client_id}</Link></p>}
        </div>

        <div className="card">
          <h3>Convert to Customer</h3>
          {lead.status === 'converted' ? (
            <p className="success-text">Already converted.</p>
          ) : (
            <>
              <div className="form-row">
                <label>Products / Services</label>
                <select multiple value={convertProducts} onChange={(e) => setConvertProducts([...e.target.selectedOptions].map((o) => o.value))} style={{ height: 110 }}>
                  {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <button onClick={convert}>Convert &amp; Generate Client ID</button>
            </>
          )}
        </div>

        <div className="card">
          <h3>Schedule Appointment</h3>
          <form onSubmit={scheduleAppointment}>
            <div className="form-row"><label>Title *</label>
              <input value={appointment.title} onChange={(e) => setAppointment({ ...appointment, title: e.target.value })} required /></div>
            <div className="form-row"><label>Date &amp; time *</label>
              <input type="datetime-local" value={appointment.scheduled_at} onChange={(e) => setAppointment({ ...appointment, scheduled_at: e.target.value })} required /></div>
            <div className="form-row"><label>Location</label>
              <input value={appointment.location} onChange={(e) => setAppointment({ ...appointment, location: e.target.value })} /></div>
            <button type="submit">Schedule</button>
          </form>
        </div>
      </div>

      <MicrosoftEmailPanel sendUrl={`/leads/${id}/email`} disabled={!lead.email} />

      <div className="grid cols-2">
        <div className="card">
          <h3>Log Engagement (follow-up)</h3>
          <form onSubmit={logEngagement}>
            <div className="form-row"><label>Channel</label>
              <select value={engagement.channel} onChange={(e) => setEngagement({ ...engagement, channel: e.target.value })}>
                {['call', 'visit', 'viber', 'telegram', 'email', 'discord', 'teams'].map((c) => <option key={c}>{c}</option>)}
              </select></div>
            <div className="form-row"><label>Contact Method</label>
              <select value={engagement.contact_method} onChange={(e) => setEngagement({ ...engagement, contact_method: e.target.value })}>
                {(schema.picklists?.contact_method || []).map((c) => <option key={c} value={c}>{c}</option>)}
              </select></div>
            <div className="form-row"><label>Purpose</label>
              <input value={engagement.purpose} onChange={(e) => setEngagement({ ...engagement, purpose: e.target.value })} /></div>
            <div className="form-row"><label>Summary *</label>
              <textarea rows={2} value={engagement.summary} onChange={(e) => setEngagement({ ...engagement, summary: e.target.value })} required /></div>
            <div className="form-row"><label>Activity Outcome</label>
              <select value={engagement.activity_outcome} onChange={(e) => setEngagement({ ...engagement, activity_outcome: e.target.value })}>
                {(schema.picklists?.activity_outcome || []).map((c) => <option key={c} value={c}>{c}</option>)}
              </select></div>
            <div className="form-row"><label>Next action</label>
              <input value={engagement.next_action} onChange={(e) => setEngagement({ ...engagement, next_action: e.target.value })} /></div>
            <div className="form-row"><label>Next follow-up date</label>
              <input type="datetime-local" value={engagement.next_follow_up_at} onChange={(e) => setEngagement({ ...engagement, next_follow_up_at: e.target.value })} /></div>
            <div className="form-row"><label>Notes</label>
              <textarea rows={2} value={engagement.notes} onChange={(e) => setEngagement({ ...engagement, notes: e.target.value })} /></div>
            {(schema.custom_fields?.engagement || []).map((field) => (
              <div className="form-row" key={field.field_key}>
                <label>{field.label}</label>
                {field.field_type === 'select' ? (
                  <select
                    value={engagement.custom_fields[field.field_key] || ''}
                    onChange={(e) => setEngagement({
                      ...engagement,
                      custom_fields: { ...engagement.custom_fields, [field.field_key]: e.target.value },
                    })}
                  >
                    <option value="">Select...</option>
                    {(field.options || []).map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                ) : (
                  <input
                    type={field.field_type === 'date' ? 'date' : 'text'}
                    value={engagement.custom_fields[field.field_key] || ''}
                    onChange={(e) => setEngagement({
                      ...engagement,
                      custom_fields: { ...engagement.custom_fields, [field.field_key]: e.target.value },
                    })}
                  />
                )}
              </div>
            ))}
            <button type="submit">Log Engagement</button>
          </form>
        </div>

        <div className="card">
          <h3>Engagement History</h3>
          <table>
            <tbody>
              {(lead.engagements || []).map((e) => (
                <tr key={e.id}>
                  <td>{new Date(e.created_at).toLocaleDateString()}</td>
                  <td>{e.contact_method || e.channel || '—'}</td>
                  <td>{e.summary || e.purpose || '—'}</td>
                  <td className="kpi-sub">{e.user?.name}</td>
                </tr>
              ))}
              {!(lead.engagements || []).length && <tr><td className="kpi-sub">No engagements logged.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <h3>Appointments</h3>
        <table>
          <thead><tr><th>Title</th><th>When</th><th>Location</th><th>Status</th><th>Outcome</th></tr></thead>
          <tbody>
            {(lead.appointments || []).map((a) => (
              <tr key={a.id}>
                <td>{a.title}</td>
                <td>{new Date(a.scheduled_at).toLocaleString()}</td>
                <td>{a.location}</td>
                <td><span className={`badge ${a.status === 'done' ? 'converted' : 'pending'}`}>{a.status}</span></td>
                <td>{a.outcome}</td>
              </tr>
            ))}
            {!(lead.appointments || []).length && <tr><td colSpan={5} className="kpi-sub">None scheduled.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
