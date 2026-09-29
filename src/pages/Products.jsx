import React, { useEffect, useState } from 'react';
import api from '../api/client.js';

export default function Products() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ code: '', name: '', type: 'service', price: '' });
  const [error, setError] = useState(null);

  const load = () => api.get('/products-services').then((res) => setItems(res.data)).catch(() => {});
  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      await api.post('/products-services', { ...form, price: form.price || null });
      setForm({ code: '', name: '', type: 'service', price: '' });
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save.');
    }
  };

  const remove = async (id) => {
    await api.delete(`/products-services/${id}`);
    load();
  };

  return (
    <div>
      <h1 className="page-title">Products &amp; Services Catalogue</h1>
      <form className="card" onSubmit={submit}>
        <div className="grid cols-4">
          <div className="form-row"><label>Code *</label>
            <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required /></div>
          <div className="form-row"><label>Name *</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
          <div className="form-row"><label>Type</label>
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              <option value="service">Service</option><option value="product">Product</option>
            </select></div>
          <div className="form-row"><label>Price</label>
            <input type="number" step="0.01" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></div>
        </div>
        {error && <p className="error-text">{error}</p>}
        <button type="submit">Add to catalogue</button>
      </form>

      <div className="card">
        <table>
          <thead><tr><th>Code</th><th>Name</th><th>Type</th><th>Price</th><th></th></tr></thead>
          <tbody>
            {items.map((p) => (
              <tr key={p.id}>
                <td>{p.code}</td>
                <td>{p.name}</td>
                <td>{p.type}</td>
                <td>{p.price ? `$${Number(p.price).toLocaleString()}` : '—'}</td>
                <td><button className="small danger" onClick={() => remove(p.id)}>Remove</button></td>
              </tr>
            ))}
            {!items.length && <tr><td colSpan={5} className="kpi-sub">Catalogue empty.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
