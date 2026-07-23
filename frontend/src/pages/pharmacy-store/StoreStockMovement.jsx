import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Activity, RefreshCw, Search, ChevronDown, ChevronUp, Package, ArrowUpCircle, ArrowDownCircle, ClipboardList, Printer, XCircle } from 'lucide-react';
import { NotifStore } from './StoreHomeNew';

const G = {
  forest: '#228B22', dark: '#1B5E20', emerald: '#2E8B57', leaf: '#4CAF50',
  sage: '#A5D6A7', olive: '#6B8E23', mint: '#98FF98',
  brown: '#8D6E63', white: '#FFFFFF', lightGray: '#F5F5F5',
  darkGray: '#424242', orange: '#FF9800', red: '#F44336', sky: '#0288D1',
  teal: '#00838F',
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
  RECEIPT:    { label: 'Receipt',    color: G.forest,  bg: '#E8F5E9', icon: ArrowDownCircle, desc: 'Goods received in' },
  ISSUE:      { label: 'Issue',      color: G.orange,  bg: '#FFF3E0', icon: ArrowUpCircle,   desc: 'Goods issued out' },
  ADJUSTMENT: { label: 'Adjustment', color: G.teal,    bg: '#E0F7FA', icon: ClipboardList,   desc: 'Stock corrections' },
  COUNT:      { label: 'Count',      color: G.sky,     bg: '#E3F2FD', icon: Package,         desc: 'Physical counts' },
};

const PERIODS = [
  { key: 'all',     label: 'All Time' },
  { key: 'week',    label: 'This Week' },
  { key: 'month',   label: 'This Month' },
  { key: 'quarter', label: 'Quarter' },
  { key: 'year',    label: 'This Year' },
];

const StoreStockMovement = () => {
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [period, setPeriod] = useState('all');
  const [sort, setSort] = useState({ col: 'created_at', dir: 'desc' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (typeFilter && typeFilter !== 'ALL') params.set('type', typeFilter);
      if (period && period !== 'all') params.set('period', period);
      const d = await apiFetch(`${API}/movements?${params.toString()}`);
      setMovements(d.data || []);
    } catch (e) {
      NotifStore.push('Failed to load movements: ' + e.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [typeFilter, period]);

  useEffect(() => { load(); }, [load]);

  const clearAllFilters = () => {
    setTypeFilter('ALL');
    setPeriod('all');
    setSearch('');
  };

  const hasActiveFilters = typeFilter !== 'ALL' || period !== 'all' || search.trim() !== '';

  const toggleSort = col => setSort(s => ({ col, dir: s.col === col && s.dir === 'asc' ? 'desc' : 'asc' }));
  const SortIcon = ({ col }) => sort.col === col
    ? (sort.dir === 'asc' ? <ChevronUp size={11} /> : <ChevronDown size={11} />)
    : <span style={{ opacity: 0.3 }}><ChevronDown size={11} /></span>;

  const filtered = movements
    .filter(m => !search || (m.drug_name || '').toLowerCase().includes(search.toLowerCase())
      || (m.reference_no || '').toLowerCase().includes(search.toLowerCase())
      || (m.performed_by || '').toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const va = a[sort.col] ?? '', vb = b[sort.col] ?? '';
      if (sort.col === 'created_at') return sort.dir === 'asc' ? new Date(va) - new Date(vb) : new Date(vb) - new Date(va);
      return sort.dir === 'asc' ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va));
    });

  const totalIn  = filtered.reduce((s, m) => s + Number(m.quantity_in  || 0), 0);
  const totalOut = filtered.reduce((s, m) => s + Number(m.quantity_out || 0), 0);

  // ── PRINT ──────────────────────────────────────────────────────────
  const handlePrint = () => {
    const periodLabel = PERIODS.find(p => p.key === period)?.label || 'All Time';
    const typeLabel   = typeFilter === 'ALL' ? 'All Types' : (TYPE_META[typeFilter]?.label || typeFilter);
    const now         = new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    const rows = filtered.map((m, i) => {
      const type   = (m.movement_type || '').toUpperCase();
      const meta   = TYPE_META[type] || { label: type, color: '#424242' };
      const dateStr = m.created_at ? new Date(m.created_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
      return `
        <tr style="background:${i % 2 === 0 ? '#fff' : '#f9fff9'}; border-bottom:1px solid #c8e6c9;">
          <td style="padding:7px 10px; font-size:11px; white-space:nowrap; color:#424242;">${dateStr}</td>
          <td style="padding:7px 10px;">
            <span style="display:inline-block; padding:2px 7px; background:${TYPE_META[type]?.bg||'#eee'}; border:1px solid ${meta.color}; color:${meta.color}; font-weight:800; font-size:10px;">${meta.label}</span>
          </td>
          <td style="padding:7px 10px; font-family:monospace; font-size:11px; color:#6B8E23;">${m.reference_no || '—'}</td>
          <td style="padding:7px 10px; font-weight:700; color:#1B5E20; font-size:12px;">${m.drug_name || '—'}${m.strength ? `<br><span style="font-size:10px;color:#6B8E23;font-weight:400;">${m.strength}</span>` : ''}</td>
          <td style="padding:7px 10px; font-size:11px; color:#424242;">${m.batch_no || '—'}</td>
          <td style="padding:7px 10px; font-size:11px; color:#424242;">${m.remarks || '—'}</td>
          <td style="padding:7px 10px; text-align:center; font-weight:900; color:#228B22; font-size:13px;">${m.quantity_in ? '+' + Number(m.quantity_in).toLocaleString() : '—'}</td>
          <td style="padding:7px 10px; text-align:center; font-weight:900; color:#F44336; font-size:13px;">${m.quantity_out ? '-' + Number(m.quantity_out).toLocaleString() : '—'}</td>
          <td style="padding:7px 10px; font-size:11px; color:#424242;">${m.performed_by || '—'}</td>
        </tr>`;
    }).join('');

    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8"/>
        <title>Stock Movement Log</title>
        <style>
          * { margin:0; padding:0; box-sizing:border-box; }
          body { font-family: 'Segoe UI', Arial, sans-serif; background:#fff; color:#424242; }
          @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            @page { margin: 15mm 12mm; size: A4 landscape; }
          }
          .header { background: linear-gradient(135deg, #1B5E20, #228B22, #2E8B57); color:#fff; padding:18px 24px; display:flex; justify-content:space-between; align-items:center; }
          .header h1 { font-size:20px; font-weight:900; letter-spacing:-0.5px; }
          .header .sub { font-size:11px; opacity:.8; margin-top:3px; }
          .header .meta { text-align:right; font-size:11px; }
          .filters-bar { background:#E8F5E9; border-bottom:2px solid #A5D6A7; padding:8px 24px; display:flex; gap:20px; font-size:11px; font-weight:700; color:#1B5E20; }
          .summary { display:flex; gap:0; border-bottom:3px solid #1B5E20; }
          .sum-card { flex:1; padding:12px 20px; border-right:2px solid #A5D6A7; }
          .sum-card:last-child { border-right:none; }
          .sum-card .val { font-size:22px; font-weight:900; color:#1B5E20; }
          .sum-card .lbl { font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:1px; color:#6B8E23; margin-top:2px; }
          table { width:100%; border-collapse:collapse; font-size:12px; }
          thead tr { background:#1B5E20; color:#fff; }
          thead th { padding:10px 10px; text-align:left; font-weight:900; font-size:10px; text-transform:uppercase; letter-spacing:1px; }
          tfoot tr { background:#1B5E20; color:#fff; }
          tfoot td { padding:10px 10px; font-weight:900; font-size:12px; }
          .footer { margin-top:12px; padding:8px 24px; font-size:10px; color:#9E9E9E; border-top:1px solid #E0E0E0; display:flex; justify-content:space-between; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1>📋 Stock Movement Log</h1>
            <div class="sub">Pharmacy Store · Complete Inventory Audit Trail</div>
          </div>
          <div class="meta">
            <div><strong>Printed:</strong> ${now}</div>
            <div><strong>Period:</strong> ${periodLabel}</div>
            <div><strong>Type:</strong> ${typeLabel}</div>
            ${search ? `<div><strong>Search:</strong> "${search}"</div>` : ''}
          </div>
        </div>

        <div class="filters-bar">
          <span>📅 Period: ${periodLabel}</span>
          <span>🏷️ Type: ${typeLabel}</span>
          ${search ? `<span>🔍 Search: "${search}"</span>` : ''}
          <span>📊 Total Records: ${filtered.length}</span>
        </div>

        <div class="summary">
          <div class="sum-card"><div class="val">${filtered.length}</div><div class="lbl">Total Movements</div></div>
          <div class="sum-card"><div class="val" style="color:#228B22">+${totalIn.toLocaleString()}</div><div class="lbl">Total Qty In</div></div>
          <div class="sum-card"><div class="val" style="color:#F44336">-${totalOut.toLocaleString()}</div><div class="lbl">Total Qty Out</div></div>
          <div class="sum-card"><div class="val" style="color:${(totalIn - totalOut) >= 0 ? '#228B22' : '#F44336'}">${(totalIn - totalOut) >= 0 ? '+' : ''}${(totalIn - totalOut).toLocaleString()}</div><div class="lbl">Net Movement</div></div>
          <div class="sum-card"><div class="val">${movements.filter(m => m.movement_type === 'RECEIPT').length}</div><div class="lbl">Receipts</div></div>
          <div class="sum-card"><div class="val">${movements.filter(m => m.movement_type === 'ISSUE').length}</div><div class="lbl">Issues</div></div>
          <div class="sum-card"><div class="val">${movements.filter(m => m.movement_type === 'ADJUSTMENT').length}</div><div class="lbl">Adjustments</div></div>
          <div class="sum-card"><div class="val">${movements.filter(m => m.movement_type === 'COUNT').length}</div><div class="lbl">Counts</div></div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Date / Time</th><th>Type</th><th>Reference</th><th>Drug / Item</th><th>Batch No</th><th>Details</th>
              <th style="text-align:center">Qty In</th><th style="text-align:center">Qty Out</th><th>Performed By</th>
            </tr>
          </thead>
          <tbody>${rows || '<tr><td colspan="9" style="text-align:center;padding:30px;color:#9E9E9E;">No records found</td></tr>'}</tbody>
          <tfoot>
            <tr>
              <td colspan="6">Total — ${filtered.length} movements</td>
              <td style="text-align:center; color:#98FF98;">+${totalIn.toLocaleString()}</td>
              <td style="text-align:center; color:#FF8A80;">-${totalOut.toLocaleString()}</td>
              <td style="color:rgba(255,255,255,.7)">Net: ${(totalIn - totalOut) >= 0 ? '+' : ''}${(totalIn - totalOut).toLocaleString()}</td>
            </tr>
          </tfoot>
        </table>

        <div class="footer">
          <span>Sutana University · Pharmacy Store Management System</span>
          <span>Stock Movement Report · ${now}</span>
        </div>

        <script>window.onload = () => { window.print(); window.onafterprint = () => window.close(); };<\/script>
      </body>
      </html>`;

    const win = window.open('', '_blank', 'width=1100,height=800');
    win.document.write(html);
    win.document.close();
  };
  // ──────────────────────────────────────────────────────────────────

  const cols = [
    { key: 'created_at',    label: 'Date / Time', w: '150px' },
    { key: 'movement_type', label: 'Type',         w: '110px' },
    { key: 'reference_no',  label: 'Reference',    w: '130px' },
    { key: 'drug_name',     label: 'Drug / Item',  w: 'auto'  },
    { key: 'batch_no',      label: 'Batch No',     w: '110px' },
    { key: 'remarks',       label: 'Details',      w: '180px' },
    { key: 'quantity_in',   label: 'Qty In',       w: '90px'  },
    { key: 'quantity_out',  label: 'Qty Out',      w: '90px'  },
    { key: 'performed_by',  label: 'Performed By', w: '140px' },
  ];

  return (
    <div style={{ background: G.lightGray, minHeight: '100vh', fontFamily: "'Inter', sans-serif", paddingBottom: 60 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        @keyframes spin { 100% { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        .mov-row { animation: fadeIn .2s ease; }
        .mov-row:hover td { background: #f0faf0 !important; }
        .period-btn:hover { border-color: ${G.forest} !important; color: ${G.forest} !important; }
        .type-card:hover { transform: translateY(-2px); box-shadow: 5px 5px 0 ${G.dark} !important; }
        .mov-th:hover { background: ${G.forest} !important; }
        .print-btn:hover { background: #00695C !important; }
        .clear-btn:hover { background: #B71C1C !important; }
      `}</style>

      {/* ── HEADER ── */}
      <div style={{ background: `linear-gradient(135deg, ${G.dark} 0%, ${G.forest} 60%, ${G.emerald} 100%)`, padding: '20px 32px', color: G.white, borderBottom: `4px solid ${G.dark}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ background: 'rgba(255,255,255,.15)', padding: '10px', border: `2px solid rgba(255,255,255,.5)`, boxShadow: `3px 3px 0 ${G.dark}` }}>
              <Activity size={22} color={G.white} />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, letterSpacing: '-0.5px' }}>Stock Movement Log</h1>
              <p style={{ margin: 0, fontSize: 11, opacity: .75 }}>Complete audit trail · Receipts · Issues · Adjustments · Physical Counts</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            {/* Clear All Filters button */}
            {hasActiveFilters && (
              <button
                className="clear-btn"
                onClick={clearAllFilters}
                style={{ background: G.red, border: `2px solid rgba(255,255,255,.5)`, color: G.white, padding: '8px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7, fontWeight: 800, fontSize: 12, fontFamily: "'Inter', sans-serif", boxShadow: `3px 3px 0 ${G.dark}`, transition: 'background .15s' }}
              >
                <XCircle size={14} />
                Clear Filters
              </button>
            )}
            {/* Print button */}
            <button
              className="print-btn"
              onClick={handlePrint}
              style={{ background: '#00897B', border: `2px solid rgba(255,255,255,.5)`, color: G.white, padding: '8px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7, fontWeight: 800, fontSize: 12, fontFamily: "'Inter', sans-serif", boxShadow: `3px 3px 0 ${G.dark}`, transition: 'background .15s' }}
            >
              <Printer size={14} />
              Print Report
            </button>
            {/* Refresh */}
            <button onClick={load} style={{ background: 'rgba(255,255,255,.15)', border: `2px solid rgba(255,255,255,.5)`, color: G.white, padding: '8px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7, fontWeight: 800, fontSize: 12, fontFamily: "'Inter', sans-serif", boxShadow: `3px 3px 0 ${G.dark}` }}>
              <RefreshCw size={13} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div style={{ padding: '24px 32px' }}>

        {/* ── 4 TYPE CARDS ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
          {Object.entries(TYPE_META).map(([type, meta]) => {
            const Icon  = meta.icon;
            const count = movements.filter(m => (m.movement_type || '').toUpperCase() === type).length;
            const active = typeFilter === type;
            return (
              <button
                key={type}
                className="type-card"
                onClick={() => setTypeFilter(active ? 'ALL' : type)}
                style={{
                  background: active ? `linear-gradient(135deg, ${meta.color}, ${G.dark})` : G.white,
                  border: `3px solid ${active ? G.dark : meta.color}`,
                  boxShadow: active ? `5px 5px 0 ${G.dark}` : `3px 3px 0 ${meta.color}44`,
                  padding: '16px 14px', cursor: 'pointer', fontFamily: "'Inter', sans-serif",
                  transition: 'all .15s', textAlign: 'left',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1.2, color: active ? 'rgba(255,255,255,.8)' : meta.color, marginBottom: 6 }}>
                      {meta.label}
                    </div>
                    <div style={{ fontSize: 32, fontWeight: 900, color: active ? G.white : G.dark, lineHeight: 1 }}>
                      {count}
                    </div>
                    <div style={{ fontSize: 10, color: active ? 'rgba(255,255,255,.65)' : G.olive, marginTop: 4 }}>
                      {meta.desc}
                    </div>
                  </div>
                  <div style={{ background: active ? 'rgba(255,255,255,.2)' : meta.bg, padding: 8, border: `2px solid ${active ? 'rgba(255,255,255,.3)' : meta.color + '44'}` }}>
                    <Icon size={20} color={active ? G.white : meta.color} />
                  </div>
                </div>
                {active && (
                  <div style={{ marginTop: 8, fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,.7)', textTransform: 'uppercase', letterSpacing: 1 }}>
                    ✓ Active Filter — Click to clear
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* ── PERIOD FILTERS + SEARCH ROW ── */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Period buttons */}
          <div style={{ display: 'flex', gap: 0, background: G.white, border: `2px solid ${G.dark}`, boxShadow: `3px 3px 0 ${G.dark}`, overflow: 'hidden' }}>
            {PERIODS.map((p, idx) => (
              <button
                key={p.key}
                className="period-btn"
                onClick={() => setPeriod(p.key)}
                style={{
                  background: period === p.key ? G.dark : 'transparent',
                  color: period === p.key ? G.white : G.darkGray,
                  border: 'none',
                  borderRight: idx < PERIODS.length - 1 ? `1px solid ${G.sage}` : 'none',
                  padding: '8px 14px', cursor: 'pointer', fontFamily: "'Inter', sans-serif",
                  fontSize: 11, fontWeight: 700, transition: 'all .15s',
                }}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div style={{ flex: 1, background: G.white, border: `2px solid ${G.dark}`, boxShadow: `3px 3px 0 ${G.dark}`, padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 10, minWidth: 200 }}>
            <Search size={15} color={G.olive} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search drug name, reference, or user…"
              style={{ border: 'none', outline: 'none', fontSize: 12, fontFamily: "'Inter', sans-serif", flex: 1, background: 'transparent', color: G.darkGray }}
            />
            {search && (
              <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: G.red, fontSize: 18, lineHeight: 1, padding: 0 }}>×</button>
            )}
          </div>

          {/* Record count badge */}
          <div style={{ background: G.dark, color: G.white, padding: '8px 16px', fontWeight: 900, fontSize: 12, boxShadow: `3px 3px 0 ${G.forest}`, whiteSpace: 'nowrap' }}>
            {filtered.length} records
          </div>
        </div>

        {/* Active filters banner */}
        {hasActiveFilters && (
          <div style={{ background: '#FFF8E1', border: `2px solid #FFC107`, padding: '8px 14px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', boxShadow: `2px 2px 0 #FFA000` }}>
            <span style={{ fontWeight: 800, fontSize: 11, color: '#E65100' }}>🔍 Active Filters:</span>
            {typeFilter !== 'ALL' && <span style={{ background: TYPE_META[typeFilter]?.bg, border: `1px solid ${TYPE_META[typeFilter]?.color}`, color: TYPE_META[typeFilter]?.color, padding: '2px 8px', fontSize: 10, fontWeight: 800 }}>{TYPE_META[typeFilter]?.label}</span>}
            {period !== 'all' && <span style={{ background: '#E8F5E9', border: `1px solid ${G.forest}`, color: G.forest, padding: '2px 8px', fontSize: 10, fontWeight: 800 }}>{PERIODS.find(p => p.key === period)?.label}</span>}
            {search && <span style={{ background: '#E3F2FD', border: `1px solid ${G.sky}`, color: G.sky, padding: '2px 8px', fontSize: 10, fontWeight: 800 }}>"{search}"</span>}
            <button onClick={clearAllFilters} style={{ marginLeft: 'auto', background: G.red, color: G.white, border: 'none', padding: '4px 10px', cursor: 'pointer', fontSize: 10, fontWeight: 800 }}>✕ Clear All</button>
          </div>
        )}

        {/* ── TABLE ── */}
        <div style={{ background: G.white, border: `3px solid ${G.dark}`, boxShadow: `6px 6px 0 ${G.dark}` }}>
          {loading ? (
            <div style={{ padding: 60, textAlign: 'center' }}>
              <div style={{ width: 36, height: 36, border: `4px solid ${G.sage}`, borderTop: `4px solid ${G.forest}`, borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
              <div style={{ color: G.forest, fontWeight: 800, fontSize: 13 }}>Loading movement log…</div>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 60, textAlign: 'center' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
              <div style={{ color: G.olive, fontWeight: 800, fontSize: 14 }}>No stock movements found</div>
              <div style={{ color: G.sage, fontSize: 12, marginTop: 6 }}>
                {hasActiveFilters ? 'No records match the current filters' : 'No movements have been recorded yet'}
              </div>
              {hasActiveFilters && (
                <button onClick={clearAllFilters} style={{ marginTop: 14, background: G.forest, color: G.white, border: 'none', padding: '9px 20px', cursor: 'pointer', fontWeight: 800, fontSize: 12, boxShadow: `3px 3px 0 ${G.dark}` }}>
                  Clear All Filters
                </button>
              )}
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, minWidth: 820 }}>
                <thead>
                  <tr style={{ background: G.dark }}>
                    {cols.map(c => (
                      <th
                        key={c.key}
                        className="mov-th"
                        onClick={() => toggleSort(c.key)}
                        style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 900, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, cursor: 'pointer', whiteSpace: 'nowrap', color: G.white, width: c.w, transition: 'background .15s', userSelect: 'none', borderBottom: `3px solid ${G.forest}` }}
                      >
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          {c.label} <SortIcon col={c.key} />
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((m, i) => {
                    const type = (m.movement_type || '').toUpperCase();
                    const meta = TYPE_META[type] || { label: type, color: G.darkGray, bg: G.lightGray };
                    const Icon = meta.icon || Package;
                    return (
                      <tr key={`${type}-${m.id}-${i}`} className="mov-row" style={{ borderBottom: `1px solid ${G.sage}30` }}>
                        <td style={{ padding: '10px 14px', whiteSpace: 'nowrap', color: G.darkGray, fontSize: 11, background: i % 2 === 0 ? G.white : '#F9FFF9' }}>
                          {m.created_at ? new Date(m.created_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                        </td>
                        <td style={{ padding: '10px 14px', background: i % 2 === 0 ? G.white : '#F9FFF9' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 9px', background: meta.bg, border: `1.5px solid ${meta.color}`, color: meta.color, fontWeight: 800, fontSize: 10 }}>
                            <Icon size={11} />{meta.label}
                          </span>
                        </td>
                        <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontSize: 11, color: G.olive, background: i % 2 === 0 ? G.white : '#F9FFF9' }}>
                          {m.reference_no || '—'}
                        </td>
                        <td style={{ padding: '10px 14px', background: i % 2 === 0 ? G.white : '#F9FFF9' }}>
                          <div style={{ fontWeight: 700, color: G.dark, fontSize: 12 }}>{m.drug_name || '—'}</div>
                          {m.strength && <div style={{ fontSize: 10, color: G.olive, marginTop: 2 }}>{m.strength}</div>}
                        </td>
                        <td style={{ padding: '10px 14px', color: G.darkGray, fontSize: 11, background: i % 2 === 0 ? G.white : '#F9FFF9' }}>
                          {m.batch_no || '—'}
                        </td>
                        <td style={{ padding: '10px 14px', color: G.darkGray, fontSize: 11, background: i % 2 === 0 ? G.white : '#F9FFF9', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={m.remarks || ''}>
                          {m.remarks || '—'}
                        </td>
                        <td style={{ padding: '10px 14px', fontWeight: 900, background: i % 2 === 0 ? G.white : '#F9FFF9' }}>
                          {m.quantity_in ? (
                            <span style={{ color: G.forest, background: '#E8F5E9', padding: '3px 8px', fontWeight: 900, fontSize: 12 }}>
                              +{Number(m.quantity_in).toLocaleString()}
                            </span>
                          ) : <span style={{ color: G.sage }}>—</span>}
                        </td>
                        <td style={{ padding: '10px 14px', fontWeight: 900, background: i % 2 === 0 ? G.white : '#F9FFF9' }}>
                          {m.quantity_out ? (
                            <span style={{ color: G.red, background: '#FFEBEE', padding: '3px 8px', fontWeight: 900, fontSize: 12 }}>
                              -{Number(m.quantity_out).toLocaleString()}
                            </span>
                          ) : <span style={{ color: G.sage }}>—</span>}
                        </td>
                        <td style={{ padding: '10px 14px', color: G.darkGray, fontSize: 11, background: i % 2 === 0 ? G.white : '#F9FFF9' }}>
                          {m.performed_by || '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ background: G.dark, color: G.white }}>
                    <td colSpan={6} style={{ padding: '12px 14px', fontWeight: 900, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>
                      Total — {filtered.length} movements
                    </td>
                    <td style={{ padding: '12px 14px', fontWeight: 900, color: G.mint, fontSize: 13 }}>
                      +{totalIn.toLocaleString()}
                    </td>
                    <td style={{ padding: '12px 14px', fontWeight: 900, color: '#FF8A80', fontSize: 13 }}>
                      -{totalOut.toLocaleString()}
                    </td>
                    <td style={{ padding: '12px 14px', fontWeight: 800, color: 'rgba(255,255,255,.6)', fontSize: 11 }}>
                      Net: {(totalIn - totalOut) >= 0 ? '+' : ''}{(totalIn - totalOut).toLocaleString()}
                    </td>
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
