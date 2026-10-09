import React from 'react';

/**
 * Laravel paginator meta: current_page, last_page, per_page, total, from, to
 */
export default function ListPagination({ meta, onPageChange, onPerPageChange }) {
  if (!meta || meta.total === 0) return null;

  const page = meta.current_page ?? 1;
  const last = meta.last_page ?? 1;
  const perPage = meta.per_page ?? 25;

  return (
    <div className="list-pagination" style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12, flexWrap: 'wrap' }}>
      <span className="kpi-sub">
        Showing {meta.from ?? 0}–{meta.to ?? 0} of {meta.total}
      </span>
      <label className="kpi-sub" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        Per page
        <select value={perPage} onChange={(e) => onPerPageChange(Number(e.target.value))}>
          {[25, 50].map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
      </label>
      <button type="button" className="secondary small" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
        Previous
      </button>
      <span className="kpi-sub">Page {page} / {last}</span>
      <button type="button" className="secondary small" disabled={page >= last} onClick={() => onPageChange(page + 1)}>
        Next
      </button>
    </div>
  );
}
