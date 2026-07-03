import React, { useState } from 'react';
import { Printer, CheckCircle, Package } from 'lucide-react';

const OPEN_POS = [
  { id:'PO-2026-041', supplier:'Ethio Pharma Supplies', date:'2026-06-28', drugs:[
    { id:1, name:'Amoxicillin 500mg', ordered:500, unit:'Capsule', batchNo:'', expiry:'' },
    { id:2, name:'Ciprofloxacin 500mg', ordered:200, unit:'Tablet', batchNo:'', expiry:'' },
  ]},
  { id:'PO-2026-039', supplier:'Medipharm Ethiopia', date:'2026-06-25', drugs:[
    { id:3, name:'Atorvastatin 10mg', ordered:300, unit:'Tablet', batchNo:'', expiry:'' },
  ]},
];

const PharmacyGoodsReceiving = () => {
  const [selectedPO, setSelectedPO] = useState('');
  const [lines, setLines] = useState([]);
  const [receivedBy, setReceivedBy] = useState('Pharmacy Manager');
  const [receiveDate, setReceiveDate] = useState(new Date().toISOString().split('T')[0]);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handlePOSelect = (poId) => {
    setSelectedPO(poId);
    const po = OPEN_POS.find(p => p.id === poId);
    if (po) setLines(po.drugs.map(d => ({ ...d, received:0, batchNo:'', expiry:'' })));
    else setLines([]);
    setSubmitted(false);
  };

  const updateLine = (id, field, val) => {
    setLines(prev => prev.map(l => l.id===id ? {...l, [field]:val} : l));
  };

  const canSubmit = selectedPO && lines.length > 0 && lines.every(l => l.received > 0 && l.batchNo && l.expiry);

  const handleSubmit = () => {
    setSubmitting(true);
    setTimeout(() => { setSubmitting(false); setSubmitted(true); }, 1200);
  };

  const handlePrint = () => {
    const po = OPEN_POS.find(p => p.id === selectedPO);
    const w = window.open('', '_blank');
    w.document.write(`<!DOCTYPE html><html><head><title>Receiving Note</title>
    <style>body{font-family:Arial,sans-serif;padding:30px;color:#1e293b;}h1{font-size:22px;}table{width:100%;border-collapse:collapse;margin-top:20px;}th,td{border:1px solid #000;padding:10px;text-align:left;}th{background:#e2e8f0;}.stamp{margin-top:60px;border-top:2px solid #000;padding-top:10px;width:200px;text-align:center;}</style>
    </head><body>
    <h1>📥 GOODS RECEIVING NOTE — Model 19</h1>
    <p><strong>PO Reference:</strong> ${selectedPO} &nbsp;&nbsp; <strong>Supplier:</strong> ${po?.supplier} &nbsp;&nbsp; <strong>Date:</strong> ${receiveDate}</p>
    <p><strong>Received By:</strong> ${receivedBy}</p>
    <table><thead><tr><th>Drug Name</th><th>Batch No</th><th>Expiry Date</th><th>Ordered</th><th>Received</th><th>Unit</th></tr></thead>
    <tbody>${lines.map(l=>`<tr><td>${l.name}</td><td>${l.batchNo}</td><td>${l.expiry}</td><td>${l.ordered}</td><td>${l.received}</td><td>${l.unit}</td></tr>`).join('')}</tbody></table>
    <div class="stamp"><p>Manager Digital Stamp</p><p style="margin-top:40px;">______________________</p><p>Signature &amp; Date</p></div>
    </body></html>`);
    w.document.close(); w.print();
  };

  return (
    <div style={{ padding:24, fontFamily:"'Inter',sans-serif", background:'#f8fafc', minHeight:'100vh' }}>
      <div style={{ marginBottom:24 }}>
        <h1 style={{ fontSize:26, fontWeight:800, margin:'0 0 4px 0' }}>📥 GOODS RECEIVING</h1>
        <p style={{ color:'#64748b', margin:0, fontSize:14 }}>🔗 Receive Goods (Model 19) — Link to PO, Enter Quantities, Auto-Update Inventory</p>
      </div>

      {submitted ? (
        <div style={{ background:'white', borderRadius:14, padding:48, textAlign:'center', border:'1px solid #e2e8f0' }}>
          <CheckCircle size={64} color="#10b981" style={{ marginBottom:16 }}/>
          <h2 style={{ color:'#059669', margin:'0 0 8px 0' }}>Goods Received Successfully!</h2>
          <p style={{ color:'#64748b', marginBottom:24 }}>Pharmacy inventory has been automatically updated. Batch data is now tracked in Batch Management.</p>
          <div style={{ display:'flex', gap:12, justifyContent:'center' }}>
            <button onClick={handlePrint} style={{ padding:'10px 24px', background:'#224f94', color:'white', border:'none', borderRadius:8, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:6 }}>
              <Printer size={16}/> Print Receiving Note
            </button>
            <button onClick={()=>{setSubmitted(false);setSelectedPO('');setLines([]);}} style={{ padding:'10px 24px', background:'#f1f5f9', color:'#64748b', border:'none', borderRadius:8, fontWeight:700, cursor:'pointer' }}>
              New Receiving
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'1fr', gap:20, maxWidth:900 }}>
          {/* PO Selection */}
          <div style={{ background:'white', borderRadius:12, border:'1px solid #e2e8f0', overflow:'hidden' }}>
            <div style={{ padding:'14px 20px', borderBottom:'1px solid #e2e8f0', background:'#f8fafc' }}>
              <h3 style={{ margin:0, fontSize:16, fontWeight:700, color:'#1e293b', display:'flex', alignItems:'center', gap:8 }}><Package size={18} color="#224f94"/> Step 1: Select Purchase Order</h3>
            </div>
            <div style={{ padding:20 }}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
                <div>
                  <label style={{ display:'block', fontSize:13, fontWeight:600, color:'#374151', marginBottom:6 }}>Purchase Order *</label>
                  <select value={selectedPO} onChange={e=>handlePOSelect(e.target.value)} style={{ width:'100%', padding:'10px 12px', border:'1px solid #e2e8f0', borderRadius:8, fontSize:14, outline:'none' }}>
                    <option value="">— Select Open PO —</option>
                    {OPEN_POS.map(po => <option key={po.id} value={po.id}>{po.id} — {po.supplier} ({po.date})</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display:'block', fontSize:13, fontWeight:600, color:'#374151', marginBottom:6 }}>Receive Date *</label>
                  <input type="date" value={receiveDate} onChange={e=>setReceiveDate(e.target.value)} style={{ width:'100%', padding:'10px 12px', border:'1px solid #e2e8f0', borderRadius:8, fontSize:14, outline:'none' }}/>
                </div>
                <div>
                  <label style={{ display:'block', fontSize:13, fontWeight:600, color:'#374151', marginBottom:6 }}>Received By *</label>
                  <input type="text" value={receivedBy} onChange={e=>setReceivedBy(e.target.value)} style={{ width:'100%', padding:'10px 12px', border:'1px solid #e2e8f0', borderRadius:8, fontSize:14, outline:'none' }}/>
                </div>
                {selectedPO && (
                  <div>
                    <label style={{ display:'block', fontSize:13, fontWeight:600, color:'#374151', marginBottom:6 }}>Supplier</label>
                    <input readOnly value={OPEN_POS.find(p=>p.id===selectedPO)?.supplier||''} style={{ width:'100%', padding:'10px 12px', border:'1px solid #e2e8f0', borderRadius:8, fontSize:14, background:'#f8fafc', color:'#64748b' }}/>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Drug Lines */}
          {lines.length > 0 && (
            <div style={{ background:'white', borderRadius:12, border:'1px solid #e2e8f0', overflow:'hidden' }}>
              <div style={{ padding:'14px 20px', borderBottom:'1px solid #e2e8f0', background:'#f8fafc' }}>
                <h3 style={{ margin:0, fontSize:16, fontWeight:700, color:'#1e293b' }}>Step 2: Enter Received Quantities</h3>
                <p style={{ margin:'4px 0 0 0', fontSize:13, color:'#64748b' }}>Batch number and expiry date are required per drug line.</p>
              </div>
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:14 }}>
                  <thead>
                    <tr style={{ background:'#f8fafc', borderBottom:'2px solid #e2e8f0' }}>
                      {['Drug Name','Unit','Ordered Qty','Received Qty *','Batch Number *','Expiry Date *'].map(h => (
                        <th key={h} style={{ padding:'10px 14px', textAlign:'left', fontWeight:700, color:'#475569', fontSize:12, textTransform:'uppercase', whiteSpace:'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {lines.map(line => (
                      <tr key={line.id} style={{ borderBottom:'1px solid #f1f5f9' }}>
                        <td style={{ padding:'12px 14px', fontWeight:600 }}>{line.name}</td>
                        <td style={{ padding:'12px 14px', color:'#64748b' }}>{line.unit}</td>
                        <td style={{ padding:'12px 14px', color:'#64748b' }}>{line.ordered}</td>
                        <td style={{ padding:'8px 14px' }}>
                          <input type="number" min="0" max={line.ordered} value={line.received} onChange={e=>updateLine(line.id,'received',parseInt(e.target.value)||0)}
                            style={{ width:90, padding:'7px 10px', border:`1px solid ${line.received>0?'#10b981':'#e2e8f0'}`, borderRadius:7, fontSize:14, outline:'none', textAlign:'center' }}/>
                        </td>
                        <td style={{ padding:'8px 14px' }}>
                          <input type="text" placeholder="e.g. BAT-2026-001" value={line.batchNo} onChange={e=>updateLine(line.id,'batchNo',e.target.value)}
                            style={{ width:140, padding:'7px 10px', border:`1px solid ${line.batchNo?'#10b981':'#e2e8f0'}`, borderRadius:7, fontSize:13, outline:'none' }}/>
                        </td>
                        <td style={{ padding:'8px 14px' }}>
                          <input type="date" value={line.expiry} onChange={e=>updateLine(line.id,'expiry',e.target.value)}
                            style={{ padding:'7px 10px', border:`1px solid ${line.expiry?'#10b981':'#e2e8f0'}`, borderRadius:7, fontSize:13, outline:'none' }}/>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ padding:20, borderTop:'1px solid #e2e8f0' }}>
                <button onClick={handleSubmit} disabled={!canSubmit||submitting}
                  style={{ padding:'12px 32px', background:canSubmit?'#059669':'#e2e8f0', color:canSubmit?'white':'#94a3b8', border:'none', borderRadius:9, fontWeight:700, fontSize:15, cursor:canSubmit?'pointer':'not-allowed', transition:'all 0.2s' }}>
                  {submitting ? '⏳ Processing...' : '✅ Confirm Receipt & Update Inventory'}
                </button>
                {!canSubmit && <p style={{ margin:'8px 0 0 0', fontSize:13, color:'#94a3b8' }}>Fill all received quantities, batch numbers and expiry dates to confirm.</p>}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PharmacyGoodsReceiving;
