import React, { useState } from 'react';
import { Printer, CheckCircle, ArrowRight } from 'lucide-react';

const LOCATIONS = ['Branch A','Branch B','Branch C','Main Pharmacy','Main Store'];
const DRUGS = [
  { id:1, name:'Amoxicillin 500mg',  stock:{ 'Branch A':120,'Branch B':5,'Branch C':80,'Main Pharmacy':45,'Main Store':500 } },
  { id:2, name:'Paracetamol 500mg',  stock:{ 'Branch A':0,'Branch B':60,'Branch C':80,'Main Pharmacy':200,'Main Store':1000 } },
  { id:3, name:'Metformin 500mg',    stock:{ 'Branch A':45,'Branch B':30,'Branch C':10,'Main Pharmacy':80,'Main Store':300 } },
  { id:4, name:'Atorvastatin 10mg',  stock:{ 'Branch A':8,'Branch B':70,'Branch C':60,'Main Pharmacy':90,'Main Store':200 } },
  { id:5, name:'Salbutamol Inhaler', stock:{ 'Branch A':12,'Branch B':8,'Branch C':5,'Main Pharmacy':20,'Main Store':80 } },
];

const STATUSES = ['PENDING','IN TRANSIT','RECEIVED'];

const HISTORY = [
  { id:'TRF-001', from:'Main Store', to:'Branch A', drug:'Amoxicillin 500mg', qty:100, date:'2026-06-28', status:'RECEIVED', by:'Yonas M.' },
  { id:'TRF-002', from:'Branch B',   to:'Branch C', drug:'Paracetamol 500mg', qty:50,  date:'2026-06-29', status:'IN TRANSIT', by:'Sara T.' },
  { id:'TRF-003', from:'Main Store', to:'Branch B', drug:'Metformin 500mg',   qty:200, date:'2026-06-30', status:'PENDING', by:'Yonas M.' },
];

const STATUS_COLORS = { PENDING:{ bg:'#fef3c7',color:'#92400e' }, 'IN TRANSIT':{ bg:'#dbeafe',color:'#1e40af' }, RECEIVED:{ bg:'#dcfce7',color:'#166534' } };

const PharmacyStockTransfer = () => {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [drugId, setDrugId] = useState('');
  const [qty, setQty] = useState(1);
  const [approvedBy, setApprovedBy] = useState('Pharmacy Manager');
  const [remarks, setRemarks] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [history, setHistory] = useState(HISTORY);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [lastTransfer, setLastTransfer] = useState(null);

  const selectedDrug = DRUGS.find(d => d.id === parseInt(drugId));
  const maxQty = selectedDrug && from ? (selectedDrug.stock[from] || 0) : 999;
  const canSubmit = from && to && from!==to && drugId && qty > 0 && qty <= maxQty;

  const handleSubmit = () => {
    setSubmitting(true);
    setTimeout(() => {
      const t = { id:`TRF-00${history.length+4}`, from, to, drug:selectedDrug?.name, qty, date, status:'PENDING', by:approvedBy };
      setHistory(prev => [t, ...prev]);
      setLastTransfer(t);
      setSubmitting(false); setSubmitted(true);
    }, 1200);
  };

  const handlePrint = (t) => {
    const transfer = t || lastTransfer;
    if (!transfer) return;
    const w = window.open('','_blank');
    w.document.write(`<!DOCTYPE html><html><head><title>Transfer Note</title>
    <style>body{font-family:Arial,sans-serif;padding:30px;}table{width:100%;border-collapse:collapse;margin-top:20px;}th,td{border:1px solid #000;padding:10px;}th{background:#e2e8f0;}.stamp{margin-top:60px;border-top:2px solid #000;padding-top:10px;width:200px;text-align:center;}</style>
    </head><body>
    <h1>🔄 STOCK TRANSFER NOTE — Model 19 / Model 22</h1>
    <p><strong>Transfer #:</strong> ${transfer.id} &nbsp;&nbsp; <strong>Date:</strong> ${transfer.date}</p>
    <p><strong>From:</strong> ${transfer.from} &nbsp;&nbsp;<strong>→</strong>&nbsp;&nbsp; <strong>To:</strong> ${transfer.to}</p>
    <p><strong>Drug:</strong> ${transfer.drug} &nbsp;&nbsp; <strong>Quantity:</strong> ${transfer.qty}</p>
    <p><strong>Initiated By:</strong> ${transfer.by} &nbsp;&nbsp; <strong>Status:</strong> ${transfer.status}</p>
    <div class="stamp"><p>Manager Digital Stamp</p><p style="margin-top:40px;">______________________</p><p>Received By / Date</p></div>
    </body></html>`);
    w.document.close(); w.print();
  };

  const advanceStatus = (id) => {
    setHistory(prev => prev.map(h => {
      if (h.id !== id) return h;
      const idx = STATUSES.indexOf(h.status);
      return { ...h, status: STATUSES[Math.min(idx+1, STATUSES.length-1)] };
    }));
  };

  return (
    <div style={{ padding:24, fontFamily:"'Inter',sans-serif", background:'#f8fafc', minHeight:'100vh' }}>
      <div style={{ marginBottom:24 }}>
        <h1 style={{ fontSize:26, fontWeight:800, margin:'0 0 4px 0' }}>🔄 STOCK TRANSFER</h1>
        <p style={{ color:'#64748b', margin:0, fontSize:14 }}>🔗 Transfer Between Branches — Branch-to-Branch &amp; Store-to-Pharmacy</p>
      </div>

      {submitted && lastTransfer ? (
        <div style={{ background:'white', borderRadius:14, padding:40, textAlign:'center', border:'1px solid #e2e8f0', maxWidth:560, marginBottom:24 }}>
          <CheckCircle size={56} color="#10b981" style={{ marginBottom:12 }}/>
          <h2 style={{ color:'#059669', margin:'0 0 6px 0' }}>Transfer Initiated!</h2>
          <p style={{ color:'#64748b', marginBottom:6 }}><strong>{lastTransfer.from}</strong> <ArrowRight size={14} style={{display:'inline',verticalAlign:'middle'}}/> <strong>{lastTransfer.to}</strong></p>
          <p style={{ color:'#64748b', marginBottom:20 }}>{lastTransfer.drug} — Qty: {lastTransfer.qty} | Status: <strong>PENDING</strong></p>
          <div style={{ display:'flex', gap:10, justifyContent:'center' }}>
            <button onClick={()=>handlePrint(lastTransfer)} style={{ padding:'10px 22px', background:'#224f94', color:'white', border:'none', borderRadius:8, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:6 }}><Printer size={15}/> Print Transfer Note</button>
            <button onClick={()=>{ setSubmitted(false); setFrom(''); setTo(''); setDrugId(''); setQty(1); setRemarks(''); }} style={{ padding:'10px 22px', background:'#f1f5f9', color:'#64748b', border:'none', borderRadius:8, fontWeight:700, cursor:'pointer' }}>New Transfer</button>
          </div>
        </div>
      ) : (
        <div style={{ background:'white', borderRadius:12, border:'1px solid #e2e8f0', padding:24, maxWidth:800, marginBottom:24 }}>
          <h3 style={{ margin:'0 0 18px 0', fontSize:16, fontWeight:700 }}>New Stock Transfer</h3>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
            <div>
              <label style={{ display:'block', fontSize:13, fontWeight:600, color:'#374151', marginBottom:6 }}>From Location *</label>
              <select value={from} onChange={e=>{setFrom(e.target.value);setDrugId('');}} style={{ width:'100%', padding:'10px 12px', border:'1px solid #e2e8f0', borderRadius:8, fontSize:14, outline:'none' }}>
                <option value="">— Select Source —</option>
                {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display:'block', fontSize:13, fontWeight:600, color:'#374151', marginBottom:6 }}>To Location *</label>
              <select value={to} onChange={e=>setTo(e.target.value)} style={{ width:'100%', padding:'10px 12px', border:'1px solid #e2e8f0', borderRadius:8, fontSize:14, outline:'none' }}>
                <option value="">— Select Destination —</option>
                {LOCATIONS.filter(l=>l!==from).map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display:'block', fontSize:13, fontWeight:600, color:'#374151', marginBottom:6 }}>Drug *</label>
              <select value={drugId} onChange={e=>setDrugId(e.target.value)} style={{ width:'100%', padding:'10px 12px', border:'1px solid #e2e8f0', borderRadius:8, fontSize:14, outline:'none' }}>
                <option value="">— Select Drug —</option>
                {DRUGS.map(d => <option key={d.id} value={d.id}>{d.name} {from ? `(Available: ${d.stock[from]??0})` : ''}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display:'block', fontSize:13, fontWeight:600, color:'#374151', marginBottom:6 }}>Quantity * {selectedDrug && from ? `(Max: ${maxQty})` : ''}</label>
              <input type="number" min={1} max={maxQty} value={qty} onChange={e=>setQty(parseInt(e.target.value)||1)}
                style={{ width:'100%', padding:'10px 12px', border:`1px solid ${qty>maxQty?'#ef4444':'#e2e8f0'}`, borderRadius:8, fontSize:14, outline:'none', boxSizing:'border-box' }}/>
              {qty > maxQty && <p style={{ color:'#ef4444', fontSize:12, margin:'4px 0 0 0' }}>Exceeds available stock ({maxQty})</p>}
            </div>
            <div>
              <label style={{ display:'block', fontSize:13, fontWeight:600, color:'#374151', marginBottom:6 }}>Approved By</label>
              <input type="text" value={approvedBy} onChange={e=>setApprovedBy(e.target.value)} style={{ width:'100%', padding:'10px 12px', border:'1px solid #e2e8f0', borderRadius:8, fontSize:14, outline:'none', boxSizing:'border-box' }}/>
            </div>
            <div>
              <label style={{ display:'block', fontSize:13, fontWeight:600, color:'#374151', marginBottom:6 }}>Transfer Date</label>
              <input type="date" value={date} onChange={e=>setDate(e.target.value)} style={{ width:'100%', padding:'10px 12px', border:'1px solid #e2e8f0', borderRadius:8, fontSize:14, outline:'none' }}/>
            </div>
            <div style={{ gridColumn:'1/-1' }}>
              <label style={{ display:'block', fontSize:13, fontWeight:600, color:'#374151', marginBottom:6 }}>Remarks</label>
              <textarea value={remarks} onChange={e=>setRemarks(e.target.value)} rows={2} style={{ width:'100%', padding:'10px 12px', border:'1px solid #e2e8f0', borderRadius:8, fontSize:14, outline:'none', resize:'vertical', boxSizing:'border-box' }}/>
            </div>
          </div>
          <div style={{ marginTop:20 }}>
            <button onClick={handleSubmit} disabled={!canSubmit||submitting}
              style={{ padding:'12px 32px', background:canSubmit?'#224f94':'#e2e8f0', color:canSubmit?'white':'#94a3b8', border:'none', borderRadius:9, fontWeight:700, fontSize:15, cursor:canSubmit?'pointer':'not-allowed' }}>
              {submitting ? '⏳ Initiating...' : '🔄 Initiate Transfer'}
            </button>
          </div>
        </div>
      )}

      {/* Transfer History with status tracking */}
      <div style={{ background:'white', borderRadius:12, border:'1px solid #e2e8f0', overflow:'hidden' }}>
        <div style={{ padding:'14px 20px', borderBottom:'1px solid #e2e8f0', background:'#f8fafc' }}>
          <h3 style={{ margin:0, fontSize:15, fontWeight:700 }}>Transfer History — Status Tracking</h3>
        </div>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:14 }}>
            <thead>
              <tr style={{ background:'#f8fafc', borderBottom:'2px solid #e2e8f0' }}>
                {['Transfer #','From','To','Drug','Qty','Date','Status','Actions'].map(h => (
                  <th key={h} style={{ padding:'10px 14px', textAlign:'left', fontWeight:700, color:'#475569', fontSize:12, textTransform:'uppercase', whiteSpace:'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {history.map(row => {
                const sc = STATUS_COLORS[row.status];
                const nextStatus = STATUSES[STATUSES.indexOf(row.status)+1];
                return (
                  <tr key={row.id} style={{ borderBottom:'1px solid #f1f5f9' }}>
                    <td style={{ padding:'11px 14px', fontWeight:600, fontFamily:'monospace', color:'#224f94' }}>{row.id}</td>
                    <td style={{ padding:'11px 14px' }}>{row.from}</td>
                    <td style={{ padding:'11px 14px', display:'flex', alignItems:'center', gap:6 }}><ArrowRight size={13} color="#94a3b8"/>{row.to}</td>
                    <td style={{ padding:'11px 14px' }}>{row.drug}</td>
                    <td style={{ padding:'11px 14px', fontWeight:700 }}>{row.qty}</td>
                    <td style={{ padding:'11px 14px', color:'#64748b' }}>{row.date}</td>
                    <td style={{ padding:'11px 14px' }}>
                      <span style={{ padding:'3px 10px', borderRadius:12, fontSize:12, fontWeight:700, background:sc.bg, color:sc.color }}>{row.status}</span>
                    </td>
                    <td style={{ padding:'11px 14px' }}>
                      <div style={{ display:'flex', gap:6 }}>
                        {nextStatus && (
                          <button onClick={()=>advanceStatus(row.id)} style={{ padding:'4px 10px', background:'#059669', color:'white', border:'none', borderRadius:6, fontSize:12, cursor:'pointer', fontWeight:600 }}>
                            → {nextStatus}
                          </button>
                        )}
                        <button onClick={()=>handlePrint(row)} style={{ padding:'4px 10px', background:'#224f94', color:'white', border:'none', borderRadius:6, fontSize:12, cursor:'pointer', fontWeight:600 }}>
                          <Printer size={12} style={{display:'inline'}}/> Print
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PharmacyStockTransfer;
