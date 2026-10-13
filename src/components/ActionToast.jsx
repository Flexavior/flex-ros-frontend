import React, { useEffect } from 'react';

/**
 * Fixed pop-up for save / submit outcomes (success or user-facing error).
 */
export default function ActionToast({ feedback, onDismiss, busy }) {
  useEffect(() => {
    if (!feedback || feedback.type === 'error') return undefined;
    const t = setTimeout(() => onDismiss?.(), 4000);
    return () => clearTimeout(t);
  }, [feedback, onDismiss]);

  return (
    <>
      {busy && (
        <div className="action-busy-bar" role="status" aria-live="polite">
          Working…
        </div>
      )}
      {feedback && (
        <div
          className={`action-toast action-toast-${feedback.type}`}
          role="alert"
          aria-live="assertive"
        >
          <strong>{feedback.type === 'success' ? 'Success' : 'Failed'}</strong>
          <span>{feedback.message}</span>
          <button type="button" className="secondary small action-toast-close" onClick={onDismiss} aria-label="Dismiss">
            ×
          </button>
        </div>
      )}
    </>
  );
}
