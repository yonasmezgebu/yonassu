import React, { useState, useEffect } from 'react';
import { receiveNotification, triggerNotification } from '../../utils/ceoNotifications';
import { Package, Download, Printer, Filter, AlertTriangle } from 'lucide-react';

const CEOInventoryReportFull = () => {
  const [filterDept, setFilterDept] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterExpiry, setFilterExpiry] = useState('All');

  useEffect(() => {
    receiveNotification('Inventory Report', `📦 Inventory Report Ready - Total Value: $3,100,200`);
    // eslint-disable-next-line
  }, [filterDept, filterStatus, filterExpiry]);

  const handleExport = () => triggerNotification('Export Started', 'Exporting Inventory Report as PDF...');
  const handlePrint = () => {
    triggerNotification('Print Job Started', 'Sending Inventory Report to printer...');
    window.print();
  };

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }} className="no-print">
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Package color="#f59e0b" size={28}/> FULL INVENTORY REPORT
          </h1>
          <p style={{ color: '#64748b', margin: 0 }}>Comprehensive Stock, Value, and Alert Tracking (M19 + M22)</p>
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
        <select value={filterDept} onChange={e => setFilterDept(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6 }}>
          <option value="All">All Departments</option>
          <option value="Pharmacy Stock">Pharmacy Stock</option>
          <option value="Store Stock">Store Stock</option>
          <option value="Car Rental Fleet">Car Rental Fleet</option>
          <option value="Agri Rental Equipment">Agri Rental Equipment</option>
          <option value="Printing Materials">Printing Materials</option>
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6 }}>
          <option value="All">All Stock Status</option>
          <option value="In Stock">In Stock</option>
          <option value="Low Stock">Low Stock</option>
          <option value="Out of Stock">Out of Stock</option>
        </select>
        <select value={filterExpiry} onChange={e => setFilterExpiry(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6 }}>
          <option value="All">All Expiry Dates</option>
          <option value="< 30 days">Expires &lt; 30 days</option>
          <option value="< 90 days">Expires &lt; 90 days</option>
          <option value="Expired">Already Expired</option>
        </select>
      </div>

      {/* CORE INVENTORY METRICS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        <div style={{ background: '#fef3c7', padding: 20, borderRadius: 8, border: '1px solid #fde68a' }}>
          <div style={{ fontSize: 13, color: '#92400e', fontWeight: 'bold' }}>Total Inventory Value</div>
          <div style={{ fontSize: 32, fontWeight: 'bold', color: '#b45309', marginTop: 8 }}>$3,100,200</div>
        </div>
        <div style={{ background: 'white', padding: 20, borderRadius: 8, border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: 13, color: '#64748b', fontWeight: 'bold' }}>Inventory Turnover Ratio</div>
          <div style={{ fontSize: 32, fontWeight: 'bold', color: '#0f172a', marginTop: 8 }}>4.2</div>
        </div>
        <div style={{ background: '#fee2e2', padding: 20, borderRadius: 8, border: '1px solid #fecaca' }}>
          <div style={{ fontSize: 13, color: '#991b1b', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 6 }}>
            <AlertTriangle size={14}/> Low Stock Alerts
          </div>
          <div style={{ fontSize: 32, fontWeight: 'bold', color: '#b91c1c', marginTop: 8 }}>24 Items</div>
        </div>
        <div style={{ background: '#fee2e2', padding: 20, borderRadius: 8, border: '1px solid #fecaca' }}>
          <div style={{ fontSize: 13, color: '#991b1b', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 6 }}>
            <AlertTriangle size={14}/> Expiry Alerts
          </div>
          <div style={{ fontSize: 32, fontWeight: 'bold', color: '#b91c1c', marginTop: 8 }}>5 Items &lt; 30 Days</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
        {/* INVENTORY VALUE BY DEPARTMENT */}
        <div style={{ background: 'white', padding: 20, borderRadius: 8, border: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: 16, color: '#0f172a' }}>Inventory Value by Department</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { n: 'Pharmacy Stock', v: 1200000, p: 38 },
              { n: 'Car Rental Fleet', v: 900000, p: 29 },
              { n: 'Agri Rental Equipment', v: 750000, p: 24 },
              { n: 'Store Stock (HQ)', v: 150200, p: 5 },
              { n: 'Printing Materials', v: 100000, p: 4 },
            ].map((i, idx) => (
              <div key={i.n}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 14, fontWeight: 'bold' }}>
                  <span>{i.n}</span>
                  <span>${i.v.toLocaleString()} ({i.p}%)</span>
                </div>
                <div style={{ width: '100%', background: '#e2e8f0', borderRadius: 4, height: 8 }}>
                  <div style={{ width: `${i.p}%`, background: '#f59e0b', height: '100%', borderRadius: 4 }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* STOCK MOVEMENT SUMMARY */}
        <div style={{ background: 'white', padding: 20, borderRadius: 8, border: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: 16, color: '#0f172a' }}>Stock Movement Summary (Last 30 Days)</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 14 }}>
            <thead style={{ background: '#f8fafc' }}>
              <tr>
                <th style={{ padding: 12 }}>Movement Type</th>
                <th style={{ padding: 12 }}>Items Affected</th>
                <th style={{ padding: 12 }}>Total Value</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: 12, fontWeight: 'bold' }}>Incoming (M19 GRN)</td>
                <td style={{ padding: 12 }}>4,520 Units</td>
                <td style={{ padding: 12, color: '#166534', fontWeight: 'bold' }}>+$185,000</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: 12, fontWeight: 'bold' }}>Outgoing (M22 Issue)</td>
                <td style={{ padding: 12 }}>3,890 Units</td>
                <td style={{ padding: 12, color: '#991b1b', fontWeight: 'bold' }}>-$142,500</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: 12, fontWeight: 'bold' }}>Transfers (M21)</td>
                <td style={{ padding: 12 }}>850 Units</td>
                <td style={{ padding: 12, color: '#0f172a', fontWeight: 'bold' }}>$0 (Internal)</td>
              </tr>
              <tr>
                <td style={{ padding: 12, fontWeight: 'bold' }}>Expired / Damaged</td>
                <td style={{ padding: 12 }}>12 Units</td>
                <td style={{ padding: 12, color: '#991b1b', fontWeight: 'bold' }}>-$1,200</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* TOP 10 ITEMS BY VALUE */}
      <div style={{ background: 'white', padding: 20, borderRadius: 8, border: '1px solid #e2e8f0' }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: 16 }}>Top 10 Items by Value</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 14 }}>
          <thead style={{ background: '#f8fafc' }}>
            <tr>
              <th style={{ padding: 12 }}>Rank</th>
              <th style={{ padding: 12 }}>Item Name</th>
              <th style={{ padding: 12 }}>Department</th>
              <th style={{ padding: 12 }}>Quantity in Stock</th>
              <th style={{ padding: 12 }}>Unit Price</th>
              <th style={{ padding: 12 }}>Total Value</th>
            </tr>
          </thead>
          <tbody>
            {[
              { name: 'Tractor Model X', dept: 'Agri Rental Equipment', qty: 10, unit: 45000, val: 450000 },
              { name: 'Executive Transport Van', dept: 'Car Rental Fleet', qty: 5, unit: 65000, val: 325000 },
              { name: 'MRI Contrast Fluid', dept: 'Pharmacy Stock', qty: 1500, unit: 150, val: 225000 },
              { name: 'Ambulance Unit (Fully Eq)', dept: 'Car Rental Fleet', qty: 3, unit: 70000, val: 210000 },
              { name: 'Harvester Machine', dept: 'Agri Rental Equipment', qty: 2, unit: 95000, val: 190000 },
              { name: 'Insulin Pens', dept: 'Pharmacy Stock', qty: 8000, unit: 20, val: 160000 },
              { name: 'High-Speed Printer Pro', dept: 'Printing Materials', qty: 2, unit: 45000, val: 90000 },
              { name: 'Ceftriaxone Injection', dept: 'Pharmacy Stock', qty: 12000, unit: 5, val: 60000 },
              { name: 'Laptops (Admin/Store)', dept: 'Store Stock', qty: 45, unit: 1000, val: 45000 },
              { name: 'A4 Paper (Pallet)', dept: 'Printing Materials', qty: 15, unit: 2000, val: 30000 },
            ].map((p, i) => (
              <tr key={p.name} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: 12, fontWeight: 'bold', color: '#64748b' }}>#{i+1}</td>
                <td style={{ padding: 12, fontWeight: 'bold' }}>{p.name}</td>
                <td style={{ padding: 12 }}>{p.dept}</td>
                <td style={{ padding: 12 }}>{p.qty.toLocaleString()}</td>
                <td style={{ padding: 12 }}>${p.unit.toLocaleString()}</td>
                <td style={{ padding: 12, color: '#b45309', fontWeight: 'bold' }}>${p.val.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
};

export default CEOInventoryReportFull;
