import React, { useState } from 'react';
import { Printer, CheckCircle, AlertTriangle, Clock } from 'lucide-react';

const DRUGS = [
  { id:1, name:'Amoxicillin 500mg', batch:'BATCH-A001', stock:5, cost:200 },
  { id:2, name:'Paracetamol 500mg', batch:'BATCH-A002', stock:80, cost:40 },
  { id:3, name:'Metformin 500mg',   batch:'BATCH-A003', stock:0, cost:120 },
  { id:4, name:'Atorvastatin 10mg', batch:'BATCH-A004', stock:70, cost:300 },
  { id:5, name:'Ciprofloxacin 500mg',batch:'BATCH-A006',stock:8, cost:250 },
];

const ADJUSTMENT_TYPES = [
  { value:'damage',    label:'Damage Write-Off',    desc:'Drugs physically damaged and removed from usable stock' },
  { value:'expiry',    label:'Expiry Write-Off',     desc:'Drugs expired and removed from usable stock' },
  { value:'correction',label:'Counting Correction',  desc:'Physical count differs from system count — system updated to match' },
];

const THRESHOLD = 50; // Large adjustment threshold (configurable)

const AUDIT_LOG_INIT = [
  { id:'ADJ-001', drug:'Metformin 500mg', type:'Expiry Write-Off', qty:20, reason:'Found expired in storage', status:'Applied', by:'Yonas M.', date:'2026-06-28' },
  { id:'ADJ-002', drug:'Atorvastatin 10mg', type:'Damage Write-Off', qty:100, reason:'Flood damage', status:'Pending CEO Approval', by:'Yonas M.', date:'2026-06-30' },
];

const PharmacyStockAdjustment = () => {
  const [drugId, setDrugId] = useState('');
  const [adjType, setAdjType] = useState('');
  const [adjQty, setAdjQty] = useState(1);
  const [reason, setReason] = useState('');
  const [approvedBy, setApprovedBy] = useState('Pharmacy Manager');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [auditLog, setAuditLog] = useState(AUDIT_LOG_INIT);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [lastAdj, setLastAdj] = useState(null);
  const [ceoRequired, setCeoRequired] = useState(false);

  const selectedDrug = DRUGS.find(d => d.id === parseInt(drugId));
  const isLarge = adjQty >= THRESHOLD;
  const canSubmit = drugId && adjType && adjQty > 0 && reason.trim();

  const handleSubmit = () => {
    setSubmitting(true);
    setTimeout(() => {
      const entry = {
        id: `ADJ-${String(auditLog.length+3).padStart(3,'0')}`,
        drug: selectedDrug?.name,
        type: ADJUSTMENT_TYPES.find(a=>a.value===adjType)?.label,
        qty: adjQty,
        reason,
        status: isLarge ? 'Pending CEO Approval' : 'Applied',
        by: approvedBy,
        date,
      };
      setAuditLog(prev => [entry, ...prev]);
      setLastAdj(entry);
      setCeoRequired(isLarge);
      setSubmitting(false); setSubmitted(true);
    }, 1200);
  };

  const handlePrint = () => {
    const w = window.open('','_blank');
    w.document.write(`<!DOCTYPE html><html><head><title>Adjustment Note</title>
    <style>body{font-family:Arial,sans-serif;padding:30px;}table{width:100%;border-collapse:collapse;margin-top:20px;}th,td{border:1px solid #000;padding:10px;}th{background:#e2e8f0;}.stamp{margin-top:60px;border-top:2px solid #000;padding-top:10px;width:200px;text-align:center;}</style>
    </head><body>
    <h1>⚙️ STOCK ADJUSTMENT NOTE</h1>
    <p><strong>Adjustment #:</strong> ${lastAdj?.id} &nbsp;&nbsp; <strong>Date:</strong> ${lastAdj?.date}</p>
    <p><strong>Drug:</strong> ${lastAdj?.drug} &nbsp;&nbsp; <strong>Batch:</strong> ${selectedDrug?.batch}</p>
    <p><strong>Type:</strong> ${lastAdj?.type} &nbsp;&nbsp; <strong>Quantity Adjusted:</strong> ${lastAdj?.qty}</p>
    <p><strong>Reason:</strong> ${lastAdj?.reason}</p>
    <p><strong>Manager:</strong> ${lastAdj?.by} &nbsp;&nbsp; <strong>Status:</strong> ${lastAdj?.status}</p>
    ${isLarge ? '<p style="color:red;font-weight:bold;">⚠️ LARGE ADJUSTMENT — CEO Approval Required before inventory is updated.</p>' : ''}
    <div class="stamp"><p>Manager Digital Stamp</p><p style="margin-top:40px;">______________________</p>
    ${isLarge ? '<p style="margin-top:40px;">CEO Approval: ______________________</p>' : ''}
    </div></body></html>`);
    w.document.close(); w.print();
  };

  const STATUS_COLORS = { Applied:{ bg:'#dcfce7',color:'#166534' }, 'Pending CEO Approval':{ bg:'#fef3c7',color:'#92400e' }, Rejected:{ bg:'#fee2e2',color:'#991b1b' } };

  return (
    <div style={{ padding:24, fontFamily:"'Inter',sans-serif", background:'#f8fafc', minHeight:'100vh' }}>
      <div style={{ marginBottom:24 }}>
        <h1 style={{ fontSize:26, fontWeight:800, margin:'0 0 4px 0' }}>⚙️ STOCK ADJUSTMENT</h1>
        <p style={{ color:'#64748b', margin:0, fontSize:14 }}>🔗 Adjust Pharmacy Stock — Damage, Expiry Write-Offs &amp; Counting Corrections</p>
      </div>

      <div style={{ background:'#fffbeb', border:'1px solid #fbbf24', borderRadius:10, padding:'12px 18px', marginBottom:20, display:'flex', alignItems:'center', gap:10 }}>
        <AlertTriangle size={18} color="#b45309"/>
        <span style={{ fontSize:13, color:'#92400e' }}><strong>Large Adjustment Threshold: {THRESHOLD} units.</strong> Adjustments at or above this quantity require CEO approval before inventory is updated. Below this threshold, adjustments are applied immediately.</span>
      </div>

      {submitted && lastAdj ? (
        <div style={{ background:'white', borderRadius:14, padding:40, textAlign:'center', border:'1px solid #e2e8f0', maxWidth:560, marginBottom:24 }}>
          {ceoRequired ? <Clock size={56} color="#f59e0b" style={{ marginBottom:12 }}/> : <CheckCircle size={56} color="#10b981" style={{ marginBottom:12 }}/>}
          <h2 style={{ color:ceoRequired?'#b45309':'#059669', margin:'0 0 8px 0' }}>
            {ceoRequired ? 'Sent to CEO for Approval' : 'Adjustment Applied!'}
          </h2>
          <p style={{ color:'#64748b', marginBottom:8 }}>{lastAdj.drug} — {lastAdj.qty} units {lastAdj.type}</p>
          {ceoRequired && <p style={{ color:'#92400e', fontWeight:600, marginBottom:16 }}>⚠️ Inventory will only be updated after CEO approves this adjustment.</p>}
          <div style={{ display:'flex', gap:10, justifyContent:'center' }}>
            <button onClick={handlePrint} style={{ padding:'10px 22px', background:'#224f94', color:'white', border:'none', borderRadius:8, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:6 }}><Printer size={15}/> Print Adjustment Note</button>
            <button onClick={()=>{ setSubmitted(false); setDrugId(''); setAdjType(''); setAdjQty(1); setReason(''); }} style={{ padding:'10px 22px', background:'#f1f5f9', color:'#64748b', border:'none', borderRadius:8, fontWeight:700, cursor:'pointer' }}>New Adjustment</button>
          </div>
        </div>
      ) : (
        <div style={{ background:'white', borderRadius:12, border:'1px solid #e2e8f0', padding:24, maxWidth:800, marginBottom:24 }}>
          <h3 style={{ margin:'0 0 18px 0', fontSize:16, fontWeight:700 }}>New Stock Adjustment</h3>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
            <div>
              <label style={{ display:'block', fontSize:13, fontWeight:600, color:'#374151', marginBottom:6 }}>Drug *</label>
              <select value={drugId} onChange={e=>setDrugId(e.target.value)} style={{ width:'100%', padding:'10px 12px', border:'1px solid #e2e8f0', borderRadius:8, fontSize:14, outline:'none' }}>
                <option value="">— Select Drug —</option>
                {DRUGS.map(d => <option key={d.id} value={d.id}>{d.name} (Batch: {d.batch}, Stock: {d.stock})</option>)}
              </select>
            </div>
            <div>
              <label style={{ display:'block', fontSize:13, fontWeight:600, color:'#374151', marginBottom:6 }}>Quantity to Adjust *</label>
              <input type="number" min={1} value={adjQty} onChange={e=>setAdjQty(parseInt(e.target.value)||1)}
                style={{ width:'100%', padding:'10px 12px', border:`1px solid ${adjQty>=THRESHOLD?'#f59e0b':'#e2e8f0'}`, borderRadius:8, fontSize:14, outline:'none', boxSizing:'border-box' }}/>
              {adjQty >= THRESHOLD && <p style={{ color:'#b45309', fontSize:12, margin:'4px 0 0 0' }}>⚠️ Large adjustment — CEO approval required</p>}
            </div>
            <div style={{ gridColumn:'1/-1' }}>
              <label style={{ display:'block', fontSize:13, fontWeight:600, color:'#374151', marginBottom:10 }}>Adjustment Type *</label>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10 }}>
                {ADJUSTMENT_TYPES.map(at => (
                  <label key={at.value} style={{ display:'block', padding:'12px 14px', border:`2px solid ${adjType===at.value?'#f97316':'#e2e8f0'}`, borderRadius:8, cursor:'pointer', background:adjType===at.value?'#fff7ed':'white', transition:'all 0.2s' }}>
                    <input type="radio" value={at.value} checked={adjType===at.value} onChange={()=>setAdjType(at.value)} style={{display:'none'}}/>
                    <div style={{ fontWeight:700, fontSize:13, color:adjType===at.value?'#ea580c':'#1e293b', marginBottom:4 }}>{at.label}</div>
                    <div style={{ fontSize:12, color:'#64748b' }}>{at.desc}</div>
                  </label>
                ))}
              </div>
            </div>
            <div style={{ gridColumn:'1/-1' }}>
              <label style={{ display:'block', fontSize:13, fontWeight:600, color:'#374151', marginBottom:6 }}>Reason * <span style={{ fontSize:12, fontWeight:400, color:'#94a3b8' }}>(Required — stored permanently in audit log)</span></label>
              <textarea value={reason} onChange={e=>setReason(e.target.value)} rows={3} placeholder="Describe the reason for this adjustment in detail..."
                style={{ width:'100%', padding:'10px 12px', border:`1px solid ${reason.trim()?'#10b981':'#e2e8f0'}`, borderRadius:8, fontSize:14, outline:'none', resize:'vertical', boxSizing:'border-box' }}/>
            </div>
            <div>
              <label style={{ display:'block', fontSize:13, fontWeight:600, color:'#374151', marginBottom:6 }}>Adjustment Date</label>
              <input type="date" value={date} onChange={e=>setDate(e.target.value)} style={{ width:'100%', padding:'10px 12px', border:'1px solid #e2e8f0', borderRadius:8, fontSize:14, outline:'none' }}/>
            </div>
            <div>
              <label style={{ display:'block', fontSize:13, fontWeight:600, color:'#374151', marginBottom:6 }}>Manager Name</label>
              <input type="text" value={approvedBy} onChange={e=>setApprovedBy(e.target.value)} style={{ width:'100%', padding:'10px 12px', border:'1px solid #e2e8f0', borderRadius:8, fontSize:14, outline:'none', boxSizing:'border-box' }}/>
            </div>
          </div>
          <div style={{ marginTop:20, display:'flex', alignItems:'center', gap:16 }}>
            <button onClick={handleSubmit} disabled={!canSubmit||submitting}
              style={{ padding:'12px 32px', background:canSubmit?'#f97316':'#e2e8f0', color:canSubmit?'white':'#94a3b8', border:'none', borderRadius:9, fontWeight:700, fontSize:15, cursor:canSubmit?'pointer':'not-allowed' }}>
              {submitting ? '⏳ Processing...' : isLarge ? '📤 Submit for CEO Approval' : '✅ Apply Adjustment'}
            </button>
            {isLarge && canSubmit && <span style={{ fontSize:13, color:'#b45309', fontWeight:600 }}>⚠️ Will be sent to CEO for approval first</span>}
          </div>
        </div>
      )}

      {/* Audit Log */}
      <div style={{ background:'white', borderRadius:12, border:'1px solid #e2e8f0', overflow:'hidden' }}>
        <div style={{ padding:'14px 20px', borderBottom:'1px solid #e2e8f0', background:'#f8fafc' }}>
          <h3 style={{ margin:0, fontSize:15, fontWeight:700 }}>Audit Log — Immutable Adjustment History</h3>
          <p style={{ margin:'4px 0 0 0', fontSize:12, color:'#94a3b8' }}>Every adjustment is permanently recorded and cannot be edited or deleted.</p>
        </div>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:14 }}>
            <thead>
              <tr style={{ background:'#f8fafc', borderBottom:'2px solid #e2e8f0' }}>
                {['Adj #','Drug','Type','Qty','Reason','Status','By','Date'].map(h => (
                  <th key={h} style={{ padding:'10px 14px', textAlign:'left', fontWeight:700, color:'#475569', fontSize:12, textTransform:'uppercase', whiteSpace:'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {auditLog.map(row => {
                const sc = STATUS_COLORS[row.status] || { bg:'#f1f5f9', color:'#475569' };
                return (
                  <tr key={row.id} style={{ borderBottom:'1px solid #f1f5f9' }}>
                    <td style={{ padding:'11px 14px', fontFamily:'monospace', color:'#224f94', fontWeight:600 }}>{row.id}</td>
                    <td style={{ padding:'11px 14px', fontWeight:600 }}>{row.drug}</td>
                    <td style={{ padding:'11px 14px', color:'#64748b' }}>{row.type}</td>
                    <td style={{ padding:'11px 14px', fontWeight:700 }}>{row.qty}</td>
                    <td style={{ padding:'11px 14px', color:'#64748b', maxWidth:200, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{row.reason}</td>
                    <td style={{ padding:'11px 14px' }}><span style={{ padding:'3px 10px', borderRadius:12, fontSize:12, fontWeight:700, background:sc.bg, color:sc.color }}>{row.status}</span></td>
                    <td style={{ padding:'11px 14px', color:'#64748b' }}>{row.by}</td>
                    <td style={{ padding:'11px 14px', color:'#64748b', whiteSpace:'nowrap' }}>{row.date}</td>
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

export default PharmacyStockAdjustment;
