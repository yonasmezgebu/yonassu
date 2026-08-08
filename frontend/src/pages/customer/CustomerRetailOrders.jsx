import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../services/apiClient';
import {
  ClipboardList, Clock, CheckCircle, XCircle, RefreshCw,
  ArrowLeft, Calendar, DollarSign, Truck, Package,
  ShoppingCart, Eye, MapPin, CreditCard, Phone, Mail, User, Hash, FileText
} from 'lucide-react';

/* ─── helpers ─────────────────────────────────────────────── */
const BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1').replace('/api/v1', '');

const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${BASE}${path.startsWith('/') ? path : '/' + path}`.replace(/\\/g, '/');
};

const fmt = (n) => parseFloat(n || 0).toFixed(2);

/* ─── config ──────────────────────────────────────────────── */
const ORDER_STATUS = {
  PROCESSING:       { label: 'Processing',       color: '#FFFFFF', bg: '#8D6E63' },
  PACKING:          { label: 'Packing',           color: '#FFFFFF', bg: '#6B8E23' },
  SHIPPED:          { label: 'Shipped',           color: '#FFFFFF', bg: '#87CEEB' },
  DELIVERED:        { label: 'Delivered',         color: '#FFFFFF', bg: '#228B22' },
  CANCELLED:        { label: 'Cancelled',         color: '#FFFFFF', bg: '#F44336' },
};

const PAYMENT_STATUS = {
  AWAITING_PAYMENT: { label: 'Awaiting Payment', color: '#FFFFFF', bg: '#FF9800' },
  PAID:             { label: 'Paid',              color: '#FFFFFF', bg: '#228B22' },
  OVERDUE:          { label: 'Overdue',           color: '#FFFFFF', bg: '#F44336' },
};

const STATUS_TABS = [
  { key: 'ALL',        label: 'All Orders', Icon: ClipboardList },
  { key: 'PROCESSING', label: 'Processing', Icon: Clock },
  { key: 'SHIPPED',    label: 'Shipped',    Icon: Truck },
  { key: 'DELIVERED',  label: 'Delivered',  Icon: CheckCircle },
];

/* ─── shared styles injected once ────────────────────────── */
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

  .ro-page {
    padding: 32px;
    background: #F5F5F5;
    min-height: calc(100vh - 60px);
    box-sizing: border-box;
    font-family: 'Inter', sans-serif;
    color: #424242;
  }

  /* ── header row ── */
  .ro-page-header { display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 16px; margin-bottom: 24px; }
  .ro-page-title  { font-size: 2rem; font-weight: 700; color: #1B5E20; margin: 0; }
  .ro-page-sub    { font-size: 0.95rem; color: #424242; margin: 6px 0 0; }

  /* ── tabs ── */
  .ro-tabs { display: flex; gap: 8px; border-bottom: 1px solid #8D6E63; margin-bottom: 24px; overflow-x: auto; }
  .ro-tab  { background: transparent; border: none; border-bottom: 3px solid transparent; padding: 12px 24px; color: #424242; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: all 0.15s ease; font-size: 0.95rem; white-space: nowrap; }
  .ro-tab.active  { color: #228B22; border-bottom: 3px solid #228B22; }
  .ro-tab:hover:not(.active) { color: #228B22; }

  /* ── table ── */
  .ro-table-wrap { background: #FFFFFF; border: 1px solid #8D6E63; border-radius: 10px; overflow-x: auto; }
  .ro-table { width: 100%; border-collapse: collapse; text-align: left; }
  .ro-table th { background: #1B5E20; color: #FFFFFF; padding: 14px 20px; font-weight: 500; white-space: nowrap; }
  .ro-table th:first-child { border-radius: 10px 0 0 0; }
  .ro-table th:last-child  { border-radius: 0 10px 0 0; }
  .ro-table td { padding: 14px 20px; border-bottom: 1px solid #F5F5F5; }
  .ro-table-row { transition: background 0.15s ease; cursor: pointer; }
  .ro-table-row:nth-child(even) { background: #F5F5F5; }
  .ro-table-row:hover { background: #A5D6A7 !important; }
  .ro-table-row:last-child td { border-bottom: none; }

  /* ── detail layout ── */
  .ro-detail-wrap { background: #FFFFFF; border: 1px solid #8D6E63; border-radius: 12px; overflow: hidden; }

  .ro-detail-top {
    background: #1B5E20;
    padding: 28px 32px;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    flex-wrap: wrap;
    gap: 20px;
  }
  .ro-inv-number { font-size: 1.6rem; font-weight: 700; color: #FFFFFF; margin: 0 0 6px; }
  .ro-inv-date   { font-size: 0.9rem; color: rgba(255,255,255,0.75); display: flex; align-items: center; gap: 6px; }
  .ro-total-box  { text-align: right; }
  .ro-total-label { font-size: 0.8rem; color: rgba(255,255,255,0.7); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; }
  .ro-total-amt  { font-size: 2rem; font-weight: 700; color: #FFFFFF; line-height: 1; }

  /* ── status bar under header ── */
  .ro-status-bar { background: #F5F5F5; border-bottom: 1px solid #e0e0e0; padding: 14px 32px; display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }

  /* ── body sections ── */
  .ro-body { padding: 32px; }
  .ro-section { margin-bottom: 32px; }
  .ro-section:last-child { margin-bottom: 0; }
  .ro-section-title {
    font-size: 0.8rem; font-weight: 700; color: #228B22; text-transform: uppercase;
    letter-spacing: 0.08em; display: flex; align-items: center; gap: 8px;
    margin: 0 0 16px; padding-bottom: 10px; border-bottom: 1px solid #F5F5F5;
  }

  /* ── two-col info grid ── */
  .ro-info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0; }
  @media (max-width: 680px) { .ro-info-grid { grid-template-columns: 1fr; } }
  .ro-info-row { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid #F5F5F5; gap: 16px; }
  .ro-info-row:last-child { border-bottom: none; }
  .ro-info-label { font-size: 0.9rem; color: #757575; }
  .ro-info-value { font-size: 0.95rem; font-weight: 600; color: #424242; text-align: right; }

  /* ── order items table inside detail ── */
  .ro-items-table-wrap { border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; }
  .ro-items-table { width: 100%; border-collapse: collapse; text-align: left; }
  .ro-items-table th { background: #F5F5F5; color: #424242; padding: 11px 16px; font-size: 0.85rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; }
  .ro-items-table td { padding: 14px 16px; border-bottom: 1px solid #F5F5F5; vertical-align: middle; }
  .ro-items-table tr:last-child td { border-bottom: none; }

  /* ── totals summary ── */
  .ro-totals { margin-top: 12px; }
  .ro-total-line { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #F5F5F5; font-size: 0.95rem; color: #424242; }
  .ro-total-line.grand { padding: 14px 0; border-bottom: none; font-size: 1.15rem; font-weight: 700; color: #1B5E20; border-top: 2px solid #1B5E20; margin-top: 4px; }

  /* ── divider ── */
  .ro-divider { border: none; border-top: 1px solid #F5F5F5; margin: 24px 0; }

  /* ── product thumbnail ── */
  .ro-product-img { width: 52px; height: 52px; border-radius: 10px; object-fit: cover; background: #F5F5F5; transition: transform 0.15s ease; }
  .ro-product-img:hover { transform: scale(1.03); }
  .ro-product-placeholder { width: 52px; height: 52px; border-radius: 10px; background: #F5F5F5; display: flex; align-items: center; justify-content: center; }

  /* ── badge ── */
  .ro-badge { display: inline-flex; align-items: center; padding: 5px 12px; border-radius: 6px; font-size: 0.85rem; font-weight: 600; }

  /* ── buttons ── */
  .ro-btn-primary { background: #2E8B57; color: #FFFFFF; padding: 10px 20px; border-radius: 8px; border: none; cursor: pointer; font-size: 0.95rem; font-weight: 600; display: inline-flex; align-items: center; gap: 8px; transition: all 0.15s ease; }
  .ro-btn-primary:hover:not(:disabled) { background: #267347; transform: translateY(-1px); box-shadow: 0 4px 6px rgba(0,0,0,0.12); }
  .ro-btn-primary:disabled { opacity: 0.6; cursor: wait; }

  .ro-btn-secondary { background: #6B8E23; color: #FFFFFF; padding: 10px 20px; border-radius: 8px; border: none; cursor: pointer; font-size: 0.95rem; font-weight: 600; display: inline-flex; align-items: center; gap: 8px; transition: all 0.15s ease; }
  .ro-btn-secondary:hover { background: #55721c; transform: translateY(-1px); box-shadow: 0 4px 6px rgba(0,0,0,0.12); }

  .ro-btn-danger { background: #F44336; color: #FFFFFF; padding: 10px 20px; border-radius: 8px; border: none; cursor: pointer; font-size: 0.95rem; font-weight: 600; display: inline-flex; align-items: center; gap: 8px; transition: all 0.15s ease; }
  .ro-btn-danger:hover { background: #d32f2f; transform: translateY(-1px); box-shadow: 0 4px 6px rgba(0,0,0,0.12); }

  .ro-btn-sm { padding: 6px 12px; font-size: 0.85rem; border-radius: 6px; }

  /* ── empty state ── */
  .ro-empty { background: #FFFFFF; border: 1px solid #8D6E63; border-radius: 12px; padding: 64px 24px; text-align: center; }

  /* ── toast ── */
  .ro-toast { position: fixed; top: 24px; right: 24px; z-index: 9999; border-radius: 10px; color: #FFFFFF; padding: 16px 24px; font-weight: 500; box-shadow: 0 4px 12px rgba(0,0,0,0.2); animation: roSlide 0.3s ease-out forwards; }
  .ro-toast.success { background: #4CAF50; }
  .ro-toast.error   { background: #F44336; }
  .ro-toast.warning { background: #FF9800; }

  /* ── spin ── */
  .ro-spin { animation: roSpin 1s linear infinite; }

  @keyframes roSlide { from { transform: translateX(110%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
  @keyframes roSpin  { 100% { transform: rotate(360deg); } }

  @media (max-width: 720px) {
    .ro-page { padding: 16px; }
    .ro-detail-top { padding: 20px 16px; }
    .ro-body { padding: 16px; }
    .ro-status-bar { padding: 12px 16px; }
    .ro-table th, .ro-table td { padding: 12px; }
  }
`;

/* ═══════════════════════════════════════════════════════════
   COMPONENT
═══════════════════════════════════════════════════════════ */
export default function CustomerRetailOrders() {
  const [orders, setOrders]           = useState([]);
  const [loading, setLoading]         = useState(true);
  const [selectedOrder, setSelected]  = useState(null);
  const [activeTab, setActiveTab]     = useState('ALL');
  const [refreshing, setRefreshing]   = useState(false);
  const [notification, setNotif]      = useState(null);
  const navigate = useNavigate();

  const toast = (msg, type = 'success') => {
    setNotif({ msg, type });
    setTimeout(() => setNotif(null), 4000);
  };

  const fetchOrders = useCallback(async () => {
    try {
      const res = await axios.get('/retail/orders/my-orders');
      // API returns { status:'success', data: [...] }
      const list = res.data?.data ?? res.data ?? [];
      setOrders(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('Failed to load retail orders', err);
      toast('Failed to load orders.', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const res = await axios.get('/retail/orders/my-orders');
      const list = res.data?.data ?? res.data ?? [];
      setOrders(Array.isArray(list) ? list : []);
      toast('Orders refreshed.', 'success');
    } catch {
      toast('Failed to refresh orders.', 'error');
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const handleCancel = async (id) => {
    try {
      await axios.put(`/retail/orders/${id}/status`, { status: 'CANCELLED' });
      toast('Order cancelled successfully.');
      // update in-place so detail view refreshes instantly
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status: 'CANCELLED' } : o));
      setSelected(prev => prev?.id === id ? { ...prev, status: 'CANCELLED' } : prev);
    } catch (err) {
      toast(err.response?.data?.message || 'Cancellation failed. Please contact support.', 'error');
    }
  };

  const filtered = activeTab === 'ALL' ? orders : orders.filter(o => o.status === activeTab);

  /* ═══════════════════════════════════════════════════════════
     DETAIL VIEW — single full-page layout
  ═══════════════════════════════════════════════════════════ */
  if (selectedOrder) {
    const o   = selectedOrder;
    const ost = ORDER_STATUS[o.status]         || ORDER_STATUS.PROCESSING;
    const pst = PAYMENT_STATUS[o.payment_status] || null;
    const canCancel = ['PROCESSING', 'PACKING'].includes(o.status);

    return (
      <div className="ro-page">
        <style>{STYLES}</style>
        {notification && <div className={`ro-toast ${notification.type}`}>{notification.msg}</div>}

        {/* ── top nav row ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
          <button className="ro-btn-secondary" onClick={() => setSelected(null)}>
            <ArrowLeft size={16} /> Back to Retail Orders
          </button>
          {canCancel && (
            <button className="ro-btn-danger" onClick={() => handleCancel(o.id)}>
              <XCircle size={16} /> Cancel Order
            </button>
          )}
        </div>

        {/* ── main detail panel ── */}
        <div className="ro-detail-wrap">

          {/* dark green top strip */}
          <div className="ro-detail-top">
            <div>
              <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>Retail Order</div>
              <h1 className="ro-inv-number">#{o.invoice_number || o.id}</h1>
              <div className="ro-inv-date">
                <Calendar size={14} />
                {new Date(o.created_at).toLocaleString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
            <div className="ro-total-box">
              <div className="ro-total-label">Total Amount</div>
              <div className="ro-total-amt">{fmt(o.total_amount)} ETB</div>
            </div>
          </div>

          {/* status badges strip */}
          <div className="ro-status-bar">
            <span style={{ fontSize: '0.85rem', color: '#757575', marginRight: '4px' }}>Order Status:</span>
            <span className="ro-badge" style={{ background: ost.bg, color: ost.color }}>{ost.label}</span>
            {pst && (
              <>
                <span style={{ fontSize: '0.85rem', color: '#757575', marginLeft: '12px', marginRight: '4px' }}>Payment:</span>
                <span className="ro-badge" style={{ background: pst.bg, color: pst.color }}>{pst.label}</span>
              </>
            )}
            <span style={{ fontSize: '0.85rem', color: '#757575', marginLeft: '12px', marginRight: '4px' }}>Delivery:</span>
            <span className="ro-badge" style={{ background: '#F5F5F5', color: '#424242', textTransform: 'capitalize' }}>
              {o.delivery_type || 'pickup'}
            </span>
          </div>

          {/* ── body ── */}
          <div className="ro-body">

            {/* SECTION 1 — Order Items */}
            <div className="ro-section">
              <div className="ro-section-title"><Package size={16} /> Order Items</div>

              {o.items && o.items.length > 0 ? (
                <>
                  <div className="ro-items-table-wrap">
                    <table className="ro-items-table">
                      <thead>
                        <tr>
                          <th>Product</th>
                          <th>Name</th>
                          <th style={{ textAlign: 'right' }}>Unit Price</th>
                          <th style={{ textAlign: 'right' }}>Qty</th>
                          <th style={{ textAlign: 'right' }}>Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {o.items.map((item, idx) => {
                          const imgUrl = getImageUrl(item.product_image);
                          // unit_price from DB column name
                          const unitPrice = item.unit_price ?? item.price ?? (item.subtotal / item.quantity);
                          return (
                            <tr key={idx}>
                              <td>
                                {imgUrl
                                  ? <img src={imgUrl} alt={item.product_name} className="ro-product-img" />
                                  : <div className="ro-product-placeholder"><Package size={24} color="#8D6E63" /></div>
                                }
                              </td>
                              <td style={{ fontWeight: 600, color: '#1B5E20' }}>{item.product_name}</td>
                              <td style={{ textAlign: 'right' }}>{fmt(unitPrice)} ETB</td>
                              <td style={{ textAlign: 'right' }}>{item.quantity}</td>
                              <td style={{ textAlign: 'right', fontWeight: 600, color: '#2E8B57' }}>{fmt(item.subtotal)} ETB</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* totals summary */}
                  <div className="ro-totals" style={{ maxWidth: '320px', marginLeft: 'auto', marginTop: '16px' }}>
                    {parseFloat(o.subtotal || 0) > 0 && (
                      <div className="ro-total-line">
                        <span>Subtotal</span>
                        <span>{fmt(o.subtotal)} ETB</span>
                      </div>
                    )}
                    {parseFloat(o.delivery_fee || 0) > 0 && (
                      <div className="ro-total-line">
                        <span>Delivery Fee</span>
                        <span>{fmt(o.delivery_fee)} ETB</span>
                      </div>
                    )}
                    {parseFloat(o.tax || 0) > 0 && (
                      <div className="ro-total-line">
                        <span>Tax</span>
                        <span>{fmt(o.tax)} ETB</span>
                      </div>
                    )}
                    <div className="ro-total-line grand">
                      <span>Total</span>
                      <span>{fmt(o.total_amount)} ETB</span>
                    </div>
                  </div>
                </>
              ) : (
                <div style={{ padding: '24px 0', color: '#757575', fontSize: '0.95rem' }}>
                  No items found for this order.
                </div>
              )}
            </div>

            <hr className="ro-divider" />

            {/* SECTION 2 — Customer & Payment side by side */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '32px' }}>

              {/* Customer Info */}
              <div className="ro-section" style={{ marginBottom: 0 }}>
                <div className="ro-section-title"><User size={16} /> Customer Info</div>
                <div>
                  <div className="ro-info-row">
                    <span className="ro-info-label"><User size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />Full Name</span>
                    <span className="ro-info-value">{o.customer_name || '—'}</span>
                  </div>
                  <div className="ro-info-row">
                    <span className="ro-info-label"><Mail size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />Email</span>
                    <span className="ro-info-value">{o.customer_email || '—'}</span>
                  </div>
                  <div className="ro-info-row">
                    <span className="ro-info-label"><Phone size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />Phone</span>
                    <span className="ro-info-value">{o.customer_phone || '—'}</span>
                  </div>
                  {o.delivery_type === 'delivery' && (
                    <div className="ro-info-row">
                      <span className="ro-info-label"><MapPin size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />Address</span>
                      <span className="ro-info-value">{o.delivery_address || '—'}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Payment & Order Info */}
              <div className="ro-section" style={{ marginBottom: 0 }}>
                <div className="ro-section-title"><CreditCard size={16} /> Payment & Order Info</div>
                <div>
                  <div className="ro-info-row">
                    <span className="ro-info-label">Payment Method</span>
                    <span className="ro-info-value" style={{ textTransform: 'capitalize' }}>{(o.payment_method || '—').replace('_', ' ')}</span>
                  </div>
                  <div className="ro-info-row">
                    <span className="ro-info-label">Payment Status</span>
                    <span className="ro-info-value">
                      {pst ? (
                        <span className="ro-badge" style={{ background: pst.bg, color: pst.color, fontSize: '0.82rem' }}>{pst.label}</span>
                      ) : '—'}
                    </span>
                  </div>
                  <div className="ro-info-row">
                    <span className="ro-info-label">Delivery Type</span>
                    <span className="ro-info-value" style={{ textTransform: 'capitalize' }}>{o.delivery_type || '—'}</span>
                  </div>
                  <div className="ro-info-row">
                    <span className="ro-info-label"><Hash size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />Invoice #</span>
                    <span className="ro-info-value">{o.invoice_number || '—'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 3 — Notes (if any) */}
            {o.notes && (
              <>
                <hr className="ro-divider" />
                <div className="ro-section" style={{ marginBottom: 0 }}>
                  <div className="ro-section-title"><FileText size={16} /> Notes</div>
                  <p style={{ margin: 0, color: '#424242', lineHeight: 1.7 }}>{o.notes}</p>
                </div>
              </>
            )}

          </div>{/* /ro-body */}
        </div>{/* /ro-detail-wrap */}
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════════
     LIST VIEW
  ═══════════════════════════════════════════════════════════ */
  return (
    <div className="ro-page">
      <style>{STYLES}</style>

      {notification && <div className={`ro-toast ${notification.type}`}>{notification.msg}</div>}

      {/* header */}
      <div className="ro-page-header">
        <div>
          <h1 className="ro-page-title">Retail Orders</h1>
          <p className="ro-page-sub">Manage your purchases from the retail store</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button className="ro-btn-primary" onClick={() => navigate('/services/retail')}>
            + New Order
          </button>
          <button className="ro-btn-secondary" onClick={handleRefresh} disabled={refreshing}>
            <SegmentedSpinner size={16} />
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* tabs */}
      <div className="ro-tabs">
        {STATUS_TABS.map(({ key, label, Icon }) => (
          <button key={key} className={`ro-tab ${activeTab === key ? 'active' : ''}`} onClick={() => setActiveTab(key)}>
            <Icon size={17} /> {label}
          </button>
        ))}
      </div>

      {/* content */}
      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: '#757575' }}>Loading orders…</div>
      ) : filtered.length === 0 ? (
        <div className="ro-empty">
          <ShoppingCart size={48} color="#A5D6A7" style={{ marginBottom: '16px' }} />
          <h2 style={{ fontSize: '1.4rem', color: '#1B5E20', margin: '0 0 8px' }}>No Orders Found</h2>
          <p style={{ color: '#757575', margin: '0 0 20px' }}>You don't have any retail orders in this category.</p>
          <button className="ro-btn-primary" onClick={() => navigate('/services/retail')}>Shop Retail Store</button>
        </div>
      ) : (
        <div className="ro-table-wrap">
          <table className="ro-table">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Date</th>
                <th>Items</th>
                <th>Payment</th>
                <th style={{ textAlign: 'right' }}>Total</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((order) => {
                const ost = ORDER_STATUS[order.status]           || ORDER_STATUS.PROCESSING;
                const pst = PAYMENT_STATUS[order.payment_status] || null;
                const dateStr = new Date(order.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
                return (
                  <tr key={order.id} className="ro-table-row" onClick={() => setSelected(order)}>
                    <td style={{ fontWeight: 600, color: '#1B5E20' }}>{order.invoice_number || order.id}</td>
                    <td>{dateStr}</td>
                    <td>{order.items?.length ?? 0} {order.items?.length === 1 ? 'item' : 'items'}</td>
                    <td>
                      {pst
                        ? <span className="ro-badge" style={{ background: pst.bg, color: pst.color, fontSize: '0.8rem' }}>{pst.label}</span>
                        : '—'}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 600, color: '#2E8B57' }}>
                      {fmt(order.total_amount)} ETB
                    </td>
                    <td>
                      <span className="ro-badge" style={{ background: ost.bg, color: ost.color, fontSize: '0.8rem' }}>{ost.label}</span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="ro-btn-secondary ro-btn-sm"
                        onClick={(e) => { e.stopPropagation(); setSelected(order); }}
                      >
                        <Eye size={14} /> View
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
