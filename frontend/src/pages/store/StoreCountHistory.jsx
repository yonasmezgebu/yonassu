import React, { useState, useEffect } from 'react';
import { Archive, Filter, Download, Printer, Loader, AlertCircle, RefreshCw } from 'lucide-react';
import { getCounts } from '../../utils/storeApi';

const statusColors = {
  Approved: { bg: '#dcfce7', c: '#166534' },
  Verified: { bg: '#dbeafe', c: '#1e40af' },
  Closed: { bg: '#e0e7ff', c: '#3730a3' },
  Pending: { bg: '#fef3c7', c: '#92400e' },
  Rejected: { bg: '#fee2e2', c: '#991b1b' },
};

const StoreCountHistory = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterType, setFilterType] = useState('All');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const fetchCounts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getCounts();
      const items = (res.data || []).map(item => ({
        id: item.count_no,
        date: (item.count_date || '').slice(0, 10) || '—',
        type: item.count_type,
        itemsCounted: item.items?.length || 0,
        totalVariance: item.items?.reduce((sum, i) => sum + (i.variance || 0), 0) || 0,
        status: item.status,
        countedBy: item.counted_by || '—',
        auditorSig: item.verified_by ? String(item.verified_by) : '—',
        stampId: (item.status === 'Verified' || item.status === 'Closed') ? ('AUD-CNT-' + String(item.id).padStart(4, '0')) : '—',
      }));
      setData(items);
    } catch (err) {
      setError(err.message || 'Failed to load count history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCounts();
  }, []);

  const filtered = data
    .filter(r => filterType === 'All' || r.type === filterType)
    .filter(r => !dateFrom || r.date >= dateFrom)
    .filter(r => !dateTo || r.date <= dateTo);

  if (loading) {
    return (
      <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif", display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <Loader size={32} color="#8b5cf6" />
        <p style={{ marginTop: 16, color: '#64748b' }}>Loading count history...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif", display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <AlertCircle size={32} color="#b91c1c" />
        <p style={{ marginTop: 16, color: '#991b1b', fontWeight: 600 }}>Failed to load count history</p>
        <p style={{ color: '#64748b', fontSize: 14 }}>{error}</p>
        <button onClick={fetchCounts} style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#0f172a', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 14 }}>
          <RefreshCw size={15} /> Retry
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Archive color="#8b5cf6" size={28} /> PHYSICAL COUNT HISTORY
          </h1>
          <p style={{ color: '#64748b', margin: '4px 0 0' }}>Document Model: Count History — Read-Only Historical Record</p>
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

      {/* SUMMARY STATS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        <div style={{ background: 'white', padding: 16, borderRadius: 8, border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>Total Counts</div>
          <div style={{ fontSize: 28, fontWeight: 'bold', color: '#0f172a', marginTop: 4 }}>{data.length}</div>
        </div>
        <div style={{ background: '#dcfce7', padding: 16, borderRadius: 8, border: '1px solid #bbf7d0' }}>
          <div style={{ fontSize: 12, color: '#166534', fontWeight: 600 }}>Approved</div>
          <div style={{ fontSize: 28, fontWeight: 'bold', color: '#15803d', marginTop: 4 }}>{data.filter(c => c.status === 'Approved' || c.status === 'Verified' || c.status === 'Closed').length}</div>
        </div>
        <div style={{ background: '#fef3c7', padding: 16, borderRadius: 8, border: '1px solid #fde68a' }}>
          <div style={{ fontSize: 12, color: '#92400e', fontWeight: 600 }}>Pending Review</div>
          <div style={{ fontSize: 28, fontWeight: 'bold', color: '#b45309', marginTop: 4 }}>{data.filter(c => c.status === 'Pending').length}</div>
        </div>
        <div style={{ background: '#fee2e2', padding: 16, borderRadius: 8, border: '1px solid #fecaca' }}>
          <div style={{ fontSize: 12, color: '#991b1b', fontWeight: 600 }}>Total Variance (All)</div>
          <div style={{ fontSize: 28, fontWeight: 'bold', color: '#b91c1c', marginTop: 4 }}>{data.reduce((s, c) => s + c.totalVariance, 0)}</div>
        </div>
      </div>

      {/* FILTERS */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20, background: 'white', padding: 16, borderRadius: 8, border: '1px solid #e2e8f0', alignItems: 'center' }}>
        <Filter size={15} color="#64748b" />
        <select value={filterType} onChange={e => setFilterType(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 14 }}>
          <option value="All">All Count Types</option>
          <option>Full Store Count</option>
          <option>Category-wise Count</option>
          <option>Spot Check</option>
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

      {/* TABLE */}
      <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#f1f5f9' }}>
              {['Count #', 'Count Date', 'Count Type', 'Items Counted', 'Total Variance', 'Status', 'Counted By', 'Auditor Signature', 'Digital Stamp'].map(h => (
                <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 700, color: '#475569', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ padding: '40px 14px', textAlign: 'center', color: '#94a3b8' }}>No count records found.</td>
              </tr>
            ) : (
              filtered.map(r => {
                const sc = statusColors[r.status] || { bg: '#f1f5f9', c: '#475569' };
                return (
                  <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px 14px', fontFamily: 'monospace', color: '#8b5cf6', fontWeight: 700 }}>{r.id}</td>
                    <td style={{ padding: '12px 14px', color: '#64748b' }}>{r.date}</td>
                    <td style={{ padding: '12px 14px' }}>{r.type}</td>
                    <td style={{ padding: '12px 14px', fontWeight: 700 }}>{r.itemsCounted}</td>
                    <td style={{ padding: '12px 14px', fontWeight: 700, color: r.totalVariance > 0 ? '#b91c1c' : '#166534' }}>
                      {r.totalVariance > 0 ? `⚠️ ${r.totalVariance}` : '✓ 0'}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: sc.bg, color: sc.c }}>{r.status}</span>
                    </td>
                    <td style={{ padding: '12px 14px' }}>{r.countedBy}</td>
                    <td style={{ padding: '12px 14px', fontStyle: r.auditorSig === '—' ? 'italic' : 'normal', color: r.auditorSig === '—' ? '#94a3b8' : '#0f172a' }}>
                      {r.auditorSig !== '—' ? <span style={{ fontFamily: "'Brush Script MT', cursive", fontSize: 18 }}>{r.auditorSig}</span> : '—'}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      {r.stampId !== '—' ? <span style={{ fontFamily: 'monospace', background: '#f1f5f9', padding: '3px 8px', borderRadius: 4, fontSize: 12 }}>{r.stampId}</span> : <span style={{ color: '#94a3b8' }}>Pending</span>}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StoreCountHistory;
