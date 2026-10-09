import React, { useId, useState } from 'react';

/**
 * Accessible inline help — click or focus to toggle explanation.
 */
export default function HelpIcon({ text, label = 'Help' }) {
  const [open, setOpen] = useState(false);
  const tooltipId = useId();

  if (!text) return null;

  return (
    <span className="help-icon-wrap">
      <button
        type="button"
        className="help-icon"
        aria-expanded={open}
        aria-controls={tooltipId}
        aria-label={label}
        onClick={() => setOpen((v) => !v)}
        onBlur={(e) => {
          if (!e.currentTarget.parentElement?.contains(e.relatedTarget)) {
            setOpen(false);
          }
        }}
      >
        ?
      </button>
      {open && (
        <span id={tooltipId} role="tooltip" className="help-tooltip">
          {text}
        </span>
      )}
    </span>
  );
}
