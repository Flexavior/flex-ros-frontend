import React, { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';

/**
 * Enterprise help dialog — full readable copy, keyboard and focus trap friendly.
 */
export default function HelpModal({ open, title, children, onClose }) {
  const titleId = useId();
  const closeRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const prev = document.activeElement;
    closeRef.current?.focus();
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      if (prev && typeof prev.focus === 'function') prev.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="help-modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="help-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="help-modal-header">
          <h2 id={titleId} className="help-modal-title">{title}</h2>
          <button
            ref={closeRef}
            type="button"
            className="help-modal-close secondary small"
            onClick={onClose}
            aria-label="Close help"
          >
            Close
          </button>
        </header>
        <div className="help-modal-body">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
