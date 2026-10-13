import React from 'react';
import HelpModal from './HelpModal.jsx';
import MicrosoftEmailPanel from './MicrosoftEmailPanel.jsx';

/** Send-mail dialog — opened from pipeline Email control. */
export default function LeadEmailModal({ open, onClose, leadId, canSendEmail, emailHint }) {
  return (
    <HelpModal open={open} title="Send email (Microsoft 365)" onClose={onClose}>
      {!canSendEmail ? (
        <p className="error-text">{emailHint}</p>
      ) : (
        <MicrosoftEmailPanel
          sendUrl={`/leads/${leadId}/email`}
          disabled={!canSendEmail}
          returnPath={typeof window !== 'undefined' ? window.location.pathname : `/leads/${leadId}`}
          onSent={onClose}
          compact
        />
      )}
    </HelpModal>
  );
}
