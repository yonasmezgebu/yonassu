import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';

/* ── palette ── */
const G = {
  forest:'#228B22', dark:'#1B5E20', emerald:'#2E8B57', leaf:'#4CAF50',
  sage:'#A5D6A7', olive:'#6B8E23', mint:'#98FF98', lime:'#8BC34A',
  brown:'#8D6E63', sky:'#87CEEB', white:'#FFFFFF', lightGray:'#F5F5F5',
  darkGray:'#424242', orange:'#FF9800', red:'#F44336',
};

/* ── axios ── */
const api = axios.create();
api.interceptors.request.use(cfg => {
  const t = localStorage.getItem('token') || sessionStorage.getItem('token');
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});
const BASE_ASSETS = '/api/v1/printing-assets';

/* ══════════════════════════════════════════════════════════════
   GLOBAL STYLES
══════════════════════════════════════════════════════════════ */
const GS = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap');
    @keyframes fadeUp  { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
    @keyframes pulse3d { 0%,100%{box-shadow:6px 6px 0 ${G.dark}} 50%{box-shadow:8px 8px 0 ${G.dark}} }
    @keyframes toastIn { from{transform:translateX(120%);opacity:0} to{transform:translateX(0);opacity:1} }
    @keyframes spin    { to{transform:rotate(360deg)} }

    .ceo-pr-root *{ font-family:'Inter',sans-serif; box-sizing:border-box; }
    .ceo-pr-root { background:${G.lightGray}; min-height:100vh; }

    /* 3D Button */
    .btn3 {
      border:3px solid ${G.dark}; border-radius:0; font-weight:900; text-transform:uppercase;
      letter-spacing:1px; cursor:pointer; box-shadow:4px 4px 0 ${G.dark};
      transition:all .15s ease; display:inline-flex; align-items:center; justify-content:center; gap:6px;
    }
    .btn3:hover:not(:disabled) { transform:translate(-2px,-2px); box-shadow:6px 6px 0 ${G.dark}; }
    .btn3:active:not(:disabled){ transform:translate(4px,4px); box-shadow:0 0 0 ${G.dark}; }
    .btn3:disabled { opacity:.55; cursor:not-allowed; transform:translate(2px,2px); box-shadow:2px 2px 0 ${G.dark}; }

    /* 3D Card */
    .card3 {
      background:${G.white}; border:4px solid ${G.forest};
      box-shadow:8px 8px 0 ${G.dark}; animation:fadeUp .45s ease backwards;
    }

    /* Table */
    .tbl3 { width:100%; border-collapse:separate; border-spacing:0; background:${G.white}; border:4px solid ${G.dark}; box-shadow:8px 8px 0 ${G.dark}; }
    .tbl3 th { background:${G.dark}; color:#fff; padding:16px 18px; font-weight:900; text-transform:uppercase; letter-spacing:1px; font-size:11px; border-bottom:4px solid ${G.forest}; border-right:2px solid ${G.forest}; text-align:left; }
    .tbl3 th:last-child { border-right:none; }
    .tbl3 td { padding:18px; border-bottom:3px solid ${G.sage}; border-right:2px solid ${G.sage}; vertical-align:middle; font-size:13px; }
    .tbl3 td:last-child { border-right:none; }
    .tbl3 tr:last-child td { border-bottom:none; }
    .tbl3 tbody tr:hover td { background:${G.mint}22; }

    /* Tab */
    .tab-btn { border:3px solid transparent; border-radius:0; font-weight:900; text-transform:uppercase; letter-spacing:1px; cursor:pointer; padding:12px 22px; font-size:13px; transition:all .2s; background:transparent; color:${G.darkGray}; }
    .tab-btn.active { background:${G.dark}; color:#fff; border-color:${G.dark}; box-shadow:4px 4px 0 ${G.forest}; }
    .tab-btn:not(.active):hover { background:${G.sage}44; border-color:${G.sage}; }

    /* Status filter chip */
    .chip { border:2px solid transparent; border-radius:0; font-weight:800; text-transform:uppercase; font-size:11px; cursor:pointer; padding:6px 14px; transition:all .15s; }
    .chip.active { border-color:${G.dark}; box-shadow:3px 3px 0 ${G.dark}; }

    /* Input */
    .inp3 { border:3px solid ${G.forest}; border-radius:0; padding:12px 16px; font-size:14px; font-weight:700; outline:none; box-shadow:inset 2px 2px 0 rgba(0,0,0,.08),4px 4px 0 ${G.sage}; transition:all .2s; }
    .inp3:focus { border-color:${G.dark}; box-shadow:inset 2px 2px 0 rgba(0,0,0,.08),4px 4px 0 ${G.emerald}; }
  `}</style>
);

/* ══════════════════════════════════════════════════════════════
   TOAST
══════════════════════════════════════════════════════════════ */
const Toast = ({ toast }) => toast ? (
  <div style={{
    position:'fixed', bottom:40, right:40, zIndex:9999,
    background: toast.type==='success' ? G.forest : toast.type==='warn' ? G.orange : G.red,
    border:`3px solid ${G.dark}`, boxShadow:`6px 6px 0 ${G.dark}`,
    color:'#fff', fontWeight:900, fontSize:14, textTransform:'uppercase',
    padding:'18px 28px', display:'flex', gap:14, alignItems:'center',
    animation:'toastIn .3s ease', letterSpacing:1
  }}>
    <span style={{fontSize:22}}>{toast.type==='success'?'✅':toast.type==='warn'?'⚠️':'❌'}</span>
    <span>{toast.msg}</span>
  </div>
) : null;

/* ══════════════════════════════════════════════════════════════
   STATUS CONFIGS
══════════════════════════════════════════════════════════════ */
const MAT_STATUS = {
  PENDING:          { label:'AWAITING DECISION', bg:G.orange, color:'#fff' },
  APPROVED:         { label:'APPROVED',          bg:G.emerald, color:'#fff' },
  REJECTED:         { label:'REJECTED',          bg:G.red, color:'#fff' },
  SHIPPED:          { label:'SHIPPED',           bg:G.sky, color:G.darkGray },
  COMPLETED:        { label:'COMPLETED',         bg:G.forest, color:'#fff' },
  DISCREPANCY:      { label:'DISCREPANCY',       bg:'#F57F17', color:'#fff' },
  WAITING_PURCHASE: { label:'WAITING PURCHASE',  bg:G.brown, color:'#fff' },
  CANCELLED:        { label:'CANCELLED',         bg:G.darkGray, color:'#fff' },
};

const JOB_STATUS = {
  received:    { label:'Received',         dot:G.sky },
  in_queue:    { label:'In Queue',         dot:G.lime },
  in_design:   { label:'In Design',       dot:G.olive },
  file_check:  { label:'File Check',      dot:G.orange },
  in_printing: { label:'In Printing',     dot:G.emerald },
  in_progress: { label:'In Progress',     dot:G.leaf },
  finishing:   { label:'Finishing',       dot:G.forest },
  ready:       { label:'Ready Pickup',    dot:G.lime },
  delivered:   { label:'Delivered',       dot:G.dark },
  cancelled:   { label:'Cancelled',       dot:G.red },
};

const MatBadge = ({ status }) => {
  const c = MAT_STATUS[status] || { label:status, bg:G.lightGray, color:G.darkGray };
  return (
    <span style={{
      background:c.bg, color:c.color, padding:'5px 12px', fontWeight:900,
      fontSize:11, textTransform:'uppercase', letterSpacing:1,
      border:`2px solid ${G.dark}`, boxShadow:`2px 2px 0 ${G.dark}`, display:'inline-block'
    }}>{c.label}</span>
  );
};

const JobDot = ({ code }) => {
  const c = JOB_STATUS[code] || { label:code, dot:G.sage };
  return (
    <span style={{display:'inline-flex',alignItems:'center',gap:6}}>
      <span style={{width:10,height:10,borderRadius:'50%',background:c.dot,flexShrink:0,border:`1px solid ${G.dark}`,boxShadow:`1px 1px 0 ${G.dark}`}}/>
      <span style={{fontWeight:800,fontSize:12,color:G.darkGray,textTransform:'uppercase',letterSpacing:.5}}>{c.label}</span>
    </span>
  );
};

/* ══════════════════════════════════════════════════════════════
   REJECT MODAL
══════════════════════════════════════════════════════════════ */
const RejectModal = ({ request, onClose, onDone, showToast }) => {
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!reason.trim()) return showToast('error', 'Enter a rejection reason');
    setBusy(true);
    try {
      await api.post(`${BASE_ASSETS}/material-requests/${request.id}/decide`, { decision:'REJECTED', reason });
      showToast('success', 'Request rejected.');
      onDone(); onClose();
    } catch (e) { showToast('error', e.response?.data?.message || e.message); }
    setBusy(false);
  };

  return (
    <div style={{position:'fixed',inset:0,background:'rgba(27,94,32,.85)',zIndex:2000,overflowY:'auto',backdropFilter:'blur(4px)',padding:'40px 20px',display:'block'}}>
      <div className="card3" style={{width:520,maxWidth:'95vw',margin:'20px auto',padding:0}}>
        <div style={{background:G.dark,padding:'24px 32px',borderBottom:`4px solid ${G.red}`,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <h2 style={{margin:0,color:'#fff',fontSize:22,fontWeight:900,textTransform:'uppercase',letterSpacing:2}}>❌ Reject Request</h2>
          <button onClick={onClose} style={{background:G.red,color:'#fff',border:`2px solid ${G.dark}`,padding:'8px 16px',fontWeight:900,cursor:'pointer',boxShadow:`3px 3px 0 ${G.dark}`,borderRadius:0}}>✕</button>
        </div>
        <div style={{padding:36}}>
          <div style={{background:`${G.sage}33`,border:`3px solid ${G.sage}`,padding:'14px 20px',marginBottom:28,boxShadow:`4px 4px 0 ${G.dark}`}}>
            <div style={{fontSize:12,fontWeight:900,color:G.olive,textTransform:'uppercase',letterSpacing:1.5,marginBottom:4}}>Request</div>
            <div style={{fontSize:20,fontWeight:900,color:G.dark,textTransform:'uppercase'}}>{request.material_name}</div>
            <div style={{fontSize:14,fontWeight:700,color:G.darkGray,marginTop:4}}>{parseFloat(request.quantity_requested).toLocaleString()} {request.unit}</div>
          </div>
          <label style={{display:'block',marginBottom:28}}>
            <div style={{fontSize:13,fontWeight:900,color:G.dark,textTransform:'uppercase',letterSpacing:1.5,marginBottom:10}}>Reason for Rejection *</div>
            <textarea value={reason} onChange={e=>setReason(e.target.value)} rows={4} className="inp3"
              style={{width:'100%',resize:'vertical'}} placeholder="Explain the rejection reason…"/>
          </label>
          <div style={{display:'flex',gap:12,justifyContent:'flex-end'}}>
            <button className="btn3" onClick={onClose} style={{background:'#fff',color:G.darkGray,borderColor:G.darkGray,padding:'10px 20px',fontSize:13,boxShadow:`4px 4px 0 ${G.darkGray}`}}>CANCEL</button>
            <button className="btn3" onClick={submit} disabled={busy} style={{background:G.red,color:'#fff',padding:'10px 24px',fontSize:13}}>
              {busy ? '⏳ REJECTING…' : '❌ CONFIRM REJECT'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════
   MATERIAL REQUESTS PANEL (CEO)
══════════════════════════════════════════════════════════════ */
const MatPanel = ({ showToast }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [rejectModal, setRejectModal] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`${BASE_ASSETS}/material-requests`);
      setRequests(data.data || []);
    } catch { setRequests([]); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { const t = setInterval(load, 20000); return () => clearInterval(t); }, [load]);

  const approve = async (id) => {
    setBusyId(id);
    try {
      await api.post(`${BASE_ASSETS}/material-requests/${id}/decide`, { decision:'APPROVED' });
      showToast('success', '✅ Approved! Store Keeper notified.');
      load();
    } catch (e) { showToast('error', e.response?.data?.message || e.message); }
    setBusyId(null);
  };

  const pending     = requests.filter(r => r.status === 'PENDING').length;
  const discrepancy = requests.filter(r => r.status === 'DISCREPANCY').length;
  const waiting     = requests.filter(r => r.status === 'WAITING_PURCHASE').length;

  const TABS = [
    { key:'ALL',              label:`ALL (${requests.length})` },
    { key:'PENDING',          label:`⏳ PENDING (${pending})` },
    { key:'APPROVED',         label:'✅ APPROVED' },
    { key:'SHIPPED',          label:'📦 SHIPPED' },
    { key:'COMPLETED',        label:'✅ DONE' },
    { key:'DISCREPANCY',      label:`⚠ DISC. (${discrepancy})` },
    { key:'WAITING_PURCHASE', label:`🛒 WAITING (${waiting})` },
    { key:'REJECTED',         label:'❌ REJECTED' },
  ];

  const filtered = filter === 'ALL' ? requests : requests.filter(r => r.status === filter);

  return (
    <div>
      {/* Summary badges */}
      <div style={{display:'flex',gap:12,marginBottom:20,flexWrap:'wrap',alignItems:'center'}}>
        {pending>0     && <span style={{background:G.orange,color:'#fff',padding:'8px 18px',border:`2px solid ${G.dark}`,boxShadow:`3px 3px 0 ${G.dark}`,fontWeight:900,fontSize:12,textTransform:'uppercase',letterSpacing:1}}>⏳ {pending} PENDING DECISION</span>}
        {discrepancy>0 && <span style={{background:'#F57F17',color:'#fff',padding:'8px 18px',border:`2px solid ${G.dark}`,boxShadow:`3px 3px 0 ${G.dark}`,fontWeight:900,fontSize:12,textTransform:'uppercase',letterSpacing:1}}>⚠ {discrepancy} DISCREPANCY</span>}
        {waiting>0     && <span style={{background:G.brown,color:'#fff',padding:'8px 18px',border:`2px solid ${G.dark}`,boxShadow:`3px 3px 0 ${G.dark}`,fontWeight:900,fontSize:12,textTransform:'uppercase',letterSpacing:1}}>🛒 {waiting} WAITING PURCHASE</span>}
        <button className="btn3" onClick={load} style={{marginLeft:'auto',background:G.lime,color:G.dark,padding:'8px 18px',fontSize:12}}>🔄 REFRESH</button>
      </div>

      {/* Workflow strip */}
      <div style={{background:G.white,border:`3px solid ${G.dark}`,boxShadow:`5px 5px 0 ${G.dark}`,padding:'12px 20px',marginBottom:20,display:'flex',alignItems:'center',gap:14,flexWrap:'wrap',fontSize:12,fontWeight:900,textTransform:'uppercase',letterSpacing:1}}>
        <span style={{color:G.olive,borderRight:`2px solid ${G.sage}`,paddingRight:12}}>FLOW</span>
        {['📨 Supervisor','➜','✅ YOU APPROVE','➜','📦 STORE SHIPS','➜','📥 SUPERVISOR RECEIVES','➜','🏭 STOCK UP'].map((t,i)=>(
          <span key={i} style={{color:t==='➜'?G.sage:G.dark}}>{t}</span>
        ))}
        <span style={{marginLeft:'auto',color:G.brown,borderLeft:`2px solid ${G.sage}`,paddingLeft:12}}>🛒 No stock → Purchase notified</span>
      </div>

      {/* Tabs */}
      <div style={{display:'flex',gap:0,marginBottom:20,borderBottom:`4px solid ${G.dark}`,overflowX:'auto'}}>
        {TABS.map(t => (
          <button key={t.key} className={`tab-btn${filter===t.key?' active':''}`} onClick={()=>setFilter(t.key)}>{t.label}</button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div style={{textAlign:'center',padding:80}}>
          <SegmentedSpinner size={24} />
          <div style={{fontWeight:900,color:G.olive,textTransform:'uppercase',letterSpacing:2}}>Loading…</div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card3" style={{textAlign:'center',padding:80}}>
          <div style={{fontSize:60,marginBottom:16}}>📋</div>
          <div style={{fontWeight:900,fontSize:20,color:G.dark,textTransform:'uppercase',letterSpacing:2}}>No requests in this category.</div>
        </div>
      ) : (
        <div style={{overflowX:'auto'}}>
          <table className="tbl3">
            <thead>
              <tr>
                <th>Status / Code</th>
                <th>Material</th>
                <th>Qty Requested</th>
                <th>Store at Request</th>
                <th>Live Store</th>
                <th>Urgency</th>
                <th>Requested By</th>
                <th>Date</th>
                <th>Shipped / Received</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id} style={{background: MAT_STATUS[r.status]?.bg+'18' || 'transparent'}}>
                  <td>
                    <MatBadge status={r.status}/>
                    <div style={{fontSize:10,fontWeight:900,color:G.olive,textTransform:'uppercase',letterSpacing:1,marginTop:6}}>{r.request_code}</div>
                    {r.urgency && (
                      <div style={{marginTop:4,fontSize:10,fontWeight:900,color:r.urgency==='HIGH'?G.red:r.urgency==='MEDIUM'?G.orange:G.leaf,textTransform:'uppercase'}}>● {r.urgency}</div>
                    )}
                  </td>
                  <td>
                    <div style={{fontWeight:900,fontSize:15,color:G.dark,textTransform:'uppercase'}}>{r.material_name}</div>
                    <div style={{fontSize:11,color:G.olive,fontWeight:700,marginTop:2}}>{r.material_id}</div>
                  </td>
                  <td>
                    <div style={{fontWeight:900,fontSize:18,color:G.dark}}>{parseFloat(r.quantity_requested).toLocaleString()}</div>
                    <div style={{fontSize:12,color:G.olive,fontWeight:700}}>{r.unit}</div>
                  </td>
                  <td>
                    <div style={{fontWeight:800,fontSize:15,color: parseFloat(r.store_qty_at_request)<parseFloat(r.quantity_requested) ? G.red : G.dark}}>
                      {parseFloat(r.store_qty_at_request||0).toLocaleString()} {r.unit}
                    </div>
                    {parseFloat(r.store_qty_at_request)<parseFloat(r.quantity_requested) && (
                      <div style={{fontSize:10,fontWeight:900,color:G.red,marginTop:2,textTransform:'uppercase'}}>⚠ Insufficient</div>
                    )}
                  </td>
                  <td>
                    <div style={{fontWeight:800,fontSize:15,color:G.dark}}>{parseFloat(r.live_store_qty||0).toLocaleString()} {r.unit}</div>
                  </td>
                  <td>
                    <span style={{fontWeight:900,fontSize:13,color:r.urgency==='HIGH'?G.red:r.urgency==='MEDIUM'?G.orange:G.leaf,textTransform:'uppercase'}}>{r.urgency||'—'}</span>
                  </td>
                  <td>
                    <div style={{fontWeight:800,fontSize:13,color:G.dark}}>{r.created_by_name||'—'}</div>
                  </td>
                  <td>
                    <div style={{fontWeight:700,fontSize:12,color:G.darkGray}}>{r.created_at ? new Date(r.created_at).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}) : '—'}</div>
                    <div style={{fontSize:11,color:G.olive,marginTop:2}}>{r.created_at ? new Date(r.created_at).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'}) : ''}</div>
                  </td>
                  <td>
                    {r.quantity_shipped && <div style={{fontSize:12,fontWeight:800,color:G.sky}}>📦 {parseFloat(r.quantity_shipped).toLocaleString()} {r.unit}</div>}
                    {r.quantity_received && <div style={{fontSize:12,fontWeight:800,color:G.leaf,marginTop:4}}>📥 {parseFloat(r.quantity_received).toLocaleString()} {r.unit}</div>}
                    {r.notes && <div style={{fontSize:11,color:G.darkGray,marginTop:6,borderTop:`1px solid ${G.sage}`,paddingTop:4,maxWidth:180}}><b>Note:</b> {r.notes}</div>}
                    {r.rejection_reason && <div style={{fontSize:11,color:G.red,marginTop:4,fontWeight:800}}><b>Reason:</b> {r.rejection_reason}</div>}
                  </td>
                  <td>
                    <div style={{display:'flex',flexDirection:'column',gap:8,minWidth:120}}>
                      {(r.status==='PENDING'||r.status==='WAITING_PURCHASE') && (
                        <>
                          {r.status==='WAITING_PURCHASE' && (
                            <div style={{fontSize:10,color:G.brown,fontWeight:900,textTransform:'uppercase',marginBottom:2,lineHeight:1.4}}>No stock.<br/>Purchase notified.<br/>Approve anyway?</div>
                          )}
                          <button className="btn3" onClick={()=>approve(r.id)} disabled={busyId===r.id}
                            style={{background:G.forest,color:'#fff',padding:'8px 14px',fontSize:11}}>
                            {busyId===r.id?'⏳…':'✅ APPROVE'}
                          </button>
                          <button className="btn3" onClick={()=>setRejectModal(r)}
                            style={{background:'#fff',color:G.red,borderColor:G.red,padding:'6px 14px',fontSize:11,boxShadow:`3px 3px 0 ${G.red}`}}>
                            ❌ REJECT
                          </button>
                        </>
                      )}
                      {r.status==='DISCREPANCY' && (
                        <div style={{padding:'8px 12px',background:'#FFF9C4',border:`2px solid #F57F17`,boxShadow:`3px 3px 0 #F57F17`,fontSize:11,fontWeight:900,color:'#F57F17',textAlign:'center',textTransform:'uppercase'}}>
                          ⚠ Mismatch<br/>Manual Review
                        </div>
                      )}
                      {!['PENDING','WAITING_PURCHASE','DISCREPANCY'].includes(r.status) && (
                        <span style={{fontSize:11,color:G.sage,fontWeight:700}}>—</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {rejectModal && <RejectModal request={rejectModal} onClose={()=>setRejectModal(null)} onDone={load} showToast={showToast}/>}
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════
   PRINT JOBS PANEL (Live API)
══════════════════════════════════════════════════════════════ */
const JobsPanel = ({ showToast }) => {
  const [orders, setOrders]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [statusFilter, setStatus] = useState('');
  const [search, setSearch]     = useState('');
  const [page, setPage]         = useState(1);
  const [pagination, setPagination] = useState({totalPages:1,total:0});

  const load = useCallback(async (pg=1, st='', q='') => {
    setLoading(true);
    try {
      // Use the same apiClient as PrintingOrders (no /api/v1 prefix, handled by proxy/apiClient)
      const res = await api.get('/api/v1/printing/orders', { params:{ page:pg, limit:20, ...(st&&{status:st}), ...(q&&{search:q}) } });
      const d = res.data?.data || res.data || {};
      setOrders(d.orders || d.data || []);
      setPagination(d.pagination || {totalPages:1,total:0});
    } catch {
      // fallback without /api/v1 prefix
      try {
        const res2 = await api.get('/printing/orders', { params:{ page:pg, limit:20, ...(st&&{status:st}), ...(q&&{search:q}) } });
        const d = res2.data?.data || res2.data || {};
        setOrders(d.orders || d.data || []);
        setPagination(d.pagination || {totalPages:1,total:0});
      } catch { setOrders([]); }
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(page, statusFilter, search); }, [load, page, statusFilter]);

  const JOB_STATUSES = ['received','in_queue','in_design','file_check','in_printing','in_progress','finishing','ready','delivered','cancelled'];

  const total     = orders.length;
  const delivered = orders.filter(o=>o.status_code==='delivered'||o.status_name?.toLowerCase().includes('delivered')).length;
  const inProg    = orders.filter(o=>['in_printing','in_progress','in_design'].includes(o.status_code)).length;
  const pending   = orders.filter(o=>['received','in_queue','file_check'].includes(o.status_code)).length;

  return (
    <div>
      {/* KPI row */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16,marginBottom:24}}>
        {[
          {label:'Total Jobs',   val:pagination.total||total, bg:G.dark,      color:'#fff' },
          {label:'In Progress',  val:inProg,   bg:G.emerald,   color:'#fff' },
          {label:'In Queue',     val:pending,  bg:G.orange,    color:'#fff' },
          {label:'Delivered',    val:delivered, bg:G.leaf,     color:'#fff' },
        ].map(k => (
          <div key={k.label} className="card3" style={{background:k.bg,padding:'22px 24px',borderColor:G.dark,animation:'fadeUp .4s ease'}}>
            <div style={{fontSize:11,fontWeight:900,color:k.color,textTransform:'uppercase',letterSpacing:2,opacity:.8,marginBottom:8}}>{k.label}</div>
            <div style={{fontSize:36,fontWeight:900,color:k.color,lineHeight:1}}>{k.val}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{display:'flex',gap:12,marginBottom:20,flexWrap:'wrap',alignItems:'center'}}>
        <input className="inp3" value={search} onChange={e=>setSearch(e.target.value)} onKeyDown={e=>e.key==='Enter'&&load(1,statusFilter,search)}
          placeholder="Search order # or customer…" style={{flex:1,minWidth:220}} />
        <select className="inp3" value={statusFilter} onChange={e=>{setStatus(e.target.value);setPage(1);}}>
          <option value="">All Statuses</option>
          {JOB_STATUSES.map(s=><option key={s} value={s}>{JOB_STATUS[s]?.label||s}</option>)}
        </select>
        <button className="btn3" onClick={()=>load(1,statusFilter,search)} style={{background:G.emerald,color:'#fff',padding:'12px 20px',fontSize:13}}>🔍 SEARCH</button>
        <button className="btn3" onClick={()=>{setSearch('');setStatus('');setPage(1);load(1,'','');}} style={{background:G.white,color:G.dark,padding:'12px 20px',fontSize:13}}>🔄 RESET</button>
      </div>

      {/* Table */}
      {loading ? (
        <div style={{textAlign:'center',padding:80}}>
          <SegmentedSpinner size={24} />
          <div style={{fontWeight:900,color:G.olive,textTransform:'uppercase',letterSpacing:2}}>Loading Jobs…</div>
        </div>
      ) : orders.length === 0 ? (
        <div className="card3" style={{textAlign:'center',padding:80}}>
          <div style={{fontSize:60,marginBottom:16}}>🖨️</div>
          <div style={{fontWeight:900,fontSize:20,color:G.dark,textTransform:'uppercase',letterSpacing:2}}>No print jobs found.</div>
        </div>
      ) : (
        <>
          <div style={{overflowX:'auto'}}>
            <table className="tbl3">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Customer</th>
                  <th>Product / Specs</th>
                  <th>Amount (ETB)</th>
                  <th>Payment</th>
                  <th>Job Status</th>
                  <th>Due Date</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o,idx) => {
                  const isPendingPay = !o.payment_status || o.payment_status==='Pending';
                  return (
                    <tr key={o.id||idx}>
                      <td>
                        <div style={{fontWeight:900,color:G.dark,fontSize:15}}>{o.order_number||'—'}</div>
                        <div style={{fontSize:10,color:G.olive,marginTop:2}}>{o.id}</div>
                      </td>
                      <td>
                        <div style={{fontWeight:800,color:G.dark,fontSize:13}}>{o.customer_name||'Walk-in'}</div>
                        {o.customer_phone&&<div style={{fontSize:11,color:G.darkGray,marginTop:2}}>{o.customer_phone}</div>}
                      </td>
                      <td>
                        <div style={{fontWeight:800,color:G.dark,fontSize:13}}>{o.product_type||'—'}</div>
                        <div style={{fontSize:11,color:G.olive,marginTop:2}}>
                          {[o.paper_type,o.quantity&&`${o.quantity} copies`,o.pages_per_copy&&`${o.pages_per_copy}pp`,o.color_printing?'🎨 Color':'⬛ B&W'].filter(Boolean).join(' · ')}
                        </div>
                      </td>
                      <td>
                        <div style={{fontWeight:900,fontSize:17,color:G.emerald}}>{parseFloat(o.total_price||0).toLocaleString()}</div>
                      </td>
                      <td>
                        <span style={{
                          display:'inline-block', padding:'5px 12px', fontWeight:900, fontSize:11,
                          textTransform:'uppercase', letterSpacing:1,
                          background: isPendingPay ? G.orange : G.leaf,
                          color:'#fff', border:`2px solid ${G.dark}`, boxShadow:`2px 2px 0 ${G.dark}`
                        }}>
                          {o.payment_status||'Pending'}
                        </span>
                        {o.payment_reference && <div style={{fontSize:10,color:G.olive,marginTop:4,fontWeight:700}}>Ref: {o.payment_reference}</div>}
                      </td>
                      <td><JobDot code={o.status_code} /></td>
                      <td>
                        {o.due_date ? (
                          <div style={{fontWeight:700,fontSize:12,color:new Date(o.due_date)<new Date()?G.red:G.darkGray}}>
                            {new Date(o.due_date)<new Date()?'🔴 ':''}
                            {new Date(o.due_date).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'})}
                          </div>
                        ) : <span style={{color:G.sage}}>—</span>}
                      </td>
                      <td>
                        <div style={{fontSize:12,color:G.darkGray,fontWeight:600}}>
                          {o.created_at ? new Date(o.created_at).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}) : '—'}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {/* Pagination */}
          {pagination.totalPages>1 && (
            <div style={{display:'flex',justifyContent:'center',gap:12,marginTop:20,alignItems:'center'}}>
              <button className="btn3" onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page<=1}
                style={{background:G.white,color:G.dark,padding:'10px 20px',fontSize:13}}>◀ PREV</button>
              <span style={{fontWeight:900,fontSize:14,color:G.dark,textTransform:'uppercase',letterSpacing:1}}>PAGE {page} OF {pagination.totalPages}</span>
              <button className="btn3" onClick={()=>setPage(p=>Math.min(pagination.totalPages,p+1))} disabled={page>=pagination.totalPages}
                style={{background:G.white,color:G.dark,padding:'10px 20px',fontSize:13}}>NEXT ▶</button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════
   MAIN CEO PRINTING
══════════════════════════════════════════════════════════════ */
const CEOPrinting = () => {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const defaultTab = params.get('tab') === 'material' ? 'material' : 'jobs';

  const [activeTab, setActiveTab] = useState(defaultTab);
  const [toast, setToast]         = useState(null);
  const toastTimer = useRef(null);

  const showToast = (type, msg) => {
    clearTimeout(toastTimer.current);
    setToast({ type, msg });
    toastTimer.current = setTimeout(() => setToast(null), 4500);
  };

  // Sync tab if URL param changes
  useEffect(() => {
    const p = new URLSearchParams(location.search);
    if (p.get('tab') === 'material') setActiveTab('material');
  }, [location.search]);

  const TABS = [
    { key:'jobs',     label:'🖨️ PRINT JOBS'        },
    { key:'material', label:'📦 MATERIAL REQUESTS'  },
  ];

  return (
    <div className="ceo-pr-root">
      <GS />

      {/* ── Header ── */}
      <div style={{
        background:`linear-gradient(135deg,${G.dark} 0%,${G.forest} 100%)`,
        borderBottom:`6px solid ${G.lime}`, padding:'36px 56px',
        display:'flex', justifyContent:'space-between', alignItems:'center',
        boxShadow:`0 10px 30px ${G.dark}66`
      }}>
        <div>
          <h1 style={{margin:0,fontSize:'2.4rem',fontWeight:900,color:'#fff',textTransform:'uppercase',letterSpacing:2,textShadow:`4px 4px 0 ${G.dark}`}}>
            🖨️ PRINTING DEPARTMENT
          </h1>
          <div style={{fontSize:14,fontWeight:800,color:G.mint,textTransform:'uppercase',letterSpacing:4,marginTop:10}}>
            CEO Control Center · Monitor & Approve
          </div>
        </div>
        <div style={{fontSize:48,opacity:.3}}>🌿</div>
      </div>

      {/* ── Tab Bar ── */}
      <div style={{background:G.white,borderBottom:`4px solid ${G.dark}`,padding:'0 56px',display:'flex',gap:0,boxShadow:`0 4px 12px rgba(0,0,0,.1)`}}>
        {TABS.map(t => (
          <button key={t.key} className={`tab-btn${activeTab===t.key?' active':''}`} onClick={()=>setActiveTab(t.key)} style={{marginBottom:-4}}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Body ── */}
      <div style={{padding:'36px 56px'}}>
        {activeTab==='jobs'     && <JobsPanel     showToast={showToast} />}
        {activeTab==='material' && <MatPanel      showToast={showToast} />}
      </div>

      <Toast toast={toast} />
    </div>
  );
};

export default CEOPrinting;
