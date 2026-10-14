import React from 'react';
import HelpModal from './HelpModal.jsx';

/**
 * Success / failure modal after settings actions (server audit echoed when present).
 */
export default function SettingsResultModal({ open, type, title, message, auditLine, onClose }) {
  if (!open) return null;

  const isSuccess = type === 'success';

  return (
    <HelpModal open={open} title={title || (isSuccess ? 'Success' : 'Failed')} onClose={onClose}>
      <p className={isSuccess ? 'success-text' : 'error-text'} style={{ marginTop: 0 }}>
        {message}
      </p>
      {auditLine && (
        <p className="kpi-sub" style={{ marginTop: 12 }}>
          <strong>System log:</strong>
          {' '}
          {auditLine}
        </p>
      )}
      <p style={{ marginTop: 16 }}>
        <button type="button" className="primary" onClick={onClose}>
          OK
        </button>
      </p>
    </HelpModal>
  );
}
