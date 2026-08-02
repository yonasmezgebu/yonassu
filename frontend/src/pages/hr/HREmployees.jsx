import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import hrService from '../../services/hrService';
import styles from './HREmployees.module.css';

const EMPTY_FORM = {
  full_name: '', national_id: '', gender: '', personal_phone: '', personal_email: '',
  dept_id: '', position_id: '', hire_date: '', employment_type: 'Permanent',
  employment_status: 'Active', base_salary: '', housing_allowance: '',
  transport_allowance: '', shift_start_time: '09:00', shift_end_time: '18:00',
  has_pc_access: 'No', overtime_rate: '1.5', bank_name: '', bank_account_number: '',
  emergency_contact_name: '', emergency_contact_phone: '', physical_address: ''
};

const BACKEND_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1').replace('/api/v1', '');
const resolvePhoto = (url) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  const cleanUrl = url.startsWith('/') ? url : `/${url}`;
  return `${BACKEND_URL}${cleanUrl}`;
};

const HREmployees = ({ onRegister, onEdit }) => {
  const location = useLocation();
  const [employees, setEmployees]   = useState([]);
  const [departments, setDepts]     = useState([]);
  const [positions, setPositions]   = useState([]);
  const [search, setSearch]         = useState('');
  const [loading, setLoading]       = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [editing, setEditing]       = useState(null);
  const [toast, setToast]           = useState(null);
  const [registeredBanner, setRegisteredBanner] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const name = params.get('registered');
    if (name) {
      setRegisteredBanner(name);
      const t = setTimeout(() => setRegisteredBanner(null), 6000);
      return () => clearTimeout(t);
    }
  }, [location.search]);

  /* ── Fetch ────────────────────────────────────────────────────────── */
  const fetchEmployees = useCallback(async () => {
    try {
      setLoading(true);
      setFetchError(null);
      const res = await hrService.etp.listEmployees({ search, _t: Date.now() });
      const data = Array.isArray(res?.data?.data)
        ? res.data.data
        : Array.isArray(res?.data)
          ? res.data
          : [];
      setEmployees(data);
    } catch (err) {
      setFetchError(err?.response?.data?.message || `Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { fetchEmployees(); }, [fetchEmployees]);

  useEffect(() => {
    hrService.etp.getDepartments().then(r => setDepts(r.data || r || [])).catch(() => {});
    hrService.etp.getPositions().then(r => setPositions(r.data || r || [])).catch(() => {});
  }, []);

  /* ── Helpers ──────────────────────────────────────────────────────── */
  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  /* ── Open edit modal ─────────────────────────────────────────────── */
  const openEdit = (emp) => {
    setEditing({
      emp,
      isNew: emp._source === 'users_table',
      saving: false,
      error: null,
      form: {
        full_name:              emp.full_name || '',
        national_id:            emp.national_id || '',
        gender:                 emp.gender || '',
        personal_phone:         emp.personal_phone || '',
        personal_email:         emp.personal_email || '',
        dept_id:                emp.dept_id || '',
        position_id:            emp.position_id || '',
        hire_date:              emp.hire_date ? emp.hire_date.split('T')[0] : '',
        employment_type:        emp.employment_type || 'Permanent',
        employment_status:      emp.employment_status || 'Active',
        base_salary:            emp.base_salary || '',
        housing_allowance:      emp.housing_allowance || '',
        transport_allowance:    emp.transport_allowance || '',
        shift_start_time:       emp.shift_start_time || '09:00',
        shift_end_time:         emp.shift_end_time || '18:00',
        has_pc_access:          emp.has_pc_access || 'No',
        overtime_rate:          emp.overtime_rate || '1.5',
        bank_name:              emp.bank_name || '',
        bank_account_number:    emp.bank_account_number || '',
        emergency_contact_name: emp.emergency_contact_name || '',
        emergency_contact_phone:emp.emergency_contact_phone || '',
        physical_address:       emp.physical_address || '',
      },
    });
  };

  /* ── Save ─────────────────────────────────────────────────────────── */
  const handleSave = async () => {
    const { emp, form, isNew } = editing;
    setEditing(prev => ({ ...prev, saving: true, error: null }));
    try {
      if (isNew) {
        await hrService.etp.createEmployee(form);
        showToast('Employee registered successfully!');
      } else {
        await hrService.etp.updateEmployee(emp.employee_id, form);
        showToast('Employee profile updated!');
      }
      setEditing(null);
      fetchEmployees();
    } catch (err) {
      setEditing(prev => ({
        ...prev,
        saving: false,
        error: err.response?.data?.message || 'Failed to save. Please try again.',
      }));
    }
  };

  /* ── Filtered list ───────────────────────────────────────────────── */
  const filtered = employees.filter(e =>
    String(e.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
    String(e.employee_id || '').toLowerCase().includes(search.toLowerCase()) ||
    String(e.dept_name || '').toLowerCase().includes(search.toLowerCase())
  );

  /* ── Form field helper ───────────────────────────────────────────── */
  const setField = (key, val) =>
    setEditing(prev => ({ ...prev, form: { ...prev.form, [key]: val } }));

  /* ── Render ──────────────────────────────────────────────────────── */
  return (
    <div className={styles.pageContainer}>

      {/* Toast Notification */}
      {toast && (
        <div className={`${styles.toast} ${toast.type === 'error' ? styles.toastError : styles.toastSuccess}`}>
          {toast.msg}
        </div>
      )}

      {/* ══ HEADER ══ */}
      <div className={styles.header}>
        <div className={styles.topRow}>
          <div>
            <div className={styles.badge}>
              <span className={styles.badgeDot} />
              <span className={styles.badgeTxt}>HR Module</span>
            </div>
            <h1 className={styles.title}>
              Employee <span>Directory</span>
            </h1>
            <p className={styles.subtitle}>
              Full workforce roster — registered & pending employees
            </p>
          </div>

          <div className={styles.metricsWrapper}>
            {/* Metric cards */}
            <div className={styles.metrics}>
              <div className={styles.metric}>
                <div className={styles.metricVal}>{loading ? '—' : employees.length}</div>
                <div className={styles.metricLbl}>Total Staff</div>
              </div>
              <div className={styles.metric}>
                <div className={styles.metricVal} style={{ color: '#c0a020' }}>
                  {loading ? '—' : employees.filter(e => e._source === 'users_table').length}
                </div>
                <div className={styles.metricLbl}>Pending Setup</div>
              </div>
              <div className={styles.metric}>
                <div className={styles.metricVal}>
                  {loading ? '—' : employees.filter(e => (e.employment_status || 'Active').toLowerCase() === 'active').length}
                </div>
                <div className={styles.metricLbl}>Active</div>
              </div>
            </div>

            <button className={styles.btnSolid} onClick={fetchEmployees}>
              ↻ Refresh
            </button>
          </div>
        </div>

        {/* Registration banner */}
        {registeredBanner && (
          <div className={styles.banner}>
            <span style={{ fontSize: 18 }}>✓</span>
            <p><strong>{registeredBanner}</strong> registered successfully and added to the directory.</p>
            <button className={styles.bannerClose} onClick={() => setRegisteredBanner(null)}>×</button>
          </div>
        )}
      </div>

      {/* ══ SEARCH BAR ══ */}
      <div className={styles.searchbar}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" strokeWidth="2.5" strokeLinecap="square">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          type="text"
          placeholder="Search by name, ID, or department..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {search && (
          <button className={styles.searchClear} onClick={() => setSearch('')}>×</button>
        )}
        {!loading && (
          <span className={styles.searchCount}>{filtered.length} Records</span>
        )}
      </div>

      {/* ══ BODY ══ */}
      <div className={styles.bodyArea}>
        {loading ? (
          <div className={styles.loadingState}>● Loading workforce data...</div>
        ) : fetchError ? (
          <div className={styles.errorState}>
            <p style={{ marginBottom: 16 }}>⚠ {fetchError}</p>
            <button className={styles.btnSolid} onClick={fetchEmployees}>Retry</button>
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Employee</th>
                <th>ID / Role</th>
                <th>Department</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <div className={styles.emptyState}>
                      <div className={styles.emptyIcon}>◻</div>
                      No records match your search.
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((emp) => {
                  const isPending    = emp._source === 'users_table';
                  const isActive     = (emp.employment_status || 'Active').toLowerCase() === 'active';
                  const avatarUrl    = resolvePhoto(emp.profile_photo_path) || resolvePhoto(emp.user_photo);
                  const initials     = emp.full_name?.charAt(0).toUpperCase() || '?';

                  return (
                    <tr key={emp.employee_id}>
                      {/* Employee */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                          <div className={styles.avatar}>
                            {avatarUrl
                              ? <img src={avatarUrl} alt={emp.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              : initials}
                          </div>
                          <div>
                            <div className={styles.name}>{emp.full_name}</div>
                            <div className={styles.contact}>{emp.personal_email || emp.personal_phone || '—'}</div>
                          </div>
                        </div>
                      </td>

                      {/* ID / Role */}
                      <td>
                        <div className={styles.idCell}>
                          #{emp.employee_id}
                          {isPending && <span className={styles.pendingBadge}>Pending</span>}
                        </div>
                        <div className={styles.roleCell}>
                          {emp.position_title || emp.position_id || 'Not assigned'}
                        </div>
                      </td>

                      {/* Department */}
                      <td>
                        <span className={styles.deptChip}>
                          {emp.dept_name || emp.dept_id || 'No Dept'}
                        </span>
                      </td>

                      {/* Status */}
                      <td>
                        <span className={isActive ? styles.statusActive : styles.statusInactive}>
                          {emp.employment_status || 'Active'}
                        </span>
                      </td>

                      {/* Action */}
                      <td>
                        <button
                          className={isPending ? styles.rowBtnReg : styles.rowBtnEdit}
                          onClick={() => openEdit(emp)}
                        >
                          {isPending ? 'Complete Setup' : 'Edit'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* ══ MODAL ══ */}
      {editing && (
        <div className={styles.overlay} onClick={() => !editing.saving && setEditing(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>

            <div className={styles.modalHdr}>
              <h2 className={styles.modalTitle}>
                {editing.isNew
                  ? `Register — ${editing.emp.full_name}`
                  : `Edit Profile — ${editing.emp.full_name}`}
              </h2>
              <button className={styles.modalClose} onClick={() => setEditing(null)}>×</button>
            </div>

            <div className={styles.modalBody}>
              {editing.error && (
                <div className={styles.modalErr}>{editing.error}</div>
              )}

              {/* Personal */}
              <div className={styles.modalSection}>
                <h3>Personal Information</h3>
                <div className={styles.modalGrid}>
                  <label>Full Name
                    <input value={editing.form.full_name} onChange={e => setField('full_name', e.target.value)} />
                  </label>
                  <label>National ID
                    <input value={editing.form.national_id} onChange={e => setField('national_id', e.target.value)} />
                  </label>
                  <label>Gender
                    <select value={editing.form.gender} onChange={e => setField('gender', e.target.value)}>
                      <option value="">— Select —</option>
                      <option>Male</option><option>Female</option>
                    </select>
                  </label>
                  <label>Phone
                    <input value={editing.form.personal_phone} onChange={e => setField('personal_phone', e.target.value)} />
                  </label>
                  <label>Email
                    <input value={editing.form.personal_email} onChange={e => setField('personal_email', e.target.value)} />
                  </label>
                  <label className={styles.fullCol}>Physical Address
                    <input value={editing.form.physical_address} onChange={e => setField('physical_address', e.target.value)} />
                  </label>
                </div>
              </div>

              {/* Employment */}
              <div className={styles.modalSection}>
                <h3>Employment Information</h3>
                <div className={styles.modalGrid}>
                  <label>Department
                    <select value={editing.form.dept_id} onChange={e => setField('dept_id', e.target.value)}>
                      <option value="">— Select —</option>
                      {departments.map(d => (
                        <option key={d.dept_id} value={d.dept_id}>{d.dept_name}</option>
                      ))}
                    </select>
                  </label>
                  <label>Position
                    <select value={editing.form.position_id} onChange={e => setField('position_id', e.target.value)}>
                      <option value="">— Select —</option>
                      {positions.map(p => (
                        <option key={p.position_id} value={p.position_id}>{p.position_title}</option>
                      ))}
                    </select>
                  </label>
                  <label>Hire Date
                    <input type="date" value={editing.form.hire_date} onChange={e => setField('hire_date', e.target.value)} />
                  </label>
                  <label>Employment Type
                    <select value={editing.form.employment_type} onChange={e => setField('employment_type', e.target.value)}>
                      <option>Permanent</option><option>Contract</option><option>Part-Time</option>
                    </select>
                  </label>
                  <label>Status
                    <select value={editing.form.employment_status} onChange={e => setField('employment_status', e.target.value)}>
                      <option>Active</option><option>Inactive</option><option>On Leave</option>
                    </select>
                  </label>
                  <label>PC Access
                    <select value={editing.form.has_pc_access} onChange={e => setField('has_pc_access', e.target.value)}>
                      <option>No</option><option>Yes</option>
                    </select>
                  </label>
                  <label>Shift Start
                    <input type="time" value={editing.form.shift_start_time} onChange={e => setField('shift_start_time', e.target.value)} />
                  </label>
                  <label>Shift End
                    <input type="time" value={editing.form.shift_end_time} onChange={e => setField('shift_end_time', e.target.value)} />
                  </label>
                </div>
              </div>

              {/* Compensation */}
              <div className={styles.modalSection}>
                <h3>Compensation</h3>
                <div className={styles.modalGrid}>
                  <label>Base Salary (ETB)
                    <input type="number" value={editing.form.base_salary} onChange={e => setField('base_salary', e.target.value)} />
                  </label>
                  <label>Housing Allowance
                    <input type="number" value={editing.form.housing_allowance} onChange={e => setField('housing_allowance', e.target.value)} />
                  </label>
                  <label>Transport Allowance
                    <input type="number" value={editing.form.transport_allowance} onChange={e => setField('transport_allowance', e.target.value)} />
                  </label>
                  <label>Overtime Rate (×)
                    <input type="number" step="0.1" value={editing.form.overtime_rate} onChange={e => setField('overtime_rate', e.target.value)} />
                  </label>
                </div>
              </div>

              {/* Bank */}
              <div className={styles.modalSection}>
                <h3>Bank Details</h3>
                <div className={styles.modalGrid}>
                  <label>Bank Name
                    <input value={editing.form.bank_name} onChange={e => setField('bank_name', e.target.value)} />
                  </label>
                  <label>Account Number
                    <input value={editing.form.bank_account_number} onChange={e => setField('bank_account_number', e.target.value)} />
                  </label>
                </div>
              </div>

              {/* Emergency Contact */}
              <div className={styles.modalSection}>
                <h3>Emergency Contact</h3>
                <div className={styles.modalGrid}>
                  <label>Contact Name
                    <input value={editing.form.emergency_contact_name} onChange={e => setField('emergency_contact_name', e.target.value)} />
                  </label>
                  <label>Contact Phone
                    <input value={editing.form.emergency_contact_phone} onChange={e => setField('emergency_contact_phone', e.target.value)} />
                  </label>
                </div>
              </div>
            </div>

            <div className={styles.modalFtr}>
              <button className={styles.btnCancel} onClick={() => setEditing(null)} disabled={editing.saving}>
                Cancel
              </button>
              <button className={styles.btnSave} onClick={handleSave} disabled={editing.saving}>
                {editing.saving ? 'Saving...' : editing.isNew ? 'Register Employee' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HREmployees;
