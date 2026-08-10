import React, { useState, useEffect, useCallback } from 'react';
import hrService from '../../services/hrService';
import { playInfoSound, playSuccessSound } from '../../utils/playNotificationSound';
import styles from './HRDeductions.module.css';

const INIT_FORM = {
  employeeId: '', type: 'Tax/PAYE', amountType: 'Fixed', amount: '', percentage: '',
  frequency: 'Monthly', startDate: '', endDate: '', description: '', status: 'Active'
};

/* ── helpers ──────────────────────────────────────────────────── */
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB') : '—';
const fmtAmt  = (n) => parseFloat(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2 });

// Convert a stored ISO date string to yyyy-mm-dd for <input type="date">
const toDateInput = (d) => {
  if (!d) return '';
  try { return new Date(d).toISOString().slice(0, 10); } catch { return ''; }
};

const HRDeductions = () => {
  const [deductions,    setDeductions]    = useState([]);
  const [employees,     setEmployees]     = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [showAddModal,  setShowAddModal]  = useState(false);
  const [formData,      setFormData]      = useState(INIT_FORM);
  const [editId,        setEditId]        = useState(null);   // null = Add mode, number = Edit mode
  const [saving,        setSaving]        = useState(false);
  const [statusMsg,     setStatusMsg]     = useState({ type: null, text: '' });
  const [confirmId,     setConfirmId]     = useState(null);   // cancel confirm
  const [clearId,       setClearId]       = useState(null);   // permanent delete confirm

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

  /* ── open Add modal ─────────────────────────────────────── */
  const openAdd = () => {
    setEditId(null);
    setFormData(INIT_FORM);
    setStatusMsg({ type: null, text: '' });
    setShowAddModal(true);
  };

  /* ── open Edit modal ────────────────────────────────────── */
  const openEdit = (d) => {
    setEditId(d.id);
    setFormData({
      employeeId:  d.employee_id  || '',
      type:        d.type         || 'Tax/PAYE',
      amountType:  d.amount_type  || 'Fixed',
      amount:      d.amount_type === 'Fixed'      ? String(d.amount      || '') : '',
      percentage:  d.amount_type === 'Percentage' ? String(d.percentage  || '') : '',
      frequency:   d.frequency    || 'Monthly',
      startDate:   toDateInput(d.start_date),
      endDate:     toDateInput(d.end_date),
      description: d.description  || '',
      status:      d.status       || 'Active',
    });
    setStatusMsg({ type: null, text: '' });
    setShowAddModal(true);
  };

  /* ── save (create or update) ────────────────────────────── */
  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setStatusMsg({ type: null, text: '' });
    try {
      let payload;
      if (formData.amountType === 'Percentage') {
        const pct = parseFloat(formData.percentage);
        if (isNaN(pct) || pct <= 0) throw new Error('Please enter a valid percentage value.');
        if (baseSalary <= 0 && !editId) throw new Error('Selected employee has no base salary on record.');
        const resolvedAmount = baseSalary > 0 ? (baseSalary * pct) / 100 : parseFloat(formData.amount || 0);
        payload = { ...formData, percentage: pct, resolvedAmount, amount: resolvedAmount };
      } else {
        const fixed = parseFloat(formData.amount);
        if (isNaN(fixed) || fixed <= 0) throw new Error('Please enter a valid amount.');
        payload = { ...formData, amount: fixed };
      }

      if (editId) {
        // Include status in the update so HR can reactivate a cancelled deduction
        await hrService.updateDeduction(editId, { ...payload, status: formData.status });
        playSuccessSound();
        showNotif('success', 'Deduction updated successfully.');
      } else {
        await hrService.createDeduction(payload);
        playSuccessSound();
        showNotif('success', 'Deduction added successfully.');
      }

      setShowAddModal(false);
      setFormData(INIT_FORM);
      setEditId(null);
      fetchAll();
    } catch (err) {
      showNotif('error', err?.response?.data?.message || err?.message || 'Failed to save deduction.');
    } finally {
      setSaving(false);
    }
  };

  /* ── cancel (mark as Cancelled) ─────────────────────────── */
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

  /* ── clear (permanently delete cancelled row) ───────────── */
  const handleClear = async (id) => {
    try {
      await hrService.deleteDeduction(id, true);
      playInfoSound();
      showNotif('success', 'Cancelled deduction cleared.');
      fetchAll();
    } catch (err) {
      showNotif('error', 'Failed to clear deduction.');
    } finally {
      setClearId(null);
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
            <button className={styles.addBtn} onClick={openAdd}>
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
          <div className={styles.loading}>
            <span className={styles.segSpinnerLg} aria-hidden="true" />
            <span>Loading deductions…</span>
          </div>
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
                    <tr key={d.id} className={d.status === 'Cancelled' ? styles.rowCancelled : ''}>
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
                        <div className={styles.actionGroup}>
                          {/* Edit button — available for ALL deductions */}
                          <button
                            className={styles.editRowBtn}
                            title="Edit deduction"
                            onClick={() => openEdit(d)}
                          >
                            ✏️ Edit
                          </button>

                          {/* Cancel button — Active only */}
                          {d.status === 'Active' && (
                            <button className={styles.cancelRowBtn} onClick={() => setConfirmId(d.id)}>
                              Cancel
                            </button>
                          )}

                          {/* Clear button — Cancelled only → permanently removes the row */}
                          {d.status === 'Cancelled' && (
                            <button
                              className={styles.clearRowBtn}
                              title="Permanently remove this cancelled record"
                              onClick={() => setClearId(d.id)}
                            >
                              🗑 Clear
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── CANCEL CONFIRM MODAL ── */}
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

      {/* ── CLEAR CONFIRM MODAL ── */}
      {clearId && (
        <div className={styles.modalOverlay} onClick={() => setClearId(null)}>
          <div className={styles.confirmBox} onClick={e => e.stopPropagation()}>
            <div className={styles.confirmIcon}>🗑️</div>
            <h3 className={styles.confirmTitle}>Clear Cancelled Record?</h3>
            <p className={styles.confirmText}>
              This will <strong>permanently delete</strong> this cancelled deduction row from the list. This cannot be undone.
            </p>
            <div className={styles.confirmBtns}>
              <button className={styles.cancelBtn} onClick={() => setClearId(null)}>No, Keep It</button>
              <button className={styles.saveBtnDanger} onClick={() => handleClear(clearId)}>Yes, Clear It</button>
            </div>
          </div>
        </div>
      )}

      {/* ── ADD / EDIT DEDUCTION MODAL ── */}
      {showAddModal && (
        <div className={styles.modalOverlay} onClick={() => setShowAddModal(false)}>
          <div className={styles.modalWide} onClick={e => e.stopPropagation()}>

            {/* Modal Header */}
            <div className={styles.modalHeader}>
              <div className={styles.modalTitleBlock}>
                <h2 className={styles.modalTitle}>{editId ? '✏️ Edit Deduction' : 'Add New Deduction'}</h2>
                <p>{editId ? 'Update the deduction details below.' : 'Fill in all required fields to assign a deduction to a staff member'}</p>
              </div>
              <button className={styles.closeBtn} onClick={() => setShowAddModal(false)}>×</button>
            </div>

            {/* Form */}
            <form onSubmit={handleSave} className={styles.modalForm}>
              <div className={styles.modalGridBody}>

                {/* Employee */}
                <div className={styles.formGroup}>
                  <label>Employee *</label>
                  <select
                    required
                    className={styles.input}
                    value={formData.employeeId}
                    onChange={e => setFormData({ ...formData, employeeId: e.target.value })}
                    disabled={!!editId}   // cannot change employee when editing
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

                {/* Status — only shown when editing; allows reactivating a cancelled deduction */}
                {editId && (
                  <div className={styles.formGroup}>
                    <label>Status</label>
                    <select
                      className={styles.input}
                      value={formData.status}
                      onChange={e => setFormData({ ...formData, status: e.target.value })}
                    >
                      <option value="Active">Active</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                    {formData.status === 'Active' && (
                      <div className={styles.salaryHint} style={{ color: '#16A34A', borderColor: '#86EFAC', background: '#DCFCE7' }}>
                        ✅ Setting to <strong>Active</strong> will reactivate this deduction and include it in future payroll runs.
                      </div>
                    )}
                    {formData.status === 'Cancelled' && (
                      <div className={styles.salaryHint} style={{ color: '#DC2626', borderColor: '#FCA5A5', background: '#FEE2E2' }}>
                        ⚠️ Setting to <strong>Cancelled</strong> will exclude this deduction from payroll.
                      </div>
                    )}
                  </div>
                )}

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
                    onClick={() => { setShowAddModal(false); setStatusMsg({ type: null, text: '' }); setEditId(null); }}
                  >
                    Cancel
                  </button>
                  <button type="submit" className={styles.saveBtn} disabled={saving}>
                    {saving
                      ? <><span className={styles.segSpinner} aria-hidden="true" /> Saving…</>
                      : editId ? '✔ Save Changes' : '+ Add Deduction'}
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
