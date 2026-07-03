import React, { useState, useEffect } from 'react';
import hrService from '../../services/hrService';
import { playInfoSound } from '../../utils/playNotificationSound';
import styles from './HRDeductions.module.css';

const HRDeductions = () => {
  const [deductions, setDeductions] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  
  const [formData, setFormData] = useState({
    employeeId: '', type: 'Tax/PAYE', amount: '', frequency: 'Monthly', startDate: '', endDate: '', description: ''
  });

  const fetchDeductions = async () => {
    try {
      const res = await hrService.getDeductions();
      setDeductions(res.data?.data?.deductions || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await hrService.getEmployees();
      setEmployees(res.data?.data?.employees || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    Promise.all([fetchDeductions(), fetchEmployees()]).finally(() => setLoading(false));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await hrService.createDeduction(formData);
      playInfoSound();
      setShowAddModal(false);
      setFormData({ employeeId: '', type: 'Tax/PAYE', amount: '', frequency: 'Monthly', startDate: '', endDate: '', description: '' });
      fetchDeductions();
    } catch (err) {
      alert('Failed to add deduction');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this deduction?')) return;
    try {
      await hrService.deleteDeduction(id);
      fetchDeductions();
    } catch (err) {
      alert('Failed to delete deduction');
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.pageTitle}>Deductions</h1>
          <p className={styles.pageSubtitle}>Manage employee salary deductions, taxes, and loans.</p>
        </div>
        <div className={styles.actions}>
          <button className={styles.exportBtn} onClick={() => window.print()}>Export PDF</button>
          <button className={styles.addBtn} onClick={() => setShowAddModal(true)}>+ Add Deduction</button>
        </div>
      </div>

      <div className={styles.tableWrapper}>
        {loading ? (
          <div className={styles.loading}>Loading deductions...</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Employee Name</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Frequency</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Status</th>
                <th className={styles.noPrint}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {deductions.length === 0 ? (
                <tr><td colSpan={8} className={styles.empty}>No deductions found.</td></tr>
              ) : (
                deductions.map(d => (
                  <tr key={d.id}>
                    <td className={styles.empName}>{d.employeeId}</td>
                    <td>{d.type}</td>
                    <td className={styles.currency}>${d.amount}</td>
                    <td>{d.frequency}</td>
                    <td>{d.startDate}</td>
                    <td>{d.endDate || '-'}</td>
                    <td>
                      <span className={styles.statusBadge + ' ' + styles[d.status]}>{d.status}</span>
                    </td>
                    <td className={styles.noPrint}>
                      <button className={styles.deleteBtn} onClick={() => handleDelete(d.id)}>Cancel</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {showAddModal && (
        <div className={styles.modalOverlay} onClick={() => setShowAddModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Add New Deduction</h2>
              <button className={styles.closeBtn} onClick={() => setShowAddModal(false)}>×</button>
            </div>
            <form onSubmit={handleSave}>
              <div className={styles.modalBody}>
                <div className={styles.formGroup}>
                  <label>Employee *</label>
                  <select required className={styles.input} value={formData.employeeId} onChange={e => setFormData({...formData, employeeId: e.target.value})}>
                    <option value="">Select Employee...</option>
                    {employees.map(emp => (
                      <option key={emp.employee_id} value={emp.full_name}>{emp.full_name} ({emp.employee_id})</option>
                    ))}
                  </select>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Type</label>
                    <select className={styles.input} value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                      <option>Tax/PAYE</option>
                      <option>Pension</option>
                      <option>Loan</option>
                      <option>Insurance</option>
                      <option>Union Dues</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div className={styles.formGroup}>
                    <label>Amount *</label>
                    <input required type="number" step="0.01" className={styles.input} value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label>Frequency</label>
                  <select className={styles.input} value={formData.frequency} onChange={e => setFormData({...formData, frequency: e.target.value})}>
                    <option>Monthly</option>
                    <option>One-time</option>
                  </select>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Start Date *</label>
                    <input required type="date" className={styles.input} value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} />
                  </div>
                  <div className={styles.formGroup}>
                    <label>End Date (Optional)</label>
                    <input type="date" className={styles.input} value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label>Description</label>
                  <textarea className={styles.input} rows="3" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}></textarea>
                </div>
              </div>
              <div className={styles.modalActions}>
                <button type="button" className={styles.cancelBtn} onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className={styles.saveBtn}>Add Deduction</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HRDeductions;
