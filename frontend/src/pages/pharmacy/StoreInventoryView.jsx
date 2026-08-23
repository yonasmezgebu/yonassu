import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import './StoreInventoryView.css';
import {
  Database, RefreshCw, Send, Loader2, CheckCircle, XCircle, Search,
  Package, List, AlertTriangle, Inbox, Check, Clock, Truck, ShoppingBag,
  ArrowRight, ChevronDown, ChevronUp
} from 'lucide-react';
import apiClient from '../../services/apiClient';
import SignatureCanvas from 'react-signature-canvas';
import SegmentedSpinner from '../../components/ui/SegmentedSpinner';

// ── Colors ──────────────────────────────────────────────────────────────────
const CYAN   = '#d1fae5'; // emerald-100
const PURPLE = '#a7f3d0'; // emerald-200
const DARK   = '#064e3b'; // emerald-900
const MID    = '#047857'; // emerald-600
const ACCENT = '#10b981'; // emerald-500


// ── Step Config ──────────────────────────────────────────────────────────────
const STEPS = [
  { key: 'PENDING_APPROVAL', label: 'Requested', icon: <Clock size={16}/> },
  { key: 'APPROVED',         label: 'Approved',  icon: <CheckCircle size={16}/> },
  { key: 'SHIPPED',          label: 'Shipped',   icon: <Truck size={16}/> },
  { key: 'COMPLETED',        label: 'Received',  icon: <ShoppingBag size={16}/> },
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
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', margin:'16px 0', width:'100%', maxWidth:500 }}>
      {STEPS.map((step, idx) => {
        const done   = idx < currentIdx;
        const active = idx === currentIdx && !isRejected;
        const bg     = isRejected ? '#FEE2E2' : active ? '#2563EB' : done ? '#16A34A' : '#F3F4F6';
        const col    = isRejected ? '#DC2626' : (active || done) ? '#FFFFFF' : '#9CA3AF';
        
        return (
          <React.Fragment key={step.key}>
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', position:'relative', zIndex:2 }}>
              <div style={{ width:32, height:32, borderRadius:'50%', background:bg, color:col, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:(active||done)?'0 2px 4px rgba(0,0,0,0.1)':'none', transition:'all 0.2s' }}>
                {done ? <Check size={16}/> : step.icon}
              </div>
              <div style={{ fontSize:10, fontWeight:600, color:(active||done)?'#111827':'#9CA3AF', marginTop:6, textTransform:'uppercase', letterSpacing:'0.02em', textAlign:'center', position:'absolute', top:36, width:100, left:'50%', transform:'translateX(-50%)' }}>
                {step.label}
              </div>
            </div>
            {idx < STEPS.length-1 && (
              <div style={{ flex:1, height:2, background: idx < currentIdx ? '#16A34A' : '#E5E7EB', margin:'0 8px', zIndex:1 }}/>
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
    PENDING_APPROVAL: { bg:'#F3F4F6', text:'#4B5563', label:'Pending CEO' },
    APPROVED:         { bg:'#E0F2FE', text:'#0284C7', label:'CEO Approved' },
    REJECTED:         { bg:'#FEE2E2', text:'#DC2626', label:'Rejected' },
    SHIPPED:          { bg:'#FEF3C7', text:'#D97706', label:'Shipped' },
    COMPLETED:        { bg:'#DCFCE7', text:'#16A34A', label:'Received' },
    CANCELLED:        { bg:'#F3F4F6', text:'#4B5563', label:'Cancelled' },
    DISCREPANCY:      { bg:'#FEF3C7', text:'#D97706', label:'Discrepancy' },
  };
  const c = map[status] || { bg:'#F3F4F6', text:'#4B5563', label:status };
  return (
    <span style={{
      background:c.bg, color:c.text, padding:'4px 10px', borderRadius:999,
      fontSize:11.5, fontWeight:600, whiteSpace:'nowrap', textTransform:'uppercase', letterSpacing:'0.02em'
    }}>{c.label}</span>
  );
}

// ── Detail Row ────────────────────────────────────────────────────────────────
function DetailRow({ label, value }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
      <span style={{ color:'#6B7280', fontWeight:500, fontSize:11, textTransform:'uppercase', letterSpacing:'0.03em' }}>{label}</span>
      <span style={{ fontWeight:500, fontSize:13, color:'#111827' }}>{value}</span>
    </div>
  );
}

// ── Request Card (Rendered as Table Row) ─────────────────────────────────────
function RequestCard({ r, onReceive }) {
  const [expanded, setExpanded] = useState(false);
  const isShipped = r.status === 'SHIPPED';
  return (
    <React.Fragment>
      <tr className="siv-req-row" style={{ background: isShipped ? '#EFF6FF' : 'transparent', borderBottom: expanded ? 'none' : '1px solid var(--c-border)', transition:'background 150ms ease' }}>
        <td style={{ padding:'12px 18px', fontWeight:500 }}>{r.request_code}</td>
        <td style={{ padding:'12px 18px', fontWeight:500, color:'#111827' }}>{r.drug_name}</td>
        <td style={{ padding:'12px 18px' }}>{r.requested_qty}</td>
        <td style={{ padding:'12px 18px' }}>{r.shipped_qty||'—'}</td>
        <td style={{ padding:'12px 18px' }}><StatusBadge status={r.status}/></td>
        <td style={{ padding:'12px 18px', textAlign:'right' }}>
          <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
            <button onClick={() => setExpanded(e => !e)} className="siv-btn siv-btn-ghost">
              {expanded ? 'Hide' : 'Details'}
            </button>
            {isShipped && (
              <button onClick={() => onReceive(r)} className="siv-btn siv-btn-primary">
                Receive
              </button>
            )}
          </div>
        </td>
      </tr>
      {expanded && (
        <tr style={{ background: isShipped ? '#EFF6FF' : '#F9FAFB', borderBottom:'1px solid var(--c-border)' }}>
          <td colSpan={6} style={{ padding:'16px 24px 32px' }}>
            <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
              <StepTracker status={r.status}/>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(160px, 1fr))', gap:20, background:'#FFFFFF', padding:16, borderRadius:8, border:'1px solid #E5E7EB' }}>
                <DetailRow label="Pharm Stock at Req" value={r.pharmacy_qty_at_request??'—'}/>
                <DetailRow label="Store Stock at Req" value={r.store_qty_at_request??'—'}/>
                <DetailRow label="Urgency"      value={r.urgency}/>
                <DetailRow label="Requested At" value={r.created_at ? new Date(r.created_at).toLocaleString() : '—'}/>
                {r.approved_at && <DetailRow label="Approved At" value={new Date(r.approved_at).toLocaleString()}/>}
                {r.shipped_at  && <DetailRow label="Shipped At"  value={new Date(r.shipped_at).toLocaleString()}/>}
                {r.received_at && <DetailRow label="Received At" value={new Date(r.received_at).toLocaleString()}/>}
                {r.received_qty!=null && <DetailRow label="Received Qty" value={r.received_qty}/>}
                {r.decision_reason && <DetailRow label="Note" value={r.decision_reason}/>}
              </div>
            </div>
          </td>
        </tr>
      )}
    </React.Fragment>
  );
}

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────
export default function StoreInventoryView() {
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
      const [invRes, reqRes] = await Promise.all([
        apiClient.get('/pharmacy/store-inventory'),
        apiClient.get('/transfer-requests'),
      ]);
      const invData = invRes?.data?.data || invRes?.data || invRes || [];
      const reqData = reqRes?.data?.data || reqRes?.data || reqRes || [];
      setStoreStock(Array.isArray(invData) ? invData : []);
      setMyRequests(Array.isArray(reqData) ? reqData : []);
    } catch { setMsg({ type:'error', text:'Failed to load data.' }); }
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
      await apiClient.post('/transfer-requests', {
        drug_id: reqModal.item.drug_id || reqModal.item.id,
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
      await apiClient.patch(`/transfer-requests/${receiveModal.req.id}/receive`, { received_qty:qty });
      const isMatch = qty === Number(receiveModal.req.shipped_qty);
      if (isMatch) {
        showMsg(`✅ ${qty} units of "${receiveModal.req.drug_name}" received & added to Pharmacy stock!`,'success');
        preloadedAudio.completed.play().catch(()=>{});
        if ('Notification' in window) {
          const grant = Notification.permission === 'granted'
            ? true : (await Notification.requestPermission()) === 'granted';
          if (grant) new Notification('📦 Stock Received!',{
            body:`${qty} units of ${receiveModal.req.drug_name} added to Pharmacy inventory.`, icon:'/favicon.ico'
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
    <div className="siv-root" style={{ padding:0, margin:0, minHeight:'100vh', width:'100%', background:CYAN, fontFamily:"'Inter','Segoe UI',sans-serif", overflowX:'hidden' }}>
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
      <div className="siv-header" style={{ background: DARK, borderBottom: `4px solid ${ACCENT}`, padding: '0 24px', animation: 'fadeUp .3s ease' }}>
        <div style={{ height: 3, background: `linear-gradient(90deg,${ACCENT},${CYAN},${PURPLE},${ACCENT})`, backgroundSize: '400% 100%', animation: 'shimmer 2.5s linear infinite' }} />
        
        <div className="siv-header-inner" style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'18px 0', flexWrap:'wrap', gap:16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div className="icon3d" style={{
              width: 48, height: 48, background: PURPLE,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: `3px solid ${DARK}`, boxShadow: `4px 4px 0 ${DARK}`,
            }}>
              <Database size={24} color={DARK} />
            </div>
            <div>
              <h1 className="siv-title" style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-1px', color: CYAN, margin: 0, lineHeight: 1.1 }}>
                Store Inventory
              </h1>
              <p className="siv-subtitle" style={{ margin: 0, fontSize: 11, fontWeight: 900, letterSpacing: '3px', textTransform: 'uppercase', color: PURPLE }}>
                Request Stock • Track Shipments
              </p>
            </div>
          </div>
          <div style={{ display:'flex', gap:10 }}>
            {shippedRequests.length > 0 && activeTab !== 'my_requests' && (
              <button type="button" onClick={() => setActiveTab('my_requests')} className="btn3d siv-btn-shipped" style={{
                background:PURPLE, color:DARK, border:`3px solid ${DARK}`,
                padding:'10px 18px', fontWeight:900, fontSize:12, cursor:'pointer',
                boxShadow:`4px 4px 0 ${DARK}`, display:'inline-flex',
                alignItems:'center', gap:8, textTransform:'uppercase', letterSpacing:'1px',
              }}>
                <Truck size={16} color={DARK} /> Receive Shipments ({shippedRequests.length}) <ArrowRight size={16} />
              </button>
            )}
            <button type="button" onClick={handleRefresh} disabled={loading} className="btn3d siv-btn-refresh" style={{
              background:CYAN, color:DARK, border:`3px solid ${DARK}`,
              padding:'10px 18px', fontWeight:900, fontSize:12, cursor:'pointer',
              boxShadow:`4px 4px 0 ${DARK}`, display:'inline-flex',
              alignItems:'center', gap:8, textTransform:'uppercase', letterSpacing:'1px',
            }}>
              <SegmentedSpinner size={16} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="siv-body" style={{ padding:'24px', animation:'fadeUp .35s ease' }}>

        {/* ── KPI CHIPS ── */}
        <div className="siv-kpi-grid" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:20, marginBottom:24 }}>
          {[
            { label:'Store Items',    value:storeStock.length,                         icon:Package,  color:PURPLE },
            { label:'My Requests',    value:myRequests.length,                          icon:List,     color:CYAN },
            { label:'Shipped',        value:shippedRequests.length,                     icon:Truck,    color:PURPLE },
            { label:'Completed',      value:myRequests.filter(r=>r.status==='COMPLETED').length, icon:CheckCircle, color:CYAN },
          ].map((kpi,i) => (
            <div key={i} className="card3d siv-kpi-card" style={{ padding:24, background:kpi.color, border:`3px solid ${DARK}`, boxShadow:`4px 4px 0 ${DARK}`, display:'flex', flexDirection:'column' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                <span className="siv-kpi-label" style={{ fontSize:12, fontWeight:900, color:DARK, textTransform:'uppercase', letterSpacing:'.05em' }}>{kpi.label}</span>
                <div className="iconPop siv-kpi-icon" style={{ background:DARK, padding:8, border:`3px solid ${DARK}` }}>
                  <kpi.icon size={18} color={'white'}/>
                </div>
              </div>
              <div className="siv-kpi-value" style={{ fontSize:'2.5rem', fontWeight:900, color:DARK, marginTop:16 }}>
                {kpi.value}
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="siv-tabs" style={{ display:'flex', gap:12, marginBottom:24 }}>
          <button type="button" className={`btn3d siv-tab ${activeTab === 'store_stock' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('store_stock'); }} style={{
            background: activeTab === 'store_stock' ? DARK : 'white',
            color: activeTab === 'store_stock' ? CYAN : DARK,
            border: `3px solid ${DARK}`, padding: '12px 24px', fontWeight: 900, fontSize: 13, textTransform: 'uppercase',
            boxShadow: `4px 4px 0 ${DARK}`
          }}>
            <span className="icon3d"><Package size={16}/></span> Store Stock
          </button>
          <button type="button" className={`btn3d siv-tab ${activeTab === 'my_requests' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('my_requests'); }} style={{
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
              <div className="siv-search-wrap" style={{ position:'relative', maxWidth:400 }}>
                <Search className="siv-search-icon" size={18} color={DARK} style={{ position:'absolute', left:14, top:13, pointerEvents:'none' }}/>
                <input type="text" className="siv-search-input" placeholder="Search store items..." value={search} onChange={e => setSearch(e.target.value)}
                  style={{ width:'100%', padding:'12px 16px 12px 44px', border:`3px solid ${DARK}`,
                    fontSize:14, outline:'none', background:'white', color:DARK,
                    boxSizing:'border-box', fontWeight:900,
                    boxShadow:`4px 4px 0 ${DARK}`, textTransform:'uppercase'
                  }}/>
              </div>
            </div>

            <div className="siv-table-wrap" style={{ background:'white', border:`3px solid ${DARK}`, boxShadow:`4px 4px 0 ${DARK}`, overflow:'hidden' }}>
              <div className="siv-table-scroll" style={{ overflowX: 'auto' }}>
                <table className="siv-table" style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                  <thead>
                    <tr>
                      <th style={{ padding:'14px 18px', textAlign:'left', fontWeight:900, color:'white', background:DARK, borderBottom:`3px solid ${DARK}`, textTransform:'uppercase', letterSpacing:'.05em' }}>Drug Name</th>
                      <th style={{ padding:'14px 18px', textAlign:'left', fontWeight:900, color:'white', background:DARK, borderBottom:`3px solid ${DARK}`, textTransform:'uppercase', letterSpacing:'.05em' }}>Category</th>
                      <th style={{ padding:'14px 18px', textAlign:'center', fontWeight:900, color:'white', background:DARK, borderBottom:`3px solid ${DARK}`, textTransform:'uppercase', letterSpacing:'.05em' }}>Amount</th>
                      <th style={{ padding:'14px 18px', textAlign:'center', fontWeight:900, color:'white', background:DARK, borderBottom:`3px solid ${DARK}`, textTransform:'uppercase', letterSpacing:'.05em' }}>Unit</th>
                      <th style={{ padding:'14px 18px', textAlign:'center', fontWeight:900, color:'white', background:DARK, borderBottom:`3px solid ${DARK}`, textTransform:'uppercase', letterSpacing:'.05em' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={5} style={{ padding:60, textAlign:'center' }}>
                        <SegmentedSpinner size={40} />
                        <div style={{ marginTop:12, fontWeight:900, color:DARK, textTransform:'uppercase' }}>Loading Store Inventory...</div>
                      </td></tr>
                    ) : filteredStock.length === 0 ? (
                      <tr><td colSpan={5} style={{ padding:60, textAlign:'center', color:DARK, fontWeight:900, textTransform:'uppercase' }}>
                        <span className="iconPop" style={{ display:'block', fontSize:40, marginBottom:16 }}>📦</span>
                        No items found.
                      </td></tr>
                    ) : filteredStock.map((item, idx) => {
                      const hasOpen = myRequests.some(r =>
                        r.drug_id===(item.drug_id||item.id) && ['PENDING_APPROVAL','APPROVED','SHIPPED'].includes(r.status)
                      );
                      const qty   = Number(item.stock_quantity) || 0;
                      const clr   = qty <= 0 ? '#dc2626' : qty < 10 ? '#d97706' : DARK;
                      const dName = item.name || item.drug_name || `Drug #${item.drug_id||item.id||idx+1}`;
                      const dUnit = item.unit || item.drug_unit || 'pcs';
                      const dCat  = item.category || item.drug_category || '—';
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
                                  className="btn3d siv-btn-request" style={{ background:CYAN, color:DARK, border:`3px solid ${DARK}`, padding:'8px 16px', fontWeight:900, fontSize:12, cursor:'pointer', display:'inline-flex', alignItems:'center', gap:6, textTransform:'uppercase', boxShadow:`4px 4px 0 ${DARK}` }}>
                                  <Send size={14}/> Request
                                </button>
                            }
                          </td>
                        </tr>
                      );
                    })}

                    {filteredStock.length > 0 && (
                      <tr className="siv-total-row" style={{ background:DARK }}>
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
                <SegmentedSpinner size={40} />
              </div>
            ) : myRequests.length === 0 ? (
              <div className="card3d" style={{ textAlign:'center', padding:60, background:'white', border:`3px solid ${DARK}`, boxShadow:`4px 4px 0 ${DARK}` }}>
                <span className="iconPop" style={{ display:'block', fontSize:60, marginBottom:20 }}>🚚</span>
                <div style={{ fontWeight:900, fontSize:22, color:DARK, marginBottom:10, textTransform:'uppercase' }}>No Transfer Requests Yet</div>
                <div style={{ fontSize:14, color:DARK, fontWeight:700 }}>Go to the "Store Stock" tab to request drugs from the store.</div>
              </div>
            ) : (
              <div className="siv-table-wrap">
                <table className="siv-table">
                  <thead>
                    <tr>
                      <th>Req Code</th>
                      <th>Drug</th>
                      <th>Req Qty</th>
                      <th>Shipped Qty</th>
                      <th>Status</th>
                      <th style={{ textAlign:'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shippedRequests.map(r => (
                      <RequestCard key={r.id} r={r} onReceive={req => setReceiveModal({ open:true, req, qty:String(req.shipped_qty||'') })}/>
                    ))}
                    {otherRequests.map(r => (
                      <RequestCard key={r.id} r={r} onReceive={req => setReceiveModal({ open:true, req, qty:String(req.shipped_qty||'') })}/>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── REQUEST MODAL ── */}
      {reqModal.open && (
        <div
          onMouseDown={e => { if (e.target === e.currentTarget) { setReqModal({open:false,item:null,qty:'',urgency:'MEDIUM'}); setSavedSig(null); sigCanvas.current?.clear(); } }}
          style={{ position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.4)', zIndex:99999, display:'flex', alignItems:'center', justifyContent:'center', padding:16, backdropFilter:'blur(2px)' }}>
          <div style={{ background:'#fff', width:500, maxWidth:'100%', borderRadius:12, boxShadow:'0 10px 25px rgba(0,0,0,0.1)', overflow:'hidden', animation:'fadeUp .2s ease' }}>
            <div style={{ padding:'20px 24px', borderBottom:'1px solid var(--c-border)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div>
                <h3 style={{ margin:0, fontSize:18, color:'#111827', fontWeight:600 }}>Request Transfer</h3>
                <p style={{ margin:'4px 0 0', fontSize:13, color:'#6B7280' }}>{reqModal.item?.name}</p>
              </div>
              <button onClick={() => { setReqModal({open:false,item:null,qty:'',urgency:'MEDIUM'}); setSavedSig(null); sigCanvas.current?.clear(); }} style={{ background:'transparent', border:'none', cursor:'pointer', color:'#9CA3AF' }}><XCircle size={20}/></button>
            </div>
            <div style={{ padding:24, display:'flex', flexDirection:'column', gap:20 }}>
              <div>
                <label style={{ display:'block', fontSize:12, fontWeight:500, marginBottom:8, color:'#4B5563', textTransform:'uppercase', letterSpacing:'0.03em' }}>Quantity</label>
                <input type="number" min="1" value={reqModal.qty} onChange={e => setReqModal({...reqModal, qty:e.target.value})}
                  className="siv-input" autoFocus/>
              </div>
              <div>
                <label style={{ display:'block', fontSize:12, fontWeight:500, marginBottom:8, color:'#4B5563', textTransform:'uppercase', letterSpacing:'0.03em' }}>Urgency</label>
                <select value={reqModal.urgency} onChange={e => setReqModal({...reqModal, urgency:e.target.value})}
                  className="siv-input">
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                </select>
              </div>
              <div>
                <label style={{ display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:12, fontWeight:500, marginBottom:8, color:'#4B5563', textTransform:'uppercase', letterSpacing:'0.03em' }}>
                  <span>Signature {savedSig && <span style={{ color:'#16A34A', marginLeft:6 }}>✓ Saved</span>}</span>
                  <button type="button" onClick={() => { sigCanvas.current?.clear(); setSavedSig(null); }}
                    style={{ fontSize:11, color:'#DC2626', background:'transparent', border:'none', cursor:'pointer', fontWeight:500 }}>Clear</button>
                </label>
                <div style={{ border:'1px solid var(--c-border)', borderRadius:8, background:'#F9FAFB', overflow:'hidden' }}>
                  <SignatureCanvas ref={sigCanvas} penColor="#111827" canvasProps={{ width:452, height:120 }}/>
                </div>
                <button type="button"
                  onClick={() => {
                    if (!sigCanvas.current || sigCanvas.current.isEmpty()) { showMsg('Draw your signature first','error'); return; }
                    setSavedSig(sigCanvas.current.toDataURL());
                    showMsg('Signature saved!','success');
                  }}
                  className="siv-btn siv-btn-secondary" style={{ marginTop:10, width:'100%' }}>
                  Save Signature
                </button>
              </div>
              <div style={{ display:'flex', gap:12, marginTop:8, justifyContent:'flex-end' }}>
                <button type="button"
                  onClick={() => { setReqModal({open:false,item:null,qty:'',urgency:'MEDIUM'}); setSavedSig(null); sigCanvas.current?.clear(); }}
                  className="siv-btn siv-btn-ghost">Cancel</button>
                <button type="button"
                  onClick={() => submitRequest()}
                  disabled={submittingReq}
                  className="siv-btn siv-btn-primary" style={{ minWidth:120 }}>
                  {submittingReq ? <SegmentedSpinner size={16} /> : 'Submit Request'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── RECEIVE MODAL ── */}
      {receiveModal.open && receiveModal.req && (
        <div style={{ position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.4)', zIndex:99999, display:'flex', alignItems:'center', justifyContent:'center', padding:16, backdropFilter:'blur(2px)' }}>
          <div style={{ background:'#fff', width:540, maxWidth:'100%', borderRadius:12, boxShadow:'0 10px 25px rgba(0,0,0,0.1)', overflow:'hidden', animation:'fadeUp .2s ease' }}>
            <div style={{ padding:'20px 24px', borderBottom:'1px solid var(--c-border)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                <div style={{ background:'#E0F2FE', color:'#0284C7', padding:8, borderRadius:8 }}>
                  <Inbox size={20}/>
                </div>
                <div>
                  <h3 style={{ margin:0, fontSize:18, color:'#111827', fontWeight:600 }}>Confirm Receipt</h3>
                  <p style={{ margin:'2px 0 0', fontSize:13, color:'#6B7280' }}>{receiveModal.req.drug_name}</p>
                </div>
              </div>
              <button onClick={() => setReceiveModal({open:false,req:null,qty:''})} style={{ background:'transparent', border:'none', cursor:'pointer', color:'#9CA3AF' }}><XCircle size={20}/></button>
            </div>
            
            <div style={{ padding:24 }}>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:12, marginBottom:24 }}>
                <div style={{ background:'#F9FAFB', padding:12, borderRadius:8, border:'1px solid var(--c-border)' }}>
                  <div style={{ fontSize:11, color:'#6B7280', textTransform:'uppercase', fontWeight:500 }}>Requested</div>
                  <div style={{ fontSize:16, fontWeight:600, color:'#111827', marginTop:4 }}>{receiveModal.req.requested_qty}</div>
                </div>
                <div style={{ background:'#EFF6FF', padding:12, borderRadius:8, border:'1px solid #BFDBFE' }}>
                  <div style={{ fontSize:11, color:'#1D4ED8', textTransform:'uppercase', fontWeight:500 }}>Shipped</div>
                  <div style={{ fontSize:16, fontWeight:600, color:'#1D4ED8', marginTop:4 }}>{receiveModal.req.shipped_qty}</div>
                </div>
                <div style={{ background:'#F9FAFB', padding:12, borderRadius:8, border:'1px solid var(--c-border)' }}>
                  <div style={{ fontSize:11, color:'#6B7280', textTransform:'uppercase', fontWeight:500 }}>Pharm Stock</div>
                  <div style={{ fontSize:16, fontWeight:600, color:'#111827', marginTop:4 }}>{receiveModal.req.pharmacy_qty_at_request??'—'}</div>
                </div>
              </div>

              <div style={{ marginBottom:24 }}>
                <StepTracker status="SHIPPED"/>
              </div>

              <label style={{ display:'block', fontSize:12, fontWeight:500, marginBottom:8, color:'#4B5563', textTransform:'uppercase', letterSpacing:'0.03em' }}>
                Actual Quantity Received
              </label>
              <input type="number" min="0" value={receiveModal.qty}
                onChange={e => setReceiveModal({...receiveModal, qty:e.target.value})}
                className="siv-input"
                autoFocus placeholder="Enter count received..."/>
                
              {receiveModal.qty !== '' && (
                parseInt(receiveModal.qty) === Number(receiveModal.req.shipped_qty) ? (
                  <div style={{ marginTop:12, background:'#DCFCE7', color:'#16A34A', padding:'10px 14px', borderRadius:6, fontSize:13, display:'flex', alignItems:'center', gap:8, fontWeight:500 }}>
                    <Check size={16}/> Quantities match
                  </div>
                ) : (
                  <div style={{ marginTop:12, background:'#FEE2E2', color:'#DC2626', padding:'10px 14px', borderRadius:6, fontSize:13, display:'flex', alignItems:'center', gap:8, fontWeight:500 }}>
                    <AlertTriangle size={16}/> Mismatch! Triggers discrepancy report
                  </div>
                )
              )}

              <div style={{ display:'flex', gap:12, marginTop:24, justifyContent:'flex-end' }}>
                <button type="button" onClick={() => setReceiveModal({open:false,req:null,qty:''})} className="siv-btn siv-btn-ghost">Cancel</button>
                <button type="button" onClick={() => submitReceive()} disabled={submittingReceive||receiveModal.qty===''} className="siv-btn siv-btn-primary" style={{ minWidth:160 }}>
                  {submittingReceive ? <SegmentedSpinner size={16} /> : 'Confirm & Update Stock'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}