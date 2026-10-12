const ORG_ROLES = ['ceo', 'senior_management'];

function teamContext(user) {
  return user?.team?.name ? ` in ${user.team.name}` : '';
}

export function leadListEmptyMessage(user) {
  const role = user?.role?.code;

  if (ORG_ROLES.includes(role)) {
    return 'No leads exist yet. Create the first lead using + New Lead above.';
  }

  if (role === 'supervisor') {
    return `No lead data is available for ${user?.team?.name || 'your team'}. Create the first lead or review team assignments.`;
  }

  return `No lead data is available for you${teamContext(user)}. Create the first lead, or contact your supervisor if you expect assigned leads.`;
}

export function customerListEmptyMessage(user) {
  const role = user?.role?.code;

  if (ORG_ROLES.includes(role)) {
    return 'No customers exist yet. Create the first customer by converting a qualified lead.';
  }

  if (role === 'supervisor') {
    return `No customer data is available for ${user?.team?.name || 'your team'}. Convert a qualified lead or review team assignments.`;
  }

  return `No customer data is available for you${teamContext(user)}. Convert a qualified lead, or contact your supervisor if you expect customer access.`;
}
