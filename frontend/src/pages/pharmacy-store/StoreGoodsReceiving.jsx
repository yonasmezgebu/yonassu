import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Truck, RefreshCw, Plus, Trash2, Search, ChevronDown, ChevronUp, Eye, FileText } from 'lucide-react';
import { NotifStore } from './StoreHomeNew';
import SegmentedSpinner from '../../components/ui/SegmentedSpinner';

const G = {
  forest:'#228B22', dark:'#1B5E20', emerald:'#2E8B57', leaf:'#4CAF50',
  sage:'#A5D6A7', olive:'#6B8E23', mint:'#98FF98', lime:'#8BC34A',
  brown:'#8D6E63', sky:'#87CEEB', white:'#FFFFFF', lightGray:'#F5F5F5',
  darkGray:'#424242', orange:'#FF9800', red:'#F44336',
};

const API = '/api/v1/store-inventory';
function hdrs() {
  return { 'Content-Type': 'application/json', Authorization: 'Bearer ' + (localStorage.getItem('token') || '') };
}
async function apiFetch(url, opts = {}) {
  const r = await fetch(url, { headers: hdrs(), ...opts });
  const d = await r.json();
  if (!r.ok) throw new Error(d.message || 'Request failed');
  return d;
}

// ─── FORM to create a new goods receipt ────────────────────────────────────────
const GoodsReceivingForm = ({ onSuccess, onClose }) => {
  const [drugs, setDrugs] = useState([]);
  const [form, setForm] = useState({ receipt_no: 'GR-' + Date.now(), supplier_name: '', receipt_date: new Date().toISOString().split('T')[0], remarks: '' });
  const [items, setItems] = useState([{ drug_id: '', batch_no: '', expiry_date: '', quantity: '', unit_cost: '', storage_location: '' }]);
  const [saving, setSaving] = useState(false);

  const [pendingPurchases, setPendingPurchases] = useState([]);

  useEffect(() => {
    apiFetch(API + '/inventory').then(d => setDrugs(d.data || d || [])).catch(() => {});
    apiFetch('/api/v1/purchase/workflow').then(d => {
      const all = d.data || d || [];
      setPendingPurchases(all.filter(w => w.status === 'GOODS_PURCHASED' || w.status === 'ADVANCE_PAID' || w.status === 'BUDGET_READY' || w.status === 'BUDGET_APPROVED'));
    }).catch(() => {});
  }, []);

  const handlePurchaseSelect = (e) => {
    const wfId = e.target.value;
    if (!wfId) return;
    const wf = pendingPurchases.find(p => p.id === Number(wfId));
    if (!wf) return;
    
    setForm(p => ({
      ...p,
      supplier_name: wf.supplier_name || p.supplier_name,
      remarks: wf.po_number ? `PO: ${wf.po_number}` : `Req: ${wf.request_number}`,
      linked_workflow_id: wf.id
    }));

    const pName = (wf.product_name || '').toLowerCase();
    const matchedDrug = drugs.find(d => (d.drug_name || d.name || '').toLowerCase() === pName);

    setItems([{
      drug_id: matchedDrug ? (matchedDrug.drug_id || matchedDrug.id) : '',
      batch_no: '',
      expiry_date: '',
      quantity: wf.quantity || '',
      unit_cost: wf.estimated_cost || '',
      storage_location: ''
    }]);
    NotifStore.push('Form auto-filled from purchase request', 'info');
  };

  const setItem = (i, k, v) => setItems(prev => prev.map((it, idx) => idx === i ? { ...it, [k]: v } : it));
  const addItem = () => setItems(prev => [...prev, { drug_id: '', batch_no: '', expiry_date: '', quantity: '', unit_cost: '', storage_location: '' }]);
  const removeItem = i => setItems(prev => prev.filter((_, idx) => idx !== i));

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.receipt_no || items.some(it => !it.drug_id || !it.quantity)) {
      NotifStore.push('Please fill all required fields (Receipt No, Drug, Quantity)', 'warning'); return;
    }
    setSaving(true);
    try {
      await apiFetch(`${API}/receipts`, {
        method: 'POST',
        body: JSON.stringify({ ...form, items: items.map(it => ({ ...it, quantity: Number(it.quantity), unit_cost: Number(it.unit_cost) || 0 })) })
      });
      if (form.linked_workflow_id) {
        try {
          await apiFetch(`/api/v1/purchase/workflow/${form.linked_workflow_id}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status: 'GOODS_RECEIVED', receiving_notes: `Received via GRN: ${form.receipt_no}` })
          });
        } catch(err) { console.error('Failed to update workflow status:', err); }
      }
      NotifStore.push('Goods Receipt created successfully!', 'success');
      onSuccess();
    } catch (e) {
      NotifStore.push('Failed to create receipt: ' + e.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = { width: '100%', padding: '9px 12px', border: `2px solid ${G.dark}`, background: G.white, fontFamily: "'Inter', sans-serif", fontSize: 13, outline: 'none', color: G.darkGray, boxSizing: 'border-box' };
  const labelStyle = { fontSize: 11, fontWeight: 900, color: G.dark, textTransform: 'uppercase', letterSpacing: .5, marginBottom: 4, display: 'block' };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: G.white, border: `3px solid ${G.dark}`, boxShadow: `8px 8px 0 ${G.dark}`, width: '100%', maxWidth: 820, maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        {/* Modal Header */}
        <div style={{ background: G.dark, color: G.white, padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 900, fontSize: 16 }}>
            <Truck size={20} /> New Goods Receipt
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,.15)', border: `1px solid rgba(255,255,255,.4)`, color: G.white, padding: '5px 12px', cursor: 'pointer', fontWeight: 900, fontSize: 16, fontFamily: "'Inter', sans-serif" }}>×</button>
        </div>
        <form onSubmit={handleSubmit} style={{ overflowY: 'auto', padding: 24, flex: 1 }}>
          {/* Form Header Fields */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14, marginBottom: 20 }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Link to Purchase Request (Auto-fill)</label>
              <select onChange={handlePurchaseSelect} style={inputStyle}>
                <option value="">-- Select Pending Purchase (Optional) --</option>
                {pendingPurchases.map(p => (
                  <option key={p.id} value={p.id}>{p.request_number} - {p.product_name} ({p.quantity} items) - {p.supplier_name || 'No Supplier'}</option>
                ))}
              </select>
            </div>
            {[
              { key: 'receipt_no', label: 'Receipt No *', type: 'text' },
              { key: 'supplier_name', label: 'Supplier Name', type: 'text' },
              { key: 'receipt_date', label: 'Receipt Date', type: 'date' },
              { key: 'remarks', label: 'Remarks', type: 'text' },
            ].map(f => (
              <div key={f.key}>
                <label style={labelStyle}>{f.label}</label>
                <input type={f.type} value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} style={inputStyle} />
              </div>
            ))}
          </div>

          {/* Items */}
          <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 13, fontWeight: 900, color: G.dark, textTransform: 'uppercase', letterSpacing: 1 }}>Line Items</div>
            <button type="button" onClick={addItem} style={{ background: G.leaf, border: `2px solid ${G.dark}`, boxShadow: `2px 2px 0 ${G.dark}`, color: G.white, padding: '6px 14px', cursor: 'pointer', fontWeight: 800, fontSize: 12, fontFamily: "'Inter', sans-serif", display: 'flex', alignItems: 'center', gap: 6 }}>
              <Plus size={14} /> Add Line
            </button>
          </div>
          <div style={{ border: `2px solid ${G.dark}`, marginBottom: 20 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: G.dark, color: G.white }}>
                  {['Drug *', 'Batch No', 'Expiry Date', 'Qty *', 'Unit Cost', 'Location', ''].map(h => (
                    <th key={h} style={{ padding: '10px 10px', textAlign: 'left', fontWeight: 900, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>{h}</th>
                  ))}
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
                    {['batch_no', 'expiry_date', 'quantity', 'unit_cost', 'storage_location'].map((k, ki) => (
                      <td key={k} style={{ padding: 6 }}>
                        <input type={k === 'expiry_date' ? 'date' : k === 'quantity' || k === 'unit_cost' ? 'number' : 'text'} min={0} value={item[k]} onChange={e => setItem(i, k, e.target.value)} style={{ ...inputStyle, padding: '7px 8px' }} required={k === 'quantity'} />
                      </td>
                    ))}
                    <td style={{ padding: 6, textAlign: 'center' }}>
                      <button type="button" onClick={() => removeItem(i)} disabled={items.length === 1} style={{ background: G.red, border: 'none', color: G.white, padding: '6px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
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
              {saving ? 'Saving…' : 'Save Receipt'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── MAIN PAGE ─────────────────────────────────────────────────────────────────
const StoreGoodsReceiving = () => {
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await apiFetch(`${API}/receipts`);
      setReceipts(d.data || []);
    } catch (e) { NotifStore.push('Failed to load receipts: ' + e.message, 'error'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const deleteReceipt = async id => {
    if (!window.confirm('Delete this receipt? This will revert inventory.')) return;
    try {
      await apiFetch(`${API}/receipts/${id}`, { method: 'DELETE' });
      NotifStore.push('Receipt deleted and inventory reverted.', 'success');
      load();
    } catch (e) { NotifStore.push('Failed to delete: ' + e.message, 'error'); }
  };

  const filtered = receipts.filter(r => !search || (r.receipt_no || '').toLowerCase().includes(search.toLowerCase()) || (r.supplier_name || '').toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ background: G.lightGray, minHeight: '100vh', width: '100%', fontFamily: "'Inter', sans-serif", padding: '0 0 60px' }}>
      <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
      {showForm && <GoodsReceivingForm onSuccess={() => { setShowForm(false); load(); }} onClose={() => setShowForm(false)} />}

      {/* HEADER */}
      <div style={{ background: `linear-gradient(135deg, ${G.dark} 0%, ${G.forest} 60%, ${G.emerald} 100%)`, padding: '24px 36px', color: G.white, borderBottom: `4px solid ${G.dark}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ background: G.mint, padding: 8, border: `2px solid ${G.white}`, boxShadow: `3px 3px 0 ${G.dark}` }}>
              <Truck size={24} color={G.dark} />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900 }}>Goods Receiving</h1>
              <p style={{ margin: 0, fontSize: 12, opacity: .8 }}>Record incoming stock from suppliers</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => setShowForm(true)} style={{ background: G.leaf, border: `2px solid ${G.dark}`, boxShadow: `3px 3px 0 ${G.dark}`, color: G.white, padding: '9px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 800, fontSize: 13, fontFamily: "'Inter', sans-serif" }}>
              <Plus size={16} /> New Receipt
            </button>
            <button onClick={load} style={{ background: 'rgba(255,255,255,.15)', border: `2px solid rgba(255,255,255,.5)`, color: G.white, padding: '9px 12px', cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>
              <SegmentedSpinner size={14} />
            </button>
          </div>
        </div>
      </div>

      <div style={{ padding: '24px 36px' }}>
        {/* SEARCH */}
        <div style={{ background: G.white, border: `3px solid ${G.dark}`, boxShadow: `4px 4px 0 ${G.dark}`, padding: 14, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Search size={16} color={G.olive} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by receipt no or supplier…" style={{ border: 'none', outline: 'none', fontSize: 13, fontFamily: "'Inter', sans-serif", flex: 1, background: 'transparent', color: G.darkGray }} />
          <div style={{ fontWeight: 800, color: G.forest, fontSize: 13 }}>{filtered.length} records</div>
        </div>

        {/* LIST */}
        {loading ? (
          <div style={{ padding: 60, textAlign: 'center' }}>
            <SegmentedSpinner size={24} />
            <div style={{ color: G.forest, fontWeight: 800 }}>Loading receipts…</div>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center', color: G.sage, fontWeight: 800, border: `3px dashed ${G.sage}` }}>No goods receipts found.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filtered.map(r => (
              <div key={r.id} style={{ background: G.white, border: `3px solid ${G.dark}`, boxShadow: `5px 5px 0 ${G.forest}` }}>
                <div style={{ padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ background: G.leaf, padding: 8, border: `2px solid ${G.dark}`, boxShadow: `2px 2px 0 ${G.dark}` }}>
                      <FileText size={18} color={G.white} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 900, fontSize: 15, color: G.dark }}>{r.receipt_no}</div>
                      <div style={{ fontSize: 12, color: G.olive, marginTop: 2 }}>
                        Supplier: {r.supplier_name || 'N/A'} &nbsp;|&nbsp;
                        Date: {r.receipt_date ? new Date(r.receipt_date).toLocaleDateString() : new Date(r.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ background: '#E8F5E9', border: `2px solid ${G.leaf}`, color: G.forest, padding: '4px 10px', fontWeight: 800, fontSize: 12 }}>
                      {(r.items || []).length} item{(r.items || []).length !== 1 ? 's' : ''}
                    </span>
                    <button onClick={() => setExpanded(expanded === r.id ? null : r.id)} style={{ background: G.lightGray, border: `2px solid ${G.dark}`, boxShadow: `2px 2px 0 ${G.dark}`, padding: '6px 12px', cursor: 'pointer', fontWeight: 800, fontSize: 12, fontFamily: "'Inter', sans-serif", display: 'flex', alignItems: 'center', gap: 6, color: G.dark }}>
                      <Eye size={14} /> {expanded === r.id ? 'Hide' : 'View'}
                    </button>
                    <button onClick={() => deleteReceipt(r.id)} style={{ background: G.red, border: `2px solid ${G.dark}`, boxShadow: `2px 2px 0 ${G.dark}`, padding: '6px 10px', cursor: 'pointer', color: G.white, display: 'flex', alignItems: 'center' }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                {expanded === r.id && (r.items || []).length > 0 && (
                  <div style={{ borderTop: `2px solid ${G.sage}`, overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                      <thead>
                        <tr style={{ background: G.lightGray }}>
                          {['Drug ID', 'Batch No', 'Expiry Date', 'Qty', 'Unit Cost', 'Subtotal', 'Location'].map(h => (
                            <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 900, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, color: G.dark, borderBottom: `1px solid ${G.sage}` }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {r.items.map((it, i) => (
                          <tr key={i} style={{ borderBottom: `1px solid ${G.sage}`, background: i % 2 === 0 ? G.white : '#F1F8F1' }}>
                            <td style={{ padding: '8px 12px', color: G.emerald, fontWeight: 800 }}>{it.drug_id}</td>
                            <td style={{ padding: '8px 12px' }}>{it.batch_no || '—'}</td>
                            <td style={{ padding: '8px 12px' }}>{it.expiry_date ? new Date(it.expiry_date).toLocaleDateString() : '—'}</td>
                            <td style={{ padding: '8px 12px', fontWeight: 800, color: G.forest }}>{it.quantity}</td>
                            <td style={{ padding: '8px 12px' }}>{Number(it.unit_cost || 0).toFixed(2)}</td>
                            <td style={{ padding: '8px 12px', fontWeight: 800 }}>{Number(it.subtotal || 0).toFixed(2)}</td>
                            <td style={{ padding: '8px 12px', color: G.olive }}>{it.storage_location || '—'}</td>
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

export default StoreGoodsReceiving;
