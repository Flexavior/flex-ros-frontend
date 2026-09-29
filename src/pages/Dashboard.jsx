import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client.js';

export default function Dashboard() {
  const [metrics, setMetrics] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get('/dashboard/metrics')
      .then((res) => setMetrics(res.data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load metrics.'));
  }, []);

  if (error) return <div className="card"><p className="error-text">{error}</p></div>;
  if (!metrics) return <div className="card">Loading dashboard…</div>;

  const stale = metrics.stale_tasks || {};

  return (
    <div>
      <h1 className="page-title">CRM Dashboard</h1>

      <div className="grid cols-4">
        <div className="card kpi">
          <div className="kpi-label">Conversion Rate</div>
          <div className="kpi-value">{metrics.conversion_rate}%</div>
          <div className="kpi-sub">{metrics.leads?.converted} converted of {metrics.leads?.total} leads</div>
        </div>
        <div className="card kpi">
          <div className="kpi-label">Open Leads</div>
          <div className="kpi-value">{metrics.leads?.open}</div>
          <div className="kpi-sub">in pipeline</div>
        </div>
        <div className="card kpi">
          <div className="kpi-label">Stale Tasks</div>
          <div className="kpi-value">{stale.count ?? 0}</div>
          <div className="kpi-sub">no change for {stale.threshold_days}+ days</div>
        </div>
        <div className="card kpi">
          <div className="kpi-label">Appointments (7d)</div>
          <div className="kpi-value">{metrics.appointments_this_week}</div>
          <div className="kpi-sub">scheduled</div>
        </div>
      </div>

      <div className="grid cols-2">
        <div className="card">
          <h3>Pipeline Funnel</h3>
          <table>
            <tbody>
              {Object.entries(metrics.funnel || {}).map(([status, count]) => (
                <tr key={status}>
                  <td><span className={`badge ${status}`}>{status}</span></td>
                  <td>{count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          <h3>Checklist Completion</h3>
          <div className="kpi-value">{metrics.checklist?.percent ?? 0}%</div>
          <div className="progress-bar" style={{ marginBottom: 8 }}>
            <div style={{ width: `${metrics.checklist?.percent ?? 0}%` }} />
          </div>
          <p className="kpi-sub">{metrics.checklist?.done_items} of {metrics.checklist?.total_items} items completed</p>
          <h3 style={{ marginTop: 16 }}>Marketing Campaigns</h3>
          <table>
            <tbody>
              {Object.entries(metrics.marketing?.campaigns || {}).map(([status, count]) => (
                <tr key={status}>
                  <td><span className={`badge ${status}`}>{status}</span></td>
                  <td>{count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <h3>Stale Tasks — action needed (no change ≥ {stale.threshold_days} days)</h3>
        {stale.items?.length ? (
          <table>
            <thead>
              <tr><th>Lead</th><th>Company</th><th>Status</th><th>Days no change</th><th></th></tr>
            </thead>
            <tbody>
              {stale.items.map((l) => (
                <tr key={l.id}>
                  <td>{l.name}</td>
                  <td>{l.company}</td>
                  <td><span className={`badge ${l.status}`}>{l.status}</span></td>
                  <td><span className="badge stale">{l.days_no_change}d</span></td>
                  <td><Link to={`/leads/${l.id}`}>Open</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="kpi-sub">No stale tasks. Everything is moving.</p>
        )}
      </div>
    </div>
  );
}
