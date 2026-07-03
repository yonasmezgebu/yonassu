import React, { useState, useEffect } from 'react';
import hrService from '../../services/hrService';
import { playSuccessSound } from '../../utils/playNotificationSound';
import { formatDate } from '../../utils/formatters';
import styles from './HRAnnouncements.module.css';

const HRAnnouncements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [search, setSearch] = useState('');
  
  // Modals
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    importance: 'Normal',
    targetAudience: 'All Employees'
  });

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const res = await hrService.getAnnouncements();
      setAnnouncements(Array.isArray(res) ? res : res.data?.data?.announcements || []);
    } catch (err) {
      console.error("Failed to fetch announcements", err);
      if (Array.isArray(err)) setAnnouncements(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleExport = () => {
    window.open(hrService.getExportUrl('announcements'), '_blank');
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await hrService.createAnnouncement(formData);
      playSuccessSound();
      setShowModal(false);
      fetchAnnouncements();
    } catch (err) {
      alert("Failed to create announcement");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this announcement?")) return;
    try {
      await hrService.deleteAnnouncement(id);
      fetchAnnouncements();
    } catch (err) {
      alert("Failed to delete announcement");
    }
  };

  const getBadgeClass = (importance) => {
    switch (importance) {
      case 'Normal': return styles.badgeNormal;
      case 'Important': return styles.badgeImportant;
      case 'Urgent': return styles.badgeUrgent;
      default: return styles.badgeNormal;
    }
  };

  const filtered = announcements.filter(a => {
    const matchSearch = (a.title || '').toLowerCase().includes(search.toLowerCase());
    return matchSearch;
  });

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.pageTitle}>Announcements</h1>
          <p className={styles.pageSubtitle}>Broadcast company-wide news, updates, and events</p>
        </div>
        <div className={styles.actionBtns}>
          <button className={styles.exportBtn} onClick={handleExport}>Export List</button>
          <button className={styles.primaryButton} onClick={() => setShowModal(true)}>+ New Announcement</button>
        </div>
      </div>

      <div className={styles.controls}>
        <div className={styles.searchBar}>
          <input 
            type="text" 
            placeholder="Search announcements..." 
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
              <th>Title</th>
              <th>Target Audience</th>
              <th>Importance</th>
              <th>Posted Date</th>
              <th>Reads</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" style={{textAlign: 'center'}}>Loading announcements...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan="6" style={{textAlign: 'center'}}>No announcements found.</td></tr>
            ) : (
              filtered.map(a => (
                <tr key={a.id}>
                  <td><strong>{a.title}</strong></td>
                  <td>{a.targetAudience}</td>
                  <td>
                    <span className={`${styles.badge} ${getBadgeClass(a.importance)}`}>{a.importance}</span>
                  </td>
                  <td>{a.postedDate ? formatDate(a.postedDate, 'short') : '-'}</td>
                  <td>{a.readCount || 0}</td>
                  <td>
                    <div className={styles.actionBtns}>
                      <button className={`${styles.btnSmall} ${styles.btnOutline}`}>View</button>
                      <button className={`${styles.btnSmall} ${styles.btnDanger}`} onClick={() => handleDelete(a.id)}>Delete</button>
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
              <h2>Create Announcement</h2>
              <button className={styles.closeModal} onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <div className={styles.modalBody}>
              <form id="announcementForm" onSubmit={handleCreate}>
                <div className={styles.formGroup}>
                  <label>Title</label>
                  <input type="text" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                </div>
                
                <div style={{display: 'flex', gap: '16px'}}>
                  <div className={styles.formGroup} style={{flex: 1}}>
                    <label>Target Audience</label>
                    <select required value={formData.targetAudience} onChange={e => setFormData({...formData, targetAudience: e.target.value})}>
                      <option>All Employees</option>
                      <option>Managers Only</option>
                      <option>Specific Department</option>
                    </select>
                  </div>
                  <div className={styles.formGroup} style={{flex: 1}}>
                    <label>Importance</label>
                    <select required value={formData.importance} onChange={e => setFormData({...formData, importance: e.target.value})}>
                      <option>Normal</option>
                      <option>Important</option>
                      <option>Urgent</option>
                    </select>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label>Content</label>
                  <textarea rows="6" required value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})}></textarea>
                </div>
              </form>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.btnCancel} onClick={() => setShowModal(false)}>Cancel</button>
              <button type="submit" form="announcementForm" className={styles.btnSave}>Post Announcement</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HRAnnouncements;
