import React, { useId, useState } from 'react';
import { Link } from 'react-router-dom';

function actionHint(item) {
  if (item.meta?.days_no_change != null) {
    return `${item.meta.days_no_change}d idle`;
  }
  if (item.meta?.idle_touch_count != null) {
    return `${item.meta.idle_touch_count} idle touches`;
  }
  if (item.meta?.scheduled_at) {
    return new Date(item.meta.scheduled_at).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' });
  }
  if (item.meta?.status) {
    return item.meta.status;
  }
  return null;
}

export default function DashboardActionCenter({ items = [] }) {
  const [open, setOpen] = useState(false);
  const listId = useId();
  const count = items.length;

  return (
    <section className="card dashboard-section dashboard-actions-compact">
      <div className="dashboard-action-center-header">
        <h3 className="dashboard-action-center-title">Action center</h3>
        <button
          type="button"
          className="dashboard-action-count-btn"
          aria-expanded={open}
          aria-controls={listId}
          disabled={count === 0}
          onClick={() => setOpen((v) => !v)}
          title={count === 0 ? 'No actions' : open ? 'Hide action list' : 'Show action list'}
        >
          <span className="dashboard-action-count" aria-label={`${count} actions`}>{count}</span>
        </button>
      </div>

      {open && count > 0 && (
        <div id={listId} className="table-scroll">
          <table className="dashboard-action-table">
            <thead>
              <tr>
                <th scope="col">Lead / item</th>
                <th scope="col">Assignee</th>
                <th scope="col">Type</th>
                <th scope="col" aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const hint = actionHint(item);
                return (
                  <tr key={item.id} className={`dashboard-action-row priority-${item.priority}`}>
                    <td>
                      <strong>{item.entity_label || item.title}</strong>
                      {hint && <div className="kpi-sub">{hint}</div>}
                    </td>
                    <td>{item.assignee_name || '—'}</td>
                    <td><span className="badge pending">{item.kind.replaceAll('_', ' ')}</span></td>
                    <td>
                      <Link className="dashboard-details-link" to={item.route}>Open</Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {open && count === 0 && (
        <p className="kpi-sub">No priority actions in your current scope.</p>
      )}
    </section>
  );
}
