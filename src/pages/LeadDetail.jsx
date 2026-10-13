import React, { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/client.js';
import MicrosoftEmailPanel from '../components/MicrosoftEmailPanel.jsx';
import AccordionSection from '../components/AccordionSection.jsx';
import LeadContractPanel from '../components/LeadContractPanel.jsx';
import LeadPipelineRibbon from '../components/LeadPipelineRibbon.jsx';
import PicklistSelect from '../components/PicklistSelect.jsx';
import { help } from '../content/helpText.js';
import { normalizeLeadPayload } from '../utils/normalizeLead.js';
import ActionToast from '../components/ActionToast.jsx';
import LeadDetailActionRail from '../components/LeadDetailActionRail.jsx';
import LeadEmailModal from '../components/LeadEmailModal.jsx';
import { useActionFeedback } from '../hooks/useActionFeedback.js';

function resolveLeadEmail(lead, contacts) {
  if (lead?.email?.trim()) return lead.email.trim();
  const primary = (contacts || []).find((c) => c.is_primary) || (contacts || []).find((c) => c.email?.trim());
  return primary?.email?.trim() || '';
}

const SECTION_IDS = [
  'lead-section-capture',
  'lead-section-qualify',
  'lead-section-appoint',
  'lead-section-convert',
  'lead-section-contract',
  'lead-section-email',
];

function LegacyFieldHint({ warnings, field }) {
  const match = (warnings || []).find((w) => w.field === field);
  if (!match) return null;
  return (
    <span className="legacy-field-hint">
      Stored value &quot;{match.value}&quot; is not in current Settings — update this field or ask admin to adjust the catalogue.
    </span>
  );
}

export default function LeadDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lead, setLead] = useState(null);
  const [schema, setSchema] = useState({ picklists: {}, custom_fields: { lead: [], engagement: [] } });
  const [error, setError] = useState(null);
  const { feedback, busy, runAction, clearFeedback } = useActionFeedback();
  const [engagement, setEngagement] = useState({
    channel: '',
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
  const [convertAgreedPrices, setConvertAgreedPrices] = useState({});
  const [convertAgreedUnits, setConvertAgreedUnits] = useState({});
  const [convertClientId, setConvertClientId] = useState('');
  const [products, setProducts] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [openSections, setOpenSections] = useState({
    'lead-section-capture': true,
    'lead-section-qualify': true,
  });
  const [capture, setCapture] = useState({
    lead_source: '',
    organization_type: '',
    customer_segment: '',
    industry: '',
    geo_location: '',
    product_interest: '',
  });
  const [qualify, setQualify] = useState({
    interest_level: '',
    buying_timeline: '',
    primary_contact_method: '',
    contact_role: '',
  });
  const [emailModalOpen, setEmailModalOpen] = useState(false);

  useLayoutEffect(() => {
    setError(null);
    clearFeedback();
    setLead(null);
  }, [id]);

  const load = () => {
    api.get(`/leads/${id}`)
      .then((res) => {
        const row = normalizeLeadPayload(res.data);
        if (!row) {
          setLead(null);
          setError('Lead data was invalid or empty.');
          return;
        }
        setLead(row);
        setError(null);
        setCapture({
          lead_source: row.lead_source || row.source || '',
          organization_type: row.organization_type || row.customer_type || row.customer_segment || '',
          customer_segment: row.customer_segment || '',
          industry: row.industry || '',
          geo_location: row.geo_location || '',
          product_interest: row.product_interest || '',
        });
        setQualify({
          interest_level: row.interest_level || '',
          buying_timeline: row.buying_timeline || '',
          primary_contact_method: row.primary_contact_method || '',
          contact_role: row.contact_role || '',
        });
        setContacts(row.contacts.map((c) => ({ ...c, is_primary: !!c.is_primary })));
      })
      .catch((err) => {
        const msg = err.response?.data?.message
          || (err.response?.status === 403 ? 'You do not have access to this lead (check owner_id after SQL import).'
          : err.response?.status === 404 ? 'Lead not found.'
          : 'Failed to load lead.');
        setLead(null);
        setError(msg);
      });
    api.get('/products-services')
      .then((res) => setProducts(Array.isArray(res.data) ? res.data : []))
      .catch(() => setProducts([]));
  };

  useEffect(() => {
    api.get('/leads/schema')
      .then((res) => {
        const nextSchema = res.data || { picklists: {}, custom_fields: { lead: [], engagement: [] } };
        setSchema(nextSchema);
        setEngagement((prev) => ({
          ...prev,
          channel: prev.channel || (nextSchema.picklists?.engagement_channel?.[0] || 'Phone'),
          contact_method: prev.contact_method || (nextSchema.picklists?.contact_method?.[0] || ''),
          activity_outcome: prev.activity_outcome || (nextSchema.picklists?.activity_outcome?.[0] || ''),
        }));
      })
      .catch(() => {});
  }, []);

  useEffect(load, [id]);

  const jumpToSection = useCallback((sectionId) => {
    if (!SECTION_IDS.includes(sectionId)) return;
    setOpenSections((prev) => ({ ...prev, [sectionId]: true }));
    window.requestAnimationFrame(() => {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, []);

  if (!lead) {
    return (
      <div className="card">
        {error ? <p className="error-text">{error}</p> : <p className="kpi-sub">Loading…</p>}
        <p style={{ marginTop: 12 }}>
          <Link to="/leads">← Back to leads</Link>
        </p>
      </div>
    );
  }

  const changeStatus = (current_stage) => runAction(
    () => api.put(`/leads/${id}`, { current_stage }).then(() => load()),
    { successMessage: 'Stage updated.', errorMessage: 'Update failed.' },
  );

  const saveCapture = (e) => {
    e.preventDefault();
    return runAction(
      () => api.put(`/leads/${id}`, capture).then(() => load()),
      { successMessage: 'Capture fields saved.', errorMessage: 'Could not save capture fields.' },
    );
  };

  const saveQualify = (e) => {
    e.preventDefault();
    return runAction(
      () => api.put(`/leads/${id}`, qualify).then(() => load()),
      { successMessage: 'Qualification fields saved.', errorMessage: 'Could not save qualification fields.' },
    );
  };

  const logEngagement = (e) => {
    e.preventDefault();
    return runAction(
      () => api.post(`/leads/${id}/engagements`, engagement).then(() => {
        setEngagement({
          channel: schema.picklists?.engagement_channel?.[0] || 'Phone',
          summary: '',
          contact_method: schema.picklists?.contact_method?.[0] || '',
          purpose: '',
          activity_outcome: schema.picklists?.activity_outcome?.[0] || '',
          next_action: '',
          next_follow_up_at: '',
          notes: '',
          custom_fields: {},
        });
        load();
      }),
      { successMessage: 'Engagement logged — stale timer reset.', errorMessage: 'Could not log engagement.' },
    );
  };

  const scheduleAppointment = (e) => {
    e.preventDefault();
    return runAction(
      () => api.post('/appointments', { ...appointment, lead_id: Number(id) }).then(() => {
        setAppointment({ title: '', scheduled_at: '', location: '' });
        load();
      }),
      { successMessage: 'Appointment scheduled.', errorMessage: 'Could not schedule appointment.' },
    );
  };

  const convert = () => runAction(async () => {
    const payload = { product_service_ids: convertProducts.map(Number) };
    const agreed_prices = {};
    const agreed_units = {};
    convertProducts.forEach((pid) => {
      const rawPrice = convertAgreedPrices[pid];
      if (rawPrice !== undefined && rawPrice !== '') {
        agreed_prices[pid] = Number(rawPrice);
      }
      const rawUnit = convertAgreedUnits[pid];
      if (rawUnit !== undefined && rawUnit !== '') {
        agreed_units[pid] = Number(rawUnit);
      }
    });
    if (Object.keys(agreed_prices).length) payload.agreed_prices = agreed_prices;
    if (Object.keys(agreed_units).length) payload.agreed_units = agreed_units;
    if (convertClientId.trim()) payload.client_id = convertClientId.trim();
    const res = await api.post(`/leads/${id}/convert`, payload);
    load();
    return res;
  }, {
    successMessage: 'Converted to customer successfully.',
    errorMessage: 'Conversion failed.',
  });

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

  const saveContacts = (e) => {
    e.preventDefault();
    return runAction(
      () => api.put(`/leads/${id}`, {
        contacts: contacts.map((c) => ({
          id: c.id,
          name: c.name || null,
          role: c.role || null,
          email: c.email || null,
          phone: c.phone || null,
          viber_id: c.viber_id || null,
          is_primary: !!c.is_primary,
        })),
      }).then(() => load()),
      { successMessage: 'Contacts saved.', errorMessage: 'Could not save contacts.' },
    );
  };

  const canConvert = !!lead.convert_eligible;
  const convertBlockedHint = `Conversion unlocks at Qualified stage or later. Current stage: ${lead.current_stage || 'Unknown'}.`;
  const legacyWarnings = lead.legacy_picklist_warnings || [];
  const sendEmailTo = resolveLeadEmail(lead, contacts);
  const canSendEmail = !!sendEmailTo;
  const emailHint = canSendEmail
    ? `Send to ${sendEmailTo}`
    : 'Add an email on the lead or mark a primary contact with email.';

  const openEmail = () => {
    setEmailModalOpen(true);
    jumpToSection('lead-section-email');
  };

  const sectionOpen = (id) => !!openSections[id];
  const setSectionOpen = (id) => (next) => {
    setOpenSections((prev) => ({ ...prev, [id]: typeof next === 'boolean' ? next : !prev[id] }));
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <h1 className="page-title">{lead.name} {lead.company ? `· ${lead.company}` : ''}</h1>
        <button className="secondary" onClick={() => navigate('/leads')}>← Back</button>
      </div>
      {error && <p className="error-text">{error}</p>}
      <ActionToast feedback={feedback} busy={busy} onDismiss={clearFeedback} />
      <LeadPipelineRibbon
        currentStage={lead.current_stage}
        converted={lead.status === 'converted'}
        onJumpToSection={jumpToSection}
        onEmailClick={openEmail}
      />

      <LeadEmailModal
        open={emailModalOpen}
        onClose={() => setEmailModalOpen(false)}
        leadId={id}
        canSendEmail={canSendEmail}
        emailHint={emailHint}
      />

      <div className="lead-detail-page">
        <LeadDetailActionRail
          lead={lead}
          contacts={contacts}
          onEmailClick={openEmail}
          onJumpToSection={jumpToSection}
          canSendEmail={canSendEmail}
          emailHint={emailHint}
        />
        <div className="lead-detail-main">
      <div className="lead-detail-sections">
        <AccordionSection
          id="lead-section-capture"
          title="START: Pipeline & capture"
          subtitle="Stage, lead source, organization type, firmographics"
          open={sectionOpen('lead-section-capture')}
          onOpenChange={setSectionOpen('lead-section-capture')}
          helpText={help.leadPipelineStage}
          helpTitle="Pipeline stage"
        >
          <p><span className="badge pending">{lead.current_stage || lead.status}</span></p>
          <div className="form-row form-row-inline">
            <label>Move to</label>
            <select className="form-control-inline" value="" onChange={(e) => e.target.value && changeStatus(e.target.value)}>
              <option value="">Select stage…</option>
              {(schema.picklists?.current_stage || []).map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <p className="kpi-sub">Last status change: {lead.status_updated_at ? new Date(lead.status_updated_at).toLocaleString() : '—'}</p>
          <p className="kpi-sub">Phone: {lead.phone || '—'} · Email: {lead.email || sendEmailTo || '—'}</p>
          {lead.customer && <p>Client: <Link to={`/customers/${lead.customer.id}`}>{lead.customer.client_id}</Link></p>}
          <div className="lead-form-stack">
          <form onSubmit={saveCapture} style={{ marginTop: 12 }}>
            <PicklistSelect
              layout="inline"
              label="Lead source (how they heard about us)"
              value={capture.lead_source}
              options={schema.picklists?.lead_source}
              onChange={(v) => setCapture({ ...capture, lead_source: v })}
            />
            <LegacyFieldHint warnings={legacyWarnings} field="lead_source" />
            <PicklistSelect
              layout="inline"
              label="Organization type"
              value={capture.organization_type}
              options={schema.picklists?.organization_type}
              onChange={(v) => setCapture({ ...capture, organization_type: v })}
            />
            <LegacyFieldHint warnings={legacyWarnings} field="organization_type" />
            <LegacyFieldHint warnings={legacyWarnings} field="customer_segment" />
            <PicklistSelect
              layout="inline"
              label="Customer segment (optional size band)"
              value={capture.customer_segment}
              options={schema.picklists?.customer_segment}
              onChange={(v) => setCapture({ ...capture, customer_segment: v })}
            />
            <PicklistSelect
              layout="inline"
              label="Industry"
              value={capture.industry}
              options={schema.picklists?.industry}
              onChange={(v) => setCapture({ ...capture, industry: v })}
            />
            <PicklistSelect
              layout="inline"
              label="Geo location"
              value={capture.geo_location}
              options={schema.picklists?.geo_location}
              onChange={(v) => setCapture({ ...capture, geo_location: v })}
            />
            <PicklistSelect
              layout="inline"
              label="Product interest"
              value={capture.product_interest}
              options={schema.picklists?.product_interest}
              onChange={(v) => setCapture({ ...capture, product_interest: v })}
            />
            <button type="submit" className="small" disabled={busy}>Save capture</button>
          </form>
          </div>
        </AccordionSection>

        <AccordionSection
          id="lead-section-qualify"
          title="ENGAGE: Qualify, contacts & follow-up"
          subtitle="Score the opportunity, contacts, and iterative follow-up loop"
          open={sectionOpen('lead-section-qualify')}
          onOpenChange={setSectionOpen('lead-section-qualify')}
          helpText={help.leadFollowUp}
          helpTitle="Follow-up and engagements"
        >
          <form onSubmit={saveQualify} className="lead-form-stack" style={{ marginBottom: 16 }}>
            <PicklistSelect
              layout="inline"
              label="Potential (yield)"
              value={qualify.interest_level}
              options={schema.picklists?.interest_level}
              onChange={(v) => setQualify({ ...qualify, interest_level: v })}
            />
            <PicklistSelect
              layout="inline"
              label="Buying timeline"
              value={qualify.buying_timeline}
              options={schema.picklists?.buying_timeline}
              onChange={(v) => setQualify({ ...qualify, buying_timeline: v })}
            />
            <PicklistSelect
              layout="inline"
              label="Primary contact method"
              value={qualify.primary_contact_method}
              options={schema.picklists?.contact_method}
              onChange={(v) => setQualify({ ...qualify, primary_contact_method: v })}
            />
            <PicklistSelect
              layout="inline"
              label="Primary contact role"
              value={qualify.contact_role}
              options={schema.picklists?.contact_role}
              onChange={(v) => setQualify({ ...qualify, contact_role: v })}
            />
            <button type="submit" className="small" disabled={busy}>Save qualification</button>
          </form>
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
              <button type="submit" className="small" disabled={busy}>Save contacts</button>
            </div>
          </form>

          <hr style={{ margin: '20px 0', border: 'none', borderTop: '1px solid var(--border)' }} />
          <h4>Follow-up loop</h4>
          {lead.needs_qualify_review && (
            <p className="error-text">
              Qualify review needed: {lead.idle_touch_count} touches without progress outcome.
            </p>
          )}
          <form onSubmit={logEngagement}>
            <div className="form-row form-row-inline"><label>Channel</label>
              <select className="form-control-inline" value={engagement.channel} onChange={(e) => setEngagement({ ...engagement, channel: e.target.value })}>
                {(schema.picklists?.engagement_channel || []).map((c) => <option key={c} value={c}>{c}</option>)}
              </select></div>
            <div className="form-row form-row-inline"><label>Contact Method</label>
              <select className="form-control-inline" value={engagement.contact_method} onChange={(e) => setEngagement({ ...engagement, contact_method: e.target.value })}>
                {(schema.picklists?.contact_method || []).map((c) => <option key={c} value={c}>{c}</option>)}
              </select></div>
            <div className="form-row"><label>Purpose</label>
              <input value={engagement.purpose} onChange={(e) => setEngagement({ ...engagement, purpose: e.target.value })} /></div>
            <div className="form-row"><label>Summary *</label>
              <textarea rows={2} value={engagement.summary} onChange={(e) => setEngagement({ ...engagement, summary: e.target.value })} required /></div>
            <div className="form-row form-row-inline"><label>Activity Outcome</label>
              <select className="form-control-inline" value={engagement.activity_outcome} onChange={(e) => setEngagement({ ...engagement, activity_outcome: e.target.value })}>
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
                      custom_fields: { ...(engagement.custom_fields || {}), [field.field_key]: e.target.value },
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
                      custom_fields: { ...(engagement.custom_fields || {}), [field.field_key]: e.target.value },
                    })}
                  />
                )}
              </div>
            ))}
            <button type="submit" disabled={busy}>Log engagement</button>
          </form>
          <h4 style={{ marginTop: 20 }}>Engagement history</h4>
          <table>
            <tbody>
              {(lead.engagements || []).map((e) => (
                <tr key={e.id ?? e.created_at}>
                  <td>{e.created_at ? new Date(e.created_at).toLocaleDateString() : '—'}</td>
                  <td>{e.contact_method || e.channel || '—'}</td>
                  <td>{e.summary || e.purpose || '—'}</td>
                  <td className="kpi-sub">{e.user?.name}</td>
                </tr>
              ))}
              {!(lead.engagements || []).length && <tr><td className="kpi-sub">No engagements logged.</td></tr>}
            </tbody>
          </table>
        </AccordionSection>

        <AccordionSection
          id="lead-section-appoint"
          title="PAYOFF: Appointments"
          subtitle="Schedule and track demos or meetings"
          open={sectionOpen('lead-section-appoint')}
          onOpenChange={setSectionOpen('lead-section-appoint')}
        >
          <form onSubmit={scheduleAppointment}>
            <div className="form-row"><label>Title *</label>
              <input value={appointment.title} onChange={(e) => setAppointment({ ...appointment, title: e.target.value })} required /></div>
            <div className="form-row"><label>Date &amp; time *</label>
              <input type="datetime-local" value={appointment.scheduled_at} onChange={(e) => setAppointment({ ...appointment, scheduled_at: e.target.value })} required /></div>
            <div className="form-row"><label>Location</label>
              <input value={appointment.location} onChange={(e) => setAppointment({ ...appointment, location: e.target.value })} /></div>
            <button type="submit" disabled={busy}>Schedule</button>
          </form>
          <table style={{ marginTop: 16 }}>
            <thead><tr><th>Title</th><th>When</th><th>Location</th><th>Status</th><th>Outcome</th></tr></thead>
            <tbody>
              {(lead.appointments || []).map((a) => (
                <tr key={a.id ?? a.scheduled_at}>
                  <td>{a.title}</td>
                  <td>{a.scheduled_at ? new Date(a.scheduled_at).toLocaleString() : '—'}</td>
                  <td>{a.location}</td>
                  <td><span className={`badge ${a.status === 'done' ? 'converted' : 'pending'}`}>{a.status}</span></td>
                  <td>{a.outcome}</td>
                </tr>
              ))}
              {!(lead.appointments || []).length && <tr><td colSpan={5} className="kpi-sub">None scheduled.</td></tr>}
            </tbody>
          </table>
        </AccordionSection>

        <AccordionSection
          id="lead-section-convert"
          title="DEAL: Convert to customer"
          subtitle="Attach products and generate client ID"
          open={sectionOpen('lead-section-convert')}
          onOpenChange={setSectionOpen('lead-section-convert')}
        >
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
                <p className="kpi-sub">Format YYMMDD_C{'{n}'} (e.g. 261009_C101). Leave blank to auto-generate.</p>
              </div>
              <div className="form-row">
                <label>Products / Services</label>
                <select
                  multiple
                  value={convertProducts}
                  onChange={(e) => {
                    const next = [...e.target.selectedOptions].map((o) => o.value);
                    setConvertProducts(next);
                    setConvertAgreedPrices((prev) => {
                      const kept = {};
                      next.forEach((pid) => {
                        if (prev[pid] !== undefined) kept[pid] = prev[pid];
                      });
                      return kept;
                    });
                    setConvertAgreedUnits((prev) => {
                      const kept = {};
                      next.forEach((pid) => {
                        if (prev[pid] !== undefined) kept[pid] = prev[pid];
                      });
                      return kept;
                    });
                  }}
                  style={{ height: 110 }}
                >
                  {products.map((p) => <option key={p.id} value={String(p.id)}>{p.name}</option>)}
                </select>
              </div>
              {convertProducts.length > 0 && (
                <div className="form-row">
                  <label>Agreed total &amp; units per product (optional)</label>
                  {convertProducts.map((pid) => {
                    const product = products.find((p) => String(p.id) === String(pid));
                    const agreed = convertAgreedPrices[pid];
                    const units = convertAgreedUnits[pid];
                    const unitPreview = (agreed !== undefined && agreed !== '' && units !== undefined && units !== '' && Number(units) > 0)
                      ? (Number(agreed) / Number(units)).toFixed(2)
                      : null;
                    return (
                      <div key={pid} style={{ marginBottom: 10 }}>
                        <div style={{ fontWeight: 600, marginBottom: 4 }}>{product?.name || pid}</div>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder={product?.price ? `Agreed total (list ${product.price})` : 'Agreed total'}
                            value={convertAgreedPrices[pid] ?? ''}
                            onChange={(e) => setConvertAgreedPrices({ ...convertAgreedPrices, [pid]: e.target.value })}
                            style={{ flex: '1 1 140px' }}
                          />
                          <input
                            type="number"
                            step="0.0001"
                            min="0.0001"
                            placeholder="Units"
                            value={convertAgreedUnits[pid] ?? ''}
                            onChange={(e) => setConvertAgreedUnits({ ...convertAgreedUnits, [pid]: e.target.value })}
                            style={{ flex: '0 1 100px' }}
                          />
                          {unitPreview && (
                            <span className="kpi-sub">Unit price ≈ {unitPreview}</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              <button type="button" onClick={convert} disabled={busy}>Convert &amp; generate client ID</button>
            </>
          )}
        </AccordionSection>

        <AccordionSection
          id="lead-section-contract"
          title="CHEERS: Contract sign-off"
          subtitle="Documents, agreements, renewals"
          open={sectionOpen('lead-section-contract')}
          onOpenChange={setSectionOpen('lead-section-contract')}
        >
          <LeadContractPanel lead={lead} customerId={lead.customer?.id} />
        </AccordionSection>

        <AccordionSection
          id="lead-section-email"
          title="Email (Microsoft 365)"
          subtitle="Send from your linked mailbox"
          open={sectionOpen('lead-section-email')}
          onOpenChange={setSectionOpen('lead-section-email')}
        >
          <MicrosoftEmailPanel
            sendUrl={`/leads/${id}/email`}
            disabled={!canSendEmail}
            returnPath={`/leads/${id}`}
          />
        </AccordionSection>
      </div>
        </div>
      </div>
    </div>
  );
}
