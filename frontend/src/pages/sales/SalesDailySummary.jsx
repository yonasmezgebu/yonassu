import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar, Send, ShoppingCart, User, CreditCard,
  CheckCircle, XCircle, Loader2, FileText, AlertTriangle,
  Building2, RefreshCw, Zap, DollarSign
} from 'lucide-react';
import apiClient from '../../services/apiClient';

const BG  = '#D5DCF0';
const C   = '#5A6F9A';
const CD  = '#455880';
const CDX = '#2a3854';

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
  @keyframes fadeUp     { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
  @keyframes pulse      { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(.9)} }
  @keyframes spin       { to{transform:rotate(360deg)} }
  @keyframes laserSweep { 0%{left:-150%} 100%{left:150%} }

  /* ── Full-bleed wrapper ── */
  .ds-page {
    min-height: calc(100vh - 64px);
    font-family: 'Inter','Segoe UI',sans-serif;
    padding-bottom: 40px;
  }

  /* ── 3D Card: border-tracking on hover + laser sweep ── */
  .ds-card {
    --hc: ${C};
    position: relative; overflow: hidden;
    background: white; border-radius: 0;
    box-shadow: 0 4px 20px rgba(0,30,80,.10);
    transition: background-size .45s ease, box-shadow .3s ease, transform .2s ease;
    animation: fadeUp .5s ease both;
    /* 4-side border tracking — starts at 0 */
    background-image:
      linear-gradient(to right,  var(--hc), var(--hc)),
      linear-gradient(to bottom, var(--hc), var(--hc)),
      linear-gradient(to left,   var(--hc), var(--hc)),
      linear-gradient(to top,    var(--hc), var(--hc));
    background-position: 0 0, 100% 0, 100% 100%, 0 100%;
    background-repeat: no-repeat;
    background-size: 0% 4px, 4px 0%, 0% 4px, 4px 0%;
  }
  .ds-card:hover {
    background-size: 100% 4px, 4px 100%, 100% 4px, 4px 100%;
    box-shadow: 0 8px 32px rgba(0,30,80,.18);
    transform: translateY(-2px);
  }
  /* laser sweep */
  .ds-card::after {
    content: ''; position: absolute; top: 0; left: -150%;
    width: 100%; height: 100%;
    background: linear-gradient(90deg, transparent 0%, rgba(0,255,255,0.4) 20%, rgba(255,0,255,0.4) 50%, rgba(0,255,0,0.4) 80%, transparent 100%);
    transform: skewX(-25deg); pointer-events: none; z-index: 2;
  }
  .ds-card:hover::after { animation: laserSweep .8s ease-out forwards; }

  /* ── 3D Stat chip ── */
  .ds-chip {
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
  .ds-chip:hover {
    background-size: 100% 4px, 4px 100%, 100% 4px, 4px 100%;
    box-shadow: 0 8px 32px rgba(0,30,80,.18);
    transform: translateY(-3px);
  }
  .ds-chip::after {
    content: ''; position: absolute; top: 0; left: -150%;
    width: 100%; height: 100%;
    background: linear-gradient(90deg, transparent 0%, rgba(0,255,255,0.4) 20%, rgba(255,0,255,0.4) 50%, rgba(0,255,0,0.4) 80%, transparent 100%);
    transform: skewX(-25deg); pointer-events: none; z-index: 2;
  }
  .ds-chip:hover::after { animation: laserSweep .8s ease-out forwards; }

  /* ── Card header bar ── */
  .ds-card-head {
    padding: 18px 24px;
    background: linear-gradient(135deg, ${C}, ${CD});
    color: white; display: flex; align-items: center; gap: 12px;
    box-shadow: inset 0 -3px 0 rgba(0,0,0,.18);
  }
  .ds-card-head span {
    font-size: 15px; font-weight: 900; letter-spacing: .07em; text-transform: uppercase;
    text-shadow: 0 2px 5px rgba(0,0,0,.25);
  }

  /* ── 3D Buttons ── */
  .ds-btn-ghost {
    display: inline-flex; align-items: center; justify-content: center; gap: 8px;
    padding: 11px 22px; font-weight: 900; font-size: 13px; cursor: pointer;
    letter-spacing: .08em; text-transform: uppercase; border-radius: 0;
    background: linear-gradient(135deg, #fff, ${BG}); color: ${CD}; border: 2px solid ${C};
    box-shadow: 0 5px 0 ${CD}, 0 8px 14px rgba(0,40,80,.13), inset 0 2px 0 rgba(255,255,255,1);
    transition: all .1s; font-family: 'Inter', sans-serif;
  }
  .ds-btn-ghost:active:not(:disabled)  { transform: translateY(5px); box-shadow: 0 0 0 ${CD}; }
  .ds-btn-ghost:hover:not(:disabled)   { filter: brightness(1.04); }
  .ds-btn-ghost:disabled               { filter: grayscale(.7) opacity(.7); cursor: not-allowed; }

  .ds-btn-submit {
    display: inline-flex; align-items: center; justify-content: center; gap: 10px;
    padding: 15px 28px; font-weight: 900; font-size: 15px; cursor: pointer;
    letter-spacing: .1em; text-transform: uppercase; border-radius: 0;
    background: linear-gradient(135deg, #10b981, #059669); color: white; border: 2px solid #047857;
    box-shadow: 0 6px 0 #064e3b, 0 10px 20px rgba(6,78,59,.28), inset 0 2px 0 rgba(255,255,255,.18);
    transition: all .1s; font-family: 'Inter', sans-serif; width: 100%;
  }
  .ds-btn-submit:active:not(:disabled) { transform: translateY(6px); box-shadow: 0 0 0 #064e3b; }
  .ds-btn-submit:hover:not(:disabled)  { filter: brightness(1.08); }
  .ds-btn-submit:disabled              { filter: grayscale(.8) opacity(.7); cursor: not-allowed; transform: translateY(6px); box-shadow: none; }

  /* ── Table ── */
  .ds-tbl { width: 100%; border-collapse: collapse; font-size: 14px; }
  .ds-th  {
    text-align: left; padding: 12px 16px;
    background: linear-gradient(135deg, rgba(90,111,154,.14), rgba(69,88,128,.07));
    border-bottom: 3px solid ${C}; color: ${CD}; font-weight: 900;
    text-transform: uppercase; letter-spacing: .06em; font-size: 11px;
    text-shadow: 0 1px 0 rgba(255,255,255,.85);
  }
  .ds-td  { padding: 13px 16px; border-bottom: 1px solid rgba(90,111,154,.09); color: #2d3748; font-weight: 600; }
  .ds-tr:hover .ds-td { background: rgba(90,111,154,.06); }

  /* ── Avatar ── */
  .ds-av {
    width: 34px; height: 34px; border-radius: 0; flex-shrink: 0;
    background: linear-gradient(135deg, ${C}, ${CD}); color: white;
    display: flex; align-items: center; justify-content: center;
    font-weight: 900; font-size: 14px;
    border: 2px solid rgba(255,255,255,.9);
    box-shadow: 0 4px 8px rgba(69,88,128,.38), inset 0 1px 0 rgba(255,255,255,.25);
  }

  /* ── Badge ── */
  .ds-badge {
    display: inline-block; padding: 4px 11px; font-weight: 800; font-size: 11px;
    letter-spacing: .04em; text-transform: uppercase;
    background: linear-gradient(135deg, rgba(90,111,154,.14), rgba(90,111,154,.05));
    color: ${CD}; border: 1px solid rgba(90,111,154,.28);
    box-shadow: 0 2px 0 rgba(90,111,154,.18), inset 0 1px 0 rgba(255,255,255,.9);
    border-radius: 0;
  }

  /* ── Title ── */
  .ds-title {
    font-size: 2.5rem; font-weight: 900; color: #0d2244; letter-spacing: -.02em;
    text-shadow: 1px 1px 0 #fff, 2px 2px 0 #fff, 3px 3px 0 ${C}, 4px 4px 0 ${C},
                 5px 5px 0 ${CD}, 6px 6px 0 ${CD}, 7px 7px 14px rgba(0,0,0,.2);
    margin: 0; display: flex; align-items: center; gap: 12px; line-height: 1.1;
  }
  .ds-sub { font-size: .88rem; color: ${C}; font-weight: 800; text-transform: uppercase; letter-spacing: .15em; }
`;

const Toast = ({ msg }) => msg?.text ? (
  <div style={{ position:'fixed',top:20,right:20,zIndex:9999,padding:'13px 22px',fontWeight:700,fontSize:14,
    background:msg.type==='success'?'#f0fdf4':'#fef2f2',border:`2px solid ${msg.type==='success'?'#10b981':'#ef4444'}`,
    color:msg.type==='success'?'#064e3b':'#991b1b',display:'flex',alignItems:'center',gap:10,
    boxShadow:'0 6px 16px rgba(0,0,0,.12)',animation:'fadeUp .3s ease',borderRadius: 0,
  }}>
    {msg.type==='success'?<CheckCircle size={18}/>:<XCircle size={18}/>}
    {msg.text}
  </div>
) : null;

export default function SalesDailySummary() {
  const today = new Date().toISOString().split('T')[0];
  const [date,      setDate]      = useState(today);
  const [sales,     setSales]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [submitting,setSubmitting]= useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [msg,       setMsg]       = useState(null);

  const showMsg = (t,x) => { setMsg({type:t,text:x}); setTimeout(()=>setMsg(null),4000); };

  const load = useCallback(async () => {
    setLoading(true); setSubmitted(false);
    try {
      const r = await apiClient.get(`/sales?start_date=${date}T00:00:00&end_date=${date}T23:59:59`);
      setSales(Array.isArray(r?.data?.data) ? r.data.data : []);
    } catch { showMsg('error','Failed to load sales'); setSales([]); }
    finally  { setLoading(false); }
  }, [date]);

  useEffect(()=>{ load(); },[load]);

  const sysTotal = sales.reduce((s,r)=>s+parseFloat(r.total_amount||0),0);
  const count    = sales.length;

  const cashierMap = sales.reduce((acc,s)=>{
    const n = s.worker_name||'Unassigned';
    if(!acc[n]) acc[n]={count:0,total:0,methods:{}};
    acc[n].count++; acc[n].total+=parseFloat(s.total_amount||0);
    const m=s.payment_method||'CASH';
    acc[n].methods[m]=(acc[n].methods[m]||0)+parseFloat(s.total_amount||0);
    return acc;
  },{});

  const payMap = sales.reduce((acc,s)=>{
    const m=s.payment_method||'CASH';
    acc[m]=(acc[m]||0)+parseFloat(s.total_amount||0);
    return acc;
  },{});

  const collected = Object.values(payMap).reduce((s,v)=>s+v,0);
  const isMatch   = Math.abs(sysTotal-collected)<0.05;
  const pCol      = {CASH:'#10b981',BANK_TRANSFER:'#3b82f6',TELBIR:'#8b5cf6',CBE:'#f59e0b',AWASH:'#ef4444'};

  const submit = async () => {
    if(!count){ showMsg('error','No sales to submit.'); return; }
    setSubmitting(true);
    try {
      await apiClient.post('/sales/submit-daily');
      await apiClient.post('/sales/reports',{report_date:date});
      showMsg('success','Report locked and sent to Finance!');
      setSubmitted(true);
    } catch(e){ showMsg('error',e.response?.data?.message||'Submission failed.'); }
    finally  { setSubmitting(false); }
  };

  const stats = [
    {label:'System Total',  val:`${sysTotal.toLocaleString()} ETB`, color:C,       icon:<DollarSign  size={24}/>},
    {label:'Transactions',  val:count,                              color:'#1e293b',icon:<ShoppingCart size={24}/>},
    {label:'Cashiers',      val:Object.keys(cashierMap).length,     color:'#6d28d9',icon:<User         size={24}/>},
    {label:'Pay Methods',   val:Object.keys(payMap).length,         color:'#b45309',icon:<CreditCard   size={24}/>},
  ];

  return (
    <div className="ds-page">
      <style>{CSS}</style>
      <Toast msg={msg}/>

      {/* HEADER */}
      <div style={{ display:'grid',gridTemplateColumns:'1fr auto 1fr',alignItems:'center',padding:'28px 32px 22px',animation:'fadeUp .35s ease' }}>
        <div>
          <h1 className="ds-title">
            Daily Summary.
            <Calendar style={{color:C,filter:`drop-shadow(0 0 10px rgba(90,111,154,.65))`}} size={36}/>
          </h1>
        </div>
        <div style={{justifySelf:'center'}}>
          <p className="ds-sub">Manager · End-of-Day Collection</p>
        </div>
        <div style={{justifySelf:'end',display:'flex',gap:12,alignItems:'center'}}>
          <input type="date" value={date} onChange={e=>setDate(e.target.value)}
            style={{padding:'10px 14px',border:`2px solid ${C}`,background:'white',
              fontWeight:800,color:'#0d2244',outline:'none',fontFamily:'Inter',fontSize:14,
              boxShadow:`0 4px 0 ${CD},0 6px 14px rgba(0,40,80,.1)`,borderRadius: 0}}/>
          <button className="ds-btn-ghost" onClick={load} disabled={loading}
            onMouseDown={e=>{e.currentTarget.style.transform='translateY(5px)';e.currentTarget.style.boxShadow='none';}}
            onMouseUp={e=>{e.currentTarget.style.transform='';e.currentTarget.style.boxShadow=`0 5px 0 ${CD},0 8px 14px rgba(0,40,80,.13),inset 0 2px 0 rgba(255,255,255,1)`;}}
            onMouseLeave={e=>{e.currentTarget.style.transform='';e.currentTarget.style.boxShadow=`0 5px 0 ${CD},0 8px 14px rgba(0,40,80,.13),inset 0 2px 0 rgba(255,255,255,1)`;}}
          >
            <RefreshCw size={15} style={{animation:loading?'spin 1s linear infinite':'none'}}/> Refresh
          </button>
        </div>
      </div>

      {/* INFO BANNER */}
      <div style={{margin:'0 32px 22px',background:'rgba(255,255,255,.6)',border:'2px solid rgba(255,255,255,1)',
        padding:'18px 24px',display:'flex',gap:14,alignItems:'center',
        boxShadow:'0 4px 18px rgba(0,40,80,.06)',animation:'fadeUp .4s ease'}}>
        <div style={{background:`linear-gradient(135deg,${C},${CD})`,color:'white',padding:12,borderRadius: 0,
          boxShadow:`0 5px 0 ${CDX},0 8px 16px rgba(90,111,154,.4)`,flexShrink:0}}>
          <FileText size={22}/>
        </div>
        <div>
          <strong style={{color:'#0d2244',fontSize:15,fontWeight:900,textTransform:'uppercase',letterSpacing:'.05em'}}>End-of-Day Sales Collection</strong>
          <p style={{margin:'4px 0 0',fontSize:13,color:CD,fontWeight:600,lineHeight:1.5}}>
            Review system totals vs. cash &amp; bank. Submit to Finance when ready — records will be locked.
          </p>
        </div>
      </div>

      <div style={{padding:'0 32px',display:'flex',flexDirection:'column',gap:22}}>

        {/* STAT CHIPS */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16}}>
          {stats.map((s,i)=>(
            <div key={i} className="ds-chip" style={{animationDelay:`${i*0.06}s`}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:14}}>
                <div style={{fontSize:11,fontWeight:800,textTransform:'uppercase',letterSpacing:'.08em',color:'#64748b'}}>{s.label}</div>
                <div style={{color:s.color,opacity:.65}}>{s.icon}</div>
              </div>
              <div style={{fontSize:28,fontWeight:900,color:s.color,
                textShadow:'1px 1px 0 rgba(255,255,255,.9),2px 2px 0 rgba(0,0,0,.04)'}}>{s.val}</div>
            </div>
          ))}
        </div>

        {loading ? (
          <div style={{padding:'80px 0',textAlign:'center'}}>
            <Zap size={44} color={C} style={{animation:'pulse 1.5s ease-in-out infinite',margin:'0 auto 14px',display:'block'}}/>
            <div style={{fontWeight:800,color:'#0d2244',fontSize:18}}>Loading sales data...</div>
          </div>
        ) : submitted ? (
          <div className="ds-card" style={{padding:64,textAlign:'center',background:'#f0fdf4',borderTop:`5px solid #10b981`}}>
            <CheckCircle size={76} color="#059669" style={{margin:'0 auto 18px',display:'block',filter:'drop-shadow(0 4px 12px rgba(5,150,105,.4))'}}/>
            <h2 style={{margin:'0 0 10px',color:'#064e3b',fontWeight:900,fontSize:26}}>Submitted to Finance!</h2>
            <p style={{color:'#166534',fontWeight:600,fontSize:16}}>Report for <strong>{date}</strong> is locked and pending Finance review.</p>
            <div className="signature-container-outer" style={{ marginTop: '30px', justifyContent: 'center' }}>
              <div className="signature-container">
                <p className="signature-text" style={{ fontSize: '28px', color: '#064e3b', borderBottomColor: '#064e3b' }}>
                  {cashierMap && Object.keys(cashierMap)[0] ? Object.keys(cashierMap)[0] : 'System Verified'}
                </p>
                <div className="digital-stamp" style={{ borderColor: '#064e3b', color: '#064e3b', background: 'transparent' }}>
                  SUBMITTED<br/>SUTANA POS<br/>{new Date().toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>
        ) : count===0 ? (
          <div className="ds-card" style={{padding:64,textAlign:'center'}}>
            <ShoppingCart size={70} color={C} style={{opacity:.25,margin:'0 auto 14px',display:'block'}}/>
            <h2 style={{margin:'0 0 8px',color:'#0d2244',fontWeight:900}}>No Pending Sales</h2>
            <p style={{color:C,fontWeight:600}}>No unsubmitted transactions for {date}.</p>
          </div>
        ) : (
          <>
            {/* CASHIER BREAKDOWN */}
            <div className="ds-card">
              <div className="ds-card-head"><User size={21}/><span>Cashier Collections</span></div>
              <table className="ds-tbl">
                <thead><tr>
                  <th className="ds-th">Cashier</th>
                  <th className="ds-th" style={{textAlign:'center'}}>Trans.</th>
                  <th className="ds-th">Method Breakdown</th>
                  <th className="ds-th" style={{textAlign:'right'}}>Total Collected</th>
                </tr></thead>
                <tbody>
                  {Object.entries(cashierMap).map(([name,d],i)=>(
                    <tr key={i} className="ds-tr">
                      <td className="ds-td"><div style={{display:'flex',alignItems:'center',gap:10}}><div className="ds-av">{name[0]}</div><strong style={{color:'#0d2244'}}>{name}</strong></div></td>
                      <td className="ds-td" style={{textAlign:'center'}}><span className="ds-badge">{d.count}</span></td>
                      <td className="ds-td">
                        <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                          {Object.entries(d.methods).map(([m,v])=>(
                            <span key={m} style={{fontSize:11,fontWeight:700,background:'rgba(90,111,154,.1)',color:CD,
                              padding:'4px 9px',border:'1px solid rgba(90,111,154,.22)',
                              boxShadow:'0 2px 0 rgba(90,111,154,.14),inset 0 1px 0 rgba(255,255,255,.8)',borderRadius: 0}}>
                              {m}: {v.toLocaleString()}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="ds-td" style={{textAlign:'right',fontWeight:900,color:'#0d2244',fontSize:15}}>{d.total.toLocaleString()} ETB</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* PAYMENT + ACTION */}
            <div style={{display:'grid',gridTemplateColumns:'1fr 370px',gap:22}}>
              <div className="ds-card">
                <div className="ds-card-head"><CreditCard size={21}/><span>Payment Breakdown</span></div>
                <table className="ds-tbl">
                  <thead><tr>
                    <th className="ds-th">Method</th>
                    <th className="ds-th" style={{textAlign:'right'}}>Collected</th>
                    <th className="ds-th" style={{textAlign:'right'}}>Share</th>
                  </tr></thead>
                  <tbody>
                    {Object.entries(payMap).map(([m,amt],i)=>(
                      <tr key={i} className="ds-tr">
                        <td className="ds-td">
                          <div style={{display:'flex',alignItems:'center',gap:10}}>
                            <div style={{width:11,height:11,borderRadius: 0,background:pCol[m]||C,boxShadow:`0 2px 6px ${pCol[m]||C}88`}}/>
                            <strong style={{textTransform:'uppercase',color:'#0d2244'}}>{m}</strong>
                          </div>
                        </td>
                        <td className="ds-td" style={{textAlign:'right',fontWeight:900,fontSize:15}}>{amt.toLocaleString()} ETB</td>
                        <td className="ds-td" style={{textAlign:'right'}}><span className="ds-badge">{sysTotal>0?((amt/sysTotal)*100).toFixed(1):0}%</span></td>
                      </tr>
                    ))}
                    <tr style={{background:'rgba(90,111,154,.06)'}}>
                      <td className="ds-td" style={{fontWeight:900,color:'#0d2244'}}>GRAND TOTAL</td>
                      <td className="ds-td" style={{textAlign:'right',fontWeight:900,color:C,fontSize:16}}>{collected.toLocaleString()} ETB</td>
                      <td className="ds-td" style={{textAlign:'right'}}>
                        <span style={{background:isMatch?'linear-gradient(135deg,#dcfce7,#bbf7d0)':'linear-gradient(135deg,#fee2e2,#fecaca)',
                          color:isMatch?'#166534':'#991b1b',padding:'4px 12px',fontWeight:900,fontSize:11,
                          textTransform:'uppercase',letterSpacing:'.05em',
                          border:`1px solid ${isMatch?'#86efac':'#fca5a5'}`,
                          boxShadow:`0 3px 0 ${isMatch?'#4ade8044':'#f8717144'},inset 0 1px 0 rgba(255,255,255,.8)`,
                          display:'inline-block',borderRadius: 0}}>
                          {isMatch?'MATCH':'MISMATCH'}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div style={{display:'flex',flexDirection:'column',gap:16}}>
                {/* Reconcile box */}
                <div className="ds-card" style={{padding:22,borderTop:`4px solid ${isMatch?'#10b981':'#f59e0b'}`,
                  background:isMatch?'linear-gradient(135deg,#f0fdf4,#dcfce7)':'linear-gradient(135deg,#fffbeb,#fef3c7)'}}>
                  <div style={{display:'flex',gap:14,alignItems:'flex-start'}}>
                    <div style={{filter:`drop-shadow(0 4px 8px ${isMatch?'rgba(5,150,105,.4)':'rgba(217,119,6,.4)'})`}}>
                      {isMatch?<CheckCircle size={38} color="#059669"/>:<AlertTriangle size={38} color="#d97706"/>}
                    </div>
                    <div>
                      <div style={{fontWeight:900,fontSize:14,color:isMatch?'#064e3b':'#92400e',marginBottom:6}}>
                        {isMatch?'Reconciliation OK':'Totals Mismatch!'}
                      </div>
                      <div style={{fontSize:13,fontWeight:600,color:isMatch?'#166534':'#b45309',lineHeight:1.6}}>
                        System:&nbsp;<strong>{sysTotal.toLocaleString()} ETB</strong><br/>
                        Collected:&nbsp;<strong>{collected.toLocaleString()} ETB</strong>
                        {!isMatch&&<><br/><br/>Correct before submitting.</>}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Submit panel */}
                <div className="ds-card" style={{padding:24,background:'rgba(255,255,255,.75)',border:'2px solid rgba(255,255,255,1)',flex:1}}>
                  <div style={{display:'flex',gap:12,alignItems:'center',marginBottom:12}}>
                    <div style={{background:`linear-gradient(135deg,${C},${CD})`,color:'white',padding:13,borderRadius: 0,
                      boxShadow:`0 5px 0 ${CDX},0 8px 16px rgba(90,111,154,.4)`}}>
                      <Send size={20}/>
                    </div>
                    <div>
                      <div style={{fontWeight:900,color:'#0d2244',fontSize:15}}>Submit to Finance</div>
                      <div style={{fontSize:12,color:C,fontWeight:700}}>Locks today's report</div>
                    </div>
                  </div>
                  <p style={{margin:'0 0 18px',color:'#334155',fontWeight:500,fontSize:13,lineHeight:1.6}}>
                    Finance reconciles totals vs. physical records. Approved data flows instantly to the CEO dashboard.
                  </p>
                  <button className="ds-btn-submit" onClick={submit} disabled={submitting||!count}>
                    {submitting?<Loader2 size={19} style={{animation:'spin 1s linear infinite'}}/>:<Send size={19}/>}
                    {submitting?'Submitting...':`Submit ${count} Sales to Finance`}
                  </button>
                </div>
              </div>
            </div>

            {/* ALL TRANSACTIONS */}
            <div className="ds-card">
              <div className="ds-card-head"><Building2 size={21}/><span>All Transactions — {date}</span></div>
              <div style={{maxHeight:360,overflowY:'auto'}}>
                <table className="ds-tbl">
                  <thead><tr>
                    <th className="ds-th">Receipt</th>
                    <th className="ds-th">Cashier</th>
                    <th className="ds-th">Branch</th>
                    <th className="ds-th">Method</th>
                    <th className="ds-th" style={{textAlign:'right'}}>Amount</th>
                  </tr></thead>
                  <tbody>
                    {sales.map((s,i)=>(
                      <tr key={i} className="ds-tr">
                        <td className="ds-td">
                          <code style={{background:'rgba(90,111,154,.1)',padding:'4px 9px',fontSize:12,color:CD,
                            border:'1px solid rgba(90,111,154,.2)',boxShadow:'0 2px 0 rgba(90,111,154,.1)',borderRadius: 0}}>
                            {s.receipt_no||`#${s.id}`}
                          </code>
                        </td>
                        <td className="ds-td">{s.worker_name||'—'}</td>
                        <td className="ds-td">{s.branch_name||'—'}</td>
                        <td className="ds-td">
                          <span style={{background:`${pCol[s.payment_method||'CASH']}1a`,color:pCol[s.payment_method||'CASH']||C,
                            padding:'4px 10px',fontWeight:800,fontSize:11,textTransform:'uppercase',
                            border:`1px solid ${pCol[s.payment_method||'CASH']||C}44`,borderRadius: 0,
                            boxShadow:`0 2px 0 ${pCol[s.payment_method||'CASH']||C}33`,display:'inline-block'}}>
                            {s.payment_method||'CASH'}
                          </span>
                        </td>
                        <td className="ds-td" style={{textAlign:'right',fontWeight:900,color:'#0d2244',fontSize:14}}>{parseFloat(s.total_amount||0).toLocaleString()} ETB</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
