import React, { useState, useEffect } from 'react';
import { salesState } from '../../../../utils/salesManagerState';
import CurrencyDisplay from '../../components/CurrencyDisplay';
import { Download } from 'lucide-react';

const MonthlySales = () => {
  const [data, setData] = useState(null);
  
  const [month, setMonth] = useState(new Date().toISOString().substring(0, 7)); // YYYY-MM
  const [department, setDepartment] = useState('');

  const loadReport = () => {
    // Calculate start and end of month
    const [year, monthStr] = month.split('-');
    const dateFrom = new Date(year, parseInt(monthStr) - 1, 1).toISOString().split('T')[0];
    const dateTo = new Date(year, parseInt(monthStr), 0).toISOString().split('T')[0];
    const daysInMonth = new Date(year, parseInt(monthStr), 0).getDate();

    const result = salesState.generateReport({
      dateFrom, dateTo, department,
      granularity: 'month',
      groupBy: ['time', 'department', 'customer', 'product']
    });
    
    // Sort customers and products
    result.topCustomers = result.groupings.customer.sort((a, b) => b.revenue - a.revenue).slice(0, 10);
    result.topProducts = result.groupings.product.sort((a, b) => b.revenue - a.revenue).slice(0, 10);
    result.dailyAverage = result.metrics.totalSalesCents / daysInMonth;

    setData(result);
    salesState.notify('MONTHLY_SALES');
  };

  useEffect(() => {
    loadReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month, department]);

  if (!data) return <div>Loading...</div>;

  return (
    <div style={{ padding: '24px', backgroundColor: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#0f172a', margin: '0 0 8px 0' }}>Monthly Sales Report</h1>
          <p style={{ color: '#64748b', margin: 0 }}>Monthly performance summary and MoM growth.</p>
        </div>
        <button style={{ padding: '10px 16px', backgroundColor: 'white', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Download size={16} /> Export PDF
        </button>
      </div>

      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', backgroundColor: 'white', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
        <input type="month" value={month} onChange={e => setMonth(e.target.value)} style={inputStyle} />
        <select value={department} onChange={e => setDepartment(e.target.value)} style={inputStyle}>
            <option value="">All Departments</option>
            <option value="printing">Printing</option>
            <option value="pharmacy">Pharmacy</option>
            <option value="other">Other</option>
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <StatCard title="Monthly Total" value={<CurrencyDisplay amountCents={data.metrics.totalSalesCents} />} />
        <StatCard title="Transactions" value={data.metrics.transactionCount} />
        <StatCard title="Avg Transaction" value={<CurrencyDisplay amountCents={data.metrics.averageTransactionValueCents} />} />
        <StatCard title="Daily Avg" value={<CurrencyDisplay amountCents={data.dailyAverage} />} />
        <StatCard title="MoM Growth" value={data.metrics.growthPct != null ? `${data.metrics.growthPct.toFixed(1)}%` : 'N/A'} color={data.metrics.growthPct >= 0 ? '#10b981' : '#ef4444'} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
        <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ margin: '0 0 16px 0', color: '#1e293b' }}>Top Customers</h3>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                {data.topCustomers.map((c, i) => (
                    <li key={c.key} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < data.topCustomers.length - 1 ? '1px solid #f1f5f9' : 'none', fontSize: '14px' }}>
                        <span style={{ color: '#334155' }}>{c.name || 'Unknown'}</span>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontWeight: '600' }}><CurrencyDisplay amountCents={c.revenue} /></div>
                            <div style={{ fontSize: '12px', color: '#64748b' }}>{c.count} txns</div>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
        <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ margin: '0 0 16px 0', color: '#1e293b' }}>Top Products</h3>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                {data.topProducts.map((p, i) => (
                    <li key={p.key} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < data.topProducts.length - 1 ? '1px solid #f1f5f9' : 'none', fontSize: '14px' }}>
                        <span style={{ color: '#334155' }}>{p.name}</span>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontWeight: '600' }}><CurrencyDisplay amountCents={p.revenue} /></div>
                            <div style={{ fontSize: '12px', color: '#64748b' }}>Qty: {p.qty}</div>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, color = '#0f172a' }) => (
  <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
    <h3 style={{ fontSize: '14px', color: '#64748b', margin: '0 0 8px 0', fontWeight: '500' }}>{title}</h3>
    <div style={{ fontSize: '24px', fontWeight: '700', color }}>{value}</div>
  </div>
);

const inputStyle = { padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' };

export default MonthlySales;
