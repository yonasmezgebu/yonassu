import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Search, RefreshCw, Plus, AlertTriangle, ChevronDown, ChevronUp, Edit2, X } from 'lucide-react';
import { NotifStore } from './StoreHomeNew';

const G = {
  forest: '#228B22', dark: '#1B5E20', emerald: '#2E8B57', leaf: '#4CAF50',
  sage: '#A5D6A7', olive: '#6B8E23', mint: '#98FF98',
  brown: '#8D6E63', sky: '#87CEEB', white: '#FFFFFF', lightGray: '#F5F5F5',
  darkGray: '#424242', orange: '#FF9800', red: '#F44336',
};

const API = '/api/v1/store-inventory';
function hdrs() {
  return { 'Content-Type': 'application/json', Authorization: 'Bearer ' + (localStorage.getItem('token') || '') };
}

async function updateInventoryItem(id, data) {
  const r = await fetch(API + '/inventory/' + id, { method: 'PUT', headers: hdrs(), body: JSON.stringify(data) });
  if (!r.ok) throw new Error((await r.json()).message || 'Failed to update');
  return r.json();
}

/* ── Expiry helpers ─────────────────────────────────────────────── */
function expiryStatus(dateStr, nearDays = 90) {
  if (!dateStr) return 'none';
  const exp = new Date(dateStr); exp.setHours(0, 0, 0, 0);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const diff = Math.floor((exp - today) / 86400000);
  if (diff < 0)   return 'expired';
  if (diff <= nearDays) return 'near';
  return 'ok';
}
function daysUntilExpiry(dateStr) {
  if (!dateStr) return null;
  const exp = new Date(dateStr); exp.setHours(0, 0, 0, 0);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  return Math.floor((exp - today) / 86400000);
}

const StoreStockList = () => {
  const navigate = useNavigate();
  const [rows, setRows]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [filter, setFilter]   = useState('all'); // all | low | expired | near
  const [sort, setSort]       = useState({ col: 'drug_name', dir: 'asc' });
  const [stats, setStats]     = useState({ total_items: 0, total_quantity: 0, total_value: 0, low_stock_count: 0 });
  const [editModal, setEditModal] = useState({ open: false, data: null, saving: false });
  const [pendingItems, setPendingItems] = useState(new Set()); // ids awaiting CEO approval

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter === 'low') params.set('low_stock', 'true');
      if (search) params.set('search', search);
      const r = await fetch(`${API}/inventory?${params}`, { headers: hdrs() });
      const d = await r.json();
      if (!r.ok) throw new Error(d.message);
      setRows(d.data || []);
      setStats({
        total_items:     d.total_items     || 0,
        total_quantity:  d.total_quantity  || 0,
        total_value:     d.total_value     || 0,
        low_stock_count: d.low_stock_count || 0,
      });
    } catch (e) {
      NotifStore.push('Failed to load inventory: ' + e.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [filter, search]);

  useEffect(() => { const t = setTimeout(load, 400); return () => clearTimeout(t); }, [load]);

  /* ── derived counts ── */
  const expiredCount = rows.filter(r => expiryStatus(r.expiry_date, r.near_expiry_days) === 'expired').length;
  const nearCount    = rows.filter(r => expiryStatus(r.expiry_date, r.near_expiry_days) === 'near').length;

  /* ── filtering ── */
  const filtered = rows.filter(row => {
    if (filter === 'expired') return expiryStatus(row.expiry_date, row.near_expiry_days) === 'expired';
    if (filter === 'near')    return expiryStatus(row.expiry_date, row.near_expiry_days) === 'near';
    if (filter === 'low')     return Number(row.quantity) <= Number(row.min_level || 0);
    return true;
  });

  /* ── sorting ── */
  const sorted = [...filtered].sort((a, b) => {
    const va = a[sort.col] ?? '', vb = b[sort.col] ?? '';
    if (typeof va === 'number') return sort.dir === 'asc' ? va - vb : vb - va;
    return sort.dir === 'asc'
      ? String(va).localeCompare(String(vb))
      : String(vb).localeCompare(String(va));
  });

  const toggleSort = col => setSort(s => ({ col, dir: s.col === col && s.dir === 'asc' ? 'desc' : 'asc' }));
  const SortIcon = ({ col }) => sort.col === col
    ? (sort.dir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)
    : null;

  /* ── column definitions ── */
  const cols = [
    { key: 'drug_name',   label: 'Drug Name' },
    { key: 'strength',    label: 'Strength' },
    { key: 'category',    label: 'Category' },
    { key: 'batch_no',    label: 'Batch No' },
    { key: 'unit',        label: 'Unit' },
    { key: 'unit_price',  label: 'Price (ETB)' },
    { key: 'quantity',    label: 'Qty in Store' },
    { key: 'min_level',   label: 'Min Level' },
    { key: 'expiry_date', label: 'Expiry Date' },
    { key: 'status',      label: 'Status' },
    { key: 'action',      label: 'Action' },
  ];

  const totalValue = sorted.reduce((s, r) => s + Number(r.quantity) * Number(r.unit_price || 0), 0);

  /* ── expiry badge renderer ── */
  const ExpiryCell = ({ dateStr }) => {
    if (!dateStr) return <span style={{ color: G.brown, fontStyle: 'italic' }}>—</span>;
    const status = expiryStatus(dateStr);
    const days   = daysUntilExpiry(dateStr);
    const fmt    = new Date(dateStr).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' });

    if (status === 'expired') return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <span style={{ fontWeight: 900, color: G.red }}>{fmt}</span>
        <span style={{ background: G.red, color: G.white, fontSize: 10, fontWeight: 900, padding: '2px 7px', display: 'inline-block', letterSpacing: 0.5 }}>
          EXPIRED {Math.abs(days)}d AGO
        </span>
      </div>
    );
    if (status === 'near') return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <span style={{ fontWeight: 800, color: G.orange }}>{fmt}</span>
        <span style={{ background: G.orange, color: G.white, fontSize: 10, fontWeight: 900, padding: '2px 7px', display: 'inline-block', letterSpacing: 0.5 }}>
          EXPIRES IN {days}d
        </span>
      </div>
    );
    return <span style={{ fontWeight: 600, color: G.forest }}>{fmt}</span>;
  };

  function rowBg(row, i) {
    const status = expiryStatus(row.expiry_date, row.near_expiry_days);
    if (status === 'expired') return '#FFEBEE';
    if (status === 'near')    return '#FFF8E1';
    return i % 2 === 0 ? G.white : '#F1F8F1';
  }

  const handleUpdateStock = async (e) => {
    e.preventDefault();
    const d = editModal.data;
    setEditModal(p => ({ ...p, saving: true }));
    try {
      const res = await updateInventoryItem(d.id, {
        drug_name: d.drug_name || d.name,
        strength: d.strength,
        unit: d.unit,
        unit_price: Number(d.unit_price) || 0,
        category: d.category,
        classification: d.classification,
        therapeutic_use: d.therapeutic_use,
        requires_prescription: !!d.requires_prescription,
        batch_no: d.batch_no,
        expiry_date: d.expiry_date || null,
        near_expiry_days: Number(d.near_expiry_days) || 90,
        min_level: Number(d.min_level) || 0,
        max_level: Number(d.max_level) || 0,
        quantity: Number(d.quantity) || 0,
        storage_location: d.storage_location
      });
      NotifStore.push(res.message || 'Update submitted for CEO approval', 'success');
      setPendingItems(prev => new Set([...prev, d.id]));
      setEditModal({ open: false, data: null, saving: false });
      // Don't reload — the pending badge will show immediately
    } catch (err) {
      NotifStore.push(err.message || 'Failed to update item', 'error');
      setEditModal(p => ({ ...p, saving: false }));
    }
  };

  const handlePrint = () => {
    const pw = window.open('', '_blank');
    if (!pw) { NotifStore.push('Allow popups to print.', 'error'); return; }
    const dt = new Date().toLocaleString();
    const TH = (t) => `<th style="padding:7px 10px;text-align:left;font-size:10px;text-transform:uppercase;border:1px solid #aaa;background:#1B5E20;color:#fff;">${t}</th>`;
    const TD = (t) => `<td style="padding:6px 10px;border:1px solid #ddd;font-size:11px;word-break:break-word;">${t ?? "---"}</td>`;
    const fmt2 = (n) => parseFloat(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2 });
    
    const grand = sorted.reduce((s, r) => s + Number(r.quantity) * Number(r.unit_price || 0), 0);
    
    let body = `<p style="font-size:15px;font-weight:bold;color:#1B5E20;margin-bottom:10px">Total Value: ETB ${fmt2(grand)} | Total Items: ${sorted.length}</p>`;
    
    body += `<table style="width:100%;border-collapse:collapse"><thead><tr>${TH("#")}${TH("Drug Name")}${TH("Strength")}${TH("Category")}${TH("Batch No")}${TH("Unit")}${TH("Price (ETB)")}${TH("Qty")}${TH("Min Level")}${TH("Expiry Date")}${TH("Status")}</tr></thead><tbody>`;
    
    sorted.forEach((row, i) => {
      const expStat = expiryStatus(row.expiry_date, row.near_expiry_days);
      const isExpired = expStat === 'expired';
      const isNear = expStat === 'near';
      const isOut = Number(row.quantity) === 0;
      const isLow = Number(row.quantity) <= Number(row.min_level || 0);
      
      let statusHtml = '';
      if (isExpired) statusHtml = `<span style="color:#d32f2f;font-weight:bold">EXPIRED</span>`;
      else if (isNear) statusHtml = `<span style="color:#f57c00;font-weight:bold">NEAR EXPIRY</span>`;
      else if (isOut) statusHtml = `<span style="color:#d32f2f;font-weight:bold">OUT OF STOCK</span>`;
      else if (isLow) statusHtml = `<span style="color:#f57c00;font-weight:bold">LOW STOCK</span>`;
      else statusHtml = `<span style="color:#388e3c;font-weight:bold">IN STOCK</span>`;

      body += `<tr>${TD(i + 1)}${TD(row.drug_name || row.name)}${TD(row.strength)}${TD(row.category)}${TD(row.batch_no)}${TD(row.unit)}${TD(fmt2(row.unit_price))}${TD(Number(row.quantity).toLocaleString())}${TD(row.min_level)}${TD(row.expiry_date ? new Date(row.expiry_date).toLocaleDateString() : '---')}${TD(statusHtml)}</tr>`;
    });
    body += "</tbody></table>";

    pw.document.write(`<html><head><title>Pharmacy Stock Catalog</title><style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:Arial;font-size:12px;padding:20px}h1{color:#1B5E20;border-bottom:3px solid #228B22;padding-bottom:6px;margin-bottom:4px;font-size:18px}h3{font-size:13px}.meta{font-size:11px;color:#555;margin-bottom:14px}tr:nth-child(even)td{background:#f0fdf4}tr{page-break-inside:avoid}@page{margin:10mm;size:A4 landscape}</style></head><body><h1>Pharmacy Stock Catalog</h1><div class="meta">Generated: ${dt} | Sutana University</div>${body}<script>window.onload=function(){window.print();}</script></body></html>`);
    pw.document.close();
  };

  const FILTERS = [
    { key: 'all',     label: 'All Stock' },
    { key: 'low',     label: `⚠ Low Stock${stats.low_stock_count ? ` (${stats.low_stock_count})` : ''}` },
    { key: 'near',    label: `🟡 Near Expiry${nearCount ? ` (${nearCount})` : ''}` },
    { key: 'expired', label: `🔴 Expired${expiredCount ? ` (${expiredCount})` : ''}` },
  ];

  return (
    <div style={{ background: G.lightGray, minHeight: '100vh', width: '100%', fontFamily: "'Inter', sans-serif", paddingBottom: 60 }}>
      <style>{`
        @keyframes spin { 100% { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }
        @keyframes pendingPulse { 0%,100%{opacity:1;box-shadow:2px 2px 0 #D97706} 50%{opacity:.7;box-shadow:2px 2px 0 #F59E0B,0 0 8px rgba(245,158,11,.4)} }
        .stock-row:hover td { background: #E8F5E9 !important; }
        @media (max-width:768px) { .top-bar{flex-direction:column!important} .stat-grid{grid-template-columns:1fr 1fr!important} }
      `}</style>

      {/* ── HEADER ── */}
      <div style={{ background: `linear-gradient(135deg, ${G.dark} 0%, ${G.forest} 60%, ${G.emerald} 100%)`, padding: '24px 36px', color: G.white, borderBottom: `4px solid ${G.dark}`, boxShadow: `0 4px 0 ${G.dark}` }}>
        <div className="top-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ background: G.mint, padding: 8, border: `2px solid ${G.white}`, boxShadow: `3px 3px 0 ${G.dark}` }}>
              <Package size={24} color={G.dark} />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900 }}>Stock Catalog</h1>
              <p style={{ margin: 0, fontSize: 12, opacity: 0.8 }}>Live inventory with expiry tracking</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={handlePrint} style={{ background: '#fff', color: G.dark, padding: '9px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 900, fontSize: 13, textTransform: 'uppercase', border: 'none', boxShadow: `3px 3px 0 ${G.sage}` }}>
              Print Catalog
            </button>
            <button onClick={() => navigate('/pharmacy-store/add-new-stock')} style={{ background: G.leaf, border: `2px solid ${G.dark}`, boxShadow: `3px 3px 0 ${G.dark}`, color: G.white, padding: '9px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 800, fontSize: 13, fontFamily: "'Inter',sans-serif" }}>
              <Plus size={16} /> Add New Stock
            </button>
            <button onClick={load} style={{ background: 'rgba(255,255,255,.15)', border: `2px solid rgba(255,255,255,.5)`, color: G.white, padding: '9px 14px', cursor: 'pointer', fontFamily: "'Inter',sans-serif" }}>
              <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            </button>
          </div>
        </div>
      </div>

      <div style={{ padding: '24px 36px', boxSizing: 'border-box' }}>

        {/* ── EXPIRY ALERT BANNER ── */}
        {(expiredCount > 0 || nearCount > 0) && (
          <div style={{ display: 'grid', gridTemplateColumns: expiredCount && nearCount ? '1fr 1fr' : '1fr', gap: 14, marginBottom: 20 }}>
            {expiredCount > 0 && (
              <div style={{ background: '#FFEBEE', border: `3px solid ${G.red}`, boxShadow: `4px 4px 0 ${G.red}`, padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <AlertTriangle size={24} color={G.red} style={{ animation: 'pulse 1.5s ease infinite', flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 900, color: G.red, textTransform: 'uppercase', letterSpacing: 0.5 }}>🔴 {expiredCount} Drug{expiredCount > 1 ? 's' : ''} EXPIRED</div>
                  <div style={{ fontSize: 12, color: '#B71C1C', fontWeight: 600, marginTop: 2 }}>These items must be removed from stock immediately and reported.</div>
                </div>
              </div>
            )}
            {nearCount > 0 && (
              <div style={{ background: '#FFF8E1', border: `3px solid ${G.orange}`, boxShadow: `4px 4px 0 ${G.orange}`, padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <AlertTriangle size={24} color={G.orange} style={{ flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 900, color: G.orange, textTransform: 'uppercase', letterSpacing: 0.5 }}>🟡 {nearCount} Drug{nearCount > 1 ? 's' : ''} Near Expiry</div>
                  <div style={{ fontSize: 12, color: '#E65100', fontWeight: 600, marginTop: 2 }}>These items have hit their near-expiry threshold — prioritize dispensing or return.</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── STAT CARDS ── */}
        <div className="stat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 22 }}>
          {[
            { label: 'Drug Types',   value: stats.total_items,  color: G.forest },
            { label: 'Total Qty',    value: Number(stats.total_quantity).toLocaleString(), color: G.emerald },
            { label: 'Total Value',  value: 'ETB ' + Number(stats.total_value).toLocaleString(undefined, { minimumFractionDigits: 2 }), color: G.dark },
            { label: 'Low Stock',    value: stats.low_stock_count, color: G.orange },
          ].map(s => (
            <div key={s.label} style={{ background: G.white, border: `3px solid ${G.dark}`, boxShadow: `4px 4px 0 ${s.color}`, padding: '14px 18px' }}>
              <div style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1, color: s.color }}>{s.label}</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: G.dark, marginTop: 4 }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* ── FILTER BAR ── */}
        <div style={{ background: G.white, border: `3px solid ${G.dark}`, boxShadow: `4px 4px 0 ${G.dark}`, padding: 14, marginBottom: 20, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 200, background: G.lightGray, border: `2px solid ${G.dark}`, padding: '8px 12px' }}>
            <Search size={16} color={G.olive} />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by drug name…"
              style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 13, fontFamily: "'Inter',sans-serif", color: G.darkGray, width: '100%' }}
            />
          </div>
          <div style={{ display: 'flex', gap: 0, border: `2px solid ${G.dark}` }}>
            {FILTERS.map((f, idx) => (
              <button key={f.key} onClick={() => setFilter(f.key)} style={{
                padding: '8px 14px', background: filter === f.key ? G.dark : G.white,
                color: filter === f.key ? G.white : G.darkGray,
                border: 'none', borderLeft: idx > 0 ? `2px solid ${G.dark}` : 'none',
                cursor: 'pointer', fontWeight: 800, fontSize: 12,
                fontFamily: "'Inter',sans-serif", whiteSpace: 'nowrap',
              }}>
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── TABLE ── */}
        <div style={{ background: G.white, border: `3px solid ${G.dark}`, boxShadow: `6px 6px 0 ${G.dark}` }}>
          {loading ? (
            <div style={{ padding: 60, textAlign: 'center' }}>
              <div style={{ width: 36, height: 36, border: `3px solid ${G.sage}`, borderTop: `3px solid ${G.forest}`, borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
              <div style={{ color: G.forest, fontWeight: 800 }}>Loading inventory…</div>
            </div>
          ) : sorted.length === 0 ? (
            <div style={{ padding: 60, textAlign: 'center', color: G.sage, fontWeight: 800 }}>
              No items found{filter !== 'all' ? ` for filter: "${filter}"` : ' in store inventory'}.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 1100 }}>
                <thead>
                  <tr style={{ background: G.dark, color: G.white }}>
                    <th style={{ padding: '13px 12px', fontWeight: 900, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, whiteSpace: 'nowrap', textAlign: 'left' }}>#</th>
                    {cols.map(c => c.key !== 'action' ? (
                      <th key={c.key} onClick={() => toggleSort(c.key)} style={{ padding: '13px 12px', fontWeight: 900, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, cursor: 'pointer', whiteSpace: 'nowrap', textAlign: 'left', userSelect: 'none' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>{c.label} <SortIcon col={c.key} /></span>
                      </th>
                    ) : (
                      <th key={c.key} style={{ padding: '13px 12px', fontWeight: 900, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, textAlign: 'center' }}>{c.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((row, i) => {
                    const isLow     = Number(row.quantity) <= Number(row.min_level || 0);
                    const isOut     = Number(row.quantity) === 0;
                    const expStat   = expiryStatus(row.expiry_date, row.near_expiry_days);
                    const isExpired = expStat === 'expired';
                    const isNear    = expStat === 'near';
                    const totalVal  = Number(row.quantity) * Number(row.unit_price || 0);

                    /* row left border color shows most critical alert */
                    const leftBorder = isExpired ? `5px solid ${G.red}`
                      : isNear ? `5px solid ${G.orange}`
                      : isLow  ? `5px solid ${G.orange}`
                      : `5px solid transparent`;

                    return (
                      <tr key={row.id || i} className="stock-row" style={{ background: rowBg(row, i), borderBottom: `1px solid ${G.sage}`, borderLeft: leftBorder }}>
                        <td style={{ padding: '11px 12px', fontWeight: 700, color: G.olive }}>{i + 1}</td>

                        {/* Drug Name */}
                        <td style={{ padding: '11px 12px', fontWeight: 900, color: G.dark }}>
                          {row.drug_name || row.name}
                          {isExpired && (
                            <span style={{ marginLeft: 7, background: G.red, color: G.white, fontSize: 9, fontWeight: 900, padding: '1px 6px', verticalAlign: 'middle', letterSpacing: 0.5 }}>EXPIRED</span>
                          )}
                          {!isExpired && isNear && (
                            <span style={{ marginLeft: 7, background: G.orange, color: G.white, fontSize: 9, fontWeight: 900, padding: '1px 6px', verticalAlign: 'middle', letterSpacing: 0.5 }}>NEAR EXPIRY</span>
                          )}
                        </td>

                        <td style={{ padding: '11px 12px', color: G.darkGray }}>{row.strength || '—'}</td>
                        <td style={{ padding: '11px 12px', color: G.darkGray }}>{row.category || 'Uncategorized'}</td>

                        {/* Batch No */}
                        <td style={{ padding: '11px 12px', fontWeight: 800, color: G.olive, fontFamily: 'monospace', fontSize: 12 }}>
                          {row.batch_no || <span style={{ color: G.red, fontWeight: 700, fontFamily: "'Inter',sans-serif", fontSize: 11 }}>⚠ No Batch</span>}
                        </td>

                        <td style={{ padding: '11px 12px' }}>{row.unit || '—'}</td>

                        {/* Price */}
                        <td style={{ padding: '11px 12px', fontWeight: 700, color: G.forest }}>
                          {Number(row.unit_price || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>

                        {/* Quantity */}
                        <td style={{ padding: '11px 12px', fontWeight: 900, color: isOut ? G.red : isLow ? G.orange : G.forest }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                            {(isOut || isLow) && <AlertTriangle size={13} />}
                            {Number(row.quantity).toLocaleString()}
                          </span>
                        </td>

                        <td style={{ padding: '11px 12px', color: G.brown }}>{row.min_level ?? 0}</td>

                        {/* Expiry Date — color coded inline */}
                        <td style={{ padding: '11px 12px' }}>
                          <ExpiryCell dateStr={row.expiry_date} nearDays={row.near_expiry_days} />
                        </td>

                        {/* Status badge */}
                        <td style={{ padding: '11px 12px' }}>
                          {isExpired ? (
                            <span style={{ display: 'inline-block', padding: '3px 10px', fontWeight: 900, fontSize: 11, border: `2px solid ${G.red}`, color: G.white, background: G.red, letterSpacing: 0.5 }}>EXPIRED</span>
                          ) : isNear ? (
                            <span style={{ display: 'inline-block', padding: '3px 10px', fontWeight: 900, fontSize: 11, border: `2px solid ${G.orange}`, color: G.white, background: G.orange, letterSpacing: 0.5 }}>NEAR EXPIRY</span>
                          ) : isOut ? (
                            <span style={{ display: 'inline-block', padding: '3px 10px', fontWeight: 900, fontSize: 11, border: `2px solid ${G.red}`, color: G.red, background: '#FFEBEE', letterSpacing: 0.5 }}>OUT OF STOCK</span>
                          ) : isLow ? (
                            <span style={{ display: 'inline-block', padding: '3px 10px', fontWeight: 900, fontSize: 11, border: `2px solid ${G.orange}`, color: G.orange, background: '#FFF3E0', letterSpacing: 0.5 }}>LOW STOCK</span>
                          ) : (
                            <span style={{ display: 'inline-block', padding: '3px 10px', fontWeight: 900, fontSize: 11, border: `2px solid ${G.forest}`, color: G.forest, background: '#E8F5E9', letterSpacing: 0.5 }}>IN STOCK</span>
                          )}
                        </td>
                        
                        {/* Action / Update */}
                        <td style={{ padding: '11px 12px', textAlign: 'center' }}>
                          {pendingItems.has(row.id) ? (
                             <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                               <span style={{
                                 display: 'inline-flex', alignItems: 'center', gap: 6,
                                 background: '#FFF8E1', border: '2px solid #F59E0B',
                                 boxShadow: '2px 2px 0 #D97706',
                                 color: '#92400E', padding: '5px 10px',
                                 fontSize: 10, fontWeight: 900, letterSpacing: 0.4,
                                 animation: 'pendingPulse 1.8s ease-in-out infinite'
                               }}>
                                 ⏳ AWAITING CEO APPROVAL
                               </span>
                             </div>
                           ) : (
                             <button onClick={() => setEditModal({ open: true, data: { ...row, expiry_date: row.expiry_date ? row.expiry_date.split('T')[0] : '' }, saving: false })} style={{ background: G.white, border: `2px solid ${G.dark}`, boxShadow: `2px 2px 0 ${G.dark}`, color: G.dark, padding: '6px 10px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 900, fontSize: 11, textTransform: 'uppercase' }}>
                               <Edit2 size={13} /> Edit
                             </button>
                           )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ background: G.dark, color: G.white }}>
                    <td colSpan={7} style={{ padding: '12px 14px', fontWeight: 900, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
                      Total — {sorted.length} Item{sorted.length !== 1 ? 's' : ''}
                    </td>
                    <td style={{ padding: '12px 14px', fontWeight: 900, fontSize: 14, color: G.mint }}>
                      {sorted.reduce((s, r) => s + Number(r.quantity), 0).toLocaleString()}
                    </td>
                    <td colSpan={4} style={{ padding: '12px 14px', fontWeight: 900, fontSize: 13, color: G.sage, textAlign: 'right' }}>
                      Value: ETB {totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

      </div>

      {/* ── EDIT MODAL ── */}
      {editModal.open && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20 }}>
          <div style={{ background: G.white, border: `4px solid ${G.dark}`, boxShadow: `8px 8px 0 ${G.dark}`, width: '100%', maxWidth: 750, animation: 'slideDown 0.3s ease', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ background: G.dark, color: G.white, padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 10 }}>
              <span style={{ fontWeight: 900, fontSize: 14, textTransform: 'uppercase', letterSpacing: 1 }}>Update Complete Record</span>
              <X size={20} style={{ cursor: 'pointer' }} onClick={() => setEditModal({ open: false, data: null })} />
            </div>
            <form onSubmit={handleUpdateStock} style={{ padding: 24 }}>
              
              <div style={{ background: '#F1F8F1', borderLeft: `4px solid ${G.forest}`, padding: '10px 14px', marginBottom: 20, fontSize: 13, fontWeight: 700, color: G.dark }}>
                Drug & Catalog Details
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 24 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 900, color: G.dark, textTransform: 'uppercase', letterSpacing: .5, display: 'block', marginBottom: 4 }}>Drug Name</label>
                  <input value={editModal.data.drug_name || editModal.data.name || ''} onChange={e => setEditModal(p => ({...p, data: {...p.data, drug_name: e.target.value}}))} required style={{ width: '100%', padding: '8px', border: `2px solid ${G.dark}`, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 900, color: G.dark, textTransform: 'uppercase', letterSpacing: .5, display: 'block', marginBottom: 4 }}>Category</label>
                  <select value={editModal.data.category || ''} onChange={e => setEditModal(p => ({...p, data: {...p.data, category: e.target.value}}))} style={{ width: '100%', padding: '8px', border: `2px solid ${G.dark}`, fontSize: 13, outline: 'none', boxSizing: 'border-box' }}>
                    <option value="">Select Category</option>
                    <option value="Tablet">Tablet</option>
                    <option value="Capsule">Capsule</option>
                    <option value="Syrup">Syrup</option>
                    <option value="Injection">Injection</option>
                    <option value="Ointment">Ointment</option>
                    <option value="Drops">Drops</option>
                    <option value="Inhaler">Inhaler</option>
                    <option value="Suppository">Suppository</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 900, color: G.dark, textTransform: 'uppercase', letterSpacing: .5, display: 'block', marginBottom: 4 }}>Strength</label>
                  <input value={editModal.data.strength || ''} onChange={e => setEditModal(p => ({...p, data: {...p.data, strength: e.target.value}}))} placeholder="e.g. 500mg" style={{ width: '100%', padding: '8px', border: `2px solid ${G.dark}`, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 900, color: G.dark, textTransform: 'uppercase', letterSpacing: .5, display: 'block', marginBottom: 4 }}>Unit</label>
                  <input value={editModal.data.unit || ''} onChange={e => setEditModal(p => ({...p, data: {...p.data, unit: e.target.value}}))} placeholder="e.g. Box, Strip" style={{ width: '100%', padding: '8px', border: `2px solid ${G.dark}`, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 900, color: G.dark, textTransform: 'uppercase', letterSpacing: .5, display: 'block', marginBottom: 4 }}>Unit Price (ETB)</label>
                  <input type="number" step="0.01" min="0" value={editModal.data.unit_price || ''} onChange={e => setEditModal(p => ({...p, data: {...p.data, unit_price: e.target.value}}))} required style={{ width: '100%', padding: '8px', border: `2px solid ${G.dark}`, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: '8px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, fontWeight: 700, color: G.dark }}>
                    <input type="checkbox" checked={editModal.data.requires_prescription || false} onChange={e => setEditModal(p => ({...p, data: {...p.data, requires_prescription: e.target.checked}}))} style={{ width: 16, height: 16, accentColor: G.forest }} />
                    Requires Prescription
                  </label>
                </div>
              </div>

              <div style={{ background: '#FFF8E1', borderLeft: `4px solid ${G.orange}`, padding: '10px 14px', marginBottom: 20, fontSize: 13, fontWeight: 700, color: G.dark }}>
                Inventory & Batch Details
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 900, color: G.dark, textTransform: 'uppercase', letterSpacing: .5, display: 'block', marginBottom: 4 }}>Batch No</label>
                  <input value={editModal.data.batch_no || ''} onChange={e => setEditModal(p => ({...p, data: {...p.data, batch_no: e.target.value}}))} required style={{ width: '100%', padding: '8px', border: `2px solid ${G.dark}`, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 900, color: G.dark, textTransform: 'uppercase', letterSpacing: .5, display: 'block', marginBottom: 4 }}>Quantity in Stock</label>
                  <input type="number" min="0" value={editModal.data.quantity || 0} onChange={e => setEditModal(p => ({...p, data: {...p.data, quantity: e.target.value}}))} required style={{ width: '100%', padding: '8px', border: `2px solid ${G.dark}`, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 900, color: G.dark, textTransform: 'uppercase', letterSpacing: .5, display: 'block', marginBottom: 4 }}>Expiry Date</label>
                  <input type="date" value={editModal.data.expiry_date || ''} onChange={e => setEditModal(p => ({...p, data: {...p.data, expiry_date: e.target.value}}))} required style={{ width: '100%', padding: '8px', border: `2px solid ${G.dark}`, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 900, color: G.dark, textTransform: 'uppercase', letterSpacing: .5, display: 'block', marginBottom: 4 }}>Alert Days Before Expiry</label>
                  <input type="number" min="1" value={editModal.data.near_expiry_days || 90} onChange={e => setEditModal(p => ({...p, data: {...p.data, near_expiry_days: e.target.value}}))} required style={{ width: '100%', padding: '8px', border: `2px solid ${G.dark}`, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 900, color: G.dark, textTransform: 'uppercase', letterSpacing: .5, display: 'block', marginBottom: 4 }}>Storage Location</label>
                  <input value={editModal.data.storage_location || ''} onChange={e => setEditModal(p => ({...p, data: {...p.data, storage_location: e.target.value}}))} style={{ width: '100%', padding: '8px', border: `2px solid ${G.dark}`, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 900, color: G.dark, textTransform: 'uppercase', letterSpacing: .5, display: 'block', marginBottom: 4 }}>Min Level</label>
                  <input type="number" min="0" value={editModal.data.min_level || 0} onChange={e => setEditModal(p => ({...p, data: {...p.data, min_level: e.target.value}}))} style={{ width: '100%', padding: '8px', border: `2px solid ${G.dark}`, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 900, color: G.dark, textTransform: 'uppercase', letterSpacing: .5, display: 'block', marginBottom: 4 }}>Max Level</label>
                  <input type="number" min="0" value={editModal.data.max_level || 0} onChange={e => setEditModal(p => ({...p, data: {...p.data, max_level: e.target.value}}))} style={{ width: '100%', padding: '8px', border: `2px solid ${G.dark}`, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 30 }}>
                <button type="button" onClick={() => setEditModal({ open: false, data: null })} style={{ background: G.white, color: G.darkGray, border: `2px solid ${G.dark}`, padding: '10px 16px', fontWeight: 900, cursor: 'pointer', fontSize: 12, textTransform: 'uppercase' }}>Cancel</button>
                <button type="submit" disabled={editModal.saving} style={{ background: editModal.saving ? G.olive : G.forest, color: G.white, border: `2px solid ${G.dark}`, boxShadow: `3px 3px 0 ${G.dark}`, padding: '10px 20px', fontWeight: 900, cursor: editModal.saving ? 'not-allowed' : 'pointer', fontSize: 12, textTransform: 'uppercase' }}>
                  {editModal.saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

/* ── Expiry Cell Component ───────────────────────────────────────── */
function ExpiryCell({ dateStr, nearDays }) {
  if (!dateStr) return <span style={{ color: '#8D6E63', fontStyle: 'italic' }}>—</span>;
  const status = expiryStatus(dateStr, nearDays);
  const days   = daysUntilExpiry(dateStr);
  const fmt    = new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  if (status === 'expired') return (
    <div>
      <div style={{ fontWeight: 900, color: '#F44336' }}>{fmt}</div>
      <div style={{ background: '#F44336', color: '#fff', fontSize: 10, fontWeight: 900, padding: '1px 6px', marginTop: 3, display: 'inline-block', letterSpacing: 0.5 }}>
        EXPIRED {Math.abs(days)}d AGO
      </div>
    </div>
  );
  if (status === 'near') return (
    <div>
      <div style={{ fontWeight: 800, color: '#FF9800' }}>{fmt}</div>
      <div style={{ background: '#FF9800', color: '#fff', fontSize: 10, fontWeight: 900, padding: '1px 6px', marginTop: 3, display: 'inline-block', letterSpacing: 0.5 }}>
        EXPIRES IN {days}d
      </div>
    </div>
  );
  return <span style={{ fontWeight: 600, color: '#228B22' }}>{fmt}</span>;
}

export default StoreStockList;
