import React, { useState, useEffect } from 'react';
import hrService from '../../services/hrService';
import { playInfoSound } from '../../utils/playNotificationSound';
import styles from './HRFeedback.module.css';

const HRFeedback = () => {
  const [feedbackList, setFeedbackList] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  const [formData, setFormData] = useState({
    toId: '', topic: 'Peer Review', comments: '', confidential: false
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [fRes, eRes] = await Promise.all([
        hrService.getFeedback(),
        hrService.getEmployees()
      ]);
      setFeedbackList(fRes.data?.data?.feedback || []);
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
      await hrService.submitFeedback(formData);
      playInfoSound();
      setShowAddModal(false);
      setFormData({ toId: '', topic: 'Peer Review', comments: '', confidential: false });
      fetchData();
    } catch (err) {
      alert('Failed to submit feedback');
    }
  };

  const handleAcknowledge = async (id) => {
    try {
      await hrService.acknowledgeFeedback(id);
      playInfoSound();
      fetchData();
    } catch (err) {
      alert('Failed to acknowledge feedback');
    }
  };

  const getEmpName = (id) => {
    return employees.find(e => e.employee_id === id)?.full_name || id;
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.pageTitle}>360° Feedback</h1>
          <p className={styles.pageSubtitle}>Continuous feedback for peer reviews, upward feedback, and leadership.</p>
        </div>
        <div className={styles.actions}>
          <button className={styles.addBtn} onClick={() => setShowAddModal(true)}>+ Provide Feedback</button>
        </div>
      </div>

      <div className={styles.tableWrapper}>
        {loading ? (
          <div className={styles.loading}>Loading feedback...</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Date</th>
                <th>From</th>
                <th>To</th>
                <th>Topic</th>
                <th>Comments</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {feedbackList.length === 0 ? (
                <tr><td colSpan={7} className={styles.empty}>No feedback records found.</td></tr>
              ) : (
                feedbackList.map(f => (
                  <tr key={f.id}>
                    <td>{new Date(f.date).toLocaleDateString()}</td>
                    <td className={f.confidential ? styles.confidentialName : styles.empName}>
                      {f.confidential ? 'Anonymous' : getEmpName(f.fromId)}
                    </td>
                    <td className={styles.empName}>{getEmpName(f.toId)}</td>
                    <td>{f.topic}</td>
                    <td className={styles.commentsCol}>
                      <div className={styles.commentsText}>{f.comments}</div>
                    </td>
                    <td>
                      <span className={styles.statusBadge + ' ' + styles[f.status]}>{f.status}</span>
                    </td>
                    <td>
                      {f.status === 'New' && (
                        <button className={styles.actionBtn} onClick={() => handleAcknowledge(f.id)}>Acknowledge</button>
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
              <h2 className={styles.modalTitle}>Provide Feedback</h2>
              <button className={styles.closeBtn} onClick={() => setShowAddModal(false)}>×</button>
            </div>
            <form onSubmit={handleSave}>
              <div className={styles.modalBody}>
                <div className={styles.formGroup}>
                  <label>Target Employee *</label>
                  <select required className={styles.input} value={formData.toId} onChange={e => setFormData({...formData, toId: e.target.value})}>
                    <option value="">Select Employee...</option>
                    {employees.map(emp => (
                      <option key={emp.employee_id} value={emp.employee_id}>{emp.full_name}</option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label>Topic *</label>
                  <select required className={styles.input} value={formData.topic} onChange={e => setFormData({...formData, topic: e.target.value})}>
                    <option>Peer Review</option>
                    <option>Upward Feedback</option>
                    <option>Leadership</option>
                    <option>General</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label>Comments *</label>
                  <textarea required className={styles.input} rows="4" value={formData.comments} onChange={e => setFormData({...formData, comments: e.target.value})}></textarea>
                </div>

                <div className={styles.checkboxGroup}>
                  <input type="checkbox" id="confidential" checked={formData.confidential} onChange={e => setFormData({...formData, confidential: e.target.checked})} />
                  <label htmlFor="confidential">Keep my feedback confidential (Anonymous)</label>
                </div>
              </div>
              <div className={styles.modalActions}>
                <button type="button" className={styles.cancelBtn} onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className={styles.saveBtn}>Submit Feedback</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HRFeedback;
