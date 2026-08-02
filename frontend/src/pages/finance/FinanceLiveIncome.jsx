import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  TrendingUp, CheckCircle, Printer, DollarSign, User, FileText,
  Banknote, Building, Smartphone, Calendar, RefreshCw, PenTool,
  Trash2, List, ArrowLeft, Eye, AlertTriangle, XCircle, ShoppingCart,
  Package, Phone, CreditCard, Hash, Clock, ChevronRight, Car
} from 'lucide-react';
import api from '../../services/apiClient';
import { useAuth } from '../../hooks/useAuth';

/* ─── Global Styles ──────────────────────────────────────────────── */
const G = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap');
  * { box-sizing: border-box; }
  .fli-page { font-family: 'Inter', sans-serif; background: #F5F5F5; min-height: 100vh; width: 100%; padding: 24px; }
  .fli-btn { border-radius: 0 !important; font-family: 'Inter', sans-serif; cursor: pointer; font-weight: 700; transition: background 0.18s, opacity 0.18s; border: none; }
  .fli-btn-primary { background: #228B22; color: #FFFFFF; padding: 12px 24px; font-size: 14px; }
  .fli-btn-primary:hover:not(:disabled) { background: #1B5E20; }
  .fli-btn-primary:disabled { background: #A5D6A7; color: #6B8E23; cursor: not-allowed; opacity: 0.7; }
  .fli-btn-outline { background: white; color: #1B5E20; border: 2px solid #228B22 !important; padding: 10px 20px; font-size: 13px; }
  .fli-btn-outline:hover { background: #E8F5E9; }
  .fli-btn-danger { background: white; color: #F44336; border: 2px solid #F44336 !important; padding: 10px 20px; font-size: 14px; }
  .fli-btn-danger:hover { background: #FFEBEE; }
  .fli-btn-secondary { background: #F5F5F5; color: #424242; border: 1px solid #8D6E63 !important; padding: 10px 18px; font-size: 13px; }
  .fli-btn-secondary:hover { background: #E8F5E9; }
  .fli-card { background: white; border: 1px solid #A5D6A7; margin-bottom: 20px; }
  .fli-card-header { padding: 18px 24px; border-bottom: 2px solid #A5D6A7; background: linear-gradient(90deg, #1B5E20, #228B22); display: flex; align-items: center; justify-content: space-between; }
  .fli-card-header h3 { margin: 0; font-size: 15px; font-weight: 700; color: white; display: flex; align-items: center; gap: 8px; }
  .fli-card-body { padding: 24px; }
  .fli-input { width: 100%; padding: 11px 14px; border: 2px solid #A5D6A7; border-radius: 0; outline: none; font-size: 14px; font-family: 'Inter', sans-serif; background: white; color: #424242; transition: border-color 0.2s; }
  .fli-input:focus { border-color: #228B22; }
  .fli-input:read-only { background: #F5F5F5; color: #424242; border-color: #A5D6A7; }
  .fli-label { display: block; font-size: 11px; font-weight: 700; color: #424242; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; }
  .fli-row-hover:hover { background: #E8F5E9 !important; }
  .fli-tab-btn { padding: 10px 20px; border: none; background: transparent; font-weight: 700; font-size: 13px; cursor: pointer; color: #424242; border-bottom: 3px solid transparent; }
  .fli-tab-btn.active { color: #228B22; border-bottom-color: #228B22; background: white; }
  .fli-stat-card { background: white; border: 1px solid #A5D6A7; padding: 18px 20px; }
  .fli-badge { display: inline-block; padding: 3px 10px; font-size: 11px; font-weight: 700; border-radius: 0; }
  .fli-spinner { width: 24px; height: 24px; border: 3px solid #A5D6A7; border-top-color: #228B22; border-radius: 50%; animation: fliSpin 0.9s linear infinite; display: inline-block; }
  @keyframes fliSpin { to { transform: rotate(360deg); } }
  @media (max-width: 768px) {
    .fli-page { padding: 12px; }
    .fli-grid-2 { grid-template-columns: 1fr !important; }
    .fli-grid-3 { grid-template-columns: 1fr !important; }
    .fli-grid-4 { grid-template-columns: 1fr 1fr !important; }
    .fli-header-row { flex-direction: column; gap: 12px; align-items: flex-start !important; }
    .fli-stat-row { grid-template-columns: 1fr 1fr !important; }
    .fli-table-wrap { overflow-x: auto; }
  }
`;

/* ─── helpers ─────────────────────────────────────────────────────── */
const fmt = (n) => parseFloat(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtDate = (d) => d ? new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
const fmtDay = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }) : '—';

const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  const base = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1').replace('/api/v1', '');
  return `${base}/${path.replace(/^\//, '')}`;
};

const CASH_DEPTS = ['Pharmacy', 'Sales', 'Retail'];
const DEPARTMENTS = ['Sales', 'Retail Sales', 'Pharmacy', 'Retail', 'Printing', 'Car Rental', 'Agrirent', 'Tender', 'Other'];

/* ─── In-App Toast Notification ─────────────────────────────────── */
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);
  const bg = type === 'success' ? '#228B22' : type === 'error' ? '#F44336' : '#FF9800';
  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, background: bg, color: 'white',
      padding: '14px 20px', fontWeight: 700, fontSize: 14, zIndex: 99999,
      display: 'flex', alignItems: 'center', gap: 10, minWidth: 280,
      boxShadow: '0 4px 20px rgba(0,0,0,0.25)', borderLeft: '4px solid rgba(255,255,255,0.4)'
    }}>
      {type === 'success' ? <CheckCircle size={16} /> : type === 'error' ? <XCircle size={16} /> : <AlertTriangle size={16} />}
      {message}
      <button onClick={onClose} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: '0 4px', fontSize: 16 }}>✕</button>
    </div>
  );
};

const useToast = () => {
  const [toasts, setToasts] = useState([]);
  const show = useCallback((msg, type = 'info') => {
    const id = Date.now();
    setToasts(p => [...p, { id, msg, type }]);
  }, []);
  const remove = useCallback((id) => setToasts(p => p.filter(t => t.id !== id)), []);
  const Toasts = () => (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 99999, display: 'flex', flexDirection: 'column', gap: 10 }}>
      {toasts.map(t => <Toast key={t.id} message={t.msg} type={t.type} onClose={() => remove(t.id)} />)}
    </div>
  );
  return { show, Toasts };
};

/* ─── Canvas Signature Pad ───────────────────────────────────────── */
const SigPad = ({ label, onSave }) => {
  const canvasRef = useRef(null);
  const isDrawing = useRef(false);
  const lastPos = useRef(null);
  const [saved, setSaved] = useState(false);
  const [isEmpty, setIsEmpty] = useState(true);

  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if (e.touches) return { x: (e.touches[0].clientX - rect.left) * scaleX, y: (e.touches[0].clientY - rect.top) * scaleY };
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  };

  const startDraw = useCallback((e) => {
    e.preventDefault(); isDrawing.current = true;
    lastPos.current = getPos(e, canvasRef.current); setSaved(false);
  }, []);

  const draw = useCallback((e) => {
    e.preventDefault(); if (!isDrawing.current) return;
    const canvas = canvasRef.current; const ctx = canvas.getContext('2d');
    const pos = getPos(e, canvas);
    ctx.beginPath(); ctx.moveTo(lastPos.current.x, lastPos.current.y); ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = '#228B22'; ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke();
    lastPos.current = pos; setIsEmpty(false);
  }, []);

  const stopDraw = useCallback(() => {
    isDrawing.current = false;
    lastPos.current = null;
    if (canvasRef.current && !isEmpty) {
      onSave(canvasRef.current.toDataURL('image/png'));
      setSaved(true);
    }
  }, [onSave, isEmpty]);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    canvas.addEventListener('touchstart', startDraw, { passive: false });
    canvas.addEventListener('touchmove', draw, { passive: false });
    canvas.addEventListener('touchend', stopDraw, { passive: false });
    return () => { canvas.removeEventListener('touchstart', startDraw); canvas.removeEventListener('touchmove', draw); canvas.removeEventListener('touchend', stopDraw); };
  }, [startDraw, draw, stopDraw]);

  const handleClear = () => {
    const ctx = canvasRef.current.getContext('2d');
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    setIsEmpty(true); setSaved(false); onSave(null);
  };

  return (
    <div style={{ border: `2px solid ${saved ? '#4CAF50' : '#A5D6A7'}`, overflow: 'hidden', background: 'white', transition: 'border-color .2s' }}>
      <canvas ref={canvasRef} width={300} height={120}
        onMouseDown={startDraw} onMouseMove={draw} onMouseUp={stopDraw} onMouseLeave={stopDraw}
        style={{ width: '100%', height: 120, display: 'block', cursor: 'crosshair', background: isEmpty ? '#FAFAFA' : 'white', touchAction: 'none' }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', background: '#F5F5F5', borderTop: '1px solid #A5D6A7' }}>
        <span style={{ fontSize: 10, color: saved ? '#228B22' : '#6B8E23', fontWeight: 600 }}>{isEmpty ? 'Draw signature' : saved ? '✓ Saved' : 'Unsaved'}</span>
        <button type="button" onClick={handleClear} style={{ fontSize: 10, padding: '3px 8px', border: '1px solid #fecaca', background: '#FFEBEE', cursor: 'pointer', color: '#F44336', fontWeight: 700 }}>Clear</button>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════ */
/*  DETAIL VIEW                                                        */
/* ═══════════════════════════════════════════════════════════════════ */
const DetailView = ({ submissionId, onBack, onApproved }) => {
  const { user } = useAuth();
  const { show, Toasts } = useToast();
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);
  const [error, setError] = useState(null);
  const [cashInput, setCashInput] = useState('');
  const [approving, setApproving] = useState(false);
  const [mismatch, setMismatch] = useState(null);
  const [approved, setApproved] = useState(false);
  const [financeName, setFinanceName] = useState(user?.fullName || user?.name || '');
  const [financeSignature, setFinanceSignature] = useState(null);
  const [verifyChecks, setVerifyChecks] = useState({ bankChecked: false, telebirrChecked: false, confirmedInPerson: false });
  const [rejecting, setRejecting] = useState(false);
  const [rejectModal, setRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const printRef = useRef(null);

  const loadDetail = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await api.get(`/finance-receivables/live-income/${submissionId}/detail`);
      setDetail(res.data);
      if (res.data?.systemTotal) setCashInput(res.data.systemTotal.toString());
    } catch (e) {
      setError(e.message || 'Failed to load detail');
    } finally {
      setLoading(false);
    }
  }, [submissionId]);

  useEffect(() => { loadDetail(); }, [loadDetail]);

  const handleApprove = async () => {
    setMismatch(null);
    if (!cashInput && cashInput !== 0) { show('Please enter the physical cash count before approving.', 'error'); return; }
    if (!financeName || !financeSignature) { show('Finance Officer name and signature are required.', 'error'); return; }
    setApproving(true); setError(null);
    try {
      const res = await api.put(`/finance-receivables/live-income/${submissionId}/approve`, {
        cash_count: parseFloat(cashInput),
        finance_name: financeName,
        finance_signature: financeSignature
      });
      if (res.success) {
        show('Income approved and recorded!', 'success');
        setApproved(true);
        setTimeout(() => { onApproved(); }, 2000);
      }
    } catch (e) {
      const msg = e.message || '';
      if (msg.includes('mismatch') || msg.toLowerCase().includes('difference')) {
        const fresh = detail?.systemTotal || 0;
        setMismatch({ systemTotal: fresh, cashCount: parseFloat(cashInput), difference: parseFloat(cashInput) - fresh });
      }
      show(msg || 'Approval failed', 'error');
      setError(msg);
    } finally {
      setApproving(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) return;
    setRejecting(true);
    try {
      await api.put(`/finance-receivables/live-income/${submissionId}/reject`, { reason: rejectReason.trim() });
      setRejectModal(false); setRejectReason('');
      show('Submission rejected.', 'info');
      setTimeout(() => { onApproved(); }, 1200);
    } catch (e) {
      show(e.message || 'Failed to reject submission', 'error');
    } finally {
      setRejecting(false);
    }
  };

  const handlePrint = () => {
    if (!printRef.current) return;
    const w = window.open('', '_blank');
    w.document.write(`<html><head><title>Income Detail</title>
      <style>
        @page { margin: 15mm; size: A4; }
        body { font-family: 'Times New Roman', serif; color: #000; margin: 0; }
        table { width: 100%; border-collapse: collapse; font-size: 12px; }
        th { background: #F5F5F5; border: 1px solid #ccc; padding: 7px 10px; font-size: 11px; text-align: left; }
        td { border: 1px solid #ddd; padding: 7px 10px; }
      </style></head><body>${printRef.current.innerHTML}</body></html>`);
    w.document.close();
    setTimeout(() => w.print(), 300);
  };

  /* Loading */
  if (loading) return (
    <div className="fli-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
      <style>{G}</style>
      <div className="fli-spinner" />
      <p style={{ color: '#6B8E23', fontWeight: 600 }}>Loading transactions...</p>
    </div>
  );

  /* Approved confirmation */
  if (approved) return (
    <div className="fli-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
      <style>{G}</style>
      <div style={{ width: 72, height: 72, background: '#E8F5E9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CheckCircle size={40} color="#228B22" />
      </div>
      <h2 style={{ color: '#1B5E20', margin: 0 }}>Approved &amp; Recorded!</h2>
      <p style={{ color: '#424242' }}>Income recorded in the Receivables Book. Redirecting...</p>
    </div>
  );

  if (!detail) return <div className="fli-page"><style>{G}</style><p style={{ color: '#F44336' }}>{error || 'No data.'}</p></div>;

  const { submission, transactions, systemTotal, transactionCount } = detail;
  let manualDetails = null;
  if (submission.manual_details) {
    try { manualDetails = JSON.parse(submission.manual_details); } catch (e) {}
  }

  const runningTotal = transactions.reduce((acc, t) => {
    acc.push((acc.length ? acc[acc.length - 1] : 0) + parseFloat(t.total_amount || 0));
    return acc;
  }, []);

  const cashVal = parseFloat(cashInput || 0);
  const diff = cashVal - systemTotal;
  const matched = cashInput !== '' && Math.abs(diff) <= 0.01;
  const over = cashInput !== '' && diff > 0.01;
  const short = cashInput !== '' && diff < -0.01;

  const isCashDept = CASH_DEPTS.some(d => (submission.department || '').toLowerCase().includes(d.toLowerCase()));
  const proofUrl = getImageUrl(manualDetails?.proofImagePath || manualDetails?.payment_screenshot);
  const payMethod = (manualDetails?.paymentMethod || '').toLowerCase().trim();
  const isCBE = payMethod === 'cbe bank' || payMethod === 'cbe';
  const isTelebirr = payMethod === 'telebirr' || payMethod.includes('telebirr');
  const isAwash = payMethod.includes('awash');
  const isCash = payMethod === 'cash';
  const anyCheckDone = verifyChecks.bankChecked || verifyChecks.telebirrChecked || verifyChecks.confirmedInPerson;
  const readyToVerify = anyCheckDone && financeName && financeSignature && submission.status === 'Pending';

  return (
    <div className="fli-page">
      <style>{G}</style>
      <Toasts />

      {/* Reject Modal */}
      {rejectModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', padding: '32px 36px', maxWidth: 440, width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
            <h3 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 800, color: '#F44336', borderBottom: '2px solid #F44336', paddingBottom: 8 }}>Reject Submission</h3>
            <p style={{ fontSize: 13, color: '#424242', margin: '12px 0 16px' }}>Provide a clear reason so the submitter can correct and resubmit.</p>
            <textarea
              autoFocus
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="e.g. Screenshot unclear, amount mismatch..."
              rows={4}
              className="fli-input"
              style={{ resize: 'vertical' }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
              <button className="fli-btn fli-btn-secondary" onClick={() => { setRejectModal(false); setRejectReason(''); }}>Cancel</button>
              <button
                className="fli-btn fli-btn-danger"
                onClick={handleReject}
                disabled={!rejectReason.trim() || rejecting}
                style={{ background: '#F44336', color: 'white', borderColor: '#F44336', opacity: !rejectReason.trim() ? 0.5 : 1 }}
              >{rejecting ? 'Rejecting...' : 'Confirm Rejection'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }} className="fli-header-row">
        <button className="fli-btn fli-btn-secondary" onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <ArrowLeft size={15} /> Back to List
        </button>
        <button className="fli-btn fli-btn-primary" onClick={handlePrint} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <Printer size={14} /> Print Detail
        </button>
      </div>

      {/* PRINTABLE CONTENT */}
      <div ref={printRef}>

        {/* Letter Header Card */}
        <div className="fli-card">
          <div style={{ padding: '28px 32px', borderBottom: '3px solid #1B5E20', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', background: 'linear-gradient(90deg, #1B5E20, #228B22)' }}>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 900, color: 'white', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '-0.5px' }}>Sutana Enterprise</h1>
              <p style={{ margin: 0, color: '#A5D6A7', fontSize: 13 }}>Integrated Business Management System</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: 'monospace', fontSize: 18, fontWeight: 900, color: '#98FF98', letterSpacing: 2 }}>{submission.reference_no || `INC-${submission.id}`}</div>
              <div style={{ fontSize: 12, color: '#A5D6A7', marginTop: 4 }}>INCOME VERIFICATION</div>
            </div>
          </div>

          <div style={{ padding: '24px 32px' }}>
            <p style={{ textAlign: 'center', fontWeight: 800, fontSize: 14, color: '#1B5E20', textTransform: 'uppercase', letterSpacing: 1.5, margin: '0 0 20px', borderBottom: '1px solid #A5D6A7', paddingBottom: 12 }}>
              DAILY INCOME SUBMISSION — RECONCILIATION RECORD
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }} className="fli-grid-3">
              {[
                { label: 'Department', value: submission.department, icon: <Building size={13} /> },
                { label: 'Submitted By', value: submission.submitted_by, icon: <User size={13} /> },
                { label: 'Submission Date', value: fmtDay(submission.created_at), icon: <Calendar size={13} /> },
                { label: 'Reference No.', value: submission.reference_no || '—', icon: <Hash size={13} /> },
                { label: 'Total Transactions', value: manualDetails ? '1 Transaction' : `${transactionCount} sale(s)`, icon: <ShoppingCart size={13} /> },
                { label: 'System Total', value: `ETB ${fmt(systemTotal)}`, icon: <DollarSign size={13} />, highlight: true },
              ].map(({ label, value, icon, highlight }) => (
                <div key={label} style={{ background: highlight ? '#1B5E20' : '#F5F5F5', padding: '14px 16px', border: `1px solid ${highlight ? '#228B22' : '#A5D6A7'}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: highlight ? '#A5D6A7' : '#6B8E23', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', marginBottom: 5 }}>
                    {icon} {label}
                  </div>
                  <div style={{ fontSize: highlight ? 17 : 14, fontWeight: 800, color: highlight ? '#98FF98' : '#1B5E20' }}>{value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Transaction Details Card */}
        <div className="fli-card">
          <div className="fli-card-header">
            <h3><FileText size={16} /> Transaction Breakdown ({manualDetails ? 1 : transactionCount} Record{manualDetails || transactionCount === 1 ? '' : 's'})</h3>
          </div>
          <div className="fli-card-body">
            {transactions.length === 0 && !manualDetails ? (
              <div style={{ padding: '30px', textAlign: 'center', background: '#F5F5F5', border: '1px solid #A5D6A7' }}>
                <h4 style={{ margin: '0 0 10px', color: '#1B5E20', fontSize: 16 }}>Summary Submission Record</h4>
                <p style={{ margin: '0 0 16px', color: '#6B8E23', fontSize: 13 }}>No individual transaction breakdown is available for this bulk entry.</p>
                <div style={{ display: 'inline-flex', flexDirection: 'column', background: 'white', border: '1px solid #A5D6A7', padding: '16px 24px', textAlign: 'left', minWidth: 300 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#424242', textTransform: 'uppercase', marginBottom: 4 }}>Submission Details</div>
                  <div style={{ fontSize: 14, color: '#1B5E20', marginBottom: 12 }}>{submission.description || 'No description provided.'}</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#424242', textTransform: 'uppercase', marginBottom: 4 }}>Total Recorded Amount</div>
                  <div style={{ fontSize: 20, fontWeight: 900, color: '#228B22' }}>ETB {fmt(submission.amount || systemTotal)}</div>
                </div>

                <div style={{ marginTop: 24, padding: '20px 24px', background: isCashDept ? '#E8F5E9' : '#FFF3E0', border: `2px solid ${isCashDept ? '#228B22' : '#FFB74D'}`, textAlign: 'left', borderRadius: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: isCashDept ? '#1B5E20' : '#E65100', textTransform: 'uppercase', marginBottom: 8 }}>Payment Method</div>
                  <div style={{ fontSize: 24, fontWeight: 900, color: isCashDept ? '#228B22' : '#F57C00' }}>
                    {isCashDept ? 'CASH' : 'DIGITAL / BANK'}
                  </div>
                  {!isCashDept && (
                    <div style={{ fontSize: 13, color: '#424242', marginTop: 8 }}>
                      No specific bank details were provided with this summary. Please verify against company bank/Telebirr statements.
                    </div>
                  )}
                </div>
              </div>
            ) : manualDetails ? (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 20 }} className="fli-grid-3">
                  {[
                    { label: 'Payment Method', value: manualDetails.paymentMethod },
                    { label: 'Received From', value: manualDetails.receivedFrom || '—' },
                    { label: 'Amount', value: `ETB ${fmt(manualDetails.amount || systemTotal)}`, highlight: true },
                  ].map(({ label, value, highlight }) => (
                    <div key={label} style={{ background: highlight ? '#E8F5E9' : '#F5F5F5', padding: 16, border: `1px solid ${highlight ? '#A5D6A7' : '#A5D6A7'}` }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#424242', textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
                      <div style={{ fontSize: 15, fontWeight: 800, color: '#1B5E20' }}>{value}</div>
                    </div>
                  ))}
                </div>

                {/* Car Rental Details */}
                {submission.department === 'Car Rental' && manualDetails.carName && (
                  <div style={{ background: '#F5F5F5', padding: 20, border: '1px solid #A5D6A7', marginBottom: 20 }}>
                    <h4 style={{ margin: '0 0 16px', fontSize: 14, color: '#1B5E20', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Car size={18} color="#228B22" /> Car Rental Order Details
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }} className="fli-grid-2">
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#6B8E23', textTransform: 'uppercase', marginBottom: 4 }}>Vehicle</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#1B5E20' }}>{manualDetails.carName}</div>
                        {manualDetails.licensePlate && <div style={{ fontSize: 12, color: '#424242', marginTop: 2 }}>Plate: {manualDetails.licensePlate}</div>}
                      </div>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#6B8E23', textTransform: 'uppercase', marginBottom: 4 }}>Rental Period</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#1B5E20' }}>{manualDetails.totalDays} Day{manualDetails.totalDays !== 1 ? 's' : ''}</div>
                        <div style={{ fontSize: 12, color: '#424242', marginTop: 2 }}>{fmtDate(manualDetails.pickupDate)} — {fmtDate(manualDetails.returnDate)}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#6B8E23', textTransform: 'uppercase', marginBottom: 4 }}>Driver</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#1B5E20' }}>{manualDetails.driverName || manualDetails.receivedFrom}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#6B8E23', textTransform: 'uppercase', marginBottom: 4 }}>Rate &amp; Fees</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#1B5E20' }}>{fmt(manualDetails.dailyRate)} ETB / day</div>
                        {manualDetails.additionalOwed > 0 && (
                          <div style={{ fontSize: 12, color: '#F44336', marginTop: 2, fontWeight: 600 }}>Additional Owed: ETB {fmt(manualDetails.additionalOwed)}</div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Bank Details */}
                {manualDetails.paymentMethod === 'Bank' && manualDetails.bankDetails && (
                  <div style={{ background: '#E8F5E9', padding: 20, border: '1px solid #A5D6A7', marginBottom: 20 }}>
                    <h4 style={{ margin: '0 0 12px', fontSize: 13, color: '#1B5E20', fontWeight: 700 }}>Bank Details</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 13 }} className="fli-grid-2">
                      <div><strong style={{ color: '#228B22' }}>Bank Name:</strong> {manualDetails.bankDetails.bankName}</div>
                      <div><strong style={{ color: '#228B22' }}>Account Holder:</strong> {manualDetails.bankDetails.accountHolder}</div>
                      <div><strong style={{ color: '#228B22' }}>Account Number:</strong> {manualDetails.bankDetails.accountNumber}</div>
                      {manualDetails.bankDetails.chequeNo && <div><strong style={{ color: '#228B22' }}>Cheque No:</strong> {manualDetails.bankDetails.chequeNo}</div>}
                    </div>
                  </div>
                )}

                {/* Telebirr Details */}
                {manualDetails.paymentMethod === 'Telebirr' && manualDetails.telebirrDetails && (
                  <div style={{ background: '#FFF3E0', padding: 20, border: '1px solid #FFB74D', marginBottom: 20 }}>
                    <h4 style={{ margin: '0 0 12px', fontSize: 13, color: '#E65100', fontWeight: 700 }}>Telebirr Details</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 13 }} className="fli-grid-2">
                      <div><strong style={{ color: '#228B22' }}>Telebirr Number:</strong> {manualDetails.telebirrDetails.telebirrNumber}</div>
                      <div><strong style={{ color: '#228B22' }}>Full Name:</strong> {manualDetails.telebirrDetails.fullName}</div>
                    </div>
                  </div>
                )}

                {/* Online Payment Proof */}
                {(manualDetails.paymentReference || manualDetails.proofImagePath) && (
                  <div style={{ background: '#F5F5F5', padding: 20, border: '1px solid #A5D6A7', marginBottom: 20 }}>
                    <h4 style={{ margin: '0 0 16px', fontSize: 14, color: '#1B5E20', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <FileText size={16} color="#228B22" /> Online Payment Verification
                    </h4>
                    {manualDetails.paymentAccount ? (
                      <div style={{ background: '#E8F5E9', padding: 12, border: '1px solid #A5D6A7', fontSize: 14, color: '#1B5E20', marginBottom: 16 }}>
                        <strong>Customer deposited to:</strong><br />💳 <strong>{manualDetails.paymentAccount}</strong>
                      </div>
                    ) : (
                      <div style={{ background: '#E8F5E9', padding: 12, border: '1px solid #A5D6A7', fontSize: 13, color: '#1B5E20', marginBottom: 16 }}>
                        <strong>Expected Accounts:</strong><br />
                        💳 Telebirr: <strong>0901407032</strong> (SUTANA WALLET)<br />
                        🏦 CBE Bank: <strong>1000675227776</strong> (SUTANA)
                      </div>
                    )}
                    {manualDetails.paymentReference && (
                      <div style={{ marginBottom: 16 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#424242', textTransform: 'uppercase', marginBottom: 4 }}>Transaction ID / Reference</div>
                        <div style={{ fontSize: 18, fontWeight: 900, color: '#1B5E20', letterSpacing: 1 }}>{manualDetails.paymentReference}</div>
                      </div>
                    )}
                    {manualDetails.proofImagePath && (
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#424242', textTransform: 'uppercase', marginBottom: 8 }}>Attached Payment Proof</div>
                        <img
                          src={getImageUrl(manualDetails.proofImagePath)}
                          alt="Payment Proof"
                          style={{ maxWidth: '100%', maxHeight: 400, border: '2px solid #A5D6A7' }}
                        />
                        <a href={getImageUrl(manualDetails.proofImagePath)} target="_blank" rel="noreferrer"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 8, fontSize: 12, color: '#2E8B57', fontWeight: 600, textDecoration: 'none' }}>
                          <Eye size={13} /> Open Full Image
                        </a>
                      </div>
                    )}
                  </div>
                )}

                {/* Signatures section */}
                {(() => {
                  const hasWalkInSigs = manualDetails.preparedSignature || manualDetails.checkedSignature || manualDetails.receiverSignature;
                  if (!hasWalkInSigs && !manualDetails.financeSignature) return null;
                  return (
                    <div style={{ borderTop: '2px dashed #A5D6A7', paddingTop: 24, marginTop: 12 }}>
                      <h4 style={{ margin: '0 0 16px', fontSize: 14, color: '#1B5E20', fontWeight: 800 }}>Signatures</h4>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
                        {hasWalkInSigs && [
                          { label: 'Prepared By', name: manualDetails.preparedBy, sigImage: manualDetails.preparedSignature },
                          { label: 'Checked By', name: manualDetails.checkedBy, sigImage: manualDetails.checkedSignature },
                          { label: 'Receiver', name: manualDetails.receiverName, sigImage: manualDetails.receiverSignature }
                        ].map(({ label, name, sigImage }) => (
                          <div key={label} style={{ flex: 1, minWidth: 150, textAlign: 'center' }}>
                            <div style={{ height: 80, border: '1px solid #A5D6A7', marginBottom: 8, overflow: 'hidden', background: '#F5F5F5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              {sigImage ? <img src={sigImage} alt={label} style={{ maxHeight: 75, maxWidth: '100%', objectFit: 'contain' }} /> : <span style={{ color: '#8D6E63', fontSize: 11 }}>No signature</span>}
                            </div>
                            <div style={{ borderTop: '1px solid #8D6E63', paddingTop: 8 }}>
                              <div style={{ fontSize: 13, fontWeight: 700, color: '#1B5E20' }}>{name || '—'}</div>
                              <div style={{ fontSize: 11, color: '#424242', marginTop: 2 }}>{label}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>
            ) : (
              transactions.map((txn, idx) => {
                const typeColors = {
                  ONLINE: { bg: '#E8F5E9', color: '#228B22', label: 'Online' },
                  'WALK-IN': { bg: '#E8F5E9', color: '#228B22', label: 'Walk-In' },
                  RETURNED: { bg: '#FFEBEE', color: '#F44336', label: 'Return' },
                };
                const typeInfo = typeColors[txn.sale_type] || { bg: '#F5F5F5', color: '#424242', label: txn.sale_type };
                return (
                  <div key={txn.id}>
                    <div style={{ marginBottom: 4 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ background: '#1B5E20', color: 'white', width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800 }}>{idx + 1}</div>
                          <div>
                            <div style={{ fontFamily: 'monospace', fontWeight: 800, color: '#228B22', fontSize: 14 }}>{txn.receipt_no}</div>
                            <div style={{ fontSize: 11, color: '#424242' }}>{fmtDate(txn.created_at)}</div>
                          </div>
                          <span style={{ display: 'inline-flex', alignItems: 'center', padding: '3px 10px', fontSize: 11, fontWeight: 700, background: typeInfo.bg, color: typeInfo.color, border: `1px solid ${typeInfo.color}40` }}>{typeInfo.label}</span>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 20, fontWeight: 900, color: txn.sale_type === 'RETURNED' ? '#F44336' : '#2E8B57' }}>
                            {txn.sale_type === 'RETURNED' ? '−' : ''}ETB {fmt(txn.total_amount)}
                          </div>
                          <div style={{ fontSize: 11, color: '#6B8E23' }}>Running: ETB {fmt(runningTotal[idx])}</div>
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 12 }} className="fli-grid-4">
                        {(() => {
                          const base = [
                            { icon: <Building size={11} />, label: 'Branch', value: txn.branch_name || '—' },
                            { icon: <User size={11} />, label: 'Cashier', value: txn.worker_name || '—', highlight: true },
                            { icon: <Package size={11} />, label: 'Total Items', value: txn.total_products },
                            { icon: <CreditCard size={11} />, label: 'Payment', value: txn.payment_method || 'CASH' },
                          ];
                          if (txn.payment_method === 'BANK_TRANSFER') {
                            base.push(
                              { icon: <Building size={11} />, label: 'Bank Name', value: txn.bank_name || '—' },
                              { icon: <User size={11} />, label: 'Account Holder', value: txn.account_holder || '—' },
                              { icon: <Hash size={11} />, label: 'Account Number', value: txn.account_number || '—' },
                            );
                          } else if (txn.payment_method === 'TELBIR') {
                            base.push({ icon: <Smartphone size={11} />, label: 'Telebirr', value: txn.telbir_number || '—' });
                          }
                          return base;
                        })().map(({ icon, label, value, highlight }) => (
                          <div key={label} style={{ background: highlight ? '#E8F5E9' : '#F5F5F5', padding: '9px 12px', border: `1px solid ${highlight ? '#A5D6A7' : '#E0E0E0'}` }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#6B8E23', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', marginBottom: 3 }}>{icon} {label}</div>
                            <div style={{ fontSize: 12, fontWeight: 600, color: '#1B5E20' }}>{value}</div>
                          </div>
                        ))}
                      </div>

                      {txn.items && txn.items.length > 0 && (
                        <div style={{ overflowX: 'auto', marginBottom: 4 }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, minWidth: 600 }}>
                            <thead>
                              <tr style={{ background: '#1B5E20' }}>
                                {['#', 'Drug / Product', 'Qty', 'Unit Price (ETB)', 'Total (ETB)'].map(h => (
                                  <th key={h} style={{ padding: '8px 12px', textAlign: h.includes('ETB') || h === 'Qty' ? 'right' : 'left', color: 'white', fontWeight: 700, fontSize: 11, textTransform: 'uppercase' }}>{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {txn.items.map((item, i) => (
                                <tr key={i} className="fli-row-hover" style={{ borderBottom: '1px solid #F5F5F5' }}>
                                  <td style={{ padding: '7px 12px', color: '#6B8E23', fontSize: 11, border: '1px solid #E0E0E0' }}>{i + 1}</td>
                                  <td style={{ padding: '7px 12px', fontWeight: 600, color: '#1B5E20', border: '1px solid #E0E0E0' }}>{item.drug_name}</td>
                                  <td style={{ padding: '7px 12px', textAlign: 'right', border: '1px solid #E0E0E0' }}>{item.quantity}</td>
                                  <td style={{ padding: '7px 12px', textAlign: 'right', border: '1px solid #E0E0E0' }}>{fmt(item.unit_price)}</td>
                                  <td style={{ padding: '7px 12px', textAlign: 'right', fontWeight: 700, color: '#2E8B57', border: '1px solid #E0E0E0' }}>{fmt(item.total_price)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                    {idx < transactions.length - 1 && <hr style={{ border: 'none', borderTop: '2px dashed #A5D6A7', margin: '20px 0' }} />}
                  </div>
                );
              })
            )}

            {/* Running Total Row */}
            {transactions.length > 0 && (
              <div style={{ marginTop: 24, padding: '16px 20px', background: 'linear-gradient(90deg,#1B5E20,#228B22)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#A5D6A7', fontWeight: 700, fontSize: 13 }}>SYSTEM TOTAL ({transactionCount} transactions)</span>
                <span style={{ color: 'white', fontWeight: 900, fontSize: 22 }}>ETB {fmt(systemTotal)}</span>
              </div>
            )}
          </div>
        </div>
      </div>{/* end printRef */}

      {/* ══ DEPARTMENT-AWARE VERIFICATION SECTION ══ */}
      {!isCashDept ? (
        /* Digital Payment Verification */
        <div className="fli-card">
          <div className="fli-card-header">
            <h3><CheckCircle size={16} /> Payment Verification — {submission.department}</h3>
            {submission.status !== 'Pending' && (
              <span className="fli-badge" style={{ background: '#98FF98', color: '#1B5E20' }}>✓ Verified</span>
            )}
          </div>
          <div className="fli-card-body">
            <p style={{ fontSize: 13, color: '#424242', margin: '0 0 20px' }}>
              Review the payment submitted and verify using the steps below.
            </p>

            {/* Amount to verify */}
            <div style={{ background: '#1B5E20', padding: '18px 20px', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#A5D6A7', textTransform: 'uppercase', marginBottom: 4 }}>💰 Amount to Verify</div>
                <div style={{ fontSize: 12, color: '#A5D6A7' }}>{submission.department} — {submission.reference_no || submission.description || '—'}</div>
              </div>
              <div style={{ fontSize: 36, fontWeight: 900, color: '#98FF98' }}>ETB {fmt(systemTotal)}</div>
            </div>

            {/* Payment method indicators */}
            {isCBE && (
              <div style={{ background: '#1B5E20', padding: '18px 24px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ background: 'rgba(255,255,255,0.15)', padding: '8px 10px', fontSize: 20 }}>🏦</div>
                <div>
                  <div style={{ color: '#A5D6A7', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>CBE BANK TRANSFER</div>
                  <div style={{ color: 'white', fontWeight: 800 }}>Account: 1000675227776 — SUTANA</div>
                  <div style={{ color: '#A5D6A7', fontSize: 12, marginTop: 4 }}>Login to CBE Internet Banking to confirm ETB {fmt(systemTotal)}</div>
                </div>
              </div>
            )}
            {isTelebirr && (
              <div style={{ background: '#FF9800', padding: '18px 24px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ background: 'rgba(255,255,255,0.2)', padding: '8px 10px', fontSize: 20 }}>📱</div>
                <div>
                  <div style={{ color: '#1B5E20', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>TELEBIRR PAYMENT</div>
                  <div style={{ color: 'white', fontWeight: 800 }}>Number: 0901407032 — SUTANA WALLET</div>
                  <div style={{ color: '#1B5E20', fontSize: 12, marginTop: 4 }}>Check Telebirr app to confirm ETB {fmt(systemTotal)}</div>
                </div>
              </div>
            )}

            {/* Proof image */}
            {proofUrl ? (
              <div style={{ background: '#F5F5F5', padding: '20px', marginBottom: 20, border: '1px solid #A5D6A7' }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: '#1B5E20', textTransform: 'uppercase', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <FileText size={14} /> Customer Payment Screenshot
                </div>
                <img src={proofUrl} alt="Payment Proof"
                  style={{ maxWidth: '100%', maxHeight: 420, border: '2px solid #A5D6A7', display: 'block' }}
                  onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                />
                <div style={{ display: 'none', background: '#FFEBEE', border: '1px solid #fecaca', padding: '16px', alignItems: 'center', gap: 8, color: '#F44336', fontSize: 13 }}>
                  <AlertTriangle size={16} /> Image failed to load.
                </div>
                <a href={proofUrl} target="_blank" rel="noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 10, fontSize: 12, color: '#2E8B57', fontWeight: 700, textDecoration: 'none', background: '#E8F5E9', padding: '6px 12px' }}>
                  <Eye size={13} /> Open Full-Size Image
                </a>
              </div>
            ) : (
              <div style={{ background: '#FFF3E0', border: '1px solid #FFB74D', padding: '16px 20px', marginBottom: 20, fontSize: 13, color: '#E65100' }}>
                <strong>⚠ No screenshot uploaded.</strong> Verify the payment in the bank app or Telebirr before approving.
              </div>
            )}

            {/* Verification Checklist */}
            <div style={{ background: '#F5F5F5', padding: '20px', marginBottom: 20, border: '1px solid #A5D6A7' }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#1B5E20', textTransform: 'uppercase', marginBottom: 14 }}>✅ Finance Verification — confirm at least one:</div>
              {[
                isCBE && { key: 'bankChecked', label: '🏦 Logged into CBE Bank — found ETB ' + fmt(systemTotal) + ' transfer confirmed' },
                isTelebirr && { key: 'telebirrChecked', label: '📱 Checked Telebirr — ETB ' + fmt(systemTotal) + ' payment found confirmed' },
                isAwash && { key: 'bankChecked', label: '🏦 Checked Awash Bank — found ETB ' + fmt(systemTotal) + ' transfer confirmed' },
                isCash && { key: 'confirmedInPerson', label: '💵 Cash of ETB ' + fmt(systemTotal) + ' received and counted in person' },
                !isCBE && !isTelebirr && !isAwash && !isCash && { key: 'bankChecked', label: '🏦 Checked ' + (manualDetails?.paymentMethod || 'bank') + ' — payment confirmed' },
                !isCash && { key: 'confirmedInPerson', label: '💵 Payment received and verified in person / office' },
              ].filter(Boolean).map(({ key, label }) => (
                <label key={key + label} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', padding: '10px 0', borderBottom: '1px solid #A5D6A7', fontSize: 13, fontWeight: 600, color: verifyChecks[key] ? '#1B5E20' : '#424242', lineHeight: 1.4 }}>
                  <input
                    type="checkbox"
                    checked={verifyChecks[key]}
                    onChange={e => setVerifyChecks(p => ({ ...p, [key]: e.target.checked }))}
                    style={{ width: 16, height: 16, accentColor: '#228B22', cursor: 'pointer', marginTop: 2, flexShrink: 0 }}
                  />
                  {label}
                </label>
              ))}
            </div>

            {/* Finance Signature */}
            <div style={{ background: 'white', border: '2px solid #8D6E63', padding: '24px', marginBottom: 20 }}>
              <h3 style={{ fontSize: 14, fontWeight: 800, color: '#1B5E20', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <PenTool size={16} color="#8D6E63" /> Finance Officer Signature
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }} className="fli-grid-2">
                <div>
                  <label className="fli-label">Finance Officer Name *</label>
                  <input value={financeName} readOnly className="fli-input" placeholder="Enter Name" />
                </div>
                <div>
                  <label className="fli-label">Signature *</label>
                  <SigPad label="Finance Signature" onSave={setFinanceSignature} />
                  {financeSignature && <div style={{ marginTop: 6, fontSize: 11, color: '#4CAF50', fontWeight: 'bold' }}>✓ Signature captured</div>}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            {submission.status !== 'Pending' ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '16px', background: '#E8F5E9', border: '2px solid #4CAF50', color: '#1B5E20', fontWeight: 800, fontSize: 15 }}>
                <CheckCircle size={18} color="#228B22" /> Already Verified &amp; Recorded
              </div>
            ) : (
              <>
                {!anyCheckDone && (
                  <p style={{ fontSize: 12, color: '#E65100', background: '#FFF3E0', padding: '10px 14px', border: '1px solid #FFB74D', marginBottom: 12 }}>
                    ⚠ Please complete at least one verification checkbox above before approving.
                  </p>
                )}
                <button
                  className="fli-btn fli-btn-primary"
                  onClick={handleApprove}
                  disabled={approving || !readyToVerify}
                  style={{ width: '100%', padding: '16px 20px', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, background: readyToVerify ? '#228B22' : '#A5D6A7' }}
                >
                  {approving ? <><div className="fli-spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Approving...</> : <><CheckCircle size={18} /> Verify &amp; Approve — Record to Receivables</>}
                </button>
                <div style={{ marginTop: 12 }}>
                  <button
                    className="fli-btn fli-btn-danger"
                    onClick={() => setRejectModal(true)}
                    style={{ width: '100%', padding: '13px 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                  >
                    ❌ Reject with Reason
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      ) : (
        /* Cash Department Verification */
        <div className="fli-card">
          <div className="fli-card-header">
            <h3><DollarSign size={16} /> Finance Cash Count Verification</h3>
            {submission.status !== 'Pending' && (
              <span className="fli-badge" style={{ background: '#98FF98', color: '#1B5E20' }}>✓ Approved</span>
            )}
          </div>
          <div className="fli-card-body">
            <p style={{ fontSize: 13, color: '#424242', margin: '0 0 20px' }}>
              Count the physical cash received and enter below. The system will compare against recorded transactions. They <strong>must match</strong> to approve.
            </p>

            {/* Comparison row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 16, alignItems: 'center', marginBottom: 20 }} className="fli-grid-2">
              <div style={{ background: '#1B5E20', padding: '18px 20px' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#A5D6A7', textTransform: 'uppercase', marginBottom: 6 }}>📊 System Balance</div>
                <div style={{ fontSize: 28, fontWeight: 900, color: '#98FF98' }}>ETB {fmt(systemTotal)}</div>
                <div style={{ fontSize: 11, color: '#A5D6A7', marginTop: 4 }}>{manualDetails ? 'From manual submission' : `From ${transactionCount} recorded transactions`}</div>
              </div>
              <div style={{ textAlign: 'center', color: '#8D6E63', fontSize: 20, fontWeight: 700 }}>VS</div>
              <div style={{ background: cashInput === '' ? '#F5F5F5' : matched ? '#E8F5E9' : over ? '#FFF3E0' : '#FFEBEE', padding: '18px 20px', border: `2px solid ${cashInput === '' ? '#A5D6A7' : matched ? '#4CAF50' : over ? '#FFB74D' : '#fecaca'}`, transition: 'all 0.3s' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#424242', textTransform: 'uppercase', marginBottom: 8 }}>💵 Physical Cash Counted</div>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 12, fontWeight: 700, color: '#424242' }}>ETB</span>
                  <input
                    type="number" step="0.01" value={cashInput}
                    onChange={e => { setCashInput(e.target.value); setMismatch(null); setError(null); }}
                    placeholder="0.00"
                    className="fli-input"
                    style={{ paddingLeft: 48, fontSize: 20, fontWeight: 900, color: '#1B5E20' }}
                  />
                </div>
                {cashInput !== '' && (
                  <div style={{ marginTop: 8, fontSize: 12, fontWeight: 700, color: matched ? '#228B22' : over ? '#E65100' : '#F44336' }}>
                    {matched ? '✅ Match confirmed!' : over ? `⚠️ Over by ETB ${fmt(Math.abs(diff))}` : `❌ Short by ETB ${fmt(Math.abs(diff))}`}
                  </div>
                )}
              </div>
            </div>

            {/* Mismatch alert */}
            {(mismatch || (error && error.includes('mismatch'))) && (
              <div style={{ background: '#FFEBEE', border: '1px solid #fecaca', padding: '14px 18px', marginBottom: 16, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <AlertTriangle size={18} color="#F44336" style={{ flexShrink: 0, marginTop: 2 }} />
                <div>
                  <div style={{ fontWeight: 800, color: '#F44336', fontSize: 14 }}>Reconciliation Failed — Mismatch Detected</div>
                  <div style={{ color: '#F44336', fontSize: 13, marginTop: 4 }}>{error}</div>
                  <div style={{ color: '#424242', fontSize: 12, marginTop: 6 }}>Please recount the physical cash and re-enter the correct amount before retrying.</div>
                </div>
              </div>
            )}

            {/* Error (non-mismatch) */}
            {error && !error.includes('mismatch') && !error.includes('count') && (
              <div style={{ background: '#FFEBEE', border: '1px solid #fecaca', padding: '12px 18px', marginBottom: 16, color: '#F44336', fontSize: 13 }}>
                <strong>Error:</strong> {error}
              </div>
            )}

            {/* Finance Signature */}
            <div style={{ background: 'white', border: '2px solid #8D6E63', padding: '24px', marginBottom: 20 }}>
              <h3 style={{ fontSize: 14, fontWeight: 800, color: '#1B5E20', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <PenTool size={16} color="#8D6E63" /> Finance Official Signature
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }} className="fli-grid-2">
                <div>
                  <label className="fli-label">Finance Officer Name *</label>
                  <input value={financeName} readOnly className="fli-input" placeholder="Enter Name" />
                </div>
                <div>
                  <label className="fli-label">Signature *</label>
                  <SigPad label="Finance Signature" onSave={setFinanceSignature} />
                  {financeSignature && <div style={{ marginTop: 6, fontSize: 11, color: '#4CAF50', fontWeight: 'bold' }}>✓ Signature captured</div>}
                </div>
              </div>
            </div>

            {/* Approve button */}
            <button
              className="fli-btn fli-btn-primary"
              onClick={handleApprove}
              disabled={approving || cashInput === '' || submission.status !== 'Pending'}
              style={{
                width: '100%', padding: '15px 20px', fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                background: submission.status !== 'Pending' ? '#A5D6A7' : matched ? '#228B22' : cashInput === '' ? '#A5D6A7' : '#FF9800',
                color: cashInput === '' || submission.status !== 'Pending' ? '#6B8E23' : 'white',
              }}
            >
              {approving ? (
                <><div className="fli-spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Approving...</>
              ) : submission.status !== 'Pending' ? (
                <><CheckCircle size={18} /> Already Approved</>
              ) : matched ? (
                <><CheckCircle size={18} /> ✅ Cash Verified — Approve &amp; Record to Receivables Book</>
              ) : cashInput !== '' ? (
                <><AlertTriangle size={18} /> Amounts Don't Match — Fix and Retry</>
              ) : (
                <><DollarSign size={18} /> Enter Cash Count to Verify</>
              )}
            </button>

            {matched && (
              <p style={{ textAlign: 'center', fontSize: 12, color: '#424242', marginTop: 8 }}>
                Cash count matches system balance. Approval will record ETB {fmt(systemTotal)} into the Receivables Book.
              </p>
            )}

            {submission.status === 'Pending' && (
              <div style={{ marginTop: 12 }}>
                <button
                  className="fli-btn fli-btn-danger"
                  onClick={() => setRejectModal(true)}
                  style={{ width: '100%', padding: '13px 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                >
                  ❌ Reject with Reason
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════ */
/*  MAIN COMPONENT                                                     */
/* ═══════════════════════════════════════════════════════════════════ */
const FinanceLiveIncome = () => {
  const { show, Toasts } = useToast();
  const [view, setView] = useState('list');
  const [detailId, setDetailId] = useState(null);

  /* Form fields */
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [department, setDepartment] = useState('Sales');
  const [receivedFrom, setReceivedFrom] = useState('');
  const [amount, setAmount] = useState('');
  const [amountWords, setAmountWords] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [description, setDescription] = useState('');
  const [referenceNo, setReferenceNo] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [chequeNo, setChequeNo] = useState('');
  const [telebirrNumber, setTelebirrNumber] = useState('');
  const [telebirrName, setTelebirrName] = useState('');
  const [preparedBy, setPreparedBy] = useState('');
  const [checkedBy, setCheckedBy] = useState('');
  const [receiverName, setReceiverName] = useState('');
  const [preparedSig, setPreparedSig] = useState(null);
  const [checkedSig, setCheckedSig] = useState(null);
  const [receiverSig, setReceiverSig] = useState(null);
  const [submitted, setSubmitted] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /* Pending list */
  const [pendingList, setPendingList] = useState([]);
  const [loadingList, setLoadingList] = useState(false);

  const loadPending = useCallback(async () => {
    setLoadingList(true);
    try {
      const res = await api.get('/finance-receivables/live-income');
      setPendingList(res.data || []);
    } catch (e) { console.error(e); }
    finally { setLoadingList(false); }
  }, []);

  useEffect(() => { if (view === 'list') loadPending(); }, [view, loadPending]);

  const handleAmountChange = (e) => {
    setAmount(e.target.value);
    const v = parseFloat(e.target.value);
    setAmountWords(isNaN(v) ? '' : `${v.toLocaleString('en-US')} ETB Only`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(null); setLoading(true);
    try {
      const payload = {
        date, department, receivedFrom, amount: parseFloat(amount), paymentMethod, description, referenceNo,
        bankDetails: paymentMethod === 'Bank' ? { bankName, accountHolder, accountNumber, chequeNo } : null,
        telebirrDetails: paymentMethod === 'Telebirr' ? { telebirrNumber, fullName: telebirrName } : null,
        preparedBy, checkedBy, receiverName,
        preparedSignature: preparedSig, checkedSignature: checkedSig, receiverSignature: receiverSig
      };
      const res = await api.post('/finance-receivables/live-income', {
        department, submitted_by: preparedBy, amount: parseFloat(amount),
        reference_no: referenceNo, description, manual_details: payload
      });
      const incomeNo = `INC-${String(res.id || Date.now()).slice(-6)}`;
      setSubmitted({ incomeNo, ...payload, amountWords });
      show('Income submitted successfully!', 'success');
    } catch (err) {
      const msg = err.message || 'Failed to submit income';
      setError(msg);
      show(msg, 'error');
    } finally { setLoading(false); }
  };

  const resetForm = () => {
    setSubmitted(null); setAmount(''); setAmountWords(''); setReferenceNo('');
    setReceivedFrom(''); setDescription('');
    setBankName(''); setAccountHolder(''); setAccountNumber(''); setChequeNo('');
    setTelebirrNumber(''); setTelebirrName('');
    setPreparedBy(''); setCheckedBy(''); setReceiverName('');
    setPreparedSig(null); setCheckedSig(null); setReceiverSig(null);
  };

  /* ─── DETAIL VIEW ─── */
  if (view === 'detail' && detailId) {
    return (
      <DetailView
        submissionId={detailId}
        onBack={() => { setView('list'); setDetailId(null); }}
        onApproved={() => { setView('list'); setDetailId(null); loadPending(); }}
      />
    );
  }

  /* ─── SUCCESS SCREEN ─── */
  if (submitted) {
    const handlePrintReceipt = () => {
      const w = window.open('', '_blank');
      w.document.write(`<html><head><title>Print Receipt</title>
        <style>
          body { font-family: 'Inter', sans-serif; padding: 40px; color: #1B5E20; }
          .header { border-bottom: 2px solid #1B5E20; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; }
          .header-left h1 { margin: 0 0 5px; font-size: 24px; font-weight: 900; text-transform: uppercase; }
          .header-left p { margin: 0; color: #424242; font-size: 14px; }
          .header-right { text-align: right; }
          .header-right .ref { font-family: monospace; font-size: 20px; font-weight: 900; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
          .grid-item { padding: 15px; background: #F5F5F5; border: 1px solid #A5D6A7; }
          .grid-item label { display: block; font-size: 11px; color: #424242; text-transform: uppercase; font-weight: bold; margin-bottom: 5px; }
          .grid-item div { font-size: 16px; font-weight: bold; }
          .amount-box { padding: 20px; background: #E8F5E9; border: 1px solid #A5D6A7; text-align: center; margin-bottom: 30px; }
          .amount-box label { display: block; color: #1B5E20; font-weight: bold; margin-bottom: 5px; text-transform: uppercase; }
          .amount-box div { font-size: 24px; font-weight: 900; color: #228B22; }
          .signatures { display: flex; justify-content: space-between; margin-top: 40px; padding-top: 20px; border-top: 2px dashed #A5D6A7; }
          .sig-block { flex: 1; text-align: center; }
          .sig-img { height: 80px; margin-bottom: 10px; display: flex; align-items: center; justify-content: center; }
          .sig-img img { max-height: 100%; max-width: 100%; object-fit: contain; }
          .sig-line { border-top: 1px solid #1B5E20; margin: 0 20px; padding-top: 5px; font-weight: bold; font-size: 14px; }
        </style>
      </head><body>
        <div class="header">
          <div class="header-left">
            <h1>Sutana Enterprise</h1>
            <p>Walk-In Income Receipt</p>
          </div>
          <div class="header-right">
            <div class="ref">${submitted.incomeNo}</div>
            <div style="font-size:12px; color:#424242;">${submitted.date}</div>
          </div>
        </div>
        <div class="grid">
          <div class="grid-item"><label>Department</label><div>${submitted.department}</div></div>
          <div class="grid-item"><label>Payment Method</label><div>${submitted.paymentMethod}</div></div>
          <div class="grid-item"><label>Received From</label><div>${submitted.receivedFrom || '—'}</div></div>
          <div class="grid-item"><label>Description</label><div>${submitted.description || '—'}</div></div>
        </div>
        <div class="amount-box">
          <label>Total Amount Received</label>
          <div>ETB ${parseFloat(submitted.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
        </div>
        <div class="signatures">
          <div class="sig-block">
            <div class="sig-img">${submitted.preparedSignature ? `<img src="${submitted.preparedSignature}" />` : ''}</div>
            <div class="sig-line">${submitted.preparedBy || 'Prepared By'}</div>
            <div style="font-size: 11px; color: #424242;">Prepared By</div>
          </div>
          <div class="sig-block">
            <div class="sig-img">${submitted.checkedSignature ? `<img src="${submitted.checkedSignature}" />` : ''}</div>
            <div class="sig-line">${submitted.checkedBy || 'Checked By'}</div>
            <div style="font-size: 11px; color: #424242;">Checked By</div>
          </div>
          <div class="sig-block">
            <div class="sig-img">${submitted.receiverSignature ? `<img src="${submitted.receiverSignature}" />` : ''}</div>
            <div class="sig-line">${submitted.receiverName || 'Receiver'}</div>
            <div style="font-size: 11px; color: #424242;">Receiver</div>
          </div>
        </div>
      </body></html>`);
      w.document.close();
      w.focus();
      setTimeout(() => { w.print(); w.close(); }, 250);
    };

    return (
      <div className="fli-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <style>{G}</style>
        <Toasts />
        <div style={{ background: 'white', border: '2px solid #228B22', padding: 40, maxWidth: 560, width: '100%', textAlign: 'center' }}>
          <div style={{ background: '#E8F5E9', width: 80, height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <CheckCircle size={48} color="#228B22" />
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: '#1B5E20', margin: '0 0 8px' }}>Income Submitted!</h2>
          <p style={{ color: '#424242', marginBottom: 24 }}>Recorded and sent for Finance verification.</p>
          <div style={{ background: '#E8F5E9', padding: 20, border: '1px dashed #A5D6A7', textAlign: 'left', marginBottom: 24 }}>
            <div style={{ fontFamily: 'monospace', fontSize: 18, fontWeight: 800, color: '#228B22', textAlign: 'center', letterSpacing: 2, marginBottom: 14 }}>{submitted.incomeNo}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 14 }}>
              <div><span style={{ color: '#424242', fontSize: 11, display: 'block' }}>Date</span><b>{submitted.date}</b></div>
              <div><span style={{ color: '#424242', fontSize: 11, display: 'block' }}>Department</span><b>{submitted.department}</b></div>
              <div><span style={{ color: '#424242', fontSize: 11, display: 'block' }}>Payment Method</span><b>{submitted.paymentMethod}</b></div>
              <div><span style={{ color: '#424242', fontSize: 11, display: 'block' }}>Received From</span><b>{submitted.receivedFrom}</b></div>
              <div style={{ gridColumn: 'span 2' }}>
                <span style={{ color: '#424242', fontSize: 11, display: 'block' }}>Amount</span>
                <span style={{ fontWeight: 800, color: '#228B22', fontSize: 20 }}>ETB {parseFloat(submitted.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={handlePrintReceipt} className="fli-btn fli-btn-outline" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <Printer size={16} /> Print Receipt
            </button>
            <button onClick={resetForm} className="fli-btn fli-btn-primary" style={{ flex: 1 }}>
              New Submission
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ─── PAGE HEADER (shared between list & form) ─── */
  const PageHeader = ({ activeTab }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }} className="fli-header-row">
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 900, margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 12, color: '#1B5E20' }}>
          <span style={{ background: '#228B22', padding: '8px 10px', display: 'flex' }}>
            <DollarSign color="white" size={20} />
          </span>
          Live Income — Finance Review
        </h1>
        <p style={{ color: '#6B8E23', margin: 0, fontSize: 13 }}>Verify cash count or digital payment proof to approve each submission.</p>
      </div>
      <div style={{ display: 'flex', background: '#F5F5F5', border: '1px solid #A5D6A7' }}>
        <button
          onClick={() => setView('list')}
          className={`fli-tab-btn${activeTab === 'list' ? ' active' : ''}`}
          style={{ display: 'flex', alignItems: 'center', gap: 8 }}
        >
          <List size={15} /> Pending Approvals
        </button>
        <button
          onClick={() => setView('form')}
          className={`fli-tab-btn${activeTab === 'form' ? ' active' : ''}`}
          style={{ display: 'flex', alignItems: 'center', gap: 8 }}
        >
          <TrendingUp size={15} /> Walk-In Submission
        </button>
      </div>
    </div>
  );

  /* ─── PENDING APPROVALS LIST ─── */
  if (view === 'list') {
    const totalPending = pendingList.reduce((s, x) => s + parseFloat(x.amount || 0), 0);
    return (
      <div className="fli-page">
        <style>{G}</style>
        <Toasts />
        <PageHeader activeTab="list" />

        {/* Summary stats */}
        {pendingList.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 20 }} className="fli-stat-row">
            <div className="fli-stat-card" style={{ borderLeft: '4px solid #228B22' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#6B8E23', textTransform: 'uppercase', marginBottom: 6 }}>Pending Submissions</div>
              <div style={{ fontSize: 28, fontWeight: 900, color: '#1B5E20' }}>{pendingList.length}</div>
            </div>
            <div className="fli-stat-card" style={{ borderLeft: '4px solid #FF9800' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#6B8E23', textTransform: 'uppercase', marginBottom: 6 }}>Total Pending (ETB)</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#FF9800' }}>{fmt(totalPending)}</div>
            </div>
            <div className="fli-stat-card" style={{ borderLeft: '4px solid #2E8B57', background: '#E8F5E9' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#1B5E20', textTransform: 'uppercase', marginBottom: 6 }}>Action Required</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#228B22' }}>Click <strong>Detail</strong> → count cash → approve</div>
            </div>
          </div>
        )}

        <div className="fli-card">
          <div className="fli-card-header">
            <h3><FileText size={16} /> Awaiting Finance Verification</h3>
            <button onClick={loadPending} className="fli-btn" style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.3) !important', padding: '6px 14px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 5 }}>
              <RefreshCw size={13} /> Refresh
            </button>
          </div>

          {loadingList ? (
            <div style={{ padding: 60, textAlign: 'center', color: '#6B8E23', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <div className="fli-spinner" />
              <span style={{ fontWeight: 600 }}>Loading...</span>
            </div>
          ) : pendingList.length === 0 ? (
            <div style={{ padding: 64, textAlign: 'center' }}>
              <CheckCircle size={48} color="#4CAF50" style={{ margin: '0 auto 16px', display: 'block' }} />
              <h3 style={{ margin: '0 0 8px', color: '#1B5E20' }}>All caught up!</h3>
              <p style={{ color: '#424242', margin: 0 }}>No pending income submissions.</p>
            </div>
          ) : (
            <div className="fli-table-wrap">
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 900 }}>
                <thead>
                  <tr style={{ background: '#1B5E20' }}>
                    {['#', 'Department', 'Submitted By', 'Description', 'Ref No', 'Date', 'System Total (ETB)', 'Action'].map(col => (
                      <th key={col} style={{ padding: '13px 16px', textAlign: col === 'System Total (ETB)' ? 'right' : 'left', color: 'white', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pendingList.map((sub, idx) => {
                    const isCash = CASH_DEPTS.includes(sub.department);
                    const typePill = isCash
                      ? { bg: '#E8F5E9', color: '#228B22', label: '💵 Cash' }
                      : { bg: '#E3F2FD', color: '#1565C0', label: '📱 Digital' };
                    return (
                      <tr key={sub.id} className="fli-row-hover" style={{ borderBottom: '1px solid #A5D6A7', background: 'white' }}>
                        <td style={{ padding: '13px 16px', color: '#6B8E23', fontWeight: 700 }}>{idx + 1}</td>
                        <td style={{ padding: '13px 16px' }}>
                          <span style={{ background: '#E8F5E9', color: '#1B5E20', padding: '3px 10px', fontSize: 11, fontWeight: 700, display: 'block', marginBottom: 4 }}>{sub.department}</span>
                          <span style={{ background: typePill.bg, color: typePill.color, padding: '2px 8px', fontSize: 10, fontWeight: 700, display: 'inline-block' }}>{typePill.label}</span>
                        </td>
                        <td style={{ padding: '13px 16px', color: '#424242' }}>{sub.submitted_by}</td>
                        <td style={{ padding: '13px 16px', color: '#424242', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sub.description || '—'}</td>
                        <td style={{ padding: '13px 16px', fontFamily: 'monospace', color: '#228B22', fontSize: 12 }}>{sub.reference_no || '—'}</td>
                        <td style={{ padding: '13px 16px', color: '#424242', whiteSpace: 'nowrap' }}>{new Date(sub.created_at).toLocaleDateString('en-GB')}</td>
                        <td style={{ padding: '13px 16px', textAlign: 'right', fontWeight: 800, color: '#1B5E20', fontSize: 14 }}>{fmt(sub.amount)}</td>
                        <td style={{ padding: '13px 16px' }}>
                          <button
                            onClick={() => { setDetailId(sub.id); setView('detail'); }}
                            className="fli-btn fli-btn-primary"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', fontSize: 12 }}
                          >
                            <Eye size={13} /> {isCash ? 'Verify Cash' : 'Verify Proof'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ background: '#1B5E20' }}>
                    <td colSpan={6} style={{ padding: '12px 16px', color: '#A5D6A7', fontWeight: 700, fontSize: 12 }}>TOTAL PENDING</td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', color: 'white', fontWeight: 900, fontSize: 16 }}>{fmt(totalPending)}</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ─── FORM ─── */
  const inputStyle = { width: '100%', padding: '11px 14px', border: '2px solid #A5D6A7', borderRadius: 0, boxSizing: 'border-box', outline: 'none', fontSize: 14, transition: 'border-color .2s', fontFamily: 'Inter, sans-serif', background: 'white' };
  const inp = (value, onChange, placeholder, required = false, type = 'text') => ({
    value, onChange: e => onChange(e.target.value), required, type, placeholder,
    onFocus: e => (e.target.style.borderColor = '#228B22'),
    onBlur: e => (e.target.style.borderColor = '#A5D6A7'),
    style: inputStyle
  });

  return (
    <div className="fli-page">
      <style>{G}</style>
      <Toasts />
      <PageHeader activeTab="form" />

      {error && (
        <div style={{ background: '#FFEBEE', border: '1px solid #fecaca', color: '#F44336', padding: '14px 18px', marginBottom: 16 }}>
          <b>Error:</b> {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* General Information Card */}
        <div className="fli-card">
          <div className="fli-card-header">
            <h3><User size={16} /> General Information</h3>
          </div>
          <div className="fli-card-body">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }} className="fli-grid-2">
              <div>
                <label className="fli-label">Date *</label>
                <input {...inp(date, setDate, '', true, 'date')} />
              </div>
              <div>
                <label className="fli-label">Department *</label>
                <select required value={department} onChange={e => setDepartment(e.target.value)}
                  onFocus={e => (e.target.style.borderColor = '#228B22')} onBlur={e => (e.target.style.borderColor = '#A5D6A7')}
                  style={{ ...inputStyle, background: 'white' }}>
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label className="fli-label">Received From *</label>
              <input {...inp(receivedFrom, setReceivedFrom, 'Customer / Company / Person', true)} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 20, marginBottom: 20 }} className="fli-grid-2">
              <div>
                <label className="fli-label">Amount (ETB) *</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#424242', fontWeight: 600, fontSize: 12 }}>ETB</span>
                  <input required type="number" step="0.01" value={amount} onChange={handleAmountChange}
                    placeholder="0.00"
                    onFocus={e => (e.target.style.borderColor = '#228B22')} onBlur={e => (e.target.style.borderColor = '#A5D6A7')}
                    style={{ ...inputStyle, paddingLeft: 46, fontSize: 15, fontWeight: 700 }}
                  />
                </div>
              </div>
              <div>
                <label className="fli-label">Amount in Words</label>
                <input readOnly value={amountWords} placeholder="Auto-filled" style={{ ...inputStyle, background: '#F5F5F5', fontStyle: 'italic', borderColor: '#E0E0E0' }} />
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label className="fli-label">Description *</label>
              <input {...inp(description, setDescription, 'Reason for income receipt', true)} />
            </div>
            <div>
              <label className="fli-label">Reference # (Optional)</label>
              <input {...inp(referenceNo, setReferenceNo, 'Invoice #, Receipt ID, etc.')} />
            </div>
          </div>
        </div>

        {/* Payment Method Card */}
        <div className="fli-card">
          <div className="fli-card-header">
            <h3><Banknote size={16} /> Payment Method</h3>
          </div>
          <div className="fli-card-body">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: paymentMethod !== 'Cash' ? 20 : 0 }} className="fli-grid-3">
              {[{ type: 'Cash', icon: Banknote }, { type: 'Bank', icon: Building }, { type: 'Telebirr', icon: Smartphone }].map(({ type, icon: Icon }) => (
                <div key={type} onClick={() => setPaymentMethod(type)}
                  style={{ padding: 18, border: `2px solid ${paymentMethod === type ? '#228B22' : '#A5D6A7'}`, cursor: 'pointer', fontWeight: 700, fontSize: 14, background: paymentMethod === type ? '#1B5E20' : 'white', color: paymentMethod === type ? 'white' : '#424242', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, transition: 'all .2s' }}
                  onMouseEnter={e => { if (paymentMethod !== type) e.currentTarget.style.background = '#E8F5E9'; }}
                  onMouseLeave={e => { if (paymentMethod !== type) e.currentTarget.style.background = 'white'; }}
                >
                  <Icon size={26} color={paymentMethod === type ? '#A5D6A7' : '#6B8E23'} /> {type}
                </div>
              ))}
            </div>

            {paymentMethod === 'Bank' && (
              <div style={{ background: '#E8F5E9', padding: 20, border: '1px solid #A5D6A7' }}>
                <h4 style={{ margin: '0 0 14px', fontSize: 13, color: '#1B5E20', fontWeight: 700 }}>Bank Details</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }} className="fli-grid-2">
                  <input required value={bankName} onChange={e => setBankName(e.target.value)} placeholder="Bank Name *" style={{ ...inputStyle, border: '2px solid #A5D6A7' }} onFocus={e => e.target.style.borderColor = '#228B22'} onBlur={e => e.target.style.borderColor = '#A5D6A7'} />
                  <input required value={accountHolder} onChange={e => setAccountHolder(e.target.value)} placeholder="Account Holder *" style={{ ...inputStyle, border: '2px solid #A5D6A7' }} onFocus={e => e.target.style.borderColor = '#228B22'} onBlur={e => e.target.style.borderColor = '#A5D6A7'} />
                  <input required value={accountNumber} onChange={e => setAccountNumber(e.target.value)} placeholder="Account Number *" style={{ ...inputStyle, border: '2px solid #A5D6A7' }} onFocus={e => e.target.style.borderColor = '#228B22'} onBlur={e => e.target.style.borderColor = '#A5D6A7'} />
                  <input value={chequeNo} onChange={e => setChequeNo(e.target.value)} placeholder="Cheque # (Optional)" style={{ ...inputStyle, border: '2px solid #A5D6A7' }} onFocus={e => e.target.style.borderColor = '#228B22'} onBlur={e => e.target.style.borderColor = '#A5D6A7'} />
                </div>
              </div>
            )}

            {paymentMethod === 'Telebirr' && (
              <div style={{ background: '#FFF3E0', padding: 20, border: '1px solid #FFB74D' }}>
                <h4 style={{ margin: '0 0 14px', fontSize: 13, color: '#E65100', fontWeight: 700 }}>Telebirr Details</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }} className="fli-grid-2">
                  <input required value={telebirrNumber} onChange={e => setTelebirrNumber(e.target.value)} placeholder="Mobile Number *" style={{ ...inputStyle, border: '2px solid #FFB74D' }} onFocus={e => e.target.style.borderColor = '#E65100'} onBlur={e => e.target.style.borderColor = '#FFB74D'} />
                  <input required value={telebirrName} onChange={e => setTelebirrName(e.target.value)} placeholder="Full Name *" style={{ ...inputStyle, border: '2px solid #FFB74D' }} onFocus={e => e.target.style.borderColor = '#E65100'} onBlur={e => e.target.style.borderColor = '#FFB74D'} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Signatures Card */}
        <div className="fli-card">
          <div className="fli-card-header">
            <h3><PenTool size={16} /> Signatures</h3>
          </div>
          <div className="fli-card-body">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 24 }} className="fli-grid-3">
              <div>
                <label className="fli-label">Prepared By (Name) *</label>
                <input {...inp(preparedBy, setPreparedBy, 'Accountant / Staff Name', true)} style={{ ...inputStyle, marginBottom: 10 }} />
                <SigPad label="Prepared By" onSave={setPreparedSig} />
                {preparedSig && <p style={{ margin: '4px 0 0', fontSize: 10, color: '#228B22', fontWeight: 600 }}>✓ Signature ready</p>}
              </div>
              <div>
                <label className="fli-label">Checked By (Name) *</label>
                <input {...inp(checkedBy, setCheckedBy, 'Manager Name', true)} style={{ ...inputStyle, marginBottom: 10 }} />
                <SigPad label="Checked By" onSave={setCheckedSig} />
                {checkedSig && <p style={{ margin: '4px 0 0', fontSize: 10, color: '#228B22', fontWeight: 600 }}>✓ Signature ready</p>}
              </div>
              <div>
                <label className="fli-label">Receiver's Name *</label>
                <input {...inp(receiverName, setReceiverName, 'Receiver Name', true)} style={{ ...inputStyle, marginBottom: 10 }} />
                <SigPad label="Receiver" onSave={setReceiverSig} />
                {receiverSig && <p style={{ margin: '4px 0 0', fontSize: 10, color: '#228B22', fontWeight: 600 }}>✓ Signature ready</p>}
              </div>
            </div>
            <p style={{ margin: '18px 0 0', color: '#6B8E23', fontSize: 11 }}>ⓘ Draw on the white canvas with your mouse or finger, then click <b>Save</b> to confirm each signature before submitting.</p>
          </div>
        </div>

        {/* Submit button */}
        <button
          type="submit" disabled={loading}
          className="fli-btn fli-btn-primary"
          style={{ width: '100%', padding: 16, fontSize: 16, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10, background: loading ? '#A5D6A7' : '#228B22' }}
        >
          {loading ? (
            <><div className="fli-spinner" style={{ width: 20, height: 20, borderWidth: 2 }} /> Submitting...</>
          ) : (
            <><TrendingUp size={20} /> Submit Income for Finance Verification</>
          )}
        </button>
      </form>
    </div>
  );
};

export default FinanceLiveIncome;
