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
  const [searchName, setSearchName] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('All');
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

  const uniqueDepartments = [...new Set(payslips.map(ps => ps.department || 'Unknown'))].sort();

  const completedPayslips = payslips.filter(ps => {
    if (!['Paid', 'Finalized'].includes(ps.payroll_status)) return false;
    
    // Filter 1: Month (already filtered by API usually, but good to have)
    if (selectedMonth && ps.payroll_month !== selectedMonth.replace('-', '/')) {
      // Actually API handles selectedMonth, but if we do local filtering:
      // We'll rely on the API for month, so this is mostly covered. 
    }
    
    // Filter 2: Name/ID
    if (searchName) {
      const term = searchName.toLowerCase();
      const matchName = (ps.full_name || '').toLowerCase().includes(term);
      const matchId = (ps.employee_id || '').toString().includes(term);
      if (!matchName && !matchId) return false;
    }
    
    // Filter 3: Department
    if (filterDepartment !== 'All') {
      const dept = ps.department || 'Unknown';
      if (dept !== filterDepartment) return false;
    }
    
    return true;
  });

  const handlePrint = () => {
    const now = new Date();
    const periodLabel = selectedMonth ? `Period: ${selectedMonth}` : 'All Periods';

    const totalNet = completedPayslips.reduce((s, ps) => s + parseFloat(ps.net_salary || 0), 0);
    const totalBase = completedPayslips.reduce((s, ps) => s + parseFloat(ps.base_salary || 0), 0);
    const totalDed = completedPayslips.reduce((s, ps) => s +
      (parseFloat(ps.absence_deduction || 0) + parseFloat(ps.tax_deduction || 0) +
       parseFloat(ps.pension_deduction || 0) + parseFloat(ps.loan_deduction || 0)), 0);

    const rows = completedPayslips.map((ps, i) => {
      const ded = parseFloat(ps.absence_deduction || 0) + parseFloat(ps.tax_deduction || 0) +
                  parseFloat(ps.pension_deduction || 0) + parseFloat(ps.loan_deduction || 0);
                  
      const isCash = (ps.payment_method || '').toLowerCase().includes('cash');
      const methodHtml = isCash 
        ? '💵 Cash' 
        : `🏦 Bank${`<br><span style="font-size:9px;color:#64748b;font-family:monospace">${ps.bank_name || 'CBE'}</span>`}${`<br><span style="font-size:9px;color:#64748b;font-family:monospace">A/C: ${ps.bank_account || ps.bank_account_number || '—'}</span>`}`;

      return `
        <tr style="background:${i % 2 === 0 ? '#f0fdf4' : '#fff'}">
          <td style="padding:5px 8px 5px 24px;color:#94a3b8">${i + 1}</td>
          <td style="padding:5px 8px;font-weight:600">
            <div style="font-size:12px;color:#0f172a">${ps.full_name || '—'}</div>
            <div style="font-size:10px;color:#64748b;font-family:monospace">#${ps.employee_id}</div>
          </td>
          <td style="padding:5px 8px;color:#475569">${ps.department || '—'}</td>
          <td style="padding:5px 8px;font-family:monospace;color:#475569">${ps.payroll_month || '—'}</td>
          <td style="padding:5px 8px;text-align:right">${ps.days_present ?? '—'}</td>
          <td style="padding:5px 8px;text-align:right">${fmtN(ps.base_salary)}</td>
          <td style="padding:5px 8px;text-align:right;color:#dc2626">-${fmtN(ded)}</td>
          <td style="padding:5px 8px;text-align:right;font-weight:700;color:#15803d">${fmtN(ps.net_salary)}</td>
          <td style="padding:5px 8px;text-align:center;line-height:1.2">${methodHtml}</td>
          <td style="padding:5px 8px;text-align:center"><span style="background:#DCFCE7;color:#15803D;padding:2px 6px;border-radius:99px;font-size:10px;font-weight:700">✓ ${ps.payroll_status || '—'}</span></td>
        </tr>`;
    }).join('');

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>Payroll History — ${periodLabel}</title>
  <style>
    @page { margin: 15mm; size: A4 landscape; }
    * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    body { font-family: Arial, sans-serif; background: #fff; color: #0f172a; margin: 0; padding: 24px; font-size: 13px; }
    h1 { font-size: 22px; font-weight: 900; margin: 0 0 4px; }
    .subtitle { font-size: 12px; color: #64748b; margin: 0 0 20px; }
    .summary { display: flex; gap: 14px; margin-bottom: 24px; flex-wrap: wrap; }
    .card { padding: 12px 16px; border-radius: 8px; flex: 1; min-width: 140px; }
    .card.green { background: #f0fdf4; border: 1px solid #bbf7d0; }
    .card.gray  { background: #f8fafc; border: 1px solid #e2e8f0; }
    .card .lbl  { font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: .06em; color: #64748b; margin-bottom: 4px; }
    .card .val  { font-size: 18px; font-weight: 900; color: #15803d; }
    .card.gray .val { color: #334155; font-size: 15px; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 8px; }
    thead tr { background: #bbf7d0; }
    th { padding: 8px 10px; font-weight: 700; color: #166534; text-align: left; }
    td { padding: 7px 10px; border-bottom: 1px solid #e2e8f0; }
    tfoot tr { background: #e2e8f0; font-weight: 800; }
    .no-print { margin-bottom: 20px; }
    @media print { .no-print { display: none; } }
  </style>
</head>
<body>
  <div class="no-print">
    <button onclick="window.print()" style="padding:10px 22px;background:#1D4ED8;color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer">🖨️ Print / Save as PDF</button>
    <button onclick="window.close()" style="margin-left:10px;padding:10px 20px;background:#f1f5f9;color:#334155;border:1px solid #cbd5e1;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer">✕ Close</button>
  </div>

  <h1>✅ HR Payroll History Report</h1>
  <p class="subtitle"><strong>${periodLabel}</strong> &nbsp;|&nbsp; Printed: ${now.toLocaleString('en-GB')} &nbsp;|&nbsp; Filters: Dept(${filterDepartment}), Search(${searchName || 'None'})</p>

  <div class="summary">
    <div class="card green"><div class="lbl">Total Net Pay</div><div class="val">ETB ${fmtN(totalNet)}</div></div>
    <div class="card gray"><div class="lbl">Total Base Salary</div><div class="val">ETB ${fmtN(totalBase)}</div></div>
    <div class="card gray"><div class="lbl">Total Deductions</div><div class="val">ETB ${fmtN(totalDed)}</div></div>
    <div class="card gray"><div class="lbl">Payslips Count</div><div class="val">${completedPayslips.length}</div></div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="padding-left:24px">#</th>
        <th>Employee</th>
        <th>Department</th>
        <th>Period</th>
        <th style="text-align:right">Days</th>
        <th style="text-align:right">Base Salary</th>
        <th style="text-align:right">Deductions</th>
        <th style="text-align:right">Net Pay</th>
        <th style="text-align:center">Bank / Account</th>
        <th style="text-align:center">Status</th>
      </tr>
    </thead>
    <tbody>
      ${rows.length > 0 ? rows : '<tr><td colspan="10" style="text-align:center;padding:20px;color:#64748b">No payslips found matching the filters.</td></tr>'}
    </tbody>
    ${rows.length > 0 ? `
    <tfoot>
      <tr>
        <td colspan="5" style="text-align:right;padding-right:16px">Totals:</td>
        <td style="text-align:right">${fmtN(totalBase)}</td>
        <td style="text-align:right;color:#dc2626">-${fmtN(totalDed)}</td>
        <td style="text-align:right;color:#15803d">${fmtN(totalNet)}</td>
        <td colspan="2"></td>
      </tr>
    </tfoot>
    ` : ''}
  </table>
</body>
</html>`;

    const win = window.open('', '_blank', 'width=1100,height=800');
    if (win) {
      win.document.open();
      win.document.write(html);
      win.document.close();
    }
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
      <div className={styles.filters} style={{ display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div>
          <label className={styles.filterLbl}>Month:</label>
          <input
            type="month"
            value={selectedMonth}
            onChange={e => setSelectedMonth(e.target.value)}
            className={styles.monthInput}
            style={{ display: 'block', marginTop: '4px', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
          />
        </div>
        <div>
          <label className={styles.filterLbl}>Search Employee:</label>
          <input
            type="text"
            placeholder="Name or ID..."
            value={searchName}
            onChange={e => setSearchName(e.target.value)}
            style={{ display: 'block', marginTop: '4px', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', minWidth: '200px' }}
          />
        </div>
        <div>
          <label className={styles.filterLbl}>Department:</label>
          <select
            value={filterDepartment}
            onChange={e => setFilterDepartment(e.target.value)}
            style={{ display: 'block', marginTop: '4px', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', minWidth: '150px' }}
          >
            <option value="All">All Departments</option>
            {uniqueDepartments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        </div>
        
        <div style={{ marginLeft: 'auto', marginBottom: '8px' }}>
          <span className={styles.filterCount} style={{ background: '#e2e8f0', padding: '4px 10px', borderRadius: '99px', fontSize: '12px', fontWeight: 'bold' }}>
            {completedPayslips.length} payslip(s) match
          </span>
        </div>
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
                  <th className={styles.left}>Bank / Account</th>
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
                      <td className={styles.left}>
                        {!(ps.payment_method || '').toLowerCase().includes('cash') ? (
                          <div>
                            <div style={{ display:'inline-flex', alignItems:'center', gap:5, background:'#F0FDF4', color:'#16A34A', padding:'3px 10px', borderRadius:99, fontSize:11, fontWeight:700, marginBottom: 4 }}>🏦 Bank Transfer</div>
                            <div style={{ fontSize:12, fontWeight:700, color:'#334155' }}>{ps.bank_name || 'CBE'}</div>
                            <div style={{ fontSize:11, color:'#64748B', fontFamily:'monospace', letterSpacing:'.05em' }}>A/C: {ps.bank_account || ps.bank_account_number || '—'}</div>
                          </div>
                        ) : (
                          <div style={{ display:'inline-flex', alignItems:'center', gap:5, background:'#FEF3C7', color:'#92400E', padding:'3px 10px', borderRadius:99, fontSize:11, fontWeight:700 }}>💵 Cash</div>
                        )}
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
                  <strong>Bank Account:</strong> {!(viewPayslip.payment_method || '').toLowerCase().includes('cash') ? `${viewPayslip.bank_name || 'CBE'} - ${viewPayslip.bank_account || viewPayslip.bank_account_number || '—'}` : 'Cash'}
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
