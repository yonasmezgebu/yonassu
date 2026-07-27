import React, { useState, useEffect } from 'react';
import { salesState } from '../../../utils/salesManagerState';
import SalesDataTable from '../components/SalesDataTable';
import CurrencyDisplay from '../components/CurrencyDisplay';
import ConfirmModal from '../components/ConfirmModal';

const SalesCreditCustomers = () => {
  const [customers, setCustomers] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    // Only get credit/wholesale customers, and compute their outstanding balance
    const allCust = salesState.getCustomers().filter(c => c.type === 'credit' || c.type === 'wholesale');
    const invoices = salesState.getInvoices();
    
    const computed = allCust.map(c => {
        const outstanding = invoices
            .filter(inv => inv.customer_id === c.id && inv.status === 'unpaid')
            .reduce((sum, inv) => sum + (inv.total_cents - inv.amount_paid_cents), 0);
        return { ...c, outstanding_cents: outstanding, available_cents: c.credit_limit_cents - outstanding };
    });

    setCustomers(computed);
    salesState.notify('PAGE_LOAD');
  }, []);

  const sendReminder = () => {
      salesState.notify('CREDIT_REMINDER');
      setModalOpen(false);
  };

  const columns = [
    { label: 'Name', field: 'name', sortable: true },
    { label: 'Type', field: 'type', render: (row) => <span style={{textTransform: 'capitalize'}}>{row.type}</span> },
    { 
      label: 'Credit Limit', 
      field: 'credit_limit_cents',
      sortable: true,
      render: (row) => <CurrencyDisplay amountCents={row.credit_limit_cents} />
    },
    { 
      label: 'Outstanding', 
      field: 'outstanding_cents',
      sortable: true,
      render: (row) => (
          <span style={{ color: row.outstanding_cents > 0 ? '#ef4444' : '#10b981', fontWeight: '600' }}>
              <CurrencyDisplay amountCents={row.outstanding_cents} />
          </span>
      )
    },
    { 
      label: 'Available', 
      field: 'available_cents',
      render: (row) => <CurrencyDisplay amountCents={row.available_cents} />
    },
    {
      label: 'Actions',
      field: 'id',
      render: (row) => (
        <button 
          onClick={() => setModalOpen(true)} 
          disabled={row.outstanding_cents === 0}
          style={{ 
              padding: '6px 12px', 
              backgroundColor: row.outstanding_cents === 0 ? '#f1f5f9' : '#3b82f6', 
              color: row.outstanding_cents === 0 ? '#94a3b8' : 'white', 
              border: 'none', 
              borderRadius: 0, 
              fontSize: '12px', 
              cursor: row.outstanding_cents === 0 ? 'not-allowed' : 'pointer' 
          }}
        >
          Send Reminder
        </button>
      )
    }
  ];

  return (
    <div style={{ padding: '24px', backgroundColor: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#0f172a', margin: '0 0 8px 0' }}>Credit Management</h1>
        <p style={{ color: '#64748b', margin: 0 }}>Monitor credit limits and outstanding balances.</p>
      </div>

      <SalesDataTable columns={columns} data={customers} searchable={true} searchField="name" />

      <ConfirmModal 
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={sendReminder}
        title="Send Credit Reminder"
        message="This will send an automated SMS and Email reminder to the customer regarding their outstanding balance."
        confirmText="Send Reminder"
        type="info"
      />
    </div>
  );
};

export default SalesCreditCustomers;
