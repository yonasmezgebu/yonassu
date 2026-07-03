import React, { useState, useEffect } from 'react';
import { RotateCcw, CheckCircle, XCircle } from 'lucide-react';
import { printingState, approveReprint } from '../../utils/printingTransactionService';
import { playSound } from '../../utils/printingSound';

const PrintingReprintApproval = () => {
  const [requests, setRequests] = useState([]);

  const refresh = () => setRequests([...printingState.reprintRequests.filter(r => r.status === 'Pending')]);

  useEffect(() => {
    refresh();
    playSound('info'); // "🔄 Reprint Request - Action Required"
  }, []);

  const handleAction = (id, act) => {
    if (act === 'Approve') {
      if(window.confirm('Formally approve this reprint and create a child job?')) {
        approveReprint(id);
        playSound('success');
        alert('Reprint Approved. Scheduled in production.');
        refresh();
      }
    } else {
      const reason = prompt('Mandatory rejection reason:');
      if (reason) {
        const req = printingState.reprintRequests.find(r => r.id === id);
        if(req) req.status = 'Rejected';
        playSound('success');
        refresh();
      }
    }
  };

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: '#0f172a' }}>
          <RotateCcw color="#ef4444" size={28} /> REPRINT APPROVAL
        </h1>
        <p style={{ color: '#64748b', margin: '4px 0 0' }}>Formal sign-off gate to authorize reprints into the schedule.</p>
      </div>

      <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              {['Original Job', 'Reason', 'Cost Liability', 'Date Requested', 'Actions'].map(col => (
                <th key={col} style={{ padding: '12px 14px', textAlign: 'left', color: '#475569', fontWeight: 600, fontSize: 13 }}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {requests.map(r => (
              <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '12px 14px', fontWeight: 700, color: '#0f172a' }}>{r.originalJobId}</td>
                <td style={{ padding: '12px 14px', color: '#ef4444', fontWeight: 600 }}>{r.reason}</td>
                <td style={{ padding: '12px 14px' }}>
                  <span style={{ padding: '4px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700, background: r.isBillable ? '#fef3c7' : '#e0e7ff', color: r.isBillable ? '#d97706' : '#4f46e5' }}>
                    {r.isBillable ? 'Billable (Client)' : 'Non-Billable (Internal)'}
                  </span>
                </td>
                <td style={{ padding: '12px 14px', color: '#475569' }}>{r.date}</td>
                <td style={{ padding: '12px 14px' }}>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => handleAction(r.id, 'Approve')} style={{ padding: '6px 12px', background: '#ecfdf5', color: '#10b981', border: '1px solid #a7f3d0', borderRadius: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600 }}><CheckCircle size={14} /> Approve</button>
                    <button onClick={() => handleAction(r.id, 'Reject')} style={{ padding: '6px 12px', background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', borderRadius: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600 }}><XCircle size={14} /> Reject</button>
                  </div>
                </td>
              </tr>
            ))}
            {requests.length === 0 && <tr><td colSpan={5} style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>No pending reprint approvals.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PrintingReprintApproval;
