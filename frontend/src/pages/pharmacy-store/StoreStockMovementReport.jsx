import React, { useState, useEffect } from 'react';
import { Activity, Download, Printer, Filter } from 'lucide-react';
import { getMovements } from '../../utils/storeApi';

const typeColors = {
  Receipt: { bg: '#dcfce7', color: '#166534' },
  Issue: { bg: '#fee2e2', color: '#991b1b' },
  Transfer: { bg: '#ede9fe', color: '#5b21b6' },
  Adjustment: { bg: '#fff7ed', color: '#9a3412' },
};
const fallbackColor = { bg: '#f1f5f9', color: '#475569' };

const StoreStockMovementReport = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('All');
  const [search, setSearch] = useState('');

  useEffect(() => {
    getMovements().then(r => { setData(r.data || []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const filtered = data.filter(m => {
    if (filterType !== 'All' && m.movement_type !== filterType) return false;
    if (search && !(m.ref_no || '').toLowerCase().includes(search.toLowerCase()) && !(m.item_name || '').toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  if (loading) return <div style={{ padding: 24, fontFamily: "'Inter', sans-serif" }}>Loading...</div>;

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
        <input placeholder="Search ref no or item name..." value={search} onChange={e => setSearch(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 14, width: 220 }} />
        <select value={filterType} onChange={e => setFilterType(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 14 }}>
          <option value="All">All Movements</option>
          <option>Receipt</option>
          <option>Issue</option>
          <option>Transfer</option>
          <option>Adjustment</option>
        </select>
        <span style={{ marginLeft: 'auto', fontSize: 13, color: '#64748b' }}>{filtered.length} records</span>
      </div>
      <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#f1f5f9' }}>
              {['Date & Time', 'Item Name', 'Strength', 'Qty Moved', 'Unit', 'Movement Type', 'Ref No', 'Source / Destination'].map(h => (
                <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 700, color: '#475569', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((m, i) => (
              <tr key={m.id || i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '12px 14px', color: '#64748b', whiteSpace: 'nowrap', fontSize: 12 }}>{new Date(m.created_at).toLocaleString()}</td>
                <td style={{ padding: '12px 14px', fontWeight: 600, whiteSpace: 'nowrap' }}>{m.item_name || '-'}</td>
                <td style={{ padding: '12px 14px', color: '#64748b' }}>{m.strength || '-'}</td>
                <td style={{ padding: '12px 14px', fontWeight: 700, color: '#0f172a' }}>{m.qty_moved != null ? m.qty_moved : '-'}</td>
                <td style={{ padding: '12px 14px', color: '#64748b' }}>{m.unit || '-'}</td>
                <td style={{ padding: '12px 14px' }}>
                  <span style={{ padding: '3px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, ...(typeColors[m.movement_type] || fallbackColor) }}>{m.movement_type}</span>
                </td>
                <td style={{ padding: '12px 14px', fontFamily: 'monospace', color: '#475569', fontSize: 12, whiteSpace: 'nowrap' }}>{m.ref_no}</td>
                <td style={{ padding: '12px 14px', color: '#64748b', fontSize: 12, whiteSpace: 'nowrap' }}>{m.performed_by || '-'}</td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={8} style={{ padding: 24, textAlign: 'center', color: '#94a3b8' }}>No movements found</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StoreStockMovementReport;
