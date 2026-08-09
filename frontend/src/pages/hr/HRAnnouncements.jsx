import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import hrService from '../../services/hrService';
import { playSuccessSound } from '../../utils/playNotificationSound';
import { formatDate } from '../../utils/formatters';
import styles from './HRAnnouncements.module.css';
import { X, Search } from 'lucide-react';

const HRAnnouncements = () => {
  const { user } = useAuth();
  const isCEO = user?.role === 'CEO' || user?.roles?.includes('CEO');
  
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [search, setSearch] = useState('');
  
  // In-App Notification (Rule 6)
  const [notif, setNotif] = useState({ type: null, text: '' });
  
  // Modals
  const [showModal, setShowModal] = useState(false);
  const [viewModal, setViewModal] = useState(null);
  
  const [formData, setFormData] = useState({
    title: '',
    body: '',
    priority: 'Normal',
    audience_scope: 'All Employees',
    status: 'Published'
  });

  const showNotif = (type, text) => {
    setNotif({ type, text });
    setTimeout(() => setNotif({ type: null, text: '' }), 5000);
  };

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
    if (!isCEO) return;
    try {
      await hrService.createAnnouncement({
        title: formData.title,
        body: formData.body,
        priority: formData.priority,
        audience_scope: JSON.stringify({ type: formData.audience_scope }),
        status: formData.status
      });
      playSuccessSound();
      showNotif('success', 'Announcement published successfully');
      setShowModal(false);
      setFormData({
        title: '',
        body: '',
        priority: 'Normal',
        audience_scope: 'All Employees',
        status: 'Published'
      });
      fetchAnnouncements();
    } catch (err) {
      showNotif('error', 'Failed to create announcement');
    }
  };

  const handleDelete = async (id) => {
    if (!isCEO) return;
    try {
      await hrService.deleteAnnouncement(id);
      showNotif('success', 'Announcement deleted');
      fetchAnnouncements();
    } catch (err) {
      showNotif('error', 'Failed to delete announcement');
    }
  };
  
  const handleRetract = async (id) => {
    if (!isCEO) return;
    try {
      await hrService.retractAnnouncement(id);
      showNotif('success', 'Announcement retracted');
      fetchAnnouncements();
    } catch (err) {
      showNotif('error', 'Failed to retract announcement');
    }
  };

  const handleView = async (announcement) => {
    setViewModal(announcement);
    try {
      await hrService.readAnnouncement(announcement.id);
    } catch (err) {
      console.error("Failed to mark as read", err);
    }
  };

  const getBadgeClass = (priority) => {
    switch (priority) {
      case 'Normal':
      case 'Info': return styles.prioNormal;
      case 'Important': return styles.prioImportant;
      case 'Urgent': return styles.prioUrgent;
      default: return styles.prioNormal;
    }
  };
  
  const filtered = announcements.filter(a => {
    const matchSearch = (a.title || '').toLowerCase().includes(search.toLowerCase());
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
            Company <span>Announcements</span>
          </h1>
          <p className={styles.pageSubtitle}>
            Broadcast company-wide news, updates, and events.
          </p>
        </div>

        <div className={styles.headerActions}>
          <button onClick={handleExport} className={styles.exportBtn}>
            Export List
          </button>
          {isCEO && (
            <button onClick={() => setShowModal(true)} className={styles.createBtn}>
              + New Announcement
            </button>
          )}
        </div>
      </div>

      {/* ── NOTIFICATIONS ── */}
      {notif.type && (
        <div className={`${styles.notification} ${notif.type === 'success' ? styles.notifSuccess : styles.notifError}`}>
          <span>{notif.type === 'success' ? '✅' : '⚠️'} {notif.text}</span>
          <button className={styles.notifDismiss} onClick={() => setNotif({ type: null, text: '' })}>×</button>
        </div>
      )}

      {/* ── BODY AREA ── */}
      <div className={styles.bodyArea}>
        
        {/* Controls Bar */}
        <div className={styles.controlsBar}>
          <div className={styles.countLabel}>
            {filtered.length} announcement(s) found
          </div>
          
          <div className={styles.filterGroup}>
            <input 
              type="text" 
              placeholder="Search announcements..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className={styles.input}
              style={{ minWidth: 200 }}
            />
          </div>
        </div>

        {/* Table — Rule 3, 4, 8 */}
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Title</th>
                {isCEO && <th>Status</th>}
                <th>Priority</th>
                <th>Posted By</th>
                <th>Posted Date</th>
                <th className={styles.right}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={isCEO ? 6 : 5}>
                    <div className={styles.loading}>
                      <span className={styles.segSpinnerLg} aria-hidden="true" />
                      <span>Loading announcements...</span>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={isCEO ? 6 : 5} className={styles.empty}>No announcements found.</td></tr>
              ) : (
                filtered.map((a) => (
                  <tr key={a.id}>
                    <td>
                      <div className={styles.titleCell}>{a.title}</div>
                      {a.linked_policy_id && (
                        <div className={styles.updateTag}>Policy Update</div>
                      )}
                    </td>
                    {isCEO && (
                      <td>
                        <span className={`${styles.badgeBadge} ${
                          a.status === 'Published' ? styles.statusPublished : 
                          a.status === 'Draft' ? styles.statusDraft : 
                          styles.statusRetracted
                        }`}>
                          {a.status}
                        </span>
                      </td>
                    )}
                    <td>
                      <span className={`${styles.badgeBadge} ${
                        a.priority === 'Urgent' ? styles.prioUrgent :
                        a.priority === 'Important' ? styles.prioImportant :
                        a.priority === 'Info' ? styles.prioInfo : styles.prioNormal
                      }`}>
                        {a.priority}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>{a.author_name || '—'}</div>
                    </td>
                    <td>
                      <div className={styles.textMuted}>
                        {a.created_at ? formatDate(a.created_at, 'short') : '—'}
                      </div>
                    </td>
                    <td>
                      <div className={styles.actionsList}>
                        <button className={`${styles.actionBtn} ${styles.actionBtnView}`} onClick={() => handleView(a)}>View</button>
                        
                        {isCEO && a.status === 'Published' && (
                          <button className={`${styles.actionBtn} ${styles.actionBtnArch}`} onClick={() => handleRetract(a.id)}>Retract</button>
                        )}
                        
                        {isCEO && (
                          <button className={`${styles.actionBtn} ${styles.actionBtnArch}`} onClick={() => handleDelete(a.id)}>Delete</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── CREATE MODAL ── */}
      {showModal && isCEO && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Create Announcement</h2>
              <button className={styles.closeBtn} onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            
            <div className={styles.modalBody}>
              <form id="announcementForm" onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div className={styles.formGroup}>
                  <label>Title</label>
                  <input 
                    type="text" 
                    className={styles.input} 
                    required 
                    value={formData.title} 
                    onChange={e => setFormData({...formData, title: e.target.value})} 
                    placeholder="e.g. End of Year Townhall Meeting"
                  />
                </div>
                
                <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                  <div className={styles.formGroup} style={{ flex: 1, minWidth: '200px' }}>
                    <label>Target Audience</label>
                    <select 
                      className={styles.input} 
                      required 
                      value={formData.audience_scope} 
                      onChange={e => setFormData({...formData, audience_scope: e.target.value})}
                    >
                      <option>All Employees</option>
                      <option>Managers Only</option>
                      <option>Specific Department</option>
                    </select>
                  </div>
                  <div className={styles.formGroup} style={{ flex: 1, minWidth: '200px' }}>
                    <label>Priority</label>
                    <select 
                      className={styles.input} 
                      required 
                      value={formData.priority} 
                      onChange={e => setFormData({...formData, priority: e.target.value})}
                    >
                      <option>Info</option>
                      <option>Normal</option>
                      <option>Important</option>
                      <option>Urgent</option>
                    </select>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label>Content / Body</label>
                  <textarea 
                    className={styles.input} 
                    required 
                    value={formData.body} 
                    onChange={e => setFormData({...formData, body: e.target.value})}
                    placeholder="Type the announcement details here..."
                  />
                </div>
              </form>
            </div>

            <div className={styles.modalFooter}>
              <button className={styles.cancelBtn} onClick={() => setShowModal(false)}>Cancel</button>
              <button type="submit" form="announcementForm" className={styles.publishFormBtn}>Post Announcement</button>
            </div>
          </div>
        </div>
      )}
      
      {/* ── VIEW MODAL ── */}
      {viewModal && (
        <div className={styles.modalOverlay}>
          <div className={`${styles.modal} ${styles.modalView}`}>
            <div className={styles.modalHeader}>
              <h2 className={styles.viewTitle} style={{ margin: 0 }}>{viewModal.title}</h2>
              <button className={styles.closeBtn} onClick={() => setViewModal(null)}><X size={20} /></button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.viewMeta}>
                <div className={styles.viewMetaItem}>
                  <strong>Posted:</strong> {formatDate(viewModal.created_at, 'long')}
                </div>
                <div className={styles.viewMetaItem}>
                  <strong>Priority:</strong> <span className={`${styles.badgeBadge} ${getBadgeClass(viewModal.priority)}`}>{viewModal.priority}</span>
                </div>
              </div>
              <div className={styles.viewBody}>
                {viewModal.body}
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

export default HRAnnouncements;
