import React, { useState } from 'react';
import HelpModal from './HelpModal.jsx';

/**
 * Opens full help copy in a modal (not a clipped tooltip).
 */
export default function HelpIcon({ text, title, label = 'Help' }) {
  const [open, setOpen] = useState(false);

  if (!text) return null;

  const modalTitle = title || label.replace(/^Help:\s*/i, '') || 'Help';

  return (
    <>
      <span className="help-icon-wrap">
        <button
          type="button"
          className="help-icon"
          aria-haspopup="dialog"
          aria-label={label}
          onClick={() => setOpen(true)}
        >
          ?
        </button>
      </span>
      <HelpModal open={open} title={modalTitle} onClose={() => setOpen(false)}>
        <p className="help-modal-text">{text}</p>
      </HelpModal>
    </>
  );
}
