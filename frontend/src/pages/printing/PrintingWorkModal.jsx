import React, { useState, useEffect, useRef } from 'react';
import apiClient, { mediaUrl } from '../../services/apiClient';
import Modal from '../../components/ui/Modal';
import ConfirmBox from '../../components/ui/ConfirmBox';
import FileViewer from '../../components/ui/FileViewer';
import {
  UploadCloud, FileText, FileImage, FileArchive, Trash2, RefreshCw,
  Eye, X, CheckCircle2, Mail, Phone
} from 'lucide-react';

const WORK_ALLOWED_EXT = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.pdf', '.doc', '.docx', '.zip'];
const IMAGE_EXTS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'];
const WORK_MAX_MB = 25;
const WORK_MAX_FILES = 5;

const isImageName = (name) => IMAGE_EXTS.includes((name || '').split('.').pop().toLowerCase());

const fileIcon = (name) => {
  const ext = name.split('.').pop().toLowerCase();
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(ext)) return <FileImage size={18} color="#0ea5e9" />;
  if (ext === 'pdf') return <FileText size={18} color="#ef4444" />;
  if (['zip'].includes(ext)) return <FileArchive size={18} color="#8b5cf6" />;
  return <FileText size={18} color="#64748b" />;
};

const formatBytes = (bytes) => {
  if (!bytes && bytes !== 0) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
};

const PrintingWorkModal = ({ isOpen, order, onClose }) => {
  const [works, setWorks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState([]);
  const [errors, setErrors] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [confirmDel, setConfirmDel] = useState(null);
  const [viewFile, setViewFile] = useState(null);
  const fileInputRef = useRef(null);

  const openFile = (w) => {
    if (!w?.url) return;
    const ext = (w.originalName || '').split('.').pop().toLowerCase();
    if (IMAGE_EXTS.includes(ext) || ext === 'docx') {
      setViewFile({ originalName: w.originalName, url: mediaUrl(w.url) });
      return;
    }
    window.open(mediaUrl(w.url), '_blank', 'noopener,noreferrer');
  };

  const load = async () => {
    if (!order?.id) return;
    setLoading(true);
    try {
      const res = await apiClient.get(`/printing/orders/${order.id}/works`);
      setWorks(res.data?.works || []);
    } catch (e) {
      setError(e?.message || 'Failed to load uploaded work files.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setMsg(''); setError(''); setSelected([]); setErrors([]);
      load();
    }
  }, [isOpen, order?.id]);

  const validateFiles = (files) => {
    const list = Array.from(files).slice(0, 10);
    const picked = [];
    const errs = [];
    list.forEach(f => {
      const ext = '.' + (f.name.split('.').pop() || '').toLowerCase();
      if (!WORK_ALLOWED_EXT.includes(ext)) {
        errs.push(`"${f.name}" — not allowed. Allowed: images, PDF, DOC/DOCX, ZIP.`);
        return;
      }
      if (f.size > WORK_MAX_MB * 1024 * 1024) {
        errs.push(`"${f.name}" — too large. Max ${WORK_MAX_MB}MB per file.`);
        return;
      }
      picked.push(f);
    });
    if (picked.length + works.length > 50) {
      errs.push(`Too many files for this order (max 50 total). Delete some files first.`);
    }
    setSelected(prev => {
      const seen = new Map(prev.concat(picked).map(p => [p.name + p.size, p]));
      return Array.from(seen.values());
    });
    setErrors(errs);
  };

  const handlePick = (e) => {
    const files = e.target.files;
    if (files && files.length) validateFiles(files);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const dropPick = (file) => file && validateFiles([file]);

  const handleUpload = async () => {
    if (selected.length === 0) return;
    setUploading(true); setMsg(''); setError('');
    try {
      const fd = new FormData();
      selected.forEach(f => fd.append('files', f));
      const res = await apiClient.post(`/printing/orders/${order.id}/works`, fd);
      setMsg(res.message || 'Work uploaded.');
      setSelected([]);
      await load();
    } catch (e) {
      setError(e?.message || 'Upload failed. Check the file types and sizes.');
    } finally {
      setUploading(false);
    }
  };

  const handleReplace = async (work, file) => {
    if (!file) return;
    const ext = '.' + (file.name.split('.').pop() || '').toLowerCase();
    if (!WORK_ALLOWED_EXT.includes(ext)) { setError(`"${file.name}" — not allowed. Allowed: images, PDF, DOC/DOCX, ZIP.`); return; }
    if (file.size > WORK_MAX_MB * 1024 * 1024) { setError(`"${file.name}" — too large. Max ${WORK_MAX_MB}MB per file.`); return; }
    setUploading(true); setMsg(''); setError('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await apiClient.put(`/printing/works/${work.id}`, fd);
      setMsg(res.message || 'Work updated.');
      await load();
    } catch (e) {
      setError(e?.message || 'Update failed.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    const work = confirmDel;
    if (!work) return;
    setUploading(true); setMsg(''); setError('');
    try {
      await apiClient.delete(`/printing/works/${work.id}`);
      setMsg('Work file deleted.');
      setConfirmDel(null);
      await load();
    } catch (e) {
      setError(e?.message || 'Delete failed.');
      setConfirmDel(null);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Uploaded Work — ${order?.order_number || ''}`} size="lg">
      <div style={{ fontFamily: "'Inter', sans-serif" }}>
        {/* Order / customer summary */}
        <div style={{
          background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10,
          padding: '12px 16px', marginBottom: 16, fontSize: 13, color: '#475569',
          display: 'flex', flexWrap: 'wrap', gap: '6px 22px'
        }}>
          <span style={{ fontWeight: 700, color: '#0f172a' }}>{order?.customer_name || 'Walk-in'}</span>
          {order?.customer_email && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><Mail size={13} /> {order.customer_email}</span>
          )}
          {order?.customer_phone && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><Phone size={13} /> {order.customer_phone}</span>
          )}
        </div>

        {msg && (
          <div style={{ marginBottom: 12, padding: '10px 14px', borderRadius: 8, background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#065f46', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
            <CheckCircle2 size={16} /> {msg}
          </div>
        )}
        {error && (
          <div style={{ marginBottom: 12, padding: '10px 14px', borderRadius: 8, background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', fontSize: 13, fontWeight: 600 }}>
            {error}
          </div>
        )}

        {/* Upload area */}
        <div style={{ border: '2px dashed #cbd5e1', borderRadius: 12, padding: 16, background: '#f8fafc' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <UploadCloud size={20} color="#2563EB" />
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>Upload your work file(s)</div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                Allowed: JPG · PNG · GIF · WEBP · BMP · PDF · DOC/DOCX · ZIP — max {WORK_MAX_MB}MB each, up to {WORK_MAX_FILES} files at once. Checked before upload.
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={WORK_ALLOWED_EXT.join(',')}
              onChange={handlePick}
              style={{ fontSize: 13 }}
            />
            <button
              type="button"
              disabled={selected.length === 0 || uploading}
              onClick={handleUpload}
              style={{
                padding: '8px 18px', borderRadius: 8, border: 'none',
                background: selected.length === 0 || uploading ? '#94a3b8' : '#2563EB',
                color: '#fff', fontWeight: 700, fontSize: 13, cursor: selected.length === 0 || uploading ? 'not-allowed' : 'pointer'
              }}
            >
              {uploading ? 'Uploading...' : `Upload ${selected.length > 0 ? `(${selected.length})` : ''}`}
            </button>
            {selected.length > 0 && (
              <button type="button" onClick={() => { setSelected([]); setErrors([]); }} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#fff', color: '#64748b', fontWeight: 600, fontSize: 13, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <X size={14} /> Clear selection
              </button>
            )}
          </div>

          {selected.length > 0 && (
            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {selected.map((f, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#334155', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 6, padding: '6px 10px' }}>
                  {fileIcon(f.name)}
                  <span style={{ flex: 1 }}>{f.name}</span>
                  <span style={{ color: '#94a3b8' }}>{formatBytes(f.size)}</span>
                </div>
              ))}
            </div>
          )}
          {errors.length > 0 && (
            <div style={{ marginTop: 8, fontSize: 12, color: '#dc2626' }}>
              {errors.map((e, i) => <div key={i}>⚠ {e}</div>)}
            </div>
          )}
        </div>

        {/* Existing work history */}
        <div style={{ marginTop: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Uploaded work history <span style={{ color: '#94a3b8', fontWeight: 500 }}>(tracked by order)</span></h4>
            <button type="button" onClick={load} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, border: 'none', background: 'none', color: '#2563EB', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
              <RefreshCw size={13} /> Refresh
            </button>
          </div>

          {loading ? (
            <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Loading...</div>
          ) : works.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: 13, border: '1px dashed #e2e8f0', borderRadius: 10 }}>
              No work files uploaded yet for this order.
            </div>
          ) : (
            <div style={{ border: '1px solid #e2e8f0', borderRadius: 10, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    {['Uploaded Work', 'Size', 'Uploaded', 'Actions'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '10px 12px', fontSize: 11, textTransform: 'uppercase', color: '#64748b' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {works.map(w => (
                    <tr key={w.id} style={{ borderTop: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '10px 12px', fontWeight: 600, color: '#0f172a' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>{fileIcon(w.originalName)} {w.originalName}</span>
                      </td>
                      <td style={{ padding: '10px 12px', color: '#64748b' }}>{formatBytes(w.size)}</td>
                      <td style={{ padding: '10px 12px', color: '#64748b', fontSize: 12 }}>
                        {w.uploadedAt ? new Date(w.uploadedAt).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          <button
                            type="button"
                            onClick={() => openFile(w)}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', color: '#059669', fontWeight: 700, fontSize: 12, cursor: 'pointer', padding: 0 }}
                            title="Open in Chrome browser"
                          >
                            <Eye size={13} /> Open File
                          </button>
                          <label style={{ cursor: 'pointer', color: '#2563EB', fontWeight: 700, fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            Update
                            <input
                              type="file"
                              accept={WORK_ALLOWED_EXT.join(',')}
                              style={{ display: 'none' }}
                              disabled={uploading}
                              onChange={e => { const f = e.target.files?.[0]; if (f) dropPickReplacement(w, f); e.target.value = ''; }}
                            />
                          </label>
                          <button
                            type="button"
                            disabled={uploading}
                            onClick={() => setConfirmDel(w)}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', color: '#dc2626', fontWeight: 700, fontSize: 12, cursor: uploading ? 'not-allowed' : 'pointer' }}
                          >
                            <Trash2 size={13} /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div style={{ marginTop: 14, padding: '10px 14px', borderRadius: 8, background: '#fffbeb', border: '1px solid #fde68a', fontSize: 12, color: '#92400e', lineHeight: 1.6 }}>
          <strong>Customer notification:</strong> uploading (or updating) a file automatically emails the customer's email{order?.customer_email ? ` (${order.customer_email})` : ''} with the file attached and a link to review it, plus an SMS to {order?.customer_phone || 'their phone'} linking to Order Tracking. The SMS sends for real once the provider integration is enabled.
        </div>

        <ConfirmBox
          open={!!confirmDel}
          title="Delete Uploaded Work"
          message={confirmDel ? `Delete "${confirmDel.originalName}" from this order? The file will be permanently removed from the server.` : ''}
          confirmLabel="Delete"
          busy={uploading}
          onConfirm={handleDelete}
          onClose={() => setConfirmDel(null)}
        />
        <FileViewer file={viewFile} onClose={() => setViewFile(null)} />
      </div>
    </Modal>
  );

  function dropPickReplacement(work, file) { handleReplace(work, file); }
};

export default PrintingWorkModal;