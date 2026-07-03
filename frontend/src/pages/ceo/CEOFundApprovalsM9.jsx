import React, { useState } from 'react';
import { submitNotification, receiveNotification, triggerNotification } from '../../utils/ceoNotifications';
import { DollarSign, CheckCircle, XCircle, Download, FileText } from 'lucide-react';

const CEOFundApprovalsM9 = () => {
  const [funds, setFunds] = useState([
    { id: 'FR-2001', tender: 'TN-100', supplier: 'HealthCorp', amount: 10500, date: '2026-07-01', status: 'PENDING' },
    { id: 'FR-2002', tender: 'TN-056', supplier: 'AutoParts Ltd', amount: 3400, date: '2026-07-02', status: 'PENDING' },
  ]);

  const [rejectId, setRejectId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [viewDetail, setViewDetail] = useState(null);

  const handleApprove = (req) => {
    setFunds(funds.map(f => f.id === req.id ? { ...f, status: 'AUTHORIZED' } : f));
    submitNotification('Fund Release Authorized', `FR ${req.id} authorized for release. Finance notified to process payment.`);
    setViewDetail(null);
  };

  const handleReject = () => {
    if (!rejectReason) return alert('Reason is required');
    setFunds(funds.map(f => f.id === rejectId ? { ...f, status: 'REJECTED' } : f));
    receiveNotification('Fund Release Rejected', `FR ${rejectId} rejected: ${rejectReason}. Finance notified.`);
    setRejectId(null);
    setRejectReason('');
    setViewDetail(null);
  };

  const handleExport = () => {
    triggerNotification('Export Started', 'Exporting Fund Approvals Report as PDF...');
  };

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <DollarSign color="#eab308" size={32}/> FUND APPROVALS (M9)
          </h1>
          <p style={{ color: '#64748b', margin: 0 }}>🔗 Authorize Final Fund Releases for Awarded Tenders</p>
        </div>
        <button onClick={handleExport} style={{ padding: '8px 16px', background: 'white', border: '1px solid #cbd5e1', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
          <Download size={16}/> Export Report
        </button>
      </div>

      <div style={{ background: 'white', padding: 16, borderRadius: 8, border: '1px solid #e2e8f0' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ background: '#f8fafc' }}>
            <tr>
              <th style={{ padding: 12 }}>Fund Req Number</th>
              <th style={{ padding: 12 }}>Tender Ref</th>
              <th style={{ padding: 12 }}>Awarded Supplier</th>
              <th style={{ padding: 12 }}>Total Amount</th>
              <th style={{ padding: 12 }}>Requested Date</th>
              <th style={{ padding: 12 }}>Status</th>
              <th style={{ padding: 12 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {funds.map(f => (
              <tr key={f.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: 12, fontWeight: 'bold' }}>{f.id}</td>
                <td style={{ padding: 12, color: '#3b82f6', cursor: 'pointer' }}>{f.tender}</td>
                <td style={{ padding: 12 }}>{f.supplier}</td>
                <td style={{ padding: 12, fontWeight: 'bold', fontSize: 16 }}>${f.amount.toLocaleString()}</td>
                <td style={{ padding: 12 }}>{f.date}</td>
                <td style={{ padding: 12 }}>
                  <span style={{ padding: '4px 8px', borderRadius: 4, fontSize: 12, fontWeight: 'bold', background: f.status === 'AUTHORIZED' ? '#dcfce7' : f.status === 'REJECTED' ? '#fee2e2' : '#fef3c7', color: f.status === 'AUTHORIZED' ? '#166534' : f.status === 'REJECTED' ? '#991b1b' : '#b45309' }}>
                    {f.status}
                  </span>
                </td>
                <td style={{ padding: 12 }}>
                  <button onClick={() => setViewDetail(f)} style={{ background: '#0f172a', color: 'white', border: 'none', padding: '6px 12px', borderRadius: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <FileText size={14}/> Review
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* REVIEW DETAILS MODAL */}
      {viewDetail && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: 'white', padding: 24, borderRadius: 12, width: 600 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ margin: 0 }}>Review Fund Release: {viewDetail.id}</h2>
              <button onClick={() => setViewDetail(null)} style={{ background: 'transparent', border: 'none', fontSize: 24, cursor: 'pointer' }}>&times;</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24, padding: 16, background: '#f8fafc', borderRadius: 8 }}>
              <div><strong>Tender Ref:</strong> {viewDetail.tender}</div>
              <div><strong>Awarded Supplier:</strong> {viewDetail.supplier}</div>
              <div><strong>Requested Date:</strong> {viewDetail.date}</div>
              <div><strong>Status:</strong> {viewDetail.status}</div>
              <div style={{ gridColumn: '1 / -1', marginTop: 16, borderTop: '2px dashed #cbd5e1', paddingTop: 16 }}>
                <strong>Total Release Amount:</strong> <span style={{ fontSize: 24, fontWeight: 'bold', color: '#166534', marginLeft: 8 }}>${viewDetail.amount.toLocaleString()}</span>
              </div>
            </div>

            {viewDetail.status === 'PENDING' && (
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', borderTop: '1px solid #e2e8f0', paddingTop: 24 }}>
                <button onClick={() => setRejectId(viewDetail.id)} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '10px 20px', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 'bold' }}>
                  <XCircle size={16}/> REJECT RELEASE
                </button>
                <button onClick={() => handleApprove(viewDetail)} style={{ background: '#22c55e', color: 'white', border: 'none', padding: '10px 20px', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 'bold' }}>
                  <CheckCircle size={16}/> AUTHORIZE RELEASE
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* REJECT MODAL */}
      {rejectId && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60 }}>
          <div style={{ background: 'white', padding: 24, borderRadius: 8, width: 400 }}>
            <h3>Reject Fund Release</h3>
            <textarea placeholder="Enter rejection reason (required)..." value={rejectReason} onChange={e => setRejectReason(e.target.value)} style={{ width: '100%', height: 100, padding: 8, marginBottom: 16, border: '1px solid #cbd5e1', borderRadius: 4 }}></textarea>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button onClick={() => setRejectId(null)} style={{ padding: '8px 16px', background: '#f1f5f9', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleReject} style={{ padding: '8px 16px', background: '#ef4444', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Confirm Reject</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CEOFundApprovalsM9;
