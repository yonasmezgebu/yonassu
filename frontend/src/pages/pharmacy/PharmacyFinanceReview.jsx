import React, { useState, useEffect, useCallback } from 'react';
import {
  DollarSign, RefreshCw, FileText, TrendingUp, TrendingDown,
  Truck, CreditCard, ClipboardCheck, AlertTriangle, CheckCircle,
  XCircle, Zap, ChevronDown, ChevronUp, BarChart2
} from 'lucide-react';
import pharmacyService from '../../services/pharmacyService';
import authService from '../../services/authService';

const BG  = '#E8F5F0';
const C   = '#1A5C38';
const CD  = '#145030';
const CDX = '#0C3520';

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
  @keyframes fadeUp     { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
  @keyframes pulse      { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(.9)} }
  @keyframes spin       { to{transform:rotate(360deg)} }
  @keyframes laserSweep { 0%{left:-150%} 100%{left:150%} }
  @keyframes colorBlink {
    0%   { color:#1edb8a; filter:drop-shadow(0 0 8px rgba(30,219,138,.7));  transform:scale(1); }
    33%  { color:#00c9a7; filter:drop-shadow(0 0 12px rgba(0,201,167,.9)); transform:scale(1.2); }
    66%  { color:#22c55e; filter:drop-shadow(0 0 14px rgba(34,197,94,1));  transform:scale(1.35); }
    100% { color:#1edb8a; filter:drop-shadow(0 0 8px rgba(30,219,138,.7));  transform:scale(1); }
  }
  .fr-blink { animation: colorBlink 2.5s infinite ease-in-out; }

  .fr-page { min-height:calc(100vh - 64px); font-family:'Inter','Segoe UI',sans-serif; padding-bottom:48px; }

  .fr-card {
    --hc:${C}; position:relative; overflow:hidden;
    background:white; border-radius:0;
    box-shadow:0 4px 20px rgba(0,60,30,.10);
    transition:background-size .45s ease, box-shadow .3s ease, transform .2s ease;
    animation:fadeUp .5s ease both;
    background-image:
      linear-gradient(to right,var(--hc),var(--hc)),
      linear-gradient(to bottom,var(--hc),var(--hc)),
      linear-gradient(to left,var(--hc),var(--hc)),
      linear-gradient(to top,var(--hc),var(--hc));
    background-position:0 0,100% 0,100% 100%,0 100%;
    background-repeat:no-repeat;
    background-size:0% 4px,4px 0%,0% 4px,4px 0%;
  }
  .fr-card:hover {
    background-size:100% 4px,4px 100%,100% 4px,4px 100%;
    box-shadow:0 8px 32px rgba(0,60,30,.18);
    transform:translateY(-2px);
  }
  .fr-card::after {
    content:''; position:absolute; top:0; left:-150%; width:100%; height:100%;
    background:linear-gradient(90deg,transparent 0%,rgba(0,255,180,0.2) 30%,rgba(0,220,130,0.25) 60%,transparent 100%);
    transform:skewX(-25deg); pointer-events:none; z-index:2;
  }
  .fr-card:hover::after { animation:laserSweep .8s ease-out forwards; }

  .fr-chip {
    --hc:${C}; position:relative; overflow:hidden;
    background:white; border-radius:0; padding:20px;
    box-shadow:0 4px 20px rgba(0,60,30,.10);
    transition:background-size .45s ease, box-shadow .3s ease, transform .2s ease;
    animation:fadeUp .5s ease both;
    background-image:
      linear-gradient(to right,var(--hc),var(--hc)),
      linear-gradient(to bottom,var(--hc),var(--hc)),
      linear-gradient(to left,var(--hc),var(--hc)),
      linear-gradient(to top,var(--hc),var(--hc));
    background-position:0 0,100% 0,100% 100%,0 100%;
    background-repeat:no-repeat;
    background-size:0% 4px,4px 0%,0% 4px,4px 0%;
  }
  .fr-chip:hover {
    background-size:100% 4px,4px 100%,100% 4px,4px 100%;
    box-shadow:0 8px 32px rgba(0,60,30,.18);
    transform:translateY(-3px);
  }

  .fr-head {
    padding:14px 22px;
    background:linear-gradient(135deg,${C},${CD});
    color:white; display:flex; align-items:center; gap:12px;
    box-shadow:inset 0 -3px 0 rgba(0,0,0,.18);
  }
  .fr-head span { font-size:13px; font-weight:900; letter-spacing:.07em; text-transform:uppercase; }

  .fr-title {
    font-size:2.4rem; font-weight:900; color:#0a2218; letter-spacing:-.02em;
    text-shadow:1px 1px 0 #fff,2px 2px 0 #fff,3px 3px 0 ${C}44,4px 4px 0 ${C}33,5px 5px 8px rgba(0,0,0,.15);
    margin:0; display:flex; align-items:center; gap:12px; line-height:1.1;
  }
  .fr-sub { font-size:.82rem; color:${C}; font-weight:800; text-transform:uppercase; letter-spacing:.14em; }

  .fr-tbl { width:100%; border-collapse:collapse; font-size:13.5px; }
  .fr-th  { text-align:left; padding:11px 14px;
    background:linear-gradient(135deg,rgba(26,92,56,.12),rgba(20,80,48,.07));
    border-bottom:3px solid ${C}; color:${CD}; font-weight:900;
    text-transform:uppercase; letter-spacing:.06em; font-size:10.5px; }
  .fr-td  { padding:12px 14px; border-bottom:1px solid rgba(26,92,56,.09); color:#2d3748; font-weight:600; vertical-align:middle; }
  .fr-tr:hover .fr-td { background:rgba(26,92,56,.04); }

  .fr-badge {
    padding:5px 12px; border-radius:99px; font-weight:900; font-size:10.5px;
    text-transform:uppercase; letter-spacing:.05em; display:inline-flex; align-items:center; gap:5px;
    box-shadow:0 2px 0 rgba(0,0,0,.08),inset 0 1px 0 rgba(255,255,255,.6); white-space:nowrap;
  }
  .fb-pending   { background:linear-gradient(135deg,#fffbeb,#fef3c7); color:#92400e; border:1px solid #fde68a; }
  .fb-approved  { background:linear-gradient(135deg,#f0fdf4,#dcfce7); color:#065f46; border:1px solid #6ee7b7; }
  .fb-rejected  { background:linear-gradient(135deg,#fef2f2,#fee2e2); color:#991b1b; border:1px solid #fca5a5; }
  .fb-paid      { background:linear-gradient(135deg,#eff6ff,#dbeafe); color:#1e40af; border:1px solid #93c5fd; }
  .fb-default   { background:rgba(26,92,56,.1); color:${CD}; border:1px solid rgba(26,92,56,.25); }

  .fr-btn {
    display:inline-flex; align-items:center; gap:6px;
    padding:7px 16px; font-weight:900; font-size:12px; cursor:pointer;
    letter-spacing:.07em; text-transform:uppercase; border-radius:8px;
    transition:all .12s; font-family:'Inter',sans-serif;
    box-shadow:0 4px 0 rgba(0,0,0,.2),inset 0 1px 0 rgba(255,255,255,.2);
  }
  .fr-btn:active { transform:translateY(4px); box-shadow:none; }
  .fr-btn:disabled { opacity:.5; cursor:not-allowed; }
  .fr-btn-approve { background:linear-gradient(135deg,#10b981,#059669); color:white; border:2px solid #047857; }
  .fr-btn-reject  { background:linear-gradient(135deg,#ef4444,#dc2626); color:white; border:2px solid #b91c1c; }
  .fr-btn-paid    { background:linear-gradient(135deg,#3b82f6,#2563eb); color:white; border:2px solid #1d4ed8; }
  .fr-btn-ghost   { background:white; color:${CD}; border:2px solid ${C}; }

  .read-only-banner {
    background:linear-gradient(135deg,#fffbeb,#fef3c7);
    border:2px solid #fde68a; padding:14px 20px;
    display:flex; align-items:center; gap:12px;
    margin:0 32px 20px; animation:fadeUp .4s ease;
  }
`;

const STATUS_BADGE = { PENDING: 'fb-pending', APPROVED: 'fb-approved', REJECTED: 'fb-rejected', FINANCE_PAID: 'fb-paid', CEO_CONFIRMED: 'fb-approved' };
const badgeCls = (s) => STATUS_BADGE[s] || 'fb-default';

const StatusBadge = ({ status }) => (
  <span className={`fr-badge ${badgeCls(status)}`}>{status?.replace(/_/g, ' ') || '—'}</span>
);

const fmt    = (v) => parseFloat(v || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

function Section({ icon: Icon, title, count, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="fr-card">
      <div className="fr-head" style={{ justifyContent: 'space-between', cursor: 'pointer' }} onClick={() => setOpen(p => !p)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Icon size={20} />
          <span>{title}</span>
          {count !== undefined && (
            <span style={{ background: 'rgba(255,255,255,.22)', borderRadius: 99, padding: '2px 10px', fontSize: 11, fontWeight: 900 }}>{count}</span>
          )}
        </div>
        {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </div>
      {open && children}
    </div>
  );
}

function SalesReportActions({ id, onDecide, isFinance }) {
  const [notes, setNotes]   = useState('');
  const [busy, setBusy]     = useState(false);
  const [done, setDone]     = useState(false);

  const decide = async (decision) => {
    setBusy(true);
    try {
      await pharmacyService.financeDecideSalesReport(id, { decision, notes });
      setDone(true);
      onDecide();
    } catch (e) { console.error(e); }
    setBusy(false);
  };

  if (!isFinance) return null;
  if (done) return <span style={{ color: '#059669', fontWeight: 800, fontSize: 12 }}>✓ Recorded</span>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Finance notes…"
        style={{ padding: '7px 11px', border: `2px solid ${C}`, fontWeight: 700, fontSize: 12, fontFamily: 'Inter', outline: 'none', resize: 'none', width: '100%' }} />
      <div style={{ display: 'flex', gap: 6 }}>
        <button className="fr-btn fr-btn-approve" disabled={busy} onClick={() => decide('APPROVED')}>
          {busy ? '…' : <><CheckCircle size={12} />Approve</>}
        </button>
        <button className="fr-btn fr-btn-reject" disabled={busy} onClick={() => decide('REJECTED')}>
          {busy ? '…' : <><XCircle size={12} />Reject</>}
        </button>
      </div>
    </div>
  );
}

function MarkPaidButton({ id, onDecide, isFinance }) {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const markPaid = async () => {
    setBusy(true);
    try {
      await pharmacyService.financeMarkDeliveryPaid(id, {});
      setDone(true);
      onDecide();
    } catch (e) { console.error(e); }
    setBusy(false);
  };

  if (!isFinance) return null;
  if (done) return <span style={{ color: '#059669', fontWeight: 800, fontSize: 12 }}>✓ Marked Paid</span>;

  return (
    <button className="fr-btn fr-btn-paid" disabled={busy} onClick={markPaid}>
      {busy ? '…' : <><CheckCircle size={12} />Mark Paid</>}
    </button>
  );
}

export default function PharmacyFinanceReview() {
  const today = new Date().toISOString().split('T')[0];
  const [date, setDate]       = useState(today);
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);

  const user      = authService.getCurrentUser();
  const roles     = (user?.roles || []).map(r => r.toLowerCase());
  const isFinance = roles.includes('finance') || roles.includes('finance manager') || roles.includes('admin');
  const isReadOnly = !isFinance; // Pharmacy Manager sees read-only

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await pharmacyService.getFinanceReview({ date });
      setData(res?.data || res);
    } catch (e) {
      console.error(e);
      setData({ salesReports: [], financeRecords: [], pendingPaymentDeliveries: [], payments: [], auditTrail: [] });
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => { load(); }, [load]);

  const salesReports             = data?.salesReports || [];
  const financeRecords           = data?.financeRecords || [];
  const pendingPaymentDeliveries = data?.pendingPaymentDeliveries || [];
  const payments                 = data?.payments || [];
  const auditTrail               = data?.auditTrail || [];

  // P&L summary
  const totalRevenue    = financeRecords.reduce((s, r) => s + parseFloat(r.revenue || 0), 0);
  const totalCOGS       = financeRecords.reduce((s, r) => s + parseFloat(r.cogs || 0), 0);
  const totalPnL        = financeRecords.reduce((s, r) => s + parseFloat(r.profit_loss || 0), 0);
  const pendingApproval = salesReports.filter(r => r.status === 'PENDING').length;

  return (
    <div className="fr-page">
      <style>{CSS}</style>

      {/* HEADER */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', padding: '28px 32px 22px', animation: 'fadeUp .35s ease' }}>
        <div>
          <h1 className="fr-title">
            Finance Review.
            <DollarSign className="fr-blink" size={34} />
          </h1>
        </div>
        <div style={{ justifySelf: 'center' }}>
          <p className="fr-sub">Financial Queue · P&amp;L · Payment Records</p>
        </div>
        <div style={{ justifySelf: 'end', display: 'flex', gap: 10, alignItems: 'center' }}>
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            style={{ padding: '9px 13px', border: `2px solid ${C}`, background: 'white', fontWeight: 800, color: '#0a2218', outline: 'none', fontFamily: 'Inter', fontSize: 13, boxShadow: `0 4px 0 ${CD}`, borderRadius: 0 }}
          />
          <button onClick={load} disabled={loading} className="fr-btn fr-btn-ghost">
            <SegmentedSpinner size={14} /> Refresh
          </button>
        </div>
      </div>

      {/* Read-only banner for Pharmacy Manager */}
      {isReadOnly && (
        <div className="read-only-banner">
          <AlertTriangle size={20} color="#d97706" />
          <div>
            <strong style={{ color: '#92400e', fontSize: 13 }}>Read-Only View</strong>
            <p style={{ margin: '2px 0 0', color: '#b45309', fontSize: 12, fontWeight: 600 }}>
              You can see Finance's decisions on your submitted reports. Only Finance can approve, reject, or mark payments.
            </p>
          </div>
        </div>
      )}

      {/* SUMMARY CHIPS */}
      <div style={{ padding: '0 32px', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 22 }}>
        {[
          { label: 'Pending Approval',   val: pendingApproval,             icon: <FileText size={22} />,    color: '#d97706' },
          { label: 'Total Revenue',      val: `${fmt(totalRevenue)} ETB`,  icon: <TrendingUp size={22} />,  color: '#059669' },
          { label: 'Total COGS',         val: `${fmt(totalCOGS)} ETB`,     icon: <BarChart2 size={22} />,   color: '#7c3aed' },
          { label: 'Net P&L',            val: `${totalPnL >= 0 ? '+' : ''}${fmt(totalPnL)} ETB`, icon: totalPnL >= 0 ? <TrendingUp size={22} /> : <TrendingDown size={22} />, color: totalPnL >= 0 ? '#059669' : '#dc2626' },
        ].map((s, i) => (
          <div key={i} className="fr-chip" style={{ animationDelay: `${i * 0.07}s` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.08em', color: '#64748b' }}>{s.label}</div>
              <div style={{ color: s.color, opacity: .7 }}>{s.icon}</div>
            </div>
            <div style={{ fontSize: typeof s.val === 'string' ? 18 : 30, fontWeight: 900, color: s.color, lineHeight: 1.2 }}>{s.val}</div>
          </div>
        ))}
      </div>

      {loading ? (
        <div style={{ padding: '80px 0', textAlign: 'center' }}>
          <Zap size={48} color={C} style={{ animation: 'pulse 1.5s ease-in-out infinite', margin: '0 auto 14px', display: 'block' }} />
          <div style={{ fontWeight: 800, color: '#0a2218', fontSize: 18 }}>Loading Finance Review…</div>
        </div>
      ) : (
        <div style={{ padding: '0 32px', display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* ── 1. Sales Reports ── */}
          <Section icon={FileText} title="Sales Reports — Finance Decision Queue" count={salesReports.length}>
            {salesReports.length === 0 ? (
              <div style={{ padding: '40px 24px', textAlign: 'center', color: '#64748b', fontWeight: 700 }}>No sales reports found.</div>
            ) : (
              <table className="fr-tbl">
                <thead>
                  <tr>
                    <th className="fr-th">Report Date</th>
                    <th className="fr-th" style={{ textAlign: 'right' }}>Total Sales</th>
                    <th className="fr-th" style={{ textAlign: 'right' }}>Total Amount (ETB)</th>
                    <th className="fr-th">Submitted By</th>
                    <th className="fr-th">Status</th>
                    <th className="fr-th">Finance Decision</th>
                    <th className="fr-th">Finance Notes</th>
                    <th className="fr-th">Decided At</th>
                    {isFinance && <th className="fr-th">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {salesReports.map((r) => (
                    <tr key={r.id} className="fr-tr">
                      <td className="fr-td" style={{ fontWeight: 800, color: CD }}>{fmtDate(r.report_date)}</td>
                      <td className="fr-td" style={{ textAlign: 'right', fontWeight: 800 }}>{r.total_sales || 0}</td>
                      <td className="fr-td" style={{ textAlign: 'right', fontWeight: 900, color: C }}>{fmt(r.total_amount)}</td>
                      <td className="fr-td" style={{ color: '#475569' }}>{r.submitted_by_name || '—'}</td>
                      <td className="fr-td"><StatusBadge status={r.status} /></td>
                      <td className="fr-td">
                        {r.finance_decision ? <StatusBadge status={r.finance_decision} /> : <span style={{ color: '#94a3b8', fontSize: 12 }}>—</span>}
                      </td>
                      <td className="fr-td" style={{ color: '#64748b', fontSize: 12, maxWidth: 180 }}>{r.finance_notes || '—'}</td>
                      <td className="fr-td" style={{ color: '#64748b', fontSize: 12 }}>{fmtDate(r.finance_decided_at)}</td>
                      {isFinance && (
                        <td className="fr-td">
                          {r.status === 'PENDING' ? (
                            <SalesReportActions id={r.id} onDecide={load} isFinance={isFinance} />
                          ) : (
                            <span style={{ color: '#94a3b8', fontSize: 12, fontWeight: 700 }}>Decided</span>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Section>

          {/* ── 2. P&L Records ── */}
          <Section icon={TrendingUp} title="Profit & Loss Records" count={financeRecords.length}>
            {financeRecords.length === 0 ? (
              <div style={{ padding: '40px 24px', textAlign: 'center', color: '#64748b', fontWeight: 700 }}>No P&L records found.</div>
            ) : (
              <table className="fr-tbl">
                <thead>
                  <tr>
                    <th className="fr-th">Date</th>
                    <th className="fr-th" style={{ textAlign: 'right' }}>Revenue (ETB)</th>
                    <th className="fr-th" style={{ textAlign: 'right' }}>COGS (ETB)</th>
                    <th className="fr-th" style={{ textAlign: 'right' }}>Profit / Loss (ETB)</th>
                    <th className="fr-th">Result</th>
                    <th className="fr-th">Finance Decision</th>
                    <th className="fr-th">Notes</th>
                    <th className="fr-th">Recorded</th>
                  </tr>
                </thead>
                <tbody>
                  {financeRecords.map((r) => {
                    const isProfit = parseFloat(r.profit_loss || 0) >= 0;
                    return (
                      <tr key={r.id} className="fr-tr">
                        <td className="fr-td" style={{ fontWeight: 800, color: CD }}>{fmtDate(r.created_at)}</td>
                        <td className="fr-td" style={{ textAlign: 'right', fontWeight: 800, color: '#059669' }}>{fmt(r.revenue)}</td>
                        <td className="fr-td" style={{ textAlign: 'right', fontWeight: 800, color: '#dc2626' }}>{fmt(r.cogs)}</td>
                        <td className="fr-td" style={{ textAlign: 'right', fontWeight: 900, color: isProfit ? '#059669' : '#dc2626' }}>
                          {isProfit ? '+' : ''}{fmt(r.profit_loss)}
                        </td>
                        <td className="fr-td">
                          <span className={`fr-badge ${isProfit ? 'fb-approved' : 'fb-rejected'}`}>
                            {isProfit ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                            {r.result || (isProfit ? 'Profit' : 'Loss')}
                          </span>
                        </td>
                        <td className="fr-td">
                          {r.finance_decision ? <StatusBadge status={r.finance_decision} /> : <span style={{ color: '#94a3b8' }}>—</span>}
                        </td>
                        <td className="fr-td" style={{ color: '#64748b', fontSize: 12 }}>{r.finance_notes || '—'}</td>
                        <td className="fr-td">
                          <span className={`fr-badge ${r.income_recorded ? 'fb-paid' : 'fb-pending'}`}>
                            {r.income_recorded ? 'Recorded' : 'Pending'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </Section>

          {/* ── 3. Deliveries Awaiting Payment ── */}
          <Section icon={Truck} title="Direct Deliveries — Awaiting Finance Payment" count={pendingPaymentDeliveries.length}>
            {pendingPaymentDeliveries.length === 0 ? (
              <div style={{ padding: '40px 24px', textAlign: 'center', color: '#64748b', fontWeight: 700 }}>No deliveries awaiting payment.</div>
            ) : (
              <table className="fr-tbl">
                <thead>
                  <tr>
                    <th className="fr-th">Delivery No.</th>
                    <th className="fr-th">Supplier</th>
                    <th className="fr-th">Drug</th>
                    <th className="fr-th" style={{ textAlign: 'right' }}>Total Amount (ETB)</th>
                    <th className="fr-th">Payable Status</th>
                    <th className="fr-th">Date</th>
                    {isFinance && <th className="fr-th">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {pendingPaymentDeliveries.map((d) => (
                    <tr key={d.id} className="fr-tr">
                      <td className="fr-td"><code style={{ background: 'rgba(26,92,56,.1)', padding: '3px 8px', fontSize: 12, fontWeight: 900, color: CD }}>{d.delivery_no || `#${d.id}`}</code></td>
                      <td className="fr-td" style={{ fontWeight: 700 }}>{d.supplier || '—'}</td>
                      <td className="fr-td">{d.drug_name || '—'}</td>
                      <td className="fr-td" style={{ textAlign: 'right', fontWeight: 900, color: C }}>{fmt(d.total_amount)}</td>
                      <td className="fr-td"><StatusBadge status={d.status} /></td>
                      <td className="fr-td" style={{ color: '#64748b', fontSize: 12 }}>{fmtDate(d.created_at)}</td>
                      {isFinance && (
                        <td className="fr-td">
                          {d.status === 'CEO_CONFIRMED' ? (
                            <MarkPaidButton id={d.id} onDecide={load} isFinance={isFinance} />
                          ) : (
                            <StatusBadge status={d.status} />
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Section>

          {/* ── 4. Payments ── */}
          <Section icon={CreditCard} title="Payment Records" count={payments.length} defaultOpen={false}>
            {payments.length === 0 ? (
              <div style={{ padding: '40px 24px', textAlign: 'center', color: '#64748b', fontWeight: 700 }}>No payment records found for this date.</div>
            ) : (
              <table className="fr-tbl">
                <thead>
                  <tr>
                    <th className="fr-th">Receipt No.</th>
                    <th className="fr-th">Payment Method</th>
                    <th className="fr-th" style={{ textAlign: 'right' }}>Amount (ETB)</th>
                    <th className="fr-th">Worker</th>
                    <th className="fr-th">Branch</th>
                    <th className="fr-th">Status</th>
                    <th className="fr-th">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.id} className="fr-tr">
                      <td className="fr-td"><code style={{ background: 'rgba(26,92,56,.1)', padding: '3px 8px', fontSize: 12, fontWeight: 900, color: CD }}>{p.receipt_no || `#${p.id}`}</code></td>
                      <td className="fr-td"><span className="fr-badge fb-default">{p.payment_method || '—'}</span></td>
                      <td className="fr-td" style={{ textAlign: 'right', fontWeight: 900, color: C }}>{fmt(p.amount)}</td>
                      <td className="fr-td">{p.worker_name || '—'}</td>
                      <td className="fr-td">{p.branch_name || '—'}</td>
                      <td className="fr-td"><StatusBadge status={p.status} /></td>
                      <td className="fr-td" style={{ color: '#64748b', fontSize: 12 }}>{fmtDate(p.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Section>

          {/* ── 5. Audit Trail ── */}
          <Section icon={ClipboardCheck} title="Audit Trail (PAID / CASHOUT)" count={auditTrail.length} defaultOpen={false}>
            {auditTrail.length === 0 ? (
              <div style={{ padding: '40px 24px', textAlign: 'center', color: '#64748b', fontWeight: 700 }}>No audit events found for this date.</div>
            ) : (
              <table className="fr-tbl">
                <thead>
                  <tr>
                    <th className="fr-th">Action</th>
                    <th className="fr-th" style={{ textAlign: 'right' }}>Amount (ETB)</th>
                    <th className="fr-th">User</th>
                    <th className="fr-th">Branch</th>
                    <th className="fr-th">Notes</th>
                    <th className="fr-th">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {auditTrail.map((a) => (
                    <tr key={a.id} className="fr-tr">
                      <td className="fr-td"><span className="fr-badge fb-paid">{a.action}</span></td>
                      <td className="fr-td" style={{ textAlign: 'right', fontWeight: 900, color: C }}>{fmt(a.amount)}</td>
                      <td className="fr-td">{a.user_name || '—'}</td>
                      <td className="fr-td">{a.branch_name || '—'}</td>
                      <td className="fr-td" style={{ color: '#64748b', fontSize: 12 }}>{a.notes || '—'}</td>
                      <td className="fr-td" style={{ color: '#64748b', fontSize: 12 }}>{fmtDate(a.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Section>

        </div>
      )}
    </div>
  );
}
