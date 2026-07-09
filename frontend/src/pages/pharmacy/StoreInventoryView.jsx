import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Database, RefreshCw, Send, Loader2, CheckCircle, XCircle, Search,
  Package, List, AlertTriangle, Inbox, Check, Clock, Truck, ShoppingBag,
  ArrowRight, ChevronDown, ChevronUp
} from 'lucide-react';
import apiClient from '../../services/apiClient';
import SignatureCanvas from 'react-signature-canvas';

const preloadedAudio = {
  notification: new Audio('/sounds/notification.mp3'),
  approved: new Audio('/sounds/approved.mp3'),
  rejected: new Audio('/sounds/rejected.mp3'),
  shipment: new Audio('/sounds/shipment.mp3'),
  completed: new Audio('/sounds/completed.mp3'),
};
Object.values(preloadedAudio).forEach(a => { a.load(); });

// ── 4-Step Progress Bar ──────────────────────────────────────────────────────
const STEPS = [
  { key: 'PENDING_APPROVAL', label: 'Requested to CEO', icon: <Clock size={18}/> },
  { key: 'APPROVED',         label: 'CEO Approved',      icon: <CheckCircle size={18}/> },
  { key: 'SHIPPED',          label: 'Store Shipped',      icon: <Truck size={18}/> },
  { key: 'COMPLETED',        label: 'Pharmacy Received',  icon: <ShoppingBag size={18}/> },
];

const STATUS_ORDER = {
  PENDING_APPROVAL: 0,
  APPROVED: 1,
  SHIPPED: 2,
  COMPLETED: 3,
  DISCREPANCY: 3,
  REJECTED: -1,
  CANCELLED: -1,
};

function StepTracker({ status }) {
  const currentIdx = STATUS_ORDER[status] ?? 0;
  const isRejected = status === 'REJECTED' || status === 'CANCELLED';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 8 }}>
      {STEPS.map((step, idx) => {
        const done = idx < currentIdx;
        const active = idx === currentIdx && !isRejected;
        const bg = isRejected ? '#fee2e2' : done ? '#10b981' : active ? '#0891b2' : '#e2e8f0';
        const col = isRejected ? '#ef4444' : done || active ? 'white' : '#94a3b8';
        const textCol = isRejected ? '#ef4444' : done ? '#059669' : active ? '#0891b2' : '#94a3b8';
        return (
          <React.Fragment key={step.key}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 80 }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%', background: bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: col, boxShadow: active ? '0 0 0 4px rgba(8,145,178,0.15)' : 'none',
                transition: 'all 0.3s'
              }}>
                {done ? <Check size={16}/> : step.icon}
              </div>
              <div style={{ fontSize: 10, fontWeight: 700, color: textCol, textAlign: 'center', marginTop: 4, lineHeight: 1.2 }}>
                {step.label}
              </div>
            </div>
            {idx < STEPS.length - 1 && (
              <div style={{ flex: 1, height: 3, background: idx < currentIdx ? '#10b981' : '#e2e8f0', transition: 'all 0.3s', marginBottom: 20 }}/>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ── Request Card ─────────────────────────────────────────────────────────────
function RequestCard({ r, onReceive }) {
  const [expanded, setExpanded] = useState(false);
  const isShipped = r.status === 'SHIPPED';

  return (
    <div style={{
      background: 'white', borderRadius: 16, border: isShipped ? '2px solid #0891b2' : '1px solid #e2e8f0',
      overflow: 'hidden', marginBottom: 16, boxShadow: isShipped ? '0 4px 20px rgba(8,145,178,0.15)' : '0 2px 8px rgba(0,0,0,0.04)',
      animation: 'fadeSlide 0.3s ease-out'
    }}>
      {/* Shipped banner */}
      {isShipped && (
        <div style={{ background: 'linear-gradient(90deg, #0891b2, #06b6d4)', padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <Truck size={18} color="white"/>
          <span style={{ color: 'white', fontWeight: 800, fontSize: 14 }}>📦 SHIPMENT ARRIVED — ACTION REQUIRED</span>
          <span style={{ marginLeft: 'auto', background: 'rgba(255,255,255,0.25)', color: 'white', padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
            {r.shipped_qty} units ready
          </span>
        </div>
      )}

      <div style={{ padding: '16px 20px' }}>
        {/* Header row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 800, color: '#0f172a' }}>{r.drug_name}</div>
            <div style={{ fontSize: 12, color: '#94a3b8', fontFamily: 'monospace', marginTop: 2 }}>{r.request_code}</div>
          </div>
          <StatusBadge status={r.status}/>
        </div>

        {/* 4-Step tracker */}
        <StepTracker status={r.status}/>

        {/* Key numbers */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginTop: 16 }}>
          <InfoBox label="Requested Qty" value={r.requested_qty} color="#6366f1"/>
          <InfoBox label="Pharmacy Stock at Request" value={r.pharmacy_qty_at_request ?? '—'} color="#f59e0b"/>
          <InfoBox label="Store Stock at Request" value={r.store_qty_at_request ?? '—'} color="#3b82f6"/>
          {r.shipped_qty != null && <InfoBox label="Shipped Qty" value={r.shipped_qty} color="#10b981" highlight={isShipped}/>}
        </div>

        {/* Expand / collapse detail */}
        <button onClick={() => setExpanded(e => !e)} style={{ marginTop: 14, background: 'none', border: 'none', color: '#64748b', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, padding: 0 }}>
          {expanded ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
          {expanded ? 'Hide details' : 'Show details'}
        </button>

        {expanded && (
          <div style={{ marginTop: 12, background: '#f8fafc', borderRadius: 10, padding: '12px 16px', fontSize: 13 }}>
            <Row label="Urgency" value={r.urgency}/>
            <Row label="Requested At" value={r.created_at ? new Date(r.created_at).toLocaleString() : '—'}/>
            {r.approved_at && <Row label="Approved At" value={new Date(r.approved_at).toLocaleString()}/>}
            {r.shipped_at && <Row label="Shipped At" value={new Date(r.shipped_at).toLocaleString()}/>}
            {r.received_at && <Row label="Received At" value={new Date(r.received_at).toLocaleString()}/>}
            {r.received_qty != null && <Row label="Received Qty" value={r.received_qty}/>}
            {r.decision_reason && <Row label="Note" value={r.decision_reason}/>}
          </div>
        )}

        {/* Receive button */}
        {isShipped && (
          <button onClick={() => onReceive(r)} style={{
            marginTop: 16, width: '100%', padding: '14px', background: 'linear-gradient(90deg, #059669, #10b981)',
            color: 'white', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 800,
            fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            boxShadow: '0 4px 14px rgba(16,185,129,0.35)', letterSpacing: '0.02em'
          }}>
            <Inbox size={18}/> Confirm Receipt & Update Stock
          </button>
        )}
      </div>
    </div>
  );
}

function InfoBox({ label, value, color, highlight }) {
  return (
    <div style={{
      background: highlight ? `rgba(8,145,178,0.07)` : '#f8fafc', borderRadius: 8, padding: '10px 12px',
      border: highlight ? '1px solid #bae6fd' : '1px solid #f1f5f9', textAlign: 'center'
    }}>
      <div style={{ fontSize: 19, fontWeight: 900, color: color || '#0f172a' }}>{value ?? '—'}</div>
      <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600, marginTop: 2 }}>{label}</div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 6, marginBottom: 6, borderBottom: '1px solid #f1f5f9', color: '#334155' }}>
      <span style={{ color: '#64748b', fontWeight: 600 }}>{label}</span>
      <span style={{ fontWeight: 700 }}>{value}</span>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────
export default function StoreInventoryView() {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('store_stock');
  const [storeStock, setStoreStock] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [msg, setMsg] = useState({ type: '', text: '' });

  const [reqModal, setReqModal] = useState({ open: false, item: null, qty: '', urgency: 'MEDIUM' });
  const [submittingReq, setSubmittingReq] = useState(false);
  const sigCanvas = useRef(null);

  const [receiveModal, setReceiveModal] = useState({ open: false, req: null, qty: '' });
  const [submittingReceive, setSubmittingReceive] = useState(false);

  // Auto-switch to receiving tab when coming from notification
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('tab') === 'my_requests') setActiveTab('my_requests');
  }, [location.search]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [invRes, reqRes] = await Promise.all([
        apiClient.get('/pharmacy/store-inventory'),
        apiClient.get('/transfer-requests')
      ]);
      setStoreStock(Array.isArray(invRes) ? invRes : (invRes.data || []));
      setMyRequests(Array.isArray(reqRes) ? reqRes : (reqRes.data || []));
    } catch (e) {
      setMsg({ type: 'error', text: 'Failed to load data.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const showMsg = (text, type = 'success') => {
    setMsg({ type, text });
    setTimeout(() => setMsg({ type: '', text: '' }), 6000);
  };

  const submitRequest = async () => {
    const qty = parseInt(reqModal.qty);
    if (!qty || qty <= 0) return showMsg('Quantity must be greater than 0', 'error');
    if (sigCanvas.current?.isEmpty()) return showMsg('Please provide your signature before submitting', 'error');
    const signature = sigCanvas.current.toDataURL();
    setSubmittingReq(true);
    try {
      await apiClient.post('/transfer-requests', {
        drug_id: reqModal.item.drug_id || reqModal.item.id,
        requested_qty: qty,
        urgency: reqModal.urgency,
        signature
      });
      showMsg('✅ Transfer request sent to CEO for approval', 'success');
      preloadedAudio.notification.play().catch(() => {});
      setReqModal({ open: false, item: null, qty: '', urgency: 'MEDIUM' });
      if (sigCanvas.current) sigCanvas.current.clear();
      loadData();
    } catch (e) {
      showMsg(e.message || 'Failed to submit request', 'error');
    } finally {
      setSubmittingReq(false);
    }
  };

  const submitReceive = async () => {
    const qty = parseInt(receiveModal.qty);
    if (isNaN(qty) || qty < 0) return showMsg('Please enter a valid quantity', 'error');
    setSubmittingReceive(true);
    try {
      await apiClient.patch(`/transfer-requests/${receiveModal.req.id}/receive`, { received_qty: qty });
      const isMatch = qty === Number(receiveModal.req.shipped_qty);
      if (isMatch) {
        showMsg(`✅ ${qty} units of "${receiveModal.req.drug_name}" received & added to Pharmacy stock!`, 'success');
        preloadedAudio.completed.play().catch(() => {});
        if ('Notification' in window) {
          const grant = Notification.permission === 'granted'
            ? true
            : (await Notification.requestPermission()) === 'granted';
          if (grant) new Notification('📦 Stock Received!', {
            body: `${qty} units of ${receiveModal.req.drug_name} added to Pharmacy inventory.`,
            icon: '/favicon.ico'
          });
        }
      } else {
        showMsg('⚠️ Quantity mismatch! Discrepancy reported to CEO for review.', 'error');
        preloadedAudio.rejected.play().catch(() => {});
      }
      setReceiveModal({ open: false, req: null, qty: '' });
      loadData();
    } catch (e) {
      showMsg(e.message || 'Failed to confirm receipt', 'error');
    } finally {
      setSubmittingReceive(false);
    }
  };

  const cancelRequest = async (id) => {
    if (!window.confirm('Cancel this pending request?')) return;
    try {
      await apiClient.patch(`/transfer-requests/${id}/cancel`);
      showMsg('Request cancelled', 'success');
      loadData();
    } catch (e) {
      showMsg(e.message || 'Failed to cancel', 'error');
    }
  };

  const filteredStock = storeStock.filter(d => !search || d.name?.toLowerCase().includes(search.toLowerCase()));
  const shippedRequests = myRequests.filter(r => r.status === 'SHIPPED');
  const otherRequests = myRequests.filter(r => r.status !== 'SHIPPED');

  return (
    <div style={{ padding: 28, fontFamily: "'Inter',sans-serif", color: '#1e293b', minHeight: '100vh', background: 'linear-gradient(135deg,#ecfeff 0%,#f0fdfa 50%,#f8fafc 100%)' }}>
      <style>{`
        @keyframes fadeSlide{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{100%{transform:rotate(360deg)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.6}}
        .tab-btn{padding:10px 20px;border-radius:8px;font-weight:700;font-size:14px;cursor:pointer;border:none;transition:all 0.2s;display:flex;align-items:center;gap:8px;}
        .tab-active{background:#0891b2;color:white;box-shadow:0 4px 12px rgba(8,145,178,0.2);}
        .tab-inactive{background:white;color:#64748b;border:1px solid #e2e8f0;}
        .tab-inactive:hover{background:#f1f5f9;color:#0f172a;}
      `}</style>

      {/* Toast */}
      {msg.text && (
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, padding: '14px 24px', borderRadius: 12, background: msg.type === 'success' ? '#d1fae5' : '#fef2f2', border: `1px solid ${msg.type === 'success' ? '#6ee7b7' : '#fecaca'}`, color: msg.type === 'success' ? '#065f46' : '#991b1b', fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', animation: 'fadeSlide 0.3s ease-out', maxWidth: 420 }}>
          {msg.type === 'success' ? <CheckCircle size={18}/> : <XCircle size={18}/>}
          {msg.text}
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: 28, animation: 'fadeSlide 0.4s ease-out' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg,#0891b2,#06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(8,145,178,0.3)' }}>
            <Database size={24} color="white"/>
          </div>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0, color: '#0f172a' }}>Transfer Requests</h1>
            <p style={{ color: '#64748b', margin: '2px 0 0 0', fontSize: 14 }}>Request stock from Store & confirm receipts</p>
          </div>
          <button onClick={loadData} disabled={loading} style={{ marginLeft: 'auto', padding: '10px 18px', background: 'white', border: '1px solid #e2e8f0', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
            <RefreshCw size={15} style={loading ? { animation: 'spin 1s linear infinite' } : {}}/>Refresh
          </button>
        </div>

        {/* Shipped alert banner */}
        {shippedRequests.length > 0 && activeTab !== 'my_requests' && (
          <div onClick={() => setActiveTab('my_requests')} style={{ background: 'linear-gradient(90deg,#0891b2,#06b6d4)', borderRadius: 10, padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginBottom: 8, animation: 'pulse 2s infinite' }}>
            <Truck size={20} color="white"/>
            <span style={{ color: 'white', fontWeight: 800 }}>
              {shippedRequests.length} shipment{shippedRequests.length > 1 ? 's' : ''} waiting to be received — Click here to receive
            </span>
            <ArrowRight size={18} color="white" style={{ marginLeft: 'auto' }}/>
          </div>
        )}

        <div style={{ display: 'flex', gap: 12, borderBottom: '1px solid #e2e8f0', paddingBottom: 16 }}>
          <button className={`tab-btn ${activeTab === 'store_stock' ? 'tab-active' : 'tab-inactive'}`} onClick={() => setActiveTab('store_stock')}>
            <Package size={16}/> Store Stock
          </button>
          <button className={`tab-btn ${activeTab === 'my_requests' ? 'tab-active' : 'tab-inactive'}`} onClick={() => setActiveTab('my_requests')}>
            <List size={16}/> My Shipment Tracking
            {shippedRequests.length > 0 && (
              <span style={{ background: '#ef4444', color: 'white', borderRadius: '50%', width: 20, height: 20, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800 }}>
                {shippedRequests.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ── STORE STOCK TAB ── */}
      {activeTab === 'store_stock' && (
        <div style={{ animation: 'fadeSlide 0.4s ease-out' }}>
          <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={17} color="#94a3b8" style={{ position: 'absolute', left: 14, top: 12, pointerEvents: 'none' }}/>
              <input type="text" placeholder="Search store items..." value={search} onChange={e => setSearch(e.target.value)}
                style={{ width: '100%', padding: '10px 16px 10px 42px', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: 14, outline: 'none', background: 'white', boxSizing: 'border-box' }}/>
            </div>
          </div>
          <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                  <th style={th}>Drug Name</th><th style={th}>Category</th><th style={th}>Store Stock</th><th style={th}>Unit</th><th style={th}>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} style={{ padding: 40, textAlign: 'center' }}><Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }}/></td></tr>
                ) : filteredStock.length === 0 ? (
                  <tr><td colSpan={5} style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>No items found.</td></tr>
                ) : filteredStock.map(item => {
                  const hasOpen = myRequests.some(r => r.drug_id === (item.drug_id || item.id) && ['PENDING_APPROVAL','APPROVED','SHIPPED'].includes(r.status));
                  return (
                    <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={td}><strong>{item.name}</strong></td>
                      <td style={td}>{item.category || '—'}</td>
                      <td style={td}><span style={{ color: (item.stock_quantity||0)<=0 ? '#ef4444':'#059669', fontWeight: 700 }}>{item.stock_quantity||0}</span></td>
                      <td style={td}>{item.unit || '—'}</td>
                      <td style={td}>
                        {hasOpen
                          ? <span style={{ padding: '4px 10px', background: '#fef3c7', color: '#92400e', borderRadius: 6, fontSize: 12, fontWeight: 600 }}>Pending to CEO</span>
                          : <button onClick={() => setReqModal({ open: true, item, qty: '', urgency: 'MEDIUM' })}
                              style={{ padding: '6px 14px', background: '#0891b2', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                              <Send size={13}/> Request Transfer
                            </button>
                        }
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── MY REQUESTS (4-STEP TRACKING) TAB ── */}
      {activeTab === 'my_requests' && (
        <div style={{ animation: 'fadeSlide 0.4s ease-out' }}>
          {loading && myRequests.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60 }}><Loader2 size={32} style={{ animation: 'spin 1s linear infinite' }}/></div>
          ) : myRequests.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>
              <Package size={48} style={{ opacity: 0.3, marginBottom: 12 }}/>
              <div style={{ fontWeight: 700 }}>No transfer requests yet.</div>
              <div style={{ fontSize: 13, marginTop: 4 }}>Go to "Store Stock" tab to request drugs from the store.</div>
            </div>
          ) : (
            <>
              {/* Shipped first */}
              {shippedRequests.length > 0 && (
                <div style={{ marginBottom: 8, fontSize: 13, fontWeight: 700, color: '#0891b2', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Truck size={15}/> AWAITING YOUR RECEIPT ({shippedRequests.length})
                </div>
              )}
              {shippedRequests.map(r => (
                <RequestCard key={r.id} r={r} onReceive={req => setReceiveModal({ open: true, req, qty: String(req.shipped_qty || '') })}/>
              ))}

              {otherRequests.length > 0 && shippedRequests.length > 0 && (
                <div style={{ marginTop: 24, marginBottom: 8, fontSize: 13, fontWeight: 700, color: '#64748b' }}>OTHER REQUESTS</div>
              )}
              {otherRequests.map(r => (
                <RequestCard key={r.id} r={r} onReceive={req => setReceiveModal({ open: true, req, qty: String(req.shipped_qty || '') })}/>
              ))}
            </>
          )}
        </div>
      )}

      {/* ── REQUEST MODAL ── */}
      {reqModal.open && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'white', borderRadius: 16, width: 460, maxWidth: '95%', overflow: 'hidden', animation: 'fadeSlide 0.2s ease-out' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
              <h3 style={{ margin: 0, fontSize: 18, color: '#0f172a' }}>Request Transfer from Store</h3>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>{reqModal.item?.name}</p>
            </div>
            <div style={{ padding: 24 }}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Quantity to Request</label>
                <input type="number" min="1" value={reqModal.qty} onChange={e => setReqModal({...reqModal, qty: e.target.value})}
                  style={{ width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: 8, outline: 'none', boxSizing: 'border-box' }} autoFocus/>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Urgency</label>
                <select value={reqModal.urgency} onChange={e => setReqModal({...reqModal, urgency: e.target.value})}
                  style={{ width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: 8, outline: 'none' }}>
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                </select>
              </div>
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                  <span>Digital Signature</span>
                  <button onClick={() => sigCanvas.current?.clear()} style={{ fontSize: 11, color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>Clear</button>
                </label>
                <div style={{ border: '2px dashed #cbd5e1', borderRadius: 8, background: '#f8fafc', overflow: 'hidden' }}>
                  <SignatureCanvas ref={sigCanvas} penColor="black" canvasProps={{ width: 410, height: 120 }}/>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={() => { setReqModal({open: false, item: null, qty: '', urgency: 'MEDIUM'}); sigCanvas.current?.clear(); }} style={{ flex: 1, padding: 12, background: '#f1f5f9', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
                <button onClick={submitRequest} disabled={submittingReq} style={{ flex: 1, padding: 12, background: '#0891b2', color: 'white', border: 'none', borderRadius: 8, cursor: submittingReq ? 'not-allowed' : 'pointer', fontWeight: 600 }}>
                  {submittingReq ? 'Submitting...' : 'Submit Request to CEO'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── RECEIVE MODAL ── */}
      {receiveModal.open && receiveModal.req && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'white', borderRadius: 20, width: 500, maxWidth: '95%', overflow: 'hidden', animation: 'fadeSlide 0.2s ease-out', boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>

            {/* Modal header */}
            <div style={{ background: 'linear-gradient(135deg, #059669, #10b981)', padding: '20px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ background: 'rgba(255,255,255,0.2)', padding: 8, borderRadius: '50%' }}><Inbox size={22} color="white"/></div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 18, color: 'white', fontWeight: 800 }}>Confirm Receipt & Update Stock</h3>
                  <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.8)' }}>Step 4 of 4 — Pharmacy Receiving</p>
                </div>
              </div>
            </div>

            <div style={{ padding: 24 }}>
              {/* Drug info */}
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: '14px 18px', marginBottom: 20 }}>
                <div style={{ fontSize: 20, fontWeight: 900, color: '#065f46' }}>{receiveModal.req.drug_name}</div>
                <div style={{ fontSize: 12, color: '#6b7280', fontFamily: 'monospace', marginTop: 2 }}>{receiveModal.req.request_code}</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginTop: 14 }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 22, fontWeight: 900, color: '#0891b2' }}>{receiveModal.req.requested_qty}</div>
                    <div style={{ fontSize: 10, color: '#64748b', fontWeight: 600 }}>REQUESTED</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 22, fontWeight: 900, color: '#10b981' }}>{receiveModal.req.shipped_qty}</div>
                    <div style={{ fontSize: 10, color: '#64748b', fontWeight: 600 }}>SHIPPED BY STORE</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 22, fontWeight: 900, color: '#f59e0b' }}>{receiveModal.req.pharmacy_qty_at_request ?? '—'}</div>
                    <div style={{ fontSize: 10, color: '#64748b', fontWeight: 600 }}>PHARMACY STOCK AT REQUEST</div>
                  </div>
                </div>
              </div>

              {/* Step tracker inside modal */}
              <StepTracker status="SHIPPED"/>
              <div style={{ height: 1, background: '#f1f5f9', margin: '16px 0' }}/>

              {/* Input */}
              <label style={{ display: 'block', fontSize: 14, fontWeight: 700, marginBottom: 8, color: '#0f172a' }}>
                Actual Quantity You Received
              </label>
              <input type="number" min="0" value={receiveModal.qty}
                onChange={e => setReceiveModal({...receiveModal, qty: e.target.value})}
                style={{ width: '100%', padding: '12px 16px', border: '2px solid #e2e8f0', borderRadius: 10, outline: 'none', fontSize: 16, fontWeight: 700, boxSizing: 'border-box' }}
                autoFocus placeholder="Enter count received from store"/>

              {receiveModal.qty !== '' && (
                parseInt(receiveModal.qty) === Number(receiveModal.req.shipped_qty) ? (
                  <div style={{ marginTop: 8, color: '#059669', fontSize: 13, display: 'flex', alignItems: 'center', gap: 5, fontWeight: 700 }}>
                    <Check size={14}/> Quantities match perfectly — stock will be added to Pharmacy inventory
                  </div>
                ) : (
                  <div style={{ marginTop: 8, color: '#ef4444', fontSize: 13, display: 'flex', alignItems: 'center', gap: 5, fontWeight: 600 }}>
                    <AlertTriangle size={14}/> Mismatch! This will create a discrepancy report for CEO review.
                  </div>
                )
              )}

              <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                <button onClick={() => setReceiveModal({open: false, req: null, qty: ''})} style={{ flex: 1, padding: 14, background: '#f1f5f9', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 700 }}>Cancel</button>
                <button onClick={submitReceive} disabled={submittingReceive || receiveModal.qty === ''} style={{ flex: 2, padding: 14, background: 'linear-gradient(90deg,#059669,#10b981)', color: 'white', border: 'none', borderRadius: 10, cursor: submittingReceive ? 'not-allowed' : 'pointer', fontWeight: 800, fontSize: 15 }}>
                  {submittingReceive ? 'Processing...' : '✅ Confirm & Update Pharmacy Stock'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const th = { padding: '12px 14px', textAlign: 'left', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', color: '#475569' };
const td = { padding: '14px', color: '#334155' };

function StatusBadge({ status }) {
  const map = {
    PENDING_APPROVAL: { bg: '#e0e7ff', text: '#4f46e5', label: '⏳ Pending CEO Approval' },
    APPROVED:         { bg: '#dbeafe', text: '#2563eb', label: '✅ Approved — Awaiting Store' },
    REJECTED:         { bg: '#fee2e2', text: '#dc2626', label: '❌ Rejected by CEO' },
    SHIPPED:          { bg: '#fef3c7', text: '#d97706', label: '🚚 Shipped — Awaiting Your Receipt' },
    COMPLETED:        { bg: '#d1fae5', text: '#059669', label: '✅ Received & Stocked' },
    CANCELLED:        { bg: '#f1f5f9', text: '#64748b', label: '🚫 Cancelled' },
    DISCREPANCY:      { bg: '#ffedd5', text: '#c2410c', label: '⚠️ Discrepancy — CEO Review' },
  };
  const c = map[status] || { bg: '#f1f5f9', text: '#64748b', label: status };
  return (
    <span style={{ background: c.bg, color: c.text, padding: '5px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap' }}>
      {c.label}
    </span>
  );
}
