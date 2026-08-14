const fs = require('fs');

const ceoFile = 'd:/SUTANA/frontend/src/pages/ceo/CEOFinance.jsx';
let ceo = fs.readFileSync(ceoFile, 'utf8');

// 1. Add imports and helpers
const imports = `import SegmentedSpinner from '../../components/ui/SegmentedSpinner';
import styles from '../finance/FinanceHome.module.css';

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
    <div className={styles.catBarFill} style={{ background: color, width: \`\${max > 0 ? Math.min(100, (value / max) * 100) : 0}%\` }} />
  </div>
);`;
ceo = ceo.replace("import SegmentedSpinner from '../../components/ui/SegmentedSpinner';", imports);

// 2. Add states and load logic inside component
const loadLogic = `
  /* ── Real Finance Data States ── */
  const [cashbook, setCashbook]   = useState([]);
  const [crvs,     setCrvs]       = useState([]);
  const [pvs,      setPvs]        = useState([]);
  const [banks,    setBanks]      = useState([]);
  const [bankSummary, setBankSummary] = useState(null);
  const [recons,   setRecons]     = useState([]);
  const [receivables, setReceivables] = useState([]);
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
      const [cbRes, crvRes, pvRes, bankRes, bankSumRes, reconRes, rcvRes] = await Promise.allSettled([
        api.get('/finance-cash/cashbook'),
        api.get('/finance-cash/crv'),
        api.get('/finance-cash/pv'),
        api.get('/finance-bank'),
        api.get('/finance-bank/cashbook/summary'),
        api.get('/finance-bank/reconciliations'),
        api.get('/finance-receivables/book'),
      ]);
      if (cbRes.status === 'fulfilled')      setCashbook(cbRes.value?.data || []);
      if (crvRes.status === 'fulfilled')     setCrvs(crvRes.value?.data || []);
      if (pvRes.status === 'fulfilled')      setPvs(pvRes.value?.data || []);
      if (bankRes.status === 'fulfilled')    setBanks(bankRes.value?.data || []);
      if (bankSumRes.status === 'fulfilled') setBankSummary(bankSumRes.value?.data || null);
      if (reconRes.status === 'fulfilled')   setRecons(reconRes.value?.data || []);
      if (rcvRes.status === 'fulfilled')     setReceivables(rcvRes.value?.data || []);
    } catch (err) { }
    setRefreshing(false);
    setFinLoading(false);
  };
`;
ceo = ceo.replace("  const [fundsLoading,setFundsLoading]= useState(false);\n", "  const [fundsLoading,setFundsLoading]= useState(false);\n" + loadLogic);

// Update useEffect to call loadRealFinance
ceo = ceo.replace(
`  /* ── fetch overview ── */
  useEffect(() => {
    api.get('/ceo/finance-overview')
      .then(res => setFinData(res.data))
      .catch(() => setFinData(null))
      .finally(() => setFinLoading(false));
    loadPcvs();
  }, []);`,
`  /* ── fetch overview ── */
  useEffect(() => {
    loadRealFinance();
    loadPcvs();
  }, []);`
);

// 3. Derived values
const derived = `
  /* ── Derived values ── */
  const cbEntries   = Array.isArray(cashbook) ? cashbook : [];
  const crvList     = Array.isArray(crvs)     ? crvs     : [];
  const pvList      = Array.isArray(pvs)      ? pvs      : [];
  const pcvList     = Array.isArray(pcvs)     ? pcvs     : [];
  const rcvList     = Array.isArray(receivables) ? receivables : [];
  const bankList    = Array.isArray(banks)    ? banks    : [];
  const reconList   = Array.isArray(recons)   ? recons   : [];

  const totalReceipts  = cbEntries.reduce((s, e) => s + parseFloat(e.receipts || 0), 0);
  const totalPayments  = cbEntries.reduce((s, e) => s + parseFloat(e.payments || 0), 0);
  const cashBalance    = totalReceipts - totalPayments;
  const crvTotal = crvList.reduce((s, c) => s + parseFloat(c.amount || 0), 0);
  const pvTotal  = pvList.reduce((s, p) => s + parseFloat(p.amount || 0), 0);
  const pcvTotal = pcvList.reduce((s, p) => s + parseFloat(p.amount || 0), 0);
  const bankBalance = bankSummary ? parseFloat(bankSummary.total_balance || bankSummary.balance || 0) : bankList.reduce((s, b) => s + parseFloat(b.balance || b.current_balance || 0), 0);
  
  const totalReceivable    = rcvList.reduce((s, r) => s + parseFloat(r.total_amount || r.amount || 0), 0);
  const settledReceivable  = rcvList.reduce((s, r) => s + parseFloat(r.paid_amount  || r.settled || 0), 0);
  const outstandingBalance = totalReceivable - settledReceivable;
  const unreconCount = reconList.filter(r => r.status !== 'reconciled' && r.status !== 'completed').length;
  
  const recentCB = [...cbEntries].reverse().slice(0, 6);
  const txBreakdown = [
    { name: 'Cash Receipts (CRV)', count: crvList.length, amount: crvTotal, color: G.forest },
    { name: 'Payments (PV)',        count: pvList.length,  amount: pvTotal,  color: G.orange },
    { name: 'Petty Cash (PCV)',     count: pcvList.length, amount: pcvTotal, color: G.purple },
  ].filter(b => b.count > 0);
  const maxBreakdownAmt = Math.max(...txBreakdown.map(b => b.amount), 1);
`;
ceo = ceo.replace("  const td = { padding: '13px 14px', borderBottom: '1px solid #f1f5f9', color: '#334155', fontSize: 13 };\n", "  const td = { padding: '13px 14px', borderBottom: '1px solid #f1f5f9', color: '#334155', fontSize: 13 };\n" + derived);

// 4. UI Replacement
const uiReplacement = `
      {/* ══════════════════ OVERVIEW TAB ══════════════════ */}
      {activeTab === 'Overview' && (
        <div style={{ background: 'transparent' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <div>
              <h2 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', margin: '0 0 4px' }}>Real-Time Finance Overview</h2>
              <p style={{ margin: 0, color: '#64748b', fontSize: 14 }}>Synced directly from the central ledger · {timeString}</p>
            </div>
            <button onClick={loadRealFinance} disabled={refreshing} style={{ background: 'white', border: '1px solid #e2e8f0', padding: '8px 16px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontWeight: 600, color: '#334155' }}>
              {refreshing ? <SegmentedSpinner size={16} /> : <RefreshCw size={16} />}
              Refresh Data
            </button>
          </div>

          {/* ROW 1: KPIs */}
          <div className={styles.kpiGrid}>
            <div className={\`\${styles.kpiCard} \${styles.kpiCardHero}\`}>
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
                {cbEntries.length} verified ledger entries
              </div>
            </div>

            <div className={styles.kpiCard}>
              <div className={styles.kpiTop}>
                <span className={styles.kpiLabel}>CRV Income</span>
                <span className={styles.kpiIcon} style={{ background: 'var(--color-success-bg)' }}>📥</span>
              </div>
              <div className={styles.kpiValue} style={{ color: G.forest }}>{fmtShort(crvTotal)}</div>
              <div className={styles.kpiMeta}>{crvList.length} receipts</div>
              <div className={styles.kpiSub}>Verified cash received</div>
            </div>

            <div className={styles.kpiCard}>
              <div className={styles.kpiTop}>
                <span className={styles.kpiLabel}>PV Payments</span>
                <span className={styles.kpiIcon} style={{ background: 'var(--color-warning-bg)' }}>📤</span>
              </div>
              <div className={styles.kpiValue} style={{ color: G.orange }}>{fmtShort(pvTotal)}</div>
              <div className={styles.kpiMeta}>{pvList.length} vouchers</div>
              <div className={styles.kpiSub}>Verified cash paid out</div>
            </div>

            <div className={styles.kpiCard}>
              <div className={styles.kpiTop}>
                <span className={styles.kpiLabel}>Bank Balance</span>
                <span className={styles.kpiIcon} style={{ background: 'var(--color-info-bg)' }}>🏦</span>
              </div>
              <div className={styles.kpiValue} style={{ color: G.blue }}>{fmtShort(bankBalance)}</div>
              <div className={styles.kpiMeta}>{bankList.length} account{bankList.length !== 1 ? 's' : ''}</div>
              <div className={styles.kpiSub}>Total bank liquidity</div>
            </div>
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
                  { label: 'Bank Accounts',    val: \`\${bankList.length} accounts\`,      icon: '🏦', bg: 'var(--color-info-bg)', c: G.blue },
                  { label: 'Bank Balance',     val: fmtShort(bankBalance),              icon: '💳', bg: 'var(--color-success-bg)', c: G.forest },
                  { label: 'Unreconciled',     val: \`\${unreconCount} pending\`,          icon: unreconCount > 0 ? '⚠️' : '✅', bg: unreconCount > 0 ? 'var(--color-danger-bg)' : 'var(--color-success-bg)', c: unreconCount > 0 ? G.red : G.forest },
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
        </div>
      )}`;

const startIndex = ceo.indexOf("{/* ══════════════════ OVERVIEW TAB ══════════════════ */}");
const endIndex = ceo.indexOf("{/* ══════════════════ PCV APPROVALS TAB ══════════════════ */}");

ceo = ceo.substring(0, startIndex) + uiReplacement + '\n\n      ' + ceo.substring(endIndex);

fs.writeFileSync(ceoFile, ceo);
console.log('Update applied to CEOFinance.jsx successfully!');
