import React, { useState } from 'react';
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
      
      {/* ── HEADER ── */}
      <div className={styles.header}>
        <h1 className={styles.pageTitle}>Payroll <span>Processing</span></h1>
        <p className={styles.pageSubtitle}>Calculate, approve, and finalize monthly payroll runs.</p>
      </div>

      {/* ── STATUS ALERT ── */}
      {statusMsg.text && (
        <div className={`${styles.statusAlert} ${statusMsg.type === 'success' ? styles.statusSuccess : styles.statusError}`}>
          {statusMsg.text}
        </div>
      )}

      {/* ── MAIN CARD ── */}
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
          <span className={`${styles.statusBadge} ${styles[status.replace(/ /g, '')]}`}>{status}</span>
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
              <div className={styles.summaryValue}>{fmtN(payrollData.summary?.gross)} ETB</div>
            </div>
            <div className={styles.summaryBox}>
              <div className={styles.summaryLabel}>Total Deductions</div>
              <div className={styles.summaryValue} style={{ color: '#D32F2F' }}>{fmtN(payrollData.summary?.deductions)} ETB</div>
            </div>
            <div className={styles.summaryBox}>
              <div className={styles.summaryLabel}>Total Net Salary</div>
              <div className={styles.summaryValueBold}>{fmtN(payrollData.summary?.net)} ETB</div>
            </div>
            <div className={styles.summaryBox} style={{ cursor: 'pointer' }} onClick={loadItems}>
              <div className={styles.summaryLabel}>View Breakdown ↓</div>
              <div className={styles.summaryValue} style={{ fontSize: '13px', color: '#2E8B57', fontWeight: '800' }}>Click to expand</div>
            </div>
          </div>
        )}

        {showItems && items.length > 0 && (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th className={styles.right}>Base Salary</th>
                  <th className={styles.right}>Days Present</th>
                  <th className={styles.right}>Absence Ded.</th>
                  <th className={styles.right}>Net Salary</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id}>
                    <td>{item.full_name || item.employee_id}</td>
                    <td className={styles.right}>{fmtN(item.base_salary)}</td>
                    <td className={styles.right}>{item.days_present ?? '—'}</td>
                    <td className={`${styles.right} ${styles.deduction}`}>{fmtN(item.absence_deduction)}</td>
                    <td className={`${styles.right} ${styles.netPay}`}>{fmtN(item.net_salary)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ padding: '12px 16px', background: '#F5F5F5' }}>
              <button className={styles.hideBtn} onClick={() => setShowItems(false)}>
                Hide breakdown
              </button>
            </div>
          </div>
        )}

        <div className={styles.actions}>
          {!payrollData && (
            <button className={styles.primaryBtn} onClick={handleProcess} disabled={!month || loading || isFinalized}>
              {loading
                ? <><span className={styles.segSpinner} aria-hidden="true" /> Calculating…</>
                : '▶ Calculate Payroll'}
            </button>
          )}

          {payrollData && status === 'Calculated' && (
            <button className={styles.primaryBtn} onClick={handleGeneratePayslips} disabled={loading}>
              {loading
                ? <><span className={styles.segSpinner} aria-hidden="true" /> Generating…</>
                : '📄 Generate Payslips'}
            </button>
          )}

          {payrollData && status === 'Payslips Generated' && (
            <button className={styles.primaryBtn} onClick={handleApprove} disabled={loading}>
              {loading
                ? <><span className={styles.segSpinner} aria-hidden="true" /> Approving…</>
                : '✓ Approve Payroll'}
            </button>
          )}

          {payrollData && status === 'Approved' && (
            <button className={styles.successBtn} onClick={handleFinalize} disabled={loading}>
              {loading
                ? <><span className={styles.segSpinner} aria-hidden="true" /> Finalizing…</>
                : '🔒 Finalize Payroll'}
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
