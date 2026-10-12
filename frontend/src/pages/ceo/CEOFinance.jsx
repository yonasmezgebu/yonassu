import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DollarSign, Download, CheckCircle, XCircle, FileText,
  Banknote, Eye, ChevronDown, ChevronUp, RefreshCw, Users,
  Clock, AlertTriangle, CreditCard, Landmark,
  Truck, Package, ArrowUpRight
} from 'lucide-react';
import api from '../../services/apiClient';
import { formatCurrency } from '../../utils/formatters';
import SegmentedSpinner from '../../components/ui/SegmentedSpinner';

/* ─── Formatters ─────────────────────────────────────────────────────── */
const fmt = (n) =>
  'ETB ' + Number(n || 0).toLocaleString('en-ET', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtShort = (n) => {
  const v = Number(n || 0);
  if (v >= 1_000_000) return 'ETB ' + (v / 1_000_000).toFixed(1) + 'M';
  if (v >= 1_000)     return 'ETB ' + (v / 1_000).toFixed(1) + 'K';
  return 'ETB ' + v.toFixed(2);
};

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

/* ─── CSS Design System (scoped to .ceof-*) ──────────────────────────── */
const Styles = () => (
  <style>{`
    /* ── Design Tokens ── */
    .ceof-page {
      --ceof-bg:        #F5F6FA;
      --ceof-card:      #FFFFFF;
      --ceof-border:    #E5E7EB;
      --ceof-muted:     #F9FAFB;
      --ceof-muted-fg:  #6B7280;
      --ceof-primary:   #2563EB;
      --ceof-success:   #16A34A;
      --ceof-danger:    #DC2626;
      --ceof-warning:   #D97706;
      --ceof-info:      #0284C7;
      --ceof-radius:    0.625rem;
      --ceof-shadow:    0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.05);
      --ceof-font:      'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif;
      font-family: var(--ceof-font);
      background: var(--ceof-bg);
      color: #111827;
      min-height: calc(100vh - 60px);
      padding: 1.5rem;
      box-sizing: border-box;
    }

    /* ── Container ── */
    .ceof-inner {
      max-width: 1280px;
      margin: 0 auto;
    }

    /* ── Header ── */
    .ceof-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 1rem;
      margin-bottom: 1.75rem;
      flex-wrap: wrap;
    }
    .ceof-title {
      font-size: 1.75rem;
      font-weight: 800;
      margin: 0 0 0.25rem;
      color: #111827;
      letter-spacing: -0.02em;
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .ceof-title-icon {
      background: var(--ceof-primary);
      border-radius: 0.5rem;
      padding: 0.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .ceof-subtitle {
      font-size: 0.875rem;
      color: var(--ceof-muted-fg);
      margin: 0;
    }

    /* ── Tabs ── */
    .ceof-tabs {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
      margin-bottom: 1.75rem;
    }
    .ceof-tab {
      padding: 0.5rem 1.25rem;
      border-radius: 0.5rem;
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      border: 1px solid var(--ceof-border);
      background: var(--ceof-card);
      color: var(--ceof-muted-fg);
      transition: all 0.15s ease;
      font-family: var(--ceof-font);
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
    }
    .ceof-tab:hover { background: #F3F4F6; color: var(--ceof-primary); border-color: var(--ceof-primary); }
    .ceof-tab.active {
      background: var(--ceof-primary);
      color: #FFFFFF;
      border-color: var(--ceof-primary);
    }

    /* ── Section Sub-header ── */
    .ceof-sub-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      flex-wrap: wrap;
      margin-bottom: 1.5rem;
    }
    .ceof-sub-title {
      font-size: 1.25rem;
      font-weight: 700;
      color: #111827;
      margin: 0 0 0.25rem;
    }
    .ceof-sub-meta {
      font-size: 0.8125rem;
      color: var(--ceof-muted-fg);
      margin: 0;
    }

    /* ── Buttons ── */
    .ceof-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.4rem;
      padding: 0.5rem 1rem;
      border-radius: 0.5rem;
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      border: 1px solid transparent;
      transition: all 0.15s ease;
      font-family: var(--ceof-font);
    }
    .ceof-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .ceof-btn-secondary {
      background: var(--ceof-card);
      color: var(--ceof-muted-fg);
      border-color: var(--ceof-border);
    }
    .ceof-btn-secondary:hover:not(:disabled) {
      background: #F3F4F6;
      color: #111827;
      border-color: #9CA3AF;
    }
    .ceof-btn-primary {
      background: var(--ceof-primary);
      color: #FFFFFF;
    }
    .ceof-btn-primary:hover:not(:disabled) { background: #1D4ED8; }
    .ceof-btn-danger { background: #FEE2E2; color: var(--ceof-danger); border-color: #FECACA; }
    .ceof-btn-danger:hover:not(:disabled) { background: var(--ceof-danger); color: #FFFFFF; }
    .ceof-btn-success { background: var(--ceof-success); color: #FFFFFF; }
    .ceof-btn-success:hover:not(:disabled) { background: #15803D; }
    .ceof-btn-ghost { background: transparent; color: var(--ceof-muted-fg); border-color: var(--ceof-border); }
    .ceof-btn-ghost:hover:not(:disabled) { background: #F3F4F6; color: #111827; }

    /* ── Overview Grid ── */
    .ceof-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 1.25rem;
    }

    /* ── Table Card ── */
    .ceof-table-card {
      background: var(--ceof-card);
      border: 1px solid var(--ceof-border);
      border-radius: var(--ceof-radius);
      box-shadow: var(--ceof-shadow);
      overflow: hidden;
    }
    .ceof-card-heading {
      padding: 1.25rem 1.5rem 0;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0;
    }
    .ceof-card-heading-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 2rem;
      height: 2rem;
      border-radius: 0.375rem;
      flex-shrink: 0;
    }
    .ceof-card-title {
      font-size: 1rem;
      font-weight: 700;
      color: #111827;
      margin: 0;
    }

    /* ── Data Table ── */
    .ceof-table-wrap { overflow-x: auto; }
    .ceof-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.9375rem;
    }
    .ceof-table th {
      background: var(--ceof-muted);
      color: var(--ceof-muted-fg);
      font-weight: 700;
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      padding: 0.75rem 1.5rem;
      border-bottom: 1px solid var(--ceof-border);
      text-align: left;
      white-space: nowrap;
    }
    .ceof-table th.ceof-right { text-align: right; }
    .ceof-table td {
      padding: 0.875rem 1.5rem;
      border-bottom: 1px solid var(--ceof-border);
      color: #374151;
      font-size: 0.9375rem;
      line-height: 1.5;
    }
    .ceof-table tr:last-child td { border-bottom: none; }
    .ceof-table tbody tr.ceof-nav-row {
      cursor: pointer;
      transition: background 0.15s ease;
    }
    .ceof-table tbody tr.ceof-nav-row:hover td {
      background: #EFF6FF;
    }
    .ceof-table td.ceof-right {
      text-align: right;
      font-variant-numeric: tabular-nums;
      font-weight: 500;
    }
    .ceof-table td.ceof-mono {
      font-family: 'Menlo', 'Monaco', 'Consolas', monospace;
    }
    .ceof-table tr.ceof-total-row td {
      background: var(--ceof-muted);
      font-weight: 700;
      border-top: 2px solid var(--ceof-border);
    }
    .ceof-table tr.ceof-system-row td {
      background: #1E40AF;
      color: #FFFFFF;
      font-weight: 800;
    }
    .ceof-table tr.ceof-system-row:hover td {
      background: #1E40AF !important;
    }

    /* ── Cumulative value coloring ── */
    .ceof-cumulative {
      font-weight: 700;
      color: #059669;
    }
    .ceof-cumulative.negative { color: #DC2626; }

    /* ── Highlight chip ── */
    .ceof-highlight-chip {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      font-weight: 700;
      color: var(--ceof-primary);
    }

    /* ── Quick KPI Strip ── */
    .ceof-kpi-strip {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1px;
      border: 1px solid var(--ceof-border);
      border-radius: var(--ceof-radius);
      overflow: hidden;
      background: var(--ceof-border);
      box-shadow: var(--ceof-shadow);
      margin-bottom: 1.25rem;
    }
    .ceof-kpi-cell {
      background: var(--ceof-card);
      padding: 1rem 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    .ceof-kpi-label {
      font-size: 0.6875rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--ceof-muted-fg);
    }
    .ceof-kpi-value {
      font-size: 1.125rem;
      font-weight: 800;
      color: #111827;
      font-variant-numeric: tabular-nums;
    }

    /* ── EV / Approval cards ── */
    .ceof-pcv-card {
      background: var(--ceof-card);
      border: 1px solid var(--ceof-border);
      border-radius: var(--ceof-radius);
      box-shadow: var(--ceof-shadow);
      overflow: hidden;
    }
    .ceof-pcv-row {
      display: flex;
      align-items: center;
      padding: 1.125rem 1.5rem;
      gap: 1rem;
      flex-wrap: wrap;
    }
    .ceof-pcv-icon {
      width: 3rem;
      height: 3rem;
      border-radius: 0.5rem;
      background: #FEF3C7;
      border: 1px solid #FDE68A;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .ceof-pcv-actions {
      display: flex;
      gap: 0.5rem;
      flex-shrink: 0;
      flex-wrap: wrap;
      margin-left: auto;
    }

    /* ── Badge ── */
    .ceof-badge {
      display: inline-flex;
      align-items: center;
      padding: 0.125rem 0.625rem;
      border-radius: 9999px;
      font-size: 0.6875rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }
    .ceof-badge-warning { background: #FEF3C7; color: #92400E; }
    .ceof-badge-success { background: #DCFCE7; color: #15803D; }
    .ceof-badge-danger  { background: #FEE2E2; color: #991B1B; }
    .ceof-badge-info    { background: #E0F2FE; color: #075985; }

    /* ── Toast ── */
    .ceof-toast {
      position: fixed;
      top: 1.5rem;
      right: 1.5rem;
      z-index: 9999;
      padding: 0.875rem 1.25rem;
      border-radius: 0.625rem;
      font-weight: 700;
      font-size: 0.875rem;
      box-shadow: 0 10px 30px rgba(0,0,0,.12);
      border-left: 4px solid;
      min-width: 280px;
      animation: ceof-slide 200ms ease-out;
      font-family: var(--ceof-font);
    }
    .ceof-toast-success { background:#F0FDF4; color:#15803D; border-left-color:#16A34A; }
    .ceof-toast-error   { background:#FEF2F2; color:#991B1B; border-left-color:#DC2626; }
    @keyframes ceof-slide {
      from { opacity: 0; transform: translateX(20px); }
      to   { opacity: 1; transform: none; }
    }

    /* ── Modal ── */
    .ceof-modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,.45);
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
      backdrop-filter: blur(2px);
    }
    .ceof-modal {
      background: var(--ceof-card);
      border-radius: 0.75rem;
      padding: 2rem;
      width: 30rem;
      max-width: calc(100vw - 2rem);
      box-shadow: 0 20px 60px rgba(0,0,0,.2);
    }
    .ceof-modal-title { font-size: 1.125rem; font-weight: 700; margin: 0 0 0.5rem; }
    .ceof-modal-body  { font-size: 0.875rem; color: var(--ceof-muted-fg); margin: 0 0 1rem; }
    .ceof-modal-actions { display: flex; gap: 0.75rem; justify-content: flex-end; margin-top: 1.25rem; }
    .ceof-textarea {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid var(--ceof-border);
      border-radius: 0.5rem;
      box-sizing: border-box;
      font-size: 0.875rem;
      font-family: var(--ceof-font);
      resize: vertical;
      outline: none;
      min-height: 6rem;
      transition: border 0.15s;
    }
    .ceof-textarea:focus { border-color: var(--ceof-primary); box-shadow: 0 0 0 3px rgba(37,99,235,.1); }

    /* ── Empty State ── */
    .ceof-empty {
      text-align: center;
      padding: 4rem 2rem;
      background: var(--ceof-card);
      border-radius: var(--ceof-radius);
      border: 1px solid var(--ceof-border);
    }
    .ceof-empty-title { font-size: 1.125rem; font-weight: 700; margin: 0.75rem 0 0.5rem; }
    .ceof-empty-sub   { font-size: 0.875rem; color: var(--ceof-muted-fg); margin: 0; }

    /* ── Detail Panel ── */
    .ceof-detail-panel {
      background: var(--ceof-muted);
      border-top: 1px solid var(--ceof-border);
      padding: 1.5rem;
    }
    .ceof-detail-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
      margin-bottom: 1.25rem;
    }
    .ceof-detail-label {
      font-size: 0.6875rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--ceof-muted-fg);
      margin-bottom: 0.25rem;
    }
    .ceof-detail-value { font-size: 0.875rem; font-weight: 600; color: #111827; }

    /* ── Responsive ── */
    @media (max-width: 1024px) {
      .ceof-kpi-strip { grid-template-columns: repeat(3, 1fr); }
    }
    @media (max-width: 768px) {
      .ceof-page { padding: 1rem; }
      .ceof-detail-grid { grid-template-columns: 1fr 1fr; }
      .ceof-pcv-row { flex-direction: column; align-items: flex-start; }
      .ceof-pcv-actions { width: 100%; margin-left: 0; }
      .ceof-kpi-strip { grid-template-columns: repeat(2, 1fr); }
    }
    @media (max-width: 480px) {
      .ceof-detail-grid { grid-template-columns: 1fr; }
      .ceof-kpi-strip { grid-template-columns: 1fr; }
    }

    /* ── Print Styles (Paper format) ── */
    @media print {
      /* Hide App Layout Containers */
      .dash-sidebar, .dash-topbar, .dash-mobile-overlay, .ceof-btn {
        display: none !important;
      }
      .dashboard-wrapper { display: block !important; }
      .dash-main, .dash-content {
        padding: 0 !important;
        margin: 0 !important;
        width: 100% !important;
        overflow: visible !important;
      }
      
      /* Reset Page Container */
      .ceof-page {
        padding: 0 !important;
        background: transparent !important;
      }
      .ceof-inner { max-width: 100% !important; }

      /* Format KPI Strip */
      .ceof-kpi-strip {
        grid-template-columns: repeat(4, 1fr) !important;
        border: 2px solid #000 !important;
        background: #000 !important;
        gap: 1px !important;
        box-shadow: none !important;
        page-break-inside: avoid;
        margin-bottom: 2rem !important;
      }
      .ceof-kpi-cell {
        background: #fff !important;
        color: #000 !important;
        padding: 8px 12px !important;
      }
      .ceof-kpi-label { color: #000 !important; font-size: 11px !important; }
      .ceof-kpi-value { color: #000 !important; font-size: 16px !important; }

      /* Format Tables */
      .ceof-table-card {
        border: 2px solid #000 !important;
        box-shadow: none !important;
        border-radius: 0 !important;
        margin-bottom: 2rem !important;
        page-break-inside: avoid;
      }
      .ceof-table {
        border-collapse: collapse !important;
        width: 100% !important;
      }
      .ceof-table th, .ceof-table td {
        border: 1px solid #000 !important;
        padding: 6px 8px !important;
        color: #000 !important;
        font-size: 12px !important;
      }
      .ceof-table th {
        background: #e5e7eb !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
        color: #000 !important;
      }

      /* Headers */
      .ceof-title { color: #000 !important; font-size: 24px !important; margin-bottom: 4px !important; }
      .ceof-title-icon { display: none !important; }
      .ceof-subtitle { color: #333 !important; margin-bottom: 24px !important; }
      .ceof-sub-title { 
        color: #000 !important; 
        border-bottom: 2px solid #000 !important; 
        padding-bottom: 4px !important; 
        margin-bottom: 12px !important; 
      }
      .ceof-sub-title svg { display: none !important; }
      .ceof-sub-meta { display: none !important; }
      .ceof-header { margin-bottom: 24px !important; }
    }
  `}</style>
);

/* ─── Shared sub-components ─────────────────────────────────────────── */
const SigPreview = ({ label, name, sig }) => (
  <div style={{ textAlign: 'center', flex: 1 }}>
    <div style={{ height: 70, border: '1px solid #E5E7EB', borderRadius: 8, overflow: 'hidden', background: '#FAFAFA', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 4 }}>
      {sig ? <img src={sig} alt={label} style={{ maxHeight: 64, maxWidth: '100%', objectFit: 'contain' }} /> : <span style={{ color: '#CBD5E1', fontSize: 11 }}>No signature</span>}
    </div>
    <div style={{ fontSize: 12, fontWeight: 700, color: '#334155' }}>{name || '—'}</div>
    <div style={{ fontSize: 10, color: '#94A3B8' }}>{label}</div>
  </div>
);

const EVDetailPanel = ({ ev }) => {
  const pm = ev.payment_method;
  return (
    <div className="ceof-detail-panel">
      <div className="ceof-detail-grid">
        {[
          { label: 'Date',           value: new Date(ev.date).toLocaleDateString('en-GB') },
          { label: 'Amount',         value: `ETB ${parseFloat(ev.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}` },
          { label: 'Payment Method', value: pm },
          { label: 'Reference #',    value: ev.reference_no || '—' },
        ].map(({ label, value }) => (
          <div key={label}>
            <div className="ceof-detail-label">{label}</div>
            <div className="ceof-detail-value">{value}</div>
          </div>
        ))}
      </div>
      <div style={{ background: '#FEFCE8', border: '1px dashed #FDE047', borderRadius: 8, padding: '0.875rem 1.125rem', marginBottom: '1rem' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#A16207', marginBottom: 4 }}>PAID TO</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#713F12', marginBottom: 6 }}>{ev.paid_to}</div>
        <div style={{ fontSize: 13, color: '#78350F' }}>{ev.description}</div>
      </div>
      {pm === 'Bank' && (
        <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 8, padding: '0.875rem 1.125rem', marginBottom: '1rem' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#1D4ED8', marginBottom: 8 }}>Bank Details</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 13 }}>
            <div>Bank: <b>{ev.bank_name}</b></div>
            <div>A/C Name: <b>{ev.account_holder}</b></div>
            <div>A/C No: <b>{ev.account_number}</b></div>
            {ev.cheque_no && <div>Cheque #: <b>{ev.cheque_no}</b></div>}
          </div>
        </div>
      )}
      {pm === 'Telebirr' && (
        <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 8, padding: '0.875rem 1.125rem', marginBottom: '1rem' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#B45309', marginBottom: 8 }}>Telebirr Details</div>
          <div style={{ fontSize: 13 }}>
            <div>Mobile: <b>{ev.telebirr_number}</b></div>
            <div>Name: <b>{ev.telebirr_name}</b></div>
          </div>
        </div>
      )}
      <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
        <SigPreview label="Prepared By"       name={ev.prepared_by}   sig={ev.prepared_signature} />
        <SigPreview label="Checked By"        name={ev.checked_by}    sig={ev.checked_signature} />
        <SigPreview label="Payee's Signature" name={ev.receiver_name} sig={ev.receiver_signature} />
      </div>
    </div>
  );
};

/* ═══════════════════════════ MAIN COMPONENT ══════════════════════════ */
const CEOFinance = () => {
  const nav = useNavigate();
  const [activeTab, setActiveTab] = useState('Overview');
  const [refreshing, setRefreshing] = useState(false);
  const [timeString, setTimeString] = useState('');

  /* ── Finance Data State ── */
  const [cashbook, setCashbook]         = useState([]);
  const [crvs,     setCrvs]             = useState([]);
  const [evs,      setEvs]              = useState([]);
  const [banks,    setBanks]            = useState([]);
  const [bankSummary, setBankSummary]   = useState(null);
  const [recons,   setRecons]           = useState([]);
  const [receivables, setReceivables]   = useState([]);
  const [assetSummary,  setAssetSummary]  = useState(null);
  const [equitySummary, setEquitySummary] = useState(null);
  const [profitSummary, setProfitSummary] = useState(null);
  const [liabSummary,   setLiabSummary]   = useState(null);

  /* ── EV Approvals State ── */
  const [pendingEvs,    setPendingEvs]    = useState([]);
  const [loadingPcvs,   setLoadingPcvs]   = useState(true);
  const [expandedPcv,   setExpandedPcv]   = useState(null);
  const [rejectTarget,  setRejectTarget]  = useState(null);
  const [rejectReason,  setRejectReason]  = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  const [toast,         setToast]         = useState(null);

  /* ── Payroll State ── */
  const [payrollQueue,         setPayrollQueue]         = useState([]);
  const [payrollLoading,       setPayrollLoading]       = useState(false);
  const [payrollDetail,        setPayrollDetail]        = useState({});
  const [payrollExpanded,      setPayrollExpanded]      = useState(null);
  const [payrollDetailLoading, setPayrollDetailLoading] = useState(null);

  /* ── Fund Requests State ── */
  const [funds,       setFunds]       = useState([]);
  const [fundsLoading,setFundsLoading]= useState(false);

  /* ── Clock ── */
  useEffect(() => {
    const upd = () => setTimeString(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
    upd();
    const id = setInterval(upd, 60_000);
    return () => clearInterval(id);
  }, []);

  /* ── Load finance data (exact same API calls as FinanceHome) ── */
  const loadRealFinance = async () => {
    setRefreshing(true);
    try {
      const [cbRes, crvRes, evRes, bankRes, bankSumRes, reconRes, rcvRes, assetRes, equityRes, profitRes, liabRes] =
        await Promise.allSettled([
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
      if (cbRes.status      === 'fulfilled') setCashbook(cbRes.value?.data || []);
      if (crvRes.status     === 'fulfilled') setCrvs(crvRes.value?.data || []);
      if (evRes.status      === 'fulfilled') setEvs(evRes.value?.data || []);
      if (bankRes.status    === 'fulfilled') setBanks(bankRes.value?.data || []);
      if (bankSumRes.status === 'fulfilled') setBankSummary(bankSumRes.value?.data || null);
      if (reconRes.status   === 'fulfilled') setRecons(reconRes.value?.data || []);
      if (rcvRes.status     === 'fulfilled') setReceivables(rcvRes.value?.data || []);
      if (assetRes.status   === 'fulfilled') {
        const ad = assetRes.value?.data || assetRes.value;
        setAssetSummary(ad?.data || ad || null);
      }
      if (equityRes.status  === 'fulfilled') {
        const ed = equityRes.value?.data || equityRes.value;
        setEquitySummary(ed?.data || ed || null);
      }
      if (profitRes.status  === 'fulfilled') {
        const pd = profitRes.value?.data || profitRes.value;
        setProfitSummary(pd?.data || pd || null);
      }
      if (liabRes.status    === 'fulfilled') {
        const ld = liabRes.value?.data || liabRes.value;
        setLiabSummary(ld?.data || ld || null);
      }
    } catch (_) { /* silent */ }
    setRefreshing(false);
  };

  /* ── EV helpers ── */
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

  /* ── Payroll helpers ── */
  const fetchPayrollQueue = async () => {
    setPayrollLoading(true);
    try {
      let rows = [];
      try {
        const res = await api.get('/hr/etp/payroll/finance-queue');
        rows = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
      } catch {
        const res2 = await api.get('/hr/etp/payroll/approved-list');
        const all  = Array.isArray(res2?.data) ? res2.data : (Array.isArray(res2) ? res2 : []);
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
    } catch { } finally { setPayrollLoading(false); }
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
  const payrollMonthName = (m) => new Date(2000, parseInt(m) - 1).toLocaleString('default', { month: 'long' });

  /* ── Fund Requests ── */
  const fetchFunds = async () => {
    setFundsLoading(true);
    try {
      const res = await api.get('/finance/income-submissions?status=pending');
      setFunds(Array.isArray(res?.data) ? res.data : (res?.data?.data || []));
    } catch { setFunds([]); } finally { setFundsLoading(false); }
  };

  /* ── On mount ── */
  useEffect(() => {
    loadRealFinance();
    loadPendingEvs();
  }, []); // eslint-disable-line

  /* ══════════════ DERIVED VALUES (mirrors FinanceHome exactly) ═══════════ */
  const cbEntries  = Array.isArray(cashbook)    ? cashbook    : [];
  const crvList    = Array.isArray(crvs)        ? crvs        : [];
  const evList     = Array.isArray(evs)         ? evs         : [];
  const rcvList    = Array.isArray(receivables) ? receivables : [];
  const bankList   = Array.isArray(banks)       ? banks       : [];
  const reconList  = Array.isArray(recons)      ? recons      : [];

  const totalReceipts  = cbEntries.reduce((s, e) => s + parseFloat(e.receipts  || 0), 0);
  const totalPayments  = cbEntries.reduce((s, e) => s + parseFloat(e.payments  || 0), 0);
  const crvTotal       = crvList.reduce((s, c)   => s + parseFloat(c.amount    || 0), 0);

  const bankOpeningTotal = bankList.reduce((s, b) => s + parseFloat(b.opening_balance || 0), 0);
  const bankInTotal      = bankList.reduce((s, b) => s + parseFloat(b.totalIn  || 0), 0);
  const bankOutTotal     = bankList.reduce((s, b) => s + parseFloat(b.totalOut || 0), 0);
  const accountBalance   = bankList.reduce((s, b) => s + parseFloat(b.netBalance ?? b.balance ?? b.current_balance ?? 0), 0);
  const bankBalance      = bankList.length > 0
    ? accountBalance
    : parseFloat(bankSummary?.netBalance || bankSummary?.total_balance || bankSummary?.balance || 0);

  const totalReceivable    = rcvList.reduce((s, r) => s + parseFloat(r.total_amount || r.amount || 0), 0);
  const settledReceivable  = rcvList.reduce((s, r) => s + parseFloat(r.paid_amount  || r.settled || 0), 0);
  const outstandingBalance = totalReceivable - settledReceivable;

  const unreconCount = reconList.filter(r => r.status !== 'reconciled' && r.status !== 'completed').length;

  const assetCats   = assetSummary?.categories || [];
  const assetGrand  = assetSummary?.grandTotal ?? assetCats.reduce((s, c) => s + parseFloat(c.value || 0), 0);
  const catVal = (key) => { const c = assetCats.find(x => x.key === key); return parseFloat(c?.value || 0); };
  const assetMachinery = catVal('vehicles') + catVal('tractors') + catVal('printingMachines');
  const assetProducts  = catVal('generalStore') + catVal('pharmacy');

  const equityContrib  = parseFloat(equitySummary?.totalContributions || 0);
  const equityWithdraw = parseFloat(equitySummary?.totalWithdrawals   || 0);
  const equityNetIn    = equityContrib - equityWithdraw;

  const netProfit  = parseFloat(profitSummary?.summary?.netProfit ?? profitSummary?.netProfit ?? 0);
  const grossProfit = rcvList.length > 0
    ? rcvList.reduce((s, r) => s + parseFloat(r.gross_profit || 0), 0)
    : parseFloat(profitSummary?.summary?.grossProfit ?? profitSummary?.grossProfit ?? 0);

  const carRentalDeposit = parseFloat(
    profitSummary?.summary?.carRentalRefundableDeposit ??
    rcvList
      .filter(r => (r.source === 'car_rental' || r.department_source === 'Car Rental') && !r.security_deposit_refunded)
      .reduce((s, r) => s + parseFloat(r.security_deposit || 0), 0)
  );

  const outputVat = rcvList.length > 0
    ? rcvList.reduce((s, r) => s + parseFloat(r.output_vat || 0), 0)
    : parseFloat(profitSummary?.summary?.outputVat || 0);

  const totalOwed  = parseFloat(liabSummary?.totalOwed ?? liabSummary?.totalLiabilities ?? 0);

  const bankBookedRefs = new Set(
    evList.filter(e => (e.payment_method || '').toLowerCase().includes('bank')).map(e => e.ev_number)
  );
  const bankBookedOut = cbEntries
    .filter(e => e.reference && bankBookedRefs.has(e.reference))
    .reduce((s, e) => s + parseFloat(e.payments || 0), 0);
  const expenseOut  = Math.max(0, totalPayments - bankBookedOut);

  const crvBankedIn = bankList.reduce((s, b) => s + parseFloat(b.totalIn || 0), 0);
  const unbankedCRV = Math.max(0, crvTotal - crvBankedIn);

  /* ── System balance formula (identical to FinanceHome) ── */
  const systemBalance =
    parseFloat(bankBalance    || 0) +
    parseFloat(settledReceivable || 0) +
    parseFloat(equityNetIn    || 0) +
    parseFloat(grossProfit    || 0) +
    parseFloat(outputVat      || 0) +
    parseFloat(carRentalDeposit || 0) -
    parseFloat(expenseOut     || 0) +
    parseFloat(unbankedCRV    || 0) +
    parseFloat(assetGrand     || 0) -
    parseFloat(totalOwed      || 0);

  /* ── Table helper styles ── */
  const thStyle = { padding: '0.75rem 1.5rem', textAlign: 'left', background: '#F9FAFB', color: '#6B7280', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', borderBottom: '1px solid #E5E7EB', whiteSpace: 'nowrap' };
  const tdStyle = { padding: '0.875rem 1.5rem', borderBottom: '1px solid #F3F4F6', color: '#374151', fontSize: 13 };

  return (
    <div className="ceof-page">
      <Styles />

      <div className="ceof-inner">

        {/* ── Page Header ── */}
        <div className="ceof-header">
          <div>
            <h1 className="ceof-title">
              <span className="ceof-title-icon">
                <DollarSign color="white" size={22} />
              </span>
              Finance Command Center
            </h1>
            <p className="ceof-subtitle">Live financial summary — synced directly from the central ledger</p>
          </div>
          <button onClick={() => window.print()} className="ceof-btn ceof-btn-secondary">
            <Download size={15} /> Export PDF
          </button>
        </div>

        {/* ══════════════════════════ OVERVIEW DATA ══════════════════════════ */}
        <div>
            {/* Sub-header */}
            <div className="ceof-sub-header">
              <div>
                <h2 className="ceof-sub-title">Finance Overview</h2>
                <p className="ceof-sub-meta">System generated tabular summary · {timeString}</p>
              </div>
              <button onClick={loadRealFinance} disabled={refreshing} className="ceof-btn ceof-btn-secondary">
                {refreshing ? <SegmentedSpinner size={15} /> : <RefreshCw size={15} />}
                {refreshing ? 'Syncing…' : 'Sync Data'}
              </button>
            </div>

            {/* Quick KPI strip */}
            <div className="ceof-kpi-strip">
              {[
                { label: 'Bank Balance',       value: fmt(bankBalance),       color: '#2563EB' },
                { label: 'Total Receivable',   value: fmt(totalReceivable),   color: '#0284C7' },
                { label: 'Settled',            value: fmt(settledReceivable), color: '#16A34A' },
                { label: 'Net Profit',         value: fmt(netProfit),         color: netProfit >= 0 ? '#16A34A' : '#DC2626' },
                { label: 'Total Assets',       value: fmt(assetGrand),        color: '#D97706' },
                { label: 'Total Liabilities',  value: fmt(totalOwed),         color: '#DC2626' },
                { label: 'System Balance',     value: fmt(systemBalance),     color: systemBalance >= 0 ? '#059669' : '#DC2626' },
              ].map(k => (
                <div key={k.label} className="ceof-kpi-cell">
                  <span className="ceof-kpi-label">{k.label}</span>
                  <span className="ceof-kpi-value" style={{ color: k.color }}>{k.value}</span>
                </div>
              ))}
            </div>

            <div className="ceof-grid">

              {/* TABLE 1 – System Balance (running total) */}
              <div className="ceof-table-card">
                <div className="ceof-card-heading" style={{ marginBottom: '1rem' }}>
                  <span className="ceof-card-heading-icon" style={{ background: '#EFF6FF', color: '#2563EB' }}>
                    <DollarSign size={16} />
                  </span>
                  <h3 className="ceof-card-title">System Balance</h3>
                  <span style={{ marginLeft: 'auto', fontSize: 12, color: '#6B7280' }}>Running total</span>
                </div>
                <div className="ceof-table-wrap">
                  <table className="ceof-table">
                    <thead>
                      <tr>
                        <th>Component</th>
                        <th className="ceof-right">Amount</th>
                        <th className="ceof-right">Cumulative Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const rows = [
                          { label: 'Bank Accounts (Cash in Bank)',              val: bankBalance,       nav: null },
                          { label: 'Unbanked Cash (CRV on Hand)',               val: unbankedCRV,       nav: null },
                          { label: 'Net Owner Flow (Equity)',                   val: equityNetIn,       nav: null },
                          { label: 'Collected / Paid So Far (Accts Receivable)',val: settledReceivable, nav: null },
                          { label: 'Gross Profit (Revenue − COGS)',             val: grossProfit,       nav: null },
                          { label: 'Output VAT (Tax Collected)',                val: outputVat,         nav: null },
                          { label: 'Car Rental Refundable Deposit (Held)',      val: carRentalDeposit,  nav: null },
                          { label: 'Paid Out (Expenses)',                       val: -expenseOut,       nav: null },
                          { label: 'Total Assets (Non-Cash)',                   val: assetGrand,        nav: null },
                          { label: 'Total Liabilities (Owed)',                  val: -totalOwed,        nav: null },
                        ];
                        let running = 0;
                        return (
                          <>
                            {rows.map((r, i) => {
                              running += parseFloat(r.val || 0);
                              const isNeg = (r.val || 0) < 0;
                              return (
                                <tr key={i} className="ceof-nav-row">
                                  <td style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    {r.val >= 0
                                      ? <ArrowUpRight size={14} style={{ color: '#16A34A', flexShrink: 0 }} />
                                      : <ArrowUpRight size={14} style={{ color: '#DC2626', flexShrink: 0, transform: 'rotate(90deg)' }} />
                                    }
                                    {r.label}
                                  </td>
                                  <td className="ceof-right" style={{ color: isNeg ? '#DC2626' : '#374151', fontWeight: 500 }}>{fmt(r.val)}</td>
                                  <td className="ceof-right">
                                    <span className={`ceof-cumulative${running < 0 ? ' negative' : ''}`}>{fmt(running)}</span>
                                  </td>
                                </tr>
                              );
                            })}
                            <tr className="ceof-system-row">
                              <td colSpan={2} style={{ color: '#FFFFFF', fontWeight: 800, padding: '0.875rem 1.5rem', fontSize: '0.9375rem' }}>
                                Total System Balance (Calculated Sum)
                              </td>
                              <td className="ceof-right" style={{ color: '#FFFFFF', fontWeight: 900, fontSize: '1.125rem', padding: '0.875rem 1.5rem' }}>
                                {fmt(running)}
                              </td>
                            </tr>
                          </>
                        );
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* TABLE 2 – Accounts Receivable */}
              <div className="ceof-table-card">
                <div className="ceof-card-heading" style={{ marginBottom: '1rem' }}>
                  <span className="ceof-card-heading-icon" style={{ background: '#E0F2FE', color: '#0284C7' }}>
                    <FileText size={16} />
                  </span>
                  <h3 className="ceof-card-title">Accounts Receivable</h3>
                </div>
                <div className="ceof-table-wrap">
                  <table className="ceof-table">
                    <thead>
                      <tr>
                        <th>Metric</th>
                        <th className="ceof-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="ceof-nav-row">
                        <td>Total Invoiced (All Records)</td>
                        <td className="ceof-right">{fmt(totalReceivable)}</td>
                      </tr>
                      <tr className="ceof-nav-row">
                        <td>Collected / Paid So Far</td>
                        <td className="ceof-right" style={{ color: '#16A34A', fontWeight: 600 }}>{fmt(settledReceivable)}</td>
                      </tr>
                      <tr className="ceof-total-row ceof-nav-row">
                        <td>Still Outstanding (Not Yet Received)</td>
                        <td className="ceof-right" style={{ color: outstandingBalance > 0 ? '#DC2626' : '#16A34A' }}>
                          {fmt(outstandingBalance)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* TABLE 3 – Equity & Capital */}
              <div className="ceof-table-card">
                <div className="ceof-card-heading" style={{ marginBottom: '1rem' }}>
                  <span className="ceof-card-heading-icon" style={{ background: '#F3E8FF', color: '#7C3AED' }}>
                    <CreditCard size={16} />
                  </span>
                  <h3 className="ceof-card-title">Equity &amp; Capital</h3>
                </div>
                <div className="ceof-table-wrap">
                  <table className="ceof-table">
                    <thead>
                      <tr>
                        <th>Metric</th>
                        <th className="ceof-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="ceof-nav-row">
                        <td>Deposits In</td>
                        <td className="ceof-right" style={{ color: '#16A34A', fontWeight: 600 }}>{fmt(equityContrib)}</td>
                      </tr>
                      <tr className="ceof-nav-row">
                        <td>Withdrawals Out</td>
                        <td className="ceof-right" style={{ color: '#DC2626', fontWeight: 600 }}>−{fmt(equityWithdraw)}</td>
                      </tr>
                      <tr className="ceof-total-row ceof-nav-row">
                        <td>Net Owner Flow</td>
                        <td className="ceof-right" style={{ color: equityNetIn >= 0 ? '#16A34A' : '#DC2626' }}>
                          {fmt(equityNetIn)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* TABLE 4 – Bank Reconciliation */}
              <div className="ceof-table-card">
                <div className="ceof-card-heading" style={{ marginBottom: '1rem' }}>
                  <span className="ceof-card-heading-icon" style={{ background: '#DCFCE7', color: '#16A34A' }}>
                    <Landmark size={16} />
                  </span>
                  <h3 className="ceof-card-title">Bank Reconciliation</h3>
                </div>
                <div className="ceof-table-wrap">
                  <table className="ceof-table">
                    <thead>
                      <tr>
                        <th>Metric</th>
                        <th className="ceof-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="ceof-nav-row">
                        <td>Opening Balances ({bankList.length} accounts)</td>
                        <td className="ceof-right">{fmt(bankOpeningTotal)}</td>
                      </tr>
                      <tr className="ceof-nav-row">
                        <td>Cash In (Deposits)</td>
                        <td className="ceof-right" style={{ color: '#16A34A', fontWeight: 600 }}>{fmt(bankInTotal)}</td>
                      </tr>
                      <tr className="ceof-nav-row">
                        <td>Cash Out (Withdrawals)</td>
                        <td className="ceof-right" style={{ color: '#DC2626', fontWeight: 600 }}>−{fmt(bankOutTotal)}</td>
                      </tr>
                      <tr className="ceof-nav-row">
                        <td>Unreconciled Entries</td>
                        <td className="ceof-right">
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                            padding: '2px 10px', borderRadius: 9999,
                            fontSize: 12, fontWeight: 700,
                            background: unreconCount > 0 ? '#FEE2E2' : '#DCFCE7',
                            color:      unreconCount > 0 ? '#DC2626' : '#16A34A'
                          }}>
                            {unreconCount} pending
                          </span>
                        </td>
                      </tr>
                      <tr className="ceof-total-row ceof-nav-row">
                        <td>Current Bank Balance</td>
                        <td className="ceof-right" style={{ color: bankBalance >= 0 ? '#16A34A' : '#DC2626' }}>
                          {fmt(bankBalance)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* TABLE 5 – Assets & Liabilities */}
              <div className="ceof-table-card">
                <div className="ceof-card-heading" style={{ marginBottom: '1rem' }}>
                  <span className="ceof-card-heading-icon" style={{ background: '#FEF3C7', color: '#D97706' }}>
                    <Package size={16} />
                  </span>
                  <h3 className="ceof-card-title">Assets &amp; Liabilities</h3>
                </div>
                <div className="ceof-table-wrap">
                  <table className="ceof-table">
                    <thead>
                      <tr>
                        <th>Metric</th>
                        <th className="ceof-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="ceof-nav-row">
                        <td>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Truck size={14} style={{ color: '#2563EB', flexShrink: 0 }} />
                            Cars &amp; Machinery
                          </span>
                        </td>
                        <td className="ceof-right">{fmt(assetMachinery)}</td>
                      </tr>
                      <tr className="ceof-nav-row">
                        <td>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Package size={14} style={{ color: '#D97706', flexShrink: 0 }} />
                            Products &amp; Stock
                          </span>
                        </td>
                        <td className="ceof-right">{fmt(assetProducts)}</td>
                      </tr>
                      <tr className="ceof-nav-row">
                        <td style={{ fontWeight: 700, color: '#2563EB' }}>Total Assets</td>
                        <td className="ceof-right" style={{ fontWeight: 700, color: '#2563EB' }}>{fmt(assetGrand)}</td>
                      </tr>
                      <tr className="ceof-nav-row">
                        <td>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <AlertTriangle size={14} style={{ color: '#DC2626', flexShrink: 0 }} />
                            Total Liabilities (Owed)
                          </span>
                        </td>
                        <td className="ceof-right" style={{ color: '#DC2626', fontWeight: 600 }}>−{fmt(totalOwed)}</td>
                      </tr>
                      <tr className="ceof-total-row ceof-nav-row">
                        <td>Net Position (Assets − Liabilities)</td>
                        <td className="ceof-right" style={{ color: (assetGrand - totalOwed) >= 0 ? '#16A34A' : '#DC2626' }}>
                          {fmt(assetGrand - totalOwed)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

            </div>{/* end ceof-grid */}
          </div>
        {/* End of overview data */}

      </div>{/* end ceof-inner */}
    </div>
  );
};

export default CEOFinance;
