import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../../services/apiClient';
import { CheckCircle, XCircle } from 'lucide-react';

const CEOApplicants = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rejectModal, setRejectModal] = useState({ show: false, appId: null, reason: '' });
  const [toast, setToast] = useState(null); // { message, type: 'success'|'error' }

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/applications?status=SUBMITTED_TO_CEO');
      // The /applications endpoint returns a plain array (and apiClient already returns response.data)
      setApplications(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error('Fetch CEO applications error:', err);
      setApplications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const updateStatus = async (id, status, reason = null) => {
    try {
      const body = { status };
      if (reason) body.reason = reason;
      await apiClient.put(`/applications/${id}/status`, body);
      fetchApplications();
      if (status === 'APPROVED') showToast('✅ Candidate approved to invite for interview!');
      if (status === 'REJECTED') {
        setRejectModal({ show: false, appId: null, reason: '' });
        showToast('❌ Candidate rejected.', 'error');
      }
    } catch (err) {
      console.error('Update status error:', err);
      showToast('Failed to update status. Please try again.', 'error');
    }
  };

  const STATUS_COLORS = {
    PENDING:          { bg: '#fef3c7', color: '#92400e' },
    IN_PERSON_INVITED:{ bg: '#dbeafe', color: '#1e40af' },
    SUBMITTED_TO_CEO: { bg: '#ede9fe', color: '#5b21b6' },
    APPROVED:         { bg: '#dcfce7', color: '#166534' },
    REJECTED:         { bg: '#fee2e2', color: '#991b1b' },
  };

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: '#0f172a' }}>💼 Job Applicants (CEO Approval)</h1>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 14 }}>
            Review candidates forwarded by HR for final hiring approval.
          </p>
        </div>
      </div>

      {/* Table */}
      <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#64748b' }}>Loading applications...</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #e2e8f0' }}>
                <th style={{ padding: '12px 16px', fontSize: 13, color: '#475569', fontWeight: 600 }}>Applicant</th>
                <th style={{ padding: '12px 16px', fontSize: 13, color: '#475569', fontWeight: 600 }}>Position</th>
                <th style={{ padding: '12px 16px', fontSize: 13, color: '#475569', fontWeight: 600 }}>Education / ID</th>
                <th style={{ padding: '12px 16px', fontSize: 13, color: '#475569', fontWeight: 600 }}>Date</th>
                <th style={{ padding: '12px 16px', fontSize: 13, color: '#475569', fontWeight: 600 }}>Status</th>
                <th style={{ padding: '12px 16px', fontSize: 13, color: '#475569', fontWeight: 600, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {applications.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>
                    No candidates forwarded yet. When HR shortlists a candidate, they will appear here.
                  </td>
                </tr>
              ) : (
                applications.map(app => {
                  const sc = STATUS_COLORS[app.status] || { bg: '#e2e8f0', color: '#334155' };
                  return (
                    <tr key={app.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      {/* Applicant info */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 600, color: '#0f172a', fontSize: 14 }}>
                          {app.full_name}
                          <span style={{ fontSize: 12, color: '#94a3b8', marginLeft: 6 }}>({app.sex})</span>
                        </div>
                        <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{app.email}</div>
                        <div style={{ fontSize: 12, color: '#64748b' }}>{app.phone_number}</div>
                      </td>
                      {/* Position */}
                      <td style={{ padding: '14px 16px', fontSize: 14, color: '#334155' }}>
                        {app.hiring_position || app.post_title || '—'}
                      </td>
                      {/* Education / ID */}
                      <td style={{ padding: '14px 16px', fontSize: 13, color: '#334155' }}>
                        <div><strong>Edu:</strong> {app.education_status}</div>
                        <div style={{ fontSize: 12, color: '#64748b' }}>ID: {app.national_id}</div>
                      </td>
                      {/* Date */}
                      <td style={{ padding: '14px 16px', fontSize: 13, color: '#64748b', whiteSpace: 'nowrap' }}>
                        {new Date(app.created_at).toLocaleDateString('en-CA')}
                      </td>
                      {/* Status badge */}
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{
                          background: sc.bg, color: sc.color,
                          padding: '4px 10px', borderRadius: 99, fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap'
                        }}>
                          {app.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      {/* Actions */}
                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                          <button
                            onClick={() => updateStatus(app.id, 'APPROVED')}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '6px 12px', background: '#16a34a', color: 'white', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                          >
                            <CheckCircle size={13} /> Approve to Invite
                          </button>
                          <button
                            onClick={() => setRejectModal({ show: true, appId: app.id, reason: '' })}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '6px 12px', background: '#ef4444', color: 'white', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                          >
                            <XCircle size={13} /> Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Reject Modal */}
      {rejectModal.show && (
        <div
          onClick={() => setRejectModal({ show: false, appId: null, reason: '' })}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <div onClick={e => e.stopPropagation()} style={{ background: 'white', borderRadius: 16, padding: 32, width: 420, boxShadow: '0 25px 50px rgba(0,0,0,0.25)' }}>
            <h2 style={{ margin: '0 0 20px', fontSize: 18, color: '#0f172a' }}>Reject Application</h2>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#334155', marginBottom: 8 }}>Reason *</label>
            <select
              value={rejectModal.reason}
              onChange={e => setRejectModal({ ...rejectModal, reason: e.target.value })}
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: 14, marginBottom: 20, boxSizing: 'border-box' }}
            >
              <option value="">Select a reason...</option>
              <option>Lacks required experience</option>
              <option>Salary expectations too high</option>
              <option>Not a culture fit</option>
              <option>Position filled</option>
              <option>Failed document verification</option>
              <option>Other</option>
            </select>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setRejectModal({ show: false, appId: null, reason: '' })}
                style={{ flex: 1, padding: '10px', border: '1px solid #e2e8f0', borderRadius: 8, background: 'white', cursor: 'pointer', fontSize: 14 }}
              >
                Cancel
              </button>
              <button
                disabled={!rejectModal.reason}
                onClick={() => updateStatus(rejectModal.appId, 'REJECTED', rejectModal.reason)}
                style={{
                  flex: 1, padding: '10px', border: 'none', borderRadius: 8,
                  background: rejectModal.reason ? '#ef4444' : '#fca5a5',
                  color: 'white', cursor: rejectModal.reason ? 'pointer' : 'not-allowed',
                  fontSize: 14, fontWeight: 600
                }}
              >
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* In-App Toast Notification */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 28, right: 28, zIndex: 99999,
          background: toast.type === 'error' ? '#ef4444' : '#16a34a',
          color: 'white', borderRadius: 12, padding: '14px 22px',
          fontSize: 14, fontWeight: 600, boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
          display: 'flex', alignItems: 'center', gap: 10,
          animation: 'slideInToast 0.3s ease-out'
        }}>
          <style>{`@keyframes slideInToast { from { transform: translateY(30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`}</style>
          {toast.type === 'error' ? <XCircle size={18} /> : <CheckCircle size={18} />}
          {toast.message}
        </div>
      )}
    </div>
  );
};

export default CEOApplicants;
