import React, { useState, useEffect, useCallback } from 'react';
import { BarChart3, TrendingUp, Layers, Cpu, Package, Server, AlertTriangle, RefreshCw } from 'lucide-react';
import authService from '../../services/authService';
import apiClient from '../../services/apiClient';
import SegmentedSpinner from '../../components/ui/SegmentedSpinner';

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
  .b-purple { background:#f3e8ff; color:#6b21a8; }

  .pr-kpi-grid { display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:14px; margin-bottom:20px; }
  .pr-kpi { background:white; border-radius:10px; border:1px solid #e2e8f0; padding:18px 20px; display:flex; align-items:center; gap:14px; }
  .pr-kpi-icon { width:44px; height:44px; border-radius:10px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
  .pr-kpi-val { font-size:26px; font-weight:900; color:#0f172a; }
  .pr-kpi-lbl { font-size:12px; font-weight:600; color:#64748b; }
  
  .pr-no-access { display:flex; align-items:center; justify-content:center; padding:80px 20px; color:#94a3b8; flex-direction:column; gap:10px; }
  .pr-empty { padding:40px; text-align:center; color:#94a3b8; font-size:14px; }
  .pr-err { padding:14px 20px; background:#fef2f2; border-left:4px solid #ef4444; color:#991b1b; font-size:13px; font-weight:600; }
  .pr-spinner { animation:spin 1s linear infinite; }

  .summary-box-wrap { display:flex; gap:14px; padding:20px; flex-wrap:wrap; }
`;

const getStatusBadgeClass = (s = '') => {
  const sl = s.toLowerCase();
  if (sl.includes('deliver') || sl.includes('approve') || sl.includes('active') || sl.includes('functional')) return 'b-green';
  if (sl.includes('ship') || sl.includes('print')) return 'b-blue';
  if (sl.includes('pend') || sl.includes('idle')) return 'b-yellow';
  if (sl.includes('reject') || sl.includes('cancel') || sl.includes('high') || sl.includes('maint')) return 'b-red';
  return 'b-gray';
};

const Badge = ({ text }) => <span className={`pr-badge ${getStatusBadgeClass(text)}`}>{text || '—'}</span>;

const SummaryBox = ({ label, value, color, bg }) => (
  <div style={{ background: bg, borderRadius: 8, padding: '14px 28px', textAlign: 'center', minWidth: 140, flex: 1 }}>
    <div style={{ fontSize: 28, fontWeight: 900, color }}>{value}</div>
    <div style={{ fontSize: 12, fontWeight: 700, color }}>{label}</div>
  </div>
);

export default function PrintingCEOReport() {
  const user = authService.getCurrentUser();
  const roles = (user?.roles || []).map(r => r.toLowerCase());
  const isCEO        = roles.includes('ceo') || roles.includes('admin');
  const isSupervisor = roles.includes('printing supervisor') || roles.includes('printing manager') || roles.includes('supervisor');
  const isFinance    = roles.includes('finance') || roles.includes('finance manager');

  const canView     = isCEO || isSupervisor || isFinance;
  const isFullView  = isCEO; // Supervisor and Finance see read-only summaries on this page

  const [orders, setOrders] = useState([]);
  const [storeMachines, setStoreMachines] = useState([]);
  const [prodMachines, setProdMachines] = useState([]);
  const [matRequests, setMatRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setErrors({});
    const errs = {};

    try {
      const res = await apiClient.get('/printing/orders', { params: { limit: 500 } });
      setOrders(Array.isArray(res) ? res : (res?.data?.orders || res?.data || []));
    } catch (e) { errs.orders = 'Failed to load orders.'; }

    try {
      const res = await apiClient.get('/printing-assets/store/machines');
      setStoreMachines(Array.isArray(res) ? res : (res?.data || []));
    } catch (e) { errs.smachines = 'Failed to load store machines.'; }

    try {
      const res = await apiClient.get('/printing-assets/production/machines');
      setProdMachines(Array.isArray(res) ? res : (res?.data || []));
    } catch (e) { errs.pmachines = 'Failed to load production machines.'; }

    try {
      const res = await apiClient.get('/printing-assets/material-requests');
      setMatRequests(Array.isArray(res) ? res : (res?.data || []));
    } catch (e) { errs.requests = 'Failed to load material requests.'; }

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

  // Calculate Aggregates
  const totalRevenue = orders.reduce((s, o) => s + (parseFloat(o.total_price) || 0), 0);
  
  // Fleet Status (from Store + Production records)
  const machinesInStore   = storeMachines.filter(m => (m.status || '').toLowerCase() === 'in store').length;
  const machinesMoved     = storeMachines.filter(m => (m.status || '').toLowerCase() === 'moved to production').length;
  const machinesMaint     = storeMachines.filter(m => (m.status || '').toLowerCase().includes('maintenance')).length;
  
  // Production Floor Status
  const prodActive = prodMachines.filter(m => (m.status || '').toLowerCase() === 'active').length;
  const prodIdle   = prodMachines.filter(m => (m.status || '').toLowerCase() === 'idle in production').length;
  const prodRet    = prodMachines.filter(m => (m.status || '').toLowerCase() === 'returned to store').length;

  // Material Requests
  const reqPending  = matRequests.filter(r => (r.status || '').toUpperCase() === 'PENDING').length;
  const reqApproved = matRequests.filter(r => (r.status || '').toUpperCase() === 'APPROVED').length;
  const reqRejected = matRequests.filter(r => (r.status || '').toUpperCase() === 'REJECTED').length;
  const reqUrgent   = matRequests.filter(r => (r.urgency || '').toUpperCase() === 'HIGH').length;

  return (
    <div className="pr-page">
      <style>{CSS}</style>

      {/* ── Header ── */}
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 900, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 10 }}>
            <BarChart3 size={26} color="#4f46e5" /> CEO Report — Printing
          </h1>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 13 }}>
            SUTANA PRINTING SYSTEM • High-Level Oversight • {new Date().toLocaleString()}
            {!isFullView && <span style={{ marginLeft: 10, background: '#fef3c7', color: '#92400e', padding: '2px 10px', borderRadius: 99, fontWeight: 700, fontSize: 11 }}>READ-ONLY SUMMARY</span>}
            {isFullView  && <span style={{ marginLeft: 10, background: '#e0e7ff', color: '#3730a3', padding: '2px 10px', borderRadius: 99, fontWeight: 700, fontSize: 11 }}>CEO — FULL ACCESS</span>}
          </p>
        </div>

        <button
          onClick={fetchAll}
          disabled={loading}
          style={{ padding: '7px 14px', background: '#0ea5e9', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}
        >
          <SegmentedSpinner size={14} />
          {loading ? 'Loading…' : 'Refresh'}
        </button>
      </div>

      {Object.values(errors).map((msg, idx) => (
        <div key={idx} className="pr-err" style={{ marginBottom: 16 }}>⚠ {msg}</div>
      ))}

      {/* ── Top Level KPIs ── */}
      <div className="pr-kpi-grid">
        <div className="pr-kpi">
          <div className="pr-kpi-icon" style={{ background: '#dbeafe' }}><TrendingUp size={22} color="#1d4ed8" /></div>
          <div>
            <div className="pr-kpi-val">{loading ? '…' : `ETB ${totalRevenue.toLocaleString()}`}</div>
            <div className="pr-kpi-lbl">Total Order Revenue</div>
          </div>
        </div>
        <div className="pr-kpi">
          <div className="pr-kpi-icon" style={{ background: '#e0e7ff' }}><Server size={22} color="#4338ca" /></div>
          <div>
            <div className="pr-kpi-val">{loading ? '…' : orders.length}</div>
            <div className="pr-kpi-lbl">Total Orders Volume</div>
          </div>
        </div>
        <div className="pr-kpi">
          <div className="pr-kpi-icon" style={{ background: '#f3e8ff' }}><Cpu size={22} color="#7e22ce" /></div>
          <div>
            <div className="pr-kpi-val">{loading ? '…' : storeMachines.length}</div>
            <div className="pr-kpi-lbl">Total Fleet Assets</div>
          </div>
        </div>
        <div className="pr-kpi">
          <div className="pr-kpi-icon" style={{ background: '#fef3c7' }}><Package size={22} color="#b45309" /></div>
          <div>
            <div className="pr-kpi-val">{loading ? '…' : reqPending}</div>
            <div className="pr-kpi-lbl">Pending Mat. Requests</div>
          </div>
        </div>
      </div>

      {/* ── SECTION 1: Order Volume & Revenue ── */}
      <div className="pr-card">
        <div className="pr-card-head">
          <TrendingUp size={18} color="#4f46e5" />
          <h2>Order Volume & Revenue Activity</h2>
        </div>
        
        {!isFullView ? (
          <div className="summary-box-wrap">
            <SummaryBox label="Total Orders" value={loading ? '…' : orders.length} color="#1e293b" bg="#f1f5f9" />
            <SummaryBox label="Total Revenue (ETB)" value={loading ? '…' : totalRevenue.toLocaleString()} color="#166534" bg="#dcfce7" />
          </div>
        ) : (
          orders.length === 0 ? (
            <div className="pr-empty">{loading ? 'Loading orders…' : 'No order activity found.'}</div>
          ) : (
            <div style={{ overflowX: 'auto', maxHeight: '400px' }}>
              <table className="pr-tbl">
                <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                  <tr>
                    <th className="pr-th">Order No.</th>
                    <th className="pr-th">Product Type</th>
                    <th className="pr-th">Quantity</th>
                    <th className="pr-th">Total Price (ETB)</th>
                    <th className="pr-th">Status</th>
                    <th className="pr-th">Due Date</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(o => (
                    <tr key={o.id || o.order_number} className="pr-tr">
                      <td className="pr-td" style={{ fontWeight: 700 }}>{o.order_number || o.id}</td>
                      <td className="pr-td">{o.product_type || '—'}</td>
                      <td className="pr-td">{(o.quantity || 0).toLocaleString()}</td>
                      <td className="pr-td" style={{ fontWeight: 700, color: '#166534' }}>{(parseFloat(o.total_price) || 0).toLocaleString()}</td>
                      <td className="pr-td"><Badge text={o.status_name || '—'} /></td>
                      <td className="pr-td">{o.due_date ? new Date(o.due_date).toLocaleDateString() : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>

      {/* ── SECTION 2: Machine Fleet Status ── */}
      <div className="pr-card">
        <div className="pr-card-head">
          <Server size={18} color="#0f766e" />
          <h2>Machine Fleet & Floor Status Summary</h2>
        </div>
        <div className="summary-box-wrap">
          <SummaryBox label="In Store" value={loading ? '…' : machinesInStore} color="#1d4ed8" bg="#dbeafe" />
          <SummaryBox label="Moved to Prod" value={loading ? '…' : machinesMoved} color="#b45309" bg="#fef3c7" />
          <SummaryBox label="Under Maint." value={loading ? '…' : machinesMaint} color="#991b1b" bg="#fee2e2" />
          <div style={{ width: '1px', background: '#e2e8f0', margin: '0 10px' }} />
          <SummaryBox label="Floor Active" value={loading ? '…' : prodActive} color="#166534" bg="#dcfce7" />
          <SummaryBox label="Floor Idle" value={loading ? '…' : prodIdle} color="#854d0e" bg="#ffedd5" />
          <SummaryBox label="Floor Returned" value={loading ? '…' : prodRet} color="#475569" bg="#f1f5f9" />
        </div>
      </div>

      {/* ── SECTION 3: Material Request Pipeline Summary ── */}
      <div className="pr-card">
        <div className="pr-card-head">
          <Layers size={18} color="#8b5cf6" />
          <h2>Material Request Activity Summary</h2>
        </div>
        <div className="summary-box-wrap">
          <SummaryBox label="Pending Approval" value={loading ? '…' : reqPending} color="#b45309" bg="#fef3c7" />
          <SummaryBox label="Approved" value={loading ? '…' : reqApproved} color="#166534" bg="#dcfce7" />
          <SummaryBox label="Rejected" value={loading ? '…' : reqRejected} color="#991b1b" bg="#fee2e2" />
          <div style={{ width: '1px', background: '#e2e8f0', margin: '0 10px' }} />
          <SummaryBox label="High Urgency" value={loading ? '…' : reqUrgent} color="#dc2626" bg="#fee2e2" />
        </div>
      </div>

    </div>
  );
}
