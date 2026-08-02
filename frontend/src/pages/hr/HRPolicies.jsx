import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import hrService from '../../services/hrService';
import { playSuccessSound } from '../../utils/playNotificationSound';
import { formatDate } from '../../utils/formatters';
import styles from './HRPolicies.module.css';
import { X, Search, FileText, CheckCircle, Clock } from 'lucide-react';

const HRPolicies = () => {
  const { user } = useAuth();
  const isCEO = user?.role === 'CEO' || user?.roles?.includes('CEO');
  
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Tabs & Filters
  const [activeTab, setActiveTab] = useState('active'); // active, archived
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  
  // In-App Notification (Rule 6)
  const [notif, setNotif] = useState({ type: null, text: '' });

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    category: 'Code of Conduct',
    description: '',
    send_to_all: false,
    acknowledgment_required: false
  });

  const showNotif = (type, text) => {
    setNotif({ type, text });
    setTimeout(() => setNotif({ type: null, text: '' }), 5000);
  };

  const fetchPolicies = async () => {
    try {
      setLoading(true);
      const res = await hrService.getPolicies();
      setPolicies(Array.isArray(res) ? res : res.data?.data?.policies || []);
    } catch (err) {
      console.error("Failed to fetch policies", err);
      if (Array.isArray(err)) setPolicies(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPolicies();
  }, []);

  const handleExport = () => {
    window.open(hrService.getExportUrl('policies'), '_blank');
  };

  const handleCreate = async (e, publish) => {
    e.preventDefault();
    if (!isCEO) return;
    
    try {
      const res = await hrService.createPolicy({
        ...formData,
        file_ref: formData.file ? formData.file.name : 'policy_doc.pdf'
      });
      const pId = res.data?.data?.id || res; // Handle different response formats
      
      if (publish) {
        await hrService.publishPolicy(pId);
        if (formData.send_to_all) {
          await hrService.sendPolicyToAll(pId);
        }
      }
      playSuccessSound();
      showNotif('success', publish ? 'Policy published successfully' : 'Policy saved as draft');
      setShowModal(false);
      setFormData({
        title: '',
        category: 'Code of Conduct',
        description: '',
        send_to_all: false,
        acknowledgment_required: false
      });
      fetchPolicies();
    } catch (err) {
      console.error(err);
      showNotif('error', 'Failed to create policy');
    }
  };

  const handlePublish = async (id) => {
    if (!isCEO) return;
    try {
      await hrService.publishPolicy(id);
      playSuccessSound();
      showNotif('success', 'Policy published successfully');
      fetchPolicies();
    } catch (err) {
      showNotif('error', 'Failed to publish policy');
    }
  };

  const handleArchive = async (id) => {
    if (!isCEO) return;
    // Rule 6: Replace window.confirm with direct action or custom modal, but since it's a simple admin action, 
    // for safety we will execute it directly here with a success notification.
    try {
      await hrService.archivePolicy(id);
      showNotif('success', 'Policy archived successfully');
      fetchPolicies();
    } catch (err) {
      showNotif('error', 'Failed to archive policy');
    }
  };
  
  const handleAcknowledge = async (id) => {
    try {
      await hrService.acknowledgePolicy(id);
      playSuccessSound();
      showNotif('success', 'Policy acknowledged successfully');
      fetchPolicies();
    } catch (err) {
      showNotif('error', 'Failed to acknowledge policy');
    }
  };

  const filtered = policies.filter(p => {
    const isArchived = p.status === 'Archived';
    if (activeTab === 'active' && isArchived) return false;
    if (activeTab === 'archived' && !isArchived) return false;
    
    const matchSearch = (p.title || '').toLowerCase().includes(search.toLowerCase());
    const matchCat = categoryFilter ? p.category === categoryFilter : true;
    return matchSearch && matchCat;
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
            HR <span>Policies</span>
          </h1>
          <p className={styles.pageSubtitle}>
            Manage company guidelines and compliance documents.
          </p>
        </div>

        <div className={styles.headerActions}>
          <button onClick={handleExport} className={styles.exportBtn}>
            Export List
          </button>
          {isCEO && (
            <button onClick={() => setShowModal(true)} className={styles.createBtn}>
              + Create Policy
            </button>
          )}
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
          <div className={styles.tabGroup}>
            <button 
              className={`${styles.tabBtn} ${activeTab === 'active' ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveTab('active')}
            >
              Active &amp; Drafts
            </button>
            <button 
              className={`${styles.tabBtn} ${activeTab === 'archived' ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveTab('archived')}
            >
              Archived
            </button>
          </div>
          
          <div className={styles.filterGroup}>
            <input 
              type="text" 
              placeholder="Search policies..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className={styles.input}
              style={{ width: 250 }}
            />
            <select 
              value={categoryFilter} 
              onChange={e => setCategoryFilter(e.target.value)}
              className={styles.input}
              style={{ width: 200 }}
            >
              <option value="">All Categories</option>
              <option value="Code of Conduct">Code of Conduct</option>
              <option value="Leave Policy">Leave Policy</option>
              <option value="IT & Security">IT & Security</option>
              <option value="Health & Safety">Health & Safety</option>
              <option value="Compensation">Compensation</option>
            </select>
          </div>
        </div>

        {/* Table — Rule 3, 4, 8 */}
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Policy Name</th>
                <th>Category &amp; Version</th>
                <th>Effective Date</th>
                <th>Posted By</th>
                <th className={styles.center}>Status</th>
                <th className={styles.right}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className={styles.loading}>Loading policies...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className={styles.empty}>No policies found.</td></tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div className={styles.policyTitle}>{p.title}</div>
                      {p.acknowledgment_required && (
                        <div className={styles.ackTag}>Requires Ack</div>
                      )}
                    </td>
                    <td>
                      <div className={styles.policyCat}>{p.category}</div>
                      <div className={styles.policyVer}>v{p.version_number}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#1B5E20' }}>
                        {p.effective_date ? formatDate(p.effective_date, 'short') : '—'}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{p.publisher_name || '—'}</div>
                    </td>
                    <td className={styles.center}>
                      <span className={`${styles.statusBadge} ${
                        p.status === 'Published' ? styles.statusPublished : 
                        p.status === 'Draft' ? styles.statusDraft : 
                        styles.statusArchived
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td>
                      <div className={styles.actionsList}>
                        {isCEO && p.status === 'Draft' && (
                          <button className={`${styles.actionBtn} ${styles.actionBtnPub}`} onClick={() => handlePublish(p.id)}>Publish</button>
                        )}
                        <button 
                          className={`${styles.actionBtn} ${styles.actionBtnView}`}
                          onClick={() => window.open(p.file_ref ? (p.file_ref.startsWith('/') ? p.file_ref : `/uploads/documents/${p.file_ref}`) : '#', '_blank')}
                        >
                          View PDF
                        </button>
                        
                        {!isCEO && p.status === 'Published' && p.acknowledgment_required && (
                          <button className={`${styles.actionBtn} ${styles.actionBtnAck}`} onClick={() => handleAcknowledge(p.id)}>Acknowledge</button>
                        )}
                        
                        {isCEO && p.status === 'Published' && (
                          <button className={`${styles.actionBtn} ${styles.actionBtnArch}`} onClick={() => handleArchive(p.id)}>Archive</button>
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

      {/* ── MODAL (Rule 10, 14, 17) ── */}
      {showModal && isCEO && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalWide}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Create New Policy</h2>
              <button className={styles.closeBtn} onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            
            <div className={styles.modalBody}>
              <div className={styles.formGroup}>
                <label>Policy Name (Title)</label>
                <input 
                  type="text" 
                  className={styles.input} 
                  required 
                  value={formData.title} 
                  onChange={e => setFormData({...formData, title: e.target.value})} 
                  placeholder="e.g. Employee Code of Conduct 2024"
                />
              </div>
              
              <div className={styles.formGroup}>
                <label>Category</label>
                <select 
                  className={styles.input} 
                  required 
                  value={formData.category} 
                  onChange={e => setFormData({...formData, category: e.target.value})}
                >
                  <option>Code of Conduct</option>
                  <option>Leave Policy</option>
                  <option>IT &amp; Security</option>
                  <option>Health &amp; Safety</option>
                  <option>Compensation</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>Description</label>
                <textarea 
                  className={styles.input} 
                  value={formData.description} 
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  placeholder="Brief summary of what this policy covers..."
                />
              </div>

              <div className={styles.formGroup}>
                <label>Document (PDF/Word)</label>
                <div className={styles.fileUploadBox} onClick={() => document.getElementById('policyFileInput').click()}>
                  {formData.file ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: '#228B22' }}>
                      <CheckCircle size={16} /> {formData.file.name}
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                      <FileText size={16} /> Click to browse or drag and drop file here
                    </div>
                  )}
                  <input 
                    type="file" 
                    id="policyFileInput" 
                    style={{display: 'none'}} 
                    onChange={e => setFormData({...formData, file: e.target.files[0]})}
                  />
                </div>
              </div>

              <div className={styles.formGroup} style={{ marginTop: 8 }}>
                <label className={styles.checkboxLabel}>
                  <input type="checkbox" checked={formData.acknowledgment_required} onChange={e => setFormData({...formData, acknowledgment_required: e.target.checked})} />
                  Require Employee Acknowledgment
                </label>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.checkboxLabel}>
                  <input type="checkbox" checked={formData.send_to_all} onChange={e => setFormData({...formData, send_to_all: e.target.checked})} />
                  Send Announcement to All Employees
                </label>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button className={styles.cancelBtn} onClick={() => setShowModal(false)}>Cancel</button>
              <button className={styles.draftBtn} onClick={(e) => handleCreate(e, false)}>Save as Draft</button>
              <button className={styles.saveBtn} onClick={(e) => handleCreate(e, true)}>Publish Policy</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HRPolicies;
