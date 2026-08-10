import React, { useState, useEffect, useCallback } from 'react';
import { Activity, Cpu, Package, AlertTriangle, Calendar, RefreshCw } from 'lucide-react';
import authService from '../../services/authService';
import apiClient from '../../services/apiClient';
import SegmentedSpinner from '../../components/ui/SegmentedSpinner';

// ─── CSS ─────────────────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
  @keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
  @keyframes spin   { to{transform:rotate(360deg)} }
  .pr-page  { padding:24px; background:#f1f5f9; min-height:100vh; font-family:'Inter',sans-serif; }
  .pr-card  { background:white; border-radius:10px; border:1px solid #e2e8f0; margin-bottom:20px; animation:fadeUp .35s ease both; overflow:hidden; }
  .pr-card-head { display:flex; align-items:center; gap:10px; padding:14px 20px; border-bottom:1px solid #e2e8f0; background:#f8fafc; }
  .pr-card-head h2 { margin:0; font-size:14px; font-weight:800; text-transform:uppercase; letter-spacing:.06em; color:#0f172a; }
  .pr-tbl  { width:100%; border-collapse:collapse; font-size:13px; }
  .pr-th   { text-align:left; padding:10px 14px; background:#f1f5f9; border-bottom:2px solid #e2e8f0; font-weight:800; font-size:11px; text-transform:uppercase; letter-spacing:.06em; color:#475569; }
  .pr-td   { padding:11px 14px; border-bottom:1px solid #f1f5f9; color:#1e293b; font-weight:500; vertical-align:middle; }
  .pr-tr:hover .pr-td { background:#f8fafc; }
  .pr-badge { padding:3px 10px; border-radius:99px; font-size:11px; font-weight:700; display:inline-flex; align-items:center; white-space:nowrap; }
  .b-green  { background:#dcfce7; color:#166534; }
  .b-blue   { background:#dbeafe; color:#1d4ed8; }
  .b-yellow { background:#fef9c3; color:#854d0e; }
  .b-red    { background:#fee2e2; color:#991b1b; }
  .b-gray   { background:#f1f5f9; color:#475569; }
  .pr-kpi-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:14px; margin-bottom:20px; }
  .pr-kpi  { background:white; border-radius:10px; border:1px solid #e2e8f0; padding:18px 20px; display:flex; align-items:center; gap:14px; }
  .pr-kpi-icon { width:44px; height:44px; border-radius:10px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
  .pr-kpi-val  { font-size:26px; font-weight:900; color:#0f172a; }
  .pr-kpi-lbl  { font-size:12px; font-weight:600; color:#64748b; }
  .pr-empty    { padding:40px; text-align:center; color:#94a3b8; font-size:14px; }
  .pr-err      { padding:14px 20px; background:#fef2f2; border-left:4px solid #ef4444; color:#991b1b; font-size:13px; font-weight:600; }
  .pr-spinner  { animation:spin 1s linear infinite; }
  .pr-no-access { display:flex; align-items:center; justify-content:center; padding:80px 20px; color:#94a3b8; flex-direction:column; gap:10px; }
  .pr-restricted { padding:10px 16px; background:#fef9c3; border-left:4px solid #f59e0b; color:#92400e; font-size:12px; font-weight:600; }
`;

// ─── helpers ──────────────────────────────────────────────────────────────────
const TODAY = new Date().toISOString().split('T')[0];

const statusColor = (s = '') => {
  if (!s) return 'b-gray';
  const sl = s.toLowerCase();
  if (sl.includes('complet') || sl.includes('active') || sl.includes('functional') || sl.includes('paid')) return 'b-green';
  if (sl.includes('print') || sl.includes('progress') || sl.includes('moved') || sl.includes('functional')) return 'b-blue';
  if (sl.includes('pend') || sl.includes('idle') || sl.includes('design') || sl.includes('prepress') || sl.includes('finishing')) return 'b-yellow';
  if (sl.includes('cancel') || sl.includes('maint') || sl.includes('returned')) return 'b-red';
  return 'b-gray';
};

const Badge = ({ text }) => <span className={`pr-badge ${statusColor(text)}`}>{text || '—'}</span>;

const KpiCard = ({ label, value, icon: Icon, color, bg }) => (
  <div className="pr-kpi">
    <div className="pr-kpi-icon" style={{ background: bg }}>
      <Icon size={22} color={color} />
    </div>
    <div>
      <div className="pr-kpi-val">{value}</div>
      <div className="pr-kpi-lbl">{label}</div>
    </div>
  </div>
);

const SummaryBox = ({ label, value, color, bg }) => (
  <div style={{ background: bg, borderRadius: 8, padding: '14px 28px', textAlign: 'center', minWidth: 110 }}>
    <div style={{ fontSize: 28, fontWeight: 900, color }}>{value}</div>
    <div style={{ fontSize: 12, fontWeight: 700, color }}>{label}</div>
  </div>
);

// ─── component ────────────────────────────────────────────────────────────────
export default function PrintingDailyProductionReport() {
  const user  = authService.getCurrentUser();
  const roles = (user?.roles || []).map(r => r.toLowerCase());
  const isCEO        = roles.includes('ceo') || roles.includes('admin');
  const isSupervisor = roles.includes('printing supervisor') || roles.includes('printing manager') || roles.includes('supervisor');
  const isFinance    = roles.includes('finance') || roles.includes('finance manager');
  const canView      = isCEO || isSupervisor || isFinance;
  const summaryOnly  = isCEO || isFinance;   // CEO & Finance see totals only

  const [date,     setDate]     = useState(TODAY);
  const [orders,   setOrders]   = useState([]);
  const [machines, setMachines] = useState([]);
  const [materials,setMaterials]= useState([]);
  const [loading,  setLoading]  = useState(false);
  const [errors,   setErrors]   = useState({});

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setErrors({});
    const errs = {};

    // 1. Orders — filter by due_date client-side (backend returns all; we filter)
    try {
      const res = await apiClient.get('/printing/orders', { params: { limit: 500 } });
      const all = Array.isArray(res) ? res : (res?.data ?? res?.orders ?? []);
      // Keep orders whose due_date OR completed_at matches selected date
      const filtered = all.filter(o => {
        const due  = o.due_date  ? String(o.due_date).slice(0, 10)  : null;
        const done = o.completed_at ? String(o.completed_at).slice(0, 10) : null;
        return due === date || done === date;
      });
      setOrders(filtered);
    } catch (e) {
      errs.orders = e.message || 'Failed to load orders';
      setOrders([]);
    }

    // 2. Production Machines
    try {
      const res = await apiClient.get('/printing-assets/production/machines');
      setMachines(Array.isArray(res) ? res : (res?.data ?? []));
    } catch (e) {
      errs.machines = e.message || 'Failed to load production machines';
      setMachines([]);
    }

    // 3. Production Materials
    try {
      const res = await apiClient.get('/printing-assets/production/materials');
      setMaterials(Array.isArray(res) ? res : (res?.data ?? []));
    } catch (e) {
      errs.materials = e.message || 'Failed to load production materials';
      setMaterials([]);
    }

    setErrors(errs);
    setLoading(false);
  }, [date]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ─── Access Denied ─────────────────────────────────────────────────────────
  if (!canView) {
    return (
      <div className="pr-page">
        <style>{CSS}</style>
        <div className="pr-card">
          <div className="pr-no-access">
            <AlertTriangle size={40} color="#f59e0b" />
            <span style={{ fontWeight: 700, fontSize: 16 }}>Access Denied</span>
            <span>Daily Production Report is not available for your role.</span>
          </div>
        </div>
      </div>
    );
  }

  // ─── Aggregate KPIs ────────────────────────────────────────────────────────
  const completedToday  = orders.filter(o => String(o.completed_at || '').slice(0, 10) === date).length;
  const activeMachines  = machines.filter(m => (m.status || '').toLowerCase().includes('active') || (m.status || '').toLowerCase().includes('functional')).length;
  const totalConsumed   = materials.reduce((s, m) => s + (parseFloat(m.quantity_consumed) || 0), 0);
  const totalRemaining  = materials.reduce((s, m) => s + (parseFloat(m.quantity_remaining) || 0), 0);

  return (
    <div className="pr-page">
      <style>{CSS}</style>

      {/* ── Header ── */}
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 900, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Activity size={26} color="#0ea5e9" /> Daily Production Report
          </h1>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 13 }}>
            SUTANA PRINTING SYSTEM • Production Floor Operations
            {summaryOnly && (
              <span style={{ marginLeft: 10, background: '#fef3c7', color: '#92400e', padding: '2px 10px', borderRadius: 99, fontWeight: 700, fontSize: 11 }}>
                READ-ONLY SUMMARY
              </span>
            )}
            {isSupervisor && !summaryOnly && (
              <span style={{ marginLeft: 10, background: '#dcfce7', color: '#166534', padding: '2px 10px', borderRadius: 99, fontWeight: 700, fontSize: 11 }}>
                FULL ACCESS
              </span>
            )}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Calendar size={16} color="#64748b" />
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            disabled={loading || summaryOnly}
            style={{ padding: '7px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13, color: '#475569', cursor: summaryOnly ? 'not-allowed' : 'auto' }}
          />
          <button
            onClick={fetchAll}
            disabled={loading}
            style={{ padding: '7px 14px', background: '#0ea5e9', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}
          >
            <SegmentedSpinner size={14} />
            {loading ? 'Loading…' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* ── KPI Strip ── */}
      <div className="pr-kpi-grid">
        <KpiCard label="Orders for Date"   value={loading ? '…' : orders.length}     icon={Package}      color="#0ea5e9" bg="#e0f2fe" />
        <KpiCard label="Completed Today"   value={loading ? '…' : completedToday}    icon={Activity}     color="#10b981" bg="#dcfce7" />
        <KpiCard label="Active Machines"   value={loading ? '…' : activeMachines}    icon={Cpu}          color="#8b5cf6" bg="#ede9fe" />
        <KpiCard label="Total Mat. Consumed" value={loading ? '…' : totalConsumed.toFixed(2)} icon={Package} color="#f59e0b" bg="#fef3c7" />
      </div>

      {/* ── SECTION 1: Orders due / completed on selected date ── */}
      <div className="pr-card">
        <div className="pr-card-head">
          <Package size={18} color="#0ea5e9" />
          <h2>Orders Due / Completed — {date}</h2>
        </div>

        {errors.orders && <div className="pr-err">⚠ {errors.orders}</div>}

        {summaryOnly ? (
          /* CEO & Finance: totals only */
          <div style={{ display: 'flex', gap: 24, padding: 20, flexWrap: 'wrap' }}>
            <SummaryBox label="Total Orders"     value={orders.length}     color="#1d4ed8" bg="#dbeafe" />
            <SummaryBox label="Completed Today"  value={completedToday}    color="#166534" bg="#dcfce7" />
            <SummaryBox label="Still in Progress" value={orders.length - completedToday} color="#854d0e" bg="#fef9c3" />
          </div>
        ) : (
          /* Supervisor: full table */
          !errors.orders && (
            orders.length === 0 ? (
              <div className="pr-empty">{loading ? 'Loading orders…' : `No orders due or completed on ${date}.`}</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="pr-tbl">
                  <thead>
                    <tr>
                      {['Order No.', 'Product Type', 'Quantity', 'Status', 'Due Date', 'Completed At'].map(h => (
                        <th key={h} className="pr-th">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((o, i) => (
                      <tr key={o.id ?? o.order_number ?? i} className="pr-tr">
                        <td className="pr-td" style={{ fontWeight: 700 }}>{o.order_number || o.id}</td>
                        <td className="pr-td">{o.product_type || o.productType || '—'}</td>
                        <td className="pr-td">{(o.quantity || 0).toLocaleString()}</td>
                        <td className="pr-td"><Badge text={o.status_id || o.status} /></td>
                        <td className="pr-td">{o.due_date ? String(o.due_date).slice(0, 10) : '—'}</td>
                        <td className="pr-td">{o.completed_at ? String(o.completed_at).slice(0, 10) : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )
        )}
      </div>

      {/* ── SECTION 2: Production Floor Machines ── */}
      <div className="pr-card">
        <div className="pr-card-head">
          <Cpu size={18} color="#8b5cf6" />
          <h2>Production Floor Machines</h2>
        </div>

        {errors.machines && <div className="pr-err">⚠ {errors.machines}</div>}

        {summaryOnly ? (
          /* CEO & Finance: status counts only */
          <div style={{ display: 'flex', gap: 24, padding: 20, flexWrap: 'wrap' }}>
            {[
              ['Active / Functional',  machines.filter(m => (m.status || '').toLowerCase().includes('active') || (m.status || '').toLowerCase().includes('functional')).length,  '#166534', '#dcfce7'],
              ['Idle in Production',   machines.filter(m => (m.status || '').toLowerCase().includes('idle')).length,    '#854d0e', '#fef9c3'],
              ['Returned to Store',    machines.filter(m => (m.status || '').toLowerCase().includes('returned')).length, '#475569', '#f1f5f9'],
            ].map(([label, count, color, bg]) => (
              <SummaryBox key={label} label={label} value={loading ? '…' : count} color={color} bg={bg} />
            ))}
          </div>
        ) : (
          /* Supervisor: full table */
          !errors.machines && (
            machines.length === 0 ? (
              <div className="pr-empty">{loading ? 'Loading machines…' : 'No production machines found.'}</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="pr-tbl">
                  <thead>
                    <tr>
                      {['Machine ID', 'Machine Name', 'Status', 'Moved Date', 'Approved By', 'Job Reference'].map(h => (
                        <th key={h} className="pr-th">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {machines.map((m, i) => (
                      <tr key={m.id ?? m.machine_id ?? i} className="pr-tr">
                        <td className="pr-td" style={{ fontWeight: 700 }}>{m.machine_id || '—'}</td>
                        <td className="pr-td">{m.machine_name || '—'}</td>
                        <td className="pr-td"><Badge text={m.status} /></td>
                        <td className="pr-td">{m.moved_date ? String(m.moved_date).slice(0, 10) : '—'}</td>
                        <td className="pr-td">{m.approved_by || '—'}</td>
                        <td className="pr-td">{m.job_reference || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )
        )}
      </div>

      {/* ── SECTION 3: Production Materials on Floor ── */}
      <div className="pr-card">
        <div className="pr-card-head">
          <Package size={18} color="#f59e0b" />
          <h2>Materials on Production Floor</h2>
        </div>

        {errors.materials && <div className="pr-err">⚠ {errors.materials}</div>}

        {summaryOnly ? (
          /* CEO & Finance: aggregate totals only */
          <div style={{ display: 'flex', gap: 24, padding: 20, flexWrap: 'wrap' }}>
            <SummaryBox label="Total Moved"     value={loading ? '…' : materials.reduce((s, m) => s + (parseFloat(m.quantity_moved)    || 0), 0).toFixed(2)} color="#1d4ed8" bg="#dbeafe" />
            <SummaryBox label="Total Consumed"  value={loading ? '…' : totalConsumed.toFixed(2)}    color="#166534" bg="#dcfce7" />
            <SummaryBox label="Total Remaining" value={loading ? '…' : totalRemaining.toFixed(2)} color="#854d0e" bg="#fef9c3" />
          </div>
        ) : (
          /* Supervisor: full table */
          !errors.materials && (
            materials.length === 0 ? (
              <div className="pr-empty">{loading ? 'Loading materials…' : 'No production materials found.'}</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="pr-tbl">
                  <thead>
                    <tr>
                      {['Material ID', 'Material Name', 'Unit', 'Qty Moved', 'Qty Consumed', 'Qty Remaining', 'Moved Date', 'Approved By'].map(h => (
                        <th key={h} className="pr-th">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {materials.map((m, i) => {
                      const remaining = parseFloat(m.quantity_remaining) || 0;
                      const reorderLevel = parseFloat(m.reorder_level) || 0;
                      const isLow = reorderLevel > 0 && remaining <= reorderLevel;
                      return (
                        <tr key={m.id ?? m.material_id ?? i} className="pr-tr">
                          <td className="pr-td" style={{ fontWeight: 700 }}>{m.material_id || '—'}</td>
                          <td className="pr-td">{m.material_name || '—'}</td>
                          <td className="pr-td">{m.unit || '—'}</td>
                          <td className="pr-td">{(parseFloat(m.quantity_moved) || 0).toFixed(2)}</td>
                          <td className="pr-td" style={{ color: '#dc2626', fontWeight: 700 }}>
                            {(parseFloat(m.quantity_consumed) || 0).toFixed(2)}
                          </td>
                          <td className="pr-td">
                            <span style={{ color: isLow ? '#dc2626' : '#16a34a', fontWeight: 700 }}>
                              {remaining.toFixed(2)}
                              {isLow && <span style={{ marginLeft: 6, background: '#fee2e2', color: '#991b1b', borderRadius: 99, padding: '1px 7px', fontSize: 10, fontWeight: 800 }}>LOW</span>}
                            </span>
                          </td>
                          <td className="pr-td">{m.moved_date ? String(m.moved_date).slice(0, 10) : '—'}</td>
                          <td className="pr-td">{m.approved_by || '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr style={{ background: '#f8fafc' }}>
                      <td className="pr-td" colSpan={3} style={{ fontWeight: 800, textAlign: 'right' }}>TOTALS</td>
                      <td className="pr-td" style={{ fontWeight: 800 }}>
                        {materials.reduce((s, m) => s + (parseFloat(m.quantity_moved) || 0), 0).toFixed(2)}
                      </td>
                      <td className="pr-td" style={{ fontWeight: 800, color: '#dc2626' }}>
                        {totalConsumed.toFixed(2)}
                      </td>
                      <td className="pr-td" style={{ fontWeight: 800, color: '#16a34a' }}>
                        {totalRemaining.toFixed(2)}
                      </td>
                      <td className="pr-td" colSpan={2}></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )
          )
        )}
      </div>
    </div>
  );
}
