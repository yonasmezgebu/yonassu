import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { playSound } from '../../services/notificationManager';
import styles from './StoreDeliveryDashboard.module.css';

const API = '/api/v1/purchase-flow';
const token = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

export default function StoreDeliveryDashboard({ user }) {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchDeliveries = async () => {
    try {
      const res = await axios.get(`${API}/deliveries`, token());
      setDeliveries((res.data.data || []).filter(d => d.delivery_type === 'VIA_STORE'));
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    fetchDeliveries();
    window.addEventListener('new-notification', fetchDeliveries);
    return () => window.removeEventListener('new-notification', fetchDeliveries);
  }, []);

  const receive = async (id, status) => {
    const notes = status === 'ISSUE_REPORTED' ? prompt('Describe the issue:') : '';
    setLoading(true);
    try {
      await axios.patch(`${API}/deliveries/${id}/receive`, { status, notes }, token());
      playSound(status === 'RECEIVED' ? 'success' : 'info');
      fetchDeliveries();
    } catch (e) { alert(e.response?.data?.error || 'Error'); }
    finally { setLoading(false); }
  };

  const cardBorder = (s) => {
    if (s === 'RECEIVED') return styles.cardReceived;
    if (s === 'ISSUE_REPORTED') return styles.cardIssue;
    return '';
  };

  const statusClass = (s) => {
    if (s === 'RECEIVED') return styles.statusReceived;
    if (s === 'ISSUE_REPORTED') return styles.statusIssue;
    return styles.statusPending;
  };

  return (
    <div className={styles.container}>
      <div>
        <h1 className={styles.title}>Incoming Deliveries</h1>
        <p className={styles.subtitle}>Flow 2: Confirm receipt of goods shipped via Store. Inventory is updated automatically.</p>
      </div>

      <div className={styles.grid}>
        {(deliveries || []).map(d => (
          <div key={d.id} className={`${styles.card} ${cardBorder(d.status)}`}>
            <div className={styles.cardHeader}>
              <div className={styles.cardBody}>
                <div className={styles.tenderCode}>{d.tender_code}</div>
                <div className={styles.drugInfo}>{d.drug_name || `Drug ID: ${d.drug_id}`} — <span className={styles.drugQty}>{d.quantity} units</span></div>
                <span className={`${styles.statusBadge} ${statusClass(d.status)}`}>{d.status}</span>
                {d.notes && <div className={styles.notes}>{d.notes}</div>}
              </div>
              {d.status === 'PENDING' && (
                <div className={styles.actions}>
                  <button onClick={() => receive(d.id, 'RECEIVED')} disabled={loading} className={styles.btnConfirm}>
                    ✓ Confirm Receipt
                  </button>
                  <button onClick={() => receive(d.id, 'ISSUE_REPORTED')} disabled={loading} className={styles.btnIssue}>
                    Report Issue
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
        {(!deliveries || deliveries.length === 0) && (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>🚚</div>
            <div>No incoming deliveries.</div>
          </div>
        )}
      </div>
    </div>
  );
}
