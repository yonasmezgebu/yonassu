import React, { useState } from 'react';
import { Search, Filter, Printer, Download, Eye, Calendar, MapPin, User, FileText } from 'lucide-react';

const PharmacySalesList = () => {
  const [filters, setFilters] = useState({ date: '', branch: 'All', customer: '', worker: 'All' });
  
  const mockSales = [
    { id: 'SALE-1001', date: '2026-07-01', time: '10:30 AM', branch: 'Branch A', worker: 'Abebe', customer: 'Kebede', total: 450, items: [{ name: 'Paracetamol', qty: 2, price: 50, total: 100 }, { name: 'Amoxicillin', qty: 1, price: 350, total: 350 }] },
    { id: 'SALE-1002', date: '2026-07-01', time: '11:15 AM', branch: 'Branch B', worker: 'Helen', customer: 'Walk-in', total: 120, items: [{ name: 'Vitamin C', qty: 4, price: 30, total: 120 }] },
  ];

  const handleExport = () => {
    // Silent — no sound for exports
    console.log('Exporting sales list...');
  };

  const handlePrintReceipt = (id) => {
    // Silent — no sound for prints
    console.log('Printing:', id);
  };

  return (
    <div style={{ padding: 24, fontFamily: "'Inter', sans-serif" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 'bold', color: '#1e293b', margin: 0 }}>💰 SALES LOG</h2>
          <p style={{ color: '#64748b', margin: 0 }}>🔗 Manage Sales Transactions</p>
        </div>
        <button onClick={handleExport} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#1e293b', color: 'white', padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer' }}>
          <Download size={18} /> Export List
        </button>
      </div>

      {/* Performance Summary */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
        <div style={{ background: '#eff6ff', padding: 16, borderRadius: 8, flex: 1, border: '1px solid #bfdbfe' }}>
          <div style={{ color: '#1d4ed8', fontSize: 14, fontWeight: 'bold' }}>TOTAL TRANSACTIONS</div>
          <div style={{ fontSize: 24, fontWeight: 'bold', color: '#1e3a8a' }}>{mockSales.length}</div>
        </div>
        <div style={{ background: '#ecfccb', padding: 16, borderRadius: 8, flex: 1, border: '1px solid #d9f99d' }}>
          <div style={{ color: '#4d7c0f', fontSize: 14, fontWeight: 'bold' }}>TOTAL REVENUE</div>
          <div style={{ fontSize: 24, fontWeight: 'bold', color: '#3f6212' }}>
            ${mockSales.reduce((sum, s) => sum + s.total, 0).toFixed(2)}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, background: 'white', padding: 16, borderRadius: 8, border: '1px solid #e2e8f0' }}>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', fontSize: 12, color: '#64748b', marginBottom: 4 }}>Date</label>
          <input type="date" value={filters.date} onChange={e => setFilters({...filters, date: e.target.value})} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #cbd5e1' }} />
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', fontSize: 12, color: '#64748b', marginBottom: 4 }}>Branch</label>
          <select value={filters.branch} onChange={e => setFilters({...filters, branch: e.target.value})} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #cbd5e1' }}>
            <option>All</option><option>Branch A</option><option>Branch B</option>
          </select>
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', fontSize: 12, color: '#64748b', marginBottom: 4 }}>Customer</label>
          <input type="text" placeholder="Search..." value={filters.customer} onChange={e => setFilters({...filters, customer: e.target.value})} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #cbd5e1' }} />
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', fontSize: 12, color: '#64748b', marginBottom: 4 }}>Worker</label>
          <select value={filters.worker} onChange={e => setFilters({...filters, worker: e.target.value})} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #cbd5e1' }}>
            <option>All</option><option>Abebe</option><option>Helen</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
            <tr>
              <th style={{ padding: 12, color: '#475569' }}>Txn ID</th>
              <th style={{ padding: 12, color: '#475569' }}>Date / Time</th>
              <th style={{ padding: 12, color: '#475569' }}>Branch</th>
              <th style={{ padding: 12, color: '#475569' }}>Worker</th>
              <th style={{ padding: 12, color: '#475569' }}>Customer</th>
              <th style={{ padding: 12, color: '#475569' }}>Total Value</th>
              <th style={{ padding: 12, color: '#475569', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {mockSales.map(sale => (
              <tr key={sale.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: 12, fontWeight: 'bold' }}>{sale.id}</td>
                <td style={{ padding: 12 }}>{sale.date} <span style={{ color: '#64748b' }}>{sale.time}</span></td>
                <td style={{ padding: 12 }}>{sale.branch}</td>
                <td style={{ padding: 12 }}>{sale.worker}</td>
                <td style={{ padding: 12 }}>{sale.customer}</td>
                <td style={{ padding: 12, fontWeight: 'bold', color: '#10b981' }}>${sale.total.toFixed(2)}</td>
                <td style={{ padding: 12, textAlign: 'right' }}>
                  <button onClick={() => handlePrintReceipt(sale.id)} style={{ padding: '6px 12px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer', marginRight: 8 }}>
                    <FileText size={16} /> Details
                  </button>
                  <button onClick={() => handlePrintReceipt(sale.id)} style={{ padding: '6px 12px', background: '#0284c7', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
                    <Printer size={16} /> Print
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PharmacySalesList;
