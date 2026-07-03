import React, { useState, useEffect } from 'react';
import hrService from '../../services/hrService';
import { formatDate } from '../../utils/formatters';
import styles from './HRAttendance.module.css';

const STATUS_OPTIONS = ['Present', 'Late', 'Absent', 'On Leave', 'On Assignment'];

const HRAttendance = () => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendance, setAttendance] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [calcLoading, setCalcLoading] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [attRes, empRes] = await Promise.all([
        hrService.etp.getDailyAttendance(date),
        hrService.etp.listEmployees({}),
      ]);
      const attData = attRes.data?.data || {};
      setAttendance(attData.employees || attData.data?.employees || []);
      setEmployees(empRes.data?.data || []);
    } catch (err) {
      console.error('Failed to fetch attendance:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [date]);

  const handleCalculate = async () => {
    setCalcLoading(true);
    try {
      await hrService.etp.calculateDailyAttendance();
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Failed to calculate attendance');
    } finally {
      setCalcLoading(false);
    }
  };


  const renderStatus = (emp) => {
    const s = emp.attendance_status || emp.online_status || 'Unknown';
    if (s === 'Present' || s === 'online') return <span className={styles.statusPresent}>Present</span>;
    if (s === 'Late' || s === 'idle') return <span className={styles.statusLate}>Late</span>;
    if (s === 'Absent' || s === 'offline') return <span className={styles.statusAbsent}>Absent</span>;
    return <span className={styles.statusUnknown}>{s}</span>;
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.pageTitle}>Attendance</h1>
          <p className={styles.pageSubtitle}>Real-time attendance tracking and manual entry</p>
        </div>
        <div className={styles.headerActions}>
          <input type="date" className={styles.dateInput} value={date} onChange={e => setDate(e.target.value)} />
          <button className={styles.calcBtn} onClick={handleCalculate} disabled={calcLoading}>
            {calcLoading ? 'Processing...' : 'Calculate Daily'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className={styles.loading}>Loading attendance...</div>
      ) : (
        <>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Shift</th>
                  <th>Status</th>
                  <th>Online</th>
                  <th>Last Seen</th>
                  <th>Work Hours</th>
                </tr>
              </thead>
              <tbody>
                {attendance.length === 0 ? (
                  <tr><td colSpan={6} className={styles.emptyCell}>No attendance records for this date. Click "Calculate Daily" to generate.</td></tr>
                ) : (
                  attendance.map((emp, idx) => (
                    <tr key={idx}>
                      <td className={styles.nameCell}>{emp.full_name}</td>
                      <td>{emp.shift_start_time ? `${emp.shift_start_time.substring(0,5)}-${emp.shift_end_time?.substring(0,5)}` : '-'}</td>
                      <td>{renderStatus(emp)}</td>
                      <td><span className={`${styles.statusBadge} ${emp.online_status === 'Online' ? styles.active : styles.inactive}`}>{emp.online_status || 'Unknown'}</span></td>
                      <td>{emp.last_seen ? new Date(emp.last_seen).toLocaleTimeString() : 'N/A'}</td>
                      <td>{emp.net_work_hours ? `${parseFloat(emp.net_work_hours).toFixed(1)}h` : '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

        </>
      )}
    </div>
  );
};

export default HRAttendance;
