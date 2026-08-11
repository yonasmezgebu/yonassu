import React, { useState, useEffect, useCallback } from 'react';
import { ClipboardCheck, Plus, Trash2, Search, Eye, EyeOff, RefreshCw, CheckCircle, Package, Calendar, Hash, ChevronDown, ChevronUp, AlertCircle, FileText } from 'lucide-react';
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
  .pc-page {
    box-sizing: border-box;
    margin: 10px auto; width: calc(100% - 20px); max-width: 1536px;
    min-height: calc(100vh - 20px); padding: 24px 24px 48px;
    background: var(--cbg);
    font-family: 'Inter', 'Segoe UI', Roboto, -apple-system, sans-serif;
    color: var(--ct1); line-height: 1.5;
  }
  @media (max-width: 1024px) { .pc-page { margin: 6px auto; width: calc(100% - 12px); padding: 16px 16px 40px; } }
  @media (max-width: 480px)  { .pc-page { margin: 4px auto; width: calc(100% - 8px);  padding: 12px 12px 32px; } }

  /* ── Header ── */
  .pc-header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px; margin-bottom: 24px; padding-bottom: 20px; border-bottom: 1px solid var(--cborder); }
  .pc-header-left { display: flex; align-items: center; gap: 12px; }
  .pc-header-icon { background: var(--cinfo-bg); color: var(--cinfo); padding: 10px; border-radius: 10px; display: flex; flex-shrink: 0; }
  .pc-page-title { font-size: clamp(22px,3vw,28px); font-weight: 600; line-height: 1.3; margin: 0 0 2px; color: var(--ct1); }
  .pc-page-sub { font-size: 13px; color: var(--ct2); margin: 0; }
  .pc-header-btns { display: flex; gap: 8px; flex-wrap: wrap; }

  /* ── Buttons ── */
  .pc-btn { height: 36px; padding: 0 16px; border-radius: 8px; font-size: 14px; font-weight: 500; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; border: 1px solid var(--cborder); background: var(--ccard); color: var(--ct1); font-family: inherit; transition: all 150ms ease-in-out; white-space: nowrap; min-width: 44px; justify-content: center; }
  .pc-btn:hover:not(:disabled) { background: var(--gold); color: var(--gold-text); border-color: transparent; box-shadow: 0 4px 12px rgba(0,0,0,.10); transform: translateY(-1px); }
  .pc-btn:disabled { opacity: .5; cursor: not-allowed; }
  .pc-btn-primary { background: var(--cp); color: #fff; border-color: var(--cp); }
  .pc-btn-primary:hover:not(:disabled) { background: var(--gold); color: var(--gold-text); border-color: transparent; }
  .pc-btn-danger  { background: var(--ccard); color: var(--cdanger); border-color: var(--cdanger); }
  .pc-btn-danger:hover:not(:disabled) { background: var(--gold); color: var(--gold-text); border-color: transparent; }
  .pc-btn-icon { width: 36px; height: 36px; padding: 0; }
  .pc-btn-sm   { height: 30px; padding: 0 12px; font-size: 12px; }

  /* ── Spinner ── */
  .pc-spinner { display: inline-block; width: 16px; height: 16px; border-radius: 50%; border: 2.5px solid rgba(37,99,235,.2); border-top-color: var(--cp); animation: pc-spin 700ms linear infinite; flex-shrink: 0; }
  .pc-spinner.lg { width: 28px; height: 28px; border-width: 3px; }
  .pc-spinner.white { border-color: rgba(255,255,255,.3); border-top-color: #fff; }
  @keyframes pc-spin { to { transform: rotate(360deg); } }

  /* ── Stats Strip ── */
  .pc-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; margin-bottom: 24px; }
  .stat-card { background: var(--ccard); border: 1px solid var(--cborder); border-radius: 10px; padding: 16px 20px; box-shadow: 0 1px 3px rgba(0,0,0,.06); transition: all 150ms ease; }
  .stat-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,.08); transform: translateY(-1px); }
  .stat-label { font-size: 12px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.03em; color: var(--ctm); margin-bottom: 8px; display: flex; align-items: center; gap: 6px; }
  .stat-val { font-size: 24px; font-weight: 700; color: var(--ct1); font-variant-numeric: tabular-nums; line-height: 1; }

  /* ── Search bar ── */
  .pc-search-bar { display: flex; align-items: center; gap: 12px; background: var(--ccard); border: 1px solid var(--cborder); border-radius: 10px; padding: 0 16px; height: 44px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,.06); }
  .pc-search-input { border: none; outline: none; font-size: 14px; font-family: inherit; flex: 1; background: transparent; color: var(--ct1); }
  .pc-search-count { font-size: 13px; font-weight: 500; color: var(--ctm); white-space: nowrap; }

  /* ── Badges ── */
  .pc-badge { display: inline-flex; align-items: center; padding: 2px 10px; border-radius: 9999px; font-size: 12px; font-weight: 500; white-space: nowrap; letter-spacing: 0.02em; }
  .pc-badge-approved { background: var(--cok-bg); color: var(--cok); }
  .pc-badge-rejected { background: var(--cdanger-bg); color: var(--cdanger); }
  .pc-badge-awaiting { background: var(--cinfo-bg); color: var(--cinfo); }
  
  .pc-badge-variance { background: var(--cdanger-bg); color: var(--cdanger); }
  .pc-badge-balanced { background: var(--cok-bg); color: var(--cok); }

  /* ── List / Cards ── */
  .pc-list { display: flex; flex-direction: column; gap: 12px; }
  .pc-card-row { background: var(--ccard); border: 1px solid var(--cborder); border-radius: 10px; box-shadow: 0 1px 3px rgba(0,0,0,.06); overflow: hidden; transition: box-shadow 150ms ease, transform 150ms ease; }
  .pc-card-row:hover { box-shadow: 0 4px 12px rgba(0,0,0,.08); transform: translateY(-1px); }
  .pc-row-inner { padding: 14px 20px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; border-left: 4px solid transparent; }
  .pc-row-inner.st-APPROVED { border-left-color: var(--cok); }
  .pc-row-inner.st-REJECTED { border-left-color: var(--cdanger); }
  .pc-row-inner.st-PENDING  { border-left-color: var(--cinfo); }

  .pc-left { display: flex; align-items: center; gap: 14px; }
  .pc-icon-box { background: var(--cbg); color: var(--ct2); padding: 9px; border-radius: 8px; display: flex; flex-shrink: 0; }
  .pc-no { font-size: 15px; font-weight: 600; color: var(--ct1); margin-bottom: 2px; }
  .pc-meta { font-size: 12px; color: var(--ct2); display: flex; gap: 12px; flex-wrap: wrap; }
  .pc-meta span { display: flex; align-items: center; gap: 4px; }
  .pc-actions { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }

  /* ── Expand panel ── */
  .pc-expand { border-top: 1px solid var(--cborder); animation: pc-slidedown 200ms ease; }
  @keyframes pc-slidedown { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
  .pc-expand-meta { padding: 12px 20px; background: #F9FAFB; display: flex; flex-wrap: wrap; gap: 16px; font-size: 13px; color: var(--ct2); border-bottom: 1px solid var(--cborder); }
  .pc-expand-meta strong { color: var(--ct1); font-weight: 600; }
  .pc-expand-table-wrap { overflow-x: auto; }
  .pc-table { width: 100%; border-collapse: collapse; min-width: 600px; font-size: 13px; }
  .pc-table thead tr { background: #F9FAFB; }
  .pc-table th { padding: 10px 14px; font-size: 12px; font-weight: 500; text-transform: uppercase; letter-spacing: .03em; color: var(--ctm); border-bottom: 1px solid var(--cborder); text-align: left; }
  .pc-table td { padding: 10px 14px; border-bottom: 1px solid var(--cborder); color: var(--ct1); transition: background 150ms; vertical-align: middle; }
  .pc-table tbody tr:last-child td { border-bottom: none; }
  .pc-table tbody tr:hover td { background: #F9FAFB; }
  .pc-reject-reason { padding: 10px 20px; background: var(--cdanger-bg); border-top: 1px solid var(--cdanger); color: var(--cdanger); font-size: 13px; font-weight: 500; }
  .pc-remarks { padding: 10px 20px; background: #F9FAFB; border-top: 1px solid var(--cborder); font-size: 13px; color: var(--ct1); }

  /* ── State boxes ── */
  .pc-state { padding: 64px 24px; text-align: center; color: var(--ct2); font-size: 14px; }
  .pc-empty { background: var(--ccard); border: 1px dashed var(--cborder); border-radius: 10px; padding: 64px 24px; text-align: center; color: var(--ctm); font-size: 14px; }

  /* ── MODAL ── */
  .pc-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.4); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 16px; }
  .pc-modal { background: var(--ccard); border-radius: 12px; box-shadow: 0 20px 40px rgba(0,0,0,.15); width: 100%; max-width: 860px; max-height: 92vh; display: flex; flex-direction: column; overflow: hidden; animation: pc-modalin 150ms ease-out; }
  @keyframes pc-modalin { from { opacity:0; transform:scale(.97); } to { opacity:1; transform:scale(1); } }
  .pc-modal-hd { padding: 16px 24px; border-bottom: 1px solid var(--cborder); display: flex; justify-content: space-between; align-items: center; background: #F9FAFB; flex-shrink: 0; }
  .pc-modal-title { font-size: 18px; font-weight: 600; margin: 0; color: var(--ct1); display: flex; align-items: center; gap: 10px; }
  .pc-modal-sub { font-size: 13px; color: var(--ct2); margin-top: 2px; font-weight: 400; }
  .pc-modal-body { padding: 24px; overflow-y: auto; flex: 1; }
  @media (max-width: 480px) { .pc-modal-body { padding: 16px; } }
  .pc-modal-ft { padding: 14px 24px; border-top: 1px solid var(--cborder); display: flex; justify-content: flex-end; gap: 10px; background: #F9FAFB; flex-shrink: 0; }

  /* ── Form grid ── */
  .pc-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
  @media (max-width: 600px) { .pc-form-grid { grid-template-columns: 1fr; } }
  .pc-fg { display: flex; flex-direction: column; gap: 6px; }
  .pc-label { font-size: 12px; font-weight: 500; text-transform: uppercase; letter-spacing: .03em; color: var(--ct2); display: flex; align-items: center; gap: 4px; }
  .pc-input { height: 36px; padding: 0 12px; border-radius: 8px; border: 1px solid var(--cborder); font-size: 14px; font-family: inherit; color: var(--ct1); background: var(--ccard); width: 100%; box-sizing: border-box; outline: none; transition: border-color 150ms ease, box-shadow 150ms ease; }
  .pc-input:focus { border-color: var(--cp); box-shadow: 0 0 0 3px rgba(37,99,235,.1); }
  .pc-input:read-only { background: #F9FAFB; color: var(--ctm); cursor: not-allowed; }
  select.pc-input { appearance: auto; cursor: pointer; }

  /* ── Line Items ── */
  .pc-line-hd { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; border-bottom: 1px solid var(--cborder); padding-bottom: 8px; }
  .pc-line-title { font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: .03em; color: var(--ct1); }
  .pc-line-table-wrap { border: 1px solid var(--cborder); border-radius: 8px; overflow-x: auto; margin-bottom: 16px; }
  .pc-line-input { height: 32px; padding: 0 8px; border-radius: 6px; border: 1px solid var(--cborder); font-size: 13px; font-family: inherit; color: var(--ct1); background: var(--ccard); width: 100%; min-width: 80px; box-sizing: border-box; outline: none; transition: border-color 150ms, box-shadow 150ms; }
  .pc-line-input:focus { border-color: var(--cp); box-shadow: 0 0 0 2px rgba(37,99,235,.1); }
  .pc-line-input:read-only { background: #F9FAFB; color: var(--ctm); cursor: not-allowed; }
  select.pc-line-input { appearance: auto; }
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

/* ─── Status Badge ───────────────────────────────────────────── */
const StatusBadge = ({ status }) => {
  if (status === 'APPROVED') return <span className="pc-badge pc-badge-approved">Approved</span>;
  if (status === 'REJECTED') return <span className="pc-badge pc-badge-rejected">Rejected</span>;
  return <span className="pc-badge pc-badge-awaiting">Awaiting Approval</span>;
};

/* ─── Physical Count Form Modal ─────────────────────────────── */
const CountForm = ({ onSuccess, onClose }) => {
  const [drugs, setDrugs] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [form, setForm] = useState({ count_no: '', count_date: new Date().toISOString().split('T')[0], counted_by: '', remarks: '' });
  const [items, setItems] = useState([{ drug_id: '', system_quantity: 0, physical_quantity: '', batch_no: '' }]);
  const [saving, setSaving] = useState(false);
  const [loadingNo, setLoadingNo] = useState(true);

  useEffect(() => {
    apiFetch(API + '/inventory').then(d => {
      setDrugs(d.data || d || []);
      setInventory(d.data || d || []);
    }).catch(() => {});
    
    apiFetch(API + '/counts/next-no')
      .then(d => { if (d.count_no) setForm(p => ({ ...p, count_no: d.count_no })); })
      .catch(() => setForm(p => ({ ...p, count_no: 'PC-' + Date.now() })))
      .finally(() => setLoadingNo(false));
  }, []);

  const setItem = (i, k, v) => {
    setItems(prev => prev.map((it, idx) => {
      if (idx !== i) return it;
      if (k === 'drug_id') {
        const inv = inventory.find(inv => String(inv.drug_id) === String(v));
        return { ...it, [k]: v, system_quantity: inv ? Number(inv.quantity) : 0, batch_no: inv?.batch_no || '' };
      }
      return { ...it, [k]: v };
    }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (items.some(it => !it.drug_id || it.physical_quantity === '')) {
      NotifStore.push('Select a drug and enter physical count for all lines.', 'warning'); return;
    }
    setSaving(true);
    try {
      await apiFetch(`${API}/counts`, {
        method: 'POST',
        body: JSON.stringify({ 
          ...form, 
          items: items.map(it => ({ 
            ...it, 
            physical_quantity: Number(it.physical_quantity), 
            variance: Number(it.physical_quantity) - Number(it.system_quantity) 
          })) 
        })
      });
      NotifStore.push(`${form.count_no} submitted for CEO approval!`, 'success');
      onSuccess();
    } catch (e) { NotifStore.push('Failed: ' + e.message, 'error'); }
    finally { setSaving(false); }
  };

  return (
    <div className="pc-overlay" onClick={onClose}>
      <div className="pc-modal" onClick={e => e.stopPropagation()}>
        <div className="pc-modal-hd">
          <div>
            <h2 className="pc-modal-title"><ClipboardCheck size={20} color="var(--cinfo)" /> New Physical Count</h2>
            <div className="pc-modal-sub">Submit inventory count for CEO approval</div>
          </div>
          <button className="pc-btn pc-btn-icon" style={{ border: 'none', background: 'transparent', boxShadow: 'none' }} onClick={onClose}>×</button>
        </div>

        <form id="pc-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <div className="pc-modal-body">
            <div className="pc-form-grid">
              <div className="pc-fg">
                <label className="pc-label"><Hash size={14} /> Count No</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input value={loadingNo ? 'Generating…' : form.count_no} readOnly className="pc-input" />
                  {loadingNo && <span className="pc-spinner" style={{ position: 'absolute', right: 10 }} />}
                </div>
              </div>
              <div className="pc-fg">
                <label className="pc-label"><Calendar size={14} /> Date</label>
                <input type="date" value={form.count_date} onChange={e => setForm(p => ({ ...p, count_date: e.target.value }))} className="pc-input" required />
              </div>
              <div className="pc-fg">
                <label className="pc-label">Counted By *</label>
                <input value={form.counted_by} onChange={e => setForm(p => ({ ...p, counted_by: e.target.value }))} className="pc-input" required placeholder="Staff name" />
              </div>
              <div className="pc-fg">
                <label className="pc-label">Remarks</label>
                <input value={form.remarks} onChange={e => setForm(p => ({ ...p, remarks: e.target.value }))} placeholder="Optional notes…" className="pc-input" />
              </div>
            </div>

            <div className="pc-line-hd">
              <span className="pc-line-title">Count Lines ({items.length})</span>
              <button type="button" onClick={() => setItems(p => [...p, { drug_id: '', system_quantity: 0, physical_quantity: '', batch_no: '' }])} className="pc-btn pc-btn-sm">
                <Plus size={14} /> Add Line
              </button>
            </div>

            <div className="pc-line-table-wrap">
              <table className="pc-table">
                <thead>
                  <tr>
                    <th style={{ width: '30%' }}>Drug *</th>
                    <th>Batch (Auto)</th>
                    <th>System Qty</th>
                    <th>Physical Qty *</th>
                    <th>Variance</th>
                    <th style={{ width: 40, textAlign: 'center' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, i) => {
                    const variance = item.physical_quantity !== '' ? Number(item.physical_quantity) - Number(item.system_quantity) : null;
                    return (
                      <tr key={i}>
                        <td>
                          <select value={item.drug_id} onChange={e => setItem(i, 'drug_id', e.target.value)} className="pc-line-input" style={{ minWidth: 140 }} required>
                            <option value="">Select drug…</option>
                            {drugs.map(d => <option key={d.drug_id || d.id} value={d.drug_id || d.id}>{d.drug_name || d.name}{d.strength ? ' ' + d.strength : ''}</option>)}
                          </select>
                        </td>
                        <td>
                          <input type="text" value={item.batch_no} onChange={e => setItem(i, 'batch_no', e.target.value)} placeholder="Auto" className="pc-line-input" readOnly={!!item.batch_no} />
                        </td>
                        <td>
                          <div style={{ padding: '4px 8px', background: 'var(--cbg)', border: '1px solid var(--cborder)', borderRadius: 4, fontWeight: 600, color: 'var(--ct2)', display: 'inline-block' }}>{item.system_quantity}</div>
                        </td>
                        <td>
                          <input type="number" min={0} value={item.physical_quantity} onChange={e => setItem(i, 'physical_quantity', e.target.value)} className="pc-line-input" required />
                        </td>
                        <td>
                          {variance !== null && (
                            <div style={{ padding: '4px 8px', borderRadius: 4, fontWeight: 700, color: variance === 0 ? 'var(--cok)' : variance > 0 ? 'var(--cinfo)' : 'var(--cdanger)', background: variance === 0 ? 'var(--cok-bg)' : variance > 0 ? 'var(--cinfo-bg)' : 'var(--cdanger-bg)', border: `1px solid ${variance === 0 ? 'var(--cok)' : variance > 0 ? 'var(--cinfo)' : 'var(--cdanger)'}`, display: 'inline-block' }}>
                              {variance > 0 ? '+' : ''}{variance}
                            </div>
                          )}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button type="button" onClick={() => setItems(p => p.filter((_, idx) => idx !== i))} disabled={items.length === 1} className="pc-btn pc-btn-danger pc-btn-icon" style={{ height: 30, width: 30 }}>
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="pc-modal-ft">
            <button type="button" onClick={onClose} className="pc-btn">Cancel</button>
            <button type="submit" disabled={saving || loadingNo} className="pc-btn pc-btn-primary">
              {saving ? <><span className="pc-spinner white" /> Submitting…</> : <><CheckCircle size={16} /> Submit Count</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ─── Main Page ─────────────────────────────────────────────── */
const StorePhysicalCount = () => {
  const [counts, setCounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await apiFetch(`${API}/counts`);
      setCounts(d.data || []);
    } catch (e) { NotifStore.push('Failed to load counts: ' + e.message, 'error'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = counts.filter(r =>
    !search ||
    (r.count_no || '').toLowerCase().includes(search.toLowerCase()) ||
    (r.counted_by || '').toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: counts.length,
    awaiting: counts.filter(r => r.status === 'PENDING').length,
    approved: counts.filter(r => r.status === 'APPROVED').length,
    rejected: counts.filter(r => r.status === 'REJECTED').length,
  };

  return (
    <div className="pc-page">
      <style>{CSS}</style>
      {showForm && <CountForm onSuccess={() => { setShowForm(false); load(); }} onClose={() => setShowForm(false)} />}

      {/* ── Header ── */}
      <div className="pc-header">
        <div className="pc-header-left">
          <div className="pc-header-icon"><ClipboardCheck size={24} /></div>
          <div>
            <h1 className="pc-page-title">Physical Counts</h1>
            <p className="pc-page-sub">Audit physical inventory vs system quantities (Requires CEO approval)</p>
          </div>
        </div>
        <div className="pc-header-btns">
          <button onClick={() => setShowForm(true)} className="pc-btn pc-btn-primary">
            <Plus size={16} /> New Physical Count
          </button>
          <button onClick={load} className="pc-btn pc-btn-icon" disabled={loading} title="Refresh">
            {loading ? <span className="pc-spinner" /> : <RefreshCw size={16} />}
          </button>
        </div>
      </div>

      {/* ── Stats Strip ── */}
      <div className="pc-stats">
        {[
          { label: 'Total Counts', value: stats.total, icon: <Package size={14} /> },
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
      <div className="pc-search-bar">
        <Search size={16} color="var(--ctm)" />
        <input className="pc-search-input" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by count no or counted by…" />
        <span className="pc-search-count">{filtered.length} record{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* ── List ── */}
      {loading ? (
        <div className="pc-state">
          <span className="pc-spinner lg" style={{ display: 'inline-block', marginBottom: 12 }} />
          <div>Loading physical counts…</div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="pc-empty">No physical counts found. Click <strong>New Physical Count</strong> to create one.</div>
      ) : (
        <div className="pc-list">
          {filtered.map(r => {
            const isOpen = expanded === r.id;
            const date = r.count_date ? new Date(r.count_date).toLocaleDateString() : new Date(r.created_at).toLocaleDateString();
            
            const items = r.items || [];
            const hasVariance = items.some(it => Number(it.variance) !== 0);

            return (
              <div key={r.id} className="pc-card-row">
                <div className={`pc-row-inner st-${r.status || 'PENDING'}`}>
                  <div className="pc-left">
                    <div className="pc-icon-box"><ClipboardCheck size={20} /></div>
                    <div>
                      <div className="pc-no">{r.count_no || `PC-${r.id}`}</div>
                      <div className="pc-meta">
                        <span><Calendar size={12} /> {date}</span>
                        <span><Package size={12} /> {items.length} line{items.length > 1 ? 's' : ''}</span>
                        <span>· By: {r.counted_by || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="pc-actions">
                    <span className={`pc-badge ${hasVariance ? "pc-badge-variance" : "pc-badge-balanced"}`}>
                      {hasVariance ? '⚠ VARIANCE' : '✓ BALANCED'}
                    </span>
                    <StatusBadge status={r.status || 'PENDING'} />
                    <button onClick={() => setExpanded(isOpen ? null : r.id)} className="pc-btn pc-btn-sm">
                      {isOpen ? <><EyeOff size={14} /> Hide</> : <><Eye size={14} /> Details</>}
                      {isOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    </button>
                  </div>
                </div>

                {isOpen && items.length > 0 && (
                  <div className="pc-expand">
                    <div className="pc-expand-meta">
                      <div><strong>Count No:</strong> {r.count_no}</div>
                      <div><strong>Date:</strong> {date}</div>
                      <div><strong>Counted By:</strong> {r.counted_by}</div>
                      <div><strong>Lines:</strong> {items.length}</div>
                    </div>

                    <div className="pc-expand-table-wrap">
                      <table className="pc-table">
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>Drug</th>
                            <th>Batch No</th>
                            <th>System Qty</th>
                            <th>Physical Qty</th>
                            <th>Variance</th>
                          </tr>
                        </thead>
                        <tbody>
                          {items.map((line, li) => {
                            const v = Number(line.variance ?? (line.physical_quantity - line.system_quantity));
                            return (
                              <tr key={li}>
                                <td style={{ color: 'var(--ctm)', fontWeight: 500 }}>{li + 1}</td>
                                <td>
                                  <div style={{ fontWeight: 600, color: 'var(--ct1)' }}>{line.drug_name || `Drug #${line.drug_id}`}</div>
                                  {line.strength && <div style={{ fontSize: 11, color: 'var(--ct2)' }}>{line.strength}</div>}
                                </td>
                                <td style={{ color: 'var(--ct2)' }}>{line.batch_no || '—'}</td>
                                <td style={{ fontWeight: 500 }}>{line.system_quantity}</td>
                                <td style={{ fontWeight: 600, color: 'var(--ct1)' }}>{line.physical_quantity}</td>
                                <td>
                                  <strong style={{ color: v === 0 ? 'var(--cok)' : v > 0 ? 'var(--cinfo)' : 'var(--cdanger)', fontSize: 14 }}>
                                    {v > 0 ? '+' : ''}{v}
                                  </strong>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {(r.remarks || (r.status === 'REJECTED' && r.rejection_reason)) && (
                      <div className="pc-remarks" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {r.remarks && <div><strong style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--ctm)' }}>Remarks:</strong> <br/> {r.remarks}</div>}
                        {r.status === 'REJECTED' && r.rejection_reason && (
                          <div className="pc-reject-reason" style={{ borderRadius: 6 }}>
                            <strong>Rejection Reason:</strong> {r.rejection_reason}
                          </div>
                        )}
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

export default StorePhysicalCount;
