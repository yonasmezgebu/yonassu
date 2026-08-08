import React, { useState, useEffect, useRef } from 'react';
import hrService from '../../services/hrService';
import { playSuccessSound } from '../../utils/playNotificationSound';
import { formatDate } from '../../utils/formatters';
import styles from './HREmployeeFiles.module.css';

const BACKEND_URL = (import.meta?.env?.VITE_API_URL || 'http://localhost:5000/api/v1').replace('/api/v1', '');

const getFileIcon = (fileName = '', fileType = '') => {
  const ext = (fileName.split('.').pop() || '').toLowerCase();
  if (['jpg','jpeg','png','gif','webp'].includes(ext) || (fileType||'').startsWith('image/')) return '🖼️';
  if (ext === 'pdf' || fileType === 'application/pdf') return '📄';
  if (['doc','docx'].includes(ext)) return '📝';
  if (['xls','xlsx'].includes(ext)) return '📊';
  if (['zip','rar','7z'].includes(ext)) return '🗜️';
  return '📎';
};

const fmtSize = (bytes) => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes/1024).toFixed(1)} KB`;
  return `${(bytes/(1024*1024)).toFixed(1)} MB`;
};

const HREmployeeFiles = () => {
  const [files, setFiles] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef(null);
  
  // Filters
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  
  // Modals
  const [showModal, setShowModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragOver, setDragOver]     = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [formData, setFormData] = useState({
    employeeId: '',
    documentType: 'ID/Passport',
    notes: '',
  });

  const fetchFiles = async () => {
    try {
      setLoading(true);
      const res = await hrService.getEmployeeFiles();
      setFiles(res.data?.data?.files || res.data || []);
      
      const empRes = await hrService.getEmployees();
      setEmployees(empRes.data?.data?.employees || []);
    } catch (err) {
      console.error("Failed to fetch files", err);
      if (Array.isArray(err)) setFiles(err); 
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleExport = () => {
    window.open(hrService.getExportUrl('files'), '_blank');
  };

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (f) { setSelectedFile(f); setUploadError(''); }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) { setSelectedFile(f); setUploadError(''); }
  };

  const openModal = () => {
    setFormData({ employeeId: '', documentType: 'ID/Passport', notes: '' });
    setSelectedFile(null);
    setDragOver(false);
    setUploadError('');
    setShowModal(true);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) { setUploadError('Please select a file before uploading.'); return; }
    try {
      const fd = new FormData();
      fd.append('employeeId', formData.employeeId);
      fd.append('documentType', formData.documentType);
      fd.append('notes', formData.notes);
      fd.append('file', selectedFile);
      await hrService.uploadEmployeeFile(fd);
      playSuccessSound();
      setShowModal(false);
      setSelectedFile(null);
      setUploadError('');
      fetchFiles();
    } catch (err) {
      setUploadError(err?.response?.data?.message || 'Upload failed. Please try again.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this file? This cannot be undone.')) return;
    try {
      await hrService.deleteEmployeeFile(id);
      fetchFiles();
    } catch (err) {
      alert("Failed to delete file");
    }
  };

  const handleArchive = async (id) => {
    try {
      await hrService.archiveEmployeeFile(id);
      fetchFiles();
    } catch (err) {
      alert("Failed to archive file");
    }
  };

  const getBadgeClass = (status) => {
    return status === 'Active' ? styles.badgeActive : styles.badgeArchived;
  };

  const filtered = files.filter(f => {
    const emp = employees.find(e => e.employee_id === f.employeeId) || {};
    const matchSearch = (emp.full_name || '').toLowerCase().includes(search.toLowerCase()) || (f.fileName || '').toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter ? f.documentType === typeFilter : true;
    return matchSearch && matchType;
  });

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.pageTitle}>Employee Files</h1>
          <p className={styles.pageSubtitle}>Centralized repository for all employee documents</p>
        </div>
        <div className={styles.actionBtns}>
          <button className={styles.exportBtn} onClick={handleExport}>Export List</button>
          <button className={styles.primaryButton} onClick={openModal}>+ Upload File</button>
        </div>
      </div>

      <div className={styles.controls}>
        <div className={styles.searchBar}>
          <input 
            type="text" 
            placeholder="Search by employee or filename..." 
            className={styles.searchInput}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select className={styles.filterSelect} value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
          <option value="">All Document Types</option>
          <option value="ID/Passport">ID/Passport</option>
          <option value="Tax Forms">Tax Forms</option>
          <option value="Medical Records">Medical Records</option>
          <option value="Disciplinary Records">Disciplinary Records</option>
          <option value="Certificates">Certificates</option>
        </select>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Employee</th>
              <th>Document Type</th>
              <th>File</th>
              <th>Version</th>
              <th>Upload Date</th>
              <th>Uploaded By</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="8" style={{textAlign: 'center'}}>Loading files...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan="8" style={{textAlign: 'center'}}>No documents found.</td></tr>
            ) : (
              filtered.map(f => {
                const emp = employees.find(e => e.employee_id === f.employeeId) || {};
                return (
                  <tr key={f.id}>
                    <td>
                      <strong style={{color:'#1e293b'}}>{emp.full_name || 'Unknown'}</strong>
                      <br/><small style={{color:'#94a3b8',fontFamily:'monospace'}}>{f.employeeId}</small>
                    </td>
                    <td>
                      <span style={{background:'#f1f5f9',borderRadius:4,padding:'2px 8px',fontSize:12,fontWeight:600,color:'#475569'}}>
                        {f.documentType}
                      </span>
                    </td>
                    <td>
                      {/* Telegram-style file bubble — opens in new tab */}
                      <a
                        href={`${BACKEND_URL}/${(hrService.downloadEmployeeFileUrl(f.id)||'').replace(/^.*\/api\/v1/,'')}`}
                        target="_blank"
                        rel="noreferrer"
                        title="Open in new browser tab"
                        style={{
                          display:'inline-flex', alignItems:'center', gap:8,
                          background:'#f0f9ff', border:'1.5px solid #bae6fd',
                          borderRadius:10, padding:'7px 12px',
                          textDecoration:'none', color:'#0369a1',
                          fontSize:13, fontWeight:600, maxWidth:210,
                          overflow:'hidden', transition:'background 0.15s',
                        }}
                        onMouseEnter={e=>e.currentTarget.style.background='#e0f2fe'}
                        onMouseLeave={e=>e.currentTarget.style.background='#f0f9ff'}
                      >
                        <span style={{fontSize:20,flexShrink:0}}>{getFileIcon(f.fileName, f.fileType)}</span>
                        <span style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',flex:1}}>
                          {f.fileName || `File #${f.id}`}
                        </span>
                        <span style={{fontSize:11,opacity:0.65,flexShrink:0}}>↗</span>
                      </a>
                    </td>
                    <td style={{color:'#64748b'}}>v{f.version || 1}</td>
                    <td style={{color:'#64748b',whiteSpace:'nowrap'}}>{formatDate(f.uploadDate, 'short')}</td>
                    <td style={{color:'#64748b'}}>{f.uploadedBy || 'System'}</td>
                    <td>
                      <span className={`${styles.badge} ${getBadgeClass(f.status)}`}>{f.status}</span>
                    </td>
                    <td>
                      <div className={styles.actionBtns}>
                        <a
                          href={hrService.downloadEmployeeFileUrl(f.id)}
                          target="_blank"
                          rel="noreferrer"
                          className={`${styles.btnSmall} ${styles.btnOutline}`}
                          style={{textDecoration:'none'}}
                        >Open ↗</a>
                        {f.status === 'Active' && (
                          <button className={`${styles.btnSmall} ${styles.btnOutline}`} onClick={() => handleArchive(f.id)}>Archive</button>
                        )}
                        <button className={`${styles.btnSmall} ${styles.btnDanger}`} onClick={() => handleDelete(f.id)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Upload Employee File</h2>
              <button className={styles.closeModal} onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <div className={styles.modalBody}>
              <form id="fileForm" onSubmit={handleUpload}>
                <div className={styles.formGroup}>
                  <label>Employee</label>
                  <select required value={formData.employeeId} onChange={e => setFormData({...formData, employeeId: e.target.value})}>
                    <option value="">Select Employee…</option>
                    {employees.map(emp => (
                      <option key={emp.employee_id} value={emp.employee_id}>{emp.full_name}</option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label>Document Type</label>
                  <select required value={formData.documentType} onChange={e => setFormData({...formData, documentType: e.target.value})}>
                    <option>ID/Passport</option>
                    <option>Tax Forms</option>
                    <option>Medical Records</option>
                    <option>Disciplinary Records</option>
                    <option>Certificates</option>
                  </select>
                  {['Medical Records','Disciplinary Records'].includes(formData.documentType) && (
                    <p style={{color:'#991b1b',fontSize:12,margin:'4px 0 0'}}>⚠️ Restricted: Only HR Managers can view this type.</p>
                  )}
                </div>

                {/* ── Telegram-style file attach zone ── */}
                <div className={styles.formGroup}>
                  <label>Select File</label>

                  {/* Hidden real input */}
                  <input
                    id="empFileHidden"
                    type="file"
                    ref={fileInputRef}
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    style={{display:'none'}}
                    onChange={handleFileChange}
                  />

                  {selectedFile ? (
                    /* Attachment card — like Telegram after picking a file */
                    <div style={{
                      display:'flex', alignItems:'center', gap:12,
                      background:'#f0f9ff', border:'2px solid #7dd3fc',
                      borderRadius:12, padding:'12px 16px',
                    }}>
                      <span style={{fontSize:32,flexShrink:0}}>{getFileIcon(selectedFile.name, selectedFile.type)}</span>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontWeight:700,fontSize:14,color:'#0c4a6e',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                          {selectedFile.name}
                        </div>
                        <div style={{fontSize:12,color:'#0369a1',marginTop:3}}>
                          {fmtSize(selectedFile.size)} · Ready to upload
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => { setSelectedFile(null); setUploadError(''); }}
                        style={{background:'none',border:'none',cursor:'pointer',color:'#ef4444',fontSize:20,fontWeight:700,flexShrink:0,lineHeight:1}}
                        title="Remove"
                      >✕</button>
                    </div>
                  ) : (
                    /* Drop zone */
                    <div
                      className={styles.fileUploadBox}
                      style={dragOver ? {borderColor:'#3b82f6',background:'#eff6ff'} : {}}
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={e => {
                        e.preventDefault(); setDragOver(false);
                        const f = e.dataTransfer.files?.[0];
                        if (f) { setSelectedFile(f); setUploadError(''); }
                      }}
                    >
                      <div style={{fontSize:28,marginBottom:6}}>📎</div>
                      <div style={{fontWeight:600,fontSize:13}}>Click to browse or drag &amp; drop</div>
                      <div className={styles.fileUploadHint}>PDF, DOCX, JPG, PNG · Max 10 MB</div>
                    </div>
                  )}

                  {uploadError && (
                    <p style={{color:'#dc2626',fontSize:12,margin:'6px 0 0'}}>⚠️ {uploadError}</p>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label>Notes (Optional)</label>
                  <textarea rows="3" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} />
                </div>
              </form>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.btnCancel} onClick={() => setShowModal(false)}>Cancel</button>
              <button type="submit" form="fileForm" className={styles.btnSave}>
                {selectedFile ? `Upload "${selectedFile.name.length > 25 ? selectedFile.name.slice(0,25)+'…' : selectedFile.name}"` : 'Upload File'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HREmployeeFiles;
