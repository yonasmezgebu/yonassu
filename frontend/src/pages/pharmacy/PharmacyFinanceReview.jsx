import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText, CheckCircle, XCircle, Loader2, ChevronRight,
  BarChart3, CreditCard, ThumbsUp, ThumbsDown,
  ClipboardCheck, Building2, AlertTriangle, RefreshCw,
  Zap, DollarSign, Users, ShieldCheck, ArrowLeft, ArrowRight
} from 'lucide-react';
import pharmacyService from '../../services/pharmacyService';

const BG   = '#46D17A';
const C    = '#1A5C38';  // Deep forest green on bright green bg
const CD   = '#145030';
const CDX  = '#0C3520';
const WARM = '#5DC98A';  // soft mint for dividers

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
  @keyframes fadeUp     { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
  @keyframes fadeIn     { from{opacity:0} to{opacity:1} }
  @keyframes pulse      { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(.88)} }
  @keyframes spin       { to{transform:rotate(360deg)} }
  @keyframes laserSweep { 0%{left:-150%} 100%{left:150%} }
  @keyframes shimmer    { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
  @keyframes iconBlink  {
    0%   { color:#ff4757; filter:drop-shadow(0 0 8px rgba(255,71,87,.8));  transform:scale(1)    rotate(0deg);   }
    20%  { color:#ffa502; filter:drop-shadow(0 0 12px rgba(255,165,2,.9)); transform:scale(1.2)  rotate(12deg);  }
    40%  { color:#2ed573; filter:drop-shadow(0 0 14px rgba(46,213,115,1)); transform:scale(1.35) rotate(-10deg); }
    60%  { color:#1e90ff; filter:drop-shadow(0 0 12px rgba(30,144,255,.9));transform:scale(1.2)  rotate(8deg);   }
    80%  { color:#a55eea; filter:drop-shadow(0 0 10px rgba(165,94,234,.8));transform:scale(1.1)  rotate(-6deg);  }
    100% { color:#ff4757; filter:drop-shadow(0 0 8px rgba(255,71,87,.8));  transform:scale(1)    rotate(0deg);   }
  }
  .fr-blink-icon { animation: iconBlink 2.2s infinite ease-in-out; display:inline; vertical-align:middle; }

  /* ── PAGE SHELL ── */
  .fr-page {
    min-height: calc(100vh - 64px);
    font-family: 'Inter','Segoe UI',sans-serif;
    display: flex;
    flex-direction: column;
  }

  /* ── PAGE HEADER ── */
  .fr-page-header {
    padding: 28px 36px 0;
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    animation: fadeUp .35s ease;
  }

  .fr-page-title {
    font-size: 2.4rem; font-weight: 900; color: #1a2742; letter-spacing: -.025em;
    line-height: 1; margin: 0;
    text-shadow:
      1px 1px 0 rgba(255,255,255,.7),
      2px 2px 0 rgba(255,255,255,.5),
      3px 3px 0 ${C}44,
      0 8px 24px rgba(0,0,0,.12);
  }
  .fr-page-sub {
    font-size: .8rem; font-weight: 800; color: ${C};
    text-transform: uppercase; letter-spacing: .18em; margin-top: 6px;
  }

  /* ── BODY SPLIT ── */
  .fr-body {
    display: flex;
    flex: 1;
    gap: 0;
    padding: 24px 36px 36px;
    gap: 22px;
    min-height: 0;
  }

  /* ── CARD ── */
  .fr-card {
    --hc: ${C};
    position: relative; overflow: hidden;
    background: rgba(255,255,255,.88);
    backdrop-filter: blur(12px);
    border-radius: 0;
    box-shadow:
      0 2px 0 rgba(255,255,255,.9),
      0 6px 24px rgba(0,30,80,.10),
      0 1px 0 ${WARM}44;
    transition: box-shadow .3s, transform .2s, background-size .45s;
    animation: fadeUp .45s ease both;
    background-image:
      linear-gradient(to right,  var(--hc), var(--hc)),
      linear-gradient(to bottom, var(--hc), var(--hc)),
      linear-gradient(to left,   var(--hc), var(--hc)),
      linear-gradient(to top,    var(--hc), var(--hc));
    background-position: 0 0, 100% 0, 100% 100%, 0 100%;
    background-repeat: no-repeat;
    background-size: 0% 3px, 3px 0%, 0% 3px, 3px 0%;
  }
  .fr-card:hover {
    background-size: 100% 3px, 3px 100%, 100% 3px, 3px 100%;
    box-shadow: 0 2px 0 rgba(255,255,255,.9), 0 12px 36px rgba(0,30,80,.15);
    transform: translateY(-2px);
  }
  .fr-card::after {
    content: ''; position: absolute; top: 0; left: -150%;
    width: 100%; height: 100%;
    background: linear-gradient(90deg,
      transparent 0%,
      rgba(0,220,255,.35) 20%,
      rgba(200,100,255,.35) 50%,
      rgba(80,255,180,.35) 80%,
      transparent 100%);
    transform: skewX(-25deg); pointer-events: none; z-index: 2;
  }
  .fr-card:hover::after { animation: laserSweep .8s ease-out forwards; }

  /* ── CARD HEADER ── */
  .fr-card-head {
    padding: 16px 22px;
    background: linear-gradient(135deg, ${C}, ${CD});
    color: white; display: flex; align-items: center; gap: 12px;
    box-shadow: inset 0 -3px 0 rgba(0,0,0,.15);
  }
  .fr-card-head-title {
    font-size: 13px; font-weight: 900; letter-spacing: .08em;
    text-transform: uppercase; text-shadow: 0 2px 6px rgba(0,0,0,.3);
  }

  /* ── REPORT LIST ROW ── */
  .fr-rrow {
    border-bottom: 1px solid rgba(107,127,163,.1);
    transition: background .2s, transform .15s, border-left-width .2s;
    cursor: pointer; padding: 15px 20px;
  }
  .fr-rrow:hover { background: rgba(107,127,163,.07); transform: translateX(3px); }
  .fr-rrow.fr-rrow--active {
    background: linear-gradient(90deg, rgba(107,127,163,.18), rgba(107,127,163,.04));
    border-left: 5px solid ${C};
    box-shadow: inset 5px 0 12px rgba(107,127,163,.12);
  }

  /* ── STATUS PILL ── */
  .fr-pill {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 4px 12px; font-weight: 900; font-size: 10px;
    text-transform: uppercase; letter-spacing: .08em;
    box-shadow: 0 2px 0 rgba(0,0,0,.08), inset 0 1px 0 rgba(255,255,255,.6);
  }
  .fr-pill--pending  { background: linear-gradient(135deg,#fffbeb,#fef3c7); color: #92400e; border: 1px solid #fcd34d; }
  .fr-pill--approved { background: linear-gradient(135deg,#f0fdf4,#dcfce7); color: #166534; border: 1px solid #86efac; }
  .fr-pill--rejected { background: linear-gradient(135deg,#fef2f2,#fee2e2); color: #991b1b; border: 1px solid #fca5a5; }

  /* ── STEP INDICATOR ── */
  .fr-step-bar {
    display: grid;
    grid-template-columns: repeat(3,1fr);
    gap: 12px;
    margin-bottom: 4px;
  }
  .fr-step {
    display: flex; align-items: center; gap: 11px;
    padding: 13px 16px;
    background: rgba(255,255,255,.8);
    border: 2px solid transparent;
    cursor: pointer;
    transition: all .2s;
    box-shadow: 0 3px 0 rgba(184,169,154,.4), 0 5px 14px rgba(0,0,0,.06);
  }
  .fr-step:hover { border-color: ${C}55; transform: translateY(-1px); }
  .fr-step--active {
    border-color: ${C};
    background: linear-gradient(135deg, rgba(107,127,163,.12), rgba(107,127,163,.04));
    box-shadow: 0 4px 0 ${CD}, 0 8px 18px rgba(74,92,130,.18), 0 0 0 3px rgba(107,127,163,.15);
    transform: translateY(-2px);
  }
  .fr-step--done {
    border-color: #10b981;
    background: linear-gradient(135deg, #f0fdf4, #dcfce7);
    box-shadow: 0 4px 0 #059669, 0 8px 18px rgba(5,150,105,.15);
  }
  .fr-step-num {
    width: 34px; height: 34px; display: flex; align-items: center;
    justify-content: center; font-weight: 900; font-size: 15px; flex-shrink: 0;
    transition: all .2s;
  }

  /* ── METRIC BOX ── */
  .fr-metric {
    padding: 22px 24px;
    background: rgba(255,255,255,.75);
    text-align: center;
    border: 1px solid rgba(184,169,154,.4);
    box-shadow: 0 3px 0 rgba(184,169,154,.35), 0 5px 18px rgba(0,0,0,.05),
                inset 0 1px 0 rgba(255,255,255,.9);
    transition: transform .2s, box-shadow .2s;
  }
  .fr-metric:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 0 rgba(184,169,154,.35), 0 10px 24px rgba(0,0,0,.08),
                inset 0 1px 0 rgba(255,255,255,.9);
  }

  /* ── TABLE ── */
  .fr-tbl { width: 100%; border-collapse: collapse; font-size: 14px; }
  .fr-th {
    text-align: left; padding: 12px 18px;
    background: linear-gradient(135deg, rgba(107,127,163,.12), rgba(74,92,130,.06));
    border-bottom: 3px solid ${C};
    color: ${CD}; font-weight: 900; text-transform: uppercase;
    letter-spacing: .06em; font-size: 11px;
    text-shadow: 0 1px 0 rgba(255,255,255,.8);
  }
  .fr-td { padding: 13px 18px; border-bottom: 1px solid rgba(107,127,163,.08); color: #2d3748; font-weight: 600; }
  .fr-tr:hover .fr-td { background: rgba(107,127,163,.05); }

  /* ── TEXTAREA ── */
  .fr-textarea {
    width: 100%; padding: 13px 15px;
    border: 2px solid rgba(184,169,154,.6);
    font-size: 14px; font-family: 'Inter', sans-serif;
    outline: none; box-sizing: border-box; resize: vertical;
    background: rgba(255,255,255,.8);
    transition: border-color .2s, box-shadow .2s;
    box-shadow: inset 0 2px 6px rgba(0,0,0,.04);
  }
  .fr-textarea:focus {
    border-color: ${C};
    box-shadow: 0 0 0 3px rgba(107,127,163,.18), inset 0 2px 6px rgba(0,0,0,.04);
  }

  /* ── BUTTONS ── */
  .fr-btn-approve {
    display: inline-flex; align-items: center; justify-content: center; gap: 10px;
    padding: 14px 28px; font-weight: 900; font-size: 14px; cursor: pointer;
    letter-spacing: .07em; text-transform: uppercase;
    background: linear-gradient(135deg, #10b981, #059669); color: white;
    border: 2px solid #047857;
    box-shadow: 0 5px 0 #064e3b, 0 8px 18px rgba(6,78,59,.25), inset 0 2px 0 rgba(255,255,255,.2);
    transition: all .1s; font-family: 'Inter',sans-serif;
  }
  .fr-btn-approve:active:not(:disabled) { transform: translateY(5px); box-shadow: 0 0 0 #064e3b; }
  .fr-btn-approve:hover:not(:disabled)  { filter: brightness(1.07); }
  .fr-btn-approve:disabled { filter: grayscale(.8) opacity(.65); cursor: not-allowed; transform: translateY(5px); box-shadow: none; }

  .fr-btn-reject {
    display: inline-flex; align-items: center; justify-content: center; gap: 10px;
    padding: 14px 28px; font-weight: 900; font-size: 14px; cursor: pointer;
    letter-spacing: .07em; text-transform: uppercase;
    background: linear-gradient(135deg, #ef4444, #dc2626); color: white;
    border: 2px solid #b91c1c;
    box-shadow: 0 5px 0 #7f1d1d, 0 8px 18px rgba(127,29,29,.25), inset 0 2px 0 rgba(255,255,255,.2);
    transition: all .1s; font-family: 'Inter',sans-serif;
  }
  .fr-btn-reject:active:not(:disabled) { transform: translateY(5px); box-shadow: 0 0 0 #7f1d1d; }
  .fr-btn-reject:hover:not(:disabled)  { filter: brightness(1.07); }
  .fr-btn-reject:disabled { filter: grayscale(.8) opacity(.65); cursor: not-allowed; }

  .fr-btn-ghost {
    display: inline-flex; align-items: center; justify-content: center; gap: 8px;
    padding: 11px 22px; font-weight: 800; font-size: 13px; cursor: pointer;
    letter-spacing: .07em; text-transform: uppercase;
    background: rgba(255,255,255,.8); color: ${CD};
    border: 2px solid ${C};
    box-shadow: 0 4px 0 ${CD}66, 0 6px 14px rgba(74,92,130,.12), inset 0 2px 0 rgba(255,255,255,.9);
    transition: all .1s; font-family: 'Inter',sans-serif;
  }
  .fr-btn-ghost:active:not(:disabled) { transform: translateY(4px); box-shadow: 0 0 0 ${CD}; }
  .fr-btn-ghost:hover:not(:disabled)  { background: rgba(255,255,255,.95); }
  .fr-btn-ghost:disabled { filter: grayscale(.7) opacity(.6); cursor: not-allowed; }
`;

/* ─── Toast ─── */
const Toast = ({ msg }) => msg?.text ? (
  <div style={{
    position:'fixed', top:20, right:20, zIndex:9999, padding:'14px 22px',
    fontWeight:700, fontSize:14, display:'flex', alignItems:'center', gap:10,
    background: msg.type==='success' ? '#f0fdf4' : '#fef2f2',
    border: `2px solid ${msg.type==='success' ? '#10b981' : '#ef4444'}`,
    color: msg.type==='success' ? '#064e3b' : '#991b1b',
    boxShadow:'0 6px 0 rgba(0,0,0,.1), 0 12px 24px rgba(0,0,0,.12)',
    animation:'fadeUp .3s ease',
  }}>
    {msg.type==='success' ? <CheckCircle size={18}/> : <XCircle size={18}/>}
    {msg.text}
  </div>
) : null;

/* ─── Empty Placeholder ─── */
const EmptyState = ({ icon: Icon, title, sub, color='#94a3b8' }) => (
  <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:60, textAlign:'center' }}>
    <Icon size={72} style={{ opacity:.15, color, marginBottom:20, display:'block' }}/>
    <div style={{ fontWeight:900, fontSize:20, color:'#1a2742', marginBottom:8 }}>{title}</div>
    <div style={{ fontWeight:600, fontSize:15, color:'#64748b' }}>{sub}</div>
  </div>
);

export default function PharmacyFinanceReview() {
  const [reports,     setReports]     = useState([]);
  const [selectedId,  setSelectedId]  = useState(null);
  const [report,      setReport]      = useState(null);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingRep,  setLoadingRep]  = useState(false);
  const [step,        setStep]        = useState(1);
  const [deciding,    setDeciding]    = useState(false);
  const [reason,      setReason]      = useState('');
  const [showReject,  setShowReject]  = useState(false);
  const [decision,    setDecision]    = useState(null);
  const [msg,         setMsg]         = useState(null);

  const showMsg = (type, text) => { setMsg({ type, text }); setTimeout(() => setMsg(null), 4500); };

  const loadReports = useCallback(async () => {
    setLoadingList(true);
    try {
      const res  = await pharmacyService.getReports();
      const data = res?.data?.data || res?.data || [];
      setReports(Array.isArray(data) ? data.filter(r => r.status === 'PENDING') : []);
    } catch { showMsg('error','Failed to load reports'); }
    finally { setLoadingList(false); }
  }, []);

  useEffect(() => { loadReports(); }, [loadReports]);

  const selectReport = async (id) => {
    setSelectedId(id); setStep(1); setDecision(null); setReason(''); setShowReject(false);
    setLoadingRep(true);
    try {
      const res = await pharmacyService.getReportById(id);
      setReport(res?.data?.data || res?.data || res);
    } catch { showMsg('error','Failed to load report details'); setReport(null); }
    finally { setLoadingRep(false); }
  };

  const decide = async (approve) => {
    if (!approve && !reason.trim()) return;
    setDeciding(true);
    try {
      await pharmacyService.financeDecision(selectedId, {
        decision: approve ? 'APPROVED' : 'REJECTED',
        finance_notes: reason
      });
      showMsg('success', approve ? 'Approved — CEO dashboard updated!' : 'Rejected back to Manager.');
      setDecision({ action: approve ? 'APPROVED' : 'REJECTED', revenue: parseFloat(report?.total_amount||0) });
      loadReports();
    } catch (e) { showMsg('error', e?.response?.data?.message || 'Decision failed.'); }
    finally { setDeciding(false); }
  };

  const sysTotal  = report ? parseFloat(report.total_amount||0) : 0;
  const collected = report?.payments ? report.payments.reduce((s,p) => s + parseFloat(p.total_amount||0), 0) : 0;
  const diff      = Math.abs(sysTotal - collected);
  const isMatch   = diff < 0.05;

  const STEPS = [
    { label:'Reconciliation', icon: BarChart3 },
    { label:'Branch Detail',  icon: Building2 },
    { label:'Final Decision', icon: ClipboardCheck },
  ];

  return (
    <div className="fr-page">
      <style>{CSS}</style>
      <Toast msg={msg}/>

      {/* ─── PAGE HEADER ─── */}
      <div className="fr-page-header">
        {/* Left: Title */}
        <div>
          <h1 className="fr-page-title">
            Finance Review.&nbsp;
            <ShieldCheck className="fr-blink-icon" size={30}/>
          </h1>
        </div>

        {/* Center: Subtitle */}
        <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', paddingBottom:6 }}>
          <div className="fr-page-sub" style={{ textAlign:'center', color:C }}>Daily Report Verification &amp; Approval</div>
        </div>

        {/* Right: Controls */}
        <div style={{ display:'flex', gap:10, alignItems:'center', paddingBottom:4 }}>
          <div style={{ padding:'8px 18px', background:'rgba(255,255,255,.7)', border:`2px solid ${C}44`,
            fontWeight:800, color:C, fontSize:13, letterSpacing:'.06em',
            boxShadow:`0 3px 0 ${WARM}88`, textTransform:'uppercase' }}>
            <span style={{ color:CD, fontWeight:900 }}>{reports.length}</span> Pending
          </div>
          <button onClick={loadReports} disabled={loadingList} className="fr-btn-ghost" style={{ padding:'9px 18px' }}>
            <RefreshCw size={14} style={{ animation:loadingList?'spin 1s linear infinite':'none' }}/>
            Refresh
          </button>
        </div>
      </div>

      {/* ─── BODY ─── */}
      <div className="fr-body">

        {/* ─── LEFT: Pending Report List ─── */}
        <div style={{ width:310, flexShrink:0, display:'flex', flexDirection:'column', gap:14 }}>
          <div className="fr-card" style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
            <div className="fr-card-head">
              <FileText size={18} style={{ filter:'drop-shadow(0 2px 4px rgba(0,0,0,.25))' }}/>
              <span className="fr-card-head-title">Pending Reports</span>
            </div>
            <div style={{ flex:1, overflowY:'auto' }}>
              {loadingList ? (
                <EmptyState icon={Zap} title="Loading..." sub="Fetching pending reports" color={C}/>
              ) : reports.length === 0 ? (
                <EmptyState icon={CheckCircle} title="All Clear!" sub="No pending reports to review." color="#10b981"/>
              ) : (
                reports.map((r, i) => (
                  <div key={r.id}
                    className={`fr-rrow ${selectedId===r.id?'fr-rrow--active':''}`}
                    style={{ animationDelay:`${i*.04}s` }}
                    onClick={() => selectReport(r.id)}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:8 }}>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontWeight:900, color:'#1a2742', fontSize:14, marginBottom:5,
                          whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                          {new Date(r.report_date).toLocaleDateString(undefined, {
                            weekday:'short', month:'short', day:'numeric', year:'numeric'
                          })}
                        </div>
                        <div style={{ fontSize:12, color:'#64748b', fontWeight:700, display:'flex', gap:10 }}>
                          <span>{r.total_sales} Trans.</span>
                          <span style={{ color:C, fontWeight:900 }}>{parseFloat(r.total_amount||0).toLocaleString()} ETB</span>
                        </div>
                      </div>
                      <ChevronRight size={16} color={selectedId===r.id ? C : '#cbd5e1'}
                        style={{ flexShrink:0, filter:selectedId===r.id?`drop-shadow(0 0 4px ${C})`:'none' }}/>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* ─── RIGHT: Review Detail ─── */}
        <div style={{ flex:1, display:'flex', flexDirection:'column', gap:18, minWidth:0 }}>

          {!selectedId ? (
            <div className="fr-card" style={{ flex:1 }}>
              <EmptyState icon={FileText} title="Select a Report"
                sub="Choose a pending daily report from the left to begin review." color={C}/>
            </div>

          ) : loadingRep ? (
            <div className="fr-card" style={{ flex:1 }}>
              <EmptyState icon={Zap} title="Loading Report..." sub="Fetching full report details." color={C}/>
            </div>

          ) : report ? (
            <>
              {/* Report Meta Banner */}
              <div className="fr-card" style={{ padding:'18px 24px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:24, flexWrap:'wrap' }}>
                  <div>
                    <div style={{ fontSize:11, fontWeight:800, textTransform:'uppercase', letterSpacing:'.1em', color:'#94a3b8', marginBottom:4 }}>Report Date</div>
                    <div style={{ fontSize:18, fontWeight:900, color:'#1a2742' }}>
                      {new Date(report.report_date).toLocaleDateString(undefined, { weekday:'long', day:'numeric', month:'long', year:'numeric' })}
                    </div>
                  </div>
                  <div style={{ width:1, height:40, background:WARM+'66' }}/>
                  <div>
                    <div style={{ fontSize:11, fontWeight:800, textTransform:'uppercase', letterSpacing:'.1em', color:'#94a3b8', marginBottom:4 }}>System Total</div>
                    <div style={{ fontSize:22, fontWeight:900, color:'#1a2742' }}>{sysTotal.toLocaleString()} <span style={{ fontSize:13, color:'#94a3b8' }}>ETB</span></div>
                  </div>
                  <div style={{ width:1, height:40, background:WARM+'66' }}/>
                  <div>
                    <div style={{ fontSize:11, fontWeight:800, textTransform:'uppercase', letterSpacing:'.1em', color:'#94a3b8', marginBottom:4 }}>Transactions</div>
                    <div style={{ fontSize:22, fontWeight:900, color:'#1a2742' }}>{report.total_sales || '—'}</div>
                  </div>
                  <div style={{ width:1, height:40, background:WARM+'66' }}/>
                  <div>
                    <div style={{ fontSize:11, fontWeight:800, textTransform:'uppercase', letterSpacing:'.1em', color:'#94a3b8', marginBottom:4 }}>Match Status</div>
                    <span className={`fr-pill ${isMatch ? 'fr-pill--approved' : 'fr-pill--rejected'}`}>
                      {isMatch ? <CheckCircle size={10}/> : <XCircle size={10}/>}
                      {isMatch ? 'BALANCED' : `DIFF ${diff.toLocaleString()} ETB`}
                    </span>
                  </div>
                  <div style={{ marginLeft:'auto' }}>
                    <span className="fr-pill fr-pill--pending"><Zap size={10}/> PENDING REVIEW</span>
                  </div>
                </div>
              </div>

              {/* Step Navigator */}
              <div className="fr-step-bar">
                {STEPS.map((s, i) => {
                  const n = i+1;
                  const isActive = step === n;
                  const isDone   = step > n;
                  const Icon = s.icon;
                  return (
                    <div key={n}
                      className={`fr-step ${isActive?'fr-step--active':isDone?'fr-step--done':''}`}
                      onClick={() => setStep(n)}>
                      <div className="fr-step-num" style={{
                        background: isActive ? `linear-gradient(135deg,${C},${CD})`
                                  : isDone   ? 'linear-gradient(135deg,#10b981,#059669)'
                                  : 'rgba(184,169,154,.3)',
                        color: (isActive||isDone) ? 'white' : '#94a3b8',
                        boxShadow: isActive ? `0 4px 0 ${CDX}, 0 6px 12px rgba(107,127,163,.4), inset 0 2px 0 rgba(255,255,255,.2)`
                                 : isDone   ? '0 4px 0 #064e3b, 0 6px 12px rgba(5,150,105,.3), inset 0 2px 0 rgba(255,255,255,.2)'
                                 : '0 3px 0 rgba(184,169,154,.5), inset 0 1px 0 rgba(255,255,255,.7)',
                      }}>
                        {isDone ? <CheckCircle size={17}/> : <Icon size={17}/>}
                      </div>
                      <div>
                        <div style={{ fontWeight:900, fontSize:13, color:(isActive||isDone)?'#1a2742':'#94a3b8' }}>
                          Step {n}
                        </div>
                        <div style={{ fontWeight:700, fontSize:12, color:(isActive||isDone)?C:'#c4b8af' }}>
                          {s.label}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* ── STEP 1: RECONCILIATION ── */}
              {step===1 && (
                <div className="fr-card" style={{ animation:'fadeUp .4s ease' }}>
                  <div className="fr-card-head">
                    <BarChart3 size={20}/>
                    <span className="fr-card-head-title">Cash Reconciliation</span>
                  </div>
                  <div style={{ padding:28 }}>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:24 }}>
                      {[
                        { label:'System-Recorded Total', value:sysTotal, sub:'All POS transactions', icon: DollarSign, color:'#1a2742' },
                        { label:'Actually Collected',    value:collected, sub:'Cash + Bank + Mobile', icon: CreditCard, color:'#1a2742' },
                      ].map((item,i) => (
                        <div key={i} className="fr-metric">
                          <div style={{ display:'flex', justifyContent:'center', marginBottom:12 }}>
                            <div style={{ width:44, height:44, background:`linear-gradient(135deg,${C},${CD})`,
                              display:'flex', alignItems:'center', justifyContent:'center',
                              boxShadow:`0 4px 0 ${CDX}, 0 6px 14px rgba(107,127,163,.3)` }}>
                              <item.icon size={22} color="white" style={{ filter:'drop-shadow(0 2px 4px rgba(0,0,0,.2))' }}/>
                            </div>
                          </div>
                          <div style={{ fontSize:11, fontWeight:900, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:10 }}>{item.label}</div>
                          <div style={{ fontSize:32, fontWeight:900, color:item.color, marginBottom:4,
                            textShadow:'1px 1px 0 rgba(255,255,255,.8), 2px 2px 6px rgba(0,0,0,.06)' }}>
                            {item.value.toLocaleString()}
                          </div>
                          <div style={{ fontSize:14, fontWeight:800, color:'#94a3b8' }}>ETB</div>
                          <div style={{ fontSize:11, color:'#c4b8af', fontWeight:700, marginTop:8 }}>{item.sub}</div>
                        </div>
                      ))}
                    </div>

                    {/* Reconciliation verdict */}
                    <div style={{
                      padding:'20px 24px', display:'flex', alignItems:'center', gap:20,
                      background: isMatch ? 'linear-gradient(135deg,#f0fdf4,#dcfce7)' : 'linear-gradient(135deg,#fef2f2,#fee2e2)',
                      border: `3px solid ${isMatch ? '#10b981' : '#ef4444'}`,
                      boxShadow: `0 5px 0 ${isMatch ? '#059669' : '#dc2626'}44, 0 8px 20px ${isMatch ? 'rgba(5,150,105,.1)' : 'rgba(220,38,38,.1)'}`,
                    }}>
                      <div style={{ flexShrink:0, filter:`drop-shadow(0 4px 8px ${isMatch?'rgba(5,150,105,.4)':'rgba(220,38,38,.4)'})` }}>
                        {isMatch ? <CheckCircle size={48} color="#059669"/> : <AlertTriangle size={48} color="#dc2626"/>}
                      </div>
                      <div>
                        <div style={{ fontSize:17, fontWeight:900, color:isMatch?'#064e3b':'#991b1b', marginBottom:6 }}>
                          {isMatch ? 'Reconciliation Passed — Ready to Approve' : 'Mismatch Detected — Approval Blocked'}
                        </div>
                        <div style={{ fontSize:14, fontWeight:600, color:isMatch?'#166534':'#b91c1c', lineHeight:1.6 }}>
                          {isMatch
                            ? 'System sales exactly match collected funds. You may proceed to approve this report.'
                            : `A difference of ${diff.toLocaleString()} ETB was found. The Branch Manager must correct and resubmit before approval is possible.`}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── STEP 2: BRANCH BREAKDOWN ── */}
              {step===2 && (
                <div className="fr-card" style={{ animation:'fadeUp .4s ease' }}>
                  <div className="fr-card-head">
                    <Building2 size={20}/>
                    <span className="fr-card-head-title">Branch Performance</span>
                  </div>
                  <table className="fr-tbl">
                    <thead>
                      <tr>
                        <th className="fr-th">Branch</th>
                        <th className="fr-th" style={{ textAlign:'center' }}>Transactions</th>
                        <th className="fr-th" style={{ textAlign:'center' }}>Staff Active</th>
                        <th className="fr-th" style={{ textAlign:'right' }}>System Total (ETB)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(report.branches||[]).length === 0 ? (
                        <tr><td colSpan={4} className="fr-td" style={{ textAlign:'center', color:'#94a3b8', padding:32 }}>
                          No branch breakdown available for this report.
                        </td></tr>
                      ) : (report.branches||[]).map((b, i) => (
                        <tr key={i} className="fr-tr">
                          <td className="fr-td">
                            <div style={{ display:'inline-flex', alignItems:'center', gap:8,
                              padding:'6px 14px',
                              background:`linear-gradient(135deg,rgba(107,127,163,.12),rgba(107,127,163,.04))`,
                              border:'1px solid rgba(107,127,163,.2)',
                              boxShadow:'0 2px 0 rgba(107,127,163,.15), inset 0 1px 0 rgba(255,255,255,.8)' }}>
                              <Building2 size={13} color={C}/>
                              <span style={{ fontWeight:800, color:CD, fontSize:13 }}>Branch #{b.branch_id}</span>
                            </div>
                          </td>
                          <td className="fr-td" style={{ textAlign:'center', fontWeight:800 }}>{b.total_sales}</td>
                          <td className="fr-td" style={{ textAlign:'center' }}>
                            <span style={{ display:'inline-flex', alignItems:'center', gap:5,
                              background:'rgba(107,127,163,.08)', padding:'3px 10px',
                              border:'1px solid rgba(107,127,163,.15)', fontWeight:800, color:CD, fontSize:13 }}>
                              <Users size={12}/>{b.worker_count}
                            </span>
                          </td>
                          <td className="fr-td" style={{ textAlign:'right', fontWeight:900, color:'#1a2742', fontSize:15 }}>
                            {parseFloat(b.total_amount||0).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* ── STEP 3: PAYMENT BREAKDOWN + DECISION ── */}
              {step===3 && (
                <>
                  {/* Payment Breakdown */}
                  <div className="fr-card" style={{ animation:'fadeUp .4s ease' }}>
                    <div className="fr-card-head">
                      <CreditCard size={20}/>
                      <span className="fr-card-head-title">Payment Method Breakdown</span>
                    </div>
                    <div style={{ padding:24, display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:16 }}>
                      {(report.payments||[]).length === 0 ? (
                        <div style={{ padding:24, textAlign:'center', color:'#94a3b8', fontWeight:600, gridColumn:'1/-1' }}>
                          No payment data available.
                        </div>
                      ) : (report.payments||[]).map((p, i) => (
                        <div key={i} className="fr-metric">
                          <div style={{ fontSize:12, fontWeight:900, color:CD, marginBottom:4, textTransform:'uppercase', letterSpacing:'.06em' }}>
                            {p.payment_type}
                          </div>
                          <div style={{ fontSize:11, color:'#94a3b8', fontWeight:700, marginBottom:14 }}>
                            {p.count} transactions
                          </div>
                          <div style={{ fontSize:26, fontWeight:900, color:'#1a2742',
                            textShadow:'1px 1px 0 rgba(255,255,255,.8)' }}>
                            {parseFloat(p.total_amount||0).toLocaleString()}
                          </div>
                          <div style={{ fontSize:13, color:'#94a3b8', fontWeight:800, marginTop:2 }}>ETB</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Decision Card */}
                  {!decision ? (
                    <div className="fr-card" style={{ animation:'fadeUp .5s ease' }}>
                      <div className="fr-card-head">
                        <ShieldCheck size={20}/>
                        <span className="fr-card-head-title">Finance Decision</span>
                      </div>
                      <div style={{ padding:28, display:'flex', flexDirection:'column', gap:20 }}>
                        {!isMatch && (
                          <div style={{
                            padding:'16px 20px', display:'flex', gap:14, alignItems:'flex-start',
                            background:'linear-gradient(135deg,#fffbeb,#fef3c7)',
                            border:'2px solid #fcd34d', color:'#b45309', fontWeight:700, fontSize:14,
                            boxShadow:'0 4px 0 #fcd34d55',
                          }}>
                            <AlertTriangle size={20} style={{ flexShrink:0, marginTop:1 }}/>
                            <span>Approval blocked: the collected amount does not match the system total. The Branch Manager must correct and resubmit this report.</span>
                          </div>
                        )}

                        <div style={{ display:'flex', gap:14, flexWrap:'wrap' }}>
                          <button className="fr-btn-approve" onClick={() => decide(true)} disabled={deciding||!isMatch}>
                            {deciding
                              ? <Loader2 size={18} style={{ animation:'spin 1s linear infinite' }}/>
                              : <ThumbsUp size={18} style={{ filter:'drop-shadow(0 2px 3px rgba(0,0,0,.2))' }}/>}
                            Approve &amp; Sync to CEO
                          </button>
                          <button className="fr-btn-reject" onClick={() => setShowReject(v => !v)} disabled={deciding}>
                            <ThumbsDown size={18} style={{ filter:'drop-shadow(0 2px 3px rgba(0,0,0,.2))' }}/>
                            Reject to Manager
                          </button>
                        </div>

                        {showReject && (
                          <div style={{ paddingTop:20, borderTop:`2px solid ${WARM}55`, animation:'fadeUp .3s ease' }}>
                            <label style={{ display:'block', fontWeight:900, color:CD, marginBottom:10, fontSize:12,
                              textTransform:'uppercase', letterSpacing:'.09em' }}>
                              Rejection Reason <span style={{ color:'#ef4444' }}>*</span>
                            </label>
                            <textarea className="fr-textarea" rows={3}
                              placeholder="Explain the mismatch or issue clearly to the Branch Manager..."
                              value={reason} onChange={e => setReason(e.target.value)}/>
                            <div style={{ display:'flex', gap:12, marginTop:14 }}>
                              <button className="fr-btn-reject"
                                style={{ padding:'12px 22px', fontSize:13 }}
                                disabled={!reason.trim() || deciding}
                                onClick={() => decide(false)}>
                                {deciding ? <Loader2 size={15} style={{ animation:'spin 1s linear infinite' }}/> : null}
                                Confirm Rejection
                              </button>
                              <button className="fr-btn-ghost"
                                style={{ padding:'12px 18px', fontSize:13 }}
                                onClick={() => setShowReject(false)}>
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="fr-card" style={{
                      animation:'fadeUp .4s ease', padding:60, textAlign:'center',
                      background: decision.action==='APPROVED'
                        ? 'linear-gradient(135deg,#f0fdf4,#dcfce7)'
                        : 'linear-gradient(135deg,#fef2f2,#fee2e2)',
                    }}>
                      {decision.action==='APPROVED' ? (
                        <>
                          <CheckCircle size={80} color="#059669" style={{ margin:'0 auto 20px', display:'block',
                            filter:'drop-shadow(0 6px 16px rgba(5,150,105,.45))' }}/>
                          <h2 style={{ margin:'0 0 12px', color:'#064e3b', fontWeight:900, fontSize:28 }}>
                            Report Approved!
                          </h2>
                          <p style={{ color:'#166534', fontWeight:600, fontSize:16, margin:'0 0 8px' }}>
                            Revenue of <strong>{decision.revenue.toLocaleString()} ETB</strong> synced to CEO dashboard.
                          </p>
                          <p style={{ color:'#10b981', fontWeight:700, fontSize:14, margin:0 }}>
                            CEO Report updated in real time.
                          </p>
                        </>
                      ) : (
                        <>
                          <XCircle size={80} color="#dc2626" style={{ margin:'0 auto 20px', display:'block',
                            filter:'drop-shadow(0 6px 16px rgba(220,38,38,.4))' }}/>
                          <h2 style={{ margin:'0 0 12px', color:'#991b1b', fontWeight:900, fontSize:28 }}>
                            Report Rejected
                          </h2>
                          <p style={{ color:'#b91c1c', fontWeight:600, fontSize:16, margin:0 }}>
                            Sent back to the Branch Manager for correction and resubmission.
                          </p>
                        </>
                      )}
                    </div>
                  )}
                </>
              )}

              {/* Navigation Buttons */}
              <div style={{ display:'flex', justifyContent:'space-between', paddingTop:4 }}>
                <button className="fr-btn-ghost" onClick={() => setStep(s => Math.max(1,s-1))} disabled={step===1}>
                  <ArrowLeft size={15}/> Previous
                </button>
                {step < 3 && (
                  <button className="fr-btn-ghost" onClick={() => setStep(s => Math.min(3,s+1))}>
                    Next <ArrowRight size={15}/>
                  </button>
                )}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
