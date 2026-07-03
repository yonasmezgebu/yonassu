import React, { useState, useEffect } from 'react';
import hrService from '../../services/hrService';
import { formatCurrency } from '../../utils/formatters';
import styles from './HREmployees.module.css';

const HREmployees = () => {
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [viewing, setViewing] = useState(null);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const res = await hrService.etp.listEmployees({ search });
      setEmployees(res.data?.data || []);
    } catch (err) {
      console.error('Failed to fetch employees:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    const timer = setTimeout(fetchEmployees, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const openView = (emp) => {
    setViewing(emp);
  };

  const filtered = employees.filter(e =>
    (e.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (e.employee_id || '').toLowerCase().includes(search.toLowerCase()) ||
    (e.dept_name || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.pageTitle}>Employees</h1>
          <p className={styles.pageSubtitle}>{employees.length} employees registered</p>
        </div>
      </div>

      <div className={styles.searchBar}>
        <input
          type="text" className={styles.searchInput} placeholder="Search by name, ID or department..."
          value={search} onChange={e => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className={styles.loading}>Loading employees...</div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Photo</th>
                <th>ID</th>
                <th>Name</th>
                <th>Department</th>
                <th>Position</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className={styles.emptyCell}>No employees found.</td></tr>
              ) : (
                filtered.map((emp) => (
                  <tr key={emp.employee_id}>
                    <td>
                      <div className={styles.avatarPlaceholder}>
                        {emp.full_name?.charAt(0) || '?'}
                      </div>
                    </td>
                    <td className={styles.idCell}>{emp.employee_id}</td>
                    <td className={styles.nameCell}>{emp.full_name}</td>
                    <td>{emp.dept_name || emp.dept_id}</td>
                    <td>{emp.position_title || emp.position_id}</td>
                    <td>
                      <span className={`${styles.statusBadge} ${(emp.employment_status || 'Active').toLowerCase() === 'active' ? styles.active : styles.inactive}`}>
                        {emp.employment_status || 'Active'}
                      </span>
                    </td>
                    <td>
                      <button className={styles.viewBtn} onClick={() => openView(emp)}>View Profile</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {viewing && (
        <div className={styles.modalOverlay} onClick={() => setViewing(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Employee Profile</h2>
              <button className={styles.closeBtn} onClick={() => setViewing(null)}>×</button>
            </div>
            
            <div className={styles.modalBody}>
              <div className={styles.profileSection}>
                <h3>Personal Info</h3>
                <div className={styles.infoGrid}>
                  <div className={styles.infoItem}><span>Full Name:</span> {viewing.full_name}</div>
                  <div className={styles.infoItem}><span>National ID:</span> {viewing.national_id || '-'}</div>
                  <div className={styles.infoItem}><span>Gender:</span> {viewing.gender || '-'}</div>
                  <div className={styles.infoItem}><span>Phone:</span> {viewing.personal_phone || '-'}</div>
                  <div className={styles.infoItem}><span>Email:</span> {viewing.personal_email || '-'}</div>
                </div>
              </div>

              <div className={styles.profileSection}>
                <h3>Employment Info</h3>
                <div className={styles.infoGrid}>
                  <div className={styles.infoItem}><span>Department:</span> {viewing.dept_name || viewing.dept_id}</div>
                  <div className={styles.infoItem}><span>Position:</span> {viewing.position_title || viewing.position_id}</div>
                  <div className={styles.infoItem}><span>Hire Date:</span> {viewing.hire_date ? viewing.hire_date.split('T')[0] : '-'}</div>
                  <div className={styles.infoItem}><span>Type:</span> {viewing.employment_type || '-'}</div>
                </div>
              </div>

              <div className={styles.profileSection}>
                <h3>Compensation & Bank</h3>
                <div className={styles.infoGrid}>
                  <div className={styles.infoItem}><span>Base Salary:</span> {viewing.base_salary ? formatCurrency(viewing.base_salary) : '-'}</div>
                  <div className={styles.infoItem}><span>Bank Name:</span> {viewing.bank_name || '-'}</div>
                  <div className={styles.infoItem}><span>Account:</span> {viewing.bank_account_number || '-'}</div>
                </div>
              </div>

              <div className={styles.profileSection}>
                <h3>Emergency Contact</h3>
                <div className={styles.infoGrid}>
                  <div className={styles.infoItem}><span>Name:</span> {viewing.emergency_contact_name || '-'}</div>
                  <div className={styles.infoItem}><span>Phone:</span> {viewing.emergency_contact_phone || '-'}</div>
                </div>
              </div>
            </div>

            <div className={styles.modalActions}>
              <button type="button" className={styles.cancelBtn} onClick={() => setViewing(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HREmployees;
