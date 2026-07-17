import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import hrService from '../../services/hrService';
import { playSuccessSound } from '../../utils/playNotificationSound';
import { formatDate } from '../../utils/formatters';
import styles from './HRPolicies.module.css';

const HRPolicies = () => {
  const { user } = useAuth();
  const isCEO = user?.role === 'CEO' || user?.roles?.includes('CEO');
  
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Tabs & Filters
  const [activeTab, setActiveTab] = useState('active'); // active, archived
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  
  // Modals
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    category: 'Code of Conduct',
    description: '',
    send_to_all: false,
    acknowledgment_required: false
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
      setShowModal(false);
      fetchPolicies();
    } catch (err) {
      console.error(err);
      alert("Failed to create policy");
    }
  };

  const handlePublish = async (id) => {
    if (!isCEO) return;
    try {
      await hrService.publishPolicy(id);
      playSuccessSound();
      fetchPolicies();
    } catch (err) {
      alert("Failed to publish policy");
    }
  };

  const handleArchive = async (id) => {
    if (!isCEO) return;
    if (!window.confirm("Archive this policy?")) return;
    try {
      await hrService.archivePolicy(id);
      fetchPolicies();
    } catch (err) {
      alert("Failed to archive policy");
    }
  };
  
  const handleAcknowledge = async (id) => {
    try {
      await hrService.acknowledgePolicy(id);
      playSuccessSound();
      alert("Policy acknowledged successfully");
      fetchPolicies(); // refresh to show acknowledged state if added in backend
    } catch (err) {
      alert("Failed to acknowledge policy");
    }
  };

  const getBadgeClass = (status) => {
    switch (status) {
      case 'Published': return styles.badgeActive;
      case 'Draft': return styles.badgeDraft;
      case 'Archived': return styles.badgeArchived;
      default: return styles.badgeArchived;
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
    <div className={styles.container} style={{ margin: 0, padding: 0 }}>
      {/* ══ WORLD-CLASS HERO HEADER — HR POLICIES ══ */}
      <div style={{
        position: 'relative',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 40%, #312e81 70%, #4338ca 100%)',
        borderRadius: 0,
        padding: '36px 24px 40px',
        overflow: 'hidden',
        marginBottom: '24px',
      }}>
        {/* Glowing orbs */}
        <div style={{ position: 'absolute', top: -40, right: -20, width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(circle, rgba(129,140,248,0.3) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -50, left: 60, width: 220, height: 220, borderRadius: '50%', background: 'radial-gradient(circle, rgba(199,210,254,0.2) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '40px 40px', pointerEvents: 'none' }} />

        {/* Top Header Row */}
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(238,242,255,0.2)', border: '1px solid rgba(238,242,255,0.4)', borderRadius: 20, padding: '4px 14px', marginBottom: 14 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#c7d2fe', display: 'inline-block', boxShadow: '0 0 8px #c7d2fe' }} />
              <span style={{ color: '#e0e7ff', fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Documents & Comms</span>
            </div>
            <h1 style={{ margin: '0 0 8px', fontSize: 38, fontWeight: 900, color: '#ffffff', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
              HR
              <span style={{ background: 'linear-gradient(90deg, #c7d2fe, #e0e7ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginLeft: 12 }}>Policies</span>
            </h1>
            <p style={{ margin: 0, color: '#c7d2fe', fontSize: 15, fontWeight: 400, opacity: 0.9 }}>
              Manage company guidelines and compliance documents.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={handleExport} style={{ padding: '12px 20px', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 12, cursor: 'pointer', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: 8, backdropFilter: 'blur(8px)', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.25)'} onMouseLeave={e => e.currentTarget.style.background='rgba(255,255,255,0.15)'}>
              Export List
            </button>
            {isCEO && (
              <button onClick={() => setShowModal(true)} style={{ padding: '12px 20px', background: '#ffffff', border: 'none', borderRadius: 12, cursor: 'pointer', fontWeight: 800, color: '#4338ca', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 15px rgba(0,0,0,0.1)', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform='translateY(-2px)'} onMouseLeave={e => e.currentTarget.style.transform='translateY(0)'}>
                + Create Policy
              </button>
            )}
          </div>
        </div>
      </div>

      <div style={{ padding: '0 24px 40px' }}>
        {/* Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, background: '#f8fafc', padding: '16px 24px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={() => setActiveTab('active')} style={{ padding: '8px 16px', borderRadius: 20, fontWeight: 700, fontSize: 13, border: 'none', cursor: 'pointer', transition: 'all 0.2s', background: activeTab === 'active' ? '#4f46e5' : 'transparent', color: activeTab === 'active' ? '#fff' : '#64748b', boxShadow: activeTab === 'active' ? '0 4px 12px rgba(79, 70, 229, 0.3)' : 'none' }}>
              Active & Drafts
            </button>
            <button onClick={() => setActiveTab('archived')} style={{ padding: '8px 16px', borderRadius: 20, fontWeight: 700, fontSize: 13, border: 'none', cursor: 'pointer', transition: 'all 0.2s', background: activeTab === 'archived' ? '#4f46e5' : 'transparent', color: activeTab === 'archived' ? '#fff' : '#64748b', boxShadow: activeTab === 'archived' ? '0 4px 12px rgba(79, 70, 229, 0.3)' : 'none' }}>
              Archived
            </button>
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            <input 
              type="text" 
              placeholder="Search policies..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ padding: '10px 16px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', width: 250, outline: 'none' }}
            />
            <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} style={{ padding: '10px 16px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', background: '#fff' }}>
              <option value="">All Categories</option>
              <option value="Code of Conduct">Code of Conduct</option>
              <option value="Leave Policy">Leave Policy</option>
              <option value="IT & Security">IT & Security</option>
              <option value="Health & Safety">Health & Safety</option>
              <option value="Compensation">Compensation</option>
            </select>
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
                <th style={{ padding: '24px 32px', fontWeight: 700, color: '#64748b', fontSize: '12px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Policy Name</th>
                <th style={{ padding: '24px 20px', fontWeight: 700, color: '#64748b', fontSize: '12px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Category & Version</th>
                <th style={{ padding: '24px 20px', fontWeight: 700, color: '#64748b', fontSize: '12px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Effective Date</th>
                <th style={{ padding: '24px 20px', fontWeight: 700, color: '#64748b', fontSize: '12px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Posted By</th>
                <th style={{ padding: '24px 20px', fontWeight: 700, color: '#64748b', fontSize: '12px', letterSpacing: '0.06em', textTransform: 'uppercase', textAlign: 'center' }}>Status</th>
                <th style={{ padding: '24px 32px', fontWeight: 700, color: '#64748b', fontSize: '12px', letterSpacing: '0.06em', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: 16 }}>Loading policies...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: 16 }}>No policies found.</td></tr>
              ) : (
                filtered.map((p, index) => (
                  <tr key={p.id}
                      style={{ 
                        borderBottom: '1px solid #f1f5f9',
                        transition: 'all 0.2s ease',
                        background: index % 2 === 0 ? '#ffffff' : '#fafafa',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = '#eef2ff'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = index % 2 === 0 ? '#ffffff' : '#fafafa'; }}
                  >
                    <td style={{ padding: '20px 32px' }}>
                      <div style={{ fontWeight: 800, color: '#1e293b', fontSize: '15px' }}>{p.title}</div>
                      {p.acknowledgment_required && (
                        <div style={{ display: 'inline-block', marginTop: 4, padding: '2px 8px', background: '#fef3c7', color: '#92400e', borderRadius: 4, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Requires Ack</div>
                      )}
                    </td>
                    <td style={{ padding: '20px 20px' }}>
                      <div style={{ fontWeight: 600, color: '#334155', fontSize: '14px' }}>{p.category}</div>
                      <div style={{ color: '#64748b', fontSize: '13px', fontWeight: 600 }}>v{p.version_number}</div>
                    </td>
                    <td style={{ padding: '20px 20px' }}>
                      <div style={{ fontWeight: 500, color: '#475569', fontSize: '14px' }}>{p.effective_date ? formatDate(p.effective_date, 'short') : '—'}</div>
                    </td>
                    <td style={{ padding: '20px 20px' }}>
                      <div style={{ fontWeight: 500, color: '#475569', fontSize: '14px' }}>{p.publisher_name || '—'}</div>
                    </td>
                    <td style={{ padding: '20px 20px', textAlign: 'center' }}>
                      <span style={{ 
                        padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
                        background: p.status === 'Published' ? '#dcfce7' : p.status === 'Draft' ? '#fef9c3' : '#f1f5f9',
                        color: p.status === 'Published' ? '#166534' : p.status === 'Draft' ? '#854d0e' : '#475569'
                      }}>
                        {p.status}
                      </span>
                    </td>
                    <td style={{ padding: '20px 32px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                        {isCEO && p.status === 'Draft' && (
                          <button onClick={() => handlePublish(p.id)} style={{ padding: '6px 12px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>Publish</button>
                        )}
                        <button onClick={() => window.open(p.file_ref ? (p.file_ref.startsWith('/') ? p.file_ref : `/uploads/documents/${p.file_ref}`) : '#', '_blank')} style={{ padding: '6px 12px', background: '#ffffff', color: '#4f46e5', border: '1px solid #c7d2fe', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>View PDF</button>
                        
                        {!isCEO && p.status === 'Published' && p.acknowledgment_required && (
                          <button onClick={() => handleAcknowledge(p.id)} style={{ padding: '6px 12px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>Acknowledge</button>
                        )}
                        
                        {isCEO && p.status === 'Published' && (
                          <button onClick={() => handleArchive(p.id)} style={{ padding: '6px 12px', background: '#f8fafc', color: '#64748b', border: '1px solid #e2e8f0', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>Archive</button>
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
              <h2>Create New Policy</h2>
              <button className={styles.closeModal} onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <div className={styles.modalBody}>
              <form id="policyForm">
                <div className={styles.formGroup}>
                  <label>Policy Name (Title)</label>
                  <input type="text" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
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
                  <div className={styles.fileUploadBox} onClick={() => document.getElementById('policyFileInput').click()} style={{cursor: 'pointer'}}>
                    {formData.file ? formData.file.name : 'Click to browse or drag and drop file here'}
                    <input 
                      type="file" 
                      id="policyFileInput" 
                      style={{display: 'none'}} 
                      onChange={e => setFormData({...formData, file: e.target.files[0]})}
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
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
