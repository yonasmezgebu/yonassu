import React, { useState, useEffect } from 'react';
import hrService from '../../services/hrService';
import { playSuccessSound } from '../../utils/playNotificationSound';
import styles from './HRPayroll.module.css';

const HRPayroll = () => {
  const [salaries, setSalaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState(null);
  
  const [editForm, setEditForm] = useState({ baseSalary: 0, allowances: 0, deductions: 0 });

  const fetchSalaries = async () => {
    setLoading(true);
    try {
      const res = await hrService.getSalaries({ department });
      setSalaries(res.data?.data?.salaries || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalaries();
  }, [department]);

  const openEdit = (emp) => {
    setSelectedEmp(emp);
    setEditForm({
      baseSalary: emp.baseSalary,
      allowances: emp.allowances,
      deductions: emp.deductions
    });
    setShowEditModal(true);
  };

  const handleSave = async () => {
    try {
      await hrService.updateSalary(selectedEmp.id, editForm);
      playSuccessSound();
      setShowEditModal(false);
      fetchSalaries();
    } catch (err) {
      alert('Failed to update salary');
    }
  };

  const handleExportPDF = () => {
    window.print();
  };

  const filteredSalaries = salaries.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) || 
    s.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.pageTitle}>Salary List</h1>
          <p className={styles.pageSubtitle}>Manage base salaries, allowances, and deductions.</p>
        </div>
        <div className={styles.actions}>
          <button className={styles.exportBtn} onClick={handleExportPDF}>Export PDF</button>
        </div>
      </div>

      <div className={styles.filters}>
        <input 
          type="text" 
          placeholder="Search by Name or ID..." 
          className={styles.searchInput}
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select className={styles.filterSelect} value={department} onChange={e => setDepartment(e.target.value)}>
          <option value="">All Departments</option>
          <option value="Engineering">Engineering</option>
          <option value="HR">HR</option>
          <option value="Sales">Sales</option>
        </select>
      </div>

      <div className={styles.tableWrapper}>
        {loading ? (
          <div className={styles.loading}>Loading salaries...</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Emp ID</th>
                <th>Name</th>
                <th>Department</th>
                <th>Base Salary</th>
                <th>Allowances</th>
                <th>Deductions</th>
                <th>Net Salary</th>
                <th>Payment</th>
                <th>Bank Account</th>
                <th className={styles.noPrint}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSalaries.length === 0 ? (
                <tr><td colSpan={10} className={styles.empty}>No records found.</td></tr>
              ) : (
                filteredSalaries.map(s => (
                  <tr key={s.id}>
                    <td className={styles.empId}>{s.id}</td>
                    <td className={styles.empName}>{s.name}</td>
                    <td>{s.department || '-'}</td>
                    <td className={styles.currency}>${s.baseSalary?.toLocaleString()}</td>
                    <td className={styles.currency}>${s.allowances?.toLocaleString()}</td>
                    <td className={styles.currency}>${s.deductions?.toLocaleString()}</td>
                    <td className={styles.currencyBold}>${s.netSalary?.toLocaleString()}</td>
                    <td>{s.paymentMethod}</td>
                    <td className={styles.mono}>{s.bankAccount}</td>
                    <td className={styles.noPrint}>
                      <button className={styles.editBtn} onClick={() => openEdit(s)}>Edit Salary</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {showEditModal && (
        <div className={styles.modalOverlay} onClick={() => setShowEditModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Edit Salary: {selectedEmp?.name}</h2>
              <button className={styles.closeBtn} onClick={() => setShowEditModal(false)}>×</button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.formGroup}>
                <label>Base Salary</label>
                <input 
                  type="number" 
                  value={editForm.baseSalary} 
                  onChange={e => setEditForm({...editForm, baseSalary: Number(e.target.value)})} 
                  className={styles.input}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Allowances</label>
                <input 
                  type="number" 
                  value={editForm.allowances} 
                  onChange={e => setEditForm({...editForm, allowances: Number(e.target.value)})} 
                  className={styles.input}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Standing Deductions</label>
                <input 
                  type="number" 
                  value={editForm.deductions} 
                  onChange={e => setEditForm({...editForm, deductions: Number(e.target.value)})} 
                  className={styles.input}
                />
              </div>
            </div>
            <div className={styles.modalActions}>
              <button className={styles.cancelBtn} onClick={() => setShowEditModal(false)}>Cancel</button>
              <button className={styles.saveBtn} onClick={handleSave}>Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HRPayroll;
