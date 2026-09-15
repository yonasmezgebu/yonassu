import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { UploadCloud, RefreshCw, Search, FileText, FileImage, FileArchive, Trash2, Upload, Eye, Phone, Mail } from 'lucide-react';
import apiClient, { mediaUrl } from '../../services/apiClient';
import { StageStyles } from './printingStageStyles';
import ConfirmBox from '../../components/ui/ConfirmBox';
import FileViewer from '../../components/ui/FileViewer';

const WORK_ALLOWED_EXT = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.pdf', '.doc', '.docx', '.zip'];
const IMAGE_EXTS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'];
const WORK_MAX_MB = 25;

const fileIcon = (name) => {
  const ext = (name || '').split('.').pop().toLowerCase();
  if (IMAGE_EXTS.includes(ext)) return <FileImage size={16} color="#0ea5e9" />;
  if (ext === 'pdf') return <FileText size={16} color="#ef4444" />;
  if (ext === 'zip') return <FileArchive size={16} color="#8b5cf6" />;
  return <FileText size={16} color="#64748b" />;
};

const isImageName = (name) => IMAGE_EXTS.includes((name || '').split('.').pop().toLowerCase());

const formatBytes = (bytes) => {
  if (!bytes && bytes !== 0) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
};

const PrintingUploadWork = () => {
  const [works, setWorks] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [search, setSearch] = useState('');
  const [orderNumber, setOrderNumber] = useState('');
  const [page, setPage] = useState(1);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [confirmWork, setConfirmWork] = useState(null);
  const [viewFile, setViewFile] = useState(null);
  const navigate = useNavigate();

  const openFile = (w) => {
    if (!w?.url) return;
    const ext = (w.originalName || '').split('.').pop().toLowerCase();
    if (IMAGE_EXTS.includes(ext) || ext === 'docx') {
      setViewFile({ originalName: w.originalName, url: mediaUrl(w.url) });
      return;
    }
    window.open(mediaUrl(w.url), '_blank', 'noopener,noreferrer');
  };

  const load = useCallback(async (params) => {
    setLoading(true);
    try {
      const res = await apiClient.get('/printing/works', { params });
      setWorks(res.data?.works || []);
      setPagination(res.data?.pagination || { page: 1, limit: 25, total: 0, totalPages: 1 });
    } catch (e) {
      setError(e?.message || 'Failed to load uploaded work files.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load({ page: 1, limit: 25 }); }, [load]);

  const applyFilters = (p) => {
    setMsg(''); setError('');
    const params = { page: p, limit: 25 };
    if (orderNumber.trim()) params.orderNumber = orderNumber.trim();
    if (search.trim()) params.search = search.trim();
    load(params);
  };

  const handleReplace = async (work, file) => {
    const ext = '.' + (file.name.split('.').pop() || '').toLowerCase();
    if (!WORK_ALLOWED_EXT.includes(ext)) { setError(`"${file.name}" — not allowed. Allowed: images, PDF, DOC/DOCX, ZIP.`); return; }
    if (file.size > WORK_MAX_MB * 1024 * 1024) { setError(`"${file.name}" — too large. Max ${WORK_MAX_MB}MB per file.`); return; }
    setBusyId(work.id); setMsg(''); setError('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await apiClient.put(`/printing/works/${work.id}`, fd);
      setMsg(res.message || 'Work updated.');
      applyFilters(page);
    } catch (e) {
      setError(e?.message || 'Update failed.');
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async () => {
    const work = confirmWork;
    if (!work) return;
    setBusyId(work.id); setMsg(''); setError('');
    try {
      await apiClient.delete(`/printing/works/${work.id}`);
      setMsg('Work file deleted.');
      setConfirmWork(null);
      applyFilters(page);
    } catch (e) {
      setError(e?.message || 'Delete failed.');
      setConfirmWork(null);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="stg-root" style={{ margin: '-24px', minHeight: 'calc(100vh - 64px)' }}>
      <StageStyles />
      <div className="stg-head">
        <h1 className="stg-title"><UploadCloud color="#2563EB" /> UPLOADED WORK</h1>
        <p className="stg-sub">Files uploaded at the Job Process (Prepress) stage — tracked by order number. Customers see them on Order Tracking with their mobile number.</p>
      </div>

      <div className="stg-toolbar">
        <div className="stg-field" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label className="stg-label" style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>Search files / customer</label>
          <input
            className="stg-input"
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') applyFilters(1); }}
            placeholder="File name or customer..." 
            style={{ minWidth: 220 }}
          />
        </div>
        <div className="stg-field" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label className="stg-label" style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>Order number</label>
          <input
            className="stg-input"
            value={orderNumber}
            onChange={e => setOrderNumber(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') applyFilters(1); }}
            placeholder="e.g. PRT-..." 
            style={{ minWidth: 180 }}
          />
        </div>
        <button className="stg-btn stg-btn--primary stg-btn--sm" onClick={() => applyFilters(1)}>
          <Search size={14} style={{ marginRight: 4 }} /> Search
        </button>
        <button className="stg-btn stg-btn--soft-blue stg-btn--sm" onClick={() => { setSearch(''); setOrderNumber(''); load({ page: 1, limit: 25 }); }}>
          <RefreshCw size={14} style={{ marginRight: 4 }} /> Refresh
        </button>
        <div style={{ marginLeft: 'auto' }} className="stg-pill">{pagination.total} file(s) uploaded</div>
      </div>

      {msg && (
        <div style={{ marginBottom: 12, padding: '10px 14px', borderRadius: 8, background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#065f46', fontSize: 13, fontWeight: 600 }}>{msg}</div>
      )}
      {error && (
        <div style={{ marginBottom: 12, padding: '10px 14px', borderRadius: 8, background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', fontSize: 13, fontWeight: 600 }}>{error}</div>
      )}

      <div className="stg-table-card">
        <div className="stg-table-scroll">
          <table className="stg-table" style={{ minWidth: 1060 }}>
            <thead>
              <tr>
                {['Order', 'Customer', 'Uploaded Work', 'Size', 'Uploaded', 'Actions'].map(h => (
                  <th key={h} className="stg-th">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td className="stg-td" colSpan={6} style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>Loading...</td></tr>
              ) : works.length === 0 ? (
                <tr><td className="stg-td" colSpan={6} style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
                  No uploaded work files found {search || orderNumber ? 'for this search.' : 'yet — upload work from the Prepress (Job Process) stage.'}
                </td></tr>
              ) : works.map(w => (
                <tr key={w.id}>
                  <td className="stg-td" style={{ whiteSpace: 'nowrap' }}>
                    <button
                      type="button"
                      onClick={() => navigate(`/printing-manager/orders/${w.orderId}`)}
                      style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontWeight: 700, color: '#2563EB', fontSize: 13, textDecoration: 'underline', textAlign: 'left' }}
                    >
                      {w.orderNumber || '—'}
                    </button>
                  </td>
                  <td className="stg-td">
                    <span style={{ fontWeight: 600, color: '#0f172a', display: 'block' }}>{w.customerName || 'Walk-in'}</span>
                    {w.customerEmail && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 12, color: '#64748b' }}>
                        <Mail size={11} /> {w.customerEmail}
                      </span>
                    )}
                    {w.customerPhone && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 12, color: '#64748b' }}>
                        <Phone size={11} /> {w.customerPhone}
                      </span>
                    )}
                  </td>
                  <td className="stg-td">
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, color: '#0f172a', fontSize: 13 }}>
                      {fileIcon(w.originalName)} {w.originalName}
                    </span>
                  </td>
                  <td className="stg-td" style={{ color: '#64748b', whiteSpace: 'nowrap' }}>{formatBytes(w.size)}</td>
                  <td className="stg-td" style={{ color: '#64748b', fontSize: 12, whiteSpace: 'nowrap' }}>
                    {w.uploadedAt ? new Date(w.uploadedAt).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}
                    {w.uploadedByName ? <span style={{ display: 'block', color: '#94a3b8' }}>{w.uploadedByName}</span> : null}
                  </td>
                  <td className="stg-td">
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <button
                        type="button"
                        onClick={() => openFile(w)}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', color: '#059669', fontWeight: 700, fontSize: 12, cursor: 'pointer', padding: 0 }}
                        title="Open in Chrome browser"
                      >
                        <Eye size={13} /> Open File
                      </button>
                      <label style={{ cursor: 'pointer', color: '#2563EB', fontWeight: 700, fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        {busyId === w.id ? 'Saving...' : (<><Upload size={13} /> Update</>)}
                        <input
                          type="file"
                          accept={WORK_ALLOWED_EXT.join(',')}
                          style={{ display: 'none' }}
                          disabled={busyId === w.id}
                          onChange={e => { const f = e.target.files?.[0]; if (f) handleReplace(w, f); e.target.value = ''; }}
                        />
                      </label>
                      <button type="button" disabled={busyId === w.id} onClick={() => setConfirmWork(w)} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', color: '#dc2626', fontWeight: 700, fontSize: 12, cursor: busyId === w.id ? 'not-allowed' : 'pointer' }}>
                        <Trash2 size={13} /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {pagination.totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, padding: '12px 16px', borderTop: '1px solid #F1F5F9' }}>
            <button className="stg-btn stg-btn--soft-blue stg-btn--sm" disabled={page <= 1} onClick={() => { setPage(page - 1); applyFilters(page - 1); }}>← Prev</button>
            <span style={{ fontSize: 13, color: '#64748b' }}>Page {page} of {pagination.totalPages}</span>
            <button className="stg-btn stg-btn--soft-blue stg-btn--sm" disabled={page >= pagination.totalPages} onClick={() => { setPage(page + 1); applyFilters(page + 1); }}>Next →</button>
          </div>
        )}
      </div>

      <ConfirmBox
        open={!!confirmWork}
        title="Delete Uploaded Work"
        message={confirmWork ? `Delete "${confirmWork.originalName}" (Order ${confirmWork.orderNumber})? The file will be permanently removed from the server.` : ''}
        confirmLabel="Delete"
        busy={busyId === confirmWork?.id}
        onConfirm={handleDelete}
        onClose={() => setConfirmWork(null)}
      />
      <FileViewer file={viewFile} onClose={() => setViewFile(null)} />
    </div>
  );
};

export default PrintingUploadWork;