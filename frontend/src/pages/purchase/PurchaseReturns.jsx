import React, { useState, useEffect } from 'react';
import { RotateCcw, Download, Plus, Send, X, AlertCircle, CheckCircle2, Trash2, FileText, ShoppingCart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import styles from './PurchaseReturns.module.css';


const REASONS = ['Damaged Goods', 'Wrong Items', 'Quality Issue', 'Expired/Expiring', 'Overstock'];
const METHODS = ['Ship', 'In-person', 'Courier'];

const statusColors = {
  Pending:    { bg: '#fef3c7', color: '#92400e' },
  Authorized: { bg: '#e0e7ff', color: '#3730a3' },
  Shipped:    { bg: '#e0f2fe', color: '#0369a1' },
  Completed:  { bg: '#dcfce7', color: '#16a34a' },
  Cancelled:  { bg: '#fee2e2', color: '#991b1b' },
};

const emptyForm = {
  po_ref: '', supplier_name: '', item: '',
  qty: '', reason: 'Damaged Goods', auth_number: '', method: 'Ship', notes: '',
};

const PurchaseReturns = () => {
  const navigate = useNavigate();
  const [returns, setReturns]           = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterReason, setFilterReason] = useState('All');
  const [showModal, setShowModal]       = useState(false);
  const [form, setForm]                 = useState(emptyForm);
  const [submitting, setSubmitting]     = useState(false);
  const [toast, setToast]               = useState(null);

  useEffect(() => { fetchReturns(); }, []);

  const fetchReturns = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/purchase-returns');
      setReturns(res.data || []);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load returns');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleOpenModal = () => {
    setForm(emptyForm);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await apiClient.post('/purchase-returns', form);
      showToast('Return note created successfully');
      setShowModal(false);
      fetchReturns();
    } catch (err) {
      showToast(err.message || 'Failed to create return', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      await apiClient.patch(`/purchase-returns/${id}/status`, { status });
      showToast(`Status updated to ${status}`);
      fetchReturns();
    } catch (err) {
      showToast(err.message || 'Failed to update status', 'error');
    }
  };

  const handleDelete = async (id) => {
    try {
      await apiClient.delete(`/purchase-returns/${id}`);
      showToast('Return deleted');
      fetchReturns();
    } catch (err) {
      showToast(err.message || 'Failed to delete return', 'error');
    }
  };

  const filtered = returns.filter(r =>
    (filterStatus === 'All' || r.status === filterStatus) &&
    (filterReason === 'All' || r.reason === filterReason)
  );

  return (
    <div className={styles.container}>

      {/* Header */}
      <div className={styles.header}>
        <div className={styles.titleWrapper}>
          <h1 className={styles.title}>
            <RotateCcw size={26} /> PURCHASE RETURNS
          </h1>
          <p className={styles.subtitle}>Manage return of goods and trigger inventory/financial adjustments.</p>
          
          <div className={styles.navTabs}>
            <button className={`${styles.navTab} ${styles.navTabInactive}`} onClick={() => navigate('/purchase/requests')}>
              <FileText size={16} /> Purchase Requests
            </button>
            <button className={`${styles.navTab} ${styles.navTabInactive}`} onClick={() => navigate('/purchase/orders')}>
              <ShoppingCart size={16} /> Purchase Orders
            </button>
            <button className={`${styles.navTab} ${styles.navTabActive}`} onClick={() => navigate('/purchase/returns')}>
              <RotateCcw size={16} /> Purchase Returns
            </button>
          </div>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.btnPrimary} onClick={handleOpenModal}>
            <Plus size={16} /> Create Return
          </button>
          <button className={styles.btnSecondary}>
            <Download size={16} /> Export
          </button>
        </div>
      </div>

      {/* Filters + Table card */}
      <div className={styles.card}>
        <div className={styles.filterBar}>
          <div className={styles.filterGroup}>
            <label className={styles.label}>Status</label>
            <select className={styles.select} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="All">All</option>
              {['Pending', 'Authorized', 'Shipped', 'Completed', 'Cancelled'].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div className={styles.filterGroup}>
            <label className={styles.label}>Reason</label>
            <select className={styles.select} value={filterReason} onChange={e => setFilterReason(e.target.value)}>
              <option value="All">All</option>
              {REASONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        </div>

        <table className={styles.table}>
          <thead>
            <tr>
              <th>Return #</th>
              <th>Date</th>
              <th>PO #</th>
              <th>Supplier</th>
              <th>Item</th>
              <th className={styles.textRight}>Qty</th>
              <th>Reason</th>
              <th>Auth #</th>
              <th>Method</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={11} className={styles.emptyState}>Loading returns…</td></tr>
            ) : error ? (
              <tr><td colSpan={11} className={styles.emptyState} style={{ color: '#ef4444' }}>{error}</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={11} className={styles.emptyState}>No return records found.</td></tr>
            ) : filtered.map(r => {
              const sc = statusColors[r.status] || statusColors.Pending;
              return (
                <tr key={r.id}>
                  <td style={{ fontWeight: 700 }}>{r.return_code}</td>
                  <td style={{ color: 'hsl(var(--muted-foreground))' }}>{new Date(r.created_at).toLocaleDateString()}</td>
                  <td style={{ color: '#8b5cf6', fontWeight: 500 }}>{r.po_ref}</td>
                  <td>{r.supplier_name}</td>
                  <td style={{ color: 'hsl(var(--muted-foreground))' }}>{r.item}</td>
                  <td className={styles.textRight} style={{ fontWeight: 700 }}>{r.qty}</td>
                  <td style={{ color: '#dc2626' }}>{r.reason}</td>
                  <td style={{ fontFamily: 'monospace', color: 'hsl(var(--muted-foreground))' }}>{r.auth_number || '—'}</td>
                  <td style={{ color: 'hsl(var(--muted-foreground))' }}>{r.method}</td>
                  <td>
                    <span className={styles.badge} style={{ background: sc.bg, color: sc.color }}>{r.status}</span>
                  </td>
                  <td>
                    <div className={styles.rowActions}>
                      {r.status === 'Pending' && (
                        <button
                          className={styles.actionBtn}
                          style={{ background: '#e0e7ff', color: '#3730a3' }}
                          onClick={() => handleStatusUpdate(r.id, 'Authorized')}
                        >Authorize</button>
                      )}
                      {r.status === 'Authorized' && (
                        <button
                          className={styles.actionBtn}
                          style={{ background: '#e0f2fe', color: '#0369a1' }}
                          onClick={() => handleStatusUpdate(r.id, 'Shipped')}
                        >Mark Shipped</button>
                      )}
                      {r.status === 'Shipped' && (
                        <button
                          className={styles.actionBtn}
                          style={{ background: '#dcfce7', color: '#16a34a' }}
                          onClick={() => handleStatusUpdate(r.id, 'Completed')}
                        >Complete</button>
                      )}
                      {r.status === 'Pending' && (
                        <button
                          className={styles.actionBtn}
                          style={{ background: '#fee2e2', color: '#991b1b' }}
                          onClick={() => handleDelete(r.id)}
                          title="Delete"
                        ><Trash2 size={13} /></button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Create Return Modal */}
      {showModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3><RotateCcw size={20} /> Create Return Note</h3>
              <button className={styles.closeBtn} onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className={styles.modalBody}>
                <div className={styles.formGrid2}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>PO Reference #<span className={styles.required}>*</span></label>
                    <input
                      className={styles.inputField}
                      value={form.po_ref}
                      onChange={e => setForm({ ...form, po_ref: e.target.value })}
                      placeholder="PO-XXXX"
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Supplier Name<span className={styles.required}>*</span></label>
                    <input
                      className={styles.inputField}
                      value={form.supplier_name}
                      onChange={e => setForm({ ...form, supplier_name: e.target.value })}
                      placeholder="Supplier name"
                      required
                    />
                  </div>
                </div>

                <div className={styles.formGridItem2}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Item to Return<span className={styles.required}>*</span></label>
                    <input
                      className={styles.inputField}
                      value={form.item}
                      onChange={e => setForm({ ...form, item: e.target.value })}
                      placeholder="Item name / description"
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Quantity<span className={styles.required}>*</span></label>
                    <input
                      className={styles.inputField}
                      type="number"
                      min="1"
                      value={form.qty}
                      onChange={e => setForm({ ...form, qty: e.target.value })}
                      placeholder="0"
                      required
                    />
                  </div>
                </div>

                <div className={styles.formGrid3}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Reason<span className={styles.required}>*</span></label>
                    <select
                      className={styles.select}
                      value={form.reason}
                      onChange={e => setForm({ ...form, reason: e.target.value })}
                      required
                    >
                      {REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Return Auth #</label>
                    <input
                      className={styles.inputField}
                      value={form.auth_number}
                      onChange={e => setForm({ ...form, auth_number: e.target.value })}
                      placeholder="Optional"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Method</label>
                    <select
                      className={styles.select}
                      value={form.method}
                      onChange={e => setForm({ ...form, method: e.target.value })}
                    >
                      {METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Notes</label>
                  <textarea
                    className={`${styles.inputField} ${styles.textarea}`}
                    value={form.notes}
                    onChange={e => setForm({ ...form, notes: e.target.value })}
                    placeholder="Additional context or instructions…"
                  />
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button type="button" className={styles.btnSecondary} onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className={styles.btnPrimary} disabled={submitting}>
                  <Send size={15} /> {submitting ? 'Processing…' : 'Process Return'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`${styles.toast} ${toast.type === 'error' ? styles.toastError : styles.toastSuccess}`}>
          {toast.type === 'error' ? <AlertCircle size={17} /> : <CheckCircle2 size={17} />}
          <span>{toast.msg}</span>
        </div>
      )}
    </div>
  );
};

export default PurchaseReturns;
