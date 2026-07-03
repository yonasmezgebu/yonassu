import React, { useState, useEffect } from 'react';
import { customerState } from '../../../utils/customerPortalState';
import SalesDataTable from '../../sales/components/SalesDataTable';
import SalesStatusBadge from '../../sales/components/SalesStatusBadge';
import CurrencyDisplay from '../../sales/components/CurrencyDisplay';
import { useNavigate } from 'react-router-dom';

const OrderHistory = () => {
  const [orders, setOrders] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const load = () => {
        setOrders(customerState.getOrders());
        customerState.notify('ORDER_HISTORY');
    };
    load();
    return customerState.subscribe(load);
  }, []);

  const columns = [
    { header: 'Order Number', accessor: 'order_number' },
    { header: 'Date', render: (row) => new Date(row.created_at).toLocaleDateString() },
    { header: 'Total', render: (row) => <CurrencyDisplay amountCents={row.total_cents} /> },
    { header: 'Fulfillment Status', render: (row) => <SalesStatusBadge status={row.fulfillment?.fulfillment_status || 'processing'} /> },
    { header: 'Actions', render: (row) => (
        <button onClick={() => navigate('/customer/orders/track')} style={{ padding: '6px 12px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '500' }}>
            Track Order
        </button>
    )}
  ];

  return (
    <div style={{ padding: '24px', backgroundColor: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#0f172a', margin: '0 0 8px 0' }}>Order History</h1>
        <p style={{ color: '#64748b', margin: 0 }}>Review all your past and current orders.</p>
      </div>

      <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <SalesDataTable data={orders} columns={columns} searchPlaceholder="Search by order number..." />
      </div>
    </div>
  );
};

export default OrderHistory;
