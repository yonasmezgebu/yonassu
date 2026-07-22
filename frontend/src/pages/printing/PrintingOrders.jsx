import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../services/apiClient';
import {
  Search, RefreshCw, ChevronLeft, ChevronRight,
  CreditCard, Clock, CheckCircle, AlertTriangle, XCircle,
  Printer, User, Calendar, DollarSign, FileText, Eye
} from 'lucide-react';

const STATUSES = ['', 'received', 'in_queue', 'in_design', 'file_check', 'in_printing', 'in_progress', 'finishing', 'ready', 'delivered', 'cancelled'];
const STATUS_LABELS = {
  received: 'Received', in_queue: 'Job Queue', in_design: 'In Design',
  file_check: 'File Check', in_printing: 'In Printing', in_progress: 'In Progress',
  finishing: 'Finishing', ready: 'Ready for Pickup', delivered: 'Delivered', cancelled: 'Cancelled'
};
const PAYMENT_STATUSES = ['', 'Pending', 'Confirmed', 'Rejected'];

const JOB_STATUS_CONFIG = {
  received:    { label: 'Received',          bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe', dot: '#87CEEB' },
  in_queue:    { label: 'Job Queue',         bg: '#f0fdf4', color: '#4d7c0f', border: '#bbf7d0', dot: '#8BC34A' },
  in_design:   { label: 'In Design',         bg: '#f7fee7', color: '#6B8E23', border: '#d9f99d', dot: '#6B8E23' },
  file_check:  { label: 'File Check',        bg: '#fffbeb', color: '#d97706', border: '#fde68a', dot: '#FF9800' },
  in_printing: { label: 'In Printing',       bg: '#ecfdf5', color: '#2E8B57', border: '#a7f3d0', dot: '#2E8B57' },
  in_progress: { label: 'In Progress',       bg: '#ecfdf5', color: '#059669', border: '#6ee7b7', dot: '#2E8B57' },
  finishing:   { label: 'Finishing',         bg: '#f0fdf4', color: '#228B22', border: '#bbf7d0', dot: '#228B22' },
  ready:       { label: 'Ready for Pickup',  bg: '#dcfce7', color: '#15803d', border: '#86efac', dot: '#4CAF50' },
  delivered:   { label: 'Delivered',         bg: '#ecfdf5', color: '#1B5E20', border: '#6ee7b7', dot: '#1B5E20' },
  cancelled:   { label: 'Cancelled',         bg: '#fef2f2', color: '#dc2626', border: '#fecaca', dot: '#ef4444' },
};

const PAYMENT_CONFIG = {
  Pending:   { label: '⏳ Awaiting Payment', bg: '#fff7ed', color: '#c2410c', border: '#fed7aa', icon: Clock },
  Confirmed: { label: '✅ Payment Confirmed', bg: '#f0fdf4', color: '#15803d', border: '#86efac', icon: CheckCircle },
  Rejected:  { label: '❌ Payment Rejected',  bg: '#fef2f2', color: '#dc2626', border: '#fecaca', icon: XCircle },
};

const PaymentBadge = ({ status }) => {
  const cfg = PAYMENT_CONFIG[status] || { label: '⏳ Awaiting Payment', bg: '#fff7ed', color: '#c2410c', border: '#fed7aa' };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '5px 12px', borderRadius: 999, fontSize: 11, fontWeight: 700,
      background: cfg.bg, color: cfg.color,
      border: `1.5px solid ${cfg.border}`,
      whiteSpace: 'nowrap',
      boxShadow: `0 1px 4px ${cfg.border}80`
    }}>
      {cfg.label}
    </span>
  );
};

const JobStatusBadge = ({ code, name }) => {
  const cfg = JOB_STATUS_CONFIG[code] || { label: name || code, bg: '#f8fafc', color: '#64748b', border: '#e2e8f0', dot: '#94a3b8' };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '5px 12px', borderRadius: 999, fontSize: 11, fontWeight: 700,
      background: cfg.bg, color: cfg.color, border: `1.5px solid ${cfg.border}`
    }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: cfg.dot, flexShrink: 0 }} />
      {cfg.label}
    </span>
  );
};

const PrintingOrders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ status: '', paymentStatus: '', search: '', page: 1 });

  const load = useCallback(async (currentFilter) => {
    try {
      setLoading(true);
      const params = { page: currentFilter.page, limit: 25 };
      if (currentFilter.status) params.status = currentFilter.status;
      if (currentFilter.search) params.search = currentFilter.search;
      const res = await axios.get('/printing/orders', { params });
      if (res.status === 'success') {
        setOrders(res.data?.orders || []);
        setPagination(res.data?.pagination || { page: 1, total: 0, totalPages: 0 });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Re-fetch whenever status, search page changes (all backend-filterable fields)
  useEffect(() => { load(filter); }, [filter.page, filter.status, load]);

  const handleSearch = () => {
    // Pass fresh filter directly so no stale closure issues
    const fresh = { ...filter, page: 1 };
    setFilter(fresh);
    load(fresh);
  };

  // Client-side filter for payment status
  const displayedOrders = filter.paymentStatus
    ? orders.filter(o => (o.payment_status || 'Pending') === filter.paymentStatus)
    : orders;

  const pendingPaymentCount = orders.filter(o => !o.payment_status || o.payment_status === 'Pending').length;
  const confirmedCount = orders.filter(o => o.payment_status === 'Confirmed').length;

  return (
    <div style={{ padding: '2rem', minHeight: '100vh', background: '#f8fafc', fontFamily: "'Inter', sans-serif" }}>

      {/* ── HEADER ── */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ background: 'linear-gradient(135deg, #059669, #047857)', borderRadius: 14, padding: 10, boxShadow: '0 4px 12px rgba(5,150,105,0.3)' }}>
              <Printer size={26} color="#fff" />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.7rem', fontWeight: 900, color: '#064e3b' }}>Printing Orders</h2>
              <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>Supervisor Overview — Monitor job and payment status</p>
            </div>
          </div>
          <button onClick={() => load(filter.page)} style={{
            display: 'flex', alignItems: 'center', gap: 7,
            background: 'white', border: '1.5px solid #d1fae5',
            padding: '10px 18px', borderRadius: 10, cursor: 'pointer',
            color: '#059669', fontSize: 13, fontWeight: 700,
            boxShadow: '0 2px 6px rgba(5,150,105,0.1)',
            transition: 'all 0.2s'
          }}
            onMouseOver={e => e.currentTarget.style.background = '#ecfdf5'}
            onMouseOut={e => e.currentTarget.style.background = 'white'}
          >
            <RefreshCw size={15} /> Refresh
          </button>
        </div>
      </div>

      {/* ── PAYMENT STATUS SUMMARY CARDS ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
        {[
          {
            label: 'Awaiting Payment',
            count: pendingPaymentCount,
            icon: Clock,
            bg: 'linear-gradient(135deg, #fff7ed, #fed7aa)',
            color: '#c2410c',
            border: '#fed7aa',
            shadow: 'rgba(194,65,12,0.15)',
            action: () => setFilter(f => ({ ...f, paymentStatus: f.paymentStatus === 'Pending' ? '' : 'Pending' })),
            active: filter.paymentStatus === 'Pending'
          },
          {
            label: 'Payment Confirmed',
            count: confirmedCount,
            icon: CheckCircle,
            bg: 'linear-gradient(135deg, #f0fdf4, #bbf7d0)',
            color: '#15803d',
            border: '#86efac',
            shadow: 'rgba(21,128,61,0.15)',
            action: () => setFilter(f => ({ ...f, paymentStatus: f.paymentStatus === 'Confirmed' ? '' : 'Confirmed' })),
            active: filter.paymentStatus === 'Confirmed'
          },
          {
            label: 'Total Orders',
            count: orders.length,
            icon: FileText,
            bg: 'linear-gradient(135deg, #eff6ff, #bfdbfe)',
            color: '#1d4ed8',
            border: '#93c5fd',
            shadow: 'rgba(29,78,216,0.12)',
            action: () => setFilter(f => ({ ...f, paymentStatus: '' })),
            active: filter.paymentStatus === ''
          }
        ].map(({ label, count, icon: Icon, bg, color, border, shadow, action, active }) => (
          <button key={label} onClick={action} style={{
            background: bg, border: `2px solid ${active ? color : border}`,
            borderRadius: 16, padding: '20px 24px',
            cursor: 'pointer', textAlign: 'left',
            boxShadow: active ? `0 6px 20px ${shadow}, 0 0 0 3px ${border}` : `0 3px 10px ${shadow}`,
            transform: active ? 'translateY(-2px)' : 'translateY(0)',
            transition: 'all 0.25s cubic-bezier(0.34,1.56,0.64,1)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
                {label}
              </div>
              <div style={{ fontSize: 32, fontWeight: 900, color, lineHeight: 1 }}>{count}</div>
              {active && <div style={{ fontSize: 11, color, marginTop: 4, fontWeight: 600 }}>● Filtered</div>}
            </div>
            <div style={{ background: color + '20', borderRadius: '50%', width: 52, height: 52, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon size={26} color={color} />
            </div>
          </button>
        ))}
      </div>

      {/* ── FILTERS ── */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', background: 'white', border: '1.5px solid #e2e8f0', borderRadius: 10, padding: '0 14px', flex: 1, minWidth: 220, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          <Search size={16} color="#94a3b8" />
          <input
            value={filter.search}
            onChange={e => setFilter(f => ({ ...f, search: e.target.value }))}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="Search by order # or customer..."
            style={{ border: 'none', outline: 'none', padding: '11px 10px', flex: 1, fontSize: 13, background: 'transparent', color: '#1e293b' }}
          />
        </div>

        <select value={filter.status} onChange={e => setFilter(f => ({ ...f, status: e.target.value, page: 1 }))}
          style={{ padding: '11px 14px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 13, background: 'white', color: '#475569', cursor: 'pointer', fontWeight: 600 }}>
          <option value="">All Job Statuses</option>
          {STATUSES.filter(Boolean).map(s => (
            <option key={s} value={s}>{STATUS_LABELS[s] || s.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>
          ))}
        </select>

        <select value={filter.paymentStatus} onChange={e => setFilter(f => ({ ...f, paymentStatus: e.target.value }))}
          style={{ padding: '11px 14px', border: `1.5px solid ${filter.paymentStatus ? '#f97316' : '#e2e8f0'}`, borderRadius: 10, fontSize: 13, background: filter.paymentStatus ? '#fff7ed' : 'white', color: filter.paymentStatus ? '#c2410c' : '#475569', cursor: 'pointer', fontWeight: 700 }}>
          <option value="">All Payment States</option>
          {PAYMENT_STATUSES.filter(Boolean).map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <button onClick={handleSearch} style={{
          padding: '11px 20px', background: 'linear-gradient(135deg, #059669, #047857)',
          border: 'none', borderRadius: 10, color: 'white', fontWeight: 700, fontSize: 13,
          cursor: 'pointer', boxShadow: '0 3px 10px rgba(5,150,105,0.3)'
        }}>
          Search
        </button>
      </div>

      {/* ── TABLE ── */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b' }}>
          <RefreshCw size={28} style={{ animation: 'spin 0.8s linear infinite', marginBottom: 12, display: 'block', margin: '0 auto 12px' }} />
          Loading orders...
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : displayedOrders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>
          <FileText size={40} style={{ marginBottom: 12, opacity: 0.4 }} />
          <p style={{ margin: 0, fontWeight: 600 }}>No orders found</p>
        </div>
      ) : (
        <>
          <div style={{ background: 'white', borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'linear-gradient(90deg, #f0fdf4, #ecfdf5)', borderBottom: '2px solid #d1fae5' }}>
                  {[
                    { label: 'Order #', icon: FileText },
                    { label: 'Customer', icon: User },
                    { label: 'Product / Specs', icon: Printer },
                    { label: 'Amount', icon: DollarSign },
                    { label: '💳 Payment Status', icon: null, highlight: true },
                    { label: 'Job Status', icon: null },
                    { label: 'Due Date', icon: Calendar },
                    { label: 'View', icon: null },
                  ].map(({ label, highlight }) => (
                    <th key={label} style={{
                      padding: '14px 16px', textAlign: 'left',
                      color: highlight ? '#c2410c' : '#064e3b',
                      fontWeight: 800, fontSize: highlight ? 12 : 11,
                      textTransform: 'uppercase', letterSpacing: '0.04em',
                      background: highlight ? 'rgba(251,191,36,0.08)' : 'transparent',
                      borderBottom: highlight ? '2px solid #fed7aa' : 'none'
                    }}>
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayedOrders.map((o, idx) => {
                  const isPendingPayment = !o.payment_status || o.payment_status === 'Pending';
                  return (
                    <tr
                      key={o.id}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        background: idx % 2 === 0 ? '#ffffff' : '#fafafa',
                        transition: 'background 0.15s'
                      }}
                      onMouseOver={e => e.currentTarget.style.background = '#f0fdf4'}
                      onMouseOut={e => e.currentTarget.style.background = idx % 2 === 0 ? '#ffffff' : '#fafafa'}
                    >
                      {/* Order # */}
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ fontWeight: 800, color: '#2563eb', fontSize: 13 }}>{o.order_number}</span>
                        <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                          {new Date(o.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                        </div>
                      </td>

                      {/* Customer */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg, #a7f3d0, #6ee7b7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: '#065f46', flexShrink: 0 }}>
                            {(o.customer_name || 'W').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: '#1e293b', fontSize: 13 }}>{o.customer_name || 'Walk-in'}</div>
                            {o.customer_phone && <div style={{ fontSize: 11, color: '#94a3b8' }}>{o.customer_phone}</div>}
                          </div>
                        </div>
                      </td>

                      {/* Product / Specs */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 700, color: '#1e293b' }}>{o.product_type}</div>
                        <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                          {o.paper_type} · {o.quantity} copies · {o.pages_per_copy} pages
                          {o.color_printing ? ' · 🎨 Color' : ' · ⬛ B&W'}
                        </div>
                      </td>

                      {/* Amount */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 800, color: '#059669', fontSize: 14 }}>
                          {parseFloat(o.total_price || 0).toLocaleString()} ETB
                        </div>
                      </td>

                      {/* PAYMENT STATUS — most prominent */}
                      <td style={{ padding: '14px 16px', background: isPendingPayment ? 'rgba(255,237,213,0.4)' : 'rgba(240,253,244,0.6)' }}>
                        <PaymentBadge status={o.payment_status} />
                        {o.payment_reference && (
                          <div style={{ fontSize: 10, color: '#6b7280', marginTop: 4, fontFamily: 'monospace', fontWeight: 700 }}>
                            Ref: {o.payment_reference}
                          </div>
                        )}
                        {isPendingPayment && (
                          <div style={{ fontSize: 10, color: '#c2410c', marginTop: 3, fontWeight: 700 }}>
                            ⚠ Not yet verified
                          </div>
                        )}
                      </td>

                      {/* Job Status */}
                      <td style={{ padding: '14px 16px' }}>
                        <JobStatusBadge code={o.status_code} name={o.status_name} />
                      </td>

                      {/* Due Date */}
                      <td style={{ padding: '14px 16px' }}>
                        {o.due_date ? (
                          <div style={{
                            color: new Date(o.due_date) < new Date() ? '#dc2626' : '#475569',
                            fontWeight: new Date(o.due_date) < new Date() ? 700 : 500,
                            fontSize: 12
                          }}>
                            {new Date(o.due_date) < new Date() ? '🔴 ' : ''}
                            {new Date(o.due_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </div>
                        ) : (
                          <span style={{ color: '#cbd5e1', fontSize: 12 }}>—</span>
                        )}
                      </td>

                      {/* View */}
                      <td style={{ padding: '14px 16px' }}>
                        <button
                          onClick={e => { e.stopPropagation(); navigate(`/printing/orders/${o.id}`); }}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            padding: '7px 14px', border: '1.5px solid #d1fae5',
                            borderRadius: 8, background: '#f0fdf4',
                            color: '#059669', fontWeight: 700, fontSize: 12,
                            cursor: 'pointer', transition: 'all 0.2s'
                          }}
                          onMouseOver={e => { e.currentTarget.style.background = '#059669'; e.currentTarget.style.color = '#fff'; }}
                          onMouseOut={e => { e.currentTarget.style.background = '#f0fdf4'; e.currentTarget.style.color = '#059669'; }}
                        >
                          <Eye size={13} /> View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Summary */}
          <div style={{ marginTop: 16, padding: '10px 20px', background: 'white', borderRadius: 10, border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13, color: '#64748b' }}>
            <span>Showing <strong style={{ color: '#1e293b' }}>{displayedOrders.length}</strong> orders</span>
            <div style={{ display: 'flex', gap: 20 }}>
              <span>⏳ <strong style={{ color: '#c2410c' }}>{pendingPaymentCount}</strong> awaiting payment</span>
              <span>✅ <strong style={{ color: '#15803d' }}>{confirmedCount}</strong> confirmed</span>
            </div>
          </div>

          {pagination.totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10, marginTop: 20 }}>
              <button disabled={filter.page <= 1} onClick={() => setFilter(f => ({ ...f, page: f.page - 1 }))}
                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '10px 18px', border: '1.5px solid #e2e8f0', borderRadius: 10, background: 'white', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#475569', opacity: filter.page <= 1 ? 0.4 : 1 }}>
                <ChevronLeft size={14} /> Prev
              </button>
              <span style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>Page {pagination.page} of {pagination.totalPages}</span>
              <button disabled={filter.page >= pagination.totalPages} onClick={() => setFilter(f => ({ ...f, page: f.page + 1 }))}
                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '10px 18px', border: '1.5px solid #e2e8f0', borderRadius: 10, background: 'white', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#475569', opacity: filter.page >= pagination.totalPages ? 0.4 : 1 }}>
                Next <ChevronRight size={14} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PrintingOrders;
