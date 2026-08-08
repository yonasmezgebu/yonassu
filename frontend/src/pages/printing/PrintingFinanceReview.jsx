import React, { useState, useEffect, useCallback } from 'react';
import { ShieldCheck, Banknote, CreditCard, Box, Tag, AlertTriangle, RefreshCw, CheckCircle } from 'lucide-react';
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
  .b-yellow { background:#fef9c3; color:#854d0e; }
  .b-gray   { background:#f1f5f9; color:#475569; }
  .b-blue   { background:#dbeafe; color:#1d4ed8; }

  .pr-kpi-grid { display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:14px; margin-bottom:20px; }
  .pr-kpi { background:white; border-radius:10px; border:1px solid #e2e8f0; padding:18px 20px; display:flex; align-items:center; gap:14px; }
  .pr-kpi-icon { width:44px; height:44px; border-radius:10px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
  .pr-kpi-val { font-size:26px; font-weight:900; color:#0f172a; }
  .pr-kpi-lbl { font-size:12px; font-weight:600; color:#64748b; }
  
  .pr-restricted { padding:10px 16px; background:#fee2e2; border-left:4px solid #ef4444; color:#991b1b; font-size:12px; font-weight:600; }
  .pr-no-access { display:flex; align-items:center; justify-content:center; padding:80px 20px; color:#94a3b8; flex-direction:column; gap:10px; text-align:center; }
  .pr-empty { padding:40px; text-align:center; color:#94a3b8; font-size:14px; }
  .pr-err { padding:14px 20px; background:#fef2f2; border-left:4px solid #ef4444; color:#991b1b; font-size:13px; font-weight:600; }
  .pr-spinner { animation:spin 1s linear infinite; }

  .pr-input { border: 1px solid #cbd5e1; padding: 6px 10px; border-radius: 6px; font-size: 13px; width: 100px; font-weight: 700; color: #1e293b; }
  .pr-btn { padding: 6px 10px; background: #0ea5e9; color: white; border: none; border-radius: 6px; font-weight: 700; cursor: pointer; font-size: 12px; display:inline-flex; align-items:center; gap:4px; }
  .pr-btn:hover { background: #0284c7; }
  .pr-btn:disabled { opacity: 0.5; cursor: not-allowed; }
`;

const getPaymentBadge = (s = '') => {
  if (s.toLowerCase().includes('paid') || s.toLowerCase().includes('complete')) return 'b-green';
  if (s.toLowerCase().includes('pend') || s.toLowerCase().includes('partial')) return 'b-yellow';
  return 'b-gray';
};

export default function PrintingFinanceReview() {
  const user = authService.getCurrentUser();
  const roles = (user?.roles || []).map(r => r.toLowerCase());
  const isFinance    = roles.includes('finance') || roles.includes('finance manager');
  const isSupervisor = roles.includes('printing supervisor') || roles.includes('printing manager') || roles.includes('supervisor');
  const isCEO        = roles.includes('ceo') || roles.includes('admin');

  const canView = isFinance || isSupervisor || isCEO;

  const [orders, setOrders] = useState([]);
  const [machines, setMachines] = useState([]);
  const [productTypes, setProductTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Inline edit states
  const [editVals, setEditVals] = useState({});
  const [savingId, setSavingId] = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setErrors({});
    const errs = {};

    try {
      const res = await apiClient.get('/printing/orders', { params: { limit: 500 } });
      let ords = Array.isArray(res) ? res : (res?.data?.orders || res?.data || []);
      // If supervisor, only show orders they created
      if (isSupervisor && !isFinance) {
        ords = ords.filter(o => o.created_by_name === user?.fullName || o.created_by === user?.id);
      }
      setOrders(ords);
    } catch (e) { errs.orders = 'Failed to load orders.'; }

    try {
      // Fetch both store and prod machines to get the full list
      const [sRes, pRes] = await Promise.all([
        apiClient.get('/printing-assets/store/machines'),
        apiClient.get('/printing-assets/production/machines')
      ]);
      const sArr = Array.isArray(sRes) ? sRes : (sRes?.data || []);
      const pArr = Array.isArray(pRes) ? pRes : (pRes?.data || []);
      
      // Merge, removing duplicates by machine_id (in case they appear in both somehow)
      const mMap = new Map();
      sArr.forEach(m => mMap.set(m.machine_id || m.id, m));
      pArr.forEach(m => {
        if (!mMap.has(m.machine_id || m.id)) mMap.set(m.machine_id || m.id, m);
      });
      setMachines(Array.from(mMap.values()));
    } catch (e) { errs.machines = 'Failed to load machines.'; }

    try {
      const res = await apiClient.get('/printing/product-types');
      setProductTypes(Array.isArray(res) ? res : (res?.data?.productTypes || res?.data || []));
    } catch (e) { errs.products = 'Failed to load product types.'; }

    setErrors(errs);
    setLoading(false);
  }, [isSupervisor, isFinance, user?.fullName, user?.id]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleValChange = (id, val) => setEditVals(prev => ({ ...prev, [id]: val }));

  const saveInternalValue = async (id, machine_id) => {
    if (!editVals[id]) return;
    setSavingId(id);
    try {
      // The endpoint uses the numeric id (from printing_assets_machines) usually, or machine_id. We'll try the db id.
      await apiClient.patch(`/printing-assets/store/machines/${id}/value`, { internal_value: editVals[id] });
      setMachines(prev => prev.map(m => m.id === id ? { ...m, internal_value: editVals[id] } : m));
      setEditVals(prev => { const n = { ...prev }; delete n[id]; return n; });
    } catch (error) {
      alert('Failed to update internal value: ' + (error.response?.data?.message || error.message));
    } finally {
      setSavingId(null);
    }
  };

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

  if (isCEO && !isFinance) {
    return (
      <div className="pr-page">
        <style>{CSS}</style>
        <div className="pr-card">
          <div className="pr-no-access">
            <ShieldCheck size={50} color="#ef4444" />
            <h2 style={{ color: '#991b1b', margin: '10px 0 0' }}>Financial Figures Restricted</h2>
            <p style={{ maxWidth: 400, fontSize: 13 }}>Per company policy, detailed payment reconciliation and internal book values are restricted to Finance personnel only.</p>
          </div>
        </div>
      </div>
    );
  }

  const totalOutstanding = orders.filter(o => (o.payment_status || '').toLowerCase() !== 'paid').reduce((s, o) => s + (parseFloat(o.total_price) || 0), 0);
  const totalAssetsVal   = machines.reduce((s, m) => s + (parseFloat(m.internal_value) || 0), 0);

  return (
    <div className="pr-page">
      <style>{CSS}</style>

      {/* ── Header ── */}
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 900, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Banknote size={26} color="#16a34a" /> Financial Review — Printing
          </h1>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 13 }}>
            SUTANA PRINTING SYSTEM • Payment Reconciliation & Asset Book Values • {new Date().toLocaleString()}
            {isFinance && <span style={{ marginLeft: 10, background: '#dcfce7', color: '#166534', padding: '2px 10px', borderRadius: 99, fontWeight: 700, fontSize: 11 }}>FINANCE — FULL ACCESS</span>}
            {isSupervisor && !isFinance && <span style={{ marginLeft: 10, background: '#fef3c7', color: '#92400e', padding: '2px 10px', borderRadius: 99, fontWeight: 700, fontSize: 11 }}>SUPERVISOR — OWN ORDERS ONLY (READ ONLY)</span>}
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

      {isSupervisor && !isFinance && (
        <div className="pr-restricted" style={{ marginBottom: 20 }}>
          ⚠ You are viewing payment statuses for orders submitted by you. Asset Book Values and Pricing references are hidden (Finance only).
        </div>
      )}

      {/* ── KPI Grid (Finance Only) ── */}
      {isFinance && (
        <div className="pr-kpi-grid">
          <div className="pr-kpi">
            <div className="pr-kpi-icon" style={{ background: '#fee2e2' }}><CreditCard size={22} color="#dc2626" /></div>
            <div>
              <div className="pr-kpi-val" style={{ color: '#dc2626' }}>{loading ? '…' : `ETB ${totalOutstanding.toLocaleString()}`}</div>
              <div className="pr-kpi-lbl">Total Outstanding (Unpaid)</div>
            </div>
          </div>
          <div className="pr-kpi">
            <div className="pr-kpi-icon" style={{ background: '#dcfce7' }}><Box size={22} color="#16a34a" /></div>
            <div>
              <div className="pr-kpi-val" style={{ color: '#166534' }}>{loading ? '…' : `ETB ${totalAssetsVal.toLocaleString()}`}</div>
              <div className="pr-kpi-lbl">Total Machine Book Value</div>
            </div>
          </div>
        </div>
      )}

      {/* ── SECTION 1: Order Payment Reconciliation ── */}
      <div className="pr-card">
        <div className="pr-card-head">
          <CreditCard size={18} color="#16a34a" />
          <h2>Order Payment Reconciliation {isSupervisor && !isFinance && '(My Orders)'}</h2>
        </div>
        
        {orders.length === 0 ? (
          <div className="pr-empty">{loading ? 'Loading orders…' : 'No orders found.'}</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="pr-tbl">
              <thead>
                <tr>
                  <th className="pr-th">Order No.</th>
                  <th className="pr-th">Status</th>
                  <th className="pr-th">Total Price (ETB)</th>
                  <th className="pr-th">Payment Method</th>
                  <th className="pr-th">Payment Status</th>
                  <th className="pr-th">Payment Ref.</th>
                  {isFinance && <th className="pr-th">Payment Proof</th>}
                </tr>
              </thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o.id || o.order_number} className="pr-tr">
                    <td className="pr-td" style={{ fontWeight: 700 }}>{o.order_number || o.id}</td>
                    <td className="pr-td"><span className="pr-badge b-gray">{o.status_name || '—'}</span></td>
                    <td className="pr-td" style={{ fontWeight: 800, color: '#166534' }}>{(parseFloat(o.total_price) || 0).toLocaleString()}</td>
                    <td className="pr-td" style={{ textTransform: 'capitalize' }}>{o.payment_method || '—'}</td>
                    <td className="pr-td"><span className={`pr-badge ${getPaymentBadge(o.payment_status)}`}>{o.payment_status || 'Pending'}</span></td>
                    <td className="pr-td" style={{ fontFamily: 'monospace' }}>{o.payment_reference || '—'}</td>
                    {isFinance && (
                      <td className="pr-td">
                        {o.payment_proof_path ? (
                          <a href={o.payment_proof_path} target="_blank" rel="noreferrer" style={{ color: '#2563eb', fontWeight: 600, fontSize: 12 }}>View Proof</a>
                        ) : <span style={{ color: '#94a3b8' }}>None</span>}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── SECTION 2 & 3: Finance Only Views (Machines & Product Pricing) ── */}
      {isFinance && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 20 }}>
          
          <div className="pr-card" style={{ marginBottom: 0 }}>
            <div className="pr-card-head">
              <Box size={18} color="#0ea5e9" />
              <h2>Machine Asset Book Values (Internal Value)</h2>
            </div>
            {machines.length === 0 ? (
              <div className="pr-empty">{loading ? 'Loading machines…' : 'No machines found.'}</div>
            ) : (
              <div style={{ overflowX: 'auto', maxHeight: '400px' }}>
                <table className="pr-tbl">
                  <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                    <tr>
                      <th className="pr-th">Machine</th>
                      <th className="pr-th">Status</th>
                      <th className="pr-th">Internal Book Value (ETB)</th>
                      <th className="pr-th">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {machines.map(m => (
                      <tr key={m.id} className="pr-tr">
                        <td className="pr-td">
                          <div style={{ fontWeight: 700 }}>{m.machine_id}</div>
                          <div style={{ fontSize: 11, color: '#64748b' }}>{m.machine_name}</div>
                        </td>
                        <td className="pr-td"><span className="pr-badge b-gray">{m.status || '—'}</span></td>
                        <td className="pr-td">
                          <input 
                            type="number" 
                            className="pr-input" 
                            placeholder={parseFloat(m.internal_value || 0)}
                            value={editVals[m.id] !== undefined ? editVals[m.id] : ''}
                            onChange={(e) => handleValChange(m.id, e.target.value)}
                          />
                        </td>
                        <td className="pr-td">
                          <button 
                            className="pr-btn" 
                            disabled={editVals[m.id] === undefined || savingId === m.id}
                            onClick={() => saveInternalValue(m.id, m.machine_id)}
                          >
                            {savingId === m.id ? <SegmentedSpinner size={12} /> : <CheckCircle size={12} />}
                            Save
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="pr-card" style={{ marginBottom: 0 }}>
            <div className="pr-card-head">
              <Tag size={18} color="#8b5cf6" />
              <h2>Product Types Pricing Baselines</h2>
            </div>
            {productTypes.length === 0 ? (
              <div className="pr-empty">{loading ? 'Loading product types…' : 'No product types found.'}</div>
            ) : (
              <div style={{ overflowX: 'auto', maxHeight: '400px' }}>
                <table className="pr-tbl">
                  <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                    <tr>
                      <th className="pr-th">Product Name</th>
                      <th className="pr-th">Base Price / Page</th>
                      <th className="pr-th">Color Multiplier</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productTypes.map(pt => (
                      <tr key={pt.id || pt.code} className="pr-tr">
                        <td className="pr-td" style={{ fontWeight: 700 }}>{pt.name || pt.code}</td>
                        <td className="pr-td">ETB {(parseFloat(pt.base_price_per_page) || 0).toFixed(2)}</td>
                        <td className="pr-td" style={{ color: '#8b5cf6', fontWeight: 800 }}>x{(parseFloat(pt.color_multiplier) || 1).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
