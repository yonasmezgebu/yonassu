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
        // Ensure empty strings become null for date/numeric fields
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
    <div className={styles.container} style={{ margin: 0, padding: 0 }}>

      {/* ══ WORLD-CLASS HERO HEADER — ADD EMPLOYEE ══ */}
      <div style={{
        position: 'relative',
        background: 'linear-gradient(135deg, #022c22 0%, #064e3b 35%, #065f46 65%, #047857 100%)',
        borderRadius: 0,
        padding: '36px 24px 52px',
        overflow: 'hidden',
        marginBottom: '-24px',
      }}>
        {/* Glowing orbs — emerald tones */}
        <div style={{ position: 'absolute', top: -60, right: -40, width: 260, height: 260, borderRadius: '50%', background: 'radial-gradient(circle, rgba(16,185,129,0.45) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -50, left: 60, width: 220, height: 220, borderRadius: '50%', background: 'radial-gradient(circle, rgba(5,150,105,0.3) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: 10, left: '50%', width: 140, height: 140, borderRadius: '50%', background: 'radial-gradient(circle, rgba(52,211,153,0.2) 0%, transparent 70%)', pointerEvents: 'none' }} />

        {/* Grid overlay */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '40px 40px', pointerEvents: 'none' }} />

        {/* Content row */}
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            {/* Eyebrow badge */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(16,185,129,0.2)', border: '1px solid rgba(16,185,129,0.45)', borderRadius: 20, padding: '4px 14px', marginBottom: 14 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399', display: 'inline-block', boxShadow: '0 0 8px #34d399' }} />
              <span style={{ color: '#6ee7b7', fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>HR · Onboarding</span>
            </div>

            <h1 style={{ margin: '0 0 8px', fontSize: 38, fontWeight: 900, color: '#ffffff', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
              Add New
              <span style={{ background: 'linear-gradient(90deg, #34d399, #67e8f9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginLeft: 12 }}>Employee</span>
            </h1>
            <p style={{ margin: 0, color: '#6ee7b7', fontSize: 15, fontWeight: 400, opacity: 0.85 }}>
              Complete the form below to register a new team member in the system.
            </p>
          </div>

          {/* Right: icon badge */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 12, flexShrink: 0 }}>
            <div style={{ background: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 16, padding: '16px 24px', textAlign: 'center' }}>
              <div style={{ fontSize: 32, lineHeight: 1 }}>👤</div>
              <div style={{ fontSize: 12, color: '#a7f3d0', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 6 }}>New Hire</div>
            </div>
          </div>
        </div>

        {/* Progress steps indicator */}
        <div style={{ position: 'relative', zIndex: 2, marginTop: 28, display: 'flex', gap: 8, alignItems: 'center' }}>
          {['Personal Info', 'Employment', 'Financial', 'Emergency'].map((step, i) => (
            <React.Fragment key={step}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 20, padding: '6px 14px' }}>
                <span style={{ width: 18, height: 18, borderRadius: '50%', background: 'rgba(52,211,153,0.4)', border: '1px solid #34d399', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: '#fff' }}>{i + 1}</span>
                <span style={{ color: '#d1fae5', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>{step}</span>
              </div>
              {i < 3 && <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.15)', minWidth: 12 }} />}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Spacer */}
      <div style={{ height: 28 }} />

      <form onSubmit={handleSave} className={styles.formContainer}>

        {/* SECTION: PERSONAL */}
        <div className={styles.sectionCard}>
          <h2 className={styles.sectionTitle}>Personal Information</h2>
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label>Full Name *</label>
              <input value={form.full_name} onChange={F('full_name')} required placeholder="e.g. Yonas Mezgebu" />
            </div>
            <div className={styles.formGroup}>
              <label>National ID</label>
              <input value={form.national_id} onChange={F('national_id')} placeholder="Ethiopian National ID" />
            </div>
            <div className={styles.formGroup}>
              <label>Date of Birth</label>
              <input type="date" value={form.date_of_birth} onChange={F('date_of_birth')} />
            </div>
            <div className={styles.formGroup}>
              <label>Gender</label>
              <select value={form.gender} onChange={F('gender')}>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
            <div className={styles.formGroup}>
              <label>Marital Status</label>
              <select value={form.marital_status} onChange={F('marital_status')}>
                <option value="Single">Single</option>
                <option value="Married">Married</option>
                <option value="Divorced">Divorced</option>
                <option value="Widowed">Widowed</option>
              </select>
            </div>
            <div className={styles.formGroup}>
              <label>Phone Number</label>
              <input value={form.personal_phone} onChange={F('personal_phone')} placeholder="09XXXXXXXX" />
            </div>
            <div className={styles.formGroup}>
              <label>Email Address</label>
              <input type="email" value={form.personal_email} onChange={F('personal_email')} placeholder="employee@example.com" />
            </div>
            <div className={styles.formGroup}>
              <label>Physical Address</label>
              <input value={form.physical_address} onChange={F('physical_address')} placeholder="City, Sub-city, Woreda" />
            </div>
          </div>
        </div>

        {/* SECTION: EMPLOYMENT */}
        <div className={styles.sectionCard}>
          <h2 className={styles.sectionTitle}>Employment Details</h2>
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label>Department *</label>
              <select value={form.dept_id} onChange={F('dept_id')} required>
                <option value="">Select Department</option>
                {departments.map(d => <option key={d.dept_id} value={d.dept_id}>{d.dept_name}</option>)}
              </select>
            </div>
            <div className={styles.formGroup}>
              <label>Position *</label>
              <select value={form.position_id} onChange={F('position_id')} required>
                <option value="">Select Position</option>
                {positions.map(p => <option key={p.position_id} value={p.position_id}>{p.position_title}</option>)}
              </select>
            </div>
            <div className={styles.formGroup}>
              <label>Employment Type</label>
              <select value={form.employment_type} onChange={F('employment_type')}>
                <option value="Permanent">Permanent</option>
                <option value="Contract">Contract</option>
                <option value="Probation">Probation</option>
              </select>
            </div>
            <div className={styles.formGroup}>
              <label>Hire Date</label>
              <input type="date" value={form.hire_date} onChange={F('hire_date')} />
            </div>
            <div className={styles.formGroup}>
              <label>Shift Start Time</label>
              <input type="time" value={form.shift_start_time} onChange={F('shift_start_time')} />
            </div>
            <div className={styles.formGroup}>
              <label>Shift End Time</label>
              <input type="time" value={form.shift_end_time} onChange={F('shift_end_time')} />
            </div>
            <div className={styles.formGroup}>
              <label>System Access (PC)</label>
              <select value={form.has_pc_access} onChange={F('has_pc_access')}>
                <option value="No">No</option>
                <option value="Yes">Yes</option>
              </select>
            </div>
          </div>
        </div>

        {/* SECTION: FINANCIAL & BANK */}
        <div className={styles.sectionCard}>
          <h2 className={styles.sectionTitle}>Financial &amp; Bank Information</h2>
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label>Base Salary (ETB) *</label>
              <input type="number" min="0" value={form.base_salary} onChange={F('base_salary')} required placeholder="0.00" />
            </div>
            <div className={styles.formGroup}>
              <label>Housing Allowance</label>
              <input type="number" min="0" value={form.housing_allowance} onChange={F('housing_allowance')} placeholder="0.00" />
            </div>
            <div className={styles.formGroup}>
              <label>Transport Allowance</label>
              <input type="number" min="0" value={form.transport_allowance} onChange={F('transport_allowance')} placeholder="0.00" />
            </div>
            <div className={styles.formGroup}>
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
            <div className={styles.formGroup}>
              <label>Bank Account Number</label>
              <input value={form.bank_account_number} onChange={F('bank_account_number')} placeholder="Account number" />
            </div>
          </div>
        </div>

        {/* SECTION: EMERGENCY & DOCUMENTS */}
        <div className={styles.sectionCard}>
          <h2 className={styles.sectionTitle}>Emergency Contact &amp; Documents</h2>
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label>Emergency Contact Name</label>
              <input value={form.emergency_contact_name} onChange={F('emergency_contact_name')} placeholder="Full name" />
            </div>
            <div className={styles.formGroup}>
              <label>Emergency Contact Phone</label>
              <input value={form.emergency_contact_phone} onChange={F('emergency_contact_phone')} placeholder="09XXXXXXXX" />
            </div>
            <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
              <label>Upload Employee Documents (ID, Contract) <span style={{ color: '#6b7280', fontSize: '0.85em', fontWeight: 'normal' }}>(Optional)</span></label>
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

        <div className={styles.actions} style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '15px' }}>
          {submitStatus.message && (
            <div style={{
              color: submitStatus.type === 'success' ? '#059669' : '#dc2626',
              fontSize: '0.9rem',
              fontWeight: '500',
              marginRight: 'auto',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              {submitStatus.message}
            </div>
          )}
          <button type="button" className={styles.cancelBtn} onClick={() => navigate('/hr/employees?tab=list')}>Cancel</button>
          <button type="submit" className={styles.submitBtn} disabled={saving}>
            {saving ? 'Registering…' : 'Complete Registration'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default HRAddEmployee;
