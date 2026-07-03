import React, { useState, useEffect } from 'react';
import hrService from '../../services/hrService';
import { playSuccessSound } from '../../utils/playNotificationSound';
import styles from './HRAbsences.module.css';

const HRAbsences = () => {
  const [absences, setAbsences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date().toISOString().substring(0, 7));

  const fetchAbsences = async () => {
    try {
      setLoading(true);
      const res = await hrService.getAbsencesDashboard({ month });
      setAbsences(res.data?.data?.absences || []);
    } catch (err) {
      console.error('Failed to fetch absences:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAbsences();
  }, [month]);

  const handleAction = async (id, action) => {
    if (!window.confirm(`Are you sure you want to ${action} this absence?`)) return;
    
    try {
      await hrService.updateAbsenceStatusDashboard(id, action);
      playSuccessSound();
      if (action === 'Deduct') {
        alert('Absence deducted from salary and email notification sent to employee.');
      } else {
        alert('Absence marked as justified.');
      }
      fetchAbsences();
    } catch (err) {
      console.error('Failed to update absence:', err);
      alert('Failed to update absence');
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.pageTitle}>Absence Records</h1>
          <p className={styles.pageSubtitle}>Review undocumented absences and take action.</p>
        </div>
        <div className={styles.filters}>
          <input 
            type="month" 
            className={styles.monthInput}
            value={month} 
            onChange={(e) => setMonth(e.target.value)} 
          />
        </div>
      </div>

      {loading ? (
        <div className={styles.loading}>Loading absences...</div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Date</th>
                <th>Employee</th>
                <th>Department</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {absences.length === 0 ? (
                <tr>
                  <td colSpan={5} className={styles.emptyState}>
                    No unexcused absences found for this period.
                  </td>
                </tr>
              ) : (
                absences.map((record) => (
                  <tr key={record.id}>
                    <td>{new Date(record.date).toLocaleDateString()}</td>
                    <td>
                      <div className={styles.empInfo}>
                        <span className={styles.empName}>{record.employee_name}</span>
                        <span className={styles.empId}>{record.employee_id}</span>
                      </div>
                    </td>
                    <td>{record.department}</td>
                    <td>
                      <span className={`${styles.statusBadge} ${styles[record.status.toLowerCase()] || styles.pending}`}>
                        {record.status || 'Pending Review'}
                      </span>
                    </td>
                    <td>
                      {record.status === 'Pending' && (
                        <div className={styles.actionButtons}>
                          <button 
                            className={styles.justifyBtn}
                            onClick={() => handleAction(record.id, 'Justify')}
                          >
                            Mark Justified
                          </button>
                          <button 
                            className={styles.deductBtn}
                            onClick={() => handleAction(record.id, 'Deduct')}
                          >
                            Deduct Salary
                          </button>
                        </div>
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
  );
};

export default HRAbsences;
