import React, { useState, useEffect, useCallback } from 'react';
import hrService from '../../services/hrService';
import { playInfoSound, playSuccessSound } from '../../utils/playNotificationSound';
import styles from './HRDeductions.module.css';

const INIT_FORM = {
  employeeId: '', type: 'Tax/PAYE', amountType: 'Fixed', amount: '', percentage: '',
  frequency: 'Monthly', startDate: '', endDate: '', description: ''
};

/* ── helpers ──────────────────────────────────────────────────── */
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB') : '—';
const fmtAmt  = (n) => parseFloat(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2 });

const HRDeductions = () => {
  const [deductions,  setDeductions]  = useState([]);
  const [employees,   setEmployees]   = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [showAddModal,setShowAddModal]= useState(false);
  const [formData,    setFormData]    = useState(INIT_FORM);
  const [saving,      setSaving]      = useState(false);
  const [statusMsg,   setStatusMsg]   = useState({ type: null, text: '' });
  const [confirmId,   setConfirmId]   = useState(null);   // for delete confirm

  /* ── fetch ──────────────────────────────────────────────── */
  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [empRes, dedRes] = await Promise.all([
        hrService.etp.listEmployees(),
        hrService.getDeductions()
      ]);
      setEmployees(empRes.data?.data || empRes.data || []);
      setDeductions(dedRes.data?.deductions || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const showNotif = (type, text) => {
    setStatusMsg({ type, text });
    setTimeout(() => setStatusMsg({ type: null, text: '' }), 5000);
  };

  /* ── derived: selected employee + preview amount ──────────── */
  const selectedEmp = employees.find(e => e.employee_id === formData.employeeId);
  const baseSalary  = parseFloat(selectedEmp?.base_salary || 0);

  const previewAmount = (() => {
    if (formData.amountType === 'Percentage') {
      const pct = parseFloat(formData.percentage);
      if (!isNaN(pct) && baseSalary > 0) return (baseSalary * pct) / 100;
    } else {
      const fixed = parseFloat(formData.amount);
      if (!isNaN(fixed)) return fixed;
    }
    return null;
  })();

  /* ── save ───────────────────────────────────────────────── */
  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setStatusMsg({ type: null, text: '' });
    try {
      let payload;
      if (formData.amountType === 'Percentage') {
        const pct = parseFloat(formData.percentage);
        if (isNaN(pct) || pct <= 0) throw new Error('Please enter a valid percentage value.');
        if (baseSalary <= 0) throw new Error('Selected employee has no base salary on record.');
        const resolvedAmount = (baseSalary * pct) / 100;
        payload = {
          ...formData,
          percentage: pct,
          resolvedAmount,
          amount: resolvedAmount,   // ETB stored in DB
        };
      } else {
        const fixed = parseFloat(formData.amount);
        if (isNaN(fixed) || fixed <= 0) throw new Error('Please enter a valid amount.');
        payload = { ...formData, amount: fixed };
      }

      await hrService.createDeduction(payload);
      playSuccessSound();
      showNotif('success', 'Deduction added successfully.');
      setShowAddModal(false);
      setFormData(INIT_FORM);
      fetchAll();
    } catch (err) {
      showNotif('error', err?.response?.data?.message || err?.message || 'Failed to add deduction.');
    } finally {
      setSaving(false);
    }
  };

  /* ── cancel (with in-app confirm modal) ──────────────────── */
  const handleCancel = async (id) => {
    try {
      await hrService.deleteDeduction(id);
      playInfoSound();
      showNotif('success', 'Deduction cancelled.');
      fetchAll();
    } catch (err) {
      showNotif('error', 'Failed to cancel deduction.');
    } finally {
      setConfirmId(null);
    }
  };

  /* ── summary stats ──────────────────────────────────────── */
  const activeRows     = deductions.filter(d => d.status === 'Active');
  const totalActive    = activeRows.length;
  const totalCancelled = deductions.filter(d => d.status === 'Cancelled').length;
  const totalAmount    = activeRows.reduce((s, d) => s + parseFloat(d.amount || 0), 0);
  const pctCount       = activeRows.filter(d => d.amount_type === 'Percentage').length;

  return (
    <div className={styles.container}>

      {/* ── HEADER ── */}
      <div className={styles.header}>
        <div className={styles.topRow}>
          <div>
            <div className={styles.badge}>
              <span className={styles.badgeDot} />
              <span className={styles.badgeTxt}>Finance · Deductions</span>
            </div>
            <h1 className={styles.pageTitle}>Manage <span>Deductions</span></h1>
            <p className={styles.pageSubtitle}>
              Manage employee salary deductions — fixed amounts or a percentage of base salary.
            </p>
          </div>
          <div className={styles.headerActions}>
            <button
              className={styles.addBtn}
              onClick={() => { setShowAddModal(true); setStatusMsg({ type: null, text: '' }); setFormData(INIT_FORM); }}
            >
              <span style={{ fontSize: '18px', lineHeight: 1 }}>+</span>
              Add Deduction
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className={styles.statsRow}>
          <div className={styles.stat}>
            <div className={styles.statLbl}>Total Records</div>
            <div className={styles.statVal}>{deductions.length}</div>
          </div>
          <div className={styles.stat}>
            <div className={styles.statLbl}>Active Deductions</div>
            <div className={styles.statVal}>{totalActive}</div>
          </div>
          <div className={styles.stat}>
            <div className={styles.statLbl}>Percentage-based</div>
            <div className={styles.statVal}>{pctCount}</div>
          </div>
          <div className={styles.stat}>
            <div className={styles.statLbl}>Cancelled</div>
            <div className={styles.statVal}>{totalCancelled}</div>
          </div>
          <div className={styles.stat}>
            <div className={styles.statLbl}>Total Active Amount</div>
            <div className={styles.statValRed}>{fmtAmt(totalAmount)} ETB</div>
          </div>
        </div>
      </div>

      {/* ── NOTIFICATION ── */}
      {statusMsg.text && (
        <div className={`${styles.notification} ${statusMsg.type === 'success' ? styles.notifSuccess : styles.notifError}`}>
          <span>{statusMsg.text}</span>
          <button className={styles.notifDismiss} onClick={() => setStatusMsg({ type: null, text: '' })}>×</button>
        </div>
      )}

      {/* ── TABLE ── */}
      <div className={styles.bodyArea}>
        {loading ? (
          <div className={styles.loading}>● Loading deductions...</div>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Type &amp; Frequency</th>
                  <th>Deduction Basis</th>
                  <th className={styles.right}>ETB Amount</th>
                  <th>Period</th>
                  <th>Description</th>
                  <th className={styles.center}>Status</th>
                  <th className={styles.center}>Action</th>
                </tr>
              </thead>
              <tbody>
                {deductions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className={styles.empty}>No deductions found.</td>
                  </tr>
                ) : (
                  deductions.map((d) => (
                    <tr key={d.id}>
                      <td>
                        <div className={styles.empName}>{d.employeeName || 'Unknown'}</div>
                        <div className={styles.empId}>#{d.employee_id}</div>
                      </td>
                      <td>
                        <div className={styles.dedType}>{d.type}</div>
                        <div className={styles.dedFreq}>{d.frequency}</div>
                      </td>
                      <td>
                        {d.amount_type === 'Percentage' && d.percentage != null ? (
                          <div>
                            <span className={styles.pctBadge}>{parseFloat(d.percentage)}% of salary</span>
                            {d.base_salary && (
                              <div className={styles.pctBase}>
                                Base: {fmtAmt(d.base_salary)} ETB
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className={styles.fixedBadge}>Fixed</span>
                        )}
                      </td>
                      <td className={styles.right}>
                        <span className={styles.amount}>{fmtAmt(d.amount)} ETB</span>
                      </td>
                      <td>
                        <div className={styles.periodFrom}><span>From:</span> {fmtDate(d.start_date)}</div>
                        <div className={styles.periodFrom}><span>To:</span> {fmtDate(d.end_date)}</div>
                      </td>
                      <td>
                        <div className={styles.description}>{d.description || '—'}</div>
                      </td>
                      <td className={styles.center}>
                        <span className={`${styles.statusBadge} ${d.status === 'Active' ? styles.statusActive : styles.statusCancelled}`}>
                          {d.status}
                        </span>
                      </td>
                      <td className={styles.center}>
                        {d.status === 'Active' && (
                          <button className={styles.cancelRowBtn} onClick={() => setConfirmId(d.id)}>
                            Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── IN-APP DELETE CONFIRM MODAL ── */}
      {confirmId && (
        <div className={styles.modalOverlay} onClick={() => setConfirmId(null)}>
          <div className={styles.confirmBox} onClick={e => e.stopPropagation()}>
            <div className={styles.confirmIcon}>⚠️</div>
            <h3 className={styles.confirmTitle}>Cancel Deduction?</h3>
            <p className={styles.confirmText}>
              This will mark the deduction as <strong>Cancelled</strong>. This action cannot be undone.
            </p>
            <div className={styles.confirmBtns}>
              <button className={styles.cancelBtn} onClick={() => setConfirmId(null)}>No, Keep It</button>
              <button className={styles.saveBtn} onClick={() => handleCancel(confirmId)}>Yes, Cancel It</button>
            </div>
          </div>
        </div>
      )}

      {/* ── ADD DEDUCTION MODAL ── */}
      {showAddModal && (
        <div className={styles.modalOverlay} onClick={() => setShowAddModal(false)}>
          <div className={styles.modalWide} onClick={e => e.stopPropagation()}>

            {/* Modal Header */}
            <div className={styles.modalHeader}>
              <div className={styles.modalTitleBlock}>
                <h2 className={styles.modalTitle}>Add New Deduction</h2>
                <p>Fill in all required fields to assign a deduction to a staff member</p>
              </div>
              <button className={styles.closeBtn} onClick={() => setShowAddModal(false)}>×</button>
            </div>

            {/* Form */}
            <form onSubmit={handleSave}>
              <div className={styles.modalGridBody}>

                {/* Employee */}
                <div className={styles.formGroup}>
                  <label>Employee *</label>
                  <select
                    required
                    className={styles.input}
                    value={formData.employeeId}
                    onChange={e => setFormData({ ...formData, employeeId: e.target.value })}
                  >
                    <option value="">Select Staff Member...</option>
                    {employees
                      .filter(emp => emp.employment_status === 'Active' && String(emp.employee_id || '').startsWith('EMP-'))
                      .map(emp => (
                        <option key={emp.employee_id} value={emp.employee_id}>
                          {emp.full_name} ({emp.employee_id}) — {parseFloat(emp.base_salary || 0).toLocaleString()} ETB
                        </option>
                      ))}
                  </select>
                  {selectedEmp && (
                    <div className={styles.salaryHint}>
                      💼 Base Salary: <strong>{fmtAmt(baseSalary)} ETB</strong>
                    </div>
                  )}
                </div>

                {/* Type */}
                <div className={styles.formGroup}>
                  <label>Deduction Type</label>
                  <select
                    className={styles.input}
                    value={formData.type}
                    onChange={e => setFormData({ ...formData, type: e.target.value })}
                  >
                    <option>Tax/PAYE</option>
                    <option>Pension</option>
                    <option>Loan</option>
                    <option>Insurance</option>
                    <option>Union Dues</option>
                    <option>Other</option>
                  </select>
                </div>

                {/* Amount Format */}
                <div className={styles.formGroup}>
                  <label>Deduction Format</label>
                  <select
                    className={styles.input}
                    value={formData.amountType}
                    onChange={e => setFormData({ ...formData, amountType: e.target.value, amount: '', percentage: '' })}
                  >
                    <option value="Fixed">Fixed Amount (ETB)</option>
                    <option value="Percentage">Percentage of Salary (%)</option>
                  </select>
                </div>

                {/* Fixed Amount OR Percentage input */}
                {formData.amountType === 'Fixed' ? (
                  <div className={styles.formGroup}>
                    <label>Amount (ETB) *</label>
                    <input
                      required
                      type="number"
                      step="0.01"
                      min="0.01"
                      className={styles.input}
                      placeholder="e.g. 500.00"
                      value={formData.amount}
                      onChange={e => setFormData({ ...formData, amount: e.target.value })}
                    />
                  </div>
                ) : (
                  <div className={styles.formGroup}>
                    <label>Percentage of Salary (%) *</label>
                    <input
                      required
                      type="number"
                      step="0.01"
                      min="0.01"
                      max="100"
                      className={styles.input}
                      placeholder="e.g. 5  (meaning 5%)"
                      value={formData.percentage}
                      onChange={e => setFormData({ ...formData, percentage: e.target.value })}
                    />
                    {/* Live preview */}
                    {previewAmount !== null && baseSalary > 0 && (
                      <div className={styles.pctPreviewBox}>
                        <span className={styles.pctPreviewLabel}>Preview deduction amount:</span>
                        <span className={styles.pctPreviewValue}>{fmtAmt(previewAmount)} ETB</span>
                        <span className={styles.pctPreviewSub}>
                          ({formData.percentage}% of {fmtAmt(baseSalary)} ETB base salary)
                        </span>
                      </div>
                    )}
                    {formData.percentage && baseSalary <= 0 && (
                      <div className={styles.pctWarn}>⚠ No base salary found for this employee.</div>
                    )}
                  </div>
                )}

                {/* Frequency */}
                <div className={styles.formGroup}>
                  <label>Frequency</label>
                  <select
                    className={styles.input}
                    value={formData.frequency}
                    onChange={e => setFormData({ ...formData, frequency: e.target.value })}
                  >
                    <option>Monthly</option>
                    <option>One-time</option>
                  </select>
                </div>

                {/* Start Date */}
                <div className={styles.formGroup}>
                  <label>Start Date *</label>
                  <input
                    required
                    type="date"
                    className={styles.input}
                    value={formData.startDate}
                    onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                  />
                </div>

                {/* End Date */}
                <div className={styles.formGroup}>
                  <label>End Date (Optional)</label>
                  <input
                    type="date"
                    className={styles.input}
                    value={formData.endDate}
                    onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                  />
                </div>

                {/* Description — full width */}
                <div className={styles.formGroupFull}>
                  <label>Description</label>
                  <input
                    type="text"
                    className={styles.input}
                    placeholder="Brief reason (e.g. Employee loan repayment)"
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

              </div>

              {/* Modal Footer */}
              <div className={styles.modalFooter}>
                <div className={styles.footerStatus}>
                  {statusMsg.text && (
                    <span className={`${styles.footerStatusMsg} ${statusMsg.type === 'success' ? styles.footerSuccess : styles.footerError}`}>
                      {statusMsg.text}
                    </span>
                  )}
                </div>
                <div className={styles.footerBtns}>
                  <button
                    type="button"
                    className={styles.cancelBtn}
                    onClick={() => { setShowAddModal(false); setStatusMsg({ type: null, text: '' }); }}
                  >
                    Cancel
                  </button>
                  <button type="submit" className={styles.saveBtn} disabled={saving}>
                    {saving ? 'Saving...' : '+ Add Deduction'}
                  </button>
                </div>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};

export default HRDeductions;
