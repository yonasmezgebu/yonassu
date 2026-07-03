import React, { useState, useEffect } from 'react';
import hrService from '../../services/hrService';
import { playSuccessSound } from '../../utils/playNotificationSound';
import styles from './HRCheckInOut.module.css';

const HRCheckInOut = () => {
  const [employees, setEmployees] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  
  const [form, setForm] = useState({
    employee_id: '',
    entry_date: new Date().toISOString().split('T')[0],
    entry_time: new Date().toTimeString().substring(0,5),
    entry_type: 'Check-In',
    reason: ''
  });

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res = await hrService.etp.listEmployees({});
        setEmployees(res.data?.data || []);
      } catch (err) {
        console.error('Failed to fetch employees:', err);
      }
    };
    fetchEmployees();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // Create manual entry via HR service
      await hrService.etp.submitManualEntry({
        employee_id: form.employee_id,
        attendance_date: form.entry_date,
        status: form.entry_type === 'Check-In' ? 'Present' : 'Present', // simplified mapping
        notes: `[Manual ${form.entry_type} at ${form.entry_time}] ${form.reason}`,
        work_hours: form.entry_type === 'Check-Out' ? '8' : undefined // optional logic for checkout
      });
      playSuccessSound();
      alert(`Manual ${form.entry_type} recorded successfully!`);
      
      // Reset form but keep date/time
      setForm(prev => ({ ...prev, employee_id: '', reason: '' }));
    } catch (err) {
      console.error(err);
      alert('Failed to submit manual entry');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.pageTitle}>Manual Check-In / Check-Out</h1>
        <p className={styles.pageSubtitle}>Record attendance for employees without PC access or those who forgot to check in.</p>
      </div>

      <div className={styles.formCard}>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label>Employee *</label>
            <select 
              value={form.employee_id} 
              onChange={e => setForm({...form, employee_id: e.target.value})} 
              required
            >
              <option value="">Select Employee...</option>
              {employees.filter(e => e.employment_status === 'Active').map(emp => (
                <option key={emp.employee_id} value={emp.employee_id}>
                  {emp.full_name} ({emp.employee_id})
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Date *</label>
              <input 
                type="date" 
                value={form.entry_date} 
                onChange={e => setForm({...form, entry_date: e.target.value})} 
                required 
              />
            </div>
            <div className={styles.formGroup}>
              <label>Time *</label>
              <input 
                type="time" 
                value={form.entry_time} 
                onChange={e => setForm({...form, entry_time: e.target.value})} 
                required 
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label>Entry Type *</label>
            <div className={styles.radioGroup}>
              <label className={styles.radioLabel}>
                <input 
                  type="radio" 
                  name="entry_type" 
                  value="Check-In" 
                  checked={form.entry_type === 'Check-In'} 
                  onChange={e => setForm({...form, entry_type: e.target.value})} 
                />
                <span>Check-In</span>
              </label>
              <label className={styles.radioLabel}>
                <input 
                  type="radio" 
                  name="entry_type" 
                  value="Check-Out" 
                  checked={form.entry_type === 'Check-Out'} 
                  onChange={e => setForm({...form, entry_type: e.target.value})} 
                />
                <span>Check-Out</span>
              </label>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label>Reason for Manual Entry *</label>
            <textarea 
              value={form.reason} 
              onChange={e => setForm({...form, reason: e.target.value})} 
              placeholder="e.g. Forgot to clock in, PC issues, Field work..."
              required 
              rows={4}
            />
          </div>

          <div className={styles.actions}>
            <button type="submit" className={styles.submitBtn} disabled={submitting}>
              {submitting ? 'Submitting...' : 'Record Entry'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default HRCheckInOut;
