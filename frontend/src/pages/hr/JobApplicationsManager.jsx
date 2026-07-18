import React, { useState, useEffect } from 'react';
import axios from '../../services/apiClient';
import { Mail, Check, X, Eye } from 'lucide-react';

const JobApplicationsManager = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/applications');
      setApplications(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await axios.put(`/applications/${id}/status`, { status });
      fetchApplications();
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const generateMailto = (app) => {
    const subject = encodeURIComponent(`Regarding your application for: ${app.post_title}`);
    const body = encodeURIComponent(`Dear ${app.full_name},\n\nThank you for applying to the ${app.post_title} position at Sutana.\n\n[Add your message here]\n\nBest regards,\nSutana HR`);
    return `mailto:${app.email}?subject=${subject}&body=${body}`;
  };

  if (loading) return <div style={{ padding: 24 }}>Loading applications...</div>;

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 24px', color: '#0f172a' }}>Job Applications</h1>
      
      <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #e2e8f0' }}>
              <th style={{ padding: '12px 16px', fontSize: 13, color: '#475569', fontWeight: 600 }}>Applicant</th>
              <th style={{ padding: '12px 16px', fontSize: 13, color: '#475569', fontWeight: 600 }}>Position</th>
              <th style={{ padding: '12px 16px', fontSize: 13, color: '#475569', fontWeight: 600 }}>Education / ID</th>
              <th style={{ padding: '12px 16px', fontSize: 13, color: '#475569', fontWeight: 600 }}>Status</th>
              <th style={{ padding: '12px 16px', fontSize: 13, color: '#475569', fontWeight: 600, textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {applications.map(app => (
              <tr key={app.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '16px' }}>
                  <div style={{ fontWeight: 600, color: '#0f172a' }}>{app.full_name}</div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>{app.email}</div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>{app.phone_number}</div>
                </td>
                <td style={{ padding: '16px', fontSize: 14, color: '#334155' }}>
                  {app.post_title}
                </td>
                <td style={{ padding: '16px', fontSize: 14, color: '#334155' }}>
                  <div>{app.education_status}</div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>ID: {app.national_id} | {app.sex}</div>
                </td>
                <td style={{ padding: '16px' }}>
                  <span style={{
                    padding: '4px 8px', borderRadius: 99, fontSize: 12, fontWeight: 600,
                    background: app.status === 'PENDING' ? '#fef3c7' : app.status === 'REJECTED' ? '#fee2e2' : '#dcfce7',
                    color: app.status === 'PENDING' ? '#92400e' : app.status === 'REJECTED' ? '#991b1b' : '#166534'
                  }}>
                    {app.status.replace(/_/g, ' ')}
                  </span>
                </td>
                <td style={{ padding: '16px', textAlign: 'right', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <a href={generateMailto(app)} style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px',
                    background: '#2563eb', color: 'white', borderRadius: 6, fontSize: 13, fontWeight: 500, textDecoration: 'none'
                  }}>
                    <Mail size={14} /> Email
                  </a>
                  <select
                    value={app.status}
                    onChange={(e) => updateStatus(app.id, e.target.value)}
                    style={{ padding: '6px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13 }}
                  >
                    <option value="PENDING">Pending</option>
                    <option value="IN_PERSON_INVITED">Invited</option>
                    <option value="SUBMITTED_TO_CEO">Sent to CEO</option>
                    <option value="REJECTED">Rejected</option>
                  </select>
                </td>
              </tr>
            ))}
            {applications.length === 0 && (
              <tr>
                <td colSpan={5} style={{ padding: 32, textAlign: 'center', color: '#64748b' }}>No applications found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default JobApplicationsManager;
