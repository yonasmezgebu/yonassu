import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../services/apiClient';
import {
  XCircle, Printer, RefreshCw,
  ArrowLeft, Calendar, FileText, BookOpen,
} from 'lucide-react';
import SegmentedSpinner from '../../components/ui/SegmentedSpinner';
import styles from './CustomerPrintingOrders.module.css';

const BASE = 'http://localhost:5000';

const STATUS_CONFIG = {
  received:         { label: 'Received',         color: 'hsl(142 70% 28%)', bg: 'hsl(149 80% 95%)', dot: 'hsl(142 60% 42%)' },
  processing:       { label: 'Processing',       color: 'hsl(77 60% 28%)',  bg: 'hsl(77 60% 94%)',  dot: 'hsl(77 55% 38%)' },
  ready_for_pickup: { label: 'Ready for Pickup', color: 'hsl(142 70% 22%)', bg: 'hsl(142 75% 90%)', dot: 'hsl(142 60% 38%)' },
  completed:        { label: 'Completed',        color: 'hsl(142 70% 22%)', bg: 'hsl(142 75% 90%)', dot: 'hsl(142 60% 38%)' },
  cancelled:        { label: 'Cancelled',        color: 'hsl(0 72% 38%)',   bg: 'hsl(0 86% 95%)',   dot: 'hsl(0 72% 52%)' },
};

const STATUS_TABS = [
  { key: 'all',              label: 'All Orders' },
  { key: 'received',         label: 'Received' },
  { key: 'processing',       label: 'Processing' },
  { key: 'ready_for_pickup', label: 'Ready for Pickup' },
];

export default function CustomerPrintingOrders() {
  const [orders, setOrders]               = useState([]);
  const [loading, setLoading]             = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [activeTab, setActiveTab]         = useState('all');
  const [imgError, setImgError]           = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [refreshing, setRefreshing]       = useState(false);
  const navigate = useNavigate();

  const fetchOrders = useCallback(async () => {
    try {
      const res = await axios.get('/printing/customer/orders');
      setOrders(res.data?.orders || []);
    } catch (err) {
      console.error('Failed to load printing orders', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const res = await axios.get('/printing/customer/orders');
      setOrders(res.data?.orders || []);
    } catch (err) {
      console.error('Failed to refresh', err);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this printing order?')) return;
    try {
      await axios.delete(`/printing/orders/${id}/cancel`);
      fetchOrders();
      setSelectedOrder(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Cancellation requires contacting support for printing orders.');
    }
  };

  const filtered = activeTab === 'all'
    ? orders
    : orders.filter(o => o.status_code === activeTab);

  /* ── derived detail values ── */
  const o   = selectedOrder;
  const cfg = o ? (STATUS_CONFIG[o.status_code] || STATUS_CONFIG.received) : null;
  let attachment = null;
  let docSrc     = null;
  let isImage    = false;
  if (o) {
    if (o.attachments) {
      try {
        const atts = JSON.parse(o.attachments);
        if (atts && atts.length > 0) attachment = atts[0];
      } catch (_) { /* noop */ }
    }
    docSrc = attachment?.path
      ? (attachment.path.startsWith('http')
          ? attachment.path
          : `${BASE}/${attachment.path.replace(/\\/g, '/')}`)
      : null;
    isImage = !!(attachment && attachment.mimeType?.startsWith('image/'));
  }

  return (
    <div className={styles.page}>

      {/* ══ FULLSCREEN IMAGE MODAL ══ */}
      {selectedImage && (
        <div className={styles.modal} onClick={() => setSelectedImage(null)}>
          <button
            className={styles.modalClose}
            onClick={() => setSelectedImage(null)}
            aria-label="Close image preview"
          >
            <XCircle size={32} />
          </button>
          <img
            src={selectedImage}
            alt="Document Full View"
            className={styles.modalImg}
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}

      {selectedOrder ? (
        /* ══════════ DETAIL VIEW ══════════ */
        <div className={styles.wrap}>
          <button className={styles.backBtn} onClick={() => setSelectedOrder(null)}>
            <ArrowLeft size={16} />
            Back to Printing Orders
          </button>

          <div className={styles.header}>
            <h1 className={styles.pageTitle}>Order #{o.order_number}</h1>
            <div className={styles.actions}>
              <div
                className={styles.badge}
                style={{ backgroundColor: cfg.bg, color: cfg.color }}
              >
                <div className={styles.dot} style={{ backgroundColor: cfg.dot }} />
                {cfg.label}
              </div>
            </div>
          </div>

          <div className={styles.detailGrid}>
            {/* Left — Printing Details */}
            <div className={styles.detailCard}>
              <h2 className={styles.detailCardTitle}>
                <BookOpen size={20} />
                Printing Details
              </h2>
              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <div className={styles.infoLabel}>Service Type</div>
                  <div className={styles.infoValue}>{o.product_type}</div>
                </div>
                <div className={styles.infoItem}>
                  <div className={styles.infoLabel}>Paper / Binding</div>
                  <div className={styles.infoValue}>{o.paper_type} | {o.binding_type || 'None'}</div>
                </div>
                <div className={styles.infoItem}>
                  <div className={styles.infoLabel}>Quantity</div>
                  <div className={styles.infoValue}>{o.quantity} Copy(s) ({o.pages_per_copy} pgs each)</div>
                </div>
                <div className={styles.infoItem}>
                  <div className={styles.infoLabel}>Color Printing</div>
                  <div className={styles.infoValue}>{o.color_printing ? 'YES — Color' : 'NO — Black & White'}</div>
                </div>
                <div className={styles.infoItem}>
                  <div className={styles.infoLabel}>Due Date</div>
                  <div className={styles.infoValue}>
                    {o.due_date ? new Date(o.due_date).toLocaleDateString() : 'N/A'}
                  </div>
                </div>
                <div className={styles.infoItem}>
                  <div className={styles.infoLabel}>Total Amount</div>
                  <div className={styles.infoValueLarge}>
                    {parseFloat(o.total_price || 0).toFixed(2)} ETB
                  </div>
                </div>
                <div className={`${styles.infoItem} ${styles.infoFullRow}`}>
                  <div className={styles.infoLabel}>Special Instructions</div>
                  <div className={styles.infoValue}>{o.special_instructions || 'None provided'}</div>
                </div>
              </div>

              {o.status_code === 'received' && (
                <div className={styles.cancelWrap}>
                  <button className={styles.btnSecondary} onClick={() => handleCancel(o.id)}>
                    <XCircle size={16} />
                    Cancel Order
                  </button>
                </div>
              )}
            </div>

            {/* Right — Document Attachment */}
            <div className={styles.detailCard}>
              <h2 className={styles.detailCardTitle}>
                <FileText size={20} />
                Document Attachment
              </h2>
              {!docSrc ? (
                <div className={styles.attachEmpty}>
                  <FileText size={48} />
                  <div className={styles.attachEmptyTitle}>No document attached</div>
                  <div className={styles.attachEmptyDesc}>
                    Provide the document physically at the printing shop.
                  </div>
                </div>
              ) : imgError || !isImage ? (
                <div className={styles.attachFile}>
                  <FileText size={48} />
                  <div className={styles.attachFileName}>{attachment?.originalName || 'Document File'}</div>
                  <a href={docSrc} target="_blank" rel="noreferrer" className={styles.btnPrimary}>
                    Download File
                  </a>
                </div>
              ) : (
                <div className={styles.attachImg} onClick={() => setSelectedImage(docSrc)}>
                  <img
                    src={docSrc}
                    alt="Attached Document"
                    onError={() => setImgError(true)}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

      ) : (
        /* ══════════ LIST VIEW ══════════ */
        <div className={styles.wrap}>
          <div className={styles.header}>
            <h1 className={styles.pageTitle}>
              <Printer size={26} />
              Printing Orders
            </h1>
            <div className={styles.actions}>
              <button
                className={styles.btnIcon}
                onClick={handleRefresh}
                disabled={refreshing}
                title="Refresh"
                aria-label="Refresh orders"
              >
                {refreshing
                  ? <SegmentedSpinner size={18} />
                  : <RefreshCw size={18} />
                }
              </button>
              <button className={styles.btnPrimary} onClick={() => navigate('/services/printing')}>
                + New Order
              </button>
            </div>
          </div>

          {/* Status Tabs */}
          <div className={styles.tabs}>
            {STATUS_TABS.map(tab => (
              <button
                key={tab.key}
                className={`${styles.tab}${activeTab === tab.key ? ` ${styles.tabActive}` : ''}`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          {loading ? (
            <div className={styles.empty}>
              <div className={styles.emptyTitle}>Loading orders…</div>
            </div>
          ) : filtered.length === 0 ? (
            <div className={styles.empty}>
              <Printer size={48} />
              <div className={styles.emptyTitle}>No printing orders found for this status.</div>
              <button className={styles.btnPrimary} onClick={() => navigate('/services/printing')}>
                Order Print Service
              </button>
            </div>
          ) : (
            <div className={styles.list}>
              {filtered.map(order => {
                const oCfg    = STATUS_CONFIG[order.status_code] || STATUS_CONFIG.received;
                const dateStr = new Date(order.created_at).toLocaleDateString();
                return (
                  <div
                    key={order.id}
                    className={styles.card}
                    onClick={() => { setImgError(false); setSelectedOrder(order); }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={e => e.key === 'Enter' && setSelectedOrder(order)}
                  >
                    <div className={styles.cardLeft}>
                      <div className={styles.orderNum}>ORDER #{order.order_number}</div>
                      <div className={styles.orderName}>
                        {order.product_type}
                        <span className={styles.chip}>{order.color_printing ? 'Color' : 'B&W'}</span>
                      </div>
                      <div className={styles.meta}>
                        <span className={styles.metaIcon}>
                          <BookOpen size={13} />
                          {order.paper_type}
                        </span>
                        <span className={styles.divider}>|</span>
                        <span>Qty: {order.quantity} ({order.pages_per_copy} pgs)</span>
                        <span className={styles.divider}>|</span>
                        <span style={{ fontWeight: 700 }}>
                          {parseFloat(order.total_price || 0).toFixed(2)} ETB
                        </span>
                      </div>
                    </div>

                    <div className={styles.cardRight}>
                      <div className={styles.dateTag}>
                        <Calendar size={13} />
                        {dateStr}
                      </div>
                      <div
                        className={styles.badge}
                        style={{ backgroundColor: oCfg.bg, color: oCfg.color }}
                      >
                        <div className={styles.dot} style={{ backgroundColor: oCfg.dot }} />
                        {oCfg.label}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
