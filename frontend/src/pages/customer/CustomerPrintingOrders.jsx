import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../services/apiClient';
import {
  XCircle, Printer, RefreshCw,
  ArrowLeft, Calendar, FileText, BookOpen,
} from 'lucide-react';
import SegmentedSpinner from '../../components/ui/SegmentedSpinner';

const BASE = 'http://localhost:5000';

const STATUS_CONFIG = {
  received:         { label: 'Received',         color: '#2E8B57', bg: '#E8F5E9', dot: '#4CAF50' },
  processing:       { label: 'Processing',       color: '#6B8E23', bg: '#F1F8E9', dot: '#8BC34A' },
  ready_for_pickup: { label: 'Ready for Pickup', color: '#1B5E20', bg: '#C8E6C9', dot: '#4CAF50' },
  completed:        { label: 'Completed',        color: '#1B5E20', bg: '#C8E6C9', dot: '#4CAF50' },
  cancelled:        { label: 'Cancelled',        color: '#c62828', bg: '#FFEBEE', dot: '#F44336' },
};

const STATUS_TABS = [
  { key: 'all',              label: 'All Orders' },
  { key: 'received',         label: 'Received' },
  { key: 'processing',       label: 'Processing' },
  { key: 'ready_for_pickup', label: 'Ready for Pickup' },
];

export default function CustomerPrintingOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [imgError, setImgError] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
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
  const o = selectedOrder;
  const cfg = o ? (STATUS_CONFIG[o.status_code] || STATUS_CONFIG.received) : null;
  let attachment = null;
  let docSrc = null;
  let isImage = false;
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
    <div className="po-page">
      {/* ══ GLOBAL STYLES ══ */}
      <style>{`
        /* ── PAGE SHELL ── */
        .po-page {
          min-height: 100%;
          width: 100%;
          background-color: #F5F5F5;
          margin: 0;
          padding: 0;
          font-family: 'Inter', sans-serif;
          color: #424242;
          box-sizing: border-box;
        }
        .po-wrap {
          width: 100%;
          padding: 28px 32px;
          box-sizing: border-box;
        }
        @media (max-width: 768px) { .po-wrap { padding: 16px 14px; } }
        @media (max-width: 480px) { .po-wrap { padding: 12px 10px; } }

        /* ── HEADER ── */
        .po-back {
          display: inline-flex; align-items: center; gap: 6px;
          background: none; border: none; color: #6B8E23;
          font-size: 14px; font-weight: 600; cursor: pointer;
          margin-bottom: 20px; padding: 0; transition: color 0.15s;
        }
        .po-back:hover { color: #1B5E20; text-decoration: underline; }
        .po-header {
          display: flex; justify-content: space-between; align-items: center;
          margin-bottom: 24px; flex-wrap: wrap; gap: 12px;
        }
        .po-title {
          font-size: 24px; font-weight: 800; color: #1B5E20; margin: 0;
          display: flex; align-items: center; gap: 10px;
        }
        @media (max-width: 480px) { .po-title { font-size: 20px; } }
        .po-actions { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }

        /* ── BUTTONS ── */
        .po-btn-primary {
          background-color: #2E8B57; color: #fff;
          border: 1px solid #2E8B57; border-radius: 8px;
          padding: 10px 18px; font-size: 13px; font-weight: 700;
          cursor: pointer; display: inline-flex; align-items: center; gap: 7px;
          text-decoration: none; text-transform: uppercase; letter-spacing: 0.04em;
          transition: all 0.15s ease;
        }
        .po-btn-primary:hover { 
          background-color: #1B5E20; 
          border-color: #1B5E20; 
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(0,0,0,0.15);
        }
        .po-btn-secondary {
          background-color: #fff; color: #1B5E20;
          border: 1px solid #8D6E63; border-radius: 8px;
          padding: 10px 18px; font-size: 13px; font-weight: 700;
          cursor: pointer; display: inline-flex; align-items: center; gap: 7px;
          text-transform: uppercase; letter-spacing: 0.04em;
          transition: all 0.15s ease;
        }
        .po-btn-secondary:hover { 
          background-color: #F5F5F5; 
          color: #228B22; 
          border-color: #8D6E63; 
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        }
        .po-btn-icon {
          background: #fff; color: #424242;
          border: 1px solid #8D6E63; border-radius: 6px;
          padding: 8px 10px; cursor: pointer;
          display: inline-flex; align-items: center; justify-content: center;
          transition: all 0.15s ease;
        }
        .po-btn-icon:hover { 
          background: #F0F0F0; 
          color: #1B5E20; 
          transform: translateY(-1px);
          box-shadow: 0 2px 6px rgba(0,0,0,0.1);
        }
        .po-btn-icon:disabled { opacity: 0.5; cursor: not-allowed; transform: none; box-shadow: none; }

        /* ── TABS ── */
        .po-tabs {
          display: flex; border-bottom: 2px solid #D7CCC8;
          margin-bottom: 24px; overflow-x: auto;
          -webkit-overflow-scrolling: touch; scrollbar-width: none;
        }
        .po-tabs::-webkit-scrollbar { display: none; }
        .po-tab {
          background: none; border: none; padding: 12px 16px;
          font-size: 14px; font-weight: 600; color: #8D6E63;
          cursor: pointer; position: relative; white-space: nowrap;
          transition: color 0.15s;
        }
        .po-tab:hover { color: #228B22; }
        .po-tab.active { color: #228B22; }
        .po-tab.active::after {
          content: ''; position: absolute; bottom: -2px; left: 0; right: 0;
          height: 3px; background-color: #228B22;
        }

        /* ── STATUS BADGE ── */
        .po-badge {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 5px 10px; font-size: 11px; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.05em;
        }
        .po-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }

        /* ── EMPTY STATE ── */
        .po-empty {
          display: flex; flex-direction: column; align-items: center;
          justify-content: center; padding: 60px 20px;
          background: #fff; border: 1px solid #E0E0E0; text-align: center;
          gap: 4px;
        }
        .po-empty-title { font-size: 17px; font-weight: 700; color: #424242; margin: 16px 0 20px; }

        /* ── ORDER LIST ── */
        .po-list { display: flex; flex-direction: column; gap: 12px; }
        .po-card {
          background: #fff; border: 1px solid #E0E0E0;
          border-radius: 12px;
          padding: 18px 20px; display: flex; justify-content: space-between;
          align-items: center; cursor: pointer; gap: 12px;
          transition: all 0.15s ease;
        }
        .po-card:hover {
          border-color: #8D6E63;
          box-shadow: 0 8px 24px rgba(0,0,0,0.08);
          transform: translateY(-2px);
        }
        @media (max-width: 640px) {
          .po-card { flex-direction: column; align-items: flex-start; gap: 10px; }
          .po-card-right { flex-direction: row !important; align-items: flex-start !important; flex-wrap: wrap; gap: 8px !important; }
        }
        .po-card-left { display: flex; flex-direction: column; gap: 6px; flex: 1; min-width: 0; }
        .po-order-num { font-size: 12px; font-weight: 700; color: #8D6E63; text-transform: uppercase; letter-spacing: 0.05em; }
        .po-order-name {
          font-size: 17px; font-weight: 800; color: #1B5E20;
          display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
        }
        .po-chip {
          font-size: 10px; padding: 2px 8px;
          background: #E8F5E9; color: #2E8B57;
          border: 1px solid #A5D6A7; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.04em;
        }
        .po-meta { display: flex; align-items: center; gap: 12px; font-size: 13px; color: #555; flex-wrap: wrap; }
        .po-divider { color: #BDBDBD; }
        .po-card-right { display: flex; flex-direction: column; align-items: flex-end; gap: 12px; flex-shrink: 0; }
        .po-date { display: flex; align-items: center; gap: 5px; font-size: 13px; color: #8D6E63; font-weight: 600; white-space: nowrap; }

        /* ── DETAIL GRID ── */
        .po-detail-grid { display: grid; grid-template-columns: 1.8fr 1fr; gap: 20px; }
        @media (max-width: 900px) { .po-detail-grid { grid-template-columns: 1fr; } }
        .po-detail-card {
          background: #fff; border: 1px solid #E0E0E0;
          border-radius: 12px; padding: 24px;
        }
        @media (max-width: 480px) { .po-detail-card { padding: 16px; } }
        .po-detail-card-title {
          font-size: 16px; font-weight: 800; color: #1B5E20;
          margin: 0 0 18px 0; display: flex; align-items: center; gap: 8px;
          border-bottom: 1px solid #F0F0F0; padding-bottom: 14px;
        }
        .po-info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
        @media (max-width: 480px) { .po-info-grid { grid-template-columns: 1fr; gap: 12px; } }
        .po-info-item { display: flex; flex-direction: column; gap: 4px; }
        .po-info-label { font-size: 11px; font-weight: 700; color: #8D6E63; text-transform: uppercase; letter-spacing: 0.06em; }
        .po-info-value { font-size: 15px; color: #1B5E20; font-weight: 600; }

        /* ── ATTACHMENT ── */
        .po-attach-empty {
          display: flex; flex-direction: column; align-items: center;
          padding: 40px 16px; text-align: center;
          background: #F5F5F5; border: 2px dashed #8D6E63;
        }
        .po-attach-empty-title { font-size: 15px; font-weight: 700; color: #424242; margin: 14px 0 6px; }
        .po-attach-empty-desc { font-size: 13px; color: #8D6E63; }
        .po-attach-file {
          display: flex; flex-direction: column; align-items: center;
          padding: 32px 16px; background: #F1F8E9;
          text-align: center; border: 1px solid #E0E0E0; border-radius: 12px;
        }
        .po-attach-file-name { font-size: 14px; font-weight: 600; color: #1B5E20; margin: 14px 0; word-break: break-all; }
        .po-attach-img { cursor: zoom-in; overflow: hidden; border: 1px solid #E0E0E0; border-radius: 10px; transition: all 0.15s ease; }
        .po-attach-img:hover { transform: scale(1.03); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
        .po-attach-img img { width: 100%; height: auto; display: block; border-radius: 10px; }

        /* ── MODAL ── */
        .po-modal {
          position: fixed; inset: 0; background: rgba(0,0,0,0.88);
          z-index: 9999; display: flex; align-items: center;
          justify-content: center; padding: 32px;
        }
        .po-modal-close {
          position: absolute; top: 20px; right: 20px;
          background: none; border: none; color: #fff; cursor: pointer;
        }
        .po-modal-img { max-width: 100%; max-height: 100%; object-fit: contain; }

        /* ── SPINNER ── */
        .spin { animation: spin 0.8s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>

      {/* ══ FULLSCREEN IMAGE MODAL ══ */}
      {selectedImage && (
        <div className="po-modal" onClick={() => setSelectedImage(null)}>
          <button className="po-modal-close" onClick={() => setSelectedImage(null)}>
            <XCircle size={32} />
          </button>
          <img
            src={selectedImage}
            alt="Document Full View"
            className="po-modal-img"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}

      {selectedOrder ? (
        /* ══════════ DETAIL VIEW ══════════ */
        <div className="po-wrap">
          <button className="po-back" onClick={() => setSelectedOrder(null)}>
            <ArrowLeft size={16} /> Back to Printing Orders
          </button>

          <div className="po-header">
            <h1 className="po-title">Order #{o.order_number}</h1>
            <div className="po-actions">
              <div
                className="po-badge"
                style={{ backgroundColor: cfg.bg, color: cfg.color }}
              >
                <div className="po-dot" style={{ backgroundColor: cfg.dot }} />
                {cfg.label}
              </div>
            </div>
          </div>

          <div className="po-detail-grid">
            {/* Left — Details */}
            <div className="po-detail-card">
              <h2 className="po-detail-card-title">
                <BookOpen size={20} color="#228B22" /> Printing Details
              </h2>
              <div className="po-info-grid">
                <div className="po-info-item">
                  <div className="po-info-label">Service Type</div>
                  <div className="po-info-value">{o.product_type}</div>
                </div>
                <div className="po-info-item">
                  <div className="po-info-label">Paper / Binding</div>
                  <div className="po-info-value">{o.paper_type} | {o.binding_type || 'None'}</div>
                </div>
                <div className="po-info-item">
                  <div className="po-info-label">Quantity</div>
                  <div className="po-info-value">{o.quantity} Copy(s) ({o.pages_per_copy} pgs each)</div>
                </div>
                <div className="po-info-item">
                  <div className="po-info-label">Color Printing</div>
                  <div className="po-info-value">{o.color_printing ? 'YES — Color' : 'NO — Black & White'}</div>
                </div>
                <div className="po-info-item">
                  <div className="po-info-label">Due Date</div>
                  <div className="po-info-value">{o.due_date ? new Date(o.due_date).toLocaleDateString() : 'N/A'}</div>
                </div>
                <div className="po-info-item">
                  <div className="po-info-label">Total Amount</div>
                  <div className="po-info-value" style={{ fontSize: 20, fontWeight: 900, color: '#1B5E20' }}>
                    {parseFloat(o.total_price || 0).toFixed(2)} ETB
                  </div>
                </div>
                <div className="po-info-item" style={{ gridColumn: '1 / -1' }}>
                  <div className="po-info-label">Special Instructions</div>
                  <div className="po-info-value">{o.special_instructions || 'None provided'}</div>
                </div>
              </div>

              {o.status_code === 'received' && (
                <div style={{ marginTop: 24 }}>
                  <button className="po-btn-secondary" onClick={() => handleCancel(o.id)}>
                    <XCircle size={16} /> Cancel Order
                  </button>
                </div>
              )}
            </div>

            {/* Right — Attachment */}
            <div className="po-detail-card">
              <h2 className="po-detail-card-title">
                <FileText size={20} color="#228B22" /> Document Attachment
              </h2>
              {!docSrc ? (
                <div className="po-attach-empty">
                  <FileText size={48} color="#8D6E63" />
                  <div className="po-attach-empty-title">No document attached</div>
                  <div className="po-attach-empty-desc">Provide the document physically at the printing shop.</div>
                </div>
              ) : imgError || !isImage ? (
                <div className="po-attach-file">
                  <FileText size={48} color="#228B22" />
                  <div className="po-attach-file-name">{attachment?.originalName || 'Document File'}</div>
                  <a href={docSrc} target="_blank" rel="noreferrer" className="po-btn-primary">
                    Download File
                  </a>
                </div>
              ) : (
                <div className="po-attach-img" onClick={() => setSelectedImage(docSrc)}>
                  <img src={docSrc} alt="Attached Document" onError={() => setImgError(true)} />
                </div>
              )}
            </div>
          </div>
        </div>

      ) : (
        /* ══════════ LIST VIEW ══════════ */
        <div className="po-wrap">
          <div className="po-header">
            <h1 className="po-title">
              <Printer size={26} color="#228B22" /> Printing Orders
            </h1>
            <div className="po-actions">
              <button className="po-btn-icon" onClick={handleRefresh} disabled={refreshing} title="Refresh">
                <SegmentedSpinner size={18} />
              </button>
              <button className="po-btn-primary" onClick={() => navigate('/services/printing')}>
                + New Order
              </button>
            </div>
          </div>

          <div className="po-tabs">
            {STATUS_TABS.map(tab => (
              <button
                key={tab.key}
                className={`po-tab${activeTab === tab.key ? ' active' : ''}`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="po-empty">
              <div className="po-empty-title">Loading orders...</div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="po-empty">
              <Printer size={48} color="#8D6E63" />
              <div className="po-empty-title">No printing orders found for this status.</div>
              <button className="po-btn-primary" onClick={() => navigate('/services/printing')}>
                Order Print Service
              </button>
            </div>
          ) : (
            <div className="po-list">
              {filtered.map(order => {
                const oCfg = STATUS_CONFIG[order.status_code] || STATUS_CONFIG.received;
                const dateStr = new Date(order.created_at).toLocaleDateString();
                return (
                  <div
                    key={order.id}
                    className="po-card"
                    onClick={() => { setImgError(false); setSelectedOrder(order); }}
                  >
                    <div className="po-card-left">
                      <div className="po-order-num">ORDER #{order.order_number}</div>
                      <div className="po-order-name">
                        {order.product_type}
                        <span className="po-chip">{order.color_printing ? 'Color' : 'B&W'}</span>
                      </div>
                      <div className="po-meta">
                        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <BookOpen size={13} color="#6B8E23" /> {order.paper_type}
                        </span>
                        <span className="po-divider">|</span>
                        <span>Qty: {order.quantity} ({order.pages_per_copy} pgs)</span>
                        <span className="po-divider">|</span>
                        <span style={{ fontWeight: 700, color: '#1B5E20' }}>
                          {parseFloat(order.total_price || 0).toFixed(2)} ETB
                        </span>
                      </div>
                    </div>
                    <div className="po-card-right">
                      <div className="po-date"><Calendar size={13} /> {dateStr}</div>
                      <div
                        className="po-badge"
                        style={{ backgroundColor: oCfg.bg, color: oCfg.color }}
                      >
                        <div className="po-dot" style={{ backgroundColor: oCfg.dot }} />
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
