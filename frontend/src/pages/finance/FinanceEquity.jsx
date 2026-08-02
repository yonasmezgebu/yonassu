import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, Search, Download, Filter, CheckCircle, AlertCircle, X, TrendingUp, TrendingDown, RefreshCw, BarChart, Pencil, Trash2 } from 'lucide-react';
import apiClient from '../../services/apiClient';

// ─── GREEN UNIVERSITY PALETTE ─────────────────────────────────────────────────────────────
const G = {
  forest:    '#228B22', dark:      '#1B5E20', emerald:   '#2E8B57',
  leaf:      '#4CAF50', sage:      '#A5D6A7', olive:     '#6B8E23',
  mint:      '#98FF98', lime:      '#8BC34A', brown:     '#8D6E63',
  sky:       '#87CEEB', white:     '#FFFFFF', lightGray: '#F5F5F5',
  darkGray:  '#424242', warning:   '#FF9800', error:     '#F44336',
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
        <div key={t.id} style={{
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
    <div style={{
      background: G.white, minHeight: '100vh', width: '100%',
      fontFamily: "'Inter', sans-serif", boxSizing: 'border-box'
    }}>
      <style>{`
        * { box-sizing: border-box; }
        .fe-spin { animation: fe-spin 1s linear infinite; }
        @keyframes fe-spin { 100% { transform: rotate(360deg); } }
        
        .fe-input {
          width: 100%; padding: 12px 14px; border: 2px solid ${G.sage};
          font-weight: 700; font-size: 14px; color: ${G.dark}; background: #fff;
          outline: none; transition: border-color 0.2s; font-family: inherit;
        }
        .fe-input:focus, .fe-input:not(:placeholder-shown) {
          border-color: ${G.forest};
        }
        .fe-label {
          display: block; font-size: 11px; font-weight: 800; color: ${G.darkGray};
          text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;
        }
        .fe-row:hover { background: #E8F5E9 !important; }
        
        .fe-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
        @media (max-width: 1100px) { .fe-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 600px)  { .fe-grid { grid-template-columns: 1fr; } }
      `}</style>

      <ToastContainer toasts={toasts} remove={remove} />

      <div style={{ padding: '20px 24px' }}>
        {/* ── HEADER ── */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexWrap: 'wrap', gap: 14, marginBottom: 24,
          paddingBottom: 16, borderBottom: `2px solid ${G.dark}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ background: G.forest, padding: '10px 12px', border: `2px solid ${G.dark}`, display: 'flex' }}>
              <BarChart size={24} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 900, color: G.dark, letterSpacing: -0.5 }}>
                Equity &amp; Capital
              </div>
              <div style={{ fontSize: 13, color: G.darkGray, marginTop: 4, fontWeight: 600 }}>
                Finance Module · Manage owner contributions, drawings, and retained earnings
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <FlatBtn icon={RefreshCw} color={G.emerald} outline onClick={loadData} disabled={loading}>Refresh</FlatBtn>
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
        <div style={{ border: `2px solid ${G.dark}`, background: '#fff' }}>
          {/* Toolbar */}
          <div style={{ padding: '16px 20px', background: G.dark, borderBottom: `2px solid ${G.forest}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0, fontSize: 14, fontWeight: 900, color: '#fff', textTransform: 'uppercase', letterSpacing: 1 }}>
              Equity Statement Ledger
            </h2>
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ position: 'relative' }}>
                <Search size={14} color={G.dark} style={{ position: 'absolute', top: 12, left: 12 }} />
                <input
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
            <div style={{ padding: '80px 20px', textAlign: 'center', color: G.forest, fontWeight: 800, fontSize: 16 }}>
              <RefreshCw size={32} className="fe-spin" style={{ display: 'block', margin: '0 auto 12px' }} />
              Loading Equity Data...
            </div>
          ) : listWithBalance.length === 0 ? (
            <div style={{ padding: '60px 20px', textAlign: 'center', background: G.lightGray }}>
              <BarChart size={48} color={G.sage} style={{ marginBottom: 12, display: 'block', margin: '0 auto' }} />
              <div style={{ fontWeight: 800, fontSize: 18, color: G.dark, textTransform: 'uppercase' }}>No Equity Records Found</div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 900 }}>
                <thead>
                  <tr style={{ background: '#E8F5E9' }}>
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
                          <span style={{
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
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
            <div style={{ background: '#fff', border: `4px solid ${G.dark}`, width: '100%', maxWidth: 500, padding: 0 }}>
              <div style={{ background: G.dark, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, color: '#fff', fontSize: 16, fontWeight: 900, textTransform: 'uppercase' }}>Add Owner Contribution</h3>
                <button onClick={() => setShowAddContribution(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}><X size={20}/></button>
              </div>
              <form onSubmit={handleAddContribution} style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label className="fe-label">Owner Name</label>
                  <input required className="fe-input" placeholder="e.g. Mr. Abebe" value={contForm.owner_name} onChange={e => setContForm({...contForm, owner_name: e.target.value})} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
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
                <div style={{ marginTop: 8, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                  <FlatBtn outline color={G.darkGray} onClick={() => setShowAddContribution(false)}>Cancel</FlatBtn>
                  <FlatBtn type="submit" color={G.forest} disabled={submitting}>{submitting ? 'Saving...' : 'Save Contribution'}</FlatBtn>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── RECORD WITHDRAWAL MODAL ── */}
        {showAddWithdrawal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
            <div style={{ background: '#fff', border: `4px solid ${G.dark}`, width: '100%', maxWidth: 500, padding: 0 }}>
              <div style={{ background: G.dark, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, color: '#fff', fontSize: 16, fontWeight: 900, textTransform: 'uppercase' }}>Record Owner Drawing</h3>
                <button onClick={() => setShowAddWithdrawal(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}><X size={20}/></button>
              </div>
              <form onSubmit={handleRecordWithdrawal} style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label className="fe-label">Owner Name</label>
                  <input required className="fe-input" placeholder="e.g. Mr. Abebe" value={withForm.owner_name} onChange={e => setWithForm({...withForm, owner_name: e.target.value})} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
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
                <div style={{ marginTop: 8, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                  <FlatBtn outline color={G.darkGray} onClick={() => setShowAddWithdrawal(false)}>Cancel</FlatBtn>
                  <FlatBtn type="submit" color={G.error} disabled={submitting}>{submitting ? 'Recording...' : 'Record Withdrawal'}</FlatBtn>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── EDIT MODAL ── */}
        {editItem && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
            <div style={{ background: '#fff', border: `4px solid ${G.dark}`, width: '100%', maxWidth: 500, padding: 0 }}>
              <div style={{ background: G.dark, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, color: '#fff', fontSize: 16, fontWeight: 900, textTransform: 'uppercase' }}>Edit {editItem.transaction_type}</h3>
                <button onClick={() => setEditItem(null)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}><X size={20}/></button>
              </div>
              <form onSubmit={handleEdit} style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
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
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
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
                <div style={{ marginTop: 8, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                  <FlatBtn outline color={G.darkGray} onClick={() => setEditItem(null)}>Cancel</FlatBtn>
                  <FlatBtn type="submit" color={G.forest} disabled={submitting}>{submitting ? 'Updating...' : 'Update'}</FlatBtn>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── DELETE MODAL ── */}
        {deleteItem && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
            <div style={{ background: '#fff', border: `4px solid ${G.error}`, width: '100%', maxWidth: 500, padding: 0 }}>
              <div style={{ background: G.error, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, color: '#fff', fontSize: 16, fontWeight: 900, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertCircle size={18} /> Confirm Delete
                </h3>
                <button onClick={() => setDeleteItem(null)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}><X size={20}/></button>
              </div>
              <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ fontSize: '0.9rem', fontWeight: 600, color: G.dark, lineHeight: 1.5 }}>
                  Are you sure you want to delete this {deleteItem.transaction_type} of <strong style={{ color: G.error }}>ETB {Number(deleteItem.amount).toLocaleString()}</strong> by <strong>{deleteItem.owner_name}</strong>?
                  <br /><br />
                  This action cannot be undone and will recalculate running balances.
                </div>
                <div style={{ marginTop: 8, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
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
