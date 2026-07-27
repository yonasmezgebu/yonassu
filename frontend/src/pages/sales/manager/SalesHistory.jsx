import React, { useState, useEffect } from 'react';
import { salesState } from '../../../utils/salesManagerState';
import SalesDataTable from '../components/SalesDataTable';
import CurrencyDisplay from '../components/CurrencyDisplay';
import SalesStatusBadge from '../components/SalesStatusBadge';

const SalesHistory = () => {
  const [sales, setSales] = useState([]);

  useEffect(() => {
    setSales(salesState.getSales());
    salesState.notify('PAGE_LOAD');
  }, []);

  const columns = [
    { label: 'Sale #', field: 'sale_number', sortable: true },
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
      label: 'Payment', 
      field: 'payment_type',
      render: (row) => <span style={{ textTransform: 'capitalize' }}>{row.payment_type.replace('_', ' ')}</span>
    },
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
      render: () => (
        <button style={{ padding: '4px 8px', backgroundColor: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', borderRadius: 0, fontSize: '12px', cursor: 'pointer' }}>
          View Receipt
        </button>
      )
    }
  ];

  return (
    <div style={{ padding: '24px', backgroundColor: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#0f172a', margin: '0 0 8px 0' }}>Sales History</h1>
        <p style={{ color: '#64748b', margin: 0 }}>Complete record of all sales transactions.</p>
      </div>

      <SalesDataTable columns={columns} data={sales} searchable={true} searchField="sale_number" />
    </div>
  );
};

export default SalesHistory;
