import React, { useState, useEffect } from 'react';
import hrService from '../../services/hrService';
import { formatDate } from '../../utils/formatters';
import styles from './HRActivities.module.css';

const HRActivities = () => {
  const [activities, setActivities] = useState({ logs: [], leaves: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const res = await hrService.getTodayActivities();
        setActivities(res?.data || { logs: [], leaves: [] });
      } catch (err) {
        console.error("Failed to fetch today's activities:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchActivities();
  }, []);

  if (loading) return <div className={styles.loading}>Loading live feed...</div>;

  // Combine and sort activities
  const feed = [
    ...(activities.logs || []).map(log => ({
      id: `log-${log.id}`,
      type: log.action === 'CLOCK_IN' ? 'Check-in' : 'Check-out',
      time: log.timestamp,
      employeeId: log.employee_id,
      status: log.status
    })),
    ...(activities.leaves || []).map(leave => ({
      id: `leave-${leave.id}`,
      type: 'Leave Submitted',
      time: leave.created_at || leave.start_date, // fallback
      employeeId: leave.employee_id,
      status: leave.status
    }))
  ].sort((a, b) => new Date(b.time) - new Date(a.time));

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.pageTitle}>Today's Activities</h1>
        <p className={styles.pageSubtitle}>Live feed of check-ins, check-outs, and requests</p>
      </div>

      <div className={styles.feedCard}>
        {feed.length > 0 ? (
          <div className={styles.timeline}>
            {feed.map((item) => (
              <div key={item.id} className={styles.feedItem}>
                <div className={styles.timeBlock}>
                  <span className={styles.time}>{formatDate(item.time, 'time')}</span>
                </div>
                <div className={styles.iconBlock}>
                  {item.type === 'Check-in' && <div className={styles.iconIn}>🟢</div>}
                  {item.type === 'Check-out' && <div className={styles.iconOut}>🔴</div>}
                  {item.type === 'Leave Submitted' && <div className={styles.iconLeave}>🏖️</div>}
                </div>
                <div className={styles.contentBlock}>
                  <div className={styles.actionTitle}>{item.type}</div>
                  <div className={styles.employeeInfo}>Employee {item.employeeId} - {item.status}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.emptyState}>No activities recorded today yet.</div>
        )}
      </div>
    </div>
  );
};

export default HRActivities;
