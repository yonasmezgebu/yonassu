import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  ArrowUpRight, CheckCircle, Printer, DollarSign, User,
  Banknote, Building, Smartphone, RefreshCw, PenTool, Trash2, List, Tag
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
    if (e.touches) return { x: (e.touches[0].clientX - rect.left) * scaleX, y: (e.touches[0].clientY - rect.top) * scaleY };
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  };

  const startDraw = useCallback((e) => {
    e.preventDefault();
    isDrawing.current = true;
    lastPos.current = getPos(e, canvasRef.current);
    setSaved(false);
  }, []);

  const draw = useCallback((e) => {
    e.preventDefault();
    if (!isDrawing.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const pos = getPos(e, canvas);
    ctx.beginPath(); ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y); ctx.strokeStyle = '#1e293b'; ctx.lineWidth = 2;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke();
    lastPos.current = pos; setIsEmpty(false);
  }, []);

  const stopDraw = useCallback(() => { isDrawing.current = false; lastPos.current = null; }, []);

  useEffect(() => {
    const c = canvasRef.current; if (!c) return;
    c.addEventListener('touchstart', startDraw, { passive: false });
    c.addEventListener('touchmove',  draw,      { passive: false });
    c.addEventListener('touchend',   stopDraw,  { passive: false });
    return () => { c.removeEventListener('touchstart', startDraw); c.removeEventListener('touchmove', draw); c.removeEventListener('touchend', stopDraw); };
  }, [startDraw, draw, stopDraw]);

  const handleSave = () => {
    if (isEmpty) return;
    onSave(canvasRef.current.toDataURL('image/png'));
    setSaved(true);
  };
  const handleClear = () => {
    const ctx = canvasRef.current.getContext('2d');
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    setIsEmpty(true); setSaved(false); onSave(null);
  };

  return (
    <div style={{ border: `2px solid ${saved ? '#0ea5e9' : '#e2e8f0'}`, borderRadius: 10, overflow: 'hidden', background: 'white', transition: 'border-color .2s' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: saved ? '#f0f9ff' : '#f8fafc', borderBottom: `1px solid ${saved ? '#bae6fd' : '#e2e8f0'}` }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: saved ? '#0369a1' : '#64748b', display: 'flex', alignItems: 'center', gap: 5 }}>
          <PenTool size={13} /> {label}
          {saved && <span style={{ background: '#e0f2fe', color: '#0369a1', fontSize: 10, padding: '2px 7px', borderRadius: 99, marginLeft: 4 }}>✓ Saved</span>}
        </span>
        <div style={{ display: 'flex', gap: 6 }}>
          <button type="button" onClick={handleClear} style={{ fontSize: 11, padding: '3px 9px', border: '1px solid #fca5a5', background: '#fef2f2', color: '#dc2626', borderRadius: 5, cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 }}>
            <Trash2 size={11} /> Clear
          </button>
          <button type="button" onClick={handleSave} disabled={isEmpty} style={{ fontSize: 11, padding: '3px 9px', border: `1px solid ${isEmpty ? '#d1d5db' : '#7dd3fc'}`, background: isEmpty ? '#f3f4f6' : '#e0f2fe', color: isEmpty ? '#9ca3af' : '#0284c7', borderRadius: 5, cursor: isEmpty ? 'not-allowed' : 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 }}>
            <CheckCircle size={11} /> Save
          </button>
        </div>
      </div>
      <canvas ref={canvasRef} width={400} height={120} onMouseDown={startDraw} onMouseMove={draw} onMouseUp={stopDraw} onMouseLeave={stopDraw}
        style={{ width: '100%', height: 120, display: 'block', cursor: 'crosshair', background: isEmpty ? '#fafafa' : 'white', touchAction: 'none' }} />
      <div style={{ padding: '5px 10px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', fontSize: 10, color: '#94a3b8', textAlign: 'center' }}>
        {isEmpty ? 'Draw your signature, then press Save' : saved ? '✓ Signature captured' : 'Press Save to confirm signature'}
      </div>
    </div>
  );
};

/* ─── Printed Signature Block ─────────────────────────────────── */
const PrintSigBlock = ({ label, name, sigImage }) => (
  <div style={{ width: '210px', textAlign: 'center' }}>
    <div style={{ height: 80, border: '1px solid #999', borderRadius: 4, marginBottom: 6, overflow: 'hidden', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {sigImage ? <img src={sigImage} alt={label} style={{ maxHeight: 75, maxWidth: '100%', objectFit: 'contain' }} /> : <span style={{ color: '#ccc', fontSize: 11 }}>—</span>}
    </div>
    <div style={{ borderTop: '1px solid #333', paddingTop: 4 }}>
      <div style={{ fontSize: 13, fontWeight: 700 }}>{name || '_______________'}</div>
      <div style={{ fontSize: 11, color: '#555', marginTop: 2 }}>{label}</div>
    </div>
  </div>
);

const CATEGORIES = ['Supplier', 'Staff Salary', 'Utilities', 'Rent', 'Office Supplies', 'Maintenance', 'Transport', 'Other'];

/* ─── Main Approve & Pay Form ─────────────────────────────────── */
const FinanceApprovePay = () => {
  const [view, setView] = useState('form'); // 'form' | 'list'

  // Form state
  const [date, setDate]               = useState(new Date().toISOString().slice(0, 10));
  const [paidTo, setPaidTo]           = useState('');
  const [category, setCategory]       = useState('Supplier');
  const [amount, setAmount]           = useState('');
  const [amountWords, setAmountWords] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [description, setDescription] = useState('');
  const [referenceNo, setReferenceNo] = useState('');
  const [dueDate, setDueDate]         = useState(new Date().toISOString().slice(0, 10));

  const [bankName, setBankName]           = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [chequeNo, setChequeNo]           = useState('');

  const [telebirrNumber, setTelebirrNumber] = useState('');
  const [telebirrName, setTelebirrName]     = useState('');

  const [preparedBy, setPreparedBy] = useState('');
  const [checkedBy, setCheckedBy]   = useState('');
  const [payeeName, setPayeeName]   = useState('');

  const [preparedSig, setPreparedSig] = useState(null);
  const [checkedSig, setCheckedSig]   = useState(null);
  const [payeeSig, setPayeeSig]       = useState(null);

  const [submitted, setSubmitted] = useState(null);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);

  // Payables Book list state
  const [payablesList, setPayablesList] = useState([]);
  const [loadingList, setLoadingList]   = useState(false);

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
        date, paidTo, category,
        amount: parseFloat(amount),
        paymentMethod, description, referenceNo, dueDate,
        bankDetails:     paymentMethod === 'Bank'     ? { bankName, accountHolder, accountNumber, chequeNo } : null,
        telebirrDetails: paymentMethod === 'Telebirr' ? { telebirrNumber, fullName: telebirrName }           : null,
        preparedBy, checkedBy, payeeName,
        preparedSignature: preparedSig,
        checkedSignature:  checkedSig,
        payeeSignature:    payeeSig,
      };
      const res = await api.post('/finance-payables', payload);
      setSubmitted({ pvNumber: res.data?.pvNumber, ...payload, amountWords });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to process payment');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSubmitted(null);
    setAmount(''); setAmountWords(''); setReferenceNo('');
    setPaidTo(''); setDescription('');
    setBankName(''); setAccountHolder(''); setAccountNumber(''); setChequeNo('');
    setTelebirrNumber(''); setTelebirrName('');
    setPreparedBy(''); setCheckedBy(''); setPayeeName('');
    setPreparedSig(null); setCheckedSig(null); setPayeeSig(null);
  };

  const loadPayables = useCallback(async () => {
    setLoadingList(true);
    try {
      const res = await api.get('/finance-payables');
      setPayablesList(res.data || []);
    } catch (e) { console.error(e); }
    finally { setLoadingList(false); }
  }, []);

  useEffect(() => { if (view === 'list') loadPayables(); }, [view, loadPayables]);

  const fmt = (n) => parseFloat(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2 });
  const fmtD = (d) => d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';

  const inp = (value, onChange, placeholder, required = false, type = 'text') => ({
    value, onChange: e => onChange(e.target.value),
    required, type, placeholder,
    onFocus: e => (e.target.style.borderColor = '#0ea5e9'),
    onBlur:  e => (e.target.style.borderColor = '#e2e8f0'),
    style: { width: '100%', padding: '11px 14px', border: '2px solid #e2e8f0', borderRadius: 9, boxSizing: 'border-box', outline: 'none', fontSize: 14, transition: 'border-color .2s' }
  });

  const card = { background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,.05)', marginBottom: 24 };

  /* ─── SUCCESS SCREEN ─── */
  if (submitted) {
    return (
      <div style={{ padding: 32, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
        <div className="no-print" style={{ maxWidth: 560, background: 'white', borderRadius: 16, border: '2px solid #0ea5e9', padding: 40, textAlign: 'center', boxShadow: '0 20px 25px -5px rgba(0,0,0,.12)', margin: '0 auto' }}>
          <div style={{ background: '#e0f2fe', width: 80, height: 80, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <CheckCircle size={48} color="#0ea5e9" />
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: '#0c4a6e', margin: '0 0 8px' }}>Payment Approved!</h2>
          <p style={{ color: '#64748b', marginBottom: 24 }}>Recorded directly to the Payables Book.</p>

          <div style={{ background: '#f0f9ff', padding: 20, borderRadius: 12, border: '1px dashed #7dd3fc', textAlign: 'left', marginBottom: 24 }}>
            <div style={{ fontFamily: 'monospace', fontSize: 18, fontWeight: 800, color: '#0369a1', textAlign: 'center', letterSpacing: 2, marginBottom: 14 }}>{submitted.pvNumber}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 14 }}>
              <div><span style={{ color: '#64748b', fontSize: 11, display: 'block' }}>Date</span><b>{submitted.date}</b></div>
              <div><span style={{ color: '#64748b', fontSize: 11, display: 'block' }}>Method</span><b>{submitted.paymentMethod}</b></div>
              <div><span style={{ color: '#64748b', fontSize: 11, display: 'block' }}>Category</span><b>{submitted.category}</b></div>
              <div><span style={{ color: '#64748b', fontSize: 11, display: 'block' }}>Paid To</span><b>{submitted.paidTo}</b></div>
              <div style={{ gridColumn: 'span 2' }}>
                <span style={{ color: '#64748b', fontSize: 11, display: 'block' }}>Amount</span>
                <span style={{ fontWeight: 800, color: '#0284c7', fontSize: 20 }}>ETB {fmt(submitted.amount)}</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-around', gap: 8, marginBottom: 28 }}>
            {[
              { label: 'Prepared By', name: submitted.preparedBy,   sig: submitted.preparedSignature },
              { label: 'Checked By',  name: submitted.checkedBy,    sig: submitted.checkedSignature },
              { label: "Payee's Sig.", name: submitted.payeeName,   sig: submitted.payeeSignature },
            ].map(({ label, name, sig }) => (
              <div key={label} style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ height: 54, border: '1px solid #e2e8f0', borderRadius: 6, overflow: 'hidden', background: '#fafafa', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 4 }}>
                  {sig ? <img src={sig} alt={label} style={{ maxHeight: 50, maxWidth: '100%', objectFit: 'contain' }} /> : <span style={{ color: '#cbd5e1', fontSize: 10 }}>No sig</span>}
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#475569' }}>{name}</div>
                <div style={{ fontSize: 10, color: '#94a3b8' }}>{label}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={() => window.print()} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 12, background: 'white', border: '1px solid #cbd5e1', borderRadius: 8, cursor: 'pointer', fontWeight: 600, color: '#475569', fontSize: 14 }}>
              <Printer size={16} /> Print PV
            </button>
            <button onClick={resetForm} style={{ flex: 1, padding: 12, background: '#0f172a', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>
              New Payment
            </button>
          </div>
        </div>

        {/* ─── PRINT VIEW ─── */}
        <div className="print-only" style={{ display: 'none', padding: '36px 48px', background: 'white', fontFamily: "'Times New Roman', serif" }}>
          <div style={{ textAlign: 'center', borderBottom: '3px double #000', paddingBottom: 16, marginBottom: 20 }}>
            <h1 style={{ fontSize: 26, margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: 3 }}>Sutana Enterprise</h1>
            <h2 style={{ fontSize: 16, margin: 0, fontWeight: 'normal', color: '#333' }}>OFFICIAL PAYMENT VOUCHER (PV) — APPROVED PAYMENT</h2>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, fontSize: 13 }}>
            <div>
              <b>Voucher No:</b> <span style={{ fontFamily: 'monospace', fontSize: 15 }}>{submitted.pvNumber}</span><br />
              <b>Category:</b> {submitted.category}<br />
              <b>Reference:</b> {submitted.referenceNo || 'N/A'}
            </div>
            <div style={{ textAlign: 'right' }}>
              <b>Date:</b> {new Date(submitted.date).toLocaleDateString('en-GB')}<br />
              <b>Payment Method:</b> {submitted.paymentMethod}
            </div>
          </div>
          <div style={{ lineHeight: 2.4, fontSize: 15, marginBottom: 24 }}>
            <div><b>PAID TO:</b>&nbsp;<span style={{ borderBottom: '1px solid #000', display: 'inline-block', minWidth: 320 }}>{submitted.paidTo}</span></div>
            <div><b>THE SUM OF:</b>&nbsp;<span style={{ borderBottom: '1px solid #000', display: 'inline-block', minWidth: 340, fontStyle: 'italic' }}>{submitted.amountWords}</span></div>
            <div><b>BEING PAYMENT FOR:</b>&nbsp;<span style={{ borderBottom: '1px solid #000', display: 'inline-block', minWidth: 280 }}>{submitted.description}</span></div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
            <div style={{ padding: '12px 24px', border: '2px solid #000', fontSize: 26, fontWeight: 'bold' }}>
              ETB {fmt(submitted.amount)}
            </div>
            {submitted.paymentMethod === 'Bank' && submitted.bankDetails && (
              <div style={{ padding: '12px 16px', border: '1px solid #555', fontSize: 13, minWidth: 240 }}>
                <b>Bank Details:</b><br />Bank: {submitted.bankDetails.bankName}<br />
                A/C Name: {submitted.bankDetails.accountHolder}<br />A/C No: {submitted.bankDetails.accountNumber}
                {submitted.bankDetails.chequeNo && <><br />Cheque No: {submitted.bankDetails.chequeNo}</>}
              </div>
            )}
            {submitted.paymentMethod === 'Telebirr' && submitted.telebirrDetails && (
              <div style={{ padding: '12px 16px', border: '1px solid #555', fontSize: 13, minWidth: 240 }}>
                <b>Telebirr Details:</b><br />Mobile: {submitted.telebirrDetails.telebirrNumber}<br />Name: {submitted.telebirrDetails.fullName}
              </div>
            )}
            {submitted.paymentMethod === 'Cash' && (
              <div style={{ padding: '12px 24px', border: '1px solid #555', fontSize: 18, fontWeight: 'bold', textAlign: 'center' }}>By Cash</div>
            )}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 48 }}>
            <PrintSigBlock label="Prepared By"       name={submitted.preparedBy} sigImage={submitted.preparedSignature} />
            <PrintSigBlock label="Checked By"        name={submitted.checkedBy}  sigImage={submitted.checkedSignature} />
            <PrintSigBlock label="Payee's Signature" name={submitted.payeeName}  sigImage={submitted.payeeSignature} />
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

  /* ─── PAYABLES BOOK VIEW ─── */
  if (view === 'list') {
    const totalPaid = payablesList.reduce((s, r) => s + parseFloat(r.amount_paid || 0), 0);
    return (
      <div style={{ padding: 32, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
            <div>
              <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 12, color: '#0f172a' }}>
                <span style={{ background: 'linear-gradient(135deg,#0ea5e9,#0284c7)', padding: 10, borderRadius: 12, display: 'flex', boxShadow: '0 4px 10px rgba(14,165,233,.3)' }}>
                  <List color="white" size={22} />
                </span>
                Payables Book
              </h1>
              <p style={{ color: '#64748b', margin: '8px 0 0', fontSize: 14 }}>Complete ledger of all approved payments recorded by Finance.</p>
            </div>
            <button onClick={() => setView('form')} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', background: 'linear-gradient(135deg,#0ea5e9,#0284c7)', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 14 }}>
              <ArrowUpRight size={16} /> New Payment
            </button>
          </div>

          {/* Summary KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20, marginBottom: 24 }}>
            {[
              { label: 'Total Disbursed', value: `ETB ${fmt(totalPaid)}`, color: '#0284c7', bg: '#eff6ff' },
              { label: 'Total Records', value: payablesList.length, color: '#0f172a', bg: '#f8fafc' },
              { label: 'This Month', value: `ETB ${fmt(payablesList.filter(r => new Date(r.date).getMonth() === new Date().getMonth()).reduce((s, r) => s + parseFloat(r.amount_paid || 0), 0))}`, color: '#059669', bg: '#f0fdf4' },
            ].map(kpi => (
              <div key={kpi.label} style={{ background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', padding: 24, boxShadow: '0 4px 6px -1px rgba(0,0,0,.05)' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>{kpi.label}</div>
                <div style={{ fontSize: 28, fontWeight: 900, color: kpi.color }}>{kpi.value}</div>
              </div>
            ))}
          </div>

          <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,.05)' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>All Payment Records</h3>
              <button onClick={loadPayables} style={{ fontSize: 13, padding: '6px 14px', background: 'white', border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer', fontWeight: 600, color: '#475569', display: 'flex', alignItems: 'center', gap: 6 }}>
                <RefreshCw size={13} /> Refresh
              </button>
            </div>
            {loadingList ? (
              <div style={{ padding: 60, textAlign: 'center', color: '#94a3b8' }}>Loading payables book...</div>
            ) : payablesList.length === 0 ? (
              <div style={{ padding: 64, textAlign: 'center' }}>
                <ArrowUpRight size={48} color="#0ea5e9" style={{ display: 'block', margin: '0 auto 16px' }} />
                <h3 style={{ margin: '0 0 8px', color: '#0f172a' }}>No payments yet</h3>
                <p style={{ color: '#64748b', margin: 0 }}>Use "New Payment" to approve and record your first payment.</p>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                    {['PV Number', 'Date', 'Paid To', 'Category', 'Method', 'Description', 'Ref #', 'Amount (ETB)', 'Status'].map(col => (
                      <th key={col} style={{ padding: '14px 18px', textAlign: col === 'Amount (ETB)' ? 'right' : 'left', color: '#64748b', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {payablesList.map(p => (
                    <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '14px 18px', fontFamily: 'monospace', color: '#0284c7', fontWeight: 700 }}>{p.pv_number}</td>
                      <td style={{ padding: '14px 18px', color: '#475569' }}>{fmtD(p.date)}</td>
                      <td style={{ padding: '14px 18px', fontWeight: 700, color: '#0f172a' }}>{p.paid_to}</td>
                      <td style={{ padding: '14px 18px' }}>
                        <span style={{ background: '#f1f5f9', color: '#475569', padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700 }}>{p.category}</span>
                      </td>
                      <td style={{ padding: '14px 18px', color: '#475569' }}>{p.payment_method}</td>
                      <td style={{ padding: '14px 18px', color: '#64748b', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.description || '—'}</td>
                      <td style={{ padding: '14px 18px', fontFamily: 'monospace', color: '#64748b', fontSize: 12 }}>{p.reference_no || '—'}</td>
                      <td style={{ padding: '14px 18px', textAlign: 'right', fontWeight: 800, color: '#0f172a' }}>{fmt(p.total_amount)}</td>
                      <td style={{ padding: '14px 18px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: '#f0fdf4', color: '#16a34a', padding: '4px 12px', borderRadius: 99, fontSize: 11, fontWeight: 700, border: '1px solid #bbf7d0' }}>
                          <CheckCircle size={11} /> {p.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  /* ─── PAYMENT FORM ─── */
  return (
    <div style={{ padding: 32, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ maxWidth: 840, margin: '0 auto 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 12, color: '#0f172a' }}>
            <span style={{ background: 'linear-gradient(135deg,#0ea5e9,#0284c7)', padding: 10, borderRadius: 12, display: 'flex', boxShadow: '0 4px 10px rgba(14,165,233,.3)' }}>
              <ArrowUpRight color="white" size={22} />
            </span>
            Approve Funds & Pay
          </h1>
          <p style={{ color: '#64748b', margin: '8px 0 0', fontSize: 14 }}>Fill out all payment details, collect signatures, and approve — payment records immediately in the Payables Book.</p>
        </div>
        <button onClick={() => setView('list')} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', background: 'white', border: '1px solid #cbd5e1', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 14, color: '#475569', boxShadow: '0 1px 2px rgba(0,0,0,.05)' }}>
          <List size={16} /> View Payables Book
        </button>
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
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}><User size={16} color="#64748b" /> Payment Information</h3>
          </div>
          <div style={{ padding: 28 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 7 }}>Date of Payment *</label>
                <input {...inp(date, setDate, '', true, 'date')} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 7 }}>Paid To *</label>
                <input {...inp(paidTo, setPaidTo, 'Supplier / Employee / Vendor / Contractor', true)} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 7 }}>Category *</label>
                <select required value={category} onChange={e => setCategory(e.target.value)}
                  onFocus={e => (e.target.style.borderColor = '#0ea5e9')} onBlur={e => (e.target.style.borderColor = '#e2e8f0')}
                  style={{ width: '100%', padding: '11px 14px', border: '2px solid #e2e8f0', borderRadius: 9, boxSizing: 'border-box', outline: 'none', fontSize: 14, background: 'white' }}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 7 }}>Due Date</label>
                <input {...inp(dueDate, setDueDate, '', false, 'date')} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 20, marginBottom: 20 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 7 }}>Amount (ETB) *</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#64748b', fontWeight: 600, fontSize: 12 }}>ETB</span>
                  <input required type="number" step="0.01" value={amount} onChange={handleAmountChange} placeholder="0.00"
                    onFocus={e => (e.target.style.borderColor = '#0ea5e9')} onBlur={e => (e.target.style.borderColor = '#e2e8f0')}
                    style={{ width: '100%', padding: '11px 14px 11px 46px', border: '2px solid #e2e8f0', borderRadius: 9, boxSizing: 'border-box', outline: 'none', fontSize: 15, fontWeight: 700 }} />
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
              <input {...inp(description, setDescription, 'Reason for payment (e.g. Monthly rent, Office supplies)', true)} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 7 }}>Reference # (Optional)</label>
              <input {...inp(referenceNo, setReferenceNo, 'Bill #, Invoice #, Order ID, etc.')} />
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
                  padding: 18, border: `2px solid ${paymentMethod === type ? '#0ea5e9' : '#e2e8f0'}`,
                  borderRadius: 12, cursor: 'pointer', fontWeight: 700, fontSize: 14,
                  background: paymentMethod === type ? '#f0f9ff' : 'white',
                  color: paymentMethod === type ? '#0284c7' : '#64748b',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, transition: 'all .2s'
                }}>
                  <Icon size={26} color={paymentMethod === type ? '#0ea5e9' : '#94a3b8'} /> {type}
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
                <input {...inp(preparedBy, setPreparedBy, 'Accountant Name', true)} style={{ width: '100%', padding: '10px 14px', border: '2px solid #e2e8f0', borderRadius: 9, boxSizing: 'border-box', outline: 'none', fontSize: 14, marginBottom: 10, display: 'block' }} />
                <SigPad label="Prepared By" onSave={setPreparedSig} />
                {preparedSig && <p style={{ margin: '4px 0 0', fontSize: 10, color: '#0284c7', fontWeight: 600 }}>✓ Signature ready</p>}
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 7 }}>Checked By (Name) *</label>
                <input {...inp(checkedBy, setCheckedBy, 'Manager / Approver Name', true)} style={{ width: '100%', padding: '10px 14px', border: '2px solid #e2e8f0', borderRadius: 9, boxSizing: 'border-box', outline: 'none', fontSize: 14, marginBottom: 10, display: 'block' }} />
                <SigPad label="Checked By" onSave={setCheckedSig} />
                {checkedSig && <p style={{ margin: '4px 0 0', fontSize: 10, color: '#0284c7', fontWeight: 600 }}>✓ Signature ready</p>}
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 7 }}>Payee's Name *</label>
                <input {...inp(payeeName, setPayeeName, 'Payee / Receiver Name', true)} style={{ width: '100%', padding: '10px 14px', border: '2px solid #e2e8f0', borderRadius: 9, boxSizing: 'border-box', outline: 'none', fontSize: 14, marginBottom: 10, display: 'block' }} />
                <SigPad label="Payee" onSave={setPayeeSig} />
                {payeeSig && <p style={{ margin: '4px 0 0', fontSize: 10, color: '#0284c7', fontWeight: 600 }}>✓ Signature ready</p>}
              </div>
            </div>
            <p style={{ margin: '18px 0 0', color: '#94a3b8', fontSize: 11 }}>
              ⓘ Draw on the white canvas with your mouse or finger, then click <b>Save</b> to confirm each signature before approving payment.
            </p>
          </div>
        </div>

        <button type="submit" disabled={loading} style={{
          width: '100%', padding: 16,
          background: 'linear-gradient(135deg,#0ea5e9,#0284c7)',
          color: 'white', border: 'none', borderRadius: 12,
          cursor: loading ? 'not-allowed' : 'pointer', fontSize: 16, fontWeight: 700,
          display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10,
          boxShadow: '0 4px 14px rgba(14,165,233,.4)', opacity: loading ? 0.7 : 1,
        }}>
          {loading ? <RefreshCw size={20} style={{ animation: 'spin 1s linear infinite' }} /> : <CheckCircle size={20} />}
          {loading ? 'Processing...' : 'Approve & Record Payment to Payables Book'}
        </button>
      </form>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default FinanceApprovePay;
