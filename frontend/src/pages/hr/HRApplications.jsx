import React, { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';
import { Mail, CheckCircle, XCircle, ChevronRight, X } from 'lucide-react';
import styles from './HRApplications.module.css';

const HRApplications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  
  // Modals & Notifications
  const [rejectModal, setRejectModal] = useState({ show: false, appId: null, reason: '' });
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

  const generateMailto = (app) => {
    const position = app.hiring_position || app.post_title || 'the advertised role';
    const subject = encodeURIComponent(`Interview Invitation — Sutana`);
    const body = encodeURIComponent(
      `Dear ${app.full_name},\n\nThank you for applying to Sutana for the position of ${position}.\n\nPlease visit our office within 5 working days with your:\n  📄 Original education certificate(s)\n  🪪 National ID card\n\nContact us with any questions.\n\n— Sutana HR Team`
    );
    return `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(app.email)}&su=${subject}&body=${body}`;
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'PENDING': return styles.statusPENDING;
      case 'IN_PERSON_INVITED': return styles.statusIN_PERSON_INVITED;
      case 'SUBMITTED_TO_CEO': return styles.statusSUBMITTED_TO_CEO;
      case 'APPROVED': return styles.statusAPPROVED;
      case 'INFORMED': return styles.statusINFORMED;
      case 'REJECTED': return styles.statusREJECTED;
      default: return styles.statusDEFAULT;
    }
  };

  return (
    <div className={styles.container}>
      {/* ── HEADER ── */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.badge}>
            <span className={styles.badgeDot} />
            <span className={styles.badgeTxt}>Recruitment</span>
          </div>
          <h1 className={styles.pageTitle}>
            Job <span>Applications</span>
          </h1>
          <p className={styles.pageSubtitle}>
            Review candidates and forward shortlisted ones to the CEO.
          </p>
        </div>

        <div className={styles.headerActions}>
          <select
            className={styles.input}
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            style={{ width: 220 }}
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
            {applications.length} application(s) found
          </div>
        </div>

        {/* Table — Rule 3, 4, 8 */}
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Applicant</th>
                <th>Position</th>
                <th>Education / ID</th>
                <th>Date</th>
                <th>Status</th>
                <th className={styles.right}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className={styles.loading}>Loading applications...</td></tr>
              ) : applications.length === 0 ? (
                <tr><td colSpan={6} className={styles.empty}>No applications found. When candidates apply on the public Hiring page, they will appear here.</td></tr>
              ) : (
                applications.map((app) => (
                  <tr key={app.id}>
                    <td>
                      <div className={styles.appTitle}>
                        {app.full_name}
                        <span style={{ fontSize: 11, color: '#6B8E23', marginLeft: 6 }}>({app.sex})</span>
                      </div>
                      <div className={styles.appSub}>{app.email}</div>
                      <div className={styles.appSub}>{app.phone_number}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#424242' }}>
                        {app.hiring_position || app.post_title || '—'}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#1B5E20' }}>Edu: {app.education_status}</div>
                      <div className={styles.appSub}>ID: {app.national_id}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#424242' }}>
                        {new Date(app.created_at).toLocaleDateString('en-CA')}
                      </div>
                    </td>
                    <td>
                      <span className={`${styles.statusBadge} ${getStatusBadgeClass(app.status)}`}>
                        {app.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td>
                      <div className={styles.actionsList}>
                        {/* Email button always visible */}
                        <a
                          href={generateMailto(app)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`${styles.actionBtn} ${styles.actionBtnEmail}`}
                        >
                          <Mail size={12} /> Email
                        </a>

                        {app.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => updateStatus(app.id, 'IN_PERSON_INVITED')}
                              className={`${styles.actionBtn} ${styles.actionBtnOk}`}
                            >
                              <CheckCircle size={12} /> Mark Informed
                            </button>
                            <button
                              onClick={() => setRejectModal({ show: true, appId: app.id, reason: '' })}
                              className={`${styles.actionBtn} ${styles.actionBtnReject}`}
                            >
                              <XCircle size={12} /> Reject
                            </button>
                          </>
                        )}

                        {app.status === 'IN_PERSON_INVITED' && (
                          <>
                            <button
                              onClick={() => updateStatus(app.id, 'SUBMITTED_TO_CEO')}
                              className={`${styles.actionBtn} ${styles.actionBtnSend}`}
                            >
                              <ChevronRight size={12} /> Send to CEO
                            </button>
                            <button
                              onClick={() => setRejectModal({ show: true, appId: app.id, reason: '' })}
                              className={`${styles.actionBtn} ${styles.actionBtnReject}`}
                            >
                              <XCircle size={12} /> Reject
                            </button>
                          </>
                        )}

                        {app.status === 'SUBMITTED_TO_CEO' && (
                          <div style={{ fontSize: 11, color: '#7B1FA2', fontWeight: 800, textTransform: 'uppercase', padding: '6px 0' }}>
                            ⏳ Awaiting CEO
                          </div>
                        )}

                        {app.status === 'APPROVED' && (
                          <>
                            <div style={{ fontSize: 11, color: '#228B22', fontWeight: 800, textTransform: 'uppercase', padding: '6px 8px' }}>
                              ✅ CEO Approved
                            </div>
                            <button
                              onClick={() => updateStatus(app.id, 'INFORMED')}
                              className={`${styles.actionBtn} ${styles.actionBtnOk}`}
                            >
                              <CheckCircle size={12} /> Mark Informed
                            </button>
                          </>
                        )}

                        {app.status === 'INFORMED' && (
                          <div style={{ fontSize: 11, color: '#1976D2', fontWeight: 800, textTransform: 'uppercase', padding: '6px 0' }}>
                            📬 Candidate Informed
                          </div>
                        )}

                        {app.status === 'REJECTED' && (
                          <div style={{ fontSize: 11, color: '#D32F2F', fontWeight: 800, textTransform: 'uppercase', padding: '6px 0' }}>
                            ❌ Rejected
                          </div>
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

      {/* ── REJECT MODAL ── */}
      {rejectModal.show && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalWide}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Reject Application</h2>
              <button 
                className={styles.closeBtn} 
                onClick={() => setRejectModal({ show: false, appId: null, reason: '' })}
              >
                <X size={20} />
              </button>
            </div>
            
            <div className={styles.modalBody}>
              <div className={styles.formGroup}>
                <label>Rejection Reason *</label>
                <select
                  className={styles.input}
                  value={rejectModal.reason}
                  onChange={e => setRejectModal({ ...rejectModal, reason: e.target.value })}
                >
                  <option value="">Select a reason...</option>
                  <option>Lacks required experience</option>
                  <option>Salary expectations too high</option>
                  <option>Not a culture fit</option>
                  <option>Position filled</option>
                  <option>Failed document verification</option>
                  <option>Other</option>
                </select>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button 
                className={styles.cancelBtn} 
                onClick={() => setRejectModal({ show: false, appId: null, reason: '' })}
              >
                Cancel
              </button>
              <button
                disabled={!rejectModal.reason}
                onClick={() => updateStatus(rejectModal.appId, 'REJECTED', rejectModal.reason)}
                className={styles.saveBtn}
              >
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default HRApplications;
