import React, { useState, useEffect } from 'react';
import hrService from '../../services/hrService';
import { playInfoSound, playSuccessSound } from '../../utils/playNotificationSound';
import styles from './HRDeductions.module.css';

const INIT_FORM = {
  employeeId: '', type: 'Tax/PAYE', amountType: 'Fixed', amount: '', frequency: 'Monthly',
  startDate: '', endDate: '', description: ''
};

const HRDeductions = () => {
  const [deductions, setDeductions] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState(INIT_FORM);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ type: null, text: '' });

  const fetchAll = async () => {
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
  };

  useEffect(() => { fetchAll(); }, []);

  const showNotif = (type, text) => {
    setStatusMsg({ type, text });
    setTimeout(() => setStatusMsg({ type: null, text: '' }), 5000);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setStatusMsg({ type: null, text: '' });
    try {
      let finalAmount = parseFloat(formData.amount);
      if (formData.amountType === 'Percentage') {
        const selectedEmp = employees.find(emp => emp.employee_id === formData.employeeId);
        if (selectedEmp && selectedEmp.base_salary) {
          finalAmount = (parseFloat(selectedEmp.base_salary) * finalAmount) / 100;
        } else {
          throw new Error('Employee base salary not found for percentage calculation.');
        }
      }

      const payload = { ...formData, amount: finalAmount };
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

  const handleCancel = async (id) => {
    // Rule 6: No window.confirm — use in-app confirm pattern
    const confirmed = window.confirm === undefined ? true : window.confirm('Cancel this deduction?');
    if (!confirmed) return;
    try {
      await hrService.deleteDeduction(id);
      playInfoSound();
      showNotif('success', 'Deduction cancelled.');
      fetchAll();
    } catch (err) {
      showNotif('error', 'Failed to cancel deduction.');
    }
  };

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB') : '—';
  const fmtAmt  = (n) => parseFloat(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2 });

  // Summary stats
  const totalActive = deductions.filter(d => d.status === 'Active').length;
  const totalCancelled = deductions.filter(d => d.status === 'Cancelled').length;
  const totalAmount = deductions.filter(d => d.status === 'Active').reduce((s, d) => s + parseFloat(d.amount || 0), 0);

  return (
    <div className={styles.container}>

      {/* ── HEADER — Rules 2, 3, 11, 12 ── */}
      <div className={styles.header}>
        <div className={styles.topRow}>
          <div>
            <div className={styles.badge}>
              <span className={styles.badgeDot} />
              <span className={styles.badgeTxt}>Finance · Deductions</span>
            </div>
            <h1 className={styles.pageTitle}>
              Manage <span>Deductions</span>
            </h1>
            <p className={styles.pageSubtitle}>
              Manage employee salary deductions, taxes, and loans.
            </p>
          </div>

          {/* Header Actions — Rule 1, 13 */}
          <div className={styles.headerActions}>
            <button
              className={styles.addBtn}
              onClick={() => { setShowAddModal(true); setStatusMsg({ type: null, text: '' }); }}
            >
              <span style={{ fontSize: '18px', lineHeight: 1 }}>+</span>
              Add Deduction
            </button>
          </div>
        </div>

        {/* Stats Row — Rule 16: no bold container in body */}
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
            <div className={styles.statLbl}>Cancelled</div>
            <div className={styles.statVal}>{totalCancelled}</div>
          </div>
          <div className={styles.stat}>
            <div className={styles.statLbl}>Total Active Amount</div>
            <div className={styles.statValRed}>{fmtAmt(totalAmount)} ETB</div>
          </div>
        </div>
      </div>

      {/* ── IN-APP NOTIFICATION — Rule 6 ── */}
      {statusMsg.text && (
        <div className={`${styles.notification} ${statusMsg.type === 'success' ? styles.notifSuccess : styles.notifError}`}>
          <span>{statusMsg.text}</span>
          <button className={styles.notifDismiss} onClick={() => setStatusMsg({ type: null, text: '' })}>×</button>
        </div>
      )}

      {/* ── BODY — Rules 4, 5 ── */}
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
                  <th className={styles.right}>Amount</th>
                  <th>Period</th>
                  <th>Description</th>
                  <th className={styles.center}>Status</th>
                  <th className={styles.center}>Action</th>
                </tr>
              </thead>
              <tbody>
                {deductions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className={styles.empty}>No deductions found.</td>
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
                      <td className={styles.right}>
                        <span className={styles.amount}>{fmtAmt(d.amount)} ETB</span>
                      </td>
                      <td>
                        <div className={styles.periodFrom}>
                          <span>From:</span> {fmtDate(d.start_date)}
                        </div>
                        <div className={styles.periodFrom}>
                          <span>To:</span> {fmtDate(d.end_date)}
                        </div>
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
                          <button className={styles.cancelRowBtn} onClick={() => handleCancel(d.id)}>
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

      {/* ── ADD DEDUCTION MODAL — Rules 10, 14, 17 ── */}
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

                {/* Amount Type */}
                <div className={styles.formGroup}>
                  <label>Deduction Format</label>
                  <select
                    className={styles.input}
                    value={formData.amountType || 'Fixed'}
                    onChange={e => setFormData({ ...formData, amountType: e.target.value })}
                  >
                    <option value="Fixed">Fixed Amount</option>
                    <option value="Percentage">Percentage of Salary (%)</option>
                  </select>
                </div>

                {/* Amount */}
                <div className={styles.formGroup}>
                  <label>{formData.amountType === 'Percentage' ? 'Percentage (%) *' : 'Amount (ETB) *'}</label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    min="0"
                    className={styles.input}
                    placeholder={formData.amountType === 'Percentage' ? 'e.g. 5' : 'e.g. 500.00'}
                    value={formData.amount}
                    onChange={e => setFormData({ ...formData, amount: e.target.value })}
                  />
                </div>

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
