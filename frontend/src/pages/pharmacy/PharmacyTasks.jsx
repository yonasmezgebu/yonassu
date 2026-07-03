import React, { useState } from 'react';
import { CheckCircle, AlertCircle } from 'lucide-react';

const TASKS = [
  { id:1, title:'Verify Pending Transfers', desc:'Check physical count for transfer TRF-003 at Branch B.', status:'pending', priority:'high' },
  { id:2, title:'Review Expiring Drugs', desc:'3 drugs are expiring in the next 30 days.', status:'pending', priority:'medium' },
  { id:3, title:'Monthly Inventory Audit', desc:'Conduct full store audit by end of week.', status:'completed', priority:'high' },
];

const PharmacyTasks = () => {
  return (
    <div style={{ padding:24, fontFamily:"'Inter',sans-serif", background:'#f8fafc', minHeight:'100vh' }}>
      <div style={{ marginBottom:24 }}>
        <h1 style={{ fontSize:26, fontWeight:800, margin:'0 0 4px 0', display:'flex', alignItems:'center', gap:10 }}><CheckCircle size={28} color="#3b82f6"/> PHARMACY TASKS</h1>
        <p style={{ color:'#64748b', margin:0, fontSize:14 }}>🔗 Manage Internal Assignments &amp; Reminders</p>
      </div>

      <div style={{ display:'grid', gap:16 }}>
        {TASKS.map(t => (
          <div key={t.id} style={{ background:'white', borderRadius:12, padding:20, border:'1px solid #e2e8f0', display:'flex', alignItems:'flex-start', gap:16, opacity:t.status==='completed'?0.6:1 }}>
            <div style={{ marginTop:4 }}>
              {t.status==='completed' ? <CheckCircle color="#10b981"/> : <AlertCircle color={t.priority==='high'?'#ef4444':'#f59e0b'}/>}
            </div>
            <div>
              <h3 style={{ margin:'0 0 4px 0', fontSize:16, fontWeight:700 }}>{t.title}</h3>
              <p style={{ margin:'0 0 10px 0', fontSize:14, color:'#64748b' }}>{t.desc}</p>
              <div style={{ display:'flex', gap:10 }}>
                <span style={{ padding:'3px 10px', borderRadius:12, fontSize:12, fontWeight:700, background:'#f1f5f9', color:'#475569', textTransform:'uppercase' }}>{t.priority} PRIORITY</span>
                <span style={{ padding:'3px 10px', borderRadius:12, fontSize:12, fontWeight:700, background:t.status==='completed'?'#dcfce7':'#fef3c7', color:t.status==='completed'?'#166534':'#92400e', textTransform:'uppercase' }}>{t.status}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PharmacyTasks;
