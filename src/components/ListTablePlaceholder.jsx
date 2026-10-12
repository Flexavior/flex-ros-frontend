import React from 'react';

/**
 * Single tbody row for paginated lists: spinner while fetching, empty copy only after fetch completes.
 */
export default function ListTablePlaceholder({
  colSpan,
  loading,
  isEmpty,
  emptyMessage,
  filteredEmptyMessage = 'No results match your search or filters.',
  hasActiveFilters = false,
  error = null,
  onRetry = null,
}) {
  if (!loading && !error && !isEmpty) {
    return null;
  }

  if (loading) {
    return (
      <tr>
        <td colSpan={colSpan} className="list-table-state">
          <div className="list-loading" role="status" aria-live="polite" aria-busy="true">
            <span className="list-loading-mark-frame" aria-hidden="true">
              <img className="list-loading-mark" src="/mss-loading-mark.jpg" alt="" />
            </span>
            <span className="kpi-sub">Loading…</span>
          </div>
        </td>
      </tr>
    );
  }

  if (error) {
    return (
      <tr>
        <td colSpan={colSpan} className="list-table-state">
          <div role="alert">
            <p className="error-text">{error}</p>
            {onRetry && <button type="button" className="secondary small" onClick={onRetry}>Try again</button>}
          </div>
        </td>
      </tr>
    );
  }

  const message = hasActiveFilters ? filteredEmptyMessage : emptyMessage;

  return (
    <tr>
      <td colSpan={colSpan} className="kpi-sub list-table-state">{message}</td>
    </tr>
  );
}
