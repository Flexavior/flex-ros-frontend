/** Harden lead detail API payload (SQL imports may omit arrays or break JSON fields). */
export function normalizeLeadPayload(data) {
  if (!data || typeof data !== 'object') {
    return null;
  }

  let customFields = data.custom_fields;
  if (typeof customFields === 'string') {
    try {
      customFields = JSON.parse(customFields);
    } catch {
      customFields = {};
    }
  }
  if (!customFields || typeof customFields !== 'object' || Array.isArray(customFields)) {
    customFields = {};
  }

  const customer = data.customer && typeof data.customer === 'object' && data.customer.id != null
    ? data.customer
    : null;

  const organizationType = data.organization_type ?? data.customer_type ?? null;
  const leadSource = data.lead_source ?? data.source ?? null;

  return {
    ...data,
    organization_type: organizationType,
    lead_source: leadSource,
    name: data.name != null && String(data.name).trim() !== '' ? String(data.name) : 'Unnamed lead',
    customer,
    owner: data.owner && typeof data.owner === 'object' ? data.owner : null,
    convert_eligible: !!data.convert_eligible,
    needs_qualify_review: !!data.needs_qualify_review,
    idle_touch_count: Number.isFinite(Number(data.idle_touch_count)) ? Number(data.idle_touch_count) : 0,
    contacts: Array.isArray(data.contacts) ? data.contacts : [],
    engagements: Array.isArray(data.engagements) ? data.engagements : [],
    appointments: Array.isArray(data.appointments) ? data.appointments : [],
    legacy_picklist_warnings: Array.isArray(data.legacy_picklist_warnings)
      ? data.legacy_picklist_warnings.filter((w) => w && w.field != null)
      : [],
    custom_fields: customFields,
  };
}
