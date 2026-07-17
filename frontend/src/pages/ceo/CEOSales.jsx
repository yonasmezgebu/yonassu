import React, { useState } from 'react';
import { submitNotification, receiveNotification, triggerNotification } from '../../utils/ceoNotifications';
import { DollarSign, Filter, Download, CheckCircle, XCircle, BarChart2 } from 'lucide-react';

const CEOSales = () => {
  const [reports, setReports] = useState([
    { id: 'SR-101', department: 'Pharmacy', total: 12500, date: '2026-07-01', status: 'PENDING' },
    { id: 'SR-102', department: 'Car Rental', total: 4500, date: '2026-07-01', status: 'PENDING' },
  ]);

  const [transactions] = useState([
    { id: 'TXN-991', department: 'Pharmacy', branch: 'Main', amount: 150, date: '2026-07-01', crv: 'CRV-01' },
    { id: 'TXN-992', department: 'Printing', branch: 'Main', amount: 850, date: '2026-07-01', crv: 'CRV-02' },
  ]);

  const [rejectId, setRejectId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const [filters, setFilters] = useState({ department: 'All', branch: 'All', date: 'Today' });
  const [chartGrain, setChartGrain] = useState('Daily');

  const handleApprove = (id) => {
    setReports(reports.map(r => r.id === id ? { ...r, status: 'APPROVED' } : r));
    submitNotification('Sales Report Approved', `Report ${id} has been approved. Finance notified.`);
  };

  const handleReject = () => {
    if (!rejectReason) return alert('Reason is required');
    setReports(reports.map(r => r.id === rejectId ? { ...r, status: 'REJECTED' } : r));
    receiveNotification('Sales Report Rejected', `Report ${rejectId} rejected: ${rejectReason}`);
    setRejectId(null);
    setRejectReason('');
  };

  const handleExport = (format) => {
    triggerNotification('Export Started', `Exporting sales data as ${format}`);
  };

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0 }}>💰 SALES MANAGEMENT</h1>
          <p style={{ color: '#64748b', margin: 0 }}>🔗 Manage Sales Across All Branches</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={() => handleExport('PDF')} style={{ padding: '8px 16px', background: 'white', border: '1px solid #cbd5e1', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <Download size={16}/> Export PDF
          </button>
          <button onClick={() => handleExport('Excel')} style={{ padding: '8px 16px', background: 'white', border: '1px solid #cbd5e1', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <Download size={16}/> Export Excel
          </button>
        </div>
      </div>

      {/* FILTERS & SUMMARY */}
      <div style={{ display: 'flex', gap: 24, marginBottom: 24 }}>
        <div style={{ flex: 1, background: 'white', padding: 16, borderRadius: 8, border: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}><Filter size={18}/> Filters</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <select style={{ padding: 8, borderRadius: 4, border: '1px solid #cbd5e1' }} value={filters.department} onChange={e => setFilters({...filters, department: e.target.value})}>
              <option value="All">All Departments</option>
              <option value="Pharmacy">Pharmacy</option>
              <option value="Car Rental">Car Rental</option>
              <option value="Agri Rental">Agri Rental</option>
              <option value="Printing">Printing</option>
            </select>
            <select style={{ padding: 8, borderRadius: 4, border: '1px solid #cbd5e1' }} value={filters.branch} onChange={e => setFilters({...filters, branch: e.target.value})}>
              <option value="All">All Branches</option>
              <option value="Main">Main Branch</option>
            </select>
            <select style={{ padding: 8, borderRadius: 4, border: '1px solid #cbd5e1' }} value={filters.date} onChange={e => setFilters({...filters, date: e.target.value})}>
              <option value="Today">Today</option>
              <option value="Week">This Week</option>
              <option value="Month">This Month</option>
              <option value="Year">This Year</option>
            </select>
            <div style={{ display: 'flex', gap: 8 }}>
              <input type="number" placeholder="Min $" style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #cbd5e1' }} />
              <input type="number" placeholder="Max $" style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #cbd5e1' }} />
            </div>
          </div>
        </div>

        <div style={{ flex: 1, background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', padding: 24, borderRadius: 8, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ fontSize: 16, opacity: 0.9 }}>Total Sales Revenue</div>
          <div style={{ fontSize: 36, fontWeight: 'bold' }}>$17,000.00</div>
          <div style={{ fontSize: 14, opacity: 0.8 }}>Filtered by: {filters.date} | {filters.department}</div>
        </div>
      </div>

      {/* TREND CHART PLACEHOLDER & DEPARTMENT BREAKDOWN */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24, marginBottom: 24 }}>
        <div style={{ background: 'white', padding: 16, borderRadius: 8, border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}><BarChart2 size={18}/> Revenue Trend</h3>
            <div style={{ display: 'flex', gap: 8 }}>
              {['Daily', 'Weekly', 'Monthly'].map(g => (
                <button key={g} onClick={() => setChartGrain(g)} style={{ padding: '4px 12px', borderRadius: 20, border: 'none', background: chartGrain === g ? '#0f172a' : '#f1f5f9', color: chartGrain === g ? 'white' : '#64748b', cursor: 'pointer' }}>
                  {g}
                </button>
              ))}
            </div>
          </div>
          <div style={{ height: 200, background: '#f8fafc', border: '1px dashed #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
            [ {chartGrain} Bar Chart Visualization Rendered Here ]
          </div>
        </div>

        <div style={{ background: 'white', padding: 16, borderRadius: 8, border: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: 16 }}>Department Breakdown</h3>
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
            <tbody>
              <tr><td style={{ padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>Pharmacy</td><td style={{ textAlign: 'right', fontWeight: 'bold' }}>$12,500</td></tr>
              <tr><td style={{ padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>Car Rental</td><td style={{ textAlign: 'right', fontWeight: 'bold' }}>$4,500</td></tr>
              <tr><td style={{ padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>Printing</td><td style={{ textAlign: 'right', fontWeight: 'bold' }}>$0</td></tr>
              <tr><td style={{ padding: '8px 0' }}>Agri Rental</td><td style={{ textAlign: 'right', fontWeight: 'bold' }}>$0</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* FINANCE REPORTS APPROVAL */}
      <div style={{ background: 'white', padding: 16, borderRadius: 8, border: '1px solid #e2e8f0', marginBottom: 24 }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: 16 }}>Finance-Submitted Sales Reports</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ background: '#f8fafc' }}>
            <tr>
              <th style={{ padding: 12 }}>Report ID</th>
              <th style={{ padding: 12 }}>Department</th>
              <th style={{ padding: 12 }}>Date</th>
              <th style={{ padding: 12 }}>Total</th>
              <th style={{ padding: 12 }}>Status</th>
              <th style={{ padding: 12 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {reports.map(r => (
              <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: 12, fontWeight: 'bold' }}>{r.id}</td>
                <td style={{ padding: 12 }}>{r.department}</td>
                <td style={{ padding: 12 }}>{r.date}</td>
                <td style={{ padding: 12, fontWeight: 'bold' }}>ETB {r.total}</td>
                <td style={{ padding: 12 }}>
                  <span style={{ padding: '4px 8px', borderRadius: 4, fontSize: 12, fontWeight: 'bold', background: r.status === 'APPROVED' ? '#dcfce7' : r.status === 'REJECTED' ? '#fee2e2' : '#fef3c7', color: r.status === 'APPROVED' ? '#166534' : r.status === 'REJECTED' ? '#991b1b' : '#b45309' }}>
                    {r.status}
                  </span>
                </td>
                <td style={{ padding: 12 }}>
                  {r.status === 'PENDING' && (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => handleApprove(r.id)} style={{ background: '#22c55e', color: 'white', border: 'none', padding: '6px 12px', borderRadius: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <CheckCircle size={14}/> Approve
                      </button>
                      <button onClick={() => setRejectId(r.id)} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '6px 12px', borderRadius: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <XCircle size={14}/> Reject
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {rejectId && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'white', padding: 24, borderRadius: 8, width: 400 }}>
            <h3>Reject Report {rejectId}</h3>
            <textarea placeholder="Enter rejection reason (required)..." value={rejectReason} onChange={e => setRejectReason(e.target.value)} style={{ width: '100%', height: 100, padding: 8, marginBottom: 16, border: '1px solid #cbd5e1', borderRadius: 4 }}></textarea>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button onClick={() => setRejectId(null)} style={{ padding: '8px 16px', background: '#f1f5f9', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleReject} style={{ padding: '8px 16px', background: '#ef4444', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Submit Rejection</button>
            </div>
          </div>
        </div>
      )}

      {/* ALL TRANSACTIONS (CRV) */}
      <div style={{ background: 'white', padding: 16, borderRadius: 8, border: '1px solid #e2e8f0' }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: 16 }}>All Transactions (CRVs)</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ background: '#f8fafc' }}>
            <tr>
              <th style={{ padding: 12 }}>CRV #</th>
              <th style={{ padding: 12 }}>TXN ID</th>
              <th style={{ padding: 12 }}>Department</th>
              <th style={{ padding: 12 }}>Branch</th>
              <th style={{ padding: 12 }}>Date</th>
              <th style={{ padding: 12 }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map(t => (
              <tr key={t.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: 12, color: '#3b82f6', cursor: 'pointer' }}>{t.crv}</td>
                <td style={{ padding: 12 }}>{t.id}</td>
                <td style={{ padding: 12 }}>{t.department}</td>
                <td style={{ padding: 12 }}>{t.branch}</td>
                <td style={{ padding: 12 }}>{t.date}</td>
                <td style={{ padding: 12, fontWeight: 'bold' }}>ETB {t.amount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CEOSales;
