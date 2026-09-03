import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../services/apiClient';
import {
  ClipboardList, Clock, CheckCircle, XCircle, RefreshCw,
  ArrowLeft, Calendar, DollarSign, Truck, Package,
  ShoppingCart, Eye, MapPin, CreditCard, Phone, Mail, User, Hash, FileText, Trash2
} from 'lucide-react';
import SegmentedSpinner from '../../components/ui/SegmentedSpinner';
import styles from './CustomerRetailOrders.module.css';

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
  PROCESSING:       { label: 'Processing', bg: 'hsl(28 40% 88%)',  color: 'hsl(28 50% 30%)' },
  PACKING:          { label: 'Packing',    bg: 'hsl(77 55% 88%)',  color: 'hsl(77 55% 28%)' },
  SHIPPED:          { label: 'Shipped',    bg: 'hsl(200 60% 88%)', color: 'hsl(200 60% 28%)' },
  DELIVERED:        { label: 'Delivered',  bg: 'hsl(142 70% 86%)', color: 'hsl(142 70% 22%)' },
  CANCELLED:        { label: 'Cancelled',  bg: 'hsl(0 72% 92%)',   color: 'hsl(0 72% 38%)' },
};

const PAYMENT_STATUS = {
  AWAITING_PAYMENT: { label: 'Awaiting Payment', bg: 'hsl(36 100% 90%)', color: 'hsl(36 100% 35%)' },
  PENDING:          { label: 'Pending Finance',  bg: 'hsl(45 100% 90%)', color: 'hsl(45 100% 35%)' },
  PAID:             { label: 'Paid & Verified',  bg: 'hsl(142 70% 86%)', color: 'hsl(142 70% 22%)' },
  OVERDUE:          { label: 'Overdue',          bg: 'hsl(0 72% 92%)',   color: 'hsl(0 72% 38%)' },
};

const STATUS_TABS = [
  { key: 'ALL',        label: 'All Orders', Icon: ClipboardList },
  { key: 'PROCESSING', label: 'Processing', Icon: Clock },
  { key: 'SHIPPED',    label: 'Shipped',    Icon: Truck },
  { key: 'DELIVERED',  label: 'Delivered',  Icon: CheckCircle },
];

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
  const [confirmDelete, setConfirmDelete] = useState(null); // { id, label }
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

  const handleHideOrder = (e, id, label) => {
    e.stopPropagation();
    setConfirmDelete({ id, label });
  };

  const confirmHideOrder = async () => {
    if (!confirmDelete) return;
    const { id } = confirmDelete;
    setConfirmDelete(null);
    try {
      await axios.delete(`/retail/orders/my-orders/${id}`);
      setOrders(prev => prev.filter(o => o.id !== id));
      toast('Order removed from your dashboard.', 'success');
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to remove order.', 'error');
    }
  };

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
          {/* ── top nav row ── */}
          <div className={styles.detailTopBar}>
            <button className={styles.backBtn} onClick={() => setSelected(null)}>
              <ArrowLeft size={16} /> Back to Retail Orders
            </button>
            {canCancel && (
              <button className={styles.btnDanger} onClick={() => handleCancel(o.id)}>
                <XCircle size={16} /> Cancel Order
              </button>
            )}
          </div>

          {/* ── main detail panel ── */}
          <div className={styles.detailWrap}>
            {/* dark top strip */}
            <div className={styles.detailTop}>
              <div>
                <div className={styles.detailInvLabel}>Retail Order</div>
                <h1 className={styles.detailInvNumber}>#{o.invoice_number || o.id}</h1>
                <div className={styles.detailInvDate}>
                  <Calendar size={14} />
                  {new Date(o.created_at).toLocaleString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
              <div className={styles.totalBox}>
                <div className={styles.totalLabel}>Total Amount</div>
                <div className={styles.totalAmt}>{fmt(o.total_amount)} ETB</div>
              </div>
            </div>

            {/* status badges strip */}
            <div className={styles.statusBar}>
              <div className={styles.statusGroup}>
                <span className={styles.statusLabel}>Order Status:</span>
                <span className={styles.badge} style={{ backgroundColor: ost.bg, color: ost.color }}>
                  {ost.label}
                </span>
              </div>
              {pst && (
                <>
                  <div className={styles.statusDivider} />
                  <div className={styles.statusGroup}>
                    <span className={styles.statusLabel}>Payment:</span>
                    <span className={styles.badge} style={{ backgroundColor: pst.bg, color: pst.color }}>
                      {pst.label}
                    </span>
                  </div>
                </>
              )}
              <div className={styles.statusDivider} />
              <div className={styles.statusGroup}>
                <span className={styles.statusLabel}>Delivery:</span>
                <span className={styles.statusVal}>{o.delivery_type || 'pickup'}</span>
              </div>
            </div>

            {/* ── body ── */}
            <div className={styles.detailBody}>
              {/* SECTION 1 — Order Items */}
              <div className={styles.section}>
                <h2 className={styles.sectionTitle}><Package size={16} /> Order Items</h2>

                {o.items && o.items.length > 0 ? (
                  <>
                    <div className={styles.itemsTableWrap}>
                      <table className={styles.itemsTable}>
                        <thead>
                          <tr>
                            <th>Product</th>
                            <th>Name</th>
                            <th className={styles.colRight}>Unit Price</th>
                            <th className={styles.colRight}>Qty</th>
                            <th className={styles.colRight}>Subtotal</th>
                          </tr>
                        </thead>
                        <tbody>
                          {o.items.map((item, idx) => {
                            const imgUrl = getImageUrl(item.product_image);
                            const unitPrice = item.unit_price ?? item.price ?? (item.subtotal / item.quantity);
                            return (
                              <tr key={idx}>
                                <td>
                                  {imgUrl ? (
                                    <img src={imgUrl} alt={item.product_name} className={styles.productImg} />
                                  ) : (
                                    <div className={styles.productPlaceholder}>
                                      <Package size={24} color="hsl(var(--muted-foreground))" />
                                    </div>
                                  )}
                                </td>
                                <td style={{ fontWeight: 600, color: 'hsl(var(--primary-dark))' }}>{item.product_name}</td>
                                <td className={styles.colRight}>{fmt(unitPrice)} ETB</td>
                                <td className={styles.colRight}>{item.quantity}</td>
                                <td className={styles.colRight} style={{ fontWeight: 600, color: 'hsl(var(--primary))' }}>
                                  {fmt(item.subtotal)} ETB
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* totals summary */}
                    <div className={styles.totalsBox}>
                      {parseFloat(o.subtotal || 0) > 0 && (
                        <div className={styles.totalLine}>
                          <span>Subtotal</span>
                          <span>{fmt(o.subtotal)} ETB</span>
                        </div>
                      )}
                      {parseFloat(o.delivery_fee || 0) > 0 && (
                        <div className={styles.totalLine}>
                          <span>Delivery Fee</span>
                          <span>{fmt(o.delivery_fee)} ETB</span>
                        </div>
                      )}
                      {parseFloat(o.tax || 0) > 0 && (
                        <div className={styles.totalLine}>
                          <span>Tax</span>
                          <span>{fmt(o.tax)} ETB</span>
                        </div>
                      )}
                      <div className={styles.totalLineGrand}>
                        <span>Total</span>
                        <span>{fmt(o.total_amount)} ETB</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div style={{ color: 'hsl(var(--muted-foreground))', fontSize: '0.875rem' }}>
                    No items found for this order.
                  </div>
                )}
              </div>

              <hr className={styles.divider} />

              {/* SECTION 2 — Customer & Payment side by side */}
              <div className={styles.infoGrid}>
                {/* Customer Info */}
                <div className={styles.section} style={{ marginBottom: 0 }}>
                  <h2 className={styles.sectionTitle}><User size={16} /> Customer Info</h2>
                  <div>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}><User size={14} /> Full Name</span>
                      <span className={styles.infoValue}>{o.customer_name || '—'}</span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}><Mail size={14} /> Email</span>
                      <span className={styles.infoValue}>{o.customer_email || '—'}</span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}><Phone size={14} /> Phone</span>
                      <span className={styles.infoValue}>{o.customer_phone || '—'}</span>
                    </div>
                    {o.delivery_type === 'delivery' && (
                      <div className={styles.infoRow}>
                        <span className={styles.infoLabel}><MapPin size={14} /> Address</span>
                        <span className={styles.infoValue}>{o.delivery_address || '—'}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Payment & Order Info */}
                <div className={styles.section} style={{ marginBottom: 0 }}>
                  <h2 className={styles.sectionTitle}><CreditCard size={16} /> Payment & Order Info</h2>
                  <div>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Payment Method</span>
                      <span className={styles.infoValue}>{(o.payment_method || '—').replace('_', ' ')}</span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Payment Status</span>
                      <span className={styles.infoValue} style={{ textTransform: 'none' }}>
                        {pst ? (
                          <span className={styles.badge} style={{ backgroundColor: pst.bg, color: pst.color }}>
                            {pst.label}
                          </span>
                        ) : '—'}
                      </span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Delivery Type</span>
                      <span className={styles.infoValue}>{o.delivery_type || '—'}</span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}><Hash size={14} /> Invoice #</span>
                      <span className={styles.infoValue}>{o.invoice_number || '—'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 3 — Notes (if any) */}
              {o.notes && (
                <>
                  <hr className={styles.divider} />
                  <div className={styles.section} style={{ marginBottom: 0 }}>
                    <h2 className={styles.sectionTitle}><FileText size={16} /> Notes</h2>
                    <p className={styles.notesText}>{o.notes}</p>
                  </div>
                </>
              )}
            </div>
          </div>
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
            <h1 className={styles.pageTitle}>Retail Orders</h1>
            <p className={styles.pageSubtitle}>Manage your purchases from the retail store</p>
          </div>
          <div className={styles.headerActions}>
            <button className={styles.btnPrimary} onClick={() => navigate('/services/retail')}>
              + New Order
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
          {STATUS_TABS.map(({ key, label, Icon }) => {
            const active = activeTab === key;
            return (
              <button
                key={key}
                className={`${styles.tab}${active ? ` ${styles.tabActive}` : ''}`}
                onClick={() => setActiveTab(key)}
              >
                <Icon size={16} />
                {label}
              </button>
            );
          })}
        </div>

        {/* content */}
        {loading ? (
          <div className={styles.empty}>
            <div className={styles.emptyTitle}>Loading orders…</div>
          </div>
        ) : filtered.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}><ShoppingCart size={48} /></div>
            <h2 className={styles.emptyTitle}>No Orders Found</h2>
            <p className={styles.emptyDesc}>You don&apos;t have any retail orders in this category.</p>
            <button className={styles.btnPrimary} onClick={() => navigate('/services/retail')}>
              Shop Retail Store
            </button>
          </div>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Date</th>
                  <th>Items</th>
                  <th>Payment</th>
                  <th className={styles.colRight}>Total</th>
                  <th>Status</th>
                  <th className={styles.colRight}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((order) => {
                  const ost = ORDER_STATUS[order.status]           || ORDER_STATUS.PROCESSING;
                  const pst = PAYMENT_STATUS[order.payment_status] || null;
                  const dateStr = new Date(order.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
                  return (
                    <tr
                      key={order.id}
                      className={styles.tableRow}
                      onClick={() => setSelected(order)}
                      tabIndex={0}
                      onKeyDown={e => e.key === 'Enter' && setSelected(order)}
                    >
                      <td style={{ fontWeight: 600, color: 'hsl(var(--primary-dark))' }}>
                        {order.invoice_number || order.id}
                      </td>
                      <td>{dateStr}</td>
                      <td>{order.items?.length ?? 0} {order.items?.length === 1 ? 'item' : 'items'}</td>
                      <td>
                        {pst ? (
                          <span className={styles.badge} style={{ backgroundColor: pst.bg, color: pst.color }}>
                            {pst.label}
                          </span>
                        ) : '—'}
                      </td>
                      <td className={styles.colRight} style={{ fontWeight: 600, color: 'hsl(var(--primary))' }}>
                        {fmt(order.total_amount)} ETB
                      </td>
                      <td>
                        <span className={styles.badge} style={{ backgroundColor: ost.bg, color: ost.color }}>
                          {ost.label}
                        </span>
                      </td>
                      <td className={styles.colRight}>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'flex-end' }}>
                          {['DELIVERED', 'COMPLETED', 'delivered', 'completed'].includes(order.status) && (
                            <button 
                              onClick={(e) => handleHideOrder(e, order.id, order.retail_order_number || order.invoice_number || `Order #${order.id}`)}
                              style={{ background: 'none', border: 'none', color: '#e53e3e', cursor: 'pointer', padding: '4px' }}
                              title="Delete from dashboard"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                          <button
                            className={`${styles.btnSecondary} ${styles.btnSm}`}
                            onClick={(e) => { e.stopPropagation(); setSelected(order); }}
                          >
                            <Eye size={14} /> View
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
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
            This only hides it for you — the store still has your order record.
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
