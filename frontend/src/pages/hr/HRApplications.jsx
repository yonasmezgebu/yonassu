import React, { useState, useEffect } from 'react';
import hrService from '../../services/hrService';
import { playInfoSound } from '../../utils/playNotificationSound';
import styles from './HRApplications.module.css';

const HRApplications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rejectModal, setRejectModal] = useState({ show: false, appId: null, reason: '' });

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await hrService.getApplications();
      setApplications(res.data?.data?.applications || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const updateStatus = async (id, status, reason = null) => {
    try {
      await hrService.updateApplicationStatus(id, { status, reason });
      playInfoSound();
      fetchData();
      if (status === 'Rejected') setRejectModal({ show: false, appId: null, reason: '' });
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const handleReject = (id) => {
    setRejectModal({ show: true, appId: id, reason: '' });
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.pageTitle}>Job Applications</h1>
          <p className={styles.pageSubtitle}>Review and manage applicant pipelines.</p>
        </div>
      </div>

      <div className={styles.tableWrapper}>
        {loading ? (
          <div className={styles.loading}>Loading applications...</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Applicant Name</th>
                <th>Applied For</th>
                <th>Date Applied</th>
                <th>Status</th>
                <th>Resume</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {applications.length === 0 ? (
                <tr><td colSpan={6} className={styles.empty}>No applications found.</td></tr>
              ) : (
                applications.map(app => (
                  <tr key={app.id}>
                    <td className={styles.appName}>{app.applicantName} <br/><span className={styles.appEmail}>{app.email}</span></td>
                    <td className={styles.jobTitle}>{app.jobTitle}</td>
                    <td>{new Date(app.dateApplied).toLocaleDateString()}</td>
                    <td>
                      <span className={styles.statusBadge + ' ' + styles[app.status.replace(' ', '')]}>{app.status}</span>
                    </td>
                    <td>
                      <a href={app.resumeUrl} target="_blank" rel="noreferrer" className={styles.link}>View Resume</a>
                    </td>
                    <td>
                      {app.status === 'New' && (
                        <>
                          <button className={styles.actionBtn} onClick={() => updateStatus(app.id, 'Reviewed')}>Review</button>
                          <button className={styles.rejectBtn} onClick={() => handleReject(app.id)}>Reject</button>
                        </>
                      )}
                      {app.status === 'Reviewed' && (
                        <>
                          <button className={styles.actionBtn} onClick={() => updateStatus(app.id, 'Shortlisted')}>Shortlist</button>
                          <button className={styles.rejectBtn} onClick={() => handleReject(app.id)}>Reject</button>
                        </>
                      )}
                      {app.status === 'Shortlisted' && (
                        <>
                          <button className={styles.actionBtn} onClick={() => updateStatus(app.id, 'Interview')}>Move to Interview</button>
                          <button className={styles.actionBtn} onClick={() => updateStatus(app.id, 'SUBMITTED_TO_CEO')} style={{marginLeft: '5px', background: '#8b5cf6'}}>Forward to CEO</button>
                          <button className={styles.rejectBtn} onClick={() => handleReject(app.id)}>Reject</button>
                        </>
                      )}
                      {['Interview', 'Offered', 'SUBMITTED_TO_CEO'].includes(app.status) && (
                        <span className={styles.handledMsg}>Handled in next stages / Forwarded</span>
                      )}
                      {app.status === 'Rejected' && (
                        <span className={styles.rejectedReason} title={app.rejectReason}>Rejected: {app.rejectReason}</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {rejectModal.show && (
        <div className={styles.modalOverlay} onClick={() => setRejectModal({show: false, appId: null, reason: ''})}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Reject Application</h2>
              <button className={styles.closeBtn} onClick={() => setRejectModal({show: false, appId: null, reason: ''})}>×</button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.formGroup}>
                <label>Reason for Rejection *</label>
                <select className={styles.input} value={rejectModal.reason} onChange={e => setRejectModal({...rejectModal, reason: e.target.value})}>
                  <option value="">Select a reason...</option>
                  <option>Lacks required experience</option>
                  <option>Salary expectations too high</option>
                  <option>Not a culture fit</option>
                  <option>Position filled</option>
                  <option>Other</option>
                </select>
              </div>
            </div>
            <div className={styles.modalActions}>
              <button className={styles.cancelBtn} onClick={() => setRejectModal({show: false, appId: null, reason: ''})}>Cancel</button>
              <button className={styles.rejectConfirmBtn} disabled={!rejectModal.reason} onClick={() => updateStatus(rejectModal.appId, 'Rejected', rejectModal.reason)}>Confirm Rejection</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HRApplications;
