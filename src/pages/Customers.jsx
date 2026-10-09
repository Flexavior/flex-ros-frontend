import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client.js';
import ListPagination from '../components/ListPagination.jsx';
import { customerStatusLabel, normalizeCustomerStatus } from '../utils/customerStatus.js';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);

  const load = () => {
    api.get('/customers', { params: { page, per_page: perPage } })
      .then((res) => {
        setCustomers(res.data.data || []);
        setMeta(res.data.meta || null);
      })
      .catch(() => {
        setCustomers([]);
        setMeta(null);
      });
  };

  useEffect(load, [page, perPage]);

  const statusLabel = (s) => customerStatusLabel(normalizeCustomerStatus(s));

  return (
    <div>
      <h1 className="page-title">Customers / Clients</h1>
      <div className="card">
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
              {!customers.length && <tr><td colSpan={10} className="kpi-sub">No customers yet — convert a lead first.</td></tr>}
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
