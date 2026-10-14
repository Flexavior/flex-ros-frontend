import React, { useEffect, useState } from 'react';
import api from '../api/client.js';
import HelpModal from '../components/HelpModal.jsx';
import { help } from '../content/helpText.js';

export default function Products() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ code: '', name: '', type: 'service', price: '' });
  const [error, setError] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchDraft, setSearchDraft] = useState('');
  const [searchApplied, setSearchApplied] = useState('');

  const load = () => {
    const params = {};
    if (searchApplied.trim()) params.search = searchApplied.trim();
    return api.get('/products-services', { params }).then((res) => setItems(res.data)).catch(() => {});
  };

  useEffect(() => { load(); }, [searchApplied]);

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

  const applySearch = () => {
    setSearchApplied(searchDraft.trim());
    setSearchOpen(false);
  };

  const clearSearch = () => {
    setSearchDraft('');
    setSearchApplied('');
    setSearchOpen(false);
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
        {searchApplied && (
          <p className="kpi-sub">
            Filter: &quot;{searchApplied}&quot;
            {' '}
            <button type="button" className="small secondary" onClick={clearSearch}>Clear</button>
          </p>
        )}
        <table>
          <thead>
            <tr>
              <th>Code</th>
              <th>
                <span className="th-with-action">
                  Name
                  <button
                    type="button"
                    className="table-search-btn"
                    aria-label="Search products by name"
                    title="Search name"
                    onClick={() => setSearchOpen(true)}
                  >
                    🔍
                  </button>
                </span>
              </th>
              <th>Type</th>
              <th>Price</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((p) => (
              <tr key={p.id}>
                <td>{p.code}</td>
                <td>{p.name}</td>
                <td>{p.type}</td>
                <td>{p.price ? `$${Number(p.price).toLocaleString()}` : '—'}</td>
                <td><button type="button" className="small danger" onClick={() => remove(p.id)}>Remove</button></td>
              </tr>
            ))}
            {!items.length && (
              <tr>
                <td colSpan={5} className="kpi-sub">
                  {searchApplied ? 'No products match your search.' : 'Catalogue empty.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <HelpModal open={searchOpen} title="Search products & services" onClose={() => setSearchOpen(false)}>
        <p className="kpi-sub">{help.productsNameSearch}</p>
        <div className="form-row">
          <label htmlFor="products-name-search">Words (3–4 recommended)</label>
          <input
            id="products-name-search"
            value={searchDraft}
            onChange={(e) => setSearchDraft(e.target.value)}
            placeholder="e.g. mobile app development"
          />
        </div>
        <p style={{ marginTop: 16, display: 'flex', gap: 8 }}>
          <button type="button" className="primary" onClick={applySearch}>Apply</button>
          <button type="button" className="secondary" onClick={clearSearch}>Clear</button>
        </p>
      </HelpModal>
    </div>
  );
}
