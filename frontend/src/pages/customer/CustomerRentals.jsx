import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Car, Clock, CheckSquare, XSquare, PlaySquare, RefreshCw,
  ArrowLeft, Calendar, DollarSign, Image as ImageIcon,
  Upload, Plus, XCircle, User, Phone, Mail, CreditCard,
  FileText, MapPin, Hash, Wrench, AlertTriangle, Trash2
} from 'lucide-react';
import carService from '../../services/carService';
import SegmentedSpinner from '../../components/ui/SegmentedSpinner';
import styles from './CustomerRentals.module.css';

/* ─── helpers ──────────────────────────────────────────────── */
const BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1').replace('/api/v1', '');

const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${BASE}${path.startsWith('/') ? path : '/' + path}`.replace(/\\/g, '/');
};

const fmtDate  = (d) => d ? new Date(d).toLocaleDateString('en-GB',  { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
const fmtMoney = (n) => parseFloat(n || 0).toFixed(2);

/* ─── status maps ─────────────────────────────────────────── */
const ORDER_STATUS = {
  PENDING_APPROVAL: { label: 'Pending Approval', bg: 'hsl(28 40% 88%)',  color: 'hsl(28 50% 30%)' },
  APPROVED:         { label: 'Approved',         bg: 'hsl(77 55% 88%)',  color: 'hsl(77 55% 28%)' },
  CONFIRMED:        { label: 'Confirmed',        bg: 'hsl(142 55% 86%)', color: 'hsl(142 60% 24%)' },
  ACTIVE:           { label: 'Active',           bg: 'hsl(200 60% 88%)', color: 'hsl(200 60% 28%)' },
  COMPLETED:        { label: 'Completed',        bg: 'hsl(142 70% 86%)', color: 'hsl(142 70% 22%)' },
  REJECTED:         { label: 'Rejected',         bg: 'hsl(0 72% 92%)',   color: 'hsl(0 72% 38%)' },
  CANCELLED:        { label: 'Cancelled',        bg: 'hsl(0 72% 92%)',   color: 'hsl(0 72% 38%)' },
};

const PAYMENT_STATUS = {
  UNPAID:  { label: 'Unpaid',  bg: 'hsl(36 100% 90%)', color: 'hsl(36 100% 35%)' },
  PAID:    { label: 'Paid',    bg: 'hsl(142 70% 86%)', color: 'hsl(142 70% 22%)' },
  PARTIAL: { label: 'Partial', bg: 'hsl(77 55% 88%)',  color: 'hsl(77 55% 28%)' },
};

const STATUS_TABS = [
  { key: 'ALL',              label: 'All Rentals', Icon: Car },
  { key: 'PENDING_APPROVAL', label: 'Pending',     Icon: Clock },
  { key: 'APPROVED',         label: 'Approved',    Icon: CheckSquare },
  { key: 'ACTIVE',           label: 'Active',      Icon: PlaySquare },
  { key: 'COMPLETED',        label: 'Completed',   Icon: CheckSquare },
];

/* ═══════════════════════════════════════════════════════════
   COMPONENT
═══════════════════════════════════════════════════════════ */
export default function CustomerRentals() {
  const navigate = useNavigate();
  const [orders, setOrders]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [selected, setSelected]     = useState(null);
  const [activeTab, setActiveTab]   = useState('ALL');
  const [refreshing, setRefreshing] = useState(false);
  const [notification, setNotif]    = useState(null);
  const [imgError, setImgError]     = useState(false);
  const [lightbox, setLightbox]     = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  // action states
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading]       = useState(false);
  const [cancelOpen, setCancelOpen]     = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [extendOpen, setExtendOpen]     = useState(false);
  const [extendDays, setExtendDays]     = useState(1);
  const fileRef = useRef(null);

  const toast = (msg, type = 'success') => {
    setNotif({ msg, type });
    setTimeout(() => setNotif(null), 4500);
  };

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
      toast('Failed to load rentals.', 'error');
    } finally {
      setLoading(false);
    }
  }, [selected]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const handleHideOrder = (e, id, label) => {
    e.stopPropagation();
    setConfirmDelete({ id, label });
  };

  const confirmHideOrder = async () => {
    if (!confirmDelete) return;
    const { id } = confirmDelete;
    setConfirmDelete(null);
    try {
      const axios = require('../../services/apiClient').default;
      await axios.delete(`/api/v1/rentals/my-orders/${id}/hide`);
      setOrders(prev => prev.filter(o => o.id !== id));
      toast('Order removed from your dashboard.', 'success');
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to remove order.', 'error');
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
      toast('Rentals refreshed.');
    } catch { toast('Failed to refresh.', 'error'); }
    finally { setRefreshing(false); }
  };

  const handleUploadProof = async () => {
    if (!selectedFile || !selected) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('proof', selectedFile);
      await carService.uploadPaymentProof(selected.id, fd);
      toast('Payment proof uploaded!');
      setSelectedFile(null);
      if (fileRef.current) fileRef.current.value = '';
      fetchOrders();
    } catch { toast('Failed to upload payment proof.', 'error'); }
    finally { setUploading(false); }
  };

  const handleCancel = async () => {
    if (!cancelReason.trim()) return toast('Cancellation reason is required.', 'error');
    try {
      await carService.cancelRentalOrder(selected.id, cancelReason);
      toast('Rental cancelled successfully.');
      setCancelOpen(false);
      setCancelReason('');
      fetchOrders();
    } catch { toast('Failed to cancel rental.', 'error'); }
  };

  const handleExtend = async () => {
    try {
      await carService.extendRentalOrder(selected.id, extendDays);
      toast('Extension requested successfully.');
      setExtendOpen(false);
      setExtendDays(1);
      fetchOrders();
    } catch { toast('Failed to request extension.', 'error'); }
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

  const filtered = activeTab === 'ALL' ? orders : orders.filter(o => o.status === activeTab);

  /* ═══════════════════════════════════════════════════════════
     DETAIL VIEW — single full page
  ═══════════════════════════════════════════════════════════ */
  if (selected) {
    const o    = selected;
    const ost  = ORDER_STATUS[o.status]        || ORDER_STATUS.PENDING_APPROVAL;
    const pst  = PAYMENT_STATUS[o.paymentStatus] || null;
    const imgUrl = getImageUrl(o.carImage);
    const proofUrl = getImageUrl(o.paymentProofUrl);
    const canCancel = ['PENDING_APPROVAL', 'APPROVED'].includes(o.status);
    const canUpload  = o.status === 'APPROVED' && o.paymentStatus !== 'PAID';
    const canExtend  = o.status === 'ACTIVE';

    const hasFees = o.extensionFee > 0 || o.damageFee > 0 || o.fuelFee > 0 || o.lateFee > 0;

    return (
      <div className={styles.page}>
        {notification && (
          <div className={`${styles.toast} ${
            notification.type === 'error' ? styles.toastError :
            notification.type === 'warning' ? styles.toastWarning : styles.toastSuccess
          }`}>
            {notification.msg}
          </div>
        )}

        <div className={styles.wrap}>
          {/* top nav row */}
          <div className={styles.detailTopBar}>
            <button className={styles.backBtn} onClick={() => setSelected(null)}>
              <ArrowLeft size={16} /> Back to Rentals
            </button>
            {canCancel && !cancelOpen && (
              <button className={styles.btnDanger} onClick={() => setCancelOpen(true)}>
                <XSquare size={16} /> Cancel Rental
              </button>
            )}
          </div>

          <div className={styles.detailWrap}>
            {/* ── dark green top strip ── */}
            <div className={styles.detailTop}>
              <div>
                <div className={styles.detailInvLabel}>Car Rental</div>
                <h1 className={styles.detailInvNumber}>#{o.orderNumber || o.id}</h1>
                <div className={styles.detailInvDate}>
                  <Calendar size={14} /> Booked {fmtDate(o.createdAt)}
                </div>
              </div>
              <div className={styles.totalBox}>
                <div className={styles.totalLabel}>Total Amount</div>
                <div className={styles.totalAmt}>{fmtMoney(o.totalAmount)} ETB</div>
              </div>
            </div>

            {/* status bar */}
            <div className={styles.statusBar}>
              <span className={styles.statusLabel}>Order:</span>
              <span className={styles.badge} style={{ backgroundColor: ost.bg, color: ost.color }}>
                {ost.label}
              </span>
              {pst && (
                <>
                  <div className={styles.statusDivider} />
                  <span className={styles.statusLabel}>Payment:</span>
                  <span className={styles.badge} style={{ backgroundColor: pst.bg, color: pst.color }}>
                    {pst.label}
                  </span>
                </>
              )}
              {o.isCancellationRequested && (
                <>
                  <div className={styles.statusDivider} />
                  <span className={styles.badge} style={{ backgroundColor: 'hsl(var(--warning))', color: 'hsl(var(--warning-foreground))' }}>
                    <AlertTriangle size={13} /> Cancellation Requested
                  </span>
                </>
              )}
              {o.pendingExtensionDays && (
                <>
                  <div className={styles.statusDivider} />
                  <span className={styles.badge} style={{ backgroundColor: 'hsl(200 60% 88%)', color: 'hsl(200 60% 28%)' }}>
                    Extension Pending ({o.pendingExtensionDays}d)
                  </span>
                </>
              )}
            </div>

            {/* ── body ── */}
            <div className={styles.detailBody}>
              {/* SECTION 1 — Vehicle & Dates */}
              <div className={styles.section}>
                <h2 className={styles.sectionTitle}><Car size={16} /> Vehicle &amp; Rental Dates</h2>
                <div className={styles.twoColGrid}>
                  {/* left: image + car name */}
                  <div>
                    <div className={styles.carImageWrap}>
                      {imgUrl && !imgError ? (
                        <img
                          src={imgUrl}
                          alt={o.carName}
                          className={styles.carImage}
                          onError={() => setImgError(true)}
                          onClick={() => setLightbox(imgUrl)}
                        />
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', color: 'hsl(var(--muted-foreground))' }}>
                          <ImageIcon size={40} />
                          <span style={{ fontSize: '0.875rem' }}>No Image</span>
                        </div>
                      )}
                    </div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'hsl(var(--primary-dark))', marginBottom: '0.25rem' }}>
                      {o.carName || '—'}
                    </div>
                    <div style={{ fontSize: '0.9375rem', color: 'hsl(var(--foreground))' }}>
                      Daily Rate: <strong style={{ color: 'hsl(var(--primary))' }}>{fmtMoney(o.dailyRate)} ETB/day</strong>
                    </div>
                  </div>
                  {/* right: date rows */}
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
                        <span className={styles.infoValue} style={{ maxWidth: '14rem', textAlign: 'right', textTransform: 'none' }}>
                          {o.specialRequests}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <hr className={styles.divider} />

              {/* SECTION 2 — Customer & Driver */}
              <div className={styles.twoColGrid} style={{ marginBottom: '2rem' }}>
                <div className={styles.section} style={{ marginBottom: 0 }}>
                  <h2 className={styles.sectionTitle}><User size={16} /> Customer Info</h2>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}><User size={14} /> Name</span>
                    <span className={styles.infoValue}>{o.customerName || '—'}</span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}><Mail size={14} /> Email</span>
                    <span className={styles.infoValue} style={{ textTransform: 'none' }}>{o.customerEmail || '—'}</span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}><Phone size={14} /> Phone</span>
                    <span className={styles.infoValue}>{o.customerPhone || '—'}</span>
                  </div>
                </div>
                
                <div className={styles.section} style={{ marginBottom: 0 }}>
                  <h2 className={styles.sectionTitle}><Wrench size={16} /> Driver Info</h2>
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
              <div className={styles.section}>
                <h2 className={styles.sectionTitle}><CreditCard size={16} /> Payment Summary</h2>
                <div style={{ maxWidth: '25rem' }}>
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

                {/* payment details */}
                <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontSize: '0.8125rem', color: 'hsl(var(--muted-foreground))', marginBottom: '0.25rem' }}>Payment Method</div>
                    <div style={{ fontWeight: 600, color: 'hsl(var(--foreground))', textTransform: 'capitalize' }}>
                      {o.paymentMethod || '—'}
                    </div>
                  </div>
                  {o.paymentReference && (
                    <div>
                      <div style={{ fontSize: '0.8125rem', color: 'hsl(var(--muted-foreground))', marginBottom: '0.25rem' }}>Reference</div>
                      <div style={{ fontWeight: 600, color: 'hsl(var(--foreground))' }}>{o.paymentReference}</div>
                    </div>
                  )}
                  {o.verifiedAmount && (
                    <div>
                      <div style={{ fontSize: '0.8125rem', color: 'hsl(var(--muted-foreground))', marginBottom: '0.25rem' }}>Verified Amount</div>
                      <div style={{ fontWeight: 600, color: 'hsl(var(--success))' }}>{fmtMoney(o.verifiedAmount)} ETB</div>
                    </div>
                  )}
                  {proofUrl && (
                    <div>
                      <div style={{ fontSize: '0.8125rem', color: 'hsl(var(--muted-foreground))', marginBottom: '0.25rem' }}>Payment Proof</div>
                      <img
                        src={proofUrl}
                        alt="Proof"
                        className={styles.proofImg}
                        onClick={() => setLightbox(proofUrl)}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* notes / remarks from manager */}
              {(o.managerNote || o.pickupRemarks || o.financeNotes || o.cancellationReason) && (
                <>
                  <hr className={styles.divider} />
                  <div className={styles.section}>
                    <h2 className={styles.sectionTitle}><FileText size={16} /> Notes &amp; Remarks</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {o.managerNote && (
                        <div className={styles.infoRow} style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.25rem' }}>
                          <span className={styles.infoLabel}>Manager Note</span>
                          <span style={{ color: 'hsl(var(--foreground))', lineHeight: 1.6, textTransform: 'none' }}>{o.managerNote}</span>
                        </div>
                      )}
                      {o.pickupRemarks && (
                        <div className={styles.infoRow} style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.25rem' }}>
                          <span className={styles.infoLabel}>Pickup Remarks</span>
                          <span style={{ color: 'hsl(var(--foreground))', lineHeight: 1.6, textTransform: 'none' }}>{o.pickupRemarks}</span>
                        </div>
                      )}
                      {o.financeNotes && (
                        <div className={styles.infoRow} style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.25rem' }}>
                          <span className={styles.infoLabel}>Finance Notes</span>
                          <span style={{ color: 'hsl(var(--foreground))', lineHeight: 1.6, textTransform: 'none' }}>{o.financeNotes}</span>
                        </div>
                      )}
                      {o.cancellationReason && (
                        <div className={styles.infoRow} style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.25rem' }}>
                          <span className={styles.infoLabel} style={{ color: 'hsl(var(--danger))' }}>Cancellation Reason</span>
                          <span style={{ color: 'hsl(var(--foreground))', lineHeight: 1.6, textTransform: 'none' }}>{o.cancellationReason}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* ── ACTIONS ── */}
              {(canUpload || canExtend || canCancel) && (
                <>
                  <hr className={styles.divider} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                    {/* Upload payment proof */}
                    {canUpload && (
                      <div className={styles.actionSection}>
                        <h2 className={styles.sectionTitle} style={{ marginBottom: '1rem', borderBottom: 'none', paddingBottom: 0 }}>
                          <Upload size={16} /> Upload Payment Proof
                        </h2>
                        <input
                          type="file"
                          ref={fileRef}
                          accept="image/*,.pdf"
                          onChange={e => setSelectedFile(e.target.files[0])}
                          className={styles.input}
                          style={{ padding: '0.5rem', cursor: 'pointer' }}
                        />
                        <button
                          className={styles.btnPrimary}
                          style={{ marginTop: '1rem' }}
                          onClick={handleUploadProof}
                          disabled={!selectedFile || uploading}
                        >
                          <Upload size={15} /> {uploading ? 'Uploading…' : 'Submit Proof'}
                        </button>
                      </div>
                    )}

                    {/* Extend rental */}
                    {canExtend && (
                      <div className={styles.actionSection}>
                        <h2 className={styles.sectionTitle} style={{ marginBottom: '1rem', borderBottom: 'none', paddingBottom: 0 }}>
                          <Plus size={16} /> Extend Rental
                        </h2>
                        {!extendOpen ? (
                          <button className={styles.btnSecondary} onClick={() => setExtendOpen(true)}>
                            <Plus size={15} /> Request Extension
                          </button>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '17.5rem' }}>
                            <label className={styles.formLabel}>Additional days:</label>
                            <input
                              type="number"
                              min="1"
                              value={extendDays}
                              onChange={e => setExtendDays(e.target.value)}
                              className={styles.input}
                            />
                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                              <button className={styles.btnPrimary} onClick={handleExtend}>Submit</button>
                              <button className={styles.btnSecondary} onClick={() => setExtendOpen(false)}>Cancel</button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Cancel rental */}
                    {canCancel && cancelOpen && (
                      <div className={`${styles.actionSection} ${styles.actionSectionDanger}`}>
                        <h2 className={styles.sectionTitle} style={{ color: 'hsl(var(--danger))', marginBottom: '1rem', borderBottom: 'none', paddingBottom: 0 }}>
                          <XSquare size={16} /> Cancel Rental
                        </h2>
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
                        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                          <button className={styles.btnDanger} onClick={handleCancel}>Confirm Cancellation</button>
                          <button className={styles.btnSecondary} onClick={() => setCancelOpen(false)}>Back</button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}

            </div>{/* /detailBody */}
          </div>{/* /detailWrap */}

          {/* lightbox */}
          {lightbox && (
            <div className={styles.modal} onClick={() => setLightbox(null)}>
              <button className={styles.modalClose} onClick={() => setLightbox(null)}>
                <XCircle size={32} />
              </button>
              <img src={lightbox} alt="Full view" className={styles.modalImg} onClick={e => e.stopPropagation()} />
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════════
     LIST VIEW
  ═══════════════════════════════════════════════════════════ */
  return (
    <>
    <div className={styles.page}>
      {notification && (
        <div className={`${styles.toast} ${
          notification.type === 'error' ? styles.toastError :
          notification.type === 'warning' ? styles.toastWarning : styles.toastSuccess
        }`}>
          {notification.msg}
        </div>
      )}

      <div className={styles.wrap}>
        {/* header */}
        <div className={styles.header}>
          <div className={styles.headerMeta}>
            <h1 className={styles.pageTitle}>Vehicle Rentals</h1>
            <p className={styles.pageSubtitle}>Track and manage your car rental bookings</p>
          </div>
          <div className={styles.headerActions}>
            <button className={styles.btnPrimary} onClick={() => navigate('/services/agrirent')}>
              <Plus size={16} /> New Rental
            </button>
            <button
              className={styles.btnSecondary}
              onClick={handleRefresh}
              disabled={refreshing}
            >
              {refreshing ? <SegmentedSpinner size={16} /> : <RefreshCw size={16} />}
              {refreshing ? 'Refreshing…' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* tabs */}
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

        {/* list */}
        {loading ? (
          <div className={styles.empty}>
            <div className={styles.emptyTitle}>Loading rentals…</div>
          </div>
        ) : filtered.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}><Car size={48} /></div>
            <h2 className={styles.emptyTitle}>No Rentals Found</h2>
            <p className={styles.emptyDesc}>You don&apos;t have any rentals in this category.</p>
            <button className={styles.btnPrimary} onClick={() => navigate('/services/agrirent')}>
              Rent a Vehicle
            </button>
          </div>
        ) : (
          <div className={styles.list}>
              {filtered.map(order => {
              const ost = ORDER_STATUS[order.status] || ORDER_STATUS.PENDING_APPROVAL;
              const pst = PAYMENT_STATUS[order.paymentStatus] || null;
              return (
                <div
                  key={order.id}
                  className={styles.card}
                  onClick={() => openDetail(order)}
                  tabIndex={0}
                  onKeyDown={e => e.key === 'Enter' && openDetail(order)}
                >
                  {/* Left: order number + status */}
                  <div className={styles.cardHeader}>
                    <span className={styles.orderNum}>#{order.orderNumber || order.id}</span>
                    <span className={styles.badge} style={{ backgroundColor: ost.bg, color: ost.color }}>
                      {ost.label}
                    </span>
                    {pst && (
                      <span className={styles.badge} style={{ backgroundColor: pst.bg, color: pst.color }}>
                        {pst.label}
                      </span>
                    )}
                  </div>

                  {/* Vehicle name — grows */}
                  <h3 className={styles.cardTitle}>{order.carName || 'Vehicle'}</h3>

                  {/* Dates */}
                  <div className={styles.cardDates}>
                    {fmtDate(order.pickupDate)} → {fmtDate(order.returnDate)}
                    <span style={{ marginLeft: '0.4rem', fontWeight: 400, color: 'hsl(var(--primary))' }}>
                      ({order.totalDays}d)
                    </span>
                  </div>

                  {/* Amount + booked date */}
                  <div className={styles.cardMeta}>
                    <span><DollarSign size={13} /> {fmtMoney(order.totalAmount)} ETB</span>
                    <span><Calendar size={13} /> {fmtDate(order.createdAt)}</span>
                  </div>

                  {/* View link */}
                  <div className={styles.cardFooter} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    {['COMPLETED', 'completed', 'REJECTED', 'rejected', 'CANCELLED', 'cancelled', 'ABANDONED', 'abandoned'].includes(order.status) && (
                      <button 
                        onClick={(e) => handleHideOrder(e, order.id, order.carName || order.vehicle_model || `Booking #${order.id}`)}
                        style={{ background: 'none', border: 'none', color: '#e53e3e', cursor: 'pointer', padding: '4px' }}
                        title="Delete from dashboard"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                    <span className={styles.viewLink}>View →</span>
                  </div>
                </div>
              );
            })}
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
            This only hides it for you — the rental team still has your booking.
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
