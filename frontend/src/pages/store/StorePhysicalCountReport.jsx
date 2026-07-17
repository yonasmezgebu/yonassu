import React, { useState, useEffect } from 'react';
import { Clipboard, Download, Printer, Filter } from 'lucide-react';
import { getCounts } from '../../utils/storeApi';

const statusColors = { Verified: { bg: '#dcfce7', c: '#166534' }, 'In Progress': { bg: '#fef3c7', c: '#92400e' }, Draft: { bg: '#f1f5f9', c: '#475569' }, 'Pending Verification': { bg: '#eff6ff', c: '#1d4ed8' }, Closed: { bg: '#e2e8f0', c: '#334155' } };

const StorePhysicalCountReport = () => {
  const [counts, setCounts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCounts().then(r => { setCounts(r.data || []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: 24, fontFamily: "'Inter', sans-serif" }}>Loading...</div>;

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
        <select style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 14 }}>
          <option>All Statuses</option>
          {Object.keys(statusColors).map(s => <option key={s}>{s}</option>)}
        </select>
      </div>
      <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#f1f5f9' }}>
              {['Count #', 'Count Date', 'Count Type', 'Status'].map(h => (
                <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 700, color: '#475569', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {counts.map(c => (
              <tr key={c.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '12px 14px', fontFamily: 'monospace', color: '#14b8a6', fontWeight: 700 }}>{c.count_no}</td>
                <td style={{ padding: '12px 14px', color: '#64748b' }}>{c.count_date ? new Date(c.count_date).toLocaleDateString() : '—'}</td>
                <td style={{ padding: '12px 14px' }}>{c.count_type || '—'}</td>
                <td style={{ padding: '12px 14px' }}>
                  <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: (statusColors[c.status] || statusColors.Draft).bg, color: (statusColors[c.status] || statusColors.Draft).c }}>{c.status}</span>
                </td>
              </tr>
            ))}
            {counts.length === 0 && <tr><td colSpan={4} style={{ padding: 24, textAlign: 'center', color: '#94a3b8' }}>No count records found</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StorePhysicalCountReport;