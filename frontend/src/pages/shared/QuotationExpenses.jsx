import React, { useState, useEffect, useCallback } from 'react';
import { FileText, ExternalLink, CheckCircle, Loader, Search, Wallet, Clock, DollarSign, XCircle, Lock } from 'lucide-react';
import apiClient from '../../services/apiClient';
import authService from '../../services/authService';

const GlobalStyles = () => (
  <style>{`
    .qe-wrapper { padding: 24px; box-sizing: border-box; width: 100%; font-family: 'Inter', 'Segoe UI', Roboto, -apple-system, sans-serif; color: #111827; }
    .qe-container { max-width: 1200px; margin: 0 auto; }
    .qe-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 12px; }
    .qe-title { font-size: 26px; font-weight: 700; margin: 0; color: #111827; }
    .qe-subtitle { font-size: 14px; color: #6B7280; margin: 4px 0 0 0; }
    .qe-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; margin-bottom: 20px; }
    .qe-stat { background: #fff; border: 1px solid #E5E7EB; border-radius: 10px; padding: 14px 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
    .qe-stat-label { font-size: 12px; font-weight: 600; color: #6B7280; text-transform: uppercase; letter-spacing: 0.4px; }
    .qe-stat-value { font-size: 22px; font-weight: 800; margin-top: 4px; }
    .qe-card { background: #fff; border: 1px solid #E5E7EB; border-radius: 10px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
    .qe-toolbar { display: flex; justify-content: space-between; align-items: center; gap: 12px; padding: 14px 16px; border-bottom: 1px solid #E5E7EB; flex-wrap: wrap; }
    .qe-search { display: flex; align-items: center; gap: 8px; border: 1px solid #D1D5DB; border-radius: 8px; padding: 6px 10px; background: #F9FAFB; }
    .qe-search input { border: none; outline: none; font-size: 14px; background: transparent; min-width: 260px; color: #111827; }
    .qe-tbl { width: 100%; border-collapse: collapse; font-size: 13.5px; }
    .qe-tbl th { text-align: left; padding: 10px 14px; background: #F9FAFB; color: #4B5563; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.4px; border-bottom: 1px solid #E5E7EB; white-space: nowrap; }
    .qe-tbl td { padding: 12px 14px; border-bottom: 1px solid #F3F4F6; vertical-align: middle; }
    .qe-tbl tr:hover td { background: #F9FAFB; }
    .qe-badge { display: inline-block; padding: 3px 10px; border-radius: 999px; font-size: 12px; font-weight: 600; white-space: nowrap; }
    .qe-qno { font-family: monospace; font-weight: 700; color: #2563EB; }
    .qe-btn { border: none; border-radius: 8px; padding: 8px 14px; font-size: 13px; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; transition: opacity 120ms ease; }
    .qe-btn:disabled { opacity: 0.55; cursor: not-allowed; }
    .qe-btn-green { background: #16A34A; color: #fff; }
    .qe-btn-green:hover:not(:disabled) { background: #15803D; }
    .qe-empty { padding: 48px; text-align: center; color: #6B7280; font-size: 14px; }
    .qe-toast { position: fixed; top: 20px; right: 20px; z-index: 9999; padding: 12px 18px; border-radius: 10px; font-size: 14px; font-weight: 600; color: #fff; box-shadow: 0 8px 24px rgba(0,0,0,0.18); }
  `}</style>
);

const financeStatusBadge = (fs, ceoApproved) => {
  const map = {
    'awaiting ceo approval': ceoApproved ? { t: 'CEO Approved — Awaiting Release', bg: '#DCFCE7', c: '#15803D' } : { t: 'Awaiting CEO Approval', bg: '#FEF3C7', c: '#92400E' },
    ready: { t: 'Ready', bg: '#DCFCE7', c: '#15803D' },
    paid: { t: 'Paid', bg: '#E0F2FE', c: '#0369A1' },
    cancelled: { t: 'Cancelled', bg: '#FEE2E2', c: '#B91C1C' }
  }[fs];
  return map || { t: fs || '—', bg: '#F3F4F6', c: '#4B5563' };
};

const quoteStatusBadge = (st) => {
  const map = {
    'Pending CEO Approval': { t: 'Pending CEO', bg: '#FEF3C7', c: '#92400E' },
    Recorded: { t: 'Recorded', bg: '#E0F2FE', c: '#0369A1' },
    Converted: { t: 'Converted', bg: '#DCFCE7', c: '#15803D' },
    Cancelled: { t: 'Cancelled', bg: '#FEE2E2', c: '#B91C1C' }
  }[st];
  return map || { t: st || '—', bg: '#F3F4F6', c: '#4B5563' };
};

const QuotationExpenses = () => {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [markingId, setMarkingId] = useState(null);
  const [toast, setToast] = useState(null);

  const isFinance = authService.hasRole('Finance Manager') || authService.hasRole('Finance') || authService.hasRole('Accountant');
  const isAdmin = authService.hasRole('Admin');

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchList = useCallback(async () => {
    try {
      const res = await apiClient.get('/purchase/quotations/expenses');
      if (res && Array.isArray(res.data)) setList(res.data);
    } catch (err) {
      showToast(err.message || 'Failed to load expenses', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchList(); }, [fetchList]);

  const markReady = async (q) => {
    setMarkingId(q.id);
    try {
      await apiClient.post(`/purchase/quotations/${q.id}/finance-approve`);
      showToast(`Funds released for ${q.quotation_no} — ready to convert`);
      fetchList();
    } catch (err) {
      showToast(err.message || 'Failed to approve finance request', 'error');
    } finally {
      setMarkingId(null);
    }
  };

  const filtered = (list || []).filter(q =>
    !search ||
    q.quotation_no?.toLowerCase().includes(search.toLowerCase()) ||
    q.supplier_name?.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    awaiting: (list || []).filter(q => q.finance_status === 'awaiting ceo approval').length,
    ready: (list || []).filter(q => q.finance_status === 'ready').length,
    paid: (list || []).filter(q => q.finance_status === 'paid').length,
    cancelled: (list || []).filter(q => q.finance_status === 'cancelled').length
  };

  return (
    <div className="qe-wrapper">
      <GlobalStyles />
      {toast && <div className="qe-toast" style={{ background: toast.type === 'error' ? '#DC2626' : '#16A34A' }}>{toast.msg}</div>}

      <div className="qe-container">
        <div className="qe-header">
          <div>
            <h1 className="qe-title"><FileText size={24} color="#0F766E" style={{ verticalAlign: 'middle', marginRight: 8 }} />Quotation Expenses</h1>
            <p className="qe-subtitle">Finance approval for recorded quotations before they can be converted to purchase orders.</p>
          </div>
        </div>

        <div className="qe-stats">
          <div className="qe-stat"><div className="qe-stat-label">Awaiting CEO Approval</div><div className="qe-stat-value" style={{ color: '#D97706' }}>{stats.awaiting}</div></div>
          <div className="qe-stat"><div className="qe-stat-label">Ready (Funds Released)</div><div className="qe-stat-value" style={{ color: '#16A34A' }}>{stats.ready}</div></div>
          <div className="qe-stat"><div className="qe-stat-label">Paid</div><div className="qe-stat-value" style={{ color: '#0369A1' }}>{stats.paid}</div></div>
          <div className="qe-stat"><div className="qe-stat-label">Cancelled</div><div className="qe-stat-value" style={{ color: '#DC2626' }}>{stats.cancelled}</div></div>
        </div>

        <div className="qe-card">
          <div className="qe-toolbar">
            <div className="qe-search"><Search size={16} color="#6B7280" /><input placeholder="Search by quotation no or supplier…" value={search} onChange={e => setSearch(e.target.value)} /></div>
            <span style={{ fontSize: 12, color: '#6B7280' }}>{filtered.length} expense request(s)</span>
          </div>

          {loading ? (
            <div className="qe-empty"><Loader size={24} style={{ animation: 'spin 1s linear infinite' }} /> Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="qe-empty">No quotation expense requests found.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="qe-tbl">
                <thead>
                  <tr>
                    <th>Quotation</th>
                    <th>Supplier</th>
                    <th>Amount</th>
                    <th>Quote Status</th>
                    <th>Expense Status</th>
                    <th>CEO Approved</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(q => {
                    const fb = financeStatusBadge(q.finance_status, q.finance_ceo_approved);
                    const qb = quoteStatusBadge(q.status);
                    const canMarkReady = (isFinance || isAdmin) && q.finance_status === 'awaiting ceo approval';
                    const ceoApproved = q.status === 'Recorded' && !!q.finance_ceo_approved;
                    return (
                      <tr key={q.id}>
                        <td className="qe-qno">{q.quotation_no}</td>
                        <td>{q.supplier_name}</td>
                        <td style={{ fontWeight: 700 }}>ETB {Number(q.finance_amount ?? q.total_amount ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td><span className="qe-badge" style={{ background: qb.bg, color: qb.c }}>{qb.t}</span></td>
                        <td><span className="qe-badge" style={{ background: fb.bg, color: fb.c }}>{fb.t}</span></td>
                        <td>{q.finance_ceo_approved ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#15803D', fontWeight: 600, fontSize: 13 }}>
                            <CheckCircle size={14} /> Approved{q.ceo_approved_at ? ` · ${new Date(q.ceo_approved_at).toLocaleDateString()}` : ''}
                          </span>
                        ) : (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#D97706', fontWeight: 600, fontSize: 13 }}>
                            <Clock size={14} /> Pending
                          </span>
                        )}</td>
                        <td>
                          {canMarkReady ? (
                            ceoApproved ? (
                              <button className="qe-btn qe-btn-green" disabled={markingId === q.id} onClick={() => markReady(q)}>
                                {markingId === q.id ? <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <CheckCircle size={16} />}
                                {markingId === q.id ? 'Releasing…' : 'Mark Ready — Release Funds'}
                              </button>
                            ) : (
                              <button className="qe-btn qe-btn-green" disabled style={{ opacity: 0.45, cursor: 'not-allowed' }} title="Locked until the CEO approves this quotation">
                                <Lock size={16} /> Locked — Awaiting CEO Approval
                              </button>
                            )
                          ) : q.finance_status === 'ready' ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#15803D', fontWeight: 600, fontSize: 13 }}><Wallet size={15} /> Ready — awaiting conversion</span>
                          ) : q.finance_status === 'paid' ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#0369A1', fontWeight: 600, fontSize: 13 }}><DollarSign size={15} /> Paid</span>
                          ) : q.finance_status === 'cancelled' ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#B91C1C', fontWeight: 600, fontSize: 13 }}><XCircle size={15} /> Cancelled</span>
                          ) : (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#D97706', fontWeight: 600, fontSize: 13 }}><Clock size={15} /> Awaiting CEO</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {(isFinance || isAdmin) && (
          <p style={{ marginTop: 12, fontSize: 12.5, color: '#6B7280', display: 'flex', alignItems: 'center', gap: 6 }}>
            <ExternalLink size={13} /> Funds can be released only after the CEO approves the quotation. Once released, Purchasing can convert the quotation (optionally to the General Store); on store receipt the expense is marked Paid.
          </p>
        )}
      </div>
    </div>
  );
};

export default QuotationExpenses;