import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Car, Clock, CheckSquare, XSquare, PlaySquare, RefreshCw,
  ArrowLeft, Calendar, DollarSign, Image as ImageIcon,
  Upload, Plus, XCircle, User, Phone, Mail, CreditCard,
  FileText, MapPin, Wrench, AlertTriangle, Trash2, Edit3, X
} from 'lucide-react';
import carService from '../../services/carService';
import SegmentedSpinner from '../../components/ui/SegmentedSpinner';
import { useToast } from '../../components/Toast';
import apiClient from '../../services/apiClient';
import styles from './CustomerRentals.module.css';

/* ─── helpers ──────────────────────────────────────────────── */
const BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1').replace('/api/v1', '');

const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${BASE}${path.startsWith('/') ? path : '/' + path}`.replace(/\\/g, '/');
};

const fmtDate  = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
const fmtMoney = (n) => parseFloat(n || 0).toFixed(2);

/* ─── status config ─────────────────────────────────────────── */
const ORDER_STATUS = {
  PENDING_APPROVAL: { label: 'Pending Approval', badgeClass: 'statusPending' },
  APPROVED:         { label: 'Approved',         badgeClass: 'statusApproved' },
  CONFIRMED:        { label: 'Confirmed',        badgeClass: 'statusConfirmed' },
  ACTIVE:           { label: 'Active',           badgeClass: 'statusActive' },
  COMPLETED:        { label: 'Completed',        badgeClass: 'statusCompleted' },
  REJECTED:         { label: 'Rejected',         badgeClass: 'statusCancelled' },
  CANCELLED:        { label: 'Cancelled',        badgeClass: 'statusCancelled' },
  ABANDONED:        { label: 'Abandoned',        badgeClass: 'statusCancelled' },
};

const PAYMENT_STATUS = {
  UNPAID:  { label: 'Unpaid',  badgeClass: 'payUnpaid' },
  PAID:    { label: 'Paid',    badgeClass: 'payPaid' },
  PARTIAL: { label: 'Partial', badgeClass: 'payPartial' },
};

const STATUS_TABS = [
  { key: 'ALL',              label: 'All Rentals', Icon: Car },
  { key: 'PENDING_APPROVAL', label: 'Pending',     Icon: Clock },
  { key: 'APPROVED',         label: 'Approved',    Icon: CheckSquare },
  { key: 'ACTIVE',           label: 'Active',      Icon: PlaySquare },
  { key: 'COMPLETED',        label: 'Completed',   Icon: CheckSquare },
  { key: 'CANCELLED',        label: 'Cancelled',   Icon: XSquare },
];

const TERMINAL_STATUSES = ['COMPLETED', 'REJECTED', 'CANCELLED', 'ABANDONED',
  'completed', 'rejected', 'cancelled', 'abandoned'];

/* ─── helper: get badge class from styles ───────────────────── */
function BadgeFromConfig({ cfg }) {
  if (!cfg) return null;
  return (
    <span className={`${styles.badge} ${styles[cfg.badgeClass]}`}>
      <span className={styles.badgeDot} />
      {cfg.label}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════
   COMPONENT
═══════════════════════════════════════════════════════════ */
export default function CustomerRentals() {
  const navigate = useNavigate();
  const { showToast, ToastContainer } = useToast();

  const [orders, setOrders]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [selected, setSelected]     = useState(null);
  const [activeTab, setActiveTab]   = useState('ALL');
  const [refreshing, setRefreshing] = useState(false);
  const [imgError, setImgError]     = useState(false);
  const [lightbox, setLightbox]     = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting]           = useState(false);
  const [editModal, setEditModal]         = useState(null); // { order, form, saving, error }

  // action states
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading]       = useState(false);
  const [cancelOpen, setCancelOpen]     = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [extendOpen, setExtendOpen]     = useState(false);
  const [extendDays, setExtendDays]     = useState(1);
  const fileRef = useRef(null);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const res = await carService.getMyRentalOrders();
      const list = res.data ?? [];
      setOrders(Array.isArray(list) ? list : []);
      if (selected) {
        const updated = (Array.isArray(list) ? list : []).find(o => o.id === selected.id);
        if (updated) setSelected(updated);
      }
    } catch (err) {
      console.error('Failed to load rentals', err);
      showToast('Failed to load rentals.', 'error');
    } finally {
      setLoading(false);
    }
  }, [selected, showToast]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const handleHideOrder = (e, id, label) => {
    e.stopPropagation();
    setConfirmDelete({ id, label });
  };

  const confirmHideOrder = async () => {
    if (!confirmDelete) return;
    const { id } = confirmDelete;
    setDeleting(true);
    try {
      await carService.deleteMyRentalOrder(id);
      setOrders(prev => prev.filter(o => String(o.id) !== String(id)));
      if (String(selected?.id) === String(id)) setSelected(null);
      setConfirmDelete(null);
      showToast('Order removed from your dashboard.', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || err.message || 'Failed to remove order.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const res = await carService.getMyRentalOrders();
      const list = res.data ?? [];
      setOrders(Array.isArray(list) ? list : []);
      if (selected) {
        const updated = (Array.isArray(list) ? list : []).find(o => o.id === selected.id);
        if (updated) setSelected(updated);
      }
      showToast('Rentals refreshed.', 'success');
    } catch {
      showToast('Failed to refresh.', 'error');
    } finally {
      setRefreshing(false);
    }
  };

  const handleUploadProof = async () => {
    if (!selectedFile || !selected) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('proof', selectedFile);
      await carService.uploadPaymentProof(selected.id, fd);
      showToast('Payment proof uploaded!', 'success');
      setSelectedFile(null);
      if (fileRef.current) fileRef.current.value = '';
      fetchOrders();
    } catch {
      showToast('Failed to upload payment proof.', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleCancel = async () => {
    if (!cancelReason.trim()) { showToast('Cancellation reason is required.', 'error'); return; }
    try {
      await carService.cancelRentalOrder(selected.id, cancelReason);
      showToast('Rental cancelled successfully.', 'success');
      setCancelOpen(false);
      setCancelReason('');
      fetchOrders();
    } catch {
      showToast('Failed to cancel rental.', 'error');
    }
  };

  const handleExtend = async () => {
    try {
      await carService.extendRentalOrder(selected.id, extendDays);
      showToast('Extension requested successfully.', 'success');
      setExtendOpen(false);
      setExtendDays(1);
      fetchOrders();
    } catch {
      showToast('Failed to request extension.', 'error');
    }
  };

  /* ── helper: can the order be updated by customer? ── */
  // Before payment approved: Allowed!
  // After payment approved: update button must be lost/hidden!
  const isOrderUpdatable = (order) => {
    if (!order) return false;
    const pStat = (order.paymentStatus || order.payment_status || '').toUpperCase();
    const isPaymentApproved = ['PAID', 'CONFIRMED'].includes(pStat);
    if (isPaymentApproved) return false;

    const isTerminal = ['COMPLETED', 'CANCELLED', 'REJECTED', 'ABANDONED', 'completed', 'cancelled', 'rejected', 'abandoned'].includes(order.status);
    if (isTerminal) return false;

    const isActive = ['ACTIVE', 'active', 'ON_TRIP'].includes(order.status);
    if (isActive) return false;

    const isCancelRequested = !!(order.isCancellationRequested || order.is_cancellation_requested);
    if (isCancelRequested) return false;

    return ['PENDING_APPROVAL', 'APPROVED'].includes(order.status);
  };

  const openEditModal = (order) => {
    const toDateInput = (val) => {
      if (!val) return '';
      try {
        const d = new Date(val);
        return isNaN(d.getTime()) ? '' : d.toISOString().split('T')[0];
      } catch {
        return '';
      }
    };

    setEditModal({
      order,
      form: {
        pickupDate: toDateInput(order.pickupDate || order.pickup_date),
        returnDate: toDateInput(order.returnDate || order.return_date),
        driverName: order.driverName || order.driver_name || '',
        driverLicense: order.driverLicense || order.driver_license || '',
        customerPhone: order.customerPhone || order.customer_phone || '',
        pickupLocation: order.pickupLocation || order.pickup_location || '',
        specialRequests: order.specialRequests || order.special_requests || '',
        paymentMethod: order.paymentMethod || order.payment_method || 'Cash',
        paymentReference: order.paymentReference || order.payment_reference || '',
      },
      proofFile: null,
      saving: false,
      error: ''
    });
  };

  const handleSaveOrderUpdate = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!editModal) return;
    const { order, form, proofFile } = editModal;

    if (form.pickupDate && form.returnDate) {
      const p = new Date(form.pickupDate);
      const r = new Date(form.returnDate);
      if (r <= p) {
        setEditModal(prev => ({ ...prev, error: 'Return date must be at least 1 day after pickup date.' }));
        return;
      }
    }

    setEditModal(prev => ({ ...prev, saving: true, error: '' }));
    try {
      // 1. Update order details (dates, contact, location, paymentMethod, paymentReference)
      const res = await carService.updateMyRentalOrder(order.id, form);
      let updated = res.data || res;

      // 2. If user also attached/replaced payment proof, upload it together!
      if (proofFile) {
        try {
          const fd = new FormData();
          fd.append('proof', proofFile);
          const proofRes = await carService.uploadPaymentProof(order.id, fd);
          if (proofRes?.data) {
            updated = { ...updated, ...proofRes.data };
          } else {
            updated = {
              ...updated,
              paymentProofUrl: proofRes?.paymentProofUrl || updated.paymentProofUrl,
              paymentStatus: 'PENDING_VERIFICATION'
            };
          }
        } catch (proofErr) {
          console.warn('Failed to upload proof during update:', proofErr);
        }
      }

      // Asynchronously update order in local state without page refresh
      const targetId = String(updated.id || order.id);
      setOrders(prev => prev.map(o => String(o.id) === targetId ? {
        ...o,
        ...updated,
        carName: updated.carName || o.carName,
        carImage: updated.carImage || o.carImage,
        paymentMethod: form.paymentMethod || updated.paymentMethod || o.paymentMethod,
        paymentReference: form.paymentReference || updated.paymentReference || o.paymentReference
      } : o));
      if (selected && String(selected.id) === targetId) {
        setSelected(prev => ({
          ...prev,
          ...updated,
          carName: updated.carName || prev.carName,
          carImage: updated.carImage || prev.carImage,
          paymentMethod: form.paymentMethod || updated.paymentMethod || prev.paymentMethod,
          paymentReference: form.paymentReference || updated.paymentReference || prev.paymentReference
        }));
      }
      setEditModal(null);
      showToast('Rental order and payment details updated successfully!', 'success');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to update order.';
      setEditModal(prev => ({ ...prev, saving: false, error: msg }));
      showToast(msg, 'error');
    }
  };

  const getEditEstimates = () => {
    if (!editModal || !editModal.form.pickupDate || !editModal.form.returnDate) return null;
    const p = new Date(editModal.form.pickupDate);
    const r = new Date(editModal.form.returnDate);
    const days = Math.ceil((r - p) / (1000 * 60 * 60 * 24));
    if (days <= 0 || isNaN(days)) return { days: 0, valid: false };
    const rate = editModal.order.dailyRate || editModal.order.daily_rate || 0;
    const rentalAmount = rate * days;
    const deposit = editModal.order.securityDeposit !== undefined
      ? editModal.order.securityDeposit
      : (editModal.order.security_deposit !== undefined ? editModal.order.security_deposit : 5000);
    const vat = parseFloat((rentalAmount * 0.15).toFixed(2));
    const total = rentalAmount + vat + deposit;
    return { days, rentalAmount, total, deposit, vat, valid: true };
  };

  /* ── Dialog Renderers ── */
  const renderConfirmDelete = () => {
    if (!confirmDelete) return null;
    return (
      <div className={styles.confirmOverlay} onClick={() => !deleting && setConfirmDelete(null)}>
        <div className={styles.confirmBox} onClick={e => e.stopPropagation()}>
          <div className={styles.confirmIcon}>🗑️</div>
          <h3 className={styles.confirmTitle}>Remove Order?</h3>
          <p className={styles.confirmDesc}>
            <strong>{confirmDelete.label}</strong> will be removed from your dashboard.<br />
            This only hides it for you — the rental team still has your booking.
          </p>
          <div className={styles.confirmActions}>
            <button className={styles.btnSecondary} onClick={() => setConfirmDelete(null)} disabled={deleting}>Cancel</button>
            <button className={styles.btnDanger} onClick={confirmHideOrder} disabled={deleting}>
              {deleting ? 'Removing…' : 'Yes, Remove'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderEditModal = () => {
    if (!editModal) return null;
    const { order, form, saving, error } = editModal;
    const est = getEditEstimates();
    const carTitle = order.carName || (order.car ? `${order.car.brand || ''} ${order.car.model || ''}`.trim() : `Booking #${order.id}`);

    return (
      <div className={styles.confirmOverlay} onClick={() => !saving && setEditModal(null)}>
        <div className={styles.editModalBox} onClick={e => e.stopPropagation()}>
          <div className={styles.editModalHeader}>
            <div>
              <h3 className={styles.editModalTitle}>Update Order</h3>
              <p className={styles.editModalSub}>
                <strong>{order.orderNumber ? `#${order.orderNumber}` : `#${order.id}`}</strong> · {carTitle}
              </p>
            </div>
            <button
              className={styles.btnIcon}
              onClick={() => !saving && setEditModal(null)}
              disabled={saving}
              title="Close"
              type="button"
            >
              <X size={18} />
            </button>
          </div>

          {error && (
            <div style={{
              background: 'hsl(var(--status-cancelled-bg))',
              color: 'hsl(var(--danger))',
              border: '1px solid hsl(var(--danger) / 0.3)',
              borderRadius: 'var(--radius)',
              padding: '0.65rem 0.85rem',
              marginBottom: '1rem',
              fontSize: '0.85rem'
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSaveOrderUpdate}>
            <div className={styles.editGrid}>
              <div>
                <label className={styles.formLabel}>Pickup Date *</label>
                <input
                  type="date"
                  className={styles.input}
                  value={form.pickupDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={e => setEditModal(prev => ({
                    ...prev,
                    error: '',
                    form: { ...prev.form, pickupDate: e.target.value }
                  }))}
                  required
                  disabled={saving}
                />
              </div>

              <div>
                <label className={styles.formLabel}>Return Date *</label>
                <input
                  type="date"
                  className={styles.input}
                  value={form.returnDate}
                  min={form.pickupDate || new Date().toISOString().split('T')[0]}
                  onChange={e => setEditModal(prev => ({
                    ...prev,
                    error: '',
                    form: { ...prev.form, returnDate: e.target.value }
                  }))}
                  required
                  disabled={saving}
                />
              </div>

              <div>
                <label className={styles.formLabel}>Driver Name</label>
                <input
                  type="text"
                  className={styles.input}
                  placeholder="Driver full name"
                  value={form.driverName}
                  onChange={e => setEditModal(prev => ({
                    ...prev,
                    form: { ...prev.form, driverName: e.target.value }
                  }))}
                  disabled={saving}
                />
              </div>

              <div>
                <label className={styles.formLabel}>Driver License</label>
                <input
                  type="text"
                  className={styles.input}
                  placeholder="Driver license number"
                  value={form.driverLicense}
                  onChange={e => setEditModal(prev => ({
                    ...prev,
                    form: { ...prev.form, driverLicense: e.target.value }
                  }))}
                  disabled={saving}
                />
              </div>

              <div>
                <label className={styles.formLabel}>Contact Phone</label>
                <input
                  type="tel"
                  className={styles.input}
                  placeholder="+251 9..."
                  value={form.customerPhone}
                  onChange={e => setEditModal(prev => ({
                    ...prev,
                    form: { ...prev.form, customerPhone: e.target.value }
                  }))}
                  disabled={saving}
                />
              </div>

              <div>
                <label className={styles.formLabel}>Pickup Location</label>
                <input
                  type="text"
                  className={styles.input}
                  placeholder="City, office, or airport"
                  value={form.pickupLocation}
                  onChange={e => setEditModal(prev => ({
                    ...prev,
                    form: { ...prev.form, pickupLocation: e.target.value }
                  }))}
                  disabled={saving}
                />
              </div>
            </div>

            <div style={{ marginTop: '1rem' }}>
              <label className={styles.formLabel}>Special Requests / Notes</label>
              <textarea
                rows={2}
                className={styles.input}
                placeholder="Any special instructions or preferences…"
                value={form.specialRequests}
                onChange={e => setEditModal(prev => ({
                  ...prev,
                  form: { ...prev.form, specialRequests: e.target.value }
                }))}
                disabled={saving}
              />
            </div>

            {/* ── Payment Information Section ── */}
            <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid hsl(var(--border))' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', fontWeight: 600, fontSize: '0.9375rem' }}>
                <CreditCard size={16} style={{ color: 'hsl(var(--primary))' }} />
                <span>Payment Information</span>
              </div>

              <div className={styles.editGrid}>
                <div>
                  <label className={styles.formLabel}>Payment Method</label>
                  <select
                    className={styles.input}
                    value={form.paymentMethod || 'Cash'}
                    onChange={e => setEditModal(prev => ({
                      ...prev,
                      form: { ...prev.form, paymentMethod: e.target.value }
                    }))}
                    disabled={saving}
                  >
                    <option value="Cash">Cash on Pickup</option>
                    <option value="Bank Transfer">Bank Transfer (CBE / Awash / Dashen)</option>
                    <option value="Telebirr">Telebirr</option>
                    <option value="CBE Birr">CBE Birr</option>
                  </select>
                </div>

                <div>
                  <label className={styles.formLabel}>
                    Payment Reference / Txn #{form.paymentMethod !== 'Cash' ? ' (Receipt/ID)' : ' (N/A)'}
                  </label>
                  <input
                    type="text"
                    className={styles.input}
                    placeholder={form.paymentMethod === 'Cash' ? 'Pay upon arrival' : 'e.g. FT2619472910, ref #'}
                    value={form.paymentReference || ''}
                    onChange={e => setEditModal(prev => ({
                      ...prev,
                      form: { ...prev.form, paymentReference: e.target.value }
                    }))}
                    disabled={saving}
                  />
                </div>
              </div>

              {form.paymentMethod !== 'Cash' && (
                <div style={{ marginTop: '0.75rem' }}>
                  <label className={styles.formLabel}>
                    Upload / Replace Payment Proof (Receipt or Screenshot)
                  </label>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    className={styles.input}
                    onChange={e => {
                      const file = e.target.files && e.target.files[0] ? e.target.files[0] : null;
                      setEditModal(prev => ({ ...prev, proofFile: file }));
                    }}
                    disabled={saving}
                  />
                  {(order.paymentProofUrl || order.payment_proof_url) && !editModal.proofFile && (
                    <span style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))', marginTop: '0.25rem', display: 'block' }}>
                      Current proof file is already attached. Upload a new file only if you need to replace it.
                    </span>
                  )}
                  {editModal.proofFile && (
                    <span style={{ fontSize: '0.75rem', color: 'hsl(var(--success))', marginTop: '0.25rem', display: 'block', fontWeight: 600 }}>
                      ✓ Selected file: {editModal.proofFile.name} (will be uploaded together upon saving)
                    </span>
                  )}
                </div>
              )}
            </div>

            {est && est.valid && (
              <div className={styles.editEstimateBanner}>
                <div>
                  <span style={{ fontWeight: 600 }}>Estimated: {est.days} day(s)</span>
                  <span style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))', marginLeft: '0.5rem' }}>
                    ({fmtMoney(est.rentalAmount)} ETB + 15% VAT + Deposit)
                  </span>
                </div>
                <div style={{ fontWeight: 700, color: 'hsl(var(--primary))', fontSize: '1rem' }}>
                  {fmtMoney(est.total)} ETB
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
              <button
                type="button"
                className={styles.btnSecondary}
                onClick={() => setEditModal(null)}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={styles.btnPrimary}
                disabled={saving || (est && !est.valid)}
              >
                {saving ? 'Saving Changes…' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const openDetail = (order) => {
    setSelected(order);
    setImgError(false);
    setCancelOpen(false);
    setCancelReason('');
    setExtendOpen(false);
    setExtendDays(1);
    setSelectedFile(null);
  };

  const filtered = activeTab === 'ALL'
    ? orders
    : activeTab === 'CANCELLED'
      ? orders.filter(o => o.status === 'CANCELLED' || o.isCancellationRequested || o.is_cancellation_requested)
      : orders.filter(o => o.status === activeTab);

  /* ═══════════════════════════════════════════════════════════
     DETAIL VIEW — single panel, all sections + dividers
  ═══════════════════════════════════════════════════════════ */
  if (selected) {
    const o       = selected;
    const ost     = ORDER_STATUS[o.status] || ORDER_STATUS.PENDING_APPROVAL;
    const pst     = o.paymentStatus ? PAYMENT_STATUS[o.paymentStatus] : null;
    const imgUrl  = getImageUrl(o.carImage);
    const proofUrl = getImageUrl(o.paymentProofUrl);
    const isCancelPending = !!(o.isCancellationRequested || o.is_cancellation_requested);
    const canCancel = ['PENDING_APPROVAL', 'APPROVED'].includes(o.status) && !isCancelPending;
    const canDel    = TERMINAL_STATUSES.includes(o.status);
    const canUpload = o.status === 'APPROVED' && o.paymentStatus !== 'PAID';
    const canUpdate = isOrderUpdatable(o);
    const canExtend = o.status === 'ACTIVE';
    const hasFees   = o.extensionFee > 0 || o.damageFee > 0 || o.fuelFee > 0 || o.lateFee > 0;

    return (
      <div className={styles.page}>
        <ToastContainer />
        <div className={styles.wrap}>

          {/* Back button + actions at top */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <button className={styles.backBtn} onClick={() => setSelected(null)}>
              <ArrowLeft size={16} /> Back to Rentals
            </button>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              {canUpdate && (
                <button
                  className={styles.btnSecondary}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'hsl(var(--primary))', borderColor: 'hsl(var(--primary) / 0.4)' }}
                  onClick={() => openEditModal(o)}
                  title="Modify rental dates, driver details or requests"
                >
                  <Edit3 size={15} /> Update Order
                </button>
              )}
              {canCancel && !cancelOpen && (
                <button className={styles.btnDanger} onClick={() => setCancelOpen(true)}>
                  <XSquare size={16} /> Cancel Rental
                </button>
              )}
              {canDel && (
                <button
                  className={styles.btnDanger}
                  style={{ background: 'hsl(var(--status-cancelled-bg))', color: 'hsl(var(--danger))', border: '1px solid hsl(var(--danger) / 0.35)' }}
                  onClick={(e) => handleHideOrder(e, o.id, o.carName || `Booking #${o.id}`)}
                >
                  <Trash2 size={16} /> Remove from Dashboard
                </button>
              )}
            </div>
          </div>

          {/* ── Single-page detail panel ── */}
          <div className={styles.detailPanel}>

            {/* Cancellation Status Banner */}
            {o.status === 'CANCELLED' && (
              <div style={{ margin: '1.25rem 1.5rem 0', padding: '1rem 1.25rem', borderRadius: 'var(--radius)', background: 'hsl(0 86% 97%)', border: '1px solid hsl(0 72% 85%)', display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                <XCircle size={22} style={{ color: 'hsl(var(--danger))', flexShrink: 0 }} />
                <div>
                  <div style={{ fontWeight: 700, color: 'hsl(var(--danger))', fontSize: '0.9375rem' }}>Booking Cancelled</div>
                  <div style={{ fontSize: '0.85rem', color: 'hsl(var(--foreground))', marginTop: '0.2rem' }}>
                    This rental order has been cancelled.{o.cancellationReason ? ` Reason: "${o.cancellationReason}"` : ''}
                  </div>
                </div>
              </div>
            )}
            {o.status !== 'CANCELLED' && isCancelPending && (
              <div style={{ margin: '1.25rem 1.5rem 0', padding: '1rem 1.25rem', borderRadius: 'var(--radius)', background: 'hsl(38 92% 95%)', border: '1px solid hsl(38 92% 75%)', display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                <AlertTriangle size={22} style={{ color: 'hsl(38 92% 40%)', flexShrink: 0 }} />
                <div>
                  <div style={{ fontWeight: 700, color: 'hsl(38 92% 35%)', fontSize: '0.9375rem' }}>Cancellation Requested</div>
                  <div style={{ fontSize: '0.85rem', color: 'hsl(var(--foreground))', marginTop: '0.2rem' }}>
                    Your cancellation request has been submitted and is pending review by the Rental Manager.{o.cancellationReason ? ` Reason: "${o.cancellationReason}"` : ''}
                  </div>
                </div>
              </div>
            )}

            {/* Hero strip */}
            <div className={styles.detailHero}>
              <div>
                <div className={styles.detailHeroLabel}>Car Rental Booking</div>
                <h1 className={styles.detailHeroTitle}>#{o.orderNumber || o.id}</h1>
                <div className={styles.detailHeroDate}>
                  <Calendar size={14} /> Booked {fmtDate(o.createdAt)}
                </div>
              </div>
              <div className={styles.detailHeroAmount}>
                <div className={styles.detailHeroAmountLabel}>Total Amount</div>
                <div className={styles.detailHeroAmountValue}>{fmtMoney(o.totalAmount)} ETB</div>
              </div>
            </div>

            {/* Status bar */}
            <div className={styles.detailStatusBar}>
              <span className={styles.statusBarLabel}>Order:</span>
              <BadgeFromConfig cfg={ost} />
              {pst && (
                <>
                  <div className={styles.statusBarDivider} />
                  <span className={styles.statusBarLabel}>Payment:</span>
                  <BadgeFromConfig cfg={pst} />
                </>
              )}
              {o.isCancellationRequested && (
                <>
                  <div className={styles.statusBarDivider} />
                  <span className={`${styles.badge} ${styles.statusCancelled}`}>
                    <AlertTriangle size={12} /> Cancellation Requested
                  </span>
                </>
              )}
              {o.pendingExtensionDays && (
                <>
                  <div className={styles.statusBarDivider} />
                  <span className={`${styles.badge} ${styles.statusActive}`}>
                    Extension Pending ({o.pendingExtensionDays}d)
                  </span>
                </>
              )}
            </div>

            {/* ── Body ── */}
            <div className={styles.detailBody}>

              {/* SECTION 1 — Vehicle & Rental Dates */}
              <h2 className={styles.sectionTitle}><Car size={18} /> Vehicle &amp; Rental Dates</h2>
              <div className={styles.twoCol}>
                {/* Car image + name */}
                <div>
                  <div className={styles.carImageWrap} onClick={() => imgUrl && !imgError && setLightbox(imgUrl)}>
                    {imgUrl && !imgError ? (
                      <img src={imgUrl} alt={o.carName} onError={() => setImgError(true)} />
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', color: 'hsl(var(--muted-foreground))' }}>
                        <ImageIcon size={40} />
                        <span style={{ fontSize: '0.875rem' }}>No Image</span>
                      </div>
                    )}
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '1.125rem', marginBottom: '0.25rem' }}>{o.carName || '—'}</div>
                  <div style={{ fontSize: '0.9375rem', color: 'hsl(var(--muted-foreground))' }}>
                    Daily Rate: <strong style={{ color: 'hsl(var(--primary))' }}>{fmtMoney(o.dailyRate)} ETB/day</strong>
                  </div>
                </div>

                {/* Date rows */}
                <div>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}><Calendar size={14} /> Pickup Date</span>
                    <span className={styles.infoValue}>{fmtDate(o.pickupDate)}</span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}><Calendar size={14} /> Return Date</span>
                    <span className={styles.infoValue}>{fmtDate(o.returnDate)}</span>
                  </div>
                  {o.extendedReturnDate && (
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}><Calendar size={14} /> Extended Return</span>
                      <span className={styles.infoValue} style={{ color: 'hsl(var(--warning))' }}>{fmtDate(o.extendedReturnDate)}</span>
                    </div>
                  )}
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}><Clock size={14} /> Duration</span>
                    <span className={styles.infoValue}>{o.totalDays} {o.totalDays === 1 ? 'day' : 'days'}</span>
                  </div>
                  {o.actualReturnTime && (
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Actual Return</span>
                      <span className={styles.infoValue}>{fmtDate(o.actualReturnTime)}</span>
                    </div>
                  )}
                  {o.specialRequests && (
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}><FileText size={14} /> Special Requests</span>
                      <span className={styles.infoValue}>{o.specialRequests}</span>
                    </div>
                  )}
                </div>
              </div>

              <hr className={styles.divider} />

              {/* SECTION 2 — Customer & Driver */}
              <div className={styles.twoCol}>
                <div>
                  <h2 className={styles.sectionTitle}><User size={18} /> Customer Info</h2>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}><User size={14} /> Name</span>
                    <span className={styles.infoValue}>{o.customerName || '—'}</span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}><Mail size={14} /> Email</span>
                    <span className={styles.infoValue} style={{ wordBreak: 'break-all' }}>{o.customerEmail || '—'}</span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}><Phone size={14} /> Phone</span>
                    <span className={styles.infoValue}>{o.customerPhone || '—'}</span>
                  </div>
                </div>

                <div>
                  <h2 className={styles.sectionTitle}><Wrench size={18} /> Driver Info</h2>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Driver Name</span>
                    <span className={styles.infoValue}>{o.driverName || '—'}</span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>License #</span>
                    <span className={styles.infoValue}>{o.driverLicense || '—'}</span>
                  </div>
                </div>
              </div>

              <hr className={styles.divider} />

              {/* SECTION 3 — Payment Summary */}
              <h2 className={styles.sectionTitle}><CreditCard size={18} /> Payment Summary</h2>
              <div style={{ maxWidth: '28rem' }}>
                <div className={styles.totalLine}>
                  <span>Rental Amount</span>
                  <span>{fmtMoney(o.rentalAmount)} ETB</span>
                </div>
                <div className={styles.totalLine}>
                  <span>Security Deposit</span>
                  <span>{fmtMoney(o.securityDeposit)} ETB</span>
                </div>
                {hasFees && (
                  <>
                    {o.extensionFee > 0 && (
                      <div className={styles.totalLine}>
                        <span>Extension Fee</span>
                        <span style={{ color: 'hsl(var(--warning))' }}>{fmtMoney(o.extensionFee)} ETB</span>
                      </div>
                    )}
                    {o.damageFee > 0 && (
                      <div className={styles.totalLine}>
                        <span>Damage Fee</span>
                        <span style={{ color: 'hsl(var(--danger))' }}>{fmtMoney(o.damageFee)} ETB</span>
                      </div>
                    )}
                    {o.fuelFee > 0 && (
                      <div className={styles.totalLine}>
                        <span>Fuel Fee</span>
                        <span style={{ color: 'hsl(var(--danger))' }}>{fmtMoney(o.fuelFee)} ETB</span>
                      </div>
                    )}
                    {o.lateFee > 0 && (
                      <div className={styles.totalLine}>
                        <span>Late Return Fee</span>
                        <span style={{ color: 'hsl(var(--danger))' }}>{fmtMoney(o.lateFee)} ETB</span>
                      </div>
                    )}
                  </>
                )}
                {o.refundAmount > 0 && (
                  <div className={styles.totalLine}>
                    <span>Refund</span>
                    <span style={{ color: 'hsl(var(--success))' }}>-{fmtMoney(o.refundAmount)} ETB</span>
                  </div>
                )}
                <div className={styles.totalLineGrand}>
                  <span>Total Due</span>
                  <span>{fmtMoney(o.totalAmount)} ETB</span>
                </div>
              </div>

              {/* Payment method / reference / proof inline */}
              {(o.paymentMethod || o.paymentReference || proofUrl) && (
                <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', marginTop: '1.5rem' }}>
                  {o.paymentMethod && (
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))', marginBottom: '0.25rem' }}>Payment Method</div>
                      <div style={{ fontWeight: 600, textTransform: 'capitalize' }}>{o.paymentMethod}</div>
                    </div>
                  )}
                  {o.paymentReference && (
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))', marginBottom: '0.25rem' }}>Reference</div>
                      <div style={{ fontWeight: 600 }}>{o.paymentReference}</div>
                    </div>
                  )}
                  {o.verifiedAmount && (
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))', marginBottom: '0.25rem' }}>Verified Amount</div>
                      <div style={{ fontWeight: 600, color: 'hsl(var(--success))' }}>{fmtMoney(o.verifiedAmount)} ETB</div>
                    </div>
                  )}
                  {proofUrl && (
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))', marginBottom: '0.5rem' }}>Payment Proof</div>
                      <img src={proofUrl} alt="Proof" className={styles.proofThumb} onClick={() => setLightbox(proofUrl)} />
                    </div>
                  )}
                </div>
              )}

              {/* SECTION 4 — Notes & Remarks (conditional) */}
              {(o.managerNote || o.pickupRemarks || o.financeNotes || o.cancellationReason) && (
                <>
                  <hr className={styles.divider} />
                  <h2 className={styles.sectionTitle}><FileText size={18} /> Notes &amp; Remarks</h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {o.managerNote && (
                      <div>
                        <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'hsl(var(--muted-foreground))', marginBottom: '0.25rem' }}>Manager Note</div>
                        <div style={{ lineHeight: 1.625 }}>{o.managerNote}</div>
                      </div>
                    )}
                    {o.pickupRemarks && (
                      <div>
                        <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'hsl(var(--muted-foreground))', marginBottom: '0.25rem' }}>Pickup Remarks</div>
                        <div style={{ lineHeight: 1.625 }}>{o.pickupRemarks}</div>
                      </div>
                    )}
                    {o.financeNotes && (
                      <div>
                        <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'hsl(var(--muted-foreground))', marginBottom: '0.25rem' }}>Finance Notes</div>
                        <div style={{ lineHeight: 1.625 }}>{o.financeNotes}</div>
                      </div>
                    )}
                    {o.cancellationReason && (
                      <div style={{ padding: '0.875rem 1rem', borderRadius: 'var(--radius)', background: 'hsl(0 86% 97%)', border: '1px solid hsl(0 72% 85%)' }}>
                        <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'hsl(var(--danger))', marginBottom: '0.25rem' }}>Cancellation Reason</div>
                        <div style={{ lineHeight: 1.625 }}>{o.cancellationReason}</div>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* SECTION 5 — Actions (upload proof / update / extend / cancel) */}
              {(canUpload || canUpdate || canExtend || (canCancel && cancelOpen)) && (
                <>
                  <hr className={styles.divider} />
                  <h2 className={styles.sectionTitle}><CheckSquare size={18} /> Actions</h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                    {canUpdate && (
                      <div className={styles.actionBox}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                          <div>
                            <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                              <Edit3 size={16} /> Update Rental Reservation
                            </h3>
                            <p style={{ fontSize: '0.8125rem', color: 'hsl(var(--muted-foreground))', marginTop: '0.25rem', marginBottom: 0 }}>
                              Need to adjust pickup dates, driver info, phone number or special requests? You can update this booking before payment is approved.
                            </p>
                          </div>
                          <button className={styles.btnPrimary} onClick={() => openEditModal(o)}>
                            <Edit3 size={14} /> Update Order
                          </button>
                        </div>
                      </div>
                    )}

                    {canUpload && (
                      <div className={styles.actionBox}>
                        <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Upload size={16} /> Upload Payment Proof
                        </h3>
                        <input
                          type="file"
                          ref={fileRef}
                          accept="image/*,.pdf"
                          onChange={e => setSelectedFile(e.target.files[0])}
                          className={styles.input}
                        />
                        <div>
                          <button className={styles.btnPrimary} onClick={handleUploadProof} disabled={!selectedFile || uploading}>
                            <Upload size={15} /> {uploading ? 'Uploading…' : 'Submit Proof'}
                          </button>
                        </div>
                      </div>
                    )}

                    {canExtend && (
                      <div className={styles.actionBox}>
                        <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Plus size={16} /> Extend Rental
                        </h3>
                        {!extendOpen ? (
                          <div>
                            <button className={styles.btnSecondary} onClick={() => setExtendOpen(true)}>
                              <Plus size={15} /> Request Extension
                            </button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '17.5rem' }}>
                            <label className={styles.formLabel}>Additional days:</label>
                            <input type="number" min="1" value={extendDays} onChange={e => setExtendDays(e.target.value)} className={styles.input} />
                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                              <button className={styles.btnPrimary} onClick={handleExtend}>Submit</button>
                              <button className={styles.btnSecondary} onClick={() => setExtendOpen(false)}>Cancel</button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {canCancel && cancelOpen && (
                      <div className={`${styles.actionBox} ${styles.actionBoxDanger}`}>
                        <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'hsl(var(--danger))', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <XSquare size={16} /> Cancel Rental
                        </h3>
                        <p style={{ fontSize: '0.875rem', color: 'hsl(var(--muted-foreground))' }}>
                          Are you sure you want to cancel? This cannot be undone.
                        </p>
                        <div>
                          <label className={styles.formLabel}>
                            Reason for cancellation <span style={{ color: 'hsl(var(--danger))' }}>*</span>
                          </label>
                          <textarea
                            rows={3}
                            value={cancelReason}
                            onChange={e => setCancelReason(e.target.value)}
                            className={styles.input}
                            placeholder="Please describe why you are cancelling…"
                          />
                        </div>
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                          <button className={styles.btnDanger} onClick={handleCancel}>Confirm Cancellation</button>
                          <button className={styles.btnSecondary} onClick={() => setCancelOpen(false)}>Back</button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>{/* /detailBody */}
          </div>{/* /detailPanel */}
        </div>

        {/* Lightbox */}
        {lightbox && (
          <div className={styles.modal} onClick={() => setLightbox(null)}>
            <button className={styles.modalClose} onClick={() => setLightbox(null)}><XCircle size={32} /></button>
            <img src={lightbox} alt="Full view" className={styles.modalImg} onClick={e => e.stopPropagation()} />
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        {renderConfirmDelete()}

        {/* Edit Modal Dialog */}
        {renderEditModal()}
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════════
     LIST VIEW
  ═══════════════════════════════════════════════════════════ */
  return (
    <>
      <div className={styles.page}>
        <ToastContainer />
        <div className={styles.wrap}>

          {/* Header */}
          <div className={styles.header}>
            <div>
              <h1 className={styles.title}>Vehicle Rentals</h1>
              <p className={styles.subtitle}>Track and manage your car rental bookings</p>
            </div>
            <div className={styles.headerActions}>
              <button className={styles.btnSecondary} onClick={handleRefresh} disabled={refreshing}>
                <RefreshCw size={16} className={refreshing ? styles.spin : ''} />
                {refreshing ? 'Refreshing…' : 'Refresh'}
              </button>
              <button className={styles.btnPrimary} onClick={() => navigate('/fleet-gallery')}>
                <Plus size={16} /> New Rental
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className={styles.tabs}>
            {STATUS_TABS.map(({ key, label, Icon }) => (
              <button
                key={key}
                className={`${styles.tab}${activeTab === key ? ` ${styles.tabActive}` : ''}`}
                onClick={() => setActiveTab(key)}
              >
                <Icon size={16} /> {label}
              </button>
            ))}
          </div>

          {/* Content */}
          {loading ? (
            <div className={styles.emptyState}>
              <SegmentedSpinner size={32} />
              <p style={{ marginTop: '1rem', color: 'hsl(var(--muted-foreground))' }}>Loading rentals…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className={styles.emptyState}>
              <Car size={48} className={styles.emptyIcon} />
              <h2 className={styles.emptyTitle}>No Rentals Found</h2>
              <p className={styles.emptyDesc}>You don&apos;t have any rentals in this category.</p>
              <button className={styles.btnPrimary} onClick={() => navigate('/fleet-gallery')}>Rent a Vehicle</button>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className={styles.tableContainer}>
                <div className={styles.tableHeader}>
                  <div>Order</div>
                  <div>Vehicle</div>
                  <div>Dates</div>
                  <div>Amount</div>
                  <div>Status</div>
                  <div style={{ textAlign: 'right' }}>Del</div>
                </div>
                {filtered.map(order => {
                  const ost = ORDER_STATUS[order.status] || ORDER_STATUS.PENDING_APPROVAL;
                  const pst = order.paymentStatus ? PAYMENT_STATUS[order.paymentStatus] : null;
                  const canDel = TERMINAL_STATUSES.includes(order.status);

                  return (
                    <div key={order.id} className={styles.tableRow} onClick={() => openDetail(order)}>
                      <div className={styles.tableCol}>
                        <span className={styles.textPrimary}>#{order.orderNumber || order.id}</span>
                        <span className={styles.textSecondary}>{fmtDate(order.createdAt)}</span>
                      </div>

                      <div className={styles.tableCol}>
                        <span className={styles.textPrimary} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {order.carName || 'Vehicle'}
                        </span>
                        <span className={styles.textSecondary}>{fmtMoney(order.dailyRate)} ETB/day</span>
                      </div>

                      <div className={styles.tableCol}>
                        <span className={styles.textPrimary}>{fmtDate(order.pickupDate)}</span>
                        <span className={styles.textSecondary}>→ {fmtDate(order.returnDate)} ({order.totalDays}d)</span>
                      </div>

                      <div className={styles.tableCol}>
                        <span className={styles.textPrice}>{fmtMoney(order.totalAmount)} ETB</span>
                      </div>

                      <div className={styles.tableCol} style={{ gap: '0.375rem', alignItems: 'flex-start' }}>
                        <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
                          <BadgeFromConfig cfg={ost} />
                          {pst && <BadgeFromConfig cfg={pst} />}
                        </div>
                        {(order.isCancellationRequested || order.is_cancellation_requested) && (
                          <span className={`${styles.badge} ${styles.statusCancelled}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                            <AlertTriangle size={11} /> Cancel Requested
                          </span>
                        )}
                        {(order.isCancellationRequested || order.is_cancellation_requested || order.status === 'CANCELLED') && (order.cancellationReason || order.cancellation_reason) && (
                          <span style={{ fontSize: '0.75rem', color: 'hsl(var(--danger))', fontStyle: 'italic', maxWidth: '170px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={order.cancellationReason || order.cancellation_reason}>
                            &ldquo;{order.cancellationReason || order.cancellation_reason}&rdquo;
                          </span>
                        )}
                      </div>

                      <div className={styles.tableCol} style={{ alignItems: 'flex-end', flexDirection: 'row', justifyContent: 'flex-end', gap: '0.375rem' }}>
                        {isOrderUpdatable(order) && (
                          <button
                            onClick={(e) => { e.stopPropagation(); openEditModal(order); }}
                            className={styles.btnIcon}
                            title="Update booking details"
                          >
                            <Edit3 size={15} />
                          </button>
                        )}
                        {canDel && (
                          <button
                            onClick={(e) => handleHideOrder(e, order.id, order.carName || `Booking #${order.id}`)}
                            className={`${styles.btnIcon} ${styles.btnIconDanger}`}
                            title={order.status === 'CANCELLED' ? "Remove cancelled order from dashboard" : "Remove from dashboard"}
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Mobile Card View */}
              <div className={styles.cardList}>
                {filtered.map(order => {
                  const ost = ORDER_STATUS[order.status] || ORDER_STATUS.PENDING_APPROVAL;
                  const pst = order.paymentStatus ? PAYMENT_STATUS[order.paymentStatus] : null;
                  const canDel = TERMINAL_STATUSES.includes(order.status);

                  return (
                    <div
                      key={order.id}
                      className={styles.card}
                      onClick={() => openDetail(order)}
                      tabIndex={0}
                      onKeyDown={e => e.key === 'Enter' && openDetail(order)}
                    >
                      <div className={styles.cardHeader}>
                        <div>
                          <div className={styles.cardTitle}>{order.carName || 'Vehicle'}</div>
                          <div className={styles.cardSub}>#{order.orderNumber || order.id}</div>
                        </div>
                        <div className={styles.cardBadges} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                          <div style={{ display: 'flex', gap: 4 }}>
                            <BadgeFromConfig cfg={ost} />
                            {pst && <BadgeFromConfig cfg={pst} />}
                          </div>
                          {(order.isCancellationRequested || order.is_cancellation_requested) && (
                            <span className={`${styles.badge} ${styles.statusCancelled}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                              <AlertTriangle size={11} /> Cancel Requested
                            </span>
                          )}
                        </div>
                      </div>

                      <div className={styles.cardMeta}>
                        <div className={styles.cardMetaRow}>
                          <span style={{ color: 'hsl(var(--muted-foreground))' }}>Pickup</span>
                          <span style={{ fontWeight: 500 }}>{fmtDate(order.pickupDate)}</span>
                        </div>
                        <div className={styles.cardMetaRow}>
                          <span style={{ color: 'hsl(var(--muted-foreground))' }}>Return</span>
                          <span style={{ fontWeight: 500 }}>{fmtDate(order.returnDate)} ({order.totalDays}d)</span>
                        </div>
                        <div className={styles.cardMetaRow}>
                          <span style={{ color: 'hsl(var(--muted-foreground))' }}>Booked</span>
                          <span style={{ fontWeight: 500 }}>{fmtDate(order.createdAt)}</span>
                        </div>
                      </div>

                      {(order.isCancellationRequested || order.is_cancellation_requested || order.status === 'CANCELLED') && (order.cancellationReason || order.cancellation_reason) && (
                        <div style={{ padding: '0.4rem 0.6rem', margin: '0.5rem 0', background: 'hsl(0 86% 97%)', borderRadius: 'var(--radius)', fontSize: '0.75rem', color: 'hsl(var(--danger))', fontStyle: 'italic' }}>
                          Reason: &ldquo;{order.cancellationReason || order.cancellation_reason}&rdquo;
                        </div>
                      )}

                      <div className={styles.cardFooter}>
                        <div className={styles.textPrice} style={{ fontSize: '1rem' }}>{fmtMoney(order.totalAmount)} ETB</div>
                        <div style={{ display: 'flex', gap: '0.375rem', alignItems: 'center' }}>
                          {isOrderUpdatable(order) && (
                            <button
                              onClick={(e) => { e.stopPropagation(); openEditModal(order); }}
                              className={styles.btnIcon}
                              title="Update booking details"
                            >
                              <Edit3 size={15} />
                            </button>
                          )}
                          {canDel && (
                            <button
                              onClick={(e) => handleHideOrder(e, order.id, order.carName || `Booking #${order.id}`)}
                              className={`${styles.btnIcon} ${styles.btnIconDanger}`}
                              title={order.status === 'CANCELLED' ? "Remove cancelled order from dashboard" : "Remove from dashboard"}
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {renderConfirmDelete()}

      {/* Edit Modal Dialog */}
      {renderEditModal()}
    </>
  );
}
