import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import hrService from '../../services/hrService';
import { playSuccessSound } from '../../utils/playNotificationSound';
import styles from './HRAddEmployee.module.css';

const INIT_FORM = {
  full_name: '', national_id: '', date_of_birth: '', gender: 'Male', marital_status: 'Single',
  personal_phone: '', personal_email: '', physical_address: '',
  dept_id: '', position_id: '',
  hire_date: '', employment_type: 'Permanent', base_salary: '',
  housing_allowance: '', transport_allowance: '',
  bank_name: '', bank_account_number: '',
  has_pc_access: 'No', shift_start_time: '08:00', shift_end_time: '17:00',
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
  const [submitStatus, setSubmitStatus] = useState({ type: null, message: '' });

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
    setSubmitStatus({ type: null, message: '' });
    try {
      const submitData = {
        ...form,
        document_path: file ? `/uploads/documents/${file.name}` : null,
        date_of_birth: form.date_of_birth || null,
        base_salary: form.base_salary || null,
        housing_allowance: form.housing_allowance || null,
        transport_allowance: form.transport_allowance || null,
        bank_account_number: form.bank_account_number.trim() || null,
        bank_name: form.bank_name || null,
        national_id: form.national_id || null,
      };

      await hrService.etp.createEmployee(submitData);
      playSuccessSound();
      setSubmitStatus({ type: 'success', message: `✅ ${form.full_name} registered successfully! Redirecting…` });
      setTimeout(() => navigate(`/hr/employees?tab=list&registered=${encodeURIComponent(form.full_name)}`), 1500);
    } catch (err) {
      setSubmitStatus({ type: 'error', message: err?.response?.data?.message || 'Failed to register employee. Please check the details.' });
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const F = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  return (
    <div className={styles.pageContainer}>

      {/* ── TITLE BAR (clean, no big hero) ── */}
      <div className={styles.titlebar}>
        <div>
          <div className={styles.breadcrumb}>HR Module · Employee Registration</div>
          <h1 className={styles.title}>New Employee Registration Form</h1>
          <p className={styles.subtitle}>Complete all required fields to register a new team member.</p>
        </div>
        <div className={styles.steps}>
          {['Personal', 'Employment', 'Financial', 'Emergency'].map((s, i) => (
            <div className={styles.step} key={s}>
              <span className={styles.stepNum}>{i + 1}</span>
              {s}
            </div>
          ))}
        </div>
      </div>

      {/* ── FORM ── */}
      <form onSubmit={handleSave} className={styles.form}>

        {/* ─── SECTION 1: PERSONAL ─── */}
        <div className={styles.section}>
          <div className={styles.sectionHdr}>
            <span className={styles.sectionNum}>1</span>
            <h2 className={styles.sectionTitle}>Personal Information</h2>
          </div>
          <div className={styles.sectionBody}>
            <div className={styles.grid}>
              <div className={styles.field}>
                <label>Full Name <span>*</span></label>
                <input value={form.full_name} onChange={F('full_name')} required placeholder="e.g. Yonas Mezgebu" />
              </div>
              <div className={styles.field}>
                <label>National ID</label>
                <input value={form.national_id} onChange={F('national_id')} placeholder="Ethiopian National ID" />
              </div>
              <div className={styles.field}>
                <label>Date of Birth</label>
                <input type="date" value={form.date_of_birth} onChange={F('date_of_birth')} />
              </div>
              <div className={styles.field}>
                <label>Gender</label>
                <select value={form.gender} onChange={F('gender')}>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
              <div className={styles.field}>
                <label>Marital Status</label>
                <select value={form.marital_status} onChange={F('marital_status')}>
                  <option value="Single">Single</option>
                  <option value="Married">Married</option>
                  <option value="Divorced">Divorced</option>
                  <option value="Widowed">Widowed</option>
                </select>
              </div>
              <div className={styles.field}>
                <label>Phone Number</label>
                <input value={form.personal_phone} onChange={F('personal_phone')} placeholder="09XXXXXXXX" />
              </div>
              <div className={styles.field}>
                <label>Email Address</label>
                <input type="email" value={form.personal_email} onChange={F('personal_email')} placeholder="employee@example.com" />
              </div>
              <div className={styles.field}>
                <label>Physical Address</label>
                <input value={form.physical_address} onChange={F('physical_address')} placeholder="City, Sub-city, Woreda" />
              </div>
            </div>
          </div>
        </div>

        {/* ─── SECTION 2: EMPLOYMENT ─── */}
        <div className={styles.section}>
          <div className={styles.sectionHdr}>
            <span className={styles.sectionNum}>2</span>
            <h2 className={styles.sectionTitle}>Employment Details</h2>
          </div>
          <div className={styles.sectionBody}>
            <div className={styles.grid}>
              <div className={styles.field}>
                <label>Department <span>*</span></label>
                <select value={form.dept_id} onChange={F('dept_id')} required>
                  <option value="">Select Department</option>
                  {departments.map(d => <option key={d.dept_id} value={d.dept_id}>{d.dept_name}</option>)}
                </select>
              </div>
              <div className={styles.field}>
                <label>Position <span>*</span></label>
                <select value={form.position_id} onChange={F('position_id')} required>
                  <option value="">Select Position</option>
                  {positions.map(p => <option key={p.position_id} value={p.position_id}>{p.position_title}</option>)}
                </select>
              </div>
              <div className={styles.field}>
                <label>Employment Type</label>
                <select value={form.employment_type} onChange={F('employment_type')}>
                  <option value="Permanent">Permanent</option>
                  <option value="Contract">Contract</option>
                  <option value="Probation">Probation</option>
                </select>
              </div>
              <div className={styles.field}>
                <label>Hire Date</label>
                <input type="date" value={form.hire_date} onChange={F('hire_date')} />
              </div>
              <div className={styles.field}>
                <label>Shift Start Time</label>
                <input type="time" value={form.shift_start_time} onChange={F('shift_start_time')} />
              </div>
              <div className={styles.field}>
                <label>Shift End Time</label>
                <input type="time" value={form.shift_end_time} onChange={F('shift_end_time')} />
              </div>
              <div className={styles.field}>
                <label>System Access (PC)</label>
                <select value={form.has_pc_access} onChange={F('has_pc_access')}>
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* ─── SECTION 3: FINANCIAL & BANK ─── */}
        <div className={styles.section}>
          <div className={styles.sectionHdr}>
            <span className={styles.sectionNum}>3</span>
            <h2 className={styles.sectionTitle}>Financial &amp; Bank Information</h2>
          </div>
          <div className={styles.sectionBody}>
            <div className={styles.grid}>
              <div className={styles.field}>
                <label>Base Salary (ETB) <span>*</span></label>
                <input type="number" min="0" value={form.base_salary} onChange={F('base_salary')} required placeholder="0.00" />
              </div>
              <div className={styles.field}>
                <label>Housing Allowance</label>
                <input type="number" min="0" value={form.housing_allowance} onChange={F('housing_allowance')} placeholder="0.00" />
              </div>
              <div className={styles.field}>
                <label>Transport Allowance</label>
                <input type="number" min="0" value={form.transport_allowance} onChange={F('transport_allowance')} placeholder="0.00" />
              </div>
              <div className={styles.field}>
                <label>Bank Name</label>
                <select value={form.bank_name} onChange={F('bank_name')}>
                  <option value="">Select Bank</option>
                  <option value="CBE">Commercial Bank of Ethiopia</option>
                  <option value="Dashen">Dashen Bank</option>
                  <option value="Awash">Awash Bank</option>
                  <option value="Abyssinia">Bank of Abyssinia</option>
                  <option value="Berhan">Berhan Bank</option>
                  <option value="Hibret">Hibret Bank</option>
                  <option value="Cooperative">Cooperative Bank</option>
                </select>
              </div>
              <div className={styles.field}>
                <label>Bank Account Number</label>
                <input value={form.bank_account_number} onChange={F('bank_account_number')} placeholder="Account number" />
              </div>
            </div>
          </div>
        </div>

        {/* ─── SECTION 4: EMERGENCY & DOCUMENTS ─── */}
        <div className={styles.section}>
          <div className={styles.sectionHdr}>
            <span className={styles.sectionNum}>4</span>
            <h2 className={styles.sectionTitle}>Emergency Contact &amp; Documents</h2>
          </div>
          <div className={styles.sectionBody}>
            <div className={styles.grid}>
              <div className={styles.field}>
                <label>Emergency Contact Name</label>
                <input value={form.emergency_contact_name} onChange={F('emergency_contact_name')} placeholder="Full name" />
              </div>
              <div className={styles.field}>
                <label>Emergency Contact Phone</label>
                <input value={form.emergency_contact_phone} onChange={F('emergency_contact_phone')} placeholder="09XXXXXXXX" />
              </div>
              <div className={`${styles.field} ${styles.fullCol}`}>
                <label>Upload Employee Documents <span style={{ color: '#BDBDBD', fontWeight: 400, textTransform: 'none', fontSize: 10, marginLeft: 6 }}>(ID, Contract — Optional)</span></label>
                <div className={styles.upload} onClick={() => fileInputRef.current?.click()}>
                  <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                  />
                  <div className={styles.uploadIcon}>📄</div>
                  <div className={styles.uploadText}>
                    {file ? file.name : 'Click to select a file'}
                  </div>
                  <div className={styles.uploadHint}>PDF, JPG, PNG accepted</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ─── STATUS MESSAGE ─── */}
        {submitStatus.message && (
          <div className={submitStatus.type === 'success' ? styles.statusSuccess : styles.statusError}>
            {submitStatus.message}
          </div>
        )}

        {/* ─── ACTIONS BAR ─── */}
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.btnCancel}
            onClick={() => navigate('/hr/employees?tab=list')}
          >
            Cancel
          </button>
          <button
            type="submit"
            className={styles.btnSubmit}
            disabled={saving}
          >
            {saving ? 'Registering…' : 'Complete Registration'}
          </button>
        </div>

      </form>
    </div>
  );
};

export default HRAddEmployee;
