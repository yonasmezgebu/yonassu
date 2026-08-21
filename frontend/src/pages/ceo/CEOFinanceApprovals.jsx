import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle, XCircle, Banknote, Building, Smartphone, Eye,
  RefreshCw, FileText, CreditCard, Users, DollarSign, Clock,
  ChevronDown, ChevronUp, AlertTriangle, Download, ArrowLeft
} from 'lucide-react';
import api from '../../services/apiClient';
import SegmentedSpinner from '../../components/ui/SegmentedSpinner';
import { formatCurrency } from '../../utils/formatters';

/* ─── Global Styles ──────────────────────────────────────────────────────── */
const GlobalStyles = () => (
  <style>{`
    .ceo-fin-wrapper {
      padding: 24px;
      min-height: calc(100vh - 60px);
      box-sizing: border-box;
      background: #F5F6FA;
      font-family: 'Inter', 'Segoe UI', Roboto, -apple-system, sans-serif;
      color: #111827;
    }
    .ceo-fin-container { max-width: 1200px; margin: 0 auto; }

    /* Header */
    .ceo-fin-header {
      display: flex; justify-content: space-between; align-items: flex-start;
      margin-bottom: 24px; flex-wrap: wrap; gap: 16px;
    }
    .ceo-fin-title {
      font-size: 26px; font-weight: 800; margin: 0 0 6px; color: #111827;
      display: flex; align-items: center; gap: 12px; letter-spacing: -0.02em;
    }
    .ceo-fin-title-icon {
      background: linear-gradient(135deg, #eab308, #a16207);
      padding: 10px; border-radius: 12px; display: flex;
      box-shadow: 0 4px 10px rgba(234,179,8,.3);
    }
    .ceo-fin-subtitle { font-size: 14px; color: #6B7280; margin: 0; }

    /* Back button */
    .ceo-fin-back-bar {
      display: flex; align-items: center; gap: 10px;
      margin-bottom: 16px; background: #FFFFFF;
      padding: 10px 16px; border-radius: 8px;
      border: 1px solid #E5E7EB;
    }
    .ceo-fin-back-btn {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 6px 14px; border-radius: 6px; cursor: pointer;
      font-size: 13px; font-weight: 500;
      border: 1px solid #E5E7EB; background: #F9FAFB; color: #4B5563;
      font-family: inherit; transition: all 150ms ease-in-out;
    }
    .ceo-fin-back-btn:hover {
      background: #F59E0B; color: #FFFFFF; border-color: #F59E0B;
      transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,.08);
    }
    .ceo-fin-back-divider { width: 1px; height: 24px; background: #E5E7EB; }
    .ceo-fin-back-label {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 6px 14px; border-radius: 6px;
      font-size: 13px; font-weight: 600;
      border: 1px solid #2563EB; background: #EFF6FF; color: #1E40AF;
    }

    /* Tabs */
    .ceo-fin-tabs-row { display: flex; gap: 12px; margin-bottom: 24px; flex-wrap: wrap; }
    .ceo-fin-tab-btn {
      display: inline-flex; align-items: center; gap: 8px;
      padding: 10px 18px; border-radius: 8px; font-family: inherit;
      font-size: 14px; font-weight: 600; cursor: pointer;
      border: 1px solid #E5E7EB; background: #FFFFFF; color: #6B7280;
      transition: all 150ms ease;
    }
    .ceo-fin-tab-btn:hover { background: #F9FAFB; border-color: #9CA3AF; transform: translateY(-1px); }
    .ceo-fin-tab-btn.active {
      background: #2563EB; border-color: #2563EB; color: #FFFFFF;
      box-shadow: 0 4px 12px rgba(37,99,235,0.2);
    }

    /* Buttons */
    .ceo-fin-btn {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 8px 14px; border-radius: 8px; font-family: inherit;
      font-size: 13px; font-weight: 600; cursor: pointer;
      border: 1px solid transparent; transition: all 150ms ease;
    }
    .ceo-fin-btn-ghost { background: #F8FAFC; border-color: #E5E7EB; color: #6B7280; }
    .ceo-fin-btn-ghost:hover { background: #FFD700; border-color: #FFD700; color: #111827; transform: translateY(-1px); }
    .ceo-fin-btn-danger { background: #FEE2E2; border-color: #FECACA; color: #DC2626; }
    .ceo-fin-btn-danger:hover { background: #FFD700; border-color: #FFD700; color: #111827; transform: translateY(-1px); }
    .ceo-fin-btn-success { background: linear-gradient(135deg, #22C55E, #16A34A); color: #FFFFFF; box-shadow: 0 2px 8px rgba(34,197,94,0.3); }
    .ceo-fin-btn-success:hover { background: #FFD700; color: #111827; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(255,215,0,0.4); }
    .ceo-fin-btn-success:disabled { opacity: 0.7; cursor: not-allowed; transform: none; }

    /* Row Cards */
    .ceo-fin-list { display: flex; flex-direction: column; gap: 12px; }
    .ceo-fin-card {
      background: #FFFFFF; border-radius: 12px; border: 2px solid #E5E7EB;
      box-shadow: 0 2px 6px rgba(0,0,0,0.04); overflow: hidden;
      transition: all 200ms ease;
    }
    .ceo-fin-card:hover { border-color: #9CA3AF; }
    .ceo-fin-card.expanded { border-color: #EAB308; box-shadow: 0 8px 20px rgba(234,179,8,0.12); }
    .ceo-fin-card-header { display: flex; align-items: center; padding: 18px 24px; gap: 16px; }
    .ceo-fin-icon-box { flex-shrink: 0; padding: 10px; border-radius: 10px; }
    .icon-box-pcv { background: #FEFCE8; border: 1px solid #FDE047; color: #EAB308; }
    .icon-box-pv  { background: #EFF6FF; border: 1px solid #BFDBFE; color: #3B82F6; }
    .icon-box-crv { background: #F0FDF4; border: 1px solid #BBF7D0; color: #22C55E; }
    .icon-box-sal { background: #F5F3FF; border: 1px solid #DDD6FE; color: #7C3AED; }
    .ceo-fin-card-content { flex: 1; min-width: 0; }
    .ceo-fin-card-title { font-family: monospace; font-weight: 800; font-size: 16px; color: #111827; }
    .ceo-fin-card-meta { display: flex; gap: 16px; font-size: 13px; color: #6B7280; margin-top: 4px; flex-wrap: wrap; }
    .ceo-fin-actions { display: flex; gap: 10px; flex-shrink: 0; }

    /* Detail Panel */
    .ceo-fin-detail-panel { background: #F8FAFC; border-top: 1px solid #E5E7EB; padding: 24px; }
    .ceo-fin-detail-grid {
      display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 20px;
    }
    .ceo-fin-detail-label { font-size: 10px; font-weight: 700; color: #9CA3AF; text-transform: uppercase; margin-bottom: 4px; }
    .ceo-fin-detail-val { font-size: 14px; font-weight: 600; color: #111827; }
    .ceo-fin-highlight-box {
      background: #FEFCE8; border: 1px dashed #FDE047; border-radius: 10px;
      padding: 14px 18px; margin-bottom: 20px;
    }
    .ceo-fin-highlight-box.blue { background: #EFF6FF; border: 1px solid #BFDBFE; }
    .ceo-fin-highlight-box.green { background: #F0FDF4; border: 1px solid #BBF7D0; }

    /* Salary table */
    .ceo-sal-table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .ceo-sal-table th {
      padding: 10px 12px; text-align: left; font-size: 11px; font-weight: 700;
      color: #6B7280; text-transform: uppercase; letter-spacing: .04em;
      background: #F3F4F6; border-bottom: 1px solid #E5E7EB;
    }
    .ceo-sal-table th.right { text-align: right; }
    .ceo-sal-table td { padding: 12px; border-bottom: 1px solid #F3F4F6; }
    .ceo-sal-table tbody tr:hover td { background: #FAFAFA; }
    .ceo-sal-table tfoot td { padding: 12px; font-weight: 700; background: #F9FAFB; border-top: 2px solid #E5E7EB; }

    /* Stats bar */
    .ceo-fin-stats-row {
      display: grid; grid-template-columns: repeat(auto-fit, minmax(160px,1fr));
      gap: 0; border: 1px solid #E5E7EB; border-radius: 10px;
      overflow: hidden; margin-bottom: 24px; background: #E5E7EB;
    }
    .ceo-fin-stat-cell { background: #FFFFFF; padding: 16px 20px; }

    /* Signatures */
    .ceo-fin-sig-container { display: flex; gap: 16px; flex-wrap: wrap; }
    .ceo-fin-sig-box { flex: 1; text-align: center; min-width: 120px; }
    .ceo-fin-sig-img-wrap {
      height: 70px; border: 1px solid #E5E7EB; border-radius: 8px;
      background: #FAFAFA; display: flex; align-items: center; justify-content: center;
      margin-bottom: 4px; overflow: hidden;
    }

    /* Modal */
    .ceo-fin-modal-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 9999;
      display: flex; align-items: center; justify-content: center; backdrop-filter: blur(2px);
    }
    .ceo-fin-modal {
      background: #FFFFFF; border-radius: 12px; padding: 32px;
      width: 480px; max-width: 90vw;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      animation: cfModalIn 150ms ease-out;
    }
    @keyframes cfModalIn { from { opacity:0; transform:scale(0.95) translateY(10px); } to { opacity:1; transform:none; } }

    /* Toast */
    .ceo-fin-toast { position: fixed; top: 24px; right: 24px; z-index: 9999; padding: 14px 20px; border-radius: 10px; font-weight: 600; box-shadow: 0 10px 30px rgba(0,0,0,0.12); animation: cfModalIn 150ms ease-out; }
    .ceo-fin-toast-success { background: #F0FDF4; border: 1px solid #BBF7D0; color: #15803D; }
    .ceo-fin-toast-error   { background: #FEF2F2; border: 1px solid #FECACA; color: #991B1B; }

    @media (max-width: 768px) {
      .ceo-fin-wrapper { padding: 16px; }
      .ceo-fin-tabs-row { flex-direction: column; }
      .ceo-fin-card-header { flex-direction: column; align-items: flex-start; }
      .ceo-fin-actions { width: 100%; justify-content: space-between; }
      .ceo-fin-detail-grid { grid-template-columns: 1fr 1fr; }
    }
  `}</style>
);

/* ─── Shared Helpers ─────────────────────────────────────────────────────── */
const monthName = (m) => new Date(2000, parseInt(m) - 1).toLocaleString('default', { month: 'long' });

const SigPreview = ({ label, name, sig }) => (
  <div className="ceo-fin-sig-box">
    <div className="ceo-fin-sig-img-wrap">
      {sig
        ? <img src={sig} alt={label} style={{ maxHeight: 64, maxWidth: '100%', objectFit: 'contain' }} />
        : <span style={{ color: '#CBD5E1', fontSize: 11 }}>No signature</span>
      }
    </div>
    <div style={{ fontSize: 12, fontWeight: 700, color: '#334155' }}>{name || '—'}</div>
    <div style={{ fontSize: 10, color: '#94A3B8' }}>{label}</div>
  </div>
);

const StatusBadge = ({ status }) => {
  const map = {
    pending_ceo:      { label: 'Awaiting CEO',  bg: '#FEF9C3', color: '#A16207' },
    approved_finance: { label: 'Approved',       bg: '#DCFCE7', color: '#15803D' },
    rejected:         { label: 'Rejected',       bg: '#FEE2E2', color: '#DC2626' },
    completed:        { label: 'Completed',      bg: '#E0F2FE', color: '#0369A1' },
    'Approved':       { label: 'Approved',       bg: '#DCFCE7', color: '#15803D' },
    'Paid':           { label: 'Paid',           bg: '#DBEAFE', color: '#1E40AF' },
    'Pending CEO Approval': { label: 'Pending CEO', bg: '#FEF3C7', color: '#92400E' },
  };
  const s = map[status] || { label: status || 'Unknown', bg: '#F1F5F9', color: '#475569' };
  return (
    <span style={{ background: s.bg, color: s.color, padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, marginLeft: 12, whiteSpace: 'nowrap' }}>
      {s.label}
    </span>
  );
};

const EmptyState = ({ icon: Icon, color, title, desc }) => (
  <div style={{ textAlign: 'center', padding: '64px 20px', background: 'white', borderRadius: 12, border: '1px solid #E5E7EB' }}>
    <Icon size={48} color={color} style={{ margin: '0 auto 16px', display: 'block', opacity: 0.5 }} />
    <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 8px', color: '#111827' }}>{title}</h3>
    <p style={{ color: '#6B7280', margin: 0, fontSize: 14 }}>{desc}</p>
  </div>
);

/* ─── Detail Panels ──────────────────────────────────────────────────────── */
const EVDetailPanel = ({ ev }) => {
  const pm = ev.payment_method;
  return (
    <div className="ceo-fin-detail-panel">
      <div className="ceo-fin-detail-grid">
        <div><div className="ceo-fin-detail-label">Date</div><div className="ceo-fin-detail-val">{new Date(ev.date).toLocaleDateString('en-GB')}</div></div>
        <div><div className="ceo-fin-detail-label">Amount</div><div className="ceo-fin-detail-val">ETB {parseFloat(ev.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div></div>
        <div><div className="ceo-fin-detail-label">Payment Method</div><div className="ceo-fin-detail-val">{pm}</div></div>
        <div><div className="ceo-fin-detail-label">Reference #</div><div className="ceo-fin-detail-val">{ev.reference_no || '—'}</div></div>
      </div>
      <div className="ceo-fin-highlight-box">
        <div style={{ fontSize: 11, fontWeight: 700, color: '#A16207', marginBottom: 4 }}>PAID TO</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#713F12', marginBottom: 6 }}>{ev.paid_to}</div>
        <div style={{ fontSize: 13, color: '#78350F' }}>{ev.description}</div>
      </div>
      {pm === 'Bank' && (
        <div className="ceo-fin-highlight-box blue">
          <div style={{ fontSize: 12, fontWeight: 700, color: '#1D4ED8', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}><Building size={14} /> Bank Details</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 13, color: '#1E3A8A' }}>
            <div>Bank: <b>{ev.bank_name}</b></div>
            <div>A/C Name: <b>{ev.account_holder}</b></div>
            <div>A/C No: <b>{ev.account_number}</b></div>
            {ev.cheque_no && <div>Cheque #: <b>{ev.cheque_no}</b></div>}
          </div>
        </div>
      )}
      {pm === 'Telebirr' && (
        <div className="ceo-fin-highlight-box" style={{ background: '#FFFBEB', borderColor: '#FDE68A' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#B45309', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}><Smartphone size={14} /> Telebirr Details</div>
          <div style={{ fontSize: 13, color: '#92400E' }}>
            <div>Mobile: <b>{ev.telebirr_number}</b></div>
            <div>Name: <b>{ev.telebirr_name}</b></div>
          </div>
        </div>
      )}
      <div className="ceo-fin-sig-container">
        <SigPreview label="Prepared By" name={ev.prepared_by} sig={ev.prepared_signature} />
        <SigPreview label="Checked By" name={ev.checked_by} sig={ev.checked_signature} />
        <SigPreview label="Payee's Signature" name={ev.receiver_name} sig={ev.receiver_signature} />
      </div>
    </div>
  );
};

const CRVDetailPanel = ({ crv }) => (
  <div className="ceo-fin-detail-panel">
    <div className="ceo-fin-detail-grid">
      <div><div className="ceo-fin-detail-label">Date</div><div className="ceo-fin-detail-val">{new Date(crv.date).toLocaleDateString('en-GB')}</div></div>
      <div><div className="ceo-fin-detail-label">Amount</div><div className="ceo-fin-detail-val">ETB {parseFloat(crv.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div></div>
      <div><div className="ceo-fin-detail-label">Received From</div><div className="ceo-fin-detail-val">{crv.received_from}</div></div>
      <div><div className="ceo-fin-detail-label">Ref / Doc</div><div className="ceo-fin-detail-val">{crv.reference_no || '—'}</div></div>
    </div>
    <div className="ceo-fin-highlight-box green">
      <div style={{ fontSize: 11, fontWeight: 700, color: '#15803D', marginBottom: 4 }}>DESCRIPTION</div>
      <div style={{ fontSize: 13, color: '#166534' }}>{crv.amount_in_words}</div>
      <div style={{ fontSize: 13, color: '#166534', marginTop: 8 }}>{crv.description}</div>
    </div>
    <div className="ceo-fin-sig-container">
      <SigPreview label="Prepared By" name={crv.prepared_by} sig={crv.prepared_signature} />
      <SigPreview label="Checked By" name={crv.checked_by} sig={crv.checked_signature} />
      <SigPreview label="Received By" name={crv.received_by || crv.receiver_name} sig={crv.received_signature || crv.receiver_signature} />
    </div>
  </div>
);

/* ─── Salary Payment Seen Tab ────────────────────────────────────────────── */
const SalaryPaymentSeen = () => {
  const [payrolls, setPayrolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [detail, setDetail] = useState({});
  const [loadingDetail, setLoadingDetail] = useState(null);
  const [filterMonth, setFilterMonth] = useState('All');

  const fetchPayrolls = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/hr/etp/payroll/approved-list');
      const data = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
      setPayrolls(data);
    } catch {
      setPayrolls([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPayrolls(); }, [fetchPayrolls]);

  const loadDetail = async (p) => {
    const key = `${p.month_number}-${p.year_number}`;
    if (expanded === key) { setExpanded(null); return; }
    setExpanded(key);
    if (detail[key]) return;
    setLoadingDetail(key);
    try {
      const res = await api.get(`/hr/etp/payroll/summary/${p.month_number}/${p.year_number}`);
      const d = res?.data || res;
      setDetail(prev => ({ ...prev, [key]: d.employees || [] }));
    } catch {
      setDetail(prev => ({ ...prev, [key]: [] }));
    } finally {
      setLoadingDetail(null);
    }
  };

  // Filter to August by default if it exists
  const MONTHS = ['All', ...Array.from(new Set(payrolls.map(p => `${monthName(p.month_number)} ${p.year_number}`)))];
  const displayed = filterMonth === 'All'
    ? payrolls
    : payrolls.filter(p => `${monthName(p.month_number)} ${p.year_number}` === filterMonth);

  const totalNet = payrolls.reduce((s, p) => s + parseFloat(p.company_net_pay || 0), 0);
  const paidCount = payrolls.filter(p => ['Approved', 'Paid'].includes(p.approval_status)).length;

  if (loading) return (
    <div style={{ textAlign: 'center', padding: 80 }}>
      <SegmentedSpinner size={32} />
      <div style={{ marginTop: 16, color: '#6B7280', fontSize: 14 }}>Loading salary records…</div>
    </div>
  );

  return (
    <div>
      {/* Stats bar */}
      <div className="ceo-fin-stats-row" style={{ marginBottom: 20 }}>
        {[
          { label: 'Total Payrolls', value: payrolls.length, icon: <Users size={20} color="#7C3AED" />, bg: '#F5F3FF' },
          { label: 'CEO Approved / Paid', value: paidCount, icon: <CheckCircle size={20} color="#16A34A" />, bg: '#F0FDF4' },
          { label: 'Total Net Payout', value: `ETB ${totalNet.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, icon: <DollarSign size={20} color="#2563EB" />, bg: '#EFF6FF' },
          { label: 'Pending CEO', value: payrolls.filter(p => p.approval_status === 'Pending CEO Approval').length, icon: <Clock size={20} color="#D97706" />, bg: '#FFFBEB' },
        ].map((s, i) => (
          <div key={i} className="ceo-fin-stat-cell" style={{ background: s.bg }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              {s.icon}
              <span style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '.04em' }}>{s.label}</span>
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#111827' }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Month Filter */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {MONTHS.map(m => (
          <button
            key={m}
            onClick={() => setFilterMonth(m)}
            style={{
              padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 600,
              border: filterMonth === m ? '1px solid #7C3AED' : '1px solid #E5E7EB',
              background: filterMonth === m ? '#7C3AED' : '#FFFFFF',
              color: filterMonth === m ? '#FFFFFF' : '#374151',
              cursor: 'pointer', transition: 'all 150ms'
            }}
          >
            {m}
          </button>
        ))}
        <button onClick={fetchPayrolls} className="ceo-fin-btn ceo-fin-btn-ghost" style={{ marginLeft: 'auto' }}>
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {/* Payroll Rows */}
      {displayed.length === 0 ? (
        <EmptyState icon={Users} color="#7C3AED" title="No payroll records" desc="No salary records available for this filter." />
      ) : (
        <div className="ceo-fin-list">
          {displayed.map(p => {
            const key = `${p.month_number}-${p.year_number}`;
            const isExp = expanded === key;
            const emps = detail[key] || [];
            const isPending = p.approval_status === 'Pending CEO Approval';

            // Aggregate totals from employee records
            const totalBase  = emps.reduce((s, e) => s + parseFloat(e.base_salary || 0), 0);
            const totalAllow = emps.reduce((s, e) => s + parseFloat(e.housing_allowance || 0) + parseFloat(e.transport_allowance || 0) + parseFloat(e.communication_allowance || 0), 0);
            const totalExtra = emps.reduce((s, e) => s + parseFloat(e.overtime_pay || 0) + parseFloat(e.bonus_pay || 0), 0);
            const totalDeduct= emps.reduce((s, e) => s + parseFloat(e.deduction_absent || 0) + parseFloat(e.deduction_loan || 0) + parseFloat(e.deduction_tax || 0) + parseFloat(e.deduction_pension || 0), 0);
            const totalNet2  = emps.reduce((s, e) => s + parseFloat(e.net_pay || 0), 0);

            return (
              <div key={key} className={`ceo-fin-card ${isExp ? 'expanded' : ''}`}
                style={{ borderColor: isExp ? '#7C3AED' : (isPending ? '#FDE047' : '#E5E7EB'), boxShadow: isPending ? '0 0 0 2px #FEF9C3' : undefined }}>
                <div className="ceo-fin-card-header">
                  <div className="ceo-fin-icon-box icon-box-sal">
                    <Users size={22} />
                  </div>
                  <div className="ceo-fin-card-content">
                    <div className="ceo-fin-card-title">
                      {monthName(p.month_number)} {p.year_number} Payroll
                      <StatusBadge status={p.approval_status} />
                    </div>
                    <div className="ceo-fin-card-meta">
                      <span><strong style={{ color: '#111827' }}>{p.total_employees}</strong> employees</span>
                      <span>•</span>
                      <span style={{ fontWeight: 700, color: '#7C3AED' }}>Net: ETB {parseFloat(p.company_net_pay || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      {p.submitted_by && <><span>•</span><span>Submitted by HR: <strong>{p.submitted_by}</strong></span></>}
                    </div>
                  </div>
                  <div className="ceo-fin-actions">
                    <button onClick={() => loadDetail(p)} className="ceo-fin-btn ceo-fin-btn-ghost">
                      {isExp ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      {isExp ? 'Hide Detail' : 'View Detail'}
                    </button>
                  </div>
                </div>

                {/* Expanded Employee Breakdown */}
                {isExp && (
                  <div style={{ borderTop: '1px solid #E5E7EB', background: '#F8FAFC', padding: '20px 24px' }}>
                    {loadingDetail === key ? (
                      <div style={{ textAlign: 'center', padding: 32 }}>
                        <SegmentedSpinner size={24} />
                        <div style={{ marginTop: 10, color: '#6B7280', fontSize: 13 }}>Loading breakdown…</div>
                      </div>
                    ) : emps.length === 0 ? (
                      <div style={{ textAlign: 'center', color: '#9CA3AF', padding: 32, fontSize: 13 }}>No employee detail available.</div>
                    ) : (
                      <>
                        {/* Summary highlights */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 12, marginBottom: 20 }}>
                          {[
                            { label: 'Base Salary', value: formatCurrency(totalBase), color: '#111827' },
                            { label: 'Allowances', value: `+${formatCurrency(totalAllow)}`, color: '#16A34A' },
                            { label: 'Extras (OT/Bonus)', value: `+${formatCurrency(totalExtra)}`, color: '#0284C7' },
                            { label: 'Deductions', value: `-${formatCurrency(totalDeduct)}`, color: '#DC2626' },
                            { label: 'Net Pay', value: formatCurrency(totalNet2), color: '#7C3AED' },
                          ].map(s => (
                            <div key={s.label} style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 8, padding: '12px 16px' }}>
                              <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', marginBottom: 4 }}>{s.label}</div>
                              <div style={{ fontSize: 15, fontWeight: 800, color: s.color }}>{s.value}</div>
                            </div>
                          ))}
                        </div>

                        {/* Employee Table */}
                        <div style={{ overflowX: 'auto', borderRadius: 8, border: '1px solid #E5E7EB' }}>
                          <table className="ceo-sal-table">
                            <thead>
                              <tr>
                                <th>#</th>
                                <th>Employee</th>
                                <th className="right">Base Salary</th>
                                <th className="right">Allowances</th>
                                <th className="right">Extras</th>
                                <th className="right">Deductions</th>
                                <th className="right">Net Pay</th>
                              </tr>
                            </thead>
                            <tbody>
                              {emps.map((emp, idx) => {
                                const allow  = parseFloat(emp.housing_allowance || 0) + parseFloat(emp.transport_allowance || 0) + parseFloat(emp.communication_allowance || 0);
                                const extra  = parseFloat(emp.overtime_pay || 0) + parseFloat(emp.bonus_pay || 0);
                                const deduct = parseFloat(emp.deduction_absent || 0) + parseFloat(emp.deduction_loan || 0) + parseFloat(emp.deduction_tax || 0) + parseFloat(emp.deduction_pension || 0);
                                return (
                                  <tr key={emp.employee_id}>
                                    <td style={{ color: '#9CA3AF', fontSize: 12 }}>{idx + 1}</td>
                                    <td>
                                      <div style={{ fontWeight: 600, color: '#111827' }}>{emp.full_name}</div>
                                      <div style={{ fontSize: 11, color: '#9CA3AF' }}>#{emp.employee_id}</div>
                                    </td>
                                    <td style={{ textAlign: 'right', fontWeight: 500 }}>{formatCurrency(emp.base_salary)}</td>
                                    <td style={{ textAlign: 'right', color: '#16A34A' }}>{allow > 0 ? `+${formatCurrency(allow)}` : '—'}</td>
                                    <td style={{ textAlign: 'right', color: '#0284C7' }}>{extra > 0 ? `+${formatCurrency(extra)}` : '—'}</td>
                                    <td style={{ textAlign: 'right', color: '#DC2626' }}>{deduct > 0 ? `-${formatCurrency(deduct)}` : '—'}</td>
                                    <td style={{ textAlign: 'right', fontWeight: 700, color: '#7C3AED' }}>{formatCurrency(emp.net_pay)}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                            <tfoot>
                              <tr>
                                <td colSpan={2} style={{ fontSize: 11, color: '#6B7280', textTransform: 'uppercase' }}>Total ({emps.length} employees)</td>
                                <td style={{ textAlign: 'right' }}>{formatCurrency(totalBase)}</td>
                                <td style={{ textAlign: 'right', color: '#16A34A' }}>+{formatCurrency(totalAllow)}</td>
                                <td style={{ textAlign: 'right', color: '#0284C7' }}>+{formatCurrency(totalExtra)}</td>
                                <td style={{ textAlign: 'right', color: '#DC2626' }}>-{formatCurrency(totalDeduct)}</td>
                                <td style={{ textAlign: 'right', color: '#7C3AED', fontSize: 15 }}>{formatCurrency(totalNet2)}</td>
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
  );
};

/* ─── Main Component ─────────────────────────────────────────────────────── */
const CEOFinanceApprovals = () => {
  const [activeTab, setActiveTab] = useState('EV');
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [toast, setToast] = useState(null);

  const [evs,  setEvs]  = useState([]);
  const [crvs, setCrvs] = useState([]);

  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [confirmApproveTarget, setConfirmApproveTarget] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadData = useCallback(async () => {
    if (activeTab === 'SALARY') return; // handled by sub-component
    setLoading(true);
    setExpanded(null);
    try {
      if (activeTab === 'EV') {
        const res = await api.get('/finance-cash/ev/pending');
        const data = res?.data?.data || res?.data || [];
        setEvs(Array.isArray(data) ? data.filter(p => p.status === 'pending_ceo') : []);
      } else if (activeTab === 'CRV') {
        const res = await api.get('/finance-cash/crv');
        setCrvs(Array.isArray(res?.data) ? res.data : []);
      }
    } catch (e) {
      console.error(e);
      showToast('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleApproveEv = async (ev) => {
    setActionLoading(ev.id);
    try {
      await api.put(`/finance-cash/ev/${ev.id}/approve`);
      showToast(`✅ ${ev.ev_number} approved and sent to Finance!`, 'success');
      setConfirmApproveTarget(null);
      loadData();
    } catch {
      showToast('Failed to approve EV', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectEv = async () => {
    if (!rejectReason.trim()) return;
    setActionLoading(rejectTarget.id);
    try {
      await api.put(`/finance-cash/ev/${rejectTarget.id}/reject`, { reason: rejectReason });
      showToast('EV rejected. Finance has been notified.', 'error');
      setRejectTarget(null);
      setRejectReason('');
      loadData();
    } catch {
      showToast('Failed to reject EV', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const TABS = [
    { id: 'EV',    label: 'Expense Voucher Approval (EV)',   icon: <FileText size={15} /> },
    { id: 'CRV',    label: 'Cash Receipt Voucher (CRV)',       icon: <Download size={15} /> },
    { id: 'SALARY', label: 'Salary Payment Seen',             icon: <Users size={15} /> },
  ];

  const navigate = useNavigate();

  return (
    <div className="ceo-fin-wrapper">
      <GlobalStyles />

      {/* Toast */}
      {toast && (
        <div className={`ceo-fin-toast ceo-fin-toast-${toast.type}`}>{toast.msg}</div>
      )}

      <div className="ceo-fin-container">
        {/* ── Back Bar ── */}
        <div className="ceo-fin-back-bar">
          <button className="ceo-fin-back-btn" onClick={() => navigate('/ceo/approvals')}>
            <ArrowLeft size={14} /> Back to Approvals Hub
          </button>
          <div className="ceo-fin-back-divider" />
          <span className="ceo-fin-back-label">
            <Banknote size={15} /> Finance Approvals
          </span>
        </div>

        {/* Header */}
        <div className="ceo-fin-header">
          <div>
            <h1 className="ceo-fin-title">
              <div className="ceo-fin-title-icon"><Banknote color="white" size={22} /></div>
              Finance Approvals
            </h1>
            <p className="ceo-fin-subtitle">Review expense vouchers, monitor receipts, and salary disbursements.</p>
          </div>
          {activeTab !== 'SALARY' && (
            <button onClick={loadData} className="ceo-fin-btn ceo-fin-btn-ghost">
              <RefreshCw size={15} /> Refresh
            </button>
          )}
        </div>

        {/* 4 Functionality Tabs Row */}
        <div className="ceo-fin-tabs-row">
          {TABS.map(t => (
            <button
              key={t.id}
              className={`ceo-fin-tab-btn ${activeTab === t.id ? 'active' : ''}`}
              onClick={() => setActiveTab(t.id)}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* ── SALARY TAB (self-contained sub-component) ── */}
        {activeTab === 'SALARY' && <SalaryPaymentSeen />}

        {/* ── Other Tabs ── */}
        {activeTab !== 'SALARY' && (
          loading ? (
            <div style={{ textAlign: 'center', padding: '80px 20px', color: '#9CA3AF' }}>
              <SegmentedSpinner size={32} />
              <div style={{ marginTop: 16 }}>Loading {activeTab}s…</div>
            </div>
          ) : (
            <div className="ceo-fin-list">

              {/* ── EV Tab (Expense Vouchers pending approval) ── */}
              {activeTab === 'EV' && (
                evs.length === 0
                  ? <EmptyState icon={CheckCircle} color="#16A34A" title="All Clear!" desc="No expense vouchers are awaiting your approval." />
                  : evs.map(ev => (
                    <div key={ev.id} className={`ceo-fin-card ${expanded === ev.id ? 'expanded' : ''}`}>
                      <div className="ceo-fin-card-header">
                        <div className="ceo-fin-icon-box icon-box-pcv"><FileText size={22} /></div>
                        <div className="ceo-fin-card-content">
                          <div className="ceo-fin-card-title">
                            {ev.ev_number}
                            <StatusBadge status={ev.status} />
                          </div>
                          <div className="ceo-fin-card-meta">
                            <span><strong style={{ color: '#111827' }}>To:</strong> {ev.paid_to}</span>
                            <span>•</span>
                            <span>{new Date(ev.date).toLocaleDateString('en-GB')}</span>
                            <span>•</span>
                            <span style={{ fontWeight: 700, color: '#A16207' }}>ETB {parseFloat(ev.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                          </div>
                        </div>
                        <div className="ceo-fin-actions">
                          <button onClick={() => setExpanded(expanded === ev.id ? null : ev.id)} className="ceo-fin-btn ceo-fin-btn-ghost">
                            <Eye size={14} /> {expanded === ev.id ? 'Hide' : 'View'}
                          </button>
                          <button onClick={() => setRejectTarget(ev)} className="ceo-fin-btn ceo-fin-btn-danger">
                            <XCircle size={14} /> Reject
                          </button>
                          <button onClick={() => setConfirmApproveTarget(ev)} disabled={actionLoading === ev.id} className="ceo-fin-btn ceo-fin-btn-success">
                            {actionLoading === ev.id ? <SegmentedSpinner size={14} /> : <CheckCircle size={14} />} Approve
                          </button>
                        </div>
                      </div>
                      {expanded === ev.id && <EVDetailPanel ev={ev} />}
                    </div>
                  ))
              )}

              {/* ── CRV Tab (Cash Receipt Voucher) ── */}
              {activeTab === 'CRV' && (
                crvs.length === 0
                  ? <EmptyState icon={Download} color="#22C55E" title="No Receipt Vouchers" desc="No cash receipt vouchers have been recorded in Finance yet." />
                  : crvs.map(crv => (
                    <div key={crv.id} className={`ceo-fin-card ${expanded === crv.id ? 'expanded' : ''}`}
                      style={{ borderColor: expanded === crv.id ? '#22C55E' : '' }}>
                      <div className="ceo-fin-card-header">
                        <div className="ceo-fin-icon-box icon-box-crv"><Download size={22} /></div>
                        <div className="ceo-fin-card-content">
                          <div className="ceo-fin-card-title">{crv.crv_number || `CRV-${crv.id}`}</div>
                          <div className="ceo-fin-card-meta">
                            <span><strong style={{ color: '#111827' }}>From:</strong> {crv.received_from}</span>
                            <span>•</span>
                            <span>{new Date(crv.date).toLocaleDateString('en-GB')}</span>
                            <span>•</span>
                            <span style={{ fontWeight: 700, color: '#15803D' }}>ETB {parseFloat(crv.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                          </div>
                        </div>
                        <div className="ceo-fin-actions">
                          <button onClick={() => setExpanded(expanded === crv.id ? null : crv.id)} className="ceo-fin-btn ceo-fin-btn-ghost">
                            <Eye size={14} /> {expanded === crv.id ? 'Hide' : 'View'}
                          </button>
                        </div>
                      </div>
                      {expanded === crv.id && <CRVDetailPanel crv={crv} />}
                    </div>
                  ))
              )}

            </div>
          )
        )}
      </div>

      {/* ── Reject Modal ── */}
      {rejectTarget && (
        <div className="ceo-fin-modal-overlay">
          <div className="ceo-fin-modal">
            <h3 className="ceo-fin-title" style={{ fontSize: 20, marginBottom: 12 }}>Reject EV</h3>
            <p style={{ color: '#6B7280', fontSize: 14, marginBottom: 20 }}>
              Rejecting <b style={{ color: '#DC2626' }}>{rejectTarget.ev_number}</b>. Please provide a reason.
            </p>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="Enter rejection reason (required)…"
              style={{ width: '100%', padding: '12px 14px', border: '2px solid #FCA5A5', borderRadius: 10, fontSize: 14, outline: 'none', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }}
              rows={4}
            />
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 24 }}>
              <button onClick={() => { setRejectTarget(null); setRejectReason(''); }} className="ceo-fin-btn ceo-fin-btn-ghost">Cancel</button>
              <button
                onClick={handleRejectEv}
                disabled={!rejectReason.trim() || actionLoading === rejectTarget.id}
                className="ceo-fin-btn ceo-fin-btn-danger"
                style={{ opacity: !rejectReason.trim() ? 0.5 : 1, cursor: !rejectReason.trim() ? 'not-allowed' : 'pointer' }}
              >
                {actionLoading === rejectTarget.id ? <SegmentedSpinner size={16} /> : <XCircle size={16} />} Reject EV
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirm Approve Modal ── */}
      {confirmApproveTarget && (
        <div className="ceo-fin-modal-overlay">
          <div className="ceo-fin-modal" style={{ textAlign: 'center', width: 400 }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
              <CheckCircle size={56} color="#16A34A" />
            </div>
            <h3 style={{ margin: '0 0 12px', fontSize: 22, fontWeight: 800 }}>Confirm Approval</h3>
            <p style={{ margin: '0 0 24px', color: '#6B7280', fontSize: 14, lineHeight: 1.5 }}>
              Approve EV <b>{confirmApproveTarget.ev_number}</b>? This will forward it to Finance for payment.
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => setConfirmApproveTarget(null)} className="ceo-fin-btn ceo-fin-btn-ghost" style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
              <button onClick={() => handleApproveEv(confirmApproveTarget)} className="ceo-fin-btn ceo-fin-btn-success" style={{ flex: 1, justifyContent: 'center' }}>
                Confirm Approve
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CEOFinanceApprovals;
