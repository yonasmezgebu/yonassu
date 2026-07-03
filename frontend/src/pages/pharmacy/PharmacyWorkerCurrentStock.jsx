import React, { useState } from 'react';
import { Package, Download, Printer, Search } from 'lucide-react';

const MOCK_STOCK = [
  { name: 'Amoxicillin', category: 'Antibiotic', qty: 500, reorderLevel: 100, unitPrice: 15.00, totalValue: 7500.00, expiryDate: '2027-03-15', batchNumber: 'BTH-001', location: 'Shelf A-1', status: 'In Stock' },
  { name: 'Paracetamol', category: 'Analgesic', qty: 1200, reorderLevel: 200, unitPrice: 5.00, totalValue: 6000.00, expiryDate: '2027-06-20', batchNumber: 'BTH-002', location: 'Shelf B-3', status: 'In Stock' },
  { name: 'Ibuprofen', category: 'Analgesic', qty: 0, reorderLevel: 50, unitPrice: 8.50, totalValue: 0, expiryDate: '2026-12-10', batchNumber: 'BTH-003', location: 'Shelf B-4', status: 'Out of Stock' },
  { name: 'Ciprofloxacin', category: 'Antibiotic', qty: 30, reorderLevel: 100, unitPrice: 22.00, totalValue: 660.00, expiryDate: '2026-10-05', batchNumber: 'BTH-004', location: 'Shelf A-2', status: 'Low' },
  { name: 'Metformin', category: 'Diabetic', qty: 450, reorderLevel: 80, unitPrice: 12.00, totalValue: 5400.00, expiryDate: '2027-09-30', batchNumber: 'BTH-005', location: 'Shelf C-1', status: 'In Stock' },
];

const STATUS_COLORS = {
  'In Stock': { bg: '#dcfce7', color: '#166534' },
  'Low': { bg: '#fef3c7', color: '#92400e' },
  'Out of Stock': { bg: '#fee2e2', color: '#991b1b' },
};

const PharmacyWorkerCurrentStock = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [locationFilter, setLocationFilter] = useState('All');

  const locations = ['All', ...new Set(MOCK_STOCK.map(s => s.location.split('-')[0].trim()))];

  const filtered = MOCK_STOCK.filter(item => {
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase()) || item.category.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'All' || item.status === statusFilter;
    const matchLocation = locationFilter === 'All' || item.location.startsWith(locationFilter);
    return matchSearch && matchStatus && matchLocation;
  });

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: '#3730a3' }}>
            <Package color="#6366f1" size={28} /> CURRENT STOCK
          </h1>
          <p style={{ color: '#64748b', margin: '4px 0 0' }}>Document Model: Inventory — Read-only view</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: 'white', border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer', color: '#475569', fontSize: 13 }}>
            <Download size={15} /> Export PDF
          </button>
          <button onClick={() => window.print()} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: 'white', border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer', color: '#475569', fontSize: 13 }}>
            <Printer size={15} /> Print List
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', padding: 16, marginBottom: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px 200px', gap: 16 }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: 11, color: '#94a3b8' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by Medicine Name or Category..." style={{ width: '100%', padding: '9px 12px 9px 36px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13, boxSizing: 'border-box' }} />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13 }}>
            <option>All</option>
            <option>In Stock</option>
            <option>Low</option>
            <option>Out of Stock</option>
          </select>
          <select value={locationFilter} onChange={e => setLocationFilter(e.target.value)} style={{ padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13 }}>
            {locations.map(l => <option key={l}>{l}</option>)}
          </select>
        </div>
      </div>

      {/* Stock Table */}
      <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              {['Medicine Name', 'Qty', 'Reorder Level', 'Unit Price', 'Total Value', 'Expiry Date', 'Batch #', 'Location', 'Status'].map(col => (
                <th key={col} style={{ padding: '11px 16px', textAlign: 'left', color: '#475569', fontWeight: 600, fontSize: 13 }}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((item, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #f1f5f9', background: item.status === 'Out of Stock' ? '#fef2f2' : 'white' }}>
                <td style={{ padding: '11px 16px', fontWeight: 600 }}>{item.name}</td>
                <td style={{ padding: '11px 16px', fontWeight: item.status !== 'In Stock' ? 'bold' : 'normal', color: item.status === 'Out of Stock' ? '#dc2626' : item.status === 'Low' ? '#d97706' : '#0f172a' }}>{item.qty}</td>
                <td style={{ padding: '11px 16px', color: '#64748b' }}>{item.reorderLevel}</td>
                <td style={{ padding: '11px 16px' }}>${item.unitPrice.toFixed(2)}</td>
                <td style={{ padding: '11px 16px', fontWeight: 600 }}>${item.totalValue.toFixed(2)}</td>
                <td style={{ padding: '11px 16px', color: '#64748b' }}>{item.expiryDate}</td>
                <td style={{ padding: '11px 16px', color: '#64748b', fontFamily: 'monospace' }}>{item.batchNumber}</td>
                <td style={{ padding: '11px 16px', color: '#64748b' }}>{item.location}</td>
                <td style={{ padding: '11px 16px' }}>
                  <span style={{ ...STATUS_COLORS[item.status], padding: '3px 8px', borderRadius: 4, fontSize: 12, fontWeight: 600 }}>{item.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PharmacyWorkerCurrentStock;
