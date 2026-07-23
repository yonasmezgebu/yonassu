import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, Plus, Trash2, Search, Eye, FileText, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import { NotifStore } from './StoreHomeNew';

const G = {
  forest:'#228B22', dark:'#1B5E20', emerald:'#2E8B57', leaf:'#4CAF50',
  sage:'#A5D6A7', olive:'#6B8E23', mint:'#98FF98',
  brown:'#8D6E63', white:'#FFFFFF', lightGray:'#F5F5F5',
  darkGray:'#424242', orange:'#FF9800', red:'#F44336', sky:'#0288D1', teal:'#00838F'
};
const API = '/api/v1/store-inventory';
function hdrs() { return { 'Content-Type': 'application/json', Authorization: 'Bearer ' + (localStorage.getItem('token') || '') }; }
async function apiFetch(url, opts = {}) {
  const r = await fetch(url, { headers: hdrs(), ...opts });
  const d = await r.json();
  if (!r.ok) throw new Error(d.message || 'Request failed');
  return d;
}

const IssueForm = ({ onSuccess, onClose, prefillData }) => {
  const [drugs, setDrugs] = useState([]);
  const [form, setForm] = useState({ 
    issue_no: 'GI-' + Date.now(), 
    issued_to: prefillData?.issued_to || '', 
    issued_by: '', 
    issue_date: new Date().toISOString().split('T')[0], 
    department: prefillData?.department || prefillData?.purpose || '', 
    remarks: prefillData?.remarks || '',
    transfer_request_id: prefillData?.transfer_request_id || null
  });
  const [items, setItems] = useState(prefillData?.items?.length ? prefillData.items : [{ drug_id: '', quantity: '', batch_no: '' }]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiFetch(API + '/inventory').then(d => setDrugs(d.data || d || [])).catch(() => {});
  }, []);

  const setItem = (i, k, v) => setItems(prev => prev.map((it, idx) => idx === i ? { ...it, [k]: v } : it));

  const handleDrugChange = (i, val) => {
    const selectedDrug = drugs.find(d => String(d.drug_id || d.id) === String(val));
    setItems(prev => prev.map((it, idx) => {
      if (idx === i) {
        return {
          ...it,
          drug_id: val,
          batch_no: it.batch_no || (selectedDrug ? (selectedDrug.batch_no || '') : '')
        };
      }
      return it;
    }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (items.some(it => !it.drug_id || !it.quantity)) {
      NotifStore.push('Select a drug and enter quantity for all lines.', 'warning'); return;
    }

    // Validate stock availability
    for (const it of items) {
      const d = drugs.find(x => String(x.drug_id || x.id) === String(it.drug_id));
      if (d && Number(it.quantity) > Number(d.quantity)) {
        NotifStore.push(`Cannot issue ${it.quantity} of ${d.drug_name || d.name}. Only ${d.quantity} available in store.`, 'error');
        return;
      }
    }

    setSaving(true);
    try {
      await apiFetch(`${API}/issues`, {
        method: 'POST',
        body: JSON.stringify({ ...form, items: items.map(it => ({ ...it, quantity: Number(it.quantity) })) })
      });
      NotifStore.push('Goods Issue recorded successfully!', 'success');
      onSuccess();
    } catch (e) { NotifStore.push('Failed: ' + e.message, 'error'); }
    finally { setSaving(false); }
  };

  const inputStyle = { width: '100%', padding: '9px 12px', border: `2px solid ${G.dark}`, background: G.white, fontFamily: "'Inter', sans-serif", fontSize: 13, outline: 'none', color: G.darkGray, boxSizing: 'border-box' };
  const labelStyle = { fontSize: 11, fontWeight: 900, color: G.dark, textTransform: 'uppercase', letterSpacing: .5, marginBottom: 4, display: 'block' };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: G.white, border: `3px solid ${G.dark}`, boxShadow: `8px 8px 0 ${G.dark}`, width: '100%', maxWidth: 760, maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ background: G.dark, color: G.white, padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 900, fontSize: 16 }}>
            <ArrowUpRight size={20} /> New Goods Issue
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,.15)', border: `1px solid rgba(255,255,255,.4)`, color: G.white, padding: '5px 12px', cursor: 'pointer', fontWeight: 900, fontSize: 16, fontFamily: "'Inter', sans-serif" }}>×</button>
        </div>
        
        {prefillData?.transfer_request_id && (
          <div style={{ background: '#E3F2FD', borderBottom: `2px solid ${G.sky}`, padding: '12px 24px', fontSize: 12, color: G.dark, display: 'flex', alignItems: 'center', gap: 10, fontWeight: 700 }}>
            <AlertCircle size={16} color={G.sky} />
            Fulfilling Pharmacy Request: {prefillData.requisition_ref}. This will notify the pharmacy upon completion.
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ overflowY: 'auto', padding: 24, flex: 1 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14, marginBottom: 20 }}>
            {[
              { key: 'issue_no', label: 'Issue No (Auto)', type: 'text', readOnly: true },
              { key: 'issued_to', label: 'Issued To (Dept/Name)', type: 'text' },
              { key: 'issued_by', label: 'Issued By', type: 'text' },
              { key: 'issue_date', label: 'Issue Date', type: 'date' },
              { key: 'department', label: 'Department / Purpose', type: 'text' },
              { key: 'remarks', label: 'Remarks', type: 'text' },
            ].map(f => (
              <div key={f.key}>
                <label style={labelStyle}>{f.label}</label>
                <input 
                  type={f.type} 
                  value={form[f.key]} 
                  onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} 
                  style={{ ...inputStyle, ...(f.readOnly ? { background: G.lightGray, color: G.darkGray, cursor: 'not-allowed' } : {}) }} 
                  readOnly={f.readOnly}
                />
              </div>
            ))}
          </div>
          {/* Line items */}
          <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontWeight: 900, fontSize: 13, color: G.dark, textTransform: 'uppercase', letterSpacing: 1 }}>Line Items</div>
            <button type="button" onClick={() => setItems(p => [...p, { drug_id: '', quantity: '', batch_no: '' }])} style={{ background: G.leaf, border: `2px solid ${G.dark}`, boxShadow: `2px 2px 0 ${G.dark}`, color: G.white, padding: '6px 14px', cursor: 'pointer', fontWeight: 800, fontSize: 12, fontFamily: "'Inter', sans-serif", display: 'flex', alignItems: 'center', gap: 6 }}>
              <Plus size={14} /> Add Line
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
                {items.map((item, i) => {
                  const maxQty = drugs.find(d => String(d.drug_id || d.id) === String(item.drug_id))?.quantity || null;
                  return (
                    <tr key={i} style={{ borderBottom: `1px solid ${G.sage}` }}>
                      <td style={{ padding: 6 }}>
                        <select value={item.drug_id} onChange={e => handleDrugChange(i, e.target.value)} style={{ ...inputStyle, padding: '7px 8px' }} required>
                          <option value="">Select drug…</option>
                          {drugs.map(d => <option key={d.drug_id || d.id} value={d.drug_id || d.id}>{d.drug_name || d.name} {d.strength || ''} (Stock: {d.quantity})</option>)}
                        </select>
                      </td>
                      <td style={{ padding: 6 }}><input type="text" value={item.batch_no || ''} readOnly style={{ ...inputStyle, padding: '7px 8px', background: G.lightGray, color: G.darkGray, cursor: 'not-allowed' }} placeholder="Auto-filled" /></td>
                      <td style={{ padding: 6 }}>
                        <input type="number" min={1} max={maxQty} value={item.quantity} onChange={e => setItem(i, 'quantity', e.target.value)} style={{ ...inputStyle, padding: '7px 8px', borderColor: maxQty && Number(item.quantity) > maxQty ? G.red : G.dark }} required />
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
              {saving ? 'Saving…' : 'Record Issue'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const StoreGoodsIssue = () => {
  const [issues, setIssues] = useState([]);
  const [approvedRequests, setApprovedRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formPrefill, setFormPrefill] = useState(null); // null means closed, {} means open blank
  const [expanded, setExpanded] = useState(null);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [d, reqs] = await Promise.all([
        apiFetch(`${API}/issues`),
        apiFetch('/api/v1/transfer-requests?status=APPROVED')
      ]);
      setIssues(d.data || []);
      setApprovedRequests((reqs.data || []).filter(r => r.status === 'APPROVED'));
    } catch (e) { NotifStore.push('Failed to load data: ' + e.message, 'error'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = issues.filter(r => !search || (r.issue_no || '').toLowerCase().includes(search.toLowerCase()) || (r.issued_to || '').toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ background: G.lightGray, minHeight: '100vh', width: '100%', fontFamily: "'Inter', sans-serif", padding: '0 0 60px' }}>
      <style>{`@keyframes spin { 100% { transform: rotate(360deg); } } .req-card:hover { transform: translateY(-2px); box-shadow: 4px 4px 0 #0288D1 !important; }`}</style>
      
      {formPrefill !== null && (
        <IssueForm 
          prefillData={formPrefill} 
          onSuccess={() => { setFormPrefill(null); load(); }} 
          onClose={() => setFormPrefill(null)} 
        />
      )}

      <div style={{ background: `linear-gradient(135deg, ${G.dark} 0%, ${G.forest} 60%, ${G.emerald} 100%)`, padding: '24px 36px', color: G.white, borderBottom: `4px solid ${G.dark}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ background: G.orange, padding: 8, border: `2px solid ${G.white}`, boxShadow: `3px 3px 0 ${G.dark}` }}>
              <ArrowUpRight size={24} color={G.white} />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900 }}>Goods Issue</h1>
              <p style={{ margin: 0, fontSize: 12, opacity: .8 }}>Record stock issued from store</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => setFormPrefill({})} style={{ background: G.orange, border: `2px solid ${G.dark}`, boxShadow: `3px 3px 0 ${G.dark}`, color: G.white, padding: '9px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 800, fontSize: 13, fontFamily: "'Inter', sans-serif" }}>
              <Plus size={16} /> New Issue
            </button>
            <button onClick={load} style={{ background: 'rgba(255,255,255,.15)', border: `2px solid rgba(255,255,255,.5)`, color: G.white, padding: '9px 12px', cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>
              <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            </button>
          </div>
        </div>
      </div>

      <div style={{ padding: '24px 36px' }}>

        {/* ── PENDING APPROVED PHARMACY REQUESTS ── */}
        {approvedRequests.length > 0 && (
          <div style={{ marginBottom: 30 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{ background: G.sky, color: G.white, padding: 6, borderRadius: '50%' }}><AlertCircle size={16} /></div>
              <h2 style={{ margin: 0, fontSize: 15, fontWeight: 900, color: G.dark, textTransform: 'uppercase', letterSpacing: 1 }}>Pending Pharmacy Requests</h2>
              <span style={{ background: G.sky, color: G.white, padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 800 }}>{approvedRequests.length} Approved</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
              {approvedRequests.map(req => (
                <div key={req.id} className="req-card" style={{ background: G.white, border: `2px solid ${G.sky}`, boxShadow: `3px 3px 0 rgba(2,136,209,0.3)`, padding: 16, transition: 'all 0.2s', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 900, color: G.sky, textTransform: 'uppercase', letterSpacing: 1 }}>{req.request_code}</div>
                      <div style={{ fontWeight: 800, color: G.dark, fontSize: 15, marginTop: 4 }}>{req.drug_name}</div>
                    </div>
                    <div style={{ background: '#E3F2FD', color: G.sky, padding: '4px 10px', fontWeight: 900, fontSize: 16, border: `2px solid ${G.sky}` }}>
                      {req.requested_qty}
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: G.darkGray }}>
                    Requested by: Pharmacy Manager<br/>
                    Urgency: <strong style={{ color: req.urgency === 'HIGH' ? G.red : G.orange }}>{req.urgency}</strong><br/>
                    Approved by CEO
                  </div>
                  <button 
                    onClick={() => setFormPrefill({
                      transfer_request_id: req.id,
                      issued_to: 'Pharmacy Manager',
                      purpose: 'Pharmacy Stock Replenishment',
                      requisition_ref: req.request_code,
                      items: [{ drug_id: req.drug_id, quantity: req.requested_qty, batch_no: '' }]
                    })}
                    style={{ marginTop: 'auto', background: G.sky, border: `2px solid ${G.dark}`, boxShadow: `2px 2px 0 ${G.dark}`, color: G.white, padding: '8px', cursor: 'pointer', fontWeight: 800, fontSize: 12, fontFamily: "'Inter', sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                  >
                    <CheckCircle size={14} /> Fulfill Request
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ background: G.white, border: `3px solid ${G.dark}`, boxShadow: `4px 4px 0 ${G.dark}`, padding: 14, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Search size={16} color={G.olive} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by issue no or recipient…" style={{ border: 'none', outline: 'none', fontSize: 13, fontFamily: "'Inter', sans-serif", flex: 1, background: 'transparent', color: G.darkGray }} />
          <div style={{ fontWeight: 800, color: G.forest, fontSize: 13 }}>{filtered.length} records</div>
        </div>

        {loading ? (
          <div style={{ padding: 60, textAlign: 'center' }}>
            <div style={{ width: 36, height: 36, border: `3px solid ${G.sage}`, borderTop: `3px solid ${G.forest}`, borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
            <div style={{ color: G.forest, fontWeight: 800 }}>Loading issues…</div>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center', color: G.sage, fontWeight: 800, border: `3px dashed ${G.sage}` }}>No goods issues found.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filtered.map(r => (
              <div key={r.id} style={{ background: G.white, border: `3px solid ${G.dark}`, boxShadow: `5px 5px 0 ${G.orange}` }}>
                <div style={{ padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ background: G.orange, padding: 8, border: `2px solid ${G.dark}`, boxShadow: `2px 2px 0 ${G.dark}` }}>
                      <FileText size={18} color={G.white} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 900, fontSize: 15, color: G.dark }}>{r.issue_no}</div>
                      <div style={{ fontSize: 12, color: G.olive, marginTop: 2 }}>
                        To: {r.issued_to || 'N/A'} &nbsp;|&nbsp; By: {r.issued_by || 'N/A'} &nbsp;|&nbsp;
                        {r.issue_date ? new Date(r.issue_date).toLocaleDateString() : new Date(r.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ background: '#FFF3E0', border: `2px solid ${G.orange}`, color: G.orange, padding: '4px 10px', fontWeight: 800, fontSize: 12 }}>
                      {(r.items || []).length} item{(r.items || []).length !== 1 ? 's' : ''}
                    </span>
                    <button onClick={() => setExpanded(expanded === r.id ? null : r.id)} style={{ background: G.lightGray, border: `2px solid ${G.dark}`, boxShadow: `2px 2px 0 ${G.dark}`, padding: '6px 12px', cursor: 'pointer', fontWeight: 800, fontSize: 12, fontFamily: "'Inter', sans-serif", display: 'flex', alignItems: 'center', gap: 6, color: G.dark }}>
                      <Eye size={14} /> {expanded === r.id ? 'Hide' : 'View'}
                    </button>
                  </div>
                </div>
                {expanded === r.id && (
                  <div style={{ borderTop: `2px solid ${G.sage}` }}>
                    <div style={{ padding: '12px 20px', background: '#F8FAF8', fontSize: 12, color: G.darkGray, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10, borderBottom: `1px solid ${G.sage}` }}>
                      {r.department && <div><strong style={{ color: G.dark }}>Department:</strong> {r.department}</div>}
                      {r.purpose && <div><strong style={{ color: G.dark }}>Purpose:</strong> {r.purpose}</div>}
                      <div><strong style={{ color: G.dark }}>Remarks:</strong> {r.remarks || '—'}</div>
                      {r.requisition_ref && <div><strong style={{ color: G.dark }}>Req Ref:</strong> {r.requisition_ref}</div>}
                      {r.approval_ref && <div><strong style={{ color: G.dark }}>Approval Ref:</strong> {r.approval_ref}</div>}
                    </div>
                    {(r.items || []).length > 0 && (
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                          <thead>
                            <tr style={{ background: G.lightGray }}>
                              {['Drug ID', 'Batch No', 'Quantity'].map(h => <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 900, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, color: G.dark, borderBottom: `1px solid ${G.sage}` }}>{h}</th>)}
                            </tr>
                          </thead>
                          <tbody>
                            {r.items.map((it, i) => (
                              <tr key={i} style={{ borderBottom: `1px solid ${G.sage}`, background: i % 2 === 0 ? G.white : '#F1F8F1' }}>
                                <td style={{ padding: '8px 12px', color: G.emerald, fontWeight: 800 }}>{it.drug_id}</td>
                                <td style={{ padding: '8px 12px' }}>{it.batch_no || '—'}</td>
                                <td style={{ padding: '8px 12px', fontWeight: 800, color: G.orange }}>{it.quantity}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
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

export default StoreGoodsIssue;
