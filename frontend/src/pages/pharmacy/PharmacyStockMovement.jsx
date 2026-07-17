import React, { useState, useEffect } from 'react';
import { Activity, RefreshCw, Loader2, Search, Package, ArrowUpRight, ArrowDownLeft, XCircle } from 'lucide-react';
import pharmacyService from '../../services/pharmacyService';

const PharmacyStockMovement = () => {
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (typeFilter) params.type = typeFilter;
      const raw = await pharmacyService.getStockMovements(params);
      const list = Array.isArray(raw) ? raw : raw?.data || [];
      setMovements(list);
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to load stock movements');
      setMovements([]);
    } finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, [typeFilter]);

  const filtered = movements.filter(m => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (m.drug_name || '').toLowerCase().includes(q) || (m.type || '').toLowerCase().includes(q) || (m.reference || '').toLowerCase().includes(q);
  });

  return (
    <div style={{ padding: 28, fontFamily: "'Inter',sans-serif", color: '#1e293b', minHeight: '100vh', background: 'linear-gradient(135deg,#f0fdf4 0%,#f8fafc 50%,#ecfeff 100%)' }}>
      <style>{`@keyframes spin{100%{transform:rotate(360deg);}}@keyframes fadeSlide{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`}</style>

      <div style={{ marginBottom: 28, animation: 'fadeSlide 0.4s ease-out' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 6 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg,#06b6d4,#0891b2)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(6,182,212,0.3)' }}>
            <Activity size={24} color="white" />
          </div>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0, color: '#0f172a', letterSpacing: '-0.02em' }}>Stock Movement</h1>
            <p style={{ color: '#64748b', margin: '2px 0 0 0', fontSize: 14 }}>All pharmacy stock movements & transactions — {movements.length} records</p>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 240 }}>
          <Search size={17} color="#94a3b8" style={{ position: 'absolute', left: 14, top: 12, pointerEvents: 'none' }} />
          <input type="text" placeholder="Search by drug, type, reference..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', padding: '10px 16px 10px 42px', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: 14, outline: 'none', boxSizing: 'border-box', background: '#f8fafc' }} />
        </div>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
          style={{ padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: 13, fontWeight: 600, color: '#374151', background: 'white', outline: 'none', cursor: 'pointer', minWidth: 150 }}>
          <option value="">All Types</option>
          <option value="add">Stock In (+)</option>
          <option value="remove">Stock Out (-)</option>
          <option value="adjustment">Adjustment</option>
        </select>
        <button onClick={loadData} disabled={loading}
          style={{ padding: '10px 18px', background: '#06b6d4', color: 'white', border: 'none', borderRadius: 10, cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
          <RefreshCw size={15} style={loading ? { animation: 'spin 1s linear infinite' } : {}} /> Refresh
        </button>
      </div>

      {error && (
        <div style={{ background: '#fef2f2', borderRadius: 12, padding: '20px 24px', marginBottom: 20, border: '1px solid #fecaca', display: 'flex', alignItems: 'center', gap: 12 }}>
          <XCircle size={20} color="#dc2626" />
          <span style={{ color: '#991b1b', fontWeight: 600, fontSize: 14, flex: 1 }}>{error}</span>
          <button onClick={loadData} style={{ padding: '8px 16px', background: '#dc2626', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Retry</button>
        </div>
      )}

      <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,0.06)', animation: 'fadeSlide 0.5s ease-out' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fafbfc' }}>
          <span style={{ fontWeight: 700, color: '#1e293b', fontSize: 15, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Activity size={17} color="#06b6d4" /> Movement Log
          </span>
          <span style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>
            {loading ? <><Loader2 size={14} style={{ display: 'inline', animation: 'spin 1s linear infinite', marginRight: 6 }} />Loading...</> : `${filtered.length} records`}
          </span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr>
                <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', borderBottom: '2px solid #e2e8f0', background: '#f8fafc', whiteSpace: 'nowrap' }}>Date/Time</th>
                <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', borderBottom: '2px solid #e2e8f0', background: '#f8fafc', whiteSpace: 'nowrap' }}>Drug</th>
                <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', borderBottom: '2px solid #e2e8f0', background: '#f8fafc', whiteSpace: 'nowrap' }}>Type</th>
                <th style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', borderBottom: '2px solid #e2e8f0', background: '#f8fafc', whiteSpace: 'nowrap' }}>Quantity</th>
                <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', borderBottom: '2px solid #e2e8f0', background: '#f8fafc', whiteSpace: 'nowrap' }}>Reference</th>
                <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', borderBottom: '2px solid #e2e8f0', background: '#f8fafc', whiteSpace: 'nowrap' }}>Notes</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ padding: '60px 24px', textAlign: 'center' }}>
                  <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: '#06b6d4' }} />
                  <p style={{ color: '#64748b', margin: '12px 0 0', fontWeight: 600 }}>Loading movements...</p>
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: '60px 24px', textAlign: 'center', color: '#94a3b8' }}>
                  <Package size={40} style={{ color: '#cbd5e1', marginBottom: 12 }} />
                  <p style={{ fontSize: 16, fontWeight: 700, margin: '0 0 4px', color: '#64748b' }}>No movements found</p>
                  <p style={{ fontSize: 13, margin: 0 }}>Stock adjustments and transfers will appear here.</p>
                </td></tr>
              ) : filtered.map((m, idx) => {
                const isAdd = (m.type || '').toLowerCase() === 'add' || parseInt(m.quantity || 0) > 0;
                return (
                  <tr key={m.id || idx}
                    style={{ borderBottom: '1px solid #f1f5f9', background: idx % 2 === 0 ? 'white' : '#fafbfc', animation: `fadeSlide 0.3s ease-out ${idx * 0.02}s both` }}>
                    <td style={{ padding: '12px 14px', color: '#64748b', fontSize: 13, whiteSpace: 'nowrap' }}>
                      {m.created_at ? new Date(m.created_at).toLocaleString() : '-'}
                    </td>
                    <td style={{ padding: '12px 14px', fontWeight: 700, color: '#0f172a' }}>{m.drug_name || 'Unknown'}</td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 12, fontSize: 12, fontWeight: 700, background: isAdd ? '#d1fae5' : '#fee2e2', color: isAdd ? '#065f46' : '#991b1b' }}>
                        {isAdd ? <ArrowDownLeft size={12} /> : <ArrowUpRight size={12} />}
                        {m.type || (isAdd ? 'Add' : 'Remove')}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 700, fontSize: 16, color: isAdd ? '#059669' : '#dc2626' }}>
                      {isAdd ? '+' : ''}{m.quantity || 0}
                    </td>
                    <td style={{ padding: '12px 14px', color: '#64748b', fontSize: 13, fontFamily: 'monospace' }}>{m.reference || '-'}</td>
                    <td style={{ padding: '12px 14px', color: '#64748b', fontSize: 13, maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.notes || '-'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PharmacyStockMovement;
