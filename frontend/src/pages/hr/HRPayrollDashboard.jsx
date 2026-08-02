import React, { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';
import { formatCurrency } from '../../utils/formatters';
import styles from './HRPayrollDashboard.module.css';

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
      const payload = res?.data || res; 
      if (payload) {
        const s = payload.payrollSummary || payload.company;
        const e = payload.employees || [];
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

  const handleClear = () => {
    setSummary(null);
    setEmployees([]);
  };

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

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

  return (
    <div className={styles.container}>
      
      {/* ── NOTIFICATIONS ── */}
      {toast && (
        <div className={`${styles.toast} ${toast.type === 'success' ? styles.toastSuccess : styles.toastError}`}>
          {toast.msg}
        </div>
      )}

      {/* ── MODAL ── */}
      {confirmModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3>{confirmModal.title}</h3>
            <p>{confirmModal.message}</p>
            <div className={styles.modalActions}>
              <button className={styles.modalCancelBtn} onClick={() => setConfirmModal(null)}>
                Cancel
              </button>
              <button className={styles.modalConfirmBtn} onClick={() => confirmModal.onConfirm()}>
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── HEADER ── */}
      <div className={styles.header}>
        <div className={styles.topRow}>
          <div>
            <div className={styles.badge}>
              <span className={styles.badgeDot} />
              <span className={styles.badgeTxt}>Finance · Payroll</span>
            </div>
            <h1 className={styles.pageTitle}>
              Monthly <span>Payroll</span>
            </h1>
            <p className={styles.pageSubtitle}>
              Prepare, calculate, and submit monthly salary sheets for CEO approval.
            </p>
          </div>

          <div className={styles.controls}>
            <select value={month} onChange={e => setMonth(Number(e.target.value))}>
              {Array.from({length: 12}, (_, i) => i + 1).map(m => (
                <option key={m} value={m}>
                  {new Date(2000, m - 1).toLocaleString('default', { month: 'long' })}
                </option>
              ))}
            </select>
            <input type="number" value={year} onChange={e => setYear(Number(e.target.value))} />
            <button className={styles.loadBtn} onClick={fetchPayroll}>
              Load
            </button>
            <button className={styles.clearBtn} onClick={handleClear}>
              Clear
            </button>
          </div>
        </div>

        {/* ── METRICS ROW ── */}
        <div className={styles.metricsRow}>
          <div className={styles.metric}>
            <div className={styles.metricLbl}>Approval Status</div>
            <div className={styles.statusIndicator}>
              <span className={styles.statusDot} style={{
                background: summary?.approval_status === 'Approved' ? '#4CAF50' : summary?.approval_status === 'Pending CEO Approval' ? '#FF9800' : '#8D6E63'
              }} />
              <span className={styles.statusTxt}>
                {summary ? summary.approval_status : 'Not Generated'}
              </span>
            </div>
          </div>

          <div className={styles.metric}>
            <div className={styles.metricLbl}>Total Net Pay</div>
            <div className={styles.metricValNet}>
              {summary ? formatCurrency(summary.company_net_pay) : '—'} <span>ETB</span>
            </div>
          </div>

          <div className={styles.actionsMetric}>
            {isEditable && (
              <>
                <button className={styles.calcBtn} onClick={handleCalculate} disabled={calculating}>
                  {calculating ? 'Calculating...' : 'Calculate Payroll'}
                </button>
                {summary && (
                  <button className={styles.submitBtn} onClick={handleSubmit} disabled={submitting}>
                    {submitting ? 'Submitting...' : 'Submit to CEO'}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      
      {/* ── MAIN BODY ── */}
      <div className={styles.bodyArea}>
        
        {summary && summary.rejection_reason && (
          <div className={styles.feedback}>
            <strong>CEO Feedback: </strong>
            <span>{summary.rejection_reason}</span>
          </div>
        )}

        {loading ? (
          <div className={styles.loading}>● Loading payroll data...</div>
        ) : employees.length === 0 ? (
          <div className={styles.empty}>
            <p>No payroll data generated for {month}/{year}.</p>
            {isEditable && <p style={{ fontSize: '12px', marginTop: '8px' }}>Click "Calculate Payroll" to draft the salary sheet.</p>}
          </div>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th className={styles.right}>Base Salary</th>
                  <th className={styles.right}>Allowances</th>
                  <th className={styles.right}>Extras</th>
                  <th className={styles.right}>Deductions</th>
                  <th className={styles.right}>Net Pay</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((emp) => {
                  const totalAllowances = Number(emp.housing_allowance || 0) + Number(emp.transport_allowance || 0) + Number(emp.communication_allowance || 0);
                  const totalExtras = Number(emp.overtime_pay || 0) + Number(emp.bonus_pay || 0);
                  const totalDeductions = Number(emp.deduction_absent || 0) + Number(emp.deduction_loan || 0) + Number(emp.deduction_tax || 0) + Number(emp.deduction_pension || 0);
                  
                  return (
                    <tr key={emp.employee_id}>
                      <td>
                        <div className={styles.empName}>{emp.full_name}</div>
                        <div className={styles.empId}>#{emp.employee_id}</div>
                      </td>
                      <td className={styles.right}>
                        <span className={styles.valBase}>{formatCurrency(emp.base_salary)}</span>
                      </td>
                      <td className={styles.right}>
                        <span className={styles.valPlus}>{totalAllowances > 0 ? `+${formatCurrency(totalAllowances)}` : '—'}</span>
                      </td>
                      <td className={styles.right}>
                        <span className={styles.valExtra}>{totalExtras > 0 ? `+${formatCurrency(totalExtras)}` : '—'}</span>
                      </td>
                      <td className={styles.right}>
                        <span className={styles.valMinus}>{totalDeductions > 0 ? `-${formatCurrency(totalDeductions)}` : '—'}</span>
                      </td>
                      <td className={styles.right}>
                        <span className={styles.valNet}>{formatCurrency(emp.net_pay)}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};

export default HRPayrollDashboard;
