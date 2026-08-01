import React, { useState, useEffect, useCallback } from 'react';
import { DollarSign, Package, TrendingUp, AlertTriangle, RefreshCw } from 'lucide-react';
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
  .b-gray   { background:#f1f5f9; color:#475569; }
  .pr-kpi-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:14px; margin-bottom:20px; }
  .pr-kpi { background:white; border-radius:10px; border:1px solid #e2e8f0; padding:18px 20px; display:flex; align-items:center; gap:14px; }
  .pr-kpi-icon { width:44px; height:44px; border-radius:10px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
  .pr-kpi-val { font-size:26px; font-weight:900; color:#0f172a; }
  .pr-kpi-lbl { font-size:12px; font-weight:600; color:#64748b; }
  .pr-restricted { padding:10px 16px; background:#fef9c3; border-left:4px solid #f59e0b; color:#92400e; font-size:12px; font-weight:600; }
  .pr-no-access { display:flex; align-items:center; justify-content:center; padding:80px 20px; color:#94a3b8; flex-direction:column; gap:10px; }
  .pr-empty { padding:40px; text-align:center; color:#94a3b8; font-size:14px; }
  .pr-err { padding:14px 20px; background:#fef2f2; border-left:4px solid #ef4444; color:#991b1b; font-size:13px; font-weight:600; }
  .margin-positive { color:#16a34a; font-weight:800; }
  .margin-negative { color:#dc2626; font-weight:800; }
  .pr-spinner { animation:spin 1s linear infinite; }
`;

export default function PrintingJobCostReport() {
  const user = authService.getCurrentUser();
  const roles = (user?.roles || []).map(r => r.toLowerCase());
  const isCEO        = roles.includes('ceo') || roles.includes('admin');
  const isSupervisor = roles.includes('printing supervisor') || roles.includes('printing manager') || roles.includes('supervisor');
  const isFinance    = roles.includes('finance') || roles.includes('finance manager');

  const canView = isCEO || isSupervisor || isFinance;

  const [orders, setOrders] = useState([]);
  const [productTypes, setProductTypes] = useState({});
  const [moveLogs, setMoveLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setErrors({});
    const errs = {};

    try {
      const pRes = await apiClient.get('/printing/product-types');
      const pArr = pRes?.data?.productTypes || pRes?.data || [];
      const pMap = {};
      pArr.forEach(pt => { pMap[pt.name || pt.code] = pt; });
      setProductTypes(pMap);
    } catch (e) {
      errs.products = 'Failed to load product pricing baselines.';
    }

    try {
      const oRes = await apiClient.get('/printing/orders', { params: { limit: 500 } });
      const oArr = Array.isArray(oRes) ? oRes : (oRes?.data?.orders || oRes?.data || []);
      setOrders(oArr);
    } catch (e) {
      errs.orders = 'Failed to load orders.';
    }

    try {
      const lRes = await apiClient.get('/printing-assets/log', { params: { item_type: 'Material' } });
      const lArr = Array.isArray(lRes) ? lRes : (lRes?.data || []);
      setMoveLogs(lArr);
    } catch (e) {
      errs.logs = 'Failed to load material logs.';
    }

    setErrors(errs);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Helpers
  const getEstimatedCost = (o) => {
    const pt = productTypes[o.product_type];
    if (!pt) return 0;
    const base = (parseFloat(pt.base_price_per_page) || 0) * (parseInt(o.pages_per_copy) || 1) * (parseInt(o.quantity) || 1);
    const cm = parseFloat(pt.color_multiplier) || 1;
    return Math.round(o.color_printing ? base * cm : base);
  };

  const getMaterialsUsed = (orderNumber) => {
    if (!orderNumber) return [];
    // Looking for logs that contain the order number in notes
    const related = moveLogs.filter(l => l.notes && l.notes.includes(orderNumber));
    const matMap = {};
    related.forEach(l => {
      matMap[l.item_id] = (matMap[l.item_id] || 0) + (parseFloat(l.quantity) || 0);
    });
    return Object.entries(matMap).map(([id, qty]) => ({ material_id: id, quantity: qty }));
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

  // Aggregates
  const totalRevenue = orders.reduce((s, o) => s + (parseFloat(o.total_price) || 0), 0);
  const totalEstCost = orders.reduce((s, o) => s + getEstimatedCost(o), 0);
  const totalMargin  = totalRevenue - totalEstCost;

  return (
    <div className="pr-page">
      <style>{CSS}</style>

      {/* ── Header ── */}
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 900, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 10 }}>
            <DollarSign size={26} color="#f59e0b" /> Job Cost Report — Printing
          </h1>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 13 }}>
            SUTANA PRINTING SYSTEM • Revenue vs. Cost Analysis • {new Date().toLocaleString()}
            {isSupervisor && !isFinance && <span style={{ marginLeft: 10, background: '#fef3c7', color: '#92400e', padding: '2px 10px', borderRadius: 99, fontWeight: 700, fontSize: 11 }}>SPECS & MATERIALS ONLY</span>}
            {isCEO && !isFinance  && <span style={{ marginLeft: 10, background: '#dbeafe', color: '#1d4ed8', padding: '2px 10px', borderRadius: 99, fontWeight: 700, fontSize: 11 }}>AGGREGATE SUMMARY ONLY</span>}
            {isFinance             && <span style={{ marginLeft: 10, background: '#dcfce7', color: '#166534', padding: '2px 10px', borderRadius: 99, fontWeight: 700, fontSize: 11 }}>FINANCE — FULL ACCESS</span>}
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

      {/* CEO Aggregate Summary Only */}
      {isCEO && !isFinance && (
        <div className="pr-kpi-grid">
          <div className="pr-kpi">
            <div className="pr-kpi-icon" style={{ background: '#dbeafe' }}><TrendingUp size={22} color="#1d4ed8" /></div>
            <div>
              <div className="pr-kpi-val">{loading ? '…' : `ETB ${totalRevenue.toLocaleString()}`}</div>
              <div className="pr-kpi-lbl">Total Revenue (All Jobs)</div>
            </div>
          </div>
          <div className="pr-kpi">
            <div className="pr-kpi-icon" style={{ background: '#fef3c7' }}><DollarSign size={22} color="#b45309" /></div>
            <div>
              <div className="pr-kpi-val">{loading ? '…' : `ETB ${totalEstCost.toLocaleString()}`}</div>
              <div className="pr-kpi-lbl">Total Estimated Cost</div>
            </div>
          </div>
          <div className="pr-kpi">
            <div className="pr-kpi-icon" style={{ background: '#dcfce7' }}><TrendingUp size={22} color="#16a34a" /></div>
            <div>
              <div className={`pr-kpi-val ${totalMargin >= 0 ? 'margin-positive' : 'margin-negative'}`}>
                {loading ? '…' : `ETB ${totalMargin.toLocaleString()}`}
              </div>
              <div className="pr-kpi-lbl">Aggregate Margin</div>
            </div>
          </div>
        </div>
      )}

      {/* Per-Job Table */}
      <div className="pr-card">
        <div className="pr-card-head">
          <Package size={18} color="#f59e0b" />
          <h2>Per-Job Analysis</h2>
        </div>

        {isSupervisor && !isFinance && (
          <div className="pr-restricted">⚠ Cost, price and margin figures are Finance-only. Showing job specs and material usage only.</div>
        )}
        {isCEO && !isFinance && (
          <div className="pr-restricted">ℹ Per-job margin details are Finance-only. Showing job specs only.</div>
        )}

        {orders.length === 0 ? (
          <div className="pr-empty">{loading ? 'Loading orders…' : 'No jobs found.'}</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="pr-tbl">
              <thead>
                <tr>
                  <th className="pr-th">Order No.</th>
                  <th className="pr-th">Product Type</th>
                  <th className="pr-th">Qty</th>
                  <th className="pr-th">Pages/Copy</th>
                  <th className="pr-th">Color</th>
                  <th className="pr-th">Paper Type</th>
                  {isFinance && <th className="pr-th">Price/Unit (ETB)</th>}
                  {isFinance && <th className="pr-th">Binding Cost (ETB)</th>}
                  {isFinance && <th className="pr-th">Total Price (ETB)</th>}
                  {isFinance && <th className="pr-th">Est. Cost (ETB)</th>}
                  {isFinance && <th className="pr-th">Margin (ETB)</th>}
                  <th className="pr-th">Material Moved/Used</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(o => {
                  const estCost = getEstimatedCost(o);
                  const totalPrice = parseFloat(o.total_price) || 0;
                  const margin  = totalPrice - estCost;
                  const mats = getMaterialsUsed(o.order_number);
                  return (
                    <tr key={o.id || o.order_number} className="pr-tr">
                      <td className="pr-td" style={{ fontWeight: 700 }}>{o.order_number || o.id}</td>
                      <td className="pr-td">{o.product_type || '—'}</td>
                      <td className="pr-td">{(o.quantity || 0).toLocaleString()}</td>
                      <td className="pr-td">{o.pages_per_copy || 1}</td>
                      <td className="pr-td">
                        <span className={`pr-badge ${o.color_printing ? 'b-green' : 'b-gray'}`}>{o.color_printing ? 'Yes' : 'No'}</span>
                      </td>
                      <td className="pr-td">{o.paper_type || '—'}</td>
                      {isFinance && <td className="pr-td">ETB {(o.price_per_unit || 0).toLocaleString()}</td>}
                      {isFinance && <td className="pr-td">ETB {(o.binding_cost || 0).toLocaleString()}</td>}
                      {isFinance && <td className="pr-td" style={{ fontWeight: 700 }}>ETB {totalPrice.toLocaleString()}</td>}
                      {isFinance && <td className="pr-td" style={{ fontWeight: 700, color: '#b45309' }}>ETB {estCost.toLocaleString()}</td>}
                      {isFinance && (
                        <td className="pr-td">
                          <span className={margin >= 0 ? 'margin-positive' : 'margin-negative'}>ETB {margin.toLocaleString()}</span>
                        </td>
                      )}
                      <td className="pr-td">
                        {mats.length > 0
                          ? mats.map(m => <div key={m.material_id} style={{ fontSize: 12 }}>{m.material_id}: <strong>{m.quantity}</strong> units</div>)
                          : <span style={{ color: '#94a3b8' }}>—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              {isFinance && (
                <tfoot>
                  <tr style={{ background: '#f8fafc' }}>
                    <td className="pr-td" colSpan={6} style={{ fontWeight: 800, textAlign: 'right' }}>TOTALS</td>
                    <td className="pr-td"></td>
                    <td className="pr-td"></td>
                    <td className="pr-td" style={{ fontWeight: 900 }}>ETB {totalRevenue.toLocaleString()}</td>
                    <td className="pr-td" style={{ fontWeight: 900, color: '#b45309' }}>ETB {totalEstCost.toLocaleString()}</td>
                    <td className="pr-td"><span className={totalMargin >= 0 ? 'margin-positive' : 'margin-negative'} style={{ fontSize: 15 }}>ETB {totalMargin.toLocaleString()}</span></td>
                    <td className="pr-td"></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
