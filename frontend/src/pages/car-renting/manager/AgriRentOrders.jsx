import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from '../../../services/apiClient';
import {
  Search, RefreshCw, ChevronLeft, ChevronRight,
  Clock, CheckCircle, XCircle, Tractor, User,
  Calendar, FileText, MapPin, Plus, Leaf,
  Archive, Trash2, AlertTriangle, Bell, Phone, Mail, BellRing,
} from 'lucide-react';
import AgriRentOrderDetail from './AgriRentOrderDetail';
import SegmentedSpinner from '../../../components/ui/SegmentedSpinner';
import './AgriRentOrders.css';

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
  active: 'Released', completed: 'Completed', cancelled: 'Cancelled',
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

const DAY_MS = 24 * 60 * 60 * 1000;
/* Live rental countdown — mirrors the car rental dashboard */
const rentalStats = (order) => {
  const end = new Date(order.end_date);
  const totalDays = Math.max(1, parseInt(order.total_days || 1, 10));
  const begun = order.released_at;
  const now = Date.now();
  const elapsedDays = begun ? Math.max(0, Math.floor((now - new Date(begun).getTime()) / DAY_MS)) : 0;
  const diff = end.getTime() - now;
  const overdue = diff < 0;
  const remaining = diff < 0 ? Math.abs(Math.ceil(diff / DAY_MS)) : Math.ceil(diff / DAY_MS);
  return { end, totalDays, begun: begun ? new Date(begun) : null, elapsedDays, remaining, overdue };
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
  const location = useLocation();
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ status: '', paymentStatus: '', search: '', page: 1 });
  const [toasts, setToasts] = useState([]);
  const [spinning, setSpinning] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null); // { variant, id, orderNumber }
  const [bulkBusy, setBulkBusy] = useState(false);
  const [waitlist, setWaitlist] = useState([]);
  const [waitlistCount, setWaitlistCount] = useState(0);
  const [waitlistLoading, setWaitlistLoading] = useState(false);
  const [awaitDates, setAwaitDates] = useState([]);
  const [awaitDatesLoading, setAwaitDatesLoading] = useState(false);
  const [datesModal, setDatesModal] = useState(null); // { order, startDate, endDate, dailyRateOverride }

  const TERMINAL_STATUSES = ['completed', 'cancelled'];
  const terminalOrders = orders.filter(o => TERMINAL_STATUSES.includes(o.status) && !o.is_manual);

  const runConfirm = async () => {
    const action = confirmAction;
    setConfirmAction(null);
    if (!action) return;

    const ids = action.variant.startsWith('bulk')
      ? (Array.isArray(action.ids) && action.ids.length ? action.ids : terminalOrders.map(o => o.id))
      : [action.id];

    try {
      if (action.variant === 'archive' || action.variant === 'bulkArchive') {
        const res = await axios.post('/agrirent-orders/bulk-archive', { ids });
        toast(res.message || `${ids.length} order(s) moved to history`, 'success');
      } else if (action.variant === 'delete' || action.variant === 'bulkDelete') {
        const res = await axios.delete('/agrirent-orders/bulk', { data: { ids } });
        toast(res.message || `${ids.length} order(s) deleted`, 'success');
      }
      load(filter);
    } catch (err) {
      toast(err?.response?.data?.message || err.message || 'Action failed', 'error');
    }
  };

  // Gather every completed order (across pages) and move them to history at once.
  const handleMoveCompletedToHistory = async () => {
    setBulkBusy(true);
    try {
      const all = [];
      let page = 1;
      let totalPages = 1;
      do {
        const res = await axios.get('/agrirent-orders', { params: { status: 'completed', page, limit: 200 } });
        all.push(...(res.data?.orders || []));
        totalPages = res.data?.pagination?.totalPages || 1;
        page += 1;
      } while (page <= totalPages);

      const ids = all.filter(o => o.status === 'completed').map(o => o.id);
      if (!ids.length) {
        toast('No completed orders to move to history.', 'info');
        return;
      }
      setConfirmAction({ variant: 'bulkArchive', ids, count: ids.length });
    } catch (err) {
      toast(err?.response?.data?.message || 'Failed to load completed orders.', 'error');
    } finally {
      setBulkBusy(false);
    }
  };

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

  const loadWaitlist = useCallback(async () => {
    try {
      setWaitlistLoading(true);
      const res = await axios.get('/agrirent-waitlist');
      if (res.status === 'success') {
        setWaitlist(Array.isArray(res.data) ? res.data : []);
        setWaitlistCount(res.counts?.waiting ?? 0);
      }
    } catch (err) {
      console.error('Failed to load agrirent waitlist:', err);
    } finally {
      setWaitlistLoading(false);
    }
  }, []);

  useEffect(() => { loadWaitlist(); }, [loadWaitlist]);

  const loadAwaitDates = useCallback(async () => {
    try {
      setAwaitDatesLoading(true);
      const res = await axios.get('/agrirent-orders/schedule-later');
      if (res.status === 'success') setAwaitDates(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to load awaiting-dates orders:', err);
    } finally {
      setAwaitDatesLoading(false);
    }
  }, []);

  useEffect(() => { loadAwaitDates(); }, [loadAwaitDates]);

  const openDatesModal = (order) => {
    setDatesModal({ order, startDate: '', endDate: '', dailyRateOverride: '' });
  };

  const submitDates = async (e) => {
    e.preventDefault();
    if (!datesModal) return;
    const { order, startDate, endDate, dailyRateOverride } = datesModal;
    if (!startDate || !endDate) { toast('Both start and end dates are required.', 'error'); return; }
    if (new Date(endDate) <= new Date(startDate)) { toast('End date must be after start date.', 'error'); return; }
    try {
      const body = { startDate, endDate };
      if (dailyRateOverride) body.dailyRateOverride = parseFloat(dailyRateOverride);
      const res = await axios.patch(`/agrirent-orders/${order.id}/dates`, body);
      toast(res?.message || `Dates set for ${order.customer_name}.`, 'success');
      setDatesModal(null);
      loadAwaitDates();
      load(filter);
      loadWaitlist();
    } catch (err) {
      toast(err?.response?.data?.message || err.message || 'Failed to set dates.', 'error');
    }
  };

  const handleWaitlistMarkNotified = async (entry) => {
    try {
      await axios.patch(`/agrirent-waitlist/${entry.id}`, { status: 'notified' });
      toast(`${entry.customer_name} marked as notified.`, 'success');
      loadWaitlist();
    } catch (err) {
      toast(err?.response?.data?.message || err.message || 'Action failed', 'error');
    }
  };

  const handleWaitlistRemove = async (entry) => {
    try {
      await axios.delete(`/agrirent-waitlist/${entry.id}`);
      toast('Availability request removed.', 'success');
      loadWaitlist();
    } catch (err) {
      toast(err?.response?.data?.message || err.message || 'Action failed', 'error');
    }
  };

  const handleWaitlistCreateOrder = (entry) => {
    navigate('/car-renting/manager/agri-orders/new', {
      state: {
        tractorId: entry.tractor_id,
        customerName: entry.customer_name,
        customerPhone: entry.customer_phone,
        customerEmail: entry.customer_email || '',
        waitlistId: entry.id,
      }
    });
  };

    useEffect(() => {
    if (location.state?.autoSelectSearchItem) {
      const item = location.state.autoSelectSearchItem.item;
      if (item && (item.order_number || item.id || item.plate_number || item.name)) {
        const q = String(item.order_number || item.plate_number || item.name || item.id).toLowerCase();
        
        // Handle filter object (Orders)
        if (typeof setFilter === 'function') {
          setFilter(f => ({ ...f, search: q, page: 1 }));
          if (typeof load === 'function') load({ ...filter, search: q, page: 1 });
        } 
        // Handle searchQuery string (Fleet)
        else if (typeof setSearchQuery === 'function') {
          setSearchQuery(q);
        }
      }
      
      // Clear state so refresh doesn't trigger it again
      navigate(location.pathname, { replace: true, state: {} });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  /* 🔍 Global navbar search listener */
  useEffect(() => {
    const handler = (e) => {
      const q = (e.detail || '').trim();
      const fresh = { ...filter, search: q, page: 1 };
      setFilter(fresh);
      load(fresh);
    };
    window.addEventListener('dashboardSearch', handler);
    return () => window.removeEventListener('dashboardSearch', handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load]);

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

  const handleQuickRelease = async (order) => {
    try {
      await axios.patch(`/agrirent-orders/${order.id}/status`, { status: 'active' });
      toast(`${order.order_number} — machine released to field.`, 'success');
      load(filter);
    } catch (err) {
      toast(err?.response?.data?.message || err.message || 'Release failed.', 'error');
    }
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

  /* ── Local client-side search filter (instant, no round-trip) ── */
  const filteredOrders = filter.search
    ? orders.filter(o => {
        const q = filter.search.toLowerCase();
        return (
          (o.order_number || '').toLowerCase().includes(q) ||
          String(o.id || '').includes(q) ||
          (o.customer_name || '').toLowerCase().includes(q) ||
          (o.customer_phone || '').toLowerCase().includes(q)
        );
      })
    : orders;

  return (
    <div className="aro-page" style={S.page}>
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
            style={{ ...S.btnRefresh, width: 'auto', padding: '0 16px', gap: 6, opacity: bulkBusy ? 0.6 : 1, cursor: bulkBusy ? 'wait' : 'pointer' }}
            onClick={handleMoveCompletedToHistory}
            disabled={bulkBusy}
            title="Move all completed orders to history"
          >
            <Archive size={15} /> Move Completed to History
          </button>
          <button
            style={{ ...S.btnRefresh, width: 'auto', padding: '0 16px', gap: 6 }}
            onClick={() => navigate('/car-renting/manager/agri-history')}
            title="Open agri rent order history"
          >
            <Archive size={15} /> History
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
          { label: 'RELEASED ORDERS',  val: stats.active,     accent: '#0288D1',   filterKey: 'status',        filterVal: 'active' },
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

      {/* ── ORDERS AWAITING DATES (schedule-later holds) ── */}
      {awaitDates.length > 0 && (
        <div style={{
          background: '#FFFDF5', border: `2px solid ${C.orange}`, borderTop: 'none',
          borderLeft: `6px solid ${C.orange}`, padding: '1.1rem 1.5rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '0.75rem' }}>
            <Calendar size={20} color={C.orange} />
            <div>
              <div style={{ fontWeight: 900, fontSize: 15, color: '#6D4C41' }}>Orders Awaiting Dates ({awaitDates.length})</div>
              <div style={{ fontSize: 11, color: C.textSec }}>Reserved for waitlist customers while the machine was booked — fill in the hire dates now.</div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1rem' }}>
            {awaitDates.map(order => (
              <div key={order.id} style={{ background: '#fff', border: `1.5px solid ${C.border}`, padding: '0.9rem 1rem', display: 'flex', flexDirection: 'column', gap: 7 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Tractor size={14} color={C.emerald} />
                  <span style={{ fontWeight: 800, fontSize: 13.5, color: C.darkGreen }}>{order.tractor_name || 'Unknown Machine'}</span>
                  <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 800, color: C.orange, background: '#FFF3E0', border: `1px solid ${C.orange}`, padding: '2px 7px' }}>
                    DATES PENDING
                  </span>
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.darkGray, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <User size={12} color={C.forestGreen} /> {order.customer_name}
                  <span style={{ marginLeft: 'auto', fontSize: 11.5, color: C.textSec, fontFamily: 'monospace' }}>{order.customer_phone}</span>
                </div>
                {order.farming_purpose && <div style={{ fontSize: 11.5, color: C.textSec }}>{order.farming_purpose}{order.field_location ? ` · ${order.field_location}` : ''}</div>}
                <button
                  onClick={() => openDatesModal(order)}
                  style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '7px 12px', background: C.forestGreen, color: '#fff', border: `1px solid ${C.darkGreen}`, fontWeight: 700, fontSize: 12, cursor: 'pointer', boxShadow: `0 3px 0 ${C.darkGreen}` }}
                >
                  <Calendar size={13} /> Set Dates
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── AVAILABILITY REQUESTS (WAITLIST) ── */}
      <div style={{
        background: C.white, border: `2px solid ${C.border}`, borderTop: 'none',
        borderLeft: `6px solid ${C.forestGreen}`, padding: '1.1rem 1.5rem',
        display: 'flex', alignItems: 'flex-start', gap: '1.25rem', flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 240, paddingTop: 4 }}>
          <span style={{ position: 'relative', display: 'inline-flex' }}>
            <Bell size={22} color={C.forestGreen} />
            {waitlistCount > 0 && (
              <span style={{
                position: 'absolute', top: -8, right: -8, background: C.red, color: '#fff',
                borderRadius: '50%', minWidth: 18, height: 18, fontSize: 10, fontWeight: 800,
                display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px',
              }}>
                {waitlistCount}
              </span>
            )}
          </span>
          <div>
            <div style={{ fontWeight: 900, fontSize: 15, color: C.darkGreen }}>Availability Requests</div>
            <div style={{ fontSize: 11, color: C.textSec }}>Customers waiting for a booked machine</div>
          </div>
        </div>

        {waitlistLoading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: C.emerald, fontSize: 13, fontWeight: 600, paddingTop: 8 }}>
            <SegmentedSpinner size={16} /> Loading requests...
          </div>
        ) : waitlist.length === 0 ? (
          <div style={{ paddingTop: 8, fontSize: 12.5, color: '#9E9E9E' }}>
            No availability requests right now. When a customer clicks "Contact When Available" on the booking page while a machine is booked, their details and message appear here.
          </div>
        ) : (
          <div style={{ flex: '1 1 100%', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '1rem', marginTop: '0.25rem' }}>
            {waitlist.map(entry => {
              const isWaiting = entry.status === 'waiting';
              const isNotified = entry.status === 'notified';
              const isConverted = entry.status === 'converted';
              const statusCfg = isWaiting
                ? { bg: '#FFF8E1', color: '#E65100', label: 'Waiting' }
                : isNotified
                  ? { bg: '#E8F5E9', color: '#2E7D32', label: 'Notified' }
                  : isConverted
                    ? { bg: '#E3F2FD', color: '#0D47A1', label: 'Converted' }
                    : { bg: '#F5F5F5', color: '#757575', label: 'Removed' };
              return (
                <div key={entry.id} style={{
                  background: isWaiting ? '#FFFDF5' : '#FAFAFA',
                  border: `1.5px solid ${isWaiting ? C.forestGreen : C.border}`,
                  padding: '1rem 1.1rem', display: 'flex', flexDirection: 'column', gap: 8,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <Tractor size={15} color={C.emerald} />
                    <span style={{ fontWeight: 800, fontSize: 13.5, color: C.darkGreen }}>{entry.tractor_name || 'Unknown Machine'}</span>
                    <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 800, letterSpacing: '0.05em', padding: '3px 8px', background: statusCfg.bg, color: statusCfg.color, border: `1px solid ${statusCfg.color}` }}>
                      {statusCfg.label}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: C.darkGray, flexWrap: 'wrap' }}>
                    <User size={13} color={C.forestGreen} /> {entry.customer_name}
                    <span style={{ marginLeft: 'auto', fontSize: 11.5, color: C.textSec, fontWeight: 600, fontFamily: 'monospace' }}>{entry.customer_phone}</span>
                  </div>
                  {entry.customer_email && (
                    <div style={{ fontSize: 11, color: C.skyBlue, display: 'flex', alignItems: 'center', gap: 5 }}>
                      <Mail size={11} /> {entry.customer_email}
                    </div>
                  )}

                  {(entry.field_location || entry.farming_purpose || entry.preferred_start_date || entry.preferred_end_date) && (
                    <div style={{ fontSize: 11.5, color: C.textSec, display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
                      <MapPin size={11} />
                      {entry.field_location ? `${entry.field_location}${entry.field_size_hectares ? ` · ${entry.field_size_hectares} ha` : ''}` : 'Location not given'}
                      {entry.farming_purpose && <span>· {entry.farming_purpose}</span>}
                      {entry.preferred_start_date && (
                        <span>· needs {new Date(entry.preferred_start_date).toLocaleDateString()}{entry.preferred_end_date ? ` → ${new Date(entry.preferred_end_date).toLocaleDateString()}` : ''}</span>
                      )}
                    </div>
                  )}

                  {entry.message && (
                    <div style={{ fontSize: 12, color: '#5D4037', fontStyle: 'italic', background: '#F5F0EB', padding: '7px 10px', border: '1px solid #E0D3C6' }}>
                      “{entry.message}”
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: 8, marginTop: 'auto', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => handleWaitlistCreateOrder(entry)}
                      disabled={isConverted}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px',
                        background: C.forestGreen, color: '#fff', border: `1px solid ${C.darkGreen}`,
                        fontWeight: 700, fontSize: 11.5, cursor: isConverted ? 'not-allowed' : 'pointer',
                        opacity: isConverted ? 0.5 : 1, boxShadow: `0 3px 0 ${C.darkGreen}`,
                      }}
                      title={isConverted ? 'Already converted to an order' : 'Reserve this customer next-in-line (dates set later when the machine is free)'}
                    >
                      <Plus size={13} /> Reserve Next / Walk-in
                    </button>
                    {(isWaiting || isNotified) && !isConverted && (
                      <>
                        <button
                          onClick={() => handleWaitlistMarkNotified(entry)}
                          disabled={isNotified}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px',
                            background: C.leafGreen, color: '#fff', border: `1px solid ${C.darkGreen}`,
                            fontWeight: 700, fontSize: 11.5, cursor: isNotified ? 'not-allowed' : 'pointer',
                            opacity: isNotified ? 0.55 : 1, boxShadow: `0 3px 0 ${C.darkGreen}`,
                          }}
                          title={isNotified ? 'This customer has already been notified' : 'Mark as contacted / notified'}
                        >
                          <BellRing size={13} /> {isNotified ? 'Notified' : 'Mark Notified'}
                        </button>
                        <button
                          onClick={() => handleWaitlistRemove(entry)}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px',
                            background: '#C62828', color: '#fff', border: '1px solid #8E0000',
                            fontWeight: 700, fontSize: 11.5, cursor: 'pointer', boxShadow: `0 3px 0 #8E0000`,
                          }}
                          title="Remove this request"
                        >
                          <Trash2 size={13} /> Remove
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── FILTER BAR ── */}
      <div style={S.filterBar}>
        <div style={S.searchWrap}>
          <Search size={15} color={C.earthBrown} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            placeholder="Search by Order #, Customer, Phone..."
            value={filter.search}
            onChange={e => setFilter(f => ({ ...f, search: e.target.value, page: 1 }))}
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
            ) : filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <div style={S.empty}>
                    <FileText size={52} style={S.emptyIcon} />
                    <p style={S.emptyText}>{filter.search ? `No orders matching "${filter.search}"` : 'No orders found'}</p>
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
            ) : filteredOrders.map((order, idx) => (
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
                  {order.status === 'active' && order.released_at && (() => {
                    const rs = rentalStats(order);
                    return (
                      <div style={{ fontSize: 11, fontWeight: 700, color: rs.overdue ? C.red : C.blue, backgroundColor: rs.overdue ? '#FFEBEE' : '#E3F2FD', padding: '2px 6px', marginTop: 4, display: 'inline-block' }}>
                        🚜 Released {new Date(order.released_at).toLocaleDateString()} · Day {Math.min(rs.elapsedDays + 1, rs.totalDays)}/{rs.totalDays}
                        &nbsp;·&nbsp;{rs.overdue ? `${rs.remaining}d overdue` : `${rs.remaining}d left`}
                      </div>
                    );
                  })()}
                </td>

                {/* Financials */}
                <td style={S.td}>
                  <div style={{ fontWeight: 900, color: C.forestGreen, fontSize: 15, marginBottom: 5 }}>
                    {parseFloat(order.total_amount || 0).toLocaleString()} ETB
                  </div>
                  <div style={{ fontSize: 11, color: C.textSec, marginBottom: 4 }}>
                    VAT: {parseFloat(order.vat_amount || 0).toLocaleString()} ETB
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
                  <div style={{ display: 'inline-flex', flexDirection: 'column', gap: 6, alignItems: 'stretch' }}>
                    {TERMINAL_STATUSES.includes(order.status) && (
                      <>
                        <button
                          onClick={() => setConfirmAction({ variant: 'archive', id: order.id, orderNumber: order.order_number })}
                          style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '7px 16px', background: '#6D4C41', color: '#fff', border: '1px solid #4E342E', fontWeight: 700, fontSize: 12, cursor: 'pointer', boxShadow: '0 3px 0 rgba(78,52,46,0.5)', transition: 'all 0.12s', whiteSpace: 'nowrap' }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#795548'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = '#6D4C41'; }}
                          onMouseDown={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(3px)'; }}
                          onMouseUp={e => { e.currentTarget.style.boxShadow = '0 3px 0 rgba(78,52,46,0.5)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                          title="Move completed / cancelled order to history"
                        >
                          <Archive size={12} /> To History
                        </button>
                        {!order.is_manual && (
                          <button
                            onClick={() => setConfirmAction({ variant: 'delete', id: order.id, orderNumber: order.order_number })}
                            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '7px 16px', background: '#C62828', color: '#fff', border: '1px solid #8E0000', fontWeight: 700, fontSize: 12, cursor: 'pointer', boxShadow: '0 3px 0 rgba(142,0,0,0.5)', transition: 'all 0.12s', whiteSpace: 'nowrap' }}
                            onMouseEnter={e => { e.currentTarget.style.background = '#D32F2F'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = '#C62828'; }}
                            onMouseDown={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(3px)'; }}
                            onMouseUp={e => { e.currentTarget.style.boxShadow = '0 3px 0 rgba(142,0,0,0.5)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                            title="Delete completed / cancelled order"
                          >
                            <Trash2 size={12} /> Delete
                          </button>
                        )}
                      </>
                    )}
                    <button
                      onClick={() => setSelectedOrderId(order.id)}
                      style={{
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
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
                    {['approved', 'confirmed'].includes(order.status)
                      && ['Confirmed', 'PAID', 'PAYMENT_VERIFIED'].includes(order.payment_status)
                      && (
                        <button
                          onClick={() => handleQuickRelease(order)}
                          style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '7px 16px', background: '#0D47A1', color: '#fff', border: '1px solid #0a3370', fontWeight: 700, fontSize: 12, cursor: 'pointer', boxShadow: '0 3px 0 rgba(10,51,112,0.5)', transition: 'all 0.12s', whiteSpace: 'nowrap' }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#1565C0'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = '#0D47A1'; }}
                          onMouseDown={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(3px)'; }}
                          onMouseUp={e => { e.currentTarget.style.boxShadow = '0 3px 0 rgba(10,51,112,0.5)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                          title="Release the machine to the field (paid order)"
                        >
                          🚜 Release
                        </button>
                      )}
                  </div>
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
      `}</style>

      {/* ── SET DATES MODAL ── */}
      {datesModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#fff', maxWidth: 480, width: '100%', border: `2px solid ${C.border}`, boxShadow: '8px 8px 0 rgba(0,0,0,0.2)', padding: '26px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <Calendar size={20} color={C.forestGreen} />
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: C.darkGray }}>Set Hire Dates</h3>
            </div>
            <p style={{ fontSize: 13, color: C.textSec, marginTop: 6, marginBottom: 18 }}>
              {datesModal.order.customer_name} · <strong>{datesModal.order.tractor_name}</strong><br />
              Setting these dates confirms the booking (amount is calculated and the machine becomes Booked again).
            </p>
            <form onSubmit={submitDates}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: C.textSec, textTransform: 'uppercase', marginBottom: 5, display: 'block' }}>Start Date *</label>
                  <input type="date" className="fsp-input" required min={new Date().toISOString().split('T')[0]}
                    value={datesModal.startDate}
                    onChange={e => setDatesModal(d => ({ ...d, startDate: e.target.value }))}
                    style={{ width: '100%', padding: '9px 12px', border: `1.5px solid ${C.border}`, fontSize: 14 }} />
                </div>
                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: C.textSec, textTransform: 'uppercase', marginBottom: 5, display: 'block' }}>End Date *</label>
                  <input type="date" className="fsp-input" required min={datesModal.startDate || new Date().toISOString().split('T')[0]}
                    value={datesModal.endDate}
                    onChange={e => setDatesModal(d => ({ ...d, endDate: e.target.value }))}
                    style={{ width: '100%', padding: '9px 12px', border: `1.5px solid ${C.border}`, fontSize: 14 }} />
                </div>
              </div>
              <div style={{ marginBottom: '1.2rem' }}>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: C.textSec, textTransform: 'uppercase', marginBottom: 5, display: 'block' }}>Daily Rate Override (ETB) — optional</label>
                <input type="number" min="0" step="0.01"
                  value={datesModal.dailyRateOverride}
                  onChange={e => setDatesModal(d => ({ ...d, dailyRateOverride: e.target.value }))}
                  placeholder={`Default: ${parseFloat(datesModal.order.daily_rate || 0).toFixed(2)} ETB/day`}
                  style={{ width: '100%', padding: '9px 12px', border: `1.5px solid ${C.border}`, fontSize: 14 }} />
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <button type="button" onClick={() => setDatesModal(null)}
                  style={{ flex: 1, padding: '11px 0', background: C.lightGray, color: C.darkGray, border: `1px solid ${C.border}`, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                  Cancel
                </button>
                <button type="submit"
                  style={{ flex: 1, padding: '11px 0', background: C.forestGreen, color: '#fff', border: `1px solid ${C.darkGreen}`, fontWeight: 700, fontSize: 13, cursor: 'pointer', boxShadow: `0 3px 0 ${C.darkGreen}` }}>
                  Confirm Dates
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── CONFIRM MODAL ── */}
      {confirmAction && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#fff', maxWidth: 460, width: '100%', border: `2px solid ${C.border}`, boxShadow: '8px 8px 0 rgba(0,0,0,0.2)', padding: '28px 26px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <AlertTriangle size={22} color={confirmAction.variant.includes('Delete') ? C.red : '#6D4C41'} />
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: C.darkGray }}>
                {confirmAction.variant.includes('Delete') ? 'Delete orders?' : 'Move orders to history?'}
              </h3>
            </div>
            <p style={{ fontSize: 14, color: C.textSec, lineHeight: 1.55, marginBottom: 4 }}>
              {confirmAction.variant.startsWith('bulk') ? (
                <>This will affect <strong style={{ color: C.darkGray }}>{confirmAction.count ?? terminalOrders.length} order(s)</strong>{confirmAction.count != null ? ' that are completed.' : ' that are completed or cancelled.'}</>
              ) : (
                <>Order <strong style={{ color: C.darkGray }}>{confirmAction.orderNumber || `#${confirmAction.id}`}</strong> is completed or cancelled.</>
              )}
            </p>
            {confirmAction.variant.includes('Delete') ? (
              <p style={{ fontSize: 13, color: C.red, fontWeight: 600, margin: 0 }}>
                Deleted orders are hidden from the dashboard and cannot be viewed again.
              </p>
            ) : (
              <p style={{ fontSize: 13, color: C.textSec, margin: 0 }}>
                Orders can be restored later from the History page.
              </p>
            )}
            <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
              <button
                onClick={() => setConfirmAction(null)}
                style={{ flex: 1, padding: '11px 0', background: C.lightGray, color: C.darkGray, border: `1px solid ${C.border}`, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={runConfirm}
                style={{ flex: 1, padding: '11px 0', background: confirmAction.variant.includes('Delete') ? '#C62828' : '#6D4C41', color: '#fff', border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer', boxShadow: `0 3px 0 ${confirmAction.variant.includes('Delete') ? '#8E0000' : '#4E342E'}` }}
              >
                {confirmAction.variant.includes('Delete') ? 'Yes, Delete' : 'Yes, Move to History'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgriRentOrders;
