import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/apiClient';

/* ─── Color Palette ─────────────────────────────────────────────────────── */
const G = {
  forest: '#228B22', dark: '#1B5E20', emerald: '#2E8B57', leaf: '#4CAF50',
  sage: '#A5D6A7', olive: '#6B8E23', lime: '#8BC34A', brown: '#8D6E63',
  sky: '#87CEEB', white: '#FFFFFF', light: '#F5F5F5', darkGray: '#424242',
  orange: '#FF9800', red: '#F44336', purple: '#7C3AED', blue: '#3b82f6'
};

const COLORS_ARR = [G.forest, G.orange, G.sky, G.purple, G.emerald, G.brown, G.blue];

const fmt = (n) => 'ETB ' + Number(n || 0).toLocaleString('en-ET', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtShort = (n) => {
  const v = Number(n || 0);
  if (v >= 1000000) return 'ETB ' + (v / 1000000).toFixed(1) + 'M';
  if (v >= 1000) return 'ETB ' + (v / 1000).toFixed(1) + 'K';
  return 'ETB ' + v.toFixed(2);
};

/* ─── Global Animations ─────────────────────────────────────────────────── */
const GlobalStyles = () => (
  <style>{`
    @keyframes floatLeaf { 0%,100% { transform: translateY(0) rotate(0deg); } 50% { transform: translateY(-14px) rotate(7deg); } }
    @keyframes fadeUp { from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)} }
    @keyframes spin { from{transform:rotate(0deg)}to{transform:rotate(360deg)} }
    @keyframes laserSweep { 0% { left: -150%; } 100% { left: 150%; } }
    @keyframes colorBlink { 0% { color:#228B22; filter:drop-shadow(0 0 6px #228B2288); transform:scale(1) rotate(0deg); } 25% { color:#8BC34A; filter:drop-shadow(0 0 10px #8BC34Acc); transform:scale(1.15) rotate(10deg); } 50% { color:#2E8B57; filter:drop-shadow(0 0 14px #2E8B57); transform:scale(1.3) rotate(-10deg); } 75% { color:#87CEEB; filter:drop-shadow(0 0 10px #87CEEBcc); transform:scale(1.15) rotate(5deg); } 100% { color:#228B22; filter:drop-shadow(0 0 6px #228B2288); transform:scale(1) rotate(0deg); } }
    .blink-star { animation: colorBlink 2.5s infinite ease-in-out; display:inline-block; }
    .artistic-3d-title { font-size:3rem; font-weight:900; color:#1B5E20; letter-spacing:-0.02em; text-shadow:1px 1px 0 #fff, 2px 2px 0 #fff, 3px 3px 0 #fff, 4px 4px 0 #228B22, 5px 5px 0 #228B22, 6px 6px 0 #2E8B57, 7px 7px 0 #2E8B57, 8px 8px 15px rgba(0,0,0,0.2); margin:0; display:flex; align-items:center; gap:12px; line-height:1.1; }
    .artistic-3d-subtitle { font-size:1rem; color:#2E8B57; font-weight:800; text-align:center; text-transform:uppercase; letter-spacing:0.15em; margin:0; text-shadow:1px 1px 0px rgba(255,255,255,0.9); }
    .btn-sync { position: relative; background: #FFFFFF; color: #1B5E20; border: none; padding: 10px 24px; border-radius: 8px; font-weight: 800; font-size: 14px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; overflow: hidden; z-index: 1; box-shadow: 0 4px 10px rgba(0,0,0,0.05); text-transform: uppercase; letter-spacing: 1.5px; }
    .btn-sync::before { content: ''; position: absolute; top: -100%; left: -100%; width: 300%; height: 300%; background: conic-gradient(transparent, transparent, transparent, #4CAF50, #228B22); animation: rotate-border 2s linear infinite; z-index: -2; }
    .btn-sync::after { content: ''; position: absolute; inset: 2px; background: #FFFFFF; border-radius: 6px; z-index: -1; }
    .btn-sync:hover::after { background: #F5F5F5; }
    .btn-sync:active { transform: scale(0.97); }
    @keyframes rotate-border { 100% { transform: rotate(360deg); } }
    .d-card { --hover-color: #2E8B57; position:relative; overflow:hidden; background-color:white; border-radius:0; padding:26px; box-shadow:0 2px 14px rgba(0,80,120,0.08); transition:background-size 0.4s cubic-bezier(.4,0,.2,1), box-shadow 0.4s, transform 0.4s; animation:fadeUp 0.5s ease both; border:none; cursor:pointer; background-image: linear-gradient(to right, var(--hover-color), var(--hover-color)), linear-gradient(to bottom, var(--hover-color), var(--hover-color)), linear-gradient(to left, var(--hover-color), var(--hover-color)), linear-gradient(to top, var(--hover-color), var(--hover-color)); background-position: 0 0, 100% 0, 100% 100%, 0 100%; background-repeat: no-repeat; background-size: 0% 4px, 4px 0%, 0% 4px, 4px 0%; }
    .d-card::before { content:''; position:absolute; top:0; left:-150%; width:100%; height:100%; background:linear-gradient(90deg, transparent 0%, rgba(0,255,255,0.4) 20%, rgba(255,0,255,0.4) 50%, rgba(0,255,0,0.4) 80%, transparent 100%); transform:skewX(-25deg); pointer-events:none; z-index:1; }
    .d-card:hover { transform:translateY(-4px); box-shadow:0 10px 30px rgba(0,80,120,0.14), 0 0 18px var(--hover-color); background-size: 100% 4px, 4px 100%, 100% 4px, 4px 100%; }
    .d-card:hover::before { animation: laserSweep 0.8s ease-out; }
    .d-card-no-hover { --hover-color: #228B22; position:relative; overflow:hidden; background:white; border-radius:0; padding:26px; box-shadow:0 2px 14px rgba(0,80,120,0.08); transition:background-size 0.4s cubic-bezier(.4,0,.2,1), box-shadow 0.4s; animation:fadeUp 0.5s ease both; background-image: linear-gradient(to right, var(--hover-color), var(--hover-color)), linear-gradient(to bottom, var(--hover-color), var(--hover-color)), linear-gradient(to left, var(--hover-color), var(--hover-color)), linear-gradient(to top, var(--hover-color), var(--hover-color)); background-position: 0 0, 100% 0, 100% 100%, 0 100%; background-repeat: no-repeat; background-size: 0% 4px, 4px 0%, 0% 4px, 4px 0%; }
    .d-card-no-hover::before { content:''; position:absolute; top:0; left:-150%; width:100%; height:100%; background:linear-gradient(90deg, transparent 0%, rgba(0,255,255,0.2) 20%, rgba(255,0,255,0.2) 50%, rgba(0,255,0,0.2) 80%, transparent 100%); transform:skewX(-25deg); pointer-events:none; z-index:1; }
    .d-card-no-hover:hover { box-shadow:0 6px 20px rgba(0,80,120,0.12), 0 0 14px var(--hover-color); background-size: 100% 4px, 4px 100%, 100% 4px, 4px 100%; }
    .d-card-no-hover:hover::before { animation: laserSweep 1s ease-out; }
    .alert-row { position:relative; overflow:hidden; display:flex; align-items:center; gap:14px; padding:13px 16px; background:rgba(230,242,235,0.5); border-radius:0; cursor:pointer; transition:all 0.25s; border:1.5px solid transparent; margin-bottom:10px; }
    .alert-row::before { content:''; position:absolute; top:0; left:-150%; width:100%; height:100%; background:linear-gradient(90deg, transparent, rgba(255,0,255,0.3), rgba(0,255,255,0.3), transparent); transform:skewX(-25deg); pointer-events:none; z-index:1; }
    .alert-row:hover { background:white; border-color:var(--row-c); transform:translateX(4px); box-shadow:0 4px 14px rgba(0,0,0,0.08); }
    .alert-row:hover::before { animation: laserSweep 0.6s ease-in-out; }
    .cat-row { position:relative; overflow:hidden; display:grid; grid-template-columns:160px 1fr 120px; gap:12px; align-items:center; padding:11px 14px; border-radius:0; transition:background 0.2s; cursor:pointer; }
    .cat-row::before { content:''; position:absolute; top:0; left:-150%; width:100%; height:100%; background:linear-gradient(90deg, transparent, rgba(0,255,0,0.2), rgba(0,255,255,0.2), transparent); transform:skewX(-25deg); pointer-events:none; z-index:1; }
    .cat-row:hover { background:rgba(230,242,235,0.6); box-shadow:0 2px 8px rgba(0,80,120,0.05); }
    .cat-row:hover::before { animation: laserSweep 0.6s ease-in-out; }
    .top-row { position:relative; overflow:hidden; display:flex; align-items:center; gap:12px; padding:11px 14px; border-radius:0; background:rgba(230,242,235,0.45); margin-bottom:8px; transition:all 0.2s; cursor:pointer; }
    .top-row::before { content:''; position:absolute; top:0; left:-150%; width:100%; height:100%; background:linear-gradient(90deg, transparent, rgba(107,142,35,0.3), rgba(107,142,35,0.3), transparent); transform:skewX(-25deg); pointer-events:none; z-index:1; }
    .top-row:hover { background:white; box-shadow:0 3px 12px rgba(0,80,120,0.09); border:1px solid rgba(107,142,35,0.4); }
    .top-row:hover::before { animation: laserSweep 0.6s ease-in-out; }
    .qa-card { --hover-color: #2E8B57; --base-top: transparent; position:relative; overflow:hidden; background:rgba(255,255,255,0.65); border-radius:0; padding:22px 16px; text-align:center; cursor:pointer; transition:all 0.4s cubic-bezier(.4,0,.2,1); border:none; background-image: linear-gradient(to right, var(--hover-color), var(--hover-color)), linear-gradient(to bottom, var(--hover-color), var(--hover-color)), linear-gradient(to left, var(--hover-color), var(--hover-color)), linear-gradient(to top, var(--hover-color), var(--hover-color)), linear-gradient(to right, var(--base-top), var(--base-top)); background-position: 0 0, 100% 0, 100% 100%, 0 100%, 0 0; background-repeat: no-repeat; background-size: 0% 4px, 4px 0%, 0% 4px, 4px 0%, 100% 4px; }
    .qa-card::before { content:''; position:absolute; top:0; left:-150%; width:100%; height:100%; background:linear-gradient(90deg, transparent, rgba(0,255,255,0.6), rgba(255,0,255,0.6), transparent); transform:skewX(-25deg); pointer-events:none; z-index:1; }
    .qa-card:hover { transform:translateY(-3px); box-shadow:0 8px 20px rgba(0,80,120,0.12), 0 0 14px var(--hover-color); background-size: 100% 4px, 4px 100%, 100% 4px, 4px 100%, 100% 4px; }
    .qa-card:hover::before { animation: laserSweep 0.6s ease-out; }
  `}</style>
);

const DecorPlants = () => (
  <>
    <GlobalStyles />
    {[
      { e:'🍃', sz:55, op:0.22, top:'1%',    left:'0.5%'  },
      { e:'🌿', sz:48, op:0.18, top:'0%',    right:'0.5%' },
      { e:'🌾', sz:52, op:0.20, bottom:'1%', left:'0.5%'  },
      { e:'🍃', sz:50, op:0.18, bottom:'0%', right:'0.5%' },
    ].map((p,i) => (
      <span key={i} style={{ position:'fixed', fontSize: p.sz, opacity: p.op, top: p.top, left: p.left, right: p.right, bottom: p.bottom, pointerEvents:'none', userSelect:'none', animation:`floatLeaf ${9+i*1.5}s ease-in-out infinite`, animationDelay:`${i*1.2}s`, zIndex:0 }}>{p.e}</span>
    ))}
  </>
);

const CategoryBar = ({ value, max, color }) => (
  <div style={{ background: 'rgba(255,255,255,0.45)', borderRadius: 0, height: 7, overflow: 'hidden', flex: 1 }}>
    <div style={{ height: '100%', borderRadius: 0, background: color, width: \`\${max > 0 ? Math.min(100, (value / max) * 100) : 0}%\`, transition: 'width 1.2s ease' }} />
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
    <div style={{ margin: '-24px', padding: '2.5rem', minHeight: 'calc(100vh - 64px)', background: '#E8F4EC', fontFamily: "'Inter','Segoe UI',sans-serif", overflowX: 'hidden' }}>
      <DecorPlants />

      {/* ── HEADER ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', marginBottom: '2.5rem', marginTop: '0.5rem', animation: 'fadeUp 0.35s ease', width: '100%', position:'relative', zIndex:1 }}>
        <div style={{ justifySelf: 'start' }}>
          <h1 className="artistic-3d-title">
            Welcome! &nbsp;<span className="blink-star">🌿</span>
          </h1>
        </div>
        <div style={{ justifySelf: 'center' }}>
          <p className="artistic-3d-subtitle">
            FINANCE COMMAND CENTER · IT'S {timeString}
          </p>
        </div>
        <div style={{ justifySelf: 'end' }}>
          <button onClick={load} className="btn-sync" disabled={refreshing} style={{ opacity: refreshing ? 0.7 : 1 }}>
            <span style={{ display:'inline-block', animation: refreshing ? 'spin 1s linear infinite' : 'none' }}>🔄</span>
            SYNC
          </button>
        </div>
      </div>

      {/* ── ROW 1: 4 KPI HERO CARDS ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '2.5fr 1fr 1fr 1fr', gap: 18, marginBottom: 18, position:'relative', zIndex:1 }}>

        {/* Cash Balance Hero */}
        <div className="d-card" onClick={() => nav('/finance/cash-book')}
          style={{ background: \`linear-gradient(135deg,\${G.forest} 0%,\${G.dark} 100%)\`, color: 'white', position: 'relative', overflow: 'hidden', animationDelay: '0.05s' }}>
          <div style={{ position: 'absolute', right: -20, top: -20, width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
          <div style={{ position: 'absolute', right: 20, top: 20, background: 'rgba(255,255,255,0.18)', borderRadius: 0, padding: 12 }}>
            <span style={{ fontSize: 24 }}>📓</span>
          </div>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.8, marginBottom: 6 }}>Cash Book Balance</div>
          <div style={{ fontSize: cashBalance >= 100000 ? '2rem' : '2.6rem', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1, marginBottom: 10 }}>
            {fmtShort(cashBalance)}
          </div>
          <div style={{ display: 'flex', gap: 20, fontSize: 12, fontWeight: 700, opacity: 0.85 }}>
            <span>📥 In: {fmtShort(totalReceipts)}</span>
            <span>📤 Out: {fmtShort(totalPayments)}</span>
          </div>
          <div style={{ marginTop: 8, fontSize: 12, opacity: 0.75 }}>
            👋 Hello, {firstName} — {cbEntries.length} ledger entries
          </div>
        </div>

        {/* Total CRV Income */}
        <div className="d-card" style={{ animationDelay: '0.1s' }} onClick={() => nav('/finance/crv')}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: G.forest, textTransform: 'uppercase', letterSpacing: '0.07em' }}>CRV Income</span>
            <div style={{ background: '#E6F2EB', borderRadius: 0, padding: 8 }}><span style={{ fontSize:18 }}>📥</span></div>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 900, color: G.dark, margin: '10px 0 4px' }}>{fmtShort(crvTotal)}</div>
          <div style={{ fontSize: 12, color: G.forest, fontWeight: 700 }}>{crvList.length} receipts</div>
          <div style={{ fontSize: 11, color: G.olive, fontWeight: 600, marginTop: 2 }}>Cash received</div>
        </div>

        {/* Total PV Payments */}
        <div className="d-card" style={{ animationDelay: '0.15s' }} onClick={() => nav('/finance/pv')}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: G.orange, textTransform: 'uppercase', letterSpacing: '0.07em' }}>PV Payments</span>
            <div style={{ background: '#FFF4EB', borderRadius: 0, padding: 8 }}><span style={{ fontSize:18 }}>📤</span></div>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 900, color: G.dark, margin: '10px 0 4px' }}>{fmtShort(pvTotal)}</div>
          <div style={{ fontSize: 12, color: G.orange, fontWeight: 700 }}>{pvList.length} vouchers</div>
          <div style={{ fontSize: 11, color: G.olive, fontWeight: 600, marginTop: 2 }}>Cash paid out</div>
        </div>

        {/* Bank Balance */}
        <div className="d-card" style={{ animationDelay: '0.2s' }} onClick={() => nav('/finance/bank-accounts')}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: G.blue, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Bank Balance</span>
            <div style={{ background: '#EFF6FF', borderRadius: 0, padding: 8 }}><span style={{ fontSize:18 }}>🏦</span></div>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 900, color: G.dark, margin: '10px 0 4px' }}>{fmtShort(bankBalance)}</div>
          <div style={{ fontSize: 12, color: G.blue, fontWeight: 700 }}>{bankList.length} account{bankList.length !== 1 ? 's' : ''}</div>
          <div style={{ fontSize: 11, color: G.olive, fontWeight: 600, marginTop: 2 }}>All bank accounts</div>
        </div>
      </div>

      {/* ── ROW 2: TRANSACTION BREAKDOWN + RECENT CASH LEDGER ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 18, marginBottom: 18, position:'relative', zIndex:1 }}>

        {/* Transaction Type Breakdown */}
        <div className="d-card-no-hover" style={{ animationDelay: '0.25s' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
            <span style={{ fontSize:18 }}>📊</span>
            <span style={{ fontSize: 16, fontWeight: 900, color: G.dark }}>Transaction Breakdown</span>
            <span style={{ marginLeft: 'auto', fontSize: 11, color: G.olive, fontWeight: 700 }}>Cash Book summary</span>
          </div>

          {/* Sub-KPIs row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 18 }}>
            {[
              { label: 'CB Entries',    val: cbEntries.length,  icon: '📓', c: G.forest },
              { label: 'Receivables',   val: rcvList.length,    icon: '📋', c: G.orange },
              { label: 'Unrecon.',      val: unreconCount,      icon: '⚖️', c: unreconCount > 0 ? G.red : G.emerald },
              { label: 'Petty Cash',    val: pcvList.length,    icon: '💰', c: G.purple },
            ].map(k => (
              <div key={k.label} style={{ background: 'rgba(255,255,255,0.55)', borderRadius: 0, padding: '12px 14px', border: \`1.5px solid \${k.c}22\` }}>
                <div style={{ fontSize: 18, marginBottom: 6 }}>{k.icon}</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 900, color: k.c }}>{k.val}</div>
                <div style={{ fontSize: 10, fontWeight: 700, color: G.olive, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{k.label}</div>
              </div>
            ))}
          </div>

          {/* Header row */}
          <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr 120px', gap: 12, padding: '4px 14px', marginBottom: 6 }}>
            {['Document Type', '', 'Amount (ETB)'].map(h => (
              <div key={h} style={{ fontSize: 10, fontWeight: 800, color: G.emerald, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{h}</div>
            ))}
          </div>

          {txBreakdown.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '28px 0', color: G.olive, fontSize: 13 }}>No transaction data yet — connect to backend</div>
          ) : txBreakdown.map((row) => (
            <div key={row.name} className="cat-row" onClick={() => nav('/finance/cash-book')}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 10, height: 10, borderRadius: 0, background: row.color, flexShrink: 0 }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: G.dark }}>{row.name}</span>
              </div>
              <CategoryBar value={row.amount} max={maxBreakdownAmt} color={row.color} />
              <span style={{ fontSize: 12, fontWeight: 700, color: row.color, textAlign: 'right', whiteSpace: 'nowrap' }}>{fmtShort(row.amount)}</span>
            </div>
          ))}
        </div>

        {/* Recent Cash Book Entries */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div className="d-card-no-hover" style={{ flex: 1, animationDelay: '0.3s' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <span style={{ fontSize:18 }}>📜</span>
              <span style={{ fontSize: 15, fontWeight: 900, color: G.dark }}>Recent Ledger Entries</span>
            </div>
            {recentCB.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px 0', color: G.olive, fontSize: 13 }}>
                <span style={{ fontSize:28, opacity: 0.4 }}>📉</span><br />No entries yet
              </div>
            ) : recentCB.map((entry, i) => {
              const isReceipt = parseFloat(entry.receipts || 0) > 0;
              const c   = isReceipt ? G.forest : G.orange;
              const icon = isReceipt ? '📥' : '📤';
              const amt  = isReceipt ? entry.receipts : entry.payments;
              return (
                <div key={entry.id || i} className="top-row" onClick={() => nav('/finance/cash-book')}>
                  <div style={{ width: 32, height: 32, borderRadius: 0, background: \`\${c}22\`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: 14 }}>{icon}</span>
                  </div>
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: G.dark, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {entry.reference && <span style={{ color: G.emerald, marginRight: 6 }}>{entry.reference}</span>}
                      {entry.description || entry.type || 'Entry'}
                    </div>
                    <div style={{ fontSize: 10, color: G.olive }}>{entry.date ? new Date(entry.date).toLocaleDateString('en-GB', { day:'2-digit', month:'short' }) : ''}</div>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 800, color: c, whiteSpace: 'nowrap' }}>
                    {fmtShort(amt)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── ROW 3: RECEIVABLES + BANK RECONCILIATION + QUICK ACTIONS ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: 18, marginBottom: 18, position:'relative', zIndex:1 }}>

        {/* Receivables Summary */}
        <div className="d-card-no-hover" style={{ animationDelay: '0.35s' }}>
          <div style={{ fontSize: 15, fontWeight: 900, color: G.dark, marginBottom: 14 }}>📋 Receivable Book</div>
          <div style={{ fontSize: 11, color: G.olive, marginBottom: 12, fontWeight: 600, textTransform: 'uppercase' }}>Outstanding Balances</div>
          {[
            { label: 'Total Invoiced',   val: fmt(totalReceivable),    icon: '📄', bg: '#EFF6FF', c: G.blue,    path: '/finance/outstanding-ar' },
            { label: 'Amount Settled',   val: fmt(settledReceivable),  icon: '✅', bg: '#F0FDF4', c: G.forest,  path: '/finance/outstanding-ar' },
            { label: 'Outstanding',      val: fmt(outstandingBalance), icon: '⏳', bg: outstandingBalance > 0 ? '#FEF2F2' : '#F0FDF4', c: outstandingBalance > 0 ? G.red : G.forest, path: '/finance/outstanding-ar' },
          ].map(row => (
            <div key={row.label} className="alert-row" style={{ '--row-c': row.c }} onClick={() => nav(row.path)}>
              <div style={{ background: row.bg, padding: 9, borderRadius: 0 }}><span style={{ fontSize: 16 }}>{row.icon}</span></div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: G.dark }}>{row.label}</div>
                <div style={{ fontSize: 13, color: row.c, fontWeight: 900 }}>{row.val}</div>
              </div>
            </div>
          ))}
          <div style={{ marginTop: 8, fontSize: 11, color: G.olive }}>{rcvList.length} receivable books</div>
        </div>

        {/* Bank Reconciliation */}
        <div className="d-card-no-hover" style={{ animationDelay: '0.4s' }}>
          <div style={{ fontSize: 15, fontWeight: 900, color: G.dark, marginBottom: 14 }}>⚖️ Bank Reconciliation</div>
          <div style={{ fontSize: 11, color: G.olive, marginBottom: 12, fontWeight: 600, textTransform: 'uppercase' }}>Accounts Status</div>
          {[
            { label: 'Bank Accounts',    val: \`\${bankList.length} accounts\`,      icon: '🏦', bg: '#EFF6FF', c: G.blue,   path: '/finance/bank-accounts' },
            { label: 'Bank Balance',     val: fmtShort(bankBalance),              icon: '💳', bg: '#E6F2EB', c: G.forest, path: '/finance/bank-accounts' },
            { label: 'Unreconciled',     val: \`\${unreconCount} pending\`,          icon: unreconCount > 0 ? '⚠️' : '✅', bg: unreconCount > 0 ? '#FEF2F2' : '#F0FDF4', c: unreconCount > 0 ? G.red : G.forest, path: '/finance/bank-accounts' },
          ].map(row => (
            <div key={row.label} className="alert-row" style={{ '--row-c': row.c }} onClick={() => nav(row.path)}>
              <div style={{ background: row.bg, padding: 9, borderRadius: 0 }}><span style={{ fontSize: 16 }}>{row.icon}</span></div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: G.dark }}>{row.label}</div>
                <div style={{ fontSize: 13, color: row.c, fontWeight: 900 }}>{row.val}</div>
              </div>
            </div>
          ))}
          <div style={{ marginTop: 8, fontSize: 11, color: G.olive }}>{reconList.length} reconciliation records</div>
        </div>

        {/* Quick Actions */}
        <div className="d-card-no-hover" style={{ animationDelay: '0.45s' }}>
          <div style={{ fontSize: 15, fontWeight: 900, color: G.dark, marginBottom: 16 }}>⚡ Quick Operations</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
            {[
              { label: 'CRV',         sub: 'Receipts',  icon: '💵', bg: '#E6F2EB', color: G.forest,  href: '/finance/crv' },
              { label: 'PV',          sub: 'Payments',  icon: '💸', bg: '#E8F9F1', color: G.emerald, href: '/finance/pv' },
              { label: 'PCV',         sub: 'Petty Cash',icon: '💰', bg: '#FFF3E0', color: G.orange,  href: '/finance/pcv' },
              { label: 'Cash Book',   sub: 'Ledger',    icon: '📓', bg: '#F1F8E9', color: G.olive,   href: '/finance/cash-book' },
              { label: 'Bank',        sub: 'Accounts',  icon: '🏦', bg: '#EFF6FF', color: G.blue,    href: '/finance/bank-accounts' },
              { label: 'Receivables', sub: 'Book',      icon: '📋', bg: '#F3E5F5', color: G.purple,  href: '/finance/outstanding-ar' },
              { label: 'P&L',         sub: 'Report',    icon: '📈', bg: '#E1F5FE', color: G.sky,     href: '/finance/profit-loss' },
              { label: 'Reports',     sub: 'Hub',       icon: '📊', bg: '#EFEBE9', color: G.brown,   href: '/finance/reports-hub' },
            ].map((a, i) => (
              <div key={a.label} className="qa-card" onClick={() => nav(a.href)} style={{ animationDelay: \`\${0.45 + i * 0.04}s\` }}>
                <div style={{ width: 46, height: 46, borderRadius: 0, background: a.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px', color: a.color }}>
                  <span style={{ fontSize:22 }}>{a.icon}</span>
                </div>
                <div style={{ fontSize: 12, fontWeight: 800, color: G.dark, marginBottom: 2 }}>{a.label}</div>
                <div style={{ fontSize: 10, color: G.olive, fontWeight: 600 }}>{a.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinanceHome;
