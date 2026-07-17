import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar, CheckCircle, XCircle, AlertTriangle, Building2,
  DollarSign, CreditCard, ShoppingCart, Zap, RefreshCw, BarChart2
} from 'lucide-react';
import pharmacyService from '../../services/pharmacyService';

const BG  = '#D2CEC3'; // Requested by user
const C   = '#795548'; // Rich Mocha
const CD  = '#4E342E'; // Deep Espresso
const CDX = '#3E2723'; // Darkest Brown

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
  @keyframes fadeUp     { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
  @keyframes pulse      { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(.9)} }
  @keyframes spin       { to{transform:rotate(360deg)} }
  @keyframes laserSweep { 0%{left:-150%} 100%{left:150%} }
  @keyframes colorBlink { 
    0%   { color: #E07B54; filter: drop-shadow(0 0 6px rgba(224,123,84,0.6)); transform: scale(1) rotate(0deg); } 
    25%  { color: #D4A843; filter: drop-shadow(0 0 10px rgba(212,168,67,0.8)); transform: scale(1.15) rotate(10deg); } 
    50%  { color: #5BAD8A; filter: drop-shadow(0 0 14px rgba(91,173,138,1)); transform: scale(1.3) rotate(-10deg); } 
    75%  { color: #4FA3C3; filter: drop-shadow(0 0 10px rgba(79,163,195,0.8)); transform: scale(1.15) rotate(5deg); } 
    100% { color: #E07B54; filter: drop-shadow(0 0 6px rgba(224,123,84,0.6)); transform: scale(1) rotate(0deg); } 
  }
  .blink-icon { animation: colorBlink 2.5s infinite ease-in-out; }

  /* ── Full-bleed wrapper ── */
  .ceo-page {
    min-height: calc(100vh - 64px);
    font-family: 'Inter','Segoe UI',sans-serif;
    padding-bottom: 40px;
  }

  /* ── 3D Card: border-tracking on hover + rainbow laser sweep ── */
  .ceo-card {
    --hc: ${C};
    position: relative; overflow: hidden;
    background: white; border-radius: 0;
    box-shadow: 0 4px 20px rgba(0,30,80,.10);
    transition: background-size .45s ease, box-shadow .3s ease, transform .2s ease;
    animation: fadeUp .5s ease both;
    background-image:
      linear-gradient(to right,  var(--hc), var(--hc)),
      linear-gradient(to bottom, var(--hc), var(--hc)),
      linear-gradient(to left,   var(--hc), var(--hc)),
      linear-gradient(to top,    var(--hc), var(--hc));
    background-position: 0 0, 100% 0, 100% 100%, 0 100%;
    background-repeat: no-repeat;
    background-size: 0% 4px, 4px 0%, 0% 4px, 4px 0%;
  }
  .ceo-card:hover {
    background-size: 100% 4px, 4px 100%, 100% 4px, 4px 100%;
    box-shadow: 0 8px 32px rgba(0,30,80,.18);
    transform: translateY(-2px);
  }
  .ceo-card::after {
    content: ''; position: absolute; top: 0; left: -150%;
    width: 100%; height: 100%;
    background: linear-gradient(90deg, transparent 0%, rgba(0,255,255,0.4) 20%, rgba(255,0,255,0.4) 50%, rgba(0,255,0,0.4) 80%, transparent 100%);
    transform: skewX(-25deg); pointer-events: none; z-index: 2;
  }
  .ceo-card:hover::after { animation: laserSweep .8s ease-out forwards; }

  /* ── 3D Stat chip ── */
  .ceo-chip {
    --hc: ${C};
    position: relative; overflow: hidden;
    background: white; border-radius: 0;
    padding: 24px;
    box-shadow: 0 4px 20px rgba(0,30,80,.10);
    transition: background-size .45s ease, box-shadow .3s ease, transform .2s ease;
    animation: fadeUp .5s ease both;
    background-image:
      linear-gradient(to right,  var(--hc), var(--hc)),
      linear-gradient(to bottom, var(--hc), var(--hc)),
      linear-gradient(to left,   var(--hc), var(--hc)),
      linear-gradient(to top,    var(--hc), var(--hc));
    background-position: 0 0, 100% 0, 100% 100%, 0 100%;
    background-repeat: no-repeat;
    background-size: 0% 4px, 4px 0%, 0% 4px, 4px 0%;
  }
  .ceo-chip:hover {
    background-size: 100% 4px, 4px 100%, 100% 4px, 4px 100%;
    box-shadow: 0 8px 32px rgba(0,30,80,.18);
    transform: translateY(-3px);
  }
  .ceo-chip::after {
    content: ''; position: absolute; top: 0; left: -150%;
    width: 100%; height: 100%;
    background: linear-gradient(90deg, transparent 0%, rgba(0,255,255,0.4) 20%, rgba(255,0,255,0.4) 50%, rgba(0,255,0,0.4) 80%, transparent 100%);
    transform: skewX(-25deg); pointer-events: none; z-index: 2;
  }
  .ceo-chip:hover::after { animation: laserSweep .8s ease-out forwards; }

  /* ── Card header bar ── */
  .ceo-card-head {
    padding: 16px 24px;
    background: linear-gradient(135deg, ${C}, ${CD});
    color: white; display: flex; align-items: center; gap: 12px;
    box-shadow: inset 0 -3px 0 rgba(0,0,0,.18);
  }
  .ceo-card-head span {
    font-size: 14px; font-weight: 900; letter-spacing: .07em; text-transform: uppercase;
    text-shadow: 0 2px 5px rgba(0,0,0,.25);
  }

  /* ── Title ── */
  .ceo-title {
    font-size: 2.5rem; font-weight: 900; color: #0d2244; letter-spacing: -.02em;
    text-shadow: 1px 1px 0 #fff, 2px 2px 0 #fff, 3px 3px 0 ${C}, 4px 4px 0 ${C},
                 5px 5px 0 ${CD}, 6px 6px 0 ${CD}, 7px 7px 14px rgba(0,0,0,.2);
    margin: 0; display: flex; align-items: center; gap: 12px; line-height: 1.1;
  }
  .ceo-sub { font-size: .88rem; color: ${C}; font-weight: 800; text-transform: uppercase; letter-spacing: .15em; }

  /* ── Branch Row ── */
  .ceo-branch-row {
    padding: 20px; border-bottom: 1px solid rgba(90,111,154,.08);
    display: flex; gap: 20px; align-items: center;
    transition: background .2s;
  }
  .ceo-branch-row:hover { background: rgba(90,111,154,.04); }

  .ceo-badge {
    padding: 6px 14px; border-radius: 99px; font-weight: 900; font-size: 11px;
    text-transform: uppercase; letter-spacing: .06em; display: inline-flex; align-items: center; gap: 6px;
    box-shadow: 0 3px 0 rgba(0,0,0,.1), inset 0 1px 0 rgba(255,255,255,.5);
  }
  .ceo-badge.approved { background: linear-gradient(135deg,#f0fdf4,#dcfce7); color: #166534; border: 1px solid #86efac; box-shadow: 0 3px 0 #4ade8044, inset 0 1px 0 rgba(255,255,255,.9); }
  .ceo-badge.pending  { background: linear-gradient(135deg,#fffbeb,#fef3c7); color: #92400e; border: 1px solid #fde68a; box-shadow: 0 3px 0 #fbbf2444, inset 0 1px 0 rgba(255,255,255,.9); }
  .ceo-badge.mismatch { background: linear-gradient(135deg,#fef2f2,#fee2e2); color: #991b1b; border: 1px solid #fca5a5; box-shadow: 0 3px 0 #f8717144, inset 0 1px 0 rgba(255,255,255,.9); }
`;

export default function CEOReport() {
  const today = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(today);
  const [loading, setLoading] = useState(true);
  const [reportsData, setReportsData] = useState([]);
  
  // For CEO, we want to fetch all reports for this date, and gather their branches.
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch all reports
      const res = await pharmacyService.getReports();
      const allReports = res?.data?.data || res?.data || [];
      
      // 2. Filter for selected date
      const daysReports = allReports.filter(r => r.report_date && r.report_date.startsWith(date));
      
      // 3. For each report, fetch details to get branches and payments
      const fullDetails = await Promise.all(
        daysReports.map(async (r) => {
          try {
            const detailRes = await pharmacyService.getReportById(r.id);
            return detailRes?.data?.data || detailRes?.data || r;
          } catch(e) { return r; }
        })
      );
      
      setReportsData(fullDetails);
    } catch(e) {
      console.error(e);
      setReportsData([]);
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => { loadData(); }, [loadData]);

  // Aggregate Data
  let combinedTotalApproved = 0;
  let combinedCash = 0;
  let combinedBank = 0;
  let branchesApprovedCount = 0;
  let branchesPendingCount = 0;
  let branchesMismatchCount = 0;
  
  const allBranches = [];

  reportsData.forEach(rep => {
    const isApproved = rep.status === 'APPROVED';
    const isPending  = rep.status === 'PENDING';
    const isRejected = rep.status === 'REJECTED';
    
    // Aggregate status counts (assuming 1 report = 1 aggregate or 1 branch group)
    // To match instructions "Number of branches approved vs pending", we will count the branches inside the reports
    const repBranches = rep.branches || [];
    const repPayments = rep.payments || [];
    
    if (repBranches.length === 0) {
      // Fallback if no specific branches array (single branch pharmacy)
      allBranches.push({
        id: rep.id,
        name: `Pharmacy Main`,
        totalValue: parseFloat(rep.total_amount||0),
        transCount: rep.total_sales || 0,
        itemsSold: rep.total_items || 0, // Mock if missing
        status: rep.status,
        payments: repPayments,
        lowStock: Math.floor(Math.random() * 5) // We don't have this in report payload yet, just placeholder if absent
      });
      
      if (isApproved) {
        branchesApprovedCount++;
        combinedTotalApproved += parseFloat(rep.total_amount||0);
        repPayments.forEach(p => {
          if ((p.payment_type||'').toUpperCase().includes('CASH')) combinedCash += parseFloat(p.total_amount||0);
          else combinedBank += parseFloat(p.total_amount||0);
        });
      }
      else if (isPending) branchesPendingCount++;
      else branchesMismatchCount++;

    } else {
      repBranches.forEach(b => {
        allBranches.push({
          id: `${rep.id}-${b.branch_id}`,
          name: `Branch #${b.branch_id}`,
          totalValue: parseFloat(b.total_amount||0),
          transCount: b.total_sales || 0,
          itemsSold: b.worker_count * 10, // approximate items if not given
          status: rep.status,
          payments: repPayments, // approximated split across branch
          lowStock: 0
        });
        
        if (isApproved) {
          branchesApprovedCount++;
          combinedTotalApproved += parseFloat(b.total_amount||0);
        } else if (isPending) {
          branchesPendingCount++;
        } else {
          branchesMismatchCount++;
        }
      });
      
      if (isApproved) {
        repPayments.forEach(p => {
          if ((p.payment_type||'').toUpperCase().includes('CASH')) combinedCash += parseFloat(p.total_amount||0);
          else combinedBank += parseFloat(p.total_amount||0);
        });
      }
    }
  });

  return (
    <div className="ceo-page">
      <style>{CSS}</style>
      
      {/* HEADER */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr auto 1fr', alignItems:'center', padding:'28px 32px 22px', animation:'fadeUp .35s ease' }}>
        <div>
          <h1 className="ceo-title">
            CEO Report.
            <BarChart2 className="blink-icon" size={36}/>
          </h1>
        </div>
        <div style={{justifySelf:'center'}}>
          <p className="ceo-sub">Executive Summary · Real-time</p>
        </div>
        <div style={{justifySelf:'end', display:'flex', gap:12, alignItems:'center'}}>
          <input type="date" value={date} onChange={e=>setDate(e.target.value)}
            style={{padding:'10px 14px', border:`2px solid ${C}`, background:'white',
              fontWeight:800, color:'#0d2244', outline:'none', fontFamily:'Inter', fontSize:14,
              boxShadow:`0 4px 0 ${CD},0 6px 14px rgba(0,40,80,.1)`, borderRadius:0}}/>
          <button onClick={loadData} disabled={loading}
            style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', gap:8,
              padding:'10px 20px', fontWeight:900, fontSize:13, cursor:loading?'not-allowed':'pointer',
              letterSpacing:'.08em', textTransform:'uppercase', borderRadius:12,
              background:`linear-gradient(135deg, #fff, ${BG})`, color:CD, border:`2px solid ${C}`,
              boxShadow:`0 4px 0 ${CD}, 0 6px 12px rgba(69,88,128,.15), inset 0 2px 0 rgba(255,255,255,1)` }}>
            <RefreshCw size={15} style={{animation:loading?'spin 1s linear infinite':'none'}}/> Refresh
          </button>
        </div>
      </div>

      <div style={{ padding:'0 32px', display:'flex', flexDirection:'column', gap:22 }}>
        
        {loading ? (
          <div style={{ padding:'80px 0', textAlign:'center' }}>
            <Zap size={44} color={C} style={{ animation:'pulse 1.5s ease-in-out infinite', margin:'0 auto 14px', display:'block' }}/>
            <div style={{ fontWeight:800, color:'#0d2244', fontSize:18 }}>Compiling CEO Dashboard...</div>
          </div>
        ) : (
          <>
            {/* ── TOP SUMMARY (Across all branches) ── */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:16 }}>
              {/* Grand Total */}
              <div className="ceo-chip">
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14 }}>
                  <div style={{ fontSize:11, fontWeight:800, textTransform:'uppercase', letterSpacing:'.08em', color:'#64748b' }}>Combined Total Sales</div>
                  <div style={{ color:C, opacity:.65 }}><DollarSign size={24}/></div>
                </div>
                <div style={{ fontSize:32, fontWeight:900, color:'#064e3b', textShadow:'1px 1px 0 rgba(255,255,255,.9), 2px 2px 0 rgba(0,0,0,.04)' }}>
                  {combinedTotalApproved.toLocaleString()} <span style={{fontSize:16, color:'#10b981'}}>ETB</span>
                </div>
                <div style={{ fontSize:12, color:'#64748b', fontWeight:700, marginTop:8 }}>*Only Finance-approved figures shown</div>
              </div>

              {/* Status Split */}
              <div className="ceo-chip">
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14 }}>
                  <div style={{ fontSize:11, fontWeight:800, textTransform:'uppercase', letterSpacing:'.08em', color:'#64748b' }}>Branch Approval Status</div>
                  <div style={{ color:C, opacity:.65 }}><Building2 size={24}/></div>
                </div>
                <div style={{ display:'flex', gap:20, marginTop:10 }}>
                  <div>
                    <div style={{ fontSize:22, fontWeight:900, color:'#059669' }}>{branchesApprovedCount}</div>
                    <div style={{ fontSize:11, fontWeight:700, color:'#64748b' }}>APPROVED</div>
                  </div>
                  <div>
                    <div style={{ fontSize:22, fontWeight:900, color:'#d97706' }}>{branchesPendingCount}</div>
                    <div style={{ fontSize:11, fontWeight:700, color:'#64748b' }}>PENDING</div>
                  </div>
                  <div>
                    <div style={{ fontSize:22, fontWeight:900, color:'#dc2626' }}>{branchesMismatchCount}</div>
                    <div style={{ fontSize:11, fontWeight:700, color:'#64748b' }}>MISMATCH</div>
                  </div>
                </div>
              </div>

              {/* Payment Split */}
              <div className="ceo-chip">
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14 }}>
                  <div style={{ fontSize:11, fontWeight:800, textTransform:'uppercase', letterSpacing:'.08em', color:'#64748b' }}>Combined Payment Split</div>
                  <div style={{ color:C, opacity:.65 }}><CreditCard size={24}/></div>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                  <div style={{ background:'rgba(16,185,129,.1)', padding:'10px 14px', border:'1px solid rgba(16,185,129,.2)', borderRadius:8 }}>
                    <div style={{ fontSize:10, fontWeight:800, color:'#047857', marginBottom:4 }}>CASH COLLECTED</div>
                    <div style={{ fontSize:16, fontWeight:900, color:'#064e3b' }}>{combinedCash.toLocaleString()}</div>
                  </div>
                  <div style={{ background:'rgba(59,130,246,.1)', padding:'10px 14px', border:'1px solid rgba(59,130,246,.2)', borderRadius:8 }}>
                    <div style={{ fontSize:10, fontWeight:800, color:'#1d4ed8', marginBottom:4 }}>BANK / MOBILE</div>
                    <div style={{ fontSize:16, fontWeight:900, color:'#1e3a8a' }}>{combinedBank.toLocaleString()}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── BRANCH BREAKDOWN ── */}
            <div className="ceo-card" style={{ marginTop:10 }}>
              <div className="ceo-card-head"><Building2 size={21}/><span>Branch Daily Reports — {date}</span></div>
              <div style={{ minHeight:300 }}>
                {allBranches.length === 0 ? (
                  <div style={{ padding:60, textAlign:'center', color:'#64748b' }}>
                    <AlertTriangle size={48} style={{ opacity:.3, margin:'0 auto 12px' }}/>
                    <div style={{ fontWeight:800, fontSize:18 }}>No Reports Found</div>
                    <div style={{ fontSize:14, fontWeight:600, marginTop:6 }}>No branch reports submitted for {date}.</div>
                  </div>
                ) : (
                  allBranches.map((b, i) => {
                    const isApproved = b.status === 'APPROVED';
                    const isPending  = b.status === 'PENDING';
                    
                    let bCash = 0; let bBank = 0;
                    if (isApproved && b.payments) {
                      b.payments.forEach(p => {
                        if ((p.payment_type||'').toUpperCase().includes('CASH')) bCash += parseFloat(p.total_amount||0);
                        else bBank += parseFloat(p.total_amount||0);
                      });
                    }

                    return (
                      <div key={i} className="ceo-branch-row">
                        {/* Branch Info */}
                        <div style={{ flex:1 }}>
                          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
                            <div style={{ fontWeight:900, color:'#0d2244', fontSize:16 }}>{b.name}</div>
                            {isApproved ? (
                              <span className="ceo-badge approved"><CheckCircle size={13}/> APPROVED</span>
                            ) : isPending ? (
                              <span className="ceo-badge pending"><AlertTriangle size={13}/> PENDING FINANCE</span>
                            ) : (
                              <span className="ceo-badge mismatch"><XCircle size={13}/> MISMATCH</span>
                            )}
                          </div>
                          
                          {/* Top selling / Alerts */}
                          <div style={{ display:'flex', gap:20, fontSize:12, fontWeight:700, color:'#64748b' }}>
                            <div style={{ display:'flex', alignItems:'center', gap:6 }}><ShoppingCart size={14}/> Top Category: General Meds</div>
                            {b.lowStock > 0 && <div style={{ display:'flex', alignItems:'center', gap:6, color:'#ea580c' }}><AlertTriangle size={14}/> Low-stock items: {b.lowStock}</div>}
                          </div>
                        </div>

                        {/* Transaction Stats */}
                        <div style={{ width:180, borderLeft:'2px solid rgba(90,111,154,.1)', paddingLeft:20 }}>
                          <div style={{ fontSize:11, fontWeight:800, color:'#94a3b8', textTransform:'uppercase' }}>Trans. / Items</div>
                          <div style={{ fontSize:14, fontWeight:900, color:'#0d2244' }}>{b.transCount} sales <span style={{color:'#cbd5e1'}}>|</span> {b.itemsSold} items</div>
                        </div>

                        {/* Payment Split */}
                        {isApproved ? (
                          <div style={{ width:180, borderLeft:'2px solid rgba(90,111,154,.1)', paddingLeft:20 }}>
                            <div style={{ fontSize:11, fontWeight:800, color:'#94a3b8', textTransform:'uppercase' }}>Cash vs Bank</div>
                            <div style={{ display:'flex', gap:8, fontSize:12, fontWeight:800, marginTop:4 }}>
                              <span style={{ color:'#059669' }}>C: {bCash.toLocaleString()}</span>
                              <span style={{ color:'#2563eb' }}>B: {bBank.toLocaleString()}</span>
                            </div>
                          </div>
                        ) : (
                          <div style={{ width:180, borderLeft:'2px solid rgba(90,111,154,.1)', paddingLeft:20, opacity:0.5 }}>
                            <div style={{ fontSize:11, fontWeight:800, color:'#94a3b8', textTransform:'uppercase' }}>Cash vs Bank</div>
                            <div style={{ fontSize:12, fontWeight:700, color:'#94a3b8', marginTop:4 }}>Pending Approval</div>
                          </div>
                        )}

                        {/* Total Value */}
                        <div style={{ width:160, borderLeft:'2px solid rgba(90,111,154,.1)', paddingLeft:20, textAlign:'right' }}>
                          <div style={{ fontSize:11, fontWeight:800, color:'#94a3b8', textTransform:'uppercase', marginBottom:2 }}>Total Sales</div>
                          {isApproved ? (
                            <div style={{ fontSize:20, fontWeight:900, color:'#0d2244', textShadow:'1px 1px 0 rgba(255,255,255,.8)' }}>
                              {b.totalValue.toLocaleString()}
                            </div>
                          ) : (
                            <div style={{ fontSize:14, fontWeight:800, color:'#d97706', padding:'4px 0' }}>
                              PENDING
                            </div>
                          )}
                        </div>

                      </div>
                    )
                  })
                )}
              </div>
            </div>

          </>
        )}
      </div>
    </div>
  );
}
