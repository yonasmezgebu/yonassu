import React, { useState, useEffect, useCallback } from 'react';
import { Activity, RefreshCw, Search, ChevronDown, ChevronUp, Filter } from 'lucide-react';
import { NotifStore } from './StoreHomeNew';

const G = {
  forest:'#228B22', dark:'#1B5E20', emerald:'#2E8B57', leaf:'#4CAF50',
  sage:'#A5D6A7', olive:'#6B8E23', mint:'#98FF98',
  brown:'#8D6E63', white:'#FFFFFF', lightGray:'#F5F5F5',
  darkGray:'#424242', orange:'#FF9800', red:'#F44336', sky:'#0288D1',
};
const API = '/api/v1/store-inventory';
function hdrs() { return { 'Content-Type': 'application/json', Authorization: 'Bearer ' + (localStorage.getItem('token') || '') }; }
async function apiFetch(url, opts = {}) {
  const r = await fetch(url, { headers: hdrs(), ...opts });
  const d = await r.json();
  if (!r.ok) throw new Error(d.message || 'Request failed');
  return d;
}

const TYPE_META = {
  RECEIPT:    { label: 'Receipt',    color: G.leaf,    bg: '#E8F5E9' },
  ISSUE:      { label: 'Issue',      color: G.orange,  bg: '#FFF3E0' },
  TRANSFER:   { label: 'Transfer',   color: G.brown,   bg: '#EFEBE9' },
  ADJUSTMENT: { label: 'Adjustment', color: G.emerald, bg: '#E0F2F1' },
  COUNT:      { label: 'Count',      color: G.sky,     bg: '#E3F2FD' },
};

const StoreStockMovement = () => {
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [sort, setSort] = useState({ col: 'created_at', dir: 'desc' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await apiFetch(`${API}/movements`);
      setMovements(d.data || []);
    } catch (e) { NotifStore.push('Failed to load movements: ' + e.message, 'error'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleSort = col => setSort(s => ({ col, dir: s.col === col && s.dir === 'asc' ? 'desc' : 'asc' }));
  const SortIcon = ({ col }) => sort.col === col ? (sort.dir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />) : null;

  const filtered = movements
    .filter(m => typeFilter === 'ALL' || (m.movement_type || m.type || '').toUpperCase() === typeFilter)
    .filter(m => !search || (m.drug_name || '').toLowerCase().includes(search.toLowerCase()) || (m.reference_no || m.ref_no || '').toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const va = a[sort.col] ?? '', vb = b[sort.col] ?? '';
      if (sort.col === 'created_at') return sort.dir === 'asc' ? new Date(va) - new Date(vb) : new Date(vb) - new Date(va);
      return sort.dir === 'asc' ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va));
    });

  const cols = [
    { key: 'created_at', label: 'Date/Time' },
    { key: 'movement_type', label: 'Type' },
    { key: 'drug_name', label: 'Drug' },
    { key: 'reference_no', label: 'Reference' },
    { key: 'quantity_in', label: 'Qty In' },
    { key: 'quantity_out', label: 'Qty Out' },
    { key: 'balance', label: 'Balance' },
    { key: 'performed_by', label: 'By' },
  ];

  const types = ['ALL', 'RECEIPT', 'ISSUE', 'TRANSFER', 'ADJUSTMENT', 'COUNT'];

  return (
    <div style={{ background: G.lightGray, minHeight: '100vh', width: '100%', fontFamily: "'Inter', sans-serif", padding: '0 0 60px' }}>
      <style>{`
        @keyframes spin { 100% { transform: rotate(360deg); } }
        @media (max-width: 768px) { .type-filters { flex-wrap: wrap !important; } }
      `}</style>

      <div style={{ background: `linear-gradient(135deg, ${G.dark} 0%, ${G.forest} 60%, ${G.emerald} 100%)`, padding: '24px 36px', color: G.white, borderBottom: `4px solid ${G.dark}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ background: '#558B2F', padding: 8, border: `2px solid ${G.white}`, boxShadow: `3px 3px 0 ${G.dark}` }}>
              <Activity size={24} color={G.white} />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900 }}>Stock Movement Log</h1>
              <p style={{ margin: 0, fontSize: 12, opacity: .8 }}>Complete audit trail of all inventory movements</p>
            </div>
          </div>
          <button onClick={load} style={{ background: 'rgba(255,255,255,.15)', border: `2px solid rgba(255,255,255,.5)`, color: G.white, padding: '9px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800, fontSize: 13, fontFamily: "'Inter', sans-serif" }}>
            <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            Refresh
          </button>
        </div>
      </div>

      <div style={{ padding: '24px 36px' }}>
        {/* Summary stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 20 }}>
          {Object.entries(TYPE_META).map(([type, meta]) => {
            const count = movements.filter(m => (m.movement_type || m.type || '').toUpperCase() === type).length;
            return (
              <button key={type} onClick={() => setTypeFilter(typeFilter === type ? 'ALL' : type)} style={{ background: typeFilter === type ? meta.color : G.white, border: `3px solid ${typeFilter === type ? G.dark : G.sage}`, boxShadow: typeFilter === type ? `4px 4px 0 ${G.dark}` : 'none', padding: '12px', cursor: 'pointer', fontFamily: "'Inter', sans-serif", transition: 'all .15s', textAlign: 'left' }}>
                <div style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1, color: typeFilter === type ? G.white : meta.color }}>{meta.label}</div>
                <div style={{ fontSize: 24, fontWeight: 900, color: typeFilter === type ? G.white : G.dark, marginTop: 4 }}>{count}</div>
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div style={{ background: G.white, border: `3px solid ${G.dark}`, boxShadow: `4px 4px 0 ${G.dark}`, padding: 14, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Search size={16} color={G.olive} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by drug name or reference…" style={{ border: 'none', outline: 'none', fontSize: 13, fontFamily: "'Inter', sans-serif", flex: 1, background: 'transparent', color: G.darkGray }} />
          <div style={{ fontWeight: 800, color: G.forest, fontSize: 13 }}>{filtered.length} records</div>
        </div>

        {/* Table */}
        <div style={{ background: G.white, border: `3px solid ${G.dark}`, boxShadow: `6px 6px 0 ${G.dark}` }}>
          {loading ? (
            <div style={{ padding: 60, textAlign: 'center' }}>
              <div style={{ width: 36, height: 36, border: `3px solid ${G.sage}`, borderTop: `3px solid ${G.forest}`, borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
              <div style={{ color: G.forest, fontWeight: 800 }}>Loading movement log…</div>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 60, textAlign: 'center', color: G.sage, fontWeight: 800, border: `3px dashed ${G.sage}`, margin: 20 }}>No stock movements found.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, minWidth: 900 }}>
                <thead>
                  <tr style={{ background: G.dark, color: G.white }}>
                    {cols.map(c => (
                      <th key={c.key} onClick={() => toggleSort(c.key)} style={{ padding: '13px 12px', textAlign: 'left', fontWeight: 900, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, cursor: 'pointer', whiteSpace: 'nowrap', borderBottom: `3px solid ${G.forest}`, userSelect: 'none' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>{c.label} <SortIcon col={c.key} /></span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((m, i) => {
                    const typeMeta = TYPE_META[(m.movement_type || m.type || '').toUpperCase()] || { label: m.movement_type || m.type, color: G.darkGray, bg: G.lightGray };
                    return (
                      <tr key={m.id || i} style={{ background: i % 2 === 0 ? G.white : '#F1F8F1', borderBottom: `1px solid ${G.sage}` }}>
                        <td style={{ padding: '10px 12px', whiteSpace: 'nowrap', color: G.darkGray, fontSize: 11 }}>
                          {m.created_at ? new Date(m.created_at).toLocaleString() : '—'}
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <span style={{ display: 'inline-block', padding: '3px 8px', background: typeMeta.bg, border: `1px solid ${typeMeta.color}`, color: typeMeta.color, fontWeight: 800, fontSize: 10 }}>
                            {typeMeta.label}
                          </span>
                        </td>
                        <td style={{ padding: '10px 12px', fontWeight: 700, color: G.dark }}>{m.drug_name || '—'}</td>
                        <td style={{ padding: '10px 12px', color: G.olive, fontFamily: 'monospace', fontSize: 11 }}>{m.reference_no || m.ref_no || '—'}</td>
                        <td style={{ padding: '10px 12px', fontWeight: 900, color: G.forest }}>
                          {m.quantity_in ? '+' + m.quantity_in : '—'}
                        </td>
                        <td style={{ padding: '10px 12px', fontWeight: 900, color: G.red }}>
                          {m.quantity_out ? '-' + m.quantity_out : '—'}
                        </td>
                        <td style={{ padding: '10px 12px', fontWeight: 900, color: G.dark }}>{m.balance ?? '—'}</td>
                        <td style={{ padding: '10px 12px', color: G.darkGray, fontSize: 11 }}>{m.performed_by || '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ background: G.dark, color: G.white }}>
                    <td colSpan={4} style={{ padding: '12px', fontWeight: 900, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
                      Total Movements — {filtered.length}
                    </td>
                    <td style={{ padding: '12px', fontWeight: 900, color: G.mint }}>
                      +{filtered.reduce((s, m) => s + Number(m.quantity_in || 0), 0).toLocaleString()}
                    </td>
                    <td style={{ padding: '12px', fontWeight: 900, color: '#FF8A80' }}>
                      -{filtered.reduce((s, m) => s + Number(m.quantity_out || 0), 0).toLocaleString()}
                    </td>
                    <td colSpan={2} />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StoreStockMovement;
