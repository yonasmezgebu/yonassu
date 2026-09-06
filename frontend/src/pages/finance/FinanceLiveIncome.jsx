import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  TrendingUp, CheckCircle, Printer, DollarSign, User, FileText,
  Banknote, Building, Smartphone, Calendar, RefreshCw, PenTool,
  Trash2, List, ArrowLeft, Eye, AlertTriangle, XCircle, ShoppingCart,
  Package, Phone, CreditCard, Hash, Clock, ChevronRight, Car
} from 'lucide-react';
import api from '../../services/apiClient';
import { useAuth } from '../../hooks/useAuth';
import SegmentedSpinner from '../../components/ui/SegmentedSpinner';

/* ─── Global Styles ──────────────────────────────────────────────── */
const G = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
  .fli-page {
    --color-primary:#2563EB; --color-primary-hover:#1D4ED8;
    --color-bg-page:#F5F6FA; --color-bg-card:#FFFFFF; --color-border:#E5E7EB;
    --color-text-primary:#111827; --color-text-secondary:#6B7280; --color-text-muted:#9CA3AF;
    --color-success:#16A34A; --color-success-bg:#DCFCE7;
    --color-danger:#DC2626; --color-danger-bg:#FEE2E2;
    --color-warning:#D97706; --color-warning-bg:#FEF3C7;
    --color-info:#0284C7; --color-info-bg:#E0F2FE;
    --color-gold:#F59E0B; --color-gold-text:#1F2937;
    --transition: 150ms ease-in-out;
    font-family: 'Inter', -apple-system, 'Segoe UI', Roboto, sans-serif;
    background: var(--color-bg-page);
    color: var(--color-text-primary);
    min-height: 100vh;
    width: 100%;
    max-width: 1600px;
    margin: 0 auto;
    padding: 0;
  }
  .fli-page *, .fli-page *::before, .fli-page *::after { box-sizing: border-box; }
  .fli-page h1, .fli-page h2, .fli-page h3, .fli-page h4, .fli-page p { line-height: 1.3; }

  /* ── Buttons ─────────────────────────────────── */
  .fli-btn {
    border-radius: 8px;
    font-family: inherit;
    cursor: pointer;
    font-weight: 500;
    font-size: 14px;
    height: 36px;
    padding: 0 16px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    border: 1px solid transparent;
    transition: background-color var(--transition), border-color var(--transition), color var(--transition), box-shadow var(--transition);
  }
  .fli-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .fli-btn-primary { background: var(--color-primary); color: #FFFFFF; }
  .fli-btn-primary:hover:not(:disabled) { background: var(--color-gold); color: var(--color-gold-text); }
  .fli-btn-outline { background: #FFFFFF; color: var(--color-primary); border-color: var(--color-border); }
  .fli-btn-outline:hover:not(:disabled) { background: var(--color-gold); color: var(--color-gold-text); border-color: var(--color-gold); }
  .fli-btn-danger { background: #FFFFFF; color: var(--color-danger); border-color: var(--color-danger); }
  .fli-btn-danger:hover:not(:disabled) { background: var(--color-gold); color: var(--color-gold-text); border-color: var(--color-gold); }
  .fli-btn-secondary { background: var(--color-bg-page); color: var(--color-text-primary); border-color: var(--color-border); }
  .fli-btn-secondary:hover:not(:disabled) { background: var(--color-gold); color: var(--color-gold-text); border-color: var(--color-gold); }
  .fli-btn-warning { background: var(--color-warning); color: #FFFFFF; }
  .fli-btn-warning:hover:not(:disabled) { background: var(--color-gold); color: var(--color-gold-text); }

  /* ── Cards ───────────────────────────────────── */
  .fli-card {
    background: var(--color-bg-card);
    border: 1px solid var(--color-border);
    border-radius: 10px;
    box-shadow: 0 1px 3px rgba(0,0,0,.06);
    margin-bottom: 20px;
    transition: box-shadow var(--transition), transform var(--transition);
  }
  .fli-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,.08); transform: translateY(-1px); }
  .fli-card-header {
    padding: 16px 20px;
    border-bottom: 1px solid var(--color-border);
    background: var(--color-bg-card);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
    border-top-left-radius: 10px;
    border-top-right-radius: 10px;
  }
  .fli-card-header h3 { margin: 0; font-size: 16px; font-weight: 600; color: var(--color-text-primary); display: flex; align-items: center; gap: 8px; }
  .fli-card-body { padding: 24px; }

  /* ── Inputs ──────────────────────────────────── */
  .fli-input {
    width: 100%;
    height: 36px;
    padding: 0 12px;
    border: 1px solid var(--color-border);
    border-radius: 8px;
    outline: none;
    font-size: 14px;
    font-family: inherit;
    background: #FFFFFF;
    color: var(--color-text-primary);
    transition: border-color var(--transition), box-shadow var(--transition);
  }
  .fli-input:focus { border-color: var(--color-primary); box-shadow: 0 0 0 3px rgba(37,99,235,.1); }
  .fli-input:read-only { background: var(--color-bg-page); color: var(--color-text-secondary); }
  .fli-label { display: block; font-size: 12px; font-weight: 500; color: var(--color-text-secondary); text-transform: uppercase; letter-spacing: 0.03em; margin-bottom: 6px; }

  .fli-row-hover:hover { background: #F9FAFB !important; }

  /* ── Tabs ────────────────────────────────────── */
  .fli-tab-btn {
    height: 36px;
    padding: 0 16px;
    border: none;
    background: transparent;
    font-weight: 500;
    font-size: 13px;
    cursor: pointer;
    color: var(--color-text-secondary);
    display: inline-flex;
    align-items: center;
    gap: 8px;
    border-radius: 6px;
    transition: color var(--transition), background-color var(--transition);
  }
  .fli-tab-btn:hover { color: var(--color-primary); background: #FFFFFF; }
  .fli-tab-btn.active { color: var(--color-primary); background: #FFFFFF; font-weight: 600; box-shadow: 0 1px 3px rgba(0,0,0,.06); }

  /* ── Stat cards ──────────────────────────────── */
  .fli-stat-card {
    background: var(--color-bg-card);
    border: 1px solid var(--color-border);
    border-radius: 10px;
    padding: 18px 20px;
    box-shadow: 0 1px 3px rgba(0,0,0,.06);
    transition: box-shadow var(--transition), transform var(--transition);
  }
  .fli-stat-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,.08); transform: translateY(-1px); }

  /* ── Badges ──────────────────────────────────── */
  .fli-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 2px 10px;
    font-size: 12px;
    font-weight: 500;
    border-radius: 999px;
    white-space: nowrap;
    line-height: 1.5;
  }

  @keyframes fliSlideIn { from { opacity: 0; transform: translateX(30px); } to { opacity: 1; transform: translateX(0); } }

  /* ── Tables ──────────────────────────────────── */
  .fli-table-wrap { overflow-x: auto; }
  .fli-table-wrap table { width: 100%; border-collapse: collapse; font-size: 14px; min-width: 900px; font-variant-numeric: tabular-nums; }
  .fli-table-wrap thead th {
    background: #F9FAFB;
    color: var(--color-text-secondary);
    padding: 12px 16px;
    text-align: left;
    font-weight: 600;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    border-bottom: 1px solid var(--color-border);
    white-space: nowrap;
  }
  .fli-table-wrap tbody td { padding: 13px 16px; border-bottom: 1px solid var(--color-border); }
  .fli-table-wrap tbody tr { transition: background-color var(--transition); }
  .fli-table-wrap tbody tr:hover { background: #F9FAFB; }
  .fli-table-wrap tfoot td { background: #F9FAFB; border-top: 1px solid var(--color-border); padding: 12px 16px; }

  /* ── Small controls ──────────────────────────── */
  .fli-sig-clear {
    font-size: 10px;
    height: 24px;
    padding: 0 8px;
    border: 1px solid var(--color-danger);
    background: var(--color-danger-bg);
    cursor: pointer;
    color: var(--color-danger);
    font-weight: 600;
    border-radius: 6px;
    transition: background-color var(--transition), color var(--transition), border-color var(--transition);
  }
  .fli-sig-clear:hover { background: var(--color-gold); color: var(--color-gold-text); border-color: var(--color-gold); }
  .fli-toast-close {
    background: none;
    border: none;
    color: inherit;
    cursor: pointer;
    padding: 4px 6px;
    border-radius: 6px;
    line-height: 1;
    opacity: 0.8;
    transition: opacity var(--transition), background-color var(--transition);
  }
  .fli-toast-close:hover { opacity: 1; background: rgba(0,0,0,0.12); }

  /* ── Responsive ──────────────────────────────── */
  @media (max-width: 1024px) {
    .fli-grid-3 { grid-template-columns: 1fr 1fr !important; }
  }
  @media (max-width: 768px) {
    .fli-page { padding: 0; }
    .fli-grid-2 { grid-template-columns: 1fr !important; }
    .fli-grid-3 { grid-template-columns: 1fr !important; }
    .fli-grid-4 { grid-template-columns: 1fr 1fr !important; }
    .fli-header-row { flex-direction: column; gap: 12px; align-items: flex-start !important; }
    .fli-stat-row { grid-template-columns: 1fr 1fr !important; }
    .fli-card-body { padding: 16px; }
    .fli-btn, .fli-input { height: 44px; }
  }
  @media (max-width: 480px) {
    .fli-stat-row { grid-template-columns: 1fr !important; }
    .fli-grid-4 { grid-template-columns: 1fr !important; }
    .fli-tab-btn { padding: 0 12px; }
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
  const bg = type === 'success' ? 'var(--color-success)' : type === 'error' ? 'var(--color-danger)' : 'var(--color-warning)';
  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, background: bg, color: '#fff',
      padding: '12px 16px', fontWeight: 500, fontSize: 14, zIndex: 99999,
      display: 'flex', alignItems: 'center', gap: 10, minWidth: 280, maxWidth: 420,
      boxShadow: '0 4px 12px rgba(0,0,0,0.08)', borderLeft: '4px solid rgba(255,255,255,0.5)',
      borderRadius: 8, animation: 'fliSlideIn .25s ease'
    }}>
      {type === 'success' ? <CheckCircle size={16} /> : type === 'error' ? <XCircle size={16} /> : <AlertTriangle size={16} />}
      <span style={{ lineHeight: 1.4 }}>{message}</span>
      <button onClick={onClose} className="fli-toast-close" style={{ marginLeft: 'auto' }}>✕</button>
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
    ctx.strokeStyle = '#2563EB'; ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke();
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
    <div style={{ border: `1px solid ${saved ? 'var(--color-success)' : 'var(--color-border)'}`, borderRadius: 8, overflow: 'hidden', background: 'white', transition: 'border-color .2s' }}>
      <canvas ref={canvasRef} width={300} height={120}
        onMouseDown={startDraw} onMouseMove={draw} onMouseUp={stopDraw} onMouseLeave={stopDraw}
        style={{ width: '100%', height: 120, display: 'block', cursor: 'crosshair', background: isEmpty ? 'var(--color-bg-page)' : 'white', touchAction: 'none' }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', background: 'var(--color-bg-page)', borderTop: '1px solid var(--color-border)' }}>
        <span style={{ fontSize: 10, color: saved ? 'var(--color-success)' : 'var(--color-text-muted)', fontWeight: 500 }}>{isEmpty ? 'Draw signature' : saved ? '✓ Saved' : 'Unsaved'}</span>
        <button type="button" onClick={handleClear} className="fli-sig-clear">Clear</button>
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
  const [printingVerified, setPrintingVerified] = useState(false);
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
      <SegmentedSpinner size={32} />
      <p style={{ color: 'var(--color-text-secondary)', fontWeight: 500 }}>Loading transactions...</p>
    </div>
  );

  /* Approved confirmation */
  if (approved) return (
    <div className="fli-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
      <style>{G}</style>
      <div style={{ width: 72, height: 72, background: 'var(--color-success-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}>
        <CheckCircle size={40} color="var(--color-success)" />
      </div>
      <h2 style={{ color: 'var(--color-text-primary)', margin: 0, fontSize: 24, fontWeight: 700 }}>Approved &amp; Recorded!</h2>
      <p style={{ color: 'var(--color-text-secondary)' }}>Income recorded in the Receivables Book. Redirecting...</p>
    </div>
  );

  if (!detail) return <div className="fli-page"><style>{G}</style><p style={{ color: 'var(--color-danger)' }}>{error || 'No data.'}</p></div>;

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

  const isPrinting = (submission.department || '').toLowerCase() === 'printing';
  const isRetail = (submission.department || '').toLowerCase().includes('retail');
  const isPharmacy = (submission.department || '').toLowerCase() === 'pharmacy';
  const isCarRental = (submission.department || '').toLowerCase() === 'car rental';
  const isAgrirent = (submission.department || '').toLowerCase().includes('agrirent')
    || (submission.department || '').toLowerCase().includes('agri rent')
    || (submission.department || '').toLowerCase() === 'agrirent';
  // Module-based departments that record their own invoice/payment details —
  // these always show the exact Bank/Telebirr/Cash verification (like Printing)
  // instead of a generic checkbox list or cash-count flow.
  const isModuleDept = isPrinting || isRetail || isPharmacy || isCarRental || isAgrirent;
  const proofUrl = getImageUrl(manualDetails?.proofImagePath || manualDetails?.payment_screenshot);

  // ── Smart payment-detail derivation ─────────────────────────────
  // Pulls the MOST reliable payment info available for this submission,
  // preferring per-transaction details (bulk sales) over the single
  // manual_details record — so every department shows exact Bank/Telebirr/
  // Cash info with numbers, never duplicated.
  const firstTxnPayment = Array.isArray(transactions) && transactions.length > 0
    ? transactions.find(t => t.payment_method) || transactions[0]
    : null;
  const txPayMethod = firstTxnPayment?.payment_method || '';
  const mdPayMethod = manualDetails?.paymentMethod || '';
  const payMethodRaw = txPayMethod || mdPayMethod;
  const payMethod = String(payMethodRaw || '').toLowerCase().trim();

  // Normalize the raw method (e.g. "Mobile Wallet / TELEBIR", "Bank / CBE",
  // "Bank Transfer") into tokens so Bank / Mobile / Cash are detected the same
  // way no matter how the module stored the value.
  const pm = payMethod.replace(/[\/_#-]/g, ' ').replace(/\s+/g, ' ').trim();
  const isCBE = /cbe/.test(pm) || pm === 'cbe';
  const isCashMethod = pm === 'cash' || /cash on|cash_on|in person|in-person|delivered/.test(pm) || pm.includes('cash');
  const isCashRaw = isCashMethod;
  const isTelebirr = isCBE === false && !isCashRaw && (/telebirr?|tele birr|telbir|wallet|mobile|chapa|amole/.test(pm));
  const isAwash = /awash/.test(pm);
  const isBankTransfer = isCBE || isAwash || /bank|transfer|credit/.test(pm);

  // Aggregate the distinct payment methods used across transactions so the
  // confirm block reflects reality (e.g. a mix of cash + telebirr sales).
  const usedMethods = {};
  if (Array.isArray(transactions)) {
    transactions.forEach(t => {
      const m = String(t.payment_method || '').toLowerCase().trim();
      if (m) usedMethods[m] = (usedMethods[m] || 0) + 1;
    });
  }
  const hasTxnPayment = Object.keys(usedMethods).length > 0;

  // Across all transactions: cash only when NONE of them is bank/telebirr.
  const isCash = isCashMethod || (hasTxnPayment && !Object.keys(usedMethods).some(m => { const t = String(m).toLowerCase(); return /bank|tele|wallet|cbe|awash|transfer|mobile/.test(t); }));

  // The exact numbers to verify against (first available wins)
  const bankName = firstTxnPayment?.bank_name || manualDetails?.bankName || manualDetails?.bankDetails?.bankName;
  const bankAcct = firstTxnPayment?.account_number || manualDetails?.accountNumber || manualDetails?.bankDetails?.accountNumber;
  const bankHolder = firstTxnPayment?.account_holder || manualDetails?.bankDetails?.accountHolder;
  const telebirrNum = firstTxnPayment?.telbir_number || manualDetails?.telebirrNumber || manualDetails?.telebirrDetails?.telebirrNumber;
  const telebirrName = manualDetails?.telebirrDetails?.fullName || manualDetails?.receivedFrom;
  const paymentRef = manualDetails?.paymentReference || manualDetails?.paymentAccount || submission.reference_no || firstTxnPayment?.receipt_no || '—';

  // Prefer the exact-detail block whenever we have a concrete payment number
  // or reference to verify (bank/telebirr number, transaction method, etc.).
  // Otherwise fall back to the generic checklist for summary submissions.
  const hasExactDetail = !!txPayMethod || !!mdPayMethod || !!telebirrNum || !!bankAcct || !!manualDetails?.paymentReference || !!manualDetails?.paymentAccount;
  const isExactVerify = isModuleDept || hasExactDetail;

  // Module-based departments always use the exact-detail verification (Bank/
  // Telebirr/Cash shown cleanly, single confirm — like Printing) rather than
  // the generic checkbox list or the cash-count flow.
  const isDigitalPayment = (isModuleDept || hasExactDetail) && (isModuleDept || !isCash);
  const showExactPayment = isModuleDept || isDigitalPayment;

  const anyCheckDone = verifyChecks.bankChecked || verifyChecks.telebirrChecked || verifyChecks.confirmedInPerson;
  const readyToVerify = financeName && financeSignature && submission.status === 'Pending'
    && (isExactVerify ? printingVerified : anyCheckDone);

  return (
    <div className="fli-page">
      <style>{G}</style>
      <Toasts />

      {/* Reject Modal */}
      {rejectModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: '#fff', padding: '28px', maxWidth: 440, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.25)', borderRadius: 12 }}>
            <h3 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 700, color: 'var(--color-danger)', borderBottom: '1px solid var(--color-border)', paddingBottom: 12 }}>Reject Submission</h3>
            <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', margin: '12px 0 16px' }}>Provide a clear reason so the submitter can correct and resubmit.</p>
            <textarea
              autoFocus
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="e.g. Screenshot unclear, amount mismatch..."
              rows={4}
              className="fli-input"
              style={{ resize: 'vertical', height: 'auto', padding: '10px 12px' }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
              <button className="fli-btn fli-btn-secondary" onClick={() => { setRejectModal(false); setRejectReason(''); }}>Cancel</button>
              <button
                className="fli-btn fli-btn-danger"
                onClick={handleReject}
                disabled={!rejectReason.trim() || rejecting}
              >{rejecting ? 'Rejecting...' : 'Confirm Rejection'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }} className="fli-header-row">
        <button className="fli-btn fli-btn-secondary" onClick={onBack}>
          <ArrowLeft size={15} /> Back to List
        </button>
        <button className="fli-btn fli-btn-primary" onClick={handlePrint}>
          <Printer size={14} /> Print Detail
        </button>
      </div>

      {/* PRINTABLE CONTENT */}
      <div ref={printRef}>

        {/* Letter Header Card */}
        <div className="fli-card">
          <div style={{ padding: '24px 28px', borderBottom: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', background: '#2563EB', borderTopLeftRadius: 10, borderTopRightRadius: 10 }}>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: '#FFFFFF', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '-0.5px' }}>Sutana Enterprise</h1>
              <p style={{ margin: 0, color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>Integrated Business Management System</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: 'monospace', fontSize: 18, fontWeight: 700, color: '#FFFFFF', letterSpacing: 2 }}>{submission.reference_no || `INC-${submission.id}`}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 4 }}>INCOME VERIFICATION</div>
            </div>
          </div>

          <div style={{ padding: '24px 28px' }}>
            <p style={{ textAlign: 'center', fontWeight: 600, fontSize: 14, color: '#2563EB', textTransform: 'uppercase', letterSpacing: 1.5, margin: '0 0 20px', borderBottom: '1px solid #E5E7EB', paddingBottom: 12 }}>
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
                <div key={label} style={{ background: highlight ? '#2563EB' : '#F5F6FA', padding: '14px 16px', border: '1px solid #E5E7EB', borderRadius: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: highlight ? 'rgba(255,255,255,0.8)' : '#9CA3AF', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: 5 }}>
                    {icon} {label}
                  </div>
                  <div style={{ fontSize: highlight ? 17 : 14, fontWeight: 700, color: highlight ? '#FFFFFF' : '#111827' }}>{value}</div>
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
              <div style={{ padding: '30px', textAlign: 'center', background: '#F5F6FA', border: '1px solid #E5E7EB', borderRadius: 8 }}>
                <h4 style={{ margin: '0 0 10px', color: '#111827', fontSize: 16, fontWeight: 600 }}>Summary Submission Record</h4>
                <p style={{ margin: '0 0 16px', color: '#6B7280', fontSize: 13 }}>No individual transaction breakdown is available for this bulk entry.</p>
                <div style={{ display: 'inline-flex', flexDirection: 'column', background: '#fff', border: '1px solid #E5E7EB', padding: '16px 24px', textAlign: 'left', minWidth: 300, borderRadius: 8 }}>
                  <div style={{ fontSize: 11, fontWeight: 500, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: 4 }}>Submission Details</div>
                  <div style={{ fontSize: 14, color: '#111827', marginBottom: 12 }}>{submission.description || 'No description provided.'}</div>
                  <div style={{ fontSize: 11, fontWeight: 500, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: 4 }}>Total Recorded Amount</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#2563EB' }}>ETB {fmt(submission.amount || systemTotal)}</div>
                </div>

                <div style={{ marginTop: 24, padding: '20px 24px', background: isCash ? '#DCFCE7' : (isTelebirr ? '#FEF3C7' : '#E0F2FE'), border: `1px solid ${isCash ? '#16A34A' : (isTelebirr ? '#D97706' : '#0284C7')}`, textAlign: 'left', borderRadius: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: isCash ? '#16A34A' : (isTelebirr ? '#D97706' : '#0284C7'), textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: 8 }}>Payment Method</div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: isCash ? '#16A34A' : (isTelebirr ? '#D97706' : '#0284C7') }}>
                    {isCash ? 'CASH' : isTelebirr ? 'TELEBIRR' : isBankTransfer ? 'BANK' : String(payMethodRaw || 'PAYMENT').toUpperCase()}
                  </div>
                  {!isCash && (
                    <div style={{ fontSize: 13, color: '#6B7280', marginTop: 8 }}>
                      {isTelebirr
                        ? <>Number: <strong style={{ color: '#111827' }}>{telebirrNum || '0901407032'} — SUTANA WALLET</strong></>
                        : isBankTransfer
                          ? <>Account: <strong style={{ color: '#111827' }}>{bankAcct ? `${bankName || 'Bank'} ${bankAcct}` : '1000675227776 — SUTANA'}</strong></>
                          : <strong style={{ color: '#111827' }}>{String(payMethodRaw || 'verify against screenshot').toUpperCase()}</strong>}
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
                    <div key={label} style={{ background: highlight ? '#DCFCE7' : '#F5F6FA', padding: 16, border: '1px solid #E5E7EB', borderRadius: 8 }}>
                      <div style={{ fontSize: 11, fontWeight: 500, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: 4 }}>{label}</div>
                      <div style={{ fontSize: 15, fontWeight: 600, color: '#111827' }}>{value}</div>
                    </div>
                  ))}
                </div>

                {/* Car Rental Details */}
                {submission.department === 'Car Rental' && manualDetails.carName && (
                  <div style={{ background: '#F5F6FA', padding: 20, border: '1px solid #E5E7EB', marginBottom: 20, borderRadius: 8 }}>
                    <h4 style={{ margin: '0 0 16px', fontSize: 14, color: '#111827', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Car size={18} color="#2563EB" /> Car Rental Order Details
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }} className="fli-grid-2">
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 500, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: 4 }}>Vehicle</div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{manualDetails.carName}</div>
                        {manualDetails.licensePlate && <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>Plate: {manualDetails.licensePlate}</div>}
                      </div>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 500, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: 4 }}>Rental Period</div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{manualDetails.totalDays} Day{manualDetails.totalDays !== 1 ? 's' : ''}</div>
                        <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>{fmtDate(manualDetails.pickupDate)} — {fmtDate(manualDetails.returnDate)}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 500, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: 4 }}>Driver</div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{manualDetails.driverName || manualDetails.receivedFrom}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 500, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: 4 }}>Rate &amp; Fees</div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{fmt(manualDetails.dailyRate)} ETB / day</div>
                        {manualDetails.additionalOwed > 0 && (
                          <div style={{ fontSize: 12, color: '#DC2626', marginTop: 2, fontWeight: 600 }}>Additional Owed: ETB {fmt(manualDetails.additionalOwed)}</div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Bank Details */}
                {manualDetails.paymentMethod === 'Bank' && manualDetails.bankDetails && (
                  <div style={{ background: '#E0F2FE', padding: 20, border: '1px solid #0284C7', marginBottom: 20, borderRadius: 8 }}>
                    <h4 style={{ margin: '0 0 12px', fontSize: 13, color: '#0284C7', fontWeight: 600 }}>Bank Details</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 13 }} className="fli-grid-2">
                      <div><strong style={{ color: '#111827' }}>Bank Name:</strong> {manualDetails.bankDetails.bankName}</div>
                      <div><strong style={{ color: '#111827' }}>Account Holder:</strong> {manualDetails.bankDetails.accountHolder}</div>
                      <div><strong style={{ color: '#111827' }}>Account Number:</strong> {manualDetails.bankDetails.accountNumber}</div>
                      {manualDetails.bankDetails.chequeNo && <div><strong style={{ color: '#111827' }}>Cheque No:</strong> {manualDetails.bankDetails.chequeNo}</div>}
                    </div>
                  </div>
                )}

                {/* Telebirr Details */}
                {manualDetails.paymentMethod === 'Telebirr' && manualDetails.telebirrDetails && (
                  <div style={{ background: '#FEF3C7', padding: 20, border: '1px solid #D97706', marginBottom: 20, borderRadius: 8 }}>
                    <h4 style={{ margin: '0 0 12px', fontSize: 13, color: '#D97706', fontWeight: 600 }}>Telebirr Details</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 13 }} className="fli-grid-2">
                      <div><strong style={{ color: '#111827' }}>Telebirr Number:</strong> {manualDetails.telebirrDetails.telebirrNumber}</div>
                      <div><strong style={{ color: '#111827' }}>Full Name:</strong> {manualDetails.telebirrDetails.fullName}</div>
                    </div>
                  </div>
                )}

                {/* Online Payment Proof */}
                {(manualDetails.paymentReference || manualDetails.proofImagePath) && (
                  <div style={{ background: '#F5F6FA', padding: 20, border: '1px solid #E5E7EB', marginBottom: 20, borderRadius: 8 }}>
                    <h4 style={{ margin: '0 0 16px', fontSize: 14, color: '#111827', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <FileText size={16} color="#2563EB" /> Online Payment Verification
                    </h4>
                    {manualDetails.paymentAccount ? (
                      <div style={{ background: '#E0F2FE', padding: 12, border: '1px solid #E5E7EB', fontSize: 14, color: '#111827', marginBottom: 16, borderRadius: 8 }}>
                        <strong>Customer deposited to:</strong><br />💳 <strong>{manualDetails.paymentAccount}</strong>
                      </div>
                    ) : (
                      <div style={{ background: '#E0F2FE', padding: 12, border: '1px solid #E5E7EB', fontSize: 13, color: '#111827', marginBottom: 16, borderRadius: 8 }}>
                        <strong>Expected Accounts:</strong><br />
                        💳 Telebirr: <strong>0901407032</strong> (SUTANA WALLET)<br />
                        🏦 CBE Bank: <strong>1000675227776</strong> (SUTANA)
                      </div>
                    )}
                    {manualDetails.paymentReference && (
                      <div style={{ marginBottom: 16 }}>
                        <div style={{ fontSize: 11, fontWeight: 500, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: 4 }}>Transaction ID / Reference</div>
                        <div style={{ fontSize: 18, fontWeight: 700, color: '#111827', letterSpacing: 1 }}>{manualDetails.paymentReference}</div>
                      </div>
                    )}
                    {manualDetails.proofImagePath && (
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 500, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: 8 }}>Attached Payment Proof</div>
                        <img
                          src={getImageUrl(manualDetails.proofImagePath)}
                          alt="Payment Proof"
                          style={{ maxWidth: '100%', maxHeight: 400, border: '1px solid #E5E7EB', borderRadius: 8 }}
                        />
                        <a href={getImageUrl(manualDetails.proofImagePath)} target="_blank" rel="noreferrer"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 8, fontSize: 12, color: '#FFFFFF', fontWeight: 500, textDecoration: 'none', background: '#2563EB', padding: '6px 12px', borderRadius: 8 }}>
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
                    <div style={{ borderTop: '1px dashed #E5E7EB', paddingTop: 24, marginTop: 12 }}>
                      <h4 style={{ margin: '0 0 16px', fontSize: 14, color: '#111827', fontWeight: 600 }}>Signatures</h4>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
                        {hasWalkInSigs && [
                          { label: 'Prepared By', name: manualDetails.preparedBy, sigImage: manualDetails.preparedSignature },
                          { label: 'Checked By', name: manualDetails.checkedBy, sigImage: manualDetails.checkedSignature },
                          { label: 'Receiver', name: manualDetails.receiverName, sigImage: manualDetails.receiverSignature }
                        ].map(({ label, name, sigImage }) => (
                          <div key={label} style={{ flex: 1, minWidth: 150, textAlign: 'center' }}>
                            <div style={{ height: 80, border: '1px solid #E5E7EB', marginBottom: 8, overflow: 'hidden', background: '#F5F6FA', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8 }}>
                              {sigImage ? <img src={sigImage} alt={label} style={{ maxHeight: 75, maxWidth: '100%', objectFit: 'contain' }} /> : <span style={{ color: '#9CA3AF', fontSize: 11 }}>No signature</span>}
                            </div>
                            <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: 8 }}>
                              <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{name || '—'}</div>
                              <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>{label}</div>
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
                  ONLINE: { bg: '#DCFCE7', color: '#16A34A', label: 'Online' },
                  'WALK-IN': { bg: '#DCFCE7', color: '#16A34A', label: 'Walk-In' },
                  RETURNED: { bg: '#FEE2E2', color: '#DC2626', label: 'Return' },
                };
                const typeInfo = typeColors[txn.sale_type] || { bg: '#F5F6FA', color: '#6B7280', label: txn.sale_type };
                return (
                  <div key={txn.id}>
                    <div style={{ marginBottom: 4 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ background: '#2563EB', color: 'white', width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600, borderRadius: '50%' }}>{idx + 1}</div>
                          <div>
                            <div style={{ fontFamily: 'monospace', fontWeight: 600, color: '#2563EB', fontSize: 14 }}>{txn.receipt_no}</div>
                            <div style={{ fontSize: 11, color: '#6B7280' }}>{fmtDate(txn.created_at)}</div>
                          </div>
                          <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 10px', fontSize: 12, fontWeight: 500, background: typeInfo.bg, color: typeInfo.color, border: '1px solid', borderColor: typeInfo.color, borderRadius: 999 }}>{typeInfo.label}</span>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 20, fontWeight: 700, color: txn.sale_type === 'RETURNED' ? '#DC2626' : '#16A34A', fontVariantNumeric: 'tabular-nums' }}>
                            {txn.sale_type === 'RETURNED' ? '−' : ''}ETB {fmt(txn.total_amount)}
                          </div>
                          <div style={{ fontSize: 11, color: '#9CA3AF' }}>Running: ETB {fmt(runningTotal[idx])}</div>
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
                          <div key={label} style={{ background: highlight ? '#DCFCE7' : '#F5F6FA', padding: '9px 12px', border: '1px solid #E5E7EB', borderRadius: 8 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#9CA3AF', fontSize: 10, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: 3 }}>{icon} {label}</div>
                            <div style={{ fontSize: 12, fontWeight: 600, color: '#111827' }}>{value}</div>
                          </div>
                        ))}
                      </div>

                      {txn.items && txn.items.length > 0 && (
                        <div style={{ overflowX: 'auto', marginBottom: 4 }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, minWidth: 600, fontVariantNumeric: 'tabular-nums' }}>
                            <thead>
                              <tr style={{ background: '#F9FAFB' }}>
                                {['#', 'Drug / Product', 'Qty', 'Unit Price (ETB)', 'Total (ETB)'].map(h => (
                                  <th key={h} style={{ padding: '10px 12px', textAlign: h.includes('ETB') || h === 'Qty' ? 'right' : 'left', color: '#6B7280', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.03em', borderBottom: '1px solid #E5E7EB' }}>{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {txn.items.map((item, i) => (
                                <tr key={i} className="fli-row-hover" style={{ borderBottom: '1px solid #E5E7EB' }}>
                                  <td style={{ padding: '8px 12px', color: '#9CA3AF', fontSize: 11 }}>{i + 1}</td>
                                  <td style={{ padding: '8px 12px', fontWeight: 600, color: '#111827' }}>{item.drug_name}</td>
                                  <td style={{ padding: '8px 12px', textAlign: 'right' }}>{item.quantity}</td>
                                  <td style={{ padding: '8px 12px', textAlign: 'right' }}>{fmt(item.unit_price)}</td>
                                  <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, color: '#16A34A' }}>{fmt(item.total_price)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                    {idx < transactions.length - 1 && <hr style={{ border: 'none', borderTop: '1px dashed #E5E7EB', margin: '20px 0' }} />}
                  </div>
                );
              })
            )}

            {/* Running Total Row */}
            {transactions.length > 0 && (
              <div style={{ marginTop: 24, padding: '16px 20px', background: '#2563EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: 8 }}>
                <span style={{ color: 'rgba(255,255,255,0.8)', fontWeight: 600, fontSize: 13 }}>SYSTEM TOTAL ({transactionCount} transactions)</span>
                <span style={{ color: '#FFFFFF', fontWeight: 700, fontSize: 22, fontVariantNumeric: 'tabular-nums' }}>ETB {fmt(systemTotal)}</span>
              </div>
            )}
          </div>
        </div>
      </div>{/* end printRef */}

      {/* ══ DEPARTMENT-AWARE VERIFICATION SECTION ══ */}
      {showExactPayment ? (
        /* Digital Payment Verification */
        <div className="fli-card">
          <div className="fli-card-header">
            <h3><CheckCircle size={16} /> Payment Verification — {submission.department}</h3>
            {submission.status !== 'Pending' && (
              <span className="fli-badge" style={{ background: 'var(--color-success-bg)', color: 'var(--color-success)' }}>✓ Verified</span>
            )}
          </div>
          <div className="fli-card-body">
            <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', margin: '0 0 20px' }}>
              Review the payment submitted and verify using the steps below.
            </p>

            {/* Amount to verify */}
            <div style={{ background: 'var(--color-primary)', padding: '18px 20px', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: 8 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: 4 }}>💰 Amount to Verify</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)' }}>{submission.department} — {submission.reference_no || submission.description || '—'}</div>
              </div>
              <div style={{ fontSize: 36, fontWeight: 700, color: '#FFFFFF', fontVariantNumeric: 'tabular-nums' }}>ETB {fmt(systemTotal)}</div>
            </div>

            {/* Payment method indicators — smart, exact account/wallet numbers */}
            {isBankTransfer && (
              <div style={{ background: 'var(--color-primary)', padding: '18px 24px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12, borderRadius: 8 }}>
                <div style={{ background: 'rgba(255,255,255,0.15)', padding: '8px 10px', fontSize: 20, borderRadius: 8 }}>🏦</div>
                <div>
                  <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>{isAwash ? 'AWASH BANK TRANSFER' : 'BANK TRANSFER'}</div>
                  <div style={{ color: '#FFFFFF', fontWeight: 600 }}>Account: {bankAcct ? `${bankName || 'Bank'} ${bankAcct}${bankHolder ? ' — ' + bankHolder : ''}` : '1000675227776 — SUTANA'}</div>
                  <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 4 }}>Login to {isAwash ? 'Awash' : 'CBE Internet'} Banking to confirm ETB {fmt(systemTotal)}</div>
                </div>
              </div>
            )}
            {isTelebirr && (
              <div style={{ background: 'var(--color-warning)', padding: '18px 24px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12, borderRadius: 8 }}>
                <div style={{ background: 'rgba(255,255,255,0.2)', padding: '8px 10px', fontSize: 20, borderRadius: 8 }}>📱</div>
                <div>
                  <div style={{ color: '#FFFFFF', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>TELEBIRR PAYMENT</div>
                  <div style={{ color: '#FFFFFF', fontWeight: 600 }}>Number: {telebirrNum ? `${telebirrNum}${telebirrName ? ' — ' + telebirrName : ''}` : '0901407032 — SUTANA WALLET'}</div>
                  <div style={{ color: '#FFFFFF', fontSize: 12, marginTop: 4, opacity: 0.85 }}>Check Telebirr app to confirm ETB {fmt(systemTotal)}</div>
                </div>
              </div>
            )}

            {/* Proof image */}
            {proofUrl ? (
              <div style={{ background: 'var(--color-bg-page)', padding: '20px', marginBottom: 20, border: '1px solid var(--color-border)', borderRadius: 8 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-primary)', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <FileText size={14} /> Customer Payment Screenshot
                </div>
                <img src={proofUrl} alt="Payment Proof"
                  style={{ maxWidth: '100%', maxHeight: 420, border: '1px solid var(--color-border)', borderRadius: 8, display: 'block' }}
                  onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                />
                <div style={{ display: 'none', background: 'var(--color-danger-bg)', border: '1px solid var(--color-danger)', padding: '16px', borderRadius: 8, alignItems: 'center', gap: 8, color: 'var(--color-danger)', fontSize: 13 }}>
                  <AlertTriangle size={16} /> Image failed to load.
                </div>
                <a href={proofUrl} target="_blank" rel="noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 10, fontSize: 12, color: '#FFFFFF', fontWeight: 500, textDecoration: 'none', background: 'var(--color-primary)', padding: '6px 12px', borderRadius: 8 }}>
                  <Eye size={13} /> Open Full-Size Image
                </a>
              </div>
            ) : (
              <div style={{ background: 'var(--color-warning-bg)', border: '1px solid var(--color-warning)', padding: '16px 20px', marginBottom: 20, fontSize: 13, color: 'var(--color-warning)', borderRadius: 8 }}>
                <strong>⚠ No screenshot uploaded.</strong> Verify the payment in the bank app or Telebirr before approving.
              </div>
            )}

            {/* Verify Method — Exact Bank/Telebirr/Cash details for all departments with a verifiable payment; generic checklist only for summaries without exact details */}
            {isExactVerify ? (
              (() => {
                const firstTxn = Array.isArray(transactions) && transactions[0] ? transactions[0] : null;
                const txnMethod = String(firstTxn?.payment_method || '').toLowerCase().trim();
                const method = txnMethod || mdPayMethod || String(manualDetails?.paymentMethod || '').toLowerCase().trim();
                // Prefer aggregated transaction methods when available (bulk
                // sales), falling back to the single manual method.
                const aggKey = Object.keys(usedMethods).map(k => k.toLowerCase());
                const aggIsTele = aggKey.some(m => /tele|telbir|wallet|mobile/.test(m));
                const aggIsBank = aggKey.some(m => /bank|cbe|awash|transfer/.test(m));
                const isTele = aggIsTele || isTelebirr || /tele|telbir|wallet|mobile/.test(method);
                const isBank = aggIsBank || isBankTransfer || isCBE || isAwash || /bank|cbe|awash|transfer/.test(method);
                const txRef = paymentRef;
                const payerDetail = telebirrNum || bankAcct || firstTxn?.recipient_phone || firstTxn?.sender_phone || manualDetails?.telebirrNumber || manualDetails?.accountNumber || '';
                const custName = manualDetails?.receivedFrom || firstTxn?.recipient_name || '';
                const isCashVerify = !isPrinting && (isCash || /cash/.test(method) || (aggKey.length > 0 && !aggIsTele && !aggIsBank));
                return (
                  <div style={{ background: 'var(--color-bg-page)', padding: '20px', marginBottom: 20, border: '1.5px solid var(--color-primary)', borderRadius: 8 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <CheckCircle size={15} /> Exact Payment Details — Verify &amp; Confirm
                    </div>

                    {/* Destination account / wallet */}
                    <div style={{ background: isCashVerify ? '#E7F6EF' : (isTele ? '#FEF3C7' : (isBank ? '#E0F2FE' : '#FEF2F2')), border: `1px solid ${isCashVerify ? '#16A34A' : (isTele ? '#D97706' : (isBank ? '#0284C7' : '#DC2626'))}`, padding: '16px 18px', marginBottom: 14, borderRadius: 8 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: isCashVerify ? '#15803D' : (isTele ? '#D97706' : (isBank ? '#0284C7' : '#DC2626')), textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: 8 }}>
                        {isCashVerify ? '💵 Expected — Cash Payment' : (isTele ? '📱 Expected Destination — Telebirr Wallet' : (isBank ? '🏦 Expected Destination — Bank Account' : '💳 Payment Method — verify from screenshot'))}
                      </div>
                      {isCashVerify ? (
                        <div style={{ fontSize: 15, fontWeight: 600, color: '#111827' }}>Cash of ETB {fmt(systemTotal)} received at the store counter / office</div>
                      ) : isTele ? (
                        telebirrNum
                          ? <div style={{ fontSize: 18, fontWeight: 700, color: '#111827', fontVariantNumeric: 'tabular-nums' }}>{telebirrNum}{telebirrName ? ' — ' + telebirrName : ''}</div>
                          : <div style={{ fontSize: 18, fontWeight: 700, color: '#111827', fontVariantNumeric: 'tabular-nums' }}>0901407032 — SUTANA WALLET</div>
                      ) : isBank ? (
                        bankAcct
                          ? <div style={{ fontSize: 18, fontWeight: 700, color: '#111827', fontVariantNumeric: 'tabular-nums' }}>{bankName || 'Bank'} {bankAcct}{bankHolder ? ' — ' + bankHolder : ''}</div>
                          : <div style={{ fontSize: 18, fontWeight: 700, color: '#111827', fontVariantNumeric: 'tabular-nums' }}>CBE Bank 1000675227776 — SUTANA</div>
                      ) : (
                        <div style={{ fontSize: 18, fontWeight: 700, color: '#111827', fontVariantNumeric: 'tabular-nums' }}>
                          Paid to SUTANA via <strong>{String(method || mdPayMethod || 'unspecified method').toUpperCase()}</strong> — confirm the exact channel (Bank / Telebirr / Cash) from the customer's screenshot below.
                        </div>
                      )}
                    </div>

                    {/* Customer transaction reference */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }} className="fli-grid-2">
                      <div style={{ background: '#fff', border: '1px solid var(--color-border)', padding: '14px 16px', borderRadius: 8 }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: 6 }}>Transaction ID / Reference</div>
                        <div style={{ fontSize: 18, fontWeight: 700, color: '#111827', fontFamily: 'monospace', letterSpacing: 1 }}>{txRef}</div>
                      </div>
                      <div style={{ background: '#fff', border: '1px solid var(--color-border)', padding: '14px 16px', borderRadius: 8 }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: 6 }}>Amount</div>
                        <div style={{ fontSize: 18, fontWeight: 700, color: '#16A34A', fontVariantNumeric: 'tabular-nums' }}>ETB {fmt(systemTotal)}</div>
                      </div>
                    </div>
                    {(custName || payerDetail) && (
                      <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 10 }}>
                        {isPrinting && manualDetails?.receivedFrom
                          ? <>Paid by: <strong style={{ color: '#111827' }}>{manualDetails.receivedFrom}</strong></>
                          : <>
                              {custName ? <>Customer/Payer: <strong style={{ color: '#111827' }}>{custName}</strong></> : null}
                              {payerDetail ? <> {custName ? '·' : ''} Payer {isTele ? 'Telebirr' : isBank ? 'Bank' : ''} #: <strong style={{ color: '#111827', fontFamily: 'monospace' }}>{payerDetail}</strong></> : null}
                            </>}
                      </div>
                    )}

                    <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', margin: '14px 0 12px' }}>
                      {isCashVerify ? (
                        <>Confirm the <strong style={{ color: '#111827' }}>cash of ETB {fmt(systemTotal)}</strong> was received and counted at the store, matching the receipt / transaction above.</>
                      ) : isTele || isBank ? (
                        <>Check the <strong style={{ color: '#111827' }}>{isTele ? 'Telebirr app' : 'bank statement / app'}</strong> for an incoming
                        transfer of <strong style={{ color: '#16A34A' }}>ETB {fmt(systemTotal)}</strong> with reference
                        <strong style={{ color: '#111827', fontFamily: 'monospace' }}> {txRef}</strong> to the destination above, then confirm.</>
                      ) : (
                        <>Review the customer's payment screenshot / reference <strong style={{ color: '#111827', fontFamily: 'monospace' }}>{txRef}</strong> and confirm the
                        <strong style={{ color: '#16A34A' }}> ETB {fmt(systemTotal)}</strong> payment arrived via bank, Telebirr or cash before approving.</>
                      )}
                    </p>

                    {submission.status === 'Pending' && (
                      <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', padding: '12px 14px', background: printingVerified ? 'var(--color-success-bg)' : '#fff', border: `1px solid ${printingVerified ? 'var(--color-success)' : 'var(--color-border)'}`, borderRadius: 8, fontSize: 13, fontWeight: 600, color: printingVerified ? 'var(--color-success)' : 'var(--color-text-primary)', lineHeight: 1.5 }}>
                        <input
                          type="checkbox"
                          checked={printingVerified}
                          onChange={e => setPrintingVerified(e.target.checked)}
                          style={{ width: 16, height: 16, accentColor: 'var(--color-success)', cursor: 'pointer', marginTop: 2, flexShrink: 0 }}
                        />
                        <span>
                          {isCashVerify
                            ? <>✅ I confirmed the CASH of ETB {fmt(systemTotal)} was received and counted at the store.</>
                            : isTele || isBank
                              ? <>✅ I verified this EXACT payment ({isTele ? 'Telebirr ' + txRef : 'Bank ' + txRef}) of ETB {fmt(systemTotal)} in the {isTele ? 'Telebirr app' : 'bank account'} above.</>
                              : <>✅ I reviewed the screenshot / reference and confirmed ETB {fmt(systemTotal)} was received via {String(manualDetails?.paymentMethod || 'bank, Telebirr or cash').toUpperCase()}.</>}
                        </span>
                      </label>
                    )}
                  </div>
                );
              })()
            ) : (
              <div style={{ background: 'var(--color-bg-page)', padding: '20px', marginBottom: 20, border: '1px solid var(--color-border)', borderRadius: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-primary)', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: 14 }}>✅ Finance Verification — confirm at least one:</div>
              {[
                isCBE && { key: 'bankChecked', label: '🏦 Logged into CBE Bank — found ETB ' + fmt(systemTotal) + ' transfer confirmed' },
                isTelebirr && { key: 'telebirrChecked', label: '📱 Checked Telebirr — ETB ' + fmt(systemTotal) + ' payment found confirmed' },
                isAwash && { key: 'bankChecked', label: '🏦 Checked Awash Bank — found ETB ' + fmt(systemTotal) + ' transfer confirmed' },
                isCash && { key: 'confirmedInPerson', label: '💵 Cash of ETB ' + fmt(systemTotal) + ' received and counted in person' },
                isBankTransfer && isCBE === false && isAwash === false && { key: 'bankChecked', label: '🏦 Confirmed the bank transfer of ETB ' + fmt(systemTotal) + ' in the bank account' },
                !isBankTransfer && !isTelebirr && !isCash && { key: 'confirmedInPerson', label: '💵 Payment of ETB ' + fmt(systemTotal) + ' received and verified in person — method: ' + (manualDetails?.paymentMethod || 'unspecified') },
                !isCash && !isTelebirr && { key: 'confirmedInPerson', label: '💵 Payment received and verified in person / office' },
              ].filter(Boolean).map(({ key, label }) => (
                <label key={key + label} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', padding: '10px 0', borderBottom: '1px solid var(--color-border)', fontSize: 13, fontWeight: 500, color: verifyChecks[key] ? 'var(--color-text-primary)' : 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                  <input
                    type="checkbox"
                    checked={verifyChecks[key]}
                    onChange={e => setVerifyChecks(p => ({ ...p, [key]: e.target.checked }))}
                    style={{ width: 16, height: 16, accentColor: 'var(--color-primary)', cursor: 'pointer', marginTop: 2, flexShrink: 0 }}
                  />
                  {label}
                </label>
              ))}
              </div>
            )}

            {/* Finance Signature */}
            <div style={{ background: '#fff', border: '1px solid var(--color-border)', padding: '24px', marginBottom: 20, borderRadius: 10 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <PenTool size={16} color="var(--color-text-secondary)" /> Finance Officer Signature
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }} className="fli-grid-2">
                <div>
                  <label className="fli-label">Finance Officer Name *</label>
                  <input value={financeName} readOnly className="fli-input" placeholder="Enter Name" />
                </div>
                <div>
                  <label className="fli-label">Signature *</label>
                  <SigPad label="Finance Signature" onSave={setFinanceSignature} />
                  {financeSignature && <div style={{ marginTop: 6, fontSize: 11, color: 'var(--color-success)', fontWeight: 600 }}>✓ Signature captured</div>}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            {submission.status !== 'Pending' ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '16px', background: 'var(--color-success-bg)', border: '1px solid var(--color-success)', color: 'var(--color-success)', fontWeight: 600, fontSize: 15, borderRadius: 8 }}>
                <CheckCircle size={18} color="var(--color-success)" /> Already Verified &amp; Recorded
              </div>
            ) : (
              <>
                {!anyCheckDone && !isExactVerify && (
                  <p style={{ fontSize: 12, color: 'var(--color-warning)', background: 'var(--color-warning-bg)', padding: '10px 14px', border: '1px solid var(--color-warning)', borderRadius: 8, marginBottom: 12 }}>
                    ⚠ Please complete at least one verification checkbox above before approving.
                  </p>
                )}
                {isExactVerify && !printingVerified && (
                  <p style={{ fontSize: 12, color: 'var(--color-warning)', background: 'var(--color-warning-bg)', padding: '10px 14px', border: '1px solid var(--color-warning)', borderRadius: 8, marginBottom: 12 }}>
                    ⚠ Please confirm the exact payment details above before approving.
                  </p>
                )}
                <button
                  className="fli-btn fli-btn-primary"
                  onClick={handleApprove}
                  disabled={approving || !readyToVerify}
                  style={{ width: '100%', height: 44, fontSize: 15 }}
                >
                  {approving ? <><SegmentedSpinner size={18} /> Approving...</> : <><CheckCircle size={18} /> Verify &amp; Approve — Record to Receivables</>}
                </button>
                <div style={{ marginTop: 12 }}>
                  <button
                    className="fli-btn fli-btn-danger"
                    onClick={() => setRejectModal(true)}
                    style={{ width: '100%', height: 40 }}
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
              <span className="fli-badge" style={{ background: 'var(--color-success-bg)', color: 'var(--color-success)' }}>✓ Approved</span>
            )}
          </div>
          <div className="fli-card-body">
            <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', margin: '0 0 20px' }}>
              Count the physical cash received and enter below. The system will compare against recorded transactions. They <strong>must match</strong> to approve.
            </p>

            {/* Comparison row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 16, alignItems: 'center', marginBottom: 20 }} className="fli-grid-2">
              <div style={{ background: 'var(--color-primary)', padding: '18px 20px', borderRadius: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: 6 }}>📊 System Balance</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#FFFFFF', fontVariantNumeric: 'tabular-nums' }}>ETB {fmt(systemTotal)}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)', marginTop: 4 }}>{manualDetails ? 'From manual submission' : `From ${transactionCount} recorded transactions`}</div>
              </div>
              <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 18, fontWeight: 600 }}>VS</div>
              <div style={{ background: cashInput === '' ? 'var(--color-bg-page)' : matched ? 'var(--color-success-bg)' : over ? 'var(--color-warning-bg)' : 'var(--color-danger-bg)', padding: '18px 20px', border: `1px solid ${cashInput === '' ? 'var(--color-border)' : matched ? 'var(--color-success)' : over ? 'var(--color-warning)' : 'var(--color-danger)'}`, borderRadius: 8, transition: 'all 0.3s' }}>
                <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: 8 }}>💵 Physical Cash Counted</div>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)' }}>ETB</span>
                  <input
                    type="number" step="0.01" value={cashInput}
                    onChange={e => { setCashInput(e.target.value); setMismatch(null); setError(null); }}
                    placeholder="0.00"
                    className="fli-input"
                    style={{ paddingLeft: 48, fontSize: 20, fontWeight: 700, height: 48, color: 'var(--color-text-primary)' }}
                  />
                </div>
                {cashInput !== '' && (
                  <div style={{ marginTop: 8, fontSize: 12, fontWeight: 600, color: matched ? 'var(--color-success)' : over ? 'var(--color-warning)' : 'var(--color-danger)' }}>
                    {matched ? '✅ Match confirmed!' : over ? `⚠️ Over by ETB ${fmt(Math.abs(diff))}` : `❌ Short by ETB ${fmt(Math.abs(diff))}`}
                  </div>
                )}
              </div>
            </div>

            {/* Mismatch alert */}
            {(mismatch || (error && error.includes('mismatch'))) && (
              <div style={{ background: 'var(--color-danger-bg)', border: '1px solid var(--color-danger)', padding: '14px 18px', marginBottom: 16, display: 'flex', gap: 12, alignItems: 'flex-start', borderRadius: 8 }}>
                <AlertTriangle size={18} color="var(--color-danger)" style={{ flexShrink: 0, marginTop: 2 }} />
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--color-danger)', fontSize: 14 }}>Reconciliation Failed — Mismatch Detected</div>
                  <div style={{ color: 'var(--color-danger)', fontSize: 13, marginTop: 4 }}>{error}</div>
                  <div style={{ color: 'var(--color-text-secondary)', fontSize: 12, marginTop: 6 }}>Please recount the physical cash and re-enter the correct amount before retrying.</div>
                </div>
              </div>
            )}

            {/* Error (non-mismatch) */}
            {error && !error.includes('mismatch') && !error.includes('count') && (
              <div style={{ background: 'var(--color-danger-bg)', border: '1px solid var(--color-danger)', padding: '12px 18px', marginBottom: 16, color: 'var(--color-danger)', fontSize: 13, borderRadius: 8 }}>
                <strong>Error:</strong> {error}
              </div>
            )}

            {/* Finance Signature */}
            <div style={{ background: '#fff', border: '1px solid var(--color-border)', padding: '24px', marginBottom: 20, borderRadius: 10 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <PenTool size={16} color="var(--color-text-secondary)" /> Finance Official Signature
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }} className="fli-grid-2">
                <div>
                  <label className="fli-label">Finance Officer Name *</label>
                  <input value={financeName} readOnly className="fli-input" placeholder="Enter Name" />
                </div>
                <div>
                  <label className="fli-label">Signature *</label>
                  <SigPad label="Finance Signature" onSave={setFinanceSignature} />
                  {financeSignature && <div style={{ marginTop: 6, fontSize: 11, color: 'var(--color-success)', fontWeight: 600 }}>✓ Signature captured</div>}
                </div>
              </div>
            </div>

            {/* Approve button */}
            <button
              className={`fli-btn ${matched ? 'fli-btn-primary' : cashInput !== '' ? 'fli-btn-warning' : 'fli-btn-primary'}`}
              onClick={handleApprove}
              disabled={approving || cashInput === '' || submission.status !== 'Pending'}
              style={{ width: '100%', height: 44, fontSize: 15 }}
            >
              {approving ? (
                <><SegmentedSpinner size={18} /> Approving...</>
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
              <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 8 }}>
                Cash count matches system balance. Approval will record ETB {fmt(systemTotal)} into the Receivables Book.
              </p>
            )}

            {submission.status === 'Pending' && (
              <div style={{ marginTop: 12 }}>
                <button
                  className="fli-btn fli-btn-danger"
                  onClick={() => setRejectModal(true)}
                  style={{ width: '100%', height: 40 }}
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
  const [searchParams, setSearchParams] = useSearchParams();
  const [view, setView] = useState(() => (searchParams.get('tab') === 'form' ? 'form' : 'list'));
  const [detailId, setDetailId] = useState(null);

  // Sync view from URL (?tab=) so bell notifications can deep-link to the pending list
  useEffect(() => {
    const t = searchParams.get('tab');
    if (t === 'form' || t === 'list') setView(t);
  }, [searchParams]);

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
          body { font-family: 'Inter', sans-serif; padding: 40px; color: #111827; }
          .header { border-bottom: 2px solid #2563EB; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; }
          .header-left h1 { margin: 0 0 5px; font-size: 24px; font-weight: 700; text-transform: uppercase; }
          .header-left p { margin: 0; color: #6B7280; font-size: 14px; }
          .header-right { text-align: right; }
          .header-right .ref { font-family: monospace; font-size: 20px; font-weight: 700; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
          .grid-item { padding: 15px; background: #F5F6FA; border: 1px solid #E5E7EB; }
          .grid-item label { display: block; font-size: 11px; color: #6B7280; text-transform: uppercase; font-weight: 600; margin-bottom: 5px; }
          .grid-item div { font-size: 16px; font-weight: 600; }
          .amount-box { padding: 20px; background: #EFF6FF; border: 1px solid #2563EB; text-align: center; margin-bottom: 30px; }
          .amount-box label { display: block; color: #2563EB; font-weight: 600; margin-bottom: 5px; text-transform: uppercase; }
          .amount-box div { font-size: 24px; font-weight: 700; color: #2563EB; }
          .signatures { display: flex; justify-content: space-between; margin-top: 40px; padding-top: 20px; border-top: 2px dashed #E5E7EB; }
          .sig-block { flex: 1; text-align: center; }
          .sig-img { height: 80px; margin-bottom: 10px; display: flex; align-items: center; justify-content: center; }
          .sig-img img { max-height: 100%; max-width: 100%; object-fit: contain; }
          .sig-line { border-top: 1px solid #2563EB; margin: 0 20px; padding-top: 5px; font-weight: 600; font-size: 14px; }
        </style>
      </head><body>
        <div class="header">
          <div class="header-left">
            <h1>Sutana Enterprise</h1>
            <p>Walk-In Income Receipt</p>
          </div>
          <div class="header-right">
            <div class="ref">${submitted.incomeNo}</div>
            <div style="font-size:12px; color:#6B7280;">${submitted.date}</div>
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
            <div style="font-size: 11px; color: #6B7280;">Prepared By</div>
          </div>
          <div class="sig-block">
            <div class="sig-img">${submitted.checkedSignature ? `<img src="${submitted.checkedSignature}" />` : ''}</div>
            <div class="sig-line">${submitted.checkedBy || 'Checked By'}</div>
            <div style="font-size: 11px; color: #6B7280;">Checked By</div>
          </div>
          <div class="sig-block">
            <div class="sig-img">${submitted.receiverSignature ? `<img src="${submitted.receiverSignature}" />` : ''}</div>
            <div class="sig-line">${submitted.receiverName || 'Receiver'}</div>
            <div style="font-size: 11px; color: #6B7280;">Receiver</div>
          </div>
        </div>
      </body></html>`);
      w.document.close();
      w.focus();
      setTimeout(() => { w.print(); w.close(); }, 250);
    };

    return (
      <div className="fli-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 0' }}>
        <style>{G}</style>
        <Toasts />
        <div style={{ background: 'white', border: '1px solid var(--color-border)', borderRadius: 12, padding: 40, maxWidth: 560, width: '100%', textAlign: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
          <div style={{ background: 'var(--color-success-bg)', width: 80, height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', borderRadius: '50%' }}>
            <CheckCircle size={48} color="var(--color-success)" />
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--color-text-primary)', margin: '0 0 8px' }}>Income Submitted!</h2>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: 24 }}>Recorded and sent for Finance verification.</p>
          <div style={{ background: 'var(--color-bg-page)', padding: 20, border: '1px dashed var(--color-border)', borderRadius: 8, textAlign: 'left', marginBottom: 24 }}>
            <div style={{ fontFamily: 'monospace', fontSize: 18, fontWeight: 700, color: 'var(--color-primary)', textAlign: 'center', letterSpacing: 2, marginBottom: 14 }}>{submitted.incomeNo}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 14 }}>
              <div><span style={{ color: 'var(--color-text-muted)', fontSize: 11, display: 'block' }}>Date</span><b>{submitted.date}</b></div>
              <div><span style={{ color: 'var(--color-text-muted)', fontSize: 11, display: 'block' }}>Department</span><b>{submitted.department}</b></div>
              <div><span style={{ color: 'var(--color-text-muted)', fontSize: 11, display: 'block' }}>Payment Method</span><b>{submitted.paymentMethod}</b></div>
              <div><span style={{ color: 'var(--color-text-muted)', fontSize: 11, display: 'block' }}>Received From</span><b>{submitted.receivedFrom}</b></div>
              <div style={{ gridColumn: 'span 2' }}>
                <span style={{ color: 'var(--color-text-muted)', fontSize: 11, display: 'block' }}>Amount</span>
                <span style={{ fontWeight: 700, color: 'var(--color-primary)', fontSize: 20 }}>ETB {parseFloat(submitted.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={handlePrintReceipt} className="fli-btn fli-btn-outline" style={{ flex: 1 }}>
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
        <h1 style={{ fontSize: 28, fontWeight: 700, margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 12, color: 'var(--color-text-primary)' }}>
          <span style={{ background: 'var(--color-primary)', padding: 10, display: 'flex', borderRadius: 8 }}>
            <DollarSign color="#FFFFFF" size={20} />
          </span>
          Live Income — Finance Review
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', margin: 0, fontSize: 14 }}>Verify cash count or digital payment proof to approve each submission.</p>
      </div>
      <div style={{ display: 'flex', background: 'var(--color-bg-page)', border: '1px solid var(--color-border)', borderRadius: 8, padding: 4 }}>
        <button
          onClick={() => { setView('list'); setSearchParams({ tab: 'list' }); }}
          className={`fli-tab-btn${activeTab === 'list' ? ' active' : ''}`}
        >
          <List size={15} /> Pending Approvals
        </button>
        <button
          onClick={() => { setView('form'); setSearchParams({ tab: 'form' }); }}
          className={`fli-tab-btn${activeTab === 'form' ? ' active' : ''}`}
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
            <div className="fli-stat-card" style={{ borderLeft: '4px solid var(--color-primary)' }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: 6 }}>Pending Submissions</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--color-text-primary)', fontVariantNumeric: 'tabular-nums' }}>{pendingList.length}</div>
            </div>
            <div className="fli-stat-card" style={{ borderLeft: '4px solid var(--color-warning)' }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: 6 }}>Total Pending (ETB)</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-warning)', fontVariantNumeric: 'tabular-nums' }}>{fmt(totalPending)}</div>
            </div>
            <div className="fli-stat-card" style={{ borderLeft: '4px solid var(--color-success)', background: 'var(--color-success-bg)' }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-success)', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: 6 }}>Action Required</div>
              <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-success)' }}>Click <strong>Detail</strong> → count cash → approve</div>
            </div>
          </div>
        )}

        <div className="fli-card">
          <div className="fli-card-header">
            <h3><FileText size={16} /> Awaiting Finance Verification</h3>
            <button onClick={loadPending} className="fli-btn fli-btn-secondary" style={{ height: 32, fontSize: 12, padding: '0 12px' }}>
              <RefreshCw size={13} /> Refresh
            </button>
          </div>

          {loadingList ? (
            <div style={{ padding: 60, textAlign: 'center', color: 'var(--color-text-secondary)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <SegmentedSpinner size={28} />
              <span style={{ fontWeight: 500 }}>Loading...</span>
            </div>
          ) : pendingList.length === 0 ? (
            <div style={{ padding: 64, textAlign: 'center' }}>
              <CheckCircle size={48} color="var(--color-success)" style={{ margin: '0 auto 16px', display: 'block' }} />
              <h3 style={{ margin: '0 0 8px', color: 'var(--color-text-primary)', fontWeight: 600 }}>All caught up!</h3>
              <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>No pending income submissions.</p>
            </div>
          ) : (
            <div className="fli-table-wrap">
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, minWidth: 900, fontVariantNumeric: 'tabular-nums' }}>
                <thead>
                  <tr>
                    {['#', 'Department', 'Submitted By', 'Description', 'Ref No', 'Date', 'System Total (ETB)', 'Action'].map(col => (
                      <th key={col} style={{ textAlign: col === 'System Total (ETB)' ? 'right' : 'left' }}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pendingList.map((sub, idx) => {
                    const isCash = CASH_DEPTS.includes(sub.department);
                    const typePill = isCash
                      ? { bg: 'var(--color-success-bg)', color: 'var(--color-success)', label: '💵 Cash' }
                      : { bg: 'var(--color-info-bg)', color: 'var(--color-info)', label: '📱 Digital' };
                return (
                      <tr key={sub.id} className="fli-row-hover" style={{ background: '#fff' }}>
                        <td style={{ color: 'var(--color-text-muted)', fontWeight: 600 }}>{idx + 1}</td>
                        <td>
                          <span style={{ background: 'var(--color-success-bg)', color: 'var(--color-success)', padding: '2px 10px', fontSize: 12, fontWeight: 500, display: 'block', marginBottom: 4, borderRadius: 999, width: 'max-content' }}>{sub.department}</span>
                          <span style={{ background: typePill.bg, color: typePill.color, padding: '2px 10px', fontSize: 11, fontWeight: 500, display: 'inline-block', borderRadius: 999 }}>{typePill.label}</span>
                        </td>
                        <td style={{ color: 'var(--color-text-secondary)' }}>{sub.submitted_by}</td>
                        <td style={{ color: 'var(--color-text-secondary)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sub.description || '—'}</td>
                        <td style={{ fontFamily: 'monospace', color: 'var(--color-primary)', fontSize: 12 }}>{sub.reference_no || '—'}</td>
                        <td style={{ color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>{new Date(sub.created_at).toLocaleDateString('en-GB')}</td>
                        <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--color-text-primary)', fontSize: 14 }}>{fmt(sub.amount)}</td>
                        <td>
                          <button
                            onClick={() => { setDetailId(sub.id); setView('detail'); }}
                            className="fli-btn fli-btn-primary"
                            style={{ height: 32, fontSize: 12, padding: '0 12px' }}
                          >
                            <Eye size={13} /> {isCash ? 'Verify Cash' : 'Verify Proof'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={6} style={{ color: 'var(--color-text-muted)', fontWeight: 600, fontSize: 12 }}>TOTAL PENDING</td>
                    <td style={{ textAlign: 'right', color: 'var(--color-text-primary)', fontWeight: 700, fontSize: 16 }}>{fmt(totalPending)}</td>
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
  const inputStyle = { width: '100%', height: 36, padding: '0 12px', border: '1px solid var(--color-border)', borderRadius: 8, boxSizing: 'border-box', outline: 'none', fontSize: 14, transition: 'border-color .15s, box-shadow .15s', fontFamily: 'inherit', background: '#fff', color: 'var(--color-text-primary)' };
  const inp = (value, onChange, placeholder, required = false, type = 'text') => ({
    value, onChange: e => onChange(e.target.value), required, type, placeholder,
    onFocus: e => { e.target.style.borderColor = 'var(--color-primary)'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,.1)'; },
    onBlur: e => { e.target.style.borderColor = 'var(--color-border)'; e.target.style.boxShadow = 'none'; },
    style: inputStyle
  });

  return (
    <div className="fli-page">
      <style>{G}</style>
      <Toasts />
      <PageHeader activeTab="form" />

      {error && (
        <div style={{ background: 'var(--color-danger-bg)', border: '1px solid var(--color-danger)', color: 'var(--color-danger)', padding: '14px 18px', marginBottom: 16, borderRadius: 8 }}>
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
                  onFocus={e => { e.target.style.borderColor = 'var(--color-primary)'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,.1)'; }}
                  onBlur={e => { e.target.style.borderColor = 'var(--color-border)'; e.target.style.boxShadow = 'none'; }}
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
                  <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)', fontWeight: 600, fontSize: 12 }}>ETB</span>
                  <input required type="number" step="0.01" value={amount} onChange={handleAmountChange}
                    placeholder="0.00"
                    onFocus={e => { e.target.style.borderColor = 'var(--color-primary)'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,.1)'; }}
                    onBlur={e => { e.target.style.borderColor = 'var(--color-border)'; e.target.style.boxShadow = 'none'; }}
                    style={{ ...inputStyle, paddingLeft: 46, fontSize: 15, fontWeight: 600 }}
                  />
                </div>
              </div>
              <div>
                <label className="fli-label">Amount in Words</label>
                <input readOnly value={amountWords} placeholder="Auto-filled" style={{ ...inputStyle, background: 'var(--color-bg-page)', fontStyle: 'italic', borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }} />
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
                  style={{ padding: 18, border: `1px solid ${paymentMethod === type ? 'var(--color-primary)' : 'var(--color-border)'}`, borderRadius: 10, cursor: 'pointer', fontWeight: 600, fontSize: 14, background: paymentMethod === type ? 'var(--color-primary)' : '#fff', color: paymentMethod === type ? '#fff' : 'var(--color-text-primary)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, transition: 'all .15s' }}
                  onMouseEnter={e => { if (paymentMethod !== type) e.currentTarget.style.background = 'var(--color-bg-page)'; }}
                  onMouseLeave={e => { if (paymentMethod !== type) e.currentTarget.style.background = '#fff'; }}
                >
                  <Icon size={26} color={paymentMethod === type ? 'rgba(255,255,255,0.85)' : 'var(--color-primary)'} /> {type}
                </div>
              ))}
            </div>

            {paymentMethod === 'Bank' && (
              <div style={{ background: 'var(--color-info-bg)', padding: 20, border: '1px solid var(--color-info)', borderRadius: 8 }}>
                <h4 style={{ margin: '0 0 14px', fontSize: 13, color: 'var(--color-info)', fontWeight: 600 }}>Bank Details</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }} className="fli-grid-2">
                  <input required value={bankName} onChange={e => setBankName(e.target.value)} placeholder="Bank Name *" style={inputStyle} onFocus={e => e.target.style.borderColor = 'var(--color-primary)'} onBlur={e => e.target.style.borderColor = 'var(--color-border)'} />
                  <input required value={accountHolder} onChange={e => setAccountHolder(e.target.value)} placeholder="Account Holder *" style={inputStyle} onFocus={e => e.target.style.borderColor = 'var(--color-primary)'} onBlur={e => e.target.style.borderColor = 'var(--color-border)'} />
                  <input required value={accountNumber} onChange={e => setAccountNumber(e.target.value)} placeholder="Account Number *" style={inputStyle} onFocus={e => e.target.style.borderColor = 'var(--color-primary)'} onBlur={e => e.target.style.borderColor = 'var(--color-border)'} />
                  <input value={chequeNo} onChange={e => setChequeNo(e.target.value)} placeholder="Cheque # (Optional)" style={inputStyle} onFocus={e => e.target.style.borderColor = 'var(--color-primary)'} onBlur={e => e.target.style.borderColor = 'var(--color-border)'} />
                </div>
              </div>
            )}

            {paymentMethod === 'Telebirr' && (
              <div style={{ background: 'var(--color-warning-bg)', padding: 20, border: '1px solid var(--color-warning)', borderRadius: 8 }}>
                <h4 style={{ margin: '0 0 14px', fontSize: 13, color: 'var(--color-warning)', fontWeight: 600 }}>Telebirr Details</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }} className="fli-grid-2">
                  <input required value={telebirrNumber} onChange={e => setTelebirrNumber(e.target.value)} placeholder="Mobile Number *" style={inputStyle} onFocus={e => e.target.style.borderColor = 'var(--color-warning)'} onBlur={e => e.target.style.borderColor = 'var(--color-border)'} />
                  <input required value={telebirrName} onChange={e => setTelebirrName(e.target.value)} placeholder="Full Name *" style={inputStyle} onFocus={e => e.target.style.borderColor = 'var(--color-warning)'} onBlur={e => e.target.style.borderColor = 'var(--color-border)'} />
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
                {preparedSig && <p style={{ margin: '4px 0 0', fontSize: 10, color: 'var(--color-success)', fontWeight: 600 }}>✓ Signature ready</p>}
              </div>
              <div>
                <label className="fli-label">Checked By (Name) *</label>
                <input {...inp(checkedBy, setCheckedBy, 'Manager Name', true)} style={{ ...inputStyle, marginBottom: 10 }} />
                <SigPad label="Checked By" onSave={setCheckedSig} />
                {checkedSig && <p style={{ margin: '4px 0 0', fontSize: 10, color: 'var(--color-success)', fontWeight: 600 }}>✓ Signature ready</p>}
              </div>
              <div>
                <label className="fli-label">Receiver's Name *</label>
                <input {...inp(receiverName, setReceiverName, 'Receiver Name', true)} style={{ ...inputStyle, marginBottom: 10 }} />
                <SigPad label="Receiver" onSave={setReceiverSig} />
                {receiverSig && <p style={{ margin: '4px 0 0', fontSize: 10, color: 'var(--color-success)', fontWeight: 600 }}>✓ Signature ready</p>}
              </div>
            </div>
            <p style={{ margin: '18px 0 0', color: 'var(--color-text-muted)', fontSize: 11 }}>ⓘ Draw on the white canvas with your mouse or finger, then click <b>Save</b> to confirm each signature before submitting.</p>
          </div>
        </div>

        {/* Submit button */}
        <button
          type="submit" disabled={loading}
          className="fli-btn fli-btn-primary"
          style={{ width: '100%', height: 44, fontSize: 16 }}
        >
          {loading ? (
            <><SegmentedSpinner size={20} /> Submitting...</>
          ) : (
            <><TrendingUp size={20} /> Submit Income for Finance Verification</>
          )}
        </button>
      </form>
    </div>
  );
};

export default FinanceLiveIncome;
