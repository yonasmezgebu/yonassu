import React, { useState, useEffect } from 'react';
import { salesState } from '../../../../utils/salesManagerState';
import SalesDataTable from '../../components/SalesDataTable';
import CurrencyDisplay from '../../components/CurrencyDisplay';
import { useNavigate } from 'react-router-dom';

const OutstandingPayments = () => {
  const [invoices, setInvoices] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Only get unpaid/overdue invoices
    const outstanding = salesState.getInvoices().filter(i => i.status !== 'paid');
    
    // Compute days overdue purely for display
    const today = new Date();
    const computed = outstanding.map(inv => {
        const due = new Date(inv.due_date);
        const diffTime = today - due;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
        return { 
            ...inv, 
            days_overdue: diffDays > 0 ? diffDays : 0,
            remaining_balance_cents: inv.total_cents - inv.amount_paid_cents
        };
    });

    // Sort by days overdue descending
    computed.sort((a, b) => b.days_overdue - a.days_overdue);

    setInvoices(computed);
    salesState.notify('OUTSTANDING_PAYMENTS_READY');
  }, []);

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
      label: 'Remaining Balance', 
      field: 'remaining_balance_cents',
      sortable: true,
      render: (row) => <CurrencyDisplay amountCents={row.remaining_balance_cents} style={{ fontWeight: '600' }} />
    },
    { 
      label: 'Days Overdue', 
      field: 'days_overdue',
      sortable: true,
      render: (row) => (
          <span style={{ 
              color: row.days_overdue > 30 ? '#ef4444' : row.days_overdue > 0 ? '#f59e0b' : '#10b981',
              fontWeight: '600'
          }}>
              {row.days_overdue} days
          </span>
      )
    },
    {
      label: 'Actions',
      field: 'id',
      render: (row) => (
        <button 
          onClick={() => navigate('/sales/manager/payments/new')} 
          style={{ padding: '6px 12px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: 0, fontSize: '12px', cursor: 'pointer' }}
        >
          Mark as Paid
        </button>
      )
    }
  ];

  return (
    <div style={{ padding: '24px', backgroundColor: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#0f172a', margin: '0 0 8px 0' }}>Outstanding Payments</h1>
        <p style={{ color: '#64748b', margin: 0 }}>Monitor and collect unpaid invoices.</p>
      </div>

      <SalesDataTable columns={columns} data={invoices} searchable={true} searchField="customer_id" />
    </div>
  );
};

export default OutstandingPayments;
