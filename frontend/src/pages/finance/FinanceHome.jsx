import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/apiClient';
import SegmentedSpinner from '../../components/ui/SegmentedSpinner';
import styles from './FinanceHome.module.css';

/* ─── Color Palette (semantic enterprise tokens) ────────────────────────── */
const G = {
  forest: '#059669', dark: '#111827', emerald: '#059669', leaf: '#10B981',
  sage: '#A7F3D0', olive: '#6B7280', lime: '#84CC16', brown: '#92400E',
  sky: '#0891B2', white: '#FFFFFF', light: '#F9FAFB', darkGray: '#374151',
  orange: '#D97706', red: '#DC2626', purple: '#7C3AED', blue: '#2563EB'
};

const COLORS_ARR = [G.forest, G.orange, G.sky, G.purple, G.emerald, G.brown, G.blue];

const fmt = (n) => 'ETB ' + Number(n || 0).toLocaleString('en-ET', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtShort = (n) => {
  const v = Number(n || 0);
  if (v >= 1000000) return 'ETB ' + (v / 1000000).toFixed(1) + 'M';
  if (v >= 1000) return 'ETB ' + (v / 1000).toFixed(1) + 'K';
  return 'ETB ' + v.toFixed(2);
};

const CategoryBar = ({ value, max, color }) => (
  <div className={styles.catBar}>
    <div
      className={styles.catBarFill}
      style={{
        background: color,
        width: `${max > 0 ? Math.min(100, (value / max) * 100) : 0}%`
      }}
    />
  </div>
);


const FinanceHome = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  /* ── Raw data from the same endpoints the real pages use ── */
  const [cashbook, setCashbook]   = useState([]);   // /finance-cash/cashbook → entries with receipts/payments/balance
  const [crvs,     setCrvs]       = useState([]);   // /finance-cash/crv
  const [pvs,      setPvs]        = useState([]);   // /finance-cash/pv
  const [pcvs,     setPcvs]       = useState([]);   // /finance-cash/pcv
  const [banks,    setBanks]      = useState([]);   // /finance-bank
  const [bankSummary, setBankSummary] = useState(null); // /finance-bank/cashbook/summary
  const [recons,   setRecons]     = useState([]);   // /finance-bank/reconciliations
  const [receivables, setReceivables] = useState([]); // /finance-receivables/book

  const [refreshing, setRefreshing] = useState(false);
  const [timeString, setTimeString] = useState('');

  useEffect(() => {
    const updateTime = () => setTimeString(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const [cbRes, crvRes, pvRes, pcvRes, bankRes, bankSumRes, reconRes, rcvRes] = await Promise.allSettled([
        api.get('/finance-cash/cashbook'),
        api.get('/finance-cash/crv'),
        api.get('/finance-cash/pv'),
        api.get('/finance-cash/pcv'),
        api.get('/finance-bank'),
        api.get('/finance-bank/cashbook/summary'),
        api.get('/finance-bank/reconciliations'),
        api.get('/finance-receivables/book'),
      ]);
      if (cbRes.status === 'fulfilled')      setCashbook(cbRes.value?.data || []);
      if (crvRes.status === 'fulfilled')     setCrvs(crvRes.value?.data || []);
      if (pvRes.status === 'fulfilled')      setPvs(pvRes.value?.data || []);
      if (pcvRes.status === 'fulfilled')     setPcvs(pcvRes.value?.data || []);
      if (bankRes.status === 'fulfilled')    setBanks(bankRes.value?.data || []);
      if (bankSumRes.status === 'fulfilled') setBankSummary(bankSumRes.value?.data || null);
      if (reconRes.status === 'fulfilled')   setRecons(reconRes.value?.data || []);
      if (rcvRes.status === 'fulfilled')     setReceivables(rcvRes.value?.data || []);
    } catch (err) {
      console.error('Finance dashboard load error:', err);
    }
    setRefreshing(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const nav = (path) => { navigate(path); };

  /* ── Derived values — same arithmetic the real pages use ── */
  const cbEntries   = Array.isArray(cashbook) ? cashbook : [];
  const crvList     = Array.isArray(crvs)     ? crvs     : [];
  const pvList      = Array.isArray(pvs)      ? pvs      : [];
  const pcvList     = Array.isArray(pcvs)     ? pcvs     : [];
  const rcvList     = Array.isArray(receivables) ? receivables : [];
  const bankList    = Array.isArray(banks)    ? banks    : [];
  const reconList   = Array.isArray(recons)   ? recons   : [];

  // Cash Book: sum receipts and payments from the ledger
  const totalReceipts  = cbEntries.reduce((s, e) => s + parseFloat(e.receipts || 0), 0);
  const totalPayments  = cbEntries.reduce((s, e) => s + parseFloat(e.payments || 0), 0);
  const cashBalance    = totalReceipts - totalPayments;

  // CRV — total income received
  const crvTotal = crvList.reduce((s, c) => s + parseFloat(c.amount || 0), 0);

  // PV — total payments made
  const pvTotal  = pvList.reduce((s, p) => s + parseFloat(p.amount || 0), 0);

  // PCV — petty cash
  const pcvTotal = pcvList.reduce((s, p) => s + parseFloat(p.amount || 0), 0);

  // Bank — total balance across all accounts
  const bankBalance = bankSummary
    ? parseFloat(bankSummary.total_balance || bankSummary.balance || 0)
    : bankList.reduce((s, b) => s + parseFloat(b.balance || b.current_balance || 0), 0);

  // Receivables — outstanding amounts
  const totalReceivable    = rcvList.reduce((s, r) => s + parseFloat(r.total_amount || r.amount || 0), 0);
  const settledReceivable  = rcvList.reduce((s, r) => s + parseFloat(r.paid_amount  || r.settled || 0), 0);
  const outstandingBalance = totalReceivable - settledReceivable;

  // Reconciliations — unreconciled count
  const unreconCount = reconList.filter(r => r.status !== 'reconciled' && r.status !== 'completed').length;

  const firstName = user?.fullName?.split(' ')[0] || user?.name?.split(' ')[0] || 'Manager';

  // Recent 6 cashbook entries (most recent first)
  const recentCB = [...cbEntries].reverse().slice(0, 6);

  // Transaction type breakdown for the breakdown card
  const txBreakdown = [
    { name: 'Cash Receipts (CRV)', count: crvList.length, amount: crvTotal, color: G.forest },
    { name: 'Payments (PV)',        count: pvList.length,  amount: pvTotal,  color: G.orange },
    { name: 'Petty Cash (PCV)',     count: pcvList.length, amount: pcvTotal, color: G.purple },
  ].filter(b => b.count > 0);
  const maxBreakdownAmt = Math.max(...txBreakdown.map(b => b.amount), 1);

  return (
    <div className={styles.page}>
      {/* ── HEADER ── */}
      <div className={styles.header}>
        <div className={styles.titleBlock}>
          <h1 className={styles.pageTitle}>
            Welcome! <span className={styles.welcomeEmoji}>🌿</span>
          </h1>
          <p className={styles.pageSubtitle}>
            Finance Command Center · It's {timeString}
          </p>
        </div>
        <button onClick={load} className={styles.syncBtn} disabled={refreshing}>
          {refreshing && <SegmentedSpinner size={16} />}
          <span>Sync</span>
        </button>
      </div>

      {/* ── ROW 1: 4 KPI HERO CARDS ── */}
      <div className={styles.kpiGrid}>

        {/* Cash Balance Hero */}
        <div className={`${styles.kpiCard} ${styles.kpiCardHero}`} onClick={() => nav('/finance/cash-book')}>
          <div className={styles.kpiTop}>
            <span className={styles.kpiLabel}>Cash Book Balance</span>
            <span className={styles.kpiIconHero}>📓</span>
          </div>
          <div className={styles.kpiHeroValue}>{fmtShort(cashBalance)}</div>
          <div className={styles.kpiHeroMeta}>
            <span>In: {fmtShort(totalReceipts)}</span>
            <span>Out: {fmtShort(totalPayments)}</span>
          </div>
          <div className={styles.kpiHeroFoot}>
            Hello, {firstName} — {cbEntries.length} ledger entries
          </div>
        </div>

        {/* Total CRV Income */}
        <div className={styles.kpiCard} onClick={() => nav('/finance/crv')}>
          <div className={styles.kpiTop}>
            <span className={styles.kpiLabel}>CRV Income</span>
            <span className={styles.kpiIcon} style={{ background: 'var(--color-success-bg)' }}>📥</span>
          </div>
          <div className={styles.kpiValue} style={{ color: G.forest }}>{fmtShort(crvTotal)}</div>
          <div className={styles.kpiMeta}>{crvList.length} receipts</div>
          <div className={styles.kpiSub}>Cash received</div>
        </div>

        {/* Total PV Payments */}
        <div className={styles.kpiCard} onClick={() => nav('/finance/pv')}>
          <div className={styles.kpiTop}>
            <span className={styles.kpiLabel}>PV Payments</span>
            <span className={styles.kpiIcon} style={{ background: 'var(--color-warning-bg)' }}>📤</span>
          </div>
          <div className={styles.kpiValue} style={{ color: G.orange }}>{fmtShort(pvTotal)}</div>
          <div className={styles.kpiMeta}>{pvList.length} vouchers</div>
          <div className={styles.kpiSub}>Cash paid out</div>
        </div>

        {/* Bank Balance */}
        <div className={styles.kpiCard} onClick={() => nav('/finance/bank-accounts')}>
          <div className={styles.kpiTop}>
            <span className={styles.kpiLabel}>Bank Balance</span>
            <span className={styles.kpiIcon} style={{ background: 'var(--color-info-bg)' }}>🏦</span>
          </div>
          <div className={styles.kpiValue} style={{ color: G.blue }}>{fmtShort(bankBalance)}</div>
          <div className={styles.kpiMeta}>{bankList.length} account{bankList.length !== 1 ? 's' : ''}</div>
          <div className={styles.kpiSub}>All bank accounts</div>
        </div>
      </div>

      {/* ── ROW 2: TRANSACTION BREAKDOWN + RECENT CASH LEDGER ── */}
      <div className={styles.grid2}>

        {/* Transaction Type Breakdown */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardTitleIcon}>📊</span>
            <h3 className={styles.cardTitle}>Transaction Breakdown</h3>
            <span className={styles.cardSub}>Cash Book summary</span>
          </div>

          {/* Sub-KPIs row */}
          <div className={styles.miniGrid}>
            {[
              { label: 'CB Entries',    val: cbEntries.length,  icon: '📓', c: G.forest },
              { label: 'Receivables',   val: rcvList.length,    icon: '📋', c: G.orange },
              { label: 'Unrecon.',      val: unreconCount,      icon: '⚖️', c: unreconCount > 0 ? G.red : G.emerald },
              { label: 'Petty Cash',    val: pcvList.length,    icon: '💰', c: G.purple },
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

          {/* Header row */}
          <div className={styles.listHeader}>
            <span>Document Type</span>
            <span />
            <span style={{ textAlign: 'right' }}>Amount (ETB)</span>
          </div>

          {txBreakdown.length === 0 ? (
            <div className={styles.empty}>No transaction data yet — connect to backend</div>
          ) : txBreakdown.map((row) => (
            <div key={row.name} className={styles.breakdownRow} onClick={() => nav('/finance/cash-book')}>
              <div className={styles.catNameWrap}>
                <span className={styles.dot} style={{ background: row.color }} />
                <span className={styles.catName}>{row.name}</span>
              </div>
              <CategoryBar value={row.amount} max={maxBreakdownAmt} color={row.color} />
              <span className={styles.catAmount} style={{ color: row.color }}>{fmtShort(row.amount)}</span>
            </div>
          ))}
        </div>

        {/* Recent Cash Book Entries */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardTitleIcon}>📜</span>
            <h3 className={styles.cardTitle}>Recent Ledger Entries</h3>
          </div>
          {recentCB.length === 0 ? (
            <div className={styles.empty}>
              <span style={{ fontSize: 28, opacity: 0.4 }}>📉</span><br />No entries yet
            </div>
          ) : (
            <div className={styles.ledgerList}>
              {recentCB.map((entry, i) => {
                const isReceipt = parseFloat(entry.receipts || 0) > 0;
                const c   = isReceipt ? G.forest : G.orange;
                const icon = isReceipt ? '📥' : '📤';
                const amt  = isReceipt ? entry.receipts : entry.payments;
                return (
                  <div key={entry.id || i} className={styles.ledgerRow} onClick={() => nav('/finance/cash-book')}>
                    <span className={styles.ledgerIcon} style={{ background: isReceipt ? 'var(--color-success-bg)' : 'var(--color-warning-bg)' }}>{icon}</span>
                    <div className={styles.ledgerMain}>
                      <div className={styles.ledgerTitle}>
                        {entry.reference && <span className={styles.ledgerRef}>{entry.reference}</span>}
                        {entry.description || entry.type || 'Entry'}
                      </div>
                      <div className={styles.ledgerDate}>{entry.date ? new Date(entry.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : ''}</div>
                    </div>
                    <span className={styles.ledgerAmount} style={{ color: c }}>
                      {fmtShort(amt)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── ROW 3: RECEIVABLES + BANK RECONCILIATION + QUICK ACTIONS ── */}
      <div className={styles.grid3}>

        {/* Receivables Summary */}
        <div className={styles.card}>
          <h3 className={styles.cardTitleNoIcon}>📋 Receivable Book</h3>
          <div className={styles.cardLabel}>Outstanding Balances</div>
          <div className={styles.summaryList}>
            {[
              { label: 'Total Invoiced',   val: fmt(totalReceivable),    icon: '📄', bg: 'var(--color-info-bg)', c: G.blue,    path: '/finance/outstanding-ar' },
              { label: 'Amount Settled',   val: fmt(settledReceivable),  icon: '✅', bg: 'var(--color-success-bg)', c: G.forest,  path: '/finance/outstanding-ar' },
              { label: 'Outstanding',      val: fmt(outstandingBalance), icon: '⏳', bg: outstandingBalance > 0 ? 'var(--color-danger-bg)' : 'var(--color-success-bg)', c: outstandingBalance > 0 ? G.red : G.forest, path: '/finance/outstanding-ar' },
            ].map(row => (
              <div key={row.label} className={styles.summaryRow} onClick={() => nav(row.path)}>
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

        {/* Bank Reconciliation */}
        <div className={styles.card}>
          <h3 className={styles.cardTitleNoIcon}>⚖️ Bank Reconciliation</h3>
          <div className={styles.cardLabel}>Accounts Status</div>
          <div className={styles.summaryList}>
            {[
              { label: 'Bank Accounts',    val: `${bankList.length} accounts`,      icon: '🏦', bg: 'var(--color-info-bg)', c: G.blue,   path: '/finance/bank-accounts' },
              { label: 'Bank Balance',     val: fmtShort(bankBalance),              icon: '💳', bg: 'var(--color-success-bg)', c: G.forest, path: '/finance/bank-accounts' },
              { label: 'Unreconciled',     val: `${unreconCount} pending`,          icon: unreconCount > 0 ? '⚠️' : '✅', bg: unreconCount > 0 ? 'var(--color-danger-bg)' : 'var(--color-success-bg)', c: unreconCount > 0 ? G.red : G.forest, path: '/finance/bank-accounts' },
            ].map(row => (
              <div key={row.label} className={styles.summaryRow} onClick={() => nav(row.path)}>
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

        {/* Quick Actions */}
        <div className={styles.card}>
          <h3 className={styles.cardTitleNoIcon}>⚡ Quick Operations</h3>
          <div className={styles.qaGrid}>
            {[
              { label: 'CRV',         sub: 'Receipts',  icon: '💵', bg: 'var(--color-success-bg)', color: G.forest,  href: '/finance/crv' },
              { label: 'PV',          sub: 'Payments',  icon: '💸', bg: 'var(--color-warning-bg)', color: G.orange,  href: '/finance/pv' },
              { label: 'PCV',         sub: 'Petty Cash',icon: '💰', bg: 'var(--color-warning-bg)', color: G.orange,  href: '/finance/pcv' },
              { label: 'Cash Book',   sub: 'Ledger',    icon: '📓', bg: 'var(--color-info-bg)',    color: G.blue,    href: '/finance/cash-book' },
              { label: 'Bank',        sub: 'Accounts',  icon: '🏦', bg: 'var(--color-info-bg)',    color: G.blue,    href: '/finance/bank-accounts' },
              { label: 'Receivables', sub: 'Book',      icon: '📋', bg: '#F3E5F5',                 color: G.purple,  href: '/finance/outstanding-ar' },
              { label: 'P&L',         sub: 'Report',    icon: '📈', bg: 'var(--color-info-bg)',    color: G.sky,     href: '/finance/profit-loss' },
              { label: 'Reports',     sub: 'Hub',       icon: '📊', bg: '#F3F4F6',                 color: G.brown,   href: '/finance/reports-hub' },
            ].map((a) => (
              <div key={a.label} className={styles.qaTile} onClick={() => nav(a.href)}>
                <span className={styles.qaIcon} style={{ background: a.bg, color: a.color }}>{a.icon}</span>
                <span className={styles.qaLabel}>{a.label}</span>
                <span className={styles.qaSub}>{a.sub}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinanceHome;
