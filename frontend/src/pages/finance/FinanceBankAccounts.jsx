import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Landmark, Plus, RefreshCw, Wallet, Smartphone, Building2,
  CheckCircle2, RotateCcw, Edit3, PowerOff, Eye, X, TrendingUp,
  TrendingDown, DollarSign, ArrowUpCircle, ArrowDownCircle, Printer,
  AlertCircle, Info, CheckCircle, AlertTriangle
} from 'lucide-react';
import apiClient from '../../services/apiClient';

/* ── Global CSS ─────────────────────────────────────────────── */
const G = `
  .fba-wrap {
    padding: 24px;
    background: #F5F5F5;
    min-height: 100vh;
    font-family: 'Inter', sans-serif;
    width: 100%;
    box-sizing: border-box;
  }
  .fba-card {
    background: #FFFFFF;
    border: 1px solid #8D6E63;
    border-radius: 0;
    padding: 20px 24px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.04);
    transition: box-shadow 0.2s;
  }
  .fba-card:hover {
    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  }
  .fba-inp {
    width: 100%;
    padding: 10px 12px;
    border: 2px solid #8D6E63;
    border-radius: 0;
    font-size: 13px;
    font-weight: 600;
    color: #424242;
    background: #FFFFFF;
    outline: none;
    box-sizing: border-box;
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .fba-inp:focus {
    border-color: #228B22;
    box-shadow: 0 0 0 3px rgba(34,139,34,0.15);
  }
  .fba-select {
    width: 100%;
    padding: 10px 12px;
    border: 2px solid #8D6E63;
    border-radius: 0;
    font-size: 13px;
    font-weight: 600;
    color: #424242;
    background: #FFFFFF;
    outline: none;
    box-sizing: border-box;
    cursor: pointer;
    transition: border-color 0.2s;
  }
  .fba-select:focus { border-color: #228B22; }
  .fba-lbl {
    display: block;
    font-size: 11px;
    font-weight: 800;
    color: #1B5E20;
    margin-bottom: 5px;
    text-transform: uppercase;
  }
  .btn-green {
    background: #228B22;
    color: #FFFFFF;
    border: none;
    border-radius: 0;
    cursor: pointer;
    font-weight: 700;
    transition: background 0.2s, transform 0.15s;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .btn-green:hover:not(:disabled) { background: #1B5E20; transform: translateY(-1px); }
  .btn-green:disabled { background: #6B8E23; cursor: not-allowed; opacity: 0.7; }
  .btn-outline {
    background: #FFFFFF;
    color: #1B5E20;
    border: 2px solid #228B22;
    border-radius: 0;
    cursor: pointer;
    font-weight: 700;
    transition: background 0.2s, color 0.2s;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .btn-outline:hover { background: #228B22; color: #FFFFFF; }
  .btn-reset {
    background: #F5F5F5;
    color: #424242;
    border: 2px solid #8D6E63;
    border-radius: 0;
    cursor: pointer;
    font-weight: 700;
    transition: background 0.2s;
  }
  .btn-reset:hover { background: #8D6E63; color: #FFFFFF; }
  
  .fba-tab {
    padding: 10px 24px;
    font-weight: 800;
    font-size: 13px;
    border: none;
    border-radius: 0;
    cursor: pointer;
    transition: all 0.15s;
    background: transparent;
    color: #1B5E20;
    border-bottom: 3px solid transparent;
  }
  .fba-tab.active {
    color: #228B22;
    border-bottom: 3px solid #228B22;
    background: #A5D6A7;
  }
  .fba-tab:hover:not(.active) {
    background: rgba(165,214,167,0.3);
  }
  
  .fba-tr { transition: background 0.15s; }
  .fba-tr:hover { background: #A5D6A7 !important; }
  
  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.6);
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
  }
  .modal-box {
    background: #FFFFFF;
    border: 2px solid #1B5E20;
    border-radius: 0;
    width: 100%;
    max-width: 900px;
    max-height: 90vh;
    overflow: auto;
    box-shadow: 0 25px 60px rgba(0,0,0,0.3);
    display: flex;
    flex-direction: column;
  }
  
  .grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
  .grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
  .grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
  
  @media (max-width: 1024px) {
    .grid-4 { grid-template-columns: repeat(2, 1fr); }
  }
  @media (max-width: 768px) {
    .grid-3 { grid-template-columns: 1fr; }
    .grid-2 { grid-template-columns: 1fr; }
    .grid-4 { grid-template-columns: 1fr; }
    .fba-wrap { padding: 12px; }
  }
  
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes slideIn { from { opacity: 0; transform: translateX(30px); } to { opacity: 1; transform: translateX(0); } }
`;

/* ── Helpers ────────────────────────────────────────────────────────────── */
const fmt  = (v, d = 2) => parseFloat(v||0).toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d });
const fmtD = (v) => v ? new Date(v).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' }) : '—';

const TYPE_META = {
  Bank:            { icon: <Building2  size={16}/>, color: '#1B5E20', bg: '#A5D6A7' },
  Cash:            { icon: <Wallet      size={16}/>, color: '#1B5E20', bg: '#A5D6A7' },
  'Mobile Wallet': { icon: <Smartphone size={16}/>, color: '#1B5E20', bg: '#A5D6A7' },
};
const CURRENCIES = ['ETB', 'USD', 'EUR'];
const STATUS_C = { Active: ['#1B5E20','#A5D6A7'], Inactive: ['#F44336','#FFEBEE'] };

/* ── Pill ─────────────────────────────────────────────────────────────────── */
const Pill = ({ label, color, bg }) => (
  <span style={{ background:bg, color, padding:'3px 12px', borderRadius:0, fontSize:11, fontWeight:800, whiteSpace:'nowrap', border: `1px solid ${color}` }}>{label}</span>
);

/* ── In-app Notification Toast ───────────────────────────────────────────── */
const Toast = ({ toasts }) => (
  <div style={{ position:'fixed', top:24, right:24, zIndex:9999, display:'flex', flexDirection:'column', gap:10, pointerEvents:'none' }}>
    {toasts.map(t => {
      const cfg = {
        success: { bg: '#4CAF50', icon: <CheckCircle size={18}/> },
        error:   { bg: '#F44336', icon: <AlertCircle size={18}/> },
        info:    { bg: '#87CEEB', icon: <Info size={18}/> },
        warning: { bg: '#FF9800', icon: <AlertTriangle size={18}/> },
      }[t.type] || { bg: '#8D6E63', icon: <Info size={18}/> };
      return (
        <div key={t.id} style={{ background: cfg.bg, color: '#FFFFFF', padding: '14px 20px', borderRadius: 0, border: '2px solid #1B5E20', display: 'flex', alignItems: 'center', gap: 12, fontSize: 14, fontWeight: 700, minWidth: 280, maxWidth: 420, pointerEvents: 'all', animation: 'slideIn .25s ease' }}>
          {cfg.icon}
          <span style={{ flex: 1 }}>{t.msg}</span>
        </div>
      );
    })}
  </div>
);

/* ── 4-Panel Reconciliation Summary ──────────────────────────────────────── */
const TypePanel = ({ label, icon, color, bg, erpBal, actualVal, onActualChange }) => (
  <div className="fba-card" style={{ padding: 20 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
      <div style={{ width: 40, height: 40, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: color, border: `1px solid ${color}` }}>
        {icon}
      </div>
      <div style={{ fontWeight: 800, fontSize: 16, color: '#1B5E20' }}>{label}</div>
    </div>
    <div style={{ marginBottom: 16, background: '#F5F5F5', padding: 12, border: '1px solid #8D6E63' }}>
      <div style={{ fontSize: 11, fontWeight: 800, color: '#1B5E20', textTransform: 'uppercase', marginBottom: 4 }}>ERP Balance (Cashbook)</div>
      <div style={{ fontSize: 24, fontWeight: 900, color: '#1B5E20' }}>ETB {fmt(erpBal)}</div>
    </div>
    <div>
      <div style={{ fontSize: 11, fontWeight: 800, color: '#1B5E20', textTransform: 'uppercase', marginBottom: 6 }}>Actual Balance</div>
      <input type="number" step="0.01" value={actualVal} onChange={e => onActualChange(e.target.value)}
        placeholder="Enter physical balance"
        className="fba-inp"
        style={{ fontSize: 16, fontWeight: 900, color: '#1B5E20', padding: '12px' }}/>
    </div>
  </div>
);

/* ── Main Component ──────────────────────────────────────────────────────── */
const FinanceBankAccounts = () => {
  const [tab, setTab]         = useState('overview');
  const [accounts, setAccounts]   = useState([]);
  const [summary, setSummary]     = useState(null);
  const [cashbook, setCashbook]   = useState([]);
  const [reconciliations, setReconciliations] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [toasts, setToasts]       = useState([]);

  const [typeBalances, setTypeBalances] = useState({ cash: 0, bank: 0, telebirr: 0, total: 0 });

  const [showForm, setShowForm]   = useState(false);
  const [editAcc, setEditAcc]     = useState(null);
  const BLANK = { account_name:'', account_type:'Bank', bank_provider:'', account_number:'', branch:'', currency:'ETB', opening_balance:'', opening_balance_date: new Date().toISOString().slice(0,10), description:'' };
  const [form, setForm] = useState(BLANK);

  const [reconAcc, setReconAcc]   = useState(null);
  const [reconFrom, setReconFrom] = useState('');
  const [reconTo, setReconTo]     = useState(new Date().toISOString().slice(0,10));
  const [actualBalance, setActualBalance] = useState('');
  const [reconNotes, setReconNotes] = useState('');
  const [reconItems, setReconItems] = useState([]);
  const [reconErpBal, setReconErpBal] = useState(0);
  const [loadingTx, setLoadingTx] = useState(false);
  const [saving, setSaving]       = useState(false);

  const [panelActuals, setPanelActuals] = useState({ cash:'', bank:'', telebirr:'', total:'' });

  const [viewAcc, setViewAcc]     = useState(null);
  const [viewTx, setViewTx]       = useState([]);

  const [expandedRecon, setExpandedRecon] = useState(null);
  const [expandedItems, setExpandedItems] = useState([]);

  const historyPrintRef = useRef(null);

  const printHistory = () => {
    if (!historyPrintRef.current) return;
    const content = historyPrintRef.current.innerHTML;
    const w = window.open('', '_blank');
    w.document.write(`
      <html>
        <head>
          <title>Reconciliation History</title>
          <style>
            body { font-family: 'Times New Roman', serif; color: #000; padding: 40px; margin: 0; }
            h2 { margin-top: 0; margin-bottom: 20px; font-size: 24px; text-transform: uppercase; text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 13px; }
            th, td { border: 1px solid #000; padding: 10px; text-align: left; }
            th { background: #eee; font-weight: bold; text-transform: uppercase; font-size: 11px; }
            .right { text-align: right; }
            .global-row { background: #ddd; font-weight: bold; border-top: 2px solid #000; }
            .diff-ok { font-weight: bold; }
            .diff-err { font-weight: bold; }
            @page { margin: 15mm; size: A4 landscape; }
          </style>
        </head>
        <body>
          <h2>RECONCILIATION HISTORY - SUTANA ENTERPRISE</h2>
          ${content}
        </body>
      </html>
    `);
    w.document.close();
    setTimeout(() => { w.print(); }, 250);
  };

  const toast = useCallback((msg, type = 'info', duration = 4000) => {
    const id = Date.now();
    setToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), duration);
  }, []);

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
      setReconItems([{ dummy: true }]); 
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
      toast('Reconciliation completed & saved!', 'success');
      setTab('history'); setReconAcc(null); load();
    } catch(e) { toast('Error saving: ' + e.message, 'error'); }
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
      
      toast('Global reconciliation saved successfully!', 'success');
      setPanelActuals({ cash:'', bank:'', telebirr:'', total:'' });
      setTab('history'); setReconAcc(null);
      load();
    } catch (e) {
      toast('Error saving global reconciliation: ' + e.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const viewTransactions = async (acc) => {
    setViewAcc(acc);
    try {
      const res = await apiClient.get(`/finance-bank/${acc.id}/transactions`);
      setViewTx(res?.data || []);
    } catch(e) { setViewTx([]); toast('Could not load transactions.', 'error'); }
  };

  const expandRecon = async (r) => {
    if (expandedRecon === r.id) { setExpandedRecon(null); setExpandedItems([]); return; }
    setExpandedRecon(r.id);
    try {
      const res = await apiClient.get(`/finance-bank/reconciliations/${r.id}`);
      setExpandedItems(res?.data?.items || []);
    } catch(e) { setExpandedItems([]); }
  };

  const sumCRV = reconItems.filter(i => i.type === 'CRV').reduce((s, i) => s + i.erp_amount, 0);
  const sumPV  = reconItems.filter(i => i.type === 'PV').reduce((s, i) => s + i.erp_amount, 0);
  const sumPCV = reconItems.filter(i => i.type === 'PCV').reduce((s, i) => s + i.erp_amount, 0);
  const diffVal    = parseFloat(actualBalance||0) - reconErpBal;
  const matchedCnt = reconItems.filter(i => i.match_status === 'Matched').length;

  return (
    <div className="fba-wrap">
      <style>{G}</style>
      <Toast toasts={toasts} />

      {/* Header */}
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 900, margin: 0, display: 'flex', alignItems: 'center', gap: 10, color: '#1B5E20' }}>
            <Landmark size={28} color="#228B22"/> Accounts &amp; Reconciliation
          </h1>
          <p style={{ color: '#424242', margin: '4px 0 0', fontSize: 14, fontWeight: 600 }}>
            Manage all accounts and reconcile Cash, Bank, and Mobile Wallet separately with total summary.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button type="button" className="btn-outline" onClick={load} style={{ padding: '10px 16px', fontSize: 13 }}>
            <SegmentedSpinner size={15} /> Refresh
          </button>
          {tab === 'accounts' && (
            <button type="button" className="btn-green" onClick={openAdd} style={{ padding: '10px 16px', fontSize: 13 }}>
              <Plus size={15}/> Add Account
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', background: 'white', border: '1px solid #8D6E63', marginBottom: 24, overflowX: 'auto' }}>
        <button className={`fba-tab ${tab === 'overview' ? 'active' : ''}`} onClick={() => setTab('overview')}>Overview</button>
        <button className={`fba-tab ${tab === 'accounts' ? 'active' : ''}`} onClick={() => setTab('accounts')}>Accounts</button>
        <button className={`fba-tab ${tab === 'reconcile' ? 'active' : ''}`} onClick={() => setTab('reconcile')}>Reconcile</button>
        <button className={`fba-tab ${tab === 'history' ? 'active' : ''}`} onClick={() => setTab('history')}>History</button>
      </div>

      {loading && <div style={{ color: '#1B5E20', padding: 48, textAlign: 'center', fontSize: 16, fontWeight: 700 }}><SegmentedSpinner size={32} /> Loading data…</div>}

      {/* ══════ OVERVIEW ══════════════════════════════════════════════════════ */}
      {!loading && tab === 'overview' && (
        <>
          {summary && (
            <>
              <div className="grid-3" style={{ marginBottom: 24 }}>
                {[
                  { label: 'Cash Receipt (CRV)', val: summary.totalCRV, color: '#1B5E20', bg: '#A5D6A7', icon: '💰', sub: 'Total income from CRVs' },
                  { label: 'Payment Voucher (PV)',  val: summary.totalPV,  color: '#F44336', bg: '#FFEBEE', icon: '💸', sub: 'Total PV payments' },
                  { label: 'Petty Cash (PCV)',       val: summary.totalPCV, color: '#FF9800', bg: '#FFF3E0', icon: '🪙', sub: 'Completed PCVs' },
                ].map(c => (
                  <div key={c.label} className="fba-card" style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                    <div style={{ fontSize: 32 }}>{c.icon}</div>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 800, color: '#1B5E20', textTransform: 'uppercase', marginBottom: 4 }}>{c.label}</div>
                      <div style={{ fontSize: 24, fontWeight: 900, color: c.color }}>ETB {fmt(c.val)}</div>
                      <div style={{ fontSize: 12, color: '#424242', marginTop: 2, fontWeight: 600 }}>{c.sub}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="grid-3" style={{ marginBottom: 24 }}>
                <div className="fba-card" style={{ display: 'flex', gap: 16, alignItems: 'center', borderLeft: '4px solid #228B22' }}>
                  <ArrowUpCircle size={32} color="#228B22"/>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 800, color: '#1B5E20', textTransform: 'uppercase', marginBottom: 4 }}>Total Income</div>
                    <div style={{ fontSize: 24, fontWeight: 900, color: '#228B22' }}>ETB {fmt(summary.totalIncome)}</div>
                  </div>
                </div>
                <div className="fba-card" style={{ display: 'flex', gap: 16, alignItems: 'center', borderLeft: '4px solid #F44336' }}>
                  <ArrowDownCircle size={32} color="#F44336"/>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 800, color: '#1B5E20', textTransform: 'uppercase', marginBottom: 4 }}>Total Payments</div>
                    <div style={{ fontSize: 24, fontWeight: 900, color: '#F44336' }}>ETB {fmt(summary.totalOut)}</div>
                  </div>
                </div>
                <div className="fba-card" style={{ display: 'flex', gap: 16, alignItems: 'center', background: '#1B5E20', border: '1px solid #1B5E20' }}>
                  <DollarSign size={32} color="#FFFFFF"/>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 800, color: '#A5D6A7', textTransform: 'uppercase', marginBottom: 4 }}>Net Balance</div>
                    <div style={{ fontSize: 24, fontWeight: 900, color: summary.netBalance >= 0 ? '#8BC34A' : '#FF5252' }}>ETB {fmt(summary.netBalance)}</div>
                  </div>
                </div>
              </div>
            </>
          )}

          <h3 style={{ fontSize: 18, fontWeight: 900, color: '#1B5E20', margin: '32px 0 16px', borderBottom: '2px solid #228B22', paddingBottom: 8, display: 'inline-block' }}>Accounts by Type</h3>
          <div className="grid-3" style={{ marginBottom: 32 }}>
            {['Bank','Cash','Mobile Wallet'].map(type => {
              const meta = TYPE_META[type];
              const accs = accounts.filter(a => a.account_type === type);
              return (
                <div key={type} className="fba-card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid #E0E0E0' }}>
                    <div style={{ width: 44, height: 44, background: meta.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: meta.color, border: `1px solid ${meta.color}` }}>{meta.icon}</div>
                    <div><div style={{ fontWeight: 900, fontSize: 18, color: '#1B5E20' }}>{type}</div><div style={{ fontSize: 12, color: '#424242', fontWeight: 600 }}>{accs.length} account{accs.length !== 1 ? 's' : ''}</div></div>
                  </div>
                  {accs.map(a => (
                    <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px dashed #E0E0E0' }}>
                      <div>
                        <span style={{ fontSize: 14, color: '#1B5E20', fontWeight: 800 }}>{a.account_name}</span>
                        <div style={{ fontSize: 13, color: parseFloat(a.netBalance||0) >= 0 ? '#228B22' : '#F44336', fontWeight: 800, marginTop: 4 }}>ETB {fmt(a.netBalance)}</div>
                      </div>
                      <Pill label={a.status} color={STATUS_C[a.status]?.[0]} bg={STATUS_C[a.status]?.[1]}/>
                    </div>
                  ))}
                  {accs.length === 0 && <div style={{ fontSize: 13, color: '#8D6E63', textAlign: 'center', padding: '16px 0', fontWeight: 600 }}>No {type} accounts yet</div>}
                </div>
              );
            })}
          </div>

          <h3 style={{ fontSize: 18, fontWeight: 900, color: '#1B5E20', margin: '32px 0 16px', borderBottom: '2px solid #228B22', paddingBottom: 8, display: 'inline-block' }}>Recent Cashbook Entries</h3>
          <div style={{ background: 'white', border: '1px solid #8D6E63', overflowX: 'auto', width: '100%' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 700 }}>
              <thead>
                <tr style={{ background: '#2E8B57', color: 'white' }}>
                  {['Date','Type','Reference','Description','Income','Payment','Running Balance'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: ['Income','Payment','Running Balance'].includes(h) ? 'right' : 'left', borderBottom: '2px solid #1B5E20', textTransform: 'uppercase', fontSize: 11, fontWeight: 800 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cashbook.slice(-25).reverse().map((row, i) => (
                  <tr key={i} className="fba-tr" style={{ borderBottom: '1px solid #E0E0E0', background: i % 2 === 0 ? 'white' : '#F1F8E9' }}>
                    <td style={{ padding: '12px 16px', color: '#424242', fontWeight: 600, whiteSpace: 'nowrap' }}>{fmtD(row.date)}</td>
                    <td style={{ padding: '12px 16px' }}><Pill label={row.type} color={row.type==='CRV'?'#1B5E20':row.type==='PV'?'#F44336':'#FF9800'} bg={row.type==='CRV'?'#A5D6A7':row.type==='PV'?'#FFEBEE':'#FFF3E0'}/></td>
                    <td style={{ padding: '12px 16px', fontFamily: 'monospace', color: '#1B5E20', fontWeight: 800 }}>{row.reference}</td>
                    <td style={{ padding: '12px 16px', color: '#424242', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 600 }}>{row.description}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', color: '#228B22', fontWeight: 800 }}>{parseFloat(row.receipts||0)>0 ? fmt(row.receipts) : '—'}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', color: '#F44336', fontWeight: 800 }}>{parseFloat(row.payments||0)>0 ? fmt(row.payments) : '—'}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 900, color: row.balance>=0 ? '#1B5E20' : '#F44336' }}>{fmt(row.balance)}</td>
                  </tr>
                ))}
                {cashbook.length === 0 && <tr><td colSpan={7} style={{ padding: 32, textAlign: 'center', color: '#8D6E63', fontWeight: 600 }}>No entries found in cashbook.</td></tr>}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ══════ ACCOUNTS ══════════════════════════════════════════════════════ */}
      {!loading && tab === 'accounts' && (
        <>
          {showForm && (
            <div className="fba-card" style={{ marginBottom: 24, borderLeft: '4px solid #228B22' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: '#1B5E20' }}>{editAcc ? 'Edit Account' : 'Add New Account'}</h3>
                <button type="button" onClick={() => setShowForm(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#1B5E20' }}><X size={20}/></button>
              </div>
              <form onSubmit={saveAccount} className="grid-3" style={{ gap: 20 }}>
                <div><label className="fba-lbl">Account Name <span style={{ color: '#F44336' }}>*</span></label><input className="fba-inp" required value={form.account_name} onChange={e=>setForm({...form, account_name:e.target.value})} placeholder="e.g. Main Cash"/></div>
                <div><label className="fba-lbl">Account Type <span style={{ color: '#F44336' }}>*</span></label>
                  <select className="fba-select" value={form.account_type} onChange={e=>setForm({...form, account_type:e.target.value})}>
                    <option>Bank</option><option>Cash</option><option>Mobile Wallet</option>
                  </select>
                </div>
                <div><label className="fba-lbl">Bank / Provider</label><input className="fba-inp" value={form.bank_provider} onChange={e=>setForm({...form, bank_provider:e.target.value})} placeholder="e.g. CBE, Awash, Telebirr"/></div>
                <div><label className="fba-lbl">Account Number</label><input className="fba-inp" value={form.account_number} onChange={e=>setForm({...form, account_number:e.target.value})}/></div>
                <div><label className="fba-lbl">Company Branch</label><input className="fba-inp" value={form.branch} onChange={e=>setForm({...form, branch:e.target.value})}/></div>
                <div><label className="fba-lbl">Currency <span style={{ color: '#F44336' }}>*</span></label>
                  <select className="fba-select" value={form.currency} onChange={e=>setForm({...form, currency:e.target.value})}>
                    {CURRENCIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div><label className="fba-lbl">Opening Balance <span style={{ color: '#F44336' }}>*</span></label><input className="fba-inp" required type="number" step="0.01" value={form.opening_balance} onChange={e=>setForm({...form, opening_balance:e.target.value})}/></div>
                <div><label className="fba-lbl">Opening Balance Date <span style={{ color: '#F44336' }}>*</span></label><input className="fba-inp" required type="date" value={form.opening_balance_date} onChange={e=>setForm({...form, opening_balance_date:e.target.value})}/></div>
                <div><label className="fba-lbl">Description</label><input className="fba-inp" value={form.description} onChange={e=>setForm({...form, description:e.target.value})}/></div>
                <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 10 }}>
                  <button type="button" className="btn-reset" onClick={() => setShowForm(false)} style={{ padding: '10px 24px' }}>Cancel</button>
                  <button type="submit" className="btn-green" style={{ padding: '10px 32px' }}>Save Account</button>
                </div>
              </form>
            </div>
          )}

          <div className="grid-3">
            {accounts.map(acc => {
              const meta = TYPE_META[acc.account_type] || TYPE_META['Cash'];
              return (
                <div key={acc.id} className="fba-card" style={{ display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      <div style={{ width: 48, height: 48, background: meta.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: meta.color, border: `1px solid ${meta.color}` }}>{meta.icon}</div>
                      <div>
                        <div style={{ fontWeight: 900, fontSize: 16, color: '#1B5E20' }}>{acc.account_name}</div>
                        <div style={{ fontSize: 13, color: '#424242', fontWeight: 600 }}>{acc.account_type}{acc.bank_provider ? ` · ${acc.bank_provider}` : ''}</div>
                      </div>
                    </div>
                    <Pill label={acc.status} color={STATUS_C[acc.status]?.[0]} bg={STATUS_C[acc.status]?.[1]}/>
                  </div>
                  {acc.account_number && <div style={{ fontSize: 14, fontFamily: 'monospace', color: '#1B5E20', fontWeight: 800, marginBottom: 16, background: '#F5F5F5', padding: '6px 10px', border: '1px solid #8D6E63', display: 'inline-block' }}>{acc.account_number}</div>}

                  <div style={{ background: parseFloat(acc.netBalance||0) >= 0 ? '#A5D6A7' : '#FFEBEE', border: `1px solid ${parseFloat(acc.netBalance||0) >= 0 ? '#228B22' : '#F44336'}`, padding: '16px', marginBottom: 16 }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: '#1B5E20', textTransform: 'uppercase', marginBottom: 6 }}>Live Balance (from Cashbook)</div>
                    <div style={{ fontSize: 24, fontWeight: 900, color: parseFloat(acc.netBalance||0) >= 0 ? '#1B5E20' : '#F44336' }}>
                      {acc.currency} {fmt(acc.netBalance)}
                    </div>
                    <div style={{ fontSize: 11, color: '#424242', marginTop: 6, fontWeight: 600 }}>Opening {acc.currency} {fmt(acc.opening_balance)} + movements</div>
                  </div>

                  <div className="grid-2" style={{ background: '#F5F5F5', border: '1px solid #8D6E63', padding: 12, marginBottom: 20, fontSize: 12, color: '#424242' }}>
                    <div><b style={{ color: '#1B5E20' }}>In:</b> ETB {fmt(acc.totalIn)}</div>
                    <div><b style={{ color: '#1B5E20' }}>Out:</b> ETB {fmt(acc.totalOut)}</div>
                    {acc.branch && <div><b style={{ color: '#1B5E20' }}>Branch:</b> {acc.branch}</div>}
                    <div><b style={{ color: '#1B5E20' }}>Since:</b> {fmtD(acc.opening_balance_date)}</div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
                    <button type="button" onClick={()=>viewTransactions(acc)} className="btn-outline" style={{ flex: 1, padding: '8px', justifyContent: 'center', fontSize: 12 }}><Eye size={14}/> View</button>
                    <button type="button" onClick={()=>openEdit(acc)} className="btn-outline" style={{ flex: 1, padding: '8px', justifyContent: 'center', fontSize: 12, color: '#2563eb', borderColor: '#2563eb' }}><Edit3 size={14}/> Edit</button>
                    <button type="button" onClick={()=>startRecon(acc)} className="btn-green" style={{ flex: 1, padding: '8px', justifyContent: 'center', fontSize: 12 }}><RotateCcw size={14}/> Reconcile</button>
                    <button type="button" onClick={()=>toggleStatus(acc)} title={acc.status==='Active'?'Deactivate':'Activate'} style={{ padding: '8px 12px', background: acc.status==='Active' ? '#F44336' : '#228B22', color: '#FFFFFF', border: 'none', cursor: 'pointer', borderRadius: 0 }}><PowerOff size={16}/></button>
                  </div>
                </div>
              );
            })}
            {accounts.length === 0 && <div style={{ padding: 48, textAlign: 'center', color: '#8D6E63', fontSize: 16, fontWeight: 700, gridColumn: '1 / -1' }}>No accounts yet. Click "Add Account" to get started.</div>}
          </div>
        </>
      )}

      {/* ══════ RECONCILE ══════════════════════════════════════════════════════ */}
      {!loading && tab === 'reconcile' && (
        !reconAcc ? (
          <>
            <h3 style={{ fontSize: 18, fontWeight: 900, color: '#1B5E20', margin: '0 0 16px', borderBottom: '2px solid #228B22', paddingBottom: 8, display: 'inline-block' }}>Select an Account to Reconcile</h3>
            
            <div style={{ marginBottom: 32 }}>
              <div className="fba-card" onClick={()=>startRecon('GLOBAL')} style={{ cursor: 'pointer', display: 'flex', gap: 16, alignItems: 'center', border: '2px solid #228B22', background: '#A5D6A7' }}>
                <div style={{ width: 50, height: 50, background: '#1B5E20', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', border: '1px solid #1B5E20' }}><DollarSign size={24}/></div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 900, fontSize: 18, color: '#1B5E20' }}>Global Reconciliation Summary</div>
                  <div style={{ fontSize: 14, color: '#424242', marginTop: 4, fontWeight: 600 }}>Reconcile Cash, Bank, and Mobile Wallet all at once against the total cashbook</div>
                </div>
                <RotateCcw size={24} color="#1B5E20"/>
              </div>
            </div>

            <h4 style={{ fontSize: 14, fontWeight: 900, color: '#1B5E20', textTransform: 'uppercase', margin: '0 0 16px' }}>Individual Accounts</h4>
            <div className="grid-3">
              {accounts.filter(a=>a.status==='Active').map(acc => {
                const meta = TYPE_META[acc.account_type]||TYPE_META['Cash'];
                return (
                  <div key={acc.id} className="fba-card" onClick={()=>startRecon(acc)} style={{ cursor: 'pointer', display: 'flex', gap: 16, alignItems: 'center' }}>
                    <div style={{ width: 50, height: 50, background: meta.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: meta.color, border: `1px solid ${meta.color}` }}>{meta.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 900, fontSize: 16, color: '#1B5E20' }}>{acc.account_name}</div>
                      <div style={{ fontSize: 13, color: '#424242', fontWeight: 600 }}>{acc.account_type}{acc.bank_provider?` · ${acc.bank_provider}`:''}</div>
                      <div style={{ fontSize: 14, fontWeight: 900, color: '#228B22', marginTop: 4 }}>ETB {fmt(acc.netBalance)}</div>
                    </div>
                    <RotateCcw size={20} color="#228B22"/>
                  </div>
                );
              })}
              {accounts.filter(a=>a.status==='Active').length === 0 && <div style={{ padding: 48, color: '#8D6E63', fontSize: 16, fontWeight: 700, gridColumn: '1 / -1', textAlign: 'center' }}>No active accounts found. Create one from the Accounts tab.</div>}
            </div>
          </>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
              {reconAcc === 'GLOBAL' ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ width: 50, height: 50, background: '#1B5E20', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', border: '1px solid #1B5E20' }}>
                    <DollarSign size={24}/>
                  </div>
                  <div>
                    <h2 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: '#1B5E20' }}>Global Reconciliation Summary</h2>
                    <div style={{ fontSize: 14, color: '#424242', marginTop: 4, fontWeight: 600 }}>Cash, Bank, and Mobile Wallet</div>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ width: 50, height: 50, background: (TYPE_META[reconAcc.account_type]||TYPE_META['Cash']).bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: (TYPE_META[reconAcc.account_type]||TYPE_META['Cash']).color, border: `1px solid ${(TYPE_META[reconAcc.account_type]||TYPE_META['Cash']).color}` }}>
                    {(TYPE_META[reconAcc.account_type]||TYPE_META['Cash']).icon}
                  </div>
                  <div>
                    <h2 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: '#1B5E20' }}>Reconciling: {reconAcc.account_name}</h2>
                    <div style={{ fontSize: 14, color: '#424242', marginTop: 4, fontWeight: 600 }}>{reconAcc.account_type}{reconAcc.bank_provider?` · ${reconAcc.bank_provider}`:''} · ERP Balance: <span style={{ color: '#228B22', fontWeight: 800 }}>ETB {fmt(reconErpBal)}</span></div>
                  </div>
                </div>
              )}
              <button type="button" className="btn-outline" onClick={()=>setReconAcc(null)} style={{ padding: '10px 20px', fontSize: 13 }}><X size={16}/> Cancel</button>
            </div>

            <div className="fba-card" style={{ marginBottom: 24, display: 'flex', gap: 24, alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, display: 'flex', gap: 16, minWidth: 300 }}>
                <div style={{ flex: 1 }}><label className="fba-lbl">Period From</label><input type="date" className="fba-inp" value={reconFrom} onChange={e=>setReconFrom(e.target.value)}/></div>
                <div style={{ flex: 1 }}><label className="fba-lbl">Period To</label><input type="date" className="fba-inp" value={reconTo} onChange={e=>setReconTo(e.target.value)}/></div>
              </div>
              <button type="button" className="btn-green" onClick={loadReconTx} disabled={loadingTx} style={{ padding: '12px 24px', fontSize: 14 }}>
                {loadingTx ? <SegmentedSpinner size={18} /> : '🔍 Load Data'}
              </button>
            </div>

            {reconAcc === 'GLOBAL' ? (
              reconItems.length > 0 && (
                <div style={{ marginTop: 32 }}>
                  <div className="grid-3" style={{ marginBottom: 32 }}>
                    <TypePanel
                      label="Cash" icon={<Wallet size={20}/>} color="#1B5E20" bg="#A5D6A7"
                      erpBal={typeBalances.cash}
                      actualVal={panelActuals.cash}
                      onActualChange={v => setPanelActuals(p => ({...p, cash: v}))}
                    />
                    <TypePanel
                      label="Bank" icon={<Building2 size={20}/>} color="#1B5E20" bg="#A5D6A7"
                      erpBal={typeBalances.bank}
                      actualVal={panelActuals.bank}
                      onActualChange={v => setPanelActuals(p => ({...p, bank: v}))}
                    />
                    <TypePanel
                      label="Mobile Wallet (Telebirr)" icon={<Smartphone size={20}/>} color="#1B5E20" bg="#A5D6A7"
                      erpBal={typeBalances.telebirr}
                      actualVal={panelActuals.telebirr}
                      onActualChange={v => setPanelActuals(p => ({...p, telebirr: v}))}
                    />
                  </div>
                  
                  {(() => {
                    const cashAct     = panelActuals.cash     !== '' ? parseFloat(panelActuals.cash)     : null;
                    const bankAct     = panelActuals.bank     !== '' ? parseFloat(panelActuals.bank)     : null;
                    const telebirrAct = panelActuals.telebirr !== '' ? parseFloat(panelActuals.telebirr) : null;
                    const allEntered  = cashAct !== null && bankAct !== null && telebirrAct !== null;
                    const sumActuals  = (cashAct||0) + (bankAct||0) + (telebirrAct||0);
                    const totalDiff   = typeBalances.total - sumActuals;
                    const balanced    = allEntered && Math.abs(totalDiff) < 0.005;
                    return (
                      <div className="fba-card" style={{ padding: 32, border: balanced ? '4px solid #228B22' : allEntered ? '4px solid #F44336' : '1px solid #8D6E63', background: balanced ? '#A5D6A7' : allEntered ? '#FFEBEE' : '#FFFFFF', marginBottom: 32 }}>
                        <div className="grid-4" style={{ alignItems: 'center', textAlign: 'center' }}>
                          <div style={{ borderRight: '1px solid #8D6E63' }}>
                            <div style={{ fontSize: 12, fontWeight: 800, color: '#1B5E20', textTransform: 'uppercase', marginBottom: 8 }}>Total ERP Balance</div>
                            <div style={{ fontSize: 32, fontWeight: 900, color: '#1B5E20' }}>ETB {fmt(typeBalances.total)}</div>
                            <div style={{ fontSize: 12, color: '#424242', marginTop: 6, fontWeight: 600 }}>Up to {fmtD(reconTo)}</div>
                          </div>
                          <div style={{ borderRight: '1px solid #8D6E63' }}>
                            <div style={{ fontSize: 12, fontWeight: 800, color: '#1B5E20', textTransform: 'uppercase', marginBottom: 8 }}>Sum of Actuals</div>
                            <div style={{ fontSize: 32, fontWeight: 900, color: allEntered ? '#1B5E20' : '#8D6E63' }}>
                              {allEntered ? `ETB ${fmt(sumActuals)}` : '—'}
                            </div>
                          </div>
                          <div style={{ borderRight: '1px solid #8D6E63' }}>
                            <div style={{ fontSize: 14, color: '#1B5E20', marginBottom: 8, fontWeight: 800 }}>Formula</div>
                            <div style={{ fontSize: 14, fontWeight: 900, color: '#1B5E20', background: 'rgba(255,255,255,0.5)', padding: '10px 14px', fontFamily: 'monospace', display: 'inline-block', border: '1px solid #1B5E20' }}>
                              Total ERP − Sum Actuals
                            </div>
                          </div>
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 800, color: '#1B5E20', textTransform: 'uppercase', marginBottom: 8 }}>Total Difference</div>
                            <div style={{ fontSize: 40, fontWeight: 900, color: balanced ? '#228B22' : allEntered ? '#F44336' : '#8D6E63' }}>
                              {allEntered ? fmt(totalDiff) : '—'}
                            </div>
                            {balanced && <div style={{ fontSize: 14, fontWeight: 900, color: '#1B5E20', marginTop: 8 }}>✓ Fully Balanced</div>}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button type="button" className="btn-green" onClick={saveGlobalRecon} disabled={saving} style={{ padding: '14px 32px', fontSize: 16 }}>
                      <CheckCircle2 size={20}/> {saving ? 'Saving...' : 'Save Global Reconciliation'}
                    </button>
                  </div>
                </div>
              )
            ) : (
              <>
                <div className="grid-3" style={{ marginBottom: 24 }}>
                  <div className="fba-card">
                    <div style={{ fontSize: 12, fontWeight: 800, color: '#1B5E20', textTransform: 'uppercase', marginBottom: 8 }}>ERP Balance</div>
                    <div style={{ fontSize: 32, fontWeight: 900, color: '#1B5E20' }}>ETB {fmt(reconErpBal)}</div>
                    <div style={{ fontSize: 12, color: '#424242', marginTop: 6, fontWeight: 600 }}>Up to {fmtD(reconTo)}</div>
                  </div>
                  <div className="fba-card">
                    <div style={{ fontSize: 12, fontWeight: 800, color: '#1B5E20', textTransform: 'uppercase', marginBottom: 8 }}>Actual Balance</div>
                    <input type="number" className="fba-inp" step="0.01" value={actualBalance} onChange={e=>setActualBalance(e.target.value)} placeholder="0.00" style={{ fontSize: 24, fontWeight: 900, padding: '12px' }}/>
                    <div style={{ fontSize: 12, color: '#424242', marginTop: 6, fontWeight: 600 }}>From physical statement</div>
                  </div>
                  <div className="fba-card" style={{ border: diffVal===0&&actualBalance ? '4px solid #228B22' : '1px solid #8D6E63', background: diffVal===0&&actualBalance ? '#A5D6A7' : '#FFFFFF' }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: '#1B5E20', textTransform: 'uppercase', marginBottom: 8 }}>Difference</div>
                    <div style={{ fontSize: 32, fontWeight: 900, color: diffVal===0&&actualBalance ? '#1B5E20' : '#F44336' }}>{actualBalance ? fmt(diffVal) : '—'}</div>
                    <div style={{ fontSize: 12, color: diffVal===0&&actualBalance ? '#1B5E20' : '#424242', marginTop: 6, fontWeight: 800 }}>
                      {diffVal===0&&actualBalance ? '✓ Balanced' : 'Actual − ERP'}
                    </div>
                  </div>
                </div>

                {reconItems.length > 0 && (
                  <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#A5D6A7', border: '1px solid #1B5E20', padding: '10px 20px', fontSize: 14 }}>
                      <span style={{ fontWeight: 900, color: '#1B5E20' }}>CRV:</span> <span style={{ fontWeight: 800, color: '#1B5E20' }}>+ETB {fmt(sumCRV)}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#FFEBEE', border: '1px solid #F44336', padding: '10px 20px', fontSize: 14 }}>
                      <span style={{ fontWeight: 900, color: '#F44336' }}>PV:</span> <span style={{ fontWeight: 800, color: '#F44336' }}>−ETB {fmt(sumPV)}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#FFF3E0', border: '1px solid #FF9800', padding: '10px 20px', fontSize: 14 }}>
                      <span style={{ fontWeight: 900, color: '#FF9800' }}>PCV:</span> <span style={{ fontWeight: 800, color: '#FF9800' }}>−ETB {fmt(sumPCV)}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#1B5E20', border: '1px solid #1B5E20', padding: '10px 20px', fontSize: 14, color: 'white', fontWeight: 900 }}>
                      Net: ETB {fmt(sumCRV - sumPV - sumPCV)}
                    </div>
                  </div>
                )}

                <div className="fba-card" style={{ marginBottom: 24 }}>
                  <label className="fba-lbl">Reconciliation Notes (Optional)</label>
                  <textarea className="fba-inp" value={reconNotes} onChange={e=>setReconNotes(e.target.value)} rows={3}
                    style={{ resize: 'vertical', fontSize: 14 }}
                    placeholder="Add any notes about this reconciliation period…"/>
                </div>

                {reconItems.length > 0 && (
                  <div style={{ background: 'white', border: '1px solid #8D6E63', marginBottom: 24 }}>
                    <div style={{ padding: '16px 24px', borderBottom: '1px solid #8D6E63', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F5F5F5' }}>
                      <div>
                        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: '#1B5E20' }}>Transactions ({reconItems.length})</h3>
                        <div style={{ fontSize: 13, color: '#424242', marginTop: 4, fontWeight: 600 }}>Matched: <b style={{ color: '#228B22' }}>{matchedCnt}</b> / {reconItems.length}</div>
                      </div>
                      <button type="button" className="btn-outline" onClick={autoMatch} style={{ padding: '10px 20px', fontSize: 13 }}>⚡ Auto Match All</button>
                    </div>
                    <div style={{ overflowX: 'auto', width: '100%' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 800 }}>
                        <thead>
                          <tr style={{ background: '#2E8B57', color: 'white', fontSize: 11, textTransform: 'uppercase' }}>
                            {['Date','Ref No','Type','Description','ERP Amount','Actual Amount','Difference','Status'].map(h => (
                              <th key={h} style={{ padding: '12px 16px', textAlign: 'left', borderBottom: '2px solid #1B5E20', fontWeight: 800 }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {reconItems.map((it, idx) => (
                            <tr key={idx} className="fba-tr" style={{ borderBottom: '1px solid #E0E0E0', background: it.match_status==='Matched' ? '#A5D6A7' : 'white' }}>
                              <td style={{ padding: '12px 16px', color: '#424242', whiteSpace: 'nowrap', fontWeight: 600 }}>{fmtD(it.date)}</td>
                              <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontWeight: 900, color: '#1B5E20' }}>{it.reference}</td>
                              <td style={{ padding: '12px 16px' }}><Pill label={it.type} color={it.type==='CRV'?'#1B5E20':it.type==='PV'?'#F44336':'#FF9800'} bg={it.type==='CRV'?'#A5D6A7':it.type==='PV'?'#FFEBEE':'#FFF3E0'}/></td>
                              <td style={{ padding: '12px 16px', color: '#424242', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 600 }}>{it.description}</td>
                              <td style={{ padding: '12px 16px', fontWeight: 800, color: it.isReceipt?'#228B22':'#F44336', whiteSpace: 'nowrap' }}>{it.isReceipt?'+':'−'}{fmt(it.erp_amount)}</td>
                              <td style={{ padding: '12px 16px', width: 140 }}>
                                <input type="number" step="0.01" className="fba-inp" value={it.actual_amount||''} onChange={e=>updateActual(idx, e.target.value)}
                                  style={{ padding: '8px 10px', textAlign: 'right' }}/>
                              </td>
                              <td style={{ padding: '12px 16px', fontWeight: 900, color: it.difference===0?'#1B5E20':'#F44336', whiteSpace: 'nowrap' }}>{fmt(it.difference)}</td>
                              <td style={{ padding: '12px 16px' }}><Pill label={it.match_status} color={it.match_status==='Matched'?'#1B5E20':'#F44336'} bg={it.match_status==='Matched'?'#A5D6A7':'#FFEBEE'}/></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 16, marginTop: 24, alignItems: 'center' }}>
                  {reconItems.length === 0 && <div style={{ color: '#8D6E63', fontSize: 14, fontWeight: 700 }}>Load transactions first, then complete the reconciliation.</div>}
                  <button type="button" className="btn-green" onClick={saveRecon} disabled={saving} style={{ padding: '14px 32px', fontSize: 15 }}>
                    <CheckCircle2 size={18}/> {saving ? 'Saving…' : 'Complete Reconciliation'}
                  </button>
                </div>
              </>
            )}
          </>
        )
      )}

      {/* ══════ HISTORY ══════════════════════════════════════════════════════ */}
      {!loading && tab === 'history' && (() => {
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

        return (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h3 style={{ fontSize: 18, fontWeight: 900, color: '#1B5E20', margin: 0, borderBottom: '2px solid #228B22', paddingBottom: 8 }}>Reconciliation History</h3>
              <button type="button" className="btn-outline" onClick={printHistory} style={{ padding: '10px 16px', fontSize: 13 }}>
                <Printer size={16}/> Print History
              </button>
            </div>

            {reconciliations.length > 0 && (
              <div className="grid-4" style={{ marginBottom: 32 }}>
                {[
                  { label: 'Total Reconciliations', val: reconciliations.length, color: '#1B5E20' },
                  { label: 'Completed', val: reconciliations.filter(r=>r.status==='Completed').length, color: '#228B22' },
                  { label: 'Draft', val: reconciliations.filter(r=>r.status==='Draft').length, color: '#FF9800' },
                  { label: 'Balanced', val: reconciliations.filter(r=>parseFloat(r.difference)===0).length, color: '#1B5E20' },
                ].map(c => (
                  <div key={c.label} className="fba-card" style={{ padding: '20px 24px' }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: '#1B5E20', textTransform: 'uppercase', marginBottom: 6 }}>{c.label}</div>
                    <div style={{ fontSize: 32, fontWeight: 900, color: c.color }}>{c.val}</div>
                  </div>
                ))}
              </div>
            )}

            {reconciliations.length === 0 ? (
              <div className="fba-card" style={{ padding: 64, textAlign: 'center' }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: '#1B5E20', marginBottom: 8 }}>No reconciliation records yet</div>
                <div style={{ fontSize: 14, color: '#424242', fontWeight: 600 }}>Go to the Reconcile tab to start your first reconciliation.</div>
              </div>
            ) : groupedReconciliations.map(item => {
              if (item.isGlobal) {
                return (
                  <div key={item.groupId} className="fba-card" style={{ marginBottom: 20, padding: 0, border: '2px solid #228B22', overflowX: 'auto' }}>
                    <div
                      onClick={() => {
                        if (expandedRecon === item.groupId) setExpandedRecon(null);
                        else { setExpandedRecon(item.groupId); setExpandedItems([]); }
                      }}
                      style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 20, cursor: 'pointer', background: '#A5D6A7', borderBottom: '1px solid #228B22', minWidth: 900 }}
                    >
                      <div style={{ width: 44, height: 44, background: '#1B5E20', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', border: '1px solid #1B5E20' }}>
                        <DollarSign size={20}/>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 900, fontSize: 16, color: '#1B5E20' }}>Global Summary</div>
                        <div style={{ fontSize: 13, color: '#1B5E20', marginTop: 4, fontWeight: 800 }}>{item.records.length} Accounts Included</div>
                      </div>
                      <div style={{ flex: '0 0 240px' }}>
                        <div style={{ fontSize: 11, fontWeight: 800, color: '#1B5E20', textTransform: 'uppercase', marginBottom: 4 }}>Period</div>
                        <div style={{ fontSize: 14, color: '#1B5E20', fontWeight: 900 }}>{fmtD(item.period_from)} → {fmtD(item.period_to)}</div>
                      </div>
                      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
                        <div style={{ fontSize: 13, color: '#1B5E20', fontWeight: 800, whiteSpace: 'nowrap' }}>{fmtD(item.created_at)}</div>
                        <div style={{ fontSize: 24, color: '#1B5E20', transition: 'transform .2s', transform: expandedRecon===item.groupId ? 'rotate(180deg)' : 'none', fontWeight: 900 }}>▾</div>
                      </div>
                    </div>
                    {expandedRecon === item.groupId && (
                      <div style={{ background: 'white' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                          <thead>
                            <tr style={{ color: '#FFFFFF', fontSize: 11, textTransform: 'uppercase', background: '#2E8B57' }}>
                              <th style={{ padding: '14px 24px', textAlign: 'left', borderBottom: '2px solid #1B5E20', fontWeight: 800 }}>Account</th>
                              <th style={{ padding: '14px 24px', textAlign: 'right', borderBottom: '2px solid #1B5E20', fontWeight: 800 }}>ERP Balance</th>
                              <th style={{ padding: '14px 24px', textAlign: 'right', borderBottom: '2px solid #1B5E20', fontWeight: 800 }}>Actual Balance</th>
                              <th style={{ padding: '14px 24px', textAlign: 'right', borderBottom: '2px solid #1B5E20', fontWeight: 800 }}>Difference</th>
                            </tr>
                          </thead>
                          <tbody>
                            {item.records.map((r, i) => (
                              <tr key={r.id} className="fba-tr" style={{ borderBottom: '1px solid #E0E0E0', background: i % 2 === 0 ? 'white' : '#F1F8E9' }}>
                                <td style={{ padding: '14px 24px', fontWeight: 800, color: '#1B5E20' }}>{r.account_name} ({r.account_type})</td>
                                <td style={{ padding: '14px 24px', textAlign: 'right', fontWeight: 800, color: '#424242' }}>{fmt(r.erp_balance)}</td>
                                <td style={{ padding: '14px 24px', textAlign: 'right', fontWeight: 800, color: '#424242' }}>{fmt(r.actual_balance)}</td>
                                <td style={{ padding: '14px 24px', textAlign: 'right', fontWeight: 900, color: parseFloat(r.difference)===0?'#228B22':'#F44336' }}>{fmt(r.difference)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              }
              const r = item;
              return (
                <div key={r.id} className="fba-card" style={{ marginBottom: 16, padding: 0, overflowX: 'auto' }}>
                  <div
                    onClick={() => {
                      if (expandedRecon === r.id) { setExpandedRecon(null); return; }
                      setExpandedRecon(r.id);
                      apiClient.get(`/finance-bank/reconciliations/${r.id}`).then(res => setExpandedItems(res?.data?.items || [])).catch(()=>toast('Error','error'));
                    }}
                    style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 20, cursor: 'pointer', transition: 'background .15s', minWidth: 900 }}
                    onMouseEnter={e=>e.currentTarget.style.background='#F1F8E9'}
                    onMouseLeave={e=>e.currentTarget.style.background='white'}
                  >
                    <div style={{ width: 44, height: 44, background: (TYPE_META[r.account_type]||TYPE_META['Cash']).bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: (TYPE_META[r.account_type]||TYPE_META['Cash']).color, border: `1px solid ${(TYPE_META[r.account_type]||TYPE_META['Cash']).color}` }}>
                      {(TYPE_META[r.account_type]||TYPE_META['Cash']).icon}
                    </div>

                    <div style={{ flex: '0 0 200px' }}>
                      <div style={{ fontFamily: 'monospace', fontWeight: 900, fontSize: 15, color: '#1B5E20' }}>{r.reconciliation_no}</div>
                      <div style={{ fontSize: 13, color: '#424242', marginTop: 4, fontWeight: 600 }}>{r.account_name}</div>
                    </div>

                    <div style={{ flex: '0 0 220px' }}>
                      <div style={{ fontSize: 11, fontWeight: 800, color: '#1B5E20', textTransform: 'uppercase', marginBottom: 4 }}>Period</div>
                      <div style={{ fontSize: 14, color: '#424242', fontWeight: 800 }}>{fmtD(r.period_from)} → {fmtD(r.period_to)}</div>
                    </div>

                    <div style={{ flex: '0 0 150px' }}>
                      <div style={{ fontSize: 11, fontWeight: 800, color: '#1B5E20', textTransform: 'uppercase', marginBottom: 4 }}>ERP Balance</div>
                      <div style={{ fontSize: 15, fontWeight: 900, color: '#1B5E20' }}>{r.currency||'ETB'} {fmt(r.erp_balance)}</div>
                    </div>
                    <div style={{ flex: '0 0 150px' }}>
                      <div style={{ fontSize: 11, fontWeight: 800, color: '#1B5E20', textTransform: 'uppercase', marginBottom: 4 }}>Actual Balance</div>
                      <div style={{ fontSize: 15, fontWeight: 900, color: '#1B5E20' }}>{r.currency||'ETB'} {fmt(r.actual_balance)}</div>
                    </div>

                    <div style={{ flex: '0 0 140px' }}>
                      <div style={{ fontSize: 11, fontWeight: 800, color: '#1B5E20', textTransform: 'uppercase', marginBottom: 4 }}>Difference</div>
                      <div style={{ fontSize: 16, fontWeight: 900, color: parseFloat(r.difference)===0 ? '#228B22' : '#F44336' }}>{fmt(r.difference)}</div>
                    </div>

                    <div style={{ flex: '0 0 120px' }}>
                      <Pill label={r.status} color={r.status==='Completed'?'#1B5E20':'#FF9800'} bg={r.status==='Completed'?'#A5D6A7':'#FFF3E0'}/>
                      {parseFloat(r.difference)===0 && <div style={{ fontSize: 11, color: '#1B5E20', marginTop: 6, fontWeight: 900 }}>✓ Balanced</div>}
                    </div>

                    <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
                      <div style={{ fontSize: 13, color: '#8D6E63', fontWeight: 600, whiteSpace: 'nowrap' }}>{fmtD(r.created_at)}</div>
                      <div style={{ fontSize: 24, color: '#1B5E20', transition: 'transform .2s', transform: expandedRecon===r.id ? 'rotate(180deg)' : 'none', fontWeight: 900 }}>▾</div>
                    </div>
                  </div>

                  {expandedRecon === r.id && (
                    <div style={{ borderTop: '2px solid #8D6E63' }}>
                      {r.notes && (
                        <div style={{ padding: '14px 24px', background: '#FFF3E0', fontSize: 14, color: '#1B5E20', fontWeight: 700 }}>📝 {r.notes}</div>
                      )}
                      <div style={{ overflowX: 'auto', width: '100%' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 800 }}>
                          <thead>
                            <tr style={{ background: '#2E8B57', color: 'white', fontSize: 11, textTransform: 'uppercase' }}>
                              {['Date','Reference','Type','Description','ERP Amount','Actual Amount','Difference','Status'].map(h => (
                                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', borderBottom: '2px solid #1B5E20', fontWeight: 800 }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {expandedItems.map((it, i) => (
                              <tr key={i} className="fba-tr" style={{ borderBottom: '1px solid #E0E0E0', background: it.match_status==='Matched' ? '#A5D6A7' : 'white' }}>
                                <td style={{ padding: '12px 16px', color: '#424242', fontWeight: 600, whiteSpace: 'nowrap' }}>{fmtD(it.transaction_date)}</td>
                                <td style={{ padding: '12px 16px', fontFamily: 'monospace', color: '#1B5E20', fontWeight: 900 }}>{it.reference_no}</td>
                                <td style={{ padding: '12px 16px' }}><Pill label={it.transaction_type} color={it.transaction_type==='CRV'?'#1B5E20':it.transaction_type==='PV'?'#F44336':'#FF9800'} bg={it.transaction_type==='CRV'?'#A5D6A7':it.transaction_type==='PV'?'#FFEBEE':'#FFF3E0'}/></td>
                                <td style={{ padding: '12px 16px', color: '#424242', fontWeight: 600, maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{it.description}</td>
                                <td style={{ padding: '12px 16px', fontWeight: 800, color: '#424242' }}>{fmt(it.erp_amount)}</td>
                                <td style={{ padding: '12px 16px', fontWeight: 800, color: '#424242' }}>{fmt(it.actual_amount)}</td>
                                <td style={{ padding: '12px 16px', fontWeight: 900, color: parseFloat(it.difference)===0?'#1B5E20':'#F44336' }}>{fmt(it.difference)}</td>
                                <td style={{ padding: '12px 16px' }}><Pill label={it.match_status} color={it.match_status==='Matched'?'#1B5E20':'#F44336'} bg={it.match_status==='Matched'?'#A5D6A7':'#FFEBEE'}/></td>
                              </tr>
                            ))}
                            {expandedItems.length === 0 && <tr><td colSpan={8} style={{ padding: 32, textAlign: 'center', color: '#8D6E63', fontWeight: 600 }}>No transaction items recorded.</td></tr>}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            
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
                            <td colSpan="6" style={{ padding: '16px 10px', background: '#ddd' }}>
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

      {/* ══════ VIEW TRANSACTIONS MODAL ══════════════════════════════════════ */}
      {viewAcc && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setViewAcc(null)}>
          <div className="modal-box">
            <div style={{ padding: '20px 24px', borderBottom: '2px solid #8D6E63', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#1B5E20' }}>
              <h3 style={{ margin: 0, color: 'white', fontSize: 18, fontWeight: 900 }}>Transactions: {viewAcc.account_name}</h3>
              <button type="button" onClick={()=>setViewAcc(null)} style={{ background: 'rgba(255,255,255,.15)', border: 'none', borderRadius: 0, color: 'white', cursor: 'pointer', padding: '6px 12px' }}><X size={20}/></button>
            </div>
            <div style={{ overflowY: 'auto', flex: 1, padding: 0 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 600 }}>
                <thead>
                  <tr style={{ background: '#2E8B57', color: 'white', fontSize: 11, textTransform: 'uppercase' }}>
                    {['Date','Type','Reference','Description','Receipt','Payment','Balance'].map(h => (
                      <th key={h} style={{ padding: '14px 20px', textAlign: 'left', borderBottom: '2px solid #1B5E20', fontWeight: 800 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {viewTx.map((tx, i) => (
                    <tr key={i} className="fba-tr" style={{ borderBottom: '1px solid #E0E0E0', background: i % 2 === 0 ? 'white' : '#F1F8E9' }}>
                      <td style={{ padding: '12px 20px', color: '#424242', fontWeight: 600, whiteSpace: 'nowrap' }}>{fmtD(tx.date)}</td>
                      <td style={{ padding: '12px 20px' }}><Pill label={tx.type} color={tx.type==='CRV'?'#1B5E20':tx.type==='PV'?'#F44336':'#FF9800'} bg={tx.type==='CRV'?'#A5D6A7':tx.type==='PV'?'#FFEBEE':'#FFF3E0'}/></td>
                      <td style={{ padding: '12px 20px', fontFamily: 'monospace', color: '#1B5E20', fontWeight: 900 }}>{tx.reference}</td>
                      <td style={{ padding: '12px 20px', color: '#424242', fontWeight: 600 }}>{tx.description}</td>
                      <td style={{ padding: '12px 20px', color: '#228B22', fontWeight: 800 }}>{parseFloat(tx.receipts||0)>0 ? fmt(tx.receipts) : '—'}</td>
                      <td style={{ padding: '12px 20px', color: '#F44336', fontWeight: 800 }}>{parseFloat(tx.payments||0)>0 ? fmt(tx.payments) : '—'}</td>
                      <td style={{ padding: '12px 20px', fontWeight: 900, color: tx.balance>=0?'#1B5E20':'#F44336' }}>{fmt(tx.balance)}</td>
                    </tr>
                  ))}
                  {viewTx.length === 0 && <tr><td colSpan={7} style={{ padding: 48, textAlign: 'center', color: '#8D6E63', fontWeight: 700, fontSize: 15 }}>No transactions found for this account type.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default FinanceBankAccounts;
