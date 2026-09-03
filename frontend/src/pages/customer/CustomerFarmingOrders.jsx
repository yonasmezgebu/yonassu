import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../services/apiClient';
import {
  Tractor, Clock, CheckSquare, PlaySquare, RefreshCw,
  ArrowLeft, Calendar, MapPin, DollarSign, Image as ImageIcon,
  Activity, Eye, Trash2
} from 'lucide-react';
import SegmentedSpinner from '../../components/ui/SegmentedSpinner';
import styles from './CustomerFarmingOrders.module.css';

const BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1').replace('/api/v1', '');

const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${BASE}${path.startsWith('/') ? path : '/' + path}`.replace(/\\/g, '/');
};

/* ── HSL badge colours (matches CSS :root tokens) ── */
const STATUS_CONFIG = {
  pending:   { label: 'Pending',   bg: 'hsl(28 40% 88%)',  color: 'hsl(28 50% 30%)' },
  approved:  { label: 'Approved',  bg: 'hsl(77 55% 88%)',  color: 'hsl(77 55% 28%)' },
  confirmed: { label: 'Confirmed', bg: 'hsl(142 55% 86%)', color: 'hsl(142 60% 24%)' },
  active:    { label: 'Active',    bg: 'hsl(200 60% 88%)', color: 'hsl(200 60% 28%)' },
  completed: { label: 'Completed', bg: 'hsl(142 70% 86%)', color: 'hsl(142 70% 22%)' },
  cancelled: { label: 'Cancelled', bg: 'hsl(0 72% 92%)',   color: 'hsl(0 72% 38%)' },
};

const STATUS_TABS = [
  { key: 'all',       label: 'All Orders', Icon: Tractor },
  { key: 'pending',   label: 'Pending',    Icon: Clock },
  { key: 'active',    label: 'Active',     Icon: PlaySquare },
  { key: 'completed', label: 'Completed',  Icon: CheckSquare },
];

export default function CustomerFarmingOrders() {
  const [orders, setOrders]               = useState([]);
  const [loading, setLoading]             = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [activeTab, setActiveTab]         = useState('all');
  const [imgError, setImgError]           = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [refreshing, setRefreshing]       = useState(false);
  const [notification, setNotification]   = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null); // { id, label }
  const navigate = useNavigate();

  const showNotification = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchOrders = useCallback(async () => {
    try {
      const res = await axios.get('/agrirent-orders/my-orders');
      setOrders(res.data || []);
    } catch (err) {
      console.error('Failed to load farming orders', err);
      showNotification('Failed to load orders.', 'error');
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
      await axios.delete(`/agrirent-orders/my-orders/${id}`);
      setOrders(prev => prev.filter(o => o.id !== id));
      showNotification('Order removed from your dashboard.', 'success');
    } catch (err) {
      showNotification(err.response?.data?.message || 'Failed to remove order.', 'error');
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const res = await axios.get('/agrirent-orders/my-orders');
      setOrders(res.data || []);
    } catch (err) {
      console.error('Failed to refresh', err);
      showNotification('Failed to refresh orders.', 'error');
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const handleCancel = async (id) => {
    try {
      await axios.patch(`/agrirent-orders/${id}/status`, { status: 'cancelled' });
      showNotification('Order cancelled successfully.', 'success');
      fetchOrders();
      setSelectedOrder(null);
    } catch (err) {
      showNotification(err.response?.data?.message || 'Failed to cancel order.', 'error');
    }
  };

  const filtered = activeTab === 'all'
    ? orders
    : orders.filter(o => {
        if (activeTab === 'pending')   return ['pending', 'approved'].includes(o.status);
        if (activeTab === 'active')    return ['confirmed', 'active'].includes(o.status);
        if (activeTab === 'completed') return o.status === 'completed';
        return true;
      });

  /* ────────────────────────────────────────────────────────────
     DETAIL VIEW
  ──────────────────────────────────────────────────────────── */
  if (selectedOrder) {
    const o          = selectedOrder;
    const cfg        = STATUS_CONFIG[o.status] || STATUS_CONFIG.pending;
    const tractorImg = getImageUrl(o.tractor_image);

    return (
      <div className={styles.page}>

        {/* Toast */}
        {notification && (
          <div className={`${styles.toast} ${notification.type === 'error' ? styles.toastError : styles.toastSuccess}`}>
            {notification.msg}
          </div>
        )}

        <div className={styles.wrap}>
          {/* Back + order # header */}
          <button className={styles.backBtn} onClick={() => setSelectedOrder(null)}>
            <ArrowLeft size={16} /> Back to AgriRent Orders
          </button>

          <div className={styles.detailHeader}>
            <div className={styles.detailHeaderLeft}>
              <div>
                <h1 className={styles.detailOrderNum}>Order #{o.order_number}</h1>
                <div className={styles.detailOrderDate}>
                  Placed on {new Date(o.created_at).toLocaleString('en-GB', {
                    day: 'numeric', month: 'long', year: 'numeric',
                    hour: '2-digit', minute: '2-digit',
                  })}
                </div>
              </div>
            </div>
            <span className={styles.badge} style={{ backgroundColor: cfg.bg, color: cfg.color }}>
              {cfg.label}
            </span>
          </div>

          {/* Machine Information card */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}><Activity size={18} /> Machine Information</h2>
            <div className={styles.machineCard}>
              {/* Image — 16/9 locked */}
              <div
                className={styles.imageContainer}
                style={{ cursor: tractorImg && !imgError ? 'zoom-in' : 'default' }}
                onClick={() => tractorImg && !imgError && setSelectedImage(tractorImg)}
              >
                {tractorImg && !imgError ? (
                  <img
                    src={tractorImg}
                    alt={o.tractor_name}
                    onError={() => setImgError(true)}
                  />
                ) : (
                  <div className={styles.imagePlaceholder}>
                    <ImageIcon size={48} />
                    <span>No Image Available</span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className={styles.machineInfo}>
                <div className={styles.machineName}>{o.tractor_name || 'AgriRent Machine'}</div>
                <div className={styles.machineType}>{o.tractor_type_label || 'Tractor'}</div>
                <div className={styles.machineField}>
                  <span className={styles.machineFieldLabel}>Field Purpose: </span>
                  {o.farming_purpose || 'N/A'}
                </div>
                <div className={styles.machineField}>
                  <span className={styles.machineFieldLabel}>Field Location: </span>
                  {o.field_location || 'N/A'}
                </div>
                <div className={styles.machineField}>
                  <span className={styles.machineFieldLabel}>Field Size: </span>
                  {o.field_size_hectares ? `${o.field_size_hectares} ha` : 'N/A'}
                </div>
              </div>
            </div>
          </div>

          {/* Schedule + Payment cards */}
          <div className={styles.cardsGrid}>
            {/* Rental Schedule */}
            <div className={styles.card}>
              <h2 className={styles.cardTitle}><Calendar size={18} /> Rental Schedule</h2>
              <div className={styles.infoRowRows}>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Start Date</span>
                  <span className={styles.infoValue}>
                    {new Date(o.start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>End Date</span>
                  <span className={styles.infoValue}>
                    {new Date(o.end_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Duration</span>
                  <span className={styles.infoValue}>{o.total_days} Days</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Daily Rate</span>
                  <span className={styles.infoValue}>{parseFloat(o.daily_rate || 0).toFixed(2)} ETB/day</span>
                </div>
              </div>
            </div>

            {/* Payment Details */}
            <div className={styles.card}>
              <h2 className={styles.cardTitle}><DollarSign size={18} /> Payment Details</h2>
              <div className={styles.infoRowRows}>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Payment Method</span>
                  <span className={styles.infoValue}>{o.payment_method || 'N/A'}</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Transaction Ref</span>
                  <span className={styles.infoValue}>{o.payment_reference || 'N/A'}</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Status</span>
                  <span className={styles.infoValue}>{o.payment_status || 'Pending'}</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Total Amount</span>
                  <span className={styles.infoValueLarge}>
                    {parseFloat(o.total_amount || 0).toFixed(2)} ETB
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Special Instructions + Danger Zone */}
          {(o.special_instructions || ['pending', 'approved'].includes(o.status)) && (
            <div className={styles.bottomRow}>
              {o.special_instructions && (
                <div className={`${styles.card} ${styles.bottomRowCard}`}>
                  <h2 className={styles.cardTitle}>Special Instructions</h2>
                  <p className={styles.machineField}>{o.special_instructions}</p>
                </div>
              )}

              {['pending', 'approved'].includes(o.status) && (
                <div className={`${styles.card} ${styles.bottomRowCard}`}>
                  <div className={styles.dangerTitle}>Danger Zone</div>
                  <p className={styles.dangerDesc}>
                    You can cancel this order before it is confirmed or active.
                  </p>
                  <button
                    className={styles.btnDanger}
                    onClick={() => {
                      if (window.confirm('Are you sure you want to cancel this order?')) {
                        handleCancel(o.id);
                      }
                    }}
                  >
                    Cancel Order
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Fullscreen Image Modal */}
        {selectedImage && (
          <div className={styles.modal} onClick={() => setSelectedImage(null)}>
            <div className={styles.modalInner} onClick={e => e.stopPropagation()}>
              <button className={styles.modalClose} onClick={() => setSelectedImage(null)}>
                Close ✕
              </button>
              <img src={selectedImage} alt="Full View" className={styles.modalImg} />
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ────────────────────────────────────────────────────────────
     LIST VIEW
  ──────────────────────────────────────────────────────────── */
  return (
    <>
    <div className={styles.page}>

      {/* Toast */}
      {notification && (
        <div className={`${styles.toast} ${notification.type === 'error' ? styles.toastError : styles.toastSuccess}`}>
          {notification.msg}
        </div>
      )}

      <div className={styles.wrap}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerMeta}>
            <h1 className={styles.pageTitle}>AgriRent Orders</h1>
            <p className={styles.pageSubtitle}>Manage your machine rentals &amp; field services</p>
          </div>
          <div className={styles.headerActions}>
            <button className={styles.btnPrimary} onClick={() => navigate('/services/farming')}>
              + New Rental
            </button>
            <button
              className={styles.btnSecondary}
              onClick={handleRefresh}
              disabled={refreshing}
              aria-label="Refresh orders"
            >
              {refreshing ? <SegmentedSpinner size={16} /> : <RefreshCw size={16} />}
              Refresh
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className={styles.tabs}>
          {STATUS_TABS.map((tab) => {
            const active  = activeTab === tab.key;
            const TabIcon = tab.Icon;
            return (
              <button
                key={tab.key}
                className={`${styles.tab}${active ? ` ${styles.tabActive}` : ''}`}
                onClick={() => setActiveTab(tab.key)}
              >
                <TabIcon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        {loading ? (
          <div className={styles.empty}>
            <div className={styles.emptyTitle}>Loading orders…</div>
          </div>
        ) : filtered.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}><Tractor size={48} /></div>
            <div className={styles.emptyTitle}>No Orders Found</div>
            <p className={styles.emptyDesc}>You don&apos;t have any farming orders in this category.</p>
            <button className={styles.btnPrimary} onClick={() => navigate('/services/farming')}>
              + New Rental
            </button>
          </div>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Tractor / Machine</th>
                  <th>Start Date</th>
                  <th>Duration</th>
                  <th className={styles.colRight}>Total Amount</th>
                  <th>Status</th>
                  <th className={styles.colRight}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((order) => {
                  const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
                  return (
                    <tr
                      key={order.id}
                      className={styles.tableRow}
                      onClick={() => setSelectedOrder(order)}
                      tabIndex={0}
                      onKeyDown={e => e.key === 'Enter' && setSelectedOrder(order)}
                    >
                      <td>{order.order_number}</td>
                      <td style={{ fontWeight: 600 }}>{order.tractor_name || 'AgriRent Machine'}</td>
                      <td>
                        {new Date(order.start_date).toLocaleDateString('en-GB', {
                          day: '2-digit', month: 'short', year: 'numeric',
                        })}
                      </td>
                      <td>{order.total_days} Days</td>
                      <td className={styles.colAmount}>
                        {parseFloat(order.total_amount || 0).toFixed(2)} ETB
                      </td>
                      <td>
                        <span
                          className={styles.badge}
                          style={{ backgroundColor: cfg.bg, color: cfg.color }}
                        >
                          {cfg.label}
                        </span>
                      </td>
                      <td className={styles.colRight}>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'flex-end' }}>
                          {(order.status === 'COMPLETED' || order.status === 'completed') && (
                            <button 
                              onClick={(e) => handleHideOrder(e, order.id, order.tractor_name || `Order #${order.id}`)}
                              style={{ background: 'none', border: 'none', color: '#e53e3e', cursor: 'pointer', padding: '4px' }}
                              title="Delete from dashboard"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                          <button
                            className={`${styles.btnSecondary} ${styles.btnSm}`}
                            onClick={(e) => { e.stopPropagation(); setSelectedOrder(order); }}
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
            This only hides it for you — the agri-rent team still has your booking.
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
