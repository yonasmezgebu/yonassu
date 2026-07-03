import React, { useEffect } from 'react';
import { BarChart2, Download, Printer, Filter } from 'lucide-react';
import { storeInfo } from '../../utils/storeNotifications';

const mockInventory = [
  { id: 'ITM-001', name: 'Paracetamol 500mg', category: 'Pharmaceuticals', qty: 12000, reorder: 5000, price: 0.05, loc: 'Main Store - Rack A', expiry: '2027-12-31', batch: 'B-9901' },
  { id: 'ITM-002', name: 'Surgical Gloves (L)', category: 'Medical Supplies', qty: 80, reorder: 100, price: 15.00, loc: 'Main Store - Rack B', expiry: '2028-05-15', batch: 'B-9902' },
  { id: 'ITM-003', name: 'A4 Paper', category: 'Office Supplies', qty: 5, reorder: 10, price: 4.50, loc: 'Office Supply Rm', expiry: 'N/A', batch: 'N/A' },
  { id: 'ITM-004', name: 'MRI Contrast Agent', category: 'Pharmaceuticals', qty: 50, reorder: 20, price: 120.00, loc: 'Cold Storage', expiry: '2026-10-01', batch: 'B-9877' },
  { id: 'ITM-005', name: 'Syringes 5ml', category: 'Medical Supplies', qty: 0, reorder: 500, price: 0.10, loc: 'Main Store - Rack B', expiry: '2029-01-01', batch: 'B-9880' },
];

const StoreStockReport = () => {
  useEffect(() => {
    storeInfo('📊 Stock Report Ready', '📊 Stock Report', 'Your comprehensive stock report is ready for viewing.');
  }, []);

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <BarChart2 color="#6366f1" size={28} /> STOCK REPORT
          </h1>
          <p style={{ color: '#64748b', margin: '4px 0 0' }}>Document Model: Inventory (Aggregated View)</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => window.print()} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: 'white', border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer', fontSize: 14 }}>
            <Printer size={15} /> Print
          </button>
          <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#0f172a', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 14 }}>
            <Download size={15} /> Export PDF/Excel
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20, background: 'white', padding: 16, borderRadius: 8, border: '1px solid #e2e8f0', alignItems: 'center' }}>
        <Filter size={15} color="#64748b" />
        <select style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 14 }}>
          <option>All Categories</option>
          <option>Pharmaceuticals</option>
          <option>Medical Supplies</option>
          <option>Office Supplies</option>
        </select>
        <select style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 14 }}>
          <option>All Locations</option>
          <option>Main Store</option>
          <option>Cold Storage</option>
          <option>Office Supply Rm</option>
        </select>
        <select style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 14 }}>
          <option>All Statuses (In Stock/Low/Out)</option>
          <option>In Stock</option>
          <option>Low Stock</option>
          <option>Out of Stock</option>
        </select>
      </div>

      <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#f1f5f9' }}>
              {['Item Name', 'Category', 'Current Qty', 'Reorder Lvl', 'Unit Price', 'Total Value', 'Location', 'Batch & Expiry'].map(h => (
                <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 700, color: '#475569', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {mockInventory.map(item => {
              const statusColor = item.qty === 0 ? '#b91c1c' : item.qty <= item.reorder ? '#b45309' : '#15803d';
              const statusBg = item.qty === 0 ? '#fee2e2' : item.qty <= item.reorder ? '#fef3c7' : '#dcfce7';
              return (
                <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>{item.name}</div>
                    <div style={{ fontSize: 11, color: '#64748b', fontFamily: 'monospace' }}>{item.id}</div>
                  </td>
                  <td style={{ padding: '12px 14px', color: '#475569' }}>{item.category}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{ padding: '4px 8px', borderRadius: 6, fontWeight: 700, background: statusBg, color: statusColor }}>
                      {item.qty.toLocaleString()}
                    </span>
                  </td>
                  <td style={{ padding: '12px 14px', color: '#64748b' }}>{item.reorder.toLocaleString()}</td>
                  <td style={{ padding: '12px 14px', fontFamily: 'monospace' }}>${item.price.toFixed(2)}</td>
                  <td style={{ padding: '12px 14px', fontWeight: 600, fontFamily: 'monospace', color: '#0f172a' }}>${(item.qty * item.price).toFixed(2)}</td>
                  <td style={{ padding: '12px 14px', color: '#475569' }}>{item.loc}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ fontFamily: 'monospace', color: '#475569' }}>{item.batch}</div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>Exp: {item.expiry}</div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StoreStockReport;
