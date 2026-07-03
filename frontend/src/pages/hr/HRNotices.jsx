import React, { useState, useEffect } from 'react';
import hrService from '../../services/hrService';
import { playSuccessSound } from '../../utils/playNotificationSound';
import { formatDate } from '../../utils/formatters';
import styles from './HRNotices.module.css';

const HRNotices = () => {
  const [notices, setNotices] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [search, setSearch] = useState('');
  
  // Modals
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    subject: '',
    targetDepartment: 'All',
    content: ''
  });

  const fetchNotices = async () => {
    try {
      setLoading(true);
      const res = await hrService.getNotices();
      setNotices(Array.isArray(res) ? res : res.data?.data?.notices || []);
      
      const deptRes = await hrService.getDepartmentsDashboard();
      setDepartments(deptRes.data?.data?.departments || []);
    } catch (err) {
      console.error("Failed to fetch notices", err);
      if (Array.isArray(err)) setNotices(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  const handleExport = () => {
    window.open(hrService.getExportUrl('notices'), '_blank');
  };

  const handleCreate = async (e, publish) => {
    e.preventDefault();
    try {
      const nId = await hrService.createNotice(formData);
      if (publish) {
        await hrService.publishNotice(nId);
      }
      playSuccessSound();
      setShowModal(false);
      fetchNotices();
    } catch (err) {
      alert("Failed to create notice");
    }
  };

  const handlePublish = async (id) => {
    try {
      await hrService.publishNotice(id);
      playSuccessSound();
      fetchNotices();
    } catch (err) {
      alert("Failed to publish notice");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this notice?")) return;
    try {
      await hrService.deleteNotice(id);
      fetchNotices();
    } catch (err) {
      alert("Failed to delete notice");
    }
  };

  const getBadgeClass = (status) => {
    return status === 'Published' ? styles.badgePublished : styles.badgeDraft;
  };

  const filtered = notices.filter(n => {
    const matchSearch = (n.subject || '').toLowerCase().includes(search.toLowerCase());
    return matchSearch;
  });

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.pageTitle}>Internal Notices</h1>
          <p className={styles.pageSubtitle}>Draft and publish memos and department-specific notices</p>
        </div>
        <div className={styles.actionBtns}>
          <button className={styles.exportBtn} onClick={handleExport}>Export List</button>
          <button className={styles.primaryButton} onClick={() => setShowModal(true)}>+ Create Notice</button>
        </div>
      </div>

      <div className={styles.controls}>
        <div className={styles.searchBar}>
          <input 
            type="text" 
            placeholder="Search notices by subject..." 
            className={styles.searchInput}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Subject</th>
              <th>Target Department</th>
              <th>Date Posted</th>
              <th>Status</th>
              <th>Posted By</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" style={{textAlign: 'center'}}>Loading notices...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan="6" style={{textAlign: 'center'}}>No notices found.</td></tr>
            ) : (
              filtered.map(n => (
                <tr key={n.id}>
                  <td><strong>{n.subject}</strong></td>
                  <td>{n.targetDepartment}</td>
                  <td>{n.date ? formatDate(n.date, 'short') : '-'}</td>
                  <td>
                    <span className={`${styles.badge} ${getBadgeClass(n.status)}`}>{n.status}</span>
                  </td>
                  <td>{n.postedBy || 'System'}</td>
                  <td>
                    <div className={styles.actionBtns}>
                      {n.status === 'Draft' && <button className={`${styles.btnSmall} ${styles.btnApprove}`} onClick={() => handlePublish(n.id)}>Publish</button>}
                      <button className={`${styles.btnSmall} ${styles.btnOutline}`}>View</button>
                      <button className={`${styles.btnSmall} ${styles.btnDanger}`} onClick={() => handleDelete(n.id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2>Create Internal Notice</h2>
              <button className={styles.closeModal} onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <div className={styles.modalBody}>
              <form id="noticeForm">
                <div className={styles.formGroup}>
                  <label>Subject</label>
                  <input type="text" required value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} />
                </div>
                
                <div className={styles.formGroup}>
                  <label>Target Department</label>
                  <select required value={formData.targetDepartment} onChange={e => setFormData({...formData, targetDepartment: e.target.value})}>
                    <option value="All">All Departments</option>
                    {departments.map(d => (
                      <option key={d.dept_id} value={d.dept_name}>{d.dept_name}</option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label>Content</label>
                  <textarea rows="6" required value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})}></textarea>
                </div>
              </form>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.btnCancel} onClick={() => setShowModal(false)}>Cancel</button>
              <button className={styles.btnOutline} onClick={(e) => handleCreate(e, false)}>Save as Draft</button>
              <button className={styles.btnSave} onClick={(e) => handleCreate(e, true)}>Publish Notice</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HRNotices;
