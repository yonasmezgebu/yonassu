import React, { useEffect } from 'react';
import { Activity, Download, Printer, Filter } from 'lucide-react';
import { storeInfo } from '../../utils/storeNotifications';

const mockMovements = [
  { id: 'MOV-1001', date: '2026-07-01 08:30', item: 'Paracetamol 500mg', qty: '+5,000', type: 'In (M19)', ref: 'M19-5021', by: 'Store Manager', from: 'ABC Pharma', to: 'Main Store - Rack A' },
  { id: 'MOV-1002', date: '2026-07-01 09:15', item: 'Surgical Gloves (L)', qty: '-100', type: 'Out (M22)', ref: 'M22-4011', by: 'Store Assistant', from: 'Main Store - Rack B', to: 'Pharmacy Dept' },
  { id: 'MOV-1003', date: '2026-06-30 14:00', item: 'A4 Paper', qty: '-5', type: 'Out (M22)', ref: 'M22-4010', by: 'Store Manager', from: 'Office Supply Rm', to: 'Admin Dept' },
  { id: 'MOV-1004', date: '2026-06-30 16:45', item: 'Syringes 5ml', qty: '-20', type: 'Adjustment', ref: 'ADJ-8801', by: 'Store Manager', from: 'Main Store - Rack B', to: 'Damage/Disposal' },
  { id: 'MOV-1005', date: '2026-06-29 11:10', item: 'MRI Contrast Agent', qty: '-10', type: 'Transfer', ref: 'TRF-3001', by: 'Store Assistant', from: 'Cold Storage', to: 'Branch A' },
];

const StoreStockMovementReport = () => {
  useEffect(() => {
    storeInfo('🔄 Stock Movement Report Ready', '🔄 Movement Report', 'Stock movement history generated.');
  }, []);

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Activity color="#8b5cf6" size={28} /> STOCK MOVEMENT REPORT
          </h1>
          <p style={{ color: '#64748b', margin: '4px 0 0' }}>Document Model: Movement Log (with Source/Destination tracking)</p>
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label style={{ fontSize: 13, color: '#64748b' }}>From:</label>
          <input type="date" style={{ padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 14 }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label style={{ fontSize: 13, color: '#64748b' }}>To:</label>
          <input type="date" style={{ padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 14 }} />
        </div>
        <input placeholder="Search Item Name..." style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 14 }} />
        <select style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 14 }}>
          <option>All Movements</option>
          <option>In (M19)</option>
          <option>Out (M22)</option>
          <option>Transfer</option>
          <option>Adjustment</option>
        </select>
      </div>

      <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#f1f5f9' }}>
              {['Date & Time', 'Item Name', 'Qty Moved', 'Type', 'Ref Doc', 'Location From → To', 'Performed By'].map(h => (
                <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 700, color: '#475569', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {mockMovements.map((m, i) => {
              const isPositive = m.qty.startsWith('+');
              return (
                <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px 14px', color: '#64748b', whiteSpace: 'nowrap' }}>{m.date}</td>
                  <td style={{ padding: '12px 14px', fontWeight: 600, color: '#0f172a' }}>{m.item}</td>
                  <td style={{ padding: '12px 14px', fontWeight: 700, color: isPositive ? '#15803d' : '#b91c1c' }}>{m.qty}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{ padding: '3px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, background: isPositive ? '#dcfce7' : '#fee2e2', color: isPositive ? '#166534' : '#991b1b' }}>{m.type}</span>
                  </td>
                  <td style={{ padding: '12px 14px', fontFamily: 'monospace', color: '#475569' }}>{m.ref}</td>
                  <td style={{ padding: '12px 14px', fontSize: 12 }}>
                    <div style={{ color: '#64748b' }}>From: <span style={{ color: '#0f172a', fontWeight: 500 }}>{m.from}</span></div>
                    <div style={{ color: '#64748b', marginTop: 2 }}>To: <span style={{ color: '#0f172a', fontWeight: 500 }}>{m.to}</span></div>
                  </td>
                  <td style={{ padding: '12px 14px', color: '#475569' }}>{m.by}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StoreStockMovementReport;
