import React, { useState, useEffect } from 'react';
import { FileText, Download, X, PlusCircle, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import styles from './PurchaseRequests.module.css';

const statusBadge = {
  'APPROVED': { bg: '#dcfce7', color: '#166534' },
  'PENDING_DECISION': { bg: '#fef3c7', color: '#92400e' },
  'WAIT': { bg: '#f1f5f9', color: '#475569' },
  'REJECTED': { bg: '#fee2e2', color: '#991b1b' },
};

const PurchaseRequests = () => {
  const [searchParams] = useSearchParams();
  const presetStatus = searchParams.get('status') || 'All';
  
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [filterStatus, setFilterStatus] = useState(presetStatus);
  
  // Modal State for Tender Creation
  const [tenderModal, setTenderModal] = useState(null); // null or request object
  const [tenderForm, setTenderForm] = useState({ quantity: '', closing_at: '', delivery_type: 'VIA_STORE', terms: '' });
  const [tenderLoading, setTenderLoading] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/purchase-flow/purchase-requests');
      setRequests(res.data || []);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load purchase requests');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleOpenTenderModal = (r) => {
    setTenderModal(r);
    setTenderForm({
      quantity: r.requested_qty || '',
      closing_at: '',
      delivery_type: 'VIA_STORE',
      terms: ''
    });
  };

  const handleCreateTender = async (e) => {
    e.preventDefault();
    if (!tenderForm.quantity || !tenderForm.closing_at || !tenderForm.delivery_type) {
      showToast('Please fill all required fields', 'error');
      return;
    }
    try {
      setTenderLoading(true);
      await apiClient.post('/purchase-flow/tenders', {
        purchase_request_id: tenderModal.id,
        ...tenderForm
      });
      showToast('Tender created successfully');
      setTenderModal(null);
      fetchRequests(); // refresh list
    } catch (err) {
      showToast(err.message || 'Failed to create tender', 'error');
    } finally {
      setTenderLoading(false);
    }
  };

  const filtered = requests.filter(r => 
    (filterStatus === 'All' || r.status === filterStatus)
  );

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleWrapper}>
          <h1 className={styles.title}>
            <FileText color="hsl(var(--primary))" size={28} /> PURCHASE REQUESTS
          </h1>
          <p className={styles.subtitle}>Review approved purchase requests and initiate sourcing.</p>
        </div>
        <button className={styles.btnSecondary}>
          <Download size={16} /> Export
        </button>
      </div>

      <div className={styles.card}>
        <div className={styles.filterSection}>
          <div className={styles.filterGroup}>
            <label className={styles.label}>Status</label>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className={styles.select}>
              <option value="All">All</option>
              <option value="APPROVED">Approved</option>
              <option value="WAIT">Wait / Market Task</option>
            </select>
          </div>
        </div>

        <table className={styles.table}>
          <thead>
            <tr>
              <th>Request #</th>
              <th>Item Requested</th>
              <th className={styles.textRight}>Qty</th>
              <th>Date</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className={styles.emptyState}>Loading requests...</td></tr>
            ) : error ? (
              <tr><td colSpan={7} className={styles.emptyState} style={{ color: '#ef4444' }}>{error}</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} className={styles.emptyState}>No purchase requests found.</td></tr>
            ) : (
              filtered.map(r => (
                <tr key={r.id}>
                  <td style={{ fontWeight: 600 }}>{r.request_code}</td>
                  <td style={{ fontWeight: 500 }}>
                    {r.is_new_drug ? r.new_drug_name : r.drug_name} 
                    {r.is_new_drug ? <span style={{fontSize: '0.65rem', background: '#e0e7ff', color: '#3730a3', padding: '2px 6px', borderRadius: '10px', marginLeft: '8px'}}>NEW</span> : null}
                  </td>
                  <td className={styles.textRight} style={{ fontWeight: 700 }}>{r.requested_qty}</td>
                  <td style={{ color: 'hsl(var(--muted-foreground))' }}>{new Date(r.created_at).toLocaleDateString()}</td>
                  <td>
                    <span className={styles.badge} style={{ color: r.urgency === 'URGENT' ? '#ef4444' : 'hsl(var(--muted-foreground))', background: r.urgency === 'URGENT' ? '#fef2f2' : 'hsl(var(--muted))' }}>{r.urgency || 'NORMAL'}</span>
                  </td>
                  <td>
                    <span className={styles.badge} style={{ background: statusBadge[r.status]?.bg || 'hsl(var(--muted))', color: statusBadge[r.status]?.color || 'hsl(var(--muted-foreground))' }}>
                      {r.status}
                    </span>
                  </td>
                  <td>
                    {r.status === 'APPROVED' ? (
                      <button onClick={() => handleOpenTenderModal(r)} className={styles.btnPrimary} style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem' }}>
                        <PlusCircle size={14} /> Create Tender
                      </button>
                    ) : r.status === 'WAIT' ? (
                      <span style={{ fontSize: '0.75rem', color: '#f59e0b', fontWeight: 500 }}>Pending Market Task</span>
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))' }}>Processed</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {tenderModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3>Create Tender</h3>
              <button onClick={() => setTenderModal(null)} className={styles.closeBtn}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateTender} className={styles.modalBody}>
              <div className={styles.infoBox}>
                <strong>Request:</strong> {tenderModal.request_code} <br/>
                <strong>Item:</strong> {tenderModal.is_new_drug ? tenderModal.new_drug_name : tenderModal.drug_name}
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Tender Quantity <span className={styles.required}>*</span></label>
                <input 
                  type="number" 
                  value={tenderForm.quantity} 
                  onChange={e => setTenderForm({...tenderForm, quantity: e.target.value})} 
                  className={styles.inputField}
                  required
                  min="1"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Closing Date & Time <span className={styles.required}>*</span></label>
                <input 
                  type="datetime-local" 
                  value={tenderForm.closing_at} 
                  onChange={e => setTenderForm({...tenderForm, closing_at: e.target.value})} 
                  className={styles.inputField}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Delivery Type <span className={styles.required}>*</span></label>
                <select 
                  value={tenderForm.delivery_type} 
                  onChange={e => setTenderForm({...tenderForm, delivery_type: e.target.value})} 
                  className={styles.select}
                >
                  <option value="VIA_STORE">Via Store</option>
                  <option value="DIRECT_TO_PHARMACY">Direct to Pharmacy</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Terms / Notes</label>
                <textarea 
                  value={tenderForm.terms} 
                  onChange={e => setTenderForm({...tenderForm, terms: e.target.value})} 
                  className={styles.inputField}
                  style={{ minHeight: '80px', resize: 'vertical' }}
                  placeholder="Additional instructions for bidders..."
                />
              </div>

              <div className={styles.modalFooter}>
                <button type="button" onClick={() => setTenderModal(null)} className={styles.btnSecondary}>
                  Cancel
                </button>
                <button type="submit" disabled={tenderLoading} className={styles.btnPrimary}>
                  {tenderLoading ? 'Processing...' : 'Create Tender'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast && (
        <div className={`${styles.toast} ${toast.type === 'error' ? styles.toastError : styles.toastSuccess}`}>
          {toast.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
          <span>{toast.msg}</span>
        </div>
      )}
    </div>
  );
};

export default PurchaseRequests;
