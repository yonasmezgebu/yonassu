import React, { useState, useEffect, useRef } from 'react';
import axios from '../../../services/apiClient';
import carService from '../../../services/carService';
import authService from '../../../services/authService';
import {
  ArrowLeft, RefreshCw, Printer, Car, User, Calendar, Clock,
  DollarSign, Download, BadgeCheck, Receipt, Play, RotateCcw,
  Ban, ListChecks, Archive, Trash2, FileText, Hash,
  CheckCircle2, AlertTriangle,
} from 'lucide-react';
import SegmentedSpinner from '../../../components/ui/SegmentedSpinner';
import './CarRentalOrderDetail.css';
import './RentalOrders.css';

/* ─────────────── STATUS CONFIG ─────────────── */
const STATUS_LABELS = {
  PENDING_APPROVAL: 'Pending Approval',
  APPROVED:         'Approved',
  CONFIRMED:        'Confirmed',
  ACTIVE:           'On Rent',
  COMPLETED:        'Completed',
  CANCELLED:        'Cancelled',
  REJECTED:         'Rejected',
};

const STATUS_MOD = {
  PENDING_APPROVAL: 'pending',
  APPROVED:         'approved',
  CONFIRMED:        'approved',
  ACTIVE:           'active',
  COMPLETED:        'done',
  CANCELLED:        'danger',
  REJECTED:         'danger',
};

const PAY_STATUS_LABELS = {
  PAID: 'Payment Confirmed',
  Confirmed: 'Payment Confirmed',
  PENDING_VERIFICATION: 'Pending Verification',
  PAYMENT_REJECTED: 'Payment Rejected',
  REJECTED: 'Payment Rejected',
  Rejected: 'Payment Rejected',
  UNPAID: 'Unpaid',
};

const TERMINAL_STATUSES = ['COMPLETED', 'CANCELLED', 'REJECTED'];
const STARTABLE_STATUSES = ['APPROVED', 'CONFIRMED'];
const DAY_MS = 86400000;

/* ─────────────── HELPERS ─────────────── */
const fmt    = n => Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtDate = d => { if (!d) return '—'; try { return new Date(d).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }); } catch { return '—'; } };
const fmtDT   = d => { if (!d) return '—'; try { return new Date(d).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }); } catch { return '—'; } };

const ord = (order, ...keys) => {
  for (const k of keys) { const v = order?.[k]; if (v !== undefined && v !== null && v !== '') return v; }
  return null;
};

/* field reads — model toJSON emits camelCase, DB rows emit snake_case */
const f = (order, ...keys) => ord(order, ...keys);

const getImgUrl = p => {
  if (!p) return null;
  if (p.startsWith('http')) return p;
  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  return `${API_BASE}/${p.replace(/^\/+/, '')}`;
};

const rentalStats = (order) => {
  const start = new Date(f(order, 'pickupDate', 'start_date', 'startDate', 'pickupDateTime'));
  const end = new Date(f(order, 'returnDate', 'end_date', 'endDate', 'returnDateTime'));
  const totalDays = Number(f(order, 'totalDays', 'total_days', 'days') || Math.max(1, Math.ceil((end - start) / DAY_MS)));
  const begun = f(order, 'rentalStartTime', 'rental_start_time', 'activatedAt');
  const now = Date.now();
  const elapsedDays = begun ? Math.max(0, Math.floor((now - new Date(begun).getTime()) / DAY_MS)) : 0;
  const diff = end.getTime() - now;
  const overdue = diff < 0;
  const remaining = diff < 0 ? Math.abs(Math.ceil(diff / DAY_MS)) : Math.ceil(diff / DAY_MS);
  const pct = totalDays > 0 ? Math.min(100, Math.max(0, Math.round((elapsedDays / totalDays) * 100))) : 0;
  return { start, end, totalDays, began: begun, elapsedDays, remaining, overdue, pct };
};

/* ─────────────── BADGES / TOASTS ─────────────── */
const StatusBadge = ({ code }) => (
  <span className={`ro2-badge ro2-badge--${STATUS_MOD[code] || 'approved'}`}>
    <span className="ro2-badge__dot" />
    {STATUS_LABELS[code] || code}
  </span>
);

const PayBadge = ({ status }) => {
  let mod = 'pending';
  let label = 'Awaiting Payment';
  let Icon = Clock;
  if (status === 'PAID' || status === 'Confirmed') { mod = 'success'; label = 'Payment Confirmed'; Icon = BadgeCheck; }
  else if (String(status || '').toUpperCase().includes('REJECT')) { mod = 'danger'; label = 'Payment Rejected'; Icon = Ban; }
  return (
    <span className={`ro2-badge ro2-badge--${mod}`}>
      <Icon size={12} /> {label}
    </span>
  );
};

const Toast = ({ toasts, remove }) => (
  <div className="ro2-toast-wrap">
    {toasts.map(t => (
      <div key={t.id} className={`ro2-toast ro2-toast--${t.type}`}>
        <span>{t.message}</span>
        <button className="ro2-toast__close" onClick={() => remove(t.id)} aria-label="Dismiss">×</button>
      </div>
    ))}
  </div>
);

/* ─────────────── MODAL ─────────────── */
const ActionModal = ({ title, icon, children, confirmLabel, confirmDisabled, loading, onConfirm, onClose }) => (
  <div className="ro2-overlay" onClick={onClose}>
    <div className="ro2-modal" role="dialog" aria-modal="true" onClick={e => e.stopPropagation()}>
      <div className="ro2-modal__head">
        <h3 className="ro2-title">{icon} {title}</h3>
        <button className="ro2-close" onClick={onClose} aria-label="Close">×</button>
      </div>
      <div className="ro2-modal__body">{children}</div>
      <div className="ro2-modal__actions">
        <button className="ro2-btn ro2-btn--ghost" onClick={onClose}>Cancel</button>
        <button
          className="ro2-btn ro2-btn--primary"
          onClick={onConfirm}
          disabled={confirmDisabled || loading}
        >
          {loading ? <SegmentedSpinner size={13} /> : null} {confirmLabel}
        </button>
      </div>
    </div>
  </div>
);

/* ─────────────── MAIN COMPONENT ─────────────── */
const CarRentalOrderDetail = ({ orderId, onBack }) => {
  const printRef = useRef();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actLoading, setActLoading] = useState('');
  const [toasts, setToasts] = useState([]);
  const [modal, setModal] = useState(null); // null | { type }
  const [resubmitFile, setResubmitFile] = useState(null);
  const [form, setForm] = useState({
    reason: '', status: '', statusNote: '', startNote: '',
    odometer: '', damageFee: '', fuelFee: '', lateFee: '', notes: '',
    carCondition: '', conditionReason: '',
  });

  const toast = (message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts(p => [...p, { id, message, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4500);
  };
  const removeToast = id => setToasts(p => p.filter(t => t.id !== id));

  const user = authService.getUser?.() || authService.getCurrentUser?.() || {};
  const userRoles = (user.roles || (user.role ? [user.role] : [])).map(r => String(r).toLowerCase());
  const isFinance = ['finance', 'finance manager', 'admin', 'ceo'].some(r => userRoles.includes(r));

  const load = async () => {
    try {
      setLoading(true); setError('');
      const res = await axios.get(`/rental-orders/${orderId}`);
      const data = (res && (res.data && res.data.data)) || res?.data || res;
      setOrder(data);
    } catch (e) {
      setError(e?.response?.data?.message || e.message || 'Failed to load order.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [orderId]);

  const doAction = async (key, fn, successMsg) => {
    try {
      setActLoading(key);
      await fn();
      toast(successMsg, 'success');
      await load();
    } catch (e) {
      toast(e?.response?.data?.message || e.message || 'Action failed.', 'error');
    } finally {
      setActLoading('');
    }
  };

  const openModal = type => { setForm({ reason: '', status: '', statusNote: '', startNote: '', odometer: '', damageFee: '', fuelFee: '', lateFee: '', notes: '', carCondition: '', conditionReason: '' }); setModal({ type }); };

  const handleConfirm = async () => {
    const { type } = modal || {};
    if (type === 'cancel') {
      if (!form.reason.trim()) return;
      await doAction('cancel', () => carService.cancelRentalOrder(orderId, form.reason.trim()), 'Order cancelled.');
    } else if (type === 'return') {
      await doAction('return', () => carService.processReturn(orderId, {
        odometer: form.odometer ? Number(form.odometer) : null,
        damageFee: form.damageFee ? Number(form.damageFee) : 0,
        fuelFee: form.fuelFee ? Number(form.fuelFee) : 0,
        lateFee: form.lateFee ? Number(form.lateFee) : 0,
        carCondition: form.carCondition,
        conditionReason: form.conditionReason.trim() || undefined,
        notes: form.notes.trim() || undefined,
      }), 'Rental completed & moved to history — car released.');
    } else if (type === 'start') {
      await doAction('start', () => axios.post(`/rental-orders/${orderId}/start`, { note: form.startNote.trim() || undefined }), 'Rental started — car is now rented.');
    } else if (type === 'status') {
      const isTerminal = ['COMPLETED', 'CANCELLED', 'REJECTED'].includes(form.status);
      await doAction('status', () => carService.updateRentalOrderStatus(orderId, { status: form.status, note: form.statusNote.trim() || undefined }), isTerminal ? 'Order status updated — moved to history.' : 'Order status updated.');
    } else if (type === 'archive') {
      await doAction('archive', () => axios.post(`/rental-orders/${orderId}/archive`), 'Order moved to history.');
    } else if (type === 'delete') {
      await doAction('delete', () => axios.delete(`/rental-orders/${orderId}`), 'Order deleted.');
    }
    setModal(null);
  };

  const handleApprove = () => doAction('approve', () => carService.updateRentalOrderStatus(orderId, { status: 'APPROVED' }), 'Order approved.');
  const handleConfirmPayment = () => doAction('pay_confirm', () => carService.verifyPayment(orderId, { isVerified: true, verifiedAmount: order.totalAmount, notes: 'Confirmed from details' }), 'Payment confirmed.');
  const handleRejectPayment = () => doAction('pay_reject', () => carService.verifyPayment(orderId, { isVerified: false, notes: form.reason.trim() || 'Rejected from details' }), 'Payment rejected.');

  const handleResubmitProof = async () => {
    if (!resubmitFile) { toast('Choose a payment proof file first.', 'error'); return; }
    try {
      setActLoading('pay_resubmit');
      const fd = new FormData();
      fd.append('proof', resubmitFile);
      await axios.post(`/rental-orders/${orderId}/payment-proof`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast('New payment proof resubmitted to Finance.', 'success');
      setModal(null);
      setResubmitFile(null);
      await load();
    } catch (e) {
      toast(e?.response?.data?.message || e.message || 'Failed to resubmit proof.', 'error');
    } finally {
      setActLoading('');
    }
  };

  const handlePrint = () => {
    if (!printRef.current) return;
    const w = window.open('', '_blank');
    w.document.write(`
      <html>
        <head>
          <title>SUTANA — Rental Contract ${order?.orderNumber || ''}</title>
          <style>
            @page { margin: 14mm; size: A4; }
            * { box-sizing: border-box; }
            body { font-family: 'Inter', 'Segoe UI', sans-serif; line-height: 1.6; color: #1e293b; background: #fff; margin: 0; }
            button, input, select, textarea { display: none !important; }
            .d2-header, .d2-actions, .d2-side, .ro2-toast-wrap { display: none !important; }
            .d2 { background: #fff !important; padding: 0 !important; }
            .d2-grid { grid-template-columns: 1fr !important; }
            .d2-badges { gap: 8px; margin: 0 0 16px; }
            .d2-section { box-shadow: none !important; break-inside: avoid; margin-bottom: 14px; }
            .d2-kv { grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); }
            .d2-img { max-height: 220px; }
            img { max-width: 100%; }
            .d2-progress, .ro2-progress { display: none !important; }
          </style>
        </head>
        <body>
          ${printRef.current.innerHTML}
        </body>
      </html>
    `);
    w.document.close();
    setTimeout(() => w.print(), 400);
  };

  /* ── Loading / Error ── */
  if (loading) return (
    <div className="d2 d2-loading">
      <SegmentedSpinner size={32} />
      <span>Loading order details...</span>
    </div>
  );

  if (error || !order) return (
    <div className="d2">
      <div className="d2-section d2-error">
        <p className="ro2-empty__title" style={{ color: 'hsl(var(--danger))' }}>{error || 'Order not found.'}</p>
        <button className="ro2-btn ro2-btn--primary" onClick={onBack}>
          <ArrowLeft size={15} /> Back to Orders
        </button>
      </div>
    </div>
  );

  /* ── Derived data (fixed field mapping) ── */
  const paid = ['PAID', 'CONFIRMED'].includes(String(order.paymentStatus || order.payment_status || '').toUpperCase());
  const payRejected = String(order.paymentStatus || order.payment_status || '').toLowerCase().includes('reject');
  const financeReason = f(order, 'financeNotes', 'finance_notes');
  const isTerminal = TERMINAL_STATUSES.includes(order.status);
  const startable = STARTABLE_STATUSES.includes(order.status);

  const customerName  = f(order, 'customerName', 'customer_name') || 'Walk-In Customer';
  const customerPhone = f(order, 'customerPhone', 'customer_phone');
  const customerEmail = f(order, 'customerEmail', 'customer_email');

  const carName = f(order, 'carName', 'car_name')
    || `${f(order, 'carBrand', 'car_brand') || ''} ${f(order, 'carModel', 'car_model') || ''}`.trim()
    || (order.car ? `${order.car.brand || ''} ${order.car.model || ''}`.trim() : '')
    || 'Vehicle';
  const carImgUrl = getImgUrl(f(order, 'carImage', 'car_image') || order.car?.image1 || order.car?.images?.[0]);
  const licensePlate = f(order, 'carLicensePlate', 'car_license_plate') || order.car?.licensePlate;
  const fuelType     = f(order, 'carFuelType', 'car_fuel_type') || order.car?.fuelType;
  const transmission = f(order, 'carTransmission', 'car_transmission') || order.car?.transmission;
  const carSeats     = f(order, 'carSeats', 'car_seats') || order.car?.seats;

  const pickupDate = f(order, 'pickupDate', 'pickup_date', 'start_date', 'startDate');
  const returnDate = f(order, 'returnDate', 'return_date', 'end_date', 'endDate');
  const totalDays  = Number(f(order, 'totalDays', 'total_days', 'days') || 0);
  const dailyRate  = Number(f(order, 'dailyRate', 'daily_rate') || 0);
  const totalAmt   = Number(f(order, 'totalAmount', 'total_amount') || 0);
  const vatAmt     = Number(f(order, 'vatAmount', 'vat_amount') || 0);
  const deposit    = Number(f(order, 'securityDeposit', 'security_deposit') || 0);
  const subAmt     = Number(f(order, 'subtotal', 'sub_total')) || Math.max(0, totalAmt - vatAmt - deposit);
  const extensionFee = Number(f(order, 'extensionFee', 'extension_fee') || 0);
  const damageFee = Number(f(order, 'damageFee', 'damage_fee') || 0);
  const fuelFee = Number(f(order, 'fuelFee', 'fuel_fee') || 0);
  const lateFee = Number(f(order, 'lateFee', 'late_fee') || 0);
  const refundAmt = Number(f(order, 'refundAmount', 'refund_amount') || 0);
  const carCondition = f(order, 'carCondition', 'car_condition');
  const conditionReason = f(order, 'conditionReason', 'condition_reason');

  const setCondition = cond => setForm(p => ({
    ...p,
    carCondition: cond,
    damageFee: cond === 'fine' ? '' : p.damageFee,
    conditionReason: cond === 'fine' ? '' : p.conditionReason,
  }));
  const deductionPreview = (form.carCondition === 'damaged' && form.damageFee ? Number(form.damageFee) : 0)
    + (form.fuelFee ? Number(form.fuelFee) : 0)
    + (form.lateFee ? Number(form.lateFee) : 0);
  const refundPreview = Math.max(0, deposit - deductionPreview);
  const returnValid = form.carCondition === 'fine'
    || (form.carCondition === 'damaged' && Number(form.damageFee) > 0 && form.conditionReason.trim().length > 0);

  const proofUrl   = getImgUrl(f(order, 'paymentProofUrl', 'payment_proof_url', 'paymentProof', 'payment_screenshot'));
  const paymentRef = f(order, 'paymentReference', 'payment_reference');
  const payMethod  = f(order, 'paymentMethod', 'payment_method');
  const pickupLoc  = f(order, 'pickupLocation', 'pickup_location');
  const notes      = f(order, 'specialRequests', 'special_requests', 'notes', 'manager_note');

  const createdOn   = f(order, 'createdAt', 'created_at');
  const approvedOn  = f(order, 'approvedAt', 'approved_at');
  const startedOn   = f(order, 'rentalStartTime', 'rental_start_time', 'activatedAt', 'activated_at');
  const returnedOn  = f(order, 'actualReturnTime', 'actual_return_time', 'completedAt', 'completed_at');
  const cancelReason = f(order, 'cancellationReason', 'cancellation_reason', 'cancelReason', 'cancel_reason');
  const cancelTime   = f(order, 'cancelledAt', 'cancelled_at');

  const isManual = order.isManual || order.is_manual;
  const r = order.status === 'ACTIVE' ? rentalStats(order) : null;

  const PayIcon = paid ? BadgeCheck : (order.paymentStatus === 'REJECTED' || order.paymentStatus === 'Rejected' ? Ban : Clock);

  /* ── Section header ── */
  const SectionHead = ({ icon, title }) => (
    <div className="d2-section__head">
      <span className="d2-section__icon">{icon}</span>
      <h3 className="d2-section__title">{title}</h3>
    </div>
  );

  const Row = ({ label, value, accent, amount, full }) => (
    <div className={`d2-row${full ? ' d2-row__full' : ''}`}>
      <div className="d2-row__label">{label}</div>
      <div className={`d2-row__value${accent ? ' d2-row__value--accent' : ''}${amount ? ' d2-row__value--amount' : ''}`}>{value || '—'}</div>
    </div>
  );

  return (
    <div className="d2">
      <Toast toasts={toasts} remove={removeToast} />

      {/* ══ HEADER ══ */}
      <div className="d2-header">
        <div className="d2-header__left">
          <button className="ro2-btn ro2-btn--ghost" onClick={onBack} style={{ padding: '0.5rem 0.875rem' }}>
            <ArrowLeft size={16} /> Back
          </button>
          <span className="d2-header__icon"><Car size={20} /></span>
          <div>
            <h1 className="d2-heading">Order Detail</h1>
            <p className="d2-sub">Car Rental Contract · {order.orderNumber}</p>
          </div>
        </div>
        <div className="d2-actions">
          <button className="ro2-btn ro2-btn--ghost" onClick={load}>
            <RefreshCw size={15} className={loading ? 'ro2-spin' : ''} /> Refresh
          </button>
          <button className="ro2-btn ro2-btn--primary" onClick={handlePrint}>
            <Printer size={15} /> Print Contract
          </button>
        </div>
      </div>

      {/* ══ BADGES ══ */}
      <div className="d2-badges">
        <StatusBadge code={order.status} />
        <PayBadge status={order.paymentStatus} />
        {isManual && (
          <span className="ro2-badge ro2-badge--approved"><span className="ro2-badge__dot" /> Manual Entry</span>
        )}
      </div>

      <div className="d2-grid">
        {/* ── MAIN COLUMN ── */}
        <div className="d2-main">
          <div ref={printRef} style={{ display: 'contents' }}>
            {/* ══ KEY NUMBERS ══ */}
            <div className="ro2-stats">
              <div className="ro2-stat"><div className="ro2-stat__label"><DollarSign size={12} /> Total Amount</div><div className="ro2-stat__num">ETB {fmt(totalAmt)}</div></div>
              <div className="ro2-stat ro2-stat--info"><div className="ro2-stat__label"><Receipt size={12} /> VAT (15%)</div><div className="ro2-stat__num">ETB {fmt(vatAmt)}</div></div>
              <div className="ro2-stat ro2-stat--warn"><div className="ro2-stat__label"><Calendar size={12} /> Rental Days</div><div className="ro2-stat__num">{totalDays}</div></div>
              <div className="ro2-stat ro2-stat--success"><div className="ro2-stat__label"><Clock size={12} /> Daily Rate</div><div className="ro2-stat__num">ETB {fmt(dailyRate)}</div></div>
            </div>

            {/* ══ ACTIVE COUNTDOWN ══ */}
            {r && (
              <div className="d2-section">
                <SectionHead icon={<Clock size={15} />} title="Rental Countdown" />
                <div className="d2-row"><div className="d2-row__label">Started</div><div className="d2-row__value d2-row__value--accent">{fmtDT(r.began)}</div></div>
                <div className="d2-row"><div className="d2-row__label">Ends</div><div className="d2-row__value d2-row__value--accent">{fmtDT(r.end)}</div></div>
                <div className={`ro2-progress`} style={{ marginTop: '0.75rem' }}>
                  <div className="ro2-bar-label">
                    <span>{r.elapsedDays} of {r.totalDays} days elapsed</span>
                    <span>
                      {r.overdue ? (
                        <strong className="ro2-days-overdue">{r.remaining} day{r.remaining !== 1 ? 's' : ''} overdue</strong>
                      ) : (
                        <strong className="ro2-days-remain">{r.remaining} day{r.remaining !== 1 ? 's' : ''} remaining</strong>
                      )}
                    </span>
                  </div>
                  <div className="ro2-progress">
                    <div className={`ro2-progress__bar ${r.overdue ? 'ro2-progress__bar--overdue' : ''}`} style={{ width: `${r.pct}%` }} />
                  </div>
                </div>
              </div>
            )}

            {/* ══ CUSTOMER ══ */}
            <div className="d2-section">
              <SectionHead icon={<User size={15} />} title="Customer Information" />
              <div className="d2-kv">
                <Row label="Full Name" value={customerName} accent />
                <Row label="Phone" value={customerPhone} />
                <Row label="Email" value={customerEmail} />
                <Row label="Customer ID" value={order.customerId ? `#${order.customerId}` : 'Walk-In / Manual'} />
              </div>
            </div>

            {/* ══ VEHICLE ══ */}
            <div className="d2-section">
              <SectionHead icon={<Car size={15} />} title="Vehicle Details" />
              {carImgUrl && <img className="d2-img" src={carImgUrl} alt={carName} onError={e => { e.target.style.display = 'none'; }} />}
              <div className="d2-kv">
                <Row label="Vehicle" value={carName} accent />
                <Row label="License Plate" value={licensePlate} />
                <Row label="Fuel Type" value={fuelType} />
                <Row label="Transmission" value={transmission} />
                <Row label="Seats" value={carSeats ? `${carSeats} seats` : ''} />
                <Row label="Vehicle ID" value={order.carId ? `#${order.carId}` : ''} />
              </div>
            </div>

            {/* ══ RENTAL PERIOD ══ */}
            <div className="d2-section">
              <SectionHead icon={<Calendar size={15} />} title="Rental Period" />
              <div className="d2-kv">
                <Row label="Start Date" value={fmtDate(pickupDate)} accent />
                <Row label="End Date" value={fmtDate(returnDate)} accent />
                <Row label="Duration" value={`${totalDays} day${totalDays !== 1 ? 's' : ''}`} />
                <Row label="Pickup Location" value={pickupLoc} />
              </div>
              {notes && (
                <figure className="d2-quote" style={{ marginTop: '0.75rem' }}>
                  <strong style={{ color: 'hsl(var(--fg))' }}>Special Notes — </strong>{notes}
                </figure>
              )}
            </div>

            {/* ══ FINANCIAL SUMMARY ══ */}
            <div className="d2-section">
              <SectionHead icon={<DollarSign size={15} />} title="Financial Summary" />
              <table className="d2-table">
                <thead>
                  <tr>
                    <th>Description</th>
                    <th className="num">Days</th>
                    <th className="num">Rate (ETB)</th>
                    <th className="num">Total (ETB)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>{carName} Rental Fee</td>
                    <td className="num">{totalDays}</td>
                    <td className="num">{fmt(dailyRate)}</td>
                    <td className="num">{fmt(dailyRate * totalDays)}</td>
                  </tr>
                  <tr>
                    <td>Subtotal</td>
                    <td className="num" colSpan="2"></td>
                    <td className="num">{fmt(subAmt)}</td>
                  </tr>
                  <tr>
                    <td>VAT Amount</td>
                    <td className="num" colSpan="2"></td>
                    <td className="num">{fmt(vatAmt)}</td>
                  </tr>
                  {extensionFee > 0 && (
                    <tr>
                      <td>Extension Fee</td>
                      <td className="num" colSpan="2"></td>
                      <td className="num">{fmt(extensionFee)}</td>
                    </tr>
                  )}
                  {damageFee > 0 && (
                    <tr>
                      <td>Damage Fee</td>
                      <td className="num" colSpan="2"></td>
                      <td className="num">{fmt(damageFee)}</td>
                    </tr>
                  )}
                  {fuelFee > 0 && (
                    <tr>
                      <td>Fuel Fee</td>
                      <td className="num" colSpan="2"></td>
                      <td className="num">{fmt(fuelFee)}</td>
                    </tr>
                  )}
                  {lateFee > 0 && (
                    <tr>
                      <td>Late Fee</td>
                      <td className="num" colSpan="2"></td>
                      <td className="num">{fmt(lateFee)}</td>
                    </tr>
                  )}
                  {refundAmt > 0 && (
                    <tr style={{ color: 'hsl(var(--danger))' }}>
                      <td>Refund Amount</td>
                      <td className="num" colSpan="2"></td>
                      <td className="num">-{fmt(refundAmt)}</td>
                    </tr>
                  )}
                  <tr className="d2-table__total">
                    <td colSpan="3">TOTAL AMOUNT DUE (incl. VAT)</td>
                    <td className="num">ETB {fmt(totalAmt)}</td>
                  </tr>
                </tbody>
              </table>
              <div className="d2-kv" style={{ marginTop: '0.75rem' }}>
                <Row label="Security Deposit" value={`ETB ${fmt(deposit)}`} />
                <Row label="Payment Method" value={payMethod} />
                <Row label="Payment Reference" value={paymentRef} accent />
                <Row label="Payment Status" value={PAY_STATUS_LABELS[order.paymentStatus] || order.paymentStatus} />
                {carCondition && (
                  <Row label="Return Inspection" value={carCondition === 'damaged' ? 'Damaged / Penalty' : 'Car fine'} accent={carCondition === 'damaged'} />
                )}
                {conditionReason && <Row label="Penalty Reason" value={conditionReason} />}
              </div>
              {payRejected && (
                <div style={{ marginTop: '0.85rem', padding: '0.85rem 1rem', borderRadius: 12, background: 'hsl(var(--danger-soft))', border: '1px solid hsl(var(--danger))' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800, color: 'hsl(var(--danger))' }}>
                    <Ban size={16} /> Payment Rejected by Finance
                  </div>
                  <div style={{ marginTop: 6, fontSize: '0.85rem', color: 'hsl(var(--fg))' }}>
                    Reason: <strong>{financeReason || 'No reason provided'}</strong>
                  </div>
                  <div style={{ marginTop: 6, fontSize: '0.78rem', color: 'hsl(var(--muted-strong))' }}>
                    Ask the customer to fix the details, or upload a corrected proof — it goes back to Finance for re-verification.
                  </div>
                </div>
              )}
              {proofUrl && (
                <div className="d2-proof">
                  <div className="d2-row__label" style={{ color: 'hsl(var(--muted-strong))' }}>Attached Payment Proof</div>
                  <img src={proofUrl} alt="Payment Proof" onError={e => { e.target.style.display = 'none'; }} />
                </div>
              )}
            </div>

            {/* ══ TIMELINE ══ */}
            <div className="d2-section">
              <SectionHead icon={<Clock size={15} />} title="Order Timeline" />
              <div className="d2-kv">
                <Row label="Order Created" value={fmtDT(createdOn)} />
                <Row label="Order Number" value={order.orderNumber} accent />
                {approvedOn && <Row label="Approved On" value={fmtDT(approvedOn)} />}
                {startedOn && <Row label="Rental Started" value={fmtDT(startedOn)} />}
                {returnedOn && <Row label="Returned On" value={fmtDT(returnedOn)} />}
                {cancelTime && <Row label="Cancelled On" value={fmtDT(cancelTime)} />}
              </div>
              {cancelReason && (
                <figure className="d2-quote" style={{ marginTop: '0.75rem', borderColor: 'hsl(var(--danger))', background: 'hsl(var(--danger-soft))' }}>
                  <strong style={{ color: 'hsl(var(--danger))' }}>Cancellation Reason — </strong>{cancelReason}
                </figure>
              )}
            </div>

            {/* ══ SIGNATURES ══ */}
            <div className="d2-section">
              <SectionHead icon={<FileText size={15} />} title="Authorization & Signatures" />
              <p className="d2-quote" style={{ marginBottom: '1.5rem' }}>
                By signing below, both parties confirm that all rental terms described in this contract have been agreed upon,
                and the vehicle referenced above will be / has been deployed for the agreed period.
              </p>
              <div className="d2-sigs">
                {[{ role: 'Client / Renter', name: customerName, title: 'Authorized Signatory' },
                  { role: 'Sutana Enterprise', name: 'Car Rental Manager', title: 'Vehicle Rental Division Representative' }].map(s => (
                  <div key={s.role}>
                    <div className="d2-sig__role">{s.role}</div>
                    <div className="d2-sig__line"></div>
                    <div className="d2-sig__name">{s.name}</div>
                    <div className="d2-sig__title">{s.title}</div>
                    <div className="d2-sig__title" style={{ marginTop: '0.25rem' }}>Date: ______________</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── SIDE PANEL: ACTIONS ── */}
        <div className="d2-side">
          <div className="d2-section">
            <SectionHead icon={<ListChecks size={15} />} title="Actions" />
            <div className="d2-panel__actions">
              {order.status === 'PENDING_APPROVAL' && (
                <button className="ro2-btn ro2-btn--success ro2-btn--block" disabled={actLoading === 'approve'} onClick={handleApprove}>
                  {actLoading === 'approve' ? <SegmentedSpinner size={13} /> : <BadgeCheck size={15} />} Approve Order
                </button>
              )}
              {startable && (
                <button className="ro2-btn ro2-btn--primary ro2-btn--block" disabled={actLoading === 'start' || !paid} onClick={() => openModal('start')}>
                  {actLoading === 'start' ? <SegmentedSpinner size={13} /> : <Play size={15} />} Start Rental
                </button>
              )}
              {order.status === 'ACTIVE' && (
                <button className="ro2-btn ro2-btn--success ro2-btn--block" disabled={actLoading === 'return'} onClick={() => openModal('return')}>
                  {actLoading === 'return' ? <SegmentedSpinner size={13} /> : <RotateCcw size={15} />} Complete & Release Car
                </button>
              )}
              {!isTerminal && (
                <button className="ro2-btn ro2-btn--danger ro2-btn--block" disabled={actLoading === 'cancel'} onClick={() => openModal('cancel')}>
                  {actLoading === 'cancel' ? <SegmentedSpinner size={13} /> : <Ban size={15} />} Cancel Order
                </button>
              )}
              {!isTerminal && (
                <button className="ro2-btn ro2-btn--outline ro2-btn--block" onClick={() => openModal('status')}>
                  <ListChecks size={15} /> Set Status
                </button>
              )}
            </div>
          </div>

          {isFinance && !paid && !isTerminal && (
            <div className="d2-section">
              <SectionHead icon={<DollarSign size={15} />} title="Payment Review" />
              <div className="d2-panel__actions">
                <button className="ro2-btn ro2-btn--success ro2-btn--block" disabled={actLoading === 'pay_confirm'} onClick={handleConfirmPayment}>
                  {actLoading === 'pay_confirm' ? <SegmentedSpinner size={13} /> : <BadgeCheck size={15} />} Confirm Payment
                </button>
                <button className="ro2-btn ro2-btn--danger ro2-btn--block" disabled={actLoading === 'pay_reject'} onClick={() => openModal('pay_reject')}>
                  {actLoading === 'pay_reject' ? <SegmentedSpinner size={13} /> : <Ban size={15} />} Reject Payment
                </button>
              </div>
            </div>
          )}

          {payRejected && (
            <div className="d2-section">
              <SectionHead icon={<Ban size={15} />} title="Rejected Payment" />
              {financeReason && <p className="ro2-hint">Finance reason: <strong>{financeReason}</strong></p>}
              <div className="d2-panel__actions">
                <button className="ro2-btn ro2-btn--primary ro2-btn--block" onClick={() => { setResubmitFile(null); setModal({ type: 'pay_resubmit' }); }}>
                  <RefreshCw size={15} /> Fix &amp; Resubmit Proof
                </button>
              </div>
            </div>
          )}

          {isTerminal && (
            <div className="d2-section">
              <SectionHead icon={<Archive size={15} />} title="History" />
              <div className="d2-panel__actions">
                <button className="ro2-btn ro2-btn--outline ro2-btn--block" disabled={actLoading === 'archive' || !!isManual} onClick={() => openModal('archive')}>
                  {actLoading === 'archive' ? <SegmentedSpinner size={13} /> : <Archive size={15} />} Move to History
                </button>
                {isManual && <p className="ro2-hint">Manual orders stay in the rental list.</p>}
                <div className="d2-panel__divider" />
                <button className="ro2-btn ro2-btn--danger ro2-btn--block" disabled={actLoading === 'delete'} onClick={() => openModal('delete')}>
                  {actLoading === 'delete' ? <SegmentedSpinner size={13} /> : <Trash2 size={15} />} Delete Order
                </button>
              </div>
            </div>
          )}

          <div className="d2-section">
            <SectionHead icon={<FileText size={15} />} title="Reference" />
            <p className="ro2-meta" style={{ gap: '0.375rem' }}><Hash size={13} /> {order.orderNumber}</p>
            <p className="ro2-meta"><Calendar size={13} /> Issued: {fmtDT(createdOn)}</p>
            <p className="ro2-meta"><FileText size={13} /> Type: Car Rental{isManual ? ' · Manual' : ''}</p>
            <p className="ro2-meta" style={{ color: 'hsl(var(--primary-strong))' }}><Download size={13} /> Use "Print Contract" for PDF</p>
          </div>
        </div>
      </div>

      {/* ══ MODALS ══ */}
      {modal?.type === 'cancel' && (
        <ActionModal title="Cancel Order" icon={<Ban size={15} />} confirmLabel="Confirm Cancel"
          confirmDisabled={!form.reason.trim()} loading={actLoading === 'cancel'} onConfirm={handleConfirm} onClose={() => setModal(null)}>
          <div className="ro2-field">
            <label className="ro2-label">Reason (required)</label>
            <textarea className="ro2-textarea" rows="4" autoFocus placeholder="e.g. Customer no-show, duplicate booking, vehicle issue..."
              value={form.reason} onChange={e => setForm(p => ({ ...p, reason: e.target.value }))} />
          </div>
        </ActionModal>
      )}

      {modal?.type === 'start' && (
        <ActionModal title="Start Rental" icon={<Play size={15} />} confirmLabel="Start Rental"
          loading={actLoading === 'start'} onConfirm={handleConfirm} onClose={() => setModal(null)}>
          <p>Confirm the rental is starting now. {carName} will be marked as <strong>Booked</strong> and the day counter begins.</p>
          <div className="ro2-field">
            <label className="ro2-label">Start Note (optional)</label>
            <textarea className="ro2-textarea" rows="3" placeholder="e.g. Handover odometer reading, keys handed, inspection ok..."
              value={form.startNote} onChange={e => setForm(p => ({ ...p, startNote: e.target.value }))} />
          </div>
        </ActionModal>
      )}

      {modal?.type === 'return' && (
        <ActionModal title="Complete & Release Car" icon={<RotateCcw size={15} />} confirmLabel="Complete Return"
          confirmDisabled={!returnValid} loading={actLoading === 'return'} onConfirm={handleConfirm} onClose={() => setModal(null)}>
          <p>Record the vehicle inspection before releasing the car. It will be marked <strong>Available</strong>.</p>
          <div className="ro2-field">
            <label className="ro2-label">Vehicle Condition (required)</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="button" className={`ro2-btn ${form.carCondition === 'fine' ? 'ro2-btn--primary' : 'ro2-btn--ghost'}`} style={{ flex: 1, justifyContent: 'center' }} onClick={() => setCondition('fine')}>
                <CheckCircle2 size={14} /> Car is fine
              </button>
              <button type="button" className={`ro2-btn ${form.carCondition === 'damaged' ? 'ro2-btn--primary' : 'ro2-btn--ghost'}`} style={{ flex: 1, justifyContent: 'center' }} onClick={() => setCondition('damaged')}>
                <AlertTriangle size={14} /> Damaged / Penalty
              </button>
            </div>
          </div>
          {form.carCondition === 'damaged' && (
            <>
              <div className="ro2-field">
                <label className="ro2-label">Reason for penalty (required)</label>
                <textarea className="ro2-textarea" rows="2" placeholder="Describe the damage / issue..."
                  value={form.conditionReason} onChange={e => setForm(p => ({ ...p, conditionReason: e.target.value }))} />
              </div>
              <div className="ro2-field">
                <label className="ro2-label">Penalty — deducted from deposit (ETB, required)</label>
                <input className="ro2-input" type="number" min="0" placeholder="0"
                  value={form.damageFee} onChange={e => setForm(p => ({ ...p, damageFee: e.target.value }))} />
              </div>
            </>
          )}
          <div className="ro2-field">
            <label className="ro2-label">Odometer Reading (km)</label>
            <input className="ro2-input" type="number" min="0" placeholder="e.g. 45230"
              value={form.odometer} onChange={e => setForm(p => ({ ...p, odometer: e.target.value }))} />
          </div>
          <div className="ro2-field">
            <label className="ro2-label">Fuel Fee (ETB)</label>
            <input className="ro2-input" type="number" min="0" placeholder="0"
              value={form.fuelFee} onChange={e => setForm(p => ({ ...p, fuelFee: e.target.value }))} />
          </div>
          <div className="ro2-field">
            <label className="ro2-label">Late Return Fee (ETB)</label>
            <input className="ro2-input" type="number" min="0" placeholder="0"
              value={form.lateFee} onChange={e => setForm(p => ({ ...p, lateFee: e.target.value }))} />
          </div>
          <div className="ro2-field">
            <label className="ro2-label">Return Notes (optional)</label>
            <textarea className="ro2-textarea" rows="2" placeholder="Fuel level, additional condition notes..."
              value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
          </div>
          <div className="ro2-field" style={{ background: 'rgba(0,0,0,0.03)', borderRadius: 8, padding: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Security Deposit</span><strong>{fmt(deposit)} ETB</strong></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Total Deduction</span><strong>− {fmt(deductionPreview)} ETB</strong></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem' }}>
              <span>{deductionPreview > deposit ? 'Additional Owed' : 'Refund to Customer'}</span>
              <strong>{fmt(deductionPreview > deposit ? deductionPreview - deposit : refundPreview)} ETB</strong>
            </div>
          </div>
        </ActionModal>
      )}

      {modal?.type === 'status' && (
        <ActionModal title="Set Order Status" icon={<ListChecks size={15} />} confirmLabel="Update Status"
          confirmDisabled={!form.status} loading={actLoading === 'status'} onConfirm={handleConfirm} onClose={() => setModal(null)}>
          <div className="ro2-field">
            <label className="ro2-label">New Status (required)</label>
            <select className="ro2-select" style={{ width: '100%' }} value={form.status}
              onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
              <option value="">Select status...</option>
              {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          {form.status === 'ACTIVE' && <p className="ro2-hint">You can use the dedicated "Start Rental" action to also stamp the start time and book the car.</p>}
          <div className="ro2-field">
            <label className="ro2-label">Note (optional)</label>
            <textarea className="ro2-textarea" rows="2" placeholder="Reason for the change..."
              value={form.statusNote} onChange={e => setForm(p => ({ ...p, statusNote: e.target.value }))} />
          </div>
        </ActionModal>
      )}

      {modal?.type === 'archive' && (
        <ActionModal title="Move to History" icon={<Archive size={15} />} confirmLabel="Move to History"
          loading={actLoading === 'archive'} onConfirm={handleConfirm} onClose={() => setModal(null)}>
          <p>Move <strong>{order.orderNumber}</strong> to the history archive? It can be restored from the History page.</p>
        </ActionModal>
      )}

      {modal?.type === 'delete' && (
        <ActionModal title="Delete Order" icon={<Trash2 size={15} />} confirmLabel="Delete Permanently"
          loading={actLoading === 'delete'} onConfirm={handleConfirm} onClose={() => setModal(null)}>
          <p style={{ color: 'hsl(var(--danger))' }}>This will permanently remove <strong>{order.orderNumber}</strong>. This cannot be undone.</p>
        </ActionModal>
      )}

      {modal?.type === 'pay_reject' && (
        <ActionModal title="Reject Payment" icon={<Ban size={15} />} confirmLabel="Reject Payment"
          confirmDisabled={!form.reason.trim()} loading={actLoading === 'pay_reject'} onConfirm={handleRejectPayment} onClose={() => setModal(null)}>
          <div className="ro2-field">
            <label className="ro2-label">Reason (required)</label>
            <textarea className="ro2-textarea" rows="3" autoFocus placeholder="e.g. Screenshot invalid, amount mismatch, wrong reference..."
              value={form.reason} onChange={e => setForm(p => ({ ...p, reason: e.target.value }))} />
          </div>
        </ActionModal>
      )}

      {modal?.type === 'pay_resubmit' && (
        <ActionModal title="Resubmit Payment Proof" icon={<RefreshCw size={15} />} confirmLabel="Resubmit to Finance"
          confirmDisabled={!resubmitFile} loading={actLoading === 'pay_resubmit'} onConfirm={handleResubmitProof} onClose={() => setModal(null)}>
          <p>Upload a corrected payment proof for <strong>{order.orderNumber}</strong>. It is sent to Finance for re-verification.</p>
          <div className="ro2-field">
            <label className="ro2-label">Payment Proof Image (required)</label>
            <input className="ro2-input" type="file" accept="image/*" onChange={e => setResubmitFile(e.target.files?.[0] || null)} />
          </div>
        </ActionModal>
      )}
    </div>
  );
};

export default CarRentalOrderDetail;