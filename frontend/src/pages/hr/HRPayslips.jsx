import React, { useState, useEffect } from 'react';
import hrService from '../../services/hrService';
import { playSuccessSound } from '../../utils/playNotificationSound';
import styles from './HRPayslips.module.css';

const HRPayslips = () => {
  const [payslips, setPayslips] = useState([]);
  const [periods, setPeriods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('');
  
  const [viewPayslip, setViewPayslip] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [psRes, pRes] = await Promise.all([
        hrService.getPayslips(),
        hrService.getPayrollPeriods()
      ]);
      setPayslips(psRes.data?.data?.payslips || []);
      setPeriods(pRes.data?.data?.periods || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!selectedPeriod) return alert('Select a period');
    try {
      await hrService.generatePayslips({ periodId: selectedPeriod });
      playSuccessSound();
      setShowGenerateModal(false);
      fetchData();
    } catch (err) {
      alert('Failed to generate payslips');
    }
  };

  const handleEmail = async (id) => {
    try {
      await hrService.emailPayslip(id);
      alert('Payslip emailed successfully!');
    } catch (err) {
      alert('Failed to email payslip');
    }
  };

  const openView = (ps) => {
    // Mock details
    setViewPayslip({
      ...ps,
      empId: 'EMP-202401',
      empName: 'John Doe',
      department: 'Engineering',
      period: 'June 2026',
      gross: 5000,
      deductions: [{ name: 'Tax', amount: 500 }, { name: 'Pension', amount: 250 }],
      net: 4250,
      paymentMethod: 'Bank Transfer'
    });
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.pageTitle}>Payslips</h1>
          <p className={styles.pageSubtitle}>Generate, view, and distribute employee payslips.</p>
        </div>
        <div className={styles.actions}>
          <button className={styles.primaryBtn} onClick={() => setShowGenerateModal(true)}>Generate Payslips</button>
        </div>
      </div>

      <div className={styles.tableWrapper}>
        {loading ? (
          <div className={styles.loading}>Loading payslips...</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Payslip #</th>
                <th>Period</th>
                <th>Count / Employee</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {payslips.length === 0 ? (
                <tr><td colSpan={5} className={styles.empty}>No payslips found.</td></tr>
              ) : (
                payslips.map(ps => (
                  <tr key={ps.id}>
                    <td className={styles.mono}>{ps.id}</td>
                    <td>{ps.period}</td>
                    <td>{ps.count} Employees</td>
                    <td>
                      <span className={styles.statusBadge + ' ' + styles[ps.status]}>{ps.status}</span>
                    </td>
                    <td>
                      <button className={styles.actionBtn} onClick={() => openView(ps)}>View</button>
                      <button className={styles.actionBtn} onClick={() => handleEmail(ps.id)}>Email</button>
                      <a href={hrService.getPayslipPdfUrl(ps.id)} className={styles.actionLink} target="_blank" rel="noreferrer">PDF</a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {showGenerateModal && (
        <div className={styles.modalOverlay} onClick={() => setShowGenerateModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Generate Payslips</h2>
              <button className={styles.closeBtn} onClick={() => setShowGenerateModal(false)}>×</button>
            </div>
            <form onSubmit={handleGenerate}>
              <div className={styles.modalBody}>
                <div className={styles.formGroup}>
                  <label>Payroll Period *</label>
                  <select required className={styles.input} value={selectedPeriod} onChange={e => setSelectedPeriod(e.target.value)}>
                    <option value="">Select Period...</option>
                    {periods.map(p => (
                      <option key={p.id} value={p.id}>{p.month}/{p.year} ({p.status})</option>
                    ))}
                  </select>
                </div>
                <p className={styles.helpText}>This will generate payslips for all active employees in the selected period.</p>
              </div>
              <div className={styles.modalActions}>
                <button type="button" className={styles.cancelBtn} onClick={() => setShowGenerateModal(false)}>Cancel</button>
                <button type="submit" className={styles.saveBtn}>Generate</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewPayslip && (
        <div className={styles.modalOverlay} onClick={() => setViewPayslip(null)}>
          <div className={styles.payslipModal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Payslip Details</h2>
              <div className={styles.payslipActions}>
                <button className={styles.printBtn} onClick={() => window.print()}>Print</button>
                <button className={styles.closeBtn} onClick={() => setViewPayslip(null)}>×</button>
              </div>
            </div>
            <div className={styles.payslipBody} id="payslip-print-area">
              <div className={styles.psHeader}>
                <h2>Sutana Enterprise</h2>
                <p>Payslip for {viewPayslip.period}</p>
              </div>
              <div className={styles.psGrid}>
                <div className={styles.psBlock}>
                  <strong>Employee:</strong> {viewPayslip.empName} ({viewPayslip.empId})<br/>
                  <strong>Department:</strong> {viewPayslip.department}
                </div>
                <div className={styles.psBlock}>
                  <strong>Payment Method:</strong> {viewPayslip.paymentMethod}
                </div>
              </div>
              <table className={styles.psTable}>
                <thead>
                  <tr><th>Earnings</th><th>Amount</th></tr>
                </thead>
                <tbody>
                  <tr><td>Gross Basic Pay</td><td>${viewPayslip.gross}</td></tr>
                </tbody>
              </table>
              <table className={styles.psTable}>
                <thead>
                  <tr><th>Deductions</th><th>Amount</th></tr>
                </thead>
                <tbody>
                  {viewPayslip.deductions.map((d, i) => (
                    <tr key={i}><td>{d.name}</td><td>${d.amount}</td></tr>
                  ))}
                </tbody>
              </table>
              <div className={styles.psTotal}>
                Net Pay: ${viewPayslip.net}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HRPayslips;
