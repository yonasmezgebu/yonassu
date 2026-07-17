import React, { useState, useEffect } from 'react';
import hrService from '../../services/hrService';
import { playSuccessSound, playInfoSound } from '../../utils/playNotificationSound';
import styles from './HRPayrollProcess.module.css';

const STEPS = [
  'Select Period',
  'Calculate Gross Pay',
  'Calculate Deductions',
  'Calculate Net Pay',
  'Generate Payslips',
  'Approve Payroll'
];

const HRPayrollProcess = () => {
  const [month, setMonth] = useState('');
  const [currentStep, setCurrentStep] = useState(0);
  const [payrollData, setPayrollData] = useState(null);
  const [status, setStatus] = useState('Draft');
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ type: null, text: '' });
  const [items, setItems] = useState([]);
  const [showItems, setShowItems] = useState(false);

  const handleProcess = async () => {
    if (!month) return setStatusMsg({ type: 'error', text: 'Please select a month first.' });
    setLoading(true);
    setStatusMsg({ type: null, text: '' });
    try {
      const res = await hrService.processPayroll({ month });
      const data = res.data;
      setPayrollData(data);
      setCurrentStep(4); // Moved through gross, deductions, net
      setStatus('Calculated');
      playInfoSound();
      setStatusMsg({ type: 'success', text: `✅ Payroll calculated for ${month}. ${data?.summary?.totalEmployees || 0} employees processed.` });
    } catch (err) {
      setStatusMsg({ type: 'error', text: err?.response?.data?.message || 'Error calculating payroll.' });
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePayslips = async () => {
    setLoading(true);
    setStatusMsg({ type: null, text: '' });
    try {
      await hrService.generatePayslips({ periodId: payrollData.id, month });
      setCurrentStep(5);
      setStatus('Payslips Generated');
      playSuccessSound();
      setStatusMsg({ type: 'success', text: '✅ Payslips generated for all employees.' });
    } catch (err) {
      setStatusMsg({ type: 'error', text: err?.response?.data?.message || 'Error generating payslips.' });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    setLoading(true);
    setStatusMsg({ type: null, text: '' });
    try {
      await hrService.approvePayrollProcess(payrollData.id);
      setStatus('Approved');
      setCurrentStep(6);
      playSuccessSound();
      setStatusMsg({ type: 'success', text: '✅ Payroll approved. Ready to finalize.' });
    } catch (err) {
      setStatusMsg({ type: 'error', text: err?.response?.data?.message || 'Error approving payroll.' });
    } finally {
      setLoading(false);
    }
  };

  const handleFinalize = async () => {
    setLoading(true);
    setStatusMsg({ type: null, text: '' });
    try {
      await hrService.finalizePayrollProcess(payrollData.id);
      setStatus('Finalized');
      playSuccessSound();
      setStatusMsg({ type: 'success', text: '✅ Payroll finalized and locked. Employees will be paid.' });
    } catch (err) {
      setStatusMsg({ type: 'error', text: err?.response?.data?.message || 'Error finalizing payroll.' });
    } finally {
      setLoading(false);
    }
  };

  const loadItems = async () => {
    if (!month) return;
    try {
      const res = await hrService.getPayslips({ month });
      setItems(res.data?.payslips || []);
      setShowItems(true);
    } catch (err) {
      setStatusMsg({ type: 'error', text: 'Could not load payslip items.' });
    }
  };

  const isFinalized = status === 'Finalized';

  const fmtN = (n) => parseFloat(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.pageTitle}>Payroll Processing</h1>
          <p className={styles.pageSubtitle}>Calculate, approve, and finalize monthly payroll runs.</p>
        </div>
      </div>

      {statusMsg.text && (
        <div style={{
          padding: '10px 16px', borderRadius: 8, marginBottom: 12,
          background: statusMsg.type === 'success' ? '#d1fae5' : '#fee2e2',
          color: statusMsg.type === 'success' ? '#065f46' : '#991b1b',
          fontWeight: 500, fontSize: '0.9rem'
        }}>
          {statusMsg.text}
        </div>
      )}

      <div className={styles.card}>
        <div className={styles.periodSelect}>
          <label>Select Payroll Period:</label>
          <input
            type="month"
            value={month}
            onChange={e => {
              setMonth(e.target.value);
              setPayrollData(null);
              setCurrentStep(0);
              setStatus('Draft');
              setStatusMsg({ type: null, text: '' });
              setShowItems(false);
            }}
            disabled={isFinalized}
            className={styles.monthInput}
          />
          <span className={styles.statusBadge + ' ' + styles[status.replace(/ /g, '')]}>{status}</span>
        </div>

        <div className={styles.stepper}>
          {STEPS.map((step, idx) => (
            <div key={idx} className={`${styles.step} ${currentStep > idx ? styles.stepCompleted : ''} ${currentStep === idx ? styles.stepActive : ''}`}>
              <div className={styles.stepCircle}>{currentStep > idx ? '✓' : idx + 1}</div>
              <div className={styles.stepLabel}>{step}</div>
            </div>
          ))}
        </div>

        {payrollData && (
          <div className={styles.summaryGrid}>
            <div className={styles.summaryBox}>
              <div className={styles.summaryLabel}>Total Employees</div>
              <div className={styles.summaryValue}>{payrollData.summary?.totalEmployees ?? 0}</div>
            </div>
            <div className={styles.summaryBox}>
              <div className={styles.summaryLabel}>Total Gross Salary</div>
              <div className={styles.summaryValue}>${fmtN(payrollData.summary?.gross)}</div>
            </div>
            <div className={styles.summaryBox}>
              <div className={styles.summaryLabel}>Total Deductions</div>
              <div className={styles.summaryValue}>${fmtN(payrollData.summary?.deductions)}</div>
            </div>
            <div className={styles.summaryBox}>
              <div className={styles.summaryLabel}>Total Net Salary</div>
              <div className={styles.summaryValueBold}>${fmtN(payrollData.summary?.net)}</div>
            </div>
            <div className={styles.summaryBox} style={{ cursor: 'pointer' }} onClick={loadItems}>
              <div className={styles.summaryLabel}>View Breakdown ↓</div>
              <div className={styles.summaryValue} style={{ fontSize: '0.85rem', color: '#6366f1' }}>Click to expand</div>
            </div>
          </div>
        )}

        {showItems && items.length > 0 && (
          <div style={{ marginTop: 16, overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: '#f1f5f9' }}>
                  <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>Employee</th>
                  <th style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #e2e8f0' }}>Base Salary</th>
                  <th style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #e2e8f0' }}>Days Present</th>
                  <th style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #e2e8f0' }}>Absence Ded.</th>
                  <th style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #e2e8f0' }}>Net Salary</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td style={{ padding: '8px' }}>{item.full_name || item.employee_id}</td>
                    <td style={{ padding: '8px', textAlign: 'right' }}>${fmtN(item.base_salary)}</td>
                    <td style={{ padding: '8px', textAlign: 'right' }}>{item.days_present ?? '—'}</td>
                    <td style={{ padding: '8px', textAlign: 'right', color: '#dc2626' }}>${fmtN(item.absence_deduction)}</td>
                    <td style={{ padding: '8px', textAlign: 'right', fontWeight: 700, color: '#16a34a' }}>${fmtN(item.net_salary)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button style={{ marginTop: 8, fontSize: '0.8rem', color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer' }}
              onClick={() => setShowItems(false)}>Hide breakdown</button>
          </div>
        )}

        <div className={styles.actions}>
          {!payrollData && (
            <button className={styles.primaryBtn} onClick={handleProcess} disabled={!month || loading || isFinalized}>
              {loading ? 'Calculating...' : 'Calculate Payroll'}
            </button>
          )}

          {payrollData && status === 'Calculated' && (
            <button className={styles.primaryBtn} onClick={handleGeneratePayslips} disabled={loading}>
              {loading ? 'Generating...' : 'Generate Payslips'}
            </button>
          )}

          {payrollData && status === 'Payslips Generated' && (
            <button className={styles.primaryBtn} onClick={handleApprove} disabled={loading}>
              {loading ? 'Approving...' : 'Approve Payroll (Manager)'}
            </button>
          )}

          {payrollData && status === 'Approved' && (
            <button className={styles.successBtn} onClick={handleFinalize} disabled={loading}>
              {loading ? 'Finalizing...' : 'Finalize Payroll'}
            </button>
          )}

          {isFinalized && (
            <div className={styles.finalizedMsg}>
              ✅ This payroll period is finalized and locked.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HRPayrollProcess;
