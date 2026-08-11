import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, Plus, Trash2, Search, Eye, FileText, RefreshCw, AlertCircle, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';
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
  .gi-page {
    box-sizing: border-box;
    margin: 10px auto; width: calc(100% - 20px); max-width: 1536px;
    min-height: calc(100vh - 20px); padding: 24px 24px 48px;
    background: var(--cbg);
    font-family: 'Inter', 'Segoe UI', Roboto, -apple-system, sans-serif;
    color: var(--ct1); line-height: 1.5;
  }
  @media (max-width: 1024px) { .gi-page { margin: 6px auto; width: calc(100% - 12px); padding: 16px 16px 40px; } }
  @media (max-width: 480px)  { .gi-page { margin: 4px auto; width: calc(100% - 8px);  padding: 12px 12px 32px; } }

  /* ── Header ── */
  .gi-header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px; margin-bottom: 24px; padding-bottom: 20px; border-bottom: 1px solid var(--cborder); }
  .gi-header-left { display: flex; align-items: center; gap: 12px; }
  .gi-header-icon { background: #FEF3C7; color: var(--cwarn); padding: 10px; border-radius: 10px; display: flex; flex-shrink: 0; }
  .gi-page-title { font-size: clamp(22px,3vw,28px); font-weight: 600; line-height: 1.3; margin: 0 0 2px; color: var(--ct1); }
  .gi-page-sub { font-size: 13px; color: var(--ct2); margin: 0; }
  .gi-header-btns { display: flex; gap: 8px; flex-wrap: wrap; }

  /* ── Buttons ── */
  .gi-btn { height: 36px; padding: 0 16px; border-radius: 8px; font-size: 14px; font-weight: 500; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; border: 1px solid var(--cborder); background: var(--ccard); color: var(--ct1); font-family: inherit; transition: all 150ms ease-in-out; white-space: nowrap; min-width: 44px; justify-content: center; }
  .gi-btn:hover:not(:disabled) { background: var(--gold); color: var(--gold-text); border-color: transparent; box-shadow: 0 4px 12px rgba(0,0,0,.10); transform: translateY(-1px); }
  .gi-btn:disabled { opacity: .5; cursor: not-allowed; }
  .gi-btn-primary { background: var(--cp); color: #fff; border-color: var(--cp); }
  .gi-btn-primary:hover:not(:disabled) { background: var(--gold); color: var(--gold-text); border-color: transparent; }
  .gi-btn-info    { background: var(--cinfo-bg); color: var(--cinfo); border-color: var(--cinfo); }
  .gi-btn-info:hover:not(:disabled) { background: var(--gold); color: var(--gold-text); border-color: transparent; }
  .gi-btn-danger  { background: var(--ccard); color: var(--cdanger); border-color: var(--cdanger); }
  .gi-btn-danger:hover:not(:disabled) { background: var(--gold); color: var(--gold-text); border-color: transparent; }
  .gi-btn-icon { width: 36px; height: 36px; padding: 0; }
  .gi-btn-sm   { height: 30px; padding: 0 12px; font-size: 12px; }

  /* ── Spinner ── */
  .gi-spinner { display: inline-block; width: 16px; height: 16px; border-radius: 50%; border: 2.5px solid rgba(37,99,235,.2); border-top-color: var(--cp); animation: gi-spin 700ms linear infinite; flex-shrink: 0; }
  .gi-spinner.lg { width: 28px; height: 28px; border-width: 3px; }
  .gi-spinner.white { border-color: rgba(255,255,255,.3); border-top-color: #fff; }
  @keyframes gi-spin { to { transform: rotate(360deg); } }

  /* ── Search bar ── */
  .gi-search-bar { display: flex; align-items: center; gap: 12px; background: var(--ccard); border: 1px solid var(--cborder); border-radius: 10px; padding: 0 16px; height: 44px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,.06); }
  .gi-search-input { border: none; outline: none; font-size: 14px; font-family: inherit; flex: 1; background: transparent; color: var(--ct1); }
  .gi-search-count { font-size: 13px; font-weight: 500; color: var(--ctm); white-space: nowrap; }

  /* ── Pending Requests Section ── */
  .gi-pending-hd { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; }
  .gi-pending-icon { background: var(--cinfo-bg); color: var(--cinfo); padding: 6px; border-radius: 8px; display: flex; }
  .gi-pending-title { font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: .04em; color: var(--ct1); margin: 0; }
  .gi-badge-count { background: var(--cinfo); color: #fff; padding: 2px 8px; border-radius: 9999px; font-size: 11px; font-weight: 600; }
  .gi-req-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px,1fr)); gap: 14px; margin-bottom: 28px; }
  .gi-req-card { background: var(--ccard); border: 1px solid var(--cinfo); border-left: 3px solid var(--cinfo); border-radius: 10px; padding: 16px; display: flex; flex-direction: column; gap: 10px; box-shadow: 0 1px 3px rgba(0,0,0,.06); transition: all 150ms ease; }
  .gi-req-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,.09); transform: translateY(-1px); }
  .gi-req-ref { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: .04em; color: var(--cinfo); margin-bottom: 2px; }
  .gi-req-name { font-size: 16px; font-weight: 600; color: var(--ct1); }
  .gi-req-qty { background: var(--cinfo-bg); color: var(--cinfo); padding: 4px 12px; border-radius: 9999px; font-size: 14px; font-weight: 700; white-space: nowrap; }
  .gi-req-meta { font-size: 12px; color: var(--ct2); line-height: 1.6; }
  .gi-urgency-high { color: var(--cdanger); font-weight: 600; }
  .gi-urgency-mid  { color: var(--cwarn);   font-weight: 600; }

  /* ── Badges ── */
  .gi-badge { display: inline-flex; align-items: center; padding: 2px 10px; border-radius: 9999px; font-size: 12px; font-weight: 500; white-space: nowrap; }
  .gi-badge-warn { background: var(--cwarn-bg); color: var(--cwarn); }
  .gi-badge-info { background: var(--cinfo-bg); color: var(--cinfo); }

  /* ── Issue Cards ── */
  .gi-issue-list { display: flex; flex-direction: column; gap: 12px; }
  .gi-issue-card { background: var(--ccard); border: 1px solid var(--cborder); border-radius: 10px; box-shadow: 0 1px 3px rgba(0,0,0,.06); overflow: hidden; transition: box-shadow 150ms ease, transform 150ms ease; }
  .gi-issue-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,.08); transform: translateY(-1px); }
  .gi-issue-row { padding: 14px 20px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; }
  .gi-issue-left { display: flex; align-items: center; gap: 14px; }
  .gi-issue-icon { background: #FEF3C7; color: var(--cwarn); padding: 9px; border-radius: 8px; display: flex; flex-shrink: 0; }
  .gi-issue-no   { font-size: 15px; font-weight: 600; color: var(--ct1); margin-bottom: 2px; }
  .gi-issue-meta { font-size: 12px; color: var(--ct2); }
  .gi-issue-actions { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }

  /* ── Expand panel ── */
  .gi-expand { border-top: 1px solid var(--cborder); }
  .gi-expand-meta { padding: 12px 20px; background: #F9FAFB; display: grid; grid-template-columns: repeat(auto-fit,minmax(200px,1fr)); gap: 10px; font-size: 13px; color: var(--ct2); border-bottom: 1px solid var(--cborder); }
  .gi-expand-meta strong { color: var(--ct1); font-weight: 600; }
  .gi-expand-table-wrap { overflow-x: auto; }
  .gi-expand-table { width: 100%; border-collapse: collapse; min-width: 400px; font-size: 13px; }
  .gi-expand-table thead tr { background: #F9FAFB; }
  .gi-expand-table th { padding: 10px 14px; font-size: 11px; font-weight: 500; text-transform: uppercase; letter-spacing: .04em; color: var(--ctm); border-bottom: 1px solid var(--cborder); text-align: left; }
  .gi-expand-table td { padding: 10px 14px; border-bottom: 1px solid var(--cborder); color: var(--ct1); transition: background 150ms; }
  .gi-expand-table tbody tr:last-child td { border-bottom: none; }
  .gi-expand-table tbody tr:hover td { background: #F9FAFB; }

  /* ── State boxes ── */
  .gi-state { padding: 64px 24px; text-align: center; color: var(--ct2); font-size: 14px; }
  .gi-empty { background: var(--ccard); border: 1px dashed var(--cborder); border-radius: 10px; padding: 64px 24px; text-align: center; color: var(--ctm); font-size: 14px; }

  /* ── MODAL ── */
  .gi-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.42); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 16px; }
  .gi-modal   { background: var(--ccard); border-radius: 12px; box-shadow: 0 20px 40px rgba(0,0,0,.18); width: 100%; max-width: 780px; max-height: 92vh; display: flex; flex-direction: column; overflow: hidden; animation: gi-modalin 150ms ease-out; }
  @keyframes gi-modalin { from { opacity:0; transform:scale(.96); } to { opacity:1; transform:scale(1); } }
  .gi-modal-hd { padding: 16px 24px; border-bottom: 1px solid var(--cborder); display: flex; justify-content: space-between; align-items: center; background: #F9FAFB; flex-shrink: 0; }
  .gi-modal-title { font-size: 18px; font-weight: 600; margin: 0; color: var(--ct1); display: flex; align-items: center; gap: 10px; }
  .gi-modal-body { padding: 24px; overflow-y: auto; flex: 1; }
  @media (max-width: 480px) { .gi-modal-body { padding: 16px; } }
  .gi-modal-ft { padding: 14px 24px; border-top: 1px solid var(--cborder); display: flex; justify-content: flex-end; gap: 10px; background: #F9FAFB; flex-shrink: 0; }

  /* ── Autofill info bar ── */
  .gi-autofill-bar { display: flex; align-items: flex-start; gap: 10px; background: var(--cinfo-bg); border: 1px solid var(--cinfo); border-radius: 8px; padding: 11px 14px; margin-bottom: 20px; font-size: 13px; color: var(--cinfo); font-weight: 500; }
  .gi-autofill-bar svg { flex-shrink: 0; margin-top: 1px; }

  /* ── Form grid ── */
  .gi-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 20px; }
  @media (max-width: 600px) { .gi-form-grid { grid-template-columns: 1fr; } }
  .gi-fg { display: flex; flex-direction: column; gap: 5px; }
  .gi-label { font-size: 12px; font-weight: 500; text-transform: uppercase; letter-spacing: .03em; color: var(--ct2); display: block; }
  .gi-input { height: 36px; padding: 0 12px; border-radius: 8px; border: 1px solid var(--cborder); font-size: 14px; font-family: inherit; color: var(--ct1); background: var(--ccard); width: 100%; box-sizing: border-box; outline: none; transition: border-color 150ms ease, box-shadow 150ms ease; }
  .gi-input:focus { border-color: var(--cp); box-shadow: 0 0 0 3px rgba(37,99,235,.10); }
  .gi-input:read-only { background: #F9FAFB; color: var(--ctm); cursor: not-allowed; }
  .gi-input.invalid { border-color: var(--cdanger); }
  select.gi-input { appearance: auto; cursor: pointer; }

  /* ── Line Items ── */
  .gi-line-hd { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
  .gi-line-title { font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: .04em; color: var(--ct1); }
  .gi-line-table-wrap { border: 1px solid var(--cborder); border-radius: 8px; overflow-x: auto; margin-bottom: 20px; }
  .gi-line-table { width: 100%; border-collapse: collapse; min-width: 480px; font-size: 13px; }
  .gi-line-table thead tr { background: #F9FAFB; }
  .gi-line-table th { padding: 10px 10px; text-align: left; font-size: 11px; font-weight: 500; text-transform: uppercase; letter-spacing: .04em; color: var(--ctm); border-bottom: 1px solid var(--cborder); white-space: nowrap; }
  .gi-line-table td { padding: 8px 8px; border-bottom: 1px solid var(--cborder); vertical-align: middle; }
  .gi-line-table tbody tr:last-child td { border-bottom: none; }
  .gi-line-input { height: 32px; padding: 0 8px; border-radius: 6px; border: 1px solid var(--cborder); font-size: 13px; font-family: inherit; color: var(--ct1); background: var(--ccard); width: 100%; min-width: 80px; box-sizing: border-box; outline: none; transition: border-color 150ms, box-shadow 150ms; }
  .gi-line-input:focus { border-color: var(--cp); box-shadow: 0 0 0 2px rgba(37,99,235,.10); }
  .gi-line-input:read-only { background: #F9FAFB; color: var(--ctm); cursor: not-allowed; }
  .gi-line-input.invalid { border-color: var(--cdanger); }
  select.gi-line-input { appearance: auto; }

  .gi-sec-sep { font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: .04em; color: var(--ctm); border-bottom: 1px solid var(--cborder); padding-bottom: 8px; margin-bottom: 14px; }
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

/* ─── ISSUE FORM MODAL ─────────────────────────────────────────── */
const IssueForm = ({ onSuccess, onClose, prefillData }) => {
  const [drugs, setDrugs] = useState([]);
  const [form, setForm] = useState({
    issue_no:            'GI-' + Date.now(),
    issued_to:           prefillData?.issued_to   || '',
    issued_by:           '',
    issue_date:          new Date().toISOString().split('T')[0],
    department:          prefillData?.department  || prefillData?.purpose || '',
    remarks:             prefillData?.remarks     || '',
    transfer_request_id: prefillData?.transfer_request_id || null,
  });
  const [items, setItems] = useState(
    prefillData?.items?.length
      ? prefillData.items
      : [{ drug_id: '', quantity: '', batch_no: '' }]
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiFetch(API + '/inventory').then(d => setDrugs(d.data || d || [])).catch(() => {});
  }, []);

  const setField = k => e => setForm(p => ({ ...p, [k]: e.target.value }));
  const setItem  = (i, k, v) => setItems(prev => prev.map((it, idx) => idx === i ? { ...it, [k]: v } : it));

  const handleDrugChange = (i, val) => {
    const found = drugs.find(d => String(d.drug_id || d.id) === String(val));
    setItems(prev => prev.map((it, idx) => idx === i
      ? { ...it, drug_id: val, batch_no: it.batch_no || (found ? (found.batch_no || '') : '') }
      : it
    ));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (items.some(it => !it.drug_id || !it.quantity)) {
      NotifStore.push('Select a drug and enter quantity for all lines.', 'warning'); return;
    }
    for (const it of items) {
      const d = drugs.find(x => String(x.drug_id || x.id) === String(it.drug_id));
      if (d && Number(it.quantity) > Number(d.quantity)) {
        NotifStore.push(`Cannot issue ${it.quantity} of ${d.drug_name || d.name}. Only ${d.quantity} available.`, 'error');
        return;
      }
    }
    setSaving(true);
    try {
      await apiFetch(`${API}/issues`, {
        method: 'POST',
        body: JSON.stringify({ ...form, items: items.map(it => ({ ...it, quantity: Number(it.quantity) })) }),
      });
      NotifStore.push('Goods Issue recorded successfully!', 'success');
      onSuccess();
    } catch (e) {
      NotifStore.push('Failed: ' + e.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="gi-overlay" onClick={onClose}>
      <div className="gi-modal" onClick={e => e.stopPropagation()}>
        <div className="gi-modal-hd">
          <h2 className="gi-modal-title">
            <ArrowUpRight size={20} color="var(--cwarn)" /> New Goods Issue
          </h2>
          <button className="gi-btn gi-btn-icon" style={{ border:'none', background:'transparent', boxShadow:'none' }} onClick={onClose}>×</button>
        </div>

        <form id="gi-form" onSubmit={handleSubmit}>
          <div className="gi-modal-body">
            {prefillData?.transfer_request_id && (
              <div className="gi-autofill-bar">
                <AlertCircle size={16} />
                Fulfilling Pharmacy Request: {prefillData.requisition_ref}. This will notify the pharmacy upon completion.
              </div>
            )}

            <div className="gi-sec-sep">Issue Details</div>
            <div className="gi-form-grid">
              {[
                { key: 'issue_no',    label: 'Issue No (Auto)',          type: 'text',  ro: true },
                { key: 'issued_to',   label: 'Issued To (Dept/Name)',    type: 'text',  ro: false },
                { key: 'issued_by',   label: 'Issued By',               type: 'text',  ro: false },
                { key: 'issue_date',  label: 'Issue Date',              type: 'date',  ro: false },
                { key: 'department',  label: 'Department / Purpose',    type: 'text',  ro: false },
                { key: 'remarks',     label: 'Remarks',                 type: 'text',  ro: false },
              ].map(f => (
                <div key={f.key} className="gi-fg">
                  <label className="gi-label">{f.label}</label>
                  <input
                    className={`gi-input${f.ro ? '' : ''}`}
                    type={f.type}
                    value={form[f.key]}
                    onChange={f.ro ? undefined : setField(f.key)}
                    readOnly={f.ro}
                  />
                </div>
              ))}
            </div>

            <div className="gi-line-hd">
              <span className="gi-line-title">Line Items</span>
              <button type="button" className="gi-btn gi-btn-primary gi-btn-sm" onClick={() => setItems(p => [...p, { drug_id: '', quantity: '', batch_no: '' }])}>
                <Plus size={14} /> Add Line
              </button>
            </div>

            <div className="gi-line-table-wrap">
              <table className="gi-line-table">
                <thead>
                  <tr>
                    {['Drug *', 'Batch No', 'Quantity *', ''].map(h => <th key={h}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, i) => {
                    const maxQty = drugs.find(d => String(d.drug_id || d.id) === String(item.drug_id))?.quantity || null;
                    return (
                      <tr key={i}>
                        <td>
                          <select className="gi-line-input" style={{ minWidth: 180 }} value={item.drug_id} onChange={e => handleDrugChange(i, e.target.value)} required>
                            <option value="">Select drug…</option>
                            {drugs.map(d => (
                              <option key={d.drug_id || d.id} value={d.drug_id || d.id}>
                                {d.drug_name || d.name} {d.strength || ''} (Stock: {d.quantity})
                              </option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <input className="gi-line-input" type="text" value={item.batch_no || ''} readOnly placeholder="Auto-filled" />
                        </td>
                        <td>
                          <input
                            className={`gi-line-input${maxQty && Number(item.quantity) > maxQty ? ' invalid' : ''}`}
                            type="number" min={1} max={maxQty}
                            value={item.quantity}
                            onChange={e => setItem(i, 'quantity', e.target.value)}
                            required
                          />
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button type="button" className="gi-btn gi-btn-danger gi-btn-icon" style={{ height: 30, width: 30 }} onClick={() => setItems(p => p.filter((_, idx) => idx !== i))} disabled={items.length === 1}>
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="gi-modal-ft">
            <button type="button" className="gi-btn" onClick={onClose}>Cancel</button>
            <button type="submit" form="gi-form" className="gi-btn gi-btn-primary" disabled={saving}>
              {saving ? <><span className="gi-spinner white" /> Saving…</> : 'Record Issue'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ─── MAIN PAGE ──────────────────────────────────────────────────── */
const StoreGoodsIssue = () => {
  const [issues, setIssues]               = useState([]);
  const [approvedRequests, setApprovedRequests] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [formPrefill, setFormPrefill]     = useState(null);
  const [expanded, setExpanded]           = useState(null);
  const [search, setSearch]               = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [d, reqs] = await Promise.all([
        apiFetch(`${API}/issues`),
        apiFetch('/api/v1/transfer-requests?status=APPROVED'),
      ]);
      setIssues(d.data || []);
      setApprovedRequests((reqs.data || []).filter(r => r.status === 'APPROVED'));
    } catch (e) {
      NotifStore.push('Failed to load data: ' + e.message, 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = issues.filter(r =>
    !search ||
    (r.issue_no  || '').toLowerCase().includes(search.toLowerCase()) ||
    (r.issued_to || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="gi-page">
      <style>{CSS}</style>

      {/* MODAL */}
      {formPrefill !== null && (
        <IssueForm
          prefillData={formPrefill}
          onSuccess={() => { setFormPrefill(null); load(); }}
          onClose={() => setFormPrefill(null)}
        />
      )}

      {/* ── HEADER ── */}
      <div className="gi-header">
        <div className="gi-header-left">
          <div className="gi-header-icon"><ArrowUpRight size={24} /></div>
          <div>
            <h1 className="gi-page-title">Goods Issue</h1>
            <p className="gi-page-sub">Record stock issued from store</p>
          </div>
        </div>
        <div className="gi-header-btns">
          <button onClick={() => setFormPrefill({})} className="gi-btn gi-btn-primary">
            <Plus size={16} /> New Issue
          </button>
          <button onClick={load} className="gi-btn gi-btn-icon" disabled={loading} title="Refresh">
            {loading ? <span className="gi-spinner" /> : <RefreshCw size={16} />}
          </button>
        </div>
      </div>

      {/* ── PENDING APPROVED PHARMACY REQUESTS ── */}
      {approvedRequests.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <div className="gi-pending-hd">
            <div className="gi-pending-icon"><AlertCircle size={16} /></div>
            <h2 className="gi-pending-title">Pending Pharmacy Requests</h2>
            <span className="gi-badge-count">{approvedRequests.length} Approved</span>
          </div>
          <div className="gi-req-grid">
            {approvedRequests.map(req => (
              <div key={req.id} className="gi-req-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div className="gi-req-ref">{req.request_code}</div>
                    <div className="gi-req-name">{req.drug_name}</div>
                  </div>
                  <span className="gi-req-qty">{req.requested_qty}</span>
                </div>
                <div className="gi-req-meta">
                  Requested by: Pharmacy Manager<br />
                  Urgency: <span className={req.urgency === 'HIGH' ? 'gi-urgency-high' : 'gi-urgency-mid'}>{req.urgency}</span><br />
                  Approved by CEO
                </div>
                <button
                  className="gi-btn gi-btn-info"
                  style={{ marginTop: 'auto', width: '100%' }}
                  onClick={() => setFormPrefill({
                    transfer_request_id: req.id,
                    issued_to:           'Pharmacy Manager',
                    purpose:             'Pharmacy Stock Replenishment',
                    requisition_ref:     req.request_code,
                    items:               [{ drug_id: req.drug_id, quantity: req.requested_qty, batch_no: '' }],
                  })}
                >
                  <CheckCircle size={14} /> Fulfill Request
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── SEARCH ── */}
      <div className="gi-search-bar">
        <Search size={16} color="var(--ctm)" />
        <input className="gi-search-input" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by issue no or recipient…" />
        <span className="gi-search-count">{filtered.length} record{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* ── ISSUE LIST ── */}
      {loading ? (
        <div className="gi-state">
          <span className="gi-spinner lg" style={{ display: 'inline-block', marginBottom: 12 }} />
          <div>Loading issues…</div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="gi-empty">No goods issues found. Click <strong>New Issue</strong> to record one.</div>
      ) : (
        <div className="gi-issue-list">
          {filtered.map(r => (
            <div key={r.id} className="gi-issue-card">
              <div className="gi-issue-row">
                <div className="gi-issue-left">
                  <div className="gi-issue-icon"><FileText size={20} /></div>
                  <div>
                    <div className="gi-issue-no">{r.issue_no}</div>
                    <div className="gi-issue-meta">
                      To: {r.issued_to || 'N/A'} &nbsp;·&nbsp;
                      By: {r.issued_by || 'N/A'} &nbsp;·&nbsp;
                      {r.issue_date ? new Date(r.issue_date).toLocaleDateString() : new Date(r.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="gi-issue-actions">
                  <span className="gi-badge gi-badge-warn">{(r.items || []).length} item{(r.items || []).length !== 1 ? 's' : ''}</span>
                  <button className="gi-btn gi-btn-sm" onClick={() => setExpanded(expanded === r.id ? null : r.id)}>
                    <Eye size={14} />
                    {expanded === r.id ? 'Hide' : 'View'}
                    {expanded === r.id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  </button>
                </div>
              </div>

              {expanded === r.id && (
                <div className="gi-expand">
                  <div className="gi-expand-meta">
                    {r.department && <div><strong>Department:</strong> {r.department}</div>}
                    {r.purpose    && <div><strong>Purpose:</strong> {r.purpose}</div>}
                    <div><strong>Remarks:</strong> {r.remarks || '—'}</div>
                    {r.requisition_ref && <div><strong>Req Ref:</strong> {r.requisition_ref}</div>}
                    {r.approval_ref    && <div><strong>Approval Ref:</strong> {r.approval_ref}</div>}
                  </div>
                  {(r.items || []).length > 0 && (
                    <div className="gi-expand-table-wrap">
                      <table className="gi-expand-table">
                        <thead>
                          <tr>{['Drug ID', 'Batch No', 'Quantity'].map(h => <th key={h}>{h}</th>)}</tr>
                        </thead>
                        <tbody>
                          {r.items.map((it, i) => (
                            <tr key={i}>
                              <td style={{ fontWeight: 500, color: 'var(--cp)' }}>{it.drug_id}</td>
                              <td style={{ color: 'var(--ct2)' }}>{it.batch_no || '—'}</td>
                              <td style={{ fontWeight: 600, color: 'var(--cwarn)', fontVariantNumeric: 'tabular-nums' }}>{it.quantity}</td>
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
  );
};

export default StoreGoodsIssue;
