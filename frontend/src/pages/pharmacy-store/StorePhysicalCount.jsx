import React, { useState, useEffect, useCallback } from 'react';
import { ClipboardCheck, Plus, Trash2, Search, Eye, EyeOff, RefreshCw, CheckCircle, Package, Calendar, Hash, ChevronDown, ChevronUp, AlertCircle, FileText } from 'lucide-react';
import { NotifStore } from './StoreHomeNew';
import SegmentedSpinner from '../../components/ui/SegmentedSpinner';

/* ─── Color Palette ─────────────────────────────────────────── */
const G = {
  forest: '#228B22', dark: '#1B5E20', emerald: '#2E8B57', leaf: '#4CAF50',
  sage: '#A5D6A7', olive: '#6B8E23', mint: '#98FF98', lime: '#8BC34A',
  brown: '#8D6E63', sky: '#87CEEB', white: '#FFFFFF', lightGray: '#F5F5F5',
  darkGray: '#424242', orange: '#FF9800', red: '#F44336', blue: '#0288D1',
};

const API = '/api/v1/store-inventory';
function hdrs() { return { 'Content-Type': 'application/json', Authorization: 'Bearer ' + (localStorage.getItem('token') || '') }; }
async function apiFetch(url, opts = {}) {
  const r = await fetch(url, { headers: hdrs(), ...opts });
  const d = await r.json();
  if (!r.ok) throw new Error(d.message || 'Request failed');
  return d;
}

/* ─── CSS Styles ────────────────────────────────────────────── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
  * { box-sizing: border-box; }
  .pc-page { font-family: 'Inter', sans-serif; background: ${G.lightGray}; min-height: 100vh; width: 100%; }
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
  .btn-primary:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 10px 24px rgba(27,94,32,0.4); }
  .btn-primary:active:not(:disabled) { transform: translateY(2px); border-bottom: 1px solid ${G.dark}; box-shadow: none; }
  .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

  .btn-blue {
    background: linear-gradient(145deg, #03A9F4, ${G.blue});
    color: #fff; border: none; border-bottom: 4px solid #01579B;
    border-right: 3px solid #01579B; padding: 11px 22px;
    font-weight: 800; font-size: 13px; cursor: pointer; display: inline-flex;
    align-items: center; gap: 7px; transition: all 0.15s; font-family: 'Inter', sans-serif;
    box-shadow: 0 6px 16px rgba(2,136,209,0.25);
  }
  .btn-blue:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 10px 24px rgba(2,136,209,0.35); }
  .btn-blue:active:not(:disabled) { transform: translateY(2px); border-bottom: 1px solid #01579B; box-shadow: none; }

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
  .btn-danger:hover:not(:disabled) { transform: translateY(-1px); }
  .btn-danger:active:not(:disabled) { transform: translateY(1px); border-bottom: 1px solid #B71C1C; }
  .btn-danger:disabled { opacity: 0.4; cursor: not-allowed; }

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
  .pc-card {
    background: ${G.white}; border: 2px solid ${G.dark};
    box-shadow: 5px 5px 0 ${G.sage}; transition: all 0.2s;
    animation: fadeIn 0.3s ease;
  }
  .pc-card:hover { box-shadow: 7px 7px 0 ${G.olive}; transform: translateY(-1px); }

  /* Input */
  .pc-input {
    width: 100%; padding: 10px 13px;
    border: 2px solid ${G.sage}; background: #fff;
    font-family: 'Inter', sans-serif; font-size: 13px;
    outline: none; color: ${G.darkGray}; transition: border 0.2s;
  }
  .pc-input:focus { border-color: ${G.forest}; box-shadow: 0 0 0 3px rgba(34,139,34,0.12); }
  .pc-input-readonly { background: #F0F9F0; color: ${G.forest}; font-weight: 800; cursor: default; }

  /* Badge */
  .badge-await { background: #EFF6FF; color: #1D4ED8; border: 2px solid #3B82F6; padding: 4px 10px; font-weight: 800; font-size: 11px; }
  .badge-approved { background: #D1FAE5; color: ${G.dark}; border: 2px solid ${G.leaf}; padding: 4px 10px; font-weight: 800; font-size: 11px; }
  .badge-rejected { background: #FEE2E2; color: #991B1B; border: 2px solid ${G.red}; padding: 4px 10px; font-weight: 800; font-size: 11px; }
  .badge-variance { background: #FFEBEE; color: ${G.red}; border: 2px solid ${G.red}; padding: 4px 10px; font-weight: 800; font-size: 11px; }
  .badge-balanced { background: #E8F5E9; color: ${G.forest}; border: 2px solid ${G.forest}; padding: 4px 10px; font-weight: 800; font-size: 11px; }

  /* Table */
  .pc-table { width: 100%; border-collapse: collapse; font-size: 12px; }
  .pc-table th { background: ${G.dark}; color: #fff; padding: 10px 14px; text-align: left; font-weight: 800; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; }
  .pc-table td { padding: 10px 14px; border-bottom: 1px solid ${G.sage}; color: ${G.darkGray}; vertical-align: middle; }
  .pc-table tr:nth-child(even) td { background: #F1F8E9; }
  .pc-table tr:last-child td { border-bottom: none; }
  .pc-table tr:hover td { background: #E8F5E9; }

  /* Detail expand */
  .pc-detail { animation: slideDown 0.3s ease; overflow: hidden; }

  /* Search bar */
  .pc-search { background: #fff; border: 2px solid ${G.dark}; box-shadow: 3px 3px 0 ${G.sage}; padding: 12px 16px; display: flex; align-items: center; gap: 10px; }
  .pc-search input { border: none; outline: none; flex: 1; font-family: 'Inter', sans-serif; font-size: 13px; background: transparent; color: ${G.darkGray}; }

  /* Modal */
  .pc-modal-bg { position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 16px; backdrop-filter: blur(4px); }
  .pc-modal { background: #fff; border: 3px solid ${G.dark}; box-shadow: 10px 10px 0 ${G.dark}; width: 100%; max-width: 860px; max-height: 92vh; display: flex; flex-direction: column; }

  /* Stat chips */
  .stat-chip { background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.3); padding: 10px 18px; text-align: center; }

  /* Responsive */
  @media (max-width: 640px) {
    .pc-grid-2 { grid-template-columns: 1fr !important; }
    .pc-header-row { flex-direction: column; align-items: flex-start !important; }
    .pc-header-actions { width: 100%; justify-content: flex-end; }
    .pc-card-row { flex-direction: column; align-items: flex-start !important; }
    .pc-table { font-size: 11px; }
    .pc-table th, .pc-table td { padding: 7px 8px; }
    .btn-primary, .btn-blue { padding: 9px 14px; font-size: 12px; }
    .pc-modal { margin: 8px; max-height: 95vh; }
    .pc-stats { flex-wrap: wrap; }
    .pc-lines-table { overflow-x: auto; display: block; }
  }
`;

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
      NotifStore.push(`✅ ${form.count_no} submitted for CEO approval!`, 'success');
      onSuccess();
    } catch (e) { NotifStore.push('❌ Failed: ' + e.message, 'error'); }
    finally { setSaving(false); }
  };

  return (
    <div className="pc-modal-bg">
      <div className="pc-modal">
        {/* Header */}
        <div style={{ background: `linear-gradient(135deg, ${G.dark}, ${G.forest})`, color: '#fff', padding: '18px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ background: G.blue, padding: 8, boxShadow: '3px 3px 0 rgba(0,0,0,0.3)' }}>
              <ClipboardCheck size={20} color="#fff" />
            </div>
            <div>
              <div style={{ fontWeight: 900, fontSize: 16 }}>New Physical Count</div>
              <div style={{ fontSize: 11, opacity: 0.8 }}>Submit count for CEO approval</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', color: '#fff', width: 34, height: 34, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 900 }}>×</button>
        </div>

        <form onSubmit={handleSubmit} style={{ overflowY: 'auto', padding: 24, flex: 1 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 14, marginBottom: 22 }} className="pc-grid-2">
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: G.dark, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 5 }}>
                <Hash size={11} style={{ display: 'inline', marginRight: 4 }} />Count No
              </label>
              <div style={{ position: 'relative' }}>
                <input value={loadingNo ? 'Generating…' : form.count_no} readOnly className="pc-input pc-input-readonly" />
                {loadingNo && <SegmentedSpinner size={24} />}
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: G.dark, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 5 }}>
                <Calendar size={11} style={{ display: 'inline', marginRight: 4 }} />Date
              </label>
              <input type="date" value={form.count_date} onChange={e => setForm(p => ({ ...p, count_date: e.target.value }))} className="pc-input" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: G.dark, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 5 }}>Counted By *</label>
              <input value={form.counted_by} onChange={e => setForm(p => ({ ...p, counted_by: e.target.value }))} className="pc-input" required placeholder="Staff name" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: G.dark, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 5 }}>Remarks</label>
              <input value={form.remarks} onChange={e => setForm(p => ({ ...p, remarks: e.target.value }))} placeholder="Optional notes…" className="pc-input" />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, borderBottom: `2px solid ${G.sage}`, paddingBottom: 10 }}>
            <span style={{ fontWeight: 900, fontSize: 13, color: G.dark, textTransform: 'uppercase', letterSpacing: 1 }}>
              Count Lines ({items.length})
            </span>
            <button type="button" onClick={() => setItems(p => [...p, { drug_id: '', system_quantity: 0, physical_quantity: '', batch_no: '' }])} className="btn-blue" style={{ padding: '7px 14px', fontSize: 12 }}>
              <Plus size={13} /> Add Line
            </button>
          </div>

          <div style={{ border: `2px solid ${G.dark}`, marginBottom: 22, overflow: 'hidden' }} className="pc-lines-table">
            <table className="pc-table">
              <thead>
                <tr>
                  <th style={{ width: '30%' }}>Drug *</th>
                  <th>Batch (Auto)</th>
                  <th>System Qty</th>
                  <th>Physical Qty *</th>
                  <th>Variance</th>
                  <th style={{ width: 40 }}></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => {
                  const variance = item.physical_quantity !== '' ? Number(item.physical_quantity) - Number(item.system_quantity) : null;
                  return (
                    <tr key={i}>
                      <td style={{ padding: 6 }}>
                        <select value={item.drug_id} onChange={e => setItem(i, 'drug_id', e.target.value)} className="pc-input" style={{ padding: '7px 8px' }} required>
                          <option value="">Select drug…</option>
                          {drugs.map(d => <option key={d.drug_id || d.id} value={d.drug_id || d.id}>{d.drug_name || d.name}{d.strength ? ' ' + d.strength : ''}</option>)}
                        </select>
                      </td>
                      <td style={{ padding: 6 }}>
                        <input type="text" value={item.batch_no} onChange={e => setItem(i, 'batch_no', e.target.value)} placeholder="Auto" className="pc-input" style={{ padding: '7px 8px', background: item.batch_no ? '#F0F9F0' : '#fff', fontWeight: item.batch_no ? 700 : 400, color: item.batch_no ? G.forest : G.darkGray }} />
                      </td>
                      <td style={{ padding: 6 }}>
                        <div style={{ padding: '8px 10px', background: G.lightGray, border: `1px solid ${G.sage}`, fontWeight: 800, color: G.dark }}>{item.system_quantity}</div>
                      </td>
                      <td style={{ padding: 6 }}>
                        <input type="number" min={0} value={item.physical_quantity} onChange={e => setItem(i, 'physical_quantity', e.target.value)} className="pc-input" style={{ padding: '7px 8px' }} required />
                      </td>
                      <td style={{ padding: 6 }}>
                        {variance !== null && (
                          <div style={{ padding: '8px 10px', fontWeight: 900, color: variance === 0 ? G.forest : variance > 0 ? G.blue : G.red, background: variance === 0 ? '#E8F5E9' : variance > 0 ? '#E1F5FE' : '#FFEBEE', border: `1px solid ${variance === 0 ? G.forest : variance > 0 ? G.blue : G.red}` }}>
                            {variance > 0 ? '+' : ''}{variance}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: 6, textAlign: 'center' }}>
                        <button type="button" onClick={() => setItems(p => p.filter((_, idx) => idx !== i))} disabled={items.length === 1} className="btn-danger">
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
            <button type="button" onClick={onClose} className="btn-cancel">Cancel</button>
            <button type="submit" disabled={saving || loadingNo} className="btn-primary" style={{ opacity: saving || loadingNo ? 0.7 : 1 }}>
              <CheckCircle size={16} />
              {saving ? 'Submitting…' : 'Submit Physical Count'}
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
      <div style={{ background: `linear-gradient(135deg, ${G.dark} 0%, ${G.forest} 55%, ${G.emerald} 100%)`, padding: '24px 32px 0', color: '#fff', borderBottom: `4px solid ${G.dark}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14, marginBottom: 20 }} className="pc-header-row">
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ background: G.blue, padding: 12, boxShadow: '4px 4px 0 rgba(0,0,0,0.3)', border: `2px solid ${G.white}` }}>
              <ClipboardCheck size={28} color="#fff" />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 24, fontWeight: 900, letterSpacing: -0.5 }}>Physical Counts</h1>
              <p style={{ margin: 0, fontSize: 13, opacity: 0.8 }}>Audit physical inventory vs system quantities · CEO approval required</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }} className="pc-header-actions">
            <button onClick={() => setShowForm(true)} className="btn-blue">
              <Plus size={17} /> New Physical Count
            </button>
            <button onClick={load} className="btn-ghost">
              <SegmentedSpinner size={15} />
            </button>
          </div>
        </div>

        {/* Stats Strip */}
        <div style={{ display: 'flex', gap: 0, borderTop: '1px solid rgba(255,255,255,0.15)' }} className="pc-stats">
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
        <div className="pc-search" style={{ marginBottom: 20 }}>
          <Search size={17} color={G.olive} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by count no or counted by…" />
          <span style={{ fontWeight: 800, color: G.forest, fontSize: 12, background: G.sage, padding: '3px 10px', whiteSpace: 'nowrap' }}>
            {filtered.length} records
          </span>
        </div>

        {loading ? (
          <div style={{ padding: 80, textAlign: 'center' }}>
            <SegmentedSpinner size={24} />
            <div style={{ color: G.forest, fontWeight: 700, fontSize: 14 }}>Loading physical counts…</div>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 80, textAlign: 'center', border: `3px dashed ${G.sage}`, background: '#FAFFF5' }}>
            <ClipboardCheck size={40} color={G.sage} style={{ marginBottom: 12 }} />
            <div style={{ color: G.olive, fontWeight: 700, fontSize: 15 }}>No physical counts found</div>
            <div style={{ color: G.sage, fontSize: 13, marginTop: 4 }}>Start an audit using the button above</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {filtered.map(r => {
              const isOpen = expanded === r.id;
              const date = r.count_date ? new Date(r.count_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : new Date(r.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
              
              const items = r.items || [];
              const hasVariance = items.some(it => Number(it.variance) !== 0);

              return (
                <div key={r.id} className="pc-card" style={{ overflow: 'hidden' }}>
                  {/* Card Row */}
                  <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, borderLeft: `5px solid ${r.status === 'APPROVED' ? G.leaf : r.status === 'REJECTED' ? G.red : G.blue}` }} className="pc-card-row">
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div style={{ background: r.status === 'APPROVED' ? G.leaf : r.status === 'REJECTED' ? G.red : G.blue, padding: 10, boxShadow: '3px 3px 0 rgba(0,0,0,0.2)', flexShrink: 0 }}>
                        <ClipboardCheck size={20} color="#fff" />
                      </div>
                      <div>
                        <div style={{ fontWeight: 900, fontSize: 15, color: G.dark, marginBottom: 2 }}>
                          {r.count_no || `PC-${r.id}`}
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 14px', fontSize: 12, color: G.olive }}>
                          <span><Calendar size={11} style={{ display: 'inline', marginRight: 3 }} />{date}</span>
                          <span><Package size={11} style={{ display: 'inline', marginRight: 3 }} />{(r.items || []).length} line{(r.items || []).length > 1 ? 's' : ''}</span>
                          <span>👤 By: {r.counted_by || 'N/A'}</span>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexShrink: 0 }}>
                      <span className={hasVariance ? "badge-variance" : "badge-balanced"}>
                        {hasVariance ? '⚠ VARIANCE' : '✓ BALANCED'}
                      </span>
                      <StatusBadge status={r.status || 'PENDING'} />
                      <button
                        onClick={() => setExpanded(isOpen ? null : r.id)}
                        className="btn-view"
                      >
                        {isOpen ? <><EyeOff size={14} /> Hide</> : <><Eye size={14} /> Details</>}
                        {isOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                      </button>
                    </div>
                  </div>

                  {/* Expandable Detail */}
                  {isOpen && (r.items || []).length > 0 && (
                    <div className="pc-detail" style={{ borderTop: `2px solid ${G.sage}` }}>
                      {/* Lines Table */}
                      <div style={{ overflowX: 'auto' }}>
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
                            {r.items.map((line, li) => {
                              const v = Number(line.variance ?? (line.physical_quantity - line.system_quantity));
                              return (
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
                                  <td style={{ fontWeight: 600 }}>{line.system_quantity}</td>
                                  <td style={{ fontWeight: 800, color: G.dark }}>{line.physical_quantity}</td>
                                  <td>
                                    <strong style={{ color: v === 0 ? G.forest : v > 0 ? G.blue : G.red, fontSize: 14 }}>
                                      {v > 0 ? '+' : ''}{v}
                                    </strong>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      {/* Remarks / Rejection */}
                      {(r.remarks || r.rejection_reason) && (
                        <div style={{ padding: '16px 20px', background: '#FAFFF5', display: 'flex', flexDirection: 'column', gap: 10 }}>
                          {r.remarks && (
                            <div>
                              <strong style={{ fontSize: 12, color: G.olive, textTransform: 'uppercase', letterSpacing: 1 }}>Remarks</strong>
                              <div style={{ fontSize: 13, color: G.darkGray }}>{r.remarks}</div>
                            </div>
                          )}
                          {r.status === 'REJECTED' && r.rejection_reason && (
                            <div style={{ background: '#FFF5F5', borderLeft: `4px solid ${G.red}`, padding: '10px 14px' }}>
                              <strong style={{ fontSize: 12, color: G.red, textTransform: 'uppercase', letterSpacing: 1 }}>Rejection Reason</strong>
                              <div style={{ fontSize: 13, color: '#7F1D1D', fontWeight: 600 }}>{r.rejection_reason}</div>
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
    </div>
  );
};

export default StorePhysicalCount;
