import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import hrService from '../../services/hrService';
import { playSuccessSound } from '../../utils/playNotificationSound';
import styles from './HRAddEmployee.module.css';

const INIT_FORM = {
  full_name: '', national_id: '', date_of_birth: '', gender: 'Male', marital_status: 'Single',
  personal_phone: '', personal_email: '', physical_address: '',
  dept_id: '', position_id: '', direct_manager_id: '',
  hire_date: '', employment_type: 'Permanent', base_salary: '',
  housing_allowance: '', transport_allowance: '', communication_allowance: '',
  bank_name: '', bank_account_number: '',
  has_pc_access: 'No', shift_start_time: '08:00', shift_end_time: '17:00', weekly_off_days: 'Saturday,Sunday',
  emergency_contact_name: '', emergency_contact_phone: '',
};

const HRAddEmployee = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState(INIT_FORM);
  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);
  const [file, setFile] = useState(null);

  useEffect(() => {
    const fetchFormOptions = async () => {
      try {
        const [deptRes, posRes] = await Promise.all([
          hrService.etp.getDepartments(),
          hrService.etp.getPositions(),
        ]);
        setDepartments(deptRes.data?.data || deptRes.data || []);
        setPositions(posRes.data?.data || posRes.data || []);
      } catch (err) {
        console.error('Failed to fetch form options:', err);
      }
    };
    fetchFormOptions();
  }, []);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      // In a real app, you would use FormData to upload the file along with the form fields.
      // E.g., const formData = new FormData();
      // formData.append('document', file);
      // for (const key in form) formData.append(key, form[key]);
      
      await hrService.etp.createEmployee(form);
      playSuccessSound();
      navigate('/hr/employee-list');
    } catch (err) {
      alert('Failed to save employee');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.pageTitle}>Add New Employee</h1>
        <p className={styles.pageSubtitle}>Complete the multi-section form to register an employee</p>
      </div>

      <form onSubmit={handleSave} className={styles.formContainer}>
        {/* SECTION: PERSONAL */}
        <div className={styles.sectionCard}>
          <h2 className={styles.sectionTitle}>Personal Information</h2>
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label>Full Name *</label>
              <input value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})} required />
            </div>
            <div className={styles.formGroup}>
              <label>National ID</label>
              <input value={form.national_id} onChange={e => setForm({...form, national_id: e.target.value})} />
            </div>
            <div className={styles.formGroup}>
              <label>Date of Birth</label>
              <input type="date" value={form.date_of_birth} onChange={e => setForm({...form, date_of_birth: e.target.value})} />
            </div>
            <div className={styles.formGroup}>
              <label>Gender</label>
              <select value={form.gender} onChange={e => setForm({...form, gender: e.target.value})}>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
            <div className={styles.formGroup}>
              <label>Marital Status</label>
              <select value={form.marital_status} onChange={e => setForm({...form, marital_status: e.target.value})}>
                <option value="Single">Single</option>
                <option value="Married">Married</option>
                <option value="Divorced">Divorced</option>
              </select>
            </div>
            <div className={styles.formGroup}>
              <label>Phone Number</label>
              <input value={form.personal_phone} onChange={e => setForm({...form, personal_phone: e.target.value})} />
            </div>
            <div className={styles.formGroup}>
              <label>Email Address</label>
              <input type="email" value={form.personal_email} onChange={e => setForm({...form, personal_email: e.target.value})} />
            </div>
            <div className={styles.formGroup}>
              <label>Physical Address</label>
              <input value={form.physical_address} onChange={e => setForm({...form, physical_address: e.target.value})} />
            </div>
          </div>
        </div>

        {/* SECTION: EMPLOYMENT */}
        <div className={styles.sectionCard}>
          <h2 className={styles.sectionTitle}>Employment Details</h2>
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label>Department *</label>
              <select value={form.dept_id} onChange={e => setForm({...form, dept_id: e.target.value})} required>
                <option value="">Select Department</option>
                {departments.map(d => <option key={d.dept_id} value={d.dept_id}>{d.dept_name}</option>)}
              </select>
            </div>
            <div className={styles.formGroup}>
              <label>Position *</label>
              <select value={form.position_id} onChange={e => setForm({...form, position_id: e.target.value})} required>
                <option value="">Select Position</option>
                {positions.map(p => <option key={p.position_id} value={p.position_id}>{p.position_title}</option>)}
              </select>
            </div>
            <div className={styles.formGroup}>
              <label>Employment Type</label>
              <select value={form.employment_type} onChange={e => setForm({...form, employment_type: e.target.value})}>
                <option value="Permanent">Permanent</option>
                <option value="Contract">Contract</option>
                <option value="Probation">Probation</option>
              </select>
            </div>
            <div className={styles.formGroup}>
              <label>Hire Date</label>
              <input type="date" value={form.hire_date} onChange={e => setForm({...form, hire_date: e.target.value})} />
            </div>
          </div>
        </div>

        {/* SECTION: FINANCIAL & BANK */}
        <div className={styles.sectionCard}>
          <h2 className={styles.sectionTitle}>Financial & Bank Information</h2>
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label>Base Salary (ETB) *</label>
              <input type="number" min="0" value={form.base_salary} onChange={e => setForm({...form, base_salary: e.target.value})} required />
            </div>
            <div className={styles.formGroup}>
              <label>Housing Allowance</label>
              <input type="number" min="0" value={form.housing_allowance} onChange={e => setForm({...form, housing_allowance: e.target.value})} />
            </div>
            <div className={styles.formGroup}>
              <label>Transport Allowance</label>
              <input type="number" min="0" value={form.transport_allowance} onChange={e => setForm({...form, transport_allowance: e.target.value})} />
            </div>
            <div className={styles.formGroup}>
              <label>Bank Name</label>
              <select value={form.bank_name} onChange={e => setForm({...form, bank_name: e.target.value})}>
                <option value="">Select Bank</option>
                <option value="CBE">Commercial Bank of Ethiopia</option>
                <option value="Dashen">Dashen Bank</option>
                <option value="Awash">Awash Bank</option>
              </select>
            </div>
            <div className={styles.formGroup}>
              <label>Bank Account Number</label>
              <input value={form.bank_account_number} onChange={e => setForm({...form, bank_account_number: e.target.value})} />
            </div>
          </div>
        </div>

        {/* SECTION: SHIFTS & DOCS */}
        <div className={styles.sectionCard}>
          <h2 className={styles.sectionTitle}>Shifts & Documentation</h2>
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label>Shift Start Time</label>
              <input type="time" value={form.shift_start_time} onChange={e => setForm({...form, shift_start_time: e.target.value})} />
            </div>
            <div className={styles.formGroup}>
              <label>Shift End Time</label>
              <input type="time" value={form.shift_end_time} onChange={e => setForm({...form, shift_end_time: e.target.value})} />
            </div>
            <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
              <label>Upload Employee Documents (ID, Contract)</label>
              <div className={styles.uploadArea} onClick={() => fileInputRef.current?.click()}>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  style={{ display: 'none' }} 
                  onChange={handleFileChange} 
                />
                <div className={styles.uploadIcon}>📄</div>
                <div className={styles.uploadText}>
                  {file ? file.name : 'Click to select a file to upload'}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.actions}>
          <button type="button" className={styles.cancelBtn} onClick={() => navigate('/hr/employee-list')}>Cancel</button>
          <button type="submit" className={styles.submitBtn} disabled={saving}>
            {saving ? 'Registering...' : 'Complete Registration'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default HRAddEmployee;
