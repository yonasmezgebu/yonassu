import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import hrService from '../../services/hrService';
import { formatCurrency } from '../../utils/formatters';
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
      // Debug: log what we actually get back
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
        // Create a new hr_employees record for this system user
        await hrService.etp.createEmployee(form);
        showToast('Employee registered successfully!');
      } else {
        // Update existing hr_employees record
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
    <div className={styles.container} style={{ margin: 0, padding: 0 }}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 20, right: 20, zIndex: 9999,
          background: toast.type === 'success' ? '#10b981' : '#ef4444',
          color: '#fff', padding: '12px 20px', borderRadius: 8,
          fontWeight: 600, boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
        }}>
          {toast.msg}
        </div>
      )}

      {/* ══ WORLD-CLASS HERO HEADER ══ */}
      <div style={{
        position: 'relative',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 40%, #312e81 70%, #1e3a8a 100%)',
        borderRadius: 0,
        padding: '36px 24px 52px',
        overflow: 'hidden',
        marginBottom: '-24px',
      }}>
        {/* Animated glowing orbs */}
        <div style={{ position: 'absolute', top: -60, right: -60, width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.4) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -40, left: 80, width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.35) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: 20, left: '45%', width: 120, height: 120, borderRadius: '50%', background: 'radial-gradient(circle, rgba(167,139,250,0.25) 0%, transparent 70%)', pointerEvents: 'none' }} />

        {/* Subtle grid lines */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '40px 40px', pointerEvents: 'none' }} />

        {/* Content row */}
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            {/* Small eyebrow label */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.4)', borderRadius: 20, padding: '4px 14px', marginBottom: 14 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#818cf8', display: 'inline-block', boxShadow: '0 0 8px #818cf8' }} />
              <span style={{ color: '#a5b4fc', fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>HR Management</span>
            </div>

            <h1 style={{ margin: '0 0 8px', fontSize: 38, fontWeight: 900, color: '#ffffff', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
              Employee
              <span style={{ background: 'linear-gradient(90deg, #818cf8, #38bdf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginLeft: 12 }}>Directory</span>
            </h1>
            <p style={{ margin: 0, color: '#94a3b8', fontSize: 15, fontWeight: 400 }}>
              Manage, search and update your entire workforce in one place.
            </p>
          </div>

          {/* Right side: count badge + refresh */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 12, flexShrink: 0 }}>
            <div style={{ background: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 16, padding: '16px 24px', textAlign: 'center' }}>
              <div style={{ fontSize: 32, fontWeight: 900, color: '#ffffff', lineHeight: 1 }}>
                {loading ? '—' : employees.length}
              </div>
              <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 4 }}>Total Employees</div>
            </div>
            <button
              onClick={fetchEmployees}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255,255,255,0.2)', color: '#ffffff',
                padding: '10px 20px', borderRadius: 12, cursor: 'pointer',
                fontWeight: 600, fontSize: 14, transition: 'all 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.18)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
            >
              <span style={{ fontSize: 16 }}>↻</span> Refresh
            </button>
          </div>
        </div>

        {/* ── FLOATING SEARCH BAR (overlaps into content below) ── */}
        <div style={{ position: 'relative', zIndex: 2, marginTop: 32 }}>
          <div style={{
            background: 'rgba(255,255,255,0.08)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,255,255,0.18)',
            borderRadius: 16,
            display: 'flex',
            alignItems: 'center',
            padding: '0 20px',
            gap: 12,
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="text"
              placeholder="Search by name, ID or department..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                flex: 1, background: 'transparent', border: 'none', outline: 'none',
                color: '#ffffff', fontSize: 15, padding: '18px 0',
                fontFamily: "'Inter', sans-serif",
              }}
            />
            {search && (
              <button onClick={() => setSearch('')} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8, color: '#e2e8f0', width: 28, height: 28, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>×</button>
            )}
            {!loading && (
              <div style={{ background: 'rgba(99,102,241,0.35)', border: '1px solid rgba(99,102,241,0.5)', borderRadius: 8, padding: '4px 10px', color: '#a5b4fc', fontSize: 12, fontWeight: 700, flexShrink: 0, whiteSpace: 'nowrap' }}>
                {filtered.length} results
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Spacer to compensate for overlapping search bar */}
      <div style={{ height: 28 }} />

      {/* ── Registration Success Banner ── */}
      {registeredBanner && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
          border: '1px solid #6ee7b7', borderRadius: 12,
          padding: '14px 20px', marginBottom: 16,
          boxShadow: '0 4px 12px rgba(16,185,129,0.15)',
        }}>
          <span style={{ fontSize: 22 }}>🎉</span>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontWeight: 700, color: '#065f46', fontSize: '0.95rem' }}>
              Employee Registered Successfully!
            </p>
            <p style={{ margin: '2px 0 0', color: '#059669', fontSize: '0.85rem' }}>
              <strong>{registeredBanner}</strong> is now a recognized employee and appears in the list below.
            </p>
          </div>
          <button onClick={() => setRegisteredBanner(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#059669', fontWeight: 700, fontSize: 18, lineHeight: 1 }}>×</button>
        </div>
      )}

      {loading ? (
        <div className={styles.loading}>Loading employees…</div>
      ) : fetchError ? (
        <div style={{ padding: 32, textAlign: 'center' }}>
          <p style={{ color: '#ef4444', marginBottom: 16 }}>⚠ {fetchError}</p>
          <button onClick={fetchEmployees}
            style={{ padding: '8px 20px', background: '#3b82f6', color: '#fff',
              border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>
            Try Again
          </button>
        </div>
      ) : (
        <div style={{ 
          background: '#ffffff', 
          borderRadius: '24px', 
          boxShadow: '0 12px 40px rgba(0,0,0,0.03)', 
          overflow: 'hidden', 
          border: '1px solid rgba(226, 232, 240, 0.8)',
          fontFamily: "'Inter', sans-serif"
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '24px 32px', fontWeight: 700, color: '#64748b', fontSize: '12px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Employee Profile</th>
                <th style={{ padding: '24px 20px', fontWeight: 700, color: '#64748b', fontSize: '12px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>ID & Position</th>
                <th style={{ padding: '24px 20px', fontWeight: 700, color: '#64748b', fontSize: '12px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Department</th>
                <th style={{ padding: '24px 20px', fontWeight: 700, color: '#64748b', fontSize: '12px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Status</th>
                <th style={{ padding: '24px 32px', fontWeight: 700, color: '#64748b', fontSize: '12px', letterSpacing: '0.06em', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '60px', textAlign: 'center', color: '#94a3b8', fontSize: '15px' }}>
                    <div style={{ fontSize: '40px', marginBottom: '16px' }}>📭</div>
                    No employees match your search criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((emp, index) => {
                  const isUnregistered = emp._source === 'users_table';
                  const isActive = (emp.employment_status || 'Active').toLowerCase() === 'active';
                  const avatarUrl = resolvePhoto(emp.profile_photo_path) || resolvePhoto(emp.user_photo);
                  
                  return (
                    <tr key={emp.employee_id} 
                        style={{ 
                          borderBottom: '1px solid #f1f5f9',
                          transition: 'all 0.2s ease',
                          background: index % 2 === 0 ? '#ffffff' : '#fafafa',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = '#f0f9ff'; e.currentTarget.style.transform = 'scale(1.001)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = index % 2 === 0 ? '#ffffff' : '#fafafa'; e.currentTarget.style.transform = 'scale(1)'; }}
                    >
                      {/* Employee Profile (Avatar + Name + Contact) */}
                      <td style={{ padding: '20px 32px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <div style={{ 
                            width: '48px', height: '48px', borderRadius: '50%', 
                            background: avatarUrl ? 'transparent' : 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)',
                            color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '18px', fontWeight: 'bold', flexShrink: 0,
                            boxShadow: '0 4px 10px rgba(0,0,0,0.05)', overflow: 'hidden',
                            border: '2px solid #ffffff'
                          }}>
                            {avatarUrl ? (
                              <img src={avatarUrl} alt={emp.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              emp.full_name?.charAt(0).toUpperCase() || '?'
                            )}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '15px', marginBottom: '2px' }}>{emp.full_name}</div>
                            <div style={{ color: '#64748b', fontSize: '13px' }}>{emp.personal_email || emp.personal_phone || 'No contact info'}</div>
                          </div>
                        </div>
                      </td>

                      {/* ID & Position */}
                      <td style={{ padding: '20px 20px' }}>
                        <div style={{ fontWeight: 600, color: '#334155', fontSize: '14px', fontFamily: 'monospace' }}>
                          #{emp.employee_id}
                          {isUnregistered && (
                            <span style={{ marginLeft: 8, fontSize: '10px', background: '#fef3c7', color: '#d97706', padding: '2px 8px', borderRadius: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                              Pending Setup
                            </span>
                          )}
                        </div>
                        <div style={{ color: '#64748b', fontSize: '13px', marginTop: '2px', fontWeight: 500 }}>
                          {emp.position_title || emp.position_id || 'Position Not Assigned'}
                        </div>
                      </td>

                      {/* Department */}
                      <td style={{ padding: '20px 20px' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', background: '#f1f5f9', padding: '6px 12px', borderRadius: '8px', color: '#475569', fontSize: '13px', fontWeight: 600 }}>
                          🏢 {emp.dept_name || emp.dept_id || 'No Department'}
                        </div>
                      </td>

                      {/* Status */}
                      <td style={{ padding: '20px 20px' }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: '6px',
                          background: isActive ? '#dcfce7' : '#fee2e2',
                          color: isActive ? '#16a34a' : '#dc2626',
                          padding: '6px 12px', borderRadius: '20px',
                          fontSize: '12px', fontWeight: 700,
                          boxShadow: isActive ? '0 2px 10px rgba(22,163,74,0.1)' : '0 2px 10px rgba(220,38,38,0.1)'
                        }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: isActive ? '#16a34a' : '#dc2626' }}></span>
                          {emp.employment_status || 'Active'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '20px 32px', textAlign: 'right' }}>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isUnregistered) {
                              onRegister && onRegister(emp);
                            } else {
                              onEdit && onEdit(emp);
                            }
                          }}
                          style={{
                            background: isUnregistered ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' : '#ffffff',
                            color: isUnregistered ? '#ffffff' : '#3b82f6',
                            border: isUnregistered ? 'none' : '1px solid #bfdbfe',
                            padding: '8px 16px',
                            borderRadius: '8px',
                            fontWeight: 600,
                            fontSize: '13px',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            boxShadow: isUnregistered ? '0 4px 12px rgba(217,119,6,0.2)' : '0 2px 5px rgba(0,0,0,0.02)'
                          }}
                          onMouseEnter={(e) => {
                            if (!isUnregistered) e.currentTarget.style.background = '#eff6ff';
                            e.currentTarget.style.transform = 'translateY(-1px)';
                          }}
                          onMouseLeave={(e) => {
                            if (!isUnregistered) e.currentTarget.style.background = '#ffffff';
                            e.currentTarget.style.transform = 'translateY(0)';
                          }}
                        >
                          {isUnregistered ? 'Complete Setup ✨' : 'Edit Profile'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Edit / Register Modal ─────────────────────────────────── */}
      {editing && (
        <div className={styles.modalOverlay} onClick={() => !editing.saving && setEditing(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}
            style={{ maxWidth: 720, width: '95%', maxHeight: '90vh', overflowY: 'auto' }}>

            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                {editing.isNew ? `Register Employee — ${editing.emp.full_name}` : `Edit Profile — ${editing.emp.full_name}`}
              </h2>
              <button className={styles.closeBtn} onClick={() => setEditing(null)} disabled={editing.saving}>×</button>
            </div>

            <div className={styles.modalBody}>
              {editing.error && (
                <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#b91c1c',
                  padding: '10px 14px', borderRadius: 6, marginBottom: 16, fontSize: '0.9rem' }}>
                  {editing.error}
                </div>
              )}

              {/* ── Personal Info ── */}
              <div className={styles.profileSection}>
                <h3>Personal Information</h3>
                <div className={styles.formGrid}>
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
                  <label style={{ gridColumn: '1 / -1' }}>Physical Address
                    <input value={editing.form.physical_address} onChange={e => setField('physical_address', e.target.value)} />
                  </label>
                </div>
              </div>

              {/* ── Employment Info ── */}
              <div className={styles.profileSection}>
                <h3>Employment Information</h3>
                <div className={styles.formGrid}>
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
                  <label>Has PC Access
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

              {/* ── Compensation ── */}
              <div className={styles.profileSection}>
                <h3>Compensation</h3>
                <div className={styles.formGrid}>
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

              {/* ── Bank ── */}
              <div className={styles.profileSection}>
                <h3>Bank Details</h3>
                <div className={styles.formGrid}>
                  <label>Bank Name
                    <input value={editing.form.bank_name} onChange={e => setField('bank_name', e.target.value)} />
                  </label>
                  <label>Account Number
                    <input value={editing.form.bank_account_number} onChange={e => setField('bank_account_number', e.target.value)} />
                  </label>
                </div>
              </div>

              {/* ── Emergency Contact ── */}
              <div className={styles.profileSection}>
                <h3>Emergency Contact</h3>
                <div className={styles.formGrid}>
                  <label>Contact Name
                    <input value={editing.form.emergency_contact_name} onChange={e => setField('emergency_contact_name', e.target.value)} />
                  </label>
                  <label>Contact Phone
                    <input value={editing.form.emergency_contact_phone} onChange={e => setField('emergency_contact_phone', e.target.value)} />
                  </label>
                </div>
              </div>
            </div>

            <div className={styles.modalActions}>
              <button type="button" className={styles.cancelBtn}
                onClick={() => setEditing(null)} disabled={editing.saving}>
                Cancel
              </button>
              <button type="button" className={styles.viewBtn}
                onClick={handleSave} disabled={editing.saving}
                style={{ marginLeft: 12, minWidth: 120 }}>
                {editing.saving ? 'Saving…' : editing.isNew ? 'Register Employee' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HREmployees;
