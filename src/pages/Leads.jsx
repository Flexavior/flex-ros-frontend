import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client.js';
import HelpIcon from '../components/HelpIcon.jsx';
import LeadJourneyGuide from '../components/LeadJourneyGuide.jsx';
import PicklistSelect from '../components/PicklistSelect.jsx';
import { help } from '../content/helpText.js';

function formatLeadCustomValue(lead, field) {
  const raw = lead.custom_fields?.[field.field_key];
  if (raw === null || raw === undefined || raw === '') return '—';
  if (field.field_type === 'boolean') return raw ? 'Yes' : 'No';
  return String(raw);
}

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
    customer_segment: '',
    industry: '',
    geo_location: '',
    notes: '',
    custom_fields: {},
  });
  const [error, setError] = useState(null);
  const [metrics, setMetrics] = useState(null);

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

  useEffect(() => {
    api.get('/dashboard/metrics')
      .then((res) => setMetrics(res.data))
      .catch(() => {});
  }, []);

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
        customer_segment: '',
        industry: '',
        geo_location: '',
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
        <h1 className="page-title">
          Leads
          <HelpIcon text={help.leadsOverview} label="Help: leads list" />
        </h1>
        <button onClick={() => setShowForm(!showForm)}>{showForm ? 'Close' : '+ New Lead'}</button>
      </div>

      {metrics && (
        <div className="leads-kpi-strip" aria-label="Lead pipeline summary">
          <div className="grid cols-4 leads-kpi-grid">
            <div className="card kpi kpi-compact">
              <div className="kpi-label">Open leads</div>
              <div className="kpi-value">{metrics.leads?.open ?? 0}</div>
            </div>
            <div className="card kpi kpi-compact">
              <div className="kpi-label">Conversion</div>
              <div className="kpi-value">{metrics.conversion_rate ?? 0}%</div>
            </div>
            <div className="card kpi kpi-compact">
              <div className="kpi-label">Stale</div>
              <div className="kpi-value">{metrics.stale_tasks?.count ?? 0}</div>
              <HelpIcon text={help.leadStale} label="Help: stale leads" />
            </div>
            <div className="card kpi kpi-compact">
              <div className="kpi-label">Appointments (7d)</div>
              <div className="kpi-value">{metrics.appointments_this_week ?? 0}</div>
            </div>
          </div>
        </div>
      )}

      <LeadJourneyGuide />

      {showForm && (
        <form className="card" onSubmit={submit}>
          <h3 className="form-section-title">
            New lead
            <HelpIcon text={help.leadGeneration} label="Help: create lead" />
          </h3>
          <div className="grid cols-3">
            <div className="form-row"><label>Name *</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
            <div className="form-row"><label>Company</label>
              <input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} /></div>
            <div className="form-row"><label>Email</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div className="form-row"><label>Phone</label>
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            <PicklistSelect
              label="Lead Source"
              value={form.lead_source}
              options={schema.picklists?.lead_source}
              allowEmpty={false}
              onChange={(v) => setForm({ ...form, lead_source: v })}
            />
            <PicklistSelect
              label="Current Stage"
              value={form.current_stage}
              options={schema.picklists?.current_stage}
              allowEmpty={false}
              onChange={(v) => setForm({ ...form, current_stage: v })}
            />
            <PicklistSelect
              label="Customer segment"
              value={form.customer_segment}
              options={schema.picklists?.customer_segment}
              onChange={(v) => setForm({ ...form, customer_segment: v })}
            />
            <PicklistSelect
              label="Industry"
              value={form.industry}
              options={schema.picklists?.industry}
              onChange={(v) => setForm({ ...form, industry: v })}
            />
            <PicklistSelect
              label="Geo location"
              value={form.geo_location}
              options={schema.picklists?.geo_location}
              onChange={(v) => setForm({ ...form, geo_location: v })}
            />
            <div className="form-row"><label>Notes</label>
              <input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          </div>
          {(schema.custom_fields?.lead || []).length > 0 && (
            <div className="grid cols-3">
              <p className="kpi-sub" style={{ gridColumn: '1 / -1' }}>
                Custom fields
                <HelpIcon text={help.leadCustomFields} label="Help: custom fields" />
              </p>
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
                  ) : field.field_type === 'boolean' ? (
                    <select
                      value={form.custom_fields[field.field_key] === true ? 'true' : form.custom_fields[field.field_key] === false ? 'false' : ''}
                      onChange={(e) => {
                        const v = e.target.value;
                        setForm({
                          ...form,
                          custom_fields: {
                            ...form.custom_fields,
                            [field.field_key]: v === '' ? undefined : v === 'true',
                          },
                        });
                      }}
                    >
                      <option value="">Select...</option>
                      <option value="true">Yes</option>
                      <option value="false">No</option>
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
        <div className="table-scroll" role="region" aria-label="Leads list">
          <table>
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">Company</th>
                <th scope="col">Lead Source</th>
                <th scope="col">Segment</th>
                <th scope="col">Industry</th>
                <th scope="col">Geo</th>
                <th scope="col">Current Stage</th>
                {(schema.custom_fields?.lead || []).map((field) => (
                  <th scope="col" key={field.field_key}>{field.label}</th>
                ))}
                <th scope="col">Owner</th>
                <th scope="col">Client ID</th>
                <th scope="col">Last change</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((l) => (
                <tr key={l.id}>
                  <td><Link to={`/leads/${l.id}`}>{l.name}</Link></td>
                  <td>{l.company || '—'}</td>
                  <td>{l.lead_source || l.source || '—'}</td>
                  <td>{l.customer_segment || '—'}</td>
                  <td>{l.industry || '—'}</td>
                  <td>{l.geo_location || '—'}</td>
                  <td><span className="badge pending">{l.current_stage || l.status || '—'}</span></td>
                  {(schema.custom_fields?.lead || []).map((field) => (
                    <td key={field.field_key}>{formatLeadCustomValue(l, field)}</td>
                  ))}
                  <td>{l.owner?.name || '—'}</td>
                  <td>{l.customer?.client_id || '—'}</td>
                  <td>{l.status_updated_at ? new Date(l.status_updated_at).toLocaleDateString() : '—'}</td>
                </tr>
              ))}
              {!leads.length && (
                <tr>
                  <td colSpan={11 + (schema.custom_fields?.lead || []).length} className="kpi-sub">No leads yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
