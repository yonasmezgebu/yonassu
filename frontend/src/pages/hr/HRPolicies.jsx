import React, { useState, useEffect } from 'react';
import hrService from '../../services/hrService';
import { playSuccessSound } from '../../utils/playNotificationSound';
import { formatDate } from '../../utils/formatters';
import styles from './HRPolicies.module.css';

const HRPolicies = () => {
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  
  // Modals
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    policyName: '',
    category: 'Code of Conduct',
    description: '',
    sendToAll: false
  });

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
    try {
      const pId = await hrService.createPolicy({
        ...formData,
        fileName: 'policy_doc.pdf'
      });
      if (publish) {
        await hrService.publishPolicy(pId);
        if (formData.sendToAll) {
          await hrService.sendPolicyToAll(pId);
        }
      }
      playSuccessSound();
      setShowModal(false);
      fetchPolicies();
    } catch (err) {
      alert("Failed to create policy");
    }
  };

  const handlePublish = async (id) => {
    try {
      await hrService.publishPolicy(id);
      playSuccessSound();
      fetchPolicies();
    } catch (err) {
      alert("Failed to publish policy");
    }
  };

  const handleArchive = async (id) => {
    if (!window.confirm("Archive this policy?")) return;
    try {
      await hrService.archivePolicy(id);
      fetchPolicies();
    } catch (err) {
      alert("Failed to archive policy");
    }
  };

  const getBadgeClass = (status) => {
    switch (status) {
      case 'Active': return styles.badgeActive;
      case 'Draft': return styles.badgeDraft;
      case 'Archived': return styles.badgeArchived;
      default: return styles.badgeArchived;
    }
  };

  const filtered = policies.filter(p => {
    const matchSearch = (p.policyName || '').toLowerCase().includes(search.toLowerCase());
    const matchCat = categoryFilter ? p.category === categoryFilter : true;
    return matchSearch && matchCat;
  });

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.pageTitle}>HR Policies</h1>
          <p className={styles.pageSubtitle}>Manage company guidelines and compliance documents</p>
        </div>
        <div className={styles.actionBtns}>
          <button className={styles.exportBtn} onClick={handleExport}>Export List</button>
          <button className={styles.primaryButton} onClick={() => setShowModal(true)}>+ Create Policy</button>
        </div>
      </div>

      <div className={styles.controls}>
        <div className={styles.searchBar}>
          <input 
            type="text" 
            placeholder="Search policies..." 
            className={styles.searchInput}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select className={styles.filterSelect} value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
          <option value="">All Categories</option>
          <option value="Code of Conduct">Code of Conduct</option>
          <option value="Leave Policy">Leave Policy</option>
          <option value="IT & Security">IT & Security</option>
          <option value="Health & Safety">Health & Safety</option>
          <option value="Compensation">Compensation</option>
        </select>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Policy Name</th>
              <th>Category</th>
              <th>Version</th>
              <th>Effective Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" style={{textAlign: 'center'}}>Loading policies...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan="6" style={{textAlign: 'center'}}>No policies found.</td></tr>
            ) : (
              filtered.map(p => (
                <tr key={p.id}>
                  <td><strong>{p.policyName}</strong></td>
                  <td>{p.category}</td>
                  <td>v{p.version}</td>
                  <td>{p.effectiveDate ? formatDate(p.effectiveDate, 'short') : '-'}</td>
                  <td>
                    <span className={`${styles.badge} ${getBadgeClass(p.status)}`}>{p.status}</span>
                  </td>
                  <td>
                    <div className={styles.actionBtns}>
                      {p.status === 'Draft' && <button className={`${styles.btnSmall} ${styles.btnApprove}`} onClick={() => handlePublish(p.id)}>Publish</button>}
                      <button className={`${styles.btnSmall} ${styles.btnOutline}`}>View</button>
                      {p.status === 'Active' && <button className={`${styles.btnSmall} ${styles.btnOutline}`} onClick={() => handleArchive(p.id)}>Archive</button>}
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
              <h2>Create New Policy</h2>
              <button className={styles.closeModal} onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <div className={styles.modalBody}>
              <form id="policyForm">
                <div className={styles.formGroup}>
                  <label>Policy Name</label>
                  <input type="text" required value={formData.policyName} onChange={e => setFormData({...formData, policyName: e.target.value})} />
                </div>
                
                <div className={styles.formGroup}>
                  <label>Category</label>
                  <select required value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                    <option>Code of Conduct</option>
                    <option>Leave Policy</option>
                    <option>IT & Security</option>
                    <option>Health & Safety</option>
                    <option>Compensation</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label>Description</label>
                  <textarea rows="3" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}></textarea>
                </div>

                <div className={styles.formGroup}>
                  <label>Document (PDF/Word)</label>
                  <div className={styles.fileUploadBox}>
                    Click to browse or drag and drop file here
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.checkboxLabel}>
                    <input type="checkbox" checked={formData.sendToAll} onChange={e => setFormData({...formData, sendToAll: e.target.checked})} />
                    Send to All Employees (Auto-generates an Announcement)
                  </label>
                </div>
              </form>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.btnCancel} onClick={() => setShowModal(false)}>Cancel</button>
              <button className={styles.btnOutline} onClick={(e) => handleCreate(e, false)}>Save as Draft</button>
              <button className={styles.btnSave} onClick={(e) => handleCreate(e, true)}>Publish Policy</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HRPolicies;
