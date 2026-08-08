import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Banknote, Building, Smartphone, CheckCircle, Clock, XCircle,
  ArrowRight, RefreshCw, PenTool, Trash2, User, Printer
} from 'lucide-react';
import api from '../../services/apiClient';

/* ── Global CSS ─────────────────────────────────────────────── */
const G = `
  .pcv-wrap {
    padding: 24px;
    background: #F5F5F5;
    min-height: 100vh;
    font-family: 'Inter', sans-serif;
    width: 100%;
    box-sizing: border-box;
  }
  .pcv-card {
    background: #FFFFFF;
    border: 1px solid #8D6E63;
    border-radius: 0;
    margin-bottom: 22px;
    width: 100%;
    box-sizing: border-box;
    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  }
  .pcv-inp {
    width: 100%;
    padding: 11px 14px;
    border: 2px solid #8D6E63;
    border-radius: 0;
    box-sizing: border-box;
    outline: none;
    font-size: 14px;
    font-weight: 600;
    color: #424242;
    background: #FFFFFF;
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .pcv-inp:focus {
    border-color: #228B22;
    box-shadow: 0 0 0 3px rgba(34,139,34,0.15);
  }
  .pcv-lbl {
    display: block;
    font-size: 12px;
    font-weight: 800;
    color: #1B5E20;
    margin-bottom: 7px;
  }
  .btn-green {
    background: #228B22;
    color: #FFFFFF;
    border: none;
    border-radius: 0;
    cursor: pointer;
    font-weight: 700;
    transition: background 0.2s, transform 0.15s;
  }
  .btn-green:hover {
    background: #1B5E20;
    transform: translateY(-1px);
  }
  .btn-olive {
    background: #6B8E23;
    color: #FFFFFF;
    border: none;
    border-radius: 0;
    cursor: pointer;
    font-weight: 700;
    transition: background 0.2s;
  }
  .btn-olive:hover { background: #556B2F; }
  .btn-outline {
    background: #FFFFFF;
    color: #1B5E20;
    border: 2px solid #228B22;
    border-radius: 0;
    cursor: pointer;
    font-weight: 700;
    transition: background 0.2s, color 0.2s;
  }
  .btn-outline:hover { background: #228B22; color: #FFFFFF; }
  .btn-danger {
    background: #F44336;
    color: #FFFFFF;
    border: none;
    border-radius: 0;
    cursor: pointer;
    font-weight: 700;
    transition: background 0.2s;
  }
  .btn-danger:hover { background: #C62828; }
  .tab-btn {
    flex: 1;
    padding: 15px;
    font-size: 15px;
    font-weight: 700;
    border: 2px solid #8D6E63;
    border-radius: 0;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    transition: all 0.2s;
  }
  .tab-active {
    background: #228B22;
    color: #FFFFFF;
    border-color: #1B5E20;
  }
  .tab-inactive {
    background: #FFFFFF;
    color: #424242;
  }
  .tab-inactive:hover { background: #2E8B57; color: #FFFFFF; }
  .pcv-tr { transition: background 0.15s; }
  .pcv-tr:hover { background: #A5D6A7 !important; }
  .section-title {
    font-size: 16px;
    font-weight: 800;
    color: #1B5E20;
    margin: 0 0 14px;
    padding-bottom: 8px;
    border-bottom: 2px solid #8D6E63;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .pay-method-tile {
    padding: 18px;
    border: 2px solid #8D6E63;
    border-radius: 0;
    cursor: pointer;
    font-weight: 700;
    font-size: 14px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    transition: all 0.2s;
  }
  .pay-method-tile:hover { background: #A5D6A7; color: #1B5E20; }
  .status-card {
    background: #FFFFFF;
    border: 2px solid #8D6E63;
    border-radius: 0;
    padding: 18px 22px;
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 12px;
    transition: box-shadow 0.15s;
  }
  .status-card:hover { box-shadow: 0 4px 12px rgba(34,139,34,0.15); }
  .pcv-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
  .pcv-grid-3 { display: grid; grid-template-columns: repeat(3,1fr); gap: 18px; }
  @media (max-width: 768px) {
    .pcv-grid-2, .pcv-grid-3 { grid-template-columns: 1fr; }
    .pcv-wrap { padding: 12px; }
    .tab-btn { font-size: 13px; padding: 12px 8px; }
  }
  @keyframes spin { to { transform: rotate(360deg); } }
`;

/* ── Notification Banner ─────────────────────────────────────── */
const Notif = ({ n, onClose }) => {
  if (!n) return null;
  return (
    <div style={{ background: n.type === 'error' ? '#F44336' : '#4CAF50', color: '#FFFFFF', padding: '14px 24px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12, fontWeight: 700, border: '2px solid #1B5E20', width: '100%', boxSizing: 'border-box' }}>
      {n.type === 'error' ? <XCircle size={18} /> : <CheckCircle size={18} />}
      {n.msg}
      <button onClick={onClose} style={{ marginLeft: 'auto', background: 'transparent', border: 'none', color: '#FFFFFF', cursor: 'pointer', fontWeight: 900, fontSize: 18, lineHeight: 1 }}>✕</button>
    </div>
  );
};

/* ── Signature Pad ───────────────────────────────────────────── */
const SigPad = ({ label, onSave }) => {
  const canvasRef = useRef(null);
  const drawing   = useRef(false);
  const lastPos   = useRef(null);
  const [saved, setSaved] = useState(false);
  const [empty, setEmpty] = useState(true);

  const getPos = (e, c) => {
    const r = c.getBoundingClientRect();
    const sx = c.width / r.width, sy = c.height / r.height;
    if (e.touches) return { x: (e.touches[0].clientX - r.left) * sx, y: (e.touches[0].clientY - r.top) * sy };
    return { x: (e.clientX - r.left) * sx, y: (e.clientY - r.top) * sy };
  };

  const start = useCallback(e => {
    e.preventDefault();
    drawing.current = true;
    lastPos.current = getPos(e, canvasRef.current);
    setSaved(false);
  }, []);

  const move = useCallback(e => {
    e.preventDefault();
    if (!drawing.current) return;
    const c = canvasRef.current, ctx = c.getContext('2d'), p = getPos(e, c);
    ctx.beginPath(); ctx.moveTo(lastPos.current.x, lastPos.current.y); ctx.lineTo(p.x, p.y);
    ctx.strokeStyle = '#1B5E20'; ctx.lineWidth = 2; ctx.lineCap = 'square'; ctx.stroke();
    lastPos.current = p; setEmpty(false);
  }, []);

  const stop = useCallback(() => { drawing.current = false; }, []);

  useEffect(() => {
    const c = canvasRef.current; if (!c) return;
    c.addEventListener('touchstart', start, { passive: false });
    c.addEventListener('touchmove', move, { passive: false });
    c.addEventListener('touchend', stop, { passive: false });
    return () => { c.removeEventListener('touchstart', start); c.removeEventListener('touchmove', move); c.removeEventListener('touchend', stop); };
  }, [start, move, stop]);

  const handleSave = () => { if (!empty) { onSave(canvasRef.current.toDataURL('image/png')); setSaved(true); } };
  const handleClear = () => {
    const c = canvasRef.current; c.getContext('2d').clearRect(0, 0, c.width, c.height);
    setEmpty(true); setSaved(false); onSave(null);
  };

  return (
    <div style={{ border: '2px solid #8D6E63', borderRadius: 0, overflow: 'hidden', background: '#FFFFFF' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 12px', background: '#A5D6A7', borderBottom: '2px solid #8D6E63' }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: '#1B5E20', display: 'flex', alignItems: 'center', gap: 5 }}>
          <PenTool size={12} /> {label}
          {saved && <span style={{ background: '#228B22', color: '#FFFFFF', fontSize: 10, padding: '2px 6px', marginLeft: 4 }}>✓ Saved</span>}
        </span>
        <div style={{ display: 'flex', gap: 6 }}>
          <button type="button" className="btn-danger" onClick={handleClear} style={{ fontSize: 11, padding: '3px 9px' }}><Trash2 size={11} /></button>
          <button type="button" onClick={handleSave} disabled={empty} style={{ fontSize: 11, padding: '3px 9px', background: empty ? '#9E9E9E' : '#2E8B57', color: '#FFFFFF', border: 'none', borderRadius: 0, cursor: empty ? 'not-allowed' : 'pointer', fontWeight: 700 }}>Save</button>
        </div>
      </div>
      <canvas ref={canvasRef} width={400} height={110} onMouseDown={start} onMouseMove={move} onMouseUp={stop} onMouseLeave={stop} style={{ width: '100%', height: 110, display: 'block', cursor: 'crosshair', touchAction: 'none', background: '#FFFFFF' }} />
      <div style={{ padding: '4px 10px', fontSize: 10, color: '#1B5E20', textAlign: 'center', background: '#A5D6A7', borderTop: '2px solid #8D6E63', fontWeight: 700 }}>
        {empty ? 'Draw signature then Save' : saved ? '✓ Captured' : 'Press Save to confirm'}
      </div>
    </div>
  );
};

/* ── Print Signature Block ───────────────────────────────────── */
const SigBlock = ({ label, name, sig }) => (
  <div style={{ textAlign: 'center', minWidth: 180 }}>
    <div style={{ height: 70, border: '2px solid #424242', borderRadius: 0, marginBottom: 6, overflow: 'hidden', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {sig ? <img src={sig} alt={label} style={{ maxHeight: 65, maxWidth: '100%', objectFit: 'contain' }} /> : <span style={{ color: '#ccc', fontSize: 11 }}>—</span>}
    </div>
    <div style={{ borderTop: '2px solid #424242', paddingTop: 4 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: '#424242' }}>{name || '_______________'}</div>
      <div style={{ fontSize: 11, color: '#424242', marginTop: 2, fontWeight: 600 }}>{label}</div>
    </div>
  </div>
);

/* ── Status Badge ─────────────────────────────────────────────── */
const StatusBadge = ({ status }) => {
  const map = {
    pending_ceo:      { label: 'Awaiting CEO',      bg: '#FFF3E0', color: '#FF9800' },
    approved_finance: { label: 'CEO Approved',       bg: '#A5D6A7', color: '#1B5E20' },
    rejected:         { label: 'Rejected by CEO',    bg: '#FFEBEE', color: '#F44336' },
    completed:        { label: 'Completed',           bg: '#E3F2FD', color: '#1565C0' },
  };
  const s = map[status] || { label: status, bg: '#F5F5F5', color: '#424242' };
  return <span style={{ background: s.bg, color: s.color, padding: '4px 12px', fontSize: 11, fontWeight: 800, border: `1px solid ${s.color}`, whiteSpace: 'nowrap' }}>{s.label}</span>;
};

/* ── Finalize Modal ───────────────────────────────────────────── */
const FinalizeModal = ({ pcv, onClose, onDone }) => {
  const [step, setStep]     = useState('confirm');
  const [errMsg, setErrMsg] = useState('');

  const finalize = async () => {
    setStep('loading');
    try {
      await api.put(`/finance-cash/pcv/${pcv.id}/finalize`);
      setStep('done');
      onDone();
    } catch (e) {
      setErrMsg(e?.response?.data?.message || e.message || 'Unknown error');
      setStep('error');
    }
  };

  const pm = pcv.payment_method;

  const printPCV = () => {
    const formatAmt = v => parseFloat(v || 0).toLocaleString(undefined, { minimumFractionDigits: 2 });
    const paymentBlock = pm === 'Bank'
      ? `<div class="payment-box"><b>Bank Details:</b><br/>Bank: ${pcv.bank_name || ''}<br/>A/C Name: ${pcv.account_holder || ''}<br/>A/C No: ${pcv.account_number || ''}${pcv.cheque_no ? `<br/>Cheque: ${pcv.cheque_no}` : ''}</div>`
      : pm === 'Telebirr'
      ? `<div class="payment-box"><b>Telebirr:</b><br/>Mobile: ${pcv.telebirr_number || ''}<br/>Name: ${pcv.telebirr_name || ''}</div>`
      : `<div class="payment-box" style="font-size:18px;font-weight:bold;text-align:center;">By Cash</div>`;

    const sigImg = (sig, name, lbl) => `
      <div class="sig-block">
        <div class="sig-box">${sig ? `<img src="${sig}" style="max-height:60px;max-width:100%;object-fit:contain;" />` : ''}</div>
        <div class="sig-line"></div>
        <div class="sig-name">${name || '_______________'}</div>
        <div class="sig-label">${lbl}</div>
      </div>`;

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>PCV ${pcv.pcv_number}</title>
    <style>*{box-sizing:border-box;margin:0;padding:0;}body{font-family:'Times New Roman',serif;background:white;color:#000;padding:36px 48px;}.header{text-align:center;border-bottom:3px double #000;padding-bottom:16px;margin-bottom:20px;}.header h1{font-size:26px;text-transform:uppercase;letter-spacing:3px;margin-bottom:4px;}.header h2{font-size:16px;font-weight:normal;color:#333;}.meta-row{display:flex;justify-content:space-between;margin-bottom:24px;font-size:13px;}.fields{line-height:2.8;font-size:15px;margin-bottom:24px;}.fields .field-line{display:flex;align-items:baseline;gap:8px;}.fields .underline{border-bottom:1px solid #000;display:inline-block;min-width:300px;flex:1;}.amount-row{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:40px;}.amount-box{padding:12px 24px;border:2px solid #000;font-size:26px;font-weight:bold;}.payment-box{padding:12px 16px;border:1px solid #555;font-size:13px;min-width:220px;line-height:1.8;}.sigs{display:flex;justify-content:space-between;align-items:flex-end;margin-top:48px;}.sig-block{text-align:center;min-width:160px;}.sig-box{height:70px;border:1px solid #999;margin-bottom:6px;display:flex;align-items:center;justify-content:center;background:#fff;}.sig-line{border-top:1px solid #333;margin-bottom:4px;}.sig-name{font-size:13px;font-weight:700;}.sig-label{font-size:11px;color:#555;margin-top:2px;}@page{margin:14mm;size:A4;}</style>
    </head><body>
    <div class="header"><h1>Sutana Enterprise</h1><h2>PETTY CASH VOUCHER (PCV)</h2></div>
    <div class="meta-row"><div><b>Voucher No:</b> <span style="font-family:monospace;font-size:15px">${pcv.pcv_number}</span><br/><b>Reference:</b> ${pcv.reference_no || 'N/A'}</div><div style="text-align:right"><b>Date:</b> ${new Date(pcv.date).toLocaleDateString('en-GB')}<br/><b>Payment Method:</b> ${pm}</div></div>
    <div class="fields"><div class="field-line"><b>PAID TO:</b>&nbsp;<span class="underline">${pcv.paid_to}</span></div><div class="field-line"><b>THE SUM OF:</b>&nbsp;<span class="underline" style="font-style:italic">${formatAmt(pcv.amount)} ETB Only</span></div><div class="field-line"><b>BEING PAYMENT FOR:</b>&nbsp;<span class="underline">${pcv.description || ''}</span></div></div>
    <div class="amount-row"><div class="amount-box">ETB ${formatAmt(pcv.amount)}</div>${paymentBlock}</div>
    <div class="sigs">${sigImg(pcv.prepared_signature, pcv.prepared_by, 'Prepared By')}${sigImg(pcv.checked_signature, pcv.checked_by, 'Checked By')}${sigImg(pcv.receiver_signature, pcv.receiver_name, "Payee's Signature")}</div>
    <div style="margin-top:32px;display:flex;justify-content:space-between;font-size:12px;color:#555"><span>Printed: ${new Date().toLocaleString('en-GB')}</span><div style="padding:10px 18px;border:2px solid #000">✔ Recorded in Cashbook</div></div>
    </body></html>`;

    const w = window.open('', '_blank', 'width=800,height=1000');
    w.document.write(html); w.document.close(); w.focus();
    setTimeout(() => { w.print(); }, 400);
  };

  const overlay = children => (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      {children}
    </div>
  );

  if (step === 'confirm') return overlay(
    <div style={{ background: '#FFFFFF', borderRadius: 0, padding: 36, maxWidth: 500, width: '100%', border: '2px solid #1B5E20', boxShadow: '0 25px 60px rgba(0,0,0,.3)' }}>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ background: '#A5D6A7', width: 72, height: 72, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', border: '2px solid #1B5E20' }}>
          <CheckCircle size={40} color="#1B5E20" />
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: '#1B5E20', margin: '0 0 6px' }}>CEO Approved!</h2>
        <p style={{ color: '#424242', fontSize: 13, margin: 0 }}>
          <b>{pcv.pcv_number}</b> was approved by the CEO.<br />
          Click <b>"Save & Record"</b> to record it in the cashbook and print the voucher.
        </p>
      </div>
      <div style={{ background: '#F5F5F5', border: '2px solid #8D6E63', padding: 16, marginBottom: 24 }}>
        <div className="pcv-grid-2" style={{ fontSize: 13, gap: 10 }}>
          <div><span style={{ color: '#6B8E23', fontSize: 11, display: 'block', fontWeight: 700 }}>Voucher No.</span><b style={{ fontFamily: 'monospace' }}>{pcv.pcv_number}</b></div>
          <div><span style={{ color: '#6B8E23', fontSize: 11, display: 'block', fontWeight: 700 }}>Date</span><b>{new Date(pcv.date).toLocaleDateString('en-GB')}</b></div>
          <div><span style={{ color: '#6B8E23', fontSize: 11, display: 'block', fontWeight: 700 }}>Paid To</span><b>{pcv.paid_to}</b></div>
          <div><span style={{ color: '#6B8E23', fontSize: 11, display: 'block', fontWeight: 700 }}>Method</span><b>{pm}</b></div>
          <div style={{ gridColumn: 'span 2' }}>
            <span style={{ color: '#6B8E23', fontSize: 11, display: 'block', fontWeight: 700 }}>Amount</span>
            <span style={{ fontWeight: 900, fontSize: 22, color: '#1B5E20' }}>ETB {parseFloat(pcv.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
          {pcv.description && <div style={{ gridColumn: 'span 2' }}><span style={{ color: '#6B8E23', fontSize: 11, display: 'block', fontWeight: 700 }}>Description</span><span>{pcv.description}</span></div>}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 12 }}>
        <button className="btn-outline" onClick={onClose} style={{ flex: 1, padding: '12px', fontSize: 14 }}>Cancel</button>
        <button className="btn-green" onClick={finalize} style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '12px', fontSize: 14 }}>
          <CheckCircle size={18} /> Save & Record in Cashbook
        </button>
      </div>
    </div>
  );

  if (step === 'loading') return overlay(
    <div style={{ background: '#FFFFFF', border: '2px solid #1B5E20', padding: 40, textAlign: 'center', boxShadow: '0 25px 60px rgba(0,0,0,.3)' }}>
      <SegmentedSpinner size={40} />
      <p style={{ fontWeight: 700, color: '#1B5E20', fontSize: 16, margin: 0 }}>Recording in cashbook…</p>
    </div>
  );

  if (step === 'error') return overlay(
    <div style={{ background: '#FFFFFF', border: '2px solid #F44336', padding: 36, maxWidth: 440, width: '100%', boxShadow: '0 25px 60px rgba(0,0,0,.3)', textAlign: 'center' }}>
      <XCircle size={48} color="#F44336" style={{ marginBottom: 12 }} />
      <h3 style={{ color: '#F44336', fontWeight: 800, margin: '0 0 8px' }}>Finalize Failed</h3>
      <p style={{ color: '#424242', fontSize: 13, marginBottom: 20 }}>{errMsg}</p>
      <button className="btn-danger" onClick={onClose} style={{ padding: '10px 24px', fontSize: 14 }}>Close</button>
    </div>
  );

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
        <div style={{ background: '#FFFFFF', border: '2px solid #228B22', padding: 40, maxWidth: 520, width: '100%', textAlign: 'center', boxShadow: '0 25px 60px rgba(0,0,0,.3)' }}>
          <div style={{ background: '#A5D6A7', width: 80, height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', border: '2px solid #1B5E20' }}>
            <CheckCircle size={48} color="#1B5E20" />
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1B5E20', margin: '0 0 8px' }}>Saved to Cashbook!</h2>
          <p style={{ color: '#424242', marginBottom: 6, fontWeight: 600 }}><b>{pcv.pcv_number}</b> has been finalized.</p>
          <p style={{ color: '#6B8E23', fontSize: 13, marginBottom: 28, fontWeight: 700 }}>
            ETB {parseFloat(pcv.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })} has been deducted from the cashbook.
          </p>
          <div style={{ display: 'flex', gap: 12 }}>
            <button className="btn-outline" onClick={printPCV} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px', fontSize: 14 }}>
              <Printer size={16} /> Print PCV
            </button>
            <button className="btn-green" onClick={onClose} style={{ flex: 1, padding: '12px', fontSize: 14 }}>Close</button>
          </div>
        </div>
      </div>
    </>
  );
};

/* ── PCV Status Tab ───────────────────────────────────────────── */
const PCVStatusTab = () => {
  const [pcvs, setPcvs]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [target, setTarget] = useState(null);
  const [notif, setNotif]   = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/finance-cash/pcv/pending');
      const data = res?.data?.data || res?.data || [];
      setPcvs(Array.isArray(data) ? data : []);
    } catch (e) {
      setNotif({ type: 'error', msg: e.message || 'Failed to load PCVs' });
    } finally { setLoading(false); }
  };

  const handleMarkRead = async (id) => {
    try {
      await api.put(`/finance-cash/pcv/${id}/finance-read`);
      setPcvs(prev => prev.map(p => p.id === id ? { ...p, finance_read: true } : p));
    } catch (e) {
      setNotif({ type: 'error', msg: e.message || 'Failed to mark as read' });
    }
  };

  useEffect(() => { load(); }, []);

  const groups = {
    approved: pcvs.filter(p => p.status === 'approved_finance'),
    pending:  pcvs.filter(p => p.status === 'pending_ceo'),
    rejected: pcvs.filter(p => p.status === 'rejected'),
    done:     pcvs.filter(p => p.status === 'completed'),
  };

  const PCVCard = ({ pcv, isApproved }) => {
    const isUnread = !pcv.finance_read && (pcv.status === 'approved_finance' || pcv.status === 'rejected');
    return (
      <div className="status-card" style={{ border: isApproved ? '2px solid #228B22' : '2px solid #8D6E63', background: isApproved ? '#F1F8E9' : '#FFFFFF' }}>
        <div style={{ flexShrink: 0, background: isApproved ? '#A5D6A7' : '#FFF3E0', padding: 10 }}>
          <Banknote size={22} color={isApproved ? '#1B5E20' : '#FF9800'} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
            <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: 15, color: '#1B5E20' }}>{pcv.pcv_number}</span>
            <StatusBadge status={pcv.status} />
          </div>
          <div style={{ fontSize: 13, color: '#424242', display: 'flex', gap: 10, flexWrap: 'wrap', fontWeight: 600 }}>
            <span>To: <b style={{ color: '#1B5E20' }}>{pcv.paid_to}</b></span>
            <span>·</span>
            <span>{new Date(pcv.date).toLocaleDateString('en-GB')}</span>
            <span>·</span>
            <span style={{ fontWeight: 800, color: isApproved ? '#1B5E20' : '#FF9800' }}>ETB {parseFloat(pcv.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            <span>·</span>
            <span>{pcv.payment_method}</span>
          </div>
          {pcv.status === 'rejected' && pcv.reject_reason && (
            <div style={{ marginTop: 8, fontSize: 12, background: '#FFEBEE', color: '#F44336', padding: '4px 12px', display: 'inline-block', border: '1px solid #F44336', fontWeight: 700 }}>
              Reason: {pcv.reject_reason}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0, flexWrap: 'wrap' }}>
          {isUnread && (
            <button className="btn-olive" onClick={() => handleMarkRead(pcv.id)} style={{ padding: '9px 14px', fontSize: 12, whiteSpace: 'nowrap' }}>
              Mark as Read
            </button>
          )}
          {isApproved && (
            <button className="btn-green" onClick={() => { if (isUnread) handleMarkRead(pcv.id); setTarget(pcv); }} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 16px', fontSize: 13, whiteSpace: 'nowrap' }}>
              <ArrowRight size={15} /> Continue PCV
            </button>
          )}
        </div>
      </div>
    );
  };

  const Section = ({ title, items, accentColor, isApproved }) => {
    if (!items.length) return null;
    return (
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <h3 style={{ fontSize: 15, fontWeight: 800, color: accentColor, margin: 0 }}>{title}</h3>
          <span style={{ background: accentColor, color: '#FFFFFF', padding: '2px 10px', fontSize: 12, fontWeight: 800 }}>{items.length}</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {items.map(p => <PCVCard key={p.id} pcv={p} isApproved={!!isApproved} />)}
        </div>
      </div>
    );
  };

  return (
    <div>
      <Notif n={notif} onClose={() => setNotif(null)} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: '#1B5E20', margin: '0 0 4px' }}>PCV Status Tracker</h2>
          <p style={{ color: '#424242', fontSize: 14, margin: 0, fontWeight: 600 }}>Track and finalize approved petty cash vouchers.</p>
        </div>
        <button className="btn-green" onClick={load} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', fontSize: 13 }}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 80, color: '#1B5E20', fontWeight: 700 }}>
          <SegmentedSpinner size={32} />
          Loading PCVs…
        </div>
      ) : pcvs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 80, background: '#FFFFFF', border: '2px solid #8D6E63' }}>
          <CheckCircle size={48} color="#4CAF50" style={{ marginBottom: 16, display: 'block', margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: 20, fontWeight: 800, color: '#1B5E20', margin: '0 0 8px' }}>No PCVs yet</h3>
          <p style={{ color: '#424242', margin: 0, fontWeight: 600 }}>Create a PCV from the "New Voucher" tab.</p>
        </div>
      ) : (
        <>
          <Section title="CEO Approved — Ready to Finalize" items={groups.approved} accentColor="#228B22" isApproved={true} />
          <Section title="Awaiting CEO Approval"             items={groups.pending}  accentColor="#FF9800" />
          <Section title="Rejected by CEO"                   items={groups.rejected} accentColor="#F44336" />
          <Section title="Completed"                         items={groups.done}     accentColor="#1565C0" />
        </>
      )}

      {target && (
        <FinalizeModal pcv={target} onClose={() => { setTarget(null); load(); }} onDone={() => { load(); }} />
      )}
    </div>
  );
};

/* ── New PCV Form Tab ─────────────────────────────────────────── */
const NewVoucherTab = ({ onSubmitted }) => {
  const [date,           setDate]           = useState(new Date().toISOString().slice(0, 10));
  const [paidTo,         setPaidTo]         = useState('');
  const [amount,         setAmount]         = useState('');
  const [amountWords,    setAmountWords]    = useState('');
  const [paymentMethod,  setPaymentMethod]  = useState('Cash');
  const [description,    setDescription]   = useState('');
  const [referenceNo,    setReferenceNo]    = useState('');
  const [bankName,       setBankName]       = useState('');
  const [accountHolder,  setAccountHolder]  = useState('');
  const [accountNumber,  setAccountNumber]  = useState('');
  const [chequeNo,       setChequeNo]       = useState('');
  const [telebirrNumber, setTelebirrNumber] = useState('');
  const [telebirrName,   setTelebirrName]   = useState('');
  const [preparedBy,     setPreparedBy]     = useState('');
  const [checkedBy,      setCheckedBy]      = useState('');
  const [receiverName,   setReceiverName]   = useState('');
  const [preparedSig,    setPreparedSig]    = useState(null);
  const [checkedSig,     setCheckedSig]     = useState(null);
  const [receiverSig,    setReceiverSig]    = useState(null);
  const [loading,        setLoading]        = useState(false);
  const [notif,          setNotif]          = useState(null);

  const handleAmount = e => {
    setAmount(e.target.value);
    const v = parseFloat(e.target.value);
    setAmountWords(isNaN(v) ? '' : `${v.toLocaleString('en-US')} ETB Only`);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setNotif(null); setLoading(true);
    try {
      const payload = {
        date, paidTo, amount: parseFloat(amount), paymentMethod, description, referenceNo,
        bankDetails:     paymentMethod === 'Bank'     ? { bankName, accountHolder, accountNumber, chequeNo } : null,
        telebirrDetails: paymentMethod === 'Telebirr' ? { telebirrNumber, fullName: telebirrName }           : null,
        preparedBy, checkedBy, receiverName,
        preparedSignature: preparedSig, checkedSignature: checkedSig, receiverSignature: receiverSig,
      };
      const res = await api.post('/finance-cash/pcv', payload);
      onSubmitted({ pcvNumber: res.data?.data?.pcvNumber, ...payload, amountWords });
    } catch (err) {
      setNotif({ type: 'error', msg: err.response?.data?.message || err.message || 'Failed to submit PCV' });
    } finally { setLoading(false); }
  };

  return (
    <form onSubmit={handleSubmit} style={{ width: '100%' }}>
      <Notif n={notif} onClose={() => setNotif(null)} />

      {/* General Information */}
      <div className="pcv-card" style={{ padding: 28 }}>
        <h3 className="section-title"><User size={18} /> General Information</h3>
        <div className="pcv-grid-2" style={{ marginBottom: 18 }}>
          <div>
            <label className="pcv-lbl">Date *</label>
            <input className="pcv-inp" type="date" required value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <div>
            <label className="pcv-lbl">Paid To *</label>
            <input className="pcv-inp" required value={paidTo} onChange={e => setPaidTo(e.target.value)} placeholder="Payee name" />
          </div>
        </div>
        <div className="pcv-grid-2" style={{ marginBottom: 18 }}>
          <div>
            <label className="pcv-lbl">Amount (ETB) *</label>
            <input className="pcv-inp" required type="number" step="0.01" value={amount} onChange={handleAmount} placeholder="0.00" style={{ fontSize: 16, fontWeight: 800, color: '#1B5E20' }} />
          </div>
          <div>
            <label className="pcv-lbl">Amount in Words</label>
            <input className="pcv-inp" readOnly value={amountWords} placeholder="Auto-filled" style={{ background: '#F5F5F5', fontStyle: 'italic' }} />
          </div>
        </div>
        <div style={{ marginBottom: 18 }}>
          <label className="pcv-lbl">Description *</label>
          <input className="pcv-inp" required value={description} onChange={e => setDescription(e.target.value)} placeholder="Purpose of payment" />
        </div>
        <div>
          <label className="pcv-lbl">Reference # (Optional)</label>
          <input className="pcv-inp" value={referenceNo} onChange={e => setReferenceNo(e.target.value)} placeholder="Receipt / Bill number" />
        </div>
      </div>

      {/* Payment Method */}
      <div className="pcv-card" style={{ padding: 28 }}>
        <h3 className="section-title"><Banknote size={18} /> Payment Method</h3>
        <div className="pcv-grid-3" style={{ marginBottom: paymentMethod !== 'Cash' ? 20 : 0 }}>
          {[{ t: 'Cash', Icon: Banknote }, { t: 'Bank', Icon: Building }, { t: 'Telebirr', Icon: Smartphone }].map(({ t, Icon }) => (
            <div key={t} className="pay-method-tile" onClick={() => setPaymentMethod(t)} style={{ background: paymentMethod === t ? '#228B22' : '#FFFFFF', color: paymentMethod === t ? '#FFFFFF' : '#424242', border: paymentMethod === t ? '2px solid #1B5E20' : '2px solid #8D6E63' }}>
              <Icon size={28} /> {t}
            </div>
          ))}
        </div>

        {paymentMethod === 'Bank' && (
          <div style={{ background: '#A5D6A7', padding: 20, border: '2px solid #1B5E20' }}>
            <div style={{ fontWeight: 800, fontSize: 14, color: '#1B5E20', marginBottom: 14 }}>Bank Details</div>
            <div className="pcv-grid-2">
              <input className="pcv-inp" required value={bankName}      onChange={e => setBankName(e.target.value)}      placeholder="Bank Name *" />
              <input className="pcv-inp" required value={accountHolder} onChange={e => setAccountHolder(e.target.value)} placeholder="Account Holder *" />
              <input className="pcv-inp" required value={accountNumber} onChange={e => setAccountNumber(e.target.value)} placeholder="Account Number *" />
              <input className="pcv-inp"         value={chequeNo}       onChange={e => setChequeNo(e.target.value)}       placeholder="Cheque # (optional)" />
            </div>
          </div>
        )}

        {paymentMethod === 'Telebirr' && (
          <div style={{ background: '#A5D6A7', padding: 20, border: '2px solid #1B5E20' }}>
            <div style={{ fontWeight: 800, fontSize: 14, color: '#1B5E20', marginBottom: 14 }}>Telebirr Details</div>
            <div className="pcv-grid-2">
              <input className="pcv-inp" required value={telebirrNumber} onChange={e => setTelebirrNumber(e.target.value)} placeholder="Mobile Number *" />
              <input className="pcv-inp" required value={telebirrName}   onChange={e => setTelebirrName(e.target.value)}   placeholder="Full Name *" />
            </div>
          </div>
        )}
      </div>

      {/* Signatures */}
      <div className="pcv-card" style={{ padding: 28 }}>
        <h3 className="section-title"><PenTool size={18} /> Signatures</h3>
        <div className="pcv-grid-3">
          {[
            { label: 'Prepared By *',  nameVal: preparedBy,  setName: setPreparedBy,  onSig: setPreparedSig,  sig: preparedSig },
            { label: 'Checked By *',   nameVal: checkedBy,   setName: setCheckedBy,   onSig: setCheckedSig,   sig: checkedSig },
            { label: "Payee's Name *", nameVal: receiverName, setName: setReceiverName, onSig: setReceiverSig, sig: receiverSig },
          ].map(({ label, nameVal, setName, onSig, sig }) => (
            <div key={label}>
              <label className="pcv-lbl">{label}</label>
              <input className="pcv-inp" required value={nameVal} onChange={e => setName(e.target.value)} placeholder="Full name" style={{ marginBottom: 10 }} />
              <SigPad label={label.replace(' *', '')} onSave={onSig} />
              {sig && <p style={{ margin: '4px 0 0', fontSize: 10, color: '#228B22', fontWeight: 800 }}>✓ Signature ready</p>}
            </div>
          ))}
        </div>
      </div>

      <button type="submit" disabled={loading} className="btn-green" style={{ width: '100%', padding: '18px', fontSize: 17, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, background: loading ? '#9E9E9E' : '#228B22', marginTop: 4 }}>
        {loading ? <><SegmentedSpinner size={20} /> Processing…</> : <><CheckCircle size={20} /> Generate Petty Cash Voucher</>}
      </button>
    </form>
  );
};

/* ── Submitted Success Screen ─────────────────────────────────── */
const SubmittedScreen = ({ data, onNewPCV, onViewStatus }) => (
  <div style={{ background: '#FFFFFF', border: '2px solid #228B22', padding: 40, textAlign: 'center' }}>
    <div style={{ background: '#A5D6A7', width: 80, height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', border: '2px solid #1B5E20' }}>
      <Clock size={48} color="#1B5E20" />
    </div>
    <h2 style={{ fontSize: 24, fontWeight: 800, color: '#1B5E20', margin: '0 0 8px' }}>Sent for CEO Approval</h2>
    <p style={{ color: '#424242', marginBottom: 4, fontWeight: 600 }}>Your PCV is now <b>waiting for CEO approval</b>.</p>
    <p style={{ color: '#6B8E23', fontSize: 13, marginBottom: 24, fontWeight: 700 }}>Once approved, go to the <b>PCV Status</b> tab to finalize and record in the cashbook.</p>
    <div style={{ background: '#F5F5F5', padding: 20, border: '2px solid #8D6E63', textAlign: 'left', marginBottom: 24 }}>
      <div style={{ fontFamily: 'monospace', fontSize: 20, fontWeight: 800, color: '#1B5E20', textAlign: 'center', letterSpacing: 2, marginBottom: 14 }}>{data.pcvNumber}</div>
      <div className="pcv-grid-2" style={{ fontSize: 14, gap: 12 }}>
        <div><span style={{ color: '#6B8E23', fontSize: 11, display: 'block', fontWeight: 700 }}>Date</span><b>{data.date}</b></div>
        <div><span style={{ color: '#6B8E23', fontSize: 11, display: 'block', fontWeight: 700 }}>Method</span><b>{data.paymentMethod}</b></div>
        <div style={{ gridColumn: 'span 2' }}><span style={{ color: '#6B8E23', fontSize: 11, display: 'block', fontWeight: 700 }}>Paid To</span><b>{data.paidTo}</b></div>
        <div style={{ gridColumn: 'span 2' }}><span style={{ color: '#6B8E23', fontSize: 11, display: 'block', fontWeight: 700 }}>Amount</span><span style={{ fontWeight: 900, color: '#1B5E20', fontSize: 24 }}>ETB {parseFloat(data.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
      </div>
    </div>
    <div style={{ display: 'flex', gap: 12 }}>
      <button className="btn-outline" onClick={onViewStatus} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '13px', fontSize: 14 }}>
        View PCV Status →
      </button>
      <button className="btn-green" onClick={onNewPCV} style={{ flex: 1, padding: '13px', fontSize: 14 }}>New PCV</button>
    </div>
  </div>
);

/* ── Main Container ───────────────────────────────────────────── */
const FinancePCV = () => {
  const [tab,       setTab]       = useState('new');
  const [submitted, setSubmitted] = useState(null);

  const switchTab = t => { setTab(t); setSubmitted(null); };

  return (
    <div className="pcv-wrap">
      <style>{G}</style>

      {/* Tab Switcher */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24, width: '100%' }}>
        {[{ k: 'new', label: 'New Voucher', Icon: PenTool }, { k: 'status', label: 'PCV Status', Icon: Clock }].map(({ k, label, Icon }) => (
          <button key={k} className={`tab-btn ${tab === k ? 'tab-active' : 'tab-inactive'}`} onClick={() => switchTab(k)}>
            <Icon size={18} /> {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ width: '100%' }}>
        {tab === 'status' ? (
          <PCVStatusTab />
        ) : submitted ? (
          <SubmittedScreen
            data={submitted}
            onNewPCV={() => setSubmitted(null)}
            onViewStatus={() => { setSubmitted(null); setTab('status'); }}
          />
        ) : (
          <NewVoucherTab onSubmitted={data => setSubmitted(data)} />
        )}
      </div>
    </div>
  );
};

export default FinancePCV;
