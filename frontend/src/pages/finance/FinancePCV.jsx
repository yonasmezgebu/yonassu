import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Banknote, Building, Smartphone, CheckCircle, Clock, XCircle,
  ArrowRight, RefreshCw, PenTool, Trash2, User, Printer
} from 'lucide-react';
import api from '../../services/apiClient';

/* ══════════════════════════════════════════════════════
   SIGNATURE PAD
══════════════════════════════════════════════════════ */
const SigPad = ({ label, onSave }) => {
  const canvasRef  = useRef(null);
  const drawing    = useRef(false);
  const lastPos    = useRef(null);
  const [saved, setSaved]     = useState(false);
  const [empty, setEmpty]     = useState(true);

  const pos = (e, c) => {
    const r = c.getBoundingClientRect();
    const sx = c.width / r.width, sy = c.height / r.height;
    if (e.touches) return { x:(e.touches[0].clientX-r.left)*sx, y:(e.touches[0].clientY-r.top)*sy };
    return { x:(e.clientX-r.left)*sx, y:(e.clientY-r.top)*sy };
  };
  const start = useCallback(e => { e.preventDefault(); drawing.current=true; lastPos.current=pos(e,canvasRef.current); setSaved(false); },[]);
  const move  = useCallback(e => {
    e.preventDefault(); if (!drawing.current) return;
    const c = canvasRef.current, ctx = c.getContext('2d'), p = pos(e,c);
    ctx.beginPath(); ctx.moveTo(lastPos.current.x,lastPos.current.y); ctx.lineTo(p.x,p.y);
    ctx.strokeStyle='#1e293b'; ctx.lineWidth=2; ctx.lineCap='round'; ctx.stroke();
    lastPos.current=p; setEmpty(false);
  },[]);
  const stop  = useCallback(() => { drawing.current=false; },[]);

  useEffect(()=>{
    const c = canvasRef.current; if (!c) return;
    c.addEventListener('touchstart',start,{passive:false});
    c.addEventListener('touchmove',move,{passive:false});
    c.addEventListener('touchend',stop,{passive:false});
    return ()=>{ c.removeEventListener('touchstart',start); c.removeEventListener('touchmove',move); c.removeEventListener('touchend',stop); };
  },[start,move,stop]);

  const save  = () => { if(!empty){ onSave(canvasRef.current.toDataURL('image/png')); setSaved(true); } };
  const clear = () => {
    const c = canvasRef.current; c.getContext('2d').clearRect(0,0,c.width,c.height);
    setEmpty(true); setSaved(false); onSave(null);
  };

  return (
    <div style={{border:`2px solid ${saved?'#eab308':'#e2e8f0'}`,borderRadius:10,overflow:'hidden',background:'white'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'7px 12px',background:saved?'#fefce8':'#f8fafc',borderBottom:'1px solid #e2e8f0'}}>
        <span style={{fontSize:12,fontWeight:700,color:saved?'#a16207':'#64748b',display:'flex',alignItems:'center',gap:5}}>
          <PenTool size={12}/> {label} {saved&&<span style={{background:'#fef08a',color:'#a16207',fontSize:10,padding:'2px 7px',borderRadius:99}}>✓ Saved</span>}
        </span>
        <div style={{display:'flex',gap:6}}>
          <button type="button" onClick={clear} style={{fontSize:11,padding:'3px 9px',border:'1px solid #fca5a5',background:'#fef2f2',color:'#dc2626',borderRadius:5,cursor:'pointer',fontWeight:600}}><Trash2 size={11}/></button>
          <button type="button" onClick={save} disabled={empty} style={{fontSize:11,padding:'3px 9px',border:`1px solid ${empty?'#d1d5db':'#fde047'}`,background:empty?'#f3f4f6':'#fef08a',color:empty?'#9ca3af':'#a16207',borderRadius:5,cursor:empty?'not-allowed':'pointer',fontWeight:600}}>Save</button>
        </div>
      </div>
      <canvas ref={canvasRef} width={400} height={110} onMouseDown={start} onMouseMove={move} onMouseUp={stop} onMouseLeave={stop} style={{width:'100%',height:110,display:'block',cursor:'crosshair',touchAction:'none'}}/>
      <div style={{padding:'4px 10px',fontSize:10,color:'#94a3b8',textAlign:'center',background:'#f8fafc',borderTop:'1px solid #e2e8f0'}}>
        {empty?'Draw signature then Save':saved?'✓ Captured':'Press Save to confirm'}
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════
   PRINT SIGNATURE BLOCK
══════════════════════════════════════════════════════ */
const SigBlock = ({label,name,sig}) => (
  <div style={{textAlign:'center',minWidth:180}}>
    <div style={{height:70,border:'1px solid #999',borderRadius:4,marginBottom:6,overflow:'hidden',background:'#fff',display:'flex',alignItems:'center',justifyContent:'center'}}>
      {sig ? <img src={sig} alt={label} style={{maxHeight:65,maxWidth:'100%',objectFit:'contain'}}/> : <span style={{color:'#ccc',fontSize:11}}>—</span>}
    </div>
    <div style={{borderTop:'1px solid #333',paddingTop:4}}>
      <div style={{fontSize:13,fontWeight:700}}>{name||'_______________'}</div>
      <div style={{fontSize:11,color:'#555',marginTop:2}}>{label}</div>
    </div>
  </div>
);

/* ══════════════════════════════════════════════════════
   FINALIZE MODAL  (CEO Approved → Save to Cashbook → Print)
══════════════════════════════════════════════════════ */
const FinalizeModal = ({ pcv, onClose, onDone }) => {
  const [step, setStep]       = useState('confirm');   // confirm | loading | done | error
  const [errMsg, setErrMsg]   = useState('');

  const finalize = async () => {
    setStep('loading');
    try {
      await api.put(`/finance-cash/pcv/${pcv.id}/finalize`);
      setStep('done');
      onDone(); // refresh list
    } catch (e) {
      setErrMsg(e?.response?.data?.message || e.message || 'Unknown error');
      setStep('error');
    }
  };

  const pm = pcv.payment_method;

  /* ── OVERLAY WRAPPER ── */
  const overlay = (children) => (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.65)',zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
      {children}
    </div>
  );

  /* ── STEP: confirm ── */
  if (step === 'confirm') return overlay(
    <div style={{background:'white',borderRadius:20,padding:36,maxWidth:500,width:'100%',boxShadow:'0 25px 60px rgba(0,0,0,.3)'}}>
      <div style={{textAlign:'center',marginBottom:24}}>
        <div style={{background:'#dcfce7',width:72,height:72,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px',border:'2px solid #86efac'}}>
          <CheckCircle size={40} color="#16a34a"/>
        </div>
        <h2 style={{fontSize:20,fontWeight:800,color:'#0f172a',margin:'0 0 6px'}}>CEO Approved!</h2>
        <p style={{color:'#64748b',fontSize:13,margin:0}}>
          <b>{pcv.pcv_number}</b> was approved by the CEO.<br/>
          Click <b>"Save &amp; Record"</b> to record it in the cashbook and print the voucher.
        </p>
      </div>

      {/* PCV Details */}
      <div style={{background:'#f8fafc',border:'1px solid #e2e8f0',borderRadius:12,padding:16,marginBottom:24}}>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,fontSize:13}}>
          <div><span style={{color:'#94a3b8',fontSize:11,display:'block'}}>Voucher No.</span><b style={{fontFamily:'monospace'}}>{pcv.pcv_number}</b></div>
          <div><span style={{color:'#94a3b8',fontSize:11,display:'block'}}>Date</span><b>{new Date(pcv.date).toLocaleDateString('en-GB')}</b></div>
          <div><span style={{color:'#94a3b8',fontSize:11,display:'block'}}>Paid To</span><b>{pcv.paid_to}</b></div>
          <div><span style={{color:'#94a3b8',fontSize:11,display:'block'}}>Method</span><b>{pm}</b></div>
          <div style={{gridColumn:'span 2'}}>
            <span style={{color:'#94a3b8',fontSize:11,display:'block'}}>Amount</span>
            <span style={{fontWeight:800,fontSize:20,color:'#15803d'}}>ETB {parseFloat(pcv.amount).toLocaleString(undefined,{minimumFractionDigits:2})}</span>
          </div>
          {pcv.description && <div style={{gridColumn:'span 2'}}><span style={{color:'#94a3b8',fontSize:11,display:'block'}}>Description</span><span>{pcv.description}</span></div>}
        </div>
      </div>

      <div style={{display:'flex',gap:12}}>
        <button onClick={onClose} style={{flex:1,padding:'12px',background:'#f1f5f9',border:'1px solid #e2e8f0',borderRadius:10,cursor:'pointer',fontWeight:600,fontSize:14}}>Cancel</button>
        <button onClick={finalize} style={{flex:2,display:'flex',alignItems:'center',justifyContent:'center',gap:10,padding:'12px',background:'linear-gradient(135deg,#16a34a,#15803d)',color:'white',border:'none',borderRadius:10,cursor:'pointer',fontWeight:700,fontSize:14,boxShadow:'0 4px 14px rgba(22,163,74,.35)'}}>
          <CheckCircle size={18}/> Save &amp; Record in Cashbook
        </button>
      </div>
    </div>
  );

  /* ── STEP: loading ── */
  if (step === 'loading') return overlay(
    <div style={{background:'white',borderRadius:20,padding:40,textAlign:'center',boxShadow:'0 25px 60px rgba(0,0,0,.3)'}}>
      <RefreshCw size={40} color="#16a34a" style={{animation:'spin 1s linear infinite',marginBottom:16}}/>
      <p style={{fontWeight:700,color:'#0f172a',fontSize:16,margin:0}}>Recording in cashbook…</p>
    </div>
  );

  /* ── STEP: error ── */
  if (step === 'error') return overlay(
    <div style={{background:'white',borderRadius:20,padding:36,maxWidth:440,width:'100%',boxShadow:'0 25px 60px rgba(0,0,0,.3)',textAlign:'center'}}>
      <XCircle size={48} color="#dc2626" style={{marginBottom:12}}/>
      <h3 style={{color:'#dc2626',fontWeight:800,margin:'0 0 8px'}}>Finalize Failed</h3>
      <p style={{color:'#64748b',fontSize:13,marginBottom:20}}>{errMsg}</p>
      <button onClick={onClose} style={{padding:'10px 24px',background:'#0f172a',color:'white',border:'none',borderRadius:8,cursor:'pointer',fontWeight:700}}>Close</button>
    </div>
  );

  /* ── STEP: done ── */
  const printPCV = () => {
    const formatAmt = (v) => parseFloat(v||0).toLocaleString(undefined,{minimumFractionDigits:2});
    const pm = pcv.payment_method;

    const paymentBlock = pm === 'Bank'
      ? `<div class="payment-box"><b>Bank Details:</b><br/>Bank: ${pcv.bank_name||''}<br/>A/C Name: ${pcv.account_holder||''}<br/>A/C No: ${pcv.account_number||''}${pcv.cheque_no ? `<br/>Cheque: ${pcv.cheque_no}` : ''}</div>`
      : pm === 'Telebirr'
      ? `<div class="payment-box"><b>Telebirr:</b><br/>Mobile: ${pcv.telebirr_number||''}<br/>Name: ${pcv.telebirr_name||''}</div>`
      : `<div class="payment-box" style="font-size:18px;font-weight:bold;text-align:center;">By Cash</div>`;

    const sigImg = (sig, name, label) => `
      <div class="sig-block">
        <div class="sig-box">${sig ? `<img src="${sig}" style="max-height:60px;max-width:100%;object-fit:contain;" />` : ''}</div>
        <div class="sig-line"></div>
        <div class="sig-name">${name||'_______________'}</div>
        <div class="sig-label">${label}</div>
      </div>`;

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>PCV ${pcv.pcv_number}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Times New Roman', serif; background: white; color: #000; padding: 36px 48px; }
    .header { text-align: center; border-bottom: 3px double #000; padding-bottom: 16px; margin-bottom: 20px; }
    .header h1 { font-size: 26px; text-transform: uppercase; letter-spacing: 3px; margin-bottom: 4px; }
    .header h2 { font-size: 16px; font-weight: normal; color: #333; }
    .meta-row { display: flex; justify-content: space-between; margin-bottom: 24px; font-size: 13px; }
    .fields { line-height: 2.8; font-size: 15px; margin-bottom: 24px; }
    .fields .field-line { display: flex; align-items: baseline; gap: 8px; }
    .fields .underline { border-bottom: 1px solid #000; display: inline-block; min-width: 300px; flex: 1; }
    .amount-row { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; }
    .amount-box { padding: 12px 24px; border: 2px solid #000; font-size: 26px; font-weight: bold; }
    .payment-box { padding: 12px 16px; border: 1px solid #555; font-size: 13px; min-width: 220px; line-height: 1.8; }
    .sigs { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 48px; }
    .sig-block { text-align: center; min-width: 160px; }
    .sig-box { height: 70px; border: 1px solid #999; border-radius: 4px; margin-bottom: 6px; display: flex; align-items: center; justify-content: center; background: #fff; }
    .sig-line { border-top: 1px solid #333; margin-bottom: 4px; }
    .sig-name { font-size: 13px; font-weight: 700; }
    .sig-label { font-size: 11px; color: #555; margin-top: 2px; }
    .cashbook-stamp { margin-top: 32px; padding: 10px 18px; border: 2px solid #000; display: inline-block; font-size: 13px; }
    @page { margin: 14mm; size: A4; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>Sutana Enterprise</h1>
    <h2>PETTY CASH VOUCHER (PCV)</h2>
  </div>
  <div class="meta-row">
    <div><b>Voucher No:</b> <span style="font-family:monospace;font-size:15px">${pcv.pcv_number}</span><br/><b>Reference:</b> ${pcv.reference_no||'N/A'}</div>
    <div style="text-align:right"><b>Date:</b> ${new Date(pcv.date).toLocaleDateString('en-GB')}<br/><b>Payment Method:</b> ${pm}</div>
  </div>
  <div class="fields">
    <div class="field-line"><b>PAID TO:</b>&nbsp;<span class="underline">${pcv.paid_to}</span></div>
    <div class="field-line"><b>THE SUM OF:</b>&nbsp;<span class="underline" style="font-style:italic">${formatAmt(pcv.amount)} ETB Only</span></div>
    <div class="field-line"><b>BEING PAYMENT FOR:</b>&nbsp;<span class="underline">${pcv.description||''}</span></div>
  </div>
  <div class="amount-row">
    <div class="amount-box">ETB ${formatAmt(pcv.amount)}</div>
    ${paymentBlock}
  </div>
  <div class="sigs">
    ${sigImg(pcv.prepared_signature, pcv.prepared_by, 'Prepared By')}
    ${sigImg(pcv.checked_signature, pcv.checked_by, 'Checked By')}
    ${sigImg(pcv.receiver_signature, pcv.receiver_name, "Payee's Signature")}
  </div>
  <div style="margin-top:32px;display:flex;justify-content:space-between;font-size:12px;color:#555">
    <span>Printed: ${new Date().toLocaleString('en-GB')}</span>
    <div class="cashbook-stamp">✔ Recorded in Cashbook</div>
  </div>
</body>
</html>`;

    const w = window.open('','_blank','width=800,height=1000');
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => { w.print(); }, 400);
  };

  return (
    <>
      {/* ── SCREEN ── */}
      <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.65)',zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
        <div style={{background:'white',borderRadius:20,padding:40,maxWidth:520,width:'100%',textAlign:'center',boxShadow:'0 25px 60px rgba(0,0,0,.3)'}}>
          <div style={{background:'#f0fdf4',width:80,height:80,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 20px',border:'2px solid #86efac'}}>
            <CheckCircle size={48} color="#22c55e"/>
          </div>
          <h2 style={{fontSize:22,fontWeight:800,color:'#0f172a',margin:'0 0 8px'}}>Saved to Cashbook! ✅</h2>
          <p style={{color:'#64748b',marginBottom:6}}><b>{pcv.pcv_number}</b> has been finalized.</p>
          <p style={{color:'#94a3b8',fontSize:13,marginBottom:28}}>
            ETB {parseFloat(pcv.amount).toLocaleString(undefined,{minimumFractionDigits:2})} has been deducted from the cashbook.
          </p>
          <div style={{display:'flex',gap:12}}>
            <button onClick={printPCV} style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',gap:8,padding:'12px',background:'white',border:'2px solid #e2e8f0',borderRadius:10,cursor:'pointer',fontWeight:700,fontSize:14}}>
              <Printer size={16}/> Print PCV
            </button>
            <button onClick={onClose} style={{flex:1,padding:'12px',background:'#0f172a',color:'white',border:'none',borderRadius:10,cursor:'pointer',fontWeight:700,fontSize:14}}>Close</button>
          </div>
        </div>
      </div>
    </>
  );
};


/* ══════════════════════════════════════════════════════
   STATUS BADGE
══════════════════════════════════════════════════════ */
const StatusBadge = ({ status }) => {
  const map = {
    pending_ceo:      { label:'⏳ Awaiting CEO',    bg:'#fef9c3', color:'#a16207' },
    approved_finance: { label:'✅ CEO Approved',     bg:'#dcfce7', color:'#15803d' },
    rejected:         { label:'❌ Rejected by CEO',  bg:'#fee2e2', color:'#dc2626' },
    completed:        { label:'✔ Completed',         bg:'#e0f2fe', color:'#0369a1' },
  };
  const s = map[status] || { label: status, bg:'#f1f5f9', color:'#475569' };
  return <span style={{background:s.bg,color:s.color,padding:'4px 12px',borderRadius:99,fontSize:11,fontWeight:700,whiteSpace:'nowrap'}}>{s.label}</span>;
};

/* ══════════════════════════════════════════════════════
   PCV STATUS TAB
══════════════════════════════════════════════════════ */
const PCVStatusTab = () => {
  const [pcvs, setPcvs]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [target, setTarget]   = useState(null); // PCV to finalize

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/finance-cash/pcv/pending');
      const data = res?.data?.data || res?.data || [];
      setPcvs(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('PCV load error:', e);
    } finally { setLoading(false); }
  };

  const handleMarkRead = async (id) => {
    try {
      await api.put(`/finance-cash/pcv/${id}/finance-read`);
      setPcvs(prev => prev.map(p => p.id === id ? { ...p, finance_read: true } : p));
    } catch(e) {
      console.error(e);
    }
  };

  useEffect(() => { load(); }, []);

  const groups = {
    approved: pcvs.filter(p => p.status === 'approved_finance'),
    pending:  pcvs.filter(p => p.status === 'pending_ceo'),
    rejected: pcvs.filter(p => p.status === 'rejected'),
    done:     pcvs.filter(p => p.status === 'completed'),
  };

  const Card = ({ pcv, isApproved }) => {
    const isUnread = !pcv.finance_read && (pcv.status === 'approved_finance' || pcv.status === 'rejected');
    return (
    <div style={{
      background:'white', borderRadius:14,
      border:`2px solid ${isApproved?'#22c55e':'#e2e8f0'}`,
      padding:'18px 22px', display:'flex', alignItems:'center', gap:16,
      boxShadow: isApproved ? '0 6px 18px rgba(34,197,94,.15)' : '0 2px 6px rgba(0,0,0,.04)',
      transition:'transform .15s', cursor: 'default',
    }}>
      <div style={{flexShrink:0,background:isApproved?'#dcfce7':'#fefce8',padding:10,borderRadius:10}}>
        <Banknote size={22} color={isApproved?'#16a34a':'#eab308'}/>
      </div>
      <div style={{flex:1,minWidth:0}}>
        <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:6,flexWrap:'wrap'}}>
          <span style={{fontFamily:'monospace',fontWeight:800,fontSize:15}}>{pcv.pcv_number}</span>
          <StatusBadge status={pcv.status}/>
        </div>
        <div style={{fontSize:13,color:'#64748b',display:'flex',gap:12,flexWrap:'wrap'}}>
          <span>To: <b style={{color:'#0f172a'}}>{pcv.paid_to}</b></span>
          <span>·</span>
          <span>{new Date(pcv.date).toLocaleDateString('en-GB')}</span>
          <span>·</span>
          <span style={{fontWeight:700,color:isApproved?'#15803d':'#a16207'}}>ETB {parseFloat(pcv.amount).toLocaleString(undefined,{minimumFractionDigits:2})}</span>
          <span>·</span>
          <span>{pcv.payment_method}</span>
        </div>
        {pcv.status==='rejected'&&pcv.reject_reason&&(
          <div style={{marginTop:8,fontSize:12,background:'#fef2f2',color:'#dc2626',padding:'4px 12px',borderRadius:6,display:'inline-block'}}>
            Reason: {pcv.reject_reason}
          </div>
        )}
      </div>
        {isUnread && (
          <button
            onClick={() => handleMarkRead(pcv.id)}
            style={{flexShrink:0,marginLeft:8,padding:'11px 16px',background:'#f1f5f9',color:'#475569',border:'1px solid #cbd5e1',borderRadius:10,cursor:'pointer',fontWeight:600,fontSize:13,whiteSpace:'nowrap'}}>
            Mark as Read
          </button>
        )}
      {isApproved && (
        <button
          onClick={() => {
             if (isUnread) handleMarkRead(pcv.id);
             setTarget(pcv);
          }}
          style={{flexShrink:0,display:'flex',alignItems:'center',gap:8,padding:'11px 20px',background:'linear-gradient(135deg,#16a34a,#15803d)',color:'white',border:'none',borderRadius:10,cursor:'pointer',fontWeight:700,fontSize:13,boxShadow:'0 4px 12px rgba(22,163,74,.35)',whiteSpace:'nowrap'}}>
          <ArrowRight size={16}/> Click to Continue PCV
        </button>
      )}
    </div>
  )};

  const Section = ({ title, items, accent, isApproved }) => {
    if (!items.length) return null;
    return (
      <div style={{marginBottom:32}}>
        <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:14}}>
          <h3 style={{fontSize:15,fontWeight:700,color:accent,margin:0}}>{title}</h3>
          <span style={{background:accent+'20',color:accent,borderRadius:99,padding:'2px 10px',fontSize:12,fontWeight:700}}>{items.length}</span>
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:10}}>
          {items.map(p => <Card key={p.id} pcv={p} isApproved={!!isApproved}/>)}
        </div>
      </div>
    );
  };

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:28}}>
        <div>
          <h2 style={{fontSize:22,fontWeight:800,color:'#0f172a',margin:'0 0 4px'}}>PCV Status Tracker</h2>
          <p style={{color:'#64748b',fontSize:14,margin:0}}>Track and finalize approved petty cash vouchers.</p>
        </div>
        <button onClick={load} style={{display:'flex',alignItems:'center',gap:8,padding:'9px 16px',background:'white',border:'1px solid #e2e8f0',borderRadius:10,cursor:'pointer',fontWeight:600,fontSize:13,boxShadow:'0 1px 3px rgba(0,0,0,.06)'}}>
          <RefreshCw size={14}/> Refresh
        </button>
      </div>

      {loading ? (
        <div style={{textAlign:'center',padding:80,color:'#94a3b8'}}>
          <RefreshCw size={32} style={{animation:'spin 1s linear infinite',marginBottom:12}}/>
          <div style={{fontWeight:600}}>Loading PCVs…</div>
        </div>
      ) : pcvs.length === 0 ? (
        <div style={{textAlign:'center',padding:80,background:'white',borderRadius:16,border:'1px solid #e2e8f0'}}>
          <CheckCircle size={48} color="#22c55e" style={{marginBottom:16}}/>
          <h3 style={{fontSize:20,fontWeight:700,color:'#0f172a',margin:'0 0 8px'}}>No PCVs yet</h3>
          <p style={{color:'#64748b',margin:0}}>Create a PCV from the "New Voucher" tab.</p>
        </div>
      ) : (
        <>
          <Section title="✅ CEO Approved — Ready to Finalize" items={groups.approved} accent="#15803d" isApproved={true}/>
          <Section title="⏳ Awaiting CEO Approval"              items={groups.pending}  accent="#a16207"/>
          <Section title="❌ Rejected by CEO"                    items={groups.rejected} accent="#dc2626"/>
          <Section title="✔ Completed"                          items={groups.done}     accent="#0369a1"/>
        </>
      )}

      {target && (
        <FinalizeModal
          pcv={target}
          onClose={() => { setTarget(null); load(); }}
          onDone={() => { load(); }}
        />
      )}
    </div>
  );
};

/* ══════════════════════════════════════════════════════
   NEW PCV FORM
══════════════════════════════════════════════════════ */
const NewVoucherTab = ({ onSubmitted }) => {
  const [date,            setDate]            = useState(new Date().toISOString().slice(0,10));
  const [paidTo,          setPaidTo]          = useState('');
  const [amount,          setAmount]          = useState('');
  const [amountWords,     setAmountWords]     = useState('');
  const [paymentMethod,   setPaymentMethod]   = useState('Cash');
  const [description,     setDescription]    = useState('');
  const [referenceNo,     setReferenceNo]     = useState('');
  const [bankName,        setBankName]        = useState('');
  const [accountHolder,   setAccountHolder]   = useState('');
  const [accountNumber,   setAccountNumber]   = useState('');
  const [chequeNo,        setChequeNo]        = useState('');
  const [telebirrNumber,  setTelebirrNumber]  = useState('');
  const [telebirrName,    setTelebirrName]    = useState('');
  const [preparedBy,      setPreparedBy]      = useState('');
  const [checkedBy,       setCheckedBy]       = useState('');
  const [receiverName,    setReceiverName]    = useState('');
  const [preparedSig,     setPreparedSig]     = useState(null);
  const [checkedSig,      setCheckedSig]      = useState(null);
  const [receiverSig,     setReceiverSig]     = useState(null);
  const [loading,         setLoading]         = useState(false);
  const [error,           setError]           = useState(null);

  const handleAmount = e => {
    setAmount(e.target.value);
    const v = parseFloat(e.target.value);
    setAmountWords(isNaN(v) ? '' : `${v.toLocaleString('en-US')} ETB Only`);
  };

  const inp = { border:'2px solid #e2e8f0', borderRadius:9, padding:'11px 14px', width:'100%', boxSizing:'border-box', outline:'none', fontSize:14 };
  const lbl = { display:'block', fontSize:12, fontWeight:700, color:'#475569', marginBottom:7 };
  const card = { background:'white', borderRadius:16, border:'1px solid #e2e8f0', overflow:'hidden', boxShadow:'0 2px 6px rgba(0,0,0,.05)', marginBottom:22 };
  const cardHead = { padding:'18px 26px', borderBottom:'1px solid #e2e8f0', background:'#f8fafc', fontSize:15, fontWeight:700, color:'#0f172a', display:'flex', alignItems:'center', gap:8 };

  const handleSubmit = async e => {
    e.preventDefault();
    setError(null); setLoading(true);
    try {
      const payload = {
        date, paidTo, amount: parseFloat(amount), paymentMethod, description, referenceNo,
        bankDetails:     paymentMethod==='Bank'     ? {bankName,accountHolder,accountNumber,chequeNo}  : null,
        telebirrDetails: paymentMethod==='Telebirr' ? {telebirrNumber,fullName:telebirrName}            : null,
        preparedBy, checkedBy, receiverName,
        preparedSignature: preparedSig, checkedSignature: checkedSig, receiverSignature: receiverSig,
      };
      const res = await api.post('/finance-cash/pcv', payload);
      onSubmitted({ pcvNumber: res.data?.data?.pcvNumber, ...payload, amountWords });
    } catch(err) {
      setError(err.response?.data?.message || err.message || 'Failed to submit PCV');
    } finally { setLoading(false); }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <div style={{background:'#fef2f2',border:'1px solid #fecaca',color:'#991b1b',padding:'14px 18px',borderRadius:10,marginBottom:18}}><b>Error:</b> {error}</div>}

      {/* General */}
      <div style={card}>
        <div style={cardHead}><User size={15} color="#64748b"/> General Information</div>
        <div style={{padding:26}}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:18,marginBottom:18}}>
            <div><label style={lbl}>Date *</label><input type="date" required value={date} onChange={e=>setDate(e.target.value)} style={inp}/></div>
            <div><label style={lbl}>Paid To *</label><input required value={paidTo} onChange={e=>setPaidTo(e.target.value)} placeholder="Payee name" style={inp}/></div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 2fr',gap:18,marginBottom:18}}>
            <div>
              <label style={lbl}>Amount (ETB) *</label>
              <div style={{position:'relative'}}>
                <span style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',color:'#64748b',fontWeight:600,fontSize:12}}>ETB</span>
                <input required type="number" step="0.01" value={amount} onChange={handleAmount} placeholder="0.00" style={{...inp,paddingLeft:46,fontWeight:700,fontSize:15}}/>
              </div>
            </div>
            <div><label style={lbl}>Amount in Words</label><input readOnly value={amountWords} placeholder="Auto-filled" style={{...inp,background:'#f8fafc',color:'#64748b',fontStyle:'italic',border:'2px solid #f1f5f9'}}/></div>
          </div>
          <div style={{marginBottom:18}}><label style={lbl}>Description *</label><input required value={description} onChange={e=>setDescription(e.target.value)} placeholder="Purpose of payment" style={inp}/></div>
          <div><label style={lbl}>Reference # (Optional)</label><input value={referenceNo} onChange={e=>setReferenceNo(e.target.value)} placeholder="Receipt / Bill number" style={inp}/></div>
        </div>
      </div>

      {/* Payment Method */}
      <div style={card}>
        <div style={cardHead}><Banknote size={15} color="#64748b"/> Payment Method</div>
        <div style={{padding:26}}>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:14,marginBottom: paymentMethod!=='Cash' ? 18 : 0}}>
            {[{t:'Cash',Icon:Banknote},{t:'Bank',Icon:Building},{t:'Telebirr',Icon:Smartphone}].map(({t,Icon})=>(
              <div key={t} onClick={()=>setPaymentMethod(t)} style={{padding:16,border:`2px solid ${paymentMethod===t?'#eab308':'#e2e8f0'}`,borderRadius:12,cursor:'pointer',fontWeight:700,fontSize:14,background:paymentMethod===t?'#fefce8':'white',color:paymentMethod===t?'#a16207':'#64748b',display:'flex',flexDirection:'column',alignItems:'center',gap:10,transition:'all .2s'}}>
                <Icon size={24} color={paymentMethod===t?'#eab308':'#94a3b8'}/> {t}
              </div>
            ))}
          </div>
          {paymentMethod==='Bank'&&(
            <div style={{background:'#f0f9ff',padding:18,borderRadius:10,border:'1px solid #bae6fd'}}>
              <div style={{fontWeight:700,fontSize:13,color:'#0369a1',marginBottom:12}}>Bank Details</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                <input required value={bankName}       onChange={e=>setBankName(e.target.value)}       placeholder="Bank Name *"       style={{...inp,border:'1px solid #7dd3fc'}}/>
                <input required value={accountHolder}  onChange={e=>setAccountHolder(e.target.value)}  placeholder="Account Holder *"  style={{...inp,border:'1px solid #7dd3fc'}}/>
                <input required value={accountNumber}  onChange={e=>setAccountNumber(e.target.value)}  placeholder="Account Number *"  style={{...inp,border:'1px solid #7dd3fc'}}/>
                <input         value={chequeNo}        onChange={e=>setChequeNo(e.target.value)}        placeholder="Cheque # (optional)"style={{...inp,border:'1px solid #7dd3fc'}}/>
              </div>
            </div>
          )}
          {paymentMethod==='Telebirr'&&(
            <div style={{background:'#fffbeb',padding:18,borderRadius:10,border:'1px solid #fde68a'}}>
              <div style={{fontWeight:700,fontSize:13,color:'#b45309',marginBottom:12}}>Telebirr Details</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                <input required value={telebirrNumber} onChange={e=>setTelebirrNumber(e.target.value)} placeholder="Mobile Number *" style={{...inp,border:'1px solid #fcd34d'}}/>
                <input required value={telebirrName}   onChange={e=>setTelebirrName(e.target.value)}   placeholder="Full Name *"     style={{...inp,border:'1px solid #fcd34d'}}/>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Signatures */}
      <div style={card}>
        <div style={cardHead}><PenTool size={15} color="#64748b"/> Signatures</div>
        <div style={{padding:26}}>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:20}}>
            {[
              {label:'Prepared By *', nameVal:preparedBy, setName:setPreparedBy, onSig:setPreparedSig, sig:preparedSig},
              {label:'Checked By *',  nameVal:checkedBy,  setName:setCheckedBy,  onSig:setCheckedSig,  sig:checkedSig},
              {label:"Payee's Name *",nameVal:receiverName,setName:setReceiverName,onSig:setReceiverSig,sig:receiverSig},
            ].map(({label,nameVal,setName,onSig,sig})=>(
              <div key={label}>
                <label style={lbl}>{label}</label>
                <input required value={nameVal} onChange={e=>setName(e.target.value)} placeholder="Full name" style={{...inp,marginBottom:10}}/>
                <SigPad label={label.replace(' *','')} onSave={onSig}/>
                {sig&&<p style={{margin:'4px 0 0',fontSize:10,color:'#eab308',fontWeight:700}}>✓ Signature ready</p>}
              </div>
            ))}
          </div>
          <p style={{margin:'16px 0 0',color:'#94a3b8',fontSize:11}}>ⓘ Draw on each canvas with your mouse or finger, then press <b>Save</b> to confirm each signature.</p>
        </div>
      </div>

      <button type="submit" disabled={loading} style={{width:'100%',padding:16,background:'linear-gradient(135deg,#eab308,#a16207)',color:'white',border:'none',borderRadius:12,cursor:loading?'not-allowed':'pointer',fontSize:16,fontWeight:700,display:'flex',justifyContent:'center',alignItems:'center',gap:10,boxShadow:'0 4px 14px rgba(234,179,8,.4)',opacity:loading?0.7:1}}>
        {loading ? <><RefreshCw size={20} style={{animation:'spin 1s linear infinite'}}/> Processing…</> : <><CheckCircle size={20}/> Generate Petty Cash Voucher</>}
      </button>
    </form>
  );
};

/* ══════════════════════════════════════════════════════
   SUBMITTED SUCCESS SCREEN
══════════════════════════════════════════════════════ */
const SubmittedScreen = ({ data, onNewPCV, onViewStatus }) => (
  <div style={{background:'white',borderRadius:16,border:'2px solid #eab308',padding:40,textAlign:'center',boxShadow:'0 20px 25px -5px rgba(0,0,0,.12)'}}>
    <div style={{background:'#fef9c3',width:80,height:80,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 20px',border:'2px solid #fde047'}}>
      <Clock size={48} color="#eab308"/>
    </div>
    <h2 style={{fontSize:24,fontWeight:800,color:'#713f12',margin:'0 0 8px'}}>Sent for CEO Approval</h2>
    <p style={{color:'#64748b',marginBottom:4}}>Your PCV is now <b>waiting for CEO approval</b>.</p>
    <p style={{color:'#94a3b8',fontSize:13,marginBottom:24}}>Once approved, go to the <b>PCV Status</b> tab to finalize and record in the cashbook.</p>
    <div style={{background:'#fefce8',padding:20,borderRadius:12,border:'1px dashed #fde047',textAlign:'left',marginBottom:24}}>
      <div style={{fontFamily:'monospace',fontSize:18,fontWeight:800,color:'#a16207',textAlign:'center',letterSpacing:2,marginBottom:14}}>{data.pcvNumber}</div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,fontSize:14}}>
        <div><span style={{color:'#64748b',fontSize:11,display:'block'}}>Date</span><b>{data.date}</b></div>
        <div><span style={{color:'#64748b',fontSize:11,display:'block'}}>Method</span><b>{data.paymentMethod}</b></div>
        <div style={{gridColumn:'span 2'}}><span style={{color:'#64748b',fontSize:11,display:'block'}}>Paid To</span><b>{data.paidTo}</b></div>
        <div style={{gridColumn:'span 2'}}><span style={{color:'#64748b',fontSize:11,display:'block'}}>Amount</span><span style={{fontWeight:800,color:'#a16207',fontSize:22}}>ETB {parseFloat(data.amount).toLocaleString(undefined,{minimumFractionDigits:2})}</span></div>
      </div>
    </div>
    <div style={{display:'flex',gap:12}}>
      <button onClick={onViewStatus} style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',gap:8,padding:13,background:'#fefce8',border:'2px solid #eab308',borderRadius:10,cursor:'pointer',fontWeight:700,color:'#a16207',fontSize:14}}>
        View PCV Status →
      </button>
      <button onClick={onNewPCV} style={{flex:1,padding:13,background:'#0f172a',color:'white',border:'none',borderRadius:10,cursor:'pointer',fontWeight:600,fontSize:14}}>
        New PCV
      </button>
    </div>
  </div>
);

/* ══════════════════════════════════════════════════════
   MAIN PAGE CONTAINER
══════════════════════════════════════════════════════ */
const FinancePCV = () => {
  const [tab,       setTab]       = useState('new');   // 'new' | 'status'
  const [submitted, setSubmitted] = useState(null);

  const switchTab = t => { setTab(t); setSubmitted(null); };

  return (
    <div style={{padding:32,background:'#f8fafc',minHeight:'100vh',fontFamily:"'Inter',sans-serif"}}>

      {/* Page Header */}
      <div style={{maxWidth:860,margin:'0 auto 24px',display:'flex',justifyContent:'space-between',alignItems:'flex-end',flexWrap:'wrap',gap:14}}>
        <div>
          <h1 style={{fontSize:26,fontWeight:800,margin:0,display:'flex',alignItems:'center',gap:12,color:'#0f172a'}}>
            <span style={{background:'linear-gradient(135deg,#eab308,#a16207)',padding:10,borderRadius:12,display:'flex',boxShadow:'0 4px 10px rgba(234,179,8,.3)'}}>
              <Banknote color="white" size={22}/>
            </span>
            Petty Cash Voucher (PCV)
          </h1>
          <p style={{color:'#64748b',margin:'6px 0 0',fontSize:14}}>Create, manage and track petty cash vouchers.</p>
        </div>
        {/* Tab Switcher */}
        <div style={{display:'flex',background:'#f1f5f9',padding:4,borderRadius:12,gap:4}}>
          {[{k:'new',label:'✏️ New Voucher'},{k:'status',label:'📋 PCV Status'}].map(({k,label})=>(
            <button key={k} onClick={()=>switchTab(k)} style={{
              padding:'9px 20px',borderRadius:9,fontWeight:700,fontSize:13,cursor:'pointer',
              border:'none',transition:'all .2s',
              background: tab===k ? 'white' : 'transparent',
              color:       tab===k ? '#0f172a' : '#64748b',
              boxShadow:   tab===k ? '0 2px 8px rgba(0,0,0,.1)' : 'none',
            }}>{label}</button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{maxWidth:860,margin:'0 auto'}}>
        {tab === 'status' ? (
          <PCVStatusTab/>
        ) : submitted ? (
          <SubmittedScreen
            data={submitted}
            onNewPCV={()=>setSubmitted(null)}
            onViewStatus={()=>{setSubmitted(null); setTab('status');}}
          />
        ) : (
          <NewVoucherTab onSubmitted={data=>{setSubmitted(data);}}/>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
    </div>
  );
};

export default FinancePCV;
