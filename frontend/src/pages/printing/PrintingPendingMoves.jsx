import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const G = { forest:'#228B22',dark:'#1B5E20',emerald:'#2E8B57',leaf:'#4CAF50',sage:'#A5D6A7',olive:'#6B8E23',lime:'#8BC34A',brown:'#8D6E63',sky:'#87CEEB',white:'#FFFFFF',lightGray:'#F5F5F5',darkGray:'#424242',orange:'#FF9800',red:'#F44336' };
const BASE = '/api/v1/printing-assets';
const api  = axios.create();
api.interceptors.request.use(cfg => { const t = localStorage.getItem('token')||sessionStorage.getItem('token'); if(t) cfg.headers.Authorization=`Bearer ${t}`; return cfg; });

const Btn = ({children,color=G.emerald,onClick,disabled,small})=>(
  <button onClick={onClick} disabled={disabled} style={{background:`linear-gradient(135deg,${color},${color}cc)`,color:'#fff',border:'none',borderRadius:small?8:10,padding:small?'6px 14px':'10px 22px',fontWeight:800,fontSize:small?12:14,cursor:disabled?'not-allowed':'pointer',opacity:disabled?0.6:1,boxShadow:`0 4px 12px ${color}44`}}>{children}</button>
);

const PrintingPendingMoves = () => {
  const [moves, setMoves]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(null);

  const load = useCallback(async()=>{
    setLoading(true);
    try { const {data}=await api.get(`${BASE}/moves/pending`); setMoves(data.data||[]); } catch{setMoves([]);}
    setLoading(false);
  },[]);

  useEffect(()=>{ load(); },[load]);

  const approve = async(id)=>{
    if(!window.confirm('Approve this movement? This will update store & production records.')) return;
    setApproving(id);
    try {
      await api.post(`${BASE}/moves/${id}/approve`);
      alert('✅ Movement approved! Production records updated.');
      load();
    } catch(e) { alert(e.response?.data?.message||'Error approving'); }
    setApproving(null);
  };

  return (
    <div style={{padding:24,background:G.lightGray,minHeight:'100vh',fontFamily:"'Inter',sans-serif"}}>
      <div style={{background:`linear-gradient(135deg,${G.dark},${G.forest})`,borderRadius:16,padding:'22px 28px',marginBottom:24,color:'#fff',boxShadow:`0 8px 24px ${G.dark}55`,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <div>
          <h1 style={{margin:0,fontSize:24,fontWeight:900}}>✅ Pending Move Approvals</h1>
          <p style={{margin:'4px 0 0',opacity:.8,fontSize:14}}>Review and approve movement requests from the General Store Keeper</p>
        </div>
        <div style={{display:'flex',gap:12,alignItems:'center'}}>
          {moves.length>0 && <span style={{background:G.orange,color:'#fff',padding:'6px 16px',borderRadius:20,fontWeight:800,fontSize:14}}>{moves.length} Pending</span>}
          <Btn onClick={load} color={G.leaf}>🔄 Refresh</Btn>
        </div>
      </div>

      {loading ? <div style={{textAlign:'center',padding:60,color:G.olive}}>Loading…</div> :
        moves.length===0 ? (
          <div style={{textAlign:'center',padding:80,background:'#fff',borderRadius:16,color:G.sage}}>
            <div style={{fontSize:48,marginBottom:16}}>✅</div>
            <div style={{fontSize:18,fontWeight:700}}>No pending movement requests.</div>
            <div style={{fontSize:14,marginTop:8}}>All clear! The General Store Keeper hasn't submitted any new requests.</div>
          </div>
        ) : (
          <div>
            {moves.map(m=>(
              <div key={m.id} style={{background:'#fff',borderRadius:16,padding:24,marginBottom:16,boxShadow:'0 4px 20px rgba(0,0,0,0.06)',borderLeft:`6px solid ${m.item_type==='Machine'?G.forest:G.sky}`,display:'flex',justifyContent:'space-between',alignItems:'center',gap:20}}>
                <div style={{flex:1}}>
                  <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:12}}>
                    <span style={{background:m.item_type==='Machine'?`${G.forest}15`:`${G.sky}25`,color:m.item_type==='Machine'?G.forest:G.sky,padding:'4px 12px',borderRadius:20,fontSize:12,fontWeight:800}}>{m.item_type==='Machine'?'🔧 MACHINE':'📦 MATERIAL'}</span>
                    <span style={{fontWeight:900,fontSize:18,color:G.dark}}>{m.item_id}</span>
                  </div>
                  <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'8px 16px',background:G.lightGray,padding:14,borderRadius:10}}>
                    <div><div style={{fontSize:10,fontWeight:800,color:G.olive,textTransform:'uppercase',marginBottom:3}}>From</div><div style={{fontWeight:700,fontSize:13}}>{m.from_location}</div></div>
                    <div><div style={{fontSize:10,fontWeight:800,color:G.olive,textTransform:'uppercase',marginBottom:3}}>To</div><div style={{fontWeight:700,fontSize:13}}>{m.to_location}</div></div>
                    {m.item_type==='Material' && <div><div style={{fontSize:10,fontWeight:800,color:G.olive,textTransform:'uppercase',marginBottom:3}}>Qty</div><div style={{fontWeight:700,fontSize:13}}>{parseFloat(m.quantity).toLocaleString()}</div></div>}
                    <div><div style={{fontSize:10,fontWeight:800,color:G.olive,textTransform:'uppercase',marginBottom:3}}>Requested By</div><div style={{fontWeight:700,fontSize:13}}>{m.moved_by}</div></div>
                    <div><div style={{fontSize:10,fontWeight:800,color:G.olive,textTransform:'uppercase',marginBottom:3}}>Date & Time</div><div style={{fontWeight:700,fontSize:13}}>{new Date(m.date_time).toLocaleString()}</div></div>
                  </div>
                  {m.notes && <div style={{marginTop:10,padding:'8px 12px',background:`${G.sage}22`,borderRadius:8,fontSize:13,color:G.darkGray}}><strong>Note:</strong> {m.notes.replace(' | PENDING_APPROVAL','')}</div>}
                </div>
                <Btn color={G.leaf} onClick={()=>approve(m.id)} disabled={approving===m.id}>
                  {approving===m.id ? '⏳ Approving…' : '✅ Approve'}
                </Btn>
              </div>
            ))}
          </div>
        )
      }
    </div>
  );
};
export default PrintingPendingMoves;
