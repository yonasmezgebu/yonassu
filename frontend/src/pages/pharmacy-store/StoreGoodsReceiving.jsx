import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Truck, RefreshCw, Plus, Trash2, Search, ChevronDown, ChevronUp, Eye, FileText } from 'lucide-react';
import { NotifStore } from './StoreHomeNew';

/* ── Enterprise CSS ─────────────────────────────────────────────── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

  :root {
    --cp:         #2563EB;
    --cp-h:       #1D4ED8;
    --cbg:        #F5F6FA;
    --ccard:      #FFFFFF;
    --cborder:    #E5E7EB;
    --ct1:        #111827;
    --ct2:        #6B7280;
    --ctm:        #9CA3AF;
    --cok:        #16A34A;
    --cok-bg:     #DCFCE7;
    --cdanger:    #DC2626;
    --cdanger-bg: #FEE2E2;
    --cwarn:      #D97706;
    --cwarn-bg:   #FEF3C7;
    --cinfo:      #0284C7;
    --cinfo-bg:   #E0F2FE;
    --gold:       #F59E0B;
    --gold-text:  #111827;
  }

  /* ── Page Wrapper ── */
  .gr-page {
    box-sizing: border-box;
    margin: 10px auto;
    width: calc(100% - 20px);
    max-width: 1536px;
    min-height: calc(100vh - 20px);
    padding: 24px;
    background: var(--cbg);
    font-family: 'Inter', 'Segoe UI', Roboto, -apple-system, sans-serif;
    color: var(--ct1);
    line-height: 1.5;
    padding-bottom: 48px;
  }
  @media (max-width: 1024px) { .gr-page { margin: 6px auto; width: calc(100% - 12px); padding: 16px; } }
  @media (max-width: 480px)  { .gr-page { margin: 4px auto; width: calc(100% - 8px); padding: 12px; } }

  /* ── Page Header ── */
  .gr-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 16px;
    margin-bottom: 24px;
    padding-bottom: 20px;
    border-bottom: 1px solid var(--cborder);
  }
  .gr-header-left { display: flex; align-items: center; gap: 12px; }
  .gr-header-icon {
    background: #EFF6FF;
    color: var(--cp);
    padding: 10px;
    border-radius: 10px;
    display: flex;
    flex-shrink: 0;
  }
  .gr-page-title {
    font-size: clamp(22px, 3vw, 28px);
    font-weight: 600;
    line-height: 1.3;
    margin: 0 0 2px;
    color: var(--ct1);
  }
  .gr-page-sub { font-size: 13px; color: var(--ct2); margin: 0; }
  .gr-header-btns { display: flex; gap: 8px; flex-wrap: wrap; }

  /* ── Buttons ── */
  .gr-btn {
    height: 36px;
    padding: 0 16px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    border: 1px solid var(--cborder);
    background: var(--ccard);
    color: var(--ct1);
    font-family: inherit;
    transition: all 150ms ease-in-out;
    white-space: nowrap;
    min-width: 44px;
    justify-content: center;
  }
  .gr-btn:hover:not(:disabled) {
    background: var(--gold);
    color: var(--gold-text);
    border-color: transparent;
    box-shadow: 0 4px 12px rgba(0,0,0,.10);
    transform: translateY(-1px);
  }
  .gr-btn:disabled { opacity: .5; cursor: not-allowed; }
  .gr-btn-primary { background: var(--cp); color: #fff; border-color: var(--cp); }
  .gr-btn-primary:hover:not(:disabled) { background: var(--gold); color: var(--gold-text); border-color: transparent; }
  .gr-btn-danger  { background: var(--ccard); color: var(--cdanger); border-color: var(--cdanger); }
  .gr-btn-danger:hover:not(:disabled) { background: var(--gold); color: var(--gold-text); border-color: transparent; }
  .gr-btn-icon    { width: 36px; height: 36px; padding: 0; }
  .gr-btn-sm      { height: 30px; padding: 0 12px; font-size: 12px; }

  /* ── Search Bar ── */
  .gr-search-bar {
    display: flex;
    align-items: center;
    gap: 12px;
    background: var(--ccard);
    border: 1px solid var(--cborder);
    border-radius: 10px;
    padding: 0 16px;
    height: 44px;
    margin-bottom: 20px;
    box-shadow: 0 1px 3px rgba(0,0,0,.06);
  }
  .gr-search-input {
    border: none;
    outline: none;
    font-size: 14px;
    font-family: inherit;
    flex: 1;
    background: transparent;
    color: var(--ct1);
  }
  .gr-search-count { font-size: 13px; font-weight: 500; color: var(--ctm); white-space: nowrap; }

  /* ── Spinner ── */
  .gr-spinner {
    display: inline-block;
    width: 16px; height: 16px;
    border-radius: 50%;
    border: 2.5px solid rgba(37,99,235,.2);
    border-top-color: var(--cp);
    animation: gr-spin 700ms linear infinite;
    flex-shrink: 0;
  }
  .gr-spinner.lg { width: 28px; height: 28px; border-width: 3px; }
  .gr-spinner.white { border-color: rgba(255,255,255,.3); border-top-color: #fff; }
  @keyframes gr-spin { to { transform: rotate(360deg); } }

  /* ── State boxes ── */
  .gr-state { padding: 64px 24px; text-align: center; color: var(--ct2); font-size: 14px; }
  .gr-empty {
    background: var(--ccard);
    border: 1px dashed var(--cborder);
    border-radius: 10px;
    padding: 64px 24px;
    text-align: center;
    color: var(--ctm);
    font-size: 14px;
  }

  /* ── Receipt Cards ── */
  .gr-receipt-list { display: flex; flex-direction: column; gap: 12px; }
  .gr-receipt-card {
    background: var(--ccard);
    border: 1px solid var(--cborder);
    border-radius: 10px;
    box-shadow: 0 1px 3px rgba(0,0,0,.06);
    overflow: hidden;
    transition: box-shadow 150ms ease, transform 150ms ease;
  }
  .gr-receipt-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,.08); transform: translateY(-1px); }
  .gr-receipt-row {
    padding: 14px 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 12px;
  }
  .gr-receipt-left { display: flex; align-items: center; gap: 14px; }
  .gr-receipt-icon {
    background: #EFF6FF;
    color: var(--cp);
    padding: 9px;
    border-radius: 8px;
    display: flex;
    flex-shrink: 0;
  }
  .gr-receipt-no { font-size: 15px; font-weight: 600; color: var(--ct1); margin-bottom: 2px; }
  .gr-receipt-meta { font-size: 12px; color: var(--ct2); }
  .gr-receipt-actions { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }

  /* ── Badges ── */
  .gr-badge {
    display: inline-flex;
    align-items: center;
    padding: 2px 10px;
    border-radius: 9999px;
    font-size: 12px;
    font-weight: 500;
    white-space: nowrap;
  }
  .gr-badge-info { background: var(--cinfo-bg); color: var(--cinfo); }

  /* ── Expandable Table ── */
  .gr-expand-table-wrap {
    border-top: 1px solid var(--cborder);
    overflow-x: auto;
  }
  .gr-expand-table { width: 100%; border-collapse: collapse; min-width: 600px; font-size: 13px; }
  .gr-expand-table thead tr { background: #F9FAFB; }
  .gr-expand-table th {
    padding: 10px 14px;
    text-align: left;
    font-size: 11px;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: .04em;
    color: var(--ctm);
    border-bottom: 1px solid var(--cborder);
    white-space: nowrap;
  }
  .gr-expand-table td {
    padding: 10px 14px;
    border-bottom: 1px solid var(--cborder);
    color: var(--ct1);
    transition: background 150ms;
  }
  .gr-expand-table tbody tr:last-child td { border-bottom: none; }
  .gr-expand-table tbody tr:hover td { background: #F9FAFB; }
  .gr-expand-table .right { text-align: right; font-variant-numeric: tabular-nums; }

  /* ── MODAL OVERLAY ── */
  .gr-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,.42);
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
  }
  .gr-modal {
    background: var(--ccard);
    border-radius: 12px;
    box-shadow: 0 20px 40px rgba(0,0,0,.18);
    width: 100%;
    max-width: 860px;
    max-height: 92vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    animation: gr-modalin 150ms ease-out;
  }
  @keyframes gr-modalin { from { opacity:0; transform:scale(.96); } to { opacity:1; transform:scale(1); } }
  .gr-modal-hd {
    padding: 16px 24px;
    border-bottom: 1px solid var(--cborder);
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #F9FAFB;
    flex-shrink: 0;
  }
  .gr-modal-title { font-size: 18px; font-weight: 600; margin: 0; color: var(--ct1); display: flex; align-items: center; gap: 10px; }
  .gr-modal-body { padding: 24px; overflow-y: auto; flex: 1; }
  @media (max-width: 480px) { .gr-modal-body { padding: 16px; } }
  .gr-modal-ft {
    padding: 14px 24px;
    border-top: 1px solid var(--cborder);
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    background: #F9FAFB;
    flex-shrink: 0;
  }

  /* ── Form inside Modal ── */
  .gr-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 20px; }
  @media (max-width: 600px) { .gr-form-grid { grid-template-columns: 1fr; } }
  .gr-form-full { grid-column: 1 / -1; }
  .gr-fg { display: flex; flex-direction: column; gap: 5px; }
  .gr-label { font-size: 12px; font-weight: 500; text-transform: uppercase; letter-spacing: .03em; color: var(--ct2); display: block; }
  .gr-input {
    height: 36px;
    padding: 0 12px;
    border-radius: 8px;
    border: 1px solid var(--cborder);
    font-size: 14px;
    font-family: inherit;
    color: var(--ct1);
    background: var(--ccard);
    width: 100%;
    box-sizing: border-box;
    outline: none;
    transition: border-color 150ms ease, box-shadow 150ms ease;
  }
  .gr-input:focus { border-color: var(--cp); box-shadow: 0 0 0 3px rgba(37,99,235,.10); }
  select.gr-input { appearance: auto; cursor: pointer; }

  /* ── Line Items section in Modal ── */
  .gr-line-hd {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }
  .gr-line-title { font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: .04em; color: var(--ct1); }
  .gr-line-table-wrap {
    border: 1px solid var(--cborder);
    border-radius: 8px;
    overflow-x: auto;
    margin-bottom: 20px;
  }
  .gr-line-table { width: 100%; border-collapse: collapse; min-width: 600px; font-size: 13px; }
  .gr-line-table thead tr { background: #F9FAFB; }
  .gr-line-table th {
    padding: 10px 10px;
    text-align: left;
    font-size: 11px;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: .04em;
    color: var(--ctm);
    border-bottom: 1px solid var(--cborder);
    white-space: nowrap;
  }
  .gr-line-table td { padding: 8px 8px; border-bottom: 1px solid var(--cborder); vertical-align: middle; }
  .gr-line-table tbody tr:last-child td { border-bottom: none; }
  .gr-line-input {
    height: 32px;
    padding: 0 8px;
    border-radius: 6px;
    border: 1px solid var(--cborder);
    font-size: 12px;
    font-family: inherit;
    color: var(--ct1);
    background: var(--ccard);
    width: 100%;
    min-width: 90px;
    box-sizing: border-box;
    outline: none;
    transition: border-color 150ms, box-shadow 150ms;
  }
  .gr-line-input:focus { border-color: var(--cp); box-shadow: 0 0 0 2px rgba(37,99,235,.10); }
  select.gr-line-input { appearance: auto; }

  /* ── Section separator ── */
  .gr-sec-sep {
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: .04em;
    color: var(--ctm);
    border-bottom: 1px solid var(--cborder);
    padding-bottom: 8px;
    margin-bottom: 14px;
  }
`;

/* ─── API ────────────────────────────────────────────────────────── */
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

/* ─── FORM MODAL ─────────────────────────────────────────────────── */
const GoodsReceivingForm = ({ onSuccess, onClose }) => {
  const [drugs, setDrugs] = useState([]);
  const [form, setForm]   = useState({
    receipt_no: 'GR-' + Date.now(),
    supplier_name: '',
    receipt_date: new Date().toISOString().split('T')[0],
    remarks: '',
  });
  const [items, setItems] = useState([
    { drug_id: '', batch_no: '', expiry_date: '', quantity: '', unit_cost: '', storage_location: '' },
  ]);
  const [saving, setSaving] = useState(false);
  const [pendingPurchases, setPendingPurchases] = useState([]);

  useEffect(() => {
    apiFetch(API + '/inventory').then(d => setDrugs(d.data || d || [])).catch(() => {});
    apiFetch('/api/v1/purchase/workflow').then(d => {
      const all = d.data || d || [];
      setPendingPurchases(
        all.filter(w =>
          w.status === 'GOODS_PURCHASED' ||
          w.status === 'ADVANCE_PAID' ||
          w.status === 'BUDGET_READY' ||
          w.status === 'BUDGET_APPROVED'
        )
      );
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
      linked_workflow_id: wf.id,
    }));
    const pName = (wf.product_name || '').toLowerCase();
    const matchedDrug = drugs.find(d => (d.drug_name || d.name || '').toLowerCase() === pName);
    setItems([{
      drug_id: matchedDrug ? (matchedDrug.drug_id || matchedDrug.id) : '',
      batch_no: '',
      expiry_date: '',
      quantity: wf.quantity || '',
      unit_cost: wf.estimated_cost || '',
      storage_location: '',
    }]);
    NotifStore.push('Form auto-filled from purchase request', 'info');
  };

  const setField  = k => e => setForm(p => ({ ...p, [k]: e.target.value }));
  const setItem   = (i, k, v) => setItems(prev => prev.map((it, idx) => idx === i ? { ...it, [k]: v } : it));
  const addItem   = () => setItems(prev => [...prev, { drug_id: '', batch_no: '', expiry_date: '', quantity: '', unit_cost: '', storage_location: '' }]);
  const removeItem = i => setItems(prev => prev.filter((_, idx) => idx !== i));

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.receipt_no || items.some(it => !it.drug_id || !it.quantity)) {
      NotifStore.push('Please fill all required fields (Receipt No, Drug, Quantity)', 'warning');
      return;
    }
    setSaving(true);
    try {
      await apiFetch(`${API}/receipts`, {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          items: items.map(it => ({ ...it, quantity: Number(it.quantity), unit_cost: Number(it.unit_cost) || 0 })),
        }),
      });
      if (form.linked_workflow_id) {
        try {
          await apiFetch(`/api/v1/purchase/workflow/${form.linked_workflow_id}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status: 'GOODS_RECEIVED', receiving_notes: `Received via GRN: ${form.receipt_no}` }),
          });
        } catch (err) { console.error('Failed to update workflow status:', err); }
      }
      NotifStore.push('Goods Receipt created successfully!', 'success');
      onSuccess();
    } catch (e) {
      NotifStore.push('Failed to create receipt: ' + e.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="gr-overlay" onClick={onClose}>
      <div className="gr-modal" onClick={e => e.stopPropagation()}>

        {/* Modal Header */}
        <div className="gr-modal-hd">
          <h2 className="gr-modal-title">
            <Truck size={20} color="var(--cp)" /> New Goods Receipt
          </h2>
          <button className="gr-btn gr-btn-icon" style={{ border: 'none', background: 'transparent', boxShadow: 'none' }} onClick={onClose}>
            ×
          </button>
        </div>

        <form id="gr-form" onSubmit={handleSubmit}>
          <div className="gr-modal-body">

            {/* Link to Purchase */}
            <div className="gr-sec-sep">Link to Purchase Request (Optional — Auto-fill)</div>
            <div className="gr-fg" style={{ marginBottom: 20 }}>
              <label className="gr-label">Pending Purchase Request</label>
              <select className="gr-input" onChange={handlePurchaseSelect}>
                <option value="">-- Select Pending Purchase (Optional) --</option>
                {pendingPurchases.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.request_number} — {p.product_name} ({p.quantity} items) — {p.supplier_name || 'No Supplier'}
                  </option>
                ))}
              </select>
            </div>

            {/* Header Fields */}
            <div className="gr-sec-sep">Receipt Details</div>
            <div className="gr-form-grid">
              <div className="gr-fg">
                <label className="gr-label">Receipt No <span style={{ color: 'var(--cdanger)' }}>*</span></label>
                <input className="gr-input" type="text" value={form.receipt_no} onChange={setField('receipt_no')} required />
              </div>
              <div className="gr-fg">
                <label className="gr-label">Supplier Name</label>
                <input className="gr-input" type="text" value={form.supplier_name} onChange={setField('supplier_name')} />
              </div>
              <div className="gr-fg">
                <label className="gr-label">Receipt Date</label>
                <input className="gr-input" type="date" value={form.receipt_date} onChange={setField('receipt_date')} />
              </div>
              <div className="gr-fg">
                <label className="gr-label">Remarks</label>
                <input className="gr-input" type="text" value={form.remarks} onChange={setField('remarks')} />
              </div>
            </div>

            {/* Line Items */}
            <div className="gr-line-hd">
              <span className="gr-line-title">Line Items</span>
              <button type="button" onClick={addItem} className="gr-btn gr-btn-primary gr-btn-sm">
                <Plus size={14} /> Add Line
              </button>
            </div>

            <div className="gr-line-table-wrap">
              <table className="gr-line-table">
                <thead>
                  <tr>
                    {['Drug *', 'Batch No', 'Expiry Date', 'Qty *', 'Unit Cost', 'Location', ''].map(h => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, i) => (
                    <tr key={i}>
                      <td>
                        <select
                          className="gr-line-input"
                          style={{ minWidth: 160 }}
                          value={item.drug_id}
                          onChange={e => setItem(i, 'drug_id', e.target.value)}
                          required
                        >
                          <option value="">Select drug…</option>
                          {drugs.map(d => (
                            <option key={d.drug_id || d.id} value={d.drug_id || d.id}>
                              {d.drug_name || d.name} {d.strength || ''}
                            </option>
                          ))}
                        </select>
                      </td>
                      {[
                        { key: 'batch_no',         type: 'text' },
                        { key: 'expiry_date',       type: 'date' },
                        { key: 'quantity',          type: 'number', req: true },
                        { key: 'unit_cost',         type: 'number' },
                        { key: 'storage_location',  type: 'text' },
                      ].map(({ key, type, req }) => (
                        <td key={key}>
                          <input
                            className="gr-line-input"
                            type={type}
                            min={0}
                            value={item[key]}
                            onChange={e => setItem(i, key, e.target.value)}
                            required={!!req}
                          />
                        </td>
                      ))}
                      <td style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          className="gr-btn gr-btn-danger gr-btn-icon"
                          style={{ height: 30, width: 30 }}
                          onClick={() => removeItem(i)}
                          disabled={items.length === 1}
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>

          {/* Modal Footer */}
          <div className="gr-modal-ft">
            <button type="button" className="gr-btn" onClick={onClose}>Cancel</button>
            <button type="submit" form="gr-form" className="gr-btn gr-btn-primary" disabled={saving}>
              {saving ? <><span className="gr-spinner white" /> Saving…</> : 'Save Receipt'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

/* ─── MAIN PAGE ──────────────────────────────────────────────────── */
const StoreGoodsReceiving = () => {
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [search, setSearch]     = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await apiFetch(`${API}/receipts`);
      setReceipts(d.data || []);
    } catch (e) {
      NotifStore.push('Failed to load receipts: ' + e.message, 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const deleteReceipt = async id => {
    if (!window.confirm('Delete this receipt? This will revert inventory.')) return;
    try {
      await apiFetch(`${API}/receipts/${id}`, { method: 'DELETE' });
      NotifStore.push('Receipt deleted and inventory reverted.', 'success');
      load();
    } catch (e) {
      NotifStore.push('Failed to delete: ' + e.message, 'error');
    }
  };

  const filtered = receipts.filter(r =>
    !search ||
    (r.receipt_no || '').toLowerCase().includes(search.toLowerCase()) ||
    (r.supplier_name || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="gr-page">
      <style>{CSS}</style>

      {/* FORM MODAL */}
      {showForm && (
        <GoodsReceivingForm
          onSuccess={() => { setShowForm(false); load(); }}
          onClose={() => setShowForm(false)}
        />
      )}

      {/* ── PAGE HEADER ── */}
      <div className="gr-header">
        <div className="gr-header-left">
          <div className="gr-header-icon">
            <Truck size={24} color="var(--cp)" />
          </div>
          <div>
            <h1 className="gr-page-title">Goods Receiving</h1>
            <p className="gr-page-sub">Record incoming stock from suppliers</p>
          </div>
        </div>
        <div className="gr-header-btns">
          <button onClick={() => setShowForm(true)} className="gr-btn gr-btn-primary">
            <Plus size={16} /> New Receipt
          </button>
          <button onClick={load} className="gr-btn gr-btn-icon" disabled={loading} title="Refresh">
            {loading
              ? <span className="gr-spinner" />
              : <RefreshCw size={16} />}
          </button>
        </div>
      </div>

      {/* ── SEARCH BAR ── */}
      <div className="gr-search-bar">
        <Search size={16} color="var(--ctm)" />
        <input
          className="gr-search-input"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by receipt no or supplier…"
        />
        <span className="gr-search-count">{filtered.length} record{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* ── RECEIPT LIST ── */}
      {loading ? (
        <div className="gr-state">
          <span className="gr-spinner lg" style={{ display: 'inline-block', marginBottom: 12 }} />
          <div style={{ color: 'var(--ct2)', fontSize: 14 }}>Loading receipts…</div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="gr-empty">
          No goods receipts found. Click <strong>New Receipt</strong> to record one.
        </div>
      ) : (
        <div className="gr-receipt-list">
          {filtered.map(r => (
            <div key={r.id} className="gr-receipt-card">

              {/* Receipt Row */}
              <div className="gr-receipt-row">
                <div className="gr-receipt-left">
                  <div className="gr-receipt-icon">
                    <FileText size={20} />
                  </div>
                  <div>
                    <div className="gr-receipt-no">{r.receipt_no}</div>
                    <div className="gr-receipt-meta">
                      Supplier: {r.supplier_name || 'N/A'}
                      &nbsp;·&nbsp;
                      Date: {r.receipt_date
                        ? new Date(r.receipt_date).toLocaleDateString()
                        : new Date(r.created_at).toLocaleDateString()}
                      {r.remarks && <>&nbsp;·&nbsp;{r.remarks}</>}
                    </div>
                  </div>
                </div>

                <div className="gr-receipt-actions">
                  <span className="gr-badge gr-badge-info">
                    {(r.items || []).length} item{(r.items || []).length !== 1 ? 's' : ''}
                  </span>
                  <button
                    className="gr-btn gr-btn-sm"
                    onClick={() => setExpanded(expanded === r.id ? null : r.id)}
                    style={{ gap: 6 }}
                  >
                    <Eye size={14} />
                    {expanded === r.id ? 'Hide' : 'View'}
                    {expanded === r.id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  </button>
                  <button
                    className="gr-btn gr-btn-danger gr-btn-icon"
                    title="Delete receipt"
                    onClick={() => deleteReceipt(r.id)}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Expandable Detail Table */}
              {expanded === r.id && (r.items || []).length > 0 && (
                <div className="gr-expand-table-wrap">
                  <table className="gr-expand-table">
                    <thead>
                      <tr>
                        {['Drug ID', 'Batch No', 'Expiry Date', 'Qty', 'Unit Cost', 'Subtotal', 'Location'].map(h => (
                          <th key={h}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {r.items.map((it, i) => (
                        <tr key={i}>
                          <td style={{ fontWeight: 500, color: 'var(--cp)' }}>{it.drug_id}</td>
                          <td style={{ color: 'var(--ct2)' }}>{it.batch_no || '—'}</td>
                          <td style={{ color: 'var(--ct2)' }}>
                            {it.expiry_date ? new Date(it.expiry_date).toLocaleDateString() : '—'}
                          </td>
                          <td className="right" style={{ fontWeight: 600, color: 'var(--cok)' }}>
                            {it.quantity}
                          </td>
                          <td className="right">{Number(it.unit_cost || 0).toFixed(2)}</td>
                          <td className="right" style={{ fontWeight: 600 }}>
                            {Number(it.subtotal || 0).toFixed(2)}
                          </td>
                          <td style={{ color: 'var(--ct2)' }}>{it.storage_location || '—'}</td>
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
  );
};

export default StoreGoodsReceiving;
