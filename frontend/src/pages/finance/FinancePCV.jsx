import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Banknote, Building, Smartphone, CheckCircle, Clock, XCircle,
  ArrowRight, RefreshCw, PenTool, Trash2, User, Printer
} from 'lucide-react';
import api from '../../services/apiClient';
import SegmentedSpinner from '../../components/ui/SegmentedSpinner';

/* ── Global CSS ─────────────────────────────────────────────── */
const G = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

  .pcv-wrap {
    --color-primary:        #2563EB;
    --color-primary-hover:  #1D4ED8;
    --color-bg-page:        #F5F6FA;
    --color-bg-card:        #FFFFFF;
    --color-border:         #E5E7EB;
    --color-text-primary:   #111827;
    --color-text-secondary: #6B7280;
    --color-text-muted:     #9CA3AF;
    --color-success:        #16A34A;
    --color-success-bg:     #DCFCE7;
    --color-danger:         #DC2626;
    --color-danger-bg:      #FEE2E2;
    --color-warning:        #D97706;
    --color-warning-bg:     #FEF3C7;
    --color-info:           #0284C7;
    --color-info-bg:        #E0F2FE;

    width: 100%;
    min-height: 100vh;
    padding: 24px;
    background: var(--color-bg-page);
    font-family: 'Inter', 'Segoe UI', Roboto, -apple-system, sans-serif;
    font-size: 14px;
    font-weight: 400;
    line-height: 1.5;
    color: var(--color-text-primary);
    box-sizing: border-box;
  }
  .pcv-wrap * { box-sizing: border-box; }
  @media (max-width: 1023px) { .pcv-wrap { padding: 16px; } }
  @media (max-width: 767px)  { .pcv-wrap { padding: 12px; } }
  @media (min-width: 1536px) { .pcv-wrap { max-width: 1536px; margin: 0 auto; } }

  /* ── Cards ── */
  .pcv-card {
    background: var(--color-bg-card);
    border: 1px solid var(--color-border);
    border-radius: 10px;
    margin-bottom: 20px;
    width: 100%;
    padding: 24px;
    box-sizing: border-box;
    box-shadow: 0 1px 3px rgba(0,0,0,.06);
    transition: box-shadow 150ms ease, transform 150ms ease, border-color 150ms ease;
  }
  .pcv-card:hover {
    box-shadow: 0 4px 12px rgba(0,0,0,.08);
    transform: translateY(-1px);
  }

  /* ── Inputs ── */
  .pcv-inp {
    width: 100%;
    height: 36px;
    padding: 0 12px;
    border: 1px solid var(--color-border);
    border-radius: 8px;
    box-sizing: border-box;
    outline: none;
    font-size: 14px;
    font-weight: 400;
    color: var(--color-text-primary);
    background: var(--color-bg-card);
    font-family: inherit;
    transition: border-color 150ms ease-in-out, box-shadow 150ms ease-in-out;
  }
  .pcv-inp:focus {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px rgba(37,99,235,.1);
  }
  .pcv-inp::placeholder { color: var(--color-text-muted); }

  .pcv-lbl {
    display: block;
    font-size: 12px;
    font-weight: 500;
    color: var(--color-text-secondary);
    margin-bottom: 6px;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  /* ── Buttons ── */
  .btn-green, .btn-olive, .btn-outline, .btn-danger {
    height: 36px;
    padding: 0 16px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    font-family: inherit;
    line-height: 1;
    white-space: nowrap;
    border: 1px solid transparent;
    transition: all 150ms ease;
  }
  .btn-green  { background: var(--color-primary); color: #FFFFFF; border-color: var(--color-primary); }
  .btn-olive  { background: #10B981; color: #FFFFFF; border-color: #10B981; }
  .btn-outline{ background: #FFFFFF; color: var(--color-primary); border-color: var(--color-border); }
  .btn-danger { background: var(--color-danger); color: #FFFFFF; border-color: var(--color-danger); }
  .btn-green:hover:not(:disabled), .btn-olive:hover:not(:disabled),
  .btn-outline:hover, .btn-danger:hover:not(:disabled) {
    background: #FBBF24;
    border-color: #F59E0B;
    color: #111827;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(251,191,36,.3);
  }
  .btn-green:disabled, .btn-olive:disabled, .btn-danger:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }

  /* ── Tabs ── */
  .tab-btn {
    flex: 1;
    height: 44px;
    padding: 0 16px;
    font-size: 14px;
    font-weight: 500;
    border: 1px solid var(--color-border);
    border-radius: 8px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    font-family: inherit;
    transition: all 150ms ease;
  }
  .tab-active {
    background: var(--color-primary);
    color: #FFFFFF;
    border-color: var(--color-primary);
    box-shadow: 0 2px 8px rgba(37,99,235,.25);
  }
  .tab-inactive { background: #FFFFFF; color: var(--color-text-secondary); }
  .tab-inactive:hover {
    background: #FBBF24;
    color: #111827;
    border-color: #F59E0B;
    transform: translateY(-1px);
  }

  .pcv-tr { transition: background 150ms ease-in-out; }
  .pcv-tr:hover { background: #F9FAFB !important; }

  .section-title {
    font-size: 16px;
    font-weight: 600;
    color: var(--color-text-primary);
    margin: 0 0 16px;
    padding-bottom: 12px;
    border-bottom: 1px solid var(--color-border);
    display: flex;
    align-items: center;
    gap: 8px;
    letter-spacing: -0.01em;
  }

  /* ── Payment method tiles ── */
  .pay-method-tile {
    padding: 20px;
    border: 1px solid var(--color-border);
    border-radius: 10px;
    cursor: pointer;
    font-weight: 500;
    font-size: 14px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    background: #FFFFFF;
    color: var(--color-text-primary);
    transition: all 150ms ease;
  }
  .pay-method-tile:hover {
    border-color: var(--color-primary);
    background: #EFF6FF;
    color: var(--color-primary);
    box-shadow: 0 4px 12px rgba(37,99,235,.1);
    transform: translateY(-1px);
  }

  /* ── Status cards ── */
  .status-card {
    background: var(--color-bg-card);
    border: 1px solid var(--color-border);
    border-radius: 10px;
    padding: 16px 20px;
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 12px;
    width: 100%;
    box-sizing: border-box;
    transition: box-shadow 150ms ease, transform 150ms ease, border-color 150ms ease;
  }
  .status-card:hover {
    box-shadow: 0 4px 12px rgba(0,0,0,.08);
    transform: translateY(-1px);
  }

  .pcv-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .pcv-grid-3 { display: grid; grid-template-columns: repeat(3,1fr); gap: 16px; }

  @media (max-width: 900px) { .pcv-grid-2 { grid-template-columns: 1fr; } }
  @media (max-width: 768px) {
    .pcv-grid-3 { grid-template-columns: 1fr; }
    .pcv-card { padding: 20px; }
    .tab-btn { font-size: 13px; padding: 0 12px; }
    .status-card { flex-wrap: wrap; }
  }
  @media (max-width: 480px) {
    .status-card { gap: 12px; padding: 14px 16px; }
  }

  @keyframes slideIn {
    from { opacity: 0; transform: translateX(-8px); }
    to   { opacity: 1; transform: translateX(0); }
  }
`;

/* ── Notification Banner ─────────────────────────────────────── */
const Notif = ({ n, onClose }) => {
  if (!n) return null;
  return (
    <div style={{ background: n.type === 'error' ? 'var(--color-danger-bg)' : 'var(--color-success-bg)', color: n.type === 'error' ? '#991B1B' : '#166534', padding: '12px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12, fontWeight: 500, border: '1px solid var(--color-border)', borderLeft: '4px solid ' + (n.type === 'error' ? 'var(--color-danger)' : 'var(--color-success)'), borderRadius: 8, width: '100%', boxSizing: 'border-box', boxShadow: '0 1px 3px rgba(0,0,0,.06)', animation: 'slideIn 150ms ease-out' }}>
      {n.type === 'error' ? <XCircle size={18} /> : <CheckCircle size={18} />}
      {n.msg}
      <button onClick={onClose} style={{ marginLeft: 'auto', background: 'transparent', border: 'none', color: n.type === 'error' ? '#991B1B' : '#166534', cursor: 'pointer', fontWeight: 700, fontSize: 16, lineHeight: 1 }}>✕</button>
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
    ctx.strokeStyle = '#2563EB'; ctx.lineWidth = 2; ctx.lineCap = 'square'; ctx.stroke();
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
    <div style={{ border: '1px solid var(--color-border)', borderRadius: 10, overflow: 'hidden', background: '#FFFFFF' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#F9FAFB', borderBottom: '1px solid var(--color-border)' }}>
        <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: 5 }}>
          <PenTool size={12} /> {label}
          {saved && <span style={{ background: 'var(--color-primary)', color: '#FFFFFF', fontSize: 10, padding: '2px 6px', marginLeft: 4, borderRadius: 9999, fontWeight: 600 }}>✓ Saved</span>}
        </span>
        <div style={{ display: 'flex', gap: 6 }}>
          <button type="button" className="btn-danger" onClick={handleClear} style={{ fontSize: 11, padding: '0 10px', height: 28, gap: 6 }}><Trash2 size={11} /></button>
          <button type="button" onClick={handleSave} disabled={empty} style={{ fontSize: 11, padding: '0 10px', height: 28, background: empty ? 'var(--color-text-muted)' : 'var(--color-primary)', color: '#FFFFFF', border: 'none', borderRadius: 6, cursor: empty ? 'not-allowed' : 'pointer', fontWeight: 500, transition: 'all 150ms ease' }}>Save</button>
        </div>
      </div>
      <canvas ref={canvasRef} width={400} height={110} onMouseDown={start} onMouseMove={move} onMouseUp={stop} onMouseLeave={stop} style={{ width: '100%', height: 110, display: 'block', cursor: 'crosshair', touchAction: 'none', background: '#FFFFFF' }} />
      <div style={{ padding: '6px 10px', fontSize: 10, color: 'var(--color-text-secondary)', textAlign: 'center', background: '#F9FAFB', borderTop: '1px solid var(--color-border)', fontWeight: 500 }}>
        {empty ? 'Draw signature then Save' : saved ? '✓ Captured' : 'Press Save to confirm'}
      </div>
    </div>
  );
};

/* ── Print Signature Block ───────────────────────────────────── */
const SigBlock = ({ label, name, sig }) => (
  <div style={{ textAlign: 'center', minWidth: 180 }}>
    <div style={{ height: 70, border: '1px solid var(--color-border)', borderRadius: 10, marginBottom: 6, overflow: 'hidden', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {sig ? <img src={sig} alt={label} style={{ maxHeight: 65, maxWidth: '100%', objectFit: 'contain' }} /> : <span style={{ color: '#ccc', fontSize: 11 }}>—</span>}
    </div>
    <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 4 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>{name || '_______________'}</div>
      <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 2, fontWeight: 400 }}>{label}</div>
    </div>
  </div>
);

/* ── Status Badge ─────────────────────────────────────────────── */
const StatusBadge = ({ status }) => {
  const map = {
    pending_ceo:      { label: 'Awaiting CEO',      bg: 'var(--color-warning-bg)', color: 'var(--color-warning)' },
    approved_finance: { label: 'CEO Approved',       bg: 'var(--color-success-bg)', color: 'var(--color-success)' },
    rejected:         { label: 'Rejected by CEO',    bg: 'var(--color-danger-bg)', color: 'var(--color-danger)' },
    completed:        { label: 'Completed',           bg: 'var(--color-info-bg)', color: 'var(--color-info)' },
  };
  const s = map[status] || { label: status, bg: '#F3F4F6', color: 'var(--color-text-secondary)' };
  return <span style={{ background: s.bg, color: s.color, padding: '2px 10px', fontSize: 12, fontWeight: 500, border: '1px solid transparent', borderRadius: 9999, whiteSpace: 'nowrap' }}>{s.label}</span>;
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
    <div class="header"><h1>Sutana Enterprise</h1><h2>Petty Cash (PCV)</h2></div>
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
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      {children}
    </div>
  );

  if (step === 'confirm') return overlay(
    <div style={{ background: '#FFFFFF', borderRadius: 12, padding: 32, maxWidth: 500, width: '100%', border: '1px solid var(--color-border)', boxShadow: '0 25px 60px rgba(0,0,0,.25)' }}>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ background: 'var(--color-success-bg)', width: 72, height: 72, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', borderRadius: '50%', border: '1px solid var(--color-success)' }}>
          <CheckCircle size={40} color="var(--color-success)" />
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 600, color: 'var(--color-text-primary)', margin: '0 0 6px' }}>CEO Approved!</h2>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 13, margin: 0 }}>
          <b>{pcv.pcv_number}</b> was approved by the CEO.<br />
          Click <b>"Save & Record"</b> to record it in the cashbook and print the voucher.
        </p>
      </div>
      <div style={{ background: 'var(--color-bg-page)', border: '1px solid var(--color-border)', borderRadius: 10, padding: 16, marginBottom: 24 }}>
        <div className="pcv-grid-2" style={{ fontSize: 13, gap: 8 }}>
          <div><span style={{ color: 'var(--color-text-secondary)', fontSize: 11, display: 'block', fontWeight: 500 }}>Voucher No.</span><b style={{ fontFamily: 'monospace' }}>{pcv.pcv_number}</b></div>
          <div><span style={{ color: 'var(--color-text-secondary)', fontSize: 11, display: 'block', fontWeight: 500 }}>Date</span><b>{new Date(pcv.date).toLocaleDateString('en-GB')}</b></div>
          <div><span style={{ color: 'var(--color-text-secondary)', fontSize: 11, display: 'block', fontWeight: 500 }}>Paid To</span><b>{pcv.paid_to}</b></div>
          <div><span style={{ color: 'var(--color-text-secondary)', fontSize: 11, display: 'block', fontWeight: 500 }}>Method</span><b>{pm}</b></div>
          <div style={{ gridColumn: 'span 2' }}>
            <span style={{ color: 'var(--color-text-secondary)', fontSize: 11, display: 'block', fontWeight: 500 }}>Amount</span>
            <span style={{ fontWeight: 700, fontSize: 22, color: 'var(--color-primary)' }}>ETB {parseFloat(pcv.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
          {pcv.description && <div style={{ gridColumn: 'span 2' }}><span style={{ color: 'var(--color-text-secondary)', fontSize: 11, display: 'block', fontWeight: 500 }}>Description</span><span>{pcv.description}</span></div>}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 12 }}>
        <button className="btn-outline" onClick={onClose} style={{ flex: 1, padding: '0 16px', height: 40, fontSize: 14 }}>Cancel</button>
        <button className="btn-green" onClick={finalize} style={{ flex: 2, padding: '0 16px', height: 40, fontSize: 14 }}>
          <CheckCircle size={18} /> Save & Record in Cashbook
        </button>
      </div>
    </div>
  );

  if (step === 'loading') return overlay(
    <div style={{ background: '#FFFFFF', border: '1px solid var(--color-border)', borderRadius: 12, padding: 40, textAlign: 'center', boxShadow: '0 25px 60px rgba(0,0,0,.25)' }}>
      <SegmentedSpinner size={40} />
      <p style={{ fontWeight: 600, color: 'var(--color-text-primary)', fontSize: 16, margin: 0 }}>Recording in cashbook…</p>
    </div>
  );

  if (step === 'error') return overlay(
    <div style={{ background: '#FFFFFF', border: '1px solid var(--color-danger)', borderRadius: 12, padding: 32, maxWidth: 440, width: '100%', boxShadow: '0 25px 60px rgba(0,0,0,.25)', textAlign: 'center' }}>
      <XCircle size={48} color="var(--color-danger)" style={{ marginBottom: 12 }} />
      <h3 style={{ color: 'var(--color-danger)', fontWeight: 600, margin: '0 0 8px' }}>Finalize Failed</h3>
      <p style={{ color: 'var(--color-text-secondary)', fontSize: 13, marginBottom: 20 }}>{errMsg}</p>
      <button className="btn-danger" onClick={onClose} style={{ padding: '0 16px', height: 36, fontSize: 14 }}>Close</button>
    </div>
  );

  return (
    <>
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
        <div style={{ background: '#FFFFFF', border: '1px solid var(--color-border)', borderRadius: 12, padding: 32, maxWidth: 520, width: '100%', textAlign: 'center', boxShadow: '0 25px 60px rgba(0,0,0,.25)' }}>
          <div style={{ background: 'var(--color-success-bg)', width: 80, height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', borderRadius: '50%', border: '1px solid var(--color-success)' }}>
            <CheckCircle size={48} color="var(--color-success)" />
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 600, color: 'var(--color-text-primary)', margin: '0 0 8px' }}>Saved to Cashbook!</h2>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: 6, fontWeight: 400 }}><b>{pcv.pcv_number}</b> has been finalized.</p>
          <p style={{ color: 'var(--color-primary)', fontSize: 13, marginBottom: 28, fontWeight: 500 }}>
            ETB {parseFloat(pcv.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })} has been deducted from the cashbook.
          </p>
          <div style={{ display: 'flex', gap: 12 }}>
            <button className="btn-outline" onClick={printPCV} style={{ flex: 1, padding: '0 16px', height: 40, fontSize: 14 }}>
              <Printer size={16} /> Print PCV
            </button>
            <button className="btn-green" onClick={onClose} style={{ flex: 1, padding: '0 16px', height: 40, fontSize: 14 }}>Close</button>
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
      <div className="status-card" style={{ border: isApproved ? '1px solid var(--color-success)' : '1px solid var(--color-border)', background: isApproved ? 'var(--color-success-bg)' : 'var(--color-bg-card)' }}>
        <div style={{ flexShrink: 0, background: isApproved ? 'var(--color-success-bg)' : 'var(--color-warning-bg)', padding: 10, borderRadius: 8 }}>
          <Banknote size={22} color={isApproved ? 'var(--color-success)' : 'var(--color-warning)'} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
            <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 15, color: 'var(--color-primary)' }}>{pcv.pcv_number}</span>
            <StatusBadge status={pcv.status} />
          </div>
          <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', display: 'flex', gap: 8, flexWrap: 'wrap', fontWeight: 400 }}>
            <span>To: <b style={{ color: 'var(--color-primary)' }}>{pcv.paid_to}</b></span>
            <span>·</span>
            <span>{new Date(pcv.date).toLocaleDateString('en-GB')}</span>
            <span>·</span>
            <span style={{ fontWeight: 700, color: isApproved ? 'var(--color-success)' : 'var(--color-warning)' }}>ETB {parseFloat(pcv.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            <span>·</span>
            <span>{pcv.payment_method}</span>
          </div>
          {pcv.status === 'rejected' && pcv.reject_reason && (
            <div style={{ marginTop: 8, fontSize: 12, background: 'var(--color-danger-bg)', color: 'var(--color-danger)', padding: '2px 12px', display: 'inline-block', borderRadius: 6, fontWeight: 500 }}>
              Reason: {pcv.reject_reason}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0, flexWrap: 'wrap' }}>
          {isUnread && (
            <button className="btn-olive" onClick={() => handleMarkRead(pcv.id)} style={{ padding: '0 14px', height: 32, fontSize: 12, whiteSpace: 'nowrap' }}>
              Mark as Read
            </button>
          )}
          {isApproved && (
            <button className="btn-green" onClick={() => { if (isUnread) handleMarkRead(pcv.id); setTarget(pcv); }} style={{ padding: '0 16px', height: 36, fontSize: 13, whiteSpace: 'nowrap' }}>
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
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: accentColor, margin: 0 }}>{title}</h3>
          <span style={{ background: accentColor, color: '#FFFFFF', padding: '2px 10px', fontSize: 12, fontWeight: 500, borderRadius: 9999 }}>{items.length}</span>
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
          <h2 style={{ fontSize: 24, fontWeight: 600, color: 'var(--color-text-primary)', margin: '0 0 4px', letterSpacing: '-0.01em' }}>PCV Status Tracker</h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 14, margin: 0, fontWeight: 400 }}>Track and finalize approved Petty Cashs.</p>
        </div>
        <button className="btn-green" onClick={load} style={{ padding: '0 16px', height: 36, fontSize: 13 }}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 80, color: 'var(--color-text-secondary)', fontWeight: 500 }}>
          <SegmentedSpinner size={32} />
          Loading PCVs…
        </div>
      ) : pcvs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 48, background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: 10 }}>
          <CheckCircle size={48} color="var(--color-success)" style={{ marginBottom: 16, display: 'block', margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: 20, fontWeight: 600, color: 'var(--color-text-primary)', margin: '0 0 8px' }}>No PCVs yet</h3>
          <p style={{ color: 'var(--color-text-secondary)', margin: 0, fontWeight: 400 }}>Create a PCV from the "New Voucher" tab.</p>
        </div>
      ) : (
        <>
          <Section title="CEO Approved — Ready to Finalize" items={groups.approved} accentColor="var(--color-success)" isApproved={true} />
          <Section title="Awaiting CEO Approval"             items={groups.pending}  accentColor="var(--color-warning)" />
          <Section title="Rejected by CEO"                   items={groups.rejected} accentColor="var(--color-danger)" />
          <Section title="Completed"                         items={groups.done}     accentColor="var(--color-info)" />
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
      <div className="pcv-card" style={{ padding: 24 }}>
        <h3 className="section-title"><User size={18} /> General Information</h3>
        <div className="pcv-grid-2" style={{ marginBottom: 16 }}>
          <div>
            <label className="pcv-lbl">Date *</label>
            <input className="pcv-inp" type="date" required value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <div>
            <label className="pcv-lbl">Paid To *</label>
            <input className="pcv-inp" required value={paidTo} onChange={e => setPaidTo(e.target.value)} placeholder="Payee name" />
          </div>
        </div>
        <div className="pcv-grid-2" style={{ marginBottom: 16 }}>
          <div>
            <label className="pcv-lbl">Amount (ETB) *</label>
            <input className="pcv-inp" required type="number" step="0.01" value={amount} onChange={handleAmount} placeholder="0.00" style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-primary)' }} />
          </div>
          <div>
            <label className="pcv-lbl">Amount in Words</label>
            <input className="pcv-inp" readOnly value={amountWords} placeholder="Auto-filled" style={{ background: 'var(--color-bg-page)', fontStyle: 'italic' }} />
          </div>
        </div>
        <div style={{ marginBottom: 16 }}>
          <label className="pcv-lbl">Description *</label>
          <input className="pcv-inp" required value={description} onChange={e => setDescription(e.target.value)} placeholder="Purpose of payment" />
        </div>
        <div>
          <label className="pcv-lbl">Reference # (Optional)</label>
          <input className="pcv-inp" value={referenceNo} onChange={e => setReferenceNo(e.target.value)} placeholder="Receipt / Bill number" />
        </div>
      </div>

      {/* Payment Method */}
      <div className="pcv-card" style={{ padding: 24 }}>
        <h3 className="section-title"><Banknote size={18} /> Payment Method</h3>
        <div className="pcv-grid-3" style={{ marginBottom: paymentMethod !== 'Cash' ? 16 : 0 }}>
          {[{ t: 'Cash', Icon: Banknote }, { t: 'Bank', Icon: Building }, { t: 'Telebirr', Icon: Smartphone }].map(({ t, Icon }) => (
            <div key={t} className="pay-method-tile" onClick={() => setPaymentMethod(t)} style={{ background: paymentMethod === t ? 'var(--color-primary)' : '#FFFFFF', color: paymentMethod === t ? '#FFFFFF' : 'var(--color-text-primary)', border: paymentMethod === t ? '1px solid var(--color-primary)' : '1px solid var(--color-border)', boxShadow: paymentMethod === t ? '0 2px 8px rgba(37,99,235,.25)' : 'none' }}>
              <Icon size={28} /> {t}
            </div>
          ))}
        </div>

        {paymentMethod === 'Bank' && (
          <div style={{ background: 'var(--color-bg-page)', padding: 20, border: '1px solid var(--color-border)', borderRadius: 10 }}>
            <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--color-text-primary)', marginBottom: 16 }}>Bank Details</div>
            <div className="pcv-grid-2">
              <input className="pcv-inp" required value={bankName}      onChange={e => setBankName(e.target.value)}      placeholder="Bank Name *" />
              <input className="pcv-inp" required value={accountHolder} onChange={e => setAccountHolder(e.target.value)} placeholder="Account Holder *" />
              <input className="pcv-inp" required value={accountNumber} onChange={e => setAccountNumber(e.target.value)} placeholder="Account Number *" />
              <input className="pcv-inp"         value={chequeNo}       onChange={e => setChequeNo(e.target.value)}       placeholder="Cheque # (optional)" />
            </div>
          </div>
        )}

        {paymentMethod === 'Telebirr' && (
          <div style={{ background: 'var(--color-bg-page)', padding: 20, border: '1px solid var(--color-border)', borderRadius: 10 }}>
            <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--color-text-primary)', marginBottom: 16 }}>Telebirr Details</div>
            <div className="pcv-grid-2">
              <input className="pcv-inp" required value={telebirrNumber} onChange={e => setTelebirrNumber(e.target.value)} placeholder="Mobile Number *" />
              <input className="pcv-inp" required value={telebirrName}   onChange={e => setTelebirrName(e.target.value)}   placeholder="Full Name *" />
            </div>
          </div>
        )}
      </div>

      {/* Signatures */}
      <div className="pcv-card" style={{ padding: 24 }}>
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
              {sig && <p style={{ margin: '4px 0 0', fontSize: 10, color: 'var(--color-primary)', fontWeight: 500 }}>✓ Signature ready</p>}
            </div>
          ))}
        </div>
      </div>

      <button type="submit" disabled={loading} className="btn-green" style={{ width: '100%', height: 44, padding: '0 16px', fontSize: 16, background: loading ? 'var(--color-text-muted)' : 'var(--color-primary)', marginTop: 4, borderRadius: 8 }}>
        {loading ? <><SegmentedSpinner size={20} /> Processing…</> : <><CheckCircle size={20} /> Generate Petty Cash</>}
      </button>
    </form>
  );
};

/* ── Submitted Success Screen ─────────────────────────────────── */
const SubmittedScreen = ({ data, onNewPCV, onViewStatus }) => (
  <div style={{ background: '#FFFFFF', border: '1px solid var(--color-border)', borderRadius: 10, padding: 32, textAlign: 'center' }}>
    <div style={{ background: 'var(--color-info-bg)', width: 80, height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', borderRadius: '50%', border: '1px solid var(--color-info)' }}>
      <Clock size={48} color="var(--color-info)" />
    </div>
    <h2 style={{ fontSize: 24, fontWeight: 600, color: 'var(--color-text-primary)', margin: '0 0 8px' }}>Sent for CEO Approval</h2>
    <p style={{ color: 'var(--color-text-secondary)', marginBottom: 4, fontWeight: 400 }}>Your PCV is now <b>waiting for CEO approval</b>.</p>
    <p style={{ color: 'var(--color-primary)', fontSize: 13, marginBottom: 24, fontWeight: 500 }}>Once approved, go to the <b>PCV Status</b> tab to finalize and record in the cashbook.</p>
    <div style={{ background: 'var(--color-bg-page)', padding: 20, border: '1px solid var(--color-border)', borderRadius: 10, textAlign: 'left', marginBottom: 24 }}>
      <div style={{ fontFamily: 'monospace', fontSize: 20, fontWeight: 700, color: 'var(--color-primary)', textAlign: 'center', letterSpacing: 2, marginBottom: 14 }}>{data.pcvNumber}</div>
      <div className="pcv-grid-2" style={{ fontSize: 14, gap: 12 }}>
        <div><span style={{ color: 'var(--color-text-secondary)', fontSize: 11, display: 'block', fontWeight: 500 }}>Date</span><b>{data.date}</b></div>
        <div><span style={{ color: 'var(--color-text-secondary)', fontSize: 11, display: 'block', fontWeight: 500 }}>Method</span><b>{data.paymentMethod}</b></div>
        <div style={{ gridColumn: 'span 2' }}><span style={{ color: 'var(--color-text-secondary)', fontSize: 11, display: 'block', fontWeight: 500 }}>Paid To</span><b>{data.paidTo}</b></div>
        <div style={{ gridColumn: 'span 2' }}><span style={{ color: 'var(--color-text-secondary)', fontSize: 11, display: 'block', fontWeight: 500 }}>Amount</span><span style={{ fontWeight: 700, color: 'var(--color-primary)', fontSize: 24 }}>ETB {parseFloat(data.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
      </div>
    </div>
    <div style={{ display: 'flex', gap: 12 }}>
      <button className="btn-outline" onClick={onViewStatus} style={{ flex: 1, padding: '0 16px', height: 40, fontSize: 14 }}>
        View PCV Status →
      </button>
      <button className="btn-green" onClick={onNewPCV} style={{ flex: 1, padding: '0 16px', height: 40, fontSize: 14 }}>New PCV</button>
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
