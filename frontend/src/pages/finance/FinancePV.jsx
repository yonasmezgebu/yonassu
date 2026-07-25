import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  CreditCard, CheckCircle, Printer, DollarSign, User, FileText, Clock,
  Banknote, Building, Smartphone, Calendar, RefreshCw, PenTool, Trash2, ArrowUpRight, AlertCircle
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

/* ─── Main PV Form ───────────────────────────────────────────── */
const FinancePV = () => {
  const [activeTab, setActiveTab] = useState('pv'); // 'pv' | 'pending'

  // ── PV Form state ──
  const [date, setDate]             = useState(new Date().toISOString().slice(0, 10));
  const [paidTo, setPaidTo]         = useState('');
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

  // ── Linked maintenance source for a "Continue Payment" PV ──
  const [maintSource, setMaintSource] = useState(null); // { rawId, asset, description, amount }

  // ── Pending payments state ──
  const [pendingList, setPendingList]   = useState([]);
  const [pendingLoad, setPendingLoad]   = useState(false);
  const [pendingErr, setPendingErr]     = useState(null);
  const [processId, setProcessId]       = useState(null);

  // ── Load count for badge (runs once on mount) ──
  const [pendingCount, setPendingCount] = useState(0);

  const loadPending = useCallback(async () => {
    setPendingLoad(true); setPendingErr(null);
    try {
      const [resMaint, resFuel] = await Promise.all([
        api.get('/car-renting/maintenance/finance'),
        api.get('/car-renting/fuel-service')
      ]);
      const allMaint = resMaint.data?.data || resMaint.data || [];
      const allFuelRaw = resFuel.data?.data || resFuel.data || [];
      
      const allFuel = allFuelRaw.map(f => ({
          ...f,
          type: f.request_type,
          isFuel: true,
      }));
      const all = [...allMaint, ...allFuel];

      const filtered = all.filter(m =>
        m.status === 'PENDING_FINANCE' || m.status === 'FINANCE_READY'
      ).map(m => ({
        id: m.isFuel ? `fs-${m.id}` : `maint-${m.id}`, rawId: m.id, source: m.isFuel ? 'Fuel & Service' : 'Fleet Maintenance',
        description: m.description || m.type || 'Maintenance',
        asset: m.asset_name,
        amount: parseFloat((m.estimated_cost_cents / 100).toFixed(2)),
        status: m.status,
        date: m.scheduled_date || m.requested_date || m.created_at,
        type: m.type,
        priority: m.priority,
        mechanic_name: m.mechanic_name || m.driver_name,
        location: m.location,
        notes: m.notes,
        isFuel: !!m.isFuel
      }));
      setPendingList(filtered);
      setPendingCount(filtered.length);
    } catch (e) {
      setPendingErr(e.message || 'Failed to load pending payments');
    } finally {
      setPendingLoad(false);
    }
  }, []);

  useEffect(() => { loadPending(); }, [loadPending]);

  // ── Step 1: Finance CONFIRMS → sets FINANCE_READY, notifies Car Manager & CEO ──
  const handleConfirm = async (item) => {
    setProcessId(item.id);
    try {
      if (item.isFuel) {
        await api.patch(`/car-renting/fuel-service/${item.rawId}/finance-approve`);
      } else {
        await api.patch(`/car-renting/maintenance/${item.rawId}/finance-approve`);
      }
      await loadPending();
    } catch (e) {
      setPendingErr(e.message || 'Failed to confirm payment');
    } finally {
      setProcessId(null);
    }
  };

  // ── Step 2: "Continue Payment" → switch to PV tab pre-filled ──
  const handleContinuePayment = (item) => {
    // Pre-fill the PV form with all maintenance data
    setDate(new Date().toISOString().slice(0, 10));
    setPaidTo(item.asset || '');
    setAmount(String(item.amount));
    setAmountWords(`${item.amount.toLocaleString('en-US')} ETB Only`);
    setDescription(`${item.source}: ${item.type || item.description} — ${item.asset}`);
    setReferenceNo(item.isFuel ? `FS-${String(item.rawId).padStart(4, '0')}` : `MNT-${String(item.rawId).padStart(4, '0')}`);
    setPaymentMethod('Cash');
    // Clear bank/telebirr fields
    setBankName(''); setAccountHolder(''); setAccountNumber(''); setChequeNo('');
    setTelebirrNumber(''); setTelebirrName('');
    setPreparedBy(''); setCheckedBy(''); setReceiverName('');
    setPreparedSig(null); setCheckedSig(null); setReceiverSig(null);
    setSubmitted(null); setError(null);
    // Store the source so submit knows to call maintenance-pay
    setMaintSource({ rawId: item.rawId, asset: item.asset, description: item.description, amount: item.amount, isFuel: item.isFuel });
    setActiveTab('pv');
  };

  const handleAmountChange = (e) => {
    setAmount(e.target.value);
    const v = parseFloat(e.target.value);
    setAmountWords(isNaN(v) ? '' : `${v.toLocaleString('en-US')} ETB Only`);
  };

  // ── Form Submit: if maintSource → call finance-pay for maintenance, else normal PV ──
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const payload = {
        date, paidTo, amount: parseFloat(amount),
        paymentMethod, description, referenceNo,
        bankDetails:     paymentMethod === 'Bank'     ? { bankName, accountHolder, accountNumber, chequeNo } : null,
        telebirrDetails: paymentMethod === 'Telebirr' ? { telebirrNumber, fullName: telebirrName }          : null,
        preparedBy, checkedBy, receiverName,
        preparedSignature: preparedSig,
        checkedSignature:  checkedSig,
        receiverSignature: receiverSig,
      };

      let pvNumber;
      if (maintSource) {
        // Maintenance payment: hits the maintenance finance-pay endpoint
        if (maintSource.isFuel) {
          const res = await api.patch(`/car-renting/fuel-service/${maintSource.rawId}/finance-pay`, payload);
          pvNumber = res.data?.data?.pvNumber || res.data?.pvNumber || `PV-FS-${maintSource.rawId}`;
        } else {
          const res = await api.patch(`/car-renting/maintenance/${maintSource.rawId}/finance-pay`, payload);
          pvNumber = res.data?.data?.pvNumber || res.data?.pvNumber || `PV-MNT-${maintSource.rawId}`;
        }
        setMaintSource(null);
        // Refresh pending list (item should disappear)
        loadPending();
      } else {
        // Regular manual PV
        const res = await api.post('/finance-cash/pv', payload);
        pvNumber = res.data?.data?.pvNumber;
      }

      setSubmitted({ pvNumber, ...payload, amountWords });
    } catch (err) {
      setError(err.message || 'Failed to generate Payment Voucher');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSubmitted(null);
    setMaintSource(null);
    setAmount(''); setAmountWords(''); setReferenceNo('');
    setPaidTo(''); setDescription('');
    setBankName(''); setAccountHolder(''); setAccountNumber(''); setChequeNo('');
    setTelebirrNumber(''); setTelebirrName('');
    setPreparedBy(''); setCheckedBy(''); setReceiverName('');
    setPreparedSig(null); setCheckedSig(null); setReceiverSig(null);
  };

  const input = (value, onChange, placeholder, required = false, type = 'text') => ({
    value, onChange: e => onChange(e.target.value),
    required, type, placeholder,
    onFocus: e => (e.target.style.borderColor = '#0ea5e9'),
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
          border: '2px solid #0ea5e9', padding: 40, textAlign: 'center',
          boxShadow: '0 20px 25px -5px rgba(0,0,0,.12)', margin: '0 auto'
        }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <CheckCircle size={36} color="#16a34a" />
          </div>
          <h2 style={{ margin: '0 0 8px', fontSize: 22, fontWeight: 800, color: '#0f172a' }}>Payment Voucher Generated!</h2>
          {submitted.pvNumber && (
            <div style={{ fontSize: 14, color: '#64748b', marginBottom: 8 }}>
              PV Number: <strong style={{ color: '#0ea5e9' }}>{submitted.pvNumber}</strong>
            </div>
          )}
          <div style={{ fontSize: 14, color: '#64748b', marginBottom: 24 }}>
            <strong style={{ color: '#16a34a', fontSize: 20 }}>ETB {parseFloat(submitted.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
            <br />paid to <strong>{submitted.paidTo}</strong>
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button onClick={() => window.print()} style={{ padding: '12px 24px', background: '#0ea5e9', color: 'white', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Printer size={16} /> Print PV
            </button>
            <button onClick={resetForm} style={{ padding: '12px 24px', background: 'white', color: '#475569', border: '2px solid #e2e8f0', borderRadius: 10, cursor: 'pointer', fontWeight: 700 }}>
              New PV
            </button>
          </div>
        </div>

        {/* Print-only PV document */}
        <div className="print-only" style={{ display: 'none', maxWidth: 720, margin: '0 auto', fontFamily: 'Arial, sans-serif', padding: 20 }}>
          <div style={{ textAlign: 'center', borderBottom: '3px double #333', paddingBottom: 12, marginBottom: 16 }}>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 900, letterSpacing: 1 }}>SUTANA TRADING</h2>
            <h3 style={{ margin: '6px 0 0', fontSize: 16, fontWeight: 700 }}>PAYMENT VOUCHER</h3>
            {submitted.pvNumber && <div style={{ fontSize: 13, marginTop: 4 }}>PV No: <b>{submitted.pvNumber}</b></div>}
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 12 }}>
            <tbody>
              <tr>
                <td style={{ padding: '6px 0', width: '30%', fontWeight: 700, fontSize: 12 }}>Date:</td>
                <td style={{ padding: '6px 8px', fontSize: 12 }}>{submitted.date}</td>
                <td style={{ padding: '6px 0', width: '30%', fontWeight: 700, fontSize: 12 }}>Reference #:</td>
                <td style={{ padding: '6px 8px', fontSize: 12 }}>{submitted.referenceNo || '—'}</td>
              </tr>
              <tr>
                <td style={{ padding: '6px 0', fontWeight: 700, fontSize: 12 }}>Paid To:</td>
                <td colSpan={3} style={{ padding: '6px 8px', fontSize: 12, fontWeight: 600 }}>{submitted.paidTo}</td>
              </tr>
              <tr>
                <td style={{ padding: '6px 0', fontWeight: 700, fontSize: 12 }}>Amount (ETB):</td>
                <td style={{ padding: '6px 8px', fontSize: 16, fontWeight: 900 }}>{parseFloat(submitted.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                <td style={{ padding: '6px 0', fontWeight: 700, fontSize: 12 }}>In Words:</td>
                <td style={{ padding: '6px 8px', fontSize: 12, fontStyle: 'italic' }}>{submitted.amountWords}</td>
              </tr>
              <tr>
                <td style={{ padding: '6px 0', fontWeight: 700, fontSize: 12 }}>Description:</td>
                <td colSpan={3} style={{ padding: '6px 8px', fontSize: 12 }}>{submitted.description}</td>
              </tr>
              <tr>
                <td style={{ padding: '6px 0', fontWeight: 700, fontSize: 12 }}>Payment Method:</td>
                <td colSpan={3} style={{ padding: '6px 8px', fontSize: 12 }}>{submitted.paymentMethod}</td>
              </tr>
            </tbody>
          </table>

          {submitted.paymentMethod === 'Bank' && submitted.bankDetails && (
            <div style={{ border: '1px solid #ccc', padding: 10, borderRadius: 6, marginBottom: 12, fontSize: 12 }}>
              <b>Bank Transfer Details</b> — Bank: {submitted.bankDetails.bankName} | A/C Holder: {submitted.bankDetails.accountHolder} | A/C #: {submitted.bankDetails.accountNumber} {submitted.bankDetails.chequeNo ? `| Cheque: ${submitted.bankDetails.chequeNo}` : ''}
            </div>
          )}
          {submitted.paymentMethod === 'Telebirr' && submitted.telebirrDetails && (
            <div style={{ border: '1px solid #ccc', padding: 10, borderRadius: 6, marginBottom: 12, fontSize: 12 }}>
              <b>Telebirr Details</b> — Mobile: {submitted.telebirrDetails.telebirrNumber} | Name: {submitted.telebirrDetails.fullName}
            </div>
          )}
          {submitted.paymentMethod === 'Cash' && (
            <div style={{ border: '1px solid #ccc', padding: 10, borderRadius: 6, marginBottom: 12, fontSize: 12, textAlign: 'center', fontWeight: 700 }}>
              By Cash
            </div>
          )}

          {/* Signature row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 48 }}>
            <PrintSigBlock label="Prepared By"      name={submitted.preparedBy}   sigImage={submitted.preparedSignature} />
            <PrintSigBlock label="Checked By"       name={submitted.checkedBy}    sigImage={submitted.checkedSignature} />
            <PrintSigBlock label="Payee's Signature" name={submitted.receiverName} sigImage={submitted.receiverSignature} />
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

  // Status config for pending table
  const statusConfig = {
    PENDING_FINANCE: { bg: '#FFF3E0', color: '#E65100', label: 'CEO Confirmed — Awaiting Finance' },
    FINANCE_READY:   { bg: '#E8F5E9', color: '#2E7D32', label: '✅ Finance Ready — Payment Set' },
  };

  return (
    <div style={{ padding: 32, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ maxWidth: 880, margin: '0 auto 28px' }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: 12, color: '#0f172a' }}>
          <span style={{ background: 'linear-gradient(135deg,#0ea5e9,#0284c7)', padding: 10, borderRadius: 12, display: 'flex', boxShadow: '0 4px 10px rgba(14,165,233,.3)' }}>
            <ArrowUpRight color="white" size={22} />
          </span>
          Financial Management
          {maintSource && (
            <span style={{ fontSize: 12, background: '#fef3c7', color: '#b45309', padding: '4px 12px', borderRadius: 99, fontWeight: 600, border: '1px solid #fde68a' }}>
              🔗 Filling PV from: {maintSource.asset}
            </span>
          )}
        </h1>

        {/* ── TWO TAB BUTTONS ── */}
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={() => setActiveTab('pv')}
            style={{
              flex: 1, padding: '14px 20px', borderRadius: 12, cursor: 'pointer', fontWeight: 700, fontSize: 15,
              border: activeTab === 'pv' ? '2px solid #0ea5e9' : '2px solid #e2e8f0',
              background: activeTab === 'pv' ? 'linear-gradient(135deg,#0ea5e9,#0284c7)' : 'white',
              color: activeTab === 'pv' ? 'white' : '#475569',
              boxShadow: activeTab === 'pv' ? '0 4px 14px rgba(14,165,233,.3)' : '0 1px 3px rgba(0,0,0,.06)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, transition: 'all .2s',
            }}>
            <FileText size={20} /> Payment Voucher (PV)
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            style={{
              flex: 1, padding: '14px 20px', borderRadius: 12, cursor: 'pointer', fontWeight: 700, fontSize: 15,
              border: activeTab === 'pending' ? '2px solid #f59e0b' : '2px solid #e2e8f0',
              background: activeTab === 'pending' ? 'linear-gradient(135deg,#f59e0b,#d97706)' : 'white',
              color: activeTab === 'pending' ? 'white' : '#475569',
              boxShadow: activeTab === 'pending' ? '0 4px 14px rgba(245,158,11,.3)' : '0 1px 3px rgba(0,0,0,.06)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, transition: 'all .2s', position: 'relative',
            }}>
            <Clock size={20} /> Pending Payment
            {pendingCount > 0 && (
              <span style={{
                background: activeTab === 'pending' ? 'white' : '#ef4444',
                color: activeTab === 'pending' ? '#d97706' : 'white',
                borderRadius: '50%', width: 26, height: 26, display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: 13, fontWeight: 900, lineHeight: 1,
                boxShadow: '0 2px 6px rgba(0,0,0,.25)',
              }}>
                {pendingCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ══ PENDING PAYMENT TAB ══ */}
      {activeTab === 'pending' && (
        <div style={{ maxWidth: 880, margin: '0 auto' }}>
          <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,.05)' }}>
            <div style={{ padding: '20px 28px', borderBottom: '1px solid #e2e8f0', background: '#fffbeb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#92400e', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Clock size={18} /> Pending Payments
                  {pendingCount > 0 && (
                    <span style={{ background: '#ef4444', color: 'white', borderRadius: 99, padding: '2px 10px', fontSize: 13, fontWeight: 900 }}>
                      {pendingCount}
                    </span>
                  )}
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: '#a16207' }}>CEO-approved Fleet Maintenance &amp; Fuel/Service requests awaiting Finance confirmation &amp; payment.</p>
              </div>
              <button onClick={loadPending} style={{ padding: '8px 14px', background: 'white', border: '1px solid #e2e8f0', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#475569' }}>
                <RefreshCw size={14} /> Refresh
              </button>
            </div>

            {pendingErr && (
              <div style={{ margin: 16, padding: '12px 16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, color: '#991b1b', fontSize: 13, display: 'flex', gap: 8, alignItems: 'center' }}>
                <AlertCircle size={15} /> {pendingErr}
              </div>
            )}

            {pendingLoad ? (
              <div style={{ padding: 48, textAlign: 'center', color: '#94a3b8' }}>
                <RefreshCw size={28} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 12px', display: 'block' }} />
                Loading pending payments…
              </div>
            ) : pendingList.length === 0 ? (
              <div style={{ padding: 48, textAlign: 'center', color: '#94a3b8' }}>
                <CheckCircle size={40} style={{ marginBottom: 12, color: '#86efac', display: 'block', margin: '0 auto 12px' }} />
                <p style={{ fontWeight: 600, fontSize: 15, color: '#475569', margin: 0 }}>No pending payments</p>
                <p style={{ fontSize: 13, margin: '6px 0 0' }}>All CEO-approved payments have been processed.</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                      <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: 700, color: '#475569', fontSize: 11 }}>SOURCE</th>
                      <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: 700, color: '#475569', fontSize: 11 }}>ASSET / DESCRIPTION</th>
                      <th style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 700, color: '#475569', fontSize: 11 }}>AMOUNT (ETB)</th>
                      <th style={{ padding: '14px 16px', textAlign: 'center', fontWeight: 700, color: '#475569', fontSize: 11 }}>STATUS</th>
                      <th style={{ padding: '14px 16px', textAlign: 'center', fontWeight: 700, color: '#475569', fontSize: 11 }}>ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingList.map(item => {
                      const sc = statusConfig[item.status] || { bg: '#f1f5f9', color: '#475569', label: item.status };
                      return (
                        <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background .15s' }}
                          onMouseEnter={e => e.currentTarget.style.background = '#fafbfc'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                          <td style={{ padding: '14px 16px' }}>
                            <span style={{ background: item.isFuel ? '#fef3c7' : '#e0f2fe', color: item.isFuel ? '#b45309' : '#0369a1', padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700 }}>{item.source}</span>
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 14 }}>{item.asset || '—'}</div>
                            <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{item.description}</div>
                            {item.priority && (
                              <span style={{ fontSize: 10, background: item.priority === 'High' || item.priority === 'Urgent' ? '#fef2f2' : '#f0fdf4', color: item.priority === 'High' || item.priority === 'Urgent' ? '#dc2626' : '#16a34a', padding: '2px 7px', borderRadius: 4, fontWeight: 700, display: 'inline-block', marginTop: 4 }}>
                                {item.priority} Priority
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 900, color: '#059669', fontSize: 18 }}>
                            {item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                            <span style={{ background: sc.bg, color: sc.color, padding: '6px 12px', borderRadius: 8, fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}>
                              {sc.label}
                            </span>
                          </td>
                          <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                            {item.status === 'PENDING_FINANCE' && (
                              <button
                                onClick={() => handleConfirm(item)}
                                disabled={processId === item.id}
                                style={{ padding: '9px 20px', background: 'linear-gradient(135deg,#16a34a,#15803d)', border: 'none', color: 'white', borderRadius: 9, cursor: 'pointer', fontWeight: 700, fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6, boxShadow: '0 3px 8px rgba(22,163,74,.35)' }}>
                                {processId === item.id ? <RefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <CheckCircle size={13} />}
                                Confirm to CEO &amp; Manager
                              </button>
                            )}
                            {item.status === 'FINANCE_READY' && (
                              <button
                                onClick={() => handleContinuePayment(item)}
                                style={{ padding: '9px 20px', background: 'linear-gradient(135deg,#0ea5e9,#0284c7)', border: 'none', color: 'white', borderRadius: 9, cursor: 'pointer', fontWeight: 700, fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6, boxShadow: '0 3px 8px rgba(14,165,233,.35)' }}>
                                <Banknote size={14} /> Continue Payment →
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* ══ PV FORM TAB ══ */}
      {activeTab === 'pv' && (<>

      {maintSource && (
        <div style={{ maxWidth: 880, margin: '0 auto 16px', background: '#f0fdf4', border: '2px solid #86efac', color: '#15803d', padding: '14px 20px', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 10, fontWeight: 600 }}>
          <CheckCircle size={18} />
          PV pre-filled from maintenance request for <strong>{maintSource.asset}</strong>. Fill signatures and click "Generate" to complete payment.
          <button onClick={() => { setMaintSource(null); resetForm(); }} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#15803d', fontSize: 12, textDecoration: 'underline' }}>Clear</button>
        </div>
      )}

      {error && (
        <div style={{ maxWidth: 880, margin: '0 auto 16px', background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', padding: '14px 18px', borderRadius: 10 }}>
          <b>Error:</b> {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ maxWidth: 880, margin: '0 auto' }}>

        {/* General Information */}
        <div style={card}>
          <div style={{ padding: '20px 28px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}><User size={16} color="#64748b" /> General Information</h3>
          </div>
          <div style={{ padding: 28 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 7 }}>Date Paid *</label>
                <input {...input(date, setDate, '', true, 'date')} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 7 }}>Paid To *</label>
                <input {...input(paidTo, setPaidTo, 'Supplier / Employee / Vendor', true)} />
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
                    onFocus={e => (e.target.style.borderColor = '#0ea5e9')} onBlur={e => (e.target.style.borderColor = '#e2e8f0')}
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
              <input {...input(description, setDescription, 'Reason for payment (e.g. Office supplies)', true)} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 7 }}>Reference # (Optional)</label>
              <input {...input(referenceNo, setReferenceNo, 'Bill #, Order ID, etc.')} />
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
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 7 }}>Payee's Name *</label>
                <input {...input(receiverName, setReceiverName, 'Payee / Receiver', true)} style={{ width: '100%', padding: '10px 14px', border: '2px solid #e2e8f0', borderRadius: 9, boxSizing: 'border-box', outline: 'none', fontSize: 14, marginBottom: 10, display: 'block' }} />
                <SigPad label="Payee" onSave={setReceiverSig} />
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
          background: maintSource
            ? 'linear-gradient(135deg,#16a34a,#15803d)'
            : 'linear-gradient(135deg,#0ea5e9,#0284c7)',
          color: 'white', border: 'none', borderRadius: 12,
          cursor: loading ? 'not-allowed' : 'pointer', fontSize: 16, fontWeight: 700,
          display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10,
          boxShadow: maintSource ? '0 4px 14px rgba(22,163,74,.4)' : '0 4px 14px rgba(14,165,233,.4)',
          opacity: loading ? 0.7 : 1,
        }}>
          {loading ? <RefreshCw size={20} style={{ animation: 'spin 1s linear infinite' }} /> : <CheckCircle size={20} />}
          {loading ? 'Processing...' : maintSource ? `Generate PV & Release Payment for ${maintSource.asset}` : 'Generate Payment Voucher'}
        </button>
      </form>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </>)}

    </div>
  );
};

export default FinancePV;
