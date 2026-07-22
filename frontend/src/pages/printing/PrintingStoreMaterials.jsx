import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const G = {
  forest: '#228B22', dark: '#1B5E20', emerald: '#2E8B57', leaf: '#4CAF50',
  sage: '#A5D6A7', olive: '#6B8E23', lime: '#8BC34A', mint: '#98FF98',
  brown: '#8D6E63', sky: '#87CEEB', white: '#FFFFFF', lightGray: '#F5F5F5',
  darkGray: '#424242', orange: '#FF9800', red: '#F44336'
};

const BASE = '/api/v1/printing-assets';
const api = axios.create();
api.interceptors.request.use(cfg => {
  const t = localStorage.getItem('token') || sessionStorage.getItem('token');
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

const GlobalStyles = () => (
  <style>{`
    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes slideIn {
      from { transform: translateX(-20px); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    @keyframes toastSlide {
      from { transform: translateX(120%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    
    .page-container {
      margin: -24px;
      padding: 0;
      min-height: calc(100vh + 24px);
      width: calc(100% + 48px);
      background: ${G.lightGray};
      font-family: 'Inter', sans-serif;
      position: relative;
      overflow-x: hidden;
    }
    
    .btn-3d {
      border-radius: 0;
      border: 3px solid ${G.dark};
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 1px;
      cursor: pointer;
      box-shadow: 4px 4px 0 ${G.dark};
      transition: all 0.15s ease;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }
    .btn-3d:hover:not(:disabled) {
      transform: translate(-2px, -2px);
      box-shadow: 6px 6px 0 ${G.dark};
    }
    .btn-3d:active:not(:disabled) {
      transform: translate(4px, 4px);
      box-shadow: 0px 0px 0 ${G.dark};
    }
    .btn-3d:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      box-shadow: 2px 2px 0 ${G.dark};
      transform: translate(2px, 2px);
    }
    
    .card-3d {
      background: ${G.white};
      border-radius: 0;
      border: 4px solid ${G.forest};
      box-shadow: 8px 8px 0 ${G.dark};
      animation: fadeUp 0.5s ease backwards;
    }
    
    .input-3d {
      border-radius: 0;
      border: 3px solid ${G.forest};
      box-shadow: inset 2px 2px 0 rgba(0,0,0,0.1), 4px 4px 0 ${G.sage};
      outline: none;
      transition: all 0.2s;
    }
    .input-3d:focus {
      border-color: ${G.dark};
      box-shadow: inset 2px 2px 0 rgba(0,0,0,0.1), 4px 4px 0 ${G.emerald};
    }

    .header-3d-text {
      font-size: 3rem;
      font-weight: 900;
      color: ${G.white};
      text-transform: uppercase;
      letter-spacing: 2px;
      text-shadow: 4px 4px 0 ${G.dark}, 8px 8px 15px rgba(0,0,0,0.3);
      margin: 0;
      line-height: 1.1;
    }

    /* Table Styles */
    .table-3d {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0;
      background: ${G.white};
      border: 4px solid ${G.dark};
      box-shadow: 8px 8px 0 ${G.dark};
      animation: fadeUp 0.5s ease backwards;
    }
    .table-3d th {
      background: ${G.dark};
      color: ${G.white};
      padding: 16px 20px;
      text-align: left;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 1px;
      border-bottom: 4px solid ${G.forest};
      border-right: 2px solid ${G.forest};
    }
    .table-3d th:last-child {
      border-right: none;
    }
    .table-3d td {
      padding: 20px;
      border-bottom: 3px solid ${G.sage};
      border-right: 2px solid ${G.sage};
      vertical-align: top;
    }
    .table-3d td:last-child {
      border-right: none;
    }
    .table-3d tr:last-child td {
      border-bottom: none;
    }
    .table-3d tr:hover td {
      background-color: ${G.mint}22;
    }
  `}</style>
);

const Btn = ({ children, color = G.emerald, onClick, disabled, small, outline, textColor = G.white, style }) => (
  <button
    className="btn-3d"
    onClick={onClick}
    disabled={disabled}
    style={{
      background: outline ? G.white : color,
      color: outline ? color : textColor,
      borderColor: outline ? color : G.dark,
      padding: small ? '8px 16px' : '14px 28px',
      fontSize: small ? 12 : 15,
      boxShadow: `4px 4px 0 ${outline ? color : G.dark}`,
      ...style
    }}
  >
    {children}
  </button>
);

const STATUS_CFG = {
  PENDING:          { label: 'WAITING APPROVAL', bg: G.orange, color: G.white },
  APPROVED:         { label: 'CEO APPROVED', bg: G.emerald, color: G.white },
  REJECTED:         { label: 'REJECTED', bg: G.red, color: G.white },
  SHIPPED:          { label: 'SHIPPED - RECEIVE NOW', bg: G.sky, color: G.darkGray },
  COMPLETED:        { label: 'COMPLETED', bg: G.forest, color: G.white },
  DISCREPANCY:      { label: 'DISCREPANCY', bg: G.orange, color: G.darkGray },
  WAITING_PURCHASE: { label: 'WAITING PURCHASE', bg: G.brown, color: G.white },
  CANCELLED:        { label: 'CANCELLED', bg: G.darkGray, color: G.white },
};

const Badge = ({ status }) => {
  const cfg = STATUS_CFG[status] || { label: status, bg: G.lightGray, color: G.darkGray };
  return (
    <span style={{
      background: cfg.bg, color: cfg.color, padding: '6px 14px',
      fontSize: 12, fontWeight: 900, textTransform: 'uppercase',
      border: `2px solid ${G.dark}`, boxShadow: `2px 2px 0 ${G.dark}`,
      letterSpacing: 1, display: 'inline-block'
    }}>
      {cfg.label}
    </span>
  );
};

// ── Request Modal ──────────────────────────────────────────────────────────────
const RequestModal = ({ mat, onClose, onSubmit, showToast }) => {
  const [qty, setQty] = useState('');
  const [urgency, setUrgency] = useState('MEDIUM');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  
  const storeQty = parseFloat(mat.quantity_in_store || 0);
  const requested = parseFloat(qty) || 0;
  const willWait = requested > storeQty;

  const submit = async () => {
    if (!qty || parseFloat(qty) <= 0) return showToast('error', 'Enter a valid quantity');
    setBusy(true);
    try {
      await api.post(`${BASE}/material-requests`, {
        material_id: mat.material_id, quantity_requested: parseFloat(qty), urgency, notes
      });
      showToast('success', 'Request submitted successfully!');
      onSubmit();
      onClose();
    } catch (e) { showToast('error', e.response?.data?.message || e.message); }
    setBusy(false);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(27,94,32,0.85)', zIndex: 1000, overflowY: 'auto', backdropFilter: 'blur(5px)', padding: '40px 20px', display: 'block' }}>
      <div className="card-3d" style={{ width: 600, maxWidth: '95vw', padding: 0, margin: '20px auto' }}>
        
        <div style={{ background: G.dark, padding: '24px 32px', borderBottom: `4px solid ${G.forest}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, color: G.white, fontSize: 24, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 2 }}>📦 Request Material</h2>
          <button onClick={onClose} style={{ background: G.red, color: G.white, border: `2px solid ${G.dark}`, padding: '8px 16px', fontWeight: 900, cursor: 'pointer', boxShadow: `3px 3px 0 ${G.dark}`, borderRadius: 0 }}>✕ CANCEL</button>
        </div>

        <div style={{ padding: 40 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 30 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 900, color: G.olive, textTransform: 'uppercase', letterSpacing: 2 }}>{mat.material_id}</div>
              <div style={{ fontSize: 28, fontWeight: 900, color: G.dark, textTransform: 'uppercase' }}>{mat.material_name}</div>
            </div>
            <div style={{ background: G.sage, padding: '8px 16px', border: `2px solid ${G.dark}`, boxShadow: `3px 3px 0 ${G.dark}`, fontWeight: 900, color: G.dark, textTransform: 'uppercase' }}>
              {mat.category}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 30 }}>
            <div style={{ background: G.mint, padding: 20, border: `3px solid ${G.dark}`, boxShadow: `4px 4px 0 ${G.dark}` }}>
              <div style={{ fontSize: 12, fontWeight: 900, color: G.dark, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Available Store Stock</div>
              <div style={{ fontSize: 32, fontWeight: 900, color: storeQty > 0 ? G.forest : G.red }}>{storeQty.toLocaleString()} <span style={{ fontSize: 16 }}>{mat.unit}</span></div>
            </div>
            <div style={{ background: G.lightGray, padding: 20, border: `3px solid ${G.dark}`, boxShadow: `4px 4px 0 ${G.dark}` }}>
              <div style={{ fontSize: 12, fontWeight: 900, color: G.dark, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Reorder Level</div>
              <div style={{ fontSize: 32, fontWeight: 900, color: G.darkGray }}>{mat.reorder_level || 0}</div>
            </div>
          </div>

          {willWait && (
            <div style={{ background: G.orange, color: G.white, padding: '16px 20px', border: `3px solid ${G.dark}`, boxShadow: `4px 4px 0 ${G.dark}`, fontWeight: 900, marginBottom: 30, fontSize: 14, textTransform: 'uppercase', letterSpacing: 1, display: 'flex', gap: 12, alignItems: 'center' }}>
              <span style={{ fontSize: 24 }}>⚠️</span>
              Stock insufficient. Request will go to WAITING PURCHASE and notify procurement.
            </div>
          )}

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 900, color: G.dark, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 10 }}>Quantity to Request ({mat.unit})</label>
            <input type="number" min="0.01" step="0.01" value={qty} onChange={e => setQty(e.target.value)} className="input-3d" style={{ width: '100%', padding: '16px 20px', fontSize: 20, fontWeight: 900, boxSizing: 'border-box' }} placeholder="0" />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 900, color: G.dark, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 10 }}>Urgency</label>
            <select value={urgency} onChange={e => setUrgency(e.target.value)} className="input-3d" style={{ width: '100%', padding: '16px 20px', fontSize: 16, fontWeight: 900, cursor: 'pointer', textTransform: 'uppercase' }}>
              <option value="LOW">LOW</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="HIGH">HIGH (URGENT)</option>
            </select>
          </div>

          <div style={{ marginBottom: 40 }}>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 900, color: G.dark, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 10 }}>Notes (Optional)</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} className="input-3d" style={{ width: '100%', padding: '16px 20px', fontSize: 14, fontWeight: 700, resize: 'vertical', boxSizing: 'border-box' }} placeholder="Job reference, purpose..." />
          </div>

          <Btn onClick={submit} disabled={busy} color={willWait ? G.brown : G.forest} outline={false} style={{ width: '100%' }}>
            {busy ? '⏳ SUBMITTING...' : willWait ? '🛒 REQUEST (REQUIRES PURCHASE)' : '📨 SEND TO CEO FOR APPROVAL'}
          </Btn>
        </div>
      </div>
    </div>
  );
};

// ── Receive Modal ─────────────────────────────────────────────────────────────
const ReceiveModal = ({ request, onClose, onDone, showToast }) => {
  const [qty, setQty] = useState(String(request.quantity_shipped || ''));
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    try {
      await api.post(`${BASE}/material-requests/${request.id}/receive`, { received_qty: parseFloat(qty) });
      showToast('success', 'Receipt confirmed!');
      onDone();
      onClose();
    } catch (e) { showToast('error', e.response?.data?.message || e.message); }
    setBusy(false);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(27,94,32,0.85)', zIndex: 1000, overflowY: 'auto', backdropFilter: 'blur(5px)', padding: '40px 20px', display: 'block' }}>
      <div className="card-3d" style={{ width: 500, maxWidth: '95vw', padding: 0, margin: '20px auto' }}>
        
        <div style={{ background: G.dark, padding: '24px 32px', borderBottom: `4px solid ${G.sky}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, color: G.white, fontSize: 24, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 2 }}>📥 Confirm Receipt</h2>
          <button onClick={onClose} style={{ background: G.red, color: G.white, border: `2px solid ${G.dark}`, padding: '8px 16px', fontWeight: 900, cursor: 'pointer', boxShadow: `3px 3px 0 ${G.dark}`, borderRadius: 0 }}>✕ CANCEL</button>
        </div>

        <div style={{ padding: 40 }}>
          <div style={{ fontSize: 14, fontWeight: 900, color: G.olive, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8 }}>{request.request_code}</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: G.dark, textTransform: 'uppercase', marginBottom: 30 }}>{request.material_name}</div>
          
          <div style={{ background: G.mint, padding: 20, border: `3px solid ${G.dark}`, boxShadow: `4px 4px 0 ${G.dark}`, marginBottom: 30 }}>
            <div style={{ fontSize: 12, fontWeight: 900, color: G.dark, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Quantity Shipped by Store</div>
            <div style={{ fontSize: 32, fontWeight: 900, color: G.forest }}>{request.quantity_shipped} <span style={{ fontSize: 16 }}>{request.unit}</span></div>
          </div>

          <div style={{ marginBottom: 30 }}>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 900, color: G.dark, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 10 }}>Quantity Actually Received</label>
            <input type="number" min="0" step="0.01" value={qty} onChange={e => setQty(e.target.value)} className="input-3d" style={{ width: '100%', padding: '16px 20px', fontSize: 24, fontWeight: 900, boxSizing: 'border-box' }} />
            {parseFloat(qty) !== parseFloat(request.quantity_shipped) && qty && (
              <div style={{ marginTop: 12, color: G.white, background: G.orange, padding: '10px 14px', border: `2px solid ${G.dark}`, fontWeight: 900, fontSize: 12, textTransform: 'uppercase', boxShadow: `2px 2px 0 ${G.dark}` }}>
                ⚠ Mismatch: A discrepancy will be flagged for CEO review.
              </div>
            )}
          </div>

          <Btn onClick={submit} disabled={busy} color={G.sky} textColor={G.darkGray} outline={false} style={{ width: '100%' }}>
            {busy ? '⏳ CONFIRMING...' : '✅ CONFIRM RECEIPT NOW'}
          </Btn>
        </div>
      </div>
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────
const PrintingStoreMaterials = () => {
  const [materials, setMaterials] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [requestModal, setRequestModal] = useState(null);
  const [receiveModal, setReceiveModal] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (type, msg) => { setToast({ type, msg }); setTimeout(() => setToast(null), 4500); };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [mRes, rRes] = await Promise.all([
        api.get(`${BASE}/store/materials?department=Printing`),
        api.get(`${BASE}/material-requests`).catch(() => ({ data: { data: [] } }))
      ]);
      setMaterials(mRes.data.data || []);
      setRequests(rRes.data.data || []);
    } catch { setMaterials([]); setRequests([]); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { const t = setInterval(load, 30000); return () => clearInterval(t); }, [load]);

  const activeReqMap = {};
  requests.forEach(r => {
    if (!['COMPLETED', 'REJECTED', 'CANCELLED'].includes(r.status)) {
      activeReqMap[r.material_id] = r;
    }
  });

  const pending = requests.filter(r => r.status === 'PENDING').length;
  const shipped = requests.filter(r => r.status === 'SHIPPED').length;
  const waiting = requests.filter(r => r.status === 'WAITING_PURCHASE').length;

  return (
    <div className="page-container">
      <GlobalStyles />

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Header Block */}
        <div style={{ background: `linear-gradient(135deg, ${G.dark} 0%, ${G.forest} 100%)`, borderBottom: `6px solid ${G.lime}`, padding: '40px 60px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: `0 10px 30px ${G.dark}66` }}>
          <div>
            <h1 className="header-3d-text">STORE MATERIALS</h1>
            <div style={{ fontSize: 16, fontWeight: 800, color: G.mint, textTransform: 'uppercase', letterSpacing: 4, marginTop: 12 }}>Printing Department Hub</div>
          </div>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            {pending > 0 && <div style={{ background: G.orange, color: G.white, border: `3px solid ${G.dark}`, padding: '10px 20px', fontWeight: 900, boxShadow: `4px 4px 0 ${G.dark}`, textTransform: 'uppercase' }}>⏳ {pending} PENDING CEO</div>}
            {shipped > 0 && <div style={{ background: G.sky, color: G.dark, border: `3px solid ${G.dark}`, padding: '10px 20px', fontWeight: 900, boxShadow: `4px 4px 0 ${G.dark}`, textTransform: 'uppercase' }}>📦 {shipped} SHIPPED</div>}
            {waiting > 0 && <div style={{ background: G.brown, color: G.white, border: `3px solid ${G.dark}`, padding: '10px 20px', fontWeight: 900, boxShadow: `4px 4px 0 ${G.dark}`, textTransform: 'uppercase' }}>🛒 {waiting} WAITING</div>}
            <Btn onClick={load} color={G.lime} textColor={G.dark}>🔄 SYNC DATA</Btn>
          </div>
        </div>

        {/* Workflow Strip */}
        <div style={{ background: G.white, borderBottom: `4px solid ${G.dark}`, padding: '20px 60px', display: 'flex', alignItems: 'center', gap: 24, boxShadow: `0 6px 15px rgba(0,0,0,0.1)`, animation: 'slideIn 0.4s ease' }}>
          <div style={{ fontSize: 14, fontWeight: 900, color: G.dark, textTransform: 'uppercase', letterSpacing: 2, borderRight: `3px solid ${G.sage}`, paddingRight: 24 }}>Workflow</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', fontSize: 12, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1 }}>
            {[
              ['📨 Request', G.forest], ['➜', G.sage],
              ['✅ CEO Approve', G.dark], ['➜', G.sage],
              ['📦 Store Ships', G.sky], ['➜', G.sage],
              ['📥 You Receive', G.leaf], ['➜', G.sage],
              ['🏭 Stock Updated', G.emerald],
            ].map(([t, c], i) => (
              <span key={i} style={{ color: c, padding: t === '➜' ? '0' : '8px 12px', background: t === '➜' ? 'transparent' : `${c}15`, border: t === '➜' ? 'none' : `2px solid ${c}` }}>{t}</span>
            ))}
          </div>
        </div>

        {/* Main Content Area */}
        <div style={{ padding: '40px 60px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '100px 0' }}>
              <div style={{ fontSize: 20, fontWeight: 900, color: G.forest, textTransform: 'uppercase', letterSpacing: 4 }}>Loading Natural Resources...</div>
            </div>
          ) : materials.length === 0 ? (
            <div className="card-3d" style={{ textAlign: 'center', padding: 80 }}>
              <div style={{ fontSize: 80, marginBottom: 20 }}>📦</div>
              <div style={{ fontSize: 24, fontWeight: 900, color: G.dark, textTransform: 'uppercase', letterSpacing: 2 }}>No materials assigned to Printing.</div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="table-3d">
                <thead>
                  <tr>
                    <th>Material ID / Name</th>
                    <th>Category</th>
                    <th>Store Stock</th>
                    <th>Unit Value</th>
                    <th>Active Request Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {materials.map((m, i) => {
                    const activeReq = activeReqMap[m.material_id];
                    const low = parseFloat(m.quantity_in_store) <= parseFloat(m.reorder_level || 0);
                    const storeQty = parseFloat(m.quantity_in_store || 0);

                    const canRequest = !activeReq;
                    const canReceive = activeReq && activeReq.status === 'SHIPPED';

                    return (
                      <tr key={m.id} style={{ background: activeReq ? `${STATUS_CFG[activeReq.status]?.bg}11` : 'transparent' }}>
                        
                        {/* ID & Name */}
                        <td>
                          <div style={{ fontSize: 11, fontWeight: 900, color: G.olive, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 4 }}>{m.material_id}</div>
                          <div style={{ fontSize: 18, fontWeight: 900, color: G.dark, textTransform: 'uppercase', lineHeight: 1.2 }}>{m.material_name}</div>
                        </td>

                        {/* Category */}
                        <td>
                          <div style={{ display: 'inline-block', background: G.dark, color: G.white, padding: '6px 12px', fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1, border: `2px solid ${G.dark}`, boxShadow: `2px 2px 0 ${G.olive}` }}>
                            {m.category}
                          </div>
                        </td>

                        {/* Stock */}
                        <td>
                          <div style={{ fontSize: 20, fontWeight: 900, color: low ? G.orange : G.forest }}>
                            {storeQty.toLocaleString()} <span style={{ fontSize: 12 }}>{m.unit}</span>
                          </div>
                          {low && <div style={{ fontSize: 10, fontWeight: 900, color: G.orange, marginTop: 4, textTransform: 'uppercase' }}>⚠ LOW (Min {m.reorder_level})</div>}
                        </td>

                        {/* Value */}
                        <td>
                          <div style={{ fontSize: 16, fontWeight: 900, color: G.olive }}>
                            ETB {parseFloat(m.unit_value || 0).toLocaleString()}
                          </div>
                        </td>

                        {/* Request Status */}
                        <td>
                          {activeReq ? (
                            <div>
                              <div style={{ marginBottom: 8 }}><Badge status={activeReq.status} /></div>
                              <div style={{ fontSize: 11, fontWeight: 700, color: G.darkGray, textTransform: 'uppercase', marginBottom: 4 }}>
                                Ref: <span style={{ fontWeight: 900 }}>{activeReq.request_code}</span>
                              </div>
                              <div style={{ fontSize: 11, fontWeight: 700, color: G.darkGray, textTransform: 'uppercase' }}>
                                Req: {activeReq.quantity_requested} {activeReq.unit}
                                {activeReq.quantity_shipped && ` | Ship: ${activeReq.quantity_shipped} ${activeReq.unit}`}
                              </div>
                              {activeReq.rejection_reason && !activeReq.status.includes('DISC') && (
                                <div style={{ marginTop: 8, padding: '4px 8px', background: G.red, color: G.white, fontSize: 10, fontWeight: 900, textTransform: 'uppercase', border: `1px solid ${G.dark}`, display: 'inline-block' }}>
                                  REASON: {activeReq.rejection_reason}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div style={{ fontSize: 12, fontWeight: 700, color: G.sage, textTransform: 'uppercase' }}>- None -</div>
                          )}
                        </td>

                        {/* Actions */}
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-start' }}>
                            {canRequest && (
                              <Btn small color={storeQty > 0 ? G.forest : G.brown} onClick={() => setRequestModal(m)} style={{ whiteSpace: 'nowrap' }}>
                                {storeQty > 0 ? '📨 REQUEST' : '🛒 REQ (PURCHASE)'}
                              </Btn>
                            )}
                            {canReceive && (
                              <Btn small color={G.sky} textColor={G.darkGray} onClick={() => setReceiveModal(activeReq)} style={{ whiteSpace: 'nowrap' }}>
                                📥 RECEIVE
                              </Btn>
                            )}
                            {activeReq && ['PENDING', 'WAITING_PURCHASE'].includes(activeReq.status) && (
                              <Btn small outline color={G.red} onClick={async () => {
                                if (!window.confirm('Cancel this request?')) return;
                                try {
                                  await api.post(`${BASE}/material-requests/${activeReq.id}/cancel`);
                                  showToast('success', 'Request cancelled.');
                                  load();
                                } catch (e) { showToast('error', e.response?.data?.message || e.message); }
                              }} style={{ whiteSpace: 'nowrap' }}>
                                🚫 CANCEL
                              </Btn>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {requestModal && <RequestModal mat={requestModal} onClose={() => setRequestModal(null)} onSubmit={load} showToast={showToast} />}
      {receiveModal && <ReceiveModal request={receiveModal} onClose={() => setReceiveModal(null)} onDone={load} showToast={showToast} />}

      {/* Toast */}
      {toast && (
        <div style={{ position:'fixed', bottom:40, right:40, background: toast.type==='success' ? G.forest : G.red, border:`3px solid ${G.dark}`, boxShadow:`6px 6px 0 ${G.dark}`, color:G.white, fontWeight:900, fontSize:14, textTransform:'uppercase', padding:'20px 30px', display:'flex', gap:16, alignItems:'center', animation:'toastSlide .3s ease', zIndex:10000, borderRadius:0, letterSpacing:1 }}>
          <span style={{ fontSize:24 }}>{toast.type==='success'?'✅':'❌'}</span>
          <span>{toast.msg}</span>
        </div>
      )}
    </div>
  );
};

export default PrintingStoreMaterials;
