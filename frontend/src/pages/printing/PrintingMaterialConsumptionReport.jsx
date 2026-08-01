import React, { useState, useEffect, useCallback } from 'react';
import { Layers, Package, AlertTriangle, TrendingDown, RefreshCw } from 'lucide-react';
import authService from '../../services/authService';
import apiClient from '../../services/apiClient';

// ─── CSS ─────────────────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
  @keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
  @keyframes spin   { to{transform:rotate(360deg)} }
  .pr-page { padding:24px; background:#f1f5f9; min-height:100vh; font-family:'Inter',sans-serif; }
  .pr-card { background:white; border-radius:10px; border:1px solid #e2e8f0; margin-bottom:20px; animation:fadeUp .35s ease both; overflow:hidden; }
  .pr-card-head { display:flex; align-items:center; gap:10px; padding:14px 20px; border-bottom:1px solid #e2e8f0; background:#f8fafc; }
  .pr-card-head h2 { margin:0; font-size:14px; font-weight:800; text-transform:uppercase; letter-spacing:.06em; color:#0f172a; }
  .pr-tbl { width:100%; border-collapse:collapse; font-size:13px; }
  .pr-th { text-align:left; padding:10px 14px; background:#f1f5f9; border-bottom:2px solid #e2e8f0; font-weight:800; font-size:11px; text-transform:uppercase; letter-spacing:.06em; color:#475569; }
  .pr-td { padding:11px 14px; border-bottom:1px solid #f1f5f9; color:#1e293b; font-weight:500; vertical-align:middle; }
  .pr-tr:hover .pr-td { background:#f8fafc; }
  .pr-badge { padding:3px 10px; border-radius:99px; font-size:11px; font-weight:700; display:inline-flex; align-items:center; white-space:nowrap; }
  
  .b-green  { background:#dcfce7; color:#166534; }
  .b-blue   { background:#dbeafe; color:#1d4ed8; }
  .b-yellow { background:#fef9c3; color:#854d0e; }
  .b-red    { background:#fee2e2; color:#991b1b; }
  .b-gray   { background:#f1f5f9; color:#475569; }

  .pr-kpi-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:14px; margin-bottom:20px; }
  .pr-kpi { background:white; border-radius:10px; border:1px solid #e2e8f0; padding:18px 20px; display:flex; align-items:center; gap:14px; }
  .pr-kpi-icon { width:44px; height:44px; border-radius:10px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
  .pr-kpi-val { font-size:26px; font-weight:900; color:#0f172a; }
  .pr-kpi-lbl { font-size:12px; font-weight:600; color:#64748b; }
  
  .pr-no-access { display:flex; align-items:center; justify-content:center; padding:80px 20px; color:#94a3b8; flex-direction:column; gap:10px; }
  .pr-empty { padding:40px; text-align:center; color:#94a3b8; font-size:14px; }
  .pr-err { padding:14px 20px; background:#fef2f2; border-left:4px solid #ef4444; color:#991b1b; font-size:13px; font-weight:600; }
  .pr-spinner { animation:spin 1s linear infinite; }
`;

const getStatusBadgeClass = (s = '') => {
  const sl = s.toLowerCase();
  if (sl.includes('approve') || sl.includes('receive') || sl.includes('complet')) return 'b-green';
  if (sl.includes('ship')) return 'b-blue';
  if (sl.includes('pend')) return 'b-yellow';
  if (sl.includes('reject') || sl.includes('cancel') || sl.includes('high')) return 'b-red';
  if (sl.includes('normal')) return 'b-blue';
  if (sl.includes('low')) return 'b-gray';
  return 'b-gray';
};

const Badge = ({ text }) => <span className={`pr-badge ${getStatusBadgeClass(text)}`}>{text || '—'}</span>;

const KpiCard = ({ label, value, icon: Icon, color, bg }) => (
  <div className="pr-kpi">
    <div className="pr-kpi-icon" style={{ background: bg }}><Icon size={22} color={color} /></div>
    <div>
      <div className="pr-kpi-val">{value}</div>
      <div className="pr-kpi-lbl">{label}</div>
    </div>
  </div>
);

const SummaryBox = ({ label, value, color, bg }) => (
  <div style={{ background: bg, borderRadius: 8, padding: '14px 28px', textAlign: 'center', minWidth: 120 }}>
    <div style={{ fontSize: 28, fontWeight: 900, color }}>{value}</div>
    <div style={{ fontSize: 12, fontWeight: 700, color }}>{label}</div>
  </div>
);

export default function PrintingMaterialConsumptionReport() {
  const user = authService.getCurrentUser();
  const roles = (user?.roles || []).map(r => r.toLowerCase());
  const isCEO        = roles.includes('ceo') || roles.includes('admin');
  const isSupervisor = roles.includes('printing supervisor') || roles.includes('printing manager') || roles.includes('supervisor');
  const isFinance    = roles.includes('finance') || roles.includes('finance manager');

  const canView     = isCEO || isSupervisor || isFinance;
  const summaryOnly = isCEO || isFinance; 

  const [requests, setRequests]   = useState([]);
  const [materials, setMaterials] = useState([]);
  const [moveLogs, setMoveLogs]   = useState([]);
  const [loading, setLoading]     = useState(false);
  const [errors, setErrors]       = useState({});

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setErrors({});
    const errs = {};

    try {
      const res = await apiClient.get('/printing-assets/material-requests');
      setRequests(Array.isArray(res) ? res : (res?.data || []));
    } catch (e) {
      errs.requests = 'Failed to load material requests.';
    }

    try {
      const res = await apiClient.get('/printing-assets/production/materials');
      setMaterials(Array.isArray(res) ? res : (res?.data || []));
    } catch (e) {
      errs.materials = 'Failed to load production materials overview.';
    }

    try {
      const res = await apiClient.get('/printing-assets/log', { params: { item_type: 'Material' } });
      setMoveLogs(Array.isArray(res) ? res : (res?.data || []));
    } catch (e) {
      errs.logs = 'Failed to load material movement logs.';
    }

    setErrors(errs);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  if (!canView) {
    return (
      <div className="pr-page">
        <style>{CSS}</style>
        <div className="pr-card">
          <div className="pr-no-access">
            <AlertTriangle size={40} color="#f59e0b" />
            <span style={{ fontWeight: 700, fontSize: 16 }}>Access Denied</span>
          </div>
        </div>
      </div>
    );
  }

  // ─── KPI Aggregates ───
  const pendingCount  = requests.filter(r => (r.status || '').toUpperCase() === 'PENDING').length;
  const approvedCount = requests.filter(r => (r.status || '').toUpperCase() === 'APPROVED').length;
  const highUrgency   = requests.filter(r => (r.urgency || '').toUpperCase() === 'HIGH').length;
  const totalConsumed = materials.reduce((s, m) => s + (parseFloat(m.quantity_consumed) || 0), 0);

  // Derive Job Reference detailed list from logs
  // Since production_materials aggregates, we build the "per job" log from the movement logs
  // Action types are typically "Move to Production" or "Consume" or "Return to Store"
  const floorLogs = moveLogs.filter(l => l.action_type === 'Consume' || l.action_type === 'Move to Production' || l.action_type === 'Return to Store');

  return (
    <div className="pr-page">
      <style>{CSS}</style>

      {/* ── Header ── */}
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 900, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Layers size={26} color="#8d6e63" /> Material Consumption Report
          </h1>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 13 }}>
            SUTANA PRINTING SYSTEM • Request Pipeline & Floor Consumption • {new Date().toLocaleString()}
            {summaryOnly && <span style={{ marginLeft: 10, background: '#fef3c7', color: '#92400e', padding: '2px 10px', borderRadius: 99, fontWeight: 700, fontSize: 11 }}>READ-ONLY SUMMARY</span>}
            {isSupervisor && !summaryOnly && <span style={{ marginLeft: 10, background: '#dcfce7', color: '#166534', padding: '2px 10px', borderRadius: 99, fontWeight: 700, fontSize: 11 }}>FULL ACCESS</span>}
          </p>
        </div>

        <button
          onClick={fetchAll}
          disabled={loading}
          style={{ padding: '7px 14px', background: '#0ea5e9', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}
        >
          <RefreshCw size={14} className={loading ? 'pr-spinner' : ''} />
          {loading ? 'Loading…' : 'Refresh'}
        </button>
      </div>

      {Object.values(errors).map((msg, idx) => (
        <div key={idx} className="pr-err" style={{ marginBottom: 16 }}>⚠ {msg}</div>
      ))}

      {/* ── KPI Strip ── */}
      <div className="pr-kpi-grid">
        <KpiCard label="Pending Requests"   value={loading ? '…' : pendingCount}  icon={Package}      color="#b45309" bg="#fef3c7" />
        <KpiCard label="Approved Requests"  value={loading ? '…' : approvedCount} icon={Layers}       color="#10b981" bg="#dcfce7" />
        <KpiCard label="High Urgency"       value={loading ? '…' : highUrgency}   icon={AlertTriangle} color="#dc2626" bg="#fee2e2" />
        <KpiCard label="Total Qty Consumed" value={loading ? '…' : totalConsumed.toFixed(2)} icon={TrendingDown} color="#8b5cf6" bg="#ede9fe" />
      </div>

      {/* ── SECTION 1: Material Request Pipeline ── */}
      <div className="pr-card">
        <div className="pr-card-head">
          <Package size={18} color="#8d6e63" />
          <h2>Material Request Pipeline</h2>
        </div>
        
        {summaryOnly ? (
          <div style={{ display: 'flex', gap: 24, padding: 20, flexWrap: 'wrap' }}>
            {[
              ['Pending',  requests.filter(r => (r.status || '').toUpperCase() === 'PENDING').length,  '#854d0e', '#fef9c3'],
              ['Approved', requests.filter(r => (r.status || '').toUpperCase() === 'APPROVED').length, '#166534', '#dcfce7'],
              ['Rejected', requests.filter(r => (r.status || '').toUpperCase() === 'REJECTED').length, '#991b1b', '#fee2e2'],
              ['High Urgency', highUrgency, '#b45309', '#ffedd5'],
            ].map(([label, count, color, bg]) => (
              <SummaryBox key={label} label={label} value={loading ? '…' : count} color={color} bg={bg} />
            ))}
          </div>
        ) : (
          requests.length === 0 ? (
            <div className="pr-empty">{loading ? 'Loading requests…' : 'No material requests found.'}</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="pr-tbl">
                <thead>
                  <tr>
                    {['Request Code', 'Material ID', 'Material Name', 'Qty Requested', 'Qty Shipped', 'Qty Received', 'Store Qty @ Request', 'Urgency', 'Status'].map(h => (
                      <th key={h} className="pr-th">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {requests.map(r => (
                    <tr key={r.id} className="pr-tr">
                      <td className="pr-td" style={{ fontWeight: 700 }}>{r.request_code || '—'}</td>
                      <td className="pr-td">{r.material_id || '—'}</td>
                      <td className="pr-td">{r.material_name || '—'}</td>
                      <td className="pr-td">{(parseFloat(r.quantity_requested) || 0).toFixed(2)}</td>
                      <td className="pr-td">{(parseFloat(r.quantity_shipped) || 0).toFixed(2)}</td>
                      <td className="pr-td">{(parseFloat(r.quantity_received) || 0).toFixed(2)}</td>
                      <td className="pr-td">
                        <span style={{ color: (parseFloat(r.store_qty_at_request) || 0) < 20 ? '#dc2626' : '#1e293b', fontWeight: (parseFloat(r.store_qty_at_request) || 0) < 20 ? 700 : 500 }}>
                          {(parseFloat(r.store_qty_at_request) || 0).toFixed(2)}
                        </span>
                      </td>
                      <td className="pr-td"><Badge text={r.urgency} /></td>
                      <td className="pr-td"><Badge text={r.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>

      {/* ── SECTION 2: Floor Consumption Tracking (Detailed logs per job) ── */}
      <div className="pr-card">
        <div className="pr-card-head">
          <TrendingDown size={18} color="#8b5cf6" />
          <h2>Production Floor Consumption & Movements Tracking</h2>
        </div>
        
        {summaryOnly ? (
          <div style={{ display: 'flex', gap: 24, padding: 20, flexWrap: 'wrap' }}>
            <SummaryBox label="Total Moved In"  value={loading ? '…' : materials.reduce((s, m) => s + (parseFloat(m.quantity_moved) || 0), 0).toFixed(2)}     color="#1d4ed8" bg="#dbeafe" />
            <SummaryBox label="Total Consumed"  value={loading ? '…' : totalConsumed.toFixed(2)}  color="#166534" bg="#dcfce7" />
            <SummaryBox label="Total Remaining" value={loading ? '…' : materials.reduce((s, m) => s + (parseFloat(m.quantity_remaining) || 0), 0).toFixed(2)} color="#854d0e" bg="#fef9c3" />
          </div>
        ) : (
          floorLogs.length === 0 ? (
            <div className="pr-empty">{loading ? 'Loading logs…' : 'No floor movement or consumption logs found.'}</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="pr-tbl">
                <thead>
                  <tr>
                    {['Date Time', 'Action Type', 'Material ID', 'Qty Affected', 'Job Reference / Notes', 'Approved By'].map(h => (
                      <th key={h} className="pr-th">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {floorLogs.map((l) => (
                    <tr key={l.id} className="pr-tr">
                      <td className="pr-td">{l.date_time ? new Date(l.date_time).toLocaleString() : '—'}</td>
                      <td className="pr-td">
                        <span className={`pr-badge ${l.action_type === 'Consume' ? 'b-red' : l.action_type === 'Return to Store' ? 'b-gray' : 'b-blue'}`}>
                          {l.action_type || '—'}
                        </span>
                      </td>
                      <td className="pr-td" style={{ fontWeight: 700 }}>{l.item_id || '—'}</td>
                      <td className="pr-td" style={{ fontWeight: 700, color: l.action_type === 'Consume' ? '#dc2626' : '#16a34a' }}>
                        {l.action_type === 'Consume' ? '-' : '+'}{(parseFloat(l.quantity) || 0).toFixed(2)}
                      </td>
                      <td className="pr-td" style={{ fontSize: 12 }}>{l.notes || '—'}</td>
                      <td className="pr-td">{l.approved_by || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>

    </div>
  );
}
