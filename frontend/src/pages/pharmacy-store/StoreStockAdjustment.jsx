import React, { useState, useEffect, useCallback } from 'react';
import { Sliders, Plus, Trash2, Search, Eye, EyeOff, RefreshCw, CheckCircle, Package, Calendar, Hash, AlertCircle, ChevronDown, ChevronUp, TrendingUp, TrendingDown } from 'lucide-react';
import { NotifStore } from './StoreHomeNew';

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
  .adj-page {
    box-sizing: border-box;
    margin: 10px auto; width: calc(100% - 20px); max-width: 1536px;
    min-height: calc(100vh - 20px); padding: 24px 24px 48px;
    background: var(--cbg);
    font-family: 'Inter', 'Segoe UI', Roboto, -apple-system, sans-serif;
    color: var(--ct1); line-height: 1.5;
  }
  @media (max-width: 1024px) { .adj-page { margin: 6px auto; width: calc(100% - 12px); padding: 16px 16px 40px; } }
  @media (max-width: 480px)  { .adj-page { margin: 4px auto; width: calc(100% - 8px);  padding: 12px 12px 32px; } }

  /* ── Header ── */
  .adj-header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px; margin-bottom: 24px; padding-bottom: 20px; border-bottom: 1px solid var(--cborder); }
  .adj-header-left { display: flex; align-items: center; gap: 12px; }
  .adj-header-icon { background: var(--cinfo-bg); color: var(--cinfo); padding: 10px; border-radius: 10px; display: flex; flex-shrink: 0; }
  .adj-page-title { font-size: clamp(22px,3vw,28px); font-weight: 600; line-height: 1.3; margin: 0 0 2px; color: var(--ct1); }
  .adj-page-sub { font-size: 13px; color: var(--ct2); margin: 0; }
  .adj-header-btns { display: flex; gap: 8px; flex-wrap: wrap; }

  /* ── Buttons ── */
  .adj-btn { height: 36px; padding: 0 16px; border-radius: 8px; font-size: 14px; font-weight: 500; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; border: 1px solid var(--cborder); background: var(--ccard); color: var(--ct1); font-family: inherit; transition: all 150ms ease-in-out; white-space: nowrap; min-width: 44px; justify-content: center; }
  .adj-btn:hover:not(:disabled) { background: var(--gold); color: var(--gold-text); border-color: transparent; box-shadow: 0 4px 12px rgba(0,0,0,.10); transform: translateY(-1px); }
  .adj-btn:disabled { opacity: .5; cursor: not-allowed; }
  .adj-btn-primary { background: var(--cp); color: #fff; border-color: var(--cp); }
  .adj-btn-primary:hover:not(:disabled) { background: var(--gold); color: var(--gold-text); border-color: transparent; }
  .adj-btn-danger  { background: var(--ccard); color: var(--cdanger); border-color: var(--cdanger); }
  .adj-btn-danger:hover:not(:disabled) { background: var(--gold); color: var(--gold-text); border-color: transparent; }
  .adj-btn-icon { width: 36px; height: 36px; padding: 0; }
  .adj-btn-sm   { height: 30px; padding: 0 12px; font-size: 12px; }

  /* ── Spinner ── */
  .adj-spinner { display: inline-block; width: 16px; height: 16px; border-radius: 50%; border: 2.5px solid rgba(37,99,235,.2); border-top-color: var(--cp); animation: adj-spin 700ms linear infinite; flex-shrink: 0; }
  .adj-spinner.lg { width: 28px; height: 28px; border-width: 3px; }
  .adj-spinner.white { border-color: rgba(255,255,255,.3); border-top-color: #fff; }
  @keyframes adj-spin { to { transform: rotate(360deg); } }

  /* ── Stats Strip ── */
  .adj-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; margin-bottom: 24px; }
  .stat-card { background: var(--ccard); border: 1px solid var(--cborder); border-radius: 10px; padding: 16px 20px; box-shadow: 0 1px 3px rgba(0,0,0,.06); transition: all 150ms ease; }
  .stat-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,.08); transform: translateY(-1px); }
  .stat-label { font-size: 12px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.03em; color: var(--ctm); margin-bottom: 8px; display: flex; align-items: center; gap: 6px; }
  .stat-val { font-size: 24px; font-weight: 700; color: var(--ct1); font-variant-numeric: tabular-nums; line-height: 1; }

  /* ── Search bar ── */
  .adj-search-bar { display: flex; align-items: center; gap: 12px; background: var(--ccard); border: 1px solid var(--cborder); border-radius: 10px; padding: 0 16px; height: 44px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,.06); }
  .adj-search-input { border: none; outline: none; font-size: 14px; font-family: inherit; flex: 1; background: transparent; color: var(--ct1); }
  .adj-search-count { font-size: 13px; font-weight: 500; color: var(--ctm); white-space: nowrap; }

  /* ── Badges ── */
  .adj-badge { display: inline-flex; align-items: center; padding: 2px 10px; border-radius: 9999px; font-size: 12px; font-weight: 500; white-space: nowrap; letter-spacing: 0.02em; }
  .adj-badge-approved { background: var(--cok-bg); color: var(--cok); }
  .adj-badge-rejected { background: var(--cdanger-bg); color: var(--cdanger); }
  .adj-badge-awaiting { background: var(--cinfo-bg); color: var(--cinfo); }

  /* ── List / Cards ── */
  .adj-list { display: flex; flex-direction: column; gap: 12px; }
  .adj-card-row { background: var(--ccard); border: 1px solid var(--cborder); border-radius: 10px; box-shadow: 0 1px 3px rgba(0,0,0,.06); overflow: hidden; transition: box-shadow 150ms ease, transform 150ms ease; }
  .adj-card-row:hover { box-shadow: 0 4px 12px rgba(0,0,0,.08); transform: translateY(-1px); }
  .adj-row-inner { padding: 14px 20px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; border-left: 4px solid transparent; }
  .adj-row-inner.st-APPROVED { border-left-color: var(--cok); }
  .adj-row-inner.st-REJECTED { border-left-color: var(--cdanger); }
  .adj-row-inner.st-PENDING  { border-left-color: var(--cinfo); }

  .adj-left { display: flex; align-items: center; gap: 14px; }
  .adj-icon-box { background: var(--cbg); color: var(--ct2); padding: 9px; border-radius: 8px; display: flex; flex-shrink: 0; }
  .adj-no { font-size: 15px; font-weight: 600; color: var(--ct1); margin-bottom: 2px; }
  .adj-meta { font-size: 12px; color: var(--ct2); display: flex; gap: 12px; flex-wrap: wrap; }
  .adj-meta span { display: flex; align-items: center; gap: 4px; }
  .adj-actions { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }

  /* ── Expand panel ── */
  .adj-expand { border-top: 1px solid var(--cborder); animation: adj-slidedown 200ms ease; }
  @keyframes adj-slidedown { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
  .adj-expand-meta { padding: 12px 20px; background: #F9FAFB; display: flex; flex-wrap: wrap; gap: 16px; font-size: 13px; color: var(--ct2); border-bottom: 1px solid var(--cborder); }
  .adj-expand-meta strong { color: var(--ct1); font-weight: 600; }
  .adj-expand-table-wrap { overflow-x: auto; }
  .adj-table { width: 100%; border-collapse: collapse; min-width: 600px; font-size: 13px; }
  .adj-table thead tr { background: #F9FAFB; }
  .adj-table th { padding: 10px 14px; font-size: 12px; font-weight: 500; text-transform: uppercase; letter-spacing: .03em; color: var(--ctm); border-bottom: 1px solid var(--cborder); text-align: left; }
  .adj-table td { padding: 10px 14px; border-bottom: 1px solid var(--cborder); color: var(--ct1); transition: background 150ms; vertical-align: middle; }
  .adj-table tbody tr:last-child td { border-bottom: none; }
  .adj-table tbody tr:hover td { background: #F9FAFB; }
  .adj-reject-reason { padding: 10px 20px; background: var(--cdanger-bg); border-top: 1px solid var(--cdanger); color: var(--cdanger); font-size: 13px; font-weight: 500; }

  /* ── State boxes ── */
  .adj-state { padding: 64px 24px; text-align: center; color: var(--ct2); font-size: 14px; }
  .adj-empty { background: var(--ccard); border: 1px dashed var(--cborder); border-radius: 10px; padding: 64px 24px; text-align: center; color: var(--ctm); font-size: 14px; }

  /* ── MODAL ── */
  .adj-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.4); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 16px; }
  .adj-modal { background: var(--ccard); border-radius: 12px; box-shadow: 0 20px 40px rgba(0,0,0,.15); width: 100%; max-width: 800px; max-height: 92vh; display: flex; flex-direction: column; overflow: hidden; animation: adj-modalin 150ms ease-out; }
  @keyframes adj-modalin { from { opacity:0; transform:scale(.97); } to { opacity:1; transform:scale(1); } }
  .adj-modal-hd { padding: 16px 24px; border-bottom: 1px solid var(--cborder); display: flex; justify-content: space-between; align-items: center; background: #F9FAFB; flex-shrink: 0; }
  .adj-modal-title { font-size: 18px; font-weight: 600; margin: 0; color: var(--ct1); display: flex; align-items: center; gap: 10px; }
  .adj-modal-sub { font-size: 13px; color: var(--ct2); margin-top: 2px; font-weight: 400; }
  .adj-modal-body { padding: 24px; overflow-y: auto; flex: 1; }
  @media (max-width: 480px) { .adj-modal-body { padding: 16px; } }
  .adj-modal-ft { padding: 14px 24px; border-top: 1px solid var(--cborder); display: flex; justify-content: flex-end; gap: 10px; background: #F9FAFB; flex-shrink: 0; }

  /* ── Form grid ── */
  .adj-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
  @media (max-width: 600px) { .adj-form-grid { grid-template-columns: 1fr; } }
  .adj-fg { display: flex; flex-direction: column; gap: 6px; }
  .adj-label { font-size: 12px; font-weight: 500; text-transform: uppercase; letter-spacing: .03em; color: var(--ct2); display: flex; align-items: center; gap: 4px; }
  .adj-input { height: 36px; padding: 0 12px; border-radius: 8px; border: 1px solid var(--cborder); font-size: 14px; font-family: inherit; color: var(--ct1); background: var(--ccard); width: 100%; box-sizing: border-box; outline: none; transition: border-color 150ms ease, box-shadow 150ms ease; }
  .adj-input:focus { border-color: var(--cp); box-shadow: 0 0 0 3px rgba(37,99,235,.1); }
  .adj-input:read-only { background: #F9FAFB; color: var(--ctm); cursor: not-allowed; }
  select.adj-input { appearance: auto; cursor: pointer; }

  /* ── Line Items ── */
  .adj-line-hd { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; border-bottom: 1px solid var(--cborder); padding-bottom: 8px; }
  .adj-line-title { font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: .03em; color: var(--ct1); }
  .adj-line-table-wrap { border: 1px solid var(--cborder); border-radius: 8px; overflow-x: auto; margin-bottom: 16px; }
  .adj-line-input { height: 32px; padding: 0 8px; border-radius: 6px; border: 1px solid var(--cborder); font-size: 13px; font-family: inherit; color: var(--ct1); background: var(--ccard); width: 100%; min-width: 80px; box-sizing: border-box; outline: none; transition: border-color 150ms, box-shadow 150ms; }
  .adj-line-input:focus { border-color: var(--cp); box-shadow: 0 0 0 2px rgba(37,99,235,.1); }
  .adj-line-input:read-only { background: #F9FAFB; color: var(--ctm); cursor: not-allowed; }
  select.adj-line-input { appearance: auto; }
`;

/* ─── API ──────────────────────────────────────────────────────── */
const API = '/api/v1/store-inventory';
function hdrs() { return { 'Content-Type': 'application/json', Authorization: 'Bearer ' + (localStorage.getItem('token') || '') }; }
async function apiFetch(url, opts = {}) {
  const r = await fetch(url, { headers: hdrs(), ...opts });
  const d = await r.json();
  if (!r.ok) throw new Error(d.message || 'Request failed');
  return d;
}
const REASONS = ['Damaged goods', 'Expired goods', 'Count correction', 'System error correction', 'Donation/Write-off', 'Other'];

/* ─── Status Badge ───────────────────────────────────────────── */
const StatusBadge = ({ status }) => {
  if (status === 'APPROVED') return <span className="adj-badge adj-badge-approved">Approved</span>;
  if (status === 'REJECTED') return <span className="adj-badge adj-badge-rejected">Rejected</span>;
  return <span className="adj-badge adj-badge-awaiting">Awaiting Approval</span>;
};

/* ─── Adjustment Form Modal ─────────────────────────────────── */
const AdjustmentForm = ({ onSuccess, onClose }) => {
  const [drugs, setDrugs] = useState([]);
  const [form, setForm] = useState({ adjustment_no: '', adjustment_date: new Date().toISOString().split('T')[0], reason: '', remarks: '' });
  const [items, setItems] = useState([{ drug_id: '', adjustment_type: 'ADD', quantity: '', batch_no: '' }]);
  const [saving, setSaving] = useState(false);
  const [loadingNo, setLoadingNo] = useState(true);

  useEffect(() => {
    apiFetch(API + '/inventory').then(d => setDrugs(d.data || d || [])).catch(() => {});
    apiFetch(API + '/adjustments/next-no')
      .then(d => { if (d.adjustment_no) setForm(p => ({ ...p, adjustment_no: d.adjustment_no })); })
      .catch(() => setForm(p => ({ ...p, adjustment_no: 'ADJ-' + Date.now() })))
      .finally(() => setLoadingNo(false));
  }, []);

  const setItem = (i, k, v) => setItems(prev => prev.map((it, idx) => idx === i ? { ...it, [k]: v } : it));

  const handleDrugChange = (i, drugId) => {
    const found = drugs.find(d => String(d.drug_id || d.id) === String(drugId));
    setItems(prev => prev.map((it, idx) =>
      idx === i ? { ...it, drug_id: drugId, batch_no: found?.batch_no || '' } : it
    ));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.reason) { NotifStore.push('Please select a reason.', 'warning'); return; }
    if (items.some(it => !it.drug_id || !it.quantity)) { NotifStore.push('Fill drug and quantity for all lines.', 'warning'); return; }
    setSaving(true);
    try {
      await apiFetch(`${API}/adjustments`, {
        method: 'POST',
        body: JSON.stringify({ ...form, items: items.map(it => ({ ...it, quantity: Number(it.quantity) })) })
      });
      NotifStore.push(`${form.adjustment_no} submitted for CEO approval!`, 'success');
      onSuccess();
    } catch (e) { NotifStore.push('Failed: ' + e.message, 'error'); }
    finally { setSaving(false); }
  };

  return (
    <div className="adj-overlay" onClick={onClose}>
      <div className="adj-modal" onClick={e => e.stopPropagation()}>
        <div className="adj-modal-hd">
          <div>
            <h2 className="adj-modal-title"><Sliders size={20} color="var(--cwarn)" /> New Stock Adjustment</h2>
            <div className="adj-modal-sub">Submit inventory corrections for CEO approval</div>
          </div>
          <button className="adj-btn adj-btn-icon" style={{ border: 'none', background: 'transparent', boxShadow: 'none' }} onClick={onClose}>×</button>
        </div>

        <form id="adj-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <div className="adj-modal-body">
            <div className="adj-form-grid">
              <div className="adj-fg">
                <label className="adj-label"><Hash size={14} /> Adjustment No</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input value={loadingNo ? 'Generating…' : form.adjustment_no} readOnly className="adj-input" />
                  {loadingNo && <span className="adj-spinner" style={{ position: 'absolute', right: 10 }} />}
                </div>
              </div>
              <div className="adj-fg">
                <label className="adj-label"><Calendar size={14} /> Date</label>
                <input type="date" value={form.adjustment_date} onChange={e => setForm(p => ({ ...p, adjustment_date: e.target.value }))} className="adj-input" required />
              </div>
              <div className="adj-fg">
                <label className="adj-label"><AlertCircle size={14} /> Reason *</label>
                <select value={form.reason} onChange={e => setForm(p => ({ ...p, reason: e.target.value }))} className="adj-input" required>
                  <option value="">Select reason…</option>
                  {REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className="adj-fg">
                <label className="adj-label">Remarks</label>
                <input value={form.remarks} onChange={e => setForm(p => ({ ...p, remarks: e.target.value }))} placeholder="Optional notes…" className="adj-input" />
              </div>
            </div>

            <div className="adj-line-hd">
              <span className="adj-line-title">Adjustment Lines ({items.length})</span>
              <button type="button" onClick={() => setItems(p => [...p, { drug_id: '', adjustment_type: 'ADD', quantity: '', batch_no: '' }])} className="adj-btn adj-btn-sm">
                <Plus size={14} /> Add Line
              </button>
            </div>

            <div className="adj-line-table-wrap">
              <table className="adj-table">
                <thead>
                  <tr>
                    <th style={{ width: '35%' }}>Drug *</th>
                    <th>Batch No</th>
                    <th>Type</th>
                    <th>Qty *</th>
                    <th style={{ width: 40, textAlign: 'center' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, i) => (
                    <tr key={i}>
                      <td>
                        <select value={item.drug_id} onChange={e => handleDrugChange(i, e.target.value)} className="adj-line-input" style={{ minWidth: 160 }} required>
                          <option value="">Select drug…</option>
                          {drugs.map(d => <option key={d.drug_id || d.id} value={d.drug_id || d.id}>{d.drug_name || d.name}{d.strength ? ' ' + d.strength : ''}</option>)}
                        </select>
                      </td>
                      <td>
                        <input type="text" value={item.batch_no} onChange={e => setItem(i, 'batch_no', e.target.value)} placeholder="Auto" className="adj-line-input" readOnly={!!item.batch_no} />
                      </td>
                      <td>
                        <select value={item.adjustment_type} onChange={e => setItem(i, 'adjustment_type', e.target.value)} className="adj-line-input" style={{ color: item.adjustment_type === 'ADD' ? 'var(--cok)' : 'var(--cdanger)', fontWeight: 600 }}>
                          <option value="ADD">+ ADD</option>
                          <option value="REMOVE">- REMOVE</option>
                        </select>
                      </td>
                      <td>
                        <input type="number" min={1} value={item.quantity} onChange={e => setItem(i, 'quantity', e.target.value)} className="adj-line-input" required />
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button type="button" onClick={() => setItems(p => p.filter((_, idx) => idx !== i))} disabled={items.length === 1} className="adj-btn adj-btn-danger adj-btn-icon" style={{ height: 30, width: 30 }}>
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="adj-modal-ft">
            <button type="button" onClick={onClose} className="adj-btn">Cancel</button>
            <button type="submit" disabled={saving || loadingNo} className="adj-btn adj-btn-primary">
              {saving ? <><span className="adj-spinner white" /> Submitting…</> : <><CheckCircle size={16} /> Submit Adjustment</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ─── Main Page ─────────────────────────────────────────────── */
const StoreStockAdjustment = () => {
  const [adjustments, setAdjustments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await apiFetch(`${API}/adjustments`);
      setAdjustments(d.data || []);
    } catch (e) { NotifStore.push('Failed to load: ' + e.message, 'error'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const grouped = React.useMemo(() => {
    const map = {};
    adjustments.forEach(r => {
      const key = r.adjustment_no || `adj-${r.id}`;
      if (!map[key]) map[key] = { ...r, lines: [] };
      map[key].lines.push(r);
      if (r.status === 'PENDING' || (!map[key].status)) map[key].status = r.status;
    });
    return Object.values(map);
  }, [adjustments]);

  const filtered = grouped.filter(r =>
    !search ||
    (r.adjustment_no || '').toLowerCase().includes(search.toLowerCase()) ||
    (r.reason || '').toLowerCase().includes(search.toLowerCase()) ||
    (r.drug_name || '').toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: grouped.length,
    awaiting: grouped.filter(r => r.status === 'PENDING').length,
    approved: grouped.filter(r => r.status === 'APPROVED').length,
    rejected: grouped.filter(r => r.status === 'REJECTED').length,
  };

  return (
    <div className="adj-page">
      <style>{CSS}</style>
      {showForm && <AdjustmentForm onSuccess={() => { setShowForm(false); load(); }} onClose={() => setShowForm(false)} />}

      {/* ── Header ── */}
      <div className="adj-header">
        <div className="adj-header-left">
          <div className="adj-header-icon"><Sliders size={24} /></div>
          <div>
            <h1 className="adj-page-title">Stock Adjustments</h1>
            <p className="adj-page-sub">Add or remove stock quantities (Requires CEO approval)</p>
          </div>
        </div>
        <div className="adj-header-btns">
          <button onClick={() => setShowForm(true)} className="adj-btn adj-btn-primary">
            <Plus size={16} /> New Adjustment
          </button>
          <button onClick={load} className="adj-btn adj-btn-icon" disabled={loading} title="Refresh">
            {loading ? <span className="adj-spinner" /> : <RefreshCw size={16} />}
          </button>
        </div>
      </div>

      {/* ── Stats Strip ── */}
      <div className="adj-stats">
        {[
          { label: 'Total Adjustments', value: stats.total, icon: <Package size={14} /> },
          { label: 'Awaiting Approval', value: stats.awaiting, icon: <AlertCircle size={14} /> },
          { label: 'Approved', value: stats.approved, icon: <CheckCircle size={14} /> },
          { label: 'Rejected', value: stats.rejected, icon: <Trash2 size={14} /> },
        ].map((s, i) => (
          <div key={i} className="stat-card">
            <div className="stat-label">{s.icon} {s.label}</div>
            <div className="stat-val">{s.value}</div>
          </div>
        ))}
      </div>

      {/* ── Search Bar ── */}
      <div className="adj-search-bar">
        <Search size={16} color="var(--ctm)" />
        <input className="adj-search-input" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by adjustment no, reason, or drug name…" />
        <span className="adj-search-count">{filtered.length} record{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* ── List ── */}
      {loading ? (
        <div className="adj-state">
          <span className="adj-spinner lg" style={{ display: 'inline-block', marginBottom: 12 }} />
          <div>Loading adjustments…</div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="adj-empty">No adjustments found. Click <strong>New Adjustment</strong> to create one.</div>
      ) : (
        <div className="adj-list">
          {filtered.map((r) => {
            const isOpen = expanded === (r.adjustment_no || r.id);
            const totalLines = r.lines?.length || 1;
            const date = r.adjustment_date ? new Date(r.adjustment_date).toLocaleDateString() : new Date(r.created_at).toLocaleDateString();

            return (
              <div key={r.adjustment_no || r.id} className="adj-card-row">
                <div className={`adj-row-inner st-${r.status}`}>
                  <div className="adj-left">
                    <div className="adj-icon-box"><Sliders size={20} /></div>
                    <div>
                      <div className="adj-no">{r.adjustment_no || `ADJ-${r.id}`}</div>
                      <div className="adj-meta">
                        <span><Calendar size={12} /> {date}</span>
                        <span><Package size={12} /> {totalLines} line{totalLines > 1 ? 's' : ''}</span>
                        <span>· {r.reason || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="adj-actions">
                    <StatusBadge status={r.status} />
                    <button onClick={() => setExpanded(isOpen ? null : (r.adjustment_no || r.id))} className="adj-btn adj-btn-sm">
                      {isOpen ? <><EyeOff size={14} /> Hide</> : <><Eye size={14} /> Details</>}
                      {isOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    </button>
                  </div>
                </div>

                {isOpen && (
                  <div className="adj-expand">
                    <div className="adj-expand-meta">
                      <div><strong>Adjustment No:</strong> {r.adjustment_no}</div>
                      <div><strong>Date:</strong> {date}</div>
                      <div><strong>Reason:</strong> {r.reason}</div>
                      <div><strong>Lines:</strong> {totalLines}</div>
                    </div>

                    <div className="adj-expand-table-wrap">
                      <table className="adj-table">
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>Drug</th>
                            <th>Batch No</th>
                            <th>Type</th>
                            <th>Before</th>
                            <th>Qty</th>
                            <th>After</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(r.lines || [r]).map((line, li) => (
                            <tr key={li}>
                              <td style={{ color: 'var(--ctm)', fontWeight: 500 }}>{li + 1}</td>
                              <td>
                                <div style={{ fontWeight: 600, color: 'var(--ct1)' }}>{line.drug_name || `Drug #${line.drug_id}`}</div>
                                {line.strength && <div style={{ fontSize: 11, color: 'var(--ct2)' }}>{line.strength}</div>}
                              </td>
                              <td style={{ color: 'var(--ct2)' }}>{line.batch_no || '—'}</td>
                              <td>
                                <span style={{ color: line.adjustment_type === 'ADD' ? 'var(--cok)' : 'var(--cdanger)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                  {line.adjustment_type === 'ADD' ? <><TrendingUp size={13} /> ADD</> : <><TrendingDown size={13} /> REMOVE</>}
                                </span>
                              </td>
                              <td style={{ color: 'var(--ct2)' }}>{line.quantity_before ?? '—'}</td>
                              <td>
                                <strong style={{ color: line.adjustment_type === 'ADD' ? 'var(--cok)' : 'var(--cdanger)', fontSize: 14 }}>
                                  {line.adjustment_type === 'ADD' ? '+' : '−'}{Math.abs(line.adjustment_qty)}
                                </strong>
                              </td>
                              <td style={{ color: 'var(--ct2)' }}>{line.quantity_after ?? '—'}</td>
                              <td><StatusBadge status={line.status} /></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {r.status === 'REJECTED' && r.rejection_reason && (
                      <div className="adj-reject-reason">
                        Rejection Reason: {r.rejection_reason}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default StoreStockAdjustment;
