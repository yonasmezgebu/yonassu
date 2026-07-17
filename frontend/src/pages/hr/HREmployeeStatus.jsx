import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Phone, Mail, MapPin, Briefcase, Calendar, Clock,
  Monitor, CreditCard, DollarSign, AlertCircle, Hash, User,
  Building2, Fingerprint, ChevronRight, Search, Edit3
} from 'lucide-react';
import hrService from '../../services/hrService';
import { playSuccessSound } from '../../utils/playNotificationSound';
import { formatCurrency } from '../../utils/formatters';

const BACKEND_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1').replace('/api/v1', '');
const STATUS_OPTIONS = ['Active', 'On Leave', 'Suspended', 'Terminated'];

const AVATAR_GRADIENTS = [
  'linear-gradient(135deg,#667eea,#764ba2)',
  'linear-gradient(135deg,#f093fb,#f5576c)',
  'linear-gradient(135deg,#4facfe,#00f2fe)',
  'linear-gradient(135deg,#43e97b,#38f9d7)',
  'linear-gradient(135deg,#fa709a,#fee140)',
  'linear-gradient(135deg,#a18cd1,#fbc2eb)',
  'linear-gradient(135deg,#fda085,#f6d365)',
  'linear-gradient(135deg,#89f7fe,#66a6ff)',
];

const resolvePhoto = (path) => {
  if (!path) return null;
  return path.startsWith('http') ? path : `${BACKEND_URL}${path}`;
};

const avatarGradient = (name = '') =>
  AVATAR_GRADIENTS[name.charCodeAt(0) % AVATAR_GRADIENTS.length];

const statusColors = {
  active:     { bg: '#dcfce7', color: '#166534', dot: '#16a34a' },
  'on leave': { bg: '#fef3c7', color: '#92400e', dot: '#d97706' },
  suspended:  { bg: '#fee2e2', color: '#b91c1c', dot: '#dc2626' },
  terminated: { bg: '#f1f5f9', color: '#475569', dot: '#64748b' },
};

const StatusBadge = ({ status }) => {
  const s = statusColors[(status || 'active').toLowerCase()] || statusColors.active;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '5px 14px', borderRadius: 999,
      background: s.bg, color: s.color,
      fontSize: 12, fontWeight: 700, letterSpacing: '0.04em',
    }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: s.dot }} />
      {status || 'Active'}
    </span>
  );
};


/* ─────────────────── FULL PROFILE PAGE ─────────────────── */
const ProfilePage = ({ emp, onBack, onStatusChange, updatingId, onEditClick }) => {
  const photo = resolvePhoto(emp.profile_photo_path) || resolvePhoto(emp.user_photo);
  const initials = (emp.full_name || '?').charAt(0).toUpperCase();
  const grad = avatarGradient(emp.full_name);

  const InfoRow = ({ icon: Icon, label, value, mono }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {label}
      </span>
      <span style={{
        fontSize: 15, fontWeight: 500, color: '#1e293b',
        fontFamily: mono ? 'monospace' : 'inherit', letterSpacing: mono ? '0.08em' : 'normal',
        display: 'flex', alignItems: 'center', gap: 6,
      }}>
        {Icon && <Icon size={14} color="#94a3b8" style={{ flexShrink: 0 }} />}
        {value || '—'}
      </span>
    </div>
  );

  const SectionHeader = ({ title, icon: Icon, accent }) => (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      marginTop: 32, marginBottom: 20, paddingBottom: 12,
      borderBottom: '2px solid #f1f5f9',
    }}>
      <div style={{
        width: 34, height: 34, borderRadius: 10,
        background: accent + '18',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={17} color={accent} strokeWidth={2.2} />
      </div>
      <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {title}
      </h2>
    </div>
  );

  return (
    <div style={{
      minHeight: '100%', background: '#f8fafc',
      animation: 'fadeSlideIn 0.35s cubic-bezier(0.16,1,0.3,1)',
    }}>
      <style>{`
        @keyframes fadeSlideIn { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      {/* ─── WORLD-CLASS PROFILE HERO ─── */}
      <div style={{
        background: 'linear-gradient(135deg, #020617 0%, #0f172a 40%, #1e3a8a 80%, #2563eb 100%)',
        padding: '36px 32px 0',
        position: 'relative', overflow: 'hidden',
        borderBottom: '1px solid rgba(255,255,255,0.1)'
      }}>
        <div style={{ position:'absolute', top:-60, right:-40, width:300, height:300, borderRadius:'50%', background:'radial-gradient(circle, rgba(96,165,250,0.3) 0%, transparent 70%)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', bottom:-40, left:60, width:200, height:200, borderRadius:'50%', background:'radial-gradient(circle, rgba(147,197,253,0.2) 0%, transparent 70%)', pointerEvents:'none' }} />
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '40px 40px', pointerEvents: 'none' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
          <button onClick={onBack} style={{
            background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)',
            padding: '8px 18px', borderRadius: 10, fontSize: 13, fontWeight: 600,
            color: '#e2e8f0', cursor: 'pointer', display: 'inline-flex', alignItems: 'center',
            gap: 7, backdropFilter: 'blur(8px)',
          }}>
            <ArrowLeft size={15} /> Back to Directory
          </button>
          {/* EDIT PROFILE BUTTON */}
          <button onClick={() => onEditClick(emp)} style={{
            background: 'linear-gradient(135deg,#3b82f6,#2563eb)',
            border: 'none', padding: '8px 20px', borderRadius: 10, fontSize: 13, fontWeight: 700,
            color: '#fff', cursor: 'pointer', display: 'inline-flex', alignItems: 'center',
            gap: 8, boxShadow: '0 4px 15px rgba(59,130,246,0.4)',
          }}>
            <Edit3 size={14} /> Edit Profile
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 28, paddingBottom: 0 }}>
          {/* Avatar */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            {photo ? (
              <img src={photo} alt={emp.full_name} style={{
                width: 108, height: 108, borderRadius: '50%', objectFit: 'cover',
                border: '4px solid rgba(255,255,255,0.25)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
              }} />
            ) : (
              <div style={{
                width: 108, height: 108, borderRadius: '50%',
                background: grad, color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 44, fontWeight: 800,
                border: '4px solid rgba(255,255,255,0.2)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
              }}>
                {initials}
              </div>
            )}
          </div>

          {/* Name + meta */}
          <div style={{ flex: 1, paddingBottom: 24 }}>
            <h1 style={{ margin: '0 0 6px', fontSize: 30, fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>
              {emp.full_name}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 15, color: '#94a3b8', fontWeight: 500 }}>
                {emp.position_title || emp.position_id || 'Employee'}
              </span>
              <span style={{ color: '#334155' }}>•</span>
              <span style={{ fontSize: 15, color: '#94a3b8' }}>
                {emp.dept_name || emp.dept_id || 'SUTANA'}
              </span>
              <span style={{ color: '#334155' }}>•</span>
              <span style={{ fontSize: 13, color: '#64748b', fontFamily: 'monospace', letterSpacing: '0.06em' }}>
                {emp.employee_id}
              </span>
            </div>
          </div>

          {/* Status control */}
          <div style={{
            background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 14, padding: '14px 20px', backdropFilter: 'blur(12px)',
            display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-start',
            marginBottom: 24,
          }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Employment Status
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <StatusBadge status={emp.employment_status} />
              <select
                value={emp.employment_status || 'Active'}
                disabled={updatingId === emp.employee_id}
                onChange={(e) => onStatusChange(emp.employee_id, e.target.value)}
                style={{
                  padding: '7px 12px', borderRadius: 8,
                  border: '1px solid rgba(255,255,255,0.15)',
                  background: 'rgba(255,255,255,0.08)', color: '#e2e8f0',
                  fontSize: 13, fontWeight: 600, cursor: 'pointer', outline: 'none',
                }}
              >
                {STATUS_OPTIONS.map(o => <option key={o} value={o} style={{ background: '#1e293b' }}>{o}</option>)}
              </select>
              {updatingId === emp.employee_id && (
                <span style={{ fontSize: 12, color: '#38bdf8', fontWeight: 600 }}>Saving…</span>
              )}
            </div>
          </div>
        </div>

        <div style={{
          height: 3, marginTop: 24,
          background: 'linear-gradient(90deg, #3b82f6, #8b5cf6, transparent)',
          borderRadius: '3px 3px 0 0',
        }} />
      </div>

      {/* ─── SINGLE DOCUMENT PAGE ─── */}
      <div style={{ padding: '0 32px 40px', marginTop: -40, position: 'relative', zIndex: 10 }}>
        <div style={{
          background: '#fff', borderRadius: 24, padding: '10px 40px 40px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.08)', border: '1px solid rgba(0,0,0,0.04)'
        }}>
          <SectionHeader title="Personal Details" icon={User} accent="#3b82f6" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px 32px' }}>
            <InfoRow icon={Fingerprint} label="National ID" value={emp.national_id} mono />
            <InfoRow icon={null} label="Gender" value={emp.gender} />
            <InfoRow icon={Calendar} label="Date of Birth" value={emp.date_of_birth ? new Date(emp.date_of_birth).toLocaleDateString('en-GB') : null} />
            <InfoRow icon={null} label="Marital Status" value={emp.marital_status} />
            <InfoRow icon={Phone} label="Phone Number" value={emp.personal_phone} />
            <InfoRow icon={Mail} label="Email Address" value={emp.personal_email} />
            <div style={{ gridColumn: '1 / -1' }}>
              <InfoRow icon={MapPin} label="Physical Address" value={emp.physical_address} />
            </div>
          </div>

          <SectionHeader title="Employment Details" icon={Briefcase} accent="#8b5cf6" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px 32px' }}>
            <InfoRow icon={Building2} label="Department" value={emp.dept_name || emp.dept_id} />
            <InfoRow icon={null} label="Position" value={emp.position_title || emp.position_id} />
            <InfoRow icon={Calendar} label="Hire Date" value={emp.hire_date ? new Date(emp.hire_date).toLocaleDateString('en-GB') : null} />
            <InfoRow icon={null} label="Employment Type" value={emp.employment_type} />
            <InfoRow icon={Clock} label="Shift Start" value={emp.shift_start_time} />
            <InfoRow icon={Clock} label="Shift End" value={emp.shift_end_time} />
            <InfoRow icon={Monitor} label="PC / System Access" value={emp.has_pc_access} />
            <InfoRow icon={null} label="Weekly Off Days" value={emp.weekly_off_days} />
          </div>

          <SectionHeader title="Financial & Bank" icon={CreditCard} accent="#10b981" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px 32px' }}>
            <InfoRow
              icon={DollarSign}
              label="Base Salary"
              value={
                <span style={{ color: '#10b981', fontWeight: 800, fontSize: 18 }}>
                  {emp.base_salary ? formatCurrency(emp.base_salary) : '—'}
                </span>
              }
            />
            <InfoRow icon={null} label="Housing Allowance" value={formatCurrency(emp.housing_allowance || 0)} />
            <InfoRow icon={null} label="Transport Allowance" value={formatCurrency(emp.transport_allowance || 0)} />
            <InfoRow icon={null} label="Communication Allow." value={formatCurrency(emp.communication_allowance || 0)} />
            <InfoRow icon={null} label="Overtime Rate" value={emp.overtime_rate ? `×${emp.overtime_rate}` : '—'} />
            <InfoRow icon={null} label="Bank Name" value={emp.bank_name} />
            <div style={{ gridColumn: '1 / -1' }}>
              <InfoRow icon={Hash} label="Bank Account Number" value={emp.bank_account_number} mono />
            </div>
          </div>

          <SectionHeader title="Emergency & Documents" icon={AlertCircle} accent="#ef4444" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px 32px' }}>
            <InfoRow icon={User} label="Contact Name" value={emp.emergency_contact_name} />
            <InfoRow icon={Phone} label="Contact Phone" value={emp.emergency_contact_phone} />
            <div style={{ gridColumn: '1 / -1' }}>
              <InfoRow
                icon={null}
                label="Uploaded Document"
                value={emp.document_path ? (
                  <a href={emp.document_path} target="_blank" rel="noreferrer" style={{ color: '#3b82f6', textDecoration: 'none', fontWeight: 600 }}>
                    📄 View Document ({emp.document_path.split('/').pop()})
                  </a>
                ) : 'No document uploaded'}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─────────────────── MAIN COMPONENT ─────────────────── */
const HREmployeeStatus = ({ onEdit }) => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [selected, setSelected] = useState(null);

  const handleEditClick = (emp) => {
    if (onEdit) {
      onEdit(emp);
    } else {
      navigate('/hr/employees?tab=edit', { state: { prefillData: emp } });
    }
  };

  const fetchEmployees = useCallback(async () => {
    try {
      setLoading(true);
      const res = await hrService.etp.listEmployees({ search, _t: Date.now() });
      const raw = Array.isArray(res?.data?.data) ? res.data.data
        : Array.isArray(res?.data) ? res.data : [];
      const registered = raw.filter(e => e._source !== 'users_table');
      setEmployees(registered);
      if (selected) {
        const upd = registered.find(e => e.employee_id === selected.employee_id);
        if (upd) setSelected(upd);
      }
    } catch (err) {
      console.error('[HREmployeeInfo] fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [search]); // eslint-disable-line

  useEffect(() => { fetchEmployees(); }, [fetchEmployees]);

  const handleStatusChange = async (empId, newStatus) => {
    if (!window.confirm(`Change status to "${newStatus}"?`)) return;
    setUpdatingId(empId);
    try {
      await hrService.updateEmployeeStatus(empId, newStatus);
      playSuccessSound();
      setEmployees(prev => prev.map(e => e.employee_id === empId ? { ...e, employment_status: newStatus } : e));
      if (selected?.employee_id === empId) setSelected(prev => ({ ...prev, employment_status: newStatus }));
    } catch {
      alert('Failed to update status');
    } finally {
      setUpdatingId(null);
    }
  };

  /* ── If an employee is selected, show their full profile ── */
  if (selected) {
    return (
      <ProfilePage
        emp={selected}
        onBack={() => setSelected(null)}
        onStatusChange={handleStatusChange}
        updatingId={updatingId}
        onEditClick={handleEditClick}
      />
    );
  }

  /* ── Otherwise show the employee directory ── */
  return (
    <div style={{ minHeight: '100%', background: '#f8fafc' }}>

      {/* ─── WORLD-CLASS DIRECTORY HERO ─── */}
      <div style={{
        position: 'relative',
        background: 'linear-gradient(135deg, #020617 0%, #0f172a 40%, #1e3a8a 80%, #2563eb 100%)',
        padding: '36px 32px 40px',
        overflow: 'hidden',
      }}>
        {/* Glowing Orbs */}
        <div style={{ position:'absolute', top:-40, right:-20, width:280, height:280, borderRadius:'50%', background:'radial-gradient(circle, rgba(96,165,250,0.3) 0%, transparent 70%)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', bottom:-50, left:60, width:220, height:220, borderRadius:'50%', background:'radial-gradient(circle, rgba(147,197,253,0.2) 0%, transparent 70%)', pointerEvents:'none' }} />
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '40px 40px', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(241,245,249,0.2)', border: '1px solid rgba(241,245,249,0.4)', borderRadius: 20, padding: '4px 14px', marginBottom: 14 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#93c5fd', display: 'inline-block', boxShadow: '0 0 8px #93c5fd' }} />
            <span style={{ color: '#eff6ff', fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Documents & Comms</span>
          </div>
          <h1 style={{ margin: '0 0 8px', fontSize: 38, fontWeight: 900, color: '#ffffff', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
            Employee
            <span style={{ background: 'linear-gradient(90deg, #93c5fd, #bfdbfe)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginLeft: 12 }}>Directory</span>
          </h1>
        <p style={{ margin: 0, color: '#64748b', fontSize: 14 }}>
          {loading ? 'Loading…' : `${employees.length} registered employee${employees.length !== 1 ? 's' : ''} — click a card to view full details`}
        </p>

        <div style={{ marginTop: 20, position: 'relative', maxWidth: 460 }}>
          <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or ID…"
            style={{
              width: '100%', boxSizing: 'border-box',
              padding: '12px 16px 12px 40px',
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 12, fontSize: 15, color: '#f8fafc',
              outline: 'none', backdropFilter: 'blur(8px)',
              transition: 'all 0.2s',
            }}
            onFocus={e => { e.currentTarget.style.background='rgba(255,255,255,0.15)'; e.currentTarget.style.border='1px solid rgba(255,255,255,0.4)'; }}
            onBlur={e => { e.currentTarget.style.background='rgba(255,255,255,0.1)'; e.currentTarget.style.border='1px solid rgba(255,255,255,0.2)'; }}
          />
        </div>
        </div>
      </div>

      {/* Card Grid */}
      <div style={{ padding: '28px 32px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 80, color: '#64748b', fontSize: 16 }}>Loading employees…</div>
        ) : employees.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 80, color: '#94a3b8', fontSize: 15 }}>
            No registered employees found.
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: 20,
          }}>
            {employees.map(emp => {
              const photo = resolvePhoto(emp.profile_photo_path) || resolvePhoto(emp.user_photo);
              const initials = (emp.full_name || '?').charAt(0).toUpperCase();
              const grad = avatarGradient(emp.full_name);
              const s = statusColors[(emp.employment_status || 'active').toLowerCase()] || statusColors.active;

              return (
                <div
                  key={emp.employee_id}
                  onClick={() => setSelected(emp)}
                  style={{
                    background: '#fff', borderRadius: 18,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                    border: '1px solid #f1f5f9',
                    cursor: 'pointer', overflow: 'hidden',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 36px rgba(0,0,0,0.1)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.05)'; }}
                >
                  <div style={{ height: 5, background: grad }} />

                  <div style={{ padding: '22px 22px 18px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                      {photo ? (
                        <img src={photo} alt={emp.full_name} style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover', border: '3px solid #f1f5f9' }} />
                      ) : (
                        <div style={{ width: 56, height: 56, borderRadius: '50%', background: grad, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 800, flexShrink: 0 }}>
                          {initials}
                        </div>
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 800, fontSize: 16, color: '#0f172a', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {emp.full_name}
                        </div>
                        <div style={{ fontSize: 13, color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {emp.position_title || emp.position_id || 'Employee'}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#475569' }}>
                        <Building2 size={13} color="#94a3b8" />
                        {emp.dept_name || emp.dept_id || '—'}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#475569' }}>
                        <Hash size={13} color="#94a3b8" />
                        <span style={{ fontFamily: 'monospace', letterSpacing: '0.05em' }}>{emp.employee_id}</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, paddingTop: 14, borderTop: '1px solid #f1f5f9' }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        padding: '4px 12px', borderRadius: 999,
                        background: s.bg, color: s.color, fontSize: 12, fontWeight: 700,
                      }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.dot }} />
                        {emp.employment_status || 'Active'}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: '#3b82f6', fontWeight: 600 }}>
                        View Profile <ChevronRight size={15} />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default HREmployeeStatus;
