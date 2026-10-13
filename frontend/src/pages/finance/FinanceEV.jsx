import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import {
  CheckCircle, Printer, User, FileText, Clock,
  Banknote, RefreshCw, PenTool, Trash2, ArrowUpRight, AlertCircle,
  Users, CreditCard, Square, CheckSquare, PlayCircle, AlertTriangle
} from 'lucide-react';
import api from '../../services/apiClient';
import SegmentedSpinner from '../../components/ui/SegmentedSpinner';
import { formatCurrency } from '../../utils/formatters';
import { useAuth } from '../../hooks/useAuth';

const monthName = (m) => new Date(2000, parseInt(m) - 1).toLocaleString('default', { month: 'long' });

/* ─── CSS Styles for Hover and Responsive ──────────────────────── */
const styles = `
  .pv-wrapper {
    --color-primary:#2563EB;
    --color-primary-hover:#1D4ED8;
    --color-bg-page:#F5F6FA;
    --color-bg-card:#FFFFFF;
    --color-border:#E5E7EB;
    --color-text-primary:#111827;
    --color-text-secondary:#6B7280;
    --color-text-muted:#9CA3AF;
    --color-success:#16A34A; --color-success-bg:#DCFCE7;
    --color-danger:#DC2626;  --color-danger-bg:#FEE2E2;
    --color-warning:#D97706; --color-warning-bg:#FEF3C7;
    --color-info:#0284C7;    --color-info-bg:#E0F2FE;
    --gold:#FBBF24; --gold-border:#F59E0B;
    padding: 24px;
    background-color: #F5F6FA;
    min-height: 100vh;
    font-family: 'Inter', 'Segoe UI', Roboto, -apple-system, sans-serif;
    font-size: 16px;
    color: var(--color-text-primary);
    line-height: 1.5;
    width: 100%;
    box-sizing: border-box;
    margin: 0;
  }
  @media (max-width: 1024px) { .pv-wrapper { padding: 16px; } }
  @media (max-width: 768px)  { .pv-wrapper { padding: 12px; } }
  @media (min-width: 1920px) { .pv-wrapper { padding: 28px; } }
  .pv-container {
    width: 100%;
    max-width: 1800px;
    margin: 0 auto;
    padding: 0;
  }
  /* ── Cards ─────────────────────────────── */
  .card-container {
    background: #FFFFFF;
    border-radius: 10px;
    border: 1px solid var(--color-border);
    margin-bottom: 24px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.06);
    width: 100%;
    transition: box-shadow 0.15s ease, transform 0.15s ease;
  }
  .card-container:hover {
    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
    transform: translateY(-1px);
  }
  /* ── Buttons: every button on the page gets a gold hover (rule 3) ── */
  .pv-wrapper button {
    font-family: inherit;
    border-radius: 8px;
    transition: all 0.15s ease !important;
  }
  .pv-wrapper button:not(:disabled):hover {
    background: var(--gold) !important;
    border-color: var(--gold-border) !important;
    color: #111827 !important;
    box-shadow: 0 4px 14px rgba(245,158,11,0.35) !important;
    transform: translateY(-1px) !important;
  }
  .pv-wrapper button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .btn-primary {
    background: #2563EB;
    color: #FFFFFF;
    border: none;
    padding: 8px 16px;
    font-size: 14px;
    font-weight: 500;
    border-radius: 8px;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    box-shadow: 0 1px 2px rgba(0,0,0,0.06);
  }
  /* ── Tabs ──────────────────────────────── */
  .btn-tab {
    border-radius: 8px;
    cursor: pointer;
    font-weight: 500;
    font-size: 14px;
    transition: all 0.15s ease;
    border: 1px solid var(--color-border);
    background: #FFFFFF;
    color: #374151;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }
  .btn-tab.active {
    background: #2563EB;
    color: #FFFFFF;
    border-color: #2563EB;
    box-shadow: 0 2px 8px rgba(37,99,235,0.25);
  }
  .btn-tab.inactive {
    background: #FFFFFF;
    color: #374151;
    border-color: #E5E7EB;
  }
  /* ── Tables ────────────────────────────── */
  .table-row {
    transition: background 0.15s ease;
  }
  .table-row:hover {
    background: #F9FAFB !important;
  }
  /* ── Inputs ────────────────────────────── */
  .form-input {
    width: 100%;
    height: 36px;
    padding: 0 12px;
    border: 1px solid #D1D5DB;
    border-radius: 8px;
    box-sizing: border-box;
    outline: none;
    font-size: 14px;
    font-family: inherit;
    transition: border-color 0.15s, box-shadow 0.15s;
    background: #FFFFFF;
    color: var(--color-text-primary);
    font-weight: 400;
  }
  .form-input:focus {
    border-color: #2563EB;
    box-shadow: 0 0 0 3px rgba(37,99,235,0.1);
  }
  .form-input:disabled, .form-input[readonly] {
    background: #F9FAFB;
    color: var(--color-text-secondary);
  }
  /* ── Section titles ────────────────────── */
  .section-title {
    color: var(--color-text-primary);
    font-size: 16px;
    font-weight: 600;
    margin: 0 0 16px 0;
    display: flex;
    align-items: center;
    gap: 8px;
    padding-bottom: 8px;
    border-bottom: 1px solid var(--color-border);
  }
  .grid-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }
  .grid-3 {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
  }
  /* ── Payment-method tiles ──────────────── */
  .pv-option {
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.15s ease;
  }
  .pv-option:hover {
    background: var(--gold) !important;
    border-color: var(--gold-border) !important;
    color: #111827 !important;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(245,158,11,0.25);
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: .5; }
  }
  @keyframes toastIn {
    from { opacity: 0; transform: translateX(40px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  @media (max-width: 768px) {
    .grid-2, .grid-3 {
      grid-template-columns: 1fr;
    }
  }
  @media (max-width: 480px) {
    .grid-2, .grid-3 {
      grid-template-columns: 1fr;
    }
  }
  @media print {
    @page { margin: 15mm; size: A4; }
    body { background: #fff !important; }
    .no-print { display: none !important; }
    .print-avoid-break { page-break-inside: avoid; break-inside: avoid; }
    .print-page-break { page-break-before: always; break-before: page; }
    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
  }
`;

/* ─── Native Canvas Signature Pad ────────────────────────────── */
const SigPad = ({ label, onSave, storageKey }) => {
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
    ctx.strokeStyle = '#2563EB';
    ctx.lineWidth = 2;
    ctx.lineCap = 'square';
    ctx.lineJoin = 'miter';
    ctx.stroke();
    lastPos.current = pos;
    setIsEmpty(false);
  }, []);

  const handleSave = useCallback(() => {
    if (isEmpty) return;
    const canvas = canvasRef.current;
    const dataUrl = canvas.toDataURL('image/png');
    onSave(dataUrl);
    setSaved(true);
    if (storageKey) {
      localStorage.setItem(storageKey, dataUrl);
    }
  }, [isEmpty, onSave, storageKey]);

  const stopDraw = useCallback(() => {
    isDrawing.current = false;
    lastPos.current = null;
    handleSave();
  }, [handleSave]);

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



  const handleClear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setIsEmpty(true);
    setSaved(false);
    onSave(null);
    if (storageKey) {
      localStorage.removeItem(storageKey);
    }
  };

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
            setIsEmpty(false);
            setSaved(true);
            onSave(savedData);
          };
          img.src = savedData;
        }
      }
    }
  }, [storageKey, onSave]);

  return (
    <div style={{ border: '1px solid var(--color-border)', borderRadius: 10, overflow: 'hidden', background: '#FFFFFF', boxShadow: '0 1px 3px rgba(0,0,0,.06)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: '#F9FAFB', borderBottom: '1px solid var(--color-border)' }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: 5 }}>
          <PenTool size={14} color="var(--color-primary)" /> {label}
          {saved && <span style={{ background: 'var(--color-success-bg)', color: 'var(--color-success)', fontSize: 10, padding: '2px 8px', borderRadius: 99, marginLeft: 4, fontWeight: 600 }}>✓ Saved</span>}
        </span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" onClick={handleClear} style={{ fontSize: 12, padding: '6px 12px', border: 'none', background: 'var(--color-danger)', color: '#FFFFFF', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>
            Clear
          </button>
        </div>
      </div>
      <canvas ref={canvasRef} width={400} height={120} onMouseDown={startDraw} onMouseMove={draw} onMouseUp={stopDraw} onMouseLeave={stopDraw} style={{ width: '100%', height: 120, display: 'block', cursor: 'crosshair', background: '#FFFFFF', touchAction: 'none' }} />
      <div style={{ padding: '8px 10px', background: '#F9FAFB', borderTop: '1px solid var(--color-border)', fontSize: 11, color: 'var(--color-text-secondary)', textAlign: 'center', fontWeight: 500 }}>
        {isEmpty ? 'Draw signature on canvas (auto-saves)' : saved ? '✓ Captured' : 'Saving...'}
      </div>
    </div>
  );
};

/* ─── Printed Signature Block ─────────────────────────────────── */
const PrintSigBlock = ({ label, name, sigImage }) => (
  <div style={{ width: '210px', textAlign: 'center' }}>
    <div style={{ height: 80, border: '1px solid var(--color-border)', borderRadius: 10, marginBottom: 6, overflow: 'hidden', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {sigImage ? <img src={sigImage} alt="signature" style={{ maxHeight: 75, maxWidth: '100%', objectFit: 'contain' }} /> : <span style={{ color: '#9CA3AF', fontSize: 11 }}>—</span>}
    </div>
    <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 4 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>{name || '_______________'}</div>
      <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 2, fontWeight: 400 }}>{label}</div>
    </div>
  </div>
);

/* ─── Main EV Form ───────────────────────────────────────────── */
const FinanceEV = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(() => {
    const t = searchParams.get('tab');
    return ['ev', 'status', 'pending', 'history'].includes(t) ? t : 'ev';
  }); // 'ev' | 'status' | 'pending' | 'history'

  // Sync tab from URL (?tab=) so bell notifications can deep-link to the exact tab
  useEffect(() => {
    const t = searchParams.get('tab');
    if (t && ['ev', 'status', 'pending', 'history'].includes(t)) setActiveTab(t);
  }, [searchParams]);

  // Re-fetch pending list when arriving via a bell notification
  useEffect(() => {
    if (location.state?.bellTs) {
      loadPending();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state?.bellTs]);

  const selectTab = (t) => { setActiveTab(t); setSearchParams({ tab: t }); };

  // ── Payroll state ───────────────────────────────────────────────
  const [payrollQueue, setPayrollQueue]     = useState([]);
  const [payrollHistory, setPayrollHistory] = useState([]);
  const [payrollLoading, setPayrollLoading] = useState(false);
  const [payrollDetail, setPayrollDetail]   = useState({});
  const [payrollExpanded, setPayrollExpanded] = useState(null);
  const [payrollDetailLoading, setPayrollDetailLoading] = useState(null);
  const [payrollSelected, setPayrollSelected] = useState({}); // { empId: true }
  const [payrollPhase, setPayrollPhase]     = useState({}); // { 'mon-yr': 'ready'|'paying' }
  const [empPayStatus, setEmpPayStatus]     = useState({}); // { empId: 'paid'|'paying' }
  const [payModal, setPayModal]             = useState(null); // { row, emp: null|emp }
  const [payMethod, setPayMethod]           = useState('Bank Transfer');
  const [payProof, setPayProof]             = useState(null);
  const [paying, setPaying]                 = useState(false);
  const [payrollToast, setPayrollToast]     = useState(null);
  const [histExpandedGen, setHistExpandedGen] = useState(null); // expanded general payment id
  const [histExpandedPay, setHistExpandedPay] = useState(null); // expanded payroll key
  const [histMonthFilter, setHistMonthFilter] = useState('All'); // Time filter for history

  const showPayrollToast = (msg, type = 'success') => {
    setPayrollToast({ msg, type });
    setTimeout(() => setPayrollToast(null), 5000);
  };

  // Returns { queue, history } so callers can react to batch completion
  const fetchPayrollQueue = useCallback(async () => {
    setPayrollLoading(true);
    try {
      let rows = [];
      try {
        const res = await api.get('/hr/etp/payroll/finance-queue');
        rows = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
      } catch {
        const res2 = await api.get('/hr/etp/payroll/approved-list');
        const all = Array.isArray(res2?.data) ? res2.data : (Array.isArray(res2) ? res2 : []);
        rows = all.filter(p => p.approval_status === 'Approved' || p.approval_status === 'Paid')
          .map(p => ({
            month_number: p.month_number,
            year_number: p.year_number,
            total_net_pay: p.company_net_pay,
            total_employees: p.total_employees,
            approved_by_ceo: p.approved_by,
            payment_status: p.approval_status === 'Paid' ? 'Paid' : 'Pending Payment',
          }));
      }
      const queue   = rows.filter(r => r.payment_status !== 'Paid');
      const history = rows.filter(r => r.payment_status === 'Paid');
      setPayrollQueue(queue);
      setPayrollHistory(history);
      return { queue, history };
    } catch (e) {
      showPayrollToast('Failed to load payroll queue', 'error');
      return { queue: [], history: [] };
    } finally {
      setPayrollLoading(false);
    }
  }, []);

  const loadPayrollDetail = async (row) => {
    const key = `${row.month_number}-${row.year_number}`;
    if (payrollExpanded === key) { setPayrollExpanded(null); return; }
    setPayrollExpanded(key);
    if (payrollDetail[key]) return;
    setPayrollDetailLoading(key);
    try {
      const res = await api.get(`/hr/etp/payroll/summary/${row.month_number}/${row.year_number}`);
      const d = res?.data || res;
      setPayrollDetail(prev => ({ ...prev, [key]: d.employees || [] }));
    } catch { showPayrollToast('Failed to load employee breakdown', 'error'); }
    finally { setPayrollDetailLoading(null); }
  };

  // Mark selected employees as "Ready to Pay" — first step
  const handleReadyToPaySelected = (key) => {
    setPayrollPhase(prev => ({ ...prev, [key]: 'paying' }));
  };

  // Cleans up all stale state for a completed batch and navigates to history
  const handleBatchComplete = (key, label) => {
    // Clear detail cache, expanded state, phase, selections, and emp statuses for this batch
    setPayrollDetail(prev => { const next = { ...prev }; delete next[key]; return next; });
    setPayrollExpanded(prev => prev === key ? null : prev);
    setPayrollPhase(prev => { const next = { ...prev }; delete next[key]; return next; });
    setPayrollSelected({});
    setEmpPayStatus(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(k => { if (k.startsWith(key)) delete next[k]; });
      return next;
    });
    // Switch to history tab and celebrate
    setActiveTab('history');
    showPayrollToast(`🎉 ${label} payroll fully paid — moved to history!`, 'success');
  };

  // Pay a single employee
  const handlePayEmployee = async (row, emp) => {
    if (!payModal) return;
    setPaying(true);
    try {
      const key = `${row.month_number}-${row.year_number}`;
      const form = new FormData();
      form.append('month', row.month_number);
      form.append('year', row.year_number);
      form.append('payment_method', payMethod);
      form.append('employee_id', emp.employee_id);
      if (payProof) form.append('payment_proof', payProof);
      await api.post('/hr/etp/payroll/mark-paid-employee', form, { headers: { 'Content-Type': 'multipart/form-data' } })
        .catch(() => api.post('/hr/etp/payroll/mark-paid', form, { headers: { 'Content-Type': 'multipart/form-data' } }));

      // Optimistically mark paid in local state
      setEmpPayStatus(prev => ({ ...prev, [`${key}-${emp.employee_id}`]: 'paid' }));
      setPayModal(null); setPayProof(null);

      // Re-fetch queue — backend auto-marks batch as Paid when last employee is done
      const { history } = await fetchPayrollQueue();
      const batchMovedToHistory = history.some(
        r => r.month_number === row.month_number && r.year_number === row.year_number
      );
      if (batchMovedToHistory) {
        handleBatchComplete(key, `${monthName(row.month_number)} ${row.year_number}`);
      } else {
        showPayrollToast(`✅ ${emp.full_name} marked as paid`, 'success');
      }
    } catch (err) {
      showPayrollToast(err?.response?.data?.message || 'Payment failed', 'error');
    } finally { setPaying(false); }
  };

  // Pay all selected employees in one batch
  const handlePaySelected = async (row) => {
    if (!payModal) return;
    const key = `${row.month_number}-${row.year_number}`;
    const emps = payrollDetail[key] || [];
    const selected = emps.filter(e => payrollSelected[`${key}-${e.employee_id}`]);
    setPaying(true);
    try {
      for (const emp of selected) {
        const form = new FormData();
        form.append('month', row.month_number);
        form.append('year', row.year_number);
        form.append('payment_method', payMethod);
        form.append('employee_id', emp.employee_id);
        if (payProof) form.append('payment_proof', payProof);
        await api.post('/hr/etp/payroll/mark-paid-employee', form, { headers: { 'Content-Type': 'multipart/form-data' } })
          .catch(() => {});
        setEmpPayStatus(prev => ({ ...prev, [`${key}-${emp.employee_id}`]: 'paid' }));
      }
      setPayModal(null); setPayProof(null);
      setPayrollSelected({});

      // Re-fetch and check if entire batch is now in history
      const { history } = await fetchPayrollQueue();
      const batchMovedToHistory = history.some(
        r => r.month_number === row.month_number && r.year_number === row.year_number
      );
      if (batchMovedToHistory) {
        handleBatchComplete(key, `${monthName(row.month_number)} ${row.year_number}`);
      } else {
        showPayrollToast(`✅ ${selected.length} employee(s) marked as paid`, 'success');
      }
    } catch (err) {
      showPayrollToast(err?.response?.data?.message || 'Payment failed', 'error');
    } finally { setPaying(false); }
  };

  // Form state
  const [date, setDate]             = useState(new Date().toISOString().slice(0, 10));
  const [paidTo, setPaidTo]         = useState('');
  const [amount, setAmount]         = useState('');
  const [amountWords, setAmountWords] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [financeAccountId, setFinanceAccountId] = useState('');
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

  const [companyAccounts, setCompanyAccounts] = useState([]);
  useEffect(() => {
    api.get('/finance-bank').then(res => setCompanyAccounts(res.data?.data || res.data || [])).catch(console.error);
  }, []);

  const applyFinanceAccount = (id) => {
    setFinanceAccountId(id);
    const acc = companyAccounts.find(a => String(a.id) === String(id));
    if (!acc) { setPaymentMethod(''); return; }
    const method = acc.account_type === 'Bank' ? 'Bank' : acc.account_type === 'Mobile Wallet' ? 'Telebirr' : 'Cash';
    setPaymentMethod(method);
    if (method === 'Bank') {
      setBankName(acc.bank_provider || '');
      setAccountHolder('Sutana Enterprise');
      setAccountNumber(acc.account_number || '');
    } else if (method === 'Telebirr') {
      setTelebirrNumber(acc.account_number || '');
      setTelebirrName(acc.account_name || 'Sutana Enterprise');
    }
  };

  const [submitted, setSubmitted] = useState(null);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);
  const [notification, setNotification] = useState(null); // In-app notification

  const [maintSource, setMaintSource] = useState(null); 

  const [pendingList, setPendingList]   = useState([]);
  const [historyList, setHistoryList]   = useState([]);
  const [pendingLoad, setPendingLoad]   = useState(false);
  const [processId, setProcessId]       = useState(null);
  const [pendingCount, setPendingCount] = useState(0);

  // ── Voucher Status tracker state ─────────────────────────────────
  const [statusList, setStatusList]   = useState([]);
  const [statusCount, setStatusCount] = useState(0);
  const [statusLoad, setStatusLoad]   = useState(false);
  const [finalizeTarget, setFinalizeTarget] = useState(null);
  const [finalizing, setFinalizing]   = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState(null);

  const loadStatus = useCallback(async () => {
    setStatusLoad(true);
    try {
      const res = await api.get('/finance-cash/ev/pending');
      const list = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
      setStatusList(list);
      setStatusCount(list.filter(v => v.status === 'pending_ceo' || v.status === 'approved_finance').length);
    } catch (e) {
      setStatusList([]); setStatusCount(0);
    } finally {
      setStatusLoad(false);
    }
  }, []);

  useEffect(() => { loadStatus(); }, [loadStatus]);

  const handleFinalize = async () => {
    if (!finalizeTarget) return;
    setFinalizing(true);
    try {
      await api.put(`/finance-cash/ev/${finalizeTarget.id}/finalize`);
      setFinalizeTarget(null);
      setNotification({ type: 'success', msg: `Expense Voucher ${finalizeTarget.ev_number} recorded in cashbook` });
      loadStatus();
    } catch (e) {
      setNotification({ type: 'error', msg: e?.response?.data?.message || e.message || 'Failed to finalize voucher' });
    } finally {
      setFinalizing(false);
    }
  };

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
      const all = [...allMaint, ...allFuel].map(m => ({
        id: m.isFuel ? `fs-${m.id}` : `maint-${m.id}`, rawId: m.id, source: m.isFuel ? 'Fuel & Service' : 'Fleet Maintenance',
        description: m.description || m.type || 'Maintenance',
        asset: m.asset_name, amount: parseFloat((m.estimated_cost_cents / 100).toFixed(2)),
        status: m.status, date: m.scheduled_date || m.requested_date || m.created_at,
        type: m.type, priority: m.priority, mechanic_name: m.mechanic_name || m.driver_name,
        location: m.location, notes: m.notes, isFuel: !!m.isFuel
      }));

      const filtered = all.filter(m => m.status === 'PENDING_FINANCE' || m.status === 'FINANCE_READY');
      const hist = all.filter(m => m.status === 'PAID' || m.status === 'COMPLETED');
      
      setPendingList(filtered);
      setHistoryList(hist);
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
        await api.patch(`/car-renting/fuel-service/${item.rawId}/finance-approve`);
      } else {
        await api.patch(`/car-renting/maintenance/${item.rawId}/finance-approve`);
      }
      setNotification({ type: 'success', msg: `Confirmed payment for ${item.asset}` });
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
    setAmountWords(`${item.amount.toLocaleString('en-US')} ETB Only`);
    setDescription(`${item.source}: ${item.type || item.description} — ${item.asset}`);
    setReferenceNo(item.isFuel ? `FS-${String(item.rawId).padStart(4, '0')}` : `MNT-${String(item.rawId).padStart(4, '0')}`);
    setPaymentMethod('');
    setFinanceAccountId('');
    setBankName(''); setAccountHolder(''); setAccountNumber(''); setChequeNo('');
    setTelebirrNumber(''); setTelebirrName('');
    setPreparedBy(''); setReceiverName('');
    setPreparedSig(null); setReceiverSig(null);
    setSubmitted(null); setError(null); setNotification(null);
    setMaintSource({ rawId: item.rawId, asset: item.asset, description: item.description, amount: item.amount, isFuel: item.isFuel });
    setActiveTab('ev');
  };

  const handleAmountChange = (e) => {
    setAmount(e.target.value);
    const v = parseFloat(e.target.value);
    setAmountWords(isNaN(v) ? '' : `${v.toLocaleString('en-US')} ETB Only`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null); setNotification(null);
    setLoading(true);
    try {
      const payload = {
        date, paidTo, amount: parseFloat(amount),
        paymentMethod, description, referenceNo,
        accountId:       financeAccountId ? Number(financeAccountId) : null,
        accountName:     (companyAccounts.find(a => String(a.id) === String(financeAccountId)) || {}).account_name || null,
        bankDetails:     paymentMethod === 'Bank'     ? { bankName, accountHolder, accountNumber, chequeNo } : null,
        telebirrDetails: paymentMethod === 'Telebirr' ? { telebirrNumber, fullName: telebirrName }          : null,
        preparedBy, receiverName,
        preparedSignature: preparedSig, receiverSignature: receiverSig,
      };

      let evNumber;
      if (maintSource) {
        if (maintSource.isFuel) {
          const res = await api.patch(`/car-renting/fuel-service/${maintSource.rawId}/finance-pay`, payload);
          evNumber = res.data?.data?.evNumber || res.data?.evNumber || `EV-FS-${maintSource.rawId}`;
        } else {
          const res = await api.patch(`/car-renting/maintenance/${maintSource.rawId}/finance-pay`, payload);
          evNumber = res.data?.data?.evNumber || res.data?.evNumber || `EV-MNT-${maintSource.rawId}`;
        }
        setMaintSource(null);
        loadPending();
      } else {
        const res = await api.post('/finance-cash/ev', payload);
        evNumber = res.data?.data?.evNumber;
      }
      setSubmitted({ evNumber, ...payload, amountWords });
    } catch (err) {
      setNotification({ type: 'error', msg: err.message || 'Failed to create Expense Voucher' });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSubmitted(null); setMaintSource(null); setNotification(null);
    setAmount(''); setAmountWords(''); setReferenceNo('');
    setPaidTo(''); setDescription('');
    setPaymentMethod('Cash'); setFinanceAccountId('');
    setBankName(''); setAccountHolder(''); setAccountNumber(''); setChequeNo('');
    setTelebirrNumber(''); setTelebirrName('');
    setPreparedBy(''); setReceiverName('');
    setPreparedSig(null); setReceiverSig(null);
  };

  const statusConfig = {
    PENDING_FINANCE: { bg: 'var(--color-warning-bg)', color: 'var(--color-warning)', label: 'CEO Confirmed — Awaiting Finance' },
    FINANCE_READY:   { bg: 'var(--color-info-bg)', color: 'var(--color-info)', label: 'Finance Ready — Payment Set' },
  };

  /* ─── SUCCESS SCREEN ─── */
  if (submitted) {
    return (
      <div className="pv-wrapper">
        <style>{styles}</style>
        <div className="no-print card-container" style={{ maxWidth: 600, margin: '40px auto', padding: 40, textAlign: 'center' }}>
          <div style={{ width: 80, height: 80, background: 'var(--color-success-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', borderRadius: '50%', border: '1px solid var(--color-success)' }}>
            <CheckCircle size={48} color="var(--color-success)" />
          </div>
          <h2 style={{ margin: '0 0 10px', fontSize: 26, fontWeight: 700, color: 'var(--color-text-primary)' }}>{maintSource ? 'Expense Voucher Generated!' : 'Expense Voucher Sent for Approval!'}</h2>
          {submitted.evNumber && (
            <div style={{ fontSize: 15, color: 'var(--color-text-secondary)', marginBottom: 12, fontWeight: 500 }}>
              EV Number: <span style={{ color: 'var(--color-primary)', fontWeight: 700, fontFamily: 'monospace' }}>{submitted.evNumber}</span>
            </div>
          )}
          {!maintSource && (
            <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', margin: '0 0 12px', fontWeight: 400 }}>
              Awaiting CEO approval. Once approved, record it in the cashbook from the Voucher Status tab.
            </p>
          )}
          <div style={{ fontSize: 15, color: 'var(--color-text-secondary)', marginBottom: 30, background: '#F9FAFB', padding: 20, border: '1px solid var(--color-border)', borderRadius: 10 }}>
            <div style={{ color: 'var(--color-primary)', fontSize: 28, fontWeight: 700, marginBottom: 8 }}>ETB {parseFloat(submitted.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
            Paid to <strong style={{ color: 'var(--color-text-primary)' }}>{submitted.paidTo}</strong>
          </div>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn-primary" onClick={() => window.print()} style={{ padding: '12px 28px', fontSize: 15, display: 'flex', alignItems: 'center', gap: 10 }}>
              <Printer size={20} /> Print EV
            </button>
            <button onClick={resetForm} style={{ padding: '12px 28px', fontSize: 15, background: '#FFFFFF', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
              New EV
            </button>
          </div>
        </div>

        {/* Print-only PV document */}
        <div className="print-only" style={{ maxWidth: 720, margin: '0 auto', fontFamily: 'Arial, sans-serif', padding: 20 }}>
          <div style={{ textAlign: 'center', borderBottom: '2px solid #1B5E20', paddingBottom: 12, marginBottom: 16 }}>
            <h2 style={{ margin: 0, fontSize: 24, fontWeight: 900, color: '#1B5E20' }}>SUTANA TRADING</h2>
            <h3 style={{ margin: '6px 0 0', fontSize: 18, fontWeight: 700, color: '#424242' }}>Expense Voucher</h3>
            {submitted.evNumber && <div style={{ fontSize: 14, marginTop: 4, fontWeight: 700 }}>EV No: {submitted.evNumber}</div>}
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
              <b>Bank Transfer Details</b> — Bank: {submitted.bankDetails.bankName} | A/C Holder: {submitted.bankDetails.accountHolder} | A/C #: {submitted.bankDetails.accountNumber} {submitted.bankDetails.chequeNo ? `| Cheque: ${submitted.bankDetails.chequeNo}` : ''}
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
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 24, marginTop: 40, pageBreakInside: 'avoid' }}>
            <PrintSigBlock label="Prepared By" name={submitted.preparedBy} sigImage={submitted.preparedSignature} />
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
        <div style={{ position: 'fixed', top: 76, right: 24, zIndex: 9999, width: 'min(420px, calc(100vw - 48px))', background: notification.type === 'error' ? 'var(--color-danger-bg)' : 'var(--color-success-bg)', color: notification.type === 'error' ? 'var(--color-danger)' : 'var(--color-success)', padding: '14px 16px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12, fontWeight: 600, fontSize: 14, borderRadius: 8, borderLeft: `4px solid ${notification.type === 'error' ? 'var(--color-danger)' : 'var(--color-success)'}`, boxShadow: '0 8px 30px rgba(0,0,0,0.12)', animation: 'toastIn 0.25s ease both' }}>
          <AlertCircle size={20} />
          <span style={{ flex: 1 }}>{notification.msg}</span>
          <button onClick={() => setNotification(null)} style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer', fontWeight: 700, fontSize: 16, lineHeight: 1 }}>✕</button>
        </div>
      )}

      <div className="pv-container">
        
        {/* Header Tabs */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 24, width: '100%', flexWrap: 'wrap' }}>
          <button className={`btn-tab ${activeTab === 'ev' ? 'active' : 'inactive'}`} onClick={() => selectTab('ev')} style={{ flex: 1, minWidth: 160, padding: '14px', fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <FileText size={18} /> New Expense Voucher
          </button>
          <button className={`btn-tab ${activeTab === 'status' ? 'active' : 'inactive'}`} onClick={() => selectTab('status')} style={{ flex: 1, minWidth: 160, padding: '14px', fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <CheckCircle size={18} /> Voucher Status
            {statusCount > 0 && (
              <span style={{ background: activeTab === 'status' ? '#FFFFFF' : '#EF4444', color: activeTab === 'status' ? '#EF4444' : '#FFFFFF', padding: '2px 8px', fontSize: 13, fontWeight: 900, borderRadius: 99 }}>
                {statusCount}
              </span>
            )}
          </button>
          <button className={`btn-tab ${activeTab === 'pending' ? 'active' : 'inactive'}`} onClick={() => selectTab('pending')} style={{ flex: 1, minWidth: 160, padding: '14px', fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <Clock size={18} /> Pending Payments
            {(pendingCount + payrollQueue.length) > 0 && (
              <span style={{ background: activeTab === 'pending' ? '#FFFFFF' : '#EF4444', color: activeTab === 'pending' ? '#EF4444' : '#FFFFFF', padding: '2px 8px', fontSize: 13, fontWeight: 900, borderRadius: 99 }}>
                {pendingCount + payrollQueue.length}
              </span>
            )}
          </button>
          <button className={`btn-tab ${activeTab === 'history' ? 'active' : 'inactive'}`} onClick={() => selectTab('history')} style={{ flex: 1, minWidth: 160, padding: '14px', fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <CheckCircle size={18} /> History
          </button>
        </div>

        {/* ══ VOUCHER STATUS TAB ══ */}
        {activeTab === 'status' && (
          <div className="card-container">
            <div style={{ padding: '20px 24px', background: '#0F172A', borderBottom: '1px solid #1E293B', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 24, fontWeight: 600, color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CheckCircle size={20} /> Expense Voucher Status
                </h2>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: '#94A3B8', fontWeight: 400 }}>
                  Track approval and finalize vouchers. Vouchers enter the cashbook only after finalization.
                </p>
              </div>
              <button onClick={loadStatus} style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, color: '#fff', fontWeight: 500, fontSize: 13, cursor: 'pointer' }}>
                <RefreshCw size={15} /> Refresh
              </button>
            </div>

            <div style={{ padding: '20px 24px' }}>
              {statusLoad ? (
                <div style={{ padding: 60, textAlign: 'center' }}><SegmentedSpinner size={32} center label="Loading vouchers…" /></div>
              ) : statusList.length === 0 ? (
                <div style={{ padding: 60, textAlign: 'center', color: 'var(--color-text-secondary)', background: '#F9FAFB', borderRadius: 10 }}>
                  <FileText size={44} style={{ color: 'var(--color-text-muted)', margin: '0 auto 12px', display: 'block', opacity: 0.4 }} />
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>No expense vouchers yet</h3>
                  <p style={{ margin: '8px 0 0', fontSize: 14, fontWeight: 400, opacity: 0.8 }}>Create a voucher from the New Expense Voucher tab.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {statusList.map(v => {
                    const badge = {
                      pending_ceo:      { bg: 'var(--color-warning-bg)',  color: '#92400E', label: 'Pending CEO Approval' },
                      approved_finance: { bg: 'var(--color-info-bg)',     color: '#0369A1', label: 'Approved — Finalize' },
                      rejected:         { bg: 'var(--color-danger-bg)',   color: '#991B1B', label: 'Rejected' },
                      completed:        { bg: 'var(--color-success-bg)',  color: '#15803D', label: 'Completed' },
                    }[v.status] || { bg: '#F3F4F6', color: 'var(--color-text-secondary)', label: v.status };
                    const pm = v.payment_method;
                    return (
                      <div key={v.id}
                        onClick={() => setSelectedVoucher(v)}
                        style={{ border: '1px solid var(--color-border)', borderRadius: 12, padding: '16px 20px', background: '#FFFFFF', display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center', cursor: 'pointer', transition: 'box-shadow 0.18s, border-color 0.18s' }}
                        onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 18px rgba(37,99,235,0.10)'; e.currentTarget.style.borderColor = '#93c5fd'; }}
                        onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = 'var(--color-border)'; }}
                      >
                        <div style={{ flex: '1 1 220px', minWidth: 200 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: 15, color: 'var(--color-primary)' }}>{v.ev_number}</span>
                            <span style={{ background: badge.bg, color: badge.color, padding: '4px 12px', fontSize: 12, fontWeight: 600, borderRadius: 99, border: `1px solid ${badge.color}` }}>{badge.label}</span>
                          </div>
                          <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 6 }}>
                            To: <b style={{ color: 'var(--color-text-primary)' }}>{v.paid_to}</b> &nbsp;·&nbsp; {new Date(v.date).toLocaleDateString('en-GB')} &nbsp;·&nbsp; {pm}
                          </div>
                          {v.reject_reason && <div style={{ fontSize: 12, color: '#991B1B', marginTop: 6, background: 'var(--color-danger-bg)', padding: '6px 10px', borderRadius: 6 }}>Reason: {v.reject_reason}</div>}
                        </div>
                        <div style={{ fontWeight: 800, fontSize: 16, color: '#A16207', fontVariantNumeric: 'tabular-nums' }}>
                          ETB {parseFloat(v.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                        {v.status === 'approved_finance' && (
                          <button className="btn-primary" onClick={() => setFinalizeTarget(v)} style={{ padding: '10px 18px', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                            <CheckCircle size={14} /> Finalize & Record in Cashbook
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══ PENDING PAYMENT TAB ══ */}
        {activeTab === 'pending' && (
          <div className="card-container">
            <div style={{ padding: '20px 24px', background: '#0F172A', borderBottom: '1px solid #1E293B', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 24, fontWeight: 600, color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Clock size={20} /> Pending Payments
                </h2>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: '#94A3B8', fontWeight: 400 }}>All pending Fleet payments and Payroll payments in one place.</p>
              </div>
              <button onClick={() => { loadPending(); fetchPayrollQueue(); }} style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, color: '#fff', fontWeight: 500, fontSize: 13, cursor: 'pointer' }}>
                <RefreshCw size={15} /> Refresh All
              </button>
            </div>

            {/* ── Section 1: Fleet / Maintenance ── */}
            <div style={{ padding: '20px 24px 4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <div style={{ width: 4, height: 22, background: '#F59E0B', borderRadius: 2 }} />
                <span style={{ fontWeight: 600, fontSize: 15, color: 'var(--color-text-primary)' }}>Fleet & Maintenance Payments</span>
                {pendingList.length > 0 && <span style={{ background: 'var(--color-warning-bg)', color: '#92400E', borderRadius: 99, padding: '2px 10px', fontSize: 12, fontWeight: 600, border: '1px solid #FDE68A' }}>{pendingList.length} pending</span>}
              </div>
            </div>

            {pendingLoad ? (
              <div style={{ background: '#FFFFFF', padding: 0 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ background: '#F9FAFB', opacity: 0.7 }}>
                    <tr>
                      {['SOURCE', 'ASSET / DESCRIPTION', 'AMOUNT (ETB)', 'STATUS', 'ACTION'].map(h => (
                        <th key={h} style={{ padding: '14px 16px', borderBottom: '1px solid var(--color-border)' }}>
                          <div style={{ height: 14, background: '#E5E7EB', borderRadius: 4, width: '70%' }}></div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[1, 2, 3, 4, 5].map(i => (
                      <tr key={i} style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <td style={{ padding: '14px 16px' }}><div style={{ height: 24, width: 80, background: '#F9FAFB', borderRadius: 4, animation: 'pulse 1.5s infinite' }}></div></td>
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ height: 18, width: 140, background: '#F9FAFB', borderRadius: 4, marginBottom: 8, animation: 'pulse 1.5s infinite' }}></div>
                          <div style={{ height: 14, width: 200, background: '#F9FAFB', borderRadius: 4, animation: 'pulse 1.5s infinite' }}></div>
                        </td>
                        <td style={{ padding: '14px 16px', textAlign: 'right' }}><div style={{ height: 24, width: 100, background: '#F9FAFB', borderRadius: 4, marginLeft: 'auto', animation: 'pulse 1.5s infinite' }}></div></td>
                        <td style={{ padding: '14px 16px', textAlign: 'center' }}><div style={{ height: 28, width: 120, background: '#F9FAFB', borderRadius: 4, margin: '0 auto', animation: 'pulse 1.5s infinite' }}></div></td>
                        <td style={{ padding: '14px 16px', textAlign: 'center' }}><div style={{ height: 36, width: 140, background: '#F9FAFB', borderRadius: 6, margin: '0 auto', animation: 'pulse 1.5s infinite' }}></div></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            ) : pendingList.length === 0 ? (
              <div style={{ padding: 60, textAlign: 'center', color: 'var(--color-text-secondary)', background: '#F9FAFB' }}>
                <CheckCircle size={48} style={{ color: 'var(--color-success)', margin: '0 auto 16px', display: 'block', opacity: 0.6 }} />
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>No pending payments</h3>
                <p style={{ margin: '8px 0 0', fontSize: 14, fontWeight: 400, opacity: 0.8 }}>All CEO-approved payments have been processed.</p>
              </div>

            ) : (
              <div style={{ overflowX: 'auto', width: '100%' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead style={{ background: '#F9FAFB', color: 'var(--color-text-secondary)' }}>
                    <tr>
                      <th style={{ padding: '12px 16px', fontWeight: 500, fontSize: 12, textTransform: 'uppercase', letterSpacing: '.03em', borderBottom: '1px solid var(--color-border)' }}>SOURCE</th>
                      <th style={{ padding: '12px 16px', fontWeight: 500, fontSize: 12, textTransform: 'uppercase', letterSpacing: '.03em', borderBottom: '1px solid var(--color-border)' }}>ASSET / DESCRIPTION</th>
                      <th style={{ padding: '12px 16px', fontWeight: 500, fontSize: 12, textTransform: 'uppercase', letterSpacing: '.03em', borderBottom: '1px solid var(--color-border)', textAlign: 'right' }}>AMOUNT (ETB)</th>
                      <th style={{ padding: '12px 16px', fontWeight: 500, fontSize: 12, textTransform: 'uppercase', letterSpacing: '.03em', borderBottom: '1px solid var(--color-border)', textAlign: 'center' }}>STATUS</th>
                      <th style={{ padding: '12px 16px', fontWeight: 500, fontSize: 12, textTransform: 'uppercase', letterSpacing: '.03em', borderBottom: '1px solid var(--color-border)', textAlign: 'center' }}>ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingList.map((item, idx) => {
                      const sc = statusConfig[item.status] || { bg: '#F3F4F6', color: 'var(--color-text-secondary)', label: item.status };
                      return (
                        <tr key={item.id} className="table-row" style={{ background: '#FFFFFF', borderBottom: '1px solid var(--color-border)' }}>
                          <td style={{ padding: '14px 16px' }}>
                            <span style={{ background: 'var(--color-info-bg)', color: 'var(--color-info)', padding: '4px 10px', fontSize: 12, fontWeight: 600, borderRadius: 99 }}>
                              {item.source}
                            </span>
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            <div style={{ fontWeight: 600, color: 'var(--color-text-primary)', fontSize: 14 }}>{item.asset || '—'}</div>
                            <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 4, fontWeight: 400 }}>{item.description}</div>
                          </td>
                          <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 700, color: 'var(--color-text-primary)', fontSize: 15, fontVariantNumeric: 'tabular-nums' }}>
                            {item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                            <span style={{ background: sc.bg, color: sc.color, padding: '5px 12px', fontSize: 12, fontWeight: 600, borderRadius: 99, border: `1px solid ${sc.color}` }}>
                              {sc.label}
                            </span>
                          </td>
                          <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                            {item.status === 'PENDING_FINANCE' && (
                              <button className="btn-primary" onClick={() => handleConfirm(item)} disabled={processId === item.id} style={{ padding: '8px 14px', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                {processId === item.id ? <SegmentedSpinner size={14} /> : <CheckCircle size={14} />}
                                Confirm Payment
                              </button>
                            )}
                            {item.status === 'FINANCE_READY' && (
                              <button className="btn-primary" onClick={() => handleContinuePayment(item)} style={{ padding: '8px 14px', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
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

            {/* ── Section 2: Payroll Payments ── */}
            <div style={{ padding: '8px 24px 4px', marginTop: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <div style={{ width: 4, height: 22, background: '#16A34A', borderRadius: 2 }} />
                <span style={{ fontWeight: 600, fontSize: 15, color: 'var(--color-text-primary)' }}>Payroll Payments</span>
                {payrollQueue.length > 0 && <span style={{ background: 'var(--color-success-bg)', color: '#15803D', borderRadius: 99, padding: '2px 10px', fontSize: 12, fontWeight: 600, border: '1px solid #86EFAC' }}>{payrollQueue.length} pending</span>}
              </div>
            </div>

            <div style={{ padding: '0 24px', fontFamily: "'Inter', sans-serif" }}>
              <style>{`
                @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
                .pq-card { animation: fadeUp .25s ease both; }
                .pq-emp-row:hover { background: #F9FAFB !important; }
                .pq-pay-btn:hover { background: #FBBF24 !important; color:#111827 !important; transform: scale(1.03); }
              `}</style>

              {payrollToast && (
                <div style={{ position: 'fixed', top: 76, right: 24, zIndex: 9999, width: 'min(480px, calc(100vw - 48px))', background: payrollToast.type === 'success' ? 'var(--color-success-bg)' : 'var(--color-danger-bg)', color: payrollToast.type === 'success' ? 'var(--color-success)' : 'var(--color-danger)', padding: '14px 16px', borderRadius: 8, fontSize: 14, fontWeight: 600, boxShadow: '0 8px 30px rgba(0,0,0,0.12)', display: 'flex', alignItems: 'center', gap: 10, borderLeft: `4px solid ${payrollToast.type === 'success' ? 'var(--color-success)' : 'var(--color-danger)'}`, animation: 'toastIn 0.25s ease both' }}>
                  {payrollToast.type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
                  <span style={{ flex: 1 }}>{payrollToast.msg}</span>
                </div>
              )}

            {payrollLoading ? (
              <div style={{ padding: '80px 0', textAlign: 'center', background: '#f8fafc' }}>
                <SegmentedSpinner size={44} center label="Loading payroll queue…" />
              </div>
            ) : payrollQueue.length === 0 ? (
              <div style={{ padding: '80px 24px', textAlign: 'center', background: '#f8fafc', color: '#6B7280' }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <CheckCircle size={32} style={{ opacity: 0.3 }} />
                </div>
                <p style={{ fontWeight: 700, fontSize: 16, margin: '0 0 6px', color: '#374151' }}>No payrolls awaiting payment</p>
                <p style={{ fontSize: 13, margin: 0 }}>When the CEO approves payrolls they will appear here.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0, background: '#f8fafc', padding: '20px 20px', gap: 16 }}>
                {payrollQueue.map(row => {
                  const key = `${row.month_number}-${row.year_number}`;
                  const isPending = row.payment_status === 'Pending Payment';
                  const isExp = payrollExpanded === key;
                  const emps = payrollDetail[key] || [];
                  const phase = payrollPhase[key];
                  const paidCount = emps.filter(e => empPayStatus[`${key}-${e.employee_id}`] === 'paid' || e.payment_status === 'Paid').length;
                  const totalEmp = emps.length || row.total_employees || 0;
                  const allPaid = totalEmp > 0 && paidCount === totalEmp;
                  const selectedCount = emps.filter(e => payrollSelected[`${key}-${e.employee_id}`]).length;
                  const pct = totalEmp > 0 ? Math.round((paidCount / totalEmp) * 100) : 0;

                  return (
                    <div key={key} className="pq-card" style={{ background: '#fff', borderRadius: 10, border: `1px solid ${allPaid ? '#86efac' : '#E2E8F0'}`, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
                      {/* ── Month Card Header ── */}
                      <div style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 16, background: allPaid ? '#f0fdf4' : '#fff' }}>
                        {/* Icon */}
                        <div style={{ flexShrink: 0, background: allPaid ? '#dcfce7' : '#f0fdf4', padding: 14, borderRadius: 14, border: `1.5px solid ${allPaid ? '#86efac' : '#d1fae5'}` }}>
                          <Users size={26} color={allPaid ? '#16a34a' : '#22c55e'} />
                        </div>
                        {/* Title + progress */}
                        <div style={{ flex: 1, minWidth: 180 }}>
                          <div style={{ fontWeight: 800, fontSize: 18, color: '#0f172a' }}>{monthName(row.month_number)} {row.year_number} Payroll</div>
                          <div style={{ fontSize: 13, color: '#64748b', marginTop: 3 }}>
                            {row.total_employees} employees &nbsp;·&nbsp; Net: <strong style={{ color: '#0f172a' }}>{formatCurrency(row.total_net_pay)}</strong>
                            {row.approved_by_ceo && <span style={{ marginLeft: 8, fontSize: 11, color: '#94a3b8' }}>Approved by CEO: {row.approved_by_ceo}</span>}
                          </div>
                          {/* Progress bar */}
                          <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ flex: 1, maxWidth: 220, height: 7, background: '#e2e8f0', borderRadius: 99, overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${pct}%`, background: allPaid ? '#16a34a' : '#3b82f6', borderRadius: 99, transition: 'width 0.4s ease' }} />
                            </div>
                            <span style={{ fontSize: 12, fontWeight: 700, color: allPaid ? '#16a34a' : '#3b82f6' }}>{pct}%</span>
                          </div>
                        </div>
                        {/* Paid count badge */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: allPaid ? '#f0fdf4' : emps.length > 0 ? '#eff6ff' : '#f8fafc', padding: '12px 24px', borderRadius: 14, border: `2px solid ${allPaid ? '#86efac' : emps.length > 0 ? '#bfdbfe' : '#e2e8f0'}`, minWidth: 90 }}>
                          <div style={{ fontSize: 28, fontWeight: 900, color: allPaid ? '#16a34a' : emps.length > 0 ? '#2563eb' : '#94a3b8', lineHeight: 1 }}>
                            {emps.length > 0 ? `${paidCount}` : '?'}
                          </div>
                          <div style={{ fontSize: 10, fontWeight: 700, color: allPaid ? '#15803d' : '#64748b', textTransform: 'uppercase', letterSpacing: '.04em', marginTop: 3 }}>
                            of {totalEmp} Paid
                          </div>
                        </div>
                        {/* Status badge */}
                        {allPaid ? (
                          <span style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'7px 16px', borderRadius:99, fontSize:13, fontWeight:700, background:'#dcfce7', color:'#16a34a', border:'1.5px solid #16a34a' }}><CheckCircle size={14} /> Paid</span>
                        ) : phase === 'paying' && emps.length > 0 ? (
                          <span style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'7px 16px', borderRadius:99, fontSize:13, fontWeight:700, background:'#eff6ff', color:'#2563eb', border:'1.5px solid #2563eb' }}><CreditCard size={14} /> In Progress</span>
                        ) : isPending ? (
                          <span style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'7px 16px', borderRadius:99, fontSize:13, fontWeight:700, background:'#fef3c7', color:'#92400e', border:'1.5px solid #d97706' }}><Clock size={14} /> Pending</span>
                        ) : (
                          <span style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'7px 16px', borderRadius:99, fontSize:13, fontWeight:700, background:'#dcfce7', color:'#15803d', border:'1.5px solid #16a34a' }}><CheckCircle size={14} /> Completed</span>
                        )}
                        {/* Action buttons */}
                        {isPending && !allPaid && (
                          <>
                            {phase === 'ready' ? (
                              <button onClick={() => handleReadyToPaySelected(key)}
                                style={{ display:'flex', alignItems:'center', gap:7, padding:'10px 20px', background:'#16A34A', color:'#fff', border:'none', borderRadius:10, fontSize:13, fontWeight:700, cursor:'pointer', boxShadow:'0 2px 8px rgba(22,163,74,0.3)' }}>
                                <CreditCard size={16} /> Start Payment
                              </button>
                            ) : phase !== 'paying' ? (
                              <button onClick={() => { loadPayrollDetail(row); setPayrollPhase(prev => ({ ...prev, [key]: 'ready' })); setPayrollExpanded(key); }}
                                style={{ display:'flex', alignItems:'center', gap:7, padding:'10px 20px', background:'#f59e0b', color:'#fff', border:'none', borderRadius:10, fontSize:13, fontWeight:700, cursor:'pointer', boxShadow:'0 2px 8px rgba(245,158,11,0.3)' }}>
                                <PlayCircle size={16} /> Ready to Pay
                              </button>
                            ) : null}
                          </>
                        )}
                        <button onClick={() => loadPayrollDetail(row)} style={{ background:'none', border:'1.5px solid #e2e8f0', borderRadius:8, padding:'8px 14px', cursor:'pointer', color:'#64748b', fontSize:12, fontWeight:700, display:'flex', alignItems:'center', gap:5 }}>
                          {isExp ? '▲' : '▼'} {isExp ? 'Hide' : 'Details'}
                        </button>
                      </div>

                      {/* ── Employee Detail Table ── */}
                      {isExp && (
                        <div style={{ borderTop: '1.5px solid #f1f5f9', background: '#FAFAFA' }}>
                          {payrollDetailLoading === key ? (
                            <div style={{ padding: 32 }}><SegmentedSpinner size={32} center label="Loading employees…" /></div>
                          ) : emps.length === 0 ? (
                            <p style={{ color: '#6B7280', textAlign: 'center', padding: 32, fontSize: 13 }}>No employee data found.</p>
                          ) : (
                            <>
                              {/* Bulk action bar */}
                              {phase === 'paying' && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 24px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', flexWrap: 'wrap' }}>
                                  <button
                                    onClick={() => {
                                      const allSel = emps.every(e => payrollSelected[`${key}-${e.employee_id}`]);
                                      const next = {};
                                      if (!allSel) emps.forEach(e => { next[`${key}-${e.employee_id}`] = true; });
                                      setPayrollSelected(prev => ({ ...prev, ...next, ...(!allSel ? {} : Object.fromEntries(emps.map(e => [`${key}-${e.employee_id}`, false]))) }));
                                    }}
                                    style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 16px', background:'#fff', border:'1.5px solid #D1D5DB', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer' }}>
                                    <CheckSquare size={15} /> Select All
                                  </button>
                                  {selectedCount > 0 && (
                                    <button onClick={() => setPayModal({ row, emp: null, isBulk: true })}
                                      style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 18px', background:'#16A34A', color:'#fff', border:'none', borderRadius:8, fontSize:13, fontWeight:700, cursor:'pointer', boxShadow:'0 2px 8px rgba(22,163,74,0.25)' }}>
                                      <CreditCard size={14} /> Pay {selectedCount} Selected
                                    </button>
                                  )}
                                  <span style={{ fontSize: 13, color: '#6B7280', fontWeight:600 }}>
                                    <span style={{ color: '#16A34A', fontWeight: 800 }}>{paidCount}</span> / {emps.length} employees paid
                                  </span>
                                </div>
                              )}

                              {/* Employee Cards */}
                              <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                                {emps.map((e, idx) => {
                                  const empKey = `${key}-${e.employee_id}`;
                                  const isPaid = empPayStatus[empKey] === 'paid' || e.payment_status === 'Paid';
                                  const isSelected = !!payrollSelected[empKey];
                                  const allow = parseFloat(e.housing_allowance||0)+parseFloat(e.transport_allowance||0)+parseFloat(e.communication_allowance||0);
                                  const extra = parseFloat(e.overtime_pay||0)+parseFloat(e.bonus_pay||0);
                                  const deduct = parseFloat(e.deduction_absent||0)+parseFloat(e.deduction_loan||0)+parseFloat(e.deduction_tax||0)+parseFloat(e.deduction_pension||0);
                                  const hasBank = e.bank_account_number || e.bank_name;
                                  const payMethod = (e.payment_method || 'Bank Transfer').toLowerCase();
                                  const isCash = payMethod.includes('cash');

                                  return (
                                    <div key={e.employee_id} className="pq-emp-row" style={{
                                      background: isPaid ? '#f0fdf4' : isSelected ? '#eff6ff' : '#fff',
                                      border: `1.5px solid ${isPaid ? '#86efac' : isSelected ? '#bfdbfe' : '#e2e8f0'}`,
                                      borderRadius: 12, padding: '16px 20px',
                                      display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-start',
                                      transition: 'all 0.2s ease', cursor: 'default'
                                    }}>
                                      {/* Select checkbox in paying phase */}
                                      {phase === 'paying' && !isPaid && (
                                        <button onClick={() => setPayrollSelected(prev => ({ ...prev, [empKey]: !prev[empKey] }))}
                                          style={{ background:'none', border:'none', cursor:'pointer', color: isSelected ? '#2563EB' : '#D1D5DB', padding: '2px 0', flexShrink: 0, marginTop: 4 }}>
                                          {isSelected ? <CheckSquare size={20} /> : <Square size={20} />}
                                        </button>
                                      )}

                                      {/* Employee Info */}
                                      <div style={{ flex: '1 1 180px', minWidth: 160 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                          <div style={{ width: 36, height: 36, borderRadius: '50%', background: isPaid ? '#dcfce7' : '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14, color: isPaid ? '#16a34a' : '#0284c7', flexShrink: 0 }}>
                                            {(e.full_name||'?')[0].toUpperCase()}
                                          </div>
                                          <div>
                                            <div style={{ fontWeight: 700, fontSize: 15, color: '#0f172a', lineHeight: 1.2 }}>{e.full_name}</div>
                                            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>#{e.employee_id} · {e.dept_name || e.position || '—'}</div>
                                          </div>
                                        </div>
                                        {/* Bank Details */}
                                        <div style={{ marginTop: 8, padding: '8px 12px', background: isCash ? '#fefce8' : '#f0f9ff', borderRadius: 8, border: `1px solid ${isCash ? '#fde68a' : '#bae6fd'}` }}>
                                          <div style={{ fontSize: 10, fontWeight: 700, color: isCash ? '#92400e' : '#0369a1', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 4 }}>
                                            {isCash ? '💵 Cash Payment' : '🏦 Bank Transfer'}
                                          </div>
                                          {hasBank ? (
                                            <>
                                              <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{e.bank_name || 'Unknown Bank'}</div>
                                              <div style={{ fontSize: 12, color: '#475569', fontFamily: 'monospace', letterSpacing: '.05em', marginTop: 1 }}>
                                                {e.bank_account_number ? `Acc: ${e.bank_account_number}` : 'No account number'}
                                              </div>
                                            </>
                                          ) : (
                                            <div style={{ fontSize: 12, color: '#94a3b8', fontStyle: 'italic' }}>No bank details on file</div>
                                          )}
                                          {e.personal_phone && (
                                            <div style={{ fontSize: 11, color: '#64748b', marginTop: 3 }}>📞 {e.personal_phone}</div>
                                          )}
                                        </div>
                                      </div>

                                      {/* Salary Breakdown */}
                                      <div style={{ flex: '1 1 200px', display: 'flex', flexDirection: 'column', gap: 4, minWidth: 170 }}>
                                        <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 4 }}>Salary Breakdown</div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#475569' }}>
                                          <span>Base Salary</span>
                                          <span style={{ fontWeight: 600 }}>{formatCurrency(e.base_salary)}</span>
                                        </div>
                                        {allow > 0 && (
                                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#16a34a' }}>
                                            <span>Allowances</span>
                                            <span style={{ fontWeight: 600 }}>+{formatCurrency(allow)}</span>
                                          </div>
                                        )}
                                        {extra > 0 && (
                                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#0284c7' }}>
                                            <span>Extras</span>
                                            <span style={{ fontWeight: 600 }}>+{formatCurrency(extra)}</span>
                                          </div>
                                        )}
                                        {deduct > 0 && (
                                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#dc2626' }}>
                                            <span>Deductions</span>
                                            <span style={{ fontWeight: 600 }}>-{formatCurrency(deduct)}</span>
                                          </div>
                                        )}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: '#0f172a', borderTop: '1.5px solid #e2e8f0', paddingTop: 6, marginTop: 4 }}>
                                          <span style={{ fontWeight: 700 }}>Net Pay</span>
                                          <span style={{ fontWeight: 800, color: '#16a34a' }}>{formatCurrency(e.net_pay)}</span>
                                        </div>
                                      </div>

                                      {/* Status + Action */}
                                      <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, justifyContent: 'space-between' }}>
                                        {isPaid ? (
                                          <span style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'6px 14px', borderRadius:99, fontSize:12, fontWeight:700, background:'#dcfce7', color:'#15803d', border:'1.5px solid #86efac' }}>
                                            <CheckCircle size={13} /> Paid
                                          </span>
                                        ) : (
                                          <span style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'6px 14px', borderRadius:99, fontSize:12, fontWeight:700, background:'#fef3c7', color:'#92400e', border:'1.5px solid #fde68a' }}>
                                            <Clock size={13} /> Pending
                                          </span>
                                        )}
                                        {phase === 'paying' && !isPaid && (
                                          <button className="pq-pay-btn"
                                            onClick={() => setPayModal({ row, emp: e, isBulk: false })}
                                            style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'9px 18px', background:'#16A34A', color:'#fff', border:'none', borderRadius:9, fontSize:13, fontWeight:700, cursor:'pointer', transition:'all 0.2s', boxShadow:'0 2px 8px rgba(22,163,74,0.25)', whiteSpace:'nowrap' }}>
                                            <CreditCard size={14} /> Pay Now
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>

                              {/* Total row */}
                              <div style={{ padding: '14px 24px', background: '#f1f5f9', borderTop: '1.5px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                                <div style={{ fontSize: 13, fontWeight: 700, color: '#374151' }}>
                                  Total: {emps.length} employees &nbsp;|&nbsp; <span style={{ color: '#16a34a' }}>{paidCount} paid</span> &nbsp;|&nbsp; <span style={{ color: '#f59e0b' }}>{emps.length - paidCount} pending</span>
                                </div>
                                <div style={{ fontWeight: 800, fontSize: 16, color: '#16a34a' }}>
                                  Net Total: {formatCurrency(emps.reduce((s,e) => s + parseFloat(e.net_pay||0), 0))}
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Payment Modal */}
            {payModal && (
              <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
                <div style={{ background: '#fff', borderRadius: 12, padding: 28, width: '100%', maxWidth: 520, boxShadow: '0 25px 60px rgba(0,0,0,0.25)', maxHeight: '90vh', overflowY: 'auto' }}>
                  <h3 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 800, color: '#111827', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <CreditCard size={20} color="#16A34A" />
                    {payModal.isBulk ? `Pay ${Object.values(payrollSelected).filter(Boolean).length} Selected Employees` : `Pay ${payModal.emp?.full_name}`}
                  </h3>

                  {/* Employee payment document */}
                  {!payModal.isBulk && payModal.emp && (
                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: 20, margin: '16px 0', fontSize: 13 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12, color: '#0f172a', borderBottom: '1px solid #e2e8f0', paddingBottom: 8 }}>Payment Document</div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        <div><span style={{ color: '#6B7280', fontSize: 11, display: 'block', fontWeight: 700 }}>EMPLOYEE</span><span style={{ fontWeight: 700, color: '#111827' }}>{payModal.emp.full_name}</span></div>
                        <div><span style={{ color: '#6B7280', fontSize: 11, display: 'block', fontWeight: 700 }}>EMPLOYEE ID</span><span>#{payModal.emp.employee_id}</span></div>
                        <div><span style={{ color: '#6B7280', fontSize: 11, display: 'block', fontWeight: 700 }}>POSITION</span><span>{payModal.emp.position || payModal.emp.department || '—'}</span></div>
                        <div><span style={{ color: '#6B7280', fontSize: 11, display: 'block', fontWeight: 700 }}>PERIOD</span><span>{monthName(payModal.row.month_number)} {payModal.row.year_number}</span></div>
                        <div><span style={{ color: '#6B7280', fontSize: 11, display: 'block', fontWeight: 700 }}>BASE SALARY</span><span style={{ fontWeight: 600 }}>{formatCurrency(payModal.emp.base_salary)}</span></div>
                        <div><span style={{ color: '#6B7280', fontSize: 11, display: 'block', fontWeight: 700 }}>DEDUCTIONS</span><span style={{ color: '#DC2626', fontWeight: 600 }}>-{formatCurrency(parseFloat(payModal.emp.deduction_absent||0)+parseFloat(payModal.emp.deduction_loan||0)+parseFloat(payModal.emp.deduction_tax||0)+parseFloat(payModal.emp.deduction_pension||0))}</span></div>
                      </div>
                      <div style={{ borderTop: '1px solid #e2e8f0', marginTop: 12, paddingTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 700, color: '#374151' }}>NET PAY</span>
                        <span style={{ fontSize: 20, fontWeight: 800, color: '#16A34A' }}>{formatCurrency(payModal.emp.net_pay)}</span>
                      </div>
                    </div>
                  )}

                  {payModal.isBulk && (
                    <p style={{ color: '#6B7280', fontSize: 13, margin: '12px 0 16px' }}>
                      Period: <strong>{monthName(payModal.row.month_number)} {payModal.row.year_number}</strong> — Paying <strong>{Object.values(payrollSelected).filter(Boolean).length}</strong> employees in one batch.
                    </p>
                  )}

                  <div style={{ marginBottom: 16 }}>
                    <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Payment Method</label>
                    <select value={payMethod} onChange={e => setPayMethod(e.target.value)} style={{ width: '100%', height: 40, padding: '0 12px', border: '1.5px solid #E5E7EB', borderRadius: 8, fontSize: 14, background: '#fff' }}>
                      <option>Bank Transfer</option>
                      <option>Cash</option>
                      <option>Cheque</option>
                      <option>Mobile Banking</option>
                    </select>
                  </div>

                  <div style={{ marginBottom: 20 }}>
                    <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Payment Proof (optional)</label>
                    <input type="file" accept="image/*,.pdf" onChange={e => setPayProof(e.target.files[0])} style={{ width: '100%', fontSize: 13, padding: '6px 0' }} />
                    {payProof && <div style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>📎 {payProof.name}</div>}
                  </div>

                  <div style={{ background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: 8, padding: '10px 14px', marginBottom: 20, fontSize: 13, color: '#92400E' }}>
                    ⚠️ This will mark the employee(s) as <strong>Paid</strong> and record the expense in Finance.
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                    <button onClick={() => { setPayModal(null); setPayProof(null); }} style={{ padding: '10px 20px', background: '#F3F4F6', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                    <button
                      onClick={() => payModal.isBulk ? handlePaySelected(payModal.row) : handlePayEmployee(payModal.row, payModal.emp)}
                      disabled={paying}
                      style={{ padding: '10px 22px', background: paying ? '#9CA3AF' : '#16A34A', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: paying ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                      {paying ? <SegmentedSpinner size={16} /> : <CreditCard size={14} />}
                      {paying ? 'Processing…' : 'Confirm Payment'}
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {/* End of Payroll Section Inner Wrappers */}
            </div>
          </div>
        )}

        {/* ══ PV FORM TAB ══ */}
        {activeTab === 'ev' && (
          <form onSubmit={handleSubmit} style={{ width: '100%' }}>
            {maintSource && (
              <div style={{ background: 'var(--color-info-bg)', border: '1px solid #BAE6FD', padding: '14px 16px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12, fontWeight: 500, color: '#0369A1', borderRadius: 10, flexWrap: 'wrap' }}>
                <CheckCircle size={20} />
                <span style={{ flex: 1 }}>EV pre-filled for <strong>{maintSource.asset}</strong>. Complete form and generate.</span>
                <button type="button" onClick={() => { setMaintSource(null); resetForm(); }} style={{ background: 'var(--color-danger)', color: '#FFFFFF', border: 'none', padding: '8px 14px', fontWeight: 600, fontSize: 13, borderRadius: 8, cursor: 'pointer' }}>Clear</button>
              </div>
            )}

            {/* General Information */}
            <div className="card-container" style={{ padding: 24 }}>
              <h3 className="section-title"><User size={20} /> General Information</h3>
              <div className="grid-2" style={{ marginBottom: 20 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: 6 }}>Date Paid *</label>
                  <input className="form-input" required type="date" value={date} onChange={e => setDate(e.target.value)} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: 6 }}>Paid To *</label>
                  <input className="form-input" required value={paidTo} onChange={e => setPaidTo(e.target.value)} placeholder="Supplier / Employee / Vendor" />
                </div>
              </div>
              <div className="grid-2" style={{ marginBottom: 20 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: 6 }}>Amount (ETB) *</label>
                  <input className="form-input" required type="number" step="0.01" value={amount} onChange={handleAmountChange} placeholder="0.00" style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-primary)' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: 6 }}>Amount in Words</label>
                  <input className="form-input" readOnly value={amountWords} placeholder="Auto-filled" style={{ fontStyle: 'italic' }} />
                </div>
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: 6 }}>Description *</label>
                <input className="form-input" required value={description} onChange={e => setDescription(e.target.value)} placeholder="Reason for payment" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: 6 }}>Reference # (Optional)</label>
                <input className="form-input" value={referenceNo} onChange={e => setReferenceNo(e.target.value)} placeholder="Bill #, Order ID" />
              </div>
            </div>

            {/* Payment Method */}
            <div className="card-container" style={{ padding: 24 }}>
              <h3 className="section-title"><Banknote size={20} /> Payment Method</h3>
              <div style={{ marginBottom: paymentMethod && paymentMethod !== 'Cash' ? 24 : 0 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Pay From Finance Account *</label>
                <select className="form-input" required value={financeAccountId} onChange={e => applyFinanceAccount(e.target.value)}
                  style={{ width: '100%', padding: '12px 14px', border: '1px solid #7dd3fc', borderRadius: 8, fontSize: 14 }}>
                  <option value="">Select Finance Account...</option>
                  {companyAccounts.filter(a => a.status === 'Active').map(a => (
                    <option key={a.id} value={a.id}>
                      {a.account_name} — {a.account_number || '—'} ({a.account_type}){a.netBalance != null ? ` • ETB ${Number(a.netBalance).toLocaleString()}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {paymentMethod === 'Bank' && (
                <div style={{ background: '#F9FAFB', padding: 20, border: '1px solid var(--color-border)', borderRadius: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <h4 style={{ margin: 0, fontSize: 14, color: 'var(--color-text-primary)', fontWeight: 600 }}>Bank Details</h4>
                    <select className="form-input" style={{ width: 250, padding: '8px 12px', border: '1px solid #7dd3fc', borderRadius: 8, fontSize: 13 }} onChange={e => {
                      const acc = companyAccounts.find(a => a.id.toString() === e.target.value);
                      if (acc) { setBankName(acc.bank_provider || ''); setAccountHolder('Sutana Enterprise'); setAccountNumber(acc.account_number || ''); }
                    }}><option value="">Select Company Bank Account...</option>{companyAccounts.filter(a => a.account_type === 'Bank').map(a => <option key={a.id} value={a.id}>{a.account_name} - {a.account_number}</option>)}</select>
                  </div>
                  <div className="grid-2">
                    <input className="form-input" required value={bankName} onChange={e => setBankName(e.target.value)} placeholder="Bank Name *" />
                    <input className="form-input" required value={accountHolder} onChange={e => setAccountHolder(e.target.value)} placeholder="Account Holder *" />
                    <input className="form-input" required value={accountNumber} onChange={e => setAccountNumber(e.target.value)} placeholder="Account Number *" />
                    <input className="form-input" value={chequeNo} onChange={e => setChequeNo(e.target.value)} placeholder="Cheque # (Optional)" />
                  </div>
                </div>
              )}

              {paymentMethod === 'Telebirr' && (
                <div style={{ background: '#F9FAFB', padding: 20, border: '1px solid var(--color-border)', borderRadius: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <h4 style={{ margin: 0, fontSize: 14, color: 'var(--color-text-primary)', fontWeight: 600 }}>Telebirr Details</h4>
                    <select className="form-input" style={{ width: 250, padding: '8px 12px', border: '1px solid #fcd34d', borderRadius: 8, fontSize: 13 }} onChange={e => {
                      const acc = companyAccounts.find(a => a.id.toString() === e.target.value);
                      if (acc) { setTelebirrNumber(acc.account_number || ''); setTelebirrName(acc.account_name || 'Sutana Enterprise'); }
                    }}><option value="">Select Company Telebirr...</option>{companyAccounts.filter(a => a.account_type === 'Mobile Wallet').map(a => <option key={a.id} value={a.id}>{a.account_name} - {a.account_number}</option>)}</select>
                  </div>
                  <div className="grid-2">
                    <input className="form-input" required value={telebirrNumber} onChange={e => setTelebirrNumber(e.target.value)} placeholder="Mobile Number *" />
                    <input className="form-input" required value={telebirrName} onChange={e => setTelebirrName(e.target.value)} placeholder="Full Name *" />
                  </div>
                </div>
              )}
            </div>

            {/* Signatures */}
            <div className="card-container" style={{ padding: 24 }}>
              <h3 className="section-title"><PenTool size={20} /> Signatures</h3>
              <div className="grid-2">
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: 6 }}>Prepared By (Name) *</label>
                  <input className="form-input" required value={preparedBy} onChange={e => setPreparedBy(e.target.value)} placeholder="Accountant Name" style={{ marginBottom: 12 }} />
                  <p style={{ margin: '-6px 0 12px', fontSize: 11, color: '#94a3b8' }}>Auto-filled from your profile</p>
                  <SigPad label="Prepared By" onSave={setPreparedSig} storageKey="accountant_signature" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: 6 }}>Payee's Name *</label>
                  <input className="form-input" required value={receiverName} onChange={e => setReceiverName(e.target.value)} placeholder="Payee Name" style={{ marginBottom: 12 }} />
                  <SigPad label="Payee" onSave={setReceiverSig} />
                </div>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary" style={{
              width: '100%', minHeight: 44, fontSize: 16,
              background: loading ? '#9CA3AF' : '#2563EB',
              display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12,
              marginTop: 16
            }}>
              {loading ? <SegmentedSpinner size={22} /> : <CheckCircle size={22} />}
              {loading ? 'Processing...' : maintSource ? `Generate EV & Release Payment for ${maintSource.asset}` : 'Create Expense Voucher'}
            </button>
          </form>
        )}

        {/* ══ HISTORY TAB ══ */}
        {activeTab === 'history' && (() => {
          const filteredHistory = histMonthFilter === 'All' ? historyList : historyList.filter(item => {
            if (!item.date) return false;
            return new Date(item.date).toISOString().substring(0, 7) === histMonthFilter;
          });
          const filteredPayroll = histMonthFilter === 'All' ? payrollHistory : payrollHistory.filter(row => {
            return `${row.year_number}-${String(row.month_number).padStart(2, '0')}` === histMonthFilter;
          });
          
          const genTotal = filteredHistory.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0);
          const payTotal = filteredPayroll.reduce((s, i) => s + (parseFloat(i.total_net_pay) || 0), 0);
          const grandTotal = genTotal + payTotal;
          
          const monthSet = new Set();
          historyList.forEach(i => { if (i.date) monthSet.add(new Date(i.date).toISOString().substring(0, 7)); });
          payrollHistory.forEach(r => monthSet.add(`${r.year_number}-${String(r.month_number).padStart(2, '0')}`));
          const allMonths = Array.from(monthSet).sort().reverse();

          // ── Build and open a clean print page in a new tab ──────────────
          const openPrintPage = () => {
            const periodLabel = histMonthFilter === 'All' ? 'All Time' : new Date(histMonthFilter + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

            const genRows = filteredHistory.map((item, idx) => `
              <tr style="background:${idx%2===0?'#fff':'#f8fafc'}">
                <td>${idx+1}</td>
                <td><strong>${item.asset || item.description || '—'}</strong></td>
                <td>${item.source || '—'}</td>
                <td>${item.type || '—'}</td>
                <td>${item.date ? new Date(item.date).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}) : '—'}</td>
                <td style="text-align:right;font-weight:700">ETB ${parseFloat(item.amount||0).toLocaleString(undefined,{minimumFractionDigits:2})}</td>
                <td style="text-align:center"><span style="background:#DCFCE7;color:#15803D;padding:2px 8px;border-radius:99px;font-size:11px;font-weight:700">✓ Completed</span></td>
              </tr>
            `).join('');

            const payRows = filteredPayroll.map((row, idx) => {
              const mName = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][row.month_number-1] || row.month_number;
              const hKey = `${row.month_number}-${row.year_number}`;
              const emps = payrollDetail[hKey] || [];
              const empSubRows = emps.map((e,ei) => {
                const isCash = (e.payment_method||'').toLowerCase().includes('cash');
                const methodHtml = isCash 
                  ? '💵 Cash' 
                  : `🏦 Bank${`<br><span style="font-size:9px;color:#64748b;font-family:monospace">${e.bank_name || 'CBE'}</span>`}${`<br><span style="font-size:9px;color:#64748b;font-family:monospace">A/C: ${e.bank_account_number || '—'}</span>`}`;
                
                return `
                <tr style="background:${ei%2===0?'#f0fdf4':'#fff'}">
                  <td style="padding:5px 8px 5px 24px;color:#94a3b8">${ei+1}</td>
                  <td style="padding:5px 8px;font-weight:600">${e.full_name||'—'}</td>
                  <td style="padding:5px 8px;color:#475569">${e.dept_name||e.dept_id||'—'}</td>
                  <td style="padding:5px 8px;text-align:right">${parseFloat(e.base_salary||0).toLocaleString(undefined,{minimumFractionDigits:2})}</td>
                  <td style="padding:5px 8px;text-align:right;font-weight:700">${parseFloat(e.net_pay||0).toLocaleString(undefined,{minimumFractionDigits:2})}</td>
                  <td style="padding:5px 8px;text-align:center;line-height:1.2">${methodHtml}</td>
                  <td style="padding:5px 8px;text-align:center"><span style="background:#DCFCE7;color:#15803D;padding:2px 6px;border-radius:99px;font-size:10px;font-weight:700">✓ Paid</span></td>
                </tr>
              `}).join('');
              return `
                <tr style="background:#dcfce7;font-weight:800;border-top:2px solid #86efac">
                  <td>${idx+1}</td>
                  <td><strong>${mName} ${row.year_number} Payroll</strong></td>
                  <td>Payroll</td>
                  <td>${row.total_employees||'—'} employees</td>
                  <td>${mName} ${row.year_number}</td>
                  <td style="text-align:right;font-weight:900">ETB ${parseFloat(row.total_net_pay||0).toLocaleString(undefined,{minimumFractionDigits:2})}</td>
                  <td style="text-align:center"><span style="background:#DCFCE7;color:#15803D;padding:2px 8px;border-radius:99px;font-size:11px;font-weight:700">✓ Paid</span></td>
                </tr>
                ${emps.length > 0 ? `
                  <tr><td colspan="7" style="padding:0;background:#f0fdf4">
                    <table style="width:100%;border-collapse:collapse;font-size:11px">
                      <thead><tr style="background:#bbf7d0">
                        <th style="padding:5px 8px 5px 24px;text-align:left">#</th>
                        <th style="padding:5px 8px;text-align:left">Employee</th>
                        <th style="padding:5px 8px;text-align:left">Department</th>
                        <th style="padding:5px 8px;text-align:right">Base Salary</th>
                        <th style="padding:5px 8px;text-align:right">Net Pay</th>
                        <th style="padding:5px 8px;text-align:center">Bank / Account</th>
                        <th style="padding:5px 8px;text-align:center">Status</th>
                      </tr></thead>
                      <tbody>${empSubRows}</tbody>
                    </table>
                  </td></tr>
                ` : ''}
              `;
            }).join('');

            const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>Payment History — ${periodLabel}</title>
  <style>
    @page { margin: 15mm; size: A4; }
    * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    body { font-family: Arial, sans-serif; background: #fff; color: #0f172a; margin: 0; padding: 24px; font-size: 13px; }
    h1 { font-size: 22px; font-weight: 900; margin: 0 0 4px; }
    .subtitle { font-size: 12px; color: #64748b; margin: 0 0 20px; }
    .summary { display: flex; gap: 14px; margin-bottom: 24px; flex-wrap: wrap; }
    .card { padding: 12px 16px; border-radius: 8px; flex: 1; min-width: 140px; }
    .card.green { background: #f0fdf4; border: 1px solid #bbf7d0; }
    .card.gray  { background: #f8fafc; border: 1px solid #e2e8f0; }
    .card .lbl  { font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: .06em; color: #64748b; margin-bottom: 4px; }
    .card .val  { font-size: 18px; font-weight: 900; color: #15803d; }
    .card.gray .val { color: #334155; font-size: 15px; }
    h2 { font-size: 14px; font-weight: 800; color: #334155; margin: 24px 0 8px; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 8px; }
    thead tr { background: #e2e8f0; }
    th { padding: 8px 10px; font-weight: 700; color: #475569; text-align: left; }
    td { padding: 7px 10px; border-bottom: 1px solid #e2e8f0; }
    tfoot tr { background: #cbd5e1; font-weight: 800; }
    .page-break { page-break-before: always; break-before: page; padding-top: 16px; }
    .no-print { margin-bottom: 20px; }
    @media print { .no-print { display: none; } }
  </style>
</head>
<body>
  <div class="no-print">
    <button onclick="window.print()" style="padding:10px 22px;background:#1D4ED8;color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer">🖨️ Print / Save as PDF</button>
    <button onclick="window.close()" style="margin-left:10px;padding:10px 20px;background:#f1f5f9;color:#334155;border:1px solid #cbd5e1;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer">✕ Close</button>
  </div>

  <h1>✅ Completed Payments History</h1>
  <p class="subtitle">Period: <strong>${periodLabel}</strong> &nbsp;|&nbsp; Printed: ${new Date().toLocaleString('en-GB')}</p>

  <div class="summary">
    <div class="card green"><div class="lbl">Grand Total (${periodLabel})</div><div class="val">ETB ${grandTotal.toLocaleString(undefined,{minimumFractionDigits:2})}</div></div>
    <div class="card gray"><div class="lbl">Fleet / General</div><div class="val">ETB ${genTotal.toLocaleString(undefined,{minimumFractionDigits:2})}</div></div>
    <div class="card gray"><div class="lbl">Payroll</div><div class="val">ETB ${payTotal.toLocaleString(undefined,{minimumFractionDigits:2})}</div></div>
    <div class="card gray"><div class="lbl">Fleet Records</div><div class="val">${filteredHistory.length}</div></div>
    <div class="card gray"><div class="lbl">Payroll Batches</div><div class="val">${filteredPayroll.length}</div></div>
  </div>

  <h2>📄 Fleet / General Payments (${filteredHistory.length})</h2>
  ${filteredHistory.length === 0 ? '<p style="color:#94a3b8;font-style:italic">No records for this period.</p>' : `
    <table>
      <thead><tr><th>#</th><th>Asset / Description</th><th>Source</th><th>Type</th><th>Date</th><th style="text-align:right">Amount</th><th style="text-align:center">Status</th></tr></thead>
      <tbody>${genRows}</tbody>
      <tfoot><tr><td colspan="5" style="padding:8px 10px">TOTAL</td><td style="padding:8px 10px;text-align:right">ETB ${genTotal.toLocaleString(undefined,{minimumFractionDigits:2})}</td><td></td></tr></tfoot>
    </table>
  `}

  <div class="page-break">
    <h2>👥 Payroll History (${filteredPayroll.length})</h2>
    ${filteredPayroll.length === 0 ? '<p style="color:#94a3b8;font-style:italic">No payroll records for this period.</p>' : `
      <table>
        <thead><tr><th>#</th><th>Period</th><th>Type</th><th>Employees</th><th>Month</th><th style="text-align:right">Net Pay</th><th style="text-align:center">Status</th></tr></thead>
        <tbody>${payRows}</tbody>
        <tfoot><tr><td colspan="5" style="padding:8px 10px">TOTAL</td><td style="padding:8px 10px;text-align:right">ETB ${payTotal.toLocaleString(undefined,{minimumFractionDigits:2})}</td><td></td></tr></tfoot>
      </table>
    `}
  </div>
</body>
</html>`;

            const win = window.open('', '_blank');
            win.document.write(html);
            win.document.close();
          };

          return (
          <div className="card-container" id="printable-history">
            <div style={{ padding: '20px 24px', background: '#F9FAFB', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 24, fontWeight: 600, color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CheckCircle size={20} color="#16A34A" /> Completed Payments History
                </h2>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--color-text-secondary)', fontWeight: 400 }}>Click any row to expand full detail. All records are read-only.</p>
              </div>
              <div className="no-print" style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                <select value={histMonthFilter} onChange={e => setHistMonthFilter(e.target.value)} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #D1D5DB', fontSize: 14, fontWeight: 500, color: '#374151', background: '#fff', height: 38 }}>
                  <option value="All">All Time</option>
                  {allMonths.map(m => <option key={m} value={m}>{new Date(m + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</option>)}
                </select>
                <button onClick={openPrintPage} style={{ padding: '9px 16px', display: 'flex', alignItems: 'center', gap: 8, background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>
                  <Printer size={16} /> Print
                </button>
                <button className="btn-primary" onClick={() => { loadPending(); fetchPayrollQueue(); }} style={{ padding: '9px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <RefreshCw size={16} /> Refresh
                </button>
              </div>
            </div>

            <div style={{ padding: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
                <div style={{ background: '#F0FDF4', padding: '16px 20px', borderRadius: 12, border: '1px solid #BBF7D0' }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: '#166534', textTransform: 'uppercase', marginBottom: 4 }}>Total Expense ({histMonthFilter === 'All' ? 'All Time' : histMonthFilter})</div>
                  <div style={{ fontSize: 24, fontWeight: 900, color: '#15803D' }}>ETB {grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                </div>
                <div style={{ background: '#F8FAFC', padding: '16px 20px', borderRadius: 12, border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: 4 }}>Fleet / General Total</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: '#334155' }}>ETB {genTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                </div>
                <div style={{ background: '#F8FAFC', padding: '16px 20px', borderRadius: 12, border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: 4 }}>Payroll Total</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: '#334155' }}>ETB {payTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                </div>
              </div>

              {/* Fleet / General Payments */}
              <h3 style={{ margin: '0 0 12px', fontSize: 15, color: '#334155', display: 'flex', alignItems: 'center', gap: 8 }}>
                <FileText size={17} /> Fleet / General Payments
                <span style={{ marginLeft: 6, background: '#E2E8F0', color: '#475569', borderRadius: 99, padding: '2px 10px', fontSize: 12, fontWeight: 700 }}>{filteredHistory.length}</span>
              </h3>
              {filteredHistory.length === 0 ? (
                <div style={{ padding: 32, textAlign: 'center', color: '#94A3B8', border: '2px dashed #E2E8F0', borderRadius: 10, marginBottom: 32 }}>No general payment history found.</div>
              ) : (
                <div style={{ border: '1px solid #E2E8F0', borderRadius: 10, marginBottom: 36, overflow: 'hidden' }}>
                  {filteredHistory.map((item, idx) => {
                    const isOpen = histExpandedGen === item.id;
                    return (
                      <div key={item.id} className="print-avoid-break" style={{ borderBottom: idx < filteredHistory.length - 1 ? '1px solid #E2E8F0' : 'none' }}>
                        <div onClick={() => setHistExpandedGen(isOpen ? null : item.id)}
                          style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 12, padding: '14px 20px', background: isOpen ? '#F0FDF4' : idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC', cursor: 'pointer', userSelect: 'none' }}>
                          <div style={{ flexShrink: 0, background: '#DCFCE7', padding: '10px', borderRadius: 8, border: '1.5px solid #86EFAC' }}>
                            <CheckCircle size={18} color="#16A34A" />
                          </div>
                          <div style={{ flex: 1, minWidth: 180 }}>
                            <div style={{ fontWeight: 700, color: '#0F172A', fontSize: 14 }}>{item.asset || item.description || '—'}</div>
                            <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>{item.source}{item.type ? ` · ${item.type}` : ''}{item.date ? ` · ${new Date(item.date).toLocaleDateString()}` : ''}</div>
                          </div>
                          <div style={{ fontWeight: 800, color: '#0F172A', fontSize: 15, textAlign: 'right' }}>
                            ETB {item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </div>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700, background: '#DCFCE7', color: '#15803D' }}>
                            <CheckCircle size={10}/> Completed
                          </span>
                          <span style={{ fontSize: 16, color: '#94A3B8', width: 22, textAlign: 'center' }}>{isOpen ? '▲' : '▼'}</span>
                        </div>
                        {isOpen && (
                          <div style={{ background: '#F8FAFC', borderTop: '1px solid #E2E8F0', padding: '20px 24px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 14, marginBottom: 16 }}>
                              {[
                                { label: 'Source', value: item.source },
                                { label: 'Asset / Vehicle', value: item.asset || '—' },
                                { label: 'Request Type', value: item.type || '—' },
                                { label: 'Date', value: item.date ? new Date(item.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—' },
                                { label: 'Priority', value: item.priority || '—' },
                                { label: 'Mechanic / Driver', value: item.mechanic_name || '—' },
                                { label: 'Location', value: item.location || '—' },
                                { label: 'Total Amount', value: `ETB ${item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}` },
                              ].map(f => (
                                <div key={f.label} style={{ background: '#fff', padding: '12px 14px', borderRadius: 8, border: '1px solid #E2E8F0' }}>
                                  <div style={{ fontSize: 10, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 5 }}>{f.label}</div>
                                  <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>{f.value}</div>
                                </div>
                              ))}
                            </div>
                            {item.notes && (
                              <div style={{ background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: 8, padding: '12px 16px', fontSize: 13, color: '#92400E', marginTop: 4 }}>
                                <strong>Notes:</strong> {item.notes}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Payroll History */}
              <div className="print-page-break">
                <h3 style={{ margin: '0 0 12px', fontSize: 15, color: '#334155', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Users size={17} /> Payroll History
                  <span style={{ marginLeft: 6, background: '#E2E8F0', color: '#475569', borderRadius: 99, padding: '2px 10px', fontSize: 12, fontWeight: 700 }}>{filteredPayroll.length}</span>
                </h3>
              </div>
              {filteredPayroll.length === 0 ? (
                <div style={{ padding: 32, textAlign: 'center', color: '#94A3B8', border: '2px dashed #E2E8F0', borderRadius: 10 }}>No payroll history found.</div>
              ) : (
                <div style={{ border: '1px solid #E2E8F0', borderRadius: 10, overflow: 'hidden' }}>
                  {filteredPayroll.map((row, idx) => {
                    const mName = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][row.month_number - 1] || row.month_number;
                    const hKey = `${row.month_number}-${row.year_number}`;
                    const isOpen = histExpandedPay === hKey;
                    const hEmps = payrollDetail[hKey] || [];
                    const hLoading = payrollDetailLoading === hKey;

                    const handleHistOpen = async () => {
                      if (isOpen) { setHistExpandedPay(null); return; }
                      setHistExpandedPay(hKey);
                      if (payrollDetail[hKey]) return;
                      setPayrollDetailLoading(hKey);
                      try {
                        const res = await api.get(`/hr/etp/payroll/summary/${row.month_number}/${row.year_number}`);
                        const d = res?.data || res;
                        setPayrollDetail(prev => ({ ...prev, [hKey]: Array.isArray(d.employees) ? d.employees : [] }));
                      } catch { setPayrollDetail(prev => ({ ...prev, [hKey]: [] })); }
                      finally { setPayrollDetailLoading(null); }
                    };

                    const totalNet = hEmps.reduce((s, e) => s + parseFloat(e.net_pay || 0), 0);
                    const paidCount = hEmps.length;
                    const paidPct = hEmps.length > 0 ? 100 : 0;

                    return (
                      <div key={hKey} className="print-avoid-break" style={{ borderBottom: idx < filteredPayroll.length - 1 ? '1px solid #E2E8F0' : 'none' }}>
                        <div onClick={handleHistOpen}
                          style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 12, padding: '16px 20px', background: isOpen ? '#F0FDF4' : idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC', cursor: 'pointer', userSelect: 'none' }}>
                          <div style={{ flexShrink: 0, background: '#DCFCE7', padding: '10px 12px', borderRadius: 10, border: '1.5px solid #86EFAC' }}>
                            <Users size={20} color="#16A34A" />
                          </div>
                          <div style={{ flex: 1, minWidth: 180 }}>
                            <div style={{ fontWeight: 800, fontSize: 16, color: '#0F172A' }}>{mName} {row.year_number} Payroll</div>
                            <div style={{ fontSize: 13, color: '#64748B', marginTop: 2 }}>
                              {row.total_employees} employees
                              {row.approved_by_ceo && <span style={{ marginLeft: 8, fontSize: 11, color: '#94A3B8' }}>· Approved: {row.approved_by_ceo}</span>}
                            </div>
                          </div>
                          {isOpen && hEmps.length > 0 && (
                            <div style={{ textAlign: 'center', background: '#F0FDF4', border: '1.5px solid #86EFAC', borderRadius: 10, padding: '8px 18px' }}>
                              <div style={{ fontSize: 20, fontWeight: 900, color: '#15803D', lineHeight: 1 }}>{paidCount}</div>
                              <div style={{ fontSize: 10, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginTop: 2 }}>of {hEmps.length} paid</div>
                            </div>
                          )}
                          <div style={{ fontWeight: 800, color: '#0F172A', fontSize: 15, textAlign: 'right', minWidth: 130 }}>
                            ETB {parseFloat(row.total_net_pay || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </div>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '5px 12px', borderRadius: 99, fontSize: 12, fontWeight: 700, background: '#DCFCE7', color: '#15803D', border: '1.5px solid #86EFAC' }}>
                            <CheckCircle size={11}/> Paid
                          </span>
                          <span style={{ fontSize: 16, color: '#94A3B8', width: 22, textAlign: 'center' }}>{isOpen ? '▲' : '▼'}</span>
                        </div>

                        {isOpen && (
                          <div style={{ background: '#F8FAFC', borderTop: '1px solid #E2E8F0' }}>
                            {hLoading ? (
                              <div style={{ padding: 40, textAlign: 'center', color: '#94A3B8', fontSize: 14 }}>⏳ Loading employee data…</div>
                            ) : hEmps.length === 0 ? (
                              <div style={{ padding: 40, textAlign: 'center', color: '#94A3B8', fontSize: 14 }}>No employee records found.</div>
                            ) : (
                              <>
                                <div style={{ display: 'flex', gap: 14, padding: '16px 20px', flexWrap: 'wrap', borderBottom: '1px solid #E2E8F0' }}>
                                  {[
                                    { label: 'Total Employees', value: hEmps.length, color: '#0369A1', bg: '#EFF6FF' },
                                    { label: 'Employees Paid', value: `${paidCount} / ${hEmps.length} (${paidPct}%)`, color: '#15803D', bg: '#F0FDF4' },
                                    { label: 'Total Net Pay', value: `ETB ${totalNet.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, color: '#15803D', bg: '#F0FDF4' },
                                    { label: 'Period', value: `${mName} ${row.year_number}`, color: '#334155', bg: '#F8FAFC' },
                                  ].map(s => (
                                    <div key={s.label} style={{ background: s.bg, border: '1px solid #E2E8F0', borderRadius: 8, padding: '10px 18px', flex: '1 1 130px', minWidth: 110 }}>
                                      <div style={{ fontSize: 10, color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.05em' }}>{s.label}</div>
                                      <div style={{ fontSize: 15, fontWeight: 800, color: s.color, marginTop: 4 }}>{s.value}</div>
                                    </div>
                                  ))}
                                </div>
                                <div style={{ overflowX: 'auto' }}>
                                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
                                    <thead>
                                      <tr style={{ background: '#F9FAFB' }}>
                                        {['#','Employee','Department','Base Salary','Allowances','Extras','Deductions','Net Pay','Bank / Account','Status'].map(h => (
                                          <th key={h} style={{ padding: '10px 12px', fontWeight: 500, color: '#6B7280', whiteSpace: 'nowrap', textAlign: ['Base Salary','Allowances','Extras','Deductions','Net Pay'].includes(h) ? 'right' : h === 'Status' ? 'center' : 'left' }}>{h}</th>
                                        ))}
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {hEmps.map((emp, ei) => {
                                        const allow = parseFloat(emp.housing_allowance||0)+parseFloat(emp.transport_allowance||0)+parseFloat(emp.communication_allowance||0);
                                        const extra = parseFloat(emp.overtime_pay||0)+parseFloat(emp.bonus_pay||0);
                                        const deduct = parseFloat(emp.deduction_absent||0)+parseFloat(emp.deduction_loan||0)+parseFloat(emp.deduction_tax||0)+parseFloat(emp.deduction_pension||0);
                                        const isPaid = true; // History tab assumes paid
                                        const isCash = (emp.payment_method || '').toLowerCase().includes('cash');
                                        return (
                                          <tr key={emp.employee_id} className="table-row" style={{ background: '#FFFFFF', borderBottom: '1px solid var(--color-border)' }}>
                                            <td style={{ padding: '10px 12px', color: '#94A3B8', fontWeight: 700 }}>{ei + 1}</td>
                                            <td style={{ padding: '10px 12px' }}>
                                              <div style={{ fontWeight: 700, color: '#0F172A' }}>{emp.full_name}</div>
                                              <div style={{ fontSize: 11, color: '#94A3B8', fontFamily: 'monospace' }}>#{emp.employee_id}</div>
                                            </td>
                                            <td style={{ padding: '10px 12px', color: '#475569' }}>{emp.dept_name || emp.dept_id || '—'}</td>
                                            <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: '#334155' }}>{parseFloat(emp.base_salary||0).toLocaleString(undefined,{minimumFractionDigits:2})}</td>
                                            <td style={{ padding: '10px 12px', textAlign: 'right', color: '#16A34A', fontWeight: 600 }}>{allow > 0 ? `+${allow.toLocaleString(undefined,{minimumFractionDigits:2})}` : '—'}</td>
                                            <td style={{ padding: '10px 12px', textAlign: 'right', color: '#0369A1', fontWeight: 600 }}>{extra > 0 ? `+${extra.toLocaleString(undefined,{minimumFractionDigits:2})}` : '—'}</td>
                                            <td style={{ padding: '10px 12px', textAlign: 'right', color: '#DC2626', fontWeight: 600 }}>{deduct > 0 ? `-${deduct.toLocaleString(undefined,{minimumFractionDigits:2})}` : '—'}</td>
                                            <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 800, color: '#0F172A', fontSize: 14 }}>{parseFloat(emp.net_pay||0).toLocaleString(undefined,{minimumFractionDigits:2})}</td>
                                            <td style={{ padding: '10px 12px', minWidth: 140 }}>
                                               {isCash ? (
                                                 <div style={{ display:'inline-flex', alignItems:'center', gap:5, background:'#FEF3C7', color:'#92400E', padding:'3px 10px', borderRadius:99, fontSize:11, fontWeight:700 }}>💵 Cash</div>
                                               ) : (
                                                 <div>
                                                   <div style={{ display:'inline-flex', alignItems:'center', gap:5, background:'#EFF6FF', color:'#1D4ED8', padding:'3px 10px', borderRadius:99, fontSize:11, fontWeight:700, marginBottom: 4 }}>🏦 Bank Transfer</div>
                                                   <div style={{ fontSize:12, fontWeight:700, color:'#334155', marginTop:3 }}>{emp.bank_name || 'CBE'}</div>
                                                   <div style={{ fontSize:11, color:'#64748B', fontFamily:'monospace', letterSpacing:'.05em', marginTop:2 }}>A/C: {emp.bank_account_number || '—'}</div>
                                                 </div>
                                               )}
                                            </td>
                                            <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                                              {isPaid
                                                ? <span style={{ display:'inline-flex', alignItems:'center', gap:3, padding:'3px 8px', borderRadius:99, fontSize:11, fontWeight:700, background:'#DCFCE7', color:'#15803D' }}><CheckCircle size={10}/> Paid</span>
                                                : <span style={{ display:'inline-flex', alignItems:'center', gap:3, padding:'3px 8px', borderRadius:99, fontSize:11, fontWeight:700, background:'#FEF3C7', color:'#92400E' }}>⏳ Pending</span>
                                              }
                                            </td>
                                          </tr>
                                        );
                                      })}
                                      {hEmps.length === 0 && (
                                        <tr><td colSpan={10} style={{ padding: 20, textAlign: 'center', color: '#94A3B8' }}>No employees in this batch.</td></tr>
                                      )}
                                    </tbody>
                                    <tfoot>
                                      <tr style={{ background: '#CBD5E1', fontWeight: 800 }}>
                                        <td colSpan={3} style={{ padding: '10px 12px', color: '#334155', fontWeight: 800 }}>TOTALS</td>
                                        <td style={{ padding: '10px 12px', textAlign: 'right', color: '#334155' }}>{hEmps.reduce((s,e)=>s+parseFloat(e.base_salary||0),0).toLocaleString(undefined,{minimumFractionDigits:2})}</td>
                                        <td style={{ padding: '10px 12px', textAlign: 'right', color: '#16A34A' }}>+{hEmps.reduce((s,e)=>s+parseFloat(e.housing_allowance||0)+parseFloat(e.transport_allowance||0)+parseFloat(e.communication_allowance||0),0).toLocaleString(undefined,{minimumFractionDigits:2})}</td>
                                        <td style={{ padding: '10px 12px', textAlign: 'right', color: '#0369A1' }}>+{hEmps.reduce((s,e)=>s+parseFloat(e.overtime_pay||0)+parseFloat(e.bonus_pay||0),0).toLocaleString(undefined,{minimumFractionDigits:2})}</td>
                                        <td style={{ padding: '10px 12px', textAlign: 'right', color: '#DC2626' }}>-{hEmps.reduce((s,e)=>s+parseFloat(e.deduction_absent||0)+parseFloat(e.deduction_loan||0)+parseFloat(e.deduction_tax||0)+parseFloat(e.deduction_pension||0),0).toLocaleString(undefined,{minimumFractionDigits:2})}</td>
                                        <td style={{ padding: '10px 12px', textAlign: 'right', color: '#0F172A', fontSize: 15 }}>{totalNet.toLocaleString(undefined,{minimumFractionDigits:2})}</td>
                                        <td colSpan={2}></td>
                                      </tr>
                                    </tfoot>
                                  </table>
                                </div>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
</div>
           </div>
         );
         })()}
      </div>

      {/* ══ VOUCHER DETAIL MODAL ══ */}
      {selectedVoucher && (() => {
        const v = selectedVoucher;
        const badge = {
          pending_ceo:      { bg: 'var(--color-warning-bg)',  color: '#92400E', label: 'Pending CEO Approval' },
          approved_finance: { bg: 'var(--color-info-bg)',     color: '#0369A1', label: 'Approved — Ready to Finalize' },
          rejected:         { bg: 'var(--color-danger-bg)',   color: '#991B1B', label: 'Rejected' },
          completed:        { bg: 'var(--color-success-bg)',  color: '#15803D', label: 'Completed' },
        }[v.status] || { bg: '#F3F4F6', color: '#374151', label: v.status };
        return (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={e => e.target === e.currentTarget && setSelectedVoucher(null)}>
            <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 680, boxShadow: '0 25px 60px rgba(0,0,0,0.25)', maxHeight: '92vh', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
              {/* Header */}
              <div style={{ padding: '20px 28px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0F172A', borderRadius: '16px 16px 0 0' }}>
                <div>
                  <div style={{ fontFamily: 'monospace', fontWeight: 900, fontSize: 20, color: '#60A5FA', letterSpacing: 1 }}>{v.ev_number}</div>
                  <span style={{ background: badge.bg, color: badge.color, padding: '3px 12px', fontSize: 12, fontWeight: 700, borderRadius: 99, marginTop: 6, display: 'inline-block' }}>{badge.label}</span>
                </div>
                <button onClick={() => setSelectedVoucher(null)} style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.2)', fontSize: 20, cursor: 'pointer', color: '#94a3b8', borderRadius: 8, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>×</button>
              </div>

              {/* Body */}
              <div style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 18 }}>

                {/* Key Info Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  {[['Date', new Date(v.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })],
                    ['Payment Method', v.payment_method],
                    ['Reference No', v.reference_no || v.referenceNo || '—'],
                    ['Prepared By', v.prepared_by || '—'],
                  ].map(([label, val]) => (
                    <div key={label} style={{ background: '#f8fafc', borderRadius: 8, padding: '10px 14px', border: '1px solid #e2e8f0' }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', display: 'block', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</span>
                      <span style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{val}</span>
                    </div>
                  ))}
                </div>

                {/* Paid To */}
                <div style={{ background: '#eff6ff', borderRadius: 10, padding: '14px 18px', border: '1px solid #bfdbfe' }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#3b82f6', display: 'block', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Paid To</span>
                  <span style={{ fontSize: 18, fontWeight: 800, color: '#1e3a8a' }}>{v.paid_to}</span>
                </div>

                {/* Description */}
                {v.description && (
                  <div style={{ background: '#f9fafb', borderRadius: 10, padding: '14px 18px', border: '1px solid #e5e7eb' }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#6b7280', display: 'block', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Being Payment For</span>
                    <span style={{ fontSize: 14, color: '#374151', lineHeight: 1.5 }}>{v.description}</span>
                  </div>
                )}

                {/* Amount */}
                <div style={{ background: '#fefce8', borderRadius: 10, padding: '16px 18px', border: '1px solid #fde68a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, color: '#92400e', fontSize: 13 }}>TOTAL AMOUNT</span>
                  <span style={{ fontSize: 24, fontWeight: 900, color: '#a16207', fontVariantNumeric: 'tabular-nums' }}>ETB {parseFloat(v.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>

                {/* Payment Details */}
                {v.payment_method === 'Bank' && (v.bank_name || v.account_number) && (
                  <div style={{ background: '#eff6ff', borderRadius: 10, padding: '14px 18px', border: '1px solid #bfdbfe' }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#2563eb', display: 'block', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Bank Details</span>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 13 }}>
                      {v.bank_name && <div><span style={{ color: '#6b7280', fontSize: 11 }}>Bank</span><br/><b>{v.bank_name}</b></div>}
                      {v.account_number && <div><span style={{ color: '#6b7280', fontSize: 11 }}>Account No.</span><br/><b>{v.account_number}</b></div>}
                      {v.account_holder && <div><span style={{ color: '#6b7280', fontSize: 11 }}>Account Holder</span><br/><b>{v.account_holder}</b></div>}
                      {v.cheque_no && <div><span style={{ color: '#6b7280', fontSize: 11 }}>Cheque No.</span><br/><b>{v.cheque_no}</b></div>}
                    </div>
                  </div>
                )}

                {v.payment_method === 'Telebirr' && (v.telebirr_number) && (
                  <div style={{ background: '#fefce8', borderRadius: 10, padding: '14px 18px', border: '1px solid #fde68a' }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#b45309', display: 'block', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Telebirr Details</span>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 13 }}>
                      <div><span style={{ color: '#6b7280', fontSize: 11 }}>Mobile Number</span><br/><b>{v.telebirr_number}</b></div>
                      {v.telebirr_name && <div><span style={{ color: '#6b7280', fontSize: 11 }}>Name</span><br/><b>{v.telebirr_name}</b></div>}
                    </div>
                  </div>
                )}

                {/* Reject reason */}
                {v.reject_reason && (
                  <div style={{ background: '#fef2f2', borderRadius: 10, padding: '14px 18px', border: '1px solid #fca5a5' }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#dc2626', display: 'block', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Rejection Reason</span>
                    <span style={{ fontSize: 14, color: '#991b1b' }}>{v.reject_reason}</span>
                  </div>
                )}
              </div>

              {/* Footer Actions */}
              <div style={{ padding: '16px 28px', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button onClick={() => setSelectedVoucher(null)} style={{ padding: '10px 20px', background: '#F3F4F6', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Close</button>
                {v.status === 'approved_finance' && (
                  <button onClick={() => { setSelectedVoucher(null); setFinalizeTarget(v); }} style={{ padding: '10px 22px', background: '#16A34A', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <CheckCircle size={14} /> Finalize &amp; Record
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* ══ FINALIZE MODAL ══ */}
      {finalizeTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={e => e.target === e.currentTarget && !finalizing && setFinalizeTarget(null)}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 28, width: '100%', maxWidth: 640, boxShadow: '0 25px 60px rgba(0,0,0,0.25)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#111827', display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircle size={20} color="#16A34A" /> Finalize Expense Voucher
              </h3>
              <button onClick={() => !finalizing && setFinalizeTarget(null)} style={{ background: 'transparent', border: 'none', fontSize: 22, cursor: 'pointer', color: '#6B7280', lineHeight: 1 }}>×</button>
            </div>
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: 20, fontSize: 13 }}>
              <div style={{ fontWeight: 800, fontSize: 18, color: '#2563EB', fontFamily: 'monospace', marginBottom: 12 }}>{finalizeTarget.ev_number}</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div><span style={{ color: '#6B7280', fontSize: 11, display: 'block', fontWeight: 700 }}>DATE</span><b>{new Date(finalizeTarget.date).toLocaleDateString('en-GB')}</b></div>
                <div><span style={{ color: '#6B7280', fontSize: 11, display: 'block', fontWeight: 700 }}>PAYMENT METHOD</span><b>{finalizeTarget.payment_method}</b></div>
              </div>
              <div style={{ marginTop: 10 }}><span style={{ color: '#6B7280', fontSize: 11, display: 'block', fontWeight: 700 }}>PAID TO</span><b style={{ fontSize: 16 }}>{finalizeTarget.paid_to}</b></div>
              <div style={{ marginTop: 10 }}><span style={{ color: '#6B7280', fontSize: 11, display: 'block', fontWeight: 700 }}>BEING PAYMENT FOR</span>{finalizeTarget.description}</div>
              <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e2e8f0', paddingTop: 12 }}>
                <span style={{ fontWeight: 700 }}>AMOUNT</span>
                <span style={{ fontSize: 20, fontWeight: 900, color: '#A16207' }}>ETB {parseFloat(finalizeTarget.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              {finalizeTarget.payment_method === 'Bank' && (
                <div style={{ marginTop: 12, background: '#eff6ff', padding: 12, borderRadius: 8, fontSize: 12 }}>
                  <b>Bank:</b> {finalizeTarget.bank_name} &nbsp;·&nbsp; A/C: {finalizeTarget.account_number} {finalizeTarget.cheque_no ? `· Cheque: ${finalizeTarget.cheque_no}` : ''}
                </div>
              )}
              {finalizeTarget.payment_method === 'Telebirr' && (
                <div style={{ marginTop: 12, background: '#fefce8', padding: 12, borderRadius: 8, fontSize: 12 }}>
                  <b>Telebirr:</b> {finalizeTarget.telebirr_number} &nbsp;·&nbsp; {finalizeTarget.telebirr_name}
                </div>
              )}
            </div>
            <p style={{ fontSize: 13, color: '#92400E', background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: 8, padding: '10px 14px', margin: '16px 0' }}>
              ⚠️ Finalizing records this voucher as a payment in the Expense Book (cashbook).
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button onClick={() => setFinalizeTarget(null)} disabled={finalizing} style={{ padding: '10px 20px', background: '#F3F4F6', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleFinalize} disabled={finalizing} style={{ padding: '10px 22px', background: finalizing ? '#9CA3AF' : '#16A34A', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: finalizing ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                {finalizing ? <SegmentedSpinner size={16} /> : <CheckCircle size={14} />}
                {finalizing ? 'Finalizing…' : 'Finalize & Record'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinanceEV;
