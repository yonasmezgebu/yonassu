import React, { useState, useEffect } from 'react';
import hrService from '../../services/hrService';
import { playSuccessSound } from '../../utils/playNotificationSound';
import styles from './HREmployeeStatus.module.css';

const STATUS_OPTIONS = ['Active', 'On Leave', 'Suspended', 'Terminated'];

const HREmployeeStatus = () => {
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

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

  const handleStatusChange = async (empId, newStatus) => {
    if (!window.confirm(`Are you sure you want to change status to ${newStatus}?`)) return;
    
    setUpdatingId(empId);
    try {
      await hrService.updateEmployeeStatus(empId, newStatus);
      playSuccessSound();
      // Update local state to avoid refetch wait
      setEmployees(employees.map(emp => 
        emp.employee_id === empId ? { ...emp, employment_status: newStatus } : emp
      ));
    } catch (err) {
      alert('Failed to update status');
      console.error(err);
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusClass = (status) => {
    switch ((status || '').toLowerCase()) {
      case 'active': return styles.statusActive;
      case 'on leave': return styles.statusLeave;
      case 'suspended': return styles.statusSuspended;
      case 'terminated': return styles.statusTerminated;
      default: return styles.statusDefault;
    }
  };

  const filtered = employees.filter(e =>
    (e.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (e.employee_id || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.pageTitle}>Employee Status</h1>
          <p className={styles.pageSubtitle}>Monitor and update employment statuses</p>
        </div>
      </div>

      <div className={styles.searchBar}>
        <input
          type="text" className={styles.searchInput} placeholder="Search by name or ID..."
          value={search} onChange={e => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className={styles.loading}>Loading statuses...</div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Department</th>
                <th>Current Status</th>
                <th>Update Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={5} className={styles.emptyCell}>No employees found.</td></tr>
              ) : (
                filtered.map((emp) => (
                  <tr key={emp.employee_id}>
                    <td className={styles.idCell}>{emp.employee_id}</td>
                    <td className={styles.nameCell}>{emp.full_name}</td>
                    <td>{emp.dept_name || emp.dept_id}</td>
                    <td>
                      <span className={`${styles.statusBadge} ${getStatusClass(emp.employment_status)}`}>
                        {emp.employment_status || 'Active'}
                      </span>
                    </td>
                    <td>
                      <select 
                        className={styles.statusSelect}
                        value={emp.employment_status || 'Active'}
                        disabled={updatingId === emp.employee_id}
                        onChange={(e) => handleStatusChange(emp.employee_id, e.target.value)}
                      >
                        {STATUS_OPTIONS.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                      {updatingId === emp.employee_id && <span className={styles.updatingText}>Updating...</span>}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default HREmployeeStatus;
