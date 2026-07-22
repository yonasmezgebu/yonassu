import React, { useState, useEffect, useCallback } from 'react';

/* ─── Color Palette (Nature / Green University Theme) ───────────────────── */
const G = {
  forest: '#228B22', dark: '#1B5E20', emerald: '#2E8B57', leaf: '#4CAF50',
  sage: '#A5D6A7', olive: '#6B8E23', mint: '#98FF98', brown: '#8D6E63',
  sky: '#87CEEB', white: '#FFFFFF', light: '#F5F5F5', darkGray: '#424242',
  orange: '#FF9800', red: '#F44336', purple: '#7C3AED',
};

const ROLES = ['Pharmacy Store Keeper', 'Supervisor', 'Finance', 'CEO'];
const TABS = ['Current Stock', 'Issued Items', 'Low Stock', 'Movements', 'Audit Log'];

/* ─── NOTIFICATION STORE ────────────────────────────────────────────────── */
let _listeners = [];
let _notifications = [];
export const NotifStore = {
  push(msg, type = 'info') {
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
    <div style={{ position: 'fixed', top: 16, right: 16, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 360, width: '90%' }}>
      {notes.map(n => {
        const c = { success: { bg: G.leaf, border: G.dark }, warning: { bg: G.orange, border: '#E65100' }, error: { bg: G.red, border: '#B71C1C' }, info: { bg: G.emerald, border: G.dark } }[n.type] || { bg: G.emerald, border: G.dark };
        return (
          <div key={n.id} style={{ background: c.bg, border: `2px solid ${c.border}`, color: '#fff', padding: '12px 16px', boxShadow: `4px 4px 0 ${c.border}`, fontFamily: "'Inter',sans-serif", fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10, animation: 'slideIn .25s ease-out', borderRadius: 0 }}>
            <span style={{ flex: 1 }}>{n.msg}</span>
            <button onClick={() => NotifStore.dismiss(n.id)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 18, fontWeight: 900, padding: 0, lineHeight: 1 }}>✕</button>
          </div>
        );
      })}
      <style>{`@keyframes slideIn{from{transform:translateX(110%);opacity:0}to{transform:translateX(0);opacity:1}}`}</style>
    </div>
  );
}

/* ─── Shared API ─────────────────────────────────────────────────────────── */
const API = '/api/v1/store-inventory';
function hdrs() {
  return { 'Content-Type': 'application/json', Authorization: 'Bearer ' + (localStorage.getItem('token') || '') };
}
async function apiFetch(url, opts = {}) {
  const r = await fetch(url, { headers: hdrs(), ...opts });
  const data = await r.json();
  if (!r.ok) throw new Error(data.message || 'Request failed');
  return data;
}

/* ─── Global Styles & Responsive Helpers ────────────────────────────────── */
const GlobalStyles = () => (
  <style>{`
    @keyframes rowIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes fadeUp { from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)} }
    
    .report-row:hover { background: ${G.sage}33 !important; }

    /* Custom scrollbar for tables */
    .table-container::-webkit-scrollbar { height: 8px; }
    .table-container::-webkit-scrollbar-track { background: ${G.light}; }
    .table-container::-webkit-scrollbar-thumb { background: ${G.sage}; border-radius: 0px; }
    
    /* 3D Typography */
    .artistic-3d-title { font-size: 2.2rem; font-weight: 900; color: #fff; letter-spacing: 1px; text-transform: uppercase; text-shadow: 2px 2px 0 ${G.dark}, 4px 4px 0 rgba(0,0,0,0.2); margin: 0; line-height: 1.2; }
    @media(min-width: 768px) { .artistic-3d-title { font-size: 2.8rem; } }

    /* Print styles injected by handlePrint */
  `}</style>
);

const Badge = ({ text, type = 'default' }) => {
  const colors = { default: G.olive, success: G.forest, warning: G.orange, error: G.red, info: G.sky };
  return (
    <span style={{ background: colors[type] || colors.default, color: '#fff', padding: '4px 10px', borderRadius: 0, fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 0.5, whiteSpace: 'nowrap' }}>
      {text}
    </span>
  );
};

const StoreReports = () => {
  const [role, setRole] = useState('Pharmacy Store Keeper');
  const [activeTab, setActiveTab] = useState(TABS[0]);

  // Data states
  const [inventory, setInventory] = useState([]);
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(false);

  // Computed Access Rules
  const canViewValues = role === 'Finance' || role === 'CEO';

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch Inventory
      const invData = await apiFetch(`${API}/inventory`);
      setInventory(invData.data || invData || []);

      // 2. Fetch Movements (Logs/Audit)
      const movData = await apiFetch(`${API}/movements`);
      setMovements(movData.data || movData || []);
    } catch (e) {
      NotifStore.push('Failed to load reports: ' + e.message, 'error');
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // RENDER: Current Stock
  const renderCurrentStock = () => {
    const grouped = inventory.reduce((acc, m) => {
      const cat = m.category || 'Uncategorized';
      if (!acc[cat]) acc[cat] = { items: [], count: 0, totalValue: 0 };
      acc[cat].items.push(m);
      acc[cat].count += parseFloat(m.quantity || 0);
      acc[cat].totalValue += (parseFloat(m.quantity || 0) * parseFloat(m.unit_price || 0));
      return acc;
    }, {});

    const grandTotalValue = inventory.reduce((sum, m) => sum + (parseFloat(m.quantity || 0) * parseFloat(m.unit_price || 0)), 0);

    return (
      <div style={{ animation: 'fadeUp 0.4s ease' }}>
        <div style={{ background: G.dark, color: '#fff', padding: '20px', marginBottom: 24, border: `3px solid ${G.lime}`, display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 14, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, color: G.sage }}>Grand Total Value (All Categories)</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900 }}>ETB {grandTotalValue.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</div>
        </div>

        {Object.keys(grouped).length === 0 ? <div style={{ padding: 40, textAlign: 'center', color: G.olive, fontWeight: 700, background: '#fff', border: `3px solid ${G.sage}` }}>Inventory is empty.</div> : null}

        {Object.entries(grouped).map(([cat, g]) => (
          <div key={cat} style={{ marginBottom: 40, border: `3px solid ${G.sage}`, background: '#fff', overflow: 'hidden' }}>
            <div style={{ background: G.sage, padding: '14px 20px', display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 16, fontWeight: 900, color: G.dark, textTransform: 'uppercase' }}>{cat}</div>
              <div style={{ fontSize: 13, fontWeight: 800, color: G.dark }}>
                Total Units: {g.count.toLocaleString()}
                {' '} | Value: ETB {g.totalValue.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}
              </div>
            </div>
            
            <div className="table-container" style={{ overflowX: 'auto', width: '100%' }}>
              <div style={{ minWidth: 800 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1.5fr 1fr 1fr 1fr', background: G.forest, color: '#fff', fontSize: 12, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1 }}>
                  <div style={{ padding: '12px 16px' }}>Drug Name</div>
                  <div style={{ padding: '12px 16px' }}>Batch No</div>
                  <div style={{ padding: '12px 16px' }}>Quantity</div>
                  <div style={{ padding: '12px 16px' }}>Expiry</div>
                  <div style={{ padding: '12px 16px' }}>Unit</div>
                  <div style={{ padding: '12px 16px' }}>Unit Value</div>
                  <div style={{ padding: '12px 16px' }}>Total Value</div>
                </div>

                {g.items.map((m, i) => (
                  <div key={m.id || i} className="report-row" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1.5fr 1fr 1fr 1fr', borderBottom: `1px solid ${G.light}`, fontSize: 13, color: G.darkGray, animation: `rowIn 0.3s ease forwards`, animationDelay: `${i*0.03}s`, opacity: 0 }}>
                    <div style={{ padding: '12px 16px', fontWeight: 800 }}>{m.drug_name || m.name}</div>
                    <div style={{ padding: '12px 16px' }}>{m.batch_number || '-'}</div>
                    <div style={{ padding: '12px 16px', fontWeight: 800, color: G.forest }}>{parseFloat(m.quantity || 0).toLocaleString()}</div>
                    <div style={{ padding: '12px 16px', color: m.expiry_date && new Date(m.expiry_date) < new Date() ? G.red : 'inherit' }}>
                      {m.expiry_date ? new Date(m.expiry_date).toLocaleDateString() : '-'}
                    </div>
                    <div style={{ padding: '12px 16px' }}>{m.unit}</div>
                    <div style={{ padding: '12px 16px' }}>{parseFloat(m.unit_price || 0).toLocaleString(undefined, {minimumFractionDigits:2})}</div>
                    <div style={{ padding: '12px 16px', fontWeight: 800 }}>{(parseFloat(m.quantity || 0) * parseFloat(m.unit_price || 0)).toLocaleString(undefined, {minimumFractionDigits:2})}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // RENDER: Issued Items
  const renderIssuedItems = () => {
    const issues = movements.filter(m => m.type === 'ISSUE');
    return (
      <div style={{ border: `3px solid ${G.sage}`, background: '#fff', animation: 'fadeUp 0.4s ease', overflow: 'hidden' }}>
        <div className="table-container" style={{ overflowX: 'auto', width: '100%' }}>
          <div style={{ minWidth: 900 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 2fr 1fr 1.5fr 1.5fr', background: G.forest, color: '#fff', fontSize: 12, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1 }}>
              <div style={{ padding: '12px 16px' }}>Date</div>
              <div style={{ padding: '12px 16px' }}>Ref No</div>
              <div style={{ padding: '12px 16px' }}>Drug</div>
              <div style={{ padding: '12px 16px' }}>Quantity</div>
              <div style={{ padding: '12px 16px' }}>Target Dept</div>
              <div style={{ padding: '12px 16px' }}>Processed By</div>
            </div>
            {issues.length === 0 ? <div style={{ padding: 40, textAlign: 'center', color: G.olive, fontWeight: 700 }}>No items issued yet.</div> : null}
            {issues.map((l, i) => (
              <div key={l.id || i} className="report-row" style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 2fr 1fr 1.5fr 1.5fr', borderBottom: `1px solid ${G.light}`, fontSize: 13, color: G.darkGray, animation: `rowIn 0.3s ease forwards`, animationDelay: `${i*0.03}s`, opacity: 0 }}>
                <div style={{ padding: '12px 16px', fontWeight: 800 }}>{new Date(l.created_at || l.date).toLocaleString()}</div>
                <div style={{ padding: '12px 16px', color: G.olive, fontWeight: 700 }}>{l.reference_no || '-'}</div>
                <div style={{ padding: '12px 16px' }}>{l.drug_name || l.item_name}</div>
                <div style={{ padding: '12px 16px', fontWeight: 900, color: G.orange }}>{l.quantity}</div>
                <div style={{ padding: '12px 16px' }}><Badge text={l.target_location || l.department || 'General'} type="info" /></div>
                <div style={{ padding: '12px 16px' }}>{l.user || l.processed_by || '-'}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // RENDER: Low Stock
  const renderLowStock = () => {
    const low = inventory.filter(m => parseFloat(m.quantity || 0) <= parseFloat(m.min_level || m.reorder_level || 10));
    return (
      <div style={{ border: `3px solid ${G.sage}`, background: '#fff', animation: 'fadeUp 0.4s ease', overflow: 'hidden' }}>
        <div className="table-container" style={{ overflowX: 'auto', width: '100%' }}>
          <div style={{ minWidth: 800 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1.5fr', background: G.red, color: '#fff', fontSize: 12, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1 }}>
              <div style={{ padding: '12px 16px' }}>Drug Name</div>
              <div style={{ padding: '12px 16px' }}>Category</div>
              <div style={{ padding: '12px 16px' }}>Current Qty</div>
              <div style={{ padding: '12px 16px' }}>Min Level</div>
              <div style={{ padding: '12px 16px' }}>Status</div>
            </div>
            {low.length === 0 ? <div style={{ padding: 40, textAlign: 'center', color: G.olive, fontWeight: 700 }}>No items are low on stock.</div> : null}
            {low.map((m, i) => (
              <div key={m.id || i} className="report-row" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1.5fr', borderBottom: `1px solid ${G.light}`, fontSize: 13, color: G.darkGray, animation: `rowIn 0.3s ease forwards`, animationDelay: `${i*0.03}s`, opacity: 0 }}>
                <div style={{ padding: '12px 16px', fontWeight: 800 }}>{m.drug_name || m.name}</div>
                <div style={{ padding: '12px 16px' }}><Badge text={m.category || 'Uncategorized'} /></div>
                <div style={{ padding: '12px 16px', fontWeight: 900, color: G.red }}>{parseFloat(m.quantity || 0).toLocaleString()} {m.unit}</div>
                <div style={{ padding: '12px 16px', fontWeight: 800 }}>{m.min_level || m.reorder_level || 10} {m.unit}</div>
                <div style={{ padding: '12px 16px', color: G.red, fontWeight: 800 }}>Reorder Needed!</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // RENDER: Movements
  const renderMovements = () => {
    return (
      <div style={{ border: `3px solid ${G.sage}`, background: '#fff', animation: 'fadeUp 0.4s ease', overflow: 'hidden' }}>
        <div className="table-container" style={{ overflowX: 'auto', width: '100%' }}>
          <div style={{ minWidth: 1000 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 2fr 1fr 1.2fr 1.2fr 1fr 1.5fr', background: G.forest, color: '#fff', fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1 }}>
              <div style={{ padding: '12px 10px' }}>Date</div>
              <div style={{ padding: '12px 10px' }}>Type</div>
              <div style={{ padding: '12px 10px' }}>Drug</div>
              <div style={{ padding: '12px 10px' }}>Ref No</div>
              <div style={{ padding: '12px 10px' }}>Source</div>
              <div style={{ padding: '12px 10px' }}>Destination</div>
              <div style={{ padding: '12px 10px' }}>Qty</div>
              <div style={{ padding: '12px 10px' }}>Notes</div>
            </div>
            {movements.length === 0 ? <div style={{ padding: 40, textAlign: 'center', color: G.olive, fontWeight: 700 }}>No movements found.</div> : null}
            {movements.map((l, i) => (
              <div key={l.id || i} className="report-row" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 2fr 1fr 1.2fr 1.2fr 1fr 1.5fr', borderBottom: `1px solid ${G.light}`, fontSize: 12, color: G.darkGray, animation: `rowIn 0.3s ease forwards`, animationDelay: `${i*0.03}s`, opacity: 0 }}>
                <div style={{ padding: '12px 10px', fontWeight: 800 }}>{new Date(l.created_at || l.date).toLocaleDateString()}</div>
                <div style={{ padding: '12px 10px' }}>
                  <Badge text={l.type} type={l.type === 'RECEIPT' ? 'success' : l.type === 'ISSUE' ? 'warning' : 'info'} />
                </div>
                <div style={{ padding: '12px 10px', fontWeight: 800 }}>{l.drug_name || l.item_name}</div>
                <div style={{ padding: '12px 10px', color: G.olive }}>{l.reference_no || '-'}</div>
                <div style={{ padding: '12px 10px' }}>{l.source_location || '-'}</div>
                <div style={{ padding: '12px 10px' }}>{l.target_location || '-'}</div>
                <div style={{ padding: '12px 10px', fontWeight: 800, color: G.orange }}>{l.quantity || '-'}</div>
                <div style={{ padding: '12px 10px', fontSize: 11, fontStyle: 'italic' }}>{l.notes || '-'}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // RENDER: Audit Log (Using movements as a proxy for audit if dedicated log isn't separate)
  const renderAuditLog = () => {
    return (
      <div style={{ border: `3px solid ${G.sage}`, background: '#fff', animation: 'fadeUp 0.4s ease', overflow: 'hidden' }}>
        <div className="table-container" style={{ overflowX: 'auto', width: '100%' }}>
          <div style={{ minWidth: 900 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '0.8fr 1.2fr 1fr 2fr 1fr 1fr 1.5fr', background: G.dark, color: '#fff', fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1 }}>
              <div style={{ padding: '12px 10px' }}>Record ID</div>
              <div style={{ padding: '12px 10px' }}>Timestamp</div>
              <div style={{ padding: '12px 10px' }}>Action</div>
              <div style={{ padding: '12px 10px' }}>Item</div>
              <div style={{ padding: '12px 10px' }}>Qty Change</div>
              <div style={{ padding: '12px 10px' }}>User</div>
              <div style={{ padding: '12px 10px' }}>System Note</div>
            </div>
            {movements.length === 0 ? <div style={{ padding: 40, textAlign: 'center', color: G.olive, fontWeight: 700 }}>Log is empty.</div> : null}
            {movements.map((l, i) => (
              <div key={l.id || i} className="report-row" style={{ display: 'grid', gridTemplateColumns: '0.8fr 1.2fr 1fr 2fr 1fr 1fr 1.5fr', borderBottom: `1px solid ${G.light}`, fontSize: 12, color: G.darkGray, animation: `rowIn 0.3s ease forwards`, animationDelay: `${i*0.02}s`, opacity: 0 }}>
                <div style={{ padding: '12px 10px', fontWeight: 900, color: G.sage }}>#{l.id}</div>
                <div style={{ padding: '12px 10px' }}>{new Date(l.created_at || l.date).toLocaleString()}</div>
                <div style={{ padding: '12px 10px', fontWeight: 800, color: G.forest }}>{l.type}</div>
                <div style={{ padding: '12px 10px', fontWeight: 700 }}>{l.drug_name || l.item_name}</div>
                <div style={{ padding: '12px 10px', fontWeight: 800 }}>{l.type === 'ISSUE' ? `-${l.quantity}` : `+${l.quantity}`}</div>
                <div style={{ padding: '12px 10px' }}>{l.user || l.processed_by || 'System'}</div>
                <div style={{ padding: '12px 10px', fontSize: 11, color: G.olive }}>Ref: {l.reference_no}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) { NotifStore.push('Please allow popups to print reports.', 'error'); return; }

    const dt = new Date().toLocaleString();
    const th = (t) => `<th style="padding: 8px 10px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; border: 1px solid #aaa; background: #1B5E20; color: #fff;">${t}</th>`;
    const td = (t) => `<td style="padding: 7px 10px; border: 1px solid #ddd; font-size: 11px; word-break: break-word;">${t ?? '-'}</td>`;
    const fmt = (n) => parseFloat(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    let bodyHtml = '';

    if (activeTab === 'Current Stock') {
      const grouped = inventory.reduce((acc, m) => { const c = m.category || 'Uncategorized'; if (!acc[c]) acc[c] = []; acc[c].push(m); return acc; }, {});
      const grand = inventory.reduce((s, m) => s + (parseFloat(m.quantity || 0) * parseFloat(m.unit_price || 0)), 0);
      bodyHtml += `<p style="font-size:15px;font-weight:bold;margin:0 0 12px;color:#1B5E20">Grand Total Value: ETB ${fmt(grand)}</p>`;
      
      Object.entries(grouped).forEach(([cat, items]) => {
        const sub = items.reduce((s, m) => s + (parseFloat(m.quantity || 0) * parseFloat(m.unit_price || 0)), 0);
        bodyHtml += `<h3 style="background:#c8e6c9;padding:8px 12px;margin:20px 0 0;font-size:13px">${cat} — ETB ${fmt(sub)}</h3>`;
        bodyHtml += `<table style="width:100%;border-collapse:collapse;"><thead><tr>${th('Drug Name')}${th('Batch')}${th('Qty')}${th('Expiry')}${th('Unit')}${th('Unit Value')}${th('Total Value')}</tr></thead><tbody>`;
        items.forEach(m => { 
          const exp = m.expiry_date ? new Date(m.expiry_date).toLocaleDateString() : '-';
          bodyHtml += `<tr>${td(m.drug_name || m.name)}${td(m.batch_number)}${td(parseFloat(m.quantity||0).toLocaleString())}${td(exp)}${td(m.unit)}${td('ETB ' + fmt(m.unit_price))}${td('ETB ' + fmt((m.quantity||0)*(m.unit_price||0)))}</tr>`; 
        });
        bodyHtml += `</tbody></table>`;
      });
    } else if (activeTab === 'Issued Items') {
      const issues = movements.filter(m => m.type === 'ISSUE');
      bodyHtml += `<p style="font-weight:bold;margin:0 0 8px">Total Issued Records: ${issues.length}</p>`;
      bodyHtml += `<table style="width:100%;border-collapse:collapse;"><thead><tr>${th('Date & Time')}${th('Ref No')}${th('Drug')}${th('Qty')}${th('Department')}${th('Processed By')}</tr></thead><tbody>`;
      issues.forEach(l => { bodyHtml += `<tr>${td(new Date(l.created_at||l.date).toLocaleString())}${td(l.reference_no)}${td(l.drug_name||l.item_name)}${td(l.quantity)}${td(l.target_location||l.department)}${td(l.user||l.processed_by)}</tr>`; });
      bodyHtml += `</tbody></table>`;
    } else if (activeTab === 'Low Stock') {
      const low = inventory.filter(m => parseFloat(m.quantity || 0) <= parseFloat(m.min_level || m.reorder_level || 10));
      bodyHtml += `<p style="font-weight:bold;color:#c62828;margin:0 0 8px">⚠ ${low.length} item(s) need restocking</p>`;
      bodyHtml += `<table style="width:100%;border-collapse:collapse;"><thead><tr>${th('Drug Name')}${th('Category')}${th('Current Qty')}${th('Min Level')}${th('Status')}</tr></thead><tbody>`;
      low.forEach(m => { bodyHtml += `<tr>${td(m.drug_name || m.name)}${td(m.category)}${td(parseFloat(m.quantity||0).toLocaleString())}${td(m.min_level||m.reorder_level)}<td style="color:#c62828;font-weight:bold">Reorder Needed!</td></tr>`; });
      bodyHtml += `</tbody></table>`;
    } else if (activeTab === 'Movements' || activeTab === 'Audit Log') {
      bodyHtml += `<p style="font-weight:bold;margin:0 0 8px">Total Records: ${movements.length}</p>`;
      bodyHtml += `<table style="width:100%;border-collapse:collapse;"><thead><tr>${th('Date & Time')}${th('Type')}${th('Drug')}${th('Ref No')}${th('Source')}${th('Destination')}${th('Qty')}</tr></thead><tbody>`;
      movements.forEach(l => { bodyHtml += `<tr>${td(new Date(l.created_at||l.date).toLocaleString())}${td(l.type)}${td(l.drug_name||l.item_name)}${td(l.reference_no)}${td(l.source_location)}${td(l.target_location)}${td(l.quantity)}</tr>`; });
      bodyHtml += `</tbody></table>`;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>Pharmacy Store — ${activeTab} Report</title>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: Arial, sans-serif; font-size: 12px; color: #111; padding: 24px; }
            h1 { font-size: 20px; color: #1B5E20; text-transform: uppercase; border-bottom: 3px solid #228B22; padding-bottom: 8px; margin-bottom: 4px; }
            h3 { font-size: 13px; }
            .meta { display: flex; justify-content: space-between; font-size: 11px; color: #555; margin-bottom: 18px; padding-top: 4px; }
            tr:nth-child(even) td { background: #f0fdf4; }
            tr { page-break-inside: avoid; }
            @page { margin: 15mm; }
          </style>
        </head>
        <body>
          <h1>Pharmacy Store — ${activeTab} Report</h1>
          <div class="meta">
            <span>Generated: ${dt}</span>
            <span>Role: ${role}</span>
          </div>
          ${bodyHtml}
          <script>window.onload = function() { window.print(); };<\/script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div style={{ position: 'relative', minHeight: '100vh', width: '100%', background: G.forest, fontFamily: "'Inter',sans-serif", display: 'flex', flexDirection: 'column' }}>
      <GlobalStyles />
      <NotifToastContainer />
      
      {/* ── HEADER ── */}
      <div style={{ position: 'relative', zIndex: 1, width: '100%' }}>
        <div style={{ background: `linear-gradient(90deg, ${G.dark} 0%, ${G.forest} 100%)`, padding: '24px', borderBottom: `6px solid ${G.emerald}`, boxShadow: `0 8px 32px rgba(0,0,0,0.3)`, display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display:'flex', alignItems:'center', gap:14 }}>
            <span style={{ fontSize: 40, textShadow: '2px 2px 0 rgba(0,0,0,0.2)' }}>📊</span>
            <div>
              <h1 className="artistic-3d-title">Pharmacy Reports</h1>
              <p style={{ margin:'6px 0 0', color: G.mint, fontSize:14, fontWeight:600, letterSpacing:0.5 }}>Comprehensive stock, value, and accountability tracking</p>
            </div>
          </div>
          
          <button onClick={handlePrint} style={{ background: '#fff', color: G.dark, padding: '12px 24px', fontSize: 14, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1, border: 'none', borderRadius: 0, cursor: 'pointer', boxShadow: `4px 4px 0 ${G.sage}`, display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.2s', whiteSpace: 'nowrap' }}>
            🖨️ Print Report
          </button>
        </div>

        {/* ── ROLE SWITCHER (For testing Access Rules) ── */}
        <div style={{ background: G.darkGray, padding: '16px 24px', display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'center', color: '#fff', borderBottom: `4px solid ${G.dark}` }}>
          <div style={{ fontSize: 12, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1, color: G.sage }}>Testing Control Panel:</div>
          
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 700 }}>Current Role:</span>
            <select value={role} onChange={e => setRole(e.target.value)} style={{ padding: '6px 12px', border: 'none', borderRadius: 0, fontWeight: 800, cursor: 'pointer', outline: 'none', color: G.dark, background: '#fff' }}>
              {ROLES.map(r => <option key={r}>{r}</option>)}
            </select>
          </div>

          <div style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 600, color: G.lime, width: '100%', maxWidth: '300px', textAlign: 'right' }}>
            {role === 'Pharmacy Store Keeper' && 'Standard view, no financial values.'}
            {role === 'Supervisor' && `Standard view, operational oversight.`}
            {role === 'Finance' && 'Sees ALL categories AND internal values.'}
            {role === 'CEO' && 'Sees ALL categories AND internal values (Read-only).'}
          </div>
        </div>

        {/* ── MAIN CONTENT (100% WIDTH) ── */}
        <div style={{ padding: '24px', width: '100%', flex: 1, background: G.light }}>
          
          {/* TABS */}
          <div style={{ display: 'flex', width: '100%', marginBottom: 24, flexWrap: 'nowrap', overflowX: 'auto', background: '#fff', border: `3px solid ${G.sage}` }}>
            {TABS.map(t => (
              <button key={t} onClick={() => setActiveTab(t)} style={{
                flex: 1, minWidth: 140, padding: '14px 10px', fontSize: 13, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1, cursor: 'pointer',
                border: 'none', borderRadius: 0, transition: 'all 0.2s',
                background: activeTab === t ? G.forest : '#fff',
                color: activeTab === t ? '#fff' : G.darkGray,
                borderRight: `1px solid ${G.light}`,
                whiteSpace: 'nowrap'
              }}>
                {t}
              </button>
            ))}
          </div>

          {/* TAB CONTENT */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: 100, fontSize: 20, fontWeight: 900, color: G.forest }}>⏳ Loading {activeTab}...</div>
          ) : (
            <div id="report-print-area">
              {activeTab === 'Current Stock' && renderCurrentStock()}
              {activeTab === 'Issued Items'  && renderIssuedItems()}
              {activeTab === 'Low Stock'     && renderLowStock()}
              {activeTab === 'Movements'     && renderMovements()}
              {activeTab === 'Audit Log'     && renderAuditLog()}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default StoreReports;
