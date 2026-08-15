import React, { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';
import { Mail, CheckCircle, XCircle, ChevronRight, X, UserPlus, Filter } from 'lucide-react';
import SegmentedSpinner from '../../components/ui/SegmentedSpinner';

/* ─── Enterprise Global Styles ─── */
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

    :root {
      --color-primary: #2563EB;
      --color-primary-hover: #1D4ED8;
      --color-bg-page: #F5F6FA;
      --color-bg-card: #FFFFFF;
      --color-border: #E5E7EB;
      --color-text-primary: #111827;
      --color-text-secondary: #6B7280;
      --color-text-muted: #9CA3AF;
      --color-success: #16A34A;
      --color-success-bg: #DCFCE7;
      --color-danger: #DC2626;
      --color-danger-bg: #FEE2E2;
      --color-warning: #D97706;
      --color-warning-bg: #FEF3C7;
      --color-info: #0284C7;
      --color-info-bg: #E0F2FE;
    }

    .hra-page {
      font-family: 'Inter', 'Segoe UI', Roboto, -apple-system, sans-serif;
      color: var(--color-text-primary);
      background: var(--color-bg-page);
      min-height: 100vh;
      padding: 24px;
      box-sizing: border-box;
    }

    /* ── Header ── */
    .hra-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-bottom: 24px;
      flex-wrap: wrap;
      gap: 16px;
    }
    .hra-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      background: #E0E7FF;
      color: #3730A3;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 8px;
    }
    .hra-badge-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #4F46E5;
    }
    .hra-title {
      font-size: 26px;
      font-weight: 800;
      margin: 0 0 4px 0;
      letter-spacing: -0.02em;
    }
    .hra-subtitle {
      font-size: 14px;
      color: var(--color-text-secondary);
      margin: 0;
    }

    /* ── Cards & Tables ── */
    .hra-card {
      background: var(--color-bg-card);
      border: 1px solid var(--color-border);
      border-radius: 10px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06);
      overflow: hidden;
    }

    .hra-table-wrapper {
      width: 100%;
      overflow-x: auto;
    }
    
    .hra-table {
      width: 100%;
      border-collapse: collapse;
      min-width: 800px;
    }
    .hra-table th {
      background: #F9FAFB;
      padding: 12px 16px;
      font-size: 12px;
      font-weight: 600;
      color: var(--color-text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      text-align: left;
      border-bottom: 1px solid var(--color-border);
    }
    .hra-table th.right {
      text-align: right;
    }
    .hra-table td {
      padding: 16px;
      border-bottom: 1px solid var(--color-border);
      font-size: 14px;
      vertical-align: middle;
      transition: background 150ms ease;
    }
    .hra-table tbody tr:hover td {
      background: #F9FAFB;
    }

    /* ── Inputs & Selects ── */
    .hra-select-wrap {
      position: relative;
    }
    .hra-select-wrap svg {
      position: absolute;
      left: 12px;
      top: 50%;
      transform: translateY(-50%);
      pointer-events: none;
      color: var(--color-text-muted);
    }
    .hra-input {
      height: 36px;
      padding: 0 12px 0 36px;
      border: 1px solid var(--color-border);
      border-radius: 8px;
      font-family: inherit;
      font-size: 14px;
      font-weight: 500;
      color: var(--color-text-primary);
      outline: none;
      transition: all 150ms ease;
      background: #fff;
      appearance: none;
      min-width: 200px;
      cursor: pointer;
    }
    .hra-input:focus {
      border-color: var(--color-primary);
      box-shadow: 0 0 0 3px rgba(37,99,235,0.1);
    }
    
    .hra-textarea {
      width: 100%;
      padding: 12px;
      border: 1px solid var(--color-border);
      border-radius: 8px;
      font-family: inherit;
      font-size: 14px;
      outline: none;
      transition: all 150ms ease;
      resize: vertical;
      min-height: 80px;
    }
    .hra-textarea:focus {
      border-color: var(--color-danger);
      box-shadow: 0 0 0 3px rgba(220,38,38,0.1);
    }

    /* ── Buttons ── */
    .hra-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 0 16px;
      height: 32px;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      border: 1px solid transparent;
      transition: all 150ms ease-in-out;
      white-space: nowrap;
      text-decoration: none;
      font-family: inherit;
    }
    .hra-btn:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.12);
    }
    .hra-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none;
      box-shadow: none;
    }
    
    .hra-btn-primary {
      background: var(--color-primary);
      color: #fff;
    }
    .hra-btn-primary:hover {
      background: #FFD700;
      color: #111827;
    }

    .hra-btn-success {
      background: var(--color-success);
      color: #fff;
    }
    .hra-btn-success:hover {
      background: #FFD700;
      color: #111827;
    }
    
    .hra-btn-danger {
      background: #FEE2E2;
      color: var(--color-danger);
      border-color: #FECACA;
    }
    .hra-btn-danger:hover {
      background: #FFD700;
      border-color: #FFD700;
      color: #111827;
    }

    .hra-btn-secondary {
      background: #fff;
      color: var(--color-text-primary);
      border-color: var(--color-border);
    }
    .hra-btn-secondary:hover {
      background: #F9FAFB;
      border-color: var(--color-text-muted);
    }
    
    /* ── Modals ── */
    .hra-modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(17,24,39,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      backdrop-filter: blur(2px);
      padding: 24px;
    }
    .hra-modal {
      background: var(--color-bg-card);
      border-radius: 12px;
      width: 100%;
      max-width: 440px;
      box-shadow: 0 20px 40px rgba(0,0,0,0.18);
      animation: hraModalIn 150ms ease-out;
      overflow: hidden;
    }
    @keyframes hraModalIn {
      from { opacity: 0; transform: scale(0.95) translateY(8px); }
      to { opacity: 1; transform: none; }
    }
    .hra-modal-header {
      padding: 16px 20px;
      border-bottom: 1px solid var(--color-border);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .hra-modal-title {
      margin: 0;
      font-size: 16px;
      font-weight: 700;
      color: var(--color-text-primary);
    }
    .hra-modal-close {
      background: none;
      border: none;
      color: var(--color-text-muted);
      cursor: pointer;
      padding: 4px;
      border-radius: 4px;
      transition: background 150ms ease;
    }
    .hra-modal-close:hover {
      background: #F3F4F6;
      color: var(--color-text-primary);
    }
    .hra-modal-body {
      padding: 20px;
    }
    .hra-modal-footer {
      padding: 16px 20px;
      background: #F9FAFB;
      border-top: 1px solid var(--color-border);
      display: flex;
      justify-content: flex-end;
      gap: 12px;
    }

    /* ── Badges & Status ── */
    .hra-status-badge {
      display: inline-flex;
      align-items: center;
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      white-space: nowrap;
    }
    .hra-status-PENDING { background: var(--color-warning-bg); color: var(--color-warning); }
    .hra-status-IN_PERSON_INVITED { background: #E0E7FF; color: #4338CA; }
    .hra-status-SUBMITTED_TO_CEO { background: #F3E8FF; color: #7E22CE; }
    .hra-status-APPROVED { background: var(--color-success-bg); color: var(--color-success); }
    .hra-status-INFORMED { background: var(--color-info-bg); color: var(--color-info); }
    .hra-status-REJECTED { background: var(--color-danger-bg); color: var(--color-danger); }

    /* ── Notifications ── */
    .hra-notif {
      position: fixed;
      bottom: 24px;
      right: 24px;
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 20px;
      border-radius: 8px;
      color: #fff;
      font-size: 14px;
      font-weight: 600;
      box-shadow: 0 8px 24px rgba(0,0,0,0.15);
      z-index: 2000;
      animation: hraNotifIn 250ms ease-out;
    }
    @keyframes hraNotifIn {
      from { opacity: 0; transform: translateY(12px); }
      to { opacity: 1; transform: none; }
    }
    .hra-notif-success { background: var(--color-success); border-left: 4px solid #14532D; }
    .hra-notif-error { background: var(--color-danger); border-left: 4px solid #7F1D1D; }
    .hra-notif-close {
      background: none; border: none; color: rgba(255,255,255,0.7);
      cursor: pointer; padding: 0; font-size: 18px; margin-left: 12px;
    }
    .hra-notif-close:hover { color: #fff; }

    /* ── Helpers ── */
    .hra-name { font-weight: 600; color: var(--color-text-primary); margin-bottom: 2px; }
    .hra-sub { font-size: 13px; color: var(--color-text-secondary); margin-bottom: 2px; }
    .hra-actions { display: flex; gap: 8px; justify-content: flex-end; flex-wrap: wrap; }
    
    .hra-controls {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px;
      border-bottom: 1px solid var(--color-border);
    }
    
    @media (max-width: 640px) {
      .hra-page { padding: 12px; }
      .hra-header { flex-direction: column; align-items: stretch; }
      .hra-select-wrap { width: 100%; }
      .hra-input { width: 100%; }
    }
  `}</style>
);

const HRApplications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  
  // Modals & Notifications
  const [rejectModal, setRejectModal] = useState({ show: false, appId: null, reason: '' });
  const [deleteModal, setDeleteModal] = useState({ show: false, appId: null });
  const [previewImage, setPreviewImage] = useState(null);
  const [isZoomed, setIsZoomed] = useState(false);
  const [notif, setNotif] = useState({ type: null, text: '' });

  const showNotif = (type, text) => {
    setNotif({ type, text });
    setTimeout(() => setNotif({ type: null, text: '' }), 5000);
  };

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const url = statusFilter ? `/applications?status=${statusFilter}` : '/applications';
      const res = await apiClient.get(url);
      setApplications(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error('Fetch applications error:', err);
      setApplications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [statusFilter]);

  const updateStatus = async (id, status, reason = null) => {
    try {
      const body = { status };
      if (reason) body.reason = reason;
      await apiClient.put(`/applications/${id}/status`, body);
      fetchApplications();
      if (status === 'REJECTED') {
        setRejectModal({ show: false, appId: null, reason: '' });
        showNotif('success', 'Application rejected');
      } else {
        showNotif('success', `Status updated to ${status}`);
      }
    } catch (err) {
      showNotif('error', 'Failed to update status');
    }
  };

  const handleDelete = async (id) => {
    try {
      await apiClient.delete(`/applications/${id}`);
      fetchApplications();
      setDeleteModal({ show: false, appId: null });
      showNotif('success', 'Application deleted successfully');
    } catch (err) {
      showNotif('error', 'Failed to delete application');
    }
  };

  const generateMailto = (app) => {
    const position = app.hiring_position || app.post_title || 'the advertised role';
    const subject = encodeURIComponent(`Interview Invitation — Sutana`);
    const body = encodeURIComponent(
      `Dear ${app.full_name},\n\nThank you for applying to Sutana for the position of ${position}.\n\nPlease visit our office within 5 working days with your:\n  📄 Original education certificate(s)\n  🪪 National ID card\n\nContact us with any questions.\n\n— Sutana HR Team`
    );
    return `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(app.email)}&su=${subject}&body=${body}`;
  };

  return (
    <div className="hra-page">
      <GlobalStyles />
      
      {/* ── HEADER ── */}
      <div className="hra-header">
        <div>
          <div className="hra-badge">
            <div className="hra-badge-dot" />
            Recruitment
          </div>
          <h1 className="hra-title">Job Applications</h1>
          <p className="hra-subtitle">Review candidates and forward shortlisted ones to the CEO</p>
        </div>

        <div>
          <div className="hra-select-wrap">
            <Filter size={16} />
            <select
              className="hra-input"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="">All Applications</option>
              <option value="PENDING">Pending</option>
              <option value="IN_PERSON_INVITED">In-Person Invited</option>
              <option value="SUBMITTED_TO_CEO">Sent to CEO</option>
              <option value="APPROVED">Approved by CEO</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── NOTIFICATIONS ── */}
      {notif.type && (
        <div className={`hra-notif hra-notif-${notif.type}`}>
          <span>{notif.type === 'success' ? '✅' : '⚠️'} {notif.text}</span>
          <button className="hra-notif-close" onClick={() => setNotif({ type: null, text: '' })}>×</button>
        </div>
      )}

      {/* ── IMAGE PREVIEW MODAL ── */}
      {previewImage && (
        <div 
          onClick={() => { setPreviewImage(null); setIsZoomed(false); }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 99999, display: 'flex', alignItems: isZoomed ? 'flex-start' : 'center', justifyContent: isZoomed ? 'flex-start' : 'center', padding: isZoomed ? 0 : 24, overflow: 'auto' }}
        >
          <div onClick={e => e.stopPropagation()} style={{ position: 'relative', width: isZoomed ? 'max-content' : 'auto', height: isZoomed ? 'max-content' : 'auto', margin: isZoomed ? 'auto' : 0 }}>
            {!isZoomed && (
              <button 
                onClick={() => { setPreviewImage(null); setIsZoomed(false); }}
                style={{ position: 'absolute', top: -40, right: 0, background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: 8 }}
              >
                <X size={24} />
              </button>
            )}
            <img 
              src={previewImage} 
              alt="Preview" 
              onClick={() => setIsZoomed(!isZoomed)}
              style={{ 
                maxWidth: isZoomed ? 'none' : '100%', 
                maxHeight: isZoomed ? 'none' : 'calc(100vh - 80px)', 
                objectFit: 'contain', 
                borderRadius: isZoomed ? 0 : 8, 
                boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
                cursor: isZoomed ? 'zoom-out' : 'zoom-in',
                display: 'block',
                transition: 'transform 0.2s ease-out'
              }} 
            />
          </div>
        </div>
      )}

      {/* ── BODY AREA ── */}
      <div className="hra-card">
        <div className="hra-controls">
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)' }}>
            {loading ? 'Loading...' : `${applications.length} application(s) found`}
          </div>
        </div>

        <div className="hra-table-wrapper">
          <table className="hra-table">
            <thead>
              <tr>
                <th>Applicant</th>
                <th>Position</th>
                <th>Education / ID</th>
                <th>Date</th>
                <th>Status</th>
                <th className="right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '40px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                      <SegmentedSpinner size={32} color="var(--color-primary)" />
                      <span style={{ color: 'var(--color-text-secondary)', fontSize: 13 }}>Loading applications...</span>
                    </div>
                  </td>
                </tr>
              ) : applications.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '64px 24px' }}>
                    <UserPlus size={48} color="var(--color-text-muted)" style={{ margin: '0 auto 16px', opacity: 0.5 }} />
                    <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-text-primary)' }}>No applications found</div>
                    <div style={{ fontSize: 14, color: 'var(--color-text-secondary)', marginTop: 4 }}>When candidates apply on the public Hiring page, they will appear here.</div>
                  </td>
                </tr>
              ) : (
                applications.map((app) => (
                  <tr key={app.id}>
                    <td>
                      <div className="hra-name">
                        {app.full_name}
                        <span style={{ fontSize: 12, color: 'var(--color-text-muted)', marginLeft: 8, fontWeight: 500 }}>({app.sex})</span>
                      </div>
                      <div className="hra-sub">{app.email}</div>
                      <div className="hra-sub">{app.phone_number}</div>
                    </td>
                    <td>
                      <div className="hra-name">
                        {app.hiring_position || app.post_title || '—'}
                      </div>
                    </td>
                    <td>
                      <div className="hra-name" style={{ fontSize: 13 }}>Edu: {app.education_status}</div>
                      <div className="hra-sub">ID: {app.national_id}</div>
                      {(app.id_front_image || app.id_back_image) && (
                        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                          {app.id_front_image && (
                            <div onClick={() => setPreviewImage(`${import.meta.env.VITE_API_URL?.replace('/api/v1','') || 'http://localhost:5000'}/uploads/id-images/${app.id_front_image}`)}>
                              <img
                                src={`${import.meta.env.VITE_API_URL?.replace('/api/v1','') || 'http://localhost:5000'}/uploads/id-images/${app.id_front_image}`}
                                alt="ID Front"
                                style={{ width: 48, height: 32, objectFit: 'cover', borderRadius: 4, border: '1px solid var(--color-border)', cursor: 'pointer', transition: 'border 150ms ease' }}
                                title="ID Front"
                                onMouseEnter={e => e.target.style.borderColor = 'var(--color-primary)'}
                                onMouseLeave={e => e.target.style.borderColor = 'var(--color-border)'}
                              />
                            </div>
                          )}
                          {app.id_back_image && (
                            <div onClick={() => setPreviewImage(`${import.meta.env.VITE_API_URL?.replace('/api/v1','') || 'http://localhost:5000'}/uploads/id-images/${app.id_back_image}`)}>
                              <img
                                src={`${import.meta.env.VITE_API_URL?.replace('/api/v1','') || 'http://localhost:5000'}/uploads/id-images/${app.id_back_image}`}
                                alt="ID Back"
                                style={{ width: 48, height: 32, objectFit: 'cover', borderRadius: 4, border: '1px solid var(--color-border)', cursor: 'pointer', transition: 'border 150ms ease' }}
                                title="ID Back"
                                onMouseEnter={e => e.target.style.borderColor = 'var(--color-primary)'}
                                onMouseLeave={e => e.target.style.borderColor = 'var(--color-border)'}
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                    <td>
                      <div className="hra-sub" style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>
                        {new Date(app.created_at).toLocaleDateString('en-CA')}
                      </div>
                    </td>
                    <td>
                      <span className={`hra-status-badge hra-status-${app.status}`}>
                        {app.status.replace(/_/g, ' ')}
                      </span>
                      {app.status === 'REJECTED' && app.rejection_reason && (
                        <div className="hra-sub" style={{ color: 'var(--color-danger)', marginTop: 8, maxWidth: 180 }}>
                          <strong>Reason:</strong> {app.rejection_reason}
                        </div>
                      )}
                    </td>
                    <td>
                      <div className="hra-actions">
                        <a
                          href={generateMailto(app)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hra-btn hra-btn-secondary"
                        >
                          <Mail size={14} /> Email
                        </a>

                        {app.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => updateStatus(app.id, 'SUBMITTED_TO_CEO')}
                              className="hra-btn hra-btn-primary"
                            >
                              <ChevronRight size={14} /> Send to CEO
                            </button>
                            <button
                              onClick={() => setRejectModal({ show: true, appId: app.id, reason: '' })}
                              className="hra-btn hra-btn-danger"
                            >
                              <XCircle size={14} /> Reject
                            </button>
                          </>
                        )}

                        {app.status === 'SUBMITTED_TO_CEO' && (
                          <div className="hra-sub" style={{ display: 'flex', alignItems: 'center', height: '32px', padding: '0 8px' }}>
                            ⏳ Awaiting CEO
                          </div>
                        )}

                        {app.status === 'APPROVED' && (
                          <>
                            <div className="hra-sub" style={{ display: 'flex', alignItems: 'center', height: '32px', padding: '0 8px', color: 'var(--color-success)', fontWeight: 600 }}>
                              ✅ Approved
                            </div>
                            <button
                              onClick={() => updateStatus(app.id, 'INFORMED')}
                              className="hra-btn hra-btn-success"
                            >
                              <CheckCircle size={14} /> Mark Informed
                            </button>
                          </>
                        )}

                        {app.status === 'INFORMED' && (
                          <div className="hra-sub" style={{ display: 'flex', alignItems: 'center', height: '32px', padding: '0 8px', color: 'var(--color-primary)', fontWeight: 600 }}>
                            📬 Informed
                          </div>
                        )}

                        {app.status === 'REJECTED' && (
                          <div className="hra-sub" style={{ display: 'flex', alignItems: 'center', height: '32px', padding: '0 8px', color: 'var(--color-danger)', fontWeight: 600 }}>
                            ❌ Rejected
                          </div>
                        )}

                        <button
                          onClick={() => setDeleteModal({ show: true, appId: app.id })}
                          className="hra-btn hra-btn-danger"
                        >
                          <X size={14} /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── REJECT MODAL ── */}
      {rejectModal.show && (
        <div className="hra-modal-overlay">
          <div className="hra-modal">
            <div className="hra-modal-header">
              <h2 className="hra-modal-title">Reject Application</h2>
              <button 
                className="hra-modal-close" 
                onClick={() => setRejectModal({ show: false, appId: null, reason: '' })}
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="hra-modal-body">
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', marginBottom: 8 }}>
                Rejection Reason <span style={{ color: 'var(--color-danger)' }}>*</span>
              </label>
              <textarea
                className="hra-textarea"
                placeholder="Explain why this application is rejected..."
                value={rejectModal.reason}
                onChange={e => setRejectModal({ ...rejectModal, reason: e.target.value })}
              />
            </div>

            <div className="hra-modal-footer">
              <button 
                className="hra-btn hra-btn-secondary" 
                onClick={() => setRejectModal({ show: false, appId: null, reason: '' })}
              >
                Cancel
              </button>
              <button
                disabled={!rejectModal.reason}
                onClick={() => updateStatus(rejectModal.appId, 'REJECTED', rejectModal.reason)}
                className="hra-btn hra-btn-danger"
              >
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── DELETE CONFIRM MODAL ── */}
      {deleteModal.show && (
        <div className="hra-modal-overlay">
          <div className="hra-modal">
            <div className="hra-modal-header">
              <h2 className="hra-modal-title" style={{ color: 'var(--color-danger)' }}>Delete Application</h2>
              <button 
                className="hra-modal-close" 
                onClick={() => setDeleteModal({ show: false, appId: null })}
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="hra-modal-body">
              <p style={{ margin: 0, fontSize: 14, color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                Are you sure you want to delete this applicant? This action <strong>cannot be undone</strong> and all associated data will be removed from the system.
              </p>
            </div>

            <div className="hra-modal-footer">
              <button 
                className="hra-btn hra-btn-secondary" 
                onClick={() => setDeleteModal({ show: false, appId: null })}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteModal.appId)}
                className="hra-btn hra-btn-danger"
              >
                Delete Applicant
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default HRApplications;
