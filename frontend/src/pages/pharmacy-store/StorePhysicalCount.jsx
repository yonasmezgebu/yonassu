import React, { useState, useEffect, useCallback } from 'react';
import { ClipboardCheck, Plus, Trash2, Search, Eye, RefreshCw, CheckCircle } from 'lucide-react';
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

const CountForm = ({ onSuccess, onClose }) => {
  const [drugs, setDrugs] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [form, setForm] = useState({ count_no: 'PC-' + Date.now(), count_date: new Date().toISOString().split('T')[0], counted_by: '', remarks: '' });
  const [items, setItems] = useState([{ drug_id: '', system_quantity: 0, physical_quantity: '' }]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiFetch(API + '/inventory').then(d => setDrugs(d.data || d || [])).catch(() => {});
    apiFetch(`${API}/inventory`).then(d => setInventory(d.data || [])).catch(() => {});
  }, []);

  const setItem = (i, k, v) => {
    setItems(prev => prev.map((it, idx) => {
      if (idx !== i) return it;
      if (k === 'drug_id') {
        const inv = inventory.find(inv => String(inv.drug_id) === String(v));
        return { ...it, [k]: v, system_quantity: inv ? inv.quantity : 0 };
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
        body: JSON.stringify({ ...form, items: items.map(it => ({ ...it, physical_quantity: Number(it.physical_quantity), variance: Number(it.physical_quantity) - Number(it.system_quantity) })) })
      });
      NotifStore.push('Physical count submitted!', 'success');
      onSuccess();
    } catch (e) { NotifStore.push('Failed: ' + e.message, 'error'); }
    finally { setSaving(false); }
  };

  const inputStyle = { width: '100%', padding: '9px 12px', border: `2px solid ${G.dark}`, background: G.white, fontFamily: "'Inter', sans-serif", fontSize: 13, outline: 'none', color: G.darkGray, boxSizing: 'border-box' };
  const labelStyle = { fontSize: 11, fontWeight: 900, color: G.dark, textTransform: 'uppercase', letterSpacing: .5, marginBottom: 4, display: 'block' };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: G.white, border: `3px solid ${G.dark}`, boxShadow: `8px 8px 0 ${G.dark}`, width: '100%', maxWidth: 820, maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ background: G.dark, color: G.white, padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 900, fontSize: 16 }}><ClipboardCheck size={20} /> New Physical Count</div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,.15)', border: `1px solid rgba(255,255,255,.4)`, color: G.white, padding: '5px 12px', cursor: 'pointer', fontWeight: 900, fontSize: 16, fontFamily: "'Inter', sans-serif" }}>×</button>
        </div>
        <form onSubmit={handleSubmit} style={{ overflowY: 'auto', padding: 24, flex: 1 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14, marginBottom: 20 }}>
            {[
              { key: 'count_no', label: 'Count No *', type: 'text' },
              { key: 'count_date', label: 'Count Date', type: 'date' },
              { key: 'counted_by', label: 'Counted By', type: 'text' },
              { key: 'remarks', label: 'Remarks', type: 'text' },
            ].map(f => (
              <div key={f.key}>
                <label style={labelStyle}>{f.label}</label>
                <input type={f.type} value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} style={inputStyle} />
              </div>
            ))}
          </div>

          <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontWeight: 900, fontSize: 13, color: G.dark, textTransform: 'uppercase', letterSpacing: 1 }}>Count Lines</div>
            <button type="button" onClick={() => setItems(p => [...p, { drug_id: '', system_quantity: 0, physical_quantity: '' }])} style={{ background: G.sky, border: `2px solid ${G.dark}`, boxShadow: `2px 2px 0 ${G.dark}`, color: G.white, padding: '6px 14px', cursor: 'pointer', fontWeight: 800, fontSize: 12, fontFamily: "'Inter', sans-serif", display: 'flex', alignItems: 'center', gap: 6 }}>
              <Plus size={14} /> Add Line
            </button>
          </div>

          <div style={{ border: `2px solid ${G.dark}`, marginBottom: 20 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: G.dark, color: G.white }}>
                  {['Drug *', 'System Qty', 'Physical Qty *', 'Variance', ''].map(h => <th key={h} style={{ padding: '10px', textAlign: 'left', fontWeight: 900, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => {
                  const variance = item.physical_quantity !== '' ? Number(item.physical_quantity) - Number(item.system_quantity) : null;
                  return (
                    <tr key={i} style={{ borderBottom: `1px solid ${G.sage}` }}>
                      <td style={{ padding: 6 }}>
                        <select value={item.drug_id} onChange={e => setItem(i, 'drug_id', e.target.value)} style={{ ...inputStyle, padding: '7px 8px' }} required>
                          <option value="">Select drug…</option>
                          {drugs.map(d => <option key={d.drug_id || d.id} value={d.drug_id || d.id}>{d.drug_name || d.name} {d.strength || ''}</option>)}
                        </select>
                      </td>
                      <td style={{ padding: 6 }}>
                        <div style={{ padding: '8px 10px', background: G.lightGray, border: `1px solid ${G.sage}`, fontWeight: 800, color: G.dark }}>{item.system_quantity}</div>
                      </td>
                      <td style={{ padding: 6 }}>
                        <input type="number" min={0} value={item.physical_quantity} onChange={e => setItem(i, 'physical_quantity', e.target.value)} style={{ ...inputStyle, padding: '7px 8px' }} required />
                      </td>
                      <td style={{ padding: 6 }}>
                        {variance !== null && (
                          <div style={{ padding: '8px 10px', fontWeight: 900, color: variance === 0 ? G.forest : variance > 0 ? G.sky : G.red, background: variance === 0 ? '#E8F5E9' : variance > 0 ? '#E3F2FD' : '#FFEBEE', border: `1px solid ${variance === 0 ? G.forest : variance > 0 ? G.sky : G.red}` }}>
                            {variance > 0 ? '+' : ''}{variance}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: 6 }}>
                        <button type="button" onClick={() => setItems(p => p.filter((_, idx) => idx !== i))} disabled={items.length === 1} style={{ background: G.red, border: 'none', color: G.white, padding: '6px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} style={{ background: G.lightGray, border: `2px solid ${G.dark}`, boxShadow: `3px 3px 0 ${G.dark}`, padding: '10px 20px', cursor: 'pointer', fontWeight: 800, fontSize: 13, fontFamily: "'Inter', sans-serif" }}>Cancel</button>
            <button type="submit" disabled={saving} style={{ background: G.forest, border: `2px solid ${G.dark}`, boxShadow: `3px 3px 0 ${G.dark}`, color: G.white, padding: '10px 20px', cursor: 'pointer', fontWeight: 800, fontSize: 13, fontFamily: "'Inter', sans-serif" }}>
              {saving ? 'Submitting…' : 'Submit Count'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

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

  const filtered = counts.filter(r => !search || (r.count_no || '').toLowerCase().includes(search.toLowerCase()) || (r.counted_by || '').toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ background: G.lightGray, minHeight: '100vh', width: '100%', fontFamily: "'Inter', sans-serif", padding: '0 0 60px' }}>
      <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
      {showForm && <CountForm onSuccess={() => { setShowForm(false); load(); }} onClose={() => setShowForm(false)} />}

      <div style={{ background: `linear-gradient(135deg, ${G.dark} 0%, ${G.forest} 60%, ${G.emerald} 100%)`, padding: '24px 36px', color: G.white, borderBottom: `4px solid ${G.dark}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ background: G.sky, padding: 8, border: `2px solid ${G.white}`, boxShadow: `3px 3px 0 ${G.dark}` }}>
              <ClipboardCheck size={24} color={G.white} />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900 }}>Physical Count</h1>
              <p style={{ margin: 0, fontSize: 12, opacity: .8 }}>Audit physical vs system quantities</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => setShowForm(true)} style={{ background: G.sky, border: `2px solid ${G.dark}`, boxShadow: `3px 3px 0 ${G.dark}`, color: G.white, padding: '9px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 800, fontSize: 13, fontFamily: "'Inter', sans-serif" }}>
              <Plus size={16} /> New Count
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
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by count no or counted by…" style={{ border: 'none', outline: 'none', fontSize: 13, fontFamily: "'Inter', sans-serif", flex: 1, background: 'transparent', color: G.darkGray }} />
          <div style={{ fontWeight: 800, color: G.forest, fontSize: 13 }}>{filtered.length} sessions</div>
        </div>

        {loading ? (
          <div style={{ padding: 60, textAlign: 'center' }}>
            <div style={{ width: 36, height: 36, border: `3px solid ${G.sage}`, borderTop: `3px solid ${G.forest}`, borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
            <div style={{ color: G.forest, fontWeight: 800 }}>Loading count records…</div>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center', color: G.sage, fontWeight: 800, border: `3px dashed ${G.sage}` }}>No physical counts recorded.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filtered.map(r => (
              <div key={r.id} style={{ background: G.white, border: `3px solid ${G.dark}`, boxShadow: `5px 5px 0 ${G.sky}` }}>
                <div style={{ padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ background: G.sky, padding: 8, border: `2px solid ${G.dark}`, boxShadow: `2px 2px 0 ${G.dark}` }}>
                      <ClipboardCheck size={18} color={G.white} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 900, fontSize: 15, color: G.dark }}>{r.count_no || `PC-${r.id}`}</div>
                      <div style={{ fontSize: 12, color: G.olive, marginTop: 2 }}>
                        By: {r.counted_by || 'N/A'} &nbsp;|&nbsp;
                        {r.count_date ? new Date(r.count_date).toLocaleDateString() : new Date(r.created_at).toLocaleDateString()} &nbsp;|&nbsp;
                        {(r.items || []).length} line{(r.items || []).length !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    {/* Show variance summary */}
                    {(() => {
                      const items = r.items || [];
                      const hasVariance = items.some(it => it.variance && it.variance !== 0);
                      return (
                        <span style={{ background: hasVariance ? '#FFEBEE' : '#E8F5E9', border: `2px solid ${hasVariance ? G.red : G.forest}`, color: hasVariance ? G.red : G.forest, padding: '4px 10px', fontWeight: 800, fontSize: 12 }}>
                          {hasVariance ? '⚠ Variance Found' : '✓ Balanced'}
                        </span>
                      );
                    })()}
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
                          {['Drug ID', 'System Qty', 'Physical Qty', 'Variance'].map(h => <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 900, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, color: G.dark, borderBottom: `1px solid ${G.sage}` }}>{h}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {r.items.map((it, i) => {
                          const v = Number(it.variance ?? (it.physical_quantity - it.system_quantity));
                          return (
                            <tr key={i} style={{ borderBottom: `1px solid ${G.sage}`, background: i % 2 === 0 ? G.white : '#F1F8F1' }}>
                              <td style={{ padding: '8px 12px', color: G.emerald, fontWeight: 800 }}>{it.drug_id}</td>
                              <td style={{ padding: '8px 12px', fontWeight: 700 }}>{it.system_quantity}</td>
                              <td style={{ padding: '8px 12px', fontWeight: 700 }}>{it.physical_quantity}</td>
                              <td style={{ padding: '8px 12px', fontWeight: 900, color: v === 0 ? G.forest : v > 0 ? G.sky : G.red }}>
                                {v > 0 ? '+' : ''}{v}
                              </td>
                            </tr>
                          );
                        })}
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

export default StorePhysicalCount;
