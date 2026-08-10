import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

/* ─── Color Palette & Constants ─────────────────────────────────────────── */
const G = {
  forest: '#228B22', dark: '#1B5E20', emerald: '#2E8B57', leaf: '#4CAF50',
  sage: '#A5D6A7', olive: '#6B8E23', lime: '#8BC34A', brown: '#8D6E63',
  sky: '#87CEEB', white: '#FFFFFF', light: '#F5F5F5', darkGray: '#424242',
  orange: '#FF9800', red: '#F44336', purple: '#7C3AED',
};

const DEPARTMENTS = ['Printing', 'Car Rental', 'AgriRent', 'Sales', 'Retail', 'IT', 'Maintenance'];
const ROLES = ['General Store Keeper', 'Supervisor', 'Finance', 'CEO'];
const TABS = ['Current Stock', 'Issued Items', 'Low Stock', 'Movements', 'Audit Log'];

const api = axios.create();
api.interceptors.request.use(cfg => {
  const t = localStorage.getItem('token') || sessionStorage.getItem('token');
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

/* ─── Shared UI & Animations ────────────────────────────────────────────── */
const GlobalStyles = () => (
  <style>{`
    :root {
      --color-primary: #2563EB;
      --color-primary-hover: #1D4ED8;
      --color-bg-page: #F5F6FA;
      --color-bg-card: #FFFFFF;
      --color-border: #E5E7EB;
      --color-text-primary: #111827;
      --color-text-secondary: #6B7280;
      --color-text-muted: #9CA3AF;
      --color-success: #16A34A;
      --color-warning: #D97706;
      --color-danger: #DC2626;
      --color-info: #0284C7;
    }

    @keyframes rowIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }

    /* Layout & Spacing */
    .report-wrapper {
      padding: 24px;
      font-family: 'Inter', 'Segoe UI', Roboto, sans-serif;
      color: var(--color-text-primary);
      background-color: var(--color-bg-page);
      min-height: 100vh;
    }
    @media (max-width: 1024px) { .report-wrapper { padding: 16px; } }
    @media (max-width: 768px) { .report-wrapper { padding: 12px; } }

    /* Cards */
    .card {
      background: var(--color-bg-card);
      border: 1px solid var(--color-border);
      border-radius: 10px;
      padding: 24px;
      margin-bottom: 24px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06);
      transition: transform 150ms ease, box-shadow 150ms ease;
    }
    .card:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.08);
    }

    /* Tables */
    .table-container {
      overflow-x: auto;
      min-width: 700px;
      margin: 0 -24px;
    }
    .css-table {
      display: flex;
      flex-direction: column;
      width: 100%;
    }
    .css-table-header {
      display: grid;
      background: #F9FAFB;
      color: var(--color-text-muted);
      font-size: 12px;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.03em;
      border-bottom: 1px solid var(--color-border);
      position: sticky;
      top: 0;
      z-index: 2;
    }
    .css-table-row {
      display: grid;
      align-items: center;
      min-height: 48px;
      font-size: 14px;
      border-bottom: 1px solid var(--color-border);
      transition: background-color 150ms ease;
      animation: rowIn 0.3s ease forwards;
    }
    .css-table-row:hover {
      background-color: #FEF3C7; /* Yellow hover as requested */
    }
    .css-table-row:last-child {
      border-bottom: none;
    }

    /* Buttons */
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      height: 36px;
      padding: 0 16px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 150ms ease-in-out;
      border: none;
    }
    .btn-primary {
      background: var(--color-primary);
      color: white;
    }
    .btn-primary:hover {
      background: var(--color-primary-hover);
    }

    /* Tabs */
    .tabs-container {
      display: flex;
      gap: 8px;
      margin-bottom: 24px;
      flex-wrap: nowrap;
      overflow-x: auto;
      scrollbar-width: none;
      scroll-snap-type: x mandatory;
    }
    .tabs-container::-webkit-scrollbar { display: none; }
    .tab-btn {
      padding: 0 16px;
      height: 36px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      border: 1px solid transparent;
      background: transparent;
      color: var(--color-text-secondary);
      transition: all 150ms ease;
      white-space: nowrap;
      scroll-snap-align: start;
    }
    .tab-btn:hover {
      background: #FEF3C7;
      color: var(--color-warning);
    }
    .tab-btn.active {
      background: #EFF6FF;
      color: var(--color-primary);
      border-color: rgba(37,99,235,0.2);
    }
    
    /* Segmented Spinner */
    .segmented-spinner {
      width: 40px;
      height: 40px;
      border: 4px solid var(--color-border);
      border-top-color: var(--color-primary);
      border-radius: 50%;
      border-style: dashed;
      animation: spin 1.2s linear infinite;
      margin: 40px auto;
    }
    @keyframes spin { 100% { transform: rotate(360deg); } }

    /* Page title */
    .page-title {
      font-size: 24px;
      font-weight: 600;
      color: var(--color-text-primary);
      margin: 0;
      line-height: 1.3;
    }

    /* Outline button (e.g. Print) */
    .btn-outline {
      background: #fff;
      color: var(--color-text-primary);
      border: 1px solid var(--color-border);
      border-radius: 8px;
      height: 36px;
      padding: 0 16px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      transition: all 150ms ease;
      white-space: nowrap;
    }
    .btn-outline:hover {
      background: #FEF3C7;
      border-color: var(--color-warning);
      color: var(--color-warning);
    }

    /* Form select */
    .form-select {
      height: 36px;
      padding: 0 12px;
      border: 1px solid var(--color-border);
      border-radius: 8px;
      font-size: 14px;
      color: var(--color-text-primary);
      background: #fff;
      cursor: pointer;
      outline: none;
      transition: border-color 150ms ease, box-shadow 150ms ease;
    }
    .form-select:focus {
      border-color: var(--color-primary);
      box-shadow: 0 0 0 3px rgba(37,99,235,0.1);
    }

    /* Control Panel */
    .control-panel {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 16px;
    }

  `}</style>
);

const DecorPlants = () => (
  <>
    <GlobalStyles />
    {[
      { e:'🍃', sz:55, op:0.22, top:'1%',    left:'0.5%'  },
      { e:'🌿', sz:48, op:0.18, top:'0%',    right:'0.5%' },
      { e:'🌾', sz:52, op:0.20, bottom:'1%', left:'0.5%'  },
      { e:'🍃', sz:50, op:0.18, bottom:'0%', right:'0.5%' },
    ].map((p,i) => (
      <span key={i} style={{ position:'fixed', fontSize: p.sz, opacity: p.op, top: p.top, left: p.left, right: p.right, bottom: p.bottom, pointerEvents:'none', userSelect:'none', animation:`floatLeaf ${9+i*1.5}s ease-in-out infinite`, animationDelay:`${i*1.2}s`, zIndex:0 }}>{p.e}</span>
    ))}
  </>
);

const DeptBadge = ({ dept }) => {
  const colors = { Printing: G.forest, 'Car Rental': G.sky, AgriRent: G.lime, Sales: G.orange, Retail: G.purple, IT: G.emerald, Maintenance: G.brown };
  const c = colors[dept] || G.olive;
  return <span style={{ background: c, color: '#fff', padding: '4px 10px', borderRadius: 0, fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 0.5 }}>{dept}</span>;
};

const StoreReports = () => {
  const [role, setRole] = useState('General Store Keeper');
  const [deptContext, setDeptContext] = useState('Printing');
  const [activeTab, setActiveTab] = useState(TABS[0]);

  // Data states
  const [materials, setMaterials] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  // Computed Access Rules
  const canViewValues = role === 'Finance' || role === 'CEO';
  const filteredDept = role === 'Supervisor' ? deptContext : ''; // Supervisor sees only their own dept

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch Materials
      const matParams = {};
      if (filteredDept) matParams.department = filteredDept;
      const rMat = await api.get('/api/v1/printing-assets/store/materials', { params: matParams });
      setMaterials(rMat.data.data || []);

      // 2. Fetch Logs
      const logParams = {};
      if (filteredDept) logParams.department = filteredDept;
      const rLog = await api.get('/api/v1/printing-assets/log', { params: logParams });
      setLogs(rLog.data.data || []);
      
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, [filteredDept]);

  useEffect(() => { loadData(); }, [loadData]);

  // View Renders
  const renderCurrentStock = () => {
    const grouped = materials.reduce((acc, m) => {
      const d = m.department || 'Unknown';
      if (!acc[d]) acc[d] = { items: [], count: 0, totalValue: 0 };
      acc[d].items.push(m);
      acc[d].count += parseFloat(m.quantity_in_store || 0);
      acc[d].totalValue += parseFloat(m.total_value || 0);
      return acc;
    }, {});

    const grandTotalValue = materials.reduce((sum, m) => sum + parseFloat(m.total_value || 0), 0);

    return (
      <div>
        {canViewValues && !filteredDept && (
          <div className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--color-bg-card)", borderLeft: "4px solid var(--color-primary)" }}>
            <div style={{ fontSize: 14, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, color: "var(--color-text-secondary)" }}>Grand Total Value (All Departments)</div>
            <div style={{ fontSize: 28, fontWeight: 900 }}>ETB {grandTotalValue.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</div>
          </div>
        )}

        {Object.entries(grouped).map(([d, g]) => (
          <div key={d} className="card">
            <div className="card-header">
              <div style={{ fontSize: 18, fontWeight: 900, color: "var(--color-text-primary)", textTransform: 'uppercase' }}>{d} Department</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: "var(--color-text-primary)" }}>
                Total Items: {g.count.toLocaleString()}
                {canViewValues && ` | Value: ETB ${g.totalValue.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}`}
              </div>
            </div>
            
            <div className="table-container"><div className="css-table"><div className="css-table-header" style={{ gridTemplateColumns: canViewValues ? "2fr 1fr 1fr 1fr 1fr 1fr" : "3fr 1fr 1fr 1fr" }}>
              <div style={{ padding: '12px 16px' }}>Item Name</div>
              <div style={{ padding: '12px 16px' }}>Category</div>
              <div style={{ padding: '12px 16px' }}>Quantity</div>
              <div style={{ padding: '12px 16px' }}>Unit</div>
              {canViewValues && <div style={{ padding: '12px 16px' }}>Unit Value</div>}
              {canViewValues && <div style={{ padding: '12px 16px' }}>Total Value</div>}
            </div>

            {g.items.map((m, i) => (
              <div key={m.id} className="css-table-row" style={{ gridTemplateColumns: canViewValues ? '2fr 1fr 1fr 1fr 1fr 1fr' : '3fr 1fr 1fr 1fr' }}>
                <div style={{ padding: '12px 16px', fontWeight: 800 }}>{m.material_name}</div>
                <div style={{ padding: '12px 16px' }}>{m.category}</div>
                <div style={{ padding: '12px 16px', fontWeight: 800, color: "var(--color-success)" }}>{parseFloat(m.quantity_in_store).toLocaleString()}</div>
                <div style={{ padding: '12px 16px' }}>{m.unit}</div>
                {canViewValues && <div style={{ padding: '12px 16px' }}>{parseFloat(m.unit_value).toLocaleString()}</div>}
                {canViewValues && <div style={{ padding: '12px 16px', fontWeight: 800 }}>{parseFloat(m.total_value).toLocaleString()}</div>}
              </div>
            ))}
            </div>
          </div>
          </div>
        ))}
      </div>
    );
  };

  const renderIssuedItems = () => {
    const issues = logs.filter(l => l.action_type === 'Issue to Department');
    return (
      <div className="card">
        <div className="table-container"><div className="css-table">
        <div className="css-table-header" style={{ gridTemplateColumns: '1.5fr 1fr 1fr 1fr 1fr 1.5fr' }}>
          <div style={{ padding: '12px 16px' }}>Date</div>
          <div style={{ padding: '12px 16px' }}>Item ID</div>
          <div style={{ padding: '12px 16px' }}>Quantity</div>
          <div style={{ padding: '12px 16px' }}>Department</div>
          <div style={{ padding: '12px 16px' }}>Issued By</div>
          <div style={{ padding: '12px 16px' }}>Notes (Req/Job)</div>
        </div>
        {issues.length === 0 ? <div style={{ padding: 40, textAlign: 'center', color: "var(--color-text-muted)", fontWeight: 700 }}>No items issued yet.</div> : null}
        {issues.map((l, i) => (
          <div key={l.id} className="css-table-row" style={{ gridTemplateColumns: '1.5fr 1fr 1fr 1fr 1fr 1.5fr' }}>
            <div style={{ padding: '12px 16px', fontWeight: 800 }}>{new Date(l.date_time).toLocaleString()}</div>
            <div style={{ padding: '12px 16px' }}>{l.item_id}</div>
            <div style={{ padding: '12px 16px', fontWeight: 800, color: "var(--color-warning)" }}>{l.quantity}</div>
            <div style={{ padding: '12px 16px' }}><DeptBadge dept={l.department} /></div>
            <div style={{ padding: '12px 16px' }}>{l.moved_by}</div>
            <div style={{ padding: '12px 16px', fontSize: 11 }}>{l.notes}</div>
          </div>
        ))}
        </div>
        </div>
      </div>
    );
  };

  const renderLowStock = () => {
    const low = materials.filter(m => parseFloat(m.quantity_in_store) <= parseFloat(m.reorder_level || 10));
    return (
      <div className="card">
        <div className="table-container"><div className="css-table">
        <div className="css-table-header" style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr' }}>
          <div style={{ padding: '12px 16px' }}>Item Name</div>
          <div style={{ padding: '12px 16px' }}>Department</div>
          <div style={{ padding: '12px 16px' }}>Current Qty</div>
          <div style={{ padding: '12px 16px' }}>Reorder Level</div>
          <div style={{ padding: '12px 16px' }}>Status</div>
        </div>
        {low.length === 0 ? <div style={{ padding: 40, textAlign: 'center', color: "var(--color-text-muted)", fontWeight: 700 }}>No items are low on stock.</div> : null}
        {low.map((m, i) => (
          <div key={m.id} className="css-table-row" style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr' }}>
            <div style={{ padding: '12px 16px', fontWeight: 800 }}>{m.material_name}</div>
            <div style={{ padding: '12px 16px' }}><DeptBadge dept={m.department} /></div>
            <div style={{ padding: '12px 16px', fontWeight: 900, color: "var(--color-danger)" }}>{parseFloat(m.quantity_in_store).toLocaleString()} {m.unit}</div>
            <div style={{ padding: '12px 16px', fontWeight: 800 }}>{m.reorder_level} {m.unit}</div>
            <div style={{ padding: '12px 16px', color: "var(--color-danger)", fontWeight: 800 }}>Reorder Needed!</div>
          </div>
        ))}
        </div>
        </div>
      </div>
    );
  };

  const renderMovements = () => {
    // Include both 'Issue' and other physical movements
    const moves = logs.filter(l => ['Move to Production','Consume','Return to Store', 'Issue to Department'].includes(l.action_type));
    return (
      <div className="card">
        <div className="table-container"><div className="css-table">
        <div className="css-table-header" style={{ gridTemplateColumns: '1.2fr 1fr 1fr 1.2fr 1.2fr 1.2fr 1.2fr 0.8fr 1fr 1fr 1.5fr' }}>
          <div style={{ padding: '12px 10px' }}>Date</div>
          <div style={{ padding: '12px 10px' }}>Type</div>
          <div style={{ padding: '12px 10px' }}>Item ID</div>
          <div style={{ padding: '12px 10px' }}>Action</div>
          <div style={{ padding: '12px 10px' }}>Dept</div>
          <div style={{ padding: '12px 10px' }}>From</div>
          <div style={{ padding: '12px 10px' }}>To</div>
          <div style={{ padding: '12px 10px' }}>Qty</div>
          <div style={{ padding: '12px 10px' }}>By</div>
          <div style={{ padding: '12px 10px' }}>Approved</div>
          <div style={{ padding: '12px 10px' }}>Notes</div>
        </div>
        {moves.length === 0 ? <div style={{ padding: 40, textAlign: 'center', color: "var(--color-text-muted)", fontWeight: 700 }}>No transfer movements found.</div> : null}
        {moves.map((l, i) => (
          <div key={l.id} className="css-table-row" style={{ gridTemplateColumns: '1.2fr 1fr 1fr 1.2fr 1.2fr 1.2fr 1.2fr 0.8fr 1fr 1fr 1.5fr' }}>
            <div style={{ padding: '12px 10px', fontWeight: 800 }}>{new Date(l.date_time).toLocaleDateString()}</div>
            <div style={{ padding: '12px 10px', fontWeight: 800 }}>{l.item_type}</div>
            <div style={{ padding: '12px 10px', fontWeight: 800 }}>{l.item_id}</div>
            <div style={{ padding: '12px 10px', fontWeight: 800, color: "var(--color-primary)" }}>{l.action_type}</div>
            <div style={{ padding: '12px 10px' }}><DeptBadge dept={l.department} /></div>
            <div style={{ padding: '12px 10px' }}>{l.from_location}</div>
            <div style={{ padding: '12px 10px' }}>{l.to_location}</div>
            <div style={{ padding: '12px 10px', fontWeight: 800, color: "var(--color-warning)" }}>{l.quantity || '-'}</div>
            <div style={{ padding: '12px 10px' }}>{l.moved_by}</div>
            <div style={{ padding: '12px 10px' }}>{l.approved_by || '-'}</div>
            <div style={{ padding: '12px 10px', fontSize: 10 }}>{l.notes}</div>
          </div>
        ))}
        </div>
        </div>
      </div>
    );
  };

  const renderAuditLog = () => {
    return (
      <div className="card">
        <div className="table-container"><div className="css-table">
        <div className="css-table-header" style={{ gridTemplateColumns: '0.5fr 1fr 1.5fr 1fr 1fr 0.5fr 1fr 1.5fr' }}>
          <div style={{ padding: '12px 10px' }}>Log ID</div>
          <div style={{ padding: '12px 10px' }}>Date / Time</div>
          <div style={{ padding: '12px 10px' }}>Action Type</div>
          <div style={{ padding: '12px 10px' }}>Item ID</div>
          <div style={{ padding: '12px 10px' }}>Department</div>
          <div style={{ padding: '12px 10px' }}>Qty</div>
          <div style={{ padding: '12px 10px' }}>User</div>
          <div style={{ padding: '12px 10px' }}>Notes (Immutable)</div>
        </div>
        {logs.length === 0 ? <div style={{ padding: 40, textAlign: 'center', color: "var(--color-text-muted)", fontWeight: 700 }}>Log is empty.</div> : null}
        {logs.map((l, i) => (
          <div key={l.id} className="css-table-row" style={{ gridTemplateColumns: '0.5fr 1fr 1.5fr 1fr 1fr 0.5fr 1fr 1.5fr' }}>
            <div style={{ padding: '12px 10px', fontWeight: 900, color: "var(--color-text-secondary)" }}>#{l.id}</div>
            <div style={{ padding: '12px 10px' }}>{new Date(l.date_time).toLocaleString()}</div>
            <div style={{ padding: '12px 10px', fontWeight: 800, color: "var(--color-success)" }}>{l.action_type}</div>
            <div style={{ padding: '12px 10px', fontWeight: 700 }}>{l.item_id}</div>
            <div style={{ padding: '12px 10px' }}><DeptBadge dept={l.department} /></div>
            <div style={{ padding: '12px 10px', fontWeight: 800 }}>{l.quantity || '-'}</div>
            <div style={{ padding: '12px 10px' }}>{l.moved_by}</div>
            <div style={{ padding: '12px 10px', fontSize: 10, fontStyle: 'italic' }}>{l.notes}</div>
          </div>
        ))}
        </div>
        </div>
      </div>
    );
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) { alert('Please allow popups to print reports.'); return; }

    const dt = new Date().toLocaleString();
    const th = (t) => `<th>${t}</th>`;
    const td = (t) => `<td>${t ?? '-'}</td>`;
    const fmt = (n) => parseFloat(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    let bodyHtml = '';

    if (activeTab === 'Current Stock') {
      const grouped = materials.reduce((acc, m) => { const d = m.department || 'Unknown'; if (!acc[d]) acc[d] = []; acc[d].push(m); return acc; }, {});
      const grand = materials.reduce((s, m) => s + parseFloat(m.total_value || 0), 0);
      if (canViewValues) bodyHtml += `<p style="font-size:15px;font-weight:bold;margin:0 0 12px;color:#1B5E20">Grand Total Value: ETB ${fmt(grand)}</p>`;
      Object.entries(grouped).forEach(([dept, items]) => {
        const sub = items.reduce((s, m) => s + parseFloat(m.total_value || 0), 0);
        bodyHtml += `<h3 style="background:#c8e6c9;padding:8px 12px;margin:20px 0 0;font-size:13px">${dept}${canViewValues ? ` — ETB ${fmt(sub)}` : ''}</h3>`;
        bodyHtml += `<table><thead><tr>${th('Item Name')}${th('Category')}${th('Qty')}${th('Unit')}${canViewValues ? th('Unit Value') + th('Total Value') : ''}</tr></thead><tbody>`;
        items.forEach(m => { bodyHtml += `<tr>${td(m.material_name)}${td(m.category)}${td(parseFloat(m.quantity_in_store).toLocaleString())}${td(m.unit)}${canViewValues ? td('ETB ' + fmt(m.unit_value)) + td('ETB ' + fmt(m.total_value)) : ''}</tr>`; });
        bodyHtml += `</tbody></table>`;
      });
    }

    else if (activeTab === 'Issued Items') {
      const issues = logs.filter(l => l.action_type === 'Issue to Department');
      bodyHtml += `<p style="font-weight:bold;margin:0 0 8px">Total Issued Records: ${issues.length}</p>`;
      bodyHtml += `<table><thead><tr>${th('Date & Time')}${th('Item ID')}${th('Qty')}${th('Department')}${th('Issued By')}${th('Notes')}</tr></thead><tbody>`;
      issues.forEach(l => { bodyHtml += `<tr>${td(new Date(l.date_time).toLocaleString())}${td(l.item_id)}${td(l.quantity)}${td(l.department)}${td(l.moved_by)}${td(l.notes)}</tr>`; });
      bodyHtml += `</tbody></table>`;
    }

    else if (activeTab === 'Low Stock') {
      const low = materials.filter(m => parseFloat(m.quantity_in_store) <= parseFloat(m.reorder_level || 10));
      bodyHtml += `<p style="font-weight:bold;color:#c62828;margin:0 0 8px">⚠ ${low.length} item(s) need restocking</p>`;
      bodyHtml += `<table><thead><tr>${th('Item Name')}${th('Department')}${th('Current Qty')}${th('Unit')}${th('Reorder Level')}${th('Status')}</tr></thead><tbody>`;
      low.forEach(m => { bodyHtml += `<tr>${td(m.material_name)}${td(m.department)}${td(parseFloat(m.quantity_in_store).toLocaleString())}${td(m.unit)}${td(m.reorder_level)}<td style="color:#c62828;font-weight:bold">Reorder Needed!</td></tr>`; });
      bodyHtml += `</tbody></table>`;
    }

    else if (activeTab === 'Movements') {
      const moves = logs.filter(l => ['Move to Production','Consume','Return to Store', 'Issue to Department'].includes(l.action_type));
      bodyHtml += `<p style="font-weight:bold;margin:0 0 8px">Total Movement Records: ${moves.length}</p>`;
      bodyHtml += `<table><thead><tr>${th('Date & Time')}${th('Type')}${th('Item ID')}${th('Action')}${th('Dept')}${th('From')}${th('To')}${th('Qty')}${th('By')}${th('Approved')}${th('Notes')}</tr></thead><tbody>`;
      moves.forEach(l => { bodyHtml += `<tr>${td(new Date(l.date_time).toLocaleString())}${td(l.item_type)}${td(l.item_id)}${td(l.action_type)}${td(l.department)}${td(l.from_location)}${td(l.to_location)}${td(l.quantity)}${td(l.moved_by)}${td(l.approved_by)}${td(l.notes)}</tr>`; });
      bodyHtml += `</tbody></table>`;
    }

    else if (activeTab === 'Audit Log') {
      bodyHtml += `<p style="font-weight:bold;margin:0 0 8px">Total Audit Entries: ${logs.length}</p>`;
      bodyHtml += `<table><thead><tr>${th('#')}${th('Date & Time')}${th('Action Type')}${th('Item Type')}${th('Item ID')}${th('Qty')}${th('Department')}${th('Performed By')}${th('Approved By')}${th('Notes')}</tr></thead><tbody>`;
      logs.forEach(l => { bodyHtml += `<tr>${td(l.id)}${td(new Date(l.date_time).toLocaleString())}${td(l.action_type)}${td(l.item_type)}${td(l.item_id)}${td(l.quantity)}${td(l.department)}${td(l.moved_by)}${td(l.approved_by)}${td(l.notes)}</tr>`; });
      bodyHtml += `</tbody></table>`;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>General Store — ${activeTab} Report</title>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: Arial, sans-serif; font-size: 12px; color: #111; padding: 24px; }
            h1 { font-size: 20px; color: #111827; text-transform: uppercase; border-bottom: 1px solid #E5E7EB; padding-bottom: 8px; margin-bottom: 4px; }
            h3 { font-size: 13px; }
            .meta { display: flex; justify-content: space-between; font-size: 11px; color: #555; margin-bottom: 18px; padding-top: 4px; }
            table { width: 100%; border-collapse: collapse; margin-top: 4px; page-break-inside: auto; }
            thead { background: #F9FAFB; color: #6B7280; }
            th { padding: 8px 10px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; border: 1px solid #aaa; }
            td { padding: 7px 10px; border: 1px solid #ddd; font-size: 11px; word-break: break-word; }
            tr:nth-child(even) td { background: #F9FAFB; }
            tr { page-break-inside: avoid; }
            @page { margin: 15mm; }
          </style>
        </head>
        <body>
          <h1>General Store — ${activeTab} Report</h1>
          <div class="meta">
            <span>Generated: ${dt}</span>
            <span>Role: ${role}${role === 'Supervisor' ? ` (${deptContext})` : ''}</span>
          </div>
          ${bodyHtml}
          <script>window.onload = function() { window.print(); };<\/script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="report-wrapper"><GlobalStyles />
      
      {/* ── HEADER ── */}
      <div className="card">
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:14 }}>
            <span style={{ fontSize: 40 }}>📊</span>
            <div>
              <h2 className="page-title">Reports & Audit Log</h2>
              <p style={{ color: "var(--color-text-secondary)", fontSize:14 }}>Comprehensive stock, value, and accountability tracking</p>
            </div>
          </div>
          
          <button onClick={handlePrint} className="btn btn-outline">
            🖨️ Print Report
          </button>
        </div>
      </div>

      {/* ── ROLE SWITCHER (For testing Access Rules) ── */}
      <div className="card" style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center' }}>
        <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, color: "var(--color-text-secondary)" }}>Testing Panel:</div>
        
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 13, fontWeight: 500 }}>Role:</span>
          <select value={role} onChange={e => setRole(e.target.value)} className="form-select">
            {ROLES.map(r => <option key={r}>{r}</option>)}
          </select>
        </div>

        {role === 'Supervisor' && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 500 }}>Department:</span>
            <select value={deptContext} onChange={e => setDeptContext(e.target.value)} className="form-select">
              {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
            </select>
          </div>
        )}

        <div style={{ marginLeft: 'auto', fontSize: 13, color: "var(--color-text-muted)" }}>
          {role === 'General Store Keeper' && 'Sees all departments, no values.'}
          {role === 'Supervisor' && `Sees ONLY ${deptContext} department, no values.`}
          {role === 'Finance' && 'Sees ALL departments AND internal values.'}
          {role === 'CEO' && 'Sees ALL departments AND internal values (Read-only).'}
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div className="tabs-container">
        {TABS.map(t => (
          <button key={t} onClick={() => setActiveTab(t)} className={`tab-btn ${activeTab === t ? "active" : ""}`}>
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="segmented-spinner"></div>
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
  );
};

export default StoreReports;
