import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../../services/apiClient';
import {
  Car, User, Calendar, FileText, Archive, Trash2, RotateCcw, AlertTriangle,
} from 'lucide-react';
import SegmentedSpinner from '../../../components/ui/SegmentedSpinner';

/* ─────────────── COLOR TOKENS ─────────────── */
const C = {
  forestGreen: '#228B22',
  darkGreen:   '#1B5E20',
  emerald:     '#2E8B57',
  sage:        '#A5D6A7',
  earthBrown:  '#8D6E63',
  white:       '#FFFFFF',
  lightGray:   '#F5F5F5',
  darkGray:    '#424242',
  red:         '#F44336',
  border:      '#8D6E63',
  textSec:     '#616161',
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

const StatusBadge = ({ code }) => {
  const cfg = STATUS_CFG[code] || { bg: '#F5F5F5', color: '#424242', border: '#BDBDBD' };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '4px 10px', background: cfg.bg, color: cfg.color,
      border: `1.5px solid ${cfg.border}`,
      fontSize: 11, fontWeight: 700, letterSpacing: '0.03em',
      textTransform: 'uppercase', whiteSpace: 'nowrap',
    }}>
      <span style={{ width: 7, height: 7, background: cfg.color, display: 'inline-block', flexShrink: 0 }} />
      {STATUS_LABELS[code] || code}
    </span>
  );
};

/* ─────────────── TOAST ─────────────── */
const Toast = ({ toasts, remove }) => (
  <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 10 }}>
    {toasts.map(t => {
      const bg = t.type === 'success' ? C.emerald : t.type === 'error' ? C.red : C.darkGreen;
      return (
        <div key={t.id} style={{
          background: bg, color: '#fff', padding: '12px 18px',
          boxShadow: '4px 4px 0px rgba(0,0,0,0.25)', fontSize: 13, fontWeight: 600,
          minWidth: 240, maxWidth: 340, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12,
        }}>
          <span>{t.message}</span>
          <button onClick={() => remove(t.id)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 16 }}>×</button>
        </div>
      );
    })}
  </div>
);

/* ─────────────── INLINE STYLES ─────────────── */
const S = {
  page: { width: '100%', minHeight: '100vh', background: C.white, fontFamily: '"Inter", system-ui, sans-serif', color: C.darkGray, boxSizing: 'border-box' },
  banner: { background: C.darkGreen, borderBottom: `3px solid ${C.earthBrown}`, padding: '0 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', minHeight: 70 },
  bannerLeft: { display: 'flex', alignItems: 'center', gap: 12 },
  bannerTitle: { color: '#fff', fontSize: '1.35rem', fontWeight: 800, letterSpacing: '0.01em', margin: 0 },
  bannerSub: { color: C.sage, fontSize: '0.8rem', margin: '2px 0 0', fontWeight: 500 },
  btnGrey: { display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 18px', background: '#6D4C41', color: '#fff', border: '1px solid #4E342E', fontWeight: 700, fontSize: 13, cursor: 'pointer', boxShadow: '0 4px 0 #4E342E', transition: 'all 0.12s' },
  btnRefresh: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, background: 'rgba(255,255,255,0.12)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)', cursor: 'pointer', boxShadow: '0 3px 0 rgba(0,0,0,0.3)', transition: 'all 0.12s' },
  tableWrap: { background: C.white, border: `1px solid ${C.border}`, borderTop: 'none', overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', minWidth: 900 },
  thead: { background: C.darkGreen },
  th: { padding: '13px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.06em', borderRight: `1px solid ${C.emerald}`, whiteSpace: 'nowrap' },
  td: { padding: '13px 14px', borderBottom: `1px solid #E0E0E0`, borderRight: `1px solid #F5F5F5`, verticalAlign: 'top', fontSize: 13 },
  empty: { padding: '4rem 2rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 },
};

/* ─────────────── MAIN COMPONENT ─────────────── */
const RentalOrdersHistory = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState([]);
  const [confirmAction, setConfirmAction] = useState(null); // { variant, id, orderNumber }

  const toast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts(p => [...p, { id, message, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4500);
  }, []);
  const removeToast = useCallback(id => setToasts(p => p.filter(t => t.id !== id)), []);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get('/rental-orders/history');
      setOrders(res.data || []);
    } catch (err) {
      console.error(err);
      toast('Failed to load history. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const runConfirm = async () => {
    const action = confirmAction;
    setConfirmAction(null);
    if (!action) return;
    try {
      const res = action.variant === 'restore'
        ? await axios.post(`/rental-orders/${action.id}/restore`)
        : await axios.delete(`/rental-orders/${action.id}`);
      toast(res.message || 'Done', 'success');
      load();
    } catch (err) {
      toast(err?.response?.data?.message || err.message || 'Action failed', 'error');
    }
  };

  return (
    <div className="ro-page" style={S.page}>
      <Toast toasts={toasts} remove={removeToast} />

      {/* ── TOP BANNER ── */}
      <div style={S.banner}>
        <div style={S.bannerLeft}>
          <Archive size={26} color={C.sage} />
          <div>
            <h1 style={S.bannerTitle}>Rental Order History</h1>
            <p style={S.bannerSub}>Completed, cancelled and rejected orders moved out of the active list</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', paddingBottom: 4 }}>
          <button style={S.btnRefresh} onClick={() => { load(); toast('History refreshed.', 'success'); }} title="Refresh">
            <SegmentedSpinner size={17} />
          </button>
          <button
            style={S.btnGrey}
            onMouseEnter={e => { e.currentTarget.style.background = '#795548'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#6D4C41'; }}
            onMouseDown={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(4px)'; }}
            onMouseUp={e => { e.currentTarget.style.boxShadow = '0 4px 0 #4E342E'; e.currentTarget.style.transform = 'translateY(0)'; }}
            onClick={() => navigate('/car-renting/manager/orders')}
          >
            <Car size={16} /> Back to Orders
          </button>
        </div>
      </div>

      {/* ── TABLE ── */}
      <div style={S.tableWrap}>
        <table style={S.table}>
          <thead style={S.thead}>
            <tr>
              {['#', 'Order Info', 'Customer', 'Vehicle / Dates', 'Financials', 'Status', 'Archived', 'Actions'].map((h, i) => (
                <th key={h} style={{ ...S.th, textAlign: i === 7 ? 'center' : 'left', width: i === 0 ? 40 : 'auto' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} style={{ ...S.td, textAlign: 'center', padding: '3.5rem', color: C.emerald, fontWeight: 700 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                    <SegmentedSpinner size={28} />
                    Loading history...
                  </div>
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={8}>
                  <div style={S.empty}>
                    <Archive size={52} style={{ color: '#BDBDBD' }} />
                    <p style={{ fontSize: 15, fontWeight: 700, color: '#757575' }}>No orders in history</p>
                    <p style={{ fontSize: 13, color: '#9E9E9E' }}>Moved completed / cancelled orders appear here.</p>
                  </div>
                </td>
              </tr>
            ) : orders.map((order, idx) => {
              const carName = order.carName || (order.car ? `${order.car.brand || ''} ${order.car.model || ''}`.trim() : 'N/A');
              const startD = order.startDate || order.start_date;
              const endD = order.endDate || order.end_date;
              return (
                <tr key={order.id} style={{ background: idx % 2 === 0 ? C.white : C.lightGray }}>
                  <td style={{ ...S.td, color: C.textSec, fontSize: 12, fontWeight: 700 }}>{idx + 1}</td>

                  <td style={S.td}>
                    <div style={{ fontWeight: 800, color: C.darkGreen, fontSize: 14, marginBottom: 3 }}>
                      {order.orderNumber || order.order_number}
                      {(order.isManual || order.is_manual) && (
                        <span style={{ marginLeft: 7, fontSize: 9, background: '#E3F2FD', color: '#1565C0', padding: '2px 6px', fontWeight: 700, letterSpacing: '0.04em' }}>MANUAL</span>
                      )}
                    </div>
                    <div style={{ fontSize: 11, color: C.textSec, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Calendar size={11} /> {order.createdAt || order.created_at ? new Date(order.createdAt || order.created_at).toLocaleDateString() : '—'}
                    </div>
                  </td>

                  <td style={S.td}>
                    <div style={{ fontWeight: 700, color: C.darkGray, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                      <User size={13} color={C.forestGreen} /> {order.customerName || order.customer_name}
                    </div>
                    <div style={{ fontSize: 12, color: C.textSec }}>{order.customerPhone || order.customer_phone}</div>
                  </td>

                  <td style={S.td}>
                    <div style={{ fontWeight: 700, color: C.darkGray, fontSize: 13, marginBottom: 3, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Car size={13} color={C.emerald} /> {carName}
                    </div>
                    <div style={{ fontSize: 11, color: C.textSec }}>
                      {startD ? new Date(startD).toLocaleDateString() : '—'} → {endD ? new Date(endD).toLocaleDateString() : '—'}
                      &nbsp;·&nbsp;<strong>{order.totalDays || order.days || '—'} days</strong>
                    </div>
                  </td>

                  <td style={S.td}>
                    <div style={{ fontWeight: 900, color: C.forestGreen, fontSize: 15 }}>
                      {parseFloat(order.totalAmount || order.total_amount || 0).toLocaleString()} ETB
                    </div>
                    <div style={{ fontSize: 11, color: C.textSec }}>VAT: {parseFloat(order.vatAmount || order.vat_amount || 0).toLocaleString()} ETB</div>
                  </td>

                  <td style={S.td}>
                    <StatusBadge code={order.status} />
                  </td>

                  <td style={S.td}>
                    <div style={{ fontSize: 11, color: C.textSec, whiteSpace: 'nowrap' }}>
                      {order.archivedAt || order.archived_at ? new Date(order.archivedAt || order.archived_at).toLocaleString() : '—'}
                    </div>
                  </td>

                  <td style={{ ...S.td, textAlign: 'center' }}>
                    <div style={{ display: 'inline-flex', flexDirection: 'column', gap: 6, alignItems: 'stretch' }}>
                      <button
                        onClick={() => setConfirmAction({ variant: 'restore', id: order.id, orderNumber: order.orderNumber || order.order_number })}
                        style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '7px 16px', background: '#2E7D32', color: '#fff', border: '1px solid #1B5E20', fontWeight: 700, fontSize: 12, cursor: 'pointer', boxShadow: '0 3px 0 rgba(27,94,32,0.5)', transition: 'all 0.12s', whiteSpace: 'nowrap' }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#388E3C'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = '#2E7D32'; }}
                        onMouseDown={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(3px)'; }}
                        onMouseUp={e => { e.currentTarget.style.boxShadow = '0 3px 0 rgba(27,94,32,0.5)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                        title="Restore order to the active list"
                      >
                        <RotateCcw size={12} /> Restore
                      </button>
                      <button
                        onClick={() => setConfirmAction({ variant: 'delete', id: order.id, orderNumber: order.orderNumber || order.order_number })}
                        style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '7px 16px', background: '#C62828', color: '#fff', border: '1px solid #8E0000', fontWeight: 700, fontSize: 12, cursor: 'pointer', boxShadow: '0 3px 0 rgba(142,0,0,0.5)', transition: 'all 0.12s', whiteSpace: 'nowrap' }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#D32F2F'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = '#C62828'; }}
                        onMouseDown={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(3px)'; }}
                        onMouseUp={e => { e.currentTarget.style.boxShadow = '0 3px 0 rgba(142,0,0,0.5)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                        title="Delete order"
                      >
                        <Trash2 size={12} /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── CONFIRM MODAL ── */}
      {confirmAction && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#fff', maxWidth: 460, width: '100%', border: `2px solid ${C.border}`, boxShadow: '8px 8px 0 rgba(0,0,0,0.2)', padding: '28px 26px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <AlertTriangle size={22} color={confirmAction.variant === 'delete' ? C.red : '#2E7D32'} />
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: C.darkGray }}>
                {confirmAction.variant === 'delete' ? 'Delete order?' : 'Restore order?'}
              </h3>
            </div>
            <p style={{ fontSize: 14, color: C.textSec, lineHeight: 1.55, marginBottom: 4 }}>
              Order <strong style={{ color: C.darkGray }}>{confirmAction.orderNumber || `#${confirmAction.id}`}</strong> will be{' '}
              {confirmAction.variant === 'delete' ? 'deleted permanently and hidden from the dashboard.' : 'restored to the active orders list.'}
            </p>
            <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
              <button
                onClick={() => setConfirmAction(null)}
                style={{ flex: 1, padding: '11px 0', background: C.lightGray, color: C.darkGray, border: `1px solid ${C.border}`, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={runConfirm}
                style={{ flex: 1, padding: '11px 0', background: confirmAction.variant === 'delete' ? '#C62828' : '#2E7D32', color: '#fff', border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer', boxShadow: `0 3px 0 ${confirmAction.variant === 'delete' ? '#8E0000' : '#1B5E20'}` }}
              >
                {confirmAction.variant === 'delete' ? 'Yes, Delete' : 'Yes, Restore'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RentalOrdersHistory;