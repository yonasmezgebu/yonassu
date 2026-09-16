import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { PenTool, RefreshCw, ArrowRight, Eye } from 'lucide-react';
import apiClient, { mediaUrl } from '../../services/apiClient';
import { StatusBadge } from './StageShared';
import { StageStyles } from './printingStageStyles';
import StageNav from './StageNav';
import StageConfirmModal from './StageConfirmModal';
import FileViewer from '../../components/ui/FileViewer';

const IMAGE_EXTS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'];

const getAttachments = (order) => {
  if (!order?.attachments) return [];
  if (Array.isArray(order.attachments)) return order.attachments;
  try {
    const parsed = JSON.parse(order.attachments);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
};

const PrintingDesign = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [movingId, setMovingId] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [viewFile, setViewFile] = useState(null);
  const navigate = useNavigate();

  const openAttachment = (att) => {
    if (!att?.filename) return;
    const url = mediaUrl(`/uploads/orders/${att.filename}`);
    const ext = (att.originalName || att.filename || '').split('.').pop().toLowerCase();
    if (IMAGE_EXTS.includes(ext) || ext === 'docx') {
      setViewFile({ originalName: att.originalName || att.filename, url });
      return;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const load = useCallback(async () => {
    try {
      const res = await apiClient.get('/printing/orders', { params: { limit: 200 } });
      const raw = res.data?.orders || res.data || [];
      setOrders(raw.filter(o => ['in_design'].includes(o.status_code)));
    } catch (err) {
      console.error('Failed to load design orders', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const doMove = async (order) => {
    setMovingId(order.id);
    try {
      await apiClient.put(`/printing/orders/${order.id}/status`, { status: 'file_check' });
      await load();
    } catch (err) {
      alert(err?.message || 'Failed to move order to Prepress.');
    } finally {
      setMovingId(null);
      setConfirm(null);
    }
  };

  return (
    <div className="stg-root" style={{ margin: '-24px', minHeight: 'calc(100vh - 64px)' }}>
      <StageStyles />
      <StageNav current="design" />
      <div className="stg-head">
        <h1 className="stg-title">
          <PenTool color="#7C3AED" /> IN DESIGN
        </h1>
        <p className="stg-sub">Orders currently in the design stage. Confirm to advance an order to Prepress (File Check).</p>
      </div>

      <div className="stg-toolbar">
        <div className="stg-field" style={{ alignSelf: 'flex-end' }}>
          <button className="stg-btn stg-btn--soft-blue stg-btn--sm" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw size={14} style={{ marginRight: 4 }} /> {refreshing ? '...' : 'Refresh'}
          </button>
        </div>
      </div>

      <div className="stg-table-card">
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Loading orders...</div>
        ) : (
          <div className="stg-table-scroll">
            <table className="stg-table">
              <thead>
                <tr>
                  {['Order #', 'Customer', 'Service', 'Qty', 'Total (ETB)', 'Payment', 'Status', 'Due Date', 'Action'].map(col => (
                    <th key={col} className={`stg-th${col === 'Qty' || col.includes('Total') ? ' stg-th--num' : ''}`}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.map(order => {
                  const attaches = getAttachments(order);
                  return (
                  <tr key={order.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/printing-manager/orders/${order.id}`)}>
                    <td className="stg-td stg-strong">{order.order_number}</td>
                    <td className="stg-td">{order.customer_name || 'Walk-in'}</td>
                    <td className="stg-td stg-muted">{order.product_type || '—'}</td>
                    <td className="stg-td stg-num" style={{ textAlign: 'right' }}>{order.quantity}</td>
                    <td className="stg-td stg-num" style={{ textAlign: 'right', fontWeight: 700 }}>{parseFloat(order.total_price || 0).toLocaleString('en-ET', { minimumFractionDigits: 2 })}</td>
                    <td className="stg-td" style={{ cursor: 'default' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 20, background: order.payment_status === 'Confirmed' ? '#dcfce7' : '#fffbeb', color: order.payment_status === 'Confirmed' ? '#14532d' : '#92400e', fontWeight: 700, fontSize: 12 }}>
                        {order.payment_status === 'Confirmed' ? '✅ Confirmed' : '⏳ Pending'}
                      </span>
                    </td>
                    <td className="stg-td" style={{ cursor: 'default' }}><StatusBadge code={order.status_code} name={order.status_name} /></td>
                    <td className="stg-td">{order.due_date ? new Date(order.due_date).toLocaleDateString() : '—'}</td>
                    <td className="stg-td" onClick={e => e.stopPropagation()}>
                      {movingId === order.id ? (
                        <span className="stg-note">Moving...</span>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          {attaches.length > 0 ? (
                            <button
                              className="stg-btn stg-btn--soft-amber stg-btn--sm"
                              onClick={() => openAttachment(attaches[0])}
                              title={attaches.length > 1 ? `${attaches.length} files uploaded — opens the first one` : 'Open the customer uploaded file'}
                            >
                              <Eye size={14} /> Open File{attaches.length > 1 ? ` (${attaches.length})` : ''}
                            </button>
                          ) : (
                            <span className="stg-note" style={{ fontSize: 11 }}>No file</span>
                          )}
                          <button className="stg-btn stg-btn--soft-violet stg-btn--sm" onClick={() => setConfirm(order)}>
                            <ArrowRight size={14} /> → Prepress
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
                })}
                {orders.length === 0 && <tr><td className="stg-td" colSpan={9}><div className="stg-empty">No orders currently in Design.</div></td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <StageConfirmModal
        open={!!confirm}
        title={`Move Order ${confirm?.order_number || ''} to Prepress`}
        message="Confirm the design is complete. This order will advance to the File Check (Prepress) stage."
        details={confirm ? `Customer: ${confirm.customer_name || 'Walk-in'} · Total: ETB ${parseFloat(confirm.total_price || 0).toLocaleString()}` : ''}
        confirmLabel="Move to Prepress"
        busy={movingId === confirm?.id}
        onConfirm={() => confirm && doMove(confirm)}
        onClose={() => setConfirm(null)}
      />

      <FileViewer file={viewFile} onClose={() => setViewFile(null)} />
    </div>
  );
};

export default PrintingDesign;