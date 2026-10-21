import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client.js';
import { createAppEcho } from '../api/echo.js';
import RefreshIconButton from '../components/RefreshIconButton.jsx';
import DashboardActionCenter from '../components/DashboardActionCenter.jsx';

function Trend({ comparison }) {
  if (!comparison) return null;
  const delta = Number(comparison.delta_pct || 0);
  const direction = delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat';
  return (
    <span className={`dashboard-trend ${direction}`}>
      {delta > 0 ? '↑' : delta < 0 ? '↓' : '→'} {Math.abs(delta).toLocaleString()}%
    </span>
  );
}

function TrendKpi({ label, value, sub, qoq, yoy }) {
  return (
    <div className="card kpi dashboard-kpi">
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
      <div className="dashboard-trend-row">
        <span>QoQ <Trend comparison={qoq} /></span>
        <span>YoY <Trend comparison={yoy} /></span>
      </div>
      {sub && <div className="kpi-sub">{sub}</div>}
    </div>
  );
}

function DashboardSection({ title, children, className = '' }) {
  return (
    <section className={`card dashboard-section ${className}`}>
      <h3>{title}</h3>
      {children}
    </section>
  );
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 2 });
}

export default function Dashboard() {
  const [metrics, setMetrics] = useState(null);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const refreshTimerRef = useRef(null);

  const loadMetrics = useCallback(() => {
    setRefreshing(true);
    setError(null);
    return api.get('/dashboard/metrics')
      .then((res) => setMetrics(res.data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load metrics.'))
      .finally(() => setRefreshing(false));
  }, []);

  const scheduleRefresh = useCallback(() => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    refreshTimerRef.current = setTimeout(() => {
      loadMetrics();
    }, 400);
  }, [loadMetrics]);

  useEffect(() => {
    loadMetrics();
    return () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    };
  }, [loadMetrics]);

  useEffect(() => {
    const echo = createAppEcho();
    if (!echo) {
      return undefined;
    }

    const channel = echo.private('crm-dashboard');
    channel.listen('.updated', () => {
      scheduleRefresh();
    });

    return () => {
      channel.stopListening('.updated');
      echo.disconnect();
    };
  }, [scheduleRefresh]);

  if (error && !metrics) {
    return (
      <div className="card">
        <p className="error-text">{error}</p>
        <button type="button" onClick={loadMetrics}>Try again</button>
      </div>
    );
  }
  if (!metrics) return <div className="card">Loading dashboard…</div>;

  const stale = metrics.stale_tasks || {};
  const sections = new Set(metrics.sections || ['actions', 'kpis', 'mql_sql', 'revenue', 'rep_activity', 'funnel', 'marketing', 'checklist']);
  const qoq = metrics.comparisons?.qoq || {};
  const yoy = metrics.comparisons?.yoy || {};
  const actionItems = metrics.action_items || [];
  const canOpenLeads = !['marketing', 'customer_service'].includes(metrics.persona);

  return (
    <div className="dashboard-page">
      <div className="dashboard-heading">
        <h1 className="page-title">CRM Dashboard</h1>
        <RefreshIconButton
          loading={refreshing}
          onClick={loadMetrics}
          ariaLabel="Refresh dashboard"
          title="Refresh dashboard"
        />
      </div>
      {error && <p className="error-text">{error}</p>}

      {sections.has('actions') && (
        <DashboardActionCenter items={actionItems} />
      )}

      {sections.has('kpis') && (
        <div className="grid cols-4 dashboard-kpi-grid">
          <TrendKpi
            label="Leads created (QTD)"
            value={qoq.leads_created?.current ?? 0}
            qoq={qoq.leads_created}
            yoy={yoy.leads_created}
            sub={`${metrics.leads?.open ?? 0} open`}
          />
          <TrendKpi
            label="Converted leads (QTD)"
            value={qoq.converted_leads?.current ?? 0}
            qoq={qoq.converted_leads}
            yoy={yoy.converted_leads}
            sub={`${metrics.conversion_rate ?? 0}% conversion`}
          />
          <TrendKpi
            label="Activities (QTD)"
            value={qoq.activity_total?.current ?? 0}
            qoq={qoq.activity_total}
            yoy={yoy.activity_total}
            sub={`${metrics.rep_activity_this_week?.reduce((sum, rep) => sum + rep.activity_count, 0) || 0} this week`}
          />
          <div className="card kpi dashboard-kpi">
            <div className="kpi-label">Attention needed</div>
            <div className="kpi-value">{stale.count ?? 0}</div>
            <div className="kpi-sub">{metrics.appointments_this_week ?? 0} appointments (7d)</div>
          </div>
        </div>
      )}

      <div className="grid cols-2 dashboard-content-grid">
        {sections.has('mql_sql') && (
          <DashboardSection title="MQL → SQL pipeline ratio">
            <div className="dashboard-ratio">
              <div className="kpi-value">{metrics.mql_sql?.ratio_pct ?? 0}%</div>
              <p>{metrics.mql_sql?.sql ?? 0} SQL / {metrics.mql_sql?.mql ?? 0} MQL (QTD)</p>
              <div className="dashboard-trend-row">
                <span>MQL QoQ <Trend comparison={qoq.mql} /></span>
                <span>MQL YoY <Trend comparison={yoy.mql} /></span>
                <span>SQL QoQ <Trend comparison={qoq.sql} /></span>
                <span>SQL YoY <Trend comparison={yoy.sql} /></span>
              </div>
            </div>
          </DashboardSection>
        )}

        {sections.has('revenue') && (
          <DashboardSection title="Revenue-generating metrics">
            <div className="dashboard-revenue-grid">
              <div>
                <div className="kpi-label">Signed agreement value (QTD)</div>
                <div className="kpi-value">{formatNumber(metrics.revenue?.signed?.amount)}</div>
                <div className="kpi-sub">{metrics.revenue?.signed?.count ?? 0} signed</div>
                <div className="dashboard-trend-row">
                  <span>QoQ <Trend comparison={qoq.signed_revenue} /></span>
                  <span>YoY <Trend comparison={yoy.signed_revenue} /></span>
                </div>
              </div>
              <div>
                <div className="kpi-label">Pipeline opportunities</div>
                <div className="kpi-value">{metrics.revenue?.pipeline?.lead_count ?? 0}</div>
              </div>
            </div>
          </DashboardSection>
        )}

        {sections.has('rep_activity') && (
          <DashboardSection title="Activities per rep — this week">
            {(metrics.rep_activity_this_week || []).length ? (
              <table>
                <thead><tr><th>Representative</th><th>Total activities</th></tr></thead>
                <tbody>
                  {metrics.rep_activity_this_week.map((rep) => (
                    <tr key={rep.user_id}><td>{rep.name}</td><td>{rep.activity_count}</td></tr>
                  ))}
                </tbody>
              </table>
            ) : <p className="kpi-sub">No activities recorded this week.</p>}
          </DashboardSection>
        )}

        {sections.has('funnel') && (
          <DashboardSection title="Pipeline funnel">
          <table>
            <thead>
              <tr>
                <th scope="col">Stage</th>
                <th scope="col">Leads</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(metrics.funnel || {}).map(([stage, count]) => (
                <tr key={stage}>
                  <td>
                    {canOpenLeads ? (
                      <Link to={stage === 'Unstaged' ? '/leads' : `/leads?stage=${encodeURIComponent(stage)}`}>
                        <span className="badge pending">{stage}</span>
                      </Link>
                    ) : <span className="badge pending">{stage}</span>}
                  </td>
                  <td>{count}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </DashboardSection>
        )}

        {sections.has('checklist') && (
          <DashboardSection title="Checklist completion">
          <div className="kpi-value">{metrics.checklist?.percent ?? 0}%</div>
          <div className="progress-bar" style={{ marginBottom: 8 }}>
            <div style={{ width: `${metrics.checklist?.percent ?? 0}%` }} />
          </div>
          <p className="kpi-sub">{metrics.checklist?.done_items} / {metrics.checklist?.total_items}</p>
          </DashboardSection>
        )}

        {sections.has('marketing') && (
          <DashboardSection title="Marketing campaigns">
          <table>
            <thead>
              <tr>
                <th scope="col">Status</th>
                <th scope="col">Count</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(metrics.marketing?.campaigns || {}).map(([status, count]) => (
                <tr key={status}>
                  <td><span className={`badge ${status}`}>{status}</span></td>
                  <td>{count}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <Link to="/marketing">Open Marketing</Link>
          </DashboardSection>
        )}
      </div>
    </div>
  );
}
