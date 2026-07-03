import React, { useState, useEffect } from 'react';
import hrService from '../../services/hrService';
import { playInfoSound } from '../../utils/playNotificationSound';
import styles from './HRInterviews.module.css';

const HRInterviews = () => {
  const [interviews, setInterviews] = useState([]);
  const [applications, setApplications] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [selectedInterview, setSelectedInterview] = useState(null);
  
  const [formData, setFormData] = useState({
    applicationId: '', type: 'Phone', date: '', time: '', interviewerId: '', link: '', notes: ''
  });
  
  const [feedbackData, setFeedbackData] = useState({ score: 5, comments: '' });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [iRes, aRes, eRes] = await Promise.all([
        hrService.getInterviews(),
        hrService.getApplications(),
        hrService.getEmployees()
      ]);
      setInterviews(iRes.data?.data?.interviews || []);
      // Only show apps that are in Interview stage
      setApplications(aRes.data?.data?.applications?.filter(a => a.status === 'Interview') || []);
      setEmployees(eRes.data?.data?.employees || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const app = applications.find(a => a.id === formData.applicationId);
      const payload = {
        ...formData,
        candidateName: app?.applicantName || 'Unknown',
        jobTitle: app?.jobTitle || 'Unknown'
      };
      await hrService.createInterview(payload);
      playInfoSound();
      setShowAddModal(false);
      setFormData({ applicationId: '', type: 'Phone', date: '', time: '', interviewerId: '', link: '', notes: '' });
      fetchData();
    } catch (err) {
      alert('Failed to schedule interview');
    }
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    try {
      await hrService.updateInterview(selectedInterview.id, { 
        status: 'Completed', 
        feedbackScore: feedbackData.score, 
        feedbackComments: feedbackData.comments 
      });
      playInfoSound();
      setShowFeedbackModal(false);
      fetchData();
    } catch (err) {
      alert('Failed to submit feedback');
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this interview?')) return;
    try {
      await hrService.updateInterview(id, { status: 'Cancelled' });
      fetchData();
    } catch (err) {
      alert('Failed to cancel interview');
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.pageTitle}>Interviews</h1>
          <p className={styles.pageSubtitle}>Schedule and manage candidate interviews.</p>
        </div>
        <div className={styles.actions}>
          <button className={styles.addBtn} onClick={() => setShowAddModal(true)}>+ Schedule Interview</button>
        </div>
      </div>

      <div className={styles.tableWrapper}>
        {loading ? (
          <div className={styles.loading}>Loading interviews...</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Candidate Name</th>
                <th>Job Title</th>
                <th>Type</th>
                <th>Date & Time</th>
                <th>Interviewer</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {interviews.length === 0 ? (
                <tr><td colSpan={7} className={styles.empty}>No interviews found.</td></tr>
              ) : (
                interviews.map(inv => (
                  <tr key={inv.id}>
                    <td className={styles.candidateName}>{inv.candidateName}</td>
                    <td className={styles.jobTitle}>{inv.jobTitle}</td>
                    <td>{inv.type}</td>
                    <td>
                      <div className={styles.dateTime}>
                        <span>{inv.date}</span>
                        <span className={styles.time}>{inv.time}</span>
                      </div>
                    </td>
                    <td>
                      {employees.find(e => e.employee_id === inv.interviewerId)?.full_name || inv.interviewerId}
                    </td>
                    <td>
                      <span className={styles.statusBadge + ' ' + styles[inv.status]}>{inv.status}</span>
                    </td>
                    <td>
                      {inv.status === 'Scheduled' && (
                        <>
                          <button className={styles.actionBtn} onClick={() => { setSelectedInterview(inv); setFeedbackData({score: 5, comments: ''}); setShowFeedbackModal(true); }}>
                            Log Feedback
                          </button>
                          <button className={styles.cancelBtn} onClick={() => handleCancel(inv.id)}>Cancel</button>
                        </>
                      )}
                      {inv.status === 'Completed' && (
                        <span className={styles.scoreInfo}>Score: {inv.feedbackScore}/10</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {showAddModal && (
        <div className={styles.modalOverlay} onClick={() => setShowAddModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Schedule Interview</h2>
              <button className={styles.closeBtn} onClick={() => setShowAddModal(false)}>×</button>
            </div>
            <form onSubmit={handleSave}>
              <div className={styles.modalBody}>
                <div className={styles.formGroup}>
                  <label>Candidate (In Interview Stage) *</label>
                  <select required className={styles.input} value={formData.applicationId} onChange={e => setFormData({...formData, applicationId: e.target.value})}>
                    <option value="">Select Candidate...</option>
                    {applications.map(app => (
                      <option key={app.id} value={app.id}>{app.applicantName} - {app.jobTitle}</option>
                    ))}
                  </select>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Interview Type *</label>
                    <select className={styles.input} value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                      <option>Phone</option>
                      <option>Technical</option>
                      <option>Cultural</option>
                      <option>Final</option>
                    </select>
                  </div>
                  <div className={styles.formGroup}>
                    <label>Interviewer *</label>
                    <select required className={styles.input} value={formData.interviewerId} onChange={e => setFormData({...formData, interviewerId: e.target.value})}>
                      <option value="">Select Employee...</option>
                      {employees.map(emp => (
                        <option key={emp.employee_id} value={emp.employee_id}>{emp.full_name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Date *</label>
                    <input required type="date" className={styles.input} value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Time *</label>
                    <input required type="time" className={styles.input} value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label>Meeting Link / Location</label>
                  <input type="text" placeholder="Zoom link, Google Meet, or Office Room" className={styles.input} value={formData.link} onChange={e => setFormData({...formData, link: e.target.value})} />
                </div>

                <div className={styles.formGroup}>
                  <label>Notes for Interviewer</label>
                  <textarea className={styles.input} rows="3" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})}></textarea>
                </div>
              </div>
              <div className={styles.modalActions}>
                <button type="button" className={styles.modalCancelBtn} onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className={styles.saveBtn}>Schedule</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showFeedbackModal && (
        <div className={styles.modalOverlay} onClick={() => setShowFeedbackModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Log Interview Feedback</h2>
              <button className={styles.closeBtn} onClick={() => setShowFeedbackModal(false)}>×</button>
            </div>
            <form onSubmit={handleFeedbackSubmit}>
              <div className={styles.modalBody}>
                <div className={styles.formGroup}>
                  <label>Overall Score (1-10) *</label>
                  <input type="number" min="1" max="10" required className={styles.input} value={feedbackData.score} onChange={e => setFeedbackData({...feedbackData, score: e.target.value})} />
                </div>
                <div className={styles.formGroup}>
                  <label>Feedback Comments *</label>
                  <textarea required className={styles.input} rows="4" placeholder="Pros, cons, recommendation..." value={feedbackData.comments} onChange={e => setFeedbackData({...feedbackData, comments: e.target.value})}></textarea>
                </div>
              </div>
              <div className={styles.modalActions}>
                <button type="button" className={styles.modalCancelBtn} onClick={() => setShowFeedbackModal(false)}>Cancel</button>
                <button type="submit" className={styles.saveBtn}>Submit Feedback</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HRInterviews;
