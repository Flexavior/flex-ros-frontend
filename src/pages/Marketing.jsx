import React, { useEffect, useState } from 'react';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function Marketing() {
  const { user } = useAuth();
  const [channels, setChannels] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [posts, setPosts] = useState([]);
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({ name: '', channel_id: '', product_service_id: '', objective: '', budget: '' });
  const [postForm, setPostForm] = useState({ campaign_id: '', title: '', scheduled_at: '' });
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  const canApprove = ['ceo', 'senior_management', 'supervisor'].includes(user?.role?.code);

  const load = () => {
    api.get('/marketing/channels').then((res) => setChannels(res.data)).catch(() => {});
    api.get('/marketing/campaigns').then((res) => setCampaigns(res.data)).catch(() => {});
    api.get('/marketing/posts').then((res) => setPosts(res.data)).catch(() => {});
    api.get('/products-services').then((res) => setProducts(res.data)).catch(() => {});
  };

  useEffect(() => { load(); }, []);

  const submitCampaign = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      await api.post('/marketing/campaigns', {
        ...form,
        channel_id: Number(form.channel_id),
        product_service_id: form.product_service_id ? Number(form.product_service_id) : null,
        budget: form.budget || null,
      });
      setForm({ name: '', channel_id: '', product_service_id: '', objective: '', budget: '' });
      setMessage('Campaign created as draft.');
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create campaign.');
    }
  };

  const submitForApproval = async (c) => {
    await api.post(`/marketing/campaigns/${c.id}/submit`);
    load();
  };

  const decide = async (c, decision) => {
    try {
      await api.post(`/marketing/campaigns/${c.id}/decide`, { decision });
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Approval failed.');
    }
  };

  const submitPost = async (e) => {
    e.preventDefault();
    try {
      await api.post('/marketing/posts', { ...postForm, campaign_id: Number(postForm.campaign_id) });
      setPostForm({ campaign_id: '', title: '', scheduled_at: '' });
      setMessage('Post scheduled.');
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not schedule post.');
    }
  };

  const publishPost = async (p) => {
    await api.put(`/marketing/posts/${p.id}`, { status: 'published' });
    load();
  };

  return (
    <div>
      <h1 className="page-title">Digital Marketing Channels</h1>
      {message && <p className="success-text">{message}</p>}
      {error && <p className="error-text">{error}</p>}

      <form className="card" onSubmit={submitCampaign}>
        <h3>New Campaign Plan</h3>
        <div className="grid cols-5">
          <div className="form-row"><label>Name *</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
          <div className="form-row"><label>Channel *</label>
            <select value={form.channel_id} onChange={(e) => setForm({ ...form, channel_id: e.target.value })} required>
              <option value="">—</option>
              {channels.map((ch) => <option key={ch.id} value={ch.id}>{ch.name}</option>)}
            </select></div>
          <div className="form-row"><label>Product / Service</label>
            <select value={form.product_service_id} onChange={(e) => setForm({ ...form, product_service_id: e.target.value })}>
              <option value="">—</option>
              {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select></div>
          <div className="form-row"><label>Budget</label>
            <input type="number" min="0" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} /></div>
          <div className="form-row"><label>Objective</label>
            <input value={form.objective} onChange={(e) => setForm({ ...form, objective: e.target.value })} /></div>
        </div>
        <button type="submit">Create Draft Campaign</button>
      </form>

      <div className="card">
        <h3>Campaigns — plan → approve → publish</h3>
        <table>
          <thead><tr><th>Name</th><th>Channel</th><th>Status</th><th>Product</th><th>Actions</th></tr></thead>
          <tbody>
            {campaigns.map((c) => (
              <tr key={c.id}>
                <td>{c.name}</td>
                <td>{c.channel?.name}</td>
                <td><span className={`badge ${c.approval_status}`}>{c.approval_status}</span></td>
                <td>{c.product_service?.name || '—'}</td>
                <td>
                  {c.approval_status === 'draft' && <button className="small" onClick={() => submitForApproval(c)}>Submit</button>}
                  {c.approval_status === 'pending' && canApprove && (
                    <>
                      <button className="small" onClick={() => decide(c, 'approved')}>Approve</button>{' '}
                      <button className="small danger" onClick={() => decide(c, 'rejected')}>Reject</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
            {!campaigns.length && <tr><td colSpan={5} className="kpi-sub">No campaigns.</td></tr>}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h3>Posting Schedule</h3>
        <form onSubmit={submitPost} className="grid cols-4" style={{ alignItems: 'end' }}>
          <div className="form-row"><label>Campaign *</label>
            <select value={postForm.campaign_id} onChange={(e) => setPostForm({ ...postForm, campaign_id: e.target.value })} required>
              <option value="">—</option>
              {campaigns.filter((c) => c.approval_status === 'approved').map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select></div>
          <div className="form-row"><label>Post title *</label>
            <input value={postForm.title} onChange={(e) => setPostForm({ ...postForm, title: e.target.value })} required /></div>
          <div className="form-row"><label>Schedule at</label>
            <input type="datetime-local" value={postForm.scheduled_at} onChange={(e) => setPostForm({ ...postForm, scheduled_at: e.target.value })} /></div>
          <div className="form-row"><button type="submit">Schedule Post</button></div>
        </form>
        <table style={{ marginTop: 12 }}>
          <thead><tr><th>Title</th><th>Campaign</th><th>Scheduled</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {posts.map((p) => (
              <tr key={p.id}>
                <td>{p.title}</td>
                <td>{p.campaign?.name}</td>
                <td>{p.scheduled_at ? new Date(p.scheduled_at).toLocaleString() : '—'}</td>
                <td><span className={`badge ${p.status === 'published' ? 'approved' : 'pending'}`}>{p.status}</span></td>
                <td>{p.status === 'scheduled' && <button className="small" onClick={() => publishPost(p)}>Publish</button>}</td>
              </tr>
            ))}
            {!posts.length && <tr><td colSpan={5} className="kpi-sub">Nothing scheduled.</td></tr>}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h3>Channels</h3>
        <p className="kpi-sub">{channels.map((ch) => ch.name).join(' · ') || 'No channels registered.'}</p>
      </div>
    </div>
  );
}
