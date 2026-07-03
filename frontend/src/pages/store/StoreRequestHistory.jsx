import React, { useState, useEffect } from 'react';
import { BookOpen, Filter, Download, Printer } from 'lucide-react';
import { notifyRequestHistory } from '../../utils/storeNotifications';

const mockHistory = [
  { id: 'M20-001', dept: 'Pharmacy', items: 'Amoxicillin 500mg', qty: 200, status: 'Issued', date: '2026-06-30', processedBy: 'Store Manager' },
  { id: 'M20-002', dept: 'Sales', items: 'A4 Paper Reams', qty: 10, status: 'Issued', date: '2026-06-30', processedBy: 'Store Manager' },
  { id: 'M20-003', dept: 'Pharmacy', items: 'IV Fluid (500ml)', qty: 30, status: 'Pending', date: '2026-07-01', processedBy: '—' },
  { id: 'M20-004', dept: 'Other', items: 'Hand Sanitizer 500ml', qty: 20, status: 'Issued', date: '2026-07-01', processedBy: 'Store Manager' },
  { id: 'M20-005', dept: 'Pharmacy', items: 'Surgical Gloves (L)', qty: 50, status: 'Rejected', date: '2026-07-01', processedBy: 'Store Manager' },
  { id: 'M20-006', dept: 'Other', items: 'Office Chairs', qty: 5, status: 'Pending', date: '2026-07-01', processedBy: '—' },
  { id: 'M20-007', dept: 'Sales', items: 'Printer Paper', qty: 20, status: 'Approved', date: '2026-07-01', processedBy: 'Store Manager' },
];

const statusColors = { Pending: { bg: '#fef3c7', c: '#92400e' }, Approved: { bg: '#dcfce7', c: '#166534' }, Issued: { bg: '#eff6ff', c: '#1d4ed8' }, Rejected: { bg: '#fee2e2', c: '#991b1b' } };

const StoreRequestHistory = () => {
  const [filterDept, setFilterDept] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    notifyRequestHistory();
  }, []);

  const filtered = mockHistory
    .filter(r => filterDept === 'All' || r.dept === filterDept)
    .filter(r => filterStatus === 'All' || r.status === filterStatus);

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <BookOpen color="#64748b" size={28} /> REQUEST HISTORY
          </h1>
          <p style={{ color: '#64748b', margin: '4px 0 0' }}>Document Model: Request Log — Complete Historical Record (All Statuses)</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => window.print()} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: 'white', border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer', fontSize: 14 }}>
            <Printer size={15} /> Print
          </button>
          <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#0f172a', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 14 }}>
            <Download size={15} /> Export
          </button>
        </div>
      </div>

      {/* SUMMARY CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total Requests', val: mockHistory.length, bg: 'white' },
          { label: 'Pending', val: mockHistory.filter(r => r.status === 'Pending').length, bg: '#fef3c7' },
          { label: 'Approved/Issued', val: mockHistory.filter(r => ['Approved', 'Issued'].includes(r.status)).length, bg: '#dcfce7' },
          { label: 'Rejected', val: mockHistory.filter(r => r.status === 'Rejected').length, bg: '#fee2e2' },
        ].map(c => (
          <div key={c.label} style={{ background: c.bg, padding: 16, borderRadius: 8, border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>{c.label}</div>
            <div style={{ fontSize: 28, fontWeight: 'bold', color: '#0f172a', marginTop: 4 }}>{c.val}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20, background: 'white', padding: 16, borderRadius: 8, border: '1px solid #e2e8f0', alignItems: 'center' }}>
        <Filter size={15} color="#64748b" />
        <select value={filterDept} onChange={e => setFilterDept(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 14 }}>
          <option value="All">All Departments</option>
          <option>Pharmacy</option>
          <option>Sales</option>
          <option>Other</option>
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 14 }}>
          <option value="All">All Status</option>
          <option>Pending</option>
          <option>Approved</option>
          <option>Issued</option>
          <option>Rejected</option>
        </select>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label style={{ fontSize: 13, color: '#64748b' }}>From:</label>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 14 }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label style={{ fontSize: 13, color: '#64748b' }}>To:</label>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 14 }} />
        </div>
      </div>

      <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#f1f5f9' }}>
              {['Request #', 'Department', 'Items', 'Qty', 'Status', 'Date', 'Processed By'].map(h => (
                <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 700, color: '#475569', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(r => (
              <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '12px 14px', fontFamily: 'monospace', color: '#6366f1', fontWeight: 700 }}>{r.id}</td>
                <td style={{ padding: '12px 14px', fontWeight: 600 }}>{r.dept}</td>
                <td style={{ padding: '12px 14px' }}>{r.items}</td>
                <td style={{ padding: '12px 14px', fontWeight: 700 }}>{r.qty}</td>
                <td style={{ padding: '12px 14px' }}>
                  <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: statusColors[r.status].bg, color: statusColors[r.status].c }}>{r.status}</span>
                </td>
                <td style={{ padding: '12px 14px', color: '#64748b' }}>{r.date}</td>
                <td style={{ padding: '12px 14px', color: '#64748b' }}>{r.processedBy}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StoreRequestHistory;
