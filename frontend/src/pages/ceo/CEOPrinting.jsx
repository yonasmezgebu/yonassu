import React, { useState } from 'react';
import { triggerNotification } from '../../utils/ceoNotifications';
import { Printer, Download, Eye, Clock, CheckCircle } from 'lucide-react';

const CEOPrinting = () => {
  const [jobs, setJobs] = useState([
    { id: 'PRT-1001', dept: 'Pharmacy', docType: 'Prescription Pads', copies: 500, urgency: 'High', status: 'Pending', costEst: 150, date: '2026-07-01' },
    { id: 'PRT-1002', dept: 'HR', docType: 'Employee Manuals', copies: 20, urgency: 'Normal', status: 'In Progress', costEst: 80, date: '2026-07-01' },
    { id: 'PRT-1003', dept: 'Store', docType: 'Inventory Logs', copies: 50, urgency: 'Normal', status: 'Completed', costEst: 25, date: '2026-06-30' },
  ]);

  const [viewDetail, setViewDetail] = useState(null);

  const totalJobs = jobs.length;
  const pendingJobs = jobs.filter(j => j.status === 'Pending').length;
  const completedJobs = jobs.filter(j => j.status === 'Completed').length;
  const revenueSaved = jobs.reduce((sum, j) => sum + j.costEst, 0) * 1.5; // Hypothetical 50% markup saved

  const handleExport = () => {
    triggerNotification('Export Started', 'Exporting Printing Department Report as PDF...');
  };

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Printer color="#0ea5e9"/> PRINTING DEPARTMENT
          </h1>
          <p style={{ color: '#64748b', margin: 0 }}>🔗 Monitor Internal Printing Operations & Cost Savings</p>
        </div>
        <button onClick={handleExport} style={{ padding: '8px 16px', background: 'white', border: '1px solid #cbd5e1', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
          <Download size={16}/> Export Report
        </button>
      </div>

      {/* SUMMARY CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        <div style={{ background: 'white', padding: 16, borderRadius: 8, border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: 13, color: '#64748b', fontWeight: 'bold' }}>Total Print Jobs</div>
          <div style={{ fontSize: 24, fontWeight: 'bold', color: '#0f172a' }}>{totalJobs}</div>
        </div>
        <div style={{ background: '#fef9c3', padding: 16, borderRadius: 8, border: '1px solid #fef08a' }}>
          <div style={{ fontSize: 13, color: '#854d0e', fontWeight: 'bold' }}>Pending Jobs</div>
          <div style={{ fontSize: 24, fontWeight: 'bold', color: '#ca8a04' }}>{pendingJobs}</div>
        </div>
        <div style={{ background: '#dcfce7', padding: 16, borderRadius: 8, border: '1px solid #bbf7d0' }}>
          <div style={{ fontSize: 13, color: '#166534', fontWeight: 'bold' }}>Completed Jobs</div>
          <div style={{ fontSize: 24, fontWeight: 'bold', color: '#15803d' }}>{completedJobs}</div>
        </div>
        <div style={{ background: '#e0e7ff', padding: 16, borderRadius: 8, border: '1px solid #c7d2fe' }}>
          <div style={{ fontSize: 13, color: '#3730a3', fontWeight: 'bold' }}>Est. Outsourcing Saved</div>
          <div style={{ fontSize: 24, fontWeight: 'bold', color: '#4338ca' }}>${revenueSaved.toLocaleString()}</div>
        </div>
      </div>

      <div style={{ background: 'white', padding: 16, borderRadius: 8, border: '1px solid #e2e8f0' }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: 16 }}>Recent Print Requests</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ background: '#f8fafc' }}>
            <tr>
              <th style={{ padding: 12 }}>Job ID</th>
              <th style={{ padding: 12 }}>Department</th>
              <th style={{ padding: 12 }}>Document Type</th>
              <th style={{ padding: 12 }}>Copies</th>
              <th style={{ padding: 12 }}>Urgency</th>
              <th style={{ padding: 12 }}>Status</th>
              <th style={{ padding: 12 }}>Cost Est.</th>
              <th style={{ padding: 12 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map(j => (
              <tr key={j.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: 12, fontWeight: 'bold' }}>{j.id}</td>
                <td style={{ padding: 12 }}>{j.dept}</td>
                <td style={{ padding: 12 }}>{j.docType}</td>
                <td style={{ padding: 12, fontWeight: 'bold' }}>{j.copies}</td>
                <td style={{ padding: 12 }}>
                  <span style={{ color: j.urgency === 'High' ? '#ef4444' : '#3b82f6', fontWeight: 'bold' }}>{j.urgency}</span>
                </td>
                <td style={{ padding: 12 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: j.status === 'Completed' ? '#10b981' : j.status === 'In Progress' ? '#3b82f6' : '#f59e0b', fontWeight: 'bold' }}>
                    {j.status === 'Completed' ? <CheckCircle size={14}/> : <Clock size={14}/>} {j.status}
                  </span>
                </td>
                <td style={{ padding: 12 }}>${j.costEst}</td>
                <td style={{ padding: 12 }}>
                  <button onClick={() => setViewDetail(j)} style={{ background: '#f1f5f9', border: 'none', padding: '6px 12px', borderRadius: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Eye size={14}/> View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* VIEW DETAILS MODAL */}
      {viewDetail && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: 'white', padding: 24, borderRadius: 12, width: 500 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ margin: 0 }}>Print Job: {viewDetail.id}</h2>
              <button onClick={() => setViewDetail(null)} style={{ background: 'transparent', border: 'none', fontSize: 24, cursor: 'pointer' }}>&times;</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24, padding: 16, background: '#f8fafc', borderRadius: 8 }}>
              <div><strong>Department:</strong> {viewDetail.dept}</div>
              <div><strong>Document Type:</strong> {viewDetail.docType}</div>
              <div><strong>Copies Required:</strong> {viewDetail.copies}</div>
              <div><strong>Urgency:</strong> {viewDetail.urgency}</div>
              <div><strong>Internal Cost Estimate:</strong> ${viewDetail.costEst}</div>
              <div><strong>Status:</strong> {viewDetail.status}</div>
              <div><strong>Date Requested:</strong> {viewDetail.date}</div>
            </div>

            <button onClick={() => setViewDetail(null)} style={{ padding: '8px 16px', background: '#0f172a', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', width: '100%' }}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CEOPrinting;
