import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const G = { forest:'#228B22',dark:'#1B5E20',emerald:'#2E8B57',leaf:'#4CAF50',sage:'#A5D6A7',olive:'#6B8E23',lime:'#8BC34A',brown:'#8D6E63',sky:'#87CEEB',white:'#FFFFFF',lightGray:'#F5F5F5',darkGray:'#424242',orange:'#FF9800',red:'#F44336' };
const BASE = '/api/v1/printing-assets';
const api  = axios.create();
api.interceptors.request.use(cfg => { const t = localStorage.getItem('token')||sessionStorage.getItem('token'); if(t) cfg.headers.Authorization=`Bearer ${t}`; return cfg; });

const ACTION_COLORS = {'Move to Production':G.forest,'Return to Store':G.sky,'Consume':G.orange,'Register':G.lime,'Value Update':G.brown};

const PrintingProdLogs = () => {
  const [logs, setLogs]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState('all');

  const load = useCallback(async()=>{
    setLoading(true);
    try {
      const params = {};
      if(filter!=='all') params.item_type = filter;
      const {data}=await api.get(`${BASE}/log`,{params});
      setLogs(data.data||[]);
    } catch{setLogs([]);}
    setLoading(false);
  },[filter]);

  useEffect(()=>{ load(); },[load]);

  return (
    <div style={{padding:24,background:G.lightGray,minHeight:'100vh',fontFamily:"'Inter',sans-serif"}}>
      <div style={{background:`linear-gradient(135deg,${G.dark},${G.forest})`,borderRadius:16,padding:'22px 28px',marginBottom:24,color:'#fff',boxShadow:`0 8px 24px ${G.dark}55`,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <div><h1 style={{margin:0,fontSize:24,fontWeight:900}}>📋 Production Logs</h1><p style={{margin:'4px 0 0',opacity:.8,fontSize:14}}>Full audit trail of all asset movements and actions</p></div>
        <div style={{display:'flex',gap:8}}>
          {['all','Machine','Material'].map(f=>(
            <button key={f} onClick={()=>setFilter(f)} style={{padding:'8px 18px',borderRadius:8,border:'none',cursor:'pointer',fontWeight:800,fontSize:13,background:filter===f?'#fff':'rgba(255,255,255,.15)',color:filter===f?G.dark:'#fff'}}>{f==='all'?'All':f+'s'}</button>
          ))}
        </div>
      </div>

      {loading ? <div style={{textAlign:'center',padding:60,color:G.olive}}>Loading logs…</div> :
        logs.length===0 ? <div style={{textAlign:'center',padding:60,background:'#fff',borderRadius:16,color:G.sage,fontSize:16}}>No logs found.</div> : (
          <div style={{background:'#fff',borderRadius:16,overflow:'hidden',boxShadow:'0 4px 20px rgba(0,0,0,0.06)'}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
              <thead>
                <tr style={{background:G.dark,color:'#fff'}}>
                  {['#','Type','Item ID','Action','From','To','Qty','Moved By','Approved By','Date & Time','Notes'].map(h=>(
                    <th key={h} style={{padding:'12px 14px',textAlign:'left',fontWeight:800,whiteSpace:'nowrap'}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map((l,i)=>(
                  <tr key={l.id} style={{background:i%2===0?'#f9fff9':'#fff',borderBottom:`1px solid ${G.sage}44`}}>
                    <td style={{padding:'10px 14px',color:G.olive,fontWeight:700}}>{l.id}</td>
                    <td style={{padding:'10px 14px'}}>
                      <span style={{background:l.item_type==='Machine'?`${G.forest}15`:`${G.sky}22`,color:l.item_type==='Machine'?G.forest:G.sky,padding:'3px 10px',borderRadius:12,fontSize:11,fontWeight:800}}>{l.item_type}</span>
                    </td>
                    <td style={{padding:'10px 14px',fontWeight:800,color:G.dark}}>{l.item_id}</td>
                    <td style={{padding:'10px 14px'}}>
                      <span style={{background:`${ACTION_COLORS[l.action_type]||G.sage}22`,color:ACTION_COLORS[l.action_type]||G.darkGray,padding:'3px 10px',borderRadius:12,fontSize:11,fontWeight:800}}>{l.action_type}</span>
                    </td>
                    <td style={{padding:'10px 14px',color:G.darkGray}}>{l.from_location}</td>
                    <td style={{padding:'10px 14px',color:G.darkGray}}>{l.to_location}</td>
                    <td style={{padding:'10px 14px',fontWeight:700}}>{l.quantity>0?parseFloat(l.quantity).toLocaleString():'—'}</td>
                    <td style={{padding:'10px 14px',color:G.darkGray}}>{l.moved_by||'—'}</td>
                    <td style={{padding:'10px 14px',color:l.approved_by?G.leaf:G.orange,fontWeight:700}}>{l.approved_by||'Pending'}</td>
                    <td style={{padding:'10px 14px',color:G.darkGray,whiteSpace:'nowrap'}}>{new Date(l.date_time).toLocaleString()}</td>
                    <td style={{padding:'10px 14px',color:G.darkGray,maxWidth:200,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}} title={l.notes}>{l.notes||'—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      }
    </div>
  );
};
export default PrintingProdLogs;
