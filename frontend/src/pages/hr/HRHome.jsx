import React, { useState, useEffect } from 'react';
import hrService from '../../services/hrService';
import { formatNumber, formatCurrency } from '../../utils/formatters';
import styles from './HRHome.module.css';

const HRHome = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await hrService.getSummary();
        setSummary(res?.data || res);
      } catch (err) {
        console.error('Failed to fetch HR summary:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, []);

  if (loading) return <div className={styles.loading}>Loading HR summary...</div>;

  const data = summary || {};
  const activeCount = parseInt(data.activeEmployees) || 0;
  const presentCount = parseInt(data.presentToday) || 0;
  const attendanceRate = activeCount > 0 ? Math.round((presentCount / activeCount) * 100) : 0;

  const summaryCards = [
    { label: 'Total Employees', value: formatNumber(data.totalEmployees || 0), icon: '👥', color: '#3b82f6' },
    { label: 'Active Employees', value: formatNumber(data.activeEmployees || 0), icon: '✅', color: '#10b981' },
    { label: 'On Leave', value: formatNumber(data.onLeaveCount || 0), icon: '🏖️', color: '#f59e0b' },
    { label: 'Departments', value: formatNumber((data.departmentBreakdown || []).length), icon: '🏢', color: '#8b5cf6' },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.pageTitle}>Employee Summary</h1>
        <p className={styles.pageSubtitle}>High-level workforce overview and daily attendance rate</p>
      </div>

      <div className={styles.cardsGrid}>
        {summaryCards.map((card, idx) => (
          <div key={idx} className={styles.summaryCard} style={{ borderTop: `4px solid ${card.color}` }}>
            <div className={styles.cardIcon}>{card.icon}</div>
            <div className={styles.cardValue}>{card.value}</div>
            <div className={styles.cardLabel}>{card.label}</div>
          </div>
        ))}
      </div>

      <div className={styles.sectionCard}>
        <h2 className={styles.sectionTitle}>Attendance Today</h2>
        <div className={styles.attendanceBarContainer}>
          <div className={styles.attendanceLabel}>
            <span>{presentCount} / {activeCount} Present</span>
            <span>{attendanceRate}%</span>
          </div>
          <div className={styles.attendanceTrack}>
            <div className={styles.attendanceFill} style={{ width: `${attendanceRate}%` }}></div>
          </div>
        </div>
      </div>

      <div className={styles.sectionCard}>
        <h2 className={styles.sectionTitle}>Department Breakdown</h2>
        {data.departmentBreakdown?.length > 0 ? (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Department</th>
                  <th>Headcount</th>
                </tr>
              </thead>
              <tbody>
                {data.departmentBreakdown.map((dept, idx) => (
                  <tr key={idx}>
                    <td>{dept.department}</td>
                    <td className={styles.headcount}>{formatNumber(dept.count)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className={styles.emptyState}>No department data available.</div>
        )}
      </div>
    </div>
  );
};

export default HRHome;
