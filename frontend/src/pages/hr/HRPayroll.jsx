import React, { useState, useEffect } from 'react';
import hrService from '../../services/hrService';
import { playSuccessSound } from '../../utils/playNotificationSound';
import styles from './HRPayroll.module.css';

const HRPayroll = () => {
  const [salaries, setSalaries] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ type: null, text: '' });
  const [editForm, setEditForm] = useState({ baseSalary: 0, allowances: 0, bank_name: '', bank_account_number: '' });

  const fetchDepartments = async () => {
    try {
      const res = await hrService.etp.getDepartments();
      setDepartments(res.data?.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSalaries = async () => {
    setLoading(true);
    try {
      const params = {};
      if (department) params.department = department;
      const res = await hrService.getSalaries(params);
      setSalaries(res.data?.salaries || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    fetchSalaries();
  }, [department]);

  const handlePrint = () => {
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
    const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

    const rows = filteredSalaries.map((s, i) => `
      <tr class="${i % 2 === 0 ? 'even' : 'odd'}">
        <td>${i + 1}</td>
        <td>
          <div class="emp-name">${s.name || '—'}</div>
          <div class="emp-id">#${s.id}</div>
        </td>
        <td>${s.department || '—'}</td>
        <td>${s.role || '—'}</td>
        <td class="num">${fmtN(s.baseSalary)} ETB</td>
        <td class="num green">${s.allowances > 0 ? '+' + fmtN(s.allowances) + ' ETB' : '—'}</td>
        <td class="num bold">${fmtN(s.netSalary)} ETB</td>
        <td>${s.bankAccount || 'N/A'}</td>
      </tr>`).join('');

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Salary List — SUTANA Enterprise</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', sans-serif; background: #fff; color: #222; padding: 32px; }

    /* ── HEADER ── */
    .print-header { border-bottom: 4px solid #228B22; padding-bottom: 20px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-end; }
    .org-name { font-size: 26px; font-weight: 900; color: #1B5E20; letter-spacing: -0.02em; }
    .org-sub { font-size: 13px; color: #6B8E23; font-weight: 700; margin-top: 4px; }
    .print-meta { text-align: right; font-size: 12px; color: #424242; line-height: 1.7; }
    .print-meta strong { color: #1B5E20; }

    /* ── TITLE ── */
    .report-title { font-size: 20px; font-weight: 900; color: #228B22; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.05em; }
    .report-period { font-size: 13px; color: #6B8E23; font-weight: 700; margin-bottom: 24px; }

    /* ── SUMMARY CARDS ── */
    .summary { display: flex; gap: 0; border: 1.5px solid #228B22; margin-bottom: 28px; }
    .sum-card { flex: 1; padding: 14px 20px; border-right: 1px solid #228B22; }
    .sum-card:last-child { border-right: none; }
    .sum-label { font-size: 10px; font-weight: 800; color: #6B8E23; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 6px; }
    .sum-value { font-size: 18px; font-weight: 900; color: #1B5E20; }
    .sum-value span { font-size: 12px; color: #6B8E23; }

    /* ── TABLE ── */
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    thead tr { background: #1B5E20; }
    thead th { padding: 12px 10px; color: #ffffff; font-weight: 800; text-transform: uppercase; letter-spacing: 0.06em; text-align: left; font-size: 10px; }
    thead th.num { text-align: right; }
    tbody tr.even { background: #FFFFFF; }
    tbody tr.odd { background: #F1F8E9; }
    tbody tr td { padding: 10px; border-bottom: 1px solid #E8F5E9; vertical-align: middle; }
    .emp-name { font-weight: 800; color: #1B5E20; font-size: 13px; }
    .emp-id { color: #6B8E23; font-size: 10px; font-family: monospace; margin-top: 2px; }
    td.num { text-align: right; font-weight: 700; }
    td.green { color: #228B22; font-weight: 800; }
    td.bold { font-weight: 900; color: #1B5E20; border: 1px solid #4CAF50; padding: 6px 10px; }

    /* ── FOOTER ── */
    .print-footer { margin-top: 40px; border-top: 2px solid #8D6E63; padding-top: 16px; display: flex; justify-content: space-between; font-size: 11px; color: #6B8E23; font-weight: 700; }
    .sig-line { border-top: 1px solid #424242; margin-top: 40px; width: 180px; font-size: 10px; padding-top: 6px; color: #424242; }
    .sigs { display: flex; justify-content: space-between; margin-top: 48px; }

    @media print {
      body { padding: 20px; }
      @page { margin: 18mm; size: A4 landscape; }
      thead th { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: #1B5E20 !important; }
      tbody tr.odd { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: #F1F8E9 !important; }
    }
  </style>
</head>
<body>
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

  <div class="report-title">Staff Salary List</div>
  <div class="report-period">Generated on ${dateStr} &nbsp;|&nbsp; ${filteredSalaries.length} staff member(s)</div>

  <div class="summary">
    <div class="sum-card">
      <div class="sum-label">Total Staff</div>
      <div class="sum-value">${filteredSalaries.length}</div>
    </div>
    <div class="sum-card">
      <div class="sum-label">Total Base Salary</div>
      <div class="sum-value">${fmtN(totalBase)} <span>ETB</span></div>
    </div>
    <div class="sum-card">
      <div class="sum-label">Total Net Salary</div>
      <div class="sum-value">${fmtN(totalNet)} <span>ETB</span></div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Employee</th>
        <th>Department</th>
        <th>Role</th>
        <th class="num">Base Salary</th>
        <th class="num">Allowances</th>
        <th class="num">Net Salary</th>
        <th>Bank Account</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
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
</body>
</html>`;

    const win = window.open('', '_blank', 'width=1100,height=800');
    if (win) {
      win.document.write(html);
      win.document.close();
    }
  };

  const openEdit = (emp) => {
    setSelectedEmp(emp);
    setEditForm({
      baseSalary: emp.baseSalary,
      allowances: emp.allowances,
      bank_name: emp.bank_name || '',
      bank_account_number: (emp.bankAccount && emp.bankAccount !== 'N/A') ? emp.bankAccount : '',
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

  const filteredSalaries = salaries.filter(s =>
    (s.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (s.id || '').toLowerCase().includes(search.toLowerCase())
  );

  const totalNet = filteredSalaries.reduce((sum, s) => sum + (s.netSalary || 0), 0);
  const totalBase = filteredSalaries.reduce((sum, s) => sum + (s.baseSalary || 0), 0);
  const fmtN = (n) => parseFloat(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className={styles.container}>

      {/* ── IN-APP STATUS NOTIFICATION (Rule 6: no alerts) ── */}
      {statusMsg.text && (
        <div className={`${styles.statusMessage} ${statusMsg.type === 'success' ? styles.statusSuccess : styles.statusError}`}>
          {statusMsg.text}
        </div>
      )}

      {/* ── HEADER (Rule 2, 3, 11) ── */}
      <div className={styles.header}>
        <div className={styles.topRow}>
          <div>
            <div className={styles.badge}>
              <span className={styles.badgeDot} />
              <span className={styles.badgeTxt}>Finance · Salary List</span>
            </div>
            <h1 className={styles.pageTitle}>
              Employee <span>Salaries</span>
            </h1>
            <p className={styles.pageSubtitle}>
              Manage base salaries, allowances, and banking information.
            </p>
          </div>

          <button className={styles.exportBtn} onClick={handlePrint}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <polyline points="6 9 6 2 18 2 18 9"></polyline>
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
              <rect x="6" y="14" width="12" height="8"></rect>
            </svg>
            Print
          </button>
        </div>

        {/* Metric Cards (Rule 3: Sharp corners) */}
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
              <div className={styles.metricLbl}>Total Net Salary</div>
              <div className={styles.metricValNet}>{fmtN(totalNet)} <span>ETB</span></div>
            </div>
          </div>
        )}
      </div>

      {/* ── FILTERS (Rule 14: Bold border on inputs) ── */}
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

      {/* ── BODY & TABLE (Rule 4, 5, 15) ── */}
      <div className={styles.bodyArea}>
        {loading ? (
          <div className={styles.loading}>● Loading salaries...</div>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Department &amp; Role</th>
                  <th className={styles.right}>Base Salary</th>
                  <th className={styles.right}>Allowances</th>
                  <th className={styles.right}>Net Salary</th>
                  <th>Bank Account</th>
                  <th className={styles.center}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredSalaries.length === 0 ? (
                  <tr>
                    <td colSpan={7} className={styles.empty}>
                      No records match your search.
                    </td>
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
                          {s.allowances > 0 ? `+${fmtN(s.allowances)} ETB` : '—'}
                        </span>
                      </td>
                      <td className={styles.right}>
                        <span className={styles.currencyNet}>{fmtN(s.netSalary)}</span>
                      </td>
                      <td>
                        <span className={styles.bankBadge}>{s.bankAccount || 'N/A'}</span>
                      </td>
                      <td className={styles.center}>
                        <button className={styles.editBtn} onClick={() => openEdit(s)}>
                          Edit
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

      {/* ── EDIT MODAL (Rule 10, 14, 17: Form with sharp fields, bold borders) ── */}
      {showEditModal && (
        <div className={styles.modalOverlay} onClick={() => !saving && setShowEditModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>

            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Edit Salary — {selectedEmp?.name}</h2>
              <button className={styles.closeBtn} onClick={() => setShowEditModal(false)}>×</button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.empMeta}>
                <strong>ID:</strong> {selectedEmp?.id} &nbsp;|&nbsp;
                <strong>Dept:</strong> {selectedEmp?.department}
              </div>

              <div className={styles.formGroup}>
                <label>Base Salary (ETB)</label>
                <input
                  type="number" min="0" step="0.01"
                  value={editForm.baseSalary}
                  onChange={e => setEditForm({ ...editForm, baseSalary: Number(e.target.value) })}
                  className={styles.input}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Total Allowances (Housing + Transport)</label>
                <input
                  type="number" min="0" step="0.01"
                  value={editForm.allowances}
                  onChange={e => setEditForm({ ...editForm, allowances: Number(e.target.value) })}
                  className={styles.input}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Bank Name</label>
                <input
                  type="text"
                  placeholder="e.g. Commercial Bank of Ethiopia"
                  value={editForm.bank_name}
                  onChange={e => setEditForm({ ...editForm, bank_name: e.target.value })}
                  className={styles.input}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Bank Account Number</label>
                <input
                  type="text"
                  placeholder="Enter account number"
                  value={editForm.bank_account_number}
                  onChange={e => setEditForm({ ...editForm, bank_account_number: e.target.value })}
                  className={styles.input}
                />
              </div>

              <div className={styles.netEstimate}>
                Estimated Net Salary: {fmtN(editForm.baseSalary + editForm.allowances)} ETB
              </div>
            </div>

            <div className={styles.modalActions}>
              <button className={styles.cancelBtn} onClick={() => setShowEditModal(false)} disabled={saving}>
                Cancel
              </button>
              <button className={styles.saveBtn} onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default HRPayroll;
