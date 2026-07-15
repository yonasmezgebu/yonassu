import React, { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';
import { formatCurrency } from '../../utils/formatters';
import { Banknote, Users, CheckCircle, XCircle } from 'lucide-react';
import styles from './CEOHRDashboard.module.css';

const CEOPayrollDashboard = () => {
  const [payrolls, setPayrolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectingId, setRejectingId] = useState(null);
  const [toast, setToast] = useState(null);

  const fetchPayrolls = async () => {
    setLoading(true);
    try {
      // Get all approved or pending payrolls - wait, getApprovedPayrolls gives us payrolls. But maybe we need a dedicated endpoint?
      // Actually, we can fetch all payroll_company_aggregation directly, or use existing summary?
      // Wait, there's no endpoint for "get all pending CEO approvals" for payroll.
      // Let's use getApprovedPayrolls but maybe it only returns 'Approved'. 
      // I'll need to fetch them. If getApprovedPayrolls is strictly "Approved", I need a new endpoint.
      // Wait, I can use the existing /hr/etp/payroll/approved-list if I modify it to return all, OR I can just build a new endpoint.
      // Actually, the user asked me to use existing. Let me check what `/hr/etp/payroll/approved-list` returns.
      // If it only returns Approved, I'll update it to return all non-drafts.
      const res = await apiClient.get('/hr/etp/payroll/approved-list');
      setPayrolls(res.data?.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPayrolls(); }, []);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleAction = async (month, year, action) => {
    if (action === 'reject' && !rejectReason) {
      showToast('Please enter a rejection reason.', 'error');
      return;
    }
    setProcessing(`${month}-${year}`);
    try {
      await apiClient.post('/hr/etp/payroll/approve', { 
        month, year, action, reason: rejectReason 
      });
      showToast(`Payroll ${action === 'approve' ? 'approved' : 'rejected'} successfully!`);
      setRejectingId(null);
      setRejectReason('');
      fetchPayrolls();
    } catch (err) {
      showToast(err.response?.data?.message || `Failed to ${action} payroll`, 'error');
    } finally {
      setProcessing(null);
    }
  };

  const pending = payrolls.filter(p => p.approval_status === 'Pending CEO Approval');
  const history = payrolls.filter(p => p.approval_status !== 'Pending CEO Approval' && p.approval_status !== 'Draft');

  return (
    <div style={{ padding: 24, fontFamily: "'Inter', sans-serif" }}>
      {toast && (
        <div style={{
          position: 'fixed', top: 20, right: 20, zIndex: 9999,
          background: toast.type === 'success' ? '#10b981' : '#ef4444',
          color: '#fff', padding: '12px 20px', borderRadius: 8,
          fontWeight: 600, boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
        }}>
          {toast.msg}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
        <div style={{ padding: 12, background: '#fef3c7', borderRadius: 12, color: '#d97706' }}>
          <Banknote size={28} />
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, color: '#0f172a' }}>Payroll Approvals</h1>
          <p style={{ margin: '4px 0 0', color: '#64748b' }}>Review and approve monthly salary sheets</p>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>Loading payroll requests...</div>
      ) : (
        <>
          <h2 style={{ fontSize: 18, color: '#334155', marginBottom: 16 }}>Pending Your Approval</h2>
          {pending.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', background: '#f8fafc', borderRadius: 12, border: '1px dashed #cbd5e1', color: '#94a3b8', marginBottom: 40 }}>
              No payrolls pending approval.
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 20, marginBottom: 40 }}>
              {pending.map(p => (
                <div key={`${p.month_number}-${p.year_number}`} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                  <div style={{ padding: '16px 24px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: 18, color: '#0f172a' }}>Payroll for {p.month_number}/{p.year_number}</h3>
                      <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>Submitted for review</p>
                    </div>
                    <div style={{ background: '#fef3c7', color: '#d97706', padding: '6px 12px', borderRadius: 20, fontSize: 13, fontWeight: 600 }}>
                      Pending Approval
                    </div>
                  </div>
                  
                  <div style={{ padding: 24, display: 'flex', gap: 40, flexWrap: 'wrap' }}>
                    <div>
                      <p style={{ margin: 0, fontSize: 12, color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Total Employees</p>
                      <p style={{ margin: '4px 0 0', fontSize: 24, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Users size={20} color="#3b82f6" /> {p.total_employees}
                      </p>
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: 12, color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Total Gross Pay</p>
                      <p style={{ margin: '4px 0 0', fontSize: 24, color: '#0f172a' }}>{formatCurrency(p.company_gross_pay)}</p>
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: 12, color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Total Deductions</p>
                      <p style={{ margin: '4px 0 0', fontSize: 24, color: '#dc2626' }}>{formatCurrency(p.total_deductions)}</p>
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: 12, color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Total Net Pay</p>
                      <p style={{ margin: '4px 0 0', fontSize: 24, color: '#059669', fontWeight: 700 }}>{formatCurrency(p.company_net_pay)}</p>
                    </div>
                  </div>

                  <div style={{ padding: '16px 24px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                    {rejectingId === `${p.month_number}-${p.year_number}` ? (
                      <div style={{ display: 'flex', gap: 8, width: '100%', alignItems: 'center' }}>
                        <input type="text" placeholder="Reason for rejection..." value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                          style={{ flex: 1, padding: '10px 14px', borderRadius: 6, border: '1px solid #cbd5e1' }} />
                        <button onClick={() => handleAction(p.month_number, p.year_number, 'reject')} disabled={processing}
                          style={{ padding: '10px 20px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>
                          {processing ? 'Rejecting...' : 'Confirm Reject'}
                        </button>
                        <button onClick={() => { setRejectingId(null); setRejectReason(''); }}
                          style={{ padding: '10px 20px', background: '#e2e8f0', color: '#475569', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <>
                        <button onClick={() => setRejectingId(`${p.month_number}-${p.year_number}`)} disabled={processing}
                          style={{ padding: '10px 20px', background: '#fff', color: '#dc2626', border: '1px solid #dc2626', borderRadius: 6, cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <XCircle size={18} /> Reject
                        </button>
                        <button onClick={() => handleAction(p.month_number, p.year_number, 'approve')} disabled={processing}
                          style={{ padding: '10px 24px', background: '#059669', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <CheckCircle size={18} /> Approve Payroll
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <h2 style={{ fontSize: 18, color: '#334155', marginBottom: 16 }}>Approval History</h2>
          {history.length === 0 ? (
            <div style={{ color: '#94a3b8' }}>No past payroll approvals found.</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: 8, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <thead style={{ background: '#f1f5f9' }}>
                <tr>
                  <th style={{ padding: '12px 16px', textAlign: 'left', color: '#475569', fontSize: 13, borderBottom: '1px solid #e2e8f0' }}>Period</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', color: '#475569', fontSize: 13, borderBottom: '1px solid #e2e8f0' }}>Employees</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right', color: '#475569', fontSize: 13, borderBottom: '1px solid #e2e8f0' }}>Net Pay</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', color: '#475569', fontSize: 13, borderBottom: '1px solid #e2e8f0' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {history.map(p => (
                  <tr key={`${p.month_number}-${p.year_number}`} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px 16px', color: '#0f172a', fontWeight: 500 }}>{p.month_number}/{p.year_number}</td>
                    <td style={{ padding: '12px 16px', color: '#475569' }}>{p.total_employees}</td>
                    <td style={{ padding: '12px 16px', color: '#0f172a', textAlign: 'right', fontWeight: 600 }}>{formatCurrency(p.company_net_pay)}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ 
                        padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                        background: p.approval_status === 'Approved' ? '#d1fae5' : (p.approval_status === 'Paid' ? '#ecfdf5' : '#fee2e2'),
                        color: p.approval_status === 'Approved' ? '#059669' : (p.approval_status === 'Paid' ? '#047857' : '#b91c1c')
                      }}>
                        {p.approval_status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}
    </div>
  );
};

export default CEOPayrollDashboard;
