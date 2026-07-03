import React, { useState } from 'react';
import { Download, Printer, FileText, Calendar, Filter } from 'lucide-react';

const PharmacySalesHistory = () => {
  const [filters, setFilters] = useState({ dateRange: 'Today', branch: 'All', worker: 'All', paymentMethod: 'All', customer: '' });

  const mockHistory = [
    { id: 'SALE-1001', date: '2026-07-01', time: '10:30 AM', branch: 'Branch A', worker: 'Abebe', customer: 'Kebede', payment: 'Cash', total: 450 },
    { id: 'SALE-1002', date: '2026-07-01', time: '11:15 AM', branch: 'Branch B', worker: 'Helen', customer: 'Walk-in', payment: 'Bank Transfer', total: 120 },
    { id: 'SALE-0999', date: '2026-06-30', time: '04:20 PM', branch: 'Branch A', worker: 'Samuel', customer: 'Marta', payment: 'Telbir', total: 600 },
  ];

  const handleExport = (format) => {
    console.log(`Exporting Sales History as ${format}...`);
  };

  return (
    <div style={{ padding: 24, fontFamily: "'Inter', sans-serif" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 'bold', color: '#1e293b', margin: 0 }}>📊 SALES HISTORY</h2>
          <p style={{ color: '#64748b', margin: 0 }}>🔗 View Complete Sales History</p>
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

      <div style={{ display: 'flex', gap: 12, marginBottom: 24, background: 'white', padding: 16, borderRadius: 8, border: '1px solid #e2e8f0', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 150px' }}>
          <label style={{ display: 'block', fontSize: 12, color: '#64748b', marginBottom: 4 }}>Date Range</label>
          <select value={filters.dateRange} onChange={e => setFilters({...filters, dateRange: e.target.value})} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #cbd5e1' }}>
            <option>Today</option><option>Week</option><option>Month</option><option>Year</option><option>Custom</option>
          </select>
        </div>
        <div style={{ flex: '1 1 150px' }}>
          <label style={{ display: 'block', fontSize: 12, color: '#64748b', marginBottom: 4 }}>Branch</label>
          <select value={filters.branch} onChange={e => setFilters({...filters, branch: e.target.value})} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #cbd5e1' }}>
            <option>All</option><option>Branch A</option><option>Branch B</option>
          </select>
        </div>
        <div style={{ flex: '1 1 150px' }}>
          <label style={{ display: 'block', fontSize: 12, color: '#64748b', marginBottom: 4 }}>Payment Method</label>
          <select value={filters.paymentMethod} onChange={e => setFilters({...filters, paymentMethod: e.target.value})} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #cbd5e1' }}>
            <option>All</option><option>Cash</option><option>Bank Transfer</option><option>Telbir</option>
          </select>
        </div>
        <div style={{ flex: '1 1 150px' }}>
          <label style={{ display: 'block', fontSize: 12, color: '#64748b', marginBottom: 4 }}>Worker</label>
          <select value={filters.worker} onChange={e => setFilters({...filters, worker: e.target.value})} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #cbd5e1' }}>
            <option>All</option><option>Abebe</option><option>Helen</option><option>Samuel</option>
          </select>
        </div>
        <div style={{ flex: '1 1 150px' }}>
          <label style={{ display: 'block', fontSize: 12, color: '#64748b', marginBottom: 4 }}>Customer Name</label>
          <input type="text" placeholder="Search..." value={filters.customer} onChange={e => setFilters({...filters, customer: e.target.value})} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #cbd5e1' }} />
        </div>
      </div>

      <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
            <tr>
              <th style={{ padding: 12, color: '#475569' }}>Txn ID</th>
              <th style={{ padding: 12, color: '#475569' }}>Date / Time</th>
              <th style={{ padding: 12, color: '#475569' }}>Customer</th>
              <th style={{ padding: 12, color: '#475569' }}>Payment Method</th>
              <th style={{ padding: 12, color: '#475569' }}>Total Amount</th>
              <th style={{ padding: 12, color: '#475569', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {mockHistory.map(sale => (
              <tr key={sale.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: 12, fontWeight: 'bold' }}>{sale.id}</td>
                <td style={{ padding: 12 }}>{sale.date} <span style={{ color: '#64748b' }}>{sale.time}</span></td>
                <td style={{ padding: 12 }}>{sale.customer}</td>
                <td style={{ padding: 12 }}>
                  <span style={{ padding: '4px 8px', borderRadius: 4, fontSize: 12, background: sale.payment === 'Cash' ? '#dcfce7' : sale.payment === 'Bank Transfer' ? '#e0e7ff' : '#fef3c7', color: sale.payment === 'Cash' ? '#166534' : sale.payment === 'Bank Transfer' ? '#3730a3' : '#92400e' }}>
                    {sale.payment}
                  </span>
                </td>
                <td style={{ padding: 12, fontWeight: 'bold' }}>${sale.total.toFixed(2)}</td>
                <td style={{ padding: 12, textAlign: 'right' }}>
                  <button onClick={() => triggerNotification('View Receipt', `Viewing receipt for ${sale.id}`, 'info')} style={{ padding: '6px 12px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer', marginRight: 8 }}>
                    <FileText size={16} /> View Receipt
                  </button>
                  <button style={{ padding: '6px 12px', background: 'transparent', color: '#0284c7', border: '1px solid #0284c7', borderRadius: 6, cursor: 'pointer' }}>
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

export default PharmacySalesHistory;
