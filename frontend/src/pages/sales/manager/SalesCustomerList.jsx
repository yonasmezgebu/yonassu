import React, { useState, useEffect } from 'react';
import { salesState } from '../../../utils/salesManagerState';
import SalesDataTable from '../components/SalesDataTable';
import CurrencyDisplay from '../components/CurrencyDisplay';
import { useNavigate } from 'react-router-dom';

const SalesCustomerList = () => {
  const [customers, setCustomers] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    setCustomers(salesState.getCustomers());
    salesState.notify('PAGE_LOAD');
  }, []);

  const columns = [
    { label: 'Customer ID', field: 'id', sortable: true },
    { label: 'Name', field: 'name', sortable: true },
    { label: 'Phone', field: 'phone' },
    { 
      label: 'Type', 
      field: 'type', 
      sortable: true,
      render: (row) => (
        <span style={{
          padding: '2px 8px', borderRadius: '9999px', fontSize: '12px', fontWeight: '600',
          backgroundColor: row.type === 'walk_in' ? '#f1f5f9' : row.type === 'credit' ? '#dbeafe' : '#fef3c7',
          color: row.type === 'walk_in' ? '#475569' : row.type === 'credit' ? '#1e40af' : '#92400e',
          textTransform: 'capitalize'
        }}>
          {row.type.replace('_', ' ')}
        </span>
      )
    },
    { 
      label: 'Credit Limit', 
      field: 'credit_limit_cents',
      sortable: true,
      render: (row) => <CurrencyDisplay amountCents={row.credit_limit_cents} />
    }
  ];

  return (
    <div style={{ padding: '24px', backgroundColor: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#0f172a', margin: '0 0 8px 0' }}>Customer List</h1>
          <p style={{ color: '#64748b', margin: 0 }}>Manage all customers across the system.</p>
        </div>
        <button 
          onClick={() => navigate('/sales/manager/customers/new')}
          style={{ padding: '10px 20px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}
        >
          + Add Customer
        </button>
      </div>

      <SalesDataTable 
        columns={columns} 
        data={customers} 
        searchable={true} 
        onRowClick={(row) => navigate(`/sales/manager/customers/statement?customerId=${row.id}`)}
      />
    </div>
  );
};

export default SalesCustomerList;
