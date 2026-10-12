import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../services/apiClient';
import {
  Tractor, Clock, CheckSquare, PlaySquare, RefreshCw,
  ArrowLeft, Calendar, MapPin, DollarSign, Image as ImageIcon,
  Activity, Eye, Trash2, XCircle, Pencil
} from 'lucide-react';
import SegmentedSpinner from '../../components/ui/SegmentedSpinner';
import styles from './CustomerFarmingOrders.module.css';

const BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1').replace('/api/v1', '');

const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${BASE}${path.startsWith('/') ? path : '/' + path}`.replace(/\\/g, '/');
};

/* ── HSL badge colours (matches CSS :root tokens) ── */
const STATUS_CONFIG = {
  pending:   { label: 'Pending',   bg: 'hsl(28 40% 88%)',  color: 'hsl(28 50% 30%)' },
  approved:  { label: 'Approved',  bg: 'hsl(77 55% 88%)',  color: 'hsl(77 55% 28%)' },
  confirmed: { label: 'Paid · Ready', bg: 'hsl(142 55% 86%)', color: 'hsl(142 60% 24%)' },
  active:    { label: 'On Field · Released', bg: 'hsl(200 60% 88%)', color: 'hsl(200 60% 28%)' },
  completed: { label: 'Completed · Released', bg: 'hsl(142 70% 86%)', color: 'hsl(142 70% 22%)' },
  cancelled: { label: 'Cancelled', bg: 'hsl(0 72% 92%)',   color: 'hsl(0 72% 38%)' },
};

const PAY_STATUS_CONFIG = {
  Pending:   { label: 'Awaiting Payment', bg: 'hsl(28 40% 88%)',  color: 'hsl(28 50% 30%)' },
  Confirmed: { label: 'Payment Confirmed', bg: 'hsl(142 55% 86%)', color: 'hsl(142 60% 24%)' },
  Rejected:  { label: 'Payment Rejected',  bg: 'hsl(0 72% 92%)',   color: 'hsl(0 72% 38%)' },
};

const normalizePayStatus = (s) => {
  const k = String(s || '').toLowerCase();
  if (k === 'confirmed' || k === 'paid' || k === 'payment_verified') return 'Confirmed';
  if (k.includes('reject')) return 'Rejected';
  return 'Pending';
};

const isRejectedPay = (s) => String(s || '').toLowerCase().includes('reject');

const resolveAccountMethod = (acc) => {
  const name = `${acc.account_type || ''} ${acc.bank_provider || ''}`.toLowerCase();
  if (name.includes('cash')) return 'Cash';
  if (name.includes('wallet') || name.includes('mobile') || name.includes('telebirr')) return 'Telebirr';
  return `${acc.bank_provider || 'Bank'} Bank`;
};

const DAY_MS = 24 * 60 * 60 * 1000;

/* Live rental countdown — mirrors the car rental dashboard */
const rentalStats = (order) => {
  const start = new Date(order.start_date);
  const end = new Date(order.end_date);
  const totalDays = Math.max(1, parseInt(order.total_days || Math.ceil((end - start) / DAY_MS), 10));
  const begun = order.released_at;
  const now = Date.now();
  const elapsedDays = begun ? Math.max(0, Math.floor((now - new Date(begun).getTime()) / DAY_MS)) : 0;
  const diff = end.getTime() - now;
  const overdue = diff < 0;
  const remaining = diff < 0 ? Math.abs(Math.ceil(diff / DAY_MS)) : Math.ceil(diff / DAY_MS);
  const pct = totalDays > 0 ? Math.min(100, Math.max(0, Math.round((elapsedDays / totalDays) * 100))) : 0;
  return { start, end, totalDays, begun: begun ? new Date(begun) : null, elapsedDays, remaining, overdue, pct };
};

const fmtShort = (d) => {
  if (!d) return '—';
  const dt = new Date(d);
  return dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

const STATUS_TABS = [
  { key: 'all',       label: 'All Orders', Icon: Tractor },
  { key: 'pending',   label: 'Pending',    Icon: Clock },
  { key: 'active',    label: 'Active',     Icon: PlaySquare },
  { key: 'completed', label: 'Completed',  Icon: CheckSquare },
];

export default function CustomerFarmingOrders() {
  const [orders, setOrders]               = useState([]);
  const [loading, setLoading]             = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [activeTab, setActiveTab]         = useState('all');
  const [imgError, setImgError]           = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [refreshing, setRefreshing]       = useState(false);
  const [notification, setNotification]   = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null); // { id, label }
  const [confirmCancelOrder, setConfirmCancelOrder] = useState(null); // { id, label }
  const [resubmitOrder, setResubmitOrder] = useState(null);
  const [resubmitForm, setResubmitForm]   = useState({ paymentMethod: '', paymentReference: '', account: '' });
  const [resubmitFile, setResubmitFile]   = useState(null);
  const [resubmitSubmitting, setResubmitSubmitting] = useState(false);
  const [updateOrder, setUpdateOrder] = useState(null);
  const [updateForm, setUpdateForm]   = useState({ startDate: '', endDate: '', fieldLocation: '', fieldSizeHectares: '', farmingPurpose: '', specialInstructions: '', paymentMethod: '', paymentReference: '', account: '' });
  const [updateFile, setUpdateFile]   = useState(null);
  const [updateSubmitting, setUpdateSubmitting] = useState(false);
  const [financeAccounts, setFinanceAccounts] = useState([]);
  const navigate = useNavigate();

  const showNotification = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchOrders = useCallback(async () => {
    try {
      const res = await axios.get('/agrirent-orders/my-orders');
      const list = res.data || [];
      setOrders(list);
      setSelectedOrder(prev => (prev ? (list.find(x => x.id === prev.id) || prev) : prev));
    } catch (err) {
      console.error('Failed to load farming orders', err);
      showNotification('Failed to load orders.', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleHideOrder = (e, id, label) => {
    e.stopPropagation();
    setConfirmDelete({ id, label });
  };

  const confirmHideOrder = async () => {
    if (!confirmDelete) return;
    const { id } = confirmDelete;
    setConfirmDelete(null);
    try {
      await axios.delete(`/agrirent-orders/my-orders/${id}`);
      setOrders(prev => prev.filter(o => o.id !== id));
      showNotification('Order removed from your dashboard.', 'success');
    } catch (err) {
      showNotification(err.response?.data?.message || 'Failed to remove order.', 'error');
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const res = await axios.get('/agrirent-orders/my-orders');
      setOrders(res.data || []);
    } catch (err) {
      console.error('Failed to refresh', err);
      showNotification('Failed to refresh orders.', 'error');
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  /* Background refresh — keeps the list and open detail in step with the
     manager / finance side without the customer refreshing the page. */
  useEffect(() => {
    const timer = setInterval(async () => {
      try {
        const res = await axios.get('/agrirent-orders/my-orders');
        const list = res.data || [];
        setOrders(list);
        setSelectedOrder(prev => (prev ? (list.find(x => x.id === prev.id) || prev) : prev));
      } catch (e) { /* silent background refresh */ }
    }, 20000);
    return () => clearInterval(timer);
  }, []);

  const openResubmit = async (order) => {
    setResubmitOrder(order);
    setResubmitFile(null);
    setResubmitForm({
      paymentMethod: order.payment_method || '',
      paymentReference: order.payment_reference || '',
      account: '',
    });
    try {
      const res = await axios.get('/finance-bank');
      const list = Array.isArray(res) ? res : (res?.data || []);
      setFinanceAccounts(list.filter(a => String(a.status || '').toLowerCase() === 'active'));
    } catch (err) {
      setFinanceAccounts([]);
    }
  };

  const handleResubmitAccount = (e) => {
    const val = e.target.value;
    const acc = financeAccounts.find(a => String(a.id) === String(val));
    if (!acc) { setResubmitForm(f => ({ ...f, account: val })); return; }
    setResubmitForm(f => ({ ...f, account: val, paymentMethod: resolveAccountMethod(acc) }));
  };

  const submitResubmit = async () => {
    if (!resubmitOrder) return;
    const ref = (resubmitForm.paymentReference || '').trim();
    if (!ref && !resubmitFile) {
      showNotification('Provide a new payment reference or upload a new screenshot.', 'error');
      return;
    }
    setResubmitSubmitting(true);
    try {
      const acc = financeAccounts.find(a => String(a.id) === String(resubmitForm.account));
      const fd = new FormData();
      fd.append('paymentMethod', resubmitForm.paymentMethod || resubmitOrder.payment_method || 'Telebirr');
      fd.append('paymentReference', ref);
      if (acc) {
        fd.append('paymentAccountName', acc.account_name || '');
        fd.append('paymentAccountNumber', acc.account_number || '');
        fd.append('paymentProvider', acc.bank_provider || '');
        fd.append('paymentAccountType', acc.account_type || '');
      }
      if (resubmitFile) fd.append('paymentScreenshot', resubmitFile);
      await axios.patch(`/agrirent-orders/my-orders/${resubmitOrder.id}/resubmit`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      showNotification('Payment resubmitted. Finance will review it again.', 'success');
      setResubmitOrder(null);
      setSelectedOrder(null);
      await fetchOrders();
    } catch (err) {
      showNotification(err.response?.data?.message || 'Failed to resubmit payment.', 'error');
    } finally {
      setResubmitSubmitting(false);
    }
  };

  const openUpdate = async (order) => {
    setUpdateOrder(order);
    setUpdateFile(null);
    setUpdateForm({
      startDate: order.start_date ? String(order.start_date).slice(0, 10) : '',
      endDate: order.end_date ? String(order.end_date).slice(0, 10) : '',
      fieldLocation: order.field_location || '',
      fieldSizeHectares: order.field_size_hectares != null ? String(order.field_size_hectares) : '',
      farmingPurpose: order.farming_purpose || '',
      specialInstructions: order.special_instructions || '',
      paymentMethod: order.payment_method || '',
      paymentReference: order.payment_reference || '',
      account: '',
    });
    try {
      const res = await axios.get('/finance-bank');
      const list = Array.isArray(res) ? res : (res?.data || []);
      setFinanceAccounts(list.filter(a => String(a.status || '').toLowerCase() === 'active'));
    } catch (err) {
      setFinanceAccounts([]);
    }
  };

  const handleUpdateAccount = (e) => {
    const val = e.target.value;
    const acc = financeAccounts.find(a => String(a.id) === String(val));
    if (!acc) { setUpdateForm(f => ({ ...f, account: val })); return; }
    setUpdateForm(f => ({ ...f, account: val, paymentMethod: resolveAccountMethod(acc) }));
  };

  const submitUpdate = async () => {
    if (!updateOrder) return;
    if (!updateForm.startDate || !updateForm.endDate) {
      showNotification('Start and end dates are required.', 'error');
      return;
    }
    const ref = (updateForm.paymentReference || '').trim();
    if (!ref && !updateFile && !updateOrder.payment_screenshot) {
      showNotification('Provide a payment reference or upload a screenshot.', 'error');
      return;
    }
    setUpdateSubmitting(true);
    try {
      const acc = financeAccounts.find(a => String(a.id) === String(updateForm.account));
      const fd = new FormData();
      fd.append('startDate', updateForm.startDate);
      fd.append('endDate', updateForm.endDate);
      fd.append('fieldLocation', updateForm.fieldLocation || '');
      fd.append('fieldSizeHectares', updateForm.fieldSizeHectares || '');
      fd.append('farmingPurpose', updateForm.farmingPurpose || '');
      fd.append('specialInstructions', updateForm.specialInstructions || '');
      fd.append('paymentMethod', updateForm.paymentMethod || updateOrder.payment_method || 'Telebirr');
      fd.append('paymentReference', ref);
      if (acc) {
        fd.append('paymentAccountName', acc.account_name || '');
        fd.append('paymentAccountNumber', acc.account_number || '');
        fd.append('paymentProvider', acc.bank_provider || '');
        fd.append('paymentAccountType', acc.account_type || '');
      }
      if (updateFile) fd.append('paymentScreenshot', updateFile);
      await axios.patch(`/agrirent-orders/my-orders/${updateOrder.id}`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      showNotification('Order updated. Finance will review the changes.', 'success');
      setUpdateOrder(null);
      await fetchOrders();
    } catch (err) {
      showNotification(err.response?.data?.message || 'Failed to update order.', 'error');
    } finally {
      setUpdateSubmitting(false);
    }
  };

  const handleCancel = async (id) => {
    setConfirmCancelOrder(null);
    try {
      await axios.patch(`/agrirent-orders/my-orders/${id}/cancel`);
      showNotification('Order cancelled successfully.', 'success');
      fetchOrders();
      setSelectedOrder(null);
    } catch (err) {
      showNotification(err.response?.data?.message || 'Failed to cancel order.', 'error');
    }
  };

  const filtered = activeTab === 'all'
    ? orders
    : orders.filter(o => {
        if (activeTab === 'pending')   return ['pending', 'approved'].includes(o.status);
        if (activeTab === 'active')    return ['confirmed', 'active'].includes(o.status);
        if (activeTab === 'completed') return o.status === 'completed';
        return true;
      });

  /* ────────────────────────────────────────────────────────────
     DETAIL VIEW
  ──────────────────────────────────────────────────────────── */
  if (selectedOrder) {
    const o          = selectedOrder;
    const cfg        = STATUS_CONFIG[o.status] || STATUS_CONFIG.pending;
    const payKey     = normalizePayStatus(o.payment_status);
    const payCfg     = PAY_STATUS_CONFIG[payKey] || PAY_STATUS_CONFIG.Pending;
    const rejected   = payKey === 'Rejected';
    const unpaid     = payKey === 'Pending' && !o.payment_reference && !o.payment_screenshot && String(o.status || '').toLowerCase() !== 'cancelled';
    const r          = o.status === 'active' ? rentalStats(o) : null;
    const tractorImg = getImageUrl(o.tractor_image);
    const canUpdate  = ['pending', 'approved'].includes(String(o.status || '').toLowerCase()) && payKey !== 'Confirmed';

    return (
      <div className={styles.page}>

        {/* Toast */}
        {notification && (
          <div className={`${styles.toast} ${notification.type === 'error' ? styles.toastError : styles.toastSuccess}`}>
            {notification.msg}
          </div>
        )}

        <div className={styles.wrap}>
          {/* Back + order # header */}
          <button className={styles.backBtn} onClick={() => setSelectedOrder(null)}>
            <ArrowLeft size={16} /> Back to AgriRent Orders
          </button>

          <div className={styles.detailHeader}>
            <div className={styles.detailHeaderLeft}>
              <div>
                <h1 className={styles.detailOrderNum}>Order #{o.order_number}</h1>
                <div className={styles.detailOrderDate}>
                  Placed on {new Date(o.created_at).toLocaleString('en-GB', {
                    day: 'numeric', month: 'long', year: 'numeric',
                    hour: '2-digit', minute: '2-digit',
                  })}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <span className={styles.badge} style={{ backgroundColor: cfg.bg, color: cfg.color }}>
                {cfg.label}
              </span>
              <span className={styles.badge} style={{ backgroundColor: payCfg.bg, color: payCfg.color }}>
                {payCfg.label}
              </span>
              {canUpdate && (
                <button className={styles.btnSecondary} onClick={() => openUpdate(o)}>
                  <Pencil size={15} /> Update Order
                </button>
              )}
            </div>
          </div>

          {rejected && (
            <div style={{
              marginTop: '1rem', padding: '1rem 1.2rem', borderRadius: 12,
              background: 'hsl(0 72% 96%)', border: '1px solid hsl(0 72% 80%)',
              display: 'flex', flexDirection: 'column', gap: 10,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800, color: 'hsl(0 72% 38%)' }}>
                <XCircle size={18} /> Payment Rejected by Finance
              </div>
              <div style={{ fontSize: '0.9rem', color: 'hsl(0 60% 30%)' }}>
                Reason: <strong>{o.finance_notes || o.notes || 'No reason provided'}</strong>
              </div>
              <div style={{ fontSize: '0.82rem', color: 'hsl(0 40% 40%)' }}>
                Please correct the payment details below and resubmit — Finance will review it again.
              </div>
              <div>
                <button className={styles.btnPrimary} onClick={() => openResubmit(o)}>
                  Fix &amp; Resubmit Payment
                </button>
              </div>
            </div>
          )}

          {unpaid && (
            <div style={{
              marginTop: '1rem', padding: '1rem 1.2rem', borderRadius: 12,
              background: 'hsl(38 90% 96%)', border: '1px solid hsl(38 80% 70%)',
              display: 'flex', flexDirection: 'column', gap: 10,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800, color: 'hsl(30 70% 30%)' }}>
                <DollarSign size={18} /> Payment Required
              </div>
              <div style={{ fontSize: '0.9rem', color: 'hsl(30 50% 25%)' }}>
                Total due: <strong>{parseFloat(o.total_amount || 0).toFixed(2)} ETB</strong>. Pay this order, then add the transaction reference or a payment screenshot so Finance can verify it.
              </div>
              <div>
                <button className={styles.btnPrimary} onClick={() => openResubmit(o)}>
                  Pay &amp; Upload Proof
                </button>
              </div>
            </div>
          )}

          {/* Machine Information card */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}><Activity size={18} /> Machine Information</h2>
            <div className={styles.machineCard}>
              {/* Image — 16/9 locked */}
              <div
                className={styles.imageContainer}
                style={{ cursor: tractorImg && !imgError ? 'zoom-in' : 'default' }}
                onClick={() => tractorImg && !imgError && setSelectedImage(tractorImg)}
              >
                {tractorImg && !imgError ? (
                  <img
                    src={tractorImg}
                    alt={o.tractor_name}
                    onError={() => setImgError(true)}
                  />
                ) : (
                  <div className={styles.imagePlaceholder}>
                    <ImageIcon size={48} />
                    <span>No Image Available</span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className={styles.machineInfo}>
                <div className={styles.machineName}>{o.tractor_name || 'AgriRent Machine'}</div>
                <div className={styles.machineType}>{o.tractor_type_label || 'Tractor'}</div>
                <div className={styles.machineField}>
                  <span className={styles.machineFieldLabel}>Field Purpose: </span>
                  {o.farming_purpose || 'N/A'}
                </div>
                <div className={styles.machineField}>
                  <span className={styles.machineFieldLabel}>Field Location: </span>
                  {o.field_location || 'N/A'}
                </div>
                <div className={styles.machineField}>
                  <span className={styles.machineFieldLabel}>Field Size: </span>
                  {o.field_size_hectares ? `${o.field_size_hectares} ha` : 'N/A'}
                </div>
              </div>
            </div>
          </div>

          {/* Schedule + Payment cards */}
          <div className={styles.cardsGrid}>
            {/* Rental Schedule */}
            <div className={styles.card}>
              <h2 className={styles.cardTitle}><Calendar size={18} /> Rental Schedule</h2>
              <div className={styles.infoRowRows}>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Start Date</span>
                  <span className={styles.infoValue}>
                    {new Date(o.start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>End Date</span>
                  <span className={styles.infoValue}>
                    {new Date(o.end_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Duration</span>
                  <span className={styles.infoValue}>{o.total_days} Days</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Daily Rate</span>
                  <span className={styles.infoValue}>{parseFloat(o.daily_rate || 0).toFixed(2)} ETB/day</span>
                </div>
              </div>
            </div>

            {/* Payment Details */}
            <div className={styles.card}>
              <h2 className={styles.cardTitle}><DollarSign size={18} /> Payment Details</h2>
              <div className={styles.infoRowRows}>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Payment Method</span>
                  <span className={styles.infoValue}>{o.payment_method || 'N/A'}</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Transaction Ref</span>
                  <span className={styles.infoValue}>{o.payment_reference || 'N/A'}</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Payment Screenshot</span>
                  <span className={styles.infoValue}>
                    {o.payment_screenshot ? (
                      <img
                        src={getImageUrl(o.payment_screenshot)}
                        alt="Payment screenshot"
                        onClick={() => setSelectedImage(getImageUrl(o.payment_screenshot))}
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        style={{ maxWidth: 140, maxHeight: 100, objectFit: 'cover', borderRadius: 8, border: '1px solid #e2e8f0', cursor: 'zoom-in', display: 'block' }}
                      />
                    ) : 'N/A'}
                  </span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Status</span>
                  <span className={styles.infoValue}>{o.payment_status || 'Pending'}</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Total Amount</span>
                  <span className={styles.infoValueLarge}>
                    {parseFloat(o.total_amount || 0).toFixed(2)} ETB
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Rental Progress — started / released / countdown, same as car rental dashboard */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}><Activity size={18} /> Rental Progress</h2>
            {o.status === 'active' && r && (
              <div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Started</span>
                  <span className={styles.infoValue} style={{ color: 'hsl(200 60% 28%)', fontWeight: 800 }}>
                    {r.begun ? new Date(r.begun).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                  </span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Ends</span>
                  <span className={styles.infoValue}>{fmtShort(o.end_date)}</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Day</span>
                  <span className={styles.infoValue}>
                    Day {Math.min(r.elapsedDays + 1, r.totalDays)} of {r.totalDays}
                  </span>
                </div>
                <div style={{ marginTop: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 700, marginBottom: 6 }}>
                    <span style={{ color: r.overdue ? 'hsl(0 72% 38%)' : 'hsl(142 60% 24%)' }}>
                      {r.overdue
                        ? `${r.remaining} day${r.remaining !== 1 ? 's' : ''} overdue`
                        : `${r.remaining} day${r.remaining !== 1 ? 's' : ''} rented left`}
                    </span>
                    <span style={{ color: 'hsl(200 60% 28%)' }}>
                      {r.overdue ? 'Rental overdue — contact us' : r.elapsedDays === 0 ? 'Machine working today' : 'Machine on your field'}
                    </span>
                  </div>
                  <div style={{ height: 10, background: 'hsl(200 60% 88%)', borderRadius: 999, overflow: 'hidden' }}>
                    <div style={{ height: '100%', background: r.overdue ? 'hsl(0 72% 45%)' : 'hsl(200 60% 35%)', width: `${r.pct}%`, borderRadius: 999, transition: 'width 0.3s' }} />
                  </div>
                </div>
              </div>
            )}
            {o.status === 'completed' && (
              <div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Started</span>
                  <span className={styles.infoValue}>{o.released_at ? fmtShort(o.released_at) : fmtShort(o.start_date)}</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Released On</span>
                  <span className={styles.infoValue} style={{ fontWeight: 800 }}>
                    {o.completed_at ? fmtShort(o.completed_at) : '—'}
                  </span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Duration</span>
                  <span className={styles.infoValue}>{o.total_days} Days</span>
                </div>
              </div>
            )}
            {['pending', 'approved', 'confirmed'].includes(o.status) && (
              <div className={styles.infoRowRows}>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Started</span>
                  <span className={styles.infoValue}>Not started yet</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Planned</span>
                  <span className={styles.infoValue}>
                    {fmtShort(o.start_date)} → {fmtShort(o.end_date)} · {o.total_days} days
                  </span>
                </div>
                <p style={{ margin: '10px 0 0', fontSize: '0.8rem', color: 'hsl(28 50% 30%)', background: 'hsl(28 40% 92%)', padding: '0.6rem 0.8rem', borderRadius: 8 }}>
                  The machine is released to your field automatically once your payment is confirmed
                  {o.status === 'pending' ? ' and the order is approved' : ''}.
                </p>
              </div>
            )}
            {o.status === 'cancelled' && (
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'hsl(0 72% 38%)' }}>This order was cancelled and never released.</p>
            )}
          </div>
          {(o.special_instructions || ['pending', 'approved'].includes(o.status)) && (
            <div className={styles.bottomRow}>
              {o.special_instructions && (
                <div className={`${styles.card} ${styles.bottomRowCard}`}>
                  <h2 className={styles.cardTitle}>Special Instructions</h2>
                  <p className={styles.machineField}>{o.special_instructions}</p>
                </div>
              )}

              {canUpdate && (
                <div className={`${styles.card} ${styles.bottomRowCard}`}>
                  <h2 className={styles.cardTitle}>Manage Order</h2>
                  <p className={styles.dangerDesc}>
                    Change the hire dates, field details or payment information while your payment is still being reviewed.
                  </p>
                  <button className={styles.btnPrimary} onClick={() => openUpdate(o)}>
                    Update Order
                  </button>
                </div>
              )}

              {['pending', 'approved'].includes(o.status) && (
                <div className={`${styles.card} ${styles.bottomRowCard}`}>
                  <div className={styles.dangerTitle}>Danger Zone</div>
                  <p className={styles.dangerDesc}>
                    You can cancel this order before it is confirmed or active.
                  </p>
                  <button
                    className={styles.btnDanger}
                    onClick={() => setConfirmCancelOrder({ id: o.id, label: o.order_number })}
                  >
                    Cancel Order
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Fullscreen Image Modal */}
        {selectedImage && (
          <div className={styles.modal} onClick={() => setSelectedImage(null)}>
            <div className={styles.modalInner} onClick={e => e.stopPropagation()}>
              <button className={styles.modalClose} onClick={() => setSelectedImage(null)}>
                Close ✕
              </button>
              <img src={selectedImage} alt="Full View" className={styles.modalImg} />
            </div>
          </div>
        )}

        {/* Fix & Resubmit Payment Modal */}
        {resubmitOrder && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
            <div style={{ background: '#fff', borderRadius: 16, padding: '1.75rem', maxWidth: 460, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
              <h3 style={{ margin: '0 0 0.35rem', fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>{isRejectedPay(resubmitOrder.payment_status) ? 'Fix & Resubmit Payment' : 'Pay & Upload Proof'}</h3>
              <p style={{ margin: '0 0 1rem', fontSize: '0.82rem', color: '#64748b', lineHeight: 1.5 }}>
                Order <strong>{resubmitOrder.order_number}</strong> · {parseFloat(resubmitOrder.total_amount || 0).toFixed(2)} ETB.
                {isRejectedPay(resubmitOrder.payment_status)
                  ? ' Update the payment details and send it back to Finance.'
                  : ' Pay the amount, then add the reference or upload a screenshot for Finance to verify.'}
              </p>

              {(resubmitOrder.finance_notes || resubmitOrder.notes) && (
                <div style={{ marginBottom: 14, padding: '0.6rem 0.8rem', borderRadius: 8, background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#991B1B', fontSize: '0.8rem' }}>
                  Finance reason: <strong>{resubmitOrder.finance_notes || resubmitOrder.notes}</strong>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569' }}>
                  Destination Account
                  <select
                    value={resubmitForm.account}
                    onChange={handleResubmitAccount}
                    style={{ display: 'block', width: '100%', marginTop: 5, padding: '0.55rem 0.7rem', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: '0.85rem', background: '#fff' }}
                  >
                    <option value="">Keep current ({resubmitOrder.payment_method || 'as before'})</option>
                    {financeAccounts.map(a => (
                      <option key={a.id} value={a.id}>
                        {a.account_type}{a.bank_provider ? ` · ${a.bank_provider}` : ''}{a.account_number ? ` · ${a.account_number}` : ''}
                      </option>
                    ))}
                  </select>
                </label>

                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569' }}>
                  Payment Method
                  <input
                    type="text"
                    value={resubmitForm.paymentMethod}
                    onChange={e => setResubmitForm(f => ({ ...f, paymentMethod: e.target.value }))}
                    placeholder="e.g. Telebirr / CBE Bank"
                    style={{ display: 'block', width: '100%', marginTop: 5, padding: '0.55rem 0.7rem', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: '0.85rem' }}
                  />
                </label>

                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569' }}>
                  Transaction Reference
                  <input
                    type="text"
                    value={resubmitForm.paymentReference}
                    onChange={e => setResubmitForm(f => ({ ...f, paymentReference: e.target.value }))}
                    placeholder="Telebirr / bank transaction number"
                    style={{ display: 'block', width: '100%', marginTop: 5, padding: '0.55rem 0.7rem', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: '0.85rem' }}
                  />
                </label>

                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569' }}>
                  New Payment Screenshot {resubmitFile ? '(selected)' : '(optional)'}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => setResubmitFile(e.target.files?.[0] || null)}
                    style={{ display: 'block', width: '100%', marginTop: 5, fontSize: '0.8rem' }}
                  />
                </label>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.35rem' }}>
                <button
                  onClick={() => { setResubmitOrder(null); setResubmitFile(null); }}
                  disabled={resubmitSubmitting}
                  style={{ padding: '0.6rem 1.3rem', borderRadius: 10, border: '1.5px solid #e2e8f0', background: '#f8fafc', color: '#475569', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' }}
                >
                  Cancel
                </button>
                <button
                  onClick={submitResubmit}
                  disabled={resubmitSubmitting}
                  style={{ padding: '0.6rem 1.3rem', borderRadius: 10, border: 'none', background: '#0f766e', color: '#fff', fontWeight: 700, cursor: resubmitSubmitting ? 'wait' : 'pointer', fontSize: '0.85rem', opacity: resubmitSubmitting ? 0.7 : 1 }}
                >
                  {resubmitSubmitting ? 'Submitting…' : (isRejectedPay(resubmitOrder.payment_status) ? 'Resubmit to Finance' : 'Submit Payment')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Update Order Modal ── */}
        {updateOrder && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
            <div style={{ background: '#fff', borderRadius: 16, padding: '1.75rem', maxWidth: 540, width: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
              <h3 style={{ margin: '0 0 0.35rem', fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>Update Order</h3>
              <p style={{ margin: '0 0 1rem', fontSize: '0.82rem', color: '#64748b', lineHeight: 1.5 }}>
                Order <strong>{updateOrder.order_number}</strong>. You can update the booking and payment details until Finance confirms your payment.
              </p>

              {(updateOrder.finance_notes || updateOrder.notes) && (
                <div style={{ marginBottom: 14, padding: '0.6rem 0.8rem', borderRadius: 8, background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#991B1B', fontSize: '0.8rem' }}>
                  Finance reason: <strong>{updateOrder.finance_notes || updateOrder.notes}</strong>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', gap: 12 }}>
                  <label style={{ flex: 1, fontSize: '0.78rem', fontWeight: 700, color: '#475569' }}>
                    Start Date
                    <input
                      type="date"
                      value={updateForm.startDate}
                      onChange={e => setUpdateForm(f => ({ ...f, startDate: e.target.value }))}
                      style={{ display: 'block', width: '100%', marginTop: 5, padding: '0.55rem 0.7rem', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: '0.85rem' }}
                    />
                  </label>
                  <label style={{ flex: 1, fontSize: '0.78rem', fontWeight: 700, color: '#475569' }}>
                    End Date
                    <input
                      type="date"
                      value={updateForm.endDate}
                      onChange={e => setUpdateForm(f => ({ ...f, endDate: e.target.value }))}
                      style={{ display: 'block', width: '100%', marginTop: 5, padding: '0.55rem 0.7rem', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: '0.85rem' }}
                    />
                  </label>
                </div>

                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569' }}>
                  Field Location
                  <input
                    type="text"
                    value={updateForm.fieldLocation}
                    onChange={e => setUpdateForm(f => ({ ...f, fieldLocation: e.target.value }))}
                    placeholder="e.g. Bishoftu, Kebele 03"
                    style={{ display: 'block', width: '100%', marginTop: 5, padding: '0.55rem 0.7rem', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: '0.85rem' }}
                  />
                </label>

                <div style={{ display: 'flex', gap: 12 }}>
                  <label style={{ flex: 1, fontSize: '0.78rem', fontWeight: 700, color: '#475569' }}>
                    Field Size (hectares)
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={updateForm.fieldSizeHectares}
                      onChange={e => setUpdateForm(f => ({ ...f, fieldSizeHectares: e.target.value }))}
                      placeholder="e.g. 5"
                      style={{ display: 'block', width: '100%', marginTop: 5, padding: '0.55rem 0.7rem', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: '0.85rem' }}
                    />
                  </label>
                  <label style={{ flex: 1, fontSize: '0.78rem', fontWeight: 700, color: '#475569' }}>
                    Farming Purpose
                    <input
                      type="text"
                      value={updateForm.farmingPurpose}
                      onChange={e => setUpdateForm(f => ({ ...f, farmingPurpose: e.target.value }))}
                      placeholder="e.g. Ploughing"
                      style={{ display: 'block', width: '100%', marginTop: 5, padding: '0.55rem 0.7rem', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: '0.85rem' }}
                    />
                  </label>
                </div>

                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569' }}>
                  Special Instructions
                  <textarea
                    rows={2}
                    value={updateForm.specialInstructions}
                    onChange={e => setUpdateForm(f => ({ ...f, specialInstructions: e.target.value }))}
                    placeholder="Anything the operator should know"
                    style={{ display: 'block', width: '100%', marginTop: 5, padding: '0.55rem 0.7rem', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: '0.85rem', fontFamily: 'inherit', resize: 'vertical' }}
                  />
                </label>

                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569' }}>
                  Destination Account
                  <select
                    value={updateForm.account}
                    onChange={handleUpdateAccount}
                    style={{ display: 'block', width: '100%', marginTop: 5, padding: '0.55rem 0.7rem', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: '0.85rem', background: '#fff' }}
                  >
                    <option value="">Keep current ({updateOrder.payment_method || 'as before'})</option>
                    {financeAccounts.map(a => (
                      <option key={a.id} value={a.id}>
                        {a.account_type}{a.bank_provider ? ` · ${a.bank_provider}` : ''}{a.account_number ? ` · ${a.account_number}` : ''}
                      </option>
                    ))}
                  </select>
                </label>

                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569' }}>
                  Payment Method
                  <input
                    type="text"
                    value={updateForm.paymentMethod}
                    onChange={e => setUpdateForm(f => ({ ...f, paymentMethod: e.target.value }))}
                    placeholder="e.g. Telebirr / CBE Bank"
                    style={{ display: 'block', width: '100%', marginTop: 5, padding: '0.55rem 0.7rem', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: '0.85rem' }}
                  />
                </label>

                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569' }}>
                  Transaction Reference
                  <input
                    type="text"
                    value={updateForm.paymentReference}
                    onChange={e => setUpdateForm(f => ({ ...f, paymentReference: e.target.value }))}
                    placeholder="Telebirr / bank transaction number"
                    style={{ display: 'block', width: '100%', marginTop: 5, padding: '0.55rem 0.7rem', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: '0.85rem' }}
                  />
                </label>

                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569' }}>
                  New Payment Screenshot {updateFile ? '(selected)' : '(optional)'}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => setUpdateFile(e.target.files?.[0] || null)}
                    style={{ display: 'block', width: '100%', marginTop: 5, fontSize: '0.8rem' }}
                  />
                </label>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.35rem' }}>
                <button
                  onClick={() => { setUpdateOrder(null); setUpdateFile(null); }}
                  disabled={updateSubmitting}
                  style={{ padding: '0.6rem 1.3rem', borderRadius: 10, border: '1.5px solid #e2e8f0', background: '#f8fafc', color: '#475569', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' }}
                >
                  Cancel
                </button>
                <button
                  onClick={submitUpdate}
                  disabled={updateSubmitting}
                  style={{ padding: '0.6rem 1.3rem', borderRadius: 10, border: 'none', background: '#0f766e', color: '#fff', fontWeight: 700, cursor: updateSubmitting ? 'wait' : 'pointer', fontSize: '0.85rem', opacity: updateSubmitting ? 0.7 : 1 }}
                >
                  {updateSubmitting ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── In-app cancel confirmation dialog ── */}
        {confirmCancelOrder && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ background: '#fff', borderRadius: 16, padding: '2rem', maxWidth: 380, width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.25)', textAlign: 'center' }}>
              <div style={{ fontSize: 40, marginBottom: '0.75rem' }}>⚠️</div>
              <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>Cancel This Order?</h3>
              <p style={{ margin: '0 0 1.5rem', fontSize: '0.875rem', color: '#64748b', lineHeight: 1.6 }}>
                Order <strong>{confirmCancelOrder.label}</strong> will be cancelled.<br />
                This cannot be undone and the order will no longer be released.
              </p>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                <button
                  onClick={() => setConfirmCancelOrder(null)}
                  style={{ padding: '0.625rem 1.5rem', borderRadius: 10, border: '1.5px solid #e2e8f0', background: '#f8fafc', color: '#475569', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem' }}
                >
                  Keep Order
                </button>
                <button
                  onClick={() => handleCancel(confirmCancelOrder.id)}
                  style={{ padding: '0.625rem 1.5rem', borderRadius: 10, border: 'none', background: '#e53e3e', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: '0.875rem' }}
                >
                  Yes, Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ────────────────────────────────────────────────────────────
     LIST VIEW
  ──────────────────────────────────────────────────────────── */
  return (
    <>
    <div className={styles.page}>

      {/* Toast */}
      {notification && (
        <div className={`${styles.toast} ${notification.type === 'error' ? styles.toastError : styles.toastSuccess}`}>
          {notification.msg}
        </div>
      )}

      <div className={styles.wrap}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerMeta}>
            <h1 className={styles.pageTitle}>AgriRent Orders</h1>
            <p className={styles.pageSubtitle}>Manage your machine rentals &amp; field services</p>
          </div>
          <div className={styles.headerActions}>
            <button className={styles.btnPrimary} onClick={() => navigate('/services/farming')}>
              + New Rental
            </button>
            <button
              className={styles.btnSecondary}
              onClick={handleRefresh}
              disabled={refreshing}
              aria-label="Refresh orders"
            >
              {refreshing ? <SegmentedSpinner size={16} /> : <RefreshCw size={16} />}
              Refresh
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className={styles.tabs}>
          {STATUS_TABS.map((tab) => {
            const active  = activeTab === tab.key;
            const TabIcon = tab.Icon;
            return (
              <button
                key={tab.key}
                className={`${styles.tab}${active ? ` ${styles.tabActive}` : ''}`}
                onClick={() => setActiveTab(tab.key)}
              >
                <TabIcon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        {loading ? (
          <div className={styles.empty}>
            <div className={styles.emptyTitle}>Loading orders…</div>
          </div>
        ) : filtered.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}><Tractor size={48} /></div>
            <div className={styles.emptyTitle}>No Orders Found</div>
            <p className={styles.emptyDesc}>You don&apos;t have any farming orders in this category.</p>
            <button className={styles.btnPrimary} onClick={() => navigate('/services/farming')}>
              + New Rental
            </button>
          </div>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Tractor / Machine</th>
                  <th>Start Date</th>
                  <th>Duration</th>
                  <th className={styles.colRight}>Total Amount</th>
                  <th>Status</th>
                  <th className={styles.colRight}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((order) => {
                  const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
                  const payCfg = PAY_STATUS_CONFIG[normalizePayStatus(order.payment_status)] || PAY_STATUS_CONFIG.Pending;
                  const rs = order.status === 'active' ? rentalStats(order) : null;
                  return (
                    <tr
                      key={order.id}
                      className={styles.tableRow}
                      onClick={() => setSelectedOrder(order)}
                      tabIndex={0}
                      onKeyDown={e => e.key === 'Enter' && setSelectedOrder(order)}
                    >
                      <td>{order.order_number}</td>
                      <td style={{ fontWeight: 600 }}>{order.tractor_name || 'AgriRent Machine'}</td>
                      <td>
                        {new Date(order.start_date).toLocaleDateString('en-GB', {
                          day: '2-digit', month: 'short', year: 'numeric',
                        })}
                      </td>
                      <td>
                        <div>{order.total_days} Days</div>
                        <div style={{ fontSize: '0.72rem', fontWeight: 700, marginTop: 3 }}>
                          {order.status === 'active' && rs ? (
                            <span style={{ color: rs.overdue ? 'hsl(0 72% 42%)' : 'hsl(200 60% 30%)' }}>
                              Day {Math.min(rs.elapsedDays + 1, rs.totalDays)} of {rs.totalDays} · {rs.overdue ? `${rs.remaining}d overdue` : `${rs.remaining}d left`}
                            </span>
                          ) : order.status === 'completed' ? (
                            <span style={{ color: 'hsl(142 60% 24%)' }}>
                              Started {fmtShort(order.released_at || order.start_date)} · Released {fmtShort(order.completed_at)}
                            </span>
                          ) : (
                            <span style={{ color: 'hsl(28 50% 30%)' }}>Not started yet</span>
                          )}
                        </div>
                      </td>
                      <td className={styles.colAmount}>
                        {parseFloat(order.total_amount || 0).toFixed(2)} ETB
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start' }}>
                          <span
                            className={styles.badge}
                            style={{ backgroundColor: cfg.bg, color: cfg.color }}
                          >
                            {cfg.label}
                          </span>
                          <span
                            className={styles.badge}
                            style={{ backgroundColor: payCfg.bg, color: payCfg.color }}
                          >
                            {payCfg.label}
                          </span>
                          {isRejectedPay(order.payment_status) && (order.finance_notes || order.notes) && (
                            <span style={{ fontSize: '0.7rem', color: 'hsl(0 72% 38%)', maxWidth: 180 }}>
                              {order.finance_notes || order.notes}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className={styles.colRight}>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'flex-end' }}>
                          {['completed', 'cancelled'].includes(String(order.status || '').toLowerCase()) && (
                            <button 
                              onClick={(e) => handleHideOrder(e, order.id, order.tractor_name || `Order #${order.id}`)}
                              style={{ background: 'none', border: 'none', color: '#e53e3e', cursor: 'pointer', padding: '4px' }}
                              title="Delete from dashboard"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                          <button
                            className={`${styles.btnSecondary} ${styles.btnSm}`}
                            onClick={(e) => { e.stopPropagation(); setSelectedOrder(order); }}
                          >
                            <Eye size={14} /> View
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>

    {/* ── In-app confirmation dialog ── */}
    {confirmDelete && (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ background: '#fff', borderRadius: 16, padding: '2rem', maxWidth: 380, width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.25)', textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: '0.75rem' }}>🗑️</div>
          <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>Remove Order?</h3>
          <p style={{ margin: '0 0 1.5rem', fontSize: '0.875rem', color: '#64748b', lineHeight: 1.6 }}>
            <strong>{confirmDelete.label}</strong> will be removed from your dashboard.<br />
            This only hides it for you — the agri-rent team still has your booking.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
            <button
              onClick={() => setConfirmDelete(null)}
              style={{ padding: '0.625rem 1.5rem', borderRadius: 10, border: '1.5px solid #e2e8f0', background: '#f8fafc', color: '#475569', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem' }}
            >
              Cancel
            </button>
            <button
              onClick={confirmHideOrder}
              style={{ padding: '0.625rem 1.5rem', borderRadius: 10, border: 'none', background: '#e53e3e', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: '0.875rem' }}
            >
              Yes, Remove
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
