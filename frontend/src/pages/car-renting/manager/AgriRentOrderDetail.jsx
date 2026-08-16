import React, { useState, useEffect, useRef } from 'react';
import axios from '../../../services/apiClient';
import authService from '../../../services/authService';
import {
  ArrowLeft, Printer, RefreshCw, Tractor, User, Calendar,
  MapPin, DollarSign, CheckCircle, Clock, XCircle, FileText,
  Phone, Mail, Hash, Leaf, AlertTriangle, Package, Star, Banknote
} from 'lucide-react';
import SegmentedSpinner from '../../../components/ui/SegmentedSpinner';

/* ─────────────── COLOR TOKENS ─────────────── */
const C = {
  darkGreen:    '#1B5E20',
  forestGreen:  '#228B22',
  emerald:      '#2E8B57',
  leafGreen:    '#4CAF50',
  sage:         '#A5D6A7',
  earthBrown:   '#8D6E63',
  lightSage:    '#E8F5E9',
  white:        '#FFFFFF',
  offWhite:     '#FAFAF8',
  lightGray:    '#F5F5F5',
  midGray:      '#E0E0E0',
  darkGray:     '#424242',
  textSec:      '#616161',
  orange:       '#FF9800',
  red:          '#C62828',
  blue:         '#1565C0',
};

/* ─────────────── HELPERS ─────────────── */
const fmt = (n) => parseFloat(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
};
const fmtDateTime = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const STATUS_CFG = {
  pending:   { bg: '#FFF3E0', color: '#E65100', border: '#FFCC80', label: 'PENDING APPROVAL' },
  approved:  { bg: '#E8F5E9', color: '#2E7D32', border: '#A5D6A7', label: 'APPROVED' },
  confirmed: { bg: '#E8F5E9', color: '#1B5E20', border: '#81C784', label: 'CONFIRMED' },
  active:    { bg: '#E3F2FD', color: '#0D47A1', border: '#90CAF9', label: 'ACTIVE' },
  completed: { bg: '#F3E5F5', color: '#4A148C', border: '#CE93D8', label: 'COMPLETED' },
  cancelled: { bg: '#FFEBEE', color: '#B71C1C', border: '#EF9A9A', label: 'CANCELLED' },
};

const PAY_CFG = {
  Pending:   { bg: '#FFF3E0', color: '#E65100', border: '#FFCC80', label: 'AWAITING PAYMENT', Icon: Clock },
  Confirmed: { bg: '#E8F5E9', color: '#2E7D32', border: '#A5D6A7', label: 'PAYMENT CONFIRMED', Icon: CheckCircle },
  Rejected:  { bg: '#FFEBEE', color: '#B71C1C', border: '#EF9A9A', label: 'PAYMENT REJECTED', Icon: XCircle },
};

/* ─────────────── TOAST ─────────────── */
const useToasts = () => {
  const [toasts, setToasts] = useState([]);
  const toast = (message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts(p => [...p, { id, message, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4000);
  };
  const remove = id => setToasts(p => p.filter(t => t.id !== id));
  return { toasts, toast, remove };
};

const ToastContainer = ({ toasts, remove }) => (
  <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 10 }}>
    {toasts.map(t => (
      <div key={t.id} style={{ background: t.type === 'success' ? '#4CAF50' : t.type === 'error' ? '#F44336' : '#1B5E20', color: '#fff', padding: '12px 18px', boxShadow: '4px 4px 0px rgba(0,0,0,0.25)', fontSize: 13, fontWeight: 600, minWidth: 240, maxWidth: 340, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <span>{t.message}</span>
        <button onClick={() => remove(t.id)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 16 }}>×</button>
      </div>
    ))}
  </div>
);

/* ─────────────── SECTION HEADER ─────────────── */
const SectionHeader = ({ icon, title, accent = C.darkGreen }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 10,
    borderBottom: `2px solid ${accent}`,
    paddingBottom: 10, marginBottom: 18,
  }}>
    <div style={{
      background: accent, color: '#fff',
      width: 30, height: 30,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    }}>
      {icon}
    </div>
    <h3 style={{ margin: 0, fontSize: 13, fontWeight: 800, color: accent, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
      {title}
    </h3>
  </div>
);

/* ─────────────── DATA ROW ─────────────── */
const DataRow = ({ label, value, highlight = false, accent = false }) => (
  <div style={{
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
    padding: '9px 12px',
    background: highlight ? '#F0FDF4' : 'transparent',
    borderBottom: `1px solid ${C.midGray}`,
    gap: 16,
  }}>
    <span style={{ fontSize: 12, fontWeight: 600, color: C.textSec, textTransform: 'uppercase', letterSpacing: '0.04em', flexShrink: 0 }}>
      {label}
    </span>
    <span style={{ fontSize: 13, fontWeight: highlight ? 800 : 600, color: accent ? C.darkGreen : C.darkGray, textAlign: 'right', wordBreak: 'break-word' }}>
      {value || '—'}
    </span>
  </div>
);

/* ─────────────── INFO CARD ─────────────── */
const InfoCard = ({ label, value, icon, accent = C.darkGreen, large = false }) => (
  <div style={{
    background: C.lightGray,
    border: `1.5px solid ${C.midGray}`,
    borderLeft: `4px solid ${accent}`,
    padding: '12px 16px',
    flex: '1 1 150px',
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5, color: C.textSec, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
      {icon} {label}
    </div>
    <div style={{ fontSize: large ? 20 : 14, fontWeight: 900, color: accent, wordBreak: 'break-word' }}>
      {value || '—'}
    </div>
  </div>
);

/* ─────────────── REASON MODAL ─────────────── */
const ReasonModal = ({ title, placeholder, onConfirm, onClose }) => {
  const [value, setValue] = useState('');
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 12, padding: '32px 36px', maxWidth: 440, width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.25)', fontFamily: '"Inter", sans-serif' }}>
        <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 800, color: C.darkGray }}>{title}</h3>
        <textarea
          autoFocus
          value={value}
          onChange={e => setValue(e.target.value)}
          placeholder={placeholder || 'Enter reason...'}
          rows={4}
          style={{ width: '100%', padding: '10px 14px', fontSize: 13, border: `1.5px solid ${C.midGray}`, borderRadius: 8, resize: 'vertical', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
          <button onClick={onClose} style={{ padding: '9px 20px', border: `1px solid ${C.midGray}`, background: '#fff', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer', color: C.darkGray }}>Cancel</button>
          <button
            onClick={() => { if (value.trim()) { onConfirm(value.trim()); } }}
            disabled={!value.trim()}
            style={{ padding: '9px 24px', background: value.trim() ? C.darkGreen : C.midGray, color: value.trim() ? '#fff' : '#9E9E9E', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: value.trim() ? 'pointer' : 'not-allowed' }}
          >Confirm</button>
        </div>
      </div>
    </div>
  );
};

/* ─────────────── MAIN COMPONENT ─────────────── */
const AgriRentOrderDetail = ({ orderId, onBack }) => {
  const printRef = useRef();

  const [order, setOrder]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [actLoading, setActLoading] = useState('');
  const { toasts, toast, remove } = useToasts();
  const [modal, setModal]     = useState(null); // { title, placeholder, onConfirm }

  /* ── Role check ── */
  const user      = authService.getUser?.() || authService.getCurrentUser?.() || {};
  const userRoles = user.roles || (user.role ? [user.role] : []);
  const isFinance = userRoles.some(r => ['Finance', 'Finance Manager', 'Admin', 'CEO'].includes(r));

  const load = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await axios.get(`/agrirent-orders/${orderId}`);
      const data = res.data || res;
      setOrder(data);
    } catch (e) {
      setError(e.message || 'Failed to load order.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [orderId]);

  /* ── Generic action runner ── */
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

  /* ── Action handlers ── */
  const handleApprove  = () => doAction('approve',  () => axios.patch(`/agrirent-orders/${orderId}/status`,         { status: 'approved' }),  'Order approved successfully.');
  const handleActivate = () => doAction('activate', () => axios.patch(`/agrirent-orders/${orderId}/status`,         { status: 'active' }),    'Order activated — tractor is now rented.');
  const handleComplete = () => doAction('complete', () => axios.patch(`/agrirent-orders/${orderId}/status`,         { status: 'completed' }), 'Order marked as completed.');
  const handleCancel   = () => {
    setModal({
      title: '✕ Cancel Order — Enter Reason',
      placeholder: 'e.g. Customer no-show, duplicate booking, tractor issue...',
      onConfirm: (reason) => {
        setModal(null);
        doAction('cancel', () => axios.patch(`/agrirent-orders/${orderId}/status`, { status: 'cancelled', managerNote: reason }), 'Order cancelled.');
      }
    });
  };
  const handleConfirmPayment = () => doAction('pay_confirm', () => axios.post(`/agrirent-orders/${orderId}/verify-payment`, { isVerified: true, verifiedAmount: order.total_amount, notes: 'Confirmed from detail page' }), 'Payment confirmed.');
  const handleRejectPayment  = () => {
    setModal({
      title: '✕ Reject Payment — Enter Reason',
      placeholder: 'e.g. Screenshot invalid, amount mismatch, wrong reference...',
      onConfirm: (notes) => {
        setModal(null);
        doAction('pay_reject', () => axios.post(`/agrirent-orders/${orderId}/verify-payment`, { isVerified: false, notes }), 'Payment rejected.');
      }
    });
  };

  const handlePrint = () => {
    if (!printRef.current) return;
    const w = window.open('', '_blank');
    w.document.write(`
      <html>
        <head>
          <title>AgriRent Order - ${order?.order_number || orderId}</title>
          <style>
            @page { margin: 15mm; size: A4; }
            * { box-sizing: border-box; }
            body { font-family: 'Times New Roman', serif; color: #000; margin: 0; background: #fff; }
            h1,h2,h3,h4 { margin: 0; }
            table { width: 100%; border-collapse: collapse; }
            th { background: #1B5E20; color: #fff; padding: 8px 12px; font-size: 11px; text-align: left; text-transform: uppercase; letter-spacing: 0.05em; }
            td { border: 1px solid #ccc; padding: 8px 12px; font-size: 12px; }
            .badge { display: inline-block; padding: 3px 10px; font-size: 10px; font-weight: 700; border: 1.5px solid; }
            .section { margin-bottom: 24px; }
            .section-title { font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: #1B5E20; border-bottom: 2px solid #1B5E20; padding-bottom: 6px; margin-bottom: 12px; }
            .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
            .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
            .info-card { border: 1.5px solid #ccc; border-left: 4px solid #1B5E20; padding: 10px 14px; }
            .info-label { font-size: 9px; font-weight: 700; text-transform: uppercase; color: #616161; margin-bottom: 3px; }
            .info-value { font-size: 14px; font-weight: 900; color: #1B5E20; }
            .watermark { position: fixed; top: 50%; left: 50%; transform: translate(-50%,-50%) rotate(-30deg); font-size: 80px; color: rgba(27,94,32,0.06); font-weight: 900; pointer-events: none; z-index: 0; white-space: nowrap; }
            .separator { border: none; border-top: 1.5px solid #ccc; margin: 20px 0; }
            .sig-block { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 40px; }
            .sig-line { border-top: 1.5px solid #000; padding-top: 6px; font-size: 10px; color: #424242; }
            .footer-bar { border-top: 2px solid #1B5E20; padding-top: 12px; font-size: 9px; color: #616161; text-align: center; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="watermark">SUTANA ENTERPRISE</div>
          ${printRef.current.innerHTML}
        </body>
      </html>
    `);
    w.document.close();
    setTimeout(() => w.print(), 400);
  };

  /* ─── Loading ─── */
  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 16, fontFamily: '"Inter", sans-serif' }}>
      <SegmentedSpinner size={32} />
      <span style={{ color: C.textSec, fontWeight: 600 }}>Loading order details...</span>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  /* ─── Error ─── */
  if (error || !order) return (
    <div style={{ padding: 40, fontFamily: '"Inter", sans-serif', textAlign: 'center' }}>
      <AlertTriangle size={40} color={C.red} style={{ marginBottom: 12 }} />
      <p style={{ color: C.red, fontWeight: 700, fontSize: 16 }}>{error || 'Order not found.'}</p>
      <button onClick={onBack} style={{
        marginTop: 16, padding: '10px 24px', background: C.darkGreen, color: '#fff',
        border: 'none', fontWeight: 700, cursor: 'pointer', fontSize: 13,
      }}>
        ← Back to Orders
      </button>
    </div>
  );

  const statusCfg  = STATUS_CFG[order.status] || { bg: '#F5F5F5', color: C.darkGray, border: C.midGray, label: (order.status || '').toUpperCase() };
  const payCfg     = PAY_CFG[order.payment_status] || PAY_CFG.Pending;
  const PayIcon    = payCfg.Icon;
  const dailyRate  = parseFloat(order.daily_rate || 0);
  const totalDays  = parseInt(order.total_days || 0);
  const totalAmount = parseFloat(order.total_amount || 0);
  const vatAmt      = parseFloat(order.vat_amount || 0);
  const subAmt      = parseFloat(order.subtotal) || Math.max(0, totalAmount - vatAmt);
  const isPaid     = ['Confirmed', 'PAID', 'PAYMENT_VERIFIED'].includes(order.payment_status);

  /* ── Action button component ── */
  const Btn = ({ id, label, onClick, bg, border, disabled }) => (
    <button
      onClick={onClick}
      disabled={disabled || actLoading === id}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 7,
        padding: '9px 18px',
        background: disabled || actLoading === id ? '#E0E0E0' : bg,
        color: disabled || actLoading === id ? '#9E9E9E' : '#fff',
        border: `1px solid ${disabled || actLoading === id ? '#BDBDBD' : border}`,
        fontWeight: 700, fontSize: 12,
        cursor: disabled || actLoading === id ? 'not-allowed' : 'pointer',
        boxShadow: disabled || actLoading === id ? 'none' : `0 3px 0 ${border}`,
        transition: 'all 0.12s',
      }}
      onMouseDown={e => { if (!disabled && actLoading !== id) { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(3px)'; } }}
      onMouseUp={e   => { if (!disabled && actLoading !== id) { e.currentTarget.style.boxShadow = `0 3px 0 ${border}`; e.currentTarget.style.transform = 'translateY(0)'; } }}
    >
      {actLoading === id ? <SegmentedSpinner size={13} /> : null}
      {label}
    </button>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#F0F0F0', fontFamily: '"Inter", system-ui, sans-serif', color: C.darkGray }}>
      <ToastContainer toasts={toasts} remove={remove} />
      {modal && <ReasonModal title={modal.title} placeholder={modal.placeholder} onConfirm={modal.onConfirm} onClose={() => setModal(null)} />}

      {/* ── TOP BAR ── */}
      <div style={{ background: C.darkGreen, padding: '0 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: 64, borderBottom: `3px solid ${C.earthBrown}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button
            onClick={onBack}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 16px', background: 'rgba(255,255,255,0.12)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)', fontWeight: 700, fontSize: 13, cursor: 'pointer', boxShadow: '0 3px 0 rgba(0,0,0,0.3)', transition: 'all 0.12s' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.22)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; }}
          >
            <ArrowLeft size={15} /> Back to Orders
          </button>
          <div>
            <div style={{ color: '#fff', fontWeight: 800, fontSize: 18, letterSpacing: '-0.01em' }}>Order Detail</div>
            <div style={{ color: C.sage, fontSize: 12, fontWeight: 500 }}>AgriRent Rental Contract</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={load}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 16px', background: 'rgba(255,255,255,0.12)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)', fontWeight: 700, fontSize: 13, cursor: 'pointer', boxShadow: '0 3px 0 rgba(0,0,0,0.3)' }}
          >
            <RefreshCw size={14} /> Refresh
          </button>
          <button
            onClick={handlePrint}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 20px', background: C.forestGreen, color: '#fff', border: `1px solid ${C.darkGreen}`, fontWeight: 700, fontSize: 13, cursor: 'pointer', boxShadow: `0 4px 0 ${C.darkGreen}` }}
            onMouseEnter={e => { e.currentTarget.style.background = C.emerald; }}
            onMouseLeave={e => { e.currentTarget.style.background = C.forestGreen; }}
          >
            <Printer size={15} /> Print Contract
          </button>
        </div>
      </div>

      {/* ── ACTION BAR ── */}
      <div style={{ background: '#fff', borderBottom: `1px solid ${C.midGray}`, padding: '12px 32px', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: C.textSec, textTransform: 'uppercase', letterSpacing: '0.05em', marginRight: 4 }}>Actions:</span>

        {/* Manager workflow — gated on payment */}
        {order.status === 'pending'   && <Btn id="approve"  label="✓ Approve"          onClick={handleApprove}  bg="#2E7D32" border="#1B5E20" disabled={!isPaid} />}
        {order.status === 'approved'  && <Btn id="activate" label="▶ Activate Rental"   onClick={handleActivate} bg="#0D47A1" border="#0a3370" disabled={!isPaid} />}
        {order.status === 'active'    && <Btn id="complete" label="✓ Mark Completed"    onClick={handleComplete} bg="#4A148C" border="#38006b" disabled={!isPaid} />}
        {!['completed','cancelled'].includes(order.status) && <Btn id="cancel" label="✕ Cancel Order" onClick={handleCancel} bg="#B71C1C" border="#880e0e" />}

        {/* Finance-only payment actions — shown only to Finance/Admin roles */}
        {isFinance && !isPaid && !['cancelled','completed'].includes(order.status) && (
          <>
            <span style={{ width: 1, height: 24, background: C.midGray, margin: '0 4px' }} />
            <Btn id="pay_confirm" label="💳 Confirm Payment" onClick={handleConfirmPayment} bg="#2E8B57" border="#1B5E20" />
            <Btn id="pay_reject"  label="✕ Reject Payment"  onClick={handleRejectPayment}  bg="#C62828" border="#880e0e" />
          </>
        )}

        {/* Hint when gated */}
        {!isPaid && ['pending','approved'].includes(order.status) && (
          <span style={{ fontSize: 11, color: C.orange, fontWeight: 700, marginLeft: 8 }}>⚠ Awaiting payment confirmation before order can progress</span>
        )}
      </div>

      {/* ── MAIN PRINTABLE AREA ── */}
      <div style={{ maxWidth: 960, margin: '32px auto', padding: '0 20px 60px' }}>
        <div ref={printRef}>

          {/* ══════════════════════════════════════════
              PAPER CONTRACT HEADER
          ══════════════════════════════════════════ */}
          <div style={{ background: C.white, border: `1.5px solid ${C.midGray}`, marginBottom: 4, padding: '36px 44px 28px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            {/* Letterhead */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: `3px double ${C.darkGreen}`, paddingBottom: 22, marginBottom: 24 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <Leaf size={28} color={C.forestGreen} />
                  <h1 style={{ fontSize: 28, fontWeight: 900, color: C.darkGreen, letterSpacing: '-0.5px', textTransform: 'uppercase' }}>
                    SUTANA Enterprise
                  </h1>
                </div>
                <p style={{ margin: 0, color: C.textSec, fontSize: 13 }}>Agricultural Machinery Rental Division</p>
                <p style={{ margin: '2px 0 0', color: C.textSec, fontSize: 12 }}>Integrated Business Management System</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: 'monospace', fontSize: 22, fontWeight: 900, color: C.darkGreen, letterSpacing: 2 }}>
                  {order.order_number}
                </div>
                <div style={{ fontSize: 11, color: C.textSec, marginTop: 3, textTransform: 'uppercase', letterSpacing: 1 }}>
                  Rental Contract
                </div>
                <div style={{ fontSize: 11, color: C.textSec, marginTop: 2 }}>
                  Issued: {fmtDateTime(order.created_at)}
                </div>
              </div>
            </div>

            {/* Document Title */}
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <h2 style={{ fontSize: 14, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 2.5, color: C.darkGreen, margin: '0 0 6px', borderBottom: `1px solid ${C.sage}`, paddingBottom: 10, display: 'inline-block', paddingLeft: 24, paddingRight: 24 }}>
                Agricultural Machinery Rental Agreement
              </h2>
            </div>

            {/* Status Banner */}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '8px 18px',
                background: statusCfg.bg, color: statusCfg.color,
                border: `2px solid ${statusCfg.border}`,
                fontWeight: 800, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1,
              }}>
                <span style={{ width: 8, height: 8, background: statusCfg.color, display: 'inline-block', flexShrink: 0 }} />
                Order Status: {statusCfg.label}
              </div>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '8px 18px',
                background: payCfg.bg, color: payCfg.color,
                border: `2px solid ${payCfg.border}`,
                fontWeight: 800, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1,
              }}>
                <PayIcon size={13} />
                {payCfg.label}
              </div>
              {order.is_manual && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 18px', background: '#E3F2FD', color: '#1565C0', border: '2px solid #90CAF9', fontWeight: 800, fontSize: 12, letterSpacing: 1 }}>
                  MANUAL ENTRY
                </div>
              )}
            </div>

            {/* Key Stats Grid */}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <InfoCard label="Total Amount" value={`ETB ${fmt(totalAmount)}`} icon={<DollarSign size={11} />} accent={C.darkGreen} large />
              <InfoCard label="VAT Amount" value={`ETB ${fmt(vatAmt)}`} icon={<Banknote size={11} />} accent={C.earthBrown} />
              <InfoCard label="Rental Days" value={`${totalDays} days`} icon={<Calendar size={11} />} accent={C.emerald} />
              <InfoCard label="Daily Rate" value={`ETB ${fmt(dailyRate)} / day`} icon={<Star size={11} />} accent={C.forestGreen} />
              <InfoCard label="Payment Method" value={order.payment_method} icon={<Package size={11} />} accent={C.earthBrown} />
            </div>
          </div>

          {/* ══════════════════════════════════════════
              SECTION 1: CUSTOMER INFORMATION
          ══════════════════════════════════════════ */}
          <div style={{ background: C.white, border: `1.5px solid ${C.midGray}`, borderTop: 'none', padding: '28px 44px', marginBottom: 4 }}>
            <SectionHeader icon={<User size={15} />} title="Customer / Client Information" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
              <DataRow label="Full Name" value={order.customer_name} accent />
              <DataRow label="Phone Number" value={order.customer_phone} />
              <DataRow label="Email Address" value={order.customer_email} />
              <DataRow label="Customer ID" value={order.customer_id ? `#${order.customer_id}` : 'Walk-In / Manual'} />
            </div>
          </div>

          {/* ══════════════════════════════════════════
              SECTION 2: MACHINERY / TRACTOR DETAILS
          ══════════════════════════════════════════ */}
          <div style={{ background: C.white, border: `1.5px solid ${C.midGray}`, borderTop: 'none', padding: '28px 44px', marginBottom: 4 }}>
            <SectionHeader icon={<Tractor size={15} />} title="Hired Machinery Details" accent={C.emerald} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
              <DataRow label="Machine Name" value={order.tractor_name || 'Not Assigned'} accent />
              <DataRow label="Machine Type" value={order.tractor_type_label} />
              <DataRow label="Transmission" value={order.tractor_id ? 'Manual' : '—'} />
              <DataRow label="Fuel Type" value={order.tractor_id ? 'Diesel' : '—'} />
              <DataRow label="Machine ID" value={order.tractor_id ? `#${order.tractor_id}` : '—'} />
            </div>
          </div>

          {/* ══════════════════════════════════════════
              SECTION 3: RENTAL PERIOD & FIELD INFO
          ══════════════════════════════════════════ */}
          <div style={{ background: C.white, border: `1.5px solid ${C.midGray}`, borderTop: 'none', padding: '28px 44px', marginBottom: 4 }}>
            <SectionHeader icon={<Calendar size={15} />} title="Rental Period & Field Information" accent={C.forestGreen} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
              <DataRow label="Start Date" value={fmtDate(order.start_date)} accent />
              <DataRow label="End Date" value={fmtDate(order.end_date)} accent />
              <DataRow label="Total Duration" value={`${totalDays} day${totalDays !== 1 ? 's' : ''}`} highlight />
              <DataRow label="Field Location" value={order.field_location} />
              <DataRow label="Field Size" value={order.field_size_hectares ? `${order.field_size_hectares} Hectares` : '—'} />
              <DataRow label="Farming Purpose" value={order.farming_purpose} />
              {order.special_instructions && (
                <div style={{ gridColumn: '1 / -1', padding: '12px 12px', borderBottom: `1px solid ${C.midGray}` }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: C.textSec, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 5 }}>Special Instructions</div>
                  <div style={{ fontSize: 13, color: C.darkGray, lineHeight: 1.6, fontStyle: 'italic' }}>{order.special_instructions}</div>
                </div>
              )}
            </div>
          </div>

          {/* ══════════════════════════════════════════
              SECTION 4: FINANCIAL SUMMARY
          ══════════════════════════════════════════ */}
          <div style={{ background: C.white, border: `1.5px solid ${C.midGray}`, borderTop: 'none', padding: '28px 44px', marginBottom: 4 }}>
            <SectionHeader icon={<DollarSign size={15} />} title="Financial Summary" accent={C.darkGreen} />

            {/* Calculation Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 20 }}>
              <thead>
                <tr style={{ background: C.darkGreen }}>
                  {['Description', 'Quantity / Days', 'Unit Rate (ETB)', 'Total (ETB)'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: h === 'Description' ? 'left' : 'right', fontSize: 11, fontWeight: 700, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: '12px 14px', borderBottom: `1px solid ${C.midGray}`, fontSize: 13, fontWeight: 600, color: C.darkGray }}>
                    {order.tractor_name || 'Machinery'} Rental Fee
                  </td>
                  <td style={{ padding: '12px 14px', borderBottom: `1px solid ${C.midGray}`, textAlign: 'right', fontSize: 13 }}>
                    {totalDays} days
                  </td>
                  <td style={{ padding: '12px 14px', borderBottom: `1px solid ${C.midGray}`, textAlign: 'right', fontSize: 13 }}>
                    {fmt(dailyRate)}
                  </td>
                  <td style={{ padding: '12px 14px', borderBottom: `1px solid ${C.midGray}`, textAlign: 'right', fontSize: 13, fontWeight: 700 }}>
                    {fmt(dailyRate * totalDays)}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '12px 14px', borderBottom: `1px solid ${C.midGray}`, fontSize: 13, fontWeight: 600, color: C.darkGray }}>
                    Subtotal
                  </td>
                  <td colSpan={2} style={{ padding: '12px 14px', borderBottom: `1px solid ${C.midGray}`, textAlign: 'right', fontSize: 13 }} />
                  <td style={{ padding: '12px 14px', borderBottom: `1px solid ${C.midGray}`, textAlign: 'right', fontSize: 13, fontWeight: 700 }}>
                    {fmt(subAmt)}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '12px 14px', borderBottom: `1px solid ${C.midGray}`, fontSize: 13, fontWeight: 600, color: C.darkGray }}>
                    VAT Amount
                  </td>
                  <td colSpan={2} style={{ padding: '12px 14px', borderBottom: `1px solid ${C.midGray}`, textAlign: 'right', fontSize: 13 }} />
                  <td style={{ padding: '12px 14px', borderBottom: `1px solid ${C.midGray}`, textAlign: 'right', fontSize: 13, fontWeight: 700 }}>
                    {fmt(vatAmt)}
                  </td>
                </tr>
                <tr style={{ background: C.lightSage }}>
                  <td colSpan={3} style={{ padding: '14px', textAlign: 'right', fontWeight: 900, fontSize: 14, color: C.darkGreen }}>
                    TOTAL AMOUNT DUE (incl. VAT)
                  </td>
                  <td style={{ padding: '14px', textAlign: 'right', fontWeight: 900, fontSize: 18, color: C.darkGreen }}>
                    ETB {fmt(totalAmount)}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Payment Info */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0, border: `1px solid ${C.midGray}` }}>
              <DataRow label="Payment Method" value={order.payment_method} />
              <DataRow label="Payment Status" value={payCfg.label} />
              <DataRow label="Payment Reference" value={order.payment_reference} accent />
              <DataRow label="Finance Verified By" value={order.created_by_name || '—'} />
            </div>

            {/* Payment Screenshot */}
            {order.payment_screenshot && (
              <div style={{ marginTop: 20, padding: 16, border: `1.5px solid ${C.sage}`, background: C.lightSage }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.textSec, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
                  Attached Payment Proof
                </div>
                <img
                  src={`http://localhost:5000/${order.payment_screenshot}`}
                  alt="Payment Screenshot"
                  style={{ maxWidth: '100%', maxHeight: 360, border: `2px solid ${C.sage}`, display: 'block' }}
                  onError={e => { e.target.style.display = 'none'; }}
                />
              </div>
            )}
          </div>

          {/* ══════════════════════════════════════════
              SECTION 5: ORDER TIMELINE
          ══════════════════════════════════════════ */}
          <div style={{ background: C.white, border: `1.5px solid ${C.midGray}`, borderTop: 'none', padding: '28px 44px', marginBottom: 4 }}>
            <SectionHeader icon={<Clock size={15} />} title="Order Timeline" accent={C.earthBrown} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
              <DataRow label="Order Created" value={fmtDateTime(order.created_at)} />
              <DataRow label="Order Number" value={order.order_number} accent />
              {order.approved_at && <DataRow label="Approved On" value={fmtDateTime(order.approved_at)} />}
              {order.verified_at && <DataRow label="Finance Verified" value={fmtDateTime(order.verified_at)} />}
              {order.cancelled_at && <DataRow label="Cancelled On" value={fmtDateTime(order.cancelled_at)} />}
              {order.manager_note && (
                <div style={{ gridColumn: '1 / -1', padding: '12px', borderBottom: `1px solid ${C.midGray}`, background: '#FFF8E1' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#E65100', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 5 }}>Manager Note</div>
                  <div style={{ fontSize: 13, color: C.darkGray, fontStyle: 'italic' }}>{order.manager_note}</div>
                </div>
              )}
            </div>
          </div>

          {/* ══════════════════════════════════════════
              SIGNATURE BLOCK (print only style)
          ══════════════════════════════════════════ */}
          <div style={{ background: C.white, border: `1.5px solid ${C.midGray}`, borderTop: 'none', padding: '28px 44px 36px' }}>
            <SectionHeader icon={<FileText size={15} />} title="Authorization & Signatures" accent={C.darkGreen} />

            <p style={{ fontSize: 12, color: C.textSec, lineHeight: 1.7, margin: '0 0 28px', fontStyle: 'italic' }}>
              By signing below, both parties confirm that all rental terms and conditions described in this contract have been agreed upon,
              and the machinery referenced above will be/has been deployed for the agreed period.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, marginTop: 20 }}>
              {[
                { role: 'CLIENT / TENANT', name: order.customer_name, title: 'Authorized Signatory' },
                { role: 'SUTANA ENTERPRISE', name: 'AgriRent Manager', title: 'Rental Division Representative' },
              ].map(({ role, name, title }) => (
                <div key={role}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: C.textSec, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{role}</div>
                  <div style={{ borderBottom: `1.5px solid ${C.darkGray}`, height: 40, marginBottom: 6, position: 'relative' }}>
                    <div style={{ position: 'absolute', bottom: 4, left: 0, fontSize: 11, color: '#9E9E9E', fontStyle: 'italic' }}>Signature</div>
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: C.darkGray }}>{name}</div>
                  <div style={{ fontSize: 11, color: C.textSec }}>{title}</div>
                  <div style={{ fontSize: 10, color: C.textSec, marginTop: 4 }}>Date: _______________________</div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div style={{ borderTop: `2px solid ${C.darkGreen}`, marginTop: 36, paddingTop: 14, textAlign: 'center', fontSize: 11, color: C.textSec }}>
              <div style={{ fontWeight: 800, color: C.darkGreen, marginBottom: 3 }}>SUTANA ENTERPRISE — Agricultural Machinery Rental Division</div>
              <div>This document is computer-generated and valid without a physical seal · Contract No: {order.order_number} · Generated: {fmtDateTime(new Date())}</div>
            </div>
          </div>

        </div>{/* end printRef */}
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @media print {
          body { background: #fff; }
          button { display: none !important; }
        }
      `}</style>
    </div>
  );
};

export default AgriRentOrderDetail;
