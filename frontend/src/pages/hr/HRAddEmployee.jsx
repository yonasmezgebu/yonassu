import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import hrService from '../../services/hrService';
import { playSuccessSound } from '../../utils/playNotificationSound';
import styles from './HRAddEmployee.module.css';

const getDocIcon = (f) => {
  if (!f) return '📎';
  const ext = (f.name || '').split('.').pop().toLowerCase();
  if (['jpg','jpeg','png','gif','webp'].includes(ext)) return '🖼️';
  if (ext === 'pdf') return '📄';
  if (['doc','docx'].includes(ext)) return '📝';
  if (['xls','xlsx'].includes(ext)) return '📊';
  return '📎';
};
const fmtSize = (b) => !b ? '' : b < 1048576 ? `${(b/1024).toFixed(1)} KB` : `${(b/1048576).toFixed(1)} MB`;

const INIT_FORM = {
  full_name: '', national_id: '', date_of_birth: '', gender: 'Male', marital_status: 'Single',
  personal_phone: '', personal_email: '', physical_address: '',
  dept_id: '', position_id: '',
  hire_date: '', employment_type: 'Permanent', base_salary: '',
  housing_allowance: '', transport_allowance: '',
  bank_name: '', bank_account_number: '',
  has_pc_access: 'No', shift_start_time: '08:00', shift_end_time: '17:00',
  emergency_contact_name: '', emergency_contact_phone: '',
  // Education
  education_level: '', institution_name: '', field_of_study: '', graduation_year: '',
};

// Also extend buildInitForm inside the component to include education fields


const HRAddEmployee = ({ prefillData, onRegistered }) => {
  const navigate = useNavigate();

  // Build initial form — merge INIT_FORM with any prefilled data from existing employee
  const buildInitForm = (data) => ({
    full_name:              data?.full_name || '',
    national_id:            data?.national_id || '',
    date_of_birth:          data?.date_of_birth ? data.date_of_birth.split('T')[0] : '',
    gender:                 data?.gender || 'Male',
    marital_status:         data?.marital_status || 'Single',
    personal_phone:         data?.personal_phone || '',
    personal_email:         data?.personal_email || '',
    physical_address:       data?.physical_address || '',
    dept_id:                data?.dept_id || '',
    position_id:            data?.position_id || '',
    hire_date:              data?.hire_date ? data.hire_date.split('T')[0] : '',
    employment_type:        data?.employment_type || 'Permanent',
    base_salary:            data?.base_salary || '',
    housing_allowance:      data?.housing_allowance || '',
    transport_allowance:    data?.transport_allowance || '',
    bank_name:              data?.bank_name || '',
    bank_account_number:    data?.bank_account_number || '',
    has_pc_access:          data?.has_pc_access || 'No',
    shift_start_time:       data?.shift_start_time || '08:00',
    shift_end_time:         data?.shift_end_time || '17:00',
    emergency_contact_name: data?.emergency_contact_name || '',
    emergency_contact_phone:data?.emergency_contact_phone || '',
    // Education
    education_level:        data?.education_level || '',
    institution_name:       data?.institution_name || '',
    field_of_study:         data?.field_of_study || '',
    graduation_year:        data?.graduation_year || '',
  });

  const [form, setForm] = useState(() => buildInitForm(prefillData));
  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);
  const idFrontRef = useRef(null);
  const idBackRef  = useRef(null);
  const [file, setFile] = useState(null);
  const [fileDragOver, setFileDragOver] = useState(false);
  const [idPhotoFront, setIdPhotoFront] = useState(null); // File object
  const [idPhotoBack,  setIdPhotoBack]  = useState(null); // File object
  const [idFrontPreview, setIdFrontPreview] = useState(prefillData?.id_photo_front || null);
  const [idBackPreview,  setIdBackPreview]  = useState(prefillData?.id_photo_back  || null);
  const [submitStatus, setSubmitStatus] = useState({ type: null, message: '' });

  // When prefillData changes (user clicks another employee), re-populate form
  useEffect(() => {
    setForm(buildInitForm(prefillData));
    setSubmitStatus({ type: null, message: '' });
    setIdPhotoFront(null);
    setIdPhotoBack(null);
    // Build correct URL from stored path like "uploads\\hr\\id-photos\\file.jpg"
    const toUrl = (path) => path ? '/' + path.replace(/\\/g, '/').replace(/^\//, '') : null;
    setIdFrontPreview(prefillData?.id_photo_front ? toUrl(prefillData.id_photo_front) : null);
    setIdBackPreview(prefillData?.id_photo_back   ? toUrl(prefillData.id_photo_back)  : null);
  }, [prefillData?.employee_id]);

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

  const handleIdPhoto = (side, e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const url = URL.createObjectURL(f);
    if (side === 'front') { setIdPhotoFront(f); setIdFrontPreview(url); }
    else                  { setIdPhotoBack(f);  setIdBackPreview(url);  }
  };

  const handleSave = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (e && e.stopPropagation) e.stopPropagation();
    setSaving(true);
    setSubmitStatus({ type: null, message: '' });
    try {
      const submitData = {
        ...form,
        // Don't hardcode document_path — backend handles the upload
        date_of_birth: form.date_of_birth || null,
        base_salary: form.base_salary || null,
        housing_allowance: form.housing_allowance || null,
        transport_allowance: form.transport_allowance || null,
        bank_account_number: form.bank_account_number ? form.bank_account_number.toString().trim() : null,
        bank_name: form.bank_name || null,
        national_id: form.national_id || null,
        // Education
        education_level:  form.education_level  || null,
        institution_name: form.institution_name || null,
        field_of_study:   form.field_of_study   || null,
        graduation_year:  form.graduation_year  || null,
        // ID Photos as File objects — service will put into FormData
        id_photo_front: idPhotoFront || undefined,
        id_photo_back:  idPhotoBack  || undefined,
      };
      // Remove the document_path field (set by backend via multer)
      delete submitData.document_path;

      if (prefillData?.employee_id && prefillData?._source !== 'users_table') {
        // Completing setup for an EXISTING employee (hr_employees) — update their record then request CEO approval
        await hrService.etp.updateEmployee(prefillData.employee_id, { ...submitData, registration_status: 'pending_approval' });
        playSuccessSound();
        setSubmitStatus({ type: 'success', message: `⏳ ${form.full_name}'s registration completed and sent for CEO approval! Awaiting review.` });
        setTimeout(() => {
          if (onRegistered) onRegistered();
          else navigate('/hr/employees?tab=list');
        }, 2000);
      } else {
        // Brand new employee registration (or registering from an existing user account)
        if (prefillData?._source === 'users_table') {
          submitData.user_id = prefillData.employee_id;
        }
        await hrService.etp.createEmployee(submitData);
        playSuccessSound();
        setSubmitStatus({ type: 'success', message: `⏳ ${form.full_name} registered and sent for CEO approval! Awaiting review.` });
        setTimeout(() => {
          if (onRegistered) onRegistered();
          else navigate('/hr/employees?tab=list');
        }, 2000);
      }
    } catch (err) {
      setSubmitStatus({ type: 'error', message: err?.response?.data?.message || err?.message || 'Failed to register employee. Please check the details.' });
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const F = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  return (
    <div className={styles.pageContainer}>

      {/* ── COMPLETING SETUP BANNER ── */}
      {prefillData?.employee_id && (
        <div style={{
          background: 'linear-gradient(135deg, #1565C0 0%, #1976D2 100%)',
          color: '#fff',
          padding: '14px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          fontSize: 14,
          fontWeight: 600,
          borderRadius: '8px 8px 0 0',
          flexShrink: 0,
        }}>
          <span style={{ fontSize: 20 }}>📋</span>
          <div>
            <div>Completing Registration — {prefillData.full_name}</div>
            <div style={{ fontWeight: 400, fontSize: 12, opacity: 0.85, marginTop: 2 }}>
              Fields pre-filled from existing profile. Fill in any missing fields below and submit for CEO approval.
            </div>
          </div>
        </div>
      )}

      {/* ── TITLE BAR ── */}
      <div className={styles.titlebar}>
        <div>
          <div className={styles.breadcrumb}>HR Module · Employee Registration</div>
          <h1 className={styles.title}>
            {prefillData?.employee_id ? `Complete Setup — ${prefillData.full_name}` : 'New Employee Registration Form'}
          </h1>
          <p className={styles.subtitle}>
            {prefillData?.employee_id
              ? 'Review pre-filled information, complete any missing fields, then submit for CEO approval.'
              : 'Complete all required fields to register a new team member.'}
          </p>
        </div>
        <div className={styles.steps}>
          {['Personal', 'Employment', 'Financial', 'Education & Docs'].map((s, i) => (
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

        {/* ─── SECTION 4: EDUCATION & DOCUMENTS ─── */}
        <div className={styles.section}>
          <div className={styles.sectionHdr}>
            <span className={styles.sectionNum}>4</span>
            <h2 className={styles.sectionTitle}>Education &amp; Documents</h2>
          </div>
          <div className={styles.sectionBody}>
            <div className={styles.grid}>
              <div className={styles.field}>
                <label>Education Level <span>*</span></label>
                <select value={form.education_level} onChange={F('education_level')} required>
                  <option value="">Select Level</option>
                  <option value="High School">High School</option>
                  <option value="Certificate">Certificate</option>
                  <option value="Diploma">Diploma</option>
                  <option value="Bachelor's Degree">Bachelor's Degree</option>
                  <option value="Master's Degree">Master's Degree</option>
                  <option value="Professor">Professor</option>
                  <option value="PhD Doctor">PhD Doctor</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className={styles.field}>
                <label>Field of Study / What is Studied</label>
                <input value={form.field_of_study} onChange={F('field_of_study')} placeholder="e.g. Accounting, IT, Management" />
              </div>
              <div className={styles.field}>
                <label>Institution Name</label>
                <input value={form.institution_name} onChange={F('institution_name')} placeholder="University or School name" />
              </div>
              <div className={styles.field}>
                <label>Graduation Year</label>
                <input type="number" min="1950" max="2100" value={form.graduation_year} onChange={F('graduation_year')} placeholder="YYYY" />
              </div>

              {/* ID Card Uploads */}
              <div className={styles.field}>
                <label>ID Photo (Front) <span>*</span></label>
                <div 
                  className={styles.upload} 
                  onClick={() => idFrontRef.current?.click()}
                  style={idFrontPreview ? { padding: 4 } : {}}
                >
                  <input type="file" ref={idFrontRef} style={{ display: 'none' }} accept="image/*" onChange={(e) => handleIdPhoto('front', e)} />
                  {idFrontPreview ? (
                    <img src={idFrontPreview} alt="ID Front" style={{ width: '100%', height: '100px', objectFit: 'contain', borderRadius: 4 }} />
                  ) : (
                    <>
                      <div className={styles.uploadIcon}>📸</div>
                      <div className={styles.uploadText}>Click to upload front of ID</div>
                      <div className={styles.uploadHint}>JPG, PNG</div>
                    </>
                  )}
                </div>
              </div>

              <div className={styles.field}>
                <label>ID Photo (Back) <span>*</span></label>
                <div 
                  className={styles.upload} 
                  onClick={() => idBackRef.current?.click()}
                  style={idBackPreview ? { padding: 4 } : {}}
                >
                  <input type="file" ref={idBackRef} style={{ display: 'none' }} accept="image/*" onChange={(e) => handleIdPhoto('back', e)} />
                  {idBackPreview ? (
                    <img src={idBackPreview} alt="ID Back" style={{ width: '100%', height: '100px', objectFit: 'contain', borderRadius: 4 }} />
                  ) : (
                    <>
                      <div className={styles.uploadIcon}>📸</div>
                      <div className={styles.uploadText}>Click to upload back of ID</div>
                      <div className={styles.uploadHint}>JPG, PNG</div>
                    </>
                  )}
                </div>
              </div>

              <div className={`${styles.field} ${styles.fullCol}`}>
                <label>Additional Documents <span style={{ color: '#BDBDBD', fontWeight: 400, textTransform: 'none', fontSize: 10, marginLeft: 6 }}>(Contract, Certificates — Optional)</span></label>

                {/* Hidden file input */}
                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  onChange={e => { const f = e.target.files?.[0]; if (f) { setFile(f); setFileDragOver(false); } }}
                />

                {file ? (
                  /* Telegram-style attachment card */
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    background: '#f0f9ff', border: '2px solid #7dd3fc',
                    borderRadius: 12, padding: '12px 16px',
                  }}>
                    <span style={{ fontSize: 34, flexShrink: 0 }}>{getDocIcon(file)}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: '#0c4a6e', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {file.name}
                      </div>
                      <div style={{ fontSize: 12, color: '#0369a1', marginTop: 3 }}>
                        {fmtSize(file.size)} &middot; Ready to upload
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: 22, fontWeight: 700, flexShrink: 0, lineHeight: 1 }}
                      title="Remove file"
                    >&times;</button>
                  </div>
                ) : (
                  /* Drop zone */
                  <div
                    className={styles.upload}
                    style={fileDragOver ? { borderColor: '#2563EB', background: '#EFF6FF' } : {}}
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={e => { e.preventDefault(); setFileDragOver(true); }}
                    onDragLeave={() => setFileDragOver(false)}
                    onDrop={e => { e.preventDefault(); setFileDragOver(false); const f = e.dataTransfer.files?.[0]; if (f) setFile(f); }}
                  >
                    <div className={styles.uploadIcon}>📎</div>
                    <div className={styles.uploadText}>Click to select or drag &amp; drop a file</div>
                    <div className={styles.uploadHint}>PDF, DOCX, JPG, PNG accepted</div>
                  </div>
                )}
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
            onClick={() => {
              if (onRegistered) onRegistered();
              else navigate('/hr/employees?tab=list');
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            className={styles.btnSubmit}
            disabled={saving}
          >
            {saving
              ? 'Submitting…'
              : prefillData?.employee_id
                ? 'Submit for CEO Approval'
                : 'Complete Registration'}
          </button>
        </div>

      </form>
    </div>
  );
};

export default HRAddEmployee;
