import React, { useState, useEffect, useCallback } from 'react';
import { Target, TrendingUp, Clock, Package, AlertCircle, ShoppingCart, RefreshCw, BarChart2 } from 'lucide-react';
import salesService from '../../services/salesService';
import authService from '../../services/authService';
import SegmentedSpinner from '../../components/ui/SegmentedSpinner';

const BG  = '#EEF2FF';
const C   = '#4338ca'; // indigo-700
const CD  = '#312e81';
const CL  = '#6366f1';

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
  @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
  @keyframes spin { to{transform:rotate(360deg)} }
  .ds-page { min-height:calc(100vh - 64px); font-family:'Inter','Segoe UI',sans-serif; padding-bottom:48px; }

  .ds-card {
    --hc:${C}; background:white; border-radius:0; position:relative; overflow:hidden;
    box-shadow:0 4px 20px rgba(40,40,120,.08); transition:transform .2s ease, box-shadow .3s ease;
    animation:fadeUp .5s ease both;
    border-top: 4px solid var(--hc);
  }
  .ds-card:hover { transform:translateY(-2px); box-shadow:0 8px 32px rgba(40,40,120,.15); }

  .ds-head {
    padding:14px 22px; background:linear-gradient(135deg,rgba(67,56,202,.08),rgba(67,56,202,.03));
    display:flex; align-items:center; gap:12px; border-bottom:1px solid rgba(67,56,202,.1);
  }
  .ds-head span { font-size:13px; font-weight:900; letter-spacing:.07em; text-transform:uppercase; color:${C}; }

  .ds-title {
    font-size:2.4rem; font-weight:900; color:#1e1b4b; letter-spacing:-.02em; margin:0;
    display:flex; align-items:center; gap:12px; line-height:1.1;
  }

  .ds-tbl { width:100%; border-collapse:collapse; font-size:13.5px; }
  .ds-th  { text-align:left; padding:11px 14px; background:rgba(67,56,202,.05); border-bottom:2px solid ${C}; color:${C}; font-weight:900; text-transform:uppercase; letter-spacing:.06em; font-size:10.5px; }
  .ds-td  { padding:12px 14px; border-bottom:1px solid rgba(67,56,202,.1); color:#312e81; font-weight:600; vertical-align:middle; }
  .ds-tr:hover .ds-td { background:rgba(67,56,202,.03); }

  .ds-badge {
    padding:5px 12px; border-radius:99px; font-weight:900; font-size:10.5px;
    text-transform:uppercase; letter-spacing:.05em; display:inline-flex; align-items:center; gap:5px; white-space:nowrap;
  }
  .db-ok      { background:linear-gradient(135deg,#e0e7ff,#c7d2fe); color:#3730a3; border:1px solid #818cf8; }
  .db-warn    { background:linear-gradient(135deg,#fffbeb,#fef3c7); color:#92400e; border:1px solid #fde68a; }
  .db-err     { background:linear-gradient(135deg,#fef2f2,#fee2e2); color:#991b1b; border:1px solid #fca5a5; }
  .db-neutral { background:rgba(67,56,202,.08); color:${C}; border:1px solid rgba(67,56,202,.2); }

  .ds-btn {
    display:inline-flex; align-items:center; gap:6px; padding:8px 18px; font-weight:900; font-size:12px;
    cursor:pointer; letter-spacing:.07em; text-transform:uppercase; border-radius:8px;
    box-shadow:0 4px 0 ${CD},0 6px 12px rgba(67,56,202,.18);
    background:linear-gradient(135deg,#fff,${BG}); color:${C}; border:2px solid ${C};
  }
  .ds-btn:active { transform:translateY(4px); box-shadow:none; }
  .ds-btn:disabled { opacity:.55; cursor:not-allowed; }

  .ds-btn-success { background:linear-gradient(135deg,#6366f1,#4338ca); color:white; border:2px solid #312e81; box-shadow:0 4px 0 #312e81; }

  .ro-banner {
    background:linear-gradient(135deg,#eff6ff,#dbeafe); border:2px solid #bfdbfe;
    padding:14px 20px; display:flex; align-items:center; gap:12px; margin:0 32px 20px; animation:fadeUp .4s ease;
  }
`;

const fmt = (v) => Number(v || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' }) : '—';

function Section({ icon: Icon, title, count, children }) {
  return (
    <div className="ds-card">
      <div className="ds-head">
        <Icon size={20} />
        <span>{title}</span>
        {count !== undefined && <span style={{ background:'rgba(67,56,202,.15)', borderRadius:99, padding:'2px 10px', fontSize:11, fontWeight:900 }}>{count}</span>}
      </div>
      {children}
    </div>
  );
}

export default function SalesDailySummary() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const user = authService.getCurrentUser();
  const roles = (user?.roles || []).map(r => r.toLowerCase());
  const isManager = roles.includes('store manager') || roles.includes('sales manager') || roles.includes('admin');
  const isExec = roles.includes('ceo') || roles.includes('finance') || roles.includes('finance manager');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await salesService.getDailySummary();
      setData(res?.data || res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const tx = data?.txTotals || {};
  const shifts = data?.shifts || [];
  const orders = data?.orders || [];
  const lowStock = data?.lowStock || [];

  return (
    <div className="ds-page">
      <style>{CSS}</style>
      
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'28px 32px 22px', animation:'fadeUp .35s ease' }}>
        <div>
          <h1 className="ds-title">Daily Summary. <Target size={34} color={CL} /></h1>
          <p style={{ fontSize:'.82rem', color:C, fontWeight:800, textTransform:'uppercase', letterSpacing:'.14em', margin:'8px 0 0' }}>
            Store Operations Overview
          </p>
        </div>
        <button onClick={load} disabled={loading} className="ds-btn">
          <SegmentedSpinner size={14} /> Sync Today
        </button>
      </div>

      {!isManager && isExec && (
        <div className="ro-banner">
          <AlertCircle size={20} color="#1d4ed8" />
          <div>
            <strong style={{ color:'#1e3a8a', fontSize:13 }}>Executive Read-Only View</strong>
            <p style={{ margin:'2px 0 0', color:'#1e40af', fontSize:12, fontWeight:600 }}>
              You are viewing the Store Manager's operational dashboard.
            </p>
          </div>
        </div>
      )}

      {loading && !data ? (
        <div style={{ padding:'80px 0', textAlign:'center', fontWeight:800, color:C, fontSize:18 }}>Loading Summary...</div>
      ) : (
        <div style={{ padding:'0 32px', display:'flex', flexDirection:'column', gap:24 }}>
          
          {/* DAILY KPIs */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))', gap:24 }}>
            <div className="ds-card" style={{ padding:20, display:'flex', alignItems:'center', gap:16, borderTop:'4px solid #6366f1' }}>
              <div style={{ background:'rgba(99,102,241,.1)', padding:14, borderRadius:12 }}>
                <TrendingUp size={28} color="#4f46e5" />
              </div>
              <div>
                <div style={{ fontSize:11, fontWeight:800, color:'#6b7280', textTransform:'uppercase', letterSpacing:'.05em' }}>Transactions</div>
                <div style={{ fontSize:24, fontWeight:900, color:'#111827' }}>{tx.txCount || 0}</div>
              </div>
            </div>
            
            <div className="ds-card" style={{ padding:20, display:'flex', alignItems:'center', gap:16, borderTop:'4px solid #10b981' }}>
              <div style={{ background:'rgba(16,185,129,.1)', padding:14, borderRadius:12 }}>
                <BarChart2 size={28} color="#059669" />
              </div>
              <div>
                <div style={{ fontSize:11, fontWeight:800, color:'#6b7280', textTransform:'uppercase', letterSpacing:'.05em' }}>Gross Revenue (Today)</div>
                <div style={{ fontSize:24, fontWeight:900, color:'#111827' }}>ETB {fmt(tx.txRevenue)}</div>
              </div>
            </div>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1.5fr 1fr', gap:24 }}>
            
            {/* ACTIVE SHIFTS */}
            <Section icon={Clock} title="Active & Recent Shifts" count={shifts.length}>
              {shifts.length === 0 ? (
                <div style={{ padding:'40px 24px', textAlign:'center', color:'#64748b', fontWeight:700 }}>No shifts found today.</div>
              ) : (
                <table className="ds-tbl">
                  <thead>
                    <tr>
                      <th className="ds-th">Shift ID</th>
                      <th className="ds-th">Cashier</th>
                      <th className="ds-th">Opened At</th>
                      <th className="ds-th" style={{ textAlign:'right' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shifts.map(s => (
                      <tr key={s.id} className="ds-tr">
                        <td className="ds-td">#{s.id}</td>
                        <td className="ds-td"><strong style={{ color:'#1e1b4b' }}>{s.cashier_id}</strong></td>
                        <td className="ds-td" style={{ fontSize:12, color:'#4b5563' }}>{fmtDate(s.opened_at)}</td>
                        <td className="ds-td" style={{ textAlign:'right' }}>
                          <span className={`ds-badge ${s.status?.includes('VERIFIED') ? 'db-ok' : s.status === 'CLOSED' ? 'db-warn' : 'db-neutral'}`}>
                            {s.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Section>

            {/* ORDERS (EXTERNAL/INTERNAL) */}
            <Section icon={ShoppingCart} title="Orders Overview" count={orders.length}>
              {orders.length === 0 ? (
                <div style={{ padding:'40px 24px', textAlign:'center', color:'#64748b', fontWeight:700 }}>No active orders today.</div>
              ) : (
                <table className="ds-tbl">
                  <thead>
                    <tr>
                      <th className="ds-th">Order #</th>
                      <th className="ds-th" style={{ textAlign:'right' }}>Total (ETB)</th>
                      <th className="ds-th" style={{ textAlign:'right' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map(o => (
                      <tr key={o.id} className="ds-tr">
                        <td className="ds-td"><strong style={{ color:'#1e1b4b' }}>{o.order_number}</strong></td>
                        <td className="ds-td" style={{ textAlign:'right', fontWeight:800, color:C }}>{fmt(o.total_amount)}</td>
                        <td className="ds-td" style={{ textAlign:'right' }}>
                          <span className={`ds-badge ${o.status === 'COMPLETED' ? 'db-ok' : o.status === 'CANCELLED' ? 'db-err' : 'db-neutral'}`}>
                            {o.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Section>
          </div>

          {/* LOW STOCK ALERTS */}
          <Section icon={Package} title="Low Stock Alerts" count={lowStock.length}>
            {lowStock.length === 0 ? (
              <div style={{ padding:'40px 24px', textAlign:'center', color:'#64748b', fontWeight:700 }}>Inventory levels are healthy.</div>
            ) : (
              <table className="ds-tbl">
                <thead>
                  <tr>
                    <th className="ds-th">Product (SKU)</th>
                    <th className="ds-th">Category</th>
                    <th className="ds-th" style={{ textAlign:'right' }}>Current Stock</th>
                    <th className="ds-th" style={{ textAlign:'right' }}>Reorder Lvl</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStock.map(p => (
                    <tr key={p.id} className="ds-tr">
                      <td className="ds-td">
                        <strong style={{ color:'#1e1b4b' }}>{p.name}</strong><br/>
                        <span style={{ fontSize:11, color:'#6b7280' }}>{p.sku}</span>
                      </td>
                      <td className="ds-td" style={{ fontSize:12 }}>{p.category || '—'}</td>
                      <td className="ds-td" style={{ textAlign:'right', fontWeight:900, color:'#b91c1c' }}>{p.stock_quantity}</td>
                      <td className="ds-td" style={{ textAlign:'right', fontWeight:700, color:'#4b5563' }}>{p.reorder_level}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Section>

        </div>
      )}
    </div>
  );
}
