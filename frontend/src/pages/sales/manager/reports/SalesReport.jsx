import React, { useState, useEffect } from 'react';
import { salesState } from '../../../../utils/salesManagerState';
import CurrencyDisplay from '../../components/CurrencyDisplay';
import { Download, CalendarClock } from 'lucide-react';
// Simulating chart imports; we'd normally use recharts/chartjs here
// import { BarChart, Bar, PieChart, Pie, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';

const SalesReport = () => {
  const [data, setData] = useState(null);
  
  // Filters
  const [dateFrom, setDateFrom] = useState(new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0]);
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);
  const [department, setDepartment] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');

  const loadReport = () => {
    // Shared Aggregator used here
    const result = salesState.generateReport({
      dateFrom, dateTo, department, paymentMethod,
      granularity: 'month',
      groupBy: ['time', 'department', 'paymentMethod', 'product']
    });
    
    // Sort products by revenue and take top 10
    result.topProducts = result.groupings.product
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
      
    setData(result);
    salesState.notify('SALES_REPORT'); // Fire notification on successful load
  };

  useEffect(() => {
    loadReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateFrom, dateTo, department, paymentMethod]);

  const handleExport = () => {
    alert("Exporting PDF...");
  };

  const handleSchedule = () => {
    salesState.scheduleReport('Sales Report', 'Weekly', { dateFrom, dateTo, department, paymentMethod });
  };

  if (!data) return <div>Loading...</div>;

  return (
    <div style={{ padding: '24px', backgroundColor: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#0f172a', margin: '0 0 8px 0' }}>Sales Report</h1>
          <p style={{ color: '#64748b', margin: 0 }}>Aggregate sales performance across all branches.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={handleSchedule} style={{ padding: '10px 16px', backgroundColor: 'white', color: '#475569', border: '1px solid #cbd5e1', borderRadius: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CalendarClock size={16} /> Schedule
          </button>
          <button onClick={handleExport} style={{ padding: '10px 16px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Download size={16} /> Export PDF
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', backgroundColor: 'white', padding: '16px', borderRadius: 0, border: '1px solid #e2e8f0' }}>
        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={inputStyle} />
        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={inputStyle} />
        <select value={department} onChange={e => setDepartment(e.target.value)} style={inputStyle}>
            <option value="">All Departments</option>
            <option value="printing">Printing</option>
            <option value="pharmacy">Pharmacy</option>
            <option value="other">Other</option>
        </select>
        <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} style={inputStyle}>
            <option value="">All Payment Methods</option>
            <option value="cash">Cash</option>
            <option value="credit">Credit</option>
            <option value="bank">Bank</option>
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <StatCard title="Total Sales" value={<CurrencyDisplay amountCents={data.metrics.totalSalesCents} />} />
        <StatCard title="Transaction Count" value={data.metrics.transactionCount} />
        <StatCard title="Avg Transaction" value={<CurrencyDisplay amountCents={data.metrics.averageTransactionValueCents} />} />
        <StatCard title="Growth vs Prior Period" value={data.metrics.growthPct != null ? `${data.metrics.growthPct.toFixed(1)}%` : 'N/A'} color={data.metrics.growthPct >= 0 ? '#10b981' : '#ef4444'} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: 0, border: '1px solid #e2e8f0' }}>
           <h3 style={{ margin: '0 0 16px 0', color: '#1e293b' }}>Monthly Trend</h3>
           {/* Placeholder for Recharts BarChart */}
           <div style={{ height: '300px', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
               [ BarChart rendered with data.groupings.time ]
           </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: 0, border: '1px solid #e2e8f0' }}>
                <h3 style={{ margin: '0 0 16px 0', color: '#1e293b' }}>By Department</h3>
                <div style={{ height: '200px', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                    [ PieChart rendered with data.groupings.department ]
                </div>
            </div>
            
            <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: 0, border: '1px solid #e2e8f0' }}>
                <h3 style={{ margin: '0 0 16px 0', color: '#1e293b' }}>Top Products by Revenue</h3>
                <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                    {data.topProducts.map((p, i) => (
                        <li key={p.key} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < 9 ? '1px solid #f1f5f9' : 'none', fontSize: '14px' }}>
                            <span style={{ color: '#334155' }}>{p.name}</span>
                            <span style={{ fontWeight: '600' }}><CurrencyDisplay amountCents={p.revenue} /></span>
                        </li>
                    ))}
                    {data.topProducts.length === 0 && <li style={{ color: '#94a3b8' }}>No data</li>}
                </ul>
            </div>
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

export default SalesReport;
