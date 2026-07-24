import React, { useState, useEffect, useCallback } from 'react';
import axios from '../../../services/apiClient';
import {
  Search, RefreshCw, ChevronLeft, ChevronRight,
  Clock, CheckCircle, XCircle, Car, User,
  Calendar, FileText, Plus,
} from 'lucide-react';
import CarRentalOrderDetail  from './CarRentalOrderDetail';
import CarRentalCreateOrder  from './CarRentalCreateOrder';

/* ─────────────── COLOR TOKENS ─────────────── */
const C = {
  forestGreen: '#228B22',
  darkGreen:   '#1B5E20',
  emerald:     '#2E8B57',
  leafGreen:   '#4CAF50',
  sage:        '#A5D6A7',
  earthBrown:  '#8D6E63',
  white:       '#FFFFFF',
  lightGray:   '#F5F5F5',
  darkGray:    '#424242',
  orange:      '#FF9800',
  red:         '#F44336',
  border:      '#8D6E63',
  textSec:     '#616161',
  surfaceAlt:  '#FAFAF8',
};

/* ─────────────── STATUS CONFIG ─────────────── */
const STATUS_LABELS = {
  PENDING_APPROVAL: 'Pending Approval',
  APPROVED:         'Approved',
  ACTIVE:           'Active',
  COMPLETED:        'Completed',
  CANCELLED:        'Cancelled',
  REJECTED:         'Rejected',
};

const STATUS_CFG = {
  PENDING_APPROVAL: { bg: '#FFF3E0', color: '#E65100', border: '#FFCC80' },
  APPROVED:         { bg: '#E8F5E9', color: '#2E7D32', border: '#A5D6A7' },
  ACTIVE:           { bg: '#E3F2FD', color: '#0D47A1', border: '#90CAF9' },
  COMPLETED:        { bg: '#F3E5F5', color: '#4A148C', border: '#CE93D8' },
  CANCELLED:        { bg: '#FFEBEE', color: '#B71C1C', border: '#EF9A9A' },
  REJECTED:         { bg: '#FFEBEE', color: '#B71C1C', border: '#EF9A9A' },
};

const PAY_CFG = {
  PENDING:   { label: 'Awaiting Payment',   bg: '#FFF3E0', color: '#E65100', border: '#FFCC80', Icon: Clock },
  PAID:      { label: 'Payment Confirmed',  bg: '#E8F5E9', color: '#2E7D32', border: '#A5D6A7', Icon: CheckCircle },
  REJECTED:  { label: 'Payment Rejected',   bg: '#FFEBEE', color: '#B71C1C', border: '#EF9A9A', Icon: XCircle },
  Pending:   { label: 'Awaiting Payment',   bg: '#FFF3E0', color: '#E65100', border: '#FFCC80', Icon: Clock },
  Confirmed: { label: 'Payment Confirmed',  bg: '#E8F5E9', color: '#2E7D32', border: '#A5D6A7', Icon: CheckCircle },
  Rejected:  { label: 'Payment Rejected',   bg: '#FFEBEE', color: '#B71C1C', border: '#EF9A9A', Icon: XCircle },
};

/* ─────────────── BADGE COMPONENTS ─────────────── */
const StatusBadge = ({ code }) => {
  const cfg = STATUS_CFG[code] || { bg: '#F5F5F5', color: '#424242', border: '#BDBDBD' };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '4px 10px',
      background: cfg.bg, color: cfg.color,
      border: `1.5px solid ${cfg.border}`,
      fontSize: 11, fontWeight: 700, letterSpacing: '0.03em',
      textTransform: 'uppercase', whiteSpace: 'nowrap',
    }}>
      <span style={{ width: 7, height: 7, background: cfg.color, display: 'inline-block', flexShrink: 0 }} />
      {STATUS_LABELS[code] || code}
    </span>
  );
};

const PayBadge = ({ status }) => {
  const cfg = PAY_CFG[status] || PAY_CFG.PENDING;
  const Icon = cfg.Icon;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '4px 10px',
      background: cfg.bg, color: cfg.color,
      border: `1.5px solid ${cfg.border}`,
      fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap',
    }}>
      <Icon size={12} /> {cfg.label}
    </span>
  );
};

/* ─────────────── TOAST ─────────────── */
const Toast = ({ toasts, remove }) => (
  <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 10 }}>
    {toasts.map(t => {
      const bg = t.type === 'success' ? C.leafGreen : t.type === 'error' ? C.red : C.darkGreen;
      return (
        <div key={t.id} style={{
          background: bg, color: '#fff', padding: '12px 18px',
          boxShadow: '4px 4px 0px rgba(0,0,0,0.25)',
          fontSize: 13, fontWeight: 600, minWidth: 240, maxWidth: 340,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12,
        }}>
          <span>{t.message}</span>
          <button onClick={() => remove(t.id)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 16 }}>×</button>
        </div>
      );
    })}
    <style>{`@keyframes slideIn { from { transform: translateX(60px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`}</style>
  </div>
);

/* ─────────────── INLINE STYLES ─────────────── */
const S = {
  page: { width: '100%', minHeight: '100vh', background: C.white, fontFamily: '"Inter", system-ui, sans-serif', color: C.darkGray, boxSizing: 'border-box' },
  banner: { background: C.darkGreen, borderBottom: `3px solid ${C.earthBrown}`, padding: '0 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', minHeight: 70 },
  bannerLeft: { display: 'flex', alignItems: 'center', gap: 12 },
  bannerTitle: { color: '#fff', fontSize: '1.35rem', fontWeight: 800, letterSpacing: '0.01em', margin: 0 },
  bannerSub: { color: C.sage, fontSize: '0.8rem', margin: '2px 0 0', fontWeight: 500 },
  btnGreen: { display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 20px', background: C.forestGreen, color: '#fff', border: `1px solid ${C.darkGreen}`, fontWeight: 700, fontSize: 13, cursor: 'pointer', boxShadow: `0 4px 0 ${C.darkGreen}`, transition: 'all 0.12s' },
  btnRefresh: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, background: 'rgba(255,255,255,0.12)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)', cursor: 'pointer', boxShadow: '0 3px 0 rgba(0,0,0,0.3)', transition: 'all 0.12s' },
  filterBar: { background: C.white, border: `1px solid ${C.border}`, borderTop: 'none', padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', boxShadow: '0 2px 0px rgba(0,0,0,0.08)' },
  searchWrap: { flex: '1 1 240px', position: 'relative' },
  searchInput: { width: '100%', padding: '9px 12px 9px 36px', border: `1.5px solid ${C.border}`, outline: 'none', fontSize: 13, boxSizing: 'border-box', background: C.lightGray, color: C.darkGray, transition: 'border 0.15s' },
  select: { flex: '0 1 190px', padding: '9px 12px', border: `1.5px solid ${C.border}`, outline: 'none', fontSize: 13, background: C.lightGray, color: C.darkGray, cursor: 'pointer' },
  btnSearch: { padding: '9px 22px', background: C.emerald, color: '#fff', border: `1px solid ${C.darkGreen}`, fontWeight: 700, fontSize: 13, cursor: 'pointer', boxShadow: `0 3px 0 ${C.darkGreen}`, transition: 'all 0.12s' },
  tableWrap: { background: C.white, border: `1px solid ${C.border}`, borderTop: 'none', overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', minWidth: 900 },
  thead: { background: C.darkGreen },
  th: { padding: '13px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.06em', borderRight: `1px solid ${C.emerald}`, whiteSpace: 'nowrap' },
  td: { padding: '13px 14px', borderBottom: `1px solid #E0E0E0`, borderRight: `1px solid #F5F5F5`, verticalAlign: 'top', fontSize: 13 },
  statsRow: { display: 'flex', padding: '1.25rem 1.5rem', background: C.white, border: `1px solid ${C.border}`, borderTop: 'none', borderBottom: 'none', flexWrap: 'wrap', gap: '1rem' },
  statCard: (accent, active) => ({
    flex: '1 1 180px', padding: '18px 24px',
    background: active ? `${accent}12` : '#FAFAFA',
    border: `2px solid ${accent}`, cursor: 'pointer',
    transition: 'all 0.15s',
    boxShadow: active ? `0 4px 0 ${accent}` : '0 2px 0 rgba(0,0,0,0.06)',
    transform: active ? 'translateY(-2px)' : 'none',
    userSelect: 'none',
  }),
  statNum: accent => ({ fontSize: '2rem', fontWeight: 900, color: accent, lineHeight: 1 }),
  statLabel: { fontSize: 11, color: C.textSec, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 6 },
  pagination: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 1.5rem', background: C.surfaceAlt, border: `1px solid ${C.border}`, borderTop: `1px solid #E0E0E0` },
  pgBtn: disabled => ({ padding: '7px 14px', background: disabled ? '#E0E0E0' : C.white, color: disabled ? '#9E9E9E' : C.darkGray, border: `1px solid ${disabled ? '#E0E0E0' : C.border}`, cursor: disabled ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: 13, boxShadow: disabled ? 'none' : '0 3px 0 rgba(0,0,0,0.12)', transition: 'all 0.12s', display: 'inline-flex', alignItems: 'center', gap: 4 }),
  empty: { padding: '4rem 2rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 },
};

/* ─────────────── MAIN COMPONENT ─────────────── */
const RentalOrders = () => {
  const [orders,     setOrders]     = useState([]);
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 0 });
  const [loading,    setLoading]    = useState(true);
  const [filter,     setFilter]     = useState({ status: '', paymentStatus: '', search: '', page: 1 });
  const [toasts,     setToasts]     = useState([]);
  const [spinning,   setSpinning]   = useState(false);
  const [view,       setView]       = useState('list'); // 'list' | 'detail' | 'create'
  const [selectedId, setSelectedId] = useState(null);

  const toast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts(p => [...p, { id, message, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4500);
  }, []);
  const removeToast = useCallback(id => setToasts(p => p.filter(t => t.id !== id)), []);

  const load = useCallback(async (f) => {
    try {
      setLoading(true);
      const params = { page: f.page, limit: 25 };
      if (f.status)        params.status        = f.status;
      if (f.search)        params.search        = f.search;
      if (f.paymentStatus) params.paymentStatus = f.paymentStatus;
      const res = await axios.get('/rental-orders', { params });
      // Support both paginated and flat array responses
      if (res.status === 'success') {
        const payload = res.data;
        if (Array.isArray(payload)) {
          setOrders(payload);
          setPagination({ page: 1, total: payload.length, totalPages: 1 });
        } else {
          setOrders(payload?.orders || payload?.data || []);
          setPagination(payload?.pagination || { page: 1, total: payload?.total || 0, totalPages: payload?.totalPages || 1 });
        }
      } else if (Array.isArray(res)) {
        setOrders(res);
        setPagination({ page: 1, total: res.length, totalPages: 1 });
      }
    } catch (err) {
      console.error(err);
      toast('Failed to load orders. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { load(filter); }, [filter.page, filter.status, filter.paymentStatus, load]);

  const handleSearch = () => {
    const fresh = { ...filter, page: 1 };
    setFilter(fresh);
    load(fresh);
  };

  const handleRefresh = async () => {
    setSpinning(true);
    await load(filter);
    setTimeout(() => setSpinning(false), 600);
    toast('Orders refreshed.', 'success');
  };

  /* ── Stats ── */
  const stats = {
    total:      pagination.total || orders.length,
    pending:    orders.filter(o => o.status === 'PENDING_APPROVAL').length,
    active:     orders.filter(o => o.status === 'ACTIVE').length,
    payPending: orders.filter(o => ['PENDING', 'Pending'].includes(o.paymentStatus)).length,
  };

  /* ── Drill-down views ── */
  if (view === 'detail' && selectedId) {
    return (
      <CarRentalOrderDetail
        orderId={selectedId}
        onBack={() => { setView('list'); setSelectedId(null); load(filter); }}
      />
    );
  }

  if (view === 'create') {
    return (
      <CarRentalCreateOrder
        onBack={() => { setView('list'); load(filter); }}
        onSuccess={() => { setView('list'); load(filter); toast('Manual order created successfully!', 'success'); }}
      />
    );
  }

  /* ── LIST VIEW ── */
  return (
    <div style={S.page}>
      <Toast toasts={toasts} remove={removeToast} />

      {/* ── TOP BANNER ── */}
      <div style={S.banner}>
        <div style={S.bannerLeft}>
          <Car size={26} color={C.sage} />
          <div>
            <h1 style={S.bannerTitle}>Car Rental Orders</h1>
            <p style={S.bannerSub}>Manage vehicle rental bookings and lifecycle</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', paddingBottom: 4 }}>
          <button
            style={S.btnRefresh}
            onClick={handleRefresh}
            title="Refresh"
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.22)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; }}
            onMouseDown={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(3px)'; }}
            onMouseUp={e => { e.currentTarget.style.boxShadow = '0 3px 0 rgba(0,0,0,0.3)'; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            <RefreshCw size={17} style={{ animation: spinning ? 'spin 0.6s linear' : 'none' }} />
          </button>
          <button
            style={S.btnGreen}
            onClick={() => setView('create')}
            onMouseEnter={e => { e.currentTarget.style.background = C.emerald; }}
            onMouseLeave={e => { e.currentTarget.style.background = C.forestGreen; }}
            onMouseDown={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(4px)'; }}
            onMouseUp={e => { e.currentTarget.style.boxShadow = `0 4px 0 ${C.darkGreen}`; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            <Plus size={16} /> New Manual Order
          </button>
        </div>
      </div>

      {/* ── CLICKABLE STAT CARDS ── */}
      <div style={S.statsRow}>
        {[
          { label: 'TOTAL ORDERS',     val: stats.total,      accent: C.darkGreen, filterKey: null,            filterVal: '' },
          { label: 'PENDING APPROVAL', val: stats.pending,    accent: '#E65100',   filterKey: 'status',        filterVal: 'PENDING_APPROVAL' },
          { label: 'ACTIVE RENTALS',   val: stats.active,     accent: '#0288D1',   filterKey: 'status',        filterVal: 'ACTIVE' },
          { label: 'AWAITING PAYMENT', val: stats.payPending, accent: C.red,       filterKey: 'paymentStatus', filterVal: 'PENDING' },
        ].map(s => {
          const isActive = s.filterKey
            ? filter[s.filterKey] === s.filterVal
            : (filter.status === '' && filter.paymentStatus === '');
          return (
            <div
              key={s.label}
              style={S.statCard(s.accent, isActive)}
              onClick={() => {
                if (s.filterKey) {
                  setFilter(f => ({ ...f, status: '', paymentStatus: '', page: 1, [s.filterKey]: s.filterVal }));
                } else {
                  setFilter(f => ({ ...f, status: '', paymentStatus: '', page: 1 }));
                }
              }}
              onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = `${s.accent}0D`; }}
              onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = '#FAFAFA'; }}
            >
              <div style={S.statNum(s.accent)}>{s.val}</div>
              <div style={S.statLabel}>{s.label}</div>
            </div>
          );
        })}
      </div>

      {/* ── FILTER BAR ── */}
      <div style={S.filterBar}>
        <div style={S.searchWrap}>
          <Search size={15} color={C.earthBrown} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            placeholder="Search by Order #, Customer, Phone..."
            value={filter.search}
            onChange={e => setFilter(f => ({ ...f, search: e.target.value }))}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            style={S.searchInput}
            onFocus={e => { e.target.style.border = `1.5px solid ${C.forestGreen}`; }}
            onBlur={e  => { e.target.style.border = `1.5px solid ${C.border}`; }}
          />
        </div>
        <select value={filter.status} onChange={e => setFilter(f => ({ ...f, status: e.target.value, page: 1 }))} style={S.select}>
          <option value="">All Statuses</option>
          {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={filter.paymentStatus} onChange={e => setFilter(f => ({ ...f, paymentStatus: e.target.value, page: 1 }))} style={S.select}>
          <option value="">All Payments</option>
          <option value="PENDING">Pending</option>
          <option value="PAID">Paid / Confirmed</option>
          <option value="REJECTED">Rejected</option>
        </select>
        <button
          style={S.btnSearch}
          onMouseDown={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(3px)'; }}
          onMouseUp={e => { e.currentTarget.style.boxShadow = `0 3px 0 ${C.darkGreen}`; e.currentTarget.style.transform = 'translateY(0)'; }}
          onClick={handleSearch}
        >
          Search
        </button>
      </div>

      {/* ── TABLE ── */}
      <div style={S.tableWrap}>
        <table style={S.table}>
          <thead style={S.thead}>
            <tr>
              {['#', 'Order Info', 'Customer', 'Vehicle / Dates', 'Financials', 'Status', 'Actions'].map((h, i) => (
                <th key={h} style={{ ...S.th, textAlign: i === 6 ? 'center' : 'left', width: i === 0 ? 40 : 'auto' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ ...S.td, textAlign: 'center', padding: '3.5rem', color: C.emerald, fontWeight: 700 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                    <RefreshCw size={28} style={{ animation: 'spin 1s linear infinite', color: C.forestGreen }} />
                    Loading orders...
                  </div>
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <div style={S.empty}>
                    <FileText size={52} style={{ color: '#BDBDBD' }} />
                    <p style={{ fontSize: 15, fontWeight: 700, color: '#757575' }}>No orders found</p>
                    <p style={{ fontSize: 13, color: '#9E9E9E' }}>Try adjusting your filters or create a new manual order.</p>
                    <button style={{ ...S.btnGreen, marginTop: 8 }} onClick={() => setView('create')}>
                      <Plus size={15} /> Create First Order
                    </button>
                  </div>
                </td>
              </tr>
            ) : orders.map((order, idx) => {
              const carName = order.carName || (order.car ? `${order.car.brand || ''} ${order.car.model || ''}`.trim() : 'N/A');
              const startD  = order.startDate || order.start_date;
              const endD    = order.endDate   || order.end_date;
              return (
                <tr
                  key={order.id}
                  style={{ background: idx % 2 === 0 ? C.white : C.lightGray, transition: 'background 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#E8F5E9'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = idx % 2 === 0 ? C.white : C.lightGray; }}
                >
                  {/* Row # */}
                  <td style={{ ...S.td, color: C.textSec, fontSize: 12, fontWeight: 700 }}>{(pagination.page - 1) * 25 + idx + 1}</td>

                  {/* Order Info */}
                  <td style={S.td}>
                    <div style={{ fontWeight: 800, color: C.darkGreen, fontSize: 14, marginBottom: 3 }}>
                      {order.orderNumber || order.order_number}
                      {(order.isManual || order.is_manual) && (
                        <span style={{ marginLeft: 7, fontSize: 9, background: '#E3F2FD', color: '#1565C0', padding: '2px 6px', fontWeight: 700, letterSpacing: '0.04em' }}>MANUAL</span>
                      )}
                    </div>
                    <div style={{ fontSize: 11, color: C.textSec, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Calendar size={11} /> {new Date(order.createdAt || order.created_at).toLocaleDateString()}
                    </div>
                  </td>

                  {/* Customer */}
                  <td style={S.td}>
                    <div style={{ fontWeight: 700, color: C.darkGray, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                      <User size={13} color={C.forestGreen} /> {order.customerName || order.customer_name}
                    </div>
                    <div style={{ fontSize: 12, color: C.textSec }}>{order.customerPhone || order.customer_phone}</div>
                  </td>

                  {/* Vehicle / Dates */}
                  <td style={S.td}>
                    <div style={{ fontWeight: 700, color: C.darkGray, fontSize: 13, marginBottom: 3, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Car size={13} color={C.emerald} /> {carName}
                    </div>
                    <div style={{ fontSize: 11, color: C.textSec }}>
                      {startD ? new Date(startD).toLocaleDateString() : '—'} → {endD ? new Date(endD).toLocaleDateString() : '—'}
                      &nbsp;·&nbsp;<strong>{order.totalDays || order.days || '—'} days</strong>
                    </div>
                  </td>

                  {/* Financials */}
                  <td style={S.td}>
                    <div style={{ fontWeight: 900, color: C.forestGreen, fontSize: 15, marginBottom: 5 }}>
                      {parseFloat(order.totalAmount || order.total_amount || 0).toLocaleString()} ETB
                    </div>
                    <div style={{ marginBottom: 4 }}>
                      <PayBadge status={order.paymentStatus || order.payment_status} />
                    </div>
                    {(order.paymentReference || order.payment_reference) && (
                      <div style={{ fontSize: 10, color: '#9E9E9E' }}>Ref: {order.paymentReference || order.payment_reference}</div>
                    )}
                  </td>

                  {/* Status */}
                  <td style={S.td}>
                    <StatusBadge code={order.status} />
                  </td>

                  {/* Actions */}
                  <td style={{ ...S.td, textAlign: 'center' }}>
                    <button
                      onClick={() => { setSelectedId(order.id); setView('detail'); }}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 16px', background: C.darkGreen, color: '#fff', border: `1px solid ${C.forestGreen}`, fontWeight: 700, fontSize: 12, cursor: 'pointer', boxShadow: `0 3px 0 rgba(27,94,32,0.5)`, transition: 'all 0.12s', whiteSpace: 'nowrap' }}
                      onMouseEnter={e => { e.currentTarget.style.background = C.emerald; }}
                      onMouseLeave={e => { e.currentTarget.style.background = C.darkGreen; }}
                      onMouseDown={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(3px)'; }}
                      onMouseUp={e => { e.currentTarget.style.boxShadow = `0 3px 0 rgba(27,94,32,0.5)`; e.currentTarget.style.transform = 'translateY(0)'; }}
                    >
                      <FileText size={12} /> View Detail
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── PAGINATION ── */}
      {!loading && pagination.totalPages > 1 && (
        <div style={S.pagination}>
          <span style={{ fontSize: 13, color: C.textSec, fontWeight: 500 }}>
            Page <strong>{pagination.page}</strong> of <strong>{pagination.totalPages}</strong>&nbsp;·&nbsp;{pagination.total} total orders
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button disabled={pagination.page === 1} onClick={() => setFilter(f => ({ ...f, page: f.page - 1 }))} style={S.pgBtn(pagination.page === 1)}>
              <ChevronLeft size={15} /> Previous
            </button>
            <button disabled={pagination.page === pagination.totalPages} onClick={() => setFilter(f => ({ ...f, page: f.page + 1 }))} style={S.pgBtn(pagination.page === pagination.totalPages)}>
              Next <ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @media (max-width: 768px) { table { font-size: 12px !important; } th, td { padding: 10px 8px !important; } }
        select:focus { outline: 2px solid ${C.forestGreen}; }
        input:focus { outline: none; }
      `}</style>
    </div>
  );
};

export default RentalOrders;
