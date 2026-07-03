import React, { useEffect } from 'react';
import { Clipboard, Download, Printer, Filter } from 'lucide-react';
import { storeInfo } from '../../utils/storeNotifications';

const mockCountHistory = [
  { id: 'CNT-001', date: '2026-06-15', type: 'Full Store Count', itemsCounted: 45, totalVariance: 12, status: 'Approved', countedBy: 'Store Manager', auditorSig: 'Abebe K.', stampId: 'AUD-CNT-9901' },
  { id: 'CNT-002', date: '2026-06-22', type: 'Category-wise Count', itemsCounted: 15, totalVariance: 0, status: 'Approved', countedBy: 'Store Manager', auditorSig: 'Abebe K.', stampId: 'AUD-CNT-9902' },
  { id: 'CNT-003', date: '2026-06-28', type: 'Spot Check', itemsCounted: 8, totalVariance: 5, status: 'Pending', countedBy: 'Store Manager', auditorSig: '—', stampId: '—' },
];

const statusColors = { Approved: { bg: '#dcfce7', c: '#166534' }, Pending: { bg: '#fef3c7', c: '#92400e' }, Rejected: { bg: '#fee2e2', c: '#991b1b' } };

const StorePhysicalCountReport = () => {
  useEffect(() => {
    storeInfo('📋 Physical Count Report Ready', '📋 Count Report', 'Physical count history report generated.');
  }, []);

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: '#0f766e' }}>
            <Clipboard color="#14b8a6" size={28} /> PHYSICAL COUNT REPORT
          </h1>
          <p style={{ color: '#64748b', margin: '4px 0 0' }}>Document Model: Count History</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => window.print()} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: 'white', border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer', fontSize: 14 }}>
            <Printer size={15} /> Print
          </button>
          <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#0f172a', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 14 }}>
            <Download size={15} /> Export PDF/Excel
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20, background: 'white', padding: 16, borderRadius: 8, border: '1px solid #e2e8f0', alignItems: 'center' }}>
        <Filter size={15} color="#64748b" />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label style={{ fontSize: 13, color: '#64748b' }}>From:</label>
          <input type="date" style={{ padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 14 }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label style={{ fontSize: 13, color: '#64748b' }}>To:</label>
          <input type="date" style={{ padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 14 }} />
        </div>
        <select style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 14 }}>
          <option>All Count Types</option>
          <option>Full Store Count</option>
          <option>Category-wise Count</option>
          <option>Spot Check</option>
        </select>
        <select style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 14 }}>
          <option>All Statuses</option>
          <option>Pending</option>
          <option>Approved</option>
          <option>Rejected</option>
        </select>
      </div>

      <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#f1f5f9' }}>
              {['Count #', 'Count Date', 'Count Type', 'Items Counted', 'Total Variance', 'Status', 'Counted By', 'Auditor Signature', 'Digital Stamp ID'].map(h => (
                <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 700, color: '#475569', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {mockCountHistory.map(r => (
              <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '12px 14px', fontFamily: 'monospace', color: '#14b8a6', fontWeight: 700 }}>{r.id}</td>
                <td style={{ padding: '12px 14px', color: '#64748b' }}>{r.date}</td>
                <td style={{ padding: '12px 14px' }}>{r.type}</td>
                <td style={{ padding: '12px 14px', fontWeight: 700 }}>{r.itemsCounted}</td>
                <td style={{ padding: '12px 14px', fontWeight: 700, color: r.totalVariance > 0 ? '#b91c1c' : '#166534' }}>
                  {r.totalVariance > 0 ? `⚠️ ${r.totalVariance}` : '✓ 0'}
                </td>
                <td style={{ padding: '12px 14px' }}>
                  <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: statusColors[r.status].bg, color: statusColors[r.status].c }}>{r.status}</span>
                </td>
                <td style={{ padding: '12px 14px' }}>{r.countedBy}</td>
                <td style={{ padding: '12px 14px', fontStyle: r.auditorSig === '—' ? 'italic' : 'normal', color: r.auditorSig === '—' ? '#94a3b8' : '#0f172a' }}>
                  {r.auditorSig !== '—' ? <span style={{ fontFamily: "'Brush Script MT', cursive", fontSize: 18 }}>{r.auditorSig}</span> : '—'}
                </td>
                <td style={{ padding: '12px 14px' }}>
                  {r.stampId !== '—' ? <span style={{ fontFamily: 'monospace', background: '#f1f5f9', padding: '3px 8px', borderRadius: 4, fontSize: 12 }}>{r.stampId}</span> : <span style={{ color: '#94a3b8' }}>Pending</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StorePhysicalCountReport;
