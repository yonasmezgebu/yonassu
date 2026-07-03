import React, { useState, useEffect } from 'react';
import { salesState } from '../../../../utils/salesManagerState';
import SalesDataTable from '../../components/SalesDataTable';

const StockAvailability = () => {
  const [stockData, setStockData] = useState([]);

  useEffect(() => {
    // Join Products with StockLevels
    const products = salesState.getProducts();
    const levels = salesState.getStockLevels();
    
    const joined = levels.map(level => {
        const prod = products.find(p => p.id === level.product_id);
        return {
            ...level,
            product_name: prod ? prod.name : 'Unknown',
            product_sku: prod ? prod.sku : 'Unknown',
            category: prod ? prod.category : 'Unknown'
        };
    });

    setStockData(joined);
    salesState.notify('STOCK_UPDATED');
  }, []);

  const columns = [
    { label: 'SKU', field: 'product_sku', sortable: true },
    { label: 'Product', field: 'product_name', sortable: true },
    { label: 'Location', field: 'location', sortable: true, render: (row) => <span style={{ textTransform: 'capitalize' }}>{row.location}</span> },
    { 
      label: 'Qty On Hand', 
      field: 'quantity_on_hand',
      sortable: true,
      render: (row) => (
          <span style={{ 
              fontWeight: '600',
              color: row.quantity_on_hand <= row.reorder_threshold ? '#ef4444' : '#1e293b'
          }}>
              {row.quantity_on_hand}
          </span>
      )
    },
    { 
      label: 'Threshold', 
      field: 'reorder_threshold',
      render: (row) => <span style={{ color: '#64748b' }}>{row.reorder_threshold}</span>
    },
    {
      label: 'Status',
      field: 'id',
      render: (row) => {
          if (row.quantity_on_hand === 0) return <span style={{ color: '#ef4444', fontSize: '12px', fontWeight: '600' }}>Out of Stock</span>;
          if (row.quantity_on_hand <= row.reorder_threshold) return <span style={{ color: '#f59e0b', fontSize: '12px', fontWeight: '600' }}>Low Stock</span>;
          return <span style={{ color: '#10b981', fontSize: '12px', fontWeight: '600' }}>In Stock</span>;
      }
    }
  ];

  return (
    <div style={{ padding: '24px', backgroundColor: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#0f172a', margin: '0 0 8px 0' }}>Stock Availability</h1>
        <p style={{ color: '#64748b', margin: 0 }}>Real-time inventory levels across all locations.</p>
      </div>

      <SalesDataTable columns={columns} data={stockData} searchable={true} searchField="product_name" />
    </div>
  );
};

export default StockAvailability;
