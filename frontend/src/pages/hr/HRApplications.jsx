import React, { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';
import { Mail, CheckCircle, XCircle } from 'lucide-react';

const HRApplications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [rejectModal, setRejectModal] = useState({ show: false, appId: null, reason: '' });

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const url = statusFilter ? `/applications?status=${statusFilter}` : '/applications';
      const res = await apiClient.get(url);
      // The /applications endpoint returns a plain array (and apiClient already returns response.data)
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
      if (status === 'REJECTED') setRejectModal({ show: false, appId: null, reason: '' });
    } catch (err) {
      alert('Failed to update status');
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
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: '#0f172a' }}>💼 Job Applications</h1>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 14 }}>
            Review candidates and forward shortlisted ones to the CEO.
          </p>
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: 14, minWidth: 200, cursor: 'pointer' }}
        >
          <option value="">All Applications</option>
          <option value="PENDING">Pending</option>
          <option value="IN_PERSON_INVITED">In-Person Invited</option>
          <option value="SUBMITTED_TO_CEO">Sent to CEO</option>
          <option value="APPROVED">Approved by CEO</option>
          <option value="REJECTED">Rejected</option>
        </select>
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
                    No applications found. When candidates apply on the public Hiring page, they will appear here.
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
                          {/* Email button always visible */}
                          <a
                            href={generateMailto(app)}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: 4,
                              padding: '6px 12px', background: '#2563eb', color: 'white',
                              borderRadius: 6, fontSize: 12, fontWeight: 600, textDecoration: 'none'
                            }}
                          >
                            <Mail size={13} /> Email
                          </a>

                          {app.status === 'PENDING' && (
                            <>
                                <button
                                  onClick={() => updateStatus(app.id, 'IN_PERSON_INVITED')}
                                  style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '6px 12px', background: '#0ea5e9', color: 'white', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                                >
                                  <CheckCircle size={13} /> Mark as Informed
                                </button>
                              <button
                                onClick={() => setRejectModal({ show: true, appId: app.id, reason: '' })}
                                style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '6px 12px', background: '#ef4444', color: 'white', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                              >
                                <XCircle size={13} /> Reject
                              </button>
                            </>
                          )}

                          {app.status === 'IN_PERSON_INVITED' && (
                            <>
                              <button
                                onClick={() => updateStatus(app.id, 'SUBMITTED_TO_CEO')}
                                style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '6px 12px', background: '#8b5cf6', color: 'white', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                              >
                                <CheckCircle size={13} /> Send to CEO
                              </button>
                              <button
                                onClick={() => setRejectModal({ show: true, appId: app.id, reason: '' })}
                                style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '6px 12px', background: '#ef4444', color: 'white', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                              >
                                <XCircle size={13} /> Reject
                              </button>
                            </>
                          )}

                          {app.status === 'SUBMITTED_TO_CEO' && (
                            <span style={{ fontSize: 12, color: '#8b5cf6', fontWeight: 600 }}>⏳ Awaiting CEO</span>
                          )}
                          {app.status === 'APPROVED' && (
                            <>
                              <span style={{ fontSize: 12, color: '#16a34a', fontWeight: 600 }}>✅ CEO Approved</span>
                              <button
                                onClick={() => updateStatus(app.id, 'INFORMED')}
                                style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '6px 12px', background: '#0ea5e9', color: 'white', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                              >
                                <CheckCircle size={13} /> Mark as Informed
                              </button>
                            </>
                          )}
                          {app.status === 'INFORMED' && (
                            <span style={{ fontSize: 12, color: '#0284c7', fontWeight: 600 }}>📬 Candidate Informed</span>
                          )}
                          {app.status === 'REJECTED' && (
                            <span style={{ fontSize: 12, color: '#dc2626', fontWeight: 600 }}>❌ Rejected</span>
                          )}
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
    </div>
  );
};

export default HRApplications;
