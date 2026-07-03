import React, { useState, useEffect } from 'react';
import { salesState } from '../../../../utils/salesManagerState';
import SalesDataTable from '../../components/SalesDataTable';
import CurrencyDisplay from '../../components/CurrencyDisplay';
import { Download } from 'lucide-react';

const PriceList = () => {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    setProducts(salesState.getProducts().filter(p => p.status === 'active'));
    salesState.notify('PRICE_LIST_UPDATED');
  }, []);

  const columns = [
    { label: 'Category', field: 'category', sortable: true },
    { label: 'SKU', field: 'sku', sortable: true },
    { label: 'Product Name', field: 'name', sortable: true },
    { 
      label: 'Standard Unit Price', 
      field: 'unit_price_cents',
      sortable: true,
      render: (row) => <CurrencyDisplay amountCents={row.unit_price_cents} style={{ fontWeight: '600' }} />
    },
    { 
      label: 'Bulk Price (Wholesale)', 
      field: 'bulk_price_cents',
      render: (row) => row.bulk_price_cents ? (
          <div>
              <CurrencyDisplay amountCents={row.bulk_price_cents} style={{ color: '#10b981' }} /> 
              <span style={{ fontSize: '12px', color: '#64748b', marginLeft: '4px' }}>(Min {row.bulk_min_qty})</span>
          </div>
      ) : <span style={{ color: '#94a3b8' }}>N/A</span>
    }
  ];

  return (
    <div style={{ padding: '24px', backgroundColor: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#0f172a', margin: '0 0 8px 0' }}>Price List</h1>
          <p style={{ color: '#64748b', margin: 0 }}>Current standard and wholesale pricing for all active items.</p>
        </div>
        <button style={{ padding: '10px 20px', backgroundColor: 'white', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '6px', fontWeight: '500', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Download size={16} /> Export PDF
        </button>
      </div>

      <SalesDataTable columns={columns} data={products} searchable={true} searchField="name" />
    </div>
  );
};

export default PriceList;
