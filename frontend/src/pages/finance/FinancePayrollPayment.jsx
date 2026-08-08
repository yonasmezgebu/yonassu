import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../../services/apiClient';
import { formatCurrency } from '../../utils/formatters';
import SegmentedSpinner from '../../components/ui/SegmentedSpinner';
import {
  AlertTriangle, CheckCircle, Clock, DollarSign,
  RefreshCw, CreditCard, Upload, ChevronDown, ChevronUp, Users
} from 'lucide-react';

const monthName = (m) => new Date(2000, parseInt(m) - 1).toLocaleString('default', { month: 'long' });

const StatusBadge = ({ status }) => {
  const map = {
    'Pending Payment': { bg: '#FEF3C7', color: '#92400E', dot: '#D97706' },
    'Paid':            { bg: '#DCFCE7', color: '#065F46', dot: '#16A34A' },
  };
  const s = map[status] || map['Pending Payment'];
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 10px', borderRadius: 9999, fontSize: 12, fontWeight: 600, background: s.bg, color: s.color }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.dot, display: 'inline-block' }} />
      {status}
    </span>
  );
};

const FinancePayrollPayment = () => {
  const [queue, setQueue]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [expanded, setExpanded]     = useState(null);
  const [detail, setDetail]         = useState({});
  const [loadingDetail, setLoadingDetail] = useState(null);
  const [payModal, setPayModal]     = useState(null);
  const [payMethod, setPayMethod]   = useState('Bank Transfer');
  const [proofFile, setProofFile]   = useState(null);
  const [paying, setPaying]         = useState(false);
  const [toast, setToast]           = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 5000);
  };

  const fetchQueue = useCallback(async () => {
    setLoading(true);
    try {
      // Try the dedicated finance queue first, fall back to approved-list
      let rows = [];
      try {
        const res = await apiClient.get('/hr/etp/payroll/finance-queue');
        rows = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
      } catch {
        const res2 = await apiClient.get('/hr/etp/payroll/approved-list');
        const all = Array.isArray(res2?.data) ? res2.data : (Array.isArray(res2) ? res2 : []);
        rows = all.filter(p => p.approval_status === 'Approved' || p.approval_status === 'Paid')
          .map(p => ({
            month_number: p.month_number,
            year_number: p.year_number,
            total_net_pay: p.company_net_pay,
            total_employees: p.total_employees,
            approved_by_ceo: p.approved_by,
            ceo_approved_date: p.approved_date,
            payment_status: p.approval_status === 'Paid' ? 'Paid' : 'Pending Payment',
            paid_date: p.paid_date,
            paid_by: p.paid_by,
            payment_method: p.payment_method,
          }));
      }
      setQueue(rows);
    } catch (e) {
      showToast('Failed to load payroll queue', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchQueue(); }, [fetchQueue]);

  const loadDetail = async (row) => {
    const key = `${row.month_number}-${row.year_number}`;
    if (expanded === key) { setExpanded(null); return; }
    setExpanded(key);
    if (detail[key]) return;
    setLoadingDetail(key);
    try {
      const res = await apiClient.get(`/hr/etp/payroll/summary/${row.month_number}/${row.year_number}`);
      const d = res?.data || res;
      setDetail(prev => ({ ...prev, [key]: d.employees || [] }));
    } catch { showToast('Failed to load breakdown', 'error'); }
    finally { setLoadingDetail(null); }
  };

  const handlePay = async () => {
    if (!payModal) return;
    setPaying(true);
    try {
      const form = new FormData();
      form.append('month', payModal.month_number);
      form.append('year', payModal.year_number);
      form.append('payment_method', payMethod);
      if (proofFile) form.append('payment_proof', proofFile);

      await apiClient.post('/hr/etp/payroll/mark-paid', form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      showToast(`✅ Payroll for ${monthName(payModal.month_number)} ${payModal.year_number} marked as PAID — expense recorded, HR notified.`, 'success');
      setPayModal(null); setProofFile(null); setPayMethod('Bank Transfer');
      setDetail({}); setExpanded(null);
      fetchQueue();
    } catch (err) {
      showToast(err?.response?.data?.message || 'Payment failed', 'error');
    } finally {
      setPaying(false);
    }
  };

  const pending = queue.filter(q => q.payment_status === 'Pending Payment');
  const paid    = queue.filter(q => q.payment_status === 'Paid');
  const totalPending = pending.reduce((s, q) => s + parseFloat(q.total_net_pay || 0), 0);

  return (
    <div style={{ fontFamily: "'Inter','Segoe UI',sans-serif", color: '#111827' }}>

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', top: 20, right: 24, zIndex: 9999, background: toast.type === 'success' ? '#16A34A' : '#DC2626', color: '#fff', padding: '12px 20px', borderRadius: 8, fontSize: 14, fontWeight: 500, boxShadow: '0 4px 16px rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', gap: 8, maxWidth: 480 }}>
          {toast.type === 'success' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Payroll Payment Queue</h1>
          <p style={{ color: '#6B7280', fontSize: 14, margin: '4px 0 0' }}>Process payroll payments approved by CEO — payments auto-record as expenses</p>
        </div>
        <button onClick={fetchQueue} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Alert Banner — Pending items */}
      {pending.length > 0 && (
        <div style={{ background: '#FEF3C7', border: '1px solid #FDE68A', borderLeft: '4px solid #D97706', borderRadius: 8, padding: '14px 18px', marginBottom: 24, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <AlertTriangle size={20} color="#D97706" style={{ flexShrink: 0, marginTop: 1 }} />
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#92400E' }}>
              ⚠️ {pending.length} Payroll{pending.length > 1 ? 's' : ''} Ready for Payment
            </div>
            <div style={{ fontSize: 13, color: '#92400E', marginTop: 4 }}>
              Total pending: <strong>{formatCurrency(totalPending)}</strong> — approved by CEO, awaiting Finance disbursement. Click <strong>"Mark as Paid"</strong> after processing payment.
            </div>
          </div>
        </div>
      )}

      {/* KPI Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 1, background: '#E5E7EB', border: '1px solid #E5E7EB', borderRadius: 10, overflow: 'hidden', marginBottom: 24 }}>
        {[
          { label: 'Pending Payment', value: pending.length,              icon: <Clock size={20} color="#D97706" />, bg: '#FFFBEB' },
          { label: 'Paid',            value: paid.length,                 icon: <CheckCircle size={20} color="#16A34A" />, bg: '#F0FDF4' },
          { label: 'Pending Value',   value: formatCurrency(totalPending), icon: <DollarSign size={20} color="#2563EB" />, bg: '#EFF6FF' },
          { label: 'Total Employees', value: pending.reduce((s,q) => s + parseInt(q.total_employees||0), 0), icon: <Users size={20} color="#7C3AED" />, bg: '#FAF5FF' },
        ].map((k, i) => (
          <div key={i} style={{ background: k.bg, padding: '18px 22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              {k.icon}
              <span style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{k.label}</span>
            </div>
            <div style={{ fontSize: 20, fontWeight: 700 }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Queue List */}
      {loading ? (
        <div style={{ padding: 60 }}>
          <SegmentedSpinner size={52} center label="Loading payment queue…" />
        </div>
      ) : queue.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, background: '#fff', border: '1px solid #E5E7EB', borderRadius: 10, color: '#6B7280' }}>
          <CheckCircle size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
          <p style={{ fontWeight: 600, fontSize: 16 }}>No payrolls awaiting payment</p>
          <p style={{ fontSize: 14 }}>When the CEO approves payrolls they will appear here automatically.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {queue.map(row => {
            const key = `${row.month_number}-${row.year_number}`;
            const isPending = row.payment_status === 'Pending Payment';
            const isExp = expanded === key;
            const emps = detail[key];
            return (
              <div key={key} style={{ background: '#fff', border: `1px solid ${isPending ? '#FDE68A' : '#E5E7EB'}`, borderRadius: 10, overflow: 'hidden', boxShadow: isPending ? '0 0 0 2px #FEF3C7' : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', flexWrap: 'wrap' }}>
                  <div style={{ flex: '1 1 160px' }}>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{monthName(row.month_number)} {row.year_number}</div>
                    <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>{row.total_employees} employees • CEO: {row.approved_by_ceo || '—'}</div>
                  </div>
                  <div style={{ flex: '1 1 120px', textAlign: 'right' }}>
                    <div style={{ fontSize: 12, color: '#6B7280' }}>Net Payroll</div>
                    <div style={{ fontWeight: 700, fontSize: 16 }}>{formatCurrency(row.total_net_pay)}</div>
                  </div>
                  <div style={{ flex: '0 0 auto' }}><StatusBadge status={row.payment_status} /></div>
                  {row.payment_status === 'Paid' && (
                    <div style={{ fontSize: 12, color: '#6B7280' }}>
                      Paid by {row.paid_by} · {row.payment_method}
                    </div>
                  )}
                  {isPending && (
                    <button
                      onClick={() => setPayModal(row)}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', background: '#16A34A', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                    >
                      <CreditCard size={14} /> Mark as Paid
                    </button>
                  )}
                  <button onClick={() => loadDetail(row)} style={{ background: 'none', border: '1px solid #E5E7EB', borderRadius: 6, padding: '6px 10px', cursor: 'pointer', color: '#6B7280', display: 'flex', alignItems: 'center', gap: 4 }}>
                    {isExp ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    <span style={{ fontSize: 12 }}>Breakdown</span>
                  </button>
                </div>

                {isExp && (
                  <div style={{ borderTop: '1px solid #E5E7EB', padding: '16px 20px', background: '#FAFAFA' }}>
                    {loadingDetail === key ? (
                      <div style={{ padding: 24 }}><SegmentedSpinner size={36} center label="Loading breakdown…" /></div>
                    ) : emps ? (
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                          <thead>
                            <tr style={{ background: '#F3F4F6' }}>
                              {['#', 'Employee', 'Base', 'Allowances', 'Extras', 'Deductions', 'Net Pay'].map(h => (
                                <th key={h} style={{ padding: '10px 12px', textAlign: h === '#' || h === 'Employee' ? 'left' : 'right', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#6B7280', borderBottom: '1px solid #E5E7EB' }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {emps.map((e, idx) => {
                              const allow  = parseFloat(e.housing_allowance||0)+parseFloat(e.transport_allowance||0)+parseFloat(e.communication_allowance||0);
                              const extra  = parseFloat(e.overtime_pay||0)+parseFloat(e.bonus_pay||0);
                              const deduct = parseFloat(e.deduction_absent||0)+parseFloat(e.deduction_loan||0)+parseFloat(e.deduction_tax||0)+parseFloat(e.deduction_pension||0);
                              return (
                                <tr key={e.employee_id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                                  <td style={{ padding: '10px 12px', color: '#9CA3AF', fontSize: 12 }}>{idx+1}</td>
                                  <td style={{ padding: '10px 12px' }}><div style={{ fontWeight: 600 }}>{e.full_name}</div><div style={{ fontSize: 11, color: '#9CA3AF' }}>#{e.employee_id}</div></td>
                                  <td style={{ padding: '10px 12px', textAlign: 'right' }}>{formatCurrency(e.base_salary)}</td>
                                  <td style={{ padding: '10px 12px', textAlign: 'right', color: '#16A34A' }}>{allow > 0 ? `+${formatCurrency(allow)}` : '—'}</td>
                                  <td style={{ padding: '10px 12px', textAlign: 'right', color: '#0284C7' }}>{extra > 0 ? `+${formatCurrency(extra)}` : '—'}</td>
                                  <td style={{ padding: '10px 12px', textAlign: 'right', color: '#DC2626' }}>{deduct > 0 ? `-${formatCurrency(deduct)}` : '—'}</td>
                                  <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700 }}>{formatCurrency(e.net_pay)}</td>
                                </tr>
                              );
                            })}
                            <tr style={{ background: '#F9FAFB', borderTop: '2px solid #E5E7EB' }}>
                              <td colSpan={2} style={{ padding: '12px', fontWeight: 700, fontSize: 12, color: '#6B7280', textTransform: 'uppercase' }}>Total ({emps.length})</td>
                              <td style={{ padding: '12px', textAlign: 'right', fontWeight: 700 }}>{formatCurrency(emps.reduce((s,e)=>s+parseFloat(e.base_salary||0),0))}</td>
                              <td style={{ padding: '12px', textAlign: 'right', fontWeight: 700, color: '#16A34A' }}>{formatCurrency(emps.reduce((s,e)=>s+parseFloat(e.housing_allowance||0)+parseFloat(e.transport_allowance||0)+parseFloat(e.communication_allowance||0),0))}</td>
                              <td style={{ padding: '12px', textAlign: 'right', fontWeight: 700, color: '#0284C7' }}>{formatCurrency(emps.reduce((s,e)=>s+parseFloat(e.overtime_pay||0)+parseFloat(e.bonus_pay||0),0))}</td>
                              <td style={{ padding: '12px', textAlign: 'right', fontWeight: 700, color: '#DC2626' }}>{formatCurrency(emps.reduce((s,e)=>s+parseFloat(e.deduction_absent||0)+parseFloat(e.deduction_loan||0)+parseFloat(e.deduction_tax||0)+parseFloat(e.deduction_pension||0),0))}</td>
                              <td style={{ padding: '12px', textAlign: 'right', fontWeight: 700, fontSize: 15, color: '#16A34A' }}>{formatCurrency(emps.reduce((s,e)=>s+parseFloat(e.net_pay||0),0))}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pay Modal */}
      {payModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 28, width: '100%', maxWidth: 480, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 700, color: '#111827' }}>
              <CreditCard size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} />
              Process Payroll Payment
            </h3>
            <p style={{ color: '#6B7280', fontSize: 14, margin: '0 0 20px' }}>
              <strong>{monthName(payModal.month_number)} {payModal.year_number}</strong> — <strong>{formatCurrency(payModal.total_net_pay)}</strong> for <strong>{payModal.total_employees}</strong> employees.
            </p>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 6 }}>Payment Method</label>
              <select
                value={payMethod}
                onChange={e => setPayMethod(e.target.value)}
                style={{ width: '100%', height: 36, padding: '0 10px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 14, background: '#fff' }}
              >
                <option>Bank Transfer</option>
                <option>Cash</option>
                <option>Cheque</option>
                <option>Mobile Banking</option>
              </select>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 13, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 6 }}>
                <Upload size={13} style={{ marginRight: 4, verticalAlign: 'middle' }} />Payment Proof (optional)
              </label>
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={e => setProofFile(e.target.files[0])}
                style={{ width: '100%', fontSize: 13, padding: '6px 0' }}
              />
              {proofFile && <div style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>📎 {proofFile.name}</div>}
            </div>

            <div style={{ background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: 8, padding: '10px 14px', marginBottom: 20, fontSize: 13, color: '#92400E' }}>
              ⚠️ Confirming this will: <strong>mark payroll as Paid</strong>, auto-record a <strong>Finance expense entry</strong>, and send an <strong>HR notification</strong>.
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button onClick={() => { setPayModal(null); setProofFile(null); }} style={{ padding: '9px 18px', background: '#F3F4F6', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>Cancel</button>
              <button onClick={handlePay} disabled={paying} style={{ padding: '9px 20px', background: '#16A34A', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: paying ? 'not-allowed' : 'pointer', opacity: paying ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: 6 }}>
                <CreditCard size={14} />
                {paying ? 'Processing…' : 'Confirm Payment'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default FinancePayrollPayment;
