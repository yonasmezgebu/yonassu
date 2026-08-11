import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Search, RefreshCw, Plus, AlertTriangle, ChevronDown, ChevronUp, Edit2, X } from 'lucide-react';
import { NotifStore } from './StoreHomeNew';

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
  if (diff < 0)       return 'expired';
  if (diff <= nearDays) return 'near';
  return 'ok';
}
function daysUntilExpiry(dateStr) {
  if (!dateStr) return null;
  const exp = new Date(dateStr); exp.setHours(0, 0, 0, 0);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  return Math.floor((exp - today) / 86400000);
}

/* ── Enterprise CSS ───────────────────────────────────────────────── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

  :root {
    --cp: #2563EB;
    --cp-h: #1D4ED8;
    --cbg: #F5F6FA;
    --ccard: #FFFFFF;
    --cborder: #E5E7EB;
    --ct1: #111827;
    --ct2: #6B7280;
    --ctm: #9CA3AF;
    --cok: #16A34A;
    --cok-bg: #DCFCE7;
    --cdanger: #DC2626;
    --cdanger-bg: #FEE2E2;
    --cwarn: #D97706;
    --cwarn-bg: #FEF3C7;
    --cinfo: #0284C7;
    --cinfo-bg: #E0F2FE;
    --gold: #F59E0B;
    --gold-text: #111827;
  }

  .ssl-page {
    box-sizing: border-box;
    margin: 10px auto;
    width: calc(100% - 20px);
    max-width: 1600px;
    min-height: calc(100vh - 20px);
    padding: 24px;
    background: var(--cbg);
    font-family: 'Inter', 'Segoe UI', Roboto, -apple-system, sans-serif;
    color: var(--ct1);
    line-height: 1.5;
    padding-bottom: 48px;
  }
  @media (max-width: 1024px) { .ssl-page { margin: 6px auto; width: calc(100% - 12px); padding: 16px; } }
  @media (max-width: 480px)  { .ssl-page { margin: 4px auto; width: calc(100% - 8px); padding: 12px; } }

  /* ── Header ── */
  .ssl-header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px; margin-bottom: 24px; }
  .ssl-title-block { display: flex; align-items: center; gap: 12px; }
  .ssl-icon-wrap { background: #EFF6FF; color: var(--cp); padding: 10px; border-radius: 10px; display: flex; }
  .ssl-page-title { font-size: clamp(22px,3vw,28px); font-weight: 600; line-height: 1.3; margin: 0; color: var(--ct1); }
  .ssl-page-sub { font-size: 12px; font-weight: 500; color: var(--ctm); margin: 2px 0 0; text-transform: uppercase; letter-spacing: 0.05em; }
  .ssl-header-btns { display: flex; gap: 8px; flex-wrap: wrap; }

  /* ── Buttons ── */
  .ssl-btn { height: 36px; padding: 0 16px; border-radius: 8px; font-size: 14px; font-weight: 500; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; border: 1px solid var(--cborder); background: var(--ccard); color: var(--ct1); font-family: inherit; transition: all 150ms ease-in-out; white-space: nowrap; min-width: 44px; justify-content: center; }
  .ssl-btn:hover:not(:disabled) { background: var(--gold); color: var(--gold-text); border-color: transparent; box-shadow: 0 4px 12px rgba(0,0,0,.10); transform: translateY(-1px); }
  .ssl-btn:disabled { opacity: .5; cursor: not-allowed; }
  .ssl-btn-primary { background: var(--cp); color: #fff; border-color: var(--cp); }
  .ssl-btn-primary:hover:not(:disabled) { background: var(--gold); color: var(--gold-text); border-color: transparent; }
  .ssl-btn-icon { width: 36px; height: 36px; padding: 0; }

  /* ── Alert banners ── */
  .ssl-alerts { display: grid; gap: 16px; margin-bottom: 24px; }
  @media (min-width: 768px) { .ssl-alerts-2 { grid-template-columns: 1fr 1fr; } }
  .ssl-alert { display: flex; align-items: flex-start; gap: 12px; padding: 14px 16px; border-radius: 10px; border: 1px solid transparent; }
  .ssl-alert-expired { background: var(--cdanger-bg); border-color: var(--cdanger); color: var(--cdanger); }
  .ssl-alert-near    { background: var(--cwarn-bg); border-color: var(--cwarn); color: var(--cwarn); }
  .ssl-alert-title { font-size: 14px; font-weight: 600; text-transform: uppercase; }
  .ssl-alert-body  { font-size: 13px; margin-top: 2px; opacity: .85; }
  @keyframes pulse  { 0%,100%{opacity:1} 50%{opacity:.5} }

  /* ── KPI cards ── */
  .ssl-kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px,1fr)); gap: 16px; margin-bottom: 24px; }
  .ssl-kpi { background: var(--ccard); border: 1px solid var(--cborder); border-radius: 10px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,.06); transition: all 150ms ease-in-out; cursor: default; }
  .ssl-kpi:hover { box-shadow: 0 4px 12px rgba(0,0,0,.09); transform: translateY(-1px); }
  .ssl-kpi-label { font-size: 12px; font-weight: 500; text-transform: uppercase; letter-spacing: .04em; color: var(--ctm); margin-bottom: 8px; }
  .ssl-kpi-val   { font-size: 26px; font-weight: 600; color: var(--ct1); line-height: 1; }

  /* ── Filter bar ── */
  .ssl-filter-bar { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 24px; align-items: center; }
  .ssl-search-wrap { position: relative; display: inline-flex; align-items: center; flex: 1 1 260px; max-width: 400px; }
  .ssl-search-icon { position: absolute; left: 11px; color: var(--ctm); pointer-events: none; }
  .ssl-search-input { height: 36px; padding: 0 12px 0 36px; border-radius: 8px; border: 1px solid var(--cborder); font-size: 14px; font-family: inherit; width: 100%; box-sizing: border-box; outline: none; transition: border-color 150ms, box-shadow 150ms; color: var(--ct1); background: var(--ccard); }
  .ssl-search-input:focus { border-color: var(--cp); box-shadow: 0 0 0 3px rgba(37,99,235,.1); }
  .ssl-ftabs { display: flex; background: var(--ccard); border: 1px solid var(--cborder); border-radius: 8px; overflow: hidden; flex-wrap: wrap; }
  .ssl-ftab { padding: 0 16px; height: 36px; display: inline-flex; align-items: center; font-size: 13px; font-weight: 500; cursor: pointer; background: transparent; border: none; border-right: 1px solid var(--cborder); transition: all 150ms; color: var(--ct2); font-family: inherit; white-space: nowrap; }
  .ssl-ftab:last-child { border-right: none; }
  .ssl-ftab:hover     { background: var(--gold); color: var(--gold-text); }
  .ssl-ftab.active    { background: var(--cp); color: #fff; }
  .ssl-ftab.active:hover { background: var(--gold); color: var(--gold-text); }

  /* ── Table ── */
  .ssl-table-wrap { background: var(--ccard); border: 1px solid var(--cborder); border-radius: 10px; box-shadow: 0 1px 3px rgba(0,0,0,.06); overflow-x: auto; }
  .ssl-table { width: 100%; border-collapse: collapse; min-width: 900px; }
  .ssl-table thead tr { background: #F9FAFB; }
  .ssl-table th { padding: 12px 16px; font-size: 12px; font-weight: 500; text-transform: uppercase; color: var(--ctm); text-align: left; letter-spacing: .04em; border-bottom: 1px solid var(--cborder); user-select: none; white-space: nowrap; }
  .ssl-table th.sortable { cursor: pointer; }
  .ssl-table th.sortable:hover { color: var(--ct1); }
  .ssl-table td { padding: 13px 16px; font-size: 14px; border-bottom: 1px solid var(--cborder); color: var(--ct1); transition: background-color 150ms; vertical-align: middle; }
  .ssl-table tbody tr:last-child td { border-bottom: none; }
  .ssl-table tbody tr:hover td { background: #F9FAFB; }
  .ssl-table tfoot td { background: #F9FAFB; border-top: 1px solid var(--cborder); font-size: 13px; font-weight: 600; padding: 12px 16px; }
  .ssl-table .right { text-align: right; }

  /* ── Badges ── */
  .ssl-badge { display: inline-flex; align-items: center; padding: 2px 10px; border-radius: 9999px; font-size: 12px; font-weight: 500; white-space: nowrap; }
  .ssl-badge-expired { background: var(--cdanger-bg); color: var(--cdanger); }
  .ssl-badge-near    { background: var(--cwarn-bg);    color: var(--cwarn); }
  .ssl-badge-out     { background: var(--cdanger-bg);  color: var(--cdanger); }
  .ssl-badge-low     { background: var(--cwarn-bg);    color: var(--cwarn); }
  .ssl-badge-in      { background: var(--cok-bg);      color: var(--cok); }

  /* ── Spinner ── */
  .ssl-spinner { display: inline-block; width: 16px; height: 16px; border-radius: 50%; border: 2.5px solid rgba(37,99,235,.2); border-top-color: var(--cp); animation: ssl-spin 700ms linear infinite; }
  .ssl-spinner.lg { width: 28px; height: 28px; border-width: 3px; }
  @keyframes ssl-spin { to { transform: rotate(360deg); } }

  /* ── Loading / Empty state ── */
  .ssl-state { padding: 64px 24px; text-align: center; color: var(--ct2); }
  .ssl-state-sub { font-size: 13px; margin-top: 12px; }

  /* ── Modal ── */
  .ssl-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.42); display: flex; align-items: center; justify-content: center; z-index: 9999; padding: 16px; }
  .ssl-modal   { background: var(--ccard); border-radius: 12px; box-shadow: 0 20px 40px rgba(0,0,0,.18); width: 100%; max-width: 760px; max-height: 92vh; display: flex; flex-direction: column; overflow: hidden; animation: ssl-modalin 150ms ease-out; }
  @keyframes ssl-modalin { from { opacity: 0; transform: scale(.96); } to { opacity: 1; transform: scale(1); } }
  .ssl-modal-hd { padding: 16px 24px; border-bottom: 1px solid var(--cborder); display: flex; justify-content: space-between; align-items: center; }
  .ssl-modal-title { font-size: 18px; font-weight: 600; margin: 0; }
  .ssl-modal-body { padding: 24px; overflow-y: auto; flex: 1; }
  .ssl-modal-ft { padding: 14px 24px; border-top: 1px solid var(--cborder); display: flex; justify-content: flex-end; gap: 10px; background: #F9FAFB; border-radius: 0 0 12px 12px; }

  /* ── Form ── */
  .ssl-sec-title { font-size: 13px; font-weight: 600; color: var(--ct1); text-transform: uppercase; letter-spacing: .04em; border-bottom: 1px solid var(--cborder); padding-bottom: 8px; margin-bottom: 16px; }
  .ssl-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
  @media (max-width: 540px) { .ssl-form-grid { grid-template-columns: 1fr; } }
  .ssl-fg { display: flex; flex-direction: column; gap: 5px; }
  .ssl-label { font-size: 12px; font-weight: 500; text-transform: uppercase; letter-spacing: .03em; color: var(--ct2); }
  .ssl-input { height: 36px; padding: 0 12px; border-radius: 8px; border: 1px solid var(--cborder); font-size: 14px; font-family: inherit; outline: none; color: var(--ct1); background: var(--ccard); transition: border-color 150ms, box-shadow 150ms; width: 100%; box-sizing: border-box; }
  .ssl-input:focus { border-color: var(--cp); box-shadow: 0 0 0 3px rgba(37,99,235,.1); }

  /* ── Pending badge animation ── */
  @keyframes pendpulse { 0%,100%{opacity:1} 50%{opacity:.55} }
  .ssl-pending { animation: pendpulse 1.8s ease-in-out infinite; }

  /* ── Batch monospace chip ── */
  .ssl-batch { font-family: 'Courier New', monospace; font-size: 12px; background: var(--cbg); padding: 2px 6px; border-radius: 4px; color: var(--ct2); }
`;

const StoreStockList = () => {
  const navigate = useNavigate();
  const [rows, setRows]           = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [filter, setFilter]       = useState('all');
  const [sort, setSort]           = useState({ col: 'drug_name', dir: 'asc' });
  const [stats, setStats]         = useState({ total_items: 0, total_quantity: 0, total_value: 0, low_stock_count: 0 });
  const [editModal, setEditModal] = useState({ open: false, data: null, saving: false });
  const [pendingItems, setPendingItems] = useState(new Set());

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

  const expiredCount = rows.filter(r => expiryStatus(r.expiry_date, r.near_expiry_days) === 'expired').length;
  const nearCount    = rows.filter(r => expiryStatus(r.expiry_date, r.near_expiry_days) === 'near').length;

  const filtered = rows.filter(row => {
    if (filter === 'expired') return expiryStatus(row.expiry_date, row.near_expiry_days) === 'expired';
    if (filter === 'near')    return expiryStatus(row.expiry_date, row.near_expiry_days) === 'near';
    if (filter === 'low')     return Number(row.quantity) <= Number(row.min_level || 0);
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    const va = a[sort.col] ?? '', vb = b[sort.col] ?? '';
    if (typeof va === 'number') return sort.dir === 'asc' ? va - vb : vb - va;
    return sort.dir === 'asc' ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va));
  });

  const toggleSort = col => setSort(s => ({ col, dir: s.col === col && s.dir === 'asc' ? 'desc' : 'asc' }));

  const SortIcon = ({ col }) => {
    if (sort.col !== col) return null;
    return sort.dir === 'asc' ? <ChevronUp size={13} /> : <ChevronDown size={13} />;
  };

  const totalValue = sorted.reduce((s, r) => s + Number(r.quantity) * Number(r.unit_price || 0), 0);

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
    } catch (err) {
      NotifStore.push(err.message || 'Failed to update item', 'error');
      setEditModal(p => ({ ...p, saving: false }));
    }
  };

  const handlePrint = () => {
    const pw = window.open('', '_blank');
    if (!pw) { NotifStore.push('Allow popups to print.', 'error'); return; }
    const dt = new Date().toLocaleString();
    const TH = t => `<th style="padding:8px 10px;text-align:left;font-size:11px;text-transform:uppercase;border-bottom:2px solid #E5E7EB;background:#F9FAFB;color:#6B7280;letter-spacing:.04em">${t}</th>`;
    const TD = t => `<td style="padding:7px 10px;border-bottom:1px solid #E5E7EB;font-size:12px;color:#111827">${t ?? '---'}</td>`;
    const fmt2 = n => parseFloat(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2 });
    const grand = sorted.reduce((s, r) => s + Number(r.quantity) * Number(r.unit_price || 0), 0);
    let body = `<p style="font-size:14px;font-weight:600;color:#111827;margin-bottom:12px">Total Value: ETB ${fmt2(grand)} &nbsp;|&nbsp; Total Items: ${sorted.length}</p>`;
    body += `<table style="width:100%;border-collapse:collapse"><thead><tr>${TH('#')}${TH('Drug Name')}${TH('Strength')}${TH('Category')}${TH('Batch No')}${TH('Unit')}${TH('Price (ETB)')}${TH('Qty')}${TH('Min Level')}${TH('Expiry Date')}${TH('Status')}</tr></thead><tbody>`;
    sorted.forEach((row, i) => {
      const expStat = expiryStatus(row.expiry_date, row.near_expiry_days);
      const isExpired = expStat === 'expired', isNear = expStat === 'near';
      const isOut = Number(row.quantity) === 0, isLow = Number(row.quantity) <= Number(row.min_level || 0);
      let st = isExpired ? `<span style="color:#DC2626;font-weight:600">EXPIRED</span>`
        : isNear ? `<span style="color:#D97706;font-weight:600">NEAR EXPIRY</span>`
        : isOut  ? `<span style="color:#DC2626;font-weight:600">OUT OF STOCK</span>`
        : isLow  ? `<span style="color:#D97706;font-weight:600">LOW STOCK</span>`
        : `<span style="color:#16A34A;font-weight:600">IN STOCK</span>`;
      body += `<tr>${TD(i+1)}${TD(row.drug_name||row.name)}${TD(row.strength)}${TD(row.category)}${TD(row.batch_no)}${TD(row.unit)}${TD(fmt2(row.unit_price))}${TD(Number(row.quantity).toLocaleString())}${TD(row.min_level)}${TD(row.expiry_date ? new Date(row.expiry_date).toLocaleDateString() : '---')}${TD(st)}</tr>`;
    });
    body += '</tbody></table>';
    pw.document.write(`<html><head><title>Pharmacy Stock Catalog</title><style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Inter',Arial,sans-serif;font-size:12px;padding:20px;color:#111827}h1{font-size:18px;font-weight:600;border-bottom:2px solid #E5E7EB;padding-bottom:8px;margin-bottom:6px}.meta{font-size:11px;color:#6B7280;margin-bottom:16px}@page{margin:10mm;size:A4 landscape}</style></head><body><h1>Pharmacy Stock Catalog</h1><div class="meta">Generated: ${dt} | Sutana University</div>${body}<script>window.onload=function(){window.print();}<\/script></body></html>`);
    pw.document.close();
  };

  const FILTERS = [
    { key: 'all',     label: 'All Stock' },
    { key: 'low',     label: `⚠ Low Stock${stats.low_stock_count ? ` (${stats.low_stock_count})` : ''}` },
    { key: 'near',    label: `🟡 Near Expiry${nearCount ? ` (${nearCount})` : ''}` },
    { key: 'expired', label: `🔴 Expired${expiredCount ? ` (${expiredCount})` : ''}` },
  ];

  const setField = key => e => setEditModal(p => ({ ...p, data: { ...p.data, [key]: e.target.value } }));
  const setCheck = key => e => setEditModal(p => ({ ...p, data: { ...p.data, [key]: e.target.checked } }));

  return (
    <div className="ssl-page">
      <style>{CSS}</style>

      {/* ── HEADER ── */}
      <div className="ssl-header">
        <div className="ssl-title-block">
          <div className="ssl-icon-wrap">
            <Package size={24} color="var(--cp)" />
          </div>
          <div>
            <h1 className="ssl-page-title">Stock Catalog</h1>
            <p className="ssl-page-sub">Live inventory with expiry tracking</p>
          </div>
        </div>
        <div className="ssl-header-btns">
          <button onClick={handlePrint} className="ssl-btn">Print Catalog</button>
          <button onClick={() => navigate('/pharmacy-store/add-new-stock')} className="ssl-btn ssl-btn-primary">
            <Plus size={16} /> Add New Stock
          </button>
          <button onClick={load} className="ssl-btn ssl-btn-icon" disabled={loading} title="Refresh">
            {loading
              ? <span className="ssl-spinner" />
              : <RefreshCw size={16} />}
          </button>
        </div>
      </div>

      {/* ── ALERT BANNERS ── */}
      {(expiredCount > 0 || nearCount > 0) && (
        <div className={`ssl-alerts ${expiredCount && nearCount ? 'ssl-alerts-2' : ''}`}>
          {expiredCount > 0 && (
            <div className="ssl-alert ssl-alert-expired">
              <AlertTriangle size={22} style={{ animation: 'pulse 1.5s ease infinite', flexShrink: 0, marginTop: 2 }} />
              <div>
                <div className="ssl-alert-title">🔴 {expiredCount} Drug{expiredCount > 1 ? 's' : ''} EXPIRED</div>
                <div className="ssl-alert-body">These items must be removed from stock immediately and reported.</div>
              </div>
            </div>
          )}
          {nearCount > 0 && (
            <div className="ssl-alert ssl-alert-near">
              <AlertTriangle size={22} style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <div className="ssl-alert-title">🟡 {nearCount} Drug{nearCount > 1 ? 's' : ''} Near Expiry</div>
                <div className="ssl-alert-body">These items have hit their near-expiry threshold — prioritize dispensing or return.</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── KPI CARDS ── */}
      <div className="ssl-kpi-grid">
        {[
          { label: 'Drug Types',  value: stats.total_items },
          { label: 'Total Qty',   value: Number(stats.total_quantity).toLocaleString() },
          { label: 'Total Value', value: 'ETB ' + Number(stats.total_value).toLocaleString(undefined, { minimumFractionDigits: 2 }) },
          { label: 'Low Stock',   value: stats.low_stock_count },
        ].map(s => (
          <div key={s.label} className="ssl-kpi">
            <div className="ssl-kpi-label">{s.label}</div>
            <div className="ssl-kpi-val">{s.value}</div>
          </div>
        ))}
      </div>

      {/* ── FILTER BAR ── */}
      <div className="ssl-filter-bar">
        <div className="ssl-search-wrap">
          <Search size={15} className="ssl-search-icon" />
          <input
            className="ssl-search-input"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by drug name…"
          />
        </div>
        <div className="ssl-ftabs">
          {FILTERS.map(f => (
            <button key={f.key} className={`ssl-ftab${filter === f.key ? ' active' : ''}`} onClick={() => setFilter(f.key)}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── TABLE ── */}
      <div className="ssl-table-wrap">
        {loading ? (
          <div className="ssl-state">
            <span className="ssl-spinner lg" />
            <div className="ssl-state-sub">Loading inventory…</div>
          </div>
        ) : sorted.length === 0 ? (
          <div className="ssl-state">
            No items found{filter !== 'all' ? ` for filter: "${filter}"` : ' in store inventory'}.
          </div>
        ) : (
          <table className="ssl-table">
            <thead>
              <tr>
                <th style={{ width: 40 }}>#</th>
                {[
                  { key: 'drug_name',   label: 'Drug Name' },
                  { key: 'strength',    label: 'Strength' },
                  { key: 'category',    label: 'Category' },
                  { key: 'batch_no',    label: 'Batch No' },
                  { key: 'unit',        label: 'Unit' },
                  { key: 'unit_price',  label: 'Price (ETB)', right: true },
                  { key: 'quantity',    label: 'Qty in Store', right: true },
                  { key: 'min_level',   label: 'Min Level', right: true },
                  { key: 'expiry_date', label: 'Expiry Date' },
                  { key: 'status',      label: 'Status' },
                ].map(c => (
                  <th key={c.key} className="sortable" onClick={() => toggleSort(c.key)}
                      style={{ textAlign: c.right ? 'right' : 'left' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, justifyContent: c.right ? 'flex-end' : 'flex-start', width: '100%' }}>
                      {c.label} <SortIcon col={c.key} />
                    </span>
                  </th>
                ))}
                <th style={{ textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((row, i) => {
                const isLow     = Number(row.quantity) <= Number(row.min_level || 0);
                const isOut     = Number(row.quantity) === 0;
                const expStat   = expiryStatus(row.expiry_date, row.near_expiry_days);
                const isExpired = expStat === 'expired';
                const isNear    = expStat === 'near';
                const leftStyle = isExpired ? { borderLeft: '3px solid var(--cdanger)' }
                  : isNear ? { borderLeft: '3px solid var(--cwarn)' }
                  : isLow  ? { borderLeft: '3px solid var(--cwarn)' }
                  : { borderLeft: '3px solid transparent' };

                return (
                  <tr key={row.id || i} style={leftStyle}>
                    <td style={{ color: 'var(--ctm)', fontSize: 12 }}>{i + 1}</td>

                    {/* Drug Name */}
                    <td>
                      <div style={{ fontWeight: 500 }}>
                        {row.drug_name || row.name}
                        {isExpired && <span className="ssl-badge ssl-badge-expired" style={{ marginLeft: 8, fontSize: 10, padding: '1px 7px' }}>EXPIRED</span>}
                        {!isExpired && isNear && <span className="ssl-badge ssl-badge-near" style={{ marginLeft: 8, fontSize: 10, padding: '1px 7px' }}>NEAR EXP.</span>}
                      </div>
                    </td>

                    <td style={{ color: 'var(--ct2)' }}>{row.strength || '—'}</td>
                    <td style={{ color: 'var(--ct2)' }}>{row.category || 'Uncategorized'}</td>

                    {/* Batch */}
                    <td>
                      {row.batch_no
                        ? <span className="ssl-batch">{row.batch_no}</span>
                        : <span style={{ color: 'var(--cdanger)', fontSize: 12 }}>⚠ No Batch</span>
                      }
                    </td>

                    <td style={{ color: 'var(--ct2)' }}>{row.unit || '—'}</td>

                    {/* Price */}
                    <td style={{ textAlign: 'right', fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>
                      {Number(row.unit_price || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>

                    {/* Quantity */}
                    <td style={{ textAlign: 'right', fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: isOut ? 'var(--cdanger)' : isLow ? 'var(--cwarn)' : 'inherit' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>
                        {(isOut || isLow) && <AlertTriangle size={13} />}
                        {Number(row.quantity).toLocaleString()}
                      </span>
                    </td>

                    <td style={{ textAlign: 'right', color: 'var(--ct2)', fontVariantNumeric: 'tabular-nums' }}>{row.min_level ?? 0}</td>

                    {/* Expiry */}
                    <td><ExpiryCell dateStr={row.expiry_date} nearDays={row.near_expiry_days} /></td>

                    {/* Status badge */}
                    <td>
                      {isExpired ? <span className="ssl-badge ssl-badge-expired">EXPIRED</span>
                      : isNear   ? <span className="ssl-badge ssl-badge-near">NEAR EXPIRY</span>
                      : isOut    ? <span className="ssl-badge ssl-badge-out">OUT OF STOCK</span>
                      : isLow    ? <span className="ssl-badge ssl-badge-low">LOW STOCK</span>
                      :            <span className="ssl-badge ssl-badge-in">IN STOCK</span>}
                    </td>

                    {/* Action */}
                    <td style={{ textAlign: 'center' }}>
                      {pendingItems.has(row.id) ? (
                        <span className="ssl-badge ssl-badge-near ssl-pending">⏳ AWAITING</span>
                      ) : (
                        <button
                          className="ssl-btn"
                          style={{ height: 30, padding: '0 10px', fontSize: 12 }}
                          onClick={() => setEditModal({ open: true, data: { ...row, expiry_date: row.expiry_date ? row.expiry_date.split('T')[0] : '' }, saving: false })}
                        >
                          <Edit2 size={13} /> Edit
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={6}>Total — {sorted.length} Item{sorted.length !== 1 ? 's' : ''}</td>
                <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                  {sorted.reduce((s, r) => s + Number(r.quantity), 0).toLocaleString()}
                </td>
                <td colSpan={4} style={{ textAlign: 'right' }}>
                  Value: ETB {totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>

      {/* ── EDIT MODAL ── */}
      {editModal.open && (
        <div className="ssl-overlay" onClick={() => setEditModal({ open: false, data: null })}>
          <div className="ssl-modal" onClick={e => e.stopPropagation()}>
            <div className="ssl-modal-hd">
              <h2 className="ssl-modal-title">Update Complete Record</h2>
              <button className="ssl-btn ssl-btn-icon" style={{ border: 'none', background: 'transparent', boxShadow: 'none' }} onClick={() => setEditModal({ open: false, data: null })}>
                <X size={20} />
              </button>
            </div>

            <div className="ssl-modal-body">
              <form id="ssl-update-form" onSubmit={handleUpdateStock}>

                <div className="ssl-sec-title">Drug &amp; Catalog Details</div>
                <div className="ssl-form-grid">
                  <div className="ssl-fg">
                    <label className="ssl-label">Drug Name</label>
                    <input className="ssl-input" value={editModal.data.drug_name || editModal.data.name || ''} onChange={setField('drug_name')} required />
                  </div>
                  <div className="ssl-fg">
                    <label className="ssl-label">Category</label>
                    <select className="ssl-input" value={editModal.data.category || ''} onChange={setField('category')}>
                      <option value="">Select Category</option>
                      {['Tablet','Capsule','Syrup','Injection','Ointment','Drops','Inhaler','Suppository','Other'].map(v => (
                        <option key={v} value={v}>{v}</option>
                      ))}
                    </select>
                  </div>
                  <div className="ssl-fg">
                    <label className="ssl-label">Strength</label>
                    <input className="ssl-input" value={editModal.data.strength || ''} onChange={setField('strength')} placeholder="e.g. 500mg" />
                  </div>
                  <div className="ssl-fg">
                    <label className="ssl-label">Unit</label>
                    <input className="ssl-input" value={editModal.data.unit || ''} onChange={setField('unit')} placeholder="e.g. Box, Strip" />
                  </div>
                  <div className="ssl-fg">
                    <label className="ssl-label">Unit Price (ETB)</label>
                    <input className="ssl-input" type="number" step="0.01" min="0" value={editModal.data.unit_price || ''} onChange={setField('unit_price')} required />
                  </div>
                  <div className="ssl-fg" style={{ justifyContent: 'flex-end', paddingBottom: 4 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14, fontWeight: 500 }}>
                      <input type="checkbox" checked={editModal.data.requires_prescription || false} onChange={setCheck('requires_prescription')} style={{ width: 16, height: 16, accentColor: 'var(--cp)' }} />
                      Requires Prescription
                    </label>
                  </div>
                </div>

                <div className="ssl-sec-title">Inventory &amp; Batch Details</div>
                <div className="ssl-form-grid">
                  <div className="ssl-fg">
                    <label className="ssl-label">Batch No</label>
                    <input className="ssl-input" value={editModal.data.batch_no || ''} onChange={setField('batch_no')} required />
                  </div>
                  <div className="ssl-fg">
                    <label className="ssl-label">Quantity in Stock</label>
                    <input className="ssl-input" type="number" min="0" value={editModal.data.quantity || 0} onChange={setField('quantity')} required />
                  </div>
                  <div className="ssl-fg">
                    <label className="ssl-label">Expiry Date</label>
                    <input className="ssl-input" type="date" value={editModal.data.expiry_date || ''} onChange={setField('expiry_date')} required />
                  </div>
                  <div className="ssl-fg">
                    <label className="ssl-label">Alert Days Before Expiry</label>
                    <input className="ssl-input" type="number" min="1" value={editModal.data.near_expiry_days || 90} onChange={setField('near_expiry_days')} required />
                  </div>
                  <div className="ssl-fg">
                    <label className="ssl-label">Storage Location</label>
                    <input className="ssl-input" value={editModal.data.storage_location || ''} onChange={setField('storage_location')} />
                  </div>
                  <div className="ssl-fg">
                    <label className="ssl-label">Min Level</label>
                    <input className="ssl-input" type="number" min="0" value={editModal.data.min_level || 0} onChange={setField('min_level')} />
                  </div>
                  <div className="ssl-fg">
                    <label className="ssl-label">Max Level</label>
                    <input className="ssl-input" type="number" min="0" value={editModal.data.max_level || 0} onChange={setField('max_level')} />
                  </div>
                </div>

              </form>
            </div>

            <div className="ssl-modal-ft">
              <button type="button" className="ssl-btn" onClick={() => setEditModal({ open: false, data: null })}>Cancel</button>
              <button type="submit" form="ssl-update-form" className="ssl-btn ssl-btn-primary" disabled={editModal.saving}>
                {editModal.saving ? <><span className="ssl-spinner" style={{ borderTopColor: '#fff' }} /> Saving…</> : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ── Expiry Cell ────────────────────────────────────────────────── */
function ExpiryCell({ dateStr, nearDays }) {
  if (!dateStr) return <span style={{ color: 'var(--ctm)', fontStyle: 'italic' }}>—</span>;
  const status = expiryStatus(dateStr, nearDays);
  const days   = daysUntilExpiry(dateStr);
  const fmt    = new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  if (status === 'expired') return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <span style={{ fontWeight: 500, color: 'var(--cdanger)' }}>{fmt}</span>
      <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--cdanger)' }}>EXPIRED {Math.abs(days)}d AGO</span>
    </div>
  );
  if (status === 'near') return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <span style={{ fontWeight: 500, color: 'var(--cwarn)' }}>{fmt}</span>
      <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--cwarn)' }}>EXPIRES IN {days}d</span>
    </div>
  );
  return <span style={{ fontWeight: 500, color: 'var(--ct1)' }}>{fmt}</span>;
}

export default StoreStockList;
