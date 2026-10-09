/** CRM operational modules — system administrator uses Admin Console only. */
export const CRM_OPERATIONAL_ROLES = [
  'ceo',
  'senior_management',
  'supervisor',
  'senior_staff',
  'staff',
  'sales',
  'marketing',
  'customer_service',
];

export const INBOX_ROLES = CRM_OPERATIONAL_ROLES.filter((r) => r !== 'admin');

export function isAdminUser(user) {
  return user?.role?.code === 'admin';
}

export function canUseCrmModules(user) {
  return user?.role?.code && CRM_OPERATIONAL_ROLES.includes(user.role.code);
}

export function defaultHomeFor(user) {
  return isAdminUser(user) ? '/admin' : '/';
}

/** Where to send the user after login (admin never lands on CRM modules). */
export function resolvePostLoginPath(user, rawReturnUrl, safeReturnUrl) {
  if (isAdminUser(user)) {
    if (rawReturnUrl && (safeReturnUrl.startsWith('/admin') || safeReturnUrl.startsWith('/settings') || safeReturnUrl.startsWith('/people'))) {
      return safeReturnUrl;
    }
    return '/admin';
  }
  return rawReturnUrl ? safeReturnUrl : defaultHomeFor(user);
}
