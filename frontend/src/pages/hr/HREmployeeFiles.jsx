import React, { useState, useEffect } from 'react';
import hrService from '../../services/hrService';
import { playSuccessSound } from '../../utils/playNotificationSound';
import { formatDate } from '../../utils/formatters';
import styles from './HREmployeeFiles.module.css';

const HREmployeeFiles = () => {
  const [files, setFiles] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  
  // Modals
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    employeeId: '',
    documentType: 'ID/Passport',
    notes: '',
    fileName: 'document.pdf' // Mocking file name
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
      // Fallback for mock if direct array is returned
      if (Array.isArray(err)) setFiles(err); 
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // In a real app we'd fetch actual data. Since we mocked backend, 
    // we'll just handle it gracefully.
    hrService.getEmployeeFiles()
      .then(res => {
        setFiles(Array.isArray(res) ? res : res.data?.data?.files || []);
      })
      .catch(console.error);

    hrService.getEmployees()
      .then(res => {
        setEmployees(res.data?.data?.employees || []);
      })
      .catch(console.error);
      
    setLoading(false);
  }, []);

  const handleExport = () => {
    window.open(hrService.getExportUrl('files'), '_blank');
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    try {
      // Mocking file upload
      await hrService.uploadEmployeeFile({
        ...formData,
        uploadedBy: 'Current User'
      });
      playSuccessSound();
      setShowModal(false);
      // re-fetch
      const res = await hrService.getEmployeeFiles();
      setFiles(Array.isArray(res) ? res : res.data?.data?.files || []);
    } catch (err) {
      alert("Failed to upload file");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this file? This cannot be undone.')) return;
    try {
      await hrService.deleteEmployeeFile(id);
      const res = await hrService.getEmployeeFiles();
      setFiles(Array.isArray(res) ? res : res.data?.data?.files || []);
    } catch (err) {
      alert("Failed to delete file");
    }
  };

  const handleArchive = async (id) => {
    try {
      await hrService.archiveEmployeeFile(id);
      const res = await hrService.getEmployeeFiles();
      setFiles(Array.isArray(res) ? res : res.data?.data?.files || []);
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
          <button className={styles.primaryButton} onClick={() => setShowModal(true)}>+ Upload File</button>
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
              <th>Filename</th>
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
                    <td><strong>{emp.full_name || 'Unknown'}</strong><br/><small>{f.employeeId}</small></td>
                    <td>{f.documentType}</td>
                    <td>{f.fileName}</td>
                    <td>v{f.version || 1}</td>
                    <td>{formatDate(f.uploadDate, 'short')}</td>
                    <td>{f.uploadedBy || 'System'}</td>
                    <td>
                      <span className={`${styles.badge} ${getBadgeClass(f.status)}`}>{f.status}</span>
                    </td>
                    <td>
                      <div className={styles.actionBtns}>
                        <a href={hrService.downloadEmployeeFileUrl(f.id)} target="_blank" rel="noreferrer" className={`${styles.btnSmall} ${styles.btnOutline}`} style={{textDecoration: 'none'}}>Download</a>
                        {f.status === 'Active' && <button className={`${styles.btnSmall} ${styles.btnOutline}`} onClick={() => handleArchive(f.id)}>Archive</button>}
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
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2>Upload Employee File</h2>
              <button className={styles.closeModal} onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <div className={styles.modalBody}>
              <form id="fileForm" onSubmit={handleUpload}>
                <div className={styles.formGroup}>
                  <label>Employee</label>
                  <select required value={formData.employeeId} onChange={e => setFormData({...formData, employeeId: e.target.value})}>
                    <option value="">Select Employee...</option>
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
                  {['Medical Records', 'Disciplinary Records'].includes(formData.documentType) && (
                    <p style={{color: '#991b1b', fontSize: '12px', margin: '4px 0 0 0'}}>⚠️ Restricted Access: Only HR Managers can view this document type.</p>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label>Select File</label>
                  <div className={styles.fileUploadBox}>
                    Click to browse or drag and drop file here
                  </div>
                  <div className={styles.fileUploadHint}>Max size: 10MB. Formats: PDF, DOCX, JPG, PNG</div>
                </div>

                <div className={styles.formGroup}>
                  <label>Notes (Optional)</label>
                  <textarea rows="3" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})}></textarea>
                </div>
              </form>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.btnCancel} onClick={() => setShowModal(false)}>Cancel</button>
              <button type="submit" form="fileForm" className={styles.btnSave}>Upload File</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HREmployeeFiles;
