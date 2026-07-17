import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import hrService from '../../services/hrService';
import { playSuccessSound } from '../../utils/playNotificationSound';
import { formatDate } from '../../utils/formatters';
import styles from './HRAnnouncements.module.css';

const HRAnnouncements = () => {
  const { user } = useAuth();
  const isCEO = user?.role === 'CEO' || user?.roles?.includes('CEO');
  
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [search, setSearch] = useState('');
  
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
      setShowModal(false);
      fetchAnnouncements();
    } catch (err) {
      alert("Failed to create announcement");
    }
  };

  const handleDelete = async (id) => {
    if (!isCEO) return;
    if (!window.confirm("Delete this announcement?")) return;
    try {
      await hrService.deleteAnnouncement(id);
      fetchAnnouncements();
    } catch (err) {
      alert("Failed to delete announcement");
    }
  };
  
  const handleRetract = async (id) => {
    if (!isCEO) return;
    if (!window.confirm("Retract this announcement? It will no longer be visible to general staff.")) return;
    try {
      await hrService.retractAnnouncement(id);
      fetchAnnouncements();
    } catch (err) {
      alert("Failed to retract announcement");
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
      case 'Info': return styles.badgeNormal;
      case 'Important': return styles.badgeImportant;
      case 'Urgent': return styles.badgeUrgent;
      default: return styles.badgeNormal;
    }
  };
  
  const getStatusBadge = (status) => {
    switch (status) {
      case 'Published': return styles.badgeActive;
      case 'Retracted': return styles.badgeArchived;
      case 'Draft': return styles.badgeDraft;
      default: return styles.badgeNormal;
    }
  };

  const filtered = announcements.filter(a => {
    const matchSearch = (a.title || '').toLowerCase().includes(search.toLowerCase());
    return matchSearch;
  });

  return (
    <div className={styles.container} style={{ margin: 0, padding: 0 }}>
      {/* ══ WORLD-CLASS HERO HEADER — ANNOUNCEMENTS ══ */}
      <div style={{
        position: 'relative',
        background: 'linear-gradient(135deg, #2e1065 0%, #4c1d95 40%, #7e22ce 70%, #a855f7 100%)',
        borderRadius: 0,
        padding: '36px 24px 40px',
        overflow: 'hidden',
        marginBottom: '24px',
      }}>
        {/* Glowing orbs */}
        <div style={{ position: 'absolute', top: -40, right: -20, width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(circle, rgba(216,180,254,0.3) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -50, left: 60, width: 220, height: 220, borderRadius: '50%', background: 'radial-gradient(circle, rgba(233,213,255,0.2) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '40px 40px', pointerEvents: 'none' }} />

        {/* Top Header Row */}
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(250,245,255,0.2)', border: '1px solid rgba(250,245,255,0.4)', borderRadius: 20, padding: '4px 14px', marginBottom: 14 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#e9d5ff', display: 'inline-block', boxShadow: '0 0 8px #e9d5ff' }} />
              <span style={{ color: '#faf5ff', fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Documents & Comms</span>
            </div>
            <h1 style={{ margin: '0 0 8px', fontSize: 38, fontWeight: 900, color: '#ffffff', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
              Company
              <span style={{ background: 'linear-gradient(90deg, #e9d5ff, #faf5ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginLeft: 12 }}>Announcements</span>
            </h1>
            <p style={{ margin: 0, color: '#e9d5ff', fontSize: 15, fontWeight: 400, opacity: 0.9 }}>
              Broadcast company-wide news, updates, and events.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={handleExport} style={{ padding: '12px 20px', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 12, cursor: 'pointer', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: 8, backdropFilter: 'blur(8px)', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.25)'} onMouseLeave={e => e.currentTarget.style.background='rgba(255,255,255,0.15)'}>
              Export List
            </button>
            {isCEO && (
              <button onClick={() => setShowModal(true)} style={{ padding: '12px 20px', background: '#ffffff', border: 'none', borderRadius: 12, cursor: 'pointer', fontWeight: 800, color: '#7e22ce', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 15px rgba(0,0,0,0.1)', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform='translateY(-2px)'} onMouseLeave={e => e.currentTarget.style.transform='translateY(0)'}>
                + New Announcement
              </button>
            )}
          </div>
        </div>
      </div>

      <div style={{ padding: '0 24px 40px' }}>
        {/* Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, background: '#f8fafc', padding: '16px 24px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '14px', color: '#64748b', fontWeight: 600 }}>
            {filtered.length} announcement(s) found
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            <input 
              type="text" 
              placeholder="Search announcements..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ padding: '10px 16px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', width: 280, outline: 'none' }}
            />
          </div>
        </div>

        <div style={{ 
          background: '#ffffff', 
          borderRadius: '24px', 
          boxShadow: '0 12px 40px rgba(0,0,0,0.03)', 
          overflow: 'hidden', 
          border: '1px solid rgba(226, 232, 240, 0.8)',
          fontFamily: "'Inter', sans-serif"
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '24px 32px', fontWeight: 700, color: '#64748b', fontSize: '12px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Title</th>
                {isCEO && <th style={{ padding: '24px 20px', fontWeight: 700, color: '#64748b', fontSize: '12px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Status</th>}
                <th style={{ padding: '24px 20px', fontWeight: 700, color: '#64748b', fontSize: '12px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Priority</th>
                <th style={{ padding: '24px 20px', fontWeight: 700, color: '#64748b', fontSize: '12px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Posted By</th>
                <th style={{ padding: '24px 20px', fontWeight: 700, color: '#64748b', fontSize: '12px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Posted Date</th>
                <th style={{ padding: '24px 32px', fontWeight: 700, color: '#64748b', fontSize: '12px', letterSpacing: '0.06em', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={isCEO ? 6 : 5} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: 16 }}>Loading announcements...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={isCEO ? 6 : 5} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: 16 }}>No announcements found.</td></tr>
              ) : (
                filtered.map((a, index) => (
                  <tr key={a.id}
                      style={{ 
                        borderBottom: '1px solid #f1f5f9',
                        transition: 'all 0.2s ease',
                        background: index % 2 === 0 ? '#ffffff' : '#fafafa',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = '#faf5ff'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = index % 2 === 0 ? '#ffffff' : '#fafafa'; }}
                  >
                    <td style={{ padding: '20px 32px' }}>
                      <div style={{ fontWeight: 800, color: '#1e293b', fontSize: '15px' }}>{a.title}</div>
                      {a.linked_policy_id && (
                        <div style={{ display: 'inline-block', marginTop: 4, padding: '2px 8px', background: '#e0e7ff', color: '#3730a3', borderRadius: 4, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Policy Update</div>
                      )}
                    </td>
                    {isCEO && (
                      <td style={{ padding: '20px 20px' }}>
                        <span style={{ 
                          padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
                          background: a.status === 'Published' ? '#dcfce7' : a.status === 'Draft' ? '#fef9c3' : '#f1f5f9',
                          color: a.status === 'Published' ? '#166534' : a.status === 'Draft' ? '#854d0e' : '#475569'
                        }}>
                          {a.status}
                        </span>
                      </td>
                    )}
                    <td style={{ padding: '20px 20px' }}>
                      <span style={{ 
                        padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
                        background: a.priority === 'Urgent' ? '#fee2e2' : a.priority === 'Important' ? '#ffedd5' : '#f1f5f9',
                        color: a.priority === 'Urgent' ? '#991b1b' : a.priority === 'Important' ? '#9a3412' : '#475569'
                      }}>
                        {a.priority}
                      </span>
                    </td>
                    <td style={{ padding: '20px 20px' }}>
                      <div style={{ fontWeight: 500, color: '#475569', fontSize: '14px' }}>{a.author_name || '—'}</div>
                    </td>
                    <td style={{ padding: '20px 20px' }}>
                      <div style={{ fontWeight: 500, color: '#475569', fontSize: '14px' }}>{a.created_at ? formatDate(a.created_at, 'short') : '—'}</div>
                    </td>
                    <td style={{ padding: '20px 32px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                        <button onClick={() => handleView(a)} style={{ padding: '6px 12px', background: '#ffffff', color: '#9333ea', border: '1px solid #e9d5ff', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>View</button>
                        
                        {isCEO && a.status === 'Published' && (
                          <button onClick={() => handleRetract(a.id)} style={{ padding: '6px 12px', background: '#fef3c7', color: '#92400e', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>Retract</button>
                        )}
                        
                        {isCEO && (
                          <button onClick={() => handleDelete(a.id)} style={{ padding: '6px 12px', background: '#fee2e2', color: '#b91c1c', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>Delete</button>
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

      {showModal && isCEO && (
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
                    <select required value={formData.audience_scope} onChange={e => setFormData({...formData, audience_scope: e.target.value})}>
                      <option>All Employees</option>
                      <option>Managers Only</option>
                      <option>Specific Department</option>
                    </select>
                  </div>
                  <div className={styles.formGroup} style={{flex: 1}}>
                    <label>Priority</label>
                    <select required value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value})}>
                      <option>Info</option>
                      <option>Normal</option>
                      <option>Important</option>
                      <option>Urgent</option>
                    </select>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label>Content / Body</label>
                  <textarea rows="6" required value={formData.body} onChange={e => setFormData({...formData, body: e.target.value})}></textarea>
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
      
      {viewModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2>{viewModal.title}</h2>
              <button className={styles.closeModal} onClick={() => setViewModal(null)}>&times;</button>
            </div>
            <div className={styles.modalBody}>
              <div style={{marginBottom: '1rem', color: '#666', fontSize: '0.9rem'}}>
                <span>Posted on {formatDate(viewModal.created_at, 'long')}</span>
                <span style={{marginLeft: '15px'}} className={`${styles.badge} ${getBadgeClass(viewModal.priority)}`}>{viewModal.priority}</span>
              </div>
              <div style={{lineHeight: '1.6', whiteSpace: 'pre-wrap'}}>
                {viewModal.body}
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.btnSave} onClick={() => setViewModal(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HRAnnouncements;
