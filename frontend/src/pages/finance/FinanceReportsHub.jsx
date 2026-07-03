import React, { useState } from 'react';
import { FileBarChart, Link, Calendar, Mail, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { submitNotification } from '../../utils/pharmacyNotifications';

const reports = [
  { no: 4,  label: 'Cash Book',         path: '/finance/cash-book',     color: '#06b6d4', desc: 'Chronological record of all cash receipts and payments.' },
  { no: 17, label: 'General Ledger',    path: '/finance/ledger',        color: '#3b82f6', desc: 'Full T-account ledger view for all COA accounts.' },
  { no: 18, label: 'Trial Balance',     path: '/finance/trial-balance', color: '#8b5cf6', desc: 'Verifies that total debits equal total credits.' },
  { no: 20, label: 'Cash Flow',         path: '/finance/cash-flow',     color: '#0369a1', desc: 'Opening → Inflows → Outflows → Closing balance.' },
  { no: 21, label: 'Profit & Loss',     path: '/finance/profit-loss',   color: '#059669', desc: 'Revenue, COGS, Operating Expenses, Net Profit/Loss.' },
  { no: 22, label: 'Balance Sheet',     path: '/finance/balance-sheet', color: '#7c3aed', desc: 'Assets = Liabilities + Equity with balance validation.' },
  { no: 23, label: 'Income & Expense',  path: '/finance/income-expense',color: '#2563eb', desc: 'Income vs Expense breakdown with Bar, Line, and Pie charts.' },
];

const FinanceReportsHub = () => {
  const navigate = useNavigate();
  const [showBuilder, setShowBuilder] = useState(false);
  const [scheduleFreq, setScheduleFreq] = useState('Monthly');
  const [scheduleDelivery, setScheduleDelivery] = useState('In-App');
  const [builderDateFrom, setBuilderDateFrom] = useState('');
  const [builderDateTo, setBuilderDateTo] = useState('');
  const [builderDept, setBuilderDept] = useState('All');
  const [builderType, setBuilderType] = useState('Profit & Loss');
  const [scheduled, setScheduled] = useState(false);

  const handleSchedule = () => {
    setScheduled(true);
    submitNotification('📊 Financial Reports Ready', '📊 Financial Reports Hub - Click to View', 'info.mp3');
  };

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: '#0f172a' }}>
          <FileBarChart color="#3b82f6" size={28} /> FINANCIAL REPORTS HUB
        </h1>
        <p style={{ color: '#64748b', margin: '4px 0 0' }}>Central access to all 7 financial reports. Custom report builder and scheduling.</p>
      </div>

      {/* Quick Access Grid */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>Quick Access — All Reports</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {reports.map(r => (
            <div
              key={r.no}
              onClick={() => navigate(r.path)}
              style={{
                background: 'white', borderRadius: 10, border: `1px solid #e2e8f0`,
                padding: 20, cursor: 'pointer', transition: 'all 0.2s',
                borderLeft: `4px solid ${r.color}`,
              }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8' }}>Report #{r.no}</span>
                <Link size={14} color={r.color} />
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>{r.label}</div>
              <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.5 }}>{r.desc}</div>
              <div style={{ marginTop: 14, display: 'flex', gap: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: r.color, background: `${r.color}18`, padding: '3px 8px', borderRadius: 20 }}>Open →</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Custom Report Builder */}
      <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', overflow: 'hidden', marginBottom: 20 }}>
        <div
          style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', background: '#f8fafc' }}
          onClick={() => setShowBuilder(!showBuilder)}
        >
          <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>🛠 Custom Report Builder</div>
          <span style={{ fontSize: 13, color: '#3b82f6', fontWeight: 600 }}>{showBuilder ? 'Collapse ▲' : 'Expand ▼'}</span>
        </div>

        {showBuilder && (
          <div style={{ padding: 20, borderTop: '1px solid #e2e8f0' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Date From</label>
                <input type="date" value={builderDateFrom} onChange={e => setBuilderDateFrom(e.target.value)} style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Date To</label>
                <input type="date" value={builderDateTo} onChange={e => setBuilderDateTo(e.target.value)} style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Department</label>
                <select value={builderDept} onChange={e => setBuilderDept(e.target.value)} style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, boxSizing: 'border-box' }}>
                  <option>All</option><option>Pharmacy</option><option>Store</option><option>Car Rental</option><option>Admin</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Report Type</label>
                <select value={builderType} onChange={e => setBuilderType(e.target.value)} style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, boxSizing: 'border-box' }}>
                  {reports.map(r => <option key={r.no}>{r.label}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => navigate(reports.find(r => r.label === builderType)?.path || '/finance/profit-loss')} style={{ padding: '10px 20px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>
                Generate Custom Report
              </button>
              <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', background: 'white', border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer', color: '#475569' }}>
                <Download size={15} /> Export
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Schedule Recurring Reports */}
      <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', padding: 20 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Calendar size={18} /> Schedule Recurring Reports
        </div>
        {scheduled ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#166534', background: '#f0fdf4', padding: 12, borderRadius: 6 }}>
            ✅ Schedule set: <strong>{scheduleFreq}</strong> delivery via <strong>{scheduleDelivery}</strong>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Frequency</label>
              <select value={scheduleFreq} onChange={e => setScheduleFreq(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6 }}>
                <option>Daily</option><option>Weekly</option><option>Monthly</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Delivery</label>
              <select value={scheduleDelivery} onChange={e => setScheduleDelivery(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6 }}>
                <option>In-App</option><option>Email</option>
              </select>
            </div>
            <button onClick={handleSchedule} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', background: '#0f172a', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>
              <Mail size={15} /> Set Schedule
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FinanceReportsHub;
