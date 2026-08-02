import React, { useState, useEffect } from 'react';
import hrService from '../../services/hrService';
import styles from './HRAttendance.module.css';

const HRAttendance = () => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [calcLoading, setCalcLoading] = useState(false);

  // In-App Notification — Rule 6: no native alerts
  const [notif, setNotif] = useState({ type: null, text: '' });
  const showNotif = (type, text) => {
    setNotif({ type, text });
    setTimeout(() => setNotif({ type: null, text: '' }), 5000);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [attRes] = await Promise.all([
        hrService.etp.getDailyAttendance(date),
      ]);
      const attData = attRes.data?.data || {};
      setAttendance(attData.employees || attData.data?.employees || []);
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
      await fetchData();
      showNotif('success', 'Daily attendance calculated successfully');
    } catch (err) {
      console.error(err);
      showNotif('error', 'Failed to calculate attendance');
    } finally {
      setCalcLoading(false);
    }
  };

  // Derive status label + CSS class
  const getStatusInfo = (emp) => {
    const s = emp.attendance_status || emp.online_status || 'Unknown';
    if (s === 'Present' || s === 'online')
      return { label: 'Present', cls: styles.statusPresent };
    if (s === 'Late' || s === 'idle')
      return { label: 'Late', cls: styles.statusLate };
    if (s === 'Absent' || s === 'offline')
      return { label: 'Absent', cls: styles.statusAbsent };
    if (s === 'On Leave')
      return { label: 'On Leave', cls: styles.statusLeave };
    if (s === 'On Assignment')
      return { label: 'On Assignment', cls: styles.statusAssign };
    return { label: s, cls: styles.statusUnknown };
  };

  // Compute summary stats
  const stats = attendance.reduce(
    (acc, emp) => {
      const s = emp.attendance_status || emp.online_status || '';
      if (s === 'Present' || s === 'online') acc.present++;
      else if (s === 'Late' || s === 'idle') acc.late++;
      else if (s === 'Absent' || s === 'offline') acc.absent++;
      else if (s === 'On Leave') acc.leave++;
      return acc;
    },
    { present: 0, late: 0, absent: 0, leave: 0 }
  );

  return (
    <div className={styles.container}>
      {/* ── HEADER ── Rule 2, 11, 12, 13 */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.headerBadge}>
            <span className={styles.headerBadgeDot} />
            <span className={styles.headerBadgeTxt}>HR Management</span>
          </div>
          <h1 className={styles.pageTitle}>
            Daily <span>Attendance</span>
          </h1>
          <p className={styles.pageSubtitle}>
            Real-time attendance tracking and daily calculation
          </p>
        </div>

        <div className={styles.headerActions}>
          {/* Rule 10, 14: bold border date input */}
          <input
            type="date"
            className={styles.dateInput}
            value={date}
            onChange={e => setDate(e.target.value)}
          />
          {/* Rule 15: 3D hover push */}
          <button
            className={styles.calcBtn}
            onClick={handleCalculate}
            disabled={calcLoading}
          >
            {calcLoading ? 'Processing...' : 'Calculate Daily'}
          </button>
        </div>
      </div>

      {/* ── IN-APP NOTIFICATION — Rule 6 ── */}
      {notif.text && (
        <div className={`${styles.notification} ${notif.type === 'success' ? styles.notifSuccess : styles.notifError}`}>
          <span>{notif.text}</span>
          <button className={styles.notifDismiss} onClick={() => setNotif({ type: null, text: '' })}>&times;</button>
        </div>
      )}

      {/* ── BODY ── */}
      <div className={styles.bodyArea}>

        {/* Summary Stats Row */}
        {!loading && attendance.length > 0 && (
          <div className={styles.statsRow}>
            <div className={styles.statCard}>
              <div className={styles.statValue}>{stats.present}</div>
              <div className={styles.statLabel}>Present</div>
            </div>
            <div className={`${styles.statCard} ${styles.statCardLate}`}>
              <div className={styles.statValue}>{stats.late}</div>
              <div className={styles.statLabel}>Late</div>
            </div>
            <div className={`${styles.statCard} ${styles.statCardAbsent}`}>
              <div className={styles.statValue}>{stats.absent}</div>
              <div className={styles.statLabel}>Absent</div>
            </div>
            <div className={`${styles.statCard} ${styles.statCardLeave}`}>
              <div className={styles.statValue}>{stats.leave}</div>
              <div className={styles.statLabel}>On Leave</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>{attendance.length}</div>
              <div className={styles.statLabel}>Total Staff</div>
            </div>
          </div>
        )}

        {/* Controls Bar */}
        <div className={styles.controlsBar}>
          <div className={styles.countLabel}>
            {attendance.length} employee(s) — {new Date(date).toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>

        {/* Table — Rule 3, 4, 8 */}
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Shift</th>
                <th>Attendance Status</th>
                <th>Online Status</th>
                <th>Last Seen</th>
                <th>Work Hours</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className={styles.loading}>Loading attendance...</td></tr>
              ) : attendance.length === 0 ? (
                <tr>
                  <td colSpan={6} className={styles.empty}>
                    No records for this date. Click "Calculate Daily" to generate.
                  </td>
                </tr>
              ) : (
                attendance.map((emp, idx) => {
                  const { label, cls } = getStatusInfo(emp);
                  const isOnline = emp.online_status === 'online' || emp.online_status === 'Online';
                  return (
                    <tr key={idx}>
                      <td>
                        <div className={styles.nameCell}>{emp.full_name}</div>
                      </td>
                      <td>
                        <div className={styles.shiftCell}>
                          {emp.shift_start_time
                            ? `${emp.shift_start_time.substring(0, 5)} – ${emp.shift_end_time?.substring(0, 5) || '?'}`
                            : '—'}
                        </div>
                      </td>
                      <td>
                        <span className={`${styles.statusBadge} ${cls}`}>{label}</span>
                      </td>
                      <td>
                        <span className={`${styles.onlineBadge} ${isOnline ? styles.onlineActive : styles.onlineInactive}`}>
                          <span className={styles.dot} />
                          {emp.online_status || 'Unknown'}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: '#424242', fontSize: 12 }}>
                          {emp.last_seen
                            ? new Date(emp.last_seen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            : '—'}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 800, color: emp.net_work_hours ? '#1B5E20' : '#8D6E63', fontSize: 13 }}>
                          {emp.net_work_hours ? `${parseFloat(emp.net_work_hours).toFixed(1)}h` : '—'}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
};

export default HRAttendance;
