import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../../services/apiClient';
import {
  Search, RefreshCw, ChevronLeft, ChevronRight,
  Clock, CheckCircle, XCircle, Tractor, User,
  Calendar, FileText, MapPin, Plus, Leaf
} from 'lucide-react';
import AgriRentOrderDetail from './AgriRentOrderDetail';

/* ─────────────── COLOR TOKENS ─────────────── */
const C = {
  forestGreen:  '#228B22',
  darkGreen:    '#1B5E20',
  emerald:      '#2E8B57',
  leafGreen:    '#4CAF50',
  sage:         '#A5D6A7',
  limeGreen:    '#8BC34A',
  earthBrown:   '#8D6E63',
  skyBlue:      '#87CEEB',
  white:        '#FFFFFF',
  lightGray:    '#F5F5F5',
  darkGray:     '#424242',
  orange:       '#FF9800',
  red:          '#F44336',
  border:       '#8D6E63',
  textSec:      '#616161',
  surfaceAlt:   '#FAFAF8',
};

/* ─────────────── STATIC CONFIG ─────────────── */
const STATUS_LABELS = {
  pending: 'Pending', approved: 'Approved', confirmed: 'Confirmed',
  active: 'Active', completed: 'Completed', cancelled: 'Cancelled',
};

const STATUS_CFG = {
  pending:   { bg: '#FFF3E0', color: '#E65100', border: '#FFCC80' },
  approved:  { bg: '#E8F5E9', color: '#2E7D32', border: '#A5D6A7' },
  confirmed: { bg: '#E8F5E9', color: '#1B5E20', border: '#81C784' },
  active:    { bg: '#E3F2FD', color: '#0D47A1', border: '#90CAF9' },
  completed: { bg: '#F3E5F5', color: '#4A148C', border: '#CE93D8' },
  cancelled: { bg: '#FFEBEE', color: '#B71C1C', border: '#EF9A9A' },
};

const PAY_CFG = {
  Pending:   { label: 'Awaiting Payment', bg: '#FFF3E0', color: '#E65100', border: '#FFCC80', Icon: Clock },
  Confirmed: { label: 'Payment Confirmed', bg: '#E8F5E9', color: '#2E7D32', border: '#A5D6A7', Icon: CheckCircle },
  Rejected:  { label: 'Payment Rejected',  bg: '#FFEBEE', color: '#B71C1C', border: '#EF9A9A', Icon: XCircle },
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
  const cfg = PAY_CFG[status] || PAY_CFG.Pending;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '4px 10px',
      background: cfg.bg, color: cfg.color,
      border: `1.5px solid ${cfg.border}`,
      fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap',
    }}>
      <cfg.Icon size={12} />
      {cfg.label}
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
          animation: 'slideIn 0.25s ease',
        }}>
          <span>{t.message}</span>
          <button onClick={() => remove(t.id)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 16, lineHeight: 1 }}>×</button>
        </div>
      );
    })}
    <style>{`@keyframes slideIn { from { transform: translateX(60px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`}</style>
  </div>
);

/* ─────────────── INLINE STYLES ─────────────── */
const S = {
  page: {
    width: '100%', minHeight: '100vh',
    background: C.white, fontFamily: '"Inter", system-ui, sans-serif',
    color: C.darkGray, boxSizing: 'border-box',
  },

  // Top banner strip
  banner: {
    background: C.darkGreen,
    borderBottom: `3px solid ${C.earthBrown}`,
    padding: '0 1.5rem',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    flexWrap: 'wrap', gap: '0.75rem',
    minHeight: 70,
  },
  bannerLeft: { display: 'flex', alignItems: 'center', gap: 12 },
  bannerTitle: {
    color: '#fff', fontSize: '1.35rem', fontWeight: 800,
    letterSpacing: '0.01em', margin: 0,
  },
  bannerSub: { color: C.sage, fontSize: '0.8rem', margin: '2px 0 0', fontWeight: 500 },

  // Buttons
  btnGreen: {
    display: 'inline-flex', alignItems: 'center', gap: 7,
    padding: '10px 20px',
    background: C.forestGreen,
    color: '#fff',
    border: `1px solid ${C.darkGreen}`,
    fontWeight: 700, fontSize: 13,
    cursor: 'pointer',
    boxShadow: `0 4px 0 ${C.darkGreen}`,
    transform: 'translateY(0)',
    transition: 'all 0.12s',
  },
  btnRefresh: {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    width: 40, height: 40,
    background: 'rgba(255,255,255,0.12)',
    color: '#fff',
    border: '1px solid rgba(255,255,255,0.3)',
    cursor: 'pointer',
    boxShadow: '0 3px 0 rgba(0,0,0,0.3)',
    transition: 'all 0.12s',
  },

  // Filter bar
  filterBar: {
    background: C.white,
    border: `1px solid ${C.border}`,
    borderTop: 'none',
    padding: '1rem 1.5rem',
    display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap',
    boxShadow: '0 2px 0px rgba(0,0,0,0.08)',
  },
  searchWrap: { flex: '1 1 240px', position: 'relative' },
  searchInput: {
    width: '100%', padding: '9px 12px 9px 36px',
    border: `1.5px solid ${C.border}`,
    outline: 'none', fontSize: 13,
    boxSizing: 'border-box',
    background: C.lightGray,
    color: C.darkGray,
    transition: 'border 0.15s',
  },
  select: {
    flex: '0 1 175px', padding: '9px 12px',
    border: `1.5px solid ${C.border}`,
    outline: 'none', fontSize: 13,
    background: C.lightGray, color: C.darkGray,
    cursor: 'pointer',
  },
  btnSearch: {
    padding: '9px 22px',
    background: C.emerald, color: '#fff',
    border: `1px solid ${C.darkGreen}`,
    fontWeight: 700, fontSize: 13,
    cursor: 'pointer',
    boxShadow: `0 3px 0 ${C.darkGreen}`,
    transition: 'all 0.12s',
  },

  // Table wrapper
  tableWrap: {
    background: C.white,
    border: `1px solid ${C.border}`,
    borderTop: 'none',
    overflowX: 'auto',
  },
  table: { width: '100%', borderCollapse: 'collapse', minWidth: 900 },
  thead: { background: C.darkGreen },
  th: {
    padding: '13px 14px', textAlign: 'left',
    fontSize: 11, fontWeight: 700, color: '#fff',
    textTransform: 'uppercase', letterSpacing: '0.06em',
    borderRight: `1px solid ${C.emerald}`,
    whiteSpace: 'nowrap',
  },
  td: {
    padding: '13px 14px',
    borderBottom: `1px solid #E0E0E0`,
    borderRight: `1px solid #F5F5F5`,
    verticalAlign: 'top',
    fontSize: 13,
  },

  // Stats row
  statsRow: {
    display: 'flex', gap: '0', padding: '1.25rem 1.5rem',
    background: C.white,
    border: `1px solid ${C.border}`,
    borderTop: 'none',
    borderBottom: 'none',
    flexWrap: 'wrap',
    gap: '1rem',
  },
  statCard: (accent, active) => ({
    flex: '1 1 180px',
    padding: '18px 24px',
    background: active ? `${accent}12` : '#FAFAFA',
    border: `2px solid ${accent}`,
    cursor: 'pointer',
    transition: 'all 0.15s',
    boxShadow: active ? `0 4px 0 ${accent}` : '0 2px 0 rgba(0,0,0,0.06)',
    transform: active ? 'translateY(-2px)' : 'none',
    userSelect: 'none',
  }),
  statNum: (accent) => ({ fontSize: '2rem', fontWeight: 900, color: accent, lineHeight: 1 }),
  statLabel: { fontSize: 11, color: C.textSec, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 6 },

  // Pagination
  pagination: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '12px 1.5rem',
    background: C.surfaceAlt,
    border: `1px solid ${C.border}`,
    borderTop: `1px solid #E0E0E0`,
  },
  pgBtn: (disabled) => ({
    padding: '7px 14px',
    background: disabled ? '#E0E0E0' : C.white,
    color: disabled ? '#9E9E9E' : C.darkGray,
    border: `1px solid ${disabled ? '#E0E0E0' : C.border}`,
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontWeight: 600, fontSize: 13,
    boxShadow: disabled ? 'none' : '0 3px 0 rgba(0,0,0,0.12)',
    transition: 'all 0.12s',
    display: 'inline-flex', alignItems: 'center', gap: 4,
  }),

  // Empty state
  empty: {
    padding: '4rem 2rem', textAlign: 'center',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
  },
  emptyIcon: { color: '#BDBDBD', marginBottom: 4 },
  emptyText: { fontSize: 15, fontWeight: 700, color: '#757575' },
  emptySubText: { fontSize: 13, color: '#9E9E9E' },

  // Action select
  actionSelect: {
    padding: '5px 10px', fontSize: 12,
    border: `1.5px solid ${C.border}`,
    background: C.lightGray, color: C.darkGray,
    fontWeight: 600, cursor: 'pointer', outline: 'none',
    minWidth: 110,
  },
  paySelect: {
    padding: '5px 10px', fontSize: 11,
    border: `1.5px solid ${C.border}`,
    background: C.lightGray, color: C.darkGray,
    fontWeight: 600, cursor: 'pointer', outline: 'none',
    minWidth: 100,
  },
};

/* ─────────────── MAIN COMPONENT ─────────────── */
const AgriRentOrders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ status: '', paymentStatus: '', search: '', page: 1 });
  const [toasts, setToasts] = useState([]);
  const [spinning, setSpinning] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);

  const toast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts(p => [...p, { id, message, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4000);
  }, []);
  const removeToast = useCallback(id => setToasts(p => p.filter(t => t.id !== id)), []);

  const load = useCallback(async (currentFilter) => {
    try {
      setLoading(true);
      const params = { page: currentFilter.page, limit: 25 };
      if (currentFilter.status) params.status = currentFilter.status;
      if (currentFilter.search) params.search = currentFilter.search;
      if (currentFilter.paymentStatus) params.paymentStatus = currentFilter.paymentStatus;
      const res = await axios.get('/agrirent-orders', { params });
      if (res.status === 'success') {
        setOrders(res.data?.orders || []);
        setPagination(res.data?.pagination || { page: 1, total: 0, totalPages: 0 });
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
    toast('Orders refreshed successfully.', 'success');
  };


  // Compute stats
  const stats = {
    total: pagination.total || orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    active: orders.filter(o => o.status === 'active').length,
    payPending: orders.filter(o => o.payment_status === 'Pending').length,
  };

  if (selectedOrderId) {
    return <AgriRentOrderDetail orderId={selectedOrderId} onBack={() => setSelectedOrderId(null)} />;
  }

  return (
    <div style={S.page}>
      <Toast toasts={toasts} remove={removeToast} />

      {/* ── TOP BANNER ── */}
      <div style={S.banner}>
        <div style={S.bannerLeft}>
          <Leaf size={26} color={C.sage} />
          <div>
            <h1 style={S.bannerTitle}>AgriRent Orders</h1>
            <p style={S.bannerSub}>Manage tractor and machinery rental bookings</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', paddingBottom: 4 }}>
          <button
            style={S.btnRefresh}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.22)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; }}
            onMouseDown={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(3px)'; }}
            onMouseUp={e => { e.currentTarget.style.boxShadow = '0 3px 0 rgba(0,0,0,0.3)'; e.currentTarget.style.transform = 'translateY(0)'; }}
            onClick={handleRefresh}
            title="Refresh"
          >
            <SegmentedSpinner size={17} />
          </button>
          <button
            style={S.btnGreen}
            onMouseEnter={e => { e.currentTarget.style.background = C.emerald; }}
            onMouseLeave={e => { e.currentTarget.style.background = C.forestGreen; }}
            onMouseDown={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(4px)'; }}
            onMouseUp={e => { e.currentTarget.style.boxShadow = `0 4px 0 ${C.darkGreen}`; e.currentTarget.style.transform = 'translateY(0)'; }}
            onClick={() => navigate('/car-renting/manager/agri-orders/new')}
          >
            <Plus size={16} />
            New Manual Order
          </button>
        </div>
      </div>

      {/* ── CLICKABLE FILTER STAT CARDS ── */}
      <div style={S.statsRow}>
        {[
          { label: 'TOTAL ORDERS',     val: stats.total,      accent: C.darkGreen, filterKey: null,            filterVal: '' },
          { label: 'PENDING ORDERS',   val: stats.pending,    accent: '#E65100',   filterKey: 'status',        filterVal: 'pending' },
          { label: 'ACTIVE ORDERS',    val: stats.active,     accent: '#0288D1',   filterKey: 'status',        filterVal: 'active' },
          { label: 'AWAITING PAYMENT', val: stats.payPending, accent: C.red,       filterKey: 'paymentStatus', filterVal: 'Pending' },
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
                  // Clear the other key, set this one
                  const newFilter = { ...filter, status: '', paymentStatus: '', page: 1, [s.filterKey]: s.filterVal };
                  setFilter(newFilter);
                } else {
                  // "Total" — clear all filters
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
            onBlur={e => { e.target.style.border = `1.5px solid ${C.border}`; }}
          />
        </div>
        <select
          value={filter.status}
          onChange={e => setFilter(f => ({ ...f, status: e.target.value, page: 1 }))}
          style={S.select}
        >
          <option value="">All Statuses</option>
          {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select
          value={filter.paymentStatus}
          onChange={e => setFilter(f => ({ ...f, paymentStatus: e.target.value, page: 1 }))}
          style={S.select}
        >
          <option value="">All Payments</option>
          <option value="Pending">Pending</option>
          <option value="Confirmed">Confirmed</option>
          <option value="Rejected">Rejected</option>
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
              {['#', 'Order Info', 'Customer', 'Asset / Details', 'Financials', 'Job Status', 'Actions'].map((h, i) => (
                <th key={h} style={{ ...S.th, textAlign: i === 6 ? 'center' : 'left', width: i === 0 ? 40 : 'auto' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ ...S.td, textAlign: 'center', padding: '3.5rem', color: C.emerald, fontWeight: 700, fontSize: 14 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                    <SegmentedSpinner size={28} />
                    Loading orders...
                  </div>
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <div style={S.empty}>
                    <FileText size={52} style={S.emptyIcon} />
                    <p style={S.emptyText}>No orders found</p>
                    <p style={S.emptySubText}>Try adjusting your filters or create a new order.</p>
                    <button
                      style={{ ...S.btnGreen, marginTop: 8 }}
                      onClick={() => navigate('/car-renting/manager/agri-orders/new')}
                    >
                      <Plus size={15} /> Create First Order
                    </button>
                  </div>
                </td>
              </tr>
            ) : orders.map((order, idx) => (
              <tr
                key={order.id}
                style={{
                  background: idx % 2 === 0 ? C.white : C.lightGray,
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#E8F5E9'; }}
                onMouseLeave={e => { e.currentTarget.style.background = idx % 2 === 0 ? C.white : C.lightGray; }}
              >
                {/* Row # */}
                <td style={{ ...S.td, color: C.textSec, fontSize: 12, fontWeight: 700 }}>{(pagination.page - 1) * 25 + idx + 1}</td>

                {/* Order Info */}
                <td style={S.td}>
                  <div style={{ fontWeight: 800, color: C.darkGreen, fontSize: 14, marginBottom: 3 }}>
                    {order.order_number}
                    {order.is_manual && (
                      <span style={{ marginLeft: 7, fontSize: 9, background: '#E3F2FD', color: '#1565C0', padding: '2px 6px', fontWeight: 700, letterSpacing: '0.04em' }}>
                        MANUAL
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: C.textSec, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Calendar size={11} /> {new Date(order.created_at).toLocaleDateString()}
                  </div>
                </td>

                {/* Customer */}
                <td style={S.td}>
                  <div style={{ fontWeight: 700, color: C.darkGray, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                    <User size={13} color={C.forestGreen} /> {order.customer_name}
                  </div>
                  <div style={{ fontSize: 12, color: C.textSec }}>{order.customer_phone}</div>
                  {order.customer_email && <div style={{ fontSize: 11, color: C.skyBlue }}>{order.customer_email}</div>}
                </td>

                {/* Asset / Details */}
                <td style={S.td}>
                  <div style={{ fontWeight: 700, color: C.darkGray, fontSize: 13, marginBottom: 3, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Tractor size={13} color={C.emerald} />
                    {order.tractor_name || 'Unassigned Machine'}
                  </div>
                  {order.field_location && (
                    <div style={{ fontSize: 11, color: C.textSec, display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                      <MapPin size={10} /> {order.field_location}
                      {order.field_size_hectares ? ` · ${order.field_size_hectares} ha` : ''}
                    </div>
                  )}
                  <div style={{ fontSize: 11, color: C.textSec }}>
                    {new Date(order.start_date).toLocaleDateString()} → {new Date(order.end_date).toLocaleDateString()}
                    &nbsp;·&nbsp;<strong>{order.total_days} days</strong>
                  </div>
                </td>

                {/* Financials */}
                <td style={S.td}>
                  <div style={{ fontWeight: 900, color: C.forestGreen, fontSize: 15, marginBottom: 5 }}>
                    {parseFloat(order.total_amount || 0).toLocaleString()} ETB
                  </div>
                  <div style={{ marginBottom: 6 }}>
                    <PayBadge status={order.payment_status} />
                  </div>
                  <div style={{ fontSize: 10, color: '#9E9E9E', marginBottom: 6 }}>
                    Ref: {order.payment_reference || '—'}
                  </div>
                </td>

                {/* Job Status */}
                <td style={S.td}>
                  <StatusBadge code={order.status} />
                </td>

                {/* Actions */}
                <td style={{ ...S.td, textAlign: 'center' }}>
                  <button
                    onClick={() => setSelectedOrderId(order.id)}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      padding: '7px 16px',
                      background: C.darkGreen, color: '#fff',
                      border: `1px solid ${C.forestGreen}`,
                      fontWeight: 700, fontSize: 12, cursor: 'pointer',
                      boxShadow: `0 3px 0 rgba(27,94,32,0.5)`,
                      transition: 'all 0.12s',
                      whiteSpace: 'nowrap',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = C.emerald; }}
                    onMouseLeave={e => { e.currentTarget.style.background = C.darkGreen; }}
                    onMouseDown={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(3px)'; }}
                    onMouseUp={e => { e.currentTarget.style.boxShadow = `0 3px 0 rgba(27,94,32,0.5)`; e.currentTarget.style.transform = 'translateY(0)'; }}
                  >
                    <FileText size={12} /> View Detail
                  </button>
                </td>
              </tr>
            ))}
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
            <button
              disabled={pagination.page === 1}
              onClick={() => setFilter(f => ({ ...f, page: f.page - 1 }))}
              style={S.pgBtn(pagination.page === 1)}
            >
              <ChevronLeft size={15} /> Previous
            </button>
            <button
              disabled={pagination.page === pagination.totalPages}
              onClick={() => setFilter(f => ({ ...f, page: f.page + 1 }))}
              style={S.pgBtn(pagination.page === pagination.totalPages)}
            >
              Next <ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @media (max-width: 768px) {
          table { font-size: 12px !important; }
          th, td { padding: 10px 8px !important; }
        }
        @media (max-width: 480px) {
          h1 { font-size: 1.1rem !important; }
        }
        select:focus { outline: 2px solid ${C.forestGreen}; }
        input:focus { outline: none; }
      `}</style>
    </div>
  );
};

export default AgriRentOrders;
