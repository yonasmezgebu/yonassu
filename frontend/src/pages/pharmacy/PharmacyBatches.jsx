import React, { useState } from 'react';
import { Layers, AlertTriangle, Search, Filter } from 'lucide-react';

const BATCHES = [
  { id:'BAT-001', drug:'Amoxicillin 500mg', batchNo:'BATCH-A001', received:'2026-06-01', expiry:'2026-07-25', qty:500, available:120, supplier:'Ethio Pharma', status:'active' },
  { id:'BAT-002', drug:'Paracetamol 500mg', batchNo:'BATCH-A002', received:'2026-05-15', expiry:'2027-05-15', qty:1000, available:800, supplier:'Medipharm', status:'active' },
  { id:'BAT-003', drug:'Metformin 500mg',   batchNo:'BATCH-A003', received:'2025-10-10', expiry:'2025-12-01', qty:300, available:30, supplier:'HealthCare Supplies', status:'expired' },
  { id:'BAT-004', drug:'Atorvastatin 10mg', batchNo:'BATCH-A004', received:'2026-06-20', expiry:'2027-12-31', qty:400, available:400, supplier:'Ethio Pharma', status:'active' },
];

const PharmacyBatches = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = BATCHES.filter(b => {
    if (search && !b.drug.toLowerCase().includes(search.toLowerCase()) && !b.batchNo.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter !== 'all' && b.status !== statusFilter) return false;
    return true;
  });

  return (
    <div style={{ padding:24, fontFamily:"'Inter',sans-serif", background:'#f8fafc', minHeight:'100vh' }}>
      <div style={{ marginBottom:24 }}>
        <h1 style={{ fontSize:26, fontWeight:800, margin:'0 0 4px 0', display:'flex', alignItems:'center', gap:10 }}><Layers size={28} color="#14b8a6"/> BATCH MANAGEMENT</h1>
        <p style={{ color:'#64748b', margin:0, fontSize:14 }}>🔗 Track Drug Batches, Suppliers, and Expiries</p>
      </div>

      <div style={{ display:'flex', gap:12, marginBottom:20 }}>
        <div style={{ position:'relative', flex:1, maxWidth:400 }}>
          <Search size={16} color="#94a3b8" style={{ position:'absolute', left:12, top:10, pointerEvents:'none' }}/>
          <input type="text" placeholder="Search drug name or batch no..." value={search} onChange={e=>setSearch(e.target.value)}
            style={{ width:'100%', padding:'9px 14px 9px 36px', border:'1px solid #e2e8f0', borderRadius:8, fontSize:14, outline:'none', boxSizing:'border-box' }}/>
        </div>
        <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} style={{ padding:'9px 12px', border:'1px solid #e2e8f0', borderRadius:8, fontSize:14, outline:'none', background:'white' }}>
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="expired">Expired</option>
        </select>
      </div>

      <div style={{ background:'white', borderRadius:12, border:'1px solid #e2e8f0', overflow:'hidden' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:14 }}>
          <thead>
            <tr style={{ background:'#f8fafc', borderBottom:'2px solid #e2e8f0' }}>
              {['Batch No','Drug','Supplier','Received','Expiry','Original Qty','Available Qty','Status'].map(h => (
                <th key={h} style={{ padding:'12px 16px', textAlign:'left', fontWeight:700, color:'#475569', fontSize:12, textTransform:'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(b => (
              <tr key={b.id} style={{ borderBottom:'1px solid #f1f5f9' }}>
                <td style={{ padding:'12px 16px', fontWeight:700, fontFamily:'monospace', color:'#14b8a6' }}>{b.batchNo}</td>
                <td style={{ padding:'12px 16px', fontWeight:600 }}>{b.drug}</td>
                <td style={{ padding:'12px 16px', color:'#64748b' }}>{b.supplier}</td>
                <td style={{ padding:'12px 16px' }}>{b.received}</td>
                <td style={{ padding:'12px 16px', color:b.status==='expired'?'#dc2626':'#1e293b' }}>{b.expiry}</td>
                <td style={{ padding:'12px 16px', color:'#64748b' }}>{b.qty}</td>
                <td style={{ padding:'12px 16px', fontWeight:700 }}>{b.available}</td>
                <td style={{ padding:'12px 16px' }}>
                  <span style={{ padding:'3px 10px', borderRadius:12, fontSize:12, fontWeight:700, background:b.status==='expired'?'#fee2e2':'#dcfce7', color:b.status==='expired'?'#dc2626':'#166534' }}>
                    {b.status.toUpperCase()}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PharmacyBatches;
