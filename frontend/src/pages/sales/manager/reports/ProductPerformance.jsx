import React, { useState, useEffect } from 'react';
import { salesState } from '../../../../utils/salesManagerState';
import CurrencyDisplay from '../../components/CurrencyDisplay';
import { Download, AlertTriangle, AlertCircle } from 'lucide-react';

const ProductPerformance = () => {
  const [data, setData] = useState(null);
  
  // Filters
  const [dateFrom, setDateFrom] = useState(new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0]);
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState('');
  const [department, setDepartment] = useState('');

  const loadReport = () => {
    const result = salesState.generateReport({
      dateFrom, dateTo, productCategory: category, department,
      granularity: 'month',
      groupBy: ['product']
    });

    const products = result.groupings.product;
    
    // Low performers threshold: simple demo definition -> bottom 25% by revenue of sold products
    // Note: Excludes products with 0 sales since they don't appear in the lines array.
    const sortedByRevenue = [...products].sort((a, b) => a.revenue - b.revenue);
    const lowPerfThreshold = sortedByRevenue.length > 4 ? sortedByRevenue[Math.floor(sortedByRevenue.length / 4)].revenue : 0;
    
    result.advanced = {
        topByRevenue: [...products].sort((a, b) => b.revenue - a.revenue).slice(0, 10),
        topByQty: [...products].sort((a, b) => b.qty - a.qty).slice(0, 10),
        lowPerformers: sortedByRevenue.filter(p => p.revenue <= lowPerfThreshold)
    };
      
    setData(result);
    salesState.notify('PRODUCT_PERFORMANCE');
  };

  useEffect(() => {
    loadReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateFrom, dateTo, category, department]);

  const handleReorder = (productId) => {
      salesState.notify('INFO'); // Simulates reorder request sent
      console.log("Reorder request created for", productId);
  };
  
  const handleDiscontinue = (productId) => {
      salesState.notify('INFO'); // Simulates discontinue
      console.log("Discontinued product", productId);
  };

  if (!data) return <div>Loading...</div>;

  return (
    <div style={{ padding: '24px', backgroundColor: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#0f172a', margin: '0 0 8px 0' }}>Product Performance</h1>
          <p style={{ color: '#64748b', margin: 0 }}>Sales volume, margins, and inventory movement.</p>
        </div>
        <button style={{ padding: '10px 16px', backgroundColor: 'white', color: '#475569', border: '1px solid #cbd5e1', borderRadius: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Download size={16} /> Export PDF
        </button>
      </div>

      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', backgroundColor: 'white', padding: '16px', borderRadius: 0, border: '1px solid #e2e8f0' }}>
        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={inputStyle} />
        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={inputStyle} />
        <select value={department} onChange={e => setDepartment(e.target.value)} style={inputStyle}>
            <option value="">All Departments</option>
            <option value="printing">Printing</option>
            <option value="pharmacy">Pharmacy</option>
        </select>
        <select value={category} onChange={e => setCategory(e.target.value)} style={inputStyle}>
            <option value="">All Categories</option>
            <option value="Furniture">Furniture</option>
            <option value="Electronics">Electronics</option>
        </select>
      </div>
      
      {data.metrics.missingCostFlags && (
          <div style={{ padding: '12px 16px', backgroundColor: '#fffbeb', border: '1px solid #fde68a', color: '#b45309', borderRadius: 0, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={20} />
              Some products sold in this period are missing Cost Price data. Profit totals exclude these products to prevent false margins.
          </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <StatCard title="Revenue (Filtered)" value={<CurrencyDisplay amountCents={data.metrics.totalSalesCents} />} />
        <StatCard title="Gross Profit" value={<CurrencyDisplay amountCents={(data.metrics.grossMarginPct / 100) * data.metrics.totalSalesCents} />} />
        <StatCard title="Average Margin" value={`${data.metrics.grossMarginPct.toFixed(1)}%`} color={data.metrics.grossMarginPct > 30 ? '#10b981' : '#f59e0b'} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
        <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: 0, border: '1px solid #e2e8f0' }}>
            <h3 style={{ margin: '0 0 16px 0', color: '#1e293b' }}>Top 10 by Revenue</h3>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                {data.advanced.topByRevenue.map((p, i) => (
                    <li key={p.key} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < data.advanced.topByRevenue.length - 1 ? '1px solid #f1f5f9' : 'none', fontSize: '14px' }}>
                        <span style={{ color: '#334155' }}>{p.name}</span>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontWeight: '600' }}><CurrencyDisplay amountCents={p.revenue} /></div>
                            <div style={{ fontSize: '12px', color: '#64748b' }}>Qty: {p.qty}</div>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
        
        <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: 0, border: '1px solid #e2e8f0' }}>
            <h3 style={{ margin: '0 0 16px 0', color: '#1e293b' }}>Low Performers (Bottom Quartile)</h3>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                {data.advanced.lowPerformers.map((p, i) => (
                    <li key={p.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: i < data.advanced.lowPerformers.length - 1 ? '1px solid #f1f5f9' : 'none', fontSize: '14px' }}>
                        <div>
                            <div style={{ color: '#334155', fontWeight: '500' }}>{p.name}</div>
                            <div style={{ color: '#64748b', fontSize: '12px' }}>Rev: {p.revenue/100}</div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button onClick={() => handleReorder(p.key)} style={{ padding: '6px 12px', backgroundColor: '#f1f5f9', color: '#475569', border: 'none', borderRadius: 0, fontSize: '12px', cursor: 'pointer' }}>Reorder</button>
                            <button onClick={() => handleDiscontinue(p.key)} style={{ padding: '6px 12px', backgroundColor: '#fef2f2', color: '#ef4444', border: 'none', borderRadius: 0, fontSize: '12px', cursor: 'pointer' }}>Discontinue</button>
                        </div>
                    </li>
                ))}
                {data.advanced.lowPerformers.length === 0 && <li style={{ color: '#94a3b8' }}>No low performers found.</li>}
            </ul>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, color = '#0f172a' }) => (
  <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: 0, border: '1px solid #e2e8f0' }}>
    <h3 style={{ fontSize: '14px', color: '#64748b', margin: '0 0 8px 0', fontWeight: '500' }}>{title}</h3>
    <div style={{ fontSize: '24px', fontWeight: '700', color }}>{value}</div>
  </div>
);

const inputStyle = { padding: '8px 12px', borderRadius: 0, border: '1px solid #cbd5e1' };

export default ProductPerformance;
