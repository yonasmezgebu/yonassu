import React, { useState } from 'react';
import { submitNotification, receiveNotification, triggerNotification } from '../../utils/ceoNotifications';
import { Pill, CheckCircle, XCircle, Download } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const CEOPharmacyM20M22 = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('M20');

  const [m20Requests, setM20Requests] = useState([
    { id: 'M20-801', drug: 'Amoxicillin 500mg', reqQty: 500, pharmStock: 50, storeStock: 2000, by: 'Pharm Manager', date: '2026-07-01', status: 'Pending CEO Approval' },
    { id: 'M20-802', drug: 'Paracetamol 500mg', reqQty: 1000, pharmStock: 100, storeStock: 5000, by: 'Pharm Manager', date: '2026-07-01', status: 'Pending CEO Approval' },
  ]);

  const [m21Approvals, setM21Approvals] = useState([
    { id: 'M21-301', m20Ref: 'M20-799', drug: 'Ibuprofen', qty: 200, date: '2026-06-30', ceoName: 'CEO SUTANA', status: 'Approved' }
  ]);

  const [m22Issues] = useState([
    { id: 'M22-401', drug: 'Ibuprofen', qty: 20, customer: 'John Doe', type: 'Walk-in', branch: 'Main', worker: 'Alice', date: '2026-07-01' }
  ]);

  const [rejectId, setRejectId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const handleApprove = (req) => {
    setM20Requests(m20Requests.map(r => r.id === req.id ? { ...r, status: 'Approved' } : r));
    const newM21 = {
      id: `M21-${Math.floor(Math.random() * 1000) + 400}`,
      m20Ref: req.id,
      drug: req.drug,
      qty: req.reqQty,
      date: new Date().toISOString().split('T')[0],
      ceoName: user?.name || 'CEO SUTANA',
      status: 'Approved'
    };
    setM21Approvals([newM21, ...m21Approvals]);
    submitNotification('Pharmacy Request Approved', `M20 ${req.id} approved. M21 generated.`);
  };

  const handleReject = () => {
    if (!rejectReason) return alert('Reason is required');
    setM20Requests(m20Requests.map(r => r.id === rejectId ? { ...r, status: 'Rejected' } : r));
    receiveNotification('Pharmacy Request Rejected', `M20 ${rejectId} rejected: ${rejectReason}`);
    setRejectId(null);
    setRejectReason('');
  };

  const handleExport = () => {
    triggerNotification('Export Started', `Exporting ${activeTab} records as PDF...`);
  };

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0 }}>💊 PHARMACY (M20–M22)</h1>
          <p style={{ color: '#64748b', margin: 0 }}>🔗 View All Pharmacy Requests & Issue Notes</p>
        </div>
        <button onClick={handleExport} style={{ padding: '8px 16px', background: 'white', border: '1px solid #cbd5e1', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
          <Download size={16}/> Export Report
        </button>
      </div>

      {/* QUICK SUMMARY (READ-ONLY) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        <div style={{ background: 'white', padding: 16, borderRadius: 8, border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: 13, color: '#64748b', fontWeight: 'bold' }}>Pharmacy Stock (All Branches)</div>
          <div style={{ fontSize: 20, fontWeight: 'bold', color: '#0f172a' }}>12,450 Items</div>
        </div>
        <div style={{ background: 'white', padding: 16, borderRadius: 8, border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: 13, color: '#64748b', fontWeight: 'bold' }}>Pharmacy Sales Summary</div>
          <div style={{ fontSize: 20, fontWeight: 'bold', color: '#10b981' }}>$45,000 (Month)</div>
        </div>
        <div style={{ background: '#fee2e2', padding: 16, borderRadius: 8, border: '1px solid #fecaca' }}>
          <div style={{ fontSize: 13, color: '#991b1b', fontWeight: 'bold' }}>Expiry Alerts</div>
          <div style={{ fontSize: 20, fontWeight: 'bold', color: '#7f1d1d' }}>3 Drugs Approaching Expiry</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {['M20', 'M21', 'M22'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{ padding: '10px 20px', borderRadius: 6, border: 'none', background: activeTab === tab ? '#0f172a' : 'white', color: activeTab === tab ? 'white' : '#64748b', cursor: 'pointer', fontWeight: 'bold', border: activeTab === tab ? 'none' : '1px solid #e2e8f0' }}>
            {tab === 'M20' ? 'M20 (Requisitions)' : tab === 'M21' ? 'M21 (Approvals)' : 'M22 (Issue Notes)'}
          </button>
        ))}
      </div>

      {activeTab === 'M20' && (
        <div style={{ background: 'white', padding: 16, borderRadius: 8, border: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: 16 }}>M20 Pharmacy Requisitions</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ background: '#f8fafc' }}>
              <tr>
                <th style={{ padding: 12 }}>M20 #</th>
                <th style={{ padding: 12 }}>Drug Name</th>
                <th style={{ padding: 12 }}>Req Qty</th>
                <th style={{ padding: 12 }}>Pharm Stock</th>
                <th style={{ padding: 12 }}>Store Stock</th>
                <th style={{ padding: 12 }}>By</th>
                <th style={{ padding: 12 }}>Date</th>
                <th style={{ padding: 12 }}>Status</th>
                <th style={{ padding: 12 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {m20Requests.map(r => (
                <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: 12, fontWeight: 'bold' }}>{r.id}</td>
                  <td style={{ padding: 12 }}>{r.drug}</td>
                  <td style={{ padding: 12, fontWeight: 'bold' }}>{r.reqQty}</td>
                  <td style={{ padding: 12 }}>{r.pharmStock}</td>
                  <td style={{ padding: 12 }}>{r.storeStock}</td>
                  <td style={{ padding: 12 }}>{r.by}</td>
                  <td style={{ padding: 12 }}>{r.date}</td>
                  <td style={{ padding: 12 }}>
                    <span style={{ padding: '4px 8px', borderRadius: 4, fontSize: 12, fontWeight: 'bold', background: r.status === 'Approved' ? '#dcfce7' : r.status === 'Rejected' ? '#fee2e2' : '#fef3c7', color: r.status === 'Approved' ? '#166534' : r.status === 'Rejected' ? '#991b1b' : '#b45309' }}>
                      {r.status}
                    </span>
                  </td>
                  <td style={{ padding: 12 }}>
                    {r.status === 'Pending CEO Approval' && (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => handleApprove(r)} style={{ background: '#22c55e', color: 'white', border: 'none', padding: '6px 12px', borderRadius: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <CheckCircle size={14}/> Approve
                        </button>
                        <button onClick={() => setRejectId(r.id)} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '6px 12px', borderRadius: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <XCircle size={14}/> Reject
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'M21' && (
        <div style={{ background: 'white', padding: 16, borderRadius: 8, border: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: 16 }}>M21 Pharmacy Approvals</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ background: '#f8fafc' }}>
              <tr>
                <th style={{ padding: 12 }}>M21 #</th>
                <th style={{ padding: 12 }}>M20 Ref</th>
                <th style={{ padding: 12 }}>Drug Name</th>
                <th style={{ padding: 12 }}>Approved Qty</th>
                <th style={{ padding: 12 }}>Approval Date</th>
                <th style={{ padding: 12 }}>CEO Name</th>
                <th style={{ padding: 12 }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {m21Approvals.map(r => (
                <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: 12, fontWeight: 'bold' }}>{r.id}</td>
                  <td style={{ padding: 12, color: '#3b82f6' }}>{r.m20Ref}</td>
                  <td style={{ padding: 12 }}>{r.drug}</td>
                  <td style={{ padding: 12, fontWeight: 'bold' }}>{r.qty}</td>
                  <td style={{ padding: 12 }}>{r.date}</td>
                  <td style={{ padding: 12 }}>{r.ceoName}</td>
                  <td style={{ padding: 12 }}><span style={{ padding: '4px 8px', borderRadius: 4, fontSize: 12, fontWeight: 'bold', background: '#dcfce7', color: '#166534' }}>{r.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'M22' && (
        <div style={{ background: 'white', padding: 16, borderRadius: 8, border: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: 16 }}>M22 Issue Notes</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ background: '#f8fafc' }}>
              <tr>
                <th style={{ padding: 12 }}>M22 #</th>
                <th style={{ padding: 12 }}>Drug Name</th>
                <th style={{ padding: 12 }}>Issued Qty</th>
                <th style={{ padding: 12 }}>Customer</th>
                <th style={{ padding: 12 }}>Type</th>
                <th style={{ padding: 12 }}>Branch</th>
                <th style={{ padding: 12 }}>Worker</th>
                <th style={{ padding: 12 }}>Date</th>
              </tr>
            </thead>
            <tbody>
              {m22Issues.map(r => (
                <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: 12, fontWeight: 'bold' }}>{r.id}</td>
                  <td style={{ padding: 12 }}>{r.drug}</td>
                  <td style={{ padding: 12, fontWeight: 'bold' }}>{r.qty}</td>
                  <td style={{ padding: 12 }}>{r.customer}</td>
                  <td style={{ padding: 12 }}>{r.type}</td>
                  <td style={{ padding: 12 }}>{r.branch}</td>
                  <td style={{ padding: 12 }}>{r.worker}</td>
                  <td style={{ padding: 12 }}>{r.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* REJECT MODAL */}
      {rejectId && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'white', padding: 24, borderRadius: 8, width: 400 }}>
            <h3>Reject M20 {rejectId}</h3>
            <textarea placeholder="Enter rejection reason (required)..." value={rejectReason} onChange={e => setRejectReason(e.target.value)} style={{ width: '100%', height: 100, padding: 8, marginBottom: 16, border: '1px solid #cbd5e1', borderRadius: 4 }}></textarea>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button onClick={() => setRejectId(null)} style={{ padding: '8px 16px', background: '#f1f5f9', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleReject} style={{ padding: '8px 16px', background: '#ef4444', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Submit</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default CEOPharmacyM20M22;
