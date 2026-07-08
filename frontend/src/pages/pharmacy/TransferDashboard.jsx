import React, { useState, useEffect } from 'react';
import axios from 'axios';
import PushManager from '../../services/PushManager';
import styles from './PharmacyTransferDashboard.module.css';

const PharmacyTransferDashboard = ({ user }) => {
  const [requests, setRequests] = useState([]);
  const [selectedDrug, setSelectedDrug] = useState('');
  const [requestedQty, setRequestedQty] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
    if (user && user.role === 'Pharmacy Manager') {
      PushManager.init(user.id, user.role);
    }
    fetchRequests();

    const handleNotification = () => fetchRequests();
    window.addEventListener('new-notification', handleNotification);
    return () => window.removeEventListener('new-notification', handleNotification);
  }, [user]);

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await axios.post('/api/v1/transfer-requests', {
        drug_id: selectedDrug,
        requested_qty: parseInt(requestedQty),
        urgency: 'MEDIUM'
      }, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      
      setRequestedQty('');
      setSelectedDrug('');
      fetchRequests();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create request');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id) => {
    try {
      await axios.patch(`/api/v1/transfer-requests/${id}/cancel`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      fetchRequests();
    } catch (err) {
      alert(err.response?.data?.error || 'Error cancelling request');
    }
  };

  const handleReceive = async (id, shippedQty) => {
    const qty = prompt(`Enter received quantity (Shipped: ${shippedQty}):`, shippedQty);
    if (!qty) return;
    try {
      await axios.patch(`/api/v1/transfer-requests/${id}/receive`, { received_qty: parseInt(qty) }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      fetchRequests();
    } catch (err) {
      alert(err.response?.data?.error || 'Error receiving request');
    }
  };

  const statusClass = (status) => {
    if (status === 'COMPLETED') return styles.statusCompleted;
    if (status === 'REJECTED' || status === 'CANCELLED') return styles.statusRejected;
    return styles.statusPending;
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Pharmacy Transfer Dashboard</h1>
      
      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Create New Transfer Request</h2>
        <form onSubmit={handleCreateRequest} className={styles.formRow}>
          <div className={styles.fieldGroup}>
            <label className={styles.label}>Drug ID</label>
            <input type="number" value={selectedDrug} onChange={e => setSelectedDrug(e.target.value)} className={styles.input} required />
          </div>
          <div className={styles.fieldGroup}>
            <label className={styles.label}>Quantity</label>
            <input type="number" value={requestedQty} onChange={e => setRequestedQty(e.target.value)} className={styles.input} required />
          </div>
          <button type="submit" disabled={loading} className={styles.submitBtn}>
            {loading ? 'Submitting...' : 'Request Stock'}
          </button>
        </form>
      </div>

      <div className={styles.tableCard}>
        <h2 className={styles.tableHeader}>Your Requests</h2>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Code</th>
              <th>Drug</th>
              <th>Requested</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {(requests || []).map(req => (
              <tr key={req.id}>
                <td className={styles.cellNowrap}>{req.request_code}</td>
                <td className={styles.cellNowrap}>{req.drug_name || req.drug_id}</td>
                <td className={styles.cellNowrap}>{req.requested_qty}</td>
                <td className={styles.cellNowrap}>
                  <span className={`${styles.statusBadge} ${statusClass(req.status)}`}>
                    {req.status}
                  </span>
                </td>
                <td className={`${styles.cellNowrap}`}>
                  {req.status === 'PENDING_APPROVAL' && (
                    <button onClick={() => handleCancel(req.id)} className={styles.cancelBtn}>Cancel</button>
                  )}
                  {req.status === 'SHIPPED' && (
                    <button onClick={() => handleReceive(req.id, req.shipped_qty)} className={styles.receiveBtn}>Confirm Receipt</button>
                  )}
                </td>
              </tr>
            ))}
            {(!requests || requests.length === 0) && (
              <tr><td colSpan="5" className={styles.emptyRow}>No requests found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PharmacyTransferDashboard;
