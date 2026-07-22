import React, { useState, useEffect, useCallback } from 'react';
import { ArrowRightLeft, Plus, Trash2, Search, Eye, FileText, RefreshCw } from 'lucide-react';
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

const STATUS_COLORS = {
  PENDING: { bg: '#FFF3E0', border: G.orange, text: G.orange },
  APPROVED: { bg: '#E8F5E9', border: G.forest, text: G.forest },
  REJECTED: { bg: '#FFEBEE', border: G.red, text: G.red },
  SHIPPED: { bg: '#E3F2FD', border: '#1976D2', text: '#1976D2' },
  COMPLETED: { bg: '#E8F5E9', border: G.dark, text: G.dark },
  CANCELLED: { bg: '#F5F5F5', border: G.darkGray, text: G.darkGray },
  Requested: { bg: '#FFF3E0', border: G.orange, text: G.orange },
  'In Transit': { bg: '#E3F2FD', border: '#1976D2', text: '#1976D2' },
  Received: { bg: '#E8F5E9', border: G.forest, text: G.forest },
  Closed: { bg: '#F5F5F5', border: G.darkGray, text: G.darkGray },
};

const TransferForm = ({ onSuccess, onClose }) => {
  const [drugs, setDrugs] = useState([]);
  const [branches, setBranches] = useState([]);
  const [form, setForm] = useState({
    transfer_no: 'TR-' + Date.now(),
    from_location: '',
    to_location: '',
    transfer_date: new Date().toISOString().split('T')[0],
    reason: '',
    remarks: '',
  });
  const [items, setItems] = useState([{ drug_id: '', quantity: '', batch_no: '' }]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiFetch(API + '/inventory').then(d => setDrugs(d.data || d || [])).catch(() => {});
  }, []);

  const setItem = (i, k, v) => setItems(prev => prev.map((it, idx) => idx === i ? { ...it, [k]: v } : it));

  const handleSubmit = async e => {
    e.preventDefault();
    if (items.some(it => !it.drug_id || !it.quantity)) {
      NotifStore.push('Select a drug and enter quantity for all lines.', 'warning'); return;
    }
    setSaving(true);
    try {
      await apiFetch(`${API}/transfers`, {
        method: 'POST',
        body: JSON.stringify({ ...form, items: items.map(it => ({ ...it, quantity: Number(it.quantity) })) })
      });
      NotifStore.push('Stock transfer created!', 'success');
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 900, fontSize: 16 }}><ArrowRightLeft size={20} /> New Stock Transfer</div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,.15)', border: `1px solid rgba(255,255,255,.4)`, color: G.white, padding: '5px 12px', cursor: 'pointer', fontWeight: 900, fontSize: 16, fontFamily: "'Inter', sans-serif" }}>×</button>
        </div>
        <form onSubmit={handleSubmit} style={{ overflowY: 'auto', padding: 24, flex: 1 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14, marginBottom: 20 }}>
            {[
              { key: 'transfer_no', label: 'Transfer No *', type: 'text' },
              { key: 'transfer_date', label: 'Transfer Date', type: 'date' },
              { key: 'from_location', label: 'From (Location/Warehouse)', type: 'text' },
              { key: 'to_location', label: 'To (Location/Branch)', type: 'text' },
              { key: 'reason', label: 'Reason', type: 'text' },
              { key: 'remarks', label: 'Remarks', type: 'text' },
            ].map(f => (
              <div key={f.key}>
                <label style={labelStyle}>{f.label}</label>
                <input type={f.type} value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} style={inputStyle} />
              </div>
            ))}
          </div>
          <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontWeight: 900, fontSize: 13, color: G.dark, textTransform: 'uppercase', letterSpacing: 1 }}>Items to Transfer</div>
            <button type="button" onClick={() => setItems(p => [...p, { drug_id: '', quantity: '', batch_no: '' }])} style={{ background: G.emerald, border: `2px solid ${G.dark}`, boxShadow: `2px 2px 0 ${G.dark}`, color: G.white, padding: '6px 14px', cursor: 'pointer', fontWeight: 800, fontSize: 12, fontFamily: "'Inter', sans-serif", display: 'flex', alignItems: 'center', gap: 6 }}>
              <Plus size={14} /> Add
            </button>
          </div>
          <div style={{ border: `2px solid ${G.dark}`, marginBottom: 20 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: G.dark, color: G.white }}>
                  {['Drug *', 'Batch No', 'Quantity *', ''].map(h => <th key={h} style={{ padding: '10px', textAlign: 'left', fontWeight: 900, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>{h}</th>)}
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
              {saving ? 'Saving…' : 'Create Transfer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const StoreStockTransfer = () => {
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await apiFetch(`${API}/transfers`);
      setTransfers(d.data || []);
    } catch (e) { NotifStore.push('Failed to load transfers: ' + e.message, 'error'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = transfers.filter(r => {
    const matchSearch = !search || (r.transfer_no || '').toLowerCase().includes(search.toLowerCase()) || (r.from_location || '').toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || (r.status || '').toLowerCase() === filter;
    return matchSearch && matchFilter;
  });

  return (
    <div style={{ background: G.lightGray, minHeight: '100vh', width: '100%', fontFamily: "'Inter', sans-serif", padding: '0 0 60px' }}>
      <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
      {showForm && <TransferForm onSuccess={() => { setShowForm(false); load(); }} onClose={() => setShowForm(false)} />}

      <div style={{ background: `linear-gradient(135deg, ${G.dark} 0%, ${G.forest} 60%, ${G.emerald} 100%)`, padding: '24px 36px', color: G.white, borderBottom: `4px solid ${G.dark}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ background: G.brown, padding: 8, border: `2px solid ${G.white}`, boxShadow: `3px 3px 0 ${G.dark}` }}>
              <ArrowRightLeft size={24} color={G.white} />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900 }}>Stock Transfer</h1>
              <p style={{ margin: 0, fontSize: 12, opacity: .8 }}>Transfer stock between locations</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => setShowForm(true)} style={{ background: G.brown, border: `2px solid ${G.dark}`, boxShadow: `3px 3px 0 ${G.dark}`, color: G.white, padding: '9px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 800, fontSize: 13, fontFamily: "'Inter', sans-serif" }}>
              <Plus size={16} /> New Transfer
            </button>
            <button onClick={load} style={{ background: 'rgba(255,255,255,.15)', border: `2px solid rgba(255,255,255,.5)`, color: G.white, padding: '9px 12px', cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>
              <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            </button>
          </div>
        </div>
      </div>

      <div style={{ padding: '24px 36px' }}>
        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
          {['all', 'pending', 'completed', 'cancelled'].map(s => {
            const count = s === 'all' ? transfers.length : transfers.filter(t => (t.status || '').toLowerCase() === s).length;
            const c = s === 'all' ? G.forest : s === 'pending' ? G.orange : s === 'completed' ? G.leaf : G.darkGray;
            return (
              <button key={s} onClick={() => setFilter(s)} style={{ background: filter === s ? c : G.white, border: `3px solid ${filter === s ? G.dark : G.sage}`, boxShadow: filter === s ? `4px 4px 0 ${G.dark}` : 'none', padding: '12px', cursor: 'pointer', fontFamily: "'Inter', sans-serif", fontWeight: 900, fontSize: 11, color: filter === s ? G.white : G.dark, textTransform: 'uppercase', letterSpacing: 1, transition: 'all .15s', textAlign: 'left' }}>
                <div style={{ fontSize: 11, opacity: .8, textTransform: 'uppercase', letterSpacing: 1 }}>{s === 'all' ? 'Total' : s}</div>
                <div style={{ fontSize: 24, fontWeight: 900, marginTop: 4 }}>{count}</div>
              </button>
            );
          })}
        </div>

        <div style={{ background: G.white, border: `3px solid ${G.dark}`, boxShadow: `4px 4px 0 ${G.dark}`, padding: 14, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Search size={16} color={G.olive} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by transfer no or location…" style={{ border: 'none', outline: 'none', fontSize: 13, fontFamily: "'Inter', sans-serif", flex: 1, background: 'transparent', color: G.darkGray }} />
          <div style={{ fontWeight: 800, color: G.forest, fontSize: 13 }}>{filtered.length} records</div>
        </div>

        {loading ? (
          <div style={{ padding: 60, textAlign: 'center' }}>
            <div style={{ width: 36, height: 36, border: `3px solid ${G.sage}`, borderTop: `3px solid ${G.forest}`, borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
            <div style={{ color: G.forest, fontWeight: 800 }}>Loading transfers…</div>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center', color: G.sage, fontWeight: 800, border: `3px dashed ${G.sage}` }}>No stock transfers found.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filtered.map(r => {
              const sc = STATUS_COLORS[r.status] || STATUS_COLORS.Requested;
              return (
                <div key={r.id} style={{ background: G.white, border: `3px solid ${G.dark}`, boxShadow: `5px 5px 0 ${G.brown}` }}>
                  <div style={{ padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <div style={{ background: G.brown, padding: 8, border: `2px solid ${G.dark}`, boxShadow: `2px 2px 0 ${G.dark}` }}>
                        <ArrowRightLeft size={18} color={G.white} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 900, fontSize: 15, color: G.dark }}>{r.transfer_no || `TR-${r.id}`}</div>
                        <div style={{ fontSize: 12, color: G.olive, marginTop: 2 }}>
                          From: {r.from_location || 'N/A'} → To: {r.to_location || 'N/A'} &nbsp;|&nbsp;
                          {r.transfer_date ? new Date(r.transfer_date).toLocaleDateString() : new Date(r.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span style={{ background: sc.bg, border: `2px solid ${sc.border}`, color: sc.text, padding: '4px 10px', fontWeight: 800, fontSize: 12 }}>
                        {r.status || 'Requested'}
                      </span>
                      <button onClick={() => setExpanded(expanded === r.id ? null : r.id)} style={{ background: G.lightGray, border: `2px solid ${G.dark}`, boxShadow: `2px 2px 0 ${G.dark}`, padding: '6px 12px', cursor: 'pointer', fontWeight: 800, fontSize: 12, fontFamily: "'Inter', sans-serif", display: 'flex', alignItems: 'center', gap: 6, color: G.dark }}>
                        <Eye size={14} /> {expanded === r.id ? 'Hide' : 'View'}
                      </button>
                    </div>
                  </div>
                  {expanded === r.id && (
                    <div style={{ borderTop: `2px solid ${G.sage}`, padding: '12px 20px', fontSize: 12, background: '#F9FBF9' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                        {[['Reason', r.reason], ['Remarks', r.remarks], ['Created', new Date(r.created_at).toLocaleString()]].map(([k, v]) => (
                          <div key={k}><div style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1, color: G.olive }}>{k}</div><div style={{ color: G.dark, fontWeight: 700, marginTop: 2 }}>{v || '—'}</div></div>
                        ))}
                      </div>
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

export default StoreStockTransfer;
