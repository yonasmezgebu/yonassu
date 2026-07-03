import React, { useState, useEffect } from 'react';
import { salesState } from '../../../utils/salesManagerState';
import SalesDataTable from '../components/SalesDataTable';
import CurrencyDisplay from '../components/CurrencyDisplay';
import SalesStatusBadge from '../components/SalesStatusBadge';
import ConfirmModal from '../components/ConfirmModal';

const SalesOrders = () => {
  const [orders, setOrders] = useState([]);
  const [modalState, setModalState] = useState({ isOpen: false, id: null, reason: '' });

  const loadData = () => setOrders(salesState.getOrders());

  useEffect(() => {
    loadData();
    salesState.notify('PAGE_LOAD');
  }, []);

  const handleCancel = (id) => {
    setModalState({ isOpen: true, id, reason: '' });
  };

  const confirmCancel = () => {
    if (!modalState.reason) {
      alert('Cancellation reason is required.');
      return;
    }
    try {
      salesState.cancelOrder(modalState.id, modalState.reason);
      loadData();
    } catch (e) {
      alert(e.message);
    }
  };

  const columns = [
    { label: 'Order #', field: 'order_number', sortable: true },
    { 
      label: 'Date', 
      field: 'created_at', 
      sortable: true,
      render: (row) => new Date(row.created_at).toLocaleDateString()
    },
    { 
      label: 'Customer', 
      field: 'customer_id',
      render: (row) => salesState.getCustomers().find(c => c.id === row.customer_id)?.name || row.customer_id
    },
    { label: 'Type', field: 'order_type' },
    { 
      label: 'Total', 
      field: 'total_cents',
      sortable: true,
      render: (row) => <CurrencyDisplay amountCents={row.total_cents} />
    },
    { 
      label: 'Status', 
      field: 'status',
      render: (row) => <SalesStatusBadge status={row.status} />
    },
    {
      label: 'Actions',
      field: 'id',
      render: (row) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          {(row.status === 'pending' || row.status === 'processing') && (
            <button 
              onClick={() => handleCancel(row.id)} 
              style={{ padding: '4px 8px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', fontSize: '12px', cursor: 'pointer' }}
            >
              Cancel
            </button>
          )}
        </div>
      )
    }
  ];

  return (
    <div style={{ padding: '24px', backgroundColor: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#0f172a', margin: '0 0 8px 0' }}>Sales Orders</h1>
        <p style={{ color: '#64748b', margin: 0 }}>Manage and track all sales orders.</p>
      </div>

      <SalesDataTable columns={columns} data={orders} searchable={true} searchField="order_number" />

      {/* Custom Cancel Modal with Reason Input */}
      {modalState.isOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '12px', width: '400px', padding: '24px' }}>
            <h3 style={{ margin: '0 0 16px 0' }}>Cancel Order</h3>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>Reason for cancellation:</label>
              <textarea 
                value={modalState.reason}
                onChange={(e) => setModalState({ ...modalState, reason: e.target.value })}
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1', minHeight: '80px', boxSizing: 'border-box' }}
                required
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button onClick={() => setModalState({ isOpen: false })} style={{ padding: '8px 16px', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer' }}>Close</button>
              <button onClick={() => { confirmCancel(); setModalState({ isOpen: false }); }} style={{ padding: '8px 16px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Confirm Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesOrders;
