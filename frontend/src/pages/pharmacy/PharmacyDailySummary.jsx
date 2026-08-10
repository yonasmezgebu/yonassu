import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar, RefreshCw, ShoppingCart, Building2, CreditCard,
  AlertTriangle, Package, ClipboardList, Zap, CheckCircle,
  ChevronDown, ChevronUp, TrendingUp, Users
} from 'lucide-react';
import pharmacyService from '../../services/pharmacyService';
import authService from '../../services/authService';
import SegmentedSpinner from '../../components/ui/SegmentedSpinner';

const BG  = '#D5DCF0';
const C   = '#5A6F9A';
const CD  = '#455880';
const CDX = '#2a3854';

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
  @keyframes fadeUp     { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
  @keyframes pulse      { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(.9)} }
  @keyframes spin       { to{transform:rotate(360deg)} }
  @keyframes laserSweep { 0%{left:-150%} 100%{left:150%} }
  @keyframes dsGlow {
    0%   { color:#6b83b8; filter:drop-shadow(0 0 6px rgba(107,131,184,.6)); transform:scale(1); }
    50%  { color:#4fa3c3; filter:drop-shadow(0 0 14px rgba(79,163,195,1)); transform:scale(1.25) rotate(-8deg); }
    100% { color:#6b83b8; filter:drop-shadow(0 0 6px rgba(107,131,184,.6)); transform:scale(1); }
  }
  .ds-glow { animation: dsGlow 2.5s infinite ease-in-out; }

  .ds-page { min-height:calc(100vh - 64px); font-family:'Inter','Segoe UI',sans-serif; padding-bottom:48px; }

  .ds-card {
    --hc:${C}; position:relative; overflow:hidden;
    background:white; border-radius:0;
    box-shadow:0 4px 20px rgba(0,30,80,.10);
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
  .ds-card:hover {
    background-size:100% 4px,4px 100%,100% 4px,4px 100%;
    box-shadow:0 8px 32px rgba(0,30,80,.18);
    transform:translateY(-2px);
  }
  .ds-card::after {
    content:''; position:absolute; top:0; left:-150%; width:100%; height:100%;
    background:linear-gradient(90deg,transparent 0%,rgba(0,200,255,0.2) 30%,rgba(100,160,255,0.2) 60%,transparent 100%);
    transform:skewX(-25deg); pointer-events:none; z-index:2;
  }
  .ds-card:hover::after { animation:laserSweep .8s ease-out forwards; }

  .ds-chip {
    --hc:${C}; position:relative; overflow:hidden;
    background:white; border-radius:0; padding:20px;
    box-shadow:0 4px 20px rgba(0,30,80,.10);
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
  .ds-chip:hover {
    background-size:100% 4px,4px 100%,100% 4px,4px 100%;
    box-shadow:0 8px 32px rgba(0,30,80,.18);
    transform:translateY(-3px);
  }

  .ds-head {
    padding:14px 22px;
    background:linear-gradient(135deg,${C},${CD});
    color:white; display:flex; align-items:center; gap:12px;
    box-shadow:inset 0 -3px 0 rgba(0,0,0,.18);
  }
  .ds-head span { font-size:13px; font-weight:900; letter-spacing:.07em; text-transform:uppercase; }

  .ds-title {
    font-size:2.4rem; font-weight:900; color:#0d1a30; letter-spacing:-.02em;
    text-shadow:1px 1px 0 #fff,2px 2px 0 #fff,3px 3px 0 ${C}44,4px 4px 0 ${CD}33,5px 5px 8px rgba(0,0,0,.15);
    margin:0; display:flex; align-items:center; gap:12px; line-height:1.1;
  }
  .ds-sub { font-size:.82rem; color:${C}; font-weight:800; text-transform:uppercase; letter-spacing:.14em; }

  .ds-tbl { width:100%; border-collapse:collapse; font-size:13.5px; }
  .ds-th  { text-align:left; padding:11px 14px;
    background:linear-gradient(135deg,rgba(90,111,154,.12),rgba(69,88,128,.07));
    border-bottom:3px solid ${C}; color:${CD}; font-weight:900;
    text-transform:uppercase; letter-spacing:.06em; font-size:10.5px; }
  .ds-td  { padding:12px 14px; border-bottom:1px solid rgba(90,111,154,.09); color:#2d3748; font-weight:600; vertical-align:middle; }
  .ds-tr:hover .ds-td { background:rgba(90,111,154,.05); }

  .ds-badge {
    padding:5px 12px; border-radius:99px; font-weight:900; font-size:10.5px;
    text-transform:uppercase; letter-spacing:.05em; display:inline-flex; align-items:center; gap:5px;
    box-shadow:0 2px 0 rgba(0,0,0,.08),inset 0 1px 0 rgba(255,255,255,.6); white-space:nowrap;
  }
  .db-approved  { background:linear-gradient(135deg,#f0fdf4,#dcfce7); color:#065f46; border:1px solid #6ee7b7; }
  .db-pending   { background:linear-gradient(135deg,#fffbeb,#fef3c7); color:#92400e; border:1px solid #fde68a; }
  .db-overdue   { background:linear-gradient(135deg,#fef2f2,#fee2e2); color:#991b1b; border:1px solid #fca5a5; }
  .db-default   { background:rgba(90,111,154,.1); color:${CD}; border:1px solid rgba(90,111,154,.25); }

  .ds-btn {
    display:inline-flex; align-items:center; gap:6px;
    padding:8px 18px; font-weight:900; font-size:12px; cursor:pointer;
    letter-spacing:.07em; text-transform:uppercase; border-radius:8px;
    transition:all .12s; font-family:'Inter',sans-serif;
    box-shadow:0 4px 0 ${CD},0 6px 12px rgba(69,88,128,.18),inset 0 1px 0 rgba(255,255,255,.25);
    background:linear-gradient(135deg,#fff,${BG}); color:${CD}; border:2px solid ${C};
  }
  .ds-btn:active  { transform:translateY(4px); box-shadow:none; }
  .ds-btn:disabled { opacity:.55; cursor:not-allowed; }

  .ro-banner {
    background:linear-gradient(135deg,#fffbeb,#fef3c7);
    border:2px solid #fde68a; padding:14px 20px;
    display:flex; align-items:center; gap:12px;
    margin:0 32px 20px; animation:fadeUp .4s ease;
  }
`;

const fmt    = (v) => parseFloat(v || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtInt = (v) => Number(v || 0).toLocaleString();
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const fmtTime = (d) => d ? new Date(d).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '—';

const PAY_COLORS = { CASH: '#10b981', BANK_TRANSFER: '#3b82f6', TELEBIRR: '#8b5cf6', CBE: '#f59e0b', AWASH: '#ef4444', CREDIT: '#6366f1' };

function Section({ icon: Icon, title, count, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="ds-card">
      <div className="ds-head" style={{ justifyContent: 'space-between', cursor: 'pointer' }} onClick={() => setOpen(p => !p)}>
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

export default function PharmacyDailySummary() {
  const today = new Date().toISOString().split('T')[0];
  const [date, setDate]       = useState(today);
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);

  const user    = authService.getCurrentUser();
  const roles   = (user?.roles || []).map(r => r.toLowerCase());
  const isManager = roles.includes('pharmacy manager') || roles.includes('admin');
  const isCEO     = roles.includes('ceo');
  const isFinance = roles.includes('finance') || roles.includes('finance manager');
  // Read-only: CEO & Finance get summary only
  const showDeepData = isManager; // only manager sees individual sales & tasks

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await pharmacyService.getManagerDailySummary({ date });
      setData(res?.data || res);
    } catch (e) {
      console.error(e);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => { load(); }, [load]);

  const totals          = data?.totals || {};
  const branchTotals    = data?.branchTotals || [];
  const paymentTotals   = data?.paymentTotals || [];
  const individualSales = data?.individualSales || [];
  const alerts          = data?.inventoryAlerts || {};
  const tasks           = data?.tasks || [];
  const salesReport     = data?.salesReport;

  const pendingTasks  = tasks.filter(t => t.status === 'PENDING').length;
  const overdueTasks  = tasks.filter(t => t.status === 'OVERDUE').length;

  const totalPaymentsAmt = paymentTotals.reduce((s, p) => s + parseFloat(p.total_amount || 0), 0);

  return (
    <div className="ds-page">
      <style>{CSS}</style>

      {/* HEADER */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', padding: '28px 32px 22px', animation: 'fadeUp .35s ease' }}>
        <div>
          <h1 className="ds-title">
            Daily Summary.
            <Calendar className="ds-glow" size={34} />
          </h1>
        </div>
        <div style={{ justifySelf: 'center' }}>
          <p className="ds-sub">Operations Snapshot · {date}</p>
        </div>
        <div style={{ justifySelf: 'end', display: 'flex', gap: 10, alignItems: 'center' }}>
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            style={{ padding: '9px 13px', border: `2px solid ${C}`, background: 'white', fontWeight: 800, color: '#0d1a30', outline: 'none', fontFamily: 'Inter', fontSize: 13, boxShadow: `0 4px 0 ${CD}`, borderRadius: 0 }}
          />
          <button onClick={load} disabled={loading} className="ds-btn">
            <SegmentedSpinner size={14} /> Refresh
          </button>
        </div>
      </div>

      {/* CEO / Finance read-only banner */}
      {!isManager && (
        <div className="ro-banner">
          <AlertTriangle size={20} color="#d97706" />
          <div>
            <strong style={{ color: '#92400e', fontSize: 13 }}>
              {isCEO ? 'CEO Read-Only View' : 'Finance Read-Only View'}
            </strong>
            <p style={{ margin: '2px 0 0', color: '#b45309', fontSize: 12, fontWeight: 600 }}>
              {isCEO
                ? 'You see totals and branch breakdown. Individual sales are visible to the Pharmacy Manager only.'
                : 'You see totals and payment breakdown. Individual sales are visible to the Pharmacy Manager only.'}
            </p>
          </div>
        </div>
      )}

      {/* Report status banner */}
      {salesReport && (
        <div style={{ margin: '0 32px 16px', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 12, animation: 'fadeUp .4s ease',
          background: salesReport.status === 'APPROVED' ? 'linear-gradient(135deg,#f0fdf4,#dcfce7)' : 'linear-gradient(135deg,#fffbeb,#fef3c7)',
          border: `2px solid ${salesReport.status === 'APPROVED' ? '#6ee7b7' : '#fde68a'}` }}>
          {salesReport.status === 'APPROVED' ? <CheckCircle size={20} color="#059669" /> : <AlertTriangle size={20} color="#d97706" />}
          <div>
            <strong style={{ fontSize: 13, color: salesReport.status === 'APPROVED' ? '#065f46' : '#92400e' }}>
              Sales Report: {salesReport.status}
            </strong>
            <span style={{ fontSize: 12, marginLeft: 12, color: '#64748b' }}>Report ID #{salesReport.id} for {date}</span>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ padding: '80px 0', textAlign: 'center' }}>
          <Zap size={48} color={C} style={{ animation: 'pulse 1.5s ease-in-out infinite', margin: '0 auto 14px', display: 'block' }} />
          <div style={{ fontWeight: 800, color: '#0d1a30', fontSize: 18 }}>Loading Daily Summary…</div>
        </div>
      ) : (
        <div style={{ padding: '0 32px', display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* ── TOP STAT CHIPS ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
            {[
              { label: 'Total Sales (Transactions)', val: fmtInt(totals.total_sales),          icon: <ShoppingCart size={24} />, color: C },
              { label: 'Total Amount',               val: `${fmt(totals.total_amount)} ETB`,   icon: <TrendingUp size={24} />,   color: '#059669' },
              { label: 'Total Products Sold',        val: fmtInt(totals.total_products_sold),  icon: <Package size={24} />,      color: '#7c3aed' },
            ].map((s, i) => (
              <div key={i} className="ds-chip" style={{ animationDelay: `${i * 0.07}s` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.08em', color: '#64748b' }}>{s.label}</div>
                  <div style={{ color: s.color, opacity: .7 }}>{s.icon}</div>
                </div>
                <div style={{ fontSize: typeof s.val === 'string' ? 20 : 30, fontWeight: 900, color: s.color, lineHeight: 1.2 }}>{s.val}</div>
              </div>
            ))}
          </div>

          {/* ── INVENTORY ALERTS ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
            {[
              { label: 'Low Stock Items',    val: alerts.low_stock   || 0, color: '#d97706', icon: <AlertTriangle size={22} /> },
              { label: 'Out of Stock Items', val: alerts.out_of_stock || 0, color: '#dc2626', icon: <Package size={22} /> },
              { label: 'Expired Items',      val: alerts.expired      || 0, color: '#9f1239', icon: <AlertTriangle size={22} /> },
            ].map((a, i) => (
              <div key={i} className="ds-chip" style={{ animationDelay: `${(i + 3) * 0.07}s`, borderTop: `4px solid ${a.color}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.08em', color: '#64748b' }}>{a.label}</div>
                  <div style={{ color: a.color, opacity: .75 }}>{a.icon}</div>
                </div>
                <div style={{ fontSize: 30, fontWeight: 900, color: a.val > 0 ? a.color : '#94a3b8' }}>{a.val}</div>
                {a.val > 0 && <div style={{ fontSize: 11, fontWeight: 700, color: a.color, marginTop: 4 }}>⚠ Needs attention</div>}
              </div>
            ))}
          </div>

          {/* ── BRANCH BREAKDOWN — visible to all roles ── */}
          <Section icon={Building2} title="Per-Branch Totals" count={branchTotals.length}>
            {branchTotals.length === 0 ? (
              <div style={{ padding: '40px 24px', textAlign: 'center', color: '#64748b', fontWeight: 700 }}>No branch data found for this date.</div>
            ) : (
              <table className="ds-tbl">
                <thead>
                  <tr>
                    <th className="ds-th">Branch</th>
                    <th className="ds-th" style={{ textAlign: 'right' }}>Total Sales</th>
                    <th className="ds-th" style={{ textAlign: 'right' }}>Total Amount (ETB)</th>
                    <th className="ds-th" style={{ textAlign: 'right' }}>Worker Count</th>
                  </tr>
                </thead>
                <tbody>
                  {branchTotals.map((b) => (
                    <tr key={b.id} className="ds-tr">
                      <td className="ds-td" style={{ fontWeight: 800, color: CD }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 32, height: 32, borderRadius: '50%', background: `linear-gradient(135deg,${C},${CD})`, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900, flexShrink: 0 }}>
                            {(b.branch_name || 'B')[0]}
                          </div>
                          {b.branch_name}
                        </div>
                      </td>
                      <td className="ds-td" style={{ textAlign: 'right', fontWeight: 800 }}>{fmtInt(b.total_sales)}</td>
                      <td className="ds-td" style={{ textAlign: 'right', fontWeight: 900, color: C }}>{fmt(b.total_amount)}</td>
                      <td className="ds-td" style={{ textAlign: 'right' }}>
                        <span className="ds-badge db-default"><Users size={12} />{b.worker_count || 0}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Section>

          {/* ── PAYMENT TYPE BREAKDOWN — visible to all ── */}
          <Section icon={CreditCard} title="Per-Payment-Type Breakdown" count={paymentTotals.length}>
            {paymentTotals.length === 0 ? (
              <div style={{ padding: '40px 24px', textAlign: 'center', color: '#64748b', fontWeight: 700 }}>No payment breakdown data for this date.</div>
            ) : (
              <table className="ds-tbl">
                <thead>
                  <tr>
                    <th className="ds-th">Payment Type</th>
                    <th className="ds-th" style={{ textAlign: 'right' }}>Count</th>
                    <th className="ds-th" style={{ textAlign: 'right' }}>Total Amount (ETB)</th>
                    <th className="ds-th" style={{ textAlign: 'right' }}>Share</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentTotals.map((p, i) => {
                    const pct = totalPaymentsAmt > 0 ? ((parseFloat(p.total_amount || 0) / totalPaymentsAmt) * 100).toFixed(1) : 0;
                    const color = PAY_COLORS[p.payment_type?.toUpperCase()] || C;
                    return (
                      <tr key={i} className="ds-tr">
                        <td className="ds-td">
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 11, height: 11, borderRadius: '50%', background: color, boxShadow: `0 2px 6px ${color}88` }} />
                            <strong style={{ textTransform: 'uppercase', color: '#0d1a30' }}>{p.payment_type || '—'}</strong>
                          </div>
                        </td>
                        <td className="ds-td" style={{ textAlign: 'right', fontWeight: 800 }}>{fmtInt(p.count)}</td>
                        <td className="ds-td" style={{ textAlign: 'right', fontWeight: 900, color: C }}>{fmt(p.total_amount)}</td>
                        <td className="ds-td" style={{ textAlign: 'right' }}>
                          <span className="ds-badge db-default">{pct}%</span>
                        </td>
                      </tr>
                    );
                  })}
                  <tr style={{ background: 'rgba(90,111,154,.05)' }}>
                    <td className="ds-td" style={{ fontWeight: 900, color: CD }}>TOTAL</td>
                    <td className="ds-td" style={{ textAlign: 'right', fontWeight: 900 }}>{fmtInt(paymentTotals.reduce((s, p) => s + Number(p.count || 0), 0))}</td>
                    <td className="ds-td" style={{ textAlign: 'right', fontWeight: 900, color: C }}>{fmt(totalPaymentsAmt)}</td>
                    <td className="ds-td" style={{ textAlign: 'right' }}><span className="ds-badge db-default">100%</span></td>
                  </tr>
                </tbody>
              </table>
            )}
          </Section>

          {/* ── INDIVIDUAL SALES — Manager only ── */}
          {showDeepData && (
            <Section icon={ShoppingCart} title={`All Transactions — ${date}`} count={individualSales.length} defaultOpen={false}>
              {individualSales.length === 0 ? (
                <div style={{ padding: '40px 24px', textAlign: 'center', color: '#64748b', fontWeight: 700 }}>No sales transactions for this date.</div>
              ) : (
                <div style={{ maxHeight: 420, overflowY: 'auto' }}>
                  <table className="ds-tbl">
                    <thead>
                      <tr>
                        <th className="ds-th">Receipt No.</th>
                        <th className="ds-th">Worker</th>
                        <th className="ds-th">Branch</th>
                        <th className="ds-th">Type</th>
                        <th className="ds-th" style={{ textAlign: 'right' }}>Products</th>
                        <th className="ds-th" style={{ textAlign: 'right' }}>Amount (ETB)</th>
                        <th className="ds-th">Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {individualSales.map((s) => (
                        <tr key={s.id} className="ds-tr">
                          <td className="ds-td">
                            <code style={{ background: 'rgba(90,111,154,.1)', padding: '3px 8px', fontSize: 12, fontWeight: 900, color: CD }}>
                              {s.receipt_no || `#${s.id}`}
                            </code>
                          </td>
                          <td className="ds-td">{s.worker_name || '—'}</td>
                          <td className="ds-td">{s.branch_name || '—'}</td>
                          <td className="ds-td">
                            <span className="ds-badge db-default">{s.sale_type || 'WALK-IN'}</span>
                          </td>
                          <td className="ds-td" style={{ textAlign: 'right', fontWeight: 800 }}>{s.total_products || 0}</td>
                          <td className="ds-td" style={{ textAlign: 'right', fontWeight: 900, color: C }}>{fmt(s.total_amount)}</td>
                          <td className="ds-td" style={{ color: '#64748b', fontSize: 12 }}>{fmtTime(s.created_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Section>
          )}

          {/* ── TASKS — Manager & CEO can see, Finance cannot ── */}
          {(isManager || isCEO) && (
            <Section icon={ClipboardList} title="Pending & Overdue Tasks" count={tasks.length} defaultOpen={tasks.length > 0}>
              {tasks.length === 0 ? (
                <div style={{ padding: '40px 24px', textAlign: 'center', color: '#64748b', fontWeight: 700 }}>No pending or overdue tasks.</div>
              ) : (
                <>
                  {/* Summary */}
                  <div style={{ padding: '14px 22px', display: 'flex', gap: 24, borderBottom: `1px solid rgba(90,111,154,.1)` }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span className="ds-badge db-pending">Pending: {pendingTasks}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span className="ds-badge db-overdue">Overdue: {overdueTasks}</span>
                    </div>
                  </div>
                  <table className="ds-tbl">
                    <thead>
                      <tr>
                        <th className="ds-th">Task</th>
                        <th className="ds-th">Branch</th>
                        <th className="ds-th">Priority</th>
                        <th className="ds-th">Status</th>
                        <th className="ds-th">Due Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tasks.map((t) => {
                        const priorityColor = t.priority === 'HIGH' ? '#dc2626' : t.priority === 'MEDIUM' ? '#d97706' : C;
                        return (
                          <tr key={t.id} className="ds-tr">
                            <td className="ds-td" style={{ fontWeight: 700 }}>{t.title || '—'}</td>
                            <td className="ds-td">{t.branch_name || '—'}</td>
                            <td className="ds-td">
                              <span style={{ background: `${priorityColor}18`, color: priorityColor, border: `1px solid ${priorityColor}44`, padding: '4px 10px', borderRadius: 99, fontSize: 11, fontWeight: 900, textTransform: 'uppercase' }}>
                                {t.priority || '—'}
                              </span>
                            </td>
                            <td className="ds-td">
                              <span className={`ds-badge ${t.status === 'OVERDUE' ? 'db-overdue' : 'db-pending'}`}>
                                {t.status}
                              </span>
                            </td>
                            <td className="ds-td" style={{ color: t.status === 'OVERDUE' ? '#dc2626' : '#64748b', fontWeight: t.status === 'OVERDUE' ? 800 : 600, fontSize: 13 }}>
                              {fmtDate(t.due_date)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </>
              )}
            </Section>
          )}

        </div>
      )}
    </div>
  );
}
