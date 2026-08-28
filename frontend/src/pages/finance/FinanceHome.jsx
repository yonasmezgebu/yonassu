import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/apiClient';
import SegmentedSpinner from '../../components/ui/SegmentedSpinner';
import styles from './FinanceHome.module.css';

/* ─── Formatters ──────────────────────────────────────────────── */
const fmt = (n) =>
  'ETB ' + Number(n || 0).toLocaleString('en-ET', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtShort = (n) => {
  const v = Number(n || 0);
  if (v >= 1_000_000) return 'ETB ' + (v / 1_000_000).toFixed(1) + 'M';
  if (v >= 1_000)     return 'ETB ' + (v / 1_000).toFixed(1) + 'K';
  return 'ETB ' + v.toFixed(2);
};

/* ─── Progress Bar ────────────────────────────────────────────── */
const CategoryBar = ({ value, max, color }) => (
  <div className={styles.catBar}>
    <div
      className={styles.catBarFill}
      style={{
        background: color,
        width: `${max > 0 ? Math.min(100, (value / max) * 100) : 0}%`,
      }}
    />
  </div>
);

/* ─── SVG Icon helpers (no emoji) ────────────────────────────── */
const Icon = {
  book:    () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>,
  inbox:   () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>,
  outbox:  () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/><polyline points="12 2 12 9"/><polyline points="9 5 12 2 15 5"/></svg>,
  bank:    () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="22" x2="21" y2="22"/><line x1="6" y1="18" x2="6" y2="11"/><line x1="10" y1="18" x2="10" y2="11"/><line x1="14" y1="18" x2="14" y2="11"/><line x1="18" y1="18" x2="18" y2="11"/><polygon points="12 2 20 7 4 7 12 2"/></svg>,
  receipt: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
  chart:   () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></svg>,
  trend:   () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
  scale:   () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="3" x2="12" y2="21"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
  refresh: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>,
  cash:    () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>,
  clip:    () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
};

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════ */
const FinanceHome = () => {
  const navigate = useNavigate();
  const { user }  = useAuth();

  /* ── Raw data state ──────────────────────────────────────────── */
  const [cashbook,     setCashbook]     = useState([]);
  const [crvs,         setCrvs]         = useState([]);
  const [evs,          setEvs]          = useState([]);
  const [banks,        setBanks]        = useState([]);
  const [bankSummary,  setBankSummary]  = useState(null);
  const [recons,       setRecons]       = useState([]);
  const [receivables,  setReceivables]  = useState([]);
  const [refreshing,   setRefreshing]   = useState(false);
  const [timeString,   setTimeString]   = useState('');

  /* ── Clock ───────────────────────────────────────────────────── */
  useEffect(() => {
    const tick = () =>
      setTimeString(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, []);

  /* ── Load data ───────────────────────────────────────────────── */
  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const [cbRes, crvRes, evRes, bankRes, bankSumRes, reconRes, rcvRes] =
        await Promise.allSettled([
          api.get('/finance-cash/cashbook'),
          api.get('/finance-cash/crv'),
          api.get('/finance-cash/ev'),
          api.get('/finance-bank'),
          api.get('/finance-bank/cashbook/summary'),
          api.get('/finance-bank/reconciliations'),
          api.get('/finance-receivables/book'),
        ]);
      if (cbRes.status      === 'fulfilled') setCashbook(cbRes.value?.data || []);
      if (crvRes.status     === 'fulfilled') setCrvs(crvRes.value?.data || []);
      if (evRes.status      === 'fulfilled') setEvs(evRes.value?.data || []);
      if (bankRes.status    === 'fulfilled') setBanks(bankRes.value?.data || []);
      if (bankSumRes.status === 'fulfilled')
        setBankSummary(bankSumRes.value?.data?.summary || bankSumRes.value?.data || null);
      if (reconRes.status   === 'fulfilled') setRecons(reconRes.value?.data || []);
      if (rcvRes.status     === 'fulfilled') setReceivables(rcvRes.value?.data || []);
    } catch (err) {
      console.error('Finance dashboard load error:', err);
    }
    setRefreshing(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const nav = (path) => navigate(path);

  /* ── Derived values ──────────────────────────────────────────── */
  const cbEntries  = Array.isArray(cashbook)     ? cashbook     : [];
  const crvList    = Array.isArray(crvs)         ? crvs         : [];
  const evList     = Array.isArray(evs)          ? evs          : [];
  const rcvList    = Array.isArray(receivables)  ? receivables  : [];
  const bankList   = Array.isArray(banks)        ? banks        : [];
  const reconList  = Array.isArray(recons)       ? recons       : [];

  const totalReceipts  = cbEntries.reduce((s, e) => s + parseFloat(e.receipts  || 0), 0);
  const totalPayments  = cbEntries.reduce((s, e) => s + parseFloat(e.payments  || 0), 0);
  const cashBalance    = totalReceipts - totalPayments;

  const crvTotal = crvList.reduce((s, c) => s + parseFloat(c.amount || 0), 0);
  const evTotal  = evList.reduce((s, p)  => s + parseFloat(p.amount || 0), 0);

  const bankBalance = bankList.length
    ? bankList.reduce((s, b) => s + parseFloat(b.netBalance ?? b.balance ?? b.opening_balance ?? 0), 0)
    : parseFloat(bankSummary?.netBalance || bankSummary?.total_balance || 0);

  const totalReceivable    = rcvList.reduce((s, r) => s + parseFloat(r.total_amount || r.amount || 0), 0);
  const settledReceivable  = rcvList.reduce((s, r) => s + parseFloat(r.amount_paid || r.paid_amount || 0), 0);
  const outstandingBalance = rcvList.length
    ? rcvList.reduce((s, r) => s + parseFloat(
        r.outstanding_balance ?? ((r.total_amount || r.amount || 0) - (r.amount_paid || r.paid_amount || 0))
      ), 0)
    : totalReceivable - settledReceivable;

  const unreconCount = reconList.filter(r => r.status !== 'reconciled' && r.status !== 'completed').length;
  const firstName    = user?.fullName?.split(' ')[0] || user?.name?.split(' ')[0] || 'Manager';
  const recentCB     = [...cbEntries].reverse().slice(0, 6);

  const txBreakdown = [
    { name: 'Cash Receipts (CRV)',  count: crvList.length, amount: crvTotal, color: '#059669' },
    { name: 'Expense Vouchers (EV)', count: evList.length,  amount: evTotal,  color: '#D97706' },
  ].filter(b => b.count > 0);
  const maxBreakdownAmt = Math.max(...txBreakdown.map(b => b.amount), 1);

  /* ── KPI data ────────────────────────────────────────────────── */
  const kpiCards = [
    { label: 'CRV Income',    value: fmtShort(crvTotal),    meta: `${crvList.length} receipts`,    sub: 'Cash received',      icon: Icon.inbox,   color: '#059669', iconBg: 'hsl(142 76% 92%)', path: '/finance/crv' },
    { label: 'EV Payments',   value: fmtShort(evTotal),     meta: `${evList.length} vouchers`,     sub: 'Expense vouchers',   icon: Icon.outbox,  color: '#D97706', iconBg: 'hsl(48 96% 89%)',  path: '/finance/ev' },
    { label: 'Bank Balance',  value: fmtShort(bankBalance), meta: `${bankList.length} account${bankList.length !== 1 ? 's' : ''}`, sub: 'All bank accounts', icon: Icon.bank, color: '#2563EB', iconBg: 'hsl(199 89% 93%)', path: '/finance/bank-accounts' },
  ];

  const miniTiles = [
    { label: 'CB Entries',    val: cbEntries.length,  icon: '📓', color: '#059669' },
    { label: 'Receivables',   val: rcvList.length,    icon: '📋', color: '#D97706' },
    { label: 'Unrecon.',      val: unreconCount,      icon: '⚖️', color: unreconCount > 0 ? '#DC2626' : '#059669' },
    { label: 'Vouchers',      val: evList.length,     icon: '🧾', color: '#D97706' },
  ];

  const quickOps = [
    { label: 'CRV',         sub: 'Receipts',   Icon: Icon.inbox,   color: '#059669', iconBg: 'hsl(142 76% 92%)', href: '/finance/crv' },
    { label: 'EV',          sub: 'Vouchers',   Icon: Icon.outbox,  color: '#D97706', iconBg: 'hsl(48 96% 89%)',  href: '/finance/ev' },
    { label: 'Cash Book',   sub: 'Ledger',     Icon: Icon.book,    color: '#2563EB', iconBg: 'hsl(214 100% 97%)', href: '/finance/cash-book' },
    { label: 'Bank',        sub: 'Accounts',   Icon: Icon.bank,    color: '#0891B2', iconBg: 'hsl(199 89% 93%)', href: '/finance/bank-accounts' },
    { label: 'Receivables', sub: 'Book',       Icon: Icon.receipt, color: '#7C3AED', iconBg: 'hsl(258 100% 96%)', href: '/finance/outstanding-ar' },
    { label: 'P&L',         sub: 'Report',     Icon: Icon.trend,   color: '#059669', iconBg: 'hsl(142 76% 92%)', href: '/finance/profit-loss' },
    { label: 'Cash Flow',   sub: 'Report',     Icon: Icon.chart,   color: '#6B7280', iconBg: 'hsl(220 14% 96%)',  href: '/finance/cash-flow' },
  ];

  return (
    <div className={styles.page}>

      {/* ── HEADER ─────────────────────────────────────────────── */}
      <div className={styles.header}>
        <div className={styles.titleBlock}>
          <h1 className={styles.pageTitle}>
            Finance Overview
          </h1>
          <p className={styles.pageSubtitle}>
            Welcome back, {firstName} · {timeString}
          </p>
        </div>
        <button onClick={load} className={styles.syncBtn} disabled={refreshing}>
          {refreshing ? <SegmentedSpinner size={14} /> : <Icon.refresh />}
          <span>{refreshing ? 'Syncing…' : 'Sync'}</span>
        </button>
      </div>

      {/* ── ROW 1: KPI HERO CARDS ──────────────────────────────── */}
      <div className={styles.kpiGrid}>

        {/* Cash Book — Hero card */}
        <div
          className={`${styles.kpiCard} ${styles.kpiCardHero}`}
          onClick={() => nav('/finance/cash-book')}
          role="button"
          tabIndex={0}
          onKeyDown={e => e.key === 'Enter' && nav('/finance/cash-book')}
        >
          <div className={styles.kpiTop}>
            <span className={styles.kpiLabel}>Cash Book Balance</span>
            <span className={styles.kpiIconHero}><Icon.book /></span>
          </div>
          <div className={styles.kpiHeroValue}>{fmtShort(cashBalance)}</div>
          <div className={styles.kpiHeroMeta}>
            <span>In: {fmtShort(totalReceipts)}</span>
            <span>Out: {fmtShort(totalPayments)}</span>
          </div>
          <div className={styles.kpiHeroFoot}>
            {cbEntries.length} ledger entries total
          </div>
        </div>

        {/* Dynamic KPI cards */}
        {kpiCards.map(k => (
          <div
            key={k.label}
            className={styles.kpiCard}
            onClick={() => nav(k.path)}
            role="button"
            tabIndex={0}
            onKeyDown={e => e.key === 'Enter' && nav(k.path)}
          >
            <div className={styles.kpiTop}>
              <span className={styles.kpiLabel}>{k.label}</span>
              <span
                className={styles.kpiIcon}
                style={{ background: k.iconBg, color: k.color }}
              >
                <k.icon />
              </span>
            </div>
            <div className={styles.kpiValue} style={{ color: k.color }}>{k.value}</div>
            <div className={styles.kpiMeta}>{k.meta}</div>
            <div className={styles.kpiSub}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* ── ROW 2: BREAKDOWN + RECENT LEDGER ───────────────────── */}
      <div className={styles.grid2}>

        {/* Transaction Breakdown */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardTitleIcon}><Icon.chart /></span>
            <h3 className={styles.cardTitle}>Transaction Breakdown</h3>
            <span className={styles.cardSub}>Cash Book Summary</span>
          </div>

          {/* Mini stat tiles */}
          <div className={styles.miniGrid}>
            {miniTiles.map(k => (
              <div key={k.label} className={styles.miniTile}>
                <div className={styles.miniTileTop}>
                  <span className={styles.miniTileIcon}>{k.icon}</span>
                  <span className={styles.miniTileLabel}>{k.label}</span>
                </div>
                <div className={styles.miniTileValue} style={{ color: k.color }}>
                  {k.val}
                </div>
              </div>
            ))}
          </div>

          {/* Breakdown rows */}
          <div className={styles.listHeader}>
            <span>Document Type</span>
            <span />
            <span style={{ textAlign: 'right' }}>Amount (ETB)</span>
          </div>

          {txBreakdown.length === 0 ? (
            <div className={styles.empty}>No transaction data yet</div>
          ) : txBreakdown.map(row => (
            <div
              key={row.name}
              className={styles.breakdownRow}
              onClick={() => nav('/finance/cash-book')}
              role="button"
              tabIndex={0}
              onKeyDown={e => e.key === 'Enter' && nav('/finance/cash-book')}
            >
              <div className={styles.catNameWrap}>
                <span className={styles.dot} style={{ background: row.color }} />
                <span className={styles.catName}>{row.name}</span>
              </div>
              <CategoryBar value={row.amount} max={maxBreakdownAmt} color={row.color} />
              <span className={styles.catAmount} style={{ color: row.color }}>
                {fmtShort(row.amount)}
              </span>
            </div>
          ))}
        </div>

        {/* Recent Cash Book Entries */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardTitleIcon}><Icon.receipt /></span>
            <h3 className={styles.cardTitle}>Recent Ledger Entries</h3>
          </div>

          {recentCB.length === 0 ? (
            <div className={styles.empty}>No entries yet</div>
          ) : (
            <div className={styles.ledgerList}>
              {recentCB.map((entry, i) => {
                const isReceipt = parseFloat(entry.receipts || 0) > 0;
                const amt       = isReceipt ? entry.receipts : entry.payments;
                const color     = isReceipt ? '#059669' : '#D97706';
                const iconBg    = isReceipt ? 'hsl(142 76% 92%)' : 'hsl(48 96% 89%)';
                return (
                  <div
                    key={entry.id || i}
                    className={styles.ledgerRow}
                    onClick={() => nav('/finance/cash-book')}
                    role="button"
                    tabIndex={0}
                    onKeyDown={e => e.key === 'Enter' && nav('/finance/cash-book')}
                  >
                    <span
                      className={styles.ledgerIcon}
                      style={{ background: iconBg, color }}
                    >
                      {isReceipt ? <Icon.inbox /> : <Icon.outbox />}
                    </span>
                    <div className={styles.ledgerMain}>
                      <div className={styles.ledgerTitle}>
                        {entry.reference && (
                          <span className={styles.ledgerRef}>{entry.reference}</span>
                        )}
                        {entry.description || entry.type || 'Entry'}
                      </div>
                      <div className={styles.ledgerDate}>
                        {entry.date
                          ? new Date(entry.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                          : '—'}
                      </div>
                    </div>
                    <span className={styles.ledgerAmount} style={{ color }}>
                      {fmtShort(amt)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── ROW 3: RECEIVABLES + RECON + QUICK ACTIONS ─────────── */}
      <div className={styles.grid3}>

        {/* Receivables Summary */}
        <div className={styles.card}>
          <h3 className={styles.cardTitleNoIcon}>Receivable Book</h3>
          <div className={styles.cardLabel}>Outstanding Balances</div>
          <div className={styles.summaryList}>
            {[
              { label: 'Total Invoiced', val: fmt(totalReceivable),   icon: <Icon.clip />,    iconBg: 'hsl(199 89% 93%)', color: '#2563EB', path: '/finance/outstanding-ar' },
              { label: 'Settled',        val: fmt(settledReceivable), icon: '✅',              iconBg: 'hsl(142 76% 92%)', color: '#059669', path: '/finance/outstanding-ar' },
              { label: 'Outstanding',    val: fmt(outstandingBalance), icon: <Icon.scale />,  iconBg: outstandingBalance > 0 ? 'hsl(0 93% 94%)' : 'hsl(142 76% 92%)', color: outstandingBalance > 0 ? '#DC2626' : '#059669', path: '/finance/outstanding-ar' },
            ].map(row => (
              <div
                key={row.label}
                className={styles.summaryRow}
                onClick={() => nav(row.path)}
                role="button"
                tabIndex={0}
                onKeyDown={e => e.key === 'Enter' && nav(row.path)}
              >
                <span
                  className={styles.summaryIcon}
                  style={{ background: row.iconBg, color: row.color }}
                >
                  {row.icon}
                </span>
                <div className={styles.summaryMain}>
                  <div className={styles.summaryLabel}>{row.label}</div>
                  <div className={styles.summaryValue} style={{ color: row.color }}>
                    {row.val}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className={styles.summaryCount}>{rcvList.length} receivable books</div>
        </div>

        {/* Bank Reconciliation */}
        <div className={styles.card}>
          <h3 className={styles.cardTitleNoIcon}>Bank Reconciliation</h3>
          <div className={styles.cardLabel}>Accounts Status</div>
          <div className={styles.summaryList}>
            {[
              { label: 'Bank Accounts', val: `${bankList.length} accounts`,  icon: <Icon.bank />,  iconBg: 'hsl(199 89% 93%)', color: '#2563EB', path: '/finance/bank-accounts' },
              { label: 'Bank Balance',  val: fmtShort(bankBalance),          icon: <Icon.cash />,  iconBg: 'hsl(142 76% 92%)', color: '#059669', path: '/finance/bank-accounts' },
              { label: 'Unreconciled',  val: `${unreconCount} pending`,      icon: <Icon.scale />, iconBg: unreconCount > 0 ? 'hsl(0 93% 94%)' : 'hsl(142 76% 92%)', color: unreconCount > 0 ? '#DC2626' : '#059669', path: '/finance/bank-accounts' },
            ].map(row => (
              <div
                key={row.label}
                className={styles.summaryRow}
                onClick={() => nav(row.path)}
                role="button"
                tabIndex={0}
                onKeyDown={e => e.key === 'Enter' && nav(row.path)}
              >
                <span
                  className={styles.summaryIcon}
                  style={{ background: row.iconBg, color: row.color }}
                >
                  {row.icon}
                </span>
                <div className={styles.summaryMain}>
                  <div className={styles.summaryLabel}>{row.label}</div>
                  <div className={styles.summaryValue} style={{ color: row.color }}>
                    {row.val}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className={styles.summaryCount}>{reconList.length} reconciliation records</div>
        </div>

        {/* Quick Operations */}
        <div className={styles.card}>
          <h3 className={styles.cardTitleNoIcon}>Quick Operations</h3>
          <div className={styles.qaGrid}>
            {quickOps.map(a => (
              <div
                key={a.label}
                className={styles.qaTile}
                onClick={() => nav(a.href)}
                role="button"
                tabIndex={0}
                onKeyDown={e => e.key === 'Enter' && nav(a.href)}
              >
                <span
                  className={styles.qaIcon}
                  style={{ background: a.iconBg, color: a.color }}
                >
                  <a.Icon />
                </span>
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
