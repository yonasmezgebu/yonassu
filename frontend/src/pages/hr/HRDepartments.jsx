import React, { useState, useEffect } from 'react';
import hrService from '../../services/hrService';
import { playSuccessSound } from '../../utils/playNotificationSound';
import styles from './HRDepartments.module.css';

const HRDepartments = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingDept, setEditingDept] = useState(null);
  
  const [form, setForm] = useState({ dept_name: '', head_name: '', head_email: '' });
  const [saving, setSaving] = useState(false);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const res = await hrService.getDepartmentsDashboard();
      setDepartments(res.data?.data?.departments || []);
    } catch (err) {
      console.error('Failed to fetch departments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const handleOpenCreate = () => {
    setEditingDept(null);
    setForm({ dept_name: '', head_name: '', head_email: '' });
    setShowModal(true);
  };

  const handleOpenEdit = (dept) => {
    setEditingDept(dept.dept_id);
    setForm({
      dept_name: dept.dept_name || '',
      head_name: dept.head_name || '',
      head_email: dept.head_email || ''
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingDept) {
        await hrService.updateDepartmentDashboard(editingDept, form);
      } else {
        await hrService.createDepartmentDashboard(form);
      }
      playSuccessSound();
      setShowModal(false);
      fetchDepartments();
    } catch (err) {
      alert('Failed to save department');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.pageTitle}>Departments</h1>
          <p className={styles.pageSubtitle}>Manage company departments and leadership</p>
        </div>
        <button className={styles.addBtn} onClick={handleOpenCreate}>+ New Department</button>
      </div>

      {loading ? (
        <div className={styles.loading}>Loading departments...</div>
      ) : (
        <div className={styles.grid}>
          {departments.length === 0 ? (
            <div className={styles.emptyState}>No departments found.</div>
          ) : (
            departments.map(dept => (
              <div key={dept.dept_id} className={styles.deptCard}>
                <div className={styles.deptHeader}>
                  <h3 className={styles.deptName}>{dept.dept_name}</h3>
                  <button className={styles.editBtn} onClick={() => handleOpenEdit(dept)}>Edit</button>
                </div>
                <div className={styles.deptBody}>
                  <div className={styles.headInfo}>
                    <span className={styles.label}>Department Head</span>
                    <span className={styles.value}>{dept.head_name || 'Not Assigned'}</span>
                  </div>
                  <div className={styles.headInfo}>
                    <span className={styles.label}>Head Email</span>
                    <span className={styles.value}>{dept.head_email || '-'}</span>
                  </div>
                  {dept.employee_count !== undefined && (
                    <div className={styles.headInfo}>
                      <span className={styles.label}>Total Headcount</span>
                      <span className={styles.value}>{dept.employee_count} employees</span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {showModal && (
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>{editingDept ? 'Edit Department' : 'Create Department'}</h2>
              <button className={styles.closeBtn} onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSave}>
              <div className={styles.modalBody}>
                <div className={styles.formGroup}>
                  <label>Department Name *</label>
                  <input value={form.dept_name} onChange={e => setForm({...form, dept_name: e.target.value})} required />
                </div>
                <div className={styles.formGroup}>
                  <label>Head Name</label>
                  <input value={form.head_name} onChange={e => setForm({...form, head_name: e.target.value})} />
                </div>
                <div className={styles.formGroup}>
                  <label>Head Email</label>
                  <input type="email" value={form.head_email} onChange={e => setForm({...form, head_email: e.target.value})} />
                </div>
              </div>
              <div className={styles.modalActions}>
                <button type="button" className={styles.cancelBtn} onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className={styles.submitBtn} disabled={saving}>
                  {saving ? 'Saving...' : 'Save Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HRDepartments;
