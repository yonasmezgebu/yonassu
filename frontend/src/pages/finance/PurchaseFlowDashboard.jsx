import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/apiClient';
import {
  DollarSign, CheckCircle, Clock, XCircle, AlertCircle,
  RefreshCw, ChevronDown, ChevronUp, FileText, Truck,
  CreditCard, Bell, Loader2, Receipt, Package
} from 'lucide-react';

const STATUS_CONFIG = {
  PENDING_CEO:       { label: 'Pending CEO',     bg: '#fef3c7', color: '#92400e', icon: Clock },
  APPROVED:          { label: 'CEO Approved',     bg: '#d1fae5', color: '#065f46', icon: CheckCircle },
  READY_FOR_PAYMENT: { label: 'Processing',       bg: '#dbeafe', color: '#1e40af', icon: Loader2 },
  PAID:              { label: 'Paid',             bg: '#dcfce7', color: '#166534', icon: Receipt },
  REJECTED:          { label: 'Rejected',         bg: '#fee2e2', color: '#991b1b', icon: XCircle },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || { label: status, bg: '#f1f5f9', color: '#475569', icon: AlertCircle };
  const Icon = cfg.icon;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700,
      background: cfg.bg, color: cfg.color
    }}>
      <Icon size={12} />
      {cfg.label}
    </span>
  );
}

function Toast({ toasts }) {
  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 10 }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          padding: '12px 20px', borderRadius: 10, fontWeight: 600, fontSize: 13, color: 'white',
          background: t.type === 'success' ? '#10b981' : t.type === 'error' ? '#ef4444' : '#3b82f6',
          boxShadow: '0 4px 16px rgba(0,0,0,0.15)', minWidth: 260,
          animation: 'slideIn 0.3s ease'
        }}>
          {t.message}
        </div>
      ))}
    </div>
  );
}

export default function ApproveFundsAndPay() {
  const [fundRequests, setFundRequests] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState([]);
  const [activeTab, setActiveTab] = useState('pending');
  const [expandedId, setExpandedId] = useState(null);
  const [actionLoading, setActionLoading] = useState({});

  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(p => [...p, { id, message, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3500);
  };

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [fRes, pRes] = await Promise.all([
        api.get('/public-procurement/fund-requests'),
        api.get('/public-procurement/payments'),
      ]);
      const fList = fRes?.data || fRes || [];
      const pList = pRes?.data || pRes || [];
      setFundRequests(Array.isArray(fList) ? fList : []);
      setPayments(Array.isArray(pList) ? pList : []);
    } catch (e) {
      showToast('Failed to load data: ' + e.message, 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const onFocus = () => fetchAll();
    window.addEventListener('focus', onFocus);
    window.addEventListener('refreshNotifications', fetchAll);
    return () => {
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('refreshNotifications', fetchAll);
    };
  }, [fetchAll]);

  // Mark as READY_FOR_PAYMENT (Processing)
  const handleMarkProcessing = async (id, reqCode) => {
    setActionLoading(p => ({ ...p, [id]: 'processing' }));
    try {
      await api.put(`/public-procurement/fund-requests/${id}/verify`);
      showToast(`✅ ${reqCode} marked as Processing — Purchase & Finance notified`, 'success');
      window.dispatchEvent(new Event('refreshNotifications'));
      fetchAll();
    } catch (e) {
      showToast('Error: ' + e.message, 'error');
    } finally {
      setActionLoading(p => ({ ...p, [id]: null }));
    }
  };

  // Mark as PAID (Final Payment)
  const handleMarkPaid = async (fundReq) => {
    setActionLoading(p => ({ ...p, [fundReq.id]: 'paying' }));
    try {
      await api.post('/public-procurement/payments', { fundRequestId: fundReq.id });
      showToast(`💳 Payment confirmed for ${fundReq.request_code}! Purchase notified.`, 'success');
      window.dispatchEvent(new Event('refreshNotifications'));
      fetchAll();
    } catch (e) {
      showToast('Payment failed: ' + e.message, 'error');
    } finally {
      setActionLoading(p => ({ ...p, [fundReq.id]: null }));
    }
  };

  const tabs = [
    { id: 'pending',    label: 'Approved by CEO',  count: fundRequests.filter(f => f.status === 'APPROVED').length },
    { id: 'processing', label: 'Processing',        count: fundRequests.filter(f => f.status === 'READY_FOR_PAYMENT').length },
    { id: 'paid',       label: 'Paid',              count: fundRequests.filter(f => f.status === 'PAID').length },
    { id: 'all',        label: 'All Requests',      count: fundRequests.length },
    { id: 'history',    label: 'Payment History',   count: payments.length },
  ];

  const filtered = (() => {
    if (activeTab === 'pending')    return fundRequests.filter(f => f.status === 'APPROVED');
    if (activeTab === 'processing') return fundRequests.filter(f => f.status === 'READY_FOR_PAYMENT');
    if (activeTab === 'paid')       return fundRequests.filter(f => f.status === 'PAID');
    if (activeTab === 'all')        return fundRequests;
    return [];
  })();

  const totalApproved = fundRequests
    .filter(f => f.status === 'APPROVED')
    .reduce((acc, f) => acc + parseFloat(f.total_amount || 0), 0);

  const totalProcessing = fundRequests
    .filter(f => f.status === 'READY_FOR_PAYMENT')
    .reduce((acc, f) => acc + parseFloat(f.total_amount || 0), 0);

  const totalPaid = payments.reduce((acc, p) => acc + parseFloat(p.amount || 0), 0);

  return (
    <div style={{ padding: 28, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        @keyframes slideIn { from { transform: translateX(40px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes spin { to { transform: rotate(360deg); } }
        .fund-card:hover { transform: translateY(-2px); box-shadow: 0 8px 30px rgba(0,0,0,0.1) !important; }
        .fund-card { transition: all 0.2s ease; }
        .action-btn:hover { filter: brightness(1.1); transform: translateY(-1px); }
        .action-btn { transition: all 0.15s ease; }
      `}</style>

      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ background: 'linear-gradient(135deg,#059669,#10b981)', borderRadius: 10, padding: '6px 10px', display: 'inline-flex' }}>
              <DollarSign size={22} color="white" />
            </span>
            Approve Funds &amp; Pay
          </h1>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 14 }}>
            Review CEO-approved fund requests, mark as Processing, and confirm final payments.
          </p>
        </div>
        <button
          onClick={fetchAll}
          style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 16px', background: 'white', border: '1px solid #e2e8f0', borderRadius: 8, cursor: 'pointer', fontSize: 13, color: '#475569', fontWeight: 600 }}
        >
          <RefreshCw size={14} style={loading ? { animation: 'spin 1s linear infinite' } : {}} />
          Refresh
        </button>
      </div>

      {/* ── Stats Row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
        {[
          { label: 'Awaiting Processing', value: `ETB ${totalApproved.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, count: fundRequests.filter(f => f.status === 'APPROVED').length, bg: '#fffbeb', border: '#fde68a', col: '#92400e', icon: Clock },
          { label: 'Being Processed', value: `ETB ${totalProcessing.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, count: fundRequests.filter(f => f.status === 'READY_FOR_PAYMENT').length, bg: '#eff6ff', border: '#bfdbfe', col: '#1e40af', icon: Loader2 },
          { label: 'Total Paid (All Time)', value: `ETB ${totalPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, count: payments.length, bg: '#f0fdf4', border: '#bbf7d0', col: '#166534', icon: Receipt },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 14, padding: '18px 22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: s.col, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>{s.label}</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: '#0f172a' }}>{s.value}</div>
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>{s.count} request{s.count !== 1 ? 's' : ''}</div>
                </div>
                <Icon size={28} color={s.col} />
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, borderBottom: '2px solid #e2e8f0', paddingBottom: 0 }}>
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            style={{
              padding: '10px 18px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13,
              borderBottom: activeTab === t.id ? '2px solid #059669' : '2px solid transparent',
              color: activeTab === t.id ? '#059669' : '#64748b',
              background: 'none', marginBottom: -2, display: 'flex', alignItems: 'center', gap: 7,
              transition: 'all 0.15s'
            }}
          >
            {t.label}
            {t.count > 0 && (
              <span style={{ background: activeTab === t.id ? '#059669' : '#e2e8f0', color: activeTab === t.id ? 'white' : '#64748b', borderRadius: 20, padding: '1px 8px', fontSize: 11, fontWeight: 700 }}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Content ── */}
      {activeTab !== 'history' ? (
        loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>
            <RefreshCw size={32} style={{ animation: 'spin 1s linear infinite', marginBottom: 12 }} />
            <p>Loading fund requests...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, background: 'white', borderRadius: 14, border: '1px solid #e2e8f0', color: '#94a3b8' }}>
            <DollarSign size={40} style={{ marginBottom: 12, opacity: 0.4 }} />
            <p style={{ fontWeight: 600 }}>No fund requests in this category.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {filtered.map(req => {
              const isExpanded = expandedId === req.id;
              const totalAmt = parseFloat(req.total_amount || 0);
              const isActioning = actionLoading[req.id];
              return (
                <div key={req.id} className="fund-card" style={{ background: 'white', borderRadius: 14, border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
                  {/* Card Header */}
                  <div style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <div style={{ background: 'linear-gradient(135deg,#059669,#10b981)', borderRadius: 10, width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <FileText size={20} color="white" />
                      </div>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: 16, color: '#0f172a' }}>{req.request_code}</div>
                        <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                          {new Date(req.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 22, fontWeight: 800, color: '#059669' }}>
                          ETB {totalAmt.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                        <div style={{ marginTop: 4 }}>
                          <StatusBadge status={req.status} />
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div style={{ display: 'flex', gap: 8 }}>
                        {req.status === 'APPROVED' && (
                          <button
                            className="action-btn"
                            onClick={() => handleMarkProcessing(req.id, req.request_code)}
                            disabled={!!isActioning}
                            style={{
                              padding: '10px 18px', background: 'linear-gradient(135deg,#3b82f6,#2563eb)', color: 'white',
                              border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: 13,
                              boxShadow: '0 4px 12px rgba(59,130,246,0.3)', display: 'flex', alignItems: 'center', gap: 6,
                              opacity: isActioning ? 0.7 : 1
                            }}
                          >
                            {isActioning === 'processing' ? <RefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Loader2 size={13} />}
                            Mark Processing
                          </button>
                        )}
                        {req.status === 'READY_FOR_PAYMENT' && (
                          <button
                            className="action-btn"
                            onClick={() => handleMarkPaid(req)}
                            disabled={!!isActioning}
                            style={{
                              padding: '10px 18px', background: 'linear-gradient(135deg,#059669,#10b981)', color: 'white',
                              border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: 13,
                              boxShadow: '0 4px 12px rgba(5,150,105,0.35)', display: 'flex', alignItems: 'center', gap: 6,
                              opacity: isActioning ? 0.7 : 1
                            }}
                          >
                            {isActioning === 'paying' ? <RefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <CreditCard size={13} />}
                            Confirm Payment (Paid)
                          </button>
                        )}
                        {req.status === 'PAID' && (
                          <span style={{ padding: '10px 18px', background: '#f0fdf4', color: '#166534', borderRadius: 8, fontWeight: 700, fontSize: 13, border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <CheckCircle size={13} /> Completed
                          </span>
                        )}
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : req.id)}
                          style={{ padding: '10px 12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center' }}
                        >
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expandable Detail */}
                  {isExpanded && req.items && req.items.length > 0 && (
                    <div style={{ borderTop: '1px solid #f1f5f9', padding: '0 24px 20px' }}>
                      <div style={{ paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
                        {req.items.map((item, idx) => (
                          <div key={idx} style={{ background: '#f8fafc', borderRadius: 10, padding: '14px 18px', border: '1px solid #e2e8f0' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                              <div>
                                <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>{item.tender_title || 'Tender'}</div>
                                <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>Supplier: <strong>{item.supplier}</strong></div>
                              </div>
                              <div style={{ fontWeight: 800, color: '#059669', fontSize: 16 }}>
                                ETB {parseFloat(item.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </div>
                            </div>
                            {item.products && item.products.length > 0 && (
                              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                                <thead>
                                  <tr style={{ background: '#e2e8f0' }}>
                                    {['Item', 'Qty', 'Unit Price (ETB)', 'Total (ETB)'].map(h => (
                                      <th key={h} style={{ padding: '6px 10px', textAlign: h === 'Item' ? 'left' : 'right', fontWeight: 600, color: '#475569', fontSize: 11 }}>{h}</th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {item.products.map((prod, pi) => {
                                    const unit = (prod.price_birr || 0) + (prod.price_cent || 0) / 100;
                                    const total = (prod.total_birr || 0) + (prod.total_cent || 0) / 100;
                                    return (
                                      <tr key={pi} style={{ borderBottom: pi !== item.products.length - 1 ? '1px solid #e2e8f0' : 'none' }}>
                                        <td style={{ padding: '7px 10px', color: '#1e293b', fontWeight: 500 }}>{prod.item_name}</td>
                                        <td style={{ padding: '7px 10px', textAlign: 'right', color: '#64748b' }}>{prod.quantity}</td>
                                        <td style={{ padding: '7px 10px', textAlign: 'right', color: '#64748b' }}>{unit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                        <td style={{ padding: '7px 10px', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>{total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                                <tfoot style={{ background: '#f1f5f9', borderTop: '2px solid #e2e8f0' }}>
                                  <tr>
                                    <td colSpan={3} style={{ padding: '7px 10px', textAlign: 'right', fontWeight: 700, color: '#475569' }}>Subtotal:</td>
                                    <td style={{ padding: '7px 10px', textAlign: 'right', fontWeight: 800, color: '#0f172a' }}>
                                      {item.products.reduce((a, p) => a + (p.total_birr || 0) + (p.total_cent || 0) / 100, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </td>
                                  </tr>
                                </tfoot>
                              </table>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* ── Payment History Tab ── */
        <div style={{ background: 'white', borderRadius: 14, border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <div style={{ padding: '16px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Receipt size={18} color="#059669" />
            <span style={{ fontWeight: 700, fontSize: 15, color: '#0f172a' }}>Payment History</span>
            <span style={{ marginLeft: 'auto', fontSize: 12, color: '#64748b' }}>{payments.length} record{payments.length !== 1 ? 's' : ''}</span>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                {['Receipt Code', 'Fund Request', 'Amount (ETB)', 'Paid At', 'Status'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: h === 'Amount (ETB)' ? 'right' : 'left', color: '#475569', fontWeight: 600, fontSize: 12, borderBottom: '1px solid #e2e8f0' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {payments.length === 0 ? (
                <tr><td colSpan={5} style={{ padding: 48, textAlign: 'center', color: '#94a3b8' }}>No payments processed yet.</td></tr>
              ) : payments.map(p => (
                <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontWeight: 700, color: '#059669', fontSize: 13 }}>{p.receipt_code}</td>
                  <td style={{ padding: '12px 16px', fontWeight: 600, color: '#0f172a' }}>{p.request_code}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                    {parseFloat(p.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td style={{ padding: '12px 16px', color: '#64748b', fontSize: 12 }}>
                    {p.paid_at ? new Date(p.paid_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: '#dcfce7', color: '#166534' }}>
                      <CheckCircle size={11} /> PAID
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Toast toasts={toasts} />
    </div>
  );
}
