import React, { useState, useEffect } from 'react';
import { RefreshCw, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

const BRANCHES = ['Branch A', 'Branch B', 'Branch C', 'Main Pharmacy'];

const MOCK_INVENTORY = [
  { id:1, name:'Amoxicillin 500mg',    branch:'Branch A', stock:120, reorder:20,  cost:200, status:'ok' },
  { id:2, name:'Amoxicillin 500mg',    branch:'Branch B', stock:5,   reorder:20,  cost:200, status:'low' },
  { id:3, name:'Paracetamol 500mg',    branch:'Branch A', stock:0,   reorder:30,  cost:40,  status:'out' },
  { id:4, name:'Paracetamol 500mg',    branch:'Branch C', stock:80,  reorder:30,  cost:40,  status:'ok' },
  { id:5, name:'Metformin 500mg',      branch:'Main Pharmacy', stock:45, reorder:15, cost:120, status:'ok' },
  { id:6, name:'Atorvastatin 10mg',    branch:'Branch A', stock:8,   reorder:10,  cost:300, status:'low' },
  { id:7, name:'Atorvastatin 10mg',    branch:'Branch B', stock:70,  reorder:10,  cost:300, status:'ok' },
  { id:8, name:'Ciprofloxacin 500mg',  branch:'Branch C', stock:0,   reorder:25,  cost:250, status:'out' },
  { id:9, name:'Omeprazole 20mg',      branch:'Branch A', stock:200, reorder:20,  cost:160, status:'ok' },
  { id:10, name:'Salbutamol Inhaler',  branch:'Main Pharmacy', stock:12, reorder:15, cost:550, status:'low' },
  { id:11, name:'Lisinopril 10mg',     branch:'Branch B', stock:60,  reorder:30,  cost:140, status:'ok' },
  { id:12, name:'Ibuprofen 400mg',     branch:'Branch C', stock:3,   reorder:40,  cost:60,  status:'low' },
];

const STATUS_CFG = {
  ok:  { bg:'#dcfce7', color:'#166534', icon:<CheckCircle size={13}/>, label:'OK' },
  low: { bg:'#fef3c7', color:'#92400e', icon:<AlertTriangle size={13}/>, label:'LOW' },
  out: { bg:'#fee2e2', color:'#991b1b', icon:<XCircle size={13}/>, label:'OUT' },
};

const PharmacyInventoryView = () => {
  const [inventory, setInventory] = useState(MOCK_INVENTORY);
  const [branchFilter, setBranchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const doRefresh = () => {
    setRefreshing(true);
    setTimeout(() => { setLastRefresh(new Date()); setRefreshing(false); }, 800);
  };

  useEffect(() => {
    if (!autoRefresh) return;
    const t = setInterval(doRefresh, 30000);
    return () => clearInterval(t);
  }, [autoRefresh]);

  const filtered = inventory.filter(r => {
    if (branchFilter && r.branch !== branchFilter) return false;
    if (statusFilter && r.status !== statusFilter) return false;
    return true;
  });

  const lowCount  = inventory.filter(r => r.status === 'low').length;
  const outCount  = inventory.filter(r => r.status === 'out').length;
  const okCount   = inventory.filter(r => r.status === 'ok').length;
  const totalVal  = inventory.reduce((s,r) => s + r.stock*r.cost, 0);

  const sel = { padding:'8px 12px', border:'1px solid #e2e8f0', borderRadius:8, fontSize:13, color:'#374151', background:'white', outline:'none', cursor:'pointer' };

  return (
    <div style={{ padding:24, fontFamily:"'Inter',sans-serif", background:'#f8fafc', minHeight:'100vh' }}>
      <div style={{ marginBottom:24 }}>
        <h1 style={{ fontSize:26, fontWeight:800, margin:'0 0 4px 0' }}>📦 INVENTORY</h1>
        <p style={{ color:'#64748b', margin:0, fontSize:14 }}>🔗 View Pharmacy Inventory — Real-Time Per-Branch Stock View (Read-Only)</p>
      </div>

      {/* Summary Cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, marginBottom:24 }}>
        {[
          { label:'Total Stock Value', value:`ETB ${totalVal.toLocaleString()}`, color:'#2563eb', bg:'#eff6ff' },
          { label:'OK Lines', value:okCount, color:'#059669', bg:'#dcfce7' },
          { label:'Low Stock Lines', value:lowCount, color:'#b45309', bg:'#fef3c7' },
          { label:'Out of Stock Lines', value:outCount, color:'#dc2626', bg:'#fee2e2' },
        ].map(c => (
          <div key={c.label} style={{ background:c.bg, borderRadius:10, padding:'18px 20px', border:`1px solid ${c.color}30` }}>
            <div style={{ fontSize:13, color:c.color, fontWeight:700, marginBottom:6, textTransform:'uppercase' }}>{c.label}</div>
            <div style={{ fontSize:26, fontWeight:900, color:c.color }}>{c.value}</div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div style={{ display:'flex', gap:12, marginBottom:16, flexWrap:'wrap', alignItems:'center' }}>
        <select value={branchFilter} onChange={e=>setBranchFilter(e.target.value)} style={sel}>
          <option value="">All Branches</option>
          {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
        </select>
        <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} style={sel}>
          <option value="">All Status</option>
          <option value="ok">OK</option>
          <option value="low">Low Stock</option>
          <option value="out">Out of Stock</option>
        </select>
        <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:12 }}>
          <label style={{ display:'flex', alignItems:'center', gap:6, fontSize:13, color:'#64748b', cursor:'pointer' }}>
            <input type="checkbox" checked={autoRefresh} onChange={e=>setAutoRefresh(e.target.checked)}/>
            Auto-refresh (30s)
          </label>
          <button onClick={doRefresh} style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 14px', background:'#224f94', color:'white', border:'none', borderRadius:8, cursor:'pointer', fontSize:13, fontWeight:600 }}>
            <RefreshCw size={14} style={{ animation:refreshing?'spin 1s linear infinite':'none' }}/> Refresh
          </button>
          <span style={{ fontSize:12, color:'#94a3b8' }}>Last: {lastRefresh.toLocaleTimeString()}</span>
        </div>
      </div>

      {/* Branch-wise table */}
      <div style={{ background:'white', borderRadius:12, border:'1px solid #e2e8f0', overflow:'hidden', boxShadow:'0 1px 3px rgba(0,0,0,0.05)' }}>
        <div style={{ padding:'12px 20px', borderBottom:'1px solid #e2e8f0', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <span style={{ fontWeight:700 }}>Branch-wise Stock Levels</span>
          <span style={{ fontSize:13, color:'#64748b' }}>{filtered.length} lines shown</span>
        </div>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:14 }}>
            <thead>
              <tr style={{ background:'#f8fafc', borderBottom:'2px solid #e2e8f0' }}>
                {['Drug Name','Branch','Current Stock','Reorder Level','Stock Value (ETB)','Status'].map(h => (
                  <th key={h} style={{ padding:'11px 14px', textAlign:'left', fontWeight:700, color:'#475569', fontSize:12, textTransform:'uppercase', whiteSpace:'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(row => {
                const cfg = STATUS_CFG[row.status];
                const rowBg = row.status==='out'?'#fef2f2':row.status==='low'?'#fffbeb':'white';
                return (
                  <tr key={row.id} style={{ borderBottom:'1px solid #f1f5f9', background:rowBg }}>
                    <td style={{ padding:'12px 14px', fontWeight:600 }}>
                      {row.status!=='ok' && <AlertTriangle size={14} style={{ display:'inline', marginRight:5, color:row.status==='out'?'#ef4444':'#f59e0b', verticalAlign:'middle' }}/>}
                      {row.name}
                    </td>
                    <td style={{ padding:'12px 14px' }}>
                      <span style={{ padding:'2px 10px', background:'#eff6ff', color:'#2563eb', borderRadius:10, fontSize:12, fontWeight:600 }}>{row.branch}</span>
                    </td>
                    <td style={{ padding:'12px 14px', fontWeight:700, fontSize:16 }}>{row.stock}</td>
                    <td style={{ padding:'12px 14px', color:'#64748b' }}>{row.reorder}</td>
                    <td style={{ padding:'12px 14px' }}>{(row.stock*row.cost).toLocaleString()}</td>
                    <td style={{ padding:'12px 14px' }}>
                      <span style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'4px 10px', borderRadius:12, fontSize:12, fontWeight:700, background:cfg.bg, color:cfg.color }}>
                        {cfg.icon} {cfg.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      <style>{`@keyframes spin{100%{transform:rotate(360deg);}}`}</style>
    </div>
  );
};

export default PharmacyInventoryView;
