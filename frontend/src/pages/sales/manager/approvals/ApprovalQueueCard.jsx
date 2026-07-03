import React, { useState } from 'react';
import { salesState } from '../../../../utils/salesManagerState';
import CurrencyDisplay from '../../components/CurrencyDisplay';
import SalesStatusBadge from '../../components/SalesStatusBadge';

const ApprovalQueueCard = ({ request, onProcess }) => {
  const [reason, setReason] = useState('');

  const handleAction = (action) => {
    if (action === 'rejected' && !reason) {
      alert("Please provide a rejection reason.");
      return;
    }
    onProcess(request.id, action, reason);
  };

  return (
    <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
        <div>
          <span style={{ fontSize: '14px', fontWeight: '600', color: '#64748b' }}>{request.request_number}</span>
          <h3 style={{ margin: '4px 0 0 0', color: '#0f172a', textTransform: 'capitalize' }}>{request.type.replace('_', ' ')} Approval</h3>
        </div>
        <SalesStatusBadge status={request.status} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '14px' }}>
        <div>
          <span style={{ color: '#64748b', display: 'block', marginBottom: '4px' }}>Requested By</span>
          <span style={{ color: '#1e293b', fontWeight: '500' }}>{request.requested_by}</span>
        </div>
        <div>
          <span style={{ color: '#64748b', display: 'block', marginBottom: '4px' }}>Date</span>
          <span style={{ color: '#1e293b', fontWeight: '500' }}>{new Date(request.requested_at).toLocaleDateString()}</span>
        </div>
        <div>
          <span style={{ color: '#64748b', display: 'block', marginBottom: '4px' }}>Customer</span>
          <span style={{ color: '#1e293b', fontWeight: '500' }}>{salesState.getCustomers().find(c => c.id === request.customer_id)?.name}</span>
        </div>
        <div>
          <span style={{ color: '#64748b', display: 'block', marginBottom: '4px' }}>Amount</span>
          <CurrencyDisplay amountCents={request.amount_cents} style={{ fontWeight: '600', color: '#1e293b' }} />
        </div>
      </div>

      {request.status === 'pending' && (
        <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #f1f5f9' }}>
           <input 
             type="text" 
             placeholder="Rejection reason (required if rejecting)..."
             value={reason}
             onChange={(e) => setReason(e.target.value)}
             style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', marginBottom: '12px', boxSizing: 'border-box' }}
           />
           <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
             <button onClick={() => handleAction('rejected')} style={{ padding: '8px 16px', backgroundColor: 'white', color: '#ef4444', border: '1px solid #fca5a5', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' }}>Reject</button>
             <button onClick={() => handleAction('approved')} style={{ padding: '8px 16px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' }}>Approve</button>
           </div>
        </div>
      )}

      {request.status === 'rejected' && request.rejection_reason && (
        <div style={{ marginTop: '12px', padding: '12px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', color: '#991b1b', fontSize: '14px' }}>
          <strong>Reason for rejection:</strong> {request.rejection_reason}
        </div>
      )}

      {request.status === 'approved' && request.stamp_id && (
        <div style={{ marginTop: '12px', padding: '12px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px', color: '#166534', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span><strong>Approved By:</strong> {request.decided_by}</span>
          <span style={{ fontFamily: 'monospace', fontSize: '12px', color: '#15803d' }}>Stamp: {request.stamp_id}</span>
        </div>
      )}
    </div>
  );
};

export default ApprovalQueueCard;
