import React, { useEffect, useState } from 'react';
import api from '../api/client.js';

export default function Documents() {
  const [templates, setTemplates] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get('/documents/templates')
      .then((res) => setTemplates(res.data.data || []))
      .catch((err) => setError(err.response?.data?.message || 'Could not load document library.'));
  }, []);

  const download = async (id, title) => {
    setError(null);
    try {
      const res = await api.get(`/documents/templates/${id}/download`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = title.replace(/\s+/g, '-').toLowerCase();
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.response?.data?.message || 'Download not allowed or file missing.');
    }
  };

  return (
    <div>
      <h1 className="page-title">Documents</h1>
      <p className="kpi-sub">Approved templates (MoU, Contract, NDA, Proposal). Access is limited to authorized users.</p>
      {error && <p className="error-text">{error}</p>}
      <div className="card">
        <table>
          <thead>
            <tr><th>Category</th><th>Title</th><th></th></tr>
          </thead>
          <tbody>
            {templates.map((t) => (
              <tr key={t.id}>
                <td><span className="badge pending">{t.category.toUpperCase()}</span></td>
                <td>{t.title}</td>
                <td><button type="button" className="small" onClick={() => download(t.id, t.title)}>Download</button></td>
              </tr>
            ))}
            {!templates.length && !error && (
              <tr><td colSpan={3} className="kpi-sub">No templates available for your account.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
