import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Truck, RefreshCw, Send, CheckCircle } from 'lucide-react';
import apiClient from '../../services/apiClient';
import { StatusBadge, PaymentBadge, DueCell } from './StageShared';
import { StageStyles } from './printingStageStyles';
import StageNav from './StageNav';
import StageConfirmModal from './StageConfirmModal';

const PrintingDelivery = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [movingId, setMovingId] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [noteSent, setNoteSent] = useState(null);
  const navigate = useNavigate();

  const load = useCallback(async () => {
    try {
      const res = await apiClient.get('/printing/orders', { params: { limit: 200 } });
      const raw = res.data?.orders || res.data || [];
      setOrders(raw.filter(o => ['ready'].includes(o.status_code)));
    } catch (err) {
      console.error('Failed to load delivery orders', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const handleNotify = (id) => { setNoteSent(id); setTimeout(() => setNoteSent(null), 2000); };

  const doDeliver = async (order) => {
    setMovingId(order.id);
    try {
      await apiClient.put(`/printing/orders/${order.id}/status`, { status: 'delivered' });
      await load();
    } catch (err) {
      alert(err?.message || 'Failed to mark order as delivered.');
    } finally {
      setMovingId(null);
      setConfirm(null);
    }
  };

  return (
    <div className="stg-root" style={{ margin: '-24px', minHeight: 'calc(100vh - 64px)' }}>
      <StageStyles />
      <StageNav current="delivery" />
      <div className="stg-head">
        <h1 className="stg-title">
          <Truck color="#16A34A" /> READY FOR DELIVERY
        </h1>
        <p className="stg-sub">Completed orders awaiting customer pickup/delivery. Confirm to mark an order as Delivered.</p>
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
                  {['Order #', 'Customer', 'Phone', 'Qty', 'Total (ETB)', 'Payment', 'Status', 'Due Date', 'Action'].map(col => (
                    <th key={col} className={`stg-th${col === 'Qty' || col.includes('Total') ? ' stg-th--num' : ''}`}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.map(order => (
                  <tr key={order.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/printing-manager/orders/${order.id}`)}>
                    <td className="stg-td stg-strong">{order.order_number}</td>
                    <td className="stg-td">{order.customer_name || 'Walk-in'}</td>
                    <td className="stg-td stg-muted">{order.customer_phone || '—'}</td>
                    <td className="stg-td stg-num" style={{ textAlign: 'right' }}>{order.quantity}</td>
                    <td className="stg-td stg-num" style={{ textAlign: 'right', fontWeight: 700 }}>{parseFloat(order.total_price || 0).toLocaleString('en-ET', { minimumFractionDigits: 2 })}</td>
                    <td className="stg-td" style={{ cursor: 'default' }}><PaymentBadge order={order} /></td>
                    <td className="stg-td" style={{ cursor: 'default' }}><StatusBadge code={order.status_code} name={order.status_name} /></td>
                    <td className="stg-td"><DueCell due_date={order.due_date} /></td>
                    <td className="stg-td" onClick={e => e.stopPropagation()}>
                      <div className="stg-cell-btns">
                        <button className="stg-btn stg-btn--soft-blue stg-btn--sm" onClick={() => handleNotify(order.id)}>
                          <Send size={14} /> {noteSent === order.id ? 'Notified ✓' : 'Notify'}
                        </button>
                        {movingId === order.id ? (
                          <span className="stg-note">Delivering...</span>
                        ) : (
                          <button className="stg-btn stg-btn--soft-green stg-btn--sm" onClick={() => setConfirm(order)}>
                            <CheckCircle size={14} /> Mark Delivered
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {orders.length === 0 && <tr><td className="stg-td" colSpan={9}><div className="stg-empty">No orders ready for delivery.</div></td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <StageConfirmModal
        open={!!confirm}
        title={`Mark Order ${confirm?.order_number || ''} Delivered`}
        message="Confirm this order was delivered/picked up by the customer. It will be marked as Delivered and completed."
        details={confirm ? `Customer: ${confirm.customer_name || 'Walk-in'} · Total: ETB ${parseFloat(confirm.total_price || 0).toLocaleString()}` : ''}
        confirmLabel="Mark Delivered"
        busy={movingId === confirm?.id}
        onConfirm={() => confirm && doDeliver(confirm)}
        onClose={() => setConfirm(null)}
      />
    </div>
  );
};

export default PrintingDelivery;