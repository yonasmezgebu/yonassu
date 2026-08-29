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
  truck:   () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 17h4V5H2v12h3"/><path d="M20 17h2v-3.34a4 4 0 0 0-1.17-2.83L19 9h-5v8h1"/><circle cx="7.5" cy="17.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>,
  box:     () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>,
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
  const [assetSummary, setAssetSummary] = useState(null);
  const [equitySummary, setEquitySummary] = useState(null);
  const [profitSummary, setProfitSummary] = useState(null);
  const [liabSummary, setLiabSummary] = useState(null);
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
          api.get('/finance-liabilities/dashboard'),
        ]);
      if (cbRes.status      === 'fulfilled') setCashbook(cbRes.value?.data || []);
      if (crvRes.status     === 'fulfilled') setCrvs(crvRes.value?.data || []);
      if (evRes.status      === 'fulfilled') setEvs(evRes.value?.data || []);
      if (bankRes.status    === 'fulfilled') setBanks(bankRes.value?.data || []);
      if (bankSumRes.status === 'fulfilled')
        setBankSummary(bankSumRes.value?.data?.summary || bankSumRes.value?.data || null);
      if (reconRes.status   === 'fulfilled') setRecons(reconRes.value?.data || []);
      if (rcvRes.status     === 'fulfilled') setReceivables(rcvRes.value?.data || []);
      if (assetRes.status   === 'fulfilled') {
        const ad = assetRes.value?.data || assetRes.value;
        setAssetSummary(ad?.data || ad || null);
      }
      if (equityRes.status   === 'fulfilled') {
        const ed = equityRes.value?.data || equityRes.value;
        setEquitySummary(ed?.data || ed || null);
      }
      if (profitRes.status   === 'fulfilled') {
        const pd = profitRes.value?.data || profitRes.value;
        setProfitSummary(pd?.data || pd || null);
      }
      if (liabRes.status    === 'fulfilled') {
        const ld = liabRes.value?.data || liabRes.value;
        setLiabSummary(ld?.data || ld || null);
      }
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

  /* ── Assets summary ─────────────────────────────────────────── */
  const assetCats     = assetSummary?.categories || [];
  const assetGrand    = assetSummary?.grandTotal
    ?? assetCats.reduce((s, c) => s + parseFloat(c.value || 0), 0);
  const assetCatCount = assetCats.length;
  const assetItemCount = assetCats.reduce((s, c) => s + (parseInt(c.count, 10) || 0), 0);
  const assetMeta = {
    generalStore:     { label: 'General Store',   icon: <Icon.bank  />, color: '#228B22', path: '/finance/general-store-assets' },
    printingMachines: { label: 'Printing Machines', icon: <Icon.clip  />, color: '#2E8B57', path: '/finance/printing-machines-assets' },
    pharmacy:         { label: 'Pharmacy Stock',  icon: <Icon.inbox />, color: '#6B8E23', path: '/finance/pharmacy-assets' },
    vehicles:         { label: 'Vehicles',        icon: <Icon.outbox/>, color: '#1B5E20', path: '/finance/vehicle-assets' },
    tractors:         { label: 'Tractors',        icon: <Icon.trend />, color: '#8BC34A', path: '/finance/tractor-assets' },
  };

  /* Asset groups: Cars & Machinery vs Products (finished stock in stores & pharmacy) */
  const catVal = (key) => {
    const c = assetCats.find(x => x.key === key);
    return parseFloat(c?.value || 0);
  };
  const catCnt = (key) => {
    const c = assetCats.find(x => x.key === key);
    return parseInt(c?.count || 0, 10);
  };
  const assetMachinery       = catVal('vehicles') + catVal('tractors') + catVal('printingMachines');
  const assetMachineryCount  = catCnt('vehicles') + catCnt('tractors') + catCnt('printingMachines');
  const assetProducts        = catVal('generalStore') + catVal('pharmacy');
  const assetProductsCount   = catCnt('generalStore') + catCnt('pharmacy');

  /* ── Equity & Capital (charts the money-flow: deposits ↑ / withdrawals ↓) ── */
  const equityTotal = parseFloat(equitySummary?.totalEquity || 0);
  const equityContrib  = parseFloat(equitySummary?.totalContributions || 0);
  const equityWithdraw = parseFloat(equitySummary?.totalWithdrawals || 0);
  const equityRetained = parseFloat(equitySummary?.retainedEarnings || 0);
  const equityNetIn = equityContrib - equityWithdraw;

  /* ── Receivables money-flow (settled payments add to money received) ── */
  const moneyReceived = settledReceivable;   // every paid amount counts into money on hand
  const moneyOwed     = outstandingBalance;  // what customers still owe (payable)
  const moneyTotal    = totalReceivable;     // total invoiced across all accounts

  /* ── Net profit (from invoices & receipts / P&L side) ───────── */
  const netProfit = parseFloat(profitSummary?.summary?.netProfit ?? profitSummary?.netProfit ?? 0);

  /* ── Liabilities & Accounts Payable (all money owed) ────────── */
  const liabAP          = parseFloat(liabSummary?.accountsPayable ?? 0);
  const totalOwed       = parseFloat(liabSummary?.totalOwed ?? liabSummary?.totalLiabilities ?? 0);
  const overdueCount    = parseInt(liabSummary?.overdueCount || 0, 10);

  /* ── Expense outflow ───────────────────────────────────────────
     Every paid amount lands in the cashbook as a payment row.
     Bank-paid EV expenses already reduce bankBalance (via finance_evs),
     so subtract only the outlay NOT already booked to a bank account —
     this makes EVERY paid expense decrease the System Balance exactly once. */
  const bankBookedRefs = new Set(
    evList
      .filter(e => (e.payment_method || '').toLowerCase().includes('bank'))
      .map(e => e.ev_number)
  );
  const bankBookedOut = cbEntries
    .filter(e => e.reference && bankBookedRefs.has(e.reference))
    .reduce((s, e) => s + parseFloat(e.payments || 0), 0);
  const expenseOut = Math.max(0, totalPayments - bankBookedOut);

  /* ── CRV / revenue inflow ───────────────────────────────────────
     Every cash receipt (CRV) lives in the CRV history (finance_crvs),
     not in the cashbook/expense book. Receipts already booked to a
     bank/mobile account are inside bankBalance, so add only the CRV
     money NOT matched to an account — every revenue entry increases
     the System Balance exactly once. */
  const crvBankedIn = bankList.reduce((s, b) => s + parseFloat(b.totalIn || 0), 0);
  const unbankedCRV = Math.max(0, crvTotal - crvBankedIn);

  /* ── SYSTEM BALANCE: accounts + receivable money + owner flow + net profit − expenses paid + CRV cash ── */
  const systemBalance =
    parseFloat(bankBalance || 0) +
    parseFloat(moneyReceived || 0) +
    parseFloat(equityNetIn || 0) +
    parseFloat(netProfit || 0) -
    parseFloat(expenseOut || 0) +
    parseFloat(unbankedCRV || 0);

  /* ── KPI data ────────────────────────────────────────────────── */
  const kpiCards = [
    { label: 'Balance + Finished Stock', value: fmtShort(systemBalance + assetProducts), meta: `Stock: ${fmtShort(assetProducts)}`, sub: 'System balance + products (stores + pharmacy)', icon: Icon.cash, color: '#059669', iconBg: 'hsl(142 76% 92%)', path: '/finance/cash-book' },
    { label: 'Balance + Total Assets', value: fmtShort(systemBalance + assetGrand), meta: `Assets: ${fmtShort(assetGrand)}`, sub: 'System balance + all asset categories', icon: Icon.bank, color: '#D97706', iconBg: 'hsl(48 96% 89%)', path: '/finance/tractor-assets' },
    { label: 'Liabilities & AP', value: fmtShort(totalOwed), meta: `${overdueCount} overdue · ${liabAP > 0 ? fmtShort(liabAP) : '0'} AP`, sub: 'Recorded liabilities (AP · loans · taxes)', icon: Icon.scale, color: '#DC2626', iconBg: 'hsl(0 93% 94%)', path: '/finance/liabilities' },
    { label: 'Cars & Machinery', value: fmtShort(assetMachinery), meta: `${assetMachineryCount} assets · 3 types`, sub: 'Vehicles · tractors · printing machines', icon: Icon.truck, color: '#1D4ED8', iconBg: 'hsl(222 85% 92%)', path: '/finance/vehicle-assets' },
    { label: 'Products (Stores + Pharmacy)', value: fmtShort(assetProducts), meta: `${assetProductsCount} items · 2 stores + pharmacy`, sub: 'Finished stock in stores & pharmacy', icon: Icon.box, color: '#B45309', iconBg: 'hsl(32 92% 92%)', path: '/finance/general-store-assets' },
    { label: 'Total Assets',  value: fmtShort(assetGrand),  meta: `${assetItemCount} assets / ${assetCatCount} categories`, sub: 'Cars & machinery + products',   icon: Icon.cash, color: '#0F766E', iconBg: 'hsl(174 60% 90%)', path: '/finance/tractor-assets' },
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
            <span className={styles.kpiLabel}>System Balance</span>
            <span className={styles.kpiIconHero}><Icon.cash /></span>
          </div>
          <div className={styles.kpiHeroValue}>{fmtShort(systemBalance)}</div>
          <div className={styles.heroBreakdown}>
            <span><Icon.bank /> Accounts: {fmtShort(bankBalance)}</span>
            <span><Icon.inbox /> Receivable: {fmtShort(moneyReceived)}</span>
            <span><Icon.trend /> Equity: {fmtShort(equityNetIn)}</span>
            <span><Icon.chart /> Net Profit: {fmtShort(netProfit)}</span>
            <span><Icon.outbox /> Paid Out: −{fmtShort(expenseOut)}</span>
            <span><Icon.scale /> Owed: {fmtShort(totalOwed)}</span>
          </div>
          <div className={styles.kpiHeroFoot}>
            {cbEntries.length} ledger entries · all balances summed
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

      {/* ── ROW 3: RECEIVABLES + EQUITY + BANK RECON ───────────── */}
      <div className={styles.grid3}>

        {/* Accounts Receivable — money received vs still owed */}
        <div className={styles.card}>
          <h3 className={styles.cardTitleNoIcon}>Accounts Receivable</h3>
          <div className={styles.cardLabel}>Money received vs owed (payable)</div>
          <div className={styles.summaryList}>
            {[
              { label: 'Total Invoiced',       val: fmt(moneyTotal),    icon: <Icon.clip />,  iconBg: 'hsl(199 89% 93%)', color: '#2563EB', path: '/finance/outstanding-ar' },
              { label: 'Money Received',       val: fmt(moneyReceived), icon: <Icon.inbox/>,  iconBg: 'hsl(142 76% 92%)', color: '#059669', path: '/finance/outstanding-ar' },
              { label: 'Outstanding (Owed)',   val: fmt(moneyOwed),     icon: <Icon.scale />,  iconBg: moneyOwed > 0 ? 'hsl(0 93% 94%)' : 'hsl(142 76% 92%)', color: moneyOwed > 0 ? '#DC2626' : '#059669', path: '/finance/outstanding-ar' },
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
          <div className={styles.summaryCount}>
            {rcvList.length} receivable books · payments auto-add to Money Received
          </div>
        </div>

        {/* Equity & Capital — deposits increase, withdrawals decrease */}
        <div className={styles.card}>
          <h3 className={styles.cardTitleNoIcon}>Equity & Capital</h3>
          <div className={styles.cardLabel}>Deposits (↑) vs withdrawals (↓)</div>
          <div className={styles.summaryList}>
            {[
              { label: 'Total Equity',      val: fmt(equityTotal),    icon: <Icon.scale />,  iconBg: 'hsl(221 83% 93%)',  color: '#2563EB', path: '/finance/equity' },
              { label: 'Deposits In',       val: fmt(equityContrib),  icon: <Icon.inbox />,  iconBg: 'hsl(142 76% 92%)', color: '#059669', path: '/finance/equity' },
              { label: 'Withdrawals Out',   val: fmt(equityWithdraw), icon: <Icon.outbox/>,  iconBg: 'hsl(0 93% 94%)',    color: '#DC2626', path: '/finance/equity' },
              { label: 'Net Owner Flow',    val: fmt(equityNetIn),    icon: <Icon.trend />,  iconBg: equityNetIn >= 0 ? 'hsl(142 76% 92%)' : 'hsl(0 93% 94%)', color: equityNetIn >= 0 ? '#059669' : '#DC2626', path: '/finance/equity' },
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
          <div className={styles.summaryCount}>
            Retained earnings {fmt(equityRetained)} · Owner equity = deposits + retained − withdrawals
          </div>
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
      </div>

      {/* ── ROW 4: QUICK OPERATIONS ───────────────────────────── */}
      <div className={`${styles.card} ${styles.quickCard}`}>
        <div className={styles.cardHeader}>
          <span className={styles.cardTitleIcon}><Icon.chart /></span>
          <h3 className={styles.cardTitle}>Quick Operations</h3>
        </div>
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

      {/* ── ROW 5: ASSETS VALUATION SUMMARY ────────────────────── */}
      <div className={styles.assetCard}>
        <div className={styles.cardHeader}>
          <span className={styles.cardTitleIcon}><Icon.bank /></span>
          <h3 className={styles.cardTitle}>Assets Valuation</h3>
          <span className={styles.cardSub}>All 5 categories · {fmtShort(assetGrand)}</span>
        </div>

        <div className={styles.assetGrid}>
          {assetCats.map((a) => {
            const meta = assetMeta[a.key] || { label: a.label, icon: <Icon.chart />, color: '#6B7280', path: null };
            const pct = assetGrand > 0 ? (parseFloat(a.value || 0) / assetGrand) * 100 : 0;
            return (
              <div
                key={a.key}
                className={styles.assetTile}
                onClick={meta.path ? () => nav(meta.path) : undefined}
                role={meta.path ? 'button' : undefined}
                tabIndex={meta.path ? 0 : undefined}
                onKeyDown={meta.path ? e => e.key === 'Enter' && nav(meta.path) : undefined}
              >
                <div className={styles.assetTileTop}>
                  <span className={styles.assetIcon} style={{ background: `hsl(0 0% 0% / 0.06)`, color: meta.color }}>
                    {meta.icon}
                  </span>
                  <span className={styles.assetLabel}>{meta.label}</span>
                  <span className={styles.assetCount}>{a.count} items</span>
                </div>
                <div
                  className={styles.assetValue}
                  style={{ color: meta.color }}
                >
                  {fmtShort(a.value)}
                </div>
                <div className={styles.assetBar}>
                  <div className={styles.assetBarFill} style={{ width: `${pct}%`, background: meta.color }} />
                </div>
                <div className={styles.assetPct}>{pct.toFixed(1)}% of total</div>
              </div>
            );
          })}
        </div>

        <div className={styles.assetFooter}>
          <span>Consolidated total asset valuation</span>
          <span className={styles.assetGrand}>{fmt(assetGrand)}</span>
        </div>
      </div>

    </div>
  );
};

export default FinanceHome;
