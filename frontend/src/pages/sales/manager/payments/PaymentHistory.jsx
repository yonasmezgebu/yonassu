import React, { useState, useEffect } from 'react';
import { salesState } from '../../../../utils/salesManagerState';
import SalesDataTable from '../../components/SalesDataTable';
import CurrencyDisplay from '../../components/CurrencyDisplay';

const PaymentHistory = () => {
  const [payments, setPayments] = useState([]);

  useEffect(() => {
    setPayments(salesState.getPayments());
    salesState.notify('PAYMENT_HISTORY_READY');
  }, []);

  const columns = [
    { label: 'Payment #', field: 'payment_number', sortable: true },
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
    { 
      label: 'Invoice', 
      field: 'invoice_id',
      render: (row) => {
          if (!row.invoice_id) return <span style={{ color: '#94a3b8' }}>Unapplied / Advance</span>;
          return salesState.getInvoices().find(i => i.id === row.invoice_id)?.invoice_number || row.invoice_id;
      }
    },
    { 
      label: 'Method', 
      field: 'method',
      render: (row) => <span style={{ textTransform: 'capitalize' }}>{row.method}</span>
    },
    { 
      label: 'Amount', 
      field: 'amount_cents',
      sortable: true,
      render: (row) => <CurrencyDisplay amountCents={row.amount_cents} style={{ fontWeight: '600' }} />
    }
  ];

  return (
    <div style={{ padding: '24px', backgroundColor: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#0f172a', margin: '0 0 8px 0' }}>Payment History</h1>
        <p style={{ color: '#64748b', margin: 0 }}>Log of all received payments.</p>
      </div>

      <SalesDataTable columns={columns} data={payments} searchable={true} searchField="payment_number" />
    </div>
  );
};

export default PaymentHistory;
