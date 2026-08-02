import React, { useState, useEffect } from 'react';
import hrService from '../../services/hrService';
import { playSuccessSound } from '../../utils/playNotificationSound';
import styles from './HRPayslips.module.css';

const HRPayslips = () => {
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generateMonth, setGenerateMonth] = useState('');
  const [generating, setGenerating] = useState(false);
  const [genMsg, setGenMsg] = useState({ type: null, text: '' });
  const [selectedMonth, setSelectedMonth] = useState('');
  const [viewPayslip, setViewPayslip] = useState(null);

  const fetchPayslips = async (month) => {
    setLoading(true);
    try {
      const params = month ? { month } : {};
      const res = await hrService.getPayslips(params);
      setPayslips(res.data?.payslips || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayslips('');
  }, []);

  useEffect(() => {
    fetchPayslips(selectedMonth);
  }, [selectedMonth]);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!generateMonth) return;
    setGenerating(true);
    setGenMsg({ type: null, text: '' });
    try {
      await hrService.generatePayslips({ month: generateMonth });
      playSuccessSound();
      setGenMsg({ type: 'success', text: `✅ Payslips generated for ${generateMonth}.` });
      setShowGenerateModal(false);
      setGenerateMonth('');
      setSelectedMonth(generateMonth);
      fetchPayslips(generateMonth);
    } catch (err) {
      setGenMsg({ type: 'error', text: err?.response?.data?.message || 'Failed to generate payslips.' });
    } finally {
      setGenerating(false);
    }
  };

  const fmtN = (n) => parseFloat(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString() : '—';

  const completedPayslips = payslips.filter(ps => ['Paid', 'Finalized'].includes(ps.payroll_status));

  const handlePrint = () => {
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
    const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    const periodLabel = selectedMonth ? `Period: ${selectedMonth}` : 'All Periods';

    const totalNet = completedPayslips.reduce((s, ps) => s + parseFloat(ps.net_salary || 0), 0);
    const totalBase = completedPayslips.reduce((s, ps) => s + parseFloat(ps.base_salary || 0), 0);
    const totalDed = completedPayslips.reduce((s, ps) => s +
      (parseFloat(ps.absence_deduction || 0) + parseFloat(ps.tax_deduction || 0) +
       parseFloat(ps.pension_deduction || 0) + parseFloat(ps.loan_deduction || 0)), 0);

    const rows = completedPayslips.map((ps, i) => {
      const ded = parseFloat(ps.absence_deduction || 0) + parseFloat(ps.tax_deduction || 0) +
                  parseFloat(ps.pension_deduction || 0) + parseFloat(ps.loan_deduction || 0);
      return `
        <tr class="${i % 2 === 0 ? 'even' : 'odd'}">
          <td>${i + 1}</td>
          <td>
            <div class="emp-name">${ps.full_name || '—'}</div>
            <div class="emp-id">#${ps.employee_id}</div>
          </td>
          <td>${ps.department || '—'}</td>
          <td class="mono">${ps.payroll_month || '—'}</td>
          <td>${ps.days_present ?? '—'}</td>
          <td class="num">${fmtN(ps.base_salary)} ETB</td>
          <td class="num red">-${fmtN(ded)} ETB</td>
          <td class="num bold">${fmtN(ps.net_salary)} ETB</td>
          <td class="status">${ps.payroll_status || '—'}</td>
        </tr>`;
    }).join('');

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Payroll History — SUTANA Enterprise</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', sans-serif; background: #fff; color: #222; padding: 32px; font-size: 13px; }

    /* HEADER */
    .ph { border-bottom: 4px solid #228B22; padding-bottom: 20px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-end; }
    .org-name { font-size: 24px; font-weight: 900; color: #1B5E20; letter-spacing: -0.02em; }
    .org-sub  { font-size: 12px; color: #6B8E23; font-weight: 700; margin-top: 4px; }
    .meta { text-align: right; font-size: 11px; color: #424242; line-height: 1.8; }
    .meta strong { color: #1B5E20; }

    /* TITLE */
    .report-title  { font-size: 18px; font-weight: 900; color: #228B22; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 4px; }
    .report-period { font-size: 12px; color: #6B8E23; font-weight: 700; margin-bottom: 20px; }

    /* SUMMARY */
    .summary { display: flex; border: 1.5px solid #228B22; margin-bottom: 24px; }
    .sc { flex: 1; padding: 12px 18px; border-right: 1px solid #228B22; }
    .sc:last-child { border-right: none; }
    .sc-lbl { font-size: 9px; font-weight: 800; color: #6B8E23; text-transform: uppercase; letter-spacing: 0.12em; margin-bottom: 5px; }
    .sc-val { font-size: 16px; font-weight: 900; color: #1B5E20; }
    .sc-val.red { color: #C62828; }

    /* TABLE */
    table { width: 100%; border-collapse: collapse; font-size: 11px; }
    thead tr { background: #1B5E20; }
    thead th { padding: 10px 8px; color: #fff; font-weight: 800; text-transform: uppercase; letter-spacing: 0.06em; text-align: left; font-size: 9px; }
    thead th.num { text-align: right; }
    tbody tr.even { background: #fff; }
    tbody tr.odd  { background: #F1F8E9; }
    tbody td { padding: 9px 8px; border-bottom: 1px solid #E8F5E9; vertical-align: middle; }
    .emp-name { font-weight: 800; color: #1B5E20; font-size: 12px; }
    .emp-id   { color: #6B8E23; font-size: 9px; font-family: monospace; margin-top: 2px; }
    td.num    { text-align: right; font-weight: 700; }
    td.mono   { font-family: monospace; font-weight: 700; }
    td.red    { color: #C62828; font-weight: 800; }
    td.bold   { font-weight: 900; color: #1B5E20; }
    td.status { font-size: 9px; font-weight: 900; text-transform: uppercase; background: #E8F5E9; color: #1B5E20; padding: 4px 8px; }

    /* SIGS */
    .sigs { display: flex; justify-content: space-between; margin-top: 52px; }
    .sig-line { border-top: 1px solid #424242; margin-top: 40px; width: 160px; font-size: 9px; padding-top: 5px; color: #424242; }

    /* FOOTER */
    .pf { margin-top: 32px; border-top: 2px solid #8D6E63; padding-top: 14px; display: flex; justify-content: space-between; font-size: 10px; color: #6B8E23; font-weight: 700; }

    @media print {
      body { padding: 16px; }
      @page { margin: 15mm; size: A4 landscape; }
      thead th { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: #1B5E20 !important; }
      tbody tr.odd { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: #F1F8E9 !important; }
      td.status { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: #E8F5E9 !important; }
    }
  </style>
</head>
<body>
  <div class="ph">
    <div>
      <div class="org-name">SUTANA Enterprise</div>
      <div class="org-sub">Enterprise Management System</div>
    </div>
    <div class="meta">
      <strong>Printed:</strong> ${dateStr} at ${timeStr}<br/>
      <strong>Report:</strong> Payroll History<br/>
      <strong>Filter:</strong> ${periodLabel}
    </div>
  </div>

  <div class="report-title">Payroll History Report</div>
  <div class="report-period">${periodLabel} &nbsp;|&nbsp; ${completedPayslips.length} completed payslip(s)</div>

  <div class="summary">
    <div class="sc">
      <div class="sc-lbl">Total Records</div>
      <div class="sc-val">${completedPayslips.length}</div>
    </div>
    <div class="sc">
      <div class="sc-lbl">Total Base Salary</div>
      <div class="sc-val">${fmtN(totalBase)} ETB</div>
    </div>
    <div class="sc">
      <div class="sc-lbl">Total Deductions</div>
      <div class="sc-val red">-${fmtN(totalDed)} ETB</div>
    </div>
    <div class="sc">
      <div class="sc-lbl">Total Net Pay</div>
      <div class="sc-val">${fmtN(totalNet)} ETB</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Employee</th>
        <th>Department</th>
        <th>Period</th>
        <th>Days</th>
        <th class="num">Base Salary</th>
        <th class="num">Deductions</th>
        <th class="num">Net Pay</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>

  <div class="sigs">
    <div><div class="sig-line">HR Manager Signature</div></div>
    <div><div class="sig-line">Finance Manager Signature</div></div>
    <div><div class="sig-line">CEO Approval</div></div>
  </div>

  <div class="pf">
    <span>SUTANA Enterprise Management System — Confidential</span>
    <span>Page 1 of 1</span>
  </div>

  <script>window.onload = function() { window.print(); }<\/script>
</body>
</html>`;

    const win = window.open('', '_blank', 'width=1100,height=800');
    if (win) { win.document.write(html); win.document.close(); }
  };

  const openView = (ps) => {
    const gross = parseFloat(ps.base_salary || 0) + parseFloat(ps.performance_bonus || 0) + parseFloat(ps.overtime_pay || 0);
    const deductions = [
      { name: 'Absence Deduction', amount: parseFloat(ps.absence_deduction || 0) },
      { name: 'Tax Deduction', amount: parseFloat(ps.tax_deduction || 0) },
      { name: 'Pension Deduction', amount: parseFloat(ps.pension_deduction || 0) },
      { name: 'Manual Deduction (Loan/Other)', amount: parseFloat(ps.loan_deduction || 0) },
    ].filter(d => d.amount > 0);
    const earnings = [
      { name: 'Base Salary', amount: parseFloat(ps.base_salary || 0) },
      { name: 'Performance Bonus', amount: parseFloat(ps.performance_bonus || 0) },
      { name: 'Overtime Pay', amount: parseFloat(ps.overtime_pay || 0) },
    ].filter(e => e.amount > 0);
    setViewPayslip({ ...ps, grossCalc: gross, deductionsList: deductions, earningsList: earnings });
  };

  const getStatusClass = (s) => {
    if (s === 'Paid' || s === 'Finalized') return styles.statusPaid;
    if (s === 'Approved') return styles.statusApproved;
    if (s === 'Payslips Generated') return styles.statusGenerated;
    return styles.statusDraft;
  };

  return (
    <div className={styles.container}>
      
      {/* ── HEADER ── */}
      <div className={styles.header}>
        <div>
          <div className={styles.badge}>
            <span className={styles.badgeDot} />
            <span className={styles.badgeTxt}>Finance · History</span>
          </div>
          <h1 className={styles.pageTitle}>
            Payroll <span>History</span>
          </h1>
          <p className={styles.pageSubtitle}>
            View and distribute completed employee payslips.
          </p>
        </div>

        <button className={styles.exportBtn} onClick={handlePrint}>
            Export History
          </button>
      </div>

      {/* ── FILTERS ── */}
      <div className={styles.filters}>
        <label className={styles.filterLbl}>Filter by Month:</label>
        <input
          type="month"
          value={selectedMonth}
          onChange={e => setSelectedMonth(e.target.value)}
          className={styles.monthInput}
        />
        <span className={styles.filterCount}>
          {payslips.filter(ps => ['Paid', 'Finalized'].includes(ps.payroll_status)).length} completed payslip(s) found
        </span>
      </div>

      {/* ── BODY ── */}
      <div className={styles.bodyArea}>
        {loading ? (
          <div className={styles.loading}>● Loading payslips...</div>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Period</th>
                  <th className={styles.right}>Base Salary</th>
                  <th className={styles.right}>Deductions</th>
                  <th className={styles.right}>Net Pay</th>
                  <th className={styles.center}>Status</th>
                  <th className={styles.right}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {payslips.filter(ps => ['Paid', 'Finalized'].includes(ps.payroll_status)).length === 0 ? (
                  <tr>
                    <td colSpan={7} className={styles.empty}>No completed payslips found.</td>
                  </tr>
                ) : (
                  payslips
                    .filter(ps => ['Paid', 'Finalized'].includes(ps.payroll_status))
                    .map((ps) => (
                    <tr key={ps.id}>
                      <td>
                        <div className={styles.empName}>{ps.full_name || '—'}</div>
                        <div className={styles.empId}>#{ps.employee_id}</div>
                      </td>
                      <td>
                        <div className={styles.periodMonth}>{ps.payroll_month || '—'}</div>
                        <div className={styles.periodDays}>{ps.days_present ?? '—'} days</div>
                      </td>
                      <td className={styles.right}>
                        <span className={styles.currency}>{fmtN(ps.base_salary)} ETB</span>
                      </td>
                      <td className={styles.right}>
                        <span className={styles.currencyMinus}>
                          -{fmtN((parseFloat(ps.absence_deduction || 0) + parseFloat(ps.tax_deduction || 0) + parseFloat(ps.pension_deduction || 0) + parseFloat(ps.loan_deduction || 0)))} ETB
                        </span>
                      </td>
                      <td className={styles.right}>
                        <span className={styles.currencyNet}>
                          {fmtN(ps.net_salary)} ETB
                        </span>
                      </td>
                      <td className={styles.center}>
                        <span className={`${styles.statusBadge} ${getStatusClass(ps.payroll_status)}`}>
                          {ps.payroll_status || 'Draft'}
                        </span>
                      </td>
                      <td className={styles.right}>
                        <button className={styles.actionBtn} onClick={() => openView(ps)}>
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── PAYSLIP MODAL ── */}
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
                <p>Payslip for {viewPayslip.payroll_month}</p>
              </div>
              
              <div className={styles.psGrid}>
                <div className={styles.psBlock}>
                  <strong>Employee:</strong> {viewPayslip.full_name} ({viewPayslip.employee_id})<br />
                  <strong>Department:</strong> {viewPayslip.department || '—'}
                </div>
                <div className={styles.psBlock}>
                  <strong>Days Present:</strong> {viewPayslip.days_present ?? '—'} / {viewPayslip.days_absent !== undefined ? (viewPayslip.days_present + viewPayslip.days_absent) : '—'}<br />
                  <strong>Bank Account:</strong> {viewPayslip.bank_account_number || '—'}
                </div>
              </div>

              <table className={styles.psTable}>
                <thead>
                  <tr>
                    <th>Earnings</th>
                    <th style={{ textAlign: 'right' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {viewPayslip.earningsList.map((e, i) => (
                    <tr key={i}>
                      <td>{e.name}</td>
                      <td style={{ textAlign: 'right' }}>{fmtN(e.amount)} ETB</td>
                    </tr>
                  ))}
                  <tr>
                    <td style={{ fontWeight: 800 }}>Gross Pay</td>
                    <td style={{ textAlign: 'right', fontWeight: 800 }}>{fmtN(viewPayslip.grossCalc)} ETB</td>
                  </tr>
                </tbody>
              </table>

              <table className={styles.psTable}>
                <thead>
                  <tr>
                    <th>Deductions</th>
                    <th style={{ textAlign: 'right' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {viewPayslip.deductionsList.length === 0
                    ? <tr><td colSpan={2} style={{ fontStyle: 'italic' }}>No deductions</td></tr>
                    : viewPayslip.deductionsList.map((d, i) => (
                        <tr key={i}>
                          <td>{d.name}</td>
                          <td style={{ textAlign: 'right', color: '#D32F2F' }}>-{fmtN(d.amount)} ETB</td>
                        </tr>
                      ))
                  }
                </tbody>
              </table>

              <div className={styles.psTotal}>
                Net Pay: {fmtN(viewPayslip.net_salary)} ETB
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default HRPayslips;
