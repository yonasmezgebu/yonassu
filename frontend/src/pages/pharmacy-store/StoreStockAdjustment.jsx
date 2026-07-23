import React, { useState, useEffect, useCallback } from 'react';
import { Sliders, Plus, Trash2, Search, Eye, EyeOff, RefreshCw, CheckCircle, XCircle, Package, Calendar, Hash, AlertCircle, ChevronDown, ChevronUp, TrendingUp, TrendingDown } from 'lucide-react';
import { NotifStore } from './StoreHomeNew';

/* ─── Color Palette ─────────────────────────────────────────── */
const G = {
  forest: '#228B22', dark: '#1B5E20', emerald: '#2E8B57', leaf: '#4CAF50',
  sage: '#A5D6A7', olive: '#6B8E23', mint: '#98FF98', lime: '#8BC34A',
  brown: '#8D6E63', sky: '#87CEEB', white: '#FFFFFF', lightGray: '#F5F5F5',
  darkGray: '#424242', orange: '#FF9800', red: '#F44336',
};

const API = '/api/v1/store-inventory';
function hdrs() { return { 'Content-Type': 'application/json', Authorization: 'Bearer ' + (localStorage.getItem('token') || '') }; }
async function apiFetch(url, opts = {}) {
  const r = await fetch(url, { headers: hdrs(), ...opts });
  const d = await r.json();
  if (!r.ok) throw new Error(d.message || 'Request failed');
  return d;
}

const REASONS = ['Damaged goods', 'Expired goods', 'Count correction', 'System error correction', 'Donation/Write-off', 'Other'];

/* ─── CSS Styles (injected once) ────────────────────────────── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
  * { box-sizing: border-box; }
  .adj-page { font-family: 'Inter', sans-serif; background: ${G.lightGray}; min-height: 100vh; width: 100%; }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes slideDown { from { opacity: 0; max-height: 0; } to { opacity: 1; max-height: 1000px; } }

  /* 3D Buttons */
  .btn-primary {
    background: linear-gradient(145deg, ${G.emerald}, ${G.forest});
    color: #fff; border: none; border-bottom: 4px solid ${G.dark};
    border-right: 3px solid ${G.dark}; padding: 11px 22px;
    font-weight: 800; font-size: 13px; cursor: pointer; display: inline-flex;
    align-items: center; gap: 7px; transition: all 0.15s; font-family: 'Inter', sans-serif;
    box-shadow: 0 6px 16px rgba(27,94,32,0.3);
  }
  .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 10px 24px rgba(27,94,32,0.4); }
  .btn-primary:active { transform: translateY(2px); border-bottom: 1px solid ${G.dark}; box-shadow: none; }

  .btn-orange {
    background: linear-gradient(145deg, #FFA726, ${G.orange});
    color: #fff; border: none; border-bottom: 4px solid #E65100;
    border-right: 3px solid #E65100; padding: 11px 22px;
    font-weight: 800; font-size: 13px; cursor: pointer; display: inline-flex;
    align-items: center; gap: 7px; transition: all 0.15s; font-family: 'Inter', sans-serif;
    box-shadow: 0 6px 16px rgba(230,81,0,0.25);
  }
  .btn-orange:hover { transform: translateY(-2px); box-shadow: 0 10px 24px rgba(230,81,0,0.35); }
  .btn-orange:active { transform: translateY(2px); border-bottom: 1px solid #E65100; box-shadow: none; }

  .btn-ghost {
    background: rgba(255,255,255,0.15); backdrop-filter: blur(8px);
    color: #fff; border: 2px solid rgba(255,255,255,0.4); padding: 10px 14px;
    font-weight: 700; font-size: 13px; cursor: pointer; display: inline-flex;
    align-items: center; gap: 7px; transition: all 0.15s; font-family: 'Inter', sans-serif;
  }
  .btn-ghost:hover { background: rgba(255,255,255,0.25); }

  .btn-danger {
    background: linear-gradient(145deg, #EF5350, ${G.red});
    color: #fff; border: none; border-bottom: 3px solid #B71C1C;
    padding: 7px 10px; cursor: pointer; display: inline-flex;
    align-items: center; transition: all 0.15s;
    box-shadow: 0 4px 10px rgba(211,47,47,0.3);
  }
  .btn-danger:hover { transform: translateY(-1px); }
  .btn-danger:active { transform: translateY(1px); border-bottom: 1px solid #B71C1C; }
  .btn-danger:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }

  .btn-view {
    background: linear-gradient(145deg, #fff, #f0f9f0);
    color: ${G.forest}; border: 2px solid ${G.forest};
    border-bottom: 3px solid ${G.dark}; padding: 7px 14px;
    font-weight: 700; font-size: 12px; cursor: pointer; display: inline-flex;
    align-items: center; gap: 6px; transition: all 0.15s; font-family: 'Inter', sans-serif;
    box-shadow: 0 3px 8px rgba(34,139,34,0.2);
  }
  .btn-view:hover { background: linear-gradient(145deg, #E8F5E9, #C8E6C9); transform: translateY(-1px); }
  .btn-view:active { transform: translateY(1px); border-bottom: 1px solid ${G.dark}; }

  .btn-cancel {
    background: linear-gradient(145deg, #fff, #f5f5f5);
    color: ${G.darkGray}; border: 2px solid #9E9E9E; border-bottom: 3px solid #616161;
    padding: 11px 22px; font-weight: 700; font-size: 13px; cursor: pointer;
    display: inline-flex; align-items: center; gap: 7px; transition: all 0.15s;
    font-family: 'Inter', sans-serif; box-shadow: 0 3px 8px rgba(0,0,0,0.1);
  }
  .btn-cancel:hover { background: #f0f0f0; transform: translateY(-1px); }

  /* Cards */
  .adj-card {
    background: ${G.white}; border: 2px solid ${G.dark};
    box-shadow: 5px 5px 0 ${G.sage}; transition: all 0.2s;
    animation: fadeIn 0.3s ease;
  }
  .adj-card:hover { box-shadow: 7px 7px 0 ${G.olive}; transform: translateY(-1px); }

  /* Input */
  .adj-input {
    width: 100%; padding: 10px 13px;
    border: 2px solid ${G.sage}; background: #fff;
    font-family: 'Inter', sans-serif; font-size: 13px;
    outline: none; color: ${G.darkGray}; transition: border 0.2s;
  }
  .adj-input:focus { border-color: ${G.forest}; box-shadow: 0 0 0 3px rgba(34,139,34,0.12); }
  .adj-input-readonly { background: #F0F9F0; color: ${G.forest}; font-weight: 800; cursor: default; }

  /* Badge */
  .badge-await { background: #EFF6FF; color: #1D4ED8; border: 2px solid #3B82F6; padding: 4px 10px; font-weight: 800; font-size: 11px; }
  .badge-approved { background: #D1FAE5; color: ${G.dark}; border: 2px solid ${G.leaf}; padding: 4px 10px; font-weight: 800; font-size: 11px; }
  .badge-rejected { background: #FEE2E2; color: #991B1B; border: 2px solid ${G.red}; padding: 4px 10px; font-weight: 800; font-size: 11px; }

  /* Table */
  .adj-table { width: 100%; border-collapse: collapse; font-size: 12px; }
  .adj-table th { background: ${G.dark}; color: #fff; padding: 10px 14px; text-align: left; font-weight: 800; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; }
  .adj-table td { padding: 10px 14px; border-bottom: 1px solid ${G.sage}; color: ${G.darkGray}; vertical-align: middle; }
  .adj-table tr:nth-child(even) td { background: #F1F8E9; }
  .adj-table tr:last-child td { border-bottom: none; }
  .adj-table tr:hover td { background: #E8F5E9; }

  /* Detail expand */
  .adj-detail { animation: slideDown 0.3s ease; overflow: hidden; }

  /* Search bar */
  .adj-search { background: #fff; border: 2px solid ${G.dark}; box-shadow: 3px 3px 0 ${G.sage}; padding: 12px 16px; display: flex; align-items: center; gap: 10px; }
  .adj-search input { border: none; outline: none; flex: 1; font-family: 'Inter', sans-serif; font-size: 13px; background: transparent; color: ${G.darkGray}; }

  /* Modal */
  .adj-modal-bg { position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 16px; backdrop-filter: blur(4px); }
  .adj-modal { background: #fff; border: 3px solid ${G.dark}; box-shadow: 10px 10px 0 ${G.dark}; width: 100%; max-width: 800px; max-height: 92vh; display: flex; flex-direction: column; }

  /* Stat chips */
  .stat-chip { background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.3); padding: 10px 18px; text-align: center; }

  /* Responsive */
  @media (max-width: 640px) {
    .adj-grid-2 { grid-template-columns: 1fr !important; }
    .adj-header-row { flex-direction: column; align-items: flex-start !important; }
    .adj-header-actions { width: 100%; justify-content: flex-end; }
    .adj-card-row { flex-direction: column; align-items: flex-start !important; }
    .adj-table { font-size: 11px; }
    .adj-table th, .adj-table td { padding: 7px 8px; }
    .btn-primary, .btn-orange { padding: 9px 14px; font-size: 12px; }
    .adj-modal { margin: 8px; max-height: 95vh; }
    .adj-stats { flex-wrap: wrap; }
    .adj-lines-table { overflow-x: auto; display: block; }
  }
`;

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
      NotifStore.push(`✅ ${form.adjustment_no} submitted for CEO approval!`, 'success');
      onSuccess();
    } catch (e) { NotifStore.push('❌ Failed: ' + e.message, 'error'); }
    finally { setSaving(false); }
  };

  return (
    <div className="adj-modal-bg">
      <div className="adj-modal">
        {/* Header */}
        <div style={{ background: `linear-gradient(135deg, ${G.dark}, ${G.forest})`, color: '#fff', padding: '18px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ background: G.orange, padding: 8, boxShadow: '3px 3px 0 rgba(0,0,0,0.3)' }}>
              <Sliders size={20} color="#fff" />
            </div>
            <div>
              <div style={{ fontWeight: 900, fontSize: 16 }}>New Stock Adjustment</div>
              <div style={{ fontSize: 11, opacity: 0.8 }}>Submit for CEO approval</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', color: '#fff', width: 34, height: 34, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 900 }}>×</button>
        </div>

        <form onSubmit={handleSubmit} style={{ overflowY: 'auto', padding: 24, flex: 1 }}>
          {/* Form Fields */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 14, marginBottom: 22 }} className="adj-grid-2">
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: G.dark, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 5 }}>
                <Hash size={11} style={{ display: 'inline', marginRight: 4 }} />Adjustment No
              </label>
              <div style={{ position: 'relative' }}>
                <input value={loadingNo ? 'Generating…' : form.adjustment_no} readOnly className="adj-input adj-input-readonly" />
                {loadingNo && <div style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, border: `2px solid ${G.sage}`, borderTop: `2px solid ${G.forest}`, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />}
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: G.dark, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 5 }}>
                <Calendar size={11} style={{ display: 'inline', marginRight: 4 }} />Date
              </label>
              <input type="date" value={form.adjustment_date} onChange={e => setForm(p => ({ ...p, adjustment_date: e.target.value }))} className="adj-input" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: G.dark, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 5 }}>
                <AlertCircle size={11} style={{ display: 'inline', marginRight: 4 }} />Reason *
              </label>
              <select value={form.reason} onChange={e => setForm(p => ({ ...p, reason: e.target.value }))} className="adj-input" required>
                <option value="">Select reason…</option>
                {REASONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: G.dark, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 5 }}>Remarks</label>
              <input value={form.remarks} onChange={e => setForm(p => ({ ...p, remarks: e.target.value }))} placeholder="Optional notes…" className="adj-input" />
            </div>
          </div>

          {/* Lines Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, borderBottom: `2px solid ${G.sage}`, paddingBottom: 10 }}>
            <span style={{ fontWeight: 900, fontSize: 13, color: G.dark, textTransform: 'uppercase', letterSpacing: 1 }}>
              Adjustment Lines ({items.length})
            </span>
            <button type="button" onClick={() => setItems(p => [...p, { drug_id: '', adjustment_type: 'ADD', quantity: '', batch_no: '' }])} className="btn-orange" style={{ padding: '7px 14px', fontSize: 12 }}>
              <Plus size={13} /> Add Line
            </button>
          </div>

          {/* Lines Table */}
          <div style={{ border: `2px solid ${G.dark}`, marginBottom: 22, overflow: 'hidden' }} className="adj-lines-table">
            <table className="adj-table">
              <thead>
                <tr>
                  <th style={{ width: '35%' }}>Drug *</th>
                  <th>Batch No</th>
                  <th>Type</th>
                  <th>Qty *</th>
                  <th style={{ width: 40 }}></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <tr key={i}>
                    <td style={{ padding: 6 }}>
                      <select value={item.drug_id} onChange={e => handleDrugChange(i, e.target.value)} className="adj-input" style={{ padding: '7px 8px' }} required>
                        <option value="">Select drug…</option>
                        {drugs.map(d => <option key={d.drug_id || d.id} value={d.drug_id || d.id}>{d.drug_name || d.name}{d.strength ? ' ' + d.strength : ''}</option>)}
                      </select>
                    </td>
                    <td style={{ padding: 6 }}>
                      <input type="text" value={item.batch_no} onChange={e => setItem(i, 'batch_no', e.target.value)} placeholder="Auto" className="adj-input" style={{ padding: '7px 8px', background: item.batch_no ? '#F0F9F0' : '#fff', fontWeight: item.batch_no ? 700 : 400, color: item.batch_no ? G.forest : G.darkGray }} />
                    </td>
                    <td style={{ padding: 6 }}>
                      <select value={item.adjustment_type} onChange={e => setItem(i, 'adjustment_type', e.target.value)} className="adj-input" style={{ padding: '7px 8px', color: item.adjustment_type === 'ADD' ? G.forest : G.red, fontWeight: 800 }}>
                        <option value="ADD">＋ ADD</option>
                        <option value="REMOVE">－ REMOVE</option>
                      </select>
                    </td>
                    <td style={{ padding: 6 }}>
                      <input type="number" min={1} value={item.quantity} onChange={e => setItem(i, 'quantity', e.target.value)} className="adj-input" style={{ padding: '7px 8px' }} required />
                    </td>
                    <td style={{ padding: 6, textAlign: 'center' }}>
                      <button type="button" onClick={() => setItems(p => p.filter((_, idx) => idx !== i))} disabled={items.length === 1} className="btn-danger">
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
            <button type="button" onClick={onClose} className="btn-cancel">Cancel</button>
            <button type="submit" disabled={saving || loadingNo} className="btn-primary" style={{ opacity: saving || loadingNo ? 0.7 : 1 }}>
              <CheckCircle size={16} />
              {saving ? 'Submitting…' : 'Submit Adjustment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ─── Status Badge ───────────────────────────────────────────── */
const StatusBadge = ({ status }) => {
  if (status === 'APPROVED') return <span className="badge-approved">✅ APPROVED</span>;
  if (status === 'REJECTED') return <span className="badge-rejected">❌ REJECTED</span>;
  return <span className="badge-await">⏳ AWAITING APPROVAL</span>;
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

  // Group individual rows by adjustment_no so detail shows all lines together
  const grouped = React.useMemo(() => {
    const map = {};
    adjustments.forEach(r => {
      const key = r.adjustment_no || `adj-${r.id}`;
      if (!map[key]) {
        map[key] = { ...r, lines: [] };
      }
      map[key].lines.push(r);
      // Use worst status (PENDING > REJECTED > APPROVED)
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
      <div style={{ background: `linear-gradient(135deg, ${G.dark} 0%, ${G.forest} 55%, ${G.emerald} 100%)`, padding: '24px 32px 0', color: '#fff', borderBottom: `4px solid ${G.dark}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14, marginBottom: 20 }} className="adj-header-row">
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ background: G.orange, padding: 12, boxShadow: '4px 4px 0 rgba(0,0,0,0.3)' }}>
              <Sliders size={28} color="#fff" />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 24, fontWeight: 900, letterSpacing: -0.5 }}>Stock Adjustments</h1>
              <p style={{ margin: 0, fontSize: 13, opacity: 0.8 }}>Add or remove stock quantities · CEO approval required</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }} className="adj-header-actions">
            <button onClick={() => setShowForm(true)} className="btn-orange">
              <Plus size={17} /> New Adjustment
            </button>
            <button onClick={load} className="btn-ghost">
              <RefreshCw size={15} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            </button>
          </div>
        </div>

        {/* Stats Strip */}
        <div style={{ display: 'flex', gap: 0, borderTop: '1px solid rgba(255,255,255,0.15)' }} className="adj-stats">
          {[
            { label: 'Total', value: stats.total, icon: <Package size={14} /> },
            { label: 'Awaiting', value: stats.awaiting, icon: '⏳' },
            { label: 'Approved', value: stats.approved, icon: '✅' },
            { label: 'Rejected', value: stats.rejected, icon: '❌' },
          ].map((s, i) => (
            <div key={i} className="stat-chip" style={{ flex: 1, borderRight: i < 3 ? '1px solid rgba(255,255,255,0.15)' : 'none', padding: '12px 16px' }}>
              <div style={{ fontSize: 10, opacity: 0.75, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 }}>{s.icon} {s.label}</div>
              <div style={{ fontSize: 22, fontWeight: 900 }}>{s.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ padding: '24px 32px' }}>

        {/* Search Bar */}
        <div className="adj-search" style={{ marginBottom: 20 }}>
          <Search size={17} color={G.olive} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by adjustment no, reason, or drug name…" />
          <span style={{ fontWeight: 800, color: G.forest, fontSize: 12, background: G.sage, padding: '3px 10px', whiteSpace: 'nowrap' }}>
            {filtered.length} records
          </span>
        </div>

        {/* List */}
        {loading ? (
          <div style={{ padding: 80, textAlign: 'center' }}>
            <div style={{ width: 44, height: 44, border: `4px solid ${G.sage}`, borderTop: `4px solid ${G.forest}`, borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
            <div style={{ color: G.forest, fontWeight: 700, fontSize: 14 }}>Loading adjustments…</div>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 80, textAlign: 'center', border: `3px dashed ${G.sage}`, background: '#FAFFF5' }}>
            <Sliders size={40} color={G.sage} style={{ marginBottom: 12 }} />
            <div style={{ color: G.olive, fontWeight: 700, fontSize: 15 }}>No adjustments found</div>
            <div style={{ color: G.sage, fontSize: 13, marginTop: 4 }}>Create your first stock adjustment using the button above</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {filtered.map((r, idx) => {
              const isOpen = expanded === (r.adjustment_no || r.id);
              const totalLines = r.lines?.length || 1;
              const date = r.adjustment_date ? new Date(r.adjustment_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : new Date(r.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

              return (
                <div key={r.adjustment_no || r.id} className="adj-card" style={{ overflow: 'hidden' }}>
                  {/* Card Row */}
                  <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, borderLeft: `5px solid ${r.status === 'APPROVED' ? G.leaf : r.status === 'REJECTED' ? G.red : G.sky}` }} className="adj-card-row">

                    {/* Left: Icon + Info */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div style={{ background: r.status === 'APPROVED' ? G.leaf : r.status === 'REJECTED' ? G.red : G.sky, padding: 10, boxShadow: '3px 3px 0 rgba(0,0,0,0.2)', flexShrink: 0 }}>
                        <Sliders size={20} color="#fff" />
                      </div>
                      <div>
                        <div style={{ fontWeight: 900, fontSize: 15, color: G.dark, marginBottom: 2 }}>
                          {r.adjustment_no || `ADJ-${r.id}`}
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 14px', fontSize: 12, color: G.olive }}>
                          <span><Calendar size={11} style={{ display: 'inline', marginRight: 3 }} />{date}</span>
                          <span><Package size={11} style={{ display: 'inline', marginRight: 3 }} />{totalLines} line{totalLines > 1 ? 's' : ''}</span>
                          <span>📋 {r.reason || 'N/A'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Badge + Button */}
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexShrink: 0 }}>
                      <StatusBadge status={r.status} />
                      <button
                        onClick={() => setExpanded(isOpen ? null : (r.adjustment_no || r.id))}
                        className="btn-view"
                      >
                        {isOpen ? <><EyeOff size={14} /> Hide</> : <><Eye size={14} /> Details</>}
                        {isOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                      </button>
                    </div>
                  </div>

                  {/* Expandable Detail */}
                  {isOpen && (
                    <div className="adj-detail" style={{ borderTop: `2px solid ${G.sage}` }}>
                      {/* Detail Header */}
                      <div style={{ background: '#F1F8E9', padding: '10px 20px', borderBottom: `1px solid ${G.sage}`, display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 12, color: G.olive, fontWeight: 700 }}>Adjustment No: <strong style={{ color: G.dark }}>{r.adjustment_no}</strong></span>
                        <span style={{ fontSize: 12, color: G.olive, fontWeight: 700 }}>Date: <strong style={{ color: G.dark }}>{date}</strong></span>
                        <span style={{ fontSize: 12, color: G.olive, fontWeight: 700 }}>Reason: <strong style={{ color: G.dark }}>{r.reason}</strong></span>
                        <span style={{ fontSize: 12, color: G.olive, fontWeight: 700 }}>Lines: <strong style={{ color: G.dark }}>{totalLines}</strong></span>
                      </div>

                      {/* Lines Table */}
                      <div style={{ overflowX: 'auto' }}>
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
                                <td style={{ fontWeight: 800, color: G.olive, width: 36 }}>{li + 1}</td>
                                <td>
                                  <div style={{ fontWeight: 700, color: G.dark }}>{line.drug_name || `Drug #${line.drug_id}`}</div>
                                  {line.strength && <div style={{ fontSize: 11, color: G.olive }}>{line.strength}</div>}
                                </td>
                                <td>
                                  <span style={{ background: '#F0F9F0', color: G.forest, fontWeight: 700, padding: '2px 8px', fontSize: 11 }}>
                                    {line.batch_no || '—'}
                                  </span>
                                </td>
                                <td>
                                  <span style={{ color: line.adjustment_type === 'ADD' ? G.forest : G.red, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 4 }}>
                                    {line.adjustment_type === 'ADD'
                                      ? <><TrendingUp size={13} /> + ADD</>
                                      : <><TrendingDown size={13} /> − REMOVE</>}
                                  </span>
                                </td>
                                <td style={{ color: G.darkGray }}>{line.quantity_before ?? '—'}</td>
                                <td>
                                  <strong style={{ color: line.adjustment_type === 'ADD' ? G.forest : G.red, fontSize: 14 }}>
                                    {line.adjustment_type === 'ADD' ? '+' : '−'}{Math.abs(line.adjustment_qty)}
                                  </strong>
                                </td>
                                <td style={{ color: G.darkGray }}>{line.quantity_after ?? '—'}</td>
                                <td><StatusBadge status={line.status} /></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Rejection reason */}
                      {r.status === 'REJECTED' && r.rejection_reason && (
                        <div style={{ padding: '10px 20px', background: '#FFF5F5', borderTop: `1px solid #FECACA` }}>
                          <span style={{ fontSize: 12, color: '#991B1B', fontWeight: 700 }}>❌ Rejection Reason: </span>
                          <span style={{ fontSize: 12, color: '#7F1D1D' }}>{r.rejection_reason}</span>
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
    </div>
  );
};

export default StoreStockAdjustment;
