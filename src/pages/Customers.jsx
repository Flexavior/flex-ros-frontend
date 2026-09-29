import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client.js';

export default function Customers() {
  const [customers, setCustomers] = useState([]);

  useEffect(() => {
    api.get('/customers')
      .then((res) => setCustomers(res.data.data || res.data))
      .catch(() => setCustomers([]));
  }, []);

  return (
    <div>
      <h1 className="page-title">Customers / Clients</h1>
      <div className="card">
        <table>
          <thead>
            <tr><th>Client ID</th><th>Name</th><th>Company</th><th>Products</th><th>Status</th><th></th></tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.id}>
                <td><Link to={`/customers/${c.id}`}>{c.client_id}</Link></td>
                <td>{c.name}</td>
                <td>{c.company}</td>
                <td>{(c.products || []).map((p) => p.name).join(', ')}</td>
                <td><span className="badge converted">{c.status}</span></td>
                <td><Link to={`/customers/${c.id}`}>Open</Link></td>
              </tr>
            ))}
            {!customers.length && <tr><td colSpan={6} className="kpi-sub">No customers yet — convert a lead first.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
