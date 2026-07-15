import React, { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';
import { formatCurrency } from '../../utils/formatters';
import styles from './HREmployees.module.css';

const HRPayrollDashboard = () => {
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [summary, setSummary] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [toast, setToast] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null);

  const fetchPayroll = async () => {
    setLoading(true);
    setSummary(null);
    setEmployees([]);
    try {
      const res = await apiClient.get(`/hr/etp/payroll/summary/${month}/${year}`);
      // apiClient interceptor returns response.data directly, so res IS the JSON body
      console.log('[Payroll] response:', res);
      const payload = res?.data || res; // handle both wrapped and unwrapped
      if (payload) {
        const s = payload.payrollSummary || payload.company;
        const e = payload.employees || [];
        console.log('[Payroll] summary:', s, 'employees count:', e.length);
        setSummary(s);
        setEmployees(e);
      }
    } catch (err) {
      console.error('[Payroll] fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayroll();
  }, [month, year]);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Separated confirm handlers — no double-click pattern
  const handleCalculate = () => {
    setConfirmModal({
      title: 'Calculate Payroll',
      message: `Calculate payroll for ${month}/${year}? This will overwrite any current draft data.`,
      onConfirm: async () => {
        setConfirmModal(null);
        setCalculating(true);
        try {
          await apiClient.post('/hr/etp/payroll/calculate', { month, year });
          showToast('Payroll calculated successfully!');
          await fetchPayroll();
        } catch (err) {
          showToast(err.response?.data?.message || 'Failed to calculate payroll', 'error');
        } finally {
          setCalculating(false);
        }
      }
    });
  };

  const handleSubmit = () => {
    if (!summary) return;
    setConfirmModal({
      title: 'Submit Payroll',
      message: 'Submit this payroll to the CEO for approval?',
      onConfirm: async () => {
        setConfirmModal(null);
        setSubmitting(true);
        try {
          await apiClient.post('/hr/etp/payroll/submit', { month, year });
          showToast('Payroll submitted for CEO approval!');
          await fetchPayroll();
        } catch (err) {
          showToast(err.response?.data?.message || 'Failed to submit payroll', 'error');
        } finally {
          setSubmitting(false);
        }
      }
    });
  };

  const isEditable = !summary || summary.approval_status === 'Draft' || summary.approval_status === 'Rejected';
  const statusColor = (s) => {
    switch (s) {
      case 'Draft': return '#6b7280';
      case 'Pending CEO Approval': return '#d97706';
      case 'Approved': return '#2563eb';
      case 'Paid': return '#059669';
      case 'Rejected': return '#dc2626';
      default: return '#6b7280';
    }
  };

  return (
    <div className={styles.container}>
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
              <button onClick={() => confirmModal.onConfirm()}
                style={{ padding: '8px 16px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={styles.header}>
        <div>
          <h1 className={styles.pageTitle}>Monthly Payroll</h1>
          <p className={styles.pageSubtitle}>Prepare and manage monthly salary sheets</p>
        </div>
        
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <select value={month} onChange={e => setMonth(Number(e.target.value))} style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #d1d5db', outline: 'none' }}>
            {Array.from({length: 12}, (_, i) => i + 1).map(m => (
              <option key={m} value={m}>{new Date(2000, m - 1).toLocaleString('default', { month: 'long' })}</option>
            ))}
          </select>
          <input type="number" value={year} onChange={e => setYear(Number(e.target.value))} style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #d1d5db', outline: 'none', width: 90 }} />
          <button onClick={fetchPayroll} style={{ padding: '8px 16px', background: '#e5e7eb', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600, color: '#374151' }}>
            Load
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '20px 0' }}>
        <div style={{ display: 'flex', gap: 24 }}>
          <div style={{ padding: '16px 24px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, minWidth: 150 }}>
            <p style={{ margin: 0, fontSize: 13, color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Status</p>
            <h2 style={{ margin: '4px 0 0', fontSize: 18, color: statusColor(summary?.approval_status || 'Draft') }}>
              {summary ? summary.approval_status : 'Not Generated'}
            </h2>
          </div>
          <div style={{ padding: '16px 24px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, minWidth: 150 }}>
            <p style={{ margin: 0, fontSize: 13, color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Total Net Pay</p>
            <h2 style={{ margin: '4px 0 0', fontSize: 24, color: '#0f172a' }}>
              {summary ? formatCurrency(summary.company_net_pay) : '—'}
            </h2>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          {isEditable && (
            <>
              <button onClick={handleCalculate} disabled={calculating}
                style={{ padding: '10px 20px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>
                {calculating ? 'Calculating...' : 'Calculate Payroll'}
              </button>
              {summary && (
                <button onClick={handleSubmit} disabled={submitting}
                  style={{ padding: '10px 20px', background: '#10b981', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>
                  {submitting ? 'Submitting...' : 'Submit to CEO'}
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {summary && summary.rejection_reason && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '12px 16px', borderRadius: 8, marginBottom: 20 }}>
          <strong style={{ color: '#991b1b' }}>CEO Feedback: </strong>
          <span style={{ color: '#b91c1c' }}>{summary.rejection_reason}</span>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>Loading payroll data...</div>
      ) : employees.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, background: '#f9fafb', borderRadius: 12, border: '1px dashed #d1d5db', color: '#6b7280' }}>
          <p style={{ fontSize: 16 }}>No payroll data generated for {month}/{year}.</p>
          {isEditable && <p>Click "Calculate Payroll" to draft the salary sheet.</p>}
        </div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Employee Name</th>
                <th style={{textAlign:'right'}}>Base Salary</th>
                <th style={{textAlign:'right'}}>Allowances</th>
                <th style={{textAlign:'right'}}>Overtime/Bonus</th>
                <th style={{textAlign:'right'}}>Deductions (Tax/Pen/Abs)</th>
                <th style={{textAlign:'right'}}>Net Pay</th>
              </tr>
            </thead>
            <tbody>
              {employees.map(emp => {
                const totalAllowances = Number(emp.housing_allowance) + Number(emp.transport_allowance) + Number(emp.communication_allowance);
                const totalExtras = Number(emp.overtime_pay) + Number(emp.bonus_pay);
                const totalDeductions = Number(emp.deduction_absent) + Number(emp.deduction_loan) + Number(emp.deduction_tax) + Number(emp.deduction_pension);
                return (
                  <tr key={emp.employee_id}>
                    <td className={styles.idCell}>{emp.employee_id}</td>
                    <td className={styles.nameCell}>{emp.full_name}</td>
                    <td style={{textAlign:'right'}}>{formatCurrency(emp.base_salary)}</td>
                    <td style={{textAlign:'right', color: '#059669'}}>+{formatCurrency(totalAllowances)}</td>
                    <td style={{textAlign:'right', color: '#059669'}}>+{formatCurrency(totalExtras)}</td>
                    <td style={{textAlign:'right', color: '#dc2626'}}>-{formatCurrency(totalDeductions)}</td>
                    <td style={{textAlign:'right'}}><strong>{formatCurrency(emp.net_pay)}</strong></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default HRPayrollDashboard;
