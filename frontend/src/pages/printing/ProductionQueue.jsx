import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import printingService from '../../services/printingService';
import { RefreshCw } from 'lucide-react';
import SegmentedSpinner from '../../components/ui/SegmentedSpinner';

// ── Real DB status codes from order_statuses table ──
const LANES = [
  { code: 'received',    label: 'Received',        icon: '📥', accent: '#87CEEB', bg: '#eff6ff' },
  { code: 'in_queue',    label: 'Job Queue',        icon: '📋', accent: '#8BC34A', bg: '#f0fdf4' },
  { code: 'in_design',   label: 'In Design',        icon: '🎨', accent: '#6B8E23', bg: '#f7fee7' },
  { code: 'file_check',  label: 'File Check',       icon: '🔍', accent: '#FF9800', bg: '#fffbeb' },
  { code: 'in_printing', label: 'In Printing',      icon: '🖨️', accent: '#2E8B57', bg: '#ecfdf5' },
  { code: 'in_progress', label: 'In Progress',      icon: '⚙️', accent: '#2E8B57', bg: '#ecfdf5' },
  { code: 'finishing',   label: 'Finishing',        icon: '✂️', accent: '#228B22', bg: '#f0fdf4' },
  { code: 'ready',       label: 'Ready for Pickup', icon: '✅', accent: '#4CAF50', bg: '#dcfce7' },
];

// What happens when you click advance
const NEXT_STATUS = {
  received:    'in_queue',
  in_queue:    'in_printing',
  in_design:   'file_check',
  file_check:  'in_printing',
  in_printing: 'finishing',
  in_progress: 'finishing',
  finishing:   'ready',
};

const NEXT_LABEL = {
  received:    '→ Move to Queue',
  in_queue:    '→ Start Printing',
  in_design:   '→ File Check',
  file_check:  '→ Start Printing',
  in_printing: '→ Finishing',
  in_progress: '→ Finishing',
  finishing:   '→ Mark Ready',
};

const getDue = (d) => {
  if (!d) return { text: '—', color: '#94a3b8' };
  const days = Math.ceil((new Date(d) - new Date()) / 86400000);
  if (days < 0) return { text: `${Math.abs(days)}d overdue`, color: '#dc2626' };
  if (days === 0) return { text: 'Due today', color: '#f59e0b' };
  return { text: `${days}d left`, color: '#16a34a' };
};

const ProductionQueue = () => {
  const navigate = useNavigate();
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchQueue = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      // apiClient interceptor returns response.data directly.
      // Server sends: { status:'success', data:{ orders:[...] } }
      // So here: response = { status:'success', data:{ orders:[...] } }
      const response = await printingService.getProductionQueue();
      const orders = response?.data?.orders || [];
      setQueue(orders);
    } catch (err) {
      console.error('Failed to fetch production queue:', err);
      setError('Failed to load orders. Please refresh.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchQueue(); }, [fetchQueue]);

  const handleAdvance = async (orderId, nextStatus) => {
    setActionLoading(orderId);
    try {
      await printingService.updateOrderStatus(orderId, nextStatus);
      await fetchQueue();
    } catch (err) {
      alert('Failed to update order status. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 12, color: '#059669' }}>
        <SegmentedSpinner size={32} />
        <p style={{ margin: 0, fontWeight: 600 }}>Loading production queue...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 32, textAlign: 'center' }}>
        <p style={{ color: '#dc2626', fontWeight: 600 }}>{error}</p>
        <button onClick={fetchQueue} style={{ marginTop: 12, padding: '10px 24px', background: '#059669', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700 }}>
          Try Again
        </button>
      </div>
    );
  }

  // Total active orders
  const totalActive = queue.length;

  return (
    <div style={{ padding: '24px', background: '#f0fdf4', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 900, color: '#064e3b' }}>
            🖨️ Production Queue
          </h1>
          <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: 13 }}>
            {totalActive} active order{totalActive !== 1 ? 's' : ''} across all stages
          </p>
        </div>
        <button
          onClick={fetchQueue}
          style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'white', border: '1.5px solid #d1fae5', padding: '10px 18px', borderRadius: 10, cursor: 'pointer', color: '#059669', fontWeight: 700, fontSize: 13, boxShadow: '0 2px 6px rgba(5,150,105,0.1)' }}
        >
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      {/* Summary pills */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
        {LANES.map(lane => {
          const count = queue.filter(o => o.status_code === lane.code).length;
          if (count === 0) return null;
          return (
            <span key={lane.code} style={{ padding: '4px 14px', borderRadius: 999, background: lane.bg, color: lane.accent, border: `1.5px solid ${lane.accent}`, fontSize: 12, fontWeight: 700 }}>
              {lane.icon} {lane.label}: {count}
            </span>
          );
        })}
        {totalActive === 0 && (
          <span style={{ color: '#94a3b8', fontSize: 13, fontWeight: 600 }}>No active orders</span>
        )}
      </div>

      {/* Kanban board — horizontal scroll */}
      <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 16 }}>
        {LANES.map(lane => {
          const items = queue.filter(o => o.status_code === lane.code);
          return (
            <div
              key={lane.code}
              style={{
                minWidth: 260, maxWidth: 280, flexShrink: 0,
                background: 'white', borderRadius: 14, overflow: 'hidden',
                boxShadow: '0 2px 10px rgba(0,0,0,0.07)',
                border: `1.5px solid ${lane.accent}30`,
              }}
            >
              {/* Lane header */}
              <div style={{ background: lane.bg, borderBottom: `3px solid ${lane.accent}`, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 18 }}>{lane.icon}</span>
                  <span style={{ fontWeight: 800, color: '#1e293b', fontSize: 13 }}>{lane.label}</span>
                </div>
                <span style={{ background: lane.accent, color: 'white', borderRadius: 999, width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800 }}>
                  {items.length}
                </span>
              </div>

              {/* Cards */}
              <div style={{ padding: '10px', display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 500, overflowY: 'auto' }}>
                {items.length === 0 ? (
                  <div style={{ padding: '20px 0', textAlign: 'center', color: '#cbd5e1', fontSize: 12 }}>
                    No orders
                  </div>
                ) : (
                  items.map(order => {
                    const due = getDue(order.due_date);
                    const nextStatus = NEXT_STATUS[lane.code];
                    const nextLabel = NEXT_LABEL[lane.code];
                    const isActioning = actionLoading === order.id;

                    return (
                      <div
                        key={order.id}
                        style={{
                          background: '#fafafa', borderRadius: 10, padding: '12px 14px',
                          border: '1px solid #e2e8f0', cursor: 'pointer',
                          transition: 'box-shadow 0.15s',
                        }}
                        onMouseOver={e => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'}
                        onMouseOut={e => e.currentTarget.style.boxShadow = 'none'}
                        onClick={() => navigate(`/printing/orders/${order.id}`)}
                      >
                        {/* Order number + payment badge */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                          <span style={{ fontWeight: 800, color: '#2563eb', fontSize: 12 }}>
                            {order.order_number || `#${order.id}`}
                          </span>
                          <span style={{
                            fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999,
                            background: order.payment_status === 'Confirmed' ? '#dcfce7' : '#fff7ed',
                            color: order.payment_status === 'Confirmed' ? '#16a34a' : '#c2410c',
                            border: `1px solid ${order.payment_status === 'Confirmed' ? '#86efac' : '#fed7aa'}`
                          }}>
                            {order.payment_status === 'Confirmed' ? '✅ Paid' : '⏳ Pending'}
                          </span>
                        </div>

                        {/* Customer + product */}
                        <div style={{ fontWeight: 700, color: '#1e293b', fontSize: 13, marginBottom: 2 }}>
                          {order.product_type || 'Print Job'}
                        </div>
                        <div style={{ fontSize: 11, color: '#64748b', marginBottom: 8 }}>
                          {order.customer_name || 'Walk-in'} · Qty {order.quantity}
                          {order.paper_type && ` · ${order.paper_type}`}
                        </div>

                        {/* Due date */}
                        <div style={{ fontSize: 11, fontWeight: 700, color: due.color, marginBottom: 10 }}>
                          🕐 {due.text}
                        </div>

                        {/* Amount */}
                        <div style={{ fontSize: 12, fontWeight: 800, color: '#059669', marginBottom: 10 }}>
                          {parseFloat(order.total_price || 0).toLocaleString()} ETB
                        </div>

                        {/* Advance button */}
                        {nextStatus && (
                          <button
                            onClick={e => { e.stopPropagation(); handleAdvance(order.id, nextStatus); }}
                            disabled={isActioning}
                            style={{
                              width: '100%', padding: '8px', background: lane.accent, color: 'white',
                              border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 12,
                              cursor: isActioning ? 'not-allowed' : 'pointer', opacity: isActioning ? 0.7 : 1,
                              transition: 'opacity 0.2s'
                            }}
                          >
                            {isActioning ? '⏳ Updating...' : nextLabel}
                          </button>
                        )}
                        {!nextStatus && (
                          <span style={{ display: 'block', textAlign: 'center', fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>
                            ✅ Final Stage
                          </span>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProductionQueue;
