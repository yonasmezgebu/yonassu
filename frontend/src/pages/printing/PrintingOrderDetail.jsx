import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../../services/apiClient';
import { ArrowLeft, Clock, User, ChevronDown, ChevronUp } from 'lucide-react';
import { StageStyles } from './printingStageStyles';

// Real DB status flow matching order_statuses table
const STATUS_FLOW = ['received', 'in_queue', 'in_design', 'file_check', 'in_printing', 'in_progress', 'finishing', 'ready', 'delivered'];
const STATUS_LABELS = {
  received:    '📥 Received',
  in_queue:    '📋 Job Queue',
  in_design:   '🎨 In Design',
  file_check:  '🔍 File Check',
  in_printing: '🖨️ In Printing',
  in_progress: '⚙️ In Progress',
  finishing:   '✂️ Finishing',
  ready:       '✅ Ready for Pickup',
  delivered:   '🎉 Delivered'
};

const statusBadge = (code) => {
  const colors = {
    received: '#87CEEB', in_queue: '#8BC34A', in_design: '#6B8E23',
    file_check: '#FF9800', in_printing: '#2E8B57', in_progress: '#059669',
    finishing: '#228B22', ready: '#4CAF50', delivered: '#1B5E20', cancelled: '#EF4444'
  };
  return { background: (colors[code] || '#6B7280') + '20', color: colors[code] || '#6B7280', border: 'none' };
};


const PrintingOrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const [orderRes, histRes] = await Promise.all([
        axios.get(`/printing/orders/${id}`),
        axios.get(`/printing/orders/${id}/history`)
      ]);
      if (orderRes.status === 'success') setOrder(orderRes.data?.order);
      if (histRes.status === 'success') setHistory(histRes.data?.history || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const updateStatus = async (status) => {
    if (!window.confirm(`Move order to "${status.replace(/_/g, ' ')}"?`)) return;
    setUpdating(true);
    try {
      const res = await axios.put(`/printing/orders/${id}/status`, { status });
      if (res.status === 'success') load();
    } catch (err) {
      alert(err.message || 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <div style={{ padding: '2rem', color: 'hsl(var(--muted-foreground))' }}>Loading order...</div>;
  if (!order) return <div style={{ padding: '2rem', color: 'hsl(var(--danger))' }}>Order not found.</div>;

  const statusIdx = STATUS_FLOW.indexOf(order.status_code);
  const isDelivered = order.status_code === 'delivered';
  const isCancelled = order.status_code === 'cancelled';

  return (
    <div className="stg-root">
      <StageStyles />

      <button onClick={() => navigate('/printing-manager/jobs/queue')} className="stg-btn stg-btn--ghost stg-btn--sm" style={{ marginBottom: '1.5rem' }}>
        <ArrowLeft size={16} /> Back to Orders
      </button>

      <div className="stg-record-head">
        <div>
          <h2 className="stg-record-id">{order.order_number}</h2>
          <p className="stg-sub">
            Created {new Date(order.created_at).toLocaleString()}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <span className={order.payment_status === 'Confirmed' ? 'stg-pill stg-pill--success' : order.payment_status === 'Rejected' ? 'stg-pill stg-pill--danger' : 'stg-pill stg-pill--warning'}>
            {order.payment_status === 'Confirmed' ? '✅ Paid' : order.payment_status === 'Rejected' ? '❌ Payment Rejected' : '⏳ Payment Pending'}
          </span>
          <span className="stg-pill" style={statusBadge(order.status_code)}>
            {order.status_name}
          </span>
        </div>
      </div>

      <div className="stg-detail-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div>
          <h4 className="stg-note-label" style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase', letterSpacing: 1 }}>Customer</h4>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <User size={14} className="stg-muted" />
            <span className="stg-detail-value">{order.customer_name || 'Walk-in Customer'}</span>
          </div>
          {order.customer_phone && <div className="stg-note" style={{ marginLeft: 22 }}>{order.customer_phone}</div>}
        </div>
        
        <div>
          <h4 className="stg-note-label" style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase', letterSpacing: 1 }}>Order Info</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '1rem' }}>
            <div><span className="stg-muted">Product:</span> <span className="stg-strong">{order.product_type}</span></div>
            <div><span className="stg-muted">Paper:</span> <span className="stg-strong">{order.paper_type}</span></div>
            <div><span className="stg-muted">Pages:</span> <span className="stg-strong">{order.pages_per_copy}</span></div>
            <div><span className="stg-muted">Qty:</span> <span className="stg-strong">{order.quantity}</span></div>
            <div><span className="stg-muted">Binding:</span> <span className="stg-strong">{order.binding_type || 'None'}</span></div>
            <div><span className="stg-muted">Color:</span> <span className="stg-strong">{order.color_printing ? 'Yes (×2)' : 'No'}</span></div>
            <div><span className="stg-muted">Due:</span> <span className="stg-strong">{order.due_date ? new Date(order.due_date).toLocaleDateString() : '-'}</span></div>
            <div><span className="stg-muted">Created by:</span> <span className="stg-strong">{order.created_by_name || '-'}</span></div>
          </div>
        </div>
      </div>

      <div className="stg-detail-grid">
        <div>
          <div className="stg-detail-label">Price/Unit</div>
          <div className="stg-detail-value">{parseFloat(order.price_per_unit || 0).toFixed(2)} ETB</div>
        </div>
        <div>
          <div className="stg-detail-label">Binding Cost</div>
          <div className="stg-detail-value">{parseFloat(order.binding_cost || 0).toFixed(2)} ETB</div>
        </div>
        <div>
          <div className="stg-detail-label">VAT Amount</div>
          <div className="stg-detail-value">{parseFloat(order.vat_amount || 0).toFixed(2)} ETB</div>
        </div>
        <div>
          <div className="stg-detail-label">Total (incl. VAT)</div>
          <div className="stg-detail-value" style={{ color: 'hsl(var(--success))', fontWeight: 500 }}>{parseFloat(order.total_price || 0).toLocaleString()} ETB</div>
        </div>
      </div>

      <div className="stg-detail-grid">
        <div>
          <div className="stg-detail-label">Payment Status</div>
          <div className="stg-detail-value" style={{ color: order.payment_status === 'Confirmed' ? 'hsl(var(--success))' : order.payment_status === 'Rejected' ? 'hsl(var(--danger))' : 'hsl(var(--warning))' }}>
            {order.payment_status === 'Confirmed' ? '✅ Confirmed' : order.payment_status === 'Rejected' ? '❌ Rejected' : '⏳ Pending'}
          </div>
        </div>
        <div>
          <div className="stg-detail-label">Payment Method</div>
          <div className="stg-detail-value">{order.payment_method || 'Not Specified'}</div>
        </div>
        <div>
          <div className="stg-detail-label">Payment Reference</div>
          <div className="stg-detail-value" style={{ fontFamily: 'monospace' }}>{order.payment_reference || 'N/A'}</div>
        </div>
        <div>
          <div className="stg-detail-label">Amount (incl. VAT)</div>
          <div className="stg-detail-value" style={{ color: 'hsl(var(--success))', fontWeight: 500 }}>{parseFloat(order.total_price || 0).toLocaleString()} ETB</div>
        </div>
      </div>

      {!isDelivered && !isCancelled && (
        <div style={{ paddingBottom: '1.5rem', borderBottom: '1px solid hsl(var(--border))', marginBottom: '2rem' }}>
          <h4 className="stg-note-label" style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase', letterSpacing: 1, marginBottom: '1rem' }}>Status Progress</h4>
          
          <div className="stg-alert" style={{ 
            borderColor: order.payment_status === 'Confirmed' ? 'hsl(var(--success))' : 'hsl(var(--warning))',
            color: order.payment_status === 'Confirmed' ? 'hsl(var(--success))' : 'hsl(var(--warning))'
          }}>
            <span style={{ fontWeight: 500 }}>
              {order.payment_status === 'Confirmed'
                ? '✅ Payment Confirmed by Finance — Order can proceed to printing'
                : '⏳ Awaiting Finance Payment Confirmation — Cannot proceed to In Progress until Finance approves'}
            </span>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {STATUS_FLOW.map((s, i) => {
              const done = i <= statusIdx;
              const isNext = i === statusIdx + 1;
              const canProceed = isNext && order.payment_status === 'Confirmed';

              return (
                <button key={s} onClick={() => canProceed && updateStatus(s)} disabled={!canProceed || updating}
                  className={done ? 'stg-btn stg-btn--success' : canProceed ? 'stg-btn stg-btn--primary' : 'stg-btn stg-btn--ghost'}
                  style={{
                    cursor: (canProceed && !updating) ? 'pointer' : 'not-allowed',
                    opacity: (!done && !canProceed) ? 0.6 : 1,
                    background: (!done && !canProceed) ? 'hsl(var(--muted))' : undefined,
                    border: (!done && !canProceed) ? 'none' : undefined,
                  }}>
                  {STATUS_LABELS[s] || s.replace(/_/g, ' ')}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {order.special_instructions && (
        <div className="stg-note-box" style={{ background: 'hsla(var(--warning), 0.1)', padding: '1rem', borderLeft: '4px solid hsl(var(--warning))' }}>
          <h4 className="stg-note-label" style={{ fontSize: 12, color: 'hsl(var(--warning))', textTransform: 'uppercase', letterSpacing: 1 }}>Special Instructions</h4>
          <p className="stg-note-text" style={{ color: 'hsl(var(--foreground))' }}>{order.special_instructions}</p>
        </div>
      )}

      <button onClick={() => setShowHistory(!showHistory)}
        className="stg-btn stg-btn--ghost stg-btn--sm" style={{ border: 'none' }}>
        <Clock size={14} /> Status History {showHistory ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {showHistory && (
        <div className="stg-note-box">
          {history.length === 0 ? (
            <p className="stg-note">No history recorded.</p>
          ) : (
            history.map(h => (
              <div key={h.id || h.created_at} style={{ display: 'flex', gap: 12, padding: '8px 0', borderBottom: '1px solid hsl(var(--border))', fontSize: '1rem' }}>
                <div style={{ minWidth: 160, color: 'hsl(var(--muted-foreground))' }}>{new Date(h.created_at || h.changed_at).toLocaleString()}</div>
                <div style={{ fontWeight: 500, color: 'hsl(var(--foreground))' }}>{h.status_name || h.status_code}</div>
                <div style={{ color: 'hsl(var(--muted-foreground))' }}>{h.changed_by_name || '-'}</div>
                {h.notes && <div className="stg-note">- {h.notes}</div>}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default PrintingOrderDetail;
