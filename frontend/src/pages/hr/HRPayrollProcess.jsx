import React, { useState } from 'react';
import hrService from '../../services/hrService';
import { playSuccessSound, playInfoSound } from '../../utils/playNotificationSound';
import styles from './HRPayrollProcess.module.css';

const STEPS = [
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
  const [status, setStatus] = useState('Draft'); // Draft, Calculated, Payslips Generated, Approved, Finalized
  const [loading, setLoading] = useState(false);

  const handleProcess = async () => {
    if (!month) return alert('Select a month first');
    setLoading(true);
    try {
      const parts = month.split('-'); // YYYY-MM
      const res = await hrService.processPayrollDash({ month: parts[1], year: parts[0] });
      setPayrollData(res.data?.data);
      setCurrentStep(3); // Moved through gross, deductions, net
      setStatus('Calculated');
      playInfoSound();
    } catch (err) {
      alert('Error calculating payroll');
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePayslips = async () => {
    setLoading(true);
    try {
      await hrService.generatePayslips({ periodId: payrollData.id });
      setCurrentStep(4);
      setStatus('Payslips Generated');
      playSuccessSound();
    } catch (err) {
      alert('Error generating payslips');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    setLoading(true);
    try {
      await hrService.approvePayrollProcess(payrollData.id);
      setStatus('Approved');
      setCurrentStep(5);
      playSuccessSound();
    } catch (err) {
      alert('Error approving payroll');
    } finally {
      setLoading(false);
    }
  };

  const handleFinalize = async () => {
    setLoading(true);
    try {
      await hrService.finalizePayrollProcess(payrollData.id);
      setStatus('Finalized');
      playSuccessSound();
      alert('Payroll Processed');
    } catch (err) {
      alert('Error finalizing payroll');
    } finally {
      setLoading(false);
    }
  };

  const isFinalized = status === 'Finalized';

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.pageTitle}>Payroll Processing</h1>
          <p className={styles.pageSubtitle}>Calculate, approve, and finalize monthly payroll runs.</p>
        </div>
      </div>

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
            }}
            disabled={isFinalized}
            className={styles.monthInput}
          />
          <span className={styles.statusBadge + ' ' + styles[status.replace(' ', '')]}>{status}</span>
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
              <div className={styles.summaryValue}>{payrollData.summary.totalEmployees}</div>
            </div>
            <div className={styles.summaryBox}>
              <div className={styles.summaryLabel}>Total Gross Salary</div>
              <div className={styles.summaryValue}>${payrollData.summary.gross.toLocaleString()}</div>
            </div>
            <div className={styles.summaryBox}>
              <div className={styles.summaryLabel}>Total Deductions</div>
              <div className={styles.summaryValue}>${payrollData.summary.deductions.toLocaleString()}</div>
            </div>
            <div className={styles.summaryBox}>
              <div className={styles.summaryLabel}>Total Tax</div>
              <div className={styles.summaryValue}>${payrollData.summary.tax.toLocaleString()}</div>
            </div>
            <div className={styles.summaryBox}>
              <div className={styles.summaryLabel}>Total Net Salary</div>
              <div className={styles.summaryValueBold}>${payrollData.summary.net.toLocaleString()}</div>
            </div>
          </div>
        )}

        <div className={styles.actions}>
          {!payrollData && (
            <button className={styles.primaryBtn} onClick={handleProcess} disabled={!month || loading || isFinalized}>
              {loading ? 'Calculating...' : 'Calculate Payroll'}
            </button>
          )}

          {payrollData && status === 'Calculated' && (
            <button className={styles.primaryBtn} onClick={handleGeneratePayslips} disabled={loading || isFinalized}>
              Generate Payslips
            </button>
          )}

          {payrollData && status === 'Payslips Generated' && (
            <button className={styles.primaryBtn} onClick={handleApprove} disabled={loading || isFinalized}>
              Approve Payroll (Manager)
            </button>
          )}

          {payrollData && status === 'Approved' && (
            <button className={styles.successBtn} onClick={handleFinalize} disabled={loading || isFinalized}>
              Finalize Payroll
            </button>
          )}

          {isFinalized && (
            <div className={styles.finalizedMsg}>
              This payroll period is finalized and read-only.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HRPayrollProcess;
