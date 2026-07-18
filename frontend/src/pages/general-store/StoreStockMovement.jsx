import React, { useState, useEffect } from 'react';
import { Activity, Filter, Download, Printer } from 'lucide-react';
import { getMovements } from '../../utils/storeApi';

const typeColors = {
  Receipt: { bg: '#dcfce7', color: '#166534' },
  Issue: { bg: '#fee2e2', color: '#991b1b' },
  Transfer: { bg: '#ede9fe', color: '#5b21b6' },
  Adjustment: { bg: '#fff7ed', color: '#9a3412' },
};

const fallbackColor = { bg: '#f1f5f9', color: '#475569' };

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const StoreStockMovement = () => {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [filterItem, setFilterItem] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getMovements();
      setData(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch movements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filtered = data.filter(m => {
    if (filterType !== 'All' && m.movement_type !== filterType) return false;
    if (filterItem && !(m.item_name || '').toLowerCase().includes(filterItem.toLowerCase())) return false;
    if (dateFrom && m.created_at && m.created_at.slice(0, 10) < dateFrom) return false;
    if (dateTo && m.created_at && m.created_at.slice(0, 10) > dateTo) return false;
    return true;
  });

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', fontFamily: "'Inter', sans-serif", background: '#f8fafc' }}>
        <p style={{ fontSize: 18, color: '#64748b' }}>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', fontFamily: "'Inter', sans-serif", background: '#f8fafc', gap: 16 }}>
        <p style={{ fontSize: 16, color: '#b91c1c' }}>{error}</p>
        <button onClick={fetchData} style={{ padding: '8px 20px', background: '#0f172a', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 14 }}>Retry</button>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Activity color="#14b8a6" size={28} /> STOCK MOVEMENT LOG
          </h1>
          <p style={{ color: '#64748b', margin: '4px 0 0' }}>Document Model: Movement Log — Read-Only Historical Record</p>
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

      {/* FILTERS */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20, background: 'white', padding: 16, borderRadius: 8, border: '1px solid #e2e8f0', alignItems: 'center' }}>
        <Filter size={15} color="#64748b" />
        <input value={filterItem} onChange={e => setFilterItem(e.target.value)} placeholder="Filter by item name..." style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 14, width: 200 }} />
        <select value={filterType} onChange={e => setFilterType(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 14 }}>
          <option value="All">All Types</option>
          <option>Receipt</option>
          <option>Issue</option>
          <option>Transfer</option>
          <option>Adjustment</option>
        </select>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: '#64748b' }}>From:</label>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 14 }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: '#64748b' }}>To:</label>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 14 }} />
        </div>
        <span style={{ marginLeft: 'auto', fontSize: 13, color: '#64748b' }}>{filtered.length} records shown</span>
      </div>

      {/* TABLE */}
      <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#f1f5f9' }}>
              {['Date & Time', 'Item Name', 'Strength', 'Qty Moved', 'Unit', 'Movement Type', 'Reference Document', 'Performed By'].map(h => (
                <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 700, color: '#475569', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((m, i) => (
              <tr key={m.id || i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontSize: 12, color: '#64748b', whiteSpace: 'nowrap' }}>{formatDate(m.created_at)}</td>
                <td style={{ padding: '12px 14px', fontWeight: 600, whiteSpace: 'nowrap' }}>{m.item_name || '-'}</td>
                <td style={{ padding: '12px 14px', color: '#64748b' }}>{m.strength || '-'}</td>
                <td style={{ padding: '12px 14px', fontWeight: 700, color: '#0f172a' }}>{m.qty_moved != null ? m.qty_moved : '-'}</td>
                <td style={{ padding: '12px 14px', color: '#64748b' }}>{m.unit || '-'}</td>
                <td style={{ padding: '12px 14px' }}>
                  <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700, ...(typeColors[m.movement_type] || fallbackColor) }}>{m.movement_type}</span>
                </td>
                <td style={{ padding: '12px 14px', fontFamily: 'monospace', color: '#3b82f6', fontSize: 12, whiteSpace: 'nowrap' }}>{m.ref_no}</td>
                <td style={{ padding: '12px 14px', color: '#64748b', fontSize: 12 }}>{m.performed_by || '-'}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} style={{ padding: 32, textAlign: 'center', color: '#94a3b8' }}>No movements found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StoreStockMovement;
