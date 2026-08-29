import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DollarSign, Download, CheckCircle, XCircle, FileText,
  ArrowDownRight, ArrowUpRight, Banknote, Eye, ChevronDown,
  ChevronUp, RefreshCw, Users, Clock, TrendingUp, TrendingDown,
  AlertTriangle, CreditCard, Landmark, ShieldCheck,
  Truck, Package
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Cell, Legend
} from 'recharts';
import api from '../../services/apiClient';
import { formatCurrency } from '../../utils/formatters';
import SegmentedSpinner from '../../components/ui/SegmentedSpinner';
import styles from '../finance/FinanceHome.module.css';

/* ─── Enterprise CSS Design System (25-Rule Pass) ─── */
const FinanceGlobalStyles = () => (
  <style>{`
    :root {
      --cfin-primary: #2563EB;
      --cfin-primary-hover: #1D4ED8;
      --cfin-bg-page: #F5F6FA;
      --cfin-bg-card: #FFFFFF;
      --cfin-border: #E5E7EB;
      --cfin-text-primary: #111827;
      --cfin-text-secondary: #6B7280;
      --cfin-text-muted: #9CA3AF;
      --cfin-success: #16A34A;
      --cfin-success-bg: #DCFCE7;
      --cfin-danger: #DC2626;
      --cfin-danger-bg: #FEE2E2;
      --cfin-warning: #D97706;
      --cfin-warning-bg: #FEF3C7;
      --cfin-info: #0284C7;
      --cfin-info-bg: #E0F2FE;
      --cfin-font: 'Inter', 'Segoe UI', Roboto, -apple-system, sans-serif;
    }

    /* ── Page Wrapper ── */
    .cfin-page-wrapper {
      background: var(--cfin-bg-page);
      min-height: calc(100vh - 60px);
      font-family: var(--cfin-font);
      font-size: 16px;
      line-height: 1.5;
      color: var(--cfin-text-primary);
      padding: 10px;
      box-sizing: border-box;
    }
    .cfin-page-inner {
      max-width: 1536px;
      margin: 0 auto;
      padding: 24px;
    }

    /* ── Header ── */
    .cfin-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 28px;
      gap: 16px;
      flex-wrap: wrap;
    }
    .cfin-page-title {
      font-size: 28px;
      font-weight: 700;
      margin: 0 0 4px;
      color: var(--cfin-text-primary);
      line-height: 1.3;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .cfin-page-icon {
      background: var(--cfin-primary);
      padding: 10px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .cfin-page-subtitle {
      color: var(--cfin-text-secondary);
      margin: 0;
      font-size: 14px;
    }

    /* ── Section Title ── */
    .cfin-section-title {
      font-size: 18px;
      font-weight: 600;
      color: var(--cfin-text-primary);
      margin: 0 0 16px;
      line-height: 1.3;
    }
    .cfin-sub-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      gap: 16px;
      flex-wrap: wrap;
    }
    .cfin-sub-title {
      font-size: 20px;
      font-weight: 600;
      color: var(--cfin-text-primary);
      margin: 0 0 4px;
      line-height: 1.3;
    }
    .cfin-sub-subtitle {
      color: var(--cfin-text-secondary);
      font-size: 14px;
      margin: 0;
    }

    /* ── Tabs ── */
    .cfin-tabs {
      display: flex;
      gap: 8px;
      margin-bottom: 28px;
      flex-wrap: wrap;
      overflow-x: auto;
      scroll-snap-type: x mandatory;
      padding-bottom: 4px;
    }
    .cfin-tab {
      padding: 8px 20px;
      border-radius: 8px;
      font-weight: 500;
      font-size: 14px;
      cursor: pointer;
      transition: all 150ms ease-in-out;
      border: 1px solid var(--cfin-border);
      background: var(--cfin-bg-card);
      color: var(--cfin-text-secondary);
      white-space: nowrap;
      scroll-snap-align: start;
      height: 36px;
      display: inline-flex;
      align-items: center;
    }
    .cfin-tab:hover {
      background: #F9FAFB;
      color: var(--cfin-primary);
      border-color: var(--cfin-primary);
    }
    .cfin-tab.active {
      background: var(--cfin-primary);
      color: #FFFFFF;
      border-color: var(--cfin-primary);
      font-weight: 600;
    }

    /* ── Buttons ── */
    .cfin-btn {
      border-radius: 8px;
      height: 36px;
      padding: 0 16px;
      font-weight: 500;
      font-size: 14px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      border: 1px solid transparent;
      transition: all 150ms ease-in-out;
      font-family: var(--cfin-font);
    }
    .cfin-btn:disabled { opacity: 0.5; cursor: not-allowed; }

    .cfin-btn-primary {
      background: var(--cfin-primary);
      color: #FFFFFF;
      border-color: var(--cfin-primary);
    }
    .cfin-btn-primary:hover:not(:disabled) {
      background: #FFD700;
      color: #111827;
      border-color: #FFD700;
    }
    .cfin-btn-secondary {
      background: var(--cfin-bg-card);
      color: var(--cfin-text-secondary);
      border-color: var(--cfin-border);
    }
    .cfin-btn-secondary:hover:not(:disabled) {
      background: #FFD700;
      color: #111827;
      border-color: #FFD700;
    }
    .cfin-btn-danger {
      background: var(--cfin-danger-bg);
      color: var(--cfin-danger);
      border-color: #fca5a5;
    }
    .cfin-btn-danger:hover:not(:disabled) {
      background: #FFD700;
      color: #111827;
      border-color: #FFD700;
    }
    .cfin-btn-success {
      background: var(--cfin-success);
      color: #FFFFFF;
      border-color: var(--cfin-success);
    }
    .cfin-btn-success:hover:not(:disabled) {
      background: #FFD700;
      color: #111827;
      border-color: #FFD700;
    }
    .cfin-btn-ghost {
      background: transparent;
      color: var(--cfin-text-secondary);
      border-color: var(--cfin-border);
    }
    .cfin-btn-ghost:hover:not(:disabled) {
      background: #FFD700;
      color: #111827;
      border-color: #FFD700;
    }

    /* ── Cards ── */
    .cfin-card {
      background: var(--cfin-bg-card);
      border: 1px solid var(--cfin-border);
      border-radius: 10px;
      padding: 24px;
      box-shadow: 0 1px 3px rgba(0,0,0,.06);
      transition: all 150ms ease-in-out;
    }
    .cfin-card:hover {
      box-shadow: 0 4px 12px rgba(0,0,0,.08);
      transform: translateY(-1px);
    }

    /* ── PCV Card (approval items) ── */
    .cfin-pcv-card {
      background: var(--cfin-bg-card);
      border-radius: 10px;
      border: 1px solid var(--cfin-border);
      box-shadow: 0 1px 3px rgba(0,0,0,.06);
      overflow: hidden;
      transition: all 150ms ease-in-out;
    }
    .cfin-pcv-card:hover {
      box-shadow: 0 4px 12px rgba(0,0,0,.08);
    }
    .cfin-pcv-card.expanded {
      border-color: var(--cfin-warning);
      box-shadow: 0 4px 16px rgba(217,119,6,.15);
    }
    .cfin-pcv-row {
      display: flex;
      align-items: center;
      padding: 18px 24px;
      gap: 16px;
    }
    .cfin-pcv-icon {
      flex-shrink: 0;
      background: var(--cfin-warning-bg);
      padding: 10px;
      border-radius: 8px;
      border: 1px solid #fde68a;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .cfin-pcv-actions {
      display: flex;
      gap: 8px;
      flex-shrink: 0;
      flex-wrap: wrap;
    }

    /* ── Badges ── */
    .cfin-badge {
      display: inline-flex;
      align-items: center;
      padding: 2px 10px;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 500;
    }
    .cfin-badge-warning { background: var(--cfin-warning-bg); color: var(--cfin-warning); }
    .cfin-badge-success { background: var(--cfin-success-bg); color: var(--cfin-success); }
    .cfin-badge-danger  { background: var(--cfin-danger-bg);  color: var(--cfin-danger); }
    .cfin-badge-info    { background: var(--cfin-info-bg);    color: var(--cfin-info); }
    .cfin-badge-muted   { background: #F3F4F6; color: var(--cfin-text-secondary); }

    /* ── Tables ── */
    .cfin-table-wrap {
      overflow-x: auto;
      border-radius: 8px;
      border: 1px solid var(--cfin-border);
    }
    .cfin-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 14px;
      min-width: 600px;
    }
    .cfin-table th {
      background: #F9FAFB;
      padding: 12px 16px;
      text-transform: uppercase;
      font-size: 12px;
      font-weight: 500;
      color: var(--cfin-text-secondary);
      letter-spacing: 0.03em;
      border-bottom: 1px solid var(--cfin-border);
      text-align: left;
    }
    .cfin-table th.num { text-align: right; }
    .cfin-table td {
      padding: 14px 16px;
      border-bottom: 1px solid var(--cfin-border);
      color: var(--cfin-text-primary);
      transition: background 150ms ease-in-out;
      height: 48px;
    }
    .cfin-table tr:last-child td { border-bottom: none; }
    .cfin-table tr:hover td { background: #F9FAFB; }
    .cfin-table td.num { text-align: right; font-variant-numeric: tabular-nums; }

    /* ── Toast ── */
    .cfin-toast {
      position: fixed;
      top: 24px;
      right: 24px;
      z-index: 9999;
      padding: 14px 20px 14px 16px;
      border-radius: 10px;
      font-weight: 600;
      font-size: 14px;
      box-shadow: 0 10px 30px rgba(0,0,0,.12);
      border-left: 4px solid;
      min-width: 280px;
      animation: cfin-slide-in 200ms ease-out;
      font-family: var(--cfin-font);
    }
    .cfin-toast-success {
      background: #f0fdf4;
      color: #15803d;
      border-left-color: var(--cfin-success);
    }
    .cfin-toast-error {
      background: #fef2f2;
      color: #991b1b;
      border-left-color: var(--cfin-danger);
    }
    @keyframes cfin-slide-in {
      from { opacity: 0; transform: translateX(20px); }
      to   { opacity: 1; transform: translateX(0); }
    }

    /* ── Modal ── */
    .cfin-modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,.4);
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .cfin-modal {
      background: var(--cfin-bg-card);
      border-radius: 12px;
      padding: 32px;
      width: 480px;
      max-width: calc(100vw - 32px);
      box-shadow: 0 20px 60px rgba(0,0,0,.2);
    }
    .cfin-modal-title {
      font-size: 18px;
      font-weight: 600;
      color: var(--cfin-text-primary);
      margin: 0 0 8px;
    }
    .cfin-modal-body {
      color: var(--cfin-text-secondary);
      font-size: 14px;
      margin: 0 0 20px;
    }
    .cfin-modal-actions {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
      margin-top: 20px;
    }

    /* ── Empty State ── */
    .cfin-empty {
      text-align: center;
      padding: 64px 32px;
      background: var(--cfin-bg-card);
      border-radius: 10px;
      border: 1px solid var(--cfin-border);
    }
    .cfin-empty-title {
      font-size: 18px;
      font-weight: 600;
      color: var(--cfin-text-primary);
      margin: 12px 0 8px;
    }
    .cfin-empty-sub {
      color: var(--cfin-text-secondary);
      font-size: 14px;
      margin: 0;
    }

    /* ── PCV Detail Panel ── */
    .cfin-detail-panel {
      background: #F9FAFB;
      border-top: 1px solid var(--cfin-border);
      padding: 24px;
    }
    .cfin-detail-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin-bottom: 20px;
    }
    .cfin-detail-label {
      font-size: 11px;
      font-weight: 500;
      color: var(--cfin-text-muted);
      text-transform: uppercase;
      letter-spacing: 0.03em;
      margin-bottom: 4px;
    }
    .cfin-detail-value {
      font-size: 14px;
      font-weight: 600;
      color: var(--cfin-text-primary);
    }
    .cfin-paid-to-box {
      background: var(--cfin-warning-bg);
      border: 1px dashed #fde68a;
      border-radius: 8px;
      padding: 14px 18px;
      margin-bottom: 20px;
    }
    .cfin-sig-box {
      display: flex;
      gap: 16px;
    }

    /* ── Inputs ── */
    .cfin-textarea {
      width: 100%;
      padding: 12px 14px;
      border: 1px solid var(--cfin-border);
      border-radius: 8px;
      box-sizing: border-box;
      font-size: 14px;
      outline: none;
      resize: vertical;
      font-family: var(--cfin-font);
      transition: border 150ms, box-shadow 150ms;
      min-height: 100px;
    }
    .cfin-textarea:focus {
      border-color: var(--cfin-primary);
      box-shadow: 0 0 0 3px rgba(37,99,235,.1);
    }
    .cfin-textarea.danger { border-color: #fca5a5; }

    /* ── KPI override (view-only context) ── */
    .ceo-view-only * { cursor: default !important; }
    .ceo-view-only [class*="breakdownRow"]:hover,
    .ceo-view-only [class*="summaryRow"]:hover,
    .ceo-view-only [class*="ledgerRow"]:hover,
    .ceo-view-only [class*="qaTile"]:hover {
      transform: none !important;
      box-shadow: none !important;
      background: inherit !important;
      opacity: 1 !important;
    }
    
    .ceo-view-only [class*="kpiCard"]:hover {
      transform: none !important;
      box-shadow: none !important;
      border-color: var(--cfin-border) !important;
    }
    .ceo-view-only [class*="kpiCardHero"]:hover {
      background: var(--cfin-primary) !important;
      border-color: var(--cfin-primary) !important;
    }

    /* ── Responsiveness ── */
    @media (max-width: 1024px) {
      .cfin-page-inner { padding: 16px; }
      .cfin-page-wrapper { padding: 6px; }
      .cfin-detail-grid { grid-template-columns: repeat(2, 1fr); }
    }
    @media (max-width: 768px) {
      .cfin-page-wrapper { padding: 4px; }
      .cfin-page-inner { padding: 12px; }
      .cfin-page-title { font-size: 24px; }
      .cfin-header { flex-direction: column; align-items: flex-start; }
      .cfin-sub-header { flex-direction: column; align-items: flex-start; }
      .cfin-pcv-row { flex-direction: column; align-items: flex-start; }
      .cfin-pcv-actions { width: 100%; }
      .cfin-pcv-actions .cfin-btn { flex: 1; justify-content: center; }
      .cfin-detail-grid { grid-template-columns: 1fr 1fr; }
      .cfin-modal-actions { flex-direction: column; }
      .cfin-modal-actions .cfin-btn { width: 100%; justify-content: center; }
    }
    @media (max-width: 480px) {
      .cfin-detail-grid { grid-template-columns: 1fr; }
      .cfin-sig-box { flex-direction: column; }
      .cfin-tabs { flex-wrap: nowrap; }
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  `}</style>
);

/* ─── Color Palette ────────────────────────── */
const G = {
  forest: '#059669', dark: '#111827', emerald: '#059669', leaf: '#10B981',
  sage: '#A7F3D0', olive: '#6B7280', lime: '#84CC16', brown: '#92400E',
  sky: '#0891B2', white: '#FFFFFF', light: '#F9FAFB', darkGray: '#374151',
  orange: '#D97706', red: '#DC2626', purple: '#7C3AED', blue: '#2563EB'
};

const fmtShort = (n) => {
  const v = Number(n || 0);
  if (v >= 1000000) return 'ETB ' + (v / 1000000).toFixed(1) + 'M';
  if (v >= 1000) return 'ETB ' + (v / 1000).toFixed(1) + 'K';
  return 'ETB ' + v.toFixed(2);
};

const CategoryBar = ({ value, max, color }) => (
  <div className={styles.catBar}>
    <div className={styles.catBarFill} style={{ background: color, width: `${max > 0 ? Math.min(100, (value / max) * 100) : 0}%` }} />
  </div>
);

/* ─────────────────────────────── helpers ─────────────────────────────── */
const fmt = val =>
  new Intl.NumberFormat('en-ET', { style: 'currency', currency: 'ETB', maximumFractionDigits: 0 }).format(val || 0);

const fmtDate = d =>
  d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#0ea5e9', '#f97316'];

/* ─────────────────────────── shared sub-components ──────────────────── */
const SigPreview = ({ label, name, sig }) => (
  <div style={{ textAlign: 'center', flex: 1 }}>
    <div style={{ height: 70, border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden', background: '#fafafa', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 4 }}>
      {sig ? <img src={sig} alt={label} style={{ maxHeight: 64, maxWidth: '100%', objectFit: 'contain' }} /> : <span style={{ color: '#cbd5e1', fontSize: 11 }}>No signature</span>}
    </div>
    <div style={{ fontSize: 12, fontWeight: 700, color: '#334155' }}>{name || '—'}</div>
    <div style={{ fontSize: 10, color: '#94a3b8' }}>{label}</div>
  </div>
);

const EVDetailPanel = ({ ev }) => {
  const pm = ev.payment_method;
  return (
    <div style={{ background: '#f8fafc', borderTop: '1px solid #e2e8f0', padding: 28 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 20 }}>
        {[
          { label: 'Date',            value: new Date(ev.date).toLocaleDateString('en-GB') },
          { label: 'Amount',          value: `ETB ${parseFloat(ev.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}` },
          { label: 'Payment Method',  value: pm },
          { label: 'Reference #',     value: ev.reference_no || '—' },
        ].map(({ label, value }) => (
          <div key={label}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{value}</div>
          </div>
        ))}
      </div>
      <div style={{ background: '#fefce8', border: '1px dashed #fde047', borderRadius: 10, padding: '14px 18px', marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#a16207', marginBottom: 4 }}>PAID TO</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#713f12', marginBottom: 6 }}>{ev.paid_to}</div>
        <div style={{ fontSize: 13, color: '#78350f' }}>{ev.description}</div>
      </div>
      {pm === 'Bank' && (
        <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, padding: '14px 18px', marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#1d4ed8', marginBottom: 8 }}>Bank Details</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 13 }}>
            <div>Bank: <b>{ev.bank_name}</b></div>
            <div>A/C Name: <b>{ev.account_holder}</b></div>
            <div>A/C No: <b>{ev.account_number}</b></div>
            {ev.cheque_no && <div>Cheque #: <b>{ev.cheque_no}</b></div>}
          </div>
        </div>
      )}
      {pm === 'Telebirr' && (
        <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: '14px 18px', marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#b45309', marginBottom: 8 }}>Telebirr Details</div>
          <div style={{ fontSize: 13 }}>
            <div>Mobile: <b>{ev.telebirr_number}</b></div>
            <div>Name: <b>{ev.telebirr_name}</b></div>
          </div>
        </div>
      )}
      <div style={{ display: 'flex', gap: 16 }}>
        <SigPreview label="Prepared By"      name={ev.prepared_by}  sig={ev.prepared_signature} />
        <SigPreview label="Checked By"       name={ev.checked_by}   sig={ev.checked_signature} />
        <SigPreview label="Payee's Signature" name={ev.receiver_name} sig={ev.receiver_signature} />
      </div>
    </div>
  );
};

/* ═══════════════════════════════ KPI Card ═══════════════════════════ */
const KPICard = ({ label, value, sub, icon: Icon, gradient, iconColor }) => (
  <div style={{
    background: gradient,
    borderRadius: 16, padding: '22px 24px',
    position: 'relative', overflow: 'hidden',
    boxShadow: '0 4px 14px rgba(0,0,0,0.1)',
    color: 'white'
  }}>
    <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'rgba(255,255,255,0.8)', marginBottom: 10 }}>{label}</div>
    <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.5px', lineHeight: 1 }}>{value}</div>
    {sub && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 6 }}>{sub}</div>}
    <Icon size={90} style={{ position: 'absolute', right: -8, bottom: -8, opacity: 0.15 }} />
  </div>
);

/* ═══════════════════════════ MAIN COMPONENT ══════════════════════════ */
const CEOFinance = () => {
  const [activeTab,   setActiveTab]   = useState('Overview');
  const [finData,     setFinData]     = useState(null);
  const [finLoading,  setFinLoading]  = useState(true);

  // EV (pending approvals)
  const [pendingEvs,   setPendingEvs]   = useState([]);
  const [loadingPcvs,  setLoadingPcvs]  = useState(true);
  const [expandedPcv,  setExpandedPcv]  = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading,setActionLoading]= useState(null);
  const [toast,        setToast]        = useState(null);

  // Payroll
  const [payrollQueue,         setPayrollQueue]         = useState([]);
  const [payrollLoading,       setPayrollLoading]       = useState(false);
  const [payrollDetail,        setPayrollDetail]        = useState({});
  const [payrollExpanded,      setPayrollExpanded]      = useState(null);
  const [payrollDetailLoading, setPayrollDetailLoading] = useState(null);

  // Fund requests
  const [funds,       setFunds]       = useState([]);
  const [fundsLoading,setFundsLoading]= useState(false);

  /* ── Real Finance Data States ── */
  const [cashbook, setCashbook]   = useState([]);
  const [crvs,     setCrvs]       = useState([]);
  const [evs,      setEvs]        = useState([]);
  const [banks,    setBanks]      = useState([]);
  const [bankSummary, setBankSummary] = useState(null);
  const [recons,   setRecons]     = useState([]);
  const [receivables, setReceivables] = useState([]);
  const [assetSummary,  setAssetSummary]  = useState(null);
  const [equitySummary, setEquitySummary] = useState(null);
  const [profitSummary, setProfitSummary] = useState(null);
  const [liabSummary,   setLiabSummary]   = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [timeString, setTimeString] = useState('');

  useEffect(() => {
    const updateTime = () => setTimeString(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  const loadRealFinance = async () => {
    setRefreshing(true);
    setFinLoading(true);
    try {
      const [cbRes, crvRes, evRes, bankRes, bankSumRes, reconRes, rcvRes, assetRes, equityRes, profitRes, liabRes] = await Promise.allSettled([
        api.get('/finance-cash/cashbook'),
        api.get('/finance-cash/crv'),
        api.get('/finance-cash/ev'),
        api.get('/finance-bank'),
        api.get('/finance-bank/cashbook/summary'),
        api.get('/finance-bank/reconciliations'),
        api.get('/finance-receivables/book'),
        api.get('/asset-summary'),
        api.get('/finance-equity/dashboard'),
        api.get('/finance/vat-profit-report?period=all'),
        api.get('/liabilities-v2/dashboard'),
      ]);
      if (cbRes.status === 'fulfilled')      setCashbook(cbRes.value?.data || []);
      if (crvRes.status === 'fulfilled')     setCrvs(crvRes.value?.data || []);
      if (evRes.status === 'fulfilled')      setEvs(evRes.value?.data || []);
      if (bankRes.status === 'fulfilled')    setBanks(bankRes.value?.data || []);
      if (bankSumRes.status === 'fulfilled') setBankSummary(bankSumRes.value?.data || null);
      if (reconRes.status === 'fulfilled')   setRecons(reconRes.value?.data || []);
      if (rcvRes.status === 'fulfilled')     setReceivables(rcvRes.value?.data || []);
      if (assetRes.status === 'fulfilled') {
        const ad = assetRes.value?.data || assetRes.value;
        setAssetSummary(ad?.data || ad || null);
      }
      if (equityRes.status === 'fulfilled') {
        const ed = equityRes.value?.data || equityRes.value;
        setEquitySummary(ed?.data || ed || null);
      }
      if (profitRes.status === 'fulfilled') {
        const pd = profitRes.value?.data || profitRes.value;
        setProfitSummary(pd?.data || pd || null);
      }
      if (liabRes.status === 'fulfilled') {
        const ld = liabRes.value?.data || liabRes.value;
        setLiabSummary(ld?.data || ld || null);
      }
    } catch (err) { }
    setRefreshing(false);
    setFinLoading(false);
  };

  /* ── fetch overview ── */
  useEffect(() => {
    loadRealFinance();
    loadPendingEvs();
  }, []);

  /* ── fetch pending fund requests from finance income submissions ── */
  const fetchFunds = async () => {
    setFundsLoading(true);
    try {
      const res = await api.get('/finance/income-submissions?status=pending');
      const rows = Array.isArray(res?.data) ? res.data : (res?.data?.data || []);
      setFunds(rows);
    } catch { setFunds([]); }
    finally { setFundsLoading(false); }
  };

  /* ── payroll ── */
  const fetchPayrollQueue = async () => {
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
            month_number: p.month_number, year_number: p.year_number,
            total_net_pay: p.company_net_pay, total_employees: p.total_employees,
            approved_by_ceo: p.approved_by,
            payment_status: p.approval_status === 'Paid' ? 'Paid' : 'Pending Payment',
          }));
      }
      setPayrollQueue(rows);
      rows.forEach(row => {
        const key = `${row.month_number}-${row.year_number}`;
        api.get(`/hr/etp/payroll/summary/${row.month_number}/${row.year_number}`)
          .then(res => {
            const d = res?.data || res;
            setPayrollDetail(prev => ({ ...prev, [key]: d.employees || [] }));
          }).catch(() => {});
      });
    } catch (e) { console.error(e); }
    finally { setPayrollLoading(false); }
  };

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
    } catch { } finally { setPayrollDetailLoading(null); }
  };

  const payrollMonthName = m => new Date(2000, parseInt(m) - 1).toLocaleString('default', { month: 'long' });

  /* ── EV approvals ── */
  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };
  const loadPendingEvs = async () => {
    setLoadingPcvs(true);
    try {
      const res = await api.get('/finance-cash/ev/pending');
      const data = res?.data?.data || res?.data || [];
      setPendingEvs(Array.isArray(data) ? data.filter(p => p.status === 'pending_ceo') : []);
    } catch { } finally { setLoadingPcvs(false); }
  };
  const handleApproveEv = async (ev) => {
    setActionLoading(ev.id);
    try {
      await api.put(`/finance-cash/ev/${ev.id}/approve`);
      showToast(`✅ ${ev.ev_number} approved!`, 'success');
      loadPendingEvs();
    } catch { showToast('Failed to approve EV', 'error'); }
    finally { setActionLoading(null); }
  };
  const handleRejectEv = async () => {
    if (!rejectReason.trim()) return;
    setActionLoading(rejectTarget.id);
    try {
      await api.put(`/finance-cash/ev/${rejectTarget.id}/reject`, { reason: rejectReason });
      showToast('EV rejected.', 'error');
      loadPendingEvs(); setRejectTarget(null); setRejectReason('');
    } catch { showToast('Failed to reject EV', 'error'); }
    finally { setActionLoading(null); }
  };

  const nav = useNavigate();

  const tabs = [
    { id: 'Overview',          label: '📊 Overview' },
  ];

  const card = (sx = {}) => ({
    background: 'white', borderRadius: 16, padding: 24,
    border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', ...sx
  });

  const th = { padding: '11px 14px', textAlign: 'left', background: '#f8fafc', color: '#64748b', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', borderBottom: '2px solid #e2e8f0' };
  const td = { padding: '13px 14px', borderBottom: '1px solid #f1f5f9', color: '#334155', fontSize: 13 };

  /* ── Derived values ── */
  const cbEntries   = Array.isArray(cashbook) ? cashbook : [];
  const crvList     = Array.isArray(crvs)     ? crvs     : [];
  const evList      = Array.isArray(evs)      ? evs      : [];
  const pendingEvList = Array.isArray(pendingEvs) ? pendingEvs : [];
  const rcvList     = Array.isArray(receivables) ? receivables : [];
  const bankList    = Array.isArray(banks)    ? banks    : [];
  const reconList   = Array.isArray(recons)   ? recons   : [];

  const totalReceipts  = cbEntries.reduce((s, e) => s + parseFloat(e.receipts || 0), 0);
  const totalPayments  = cbEntries.reduce((s, e) => s + parseFloat(e.payments || 0), 0);
  const cashBalance    = totalReceipts - totalPayments;
  const crvTotal = crvList.reduce((s, c) => s + parseFloat(c.amount || 0), 0);
  const evTotal  = evList.reduce((s, p) => s + parseFloat(p.amount || 0), 0);
  const bankBalance = bankSummary ? parseFloat(bankSummary.total_balance || bankSummary.balance || 0) : bankList.reduce((s, b) => s + parseFloat(b.balance || b.current_balance || 0), 0);
  
  const totalReceivable    = rcvList.reduce((s, r) => s + parseFloat(r.total_amount || r.amount || 0), 0);
  const settledReceivable  = rcvList.reduce((s, r) => s + parseFloat(r.paid_amount  || r.settled || 0), 0);
  const outstandingBalance = totalReceivable - settledReceivable;
  const unreconCount = reconList.filter(r => r.status !== 'reconciled' && r.status !== 'completed').length;
  
  const recentCB = [...cbEntries].reverse().slice(0, 6);
  const txBreakdown = [
    { name: 'Cash Receipts (CRV)', count: crvList.length, amount: crvTotal, color: G.forest },
    { name: 'Expense Vouchers (EV)', count: evList.length, amount: evTotal, color: G.orange },
  ].filter(b => b.count > 0);
  const maxBreakdownAmt = Math.max(...txBreakdown.map(b => b.amount), 1);

  /* ── Mirrored Finance overview derived values (same as Finance Home) ── */
  const assetCats = assetSummary?.categories || [];
  const assetGrand = assetSummary?.grandTotal ?? assetCats.reduce((s, c) => s + parseFloat(c.value || 0), 0);
  const catVal = (key) => { const c = assetCats.find(x => x.key === key); return parseFloat(c?.value || 0); };
  const catCnt = (key) => { const c = assetCats.find(x => x.key === key); return parseInt(c?.count || 0, 10); };
  const assetMachinery      = catVal('vehicles') + catVal('tractors') + catVal('printingMachines');
  const assetMachineryCount = catCnt('vehicles') + catCnt('tractors') + catCnt('printingMachines');
  const assetProducts       = catVal('generalStore') + catVal('pharmacy');
  const assetProductsCount  = catCnt('generalStore') + catCnt('pharmacy');

  const equityNetIn = parseFloat(equitySummary?.totalContributions || 0) - parseFloat(equitySummary?.totalWithdrawals || 0);
  const netProfit = parseFloat(profitSummary?.summary?.netProfit ?? profitSummary?.netProfit ?? 0);

  const liabAP       = parseFloat(liabSummary?.accountsPayable ?? 0);
  const totalOwed    = parseFloat(liabSummary?.totalOwed ?? liabSummary?.totalLiabilities ?? 0);
  const overdueCount = parseInt(liabSummary?.overdueCount || 0, 10);

  const bankBookedRefs = new Set(evList.filter(e => (e.payment_method || '').toLowerCase().includes('bank')).map(e => e.ev_number));
  const bankBookedOut = cbEntries
    .filter(e => e.reference && bankBookedRefs.has(e.reference))
    .reduce((s, e) => s + parseFloat(e.payments || 0), 0);
  const expenseOut = Math.max(0, totalPayments - bankBookedOut);

  const crvBankedIn = bankList.reduce((s, b) => s + parseFloat(b.totalIn || 0), 0);
  const unbankedCRV = Math.max(0, crvTotal - crvBankedIn);

  const systemBalance =
    parseFloat(bankBalance || 0) +
    parseFloat(settledReceivable || 0) +
    parseFloat(equityNetIn || 0) +
    parseFloat(netProfit || 0) -
    parseFloat(expenseOut || 0) +
    parseFloat(unbankedCRV || 0);

  const ceoKpiCards = [
    { label: 'Balance + Finished Stock', value: fmtShort(systemBalance + assetProducts), meta: `Stock: ${fmtShort(assetProducts)}`, sub: 'System balance + products (stores + pharmacy)', icon: Banknote, color: '#059669', bg: 'var(--color-success-bg)' },
    { label: 'Balance + Total Assets', value: fmtShort(systemBalance + assetGrand), meta: `Assets: ${fmtShort(assetGrand)}`, sub: 'System balance + all asset categories', icon: CreditCard, color: '#D97706', bg: 'var(--color-warning-bg)' },
    { label: 'Liabilities & AP', value: fmtShort(totalOwed), meta: `${overdueCount} overdue · ${liabAP > 0 ? fmtShort(liabAP) : '0'} AP`, sub: 'Recorded liabilities (AP · loans · taxes)', icon: AlertTriangle, color: '#DC2626', bg: 'var(--color-danger-bg)' },
    { label: 'Cars & Machinery', value: fmtShort(assetMachinery), meta: `${assetMachineryCount} assets · 3 types`, sub: 'Vehicles · tractors · printing machines', icon: Truck, color: '#1D4ED8', bg: 'var(--color-info-bg)' },
    { label: 'Products (Stores + Pharmacy)', value: fmtShort(assetProducts), meta: `${assetProductsCount} items · 2 stores + pharmacy`, sub: 'Finished stock in stores & pharmacy', icon: Package, color: '#B45309', bg: 'rgba(180,83,9,0.12)' },
    { label: 'Total Assets', value: fmtShort(assetGrand), meta: `${assetCats.reduce((s, c) => s + (parseInt(c.count, 10) || 0), 0)} assets / ${assetCats.length} categories`, sub: 'Cars & machinery + products', icon: Landmark, color: '#0F766E', bg: 'hsl(174 60% 90%)' },
  ];

  return (
    <div className="cfin-page-wrapper">
      <FinanceGlobalStyles />

      <div className="cfin-page-inner">
      {/* Toast */}
      {toast && (
        <div className={`cfin-toast ${toast.type === 'error' ? 'cfin-toast-error' : 'cfin-toast-success'}`}>
          {toast.msg}
        </div>
      )}

      {/* ── Header ── */}
      <div className="cfin-header">
        <div>
          <h1 className="cfin-page-title">
            <span className="cfin-page-icon">
              <DollarSign color="white" size={24} />
            </span>
            Finance Command Center
          </h1>
          <p className="cfin-page-subtitle">Live P&L, cash flow, receivables, payables &amp; tax obligations</p>
        </div>
        <button onClick={() => window.print()} className="cfin-btn cfin-btn-secondary">
          <Download size={16} /> Export PDF
        </button>
      </div>

      {/* ── Tabs ── */}
      <div className="cfin-tabs">
        {tabs.map(t => (
          <button key={t.id}
            className={`cfin-tab${activeTab === t.id ? ' active' : ''}`}
            onClick={() => setActiveTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      
      {/* ══════════════════ OVERVIEW TAB ══════════════════ */}
      {activeTab === 'Overview' && (
        <div style={{ background: 'transparent' }}>
          {/* Header */}
          <div className="cfin-sub-header">
            <div>
              <h2 className="cfin-sub-title">Real-Time Finance Overview</h2>
              <p className="cfin-sub-subtitle">Synced directly from the central ledger · {timeString}</p>
            </div>
            <button onClick={loadRealFinance} disabled={refreshing} className="cfin-btn cfin-btn-secondary">
              {refreshing ? <SegmentedSpinner size={16} /> : <RefreshCw size={16} />}
              Refresh Data
            </button>
          </div>

          {/* View-only wrapper — disables all cursor:pointer / hover nav from finance CSS classes */}
          <div style={{ cursor: 'default' }} className="ceo-view-only">
          {/* ROW 1: KPIs */}
          <div className={styles.kpiGrid}>

            {/* System Balance — Hero card */}
            <div className={`${styles.kpiCard} ${styles.kpiCardHero}`}>
              <div className={styles.kpiTop}>
                <span className={styles.kpiLabel}>System Balance</span>
                <span className={styles.kpiIconHero}><Banknote color="white" size={18} /></span>
              </div>
              <div className={styles.kpiHeroValue}>{fmtShort(systemBalance)}</div>
              <div className={styles.heroBreakdown}>
                <span>Accounts: {fmtShort(bankBalance)}</span>
                <span>Receivable: {fmtShort(settledReceivable)}</span>
                <span>Equity: {fmtShort(equityNetIn)}</span>
                <span>Net Profit: {fmtShort(netProfit)}</span>
                <span>Paid Out: −{fmtShort(expenseOut)}</span>
                <span>Owed: {fmtShort(totalOwed)}</span>
              </div>
              <div className={styles.kpiHeroFoot}>
                {cbEntries.length} ledger entries · CRV revenue included
              </div>
            </div>

            {ceoKpiCards.map(k => (
              <div className={styles.kpiCard} key={k.label}>
                <div className={styles.kpiTop}>
                  <span className={styles.kpiLabel}>{k.label}</span>
                  <span className={styles.kpiIcon} style={{ background: k.bg, color: k.color }}>
                    <k.icon size={16} />
                  </span>
                </div>
                <div className={styles.kpiValue} style={{ color: k.color }}>{k.value}</div>
                <div className={styles.kpiMeta}>{k.meta}</div>
                <div className={styles.kpiSub}>{k.sub}</div>
              </div>
            ))}
          </div>

          {/* ROW 2: BREAKDOWN + LEDGER */}
          <div className={styles.grid2}>
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <span className={styles.cardTitleIcon}>📊</span>
                <h3 className={styles.cardTitle}>Transaction Breakdown</h3>
                <span className={styles.cardSub}>Cash Book summary</span>
              </div>
              <div className={styles.miniGrid}>
                {[
                  { label: 'CB Entries',    val: cbEntries.length,  icon: '📓', c: G.forest },
                  { label: 'Receivables',   val: rcvList.length,    icon: '📋', c: G.orange },
                  { label: 'Unrecon.',      val: unreconCount,      icon: '⚖️', c: unreconCount > 0 ? G.red : G.emerald },
                  { label: 'Expense Vouchers', val: evList.length,    icon: '🧾', c: G.orange },
                ].map(k => (
                  <div key={k.label} className={styles.miniTile}>
                    <div className={styles.miniTileTop}>
                      <span className={styles.miniTileIcon}>{k.icon}</span>
                      <span className={styles.miniTileLabel}>{k.label}</span>
                    </div>
                    <div className={styles.miniTileValue} style={{ color: k.c }}>{k.val}</div>
                  </div>
                ))}
              </div>
              <div className={styles.listHeader}>
                <span>Document Type</span>
                <span />
                <span style={{ textAlign: 'right' }}>Amount (ETB)</span>
              </div>
              {txBreakdown.length === 0 ? (
                <div className={styles.empty}>No transaction data yet</div>
              ) : txBreakdown.map((row) => (
                <div key={row.name} className={styles.breakdownRow}>
                  <div className={styles.catNameWrap}>
                    <span className={styles.dot} style={{ background: row.color }} />
                    <span className={styles.catName}>{row.name}</span>
                  </div>
                  <CategoryBar value={row.amount} max={maxBreakdownAmt} color={row.color} />
                  <span className={styles.catAmount} style={{ color: row.color }}>{fmtShort(row.amount)}</span>
                </div>
              ))}
            </div>

            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <span className={styles.cardTitleIcon}>📜</span>
                <h3 className={styles.cardTitle}>Recent Ledger Entries</h3>
              </div>
              {recentCB.length === 0 ? (
                <div className={styles.empty}>No entries yet</div>
              ) : (
                <div className={styles.ledgerList}>
                  {recentCB.map((entry, i) => {
                    const isReceipt = parseFloat(entry.receipts || 0) > 0;
                    const c   = isReceipt ? G.forest : G.orange;
                    const icon = isReceipt ? '📥' : '📤';
                    const amt  = isReceipt ? entry.receipts : entry.payments;
                    return (
                      <div key={entry.id || i} className={styles.ledgerRow}>
                        <span className={styles.ledgerIcon} style={{ background: isReceipt ? 'var(--color-success-bg)' : 'var(--color-warning-bg)' }}>{icon}</span>
                        <div className={styles.ledgerMain}>
                          <div className={styles.ledgerTitle}>
                            {entry.reference && <span className={styles.ledgerRef}>{entry.reference}</span>}
                            {entry.description || entry.type || 'Entry'}
                          </div>
                          <div className={styles.ledgerDate}>{entry.date ? new Date(entry.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : ''}</div>
                        </div>
                        <span className={styles.ledgerAmount} style={{ color: c }}>{fmtShort(amt)}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ROW 3: RECEIVABLES + RECONCILIATION */}
          <div className={styles.grid3} style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div className={styles.card}>
              <h3 className={styles.cardTitleNoIcon}>📋 Receivable Book</h3>
              <div className={styles.cardLabel}>Outstanding Balances</div>
              <div className={styles.summaryList}>
                {[
                  { label: 'Total Invoiced',   val: fmt(totalReceivable),    icon: '📄', bg: 'var(--color-info-bg)', c: G.blue },
                  { label: 'Amount Settled',   val: fmt(settledReceivable),  icon: '✅', bg: 'var(--color-success-bg)', c: G.forest },
                  { label: 'Outstanding',      val: fmt(outstandingBalance), icon: '⏳', bg: outstandingBalance > 0 ? 'var(--color-danger-bg)' : 'var(--color-success-bg)', c: outstandingBalance > 0 ? G.red : G.forest },
                ].map(row => (
                  <div key={row.label} className={styles.summaryRow}>
                    <span className={styles.summaryIcon} style={{ background: row.bg }}>{row.icon}</span>
                    <div className={styles.summaryMain}>
                      <div className={styles.summaryLabel}>{row.label}</div>
                      <div className={styles.summaryValue} style={{ color: row.c }}>{row.val}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className={styles.summaryCount}>{rcvList.length} receivable books</div>
            </div>

            <div className={styles.card}>
              <h3 className={styles.cardTitleNoIcon}>⚖️ Bank Reconciliation</h3>
              <div className={styles.cardLabel}>Accounts Status</div>
              <div className={styles.summaryList}>
                {[
                  { label: 'Bank Accounts',    val: `${bankList.length} accounts`,      icon: '🏦', bg: 'var(--color-info-bg)', c: G.blue },
                  { label: 'Bank Balance',     val: fmtShort(bankBalance),              icon: '💳', bg: 'var(--color-success-bg)', c: G.forest },
                  { label: 'Unreconciled',     val: `${unreconCount} pending`,          icon: unreconCount > 0 ? '⚠️' : '✅', bg: unreconCount > 0 ? 'var(--color-danger-bg)' : 'var(--color-success-bg)', c: unreconCount > 0 ? G.red : G.forest },
                ].map(row => (
                  <div key={row.label} className={styles.summaryRow}>
                    <span className={styles.summaryIcon} style={{ background: row.bg }}>{row.icon}</span>
                    <div className={styles.summaryMain}>
                      <div className={styles.summaryLabel}>{row.label}</div>
                      <div className={styles.summaryValue} style={{ color: row.c }}>{row.val}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className={styles.summaryCount}>{reconList.length} reconciliation records</div>
            </div>
          </div>
          </div>{/* end ceo-view-only */}
        </div>
      )}

      {/* ══════════════ EV APPROVALS TAB ══════════════ */}
      {activeTab === 'EV Approvals' && (
        <div>
          <div className="cfin-sub-header">
            <h2 className="cfin-sub-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}><FileText size={20} color="var(--cfin-warning)" /> Pending Expense Vouchers</h2>
            <button onClick={loadPendingEvs} className="cfin-btn cfin-btn-secondary"><RefreshCw size={14} /> Refresh</button>
          </div>
          {loadingPcvs ? (
            <div className="cfin-empty"><SegmentedSpinner size={32} /><div style={{ marginTop: 12, color: 'var(--cfin-text-muted)' }}>Loading pending EVs...</div></div>
          ) : pendingEvs.length === 0 ? (
            <div className="cfin-empty">
              <CheckCircle size={40} color="var(--cfin-success)" />
              <h3 className="cfin-empty-title">All Clear!</h3>
              <p className="cfin-empty-sub">No expense vouchers are awaiting your approval.</p>
            </div>

          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {pendingEvs.map(ev => (
                <div key={ev.id} className={`cfin-pcv-card${expandedPcv === ev.id ? ' expanded' : ''}`}>
                  <div className="cfin-pcv-row">
                    <div className="cfin-pcv-icon"><Banknote size={22} color="var(--cfin-warning)" /></div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                        <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 15, color: 'var(--cfin-text-primary)' }}>{ev.ev_number}</span>
                        <span className="cfin-badge cfin-badge-warning">Awaiting CEO</span>
                      </div>
                      <div style={{ display: 'flex', gap: 16, fontSize: 13, color: 'var(--cfin-text-secondary)', flexWrap: 'wrap' }}>
                        <span><b style={{ color: 'var(--cfin-text-primary)' }}>To:</b> {ev.paid_to}</span>
                        <span>·</span><span>{new Date(ev.date).toLocaleDateString('en-GB')}</span>
                        <span>·</span><span style={{ fontWeight: 700, color: 'var(--cfin-warning)' }}>ETB {parseFloat(ev.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                    <div className="cfin-pcv-actions">
                      <button onClick={() => setExpandedPcv(expandedPcv === ev.id ? null : ev.id)} className="cfin-btn cfin-btn-ghost">
                        <Eye size={14} /> {expandedPcv === ev.id ? 'Hide' : 'View'} {expandedPcv === ev.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                      <button onClick={() => setRejectTarget(ev)} className="cfin-btn cfin-btn-danger"><XCircle size={14} /> Reject</button>
                      <button onClick={() => handleApproveEv(ev)} disabled={actionLoading === ev.id} className="cfin-btn cfin-btn-success">
                        {actionLoading === ev.id ? <SegmentedSpinner size={14} /> : <CheckCircle size={14} />} Approve
                      </button>
                    </div>
                  </div>
                  {expandedPcv === ev.id && <EVDetailPanel ev={ev} />}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══════════════ FUND REQUESTS TAB ══════════════ */}
      {activeTab === 'Fund Requests' && (
        <div>
          <div className="cfin-sub-header">
            <h2 className="cfin-sub-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}><FileText size={20} color="var(--cfin-primary)" /> Pending Income Submissions</h2>
            <button onClick={fetchFunds} className="cfin-btn cfin-btn-secondary"><RefreshCw size={14} /> Refresh</button>
          </div>
          {fundsLoading ? (
            <div className="cfin-empty"><SegmentedSpinner size={32} /><div style={{ marginTop: 12, color: 'var(--cfin-text-muted)' }}>Loading...</div></div>
          ) : funds.length === 0 ? (
            <div className="cfin-empty">
              <CheckCircle size={40} color="var(--cfin-success)" />
              <h3 className="cfin-empty-title">No Pending Fund Requests</h3>
              <p className="cfin-empty-sub">All income submissions have been processed.</p>
            </div>
          ) : (
            <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr>
                  {['ID', 'Department', 'Submitted By', 'Submission Date', 'Amount', 'Status'].map(h => <th key={h} style={th}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {funds.map((f, i) => (
                    <tr key={i}>
                      <td style={{ ...td, fontWeight: 700 }}>{f.id}</td>
                      <td style={td}>{f.department_source || f.dept || '—'}</td>
                      <td style={td}>{f.submitted_by_name || '—'}</td>
                      <td style={td}>{fmtDate(f.submission_date)}</td>
                      <td style={{ ...td, fontWeight: 700 }}>{fmt(f.total_amount)}</td>
                      <td style={td}><span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: '#fef3c7', color: '#b45309' }}>{f.status || 'PENDING'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ══════════════ PAYROLL STATUS TAB ══════════════ */}
      {activeTab === 'Payroll Status' && (
        <div>
          <div className="cfin-sub-header">
            <h2 className="cfin-sub-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Users size={20} color="var(--cfin-success)" /> Payroll Payment Status</h2>
            <button onClick={fetchPayrollQueue} className="cfin-btn cfin-btn-secondary"><RefreshCw size={14} /> Refresh</button>
          </div>
          {payrollLoading ? (
            <div className="cfin-empty"><SegmentedSpinner size={32} /><div style={{ marginTop: 12, color: 'var(--cfin-text-muted)' }}>Loading payroll status...</div></div>
          ) : payrollQueue.length === 0 ? (
            <div className="cfin-empty">
              <CheckCircle size={40} color="var(--cfin-success)" />
              <h3 className="cfin-empty-title">No Payrolls Found</h3>
              <p className="cfin-empty-sub">Approved payrolls will appear here once HR submits them.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {payrollQueue.map(row => {
                const key       = `${row.month_number}-${row.year_number}`;
                const isExp     = payrollExpanded === key;
                const emps      = payrollDetail[key] || [];
                const isPending = row.payment_status === 'Pending Payment';
                const isFullyPaid = row.payment_status === 'Paid';
                const paidCount = isFullyPaid ? emps.length : emps.filter(e => e.payment_status === 'Paid').length;
                const allPaid   = isFullyPaid || (emps.length > 0 && paidCount === emps.length);
                return (
                  <div key={key} style={{ background: 'white', borderRadius: 16, border: `2px solid ${allPaid ? '#bbf7d0' : '#fde68a'}`, boxShadow: '0 2px 8px rgba(0,0,0,.05)', overflow: 'hidden' }}>
                    <div style={{ display: 'flex', alignItems: 'center', padding: '18px 24px', gap: 16, flexWrap: 'wrap' }}>
                      <div style={{ flexShrink: 0, background: allPaid ? '#f0fdf4' : '#fefce8', padding: 12, borderRadius: 12, border: `1px solid ${allPaid ? '#86efac' : '#fde047'}` }}><Users size={24} color={allPaid ? '#16a34a' : '#eab308'} /></div>
                      <div style={{ flex: 1, minWidth: 160 }}>
                        <div style={{ fontWeight: 800, fontSize: 17, color: '#0f172a' }}>{payrollMonthName(row.month_number)} {row.year_number} Payroll</div>
                        <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>{row.total_employees} employees — Net: <strong style={{ color: '#0f172a' }}>{formatCurrency ? formatCurrency(row.total_net_pay) : `ETB ${parseFloat(row.total_net_pay || 0).toLocaleString()}`}</strong></div>
                        {emps.length > 0 && (
                          <div style={{ marginTop: 8 }}>
                            <div style={{ height: 6, background: '#e2e8f0', borderRadius: 99, overflow: 'hidden', width: 200 }}>
                              <div style={{ height: '100%', width: `${(paidCount / emps.length) * 100}%`, background: allPaid ? '#16a34a' : '#3b82f6', borderRadius: 99, transition: 'width 0.4s' }} />
                            </div>
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: allPaid ? '#f0fdf4' : emps.length > 0 ? '#eff6ff' : '#f8fafc', padding: '10px 22px', borderRadius: 12, border: `2px solid ${allPaid ? '#86efac' : emps.length > 0 ? '#bfdbfe' : '#e2e8f0'}`, minWidth: 80 }}>
                        <div style={{ fontSize: 26, fontWeight: 800, color: allPaid ? '#16a34a' : emps.length > 0 ? '#2563eb' : '#94a3b8', lineHeight: 1 }}>{emps.length > 0 ? `${paidCount}/${emps.length}` : `?/${row.total_employees || '?'}`}</div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: allPaid ? '#15803d' : emps.length > 0 ? '#1d4ed8' : '#94a3b8', textTransform: 'uppercase', marginTop: 3 }}>Paid</div>
                      </div>
                      {allPaid ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 16px', borderRadius: 99, fontSize: 13, fontWeight: 700, background: '#dcfce7', color: '#16a34a', border: '1.5px solid #16a34a' }}><CheckCircle size={14} /> Paid</span>
                      ) : isPending ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 16px', borderRadius: 99, fontSize: 13, fontWeight: 700, background: '#FEF3C7', color: '#92400E', border: '1.5px solid #D97706' }}><Clock size={14} /> Awaiting Finance</span>
                      ) : (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 16px', borderRadius: 99, fontSize: 13, fontWeight: 700, background: '#dcfce7', color: '#15803d' }}><CheckCircle size={14} /> Completed</span>
                      )}
                      <button onClick={() => loadPayrollDetail(row)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 13, color: '#475569' }}>
                        <Eye size={14} /> {isExp ? 'Hide' : 'Detail'} {isExp ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                    </div>
                    {isExp && (
                      <div style={{ borderTop: '1px solid #e2e8f0', background: '#f8fafc', padding: '16px 24px' }}>
                        {payrollDetailLoading === key ? (
                          <div style={{ textAlign: 'center', padding: 24 }}><SegmentedSpinner size={28} /></div>
                        ) : emps.length === 0 ? (
                          <p style={{ color: '#94a3b8', textAlign: 'center', fontSize: 13 }}>No employee data available yet.</p>
                        ) : (
                          <div style={{ overflowX: 'auto' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                              <div style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}><span style={{ color: '#16a34a', fontWeight: 800 }}>{paidCount}</span> / {emps.length} employees paid</div>
                            </div>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                              <thead><tr style={{ background: '#f1f5f9' }}>
                                {['#', 'Employee', 'Department', 'Payment Method', 'Net Pay', 'Status'].map(h => <th key={h} style={{ padding: '10px 14px', textAlign: h === 'Net Pay' ? 'right' : 'left', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>{h}</th>)}
                              </tr></thead>
                              <tbody>
                                {emps.map((e, idx) => {
                                  const isPaid   = row.payment_status === 'Paid' || e.payment_status === 'Paid';
                                  const hasBank  = e.bank_account_number || e.bank_name;
                                  const isCash   = (e.payment_method || '').toLowerCase().includes('cash');
                                  return (
                                    <tr key={e.employee_id} style={{ borderBottom: '1px solid #f1f5f9', background: isPaid ? '#f0fdf4' : idx % 2 === 0 ? '#fff' : '#fafafa' }}>
                                      <td style={{ padding: '10px 14px', color: '#94a3b8', fontSize: 12 }}>{idx + 1}</td>
                                      <td style={{ padding: '10px 14px' }}><div style={{ fontWeight: 600, color: '#0f172a' }}>{e.full_name}</div><div style={{ fontSize: 11, color: '#94a3b8' }}>#{e.employee_id}</div></td>
                                      <td style={{ padding: '10px 14px', color: '#475569' }}>{e.department || e.position || '—'}</td>
                                      <td style={{ padding: '10px 14px' }}>
                                        <div style={{ fontSize: 11, fontWeight: 700, color: isCash ? '#92400e' : '#0369a1', textTransform: 'uppercase' }}>{isCash ? '💵 Cash' : '🏦 Bank'}</div>
                                        {hasBank && !isCash && <div style={{ fontSize: 11, color: '#64748b', fontFamily: 'monospace' }}>{e.bank_name} - {e.bank_account_number}</div>}
                                      </td>
                                      <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>ETB {parseFloat(e.net_pay || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                      <td style={{ padding: '10px 14px' }}>
                                        {isPaid
                                          ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700, background: '#dcfce7', color: '#15803d' }}><CheckCircle size={11} /> Paid</span>
                                          : <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700, background: '#fef3c7', color: '#92400e' }}><Clock size={11} /> Pending</span>
                                        }
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
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Reject EV Modal */}
      {rejectTarget && (
        <div className="cfin-modal-overlay">
          <div className="cfin-modal">
            <h3 className="cfin-modal-title">Reject EV</h3>
            <p className="cfin-modal-body">You are rejecting <b style={{ color: 'var(--cfin-danger)' }}>{rejectTarget.ev_number}</b>. Please provide a reason.</p>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="Reason for rejection (required)..."
              rows={4}
              className="cfin-textarea danger"
            />
            <div className="cfin-modal-actions">
              <button onClick={() => { setRejectTarget(null); setRejectReason(''); }} className="cfin-btn cfin-btn-ghost">Cancel</button>
              <button onClick={handleRejectEv} disabled={!rejectReason.trim() || actionLoading === rejectTarget.id} className="cfin-btn cfin-btn-danger">
                {actionLoading === rejectTarget.id ? <SegmentedSpinner size={16} /> : <XCircle size={16} />} Reject EV
              </button>
            </div>
          </div>
        </div>
      )}
      </div>{/* end cfin-page-inner */}
    </div>
  );
};

export default CEOFinance;
