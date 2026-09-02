import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/apiClient';
import styles from './FinanceHome.module.css';

/* ─── Formatters ──────────────────────────────────────────────── */
const fmt = (n) =>
  'ETB ' + Number(n || 0).toLocaleString('en-ET', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT - Tabular Redesign
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
  const [erpReceivables, setErpReceivables] = useState(null);
  const [assetSummary, setAssetSummary] = useState(null);
  const [equitySummary, setEquitySummary] = useState(null);
  const [profitSummary, setProfitSummary] = useState(null);
  const [liabSummary, setLiabSummary] = useState(null);
  const [refreshing,   setRefreshing]   = useState(false);

  /* ── Load data ───────────────────────────────────────────────── */
  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const [cbRes, crvRes, evRes, bankRes, bankSumRes, reconRes, rcvRes, assetRes, equityRes, profitRes, liabRes, erpRes] =
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
          api.get('/erp-receivables/dashboard'),
        ]);
      if (cbRes.status      === 'fulfilled') setCashbook(cbRes.value?.data || []);
      if (crvRes.status     === 'fulfilled') setCrvs(crvRes.value?.data || []);
      if (evRes.status      === 'fulfilled') setEvs(evRes.value?.data || []);
      if (bankRes.status    === 'fulfilled') setBanks(bankRes.value?.data || []);
      if (bankSumRes.status === 'fulfilled')
        setBankSummary(bankSumRes.value?.data?.summary || bankSumRes.value?.data || null);
      if (reconRes.status   === 'fulfilled') setRecons(reconRes.value?.data || []);
      if (rcvRes.status     === 'fulfilled') setReceivables(rcvRes.value?.data || []);
      if (erpRes.status     === 'fulfilled') setErpReceivables(erpRes.value?.data?.data || erpRes.value?.data || null);
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

  const bankOpeningTotal = bankList.reduce((s, b) => s + parseFloat(b.opening_balance || 0), 0);
  const bankInTotal      = bankList.reduce((s, b) => s + parseFloat(b.totalIn || 0), 0);
  const bankOutTotal     = bankList.reduce((s, b) => s + parseFloat(b.totalOut || 0), 0);
  const bankBalance = bankList.length
    ? bankList.reduce((s, b) => s + parseFloat(b.netBalance ?? b.balance ?? b.opening_balance ?? 0), 0)
    : parseFloat(bankSummary?.netBalance || bankSummary?.total_balance || 0);

  // Use outstanding_balance directly from each record (same as the AR page).
  // amount_paid on the finance_receivables table reflects the amount already
  // collected; outstanding_balance is the remainder still owed.
  const totalReceivable    = rcvList.reduce((s, r) => s + parseFloat(r.total_amount || r.amount || 0), 0);
  const outstandingBalance = rcvList.reduce((s, r) => s + parseFloat(
    r.outstanding_balance ?? Math.max(0, (r.total_amount || r.amount || 0) - (r.amount_paid || r.paid_amount || 0))
  ), 0);
  const settledReceivable  = totalReceivable - outstandingBalance;

  const unreconCount = reconList.filter(r => r.status !== 'reconciled' && r.status !== 'completed').length;
  const firstName    = user?.fullName?.split(' ')[0] || user?.name?.split(' ')[0] || 'Manager';

  /* ── Assets summary ─────────────────────────────────────────── */
  const assetCats     = assetSummary?.categories || [];
  const assetGrand    = assetSummary?.grandTotal
    ?? assetCats.reduce((s, c) => s + parseFloat(c.value || 0), 0);
  
  const catVal = (key) => {
    const c = assetCats.find(x => x.key === key);
    return parseFloat(c?.value || 0);
  };
  const assetMachinery       = catVal('vehicles') + catVal('tractors') + catVal('printingMachines');
  const assetProducts        = catVal('generalStore') + catVal('pharmacy');

  /* ── Equity ─────────────────────────────────────────────────── */
  const equityContrib  = parseFloat(equitySummary?.totalContributions || 0);
  const equityWithdraw = parseFloat(equitySummary?.totalWithdrawals || 0);
  const equityNetIn = equityContrib - equityWithdraw;

  /* ── Revenue Book (finance_receivables) ─────────────────────── */
  const revenueBookTotal = rcvList.reduce((s, r) => s + parseFloat(r.total_amount || r.amount || 0), 0);
  const revenueBookOwed  = rcvList.reduce((s, r) => s + parseFloat(
    r.outstanding_balance ?? Math.max(0, (r.total_amount || r.amount || 0) - (r.amount_paid || r.paid_amount || 0))
  ), 0);
  const revenueBookCollected = revenueBookTotal - revenueBookOwed;

  /* ── Accounts Receivable (erp_receivables) ──────────────────── */
  const moneyTotal    = parseFloat(erpReceivables?.totalInvoiced || 0);
  const moneyReceived = parseFloat(erpReceivables?.totalCollected || 0);
  const moneyOwed     = parseFloat(erpReceivables?.totalReceivables || 0);

  /* ── Net profit ─────────────────────────────────────────────── */
  const netProfit = parseFloat(profitSummary?.summary?.netProfit ?? profitSummary?.netProfit ?? 0);

  /* ── Liabilities ────────────────────────────────────────────── */
  const totalOwed = parseFloat(liabSummary?.totalOwed ?? liabSummary?.totalLiabilities ?? 0);

  /* ── Expense outflow ─────────────────────────────────────────── */
  const bankBookedRefs = new Set(
    evList
      .filter(e => (e.payment_method || '').toLowerCase().includes('bank'))
      .map(e => e.ev_number)
  );
  const bankBookedOut = cbEntries
    .filter(e => e.reference && bankBookedRefs.has(e.reference))
    .reduce((s, e) => s + parseFloat(e.payments || 0), 0);
  const expenseOut = Math.max(0, totalPayments - bankBookedOut);

  /* ── CRV / revenue inflow ─────────────────────────────────────── */
  const crvBankedIn = bankList.reduce((s, b) => s + parseFloat(b.totalIn || 0), 0);
  const unbankedCRV = Math.max(0, crvTotal - crvBankedIn);

  /* ── SYSTEM BALANCE ─────────────────────────────────────────── */
  const systemBalance =
    parseFloat(bankBalance || 0) +
    parseFloat(unbankedCRV || 0) +
    parseFloat(revenueBookOwed || 0) +
    parseFloat(moneyOwed || 0) +
    parseFloat(assetMachinery || 0) +
    parseFloat(assetProducts || 0);

  return (
    <div className={styles.page}>
      {/* HEADER */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.pageTitle}>Finance Dashboard</h1>
          <p className={styles.pageSubtitle}>System generated tabular overview.</p>
        </div>
        <button onClick={load} className={styles.btnPrimary} disabled={refreshing}>
          {refreshing ? 'Syncing...' : 'Sync Data'}
        </button>
      </div>

      <div className={styles.gridContainer}>
        {/* TABLE 1: SYSTEM BALANCE */}
        <div className={styles.tableCard}>
          <h3 className={styles.sectionTitle} style={{ padding: '1.5rem 1.5rem 0' }}>System Balance</h3>
          <div className={styles.tableWrapper}>
            <table className={styles.dataTable}>
              <thead>
                <tr>
                  <th>Component</th>
                  <th className={styles.alignRight}>Amount</th>
                  <th className={styles.alignRight}>Cumulative Total</th>
                </tr>
              </thead>
              <tbody>
                 {(() => {
                  const rows = [
                    { label: 'Bank Accounts (Cash in Bank)', val: bankBalance, nav: '/finance/bank-accounts' },
                    { label: 'Unbanked Cash (CRV on Hand)', val: unbankedCRV, nav: '/finance/crv' },
                    { label: 'Net Owner Flow (Equity)', val: equityNetIn, nav: '/finance/equity' },
                    { label: 'Collected / Paid So Far (Accounts Receivable)', val: moneyReceived, nav: '/finance/accounts-receivable' },
                    { label: 'Outstanding Receivables (Revenue Book)', val: revenueBookOwed, nav: '/finance/outstanding-ar' },
                    { label: 'Outstanding Receivables (Invoiced)', val: moneyOwed, nav: '/finance/accounts-receivable' },
                    { label: 'Fixed Assets (Cars & Machinery)', val: assetMachinery, nav: '/finance/assets' },
                    { label: 'Inventory (Products & Stock)', val: assetProducts, nav: '/finance/assets' }
                  ];
                  let runningTotal = 0;
                  return (
                    <>
                      {rows.map((r, i) => {
                        runningTotal += parseFloat(r.val || 0);
                        const isAsset = i >= 6;
                        return (
                          <tr key={i}
                            onClick={() => r.nav && navigate(r.nav)}
                            style={isAsset ? { background: '#EFF6FF', color: '#1E40AF', cursor: 'pointer' } : { cursor: 'pointer' }}
                            className={isAsset ? '' : styles.navRow}>
                            <td style={isAsset ? { color: '#1E40AF', fontWeight: 600 } : {}}>{r.label}</td>
                            <td className={styles.alignRight} style={isAsset ? { color: '#2563EB', fontWeight: 600 } : {}}>{fmt(r.val)}</td>
                            <td className={styles.alignRight} style={{ fontWeight: 600, color: isAsset ? '#1D4ED8' : '#059669' }}>{fmt(runningTotal)}</td>
                          </tr>
                        );
                      })}
                      <tr className={styles.noHover} style={{ background: '#1E40AF' }}>
                        <td style={{ color: '#FFFFFF', fontWeight: 700, padding: '10px 12px' }}>Total System Balance (Calculated Sum)</td>
                        <td className={styles.alignRight}></td>
                        <td className={styles.alignRight} style={{ color: '#FFFFFF', fontSize: '1.1rem', fontWeight: 800, padding: '10px 12px' }}>{fmt(runningTotal)}</td>
                      </tr>
                    </>
                  );
                })()}
              </tbody>
            </table>
          </div>
        </div>

        {/* TABLE 3: RECEIVABLES */}
        <div className={styles.tableCard}>
          <h3 className={styles.sectionTitle} style={{ padding: '1.5rem 1.5rem 0' }}>Accounts Receivable</h3>
          <div className={styles.tableWrapper}>
            <table className={styles.dataTable}>
              <thead>
                <tr>
                  <th>Metric</th>
                  <th className={styles.alignRight}>Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr className={styles.navRow} onClick={() => navigate('/finance/accounts-receivable')}>
                  <td>Total Invoiced (All Records)</td>
                  <td className={styles.alignRight}>{fmt(moneyTotal)}</td>
                </tr>
                <tr className={styles.navRow} onClick={() => navigate('/finance/accounts-receivable')}>
                  <td>Collected / Paid So Far</td>
                  <td className={styles.alignRight}>{fmt(moneyReceived)}</td>
                </tr>
                <tr className={`${styles.totalRow} ${styles.navRow}`} onClick={() => navigate('/finance/accounts-receivable')}>
                  <td>Still Outstanding (Not Yet Received)</td>
                  <td className={styles.alignRight}>{fmt(moneyOwed)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* TABLE 4: EQUITY & CAPITAL */}
        <div className={styles.tableCard}>
          <h3 className={styles.sectionTitle} style={{ padding: '1.5rem 1.5rem 0' }}>Equity & Capital</h3>
          <div className={styles.tableWrapper}>
            <table className={styles.dataTable}>
              <thead>
                <tr>
                  <th>Metric</th>
                  <th className={styles.alignRight}>Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr className={styles.navRow} onClick={() => navigate('/finance/equity')}>
                  <td>Deposits In</td>
                  <td className={styles.alignRight}>{fmt(equityContrib)}</td>
                </tr>
                <tr className={styles.navRow} onClick={() => navigate('/finance/equity')}>
                  <td>Withdrawals Out</td>
                  <td className={styles.alignRight}>−{fmt(equityWithdraw)}</td>
                </tr>
                <tr className={`${styles.totalRow} ${styles.navRow}`} onClick={() => navigate('/finance/equity')}>
                  <td>Net Owner Flow</td>
                  <td className={styles.alignRight}>{fmt(equityNetIn)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* TABLE 5: BANK RECONCILIATION */}
        <div className={styles.tableCard}>
          <h3 className={styles.sectionTitle} style={{ padding: '1.5rem 1.5rem 0' }}>Bank Reconciliation</h3>
          <div className={styles.tableWrapper}>
            <table className={styles.dataTable}>
              <thead>
                <tr>
                  <th>Metric</th>
                  <th className={styles.alignRight}>Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr className={styles.navRow} onClick={() => navigate('/finance/bank-accounts')}>
                  <td>Opening Balances ({bankList.length} accounts)</td>
                  <td className={styles.alignRight}>{fmt(bankOpeningTotal)}</td>
                </tr>
                <tr className={styles.navRow} onClick={() => navigate('/finance/bank-accounts')}>
                  <td>Cash In (Deposits)</td>
                  <td className={styles.alignRight}>{fmt(bankInTotal)}</td>
                </tr>
                <tr className={styles.navRow} onClick={() => navigate('/finance/bank-accounts')}>
                  <td>Cash Out (Withdrawals)</td>
                  <td className={styles.alignRight}>−{fmt(bankOutTotal)}</td>
                </tr>
                <tr className={styles.navRow} onClick={() => navigate('/finance/bank-accounts')}>
                  <td>Unreconciled Entries</td>
                  <td className={styles.alignRight}>{unreconCount} pending</td>
                </tr>
                <tr className={`${styles.totalRow} ${styles.navRow}`} onClick={() => navigate('/finance/bank-accounts')}>
                  <td>Current Bank Balance</td>
                  <td className={styles.alignRight}>{fmt(bankBalance)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* TABLE 6: ASSETS & LIABILITIES */}
        <div className={styles.tableCard}>
          <h3 className={styles.sectionTitle} style={{ padding: '1.5rem 1.5rem 0' }}>Assets & Liabilities</h3>
          <div className={styles.tableWrapper}>
            <table className={styles.dataTable}>
              <thead>
                <tr>
                  <th>Metric</th>
                  <th className={styles.alignRight}>Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr className={styles.navRow} onClick={() => navigate('/finance/vehicle-assets')}>
                  <td>Cars & Machinery</td>
                  <td className={styles.alignRight}>{fmt(assetMachinery)}</td>
                </tr>
                <tr className={styles.navRow} onClick={() => navigate('/finance/general-store-assets')}>
                  <td>Products & Stock</td>
                  <td className={styles.alignRight}>{fmt(assetProducts)}</td>
                </tr>
                <tr className={`${styles.navRow}`} onClick={() => navigate('/finance/tractor-assets')}>
                  <td className={styles.highlight}>Total Assets</td>
                  <td className={`${styles.alignRight} ${styles.highlight}`}>{fmt(assetGrand)}</td>
                </tr>
                <tr className={styles.navRow} onClick={() => navigate('/finance/liabilities')}>
                  <td>Total Liabilities (Owed)</td>
                  <td className={styles.alignRight}>−{fmt(totalOwed)}</td>
                </tr>
                <tr className={`${styles.totalRow} ${styles.navRow}`} onClick={() => navigate('/finance/overview')}>
                  <td>Net Position (Assets - Liab)</td>
                  <td className={styles.alignRight}>{fmt(assetGrand - totalOwed)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};

export default FinanceHome;
