import React, { useState, useEffect, useCallback } from 'react';
import { Sliders, Plus, Trash2, Search, Eye, RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import { NotifStore } from './StoreHomeNew';

const G = {
  forest:'#228B22', dark:'#1B5E20', emerald:'#2E8B57', leaf:'#4CAF50',
  sage:'#A5D6A7', olive:'#6B8E23', mint:'#98FF98',
  brown:'#8D6E63', white:'#FFFFFF', lightGray:'#F5F5F5',
  darkGray:'#424242', orange:'#FF9800', red:'#F44336',
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

const AdjustmentForm = ({ onSuccess, onClose }) => {
  const [drugs, setDrugs] = useState([]);
  const [form, setForm] = useState({ adjustment_no: 'ADJ-' + Date.now(), adjustment_date: new Date().toISOString().split('T')[0], reason: '', remarks: '' });
  const [items, setItems] = useState([{ drug_id: '', adjustment_type: 'ADD', quantity: '', batch_no: '' }]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiFetch(API + '/inventory').then(d => setDrugs(d.data || d || [])).catch(() => {});
  }, []);

  const setItem = (i, k, v) => setItems(prev => prev.map((it, idx) => idx === i ? { ...it, [k]: v } : it));

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.reason || items.some(it => !it.drug_id || !it.quantity)) {
      NotifStore.push('Fill all required fields.', 'warning'); return;
    }
    setSaving(true);
    try {
      await apiFetch(`${API}/adjustments`, {
        method: 'POST',
        body: JSON.stringify({ ...form, items: items.map(it => ({ ...it, quantity: Number(it.quantity) })) })
      });
      NotifStore.push('Adjustment recorded!', 'success');
      onSuccess();
    } catch (e) { NotifStore.push('Failed: ' + e.message, 'error'); }
    finally { setSaving(false); }
  };

  const inputStyle = { width: '100%', padding: '9px 12px', border: `2px solid ${G.dark}`, background: G.white, fontFamily: "'Inter', sans-serif", fontSize: 13, outline: 'none', color: G.darkGray, boxSizing: 'border-box' };
  const labelStyle = { fontSize: 11, fontWeight: 900, color: G.dark, textTransform: 'uppercase', letterSpacing: .5, marginBottom: 4, display: 'block' };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: G.white, border: `3px solid ${G.dark}`, boxShadow: `8px 8px 0 ${G.dark}`, width: '100%', maxWidth: 760, maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ background: G.dark, color: G.white, padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 900, fontSize: 16 }}><Sliders size={20} /> New Stock Adjustment</div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,.15)', border: `1px solid rgba(255,255,255,.4)`, color: G.white, padding: '5px 12px', cursor: 'pointer', fontWeight: 900, fontSize: 16, fontFamily: "'Inter', sans-serif" }}>×</button>
        </div>
        <form onSubmit={handleSubmit} style={{ overflowY: 'auto', padding: 24, flex: 1 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14, marginBottom: 20 }}>
            <div>
              <label style={labelStyle}>Adjustment No *</label>
              <input value={form.adjustment_no} onChange={e => setForm(p => ({ ...p, adjustment_no: e.target.value }))} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Date</label>
              <input type="date" value={form.adjustment_date} onChange={e => setForm(p => ({ ...p, adjustment_date: e.target.value }))} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Reason *</label>
              <select value={form.reason} onChange={e => setForm(p => ({ ...p, reason: e.target.value }))} style={inputStyle} required>
                <option value="">Select reason…</option>
                {REASONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Remarks</label>
              <input value={form.remarks} onChange={e => setForm(p => ({ ...p, remarks: e.target.value }))} style={inputStyle} />
            </div>
          </div>
          <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontWeight: 900, fontSize: 13, color: G.dark, textTransform: 'uppercase', letterSpacing: 1 }}>Adjustment Lines</div>
            <button type="button" onClick={() => setItems(p => [...p, { drug_id: '', adjustment_type: 'ADD', quantity: '', batch_no: '' }])} style={{ background: G.orange, border: `2px solid ${G.dark}`, boxShadow: `2px 2px 0 ${G.dark}`, color: G.white, padding: '6px 14px', cursor: 'pointer', fontWeight: 800, fontSize: 12, fontFamily: "'Inter', sans-serif", display: 'flex', alignItems: 'center', gap: 6 }}>
              <Plus size={14} /> Add Line
            </button>
          </div>
          <div style={{ border: `2px solid ${G.dark}`, marginBottom: 20 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: G.dark, color: G.white }}>
                  {['Drug *', 'Batch No', 'Type', 'Quantity *', ''].map(h => <th key={h} style={{ padding: '10px', textAlign: 'left', fontWeight: 900, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${G.sage}` }}>
                    <td style={{ padding: 6 }}>
                      <select value={item.drug_id} onChange={e => setItem(i, 'drug_id', e.target.value)} style={{ ...inputStyle, padding: '7px 8px' }} required>
                        <option value="">Select drug…</option>
                        {drugs.map(d => <option key={d.drug_id || d.id} value={d.drug_id || d.id}>{d.drug_name || d.name} {d.strength || ''}</option>)}
                      </select>
                    </td>
                    <td style={{ padding: 6 }}><input type="text" value={item.batch_no} onChange={e => setItem(i, 'batch_no', e.target.value)} style={{ ...inputStyle, padding: '7px 8px' }} /></td>
                    <td style={{ padding: 6 }}>
                      <select value={item.adjustment_type} onChange={e => setItem(i, 'adjustment_type', e.target.value)} style={{ ...inputStyle, padding: '7px 8px', color: item.adjustment_type === 'ADD' ? G.forest : G.red }}>
                        <option value="ADD">+ ADD</option>
                        <option value="REMOVE">− REMOVE</option>
                      </select>
                    </td>
                    <td style={{ padding: 6 }}><input type="number" min={1} value={item.quantity} onChange={e => setItem(i, 'quantity', e.target.value)} style={{ ...inputStyle, padding: '7px 8px' }} required /></td>
                    <td style={{ padding: 6 }}>
                      <button type="button" onClick={() => setItems(p => p.filter((_, idx) => idx !== i))} disabled={items.length === 1} style={{ background: G.red, border: 'none', color: G.white, padding: '6px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} style={{ background: G.lightGray, border: `2px solid ${G.dark}`, boxShadow: `3px 3px 0 ${G.dark}`, padding: '10px 20px', cursor: 'pointer', fontWeight: 800, fontSize: 13, fontFamily: "'Inter', sans-serif" }}>Cancel</button>
            <button type="submit" disabled={saving} style={{ background: G.forest, border: `2px solid ${G.dark}`, boxShadow: `3px 3px 0 ${G.dark}`, color: G.white, padding: '10px 20px', cursor: 'pointer', fontWeight: 800, fontSize: 13, fontFamily: "'Inter', sans-serif" }}>
              {saving ? 'Saving…' : 'Submit Adjustment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

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
    } catch (e) { NotifStore.push('Failed to load adjustments: ' + e.message, 'error'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = adjustments.filter(r => !search ||
    (r.adjustment_no || '').toLowerCase().includes(search.toLowerCase()) ||
    (r.reason || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ background: G.lightGray, minHeight: '100vh', width: '100%', fontFamily: "'Inter', sans-serif", padding: '0 0 60px' }}>
      <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
      {showForm && <AdjustmentForm onSuccess={() => { setShowForm(false); load(); }} onClose={() => setShowForm(false)} />}

      <div style={{ background: `linear-gradient(135deg, ${G.dark} 0%, ${G.forest} 60%, ${G.emerald} 100%)`, padding: '24px 36px', color: G.white, borderBottom: `4px solid ${G.dark}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ background: G.orange, padding: 8, border: `2px solid ${G.white}`, boxShadow: `3px 3px 0 ${G.dark}` }}>
              <Sliders size={24} color={G.white} />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900 }}>Stock Adjustment</h1>
              <p style={{ margin: 0, fontSize: 12, opacity: .8 }}>Add or remove stock with reason</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => setShowForm(true)} style={{ background: G.orange, border: `2px solid ${G.dark}`, boxShadow: `3px 3px 0 ${G.dark}`, color: G.white, padding: '9px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 800, fontSize: 13, fontFamily: "'Inter', sans-serif" }}>
              <Plus size={16} /> New Adjustment
            </button>
            <button onClick={load} style={{ background: 'rgba(255,255,255,.15)', border: `2px solid rgba(255,255,255,.5)`, color: G.white, padding: '9px 12px', cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>
              <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            </button>
          </div>
        </div>
      </div>

      <div style={{ padding: '24px 36px' }}>
        <div style={{ background: G.white, border: `3px solid ${G.dark}`, boxShadow: `4px 4px 0 ${G.dark}`, padding: 14, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Search size={16} color={G.olive} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by adjustment no or reason…" style={{ border: 'none', outline: 'none', fontSize: 13, fontFamily: "'Inter', sans-serif", flex: 1, background: 'transparent', color: G.darkGray }} />
          <div style={{ fontWeight: 800, color: G.forest, fontSize: 13 }}>{filtered.length} records</div>
        </div>

        {loading ? (
          <div style={{ padding: 60, textAlign: 'center' }}>
            <div style={{ width: 36, height: 36, border: `3px solid ${G.sage}`, borderTop: `3px solid ${G.forest}`, borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
            <div style={{ color: G.forest, fontWeight: 800 }}>Loading adjustments…</div>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center', color: G.sage, fontWeight: 800, border: `3px dashed ${G.sage}` }}>No adjustments found.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filtered.map(r => (
              <div key={r.id} style={{ background: G.white, border: `3px solid ${G.dark}`, boxShadow: `5px 5px 0 ${G.orange}` }}>
                <div style={{ padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ background: G.orange, padding: 8, border: `2px solid ${G.dark}`, boxShadow: `2px 2px 0 ${G.dark}` }}>
                      <Sliders size={18} color={G.white} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 900, fontSize: 15, color: G.dark }}>{r.adjustment_no || `ADJ-${r.id}`}</div>
                      <div style={{ fontSize: 12, color: G.olive, marginTop: 2 }}>
                        Reason: {r.reason || 'N/A'} &nbsp;|&nbsp;
                        {r.adjustment_date ? new Date(r.adjustment_date).toLocaleDateString() : new Date(r.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ background: r.status === 'APPROVED' ? '#E8F5E9' : '#FFF3E0', border: `2px solid ${r.status === 'APPROVED' ? G.forest : G.orange}`, color: r.status === 'APPROVED' ? G.forest : G.orange, padding: '4px 10px', fontWeight: 800, fontSize: 12 }}>
                      {r.status || 'PENDING'}
                    </span>
                    <button onClick={() => setExpanded(expanded === r.id ? null : r.id)} style={{ background: G.lightGray, border: `2px solid ${G.dark}`, boxShadow: `2px 2px 0 ${G.dark}`, padding: '6px 12px', cursor: 'pointer', fontWeight: 800, fontSize: 12, fontFamily: "'Inter', sans-serif", display: 'flex', alignItems: 'center', gap: 6, color: G.dark }}>
                      <Eye size={14} /> {expanded === r.id ? 'Hide' : 'View'}
                    </button>
                  </div>
                </div>
                {expanded === r.id && (r.items || []).length > 0 && (
                  <div style={{ borderTop: `2px solid ${G.sage}`, overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                      <thead>
                        <tr style={{ background: G.lightGray }}>
                          {['Drug ID', 'Batch', 'Type', 'Quantity'].map(h => <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 900, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, color: G.dark, borderBottom: `1px solid ${G.sage}` }}>{h}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {r.items.map((it, i) => (
                          <tr key={i} style={{ borderBottom: `1px solid ${G.sage}`, background: i % 2 === 0 ? G.white : '#F1F8F1' }}>
                            <td style={{ padding: '8px 12px', color: G.emerald, fontWeight: 800 }}>{it.drug_id}</td>
                            <td style={{ padding: '8px 12px' }}>{it.batch_no || '—'}</td>
                            <td style={{ padding: '8px 12px' }}>
                              <span style={{ color: it.adjustment_type === 'ADD' ? G.forest : G.red, fontWeight: 800 }}>
                                {it.adjustment_type === 'ADD' ? '+ ADD' : '− REMOVE'}
                              </span>
                            </td>
                            <td style={{ padding: '8px 12px', fontWeight: 800 }}>{it.quantity}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StoreStockAdjustment;
