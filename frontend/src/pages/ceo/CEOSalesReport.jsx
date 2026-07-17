import React, { useState, useEffect } from 'react';
import { receiveNotification, triggerNotification } from '../../utils/ceoNotifications';
import { TrendingUp, Download, Printer, Filter } from 'lucide-react';

const CEOSalesReport = () => {
  const [dateRange, setDateRange] = useState('Month');
  const [filterDept, setFilterDept] = useState('All');
  const [filterBranch, setFilterBranch] = useState('All');
  const [filterPayment, setFilterPayment] = useState('All');

  useEffect(() => {
    receiveNotification('Sales Report', `💳 Sales Report Ready - Total: $1,245,000`);
    // eslint-disable-next-line
  }, [dateRange, filterDept, filterBranch, filterPayment]);

  const handleExport = () => triggerNotification('Export Started', 'Exporting Sales Report as PDF...');
  const handlePrint = () => {
    triggerNotification('Print Job Started', 'Sending Sales Report to printer...');
    window.print();
  };

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }} className="no-print">
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <TrendingUp color="#3b82f6" size={28}/> SALES REPORT
          </h1>
          <p style={{ color: '#64748b', margin: 0 }}>Comprehensive Sales Analytics and CRV Tracking</p>
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

      {/* FILTERS */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 24, background: 'white', padding: 16, borderRadius: 8, border: '1px solid #e2e8f0' }} className="no-print">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Filter size={16} color="#64748b"/> <span style={{ fontWeight: 'bold', fontSize: 14 }}>Filters:</span>
        </div>
        <div style={{ display: 'flex', gap: 4, background: '#f1f5f9', padding: 4, borderRadius: 6 }}>
          {['Today', 'Week', 'Month', 'Year'].map(range => (
            <button key={range} onClick={() => setDateRange(range)} style={{ padding: '6px 16px', borderRadius: 4, border: 'none', background: dateRange === range ? '#3b82f6' : 'transparent', color: dateRange === range ? 'white' : '#475569', cursor: 'pointer', fontWeight: 'bold' }}>
              {range}
            </button>
          ))}
        </div>
        <select value={filterDept} onChange={e => setFilterDept(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6 }}>
          <option value="All">All Departments</option>
          <option value="Pharmacy">Pharmacy</option>
          <option value="Car Rental">Car Rental</option>
          <option value="Agri Rental">Agri Rental</option>
          <option value="Printing">Printing</option>
        </select>
        <select value={filterBranch} onChange={e => setFilterBranch(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6 }}>
          <option value="All">All Branches</option>
          <option value="Branch A">Branch A</option>
          <option value="Branch B">Branch B</option>
          <option value="Branch C">Branch C</option>
        </select>
        <select value={filterPayment} onChange={e => setFilterPayment(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6 }}>
          <option value="All">All Payment Methods</option>
          <option value="Cash">Cash</option>
          <option value="Bank">Bank Transfer</option>
          <option value="Telebirr">Telebirr</option>
        </select>
      </div>

      {/* CORE SALES METRICS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        <div style={{ background: '#eff6ff', padding: 20, borderRadius: 8, border: '1px solid #bfdbfe' }}>
          <div style={{ fontSize: 13, color: '#1e40af', fontWeight: 'bold' }}>Total Sales ({dateRange})</div>
          <div style={{ fontSize: 32, fontWeight: 'bold', color: '#1d4ed8', marginTop: 8 }}>$1,245,000</div>
        </div>
        <div style={{ background: '#f0fdf4', padding: 20, borderRadius: 8, border: '1px solid #bbf7d0' }}>
          <div style={{ fontSize: 13, color: '#166534', fontWeight: 'bold' }}>Sales Growth Rate</div>
          <div style={{ fontSize: 32, fontWeight: 'bold', color: '#15803d', marginTop: 8 }}>+14.5%</div>
        </div>
        <div style={{ background: 'white', padding: 20, borderRadius: 8, border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: 13, color: '#64748b', fontWeight: 'bold' }}>Average Transaction Value</div>
          <div style={{ fontSize: 32, fontWeight: 'bold', color: '#0f172a', marginTop: 8 }}>$185</div>
        </div>
        <div style={{ background: 'white', padding: 20, borderRadius: 8, border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: 13, color: '#64748b', fontWeight: 'bold' }}>Sales Trends</div>
          <div style={{ fontSize: 32, fontWeight: 'bold', color: '#0f172a', marginTop: 8 }}>Increasing 📈</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 24, marginBottom: 24 }}>
        {/* SALES BY DEPARTMENT */}
        <div style={{ background: 'white', padding: 20, borderRadius: 8, border: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: 16, color: '#0f172a' }}>Top 5 Selling Departments</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { n: 'Pharmacy Sales', v: 800000, p: 64 },
              { n: 'Car Rental Sales', v: 200000, p: 16 },
              { n: 'Agri Rental Sales', v: 145000, p: 12 },
              { n: 'Printing Sales', v: 100000, p: 8 },
              { n: 'Other', v: 0, p: 0 }
            ].map((i, idx) => (
              <div key={i.n}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 14, fontWeight: 'bold' }}>
                  <span>#{idx+1} {i.n}</span>
                  <span>ETB {i.v.toLocaleString()} ({i.p}%)</span>
                </div>
                <div style={{ width: '100%', background: '#e2e8f0', borderRadius: 4, height: 8 }}>
                  <div style={{ width: `${i.p}%`, background: '#3b82f6', height: '100%', borderRadius: 4 }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SALES BY BRANCH */}
        <div style={{ background: 'white', padding: 20, borderRadius: 8, border: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: 16, color: '#0f172a' }}>Sales by Branch</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { n: 'Branch A (Main HQ)', v: 750000, p: 60 },
              { n: 'Branch B (North)', v: 350000, p: 28 },
              { n: 'Branch C (South)', v: 145000, p: 12 },
            ].map((i, idx) => (
              <div key={i.n}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 14, fontWeight: 'bold' }}>
                  <span>{i.n}</span>
                  <span>ETB {i.v.toLocaleString()} ({i.p}%)</span>
                </div>
                <div style={{ width: '100%', background: '#e2e8f0', borderRadius: 4, height: 8 }}>
                  <div style={{ width: `${i.p}%`, background: '#f59e0b', height: '100%', borderRadius: 4 }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* PAYMENT METHOD BREAKDOWN */}
        <div style={{ background: 'white', padding: 20, borderRadius: 8, border: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: 16, color: '#0f172a' }}>Payment Method Breakdown</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { n: 'Bank Transfer', v: 700000, p: 56 },
              { n: 'Cash', v: 300000, p: 24 },
              { n: 'Telebirr', v: 245000, p: 20 },
            ].map((i, idx) => (
              <div key={i.n}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 14, fontWeight: 'bold' }}>
                  <span>{i.n}</span>
                  <span>ETB {i.v.toLocaleString()} ({i.p}%)</span>
                </div>
                <div style={{ width: '100%', background: '#e2e8f0', borderRadius: 4, height: 8 }}>
                  <div style={{ width: `${i.p}%`, background: '#8b5cf6', height: '100%', borderRadius: 4 }}></div>
                </div>
              </div>
            ))}
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
                <td style={{ padding: 12, color: '#3b82f6', fontWeight: 'bold' }}>ETB {p.rev.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
};

export default CEOSalesReport;
