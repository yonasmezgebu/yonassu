import React, { useState, useEffect } from 'react';
import { TrendingUp, Download, Printer, Filter, ArrowRightLeft, Repeat } from 'lucide-react';
import { getOverstock } from '../../utils/storeApi';

const StoreOverstockReport = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getOverstock().then(r => { setItems(r.data || []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: 24, fontFamily: "'Inter', sans-serif" }}>Loading...</div>;

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: '#9a3412' }}>
            <TrendingUp color="#f97316" size={28} /> OVERSTOCK REPORT
          </h1>
          <p style={{ color: '#64748b', margin: '4px 0 0' }}>Document Model: Excess Alert</p>
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
        </select>
      </div>
      <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#fff7ed' }}>
              {['Item Name', 'Current Qty', 'Max Level', 'Excess Qty', 'Unit Price', 'Total Excess Value', 'Actions'].map(h => (
                <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 700, color: '#9a3412', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map(i => (
              <tr key={i.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '12px 14px' }}>
                  <div style={{ fontWeight: 600, color: '#0f172a' }}>{i.name}</div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>{i.storage_location || '—'}</div>
                </td>
                <td style={{ padding: '12px 14px', fontWeight: 700, color: '#c2410c' }}>{Number(i.quantity).toLocaleString()}</td>
                <td style={{ padding: '12px 14px', color: '#64748b' }}>{Number(i.max_level || 0).toLocaleString()}</td>
                <td style={{ padding: '12px 14px', fontWeight: 700, color: '#c2410c' }}>+{Number(i.excess).toLocaleString()}</td>
                <td style={{ padding: '12px 14px', fontFamily: 'monospace', color: '#475569' }}>ETB {Number(i.unit_price).toFixed(2)}</td>
                <td style={{ padding: '12px 14px', fontWeight: 600, fontFamily: 'monospace', color: '#c2410c' }}>ETB {Number(i.excess_value).toFixed(2)}</td>
                <td style={{ padding: '12px 14px' }}>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', background: '#f8fafc', color: '#0f172a', border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                      <ArrowRightLeft size={13} /> Transfer
                    </button>
                    <button style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 10px', background: 'white', color: '#475569', border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>
                      <Repeat size={13} /> Return
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan={7} style={{ padding: 24, textAlign: 'center', color: '#94a3b8' }}>No overstock items</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StoreOverstockReport;