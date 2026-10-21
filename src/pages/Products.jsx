import React, { useEffect, useRef, useState } from 'react';
import api from '../api/client.js';
import ListPagination from '../components/ListPagination.jsx';
import ListTablePlaceholder from '../components/ListTablePlaceholder.jsx';
import { listMetaFromResponse } from '../utils/listPagination.js';

const MIN_NAME_SEARCH_CHARS = 3;

export default function Products() {
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState(null);
  const [form, setForm] = useState({ code: '', name: '', type: 'service', price: '' });
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState(null);
  const [nameSearchOpen, setNameSearchOpen] = useState(false);
  const [nameSearchDraft, setNameSearchDraft] = useState('');
  const [nameSearch, setNameSearch] = useState('');
  const nameSearchInputRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      const trimmed = nameSearchDraft.trim();
      if (trimmed.length === 0 || trimmed.length >= MIN_NAME_SEARCH_CHARS) {
        setNameSearch(trimmed);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [nameSearchDraft]);

  useEffect(() => {
    setPage(1);
  }, [nameSearch]);

  useEffect(() => {
    if (nameSearchOpen) nameSearchInputRef.current?.focus();
  }, [nameSearchOpen]);

  const load = () => {
    const params = { page, per_page: perPage };
    const q = nameSearch.trim();
    if (q.length >= MIN_NAME_SEARCH_CHARS) params.search = q;

    setListLoading(true);
    setListError(null);
    return api.get('/products-services', { params })
      .then((res) => {
        setItems(res.data.data || []);
        setMeta(listMetaFromResponse(res.data));
      })
      .catch((err) => {
        setListError(err.response?.data?.message || 'Failed to load catalogue.');
      })
      .finally(() => setListLoading(false));
  };

  useEffect(() => {
    load();
  }, [page, perPage, nameSearch]);

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

  const clearNameSearch = () => {
    setNameSearchDraft('');
    setNameSearch('');
    setNameSearchOpen(false);
  };

  const searchActive = nameSearch.length >= MIN_NAME_SEARCH_CHARS;

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
        <div className="table-scroll" role="region" aria-label="Products catalogue">
          <table>
            <thead>
              <tr>
                <th>Code</th>
                <th>
                  <span className="th-with-action th-name-search">
                    Name
                    <button
                      type="button"
                      className="table-search-btn"
                      aria-label={nameSearchOpen ? 'Focus name search' : 'Search by name'}
                      aria-expanded={nameSearchOpen}
                      title="Search name"
                      onClick={() => setNameSearchOpen(true)}
                    >
                      🔍
                    </button>
                    {nameSearchOpen && (
                      <span className="table-header-search-wrap">
                        <input
                          ref={nameSearchInputRef}
                          type="search"
                          className="table-header-search-input"
                          value={nameSearchDraft}
                          onChange={(e) => setNameSearchDraft(e.target.value)}
                          placeholder="3+ characters…"
                          aria-label="Filter products by name keywords"
                          autoComplete="off"
                          onKeyDown={(e) => {
                            if (e.key === 'Escape') clearNameSearch();
                          }}
                        />
                        {(nameSearchDraft || searchActive) && (
                          <button
                            type="button"
                            className="table-header-search-clear"
                            aria-label="Clear name search"
                            onClick={clearNameSearch}
                          >
                            ×
                          </button>
                        )}
                      </span>
                    )}
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
              <ListTablePlaceholder
                colSpan={5}
                loading={listLoading}
                isEmpty={!items.length}
                hasActiveFilters={searchActive}
                emptyMessage="Catalogue empty."
                filteredEmptyMessage="No products match your search."
                error={listError}
                onRetry={load}
              />
            </tbody>
          </table>
        </div>
        <ListPagination
          meta={meta}
          onPageChange={setPage}
          onPerPageChange={(n) => { setPerPage(n); setPage(1); }}
        />
      </div>
    </div>
  );
}
