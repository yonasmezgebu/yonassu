import React, { useState, useEffect } from 'react';
import axios from 'axios';
import PushManager from '../../services/PushManager';
import styles from './StoreTransferDashboard.module.css';

const StoreTransferDashboard = ({ user }) => {
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
    if (user && user.role === 'Store Manager') {
      PushManager.init(user.id, user.role);
    }
    fetchRequests();

    const handleNotification = () => fetchRequests();
    window.addEventListener('new-notification', handleNotification);
    return () => window.removeEventListener('new-notification', handleNotification);
  }, [user]);

  const handleShip = async (id, requestedQty) => {
    const qty = prompt(`Enter quantity to ship (Requested: ${requestedQty}):`, requestedQty);
    if (!qty) return;

    setLoading(true);
    try {
      await axios.patch(`/api/v1/transfer-requests/${id}/ship`, { shipped_qty: parseInt(qty) }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      fetchRequests();
    } catch (err) {
      alert(err.response?.data?.error || 'Error shipping request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Store Transfer Dashboard</h1>

      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Approved Requests Pending Shipment</h2>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Code</th>
              <th>Drug</th>
              <th>Requested Qty</th>
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
                  <span className={`${styles.statusBadge} ${req.status === 'APPROVED' ? styles.statusApproved : styles.statusDefault}`}>
                    {req.status}
                  </span>
                </td>
                <td className={`${styles.cellNowrap}`}>
                  {req.status === 'APPROVED' && (
                    <button onClick={() => handleShip(req.id, req.requested_qty)} disabled={loading} className={styles.shipBtn}>
                      Ship Order
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {(!requests || requests.length === 0) && (
              <tr><td colSpan="5" className={styles.emptyRow}>No requests available.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StoreTransferDashboard;
