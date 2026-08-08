import React, { useState, useEffect, useCallback, useRef } from 'react';
import apiClient from '../../services/apiClient';
import { triggerNotification } from '../../utils/ceoNotifications';
import {
  Wallet, Printer, Building2, Smartphone, Banknote,
  AlertCircle, CalendarCheck, Activity, TrendingUp,
  RefreshCcw, CheckCircle2
} from 'lucide-react';

const CEOFinancialReport = () => {
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState([]);
  const [reconciliations, setReconciliations] = useState([]);
  const printRef = useRef(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // Exact same endpoints as FinanceBankAccounts.jsx
      const [acRes, rnRes] = await Promise.all([
        apiClient.get('/finance-bank'),
        apiClient.get('/finance-bank/reconciliations'),
      ]);
      setAccounts(acRes?.data || []);
      setReconciliations(rnRes?.data || []);
      triggerNotification('Live Data Connected', 'Financial overview updated from Cashbook.');
    } catch (e) {
      console.error(e);
      triggerNotification('Error', 'Failed to load live financial data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Computed values ──────────────────────────────────────────────────────────
  // Exact same balance computation as FinanceBankAccounts: uses netBalance, Mobile Wallet type
  const cashBal     = accounts.filter(a => a.account_type === 'Cash').reduce((s, a) => s + parseFloat(a.netBalance || 0), 0);
  const bankBal     = accounts.filter(a => a.account_type === 'Bank').reduce((s, a) => s + parseFloat(a.netBalance || 0), 0);
  const telebirrBal = accounts.filter(a => a.account_type === 'Mobile Wallet').reduce((s, a) => s + parseFloat(a.netBalance || 0), 0);
  const totalBalance = cashBal + bankBal + telebirrBal;

  // Last reconciliation date (most recent completed)
  const completedRecons = reconciliations.filter(r => r.status === 'Completed');
  completedRecons.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  const lastReconDate = completedRecons.length > 0 ? completedRecons[0].created_at : null;

  // Unreconciled count
  let unreconciledCount = 0;
  accounts.forEach(acc => {
    const accRecons = reconciliations.filter(r => r.account_id === acc.id);
    if (accRecons.length === 0) { unreconciledCount++; }
    else {
      accRecons.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      if (accRecons[0].status !== 'Completed') unreconciledCount++;
    }
  });

  // ── Exact same grouping logic as FinanceBankAccounts History tab ─────────────
  const groupedReconciliations = [];
  const processedIds = new Set();
  for (let r of reconciliations) {
    if (processedIds.has(r.id)) continue;
    if (r.notes && r.notes.startsWith('GLOBAL_SUMMARY:')) {
      const groupId = r.notes.split(':')[1];
      const siblings = reconciliations.filter(x => x.notes === r.notes);
      siblings.forEach(s => processedIds.add(s.id));
      groupedReconciliations.push({
        isGlobal: true,
        groupId,
        period_from: r.period_from,
        period_to: r.period_to,
        created_at: r.created_at,
        records: siblings,
      });
    } else {
      processedIds.add(r.id);
      groupedReconciliations.push(r);
    }
  }

  // Only global ones for the CEO table (most recent 5)
  const globalGroups = groupedReconciliations
    .filter(g => g.isGlobal)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 5);

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const fmt = (num) => new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num || 0);
  const fmtD = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };
  const fmtDT = (dateStr) => {
    if (!dateStr) return 'Never';
    return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  // ── Print — exact same style as FinanceBankAccounts printHistory ─────────────
  const handlePrint = () => {
    if (!printRef.current) return;
    const content = printRef.current.innerHTML;
    const w = window.open('', '_blank');
    w.document.write(`
      <html>
        <head>
          <title>Reconciliation History — CEO View</title>
          <style>
            body { font-family: 'Inter', sans-serif; color: #0f172a; padding: 40px; margin: 0; }
            h2 { margin-top: 0; margin-bottom: 4px; font-size: 22px; font-weight: 900; }
            p.sub { margin: 0 0 20px 0; color: #64748b; font-size: 13px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 13px; }
            th, td { border: 1px solid #cbd5e1; padding: 10px; text-align: left; }
            th { background: #f8fafc; font-weight: bold; color: #475569; text-transform: uppercase; font-size: 11px; }
            .right { text-align: right; }
            .global-row td { background: #f1f5f9; font-weight: bold; border-top: 2px solid #94a3b8; color: #0f172a; font-size: 13px; }
            .diff-ok { color: #16a34a; font-weight: bold; }
            .diff-err { color: #dc2626; font-weight: bold; }
            .total-row td { background: #0f172a; color: white; font-weight: bold; }
          </style>
        </head>
        <body>
          <h2>Executive Financial Report — Reconciliation History</h2>
          <p class="sub">CEO Read-Only View · Generated ${new Date().toLocaleString()}</p>
          ${content}
        </body>
      </html>
    `);
    w.document.close();
    setTimeout(() => { w.print(); }, 250);
  };

  // Card styles
  const card = { background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', padding: 28, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' };

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", color: '#0f172a' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }} className="no-print">
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 900, margin: 0, display: 'flex', alignItems: 'center', gap: 10, letterSpacing: '-0.5px', color: '#0f172a' }}>
            <div style={{ background: '#eff6ff', color: '#3b82f6', padding: 8, borderRadius: 10 }}>
              <Activity size={22}/>
            </div>
            Executive Financial Report
          </h1>
          <p style={{ color: '#64748b', margin: '5px 0 0 0', fontSize: 13 }}>
            Live read-only access to corporate treasury and reconciliation status.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={loadData} disabled={loading} style={{ padding: '9px 18px', background: 'white', color: '#475569', border: '1px solid #cbd5e1', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
            <SegmentedSpinner size={14} /> Refresh
          </button>
          <button onClick={handlePrint} style={{ padding: '9px 18px', background: '#0f172a', color: 'white', border: 'none', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>
            <Printer size={14}/> Print Report
          </button>
        </div>
      </div>

      <style>{`.spin-icon { animation: spin 1s linear infinite; } @keyframes spin { 100% { transform: rotate(360deg); } }`}</style>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 20, marginBottom: 28 }}>

        {/* Total Balance */}
        <div style={{ ...card, gridColumn: 'span 2', borderTop: '4px solid #3b82f6' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <div style={{ background: '#eff6ff', color: '#3b82f6', padding: 7, borderRadius: 8 }}><Wallet size={18}/></div>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1 }}>Total Corporate Balance</span>
          </div>
          <div style={{ fontSize: 44, fontWeight: 900, color: '#0f172a', letterSpacing: '-1px', lineHeight: 1 }}>
            {loading ? '—' : <><span style={{ color: '#94a3b8', fontSize: 28 }}>ETB</span> {fmt(totalBalance)}</>}
          </div>
          <div style={{ marginTop: 10, display: 'flex', gap: 6, alignItems: 'center', color: '#10b981', fontSize: 12, fontWeight: 600 }}>
            <TrendingUp size={14}/> Live from connected accounts
          </div>
        </div>

        {/* Unreconciled */}
        <div style={{ ...card }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <div style={{ background: unreconciledCount > 0 ? '#fef2f2' : '#f0fdf4', color: unreconciledCount > 0 ? '#ef4444' : '#10b981', padding: 7, borderRadius: 8 }}>
              <AlertCircle size={18}/>
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1 }}>Unreconciled Accounts</span>
          </div>
          <div style={{ fontSize: 38, fontWeight: 900, color: unreconciledCount > 0 ? '#ef4444' : '#10b981', lineHeight: 1 }}>
            {loading ? '—' : unreconciledCount}
            <span style={{ fontSize: 15, color: '#94a3b8', fontWeight: 600, marginLeft: 6 }}>/ {accounts.length}</span>
          </div>
          <div style={{ marginTop: 8, fontSize: 11, color: '#64748b' }}>Accounts pending reconciliation</div>
        </div>

        {/* Last Reconciliation */}
        <div style={{ ...card }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <div style={{ background: '#faf5ff', color: '#a855f7', padding: 7, borderRadius: 8 }}><CalendarCheck size={18}/></div>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1 }}>Last Reconciliation</span>
          </div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', lineHeight: 1.3 }}>
            {loading ? '—' : lastReconDate ? fmtDT(lastReconDate) : 'No records'}
          </div>
          <div style={{ marginTop: 10, fontSize: 11, color: '#64748b' }}>Most recent completed review</div>
        </div>

      </div>

      {/* Liquidity Breakdown */}
      <h2 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 16px 0', color: '#0f172a' }}>Liquidity Breakdown</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20, marginBottom: 28 }}>

        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{ background: '#f0fdf4', color: '#10b981', padding: 8, borderRadius: 9 }}><Banknote size={18}/></div>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Cash Balance</span>
          </div>
          <div style={{ fontSize: 30, fontWeight: 900, color: '#10b981' }}>{loading ? '—' : fmt(cashBal)}</div>
          <div style={{ height: 5, background: '#f1f5f9', borderRadius: 3, marginTop: 14 }}>
            <div style={{ height: '100%', background: '#10b981', borderRadius: 3, width: `${totalBalance === 0 ? 0 : (cashBal / totalBalance) * 100}%`, transition: 'width 0.5s' }}/>
          </div>
        </div>

        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{ background: '#eff6ff', color: '#3b82f6', padding: 8, borderRadius: 9 }}><Building2 size={18}/></div>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Bank Balance</span>
          </div>
          <div style={{ fontSize: 30, fontWeight: 900, color: '#3b82f6' }}>{loading ? '—' : fmt(bankBal)}</div>
          <div style={{ height: 5, background: '#f1f5f9', borderRadius: 3, marginTop: 14 }}>
            <div style={{ height: '100%', background: '#3b82f6', borderRadius: 3, width: `${totalBalance === 0 ? 0 : (bankBal / totalBalance) * 100}%`, transition: 'width 0.5s' }}/>
          </div>
        </div>

        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{ background: '#fffbeb', color: '#f59e0b', padding: 8, borderRadius: 9 }}><Smartphone size={18}/></div>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Mobile Wallet</span>
          </div>
          <div style={{ fontSize: 30, fontWeight: 900, color: '#f59e0b' }}>{loading ? '—' : fmt(telebirrBal)}</div>
          <div style={{ height: 5, background: '#f1f5f9', borderRadius: 3, marginTop: 14 }}>
            <div style={{ height: '100%', background: '#f59e0b', borderRadius: 3, width: `${totalBalance === 0 ? 0 : (telebirrBal / totalBalance) * 100}%`, transition: 'width 0.5s' }}/>
          </div>
        </div>

      </div>

      {/* Recent Global Reconciliations — CEO view only */}
      <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <div style={{ padding: '20px 28px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: '#0f172a' }}>Recent Global Reconciliations</h2>
            <p style={{ margin: '3px 0 0 0', fontSize: 12, color: '#64748b' }}>Showing only company-wide global reconciliation summaries</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#e2e8f0', padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, color: '#64748b' }}>
            🔒 Read-Only
          </div>
        </div>

        {loading ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>Loading reconciliation data...</div>
        ) : globalGroups.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>No global reconciliations found.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e2e8f0', background: '#f8fafc' }}>
                {['Recon No', 'Account', 'Period', 'ERP Balance', 'Actual Balance', 'Difference', 'Status'].map(h => (
                  <th key={h} style={{ padding: '12px 20px', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {globalGroups.map((group) => (
                <React.Fragment key={group.groupId}>
                  {/* Global group header row */}
                  <tr style={{ background: '#f1f5f9', borderTop: '2px solid #cbd5e1' }}>
                    <td colSpan={7} style={{ padding: '10px 20px', fontWeight: 800, fontSize: 13, color: '#0f172a' }}>
                      🌐 Global Summary — {fmtD(group.period_from)} → {fmtD(group.period_to)}
                      <span style={{ marginLeft: 12, fontSize: 11, color: '#64748b', fontWeight: 600 }}>{group.records.length} accounts · {fmtDT(group.created_at)}</span>
                    </td>
                  </tr>
                  {/* Individual account rows within this global group */}
                  {group.records.map(r => (
                    <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px 20px', fontFamily: 'monospace', fontWeight: 700, color: '#0ea5e9', fontSize: 12 }}>{r.reconciliation_no}</td>
                      <td style={{ padding: '12px 20px' }}>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{r.account_name}</div>
                        <div style={{ fontSize: 11, color: '#94a3b8' }}>{r.account_type}</div>
                      </td>
                      <td style={{ padding: '12px 20px', color: '#475569' }}>{fmtD(r.period_from)} → {fmtD(r.period_to)}</td>
                      <td style={{ padding: '12px 20px', fontWeight: 700, color: '#0f172a' }}>{r.currency || 'ETB'} {fmt(r.erp_balance)}</td>
                      <td style={{ padding: '12px 20px', fontWeight: 700, color: '#0f172a' }}>{r.currency || 'ETB'} {fmt(r.actual_balance)}</td>
                      <td style={{ padding: '12px 20px', fontWeight: 800, color: parseFloat(r.difference) === 0 ? '#16a34a' : '#dc2626' }}>
                        {fmt(r.difference)}
                      </td>
                      <td style={{ padding: '12px 20px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: r.status === 'Completed' ? '#f0fdf4' : '#fffbeb', color: r.status === 'Completed' ? '#16a34a' : '#d97706', padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, border: `1px solid ${r.status === 'Completed' ? '#bbf7d0' : '#fde68a'}` }}>
                          {r.status === 'Completed' ? <CheckCircle2 size={12}/> : <Activity size={12}/>}
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {/* Totals row per group */}
                  <tr style={{ background: '#0f172a' }}>
                    <td colSpan={3} style={{ padding: '10px 20px', color: '#94a3b8', fontSize: 12, fontWeight: 700 }}>TOTAL</td>
                    <td style={{ padding: '10px 20px', color: 'white', fontWeight: 900, fontSize: 13 }}>
                      ETB {fmt(group.records.reduce((s, r) => s + parseFloat(r.erp_balance || 0), 0))}
                    </td>
                    <td style={{ padding: '10px 20px', color: 'white', fontWeight: 900, fontSize: 13 }}>
                      ETB {fmt(group.records.reduce((s, r) => s + parseFloat(r.actual_balance || 0), 0))}
                    </td>
                    <td style={{ padding: '10px 20px', fontWeight: 900, fontSize: 13, color: group.records.every(r => parseFloat(r.difference) === 0) ? '#4ade80' : '#f87171' }}>
                      {fmt(group.records.reduce((s, r) => s + parseFloat(r.difference || 0), 0))}
                    </td>
                    <td style={{ padding: '10px 20px', color: group.records.every(r => r.status === 'Completed') ? '#4ade80' : '#f87171', fontWeight: 700, fontSize: 11 }}>
                      {group.records.every(r => r.status === 'Completed') ? '✓ All Completed' : 'Incomplete'}
                    </td>
                  </tr>
                </React.Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* HIDDEN PRINT TABLE — exact same format as FinanceBankAccounts history print */}
      <div ref={printRef} style={{ display: 'none' }}>
        <table>
          <thead>
            <tr>
              <th>Recon No</th>
              <th>Account</th>
              <th>Period</th>
              <th className="right">ERP Balance</th>
              <th className="right">Actual Balance</th>
              <th className="right">Difference</th>
            </tr>
          </thead>
          <tbody>
            {groupedReconciliations.map((item) => {
              if (item.isGlobal) {
                return (
                  <React.Fragment key={item.groupId}>
                    <tr className="global-row">
                      <td colSpan="6" style={{ padding: '16px 10px', background: '#f1f5f9' }}>
                        Global Summary: {fmtD(item.period_from)} to {fmtD(item.period_to)}
                      </td>
                    </tr>
                    {item.records.map(r => (
                      <tr key={r.id}>
                        <td>{r.reconciliation_no}</td>
                        <td>{r.account_name} ({r.account_type})</td>
                        <td>{fmtD(r.period_from)} → {fmtD(r.period_to)}</td>
                        <td className="right">{fmt(r.erp_balance)}</td>
                        <td className="right">{fmt(r.actual_balance)}</td>
                        <td className={`right ${parseFloat(r.difference) === 0 ? 'diff-ok' : 'diff-err'}`}>{fmt(r.difference)}</td>
                      </tr>
                    ))}
                    <tr className="total-row">
                      <td colSpan="3">TOTAL</td>
                      <td className="right">{fmt(item.records.reduce((s, r) => s + parseFloat(r.erp_balance || 0), 0))}</td>
                      <td className="right">{fmt(item.records.reduce((s, r) => s + parseFloat(r.actual_balance || 0), 0))}</td>
                      <td className={`right ${item.records.every(r => parseFloat(r.difference) === 0) ? 'diff-ok' : 'diff-err'}`}>
                        {fmt(item.records.reduce((s, r) => s + parseFloat(r.difference || 0), 0))}
                      </td>
                    </tr>
                  </React.Fragment>
                );
              } else {
                return (
                  <tr key={item.id}>
                    <td>{item.reconciliation_no}</td>
                    <td>{item.account_name} ({item.account_type})</td>
                    <td>{fmtD(item.period_from)} → {fmtD(item.period_to)}</td>
                    <td className="right">{fmt(item.erp_balance)}</td>
                    <td className="right">{fmt(item.actual_balance)}</td>
                    <td className={`right ${parseFloat(item.difference) === 0 ? 'diff-ok' : 'diff-err'}`}>{fmt(item.difference)}</td>
                  </tr>
                );
              }
            })}
          </tbody>
        </table>
      </div>

    </div>
  );
};

export default CEOFinancialReport;
