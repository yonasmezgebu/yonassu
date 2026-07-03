import React, { useState, useEffect } from 'react';
import hrService from '../../services/hrService';
import { playSuccessSound, playInfoSound } from '../../utils/playNotificationSound';
import styles from './HRHiringStatus.module.css';

const PIPELINE_STAGES = ['New', 'Shortlisted', 'Interview', 'Offered', 'Hired'];

const HRHiringStatus = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await hrService.getApplications();
      // Filter out rejected for the funnel view
      setApplications(res.data?.data?.applications?.filter(a => a.status !== 'Rejected') || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleExtendOffer = async (id) => {
    try {
      await hrService.updateApplicationStatus(id, { status: 'Offered' });
      playInfoSound();
      fetchData();
    } catch (err) {
      alert('Failed to extend offer');
    }
  };

  const handleHireCandidate = async (id) => {
    if (!window.confirm('This will create an employee record for this candidate. Proceed?')) return;
    try {
      await hrService.hireCandidate(id);
      await hrService.updateApplicationStatus(id, { status: 'Hired' });
      playSuccessSound();
      fetchData();
    } catch (err) {
      alert('Failed to hire candidate');
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.pageTitle}>Hiring Pipeline</h1>
          <p className={styles.pageSubtitle}>Track candidates through the recruitment stages to final hiring.</p>
        </div>
      </div>

      <div className={styles.kanbanBoard}>
        {loading ? (
          <div className={styles.loading}>Loading pipeline...</div>
        ) : (
          PIPELINE_STAGES.map(stage => {
            const stageApps = applications.filter(a => 
              // Treat 'Reviewed' as part of 'New' column for simplicity, or just map it directly if we had a Reviewed column
              stage === 'New' ? (a.status === 'New' || a.status === 'Reviewed') : a.status === stage
            );

            return (
              <div key={stage} className={styles.kanbanColumn}>
                <div className={styles.columnHeader}>
                  <h3 className={styles.columnTitle}>{stage}</h3>
                  <span className={styles.columnCount}>{stageApps.length}</span>
                </div>
                <div className={styles.columnBody}>
                  {stageApps.length === 0 ? (
                    <div className={styles.emptyCard}>No candidates</div>
                  ) : (
                    stageApps.map(app => (
                      <div key={app.id} className={styles.card}>
                        <div className={styles.cardTitle}>{app.applicantName}</div>
                        <div className={styles.cardJob}>{app.jobTitle}</div>
                        
                        <div className={styles.cardActions}>
                          {stage === 'Interview' && (
                            <button className={styles.offerBtn} onClick={() => handleExtendOffer(app.id)}>Extend Offer</button>
                          )}
                          {stage === 'Offered' && (
                            <button className={styles.hireBtn} onClick={() => handleHireCandidate(app.id)}>Hire Candidate</button>
                          )}
                          {stage === 'Hired' && (
                            <span className={styles.hiredBadge}>Employee Created</span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default HRHiringStatus;
