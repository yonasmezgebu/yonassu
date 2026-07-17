import React, { useState, useEffect, useRef } from 'react';
import apiClient from '../../services/apiClient';
import { formatCurrency } from '../../utils/formatters';

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const statusColors = {
  'Pending CEO Approval': { bg: '#fef3c7', color: '#d97706', border: '#fde68a' },
  'Approved':             { bg: '#dbeafe', color: '#1d4ed8', border: '#bfdbfe' },
  'Paid':                 { bg: '#d1fae5', color: '#059669', border: '#a7f3d0' },
  'Rejected':             { bg: '#fee2e2', color: '#dc2626', border: '#fecaca' },
};

const FinancePayrollPayments = () => {
  const [payrolls, setPayrolls]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [payForm, setPayForm]     = useState({ method: 'Bank Transfer', reference: '', notes: '' });
  const [paymentForm, setPaymentForm] = useState({});
  const [file, setFile]           = useState(null);
  const [processing, setProcessing] = useState(false);
  const [toast, setToast]         = useState(null);
  const [confirmModal, setConfirmModal] = useState(null);
  const fileRef                   = useRef();

  const fetchPayrolls = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/hr/etp/payroll/approved-list');
      setPayrolls(res?.data?.data || res?.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchPayrolls(); }, []);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleMarkPaid = async (p) => {
    if (!confirmModal) {
      setConfirmModal({
        title: 'Mark as Paid',
        message: `Mark payroll for ${MONTH_NAMES[p.month_number-1]} ${p.year_number} as PAID?`,
        payroll: p
      });
      return;
    }
    setConfirmModal(null);
    const pToMark = confirmModal.payroll || p;
    if (!payForm.method) return showToast('Please select a payment method.', 'error');
    setProcessing(true);
    try {
      const formData = new FormData();
      formData.append('month', pToMark.month_number);
      formData.append('year', pToMark.year_number);
      formData.append('payment_method', payForm.method);
      formData.append('payment_reference', payForm.reference || '');
      formData.append('notes', payForm.notes || '');
      if (file) formData.append('payment_proof', file);

      await apiClient.post(`/hr/etp/payroll/mark-paid`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      showToast('Payroll marked as paid successfully.', 'success');
      setSelectedId(null);
      setFile(null);
      setPayForm({ method: 'Bank Transfer', reference: '', notes: '' });
      fetchPayrolls();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to mark as paid', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const approved = payrolls.filter(p => p.approval_status === 'Approved');
  const history  = payrolls.filter(p => p.approval_status === 'Paid');
  const pending  = payrolls.filter(p => p.approval_status === 'Pending CEO Approval');

  return (
    <div style={{ padding: 28, fontFamily: "'Inter', sans-serif", background: '#f8fafc', minHeight: '100%' }}>
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

      {confirmModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9998,
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{ background: '#fff', padding: 24, borderRadius: 12, width: 400, boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: 18, color: '#0f172a' }}>{confirmModal.title}</h3>
            <p style={{ margin: '0 0 24px 0', color: '#475569' }}>{confirmModal.message}</p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button onClick={() => setConfirmModal(null)}
                style={{ padding: '8px 16px', background: '#e2e8f0', color: '#475569', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>
                Cancel
              </button>
              <button onClick={() => handleMarkPaid()}
                style={{ padding: '8px 16px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
        <div style={{ width: 52, height: 52, background: 'linear-gradient(135deg, #059669, #047857)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#0f172a' }}>Payroll Payments</h1>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 14 }}>Process and record monthly payroll disbursements</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
        {[
          { label: 'Awaiting CEO', count: pending.length, color: '#d97706', bg: '#fef3c7' },
          { label: 'Ready to Pay', count: approved.length, color: '#1d4ed8', bg: '#dbeafe' },
          { label: 'Paid This Year', count: history.length, color: '#059669', bg: '#d1fae5' },
        ].map(card => (
          <div key={card.label} style={{ background: '#fff', borderRadius: 12, padding: '20px 24px', border: `1px solid ${card.bg}`, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <p style={{ margin: 0, fontSize: 12, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{card.label}</p>
            <h2 style={{ margin: '8px 0 0', fontSize: 36, fontWeight: 800, color: card.color }}>{card.count}</h2>
          </div>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#64748b' }}>Loading payroll records...</div>
      ) : (
        <>
          {/* Pending CEO */}
          {pending.length > 0 && (
            <div style={{ marginBottom: 32 }}>
              <h2 style={{ fontSize: 16, color: '#d97706', fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                Awaiting CEO Approval
              </h2>
              <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #fde68a', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ background: '#fef3c7' }}>
                    <tr>
                      {['Period','Employees','Gross Pay','Net Pay','Status'].map(h => (
                        <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {pending.map(p => (
                      <tr key={`${p.month_number}-${p.year_number}`} style={{ borderTop: '1px solid #fef3c7' }}>
                        <td style={{ padding: '14px 16px', fontWeight: 600, color: '#1e293b' }}>{MONTH_NAMES[p.month_number-1]} {p.year_number}</td>
                        <td style={{ padding: '14px 16px', color: '#475569' }}>{p.total_employees}</td>
                        <td style={{ padding: '14px 16px', color: '#475569' }}>{formatCurrency(p.company_gross_pay)}</td>
                        <td style={{ padding: '14px 16px', fontWeight: 700, color: '#0f172a' }}>{formatCurrency(p.company_net_pay)}</td>
                        <td style={{ padding: '14px 16px' }}><span style={{ background: '#fef3c7', color: '#d97706', padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>Pending CEO</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Approved — Ready to Pay */}
          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 16, color: '#1d4ed8', fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
              CEO Approved — Ready to Process
            </h2>
            {approved.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', background: '#fff', borderRadius: 12, border: '1px dashed #bfdbfe', color: '#94a3b8' }}>
                No approved payrolls pending payment.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {approved.map(p => {
                  const key = `${p.month_number}-${p.year_number}`;
                  const isOpen = selectedId === key;
                  return (
                    <div key={key} style={{ background: '#fff', borderRadius: 12, border: `1px solid ${isOpen ? '#93c5fd' : '#e2e8f0'}`, overflow: 'hidden', boxShadow: isOpen ? '0 4px 16px rgba(37,99,235,0.12)' : '0 2px 8px rgba(0,0,0,0.04)', transition: 'all 0.2s' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 24px', borderBottom: isOpen ? '1px solid #e2e8f0' : 'none' }}>
                        <div style={{ display: 'flex', gap: 40, alignItems: 'center' }}>
                          <div>
                            <p style={{ margin: 0, fontSize: 12, color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Period</p>
                            <h3 style={{ margin: '4px 0 0', fontSize: 20, fontWeight: 700, color: '#0f172a' }}>{MONTH_NAMES[p.month_number-1]} {p.year_number}</h3>
                          </div>
                          <div>
                            <p style={{ margin: 0, fontSize: 12, color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Employees</p>
                            <h3 style={{ margin: '4px 0 0', fontSize: 20, color: '#334155' }}>{p.total_employees}</h3>
                          </div>
                          <div>
                            <p style={{ margin: 0, fontSize: 12, color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Net Pay</p>
                            <h3 style={{ margin: '4px 0 0', fontSize: 20, fontWeight: 700, color: '#059669' }}>{formatCurrency(p.company_net_pay)}</h3>
                          </div>
                        </div>
                        <button onClick={() => setSelectedId(isOpen ? null : key)}
                          style={{ padding: '10px 22px', background: isOpen ? '#e2e8f0' : 'linear-gradient(135deg, #059669, #047857)', color: isOpen ? '#475569' : '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 14, transition: 'all 0.2s' }}>
                          {isOpen ? 'Close' : 'Process Payment'}
                        </button>
                      </div>

                      {isOpen && (
                        <div style={{ padding: 24, background: '#f8fafc' }}>
                          <h4 style={{ margin: '0 0 16px', color: '#334155' }}>Payment Details</h4>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                            <div>
                              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Payment Method</label>
                              <select value={payForm.method} onChange={e => setPayForm(f => ({...f, method: e.target.value}))}
                                style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #d1d5db', background: '#fff', fontSize: 14 }}>
                                <option>Bank Transfer</option>
                                <option>Cash</option>
                                <option>Mobile Money</option>
                                <option>Check</option>
                              </select>
                            </div>
                            <div>
                              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Transaction Reference / ID</label>
                              <input type="text" placeholder="e.g. TXN-20240714-001" value={payForm.reference} onChange={e => setPayForm(f => ({...f, reference: e.target.value}))}
                                style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 14, boxSizing: 'border-box' }} />
                            </div>
                          </div>
                          <div style={{ marginBottom: 16 }}>
                            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Notes (Optional)</label>
                            <textarea rows={2} placeholder="e.g. Bank transfer completed via CBE" value={payForm.notes} onChange={e => setPayForm(f => ({...f, notes: e.target.value}))}
                              style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 14, resize: 'vertical', boxSizing: 'border-box' }} />
                          </div>
                          <div style={{ marginBottom: 20 }}>
                            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 8 }}>Upload Payment Proof (PDF / Image)</label>
                            <div onClick={() => fileRef.current?.click()}
                              style={{ border: '2px dashed #93c5fd', borderRadius: 10, padding: '24px', textAlign: 'center', cursor: 'pointer', background: file ? '#eff6ff' : '#fff', transition: 'all 0.2s' }}>
                              {file ? (
                                <div>
                                  <p style={{ margin: 0, color: '#1d4ed8', fontWeight: 600 }}>📎 {file.name}</p>
                                  <p style={{ margin: '4px 0 0', fontSize: 12, color: '#64748b' }}>{(file.size / 1024).toFixed(1)} KB — Click to change</p>
                                </div>
                              ) : (
                                <div>
                                  <p style={{ margin: 0, color: '#64748b' }}>📤 Click to upload receipt or bank statement</p>
                                  <p style={{ margin: '4px 0 0', fontSize: 12, color: '#94a3b8' }}>PDF, JPG, PNG accepted</p>
                                </div>
                              )}
                            </div>
                            <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display: 'none' }} onChange={e => setFile(e.target.files[0] || null)} />
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                            <button onClick={() => { setSelectedId(null); setFile(null); }}
                              style={{ padding: '10px 20px', background: '#e2e8f0', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, color: '#475569' }}>
                              Cancel
                            </button>
                            <button onClick={() => handleMarkPaid(p)} disabled={processing}
                              style={{ padding: '10px 28px', background: processing ? '#a7f3d0' : 'linear-gradient(135deg, #059669, #047857)', color: '#fff', border: 'none', borderRadius: 8, cursor: processing ? 'wait' : 'pointer', fontWeight: 700, fontSize: 14, boxShadow: '0 4px 12px rgba(5,150,105,0.3)' }}>
                              {processing ? 'Processing...' : `✓ Mark ${MONTH_NAMES[p.month_number-1]} ${p.year_number} as Paid`}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Payment History */}
          <div>
            <h2 style={{ fontSize: 16, color: '#059669', fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              Payment History
            </h2>
            {history.length === 0 ? (
              <p style={{ color: '#94a3b8' }}>No completed payroll payments yet.</p>
            ) : (
              <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #a7f3d0', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ background: '#ecfdf5' }}>
                    <tr>
                      {['Period','Employees','Gross Pay','Net Pay','Method','Paid By','Status'].map(h => (
                        <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#065f46', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {history.map(p => (
                      <tr key={`${p.month_number}-${p.year_number}`} style={{ borderTop: '1px solid #f0fdf4' }}>
                        <td style={{ padding: '14px 16px', fontWeight: 700, color: '#1e293b' }}>{MONTH_NAMES[p.month_number-1]} {p.year_number}</td>
                        <td style={{ padding: '14px 16px', color: '#475569' }}>{p.total_employees}</td>
                        <td style={{ padding: '14px 16px', color: '#475569' }}>{formatCurrency(p.company_gross_pay)}</td>
                        <td style={{ padding: '14px 16px', fontWeight: 700, color: '#059669' }}>{formatCurrency(p.company_net_pay)}</td>
                        <td style={{ padding: '14px 16px', color: '#475569', fontSize: 13 }}>{p.payment_method || 'Bank Transfer'}</td>
                        <td style={{ padding: '14px 16px', color: '#475569', fontSize: 13 }}>{p.paid_by || '—'}</td>
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{ background: '#d1fae5', color: '#065f46', padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>✓ Paid</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default FinancePayrollPayments;
