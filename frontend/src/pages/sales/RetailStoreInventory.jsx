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
import SegmentedSpinner from '../../components/ui/SegmentedSpinner';

// ── Enterprise Theme Colors ──────────────────────────────────────────────────
const PRIMARY   = '#2563EB'; // Blue
const PRIMARY_H = '#1D4ED8'; // Deep Blue
const BG_PAGE   = '#F5F6FA'; // Page Background
const CARD      = '#FFFFFF'; // Card Background
const BORDER    = '#E5E7EB'; // Border
const TXT       = '#111827'; // Primary Text
const TXT_2     = '#6B7280'; // Secondary Text
const MUTED     = '#9CA3AF'; // Muted Text
const SUCCESS   = '#16A34A'; // Success
const SUCCESS_BG= '#DCFCE7'; // Success Background
const DANGER    = '#DC2626'; // Danger
const DANGER_BG = '#FEE2E2'; // Danger Background
const WARNING   = '#D97706'; // Warning
const WARNING_BG= '#FEF3C7'; // Warning Background
const INFO      = '#0284C7'; // Info
const INFO_BG   = '#E0F2FE'; // Info Background
const AMBER     = '#F59E0B'; // Hover Feature Amber

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


// ── Step Tracker ──────────────────────────────────────────────────────────────
function StepTracker({ status }) {
  const currentIdx = STATUS_ORDER[status] ?? 0;
  const isRejected = status === 'REJECTED' || status === 'CANCELLED';
  return (
    <div style={{ display:'flex', alignItems:'center', gap:0, margin:'16px 0 12px', overflowX:'auto' }}>
      {STEPS.map((step, idx) => {
        const done   = idx < currentIdx;
        const active = idx === currentIdx && !isRejected;
        const bg     = isRejected ? DANGER_BG : done ? SUCCESS_BG : active ? '#EFF6FF' : '#F3F4F6';
        const col    = isRejected ? DANGER : (done || active) ? PRIMARY : MUTED;
        return (
          <React.Fragment key={step.key}>
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', minWidth:70 }}>
              <div style={{
                width:36, height:36, background:bg, borderRadius:10,
                display:'flex', alignItems:'center', justifyContent:'center',
                color:col, border: active ? `2px solid ${PRIMARY}` : done ? `2px solid ${SUCCESS}` : `2px solid ${BORDER}`,
                boxShadow: active ? '0 0 0 3px rgba(37,99,235,0.12)' : 'none',
              }}>
                {done ? <Check size={16}/> : step.icon}
              </div>
              <div style={{ fontSize:10, fontWeight:500, color:(done||active) ? TXT : MUTED, textAlign:'center', marginTop:6, lineHeight:1.2, textTransform:'uppercase', letterSpacing:'.02em' }}>
                {step.label}
              </div>
            </div>
            {idx < STEPS.length-1 && (
              <div style={{ flex:1, height:3, borderRadius:2, background: idx < currentIdx ? SUCCESS : '#E5E7EB', marginBottom:26 }}/>
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
    PENDING_APPROVAL: { bg:WARNING_BG, text:WARNING, label:'⏳ Pending CEO' },
    APPROVED:         { bg:SUCCESS_BG, text:SUCCESS, label:'✅ CEO Approved' },
    REJECTED:         { bg:DANGER_BG,  text:DANGER,  label:'❌ Rejected' },
    SHIPPED:          { bg:INFO_BG,    text:INFO,    label:'🚚 Shipped' },
    COMPLETED:        { bg:SUCCESS_BG, text:SUCCESS, label:'✅ Received' },
    CANCELLED:        { bg:'#F3F4F6',  text:TXT_2,   label:'🚫 Cancelled' },
    DISCREPANCY:      { bg:WARNING_BG, text:WARNING, label:'⚠️ Discrepancy' },
  };
  const c = map[status] || { bg:'#F3F4F6', text:TXT_2, label:status };
  return (
    <span style={{
      background:c.bg, color:c.text, padding:'4px 10px', borderRadius:999,
      fontSize:12, fontWeight:500, whiteSpace:'nowrap',
    }}>{c.label}</span>
  );
}

// ── Info Box ──────────────────────────────────────────────────────────────────
function InfoBox({ label, value, highlight }) {
  return (
    <div style={{
      background: highlight ? SUCCESS_BG : CARD, padding:'12px 14px', textAlign:'center',
      border: `1px solid ${BORDER}`, borderRadius:10,
      display:'flex', flexDirection:'column', justifyContent:'center'
    }}>
      <div style={{ fontSize:20, fontWeight:600, color:TXT, fontVariantNumeric:'tabular-nums' }}>{value??'—'}</div>
      <div style={{ fontSize:11, color:TXT_2, fontWeight:500, marginTop:4, textTransform:'uppercase', letterSpacing:'.04em' }}>{label}</div>
    </div>
  );
}

// ── Row detail ─────────────────────────────────────────────────────────────────
function DetailRow({ label, value }) {
  return (
    <div style={{ display:'flex', justifyContent:'space-between', paddingBottom:8, marginBottom:8, borderBottom:`1px solid ${BORDER}`, gap:12 }}>
      <span style={{ color:TXT_2, fontWeight:500, fontSize:12, textTransform:'uppercase', letterSpacing:'.04em' }}>{label}</span>
      <span style={{ fontWeight:600, fontSize:13, color:TXT, textAlign:'right' }}>{value}</span>
    </div>
  );
}

// ── Request Card ──────────────────────────────────────────────────────────────
function RequestCard({ r, onReceive }) {
  const [expanded, setExpanded] = useState(false);
  const isShipped = r.status === 'SHIPPED';
  return (
    <div className="hover-card" style={{
      background: CARD,
      border: `1px solid ${isShipped ? PRIMARY : BORDER}`,
      borderRadius:10,
      boxShadow: isShipped ? '0 0 0 1px rgba(37,99,235,0.2), 0 4px 12px rgba(0,0,0,0.08)' : '0 1px 3px rgba(0,0,0,0.06)',
      overflow:'hidden',
    }}>
      {isShipped && (
        <div style={{ background:PRIMARY_H, padding:'10px 16px', display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
          <Truck size={16} color="white"/>
          <span style={{ color:'white', fontWeight:600, fontSize:12, textTransform:'uppercase', letterSpacing:'.04em' }}>📦 Shipment Arrived — Action Required</span>
          <span style={{ marginLeft:'auto', background:SUCCESS_BG, color:SUCCESS, padding:'3px 10px', fontSize:12, fontWeight:600, textTransform:'uppercase', borderRadius:999 }}>
            {r.shipped_qty} units ready
          </span>
        </div>
      )}
      <div style={{ padding:20 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12, flexWrap:'wrap', gap:8 }}>
          <div>
            <div style={{ fontSize:17, fontWeight:600, color:TXT }}>{r.product_name}</div>
            <div style={{ fontSize:12, color:INFO, fontFamily:'monospace', marginTop:4, fontWeight:600 }}>{r.request_code}</div>
          </div>
          <StatusBadge status={r.status}/>
        </div>
        <StepTracker status={r.status}/>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(90px,1fr))', gap:12, marginTop:16 }}>
          <InfoBox label="Requested"   value={r.requested_qty} />
          <InfoBox label="Sales Stock" value={r.sales_qty_at_request??'—'} />
          <InfoBox label="Store Stock" value={r.store_qty_at_request??'—'} />
          {r.shipped_qty!=null && <InfoBox label="Shipped" value={r.shipped_qty} highlight={isShipped}/>}
        </div>
        <button onClick={() => setExpanded(e => !e)} className="inv-btn"
          style={{ marginTop:14, background:CARD, border:`1px solid ${BORDER}`, color:TXT_2, fontSize:13, fontWeight:500, cursor:'pointer', display:'inline-flex', alignItems:'center', gap:6, height:36, padding:'0 14px', borderRadius:8 }}>
          {expanded ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
          {expanded ? 'Hide Details' : 'Show Details'}
        </button>
        {expanded && (
          <div style={{ marginTop:12, background:'#F9FAFB', padding:14, border:`1px solid ${BORDER}`, borderRadius:8 }}>
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
          <button onClick={() => onReceive(r)} className="inv-btn"
            style={{
              marginTop:16, width:'100%', height:48,
              background:PRIMARY, color:'white', border:'none', borderRadius:8,
              cursor:'pointer', fontWeight:600, fontSize:14, display:'flex', alignItems:'center', justifyContent:'center', gap:8,
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
        if ('Notification' in window) {
          const grant = Notification.permission === 'granted'
            ? true : (await Notification.requestPermission()) === 'granted';
          if (grant) new Notification('📦 Stock Received!',{
            body:`${qty} units of ${receiveModal.req.product_name} added to Sales inventory.`, icon:'/favicon.ico'
          });
        }
      } else {
        showMsg('⚠️ Quantity mismatch! Discrepancy reported to CEO for review.','error');
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
      return `<tr style="border-bottom:1px solid #E5E7EB">
        <td style="padding:10px 14px;text-align:center;color:#6B7280;font-weight:600">${idx+1}</td>
        <td style="padding:10px 14px;font-weight:600">${name}</td>
        <td style="padding:10px 14px">${cat}</td>
        <td style="padding:10px 14px;text-align:center;font-weight:700">${qty}</td>
        <td style="padding:10px 14px;text-align:center">${unit}</td>
        <td style="padding:10px 14px;text-align:right;font-weight:700">ETB ${val}</td>
      </tr>`;
    }).join('');
    const totalQty = filteredStock.reduce((s,d)=>s+(Number(d.stock_quantity)||0),0);
    win.document.write(`<!DOCTYPE html><html><head><title>Store Inventory</title>
      <style>body{font-family:Inter,'Segoe UI',sans-serif;margin:24px;color:#111827}
      table{width:100%;border-collapse:collapse}
      th{background:#2563EB;color:white;padding:12px 14px;text-align:left;font-size:12px;text-transform:uppercase;letter-spacing:.04em}
      @media print{button{display:none}}</style></head><body>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;border-bottom:3px solid #2563EB;padding-bottom:16px">
        <div>
          <h2 style="margin:0;color:#2563EB;font-size:22px">🌿 Store Inventory Report</h2>
          <p style="margin:4px 0 0;color:#6B7280;font-size:13px">Printed: ${new Date().toLocaleString()}</p>
        </div>
        <div style="text-align:right">
          <div style="font-size:13px;color:#111827">Total Items: <strong>${totalItems}</strong></div>
          <div style="font-size:13px;color:#111827">Total Value: <strong>ETB ${totalValue.toFixed(2)}</strong></div>
        </div>
      </div>
      <table><thead><tr>
        <th style="text-align:center;width:40px">#</th><th>Product Name</th><th>Category</th><th style="text-align:center">Qty</th>
        <th style="text-align:center">Unit</th><th style="text-align:right">Est. Value</th>
      </tr></thead><tbody>${rows}
        <tr style="background:#2563EB;color:white">
          <td colspan="3" style="padding:12px 14px;font-weight:700;text-transform:uppercase;letter-spacing:.04em">Grand Total</td>
          <td style="padding:12px 14px;text-align:center;font-weight:700">${totalQty.toLocaleString()}</td>
          <td style="padding:12px 14px;text-align:center">UNITS</td>
          <td style="padding:12px 14px;text-align:right;font-weight:700">ETB ${totalValue.toFixed(2)}</td>
        </tr>
      </tbody></table>
      <script>window.onload=()=>window.print()<\/script></body></html>`);
    win.document.close();
  };

  return (
    <div style={{ margin:0, minHeight:'100vh', width:'100%', background:BG_PAGE, fontFamily:"'Inter','Segoe UI',sans-serif", overflowX:'hidden' }}>
      <style>{`
        @keyframes spin    { 100%{transform:rotate(360deg)} }
        @keyframes fadeUp  { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeSlide{ from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes toastIn { from{opacity:0;transform:translateX(24px)} to{opacity:1;transform:translateX(0)} }
        .inv-row { transition:background .15s ease; }
        .inv-row:hover { background:#F9FAFB !important; }
        .inv-btn { transition:all .15s ease; cursor:pointer; border-radius:8px; font-family:inherit; font-weight:500; }
        .inv-btn:hover:not(:disabled) { background:#F59E0B !important; color:#78350F !important; transform:translateY(-1px); }
        .inv-btn:active:not(:disabled) { transform:translateY(0); background:#D97706 !important; color:#78350F !important; }
        .inv-btn:focus-visible { outline:none; box-shadow:0 0 0 3px rgba(37,99,235,.25); }
        .inv-btn:disabled { opacity:.5; cursor:not-allowed; }
        .gt-row, .gt-row td { transition:background .15s ease; }
        .gt-row:hover td { background:#1D4ED8 !important; }
        .inv-input { font-family:inherit; color:#111827; border-radius:8px; }
        .inv-input::placeholder { color:#9CA3AF; }
        .inv-input:focus { outline:none; border-color:#2563EB !important; box-shadow:0 0 0 3px rgba(37,99,235,.1); }
        .hover-card { transition:all .15s ease; }
        .hover-card:hover { border-color:#F59E0B !important; box-shadow:0 4px 12px rgba(0,0,0,.08) !important; transform:translateY(-1px); }
        .content-safe { max-width:1536px; margin:0 auto; padding:24px 24px; box-sizing:border-box; width:100%; }
        @media(max-width:1024px){ .content-safe{ padding:24px 20px; } }
        @media(max-width:768px){
          .kpi-grid { grid-template-columns:1fr 1fr !important; }
          .inv-header { flex-direction:column; align-items:flex-start !important; gap:12px !important; }
          .tab-row { flex-wrap:nowrap !important; overflow-x:auto; -webkit-overflow-scrolling:touch; scroll-snap-type:x proximity; }
          .tab-row button { scroll-snap-align:start; white-space:nowrap; }
          .req-grid { grid-template-columns:1fr !important; }
          .stock-search { max-width:100% !important; }
          .content-safe { padding:16px 16px; }
          .inv-input { height:44px !important; }
          .inv-btn { min-height:44px; }
        }
        @media(max-width:480px){
          .kpi-grid { grid-template-columns:1fr !important; }
          .content-safe { padding:12px 12px; }
          .inv-header { padding:0 12px; }
        }
      `}</style>

      {/* ── IN-APP TOAST ── */}
      {msg.text && (
        <div style={{
          position:'fixed', top:20, right:20, zIndex:9999999,
          padding:'14px 18px', display:'flex', alignItems:'center', gap:12,
          background:CARD, borderLeft:`4px solid ${msg.type==='success' ? SUCCESS : DANGER}`,
          color:TXT, fontWeight:500, fontSize:14, borderRadius:8,
          boxShadow:'0 8px 24px rgba(0,0,0,0.12)',
          maxWidth:400, minWidth:280, animation:'toastIn .3s ease',
        }}>
          <span style={{ color: msg.type==='success' ? SUCCESS : DANGER, flexShrink:0 }}>
            {msg.type==='success' ? <CheckCircle size={18}/> : <XCircle size={18}/>}
          </span>
          <span style={{ flex:1 }}>{msg.text}</span>
        </div>
      )}

      {/* ── HEADER ── */}
      <div style={{ background:PRIMARY_H, width:'100%', boxSizing:'border-box' }}>
        <div className="inv-header" style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'0 24px', height:64, flexWrap:'wrap', gap:12, maxWidth:1536, margin:'0 auto' }}>
          <div style={{ display:'flex', alignItems:'center', gap:14 }}>
            <div style={{ width:44, height:44, background:'rgba(255,255,255,0.14)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.4rem', flexShrink:0, borderRadius:10 }}>
              🌿
            </div>
            <div>
              <h1 style={{ fontSize:24, fontWeight:600, color:'white', margin:0, letterSpacing:'0.01em', lineHeight:1.3 }}>Store Inventory</h1>
              <p style={{ margin:0, fontSize:12, fontWeight:500, letterSpacing:'0.08em', textTransform:'uppercase', color:'#BFDBFE' }}>Request Stock • Track Shipments</p>
            </div>
          </div>
          <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
            {shippedRequests.length > 0 && activeTab !== 'my_requests' && (
              <button type="button" onClick={() => setActiveTab('my_requests')} className="inv-btn" style={{
                background:WARNING, color:'white', border:'none',
                height:44, padding:'0 18px', fontWeight:500, fontSize:14, display:'inline-flex',
                alignItems:'center', gap:8,
              }}>
                <Truck size={16}/> Receive Shipments ({shippedRequests.length}) <ArrowRight size={14}/>
              </button>
            )}
            <button type="button" onClick={handleRefresh} disabled={loading} className="inv-btn" style={{
              background:'rgba(255,255,255,0.12)', color:'white', border:'1px solid rgba(255,255,255,0.3)',
              height:44, padding:'0 18px', fontWeight:500, fontSize:14, display:'inline-flex',
              alignItems:'center', gap:8,
            }}>
              {spinning ? <SegmentedSpinner size={16} /> : <RefreshCw size={16} className={spinning ? 'spin' : ''}/>}
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="content-safe" style={{ animation:'fadeUp .35s ease' }}>

        {/* ── KPI CARDS (only 2: Total Items + Total Value) ── */}
        <div className="kpi-grid" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))', gap:16, marginBottom:24 }}>
          {[
            { label:'Total Items in Store', value:totalItems, icon:Package },
            { label:'Est. Total Value (ETB)', value: `ETB ${totalValue.toLocaleString('en',{maximumFractionDigits:2})}`, icon:Database },
          ].map((kpi,i) => (
            <div key={i} className="hover-card" style={{ padding:20, background:CARD, border:`1px solid ${BORDER}`, borderRadius:10, boxShadow:'0 1px 3px rgba(0,0,0,0.06)', display:'flex', alignItems:'center', gap:16 }}>
              <div style={{ background:'#EFF6FF', padding:14, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', borderRadius:8 }}>
                <kpi.icon size={22} color={PRIMARY}/>
              </div>
              <div>
                <div style={{ fontSize:12, fontWeight:500, color:TXT_2, textTransform:'uppercase', letterSpacing:'.04em', marginBottom:4 }}>{kpi.label}</div>
                <div style={{ fontSize:24, fontWeight:600, color:TXT, lineHeight:1.3, fontVariantNumeric:'tabular-nums' }}>{kpi.value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ── TABS ── */}
        <div className="tab-row" style={{ display:'flex', gap:4, marginBottom:24, borderBottom:`1px solid ${BORDER}`, flexWrap:'wrap' }}>
          <button type="button" className="inv-btn" onClick={() => setActiveTab('store_stock')} style={{
            background:'transparent',
            color: activeTab === 'store_stock' ? PRIMARY : TXT_2,
            border:'none', borderBottom: activeTab === 'store_stock' ? `2px solid ${PRIMARY}` : '2px solid transparent',
            marginBottom:-1, height:44, padding:'0 16px', fontWeight: activeTab === 'store_stock' ? 600 : 500, fontSize:14,
            display:'flex', alignItems:'center', gap:8, borderRadius:'8px 8px 0 0',
          }}>
            <Package size={16}/> Store Stock
          </button>

          <button type="button" className="inv-btn" onClick={() => setActiveTab('retail_products')} style={{
            background:'transparent',
            color: activeTab === 'retail_products' ? PRIMARY : TXT_2,
            border:'none', borderBottom: activeTab === 'retail_products' ? `2px solid ${PRIMARY}` : '2px solid transparent',
            marginBottom:-1, height:44, padding:'0 16px', fontWeight: activeTab === 'retail_products' ? 600 : 500, fontSize:14,
            display:'flex', alignItems:'center', gap:8, borderRadius:'8px 8px 0 0',
          }}>
            <Package size={16}/> Published Retail Products
          </button>

          <button type="button" className="inv-btn" onClick={() => setActiveTab('my_requests')} style={{
            background:'transparent',
            color: activeTab === 'my_requests' ? PRIMARY : TXT_2,
            border:'none', borderBottom: activeTab === 'my_requests' ? `2px solid ${PRIMARY}` : '2px solid transparent',
            marginBottom:-1, height:44, padding:'0 16px', fontWeight: activeTab === 'my_requests' ? 600 : 500, fontSize:14,
            display:'flex', alignItems:'center', gap:8, borderRadius:'8px 8px 0 0',
          }}>
            <List size={16}/> My Shipment Tracking
            {shippedRequests.length > 0 && (
              <span style={{ background:DANGER, color:'white', padding:'2px 8px', fontSize:12, fontWeight:600, borderRadius:999 }}>
                {shippedRequests.length}
              </span>
            )}
          </button>
        </div>

        {/* ── RETAIL PRODUCTS TAB ── */}
        {activeTab === 'retail_products' && (
          <div style={{ marginTop: 16 }}>
            <SalesInventoryView hideHeader={true} />
          </div>
        )}

        {/* ── STORE STOCK TAB ── */}
        {activeTab === 'store_stock' && (
          <div style={{ animation:'fadeUp .4s ease' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16, flexWrap:'wrap', gap:12 }}>
              <div className="stock-search" style={{ position:'relative', maxWidth:400, flex:1, minWidth:220 }}>
                <Search size={16} color={TXT_2} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }}/>
                <input type="text" placeholder="Search store items..." value={search} onChange={e => setSearch(e.target.value)}
                  className="inv-input"
                  style={{ width:'100%', height:36, padding:'0 14px 0 40px', border:`1px solid ${BORDER}`,
                    fontSize:14, outline:'none', background:CARD, color:TXT,
                    boxSizing:'border-box', fontWeight:400, transition:'all .15s ease'
                  }}/>
              </div>
              <button onClick={handlePrint} className="inv-btn" style={{
                background:PRIMARY, color:'white', border:'none', height:44, padding:'0 20px',
                fontWeight:500, fontSize:14, display:'flex', alignItems:'center', gap:8,
              }}>
                <Printer size={16}/> Print Report
              </button>
            </div>

            <div style={{ background:CARD, border:`1px solid ${BORDER}`, overflow:'hidden', borderRadius:10, boxShadow:'0 1px 3px rgba(0,0,0,0.06)' }}>
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:14, minWidth:760 }}>
                  <thead>
                    <tr>
                      {[['#','center'],['Product Name','left'],['Category','left'],['Qty in Store','center'],['Unit','center'],['Cost Price (ETB)','right'],['Action','center']].map(([h,ta],i) => (
                        <th key={i} style={{
                          padding:'12px 18px',
                          textAlign: ta,
                          fontWeight:500, color:TXT_2, background:'#F9FAFB', textTransform:'uppercase', letterSpacing:'.04em', fontSize:12,
                          borderBottom:`1px solid ${BORDER}`, whiteSpace:'nowrap'
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={7} style={{ padding:60, textAlign:'center' }}>
                        <SegmentedSpinner size={36} />
                        <div style={{ marginTop:12, fontWeight:500, color:TXT_2, fontSize:14 }}>Loading store inventory…</div>
                      </td></tr>
                    ) : filteredStock.length === 0 ? (
                      <tr><td colSpan={7} style={{ padding:60, textAlign:'center' }}>
                        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:12 }}>
                          <div style={{ width:64, height:64, borderRadius:999, background:'#EFF6FF', display:'flex', alignItems:'center', justifyContent:'center', fontSize:30 }}>📦</div>
                          <div style={{ fontSize:16, fontWeight:600, color:TXT }}>No items found</div>
                          <div style={{ fontSize:14, color:TXT_2 }}>Try adjusting your search.</div>
                        </div>
                      </td></tr>
                    ) : filteredStock.map((item, idx) => {
                      const hasOpen = myRequests.some(r =>
                        r.product_id===(item.product_id||item.id) && ['PENDING_APPROVAL','APPROVED','SHIPPED'].includes(r.status)
                      );
                      const qty   = Number(item.stock_quantity) || 0;
                      const clr   = qty <= 0 ? DANGER : qty < 10 ? WARNING : SUCCESS;
                      const dName = item.name || item.product_name || `product #${item.product_id||item.id||idx+1}`;
                      const dUnit = item.unit || item.product_unit || 'pcs';
                      const dCat  = item.category || item.product_category || '—';
                      const dPrice = Number(item.cost_price || 0).toFixed(2);
                      return (
                        <tr key={`row-${item.id||idx}`} className="inv-row" style={{ borderBottom:`1px solid ${BORDER}`, background:CARD }}>
                          <td style={{ padding:'13px 18px', textAlign:'center', color:TXT_2, fontSize:13, fontWeight:500, fontVariantNumeric:'tabular-nums', whiteSpace:'nowrap' }}>{idx+1}</td>
                          <td style={{ padding:'13px 18px', fontWeight:600, color:TXT }}>{dName}</td>
                          <td style={{ padding:'13px 18px' }}>
                            <span style={{ display:'inline-block', background:'#EFF6FF', color:PRIMARY, padding:'3px 10px', fontSize:12, fontWeight:500, borderRadius:999, textTransform:'uppercase', letterSpacing:'.02em' }}>
                              {dCat}
                            </span>
                          </td>
                          <td style={{ padding:'13px 18px', textAlign:'center', fontSize:18, fontWeight:600, color:clr, fontVariantNumeric:'tabular-nums' }}>
                            {qty.toLocaleString()}
                          </td>
                          <td style={{ padding:'13px 18px', textAlign:'center' }}>
                            <span style={{ display:'inline-block', background:'#F3F4F6', color:TXT_2, padding:'3px 10px', fontSize:12, fontWeight:500, borderRadius:999, textTransform:'uppercase' }}>
                              {dUnit}
                            </span>
                          </td>
                          <td style={{ padding:'13px 18px', textAlign:'right', fontWeight:600, color:TXT, fontVariantNumeric:'tabular-nums' }}>
                            ETB {dPrice}
                          </td>
                          <td style={{ padding:'13px 18px', textAlign:'center' }}>
                            {hasOpen
                              ? <span style={{ display:'inline-block', background:WARNING_BG, color:WARNING, padding:'6px 12px', fontSize:12, fontWeight:500, borderRadius:999, whiteSpace:'nowrap' }}>
                                  ⏳ Pending CEO
                                </span>
                              : <button type="button" onClick={() => setReqModal({ open:true, item, qty:'', urgency:'MEDIUM' })}
                                  className="inv-btn"
                                  style={{ background:PRIMARY, color:'white', border:'none', height:36, padding:'0 16px', fontWeight:500, fontSize:13, display:'inline-flex', alignItems:'center', gap:6 }}>
                                  <Send size={14}/> Request
                                </button>
                            }
                          </td>
                        </tr>
                      );
                    })}

                    {filteredStock.length > 0 && (
                      <tr className="gt-row" style={{ background:PRIMARY }}>
                        <td colSpan={3} style={{ padding:'14px 18px', fontSize:13, fontWeight:600, color:'white', textTransform:'uppercase', letterSpacing:'.04em' }}>
                          GRAND TOTAL
                        </td>
                        <td style={{ padding:'14px 18px', textAlign:'center', fontSize:20, fontWeight:700, color:'white', fontVariantNumeric:'tabular-nums' }}>
                          {filteredStock.reduce((s,d)=>s+(Number(d.stock_quantity)||0),0).toLocaleString()}
                        </td>
                        <td style={{ padding:'14px 18px', textAlign:'center', fontSize:12, fontWeight:500, color:'rgba(255,255,255,0.85)', textTransform:'uppercase', letterSpacing:'.04em' }}>
                          UNITS
                        </td>
                        <td style={{ padding:'14px 18px', textAlign:'right', fontSize:18, fontWeight:700, color:'white', fontVariantNumeric:'tabular-nums', whiteSpace:'nowrap' }}>
                          ETB {filteredStock.reduce((s,d)=>s+(Number(d.stock_quantity)||0)*(Number(d.unit_price||d.price)||0),0).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}
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

        {/* ── MY SHIPMENT TRACKING TAB ── */}
        {activeTab === 'my_requests' && (
          <div style={{ animation:'fadeUp .4s ease' }}>

            {/* Mini KPIs inside the tracking tab */}
            <div className="kpi-grid" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:16, marginBottom:24 }}>
              {[
                { label:'My Requests', value:myRequests.length, icon:List, tileBg:'#EFF6FF', iconColor:PRIMARY },
                { label:'Shipped', value:shippedRequests.length, icon:Truck, tileBg:'#FEF3C7', iconColor:WARNING },
                { label:'Completed', value:myRequests.filter(r=>r.status==='COMPLETED').length, icon:CheckCircle, tileBg:'#DCFCE7', iconColor:SUCCESS },
              ].map((kpi,i)=>(
                <div key={i} className="hover-card" style={{ padding:18, background:CARD, border:`1px solid ${BORDER}`, borderRadius:10, boxShadow:'0 1px 3px rgba(0,0,0,0.06)', display:'flex', alignItems:'center', gap:14 }}>
                  <div style={{ background:kpi.tileBg, padding:10, flexShrink:0, borderRadius:8 }}>
                    <kpi.icon size={18} color={kpi.iconColor}/>
                  </div>
                  <div>
                    <div style={{ fontSize:11, fontWeight:500, color:TXT_2, textTransform:'uppercase', letterSpacing:'.04em' }}>{kpi.label}</div>
                    <div style={{ fontSize:'1.6rem', fontWeight:600, color:TXT, lineHeight:1.3, fontVariantNumeric:'tabular-nums' }}>{kpi.value}</div>
                  </div>
                </div>
              ))}
            </div>

            {loading && myRequests.length===0 ? (
              <div style={{ textAlign:'center', padding:60 }}>
                <SegmentedSpinner size={36} />
              </div>
            ) : myRequests.length === 0 ? (
              <div className="hover-card" style={{ textAlign:'center', padding:60, background:CARD, border:`1px solid ${BORDER}`, borderRadius:10, boxShadow:'0 1px 3px rgba(0,0,0,0.06)' }}>
                <div style={{ width:72, height:72, borderRadius:999, background:'#FEF3C7', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px', fontSize:34 }}>🚚</div>
                <div style={{ fontWeight:600, fontSize:18, color:TXT, marginBottom:8 }}>No Transfer Requests Yet</div>
                <div style={{ fontSize:14, color:TXT_2 }}>Go to the "Store Stock" tab to request products from the store.</div>
              </div>
            ) : (
              <div className="req-grid" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(340px, 1fr))', gap:20 }}>
                {shippedRequests.length > 0 && (
                  <div style={{ gridColumn:'1 / -1', marginBottom:0, fontSize:13, fontWeight:600, color:TXT, display:'flex', alignItems:'center', gap:8, textTransform:'uppercase', letterSpacing:'.04em' }}>
                    <Truck size={16}/> Awaiting Your Receipt ({shippedRequests.length})
                  </div>
                )}
                {shippedRequests.map(r => (
                  <RequestCard key={r.id} r={r} onReceive={req => setReceiveModal({ open:true, req, qty:String(req.shipped_qty||'') })}/>
                ))}
                {otherRequests.length > 0 && shippedRequests.length > 0 && (
                  <div style={{ gridColumn:'1 / -1', margin:'12px 0 0', fontSize:13, fontWeight:600, color:TXT_2, textTransform:'uppercase', letterSpacing:'.04em' }}>
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
          style={{ position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.4)', zIndex:99999, overflowY:'auto', display:'flex', alignItems:'flex-start', justifyContent:'center', padding:'40px 16px' }}>
          <div style={{ margin:'auto', flexShrink:0, background:CARD, width:520, maxWidth:'100%', borderRadius:12, boxShadow:'0 24px 48px rgba(0,0,0,0.2)', overflow:'hidden', animation:'fadeUp .25s ease' }}>
            <div style={{ padding:'20px 24px', background:PRIMARY_H }}>
              <h3 style={{ margin:0, fontSize:18, color:'white', fontWeight:600, lineHeight:1.3 }}>Request Transfer from Store</h3>
              <p style={{ margin:'4px 0 0', fontSize:13, color:'#BFDBFE', fontWeight:500 }}>{reqModal.item?.name}</p>
            </div>
            <div style={{ padding:24, display:'flex', flexDirection:'column', gap:20 }}>
              <div>
                <label style={{ display:'block', fontSize:12, fontWeight:500, marginBottom:6, textTransform:'uppercase', letterSpacing:'.04em', color:TXT_2 }}>Quantity to Request</label>
                <input type="number" min="1" value={reqModal.qty} onChange={e => setReqModal({...reqModal, qty:e.target.value})}
                  className="inv-input"
                  style={{ width:'100%', height:44, padding:'0 14px', border:`1px solid ${BORDER}`, outline:'none', boxSizing:'border-box', fontWeight:600, fontSize:18, borderRadius:8 }} autoFocus/>
              </div>
              <div>
                <label style={{ display:'block', fontSize:12, fontWeight:500, marginBottom:6, textTransform:'uppercase', letterSpacing:'.04em', color:TXT_2 }}>Urgency</label>
                <select value={reqModal.urgency} onChange={e => setReqModal({...reqModal, urgency:e.target.value})}
                  className="inv-input"
                  style={{ width:'100%', height:44, padding:'0 14px', border:`1px solid ${BORDER}`, outline:'none', fontWeight:500, fontSize:14, borderRadius:8, background:CARD, appearance:'none', cursor:'pointer',
                    backgroundImage:"url(\"data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236B7280' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
                    backgroundRepeat:'no-repeat', backgroundPosition:'right 14px center', paddingRight:34 }}>
                  <option value="LOW">LOW</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HIGH">HIGH</option>
                </select>
              </div>
              <div>
                <label style={{ display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:12, fontWeight:500, marginBottom:8, textTransform:'uppercase', letterSpacing:'.04em', color:TXT_2 }}>
                  <span>Digital Signature {savedSig && <span style={{ color:SUCCESS, fontSize:11, marginLeft:6, background:SUCCESS_BG, padding:'2px 10px', borderRadius:999, fontWeight:600 }}>✓ SAVED</span>}</span>
                  <button type="button" onClick={() => { sigCanvas.current?.clear(); setSavedSig(null); }}
                    className="inv-btn"
                    style={{ fontSize:12, color:'white', background:DANGER, border:'none', cursor:'pointer', fontWeight:500, height:32, padding:'0 12px', borderRadius:8 }}>Clear</button>
                </label>
                <div style={{ border:`1px solid ${BORDER}`, background:'#FAFAFA', borderRadius:8, overflow:'hidden' }}>
                  <SignatureCanvas ref={sigCanvas} penColor={PRIMARY} canvasProps={{ width:452, height:120 }}/>
                </div>
                <button type="button"
                  onClick={() => {
                    if (!sigCanvas.current || sigCanvas.current.isEmpty()) { showMsg('Draw your signature first','error'); return; }
                    setSavedSig(sigCanvas.current.toDataURL());
                    showMsg('✅ Signature saved!','success');
                  }}
                  className="inv-btn"
                  style={{ marginTop:10, width:'100%', height:44, background:PRIMARY, color:'white', border:'none', fontWeight:500, fontSize:14, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                  💾 Save Signature
                </button>
                {savedSig && (
                  <div style={{ marginTop:8, border:`1px solid ${SUCCESS}`, padding:10, background:SUCCESS_BG, borderRadius:8 }}>
                    <div style={{ fontSize:11, fontWeight:500, color:SUCCESS, marginBottom:4, textTransform:'uppercase', letterSpacing:'.04em' }}>Saved Preview:</div>
                    <img src={savedSig} alt="signature" style={{ maxWidth:'100%', height:50, objectFit:'contain', display:'block' }}/>
                  </div>
                )}
              </div>
              <div style={{ display:'flex', gap:12, marginTop:4 }}>
                <button type="button"
                  onClick={() => { setReqModal({open:false,item:null,qty:'',urgency:'MEDIUM'}); setSavedSig(null); sigCanvas.current?.clear(); }}
                  className="inv-btn"
                  style={{ flex:1, height:48, background:CARD, color:TXT_2, border:`1px solid ${BORDER}`, fontWeight:500, fontSize:14, borderRadius:8 }}>Cancel</button>
                <button type="button"
                  onClick={() => submitRequest()}
                  disabled={submittingReq}
                  className="inv-btn"
                  style={{ flex:2, height:48, background:PRIMARY, color:'white', border:'none', fontWeight:500, fontSize:14, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', gap:8, opacity: submittingReq ? 0.6 : 1, cursor: submittingReq ? 'not-allowed' : 'pointer' }}>
                  {submittingReq ? <SegmentedSpinner size={16} /> : <Send size={16}/>}
                  {submittingReq ? 'Submitting…' : 'Submit to CEO'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── RECEIVE MODAL ── */}
      {receiveModal.open && receiveModal.req && (
        <div style={{ position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.4)', zIndex:99999, overflowY:'auto', display:'flex', alignItems:'flex-start', justifyContent:'center', padding:'40px 16px' }}>
          <div style={{ margin:'auto', flexShrink:0, background:CARD, width:540, maxWidth:'100%', borderRadius:12, boxShadow:'0 24px 48px rgba(0,0,0,0.2)', overflow:'hidden', animation:'fadeUp .25s ease' }}>
            <div style={{ background:PRIMARY_H, padding:'20px 24px', display:'flex', alignItems:'center', gap:14 }}>
              <div style={{ background:'rgba(255,255,255,0.14)', padding:12, borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Inbox size={26} color="white"/>
              </div>
              <div>
                <h3 style={{ margin:0, fontSize:18, color:'white', fontWeight:600, lineHeight:1.3 }}>Confirm Receipt</h3>
                <p style={{ margin:'4px 0 0', fontSize:12, color:'#BFDBFE', fontWeight:500, textTransform:'uppercase', letterSpacing:'.04em' }}>Step 4 of 4 — Sales Receiving</p>
              </div>
            </div>
            <div style={{ padding:24 }}>
              <div style={{ background:'#F9FAFB', border:`1px solid ${BORDER}`, padding:20, borderRadius:10, marginBottom:20 }}>
                <div style={{ fontSize:18, fontWeight:600, color:TXT }}>{receiveModal.req.product_name}</div>
                <div style={{ fontSize:12, color:INFO, fontFamily:'monospace', marginTop:6, fontWeight:600 }}>{receiveModal.req.request_code}</div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12, marginTop:16 }}>
                  <InfoBox label="Requested"  value={receiveModal.req.requested_qty} />
                  <InfoBox label="Shipped"    value={receiveModal.req.shipped_qty} highlight />
                  <InfoBox label="Pharm Stock" value={receiveModal.req.sales_qty_at_request??'—'} />
                </div>
              </div>
              <StepTracker status="SHIPPED"/>
              <div style={{ height:1, background:BORDER, margin:'20px 0' }}/>
              <label style={{ display:'block', fontSize:12, fontWeight:500, marginBottom:8, color:TXT_2, textTransform:'uppercase', letterSpacing:'.04em' }}>
                Actual Quantity You Received
              </label>
              <input type="number" min="0" value={receiveModal.qty}
                onChange={e => setReceiveModal({...receiveModal, qty:e.target.value})}
                className="inv-input"
                style={{ width:'100%', height:48, padding:'0 16px', border:`1px solid ${BORDER}`, outline:'none', fontSize:22, fontWeight:600, boxSizing:'border-box', borderRadius:8 }}
                autoFocus placeholder="Enter count received..."/>
              {receiveModal.qty !== '' && (
                parseInt(receiveModal.qty) === Number(receiveModal.req.shipped_qty) ? (
                  <div style={{ marginTop:12, background:SUCCESS_BG, border:`1px solid ${SUCCESS}`, padding:'10px 14px', color:SUCCESS, fontSize:13, display:'flex', alignItems:'center', gap:8, fontWeight:500, borderRadius:8 }}>
                    <Check size={18}/> Quantities match — Add to stock
                  </div>
                ) : (
                  <div style={{ marginTop:12, background:DANGER_BG, border:`1px solid ${DANGER}`, padding:'10px 14px', color:DANGER, fontSize:13, display:'flex', alignItems:'center', gap:8, fontWeight:500, borderRadius:8 }}>
                    <AlertTriangle size={18}/> Mismatch! Triggers discrepancy report
                  </div>
                )
              )}
              <div style={{ display:'flex', gap:16, marginTop:24 }}>
                <button type="button" onClick={() => setReceiveModal({open:false,req:null,qty:''})} className="inv-btn"
                  style={{ flex:1, height:48, background:CARD, color:TXT_2, border:`1px solid ${BORDER}`, fontWeight:500, fontSize:14, borderRadius:8 }}>Cancel</button>
                <button type="button" onClick={() => submitReceive()} disabled={submittingReceive||receiveModal.qty===''} className="inv-btn"
                  style={{ flex:2, height:48, background:PRIMARY, color:'white', border:'none', cursor: submittingReceive||receiveModal.qty===''?'not-allowed':'pointer', fontWeight:500, fontSize:14, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', gap:10, opacity: submittingReceive||receiveModal.qty===''?0.6:1 }}>
                  {submittingReceive ? <SegmentedSpinner size={16} /> : <Check size={16}/>}
                  {submittingReceive ? 'Processing…' : 'Confirm & Update Stock'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
