import React, { useState, useEffect } from 'react';
import { receiveNotification, triggerNotification } from '../../utils/ceoNotifications';
import { BarChart2, Download, Printer, Filter } from 'lucide-react';

const CEOExecutiveReport = () => {
  const [dateRange, setDateRange] = useState('Month');

  useEffect(() => {
    receiveNotification('Executive Report', `📊 Executive Report Ready - Period: ${dateRange}`);
    // eslint-disable-next-line
  }, [dateRange]);

  const handleExport = () => triggerNotification('Export Started', 'Exporting Executive Report as PDF...');
  const handlePrint = () => {
    triggerNotification('Print Job Started', 'Sending Executive Report to printer...');
    window.print();
  };

  const departments = ['Pharmacy', 'Store', 'Sales', 'Purchase', 'HR', 'Finance', 'Printing', 'Car Rental', 'Agri Rental', 'Procurement'];

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }} className="no-print">
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <BarChart2 color="#3b82f6" size={28}/> EXECUTIVE SUMMARY REPORT
          </h1>
          <p style={{ color: '#64748b', margin: 0 }}>Full Business Overview for CEO & Board</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={handlePrint} style={{ padding: '8px 16px', background: 'white', border: '1px solid #cbd5e1', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <Printer size={16}/> Print
          </button>
          <button onClick={handleExport} style={{ padding: '8px 16px', background: '#0f172a', color: 'white', border: 'none', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <Download size={16}/> Export PDF
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 16, marginBottom: 24, background: 'white', padding: 16, borderRadius: 8, border: '1px solid #e2e8f0' }} className="no-print">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Filter size={16} color="#64748b"/> <span style={{ fontWeight: 'bold', fontSize: 14 }}>Date Range:</span>
        </div>
        {['Today', 'Week', 'Month', 'Quarter', 'Year'].map(range => (
          <button key={range} onClick={() => setDateRange(range)} style={{ padding: '6px 16px', borderRadius: 20, border: dateRange === range ? 'none' : '1px solid #cbd5e1', background: dateRange === range ? '#3b82f6' : 'transparent', color: dateRange === range ? 'white' : '#475569', cursor: 'pointer', fontWeight: 'bold' }}>
            {range}
          </button>
        ))}
      </div>

      {/* KPI METRICS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16, marginBottom: 24 }}>
        <div style={{ background: 'white', padding: 20, borderRadius: 8, border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: 13, color: '#64748b', fontWeight: 'bold' }}>Total Revenue ({dateRange})</div>
          <div style={{ fontSize: 24, fontWeight: 'bold', color: '#0f172a', marginTop: 8 }}>$1,245,000</div>
        </div>
        <div style={{ background: 'white', padding: 20, borderRadius: 8, border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: 13, color: '#64748b', fontWeight: 'bold' }}>Total Expenses</div>
          <div style={{ fontSize: 24, fontWeight: 'bold', color: '#ef4444', marginTop: 8 }}>$890,500</div>
        </div>
        <div style={{ background: '#dcfce7', padding: 20, borderRadius: 8, border: '1px solid #bbf7d0' }}>
          <div style={{ fontSize: 13, color: '#166534', fontWeight: 'bold' }}>Net Profit / Loss</div>
          <div style={{ fontSize: 24, fontWeight: 'bold', color: '#15803d', marginTop: 8 }}>+$354,500 🟢</div>
        </div>
        <div style={{ background: 'white', padding: 20, borderRadius: 8, border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: 13, color: '#64748b', fontWeight: 'bold' }}>Total Inventory Value</div>
          <div style={{ fontSize: 24, fontWeight: 'bold', color: '#0f172a', marginTop: 8 }}>$3,100,200</div>
        </div>
        <div style={{ background: 'white', padding: 20, borderRadius: 8, border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: 13, color: '#64748b', fontWeight: 'bold' }}>Total Employees</div>
          <div style={{ fontSize: 24, fontWeight: 'bold', color: '#3b82f6', marginTop: 8 }}>14</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
        {/* DEPARTMENT PERFORMANCE */}
        <div style={{ background: 'white', padding: 20, borderRadius: 8, border: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: 16 }}>Department Performance (All 10)</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 14 }}>
            <tbody>
              {departments.map((dept, idx) => (
                <tr key={dept} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px 0', fontWeight: 'bold' }}>{dept}</td>
                  <td style={{ padding: '12px 0', color: idx < 5 ? '#166534' : '#64748b' }}>{idx < 5 ? 'Overperforming ↑' : 'On Target -'}</td>
                  <td style={{ padding: '12px 0', textAlign: 'right', fontWeight: 'bold' }}>${(Math.random() * 100000 + 50000).toFixed(0).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div>
          {/* TOP 5 DEPARTMENTS */}
          <div style={{ background: 'white', padding: 20, borderRadius: 8, border: '1px solid #e2e8f0', marginBottom: 24 }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: 16 }}>Top 5 Performing Departments</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {['Pharmacy', 'Car Rental', 'Agri Rental', 'Printing', 'Sales'].map((dept, i) => (
                <div key={dept} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 12, background: '#f8fafc', borderRadius: 6 }}>
                  <span style={{ fontWeight: 'bold' }}>#{i+1} {dept}</span>
                  <span style={{ color: '#166534', fontWeight: 'bold' }}>+12% Growth</span>
                </div>
              ))}
            </div>
          </div>

          {/* SYSTEM STATUS */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ background: '#fef3c7', padding: 20, borderRadius: 8, border: '1px solid #fde68a' }}>
              <div style={{ fontSize: 13, color: '#92400e', fontWeight: 'bold' }}>Pending Approvals</div>
              <div style={{ fontSize: 32, fontWeight: 'bold', color: '#b45309', marginTop: 8 }}>18</div>
            </div>
            <div style={{ background: '#e0e7ff', padding: 20, borderRadius: 8, border: '1px solid #c7d2fe' }}>
              <div style={{ fontSize: 13, color: '#3730a3', fontWeight: 'bold' }}>Audit Status</div>
              <div style={{ fontSize: 20, fontWeight: 'bold', color: '#4338ca', marginTop: 8 }}>In Progress 🔄</div>
            </div>
          </div>
        </div>
      </div>

      {/* TOP 10 SELLING PRODUCTS */}
      <div style={{ background: 'white', padding: 20, borderRadius: 8, border: '1px solid #e2e8f0' }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: 16 }}>Top 10 Selling Products / Services</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 14 }}>
          <thead style={{ background: '#f8fafc' }}>
            <tr>
              <th style={{ padding: 12 }}>Rank</th>
              <th style={{ padding: 12 }}>Product / Service Name</th>
              <th style={{ padding: 12 }}>Department</th>
              <th style={{ padding: 12 }}>Units Sold</th>
              <th style={{ padding: 12 }}>Total Revenue</th>
            </tr>
          </thead>
          <tbody>
            {[
              { name: 'Amoxicillin 500mg', dept: 'Pharmacy', qty: 1500, rev: 45000 },
              { name: 'Ambulance Transport', dept: 'Car Rental', qty: 45, rev: 38000 },
              { name: 'Tractor Model X', dept: 'Agri Rental', qty: 12, rev: 35000 },
              { name: 'Custom Banner Print', dept: 'Printing', qty: 120, rev: 24000 },
              { name: 'Paracetamol', dept: 'Pharmacy', qty: 3000, rev: 15000 },
              { name: 'Executive Van Rental', dept: 'Car Rental', qty: 15, rev: 12000 },
              { name: 'Harvester Rental', dept: 'Agri Rental', qty: 5, rev: 11000 },
              { name: 'A4 Paper Reams', dept: 'Store', qty: 500, rev: 10000 },
              { name: 'Flyer Printing 10k', dept: 'Printing', qty: 25, rev: 8000 },
              { name: 'Surgical Masks', dept: 'Pharmacy', qty: 5000, rev: 7500 },
            ].map((p, i) => (
              <tr key={p.name} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: 12, fontWeight: 'bold', color: '#64748b' }}>#{i+1}</td>
                <td style={{ padding: 12, fontWeight: 'bold' }}>{p.name}</td>
                <td style={{ padding: 12 }}>{p.dept}</td>
                <td style={{ padding: 12 }}>{p.qty.toLocaleString()}</td>
                <td style={{ padding: 12, color: '#166534', fontWeight: 'bold' }}>${p.rev.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CEOExecutiveReport;
