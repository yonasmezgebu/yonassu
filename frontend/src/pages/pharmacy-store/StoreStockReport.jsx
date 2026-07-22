import React, { useState, useEffect } from 'react';
import { BarChart2, Download, Printer, Filter } from 'lucide-react';
import { getInventory } from '../../utils/storeApi';

const StoreStockReport = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterCat, setFilterCat] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');

  useEffect(() => {
    getInventory().then(r => { setRows(r.data || []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const categories = [...new Set(rows.map(i => i.category).filter(Boolean))];
  const filtered = rows.filter(i => {
    if (filterCat !== 'All' && i.category !== filterCat) return false;
    const st = Number(i.quantity) === 0 ? 'Out of Stock' : Number(i.quantity) <= Number(i.min_level || 0) ? 'Low Stock' : 'In Stock';
    if (filterStatus !== 'All' && st !== filterStatus) return false;
    return true;
  });

  if (loading) return <div style={{ padding: 24, fontFamily: "'Inter', sans-serif" }}>Loading...</div>;

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
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 14 }}>
          <option>All Categories</option>
          {categories.map(c => <option key={c}>{c}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 14 }}>
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
            {filtered.map(i => {
              const q = Number(i.quantity);
              const ml = Number(i.min_level || 0);
              const statusColor = q === 0 ? '#b91c1c' : q <= ml ? '#b45309' : '#15803d';
              const statusBg = q === 0 ? '#fee2e2' : q <= ml ? '#fef3c7' : '#dcfce7';
              return (
                <tr key={i.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>{i.drug_name}</div>
                    <div style={{ fontSize: 11, color: '#64748b', fontFamily: 'monospace' }}>{'ITM-' + String(i.id).padStart(3,'0')}</div>
                  </td>
                  <td style={{ padding: '12px 14px', color: '#475569' }}>{i.category || '—'}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{ padding: '4px 8px', borderRadius: 6, fontWeight: 700, background: statusBg, color: statusColor }}>
                      {q.toLocaleString()}
                    </span>
                  </td>
                  <td style={{ padding: '12px 14px', color: '#64748b' }}>{ml.toLocaleString()}</td>
                  <td style={{ padding: '12px 14px', fontFamily: 'monospace' }}>ETB {Number(i.unit_price).toFixed(2)}</td>
                  <td style={{ padding: '12px 14px', fontWeight: 600, fontFamily: 'monospace', color: '#0f172a' }}>ETB {(q * Number(i.unit_price)).toFixed(2)}</td>
                  <td style={{ padding: '12px 14px', color: '#475569' }}>{i.storage_location || '—'}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ fontFamily: 'monospace', color: '#475569' }}>{i.batch_no || '—'}</div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>Exp: {i.expiry_date || 'N/A'}</div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && <tr><td colSpan={8} style={{ padding: 24, textAlign: 'center', color: '#94a3b8' }}>No items found</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StoreStockReport;
