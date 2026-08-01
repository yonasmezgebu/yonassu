import React, { useState, useEffect, useCallback } from 'react';
import { ShieldCheck, Layers, ShoppingCart, Tag, Check, X, Building2, Package, RefreshCw, AlertTriangle, Briefcase, Box } from 'lucide-react';
import salesService from '../../services/salesService';
import authService from '../../services/authService';

const BG  = '#D5DCF0';
const C   = '#064e3b'; // dark green
const CD  = '#065f46';
const CL  = '#10b981';

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
  @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
  @keyframes spin { to{transform:rotate(360deg)} }
  .ds-page { min-height:calc(100vh - 64px); font-family:'Inter','Segoe UI',sans-serif; padding-bottom:48px; }

  .ds-card {
    --hc:${C}; background:white; border-radius:0; position:relative; overflow:hidden;
    box-shadow:0 4px 20px rgba(0,30,80,.10); transition:transform .2s ease, box-shadow .3s ease;
    animation:fadeUp .5s ease both;
    border-top: 4px solid var(--hc);
  }
  .ds-card:hover { transform:translateY(-2px); box-shadow:0 8px 32px rgba(0,30,80,.18); }

  .ds-head {
    padding:14px 22px; background:linear-gradient(135deg,rgba(6,78,59,.08),rgba(6,78,59,.03));
    display:flex; align-items:center; gap:12px; border-bottom:1px solid rgba(6,78,59,.1);
  }
  .ds-head span { font-size:13px; font-weight:900; letter-spacing:.07em; text-transform:uppercase; color:${C}; }

  .ds-title {
    font-size:2.4rem; font-weight:900; color:#0d1a30; letter-spacing:-.02em; margin:0;
    display:flex; align-items:center; gap:12px; line-height:1.1;
  }

  .ds-tbl { width:100%; border-collapse:collapse; font-size:13.5px; }
  .ds-th  { text-align:left; padding:11px 14px; background:rgba(6,78,59,.05); border-bottom:2px solid ${C}; color:${C}; font-weight:900; text-transform:uppercase; letter-spacing:.06em; font-size:10.5px; }
  .ds-td  { padding:12px 14px; border-bottom:1px solid rgba(6,78,59,.1); color:#2d3748; font-weight:600; vertical-align:middle; }
  .ds-tr:hover .ds-td { background:rgba(6,78,59,.03); }

  .ds-badge {
    padding:5px 12px; border-radius:99px; font-weight:900; font-size:10.5px;
    text-transform:uppercase; letter-spacing:.05em; display:inline-flex; align-items:center; gap:5px; white-space:nowrap;
  }
  .db-ok      { background:linear-gradient(135deg,#f0fdf4,#dcfce7); color:#065f46; border:1px solid #6ee7b7; }
  .db-warn    { background:linear-gradient(135deg,#fffbeb,#fef3c7); color:#92400e; border:1px solid #fde68a; }
  .db-err     { background:linear-gradient(135deg,#fef2f2,#fee2e2); color:#991b1b; border:1px solid #fca5a5; }
  .db-neutral { background:rgba(6,78,59,.08); color:${C}; border:1px solid rgba(6,78,59,.2); }

  .ds-btn {
    display:inline-flex; align-items:center; gap:6px; padding:8px 18px; font-weight:900; font-size:12px;
    cursor:pointer; letter-spacing:.07em; text-transform:uppercase; border-radius:8px;
    box-shadow:0 4px 0 ${CD},0 6px 12px rgba(6,78,59,.18);
    background:linear-gradient(135deg,#fff,${BG}); color:${C}; border:2px solid ${C};
  }
  .ds-btn:active { transform:translateY(4px); box-shadow:none; }
  .ds-btn:disabled { opacity:.55; cursor:not-allowed; }

  .ds-btn-success { background:linear-gradient(135deg,#10b981,#059669); color:white; border:2px solid #064e3b; box-shadow:0 4px 0 #064e3b; }
  .ds-btn-danger  { background:linear-gradient(135deg,#ef4444,#dc2626); color:white; border:2px solid #7f1d1d; box-shadow:0 4px 0 #7f1d1d; }

  .ro-banner {
    background:linear-gradient(135deg,#fffbeb,#fef3c7); border:2px solid #fde68a;
    padding:14px 20px; display:flex; align-items:center; gap:12px; margin:0 32px 20px; animation:fadeUp .4s ease;
  }
`;

const fmt = (v) => Number(v || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function Section({ icon: Icon, title, count, children }) {
  return (
    <div className="ds-card">
      <div className="ds-head">
        <Icon size={20} />
        <span>{title}</span>
        {count !== undefined && <span style={{ background:'rgba(6,78,59,.15)', borderRadius:99, padding:'2px 10px', fontSize:11, fontWeight:900 }}>{count}</span>}
      </div>
      {children}
    </div>
  );
}

export default function SalesCEOReport() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(null);

  const user = authService.getCurrentUser();
  const roles = (user?.roles || []).map(r => r.toLowerCase());
  const isCEO = roles.includes('ceo') || roles.includes('admin');
  const isManager = roles.includes('store manager') || roles.includes('sales manager');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await salesService.getCEOReport();
      setData(res?.data || res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAction = async (id, action) => {
    let reason = null;
    if (action === 'REJECT') {
      reason = prompt('Enter rejection reason:');
      if (!reason) return;
    }
    setActing(id);
    try {
      await salesService.ceoApproveRetailUpdate(id, { action, rejection_reason: reason });
      await load();
    } catch (e) {
      alert('Action failed');
    } finally {
      setActing(null);
    }
  };

  const requests = data?.updateRequests || [];
  const branches = data?.branches || [];
  const orders   = data?.ordersOverview || [];
  const products = data?.productsOverview || [];

  return (
    <div className="ds-page">
      <style>{CSS}</style>
      
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'28px 32px 22px', animation:'fadeUp .35s ease' }}>
        <div>
          <h1 className="ds-title">Retail CEO Report. <ShieldCheck size={34} color={CL} /></h1>
          <p style={{ fontSize:'.82rem', color:C, fontWeight:800, textTransform:'uppercase', letterSpacing:'.14em', margin:'8px 0 0' }}>
            Product Updates & Executive Overview
          </p>
        </div>
        <button onClick={load} disabled={loading} className="ds-btn">
          <RefreshCw size={14} style={{ animation:loading ? 'spin 1s linear infinite' : 'none' }} /> Refresh
        </button>
      </div>

      {!isCEO && isManager && (
        <div className="ro-banner">
          <AlertTriangle size={20} color="#d97706" />
          <div>
            <strong style={{ color:'#92400e', fontSize:13 }}>Store Manager Read-Only View</strong>
            <p style={{ margin:'2px 0 0', color:'#b45309', fontSize:12, fontWeight:600 }}>
              You can see the status of your submitted product updates and the executive summary, but cannot approve/reject items.
            </p>
          </div>
        </div>
      )}

      {loading && !data ? (
        <div style={{ padding:'80px 0', textAlign:'center', fontWeight:800, color:C, fontSize:18 }}>Loading Report...</div>
      ) : (
        <div style={{ padding:'0 32px', display:'flex', flexDirection:'column', gap:24 }}>
          
          {/* UPDATE REQUESTS */}
          <Section icon={Layers} title="Product Update Requests" count={requests.length}>
            {requests.length === 0 ? (
              <div style={{ padding:'40px 24px', textAlign:'center', color:'#64748b', fontWeight:700 }}>No pending update requests.</div>
            ) : (
              <table className="ds-tbl">
                <thead>
                  <tr>
                    <th className="ds-th">Product (SKU)</th>
                    <th className="ds-th">Status</th>
                    <th className="ds-th">Proposed Changes</th>
                    <th className="ds-th">Notes / Reason</th>
                    {isCEO && <th className="ds-th" style={{ textAlign:'right' }}>Action</th>}
                  </tr>
                </thead>
                <tbody>
                  {requests.map(r => (
                    <tr key={r.id} className="ds-tr">
                      <td className="ds-td">
                        <strong style={{ color:'#0d1a30' }}>{r.product_name}</strong>
                        <div style={{ fontSize:11, color:'#64748b' }}>{r.product_sku}</div>
                      </td>
                      <td className="ds-td">
                        <span className={`ds-badge ${r.status==='APPROVED'?'db-ok':r.status==='REJECTED'?'db-err':'db-warn'}`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="ds-td" style={{ fontSize:11 }}>
                        <code style={{ background:'rgba(0,0,0,.04)', padding:'4px 8px', borderRadius:4, display:'inline-block', maxWidth:300, whiteSpace:'pre-wrap' }}>
                          {r.new_data || '{}'}
                        </code>
                      </td>
                      <td className="ds-td" style={{ fontSize:12, color:'#64748b' }}>
                        {r.rejection_reason || '—'}
                      </td>
                      {isCEO && (
                        <td className="ds-td" style={{ textAlign:'right' }}>
                          {r.status === 'PENDING' && (
                            <div style={{ display:'flex', gap:6, justifyContent:'flex-end' }}>
                              <button className="ds-btn ds-btn-success" onClick={()=>handleAction(r.id, 'APPROVE')} disabled={acting===r.id} style={{ padding:'6px 12px' }}>
                                <Check size={14} /> Approve
                              </button>
                              <button className="ds-btn ds-btn-danger" onClick={()=>handleAction(r.id, 'REJECT')} disabled={acting===r.id} style={{ padding:'6px 12px' }}>
                                <X size={14} /> Reject
                              </button>
                            </div>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Section>

          {/* TWO COLUMNS: BRANCHES AND REVENUE */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24 }}>
            <Section icon={Building2} title="Active Branches" count={branches.length}>
              <table className="ds-tbl">
                <thead>
                  <tr>
                    <th className="ds-th">Branch Name</th>
                    <th className="ds-th">Manager</th>
                    <th className="ds-th" style={{ textAlign:'right' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {branches.map(b => (
                    <tr key={b.id} className="ds-tr">
                      <td className="ds-td"><strong style={{ color:'#0d1a30' }}>{b.name}</strong> <span style={{ color:'#64748b', fontSize:11 }}>({b.code})</span></td>
                      <td className="ds-td">{b.manager_name || '—'}</td>
                      <td className="ds-td" style={{ textAlign:'right' }}>
                        <span className={`ds-badge ${b.is_active ? 'db-ok' : 'db-neutral'}`}>{b.is_active ? 'ACTIVE' : 'INACTIVE'}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Section>
            
            <Section icon={ShoppingCart} title="Orders & Revenue (Retail)" count={orders.length}>
              <table className="ds-tbl">
                <thead>
                  <tr>
                    <th className="ds-th">Order Status</th>
                    <th className="ds-th" style={{ textAlign:'right' }}>Volume</th>
                    <th className="ds-th" style={{ textAlign:'right' }}>Revenue (ETB)</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o, i) => (
                    <tr key={i} className="ds-tr">
                      <td className="ds-td" style={{ fontWeight:800 }}>{o.status || 'UNKNOWN'}</td>
                      <td className="ds-td" style={{ textAlign:'right' }}>{o.count}</td>
                      <td className="ds-td" style={{ textAlign:'right', color:C, fontWeight:900 }}>{fmt(o.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Section>
          </div>

          {/* CATALOG OVERVIEW */}
          <Section icon={Box} title="Product Catalog Overview" count={products.length}>
            <table className="ds-tbl">
              <thead>
                <tr>
                  <th className="ds-th">Product Name</th>
                  <th className="ds-th">SKU / Category</th>
                  <th className="ds-th" style={{ textAlign:'right' }}>Price (ETB)</th>
                  <th className="ds-th" style={{ textAlign:'right' }}>Stock / Reorder</th>
                </tr>
              </thead>
              <tbody>
                {products.map(p => (
                  <tr key={p.id} className="ds-tr">
                    <td className="ds-td"><strong style={{ color:'#0d1a30' }}>{p.name}</strong></td>
                    <td className="ds-td" style={{ fontSize:12, color:'#64748b' }}>{p.sku} <br/> {p.category}</td>
                    <td className="ds-td" style={{ textAlign:'right', fontWeight:900, color:C }}>{fmt(p.price)}</td>
                    <td className="ds-td" style={{ textAlign:'right' }}>
                      <span className={`ds-badge ${p.stock_quantity <= p.reorder_level ? 'db-err' : 'db-ok'}`}>
                        {p.stock_quantity} / {p.reorder_level}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>

        </div>
      )}
    </div>
  );
}
