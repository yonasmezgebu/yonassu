import React, { useState, useEffect, useCallback } from 'react';
import {
  Landmark, Plus, RefreshCw, Wallet, Smartphone, Building2,
  CheckCircle2, RotateCcw, Edit3, PowerOff, Eye, X, TrendingUp,
  TrendingDown, DollarSign, ArrowUpCircle, ArrowDownCircle, Printer,
  AlertCircle, Info, CheckCircle, AlertTriangle
} from 'lucide-react';
import apiClient from '../../services/apiClient';

/* ─── helpers ─────────────────────────────────────────────────────────────── */
const fmt  = (v, d = 2) => parseFloat(v||0).toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d });
const fmtD = (v) => v ? new Date(v).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' }) : '—';

const TYPE_META = {
  Bank:            { icon: <Building2  size={16}/>, color: '#2563eb', bg: '#eff6ff', dark: '#1e40af' },
  Cash:            { icon: <Wallet      size={16}/>, color: '#16a34a', bg: '#f0fdf4', dark: '#15803d' },
  'Mobile Wallet': { icon: <Smartphone size={16}/>, color: '#7c3aed', bg: '#f5f3ff', dark: '#6d28d9' },
};
const CURRENCIES = ['ETB', 'USD', 'EUR'];
const STATUS_C = { Active: ['#16a34a','#dcfce7'], Inactive: ['#dc2626','#fee2e2'] };

/* ─── Pill ────────────────────────────────────────────────────────────────── */
const Pill = ({ label, color, bg }) => (
  <span style={{ background:bg, color, padding:'2px 10px', borderRadius:99, fontSize:11, fontWeight:700, whiteSpace:'nowrap' }}>{label}</span>
);

/* ─── In-app notification toast ──────────────────────────────────────────── */
const Toast = ({ toasts }) => (
  <div style={{ position:'fixed', top:20, right:20, zIndex:9999, display:'flex', flexDirection:'column', gap:10, pointerEvents:'none' }}>
    {toasts.map(t => {
      const cfg = {
        success: { bg:'#16a34a', icon:<CheckCircle size={16}/> },
        error:   { bg:'#dc2626', icon:<AlertCircle size={16}/> },
        info:    { bg:'#2563eb', icon:<Info size={16}/> },
        warning: { bg:'#d97706', icon:<AlertTriangle size={16}/> },
      }[t.type] || { bg:'#475569', icon:<Info size={16}/> };
      return (
        <div key={t.id} style={{ background:cfg.bg, color:'white', padding:'12px 18px', borderRadius:10, display:'flex', alignItems:'center', gap:10, fontSize:13, fontWeight:600, boxShadow:'0 4px 20px rgba(0,0,0,.2)', minWidth:280, maxWidth:420, pointerEvents:'all', animation:'slideIn .25s ease' }}>
          {cfg.icon}
          <span style={{ flex:1 }}>{t.msg}</span>
        </div>
      );
    })}
  </div>
);

/* ─── Shared atoms ────────────────────────────────────────────────────────── */
const Lbl = ({ children, req }) => (
  <label style={{ display:'block', fontSize:12, fontWeight:700, color:'#475569', marginBottom:5 }}>
    {children}{req && <span style={{ color:'#ef4444' }}> *</span>}
  </label>
);
const Inp = ({ style, ...p }) => (
  <input style={{ width:'100%', padding:'9px 12px', border:'1px solid #cbd5e1', borderRadius:7, boxSizing:'border-box', fontSize:13, ...style }} {...p} />
);
const Sel = ({ children, style, ...p }) => (
  <select style={{ width:'100%', padding:'9px 12px', border:'1px solid #cbd5e1', borderRadius:7, boxSizing:'border-box', fontSize:13, background:'white', ...style }} {...p}>{children}</select>
);
const Card = ({ children, style, onMouseEnter, onMouseLeave, onClick }) => (
  <div onClick={onClick} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave} style={{ background:'white', borderRadius:12, border:'1px solid #e2e8f0', boxShadow:'0 1px 4px rgba(0,0,0,.05)', ...style }}>{children}</div>
);

const TabBtn = ({ id, label, tab, setTab }) => (
  <button type="button" onClick={() => setTab(id)} style={{ padding:'9px 22px', fontWeight:700, fontSize:13, borderRadius:8, cursor:'pointer', border:'none', background: tab===id ? '#1e293b' : 'transparent', color: tab===id ? 'white' : '#64748b', transition:'all .15s' }}>
    {label}
  </button>
);

/* ─── 4-Panel Reconciliation Summary ─────────────────────────────────────── */
/* Each panel shows ERP balance and lets user enter actual balance per type.  */
/* One single TOTAL DIFFERENCE = Total ERP - (Cash+Bank+Telebirr actuals).   */
const TypePanel = ({ label, icon, color, bg, erpBal, actualVal, onActualChange }) => (
  <Card style={{ padding:20 }}>
    <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
      <div style={{ width:38, height:38, borderRadius:9, background:bg, display:'flex', alignItems:'center', justifyContent:'center', color }}>{icon}</div>
      <div style={{ fontWeight:800, fontSize:14, color:'#0f172a' }}>{label}</div>
    </div>
    <div style={{ marginBottom:12 }}>
      <div style={{ fontSize:10, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', marginBottom:4 }}>ERP Balance (Cashbook)</div>
      <div style={{ fontSize:22, fontWeight:900, color:'#0f172a' }}>ETB {fmt(erpBal)}</div>
    </div>
    <div>
      <div style={{ fontSize:10, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', marginBottom:6 }}>Actual Balance</div>
      <input type="number" step="0.01" value={actualVal} onChange={e => onActualChange(e.target.value)}
        placeholder="Enter physical balance"
        style={{ width:'100%', padding:'9px 12px', border:'2px solid ' + (actualVal !== '' ? color : '#cbd5e1'), borderRadius:8, fontSize:14, fontWeight:700, boxSizing:'border-box', outline:'none', color:'#0f172a' }}/>
    </div>
  </Card>
);

/* ─── Main Component ──────────────────────────────────────────────────────── */
const FinanceBankAccounts = () => {
  const [tab, setTab]         = useState('overview');
  const [accounts, setAccounts]   = useState([]);
  const [summary, setSummary]     = useState(null);
  const [cashbook, setCashbook]   = useState([]);
  const [reconciliations, setReconciliations] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [toasts, setToasts]       = useState([]);

  // ── per-type cashbook sums (the live ERP values per account type) ──────────
  const [typeBalances, setTypeBalances] = useState({ cash: 0, bank: 0, telebirr: 0, total: 0 });

  // Account form
  const [showForm, setShowForm]   = useState(false);
  const [editAcc, setEditAcc]     = useState(null);
  const BLANK = { account_name:'', account_type:'Bank', bank_provider:'', account_number:'', branch:'', currency:'ETB', opening_balance:'', opening_balance_date: new Date().toISOString().slice(0,10), description:'' };
  const [form, setForm] = useState(BLANK);

  // Reconcile — single-account mode
  const [reconAcc, setReconAcc]   = useState(null);
  const [reconFrom, setReconFrom] = useState('');
  const [reconTo, setReconTo]     = useState(new Date().toISOString().slice(0,10));
  const [actualBalance, setActualBalance] = useState('');
  const [reconNotes, setReconNotes] = useState('');
  const [reconItems, setReconItems] = useState([]);
  const [reconErpBal, setReconErpBal] = useState(0);
  const [loadingTx, setLoadingTx] = useState(false);
  const [saving, setSaving]       = useState(false);

  // 4-panel reconciliation actual values
  const [panelActuals, setPanelActuals] = useState({ cash:'', bank:'', telebirr:'', total:'' });

  // View transactions modal
  const [viewAcc, setViewAcc]     = useState(null);
  const [viewTx, setViewTx]       = useState([]);

  // Expanded recon row in history
  const [expandedRecon, setExpandedRecon] = useState(null);
  const [expandedItems, setExpandedItems] = useState([]);

  // Printing
  const historyPrintRef = React.useRef(null);
  const printHistory = () => {
    if (!historyPrintRef.current) return;
    const content = historyPrintRef.current.innerHTML;
    const w = window.open('', '_blank');
    w.document.write(`
      <html>
        <head>
          <title>Reconciliation History</title>
          <style>
            body { font-family: 'Inter', sans-serif; color: #0f172a; padding: 40px; margin: 0; }
            h2 { margin-top: 0; margin-bottom: 20px; font-size: 24px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 13px; }
            th, td { border: 1px solid #cbd5e1; padding: 10px; text-align: left; }
            th { background: #f8fafc; font-weight: bold; color: #475569; text-transform: uppercase; font-size: 11px; }
            .right { text-align: right; }
            .global-row { background: #f1f5f9; font-weight: bold; border-top: 2px solid #94a3b8; }
            .diff-ok { color: #16a34a; font-weight: bold; }
            .diff-err { color: #dc2626; font-weight: bold; }
          </style>
        </head>
        <body>
          <h2>Reconciliation History</h2>
          ${content}
        </body>
      </html>
    `);
    w.document.close();
    setTimeout(() => { w.print(); }, 250);
  };

  // toast helper
  const toast = useCallback((msg, type = 'info', duration = 4000) => {
    const id = Date.now();
    setToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), duration);
  }, []);

  /* ── fetch ── */
  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [acRes, cbRes, rnRes] = await Promise.all([
        apiClient.get('/finance-bank'),
        apiClient.get('/finance-bank/cashbook/summary'),
        apiClient.get('/finance-bank/reconciliations'),
      ]);
      const accs = acRes?.data || [];
      const cb   = cbRes?.data || [];
      setAccounts(accs);
      setSummary(cbRes?.summary || null);
      setCashbook(cb);
      setReconciliations(rnRes?.data || []);

      // ── Compute live ERP balances per account type from cashbook ────────────
      // CRVs contribute to receipts, PVs and PCVs contribute to payments.
      // We tag each cashbook row with its account type by looking at the reference prefix.
      const cashRows     = cb.filter(r => r.payment_method === 'Cash' || (!r.payment_method && r.type !== 'BANK' && r.type !== 'TELEBIRR'));
      const bankRows     = cb.filter(r => (r.payment_method || '').toLowerCase() === 'bank');
      const telebirrRows = cb.filter(r => (r.payment_method || '').toLowerCase().includes('telebirr') || (r.payment_method || '').toLowerCase().includes('mobile'));

      // Since cashbook rows don't store payment_method directly, use opening balances + account-level sums
      const cashAccs     = accs.filter(a => a.account_type === 'Cash');
      const bankAccs     = accs.filter(a => a.account_type === 'Bank');
      const telebirrAccs = accs.filter(a => a.account_type === 'Mobile Wallet');

      const cashERP     = cashAccs.reduce((s, a) => s + parseFloat(a.netBalance||0), 0);
      const bankERP     = bankAccs.reduce((s, a) => s + parseFloat(a.netBalance||0), 0);
      const telebirrERP = telebirrAccs.reduce((s, a) => s + parseFloat(a.netBalance||0), 0);
      const totalERP    = cashERP + bankERP + telebirrERP;

      setTypeBalances({ cash: cashERP, bank: bankERP, telebirr: telebirrERP, total: totalERP });
    } catch (e) {
      toast('Failed to load data: ' + e.message, 'error');
    } finally { setLoading(false); }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  /* ── account form ── */
  const openAdd  = () => { setEditAcc(null); setForm(BLANK); setShowForm(true); };
  const openEdit = (acc) => {
    setEditAcc(acc);
    setForm({ account_name: acc.account_name, account_type: acc.account_type, bank_provider: acc.bank_provider||'', account_number: acc.account_number||'', branch: acc.branch||'', currency: acc.currency, opening_balance: acc.opening_balance, opening_balance_date: acc.opening_balance_date?.slice(0,10)||'', description: acc.description||'' });
    setShowForm(true);
  };
  const saveAccount = async (e) => {
    e.preventDefault();
    try {
      if (editAcc) await apiClient.put(`/finance-bank/${editAcc.id}`, form);
      else         await apiClient.post('/finance-bank', form);
      setShowForm(false); setEditAcc(null);
      toast(editAcc ? 'Account updated.' : 'Account created.', 'success');
      load();
    } catch (err) { toast('Error: ' + err.message, 'error'); }
  };
  const toggleStatus = async (acc) => {
    try {
      await apiClient.patch(`/finance-bank/${acc.id}/toggle-status`);
      toast(`Account ${acc.status === 'Active' ? 'deactivated' : 'activated'}.`, 'info');
      load();
    } catch(e) { toast('Error: ' + e.message, 'error'); }
  };

  /* ── single-account reconcile ── */
  const startRecon = (acc) => { 
    setReconAcc(acc); setActualBalance(''); setReconNotes(''); setReconItems([]); 
    if (acc !== 'GLOBAL') setReconErpBal(0); 
    setTab('reconcile'); 
  };

  const loadReconTx = async () => {
    if (!reconAcc) { toast('Select an account or global summary first.', 'warning'); return; }
    if (!reconFrom || !reconTo) { toast('Select period From and To dates.', 'warning'); return; }
    
    if (reconAcc === 'GLOBAL') {
      setLoadingTx(true);
      const cbUpTo = cashbook.filter(r => r.date <= reconTo);
      
      const calcAccBalance = (acc) => {
        let method = 'Cash';
        if (acc.account_type === 'Bank') method = 'Bank';
        if (acc.account_type === 'Mobile Wallet') method = 'Telebirr';
        
        let relatedRows = cbUpTo.filter(r => (r.payment_method || '').includes(method));
        if (acc.account_type === 'Bank' && acc.bank_provider) {
           relatedRows = relatedRows.filter(r => (r.bank_name||'').toLowerCase().includes(acc.bank_provider.toLowerCase()));
        }
        
        const totalIn = relatedRows.filter(r => r.type === 'CRV').reduce((s, r) => s + parseFloat(r.receipts||0), 0);
        const totalOut = relatedRows.filter(r => r.type !== 'CRV').reduce((s, r) => s + parseFloat(r.payments||0), 0);
        return parseFloat(acc.opening_balance || 0) + totalIn - totalOut;
      };

      const cashERP = accounts.filter(a => a.account_type === 'Cash').reduce((s, a) => s + calcAccBalance(a), 0);
      const bankERP = accounts.filter(a => a.account_type === 'Bank').reduce((s, a) => s + calcAccBalance(a), 0);
      const teleERP = accounts.filter(a => a.account_type === 'Mobile Wallet').reduce((s, a) => s + calcAccBalance(a), 0);
      
      setTypeBalances({ cash: cashERP, bank: bankERP, telebirr: teleERP, total: cashERP + bankERP + teleERP });
      setReconItems([{ dummy: true }]); // To trigger the next step in UI
      toast('Global balances loaded for the selected period.', 'success');
      setLoadingTx(false);
      return;
    }

    setLoadingTx(true);
    try {
      const res = await apiClient.get(`/finance-bank/${reconAcc.id}/transactions?from=${reconFrom}&to=${reconTo}`);
      const rows = (res?.data || []).map(cb => {
        const isReceipt = parseFloat(cb.receipts||0) > 0;
        const erpAmt = isReceipt ? parseFloat(cb.receipts||0) : parseFloat(cb.payments||0);
        return { ...cb, erp_amount: erpAmt, actual_amount: erpAmt, difference: 0, match_status: 'Matched', isReceipt };
      });
      setReconItems(rows);
      setReconErpBal(res?.erpBalance || 0);
      if (rows.length === 0) toast('No transactions found for this account in the selected period.', 'warning');
      else toast(`Loaded ${rows.length} transaction(s).`, 'success');
    } catch(e) { toast('Error loading transactions: ' + e.message, 'error'); }
    finally { setLoadingTx(false); }
  };

  const autoMatch = () => {
    setReconItems(prev => prev.map(it => ({ ...it, actual_amount: it.erp_amount, difference: 0, match_status: 'Matched' })));
    toast('All transactions auto-matched.', 'success');
  };

  const updateActual = (idx, val) => {
    const amt = parseFloat(val) || 0;
    setReconItems(prev => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], actual_amount: amt, difference: copy[idx].erp_amount - amt, match_status: (copy[idx].erp_amount - amt) === 0 ? 'Matched' : 'Unmatched' };
      return copy;
    });
  };

  const saveRecon = async () => {
    if (!actualBalance) { toast('Please enter the Actual Balance before completing.', 'warning'); return; }
    if (!reconFrom || !reconTo) { toast('Please set the reconciliation period.', 'warning'); return; }
    setSaving(true);
    try {
      await apiClient.post('/finance-bank/reconciliations', {
        account_id:    reconAcc.id,
        period_from:   reconFrom,
        period_to:     reconTo,
        erp_balance:   reconErpBal,
        actual_balance: parseFloat(actualBalance),
        notes:         reconNotes,
        items: reconItems.map(it => ({
          date:         (it.date||'').toString().slice(0,10),
          reference:    it.reference,
          type:         it.type,
          description:  it.description,
          erp_amount:   it.erp_amount,
          actual_amount: it.actual_amount,
          difference:   it.difference,
          match_status: it.match_status
        }))
      });
      toast('✅ Reconciliation completed & saved!', 'success', 5000);
      setTab('history'); setReconAcc(null); load();
    } catch(e) { toast('Error saving: ' + e.message, 'error', 6000); }
    finally { setSaving(false); }
  };

  const saveGlobalRecon = async () => {
    const cashAct     = panelActuals.cash     !== '' ? parseFloat(panelActuals.cash)     : null;
    const bankAct     = panelActuals.bank     !== '' ? parseFloat(panelActuals.bank)     : null;
    const telebirrAct = panelActuals.telebirr !== '' ? parseFloat(panelActuals.telebirr) : null;
    
    if (cashAct === null || bankAct === null || telebirrAct === null) {
      toast('Please enter actual balances for Cash, Bank, and Telebirr before saving.', 'warning');
      return;
    }

    const cashAcc = accounts.find(a => a.account_type === 'Cash');
    const bankAcc = accounts.find(a => a.account_type === 'Bank');
    const teleAcc = accounts.find(a => a.account_type === 'Mobile Wallet');

    if (!cashAcc || !bankAcc || !teleAcc) {
      toast('You must have at least one Cash, Bank, and Mobile Wallet account created to do a global reconciliation.', 'error');
      return;
    }

    setSaving(true);
    const sumActuals = cashAct + bankAct + telebirrAct;
    const globalDiff = typeBalances.total - sumActuals; 
    
    try {
      await apiClient.post('/finance-bank/reconciliations/global', {
        period_from: reconFrom,
        period_to: reconTo,
        accounts_data: [
          { account_id: cashAcc.id, account_type: 'Cash', erp_balance: typeBalances.cash, actual_balance: cashAct, difference: globalDiff },
          { account_id: bankAcc.id, account_type: 'Bank', erp_balance: typeBalances.bank, actual_balance: bankAct, difference: globalDiff },
          { account_id: teleAcc.id, account_type: 'Mobile Wallet', erp_balance: typeBalances.telebirr, actual_balance: telebirrAct, difference: globalDiff }
        ]
      });
      
      toast('✅ Global reconciliation saved successfully!', 'success', 5000);
      setPanelActuals({ cash:'', bank:'', telebirr:'', total:'' });
      setTab('history'); setReconAcc(null);
      load();
    } catch (e) {
      toast('Error saving global reconciliation: ' + e.message, 'error', 6000);
    } finally {
      setSaving(false);
    }
  };

  /* ── view transactions ── */
  const viewTransactions = async (acc) => {
    setViewAcc(acc);
    try {
      const res = await apiClient.get(`/finance-bank/${acc.id}/transactions`);
      setViewTx(res?.data || []);
    } catch(e) { setViewTx([]); toast('Could not load transactions.', 'error'); }
  };

  /* ── expand recon history ── */
  const expandRecon = async (r) => {
    if (expandedRecon === r.id) { setExpandedRecon(null); setExpandedItems([]); return; }
    setExpandedRecon(r.id);
    try {
      const res = await apiClient.get(`/finance-bank/reconciliations/${r.id}`);
      setExpandedItems(res?.data?.items || []);
    } catch(e) { setExpandedItems([]); }
  };

  /* ── computed ── */
  const sumCRV = reconItems.filter(i => i.type === 'CRV').reduce((s, i) => s + i.erp_amount, 0);
  const sumPV  = reconItems.filter(i => i.type === 'PV').reduce((s, i) => s + i.erp_amount, 0);
  const sumPCV = reconItems.filter(i => i.type === 'PCV').reduce((s, i) => s + i.erp_amount, 0);
  const diffVal    = parseFloat(actualBalance||0) - reconErpBal;
  const matchedCnt = reconItems.filter(i => i.match_status === 'Matched').length;

  /* ── render ── */
  return (
    <>
      <style>{`@keyframes slideIn{from{opacity:0;transform:translateX(30px)}to{opacity:1;transform:translateX(0)}}`}</style>
      <Toast toasts={toasts} />

      <div style={{ padding:24, background:'#f8fafc', minHeight:'100vh', fontFamily:"'Inter',sans-serif" }}>

        {/* Header */}
        <div style={{ marginBottom:24, display:'flex', justifyContent:'space-between', alignItems:'flex-end' }}>
          <div>
            <h1 style={{ fontSize:22, fontWeight:900, margin:0, display:'flex', alignItems:'center', gap:9, color:'#0f172a' }}>
              <Landmark size={26} color="#3b82f6"/> Accounts &amp; Reconciliation
            </h1>
            <p style={{ color:'#64748b', margin:'4px 0 0', fontSize:13 }}>
              Manage all accounts and reconcile Cash · Bank · Mobile Wallet separately with total summary.
            </p>
          </div>
          <div style={{ display:'flex', gap:10 }}>
            <button type="button" onClick={load} style={{ display:'flex', alignItems:'center', gap:6, padding:'9px 16px', background:'white', border:'1px solid #e2e8f0', borderRadius:8, cursor:'pointer', fontWeight:600, fontSize:13, color:'#475569' }}>
              <RefreshCw size={14}/> Refresh
            </button>
            {tab === 'accounts' && (
              <button type="button" onClick={openAdd} style={{ display:'flex', alignItems:'center', gap:6, padding:'9px 18px', background:'#1e293b', border:'none', borderRadius:8, cursor:'pointer', fontWeight:700, fontSize:13, color:'white' }}>
                <Plus size={15}/> Add Account
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display:'flex', gap:4, background:'#f1f5f9', borderRadius:10, padding:4, marginBottom:24, width:'fit-content' }}>
          <TabBtn id="overview"  label="Overview"  tab={tab} setTab={setTab} />
          <TabBtn id="accounts"  label="Accounts"  tab={tab} setTab={setTab} />
          <TabBtn id="reconcile" label="Reconcile" tab={tab} setTab={setTab} />
          <TabBtn id="history"   label="History"   tab={tab} setTab={setTab} />
        </div>

        {loading && <div style={{ color:'#64748b', padding:48, textAlign:'center', fontSize:15 }}>Loading data…</div>}

        {/* ══════ OVERVIEW ══════════════════════════════════════════════════════ */}
        {!loading && tab === 'overview' && (
          <>
            {summary && (
              <>
                {/* Voucher type summary */}
                <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16, marginBottom:20 }}>
                  {[
                    { label:'Cash Receipt (CRV)', val: summary.totalCRV, color:'#16a34a', bg:'#f0fdf4', icon:'💰', sub:'Total income from CRVs' },
                    { label:'Payment Voucher (PV)',  val: summary.totalPV,  color:'#dc2626', bg:'#fef2f2', icon:'💸', sub:'Total PV payments' },
                    { label:'Petty Cash (PCV)',       val: summary.totalPCV, color:'#d97706', bg:'#fffbeb', icon:'🪙', sub:'Completed PCVs' },
                  ].map(c => (
                    <Card key={c.label} style={{ padding:'20px 22px', display:'flex', gap:16, alignItems:'center' }}>
                      <div style={{ fontSize:32 }}>{c.icon}</div>
                      <div>
                        <div style={{ fontSize:11, fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:.4, marginBottom:4 }}>{c.label}</div>
                        <div style={{ fontSize:22, fontWeight:900, color:c.color }}>ETB {fmt(c.val)}</div>
                        <div style={{ fontSize:12, color:'#94a3b8', marginTop:2 }}>{c.sub}</div>
                      </div>
                    </Card>
                  ))}
                </div>
                {/* Net summary */}
                <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16, marginBottom:28 }}>
                  <Card style={{ padding:'20px 22px', display:'flex', gap:14, alignItems:'center' }}>
                    <ArrowUpCircle size={32} color="#16a34a"/>
                    <div><div style={{ fontSize:11, fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:.4, marginBottom:4 }}>Total Income</div>
                    <div style={{ fontSize:22, fontWeight:900, color:'#16a34a' }}>ETB {fmt(summary.totalIncome)}</div></div>
                  </Card>
                  <Card style={{ padding:'20px 22px', display:'flex', gap:14, alignItems:'center' }}>
                    <ArrowDownCircle size={32} color="#dc2626"/>
                    <div><div style={{ fontSize:11, fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:.4, marginBottom:4 }}>Total Payments</div>
                    <div style={{ fontSize:22, fontWeight:900, color:'#dc2626' }}>ETB {fmt(summary.totalOut)}</div></div>
                  </Card>
                  <Card style={{ padding:'20px 22px', display:'flex', gap:14, alignItems:'center', border: summary.netBalance >= 0 ? '1px solid #bbf7d0' : '1px solid #fca5a5' }}>
                    <DollarSign size={32} color={summary.netBalance >= 0 ? '#16a34a' : '#dc2626'}/>
                    <div><div style={{ fontSize:11, fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:.4, marginBottom:4 }}>Net Balance</div>
                    <div style={{ fontSize:22, fontWeight:900, color: summary.netBalance >= 0 ? '#0f172a' : '#dc2626' }}>ETB {fmt(summary.netBalance)}</div></div>
                  </Card>
                </div>
              </>
            )}

            {/* Account type breakdown */}
            <h3 style={{ fontSize:15, fontWeight:800, color:'#0f172a', marginBottom:14 }}>Accounts by Type</h3>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:16, marginBottom:28 }}>
              {['Bank','Cash','Mobile Wallet'].map(type => {
                const meta = TYPE_META[type];
                const accs = accounts.filter(a => a.account_type === type);
                return (
                  <Card key={type} style={{ padding:20 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:14 }}>
                      <div style={{ width:40, height:40, borderRadius:10, background:meta.bg, display:'flex', alignItems:'center', justifyContent:'center', color:meta.color }}>{meta.icon}</div>
                      <div><div style={{ fontWeight:800, fontSize:15 }}>{type}</div><div style={{ fontSize:12, color:'#64748b' }}>{accs.length} account{accs.length!==1?'s':''}</div></div>
                    </div>
                    {accs.map(a => (
                      <div key={a.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 0', borderTop:'1px solid #f1f5f9' }}>
                        <div>
                          <span style={{ fontSize:13, color:'#475569', fontWeight:600 }}>{a.account_name}</span>
                          <div style={{ fontSize:11, color: parseFloat(a.netBalance||0) >= 0 ? '#16a34a' : '#dc2626', fontWeight:700, marginTop:2 }}>ETB {fmt(a.netBalance)}</div>
                        </div>
                        <Pill label={a.status} color={STATUS_C[a.status]?.[0]} bg={STATUS_C[a.status]?.[1]}/>
                      </div>
                    ))}
                    {accs.length === 0 && <div style={{ fontSize:12, color:'#94a3b8', textAlign:'center', padding:'10px 0' }}>No {type} accounts yet</div>}
                  </Card>
                );
              })}
            </div>

            {/* Recent cashbook entries */}
            <h3 style={{ fontSize:15, fontWeight:800, color:'#0f172a', marginBottom:14 }}>Recent Cashbook Entries</h3>
            <Card style={{ overflow:'hidden' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                <thead>
                  <tr style={{ background:'#f8fafc', color:'#64748b', fontSize:11, textTransform:'uppercase', letterSpacing:.4 }}>
                    {['Date','Type','Reference','Description','Income','Payment','Running Balance'].map(h => (
                      <th key={h} style={{ padding:'11px 16px', textAlign: ['Income','Payment','Running Balance'].includes(h) ? 'right' : 'left', borderBottom:'1px solid #e2e8f0' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {cashbook.slice(-25).reverse().map((row, i) => (
                    <tr key={i} style={{ borderBottom:'1px solid #f8fafc' }}>
                      <td style={{ padding:'10px 16px', color:'#475569' }}>{fmtD(row.date)}</td>
                      <td style={{ padding:'10px 16px' }}><Pill label={row.type} color={row.type==='CRV'?'#15803d':row.type==='PV'?'#1d4ed8':'#a16207'} bg={row.type==='CRV'?'#dcfce7':row.type==='PV'?'#dbeafe':'#fef9c3'}/></td>
                      <td style={{ padding:'10px 16px', fontFamily:'monospace', color:'#0ea5e9', fontWeight:600 }}>{row.reference}</td>
                      <td style={{ padding:'10px 16px', color:'#475569', maxWidth:220, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{row.description}</td>
                      <td style={{ padding:'10px 16px', textAlign:'right', color:'#16a34a', fontWeight:700 }}>{parseFloat(row.receipts||0)>0 ? fmt(row.receipts) : '—'}</td>
                      <td style={{ padding:'10px 16px', textAlign:'right', color:'#dc2626', fontWeight:700 }}>{parseFloat(row.payments||0)>0 ? fmt(row.payments) : '—'}</td>
                      <td style={{ padding:'10px 16px', textAlign:'right', fontWeight:800, color: row.balance>=0 ? '#0f172a' : '#dc2626' }}>{fmt(row.balance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </>
        )}

        {/* ══════ ACCOUNTS ══════════════════════════════════════════════════════ */}
        {!loading && tab === 'accounts' && (
          <>
            {showForm && (
              <Card style={{ padding:24, marginBottom:24 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:20 }}>
                  <h3 style={{ margin:0, fontSize:16, fontWeight:800 }}>{editAcc ? 'Edit Account' : 'Add New Account'}</h3>
                  <button type="button" onClick={()=>setShowForm(false)} style={{ background:'none', border:'none', cursor:'pointer', color:'#64748b' }}><X size={18}/></button>
                </div>
                <form onSubmit={saveAccount} style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:18 }}>
                  <div><Lbl req>Account Name</Lbl><Inp required value={form.account_name} onChange={e=>setForm({...form, account_name:e.target.value})} placeholder="e.g. Main Cash"/></div>
                  <div><Lbl req>Account Type</Lbl>
                    <Sel value={form.account_type} onChange={e=>setForm({...form, account_type:e.target.value})}>
                      <option>Bank</option><option>Cash</option><option>Mobile Wallet</option>
                    </Sel>
                  </div>
                  <div><Lbl>Bank / Provider</Lbl><Inp value={form.bank_provider} onChange={e=>setForm({...form, bank_provider:e.target.value})} placeholder="e.g. CBE, Awash, Telebirr"/></div>
                  <div><Lbl>Account Number</Lbl><Inp value={form.account_number} onChange={e=>setForm({...form, account_number:e.target.value})}/></div>
                  <div><Lbl>Company Branch</Lbl><Inp value={form.branch} onChange={e=>setForm({...form, branch:e.target.value})}/></div>
                  <div><Lbl req>Currency</Lbl>
                    <Sel value={form.currency} onChange={e=>setForm({...form, currency:e.target.value})}>
                      {CURRENCIES.map(c => <option key={c}>{c}</option>)}
                    </Sel>
                  </div>
                  <div><Lbl req>Opening Balance</Lbl><Inp required type="number" step="0.01" value={form.opening_balance} onChange={e=>setForm({...form, opening_balance:e.target.value})}/></div>
                  <div><Lbl req>Opening Balance Date</Lbl><Inp required type="date" value={form.opening_balance_date} onChange={e=>setForm({...form, opening_balance_date:e.target.value})}/></div>
                  <div><Lbl>Description</Lbl><Inp value={form.description} onChange={e=>setForm({...form, description:e.target.value})}/></div>
                  <div style={{ gridColumn:'span 3', display:'flex', justifyContent:'flex-end', gap:12, marginTop:4 }}>
                    <button type="button" onClick={()=>setShowForm(false)} style={{ padding:'9px 22px', background:'white', border:'1px solid #cbd5e1', borderRadius:8, cursor:'pointer', fontWeight:700 }}>Cancel</button>
                    <button type="submit" style={{ padding:'9px 28px', background:'#1e293b', color:'white', border:'none', borderRadius:8, cursor:'pointer', fontWeight:700 }}>Save Account</button>
                  </div>
                </form>
              </Card>
            )}

            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(360px,1fr))', gap:18 }}>
              {accounts.map(acc => {
                const meta = TYPE_META[acc.account_type] || TYPE_META['Cash'];
                return (
                  <Card key={acc.id} style={{ padding:20 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14 }}>
                      <div style={{ display:'flex', gap:12, alignItems:'center' }}>
                        <div style={{ width:44, height:44, borderRadius:10, background:meta.bg, display:'flex', alignItems:'center', justifyContent:'center', color:meta.color, flexShrink:0 }}>{meta.icon}</div>
                        <div>
                          <div style={{ fontWeight:800, fontSize:15 }}>{acc.account_name}</div>
                          <div style={{ fontSize:12, color:'#64748b' }}>{acc.account_type}{acc.bank_provider ? ` · ${acc.bank_provider}` : ''}</div>
                        </div>
                      </div>
                      <Pill label={acc.status} color={STATUS_C[acc.status]?.[0]} bg={STATUS_C[acc.status]?.[1]}/>
                    </div>
                    {acc.account_number && <div style={{ fontSize:13, fontFamily:'monospace', color:'#0ea5e9', fontWeight:700, marginBottom:12, letterSpacing:1 }}>{acc.account_number}</div>}

                    {/* Live balance from cashbook */}
                    <div style={{ background: parseFloat(acc.netBalance||0) >= 0 ? '#f0fdf4' : '#fef2f2', borderRadius:9, padding:'12px 14px', marginBottom:14 }}>
                      <div style={{ fontSize:10, fontWeight:700, color:'#64748b', textTransform:'uppercase', marginBottom:4 }}>Live Balance (from Cashbook)</div>
                      <div style={{ fontSize:22, fontWeight:900, color: parseFloat(acc.netBalance||0) >= 0 ? '#16a34a' : '#dc2626' }}>
                        {acc.currency} {fmt(acc.netBalance)}
                      </div>
                      <div style={{ fontSize:10, color:'#94a3b8', marginTop:3 }}>Opening {acc.currency} {fmt(acc.opening_balance)} + movements</div>
                    </div>

                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, background:'#f8fafc', borderRadius:8, padding:10, marginBottom:14, fontSize:12, color:'#475569' }}>
                      <div><b>In:</b> ETB {fmt(acc.totalIn)}</div>
                      <div><b>Out:</b> ETB {fmt(acc.totalOut)}</div>
                      {acc.branch && <div><b>Branch:</b> {acc.branch}</div>}
                      <div><b>Since:</b> {fmtD(acc.opening_balance_date)}</div>
                    </div>
                    <div style={{ display:'flex', gap:8 }}>
                      <button type="button" onClick={()=>viewTransactions(acc)} style={{ flex:1, padding:'8px', background:'#f0fdf4', color:'#16a34a', border:'1px solid #bbf7d0', borderRadius:7, cursor:'pointer', fontWeight:700, fontSize:12, display:'flex', alignItems:'center', justifyContent:'center', gap:5 }}><Eye size={13}/> View</button>
                      <button type="button" onClick={()=>openEdit(acc)} style={{ flex:1, padding:'8px', background:'#eff6ff', color:'#2563eb', border:'1px solid #bfdbfe', borderRadius:7, cursor:'pointer', fontWeight:700, fontSize:12, display:'flex', alignItems:'center', justifyContent:'center', gap:5 }}><Edit3 size={13}/> Edit</button>
                      <button type="button" onClick={()=>startRecon(acc)} style={{ flex:1, padding:'8px', background:'#1e293b', color:'white', border:'none', borderRadius:7, cursor:'pointer', fontWeight:700, fontSize:12, display:'flex', alignItems:'center', justifyContent:'center', gap:5 }}><RotateCcw size={13}/> Reconcile</button>
                      <button type="button" onClick={()=>toggleStatus(acc)} title={acc.status==='Active'?'Deactivate':'Activate'} style={{ padding:'8px 10px', background: acc.status==='Active' ? '#fee2e2' : '#dcfce7', color: acc.status==='Active' ? '#dc2626' : '#16a34a', border:'none', borderRadius:7, cursor:'pointer' }}><PowerOff size={14}/></button>
                    </div>
                  </Card>
                );
              })}
              {accounts.length === 0 && <div style={{ padding:48, textAlign:'center', color:'#94a3b8', fontSize:15 }}>No accounts yet. Click "Add Account" to get started.</div>}
            </div>
          </>
        )}

        {/* ══════ RECONCILE (Select Account or Global Summary) ════════════════════ */}
        {!loading && tab === 'reconcile' && (
          !reconAcc ? (
            <>
              <h3 style={{ fontSize:15, fontWeight:800, color:'#0f172a', marginBottom:16 }}>Select an Account to Reconcile</h3>
              
              {/* Global Summary Option */}
              <div style={{ marginBottom:20 }}>
                <Card onClick={()=>startRecon('GLOBAL')} style={{ padding:20, cursor:'pointer', display:'flex', gap:14, alignItems:'center', transition:'box-shadow .15s', border:'2px dashed #cbd5e1' }}
                  onMouseEnter={e=>{e.currentTarget.style.boxShadow='0 4px 18px rgba(0,0,0,.1)'; e.currentTarget.style.borderColor='#2563eb';}}
                  onMouseLeave={e=>{e.currentTarget.style.boxShadow='none'; e.currentTarget.style.borderColor='#cbd5e1';}}>
                  <div style={{ width:46, height:46, borderRadius:10, background:'#0f172a', display:'flex', alignItems:'center', justifyContent:'center', color:'white', flexShrink:0 }}><DollarSign size={20}/></div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:900, fontSize:15, color:'#0f172a' }}>Global Reconciliation Summary</div>
                    <div style={{ fontSize:13, color:'#64748b', marginTop:2 }}>Reconcile Cash, Bank, and Mobile Wallet all at once against the total cashbook</div>
                  </div>
                  <RotateCcw size={18} color="#94a3b8"/>
                </Card>
              </div>

              <h4 style={{ fontSize:13, fontWeight:800, color:'#64748b', textTransform:'uppercase', marginBottom:12 }}>Individual Accounts</h4>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:16 }}>
                {accounts.filter(a=>a.status==='Active').map(acc => {
                  const meta = TYPE_META[acc.account_type]||TYPE_META['Cash'];
                  return (
                    <Card key={acc.id} onClick={()=>startRecon(acc)} style={{ padding:20, cursor:'pointer', display:'flex', gap:14, alignItems:'center', transition:'box-shadow .15s' }}
                      onMouseEnter={e=>e.currentTarget.style.boxShadow='0 4px 18px rgba(0,0,0,.1)'}
                      onMouseLeave={e=>e.currentTarget.style.boxShadow='none'}>
                      <div style={{ width:46, height:46, borderRadius:10, background:meta.bg, display:'flex', alignItems:'center', justifyContent:'center', color:meta.color, flexShrink:0 }}>{meta.icon}</div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontWeight:800, fontSize:15 }}>{acc.account_name}</div>
                        <div style={{ fontSize:12, color:'#64748b' }}>{acc.account_type}{acc.bank_provider?` · ${acc.bank_provider}`:''}</div>
                        <div style={{ fontSize:12, fontWeight:700, color:'#16a34a', marginTop:3 }}>Balance: ETB {fmt(acc.netBalance)}</div>
                      </div>
                      <RotateCcw size={18} color="#94a3b8"/>
                    </Card>
                  );
                })}
                {accounts.filter(a=>a.status==='Active').length === 0 && <div style={{ padding:48, color:'#94a3b8', fontSize:15 }}>No active accounts found. Create one from the Accounts tab.</div>}
              </div>
            </>
          ) : (
            <>
              {/* Reconcile header */}
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
                {reconAcc === 'GLOBAL' ? (
                  <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                    <div style={{ width:46, height:46, borderRadius:10, background:'#0f172a', display:'flex', alignItems:'center', justifyContent:'center', color:'white' }}>
                      <DollarSign size={20}/>
                    </div>
                    <div>
                      <h2 style={{ margin:0, fontSize:18, fontWeight:900 }}>Global Reconciliation Summary</h2>
                      <div style={{ fontSize:13, color:'#64748b', marginTop:2 }}>Cash, Bank, and Mobile Wallet</div>
                    </div>
                  </div>
                ) : (
                  <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                    <div style={{ width:46, height:46, borderRadius:10, background: (TYPE_META[reconAcc.account_type]||TYPE_META['Cash']).bg, display:'flex', alignItems:'center', justifyContent:'center', color:(TYPE_META[reconAcc.account_type]||TYPE_META['Cash']).color }}>
                      {(TYPE_META[reconAcc.account_type]||TYPE_META['Cash']).icon}
                    </div>
                    <div>
                      <h2 style={{ margin:0, fontSize:18, fontWeight:900 }}>Reconciling: {reconAcc.account_name}</h2>
                      <div style={{ fontSize:13, color:'#64748b', marginTop:2 }}>{reconAcc.account_type}{reconAcc.bank_provider?` · ${reconAcc.bank_provider}`:''} · ERP Balance: ETB {fmt(reconErpBal)}</div>
                    </div>
                  </div>
                )}
                <button type="button" onClick={()=>setReconAcc(null)} style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 18px', background:'white', border:'1px solid #e2e8f0', borderRadius:8, cursor:'pointer', fontWeight:700, fontSize:13 }}><X size={14}/> Cancel</button>
              </div>

              {/* Common Load Bar */}
              <Card style={{ padding:20, marginBottom:16, display:'flex', gap:20, alignItems:'flex-end' }}>
                <div style={{ flex:1, display:'flex', gap:10 }}>
                  <div style={{ flex:1 }}><Lbl>Period From</Lbl><Inp type="date" value={reconFrom} onChange={e=>setReconFrom(e.target.value)}/></div>
                  <div style={{ flex:1 }}><Lbl>Period To</Lbl><Inp type="date" value={reconTo} onChange={e=>setReconTo(e.target.value)}/></div>
                </div>
                <button type="button" onClick={loadReconTx} disabled={loadingTx} style={{ padding:'10px 24px', background: loadingTx ? '#64748b' : '#1e293b', color:'white', border:'none', borderRadius:8, fontWeight:700, cursor: loadingTx ? 'not-allowed' : 'pointer', fontSize:13 }}>
                  {loadingTx ? 'Loading…' : '🔍 Load Data'}
                </button>
              </Card>

              {reconAcc === 'GLOBAL' ? (
                /* GLOBAL RECONCILIATION PANELS */
                reconItems.length > 0 && (
                  <div style={{ marginTop: 24 }}>
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:20, marginBottom:24 }}>
                      <TypePanel
                        label="Cash" icon={<Wallet size={18}/>} color="#16a34a" bg="#f0fdf4"
                        erpBal={typeBalances.cash}
                        actualVal={panelActuals.cash}
                        onActualChange={v => setPanelActuals(p => ({...p, cash: v}))}
                      />
                      <TypePanel
                        label="Bank" icon={<Building2 size={18}/>} color="#2563eb" bg="#eff6ff"
                        erpBal={typeBalances.bank}
                        actualVal={panelActuals.bank}
                        onActualChange={v => setPanelActuals(p => ({...p, bank: v}))}
                      />
                      <TypePanel
                        label="Mobile Wallet (Telebirr)" icon={<Smartphone size={18}/>} color="#7c3aed" bg="#f5f3ff"
                        erpBal={typeBalances.telebirr}
                        actualVal={panelActuals.telebirr}
                        onActualChange={v => setPanelActuals(p => ({...p, telebirr: v}))}
                      />
                    </div>
                    {/* Total Panel */}
                    {(() => {
                      const cashAct     = panelActuals.cash     !== '' ? parseFloat(panelActuals.cash)     : null;
                      const bankAct     = panelActuals.bank     !== '' ? parseFloat(panelActuals.bank)     : null;
                      const telebirrAct = panelActuals.telebirr !== '' ? parseFloat(panelActuals.telebirr) : null;
                      const allEntered  = cashAct !== null && bankAct !== null && telebirrAct !== null;
                      const sumActuals  = (cashAct||0) + (bankAct||0) + (telebirrAct||0);
                      const totalDiff   = typeBalances.total - sumActuals;
                      const balanced    = allEntered && Math.abs(totalDiff) < 0.005;
                      return (
                        <Card style={{ padding:28, border: balanced ? '2px solid #16a34a' : allEntered ? '2px solid #dc2626' : '1px solid #e2e8f0', background: balanced ? '#f0fdf4' : allEntered ? '#fef2f2' : 'white', marginBottom:28 }}>
                          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:24, alignItems:'center' }}>
                            <div>
                              <div style={{ fontSize:11, fontWeight:700, color:'#64748b', textTransform:'uppercase', marginBottom:6 }}>Total ERP Balance</div>
                              <div style={{ fontSize:28, fontWeight:900, color:'#0f172a' }}>ETB {fmt(typeBalances.total)}</div>
                              <div style={{ fontSize:11, color:'#94a3b8', marginTop:4 }}>Up to {fmtD(reconTo)}</div>
                            </div>
                            <div>
                              <div style={{ fontSize:11, fontWeight:700, color:'#64748b', textTransform:'uppercase', marginBottom:6 }}>Sum of Actuals</div>
                              <div style={{ fontSize:28, fontWeight:900, color: allEntered ? '#0f172a' : '#94a3b8' }}>
                                {allEntered ? `ETB ${fmt(sumActuals)}` : '—'}
                              </div>
                            </div>
                            <div style={{ textAlign:'center' }}>
                              <div style={{ fontSize:13, color:'#64748b', marginBottom:6 }}>Formula</div>
                              <div style={{ fontSize:13, fontWeight:700, color:'#475569', background:'#f1f5f9', borderRadius:8, padding:'10px 14px', fontFamily:'monospace' }}>
                                Total ERP − Sum Actuals
                              </div>
                            </div>
                            <div style={{ textAlign:'right' }}>
                              <div style={{ fontSize:11, fontWeight:700, color:'#64748b', textTransform:'uppercase', marginBottom:6 }}>Total Difference</div>
                              <div style={{ fontSize:36, fontWeight:900, color: balanced ? '#16a34a' : allEntered ? '#dc2626' : '#94a3b8' }}>
                                {allEntered ? fmt(totalDiff) : '—'}
                              </div>
                              {balanced && <div style={{ fontSize:13, fontWeight:800, color:'#16a34a', marginTop:4 }}>✓ Fully Balanced</div>}
                            </div>
                          </div>
                        </Card>
                      );
                    })()}
                    <div style={{ display:'flex', justifyContent:'flex-end' }}>
                      <button type="button" onClick={saveGlobalRecon} disabled={saving} style={{ padding:'12px 32px', background: saving ? '#64748b' : '#16a34a', color:'white', border:'none', borderRadius:9, fontWeight:800, fontSize:14, cursor: saving ? 'not-allowed' : 'pointer', display:'flex', alignItems:'center', gap:8 }}>
                        <CheckCircle2 size={16}/> {saving ? 'Saving...' : 'Save Global Reconciliation'}
                      </button>
                    </div>
                  </div>
                )
              ) : (
                /* SINGLE ACCOUNT RECONCILIATION VIEWS */
                <>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:16, marginBottom:16 }}>
                    <Card style={{ padding:20 }}>
                      <div style={{ fontSize:12, fontWeight:700, color:'#64748b', textTransform:'uppercase', marginBottom:8 }}>ERP Balance</div>
                      <div style={{ fontSize:26, fontWeight:900, color:'#0f172a' }}>ETB {fmt(reconErpBal)}</div>
                      <div style={{ fontSize:11, color:'#94a3b8', marginTop:4 }}>Up to {fmtD(reconTo)}</div>
                    </Card>

                <Card style={{ padding:20 }}>
                  <div style={{ fontSize:12, fontWeight:700, color:'#64748b', textTransform:'uppercase', marginBottom:8 }}>Actual Balance</div>
                  <Inp type="number" step="0.01" value={actualBalance} onChange={e=>setActualBalance(e.target.value)} placeholder="0.00" style={{ fontSize:16, fontWeight:800 }}/>
                  <div style={{ fontSize:11, color:'#94a3b8', marginTop:4 }}>From physical statement</div>
                </Card>

                <Card style={{ padding:20, border: diffVal===0&&actualBalance ? '2px solid #16a34a' : '1px solid #e2e8f0' }}>
                  <div style={{ fontSize:12, fontWeight:700, color:'#64748b', textTransform:'uppercase', marginBottom:8 }}>Difference</div>
                  <div style={{ fontSize:26, fontWeight:900, color: diffVal===0&&actualBalance ? '#16a34a' : '#dc2626' }}>{actualBalance ? fmt(diffVal) : '—'}</div>
                  <div style={{ fontSize:11, color: diffVal===0&&actualBalance ? '#16a34a' : '#94a3b8', marginTop:4 }}>
                    {diffVal===0&&actualBalance ? '✓ Balanced' : 'Actual − ERP'}
                  </div>
                </Card>
              </div>

              {/* CRV / PV / PCV summary bar */}
              {reconItems.length > 0 && (
                <div style={{ display:'flex', gap:12, marginBottom:16 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, background:'white', border:'1px solid #bbf7d0', borderRadius:8, padding:'8px 16px', fontSize:13 }}>
                    <span style={{ fontWeight:700, color:'#16a34a' }}>CRV:</span> +ETB {fmt(sumCRV)}
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:8, background:'white', border:'1px solid #fca5a5', borderRadius:8, padding:'8px 16px', fontSize:13 }}>
                    <span style={{ fontWeight:700, color:'#dc2626' }}>PV:</span> −ETB {fmt(sumPV)}
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:8, background:'white', border:'1px solid #fcd34d', borderRadius:8, padding:'8px 16px', fontSize:13 }}>
                    <span style={{ fontWeight:700, color:'#d97706' }}>PCV:</span> −ETB {fmt(sumPCV)}
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:8, background:'#0f172a', border:'1px solid #0f172a', borderRadius:8, padding:'8px 16px', fontSize:13, color:'white', fontWeight:700 }}>
                    Net: ETB {fmt(sumCRV - sumPV - sumPCV)}
                  </div>
                </div>
              )}

              {/* Notes */}
              <Card style={{ padding:16, marginBottom:16 }}>
                <Lbl>Reconciliation Notes (Optional)</Lbl>
                <textarea value={reconNotes} onChange={e=>setReconNotes(e.target.value)} rows={2}
                  style={{ width:'100%', padding:10, border:'1px solid #cbd5e1', borderRadius:7, boxSizing:'border-box', fontFamily:'inherit', resize:'none', fontSize:13 }}
                  placeholder="Add any notes about this reconciliation period…"/>
              </Card>

              {/* Transactions grid */}
              {reconItems.length > 0 && (
                <Card style={{ overflow:'hidden', marginBottom:20 }}>
                  <div style={{ padding:'14px 20px', borderBottom:'1px solid #e2e8f0', display:'flex', justifyContent:'space-between', alignItems:'center', background:'#f8fafc' }}>
                    <div>
                      <h3 style={{ margin:0, fontSize:15, fontWeight:800 }}>Transactions ({reconItems.length})</h3>
                      <div style={{ fontSize:12, color:'#64748b', marginTop:2 }}>Matched: <b style={{ color:'#16a34a' }}>{matchedCnt}</b> / {reconItems.length}</div>
                    </div>
                    <div style={{ display:'flex', gap:8 }}>
                      <button type="button" onClick={autoMatch} style={{ padding:'7px 16px', background:'#eff6ff', color:'#2563eb', border:'1px solid #bfdbfe', borderRadius:7, fontWeight:700, fontSize:12, cursor:'pointer' }}>⚡ Auto Match All</button>
                    </div>
                  </div>
                  <div style={{ overflowX:'auto' }}>
                    <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                      <thead>
                        <tr style={{ background:'#f1f5f9', color:'#64748b', fontSize:11, textTransform:'uppercase', letterSpacing:.4 }}>
                          {['Date','Ref No','Type','Description','ERP Amount','Actual Amount','Difference','Status'].map(h => (
                            <th key={h} style={{ padding:'11px 14px', textAlign:'left', borderBottom:'1px solid #e2e8f0', whiteSpace:'nowrap' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {reconItems.map((it, idx) => (
                          <tr key={idx} style={{ borderBottom:'1px solid #f1f5f9', background: it.match_status==='Matched' ? '#f0fdf4' : 'white' }}>
                            <td style={{ padding:'10px 14px', color:'#475569', whiteSpace:'nowrap' }}>{fmtD(it.date)}</td>
                            <td style={{ padding:'10px 14px', fontFamily:'monospace', fontWeight:700, color:'#0ea5e9' }}>{it.reference}</td>
                            <td style={{ padding:'10px 14px' }}><Pill label={it.type} color={it.type==='CRV'?'#15803d':it.type==='PV'?'#1d4ed8':'#a16207'} bg={it.type==='CRV'?'#dcfce7':it.type==='PV'?'#dbeafe':'#fef9c3'}/></td>
                            <td style={{ padding:'10px 14px', color:'#475569', maxWidth:220, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{it.description}</td>
                            <td style={{ padding:'10px 14px', fontWeight:700, color:it.isReceipt?'#16a34a':'#dc2626', whiteSpace:'nowrap' }}>{it.isReceipt?'+':'−'}{fmt(it.erp_amount)}</td>
                            <td style={{ padding:'10px 14px', width:130 }}>
                              <input type="number" step="0.01" value={it.actual_amount||''} onChange={e=>updateActual(idx, e.target.value)}
                                style={{ width:'100%', padding:'6px 8px', border:'1px solid #cbd5e1', borderRadius:6, fontSize:13, textAlign:'right' }}/>
                            </td>
                            <td style={{ padding:'10px 14px', fontWeight:700, color:it.difference===0?'#16a34a':'#dc2626', whiteSpace:'nowrap' }}>{fmt(it.difference)}</td>
                            <td style={{ padding:'10px 14px' }}><Pill label={it.match_status} color={it.match_status==='Matched'?'#16a34a':'#dc2626'} bg={it.match_status==='Matched'?'#dcfce7':'#fee2e2'}/></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              )}

              <div style={{ display:'flex', justifyContent:'flex-end', gap:12, marginTop:16 }}>
                {reconItems.length === 0 && <div style={{ color:'#94a3b8', fontSize:13, alignSelf:'center' }}>Load transactions first, then complete the reconciliation.</div>}
                <button type="button" onClick={saveRecon} disabled={saving} style={{ padding:'12px 32px', background: saving ? '#64748b' : '#16a34a', color:'white', border:'none', borderRadius:9, fontWeight:800, fontSize:14, cursor:'pointer', display:'flex', alignItems:'center', gap:8 }}>
                  <CheckCircle2 size={16}/> {saving ? 'Saving…' : 'Complete Reconciliation'}
                </button>
              </div>
            </>
          )}
        </>
        )
      )}


        {/* ══════ HISTORY ═══════════════════════════════════════════════════════ */}
        {!loading && tab === 'history' && (() => {
          // Group global reconciliations
          const groupedReconciliations = [];
          const processedIds = new Set();
          for (let r of reconciliations) {
            if (processedIds.has(r.id)) continue;
            // The old DB data has "Global Reconciliation (Cash)" and difference=0.
            // The new system uses "GLOBAL_SUMMARY:uuid"
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

          return (
          <div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
              <h3 style={{ fontSize:15, fontWeight:800, color:'#0f172a', margin:0 }}>Reconciliation History</h3>
              <button type="button" onClick={printHistory} style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 16px', background:'white', border:'1px solid #cbd5e1', borderRadius:8, cursor:'pointer', fontWeight:700, fontSize:13 }}>
                <Printer size={16}/> Print History
              </button>
            </div>

            {/* Summary bar */}
            {reconciliations.length > 0 && (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, marginBottom:24 }}>
                {[
                  { label:'Total Reconciliations', val: reconciliations.length, color:'#0f172a' },
                  { label:'Completed', val: reconciliations.filter(r=>r.status==='Completed').length, color:'#16a34a' },
                  { label:'Draft', val: reconciliations.filter(r=>r.status==='Draft').length, color:'#d97706' },
                  { label:'Balanced', val: reconciliations.filter(r=>parseFloat(r.difference)===0).length, color:'#2563eb' },
                ].map(c => (
                  <Card key={c.label} style={{ padding:'16px 20px' }}>
                    <div style={{ fontSize:11, fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:.4, marginBottom:4 }}>{c.label}</div>
                    <div style={{ fontSize:26, fontWeight:900, color:c.color }}>{c.val}</div>
                  </Card>
                ))}
              </div>
            )}

            {reconciliations.length === 0 ? (
              <Card style={{ padding:48, textAlign:'center' }}>
                <div style={{ fontSize:40, marginBottom:16 }}>📋</div>
                <div style={{ fontSize:16, fontWeight:700, color:'#64748b', marginBottom:8 }}>No reconciliation records yet</div>
                <div style={{ fontSize:13, color:'#94a3b8' }}>Go to the Reconcile tab to start your first reconciliation.</div>
              </Card>
            ) : groupedReconciliations.map(item => {
              if (item.isGlobal) {
                // RENDER GLOBAL SUMMARY BLOCK
                return (
                  <Card key={item.groupId} style={{ marginBottom:16, overflow:'hidden', border:'2px solid #e2e8f0' }}>
                    <div
                      onClick={() => {
                        if (expandedRecon === item.groupId) setExpandedRecon(null);
                        else { setExpandedRecon(item.groupId); setExpandedItems([]); }
                      }}
                      style={{ padding:'16px 20px', display:'flex', alignItems:'center', gap:16, cursor:'pointer', background:'#f8fafc', borderBottom:'1px solid #e2e8f0' }}
                    >
                      <div style={{ width:40, height:40, borderRadius:9, background:'#0f172a', display:'flex', alignItems:'center', justifyContent:'center', color:'white', flexShrink:0 }}>
                        <DollarSign size={18}/>
                      </div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontWeight:900, fontSize:15, color:'#0f172a' }}>Global Summary</div>
                        <div style={{ fontSize:12, color:'#64748b', marginTop:2 }}>{item.records.length} Accounts Included</div>
                      </div>
                      <div style={{ flex:'0 0 200px' }}>
                        <div style={{ fontSize:11, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', marginBottom:2 }}>Period</div>
                        <div style={{ fontSize:13, color:'#475569', fontWeight:600 }}>{fmtD(item.period_from)} → {fmtD(item.period_to)}</div>
                      </div>
                      <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:12 }}>
                        <div style={{ fontSize:12, color:'#94a3b8' }}>{fmtD(item.created_at)}</div>
                        <div style={{ fontSize:18, color:'#94a3b8', transition:'transform .2s', transform: expandedRecon===item.groupId ? 'rotate(180deg)' : 'none' }}>▾</div>
                      </div>
                    </div>
                    {/* Expanded Global Details */}
                    {expandedRecon === item.groupId && (
                      <div style={{ background:'white' }}>
                        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                          <thead>
                            <tr style={{ color:'#64748b', fontSize:11, textTransform:'uppercase' }}>
                              <th style={{ padding:'12px 20px', textAlign:'left', borderBottom:'1px solid #e2e8f0' }}>Account</th>
                              <th style={{ padding:'12px 20px', textAlign:'right', borderBottom:'1px solid #e2e8f0' }}>ERP Balance</th>
                              <th style={{ padding:'12px 20px', textAlign:'right', borderBottom:'1px solid #e2e8f0' }}>Actual Balance</th>
                              <th style={{ padding:'12px 20px', textAlign:'right', borderBottom:'1px solid #e2e8f0' }}>Difference</th>
                            </tr>
                          </thead>
                          <tbody>
                            {item.records.map(r => (
                              <tr key={r.id} style={{ borderBottom:'1px solid #f1f5f9' }}>
                                <td style={{ padding:'12px 20px', fontWeight:700, color:'#475569' }}>{r.account_name} ({r.account_type})</td>
                                <td style={{ padding:'12px 20px', textAlign:'right', fontWeight:700 }}>{fmt(r.erp_balance)}</td>
                                <td style={{ padding:'12px 20px', textAlign:'right', fontWeight:700 }}>{fmt(r.actual_balance)}</td>
                                <td style={{ padding:'12px 20px', textAlign:'right', fontWeight:800, color:parseFloat(r.difference)===0?'#16a34a':'#dc2626' }}>{fmt(r.difference)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </Card>
                );
              }
              // NORMAL SINGLE RECON ROW
              const r = item;
              return (
              <Card key={r.id} style={{ marginBottom:12, overflow:'hidden' }}>
                {/* Row header */}
                <div
                  onClick={() => {
                    if (expandedRecon === r.id) { setExpandedRecon(null); return; }
                    setExpandedRecon(r.id);
                    apiClient.get(`/finance-bank/reconciliations/${r.id}`).then(res => setExpandedItems(res?.data?.items || [])).catch(()=>toast('Error','error'));
                  }}
                  style={{ padding:'16px 20px', display:'flex', alignItems:'center', gap:16, cursor:'pointer', transition:'background .15s' }}
                  onMouseEnter={e=>e.currentTarget.style.background='#f8fafc'}
                  onMouseLeave={e=>e.currentTarget.style.background='white'}
                >
                  <div style={{ width:40, height:40, borderRadius:9, background:(TYPE_META[r.account_type]||TYPE_META['Cash']).bg, display:'flex', alignItems:'center', justifyContent:'center', color:(TYPE_META[r.account_type]||TYPE_META['Cash']).color, flexShrink:0 }}>
                    {(TYPE_META[r.account_type]||TYPE_META['Cash']).icon}
                  </div>

                  <div style={{ flex:'0 0 180px' }}>
                    <div style={{ fontFamily:'monospace', fontWeight:800, fontSize:14, color:'#0ea5e9' }}>{r.reconciliation_no}</div>
                    <div style={{ fontSize:12, color:'#475569', marginTop:2 }}>{r.account_name}</div>
                  </div>

                  <div style={{ flex:'0 0 200px' }}>
                    <div style={{ fontSize:11, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', marginBottom:2 }}>Period</div>
                    <div style={{ fontSize:13, color:'#475569', fontWeight:600 }}>{fmtD(r.period_from)} → {fmtD(r.period_to)}</div>
                  </div>

                  <div style={{ flex:'0 0 130px' }}>
                    <div style={{ fontSize:11, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', marginBottom:2 }}>ERP Balance</div>
                    <div style={{ fontSize:14, fontWeight:800, color:'#0f172a' }}>{r.currency||'ETB'} {fmt(r.erp_balance)}</div>
                  </div>
                  <div style={{ flex:'0 0 130px' }}>
                    <div style={{ fontSize:11, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', marginBottom:2 }}>Actual Balance</div>
                    <div style={{ fontSize:14, fontWeight:800, color:'#0f172a' }}>{r.currency||'ETB'} {fmt(r.actual_balance)}</div>
                  </div>

                  <div style={{ flex:'0 0 120px' }}>
                    <div style={{ fontSize:11, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', marginBottom:2 }}>Difference</div>
                    <div style={{ fontSize:15, fontWeight:900, color: parseFloat(r.difference)===0 ? '#16a34a' : '#dc2626' }}>{fmt(r.difference)}</div>
                  </div>

                  <div style={{ flex:'0 0 100px' }}>
                    <Pill label={r.status} color={r.status==='Completed'?'#16a34a':'#d97706'} bg={r.status==='Completed'?'#dcfce7':'#fef9c3'}/>
                    {parseFloat(r.difference)===0 && <div style={{ fontSize:10, color:'#16a34a', marginTop:4, fontWeight:700 }}>✓ Balanced</div>}
                  </div>

                  <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:12 }}>
                    <div style={{ fontSize:12, color:'#94a3b8' }}>{fmtD(r.created_at)}</div>
                    <div style={{ fontSize:18, color:'#94a3b8', transition:'transform .2s', transform: expandedRecon===r.id ? 'rotate(180deg)' : 'none' }}>▾</div>
                  </div>
                </div>

                {/* Expanded items */}
                {expandedRecon === r.id && (
                  <div style={{ borderTop:'1px solid #e2e8f0' }}>
                    {r.notes && (
                      <div style={{ padding:'10px 20px', background:'#fffbeb', fontSize:13, color:'#92400e' }}>📝 {r.notes}</div>
                    )}
                    <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                      <thead>
                        <tr style={{ background:'#f8fafc', color:'#64748b', fontSize:11, textTransform:'uppercase' }}>
                          {['Date','Reference','Type','Description','ERP Amount','Actual Amount','Difference','Status'].map(h => (
                            <th key={h} style={{ padding:'9px 16px', textAlign:'left', borderBottom:'1px solid #e2e8f0' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {expandedItems.map((it, i) => (
                          <tr key={i} style={{ borderBottom:'1px solid #f8fafc', background: it.match_status==='Matched' ? '#f0fdf4' : 'white' }}>
                            <td style={{ padding:'9px 16px', color:'#475569' }}>{fmtD(it.transaction_date)}</td>
                            <td style={{ padding:'9px 16px', fontFamily:'monospace', color:'#0ea5e9', fontWeight:700 }}>{it.reference_no}</td>
                            <td style={{ padding:'9px 16px' }}><Pill label={it.transaction_type} color={it.transaction_type==='CRV'?'#15803d':it.transaction_type==='PV'?'#1d4ed8':'#a16207'} bg={it.transaction_type==='CRV'?'#dcfce7':it.transaction_type==='PV'?'#dbeafe':'#fef9c3'}/></td>
                            <td style={{ padding:'9px 16px', color:'#475569' }}>{it.description}</td>
                            <td style={{ padding:'9px 16px', fontWeight:700 }}>{fmt(it.erp_amount)}</td>
                            <td style={{ padding:'9px 16px', fontWeight:700 }}>{fmt(it.actual_amount)}</td>
                            <td style={{ padding:'9px 16px', fontWeight:700, color: parseFloat(it.difference)===0?'#16a34a':'#dc2626' }}>{fmt(it.difference)}</td>
                            <td style={{ padding:'9px 16px' }}><Pill label={it.match_status} color={it.match_status==='Matched'?'#16a34a':'#dc2626'} bg={it.match_status==='Matched'?'#dcfce7':'#fee2e2'}/></td>
                          </tr>
                        ))}
                        {expandedItems.length === 0 && <tr><td colSpan={8} style={{ padding:20, textAlign:'center', color:'#94a3b8' }}>No transaction items recorded.</td></tr>}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            )})}
            
            {/* HIDDEN PRINT CONTENT */}
            <div ref={historyPrintRef} style={{ display: 'none' }}>
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
                  {groupedReconciliations.map((item, idx) => {
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
                              <td className={`right ${parseFloat(r.difference)===0 ? 'diff-ok' : 'diff-err'}`}>{fmt(r.difference)}</td>
                            </tr>
                          ))}
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
                          <td className={`right ${parseFloat(item.difference)===0 ? 'diff-ok' : 'diff-err'}`}>{fmt(item.difference)}</td>
                        </tr>
                      );
                    }
                  })}
                </tbody>
              </table>
            </div>

          </div>
          );
        })()}

        {/* ══════ VIEW TRANSACTIONS MODAL ═══════════════════════════════════════ */}
        {viewAcc && (
          <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <div style={{ background:'white', width:'90%', maxWidth:860, borderRadius:14, overflow:'hidden', maxHeight:'85vh', display:'flex', flexDirection:'column' }}>
              <div style={{ padding:'16px 24px', borderBottom:'1px solid #e2e8f0', display:'flex', justifyContent:'space-between', alignItems:'center', background:'#0f172a' }}>
                <h3 style={{ margin:0, color:'white', fontSize:16, fontWeight:800 }}>Transactions: {viewAcc.account_name}</h3>
                <button type="button" onClick={()=>setViewAcc(null)} style={{ background:'rgba(255,255,255,.15)', border:'none', borderRadius:6, color:'white', cursor:'pointer', padding:'4px 10px' }}><X size={16}/></button>
              </div>
              <div style={{ overflowY:'auto', flex:1 }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                  <thead>
                    <tr style={{ background:'#f8fafc', color:'#64748b', fontSize:11, textTransform:'uppercase', letterSpacing:.4 }}>
                      {['Date','Type','Reference','Description','Receipt','Payment','Balance'].map(h => (
                        <th key={h} style={{ padding:'10px 16px', textAlign:'left', borderBottom:'1px solid #e2e8f0' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {viewTx.map((tx, i) => (
                      <tr key={i} style={{ borderBottom:'1px solid #f1f5f9' }}>
                        <td style={{ padding:'9px 16px', color:'#475569' }}>{fmtD(tx.date)}</td>
                        <td style={{ padding:'9px 16px' }}><Pill label={tx.type} color={tx.type==='CRV'?'#15803d':tx.type==='PV'?'#1d4ed8':'#a16207'} bg={tx.type==='CRV'?'#dcfce7':tx.type==='PV'?'#dbeafe':'#fef9c3'}/></td>
                        <td style={{ padding:'9px 16px', fontFamily:'monospace', color:'#0ea5e9', fontWeight:600 }}>{tx.reference}</td>
                        <td style={{ padding:'9px 16px', color:'#475569' }}>{tx.description}</td>
                        <td style={{ padding:'9px 16px', color:'#16a34a', fontWeight:700 }}>{parseFloat(tx.receipts||0)>0 ? fmt(tx.receipts) : '—'}</td>
                        <td style={{ padding:'9px 16px', color:'#dc2626', fontWeight:700 }}>{parseFloat(tx.payments||0)>0 ? fmt(tx.payments) : '—'}</td>
                        <td style={{ padding:'9px 16px', fontWeight:800, color: tx.balance>=0?'#0f172a':'#dc2626' }}>{fmt(tx.balance)}</td>
                      </tr>
                    ))}
                    {viewTx.length === 0 && <tr><td colSpan={7} style={{ padding:32, textAlign:'center', color:'#94a3b8' }}>No transactions found for this account type.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </div>
    </>
  );
};

export default FinanceBankAccounts;
