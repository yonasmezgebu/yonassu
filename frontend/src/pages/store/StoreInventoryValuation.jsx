import React, { useEffect } from 'react';
import { DollarSign, Download, Printer, Filter, PieChart } from 'lucide-react';
import { storeInfo } from '../../utils/storeNotifications';

const StoreInventoryValuation = () => {
  useEffect(() => {
    storeInfo('💰 Inventory Valuation Ready', '💰 Valuation Report', 'Your inventory valuation report has been generated.');
  }, []);

  const totalValue = 4901.50;
  const cogs = 12500.00;
  const turnoverRatio = 2.55;

  const categoryValue = [
    { cat: 'Pharmaceuticals', val: 3200.00, percent: 65 },
    { cat: 'Medical Supplies', val: 1200.00, percent: 24 },
    { cat: 'Office Supplies', val: 101.50, percent: 2 },
    { cat: 'Equipment', val: 400.00, percent: 9 },
  ];

  const locValue = [
    { loc: 'Main Store', val: 3500.00 },
    { loc: 'Branch A', val: 1000.00 },
    { loc: 'Branch B', val: 401.50 },
  ];

  const topItems = [
    { name: 'MRI Contrast Agent', cat: 'Pharmaceuticals', val: 1200.00 },
    { name: 'Surgical Gloves (L)', cat: 'Medical Supplies', val: 1000.00 },
    { name: 'Paracetamol 500mg', cat: 'Pharmaceuticals', val: 600.00 },
  ];

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: '#065f46' }}>
            <DollarSign color="#10b981" size={28} /> INVENTORY VALUATION
          </h1>
          <p style={{ color: '#64748b', margin: '4px 0 0' }}>Document Model: Valuation</p>
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

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        <div style={{ background: '#f0fdf4', padding: 20, borderRadius: 10, border: '1px solid #bbf7d0' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#166534', marginBottom: 8 }}>TOTAL INVENTORY VALUE</div>
          <div style={{ fontSize: 32, fontWeight: 'bold', color: '#15803d' }}>ETB {totalValue.toFixed(2)}</div>
        </div>
        <div style={{ background: 'white', padding: 20, borderRadius: 10, border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#475569', marginBottom: 8 }}>COST OF GOODS SOLD (COGS)</div>
          <div style={{ fontSize: 32, fontWeight: 'bold', color: '#0f172a' }}>ETB {cogs.toFixed(2)}</div>
        </div>
        <div style={{ background: 'white', padding: 20, borderRadius: 10, border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#475569', marginBottom: 8 }}>INVENTORY TURNOVER RATIO</div>
          <div style={{ fontSize: 32, fontWeight: 'bold', color: '#3b82f6' }}>{turnoverRatio}x</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20, background: 'white', padding: 16, borderRadius: 8, border: '1px solid #e2e8f0', alignItems: 'center' }}>
        <Filter size={15} color="#64748b" />
        <select style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 14 }}>
          <option>All Categories</option>
          <option>Pharmaceuticals</option>
          <option>Medical Supplies</option>
        </select>
        <select style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 14 }}>
          <option>All Locations</option>
          <option>Main Store</option>
          <option>Branch A</option>
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* Value by Category */}
        <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', padding: 20 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}><PieChart size={18} color="#64748b" /> Value by Category</h2>
          {categoryValue.map(c => (
            <div key={c.cat} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                <span style={{ fontWeight: 600, color: '#0f172a' }}>{c.cat}</span>
                <span style={{ fontFamily: 'monospace', color: '#475569' }}>ETB {c.val.toFixed(2)} ({c.percent}%)</span>
              </div>
              <div style={{ height: 8, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${c.percent}%`, background: '#10b981' }} />
              </div>
            </div>
          ))}
        </div>

        {/* Value by Location */}
        <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', padding: 20 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}><PieChart size={18} color="#64748b" /> Value by Location</h2>
          {locValue.map((l, i) => (
            <div key={l.loc} style={{ padding: '10px 0', borderBottom: i === locValue.length -1 ? 'none' : '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 500, color: '#334155' }}>{l.loc}</span>
              <span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#0f172a' }}>ETB {l.val.toFixed(2)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Top 10 Items by Value */}
      <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', padding: 20 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 16px' }}>Top Items by Value</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#f1f5f9' }}>
              <th style={{ padding: '10px 14px', textAlign: 'left', color: '#475569' }}>Rank</th>
              <th style={{ padding: '10px 14px', textAlign: 'left', color: '#475569' }}>Item Name</th>
              <th style={{ padding: '10px 14px', textAlign: 'left', color: '#475569' }}>Category</th>
              <th style={{ padding: '10px 14px', textAlign: 'right', color: '#475569' }}>Total Value</th>
            </tr>
          </thead>
          <tbody>
            {topItems.map((item, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '10px 14px', fontWeight: 700, color: '#94a3b8' }}>#{i + 1}</td>
                <td style={{ padding: '10px 14px', fontWeight: 600 }}>{item.name}</td>
                <td style={{ padding: '10px 14px', color: '#64748b' }}>{item.cat}</td>
                <td style={{ padding: '10px 14px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 600, color: '#15803d' }}>ETB {item.val.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
};

export default StoreInventoryValuation;
