import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from '../../../services/apiClient';
import {
  Search, RefreshCw, ChevronLeft, ChevronRight,
  Clock, CheckCircle, XCircle, Car, User,
  Calendar, FileText, Plus, Archive, Trash2, AlertTriangle,
  Play, Ban, RotateCcw, ListChecks, X,
} from 'lucide-react';
import CarRentalOrderDetail  from './CarRentalOrderDetail';
import CarRentalCreateOrder  from './CarRentalCreateOrder';
import SegmentedSpinner from '../../../components/ui/SegmentedSpinner';
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

const TERMINAL_STATUSES = ['COMPLETED', 'CANCELLED', 'REJECTED'];
const STARTABLE_STATUSES = ['APPROVED', 'CONFIRMED'];

/* ─────────────── BADGE COMPONENTS ─────────────── */
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
  if (status === 'PAID' || status === 'Confirmed') { mod = 'success'; label = 'Payment Confirmed'; Icon = CheckCircle; }
  else if (status === 'REJECTED' || status === 'Rejected') { mod = 'danger'; label = 'Payment Rejected'; Icon = XCircle; }
  return (
    <span className={`ro2-badge ro2-badge--${mod}`}>
      <Icon size={12} /> {label}
    </span>
  );
};

/* ─────────────── TOAST ─────────────── */
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

/* ─────────────── HELPERS ─────────────── */
const DAY_MS = 86400000;
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString() : '—');
const fmtMoney = (v) => Number(v || 0).toLocaleString();

const rentalStats = (order) => {
  const start = new Date(order.pickupDate || order.pickup_date || order.start_date || order.startDate);
  const end = new Date(order.returnDate || order.return_date || order.endDate || order.end_date);
  const totalDays = Number(order.totalDays || order.total_days || order.days || Math.max(1, Math.ceil((end - start) / DAY_MS)));
  const begun = order.rentalStartTime || order.rental_start_time;
  const now = Date.now();
  const elapsedDays = begun ? Math.max(0, Math.floor((now - new Date(begun).getTime()) / DAY_MS)) : 0;
  const diff = end.getTime() - now;
  const overdue = diff < 0;
  const remaining = diff < 0 ? Math.abs(Math.ceil(diff / DAY_MS)) : Math.ceil(diff / DAY_MS);
  const pct = totalDays > 0 ? Math.min(100, Math.max(0, Math.round((elapsedDays / totalDays) * 100))) : 0;
  return { start, end, totalDays, began: begun, elapsedDays, remaining, overdue, pct };
};

/* ─────────────── MAIN COMPONENT ─────────────── */
const RentalOrders = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [orders,     setOrders]     = useState([]);
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 0 });
  const [loading,    setLoading]    = useState(true);
  const [filter,     setFilter]     = useState({ status: '', paymentStatus: '', search: '', page: 1 });
  const [toasts,     setToasts]     = useState([]);
  const [spinning,   setSpinning]   = useState(false);
  const [view,       setView]       = useState('list'); // 'list' | 'detail' | 'create'
  const [selectedId, setSelectedId] = useState(null);
  const [modal,      setModal]      = useState(null);   // { type, order }
  const [form,       setForm]       = useState({
    startNote: '', damageFee: '', fuelFee: '', lateFee: '', odometer: '',
    notes: '', cancelReason: '', status: '', statusNote: '',
  });

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

  /* ── Global navbar search listener ── */
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

  useEffect(() => {
    if (location.state?.autoSelectSearchItem) {
      const item = location.state.autoSelectSearchItem.item;
      if (item && (item.order_number || item.id || item.plate_number || item.name)) {
        const q = String(item.order_number || item.plate_number || item.name || item.id).toLowerCase();
        setFilter(f => ({ ...f, search: q, page: 1 }));
        if (typeof load === 'function') load({ ...filter, search: q, page: 1 });
      }
      navigate(location.pathname, { replace: true, state: {} });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

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

  const openModal = (type, order) => {
    setForm({ startNote: '', damageFee: '', fuelFee: '', lateFee: '', odometer: '', notes: '', cancelReason: '', status: '', statusNote: '' });
    setModal({ type, order });
  };

  const runModal = async () => {
    const m = modal;
    if (!m) return;
    const id = m.order.id;
    const oNum = m.order.orderNumber || m.order.order_number;
    try {
      if (m.type === 'start') {
        const res = await axios.post(`/rental-orders/${id}/start`, { notes: form.startNote });
        toast(res.message || `${oNum} started`, 'success');
      } else if (m.type === 'return') {
        const res = await axios.post(`/rental-orders/${id}/process-return`, {
          damageFee: form.damageFee || 0,
          fuelFee:   form.fuelFee   || 0,
          lateFee:   form.lateFee   || 0,
          odometer:  form.odometer  || null,
          notes:     form.notes     || '',
        });
        toast(res.message || `${oNum} completed — car released`, 'success');
      } else if (m.type === 'cancel') {
        const res = await axios.post(`/rental-orders/${id}/cancel`, { reason: form.cancelReason });
        toast(res.message || `${oNum} cancelled`, 'success');
      } else if (m.type === 'status') {
        const res = await axios.put(`/rental-orders/${id}/status`, { status: form.status, managerNote: form.statusNote });
        toast(res.message || `Status updated to ${form.status}`, 'success');
      } else if (m.type === 'archive') {
        const res = await axios.post(`/rental-orders/${id}/archive`);
        toast(res.message || `${oNum} moved to history`, 'success');
      } else if (m.type === 'delete') {
        const res = await axios.delete(`/rental-orders/${id}`);
        toast(res.message || `${oNum} deleted`, 'success');
      }
      setModal(null);
      load(filter);
    } catch (err) {
      toast(err?.response?.data?.message || err.message || 'Action failed', 'error');
    }
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
  const q = filter.search.trim().toLowerCase();
  const filteredOrders = q
    ? orders.filter(o =>
        (o.order_number || o.orderNumber || '').toLowerCase().includes(q) ||
        String(o.id || '').includes(q) ||
        (o.customer_name || o.customerName || '').toLowerCase().includes(q) ||
        (o.customer_phone || o.customerPhone || '').toLowerCase().includes(q)
      )
    : orders;

  const renderModal = () => {
    if (!modal) return null;
    const m = modal;
    const o = m.order;
    const oNum = o.orderNumber || o.order_number;
    const carName = o.carName || (o.car ? `${o.car.brand || ''} ${o.car.model || ''}`.trim() : 'N/A');

    const titleMap = {
      start:   'Start Rental',
      return:  'Complete Rental & Release Car',
      cancel:  'Cancel Order',
      status:  'Change Order Status',
      archive: 'Move Order to History',
      delete:  'Delete Order',
    };
    const iconMap = { start: Play, return: RotateCcw, cancel: Ban, status: ListChecks, archive: Archive, delete: Trash2 };
    const Icon = iconMap[m.type];

    return (
      <div className="ro2-overlay" onMouseDown={e => { if (e.target === e.currentTarget) setModal(null); }}>
        <div className="ro2-modal" role="dialog" aria-modal="true" aria-label={titleMap[m.type]}>
          <div className="ro2-modal__head">
            <h3 className="ro2-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Icon size={18} style={{ color: 'hsl(var(--primary-strong))' }} /> {titleMap[m.type]}
            </h3>
            <button className="ro2-close" onClick={() => setModal(null)} aria-label="Close"><X size={16} /></button>
          </div>

          <div className="ro2-modal__body">
            <p>
              <strong>{oNum}</strong> · {carName} · {fmtDate(o.pickupDate || o.pickup_date)} → {fmtDate(o.returnDate || o.return_date)}
            </p>

            {m.type === 'start' && (
              <>
                <p>Confirm that the car has been handed over. The day counter starts now and the vehicle is marked as rented.</p>
                <div className="ro2-field">
                  <label className="ro2-label" htmlFor="start-note">Handover note (optional)</label>
                  <textarea id="start-note" className="ro2-textarea" value={form.startNote} onChange={e => setForm(f => ({ ...f, startNote: e.target.value }))} placeholder="Odometer reading, condition notes, driver remarks…" />
                </div>
              </>
            )}

            {m.type === 'return' && (
              <>
                <p>Record the return details. Additional charges are settled against the security deposit; the car is released back to <strong>Available</strong>.</p>
                <div className="ro2-field">
                  <label className="ro2-label">Extra charges (optional)</label>
                  <div className="ro2-input-num">
                    <input className="ro2-input" type="number" min="0" placeholder="Damage ETB" value={form.damageFee} onChange={e => setForm(f => ({ ...f, damageFee: e.target.value }))} />
                    <input className="ro2-input" type="number" min="0" placeholder="Fuel ETB" value={form.fuelFee} onChange={e => setForm(f => ({ ...f, fuelFee: e.target.value }))} />
                    <input className="ro2-input" type="number" min="0" placeholder="Late ETB" value={form.lateFee} onChange={e => setForm(f => ({ ...f, lateFee: e.target.value }))} />
                  </div>
                </div>
                <div className="ro2-field">
                  <div className="ro2-input-num">
                    <input className="ro2-input" type="number" min="0" placeholder="Return odometer (km)" value={form.odometer} onChange={e => setForm(f => ({ ...f, odometer: e.target.value }))} />
                  </div>
                </div>
                <div className="ro2-field">
                  <label className="ro2-label" htmlFor="ret-notes">Return notes (optional)</label>
                  <textarea id="ret-notes" className="ro2-textarea" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Condition, scratches, fuel level…" />
                </div>
              </>
            )}

            {m.type === 'cancel' && (
              <>
                <p>The car will be released back to <strong>Available</strong> immediately.</p>
                <div className="ro2-field">
                  <label className="ro2-label" htmlFor="cancel-reason">Cancellation reason (required)</label>
                  <textarea id="cancel-reason" className="ro2-textarea" value={form.cancelReason} onChange={e => setForm(f => ({ ...f, cancelReason: e.target.value }))} placeholder="Customer request, no-show, payment issue…" />
                </div>
                <p className="ro2-hint ro2-hint--danger"><AlertTriangle size={14} style={{ verticalAlign: 'text-bottom' }} /> This cannot be undone from the manager page.</p>
              </>
            )}

            {m.type === 'status' && (
              <>
                <div className="ro2-field">
                  <label className="ro2-label" htmlFor="stat-sel">Set status to</label>
                  <select id="stat-sel" className="ro2-select" style={{ width: '100%' }} value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                    <option value="" disabled>Select a status…</option>
                    {Object.entries(STATUS_LABELS)
                      .filter(([k]) => k !== o.status)
                      .map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div className="ro2-field">
                  <label className="ro2-label" htmlFor="stat-note">Manager note (optional)</label>
                  <textarea id="stat-note" className="ro2-textarea" value={form.statusNote} onChange={e => setForm(f => ({ ...f, statusNote: e.target.value }))} placeholder="Why is the status changing?" />
                </div>
                <p className="ro2-hint">Car availability is kept in sync automatically when you move bookings to On Rent or complete them.</p>
              </>
            )}

            {m.type === 'archive' && (
              <>
                <p>Move <strong>{oNum}</strong> to history? It can be restored later from the History page.</p>
              </>
            )}

            {m.type === 'delete' && (
              <>
                <p>Delete <strong>{oNum}</strong> permanently? Deleted orders are hidden and cannot be viewed again.</p>
                <p className="ro2-hint ro2-hint--danger"><AlertTriangle size={14} style={{ verticalAlign: 'text-bottom' }} /> This action is irreversible.</p>
              </>
            )}
          </div>

          <div className="ro2-modal__actions">
            <button className="ro2-btn ro2-btn--ghost" onClick={() => setModal(null)}>Cancel</button>
            {m.type === 'cancel' && (
              <button
                className="ro2-btn ro2-btn--danger"
                disabled={!form.cancelReason.trim()}
                onClick={runModal}
              >
                Cancel Order
              </button>
            )}
            {m.type === 'status' && (
              <button className="ro2-btn ro2-btn--primary" disabled={!form.status} onClick={runModal}>Update Status</button>
            )}
            {m.type === 'archive' && (
              <button className="ro2-btn ro2-btn--primary" onClick={runModal}>Move to History</button>
            )}
            {m.type === 'delete' && (
              <button className="ro2-btn ro2-btn--danger" onClick={runModal}>Yes, Delete</button>
            )}
            {m.type === 'start' && (
              <button className="ro2-btn ro2-btn--success" onClick={runModal}><Play size={15} /> Start Rental</button>
            )}
            {m.type === 'return' && (
              <button className="ro2-btn ro2-btn--primary" onClick={runModal}><RotateCcw size={15} /> Complete & Release</button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="ro2">
      <Toast toasts={toasts} remove={removeToast} />

      {/* ── HEADER ── */}
      <header className="ro2-card ro2-header">
        <div className="ro2-header__left">
          <span className="ro2-header__icon"><Car size={22} /></span>
          <div>
            <h1 className="ro2-heading">Car Rental Orders</h1>
            <p className="ro2-sub">Bookings, live rental lifecycle and vehicle handover</p>
          </div>
        </div>
        <div className="ro2-actions">
          <button className="ro2-icon-btn" onClick={handleRefresh} title="Refresh" aria-label="Refresh">
            <RefreshCw size={16} className={spinning ? 'ro2-spin' : ''} />
          </button>
          <button className="ro2-btn ro2-btn--ghost" onClick={() => navigate('/car-renting/manager/orders-history')}>
            <Archive size={15} /> History
          </button>
          <button className="ro2-btn ro2-btn--primary" onClick={() => setView('create')}>
            <Plus size={16} /> New Manual Order
          </button>
        </div>
      </header>

      {/* ── KPI STATS ── */}
      <section className="ro2-stats">
        {[
          { label: 'Total Orders',     val: stats.total,      cls: '',                    isActive: filter.status === '' && filter.paymentStatus === '', reset: true },
          { label: 'Pending Approval', val: stats.pending,    cls: 'ro2-stat--warn',      isActive: filter.status === 'PENDING_APPROVAL', filterKey: 'status', filterVal: 'PENDING_APPROVAL' },
          { label: 'On Rent Now',      val: stats.active,     cls: 'ro2-stat--info',      isActive: filter.status === 'ACTIVE', filterKey: 'status', filterVal: 'ACTIVE' },
          { label: 'Awaiting Payment', val: stats.payPending, cls: 'ro2-stat--danger',    isActive: filter.paymentStatus === 'PENDING', filterKey: 'paymentStatus', filterVal: 'PENDING' },
        ].map(s => {
          const active = s.reset
            ? s.isActive
            : filter[s.filterKey] === s.filterVal;
          return (
            <button
              key={s.label}
              className={`ro2-stat ${s.cls} ${active ? 'ro2-stat--active' : ''}`}
              onClick={() => {
                if (s.reset) setFilter(f => ({ ...f, status: '', paymentStatus: '', page: 1 }));
                else setFilter(f => ({ ...f, status: '', paymentStatus: '', page: 1, [s.filterKey]: s.filterVal }));
              }}
            >
              <div className="ro2-stat__num">{s.val}</div>
              <div className="ro2-stat__label">{s.label}</div>
            </button>
          );
        })}
      </section>

      {/* ── FILTER BAR ── */}
      <div className="ro2-card ro2-filters">
        <div className="ro2-search">
          <Search size={15} className="ro2-search__icon" />
          <input
            className="ro2-input"
            placeholder="Search by Order #, Customer, Phone…"
            value={filter.search}
            onChange={e => setFilter(f => ({ ...f, search: e.target.value, page: 1 }))}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            aria-label="Search orders"
          />
        </div>
        <select className="ro2-select" value={filter.status} onChange={e => setFilter(f => ({ ...f, status: e.target.value, page: 1 }))} aria-label="Filter by status">
          <option value="">All Statuses</option>
          {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select className="ro2-select" value={filter.paymentStatus} onChange={e => setFilter(f => ({ ...f, paymentStatus: e.target.value, page: 1 }))} aria-label="Filter by payment">
          <option value="">All Payments</option>
          <option value="PENDING">Pending</option>
          <option value="PAID">Paid / Confirmed</option>
          <option value="REJECTED">Rejected</option>
        </select>
        <button className="ro2-btn ro2-btn--primary" onClick={handleSearch}><Search size={15} /> Search</button>
      </div>

      {/* ── TABLE ── */}
      <div className="ro2-card ro2-table-wrap">
        <table className="ro2-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Order Info</th>
              <th>Customer</th>
              <th>Vehicle / Rental Days</th>
              <th>Financials</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7}>
                  <div className="ro2-loading">
                    <SegmentedSpinner size={26} /> Loading orders…
                  </div>
                </td>
              </tr>
            ) : filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <div className="ro2-empty">
                    <FileText size={44} style={{ color: 'hsl(var(--muted))' }} />
                    <p className="ro2-empty__title">No orders found</p>
                    <p className="ro2-empty__hint">Try adjusting your filters or create a new manual order.</p>
                    <button className="ro2-btn ro2-btn--primary" style={{ marginTop: '0.5rem' }} onClick={() => setView('create')}>
                      <Plus size={15} /> Create First Order
                    </button>
                  </div>
                </td>
              </tr>
            ) : filteredOrders.map((order, idx) => {
              const isManualOrder = !!(order.isManual || order.is_manual);
              const isTerminal = TERMINAL_STATUSES.includes(order.status);
              const isStartable = STARTABLE_STATUSES.includes(order.status);
              const r = rentalStats(order);
              const carName = order.carName || (order.car ? `${order.car.brand || ''} ${order.car.model || ''}`.trim() : 'N/A');
              return (
                <tr key={order.id}>
                  <td className="ro2-rownum">{(pagination.page - 1) * 25 + idx + 1}</td>

                  <td>
                    <div className="ro2-order">
                      <span className="ro2-order__id">{order.orderNumber || order.order_number}</span>
                      {isManualOrder && <span className="ro2-tag ro2-tag--manual">MANUAL</span>}
                    </div>
                    <div className="ro2-meta"><Calendar size={12} /> {fmtDate(order.createdAt || order.created_at)}</div>
                  </td>

                  <td>
                    <div className="ro2-name"><User size={13} /> {order.customerName || order.customer_name}</div>
                    <div className="ro2-meta ro2-muted">{order.customerPhone || order.customer_phone}</div>
                  </td>

                  <td>
                    <div className="ro2-name"><Car size={13} /> {carName}</div>
                    <div className="ro2-meta">
                      {fmtDate(r.start)} → {fmtDate(r.end)}
                    </div>
                    <div className="ro2-rental">
                      <div className="ro2-bar-label">
                        <span><strong>{order.status === 'ACTIVE' && r.began ? `Day ${r.elapsedDays + 1}` : r.totalDays + ' days'}</strong>
                          {order.status === 'ACTIVE' && r.began && ` of ${r.totalDays} days`}
                        </span>
                        {order.status === 'ACTIVE' && r.began && (
                          r.overdue
                            ? <span className="ro2-days-remain ro2-days-overdue">Overdue {r.remaining} day(s)</span>
                            : <span className="ro2-days-remain"><Clock size={12} /> {r.remaining} day(s) left</span>
                        )}
                      </div>
                      {order.status === 'ACTIVE' && r.began && (
                        <div className="ro2-progress">
                          <div className={`ro2-progress__bar ${r.overdue ? 'ro2-progress__bar--overdue' : ''}`} style={{ width: `${r.pct}%` }} title={`${r.pct}% elapsed`} />
                        </div>
                      )}
                      {order.status === 'ACTIVE' && !r.began && (
                        <span className="ro2-days-remain"><Clock size={12} /> Not started — awaiting handover</span>
                      )}
                    </div>
                  </td>

                  <td>
                    <div className="ro2-amount">{fmtMoney(order.totalAmount || order.total_amount)} ETB</div>
                    <div className="ro2-meta ro2-muted">VAT: {fmtMoney(order.vatAmount || order.vat_amount)} ETB</div>
                    <div style={{ margin: '0.375rem 0' }}><PayBadge status={order.paymentStatus || order.payment_status} /></div>
                    {(order.paymentReference || order.payment_reference) && (
                      <div className="ro2-ref">Ref: {order.paymentReference || order.payment_reference}</div>
                    )}
                  </td>

                  <td><StatusBadge code={order.status} /></td>

                  <td>
                    <div className="ro2-actions-cell">
                      <button className="ro2-btn ro2-btn--ghost ro2-btn--sm" onClick={() => { setSelectedId(order.id); setView('detail'); }}>
                        <FileText size={13} /> View Detail
                      </button>
                      {isStartable && (
                        <button className="ro2-btn ro2-btn--success ro2-btn--sm" onClick={() => openModal('start', order)}>
                          <Play size={13} /> Start Rental
                        </button>
                      )}
                      {order.status === 'ACTIVE' && (
                        <button className="ro2-btn ro2-btn--primary ro2-btn--sm" onClick={() => openModal('return', order)}>
                          <RotateCcw size={13} /> Complete / Return
                        </button>
                      )}
                      {!isTerminal && (
                        <button className="ro2-btn ro2-btn--danger ro2-btn--sm" onClick={() => openModal('cancel', order)}>
                          <Ban size={13} /> Cancel
                        </button>
                      )}
                      {!isTerminal && (
                        <button className="ro2-btn ro2-btn--outline ro2-btn--sm" onClick={() => openModal('status', order)}>
                          <ListChecks size={13} /> Set Status
                        </button>
                      )}
                      {isTerminal && !isManualOrder && (
                        <>
                          <button className="ro2-btn ro2-btn--ghost ro2-btn--sm" onClick={() => openModal('archive', order)}>
                            <Archive size={13} /> To History
                          </button>
                          <button className="ro2-btn ro2-btn--danger ro2-btn--sm" onClick={() => openModal('delete', order)}>
                            <Trash2 size={13} /> Delete
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── PAGINATION ── */}
      {!loading && pagination.totalPages > 1 && (
        <div className="ro2-card ro2-footer">
          <span className="ro2-footer__info">
            Page <strong>{pagination.page}</strong> of <strong>{pagination.totalPages}</strong> · {pagination.total} total orders
          </span>
          <div className="ro2-pagination">
            <button className="ro2-btn ro2-btn--ghost ro2-btn--sm" disabled={pagination.page === 1} onClick={() => setFilter(f => ({ ...f, page: f.page - 1 }))}>
              <ChevronLeft size={15} /> Previous
            </button>
            <button className="ro2-btn ro2-btn--ghost ro2-btn--sm" disabled={pagination.page === pagination.totalPages} onClick={() => setFilter(f => ({ ...f, page: f.page + 1 }))}>
              Next <ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}

      {/* ── MODAL ── */}
      {renderModal()}
    </div>
  );
};

export default RentalOrders;