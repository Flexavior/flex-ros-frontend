import React, { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';

/**
 * Enterprise help dialog — full readable copy, keyboard and focus trap friendly.
 */
export default function HelpModal({ open, title, children, onClose }) {
  const titleId = useId();
  const modalRef = useRef(null);
  const closeRef = useRef(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return undefined;
    const prev = document.activeElement;
    const focusTarget =
      modalRef.current?.querySelector('[autofocus], input, textarea, select') ?? closeRef.current;
    focusTarget?.focus();
    const onKey = (e) => {
      if (e.key === 'Escape') onCloseRef.current();
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      if (prev && typeof prev.focus === 'function') prev.focus();
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div className="help-modal-overlay" role="presentation" onClick={onClose}>
      <div
        ref={modalRef}
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
            className="help-modal-close"
            onClick={() => onCloseRef.current()}
            aria-label="Close"
          >
            ×
          </button>
        </header>
        <div className="help-modal-body">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
