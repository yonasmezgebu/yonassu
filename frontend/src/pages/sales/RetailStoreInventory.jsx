import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Database, RefreshCw, Send, Loader2, CheckCircle, XCircle, Search,
  Package, List, AlertTriangle, Inbox, Check, Clock, Truck, ShoppingBag,
  ArrowRight, ChevronDown, ChevronUp, Printer
} from 'lucide-react';
import apiClient from '../../services/apiClient';
import SignatureCanvas from 'react-signature-canvas';
import SalesInventoryView from './SalesInventoryView';

// ── Nature Theme Colors ───────────────────────────────────────────────────────
const FG    = '#228B22'; // Forest Green
const DARK  = '#1B5E20'; // Dark Green
const EME   = '#2E8B57'; // Emerald Green
const SAGE  = '#A5D6A7'; // Sage Green
const LIME  = '#8BC34A'; // Lime Green
const EARTH = '#8D6E63'; // Earth Brown
const TXT   = '#424242'; // Dark Gray
const BG    = '#F5F5F5'; // Light Gray

// ── Step Config ───────────────────────────────────────────────────────────────
const STEPS = [
  { key: 'PENDING_APPROVAL', label: 'Requested to CEO', icon: <Clock size={16}/> },
  { key: 'APPROVED',         label: 'CEO Approved',      icon: <CheckCircle size={16}/> },
  { key: 'SHIPPED',          label: 'Store Shipped',      icon: <Truck size={16}/> },
  { key: 'COMPLETED',        label: 'Sales Received',     icon: <ShoppingBag size={16}/> },
];
const STATUS_ORDER = {
  PENDING_APPROVAL: 0, APPROVED: 1, SHIPPED: 2, COMPLETED: 3,
  DISCREPANCY: 3, REJECTED: -1, CANCELLED: -1,
};

const preloadedAudio = {
  notification: new Audio('/sounds/notification.mp3'),
  approved:     new Audio('/sounds/approved.mp3'),
  rejected:     new Audio('/sounds/rejected.mp3'),
  shipment:     new Audio('/sounds/shipment.mp3'),
  completed:    new Audio('/sounds/completed.mp3'),
};
Object.values(preloadedAudio).forEach(a => { a.load(); });

// ── Step Tracker ──────────────────────────────────────────────────────────────
function StepTracker({ status }) {
  const currentIdx = STATUS_ORDER[status] ?? 0;
  const isRejected = status === 'REJECTED' || status === 'CANCELLED';
  return (
    <div style={{ display:'flex', alignItems:'center', gap:0, margin:'16px 0 12px', overflowX:'auto' }}>
      {STEPS.map((step, idx) => {
        const done   = idx < currentIdx;
        const active = idx === currentIdx && !isRejected;
        const bg     = isRejected ? '#fee2e2' : done ? SAGE : active ? '#E8F5E9' : '#e2e8f0';
        const col    = isRejected ? '#ef4444' : (done || active) ? DARK : '#94a3b8';
        return (
          <React.Fragment key={step.key}>
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', minWidth:70 }}>
              <div style={{
                width:36, height:36, background:bg, borderRadius:0,
                display:'flex', alignItems:'center', justifyContent:'center',
                color:col, border: active ? `2px solid ${DARK}` : done ? `2px solid ${EME}` : `2px solid #cbd5e1`,
                boxShadow: active ? `2px 2px 0 ${DARK}` : 'none',
              }}>
                {done ? <Check size={16}/> : step.icon}
              </div>
              <div style={{ fontSize:9, fontWeight:800, color:DARK, textAlign:'center', marginTop:6, lineHeight:1.2, textTransform:'uppercase' }}>
                {step.label}
              </div>
            </div>
            {idx < STEPS.length-1 && (
              <div style={{ flex:1, height:3, background: idx < currentIdx ? DARK : '#cbd5e1', marginBottom:24 }}/>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ── Status Badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    PENDING_APPROVAL: { bg:'#FFF8E1', text:'#E65100', label:'⏳ Pending CEO' },
    APPROVED:         { bg:'#E8F5E9', text:DARK,      label:'✅ CEO Approved' },
    REJECTED:         { bg:'#FFEBEE', text:'#C62828', label:'❌ Rejected' },
    SHIPPED:          { bg:'#FFF3E0', text:'#E65100', label:'🚚 Shipped' },
    COMPLETED:        { bg:'#E8F5E9', text:DARK,      label:'✅ Received' },
    CANCELLED:        { bg:'#F5F5F5', text:'#757575', label:'🚫 Cancelled' },
    DISCREPANCY:      { bg:'#FFF3E0', text:'#E65100', label:'⚠️ Discrepancy' },
  };
  const c = map[status] || { bg:'#F5F5F5', text:'#757575', label:status };
  return (
    <span style={{
      background:c.bg, color:c.text, padding:'5px 12px', borderRadius:0,
      fontSize:11, fontWeight:800, whiteSpace:'nowrap',
      border:`1px solid ${c.text}`, textTransform:'uppercase'
    }}>{c.label}</span>
  );
}

// ── Info Box ──────────────────────────────────────────────────────────────────
function InfoBox({ label, value, highlight }) {
  return (
    <div style={{
      background: highlight ? '#E8F5E9' : 'white', padding:'12px 14px', textAlign:'center',
      border: `1px solid ${EARTH}`, display:'flex', flexDirection:'column', justifyContent:'center'
    }}>
      <div style={{ fontSize:20, fontWeight:900, color:DARK }}>{value??'—'}</div>
      <div style={{ fontSize:10, color:TXT, fontWeight:700, marginTop:4, textTransform:'uppercase' }}>{label}</div>
    </div>
  );
}

// ── Row detail ─────────────────────────────────────────────────────────────────
function DetailRow({ label, value }) {
  return (
    <div style={{ display:'flex', justifyContent:'space-between', paddingBottom:8, marginBottom:8, borderBottom:`1px solid ${SAGE}` }}>
      <span style={{ color:TXT, fontWeight:700, fontSize:12, textTransform:'uppercase' }}>{label}</span>
      <span style={{ fontWeight:800, fontSize:13, color:DARK }}>{value}</span>
    </div>
  );
}

// ── Request Card ──────────────────────────────────────────────────────────────
function RequestCard({ r, onReceive }) {
  const [expanded, setExpanded] = useState(false);
  const isShipped = r.status === 'SHIPPED';
  return (
    <div style={{
      background: isShipped ? '#E8F5E9' : 'white',
      border: `2px solid ${isShipped ? DARK : EARTH}`,
      marginBottom:20,
      boxShadow: isShipped ? `3px 3px 0 ${DARK}` : `2px 2px 0 ${EARTH}`,
    }}>
      {isShipped && (
        <div style={{ background:DARK, padding:'10px 20px', display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
          <Truck size={16} color="white"/>
          <span style={{ color:'white', fontWeight:800, fontSize:12, textTransform:'uppercase' }}>📦 SHIPMENT ARRIVED — ACTION REQUIRED</span>
          <span style={{ marginLeft:'auto', background:LIME, color:DARK, padding:'3px 10px', fontSize:11, fontWeight:800, textTransform:'uppercase' }}>
            {r.shipped_qty} units ready
          </span>
        </div>
      )}
      <div style={{ padding:'20px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12, flexWrap:'wrap', gap:8 }}>
          <div>
            <div style={{ fontSize:17, fontWeight:800, color:DARK }}>{r.product_name}</div>
            <div style={{ fontSize:12, color:EME, fontFamily:'monospace', marginTop:4, fontWeight:700 }}>{r.request_code}</div>
          </div>
          <StatusBadge status={r.status}/>
        </div>
        <StepTracker status={r.status}/>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(90px,1fr))', gap:10, marginTop:16 }}>
          <InfoBox label="Requested"   value={r.requested_qty} />
          <InfoBox label="Sales Stock" value={r.sales_qty_at_request??'—'} />
          <InfoBox label="Store Stock" value={r.store_qty_at_request??'—'} />
          {r.shipped_qty!=null && <InfoBox label="Shipped" value={r.shipped_qty} highlight={isShipped}/>}
        </div>
        <button onClick={() => setExpanded(e => !e)}
          style={{ marginTop:14, background:SAGE, border:`1px solid ${DARK}`, color:DARK, fontSize:11, fontWeight:800, cursor:'pointer', display:'inline-flex', alignItems:'center', gap:6, padding:'7px 14px', textTransform:'uppercase', borderRadius:0 }}>
          {expanded ? <ChevronUp size={13}/> : <ChevronDown size={13}/>}
          {expanded ? 'HIDE DETAILS' : 'SHOW DETAILS'}
        </button>
        {expanded && (
          <div style={{ marginTop:12, background:'#F5F5F5', padding:'14px', border:`1px solid ${EARTH}` }}>
            <DetailRow label="Urgency"      value={r.urgency}/>
            <DetailRow label="Requested At" value={r.created_at ? new Date(r.created_at).toLocaleString() : '—'}/>
            {r.approved_at  && <DetailRow label="Approved At"  value={new Date(r.approved_at).toLocaleString()}/>}
            {r.shipped_at   && <DetailRow label="Shipped At"   value={new Date(r.shipped_at).toLocaleString()}/>}
            {r.received_at  && <DetailRow label="Received At"  value={new Date(r.received_at).toLocaleString()}/>}
            {r.received_qty!=null && <DetailRow label="Received Qty" value={r.received_qty}/>}
            {r.decision_reason && <DetailRow label="Note" value={r.decision_reason}/>}
          </div>
        )}
        {isShipped && (
          <button onClick={() => onReceive(r)}
            style={{
              marginTop:16, width:'100%', padding:'14px',
              background:DARK, color:'white', border:'none', borderRadius:0,
              cursor:'pointer', fontWeight:800, fontSize:14, display:'flex', alignItems:'center', justifyContent:'center', gap:8,
              textTransform:'uppercase'
            }}>
            <Inbox size={18}/> Confirm Receipt & Update Stock
          </button>
        )}
      </div>
    </div>
  );
}

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────
export default function RetailStoreInventory() {
  const location = useLocation();
  const [activeTab,         setActiveTab]        = useState('store_stock');
  const [storeStock,        setStoreStock]       = useState([]);
  const [myRequests,        setMyRequests]       = useState([]);
  const [loading,           setLoading]          = useState(true);
  const [search,            setSearch]           = useState('');
  const [msg,               setMsg]              = useState({ type:'', text:'' });
  const [reqModal,          setReqModal]         = useState({ open:false, item:null, qty:'', urgency:'MEDIUM' });
  const [submittingReq,     setSubmittingReq]    = useState(false);
  const [receiveModal,      setReceiveModal]     = useState({ open:false, req:null, qty:'' });
  const [submittingReceive, setSubmittingReceive]= useState(false);
  const [spinning,          setSpinning]         = useState(false);
  const [savedSig,          setSavedSig]         = useState(null);
  const sigCanvas = useRef(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('tab') === 'my_requests') setActiveTab('my_requests');
  }, [location.search]);

  const loadData = async () => {
    setLoading(true);
    try {
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
  const totalValue      = filteredStock.reduce((s,d) => s + (Number(d.stock_quantity)||0) * (Number(d.unit_price||d.price||0)), 0);
  const totalItems      = storeStock.length;

  const handlePrint = () => {
    const win = window.open('', '_blank');
    if (!win) { showMsg('Please allow popups to print','error'); return; }
    const rows = filteredStock.map((item,idx) => {
      const qty  = Number(item.stock_quantity)||0;
      const name = item.name||item.product_name||`#${idx+1}`;
      const cat  = item.category||item.product_category||'—';
      const unit = item.unit||item.product_unit||'pcs';
      const val  = (qty * Number(item.unit_price||item.price||0)).toFixed(2);
      return `<tr style="border-bottom:1px solid #E2E8F0;background:${idx%2===0?'white':'#F5F5F5'}">
        <td style="padding:10px 14px;font-weight:700">${name}</td>
        <td style="padding:10px 14px">${cat}</td>
        <td style="padding:10px 14px;text-align:center;font-weight:800">${qty}</td>
        <td style="padding:10px 14px;text-align:center">${unit}</td>
        <td style="padding:10px 14px;text-align:right;font-weight:800">ETB ${val}</td>
      </tr>`;
    }).join('');
    win.document.write(`<!DOCTYPE html><html><head><title>Store Inventory</title>
      <style>body{font-family:Inter,sans-serif;margin:24px;color:#424242}
      table{width:100%;border-collapse:collapse}
      th{background:#1B5E20;color:white;padding:12px 14px;text-align:left;font-size:12px;text-transform:uppercase}
      @media print{button{display:none}}</style></head><body>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;border-bottom:3px solid #1B5E20;padding-bottom:16px">
        <div>
          <h2 style="margin:0;color:#1B5E20;font-size:22px">🌿 Store Inventory Report</h2>
          <p style="margin:4px 0 0;color:#6B8E23;font-size:13px">Printed: ${new Date().toLocaleString()}</p>
        </div>
        <div style="text-align:right">
          <div style="font-size:13px;color:#424242">Total Items: <strong>${totalItems}</strong></div>
          <div style="font-size:13px;color:#424242">Total Value: <strong>ETB ${totalValue.toFixed(2)}</strong></div>
        </div>
      </div>
      <table><thead><tr>
        <th>Product Name</th><th>Category</th><th style="text-align:center">Qty</th>
        <th style="text-align:center">Unit</th><th style="text-align:right">Est. Value</th>
      </tr></thead><tbody>${rows}</tbody></table>
      <script>window.onload=()=>window.print()<\/script></body></html>`);
    win.document.close();
  };

  return (
    <div style={{ margin:0, minHeight:'100vh', width:'100%', background:BG, fontFamily:"'Inter','Segoe UI',sans-serif", overflowX:'hidden' }}>
      <style>{`
        @keyframes spin    { 100%{transform:rotate(360deg)} }
        @keyframes fadeUp  { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeSlide{ from{opacity:0;transform:translateY(-10px)} to{opacity:1;transform:translateY(0)} }
        .inv-row { transition:background .2s; }
        .inv-row:hover { background:#E8F5E9 !important; }
        .inv-btn { transition:filter .15s, transform .1s; cursor:pointer; border-radius:0; }
        .inv-btn:hover:not(:disabled) { filter:brightness(1.08); transform:translateY(-1px); }
        .inv-btn:active:not(:disabled) { transform:translateY(0); filter:brightness(0.95); }
        @media(max-width:768px){
          .kpi-grid { grid-template-columns:1fr 1fr !important; }
          .inv-header { flex-direction:column; align-items:flex-start !important; gap:12px !important; }
          .tab-row { flex-wrap:wrap !important; }
          .req-grid { grid-template-columns:1fr !important; }
          .stock-search { max-width:100% !important; }
        }
        @media(max-width:480px){
          .kpi-grid { grid-template-columns:1fr !important; }
        }
      `}</style>

      {/* ── IN-APP TOAST ── */}
      {msg.text && (
        <div style={{
          position:'fixed', top:20, right:20, zIndex:9999999,
          padding:'14px 24px', display:'flex', alignItems:'center', gap:10,
          background: msg.type==='success' ? '#E8F5E9' : '#FFEBEE',
          border:`2px solid ${msg.type==='success' ? DARK : '#C62828'}`,
          color: msg.type==='success' ? DARK : '#C62828',
          fontWeight:800, fontSize:13, textTransform:'uppercase',
          animation:'fadeSlide .3s ease', boxShadow:'0 4px 16px rgba(0,0,0,0.12)',
          maxWidth:400, borderRadius:0,
        }}>
          <span>{msg.type==='success' ? <CheckCircle size={18}/> : <XCircle size={18}/>}</span>
          {msg.text}
        </div>
      )}

      {/* ── HEADER ── */}
      <div style={{ background:DARK, width:'100%', boxSizing:'border-box' }}>
        <div className="inv-header" style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'0 32px', height:68, flexWrap:'wrap', gap:12 }}>
          <div style={{ display:'flex', alignItems:'center', gap:14 }}>
            <div style={{ width:44, height:44, background:'rgba(255,255,255,0.12)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.4rem', flexShrink:0 }}>
              🌿
            </div>
            <div>
              <h1 style={{ fontSize:20, fontWeight:800, color:'white', margin:0, letterSpacing:'0.04em' }}>STORE INVENTORY</h1>
              <p style={{ margin:0, fontSize:11, fontWeight:700, letterSpacing:'3px', textTransform:'uppercase', color:SAGE }}>Request Stock • Track Shipments</p>
            </div>
          </div>
          <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
            {shippedRequests.length > 0 && activeTab !== 'my_requests' && (
              <button type="button" onClick={() => setActiveTab('my_requests')} className="inv-btn" style={{
                background:'#FF9800', color:'white', border:'none',
                padding:'10px 18px', fontWeight:800, fontSize:12, display:'inline-flex',
                alignItems:'center', gap:8, textTransform:'uppercase',
              }}>
                <Truck size={16}/> Receive Shipments ({shippedRequests.length}) <ArrowRight size={14}/>
              </button>
            )}
            <button type="button" onClick={handleRefresh} disabled={loading} className="inv-btn" style={{
              background:'rgba(255,255,255,0.12)', color:'white', border:'1px solid rgba(255,255,255,0.3)',
              padding:'10px 18px', fontWeight:800, fontSize:12, display:'inline-flex',
              alignItems:'center', gap:8, textTransform:'uppercase',
            }}>
              <RefreshCw size={16} style={spinning || loading ? { animation:'spin .7s linear infinite' } : {}}/>
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div style={{ padding:'24px 32px', animation:'fadeUp .35s ease', boxSizing:'border-box', width:'100%' }}>

        {/* ── KPI CARDS (only 2: Total Items + Total Value) ── */}
        <div className="kpi-grid" style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:20, marginBottom:24 }}>
          {[
            { label:'Total Items in Store', value:totalItems, icon:Package, bg:'#E8F5E9', accent:DARK },
            { label:'Est. Total Value (ETB)', value: `ETB ${totalValue.toLocaleString('en',{maximumFractionDigits:2})}`, icon:Database, bg:'#F5F5F5', accent:DARK },
          ].map((kpi,i) => (
            <div key={i} style={{ padding:24, background:kpi.bg, border:`2px solid ${EARTH}`, display:'flex', alignItems:'center', gap:20, boxShadow:'2px 2px 0 rgba(141,110,99,0.2)' }}>
              <div style={{ background:DARK, padding:14, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <kpi.icon size={24} color="white"/>
              </div>
              <div>
                <div style={{ fontSize:11, fontWeight:800, color:TXT, textTransform:'uppercase', letterSpacing:'.06em', marginBottom:4 }}>{kpi.label}</div>
                <div style={{ fontSize:'1.9rem', fontWeight:900, color:DARK, lineHeight:1 }}>{kpi.value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ── TABS ── */}
        <div className="tab-row" style={{ display:'flex', gap:0, marginBottom:24, borderBottom:`2px solid ${EARTH}` }}>
          <button type="button" className="inv-btn" onClick={() => setActiveTab('store_stock')} style={{
            background: activeTab === 'store_stock' ? DARK : 'white',
            color: activeTab === 'store_stock' ? 'white' : TXT,
            border: activeTab === 'store_stock' ? 'none' : `1px solid ${EARTH}`,
            borderBottom:'none', padding:'12px 28px', fontWeight:800, fontSize:13,
            textTransform:'uppercase', display:'flex', alignItems:'center', gap:8,
          }}>
            <Package size={16}/> Store Stock
          </button>
          
          <button type="button" className="inv-btn" onClick={() => setActiveTab('retail_products')} style={{
            background: activeTab === 'retail_products' ? DARK : 'white',
            color: activeTab === 'retail_products' ? 'white' : TXT,
            border: activeTab === 'retail_products' ? 'none' : `1px solid ${EARTH}`,
            borderBottom:'none', padding:'12px 28px', fontWeight:800, fontSize:13,
            textTransform:'uppercase', display:'flex', alignItems:'center', gap:8,
          }}>
            <Package size={16}/> Published Retail Products
          </button>

          <button type="button" className="inv-btn" onClick={() => setActiveTab('my_requests')} style={{
            background: activeTab === 'my_requests' ? DARK : 'white',
            color: activeTab === 'my_requests' ? 'white' : TXT,
            border: activeTab === 'my_requests' ? 'none' : `1px solid ${EARTH}`,
            borderBottom:'none', padding:'12px 28px', fontWeight:800, fontSize:13,
            textTransform:'uppercase', display:'flex', alignItems:'center', gap:8,
          }}>
            <List size={16}/> My Shipment Tracking
            {shippedRequests.length > 0 && (
              <span style={{ background:'#F44336', color:'white', padding:'2px 8px', fontSize:11, fontWeight:900, borderRadius:0 }}>
                {shippedRequests.length}
              </span>
            )}
          </button>
        </div>

        {/* ── RETAIL PRODUCTS TAB ── */}
        {activeTab === 'retail_products' && (
          <div style={{ marginTop: 20 }}>
            <SalesInventoryView hideHeader={true} />
          </div>
        )}

        {/* ── STORE STOCK TAB ── */}
        {activeTab === 'store_stock' && (
          <div style={{ animation:'fadeUp .4s ease' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16, flexWrap:'wrap', gap:12 }}>
              <div className="stock-search" style={{ position:'relative', maxWidth:400, flex:1 }}>
                <Search size={16} color={TXT} style={{ position:'absolute', left:14, top:14, pointerEvents:'none' }}/>
                <input type="text" placeholder="Search store items..." value={search} onChange={e => setSearch(e.target.value)}
                  style={{ width:'100%', padding:'12px 16px 12px 42px', border:`1px solid ${EARTH}`,
                    fontSize:14, outline:'none', background:'white', color:TXT,
                    boxSizing:'border-box', fontWeight:600, borderRadius:0
                  }}/>
              </div>
              <button onClick={handlePrint} className="inv-btn" style={{
                background:EME, color:'white', border:'none', padding:'12px 20px',
                fontWeight:800, fontSize:13, display:'flex', alignItems:'center', gap:8, textTransform:'uppercase', borderRadius:0
              }}>
                <Printer size={16}/> Print Report
              </button>
            </div>

            <div style={{ background:'white', border:`1px solid ${EARTH}`, overflow:'hidden', boxShadow:'2px 2px 0 rgba(141,110,99,0.15)' }}>
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                  <thead>
                    <tr>
                      {['Product Name','Category','Qty in Store','Unit','Price (ETB)','Action'].map((h,i) => (
                        <th key={i} style={{ padding:'14px 18px', textAlign: (i>=2 && i<=5)?'center':'left', fontWeight:800, color:'white', background:DARK, textTransform:'uppercase', letterSpacing:'.05em', fontSize:12 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={6} style={{ padding:60, textAlign:'center' }}>
                        <Loader2 size={36} color={DARK} style={{ animation:'spin 1s linear infinite' }}/>
                        <div style={{ marginTop:12, fontWeight:800, color:DARK, textTransform:'uppercase' }}>Loading Store Inventory...</div>
                      </td></tr>
                    ) : filteredStock.length === 0 ? (
                      <tr><td colSpan={6} style={{ padding:60, textAlign:'center', color:TXT, fontWeight:700, textTransform:'uppercase' }}>
                        <div style={{ fontSize:40, marginBottom:16 }}>📦</div>
                        No items found.
                      </td></tr>
                    ) : filteredStock.map((item, idx) => {
                      const hasOpen = myRequests.some(r =>
                        r.product_id===(item.product_id||item.id) && ['PENDING_APPROVAL','APPROVED','SHIPPED'].includes(r.status)
                      );
                      const qty   = Number(item.stock_quantity) || 0;
                      const clr   = qty <= 0 ? '#F44336' : qty < 10 ? '#FF9800' : DARK;
                      const dName = item.name || item.product_name || `product #${item.product_id||item.id||idx+1}`;
                      const dUnit = item.unit || item.product_unit || 'pcs';
                      const dCat  = item.category || item.product_category || '—';
                      const dPrice = Number(item.unit_price || item.price || 0).toFixed(2);
                      return (
                        <tr key={`row-${item.id||idx}`} className="inv-row" style={{ borderBottom:`1px solid #E2E8F0`, background: idx % 2 === 0 ? 'white' : BG }}>
                          <td style={{ padding:'13px 18px', fontWeight:700, color:TXT }}>{dName}</td>
                          <td style={{ padding:'13px 18px' }}>
                            <span style={{ display:'inline-block', background:'#E8F5E9', color:DARK, padding:'3px 10px', fontSize:11, fontWeight:800, border:`1px solid ${SAGE}`, textTransform:'uppercase' }}>
                              {dCat}
                            </span>
                          </td>
                          <td style={{ padding:'13px 18px', textAlign:'center', fontSize:18, fontWeight:900, color:clr }}>
                            {qty.toLocaleString()}
                          </td>
                          <td style={{ padding:'13px 18px', textAlign:'center' }}>
                            <span style={{ display:'inline-block', background:DARK, color:'white', padding:'3px 10px', fontSize:12, fontWeight:800, textTransform:'uppercase' }}>
                              {dUnit}
                            </span>
                          </td>
                          <td style={{ padding:'13px 18px', textAlign:'center', fontWeight:800, color:DARK }}>
                            ETB {dPrice}
                          </td>
                          <td style={{ padding:'13px 18px', textAlign:'center' }}>
                            {hasOpen
                              ? <span style={{ display:'inline-block', background:'#FFF3E0', color:'#E65100', padding:'7px 14px', fontSize:11, fontWeight:800, border:'1px solid #FFCC80', textTransform:'uppercase' }}>
                                  ⏳ Pending CEO
                                </span>
                              : <button type="button" onClick={() => setReqModal({ open:true, item, qty:'', urgency:'MEDIUM' })}
                                  className="inv-btn"
                                  style={{ background:EME, color:'white', border:'none', padding:'8px 16px', fontWeight:800, fontSize:12, display:'inline-flex', alignItems:'center', gap:6, textTransform:'uppercase' }}>
                                  <Send size={13}/> Request
                                </button>
                            }
                          </td>
                        </tr>
                      );
                    })}

                    {filteredStock.length > 0 && (
                      <tr style={{ background:DARK }}>
                        <td colSpan={2} style={{ padding:'14px 18px', fontSize:13, fontWeight:800, color:'white', textTransform:'uppercase' }}>
                          GRAND TOTAL
                        </td>
                        <td style={{ padding:'14px 18px', textAlign:'center', fontSize:20, fontWeight:900, color:LIME }}>
                          {filteredStock.reduce((s,d)=>s+(Number(d.stock_quantity)||0),0).toLocaleString()}
                        </td>
                        <td style={{ padding:'14px 18px', textAlign:'center', fontSize:12, fontWeight:800, color:'white', textTransform:'uppercase' }}>
                          UNITS
                        </td>
                        <td></td>
                        <td></td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── MY SHIPMENT TRACKING TAB ── */}
        {activeTab === 'my_requests' && (
          <div style={{ animation:'fadeUp .4s ease' }}>

            {/* Mini KPIs inside the tracking tab */}
            <div className="kpi-grid" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16, marginBottom:24 }}>
              {[
                { label:'My Requests', value:myRequests.length, icon:List },
                { label:'Shipped', value:shippedRequests.length, icon:Truck },
                { label:'Completed', value:myRequests.filter(r=>r.status==='COMPLETED').length, icon:CheckCircle },
              ].map((kpi,i)=>(
                <div key={i} style={{ padding:18, background:'white', border:`1px solid ${EARTH}`, display:'flex', alignItems:'center', gap:14 }}>
                  <div style={{ background: i===1 ? '#FF9800' : DARK, padding:10, flexShrink:0 }}>
                    <kpi.icon size={18} color="white"/>
                  </div>
                  <div>
                    <div style={{ fontSize:10, fontWeight:800, color:TXT, textTransform:'uppercase' }}>{kpi.label}</div>
                    <div style={{ fontSize:'1.6rem', fontWeight:900, color:DARK }}>{kpi.value}</div>
                  </div>
                </div>
              ))}
            </div>

            {loading && myRequests.length===0 ? (
              <div style={{ textAlign:'center', padding:60 }}>
                <Loader2 size={36} color={DARK} style={{ animation:'spin 1s linear infinite' }}/>
              </div>
            ) : myRequests.length === 0 ? (
              <div style={{ textAlign:'center', padding:60, background:'white', border:`1px solid ${EARTH}` }}>
                <div style={{ fontSize:50, marginBottom:20 }}>🚚</div>
                <div style={{ fontWeight:800, fontSize:20, color:DARK, marginBottom:10, textTransform:'uppercase' }}>No Transfer Requests Yet</div>
                <div style={{ fontSize:14, color:TXT, fontWeight:600 }}>Go to the "Store Stock" tab to request products from the store.</div>
              </div>
            ) : (
              <div className="req-grid" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(360px, 1fr))', gap:24 }}>
                {shippedRequests.length > 0 && (
                  <div style={{ gridColumn:'1 / -1', marginBottom:4, fontSize:13, fontWeight:800, color:DARK, display:'flex', alignItems:'center', gap:8, textTransform:'uppercase' }}>
                    <Truck size={16}/> Awaiting Your Receipt ({shippedRequests.length})
                  </div>
                )}
                {shippedRequests.map(r => (
                  <RequestCard key={r.id} r={r} onReceive={req => setReceiveModal({ open:true, req, qty:String(req.shipped_qty||'') })}/>
                ))}
                {otherRequests.length > 0 && shippedRequests.length > 0 && (
                  <div style={{ gridColumn:'1 / -1', margin:'12px 0 4px', fontSize:13, fontWeight:800, color:TXT, textTransform:'uppercase' }}>
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
          style={{ position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.7)', zIndex:99999, overflowY:'auto', display:'flex', alignItems:'flex-start', justifyContent:'center', padding:'40px 16px' }}>
          <div style={{ margin:'auto', flexShrink:0, background:'white', width:500, maxWidth:'100%', border:`2px solid ${DARK}`, boxShadow:'6px 6px 0 rgba(27,94,32,0.3)' }}>
            <div style={{ padding:'20px 24px', background:DARK }}>
              <h3 style={{ margin:0, fontSize:18, color:'white', fontWeight:800, textTransform:'uppercase' }}>Request Transfer from Store</h3>
              <p style={{ margin:'6px 0 0', fontSize:14, color:SAGE, fontWeight:700 }}>{reqModal.item?.name}</p>
            </div>
            <div style={{ padding:24, display:'flex', flexDirection:'column', gap:20 }}>
              <div>
                <label style={{ display:'block', fontSize:12, fontWeight:800, marginBottom:8, textTransform:'uppercase', color:TXT }}>Quantity to Request</label>
                <input type="number" min="1" value={reqModal.qty} onChange={e => setReqModal({...reqModal, qty:e.target.value})}
                  style={{ width:'100%', padding:'14px 16px', border:`2px solid ${EARTH}`, outline:'none', boxSizing:'border-box', fontWeight:800, fontSize:18, borderRadius:0 }} autoFocus/>
              </div>
              <div>
                <label style={{ display:'block', fontSize:12, fontWeight:800, marginBottom:8, textTransform:'uppercase', color:TXT }}>Urgency</label>
                <select value={reqModal.urgency} onChange={e => setReqModal({...reqModal, urgency:e.target.value})}
                  style={{ width:'100%', padding:'14px 16px', border:`2px solid ${EARTH}`, outline:'none', fontWeight:800, fontSize:14, borderRadius:0 }}>
                  <option value="LOW">LOW</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HIGH">HIGH</option>
                </select>
              </div>
              <div>
                <label style={{ display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:12, fontWeight:800, marginBottom:8, textTransform:'uppercase', color:TXT }}>
                  <span>Digital Signature {savedSig && <span style={{ color:DARK, fontSize:10, marginLeft:6, background:'#E8F5E9', padding:'2px 8px', border:`1px solid ${DARK}` }}>✓ SAVED</span>}</span>
                  <button type="button" onClick={() => { sigCanvas.current?.clear(); setSavedSig(null); }}
                    style={{ fontSize:10, color:'white', background:'#F44336', border:'none', cursor:'pointer', fontWeight:800, padding:'4px 10px', textTransform:'uppercase', borderRadius:0 }}>Clear</button>
                </label>
                <div style={{ border:`2px solid ${EARTH}`, background:'#F5F5F5' }}>
                  <SignatureCanvas ref={sigCanvas} penColor={DARK} canvasProps={{ width:452, height:120 }}/>
                </div>
                <button type="button"
                  onClick={() => {
                    if (!sigCanvas.current || sigCanvas.current.isEmpty()) { showMsg('Draw your signature first','error'); return; }
                    setSavedSig(sigCanvas.current.toDataURL());
                    showMsg('✅ Signature saved!','success');
                  }}
                  className="inv-btn"
                  style={{ marginTop:10, width:'100%', padding:'10px', background:DARK, color:'white', border:'none', fontWeight:800, fontSize:12, textTransform:'uppercase', borderRadius:0, display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                  💾 Save Signature
                </button>
                {savedSig && (
                  <div style={{ marginTop:8, border:`1px solid ${EME}`, padding:8, background:'#E8F5E9' }}>
                    <div style={{ fontSize:10, fontWeight:800, color:DARK, marginBottom:4, textTransform:'uppercase' }}>Saved Preview:</div>
                    <img src={savedSig} alt="signature" style={{ maxWidth:'100%', height:50, objectFit:'contain', display:'block' }}/>
                  </div>
                )}
              </div>
              <div style={{ display:'flex', gap:12, marginTop:10 }}>
                <button type="button"
                  onClick={() => { setReqModal({open:false,item:null,qty:'',urgency:'MEDIUM'}); setSavedSig(null); sigCanvas.current?.clear(); }}
                  className="inv-btn"
                  style={{ flex:1, padding:'14px', background:'#F5F5F5', color:TXT, border:`1px solid ${EARTH}`, fontWeight:800, fontSize:13, textTransform:'uppercase', borderRadius:0 }}>Cancel</button>
                <button type="button"
                  onClick={() => submitRequest()}
                  disabled={submittingReq}
                  className="inv-btn"
                  style={{ flex:2, padding:'14px', background:EME, color:'white', border:'none', fontWeight:800, fontSize:13, textTransform:'uppercase', cursor: submittingReq ? 'not-allowed' : 'pointer', borderRadius:0, display:'flex', alignItems:'center', justifyContent:'center', gap:8, opacity: submittingReq ? 0.7 : 1 }}>
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
        <div style={{ position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.7)', zIndex:99999, overflowY:'auto', display:'flex', alignItems:'flex-start', justifyContent:'center', padding:'40px 16px', backdropFilter:'blur(3px)' }}>
          <div style={{ margin:'auto', flexShrink:0, background:'white', width:540, maxWidth:'100%', border:`2px solid ${DARK}`, boxShadow:'6px 6px 0 rgba(27,94,32,0.3)', animation:'fadeUp .25s ease' }}>
            <div style={{ background:DARK, padding:'24px', display:'flex', alignItems:'center', gap:16 }}>
              <div style={{ background:'rgba(255,255,255,0.15)', padding:12 }}>
                <Inbox size={28} color="white"/>
              </div>
              <div>
                <h3 style={{ margin:0, fontSize:18, color:'white', fontWeight:800, textTransform:'uppercase' }}>Confirm Receipt</h3>
                <p style={{ margin:'4px 0 0', fontSize:13, color:SAGE, fontWeight:700, textTransform:'uppercase' }}>Step 4 of 4 — Sales Receiving</p>
              </div>
            </div>
            <div style={{ padding:28 }}>
              <div style={{ background:'#F5F5F5', border:`1px solid ${EARTH}`, padding:'20px', marginBottom:24 }}>
                <div style={{ fontSize:20, fontWeight:800, color:DARK }}>{receiveModal.req.product_name}</div>
                <div style={{ fontSize:12, color:EME, fontFamily:'monospace', marginTop:6, fontWeight:700 }}>{receiveModal.req.request_code}</div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12, marginTop:16 }}>
                  <InfoBox label="Requested"  value={receiveModal.req.requested_qty} />
                  <InfoBox label="Shipped"    value={receiveModal.req.shipped_qty} highlight />
                  <InfoBox label="Pharm Stock" value={receiveModal.req.sales_qty_at_request??'—'} />
                </div>
              </div>
              <StepTracker status="SHIPPED"/>
              <div style={{ height:2, background:`${DARK}22`, margin:'20px 0' }}/>
              <label style={{ display:'block', fontSize:13, fontWeight:800, marginBottom:10, color:TXT, textTransform:'uppercase' }}>
                Actual Quantity You Received
              </label>
              <input type="number" min="0" value={receiveModal.qty}
                onChange={e => setReceiveModal({...receiveModal, qty:e.target.value})}
                style={{ width:'100%', padding:'16px 20px', border:`2px solid ${EARTH}`, outline:'none', fontSize:22, fontWeight:900, boxSizing:'border-box', borderRadius:0 }}
                autoFocus placeholder="Enter count received..."/>
              {receiveModal.qty !== '' && (
                parseInt(receiveModal.qty) === Number(receiveModal.req.shipped_qty) ? (
                  <div style={{ marginTop:12, background:'#E8F5E9', border:`1px solid ${EME}`, padding:'10px 14px', color:DARK, fontSize:13, display:'flex', alignItems:'center', gap:8, fontWeight:800, textTransform:'uppercase' }}>
                    <Check size={18}/> Quantities match — Add to stock
                  </div>
                ) : (
                  <div style={{ marginTop:12, background:'#FFEBEE', border:'1px solid #EF9A9A', padding:'10px 14px', color:'#C62828', fontSize:13, display:'flex', alignItems:'center', gap:8, fontWeight:800, textTransform:'uppercase' }}>
                    <AlertTriangle size={18}/> Mismatch! Triggers discrepancy report
                  </div>
                )
              )}
              <div style={{ display:'flex', gap:16, marginTop:24 }}>
                <button type="button" onClick={() => setReceiveModal({open:false,req:null,qty:''})} className="inv-btn"
                  style={{ flex:1, padding:'15px', background:'#F5F5F5', color:TXT, border:`1px solid ${EARTH}`, fontWeight:800, fontSize:14, textTransform:'uppercase', borderRadius:0 }}>Cancel</button>
                <button type="button" onClick={() => submitReceive()} disabled={submittingReceive||receiveModal.qty===''} className="inv-btn"
                  style={{ flex:2, padding:'15px', background:EME, color:'white', border:'none', cursor: submittingReceive||receiveModal.qty===''?'not-allowed':'pointer', fontWeight:800, fontSize:14, textTransform:'uppercase', display:'flex', alignItems:'center', justifyContent:'center', gap:10, borderRadius:0, opacity: submittingReceive||receiveModal.qty===''?0.6:1 }}>
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
