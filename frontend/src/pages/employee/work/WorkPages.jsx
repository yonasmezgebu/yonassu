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
  const [formData, setFormData] = useState({
    report_text: '',
    document_name: '',
    document_url: '' // Will simulate file upload
  });
  const [submitting, setSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/employee-reports/my', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      // Simulate file upload by setting a fake URL and name
      setFormData(prev => ({
        ...prev,
        document_name: file.name,
        document_url: `/uploads/reports/${file.name}`
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // Fetch user profile to get department
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : {};
      let dept = 'general';
      if (user.role) {
        if (user.role.toLowerCase().includes('pharmacy')) dept = 'pharmacy';
        else if (user.role.toLowerCase().includes('sales')) dept = 'sales';
        else if (user.role.toLowerCase().includes('print')) dept = 'printing';
        else if (user.role.toLowerCase().includes('car')) dept = 'car_rental';
        else if (user.role.toLowerCase().includes('purchase')) dept = 'purchase';
      }

      const res = await fetch('http://localhost:5000/api/employee-reports', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          ...formData,
          department: dept
        })
      });

      if (!res.ok) throw new Error('Failed to submit report');
      
      setFormData({ report_text: '', document_name: '', document_url: '' });
      setSelectedFile(null);
      fetchHistory();
      alert('Report submitted successfully to your manager!');
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: '24px', backgroundColor: '#f8fafc', minHeight: 'calc(100vh - 64px)' }}>
      <PageHeader title="Submit Report" description="Submit your daily report or task report to your manager." />

      <div style={{ display: 'flex', gap: '32px' }}>
        <div style={{ flex: 1, backgroundColor: 'white', padding: '32px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>Report Text</label>
              <textarea 
                required 
                rows="6" 
                value={formData.report_text} 
                onChange={e => setFormData({...formData, report_text: e.target.value})} 
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontFamily: 'inherit', fontSize: '14px' }} 
                placeholder="Write your report or summarize your completed tasks here..."
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>Attach Document (Optional)</label>
              <div style={{ padding: '24px', border: '2px dashed #cbd5e1', borderRadius: '8px', textAlign: 'center', backgroundColor: '#f8fafc', position: 'relative' }}>
                <input 
                  type="file" 
                  onChange={handleFileChange} 
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }} 
                />
                <FileText size={28} style={{ marginBottom: '8px', color: '#94a3b8' }} />
                <div style={{ color: '#475569', fontWeight: '600' }}>
                  {selectedFile ? selectedFile.name : 'Click or drag a document here to upload'}
                </div>
              </div>
            </div>

            <button disabled={submitting} type="submit" style={{ padding: '14px 24px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', fontSize: '15px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: submitting ? 0.7 : 1 }}>
              <Send size={18} /> {submitting ? 'Submitting...' : 'Submit Report'}
            </button>
          </form>
        </div>

        <div style={{ width: '400px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: '0 0 16px' }}>My Previous Reports</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {history.length === 0 ? (
              <p style={{ color: '#94a3b8', fontSize: '14px' }}>No reports submitted yet.</p>
            ) : history.map(h => (
              <div key={h.id} style={{ backgroundColor: 'white', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontWeight: '700', color: '#0f172a', fontSize: '14px' }}>
                    {new Date(h.created_at).toLocaleDateString()}
                  </span>
                  <span style={{ color: '#64748b', fontSize: '12px' }}>
                    {new Date(h.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div style={{ color: '#475569', fontSize: '13px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {h.report_text}
                </div>
                {h.document_name && (
                  <div style={{ marginTop: '10px', fontSize: '12px', color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600' }}>
                    <FileText size={14} /> {h.document_name}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};


