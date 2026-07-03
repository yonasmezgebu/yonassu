import React, { useState } from 'react';
import { Activity, Download, Printer } from 'lucide-react';
import { triggerNotification } from '../../utils/pharmacyNotifications';

const PharmacyStockMovement = () => {
  const [filters, setFilters] = useState({ dateRange: '', branch: 'All', drugName: '', type: 'All' });

  const mockMovements = [
    { id: 'MOV-1001', datetime: '2026-07-01 10:30 AM', drug: 'Paracetamol 500mg', qty: -2, type: 'Out', subType: 'Sale', docRef: 'M22-4091', user: 'Abebe', branch: 'Branch A' },
    { id: 'MOV-1002', datetime: '2026-07-01 09:15 AM', drug: 'Amoxicillin 250mg', qty: 50, type: 'In', subType: 'Goods Received', docRef: 'M19-881', user: 'Samuel', branch: 'Branch B' },
    { id: 'MOV-1003', datetime: '2026-06-30 04:20 PM', drug: 'Vitamin C', qty: -10, type: 'Transfer', subType: 'Branch A → Branch B', docRef: 'TRN-204', user: 'Helen', branch: 'Branch A' },
  ];

  const handleExport = (format) => {
    triggerNotification('Export Successful', `Stock Movement log exported as ${format}`, 'success');
  };

  return (
    <div style={{ padding: 24, fontFamily: "'Inter', sans-serif" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 'bold', color: '#1e293b', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Activity size={24} color="#06b6d4" /> STOCK MOVEMENT
          </h2>
          <p style={{ color: '#64748b', margin: 0 }}>🔗 View Log of All Stock Movements (Manager Only)</p>
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
          <label style={{ display: 'block', fontSize: 12, color: '#64748b', marginBottom: 4 }}>Date Range</label>
          <input type="date" value={filters.dateRange} onChange={e => setFilters({...filters, dateRange: e.target.value})} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #cbd5e1' }} />
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', fontSize: 12, color: '#64748b', marginBottom: 4 }}>Branch</label>
          <select value={filters.branch} onChange={e => setFilters({...filters, branch: e.target.value})} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #cbd5e1' }}>
            <option>All</option><option>Branch A</option><option>Branch B</option>
          </select>
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', fontSize: 12, color: '#64748b', marginBottom: 4 }}>Movement Type</label>
          <select value={filters.type} onChange={e => setFilters({...filters, type: e.target.value})} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #cbd5e1' }}>
            <option>All</option><option>In</option><option>Out</option><option>Transfer</option>
          </select>
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', fontSize: 12, color: '#64748b', marginBottom: 4 }}>Drug Name</label>
          <input type="text" placeholder="Search drug..." value={filters.drugName} onChange={e => setFilters({...filters, drugName: e.target.value})} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #cbd5e1' }} />
        </div>
      </div>

      <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
            <tr>
              <th style={{ padding: 12, color: '#475569' }}>Date & Time</th>
              <th style={{ padding: 12, color: '#475569' }}>Drug Name & Branch</th>
              <th style={{ padding: 12, color: '#475569', textAlign: 'center' }}>Qty Moved</th>
              <th style={{ padding: 12, color: '#475569' }}>Movement Type</th>
              <th style={{ padding: 12, color: '#475569' }}>Ref Document</th>
              <th style={{ padding: 12, color: '#475569' }}>Performed By</th>
            </tr>
          </thead>
          <tbody>
            {mockMovements.map(mov => (
              <tr key={mov.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: 12 }}>{mov.datetime}</td>
                <td style={{ padding: 12, fontWeight: 'bold' }}>{mov.drug} <div style={{ fontSize: 12, color: '#64748b', fontWeight: 'normal' }}>{mov.branch}</div></td>
                <td style={{ padding: 12, textAlign: 'center', fontWeight: 'bold', color: mov.qty > 0 ? '#10b981' : '#ef4444' }}>
                  {mov.qty > 0 ? `+${mov.qty}` : mov.qty}
                </td>
                <td style={{ padding: 12 }}>
                  <span style={{ padding: '4px 8px', borderRadius: 4, fontSize: 12, background: mov.type === 'In' ? '#dcfce7' : mov.type === 'Out' ? '#fee2e2' : '#e0e7ff', color: mov.type === 'In' ? '#166534' : mov.type === 'Out' ? '#991b1b' : '#3730a3', fontWeight: 'bold' }}>
                    {mov.type}: {mov.subType}
                  </span>
                </td>
                <td style={{ padding: 12 }}><a href="#" style={{ color: '#0284c7', textDecoration: 'none', fontWeight: 'bold' }} onClick={(e) => { e.preventDefault(); triggerNotification('Document', `Viewing ${mov.docRef}`, 'info'); }}>{mov.docRef}</a></td>
                <td style={{ padding: 12 }}>{mov.user}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PharmacyStockMovement;
