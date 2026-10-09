/** Align with backend App\Domain\Crm\CustomerStatus */
export function normalizeCustomerStatus(value) {
  const raw = String(value || '').trim().toLowerCase();
  if (raw === 'onboarding' || raw === 'on-boarding') return 'onboarding';
  if (['churned', 'inactive', 'in-active', 'closed', 'disabled'].includes(raw)) return 'churned';
  if (raw === 'active' || raw === 'act' || raw === '') return 'active';
  return 'active';
}

export function customerStatusLabel(canonical) {
  if (canonical === 'onboarding') return 'Onboarding';
  if (canonical === 'churned') return 'Inactive';
  return 'Active';
}
