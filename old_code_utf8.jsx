import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  TrendingUp, CheckCircle, Printer, DollarSign, User, FileText,
  Banknote, Building, Smartphone, Calendar, RefreshCw, PenTool,
  Trash2, List, ArrowLeft, Eye, AlertTriangle, XCircle, ShoppingCart,
  Package, Phone, CreditCard, Hash, Clock, ChevronRight, Car
} from 'lucide-react';
import api from '../../services/apiClient';
import { useAuth } from '../../hooks/useAuth';

/* ÔöÇÔöÇÔöÇ helpers ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ */
const fmt = (n) => parseFloat(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtDate = (d) => d ? new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'ÔÇö';
const fmtDay  = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }) : 'ÔÇö';

/* Returns a full URL for an uploaded file path */
const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  const base = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1').replace('/api/v1', '');
  return `${base}/${path.replace(/^\//, '')}`;
};

/* Departments that collect physical cash vs digital payment proof */
const CASH_DEPTS = ['Pharmacy', 'Sales', 'Retail'];

const SALE_TYPE_COLOR = {
  ONLINE:   { bg: '#98FF98', color: '#1B5E20', label: 'Online' },
  'WALK-IN':{ bg: '#98FF98', color: '#1B5E20', label: 'Walk-In' },
  RETURNED: { bg: '#fef2f2', color: '#F44336', label: 'Return'  },
};

/* ÔöÇÔöÇÔöÇ Canvas Signature Pad ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ */
const SigPad = ({ label, onSave }) => {
  const canvasRef  = useRef(null);
  const isDrawing  = useRef(false);
  const lastPos    = useRef(null);
  const [saved, setSaved]   = useState(false);
  const [isEmpty, setIsEmpty] = useState(true);

  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width  / rect.width;
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
    canvas.addEventListener('touchmove',  draw,      { passive: false });
    canvas.addEventListener('touchend',   stopDraw,  { passive: false });
    return () => { canvas.removeEventListener('touchstart', startDraw); canvas.removeEventListener('touchmove', draw); canvas.removeEventListener('touchend', stopDraw); };
  }, [startDraw, draw, stopDraw]);

  const handleClear = () => {
    const ctx = canvasRef.current.getContext('2d');
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    setIsEmpty(true); setSaved(false); onSave(null);
  };

  return (
    <div style={{ border: `2px solid ${saved ? '#4CAF50' : '#A5D6A7'}`, borderRadius: 10, overflow: 'hidden', background: 'white', transition: 'border-color .2s' }}>
      <canvas ref={canvasRef} width={300} height={120}
        onMouseDown={startDraw} onMouseMove={draw} onMouseUp={stopDraw} onMouseLeave={stopDraw}
        style={{ width: '100%', height: 120, display: 'block', cursor: 'crosshair', background: isEmpty ? '#fafafa' : 'white', touchAction: 'none' }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', background: '#F5F5F5', borderTop: '1px solid #A5D6A7' }}>
        <span style={{ fontSize: 10, color: '#6B8E23' }}>{isEmpty ? 'Draw signature' : saved ? 'Ô£ô Saved' : ''}</span>
        <div style={{ display: 'flex', gap: 6 }}>
          <button type="button" onClick={handleClear} style={{ fontSize: 10, padding: '3px 8px', border: '1px solid #A5D6A7', borderRadius: 4, background: 'white', cursor: 'pointer', color: '#F44336' }}>Clear</button>
          
        </div>
      </div>
    </div>
  );
};

/* ÔöÇÔöÇÔöÇ Print sig block ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ */
const PrintSigBlock = ({ label, name, sigImage }) => (
  <div style={{ width: '210px', textAlign: 'center' }}>
    <div style={{ height: 80, border: '1px solid #999', borderRadius: 4, marginBottom: 6, overflow: 'hidden', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {sigImage ? <img src={sigImage} alt={label} style={{ maxHeight: 75, maxWidth: '100%', objectFit: 'contain' }} /> : <span style={{ color: '#ccc', fontSize: 11 }}>ÔÇö</span>}
    </div>
    <div style={{ borderTop: '1px solid #333', paddingTop: 4 }}>
      <div style={{ fontSize: 13, fontWeight: 700 }}>{name || '_______________'}</div>
      <div style={{ fontSize: 11, color: '#555', marginTop: 2 }}>{label}</div>
    </div>
  </div>
);

const DEPARTMENTS = ['Sales', 'Pharmacy', 'Retail', 'Printing', 'Car Rental', 'Agrirent', 'Tender', 'Other'];

/* ÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉ */
/*  DETAIL PAGE                                                    */
/* ÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉ */
const DetailView = ({ submissionId, onBack, onApproved }) => {
  const { user } = useAuth();
  const [loading,    setLoading]    = useState(true);
  const [detail,     setDetail]     = useState(null);
  const [error,      setError]      = useState(null);

  // Cash-count reconciliation (for Pharmacy/Sales)
  const [cashInput,  setCashInput]  = useState('');
  const [approving,  setApproving]  = useState(false);
  const [mismatch,   setMismatch]   = useState(null); // { systemTotal, cashCount, difference }
  const [approved,   setApproved]   = useState(false);
  const [financeName, setFinanceName] = useState(user?.fullName || user?.name || '');
  const [financeSignature, setFinanceSignature] = useState(null);

  // Digital-payment verification checklist (for Car Rental / AgriRent / Printing)
  const [verifyChecks, setVerifyChecks] = useState({ bankChecked: false, telebirrChecked: false, confirmedInPerson: false });
  const [rejecting, setRejecting] = useState(false);
  const [rejectModal, setRejectModal] = useState(false); // show/hide reject reason modal
  const [rejectReason, setRejectReason] = useState('');

  const printRef = useRef(null);

  const loadDetail = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await api.get(`/finance-receivables/live-income/${submissionId}/detail`);
      setDetail(res.data);
      if (res.data?.systemTotal) {
        // Always pre-fill cashInput with systemTotal.
        // For digital-payment depts (Car Rental / AgriRent / Printing) this means
        // reconciliation passes automatically ÔÇö Finance just confirms the proof.
        setCashInput(res.data.systemTotal.toString());
      }
    } catch (e) {
      setError(e.message || 'Failed to load detail');
    } finally {
      setLoading(false);
    }
  }, [submissionId]);

  useEffect(() => { loadDetail(); }, [loadDetail]);

  const handleApprove = async () => {
    setMismatch(null);
    if (!cashInput && cashInput !== 0) {
      setError('Please enter the physical cash count before approving.'); return;
    }
    if (!financeName || !financeSignature) {
      setError('Finance Officer name and signature are required to verify the cash.'); return;
    }
    setApproving(true); setError(null);
    try {
      const res = await api.put(`/finance-receivables/live-income/${submissionId}/approve`, {
        cash_count: parseFloat(cashInput),
        finance_name: financeName,
        finance_signature: financeSignature
      });
      if (res.success) {
        setApproved(true);
        setTimeout(() => { onApproved(); }, 2000);
      }
    } catch (e) {
      // Try to parse mismatch data
      const msg = e.message || '';
      if (msg.includes('mismatch') || msg.toLowerCase().includes('difference')) {
        // Reload detail to get fresh systemTotal
        const fresh = detail?.systemTotal || 0;
        setMismatch({
          systemTotal: fresh,
          cashCount: parseFloat(cashInput),
          difference: parseFloat(cashInput) - fresh,
        });
      }
      setError(msg);
    } finally {
      setApproving(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) return;
    setRejecting(true); setError(null);
    try {
      await api.put(`/finance-receivables/live-income/${submissionId}/reject`, { reason: rejectReason.trim() });
      setRejectModal(false);
      setRejectReason('');
      setTimeout(() => { onApproved(); }, 1200);
    } catch (e) {
      setError(e.message || 'Failed to reject submission');
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
        h1,h2,h3 { margin: 0; }
        table { width: 100%; border-collapse: collapse; font-size: 12px; }
        th { background: #F5F5F5; border: 1px solid #ccc; padding: 7px 10px; font-size: 11px; text-align: left; }
        td { border: 1px solid #ddd; padding: 7px 10px; }
        .hr { border: none; border-top: 1.5px solid #999; margin: 14px 0; }
        .total { font-weight: bold; font-size: 14px; }
        .right { text-align: right; }
        .badge { display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 10px; font-weight: bold; }
      </style></head><body>${printRef.current.innerHTML}</body></html>`);
    w.document.close();
    setTimeout(() => w.print(), 300);
  };

  /* ÔöÇÔöÇÔöÇ Loading / Error ÔöÇÔöÇÔöÇ */
  if (loading) return (
    <div style={{ padding: 60, textAlign: 'center', color: '#6B8E23', fontFamily: "'Inter', sans-serif" }}>
      <RefreshCw size={28} style={{ animation: 'spin 1s linear infinite', display: 'block', margin: '0 auto 12px' }} />
      Loading transactions...
      
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        button { transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); }
        .btn-3d {
          box-shadow: 0 4px 0 rgba(27, 94, 32, 0.4), 0 5px 10px rgba(0,0,0,0.1);
          transform: translateY(0);
        }
        .btn-3d:active:not(:disabled) {
          box-shadow: 0 0 0 rgba(27, 94, 32, 0.4), 0 2px 4px rgba(0,0,0,0.1);
          transform: translateY(4px);
        }
        .btn-3d:hover:not(:disabled) {
          filter: brightness(1.1);
        }
        .card-3d {
          box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05);
          transition: transform 0.3s;
        }
        .card-3d:hover {
          transform: translateY(-2px);
        }
        .row-hover:hover {
          background-color: #98FF98 !important;
          transform: scale(1.005);
          transition: all 0.2s ease-in-out;
        }
      `}</style>

    </div>
  );

  /* ÔöÇÔöÇÔöÇ Approved confirmation ÔöÇÔöÇÔöÇ */
  if (approved) return (
    <div style={{ padding: 60, textAlign: 'center', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
        <CheckCircle size={40} color="#2E8B57" />
      </div>
      <h2 style={{ color: '#064e3b', margin: '0 0 8px' }}>Approved & Recorded!</h2>
      <p style={{ color: '#424242' }}>Income recorded in the Receivables Book. Redirecting...</p>
    </div>
  );

  if (!detail) return <div style={{ padding: 40, color: '#F44336' }}>{error || 'No data.'}</div>;

  const { submission, transactions, systemTotal, transactionCount } = detail;
  
  let manualDetails = null;
  if (submission.manual_details) {
    try {
      manualDetails = JSON.parse(submission.manual_details);
    } catch (e) {}
  }

  const runningTotal = transactions.reduce((acc, t) => {
    acc.push((acc.length ? acc[acc.length - 1] : 0) + parseFloat(t.total_amount || 0));
    return acc;
  }, []);

  const cashVal = parseFloat(cashInput || 0);
  const diff    = cashVal - systemTotal;
  const matched = cashInput !== '' && Math.abs(diff) <= 0.01;
  const over    = cashInput !== '' && diff > 0.01;
  const short   = cashInput !== '' && diff < -0.01;

  return (
    <div style={{ padding: '28px 32px', background: '#F5F5F5', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>

      {/* ÔöÇÔöÇ Reject Reason Modal ÔöÇÔöÇ */}
      {rejectModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: '32px 36px', maxWidth: 440, width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.25)', fontFamily: "'Inter', sans-serif" }}>
            <h3 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 800, color: '#dc2626' }}>ÔØî Reject Submission</h3>
            <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 16px' }}>Please provide a clear reason so the submitter can correct and resubmit.</p>
            <textarea
              autoFocus
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="e.g. Screenshot unclear, amount mismatch, wrong payment method..."
              rows={4}
              style={{ width: '100%', padding: '10px 14px', fontSize: 13, border: '1.5px solid #e5e7eb', borderRadius: 8, resize: 'vertical', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
            />
            {error && <p style={{ color: '#dc2626', fontSize: 12, marginTop: 8 }}>{error}</p>}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
              <button onClick={() => { setRejectModal(false); setRejectReason(''); }} style={{ padding: '9px 20px', border: '1px solid #e5e7eb', background: '#fff', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer', color: '#424242' }}>Cancel</button>
              <button
                onClick={handleReject}
                disabled={!rejectReason.trim() || rejecting}
                style={{ padding: '9px 24px', background: rejectReason.trim() ? '#dc2626' : '#e5e7eb', color: rejectReason.trim() ? '#fff' : '#9ca3af', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: rejectReason.trim() ? 'pointer' : 'not-allowed' }}
              >{rejecting ? 'Rejecting...' : 'Confirm Rejection'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ÔöÇÔöÇ Header ÔöÇÔöÇ */}
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', background: 'white', border: '1px solid #8D6E63', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13, color: '#424242' }} className="btn-3d">
            <ArrowLeft size={15} /> Back to List
          </button>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={handlePrint} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', background: '#1B5E20', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 13 }} className="btn-3d">
              <Printer size={14} /> Print Detail
            </button>
          </div>
        </div>

        {/* ÔöÇÔöÇ PRINTABLE CONTENT ÔöÇÔöÇ */}
        <div ref={printRef}>

          {/* ÔòÉÔòÉ LETTER HEADER ÔòÉÔòÉ */}
          <div style={{ background: 'white', borderRadius: 16, border: '1px solid #A5D6A7', padding: '36px 40px', marginBottom: 24, boxShadow: '0 4px 6px -1px rgba(0,0,0,.05)' }}>
            <div style={{ borderBottom: '3px double #1B5E20', paddingBottom: 18, marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h1 style={{ fontSize: 26, fontWeight: 900, letterSpacing: '-0.5px', color: '#1B5E20', margin: '0 0 4px', textTransform: 'uppercase' }}>Sutana Enterprise</h1>
                <p style={{ margin: 0, color: '#424242', fontSize: 13 }}>Integrated Business Management System</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: 'monospace', fontSize: 18, fontWeight: 900, color: '#228B22', letterSpacing: 2 }}>{submission.reference_no || `INC-${submission.id}`}</div>
                <div style={{ fontSize: 12, color: '#424242', marginTop: 4 }}>INCOME VERIFICATION DOCUMENT</div>
              </div>
            </div>

            <h2 style={{ fontSize: 15, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1.5, color: '#1B5E20', margin: '0 0 20px', textAlign: 'center' }}>
              DAILY INCOME SUBMISSION ÔÇö RECONCILIATION RECORD
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>
              {[
                { label: 'Department', value: submission.department, icon: <Building size={13} /> },
                { label: 'Submitted By', value: submission.submitted_by, icon: <User size={13} /> },
                { label: 'Submission Date', value: fmtDay(submission.created_at), icon: <Calendar size={13} /> },
                { label: 'Reference No.', value: submission.reference_no || 'ÔÇö', icon: <Hash size={13} /> },
                { label: 'Total Transactions', value: manualDetails ? '1 Transaction' : `${transactionCount} sale(s)`, icon: <ShoppingCart size={13} /> },
                { label: 'System Total', value: `ETB ${fmt(systemTotal)}`, icon: <DollarSign size={13} />, highlight: true },
              ].map(({ label, value, icon, highlight }) => (
                <div key={label} style={{ background: highlight ? '#98FF98' : '#F5F5F5', borderRadius: 10, padding: '14px 16px', border: `1px solid ${highlight ? '#A5D6A7' : '#A5D6A7'}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#424242', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', marginBottom: 5 }}>
                    {icon} {label}
                  </div>
                  <div style={{ fontSize: highlight ? 17 : 14, fontWeight: highlight ? 900 : 600, color: highlight ? '#1B5E20' : '#1B5E20' }}>{value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ÔòÉÔòÉ TRANSACTION DETAILS ÔòÉÔòÉ */}
          <div style={{ background: 'white', borderRadius: 16, border: '1px solid #A5D6A7', padding: '28px 36px', marginBottom: 24, boxShadow: '0 4px 6px -1px rgba(0,0,0,.05)' }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, color: '#1B5E20', margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <FileText size={16} color="#228B22" /> Transaction Breakdown ({manualDetails ? 1 : transactionCount} Record{manualDetails || transactionCount === 1 ? '' : 's'})
            </h3>

            {transactions.length === 0 && !manualDetails ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#6B8E23' }}>No individual transactions linked to this submission.</div>
            ) : manualDetails ? (
              <div style={{ marginBottom: 24 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
                  <div style={{ background: '#F5F5F5', padding: 16, borderRadius: 12, border: '1px solid #A5D6A7' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#424242', textTransform: 'uppercase', marginBottom: 4 }}>Payment Method</div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: '#1B5E20' }}>{manualDetails.paymentMethod}</div>
                  </div>
                  <div style={{ background: '#F5F5F5', padding: 16, borderRadius: 12, border: '1px solid #A5D6A7' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#424242', textTransform: 'uppercase', marginBottom: 4 }}>Received From</div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: '#1B5E20' }}>{manualDetails.receivedFrom || 'ÔÇö'}</div>
                  </div>
                  <div style={{ background: '#F5F5F5', padding: 16, borderRadius: 12, border: '1px solid #A5D6A7' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#424242', textTransform: 'uppercase', marginBottom: 4 }}>Amount</div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: '#2E8B57' }}>ETB {fmt(manualDetails.amount || systemTotal)}</div>
                  </div>
                </div>

                {/* ÔöÇÔöÇ Car Rental Details ÔöÇÔöÇ */}
                {submission.department === 'Car Rental' && manualDetails.carName && (
                  <div style={{ background: '#f8fafc', padding: 20, borderRadius: 12, border: '1px solid #cbd5e1', marginBottom: 24 }}>
                    <h4 style={{ margin: '0 0 16px', fontSize: 15, color: '#0f172a', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Car size={18} color="#334155" /> Car Rental Order Details
                    </h4>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 4 }}>Vehicle</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{manualDetails.carName}</div>
                        {manualDetails.licensePlate && (
                          <div style={{ fontSize: 12, color: '#475569', marginTop: 2 }}>Plate: {manualDetails.licensePlate}</div>
                        )}
                      </div>
                      
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 4 }}>Rental Period</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
                          {manualDetails.totalDays} Day{manualDetails.totalDays !== 1 ? 's' : ''}
                        </div>
                        <div style={{ fontSize: 12, color: '#475569', marginTop: 2 }}>
                          {fmtDate(manualDetails.pickupDate)} ÔÇö {fmtDate(manualDetails.returnDate)}
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 4 }}>Driver</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{manualDetails.driverName || manualDetails.receivedFrom}</div>
                      </div>

                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 4 }}>Rate & Fees</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{fmt(manualDetails.dailyRate)} ETB / day</div>
                        {manualDetails.additionalOwed > 0 && (
                          <div style={{ fontSize: 12, color: '#ef4444', marginTop: 2, fontWeight: 600 }}>
                            Additional Owed: ETB {fmt(manualDetails.additionalOwed)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {manualDetails.paymentMethod === 'Bank' && manualDetails.bankDetails && (
                  <div style={{ background: '#f0f9ff', padding: 20, borderRadius: 12, border: '1px solid #bae6fd', marginBottom: 24 }}>
                    <h4 style={{ margin: '0 0 12px', fontSize: 13, color: '#0369a1', fontWeight: 700 }}>Bank Details</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 13 }}>
                      <div><strong style={{ color: '#1B5E20' }}>Bank Name:</strong> {manualDetails.bankDetails.bankName}</div>
                      <div><strong style={{ color: '#1B5E20' }}>Account Holder:</strong> {manualDetails.bankDetails.accountHolder}</div>
                      <div><strong style={{ color: '#1B5E20' }}>Account Number:</strong> {manualDetails.bankDetails.accountNumber}</div>
                      {manualDetails.bankDetails.chequeNo && <div><strong style={{ color: '#1B5E20' }}>Cheque No:</strong> {manualDetails.bankDetails.chequeNo}</div>}
                    </div>
                  </div>
                )}

                {manualDetails.paymentMethod === 'Telebirr' && manualDetails.telebirrDetails && (
                  <div style={{ background: '#fffbeb', padding: 20, borderRadius: 12, border: '1px solid #fde68a', marginBottom: 24 }}>
                    <h4 style={{ margin: '0 0 12px', fontSize: 13, color: '#b45309', fontWeight: 700 }}>Telebirr Details</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 13 }}>
                      <div><strong style={{ color: '#1B5E20' }}>Telebirr Number:</strong> {manualDetails.telebirrDetails.telebirrNumber}</div>
                      <div><strong style={{ color: '#1B5E20' }}>Full Name:</strong> {manualDetails.telebirrDetails.fullName}</div>
                    </div>
                  </div>
                )}

                {(manualDetails.paymentReference || manualDetails.proofImagePath) && (
                  <div style={{ background: '#F5F5F5', padding: 20, borderRadius: 12, border: '1px solid #A5D6A7', marginBottom: 24 }}>
                    <h4 style={{ margin: '0 0 16px', fontSize: 15, color: '#1B5E20', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <FileText size={18} color="#2E8B57" /> Online Payment Verification
                    </h4>
                    
                    {manualDetails.paymentAccount ? (
                      <div style={{ background: '#ecfdf5', padding: 12, borderRadius: 8, border: '1px solid #a7f3d0', fontSize: 14, color: '#065f46', marginBottom: 16 }}>
                        <strong>Customer deposited to:</strong><br/>
                        ­ƒÆ│ <strong>{manualDetails.paymentAccount}</strong>
                      </div>
                    ) : (
                      <div style={{ background: '#ecfdf5', padding: 12, borderRadius: 8, border: '1px solid #a7f3d0', fontSize: 13, color: '#065f46', marginBottom: 16 }}>
                        <strong>Expected Accounts (Customer didn't specify):</strong><br/>
                        ­ƒÆ│ Telebirr: <strong>0901407032</strong> (SUTANA WALLET)<br/>
                        ­ƒÅª CBE Bank: <strong>1000675227776</strong> (SUTANA)
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
                          style={{ maxWidth: '100%', maxHeight: 400, borderRadius: 12, border: '2px solid #A5D6A7', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} 
                        />
                        <a href={getImageUrl(manualDetails.proofImagePath)} target="_blank" rel="noreferrer"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 8, fontSize: 12, color: '#0369a1', fontWeight: 600, textDecoration: 'none' }}>
                          <Eye size={13} /> Open Full Image
                        </a>
                      </div>
                    )}
                  </div>
                )}

                {(() => {
                  const hasWalkInSigs = manualDetails.preparedSignature || manualDetails.checkedSignature || manualDetails.receiverSignature;
                  if (!hasWalkInSigs && !manualDetails.financeSignature) return null;
                  
                  return (
                    <div style={{ borderTop: '2px dashed #A5D6A7', paddingTop: 24, marginTop: 12 }}>
                      <h4 style={{ margin: '0 0 16px', fontSize: 14, color: '#1B5E20', fontWeight: 800 }}>Signatures</h4>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 20 }}>
                        {hasWalkInSigs && [
                          { label: 'Prepared By', name: manualDetails.preparedBy, sigImage: manualDetails.preparedSignature },
                          { label: 'Checked By', name: manualDetails.checkedBy, sigImage: manualDetails.checkedSignature },
                          { label: 'Receiver', name: manualDetails.receiverName, sigImage: manualDetails.receiverSignature }
                        ].map(({ label, name, sigImage }) => (
                          <div key={label} style={{ flex: 1, textAlign: 'center' }}>
                            <div style={{ height: 80, border: '1px solid #A5D6A7', borderRadius: 8, marginBottom: 8, overflow: 'hidden', background: '#F5F5F5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              {sigImage ? <img src={sigImage} alt={label} style={{ maxHeight: 75, maxWidth: '100%', objectFit: 'contain' }} /> : <span style={{ color: '#8D6E63', fontSize: 11 }}>No signature</span>}
                            </div>
                            <div style={{ borderTop: '1px solid #8D6E63', paddingTop: 8 }}>
                              <div style={{ fontSize: 13, fontWeight: 700, color: '#1B5E20' }}>{name || 'ÔÇö'}</div>
                              <div style={{ fontSize: 11, color: '#424242', marginTop: 2 }}>{label}</div>
                            </div>
                          </div>
                        ))}
                        
                        {manualDetails.financeSignature && (
                          <div style={{ flex: 1, textAlign: 'center', background: '#ecfdf5', borderRadius: 12, padding: 10, border: '1px solid #4CAF50' }}>
                            <div style={{ fontSize: 11, fontWeight: 800, color: '#2E8B57', marginBottom: 8, textTransform: 'uppercase' }}>Verified & Approved By (Finance)</div>
                            <div style={{ height: 80, border: '1px solid #A5D6A7', borderRadius: 8, marginBottom: 8, overflow: 'hidden', background: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <img src={manualDetails.financeSignature} alt="Finance Signature" style={{ maxHeight: 75, maxWidth: '100%', objectFit: 'contain' }} />
                            </div>
                            <div style={{ borderTop: '1px solid #4CAF50', paddingTop: 8 }}>
                              <div style={{ fontSize: 14, fontWeight: 800, color: '#1B5E20' }}>{manualDetails.financeName || 'Finance Officer'}</div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            ) : (
              transactions.map((txn, idx) => {
                const typeInfo = SALE_TYPE_COLOR[txn.sale_type] || { bg: '#F5F5F5', color: '#424242', label: txn.sale_type };
                return (
                  <div key={txn.id}>
                    {/* ÔöÇÔöÇ Per-transaction card ÔöÇÔöÇ */}
                    <div style={{ marginBottom: 4 }}>
                      {/* Transaction header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ background: '#1B5E20', color: 'white', borderRadius: 6, width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800 }}>
                            {idx + 1}
                          </div>
                          <div>
                            <div style={{ fontFamily: 'monospace', fontWeight: 800, color: '#228B22', fontSize: 14 }}>{txn.receipt_no}</div>
                            <div style={{ fontSize: 11, color: '#424242' }}>{fmtDate(txn.created_at)}</div>
                          </div>
                          <span style={{ display: 'inline-flex', alignItems: 'center', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: typeInfo.bg, color: typeInfo.color, border: `1px solid ${typeInfo.color}30` }}>
                            {typeInfo.label}
                          </span>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 20, fontWeight: 900, color: txn.sale_type === 'RETURNED' ? '#F44336' : '#2E8B57' }}>
                            {txn.sale_type === 'RETURNED' ? 'ÔêÆ' : ''}ETB {fmt(txn.total_amount)}
                          </div>
                          <div style={{ fontSize: 11, color: '#6B8E23' }}>Running total: ETB {fmt(runningTotal[idx])}</div>
                        </div>
                      </div>

                      {/* Info grid */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 12 }}>
                        {(() => {
                          const base = [
                            { icon: <Building size={11} />, label: 'Branch', value: txn.branch_name || 'ÔÇö' },
                            { icon: <User size={11} />, label: 'Cashier', value: txn.worker_name || 'ÔÇö', highlight: true },
                            { icon: <Package size={11} />, label: 'Total Items', value: txn.total_products },
                            { icon: <CreditCard size={11} />, label: 'Payment Method', value: txn.payment_method || 'CASH' }
                          ];
                          if (txn.payment_method === 'BANK_TRANSFER') {
                            base.push(
                              { icon: <Building size={11} />, label: 'Bank Name', value: txn.bank_name || 'ÔÇö' },
                              { icon: <User size={11} />, label: 'Account Holder', value: txn.account_holder || 'ÔÇö' },
                              { icon: <Hash size={11} />, label: 'Account Number', value: txn.account_number || 'ÔÇö' },
                              { icon: <User size={11} />, label: 'Sender Name', value: txn.pp_recipient_name || txn.recipient_name || 'ÔÇö' },
                              { icon: <Phone size={11} />, label: 'Sender Phone', value: txn.pp_recipient_phone || txn.recipient_phone || 'ÔÇö' }
                            );
                          } else if (txn.payment_method === 'TELBIR') {
                            base.push(
                              { icon: <Smartphone size={11} />, label: 'Telebirr Number', value: txn.telbir_number || 'ÔÇö' },
                              { icon: <User size={11} />, label: 'Sender Name', value: txn.pp_recipient_name || txn.recipient_name || 'ÔÇö' },
                              { icon: <Phone size={11} />, label: 'Sender Phone', value: txn.pp_recipient_phone || txn.recipient_phone || 'ÔÇö' }
                            );
                          } else {
                            base.push(
                              { icon: <User size={11} />, label: 'Cash Given By', value: txn.pp_recipient_name || txn.recipient_name || 'ÔÇö' },
                              { icon: <Phone size={11} />, label: 'Phone', value: txn.pp_recipient_phone || txn.recipient_phone || 'ÔÇö' }
                            );
                          }
                          return base;
                        })().map(({ icon, label, value, highlight }) => (
                          <div key={label} style={{ background: highlight ? '#98FF98' : '#F5F5F5', borderRadius: 8, padding: '9px 12px', border: `1px solid ${highlight ? '#A5D6A7' : '#A5D6A7'}` }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: highlight ? '#2E8B57' : '#6B8E23', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', marginBottom: 3 }}>{icon} {label}</div>
                            <div style={{ fontSize: 12, fontWeight: 600, color: highlight ? '#1B5E20' : '#1B5E20' }}>{value}</div>
                          </div>
                        ))}
                      </div>

                      {/* Items table */}
                      {txn.items && txn.items.length > 0 && (
                        <div style={{ overflowX: 'auto', marginBottom: 4 }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                            <thead>
                              <tr style={{ background: '#F5F5F5' }}>
                                {['#', 'Drug / Product', 'Qty', 'Unit Price (ETB)', 'Total (ETB)'].map(h => (
                                  <th key={h} style={{ padding: '8px 12px', textAlign: h.includes('ETB') || h === 'Qty' ? 'right' : 'left', color: '#424242', fontWeight: 700, fontSize: 10, textTransform: 'uppercase', border: '1px solid #A5D6A7' }}>{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {txn.items.map((item, i) => (
                                <tr key={i} style={{ borderBottom: '1px solid #F5F5F5' }}>
                                  <td style={{ padding: '7px 12px', color: '#6B8E23', fontSize: 11, border: '1px solid #A5D6A7' }}>{i + 1}</td>
                                  <td style={{ padding: '7px 12px', fontWeight: 600, color: '#1B5E20', border: '1px solid #A5D6A7' }}>{item.drug_name}</td>
                                  <td style={{ padding: '7px 12px', textAlign: 'right', border: '1px solid #A5D6A7' }}>{item.quantity}</td>
                                  <td style={{ padding: '7px 12px', textAlign: 'right', border: '1px solid #A5D6A7' }}>{fmt(item.unit_price)}</td>
                                  <td style={{ padding: '7px 12px', textAlign: 'right', fontWeight: 700, color: '#2E8B57', border: '1px solid #A5D6A7' }}>{fmt(item.total_price)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>

                    {/* ÔöÇÔöÇ HR Separator between transactions ÔöÇÔöÇ */}
                    {idx < transactions.length - 1 && (
                      <hr style={{ border: 'none', borderTop: '2px dashed #A5D6A7', margin: '20px 0' }} />
                    )}
                  </div>
                );
              })
            )}

            {/* Running Total Summary Row */}
            {transactions.length > 0 && (
              <div style={{ marginTop: 24, padding: '16px 20px', background: 'linear-gradient(135deg,#1B5E20,#228B22)', borderRadius: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#6B8E23', fontWeight: 700, fontSize: 13 }}>SYSTEM TOTAL ({transactionCount} transactions)</span>
                <span style={{ color: 'white', fontWeight: 900, fontSize: 22, letterSpacing: '-0.5px' }}>ETB {fmt(systemTotal)}</span>
              </div>
            )}
          </div>

        </div>{/* end printRef */}

        {/* ÔòÉÔòÉ DEPARTMENT-AWARE VERIFICATION SECTION (not printed) ÔòÉÔòÉ */}
        {(() => {
          const isCashDept = CASH_DEPTS.includes(submission.department);

          /* ÔöÇÔöÇ DIGITAL PAYMENT VERIFICATION (Car Rental / AgriRent / Printing / etc.) ÔöÇÔöÇ */
          if (!isCashDept) {
            const proofUrl = getImageUrl(manualDetails?.proofImagePath || manualDetails?.payment_screenshot);
            const payMethod = (manualDetails?.paymentMethod || '').toLowerCase().trim();
            const isCBE       = payMethod === 'cbe bank' || payMethod === 'cbe';
            const isTelebirr  = payMethod === 'telebirr' || payMethod.includes('telebirr');
            const isAwash     = payMethod.includes('awash');
            const isCash      = payMethod === 'cash';
            const isBank      = isCBE || isAwash || (!isTelebirr && !isCash && payMethod.includes('bank'));

            const anyCheckDone = verifyChecks.bankChecked || verifyChecks.telebirrChecked || verifyChecks.confirmedInPerson;
            const readyToVerify = anyCheckDone && financeName && financeSignature && submission.status === 'Pending';

            return (
              <div style={{ background: 'white', borderRadius: 16, border: '2px solid #3b82f6', padding: '28px 36px', marginBottom: 24, boxShadow: '0 4px 6px -1px rgba(0,0,0,.05)' }}>
                <h3 style={{ fontSize: 15, fontWeight: 800, color: '#1e40af', margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CheckCircle size={16} color="#3b82f6" /> Payment Verification
                </h3>
                <p style={{ fontSize: 13, color: '#424242', margin: '0 0 20px' }}>
                  Review the payment submitted by the customer and verify using the steps below.
                </p>

                {/* Amount summary */}
                <div style={{ background: '#eff6ff', borderRadius: 12, padding: '18px 20px', border: '2px solid #bfdbfe', marginBottom: 24 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#1d4ed8', textTransform: 'uppercase', marginBottom: 6 }}>­ƒÆ░ Amount to Verify</div>
                  <div style={{ fontSize: 36, fontWeight: 900, color: '#1e3a8a' }}>ETB {fmt(systemTotal)}</div>
                  <div style={{ fontSize: 12, color: '#424242', marginTop: 4 }}>{submission.department} ÔÇö {submission.reference_no || submission.description || 'ÔÇö'}</div>
                </div>

                {/* ÔöÇÔöÇ PAYMENT METHOD CARD: CBE Bank ÔöÇÔöÇ */}
                {isCBE && (
                  <div style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 100%)', borderRadius: 14, padding: '22px 24px', marginBottom: 24, color: 'white' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                      <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 10, padding: '8px 10px', fontSize: 20 }}>­ƒÅª</div>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: 15 }}>CBE Bank Transfer</div>
                        <div style={{ fontSize: 12, opacity: 0.8 }}>Customer deposited to SUTANA's CBE account</div>
                      </div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.12)', borderRadius: 10, padding: '14px 18px', marginBottom: 14 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', opacity: 0.7, marginBottom: 4 }}>SUTANA CBE Account Number</div>
                      <div style={{ fontFamily: 'monospace', fontSize: 24, fontWeight: 900, letterSpacing: 2 }}>1000675227776</div>
                      <div style={{ fontSize: 11, opacity: 0.7, marginTop: 4 }}>Account Holder: SUTANA Enterprise</div>
                    </div>
                    {manualDetails?.paymentReference && (
                      <div style={{ background: 'rgba(255,255,255,0.12)', borderRadius: 10, padding: '14px 18px' }}>
                        <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', opacity: 0.7, marginBottom: 4 }}>Customer's Transaction Reference</div>
                        <div style={{ fontFamily: 'monospace', fontSize: 18, fontWeight: 800, letterSpacing: 1 }}>{manualDetails.paymentReference}</div>
                      </div>
                    )}
                  </div>
                )}

                {/* ÔöÇÔöÇ PAYMENT METHOD CARD: Telebirr ÔöÇÔöÇ */}
                {isTelebirr && (
                  <div style={{ background: 'linear-gradient(135deg, #78350f 0%, #b45309 100%)', borderRadius: 14, padding: '22px 24px', marginBottom: 24, color: 'white' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                      <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 10, padding: '8px 10px', fontSize: 20 }}>­ƒô▒</div>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: 15 }}>Telebirr Payment</div>
                        <div style={{ fontSize: 12, opacity: 0.8 }}>Customer sent to SUTANA's Telebirr wallet</div>
                      </div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.12)', borderRadius: 10, padding: '14px 18px', marginBottom: 14 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', opacity: 0.7, marginBottom: 4 }}>SUTANA Telebirr Number</div>
                      <div style={{ fontFamily: 'monospace', fontSize: 24, fontWeight: 900, letterSpacing: 2 }}>0901407032</div>
                      <div style={{ fontSize: 11, opacity: 0.7, marginTop: 4 }}>SUTANA WALLET</div>
                    </div>
                    {manualDetails?.paymentReference && (
                      <div style={{ background: 'rgba(255,255,255,0.12)', borderRadius: 10, padding: '14px 18px' }}>
                        <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', opacity: 0.7, marginBottom: 4 }}>Customer's Transaction Reference</div>
                        <div style={{ fontFamily: 'monospace', fontSize: 18, fontWeight: 800, letterSpacing: 1 }}>{manualDetails.paymentReference}</div>
                      </div>
                    )}
                  </div>
                )}

                {/* ÔöÇÔöÇ PAYMENT METHOD CARD: Awash Bank ÔöÇÔöÇ */}
                {isAwash && (
                  <div style={{ background: 'linear-gradient(135deg, #7c2d12 0%, #c2410c 100%)', borderRadius: 14, padding: '22px 24px', marginBottom: 24, color: 'white' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                      <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 10, padding: '8px 10px', fontSize: 20 }}>­ƒÅª</div>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: 15 }}>Awash Bank Transfer</div>
                        <div style={{ fontSize: 12, opacity: 0.8 }}>Customer deposited to SUTANA's Awash Bank account</div>
                      </div>
                    </div>
                    {manualDetails?.paymentReference && (
                      <div style={{ background: 'rgba(255,255,255,0.12)', borderRadius: 10, padding: '14px 18px' }}>
                        <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', opacity: 0.7, marginBottom: 4 }}>Customer's Transaction Reference</div>
                        <div style={{ fontFamily: 'monospace', fontSize: 18, fontWeight: 800, letterSpacing: 1 }}>{manualDetails.paymentReference}</div>
                      </div>
                    )}
                  </div>
                )}

                {/* ÔöÇÔöÇ PAYMENT METHOD CARD: Cash / Other ÔöÇÔöÇ */}
                {!isCBE && !isTelebirr && !isAwash && (
                  <div style={{ background: '#f0fdf4', borderRadius: 14, padding: '18px 22px', marginBottom: 24, border: '1.5px solid #bbf7d0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 22 }}>­ƒÆÁ</span>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: 14, color: '#065f46' }}>{manualDetails?.paymentMethod || 'Payment'}</div>
                        <div style={{ fontSize: 12, color: '#047857' }}>Confirm cash received or verify in person</div>
                      </div>
                    </div>
                    {manualDetails?.paymentReference && (
                      <div style={{ marginTop: 12, background: 'white', borderRadius: 8, padding: '10px 14px', border: '1px solid #a7f3d0' }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: '#065f46', textTransform: 'uppercase', marginBottom: 2 }}>Reference</div>
                        <div style={{ fontFamily: 'monospace', fontSize: 15, fontWeight: 800, color: '#064e3b' }}>{manualDetails.paymentReference}</div>
                      </div>
                    )}
                  </div>
                )}

                {/* Proof image */}
                {proofUrl ? (
                  <div style={{ background: '#f0fdf4', borderRadius: 12, border: '2px solid #bbf7d0', padding: '20px', marginBottom: 24 }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: '#166534', textTransform: 'uppercase', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <FileText size={14} /> Customer Payment Screenshot
                    </div>
                    <img
                      src={proofUrl}
                      alt="Payment Proof"
                      style={{ maxWidth: '100%', maxHeight: 420, borderRadius: 10, border: '2px solid #A5D6A7', boxShadow: '0 4px 10px rgba(0,0,0,0.12)', display: 'block' }}
                      onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }}
                    />
                    <div style={{ display: 'none', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '16px', alignItems: 'center', gap: 8, color: '#991b1b', fontSize: 13 }}>
                      <AlertTriangle size={16} /> Image failed to load.
                    </div>
                    <a href={proofUrl} target="_blank" rel="noreferrer"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 10, fontSize: 12, color: '#0369a1', fontWeight: 700, textDecoration: 'none', background: '#e0f2fe', padding: '6px 12px', borderRadius: 6 }}>
                      <Eye size={13} /> Open Full-Size Image
                    </a>
                  </div>
                ) : (
                  <div style={{ background: '#fffbeb', borderRadius: 12, border: '1px solid #fde68a', padding: '16px 20px', marginBottom: 24, fontSize: 13, color: '#92400e' }}>
                    <strong>ÔÜá No screenshot uploaded.</strong> Verify the payment in the bank app or Telebirr before approving.
                  </div>
                )}

                {/* ÔöÇÔöÇ VERIFICATION CHECKLIST (method-aware) ÔöÇÔöÇ */}
                <div style={{ background: '#F5F5F5', borderRadius: 12, padding: '20px', marginBottom: 24, border: '1px solid #A5D6A7' }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: '#1B5E20', textTransform: 'uppercase', marginBottom: 14 }}>Ô£à Finance Verification ÔÇö confirm at least one:</div>
                  {[
                    isCBE      && { key: 'bankChecked',       label: '­ƒÅª Logged into CBE Bank statement ÔÇö found ETB ' + fmt(systemTotal) + ' transfer and confirmed' },
                    isTelebirr && { key: 'telebirrChecked',   label: '­ƒô▒ Checked Telebirr app ÔÇö ETB ' + fmt(systemTotal) + ' payment found and confirmed' },
                    isAwash    && { key: 'bankChecked',       label: '­ƒÅª Checked Awash Bank statement ÔÇö found ETB ' + fmt(systemTotal) + ' transfer and confirmed' },
                    isCash     && { key: 'confirmedInPerson', label: '­ƒÆÁ Cash of ETB ' + fmt(systemTotal) + ' received and counted in person' },
                    !isCBE && !isTelebirr && !isAwash && !isCash && { key: 'bankChecked', label: '­ƒÅª Checked ' + (manualDetails?.paymentMethod || 'bank') + ' statement ÔÇö payment confirmed' },
                    !isCash    && { key: 'confirmedInPerson', label: '­ƒÆÁ Payment received and verified in person / office' },
                  ].filter(Boolean).map(({ key, label }) => (
                    <label key={key + label} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', padding: '10px 0', borderBottom: '1px solid #A5D6A7', fontSize: 13, fontWeight: 600, color: verifyChecks[key] ? '#1B5E20' : '#424242', lineHeight: 1.4 }}>
                      <input
                        type="checkbox"
                        checked={verifyChecks[key]}
                        onChange={e => setVerifyChecks(p => ({ ...p, [key]: e.target.checked }))}
                        style={{ width: 16, height: 16, accentColor: '#2E8B57', cursor: 'pointer', marginTop: 2, flexShrink: 0 }}
                      />
                      {label}
                    </label>
                  ))}
                </div>

                {/* Error display */}
                {error && (
                  <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '12px 18px', marginBottom: 16, color: '#991b1b', fontSize: 13 }}>
                    <strong>Error:</strong> {error}
                  </div>
                )}

                {/* Finance Signature */}
                <div style={{ background: '#FFFFFF', borderRadius: 16, border: '2px solid #8D6E63', padding: '24px', marginBottom: 20, boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                  <h3 style={{ fontSize: 15, fontWeight: 800, color: '#1B5E20', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <PenTool size={16} color="#8D6E63" /> Finance Officer Signature
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#424242', marginBottom: 8 }}>Finance Officer Name *</label>
                      <input
                        value={financeName} readOnly
                        placeholder="Enter Name"
                        style={{ width: '100%', padding: '12px 14px', border: '2px solid #A5D6A7', borderRadius: 10, outline: 'none', fontSize: 14, background: '#f0fdf4', color: '#1B5E20' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#424242', marginBottom: 8 }}>Signature *</label>
                      <SigPad label="Finance Signature" onSave={setFinanceSignature} />
                      {financeSignature && <div style={{ marginTop: 6, fontSize: 11, color: '#4CAF50', fontWeight: 'bold' }}>Ô£ô Signature captured securely</div>}
                    </div>
                  </div>
                </div>

                {/* Verify button */}
                {submission.status !== 'Pending' ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '16px', background: '#d1fae5', borderRadius: 12, border: '2px solid #4CAF50', color: '#065f46', fontWeight: 800, fontSize: 15 }}>
                    <CheckCircle size={18} color="#2E8B57" /> Already Verified & Recorded
                  </div>
                ) : (
                  <>
                    {!anyCheckDone && (
                      <p style={{ fontSize: 12, color: '#92400e', background: '#fffbeb', padding: '10px 14px', borderRadius: 8, border: '1px solid #fde68a', marginBottom: 12 }}>
                        ÔÜá Please complete at least one verification checkbox above before approving.
                      </p>
                    )}
                    {(!financeName || !financeSignature) && (
                      <p style={{ fontSize: 12, color: '#1d4ed8', background: '#eff6ff', padding: '10px 14px', borderRadius: 8, border: '1px solid #bfdbfe', marginBottom: 12 }}>
                        Ô£Å Finance Officer name and signature are required.
                      </p>
                    )}
                    <button
                      onClick={handleApprove}
                      disabled={approving || !readyToVerify}
                      style={{
                        width: '100%', padding: '16px 20px', borderRadius: 12, border: 'none',
                        cursor: !readyToVerify || approving ? 'not-allowed' : 'pointer',
                        background: readyToVerify ? 'linear-gradient(135deg,#1d4ed8,#2563eb)' : '#cbd5e1',
                        color: readyToVerify ? 'white' : '#64748b',
                        fontWeight: 800, fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                        boxShadow: readyToVerify ? '0 4px 14px rgba(37,99,235,.4)' : 'none',
                        transition: 'all 0.3s', opacity: approving ? 0.7 : 1
                      }} className="btn-3d"
                    >
                      {approving
                        ? <><RefreshCw size={18} style={{ animation: 'spin 1s linear infinite' }} /> Verifying & Recording...</>
                        : <><CheckCircle size={18} /> Ô£à Verify Payment & Record to Receivables Book</>
                      }
                    </button>
                    {readyToVerify && (
                      <p style={{ textAlign: 'center', fontSize: 12, color: '#424242', marginTop: 8 }}>
                        Approval will record ETB {fmt(systemTotal)} into the Receivables Book for {submission.department}.
                      </p>
                    )}
                  </>
                )}

                {/* Reject button */}
                {submission.status === 'Pending' && (
                  <div style={{ marginTop: 12 }}>
                    <button
                      onClick={() => setRejectModal(true)}
                      style={{
                        width: '100%', padding: '13px 20px', borderRadius: 12, border: '2px solid #dc2626',
                        background: 'white', color: '#dc2626', fontWeight: 800, fontSize: 14,
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'white'; }}
                    >
                      ÔØî Reject with Reason
                    </button>
                  </div>
                )}

              </div>
            );
          }

          /* ÔöÇÔöÇ CASH DEPARTMENT VERIFICATION (Pharmacy / Sales) ÔöÇÔöÇ */

          return (
            <div style={{ background: 'white', borderRadius: 16, border: '2px solid #A5D6A7', padding: '28px 36px', marginBottom: 24, boxShadow: '0 4px 6px -1px rgba(0,0,0,.05)' }}>
              <h3 style={{ fontSize: 15, fontWeight: 800, color: '#1B5E20', margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <DollarSign size={16} color="#FF9800" /> Finance Cash Count Verification
              </h3>
              <p style={{ fontSize: 13, color: '#424242', margin: '0 0 20px' }}>
                Count the physical cash received and enter the amount below. The system will compare it against the recorded transactions. They <strong>must match</strong> to approve.
              </p>

              {/* Comparison row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 16, alignItems: 'center', marginBottom: 20 }}>
                <div style={{ background: '#f0f9ff', borderRadius: 12, padding: '18px 20px', border: '2px solid #bae6fd' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#0369a1', textTransform: 'uppercase', marginBottom: 6 }}>­ƒôè System Balance</div>
                  <div style={{ fontSize: 28, fontWeight: 900, color: '#1B5E20' }}>ETB {fmt(systemTotal)}</div>
                  <div style={{ fontSize: 11, color: '#424242', marginTop: 4 }}>{manualDetails ? 'From manual submission record' : `From ${transactionCount} recorded transactions`}</div>
                </div>

                <div style={{ textAlign: 'center', color: '#6B8E23', fontSize: 20, fontWeight: 700 }}>VS</div>

                <div style={{ background: cashInput === '' ? '#F5F5F5' : matched ? '#98FF98' : over ? '#fffbeb' : '#fef2f2', borderRadius: 12, padding: '18px 20px', border: `2px solid ${cashInput === '' ? '#A5D6A7' : matched ? '#4CAF50' : over ? '#fde68a' : '#fecaca'}`, transition: 'all 0.3s' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#424242', textTransform: 'uppercase', marginBottom: 8 }}>­ƒÆÁ Physical Cash Counted</div>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 12, fontWeight: 700, color: '#424242' }}>ETB</span>
                    <input
                      type="number"
                      step="0.01"
                      value={cashInput}
                      onChange={e => { setCashInput(e.target.value); setMismatch(null); setError(null); }}
                      placeholder="0.00"
                      style={{ width: '100%', padding: '10px 14px 10px 48px', border: `2px solid ${matched ? '#4CAF50' : cashInput ? '#FF9800' : '#A5D6A7'}`, borderRadius: 9, outline: 'none', fontSize: 20, fontWeight: 900, boxSizing: 'border-box', background: 'transparent', color: '#1B5E20' }}
                    />
                  </div>
                  {cashInput !== '' && (
                    <div style={{ marginTop: 8, fontSize: 12, fontWeight: 700, color: matched ? '#1B5E20' : over ? '#92400e' : '#F44336' }}>
                      {matched ? 'Ô£à Match confirmed!' : over ? `ÔÜá´©Å Over by ETB ${fmt(Math.abs(diff))}` : `ÔØî Short by ETB ${fmt(Math.abs(diff))}`}
                    </div>
                  )}
                </div>
              </div>

              {/* Mismatch alert */}
              {(mismatch || (error && error.includes('mismatch'))) && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '14px 18px', marginBottom: 16, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <AlertTriangle size={18} color="#F44336" style={{ flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <div style={{ fontWeight: 800, color: '#991b1b', fontSize: 14 }}>Reconciliation Failed ÔÇö Mismatch Detected</div>
                    <div style={{ color: '#b91c1c', fontSize: 13, marginTop: 4 }}>{error}</div>
                    <div style={{ color: '#424242', fontSize: 12, marginTop: 6 }}>Please recount the physical cash and re-enter the correct amount before retrying.</div>
                  </div>
                </div>
              )}

              {/* Error (non-mismatch) */}
              {error && !error.includes('mismatch') && !error.includes('count') && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '12px 18px', marginBottom: 16, color: '#991b1b', fontSize: 13 }}>
                  <strong>Error:</strong> {error}
                </div>
              )}

              {/* Finance Signature Verification */}
              <div style={{ background: '#FFFFFF', borderRadius: 16, border: '2px solid #8D6E63', padding: '24px', marginBottom: 20, boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                <h3 style={{ fontSize: 15, fontWeight: 800, color: '#1B5E20', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <PenTool size={16} color="#8D6E63" /> Finance Official Signature
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#424242', marginBottom: 8 }}>Finance Officer Name *</label>
                    <input
                      value={financeName} readOnly
                      placeholder="Enter Name"
                      style={{ width: '100%', padding: '12px 14px', border: '2px solid #A5D6A7', borderRadius: 10, outline: 'none', fontSize: 14, background: '#f0fdf4', color: '#1B5E20' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#424242', marginBottom: 8 }}>Signature *</label>
                    <SigPad label="Finance Signature" onSave={setFinanceSignature} />
                    {financeSignature && <div style={{ marginTop: 6, fontSize: 11, color: '#4CAF50', fontWeight: 'bold' }}>Ô£ô Signature captured securely</div>}
                  </div>
                </div>
              </div>

              {/* Approve button */}
              <button
                onClick={handleApprove}
                disabled={approving || cashInput === '' || submission.status !== 'Pending'}
                style={{
                  width: '100%', padding: '15px 20px', borderRadius: 12, border: 'none', cursor: cashInput === '' || approving ? 'not-allowed' : 'pointer',
                  background: submission.status !== 'Pending' ? '#A5D6A7' : matched ? 'linear-gradient(135deg,#2E8B57,#2E8B57)' : cashInput === '' ? '#A5D6A7' : 'linear-gradient(135deg,#FF9800,#d97706)',
                  color: cashInput === '' || submission.status !== 'Pending' ? '#6B8E23' : 'white',
                  fontWeight: 800, fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  boxShadow: matched && cashInput !== '' ? '0 4px 14px rgba(16,185,129,.4)' : 'none',
                  transition: 'all 0.3s', opacity: approving ? 0.7 : 1
                }} className="btn-3d"
              >
                {approving
                  ? <><RefreshCw size={18} style={{ animation: 'spin 1s linear infinite' }} /> Verifying &amp; Approving...</>
                  : submission.status !== 'Pending'
                  ? <><CheckCircle size={18} /> Already Approved</>
                  : matched
                  ? <><CheckCircle size={18} /> Ô£à Cash Verified ÔÇö Approve &amp; Record to Receivables Book</>
                  : cashInput !== ''
                  ? <><AlertTriangle size={18} /> Amounts Don't Match ÔÇö Fix and Retry</>
                  : <><DollarSign size={18} /> Enter Cash Count to Verify</>
                }
              </button>

              {matched && (
                <p style={{ textAlign: 'center', fontSize: 12, color: '#424242', marginTop: 8 }}>
                  Cash count matches system balance perfectly. Approval will record ETB {fmt(systemTotal)} into the Receivables Book.
                </p>
              )}
            </div>
          );
        })()}

      </div>
      
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        button { transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); }
        .btn-3d {
          box-shadow: 0 4px 0 rgba(27, 94, 32, 0.4), 0 5px 10px rgba(0,0,0,0.1);
          transform: translateY(0);
        }
        .btn-3d:active:not(:disabled) {
          box-shadow: 0 0 0 rgba(27, 94, 32, 0.4), 0 2px 4px rgba(0,0,0,0.1);
          transform: translateY(4px);
        }
        .btn-3d:hover:not(:disabled) {
          filter: brightness(1.1);
        }
        .card-3d {
          box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05);
          transition: transform 0.3s;
        }
        .card-3d:hover {
          transform: translateY(-2px);
        }
        .row-hover:hover {
          background-color: #98FF98 !important;
          transform: scale(1.005);
          transition: all 0.2s ease-in-out;
        }
      `}</style>

    </div>
  );
};

/* ÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉ */
/*  MAIN COMPONENT                                                 */
/* ÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉ */
const FinanceLiveIncome = () => {
  const [view,         setView]         = useState('list');   // 'list' | 'form' | 'detail'
  const [detailId,     setDetailId]     = useState(null);

  // Form fields
  const [date, setDate]               = useState(new Date().toISOString().slice(0, 10));
  const [department, setDepartment]   = useState('Sales');
  const [receivedFrom, setReceivedFrom] = useState('');
  const [amount, setAmount]           = useState('');
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
  const [preparedBy, setPreparedBy]     = useState('');
  const [checkedBy, setCheckedBy]       = useState('');
  const [receiverName, setReceiverName] = useState('');
  const [preparedSig, setPreparedSig]   = useState(null);
  const [checkedSig, setCheckedSig]     = useState(null);
  const [receiverSig, setReceiverSig]   = useState(null);
  const [submitted, setSubmitted]       = useState(null);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState(null);

  // Pending list
  const [pendingList, setPendingList]   = useState([]);
  const [loadingList, setLoadingList]   = useState(false);

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
      const payload = { date, department, receivedFrom, amount: parseFloat(amount), paymentMethod, description, referenceNo,
        bankDetails: paymentMethod === 'Bank' ? { bankName, accountHolder, accountNumber, chequeNo } : null,
        telebirrDetails: paymentMethod === 'Telebirr' ? { telebirrNumber, fullName: telebirrName } : null,
        preparedBy, checkedBy, receiverName, preparedSignature: preparedSig, checkedSignature: checkedSig, receiverSignature: receiverSig };
      const res = await api.post('/finance-receivables/live-income', { department, submitted_by: preparedBy, amount: parseFloat(amount), reference_no: referenceNo, description, manual_details: payload });
      const incomeNo = `INC-${String(res.id || Date.now()).slice(-6)}`;
      setSubmitted({ incomeNo, ...payload, amountWords });
    } catch (err) {
      setError(err.message || 'Failed to submit income');
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

  const inputStyle = { width: '100%', padding: '11px 14px', border: '2px solid #A5D6A7', borderRadius: 9, boxSizing: 'border-box', outline: 'none', fontSize: 14, transition: 'border-color .2s' };
  const inp = (value, onChange, placeholder, required = false, type = 'text') => ({
    value, onChange: e => onChange(e.target.value), required, type, placeholder,
    onFocus: e => (e.target.style.borderColor = '#4CAF50'),
    onBlur:  e => (e.target.style.borderColor = '#A5D6A7'),
    style: inputStyle
  });

  /* ÔöÇÔöÇÔöÇ DETAIL VIEW ÔöÇÔöÇÔöÇ */
  if (view === 'detail' && detailId) {
    return (
      <DetailView
        submissionId={detailId}
        onBack={() => { setView('list'); setDetailId(null); }}
        onApproved={() => { setView('list'); setDetailId(null); loadPending(); }}
      />
    );
  }

  /* ÔöÇÔöÇÔöÇ SUCCESS SCREEN ÔöÇÔöÇÔöÇ */
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
          .grid-item { padding: 15px; background: #F5F5F5; border: 1px solid #A5D6A7; border-radius: 8px; }
          .grid-item label { display: block; font-size: 11px; color: #424242; text-transform: uppercase; font-weight: bold; margin-bottom: 5px; }
          .grid-item div { font-size: 16px; font-weight: bold; }
          .amount-box { padding: 20px; background: #98FF98; border: 1px solid #A5D6A7; border-radius: 8px; text-align: center; margin-bottom: 30px; }
          .amount-box label { display: block; color: #1B5E20; font-weight: bold; margin-bottom: 5px; text-transform: uppercase; }
          .amount-box div { font-size: 24px; font-weight: 900; color: #166534; }
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
          <div class="grid-item"><label>Received From</label><div>${submitted.receivedFrom || 'ÔÇö'}</div></div>
          <div class="grid-item"><label>Description</label><div>${submitted.description || 'ÔÇö'}</div></div>
        </div>
        
        ${submitted.paymentMethod === 'Bank' && submitted.bankDetails ? `
        <div style="margin-bottom: 30px; padding: 15px; border: 1px solid #bae6fd; background: #f0f9ff; border-radius: 8px;">
          <h4 style="margin: 0 0 10px; color: #0369a1;">Bank Details</h4>
          <div class="grid" style="margin-bottom: 0;">
            <div><label style="font-size: 11px; color: #424242;">Bank Name</label><div style="font-weight: bold;">${submitted.bankDetails.bankName}</div></div>
            <div><label style="font-size: 11px; color: #424242;">Account Holder</label><div style="font-weight: bold;">${submitted.bankDetails.accountHolder}</div></div>
            <div><label style="font-size: 11px; color: #424242;">Account Number</label><div style="font-weight: bold;">${submitted.bankDetails.accountNumber}</div></div>
          </div>
        </div>` : ''}

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
      <div style={{ padding: 32, background: '#F5F5F5', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
        <div className="no-print" style={{ maxWidth: 560, background: 'white', borderRadius: 16, border: '2px solid #2E8B57', padding: 40, textAlign: 'center', boxShadow: '0 20px 25px -5px rgba(0,0,0,.12)', margin: '0 auto' }}>
          <div style={{ background: '#d1fae5', width: 80, height: 80, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <CheckCircle size={48} color="#2E8B57" />
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: '#064e3b', margin: '0 0 8px' }}>Income Submitted!</h2>
          <p style={{ color: '#424242', marginBottom: 24 }}>Recorded and sent for Finance verification.</p>
          <div style={{ background: '#98FF98', padding: 20, borderRadius: 12, border: '1px dashed #6ee7b7', textAlign: 'left', marginBottom: 24 }}>
            <div style={{ fontFamily: 'monospace', fontSize: 18, fontWeight: 800, color: '#047857', textAlign: 'center', letterSpacing: 2, marginBottom: 14 }}>{submitted.incomeNo}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 14 }}>
              <div><span style={{ color: '#424242', fontSize: 11, display: 'block' }}>Date</span><b>{submitted.date}</b></div>
              <div><span style={{ color: '#424242', fontSize: 11, display: 'block' }}>Department</span><b>{submitted.department}</b></div>
              <div><span style={{ color: '#424242', fontSize: 11, display: 'block' }}>Payment Method</span><b>{submitted.paymentMethod}</b></div>
              <div><span style={{ color: '#424242', fontSize: 11, display: 'block' }}>Received From</span><b>{submitted.receivedFrom}</b></div>
              <div style={{ gridColumn: 'span 2' }}>
                <span style={{ color: '#424242', fontSize: 11, display: 'block' }}>Amount</span>
                <span style={{ fontWeight: 800, color: '#2E8B57', fontSize: 20 }}>ETB {parseFloat(submitted.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={handlePrintReceipt} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 12, background: 'white', border: '1px solid #8D6E63', borderRadius: 8, cursor: 'pointer', fontWeight: 600, color: '#424242', fontSize: 14 }} className="btn-3d">
              <Printer size={16} /> Print Receipt
            </button>
            <button onClick={resetForm} style={{ flex: 1, padding: 12, background: '#1B5E20', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14 }} className="btn-3d">
              New Submission
            </button>
          </div>
        </div>
      </div>
    );
  }

  const card = { background: 'white', borderRadius: 16, border: '1px solid #A5D6A7', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,.05)', marginBottom: 24 };

  /* ÔöÇÔöÇÔöÇ PENDING APPROVALS LIST ÔöÇÔöÇÔöÇ */
  if (view === 'list') {
    const totalPending = pendingList.reduce((s, x) => s + parseFloat(x.amount || 0), 0);
    return (
      <div style={{ padding: 32, background: '#F5F5F5', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>

          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
            <div>
              <h1 style={{ fontSize: 26, fontWeight: 800, margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 12, color: '#1B5E20' }}>
                <span style={{ background: 'linear-gradient(135deg,#2E8B57,#228B22)', padding: 10, borderRadius: 12, display: 'flex', boxShadow: '0 4px 10px rgba(14,165,233,.3)' }}>
                  <DollarSign color="white" size={22} />
                </span>
                Income Submissions ÔÇö Finance Review
              </h1>
              <p style={{ color: '#424242', margin: 0, fontSize: 13 }}>Verify cash count against system balance to approve each submission.</p>
            </div>
            <div style={{ display: 'flex', gap: 8, background: '#F5F5F5', padding: 5, borderRadius: 10, border: '1px solid #A5D6A7' }}>
              <button onClick={() => setView('list')} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', background: 'white', color: '#1B5E20', border: '1px solid #8D6E63', borderRadius: 6, cursor: 'pointer', fontWeight: 700, fontSize: 13, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <List size={16} /> Pending
              </button>
              <button onClick={() => setView('form')} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', background: 'transparent', color: '#424242', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>
                <TrendingUp size={16} /> Walk In Submission
              </button>
            </div>
          </div>

          {/* Summary bar */}
          {pendingList.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 24 }}>
              <div style={{ background: 'white', borderRadius: 12, border: '1px solid #A5D6A7', padding: '18px 20px' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#424242', textTransform: 'uppercase', marginBottom: 6 }}>Pending Submissions</div>
                <div style={{ fontSize: 28, fontWeight: 900, color: '#1B5E20' }}>{pendingList.length}</div>
              </div>
              <div style={{ background: 'white', borderRadius: 12, border: '1px solid #A5D6A7', padding: '18px 20px' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#424242', textTransform: 'uppercase', marginBottom: 6 }}>Total Pending (ETB)</div>
                <div style={{ fontSize: 22, fontWeight: 900, color: '#FF9800' }}>{fmt(totalPending)}</div>
              </div>
              <div style={{ background: '#98FF98', borderRadius: 12, border: '1px solid #A5D6A7', padding: '18px 20px' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#1B5E20', textTransform: 'uppercase', marginBottom: 6 }}>Action Required</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#064e3b' }}>Click <strong>Detail</strong> on each submission ÔåÆ count cash ÔåÆ approve</div>
              </div>
            </div>
          )}

          <div style={card}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #A5D6A7', background: '#F5F5F5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>Awaiting Finance Verification</h3>
              <button onClick={loadPending} style={{ fontSize: 13, padding: '6px 14px', background: 'white', border: '1px solid #8D6E63', borderRadius: 6, cursor: 'pointer', fontWeight: 600, color: '#424242', display: 'flex', alignItems: 'center', gap: 5 }} className="btn-3d">
                <RefreshCw size={13} /> Refresh
              </button>
            </div>

            {loadingList ? (
              <div style={{ padding: 60, textAlign: 'center', color: '#6B8E23' }}>
                <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', display: 'block', margin: '0 auto 12px' }} />
                Loading...
              </div>
            ) : pendingList.length === 0 ? (
              <div style={{ padding: 64, textAlign: 'center' }}>
                <CheckCircle size={48} color="#4CAF50" style={{ margin: '0 auto 16px', display: 'block' }} />
                <h3 style={{ margin: '0 0 8px', color: '#1B5E20' }}>All caught up!</h3>
                <p style={{ color: '#424242', margin: 0 }}>No pending income submissions.</p>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#F5F5F5', borderBottom: '2px solid #A5D6A7' }}>
                    {['#', 'Department', 'Submitted By', 'Description', 'Ref No', 'Date', 'System Total (ETB)', 'Action'].map(col => (
                      <th key={col} style={{ padding: '13px 16px', textAlign: col === 'System Total (ETB)' ? 'right' : 'left', color: '#424242', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pendingList.map((sub, idx) => {
                    const isCash = CASH_DEPTS.includes(sub.department);
                    const deptBg = isCash ? '#98FF98' : '#dbeafe';
                    const deptColor = isCash ? '#1B5E20' : '#1d4ed8';
                    const typePill = isCash
                      ? { bg: '#d1fae5', color: '#065f46', label: '­ƒÆÁ Cash' }
                      : { bg: '#dbeafe', color: '#1e40af', label: '­ƒô▒ Digital' };
                    return (
                      <tr key={sub.id} className='row-hover' style={{ borderBottom: '1px solid #A5D6A7' }}>
                        <td style={{ padding: '13px 16px', color: '#6B8E23', fontWeight: 700 }}>{idx + 1}</td>
                        <td style={{ padding: '13px 16px' }}>
                          <span style={{ background: deptBg, color: deptColor, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>{sub.department}</span>
                          <br />
                          <span style={{ background: typePill.bg, color: typePill.color, padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700, marginTop: 4, display: 'inline-block' }}>{typePill.label}</span>
                        </td>
                        <td style={{ padding: '13px 16px', color: '#424242' }}>{sub.submitted_by}</td>
                        <td style={{ padding: '13px 16px', color: '#424242', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sub.description || 'ÔÇö'}</td>
                        <td style={{ padding: '13px 16px', fontFamily: 'monospace', color: '#228B22', fontSize: 12 }}>{sub.reference_no || 'ÔÇö'}</td>
                        <td style={{ padding: '13px 16px', color: '#424242' }}>{new Date(sub.created_at).toLocaleDateString('en-GB')}</td>
                        <td style={{ padding: '13px 16px', textAlign: 'right', fontWeight: 800, color: '#1B5E20', fontSize: 14 }}>
                          {fmt(sub.amount)}
                        </td>
                        <td style={{ padding: '13px 16px' }}>
                          <button
                            onClick={() => { setDetailId(sub.id); setView('detail'); }}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: isCash ? 'linear-gradient(135deg,#2E8B57,#228B22)' : 'linear-gradient(135deg,#1d4ed8,#2563eb)', color: 'white', border: 'none', padding: '8px 14px', borderRadius: 8, fontWeight: 700, fontSize: 12, cursor: 'pointer', boxShadow: '0 2px 8px rgba(14,165,233,.3)' }}>
                            <Eye size={13} /> {isCash ? 'Verify Cash' : 'Verify Proof'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ background: '#1B5E20' }}>
                    <td colSpan={6} style={{ padding: '12px 16px', color: '#6B8E23', fontWeight: 700, fontSize: 12 }}>TOTAL PENDING</td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', color: 'white', fontWeight: 900, fontSize: 16 }}>{fmt(totalPending)}</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            )}
          </div>
        </div>
        
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        button { transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); }
        .btn-3d {
          box-shadow: 0 4px 0 rgba(27, 94, 32, 0.4), 0 5px 10px rgba(0,0,0,0.1);
          transform: translateY(0);
        }
        .btn-3d:active:not(:disabled) {
          box-shadow: 0 0 0 rgba(27, 94, 32, 0.4), 0 2px 4px rgba(0,0,0,0.1);
          transform: translateY(4px);
        }
        .btn-3d:hover:not(:disabled) {
          filter: brightness(1.1);
        }
        .card-3d {
          box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05);
          transition: transform 0.3s;
        }
        .card-3d:hover {
          transform: translateY(-2px);
        }
        .row-hover:hover {
          background-color: #98FF98 !important;
          transform: scale(1.005);
          transition: all 0.2s ease-in-out;
        }
      `}</style>

      </div>
    );
  }

  /* ÔöÇÔöÇÔöÇ FORM ÔöÇÔöÇÔöÇ */
  return (
    <div style={{ padding: 32, background: '#F5F5F5', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ maxWidth: 840, margin: '0 auto 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 12, color: '#1B5E20' }}>
            <span style={{ background: 'linear-gradient(135deg,#4CAF50,#228B22)', padding: 10, borderRadius: 12, display: 'flex', boxShadow: '0 4px 10px rgba(34,197,94,.3)' }}>
              <TrendingUp color="white" size={22} />
            </span>
            Live Income Submission
          </h1>
          <p style={{ color: '#424242', margin: '8px 0 0', fontSize: 14 }}>Fill all fields, draw and save each signature, then submit for Finance verification.</p>
        </div>
        <div style={{ display: 'flex', gap: 8, background: '#F5F5F5', padding: 5, borderRadius: 10, border: '1px solid #A5D6A7' }}>
          <button onClick={() => setView('list')} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', background: 'transparent', color: '#424242', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>
            <List size={16} /> Pending
          </button>
          <button onClick={() => setView('form')} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', background: 'white', color: '#1B5E20', border: '1px solid #8D6E63', borderRadius: 6, cursor: 'pointer', fontWeight: 700, fontSize: 13, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <TrendingUp size={16} /> Walk In Submission
          </button>
        </div>
      </div>

      {error && <div style={{ maxWidth: 840, margin: '0 auto 16px', background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', padding: '14px 18px', borderRadius: 10 }}><b>Error:</b> {error}</div>}

      <form onSubmit={handleSubmit} style={{ maxWidth: 840, margin: '0 auto' }}>
        <div style={card}>
          <div style={{ padding: '20px 28px', borderBottom: '1px solid #A5D6A7', background: '#F5F5F5' }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#1B5E20', display: 'flex', alignItems: 'center', gap: 8 }}><User size={16} color="#424242" /> General Information</h3>
          </div>
          <div style={{ padding: 28 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
              <div><label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#424242', marginBottom: 7 }}>Date *</label><input {...inp(date, setDate, '', true, 'date')} /></div>
              <div><label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#424242', marginBottom: 7 }}>Department *</label>
                <select required value={department} onChange={e => setDepartment(e.target.value)} onFocus={e => (e.target.style.borderColor = '#4CAF50')} onBlur={e => (e.target.style.borderColor = '#A5D6A7')} style={{ width: '100%', padding: '11px 14px', border: '2px solid #A5D6A7', borderRadius: 9, boxSizing: 'border-box', outline: 'none', fontSize: 14, background: 'white' }}>
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>
            <div style={{ marginBottom: 20 }}><label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#424242', marginBottom: 7 }}>Received From *</label><input {...inp(receivedFrom, setReceivedFrom, 'Customer / Company / Person', true)} /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 20, marginBottom: 20 }}>
              <div><label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#424242', marginBottom: 7 }}>Amount (ETB) *</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#424242', fontWeight: 600, fontSize: 12 }}>ETB</span>
                  <input required type="number" step="0.01" value={amount} onChange={handleAmountChange} placeholder="0.00" onFocus={e => (e.target.style.borderColor = '#4CAF50')} onBlur={e => (e.target.style.borderColor = '#A5D6A7')} style={{ width: '100%', padding: '11px 14px 11px 46px', border: '2px solid #A5D6A7', borderRadius: 9, boxSizing: 'border-box', outline: 'none', fontSize: 15, fontWeight: 700 }} />
                </div>
              </div>
              <div><label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#424242', marginBottom: 7 }}>Amount in Words</label><input readOnly value={amountWords} placeholder="Auto-filled" style={{ width: '100%', padding: '11px 14px', border: '2px solid #F5F5F5', background: '#F5F5F5', borderRadius: 9, boxSizing: 'border-box', fontSize: 13, fontStyle: 'italic', color: '#424242' }} /></div>
            </div>
            <div style={{ marginBottom: 16 }}><label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#424242', marginBottom: 7 }}>Description *</label><input {...inp(description, setDescription, 'Reason for income receipt', true)} /></div>
            <div><label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#424242', marginBottom: 7 }}>Reference # (Optional)</label><input {...inp(referenceNo, setReferenceNo, 'Invoice #, Receipt ID, etc.')} /></div>
          </div>
        </div>

        <div style={card}>
          <div style={{ padding: '20px 28px', borderBottom: '1px solid #A5D6A7', background: '#F5F5F5' }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#1B5E20', display: 'flex', alignItems: 'center', gap: 8 }}><Banknote size={16} color="#424242" /> Payment Method</h3>
          </div>
          <div style={{ padding: 28 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: paymentMethod !== 'Cash' ? 20 : 0 }}>
              {[{ type: 'Cash', icon: Banknote }, { type: 'Bank', icon: Building }, { type: 'Telebirr', icon: Smartphone }].map(({ type, icon: Icon }) => (
                <div key={type} onClick={() => setPaymentMethod(type)} style={{ padding: 18, border: `2px solid ${paymentMethod === type ? '#4CAF50' : '#A5D6A7'}`, borderRadius: 12, cursor: 'pointer', fontWeight: 700, fontSize: 14, background: paymentMethod === type ? '#98FF98' : 'white', color: paymentMethod === type ? '#166534' : '#424242', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, transition: 'all .2s' }}>
                  <Icon size={26} color={paymentMethod === type ? '#4CAF50' : '#6B8E23'} /> {type}
                </div>
              ))}
            </div>
            {paymentMethod === 'Bank' && (
              <div style={{ background: '#f0f9ff', padding: 20, borderRadius: 10, border: '1px solid #bae6fd' }}>
                <h4 style={{ margin: '0 0 14px', fontSize: 13, color: '#0369a1', fontWeight: 700 }}>Bank Details</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <input required value={bankName} onChange={e => setBankName(e.target.value)} placeholder="Bank Name *" style={{ padding: '10px 14px', border: '1px solid #7dd3fc', borderRadius: 8, outline: 'none', fontSize: 14 }} />
                  <input required value={accountHolder} onChange={e => setAccountHolder(e.target.value)} placeholder="Account Holder *" style={{ padding: '10px 14px', border: '1px solid #7dd3fc', borderRadius: 8, outline: 'none', fontSize: 14 }} />
                  <input required value={accountNumber} onChange={e => setAccountNumber(e.target.value)} placeholder="Account Number *" style={{ padding: '10px 14px', border: '1px solid #7dd3fc', borderRadius: 8, outline: 'none', fontSize: 14 }} />
                  <input value={chequeNo} onChange={e => setChequeNo(e.target.value)} placeholder="Cheque # (Optional)" style={{ padding: '10px 14px', border: '1px solid #7dd3fc', borderRadius: 8, outline: 'none', fontSize: 14 }} />
                </div>
              </div>
            )}
            {paymentMethod === 'Telebirr' && (
              <div style={{ background: '#fffbeb', padding: 20, borderRadius: 10, border: '1px solid #fde68a' }}>
                <h4 style={{ margin: '0 0 14px', fontSize: 13, color: '#b45309', fontWeight: 700 }}>Telebirr Details</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <input required value={telebirrNumber} onChange={e => setTelebirrNumber(e.target.value)} placeholder="Mobile Number *" style={{ padding: '10px 14px', border: '1px solid #fcd34d', borderRadius: 8, outline: 'none', fontSize: 14 }} />
                  <input required value={telebirrName} onChange={e => setTelebirrName(e.target.value)} placeholder="Full Name *" style={{ padding: '10px 14px', border: '1px solid #fcd34d', borderRadius: 8, outline: 'none', fontSize: 14 }} />
                </div>
              </div>
            )}
          </div>
        </div>

        <div style={card}>
          <div style={{ padding: '20px 28px', borderBottom: '1px solid #A5D6A7', background: '#F5F5F5' }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#1B5E20', display: 'flex', alignItems: 'center', gap: 8 }}><PenTool size={16} color="#424242" /> Signatures</h3>
          </div>
          <div style={{ padding: 28 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20 }}>
              <div><label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#424242', marginBottom: 7 }}>Prepared By (Name) *</label><input {...inp(preparedBy, setPreparedBy, 'Accountant / Staff Name', true)} style={{ ...inputStyle, marginBottom: 10 }} /><SigPad label="Prepared By" onSave={setPreparedSig} />{preparedSig && <p style={{ margin: '4px 0 0', fontSize: 10, color: '#228B22', fontWeight: 600 }}>Ô£ô Signature ready</p>}</div>
              <div><label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#424242', marginBottom: 7 }}>Checked By (Name) *</label><input {...inp(checkedBy, setCheckedBy, 'Manager Name', true)} style={{ ...inputStyle, marginBottom: 10 }} /><SigPad label="Checked By" onSave={setCheckedSig} />{checkedSig && <p style={{ margin: '4px 0 0', fontSize: 10, color: '#228B22', fontWeight: 600 }}>Ô£ô Signature ready</p>}</div>
              <div><label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#424242', marginBottom: 7 }}>Receiver's Name *</label><input {...inp(receiverName, setReceiverName, 'Receiver Name', true)} style={{ ...inputStyle, marginBottom: 10 }} /><SigPad label="Receiver" onSave={setReceiverSig} />{receiverSig && <p style={{ margin: '4px 0 0', fontSize: 10, color: '#228B22', fontWeight: 600 }}>Ô£ô Signature ready</p>}</div>
            </div>
            <p style={{ margin: '18px 0 0', color: '#6B8E23', fontSize: 11 }}>Ôôÿ Draw on the white canvas with your mouse or finger, then click <b>Save</b> to confirm each signature before submitting.</p>
          </div>
        </div>

        <button type="submit" disabled={loading} className="btn-3d" style={{ width: '100%', padding: 16, background: 'linear-gradient(135deg,#4CAF50,#228B22)', color: 'white', border: 'none', borderRadius: 12, cursor: loading ? 'not-allowed' : 'pointer', fontSize: 16, fontWeight: 700, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10, opacity: loading ? 0.7 : 1 }}>
          {loading ? <RefreshCw size={20} style={{ animation: 'spin 1s linear infinite' }} /> : <CheckCircle size={20} />}
          {loading ? 'Processing...' : 'Submit Income for Finance Verification'}
        </button>
      </form>
      
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        button { transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); }
        .btn-3d {
          box-shadow: 0 4px 0 rgba(27, 94, 32, 0.4), 0 5px 10px rgba(0,0,0,0.1);
          transform: translateY(0);
        }
        .btn-3d:active:not(:disabled) {
          box-shadow: 0 0 0 rgba(27, 94, 32, 0.4), 0 2px 4px rgba(0,0,0,0.1);
          transform: translateY(4px);
        }
        .btn-3d:hover:not(:disabled) {
          filter: brightness(1.1);
        }
        .card-3d {
          box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05);
          transition: transform 0.3s;
        }
        .card-3d:hover {
          transform: translateY(-2px);
        }
        .row-hover:hover {
          background-color: #98FF98 !important;
          transform: scale(1.005);
          transition: all 0.2s ease-in-out;
        }
      `}</style>

    </div>
  );
};

export default FinanceLiveIncome;
