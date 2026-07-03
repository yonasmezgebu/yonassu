import React, { useState } from 'react';
import { Printer, ShoppingCart, Globe, CheckCircle } from 'lucide-react';

const DRUGS_LIST = [
  { id:1, name:'Amoxicillin 500mg', price:250, stock:120 },
  { id:2, name:'Paracetamol 500mg', price:50,  stock:80 },
  { id:3, name:'Ibuprofen 400mg',   price:80,  stock:150 },
  { id:4, name:'Metformin 500mg',   price:150, stock:45 },
  { id:5, name:'Omeprazole 20mg',   price:200, stock:60 },
  { id:6, name:'Atorvastatin 10mg', price:350, stock:70 },
  { id:7, name:'Salbutamol Inhaler',price:650, stock:12 },
];

const BRANCHES = ['Branch A','Branch B','Branch C','Main Pharmacy'];

const PharmacyIssueMedicines = () => {
  const [issueType, setIssueType] = useState('walk-in'); // 'walk-in' | 'online'
  const [customerName, setCustomerName] = useState('');
  const [orderRef, setOrderRef] = useState('');
  const [branch, setBranch] = useState('Branch A');
  const [issuedBy, setIssuedBy] = useState('Pharmacy Manager');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedDrug, setSelectedDrug] = useState('');
  const [qty, setQty] = useState(1);
  const [cart, setCart] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [workerPermDenied] = useState(false); // Manager always has access

  const addToCart = () => {
    const drug = DRUGS_LIST.find(d => d.id === parseInt(selectedDrug));
    if (!drug || qty < 1) return;
    setCart(prev => {
      const existing = prev.find(i => i.id === drug.id);
      if (existing) return prev.map(i => i.id === drug.id ? {...i, qty: i.qty + qty} : i);
      return [...prev, {...drug, qty}];
    });
    setSelectedDrug(''); setQty(1);
  };

  const removeFromCart = (id) => setCart(prev => prev.filter(i => i.id !== id));
  const total = cart.reduce((s,i) => s + i.price*i.qty, 0);

  const canSubmit = cart.length > 0 && customerName.trim() && (issueType==='walk-in' || orderRef.trim());

  const handleSubmit = () => {
    setSubmitting(true);
    setTimeout(() => { setSubmitting(false); setSubmitted(true); }, 1200);
  };

  const handlePrint = () => {
    const w = window.open('','_blank');
    w.document.write(`<!DOCTYPE html><html><head><title>Issue Note</title>
    <style>body{font-family:Arial,sans-serif;padding:30px;}table{width:100%;border-collapse:collapse;margin-top:20px;}th,td{border:1px solid #000;padding:10px;}th{background:#e2e8f0;}.stamp{margin-top:60px;border-top:2px solid #000;padding-top:10px;width:200px;text-align:center;}</style>
    </head><body>
    <h1>💊 ISSUE NOTE — Model 22</h1>
    <p><strong>Customer:</strong> ${customerName} &nbsp;&nbsp; <strong>Type:</strong> ${issueType==='walk-in'?'Walk-In':'Online Order'} ${orderRef?`(Ref: ${orderRef})`:''}</p>
    <p><strong>Branch:</strong> ${branch} &nbsp;&nbsp; <strong>Issued By:</strong> ${issuedBy} &nbsp;&nbsp; <strong>Date:</strong> ${issueDate}</p>
    <table><thead><tr><th>Drug Name</th><th>Qty</th><th>Unit Price</th><th>Total</th></tr></thead>
    <tbody>${cart.map(i=>`<tr><td>${i.name}</td><td>${i.qty}</td><td>${i.price.toFixed(2)} ETB</td><td>${(i.price*i.qty).toFixed(2)} ETB</td></tr>`).join('')}</tbody></table>
    <p><strong>Grand Total: ${total.toFixed(2)} ETB</strong></p>
    <div class="stamp"><p>Manager Digital Stamp</p><p style="margin-top:40px;">______________________</p></div>
    </body></html>`);
    w.document.close(); w.print();
  };

  if (workerPermDenied) {
    return (
      <div style={{ padding:48, textAlign:'center', fontFamily:"'Inter',sans-serif" }}>
        <div style={{ fontSize:48, marginBottom:16 }}>🔒</div>
        <h2 style={{ color:'#ef4444' }}>Access Denied</h2>
        <p style={{ color:'#64748b' }}>You do not have permission to issue medicines. Contact the Pharmacy Manager to enable this access.</p>
      </div>
    );
  }

  if (submitted) {
    return (
      <div style={{ padding:24, fontFamily:"'Inter',sans-serif", background:'#f8fafc', minHeight:'100vh' }}>
        <div style={{ background:'white', borderRadius:14, padding:48, textAlign:'center', border:'1px solid #e2e8f0', maxWidth:600, margin:'0 auto' }}>
          <CheckCircle size={64} color="#10b981" style={{ marginBottom:16 }}/>
          <h2 style={{ color:'#059669', margin:'0 0 8px 0' }}>Medicines Issued Successfully!</h2>
          <p style={{ color:'#64748b', marginBottom:8 }}>Customer: <strong>{customerName}</strong></p>
          <p style={{ color:'#64748b', marginBottom:24 }}>Pharmacy stock has been automatically reduced. An Issue Note is ready.</p>
          <div style={{ display:'flex', gap:12, justifyContent:'center' }}>
            <button onClick={handlePrint} style={{ padding:'10px 24px', background:'#224f94', color:'white', border:'none', borderRadius:8, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:6 }}>
              <Printer size={16}/> Print Issue Note (M22)
            </button>
            <button onClick={()=>{setSubmitted(false);setCart([]);setCustomerName('');setOrderRef('');}} style={{ padding:'10px 24px', background:'#f1f5f9', color:'#64748b', border:'none', borderRadius:8, fontWeight:700, cursor:'pointer' }}>
              New Issue
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding:24, fontFamily:"'Inter',sans-serif", background:'#f8fafc', minHeight:'100vh' }}>
      <div style={{ marginBottom:24 }}>
        <h1 style={{ fontSize:26, fontWeight:800, margin:'0 0 4px 0' }}>💊 ISSUE MEDICINES</h1>
        <p style={{ color:'#64748b', margin:0, fontSize:14 }}>🔗 Issue to Customers (Model 22) — Walk-In &amp; Online Orders</p>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 380px', gap:20, maxWidth:1100 }}>
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          {/* Issue Type */}
          <div style={{ background:'white', borderRadius:12, border:'1px solid #e2e8f0', padding:20 }}>
            <h3 style={{ margin:'0 0 14px 0', fontSize:15, fontWeight:700 }}>Step 1: Issue Type</h3>
            <div style={{ display:'flex', gap:12 }}>
              {[{v:'walk-in',icon:<ShoppingCart size={18}/>,label:'Walk-In Customer'},{v:'online',icon:<Globe size={18}/>,label:'Online Order'}].map(opt => (
                <button key={opt.v} onClick={()=>setIssueType(opt.v)}
                  style={{ flex:1, padding:'14px', border:`2px solid ${issueType===opt.v?'#224f94':'#e2e8f0'}`, borderRadius:10, background:issueType===opt.v?'#eff6ff':'white', color:issueType===opt.v?'#224f94':'#64748b', fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8, transition:'all 0.2s' }}>
                  {opt.icon} {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Customer Details */}
          <div style={{ background:'white', borderRadius:12, border:'1px solid #e2e8f0', padding:20 }}>
            <h3 style={{ margin:'0 0 14px 0', fontSize:15, fontWeight:700 }}>Step 2: Customer Details</h3>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
              <div>
                <label style={{ display:'block', fontSize:13, fontWeight:600, color:'#374151', marginBottom:6 }}>Customer Name *</label>
                <input type="text" value={customerName} onChange={e=>setCustomerName(e.target.value)} placeholder="Enter customer name"
                  style={{ width:'100%', padding:'10px 12px', border:'1px solid #e2e8f0', borderRadius:8, fontSize:14, outline:'none', boxSizing:'border-box' }}/>
              </div>
              {issueType==='online' && (
                <div>
                  <label style={{ display:'block', fontSize:13, fontWeight:600, color:'#374151', marginBottom:6 }}>Online Order Reference *</label>
                  <input type="text" value={orderRef} onChange={e=>setOrderRef(e.target.value)} placeholder="e.g. ORD-2026-1234"
                    style={{ width:'100%', padding:'10px 12px', border:'1px solid #e2e8f0', borderRadius:8, fontSize:14, outline:'none', boxSizing:'border-box' }}/>
                </div>
              )}
              <div>
                <label style={{ display:'block', fontSize:13, fontWeight:600, color:'#374151', marginBottom:6 }}>Branch</label>
                <select value={branch} onChange={e=>setBranch(e.target.value)} style={{ width:'100%', padding:'10px 12px', border:'1px solid #e2e8f0', borderRadius:8, fontSize:14, outline:'none' }}>
                  {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display:'block', fontSize:13, fontWeight:600, color:'#374151', marginBottom:6 }}>Issue Date</label>
                <input type="date" value={issueDate} onChange={e=>setIssueDate(e.target.value)} style={{ width:'100%', padding:'10px 12px', border:'1px solid #e2e8f0', borderRadius:8, fontSize:14, outline:'none' }}/>
              </div>
              <div>
                <label style={{ display:'block', fontSize:13, fontWeight:600, color:'#374151', marginBottom:6 }}>Issued By</label>
                <input type="text" value={issuedBy} onChange={e=>setIssuedBy(e.target.value)} style={{ width:'100%', padding:'10px 12px', border:'1px solid #e2e8f0', borderRadius:8, fontSize:14, outline:'none', boxSizing:'border-box' }}/>
              </div>
            </div>
          </div>

          {/* Add Drugs */}
          <div style={{ background:'white', borderRadius:12, border:'1px solid #e2e8f0', padding:20 }}>
            <h3 style={{ margin:'0 0 14px 0', fontSize:15, fontWeight:700 }}>Step 3: Add Drugs</h3>
            <div style={{ display:'flex', gap:10, alignItems:'flex-end' }}>
              <div style={{ flex:1 }}>
                <label style={{ display:'block', fontSize:13, fontWeight:600, color:'#374151', marginBottom:6 }}>Select Drug</label>
                <select value={selectedDrug} onChange={e=>setSelectedDrug(e.target.value)} style={{ width:'100%', padding:'10px 12px', border:'1px solid #e2e8f0', borderRadius:8, fontSize:14, outline:'none' }}>
                  <option value="">— Choose Drug —</option>
                  {DRUGS_LIST.map(d => <option key={d.id} value={d.id}>{d.name} (Stock: {d.stock})</option>)}
                </select>
              </div>
              <div style={{ width:100 }}>
                <label style={{ display:'block', fontSize:13, fontWeight:600, color:'#374151', marginBottom:6 }}>Qty</label>
                <input type="number" min={1} value={qty} onChange={e=>setQty(parseInt(e.target.value)||1)} style={{ width:'100%', padding:'10px 12px', border:'1px solid #e2e8f0', borderRadius:8, fontSize:14, outline:'none', textAlign:'center' }}/>
              </div>
              <button onClick={addToCart} disabled={!selectedDrug}
                style={{ padding:'10px 20px', background:selectedDrug?'#224f94':'#e2e8f0', color:selectedDrug?'white':'#94a3b8', border:'none', borderRadius:8, fontWeight:700, cursor:selectedDrug?'pointer':'not-allowed', whiteSpace:'nowrap' }}>
                + Add
              </button>
            </div>
          </div>
        </div>

        {/* Cart / Issue Summary */}
        <div style={{ background:'white', borderRadius:12, border:'1px solid #e2e8f0', overflow:'hidden', alignSelf:'start' }}>
          <div style={{ padding:'14px 18px', borderBottom:'1px solid #e2e8f0', background:'#f8fafc' }}>
            <h3 style={{ margin:0, fontSize:15, fontWeight:700, display:'flex', alignItems:'center', gap:6 }}><ShoppingCart size={16} color="#224f94"/> Issue Cart ({cart.length})</h3>
          </div>
          {cart.length === 0 ? (
            <div style={{ padding:32, textAlign:'center', color:'#94a3b8' }}>No drugs added yet.</div>
          ) : (
            <>
              <div style={{ maxHeight:300, overflowY:'auto' }}>
                {cart.map(item => (
                  <div key={item.id} style={{ padding:'12px 16px', borderBottom:'1px solid #f1f5f9', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <div>
                      <div style={{ fontWeight:600, fontSize:14 }}>{item.name}</div>
                      <div style={{ fontSize:12, color:'#64748b' }}>Qty: {item.qty} × ETB {item.price.toFixed(2)}</div>
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <span style={{ fontWeight:700, color:'#1e293b' }}>ETB {(item.price*item.qty).toFixed(2)}</span>
                      <button onClick={()=>removeFromCart(item.id)} style={{ background:'#fee2e2', color:'#dc2626', border:'none', borderRadius:6, padding:'4px 8px', cursor:'pointer', fontWeight:700, fontSize:13 }}>×</button>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ padding:'14px 18px', borderTop:'2px solid #e2e8f0' }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:16 }}>
                  <span style={{ fontWeight:700, fontSize:16 }}>Total</span>
                  <span style={{ fontWeight:800, fontSize:18, color:'#1e293b' }}>ETB {total.toFixed(2)}</span>
                </div>
                <button onClick={handleSubmit} disabled={!canSubmit||submitting}
                  style={{ width:'100%', padding:'13px', background:canSubmit?'#059669':'#e2e8f0', color:canSubmit?'white':'#94a3b8', border:'none', borderRadius:9, fontWeight:700, fontSize:15, cursor:canSubmit?'pointer':'not-allowed', transition:'all 0.2s' }}>
                  {submitting ? '⏳ Processing...' : '✅ Issue Medicines'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PharmacyIssueMedicines;
