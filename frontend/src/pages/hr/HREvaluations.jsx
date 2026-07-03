import React, { useState, useEffect } from 'react';
import hrService from '../../services/hrService';
import { playSuccessSound } from '../../utils/playNotificationSound';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import styles from './HREvaluations.module.css';

const HREvaluations = () => {
  const [evaluations, setEvaluations] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewEval, setViewEval] = useState(null);

  const [formData, setFormData] = useState({
    employeeId: '', evaluatorId: '', date: '', comments: '',
    metrics: { quality: 3, punctuality: 3, communication: 3, teamwork: 3 }
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [evRes, empRes] = await Promise.all([
        hrService.getEvaluations(),
        hrService.getEmployees()
      ]);
      setEvaluations(evRes.data?.data?.evaluations || []);
      setEmployees(empRes.data?.data?.employees || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const calculateTotal = (metrics) => {
    const sum = Number(metrics.quality) + Number(metrics.punctuality) + Number(metrics.communication) + Number(metrics.teamwork);
    return (sum / 20) * 100; // out of 100
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const totalScore = calculateTotal(formData.metrics);
      const payload = {
        ...formData,
        employeeName: employees.find(emp => emp.employee_id === formData.employeeId)?.full_name,
        evaluatorName: employees.find(emp => emp.employee_id === formData.evaluatorId)?.full_name,
        score: totalScore
      };
      await hrService.createEvaluation(payload);
      playSuccessSound();
      setShowAddModal(false);
      setFormData({ employeeId: '', evaluatorId: '', date: '', comments: '', metrics: { quality: 3, punctuality: 3, communication: 3, teamwork: 3 } });
      fetchData();
    } catch (err) {
      alert('Failed to save evaluation');
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.pageTitle}>Performance Evaluations</h1>
          <p className={styles.pageSubtitle}>Conduct and review employee performance metrics.</p>
        </div>
        <div className={styles.actions}>
          <button className={styles.addBtn} onClick={() => setShowAddModal(true)}>+ New Evaluation</button>
        </div>
      </div>

      <div className={styles.tableWrapper}>
        {loading ? (
          <div className={styles.loading}>Loading evaluations...</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Employee</th>
                <th>Evaluator</th>
                <th>Date</th>
                <th>Total Score</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {evaluations.length === 0 ? (
                <tr><td colSpan={7} className={styles.empty}>No evaluations found.</td></tr>
              ) : (
                evaluations.map(ev => (
                  <tr key={ev.id}>
                    <td className={styles.mono}>{ev.id}</td>
                    <td className={styles.empName}>{ev.employeeName}</td>
                    <td>{ev.evaluatorName}</td>
                    <td>{ev.date}</td>
                    <td>
                      <span className={styles.scoreBadge + ' ' + (ev.score >= 80 ? styles.high : ev.score >= 50 ? styles.med : styles.low)}>
                        {ev.score.toFixed(1)}%
                      </span>
                    </td>
                    <td>
                      <span className={styles.statusBadge + ' ' + styles[ev.status]}>{ev.status}</span>
                    </td>
                    <td>
                      <button className={styles.actionBtn} onClick={() => setViewEval(ev)}>View Report</button>
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
              <h2 className={styles.modalTitle}>New Performance Evaluation</h2>
              <button className={styles.closeBtn} onClick={() => setShowAddModal(false)}>×</button>
            </div>
            <form onSubmit={handleSave}>
              <div className={styles.modalBody}>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Employee *</label>
                    <select required className={styles.input} value={formData.employeeId} onChange={e => setFormData({...formData, employeeId: e.target.value})}>
                      <option value="">Select Employee...</option>
                      {employees.map(emp => (
                        <option key={emp.employee_id} value={emp.employee_id}>{emp.full_name}</option>
                      ))}
                    </select>
                  </div>
                  <div className={styles.formGroup}>
                    <label>Evaluator (Manager) *</label>
                    <select required className={styles.input} value={formData.evaluatorId} onChange={e => setFormData({...formData, evaluatorId: e.target.value})}>
                      <option value="">Select Evaluator...</option>
                      {employees.map(emp => (
                        <option key={emp.employee_id} value={emp.employee_id}>{emp.full_name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label>Evaluation Date *</label>
                  <input required type="date" className={styles.input} value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                </div>

                <div className={styles.metricsSection}>
                  <h3 className={styles.metricsTitle}>Key Metrics (1 - 5)</h3>
                  {['quality', 'punctuality', 'communication', 'teamwork'].map(metric => (
                    <div key={metric} className={styles.metricRow}>
                      <label className={styles.metricLabel}>{metric.charAt(0).toUpperCase() + metric.slice(1)}</label>
                      <input 
                        type="range" min="1" max="5" 
                        value={formData.metrics[metric]} 
                        onChange={e => setFormData({...formData, metrics: {...formData.metrics, [metric]: e.target.value}})} 
                        className={styles.rangeInput}
                      />
                      <span className={styles.metricValue}>{formData.metrics[metric]}</span>
                    </div>
                  ))}
                  <div className={styles.totalPreview}>
                    Total Score: <strong>{calculateTotal(formData.metrics).toFixed(1)}%</strong>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label>Comments / Notes</label>
                  <textarea className={styles.input} rows="3" value={formData.comments} onChange={e => setFormData({...formData, comments: e.target.value})}></textarea>
                </div>
              </div>
              <div className={styles.modalActions}>
                <button type="button" className={styles.cancelBtn} onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className={styles.saveBtn}>Complete Evaluation</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewEval && (
        <div className={styles.modalOverlay} onClick={() => setViewEval(null)}>
          <div className={styles.reportModal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Evaluation Report</h2>
              <button className={styles.closeBtn} onClick={() => setViewEval(null)}>×</button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.reportMeta}>
                <div><strong>Employee:</strong> {viewEval.employeeName}</div>
                <div><strong>Evaluator:</strong> {viewEval.evaluatorName}</div>
                <div><strong>Date:</strong> {viewEval.date}</div>
                <div><strong>Total Score:</strong> {viewEval.score.toFixed(1)}%</div>
              </div>
              
              <div className={styles.chartContainer}>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={[
                    { subject: 'Quality', A: viewEval.metrics?.quality || 0, fullMark: 5 },
                    { subject: 'Punctuality', A: viewEval.metrics?.punctuality || 0, fullMark: 5 },
                    { subject: 'Communication', A: viewEval.metrics?.communication || 0, fullMark: 5 },
                    { subject: 'Teamwork', A: viewEval.metrics?.teamwork || 0, fullMark: 5 },
                  ]}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="subject" />
                    <PolarRadiusAxis angle={30} domain={[0, 5]} />
                    <Radar name={viewEval.employeeName} dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              <div className={styles.reportComments}>
                <strong>Comments:</strong>
                <p>{viewEval.comments || 'No comments provided.'}</p>
              </div>
            </div>
            <div className={styles.modalActions}>
              <button className={styles.cancelBtn} onClick={() => window.print()}>Print Report</button>
              <button className={styles.saveBtn} onClick={() => setViewEval(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HREvaluations;
