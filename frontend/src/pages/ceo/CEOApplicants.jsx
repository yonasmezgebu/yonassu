import React, { useState, useEffect } from 'react';
import { Download } from 'lucide-react';
import apiClient from '../../services/apiClient';

const CEOApplicants = () => {
  const [applicants, setApplicants] = useState([]);

  useEffect(() => {
    apiClient.get('/hr/recruitment/applications?status=SUBMITTED_TO_CEO')
      .then(res => setApplicants(res.data?.data || []))
      .catch(console.error);
  }, []);

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0 }}>💼 JOB APPLICANTS</h1>
          <p style={{ color: '#64748b', margin: 0 }}>Review candidates forwarded by HR</p>
        </div>
        <button style={{ padding: '8px 16px', background: 'white', border: '1px solid #cbd5e1', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
          <Download size={16}/> Export Report
        </button>
      </div>

      <div style={{ background: 'white', padding: 16, borderRadius: 8, border: '1px solid #e2e8f0' }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: 16 }}>Candidates Forwarded by HR ({applicants.length})</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ background: '#f8fafc' }}>
            <tr>
              <th style={{ padding: 12 }}>Applicant Name</th>
              <th style={{ padding: 12 }}>Job Title</th>
              <th style={{ padding: 12 }}>Date Applied</th>
              <th style={{ padding: 12 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {applicants.length === 0 ? (
              <tr><td colSpan="4" style={{ padding: 12, textAlign: 'center', color: '#64748b' }}>No candidates forwarded yet.</td></tr>
            ) : applicants.map(app => (
              <tr key={app.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: 12, fontWeight: 'bold' }}>{app.applicantName}</td>
                <td style={{ padding: 12 }}>{app.jobTitle}</td>
                <td style={{ padding: 12 }}>{new Date(app.dateApplied).toLocaleDateString()}</td>
                <td style={{ padding: 12 }}>
                  <button style={{ background: '#22c55e', color: 'white', border: 'none', padding: '6px 12px', borderRadius: 4, cursor: 'pointer', marginRight: 8 }}>Approve</button>
                  <button style={{ background: '#ef4444', color: 'white', border: 'none', padding: '6px 12px', borderRadius: 4, cursor: 'pointer' }}>Reject</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CEOApplicants;
