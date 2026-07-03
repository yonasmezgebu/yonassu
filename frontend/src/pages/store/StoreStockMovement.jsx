import React, { useState, useEffect } from 'react';
import { Activity, Filter, Download, Printer } from 'lucide-react';
import { notifyMovementReport } from '../../utils/storeNotifications';

const mockMovements = [
  { id: 1, datetime: '2026-06-30 09:15', item: 'Amoxicillin 500mg', qty: 200, type: 'In', ref: 'M19-001122', by: 'Store Manager' },
  { id: 2, datetime: '2026-06-30 10:45', item: 'Surgical Gloves (L)', qty: -50, type: 'Out', ref: 'M22-001130', by: 'Store Worker A' },
  { id: 3, datetime: '2026-06-30 11:20', item: 'Paracetamol 500mg', qty: 500, type: 'In', ref: 'M19-001133', by: 'Store Manager' },
  { id: 4, datetime: '2026-06-30 14:00', item: 'IV Fluid (500ml)', qty: -15, type: 'Transfer', ref: 'TRF-009901', by: 'Store Manager' },
  { id: 5, datetime: '2026-06-30 15:30', item: 'Hand Sanitizer 500ml', qty: -10, type: 'Out', ref: 'M22-001145', by: 'Store Worker B' },
  { id: 6, datetime: '2026-07-01 08:00', item: 'A4 Paper Reams', qty: -5, type: 'Adjustment', ref: 'ADJ-004412', by: 'Store Manager' },
  { id: 7, datetime: '2026-07-01 09:00', item: 'Metformin 500mg', qty: 300, type: 'In', ref: 'M19-001150', by: 'Store Manager' },
];

const typeColors = { In: { bg: '#dcfce7', color: '#166534' }, Out: { bg: '#fee2e2', color: '#991b1b' }, Transfer: { bg: '#ede9fe', color: '#5b21b6' }, Adjustment: { bg: '#fff7ed', color: '#9a3412' } };

const StoreStockMovement = () => {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [filterItem, setFilterItem] = useState('');
  const [filterType, setFilterType] = useState('All');

  useEffect(() => {
    notifyMovementReport();
  }, []);

  const filtered = mockMovements.filter(m => {
    const matchType = filterType === 'All' || m.type === filterType;
    const matchItem = !filterItem || m.item.toLowerCase().includes(filterItem.toLowerCase());
    return matchType && matchItem;
  });

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Activity color="#14b8a6" size={28} /> STOCK MOVEMENT LOG
          </h1>
          <p style={{ color: '#64748b', margin: '4px 0 0' }}>Document Model: Movement Log — Read-Only Historical Record</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => window.print()} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: 'white', border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer', fontSize: 14 }}>
            <Printer size={15} /> Print
          </button>
          <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#0f172a', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 14 }}>
            <Download size={15} /> Export
          </button>
        </div>
      </div>

      {/* FILTERS */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20, background: 'white', padding: 16, borderRadius: 8, border: '1px solid #e2e8f0', alignItems: 'center' }}>
        <Filter size={15} color="#64748b" />
        <input value={filterItem} onChange={e => setFilterItem(e.target.value)} placeholder="Filter by item name..." style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 14, width: 200 }} />
        <select value={filterType} onChange={e => setFilterType(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 14 }}>
          <option value="All">All Types</option>
          <option>In</option>
          <option>Out</option>
          <option>Transfer</option>
          <option>Adjustment</option>
        </select>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: '#64748b' }}>From:</label>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 14 }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: '#64748b' }}>To:</label>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 14 }} />
        </div>
        <span style={{ marginLeft: 'auto', fontSize: 13, color: '#64748b' }}>{filtered.length} records shown</span>
      </div>

      {/* TABLE */}
      <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#f1f5f9' }}>
              {['Date & Time', 'Item Name', 'Qty Moved', 'Movement Type', 'Reference Document', 'Performed By'].map(h => (
                <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 700, color: '#475569', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(m => (
              <tr key={m.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontSize: 12, color: '#64748b' }}>{m.datetime}</td>
                <td style={{ padding: '12px 14px', fontWeight: 600 }}>{m.item}</td>
                <td style={{ padding: '12px 14px', fontWeight: 700, color: m.qty > 0 ? '#166534' : '#b91c1c' }}>{m.qty > 0 ? `+${m.qty}` : m.qty}</td>
                <td style={{ padding: '12px 14px' }}>
                  <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700, ...typeColors[m.type] }}>{m.type}</span>
                </td>
                <td style={{ padding: '12px 14px', fontFamily: 'monospace', color: '#3b82f6', fontSize: 12 }}>{m.ref}</td>
                <td style={{ padding: '12px 14px', color: '#64748b' }}>{m.by}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StoreStockMovement;
