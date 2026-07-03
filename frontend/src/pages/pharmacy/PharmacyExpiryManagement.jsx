import React, { useState } from 'react';
import { Printer, AlertTriangle, XCircle, CheckCircle } from 'lucide-react';

const today = new Date();
const daysFrom = (d) => Math.ceil((new Date(d)-today)/(1000*86400));

const DRUGS = [
  { id:1, name:'Amoxicillin 500mg',   batch:'BATCH-A001', expiry:'2026-07-25', qty:15, branch:'Branch A', status:'reported', ceoStatus:'pending' },
  { id:2, name:'Metformin 500mg',     batch:'BATCH-A003', expiry:'2025-12-01', qty:30, branch:'Main Pharmacy', status:'expired', ceoStatus:'approved' },
  { id:3, name:'Amlodipine 5mg',      batch:'BATCH-A008', expiry:'2025-11-15', qty:8,  branch:'Branch B', status:'expired', ceoStatus:'pending' },
  { id:4, name:'Ciprofloxacin 500mg', batch:'BATCH-A006', expiry:'2026-07-20', qty:20, branch:'Branch C', status:'expiring', ceoStatus:null },
  { id:5, name:'Salbutamol Inhaler',  batch:'BATCH-A010', expiry:'2026-07-15', qty:5,  branch:'Branch A', status:'expiring', ceoStatus:null },
];

const WINDOW_OPTIONS = [30, 60, 90];

const PharmacyExpiryManagement = () => {
  const [drugs, setDrugs] = useState(DRUGS);
  const [lookAhead, setLookAhead] = useState(30);
  const [reportForm, setReportForm] = useState(null);
  const [reportReason, setReportReason] = useState('');
  const [reportSuccess, setReportSuccess] = useState(false);
  const [removing, setRemoving] = useState(null);

  const expiredDrugs = drugs.filter(d => new Date(d.expiry) < today);
  const expiringDrugs = drugs.filter(d => {
    const days = daysFrom(d.expiry);
    return days >= 0 && days <= lookAhead;
  });

  const handleReport = (drug) => { setReportForm(drug); setReportReason(''); setReportSuccess(false); };

  const submitReport = () => {
    setDrugs(prev => prev.map(d => d.id===reportForm.id ? {...d, status:'reported', ceoStatus:'pending'} : d));
    setReportSuccess(true);
    setTimeout(() => { setReportForm(null); }, 1800);
  };

  const handleRemove = (drug) => {
    if (drug.ceoStatus !== 'approved') return;
    setRemoving(drug.id);
    setTimeout(() => {
      setDrugs(prev => prev.filter(d => d.id !== drug.id));
      setRemoving(null);
    }, 1000);
  };

  const handlePrint = (drug) => {
    const w = window.open('','_blank');
    w.document.write(`<!DOCTYPE html><html><head><title>Expiry Report</title>
    <style>body{font-family:Arial,sans-serif;padding:30px;}.stamp{margin-top:60px;border-top:2px solid #000;padding-top:10px;width:200px;text-align:center;}</style>
    </head><body>
    <h1>📅 EXPIRY REPORT</h1>
    <p><strong>Drug:</strong> ${drug.name} &nbsp;&nbsp; <strong>Batch:</strong> ${drug.batch}</p>
    <p><strong>Expiry Date:</strong> ${drug.expiry} &nbsp;&nbsp; <strong>Quantity:</strong> ${drug.qty}</p>
    <p><strong>Branch:</strong> ${drug.branch} &nbsp;&nbsp; <strong>Status:</strong> ${drug.status}</p>
    <p><strong>CEO Approval:</strong> ${drug.ceoStatus==='approved'?'APPROVED':'Pending'}</p>
    <p><strong>Reported By:</strong> Pharmacy Manager &nbsp;&nbsp; <strong>Date:</strong> ${today.toISOString().split('T')[0]}</p>
    <div class="stamp"><p>Manager Stamp Area</p><p style="margin-top:40px;">______________________</p><p>CEO Approval: ______________________</p></div>
    </body></html>`);
    w.document.close(); w.print();
  };

  const CEO_BADGE = { pending:{ bg:'#fef3c7',color:'#92400e',label:'Pending CEO' }, approved:{ bg:'#dcfce7',color:'#166534',label:'CEO Approved' }, null:{ bg:'#f1f5f9',color:'#64748b',label:'Not Reported' } };

  const Section = ({ title, icon, data, colorBar }) => (
    <div style={{ background:'white', borderRadius:12, border:'1px solid #e2e8f0', overflow:'hidden', marginBottom:20 }}>
      <div style={{ padding:'14px 20px', borderBottom:'1px solid #e2e8f0', background:'#f8fafc', display:'flex', alignItems:'center', gap:8 }}>
        {icon}<h3 style={{ margin:0, fontSize:15, fontWeight:700 }}>{title}</h3>
        <span style={{ marginLeft:'auto', background:colorBar, color:'white', padding:'2px 10px', borderRadius:12, fontSize:12, fontWeight:700 }}>{data.length}</span>
      </div>
      {data.length === 0 ? (
        <div style={{ padding:32, textAlign:'center', color:'#94a3b8' }}><CheckCircle size={32} color="#10b981" style={{ marginBottom:8, display:'block', margin:'0 auto 8px' }}/>None found.</div>
      ) : (
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:14 }}>
            <thead>
              <tr style={{ background:'#f8fafc', borderBottom:'2px solid #e2e8f0' }}>
                {['Drug Name','Batch','Expiry Date','Days Left','Qty','Branch','CEO Status','Actions'].map(h => (
                  <th key={h} style={{ padding:'10px 14px', textAlign:'left', fontWeight:700, color:'#475569', fontSize:12, textTransform:'uppercase', whiteSpace:'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map(drug => {
                const days = daysFrom(drug.expiry);
                const ceoBadge = CEO_BADGE[drug.ceoStatus] || CEO_BADGE[null];
                return (
                  <tr key={drug.id} style={{ borderBottom:'1px solid #f1f5f9', background: days<0?'#fef2f2':days<=7?'#fffbeb':'white' }}>
                    <td style={{ padding:'11px 14px', fontWeight:600 }}>{drug.name}</td>
                    <td style={{ padding:'11px 14px', fontFamily:'monospace', color:'#64748b', fontSize:13 }}>{drug.batch}</td>
                    <td style={{ padding:'11px 14px' }}>{drug.expiry}</td>
                    <td style={{ padding:'11px 14px', fontWeight:700, color:days<0?'#dc2626':days<=7?'#f59e0b':'#64748b' }}>
                      {days < 0 ? `${Math.abs(days)}d overdue` : `${days}d`}
                    </td>
                    <td style={{ padding:'11px 14px', fontWeight:700 }}>{drug.qty}</td>
                    <td style={{ padding:'11px 14px' }}>{drug.branch}</td>
                    <td style={{ padding:'11px 14px' }}>
                      <span style={{ padding:'3px 10px', borderRadius:12, fontSize:12, fontWeight:700, background:ceoBadge.bg, color:ceoBadge.color }}>{ceoBadge.label}</span>
                    </td>
                    <td style={{ padding:'11px 14px' }}>
                      <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                        {!drug.ceoStatus && (
                          <button onClick={()=>handleReport(drug)} style={{ padding:'4px 10px', background:'#ef4444', color:'white', border:'none', borderRadius:6, fontSize:12, cursor:'pointer', fontWeight:600 }}>
                            📋 Report to CEO
                          </button>
                        )}
                        {drug.ceoStatus==='approved' && (
                          <button onClick={()=>handleRemove(drug)} disabled={removing===drug.id}
                            style={{ padding:'4px 10px', background:removing===drug.id?'#e2e8f0':'#dc2626', color:removing===drug.id?'#94a3b8':'white', border:'none', borderRadius:6, fontSize:12, cursor:removing===drug.id?'wait':'pointer', fontWeight:600 }}>
                            {removing===drug.id ? '⏳ Removing...' : '🗑 Remove'}
                          </button>
                        )}
                        <button onClick={()=>handlePrint(drug)} style={{ padding:'4px 10px', background:'#224f94', color:'white', border:'none', borderRadius:6, fontSize:12, cursor:'pointer', fontWeight:600 }}>
                          <Printer size={11} style={{display:'inline'}}/> Print
                        </button>
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
  );

  return (
    <div style={{ padding:24, fontFamily:"'Inter',sans-serif", background:'#f8fafc', minHeight:'100vh' }}>
      <div style={{ marginBottom:24 }}>
        <h1 style={{ fontSize:26, fontWeight:800, margin:'0 0 4px 0' }}>📅 EXPIRY MANAGEMENT</h1>
        <p style={{ color:'#64748b', margin:0, fontSize:14 }}>🔗 Manage Expired &amp; Expiring Drugs — Full Flow 4 B4 Implementation</p>
      </div>

      <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:20 }}>
        <label style={{ fontSize:14, fontWeight:600, color:'#374151' }}>Look-Ahead Window:</label>
        <div style={{ display:'flex', gap:8 }}>
          {WINDOW_OPTIONS.map(w => (
            <button key={w} onClick={()=>setLookAhead(w)}
              style={{ padding:'7px 18px', border:`2px solid ${lookAhead===w?'#224f94':'#e2e8f0'}`, borderRadius:8, background:lookAhead===w?'#224f94':'white', color:lookAhead===w?'white':'#64748b', fontWeight:700, cursor:'pointer', fontSize:13 }}>
              {w} Days
            </button>
          ))}
        </div>
      </div>

      <Section title={`Expiring Soon (within ${lookAhead} days)`} icon={<AlertTriangle size={18} color="#f59e0b"/>} data={expiringDrugs} colorBar="#f59e0b"/>
      <Section title="Expired Drugs" icon={<XCircle size={18} color="#ef4444"/>} data={expiredDrugs} colorBar="#ef4444"/>

      {/* Report Modal */}
      {reportForm && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.55)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}>
          <div style={{ background:'white', borderRadius:14, padding:32, width:480, boxShadow:'0 25px 60px rgba(0,0,0,0.25)' }}>
            {reportSuccess ? (
              <div style={{ textAlign:'center', padding:20 }}>
                <CheckCircle size={56} color="#10b981" style={{ marginBottom:12 }}/>
                <h3 style={{ color:'#059669', margin:'0 0 8px 0' }}>Report Sent to CEO!</h3>
                <p style={{ color:'#64748b', margin:0 }}>CEO, Store Manager &amp; Finance Manager have been notified simultaneously.</p>
              </div>
            ) : (
              <>
                <h3 style={{ margin:'0 0 4px 0', color:'#1e293b' }}>📋 Report Expired Drug to CEO</h3>
                <p style={{ color:'#64748b', margin:'0 0 20px 0', fontSize:14 }}>Drug: <strong>{reportForm.name}</strong> — Expiry: {reportForm.expiry} — Qty: {reportForm.qty}</p>
                <div style={{ background:'#fffbeb', border:'1px solid #fbbf24', borderRadius:8, padding:'10px 14px', marginBottom:16, fontSize:13, color:'#92400e' }}>
                  ⚠️ This will notify CEO, Store Manager, and Finance Manager simultaneously. Removal requires CEO approval.
                </div>
                <label style={{ display:'block', fontSize:13, fontWeight:600, color:'#374151', marginBottom:6 }}>Action Requested / Notes *</label>
                <textarea value={reportReason} onChange={e=>setReportReason(e.target.value)} rows={3} placeholder="Describe the action requested (disposal, return to supplier, etc.)..."
                  style={{ width:'100%', padding:'10px 12px', border:'1px solid #e2e8f0', borderRadius:8, fontSize:13, outline:'none', resize:'vertical', boxSizing:'border-box', marginBottom:20 }}/>
                <div style={{ display:'flex', gap:12 }}>
                  <button onClick={submitReport} disabled={!reportReason.trim()}
                    style={{ flex:1, padding:'11px', background:reportReason.trim()?'#ef4444':'#e2e8f0', color:reportReason.trim()?'white':'#94a3b8', border:'none', borderRadius:8, fontWeight:700, cursor:reportReason.trim()?'pointer':'not-allowed' }}>
                    📤 Submit Report to CEO
                  </button>
                  <button onClick={()=>setReportForm(null)} style={{ flex:1, padding:'11px', background:'#f1f5f9', color:'#64748b', border:'none', borderRadius:8, fontWeight:700, cursor:'pointer' }}>Cancel</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PharmacyExpiryManagement;
