import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CreditCard, CheckCircle, Printer, DollarSign, User, FileText, History,
  Banknote, Building, Smartphone, Calendar, RefreshCw, PenTool, Trash2, Eye, X,
  BookOpen
} from 'lucide-react';
import api from '../../services/apiClient';
import SegmentedSpinner from '../../components/ui/SegmentedSpinner';
import { useAuth } from '../../hooks/useAuth';

/* ─── Native Canvas Signature Pad ────────────────────────────── */
const SigPad = ({ label, onSave, storageKey }) => {
  const canvasRef = useRef(null);
  const isDrawing  = useRef(false);
  const lastPos    = useRef(null);
  const hasInk     = useRef(false);
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
    if (!canvas) return;
    isDrawing.current = true;
    lastPos.current = getPos(e, canvas);
    hasInk.current    = true;
    setSaved(false);
    setIsEmpty(false);
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
  }, []);

  const saveNow = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !hasInk.current) return;
    const ctx = canvas.getContext('2d');
    const px = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let hasPixel = false;
    for (let i = 3; i < px.length; i += 4) {
      if (px[i] !== 0) { hasPixel = true; break; }
    }
    if (!hasPixel) {
      hasInk.current = false;
      setSaved(false);
      setIsEmpty(true);
      return;
    }
    const dataUrl = canvas.toDataURL('image/png');
    onSave(dataUrl);
    setSaved(true);
    if (storageKey) {
      localStorage.setItem(storageKey, dataUrl);
    }
  }, [onSave, storageKey]);

  const stopDraw = useCallback(() => {
    isDrawing.current = false;
    lastPos.current = null;
    saveNow();
  }, [saveNow]);

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

  useEffect(() => {
    if (storageKey) {
      const savedData = localStorage.getItem(storageKey);
      if (savedData) {
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          const img = new window.Image();
          img.onload = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
            hasInk.current = true;
            setIsEmpty(false);
            setSaved(true);
            onSave(savedData);
          };
          img.src = savedData;
        }
      }
    }
  }, [storageKey, onSave]);

  const handleClear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    hasInk.current = false;
    setIsEmpty(true);
    setSaved(false);
    onSave(null);
    if (storageKey) {
      localStorage.removeItem(storageKey);
    }
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
        {isEmpty ? 'Draw your signature — it auto-saves when you finish' : saved ? '✓ Signature captured & saved' : 'Keep drawing...'}
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

/* ─── Normalize a CRV row (DB snake_case) into print view (camelCase) ── */
const toPrintView = (c) => {
  const bankDetails = c.bankDetails || (c.bank_name ? { bankName: c.bank_name, accountHolder: c.account_holder, accountNumber: c.account_number, chequeNo: c.cheque_no } : null);
  const telebirrDetails = c.telebirrDetails || (c.telebirr_number ? { telebirrNumber: c.telebirr_number, fullName: c.telebirr_name } : null);
  return {
    crvNumber: c.crvNumber || c.crv_number,
    date: c.date,
    receivedFrom: c.receivedFrom || c.received_from,
    amount: c.amount,
    amountWords: c.amountWords || (c.amount != null ? `${parseFloat(c.amount).toLocaleString('en-US')} ETB Only` : ''),
    paymentMethod: c.paymentMethod || c.payment_method,
    description: c.description,
    referenceNo: c.referenceNo || c.reference_no,
    bankDetails,
    telebirrDetails,
    preparedBy: c.preparedBy || c.prepared_by,
    checkedBy: c.checkedBy || c.checked_by,
    receiverName: c.receiverName || c.receiver_name,
    preparedSignature: c.preparedSignature || c.prepared_signature,
    checkedSignature: c.checkedSignature || c.checked_signature,
    receiverSignature: c.receiverSignature || c.receiver_signature,
  };
};

/* ─── Printed CRV Document (shared by the create screen and history) ── */
const CRVPrintView = ({ crv }) => (
  <div className="print-only" style={{ display: 'none', padding: '36px 48px', background: 'white', fontFamily: "'Times New Roman', serif" }}>
    <div style={{ textAlign: 'center', borderBottom: '3px double #000', paddingBottom: 16, marginBottom: 20 }}>
      <h1 style={{ fontSize: 26, margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: 3 }}>Sutana Enterprise</h1>
      <h2 style={{ fontSize: 16, margin: 0, fontWeight: 'normal', color: '#333' }}>OFFICIAL CASH RECEIPT VOUCHER (CRV)</h2>
    </div>

    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, fontSize: 13 }}>
      <div>
        <b>Receipt No:</b> <span style={{ fontFamily: 'monospace', fontSize: 15 }}>{crv.crvNumber}</span><br />
        <b>Reference:</b> {crv.referenceNo || 'N/A'}
      </div>
      <div style={{ textAlign: 'right' }}>
        <b>Date:</b> {new Date(crv.date).toLocaleDateString('en-GB')}<br />
        <b>Payment Method:</b> {crv.paymentMethod}
      </div>
    </div>

    <div style={{ lineHeight: 2.4, fontSize: 15, marginBottom: 24 }}>
      <div><b>RECEIVED FROM:</b>&nbsp;<span style={{ borderBottom: '1px solid #000', display: 'inline-block', minWidth: 300 }}>{crv.receivedFrom}</span></div>
      <div><b>THE SUM OF:</b>&nbsp;<span style={{ borderBottom: '1px solid #000', display: 'inline-block', minWidth: 340, fontStyle: 'italic' }}>{crv.amountWords}</span></div>
      <div><b>BEING PAYMENT FOR:</b>&nbsp;<span style={{ borderBottom: '1px solid #000', display: 'inline-block', minWidth: 280 }}>{crv.description}</span></div>
    </div>

    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
      <div style={{ padding: '12px 24px', border: '2px solid #000', fontSize: 26, fontWeight: 'bold' }}>
        ETB {parseFloat(crv.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
      </div>

      {crv.paymentMethod === 'Bank' && crv.bankDetails && (
        <div style={{ padding: '12px 16px', border: '1px solid #555', fontSize: 13, minWidth: 240 }}>
          <b>Bank Details:</b><br />
          Bank: {crv.bankDetails.bankName}<br />
          A/C Name: {crv.bankDetails.accountHolder}<br />
          A/C No: {crv.bankDetails.accountNumber}
          {crv.bankDetails.chequeNo && <><br />Cheque No: {crv.bankDetails.chequeNo}</>}
        </div>
      )}
      {crv.paymentMethod === 'Telebirr' && crv.telebirrDetails && (
        <div style={{ padding: '12px 16px', border: '1px solid #555', fontSize: 13, minWidth: 240 }}>
          <b>Telebirr Details:</b><br />
          Mobile: {crv.telebirrDetails.telebirrNumber}<br />
          Name: {crv.telebirrDetails.fullName}
        </div>
      )}
      {crv.paymentMethod === 'Cash' && (
        <div style={{ padding: '12px 24px', border: '1px solid #555', fontSize: 18, fontWeight: 'bold', textAlign: 'center' }}>
          By Cash
        </div>
      )}
    </div>

    {/* Signature row */}
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 48 }}>
      <PrintSigBlock label="Prepared By"          name={crv.preparedBy}   sigImage={crv.preparedSignature} />
      <PrintSigBlock label="Receiver's Signature" name={crv.receiverName} sigImage={crv.receiverSignature} />
    </div>
  </div>
);

/* ─── Main CRV Form ───────────────────────────────────────────── */
const FinanceCRV = () => {
  const navigate = useNavigate();
  const [date, setDate]             = useState(new Date().toISOString().slice(0, 10));
  const [receivedFrom, setReceivedFrom] = useState('');
  const [amount, setAmount]         = useState('');
  const [amountWords, setAmountWords] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [description, setDescription] = useState('');
  const [referenceNo, setReferenceNo] = useState(() => 'REF-' + Math.floor(100000 + Math.random() * 900000));

  const [bankName, setBankName]             = useState('');
  const [accountHolder, setAccountHolder]   = useState('');
  const [accountNumber, setAccountNumber]   = useState('');
  const [chequeNo, setChequeNo]             = useState('');

  const [telebirrNumber, setTelebirrNumber] = useState('');
  const [telebirrName, setTelebirrName]     = useState('');

  const { user } = useAuth();
  const profileName = user?.fullName || user?.name || user?.full_name || '';
  const [preparedBy, setPreparedBy]         = useState(profileName);
  const [receiverName, setReceiverName]     = useState('');

  useEffect(() => {
    if (profileName) setPreparedBy(profileName);
  }, [profileName]);

  const [preparedSig, setPreparedSig]       = useState(null);
  const [receiverSig, setReceiverSig]       = useState(null);

  const [submitted, setSubmitted] = useState(null);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);

  /* ── Tabs + History ─────────────────────────────────────────── */
  const [activeTab, setActiveTab]   = useState('form'); // 'form' | 'history'
  const [crvList, setCrvList]       = useState([]);
  const [companyAccounts, setCompanyAccounts] = useState([]);

  useEffect(() => {
    api.get('/finance-bank').then(res => setCompanyAccounts(res.data?.data || res.data || [])).catch(console.error);
  }, []);
  const [crvLoading, setCrvLoading] = useState(false);
  const [printTarget, setPrintTarget] = useState(null);
  const [detailCrv, setDetailCrv]     = useState(null);
  const [sigKey, setSigKey]           = useState(0);

  const loadHistory = useCallback(async () => {
    setCrvLoading(true);
    try {
      const res = await api.get('/finance-cash/crv');
      setCrvList(res?.data?.data || res?.data || []);
    } catch {
      setCrvList([]);
    } finally {
      setCrvLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'history') loadHistory();
  }, [activeTab, loadHistory]);

  useEffect(() => {
    const onAfterPrint = () => setPrintTarget(null);
    window.addEventListener('afterprint', onAfterPrint);
    return () => window.removeEventListener('afterprint', onAfterPrint);
  }, []);

  const handlePrintReceipt = (crv) => {
    setPrintTarget(toPrintView(crv));
    setTimeout(() => window.print(), 150);
  };

  const handleViewReceipt = (crv) => setDetailCrv(toPrintView(crv));

  const printDetail = () => {
    if (!detailCrv) return;
    setPrintTarget(detailCrv);
    setTimeout(() => window.print(), 150);
  };

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
        preparedBy, receiverName,
        preparedSignature: preparedSig,
        receiverSignature: receiverSig,
      };
      const res = await api.post('/finance-cash/crv', payload);
      setSubmitted({ crvNumber: res.data?.data?.crvNumber, ...payload, amountWords });
      loadHistory();
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
    setReceiverName('');
    setPreparedSig(null); setReceiverSig(null);
    setSigKey(k => k + 1);
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

  /* ─── Print CSS (shared) ─────────────────────────────────────── */
  const printCss = `
    @media print {
      body * { visibility: hidden; }
      .print-only, .print-only * { visibility: visible; }
      .print-only { display: block !important; position: fixed; inset: 0; }
      .no-print { display: none !important; }
      @page { margin: 12mm; size: A4; }
    }
  `;

  /* ─── Tab bar ────────────────────────────────────────────────── */
  const tabBtnStyle = (active) => ({
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: '13px 16px',
    borderRadius: 10,
    cursor: 'pointer',
    fontWeight: 700,
    fontSize: 14,
    border: active ? '2px solid #22c55e' : '2px solid #e2e8f0',
    background: active ? '#f0fdf4' : 'white',
    color: active ? '#166534' : '#64748b',
    transition: 'all .2s',
  });

  const renderTabBar = () => (
    <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
      <button type="button" onClick={() => setActiveTab('form')} style={tabBtnStyle(activeTab === 'form')}>
        <PenTool size={16} /> New Receipt
      </button>
      <button type="button" onClick={() => navigate('/finance/outstanding-ar')} style={{ ...tabBtnStyle(false), flex: 0 }}>
        <BookOpen size={16} /> Revenue Book
      </button>
    </div>
  );

  /* ─── History list ───────────────────────────────────────────── */
  const renderHistory = () => (
    <div style={{ maxWidth: 840, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
          <History size={18} color="#16a34a" /> Receipt History
        </h3>
        <button type="button" className="no-print" onClick={loadHistory} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 14px', border: '1px solid #cbd5e1', borderRadius: 8, background: 'white', color: '#475569', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {crvLoading ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}><SegmentedSpinner size={30} /></div>
      ) : crvList.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', color: '#94a3b8' }}>
          <FileText size={40} style={{ margin: '0 auto 10px', display: 'block', opacity: 0.4 }} />
          No receipts recorded yet. Create one from the New Receipt tab.
        </div>
      ) : (
        <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,.05)' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 640 }}>
              <thead>
                <tr>
                  {['Receipt No', 'Date', 'Received From', 'Method', 'Amount', ''].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', background: '#f8fafc', color: '#64748b', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', borderBottom: '2px solid #e2e8f0', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {crvList.map((crv, i) => (
                  <tr key={crv.id || i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '13px 16px', fontFamily: 'monospace', fontWeight: 700, color: '#047857', whiteSpace: 'nowrap' }}>{crv.crv_number}</td>
                    <td style={{ padding: '13px 16px', color: '#475569', whiteSpace: 'nowrap', fontSize: 13 }}>{new Date(crv.date).toLocaleDateString('en-GB')}</td>
                    <td style={{ padding: '13px 16px', color: '#334155', fontSize: 13 }}>{crv.received_from}</td>
                    <td style={{ padding: '13px 16px', fontSize: 13 }}>
                      <span style={{ padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700, background: crv.payment_method === 'Bank' ? '#eff6ff' : crv.payment_method === 'Telebirr' ? '#fffbeb' : '#f0fdf4', color: crv.payment_method === 'Bank' ? '#1d4ed8' : crv.payment_method === 'Telebirr' ? '#b45309' : '#15803d' }}>{crv.payment_method}</span>
                    </td>
                    <td style={{ padding: '13px 16px', fontWeight: 700, color: '#059669', whiteSpace: 'nowrap' }}>ETB {parseFloat(crv.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td style={{ padding: '13px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: 8 }}>
                        <button type="button" className="no-print" onClick={() => handleViewReceipt(crv)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 12px', border: '1px solid #c7d2fe', borderRadius: 7, background: '#eef2ff', color: '#4338ca', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                          <Eye size={13} /> View
                        </button>
                        <button type="button" className="no-print" onClick={() => handlePrintReceipt(crv)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 12px', border: '1px solid #86efac', borderRadius: 7, background: '#f0fdf4', color: '#15803d', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                          <Printer size={13} /> Print
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );

  /* ─── Detail view (single receipt) ─────────────────────────────── */
  const renderDetailModal = () => {
    if (!detailCrv) return null;
    const rows = [
      ['Receipt No', detailCrv.crvNumber],
      ['Date', new Date(detailCrv.date).toLocaleDateString('en-GB')],
      ['Received From', detailCrv.receivedFrom],
      ['Payment Method', detailCrv.paymentMethod],
      ['Reference', detailCrv.referenceNo || 'N/A'],
      ['Description', detailCrv.description || 'N/A'],
    ];
    return (
      <div className="no-print" onClick={() => setDetailCrv(null)}
        style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <div onClick={e => e.stopPropagation()}
          style={{ background: 'white', borderRadius: 18, maxWidth: 560, width: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0,0,0,.4)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 24px', borderBottom: '2px solid #e2e8f0', background: '#f8fafc' }}>
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Eye size={18} color="#4338ca" /> Receipt Details
            </h3>
            <button type="button" onClick={() => setDetailCrv(null)} style={{ border: 'none', background: '#eef2ff', color: '#4338ca', borderRadius: 8, width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <X size={18} />
            </button>
          </div>

          <div style={{ padding: 24 }}>
            <div style={{ background: '#f0fdf4', padding: 14, borderRadius: 12, border: '1px dashed #6ee7b7', textAlign: 'center', marginBottom: 20 }}>
              <div style={{ fontFamily: 'monospace', fontSize: 16, fontWeight: 800, color: '#047857', letterSpacing: 1 }}>{detailCrv.crvNumber}</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#059669', marginTop: 4 }}>
                ETB {parseFloat(detailCrv.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 4, fontStyle: 'italic' }}>{detailCrv.amountWords}</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 20px', marginBottom: 18 }}>
              {rows.map(([k, v]) => (
                <div key={k} style={{ padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.04em' }}>{k}</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#334155' }}>{v}</div>
                </div>
              ))}
            </div>

            {(detailCrv.paymentMethod === 'Bank' && detailCrv.bankDetails) && (
              <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 10, padding: 14, marginBottom: 18 }}>
                <b style={{ fontSize: 12, color: '#0369a1' }}>Bank Details</b>
                <div style={{ fontSize: 13, color: '#334155', marginTop: 6, lineHeight: 1.6 }}>
                  Bank: {detailCrv.bankDetails.bankName}<br />
                  A/C Name: {detailCrv.bankDetails.accountHolder}<br />
                  A/C No: {detailCrv.bankDetails.accountNumber}
                  {detailCrv.bankDetails.chequeNo && <><br />Cheque No: {detailCrv.bankDetails.chequeNo}</>}
                </div>
              </div>
            )}
            {(detailCrv.paymentMethod === 'Telebirr' && detailCrv.telebirrDetails) && (
              <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: 14, marginBottom: 18 }}>
                <b style={{ fontSize: 12, color: '#b45309' }}>Telebirr Details</b>
                <div style={{ fontSize: 13, color: '#334155', marginTop: 6, lineHeight: 1.6 }}>
                  Mobile: {detailCrv.telebirrDetails.telebirrNumber}<br />
                  Name: {detailCrv.telebirrDetails.fullName}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
              {[
                { label: 'Prepared By',   name: detailCrv.preparedBy,   sig: detailCrv.preparedSignature },
                { label: "Receiver's Sig.", name: detailCrv.receiverName, sig: detailCrv.receiverSignature },
              ].map(({ label, name, sig }) => (
                <div key={label} style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ height: 60, border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden', background: '#fafafa', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 4 }}>
                    {sig
                      ? <img src={sig} alt={label} style={{ maxHeight: 56, maxWidth: '100%', objectFit: 'contain' }} />
                      : <span style={{ color: '#cbd5e1', fontSize: 10 }}>—</span>
                    }
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>{name || 'N/A'}</div>
                  <div style={{ fontSize: 10, color: '#94a3b8' }}>{label}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" onClick={printDetail} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 12, background: '#0f172a', color: 'white', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: 14 }}>
                <Printer size={16} /> Print Receipt
              </button>
              <button type="button" onClick={() => setDetailCrv(null)} style={{ flex: 1, padding: 12, background: '#f1f5f9', color: '#334155', border: '1px solid #e2e8f0', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: 14 }}>
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  /* ─── SUCCESS SCREEN ─── */
  if (submitted) {
    return (
      <div style={{ padding: 32, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>

        {/* Header + tabs */}
        <div style={{ maxWidth: 840, margin: '0 auto 24px' }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 12, color: '#0f172a' }}>
            <span style={{ background: 'linear-gradient(135deg,#22c55e,#16a34a)', padding: 10, borderRadius: 12, display: 'flex', boxShadow: '0 4px 10px rgba(34,197,94,.3)' }}>
              <CreditCard color="white" size={22} />
            </span>
            Cash Receipt Voucher
          </h1>
          <p style={{ color: '#64748b', margin: '8px 0 0', fontSize: 14 }}>Record cash receipts and reprint any receipt from history.</p>
          {renderTabBar()}
        </div>

        {activeTab === 'history' ? (
          renderHistory()
        ) : (
        <>
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
          <p style={{ color: '#64748b', marginBottom: 24 }}>Recorded in receipt history (revenue — not in the expense book).</p>

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
        </>
        )}

        {/* ─── PRINT VIEW (just-created) ─── */}
        {activeTab !== 'history' && (
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
            <PrintSigBlock label="Receiver's Signature" name={submitted.receiverName} sigImage={submitted.receiverSignature} />
          </div>
        </div>
        )}

        <style>{`
          @media print {
            body * { visibility: hidden; }
            .print-only, .print-only * { visibility: visible; }
            .print-only { display: block !important; position: fixed; inset: 0; }
            .no-print { display: none !important; }
            @page { margin: 12mm; size: A4; }
          }
        `}</style>
        {printTarget && <CRVPrintView crv={printTarget} />}
        {detailCrv && renderDetailModal()}
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
        <p style={{ color: '#64748b', margin: '8px 0 0', fontSize: 14 }}>Fill all fields, draw the receiver's signature (auto-saved), then generate the CRV.</p>
        {renderTabBar()}
      </div>

      {activeTab === 'history' ? (
        renderHistory()
      ) : (
      <>
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <h4 style={{ margin: 0, fontSize: 13, color: '#0369a1', fontWeight: 700 }}>Bank Details</h4>
                  <select className="form-input" style={{ width: 250, padding: '8px 12px', border: '1px solid #7dd3fc', borderRadius: 8, fontSize: 13 }} onChange={e => {
                    const acc = companyAccounts.find(a => a.id.toString() === e.target.value);
                    if (acc) { setBankName(acc.bank_provider || ''); setAccountHolder('Sutana Enterprise'); setAccountNumber(acc.account_number || ''); }
                  }}><option value="">Select Company Bank Account...</option>{companyAccounts.filter(a => a.account_type === 'Bank').map(a => <option key={a.id} value={a.id}>{a.account_name} - {a.account_number}</option>)}</select>
                </div>
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <h4 style={{ margin: 0, fontSize: 13, color: '#b45309', fontWeight: 700 }}>Telebirr Details</h4>
                  <select className="form-input" style={{ width: 250, padding: '8px 12px', border: '1px solid #fcd34d', borderRadius: 8, fontSize: 13 }} onChange={e => {
                    const acc = companyAccounts.find(a => a.id.toString() === e.target.value);
                    if (acc) { setTelebirrNumber(acc.account_number || ''); setTelebirrName(acc.account_name || 'Sutana Enterprise'); }
                  }}><option value="">Select Company Telebirr...</option>{companyAccounts.filter(a => a.account_type === 'Mobile Wallet').map(a => <option key={a.id} value={a.id}>{a.account_name} - {a.account_number}</option>)}</select>
                </div>
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
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 7 }}>Prepared By (Finance Person)</label>
                <input {...input(preparedBy, setPreparedBy, 'Accountant Name')} style={{ width: '100%', padding: '10px 14px', border: '2px solid #e2e8f0', borderRadius: 9, boxSizing: 'border-box', outline: 'none', fontSize: 14, display: 'block' }} />
                <p style={{ margin: '6px 0 0', fontSize: 11, color: '#94a3b8' }}>Auto-filled from your profile</p>
                <div style={{ marginTop: 12 }}>
                  <SigPad key={sigKey} label="Prepared By Signature" onSave={setPreparedSig} storageKey="accountant_signature" />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 7 }}>Receiver's Name *</label>
                <input {...input(receiverName, setReceiverName, 'Receiver Name', true)} style={{ width: '100%', padding: '10px 14px', border: '2px solid #e2e8f0', borderRadius: 9, boxSizing: 'border-box', outline: 'none', fontSize: 14, marginBottom: 10, display: 'block' }} />
                <SigPad key={sigKey} label="Receiver's Signature (auto-saves)" onSave={setReceiverSig} />
                {receiverSig && <p style={{ margin: '4px 0 0', fontSize: 10, color: '#16a34a', fontWeight: 600 }}>✓ Signature captured</p>}
              </div>

            </div>
            <p style={{ margin: '18px 0 0', color: '#94a3b8', fontSize: 11 }}>
              ⓘ Only the receiver's signature is required. Draw on the white canvas — it is saved automatically when you finish, no extra click.
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
      </>
      )}

      {printTarget && <CRVPrintView crv={printTarget} />}
      {detailCrv && renderDetailModal()}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <style>{printCss}</style>
    </div>
  );
};

export default FinanceCRV;
