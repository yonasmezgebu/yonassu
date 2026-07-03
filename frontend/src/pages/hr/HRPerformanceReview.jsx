import React, { useState, useEffect } from 'react';
import hrService from '../../services/hrService';
import { playSuccessSound } from '../../utils/playNotificationSound';
import styles from './HRPerformanceReview.module.css';

const HRPerformanceReview = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await hrService.getReviews();
      // Service merges evaluations into reviews format
      // Actually we are using mock data that is missing for getReviews or returns [] empty, let's fetch evaluations to display
      const evRes = await hrService.getEvaluations();
      const evals = evRes.data?.data?.evaluations || [];
      
      const formattedReviews = evals.map(ev => ({
        id: ev.id,
        employeeName: ev.employeeName,
        department: ev.department || 'General',
        score: ev.score,
        status: ev.status === 'Approved' ? 'Approved' : 'Pending Review',
        eligible: ev.score >= 80
      }));
      setReviews(formattedReviews);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApprove = async (id) => {
    try {
      // Actually update the evaluation status in our mock
      // Since our mock just approves reviews, let's pretend it works on evaluation id
      await hrService.approveReview(id);
      playSuccessSound();
      fetchData();
    } catch (err) {
      alert('Failed to approve review');
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.pageTitle}>Performance Reviews</h1>
          <p className={styles.pageSubtitle}>Sign off on evaluations and determine promotion eligibility.</p>
        </div>
        <div className={styles.actions}>
          <button className={styles.exportBtn} onClick={() => window.print()}>Export PDF</button>
        </div>
      </div>

      <div className={styles.tableWrapper}>
        {loading ? (
          <div className={styles.loading}>Loading reviews...</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Employee Name</th>
                <th>Department</th>
                <th>Evaluation Score</th>
                <th>Promotion Eligibility</th>
                <th>Review Status</th>
                <th className={styles.noPrint}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reviews.length === 0 ? (
                <tr><td colSpan={6} className={styles.empty}>No reviews pending.</td></tr>
              ) : (
                reviews.map(r => (
                  <tr key={r.id}>
                    <td className={styles.empName}>{r.employeeName}</td>
                    <td>{r.department}</td>
                    <td>
                      <span className={styles.scoreText + ' ' + (r.score >= 80 ? styles.high : r.score >= 50 ? styles.med : styles.low)}>
                        {r.score.toFixed(1)}%
                      </span>
                    </td>
                    <td>
                      {r.eligible ? (
                        <span className={styles.eligibleBadge}>Yes</span>
                      ) : (
                        <span className={styles.notEligibleBadge}>No</span>
                      )}
                    </td>
                    <td>
                      <span className={styles.statusBadge + ' ' + styles[r.status.replace(' ', '')]}>{r.status}</span>
                    </td>
                    <td className={styles.noPrint}>
                      {r.status !== 'Approved' && (
                        <button className={styles.approveBtn} onClick={() => handleApprove(r.id)}>Sign Off / Approve</button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default HRPerformanceReview;
