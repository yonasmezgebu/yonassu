import React, { useState } from 'react';
import { Package, Download, Printer, AlertTriangle } from 'lucide-react';
import { triggerNotification } from '../../utils/pharmacyNotifications';

const PharmacyInventoryReport = () => {
  const [filters, setFilters] = useState({ category: 'All', branch: 'All', status: 'All' });

  const mockInventory = [
    { id: 1, name: 'Paracetamol 500mg', category: 'Painkillers', branch: 'Branch A', stock: 15, reorder: 50, price: 50, expiry: '2027-01-15', batch: 'B-101' },
    { id: 2, name: 'Amoxicillin 250mg', category: 'Antibiotics', branch: 'Branch B', stock: 120, reorder: 40, price: 350, expiry: '2028-06-20', batch: 'B-205' },
    { id: 3, name: 'Vitamin C', category: 'Supplements', branch: 'Branch A', stock: 0, reorder: 100, price: 30, expiry: '2026-12-01', batch: 'B-99' },
  ];

  const handleExport = (format) => {
    triggerNotification('Export Successful', `Inventory Report exported as ${format}`, 'success');
  };

  const getStatus = (stock, reorder) => {
    if (stock === 0) return { label: 'Out of stock', color: '#ef4444', bg: '#fef2f2' };
    if (stock < reorder) return { label: 'Low stock', color: '#f59e0b', bg: '#fffbeb' };
    return { label: 'In stock', color: '#10b981', bg: '#dcfce7' };
  };

  return (
    <div style={{ padding: 24, fontFamily: "'Inter', sans-serif" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 'bold', color: '#1e293b', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Package size={24} color="#0284c7" /> INVENTORY REPORT
          </h2>
          <p style={{ color: '#64748b', margin: 0 }}>🔗 View Inventory Reports & Valuations</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => handleExport('PDF')} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#1e293b', color: 'white', padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer' }}>
            <Download size={18} /> Export PDF
          </button>
          <button onClick={() => handleExport('Excel')} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#0284c7', color: 'white', padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer' }}>
            <Download size={18} /> Export Excel
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 24, background: 'white', padding: 16, borderRadius: 8, border: '1px solid #e2e8f0' }}>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', fontSize: 12, color: '#64748b', marginBottom: 4 }}>Drug Category</label>
          <select value={filters.category} onChange={e => setFilters({...filters, category: e.target.value})} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #cbd5e1' }}>
            <option>All</option><option>Painkillers</option><option>Antibiotics</option><option>Supplements</option>
          </select>
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', fontSize: 12, color: '#64748b', marginBottom: 4 }}>Branch</label>
          <select value={filters.branch} onChange={e => setFilters({...filters, branch: e.target.value})} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #cbd5e1' }}>
            <option>All</option><option>Branch A</option><option>Branch B</option>
          </select>
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', fontSize: 12, color: '#64748b', marginBottom: 4 }}>Stock Status</label>
          <select value={filters.status} onChange={e => setFilters({...filters, status: e.target.value})} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #cbd5e1' }}>
            <option>All</option><option>In stock</option><option>Low</option><option>Out of stock</option>
          </select>
        </div>
      </div>

      <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
            <tr>
              <th style={{ padding: 12, color: '#475569' }}>Drug Name</th>
              <th style={{ padding: 12, color: '#475569' }}>Status</th>
              <th style={{ padding: 12, color: '#475569', textAlign: 'right' }}>Current Stock</th>
              <th style={{ padding: 12, color: '#475569', textAlign: 'right' }}>Reorder Level</th>
              <th style={{ padding: 12, color: '#475569', textAlign: 'right' }}>Unit Price</th>
              <th style={{ padding: 12, color: '#475569', textAlign: 'right' }}>Total Value</th>
              <th style={{ padding: 12, color: '#475569' }}>Expiry / Batch</th>
            </tr>
          </thead>
          <tbody>
            {mockInventory.map(item => {
              const status = getStatus(item.stock, item.reorder);
              return (
                <tr key={item.id} style={{ borderBottom: '1px solid #e2e8f0', background: item.stock < item.reorder ? '#fffbeb' : 'transparent' }}>
                  <td style={{ padding: 12 }}>
                    <strong>{item.name}</strong>
                    <div style={{ fontSize: 12, color: '#64748b' }}>{item.category} • {item.branch}</div>
                  </td>
                  <td style={{ padding: 12 }}>
                    <span style={{ padding: '4px 8px', borderRadius: 4, fontSize: 12, fontWeight: 'bold', background: status.bg, color: status.color, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      {item.stock < item.reorder && <AlertTriangle size={14} />} {status.label}
                    </span>
                  </td>
                  <td style={{ padding: 12, textAlign: 'right', fontWeight: 'bold', color: item.stock < item.reorder ? '#d97706' : 'inherit' }}>{item.stock}</td>
                  <td style={{ padding: 12, textAlign: 'right' }}>{item.reorder}</td>
                  <td style={{ padding: 12, textAlign: 'right' }}>${item.price.toFixed(2)}</td>
                  <td style={{ padding: 12, textAlign: 'right', fontWeight: 'bold', color: '#0369a1' }}>${(item.stock * item.price).toFixed(2)}</td>
                  <td style={{ padding: 12 }}>
                    <div>{item.expiry}</div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>Batch: {item.batch}</div>
                  </td>
                </tr>
              );
            })}
            <tr style={{ background: '#f8fafc', fontWeight: 'bold' }}>
              <td colSpan="5" style={{ padding: 12, textAlign: 'right' }}>Grand Total Valuation:</td>
              <td style={{ padding: 12, textAlign: 'right', color: '#1d4ed8' }}>
                ${mockInventory.reduce((sum, i) => sum + (i.stock * i.price), 0).toFixed(2)}
              </td>
              <td></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PharmacyInventoryReport;
