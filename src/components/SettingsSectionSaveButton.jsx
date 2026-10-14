import React from 'react';

function SaveIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5 5h11l3 3v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path d="M7 5v4h8V5M7 19h10" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

export default function SettingsSectionSaveButton({ onClick, disabled, label = 'Save section' }) {
  return (
    <button
      type="button"
      className="secondary settings-section-save"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
    >
      <SaveIcon />
    </button>
  );
}
