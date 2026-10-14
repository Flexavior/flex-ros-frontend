import React, { useEffect, useRef, useState } from 'react';
import api from '../api/client.js';

export default function Documents() {
  const [templates, setTemplates] = useState([]);
  const [capabilities, setCapabilities] = useState({ upload_libraries: [], categories: [] });
  const [libraryFilter, setLibraryFilter] = useState('');
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [upload, setUpload] = useState({ title: '', category: 'proposal', library: 'sales', file: null });
  const [busy, setBusy] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const pickFile = (file) => {
    if (file) setUpload((u) => ({ ...u, file }));
  };

  const load = () => {
    const params = libraryFilter ? { library: libraryFilter } : {};
    api.get('/documents/templates', { params })
      .then((res) => setTemplates(res.data.data || []))
      .catch((err) => setError(err.response?.data?.message || 'Could not load document library.'));
  };

  useEffect(() => {
    api.get('/documents/capabilities')
      .then((res) => {
        const cap = res.data || {};
        setCapabilities(cap);
        if (cap.upload_libraries?.length) {
          setUpload((u) => ({ ...u, library: cap.upload_libraries[0] }));
        }
      })
      .catch(() => {});
  }, []);

  useEffect(load, [libraryFilter]);

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

  const submitUpload = async (e) => {
    e.preventDefault();
    if (!upload.file) {
      setError('Choose a file to upload.');
      return;
    }
    setBusy(true);
    setError(null);
    setMessage(null);
    const form = new FormData();
    form.append('title', upload.title);
    form.append('category', upload.category);
    form.append('library', upload.library);
    form.append('file', upload.file);
    try {
      await api.post('/documents/templates', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setMessage('Document uploaded to library.');
      setUpload((u) => ({ ...u, title: '', file: null }));
      if (fileInputRef.current) fileInputRef.current.value = '';
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed.');
    } finally {
      setBusy(false);
    }
  };

  const canUpload = (capabilities.upload_libraries || []).length > 0;

  return (
    <div>
      <h1 className="page-title">Documents</h1>
      <p className="kpi-sub">
        Sales and Marketing libraries — senior staff upload templates; team members view and download.
      </p>
      {message && <p className="success-text">{message}</p>}
      {error && <p className="error-text">{error}</p>}

      {canUpload && (
        <form className="card documents-upload-card" onSubmit={submitUpload} style={{ marginBottom: 16 }}>
          <h3>Upload to library</h3>
          <div className="documents-upload-row">
            <div className="form-row">
              <label>Library</label>
              <select value={upload.library} onChange={(e) => setUpload({ ...upload, library: e.target.value })} required>
                {capabilities.upload_libraries.map((lib) => (
                  <option key={lib} value={lib}>{lib === 'sales' ? 'Sales' : 'Marketing'}</option>
                ))}
              </select>
            </div>
            <div className="form-row">
              <label>Category</label>
              <select value={upload.category} onChange={(e) => setUpload({ ...upload, category: e.target.value })} required>
                {(capabilities.categories || []).map((c) => (
                  <option key={c} value={c}>{c.toUpperCase()}</option>
                ))}
              </select>
            </div>
            <div className="form-row">
              <label>Title</label>
              <input value={upload.title} onChange={(e) => setUpload({ ...upload, title: e.target.value })} required />
            </div>
            <div className="form-row documents-drop-cell">
              <label>File</label>
              <input
                ref={fileInputRef}
                type="file"
                className="documents-file-input-hidden"
                onChange={(e) => pickFile(e.target.files?.[0] || null)}
              />
              <button
                type="button"
                className={`documents-drop-zone${dragOver ? ' drag-over' : ''}`}
                aria-label="Choose or drop file"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  pickFile(e.dataTransfer.files?.[0] || null);
                }}
              >
                <span className="documents-drop-plus" aria-hidden>+</span>
                <span className="documents-drop-label">
                  {upload.file ? upload.file.name : 'Drop or click'}
                </span>
              </button>
            </div>
            <div className="form-row documents-upload-submit">
              <label>&nbsp;</label>
              <button type="submit" disabled={busy || !upload.file}>{busy ? 'Uploading…' : 'Upload'}</button>
            </div>
          </div>
        </form>
      )}

      <div className="card">
        <div className="form-row" style={{ maxWidth: 280 }}>
          <label>Filter library</label>
          <select value={libraryFilter} onChange={(e) => setLibraryFilter(e.target.value)}>
            <option value="">All (allowed)</option>
            <option value="sales">Sales</option>
            <option value="marketing">Marketing</option>
          </select>
        </div>
        <table>
          <thead>
            <tr><th>Library</th><th>Category</th><th>Title</th><th>Uploaded by</th><th></th></tr>
          </thead>
          <tbody>
            {templates.map((t) => (
              <tr key={t.id}>
                <td>{t.library}</td>
                <td><span className="badge pending">{t.category.toUpperCase()}</span></td>
                <td>{t.title}</td>
                <td>{t.uploaded_by?.name || '—'}</td>
                <td><button type="button" className="small" onClick={() => download(t.id, t.title)}>Download</button></td>
              </tr>
            ))}
            {!templates.length && !error && (
              <tr><td colSpan={5} className="kpi-sub">No documents in this library for your role.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
