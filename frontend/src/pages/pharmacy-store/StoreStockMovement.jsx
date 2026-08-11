import React, { useState, useEffect, useCallback } from 'react';
import { Activity, RefreshCw, Search, ChevronDown, ChevronUp, Package, ArrowUpCircle, ArrowDownCircle, ClipboardList, Printer, XCircle } from 'lucide-react';
import { NotifStore } from './StoreHomeNew';
import SegmentedSpinner from '../../components/ui/SegmentedSpinner';

/* ── Enterprise CSS ─────────────────────────────────────────────── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
  :root {
    --cp: #2563EB; --cp-h: #1D4ED8;
    --cbg: #F5F6FA; --ccard: #FFFFFF; --cborder: #E5E7EB;
    --ct1: #111827; --ct2: #6B7280; --ctm: #9CA3AF;
    --cok: #16A34A; --cok-bg: #DCFCE7;
    --cdanger: #DC2626; --cdanger-bg: #FEE2E2;
    --cwarn: #D97706; --cwarn-bg: #FEF3C7;
    --cinfo: #0284C7; --cinfo-bg: #E0F2FE;
    --gold: #F59E0B; --gold-text: #111827;
  }

  /* ── Page ── */
  .mov-page {
    box-sizing: border-box;
    margin: 10px auto; width: calc(100% - 20px); max-width: 1536px;
    min-height: calc(100vh - 20px); padding: 24px 24px 48px;
    background: var(--cbg);
    font-family: 'Inter', 'Segoe UI', Roboto, -apple-system, sans-serif;
    color: var(--ct1); line-height: 1.5;
  }
  @media (max-width: 1024px) { .mov-page { margin: 6px auto; width: calc(100% - 12px); padding: 16px 16px 40px; } }
  @media (max-width: 480px)  { .mov-page { margin: 4px auto; width: calc(100% - 8px);  padding: 12px 12px 32px; } }

  /* ── Header ── */
  .mov-header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px; margin-bottom: 24px; padding-bottom: 20px; border-bottom: 1px solid var(--cborder); }
  .mov-header-left { display: flex; align-items: center; gap: 12px; }
  .mov-header-icon { background: var(--cinfo-bg); color: var(--cinfo); padding: 10px; border-radius: 10px; display: flex; flex-shrink: 0; }
  .mov-page-title { font-size: clamp(22px,3vw,28px); font-weight: 600; line-height: 1.3; margin: 0 0 2px; color: var(--ct1); }
  .mov-page-sub { font-size: 13px; color: var(--ct2); margin: 0; }
  .mov-header-btns { display: flex; gap: 8px; flex-wrap: wrap; }

  /* ── Buttons ── */
  .mov-btn { height: 36px; padding: 0 16px; border-radius: 8px; font-size: 14px; font-weight: 500; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; border: 1px solid var(--cborder); background: var(--ccard); color: var(--ct1); font-family: inherit; transition: all 150ms ease-in-out; white-space: nowrap; min-width: 44px; justify-content: center; }
  .mov-btn:hover:not(:disabled) { background: var(--gold); color: var(--gold-text); border-color: transparent; box-shadow: 0 4px 12px rgba(0,0,0,.10); transform: translateY(-1px); }
  .mov-btn:disabled { opacity: .5; cursor: not-allowed; }
  
  .mov-btn-primary { background: var(--cp); color: #fff; border-color: var(--cp); }
  .mov-btn-primary:hover:not(:disabled) { background: var(--gold); color: var(--gold-text); border-color: transparent; }
  .mov-btn-danger  { background: var(--ccard); color: var(--cdanger); border-color: var(--cdanger); }
  .mov-btn-danger:hover:not(:disabled) { background: var(--gold); color: var(--gold-text); border-color: transparent; }
  .mov-btn-icon { width: 36px; height: 36px; padding: 0; }
  .mov-btn-sm   { height: 30px; padding: 0 12px; font-size: 12px; }

  /* ── Spinner ── */
  .mov-spinner { display: inline-block; width: 16px; height: 16px; border-radius: 50%; border: 2.5px solid rgba(37,99,235,.2); border-top-color: var(--cp); animation: mov-spin 700ms linear infinite; flex-shrink: 0; }
  .mov-spinner.lg { width: 28px; height: 28px; border-width: 3px; }
  @keyframes mov-spin { to { transform: rotate(360deg); } }

  /* ── Type Cards Grid ── */
  .mov-type-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px; margin-bottom: 24px; }
  .mov-type-card { background: var(--ccard); border: 1px solid var(--cborder); border-radius: 10px; padding: 16px 20px; box-shadow: 0 1px 3px rgba(0,0,0,.06); transition: all 150ms ease; cursor: pointer; text-align: left; display: flex; flex-direction: column; }
  .mov-type-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,.08); transform: translateY(-1px); }
  .mov-type-card.active { border-color: var(--cp); box-shadow: 0 0 0 1px var(--cp), 0 4px 12px rgba(37,99,235,.15); background: #EFF6FF; }
  .mov-type-hd { display: flex; justify-content: space-between; align-items: flex-start; }
  .mov-type-label { font-size: 12px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.03em; margin-bottom: 8px; }
  .mov-type-val { font-size: 28px; font-weight: 700; color: var(--ct1); line-height: 1; }
  .mov-type-desc { font-size: 13px; color: var(--ct2); margin-top: 6px; }
  .mov-type-icon { padding: 10px; border-radius: 8px; display: flex; flex-shrink: 0; }

  /* ── Filters Bar ── */
  .mov-filters { display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 16px; align-items: center; }
  .mov-period-group { display: flex; background: var(--ccard); border: 1px solid var(--cborder); border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,.06); }
  .mov-period-btn { height: 36px; padding: 0 16px; font-size: 13px; font-weight: 500; color: var(--ct2); background: transparent; border: none; border-right: 1px solid var(--cborder); cursor: pointer; transition: all 150ms; font-family: inherit; }
  .mov-period-btn:last-child { border-right: none; }
  .mov-period-btn:hover { background: #F9FAFB; color: var(--ct1); }
  .mov-period-btn.active { background: var(--cp); color: #fff; }

  .mov-search { display: flex; align-items: center; gap: 8px; background: var(--ccard); border: 1px solid var(--cborder); border-radius: 8px; padding: 0 12px; height: 36px; flex: 1; min-width: 200px; box-shadow: 0 1px 3px rgba(0,0,0,.06); }
  .mov-search-input { border: none; outline: none; font-size: 14px; font-family: inherit; flex: 1; background: transparent; color: var(--ct1); }
  .mov-search-clear { background: none; border: none; color: var(--ctm); cursor: pointer; display: flex; align-items: center; padding: 0; }
  .mov-search-clear:hover { color: var(--cdanger); }
  .mov-record-count { background: var(--ccard); border: 1px solid var(--cborder); border-radius: 8px; padding: 0 16px; height: 36px; display: flex; align-items: center; font-size: 13px; font-weight: 500; color: var(--ct2); white-space: nowrap; box-shadow: 0 1px 3px rgba(0,0,0,.06); }

  /* ── Active Filters Banner ── */
  .mov-active-filters { background: var(--cwarn-bg); border: 1px solid #FDE68A; border-radius: 8px; padding: 12px 16px; margin-bottom: 20px; display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
  .mov-af-label { font-size: 13px; font-weight: 600; color: var(--cwarn); display: flex; align-items: center; gap: 6px; }
  .mov-af-tag { background: #fff; border: 1px solid #FDE68A; color: var(--cwarn); padding: 4px 10px; border-radius: 9999px; font-size: 12px; font-weight: 500; }
  
  /* ── Table ── */
  .mov-table-wrap { background: var(--ccard); border: 1px solid var(--cborder); border-radius: 10px; box-shadow: 0 1px 3px rgba(0,0,0,.06); overflow-x: auto; }
  .mov-table { width: 100%; border-collapse: collapse; min-width: 900px; font-size: 13px; }
  .mov-table thead tr { background: #F9FAFB; }
  .mov-table th { padding: 12px 16px; font-size: 12px; font-weight: 500; text-transform: uppercase; letter-spacing: .03em; color: var(--ctm); border-bottom: 1px solid var(--cborder); text-align: left; cursor: pointer; user-select: none; transition: background 150ms; }
  .mov-table th:hover { background: #F3F4F6; color: var(--ct1); }
  .mov-table th span { display: inline-flex; align-items: center; gap: 6px; }
  .mov-table td { padding: 12px 16px; border-bottom: 1px solid var(--cborder); color: var(--ct1); vertical-align: middle; transition: background 150ms; }
  .mov-table tbody tr:hover td { background: #F9FAFB; }
  .mov-table tfoot tr { background: #F9FAFB; border-top: 2px solid var(--cborder); }
  .mov-table tfoot td { padding: 14px 16px; font-weight: 600; color: var(--ct1); }

  .mov-badge { display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 9999px; font-size: 12px; font-weight: 500; white-space: nowrap; }
  
  .mov-state { padding: 64px 24px; text-align: center; color: var(--ct2); font-size: 14px; }
`;

const TYPE_META = {
  RECEIPT:    { label: 'Receipt',    color: 'var(--cok)',    bg: 'var(--cok-bg)',    icon: ArrowDownCircle, desc: 'Goods received in' },
  ISSUE:      { label: 'Issue',      color: 'var(--cwarn)',  bg: 'var(--cwarn-bg)',  icon: ArrowUpCircle,   desc: 'Goods issued out' },
  ADJUSTMENT: { label: 'Adjustment', color: 'var(--cinfo)',  bg: 'var(--cinfo-bg)',  icon: ClipboardList,   desc: 'Stock corrections' },
  COUNT:      { label: 'Count',      color: '#8B5CF6',       bg: '#EDE9FE',          icon: Package,         desc: 'Physical counts' },
};

const PERIODS = [
  { key: 'all',     label: 'All Time' },
  { key: 'week',    label: 'This Week' },
  { key: 'month',   label: 'This Month' },
  { key: 'quarter', label: 'Quarter' },
  { key: 'year',    label: 'This Year' },
];

const API = '/api/v1/store-inventory';
function hdrs() { return { 'Content-Type': 'application/json', Authorization: 'Bearer ' + (localStorage.getItem('token') || '') }; }
async function apiFetch(url, opts = {}) {
  const r = await fetch(url, { headers: hdrs(), ...opts });
  const d = await r.json();
  if (!r.ok) throw new Error(d.message || 'Request failed');
  return d;
}

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
    ? (sort.dir === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)
    : <ChevronDown size={14} style={{ opacity: 0.3 }} />;

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
        <tr style="background:${i % 2 === 0 ? '#fff' : '#f9fafa'}; border-bottom:1px solid #E5E7EB;">
          <td style="padding:10px 14px; font-size:12px; white-space:nowrap; color:#4B5563;">${dateStr}</td>
          <td style="padding:10px 14px;">
            <span style="font-weight:600; font-size:11px;">${meta.label}</span>
          </td>
          <td style="padding:10px 14px; font-family:monospace; font-size:12px; color:#4B5563;">${m.reference_no || '—'}</td>
          <td style="padding:10px 14px; font-weight:600; color:#111827; font-size:13px;">${m.drug_name || '—'}${m.strength ? `<br><span style="font-size:11px;color:#6B7280;font-weight:400;">${m.strength}</span>` : ''}</td>
          <td style="padding:10px 14px; font-size:12px; color:#4B5563;">${m.batch_no || '—'}</td>
          <td style="padding:10px 14px; font-size:12px; color:#4B5563;">${m.remarks || '—'}</td>
          <td style="padding:10px 14px; text-align:right; font-weight:600; color:#16A34A; font-size:13px;">${m.quantity_in ? '+' + Number(m.quantity_in).toLocaleString() : '—'}</td>
          <td style="padding:10px 14px; text-align:right; font-weight:600; color:#DC2626; font-size:13px;">${m.quantity_out ? '-' + Number(m.quantity_out).toLocaleString() : '—'}</td>
          <td style="padding:10px 14px; font-size:12px; color:#4B5563;">${m.performed_by || '—'}</td>
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
          body { font-family: 'Inter', -apple-system, sans-serif; background:#fff; color:#111827; }
          @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            @page { margin: 15mm 12mm; size: A4 landscape; }
          }
          .header { background: #2563EB; color:#fff; padding:24px; display:flex; justify-content:space-between; align-items:center; }
          .header h1 { font-size:24px; font-weight:600; margin-bottom:4px; }
          .header .sub { font-size:13px; opacity:.9; }
          .header .meta { text-align:right; font-size:12px; opacity:.9; line-height:1.5; }
          .filters-bar { background:#EFF6FF; border-bottom:1px solid #BFDBFE; padding:12px 24px; display:flex; gap:24px; font-size:13px; font-weight:500; color:#1E3A8A; }
          .summary { display:flex; border-bottom:1px solid #E5E7EB; }
          .sum-card { flex:1; padding:16px 24px; border-right:1px solid #E5E7EB; }
          .sum-card:last-child { border-right:none; }
          .sum-card .val { font-size:24px; font-weight:700; color:#111827; }
          .sum-card .lbl { font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:0.03em; color:#6B7280; margin-top:4px; }
          table { width:100%; border-collapse:collapse; font-size:13px; }
          thead tr { background:#F9FAFB; border-bottom:1px solid #E5E7EB; }
          thead th { padding:12px 14px; text-align:left; font-weight:600; font-size:11px; text-transform:uppercase; letter-spacing:0.03em; color:#6B7280; }
          tfoot tr { background:#F9FAFB; border-top:2px solid #E5E7EB; }
          tfoot td { padding:14px; font-weight:600; font-size:13px; color:#111827; }
          .footer { margin-top:24px; padding:16px 24px; font-size:12px; color:#9CA3AF; border-top:1px solid #E5E7EB; display:flex; justify-content:space-between; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1>Stock Movement Log</h1>
            <div class="sub">Pharmacy Store · Inventory Audit Trail</div>
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
          <div class="sum-card"><div class="val" style="color:#16A34A">+${totalIn.toLocaleString()}</div><div class="lbl">Total Qty In</div></div>
          <div class="sum-card"><div class="val" style="color:#DC2626">-${totalOut.toLocaleString()}</div><div class="lbl">Total Qty Out</div></div>
          <div class="sum-card"><div class="val" style="color:${(totalIn - totalOut) >= 0 ? '#16A34A' : '#DC2626'}">${(totalIn - totalOut) >= 0 ? '+' : ''}${(totalIn - totalOut).toLocaleString()}</div><div class="lbl">Net Movement</div></div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Date / Time</th><th>Type</th><th>Reference</th><th>Drug / Item</th><th>Batch No</th><th>Details</th>
              <th style="text-align:right">Qty In</th><th style="text-align:right">Qty Out</th><th>Performed By</th>
            </tr>
          </thead>
          <tbody>${rows || '<tr><td colspan="9" style="text-align:center;padding:40px;color:#9CA3AF;">No records found</td></tr>'}</tbody>
          <tfoot>
            <tr>
              <td colspan="6">Total — ${filtered.length} movements</td>
              <td style="text-align:right; color:#16A34A;">+${totalIn.toLocaleString()}</td>
              <td style="text-align:right; color:#DC2626;">-${totalOut.toLocaleString()}</td>
              <td style="color:#6B7280;">Net: ${(totalIn - totalOut) >= 0 ? '+' : ''}${(totalIn - totalOut).toLocaleString()}</td>
            </tr>
          </tfoot>
        </table>

        <div class="footer">
          <span>Sutana University · Pharmacy Store Management System</span>
          <span>Stock Movement Report · ${now}</span>
        </div>

        <script>window.onload = () => { window.print(); window.onafterprint = () => window.close(); };</script>
      </body>
      </html>`;

    const win = window.open('', '_blank', 'width=1100,height=800');
    win.document.write(html);
    win.document.close();
  };
  // ──────────────────────────────────────────────────────────────────

  const cols = [
    { key: 'created_at',    label: 'Date / Time', w: '160px' },
    { key: 'movement_type', label: 'Type',         w: '120px' },
    { key: 'reference_no',  label: 'Reference',    w: '140px' },
    { key: 'drug_name',     label: 'Drug / Item',  w: 'auto'  },
    { key: 'batch_no',      label: 'Batch No',     w: '120px' },
    { key: 'remarks',       label: 'Details',      w: '200px' },
    { key: 'quantity_in',   label: 'Qty In',       w: '100px', align: 'right' },
    { key: 'quantity_out',  label: 'Qty Out',      w: '100px', align: 'right' },
    { key: 'performed_by',  label: 'Performed By', w: '150px' },
  ];

  return (
    <div className="mov-page">
      <style>{CSS}</style>

      {/* ── HEADER ── */}
      <div className="mov-header">
        <div className="mov-header-left">
          <div className="mov-header-icon"><Activity size={24} /></div>
          <div>
            <h1 className="mov-page-title">Stock Movement Log</h1>
            <p className="mov-page-sub">Complete audit trail · Receipts · Issues · Adjustments · Physical Counts</p>
          </div>
        </div>
        <div className="mov-header-btns">
          {hasActiveFilters && (
            <button className="mov-btn mov-btn-danger" onClick={clearAllFilters}>
              <XCircle size={16} /> Clear Filters
            </button>
          )}
          <button className="mov-btn" onClick={handlePrint}>
            <Printer size={16} /> Print Report
          </button>
          <button className="mov-btn mov-btn-icon" onClick={load} disabled={loading} title="Refresh">
            {loading ? <span className="mov-spinner" /> : <RefreshCw size={16} />}
          </button>
        </div>
      </div>

      {/* ── TYPE CARDS ── */}
      <div className="mov-type-grid">
        {Object.entries(TYPE_META).map(([type, meta]) => {
          const Icon  = meta.icon;
          const count = movements.filter(m => (m.movement_type || '').toUpperCase() === type).length;
          const active = typeFilter === type;
          return (
            <div 
              key={type} 
              className={`mov-type-card ${active ? 'active' : ''}`}
              onClick={() => setTypeFilter(active ? 'ALL' : type)}
            >
              <div className="mov-type-hd">
                <div>
                  <div className="mov-type-label" style={{ color: active ? 'var(--cp)' : meta.color }}>
                    {meta.label}
                  </div>
                  <div className="mov-type-val">{count}</div>
                  <div className="mov-type-desc">{meta.desc}</div>
                </div>
                <div className="mov-type-icon" style={{ background: active ? '#DBEAFE' : meta.bg, color: active ? 'var(--cp)' : meta.color }}>
                  <Icon size={24} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── FILTERS BAR ── */}
      <div className="mov-filters">
        <div className="mov-period-group">
          {PERIODS.map(p => (
            <button
              key={p.key}
              className={`mov-period-btn ${period === p.key ? 'active' : ''}`}
              onClick={() => setPeriod(p.key)}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="mov-search">
          <Search size={16} color="var(--ctm)" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search drug name, reference, or user…"
            className="mov-search-input"
          />
          {search && (
            <button onClick={() => setSearch('')} className="mov-search-clear"><XCircle size={14} /></button>
          )}
        </div>

        <div className="mov-record-count">
          {filtered.length} record{filtered.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* ── ACTIVE FILTERS BANNER ── */}
      {hasActiveFilters && (
        <div className="mov-active-filters">
          <div className="mov-af-label"><Search size={16} /> Active Filters:</div>
          {typeFilter !== 'ALL' && (
            <span className="mov-af-tag" style={{ borderColor: TYPE_META[typeFilter]?.color, color: TYPE_META[typeFilter]?.color }}>
              Type: {TYPE_META[typeFilter]?.label}
            </span>
          )}
          {period !== 'all' && (
            <span className="mov-af-tag" style={{ borderColor: 'var(--cp)', color: 'var(--cp)' }}>
              Period: {PERIODS.find(p => p.key === period)?.label}
            </span>
          )}
          {search && (
            <span className="mov-af-tag">
              Search: "{search}"
            </span>
          )}
          <button className="mov-btn mov-btn-sm" onClick={clearAllFilters} style={{ marginLeft: 'auto' }}>
            Clear All
          </button>
        </div>
      )}

      {/* ── TABLE ── */}
      <div className="mov-table-wrap">
        {loading ? (
          <div className="mov-state">
            <span className="mov-spinner lg" style={{ display: 'inline-block', marginBottom: 12 }} />
            <div>Loading movement log…</div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="mov-state" style={{ background: '#F9FAFB' }}>
            <Activity size={32} color="var(--ctm)" style={{ marginBottom: 12 }} />
            <div style={{ fontWeight: 600, color: 'var(--ct1)' }}>No stock movements found</div>
            <div style={{ marginTop: 4 }}>
              {hasActiveFilters ? 'No records match the current filters.' : 'No movements have been recorded yet.'}
            </div>
            {hasActiveFilters && (
              <button className="mov-btn mov-btn-primary" onClick={clearAllFilters} style={{ marginTop: 16 }}>
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <table className="mov-table">
            <thead>
              <tr>
                {cols.map(c => (
                  <th key={c.key} onClick={() => toggleSort(c.key)} style={{ width: c.w, textAlign: c.align || 'left' }}>
                    <span style={{ display: c.align === 'right' ? 'flex' : 'inline-flex', justifyContent: c.align === 'right' ? 'flex-end' : 'flex-start' }}>
                      {c.label} <SortIcon col={c.key} />
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((m, i) => {
                const type = (m.movement_type || '').toUpperCase();
                const meta = TYPE_META[type] || { label: type, color: 'var(--ct2)', bg: 'var(--cbg)', icon: Package };
                const Icon = meta.icon;
                return (
                  <tr key={`${type}-${m.id}-${i}`}>
                    <td style={{ color: 'var(--ct2)', fontSize: 12, whiteSpace: 'nowrap' }}>
                      {m.created_at ? new Date(m.created_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>
                    <td>
                      <span className="mov-badge" style={{ background: meta.bg, color: meta.color }}>
                        <Icon size={12} /> {meta.label}
                      </span>
                    </td>
                    <td style={{ fontFamily: 'monospace', color: 'var(--ctm)' }}>
                      {m.reference_no || '—'}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{m.drug_name || '—'}</div>
                      {m.strength && <div style={{ fontSize: 11, color: 'var(--ct2)', marginTop: 2 }}>{m.strength}</div>}
                    </td>
                    <td style={{ color: 'var(--ct2)' }}>
                      {m.batch_no || '—'}
                    </td>
                    <td style={{ color: 'var(--ct2)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={m.remarks || ''}>
                      {m.remarks || '—'}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {m.quantity_in ? (
                        <span style={{ color: 'var(--cok)', fontWeight: 600 }}>
                          +{Number(m.quantity_in).toLocaleString()}
                        </span>
                      ) : <span style={{ color: 'var(--cborder)' }}>—</span>}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {m.quantity_out ? (
                        <span style={{ color: 'var(--cdanger)', fontWeight: 600 }}>
                          -{Number(m.quantity_out).toLocaleString()}
                        </span>
                      ) : <span style={{ color: 'var(--cborder)' }}>—</span>}
                    </td>
                    <td style={{ color: 'var(--ct2)' }}>
                      {m.performed_by || '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={6} style={{ textTransform: 'uppercase', letterSpacing: '.03em', fontSize: 11, color: 'var(--ct2)' }}>
                  Total — {filtered.length} movements
                </td>
                <td style={{ color: 'var(--cok)', textAlign: 'right' }}>
                  +{totalIn.toLocaleString()}
                </td>
                <td style={{ color: 'var(--cdanger)', textAlign: 'right' }}>
                  -{totalOut.toLocaleString()}
                </td>
                <td style={{ color: 'var(--ctm)', fontSize: 12 }}>
                  Net: {(totalIn - totalOut) >= 0 ? '+' : ''}{(totalIn - totalOut).toLocaleString()}
                </td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>
    </div>
  );
};

export default StoreStockMovement;
