import React from 'react';

/**
 * Left rail: rep actions + contact snapshot (desktop); stacks on mobile.
 */
export default function LeadDetailActionRail({
  lead,
  contacts,
  onEmailClick,
  onJumpToSection,
  canSendEmail,
  emailHint,
}) {
  const primary = (contacts || []).find((c) => c.is_primary) || (contacts || [])[0];

  return (
    <aside className="lead-detail-rail" aria-label="Lead actions">
      <div className="lead-detail-rail-card">
        <h4 className="lead-detail-rail-title">Your actions</h4>
        <div className="lead-detail-rail-actions">
          <button
            type="button"
            className="lead-detail-rail-btn lead-detail-rail-btn-primary"
            onClick={onEmailClick}
            title={emailHint}
          >
            ✉ Email
          </button>
          <button
            type="button"
            className="secondary small lead-detail-rail-btn"
            onClick={() => onJumpToSection('lead-section-qualify')}
          >
            Log follow-up
          </button>
        </div>
        {!canSendEmail && (
          <p className="kpi-sub">{emailHint}</p>
        )}
      </div>

      {lead?.needs_qualify_review && (
        <div className="lead-detail-rail-card lead-detail-rail-alert">
          <strong>Qualify review</strong>
          <p className="kpi-sub">{lead.idle_touch_count} idle touches — add a progress outcome.</p>
        </div>
      )}

      <div className="lead-detail-rail-card">
        <h4 className="lead-detail-rail-title">Reach</h4>
        <p className="lead-detail-rail-line"><strong>Phone:</strong> {lead?.phone || '—'}</p>
        <p className="lead-detail-rail-line"><strong>Email:</strong> {lead?.email || primary?.email || '—'}</p>
        {primary && (
          <p className="lead-detail-rail-line">
            <strong>Primary:</strong> {primary.name || '—'}
            {primary.role ? ` · ${primary.role}` : ''}
          </p>
        )}
        <button
          type="button"
          className="secondary small"
          style={{ marginTop: 8, width: '100%' }}
          onClick={() => onJumpToSection('lead-section-qualify')}
        >
          Edit contacts
        </button>
      </div>
    </aside>
  );
}
