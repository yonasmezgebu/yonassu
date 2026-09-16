import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckSquare, RefreshCw, Send, UploadCloud, Eye } from 'lucide-react';
import apiClient from '../../services/apiClient';
import { StatusBadge, PaymentBadge, DueCell } from './StageShared';
import { StageStyles } from './printingStageStyles';
import StageNav from './StageNav';
import StageConfirmModal from './StageConfirmModal';
import PrintingWorkModal from './PrintingWorkModal';

const FILE_CHECKS = [
  { key: 'bleed', label: 'Bleed Checked' },
  { key: 'res', label: 'Resolution 300dpi+' },
  { key: 'color', label: 'Color Mode CMYK' },
  { key: 'fonts', label: 'Fonts Embedded' },
  { key: 'size', label: 'Final Size Correct' },
];

const PrintingPrepress = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [checklists, setChecklists] = useState({});
  const [worksByOrder, setWorksByOrder] = useState({});
  const [movingId, setMovingId] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [workOrder, setWorkOrder] = useState(null);
  const navigate = useNavigate();

  const load = useCallback(async () => {
    try {
      const [res, worksRes] = await Promise.all([
        apiClient.get('/printing/orders', { params: { limit: 200 } }),
        apiClient.get('/printing/works', { params: { limit: 100 } })
      ]);
      const raw = res.data?.orders || res.data || [];
      const list = raw.filter(o => ['file_check'].includes(o.status_code));
      setOrders(list);
      const byOrder = {};
      (worksRes.data?.works || []).forEach(w => { byOrder[w.orderId] = (byOrder[w.orderId] || 0) + 1; });
      setWorksByOrder(byOrder);
      const init = {};
      list.forEach(o => { if (!checklists[o.id]) init[o.id] = { bleed: false, res: false, color: false, fonts: false, size: false }; });
      if (Object.keys(init).length) setChecklists(prev => ({ ...prev, ...init }));
    } catch (err) {
      console.error('Failed to load prepress orders', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const toggleCheck = (id, field) => setChecklists(prev => ({ ...prev, [id]: { ...prev[id], [field]: !prev[id][field] } }));
  const isAllChecked = (id) => { const c = checklists[id] || {}; return c.bleed && c.res && c.color && c.fonts && c.size; };

  const doMove = async (order) => {
    setMovingId(order.id);
    try {
      await apiClient.put(`/printing/orders/${order.id}/status`, { status: 'in_printing' });
      await load();
    } catch (err) {
      alert(err?.message || 'Failed to send order to Printing.');
    } finally {
      setMovingId(null);
      setConfirm(null);
    }
  };

  return (
    <div className="stg-root" style={{ margin: '-24px', minHeight: 'calc(100vh - 64px)' }}>
      <StageStyles />
      <StageNav current="prepress" />
      <div className="stg-head">
        <h1 className="stg-title">
          <CheckSquare color="#D97706" /> FILE CHECK / PREPRESS
        </h1>
        <p className="stg-sub">Quality-check design files. All checks must pass before sending an order to Print.</p>
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
                  {['Order #', 'Customer', 'Service', 'Payment', 'Status', 'Due Date', 'Quality Checklist', 'Action'].map(col => (
                    <th key={col} className="stg-th">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.map(order => {
                  const cDone = isAllChecked(order.id);
                  const hasWorkCount = worksByOrder[order.id] || 0;
                  const passed = cDone && hasWorkCount > 0;
                  return (
                    <tr key={order.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/printing-manager/orders/${order.id}`)}>
                      <td className="stg-td">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); navigate(`/printing-manager/orders/${order.id}`); }}
                          style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontWeight: 700, color: '#2563EB', fontSize: 13, textDecoration: 'underline', textAlign: 'left' }}
                        >
                          {order.order_number}
                        </button>
                      </td>
                      <td className="stg-td">{order.customer_name || 'Walk-in'}</td>
                      <td className="stg-td stg-muted">{order.product_type || '—'}</td>
                      <td className="stg-td" style={{ cursor: 'default' }}><PaymentBadge order={order} /></td>
                      <td className="stg-td" style={{ cursor: 'default' }}><StatusBadge code={order.status_code} name={order.status_name} /></td>
                      <td className="stg-td"><DueCell due_date={order.due_date} /></td>
                      <td className="stg-td" style={{ minWidth: 280 }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 16px' }}>
                          {FILE_CHECKS.map(c => (
                            <label key={c.key} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: 'pointer', color: checklists[order.id]?.[c.key] ? '#16a34a' : '#6B7280', fontWeight: checklists[order.id]?.[c.key] ? 600 : 400 }}>
                              <input
                                type="checkbox"
                                checked={checklists[order.id]?.[c.key] || false}
                                onChange={() => toggleCheck(order.id, c.key)}
                                style={{ width: 15, height: 15, accentColor: '#16a34a', cursor: 'pointer' }}
                              />
                              {c.label}
                            </label>
                          ))}
                        </div>
                      </td>
                      <td className="stg-td" onClick={e => e.stopPropagation()}>
                        {movingId === order.id ? (
                          <span className="stg-note">Sending...</span>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <button className="stg-btn stg-btn--soft-amber stg-btn--sm" onClick={() => setWorkOrder(order)}>
                              <UploadCloud size={14} /> Upload Work{hasWorkCount > 0 ? ` (${hasWorkCount})` : ''}
                            </button>
                            {passed ? (
                              <button className="stg-btn stg-btn--soft-cyan stg-btn--sm" onClick={() => setConfirm(order)}>
                                <Send size={14} /> → Print
                              </button>
                            ) : (
                              <button className="stg-btn stg-btn--soft-cyan stg-btn--sm" disabled onClick={() => {}}>
                                <Send size={14} /> {cDone ? 'Upload Work First' : 'Checklist Required'}
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {orders.length === 0 && <tr><td className="stg-td" colSpan={8}><div className="stg-empty">No orders currently in Prepress.</div></td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <StageConfirmModal
        open={!!confirm}
        title={`Send Order ${confirm?.order_number || ''} to Print`}
        message="All file checks are complete. Confirm to advance this order to the Printing stage."
        details={confirm ? `Customer: ${confirm.customer_name || 'Walk-in'} · Qty: ${confirm.quantity} · Total: ETB ${parseFloat(confirm.total_price || 0).toLocaleString()}` : ''}
        confirmLabel="Send to Printing"
        busy={movingId === confirm?.id}
        onConfirm={() => confirm && doMove(confirm)}
        onClose={() => setConfirm(null)}
      />

      <PrintingWorkModal
        isOpen={!!workOrder}
        order={workOrder}
        onClose={() => setWorkOrder(null)}
      />
    </div>
  );
};

export default PrintingPrepress;