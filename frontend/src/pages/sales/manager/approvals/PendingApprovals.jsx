import React, { useState, useEffect } from 'react';
import { salesState } from '../../../../utils/salesManagerState';
import ApprovalQueueCard from './ApprovalQueueCard';

const PendingApprovals = () => {
  const [requests, setRequests] = useState([]);

  const loadData = () => {
    setRequests(salesState.getApprovalRequests().filter(r => r.status === 'pending'));
  };

  useEffect(() => {
    loadData();
    salesState.notify('PAGE_LOAD');
  }, []);

  const handleProcess = (id, action, reason) => {
    try {
      salesState.processApproval(id, action, reason);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div style={{ padding: '24px', backgroundColor: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#0f172a', margin: '0 0 8px 0' }}>Pending Approvals</h1>
        <p style={{ color: '#64748b', margin: 0 }}>Review and act on transactions awaiting managerial sign-off.</p>
      </div>

      <div style={{ maxWidth: '800px' }}>
        {requests.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', backgroundColor: 'white', borderRadius: 0, border: '1px solid #e2e8f0', color: '#64748b' }}>
            No pending approval requests at this time.
          </div>
        ) : (
          requests.map(req => (
            <ApprovalQueueCard key={req.id} request={req} onProcess={handleProcess} />
          ))
        )}
      </div>
    </div>
  );
};

export default PendingApprovals;
