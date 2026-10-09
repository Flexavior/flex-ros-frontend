import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/client.js';
import MicrosoftEmailPanel from '../components/MicrosoftEmailPanel.jsx';
import HelpIcon from '../components/HelpIcon.jsx';
import LeadPipelineRibbon from '../components/LeadPipelineRibbon.jsx';
import PicklistSelect from '../components/PicklistSelect.jsx';
import { help } from '../content/helpText.js';

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
  const [convertClientId, setConvertClientId] = useState('');
  const [products, setProducts] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [capture, setCapture] = useState({
    customer_segment: '',
    industry: '',
    geo_location: '',
    product_interest: '',
  });

  const load = () => {
    api.get(`/leads/${id}`)
      .then((res) => {
        setLead(res.data);
        setCapture({
          customer_segment: res.data.customer_segment || '',
          industry: res.data.industry || '',
          geo_location: res.data.geo_location || '',
          product_interest: res.data.product_interest || '',
        });
        setContacts((res.data.contacts || []).map((c) => ({ ...c, is_primary: !!c.is_primary })));
      })
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

  const saveCapture = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/leads/${id}`, capture);
      setMessage('Capture fields updated.');
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save capture fields.');
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
      const payload = { product_service_ids: convertProducts.map(Number) };
      if (convertClientId.trim()) payload.client_id = convertClientId.trim();
      const res = await api.post(`/leads/${id}/convert`, payload);
      setMessage(`Converted! Client ID: ${res.data.client_id}`);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Conversion failed.');
    }
  };

  const updateContact = (index, key, value) => {
    setContacts((prev) => prev.map((c, i) => {
      if (i !== index) return c;
      if (key === 'is_primary' && value === true) {
        return { ...c, is_primary: true };
      }
      return { ...c, [key]: value };
    }).map((c, i) => (key === 'is_primary' && value === true && i !== index ? { ...c, is_primary: false } : c)));
  };

  const addContact = () => {
    setContacts((prev) => [...prev, {
      name: '',
      role: '',
      email: '',
      phone: '',
      viber_id: '',
      is_primary: prev.length === 0,
    }]);
  };

  const removeContact = (index) => {
    setContacts((prev) => prev.filter((_, i) => i !== index));
  };

  const saveContacts = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/leads/${id}`, {
        contacts: contacts.map((c) => ({
          id: c.id,
          name: c.name || null,
          role: c.role || null,
          email: c.email || null,
          phone: c.phone || null,
          viber_id: c.viber_id || null,
          is_primary: !!c.is_primary,
        })),
      });
      setMessage('Lead contacts updated.');
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save contacts.');
    }
  };

  const canConvert = !!lead.convert_eligible;
  const convertBlockedHint = `Conversion unlocks at Qualified stage or later. Current stage: ${lead.current_stage || 'Unknown'}.`;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <h1 className="page-title">{lead.name} {lead.company ? `· ${lead.company}` : ''}</h1>
        <button className="secondary" onClick={() => navigate('/leads')}>← Back</button>
      </div>
      {message && <p className="success-text">{message}</p>}
      {error && <p className="error-text">{error}</p>}

      <LeadPipelineRibbon currentStage={lead.current_stage} converted={lead.status === 'converted'} />

      <div className="grid cols-3">
        <div className="card" id="lead-section-capture">
          <h3>
            Pipeline Stage
            <HelpIcon text={help.leadPipelineStage} label="Help: pipeline stage" />
          </h3>
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
          {lead.customer && <p>Client: <Link to={`/customers/${lead.customer.id}`}>{lead.customer.client_id}</Link></p>}
          <form onSubmit={saveCapture} style={{ marginTop: 12 }}>
            <PicklistSelect
              label="Customer segment"
              value={capture.customer_segment}
              options={schema.picklists?.customer_segment}
              onChange={(v) => setCapture({ ...capture, customer_segment: v })}
            />
            <PicklistSelect
              label="Industry"
              value={capture.industry}
              options={schema.picklists?.industry}
              onChange={(v) => setCapture({ ...capture, industry: v })}
            />
            <PicklistSelect
              label="Geo location"
              value={capture.geo_location}
              options={schema.picklists?.geo_location}
              onChange={(v) => setCapture({ ...capture, geo_location: v })}
            />
            <PicklistSelect
              label="Product interest"
              value={capture.product_interest}
              options={schema.picklists?.product_interest}
              onChange={(v) => setCapture({ ...capture, product_interest: v })}
            />
            <button type="submit" className="small">Save capture</button>
          </form>
        </div>

        <div className="card" id="lead-section-convert">
          <h3>Convert to Customer</h3>
          {lead.status === 'converted' ? (
            <p className="success-text">Already converted.</p>
          ) : !canConvert ? (
            <p className="kpi-sub">{convertBlockedHint}</p>
          ) : (
            <>
              <div className="form-row">
                <label>Client ID (optional)</label>
                <input
                  placeholder="261009_C101 (auto if blank)"
                  value={convertClientId}
                  onChange={(e) => setConvertClientId(e.target.value)}
                />
                <p className="kpi-sub">Format YYMMDD_C{n} (e.g. 261009_C101). Leave blank to auto-generate.</p>
              </div>
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

        <div className="card" id="lead-section-appoint">
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

      <MicrosoftEmailPanel sendUrl={`/leads/${id}/email`} disabled={!lead.email} returnPath={`/leads/${id}`} />

      <div className="grid cols-2">
        <div className="card">
          <h3>Contacts</h3>
          <p className="kpi-sub">Add all known contacts and mark one primary contact.</p>
          <form onSubmit={saveContacts}>
            {(contacts || []).map((contact, index) => (
              <div key={contact.id || `new-${index}`} style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 10, marginBottom: 8 }}>
                <div className="grid cols-3">
                  <div className="form-row"><label>Name</label>
                    <input value={contact.name || ''} onChange={(e) => updateContact(index, 'name', e.target.value)} />
                  </div>
                  <div className="form-row"><label>Role</label>
                    <input value={contact.role || ''} onChange={(e) => updateContact(index, 'role', e.target.value)} />
                  </div>
                  <div className="form-row"><label>Email</label>
                    <input type="email" value={contact.email || ''} onChange={(e) => updateContact(index, 'email', e.target.value)} />
                  </div>
                  <div className="form-row"><label>Phone</label>
                    <input value={contact.phone || ''} onChange={(e) => updateContact(index, 'phone', e.target.value)} />
                  </div>
                  <div className="form-row"><label>Viber ID</label>
                    <input value={contact.viber_id || ''} onChange={(e) => updateContact(index, 'viber_id', e.target.value)} />
                  </div>
                  <div className="form-row">
                    <label>Primary</label>
                    <label style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <input type="checkbox" checked={!!contact.is_primary} onChange={(e) => updateContact(index, 'is_primary', e.target.checked)} />
                      Yes
                    </label>
                  </div>
                </div>
                <button type="button" className="small danger" onClick={() => removeContact(index)}>Remove</button>
              </div>
            ))}
            {!contacts.length && <p className="kpi-sub">No contacts yet.</p>}
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" className="small" onClick={addContact}>+ Add contact</button>
              <button type="submit" className="small">Save contacts</button>
            </div>
          </form>
        </div>

        <div className="card" id="lead-section-qualify">
          <h3>
            Log Engagement (follow-up)
            <HelpIcon text={help.leadFollowUp} label="Help: follow-up" />
          </h3>
          {lead.needs_qualify_review && (
            <p className="error-text">
              Qualify review needed: {lead.idle_touch_count} touches without progress outcome.
            </p>
          )}
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
