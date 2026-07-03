import React, { useState, useEffect } from 'react';
import { employeePortalState, SESSION_EMPLOYEE_ID } from '../../../utils/employeePortalState';
import { Upload, FileText, Clock, Send, Archive, AlertCircle, CheckCircle } from 'lucide-react';

const PageHeader = ({ title, description }) => (
  <div style={{ marginBottom: '24px' }}>
    <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', margin: '0 0 8px 0' }}>{title}</h1>
    <p style={{ color: '#64748b', margin: 0 }}>{description}</p>
  </div>
);

// --- 4.7 Submit Work ---
export const SubmitWork = () => {
  const [tasks, setTasks] = useState([]);
  const [formData, setFormData] = useState({
    task_id: '',
    description: '',
    duration_value: '',
    duration_unit: 'hours',
    notes: ''
  });

  useEffect(() => {
    // Only fetch open or recently completed tasks without active submissions
    const myTasks = employeePortalState.getAllTasks(SESSION_EMPLOYEE_ID);
    const existingSubs = employeePortalState.getWorkHistory(SESSION_EMPLOYEE_ID).filter(s => s.status !== 'rejected');
    const availableTasks = myTasks.filter(t => !existingSubs.some(s => s.task_id === t.id));
    setTasks(availableTasks);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    try {
      employeePortalState.submitWork(SESSION_EMPLOYEE_ID, {
        ...formData,
        duration_value: Number(formData.duration_value)
      });
      setFormData({ task_id: '', description: '', duration_value: '', duration_unit: 'hours', notes: '' });
      // Remove submitted task from dropdown
      setTasks(tasks.filter(t => t.id !== formData.task_id));
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div style={{ padding: '24px', backgroundColor: '#f8fafc', minHeight: 'calc(100vh - 64px)' }}>
      <PageHeader title="Submit Work" description="Attach deliverables for review to finalize task completion." />
      
      <div style={{ backgroundColor: 'white', padding: '32px', borderRadius: '12px', border: '1px solid #e2e8f0', maxWidth: '600px' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>Select Task</label>
            <select required value={formData.task_id} onChange={e => setFormData({...formData, task_id: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
              <option value="">-- Choose a Task --</option>
              {tasks.map(t => <option key={t.id} value={t.id}>{t.task_number}: {t.title}</option>)}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>Description of Work</label>
            <textarea required rows="4" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontFamily: 'inherit' }} placeholder="What did you accomplish?" />
          </div>

          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>Duration</label>
              <input type="number" required min="0.5" step="0.5" value={formData.duration_value} onChange={e => setFormData({...formData, duration_value: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>Unit</label>
              <select value={formData.duration_unit} onChange={e => setFormData({...formData, duration_unit: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                <option value="hours">Hours</option>
                <option value="days">Days</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>Attachments (Simulated)</label>
            <div style={{ padding: '32px', border: '2px dashed #cbd5e1', borderRadius: '6px', textAlign: 'center', color: '#64748b', cursor: 'pointer' }}>
              <Upload size={24} style={{ marginBottom: '8px' }} />
              <div>Click or drag files to upload</div>
            </div>
          </div>

          <button type="submit" style={{ padding: '12px 24px', backgroundColor: '#0f172a', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '16px' }}>
            <Send size={18} /> Submit Work for Review
          </button>
        </form>
      </div>
    </div>
  );
};

// --- 4.8 Daily Report ---
export const DailyReport = () => {
  const [history, setHistory] = useState([]);
  const today = new Date().toISOString().split('T')[0];
  const [formData, setFormData] = useState({
    report_date: today,
    tasks_completed_count: 0,
    tasks_in_progress_count: 0,
    issues_challenges: '',
    planned_tomorrow: '',
    additional_notes: ''
  });
  const [isEditingExisting, setIsEditingExisting] = useState(false);

  useEffect(() => {
    const fetch = () => {
      const reports = employeePortalState.getDailyReports(SESSION_EMPLOYEE_ID);
      setHistory(reports);
      
      const todayReport = reports.find(r => r.report_date === today);
      if (todayReport) {
        setIsEditingExisting(true);
        setFormData(todayReport);
      } else {
        setIsEditingExisting(false);
        // Pre-compute defaults
        const summary = employeePortalState.getDashboardSummary(SESSION_EMPLOYEE_ID);
        setFormData(prev => ({ ...prev, tasks_completed_count: summary.tasksCompletedToday, tasks_in_progress_count: summary.tasksPending }));
      }
    };
    fetch();
    return employeePortalState.subscribe(fetch);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    employeePortalState.submitDailyReport(SESSION_EMPLOYEE_ID, formData);
  };

  return (
    <div style={{ padding: '24px', backgroundColor: '#f8fafc', minHeight: 'calc(100vh - 64px)' }}>
      <PageHeader title="Daily Report" description="Submit your end-of-day summary." />

      <div style={{ display: 'flex', gap: '32px' }}>
        <div style={{ flex: 1, backgroundColor: 'white', padding: '32px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          {isEditingExisting && (
            <div style={{ backgroundColor: '#eff6ff', color: '#1d4ed8', padding: '12px 16px', borderRadius: '8px', marginBottom: '24px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={16} /> You have already submitted a report for today. Submitting again will update your existing report.
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>Date</label>
                <input type="date" required disabled value={formData.report_date} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc' }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>Tasks Completed</label>
                <input type="number" required value={formData.tasks_completed_count} onChange={e => setFormData({...formData, tasks_completed_count: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>Tasks In Progress</label>
                <input type="number" required value={formData.tasks_in_progress_count} onChange={e => setFormData({...formData, tasks_in_progress_count: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>Issues or Challenges</label>
              <textarea rows="3" value={formData.issues_challenges} onChange={e => setFormData({...formData, issues_challenges: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontFamily: 'inherit' }} />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>Planned for Tomorrow</label>
              <textarea rows="3" value={formData.planned_tomorrow} onChange={e => setFormData({...formData, planned_tomorrow: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontFamily: 'inherit' }} />
            </div>

            <button type="submit" style={{ padding: '12px 24px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <FileText size={18} /> {isEditingExisting ? 'Update Report' : 'Submit Report'}
            </button>
          </form>
        </div>

        <div style={{ width: '350px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', margin: '0 0 16px' }}>Past Reports</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {history.map(h => (
              <div key={h.id} style={{ backgroundColor: 'white', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontWeight: '700', color: '#0f172a' }}>{h.report_date}</span>
                  <span style={{ color: '#64748b', fontSize: '12px' }}>{h.submitted_at ? new Date(h.submitted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                </div>
                <div style={{ color: '#475569', fontSize: '13px' }}>
                  Completed: {h.tasks_completed_count} | In Progress: {h.tasks_in_progress_count}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- 4.10 Work History ---
export const WorkHistory = () => {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const fetch = () => setHistory(employeePortalState.getWorkHistory(SESSION_EMPLOYEE_ID));
    fetch();
    return employeePortalState.subscribe(fetch);
  }, []);

  return (
    <div style={{ padding: '24px', backgroundColor: '#f8fafc', minHeight: 'calc(100vh - 64px)' }}>
      <PageHeader title="Work History" description="Ledger of past submissions and their approval status." />
      
      <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#64748b', fontSize: '13px' }}>
              <th style={{ padding: '16px 24px' }}>Submission #</th>
              <th>Task ID</th>
              <th>Date Submitted</th>
              <th>Status</th>
              <th>Feedback</th>
            </tr>
          </thead>
          <tbody>
            {history.map(h => (
              <tr key={h.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '16px 24px', fontWeight: '600', color: '#0f172a' }}>{h.submission_number}</td>
                <td style={{ color: '#475569', fontSize: '14px' }}>{h.task_id}</td>
                <td style={{ color: '#64748b', fontSize: '13px' }}>{new Date(h.submitted_at).toLocaleString()}</td>
                <td>
                  <span style={{ 
                    padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase',
                    backgroundColor: h.status === 'approved' ? '#ecfdf5' : (h.status === 'rejected' ? '#fef2f2' : '#f8fafc'),
                    color: h.status === 'approved' ? '#10b981' : (h.status === 'rejected' ? '#ef4444' : '#64748b')
                  }}>
                    {h.status.replace('_', ' ')}
                  </span>
                </td>
                <td style={{ color: '#475569', fontSize: '13px', maxWidth: '300px' }}>{h.feedback || '-'}</td>
              </tr>
            ))}
            {history.length === 0 && (
              <tr><td colSpan="5" style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>No work history found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
