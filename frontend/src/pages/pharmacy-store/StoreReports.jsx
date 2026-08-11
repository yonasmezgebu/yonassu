import React, { useState, useEffect, useCallback } from "react";
import { RefreshCw, Printer, AlertTriangle, FileText, Package, CheckCircle, TrendingUp, Activity, X } from 'lucide-react';

const TABS = ["Current Stock", "Issued Items", "Low Stock", "Movements", "Audit Log"];

let _listeners = [];
let _notifications = [];
export const NotifStore = {
  push(msg, type = "info") {
    const n = { id: Date.now(), msg, type, time: new Date() };
    _notifications = [n, ..._notifications].slice(0, 20);
    _listeners.forEach(fn => fn([..._notifications]));
    return n.id;
  },
  subscribe(fn) { _listeners.push(fn); return () => { _listeners = _listeners.filter(l => l !== fn); }; },
  get() { return [..._notifications]; },
  dismiss(id) {
    _notifications = _notifications.filter(n => n.id !== id);
    _listeners.forEach(fn => fn([..._notifications]));
  }
};

export function NotifToastContainer() {
  const [notes, setNotes] = useState(NotifStore.get());
  useEffect(() => NotifStore.subscribe(setNotes), []);
  return (
    <div className="rep-toast-wrap">
      {notes.map(n => {
        const c = { 
          success: { bg: 'var(--cok-bg)', border: 'var(--cok)', text: 'var(--cok)' }, 
          warning: { bg: 'var(--cwarn-bg)', border: 'var(--cwarn)', text: 'var(--cwarn)' }, 
          error: { bg: 'var(--cdanger-bg)', border: 'var(--cdanger)', text: 'var(--cdanger)' }, 
          info: { bg: 'var(--cinfo-bg)', border: 'var(--cinfo)', text: 'var(--cinfo)' } 
        }[n.type] || { bg: 'var(--cinfo-bg)', border: 'var(--cinfo)', text: 'var(--cinfo)' };
        return (
          <div key={n.id} className="rep-toast" style={{ background: c.bg, borderLeftColor: c.border, color: c.text }}>
            <span style={{ flex: 1, fontWeight: 600 }}>{n.msg}</span>
            <button onClick={() => NotifStore.dismiss(n.id)} className="rep-toast-close"><X size={16} /></button>
          </div>
        );
      })}
    </div>
  );
}

const API = "/api/v1/store-inventory";
function hdrs() { return { "Content-Type": "application/json", Authorization: "Bearer " + (localStorage.getItem("token") || "") }; }
async function apiFetch(url, opts = {}) {
  const r = await fetch(url, { headers: hdrs(), ...opts });
  const data = await r.json();
  if (!r.ok) throw new Error(data.message || "Request failed");
  return data;
}

const fmtDate = (v) => v ? new Date(v).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "---";

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
  
  .rep-page {
    box-sizing: border-box;
    margin: 10px auto; width: calc(100% - 20px); max-width: 1536px;
    min-height: calc(100vh - 20px); padding: 24px 24px 48px;
    background: var(--cbg);
    font-family: 'Inter', 'Segoe UI', Roboto, -apple-system, sans-serif;
    color: var(--ct1); line-height: 1.5;
  }
  @media (max-width: 1024px) { .rep-page { margin: 6px auto; width: calc(100% - 12px); padding: 16px 16px 40px; } }
  @media (max-width: 480px)  { .rep-page { margin: 4px auto; width: calc(100% - 8px);  padding: 12px 12px 32px; } }

  /* ── Toasts ── */
  .rep-toast-wrap { position: fixed; top: 16px; right: 16px; z-index: 9999; display: flex; flex-direction: column; gap: 8px; max-width: 360px; width: 90%; }
  .rep-toast { display: flex; align-items: center; gap: 10px; padding: 12px 16px; background: var(--ccard); border-radius: 8px; border-left: 4px solid var(--cp); box-shadow: 0 4px 12px rgba(0,0,0,.15); font-size: 13px; animation: rep-slidein 200ms ease; }
  @keyframes rep-slidein { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
  .rep-toast-close { background: none; border: none; padding: 4px; cursor: pointer; color: inherit; opacity: .7; display: flex; align-items: center; }
  .rep-toast-close:hover { opacity: 1; }

  /* ── Header ── */
  .rep-header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px; margin-bottom: 24px; padding-bottom: 20px; border-bottom: 1px solid var(--cborder); }
  .rep-header-left { display: flex; align-items: center; gap: 12px; }
  .rep-header-icon { background: var(--cp); color: #fff; padding: 10px; border-radius: 10px; display: flex; flex-shrink: 0; }
  .rep-page-title { font-size: clamp(22px,3vw,28px); font-weight: 600; line-height: 1.3; margin: 0 0 2px; color: var(--ct1); }
  .rep-page-sub { font-size: 13px; color: var(--ct2); margin: 0; }
  .rep-header-btns { display: flex; gap: 8px; flex-wrap: wrap; }

  /* ── Buttons ── */
  .rep-btn { height: 36px; padding: 0 16px; border-radius: 8px; font-size: 14px; font-weight: 500; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; border: 1px solid var(--cborder); background: var(--ccard); color: var(--ct1); font-family: inherit; transition: all 150ms ease-in-out; white-space: nowrap; min-width: 44px; justify-content: center; }
  .rep-btn:hover:not(:disabled) { background: var(--gold); color: var(--gold-text); border-color: transparent; box-shadow: 0 4px 12px rgba(0,0,0,.10); transform: translateY(-1px); }
  .rep-btn:disabled { opacity: .5; cursor: not-allowed; }
  .rep-btn-primary { background: var(--cp); color: #fff; border-color: var(--cp); }
  .rep-btn-primary:hover:not(:disabled) { background: var(--gold); color: var(--gold-text); border-color: transparent; }
  
  /* ── Tabs ── */
  .rep-tabs { display: flex; gap: 8px; overflow-x: auto; margin-bottom: 24px; padding-bottom: 4px; scroll-snap-type: x mandatory; }
  .rep-tab { flex-shrink: 0; height: 36px; padding: 0 16px; font-size: 13px; font-weight: 500; color: var(--ct2); background: transparent; border: none; border-radius: 8px; cursor: pointer; transition: all 150ms; scroll-snap-align: start; }
  .rep-tab:hover { background: #F9FAFB; color: var(--ct1); }
  .rep-tab.active { background: var(--ccard); color: var(--cp); font-weight: 600; box-shadow: 0 1px 3px rgba(0,0,0,.06); }

  /* ── Data Panels ── */
  .rep-panel { animation: rep-fadein 200ms ease; }
  @keyframes rep-fadein { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
  
  .rep-table-wrap { background: var(--ccard); border: 1px solid var(--cborder); border-radius: 10px; box-shadow: 0 1px 3px rgba(0,0,0,.06); margin-bottom: 24px; overflow: hidden; }
  .rep-table-hd { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid var(--cborder); flex-wrap: wrap; gap: 12px; }
  .rep-table-title { font-size: 16px; font-weight: 600; color: var(--ct1); display: flex; align-items: center; gap: 8px; }
  .rep-table-meta { font-size: 13px; color: var(--ct2); font-weight: 500; }
  
  .rep-table-scroll { overflow-x: auto; }
  .rep-table { width: 100%; border-collapse: collapse; font-size: 13px; min-width: 800px; }
  .rep-table thead tr { background: #F9FAFB; }
  .rep-table th { padding: 12px 16px; font-size: 12px; font-weight: 500; text-transform: uppercase; letter-spacing: .03em; color: var(--ctm); border-bottom: 1px solid var(--cborder); text-align: left; }
  .rep-table td { padding: 12px 16px; border-bottom: 1px solid var(--cborder); color: var(--ct1); vertical-align: middle; transition: background 150ms; }
  .rep-table tbody tr:hover td { background: #F9FAFB; }
  .rep-table tbody tr:last-child td { border-bottom: none; }

  /* ── Grand Total ── */
  .rep-gt-card { background: var(--ccard); border: 1px solid var(--cborder); border-radius: 10px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,.06); margin-bottom: 24px; display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 16px; transition: all 150ms; }
  .rep-gt-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,.08); transform: translateY(-1px); }
  .rep-gt-label { font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: .03em; color: var(--ctm); }
  .rep-gt-val { font-size: 32px; font-weight: 700; color: var(--cp); line-height: 1; }

  /* ── Badges ── */
  .rep-badge { display: inline-flex; padding: 2px 10px; border-radius: 9999px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: .02em; }
  
  /* ── Spinner ── */
  .rep-spinner { display: inline-block; width: 16px; height: 16px; border-radius: 50%; border: 2.5px solid rgba(37,99,235,.2); border-top-color: var(--cp); animation: rep-spin 700ms linear infinite; }
  .rep-spinner.lg { width: 32px; height: 32px; border-width: 3px; }
  @keyframes rep-spin { to { transform: rotate(360deg); } }
  
  .rep-empty { padding: 64px 24px; text-align: center; color: var(--ctm); font-size: 14px; }
`;

const StoreReports = () => {
  const [activeTab, setActiveTab] = useState(TABS[0]);
  const [inventory, setInventory] = useState([]);
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [invData, movData] = await Promise.all([
        apiFetch(API + "/inventory"),
        apiFetch(API + "/movements"),
      ]);
      setInventory(invData.data || invData || []);
      setMovements(movData.data || movData || []);
    } catch (e) {
      NotifStore.push("Failed to load data: " + e.message, "error");
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const issuedItems = movements.filter(m => (m.movement_type || "").toUpperCase() === "ISSUE");

  // ---------- CURRENT STOCK ----------
  const renderCurrentStock = () => {
    const grouped = inventory.reduce((acc, m) => {
      const cat = m.category || "Uncategorized";
      if (!acc[cat]) acc[cat] = { items: [], count: 0, totalValue: 0 };
      acc[cat].items.push(m);
      acc[cat].count += parseFloat(m.quantity || 0);
      acc[cat].totalValue += parseFloat(m.quantity || 0) * parseFloat(m.unit_price || 0);
      return acc;
    }, {});
    const grand = inventory.reduce((s, m) => s + parseFloat(m.quantity || 0) * parseFloat(m.unit_price || 0), 0);
    
    return (
      <div className="rep-panel">
        <div className="rep-gt-card">
          <div className="rep-gt-label">Grand Total Value (Current Stock)</div>
          <div className="rep-gt-val">ETB {grand.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
        </div>
        
        {Object.keys(grouped).length === 0 && <div className="rep-empty">Inventory is empty.</div>}
        
        {Object.entries(grouped).map(([cat, g]) => (
          <div key={cat} className="rep-table-wrap">
            <div className="rep-table-hd">
              <div className="rep-table-title"><Package size={18} color="var(--ct2)" /> {cat}</div>
              <div className="rep-table-meta">Units: <strong>{g.count.toLocaleString()}</strong> &nbsp;·&nbsp; Value: <strong>ETB {g.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong></div>
            </div>
            <div className="rep-table-scroll">
              <table className="rep-table">
                <thead>
                  <tr>
                    <th>Drug Name</th>
                    <th>Batch No</th>
                    <th style={{ textAlign: 'right' }}>Quantity</th>
                    <th>Expiry</th>
                    <th>Unit</th>
                    <th style={{ textAlign: 'right' }}>Unit Price</th>
                    <th style={{ textAlign: 'right' }}>Total Value</th>
                  </tr>
                </thead>
                <tbody>
                  {g.items.map((m, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 500 }}>{m.drug_name || m.name || "---"}</td>
                      <td style={{ color: 'var(--ct2)' }}>{m.batch_no || m.batch_number || "---"}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--cok)' }}>{parseFloat(m.quantity || 0).toLocaleString()}</td>
                      <td style={{ color: m.expiry_date && new Date(m.expiry_date) < new Date() ? 'var(--cdanger)' : 'var(--ct2)' }}>{m.expiry_date ? new Date(m.expiry_date).toLocaleDateString() : "---"}</td>
                      <td style={{ color: 'var(--ct2)' }}>{m.unit || "---"}</td>
                      <td style={{ textAlign: 'right', color: 'var(--ct2)' }}>ETB {parseFloat(m.unit_price || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>ETB {(parseFloat(m.quantity || 0) * parseFloat(m.unit_price || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // ---------- ISSUED ITEMS ----------
  const renderIssuedItems = () => (
    <div className="rep-panel rep-table-wrap">
      <div className="rep-table-hd">
        <div className="rep-table-title"><TrendingUp size={18} color="var(--cwarn)" /> Issued Items</div>
        <div className="rep-table-meta">{issuedItems.length} record(s)</div>
      </div>
      <div className="rep-table-scroll">
        <table className="rep-table" style={{ minWidth: 1000 }}>
          <thead>
            <tr>
              <th>Date & Time</th>
              <th>Issue No</th>
              <th>Drug Name</th>
              <th>Strength</th>
              <th>Batch No</th>
              <th style={{ textAlign: 'right' }}>Qty Out</th>
              <th>Dept / Remarks</th>
              <th>Processed By</th>
            </tr>
          </thead>
          <tbody>
            {issuedItems.length === 0 ? (
              <tr><td colSpan={8} className="rep-empty">No items issued yet.</td></tr>
            ) : issuedItems.map((m, i) => (
              <tr key={i}>
                <td style={{ color: 'var(--ct2)', fontSize: 12 }}>{fmtDate(m.created_at)}</td>
                <td style={{ fontFamily: 'monospace', color: 'var(--ctm)' }}>{m.reference_no || "---"}</td>
                <td style={{ fontWeight: 500 }}>{m.drug_name || "---"}</td>
                <td style={{ color: 'var(--ct2)', fontSize: 12 }}>{m.strength || "---"}</td>
                <td style={{ color: 'var(--ct2)' }}>{m.batch_no || "---"}</td>
                <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--cdanger)' }}>
                  {m.quantity_out ? "-" + Number(m.quantity_out).toLocaleString() : "---"}
                </td>
                <td style={{ color: 'var(--ct2)' }}>{m.remarks || "---"}</td>
                <td style={{ color: 'var(--ct2)' }}>{m.performed_by || "---"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  // ---------- LOW STOCK ----------
  const renderLowStock = () => {
    const low = inventory.filter(m => parseFloat(m.quantity || 0) <= parseFloat(m.min_level || m.reorder_level || 10));
    return (
      <div className="rep-panel rep-table-wrap">
        <div className="rep-table-hd" style={{ background: low.length > 0 ? 'var(--cdanger-bg)' : '#F9FAFB', borderBottom: `1px solid ${low.length > 0 ? 'var(--cdanger)' : 'var(--cborder)'}` }}>
          <div className="rep-table-title" style={{ color: low.length > 0 ? 'var(--cdanger)' : 'var(--ct1)' }}>
            <AlertTriangle size={18} /> Low Stock Alert
          </div>
          {low.length > 0 && <div className="rep-badge" style={{ background: 'var(--cdanger)', color: '#fff' }}>Warning: {low.length} item(s) need restocking</div>}
        </div>
        <div className="rep-table-scroll">
          <table className="rep-table">
            <thead>
              <tr>
                <th>Drug Name</th>
                <th>Category</th>
                <th style={{ textAlign: 'right' }}>Current Qty</th>
                <th style={{ textAlign: 'right' }}>Min Level</th>
                <th>Unit</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {low.length === 0 ? (
                <tr><td colSpan={6} className="rep-empty">All items have adequate stock.</td></tr>
              ) : low.map((m, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 500 }}>{m.drug_name || m.name || "---"}</td>
                  <td style={{ color: 'var(--ct2)' }}>{m.category || "---"}</td>
                  <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--cdanger)' }}>{parseFloat(m.quantity || 0).toLocaleString()}</td>
                  <td style={{ textAlign: 'right', fontWeight: 500 }}>{m.min_level || m.reorder_level || 10}</td>
                  <td style={{ color: 'var(--ct2)' }}>{m.unit || "---"}</td>
                  <td><span className="rep-badge" style={{ background: 'var(--cdanger-bg)', color: 'var(--cdanger)', border: '1px solid var(--cdanger)' }}>Reorder Now!</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // ---------- MOVEMENTS ----------
  const renderMovements = () => {
    const typeColor = { RECEIPT: 'var(--cok)', ISSUE: 'var(--cwarn)', ADJUSTMENT: 'var(--cinfo)', COUNT: '#8B5CF6' };
    const typeBg    = { RECEIPT: 'var(--cok-bg)', ISSUE: 'var(--cwarn-bg)', ADJUSTMENT: 'var(--cinfo-bg)', COUNT: '#EDE9FE' };
    return (
      <div className="rep-panel rep-table-wrap">
        <div className="rep-table-hd">
          <div className="rep-table-title"><Activity size={18} color="var(--cp)" /> All Stock Movements</div>
          <div className="rep-table-meta">{movements.length} record(s)</div>
        </div>
        <div className="rep-table-scroll">
          <table className="rep-table" style={{ minWidth: 1200 }}>
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Type</th>
                <th>Reference</th>
                <th>Drug Name</th>
                <th>Strength</th>
                <th>Batch No</th>
                <th style={{ textAlign: 'right' }}>Qty In</th>
                <th style={{ textAlign: 'right' }}>Qty Out</th>
                <th>Details</th>
                <th>Performed By</th>
              </tr>
            </thead>
            <tbody>
              {movements.length === 0 ? (
                <tr><td colSpan={10} className="rep-empty">No movement records found.</td></tr>
              ) : movements.map((m, i) => {
                const type = (m.movement_type || "").toUpperCase();
                return (
                  <tr key={i}>
                    <td style={{ color: 'var(--ct2)', fontSize: 12 }}>{fmtDate(m.created_at)}</td>
                    <td>
                      <span className="rep-badge" style={{ background: typeBg[type] || 'var(--cbg)', color: typeColor[type] || 'var(--ctm)', border: `1px solid ${typeColor[type] || 'var(--ctm)'}` }}>
                        {type || "---"}
                      </span>
                    </td>
                    <td style={{ fontFamily: 'monospace', color: 'var(--ctm)' }}>{m.reference_no || "---"}</td>
                    <td style={{ fontWeight: 500 }}>{m.drug_name || "---"}</td>
                    <td style={{ color: 'var(--ct2)', fontSize: 12 }}>{m.strength || "---"}</td>
                    <td style={{ color: 'var(--ct2)' }}>{m.batch_no || "---"}</td>
                    <td style={{ textAlign: 'right' }}>
                      {m.quantity_in ? <span style={{ color: 'var(--cok)', fontWeight: 600 }}>+{Number(m.quantity_in).toLocaleString()}</span> : <span style={{ color: 'var(--cborder)' }}>—</span>}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {m.quantity_out ? <span style={{ color: 'var(--cdanger)', fontWeight: 600 }}>-{Number(m.quantity_out).toLocaleString()}</span> : <span style={{ color: 'var(--cborder)' }}>—</span>}
                    </td>
                    <td style={{ color: 'var(--ct2)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={m.remarks || ""}>{m.remarks || "---"}</td>
                    <td style={{ color: 'var(--ct2)' }}>{m.performed_by || "---"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // ---------- AUDIT LOG ----------
  const renderAuditLog = () => {
    const typeColor = { RECEIPT: 'var(--cok)', ISSUE: 'var(--cwarn)', ADJUSTMENT: 'var(--cinfo)', COUNT: '#8B5CF6' };
    return (
      <div className="rep-panel rep-table-wrap">
        <div className="rep-table-hd" style={{ background: '#F3F4F6' }}>
          <div className="rep-table-title"><CheckCircle size={18} color="var(--ct2)" /> Complete Audit Trail</div>
          <div className="rep-table-meta">{movements.length} entries</div>
        </div>
        <div className="rep-table-scroll">
          <table className="rep-table" style={{ minWidth: 1100 }}>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Action</th>
                <th>Reference</th>
                <th>Drug Name</th>
                <th>Strength</th>
                <th>Batch No</th>
                <th style={{ textAlign: 'right' }}>Qty Change</th>
                <th>Details</th>
                <th>User</th>
              </tr>
            </thead>
            <tbody>
              {movements.length === 0 ? (
                <tr><td colSpan={9} className="rep-empty">Audit log is empty.</td></tr>
              ) : movements.map((m, i) => {
                const type = (m.movement_type || "").toUpperCase();
                const change = m.quantity_out ? -Number(m.quantity_out) : Number(m.quantity_in || 0);
                return (
                  <tr key={i}>
                    <td style={{ color: 'var(--ct2)', fontSize: 12 }}>{fmtDate(m.created_at)}</td>
                    <td>
                      <span className="rep-badge" style={{ background: typeColor[type] || 'var(--ctm)', color: '#fff' }}>{type || "---"}</span>
                    </td>
                    <td style={{ fontFamily: 'monospace', color: 'var(--ctm)' }}>{m.reference_no || "---"}</td>
                    <td style={{ fontWeight: 500 }}>{m.drug_name || "---"}</td>
                    <td style={{ color: 'var(--ct2)', fontSize: 12 }}>{m.strength || "---"}</td>
                    <td style={{ color: 'var(--ct2)' }}>{m.batch_no || "---"}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600, color: change < 0 ? 'var(--cdanger)' : 'var(--cok)' }}>
                      {change > 0 ? "+" + change.toLocaleString() : change < 0 ? change.toLocaleString() : "—"}
                    </td>
                    <td style={{ color: 'var(--ct2)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={m.remarks || ""}>{m.remarks || "---"}</td>
                    <td style={{ color: 'var(--ct2)' }}>{m.performed_by || "---"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // ---------- PRINT ----------
  const handlePrint = () => {
    const pw = window.open("", "_blank");
    if (!pw) { NotifStore.push("Allow popups to print.", "error"); return; }
    const dt = new Date().toLocaleString();
    const TH = (t) => `<th style="padding:10px 12px;text-align:left;font-size:11px;text-transform:uppercase;border-bottom:2px solid #E5E7EB;color:#6B7280;">${t}</th>`;
    const TD = (t) => `<td style="padding:10px 12px;border-bottom:1px solid #E5E7EB;font-size:12px;color:#111827;">${t ?? "---"}</td>`;
    const fmt2 = (n) => parseFloat(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2 });
    let body = "";

    if (activeTab === "Current Stock") {
      const grouped = inventory.reduce((acc, m) => { const c = m.category || "Uncategorized"; if (!acc[c]) acc[c] = []; acc[c].push(m); return acc; }, {});
      const grand = inventory.reduce((s, m) => s + parseFloat(m.quantity || 0) * parseFloat(m.unit_price || 0), 0);
      body += `<p style="font-size:16px;font-weight:700;color:#2563EB;margin-bottom:16px">Grand Total: ETB ${fmt2(grand)}</p>`;
      Object.entries(grouped).forEach(([cat, items]) => {
        body += `<h3 style="background:#F9FAFB;border:1px solid #E5E7EB;border-bottom:none;padding:10px 12px;margin:24px 0 0;font-size:14px;color:#111827;">${cat}</h3>`;
        body += `<table style="width:100%;border-collapse:collapse;border:1px solid #E5E7EB;margin-bottom:16px;"><thead><tr>${TH("Drug")}${TH("Batch")}${TH("Qty")}${TH("Expiry")}${TH("Unit")}${TH("Unit Price")}${TH("Total")}</tr></thead><tbody>`;
        items.forEach(m => {
          body += `<tr>${TD(m.drug_name || m.name)}${TD(m.batch_no || m.batch_number)}${TD(parseFloat(m.quantity || 0).toLocaleString())}${TD(m.expiry_date ? new Date(m.expiry_date).toLocaleDateString() : "---")}${TD(m.unit)}${TD("ETB " + fmt2(m.unit_price))}${TD("ETB " + fmt2(parseFloat(m.quantity || 0) * parseFloat(m.unit_price || 0)))}</tr>`;
        });
        body += "</tbody></table>";
      });
    } else if (activeTab === "Issued Items") {
      body += `<p style="font-weight:600;margin-bottom:12px;color:#6B7280;">Total: ${issuedItems.length} records</p>`;
      body += `<table style="width:100%;border-collapse:collapse;border:1px solid #E5E7EB;"><thead><tr style="background:#F9FAFB">${TH("Date")}${TH("Issue No")}${TH("Drug")}${TH("Strength")}${TH("Batch")}${TH("Qty Out")}${TH("Dept/Remarks")}${TH("By")}</tr></thead><tbody>`;
      issuedItems.forEach(m => {
        body += `<tr>${TD(fmtDate(m.created_at))}${TD(m.reference_no)}${TD(m.drug_name)}${TD(m.strength)}${TD(m.batch_no)}${TD(m.quantity_out ? "-" + Number(m.quantity_out).toLocaleString() : "---")}${TD(m.remarks)}${TD(m.performed_by)}</tr>`;
      });
      body += "</tbody></table>";
    } else if (activeTab === "Low Stock") {
      const low = inventory.filter(m => parseFloat(m.quantity || 0) <= parseFloat(m.min_level || m.reorder_level || 10));
      body += `<p style="font-weight:700;color:#DC2626;margin-bottom:12px">Warning: ${low.length} item(s) need restocking</p>`;
      body += `<table style="width:100%;border-collapse:collapse;border:1px solid #E5E7EB;"><thead><tr style="background:#F9FAFB">${TH("Drug")}${TH("Category")}${TH("Qty")}${TH("Min Level")}${TH("Unit")}${TH("Status")}</tr></thead><tbody>`;
      low.forEach(m => {
        body += `<tr>${TD(m.drug_name || m.name)}${TD(m.category)}${TD(parseFloat(m.quantity || 0).toLocaleString())}${TD(m.min_level || m.reorder_level || 10)}${TD(m.unit)}<td style="color:#DC2626;font-weight:600;border-bottom:1px solid #E5E7EB;padding:10px 12px">Reorder Now!</td></tr>`;
      });
      body += "</tbody></table>";
    } else {
      body += `<p style="font-weight:600;margin-bottom:12px;color:#6B7280;">Total: ${movements.length} records</p>`;
      body += `<table style="width:100%;border-collapse:collapse;border:1px solid #E5E7EB;"><thead><tr style="background:#F9FAFB">${TH("Date")}${TH("Type")}${TH("Reference")}${TH("Drug")}${TH("Strength")}${TH("Batch")}${TH("Qty In")}${TH("Qty Out")}${TH("Details")}${TH("By")}</tr></thead><tbody>`;
      movements.forEach(m => {
        body += `<tr>${TD(fmtDate(m.created_at))}${TD(m.movement_type)}${TD(m.reference_no)}${TD(m.drug_name)}${TD(m.strength)}${TD(m.batch_no)}${TD(m.quantity_in ? "+" + Number(m.quantity_in).toLocaleString() : "---")}${TD(m.quantity_out ? "-" + Number(m.quantity_out).toLocaleString() : "---")}${TD(m.remarks)}${TD(m.performed_by)}</tr>`;
      });
      body += "</tbody></table>";
    }

    pw.document.write(`<html><head><title>Pharmacy ${activeTab}</title><style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Inter',sans-serif;font-size:12px;padding:32px;color:#111827;}h1{color:#2563EB;margin-bottom:4px;font-size:24px}h3{font-size:14px}.meta{font-size:12px;color:#6B7280;margin-bottom:24px;border-bottom:2px solid #E5E7EB;padding-bottom:16px;}tr:nth-child(even)td{background:#F9FAFB}tr{page-break-inside:avoid}@page{margin:15mm;size:A4 landscape}</style></head><body><h1>Pharmacy Store — ${activeTab}</h1><div class="meta">Generated: ${dt} | Sutana University</div>${body}<script>window.onload=function(){window.print();}</script></body></html>`);
    pw.document.close();
  };

  return (
    <div className="rep-page">
      <NotifToastContainer />
      <style>{CSS}</style>

      {/* ── HEADER ── */}
      <div className="rep-header">
        <div className="rep-header-left">
          <div className="rep-header-icon"><FileText size={24} /></div>
          <div>
            <h1 className="rep-page-title">Pharmacy Reports</h1>
            <p className="rep-page-sub">Comprehensive stock, value and audit tracking</p>
          </div>
        </div>
        <div className="rep-header-btns">
          <button onClick={handlePrint} className="rep-btn">
            <Printer size={16} /> Print Report
          </button>
          <button onClick={loadData} className="rep-btn rep-btn-primary" disabled={loading}>
            {loading ? <span className="rep-spinner" style={{ borderColor: 'rgba(255,255,255,.3)', borderTopColor: '#fff' }} /> : <RefreshCw size={16} />} 
            Refresh Data
          </button>
        </div>
      </div>

      {/* ── TABS ── */}
      <div className="rep-tabs">
        {TABS.map(t => (
          <button key={t} onClick={() => setActiveTab(t)} className={`rep-tab ${activeTab === t ? 'active' : ''}`}>
            {t}
          </button>
        ))}
      </div>

      {/* ── BODY ── */}
      {loading ? (
        <div className="rep-empty">
          <span className="rep-spinner lg" style={{ marginBottom: 16 }} />
          <div>Loading {activeTab}...</div>
        </div>
      ) : (
        <>
          {activeTab === "Current Stock" && renderCurrentStock()}
          {activeTab === "Issued Items"  && renderIssuedItems()}
          {activeTab === "Low Stock"     && renderLowStock()}
          {activeTab === "Movements"     && renderMovements()}
          {activeTab === "Audit Log"     && renderAuditLog()}
        </>
      )}
    </div>
  );
};

export default StoreReports;
