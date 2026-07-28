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

/* ── Inline global styles for sharp green theme ── */
const PageStyles = () => (
  <style>{`
    .hr-emp-page * { box-sizing: border-box; }
    .hr-emp-page { background: #F5F5F5; min-height: 100vh; margin: -24px; padding: 0; font-family: 'Inter','Segoe UI',sans-serif; }

    /* ── HEADER ── */
    .hr-emp-header { background: #1B5E20; border-bottom: 3px solid #228B22; padding: 24px 36px 0; }
    .hr-emp-badge { display:inline-flex; align-items:center; gap:6px; border:1px solid #4CAF50; padding:3px 12px; margin-bottom:10px; }
    .hr-emp-badge-dot { width:6px; height:6px; background:#8BC34A; }
    .hr-emp-badge-txt { color:#A5D6A7; font-size:11px; font-weight:800; letter-spacing:.15em; text-transform:uppercase; }
    .hr-emp-title { font-size:36px; font-weight:900; color:#FFFFFF; letter-spacing:-.02em; line-height:1.05; margin:0 0 6px; }
    .hr-emp-title span { color:#8BC34A; }
    .hr-emp-subtitle { color:#A5D6A7; font-size:13px; margin:0 0 20px; }
    .hr-emp-toprow { display:flex; align-items:center; justify-content:space-between; gap:16px; flex-wrap:wrap; }

    /* Metric cards */
    .hr-emp-metrics { display:flex; gap:0; border:1px solid #2E8B57; border-right:none; }
    .hr-emp-metric { padding:14px 22px; border-right:1px solid #2E8B57; min-width:110px; background: rgba(0,0,0,0.15); }
    .hr-emp-metric-val { font-size:26px; font-weight:900; color:#8BC34A; line-height:1; }
    .hr-emp-metric-lbl { font-size:10px; color:#A5D6A7; font-weight:700; text-transform:uppercase; letter-spacing:.1em; margin-top:3px; }

    /* Buttons */
    .hr-emp-btn-outline { background:transparent; border:1px solid #4CAF50; color:#8BC34A; padding:9px 18px; cursor:pointer; font-weight:700; font-size:12px; letter-spacing:.06em; text-transform:uppercase; transition:all .15s; }
    .hr-emp-btn-outline:hover { background:#2E8B57; color:#fff; border-color:#2E8B57; }
    .hr-emp-btn-solid { background:#228B22; border:1px solid #4CAF50; color:#FFFFFF; padding:9px 18px; cursor:pointer; font-weight:700; font-size:12px; letter-spacing:.06em; text-transform:uppercase; transition:all .15s; }
    .hr-emp-btn-solid:hover { background:#2E8B57; border-color:#8BC34A; }

    /* Search bar */
    .hr-emp-searchbar { background:#FFFFFF; border-bottom:2px solid #A5D6A7; padding:0 36px; display:flex; align-items:center; gap:12px; box-shadow:0 1px 4px rgba(34,139,34,0.06); }
    .hr-emp-searchbar input { flex:1; background:transparent; border:none; outline:none; color:#424242; font-size:14px; padding:14px 0; font-family:'Inter',sans-serif; }
    .hr-emp-searchbar input::placeholder { color:#A5D6A7; }
    .hr-emp-count { color:#228B22; font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:.08em; white-space:nowrap; }
    .hr-emp-clear { background:transparent; border:1px solid #A5D6A7; color:#6B8E23; width:26px; height:26px; cursor:pointer; font-size:14px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
    .hr-emp-clear:hover { background:#F5F5F5; border-color:#228B22; }

    /* Table */
    .hr-emp-body { padding:0; background:#FFFFFF; border:1px solid #A5D6A7; margin:16px; }
    .hr-emp-table { width:100%; border-collapse:collapse; }
    .hr-emp-table thead tr { background:#F5F5F5; border-bottom:2px solid #228B22; }
    .hr-emp-table thead th { padding:14px 20px; color:#2d6a2d; font-size:11px; font-weight:800; text-transform:uppercase; letter-spacing:.1em; text-align:left; }
    .hr-emp-table thead th:last-child { text-align:right; padding-right:36px; }
    .hr-emp-table thead th:first-child { padding-left:36px; }
    .hr-emp-table tbody tr { border-bottom:1px solid #E8F5E9; transition:background .12s; }
    .hr-emp-table tbody tr:hover { background:#F1F8E9; }
    .hr-emp-table td { padding:14px 20px; color:#424242; font-size:13px; vertical-align:middle; }
    .hr-emp-table td:first-child { padding-left:36px; }
    .hr-emp-table td:last-child { text-align:right; padding-right:36px; }

    /* Avatar */
    .hr-emp-avatar { width:38px; height:38px; background:#E8F5E9; border:1px solid #A5D6A7; display:flex; align-items:center; justify-content:center; font-size:15px; font-weight:900; color:#228B22; overflow:hidden; flex-shrink:0; }
    .hr-emp-name { font-weight:700; color:#1B5E20; font-size:14px; }
    .hr-emp-contact { color:#6B8E23; font-size:12px; margin-top:2px; }

    /* Status badges */
    .hr-emp-status-active { background:transparent; border:1px solid #4CAF50; color:#228B22; padding:3px 10px; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.08em; display:inline-block; }
    .hr-emp-status-inactive { background:transparent; border:1px solid #F44336; color:#F44336; padding:3px 10px; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.08em; display:inline-block; }
    .hr-emp-pending { background:transparent; border:1px solid #FF9800; color:#FF9800; padding:2px 8px; font-size:10px; font-weight:800; text-transform:uppercase; letter-spacing:.06em; margin-left:6px; display:inline-block; }

    /* Dept chip */
    .hr-emp-dept { border:1px solid #A5D6A7; color:#6B8E23; padding:4px 10px; font-size:12px; font-weight:600; display:inline-block; background:#F5F5F5; }

    /* Row action buttons */
    .hr-emp-row-btn-edit { background:transparent; border:1px solid #2E8B57; color:#228B22; padding:6px 14px; cursor:pointer; font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:.05em; transition:all .12s; }
    .hr-emp-row-btn-edit:hover { background:#2E8B57; color:#fff; }
    .hr-emp-row-btn-reg { background:transparent; border:1px solid #FF9800; color:#FF9800; padding:6px 14px; cursor:pointer; font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:.05em; transition:all .12s; }
    .hr-emp-row-btn-reg:hover { background:#FF9800; color:#fff; }

    /* Empty state */
    .hr-emp-empty { text-align:center; padding:60px 20px; color:#A5D6A7; }
    .hr-emp-empty-icon { font-size:36px; margin-bottom:12px; }

    /* Toast */
    .hr-emp-toast { position:fixed; top:20px; right:20px; z-index:9999; border:1px solid; padding:12px 20px; font-weight:700; font-size:13px; }
    .hr-emp-toast-success { background:#E8F5E9; border-color:#4CAF50; color:#1B5E20; }
    .hr-emp-toast-error { background:#FFEBEE; border-color:#F44336; color:#F44336; }

    /* Banner */
    .hr-emp-banner { display:flex; align-items:center; gap:12px; background:#E8F5E9; border:1px solid #4CAF50; padding:12px 24px; margin:0 0 2px; }
    .hr-emp-banner p { margin:0; color:#228B22; font-size:13px; font-weight:600; }
    .hr-emp-banner strong { color:#1B5E20; }
    .hr-emp-banner-close { background:transparent; border:none; color:#228B22; cursor:pointer; font-size:18px; margin-left:auto; }

    /* Error / loading state */
    .hr-emp-error { padding:40px; text-align:center; color:#F44336; }
    .hr-emp-loading { padding:40px; text-align:center; color:#228B22; letter-spacing:.1em; text-transform:uppercase; font-size:12px; font-weight:700; }

    /* ── MODAL ── */
    .hr-emp-overlay { position:fixed; inset:0; background:rgba(27,94,32,0.7); z-index:1000; display:flex; align-items:center; justify-content:center; padding:20px; }
    .hr-emp-modal { background:#FFFFFF; border:2px solid #228B22; width:100%; max-width:740px; max-height:90vh; display:flex; flex-direction:column; }
    .hr-emp-modal-hdr { display:flex; align-items:center; justify-content:space-between; padding:20px 28px; border-bottom:2px solid #228B22; background:#1B5E20; flex-shrink:0; }
    .hr-emp-modal-title { color:#FFFFFF; font-size:16px; font-weight:800; margin:0; letter-spacing:-.01em; }
    .hr-emp-modal-close { background:transparent; border:1px solid #4CAF50; color:#8BC34A; width:30px; height:30px; cursor:pointer; font-size:18px; display:flex; align-items:center; justify-content:center; }
    .hr-emp-modal-close:hover { background:#228B22; }
    .hr-emp-modal-body { overflow-y:auto; padding:24px 28px; flex:1; background:#FFFFFF; }
    .hr-emp-modal-section { margin-bottom:24px; }
    .hr-emp-modal-section h3 { color:#228B22; font-size:11px; font-weight:800; text-transform:uppercase; letter-spacing:.12em; margin:0 0 14px; border-bottom:2px solid #A5D6A7; padding-bottom:8px; }
    .hr-emp-modal-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
    .hr-emp-modal-grid label { display:flex; flex-direction:column; gap:5px; color:#6B8E23; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.08em; }
    .hr-emp-modal-grid input, .hr-emp-modal-grid select { background:#F5F5F5; border:1px solid #A5D6A7; color:#424242; padding:9px 12px; font-size:13px; outline:none; font-family:'Inter',sans-serif; transition:border .12s; }
    .hr-emp-modal-grid input:focus, .hr-emp-modal-grid select:focus { border-color:#228B22; background:#FFFFFF; }
    .hr-emp-modal-grid .full-col { grid-column: 1 / -1; }
    .hr-emp-modal-err { background:#FFEBEE; border:1px solid #F44336; color:#F44336; padding:10px 14px; font-size:13px; margin-bottom:16px; }
    .hr-emp-modal-ftr { display:flex; justify-content:flex-end; align-items:center; gap:10px; padding:16px 28px; border-top:2px solid #A5D6A7; background:#F5F5F5; flex-shrink:0; }
    .hr-emp-cancel { background:transparent; border:1px solid #A5D6A7; color:#6B8E23; padding:9px 20px; cursor:pointer; font-weight:700; font-size:12px; text-transform:uppercase; letter-spacing:.06em; }
    .hr-emp-cancel:hover { border-color:#228B22; color:#228B22; }
    .hr-emp-save { background:#228B22; border:1px solid #228B22; color:#FFFFFF; padding:9px 24px; cursor:pointer; font-weight:800; font-size:12px; text-transform:uppercase; letter-spacing:.06em; transition:all .15s; }
    .hr-emp-save:hover { background:#1B5E20; border-color:#1B5E20; }
    .hr-emp-save:disabled { opacity:.5; cursor:not-allowed; }
  `}</style>
);

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
      console.log('[HREmployees] raw response:', res?.data);
      const data = Array.isArray(res?.data?.data)
        ? res.data.data
        : Array.isArray(res?.data)
          ? res.data
          : [];
      console.log('[HREmployees] employees loaded:', data.length);
      setEmployees(data);
    } catch (err) {
      console.error('[HREmployees] Failed to fetch:', err);
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
    <div className="hr-emp-page">
      <PageStyles />

      {/* Toast */}
      {toast && (
        <div className={`hr-emp-toast hr-emp-toast-${toast.type}`}>
          {toast.msg}
        </div>
      )}

      {/* ══ HEADER ══ */}
      <div className="hr-emp-header">
        <div className="hr-emp-toprow">
          <div>
            <div className="hr-emp-badge">
              <span className="hr-emp-badge-dot" />
              <span className="hr-emp-badge-txt">HR Module</span>
            </div>
            <h1 className="hr-emp-title">
              Employee <span>Directory</span>
            </h1>
            <p className="hr-emp-subtitle">
              Full workforce roster — registered & pending employees
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Metric cards */}
            <div className="hr-emp-metrics">
              <div className="hr-emp-metric">
                <div className="hr-emp-metric-val">{loading ? '—' : employees.length}</div>
                <div className="hr-emp-metric-lbl">Total Staff</div>
              </div>
              <div className="hr-emp-metric">
                <div className="hr-emp-metric-val" style={{ color: '#c0a020' }}>
                  {loading ? '—' : employees.filter(e => e._source === 'users_table').length}
                </div>
                <div className="hr-emp-metric-lbl">Pending Setup</div>
              </div>
              <div className="hr-emp-metric">
                <div className="hr-emp-metric-val">
                  {loading ? '—' : employees.filter(e => (e.employment_status || 'Active').toLowerCase() === 'active').length}
                </div>
                <div className="hr-emp-metric-lbl">Active</div>
              </div>
            </div>

            <button className="hr-emp-btn-solid" onClick={fetchEmployees}>
              ↻ Refresh
            </button>
          </div>
        </div>

        {/* Registration banner */}
        {registeredBanner && (
          <div className="hr-emp-banner" style={{ marginTop: 16 }}>
            <span style={{ color: '#3d9e3d', fontSize: 16 }}>✓</span>
            <p><strong>{registeredBanner}</strong> registered successfully and added to the directory.</p>
            <button className="hr-emp-banner-close" onClick={() => setRegisteredBanner(null)}>×</button>
          </div>
        )}
      </div>

      {/* ══ SEARCH BAR ══ */}
      <div className="hr-emp-searchbar">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2d6a2d" strokeWidth="2.5" strokeLinecap="square">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          type="text"
          placeholder="Search by name, ID, or department..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {search && (
          <button className="hr-emp-clear" onClick={() => setSearch('')}>×</button>
        )}
        {!loading && (
          <span className="hr-emp-count">{filtered.length} Records</span>
        )}
      </div>

      {/* ══ BODY ══ */}
      <div className="hr-emp-body">
        {loading ? (
          <div className="hr-emp-loading">● Loading workforce data...</div>
        ) : fetchError ? (
          <div className="hr-emp-error">
            <p style={{ marginBottom: 12 }}>⚠ {fetchError}</p>
            <button className="hr-emp-btn-outline" onClick={fetchEmployees}>Retry</button>
          </div>
        ) : (
          <table className="hr-emp-table">
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
                    <div className="hr-emp-empty">
                      <div className="hr-emp-empty-icon">◻</div>
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
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div className="hr-emp-avatar">
                            {avatarUrl
                              ? <img src={avatarUrl} alt={emp.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              : initials}
                          </div>
                          <div>
                            <div className="hr-emp-name">{emp.full_name}</div>
                            <div className="hr-emp-contact">{emp.personal_email || emp.personal_phone || '—'}</div>
                          </div>
                        </div>
                      </td>

                      {/* ID / Role */}
                      <td>
                        <div style={{ color: '#3d9e3d', fontFamily: 'monospace', fontWeight: 700, fontSize: 13 }}>
                          #{emp.employee_id}
                          {isPending && <span className="hr-emp-pending">Pending</span>}
                        </div>
                        <div style={{ color: '#4a7a4a', fontSize: 12, marginTop: 2 }}>
                          {emp.position_title || emp.position_id || 'Not assigned'}
                        </div>
                      </td>

                      {/* Department */}
                      <td>
                        <span className="hr-emp-dept">
                          {emp.dept_name || emp.dept_id || 'No Dept'}
                        </span>
                      </td>

                      {/* Status */}
                      <td>
                        <span className={isActive ? 'hr-emp-status-active' : 'hr-emp-status-inactive'}>
                          {emp.employment_status || 'Active'}
                        </span>
                      </td>

                      {/* Action */}
                      <td>
                        <button
                          className={isPending ? 'hr-emp-row-btn-reg' : 'hr-emp-row-btn-edit'}
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
        <div className="hr-emp-overlay" onClick={() => !editing.saving && setEditing(null)}>
          <div className="hr-emp-modal" onClick={e => e.stopPropagation()}>

            <div className="hr-emp-modal-hdr">
              <h2 className="hr-emp-modal-title">
                {editing.isNew
                  ? `Register — ${editing.emp.full_name}`
                  : `Edit Profile — ${editing.emp.full_name}`}
              </h2>
              <button className="hr-emp-modal-close" onClick={() => setEditing(null)}>×</button>
            </div>

            <div className="hr-emp-modal-body">
              {editing.error && (
                <div className="hr-emp-modal-err">{editing.error}</div>
              )}

              {/* Personal */}
              <div className="hr-emp-modal-section">
                <h3>Personal Information</h3>
                <div className="hr-emp-modal-grid">
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
                  <label className="full-col">Physical Address
                    <input value={editing.form.physical_address} onChange={e => setField('physical_address', e.target.value)} />
                  </label>
                </div>
              </div>

              {/* Employment */}
              <div className="hr-emp-modal-section">
                <h3>Employment Information</h3>
                <div className="hr-emp-modal-grid">
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
              <div className="hr-emp-modal-section">
                <h3>Compensation</h3>
                <div className="hr-emp-modal-grid">
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
              <div className="hr-emp-modal-section">
                <h3>Bank Details</h3>
                <div className="hr-emp-modal-grid">
                  <label>Bank Name
                    <input value={editing.form.bank_name} onChange={e => setField('bank_name', e.target.value)} />
                  </label>
                  <label>Account Number
                    <input value={editing.form.bank_account_number} onChange={e => setField('bank_account_number', e.target.value)} />
                  </label>
                </div>
              </div>

              {/* Emergency Contact */}
              <div className="hr-emp-modal-section">
                <h3>Emergency Contact</h3>
                <div className="hr-emp-modal-grid">
                  <label>Contact Name
                    <input value={editing.form.emergency_contact_name} onChange={e => setField('emergency_contact_name', e.target.value)} />
                  </label>
                  <label>Contact Phone
                    <input value={editing.form.emergency_contact_phone} onChange={e => setField('emergency_contact_phone', e.target.value)} />
                  </label>
                </div>
              </div>
            </div>

            <div className="hr-emp-modal-ftr">
              <button className="hr-emp-cancel" onClick={() => setEditing(null)} disabled={editing.saving}>
                Cancel
              </button>
              <button className="hr-emp-save" onClick={handleSave} disabled={editing.saving}>
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
