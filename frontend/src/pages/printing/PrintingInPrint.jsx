import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Printer, RefreshCw, FastForward } from 'lucide-react';
import apiClient from '../../services/apiClient';
import { StatusBadge, PaymentBadge, DueCell } from './StageShared';
import { StageStyles } from './printingStageStyles';
import StageNav from './StageNav';
import StageConfirmModal from './StageConfirmModal';

const PrintingInPrint = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [movingId, setMovingId] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [printProgress, setPrintProgress] = useState({});
  const navigate = useNavigate();

  const load = useCallback(async () => {
    try {
      const res = await apiClient.get('/printing/orders', { params: { limit: 200 } });
      const raw = res.data?.orders || res.data || [];
      const list = raw.filter(o => ['in_printing', 'in_progress'].includes(o.status_code));
      setOrders(list);
      const prog = {};
      list.forEach(o => { prog[o.id] = printProgress[o.id] ?? 0; });
      setPrintProgress(prog);
    } catch (err) {
      console.error('Failed to load printing orders', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const doMove = async (order) => {
    setMovingId(order.id);
    try {
      await apiClient.put(`/printing/orders/${order.id}/status`, { status: 'finishing' });
      await load();
    } catch (err) {
      alert(err?.message || 'Failed to move order to Finishing.');
    } finally {
      setMovingId(null);
      setConfirm(null);
    }
  };

  return (
    <div className="stg-root" style={{ margin: '-24px', minHeight: 'calc(100vh - 64px)' }}>
      <StageStyles />
      <StageNav current="printing" />
      <div className="stg-head">
        <h1 className="stg-title">
          <Printer color="#0891B2" /> IN PRINTING
        </h1>
        <p className="stg-sub">Orders currently on press. Confirm to advance an order toward Finishing.</p>
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
                  {['Order #', 'Customer', 'Service', 'Qty', 'Payment', 'Status', 'Progress', 'Due Date', 'Action'].map(col => (
                    <th key={col} className={`stg-th${col === 'Qty' ? ' stg-th--num' : ''}`}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.map(order => (
                  <tr key={order.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/printing-manager/orders/${order.id}`)}>
                    <td className="stg-td stg-strong">{order.order_number}</td>
                    <td className="stg-td">{order.customer_name || 'Walk-in'}</td>
                    <td className="stg-td stg-muted">{order.product_type || '—'}</td>
                    <td className="stg-td stg-num" style={{ textAlign: 'right' }}>{order.quantity}</td>
                    <td className="stg-td" style={{ cursor: 'default' }}><PaymentBadge order={order} /></td>
                    <td className="stg-td" style={{ cursor: 'default' }}><StatusBadge code={order.status_code} name={order.status_name} /></td>
                    <td className="stg-td" onClick={e => e.stopPropagation()} style={{ minWidth: 160 }}>
                      <div className="stg-progress">
                        <input type="range" min="0" max="100" value={printProgress[order.id] || 0}
                          onChange={e => setPrintProgress(p => ({ ...p, [order.id]: parseInt(e.target.value) }))} className="stg-range" />
                        <span className="stg-range-val">{printProgress[order.id] || 0}%</span>
                      </div>
                    </td>
                    <td className="stg-td"><DueCell due_date={order.due_date} /></td>
                    <td className="stg-td" onClick={e => e.stopPropagation()}>
                      {movingId === order.id ? (
                        <span className="stg-note">Moving...</span>
                      ) : (
                        <button className="stg-btn stg-btn--soft-purple stg-btn--sm" onClick={() => setConfirm(order)}>
                          <FastForward size={14} /> → Finishing
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {orders.length === 0 && <tr><td className="stg-td" colSpan={9}><div className="stg-empty">No orders currently in Printing.</div></td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <StageConfirmModal
        open={!!confirm}
        title={`Move Order ${confirm?.order_number || ''} to Finishing`}
        message="Confirm printing production is complete. This order will advance to the Finishing stage."
        details={confirm ? `Customer: ${confirm.customer_name || 'Walk-in'} · Qty: ${confirm.quantity}` : ''}
        confirmLabel="Move to Finishing"
        busy={movingId === confirm?.id}
        onConfirm={() => confirm && doMove(confirm)}
        onClose={() => setConfirm(null)}
      />
    </div>
  );
};

export default PrintingInPrint;