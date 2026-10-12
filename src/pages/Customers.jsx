import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client.js';
import ListPagination from '../components/ListPagination.jsx';
import ListSearchInput from '../components/ListSearchInput.jsx';
import ListTablePlaceholder from '../components/ListTablePlaceholder.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { customerStatusLabel, normalizeCustomerStatus } from '../utils/customerStatus.js';
import { customerListEmptyMessage } from '../utils/crmListEmptyMessages.js';
import { listMetaFromResponse } from '../utils/listPagination.js';

export default function Customers() {
  const { user } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [searchDraft, setSearchDraft] = useState('');
  const [search, setSearch] = useState('');
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchDraft.trim()), 350);
    return () => clearTimeout(timer);
  }, [searchDraft]);

  useEffect(() => { setPage(1); }, [search]);

  const load = () => {
    const params = { page, per_page: perPage };
    const q = search.trim();
    if (q) params.q = q;

    setListLoading(true);
    setListError(null);
    api.get('/customers', { params })
      .then((res) => {
        setCustomers(res.data.data || []);
        setMeta(listMetaFromResponse(res.data));
      })
      .catch((err) => {
        setListError(err.response?.data?.message || 'Failed to load customers. Try again.');
      })
      .finally(() => setListLoading(false));
  };

  useEffect(load, [page, perPage, search]);

  const statusLabel = (s) => customerStatusLabel(normalizeCustomerStatus(s));

  return (
    <div>
      <h1 className="page-title">Customers / Clients</h1>
      <div className="card">
        <ListSearchInput
          id="customers-list-search"
          value={searchDraft}
          onChange={setSearchDraft}
          placeholder="Client ID, name, company, email, or phone"
        />
        <div className="table-scroll" role="region" aria-label="Customers list">
          <table>
            <thead>
              <tr>
                <th>Client ID</th><th>Name</th><th>Company</th><th>Email</th><th>Phone</th>
                <th>Geo</th><th>Industry</th><th>Products</th><th>Status</th><th></th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id}>
                  <td><Link to={`/customers/${c.id}`}>{c.client_id}</Link></td>
                  <td>{c.name}</td>
                  <td>{c.company || '—'}</td>
                  <td>{c.email || '—'}</td>
                  <td>{c.phone || '—'}</td>
                  <td>{c.geo_location || '—'}</td>
                  <td>{c.industry || '—'}</td>
                  <td>{(c.products || []).map((p) => p.name).join(', ') || '—'}</td>
                  <td><span className="badge converted">{statusLabel(c.status)}</span></td>
                  <td><Link to={`/customers/${c.id}`}>Open</Link></td>
                </tr>
              ))}
              <ListTablePlaceholder
                colSpan={10}
                loading={listLoading}
                isEmpty={!customers.length}
                hasActiveFilters={!!search}
                emptyMessage={customerListEmptyMessage(user)}
                filteredEmptyMessage="No customers match your search."
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
