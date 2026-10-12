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

  return {
    ...data,
    name: data.name != null && String(data.name).trim() !== '' ? String(data.name) : 'Unnamed lead',
    contacts: Array.isArray(data.contacts) ? data.contacts : [],
    engagements: Array.isArray(data.engagements) ? data.engagements : [],
    appointments: Array.isArray(data.appointments) ? data.appointments : [],
    legacy_picklist_warnings: Array.isArray(data.legacy_picklist_warnings)
      ? data.legacy_picklist_warnings.filter((w) => w && w.field != null)
      : [],
    custom_fields: customFields,
  };
}
