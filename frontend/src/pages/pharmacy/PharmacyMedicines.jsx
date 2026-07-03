import React, { useState, useEffect } from 'react';
import { Search, ChevronUp, ChevronDown, ChevronsUpDown, EyeOff, Loader2, RefreshCw } from 'lucide-react';
import pharmacyService from '../../services/pharmacyService';

const MOCK_DRUGS = [
  { id:1, name:'Amoxicillin 500mg', category:'Antibiotics', price:250, stock:120, reorderLevel:20, expiryDate:'2026-12-31', batchNo:'BATCH-A001', isHidden:false },
  { id:2, name:'Paracetamol 500mg', category:'Analgesics', price:50, stock:5, reorderLevel:30, expiryDate:'2026-06-15', batchNo:'BATCH-A002', isHidden:false },
  { id:3, name:'Metformin 500mg', category:'Diabetics', price:150, stock:0, reorderLevel:15, expiryDate:'2025-12-01', batchNo:'BATCH-A003', isHidden:false },
  { id:4, name:'Atorvastatin 10mg', category:'Cardiovascular', price:350, stock:80, reorderLevel:10, expiryDate:'2027-03-31', batchNo:'BATCH-A004', isHidden:false },
  { id:5, name:'Omeprazole 20mg', category:'GI Medications', price:200, stock:45, reorderLevel:20, expiryDate:'2026-09-30', batchNo:'BATCH-A005', isHidden:false },
  { id:6, name:'Ciprofloxacin 500mg', category:'Antibiotics', price:300, stock:8, reorderLevel:25, expiryDate:'2026-04-20', batchNo:'BATCH-A006', isHidden:false },
  { id:7, name:'Lisinopril 10mg', category:'Cardiovascular', price:180, stock:200, reorderLevel:30, expiryDate:'2027-06-30', batchNo:'BATCH-A007', isHidden:false },
  { id:8, name:'Amlodipine 5mg', category:'Cardiovascular', price:220, stock:0, reorderLevel:20, expiryDate:'2025-11-15', batchNo:'BATCH-A008', isHidden:false },
  { id:9, name:'Ibuprofen 400mg', category:'Analgesics', price:80, stock:150, reorderLevel:40, expiryDate:'2026-08-31', batchNo:'BATCH-A009', isHidden:false },
  { id:10, name:'Salbutamol Inhaler', category:'Respiratory', price:650, stock:12, reorderLevel:15, expiryDate:'2026-07-15', batchNo:'BATCH-A010', isHidden:false },
];

const today = new Date();
const inDays = (d, n) => new Date(d) <= new Date(today.getTime() + n * 86400000);

const getExpiryStatus = d => {
  const exp = new Date(d);
  if (exp < today) return 'expired';
  if (inDays(d, 30)) return 'expiring-soon';
  return 'ok';
};
const getStockStatus = (stock, reorder) => stock === 0 ? 'out' : stock < reorder ? 'low' : 'ok';

const STOCK_BADGE = { ok:{ bg:'#dcfce7',color:'#166534',label:'In Stock' }, low:{ bg:'#fef3c7',color:'#92400e',label:'Low Stock' }, out:{ bg:'#fee2e2',color:'#991b1b',label:'Out of Stock' } };
const EXPIRY_BADGE = { ok:{ bg:'#dcfce7',color:'#166534' }, 'expiring-soon':{ bg:'#fef3c7',color:'#92400e' }, expired:{ bg:'#fee2e2',color:'#991b1b' } };

const Th = ({ col, sortKey, sortDir, onSort, children }) => (
  <th onClick={() => onSort(col)} style={{ padding:'11px 14px', textAlign:'left', fontWeight:700, color:'#475569', fontSize:12, textTransform:'uppercase', cursor:'pointer', userSelect:'none', borderBottom:'2px solid #e2e8f0', whiteSpace:'nowrap', background:'#f8fafc' }}>
    {children}
    <span style={{ marginLeft:4, color:'#94a3b8' }}>
      {sortKey===col ? (sortDir==='asc' ? <ChevronUp size={12} style={{display:'inline'}}/> : <ChevronDown size={12} style={{display:'inline'}}/>) : <ChevronsUpDown size={12} style={{display:'inline'}}/>}
    </span>
  </th>
);

const PharmacyMedicines = () => {
  const [drugs, setDrugs] = useState(MOCK_DRUGS);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [stockFilter, setStockFilter] = useState('');
  const [expiryFilter, setExpiryFilter] = useState('');
  const [sortKey, setSortKey] = useState('name');
  const [sortDir, setSortDir] = useState('asc');
  const [hidingDrug, setHidingDrug] = useState(null);
  const [hideType, setHideType] = useState('');
  const [hideReason, setHideReason] = useState('');
  const [hideSuccess, setHideSuccess] = useState(false);

  useEffect(() => {
    setLoading(true);
    pharmacyService.getProducts?.().then(raw => {
      const list = Array.isArray(raw) ? raw : raw?.products ?? [];
      if (list.length > 0) {
        setDrugs(list.map(p => ({
          id: p.id, name: p.name, category: p.category_name || p.category || 'Uncategorized',
          price: parseFloat(p.price || p.selling_price || 0), stock: parseInt(p.stock_quantity || 0),
          reorderLevel: parseInt(p.reorder_level || 10), expiryDate: p.expiry_date || '2027-01-01',
          batchNo: p.batch_number || '—', isHidden: !!p.is_hidden,
        })));
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const categories = [...new Set(drugs.map(d => d.category))].sort();

  const filtered = drugs.filter(d => {
    const q = search.toLowerCase();
    if (search && !d.name.toLowerCase().includes(q) && !d.category.toLowerCase().includes(q) && !d.batchNo.toLowerCase().includes(q)) return false;
    if (catFilter && d.category !== catFilter) return false;
    if (stockFilter && getStockStatus(d.stock, d.reorderLevel) !== stockFilter) return false;
    if (expiryFilter && getExpiryStatus(d.expiryDate) !== expiryFilter) return false;
    return true;
  }).sort((a, b) => {
    let va = a[sortKey] ?? '', vb = b[sortKey] ?? '';
    if (typeof va === 'string') { va = va.toLowerCase(); vb = vb.toLowerCase(); }
    return va < vb ? (sortDir==='asc'?-1:1) : va > vb ? (sortDir==='asc'?1:-1) : 0;
  });

  const onSort = key => { setSortKey(key); setSortDir(prev => key===sortKey ? (prev==='asc'?'desc':'asc') : 'asc'); };

  const doHide = () => {
    setDrugs(prev => prev.map(d => d.id===hidingDrug.id ? {...d, isHidden:true, hideType, hideReason} : d));
    setHideSuccess(true);
    setTimeout(() => { setHidingDrug(null); setHideSuccess(false); setHideType(''); setHideReason(''); }, 1500);
  };

  const sel = { padding:'9px 12px', border:'1px solid #e2e8f0', borderRadius:8, fontSize:14, color:'#374151', background:'white', outline:'none', cursor:'pointer' };

  return (
    <div style={{ padding:24, fontFamily:"'Inter',sans-serif", color:'#1e293b', minHeight:'100vh', background:'#f8fafc' }}>
      <div style={{ marginBottom:24 }}>
        <h1 style={{ fontSize:26, fontWeight:800, margin:'0 0 4px 0', display:'flex', alignItems:'center', gap:10 }}>💊 MEDICINES</h1>
        <p style={{ color:'#64748b', margin:0, fontSize:14 }}>🔗 View All Medicines — Complete Drug Catalog (Read-Only)</p>
      </div>

      {/* Filters */}
      <div style={{ display:'flex', gap:10, marginBottom:20, flexWrap:'wrap' }}>
        <div style={{ position:'relative', flex:1, minWidth:220 }}>
          <Search size={16} color="#94a3b8" style={{ position:'absolute', left:12, top:11, pointerEvents:'none' }}/>
          <input type="text" placeholder="Search by name, category, batch number..." value={search} onChange={e=>setSearch(e.target.value)}
            style={{ width:'100%', padding:'9px 14px 9px 36px', border:'1px solid #e2e8f0', borderRadius:8, fontSize:14, outline:'none', boxSizing:'border-box' }}/>
        </div>
        <select value={catFilter} onChange={e=>setCatFilter(e.target.value)} style={sel}>
          <option value="">All Categories</option>
          {categories.map(c=><option key={c} value={c}>{c}</option>)}
        </select>
        <select value={stockFilter} onChange={e=>setStockFilter(e.target.value)} style={sel}>
          <option value="">All Stock Levels</option>
          <option value="ok">In Stock (OK)</option>
          <option value="low">Low Stock</option>
          <option value="out">Out of Stock</option>
        </select>
        <select value={expiryFilter} onChange={e=>setExpiryFilter(e.target.value)} style={sel}>
          <option value="">All Expiry Status</option>
          <option value="ok">Expiry OK</option>
          <option value="expiring-soon">Expiring Soon (≤30 days)</option>
          <option value="expired">Expired</option>
        </select>
        <button onClick={()=>{setSearch('');setCatFilter('');setStockFilter('');setExpiryFilter('');}} style={{ ...sel, background:'#f1f5f9', color:'#64748b' }} title="Reset filters">
          <RefreshCw size={16}/>
        </button>
      </div>

      {/* Active filter chips */}
      {(search||catFilter||stockFilter||expiryFilter) && (
        <div style={{ display:'flex', gap:8, marginBottom:14, flexWrap:'wrap' }}>
          {search && <span style={{ padding:'3px 10px', background:'#eff6ff', color:'#2563eb', borderRadius:12, fontSize:12, fontWeight:600 }}>Search: "{search}"</span>}
          {catFilter && <span style={{ padding:'3px 10px', background:'#eff6ff', color:'#2563eb', borderRadius:12, fontSize:12, fontWeight:600 }}>Category: {catFilter}</span>}
          {stockFilter && <span style={{ padding:'3px 10px', background:'#eff6ff', color:'#2563eb', borderRadius:12, fontSize:12, fontWeight:600 }}>Stock: {stockFilter}</span>}
          {expiryFilter && <span style={{ padding:'3px 10px', background:'#eff6ff', color:'#2563eb', borderRadius:12, fontSize:12, fontWeight:600 }}>Expiry: {expiryFilter}</span>}
        </div>
      )}

      <div style={{ background:'white', borderRadius:12, border:'1px solid #e2e8f0', overflow:'hidden', boxShadow:'0 1px 3px rgba(0,0,0,0.05)' }}>
        <div style={{ padding:'14px 20px', borderBottom:'1px solid #e2e8f0', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <span style={{ fontWeight:700, color:'#1e293b' }}>Drug Catalog</span>
          <span style={{ fontSize:13, color:'#64748b' }}>
            {loading ? <Loader2 size={14} style={{display:'inline', animation:'spin 1s linear infinite'}}/> : `${filtered.length} of ${drugs.length} drugs`}
          </span>
        </div>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:14 }}>
            <thead>
              <tr>
                <Th col="name" sortKey={sortKey} sortDir={sortDir} onSort={onSort}>Drug Name</Th>
                <Th col="category" sortKey={sortKey} sortDir={sortDir} onSort={onSort}>Category</Th>
                <Th col="price" sortKey={sortKey} sortDir={sortDir} onSort={onSort}>Price (ETB)</Th>
                <Th col="stock" sortKey={sortKey} sortDir={sortDir} onSort={onSort}>Stock</Th>
                <Th col="expiryDate" sortKey={sortKey} sortDir={sortDir} onSort={onSort}>Expiry Date</Th>
                <Th col="batchNo" sortKey={sortKey} sortDir={sortDir} onSort={onSort}>Batch Number</Th>
                <th style={{ padding:'11px 14px', borderBottom:'2px solid #e2e8f0', background:'#f8fafc', fontSize:12, fontWeight:700, color:'#475569', textTransform:'uppercase' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign:'center', padding:48, color:'#94a3b8' }}>No drugs match your search or filter criteria.</td></tr>
              ) : filtered.map(drug => {
                const ss = getStockStatus(drug.stock, drug.reorderLevel);
                const es = getExpiryStatus(drug.expiryDate);
                const sb = STOCK_BADGE[ss], eb = EXPIRY_BADGE[es];
                return (
                  <tr key={drug.id} style={{ borderBottom:'1px solid #f1f5f9', background: drug.isHidden?'#faf5ff': es==='expired'||ss==='out'?'#fef2f2':'white', transition:'background 0.15s' }}>
                    <td style={{ padding:'12px 14px', fontWeight:600 }}>{drug.name}{drug.isHidden&&<span style={{marginLeft:8,fontSize:11,background:'#f3e8ff',color:'#7c3aed',padding:'2px 6px',borderRadius:4}}>Hidden</span>}</td>
                    <td style={{ padding:'12px 14px', color:'#64748b' }}>{drug.category}</td>
                    <td style={{ padding:'12px 14px' }}>{drug.price.toFixed(2)}</td>
                    <td style={{ padding:'12px 14px' }}>
                      <span style={{ padding:'3px 10px', borderRadius:12, fontSize:12, fontWeight:700, background:sb.bg, color:sb.color }}>{drug.stock} — {sb.label}</span>
                    </td>
                    <td style={{ padding:'12px 14px' }}>
                      <span style={{ padding:'3px 10px', borderRadius:12, fontSize:12, fontWeight:700, background:eb.bg, color:eb.color }}>
                        {drug.expiryDate} {es==='expiring-soon'?'⚠️':es==='expired'?'🚫':''}
                      </span>
                    </td>
                    <td style={{ padding:'12px 14px', fontFamily:'monospace', fontSize:13, color:'#64748b' }}>{drug.batchNo}</td>
                    <td style={{ padding:'12px 14px' }}>
                      <button onClick={()=>{setHidingDrug(drug);setHideType('');setHideReason('');}} disabled={drug.isHidden}
                        style={{ padding:'5px 12px', background:drug.isHidden?'#e2e8f0':'#8B5CF6', color:drug.isHidden?'#94a3b8':'white', border:'none', borderRadius:6, cursor:drug.isHidden?'not-allowed':'pointer', fontSize:12, fontWeight:600, display:'flex', alignItems:'center', gap:5 }}>
                        <EyeOff size={13}/> {drug.isHidden?'Hidden':'Hide'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Hide Drug Modal */}
      {hidingDrug && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.55)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}>
          <div style={{ background:'white', borderRadius:14, padding:32, width:460, boxShadow:'0 25px 60px rgba(0,0,0,0.25)' }}>
            {hideSuccess ? (
              <div style={{ textAlign:'center', padding:20 }}>
                <div style={{ fontSize:48, marginBottom:12 }}>✅</div>
                <h3 style={{ color:'#059669', margin:'0 0 8px 0' }}>Drug Hidden from Public</h3>
                <p style={{ color:'#64748b', margin:0, fontSize:14 }}>{hidingDrug.name} has been hidden ({hideType}).</p>
              </div>
            ) : (
              <>
                <h3 style={{ margin:'0 0 4px 0', color:'#1e293b', display:'flex', alignItems:'center', gap:8 }}><EyeOff size={20} color="#8B5CF6"/> Hide Drug from Public</h3>
                <p style={{ color:'#64748b', margin:'0 0 20px 0', fontSize:14 }}>Drug: <strong>{hidingDrug.name}</strong></p>
                <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:18 }}>
                  {[
                    { value:'temporary', label:'Temporary', desc:'Temporarily hidden — can be restored by Manager anytime' },
                    { value:'permanent', label:'Permanent', desc:'Permanently hidden from all public pharmacy views' },
                    { value:'internal-only', label:'Internal Only', desc:'Visible only to internal pharmacy staff, never public customers' },
                  ].map(opt => (
                    <label key={opt.value} style={{ display:'flex', alignItems:'flex-start', gap:12, padding:'12px 14px', border:`2px solid ${hideType===opt.value?'#8B5CF6':'#e2e8f0'}`, borderRadius:8, cursor:'pointer', transition:'border 0.15s', background:hideType===opt.value?'#faf5ff':'white' }}>
                      <input type="radio" value={opt.value} checked={hideType===opt.value} onChange={()=>setHideType(opt.value)} style={{marginTop:2}}/>
                      <div>
                        <div style={{ fontWeight:700, fontSize:14, color:'#1e293b', textTransform:'capitalize' }}>{opt.label}</div>
                        <div style={{ fontSize:12, color:'#64748b', marginTop:2 }}>{opt.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
                <textarea placeholder="Reason for hiding (required)..." value={hideReason} onChange={e=>setHideReason(e.target.value)}
                  style={{ width:'100%', padding:'10px 12px', border:'1px solid #e2e8f0', borderRadius:8, fontSize:13, resize:'vertical', minHeight:70, outline:'none', marginBottom:18, boxSizing:'border-box' }}/>
                <div style={{ display:'flex', gap:12 }}>
                  <button disabled={!hideType||!hideReason.trim()} onClick={doHide}
                    style={{ flex:1, padding:'11px', background:hideType&&hideReason.trim()?'#8B5CF6':'#e2e8f0', color:hideType&&hideReason.trim()?'white':'#94a3b8', border:'none', borderRadius:8, fontWeight:700, cursor:hideType&&hideReason.trim()?'pointer':'not-allowed', fontSize:14, transition:'all 0.2s' }}>
                    Apply Hide
                  </button>
                  <button onClick={()=>setHidingDrug(null)} style={{ flex:1, padding:'11px', background:'#f1f5f9', color:'#64748b', border:'none', borderRadius:8, fontWeight:700, cursor:'pointer', fontSize:14 }}>
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      <style>{`@keyframes spin{100%{transform:rotate(360deg);}}`}</style>
    </div>
  );
};

export default PharmacyMedicines;
