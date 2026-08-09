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
  const [submitBanner, setSubmitBanner] = useState(null);
  const [activeTab, setActiveTab] = useState('sheet'); // 'sheet' | 'print'

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
    if (summary || employees.length > 0) {
      setConfirmModal({
        title: 'Clear Payroll View',
        message: 'This will clear the current payroll data from the screen. Any unsaved changes will be lost. Are you sure?',
        onConfirm: () => {
          setConfirmModal(null);
          setSummary(null);
          setEmployees([]);
          setSubmitBanner(null);
        }
      });
    } else {
      setSummary(null);
      setEmployees([]);
      setSubmitBanner(null);
    }
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
      message: `Submit the ${new Date(2000, month - 1).toLocaleString('default', { month: 'long' })} ${year} payroll to the CEO for approval? This action cannot be undone.`,
      onConfirm: async () => {
        setConfirmModal(null);
        setSubmitting(true);
        try {
          await apiClient.post('/hr/etp/payroll/submit', { month, year });
          // Show persistent in-app banner — stays until dismissed
          setSubmitBanner({
            title: 'Payroll Submitted for CEO Approval',
            detail: `The ${new Date(2000, month - 1).toLocaleString('default', { month: 'long' })} ${year} payroll has been forwarded to the CEO. You will be notified once it is reviewed.`,
            at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          });
          await fetchPayroll(); // refresh status badge — data stays visible
        } catch (err) {
          showToast(err.response?.data?.message || 'Failed to submit payroll', 'error');
        } finally {
          setSubmitting(false);
        }
      }
    });
  };

  const isEditable = !summary || summary.approval_status === 'Draft' || summary.approval_status === 'Rejected';
  const isFullyPaid = summary?.approval_status === 'Paid';

  // Advance to the next payroll month and reset all state
  const handleStartNextMonth = () => {
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear  = month === 12 ? year + 1 : year;
    setSummary(null);
    setEmployees([]);
    setSubmitBanner(null);
    setActiveTab('sheet');
    setMonth(nextMonth);
    setYear(nextYear);
    // fetchPayroll runs automatically via useEffect on month/year change
  };

  const fmtN = (n) => parseFloat(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const monthName = new Date(2000, month - 1).toLocaleString('default', { month: 'long' });

  const totalBase        = employees.reduce((s, e) => s + Number(e.base_salary || 0), 0);
  const totalAllowances  = employees.reduce((s, e) => s + Number(e.housing_allowance || 0) + Number(e.transport_allowance || 0) + Number(e.communication_allowance || 0), 0);
  const totalExtras      = employees.reduce((s, e) => s + Number(e.overtime_pay || 0) + Number(e.bonus_pay || 0), 0);
  const totalDeductions  = employees.reduce((s, e) => s + Number(e.deduction_absent || 0) + Number(e.deduction_loan || 0) + Number(e.deduction_tax || 0) + Number(e.deduction_pension || 0), 0);
  const totalNet         = employees.reduce((s, e) => s + Number(e.net_pay || 0), 0);

  const handlePrint = () => {
    const printWin = window.open('', '_blank', 'width=1100,height=800');
    const rows = employees.map((emp, idx) => {
      const allow = Number(emp.housing_allowance||0)+Number(emp.transport_allowance||0)+Number(emp.communication_allowance||0);
      const extras = Number(emp.overtime_pay||0)+Number(emp.bonus_pay||0);
      const deduct = Number(emp.deduction_absent||0)+Number(emp.deduction_loan||0)+Number(emp.deduction_tax||0)+Number(emp.deduction_pension||0);
      return `<tr>
        <td class="num">${idx+1}</td>
        <td><div class="name">${emp.full_name}</div><div class="eid">#${emp.employee_id}</div></td>
        <td class="dept">${emp.dept_name || emp.dept_id || '—'}</td>
        <td class="r">${fmtN(emp.base_salary)}</td>
        <td class="r plus">${allow > 0 ? '+'+fmtN(allow) : '—'}</td>
        <td class="r plus">${extras > 0 ? '+'+fmtN(extras) : '—'}</td>
        <td class="r minus">${deduct > 0 ? '-'+fmtN(deduct) : '—'}</td>
        <td class="r bold">${fmtN(emp.net_pay)}</td>
      </tr>`;
    }).join('');

    const now = new Date();
    const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">
<title>Payroll — ${monthName} ${year}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Inter',sans-serif;background:#fff;color:#111827;padding:32px;font-size:12px}
  .doc-header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #2563EB;padding-bottom:16px;margin-bottom:24px}
  .org{font-size:20px;font-weight:700;color:#111827;margin-bottom:4px}
  .sub{font-size:12px;color:#6B7280;margin-bottom:2px}
  .badge{display:inline-block;background:#EFF6FF;color:#2563EB;border:1px solid #BFDBFE;border-radius:9999px;padding:2px 10px;font-size:11px;font-weight:600;margin-top:8px}
  .meta{text-align:right;font-size:11px;color:#6B7280;line-height:1.8}
  .meta strong{color:#111827;font-weight:600}
  .summary{display:grid;grid-template-columns:repeat(5,1fr);gap:0;border:1px solid #E5E7EB;border-radius:8px;overflow:hidden;margin-bottom:24px}
  .sc{padding:12px 16px;border-right:1px solid #E5E7EB}
  .sc:last-child{border-right:none}
  .sc-l{font-size:10px;font-weight:500;color:#9CA3AF;text-transform:uppercase;letter-spacing:.04em;margin-bottom:4px}
  .sc-v{font-size:16px;font-weight:700;color:#111827}
  .sc-v.blue{color:#2563EB}.sc-v.green{color:#16A34A}.sc-v.red{color:#DC2626}
  table{width:100%;border-collapse:collapse}
  thead tr{background:#F9FAFB;border-bottom:1px solid #E5E7EB}
  th{padding:10px 12px;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.04em;color:#6B7280;text-align:left}
  th.r{text-align:right}
  td{padding:10px 12px;border-bottom:1px solid #F3F4F6;vertical-align:middle}
  tr:last-child td{border-bottom:none}
  tr:hover td{background:#F9FAFB}
  td.r{text-align:right;font-variant-numeric:tabular-nums}
  td.num{color:#9CA3AF;font-size:11px;text-align:right}
  td.dept{color:#6B7280}
  .name{font-weight:600;color:#111827;font-size:13px}
  .eid{font-family:monospace;font-size:10px;color:#9CA3AF;margin-top:2px}
  .plus{color:#16A34A}.minus{color:#DC2626}
  .bold{font-weight:700;color:#111827}
  tfoot td{font-weight:700;background:#F9FAFB;border-top:2px solid #E5E7EB;font-size:12px}
  .sig-row{display:flex;justify-content:flex-end;gap:64px;margin-top:48px}
  .sig{text-align:center}
  .sig-line{border-top:1px solid #374151;width:160px;padding-top:6px;font-size:11px;color:#6B7280;margin-top:40px}
  .footer{margin-top:24px;border-top:1px solid #E5E7EB;padding-top:12px;display:flex;justify-content:space-between;font-size:10px;color:#9CA3AF}
  .status-pill{display:inline-block;background:#DCFCE7;color:#16A34A;border-radius:9999px;padding:1px 8px;font-size:10px;font-weight:600}
  @media print{
    body{padding:16px}
    @page{margin:15mm;size:A4 landscape}
    .no-print{display:none!important}
    thead tr{-webkit-print-color-adjust:exact;print-color-adjust:exact;background:#F9FAFB!important}
  }
</style></head><body>
<div class="no-print" style="margin-bottom:20px;display:flex;gap:12px">
  <button onclick="window.print()" style="background:#2563EB;color:#fff;border:none;border-radius:8px;padding:10px 20px;font-size:14px;font-weight:600;cursor:pointer">🖨 Print / Save PDF</button>
  <button onclick="window.close()" style="background:#F9FAFB;color:#374151;border:1px solid #E5E7EB;border-radius:8px;padding:10px 20px;font-size:14px;font-weight:500;cursor:pointer">Close</button>
</div>
<div class="doc-header">
  <div>
    <div class="org">SUTANA Enterprise</div>
    <div class="sub">Enterprise Management System · Payroll Division</div>
    <span class="badge">${monthName.toUpperCase()} ${year} · PAYROLL REGISTER</span>
  </div>
  <div class="meta">
    <div>Printed: <strong>${now.toLocaleDateString('en-GB',{day:'2-digit',month:'long',year:'numeric'})}</strong></div>
    <div>Time: <strong>${now.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</strong></div>
    <div>Status: <span class="status-pill">${summary?.approval_status || 'Draft'}</span></div>
    <div>Employees: <strong>${employees.length}</strong></div>
  </div>
</div>
<div class="summary">
  <div class="sc"><div class="sc-l">Total Employees</div><div class="sc-v blue">${employees.length}</div></div>
  <div class="sc"><div class="sc-l">Total Base Salary</div><div class="sc-v">${fmtN(totalBase)} ETB</div></div>
  <div class="sc"><div class="sc-l">Allowances + Extras</div><div class="sc-v green">+${fmtN(totalAllowances+totalExtras)} ETB</div></div>
  <div class="sc"><div class="sc-l">Total Deductions</div><div class="sc-v red">-${fmtN(totalDeductions)} ETB</div></div>
  <div class="sc"><div class="sc-l">Total Net Pay</div><div class="sc-v green">${fmtN(totalNet)} ETB</div></div>
</div>
<table>
<thead><tr>
  <th class="r">#</th>
  <th>Employee</th>
  <th>Department</th>
  <th class="r">Base Salary</th>
  <th class="r">Allowances</th>
  <th class="r">Extras</th>
  <th class="r">Deductions</th>
  <th class="r">Net Pay (ETB)</th>
</tr></thead>
<tbody>${rows}</tbody>
<tfoot><tr>
  <td colspan="3">TOTALS</td>
  <td class="r">${fmtN(totalBase)}</td>
  <td class="r plus">+${fmtN(totalAllowances)}</td>
  <td class="r plus">+${fmtN(totalExtras)}</td>
  <td class="r minus">-${fmtN(totalDeductions)}</td>
  <td class="r bold">${fmtN(totalNet)}</td>
</tr></tfoot>
</table>
<div class="sig-row">
  <div class="sig"><div class="sig-line">Prepared by — HR Manager</div></div>
  <div class="sig"><div class="sig-line">Approved by — CEO</div></div>
  <div class="sig"><div class="sig-line">Finance Authorized</div></div>
</div>
<div class="footer">
  <span>SUTANA Enterprise · Confidential Payroll Document</span>
  <span>Generated by ERP System · ${now.toISOString()}</span>
</div>
</body></html>`;
    if (printWin) { printWin.document.write(html); printWin.document.close(); }
  };

  return (
    <div className={styles.container}>

      {/* ── TRANSIENT TOAST (errors / quick confirmations) ── */}
      {toast && (
        <div className={`${styles.toast} ${toast.type === 'success' ? styles.toastSuccess : styles.toastError}`}>
          {toast.msg}
        </div>
      )}

      {/* ── PERSISTENT IN-APP SUBMISSION BANNER ── */}
      {submitBanner && (
        <div className={styles.submitBanner}>
          <div className={styles.submitBannerIcon}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="10" r="9" stroke="#16A34A" strokeWidth="1.5"/>
              <path d="M6 10l3 3 5-5" stroke="#16A34A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className={styles.submitBannerBody}>
            <div className={styles.submitBannerTitle}>{submitBanner.title}</div>
            <div className={styles.submitBannerDetail}>{submitBanner.detail}</div>
          </div>
          <div className={styles.submitBannerMeta}>
            <span className={styles.submitBannerTime}>Sent at {submitBanner.at}</span>
            <button
              className={styles.submitBannerClose}
              onClick={() => setSubmitBanner(null)}
              title="Dismiss"
            >
              ×
            </button>
          </div>
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

          {/* Payment Status — shows how many employees are paid */}
          {summary && employees.length > 0 && (() => {
            const isFullyPaid = summary.approval_status === 'Paid';
            const paidCount = isFullyPaid ? employees.length : employees.filter(e => e.payment_status === 'Paid').length;
            const total = employees.length;
            const allPaid = paidCount === total;
            const pct = total > 0 ? Math.round((paidCount / total) * 100) : 0;
            return (
              <div className={styles.metric} style={{ minWidth: 160 }}>
                <div className={styles.metricLbl}>Payment Progress</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: allPaid ? '#16A34A' : '#2563EB', lineHeight: 1 }}>
                    {paidCount}/{total}
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: allPaid ? '#15803d' : '#1d4ed8', textTransform: 'uppercase' }}>
                    {allPaid ? '✓ All Paid' : 'Paid'}
                  </div>
                </div>
                <div style={{ marginTop: 6, height: 5, background: '#E5E7EB', borderRadius: 99, overflow: 'hidden', width: 140 }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: allPaid ? '#16A34A' : '#3b82f6', borderRadius: 99, transition: 'width 0.4s' }} />
                </div>
              </div>
            );
          })()}

          <div className={styles.actionsMetric}>
            {isEditable && (
              <>
                <button className={styles.calcBtn} onClick={handleCalculate} disabled={calculating}>
                  {calculating ? (
                    <span className={styles.btnInner}>
                      <span className={styles.segSpinner} aria-hidden="true">
                        {Array.from({length: 12}).map((_, i) => (
                          <span key={i} className={styles.segTooth} style={{ '--i': i }} />
                        ))}
                      </span>
                      Calculating…
                    </span>
                  ) : 'Calculate Payroll'}
                </button>
                {summary && (
                  <button className={styles.submitBtn} onClick={handleSubmit} disabled={submitting}>
                    {submitting ? (
                      <span className={styles.btnInner}>
                        <span className={styles.segSpinner} aria-hidden="true">
                          {Array.from({length: 12}).map((_, i) => (
                            <span key={i} className={styles.segTooth} style={{ '--i': i }} />
                          ))}
                        </span>
                        Submitting…
                      </span>
                    ) : 'Submit to CEO'}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      
      {/* ── TAB BAR ── */}
      <div className={styles.tabBar}>
        <button
          className={`${styles.tab} ${activeTab === 'sheet' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('sheet')}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
          Payroll Sheet
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'print' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('print')}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
          Print Preview
          {employees.length > 0 && <span className={styles.tabBadge}>{employees.length}</span>}
        </button>
      </div>

      {/* ── MAIN BODY ── */}
      <div className={styles.bodyArea}>

        {summary && summary.rejection_reason && (
          <div className={styles.feedback}>
            <strong>CEO Feedback: </strong>
            <span>{summary.rejection_reason}</span>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════
            FULLY PAID — show archive card, clear path to next month
            ═══════════════════════════════════════════════════════ */}
        {isFullyPaid ? (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: '60px 32px', textAlign: 'center',
          }}>
            {/* Trophy banner */}
            <div style={{
              width: 88, height: 88, borderRadius: '50%',
              background: 'linear-gradient(135deg,#dcfce7,#bbf7d0)',
              border: '3px solid #86efac',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 40, marginBottom: 20,
              boxShadow: '0 8px 32px rgba(22,163,74,0.18)',
            }}>✅</div>

            <h2 style={{ fontSize: 26, fontWeight: 800, color: '#14532d', margin: '0 0 8px' }}>
              {monthName} {year} Payroll — Fully Paid
            </h2>
            <p style={{ fontSize: 15, color: '#15803d', margin: '0 0 32px', fontWeight: 500 }}>
              All {employees.length} employee{employees.length !== 1 ? 's' : ''} have been paid.
              This payroll has been archived.
            </p>

            {/* Compact archive summary */}
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))',
              gap: 1, background: '#e2e8f0', border: '1px solid #e2e8f0',
              borderRadius: 14, overflow: 'hidden', marginBottom: 40, width: '100%', maxWidth: 680,
            }}>
              {[
                { label: 'Period',       val: `${monthName} ${year}` },
                { label: 'Employees',    val: employees.length },
                { label: 'Total Net Pay',val: `${formatCurrency(summary.company_net_pay)} ETB` },
                { label: 'Status',       val: '✓ Paid', green: true },
              ].map((k, i) => (
                <div key={i} style={{ background: '#fff', padding: '18px 20px' }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 6 }}>{k.label}</div>
                  <div style={{ fontSize: 17, fontWeight: 800, color: k.green ? '#16a34a' : '#0f172a' }}>{k.val}</div>
                </div>
              ))}
            </div>

            {/* CTA buttons */}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
              <button
                onClick={handleStartNextMonth}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 10,
                  padding: '14px 32px', background: 'linear-gradient(135deg,#16a34a,#15803d)',
                  color: '#fff', border: 'none', borderRadius: 12,
                  fontSize: 15, fontWeight: 700, cursor: 'pointer',
                  boxShadow: '0 4px 16px rgba(22,163,74,0.35)',
                  transition: 'transform .15s,box-shadow .15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform='scale(1.03)'; e.currentTarget.style.boxShadow='0 6px 24px rgba(22,163,74,0.45)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform='scale(1)';    e.currentTarget.style.boxShadow='0 4px 16px rgba(22,163,74,0.35)'; }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                Start {month === 12 ? `January ${year + 1}` : `${new Date(2000, month).toLocaleString('default', { month: 'long' })} ${year}`} Payroll
              </button>
              <button
                onClick={handlePrint}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '14px 24px', background: '#fff',
                  color: '#374151', border: '1.5px solid #e2e8f0', borderRadius: 12,
                  fontSize: 14, fontWeight: 600, cursor: 'pointer',
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                Print Archive
              </button>
            </div>
          </div>

        ) : loading ? (
          <div className={styles.loading}>
            <span className={styles.segSpinnerLg} aria-hidden="true">
              {Array.from({length: 12}).map((_, i) => (
                <span key={i} className={styles.segToothLg} style={{ '--i': i }} />
              ))}
            </span>
            <span>Loading payroll data…</span>
          </div>
        ) : activeTab === 'print' ? (
          /* ── PRINT PREVIEW TAB ── */
          <div className={styles.printPreview}>
            {employees.length === 0 ? (
              <div className={styles.empty}>
                <p>No payroll data to print. Load and calculate payroll first.</p>
              </div>
            ) : (
              <>
                {/* Toolbar */}
                <div className={styles.printToolbar}>
                  <div className={styles.printDocInfo}>
                    <span className={styles.printDocTitle}>Payroll Register — {monthName} {year}</span>
                    <span className={styles.printDocMeta}>{employees.length} employees · Status: <strong>{summary?.approval_status || 'Draft'}</strong></span>
                  </div>
                  <button className={styles.printBtn} onClick={handlePrint}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                    Print / Save PDF
                  </button>
                </div>

                {/* Summary KPIs */}
                <div className={styles.printKPIRow}>
                  <div className={styles.printKPI}>
                    <div className={styles.printKPILabel}>Employees</div>
                    <div className={styles.printKPIValue} style={{color:'var(--color-primary)'}}>{employees.length}</div>
                  </div>
                  <div className={styles.printKPI}>
                    <div className={styles.printKPILabel}>Total Base Salary</div>
                    <div className={styles.printKPIValue}>{fmtN(totalBase)} <span>ETB</span></div>
                  </div>
                  <div className={styles.printKPI}>
                    <div className={styles.printKPILabel}>Allowances + Extras</div>
                    <div className={styles.printKPIValue} style={{color:'var(--color-success)'}}>+{fmtN(totalAllowances + totalExtras)} <span>ETB</span></div>
                  </div>
                  <div className={styles.printKPI}>
                    <div className={styles.printKPILabel}>Total Deductions</div>
                    <div className={styles.printKPIValue} style={{color:'var(--color-danger)'}}>-{fmtN(totalDeductions)} <span>ETB</span></div>
                  </div>
                  <div className={`${styles.printKPI} ${styles.printKPINet}`}>
                    <div className={styles.printKPILabel}>Total Net Pay</div>
                    <div className={styles.printKPIValue} style={{color:'var(--color-success)', fontSize:'20px', fontWeight:700}}>{fmtN(totalNet)} <span>ETB</span></div>
                  </div>
                </div>

                {/* Preview Table */}
                <div className={styles.tableWrapper}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th style={{width:36}}>#</th>
                        <th>Employee</th>
                        <th>Department</th>
                        <th className={styles.right}>Base Salary</th>
                        <th className={styles.right}>Allowances</th>
                        <th className={styles.right}>Extras</th>
                        <th className={styles.right}>Deductions</th>
                        <th className={styles.right}>Net Pay (ETB)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {employees.map((emp, idx) => {
                        const allow = Number(emp.housing_allowance||0)+Number(emp.transport_allowance||0)+Number(emp.communication_allowance||0);
                        const extras = Number(emp.overtime_pay||0)+Number(emp.bonus_pay||0);
                        const deduct = Number(emp.deduction_absent||0)+Number(emp.deduction_loan||0)+Number(emp.deduction_tax||0)+Number(emp.deduction_pension||0);
                        return (
                          <tr key={emp.employee_id}>
                            <td className={styles.rowNum}>{idx+1}</td>
                            <td>
                              <div className={styles.empName}>{emp.full_name}</div>
                              <div className={styles.empId}>#{emp.employee_id}</div>
                            </td>
                            <td className={styles.deptCell}>{emp.dept_name || emp.dept_id || '—'}</td>
                            <td className={styles.right}>{fmtN(emp.base_salary)}</td>
                            <td className={`${styles.right} ${styles.valPlus}`}>{allow > 0 ? `+${fmtN(allow)}` : '—'}</td>
                            <td className={`${styles.right} ${styles.valExtra}`}>{extras > 0 ? `+${fmtN(extras)}` : '—'}</td>
                            <td className={`${styles.right} ${styles.valMinus}`}>{deduct > 0 ? `-${fmtN(deduct)}` : '—'}</td>
                            <td className={`${styles.right} ${styles.valNet}`}>{fmtN(emp.net_pay)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className={styles.totalRow}>
                        <td colSpan={3} className={styles.totalLabel}>TOTALS</td>
                        <td className={styles.right}>{fmtN(totalBase)}</td>
                        <td className={`${styles.right} ${styles.valPlus}`}>+{fmtN(totalAllowances)}</td>
                        <td className={`${styles.right} ${styles.valExtra}`}>+{fmtN(totalExtras)}</td>
                        <td className={`${styles.right} ${styles.valMinus}`}>-{fmtN(totalDeductions)}</td>
                        <td className={`${styles.right} ${styles.valNet}`} style={{fontWeight:700}}>{fmtN(totalNet)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Signature footer */}
                <div className={styles.printSignatures}>
                  <div className={styles.sigBox}><div className={styles.sigLine}>Prepared by — HR Manager</div></div>
                  <div className={styles.sigBox}><div className={styles.sigLine}>Approved by — CEO</div></div>
                  <div className={styles.sigBox}><div className={styles.sigLine}>Finance Authorized</div></div>
                </div>
              </>
            )}
          </div>
        ) : (
          /* ── PAYROLL SHEET TAB (original) ── */
          employees.length === 0 ? (
            <div className={styles.empty}>
              <p>No payroll data generated for {month}/{year}.</p>
              {isEditable && <p style={{ fontSize: '12px', marginTop: '8px' }}>Click "Calculate Payroll" to draft the salary sheet.</p>}
            </div>
          ) : (
            <div className={styles.tableWrapper}>
              <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '10px 16px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontSize: 13, fontWeight: 600, color: '#64748b' }}>
                <span style={{ color: '#16a34a', fontWeight: 800, marginRight: 4 }}>{summary?.approval_status === 'Paid' ? employees.length : employees.filter(e => e.payment_status === 'Paid').length}</span> / {employees.length} employees paid
              </div>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th className={styles.right}>Base Salary</th>
                    <th className={styles.right}>Allowances</th>
                    <th className={styles.right}>Extras</th>
                    <th className={styles.right}>Deductions</th>
                    <th className={styles.right}>Net Pay</th>
                    <th style={{ textAlign: 'left' }}>Payment Method</th>
                    <th style={{ textAlign: 'center' }}>Payment</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((emp) => {
                    const totalAllowances = Number(emp.housing_allowance || 0) + Number(emp.transport_allowance || 0) + Number(emp.communication_allowance || 0);
                    const totalExtras = Number(emp.overtime_pay || 0) + Number(emp.bonus_pay || 0);
                    const totalDeductions = Number(emp.deduction_absent || 0) + Number(emp.deduction_loan || 0) + Number(emp.deduction_tax || 0) + Number(emp.deduction_pension || 0);
                    const isPaid = summary?.approval_status === 'Paid' || emp.payment_status === 'Paid';
                    const hasBank = emp.bank_account_number || emp.bank_name;
                    const payMethod = (emp.payment_method || 'Bank Transfer').toLowerCase();
                    const isCash = payMethod.includes('cash');

                    return (
                      <tr key={emp.employee_id} style={{ background: isPaid ? '#f0fdf4' : undefined }}>
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
                        <td style={{ textAlign: 'left' }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: isCash ? '#92400e' : '#0369a1', textTransform: 'uppercase' }}>
                            {isCash ? '💵 Cash' : '🏦 Bank'}
                          </div>
                          {hasBank && !isCash && (
                            <div style={{ fontSize: 11, color: '#64748b', fontFamily: 'monospace', marginTop: 2 }}>
                              {emp.bank_name}<br/>{emp.bank_account_number}
                            </div>
                          )}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          {isPaid ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700, background: '#dcfce7', color: '#15803d', border: '1px solid #86efac' }}>✓ Paid</span>
                          ) : (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700, background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' }}>⏳ Pending</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

          )
        )}
      </div>

    </div>
  );
};

export default HRPayrollDashboard;
