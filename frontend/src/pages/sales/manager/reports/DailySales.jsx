import React, { useState, useEffect } from 'react';
import { salesState } from '../../../../utils/salesManagerState';
import CurrencyDisplay from '../../components/CurrencyDisplay';
import { Download } from 'lucide-react';

const DailySales = () => {
  const [data, setData] = useState(null);
  
  const [targetCents] = useState(15000000); // Fixed for demo, normally fetched
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [department, setDepartment] = useState('');

  const loadReport = () => {
    const result = salesState.generateReport({
      dateFrom: date, dateTo: date, department,
      granularity: 'hour',
      groupBy: ['time', 'cashier']
    });
      
    setData(result);
    salesState.notify('DAILY_SALES');
  };

  useEffect(() => {
    loadReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, department]);

  if (!data) return <div>Loading...</div>;

  const achievementPct = (data.metrics.totalSalesCents / targetCents) * 100;

  return (
    <div style={{ padding: '24px', backgroundColor: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#0f172a', margin: '0 0 8px 0' }}>Daily Sales Report</h1>
          <p style={{ color: '#64748b', margin: 0 }}>Intraday performance and cashier activity.</p>
        </div>
        <button style={{ padding: '10px 16px', backgroundColor: 'white', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Download size={16} /> Export PDF
        </button>
      </div>

      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', backgroundColor: 'white', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
        <input type="date" value={date} onChange={e => setDate(e.target.value)} style={inputStyle} />
        <select value={department} onChange={e => setDepartment(e.target.value)} style={inputStyle}>
            <option value="">All Departments</option>
            <option value="printing">Printing</option>
            <option value="pharmacy">Pharmacy</option>
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <StatCard title="Daily Total" value={<CurrencyDisplay amountCents={data.metrics.totalSalesCents} />} />
        <StatCard title="Transactions" value={data.metrics.transactionCount} />
        <StatCard title="Target Achievement" value={`${achievementPct.toFixed(1)}%`} color={achievementPct >= 100 ? '#10b981' : '#f59e0b'} />
        <StatCard title="Daily Target" value={<CurrencyDisplay amountCents={targetCents} />} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
           <h3 style={{ margin: '0 0 16px 0', color: '#1e293b' }}>Hourly Breakdown</h3>
           <div style={{ height: '300px', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
               [ BarChart rendered with data.groupings.time (Hourly) ]
           </div>
        </div>

        <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ margin: '0 0 16px 0', color: '#1e293b' }}>Sales by Cashier</h3>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                {data.groupings.cashier.map((c, i) => (
                    <li key={c.key} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < data.groupings.cashier.length - 1 ? '1px solid #f1f5f9' : 'none', fontSize: '14px' }}>
                        <span style={{ color: '#334155' }}>{c.key}</span>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontWeight: '600' }}><CurrencyDisplay amountCents={c.revenue} /></div>
                            <div style={{ fontSize: '12px', color: '#64748b' }}>{c.count} txns</div>
                        </div>
                    </li>
                ))}
                {data.groupings.cashier.length === 0 && <li style={{ color: '#94a3b8' }}>No data</li>}
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

export default DailySales;
