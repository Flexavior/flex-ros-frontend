/** In-app help copy — keep concise; full journey in docs/10-Lead-Pipeline-User-Journey.md */

export const help = {
  leadsOverview:
    'Scoped list of leads you may access. Use filters, then open a row for follow-up, stage changes, and conversion.',
  leadGeneration:
    'Capture a new prospect: name, source, stage, and any custom fields. The creator becomes owner unless a supervisor assigns otherwise.',
  leadPipelineStage:
    'Current stage reflects pipeline position. Changing stage updates the stale-task clock and reporting funnel.',
  leadFollowUp:
    'Log each touch (call, message, meeting). Outcome and next follow-up date reset the “no change” stale alert on the dashboard.',
  leadStale:
    'If stage or engagement is unchanged longer than the system threshold (Settings), the lead appears as stale on the dashboard.',
  leadCustomFields:
    'Extra columns come from CRM field definitions (admin/DB). Values are stored per lead in custom_fields JSON.',
  ssoProvisioning:
    'Microsoft SSO creates users with the Staff role until Senior Management assigns Sales, Marketing, or Customer Service.',
  reverbInbox:
    'Laravel Reverb pushes live inbox updates (new messages, sync) to the Inbox page only—not lead pipeline events. Email uses Microsoft Graph, not Reverb.',
  adminConsole:
    'Operational snapshot: users awaiting assignment, SSO toggles, and realtime (Reverb) status. Deep config lives under System Settings.',
};
