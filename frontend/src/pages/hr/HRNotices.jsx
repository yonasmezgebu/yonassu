import React, { useState, useEffect } from 'react';
import hrService from '../../services/hrService';
import { playSuccessSound } from '../../utils/playNotificationSound';
import { formatDate } from '../../utils/formatters';
import styles from './HRNotices.module.css';
import { X, Search } from 'lucide-react';

const HRNotices = () => {
  const [notices, setNotices] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [search, setSearch] = useState('');
  
  // In-App Notification (Rule 6)
  const [notif, setNotif] = useState({ type: null, text: '' });
  
  // Modals
  const [showModal, setShowModal] = useState(false);
  const [viewModal, setViewModal] = useState(null);

  const [formData, setFormData] = useState({
    subject: '',
    targetDepartment: 'All',
    content: ''
  });

  const showNotif = (type, text) => {
    setNotif({ type, text });
    setTimeout(() => setNotif({ type: null, text: '' }), 5000);
  };

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
      showNotif('success', publish ? 'Notice published successfully' : 'Notice saved as draft');
      setShowModal(false);
      setFormData({
        subject: '',
        targetDepartment: 'All',
        content: ''
      });
      fetchNotices();
    } catch (err) {
      showNotif('error', 'Failed to create notice');
    }
  };

  const handlePublish = async (id) => {
    try {
      await hrService.publishNotice(id);
      playSuccessSound();
      showNotif('success', 'Notice published successfully');
      fetchNotices();
    } catch (err) {
      showNotif('error', 'Failed to publish notice');
    }
  };

  const handleDelete = async (id) => {
    try {
      await hrService.deleteNotice(id);
      showNotif('success', 'Notice deleted successfully');
      fetchNotices();
    } catch (err) {
      showNotif('error', 'Failed to delete notice');
    }
  };

  const filtered = notices.filter(n => {
    const matchSearch = (n.subject || '').toLowerCase().includes(search.toLowerCase());
    return matchSearch;
  });

  return (
    <div className={styles.container}>
      {/* ── HEADER — Rule 2, 12, 13 ── */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.badge}>
            <span className={styles.badgeDot} />
            <span className={styles.badgeTxt}>Documents &amp; Comms</span>
          </div>
          <h1 className={styles.pageTitle}>
            Internal <span>Notices</span>
          </h1>
          <p className={styles.pageSubtitle}>
            Draft and publish memos and department-specific notices
          </p>
        </div>

        <div className={styles.headerActions}>
          <button onClick={handleExport} className={styles.exportBtn}>
            Export List
          </button>
          <button onClick={() => setShowModal(true)} className={styles.createBtn}>
            + Create Notice
          </button>
        </div>
      </div>

      {/* ── NOTIFICATIONS — Rule 6 ── */}
      {notif.text && (
        <div className={`${styles.notification} ${notif.type === 'success' ? styles.notifSuccess : styles.notifError}`}>
          <span>{notif.text}</span>
          <button className={styles.notifDismiss} onClick={() => setNotif({ type: null, text: '' })}>&times;</button>
        </div>
      )}

      {/* ── BODY AREA ── */}
      <div className={styles.bodyArea}>
        
        {/* Controls Bar */}
        <div className={styles.controlsBar}>
          <div className={styles.countLabel}>
            {filtered.length} notice(s) found
          </div>
          
          <div className={styles.filterGroup}>
            <input 
              type="text" 
              placeholder="Search notices by subject..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className={styles.input}
              style={{ width: 280 }}
            />
          </div>
        </div>

        {/* Table — Rule 3, 4, 8 */}
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Subject</th>
                <th>Target Department</th>
                <th>Date Posted</th>
                <th className={styles.center}>Status</th>
                <th>Posted By</th>
                <th className={styles.right}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className={styles.loading}>Loading notices...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className={styles.empty}>No notices found.</td></tr>
              ) : (
                filtered.map((n) => (
                  <tr key={n.id}>
                    <td>
                      <div className={styles.subjectTitle}>{n.subject}</div>
                    </td>
                    <td>
                      <div className={styles.deptSub}>{n.targetDepartment}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#424242' }}>
                        {n.date ? formatDate(n.date, 'short') : '—'}
                      </div>
                    </td>
                    <td className={styles.center}>
                      <span className={`${styles.statusBadge} ${n.status === 'Published' ? styles.statusPublished : n.status === 'Draft' ? styles.statusDraft : styles.statusArchived}`}>
                        {n.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{n.postedBy || 'System'}</div>
                    </td>
                    <td>
                      <div className={styles.actionsList}>
                        {n.status === 'Draft' && (
                          <button className={`${styles.actionBtn} ${styles.actionBtnPub}`} onClick={() => handlePublish(n.id)}>Publish</button>
                        )}
                        <button className={`${styles.actionBtn} ${styles.actionBtnView}`} onClick={() => setViewModal(n)}>View</button>
                        <button className={`${styles.actionBtn} ${styles.actionBtnDel}`} onClick={() => handleDelete(n.id)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── CREATE MODAL (Rule 10, 14, 17) ── */}
      {showModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalWide}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Create Internal Notice</h2>
              <button className={styles.closeBtn} onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            
            <div className={styles.modalBody}>
              <form id="noticeForm" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div className={styles.formGroup}>
                  <label>Subject</label>
                  <input 
                    type="text" 
                    className={styles.input} 
                    required 
                    value={formData.subject} 
                    onChange={e => setFormData({...formData, subject: e.target.value})} 
                    placeholder="e.g. Server Maintenance Schedule"
                  />
                </div>
                
                <div className={styles.formGroup}>
                  <label>Target Department</label>
                  <select 
                    className={styles.input} 
                    required 
                    value={formData.targetDepartment} 
                    onChange={e => setFormData({...formData, targetDepartment: e.target.value})}
                  >
                    <option value="All">All Departments</option>
                    {departments.map(d => (
                      <option key={d.dept_id} value={d.dept_name}>{d.dept_name}</option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label>Content</label>
                  <textarea 
                    className={styles.input} 
                    required 
                    value={formData.content} 
                    onChange={e => setFormData({...formData, content: e.target.value})}
                    placeholder="Type the notice details here..."
                  />
                </div>
              </form>
            </div>

            <div className={styles.modalFooter}>
              <button className={styles.cancelBtn} onClick={() => setShowModal(false)}>Cancel</button>
              <button className={styles.draftBtn} onClick={(e) => handleCreate(e, false)}>Save as Draft</button>
              <button className={styles.saveBtn} onClick={(e) => handleCreate(e, true)}>Publish Notice</button>
            </div>
          </div>
        </div>
      )}

      {/* ── VIEW MODAL (Rule 10, 14, 17) ── */}
      {viewModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalWide}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle} style={{ textTransform: 'none', fontSize: 20 }}>{viewModal.subject}</h2>
              <button className={styles.closeBtn} onClick={() => setViewModal(null)}><X size={20} /></button>
            </div>
            <div className={styles.modalBody}>
              <div style={{ marginBottom: '8px', color: '#6B8E23', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 12 }}>
                <span>Posted on {viewModal.date ? formatDate(viewModal.date, 'long') : '—'}</span>
                <span>To: {viewModal.targetDepartment}</span>
              </div>
              <div style={{ lineHeight: '1.6', whiteSpace: 'pre-wrap', color: '#424242', fontSize: '14px', background: '#F5F5F5', padding: 24, border: '1px solid #8D6E63' }}>
                {viewModal.content}
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.cancelBtn} onClick={() => setViewModal(null)}>Close Window</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HRNotices;
