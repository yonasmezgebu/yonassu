import React, { useState, useEffect } from 'react';
import { salesState } from '../../../../utils/salesManagerState';
import SalesDataTable from '../../components/SalesDataTable';
import CurrencyDisplay from '../../components/CurrencyDisplay';
import SalesStatusBadge from '../../components/SalesStatusBadge';
import { Plus } from 'lucide-react';

const Promotions = () => {
  const [promotions, setPromotions] = useState([]);

  useEffect(() => {
    setPromotions(salesState.getPromotions());
    salesState.notify('PAGE_LOAD');
  }, []);

  const columns = [
    { label: 'Promo #', field: 'promotion_number', sortable: true },
    { label: 'Name', field: 'name', sortable: true },
    { 
      label: 'Discount', 
      field: 'discount_value',
      render: (row) => row.discount_type === 'percentage' 
          ? `${row.discount_value}%` 
          : <CurrencyDisplay amountCents={row.discount_value} />
    },
    { 
      label: 'Valid From', 
      field: 'start_date',
      sortable: true,
      render: (row) => new Date(row.start_date).toLocaleDateString()
    },
    { 
      label: 'Valid Until', 
      field: 'end_date',
      sortable: true,
      render: (row) => new Date(row.end_date).toLocaleDateString()
    },
    { 
      label: 'Status', 
      field: 'computed_status',
      render: (row) => <SalesStatusBadge status={row.computed_status} />
    }
  ];

  return (
    <div style={{ padding: '24px', backgroundColor: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#0f172a', margin: '0 0 8px 0' }}>Promotions & Discounts</h1>
          <p style={{ color: '#64748b', margin: 0 }}>Manage scheduled and active pricing promotions.</p>
        </div>
        <button style={{ padding: '10px 20px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Plus size={16} /> New Promotion
        </button>
      </div>

      <SalesDataTable columns={columns} data={promotions} searchable={true} searchField="name" />
    </div>
  );
};

export default Promotions;
