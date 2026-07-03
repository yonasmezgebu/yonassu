import React, { useState, useEffect } from 'react';
import { salesState } from '../../../../utils/salesManagerState';
import ApprovalQueueCard from './ApprovalQueueCard';

const ApprovedApprovals = () => {
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    setRequests(salesState.getApprovalRequests().filter(r => r.status === 'approved'));
    salesState.notify('PAGE_LOAD');
  }, []);

  return (
    <div style={{ padding: '24px', backgroundColor: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#0f172a', margin: '0 0 8px 0' }}>Approved Requests</h1>
        <p style={{ color: '#64748b', margin: 0 }}>Historical log of all approved transactions and digital stamps.</p>
      </div>

      <div style={{ maxWidth: '800px' }}>
        {requests.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', color: '#64748b' }}>
            No approved requests found.
          </div>
        ) : (
          requests.map(req => (
            <ApprovalQueueCard key={req.id} request={req} onProcess={() => {}} />
          ))
        )}
      </div>
    </div>
  );
};

export default ApprovedApprovals;
