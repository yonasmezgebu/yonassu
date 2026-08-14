import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, Search, Download, Filter, CheckCircle, AlertCircle, X, TrendingUp, TrendingDown, RefreshCw, BarChart, Pencil, Trash2 } from 'lucide-react';
import apiClient from '../../services/apiClient';
import SegmentedSpinner from '../../components/ui/SegmentedSpinner';

// ─── ENTERPRISE PALETTE (scoped accent) ──────────────────────────────────────────────────
const G = {
  dark:      '#2563EB',
  forest:    '#16A34A',
  emerald:   '#16A34A',
  error:     '#DC2626',
  olive:     '#D97706',
  sage:      '#E5E7EB',
  darkGray:  '#4B5563',
  lightGray: '#F9FAFB',
  white:     '#FFFFFF',
  warning:   '#D97706',
};

// ─── TOAST NOTIFICATION ───────────────────────────────────────────────────────────────────
const ToastContainer = ({ toasts, remove }) => (
  <div style={{
    position: 'fixed', top: 20, right: 20, zIndex: 9999,
    display: 'flex', flexDirection: 'column', gap: 10, pointerEvents: 'none',
  }}>
    {toasts.map(t => {
      const bg   = t.type === 'error' ? G.error : t.type === 'warn' ? G.warning : G.forest;
      const Icon = t.type === 'error' ? AlertCircle : t.type === 'warn' ? AlertCircle : CheckCircle;
      return (
        <div key={t.id} className={'fe-toast' + (t.type === 'error' ? ' error' : t.type === 'warn' ? ' warn' : ' success')} style={{
          pointerEvents: 'all', background: bg, color: '#fff',
          padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12,
          minWidth: 280, maxWidth: 380, border: `2px solid ${G.dark}`,
        }}>
          <Icon size={18} style={{ flexShrink: 0 }} />
          <span style={{ fontWeight: 700, fontSize: 14, flex: 1, lineHeight: 1.4 }}>{t.msg}</span>
          <button onClick={() => remove(t.id)}
            style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 2, pointerEvents: 'all' }}>
            <X size={16} />
          </button>
        </div>
      );
    })}
  </div>
);

function useToast() {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);
  const push = useCallback((msg, type = 'success') => {
    const id = ++idRef.current;
    setToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4000);
  }, []);
  const remove = useCallback(id => setToasts(p => p.filter(t => t.id !== id)), []);
  return { toasts, push, remove };
}

// ─── FLAT BUTTON ──────────────────────────────────────────────────────────────────────────
const FlatBtn = ({ children, onClick, color = G.emerald, icon: Icon, disabled, outline, type = 'button' }) => {
  const [hover, setHover] = useState(false);
  const bg = disabled ? G.sage : (outline ? (hover ? color : '#fff') : (hover ? G.dark : color));
  const text = disabled ? '#fff' : (outline ? (hover ? '#fff' : color) : '#fff');
  
  return (
    <button
      className="fe-btn"
      type={type}
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => !disabled && setHover(true)}
      onMouseLeave={() => !disabled && setHover(false)}
      style={{
        background: bg,
        color: text,
        border: `2px solid ${disabled ? G.sage : (outline ? color : G.dark)}`,
        padding: '10px 18px',
        fontWeight: 800,
        fontSize: 13,
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        transition: 'all 0.2s',
        whiteSpace: 'nowrap',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
      }}
    >
      {Icon && <Icon size={15} />}
      {children}
    </button>
  );
};

// ─── STAT CARD ────────────────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, color, Icon, bgStyle }) => (
  <div
    className="fe-stat"
    style={{
      background: bgStyle || '#fff', border: `2px solid ${G.dark}`,
      padding: '20px', display: 'flex', flexDirection: 'column', gap: 8,
      transition: 'background 0.2s',
    }}
    onMouseEnter={e => e.currentTarget.style.background = '#F1F8E9'}
    onMouseLeave={e => e.currentTarget.style.background = bgStyle || '#fff'}
  >
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ background: color, padding: 10, border: `2px solid ${G.dark}`, display: 'flex' }}>
        <Icon size={20} color="#fff" />
      </div>
    </div>
    <div style={{ fontSize: 24, fontWeight: 900, color: G.dark, lineHeight: 1.1, marginTop: 4 }}>
      {value ?? '—'}
    </div>
    <div style={{ fontSize: 12, color: G.darkGray, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5 }}>
      {label}
    </div>
    <div style={{ height: 3, background: color, marginTop: 2 }} />
  </div>
);

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────────────────
export default function FinanceEquity() {
  const [transactions, setTransactions] = useState([]);
  const [dashboard, setDashboard] = useState({ totalEquity: 0, totalContributions: 0, totalWithdrawals: 0, retainedEarnings: 0 });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals
  const [showAddContribution, setShowAddContribution] = useState(false);
  const [showAddWithdrawal, setShowAddWithdrawal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  
  const { toasts, push, remove } = useToast();

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [dashRes, listRes] = await Promise.all([
        apiClient.get('/finance-equity/dashboard'),
        apiClient.get('/finance-equity/transactions')
      ]);
      setDashboard(dashRes.data?.data || dashRes.data || {});
      setTransactions(listRes.data?.data || listRes.data || []);
    } catch (err) {
      push('Failed to load equity data', 'error');
    } finally {
      setLoading(false);
    }
  }, [push]);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Form States ──
  const [contForm, setContForm] = useState({ owner_name: '', transaction_date: '', amount: '', description: '' });
  const [withForm, setWithForm] = useState({ owner_name: '', transaction_date: '', amount: '', description: '' });

  const handleAddContribution = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiClient.post('/finance-equity/contribution', contForm);
      push('Owner contribution recorded successfully.');
      setShowAddContribution(false);
      setContForm({ owner_name: '', transaction_date: '', amount: '', description: '' });
      loadData();
    } catch (err) {
      push('Failed to record contribution', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRecordWithdrawal = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiClient.post('/finance-equity/withdrawal', withForm);
      push('Owner withdrawal recorded successfully.');
      setShowAddWithdrawal(false);
      setWithForm({ owner_name: '', transaction_date: '', amount: '', description: '' });
      loadData();
    } catch (err) {
      push('Failed to record withdrawal', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // we use either contForm or withForm based on the type
      const isContrib = editItem.transaction_type === 'Contribution';
      const payload = isContrib ? contForm : withForm;
      await apiClient.put(`/finance-equity/${editItem.id}`, payload);
      push('Transaction updated successfully.');
      setEditItem(null);
      setContForm({ owner_name: '', transaction_date: '', amount: '', description: '' });
      setWithForm({ owner_name: '', transaction_date: '', amount: '', description: '' });
      loadData();
    } catch (err) {
      push(err?.message || 'Failed to update transaction', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const openEdit = (item) => {
    const isContrib = item.transaction_type === 'Contribution';
    const formState = {
      owner_name: item.owner_name || '',
      transaction_date: item.transaction_date ? item.transaction_date.split('T')[0] : '',
      amount: item.amount || '',
      description: item.description || ''
    };
    if (isContrib) {
      setContForm(formState);
    } else {
      setWithForm(formState);
    }
    setEditItem(item);
  };

  const confirmDelete = async () => {
    if (!deleteItem) return;
    try {
      await apiClient.delete(`/finance-equity/${deleteItem.id}`);
      push('Transaction deleted.');
      loadData();
    } catch (err) {
      push(err?.message || 'Failed to delete.', 'error');
    } finally {
      setDeleteItem(null);
    }
  };

  const filteredList = transactions.filter(t => 
    t.owner_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.transaction_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Compute Running Balance for display
  let currentBalance = 0;
  const listWithBalance = filteredList.map(t => {
    const amt = parseFloat(t.amount);
    if (t.transaction_type === 'Contribution' || t.transaction_type === 'Net Profit') {
      currentBalance += amt;
    } else if (t.transaction_type === 'Withdrawal' || t.transaction_type === 'Net Loss') {
      currentBalance -= amt;
    }
    return { ...t, runningBalance: currentBalance };
  }).reverse(); // Reverse for UI display (newest on top)

  return (
    <div className="fe-page" style={{
      background: G.white, minHeight: '100vh', width: '100%',
      fontFamily: "'Inter', sans-serif", boxSizing: 'border-box'
    }}>
      <style>{`
        :root, .fe-page {
          --color-accent: #2563EB;
          --color-gold: #F59E0B;
          --color-gold-text: #1F2937;
        }
        .fe-page, .fe-page *, .fe-page *::before, .fe-page *::after { box-sizing: border-box; }
        .fe-page { max-width: 1600px; margin: 0 auto; width: 100%; padding: 0; }
        .fe-spin { animation: fe-spin 1s linear infinite; }
        @keyframes fe-spin { 100% { transform: rotate(360deg); } }

        /* ── Page shell ── */
        .fe-content { padding: 0 !important; }

        /* ── Header ── */
        .fe-header-icon { border-radius: 10px; transition: transform 0.15s ease; }
        .fe-header-icon svg { display: block; }
        .fe-header-title { font-size: 28px !important; }

        /* ── Buttons (FlatBtn → .fe-btn) ── */
        .fe-btn {
          min-height: 36px !important;
          border-radius: 8px !important;
          transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease, transform 0.15s ease !important;
        }
        .fe-btn:hover { background: var(--color-gold) !important; border-color: var(--color-gold) !important; color: var(--color-gold-text) !important; }
        .fe-btn:disabled { opacity: 0.55; cursor: not-allowed; }

        /* ── KPI stat cards ── */
        .fe-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
        .fe-stat {
          border-radius: 10px !important;
          box-shadow: 0 1px 3px rgba(0,0,0,0.06);
          transition: box-shadow 0.15s ease, transform 0.15s ease !important;
        }
        .fe-stat:hover { transform: translateY(-2px); box-shadow: 0 6px 18px rgba(0,0,0,0.10); }
        .fe-stat > div:first-child > div { border-radius: 8px !important; }
        .fe-stat > div:nth-child(2) { font-variant-numeric: tabular-nums; }
        .fe-stat > div:last-child { border-radius: 3px; }

        /* ── Ledger + toolbar ── */
        .fe-ledger { border-radius: 10px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
        .fe-toolbar-title { letter-spacing: 1px; }
        .fe-search { height: 36px !important; padding: 8px 10px 8px 34px !important; border-radius: 8px !important; transition: border-color 0.15s ease, box-shadow 0.15s ease; }
        .fe-search:focus { border-color: var(--color-accent) !important; box-shadow: 0 0 0 3px rgba(37,99,235,0.10); }

        /* ── States ── */
        .fe-loading, .fe-empty { min-height: 180px; }
        .fe-loading { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; }

        /* ── Table ── */
        .fe-table { min-width: 900px; font-size: 14px; }
        .fe-thead, .fe-thead th { background: #F9FAFB !important; }
        .fe-thead th {
          border-right: 1px solid #E5E7EB !important;
          border-bottom: 1px solid #E5E7EB !important;
          font-size: 12px !important;
        }
        .fe-thead th:last-child { border-right: none !important; }
        .fe-row { background: #fff !important; transition: background 0.15s ease; }
        .fe-row:nth-child(even) { background: #fff !important; }
        .fe-row:hover { background: #F9FAFB !important; }
        .fe-table td {
          border-right: none !important;
          border-bottom: 1px solid #F3F4F6 !important;
          font-size: 14px;
        }
        .fe-table td:nth-child(5), .fe-table td:nth-child(6) { text-align: right; font-variant-numeric: tabular-nums; }
        .fe-thead th:nth-child(5), .fe-thead th:nth-child(6) { text-align: right; }
        .fe-table td:nth-child(2) { font-weight: 600; }

        /* ── Badges ── */
        .fe-badge { border-radius: 999px !important; }

        /* ── Row icon buttons ── */
        .fe-icon-btn {
          min-height: 32px; min-width: 32px; justify-content: center;
          border-radius: 8px !important;
          transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease, transform 0.15s ease !important;
        }
        .fe-icon-btn:hover { background: var(--color-gold) !important; border-color: var(--color-gold) !important; color: var(--color-gold-text) !important; }

        /* ── Modal ── */
        .fe-overlay { background: rgba(0,0,0,0.4) !important; animation: fe-fade 0.2s ease; }
        .fe-modal { border-radius: 12px !important; box-shadow: 0 20px 50px rgba(0,0,0,0.25); animation: fe-modal-in 0.2s ease; }
        .fe-modal-head { border-radius: 8px 8px 0 0; }
        .fe-modal-close { border-radius: 6px; transition: background 0.15s ease, color 0.15s ease; }
        .fe-modal-close:hover { background: var(--color-gold) !important; color: var(--color-gold-text) !important; }

        /* ── Forms ── */
        .fe-label {
          display: block; font-size: 11px; font-weight: 800; color: #4B5563;
          text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;
        }
        .fe-input {
          width: 100%; height: 36px !important; padding: 8px 12px !important;
          border-radius: 8px !important;
          font-weight: 700; font-size: 14px; color: #2563EB; background: #fff;
          outline: none; font-family: inherit;
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
        }
        .fe-input:focus, .fe-input:not(:placeholder-shown) { border-color: var(--color-accent) !important; }
        .fe-input:focus { box-shadow: 0 0 0 3px rgba(37,99,235,0.10); }

        /* ── Toasts ── */
        .fe-toast {
          background: #FFFFFF !important;
          color: #1F2937 !important;
          border: 1px solid #E5E7EB !important;
          border-left: 4px solid #16A34A !important;
          border-radius: 8px !important;
          box-shadow: 0 8px 24px rgba(0,0,0,0.12);
          animation: fe-slidein 0.25s ease;
        }
        .fe-toast.success { border-left-color: #16A34A !important; }
        .fe-toast.error   { border-left-color: #DC2626 !important; }
        .fe-toast.warn    { border-left-color: #D97706 !important; }
        .fe-toast button { color: #6B7280 !important; }
        .fe-toast button:hover { color: #1F2937 !important; }

        /* ── Animations ── */
        @keyframes fe-fade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fe-modal-in { from { opacity: 0; transform: translateY(-12px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes fe-slidein { from { opacity: 0; transform: translateX(24px); } to { opacity: 1; transform: translateX(0); } }

        /* ── Responsive ── */
        @media (max-width: 1100px) { .fe-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 600px)  { .fe-grid { grid-template-columns: 1fr; } }
        @media (max-width: 768px) {
          .fe-header { flex-direction: column; align-items: flex-start; }
          .fe-toolbar { flex-direction: column; align-items: flex-start; gap: 12px; }
          .fe-toolbar-right, .fe-search-wrap { width: 100%; }
          .fe-search { width: 100% !important; }
          .fe-btn, .fe-icon-btn { min-height: 44px !important; }
          .fe-input { min-height: 44px !important; }
          .fe-modal { max-width: calc(100vw - 32px); margin: 0 16px; }
          .fe-form-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <ToastContainer toasts={toasts} remove={remove} />

      <div className="fe-content" style={{ padding: '20px 24px' }}>
        {/* ── HEADER ── */}
        <div className="fe-header" style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexWrap: 'wrap', gap: 14, marginBottom: 24,
          paddingBottom: 16, borderBottom: `2px solid ${G.dark}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div className="fe-header-icon" style={{ background: G.forest, padding: '10px 12px', border: `2px solid ${G.dark}`, display: 'flex' }}>
              <BarChart size={24} color="#fff" />
            </div>
            <div>
              <div className="fe-header-title" style={{ fontSize: 24, fontWeight: 900, color: G.dark, letterSpacing: -0.5 }}>
                Equity &amp; Capital
              </div>
              <div className="fe-header-sub" style={{ fontSize: 13, color: G.darkGray, marginTop: 4, fontWeight: 600 }}>
                Finance Module · Manage owner contributions, drawings, and retained earnings
              </div>
            </div>
          </div>
          <div className="fe-header-actions" style={{ display: 'flex', gap: 12 }}>
            <FlatBtn icon={loading ? null : RefreshCw} color={G.emerald} outline onClick={loadData} disabled={loading}>{loading ? <SegmentedSpinner size={14} /> : 'Refresh'}</FlatBtn>
            <FlatBtn icon={TrendingDown} color={G.dark} outline onClick={() => setShowAddWithdrawal(true)}>Record Drawing</FlatBtn>
            <FlatBtn icon={TrendingUp} color={G.forest} onClick={() => setShowAddContribution(true)}>Add Contribution</FlatBtn>
          </div>
        </div>

        {/* ── KPI ── */}
        <div className="fe-grid">
          <StatCard label="Total Equity" value={`ETB ${Number(dashboard.totalEquity || 0).toLocaleString()}`} color={G.dark} Icon={BarChart} />
          <StatCard label="Total Contributions" value={`ETB ${Number(dashboard.totalContributions || 0).toLocaleString()}`} color={G.forest} Icon={TrendingUp} bgStyle="#E8F5E9" />
          <StatCard label="Total Withdrawals" value={`ETB ${Number(dashboard.totalWithdrawals || 0).toLocaleString()}`} color={G.error} Icon={TrendingDown} bgStyle="#FFEBEE" />
          <StatCard label="Retained Earnings" value={`ETB ${Number(dashboard.retainedEarnings || 0).toLocaleString()}`} color={G.emerald} Icon={CheckCircle} />
        </div>

        {/* ── LIST ── */}
        <div className="fe-ledger" style={{ border: `2px solid ${G.dark}`, background: '#fff' }}>
          {/* Toolbar */}
          <div className="fe-toolbar" style={{ padding: '16px 20px', background: G.dark, borderBottom: `2px solid ${G.forest}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 className="fe-toolbar-title" style={{ margin: 0, fontSize: 14, fontWeight: 900, color: '#fff', textTransform: 'uppercase', letterSpacing: 1 }}>
              Equity Statement Ledger
            </h2>
            <div className="fe-toolbar-right" style={{ display: 'flex', gap: 10 }}>
              <div className="fe-search-wrap" style={{ position: 'relative' }}>
                <Search size={14} color={G.dark} style={{ position: 'absolute', top: 12, left: 12 }} />
                <input
                  className="fe-search"
                  type="text"
                  placeholder="Search owner or type..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  style={{
                    padding: '10px 10px 10px 34px', border: `2px solid ${G.dark}`, background: '#fff',
                    outline: 'none', fontWeight: 700, fontSize: 12, width: 220
                  }}
                />
              </div>
            </div>
          </div>

          {loading && transactions.length === 0 ? (
            <div className="fe-loading" style={{ padding: '80px 20px', textAlign: 'center', color: G.forest, fontWeight: 800, fontSize: 16 }}>
              <SegmentedSpinner size={32} />
              Loading Equity Data...
            </div>
          ) : listWithBalance.length === 0 ? (
            <div className="fe-empty" style={{ padding: '60px 20px', textAlign: 'center', background: G.lightGray }}>
              <BarChart size={48} color={G.sage} style={{ marginBottom: 12, display: 'block', margin: '0 auto' }} />
              <div className="fe-empty-title" style={{ fontWeight: 800, fontSize: 18, color: G.dark, textTransform: 'uppercase' }}>No Equity Records Found</div>
            </div>
          ) : (
            <div className="fe-table-scroll" style={{ overflowX: 'auto' }}>
              <table className="fe-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 900 }}>
                <thead>
                  <tr className="fe-thead" style={{ background: '#E8F5E9' }}>
                    {['Date', 'Owner', 'Type', 'Description', 'Amount', 'Running Balance', 'Actions'].map((h, i) => (
                      <th key={h} style={{
                        padding: '14px 16px', fontWeight: 900, fontSize: 11, color: G.dark,
                        textTransform: 'uppercase', letterSpacing: 0.8, borderBottom: `2px solid ${G.forest}`,
                        borderRight: i < 6 ? `1px solid ${G.sage}` : 'none'
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {listWithBalance.map((item, idx) => {
                    const isPositive = item.transaction_type === 'Contribution' || item.transaction_type === 'Net Profit';
                    const typeColor = isPositive ? G.forest : G.error;
                    const typeBg = isPositive ? '#E8F5E9' : '#FFEBEE';

                    return (
                      <tr key={item.id} className="fe-row" style={{ background: idx % 2 === 0 ? '#fff' : '#f9fbf9', borderBottom: `1px solid ${G.sage}` }}>
                        <td style={{ padding: '14px 16px', fontWeight: 700, color: G.darkGray, borderRight: `1px solid ${G.sage}` }}>
                          {new Date(item.transaction_date).toLocaleDateString()}
                        </td>
                        <td style={{ padding: '14px 16px', fontWeight: 800, color: G.dark, borderRight: `1px solid ${G.sage}` }}>
                          {item.owner_name}
                        </td>
                        <td style={{ padding: '14px 16px', borderRight: `1px solid ${G.sage}` }}>
                          <span className={'fe-badge ' + (isPositive ? 'positive' : 'negative')} style={{
                            background: typeBg, color: typeColor, padding: '4px 8px', display: 'inline-flex', alignItems: 'center', gap: 4,
                            fontWeight: 800, fontSize: 11, border: `2px solid ${typeColor}`, textTransform: 'uppercase'
                          }}>
                            {isPositive ? <TrendingUp size={12}/> : <TrendingDown size={12}/>}
                            {item.transaction_type}
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px', fontWeight: 600, color: G.darkGray, borderRight: `1px solid ${G.sage}` }}>
                          {item.description || '—'}
                        </td>
                        <td style={{ padding: '14px 16px', fontWeight: 900, color: typeColor, borderRight: `1px solid ${G.sage}` }}>
                          {isPositive ? '+' : '-'} {Number(item.amount).toLocaleString()}
                        </td>
                        <td style={{ padding: '14px 16px', fontWeight: 900, fontSize: 14, color: G.dark, borderRight: `1px solid ${G.sage}` }}>
                          ETB {Number(item.runningBalance).toLocaleString()}
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
                            {['Contribution', 'Withdrawal'].includes(item.transaction_type) && (
                              <>
                                <button
                                  onClick={() => openEdit(item)}
                                  title="Edit"
                                  className="fe-icon-btn edit"
                                  style={{
                                    background: G.olive, color: '#fff', border: `2px solid ${G.olive}`,
                                    padding: '5px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center'
                                  }}
                                >
                                  <Pencil size={11} />
                                </button>
                                <button
                                  onClick={() => setDeleteItem(item)}
                                  title="Delete"
                                  className="fe-icon-btn del"
                                  style={{
                                    background: G.error, color: '#fff', border: `2px solid ${G.error}`,
                                    padding: '5px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center'
                                  }}
                                >
                                  <Trash2 size={11} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── ADD CONTRIBUTION MODAL ── */}
        {showAddContribution && (
          <div className="fe-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
            <div className="fe-modal" style={{ background: '#fff', border: `4px solid ${G.dark}`, width: '100%', maxWidth: 500, padding: 0 }}>
              <div className="fe-modal-head" style={{ background: G.dark, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 className="fe-modal-title" style={{ margin: 0, color: '#fff', fontSize: 16, fontWeight: 900, textTransform: 'uppercase' }}>Add Owner Contribution</h3>
                <button onClick={() => setShowAddContribution(false)} className="fe-modal-close" style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}><X size={20}/></button>
              </div>
              <form onSubmit={handleAddContribution} className="fe-modal-body" style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label className="fe-label">Owner Name</label>
                  <input required className="fe-input" placeholder="e.g. Mr. Abebe" value={contForm.owner_name} onChange={e => setContForm({...contForm, owner_name: e.target.value})} />
                </div>
                <div className="fe-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label className="fe-label">Date</label>
                    <input required type="date" className="fe-input" value={contForm.transaction_date} onChange={e => setContForm({...contForm, transaction_date: e.target.value})} />
                  </div>
                  <div>
                    <label className="fe-label">Amount (ETB)</label>
                    <input required type="number" min="0" step="0.01" className="fe-input" placeholder="500000" value={contForm.amount} onChange={e => setContForm({...contForm, amount: e.target.value})} />
                  </div>
                </div>
                <div>
                  <label className="fe-label">Description</label>
                  <input required className="fe-input" placeholder="e.g. Initial Capital" value={contForm.description} onChange={e => setContForm({...contForm, description: e.target.value})} />
                </div>
                <div className="fe-form-footer" style={{ marginTop: 8, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                  <FlatBtn outline color={G.darkGray} onClick={() => setShowAddContribution(false)}>Cancel</FlatBtn>
                  <FlatBtn type="submit" color={G.forest} disabled={submitting}>{submitting ? 'Saving...' : 'Save Contribution'}</FlatBtn>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── RECORD WITHDRAWAL MODAL ── */}
        {showAddWithdrawal && (
          <div className="fe-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
            <div className="fe-modal" style={{ background: '#fff', border: `4px solid ${G.dark}`, width: '100%', maxWidth: 500, padding: 0 }}>
              <div className="fe-modal-head" style={{ background: G.dark, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 className="fe-modal-title" style={{ margin: 0, color: '#fff', fontSize: 16, fontWeight: 900, textTransform: 'uppercase' }}>Record Owner Drawing</h3>
                <button onClick={() => setShowAddWithdrawal(false)} className="fe-modal-close" style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}><X size={20}/></button>
              </div>
              <form onSubmit={handleRecordWithdrawal} className="fe-modal-body" style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label className="fe-label">Owner Name</label>
                  <input required className="fe-input" placeholder="e.g. Mr. Abebe" value={withForm.owner_name} onChange={e => setWithForm({...withForm, owner_name: e.target.value})} />
                </div>
                <div className="fe-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label className="fe-label">Date</label>
                    <input required type="date" className="fe-input" value={withForm.transaction_date} onChange={e => setWithForm({...withForm, transaction_date: e.target.value})} />
                  </div>
                  <div>
                    <label className="fe-label">Amount (ETB)</label>
                    <input required type="number" min="0.01" step="0.01" className="fe-input" placeholder="20000" value={withForm.amount} onChange={e => setWithForm({...withForm, amount: e.target.value})} />
                  </div>
                </div>
                <div>
                  <label className="fe-label">Reason</label>
                  <input required className="fe-input" placeholder="e.g. Personal use" value={withForm.description} onChange={e => setWithForm({...withForm, description: e.target.value})} />
                </div>
                <div className="fe-form-footer" style={{ marginTop: 8, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                  <FlatBtn outline color={G.darkGray} onClick={() => setShowAddWithdrawal(false)}>Cancel</FlatBtn>
                  <FlatBtn type="submit" color={G.error} disabled={submitting}>{submitting ? 'Recording...' : 'Record Withdrawal'}</FlatBtn>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── EDIT MODAL ── */}
        {editItem && (
          <div className="fe-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
            <div className="fe-modal" style={{ background: '#fff', border: `4px solid ${G.dark}`, width: '100%', maxWidth: 500, padding: 0 }}>
              <div className="fe-modal-head" style={{ background: G.dark, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 className="fe-modal-title" style={{ margin: 0, color: '#fff', fontSize: 16, fontWeight: 900, textTransform: 'uppercase' }}>Edit {editItem.transaction_type}</h3>
                <button onClick={() => setEditItem(null)} className="fe-modal-close" style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}><X size={20}/></button>
              </div>
              <form onSubmit={handleEdit} className="fe-modal-body" style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label className="fe-label">Owner Name</label>
                  <input required className="fe-input" placeholder="e.g. Mr. Abebe" 
                    value={editItem.transaction_type === 'Contribution' ? contForm.owner_name : withForm.owner_name} 
                    onChange={e => {
                      if (editItem.transaction_type === 'Contribution') setContForm({...contForm, owner_name: e.target.value});
                      else setWithForm({...withForm, owner_name: e.target.value});
                    }} 
                  />
                </div>
                <div className="fe-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label className="fe-label">Date</label>
                    <input required type="date" className="fe-input" 
                      value={editItem.transaction_type === 'Contribution' ? contForm.transaction_date : withForm.transaction_date} 
                      onChange={e => {
                        if (editItem.transaction_type === 'Contribution') setContForm({...contForm, transaction_date: e.target.value});
                        else setWithForm({...withForm, transaction_date: e.target.value});
                      }} 
                    />
                  </div>
                  <div>
                    <label className="fe-label">Amount (ETB)</label>
                    <input required type="number" min="0" step="0.01" className="fe-input" placeholder="0" 
                      value={editItem.transaction_type === 'Contribution' ? contForm.amount : withForm.amount} 
                      onChange={e => {
                        if (editItem.transaction_type === 'Contribution') setContForm({...contForm, amount: e.target.value});
                        else setWithForm({...withForm, amount: e.target.value});
                      }} 
                    />
                  </div>
                </div>
                <div>
                  <label className="fe-label">Description</label>
                  <input className="fe-input" placeholder="e.g. Initial Capital" 
                    value={editItem.transaction_type === 'Contribution' ? contForm.description : withForm.description} 
                    onChange={e => {
                      if (editItem.transaction_type === 'Contribution') setContForm({...contForm, description: e.target.value});
                      else setWithForm({...withForm, description: e.target.value});
                    }} 
                  />
                </div>
                <div className="fe-form-footer" style={{ marginTop: 8, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                  <FlatBtn outline color={G.darkGray} onClick={() => setEditItem(null)}>Cancel</FlatBtn>
                  <FlatBtn type="submit" color={G.forest} disabled={submitting}>{submitting ? 'Updating...' : 'Update'}</FlatBtn>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── DELETE MODAL ── */}
        {deleteItem && (
          <div className="fe-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
            <div className="fe-modal" style={{ background: '#fff', border: `4px solid ${G.error}`, width: '100%', maxWidth: 500, padding: 0 }}>
              <div className="fe-modal-head" style={{ background: G.error, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 className="fe-modal-title" style={{ margin: 0, color: '#fff', fontSize: 16, fontWeight: 900, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertCircle size={18} /> Confirm Delete
                </h3>
                <button onClick={() => setDeleteItem(null)} className="fe-modal-close" style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}><X size={20}/></button>
              </div>
              <div className="fe-modal-body" style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ fontSize: '0.9rem', fontWeight: 600, color: G.dark, lineHeight: 1.5 }}>
                  Are you sure you want to delete this {deleteItem.transaction_type} of <strong style={{ color: G.error }}>ETB {Number(deleteItem.amount).toLocaleString()}</strong> by <strong>{deleteItem.owner_name}</strong>?
                  <br /><br />
                  This action cannot be undone and will recalculate running balances.
                </div>
                <div className="fe-form-footer" style={{ marginTop: 8, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                  <FlatBtn outline color={G.darkGray} onClick={() => setDeleteItem(null)}>Cancel</FlatBtn>
                  <FlatBtn color={G.error} onClick={confirmDelete}>Delete</FlatBtn>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
