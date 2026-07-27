import React, { useState, useEffect } from 'react';
import { salesState } from '../../../utils/salesManagerState';
import SalesDataTable from '../components/SalesDataTable';
import CurrencyDisplay from '../components/CurrencyDisplay';
import SalesStatusBadge from '../components/SalesStatusBadge';

const SalesInvoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [modalState, setModalState] = useState({ isOpen: false, id: null, amount: '' });

  const loadData = () => setInvoices(salesState.getInvoices());

  useEffect(() => {
    loadData();
    salesState.notify('PAGE_LOAD');
  }, []);

  const handlePay = (id) => {
    setModalState({ isOpen: true, id, amount: '' });
  };

  const confirmPay = () => {
    const amt = Math.round(parseFloat(modalState.amount) * 100);
    if (!amt || amt <= 0) {
      alert('Please enter a valid amount.');
      return;
    }
    try {
      salesState.payInvoice(modalState.id, amt);
      loadData();
    } catch (e) {
      alert(e.message);
    }
  };

  const columns = [
    { label: 'Invoice #', field: 'invoice_number', sortable: true },
    { 
      label: 'Due Date', 
      field: 'due_date', 
      sortable: true,
      render: (row) => new Date(row.due_date).toLocaleDateString()
    },
    { 
      label: 'Customer', 
      field: 'customer_id',
      render: (row) => salesState.getCustomers().find(c => c.id === row.customer_id)?.name || row.customer_id
    },
    { 
      label: 'Total', 
      field: 'total_cents',
      sortable: true,
      render: (row) => <CurrencyDisplay amountCents={row.total_cents} />
    },
    { 
      label: 'Paid', 
      field: 'amount_paid_cents',
      render: (row) => <CurrencyDisplay amountCents={row.amount_paid_cents} />
    },
    { 
      label: 'Status', 
      field: 'computed_status',
      render: (row) => <SalesStatusBadge status={row.computed_status} />
    },
    {
      label: 'Actions',
      field: 'id',
      render: (row) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          {(row.status === 'unpaid') && (
            <button 
              onClick={() => handlePay(row.id)} 
              style={{ padding: '4px 8px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: 0, fontSize: '12px', cursor: 'pointer' }}
            >
              Receive Payment
            </button>
          )}
          <button style={{ padding: '4px 8px', backgroundColor: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', borderRadius: 0, fontSize: '12px', cursor: 'pointer' }}>
            Print PDF
          </button>
        </div>
      )
    }
  ];

  return (
    <div style={{ padding: '24px', backgroundColor: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#0f172a', margin: '0 0 8px 0' }}>Invoices</h1>
        <p style={{ color: '#64748b', margin: 0 }}>Manage credit sales and receive payments.</p>
      </div>

      <SalesDataTable columns={columns} data={invoices} searchable={true} searchField="invoice_number" />

      {/* Custom Pay Modal */}
      {modalState.isOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ backgroundColor: 'white', borderRadius: 0, width: '400px', padding: '24px' }}>
            <h3 style={{ margin: '0 0 16px 0' }}>Receive Payment</h3>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>Amount Received (ETB):</label>
              <input 
                type="number"
                min="0"
                step="0.01"
                value={modalState.amount}
                onChange={(e) => setModalState({ ...modalState, amount: e.target.value })}
                style={{ width: '100%', padding: '8px', borderRadius: 0, border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                required
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button onClick={() => setModalState({ isOpen: false })} style={{ padding: '8px 16px', border: '1px solid #cbd5e1', borderRadius: 0, cursor: 'pointer' }}>Cancel</button>
              <button onClick={() => { confirmPay(); setModalState({ isOpen: false }); }} style={{ padding: '8px 16px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: 0, cursor: 'pointer' }}>Submit Payment</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesInvoices;
