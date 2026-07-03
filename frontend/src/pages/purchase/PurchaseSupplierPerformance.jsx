import React, { useState } from 'react';
import { BarChart2, Download } from 'lucide-react';
import { financeState } from '../../utils/financeTransactionService';
import { getSupplierPerformance } from '../../utils/purchaseTransactionService';
import { submitNotification } from '../../utils/pharmacyNotifications';

// Simple SVG bar chart
const BarChart = ({ data, colors, labels, title }) => {
  const maxVal = Math.max(...data, 1);
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: '#475569', marginBottom: 10 }}>{title}</div>
      <svg width="100%" height="120" style={{ display: 'block' }}>
        {data.map((v, i) => {
          const barH = Math.round((v / maxVal) * 90);
          const x = i * 80 + 10;
          return (
            <g key={i}>
              <rect x={x} y={110 - barH} width="50" height={barH} fill={colors[i]} rx="4" />
              <text x={x + 25} y={108 - barH} textAnchor="middle" fontSize="11" fill="#475569" fontWeight="bold">{v}%</text>
              <text x={x + 25} y={118} textAnchor="middle" fontSize="11" fill="#94a3b8">{labels[i]}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

const MetricBadge = ({ label, value, color = '#0f172a', bg = '#f1f5f9' }) => (
  <div style={{ background: bg, borderRadius: 10, padding: '16px 20px', flex: 1 }}>
    <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600, marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 'bold', color }}>{value}</div>
  </div>
);

const PurchaseSupplierPerformance = () => {
  const supplierNames = financeState.suppliers.map(s => s.name);
  const [selectedSupplier, setSelectedSupplier] = useState(supplierNames[0] || '');

  React.useEffect(() => {
    submitNotification('📊 Supplier Performance Ready', '📊 Performance Report - Click to View', 'info.mp3');
  }, []);

  const metrics = selectedSupplier ? getSupplierPerformance(selectedSupplier) : null;

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: '#0f172a' }}>
            <BarChart2 color="#8b5cf6" size={28} /> SUPPLIER PERFORMANCE
          </h1>
          <p style={{ color: '#64748b', margin: '4px 0 0' }}>Live analytics derived from PO history, M19 receiving records, and bid/quotation data.</p>
        </div>
        <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', background: 'white', border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer', color: '#475569', fontWeight: 600 }}>
          <Download size={16} /> Export Report
        </button>
      </div>

      {/* Supplier selector */}
      <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', padding: 16, marginBottom: 24, display: 'flex', gap: 16 }}>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>Select Supplier</label>
          <select value={selectedSupplier} onChange={e => setSelectedSupplier(e.target.value)} style={{ padding: '8px 16px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 14, minWidth: 280 }}>
            {supplierNames.map(n => <option key={n}>{n}</option>)}
          </select>
        </div>
      </div>

      {metrics && (
        <>
          {/* KPI Cards */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
            <MetricBadge label="Overall Rating" value={`${metrics.overallRating}%`} color={metrics.overallRating >= 75 ? '#16a34a' : '#dc2626'} bg={metrics.overallRating >= 75 ? '#f0fdf4' : '#fef2f2'} />
            <MetricBadge label="On-Time Delivery Rate" value={`${metrics.onTimeRate}%`} color="#0369a1" bg="#e0f2fe" />
            <MetricBadge label="Quality Score" value={`${metrics.qualityScore}%`} color="#7c3aed" bg="#ede9fe" />
            <MetricBadge label="Total Orders" value={metrics.totalOrders} color="#0f172a" bg="#f1f5f9" />
            <MetricBadge label="Total Spend" value={`$${metrics.totalSpend.toLocaleString()}`} color="#dc2626" bg="#fef2f2" />
            <MetricBadge label="Avg Lead Time" value={`${metrics.avgLeadTime} Days`} color="#d97706" bg="#fef3c7" />
            <MetricBadge label="Response Time" value={metrics.responseTime} color="#475569" bg="#f8fafc" />
            <MetricBadge label="Price Competitiveness" value={metrics.priceRank} color="#059669" bg="#dcfce7" />
          </div>

          {/* Charts */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ background: 'white', borderRadius: 10, border: '1px solid #e2e8f0', padding: 24 }}>
              <BarChart
                title="📦 Delivery Performance"
                data={[metrics.onTimeRate, Math.max(0, 100 - metrics.onTimeRate)]}
                colors={['#22c55e', '#ef4444']}
                labels={['On-Time', 'Late']}
              />
            </div>
            <div style={{ background: 'white', borderRadius: 10, border: '1px solid #e2e8f0', padding: 24 }}>
              <BarChart
                title="✅ Quality Performance"
                data={[metrics.qualityScore, Math.max(0, 100 - metrics.qualityScore)]}
                colors={['#6366f1', '#f97316']}
                labels={['Passed', 'Rejected']}
              />
            </div>
          </div>

          {/* Detail row */}
          <div style={{ background: 'white', borderRadius: 10, border: '1px solid #e2e8f0', padding: 24, marginTop: 16 }}>
            <h3 style={{ margin: '0 0 16px', color: '#0f172a', fontSize: 15 }}>Performance Breakdown for <strong>{selectedSupplier}</strong></h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  {['Metric', 'Value', 'Grade'].map(c => <th key={c} style={{ padding: '10px 14px', textAlign: 'left', color: '#475569', fontWeight: 600, fontSize: 13 }}>{c}</th>)}
                </tr>
              </thead>
              <tbody>
                {[
                  { m: 'On-Time Delivery Rate', v: `${metrics.onTimeRate}%`, grade: metrics.onTimeRate >= 80 ? 'A' : metrics.onTimeRate >= 60 ? 'B' : 'C' },
                  { m: 'Quality Score', v: `${metrics.qualityScore}%`, grade: metrics.qualityScore >= 90 ? 'A' : metrics.qualityScore >= 70 ? 'B' : 'C' },
                  { m: 'Price Competitiveness', v: metrics.priceRank, grade: metrics.priceRank === 'Competitive' ? 'A' : 'N/A' },
                  { m: 'Response Time', v: metrics.responseTime, grade: 'B' },
                  { m: 'Total Orders Placed', v: metrics.totalOrders, grade: '—' },
                  { m: 'Total Spend', v: `$${metrics.totalSpend.toLocaleString()}`, grade: '—' },
                  { m: 'Average Lead Time', v: `${metrics.avgLeadTime} Days`, grade: '—' },
                  { m: 'Overall Rating', v: `${metrics.overallRating}%`, grade: metrics.overallRating >= 75 ? 'A' : 'B' },
                ].map(row => (
                  <tr key={row.m} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '10px 14px', color: '#0f172a', fontWeight: 500 }}>{row.m}</td>
                    <td style={{ padding: '10px 14px', color: '#475569' }}>{row.v}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ padding: '2px 10px', borderRadius: 12, fontSize: 12, fontWeight: 700, background: row.grade === 'A' ? '#dcfce7' : row.grade === 'B' ? '#fef3c7' : row.grade === 'C' ? '#fee2e2' : '#f1f5f9', color: row.grade === 'A' ? '#16a34a' : row.grade === 'B' ? '#d97706' : row.grade === 'C' ? '#dc2626' : '#94a3b8' }}>
                        {row.grade}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default PurchaseSupplierPerformance;
