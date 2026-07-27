import React, { useState, useEffect } from 'react';
import { salesState } from '../../../../utils/salesManagerState';
import SalesDataTable from '../../components/SalesDataTable';
import CurrencyDisplay from '../../components/CurrencyDisplay';
import SalesStatusBadge from '../../components/SalesStatusBadge';

const ProductCatalog = () => {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    setProducts(salesState.getProducts());
    salesState.notify('PAGE_LOAD');
  }, []);

  const columns = [
    { label: 'SKU', field: 'sku', sortable: true },
    { label: 'Name', field: 'name', sortable: true },
    { label: 'Category', field: 'category', sortable: true },
    { 
      label: 'Unit Price', 
      field: 'unit_price_cents',
      sortable: true,
      render: (row) => <CurrencyDisplay amountCents={row.unit_price_cents} />
    },
    { 
      label: 'Bulk Price', 
      field: 'bulk_price_cents',
      render: (row) => row.bulk_price_cents ? (
          <div>
              <CurrencyDisplay amountCents={row.bulk_price_cents} /> 
              <span style={{ fontSize: '12px', color: '#64748b', marginLeft: '4px' }}>(Min {row.bulk_min_qty})</span>
          </div>
      ) : <span style={{ color: '#94a3b8' }}>-</span>
    },
    { 
      label: 'Type', 
      field: 'is_service',
      render: (row) => <span style={{ fontSize: '12px', padding: '2px 6px', backgroundColor: row.is_service ? '#e0e7ff' : '#f1f5f9', color: row.is_service ? '#4338ca' : '#475569', borderRadius: 0 }}>{row.is_service ? 'Service' : 'Product'}</span>
    },
    { 
      label: 'Status', 
      field: 'status',
      render: (row) => <SalesStatusBadge status={row.status === 'active' ? 'approved' : 'rejected'} />
    }
  ];

  return (
    <div style={{ padding: '24px', backgroundColor: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#0f172a', margin: '0 0 8px 0' }}>Product Catalog</h1>
        <p style={{ color: '#64748b', margin: 0 }}>Master list of all saleable products and services.</p>
      </div>

      <SalesDataTable columns={columns} data={products} searchable={true} searchField="name" />
    </div>
  );
};

export default ProductCatalog;
