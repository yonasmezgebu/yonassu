import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import hrService from '../../services/hrService';
import { playSuccessSound } from '../../utils/playNotificationSound';

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

const PageStyles = () => (
  <style>{`
    .add-emp * { box-sizing: border-box; }
    .add-emp {
      background: #F5F5F5;
      min-height: 100vh;
      margin: -24px;
      padding: 0;
      font-family: 'Inter', 'Segoe UI', sans-serif;
    }

    /* ── PAGE TITLE BAR (no big hero — just a clean bold title strip) ── */
    .add-emp-titlebar {
      background: #FFFFFF;
      border-bottom: 3px solid #228B22;
      padding: 20px 32px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
    }
    .add-emp-breadcrumb {
      font-size: 11px;
      font-weight: 700;
      color: #6B8E23;
      text-transform: uppercase;
      letter-spacing: .12em;
      margin-bottom: 4px;
    }
    .add-emp-title {
      font-size: 22px;
      font-weight: 900;
      color: #1B5E20;
      margin: 0;
      letter-spacing: -.01em;
    }
    .add-emp-subtitle {
      font-size: 12px;
      color: #6B8E23;
      margin: 4px 0 0;
      font-weight: 500;
    }
    .add-emp-steps {
      display: flex;
      gap: 0;
      border: 1px solid #A5D6A7;
    }
    .add-emp-step {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      border-right: 1px solid #A5D6A7;
      font-size: 11px;
      font-weight: 700;
      color: #6B8E23;
      text-transform: uppercase;
      letter-spacing: .07em;
      background: #F5F5F5;
    }
    .add-emp-step:last-child { border-right: none; }
    .add-emp-step-num {
      width: 18px;
      height: 18px;
      background: #228B22;
      color: #fff;
      font-size: 10px;
      font-weight: 900;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    /* ── FORM WRAPPER ── */
    .add-emp-form {
      padding: 20px 32px 40px;
      display: flex;
      flex-direction: column;
      gap: 0;
    }

    /* ── SECTIONS ── */
    .add-emp-section {
      background: #FFFFFF;
      border: 1px solid #E0E0E0;
      border-top: none;
      padding: 0;
    }
    .add-emp-section:first-of-type { border-top: 1px solid #E0E0E0; }
    .add-emp-section-hdr {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 18px 24px 14px;
      background: #FFFFFF;
      border-bottom: 1px solid #E8F5E9;
      border-left: 4px solid #228B22;
    }
    .add-emp-section-num {
      width: 24px;
      height: 24px;
      background: #F5F5F5;
      border: 1px solid #A5D6A7;
      color: #228B22;
      font-size: 11px;
      font-weight: 900;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .add-emp-section-title {
      font-size: 13px;
      font-weight: 800;
      color: #1B5E20;
      text-transform: uppercase;
      letter-spacing: .08em;
      margin: 0;
    }
    .add-emp-section-body {
      padding: 20px 24px;
    }

    /* ── FORM GRID ── */
    .add-emp-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
    }
    .add-emp-full { grid-column: 1 / -1; }

    /* ── FIELD ── */
    .add-emp-field {
      display: flex;
      flex-direction: column;
      gap: 5px;
    }
    .add-emp-field label {
      font-size: 10px;
      font-weight: 800;
      color: #424242;
      text-transform: uppercase;
      letter-spacing: .1em;
    }
    .add-emp-field label span {
      color: #F44336;
      margin-left: 2px;
    }
    .add-emp-field input,
    .add-emp-field select {
      background: #F5F5F5;
      border: 1px solid #A5D6A7;
      border-top: 2px solid #A5D6A7;
      color: #424242;
      padding: 9px 12px;
      font-size: 13px;
      font-weight: 600;
      font-family: 'Inter', sans-serif;
      outline: none;
      transition: border-color .12s, background .12s;
      border-radius: 0 !important;
    }
    .add-emp-field input:focus,
    .add-emp-field select:focus {
      border-color: #228B22;
      border-top-color: #228B22;
      background: #FFFFFF;
    }
    .add-emp-field input::placeholder {
      color: #BDBDBD;
      font-weight: 400;
    }
    .add-emp-field select option { background: #FFFFFF; }

    /* ── UPLOAD AREA ── */
    .add-emp-upload {
      border: 2px dashed #A5D6A7;
      padding: 28px;
      text-align: center;
      background: #F5F5F5;
      cursor: pointer;
      transition: all .15s;
    }
    .add-emp-upload:hover {
      background: #E8F5E9;
      border-color: #228B22;
    }
    .add-emp-upload-icon { font-size: 28px; margin-bottom: 8px; }
    .add-emp-upload-text {
      color: #6B8E23;
      font-size: 13px;
      font-weight: 600;
    }
    .add-emp-upload-hint {
      color: #BDBDBD;
      font-size: 11px;
      margin-top: 4px;
    }

    /* ── STATUS MESSAGE ── */
    .add-emp-status-success {
      background: #E8F5E9;
      border: 1px solid #4CAF50;
      border-left: 4px solid #228B22;
      color: #1B5E20;
      padding: 12px 16px;
      font-size: 13px;
      font-weight: 700;
      margin-bottom: 0;
    }
    .add-emp-status-error {
      background: #FFEBEE;
      border: 1px solid #F44336;
      border-left: 4px solid #F44336;
      color: #F44336;
      padding: 12px 16px;
      font-size: 13px;
      font-weight: 700;
      margin-bottom: 0;
    }

    /* ── ACTIONS BAR ── */
    .add-emp-actions {
      background: #FFFFFF;
      border: 1px solid #A5D6A7;
      border-top: 3px solid #228B22;
      padding: 16px 24px;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 12px;
      margin-top: -1px;
    }
    .add-emp-cancel {
      background: transparent;
      border: 1px solid #A5D6A7;
      color: #6B8E23;
      padding: 10px 24px;
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: .06em;
      cursor: pointer;
      transition: all .12s;
    }
    .add-emp-cancel:hover { border-color: #228B22; color: #1B5E20; background: #F5F5F5; }
    .add-emp-submit {
      background: #228B22;
      border: 1px solid #228B22;
      color: #FFFFFF;
      padding: 10px 32px;
      font-size: 12px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: .08em;
      cursor: pointer;
      transition: all .12s;
    }
    .add-emp-submit:hover { background: #1B5E20; border-color: #1B5E20; }
    .add-emp-submit:disabled { background: #A5D6A7; border-color: #A5D6A7; cursor: not-allowed; }
  `}</style>
);

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
    <div className="add-emp">
      <PageStyles />

      {/* ── TITLE BAR (clean, no big hero) ── */}
      <div className="add-emp-titlebar">
        <div>
          <div className="add-emp-breadcrumb">HR Module · Employee Registration</div>
          <h1 className="add-emp-title">New Employee Registration Form</h1>
          <p className="add-emp-subtitle">Complete all required fields to register a new team member.</p>
        </div>
        <div className="add-emp-steps">
          {['Personal', 'Employment', 'Financial', 'Emergency'].map((s, i) => (
            <div className="add-emp-step" key={s}>
              <span className="add-emp-step-num">{i + 1}</span>
              {s}
            </div>
          ))}
        </div>
      </div>

      {/* ── FORM ── */}
      <form onSubmit={handleSave} className="add-emp-form">

        {/* ─── SECTION 1: PERSONAL ─── */}
        <div className="add-emp-section">
          <div className="add-emp-section-hdr">
            <span className="add-emp-section-num">1</span>
            <h2 className="add-emp-section-title">Personal Information</h2>
          </div>
          <div className="add-emp-section-body">
            <div className="add-emp-grid">
              <div className="add-emp-field">
                <label>Full Name <span>*</span></label>
                <input value={form.full_name} onChange={F('full_name')} required placeholder="e.g. Yonas Mezgebu" />
              </div>
              <div className="add-emp-field">
                <label>National ID</label>
                <input value={form.national_id} onChange={F('national_id')} placeholder="Ethiopian National ID" />
              </div>
              <div className="add-emp-field">
                <label>Date of Birth</label>
                <input type="date" value={form.date_of_birth} onChange={F('date_of_birth')} />
              </div>
              <div className="add-emp-field">
                <label>Gender</label>
                <select value={form.gender} onChange={F('gender')}>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
              <div className="add-emp-field">
                <label>Marital Status</label>
                <select value={form.marital_status} onChange={F('marital_status')}>
                  <option value="Single">Single</option>
                  <option value="Married">Married</option>
                  <option value="Divorced">Divorced</option>
                  <option value="Widowed">Widowed</option>
                </select>
              </div>
              <div className="add-emp-field">
                <label>Phone Number</label>
                <input value={form.personal_phone} onChange={F('personal_phone')} placeholder="09XXXXXXXX" />
              </div>
              <div className="add-emp-field">
                <label>Email Address</label>
                <input type="email" value={form.personal_email} onChange={F('personal_email')} placeholder="employee@example.com" />
              </div>
              <div className="add-emp-field">
                <label>Physical Address</label>
                <input value={form.physical_address} onChange={F('physical_address')} placeholder="City, Sub-city, Woreda" />
              </div>
            </div>
          </div>
        </div>

        {/* ─── SECTION 2: EMPLOYMENT ─── */}
        <div className="add-emp-section">
          <div className="add-emp-section-hdr">
            <span className="add-emp-section-num">2</span>
            <h2 className="add-emp-section-title">Employment Details</h2>
          </div>
          <div className="add-emp-section-body">
            <div className="add-emp-grid">
              <div className="add-emp-field">
                <label>Department <span>*</span></label>
                <select value={form.dept_id} onChange={F('dept_id')} required>
                  <option value="">Select Department</option>
                  {departments.map(d => <option key={d.dept_id} value={d.dept_id}>{d.dept_name}</option>)}
                </select>
              </div>
              <div className="add-emp-field">
                <label>Position <span>*</span></label>
                <select value={form.position_id} onChange={F('position_id')} required>
                  <option value="">Select Position</option>
                  {positions.map(p => <option key={p.position_id} value={p.position_id}>{p.position_title}</option>)}
                </select>
              </div>
              <div className="add-emp-field">
                <label>Employment Type</label>
                <select value={form.employment_type} onChange={F('employment_type')}>
                  <option value="Permanent">Permanent</option>
                  <option value="Contract">Contract</option>
                  <option value="Probation">Probation</option>
                </select>
              </div>
              <div className="add-emp-field">
                <label>Hire Date</label>
                <input type="date" value={form.hire_date} onChange={F('hire_date')} />
              </div>
              <div className="add-emp-field">
                <label>Shift Start Time</label>
                <input type="time" value={form.shift_start_time} onChange={F('shift_start_time')} />
              </div>
              <div className="add-emp-field">
                <label>Shift End Time</label>
                <input type="time" value={form.shift_end_time} onChange={F('shift_end_time')} />
              </div>
              <div className="add-emp-field">
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
        <div className="add-emp-section">
          <div className="add-emp-section-hdr">
            <span className="add-emp-section-num">3</span>
            <h2 className="add-emp-section-title">Financial &amp; Bank Information</h2>
          </div>
          <div className="add-emp-section-body">
            <div className="add-emp-grid">
              <div className="add-emp-field">
                <label>Base Salary (ETB) <span>*</span></label>
                <input type="number" min="0" value={form.base_salary} onChange={F('base_salary')} required placeholder="0.00" />
              </div>
              <div className="add-emp-field">
                <label>Housing Allowance</label>
                <input type="number" min="0" value={form.housing_allowance} onChange={F('housing_allowance')} placeholder="0.00" />
              </div>
              <div className="add-emp-field">
                <label>Transport Allowance</label>
                <input type="number" min="0" value={form.transport_allowance} onChange={F('transport_allowance')} placeholder="0.00" />
              </div>
              <div className="add-emp-field">
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
              <div className="add-emp-field">
                <label>Bank Account Number</label>
                <input value={form.bank_account_number} onChange={F('bank_account_number')} placeholder="Account number" />
              </div>
            </div>
          </div>
        </div>

        {/* ─── SECTION 4: EMERGENCY & DOCUMENTS ─── */}
        <div className="add-emp-section">
          <div className="add-emp-section-hdr">
            <span className="add-emp-section-num">4</span>
            <h2 className="add-emp-section-title">Emergency Contact &amp; Documents</h2>
          </div>
          <div className="add-emp-section-body">
            <div className="add-emp-grid">
              <div className="add-emp-field">
                <label>Emergency Contact Name</label>
                <input value={form.emergency_contact_name} onChange={F('emergency_contact_name')} placeholder="Full name" />
              </div>
              <div className="add-emp-field">
                <label>Emergency Contact Phone</label>
                <input value={form.emergency_contact_phone} onChange={F('emergency_contact_phone')} placeholder="09XXXXXXXX" />
              </div>
              <div className="add-emp-field add-emp-full">
                <label>Upload Employee Documents <span style={{ color: '#BDBDBD', fontWeight: 400, textTransform: 'none', fontSize: 10 }}>(ID, Contract — Optional)</span></label>
                <div className="add-emp-upload" onClick={() => fileInputRef.current?.click()}>
                  <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                  />
                  <div className="add-emp-upload-icon">📄</div>
                  <div className="add-emp-upload-text">
                    {file ? file.name : 'Click to select a file'}
                  </div>
                  <div className="add-emp-upload-hint">PDF, JPG, PNG accepted</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ─── STATUS MESSAGE ─── */}
        {submitStatus.message && (
          <div className={submitStatus.type === 'success' ? 'add-emp-status-success' : 'add-emp-status-error'}>
            {submitStatus.message}
          </div>
        )}

        {/* ─── ACTIONS BAR ─── */}
        <div className="add-emp-actions">
          <button
            type="button"
            className="add-emp-cancel"
            onClick={() => navigate('/hr/employees?tab=list')}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="add-emp-submit"
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
