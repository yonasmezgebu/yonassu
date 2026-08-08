import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import hrService from '../../services/hrService';
import { playSuccessSound } from '../../utils/playNotificationSound';
import styles from './HRAddEmployee.module.css';

const getDocIcon = (f) => {
  if (!f) return '📎';
  const name = typeof f === 'string' ? f : (f.name || '');
  const ext = name.split('.').pop().toLowerCase();
  if (['jpg','jpeg','png','gif','webp'].includes(ext)) return '🖼️';
  if (ext === 'pdf') return '📄';
  if (['doc','docx'].includes(ext)) return '📝';
  return '📎';
};
const fmtSize = (b) => !b ? '' : b < 1048576 ? `${(b/1024).toFixed(1)} KB` : `${(b/1048576).toFixed(1)} MB`;

const HREditEmployee = ({ prefillData, onCancel }) => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    full_name: '', national_id: '', date_of_birth: '', gender: 'Male', marital_status: 'Single',
    personal_phone: '', personal_email: '', physical_address: '',
    dept_id: '', position_id: '',
    hire_date: '', employment_type: 'Permanent', base_salary: '',
    housing_allowance: '', transport_allowance: '',
    bank_name: '', bank_account_number: '',
    has_pc_access: 'No', shift_start_time: '08:00', shift_end_time: '17:00',
    emergency_contact_name: '', emergency_contact_phone: '',
  });
  
  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);
  const idFrontRef = useRef(null);
  const idBackRef = useRef(null);

  const [file, setFile] = useState(null);
  const [fileDragOver, setFileDragOver] = useState(false);
  const [idPhotoFront, setIdPhotoFront] = useState(null);
  const [idPhotoBack, setIdPhotoBack] = useState(null);
  const [idFrontPreview, setIdFrontPreview] = useState(null);
  const [idBackPreview, setIdBackPreview] = useState(null);

  const [submitStatus, setSubmitStatus] = useState({ type: null, message: '' });

  // Build correct URL from stored path like "uploads\\hr\\id-photos\\file.jpg"
  const BACKEND_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1').replace('/api/v1', '');
  const toUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    const cleanPath = path.replace(/\\/g, '/').replace(/^\/?api\/v1\//, '').replace(/^\//, '');
    return `${BACKEND_URL}/${cleanPath}`;
  };

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

  useEffect(() => {
    if (prefillData) {
      setForm({
        full_name: prefillData.full_name || '',
        national_id: prefillData.national_id || '',
        date_of_birth: prefillData.date_of_birth ? prefillData.date_of_birth.split('T')[0] : '',
        gender: prefillData.gender || 'Male',
        marital_status: prefillData.marital_status || 'Single',
        personal_phone: prefillData.personal_phone || '',
        personal_email: prefillData.personal_email || '',
        physical_address: prefillData.physical_address || '',
        dept_id: prefillData.dept_id || '',
        position_id: prefillData.position_id || '',
        hire_date: prefillData.hire_date ? prefillData.hire_date.split('T')[0] : '',
        employment_type: prefillData.employment_type || 'Permanent',
        base_salary: prefillData.base_salary || '',
        housing_allowance: prefillData.housing_allowance || '',
        transport_allowance: prefillData.transport_allowance || '',
        bank_name: prefillData.bank_name || '',
        bank_account_number: prefillData.bank_account_number || '',
        has_pc_access: prefillData.has_pc_access || 'No',
        shift_start_time: prefillData.shift_start_time || '08:00',
        shift_end_time: prefillData.shift_end_time || '17:00',
        emergency_contact_name: prefillData.emergency_contact_name || '',
        emergency_contact_phone: prefillData.emergency_contact_phone || '',
      });
      
      setIdFrontPreview(prefillData.id_photo_front ? toUrl(prefillData.id_photo_front) : null);
      setIdBackPreview(prefillData.id_photo_back   ? toUrl(prefillData.id_photo_back)  : null);
    }
  }, [prefillData]);

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
    e.preventDefault();
    setSaving(true);
    setSubmitStatus({ type: null, message: '' });
    try {
      const submitData = {
        ...form,
        // Don't hardcode path — pass real File; backend multer saves it and derives the path
        document_file: file || undefined,
        document_path: file ? undefined : (prefillData?.document_path || null),
        // Ensure empty strings become null for date/numeric fields
        date_of_birth: form.date_of_birth || null,
        base_salary: form.base_salary || null,
        housing_allowance: form.housing_allowance || null,
        transport_allowance: form.transport_allowance || null,
        bank_account_number: form.bank_account_number.trim() || null,
        bank_name: form.bank_name || null,
        national_id: form.national_id || null,
        id_photo_front: idPhotoFront || undefined,
        id_photo_back:  idPhotoBack  || undefined,
      };

      await hrService.etp.updateEmployee(prefillData.employee_id, submitData);
      playSuccessSound();
      setSubmitStatus({ type: 'success', message: `✅ Profile updated successfully! Redirecting…` });
      setTimeout(() => onCancel(), 1500);
    } catch (err) {
      setSubmitStatus({ type: 'error', message: err?.response?.data?.message || err?.message || 'Failed to update employee. Please check the details.' });
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const F = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.pageTitle}>Edit Employee Profile</h1>
        <p className={styles.pageSubtitle}>Update the details for {prefillData?.full_name}</p>
      </div>

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

        {/* SECTION: EDUCATION & DOCUMENTS */}
        <div className={styles.sectionCard}>
          <h2 className={styles.sectionTitle}>Education Information &amp; Documents</h2>
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label>Education Level</label>
              <select value={form.education_level || ''} onChange={F('education_level')}>
                <option value="">Select Level</option>
                <option value="High School">High School</option>
                <option value="Certificate">Certificate</option>
                <option value="Diploma">Diploma</option>
                <option value="Bachelor's Degree">Bachelor's Degree</option>
                <option value="Master's Degree">Master's Degree</option>
                <option value="PhD">PhD</option>
              </select>
            </div>
            <div className={styles.formGroup}>
              <label>Field of Study</label>
              <input value={form.field_of_study || ''} onChange={F('field_of_study')} placeholder="e.g. Accounting, Nursing, IT" />
            </div>
            <div className={styles.formGroup}>
              <label>Institution Name</label>
              <input value={form.institution_name || ''} onChange={F('institution_name')} placeholder="University or School" />
            </div>
            <div className={styles.formGroup}>
              <label>Graduation Year</label>
              <input type="number" min="1950" max="2100" value={form.graduation_year || ''} onChange={F('graduation_year')} placeholder="YYYY" />
            </div>

            {/* ID Card Uploads */}
            <div className={styles.formGroup}>
              <label>ID Photo (Front)</label>
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
                  </>
                )}
              </div>
            </div>

            <div className={styles.formGroup}>
              <label>ID Photo (Back)</label>
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
                  </>
                )}
              </div>
            </div>

            <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
              <label>Upload Employee Documents <span style={{ color: '#6b7280', fontSize: '0.85em', fontWeight: 'normal' }}>(Optional)</span></label>

              {/* Hidden file input */}
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                onChange={e => { const f = e.target.files?.[0]; if (f) { setFile(f); setFileDragOver(false); } }}
              />

              {/* Existing document — shown as a new-tab link */}
              {!file && prefillData?.document_path && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  background: '#f8fafc', border: '1px solid #e2e8f0',
                  borderRadius: 8, padding: '8px 12px', marginBottom: 8,
                }}>
                  <span style={{ fontSize: 20 }}>{getDocIcon(prefillData.document_path)}</span>
                  <span style={{ flex: 1, fontSize: 13, color: '#334155', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {prefillData.document_path.split(/[\/\\]/).pop()}
                  </span>
                  <a
                    href={toUrl(prefillData.document_path)}
                    target="_blank"
                    rel="noreferrer"
                    style={{ fontSize: 12, color: '#2563eb', fontWeight: 600, textDecoration: 'none', flexShrink: 0 }}
                  >Open ↗</a>
                  <span style={{ fontSize: 11, color: '#94a3b8', flexShrink: 0 }}>Current</span>
                </div>
              )}

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
                      {fmtSize(file.size)} &middot; Will replace current document
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: 22, fontWeight: 700, flexShrink: 0, lineHeight: 1 }}
                    title="Remove"
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
                  <div className={styles.uploadText}>
                    {prefillData?.document_path ? 'Click to replace document…' : 'Click to select or drag & drop'}
                  </div>
                  <div className={styles.uploadHint}>PDF, DOCX, JPG, PNG accepted</div>
                </div>
              )}
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
          <button type="button" className={styles.cancelBtn} onClick={onCancel}>Cancel</button>
          <button type="submit" className={styles.submitBtn} disabled={saving}>
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default HREditEmployee;
