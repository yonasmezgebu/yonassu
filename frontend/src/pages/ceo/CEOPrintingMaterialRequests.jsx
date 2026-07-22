import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const G = {
  forest:'#228B22', dark:'#1B5E20', emerald:'#2E8B57', leaf:'#4CAF50',
  sage:'#A5D6A7', olive:'#6B8E23', lightGray:'#F5F5F5', darkGray:'#424242',
  orange:'#FF9800', red:'#F44336', purple:'#9C27B0', blue:'#2196F3',
  indigo:'#3F51B5', white:'#FFFFFF'
};

const BASE = '/api/v1/printing-assets';
const api = axios.create();
api.interceptors.request.use(cfg => {
  const t = localStorage.getItem('token') || sessionStorage.getItem('token');
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

const Btn = ({ children, color = G.emerald, onClick, disabled, small, outline }) => (
  <button onClick={onClick} disabled={disabled} style={{
    background: outline ? 'transparent' : `linear-gradient(135deg,${color},${color}cc)`,
    color: outline ? color : '#fff',
    border: outline ? `2px solid ${color}` : 'none',
    borderRadius: small ? 8 : 10, padding: small ? '5px 12px' : '9px 20px',
    fontWeight: 800, fontSize: small ? 12 : 13,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    boxShadow: outline ? 'none' : `0 3px 10px ${color}44`,
    transition: 'all 0.18s', whiteSpace: 'nowrap'
  }}>{children}</button>
);

const STATUS_CFG = {
  PENDING:          { label: '⏳ Awaiting Your Decision', bg: '#FFF3E0', color: G.orange, pill: true },
  APPROVED:         { label: '✅ Approved', bg: '#E8F5E9', color: G.dark },
  REJECTED:         { label: '❌ Rejected', bg: '#FFEBEE', color: G.red },
  SHIPPED:          { label: '📦 Shipped', bg: '#E3F2FD', color: G.indigo },
  COMPLETED:        { label: '✅ Completed', bg: '#E8F5E9', color: G.dark },
  DISCREPANCY:      { label: '⚠ Discrepancy — Review', bg: '#FFF9C4', color: '#F57F17', pill: true },
  WAITING_PURCHASE: { label: '🛒 Waiting Purchase', bg: '#EDE7F6', color: G.purple, pill: true },
  CANCELLED:        { label: '🚫 Cancelled', bg: '#ECEFF1', color: '#607D8B' },
};

const Badge = ({ status }) => {
  const cfg = STATUS_CFG[status] || { label: status, bg: '#eee', color: '#333' };
  return (
    <span style={{
      background: cfg.bg, color: cfg.color,
      padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 800,
      border: cfg.pill ? `1.5px solid ${cfg.color}44` : 'none'
    }}>{cfg.label}</span>
  );
};

// Reject modal
const RejectModal = ({ request, onClose, onDone }) => {
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    if (!reason.trim()) return alert('Please enter a rejection reason');
    setBusy(true);
    try {
      await api.post(`${BASE}/material-requests/${request.id}/decide`, { decision: 'REJECTED', reason });
      alert('Request rejected.');
      onDone(); onClose();
    } catch (e) { alert(e.response?.data?.message || e.message); }
    setBusy(false);
  };
  return (
    <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.55)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center' }}>
      <div style={{ background:'#fff',borderRadius:20,padding:28,width:420,maxWidth:'95vw',boxShadow:'0 20px 60px rgba(0,0,0,0.3)' }}>
        <h2 style={{ margin:'0 0 4px',color:G.red }}>❌ Reject Request</h2>
        <p style={{ margin:'0 0 18px',color:G.olive,fontSize:14 }}>{request.material_name} — {request.quantity_requested} units</p>
        <label style={{ display:'block',marginBottom:20 }}>
          <div style={{ fontSize:12,fontWeight:800,color:G.dark,marginBottom:6 }}>Reason for Rejection *</div>
          <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3}
            style={{ width:'100%',padding:'10px 14px',borderRadius:10,border:`2px solid ${G.red}55`,fontSize:13,resize:'vertical',outline:'none',boxSizing:'border-box' }}
            placeholder="Explain why this request is being rejected…" />
        </label>
        <div style={{ display:'flex',gap:12,justifyContent:'flex-end' }}>
          <Btn onClick={onClose} color={G.darkGray} outline small>Cancel</Btn>
          <Btn onClick={submit} disabled={busy} color={G.red}>{busy ? '⏳…' : '❌ Confirm Rejection'}</Btn>
        </div>
      </div>
    </div>
  );
};

const CEOPrintingMaterialRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [rejectModal, setRejectModal] = useState(null);
  const [busyApprove, setBusyApprove] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`${BASE}/material-requests`);
      setRequests(data.data || []);
    } catch { setRequests([]); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { const t = setInterval(load, 20000); return () => clearInterval(t); }, [load]);

  const approve = async (id) => {
    if (!window.confirm('Approve this material request?')) return;
    setBusyApprove(id);
    try {
      const { data } = await api.post(`${BASE}/material-requests/${id}/decide`, { decision: 'APPROVED' });
      alert(data.message || '✅ Approved! General Store Keeper has been notified.');
      load();
    } catch (e) { alert(e.response?.data?.message || e.message); }
    setBusyApprove(null);
  };

  const filtered = filter === 'ALL' ? requests : requests.filter(r => r.status === filter);
  const pendingCount = requests.filter(r => r.status === 'PENDING').length;
  const discrepancyCount = requests.filter(r => r.status === 'DISCREPANCY').length;
  const waitingCount = requests.filter(r => r.status === 'WAITING_PURCHASE').length;

  const tabs = [
    { key: 'ALL', label: 'All' },
    { key: 'PENDING', label: `⏳ Pending (${pendingCount})` },
    { key: 'APPROVED', label: '✅ Approved' },
    { key: 'SHIPPED', label: '📦 Shipped' },
    { key: 'COMPLETED', label: '✅ Done' },
    { key: 'DISCREPANCY', label: `⚠ Discrepancy (${discrepancyCount})` },
    { key: 'WAITING_PURCHASE', label: `🛒 Waiting (${waitingCount})` },
    { key: 'REJECTED', label: '❌ Rejected' },
  ];

  return (
    <div style={{ padding:24, background:G.lightGray, minHeight:'100vh', fontFamily:"'Inter',sans-serif" }}>
      {/* Header */}
      <div style={{ background:`linear-gradient(135deg,${G.dark},${G.forest})`, borderRadius:16, padding:'22px 28px', marginBottom:20, color:'#fff', boxShadow:`0 8px 24px ${G.dark}55`, display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={{ margin:0, fontSize:24, fontWeight:900 }}>🖨️ Printing Material Requests</h1>
          <p style={{ margin:'4px 0 0', opacity:.8, fontSize:14 }}>Approve or reject material requests from the Printing Supervisor. Auto-refreshes every 20s.</p>
        </div>
        <div style={{ display:'flex', gap:10, alignItems:'center', flexWrap:'wrap' }}>
          {pendingCount > 0    && <span style={{ background:G.orange,  color:'#fff', padding:'5px 14px', borderRadius:20, fontWeight:800, fontSize:12 }}>⏳ {pendingCount} Need Decision</span>}
          {discrepancyCount > 0 && <span style={{ background:'#F57F17', color:'#fff', padding:'5px 14px', borderRadius:20, fontWeight:800, fontSize:12 }}>⚠ {discrepancyCount} Discrepancy</span>}
          <Btn onClick={load} color={G.leaf} small>🔄 Refresh</Btn>
        </div>
      </div>

      {/* Flow Info */}
      <div style={{ background:'#fff', borderRadius:12, padding:'12px 20px', marginBottom:20, display:'flex', alignItems:'center', gap:12, flexWrap:'wrap', boxShadow:'0 2px 8px rgba(0,0,0,0.05)', fontSize:13, fontWeight:700 }}>
        <span style={{ color:G.olive, fontSize:11, fontWeight:800, textTransform:'uppercase' }}>Flow:</span>
        {['📨 Supervisor Requests','→','✅ You Approve/Reject','→','📦 Store Ships','→','📥 Supervisor Receives','→','🏭 Stock Updated'].map((t,i)=>(
          <span key={i} style={{ color: t==='→' ? G.sage : G.dark }}>{t}</span>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:8, marginBottom:20, overflowX:'auto', paddingBottom:4 }}>
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setFilter(tab.key)} style={{
            padding:'8px 16px', borderRadius:10, border:`2px solid ${filter===tab.key?G.forest:'transparent'}`,
            background: filter===tab.key ? '#fff' : G.sage+'44',
            color: filter===tab.key ? G.dark : G.darkGray,
            fontWeight:800, fontSize:12, cursor:'pointer', whiteSpace:'nowrap',
            boxShadow: filter===tab.key ? `0 2px 8px ${G.sage}88` : 'none'
          }}>{tab.label}</button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign:'center', padding:80, color:G.olive }}>⏳ Loading requests…</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign:'center', padding:80, background:'#fff', borderRadius:16, color:G.sage }}>
          <div style={{ fontSize:48, marginBottom:16 }}>📋</div>
          <div style={{ fontSize:18, fontWeight:700 }}>No requests found.</div>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {filtered.map(r => (
            <div key={r.id} style={{
              background:'#fff', borderRadius:16, padding:22,
              boxShadow:'0 4px 20px rgba(0,0,0,0.06)',
              borderLeft:`6px solid ${STATUS_CFG[r.status]?.color || G.sage}`
            }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:12 }}>
                <div style={{ flex:1 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:12, flexWrap:'wrap' }}>
                    <Badge status={r.status} />
                    <span style={{ fontSize:11, color:G.olive, fontWeight:800 }}>{r.request_code}</span>
                  </div>

                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))', gap:'8px 20px', background:G.lightGray, padding:14, borderRadius:10, marginBottom:10 }}>
                    <div>
                      <div style={{ fontSize:10,fontWeight:800,color:G.olive,textTransform:'uppercase',marginBottom:2 }}>Material</div>
                      <div style={{ fontWeight:800,fontSize:15,color:G.dark }}>{r.material_name}</div>
                      <div style={{ fontSize:11,color:G.olive }}>{r.material_id}</div>
                    </div>
                    <div>
                      <div style={{ fontSize:10,fontWeight:800,color:G.olive,textTransform:'uppercase',marginBottom:2 }}>Requested Qty</div>
                      <div style={{ fontWeight:800,fontSize:15,color:G.dark }}>{parseFloat(r.quantity_requested).toLocaleString()} <span style={{ fontSize:12 }}>{r.unit}</span></div>
                    </div>
                    <div>
                      <div style={{ fontSize:10,fontWeight:800,color:G.olive,textTransform:'uppercase',marginBottom:2 }}>Store Qty (at request)</div>
                      <div style={{ fontWeight:700,fontSize:13,color: parseFloat(r.store_qty_at_request) >= parseFloat(r.quantity_requested) ? G.dark : G.red }}>
                        {parseFloat(r.store_qty_at_request||0).toLocaleString()} {r.unit}
                        {parseFloat(r.store_qty_at_request) < parseFloat(r.quantity_requested) && <span style={{ fontSize:10,color:G.red,marginLeft:6 }}>⚠ Insufficient</span>}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize:10,fontWeight:800,color:G.olive,textTransform:'uppercase',marginBottom:2 }}>Live Store Now</div>
                      <div style={{ fontWeight:700,fontSize:13,color:G.dark }}>{parseFloat(r.live_store_qty||0).toLocaleString()} {r.unit}</div>
                    </div>
                    <div>
                      <div style={{ fontSize:10,fontWeight:800,color:G.olive,textTransform:'uppercase',marginBottom:2 }}>Urgency</div>
                      <div style={{ fontWeight:700,fontSize:13,color: r.urgency==='HIGH'?G.red:r.urgency==='MEDIUM'?G.orange:G.dark }}>{r.urgency}</div>
                    </div>
                    <div>
                      <div style={{ fontSize:10,fontWeight:800,color:G.olive,textTransform:'uppercase',marginBottom:2 }}>Requested By</div>
                      <div style={{ fontWeight:700,fontSize:13 }}>{r.created_by_name}</div>
                    </div>
                    <div>
                      <div style={{ fontSize:10,fontWeight:800,color:G.olive,textTransform:'uppercase',marginBottom:2 }}>Date</div>
                      <div style={{ fontWeight:700,fontSize:12 }}>{new Date(r.created_at).toLocaleString()}</div>
                    </div>
                    {r.quantity_shipped && (
                      <div>
                        <div style={{ fontSize:10,fontWeight:800,color:G.olive,textTransform:'uppercase',marginBottom:2 }}>Shipped</div>
                        <div style={{ fontWeight:700,fontSize:13,color:G.indigo }}>{parseFloat(r.quantity_shipped).toLocaleString()} {r.unit}</div>
                      </div>
                    )}
                    {r.quantity_received && (
                      <div>
                        <div style={{ fontSize:10,fontWeight:800,color:G.olive,textTransform:'uppercase',marginBottom:2 }}>Received</div>
                        <div style={{ fontWeight:700,fontSize:13,color:r.status==='COMPLETED'?G.leaf:G.orange }}>{parseFloat(r.quantity_received).toLocaleString()} {r.unit}</div>
                      </div>
                    )}
                  </div>

                  {r.notes && <div style={{ fontSize:13,color:G.darkGray,padding:'6px 10px',background:`${G.sage}22`,borderRadius:8,marginBottom:6 }}><strong>Note:</strong> {r.notes}</div>}
                  {r.rejection_reason && <div style={{ fontSize:13,color:G.red,padding:'6px 10px',background:'#FFEBEE',borderRadius:8 }}><strong>Rejection:</strong> {r.rejection_reason}</div>}
                </div>

                {/* Action buttons */}
                <div style={{ display:'flex', flexDirection:'column', gap:8, alignItems:'flex-end', minWidth:130 }}>
                  {r.status === 'PENDING' && (
                    <>
                      <Btn color={G.forest} onClick={() => approve(r.id)} disabled={busyApprove === r.id}>
                        {busyApprove === r.id ? '⏳ Approving…' : '✅ Approve'}
                      </Btn>
                      <Btn color={G.red} outline small onClick={() => setRejectModal(r)}>❌ Reject</Btn>
                    </>
                  )}
                  {r.status === 'WAITING_PURCHASE' && (
                    <>
                      <div style={{ fontSize:11,color:G.purple,fontWeight:800,textAlign:'right',marginBottom:4 }}>Stock unavailable.<br/>Purchase team notified.</div>
                      <Btn color={G.forest} onClick={() => approve(r.id)} disabled={busyApprove === r.id} small>
                        {busyApprove === r.id ? '⏳…' : '✅ Approve Anyway'}
                      </Btn>
                      <Btn color={G.red} outline small onClick={() => setRejectModal(r)}>❌ Reject</Btn>
                    </>
                  )}
                  {r.status === 'DISCREPANCY' && (
                    <div style={{ padding:'8px 12px',background:'#FFF9C4',borderRadius:10,fontSize:12,fontWeight:700,color:'#F57F17',textAlign:'center' }}>
                      ⚠ Quantity mismatch.<br/>Manual review required.
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {rejectModal && (
        <RejectModal request={rejectModal} onClose={() => setRejectModal(null)} onDone={load} />
      )}
    </div>
  );
};

export default CEOPrintingMaterialRequests;
