import React, { useState, useEffect, useRef } from 'react';
import { customerState } from '../../../utils/customerPortalState';
import CurrencyDisplay from '../../sales/components/CurrencyDisplay';
import { CheckCircle, Circle, Truck, Package, RefreshCw } from 'lucide-react';

// SPEC §4.4 — single ordered-enum, never independent booleans
const STAGE_ORDER = ['order_placed', 'processing', 'shipped', 'out_for_delivery', 'delivered'];

const STAGE_META = {
  order_placed:    { label: 'Order Placed',      icon: Package },
  processing:      { label: 'Processing',         icon: RefreshCw },
  shipped:         { label: 'Shipped',            icon: Truck },
  out_for_delivery:{ label: 'Out for Delivery',   icon: Truck },
  delivered:       { label: 'Delivered',          icon: CheckCircle },
};

const OrderStatusTimeline = ({ currentStatus }) => {
  const currentIdx = STAGE_ORDER.indexOf(currentStatus);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
      {STAGE_ORDER.map((stage, idx) => {
        const isDone = idx <= currentIdx; // spec §4.4 — single ordered comparison
        const isCurrent = idx === currentIdx;
        const Meta = STAGE_META[stage];
        const Icon = Meta.icon;
        return (
          <React.Fragment key={stage}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', minWidth: '100px' }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '50%',
                backgroundColor: isDone ? '#3b82f6' : '#e2e8f0',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: isCurrent ? '3px solid #1d4ed8' : '2px solid transparent',
                transition: 'all 0.3s'
              }}>
                <Icon size={18} color={isDone ? 'white' : '#94a3b8'} />
              </div>
              <span style={{ fontSize: '11px', fontWeight: isCurrent ? '700' : '400', color: isDone ? '#1e293b' : '#94a3b8', textAlign: 'center', lineHeight: 1.3 }}>
                {Meta.label}
              </span>
            </div>
            {idx < STAGE_ORDER.length - 1 && (
              <div style={{ flex: 1, height: '3px', backgroundColor: idx < currentIdx ? '#3b82f6' : '#e2e8f0', marginBottom: '20px', transition: 'background-color 0.3s' }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

const TrackOrders = () => {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('all');
  const prevStatusMap = useRef({});
  const intervalRef = useRef(null);

  const FILTER_LABELS = { all: 'All', processing: 'Processing', shipped: 'Shipping', delivered: 'Completed' };

  const loadOrders = () => {
    const all = customerState.getOrders();
    const newStatusMap = {};

    all.forEach(o => {
      const status = o.fulfillment?.fulfillment_status;
      if (status) {
        newStatusMap[o.id] = status;
        // Fire "Status Updated" toast only when status actually changes — not on every load
        if (prevStatusMap.current[o.id] && prevStatusMap.current[o.id] !== status) {
          customerState.notify('ORDER_STATUS');
        }
      }
    });

    prevStatusMap.current = newStatusMap;
    setOrders(all);
  };

  useEffect(() => {
    loadOrders();
    // Polling — spec §4.4 recommends polling when view is open
    intervalRef.current = setInterval(loadOrders, 15000);
    const unsub = customerState.subscribe(loadOrders);
    return () => {
      clearInterval(intervalRef.current);
      unsub();
    };
  }, []);

  const filtered = orders.filter(o => {
    const status = o.fulfillment?.fulfillment_status || '';
    if (filter === 'all') return true;
    if (filter === 'processing') return ['order_placed', 'processing'].includes(status);
    if (filter === 'shipped') return ['shipped', 'out_for_delivery'].includes(status);
    if (filter === 'delivered') return status === 'delivered';
    return true;
  });

  return (
    <div style={{ padding: '24px', backgroundColor: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#0f172a', margin: '0 0 4px 0' }}>Track Orders</h1>
          <p style={{ color: '#64748b', margin: 0, fontSize: '13px' }}>Auto-refreshes every 15 seconds.</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {Object.entries(FILTER_LABELS).map(([k, v]) => (
            <button key={k} onClick={() => setFilter(k)} style={{ padding: '8px 16px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontWeight: filter === k ? '700' : '400', backgroundColor: filter === k ? '#3b82f6' : '#e2e8f0', color: filter === k ? 'white' : '#475569' }}>
              {v}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div style={{ backgroundColor: 'white', padding: '48px', borderRadius: '12px', textAlign: 'center', color: '#94a3b8', border: '1px solid #e2e8f0' }}>
          No orders in this category.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {filtered.map(order => {
            const f = order.fulfillment;
            const status = f?.fulfillment_status || 'order_placed';
            return (
              <div key={order.id} style={{ backgroundColor: 'white', padding: '28px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '28px', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '16px', color: '#0f172a' }}>{order.order_number}</div>
                    <div style={{ color: '#64748b', fontSize: '13px', marginTop: '4px' }}>
                      Placed: {new Date(order.created_at).toLocaleDateString()}
                      {f?.expected_delivery_date && <span> &bull; Est. Delivery: {new Date(f.expected_delivery_date).toLocaleDateString()}</span>}
                    </div>
                  </div>
                  <div style={{ fontWeight: '700', fontSize: '18px', color: '#1e293b' }}>
                    <CurrencyDisplay amountCents={order.total_cents} />
                  </div>
                </div>
                <OrderStatusTimeline currentStatus={status} />
                {order.lines && order.lines.length > 0 && (
                  <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
                    <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '8px' }}>Items in this order:</div>
                    {order.lines.map(l => (
                      <div key={l.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', padding: '4px 0' }}>
                        <span style={{ color: '#334155' }}>{l.product_name} &times; {l.qty}</span>
                        <span style={{ color: '#64748b' }}><CurrencyDisplay amountCents={l.subtotal_cents} /></span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TrackOrders;
