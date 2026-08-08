import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  CreditCard, CheckCircle, Printer, DollarSign, User, FileText,
  Banknote, Building, Smartphone, Calendar, RefreshCw, PenTool, Trash2
} from 'lucide-react';
import api from '../../services/apiClient';

/* ─── Native Canvas Signature Pad ────────────────────────────── */
const SigPad = ({ label, onSave }) => {
  const canvasRef = useRef(null);
  const isDrawing  = useRef(false);
  const lastPos    = useRef(null);
  const [saved, setSaved] = useState(false);
  const [isEmpty, setIsEmpty] = useState(true);

  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width  / rect.width;
    const scaleY = canvas.height / rect.height;
    if (e.touches) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top)  * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top)  * scaleY,
    };
  };

  const startDraw = useCallback((e) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    isDrawing.current = true;
    lastPos.current = getPos(e, canvas);
    setSaved(false);
  }, []);

  const draw = useCallback((e) => {
    e.preventDefault();
    if (!isDrawing.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const pos = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    lastPos.current = pos;
    setIsEmpty(false);
  }, []);

  const stopDraw = useCallback(() => {
    isDrawing.current = false;
    lastPos.current = null;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // Prevent page scroll on touch devices while signing
    canvas.addEventListener('touchstart', startDraw, { passive: false });
    canvas.addEventListener('touchmove',  draw,      { passive: false });
    canvas.addEventListener('touchend',   stopDraw,  { passive: false });
    return () => {
      canvas.removeEventListener('touchstart', startDraw);
      canvas.removeEventListener('touchmove',  draw);
      canvas.removeEventListener('touchend',   stopDraw);
    };
  }, [startDraw, draw, stopDraw]);

  const handleSave = () => {
    if (isEmpty) return;
    const canvas = canvasRef.current;
    const dataUrl = canvas.toDataURL('image/png');
    onSave(dataUrl);
    setSaved(true);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setIsEmpty(true);
    setSaved(false);
    onSave(null);
  };

  return (
    <div style={{
      border: `2px solid ${saved ? '#22c55e' : '#e2e8f0'}`,
      borderRadius: 10,
      overflow: 'hidden',
      background: 'white',
      transition: 'border-color .2s',
    }}>
      {/* Toolbar */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '8px 12px',
        background: saved ? '#f0fdf4' : '#f8fafc',
        borderBottom: `1px solid ${saved ? '#bbf7d0' : '#e2e8f0'}`,
      }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: saved ? '#15803d' : '#64748b', display: 'flex', alignItems: 'center', gap: 5 }}>
          <PenTool size={13} /> {label}
          {saved && (
            <span style={{ background: '#dcfce7', color: '#15803d', fontSize: 10, padding: '2px 7px', borderRadius: 99, marginLeft: 4 }}>✓ Saved</span>
          )}
        </span>
        <div style={{ display: 'flex', gap: 6 }}>
          <button type="button" onClick={handleClear}
            style={{ fontSize: 11, padding: '3px 9px', border: '1px solid #fca5a5', background: '#fef2f2', color: '#dc2626', borderRadius: 5, cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 }}>
            <Trash2 size={11} /> Clear
          </button>
          <button type="button" onClick={handleSave}
            disabled={isEmpty}
            style={{ fontSize: 11, padding: '3px 9px', border: `1px solid ${isEmpty ? '#d1d5db' : '#86efac'}`, background: isEmpty ? '#f3f4f6' : '#dcfce7', color: isEmpty ? '#9ca3af' : '#16a34a', borderRadius: 5, cursor: isEmpty ? 'not-allowed' : 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 }}>
            <CheckCircle size={11} /> Save
          </button>
        </div>
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        width={400}
        height={120}
        onMouseDown={startDraw}
        onMouseMove={draw}
        onMouseUp={stopDraw}
        onMouseLeave={stopDraw}
        style={{ width: '100%', height: 120, display: 'block', cursor: 'crosshair', background: isEmpty ? '#fafafa' : 'white', touchAction: 'none' }}
      />

      <div style={{ padding: '5px 10px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', fontSize: 10, color: '#94a3b8', textAlign: 'center' }}>
        {isEmpty ? 'Draw your signature, then press Save' : saved ? '✓ Signature captured' : 'Press Save to confirm signature'}
      </div>
    </div>
  );
};

/* ─── Printed Signature Block ─────────────────────────────────── */
const PrintSigBlock = ({ label, name, sigImage }) => (
  <div style={{ width: '210px', textAlign: 'center' }}>
    <div style={{
      height: 80, border: '1px solid #999', borderRadius: 4,
      marginBottom: 6, overflow: 'hidden', background: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      {sigImage
        ? <img src={sigImage} alt={`${label} signature`} style={{ maxHeight: 75, maxWidth: '100%', objectFit: 'contain' }} />
        : <span style={{ color: '#ccc', fontSize: 11 }}>—</span>
      }
    </div>
    <div style={{ borderTop: '1px solid #333', paddingTop: 4 }}>
      <div style={{ fontSize: 13, fontWeight: 700 }}>{name || '_______________'}</div>
      <div style={{ fontSize: 11, color: '#555', marginTop: 2 }}>{label}</div>
    </div>
  </div>
);

/* ─── Main CRV Form ───────────────────────────────────────────── */
const FinanceCRV = () => {
  const [date, setDate]             = useState(new Date().toISOString().slice(0, 10));
  const [receivedFrom, setReceivedFrom] = useState('');
  const [amount, setAmount]         = useState('');
  const [amountWords, setAmountWords] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [description, setDescription] = useState('');
  const [referenceNo, setReferenceNo] = useState('');

  const [bankName, setBankName]             = useState('');
  const [accountHolder, setAccountHolder]   = useState('');
  const [accountNumber, setAccountNumber]   = useState('');
  const [chequeNo, setChequeNo]             = useState('');

  const [telebirrNumber, setTelebirrNumber] = useState('');
  const [telebirrName, setTelebirrName]     = useState('');

  const [preparedBy, setPreparedBy]         = useState('');
  const [checkedBy, setCheckedBy]           = useState('');
  const [receiverName, setReceiverName]     = useState('');

  const [preparedSig, setPreparedSig]       = useState(null);
  const [checkedSig, setCheckedSig]         = useState(null);
  const [receiverSig, setReceiverSig]       = useState(null);

  const [submitted, setSubmitted] = useState(null);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);

  const handleAmountChange = (e) => {
    setAmount(e.target.value);
    const v = parseFloat(e.target.value);
    setAmountWords(isNaN(v) ? '' : `${v.toLocaleString('en-US')} ETB Only`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const payload = {
        date, receivedFrom, amount: parseFloat(amount),
        paymentMethod, description, referenceNo,
        bankDetails:     paymentMethod === 'Bank'     ? { bankName, accountHolder, accountNumber, chequeNo } : null,
        telebirrDetails: paymentMethod === 'Telebirr' ? { telebirrNumber, fullName: telebirrName }          : null,
        preparedBy, checkedBy, receiverName,
        preparedSignature: preparedSig,
        checkedSignature:  checkedSig,
        receiverSignature: receiverSig,
      };
      const res = await api.post('/finance-cash/crv', payload);
      setSubmitted({ crvNumber: res.data?.data?.crvNumber, ...payload, amountWords });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to generate CRV');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSubmitted(null);
    setAmount(''); setAmountWords(''); setReferenceNo('');
    setReceivedFrom(''); setDescription('');
    setBankName(''); setAccountHolder(''); setAccountNumber(''); setChequeNo('');
    setTelebirrNumber(''); setTelebirrName('');
    setPreparedBy(''); setCheckedBy(''); setReceiverName('');
    setPreparedSig(null); setCheckedSig(null); setReceiverSig(null);
  };

  const input = (value, onChange, placeholder, required = false, type = 'text') => ({
    value, onChange: e => onChange(e.target.value),
    required, type, placeholder,
    onFocus: e => (e.target.style.borderColor = '#22c55e'),
    onBlur:  e => (e.target.style.borderColor = '#e2e8f0'),
    style: {
      width: '100%', padding: '11px 14px', border: '2px solid #e2e8f0',
      borderRadius: 9, boxSizing: 'border-box', outline: 'none',
      fontSize: 14, transition: 'border-color .2s',
    }
  });

  /* ─── SUCCESS SCREEN ─── */
  if (submitted) {
    return (
      <div style={{ padding: 32, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>

        {/* Screen card */}
        <div className="no-print" style={{
          maxWidth: 560, background: 'white', borderRadius: 16,
          border: '2px solid #10b981', padding: 40, textAlign: 'center',
          boxShadow: '0 20px 25px -5px rgba(0,0,0,.12)', margin: '0 auto'
        }}>
          <div style={{ background: '#d1fae5', width: 80, height: 80, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <CheckCircle size={48} color="#10b981" />
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: '#064e3b', margin: '0 0 8px' }}>CRV Generated!</h2>
          <p style={{ color: '#64748b', marginBottom: 24 }}>Recorded in cashbook successfully.</p>

          <div style={{ background: '#f0fdf4', padding: 20, borderRadius: 12, border: '1px dashed #6ee7b7', textAlign: 'left', marginBottom: 24 }}>
            <div style={{ fontFamily: 'monospace', fontSize: 18, fontWeight: 800, color: '#047857', textAlign: 'center', letterSpacing: 2, marginBottom: 14 }}>{submitted.crvNumber}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 14 }}>
              <div><span style={{ color: '#64748b', fontSize: 11, display: 'block' }}>Date</span><b>{submitted.date}</b></div>
              <div><span style={{ color: '#64748b', fontSize: 11, display: 'block' }}>Method</span><b>{submitted.paymentMethod}</b></div>
              <div style={{ gridColumn: 'span 2' }}><span style={{ color: '#64748b', fontSize: 11, display: 'block' }}>Received From</span><b>{submitted.receivedFrom}</b></div>
              <div style={{ gridColumn: 'span 2' }}>
                <span style={{ color: '#64748b', fontSize: 11, display: 'block' }}>Amount</span>
                <span style={{ fontWeight: 800, color: '#059669', fontSize: 20 }}>ETB {parseFloat(submitted.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

          {/* Signature preview */}
          <div style={{ display: 'flex', justifyContent: 'space-around', gap: 8, marginBottom: 28 }}>
            {[
              { label: 'Prepared By',       name: submitted.preparedBy,   sig: submitted.preparedSignature },
              { label: 'Checked By',        name: submitted.checkedBy,    sig: submitted.checkedSignature },
              { label: "Receiver's Sig.",   name: submitted.receiverName, sig: submitted.receiverSignature },
            ].map(({ label, name, sig }) => (
              <div key={label} style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ height: 54, border: '1px solid #e2e8f0', borderRadius: 6, overflow: 'hidden', background: '#fafafa', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 4 }}>
                  {sig
                    ? <img src={sig} alt={label} style={{ maxHeight: 50, maxWidth: '100%', objectFit: 'contain' }} />
                    : <span style={{ color: '#cbd5e1', fontSize: 10 }}>No sig</span>
                  }
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#475569' }}>{name}</div>
                <div style={{ fontSize: 10, color: '#94a3b8' }}>{label}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={() => window.print()}
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 12, background: 'white', border: '1px solid #cbd5e1', borderRadius: 8, cursor: 'pointer', fontWeight: 600, color: '#475569', fontSize: 14 }}>
              <Printer size={16} /> Print CRV
            </button>
            <button onClick={resetForm}
              style={{ flex: 1, padding: 12, background: '#0f172a', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>
              New CRV
            </button>
          </div>
        </div>

        {/* ─── PRINT VIEW ─── */}
        <div className="print-only" style={{ display: 'none', padding: '36px 48px', background: 'white', fontFamily: "'Times New Roman', serif" }}>
          <div style={{ textAlign: 'center', borderBottom: '3px double #000', paddingBottom: 16, marginBottom: 20 }}>
            <h1 style={{ fontSize: 26, margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: 3 }}>Sutana Enterprise</h1>
            <h2 style={{ fontSize: 16, margin: 0, fontWeight: 'normal', color: '#333' }}>OFFICIAL CASH RECEIPT VOUCHER (CRV)</h2>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, fontSize: 13 }}>
            <div>
              <b>Receipt No:</b> <span style={{ fontFamily: 'monospace', fontSize: 15 }}>{submitted.crvNumber}</span><br />
              <b>Reference:</b> {submitted.referenceNo || 'N/A'}
            </div>
            <div style={{ textAlign: 'right' }}>
              <b>Date:</b> {new Date(submitted.date).toLocaleDateString('en-GB')}<br />
              <b>Payment Method:</b> {submitted.paymentMethod}
            </div>
          </div>

          <div style={{ lineHeight: 2.4, fontSize: 15, marginBottom: 24 }}>
            <div><b>RECEIVED FROM:</b>&nbsp;<span style={{ borderBottom: '1px solid #000', display: 'inline-block', minWidth: 300 }}>{submitted.receivedFrom}</span></div>
            <div><b>THE SUM OF:</b>&nbsp;<span style={{ borderBottom: '1px solid #000', display: 'inline-block', minWidth: 340, fontStyle: 'italic' }}>{submitted.amountWords}</span></div>
            <div><b>BEING PAYMENT FOR:</b>&nbsp;<span style={{ borderBottom: '1px solid #000', display: 'inline-block', minWidth: 280 }}>{submitted.description}</span></div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
            <div style={{ padding: '12px 24px', border: '2px solid #000', fontSize: 26, fontWeight: 'bold' }}>
              ETB {parseFloat(submitted.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>

            {submitted.paymentMethod === 'Bank' && submitted.bankDetails && (
              <div style={{ padding: '12px 16px', border: '1px solid #555', fontSize: 13, minWidth: 240 }}>
                <b>Bank Details:</b><br />
                Bank: {submitted.bankDetails.bankName}<br />
                A/C Name: {submitted.bankDetails.accountHolder}<br />
                A/C No: {submitted.bankDetails.accountNumber}
                {submitted.bankDetails.chequeNo && <><br />Cheque No: {submitted.bankDetails.chequeNo}</>}
              </div>
            )}
            {submitted.paymentMethod === 'Telebirr' && submitted.telebirrDetails && (
              <div style={{ padding: '12px 16px', border: '1px solid #555', fontSize: 13, minWidth: 240 }}>
                <b>Telebirr Details:</b><br />
                Mobile: {submitted.telebirrDetails.telebirrNumber}<br />
                Name: {submitted.telebirrDetails.fullName}
              </div>
            )}
            {submitted.paymentMethod === 'Cash' && (
              <div style={{ padding: '12px 24px', border: '1px solid #555', fontSize: 18, fontWeight: 'bold', textAlign: 'center' }}>
                By Cash
              </div>
            )}
          </div>

          {/* Signature row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 48 }}>
            <PrintSigBlock label="Prepared By"          name={submitted.preparedBy}   sigImage={submitted.preparedSignature} />
            <PrintSigBlock label="Checked By"           name={submitted.checkedBy}    sigImage={submitted.checkedSignature} />
            <PrintSigBlock label="Receiver's Signature" name={submitted.receiverName} sigImage={submitted.receiverSignature} />
          </div>
        </div>

        <style>{`
          @media print {
            body * { visibility: hidden; }
            .print-only, .print-only * { visibility: visible; }
            .print-only { display: block !important; position: fixed; inset: 0; }
            .no-print { display: none !important; }
            @page { margin: 12mm; size: A4; }
          }
        `}</style>
      </div>
    );
  }

  /* ─── FORM ─── */
  const card = { background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,.05)', marginBottom: 24 };

  return (
    <div style={{ padding: 32, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ maxWidth: 840, margin: '0 auto 28px' }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 12, color: '#0f172a' }}>
          <span style={{ background: 'linear-gradient(135deg,#22c55e,#16a34a)', padding: 10, borderRadius: 12, display: 'flex', boxShadow: '0 4px 10px rgba(34,197,94,.3)' }}>
            <CreditCard color="white" size={22} />
          </span>
          Cash Receipt Voucher
        </h1>
        <p style={{ color: '#64748b', margin: '8px 0 0', fontSize: 14 }}>Fill all fields, draw and save each signature, then generate the CRV.</p>
      </div>

      {error && (
        <div style={{ maxWidth: 840, margin: '0 auto 16px', background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', padding: '14px 18px', borderRadius: 10 }}>
          <b>Error:</b> {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ maxWidth: 840, margin: '0 auto' }}>

        {/* General Information */}
        <div style={card}>
          <div style={{ padding: '20px 28px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}><User size={16} color="#64748b" /> General Information</h3>
          </div>
          <div style={{ padding: 28 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 7 }}>Date Received *</label>
                <input {...input(date, setDate, '', true, 'date')} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 7 }}>Received From *</label>
                <input {...input(receivedFrom, setReceivedFrom, 'Customer / Company / Person', true)} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 20, marginBottom: 20 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 7 }}>Amount (ETB) *</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#64748b', fontWeight: 600, fontSize: 12 }}>ETB</span>
                  <input
                    required type="number" step="0.01" value={amount}
                    onChange={handleAmountChange} placeholder="0.00"
                    onFocus={e => (e.target.style.borderColor = '#22c55e')} onBlur={e => (e.target.style.borderColor = '#e2e8f0')}
                    style={{ width: '100%', padding: '11px 14px 11px 46px', border: '2px solid #e2e8f0', borderRadius: 9, boxSizing: 'border-box', outline: 'none', fontSize: 15, fontWeight: 700 }}
                  />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 7 }}>Amount in Words</label>
                <input readOnly value={amountWords} placeholder="Auto-filled"
                  style={{ width: '100%', padding: '11px 14px', border: '2px solid #f1f5f9', background: '#f8fafc', borderRadius: 9, boxSizing: 'border-box', fontSize: 13, fontStyle: 'italic', color: '#64748b' }} />
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 7 }}>Description *</label>
              <input {...input(description, setDescription, 'Reason for receipt', true)} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 7 }}>Reference # (Optional)</label>
              <input {...input(referenceNo, setReferenceNo, 'Invoice #, Prescription ID, etc.')} />
            </div>
          </div>
        </div>

        {/* Payment Method */}
        <div style={card}>
          <div style={{ padding: '20px 28px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}><Banknote size={16} color="#64748b" /> Payment Method</h3>
          </div>
          <div style={{ padding: 28 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: paymentMethod !== 'Cash' ? 20 : 0 }}>
              {[{ type: 'Cash', icon: Banknote }, { type: 'Bank', icon: Building }, { type: 'Telebirr', icon: Smartphone }].map(({ type, icon: Icon }) => (
                <div key={type} onClick={() => setPaymentMethod(type)} style={{
                  padding: 18, border: `2px solid ${paymentMethod === type ? '#22c55e' : '#e2e8f0'}`,
                  borderRadius: 12, cursor: 'pointer', fontWeight: 700, fontSize: 14,
                  background: paymentMethod === type ? '#f0fdf4' : 'white',
                  color: paymentMethod === type ? '#166534' : '#64748b',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, transition: 'all .2s'
                }}>
                  <Icon size={26} color={paymentMethod === type ? '#22c55e' : '#94a3b8'} /> {type}
                </div>
              ))}
            </div>

            {paymentMethod === 'Bank' && (
              <div style={{ background: '#f0f9ff', padding: 20, borderRadius: 10, border: '1px solid #bae6fd' }}>
                <h4 style={{ margin: '0 0 14px', fontSize: 13, color: '#0369a1', fontWeight: 700 }}>Bank Details</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <input required value={bankName} onChange={e => setBankName(e.target.value)} placeholder="Bank Name *" onFocus={e => (e.target.style.borderColor = '#0284c7')} onBlur={e => (e.target.style.borderColor = '#7dd3fc')} style={{ padding: '10px 14px', border: '1px solid #7dd3fc', borderRadius: 8, outline: 'none', fontSize: 14 }} />
                  <input required value={accountHolder} onChange={e => setAccountHolder(e.target.value)} placeholder="Account Holder *" onFocus={e => (e.target.style.borderColor = '#0284c7')} onBlur={e => (e.target.style.borderColor = '#7dd3fc')} style={{ padding: '10px 14px', border: '1px solid #7dd3fc', borderRadius: 8, outline: 'none', fontSize: 14 }} />
                  <input required value={accountNumber} onChange={e => setAccountNumber(e.target.value)} placeholder="Account Number *" onFocus={e => (e.target.style.borderColor = '#0284c7')} onBlur={e => (e.target.style.borderColor = '#7dd3fc')} style={{ padding: '10px 14px', border: '1px solid #7dd3fc', borderRadius: 8, outline: 'none', fontSize: 14 }} />
                  <input value={chequeNo} onChange={e => setChequeNo(e.target.value)} placeholder="Cheque # (Optional)" onFocus={e => (e.target.style.borderColor = '#0284c7')} onBlur={e => (e.target.style.borderColor = '#7dd3fc')} style={{ padding: '10px 14px', border: '1px solid #7dd3fc', borderRadius: 8, outline: 'none', fontSize: 14 }} />
                </div>
              </div>
            )}

            {paymentMethod === 'Telebirr' && (
              <div style={{ background: '#fffbeb', padding: 20, borderRadius: 10, border: '1px solid #fde68a' }}>
                <h4 style={{ margin: '0 0 14px', fontSize: 13, color: '#b45309', fontWeight: 700 }}>Telebirr Details</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <input required value={telebirrNumber} onChange={e => setTelebirrNumber(e.target.value)} placeholder="Mobile Number *" onFocus={e => (e.target.style.borderColor = '#d97706')} onBlur={e => (e.target.style.borderColor = '#fcd34d')} style={{ padding: '10px 14px', border: '1px solid #fcd34d', borderRadius: 8, outline: 'none', fontSize: 14 }} />
                  <input required value={telebirrName} onChange={e => setTelebirrName(e.target.value)} placeholder="Full Name *" onFocus={e => (e.target.style.borderColor = '#d97706')} onBlur={e => (e.target.style.borderColor = '#fcd34d')} style={{ padding: '10px 14px', border: '1px solid #fcd34d', borderRadius: 8, outline: 'none', fontSize: 14 }} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Signatures */}
        <div style={card}>
          <div style={{ padding: '20px 28px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}><PenTool size={16} color="#64748b" /> Signatures</h3>
          </div>
          <div style={{ padding: 28 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20 }}>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 7 }}>Prepared By (Name) *</label>
                <input {...input(preparedBy, setPreparedBy, 'Accountant Name', true)} style={{ width: '100%', padding: '10px 14px', border: '2px solid #e2e8f0', borderRadius: 9, boxSizing: 'border-box', outline: 'none', fontSize: 14, marginBottom: 10, display: 'block' }} />
                <SigPad label="Prepared By" onSave={setPreparedSig} />
                {preparedSig && <p style={{ margin: '4px 0 0', fontSize: 10, color: '#16a34a', fontWeight: 600 }}>✓ Signature ready</p>}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 7 }}>Checked By (Name) *</label>
                <input {...input(checkedBy, setCheckedBy, 'Manager Name', true)} style={{ width: '100%', padding: '10px 14px', border: '2px solid #e2e8f0', borderRadius: 9, boxSizing: 'border-box', outline: 'none', fontSize: 14, marginBottom: 10, display: 'block' }} />
                <SigPad label="Checked By" onSave={setCheckedSig} />
                {checkedSig && <p style={{ margin: '4px 0 0', fontSize: 10, color: '#16a34a', fontWeight: 600 }}>✓ Signature ready</p>}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 7 }}>Receiver's Name *</label>
                <input {...input(receiverName, setReceiverName, 'Receiver Name', true)} style={{ width: '100%', padding: '10px 14px', border: '2px solid #e2e8f0', borderRadius: 9, boxSizing: 'border-box', outline: 'none', fontSize: 14, marginBottom: 10, display: 'block' }} />
                <SigPad label="Receiver" onSave={setReceiverSig} />
                {receiverSig && <p style={{ margin: '4px 0 0', fontSize: 10, color: '#16a34a', fontWeight: 600 }}>✓ Signature ready</p>}
              </div>

            </div>
            <p style={{ margin: '18px 0 0', color: '#94a3b8', fontSize: 11 }}>
              ⓘ Draw on the white canvas with your mouse or finger, then click <b>Save</b> to confirm each signature before generating.
            </p>
          </div>
        </div>

        <button type="submit" disabled={loading} style={{
          width: '100%', padding: 16,
          background: 'linear-gradient(135deg,#22c55e,#16a34a)',
          color: 'white', border: 'none', borderRadius: 12,
          cursor: loading ? 'not-allowed' : 'pointer', fontSize: 16, fontWeight: 700,
          display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10,
          boxShadow: '0 4px 14px rgba(34,197,94,.4)', opacity: loading ? 0.7 : 1,
        }}>
          {loading ? <SegmentedSpinner size={20} /> : <CheckCircle size={20} />}
          {loading ? 'Processing...' : 'Generate Cash Receipt Voucher'}
        </button>
      </form>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default FinanceCRV;
