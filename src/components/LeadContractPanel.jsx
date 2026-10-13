import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client.js';

/**
 * Contract sign-off: document library + customer agreements when converted.
 */
export default function LeadContractPanel({ lead, customerId }) {
  const [templates, setTemplates] = useState([]);
  const [agreements, setAgreements] = useState([]);
  const [customerProducts, setCustomerProducts] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get('/documents/templates', { params: { library: 'sales' } })
      .then((res) => {
        const rows = res.data?.data ?? res.data;
        setTemplates(Array.isArray(rows) ? rows : []);
      })
      .catch(() => setTemplates([]));
  }, []);

  useEffect(() => {
    if (!customerId) {
      setAgreements([]);
      setCustomerProducts([]);
      return;
    }
    api.get(`/customers/${customerId}`)
      .then((res) => {
        setAgreements(res.data?.customer?.agreements || []);
        setCustomerProducts(res.data?.customer?.products || []);
      })
      .catch((err) => setError(err.response?.data?.message || 'Could not load customer contract data.'));
  }, [customerId]);

  const download = async (id, name) => {
    try {
      const res = await api.get(`/documents/templates/${id}/download`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = name || 'document';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError('Download failed.');
    }
  };

  const converted = lead?.status === 'converted' && customerId;

  return (
    <div>
      {!converted && (
        <p className="kpi-sub">
          After conversion, record NDA/MoU/contract sign-off on the customer record. You can preview sales documents below.
        </p>
      )}
      {converted && (
        <p className="success-text">
          Customer linked —{' '}
          <Link to={`/customers/${customerId}`}>Open customer for full sign-off &amp; renewals</Link>
        </p>
      )}

      <h4>Sales document library</h4>
      <table>
        <thead><tr><th>Name</th><th>Updated</th><th></th></tr></thead>
        <tbody>
          {templates.map((t) => (
            <tr key={t.id}>
              <td>{t.title || t.name}</td>
              <td className="kpi-sub">{t.category || '—'}</td>
              <td><button type="button" className="small" onClick={() => download(t.id, t.title)}>Download</button></td>
            </tr>
          ))}
          {!templates.length && <tr><td colSpan={3} className="kpi-sub">No sales templates available for your role.</td></tr>}
        </tbody>
      </table>

      {converted && customerProducts.length > 0 && (
        <>
          <h4 style={{ marginTop: 16 }}>Contract products</h4>
          <table>
            <thead>
              <tr><th>Product</th><th>Agreed total</th><th>Units</th><th>Unit price</th><th>Status</th></tr>
            </thead>
            <tbody>
              {customerProducts.map((p) => (
                <tr key={p.id}>
                  <td>{p.name}</td>
                  <td>{p.pivot?.agreed_price ?? '—'}</td>
                  <td>{p.pivot?.unit ?? '—'}</td>
                  <td>{p.pivot?.unit_price ?? '—'}</td>
                  <td>{p.pivot?.status ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {converted && (
        <>
          <h4 style={{ marginTop: 16 }}>Agreements on customer</h4>
          <table>
            <thead><tr><th>Type</th><th>Title</th><th>Status</th></tr></thead>
            <tbody>
              {agreements.map((a) => (
                <tr key={a.id}>
                  <td>{String(a.type || '').toUpperCase()}</td>
                  <td>{a.title}</td>
                  <td><span className={`badge ${a.status === 'signed' ? 'approved' : 'pending'}`}>{a.status}</span></td>
                </tr>
              ))}
              {!agreements.length && <tr><td colSpan={3} className="kpi-sub">No agreements yet — add on customer page.</td></tr>}
            </tbody>
          </table>
        </>
      )}
      {error && <p className="error-text">{error}</p>}
    </div>
  );
}
