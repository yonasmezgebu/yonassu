import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  CheckCircle, Printer, User, FileText, Clock,
  Banknote, Building, Smartphone, RefreshCw, PenTool, Trash2, ArrowUpRight, AlertCircle
} from 'lucide-react';
import api from '../../services/apiClient';

/* ─── CSS Styles for Hover and Responsive ──────────────────────── */
const styles = `
  .pv-wrapper {
    padding: 24px;
    background-color: #F5F5F5;
    min-height: 100vh;
    font-family: 'Inter', sans-serif;
    width: 100%;
    box-sizing: border-box;
    margin: 0;
  }
  .pv-container {
    width: 100%;
    margin: 0;
    padding: 0;
  }
  .btn-primary {
    background: #2E8B57;
    color: white;
    border: none;
    border-radius: 0;
    cursor: pointer;
    font-weight: 700;
    transition: all 0.2s ease;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }
  .btn-primary:hover {
    background: #228B22;
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0,0,0,0.2);
  }
  .btn-tab {
    border-radius: 0;
    cursor: pointer;
    font-weight: 700;
    transition: all 0.2s ease;
    border: 2px solid #8D6E63;
  }
  .btn-tab.active {
    background: #228B22;
    color: white;
    border-color: #1B5E20;
  }
  .btn-tab.inactive {
    background: #FFFFFF;
    color: #424242;
  }
  .btn-tab:hover {
    background: #2E8B57;
    color: white;
  }
  .table-row {
    transition: background 0.2s ease;
  }
  .table-row:hover {
    background: #A5D6A7 !important;
  }
  .form-input {
    width: 100%;
    padding: 12px 14px;
    border: 2px solid #8D6E63;
    border-radius: 0;
    box-sizing: border-box;
    outline: none;
    font-size: 14px;
    transition: border-color 0.2s, box-shadow 0.2s;
    background: #FFFFFF;
    color: #424242;
    font-weight: 600;
  }
  .form-input:focus {
    border-color: #228B22;
    box-shadow: 0 0 5px rgba(34,139,34,0.5);
  }
  .card-container {
    background: #FFFFFF;
    border-radius: 0;
    border: 1px solid #8D6E63;
    margin-bottom: 24px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    width: 100%;
  }
  .section-title {
    color: #1B5E20;
    font-size: 18px;
    font-weight: 800;
    margin: 0 0 16px 0;
    display: flex;
    align-items: center;
    gap: 8px;
    padding-bottom: 8px;
    border-bottom: 2px solid #8D6E63;
  }
  .grid-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
  }
  .grid-3 {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
  }
  @media (max-width: 768px) {
    .grid-2, .grid-3 {
      grid-template-columns: 1fr;
    }
    .pv-wrapper {
      padding: 16px;
    }
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  @media print {
    body * { visibility: hidden; }
    .print-only, .print-only * { visibility: visible; }
    .print-only { display: block !important; position: fixed; inset: 0; }
    .no-print { display: none !important; }
    @page { margin: 12mm; size: A4; }
  }
`;

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
    ctx.strokeStyle = '#1B5E20';
    ctx.lineWidth = 2;
    ctx.lineCap = 'square';
    ctx.lineJoin = 'miter';
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
    <div style={{ border: '2px solid #8D6E63', borderRadius: 0, overflow: 'hidden', background: '#FFFFFF' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#A5D6A7', borderBottom: '2px solid #8D6E63' }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#1B5E20', display: 'flex', alignItems: 'center', gap: 5 }}>
          <PenTool size={14} /> {label}
          {saved && <span style={{ background: '#228B22', color: '#FFFFFF', fontSize: 10, padding: '2px 6px', borderRadius: 0, marginLeft: 4 }}>✓ Saved</span>}
        </span>
        <div style={{ display: 'flex', gap: 6 }}>
          <button type="button" onClick={handleClear} style={{ fontSize: 11, padding: '4px 10px', border: 'none', background: '#F44336', color: '#FFFFFF', borderRadius: 0, cursor: 'pointer', fontWeight: 700 }}>
            Clear
          </button>
          <button type="button" onClick={handleSave} disabled={isEmpty} style={{ fontSize: 11, padding: '4px 10px', border: 'none', background: isEmpty ? '#9E9E9E' : '#2E8B57', color: '#FFFFFF', borderRadius: 0, cursor: isEmpty ? 'not-allowed' : 'pointer', fontWeight: 700 }}>
            Save
          </button>
        </div>
      </div>
      <canvas ref={canvasRef} width={400} height={120} onMouseDown={startDraw} onMouseMove={draw} onMouseUp={stopDraw} onMouseLeave={stopDraw} style={{ width: '100%', height: 120, display: 'block', cursor: 'crosshair', background: '#FFFFFF', touchAction: 'none' }} />
      <div style={{ padding: '6px 10px', background: '#A5D6A7', borderTop: '2px solid #8D6E63', fontSize: 11, color: '#1B5E20', textAlign: 'center', fontWeight: 700 }}>
        {isEmpty ? 'Draw signature and Save' : saved ? '✓ Captured' : 'Press Save'}
      </div>
    </div>
  );
};

/* ─── Printed Signature Block ─────────────────────────────────── */
const PrintSigBlock = ({ label, name, sigImage }) => (
  <div style={{ width: '210px', textAlign: 'center' }}>
    <div style={{ height: 80, border: '2px solid #424242', borderRadius: 0, marginBottom: 6, overflow: 'hidden', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {sigImage ? <img src={sigImage} alt="signature" style={{ maxHeight: 75, maxWidth: '100%', objectFit: 'contain' }} /> : <span style={{ color: '#424242', fontSize: 11 }}>—</span>}
    </div>
    <div style={{ borderTop: '2px solid #424242', paddingTop: 4 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: '#424242' }}>{name || '_______________'}</div>
      <div style={{ fontSize: 11, color: '#424242', marginTop: 2, fontWeight: 600 }}>{label}</div>
    </div>
  </div>
);

/* ─── Main PV Form ───────────────────────────────────────────── */
const FinancePV = () => {
  const [activeTab, setActiveTab] = useState('pv'); // 'pv' | 'pending'

  // Form state
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
  const [notification, setNotification] = useState(null); // In-app notification

  const [maintSource, setMaintSource] = useState(null); 

  const [pendingList, setPendingList]   = useState([]);
  const [pendingLoad, setPendingLoad]   = useState(false);
  const [processId, setProcessId]       = useState(null);
  const [pendingCount, setPendingCount] = useState(0);

  const loadPending = useCallback(async () => {
    setPendingLoad(true); setError(null);
    try {
      const [resMaint, resFuel] = await Promise.all([
        api.get('/car-renting/maintenance/finance'),
        api.get('/car-renting/fuel-service')
      ]);
      const allMaint = resMaint.data?.data || resMaint.data || [];
      const allFuelRaw = resFuel.data?.data || resFuel.data || [];
      
      const allFuel = allFuelRaw.map(f => ({ ...f, type: f.request_type, isFuel: true }));
      const all = [...allMaint, ...allFuel];

      const filtered = all.filter(m => m.status === 'PENDING_FINANCE' || m.status === 'FINANCE_READY').map(m => ({
        id: m.isFuel ? `fs-\${m.id}` : `maint-\${m.id}`, rawId: m.id, source: m.isFuel ? 'Fuel & Service' : 'Fleet Maintenance',
        description: m.description || m.type || 'Maintenance',
        asset: m.asset_name, amount: parseFloat((m.estimated_cost_cents / 100).toFixed(2)),
        status: m.status, date: m.scheduled_date || m.requested_date || m.created_at,
        type: m.type, priority: m.priority, mechanic_name: m.mechanic_name || m.driver_name,
        location: m.location, notes: m.notes, isFuel: !!m.isFuel
      }));
      setPendingList(filtered);
      setPendingCount(filtered.length);
    } catch (e) {
      setNotification({ type: 'error', msg: e.message || 'Failed to load pending payments' });
    } finally {
      setPendingLoad(false);
    }
  }, []);

  useEffect(() => { loadPending(); }, [loadPending]);

  const handleConfirm = async (item) => {
    setProcessId(item.id);
    try {
      if (item.isFuel) {
        await api.patch(`/car-renting/fuel-service/\${item.rawId}/finance-approve`);
      } else {
        await api.patch(`/car-renting/maintenance/\${item.rawId}/finance-approve`);
      }
      setNotification({ type: 'success', msg: `Confirmed payment for \${item.asset}` });
      await loadPending();
    } catch (e) {
      setNotification({ type: 'error', msg: e.message || 'Failed to confirm payment' });
    } finally {
      setProcessId(null);
    }
  };

  const handleContinuePayment = (item) => {
    setDate(new Date().toISOString().slice(0, 10));
    setPaidTo(item.asset || '');
    setAmount(String(item.amount));
    setAmountWords(`\${item.amount.toLocaleString('en-US')} ETB Only`);
    setDescription(`\${item.source}: \${item.type || item.description} — \${item.asset}`);
    setReferenceNo(item.isFuel ? `FS-\${String(item.rawId).padStart(4, '0')}` : `MNT-\${String(item.rawId).padStart(4, '0')}`);
    setPaymentMethod('Cash');
    setBankName(''); setAccountHolder(''); setAccountNumber(''); setChequeNo('');
    setTelebirrNumber(''); setTelebirrName('');
    setPreparedBy(''); setCheckedBy(''); setReceiverName('');
    setPreparedSig(null); setCheckedSig(null); setReceiverSig(null);
    setSubmitted(null); setError(null); setNotification(null);
    setMaintSource({ rawId: item.rawId, asset: item.asset, description: item.description, amount: item.amount, isFuel: item.isFuel });
    setActiveTab('pv');
  };

  const handleAmountChange = (e) => {
    setAmount(e.target.value);
    const v = parseFloat(e.target.value);
    setAmountWords(isNaN(v) ? '' : `\${v.toLocaleString('en-US')} ETB Only`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null); setNotification(null);
    setLoading(true);
    try {
      const payload = {
        date, paidTo, amount: parseFloat(amount),
        paymentMethod, description, referenceNo,
        bankDetails:     paymentMethod === 'Bank'     ? { bankName, accountHolder, accountNumber, chequeNo } : null,
        telebirrDetails: paymentMethod === 'Telebirr' ? { telebirrNumber, fullName: telebirrName }          : null,
        preparedBy, checkedBy, receiverName,
        preparedSignature: preparedSig, checkedSignature:  checkedSig, receiverSignature: receiverSig,
      };

      let pvNumber;
      if (maintSource) {
        if (maintSource.isFuel) {
          const res = await api.patch(`/car-renting/fuel-service/\${maintSource.rawId}/finance-pay`, payload);
          pvNumber = res.data?.data?.pvNumber || res.data?.pvNumber || `PV-FS-\${maintSource.rawId}`;
        } else {
          const res = await api.patch(`/car-renting/maintenance/\${maintSource.rawId}/finance-pay`, payload);
          pvNumber = res.data?.data?.pvNumber || res.data?.pvNumber || `PV-MNT-\${maintSource.rawId}`;
        }
        setMaintSource(null);
        loadPending();
      } else {
        const res = await api.post('/finance-cash/pv', payload);
        pvNumber = res.data?.data?.pvNumber;
      }
      setSubmitted({ pvNumber, ...payload, amountWords });
    } catch (err) {
      setNotification({ type: 'error', msg: err.message || 'Failed to generate Payment Voucher' });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSubmitted(null); setMaintSource(null); setNotification(null);
    setAmount(''); setAmountWords(''); setReferenceNo('');
    setPaidTo(''); setDescription('');
    setBankName(''); setAccountHolder(''); setAccountNumber(''); setChequeNo('');
    setTelebirrNumber(''); setTelebirrName('');
    setPreparedBy(''); setCheckedBy(''); setReceiverName('');
    setPreparedSig(null); setCheckedSig(null); setReceiverSig(null);
  };

  const statusConfig = {
    PENDING_FINANCE: { bg: '#FFF3E0', color: '#FF9800', label: 'CEO Confirmed — Awaiting Finance' },
    FINANCE_READY:   { bg: '#A5D6A7', color: '#1B5E20', label: 'Finance Ready — Payment Set' },
  };

  /* ─── SUCCESS SCREEN ─── */
  if (submitted) {
    return (
      <div className="pv-wrapper">
        <style>{styles}</style>
        <div className="no-print card-container" style={{ maxWidth: 600, margin: '40px auto', padding: 40, textAlign: 'center', borderColor: '#228B22' }}>
          <div style={{ width: 80, height: 80, background: '#4CAF50', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', borderRadius: 0 }}>
            <CheckCircle size={48} color="#FFFFFF" />
          </div>
          <h2 style={{ margin: '0 0 10px', fontSize: 24, fontWeight: 800, color: '#1B5E20' }}>Payment Voucher Generated!</h2>
          {submitted.pvNumber && (
            <div style={{ fontSize: 16, color: '#424242', marginBottom: 12, fontWeight: 700 }}>
              PV Number: <span style={{ color: '#228B22' }}>{submitted.pvNumber}</span>
            </div>
          )}
          <div style={{ fontSize: 16, color: '#424242', marginBottom: 30, background: '#F5F5F5', padding: 16, border: '2px solid #8D6E63' }}>
            <div style={{ color: '#1B5E20', fontSize: 28, fontWeight: 900, marginBottom: 8 }}>ETB {parseFloat(submitted.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
            Paid to <strong>{submitted.paidTo}</strong>
          </div>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
            <button className="btn-primary" onClick={() => window.print()} style={{ padding: '14px 28px', fontSize: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
              <Printer size={20} /> Print PV
            </button>
            <button className="btn-primary" onClick={resetForm} style={{ padding: '14px 28px', fontSize: 16, background: '#6B8E23' }}>
              New PV
            </button>
          </div>
        </div>

        {/* Print-only PV document */}
        <div className="print-only" style={{ maxWidth: 720, margin: '0 auto', fontFamily: 'Arial, sans-serif', padding: 20 }}>
          <div style={{ textAlign: 'center', borderBottom: '3px solid #1B5E20', paddingBottom: 12, marginBottom: 16 }}>
            <h2 style={{ margin: 0, fontSize: 24, fontWeight: 900, color: '#1B5E20' }}>SUTANA TRADING</h2>
            <h3 style={{ margin: '6px 0 0', fontSize: 18, fontWeight: 700, color: '#424242' }}>PAYMENT VOUCHER</h3>
            {submitted.pvNumber && <div style={{ fontSize: 14, marginTop: 4, fontWeight: 700 }}>PV No: {submitted.pvNumber}</div>}
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16 }}>
            <tbody>
              <tr>
                <td style={{ padding: '8px 0', width: '30%', fontWeight: 700, fontSize: 14 }}>Date:</td>
                <td style={{ padding: '8px 8px', fontSize: 14 }}>{submitted.date}</td>
                <td style={{ padding: '8px 0', width: '30%', fontWeight: 700, fontSize: 14 }}>Reference #:</td>
                <td style={{ padding: '8px 8px', fontSize: 14 }}>{submitted.referenceNo || '—'}</td>
              </tr>
              <tr>
                <td style={{ padding: '8px 0', fontWeight: 700, fontSize: 14 }}>Paid To:</td>
                <td colSpan={3} style={{ padding: '8px 8px', fontSize: 14, fontWeight: 700 }}>{submitted.paidTo}</td>
              </tr>
              <tr>
                <td style={{ padding: '8px 0', fontWeight: 700, fontSize: 14 }}>Amount (ETB):</td>
                <td style={{ padding: '8px 8px', fontSize: 18, fontWeight: 900 }}>{parseFloat(submitted.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                <td style={{ padding: '8px 0', fontWeight: 700, fontSize: 14 }}>In Words:</td>
                <td style={{ padding: '8px 8px', fontSize: 14, fontStyle: 'italic' }}>{submitted.amountWords}</td>
              </tr>
              <tr>
                <td style={{ padding: '8px 0', fontWeight: 700, fontSize: 14 }}>Description:</td>
                <td colSpan={3} style={{ padding: '8px 8px', fontSize: 14 }}>{submitted.description}</td>
              </tr>
              <tr>
                <td style={{ padding: '8px 0', fontWeight: 700, fontSize: 14 }}>Payment Method:</td>
                <td colSpan={3} style={{ padding: '8px 8px', fontSize: 14 }}>{submitted.paymentMethod}</td>
              </tr>
            </tbody>
          </table>
          {submitted.paymentMethod === 'Bank' && submitted.bankDetails && (
            <div style={{ border: '2px solid #424242', padding: 12, borderRadius: 0, marginBottom: 16, fontSize: 14 }}>
              <b>Bank Transfer Details</b> — Bank: {submitted.bankDetails.bankName} | A/C Holder: {submitted.bankDetails.accountHolder} | A/C #: {submitted.bankDetails.accountNumber} {submitted.bankDetails.chequeNo ? `| Cheque: \${submitted.bankDetails.chequeNo}` : ''}
            </div>
          )}
          {submitted.paymentMethod === 'Telebirr' && submitted.telebirrDetails && (
            <div style={{ border: '2px solid #424242', padding: 12, borderRadius: 0, marginBottom: 16, fontSize: 14 }}>
              <b>Telebirr Details</b> — Mobile: {submitted.telebirrDetails.telebirrNumber} | Name: {submitted.telebirrDetails.fullName}
            </div>
          )}
          {submitted.paymentMethod === 'Cash' && (
            <div style={{ border: '2px solid #424242', padding: 12, borderRadius: 0, marginBottom: 16, fontSize: 14, textAlign: 'center', fontWeight: 700 }}>
              By Cash
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 60 }}>
            <PrintSigBlock label="Prepared By" name={submitted.preparedBy} sigImage={submitted.preparedSignature} />
            <PrintSigBlock label="Checked By" name={submitted.checkedBy} sigImage={submitted.checkedSignature} />
            <PrintSigBlock label="Payee's Signature" name={submitted.receiverName} sigImage={submitted.receiverSignature} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pv-wrapper">
      <style>{styles}</style>
      
      {/* ── Notification Banner (replaces alerts) ── */}
      {notification && (
        <div style={{ width: '100%', background: notification.type === 'error' ? '#F44336' : '#4CAF50', color: '#FFFFFF', padding: '16px 24px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12, fontWeight: 700, border: '2px solid #1B5E20' }}>
          <AlertCircle size={20} />
          {notification.msg}
          <button onClick={() => setNotification(null)} style={{ marginLeft: 'auto', background: 'transparent', border: 'none', color: '#FFFFFF', cursor: 'pointer', fontWeight: 900 }}>✕</button>
        </div>
      )}

      <div className="pv-container">
        
        {/* Header Tabs */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 24, width: '100%' }}>
          <button className={`btn-tab \${activeTab === 'pv' ? 'active' : 'inactive'}`} onClick={() => setActiveTab('pv')} style={{ flex: 1, padding: '16px', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            <FileText size={20} /> Payment Voucher (PV)
          </button>
          <button className={`btn-tab \${activeTab === 'pending' ? 'active' : 'inactive'}`} onClick={() => setActiveTab('pending')} style={{ flex: 1, padding: '16px', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            <Clock size={20} /> Pending Payment
            {pendingCount > 0 && (
              <span style={{ background: activeTab === 'pending' ? '#FFFFFF' : '#FF9800', color: activeTab === 'pending' ? '#FF9800' : '#FFFFFF', padding: '2px 8px', fontSize: 14, fontWeight: 900, border: '2px solid #8D6E63' }}>
                {pendingCount}
              </span>
            )}
          </button>
        </div>

        {/* ══ PENDING PAYMENT TAB ══ */}
        {activeTab === 'pending' && (
          <div className="card-container">
            <div style={{ padding: '20px 24px', background: '#A5D6A7', borderBottom: '2px solid #8D6E63', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#1B5E20', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Clock size={20} /> Pending Payments
                </h2>
                <p style={{ margin: '4px 0 0', fontSize: 14, color: '#424242', fontWeight: 600 }}>CEO-approved requests awaiting Finance confirmation & payment.</p>
              </div>
              <button className="btn-primary" onClick={loadPending} style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <RefreshCw size={16} /> Refresh
              </button>
            </div>

            {pendingLoad ? (
              <div style={{ padding: 60, textAlign: 'center', color: '#1B5E20', fontWeight: 700 }}>
                <SegmentedSpinner size={32} />
                Loading pending payments...
              </div>
            ) : pendingList.length === 0 ? (
              <div style={{ padding: 60, textAlign: 'center', color: '#1B5E20' }}>
                <CheckCircle size={48} style={{ color: '#4CAF50', margin: '0 auto 16px', display: 'block' }} />
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>No pending payments</h3>
                <p style={{ margin: '8px 0 0', fontSize: 14, fontWeight: 600 }}>All CEO-approved payments have been processed.</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto', width: '100%' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead style={{ background: '#2E8B57', color: '#FFFFFF' }}>
                    <tr>
                      <th style={{ padding: '16px', fontWeight: 800, fontSize: 13, borderBottom: '2px solid #8D6E63' }}>SOURCE</th>
                      <th style={{ padding: '16px', fontWeight: 800, fontSize: 13, borderBottom: '2px solid #8D6E63' }}>ASSET / DESCRIPTION</th>
                      <th style={{ padding: '16px', fontWeight: 800, fontSize: 13, borderBottom: '2px solid #8D6E63', textAlign: 'right' }}>AMOUNT (ETB)</th>
                      <th style={{ padding: '16px', fontWeight: 800, fontSize: 13, borderBottom: '2px solid #8D6E63', textAlign: 'center' }}>STATUS</th>
                      <th style={{ padding: '16px', fontWeight: 800, fontSize: 13, borderBottom: '2px solid #8D6E63', textAlign: 'center' }}>ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingList.map((item, idx) => {
                      const sc = statusConfig[item.status] || { bg: '#F5F5F5', color: '#424242', label: item.status };
                      return (
                        <tr key={item.id} className="table-row" style={{ background: idx % 2 === 0 ? '#FFFFFF' : '#F5F5F5', borderBottom: '1px solid #8D6E63' }}>
                          <td style={{ padding: '16px' }}>
                            <span style={{ background: '#6B8E23', color: '#FFFFFF', padding: '4px 8px', fontSize: 12, fontWeight: 700, border: '1px solid #1B5E20' }}>
                              {item.source}
                            </span>
                          </td>
                          <td style={{ padding: '16px' }}>
                            <div style={{ fontWeight: 800, color: '#1B5E20', fontSize: 15 }}>{item.asset || '—'}</div>
                            <div style={{ fontSize: 13, color: '#424242', marginTop: 4, fontWeight: 600 }}>{item.description}</div>
                          </td>
                          <td style={{ padding: '16px', textAlign: 'right', fontWeight: 900, color: '#1B5E20', fontSize: 18 }}>
                            {item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td style={{ padding: '16px', textAlign: 'center' }}>
                            <span style={{ background: sc.bg, color: sc.color, padding: '6px 12px', fontSize: 12, fontWeight: 800, border: `1px solid \${sc.color}` }}>
                              {sc.label}
                            </span>
                          </td>
                          <td style={{ padding: '16px', textAlign: 'center' }}>
                            {item.status === 'PENDING_FINANCE' && (
                              <button className="btn-primary" onClick={() => handleConfirm(item)} disabled={processId === item.id} style={{ padding: '10px 16px', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6, background: '#FF9800' }}>
                                {processId === item.id ? <SegmentedSpinner size={14} /> : <CheckCircle size={14} />}
                                Confirm Payment
                              </button>
                            )}
                            {item.status === 'FINANCE_READY' && (
                              <button className="btn-primary" onClick={() => handleContinuePayment(item)} style={{ padding: '10px 16px', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                <Banknote size={14} /> Continue →
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
        )}

        {/* ══ PV FORM TAB ══ */}
        {activeTab === 'pv' && (
          <form onSubmit={handleSubmit} style={{ width: '100%' }}>
            {maintSource && (
              <div style={{ background: '#A5D6A7', border: '2px solid #1B5E20', padding: '16px 24px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12, fontWeight: 700, color: '#1B5E20' }}>
                <CheckCircle size={24} />
                PV pre-filled for <strong>{maintSource.asset}</strong>. Complete form and generate.
                <button type="button" onClick={() => { setMaintSource(null); resetForm(); }} style={{ marginLeft: 'auto', background: '#F44336', color: '#FFFFFF', border: 'none', padding: '8px 16px', fontWeight: 800, cursor: 'pointer' }}>Clear</button>
              </div>
            )}

            {/* General Information */}
            <div className="card-container" style={{ padding: 32 }}>
              <h3 className="section-title"><User size={20} /> General Information</h3>
              <div className="grid-2" style={{ marginBottom: 20 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 800, color: '#1B5E20', marginBottom: 8 }}>Date Paid *</label>
                  <input className="form-input" required type="date" value={date} onChange={e => setDate(e.target.value)} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 800, color: '#1B5E20', marginBottom: 8 }}>Paid To *</label>
                  <input className="form-input" required value={paidTo} onChange={e => setPaidTo(e.target.value)} placeholder="Supplier / Employee / Vendor" />
                </div>
              </div>
              <div className="grid-2" style={{ marginBottom: 20 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 800, color: '#1B5E20', marginBottom: 8 }}>Amount (ETB) *</label>
                  <input className="form-input" required type="number" step="0.01" value={amount} onChange={handleAmountChange} placeholder="0.00" style={{ fontSize: 16, fontWeight: 800, color: '#1B5E20' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 800, color: '#1B5E20', marginBottom: 8 }}>Amount in Words</label>
                  <input className="form-input" readOnly value={amountWords} placeholder="Auto-filled" style={{ background: '#F5F5F5', fontStyle: 'italic' }} />
                </div>
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 800, color: '#1B5E20', marginBottom: 8 }}>Description *</label>
                <input className="form-input" required value={description} onChange={e => setDescription(e.target.value)} placeholder="Reason for payment" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 800, color: '#1B5E20', marginBottom: 8 }}>Reference # (Optional)</label>
                <input className="form-input" value={referenceNo} onChange={e => setReferenceNo(e.target.value)} placeholder="Bill #, Order ID" />
              </div>
            </div>

            {/* Payment Method */}
            <div className="card-container" style={{ padding: 32 }}>
              <h3 className="section-title"><Banknote size={20} /> Payment Method</h3>
              <div className="grid-3" style={{ marginBottom: paymentMethod !== 'Cash' ? 24 : 0 }}>
                {[{ type: 'Cash', icon: Banknote }, { type: 'Bank', icon: Building }, { type: 'Telebirr', icon: Smartphone }].map(({ type, icon: Icon }) => (
                  <div key={type} onClick={() => setPaymentMethod(type)} style={{
                    padding: 20, border: '2px solid #8D6E63', cursor: 'pointer', fontWeight: 800, fontSize: 16,
                    background: paymentMethod === type ? '#228B22' : '#FFFFFF',
                    color: paymentMethod === type ? '#FFFFFF' : '#424242',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, transition: 'all 0.2s'
                  }}>
                    <Icon size={32} /> {type}
                  </div>
                ))}
              </div>

              {paymentMethod === 'Bank' && (
                <div style={{ background: '#A5D6A7', padding: 24, border: '2px solid #1B5E20' }}>
                  <h4 style={{ margin: '0 0 16px', fontSize: 15, color: '#1B5E20', fontWeight: 800 }}>Bank Details</h4>
                  <div className="grid-2">
                    <input className="form-input" required value={bankName} onChange={e => setBankName(e.target.value)} placeholder="Bank Name *" />
                    <input className="form-input" required value={accountHolder} onChange={e => setAccountHolder(e.target.value)} placeholder="Account Holder *" />
                    <input className="form-input" required value={accountNumber} onChange={e => setAccountNumber(e.target.value)} placeholder="Account Number *" />
                    <input className="form-input" value={chequeNo} onChange={e => setChequeNo(e.target.value)} placeholder="Cheque # (Optional)" />
                  </div>
                </div>
              )}

              {paymentMethod === 'Telebirr' && (
                <div style={{ background: '#A5D6A7', padding: 24, border: '2px solid #1B5E20' }}>
                  <h4 style={{ margin: '0 0 16px', fontSize: 15, color: '#1B5E20', fontWeight: 800 }}>Telebirr Details</h4>
                  <div className="grid-2">
                    <input className="form-input" required value={telebirrNumber} onChange={e => setTelebirrNumber(e.target.value)} placeholder="Mobile Number *" />
                    <input className="form-input" required value={telebirrName} onChange={e => setTelebirrName(e.target.value)} placeholder="Full Name *" />
                  </div>
                </div>
              )}
            </div>

            {/* Signatures */}
            <div className="card-container" style={{ padding: 32 }}>
              <h3 className="section-title"><PenTool size={20} /> Signatures</h3>
              <div className="grid-3">
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 800, color: '#1B5E20', marginBottom: 8 }}>Prepared By (Name) *</label>
                  <input className="form-input" required value={preparedBy} onChange={e => setPreparedBy(e.target.value)} placeholder="Accountant Name" style={{ marginBottom: 12 }} />
                  <SigPad label="Prepared By" onSave={setPreparedSig} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 800, color: '#1B5E20', marginBottom: 8 }}>Checked By (Name) *</label>
                  <input className="form-input" required value={checkedBy} onChange={e => setCheckedBy(e.target.value)} placeholder="Manager Name" style={{ marginBottom: 12 }} />
                  <SigPad label="Checked By" onSave={setCheckedSig} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 800, color: '#1B5E20', marginBottom: 8 }}>Payee's Name *</label>
                  <input className="form-input" required value={receiverName} onChange={e => setReceiverName(e.target.value)} placeholder="Payee Name" style={{ marginBottom: 12 }} />
                  <SigPad label="Payee" onSave={setReceiverSig} />
                </div>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary" style={{
              width: '100%', padding: '20px', fontSize: 18,
              background: loading ? '#9E9E9E' : '#228B22',
              display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12,
              marginTop: 16
            }}>
              {loading ? <SegmentedSpinner size={24} /> : <CheckCircle size={24} />}
              {loading ? 'Processing...' : maintSource ? `Generate PV & Release Payment for \${maintSource.asset}` : 'Generate Payment Voucher'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default FinancePV;
