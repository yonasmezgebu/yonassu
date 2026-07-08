import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styles from './PharmacyPurchaseDashboard.module.css';

const API = '/api/v1/purchase-flow';
const token = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

const EMPTY_F2 = { drug_id: '', requested_qty: '', urgency: 'MEDIUM' };
const EMPTY_F3 = {
  new_drug_name: '', new_drug_strength: '', new_drug_unit: '',
  new_drug_category: '', new_drug_classification: '', new_drug_therapeutic_use: '',
  purpose_reason: '', requested_qty: '', urgency: 'MEDIUM',
};

export default function PharmacyPurchaseDashboard({ user }) {
  const [requests, setRequests] = useState([]);
  const [isNewDrug, setIsNewDrug] = useState(false);
  const [form2, setForm2] = useState(EMPTY_F2);
  const [form3, setForm3] = useState(EMPTY_F3);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchRequests = async () => {
    try {
      const res = await axios.get(`${API}/purchase-requests`, token());
      setRequests(res.data.data || []);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    fetchRequests();
    const handler = () => fetchRequests();
    window.addEventListener('new-notification', handler);
    return () => window.removeEventListener('new-notification', handler);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      if (isNewDrug) {
        await axios.post(`${API}/purchase-requests`, {
          is_new_drug: true,
          new_drug_name: form3.new_drug_name,
          new_drug_strength: form3.new_drug_strength,
          new_drug_unit: form3.new_drug_unit || undefined,
          new_drug_category: form3.new_drug_category,
          new_drug_classification: form3.new_drug_classification,
          new_drug_therapeutic_use: form3.new_drug_therapeutic_use,
          purpose_reason: form3.purpose_reason,
          requested_qty: parseInt(form3.requested_qty),
          urgency: form3.urgency,
        }, token());
        setSuccess('New drug purchase request submitted successfully. CEO has been notified.');
        setForm3(EMPTY_F3);
      } else {
        await axios.post(`${API}/purchase-requests`, {
          drug_id: parseInt(form2.drug_id),
          requested_qty: parseInt(form2.requested_qty),
          urgency: form2.urgency,
        }, token());
        setSuccess('Purchase request submitted successfully. CEO has been notified.');
        setForm2(EMPTY_F2);
      }
      fetchRequests();
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  const f3Change = (field) => (e) => setForm3(f => ({ ...f, [field]: e.target.value }));
  const f2Change = (field) => (e) => setForm2(f => ({ ...f, [field]: e.target.value }));

  const urgencyClass = (u) => {
    if (u === 'HIGH') return styles.badgePriorityHigh;
    if (u === 'MEDIUM') return styles.badgePriorityMedium;
    return styles.badgePriorityLow;
  };

  const statusClass = (s) => {
    if (s === 'PENDING_DECISION') return styles.badgePending;
    if (s === 'APPROVED') return styles.badgeApproved;
    if (s === 'REJECTED') return styles.badgeRejected;
    if (s === 'WAIT') return styles.badgeWait;
    return styles.badgeGray;
  };

  return (
    <div className={styles.container}>
      <div className={styles.flexBetween}>
        <div>
          <h1 className={styles.headerTitle}>Purchase Requests</h1>
          <p className={styles.headerSub}>Submit purchase requests for low or new drugs</p>
        </div>
      </div>

      <div className={styles.toggleBar}>
        <button type="button" onClick={() => { setIsNewDrug(false); setError(''); setSuccess(''); }}
          className={`${styles.toggleBtn} ${!isNewDrug ? styles.toggleBtnActive : styles.toggleBtnInactive}`}>
          📦 Restock Existing Drug (Flow 2)
        </button>
        <button type="button" onClick={() => { setIsNewDrug(true); setError(''); setSuccess(''); }}
          className={`${styles.toggleBtn} ${isNewDrug ? styles.toggleBtnActive : styles.toggleBtnInactive}`}>
          🆕 Request New Drug (Flow 3)
        </button>
      </div>

      <div className={`${styles.formCard} ${isNewDrug ? styles.formCardPurple : ''}`}>
        <div className={styles.formHeader}>
          <h2 className={styles.formTitle}>
            {isNewDrug ? '🆕 New Drug Request — Not Previously Stocked' : '📦 Purchase Request — Low Stock'}
          </h2>
          {isNewDrug && (
            <p className={styles.formNote}>
              Use this form only for drugs that <strong>do not exist</strong> in the system at all. If the drug exists
              but stock is low, use the "Restock Existing Drug" option instead.
            </p>
          )}
        </div>

        {error && <div className={`${styles.alert} ${styles.alertError}`}>{error}</div>}
        {success && <div className={`${styles.alert} ${styles.alertSuccess}`}>{success}</div>}

        <form onSubmit={handleSubmit}>
          {!isNewDrug ? (
            <div className={styles.grid3}>
              <div>
                <label className={styles.fieldLabel}>Drug ID</label>
                <input type="number" required min="1" className={styles.fieldInput}
                  value={form2.drug_id} onChange={f2Change('drug_id')} placeholder="Enter drug ID" />
              </div>
              <div>
                <label className={styles.fieldLabel}>Quantity Needed</label>
                <input type="number" required min="1" className={styles.fieldInput}
                  value={form2.requested_qty} onChange={f2Change('requested_qty')} />
              </div>
              <div>
                <label className={styles.fieldLabel}>Urgency</label>
                <select className={styles.fieldInput} value={form2.urgency} onChange={f2Change('urgency')}>
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                </select>
              </div>
              <div className={styles.colSpan3}>
                <button type="submit" disabled={submitting} className={styles.btnPrimary}>
                  {submitting ? 'Submitting…' : 'Submit Purchase Request'}
                </button>
              </div>
            </div>
          ) : (
            <div className={styles.grid2}>
              <div>
                <label className={styles.fieldLabel}>Drug Name <span className={styles.requiredStar}>*</span></label>
                <input type="text" required className={`${styles.fieldInput} ${styles.fieldInputPurple}`}
                  value={form3.new_drug_name} onChange={f3Change('new_drug_name')} placeholder="e.g. Amoxicillin" />
              </div>
              <div>
                <label className={styles.fieldLabel}>Strength <span className={styles.requiredStar}>*</span></label>
                <input type="text" required className={`${styles.fieldInput} ${styles.fieldInputPurple}`}
                  value={form3.new_drug_strength} onChange={f3Change('new_drug_strength')} placeholder="e.g. 500mg" />
              </div>
              <div>
                <label className={styles.fieldLabel}>Unit (optional)</label>
                <input type="text" className={`${styles.fieldInput} ${styles.fieldInputPurple}`}
                  value={form3.new_drug_unit} onChange={f3Change('new_drug_unit')} placeholder="e.g. Tablet, Capsule, ml" />
              </div>
              <div>
                <label className={styles.fieldLabel}>Category <span className={styles.requiredStar}>*</span></label>
                <input type="text" required className={`${styles.fieldInput} ${styles.fieldInputPurple}`}
                  value={form3.new_drug_category} onChange={f3Change('new_drug_category')} placeholder="e.g. Antibiotic" />
              </div>
              <div>
                <label className={styles.fieldLabel}>Classification <span className={styles.requiredStar}>*</span></label>
                <input type="text" required className={`${styles.fieldInput} ${styles.fieldInputPurple}`}
                  value={form3.new_drug_classification} onChange={f3Change('new_drug_classification')} placeholder="e.g. Prescription, OTC" />
              </div>
              <div>
                <label className={styles.fieldLabel}>Quantity Needed <span className={styles.requiredStar}>*</span></label>
                <input type="number" required min="1" className={`${styles.fieldInput} ${styles.fieldInputPurple}`}
                  value={form3.requested_qty} onChange={f3Change('requested_qty')} />
              </div>
              <div>
                <label className={styles.fieldLabel}>Urgency</label>
                <select className={`${styles.fieldInput} ${styles.fieldInputPurple}`} value={form3.urgency} onChange={f3Change('urgency')}>
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                </select>
              </div>
              <div className={styles.colSpan2}>
                <label className={styles.fieldLabel}>Therapeutic Use <span className={styles.requiredStar}>*</span></label>
                <textarea required rows={2} className={`${styles.fieldInput} ${styles.fieldInputPurple}`}
                  value={form3.new_drug_therapeutic_use} onChange={f3Change('new_drug_therapeutic_use')}
                  placeholder="Describe what this drug treats / its intended use" />
              </div>
              <div className={styles.colSpan2}>
                <label className={styles.fieldLabel}>Purpose / Reasoning <span className={styles.requiredStar}>*</span></label>
                <textarea required rows={3} className={`${styles.fieldInput} ${styles.fieldInputPurple}`}
                  value={form3.purpose_reason} onChange={f3Change('purpose_reason')}
                  placeholder="Why is this drug needed? What patient demand or clinical need justifies adding it?" />
              </div>
              <div className={styles.colSpan2}>
                <button type="submit" disabled={submitting} className={styles.btnPurple}>
                  {submitting ? 'Submitting…' : '🆕 Submit New Drug Request'}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>

      <div className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <h2>My Purchase Requests</h2>
          <span className={styles.tableCount}>{(requests || []).length} total</span>
        </div>
        <div className={styles.scrollX}>
          <table className={styles.table}>
            <thead>
              <tr>
                {['Code', 'Drug', 'Type', 'Qty', 'Urgency', 'Status', 'Reason / Notes'].map(h => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(requests || []).map(r => (
                <tr key={r.id}>
                  <td className={styles.codeCell}>{r.request_code}</td>
                  <td>
                    {r.is_new_drug ? (
                      <span><span className={styles.badgeNew}>NEW</span>{r.new_drug_name} {r.new_drug_strength}</span>
                    ) : (
                      <span>{r.drug_name || `Drug #${r.drug_id}`}</span>
                    )}
                  </td>
                  <td className={styles.codeCell}>
                    {r.scenario === 'NEW_DRUG' ? <span className={styles.badgeNew}>New Drug</span> : r.scenario?.replace(/_/g, ' ')}
                  </td>
                  <td>{r.requested_qty}</td>
                  <td>
                    <span className={`${styles.badgeUrgency} ${urgencyClass(r.urgency)}`}>{r.urgency}</span>
                  </td>
                  <td>
                    <span className={`${styles.badgeStatus} ${statusClass(r.status)}`}>{r.status}</span>
                  </td>
                  <td className={styles.truncate}>{r.decision_reason || r.purpose_reason || '—'}</td>
                </tr>
              ))}
              {(!requests || requests.length === 0) && (
                <tr><td colSpan={7} className={styles.emptyState}>No purchase requests yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
