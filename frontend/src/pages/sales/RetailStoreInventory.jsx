import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Database, RefreshCw, Send, Loader2, CheckCircle, XCircle, Search,
  Package, List, AlertTriangle, Inbox, Check, Clock, Truck, ShoppingBag,
  ArrowRight, ChevronDown, ChevronUp
} from 'lucide-react';
import apiClient from '../../services/apiClient';
import SignatureCanvas from 'react-signature-canvas';

// ── Colors ──────────────────────────────────────────────────────────────────
const CYAN   = '#d1fae5'; // emerald-100
const PURPLE = '#a7f3d0'; // emerald-200
const DARK   = '#064e3b'; // emerald-900
const MID    = '#047857'; // emerald-600
const ACCENT = '#10b981'; // emerald-500

const preloadedAudio = {
  notification: new Audio('/sounds/notification.mp3'),
  approved:     new Audio('/sounds/approved.mp3'),
  rejected:     new Audio('/sounds/rejected.mp3'),
  shipment:     new Audio('/sounds/shipment.mp3'),
  completed:    new Audio('/sounds/completed.mp3'),
};
Object.values(preloadedAudio).forEach(a => { a.load(); });

// ── Step Config ──────────────────────────────────────────────────────────────
const STEPS = [
  { key: 'PENDING_APPROVAL', label: 'Requested to CEO', icon: <Clock size={16}/> },
  { key: 'APPROVED',         label: 'CEO Approved',      icon: <CheckCircle size={16}/> },
  { key: 'SHIPPED',          label: 'Store Shipped',      icon: <Truck size={16}/> },
  { key: 'COMPLETED',        label: 'Sales Received',  icon: <ShoppingBag size={16}/> },
];
const STATUS_ORDER = {
  PENDING_APPROVAL: 0, APPROVED: 1, SHIPPED: 2, COMPLETED: 3,
  DISCREPANCY: 3, REJECTED: -1, CANCELLED: -1,
};

// ── Step Tracker ─────────────────────────────────────────────────────────────
function StepTracker({ status }) {
  const currentIdx = STATUS_ORDER[status] ?? 0;
  const isRejected = status === 'REJECTED' || status === 'CANCELLED';
  return (
    <div style={{ display:'flex', alignItems:'center', gap:0, margin:'16px 0 12px' }}>
      {STEPS.map((step, idx) => {
        const done   = idx < currentIdx;
        const active = idx === currentIdx && !isRejected;
        const bg     = isRejected ? '#fee2e2' : done ? PURPLE : active ? CYAN : '#e2e8f0';
        const col    = isRejected ? '#ef4444' : (done || active) ? DARK : '#94a3b8';
        const border = active ? `2px solid ${DARK}` : `2px solid transparent`;

        return (
          <React.Fragment key={step.key}>
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', minWidth:80 }}>
              <div className={active ? "icon3d" : ""} style={{
                width:36, height:36, background:bg,
                display:'flex', alignItems:'center', justifyContent:'center',
                color:col, border: active || done ? `2px solid ${DARK}` : `2px solid #cbd5e1`,
                boxShadow: active || done ? `0 4px 6px rgba(0,0,0,0.05)` : 'none',
              }}>
                {done ? <Check size={16}/> : step.icon}
              </div>
              <div style={{ fontSize:10, fontWeight:900, color:DARK, textAlign:'center', marginTop:8, lineHeight:1.2, textTransform:'uppercase' }}>
                {step.label}
              </div>
            </div>
            {idx < STEPS.length-1 && (
              <div style={{ flex:1, height:4, background: idx < currentIdx ? DARK : '#cbd5e1', marginBottom:28, borderTop: idx < currentIdx ? `1px solid ${DARK}` : 'none' }}/>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    PENDING_APPROVAL: { bg:PURPLE, text:DARK,     label:'⏳ Pending CEO' },
    APPROVED:         { bg:CYAN,   text:DARK,     label:'✅ CEO Approved' },
    REJECTED:         { bg:'#fee2e2', text:'#dc2626',label:'❌ Rejected' },
    SHIPPED:          { bg:'#fef3c7', text:'#d97706',label:'🚚 Shipped' },
    COMPLETED:        { bg:'#d1fae5', text:'#059669',label:'✅ Received' },
    CANCELLED:        { bg:'#f1f5f9', text:'#64748b',label:'🚫 Cancelled' },
    DISCREPANCY:      { bg:'#ffedd5', text:'#c2410c',label:'⚠️ Discrepancy' },
  };
  const c = map[status] || { bg:'#f1f5f9', text:'#64748b', label:status };
  return (
    <span className="badge3d" style={{
      background:c.bg, color:c.text, padding:'6px 14px',
      fontSize:11, fontWeight:900, whiteSpace:'nowrap',
      border:`2px solid ${c.text}`,
      textTransform:'uppercase'
    }}>{c.label}</span>
  );
}

// ── Info Box ─────────────────────────────────────────────────────────────────
function InfoBox({ label, value, color, highlight }) {
  return (
    <div className="card3d" style={{
      background: highlight ? CYAN : 'white',
      padding:'12px 14px', textAlign:'center',
      border: `3px solid ${DARK}`,
      boxShadow: `4px 4px 0 ${DARK}`,
      display: 'flex', flexDirection: 'column', justifyContent: 'center'
    }}>
      <div style={{ fontSize:22, fontWeight:900, color:DARK }}>{value??'—'}</div>
      <div style={{ fontSize:11, color:DARK, fontWeight:900, marginTop:4, textTransform:'uppercase' }}>{label}</div>
    </div>
  );
}

// ── Row detail ────────────────────────────────────────────────────────────────
function DetailRow({ label, value }) {
  return (
    <div style={{ display:'flex', justifyContent:'space-between', paddingBottom:8, marginBottom:8, borderBottom:`3px solid ${DARK}` }}>
      <span style={{ color:DARK, fontWeight:800, fontSize:12, textTransform:'uppercase' }}>{label}</span>
      <span style={{ fontWeight:900, fontSize:13, color:DARK }}>{value}</span>
    </div>
  );
}

// ── Request Card ─────────────────────────────────────────────────────────────
function RequestCard({ r, onReceive }) {
  const [expanded, setExpanded] = useState(false);
  const isShipped = r.status === 'SHIPPED';
  return (
    <div className="card3d" style={{
      background: isShipped ? CYAN : 'white',
      border: `3px solid ${DARK}`,
      marginBottom:20,
      boxShadow: `4px 4px 0 ${DARK}`,
      animation:'rowIn3D .4s ease-out both',
    }}>
      {/* Shipped Banner */}
      {isShipped && (
        <div style={{ background:DARK, padding:'12px 20px', display:'flex', alignItems:'center', gap:10, borderBottom:`3px solid ${DARK}` }}>
          <span className="icon3d"><Truck size={18} color={CYAN}/></span>
          <span style={{ color:CYAN, fontWeight:900, fontSize:13, textTransform:'uppercase' }}>📦 SHIPMENT ARRIVED — ACTION REQUIRED</span>
          <span style={{ marginLeft:'auto', background:CYAN, color:DARK, padding:'4px 12px', fontSize:11, fontWeight:900, textTransform:'uppercase', border:`2px solid ${CYAN}` }}>
            {r.shipped_qty} units ready
          </span>
        </div>
      )}
      <div style={{ padding:'20px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16 }}>
          <div>
            <div style={{ fontSize:18, fontWeight:900, color:DARK }}>{r.product_name}</div>
            <div style={{ fontSize:12, color:ACCENT, fontFamily:'monospace', marginTop:4, fontWeight:800 }}>{r.request_code}</div>
          </div>
          <StatusBadge status={r.status}/>
        </div>
        <StepTracker status={r.status}/>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginTop:20 }}>
          <InfoBox label="Requested"          value={r.requested_qty} />
          <InfoBox label="Sales Stock"     value={r.sales_qty_at_request??'—'} />
          <InfoBox label="Store Stock"        value={r.store_qty_at_request??'—'} />
          {r.shipped_qty!=null && <InfoBox label="Shipped" value={r.shipped_qty} highlight={isShipped}/>}
        </div>
        <button onClick={() => setExpanded(e => !e)}
          className="btn3d"
          style={{ marginTop:16, background:PURPLE, border:`3px solid ${DARK}`, color:DARK, fontSize:11, fontWeight:900, cursor:'pointer', display:'inline-flex', alignItems:'center', gap:6, padding:'8px 16px', textTransform:'uppercase', boxShadow:`4px 4px 0 ${DARK}` }}>
          {expanded ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
          {expanded ? 'HIDE DETAILS' : 'SHOW DETAILS'}
        </button>
        {expanded && (
          <div style={{ marginTop:16, background:PURPLE, padding:'16px', border:`3px solid ${DARK}`, boxShadow:`4px 4px 0 ${DARK}` }}>
            <DetailRow label="Urgency"      value={r.urgency}/>
            <DetailRow label="Requested At" value={r.created_at ? new Date(r.created_at).toLocaleString() : '—'}/>
            {r.approved_at && <DetailRow label="Approved At" value={new Date(r.approved_at).toLocaleString()}/>}
            {r.shipped_at  && <DetailRow label="Shipped At"  value={new Date(r.shipped_at).toLocaleString()}/>}
            {r.received_at && <DetailRow label="Received At" value={new Date(r.received_at).toLocaleString()}/>}
            {r.received_qty!=null && <DetailRow label="Received Qty" value={r.received_qty}/>}
            {r.decision_reason && <DetailRow label="Note" value={r.decision_reason}/>}
          </div>
        )}
        {isShipped && (
          <button onClick={() => onReceive(r)} 
            className="btn3d"
            style={{
            marginTop:20, width:'100%', padding:'14px',
            background:PURPLE, color:DARK, border:`3px solid ${DARK}`,
            cursor:'pointer', fontWeight:900, fontSize:14, display:'flex', alignItems:'center', justifyContent:'center', gap:8,
            boxShadow:`4px 4px 0 ${DARK}`, textTransform:'uppercase'
          }}>
            <span className="icon3d"><Inbox size={18}/></span> Confirm Receipt &amp; Update Stock
          </button>
        )}
      </div>
    </div>
  );
}

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────
export default function RetailStoreInventory() {
  const location = useLocation();
  const [activeTab,        setActiveTab]        = useState('store_stock');
  const [storeStock,       setStoreStock]       = useState([]);
  const [myRequests,       setMyRequests]       = useState([]);
  const [loading,          setLoading]          = useState(true);
  const [search,           setSearch]           = useState('');
  const [msg,              setMsg]              = useState({ type:'', text:'' });
  const [reqModal,         setReqModal]         = useState({ open:false, item:null, qty:'', urgency:'MEDIUM' });
  const [submittingReq,    setSubmittingReq]    = useState(false);
  const [receiveModal,     setReceiveModal]     = useState({ open:false, req:null, qty:'' });
  const [submittingReceive,setSubmittingReceive]= useState(false);
  const [spinning,         setSpinning]         = useState(false);
  const [savedSig,         setSavedSig]         = useState(null);
  const sigCanvas = useRef(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('tab') === 'my_requests') setActiveTab('my_requests');
  }, [location.search]);

  const loadData = async () => {
    setLoading(true);
    try {
      // apiClient interceptor returns response.data already, so invRes = { status, data:[...] }
      const [invRes, reqRes] = await Promise.all([
        apiClient.get('/retail/store-inventory'),
        apiClient.get('/retail/store-requests'),
      ]);
      const invData = invRes?.data || invRes || [];
      const reqData = reqRes?.data || reqRes || [];
      setStoreStock(Array.isArray(invData) ? invData : []);
      setMyRequests(Array.isArray(reqData) ? reqData : []);
    } catch (e) { setMsg({ type:'error', text: e?.message || 'Failed to load data.' }); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const handleRefresh = async () => {
    setSpinning(true);
    await loadData();
    setSpinning(false);
  };

  const showMsg = (text, type='success') => {
    setMsg({ type, text });
    setTimeout(() => setMsg({ type:'', text:'' }), 6000);
  };

  const submitRequest = async () => {
    const qty = parseInt(reqModal.qty);
    if (!qty || qty <= 0) return showMsg('Quantity must be greater than 0','error');
    if (!savedSig) return showMsg('Please draw and SAVE your signature before submitting','error');
    setSubmittingReq(true);
    try {
      await apiClient.post('/retail/store-requests', {
        product_id: reqModal.item.product_id || reqModal.item.id,
        requested_qty: qty, urgency: reqModal.urgency, signature: savedSig,
      });
      showMsg('✅ Transfer request sent to CEO for approval','success');
      preloadedAudio.notification.play().catch(()=>{});
      setReqModal({ open:false, item:null, qty:'', urgency:'MEDIUM' });
      setSavedSig(null);
      if (sigCanvas.current) sigCanvas.current.clear();
      loadData();
    } catch(e) { showMsg(e.message||'Failed to submit request','error'); }
    finally { setSubmittingReq(false); }
  };

  const submitReceive = async () => {
    const qty = parseInt(receiveModal.qty);
    if (isNaN(qty) || qty < 0) return showMsg('Please enter a valid quantity','error');
    setSubmittingReceive(true);
    try {
      await apiClient.patch(`/retail/store-requests/${receiveModal.req.id}/receive`, { received_qty:qty });
      const isMatch = qty === Number(receiveModal.req.shipped_qty);
      if (isMatch) {
        showMsg(`✅ ${qty} units of "${receiveModal.req.product_name}" received & added to Sales stock!`,'success');
        preloadedAudio.completed.play().catch(()=>{});
        if ('Notification' in window) {
          const grant = Notification.permission === 'granted'
            ? true : (await Notification.requestPermission()) === 'granted';
          if (grant) new Notification('📦 Stock Received!',{
            body:`${qty} units of ${receiveModal.req.product_name} added to Sales inventory.`, icon:'/favicon.ico'
          });
        }
      } else {
        showMsg('⚠️ Quantity mismatch! Discrepancy reported to CEO for review.','error');
        preloadedAudio.rejected.play().catch(()=>{});
      }
      setReceiveModal({ open:false, req:null, qty:'' });
      loadData();
    } catch(e) { showMsg(e.message||'Failed to confirm receipt','error'); }
    finally { setSubmittingReceive(false); }
  };

  const filteredStock   = storeStock.filter(d => !search || d.name?.toLowerCase().includes(search.toLowerCase()));
  const shippedRequests = myRequests.filter(r => r.status === 'SHIPPED');
  const otherRequests   = myRequests.filter(r => r.status !== 'SHIPPED');

  return (
    <div style={{ padding:0, margin:0, minHeight:'100vh', width:'100%', background:CYAN, fontFamily:"'Inter','Segoe UI',sans-serif", overflowX:'hidden' }}>
      <style>{`
        @keyframes spin     { 100%{transform:rotate(360deg)} }
        @keyframes fadeUp   { from{opacity:0;transform:translateY(22px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeSlide{ from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes shimmer  { 0%{background-position:-400px 0} 100%{background-position:400px 0} }

        @keyframes blink3D {
          0%,100%{ opacity:1;  transform:perspective(400px) rotateY(0deg)   scale(1); }
          50%    { opacity:0.5; transform:perspective(400px) rotateY(180deg) scale(1.15); }
        }
        @keyframes rowIn3D {
          from{ opacity:0; transform:perspective(900px) rotateX(-55deg) translateY(-18px); }
          to  { opacity:1; transform:perspective(900px) rotateX(0deg)   translateY(0);     }
        }
        @keyframes iconPop {
          0%,100%{ transform:scale(1)    rotateZ(0deg); }
          50%    { transform:scale(1.28) rotateZ(14deg); }
        }
        @keyframes badgePop {
          0%,100%{ transform:perspective(300px) rotateX(0deg) scale(1); }
          50%    { transform:perspective(300px) rotateX(20deg) scale(1.08); }
        }

        /* Button 3-D lift */
        .btn3d {
          transition: transform .15s cubic-bezier(.4,0,.2,1), box-shadow .15s cubic-bezier(.4,0,.2,1);
          transform-style: preserve-3d;
        }
        .btn3d:hover:not(:disabled) {
          transform: perspective(500px) translateZ(12px) translateY(-4px) rotateX(6deg) !important;
          box-shadow: 0 10px 0 ${DARK}, 0 14px 20px rgba(0,0,0,.25) !important;
        }
        .btn3d:active:not(:disabled) {
          filter: brightness(0.9);
          box-shadow: 1px 1px 0 ${DARK} !important;
        }

        /* Row / Card 3-D hover */
        .row3d, .card3d {
          transition: transform .22s ease, box-shadow .22s ease, background .22s ease;
          transform-style: preserve-3d;
        }
        .row3d:hover {
          transform: perspective(900px) scale(1.006) translateZ(7px);
          box-shadow: 0 8px 22px rgba(0,0,0,.13);
          z-index: 5;
          position: relative;
          background: white !important;
        }
        .card3d:hover {
          transform: perspective(900px) scale(1.01) translateZ(10px);
          box-shadow: 0 12px 24px rgba(0,0,0,.15), 6px 6px 0 ${DARK};
          z-index: 5;
        }

        .icon3d  { animation: blink3D 3.2s ease-in-out infinite; display:inline-block; }
        .iconPop { animation: iconPop  2.5s ease-in-out infinite; display:inline-block; }
        .badge3d { animation: badgePop 2.8s ease-in-out infinite; display:inline-block; }
      `}</style>

      {/* Toast */}
      {msg.text && (
        <div style={{
          position:'fixed', top:20, right:20, zIndex:9999999,
          padding:'12px 24px', display:'flex', alignItems:'center', gap:10,
          background: msg.type==='success' ? CYAN : '#fef2f2',
          border:`3px solid ${DARK}`,
          color: msg.type==='success' ? DARK : '#991b1b',
          fontWeight:900, fontSize:13, textTransform:'uppercase',
          animation:'fadeSlide .3s ease',
          boxShadow:`4px 4px 0 ${DARK}`,
        }}>
          <span className="icon3d">
            {msg.type==='success' ? <CheckCircle size={18}/> : <XCircle size={18}/>}
          </span>
          {msg.text}
        </div>
      )}

      {/* ── HEADER ── */}
      <div style={{ background: DARK, borderBottom: `4px solid ${ACCENT}`, padding: '0 24px', animation: 'fadeUp .3s ease' }}>
        <div style={{ height: 3, background: `linear-gradient(90deg,${ACCENT},${CYAN},${PURPLE},${ACCENT})`, backgroundSize: '400% 100%', animation: 'shimmer 2.5s linear infinite' }} />
        
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'18px 0', flexWrap:'wrap', gap:16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div className="icon3d" style={{
              width: 48, height: 48, background: PURPLE,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: `3px solid ${DARK}`, boxShadow: `4px 4px 0 ${DARK}`,
            }}>
              <Database size={24} color={DARK} />
            </div>
            <div>
              <h1 style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-1px', color: CYAN, margin: 0, lineHeight: 1.1 }}>
                Store Inventory
              </h1>
              <p style={{ margin: 0, fontSize: 11, fontWeight: 900, letterSpacing: '3px', textTransform: 'uppercase', color: PURPLE }}>
                Request Stock • Track Shipments
              </p>
            </div>
          </div>
          <div style={{ display:'flex', gap:10 }}>
            {shippedRequests.length > 0 && activeTab !== 'my_requests' && (
              <button type="button" onClick={() => setActiveTab('my_requests')} className="btn3d" style={{
                background:PURPLE, color:DARK, border:`3px solid ${DARK}`,
                padding:'10px 18px', fontWeight:900, fontSize:12, cursor:'pointer',
                boxShadow:`4px 4px 0 ${DARK}`, display:'inline-flex',
                alignItems:'center', gap:8, textTransform:'uppercase', letterSpacing:'1px',
              }}>
                <Truck size={16} color={DARK} /> Receive Shipments ({shippedRequests.length}) <ArrowRight size={16} />
              </button>
            )}
            <button type="button" onClick={handleRefresh} disabled={loading} className="btn3d" style={{
              background:CYAN, color:DARK, border:`3px solid ${DARK}`,
              padding:'10px 18px', fontWeight:900, fontSize:12, cursor:'pointer',
              boxShadow:`4px 4px 0 ${DARK}`, display:'inline-flex',
              alignItems:'center', gap:8, textTransform:'uppercase', letterSpacing:'1px',
            }}>
              <RefreshCw size={16} style={spinning || loading ? { animation:'spin .7s linear infinite' } : {}}/>
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div style={{ padding:'24px', animation:'fadeUp .35s ease' }}>

        {/* ── KPI CHIPS ── */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:20, marginBottom:24 }}>
          {[
            { label:'Store Items',    value:storeStock.length,                         icon:Package,  color:PURPLE },
            { label:'My Requests',    value:myRequests.length,                          icon:List,     color:CYAN },
            { label:'Shipped',        value:shippedRequests.length,                     icon:Truck,    color:PURPLE },
            { label:'Completed',      value:myRequests.filter(r=>r.status==='COMPLETED').length, icon:CheckCircle, color:CYAN },
          ].map((kpi,i) => (
            <div key={i} className="card3d" style={{ padding:24, background:kpi.color, border:`3px solid ${DARK}`, boxShadow:`4px 4px 0 ${DARK}`, display:'flex', flexDirection:'column' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                <span style={{ fontSize:12, fontWeight:900, color:DARK, textTransform:'uppercase', letterSpacing:'.05em' }}>{kpi.label}</span>
                <div className="iconPop" style={{ background:DARK, padding:8, border:`3px solid ${DARK}` }}>
                  <kpi.icon size={18} color={'white'}/>
                </div>
              </div>
              <div style={{ fontSize:'2.5rem', fontWeight:900, color:DARK, marginTop:16 }}>
                {kpi.value}
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display:'flex', gap:12, marginBottom:24 }}>
          <button type="button" className="btn3d" onClick={(e) => { e.preventDefault(); setActiveTab('store_stock'); }} style={{
            background: activeTab === 'store_stock' ? DARK : 'white',
            color: activeTab === 'store_stock' ? CYAN : DARK,
            border: `3px solid ${DARK}`, padding: '12px 24px', fontWeight: 900, fontSize: 13, textTransform: 'uppercase',
            boxShadow: `4px 4px 0 ${DARK}`
          }}>
            <span className="icon3d"><Package size={16}/></span> Store Stock
          </button>
          <button type="button" className="btn3d" onClick={(e) => { e.preventDefault(); setActiveTab('my_requests'); }} style={{
            background: activeTab === 'my_requests' ? DARK : 'white',
            color: activeTab === 'my_requests' ? CYAN : DARK,
            border: `3px solid ${DARK}`, padding: '12px 24px', fontWeight: 900, fontSize: 13, textTransform: 'uppercase',
            boxShadow: `4px 4px 0 ${DARK}`, display:'flex', alignItems:'center', gap:8
          }}>
            <span className="icon3d"><List size={16}/></span> My Shipment Tracking
            {shippedRequests.length > 0 && (
              <span className="badge3d" style={{ background:'#ef4444', color:'white', padding:'2px 8px', fontSize:11, fontWeight:900, border:`2px solid ${activeTab === 'my_requests' ? CYAN : DARK}` }}>
                {shippedRequests.length}
              </span>
            )}
          </button>
        </div>

        {/* ── STORE STOCK TAB ── */}
        {activeTab === 'store_stock' && (
          <div style={{ animation:'fadeUp .4s ease' }}>
            <div style={{ marginBottom:20 }}>
              <div style={{ position:'relative', maxWidth:400 }}>
                <Search size={18} color={DARK} style={{ position:'absolute', left:14, top:13, pointerEvents:'none' }}/>
                <input type="text" placeholder="Search store items..." value={search} onChange={e => setSearch(e.target.value)}
                  style={{ width:'100%', padding:'12px 16px 12px 44px', border:`3px solid ${DARK}`,
                    fontSize:14, outline:'none', background:'white', color:DARK,
                    boxSizing:'border-box', fontWeight:900,
                    boxShadow:`4px 4px 0 ${DARK}`, textTransform:'uppercase'
                  }}/>
              </div>
            </div>

            <div style={{ background:'white', border:`3px solid ${DARK}`, boxShadow:`4px 4px 0 ${DARK}`, overflow:'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                  <thead>
                    <tr>
                      <th style={{ padding:'14px 18px', textAlign:'left', fontWeight:900, color:'white', background:DARK, borderBottom:`3px solid ${DARK}`, textTransform:'uppercase', letterSpacing:'.05em' }}>product Name</th>
                      <th style={{ padding:'14px 18px', textAlign:'left', fontWeight:900, color:'white', background:DARK, borderBottom:`3px solid ${DARK}`, textTransform:'uppercase', letterSpacing:'.05em' }}>Category</th>
                      <th style={{ padding:'14px 18px', textAlign:'center', fontWeight:900, color:'white', background:DARK, borderBottom:`3px solid ${DARK}`, textTransform:'uppercase', letterSpacing:'.05em' }}>Amount</th>
                      <th style={{ padding:'14px 18px', textAlign:'center', fontWeight:900, color:'white', background:DARK, borderBottom:`3px solid ${DARK}`, textTransform:'uppercase', letterSpacing:'.05em' }}>Unit</th>
                      <th style={{ padding:'14px 18px', textAlign:'center', fontWeight:900, color:'white', background:DARK, borderBottom:`3px solid ${DARK}`, textTransform:'uppercase', letterSpacing:'.05em' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={5} style={{ padding:60, textAlign:'center' }}>
                        <Loader2 size={40} color={DARK} style={{ animation:'spin 1s linear infinite' }}/>
                        <div style={{ marginTop:12, fontWeight:900, color:DARK, textTransform:'uppercase' }}>Loading Store Inventory...</div>
                      </td></tr>
                    ) : filteredStock.length === 0 ? (
                      <tr><td colSpan={5} style={{ padding:60, textAlign:'center', color:DARK, fontWeight:900, textTransform:'uppercase' }}>
                        <span className="iconPop" style={{ display:'block', fontSize:40, marginBottom:16 }}>📦</span>
                        No items found.
                      </td></tr>
                    ) : filteredStock.map((item, idx) => {
                      const hasOpen = myRequests.some(r =>
                        r.product_id===(item.product_id||item.id) && ['PENDING_APPROVAL','APPROVED','SHIPPED'].includes(r.status)
                      );
                      const qty   = Number(item.stock_quantity) || 0;
                      const clr   = qty <= 0 ? '#dc2626' : qty < 10 ? '#d97706' : DARK;
                      const dName = item.name || item.product_name || `product #${item.product_id||item.id||idx+1}`;
                      const dUnit = item.unit || item.product_unit || 'pcs';
                      const dCat  = item.category || item.product_category || '—';
                      return (
                        <tr key={`row-${item.id||idx}`} className="row3d" style={{ borderBottom:`3px solid ${DARK}`, background: idx % 2 === 0 ? 'white' : PURPLE, animation: `rowIn3D .3s ease-out ${idx*0.03}s both` }}>
                          <td style={{ padding:'14px 18px', fontWeight:900, color:DARK }}>
                            {dName}
                          </td>
                          <td style={{ padding:'14px 18px' }}>
                            <span className="badge3d" style={{ display:'inline-block', background:CYAN, color:DARK, padding:'4px 12px', fontSize:11, fontWeight:900, border:`2px solid ${DARK}`, textTransform:'uppercase' }}>
                              {dCat}
                            </span>
                          </td>
                          <td style={{ padding:'14px 18px', textAlign:'center', fontSize:20, fontWeight:900, color:clr }}>
                            {qty.toLocaleString()}
                          </td>
                          <td style={{ padding:'14px 18px', textAlign:'center' }}>
                            <span style={{ display:'inline-block', background:DARK, color:CYAN, padding:'4px 12px', fontSize:12, fontWeight:900, textTransform:'uppercase' }}>
                              {dUnit}
                            </span>
                          </td>
                          <td style={{ padding:'14px 18px', textAlign:'center' }}>
                            {hasOpen
                              ? <span className="badge3d" style={{ display:'inline-block', background:'#fef3c7', color:'#92400e', padding:'8px 16px', fontSize:11, fontWeight:900, border:'1px solid #fcd34d', textTransform:'uppercase' }}>
                                  ⏳ Pending CEO
                                </span>
                              : <button type="button" onClick={(e) => { e.preventDefault(); setReqModal({ open:true, item, qty:'', urgency:'MEDIUM' }); }}
                                  className="btn3d"
                                  style={{ background:CYAN, color:DARK, border:`3px solid ${DARK}`, padding:'8px 16px', fontWeight:900, fontSize:12, cursor:'pointer', display:'inline-flex', alignItems:'center', gap:6, textTransform:'uppercase', boxShadow:`4px 4px 0 ${DARK}` }}>
                                  <Send size={14}/> Request
                                </button>
                            }
                          </td>
                        </tr>
                      );
                    })}

                    {filteredStock.length > 0 && (
                      <tr style={{ background:DARK }}>
                        <td colSpan={2} style={{ padding:'16px 18px', fontSize:14, fontWeight:900, color:CYAN, textTransform:'uppercase' }}>
                          GRAND TOTAL
                        </td>
                        <td style={{ padding:'16px 18px', textAlign:'center', fontSize:22, fontWeight:900, color:CYAN }}>
                          {filteredStock.reduce((s,d)=>s+(Number(d.stock_quantity)||0),0).toLocaleString()}
                        </td>
                        <td style={{ padding:'16px 18px', textAlign:'center', fontSize:12, fontWeight:900, color:CYAN, textTransform:'uppercase' }}>
                          UNITS
                        </td>
                        <td></td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── MY REQUESTS TAB ── */}
        {activeTab === 'my_requests' && (
          <div style={{ animation:'fadeUp .4s ease' }}>
            {loading && myRequests.length===0 ? (
              <div style={{ textAlign:'center', padding:60 }}>
                <Loader2 size={40} color={DARK} style={{ animation:'spin 1s linear infinite' }}/>
              </div>
            ) : myRequests.length === 0 ? (
              <div className="card3d" style={{ textAlign:'center', padding:60, background:'white', border:`3px solid ${DARK}`, boxShadow:`4px 4px 0 ${DARK}` }}>
                <span className="iconPop" style={{ display:'block', fontSize:60, marginBottom:20 }}>🚚</span>
                <div style={{ fontWeight:900, fontSize:22, color:DARK, marginBottom:10, textTransform:'uppercase' }}>No Transfer Requests Yet</div>
                <div style={{ fontSize:14, color:DARK, fontWeight:700 }}>Go to the "Store Stock" tab to request products from the store.</div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 24 }}>
                {shippedRequests.length > 0 && (
                  <div style={{ gridColumn: '1 / -1', marginBottom:4, fontSize:14, fontWeight:900, color:DARK, display:'flex', alignItems:'center', gap:8, textTransform:'uppercase', letterSpacing:'.06em' }}>
                    <span className="icon3d"><Truck size={18}/></span> Awaiting Your Receipt ({shippedRequests.length})
                  </div>
                )}
                {shippedRequests.map(r => (
                  <RequestCard key={r.id} r={r} onReceive={req => setReceiveModal({ open:true, req, qty:String(req.shipped_qty||'') })}/>
                ))}
                
                {otherRequests.length > 0 && shippedRequests.length > 0 && (
                  <div style={{ gridColumn: '1 / -1', margin:'20px 0 4px', fontSize:14, fontWeight:900, color:DARK, textTransform:'uppercase', letterSpacing:'.06em' }}>
                    Other Requests
                  </div>
                )}
                {otherRequests.map(r => (
                  <RequestCard key={r.id} r={r} onReceive={req => setReceiveModal({ open:true, req, qty:String(req.shipped_qty||'') })}/>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── REQUEST MODAL ── */}
      {reqModal.open && (
        <div
          onMouseDown={e => { if (e.target === e.currentTarget) { setReqModal({open:false,item:null,qty:'',urgency:'MEDIUM'}); setSavedSig(null); sigCanvas.current?.clear(); } }}
          style={{ position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.75)', zIndex:99999, overflowY:'auto', display:'flex', alignItems:'flex-start', justifyContent:'center', padding:'40px 16px' }}>
          <div style={{ margin:'auto', flexShrink:0, background:CYAN, width:500, maxWidth:'100%', border:`4px solid ${DARK}`, boxShadow:`8px 8px 0 ${DARK}` }}>
            <div style={{ padding:'20px 24px', background:DARK, borderBottom:`3px solid ${DARK}` }}>
              <h3 style={{ margin:0, fontSize:20, color:CYAN, fontWeight:900, textTransform:'uppercase' }}>Request Transfer from Store</h3>
              <p style={{ margin:'6px 0 0', fontSize:14, color:'white', fontWeight:800 }}>{reqModal.item?.name}</p>
            </div>
            <div style={{ padding:24, display:'flex', flexDirection:'column', gap:20 }}>
              <div>
                <label style={{ display:'block', fontSize:12, fontWeight:900, marginBottom:8, textTransform:'uppercase', color:DARK }}>Quantity to Request</label>
                <input type="number" min="1" value={reqModal.qty} onChange={e => setReqModal({...reqModal, qty:e.target.value})}
                  style={{ width:'100%', padding:'14px 16px', border:`3px solid ${DARK}`, outline:'none', boxSizing:'border-box', fontWeight:900, fontSize:18, fontFamily:'Inter', boxShadow:`4px 4px 0 ${DARK}` }} autoFocus/>
              </div>
              <div>
                <label style={{ display:'block', fontSize:12, fontWeight:900, marginBottom:8, textTransform:'uppercase', color:DARK }}>Urgency</label>
                <select value={reqModal.urgency} onChange={e => setReqModal({...reqModal, urgency:e.target.value})}
                  style={{ width:'100%', padding:'14px 16px', border:`3px solid ${DARK}`, outline:'none', fontWeight:900, fontSize:14, fontFamily:'Inter', boxShadow:`4px 4px 0 ${DARK}` }}>
                  <option value="LOW">LOW</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HIGH">HIGH</option>
                </select>
              </div>
              <div>
                <label style={{ display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:12, fontWeight:900, marginBottom:8, textTransform:'uppercase', color:DARK }}>
                  <span>Digital Signature {savedSig && <span style={{ color:'#166534', fontSize:10, marginLeft:6, background:'#dcfce7', padding:'2px 8px', border:'2px solid #166534' }}>✓ SAVED</span>}</span>
                  <button type="button" onClick={() => { sigCanvas.current?.clear(); setSavedSig(null); }}
                    style={{ fontSize:10, color:'white', background:'#ef4444', border:`3px solid ${DARK}`, cursor:'pointer', fontWeight:900, padding:'4px 10px', textTransform:'uppercase', boxShadow:`4px 4px 0 ${DARK}` }}>Clear</button>
                </label>
                <div style={{ border:`3px solid ${DARK}`, background:'white', boxShadow:`4px 4px 0 ${DARK}` }}>
                  <SignatureCanvas ref={sigCanvas} penColor={DARK} canvasProps={{ width:452, height:120 }}/>
                </div>
                <button type="button"
                  onClick={() => {
                    if (!sigCanvas.current || sigCanvas.current.isEmpty()) { showMsg('Draw your signature first','error'); return; }
                    setSavedSig(sigCanvas.current.toDataURL());
                    showMsg('✅ Signature saved!','success');
                  }}
                  style={{ marginTop:10, width:'100%', padding:'10px', background:'#166534', color:'white', border:`3px solid ${DARK}`, fontWeight:900, fontSize:12, textTransform:'uppercase', cursor:'pointer', boxShadow:`4px 4px 0 ${DARK}`, display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                  💾 Save Signature
                </button>
                {savedSig && (
                  <div style={{ marginTop:8, border:`2px solid #166534`, padding:8, background:'#f0fdf4' }}>
                    <div style={{ fontSize:10, fontWeight:900, color:'#166534', marginBottom:4, textTransform:'uppercase' }}>Saved Preview:</div>
                    <img src={savedSig} alt="signature" style={{ maxWidth:'100%', height:50, objectFit:'contain', display:'block' }}/>
                  </div>
                )}
              </div>
              <div style={{ display:'flex', gap:12, marginTop:10 }}>
                <button type="button"
                  onClick={() => { setReqModal({open:false,item:null,qty:'',urgency:'MEDIUM'}); setSavedSig(null); sigCanvas.current?.clear(); }}
                  style={{ flex:1, padding:'14px', background:'white', color:DARK, border:`3px solid ${DARK}`, fontWeight:900, fontSize:13, textTransform:'uppercase', cursor:'pointer', boxShadow:`4px 4px 0 ${DARK}` }}>Cancel</button>
                <button type="button"
                  onClick={() => submitRequest()}
                  disabled={submittingReq}
                  style={{ flex:2, padding:'14px', background:PURPLE, color:DARK, border:`3px solid ${DARK}`, fontWeight:900, fontSize:13, textTransform:'uppercase', cursor: submittingReq ? 'not-allowed' : 'pointer', boxShadow:`4px 4px 0 ${DARK}`, display:'flex', alignItems:'center', justifyContent:'center', gap:8, opacity: submittingReq ? 0.7 : 1 }}>
                  {submittingReq ? <Loader2 size={16} style={{ animation:'spin 1s linear infinite' }}/> : <Send size={16}/>}
                  {submittingReq ? 'Submitting...' : 'Submit to CEO'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── RECEIVE MODAL ── */}
      {receiveModal.open && receiveModal.req && (
        <div style={{ position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(26,28,41,.8)', zIndex:99999, overflowY:'auto', display:'flex', alignItems:'flex-start', justifyContent:'center', padding:'40px 16px', backdropFilter:'blur(4px)' }}>
          <div className="card3d" style={{ margin:'auto', flexShrink:0, background:CYAN, width:540, maxWidth:'100%', border:`3px solid ${DARK}`, boxShadow:`6px 6px 0 ${DARK}`, animation:'fadeUp .25s ease' }}>
            <div style={{ background:DARK, padding:'24px', display:'flex', alignItems:'center', gap:16, borderBottom:`3px solid ${DARK}` }}>
              <div className="iconPop" style={{ background:CYAN, padding:12, border:`3px solid ${DARK}` }}>
                <Inbox size={28} color={DARK}/>
              </div>
              <div>
                <h3 style={{ margin:0, fontSize:20, color:CYAN, fontWeight:900, textTransform:'uppercase' }}>Confirm Receipt</h3>
                <p style={{ margin:'4px 0 0', fontSize:13, color:'white', fontWeight:800, textTransform:'uppercase' }}>Step 4 of 4 — Sales Receiving</p>
              </div>
            </div>
            <div style={{ padding:28 }}>
              <div style={{ background:'white', border:`3px solid ${DARK}`, padding:'20px', marginBottom:24, boxShadow:`4px 4px 0 ${DARK}` }}>
                <div style={{ fontSize:22, fontWeight:900, color:DARK }}>{receiveModal.req.product_name}</div>
                <div style={{ fontSize:12, color:ACCENT, fontFamily:'monospace', marginTop:6, fontWeight:900 }}>{receiveModal.req.request_code}</div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12, marginTop:20 }}>
                  <InfoBox label="Requested"     value={receiveModal.req.requested_qty} />
                  <InfoBox label="Shipped"        value={receiveModal.req.shipped_qty} highlight />
                  <InfoBox label="Pharm Stock" value={receiveModal.req.sales_qty_at_request??'—'} />
                </div>
              </div>
              <StepTracker status="SHIPPED"/>
              <div style={{ height:4, background:DARK, margin:'24px 0' }}/>
              <label style={{ display:'block', fontSize:14, fontWeight:900, marginBottom:10, color:DARK, textTransform:'uppercase', letterSpacing:'.05em' }}>
                Actual Quantity You Received
              </label>
              <input type="number" min="0" value={receiveModal.qty}
                onChange={e => setReceiveModal({...receiveModal, qty:e.target.value})}
                style={{ width:'100%', padding:'16px 20px', border:`3px solid ${DARK}`, outline:'none', fontSize:22, fontWeight:900, boxSizing:'border-box', boxShadow:`4px 4px 0 ${DARK}` }}
                autoFocus placeholder="Enter count received..."/>
              {receiveModal.qty !== '' && (
                parseInt(receiveModal.qty) === Number(receiveModal.req.shipped_qty) ? (
                  <div className="badge3d" style={{ marginTop:12, background:'#d1fae5', border:`3px solid ${DARK}`, padding:'10px 14px', color:DARK, fontSize:13, display:'flex', alignItems:'center', gap:8, fontWeight:900, textTransform:'uppercase', boxShadow:`3px 3px 0 ${DARK}` }}>
                    <Check size={18}/> Quantities match — Add to stock
                  </div>
                ) : (
                  <div className="badge3d" style={{ marginTop:12, background:'#fee2e2', border:`3px solid #991b1b`, padding:'10px 14px', color:'#991b1b', fontSize:13, display:'flex', alignItems:'center', gap:8, fontWeight:900, textTransform:'uppercase', boxShadow:`3px 3px 0 #991b1b` }}>
                    <AlertTriangle size={18}/> Mismatch! Triggers discrepancy report
                  </div>
                )
              )}
              <div style={{ display:'flex', gap:16, marginTop:28 }}>
                <button type="button" onClick={(e) => { e.preventDefault(); setReceiveModal({open:false,req:null,qty:''}); }} className="btn3d" style={{ flex:1, padding:'16px', background:'white', color:DARK, border:`3px solid ${DARK}`, fontWeight:900, fontSize:14, textTransform:'uppercase', boxShadow:`4px 4px 0 ${DARK}` }}>Cancel</button>
                <button type="button" onClick={(e) => { e.preventDefault(); submitReceive(); }} disabled={submittingReceive||receiveModal.qty===''} className="btn3d" style={{ flex:2, padding:'16px', background:PURPLE, color:DARK, border:`3px solid ${DARK}`, cursor: submittingReceive||receiveModal.qty===''?'not-allowed':'pointer', fontWeight:900, fontSize:14, textTransform:'uppercase', display:'flex', alignItems:'center', justifyContent:'center', gap:10, boxShadow:`4px 4px 0 ${DARK}`, opacity: submittingReceive||receiveModal.qty===''?0.6:1 }}>
                  {submittingReceive ? 'Processing...' : 'Confirm & Update Stock'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
