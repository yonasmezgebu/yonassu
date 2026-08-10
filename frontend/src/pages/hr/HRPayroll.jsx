import React, { useState, useEffect } from 'react';
import hrService from '../../services/hrService';
import { playSuccessSound } from '../../utils/playNotificationSound';
import styles from './HRPayroll.module.css';

const fmtN = (n) => parseFloat(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const HRPayroll = () => {
  const [salaries, setSalaries]       = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [department, setDepartment]   = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [saving, setSaving]           = useState(false);
  const [statusMsg, setStatusMsg]     = useState({ type: null, text: '' });
  const [editForm, setEditForm]       = useState({
    baseSalary: 0, housingAllowance: 0, transportAllowance: 0,
    communicationAllowance: 0, overtimeRate: 1.5,
    bank_name: '', bank_account_number: ''
  });

  const fetchDepartments = async () => {
    try {
      const res = await hrService.etp.getDepartments();
      setDepartments(res.data?.data || []);
    } catch (err) { console.error(err); }
  };

  const fetchSalaries = async () => {
    setLoading(true);
    try {
      const params = {};
      if (department) params.department = department;
      const res = await hrService.getSalaries(params);
      setSalaries(res.data?.salaries || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchDepartments(); }, []);
  useEffect(() => { fetchSalaries(); }, [department]);

  /* ── derived totals ── */
  const filteredSalaries = salaries.filter(s =>
    (s.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (s.id   || '').toLowerCase().includes(search.toLowerCase())
  );

  const totalBase    = filteredSalaries.reduce((sum, s) => sum + (s.baseSalary || 0), 0);
  const totalHousing = filteredSalaries.reduce((sum, s) => sum + (s.housingAllowance || 0), 0);
  const totalTrans   = filteredSalaries.reduce((sum, s) => sum + (s.transportAllowance || 0), 0);
  const totalComm    = filteredSalaries.reduce((sum, s) => sum + (s.communicationAllowance || 0), 0);
  const totalAllow   = totalHousing + totalTrans + totalComm;
  const totalOT      = filteredSalaries.reduce((sum, s) => sum + (s.overtimePayment || 0), 0);
  const totalNet     = filteredSalaries.reduce((sum, s) => sum + (s.netSalary || 0), 0);

  const deptSummary = filteredSalaries.reduce((acc, s) => {
    const dept = s.department || 'Unknown';
    if (!acc[dept]) acc[dept] = { count: 0, base: 0, allowances: 0, overtime: 0, net: 0 };
    acc[dept].count++;
    acc[dept].base       += s.baseSalary || 0;
    acc[dept].allowances += s.totalAllowances || 0;
    acc[dept].overtime   += s.overtimePayment || 0;
    acc[dept].net        += s.netSalary || 0;
    return acc;
  }, {});

  /* ── edit handlers ── */
  const openEdit = (emp) => {
    setSelectedEmp(emp);
    setEditForm({
      baseSalary:             emp.baseSalary,
      housingAllowance:       emp.housingAllowance       || 0,
      transportAllowance:     emp.transportAllowance     || 0,
      communicationAllowance: emp.communicationAllowance || 0,
      overtimeRate:           emp.overtimeRate           || 1.5,
      overtimePayment:        emp.overtimePayment        || 0,
      bank_name:              emp.bank_name              || '',
      bank_account_number:    (emp.bankAccount && emp.bankAccount !== 'N/A') ? emp.bankAccount : '',
    });
    setStatusMsg({ type: null, text: '' });
    setShowEditModal(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setStatusMsg({ type: null, text: '' });
    try {
      await hrService.updateSalary(selectedEmp.id, editForm);
      playSuccessSound();
      setStatusMsg({ type: 'success', text: `Salary updated for ${selectedEmp.name}.` });
      setShowEditModal(false);
      fetchSalaries();
    } catch (err) {
      setStatusMsg({ type: 'error', text: err?.response?.data?.message || 'Failed to update salary.' });
    } finally {
      setSaving(false);
    }
  };

  const editNet = editForm.baseSalary + editForm.housingAllowance + editForm.transportAllowance + editForm.communicationAllowance + (editForm.overtimePayment || 0);

  /* ── print report ── */
  const handlePrint = () => {
    const now     = new Date();
    const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
    const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

    const rows = filteredSalaries.map((s, i) => `
      <tr class="${i % 2 === 0 ? 'even' : 'odd'}">
        <td>${i + 1}</td>
        <td><div class="emp-name">${s.name || '—'}</div><div class="emp-id">#${s.id}</div></td>
        <td>${s.department || '—'}</td>
        <td>${s.role || '—'}</td>
        <td class="num">${fmtN(s.baseSalary)} ETB</td>
        <td class="num green">${s.housingAllowance > 0 ? fmtN(s.housingAllowance) : '—'}</td>
        <td class="num green">${s.transportAllowance > 0 ? fmtN(s.transportAllowance) : '—'}</td>
        <td class="num green">${s.communicationAllowance > 0 ? fmtN(s.communicationAllowance) : '—'}</td>
        <td class="num bold">${s.overtimePayment > 0 ? fmtN(s.overtimePayment) : '—'}</td>
        <td class="num bold">${fmtN(s.netSalary)} ETB</td>
        <td>${s.bankAccount || 'N/A'}</td>
      </tr>`).join('');

    const deptRows = Object.entries(deptSummary).map(([dept, d]) => `
      <tr>
        <td><strong>${dept}</strong></td>
        <td class="num">${d.count}</td>
        <td class="num">${fmtN(d.base)} ETB</td>
        <td class="num green">${fmtN(d.allowances)} ETB</td>
        <td class="num bold">${fmtN(d.overtime)} ETB</td>
        <td class="num bold">${fmtN(d.net)} ETB</td>
      </tr>`).join('');

    const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"/>
<title>Salary Report — SUTANA Enterprise</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap');
  * { box-sizing:border-box; margin:0; padding:0; }
  body { font-family:'Inter',sans-serif; background:#fff; color:#1a1a1a; padding:28px 32px; }
  .print-header { border-bottom:4px solid #2563EB; padding-bottom:18px; margin-bottom:22px; display:flex; justify-content:space-between; align-items:flex-end; }
  .org-name { font-size:24px; font-weight:900; color:#1D4ED8; }
  .org-sub  { font-size:12px; color:#6B7280; font-weight:600; margin-top:3px; }
  .print-meta { text-align:right; font-size:11px; color:#374151; line-height:1.8; }
  .print-meta strong { color:#2563EB; }
  .report-title { font-size:18px; font-weight:800; color:#1D4ED8; margin-bottom:3px; }
  .report-sub   { font-size:12px; color:#6B7280; font-weight:600; margin-bottom:20px; }

  /* summary cards */
  .summary { display:flex; gap:0; border:1.5px solid #2563EB; margin-bottom:24px; border-radius:6px; overflow:hidden; }
  .sum-card { flex:1; padding:12px 16px; border-right:1px solid #BFDBFE; }
  .sum-card:last-child { border-right:none; }
  .sum-label { font-size:9px; font-weight:700; color:#6B7280; text-transform:uppercase; letter-spacing:.08em; margin-bottom:4px; }
  .sum-value { font-size:15px; font-weight:800; color:#1D4ED8; }
  .sum-value span { font-size:11px; color:#6B7280; }

  /* main table */
  table { width:100%; border-collapse:collapse; font-size:11px; margin-bottom:28px; }
  thead tr { background:#1D4ED8; }
  thead th { padding:9px 8px; color:#fff; font-weight:700; text-transform:uppercase; letter-spacing:.05em; text-align:left; font-size:9px; }
  thead th.num { text-align:right; }
  tbody tr.even { background:#fff; }
  tbody tr.odd  { background:#EFF6FF; }
  tbody td { padding:8px; border-bottom:1px solid #DBEAFE; vertical-align:middle; }
  .emp-name { font-weight:700; color:#111827; font-size:12px; }
  .emp-id   { color:#6B7280; font-size:9px; font-family:monospace; margin-top:1px; }
  td.num  { text-align:right; font-weight:600; }
  td.green { color:#16A34A; }
  td.bold  { font-weight:800; color:#1D4ED8; border:1px solid #93C5FD; }

  /* dept summary */
  .section-title { font-size:13px; font-weight:700; color:#1D4ED8; margin-bottom:10px; border-bottom:2px solid #BFDBFE; padding-bottom:6px; }
  .dept-table { width:100%; border-collapse:collapse; font-size:11px; margin-bottom:28px; }
  .dept-table thead tr { background:#EFF6FF; }
  .dept-table thead th { padding:8px; font-size:9px; font-weight:700; color:#1D4ED8; text-transform:uppercase; border:1px solid #BFDBFE; }
  .dept-table thead th.num { text-align:right; }
  .dept-table td { padding:8px; border:1px solid #DBEAFE; }
  .dept-table td.num  { text-align:right; font-weight:600; }
  .dept-table td.green { color:#16A34A; }
  .dept-table td.bold  { font-weight:800; color:#1D4ED8; }

  /* sigs / footer */
  .sigs { display:flex; justify-content:space-between; margin-top:48px; }
  .sig-line { border-top:1px solid #374151; margin-top:40px; width:180px; font-size:10px; padding-top:6px; color:#374151; }
  .print-footer { margin-top:24px; border-top:2px solid #BFDBFE; padding-top:12px; display:flex; justify-content:space-between; font-size:10px; color:#6B7280; }
  @media print {
    body { padding:16px; }
    @page { margin:14mm; size:A4 landscape; }
    thead tr { -webkit-print-color-adjust:exact; print-color-adjust:exact; background:#1D4ED8 !important; }
    tbody tr.odd { -webkit-print-color-adjust:exact; print-color-adjust:exact; background:#EFF6FF !important; }
    .dept-table thead tr { -webkit-print-color-adjust:exact; print-color-adjust:exact; background:#EFF6FF !important; }
  }
</style></head><body>
  <div class="print-header">
    <div>
      <div class="org-name">SUTANA Enterprise</div>
      <div class="org-sub">Enterprise Management System</div>
    </div>
    <div class="print-meta">
      <strong>Printed:</strong> ${dateStr} at ${timeStr}<br/>
      <strong>Report:</strong> Staff Salary List<br/>
      <strong>Total Records:</strong> ${filteredSalaries.length}
    </div>
  </div>

  <div class="report-title">Employee Salary Report</div>
  <div class="report-sub">Generated on ${dateStr} &nbsp;|&nbsp; ${filteredSalaries.length} active employee(s)</div>

  <div class="summary">
    <div class="sum-card"><div class="sum-label">Total Staff</div><div class="sum-value">${filteredSalaries.length}</div></div>
    <div class="sum-card"><div class="sum-label">Total Base Salary</div><div class="sum-value">${fmtN(totalBase)} <span>ETB</span></div></div>
    <div class="sum-card"><div class="sum-label">Total Allowances</div><div class="sum-value">${fmtN(totalAllow)} <span>ETB</span></div></div>
    <div class="sum-card"><div class="sum-label">Total Overtime</div><div class="sum-value">${fmtN(totalOT)} <span>ETB</span></div></div>
    <div class="sum-card"><div class="sum-label">Total Net Salary</div><div class="sum-value">${fmtN(totalNet)} <span>ETB</span></div></div>
  </div>

  <table>
    <thead><tr>
      <th>#</th><th>Employee</th><th>Department</th><th>Role</th>
      <th class="num">Base Salary</th>
      <th class="num">Housing Allow.</th>
      <th class="num">Transport Allow.</th>
      <th class="num">Comm. Allow.</th>
      <th class="num">Overtime Pay</th>
      <th class="num">Net Salary</th>
      <th>Bank Account</th>
    </tr></thead>
    <tbody>${rows}</tbody>
  </table>

  <div class="section-title">Department-wise Salary Summary</div>
  <table class="dept-table">
    <thead><tr>
      <th>Department</th>
      <th class="num">Staff Count</th>
      <th class="num">Total Base Salary</th>
      <th class="num">Total Allowances</th>
      <th class="num">Total Overtime</th>
      <th class="num">Total Net Salary</th>
    </tr></thead>
    <tbody>${deptRows}</tbody>
  </table>

  <div class="sigs">
    <div><div class="sig-line">HR Manager Signature</div></div>
    <div><div class="sig-line">Finance Manager Signature</div></div>
    <div><div class="sig-line">CEO Approval</div></div>
  </div>
  <div class="print-footer">
    <span>SUTANA Enterprise Management System — Confidential</span>
    <span>Page 1 of 1</span>
  </div>
  <script>window.onload = function() { window.print(); }<\/script>
</body></html>`;

    const win = window.open('', '_blank', 'width=1200,height=900');
    if (win) { win.document.write(html); win.document.close(); }
  };

  return (
    <div className={styles.container}>

      {statusMsg.text && (
        <div className={`${styles.statusMessage} ${statusMsg.type === 'success' ? styles.statusSuccess : styles.statusError}`}>
          {statusMsg.text}
        </div>
      )}

      {/* ── HEADER ── */}
      <div className={styles.header}>
        <div className={styles.topRow}>
          <div>
            <div className={styles.badge}>
              <span className={styles.badgeDot} />
              <span className={styles.badgeTxt}>Finance · Salary List</span>
            </div>
            <h1 className={styles.pageTitle}>Employee <span>Salaries</span></h1>
            <p className={styles.pageSubtitle}>
              Manage base salaries, allowances, overtime rates, and banking information.
            </p>
          </div>
          <button className={styles.exportBtn} onClick={handlePrint}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <polyline points="6 9 6 2 18 2 18 9"></polyline>
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
              <rect x="6" y="14" width="12" height="8"></rect>
            </svg>
            Print Report
          </button>
        </div>

        {/* Summary metric cards */}
        {!loading && filteredSalaries.length > 0 && (
          <div className={styles.metrics}>
            <div className={styles.metric}>
              <div className={styles.metricLbl}>Total Staff</div>
              <div className={styles.metricVal}>{filteredSalaries.length}</div>
            </div>
            <div className={styles.metric}>
              <div className={styles.metricLbl}>Total Base Salary</div>
              <div className={styles.metricVal}>{fmtN(totalBase)} <span>ETB</span></div>
            </div>
            <div className={styles.metric}>
              <div className={styles.metricLbl}>Housing Allow.</div>
              <div className={styles.metricVal}>{fmtN(totalHousing)} <span>ETB</span></div>
            </div>
            <div className={styles.metric}>
              <div className={styles.metricLbl}>Transport Allow.</div>
              <div className={styles.metricVal}>{fmtN(totalTrans)} <span>ETB</span></div>
            </div>
            <div className={styles.metric}>
              <div className={styles.metricLbl}>Comm. Allow.</div>
              <div className={styles.metricVal}>{fmtN(totalComm)} <span>ETB</span></div>
            </div>
            <div className={styles.metric}>
              <div className={styles.metricLbl}>Total Net Salary</div>
              <div className={styles.metricValNet}>{fmtN(totalNet)} <span>ETB</span></div>
            </div>
          </div>
        )}
      </div>

      {/* ── FILTERS ── */}
      <div className={styles.filters}>
        <div className={styles.searchBox}>
          <svg className={styles.searchIcon} width="20" height="20" viewBox="0 0 24 24" fill="none" strokeWidth="2.5" stroke="currentColor">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search by name or ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select className={styles.filterSelect} value={department} onChange={e => setDepartment(e.target.value)}>
          <option value="">All Departments</option>
          {departments.map(d => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
      </div>

      {/* ── TABLE ── */}
      <div className={styles.bodyArea}>
        {loading ? (
          <div className={styles.loading}>
            <span className={styles.segSpinnerLg} aria-hidden="true" />
            <span>Loading salaries…</span>
          </div>
        ) : (
          <>
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Department &amp; Role</th>
                    <th className={styles.right}>Base Salary</th>
                    <th className={styles.right}>Housing Allow.</th>
                    <th className={styles.right}>Transport Allow.</th>
                    <th className={styles.right}>Comm. Allow.</th>
                    <th className={styles.center}>OT Rate</th>
                    <th className={styles.right}>OT Payment</th>
                    <th className={styles.right}>Net Salary</th>
                    <th>Bank Account</th>
                    <th className={styles.center}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSalaries.length === 0 ? (
                    <tr>
                      <td colSpan={11} className={styles.empty}>No records match your search.</td>
                    </tr>
                  ) : (
                    filteredSalaries.map((s) => (
                      <tr key={s.id}>
                        <td>
                          <div className={styles.empName}>{s.name}</div>
                          <div className={styles.empId}>#{s.id}</div>
                        </td>
                        <td>
                          <div className={styles.deptName}>{s.department || '—'}</div>
                          <div className={styles.roleName}>{s.role || '—'}</div>
                        </td>
                        <td className={styles.right}>
                          <span className={styles.currency}>{fmtN(s.baseSalary)} ETB</span>
                        </td>
                        <td className={styles.right}>
                          <span className={styles.currencyPlus}>
                            {s.housingAllowance > 0 ? `+${fmtN(s.housingAllowance)} ETB` : '—'}
                          </span>
                        </td>
                        <td className={styles.right}>
                          <span className={styles.currencyPlus}>
                            {s.transportAllowance > 0 ? `+${fmtN(s.transportAllowance)} ETB` : '—'}
                          </span>
                        </td>
                        <td className={styles.right}>
                          <span className={styles.currencyPlus}>
                            {s.communicationAllowance > 0 ? `+${fmtN(s.communicationAllowance)} ETB` : '—'}
                          </span>
                        </td>
                        <td className={styles.center}>
                          <span className={styles.otBadge}>{s.overtimeRate || 1.5}x</span>
                        </td>
                        <td className={styles.right}>
                          <span className={styles.currencyPlus}>
                            {s.overtimePayment > 0 ? `+${fmtN(s.overtimePayment)} ETB` : '—'}
                          </span>
                        </td>
                        <td className={styles.right}>
                          <span className={styles.currencyNet}>{fmtN(s.netSalary)}</span>
                        </td>
                        <td>
                          <div className={styles.bankName}>{s.bank_name || '—'}</div>
                          <div className={styles.bankBadge}>{s.bankAccount || 'N/A'}</div>
                        </td>
                        <td className={styles.center}>
                          <button className={styles.editBtn} onClick={() => openEdit(s)}>Edit</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* ── DEPARTMENT SUMMARY ── */}
            {Object.keys(deptSummary).length > 0 && (
              <div className={styles.deptSummarySection}>
                <div className={styles.sectionTitle}>
                  <span>📊</span> Department-wise Salary Summary
                </div>
                <div className={styles.tableWrapper}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Department</th>
                        <th className={styles.center}>Staff Count</th>
                        <th className={styles.right}>Total Base Salary</th>
                        <th className={styles.right}>Total Allowances</th>
                        <th className={styles.right}>Total OT</th>
                        <th className={styles.right}>Total Net Salary</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(deptSummary).sort((a, b) => b[1].net - a[1].net).map(([dept, d], idx) => (
                        <tr key={`${dept}-${idx}`}>
                          <td>
                            <div className={styles.deptName}>{dept}</div>
                          </td>
                          <td className={styles.center}>
                            <span className={styles.countBadge}>{d.count}</span>
                          </td>
                          <td className={styles.right}>
                            <span className={styles.currency}>{fmtN(d.base)} ETB</span>
                          </td>
                          <td className={styles.right}>
                            <span className={styles.currencyPlus}>+{fmtN(d.allowances)} ETB</span>
                          </td>
                          <td className={styles.right}>
                            <span className={styles.currencyPlus}>+{fmtN(d.overtime)} ETB</span>
                          </td>
                          <td className={styles.right}>
                            <span className={styles.currencyNet}>{fmtN(d.net)}</span>
                          </td>
                        </tr>
                      ))}
                      {/* Grand total row */}
                      <tr className={styles.totalRow}>
                        <td><strong>Grand Total</strong></td>
                        <td className={styles.center}><strong>{filteredSalaries.length}</strong></td>
                        <td className={styles.right}><strong>{fmtN(totalBase)} ETB</strong></td>
                        <td className={styles.right}><strong>+{fmtN(totalAllow)} ETB</strong></td>
                        <td className={styles.right}><strong>+{fmtN(totalOT)} ETB</strong></td>
                        <td className={styles.right}><strong>{fmtN(totalNet)} ETB</strong></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── EDIT MODAL ── */}
      {showEditModal && (
        <div className={styles.modalOverlay} onClick={() => !saving && setShowEditModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>

            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>✏️ Edit Salary — {selectedEmp?.name}</h2>
              <button className={styles.closeBtn} onClick={() => setShowEditModal(false)}>×</button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.empMeta}>
                <strong>ID:</strong> {selectedEmp?.id} &nbsp;|&nbsp;
                <strong>Dept:</strong> {selectedEmp?.department} &nbsp;|&nbsp;
                <strong>Role:</strong> {selectedEmp?.role}
              </div>

              <div className={styles.modalGrid}>
                <div className={styles.formGroup}>
                  <label>Base Salary (ETB)</label>
                  <input type="number" min="0" step="0.01" className={styles.input}
                    value={editForm.baseSalary}
                    onChange={e => setEditForm({ ...editForm, baseSalary: Number(e.target.value) })} />
                </div>

                <div className={styles.formGroup}>
                  <label>Housing Allowance (ETB)</label>
                  <input type="number" min="0" step="0.01" className={styles.input}
                    value={editForm.housingAllowance}
                    onChange={e => setEditForm({ ...editForm, housingAllowance: Number(e.target.value) })} />
                </div>

                <div className={styles.formGroup}>
                  <label>Transport Allowance (ETB)</label>
                  <input type="number" min="0" step="0.01" className={styles.input}
                    value={editForm.transportAllowance}
                    onChange={e => setEditForm({ ...editForm, transportAllowance: Number(e.target.value) })} />
                </div>

                <div className={styles.formGroup}>
                  <label>Communication Allowance (ETB)</label>
                  <input type="number" min="0" step="0.01" className={styles.input}
                    value={editForm.communicationAllowance}
                    onChange={e => setEditForm({ ...editForm, communicationAllowance: Number(e.target.value) })} />
                </div>

                <div className={styles.formGroup}>
                  <label>Overtime Rate Multiplier</label>
                  <input type="number" min="1" max="5" step="0.1" className={styles.input}
                    placeholder="e.g. 1.5"
                    value={editForm.overtimeRate}
                    onChange={e => setEditForm({ ...editForm, overtimeRate: Number(e.target.value) })} />
                </div>

                <div className={styles.formGroup}>
                  <label>Overtime Payment (ETB)</label>
                  <input type="number" min="0" step="0.01" className={styles.input}
                    placeholder="e.g. 2500.00"
                    value={editForm.overtimePayment}
                    onChange={e => setEditForm({ ...editForm, overtimePayment: Number(e.target.value) })} />
                </div>

                <div className={styles.formGroup}>
                  <label>Bank Name</label>
                  <input type="text" className={styles.input}
                    placeholder="e.g. Commercial Bank of Ethiopia"
                    value={editForm.bank_name}
                    onChange={e => setEditForm({ ...editForm, bank_name: e.target.value })} />
                </div>

                <div className={styles.formGroup}>
                  <label>Bank Account Number</label>
                  <input type="text" className={styles.input}
                    placeholder="Enter account number"
                    value={editForm.bank_account_number}
                    onChange={e => setEditForm({ ...editForm, bank_account_number: e.target.value })} />
                </div>
              </div>

              <div className={styles.netEstimate}>
                <span>💰 Estimated Net Salary:</span>
                <strong>{fmtN(editNet)} ETB</strong>
                <span className={styles.netBreakdown}>
                  ({fmtN(editForm.baseSalary)} base + {fmtN(editForm.housingAllowance + editForm.transportAllowance + editForm.communicationAllowance)} allowances + {fmtN(editForm.overtimePayment)} overtime)
                </span>
              </div>

              {statusMsg.text && (
                <div className={`${styles.modalStatus} ${statusMsg.type === 'success' ? styles.statusSuccess : styles.statusError}`}>
                  {statusMsg.text}
                </div>
              )}
            </div>

            <div className={styles.modalActions}>
              <button className={styles.cancelBtn} onClick={() => setShowEditModal(false)} disabled={saving}>Cancel</button>
              <button className={styles.saveBtn} onClick={handleSave} disabled={saving}>
                {saving ? <><span className={styles.segSpinner} aria-hidden="true" /> Saving…</> : '✔ Save Changes'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default HRPayroll;
