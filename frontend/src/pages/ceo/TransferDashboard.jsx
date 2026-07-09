import React, { useState, useEffect } from 'react';
import axios from 'axios';
import PushManager from '../../services/PushManager';
import styles from './CEOTransferDashboard.module.css';

const CEOTransferDashboard = ({ user }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchRequests = async () => {
    try {
      const res = await axios.get('/api/v1/transfer-requests', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setRequests(res.data?.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (user && user.role === 'CEO') {
      PushManager.init(user.id, user.role);
    }
    fetchRequests();

    const handleNotification = () => fetchRequests();
    window.addEventListener('new-notification', handleNotification);
    return () => window.removeEventListener('new-notification', handleNotification);
  }, [user]);

  const handleDecision = async (id, decision) => {
    let reason = '';
    if (decision === 'REJECTED') {
      reason = prompt('Please provide a reason for rejection:');
      if (!reason) return;
    }

    setLoading(true);
    try {
      await axios.patch(`/api/v1/transfer-requests/${id}/decision`, { decision, reason }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      fetchRequests();
    } catch (err) {
      alert(err.response?.data?.error || 'Error saving decision');
    } finally {
      setLoading(false);
    }
  };

  const statusClass = (s) => {
    if (s === 'PENDING_APPROVAL') return styles.statusPending;
    if (s === 'DISCREPANCY') return styles.statusDiscrepancy;
    return styles.statusDefault;
  };

  return (
    <div className={styles.container} style={{ padding: '20px', fontFamily: 'Inter, sans-serif' }}>
      <h1 className={styles.title} style={{ marginBottom: '20px', color: '#1e293b' }}>CEO Transfer Approvals</h1>

      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Needs Review</h2>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Code</th>
              <th>Drug</th>
              <th>Req Qty</th>
              <th>Pharmacy Qty (Snap)</th>
              <th>Store Qty (Snap)</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {(requests || []).map(req => (
              <React.Fragment key={req.id}>
                <tr className={req.status === 'DISCREPANCY' ? styles.discrepancyRow : ''} style={{ borderBottom: '1px solid #e2e8f0', background: 'white' }}>
                  <td className={styles.cellNowrap} style={{ padding: '12px' }}><strong>{req.request_code}</strong></td>
                  <td className={styles.cellNowrap} style={{ padding: '12px' }}>{req.drug_name || req.drug_id}</td>
                  <td className={`${styles.cellNowrap} ${styles.qtyBold}`} style={{ padding: '12px', color: '#0284c7', fontSize: '1.1em' }}>{req.requested_qty}</td>
                  <td className={styles.cellNowrap} style={{ padding: '12px' }}>{req.pharmacy_qty_at_request}</td>
                  <td className={styles.cellNowrap} style={{ padding: '12px' }}>{req.store_qty_at_request}</td>
                  <td className={styles.cellNowrap} style={{ padding: '12px' }}>
                    <span className={`${styles.statusBadge} ${statusClass(req.status)}`}>{req.status}</span>
                    {req.status === 'DISCREPANCY' && <div style={{ color: '#ef4444', fontSize: '0.85em', marginTop: '4px' }}>{req.decision_reason}</div>}
                  </td>
                  <td className={styles.cellNowrap} style={{ padding: '12px' }}>
                    {(req.status === 'PENDING_APPROVAL' || req.status === 'DISCREPANCY') && (
                      <div className={styles.actions} style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => handleDecision(req.id, 'APPROVED')} disabled={loading} style={{ padding: '8px 16px', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Approve</button>
                        <button onClick={() => handleDecision(req.id, 'REJECTED')} disabled={loading} style={{ padding: '8px 16px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Reject</button>
                      </div>
                    )}
                  </td>
                </tr>
                {req.signature && (
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #cbd5e1' }}>
                    <td colSpan="7" style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '600', marginBottom: '4px' }}>Pharmacy Manager Signature (Signed at request)</div>
                          <img src={req.signature} alt="Digital Signature" style={{ height: '60px', border: '1px dashed #cbd5e1', background: 'white', borderRadius: '4px', padding: '4px' }} />
                        </div>
                        <div style={{ textAlign: 'right', fontSize: '13px', color: '#64748b' }}>
                          <div>Requested By: <strong>ID {req.created_by}</strong></div>
                          <div>Urgency: <strong>{req.urgency}</strong></div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
            {(!requests || requests.length === 0) && (
              <tr><td colSpan="7" className={styles.emptyRow} style={{ padding: '20px', textAlign: 'center', color: '#94a3b8' }}>No requests require review.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CEOTransferDashboard;
