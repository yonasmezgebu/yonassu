import React, { useState, useEffect, useCallback } from 'react';
import { DollarSign, AlertTriangle, Clock, ShoppingBag, Lock, Target, TrendingUp, CheckCircle, RefreshCw } from 'lucide-react';
import salesService from '../../services/salesService';
import authService from '../../services/authService';

const BG  = '#FFF7ED';
const C   = '#D97706'; // amber-600
const CD  = '#92400e';
const CL  = '#f59e0b';

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
  @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
  @keyframes spin { to{transform:rotate(360deg)} }
  .ds-page { min-height:calc(100vh - 64px); font-family:'Inter','Segoe UI',sans-serif; padding-bottom:48px; }

  .ds-card {
    --hc:${C}; background:white; border-radius:0; position:relative; overflow:hidden;
    box-shadow:0 4px 20px rgba(100,50,0,.08); transition:transform .2s ease, box-shadow .3s ease;
    animation:fadeUp .5s ease both;
    border-top: 4px solid var(--hc);
  }
  .ds-card:hover { transform:translateY(-2px); box-shadow:0 8px 32px rgba(100,50,0,.15); }

  .ds-head {
    padding:14px 22px; background:linear-gradient(135deg,rgba(217,119,6,.08),rgba(217,119,6,.03));
    display:flex; align-items:center; gap:12px; border-bottom:1px solid rgba(217,119,6,.1);
  }
  .ds-head span { font-size:13px; font-weight:900; letter-spacing:.07em; text-transform:uppercase; color:${C}; }

  .ds-title {
    font-size:2.4rem; font-weight:900; color:#451a03; letter-spacing:-.02em; margin:0;
    display:flex; align-items:center; gap:12px; line-height:1.1;
  }

  .ds-tbl { width:100%; border-collapse:collapse; font-size:13.5px; }
  .ds-th  { text-align:left; padding:11px 14px; background:rgba(217,119,6,.05); border-bottom:2px solid ${C}; color:${C}; font-weight:900; text-transform:uppercase; letter-spacing:.06em; font-size:10.5px; }
  .ds-td  { padding:12px 14px; border-bottom:1px solid rgba(217,119,6,.1); color:#451a03; font-weight:600; vertical-align:middle; }
  .ds-tr:hover .ds-td { background:rgba(217,119,6,.03); }

  .ds-badge {
    padding:5px 12px; border-radius:99px; font-weight:900; font-size:10.5px;
    text-transform:uppercase; letter-spacing:.05em; display:inline-flex; align-items:center; gap:5px; white-space:nowrap;
  }
  .db-ok      { background:linear-gradient(135deg,#f0fdf4,#dcfce7); color:#065f46; border:1px solid #6ee7b7; }
  .db-warn    { background:linear-gradient(135deg,#fffbeb,#fef3c7); color:#92400e; border:1px solid #fde68a; }
  .db-err     { background:linear-gradient(135deg,#fef2f2,#fee2e2); color:#991b1b; border:1px solid #fca5a5; }
  .db-neutral { background:rgba(217,119,6,.08); color:${C}; border:1px solid rgba(217,119,6,.2); }

  .ds-btn {
    display:inline-flex; align-items:center; gap:6px; padding:8px 18px; font-weight:900; font-size:12px;
    cursor:pointer; letter-spacing:.07em; text-transform:uppercase; border-radius:8px;
    box-shadow:0 4px 0 ${CD},0 6px 12px rgba(217,119,6,.18);
    background:linear-gradient(135deg,#fff,${BG}); color:${C}; border:2px solid ${C};
  }
  .ds-btn:active { transform:translateY(4px); box-shadow:none; }
  .ds-btn:disabled { opacity:.55; cursor:not-allowed; }

  .ds-btn-success { background:linear-gradient(135deg,#10b981,#059669); color:white; border:2px solid #064e3b; box-shadow:0 4px 0 #064e3b; }

  .ro-banner {
    background:linear-gradient(135deg,#fef2f2,#fee2e2); border:2px solid #fca5a5;
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
        {count !== undefined && <span style={{ background:'rgba(217,119,6,.15)', borderRadius:99, padding:'2px 10px', fontSize:11, fontWeight:900 }}>{count}</span>}
      </div>
      {children}
    </div>
  );
}

export default function SalesFinanceReview() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(null);

  const user = authService.getCurrentUser();
  const roles = (user?.roles || []).map(r => r.toLowerCase());
  const isFinance = roles.includes('finance') || roles.includes('finance manager') || roles.includes('admin');
  const isManager = roles.includes('store manager') || roles.includes('sales manager');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await salesService.getFinanceReview();
      setData(res?.data || res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const verifyShift = async (id) => {
    if (!window.confirm('Verify this shift?')) return;
    setActing(id);
    try {
      await salesService.financeVerifyShift(id, { status: 'CLOSED_VERIFIED' });
      await load();
    } catch (e) {
      alert('Verification failed');
    } finally {
      setActing(null);
    }
  };

  const verifyCart = async (id) => {
    if (!window.confirm('Verify this POS Cart?')) return;
    setActing(id);
    try {
      await salesService.financeVerifyPOSCart(id, { status: 'VERIFIED' });
      await load();
    } catch (e) {
      alert('Verification failed');
    } finally {
      setActing(null);
    }
  };

  const shifts = data?.shifts || [];
  const posCarts = data?.posCarts || [];
  const tx = data?.transactions || [];
  const margins = data?.margins || [];

  return (
    <div className="ds-page">
      <style>{CSS}</style>
      
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'28px 32px 22px', animation:'fadeUp .35s ease' }}>
        <div>
          <h1 className="ds-title">Finance Review. <DollarSign size={34} color={CL} /></h1>
          <p style={{ fontSize:'.82rem', color:C, fontWeight:800, textTransform:'uppercase', letterSpacing:'.14em', margin:'8px 0 0' }}>
            Reconciliation & Retail Financials
          </p>
        </div>
        <button onClick={load} disabled={loading} className="ds-btn">
          <RefreshCw size={14} style={{ animation:loading ? 'spin 1s linear infinite' : 'none' }} /> Sync
        </button>
      </div>

      {!isFinance && isManager && (
        <div className="ro-banner">
          <Lock size={20} color="#b91c1c" />
          <div>
            <strong style={{ color:'#991b1b', fontSize:13 }}>Store Manager Read-Only View</strong>
            <p style={{ margin:'2px 0 0', color:'#b91c1c', fontSize:12, fontWeight:600 }}>
              Cost prices and margin data are hidden. You can view the status of your shifts and carts but cannot verify them.
            </p>
          </div>
        </div>
      )}

      {loading && !data ? (
        <div style={{ padding:'80px 0', textAlign:'center', fontWeight:800, color:C, fontSize:18 }}>Loading Financial Data...</div>
      ) : (
        <div style={{ padding:'0 32px', display:'flex', flexDirection:'column', gap:24 }}>
          
          {/* SHIFTS RECONCILIATION */}
          <Section icon={Clock} title="Shift Reconciliation" count={shifts.length}>
            {shifts.length === 0 ? (
              <div style={{ padding:'40px 24px', textAlign:'center', color:'#64748b', fontWeight:700 }}>No recent shifts found.</div>
            ) : (
              <div style={{ overflowX:'auto' }}>
                <table className="ds-tbl">
                  <thead>
                    <tr>
                      <th className="ds-th">Cashier / ID</th>
                      <th className="ds-th">Opened - Closed</th>
                      <th className="ds-th" style={{ textAlign:'right' }}>Total Sales</th>
                      <th className="ds-th" style={{ textAlign:'right' }}>Cash / Diff</th>
                      <th className="ds-th">Status</th>
                      {isFinance && <th className="ds-th" style={{ textAlign:'right' }}>Action</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {shifts.map(s => {
                      const diff = parseFloat(s.difference_amount || 0);
                      return (
                        <tr key={s.id} className="ds-tr">
                          <td className="ds-td">
                            <strong style={{ color:'#451a03' }}>Shift #{s.id}</strong><br/>
                            <span style={{ fontSize:12, color:'#64748b' }}>User ID: {s.cashier_id}</span>
                          </td>
                          <td className="ds-td" style={{ fontSize:12 }}>
                            <span style={{ color:'#047857' }}>{fmtDate(s.opened_at)}</span><br/>
                            <span style={{ color:'#b91c1c' }}>{s.closed_at ? fmtDate(s.closed_at) : 'Open'}</span>
                          </td>
                          <td className="ds-td" style={{ textAlign:'right', fontWeight:900, color:C }}>{fmt(s.total_sales)}</td>
                          <td className="ds-td" style={{ textAlign:'right' }}>
                            <div style={{ fontWeight:800, color:'#451a03' }}>Counted: {fmt(s.physical_cash_counted)}</div>
                            {diff !== 0 && (
                              <div style={{ fontSize:11, color: diff < 0 ? '#dc2626' : '#16a34a', fontWeight:800 }}>
                                {diff > 0 ? '+' : ''}{fmt(diff)} ({s.difference_reason || 'No reason'})
                              </div>
                            )}
                          </td>
                          <td className="ds-td">
                            <span className={`ds-badge ${s.status?.includes('VERIFIED') ? 'db-ok' : s.status === 'CLOSED' ? 'db-warn' : 'db-neutral'}`}>
                              {s.status}
                            </span>
                          </td>
                          {isFinance && (
                            <td className="ds-td" style={{ textAlign:'right' }}>
                              {s.status === 'CLOSED' && (
                                <button className="ds-btn ds-btn-success" onClick={()=>verifyShift(s.id)} disabled={acting===s.id} style={{ padding:'6px 12px' }}>
                                  <CheckCircle size={14} /> Verify
                                </button>
                              )}
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Section>

          {/* POS CART SUBMISSIONS */}
          <Section icon={ShoppingBag} title="POS Cart Submissions (To Finance)" count={posCarts.length}>
            <div style={{ maxHeight:400, overflowY:'auto' }}>
              <table className="ds-tbl">
                <thead>
                  <tr>
                    <th className="ds-th">Cart Code</th>
                    <th className="ds-th">Payment Details</th>
                    <th className="ds-th" style={{ textAlign:'right' }}>Amount (ETB)</th>
                    <th className="ds-th">Status</th>
                    {isFinance && <th className="ds-th" style={{ textAlign:'right' }}>Action</th>}
                  </tr>
                </thead>
                <tbody>
                  {posCarts.map(c => (
                    <tr key={c.id} className="ds-tr">
                      <td className="ds-td">
                        <strong style={{ color:'#451a03' }}>{c.cart_code}</strong><br/>
                        <span style={{ fontSize:12, color:'#64748b' }}>{fmtDate(c.created_at)}</span>
                      </td>
                      <td className="ds-td">
                        <div style={{ fontWeight:800 }}>{c.payment_method}</div>
                        <div style={{ fontSize:11, color:'#64748b' }}>Ref: {c.payment_reference || c.txn_id || 'N/A'}</div>
                      </td>
                      <td className="ds-td" style={{ textAlign:'right', fontWeight:900, color:C }}>{fmt(c.payment_amount)}</td>
                      <td className="ds-td">
                        <span className={`ds-badge ${c.status === 'VERIFIED' ? 'db-ok' : c.status === 'REJECTED' ? 'db-err' : 'db-warn'}`}>
                          {c.status}
                        </span>
                      </td>
                      {isFinance && (
                        <td className="ds-td" style={{ textAlign:'right' }}>
                          {(c.status === 'PENDING' || c.status === 'STORE_RELEASED' || c.status === 'FINANCE_SUBMITTED') && (
                            <button className="ds-btn ds-btn-success" onClick={()=>verifyCart(c.id)} disabled={acting===c.id} style={{ padding:'6px 12px' }}>
                              <CheckCircle size={14} /> Verify
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          {/* MARGIN DATA (FINANCE ONLY) */}
          {isFinance && (
            <Section icon={TrendingUp} title="Cost & Margin Analysis (Retail)" count={margins.length}>
              {margins.length === 0 ? (
                <div style={{ padding:'40px 24px', textAlign:'center', color:'#64748b', fontWeight:700 }}>No cost price data found.</div>
              ) : (
                <div style={{ maxHeight:400, overflowY:'auto' }}>
                  <table className="ds-tbl">
                    <thead>
                      <tr>
                        <th className="ds-th">Product Name</th>
                        <th className="ds-th" style={{ textAlign:'right' }}>Cost Price (ETB)</th>
                        <th className="ds-th" style={{ textAlign:'right' }}>Selling Price (ETB)</th>
                        <th className="ds-th" style={{ textAlign:'right' }}>Gross Margin</th>
                      </tr>
                    </thead>
                    <tbody>
                      {margins.map(m => {
                        const cost = parseFloat(m.cost_price || 0);
                        const price = parseFloat(m.price || 0);
                        const margin = price - cost;
                        const marginPct = price > 0 ? (margin / price * 100) : 0;
                        return (
                          <tr key={m.id} className="ds-tr">
                            <td className="ds-td">
                              <strong style={{ color:'#451a03' }}>{m.name}</strong> <span style={{ fontSize:11, color:'#64748b' }}>({m.sku})</span>
                            </td>
                            <td className="ds-td" style={{ textAlign:'right', fontWeight:700, color:'#b91c1c' }}>{fmt(cost)}</td>
                            <td className="ds-td" style={{ textAlign:'right', fontWeight:800, color:'#047857' }}>{fmt(price)}</td>
                            <td className="ds-td" style={{ textAlign:'right' }}>
                              <strong style={{ color: margin < 0 ? '#dc2626' : C }}>{fmt(margin)}</strong>
                              <span style={{ fontSize:11, color:'#64748b', marginLeft:6 }}>({marginPct.toFixed(1)}%)</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </Section>
          )}

        </div>
      )}
    </div>
  );
}
