import React from 'react';

/**
 * Manual refresh control — visible ↻ only; label via aria-label / title (not the word "Refresh" in the button face).
 */
export default function RefreshIconButton({
  onClick,
  disabled = false,
  loading = false,
  ariaLabel = 'Refresh',
  title = 'Refresh',
  className = '',
}) {
  return (
    <button
      type="button"
      className={`icon-refresh-btn secondary ${loading ? 'icon-refresh-btn-busy' : ''} ${className}`.trim()}
      onClick={onClick}
      disabled={disabled || loading}
      aria-label={loading ? 'Refreshing' : ariaLabel}
      title={title}
    >
      <span aria-hidden="true">{loading ? '…' : '↻'}</span>
    </button>
  );
}
