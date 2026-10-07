import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../api/client.js';
import { createInboxEcho } from '../api/echo.js';

const CHANNELS = ['facebook', 'viber', 'line', 'outlook'];
const STATUSES = ['unassigned', 'open', 'pending', 'closed'];
const INBOX_MANAGER_ROLES = ['supervisor', 'senior_management', 'ceo', 'admin'];

const channelLabel = (ch) => ({ facebook: 'Facebook', viber: 'Viber', line: 'LINE', outlook: 'Outlook' }[ch] || ch);

export default function Inbox() {
  const { user } = useAuth();
  const isManager = INBOX_MANAGER_ROLES.includes(user?.role?.code);

  const [stats, setStats] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [thread, setThread] = useState(null);
  const [filters, setFilters] = useState({ channel: '', status: '', owner: '' });
  const [replyText, setReplyText] = useState('');
  const [assignUserId, setAssignUserId] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const loadList = useCallback(() => {
    const params = {};
    if (filters.channel) params.channel = filters.channel;
    if (filters.status) params.status = filters.status;
    if (filters.owner) params.owner = filters.owner;

    api.get('/inbox/conversations', { params })
      .then((res) => setConversations(res.data.data || res.data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load inbox.'));
  }, [filters]);

  const loadStats = useCallback(() => {
    api.get('/inbox/stats')
      .then((res) => setStats(res.data))
      .catch(() => {});
  }, []);

  const loadThread = useCallback((id) => {
    if (!id) return;
    api.get(`/inbox/conversations/${id}`)
      .then((res) => setThread(res.data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load conversation.'));
  }, []);

  useEffect(() => { loadList(); loadStats(); }, [loadList, loadStats]);
  useEffect(() => { loadThread(selectedId); }, [selectedId, loadThread]);

  const selectedIdRef = useRef(selectedId);
  selectedIdRef.current = selectedId;

  useEffect(() => {
    const echo = createInboxEcho();
    if (!echo) {
      return undefined;
    }

    const channel = echo.private('inbox');
    channel.listen('.updated', (payload) => {
      loadList();
      loadStats();
      const current = selectedIdRef.current;
      const convId = payload?.conversation_id;
      const reason = payload?.reason;
      if (reason === 'sync' || (current && convId === current)) {
        if (current) {
          loadThread(current);
        }
      }
    });

    return () => {
      channel.stopListening('.updated');
      echo.disconnect();
    };
  }, [loadList, loadStats, loadThread]);

  const refresh = () => { loadList(); loadStats(); if (selectedId) loadThread(selectedId); };

  const act = async (fn) => {
    setError(null);
    setBusy(true);
    try {
      await fn();
      refresh();
    } catch (err) {
      setError(err.response?.data?.message || 'Action failed.');
    } finally {
      setBusy(false);
    }
  };

  const claim = () => act(() => api.post(`/inbox/conversations/${selectedId}/claim`));
  const release = () => act(() => api.post(`/inbox/conversations/${selectedId}/release`));
  const assign = () => act(() => api.post(`/inbox/conversations/${selectedId}/assign`, { user_id: Number(assignUserId) }));
  const reply = (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    act(async () => {
      await api.post(`/inbox/conversations/${selectedId}/reply`, { text: replyText.trim() });
      setReplyText('');
    });
  };
  const closeConv = () => act(() => api.put(`/inbox/conversations/${selectedId}/status`, { status: 'closed' }));
  const syncGateway = () => act(() => api.post('/inbox/sync', { messages: true }));

  const conv = thread?.conversation;
  const agents = thread?.available_agents || [];
  const isOwner = conv?.owner_id === user?.id;
  const canReply = isOwner || isManager;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h1 className="page-title">Inbox</h1>
        {isManager && (
          <button className="secondary" onClick={syncGateway} disabled={busy}>Sync from ConvyMes</button>
        )}
      </div>

      {stats && (
        <div className="grid cols-4" style={{ marginBottom: '1rem' }}>
          <div className="card kpi"><div className="kpi-value">{stats.total}</div><div className="kpi-sub">Total</div></div>
          <div className="card kpi"><div className="kpi-value">{stats.unassigned}</div><div className="kpi-sub">Unassigned</div></div>
          <div className="card kpi"><div className="kpi-value">{stats.mine}</div><div className="kpi-sub">Mine</div></div>
          <div className="card kpi"><div className="kpi-value">{stats.closed}</div><div className="kpi-sub">Closed</div></div>
        </div>
      )}

      {error && <p className="error-text">{error}</p>}

      <div className="inbox-layout">
        <div className="inbox-list card">
          <div className="inbox-filters">
            <select value={filters.channel} onChange={(e) => setFilters({ ...filters, channel: e.target.value })}>
              <option value="">All channels</option>
              {CHANNELS.map((c) => <option key={c} value={c}>{channelLabel(c)}</option>)}
            </select>
            <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
              <option value="">All statuses</option>
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={filters.owner} onChange={(e) => setFilters({ ...filters, owner: e.target.value })}>
              <option value="">All owners</option>
              <option value="unassigned">Unassigned</option>
              <option value="me">Mine</option>
            </select>
          </div>

          <ul className="inbox-conv-list">
            {conversations.map((c) => (
              <li
                key={c.id}
                className={`inbox-conv-item${selectedId === c.id ? ' active' : ''}${c.unread_count ? ' unread' : ''}`}
                onClick={() => setSelectedId(c.id)}
              >
                <div className="inbox-conv-header">
                  <span className={`badge channel-${c.channel}`}>{channelLabel(c.channel)}</span>
                  <span className={`badge ${c.status}`}>{c.status}</span>
                </div>
                <strong>{c.customer_name || c.customer_ref || 'Unknown'}</strong>
                <div className="kpi-sub">
                  {c.owner?.name || 'Unassigned'}
                  {c.last_message_at && ` · ${new Date(c.last_message_at).toLocaleString()}`}
                </div>
              </li>
            ))}
            {!conversations.length && <li className="kpi-sub" style={{ padding: '1rem' }}>No conversations yet.</li>}
          </ul>
        </div>

        <div className="inbox-thread card">
          {!conv ? (
            <p className="kpi-sub">Select a conversation to view the thread.</p>
          ) : (
            <>
              <div className="inbox-thread-header">
                <div>
                  <h2>{conv.customer_name || conv.customer_ref || 'Customer'}</h2>
                  <p className="kpi-sub">
                    <span className={`badge channel-${conv.channel}`}>{channelLabel(conv.channel)}</span>
                    {' '}
                    <span className={`badge ${conv.status}`}>{conv.status}</span>
                    {' · '}
                    Owner: {conv.owner?.name || 'Unassigned'}
                  </p>
                </div>
                <div className="inbox-actions">
                  {conv.status !== 'closed' && !conv.owner_id && (
                    <button onClick={claim} disabled={busy}>Claim</button>
                  )}
                  {conv.owner_id && (isOwner || isManager) && conv.status !== 'closed' && (
                    <button className="secondary" onClick={release} disabled={busy}>Release</button>
                  )}
                  {isManager && conv.status !== 'closed' && (
                    <>
                      <select value={assignUserId} onChange={(e) => setAssignUserId(e.target.value)}>
                        <option value="">Assign to…</option>
                        {agents.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                      </select>
                      <button className="secondary" onClick={assign} disabled={busy || !assignUserId}>Assign</button>
                    </>
                  )}
                  {canReply && conv.status !== 'closed' && (
                    <button className="secondary" onClick={closeConv} disabled={busy}>Close</button>
                  )}
                </div>
              </div>

              <div className="inbox-messages">
                {(conv.messages || []).map((m) => (
                  <div key={m.id} className={`inbox-msg ${m.direction}`}>
                    <div className="inbox-msg-meta">
                      {m.direction === 'out' ? (m.sent_by?.name || 'Agent') : (m.sender_name || 'Customer')}
                      {' · '}
                      {m.sent_at ? new Date(m.sent_at).toLocaleString() : ''}
                    </div>
                    <div className="inbox-msg-body">{m.body}</div>
                  </div>
                ))}
                {!conv.messages?.length && <p className="kpi-sub">No messages yet.</p>}
              </div>

              {canReply && conv.status !== 'closed' && (
                <form className="inbox-reply" onSubmit={reply}>
                  <textarea
                    rows={3}
                    placeholder="Type a reply…"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    disabled={busy}
                  />
                  <button type="submit" disabled={busy || !replyText.trim()}>Send</button>
                </form>
              )}

              {thread?.ownership_history?.length > 0 && (
                <details className="inbox-history">
                  <summary>Ownership history</summary>
                  <ul>
                    {thread.ownership_history.map((ev) => (
                      <li key={ev.id}>
                        <strong>{ev.type}</strong>
                        {ev.actor && ` by ${ev.actor.name}`}
                        {ev.to_owner && ` → ${ev.to_owner.name}`}
                        {' · '}
                        {new Date(ev.created_at).toLocaleString()}
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
