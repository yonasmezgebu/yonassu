import React, { useState, useEffect } from 'react';
import { DollarSign, Download, CheckCircle, XCircle, FileText, ArrowDownRight, ArrowUpRight, Banknote, Eye, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
import api from '../../services/apiClient';

/* ─── Shared Components from CEOFinanceApprovals ─── */
const SigPreview = ({ label, name, sig }) => (
  <div style={{ textAlign: 'center', flex: 1 }}>
    <div style={{
      height: 70, border: '1px solid #e2e8f0', borderRadius: 8,
      overflow: 'hidden', background: '#fafafa',
      display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 4
    }}>
      {sig ? <img src={sig} alt={label} style={{ maxHeight: 64, maxWidth: '100%', objectFit: 'contain' }} /> : <span style={{ color: '#cbd5e1', fontSize: 11 }}>No signature</span>}
    </div>
    <div style={{ fontSize: 12, fontWeight: 700, color: '#334155' }}>{name || '—'}</div>
    <div style={{ fontSize: 10, color: '#94a3b8' }}>{label}</div>
  </div>
);

const PCVDetailPanel = ({ pcv }) => {
  const pm = pcv.payment_method;
  return (
    <div style={{ background: '#f8fafc', borderTop: '1px solid #e2e8f0', padding: 28 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 20 }}>
        {[
          { label: 'Date', value: new Date(pcv.date).toLocaleDateString('en-GB') },
          { label: 'Amount', value: `ETB ${parseFloat(pcv.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}` },
          { label: 'Payment Method', value: pm },
          { label: 'Reference #', value: pcv.reference_no || '—' },
        ].map(({ label, value }) => (
          <div key={label}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{value}</div>
          </div>
        ))}
      </div>
      <div style={{ background: '#fefce8', border: '1px dashed #fde047', borderRadius: 10, padding: '14px 18px', marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#a16207', marginBottom: 4 }}>PAID TO</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#713f12', marginBottom: 6 }}>{pcv.paid_to}</div>
        <div style={{ fontSize: 13, color: '#78350f' }}>{pcv.description}</div>
      </div>
      {pm === 'Bank' && (
        <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, padding: '14px 18px', marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#1d4ed8', marginBottom: 8 }}>Bank Details</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 13 }}>
            <div>Bank: <b>{pcv.bank_name}</b></div>
            <div>A/C Name: <b>{pcv.account_holder}</b></div>
            <div>A/C No: <b>{pcv.account_number}</b></div>
            {pcv.cheque_no && <div>Cheque #: <b>{pcv.cheque_no}</b></div>}
          </div>
        </div>
      )}
      {pm === 'Telebirr' && (
        <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: '14px 18px', marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#b45309', marginBottom: 8 }}>Telebirr Details</div>
          <div style={{ fontSize: 13 }}>
            <div>Mobile: <b>{pcv.telebirr_number}</b></div>
            <div>Name: <b>{pcv.telebirr_name}</b></div>
          </div>
        </div>
      )}
      <div style={{ display: 'flex', gap: 16 }}>
        <SigPreview label="Prepared By" name={pcv.prepared_by} sig={pcv.prepared_signature} />
        <SigPreview label="Checked By" name={pcv.checked_by} sig={pcv.checked_signature} />
        <SigPreview label="Payee's Signature" name={pcv.receiver_name} sig={pcv.receiver_signature} />
      </div>
    </div>
  );
};

const CEOFinance = () => {
  const [activeTab, setActiveTab] = useState('Overview');
  const [activeReport, setActiveReport] = useState('Daily');
  const [ledger] = useState([
    { id: 'TXN-901', date: '2026-07-01', type: 'Sales Income', dept: 'Pharmacy', amount: 1500, direction: 'Income', ref: 'CRV-01', status: 'Completed' },
    { id: 'TXN-902', date: '2026-07-01', type: 'Supplier Payment', dept: 'Store', amount: 800, direction: 'Expense', ref: 'PV-02', status: 'Completed' },
    { id: 'TXN-903', date: '2026-07-01', type: 'Office Supplies', dept: 'Finance', amount: 50, direction: 'Expense', ref: 'PCV-01', status: 'Completed' },
  ]);

  const [funds, setFunds] = useState([
    { id: 'FR-2001', tender: 'TN-055', dept: 'Purchase', amount: 12500, supplier: 'MedEquip Ltd', status: 'PENDING' },
    { id: 'FR-2002', tender: 'TN-056', dept: 'Purchase', amount: 3400, supplier: 'AutoParts Ltd', status: 'PENDING' },
  ]);

  // PCV State
  const [pcvs, setPcvs] = useState([]);
  const [loadingPcvs, setLoadingPcvs] = useState(true);
  const [expandedPcv, setExpandedPcv] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  const [toast, setToast] = useState(null);

  const totalIncome = ledger.filter(l => l.direction === 'Income').reduce((sum, l) => sum + l.amount, 0);
  const totalExpense = ledger.filter(l => l.direction === 'Expense').reduce((sum, l) => sum + l.amount, 0);
  const profitLoss = totalIncome - totalExpense;

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadPcvs = async () => {
    setLoadingPcvs(true);
    try {
      const res = await api.get('/finance-cash/pcv/pending');
      const data = res?.data?.data || res?.data || [];
      setPcvs(Array.isArray(data) ? data.filter(p => p.status === 'pending_ceo') : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingPcvs(false);
    }
  };

  useEffect(() => { loadPcvs(); }, []);

  const handleApprovePcv = async (pcv) => {
    setActionLoading(pcv.id);
    try {
      await api.put(`/finance-cash/pcv/${pcv.id}/approve`);
      showToast(`✅ ${pcv.pcv_number} approved and sent to Finance!`, 'success');
      loadPcvs();
    } catch (e) {
      showToast('Failed to approve PCV', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectPcv = async () => {
    if (!rejectReason.trim()) return;
    setActionLoading(rejectTarget.id);
    try {
      await api.put(`/finance-cash/pcv/${rejectTarget.id}/reject`, { reason: rejectReason });
      showToast('PCV rejected. Finance has been notified.', 'error');
      loadPcvs();
      setRejectTarget(null);
      setRejectReason('');
    } catch (e) {
      showToast('Failed to reject PCV', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div style={{ padding: 32, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      {toast && (
        <div style={{
          position: 'fixed', top: 24, right: 24, zIndex: 9999,
          background: toast.type === 'error' ? '#fef2f2' : '#f0fdf4',
          border: `1px solid ${toast.type === 'error' ? '#fecaca' : '#bbf7d0'}`,
          color: toast.type === 'error' ? '#991b1b' : '#15803d',
          padding: '14px 20px', borderRadius: 10, fontWeight: 600,
          boxShadow: '0 10px 30px rgba(0,0,0,0.12)'
        }}>{toast.msg}</div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: '0 0 6px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ background: 'linear-gradient(135deg,#8b5cf6,#6d28d9)', padding: 10, borderRadius: 12, display: 'flex', boxShadow: '0 4px 10px rgba(139,92,246,.3)' }}>
              <DollarSign color="white" size={24} />
            </span>
            Finance Command Center
          </h1>
          <p style={{ color: '#64748b', margin: 0, fontSize: 15 }}>Oversee enterprise financials, reports, and pending approvals.</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          {['Overview', 'PCV Approvals', 'Fund Requests'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              style={{
                padding: '10px 20px', borderRadius: 99, fontWeight: 700, fontSize: 14, cursor: 'pointer', transition: 'all .2s',
                background: activeTab === tab ? '#0f172a' : 'white',
                color: activeTab === tab ? 'white' : '#64748b',
                border: `1px solid ${activeTab === tab ? '#0f172a' : '#e2e8f0'}`,
                boxShadow: activeTab === tab ? '0 4px 12px rgba(15,23,42,.15)' : 'none'
              }}>
              {tab}
              {tab === 'PCV Approvals' && pcvs.length > 0 && (
                <span style={{ marginLeft: 8, background: '#ef4444', color: 'white', padding: '2px 8px', borderRadius: 99, fontSize: 11 }}>{pcvs.length}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === 'Overview' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 24, marginBottom: 32 }}>
            <div style={{ background: 'white', padding: 28, borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,.05)' }}>
              <div style={{ color: '#64748b', fontSize: 14, fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}><ArrowUpRight color="#10b981"/> Total Income</div>
              <div style={{ fontSize: 36, fontWeight: 800, color: '#0f172a' }}>ETB {totalIncome.toLocaleString()}</div>
            </div>
            <div style={{ background: 'white', padding: 28, borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,.05)' }}>
              <div style={{ color: '#64748b', fontSize: 14, fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}><ArrowDownRight color="#ef4444"/> Total Expenses</div>
              <div style={{ fontSize: 36, fontWeight: 800, color: '#0f172a' }}>ETB {totalExpense.toLocaleString()}</div>
            </div>
            <div style={{ background: profitLoss >= 0 ? '#f0fdf4' : '#fef2f2', padding: 28, borderRadius: 16, border: `2px solid ${profitLoss >= 0 ? '#bbf7d0' : '#fecaca'}`, boxShadow: '0 4px 6px -1px rgba(0,0,0,.05)' }}>
              <div style={{ color: profitLoss >= 0 ? '#166534' : '#991b1b', fontSize: 14, fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                <DollarSign size={16}/> {profitLoss >= 0 ? 'NET PROFIT' : 'NET LOSS'}
              </div>
              <div style={{ fontSize: 36, fontWeight: 800, color: profitLoss >= 0 ? '#166534' : '#991b1b' }}>ETB {Math.abs(profitLoss).toLocaleString()}</div>
            </div>
          </div>

          <div style={{ background: 'white', padding: 28, borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 10 }}>
                <FileText size={20} color="#8b5cf6" /> Unified Transaction Ledger
              </h3>
              <div style={{ display: 'flex', gap: 8 }}>
                {['Daily', 'Weekly', 'Monthly'].map(r => (
                  <button key={r} onClick={() => setActiveReport(r)} style={{ padding: '6px 14px', borderRadius: 8, border: 'none', background: activeReport === r ? '#f1f5f9' : 'transparent', color: activeReport === r ? '#0f172a' : '#64748b', cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>
                    {r}
                  </button>
                ))}
                <button style={{ padding: '6px 14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontWeight: 700, fontSize: 13, color: '#0f172a', marginLeft: 8 }}>
                  <Download size={14}/> Export
                </button>
              </div>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 14 }}>
              <thead style={{ background: '#f8fafc', color: '#64748b' }}>
                <tr>
                  <th style={{ padding: '12px 16px', fontWeight: 700 }}>TXN ID</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700 }}>Date</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700 }}>Type</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700 }}>Department</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700 }}>Amount</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700 }}>Doc Ref</th>
                </tr>
              </thead>
              <tbody>
                {ledger.map(l => (
                  <tr key={l.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '16px', fontWeight: 700, color: '#0f172a' }}>{l.id}</td>
                    <td style={{ padding: '16px', color: '#475569' }}>{l.date}</td>
                    <td style={{ padding: '16px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: l.direction === 'Income' ? '#10b981' : '#ef4444', fontWeight: 600 }}>
                        {l.direction === 'Income' ? <ArrowUpRight size={14}/> : <ArrowDownRight size={14}/>} {l.type}
                      </span>
                    </td>
                    <td style={{ padding: '16px', color: '#475569' }}>{l.dept}</td>
                    <td style={{ padding: '16px', fontWeight: 700, color: '#0f172a' }}>ETB {l.amount}</td>
                    <td style={{ padding: '16px', color: '#3b82f6', fontWeight: 600, cursor: 'pointer' }}>{l.ref}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* PCV APPROVALS TAB */}
      {activeTab === 'PCV Approvals' && (
        <div style={{ animation: 'fadeIn 0.3s' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 10 }}>
              <Banknote size={22} color="#eab308" /> Pending Petty Cash Vouchers
            </h2>
            <button onClick={loadPcvs} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: 'white', border: '1px solid #e2e8f0', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
              <RefreshCw size={14} /> Refresh
            </button>
          </div>

          {loadingPcvs ? (
            <div style={{ textAlign: 'center', padding: 80, color: '#94a3b8' }}>
              <SegmentedSpinner size={32} />
              <div>Loading pending PCVs...</div>
            </div>
          ) : pcvs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 80, background: 'white', borderRadius: 16, border: '1px solid #e2e8f0' }}>
              <CheckCircle size={48} color="#22c55e" style={{ marginBottom: 16 }} />
              <h3 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', margin: '0 0 8px' }}>All Clear!</h3>
              <p style={{ color: '#64748b', margin: 0 }}>No PCV vouchers are awaiting your approval.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {pcvs.map(pcv => (
                <div key={pcv.id} style={{
                  background: 'white', borderRadius: 16, border: `2px solid ${expandedPcv === pcv.id ? '#eab308' : '#e2e8f0'}`,
                  boxShadow: expandedPcv === pcv.id ? '0 8px 20px rgba(234,179,8,.12)' : '0 2px 6px rgba(0,0,0,.04)', overflow: 'hidden', transition: 'all .2s'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', padding: '18px 24px', gap: 16 }}>
                    <div style={{ flexShrink: 0, background: '#fefce8', padding: 12, borderRadius: 12, border: '1px solid #fde047' }}>
                      <Banknote size={24} color="#eab308" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                        <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: 16, color: '#0f172a' }}>{pcv.pcv_number}</span>
                        <span style={{ background: '#fef9c3', color: '#a16207', padding: '4px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700 }}>Awaiting CEO</span>
                      </div>
                      <div style={{ display: 'flex', gap: 16, fontSize: 13, color: '#64748b' }}>
                        <span><b style={{ color: '#0f172a' }}>To:</b> {pcv.paid_to}</span>
                        <span>·</span><span>{new Date(pcv.date).toLocaleDateString('en-GB')}</span>
                        <span>·</span><span style={{ fontWeight: 800, color: '#a16207' }}>ETB {parseFloat(pcv.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
                      <button onClick={() => setExpandedPcv(expandedPcv === pcv.id ? null : pcv.id)}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 13, color: '#475569' }}>
                        <Eye size={14} /> {expandedPcv === pcv.id ? 'Hide' : 'View'}
                        {expandedPcv === pcv.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                      <button onClick={() => setRejectTarget(pcv)}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 13, color: '#dc2626' }}>
                        <XCircle size={14} /> Reject
                      </button>
                      <button onClick={() => handleApprovePcv(pcv)} disabled={actionLoading === pcv.id}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: 'linear-gradient(135deg,#22c55e,#16a34a)', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 13, color: 'white', boxShadow: '0 2px 8px rgba(34,197,94,.3)', opacity: actionLoading === pcv.id ? 0.7 : 1 }}>
                        {actionLoading === pcv.id ? <SegmentedSpinner size={14} /> : <CheckCircle size={14} />} Approve
                      </button>
                    </div>
                  </div>
                  {expandedPcv === pcv.id && <PCVDetailPanel pcv={pcv} />}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* FUND REQUESTS TAB */}
      {activeTab === 'Fund Requests' && (
        <div style={{ animation: 'fadeIn 0.3s' }}>
          <h2 style={{ margin: '0 0 20px', fontSize: 20, fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 10 }}>
            <FileText size={22} color="#3b82f6" /> Pending Fund Requests (M9)
          </h2>
          <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,.05)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 14 }}>
              <thead style={{ background: '#f8fafc', color: '#64748b' }}>
                <tr>
                  <th style={{ padding: '16px 20px', fontWeight: 700 }}>Request #</th>
                  <th style={{ padding: '16px 20px', fontWeight: 700 }}>Department</th>
                  <th style={{ padding: '16px 20px', fontWeight: 700 }}>Supplier</th>
                  <th style={{ padding: '16px 20px', fontWeight: 700 }}>Amount</th>
                  <th style={{ padding: '16px 20px', fontWeight: 700 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {funds.map(f => (
                  <tr key={f.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '16px 20px', fontWeight: 700, color: '#0f172a' }}>{f.id}</td>
                    <td style={{ padding: '16px 20px', color: '#475569' }}>{f.dept}</td>
                    <td style={{ padding: '16px 20px', color: '#475569' }}>{f.supplier}</td>
                    <td style={{ padding: '16px 20px', fontWeight: 800, color: '#0f172a' }}>ETB {f.amount.toLocaleString()}</td>
                    <td style={{ padding: '16px 20px' }}>
                      {f.status === 'PENDING' ? (
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button onClick={() => setFunds(funds.map(x => x.id === f.id ? { ...x, status: 'APPROVED' } : x))} style={{ background: '#22c55e', color: 'white', border: 'none', padding: '6px 12px', borderRadius: 6, cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <CheckCircle size={14}/> Approve
                          </button>
                        </div>
                      ) : (
                        <span style={{ color: '#16a34a', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}><CheckCircle size={14}/> Approved</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'white', borderRadius: 16, padding: 32, width: 480, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <h3 style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 800, color: '#0f172a' }}>Reject PCV</h3>
            <p style={{ margin: '0 0 20px', color: '#64748b', fontSize: 13 }}>You are rejecting <b style={{ color: '#dc2626' }}>{rejectTarget.pcv_number}</b>.</p>
            <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Reason for rejection..." rows={4} style={{ width: '100%', padding: '12px 14px', border: '2px solid #fca5a5', borderRadius: 10, boxSizing: 'border-box', fontSize: 14, outline: 'none', resize: 'vertical', fontFamily: 'Inter, sans-serif' }} />
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 20 }}>
              <button onClick={() => { setRejectTarget(null); setRejectReason(''); }} style={{ padding: '10px 20px', background: '#f1f5f9', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
              <button onClick={handleRejectPcv} disabled={!rejectReason.trim() || actionLoading === rejectTarget.id} style={{ padding: '10px 20px', background: actionLoading === rejectTarget.id || !rejectReason.trim() ? '#fca5a5' : '#dc2626', color: 'white', border: 'none', borderRadius: 8, cursor: !rejectReason.trim() ? 'not-allowed' : 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                {actionLoading === rejectTarget.id ? <SegmentedSpinner size={16} /> : <XCircle size={16} />} Reject
              </button>
            </div>
          </div>
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } } @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  );
};

export default CEOFinance;
