import React, { useState, useEffect } from 'react';
import { receiveNotification, triggerNotification } from '../../utils/ceoNotifications';
import { Users, Download, Printer, Filter } from 'lucide-react';

const CEOHRReport = () => {
  const [dateRange, setDateRange] = useState('Month');
  const [filterDept, setFilterDept] = useState('All');

  useEffect(() => {
    receiveNotification('HR Report', `👥 HR Report Ready - Total Employees: 14`);
    // eslint-disable-next-line
  }, [dateRange, filterDept]);

  const handleExport = () => triggerNotification('Export Started', 'Exporting HR Report as PDF...');
  const handlePrint = () => {
    triggerNotification('Print Job Started', 'Sending HR Report to printer...');
    window.print();
  };

  const departments = [
    { n: 'Pharmacy', c: 3 },
    { n: 'Store', c: 1 },
    { n: 'Sales', c: 2 },
    { n: 'Purchase', c: 1 },
    { n: 'HR', c: 1 },
    { n: 'Finance', c: 2 },
    { n: 'Printing', c: 1 },
    { n: 'Car Rental', c: 1 },
    { n: 'Agri Rental', c: 1 },
    { n: 'Tender', c: 1 }
  ];

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }} className="no-print">
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Users color="#ec4899" size={28}/> HR & STAFFING REPORT
          </h1>
          <p style={{ color: '#64748b', margin: 0 }}>Workforce Analytics, Payroll, and Attendance</p>
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
          {['Week', 'Month', 'Quarter', 'Year'].map(range => (
            <button key={range} onClick={() => setDateRange(range)} style={{ padding: '6px 16px', borderRadius: 4, border: 'none', background: dateRange === range ? '#ec4899' : 'transparent', color: dateRange === range ? 'white' : '#475569', cursor: 'pointer', fontWeight: 'bold' }}>
              {range}
            </button>
          ))}
        </div>
        <select value={filterDept} onChange={e => setFilterDept(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6 }}>
          <option value="All">All 10 Departments</option>
          {departments.map(d => <option key={d.n} value={d.n}>{d.n}</option>)}
        </select>
      </div>

      {/* CORE HR METRICS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        <div style={{ background: '#fdf2f8', padding: 20, borderRadius: 8, border: '1px solid #fbcfe8' }}>
          <div style={{ fontSize: 13, color: '#be185d', fontWeight: 'bold' }}>Total Employees</div>
          <div style={{ fontSize: 32, fontWeight: 'bold', color: '#be185d', marginTop: 8 }}>14</div>
        </div>
        <div style={{ background: 'white', padding: 20, borderRadius: 8, border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: 13, color: '#64748b', fontWeight: 'bold' }}>Avg. Attendance Rate</div>
          <div style={{ fontSize: 32, fontWeight: 'bold', color: '#0f172a', marginTop: 8 }}>96.5%</div>
        </div>
        <div style={{ background: 'white', padding: 20, borderRadius: 8, border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: 13, color: '#64748b', fontWeight: 'bold' }}>Staff Turnover Rate</div>
          <div style={{ fontSize: 32, fontWeight: 'bold', color: '#0f172a', marginTop: 8 }}>0.0%</div>
        </div>
        <div style={{ background: '#f0fdf4', padding: 20, borderRadius: 8, border: '1px solid #bbf7d0' }}>
          <div style={{ fontSize: 13, color: '#166534', fontWeight: 'bold' }}>Total Payroll ({dateRange})</div>
          <div style={{ fontSize: 32, fontWeight: 'bold', color: '#15803d', marginTop: 8 }}>ETB 220,000</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
        {/* EMPLOYEES BY DEPARTMENT */}
        <div style={{ background: 'white', padding: 20, borderRadius: 8, border: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: 16, color: '#0f172a' }}>Employees by Department</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            {departments.map(d => (
              <div key={d.n} style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: 6, border: '1px solid #e2e8f0', flex: '1 1 calc(50% - 12px)', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 'bold', color: '#475569' }}>{d.n}</span>
                <span style={{ fontWeight: 'bold', color: '#ec4899', fontSize: 16 }}>{d.c} Staff</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          {/* LEAVE REQUESTS */}
          <div style={{ background: 'white', padding: 20, borderRadius: 8, border: '1px solid #e2e8f0', marginBottom: 24 }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: 16, color: '#0f172a' }}>Leave Requests Summary</h3>
            <div style={{ display: 'flex', gap: 16 }}>
              <div style={{ flex: 1, background: '#fef3c7', padding: 16, borderRadius: 6, textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 'bold', color: '#b45309' }}>2</div>
                <div style={{ fontSize: 12, fontWeight: 'bold', color: '#92400e', marginTop: 4 }}>Pending</div>
              </div>
              <div style={{ flex: 1, background: '#dcfce7', padding: 16, borderRadius: 6, textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 'bold', color: '#15803d' }}>5</div>
                <div style={{ fontSize: 12, fontWeight: 'bold', color: '#166534', marginTop: 4 }}>Approved</div>
              </div>
              <div style={{ flex: 1, background: '#fee2e2', padding: 16, borderRadius: 6, textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 'bold', color: '#b91c1c' }}>1</div>
                <div style={{ fontSize: 12, fontWeight: 'bold', color: '#991b1b', marginTop: 4 }}>Rejected</div>
              </div>
            </div>
          </div>

          {/* STAFF PERFORMANCE */}
          <div style={{ background: 'white', padding: 20, borderRadius: 8, border: '1px solid #e2e8f0' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: 16, color: '#0f172a' }}>Staff Performance Overview</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 14 }}>
              <tbody>
                <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px 0', color: '#64748b' }}>Exceeding Expectations</td>
                  <td style={{ padding: '12px 0', textAlign: 'right', fontWeight: 'bold', color: '#166534' }}>4 Employees (28%)</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px 0', color: '#64748b' }}>Meeting Expectations</td>
                  <td style={{ padding: '12px 0', textAlign: 'right', fontWeight: 'bold', color: '#0f172a' }}>9 Employees (64%)</td>
                </tr>
                <tr>
                  <td style={{ padding: '12px 0', color: '#64748b' }}>Needs Improvement</td>
                  <td style={{ padding: '12px 0', textAlign: 'right', fontWeight: 'bold', color: '#b45309' }}>1 Employee (8%)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  );
};

export default CEOHRReport;
