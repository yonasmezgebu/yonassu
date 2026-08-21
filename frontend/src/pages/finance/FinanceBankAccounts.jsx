import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Landmark, Plus, RefreshCw, Wallet, Smartphone, Building2,
  CheckCircle2, RotateCcw, Edit3, PowerOff, Eye, X, TrendingUp,
  TrendingDown, DollarSign, ArrowUpCircle, ArrowDownCircle, Printer,
  AlertCircle, Info, CheckCircle, AlertTriangle
} from 'lucide-react';
import apiClient from '../../services/apiClient';
import SegmentedSpinner from '../../components/ui/SegmentedSpinner';

/* ── Global CSS (design pass only) ──────────────────────────── */
const G = `
  .fba-wrap {
    --color-primary: #2563EB;
    --color-primary-hover: #1D4ED8;
    --color-primary-bg: #EFF6FF;
    --color-bg-page: #F5F6FA;
    --color-bg-card: #FFFFFF;
    --color-border: #E5E7EB;
    --color-text-primary: #111827;
    --color-text-secondary: #6B7280;
    --color-text-muted: #9CA3AF;
    --color-success: #16A34A;
    --color-success-bg: #DCFCE7;
    --color-danger: #DC2626;
    --color-danger-bg: #FEE2E2;
    --color-warning: #D97706;
    --color-warning-bg: #FEF3C7;
    --color-info: #0284C7;
    --color-info-bg: #E0F2FE;
    --color-gold: #F59E0B;
    --color-gold-hover: #D97706;
    --color-gold-text: #1F2937;
    --fba-radius: 10px;
    --fba-radius-sm: 8px;
    --fba-transition: 150ms ease-in-out;
    padding: 0;
    width: 100%;
    max-width: 1600px;
    margin: 0 auto;
    min-height: 100%;
    box-sizing: border-box;
    font-family: 'Inter', 'Segoe UI', Roboto, -apple-system, BlinkMacSystemFont, sans-serif;
    font-size: 16px;
    line-height: 1.5;
    color: var(--color-text-primary);
    -webkit-font-smoothing: antialiased;
  }
  .fba-wrap *, .fba-wrap *::before, .fba-wrap *::after { box-sizing: border-box; }
  .fba-wrap h1, .fba-wrap h2, .fba-wrap h3, .fba-wrap h4 { line-height: 1.3; }

  /* Inputs */
  .fba-inp, .fba-select {
    width: 100%;
    height: 36px;
    padding: 0 12px;
    border: 1px solid var(--color-border);
    border-radius: var(--fba-radius-sm);
    font-size: 14px;
    font-weight: 400;
    color: var(--color-text-primary);
    background: #FFFFFF;
    outline: none;
    box-sizing: border-box;
    transition: border-color var(--fba-transition), box-shadow var(--fba-transition);
  }
  .fba-inp:focus, .fba-select:focus {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px rgba(37,99,235,0.1);
  }
  .fba-select { cursor: pointer; }
  .fba-lbl {
    display: block;
    font-size: 12px;
    font-weight: 500;
    letter-spacing: 0.03em;
    text-transform: uppercase;
    color: var(--color-text-muted);
    margin-bottom: 6px;
  }

  /* Buttons — every button gets a gold hover (text stays readable) */
  .btn-green, .btn-outline, .btn-reset, .fba-btn-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    height: 36px;
    padding: 0 16px;
    border-radius: var(--fba-radius-sm);
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    white-space: nowrap;
    transition: background var(--fba-transition), color var(--fba-transition), border-color var(--fba-transition);
  }
  .btn-green {
    background: var(--color-primary);
    color: #FFFFFF;
    border: 1px solid var(--color-primary);
  }
  .btn-green:hover:not(:disabled) {
    background: var(--color-gold);
    border-color: var(--color-gold-hover);
    color: var(--color-gold-text);
  }
  .btn-outline {
    background: #FFFFFF;
    color: var(--color-primary);
    border: 1px solid var(--color-primary);
  }
  .btn-outline:hover {
    background: var(--color-gold);
    border-color: var(--color-gold-hover);
    color: var(--color-gold-text);
  }
  .btn-reset {
    background: #FFFFFF;
    color: var(--color-text-secondary);
    border: 1px solid var(--color-border);
  }
  .btn-reset:hover {
    background: var(--color-gold);
    border-color: var(--color-gold-hover);
    color: var(--color-gold-text);
  }
  .fba-btn-icon {
    width: 36px;
    height: 36px;
    padding: 0;
    background: #FFFFFF;
    color: var(--color-text-secondary);
    border: 1px solid var(--color-border);
  }
  .fba-btn-icon:hover {
    background: var(--color-gold);
    border-color: var(--color-gold-hover);
    color: var(--color-gold-text);
  }
  .btn-lg {
    height: 44px;
    padding: 0 24px;
    font-size: 15px;
  }
  .btn-green:disabled, .btn-outline:disabled, .btn-reset:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* Toggle (activate / deactivate) */
  .fba-toggle {
    height: 32px;
    padding: 0 12px;
    border: 1px solid transparent;
    border-radius: var(--fba-radius-sm);
    cursor: pointer;
    color: #FFFFFF;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition: background var(--fba-transition), color var(--fba-transition), border-color var(--fba-transition);
  }
  .fba-toggle-on  { background: var(--color-success); }
  .fba-toggle-off { background: var(--color-danger); }
  .fba-toggle:hover {
    background: var(--color-gold);
    border-color: var(--color-gold-hover);
    color: var(--color-gold-text);
  }

  /* Tabs */
  .fba-tab {
    padding: 10px 20px;
    font-weight: 600;
    font-size: 14px;
    border: none;
    border-radius: var(--fba-radius-sm);
    cursor: pointer;
    transition: background var(--fba-transition), color var(--fba-transition);
    background: transparent;
    color: var(--color-text-secondary);
    white-space: nowrap;
  }
  .fba-tab.active {
    color: var(--color-primary);
    background: var(--color-primary-bg);
  }
  .fba-tab:hover:not(.active) {
    background: #F9FAFB;
    color: var(--color-text-primary);
  }

  /* Cards */
  .fba-card {
    background: var(--color-bg-card);
    border: 1px solid var(--color-border);
    border-radius: var(--fba-radius);
    padding: 20px 24px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.06);
    transition: box-shadow var(--fba-transition), transform var(--fba-transition);
  }
  .fba-card:hover {
    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
    transform: translateY(-1px);
  }

  /* Tables */
  .fba-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 14px;
    min-width: 720px;
  }
  .fba-table thead th {
    background: #F9FAFB;
    color: var(--color-text-secondary);
    font-size: 12px;
    font-weight: 500;
    letter-spacing: 0.03em;
    text-transform: uppercase;
    padding: 12px 16px;
    text-align: left;
    white-space: nowrap;
    border-bottom: 1px solid var(--color-border);
  }
  .fba-table tbody td {
    padding: 12px 16px;
    border-bottom: 1px solid var(--color-border);
    vertical-align: middle;
  }
  .fba-table tbody tr { transition: background var(--fba-transition); }
  .fba-table tbody tr:hover { background: #F9FAFB; }
  .fba-table tbody tr:last-child td { border-bottom: none; }

  .fba-tr { transition: background var(--fba-transition); }
  .fba-tr:hover { background: #F9FAFB; }

  /* Grid */
  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .grid-3 { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px; }
  .grid-4 { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; }

  /* Modal */
  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.4);
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
  }
  .modal-box {
    background: #FFFFFF;
    border: 1px solid var(--color-border);
    border-radius: 12px;
    width: 100%;
    max-width: 900px;
    max-height: 90vh;
    overflow: auto;
    box-shadow: 0 20px 50px rgba(0,0,0,0.2);
    display: flex;
    flex-direction: column;
  }

  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes slideIn { from { opacity: 0; transform: translateX(30px); } to { opacity: 1; transform: translateX(0); } }

  /* Responsive */
  @media (max-width: 1024px) {
    .grid-4 { grid-template-columns: 1fr 1fr; }
  }
  @media (max-width: 480px) {
    .grid-2 { grid-template-columns: 1fr; }
    .grid-3 { grid-template-columns: 1fr; }
    .grid-4 { grid-template-columns: 1fr; }
    .btn-green, .btn-outline, .btn-reset, .fba-btn-icon { height: 44px; }
    .fba-inp, .fba-select { height: 44px; }
    .fba-tab { font-size: 14px; }
  }
`;

/* ── Helpers ────────────────────────────────────────────────────────────── */
const fmt  = (v, d = 2) => parseFloat(v||0).toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d });
const fmtD = (v) => v ? new Date(v).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' }) : '—';

const TYPE_META = {
  Bank:            { icon: <Building2  size={16}/>, color: 'var(--color-info)', bg: 'var(--color-info-bg)' },
  Cash:            { icon: <Wallet      size={16}/>, color: 'var(--color-success)', bg: 'var(--color-success-bg)' },
  'Mobile Wallet': { icon: <Smartphone size={16}/>, color: 'var(--color-warning)', bg: 'var(--color-warning-bg)' },
};
const CURRENCIES = ['ETB', 'USD', 'EUR'];
const STATUS_C = { Active: ['var(--color-success)','var(--color-success-bg)'], Inactive: ['var(--color-danger)','var(--color-danger-bg)'] };

/* ── Pill ─────────────────────────────────────────────────────────────────── */
const Pill = ({ label, color, bg }) => (
  <span style={{ background: bg, color, padding: '2px 10px', borderRadius: 9999, fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap', border: `1px solid ${color}`, display: 'inline-block' }}>{label}</span>
);

/* ── In-app Notification Toast ───────────────────────────────────────────── */
const Toast = ({ toasts }) => (
  <div style={{ position:'fixed', top:24, right:24, zIndex:9999, display:'flex', flexDirection:'column', gap:10, pointerEvents:'none' }}>
    {toasts.map(t => {
      const cfg = {
        success: { bg: 'var(--color-success-bg)', border: 'var(--color-success)', color: '#166534', icon: <CheckCircle size={18} color="var(--color-success)"/> },
        error:   { bg: 'var(--color-danger-bg)',  border: 'var(--color-danger)',  color: '#991B1B', icon: <AlertCircle size={18} color="var(--color-danger)"/> },
        info:    { bg: 'var(--color-info-bg)',    border: 'var(--color-info)',    color: '#075985', icon: <Info size={18} color="var(--color-info)"/> },
        warning: { bg: 'var(--color-warning-bg)', border: 'var(--color-warning)', color: '#92400E', icon: <AlertTriangle size={18} color="var(--color-warning)"/> },
      }[t.type] || { bg: '#F3F4F6', border: '#6B7280', color: '#374151', icon: <Info size={18} color="#6B7280"/> };
      return (
        <div key={t.id} style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, borderLeft: `4px solid ${cfg.border}`, color: cfg.color, padding: '12px 16px', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 12, fontSize: 14, fontWeight: 500, minWidth: 280, maxWidth: 420, pointerEvents: 'all', animation: 'slideIn .25s ease', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
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
      <div style={{ width: 40, height: 40, borderRadius: 8, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: color, border: `1px solid ${color}`, flexShrink: 0 }}>
        {icon}
      </div>
      <div style={{ fontWeight: 600, fontSize: 16, color: 'var(--color-text-primary)' }}>{label}</div>
    </div>
    <div style={{ marginBottom: 16, background: '#F9FAFB', padding: 12, border: '1px solid var(--color-border)', borderRadius: 8 }}>
      <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text-muted)', letterSpacing: '0.03em', textTransform: 'uppercase', marginBottom: 4 }}>ERP Balance (Cashbook)</div>
      <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--color-text-primary)', fontVariantNumeric: 'tabular-nums' }}>ETB {fmt(erpBal)}</div>
    </div>
    <div>
      <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text-muted)', letterSpacing: '0.03em', textTransform: 'uppercase', marginBottom: 6 }}>Actual Balance</div>
      <input type="number" step="0.01" value={actualVal} onChange={e => onActualChange(e.target.value)}
        placeholder="Enter physical balance"
        className="fba-inp"
        style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-text-primary)' }}/>
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
  const sumEV  = reconItems.filter(i => i.type === 'EV').reduce((s, i) => s + i.erp_amount, 0);
  const diffVal    = parseFloat(actualBalance||0) - reconErpBal;
  const matchedCnt = reconItems.filter(i => i.match_status === 'Matched').length;

  return (
    <div className="fba-wrap">
      <style>{G}</style>
      <Toast toasts={toasts} />

      {/* Header */}
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 12, color: 'var(--color-text-primary)', lineHeight: 1.3 }}>
            <Landmark size={28} color="var(--color-primary)"/> Accounts &amp; Reconciliation
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', margin: '6px 0 0', fontSize: 14, fontWeight: 400 }}>
            Manage all accounts and reconcile Cash, Bank, and Mobile Wallet separately with total summary.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button type="button" className="btn-outline" onClick={load}>
            <SegmentedSpinner size={15} /> Refresh
          </button>
          {tab === 'accounts' && (
            <button type="button" className="btn-green" onClick={openAdd}>
              <Plus size={15}/> Add Account
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', background: '#FFFFFF', border: '1px solid var(--color-border)', borderRadius: 10, marginBottom: 24, overflowX: 'auto', padding: 4 }}>
        <button className={`fba-tab ${tab === 'overview' ? 'active' : ''}`} onClick={() => setTab('overview')}>Overview</button>
        <button className={`fba-tab ${tab === 'accounts' ? 'active' : ''}`} onClick={() => setTab('accounts')}>Accounts</button>
        <button className={`fba-tab ${tab === 'reconcile' ? 'active' : ''}`} onClick={() => setTab('reconcile')}>Reconcile</button>
        <button className={`fba-tab ${tab === 'history' ? 'active' : ''}`} onClick={() => setTab('history')}>History</button>
      </div>

      {loading && <div style={{ color: 'var(--color-text-secondary)', padding: 48, textAlign: 'center', fontSize: 16, fontWeight: 600 }}><SegmentedSpinner size={32} /> <div style={{ marginTop: 12 }}>Loading data…</div></div>}

      {/* ══════ OVERVIEW ══════════════════════════════════════════════════════ */}
      {!loading && tab === 'overview' && (
        <>
          {summary && (
            <>
              <div className="grid-3" style={{ marginBottom: 24 }}>
                {[
                  { label: 'Cash Receipt (CRV)', val: summary.totalCRV, color: 'var(--color-success)', bg: 'var(--color-success-bg)', icon: '💰', sub: 'Total income from CRVs' },
                  { label: 'Expense Voucher (EV)',  val: summary.totalEV,  color: 'var(--color-danger)', bg: 'var(--color-danger-bg)', icon: '🧾', sub: 'Total EV payments' },
                  { label: 'Net Balance',            val: summary.netBalance, color: summary.netBalance >= 0 ? 'var(--color-success)' : 'var(--color-danger)', bg: 'var(--color-info-bg)', icon: '⚖️', sub: 'Receipts − payments' },
                ].map(c => (
                  <div key={c.label} className="fba-card" style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                    <div style={{ width: 48, height: 48, borderRadius: 8, background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>{c.icon}</div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)', letterSpacing: '0.03em', textTransform: 'uppercase', marginBottom: 4 }}>{c.label}</div>
                      <div style={{ fontSize: 24, fontWeight: 700, color: c.color, fontVariantNumeric: 'tabular-nums' }}>ETB {fmt(c.val)}</div>
                      <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2, fontWeight: 400 }}>{c.sub}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="grid-3" style={{ marginBottom: 24 }}>
                <div className="fba-card" style={{ display: 'flex', gap: 16, alignItems: 'center', borderLeft: '4px solid var(--color-success)' }}>
                  <ArrowUpCircle size={32} color="var(--color-success)"/>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)', letterSpacing: '0.03em', textTransform: 'uppercase', marginBottom: 4 }}>Total Income</div>
                    <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--color-success)', fontVariantNumeric: 'tabular-nums' }}>ETB {fmt(summary.totalIncome)}</div>
                  </div>
                </div>
                <div className="fba-card" style={{ display: 'flex', gap: 16, alignItems: 'center', borderLeft: '4px solid var(--color-danger)' }}>
                  <ArrowDownCircle size={32} color="var(--color-danger)"/>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)', letterSpacing: '0.03em', textTransform: 'uppercase', marginBottom: 4 }}>Total Payments</div>
                    <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--color-danger)', fontVariantNumeric: 'tabular-nums' }}>ETB {fmt(summary.totalOut)}</div>
                  </div>
                </div>
                <div className="fba-card" style={{ display: 'flex', gap: 16, alignItems: 'center', borderLeft: '4px solid var(--color-primary)' }}>
                  <DollarSign size={32} color="var(--color-primary)"/>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)', letterSpacing: '0.03em', textTransform: 'uppercase', marginBottom: 4 }}>Net Balance</div>
                    <div style={{ fontSize: 24, fontWeight: 700, color: summary.netBalance >= 0 ? 'var(--color-success)' : 'var(--color-danger)', fontVariantNumeric: 'tabular-nums' }}>ETB {fmt(summary.netBalance)}</div>
                  </div>
                </div>
              </div>
            </>
          )}

          <h3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--color-text-primary)', margin: '32px 0 16px', borderBottom: '2px solid var(--color-primary)', paddingBottom: 8, display: 'inline-block' }}>Accounts by Type</h3>
          <div className="grid-3" style={{ marginBottom: 32 }}>
            {['Bank','Cash','Mobile Wallet'].map(type => {
              const meta = TYPE_META[type];
              const accs = accounts.filter(a => a.account_type === type);
              return (
                <div key={type} className="fba-card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid var(--color-border)' }}>
                    <div style={{ width: 44, height: 44, borderRadius: 8, background: meta.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: meta.color, border: `1px solid ${meta.color}`, flexShrink: 0 }}>{meta.icon}</div>
                    <div><div style={{ fontWeight: 600, fontSize: 18, color: 'var(--color-text-primary)' }}>{type}</div><div style={{ fontSize: 13, color: 'var(--color-text-muted)', fontWeight: 400 }}>{accs.length} account{accs.length !== 1 ? 's' : ''}</div></div>
                  </div>
                  {accs.map(a => (
                    <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px dashed var(--color-border)' }}>
                      <div>
                        <span style={{ fontSize: 14, color: 'var(--color-text-primary)', fontWeight: 600 }}>{a.account_name}</span>
                        <div style={{ fontSize: 13, color: parseFloat(a.netBalance||0) >= 0 ? 'var(--color-success)' : 'var(--color-danger)', fontWeight: 600, marginTop: 4 }}>ETB {fmt(a.netBalance)}</div>
                      </div>
                      <Pill label={a.status} color={STATUS_C[a.status]?.[0]} bg={STATUS_C[a.status]?.[1]}/>
                    </div>
                  ))}
                  {accs.length === 0 && <div style={{ fontSize: 13, color: 'var(--color-text-muted)', textAlign: 'center', padding: '16px 0', fontWeight: 400 }}>No {type} accounts yet</div>}
                </div>
              );
            })}
          </div>

          <h3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--color-text-primary)', margin: '32px 0 16px', borderBottom: '2px solid var(--color-primary)', paddingBottom: 8, display: 'inline-block' }}>Recent Cashbook Entries</h3>
          <div style={{ background: 'white', border: '1px solid var(--color-border)', borderRadius: 10, overflow: 'hidden', overflowX: 'auto', width: '100%' }}>
            <table className="fba-table">
              <thead>
                <tr>
                  {['Date','Type','Reference','Description','Income','Payment','Running Balance'].map(h => (
                    <th key={h} style={['Income','Payment','Running Balance'].includes(h) ? { textAlign: 'right' } : undefined}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cashbook.slice(-25).reverse().map((row, i) => (
                  <tr key={i} className="fba-tr">
                    <td style={{ color: 'var(--color-text-secondary)', fontWeight: 500, whiteSpace: 'nowrap' }}>{fmtD(row.date)}</td>
                    <td><Pill label={row.type} color={row.type==='CRV'?'var(--color-success)':'var(--color-danger)'} bg={row.type==='CRV'?'var(--color-success-bg)':'var(--color-danger-bg)'}/></td>
                    <td style={{ fontFamily: 'monospace', color: 'var(--color-primary)', fontWeight: 600 }}>{row.reference}</td>
                    <td style={{ color: 'var(--color-text-secondary)', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.description}</td>
                    <td style={{ textAlign: 'right', color: 'var(--color-success)', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{parseFloat(row.receipts||0)>0 ? fmt(row.receipts) : '—'}</td>
                    <td style={{ textAlign: 'right', color: 'var(--color-danger)', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{parseFloat(row.payments||0)>0 ? fmt(row.payments) : '—'}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: row.balance>=0 ? 'var(--color-text-primary)' : 'var(--color-danger)' }}>{fmt(row.balance)}</td>
                  </tr>
                ))}
                {cashbook.length === 0 && <tr><td colSpan={7} style={{ padding: 32, textAlign: 'center', color: 'var(--color-text-muted)', fontWeight: 500 }}>No entries found in cashbook.</td></tr>}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ══════ ACCOUNTS ══════════════════════════════════════════════════════ */}
      {!loading && tab === 'accounts' && (
        <>
          {showForm && (
            <div className="fba-card" style={{ marginBottom: 24, borderLeft: '4px solid var(--color-primary)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: 'var(--color-text-primary)' }}>{editAcc ? 'Edit Account' : 'Add New Account'}</h3>
                <button type="button" className="fba-btn-icon" onClick={() => setShowForm(false)} aria-label="Close"><X size={18}/></button>
              </div>
              <form onSubmit={saveAccount} className="grid-3">
                <div><label className="fba-lbl">Account Name <span style={{ color: 'var(--color-danger)' }}>*</span></label><input className="fba-inp" required value={form.account_name} onChange={e=>setForm({...form, account_name:e.target.value})} placeholder="e.g. Main Cash"/></div>
                <div><label className="fba-lbl">Account Type <span style={{ color: 'var(--color-danger)' }}>*</span></label>
                  <select className="fba-select" value={form.account_type} onChange={e=>setForm({...form, account_type:e.target.value})}>
                    <option>Bank</option><option>Cash</option><option>Mobile Wallet</option>
                  </select>
                </div>
                <div><label className="fba-lbl">Bank / Provider</label><input className="fba-inp" value={form.bank_provider} onChange={e=>setForm({...form, bank_provider:e.target.value})} placeholder="e.g. CBE, Awash, Telebirr"/></div>
                <div><label className="fba-lbl">Account Number</label><input className="fba-inp" value={form.account_number} onChange={e=>setForm({...form, account_number:e.target.value})}/></div>
                <div><label className="fba-lbl">Company Branch</label><input className="fba-inp" value={form.branch} onChange={e=>setForm({...form, branch:e.target.value})}/></div>
                <div><label className="fba-lbl">Currency <span style={{ color: 'var(--color-danger)' }}>*</span></label>
                  <select className="fba-select" value={form.currency} onChange={e=>setForm({...form, currency:e.target.value})}>
                    {CURRENCIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div><label className="fba-lbl">Opening Balance <span style={{ color: 'var(--color-danger)' }}>*</span></label><input className="fba-inp" required type="number" step="0.01" value={form.opening_balance} onChange={e=>setForm({...form, opening_balance:e.target.value})}/></div>
                <div><label className="fba-lbl">Opening Balance Date <span style={{ color: 'var(--color-danger)' }}>*</span></label><input className="fba-inp" required type="date" value={form.opening_balance_date} onChange={e=>setForm({...form, opening_balance_date:e.target.value})}/></div>
                <div><label className="fba-lbl">Description</label><input className="fba-inp" value={form.description} onChange={e=>setForm({...form, description:e.target.value})}/></div>
                <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 10 }}>
                  <button type="button" className="btn-reset" onClick={() => setShowForm(false)}>Cancel</button>
                  <button type="submit" className="btn-green">Save Account</button>
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
                      <div style={{ width: 48, height: 48, borderRadius: 8, background: meta.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: meta.color, border: `1px solid ${meta.color}`, flexShrink: 0 }}>{meta.icon}</div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 16, color: 'var(--color-text-primary)' }}>{acc.account_name}</div>
                        <div style={{ fontSize: 13, color: 'var(--color-text-muted)', fontWeight: 400 }}>{acc.account_type}{acc.bank_provider ? ` · ${acc.bank_provider}` : ''}</div>
                      </div>
                    </div>
                    <Pill label={acc.status} color={STATUS_C[acc.status]?.[0]} bg={STATUS_C[acc.status]?.[1]}/>
                  </div>
                  {acc.account_number && <div style={{ fontSize: 13, fontFamily: 'monospace', color: 'var(--color-text-secondary)', fontWeight: 600, marginBottom: 16, background: '#F9FAFB', padding: '6px 10px', border: '1px solid var(--color-border)', borderRadius: 6, display: 'inline-block', alignSelf: 'flex-start' }}>{acc.account_number}</div>}

                  <div style={{ background: parseFloat(acc.netBalance||0) >= 0 ? 'var(--color-success-bg)' : 'var(--color-danger-bg)', border: `1px solid ${parseFloat(acc.netBalance||0) >= 0 ? 'var(--color-success)' : 'var(--color-danger)'}`, borderRadius: 8, padding: '16px', marginBottom: 16 }}>
                    <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text-muted)', letterSpacing: '0.03em', textTransform: 'uppercase', marginBottom: 6 }}>Live Balance (from Cashbook)</div>
                    <div style={{ fontSize: 24, fontWeight: 700, color: parseFloat(acc.netBalance||0) >= 0 ? 'var(--color-text-primary)' : 'var(--color-danger)', fontVariantNumeric: 'tabular-nums' }}>
                      {acc.currency} {fmt(acc.netBalance)}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 6, fontWeight: 400 }}>Opening {acc.currency} {fmt(acc.opening_balance)} + movements</div>
                  </div>

                  <div className="grid-2" style={{ background: '#F9FAFB', border: '1px solid var(--color-border)', borderRadius: 8, padding: 12, marginBottom: 20, fontSize: 13, color: 'var(--color-text-secondary)' }}>
                    <div><b style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>In:</b> ETB {fmt(acc.totalIn)}</div>
                    <div><b style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>Out:</b> ETB {fmt(acc.totalOut)}</div>
                    {acc.branch && <div><b style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>Branch:</b> {acc.branch}</div>}
                    <div><b style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>Since:</b> {fmtD(acc.opening_balance_date)}</div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: 8, marginTop: 'auto', flexWrap: 'wrap' }}>
                    <button type="button" onClick={()=>viewTransactions(acc)} className="btn-outline" style={{ flex: 1, justifyContent: 'center' }}><Eye size={14}/> View</button>
                    <button type="button" onClick={()=>openEdit(acc)} className="btn-outline" style={{ flex: 1, justifyContent: 'center', color: 'var(--color-primary)', borderColor: 'var(--color-primary)' }}><Edit3 size={14}/> Edit</button>
                    <button type="button" onClick={()=>startRecon(acc)} className="btn-green" style={{ flex: 1, justifyContent: 'center' }}><RotateCcw size={14}/> Reconcile</button>
                    <button type="button" onClick={()=>toggleStatus(acc)} title={acc.status==='Active'?'Deactivate':'Activate'} className={`fba-toggle ${acc.status === 'Active' ? 'fba-toggle-off' : 'fba-toggle-on'}`}><PowerOff size={16}/></button>
                  </div>
                </div>
              );
            })}
            {accounts.length === 0 && <div style={{ padding: 48, textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 16, fontWeight: 600, gridColumn: '1 / -1' }}>No accounts yet. Click "Add Account" to get started.</div>}
          </div>
        </>
      )}

      {/* ══════ RECONCILE ══════════════════════════════════════════════════════ */}
      {!loading && tab === 'reconcile' && (
        !reconAcc ? (
          <>
            <h3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--color-text-primary)', margin: '0 0 16px', borderBottom: '2px solid var(--color-primary)', paddingBottom: 8, display: 'inline-block' }}>Select an Account to Reconcile</h3>
            
            <div style={{ marginBottom: 32 }}>
              <div className="fba-card" onClick={()=>startRecon('GLOBAL')} style={{ cursor: 'pointer', display: 'flex', gap: 16, alignItems: 'center', border: '1px solid var(--color-primary)', background: 'var(--color-primary-bg)' }}>
                <div style={{ width: 50, height: 50, borderRadius: 8, background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', border: '1px solid var(--color-primary)', flexShrink: 0 }}><DollarSign size={24}/></div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 18, color: 'var(--color-text-primary)' }}>Global Reconciliation Summary</div>
                  <div style={{ fontSize: 14, color: 'var(--color-text-secondary)', marginTop: 4, fontWeight: 400 }}>Reconcile Cash, Bank, and Mobile Wallet all at once against the total cashbook</div>
                </div>
                <RotateCcw size={24} color="var(--color-primary)" style={{ flexShrink: 0 }}/>
              </div>
            </div>

            <h4 style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-muted)', letterSpacing: '0.03em', textTransform: 'uppercase', margin: '0 0 16px' }}>Individual Accounts</h4>
            <div className="grid-3">
              {accounts.filter(a=>a.status==='Active').map(acc => {
                const meta = TYPE_META[acc.account_type]||TYPE_META['Cash'];
                return (
                  <div key={acc.id} className="fba-card" onClick={()=>startRecon(acc)} style={{ cursor: 'pointer', display: 'flex', gap: 16, alignItems: 'center' }}>
                    <div style={{ width: 50, height: 50, borderRadius: 8, background: meta.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: meta.color, border: `1px solid ${meta.color}`, flexShrink: 0 }}>{meta.icon}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 16, color: 'var(--color-text-primary)' }}>{acc.account_name}</div>
                      <div style={{ fontSize: 13, color: 'var(--color-text-muted)', fontWeight: 400 }}>{acc.account_type}{acc.bank_provider?` · ${acc.bank_provider}`:''}</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-success)', marginTop: 4, fontVariantNumeric: 'tabular-nums' }}>ETB {fmt(acc.netBalance)}</div>
                    </div>
                    <RotateCcw size={20} color="var(--color-primary)" style={{ flexShrink: 0 }}/>
                  </div>
                );
              })}
              {accounts.filter(a=>a.status==='Active').length === 0 && <div style={{ padding: 48, color: 'var(--color-text-muted)', fontSize: 16, fontWeight: 600, gridColumn: '1 / -1', textAlign: 'center' }}>No active accounts found. Create one from the Accounts tab.</div>}
            </div>
          </>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
              {reconAcc === 'GLOBAL' ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ width: 50, height: 50, borderRadius: 8, background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', border: '1px solid var(--color-primary)', flexShrink: 0 }}>
                    <DollarSign size={24}/>
                  </div>
                  <div>
                    <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'var(--color-text-primary)' }}>Global Reconciliation Summary</h2>
                    <div style={{ fontSize: 14, color: 'var(--color-text-secondary)', marginTop: 4, fontWeight: 400 }}>Cash, Bank, and Mobile Wallet</div>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ width: 50, height: 50, borderRadius: 8, background: (TYPE_META[reconAcc.account_type]||TYPE_META['Cash']).bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: (TYPE_META[reconAcc.account_type]||TYPE_META['Cash']).color, border: `1px solid ${(TYPE_META[reconAcc.account_type]||TYPE_META['Cash']).color}`, flexShrink: 0 }}>
                    {(TYPE_META[reconAcc.account_type]||TYPE_META['Cash']).icon}
                  </div>
                  <div>
                    <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'var(--color-text-primary)' }}>Reconciling: {reconAcc.account_name}</h2>
                    <div style={{ fontSize: 14, color: 'var(--color-text-secondary)', marginTop: 4, fontWeight: 400 }}>{reconAcc.account_type}{reconAcc.bank_provider?` · ${reconAcc.bank_provider}`:''} · ERP Balance: <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>ETB {fmt(reconErpBal)}</span></div>
                  </div>
                </div>
              )}
              <button type="button" className="btn-outline" onClick={()=>setReconAcc(null)}><X size={16}/> Cancel</button>
            </div>

            <div className="fba-card" style={{ marginBottom: 24, display: 'flex', gap: 24, alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, display: 'flex', gap: 16, minWidth: 300 }}>
                <div style={{ flex: 1 }}><label className="fba-lbl">Period From</label><input type="date" className="fba-inp" value={reconFrom} onChange={e=>setReconFrom(e.target.value)}/></div>
                <div style={{ flex: 1 }}><label className="fba-lbl">Period To</label><input type="date" className="fba-inp" value={reconTo} onChange={e=>setReconTo(e.target.value)}/></div>
              </div>
              <button type="button" className="btn-green" onClick={loadReconTx} disabled={loadingTx}>
                {loadingTx ? <SegmentedSpinner size={18} /> : '🔍 Load Data'}
              </button>
            </div>

            {reconAcc === 'GLOBAL' ? (
              reconItems.length > 0 && (
                <div style={{ marginTop: 32 }}>
                  <div className="grid-3" style={{ marginBottom: 32 }}>
                    <TypePanel
                      label="Cash" icon={<Wallet size={20}/>} color="var(--color-success)" bg="var(--color-success-bg)"
                      erpBal={typeBalances.cash}
                      actualVal={panelActuals.cash}
                      onActualChange={v => setPanelActuals(p => ({...p, cash: v}))}
                    />
                    <TypePanel
                      label="Bank" icon={<Building2 size={20}/>} color="var(--color-info)" bg="var(--color-info-bg)"
                      erpBal={typeBalances.bank}
                      actualVal={panelActuals.bank}
                      onActualChange={v => setPanelActuals(p => ({...p, bank: v}))}
                    />
                    <TypePanel
                      label="Mobile Wallet (Telebirr)" icon={<Smartphone size={20}/>} color="var(--color-warning)" bg="var(--color-warning-bg)"
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
                      <div className="fba-card" style={{ padding: 32, border: balanced ? '2px solid var(--color-success)' : allEntered ? '2px solid var(--color-danger)' : '1px solid var(--color-border)', background: balanced ? 'var(--color-success-bg)' : allEntered ? 'var(--color-danger-bg)' : '#FFFFFF', marginBottom: 32 }}>
                        <div className="grid-4" style={{ alignItems: 'center', textAlign: 'center' }}>
                          <div style={{ borderRight: '1px solid var(--color-border)' }}>
                            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)', letterSpacing: '0.03em', textTransform: 'uppercase', marginBottom: 8 }}>Total ERP Balance</div>
                            <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--color-text-primary)', fontVariantNumeric: 'tabular-nums' }}>ETB {fmt(typeBalances.total)}</div>
                            <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 6, fontWeight: 400 }}>Up to {fmtD(reconTo)}</div>
                          </div>
                          <div style={{ borderRight: '1px solid var(--color-border)' }}>
                            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)', letterSpacing: '0.03em', textTransform: 'uppercase', marginBottom: 8 }}>Sum of Actuals</div>
                            <div style={{ fontSize: 28, fontWeight: 700, color: allEntered ? 'var(--color-text-primary)' : 'var(--color-text-muted)', fontVariantNumeric: 'tabular-nums' }}>
                              {allEntered ? `ETB ${fmt(sumActuals)}` : '—'}
                            </div>
                          </div>
                          <div style={{ borderRight: '1px solid var(--color-border)' }}>
                            <div style={{ fontSize: 14, color: 'var(--color-text-secondary)', marginBottom: 8, fontWeight: 600 }}>Formula</div>
                            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)', background: '#FFFFFF', padding: '10px 14px', fontFamily: 'monospace', display: 'inline-block', border: '1px solid var(--color-border)', borderRadius: 8 }}>
                              Total ERP − Sum Actuals
                            </div>
                          </div>
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)', letterSpacing: '0.03em', textTransform: 'uppercase', marginBottom: 8 }}>Total Difference</div>
                            <div style={{ fontSize: 40, fontWeight: 700, color: balanced ? 'var(--color-success)' : allEntered ? 'var(--color-danger)' : 'var(--color-text-muted)', fontVariantNumeric: 'tabular-nums' }}>
                              {allEntered ? fmt(totalDiff) : '—'}
                            </div>
                            {balanced && <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-success)', marginTop: 8 }}>✓ Fully Balanced</div>}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button type="button" className="btn-green btn-lg" onClick={saveGlobalRecon} disabled={saving}>
                      <CheckCircle2 size={20}/> {saving ? 'Saving...' : 'Save Global Reconciliation'}
                    </button>
                  </div>
                </div>
              )
            ) : (
              <>
                <div className="grid-3" style={{ marginBottom: 24 }}>
                  <div className="fba-card">
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)', letterSpacing: '0.03em', textTransform: 'uppercase', marginBottom: 8 }}>ERP Balance</div>
                    <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--color-text-primary)', fontVariantNumeric: 'tabular-nums' }}>ETB {fmt(reconErpBal)}</div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 6, fontWeight: 400 }}>Up to {fmtD(reconTo)}</div>
                  </div>
                  <div className="fba-card">
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)', letterSpacing: '0.03em', textTransform: 'uppercase', marginBottom: 8 }}>Actual Balance</div>
                    <input type="number" className="fba-inp" step="0.01" value={actualBalance} onChange={e=>setActualBalance(e.target.value)} placeholder="0.00" style={{ fontSize: 20, fontWeight: 600, color: 'var(--color-text-primary)' }}/>
                    <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 6, fontWeight: 400 }}>From physical statement</div>
                  </div>
                  <div className="fba-card" style={{ border: diffVal===0&&actualBalance ? '2px solid var(--color-success)' : '1px solid var(--color-border)', background: diffVal===0&&actualBalance ? 'var(--color-success-bg)' : '#FFFFFF' }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)', letterSpacing: '0.03em', textTransform: 'uppercase', marginBottom: 8 }}>Difference</div>
                    <div style={{ fontSize: 28, fontWeight: 700, color: diffVal===0&&actualBalance ? 'var(--color-success)' : 'var(--color-danger)', fontVariantNumeric: 'tabular-nums' }}>{actualBalance ? fmt(diffVal) : '—'}</div>
                    <div style={{ fontSize: 12, color: diffVal===0&&actualBalance ? 'var(--color-success)' : 'var(--color-text-muted)', marginTop: 6, fontWeight: 600 }}>
                      {diffVal===0&&actualBalance ? '✓ Balanced' : 'Actual − ERP'}
                    </div>
                  </div>
                </div>

                {reconItems.length > 0 && (
                  <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--color-success-bg)', border: '1px solid var(--color-success)', borderRadius: 8, padding: '8px 16px', fontSize: 14 }}>
                      <span style={{ fontWeight: 600, color: 'var(--color-success)' }}>CRV:</span> <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>+ETB {fmt(sumCRV)}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--color-danger-bg)', border: '1px solid var(--color-danger)', borderRadius: 8, padding: '8px 16px', fontSize: 14 }}>
                      <span style={{ fontWeight: 600, color: 'var(--color-danger)' }}>EV:</span> <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>−ETB {fmt(sumEV)}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--color-primary)', border: '1px solid var(--color-primary)', borderRadius: 8, padding: '8px 16px', fontSize: 14, color: 'white', fontWeight: 600 }}>
                      Net: ETB {fmt(sumCRV - sumEV)}
                    </div>
                  </div>
                )}

                <div className="fba-card" style={{ marginBottom: 24 }}>
                  <label className="fba-lbl">Reconciliation Notes (Optional)</label>
                  <textarea className="fba-inp" value={reconNotes} onChange={e=>setReconNotes(e.target.value)} rows={3}
                    style={{ resize: 'vertical', fontSize: 14, height: 'auto', padding: '10px 12px' }}
                    placeholder="Add any notes about this reconciliation period…"/>
                </div>

                {reconItems.length > 0 && (
                  <div style={{ background: 'white', border: '1px solid var(--color-border)', borderRadius: 10, overflow: 'hidden', marginBottom: 24 }}>
                    <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#FFFFFF', flexWrap: 'wrap', gap: 12 }}>
                      <div>
                        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: 'var(--color-text-primary)' }}>Transactions ({reconItems.length})</h3>
                        <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 4, fontWeight: 400 }}>Matched: <b style={{ color: 'var(--color-success)', fontWeight: 600 }}>{matchedCnt}</b> / {reconItems.length}</div>
                      </div>
                      <button type="button" className="btn-outline" onClick={autoMatch}>⚡ Auto Match All</button>
                    </div>
                    <div style={{ overflowX: 'auto', width: '100%' }}>
                      <table className="fba-table" style={{ minWidth: 800 }}>
                        <thead>
                          <tr>
                            {['Date','Ref No','Type','Description','ERP Amount','Actual Amount','Difference','Status'].map(h => (
                              <th key={h}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {reconItems.map((it, idx) => (
                            <tr key={idx} className="fba-tr" style={{ background: it.match_status==='Matched' ? 'var(--color-success-bg)' : '#FFFFFF' }}>
                              <td style={{ color: 'var(--color-text-secondary)', whiteSpace: 'nowrap', fontWeight: 500 }}>{fmtD(it.date)}</td>
                              <td style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--color-text-primary)' }}>{it.reference}</td>
                              <td><Pill label={it.type} color={it.type==='CRV'?'var(--color-success)':it.type==='EV'?'var(--color-danger)':'var(--color-warning)'} bg={it.type==='CRV'?'var(--color-success-bg)':it.type==='EV'?'var(--color-danger-bg)':'var(--color-warning-bg)'}/></td>
                              <td style={{ color: 'var(--color-text-secondary)', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{it.description}</td>
                              <td style={{ fontWeight: 600, color: it.isReceipt?'var(--color-success)':'var(--color-danger)', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>{it.isReceipt?'+':'−'}{fmt(it.erp_amount)}</td>
                              <td style={{ width: 140 }}>
                                <input type="number" step="0.01" className="fba-inp" value={it.actual_amount||''} onChange={e=>updateActual(idx, e.target.value)}
                                  style={{ textAlign: 'right' }}/>
                              </td>
                              <td style={{ fontWeight: 700, color: it.difference===0?'var(--color-text-primary)':'var(--color-danger)', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>{fmt(it.difference)}</td>
                              <td><Pill label={it.match_status} color={it.match_status==='Matched'?'var(--color-success)':'var(--color-danger)'} bg={it.match_status==='Matched'?'var(--color-success-bg)':'var(--color-danger-bg)'}/></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 16, marginTop: 24, alignItems: 'center', flexWrap: 'wrap' }}>
                  {reconItems.length === 0 && <div style={{ color: 'var(--color-text-muted)', fontSize: 14, fontWeight: 500 }}>Load transactions first, then complete the reconciliation.</div>}
                  <button type="button" className="btn-green btn-lg" onClick={saveRecon} disabled={saving}>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
              <h3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--color-text-primary)', margin: 0, borderBottom: '2px solid var(--color-primary)', paddingBottom: 8 }}>Reconciliation History</h3>
              <button type="button" className="btn-outline" onClick={printHistory}>
                <Printer size={16}/> Print History
              </button>
            </div>

            {reconciliations.length > 0 && (
              <div className="grid-4" style={{ marginBottom: 32 }}>
                {[
                  { label: 'Total Reconciliations', val: reconciliations.length, color: 'var(--color-text-primary)' },
                  { label: 'Completed', val: reconciliations.filter(r=>r.status==='Completed').length, color: 'var(--color-success)' },
                  { label: 'Draft', val: reconciliations.filter(r=>r.status==='Draft').length, color: 'var(--color-warning)' },
                  { label: 'Balanced', val: reconciliations.filter(r=>parseFloat(r.difference)===0).length, color: 'var(--color-success)' },
                ].map(c => (
                  <div key={c.label} className="fba-card" style={{ padding: '20px 24px' }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)', letterSpacing: '0.03em', textTransform: 'uppercase', marginBottom: 6 }}>{c.label}</div>
                    <div style={{ fontSize: 28, fontWeight: 700, color: c.color, fontVariantNumeric: 'tabular-nums' }}>{c.val}</div>
                  </div>
                ))}
              </div>
            )}

            {reconciliations.length === 0 ? (
              <div className="fba-card" style={{ padding: 64, textAlign: 'center' }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
                <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 8 }}>No reconciliation records yet</div>
                <div style={{ fontSize: 14, color: 'var(--color-text-secondary)', fontWeight: 400 }}>Go to the Reconcile tab to start your first reconciliation.</div>
              </div>
            ) : groupedReconciliations.map(item => {
              if (item.isGlobal) {
                return (
                  <div key={item.groupId} className="fba-card" style={{ marginBottom: 20, padding: 0, border: '1px solid var(--color-primary)', overflowX: 'auto' }}>
                    <div
                      onClick={() => {
                        if (expandedRecon === item.groupId) setExpandedRecon(null);
                        else { setExpandedRecon(item.groupId); setExpandedItems([]); }
                      }}
                      style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 20, cursor: 'pointer', background: 'var(--color-primary-bg)', borderBottom: '1px solid var(--color-border)', minWidth: 900 }}
                    >
                      <div style={{ width: 44, height: 44, borderRadius: 8, background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', border: '1px solid var(--color-primary)', flexShrink: 0 }}>
                        <DollarSign size={20}/>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 16, color: 'var(--color-text-primary)' }}>Global Summary</div>
                        <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 4, fontWeight: 400 }}>{item.records.length} Accounts Included</div>
                      </div>
                      <div style={{ flex: '0 0 240px' }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)', letterSpacing: '0.03em', textTransform: 'uppercase', marginBottom: 4 }}>Period</div>
                        <div style={{ fontSize: 14, color: 'var(--color-text-primary)', fontWeight: 600 }}>{fmtD(item.period_from)} → {fmtD(item.period_to)}</div>
                      </div>
                      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
                        <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', fontWeight: 500, whiteSpace: 'nowrap' }}>{fmtD(item.created_at)}</div>
                        <div style={{ fontSize: 24, color: 'var(--color-text-primary)', transition: 'transform .2s', transform: expandedRecon===item.groupId ? 'rotate(180deg)' : 'none', fontWeight: 600 }}>▾</div>
                      </div>
                    </div>
                    {expandedRecon === item.groupId && (
                      <div style={{ background: 'white' }}>
                        <table className="fba-table" style={{ minWidth: 900 }}>
                          <thead>
                            <tr>
                              {['Account','ERP Balance','Actual Balance','Difference'].map((h, i) => (
                                <th key={h} style={i > 0 ? { textAlign: 'right' } : undefined}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {item.records.map((r, i) => (
                              <tr key={r.id} className="fba-tr">
                                <td style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{r.account_name} ({r.account_type})</td>
                                <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--color-text-secondary)', fontVariantNumeric: 'tabular-nums' }}>{fmt(r.erp_balance)}</td>
                                <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--color-text-secondary)', fontVariantNumeric: 'tabular-nums' }}>{fmt(r.actual_balance)}</td>
                                <td style={{ textAlign: 'right', fontWeight: 700, color: parseFloat(r.difference)===0?'var(--color-success)':'var(--color-danger)', fontVariantNumeric: 'tabular-nums' }}>{fmt(r.difference)}</td>
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
                    onMouseEnter={e=>e.currentTarget.style.background='#F9FAFB'}
                    onMouseLeave={e=>e.currentTarget.style.background='white'}
                  >
                    <div style={{ width: 44, height: 44, borderRadius: 8, background: (TYPE_META[r.account_type]||TYPE_META['Cash']).bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: (TYPE_META[r.account_type]||TYPE_META['Cash']).color, border: `1px solid ${(TYPE_META[r.account_type]||TYPE_META['Cash']).color}`, flexShrink: 0 }}>
                      {(TYPE_META[r.account_type]||TYPE_META['Cash']).icon}
                    </div>

                    <div style={{ flex: '0 0 200px' }}>
                      <div style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 15, color: 'var(--color-text-primary)' }}>{r.reconciliation_no}</div>
                      <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 4, fontWeight: 400 }}>{r.account_name}</div>
                    </div>

                    <div style={{ flex: '0 0 220px' }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)', letterSpacing: '0.03em', textTransform: 'uppercase', marginBottom: 4 }}>Period</div>
                      <div style={{ fontSize: 14, color: 'var(--color-text-secondary)', fontWeight: 500 }}>{fmtD(r.period_from)} → {fmtD(r.period_to)}</div>
                    </div>

                    <div style={{ flex: '0 0 150px' }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)', letterSpacing: '0.03em', textTransform: 'uppercase', marginBottom: 4 }}>ERP Balance</div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text-primary)' }}>{r.currency||'ETB'} {fmt(r.erp_balance)}</div>
                    </div>
                    <div style={{ flex: '0 0 150px' }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)', letterSpacing: '0.03em', textTransform: 'uppercase', marginBottom: 4 }}>Actual Balance</div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text-primary)' }}>{r.currency||'ETB'} {fmt(r.actual_balance)}</div>
                    </div>

                    <div style={{ flex: '0 0 140px' }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)', letterSpacing: '0.03em', textTransform: 'uppercase', marginBottom: 4 }}>Difference</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: parseFloat(r.difference)===0 ? 'var(--color-success)' : 'var(--color-danger)', fontVariantNumeric: 'tabular-nums' }}>{fmt(r.difference)}</div>
                    </div>

                    <div style={{ flex: '0 0 120px' }}>
                      <Pill label={r.status} color={r.status==='Completed'?'var(--color-success)':'var(--color-warning)'} bg={r.status==='Completed'?'var(--color-success-bg)':'var(--color-warning-bg)'}/>
                      {parseFloat(r.difference)===0 && <div style={{ fontSize: 11, color: 'var(--color-success)', marginTop: 6, fontWeight: 600 }}>✓ Balanced</div>}
                    </div>

                    <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
                      <div style={{ fontSize: 13, color: 'var(--color-text-muted)', fontWeight: 500, whiteSpace: 'nowrap' }}>{fmtD(r.created_at)}</div>
                      <div style={{ fontSize: 24, color: 'var(--color-text-primary)', transition: 'transform .2s', transform: expandedRecon===r.id ? 'rotate(180deg)' : 'none', fontWeight: 600 }}>▾</div>
                    </div>
                  </div>

                  {expandedRecon === r.id && (
                    <div style={{ borderTop: '1px solid var(--color-border)' }}>
                      {r.notes && (
                        <div style={{ padding: '14px 24px', background: 'var(--color-warning-bg)', fontSize: 14, color: 'var(--color-text-primary)', fontWeight: 500 }}>📝 {r.notes}</div>
                      )}
                      <div style={{ overflowX: 'auto', width: '100%' }}>
                        <table className="fba-table" style={{ minWidth: 800 }}>
                          <thead>
                            <tr>
                              {['Date','Reference','Type','Description','ERP Amount','Actual Amount','Difference','Status'].map(h => (
                                <th key={h}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {expandedItems.map((it, i) => (
                              <tr key={i} className="fba-tr" style={{ background: it.match_status==='Matched' ? 'var(--color-success-bg)' : '#FFFFFF' }}>
                                <td style={{ color: 'var(--color-text-secondary)', fontWeight: 500, whiteSpace: 'nowrap' }}>{fmtD(it.transaction_date)}</td>
                                <td style={{ fontFamily: 'monospace', color: 'var(--color-text-primary)', fontWeight: 600 }}>{it.reference_no}</td>
                                <td><Pill label={it.transaction_type} color={it.transaction_type==='CRV'?'var(--color-success)':it.transaction_type==='EV'?'var(--color-danger)':'var(--color-warning)'} bg={it.transaction_type==='CRV'?'var(--color-success-bg)':it.transaction_type==='EV'?'var(--color-danger-bg)':'var(--color-warning-bg)'}/></td>
                                <td style={{ color: 'var(--color-text-secondary)', fontWeight: 500, maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{it.description}</td>
                                <td style={{ fontWeight: 600, color: 'var(--color-text-secondary)', fontVariantNumeric: 'tabular-nums' }}>{fmt(it.erp_amount)}</td>
                                <td style={{ fontWeight: 600, color: 'var(--color-text-secondary)', fontVariantNumeric: 'tabular-nums' }}>{fmt(it.actual_amount)}</td>
                                <td style={{ fontWeight: 700, color: parseFloat(it.difference)===0?'var(--color-text-primary)':'var(--color-danger)', fontVariantNumeric: 'tabular-nums' }}>{fmt(it.difference)}</td>
                                <td><Pill label={it.match_status} color={it.match_status==='Matched'?'var(--color-success)':'var(--color-danger)'} bg={it.match_status==='Matched'?'var(--color-success-bg)':'var(--color-danger-bg)'}/></td>
                              </tr>
                            ))}
                            {expandedItems.length === 0 && <tr><td colSpan={8} style={{ padding: 32, textAlign: 'center', color: 'var(--color-text-muted)', fontWeight: 500 }}>No transaction items recorded.</td></tr>}
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
            <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#FFFFFF' }}>
              <h3 style={{ margin: 0, color: 'var(--color-text-primary)', fontSize: 18, fontWeight: 600 }}>Transactions: {viewAcc.account_name}</h3>
              <button type="button" className="fba-btn-icon" onClick={()=>setViewAcc(null)} aria-label="Close"><X size={18}/></button>
            </div>
            <div style={{ overflowY: 'auto', flex: 1, padding: 0 }}>
              <table className="fba-table" style={{ minWidth: 600 }}>
                <thead>
                  <tr>
                    {['Date','Type','Reference','Description','Receipt','Payment','Balance'].map(h => (
                      <th key={h} style={['Receipt','Payment','Balance'].includes(h) ? { textAlign: 'right' } : undefined}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {viewTx.map((tx, i) => (
                    <tr key={i} className="fba-tr">
                      <td style={{ color: 'var(--color-text-secondary)', fontWeight: 500, whiteSpace: 'nowrap' }}>{fmtD(tx.date)}</td>
                      <td><Pill label={tx.type} color={tx.type==='CRV'?'var(--color-success)':tx.type==='EV'?'var(--color-danger)':'var(--color-warning)'} bg={tx.type==='CRV'?'var(--color-success-bg)':tx.type==='EV'?'var(--color-danger-bg)':'var(--color-warning-bg)'}/></td>
                      <td style={{ fontFamily: 'monospace', color: 'var(--color-primary)', fontWeight: 600 }}>{tx.reference}</td>
                      <td style={{ color: 'var(--color-text-secondary)', fontWeight: 500 }}>{tx.description}</td>
                      <td style={{ color: 'var(--color-success)', fontWeight: 600, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{parseFloat(tx.receipts||0)>0 ? fmt(tx.receipts) : '—'}</td>
                      <td style={{ color: 'var(--color-danger)', fontWeight: 600, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{parseFloat(tx.payments||0)>0 ? fmt(tx.payments) : '—'}</td>
                      <td style={{ fontWeight: 700, color: tx.balance>=0?'var(--color-text-primary)':'var(--color-danger)', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{fmt(tx.balance)}</td>
                    </tr>
                  ))}
                  {viewTx.length === 0 && <tr><td colSpan={7} style={{ padding: 48, textAlign: 'center', color: 'var(--color-text-muted)', fontWeight: 600, fontSize: 15 }}>No transactions found for this account type.</td></tr>}
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
