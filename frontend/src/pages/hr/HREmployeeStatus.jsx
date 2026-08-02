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
import styles from './HREmployeeStatus.module.css';

const BACKEND_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1').replace('/api/v1', '');
const STATUS_OPTIONS = ['Active', 'On Leave', 'Suspended', 'Terminated'];

const resolvePhoto = (path) => {
  if (!path) return null;
  return path.startsWith('http') ? path : `${BACKEND_URL}${path}`;
};

const avatarColor = (name = '') => {
  const colors = ['#228B22','#2E8B57','#1B5E20','#388E3C','#43A047','#2E7D32','#006400','#33691E'];
  return colors[name.charCodeAt(0) % colors.length];
};

const getStatusClass = (status) => {
  switch ((status || '').toLowerCase()) {
    case 'active':      return styles.statusActive;
    case 'on leave':    return styles.statusLeave;
    case 'suspended':   return styles.statusSuspended;
    case 'terminated':  return styles.statusTerminated;
    default:            return styles.statusActive;
  }
};

const getStatusDotColor = (status) => {
  switch ((status || '').toLowerCase()) {
    case 'active':      return '#4CAF50';
    case 'on leave':    return '#FF9800';
    case 'suspended':   return '#F44336';
    case 'terminated':  return '#8D6E63';
    default:            return '#4CAF50';
  }
};

/* ─────────────────── PROFILE DETAIL PAGE ─────────────────── */
const ProfilePage = ({ emp, onBack, onStatusChange, updatingId, onEditClick }) => {
  const photo = resolvePhoto(emp.profile_photo_path) || resolvePhoto(emp.user_photo);
  const initials = (emp.full_name || '?').charAt(0).toUpperCase();
  const bgColor = avatarColor(emp.full_name);

  const InfoRow = ({ icon: Icon, label, value, mono, salary, link }) => (
    <div className={styles.infoItem}>
      <span className={styles.infoLabel}>{label}</span>
      <span className={`${styles.infoValue} ${mono ? styles.infoValueMono : ''} ${salary ? styles.infoValueSalary : ''}`}>
        {Icon && <Icon size={13} />}
        {link && value ? (
          <a href={link} target="_blank" rel="noreferrer" className={styles.infoValueLink}>{value}</a>
        ) : (value || '—')}
      </span>
    </div>
  );

  return (
    <div className={styles.profileContainer}>
      {/* ── PROFILE HERO — Rules 2, 3, 11, 12 ── */}
      <div className={styles.profileHero}>
        <div className={styles.profileHeroTop}>
          <button className={styles.backBtn} onClick={onBack}>
            <ArrowLeft size={14} /> Back to Directory
          </button>
          <button className={styles.editBtn} onClick={() => onEditClick(emp)}>
            <Edit3 size={13} /> Edit Profile
          </button>
        </div>

        <div className={styles.profileHeroBody}>
          {/* Avatar */}
          {photo ? (
            <img src={photo} alt={emp.full_name} className={styles.heroAvatarImg} />
          ) : (
            <div className={styles.heroAvatarInitial} style={{ background: bgColor }}>
              {initials}
            </div>
          )}

          {/* Name & meta */}
          <div className={styles.heroInfo}>
            <h1 className={styles.heroName}>{emp.full_name}</h1>
            <div className={styles.heroMeta}>
              <span className={styles.heroMetaItem}>{emp.position_title || emp.position_id || 'Staff'}</span>
              <span className={styles.heroMetaDot}>·</span>
              <span className={styles.heroMetaItem}>{emp.dept_name || emp.dept_id || 'SUTANA'}</span>
              <span className={styles.heroMetaDot}>·</span>
              <span className={styles.heroEmpId}>{emp.employee_id}</span>
            </div>
          </div>

          {/* Status Control */}
          <div className={styles.statusControl}>
            <span className={styles.statusControlLbl}>Employment Status</span>
            <div className={styles.statusControlRow}>
              <span className={`${styles.statusBadge} ${getStatusClass(emp.employment_status)}`}>
                <span className={styles.statusDot} style={{ background: getStatusDotColor(emp.employment_status) }} />
                {emp.employment_status || 'Active'}
              </span>
              <select
                className={styles.statusSelect}
                value={emp.employment_status || 'Active'}
                disabled={updatingId === emp.employee_id}
                onChange={(e) => onStatusChange(emp.employee_id, e.target.value)}
              >
                {STATUS_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
              {updatingId === emp.employee_id && (
                <span className={styles.updatingTxt}>Saving…</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── PROFILE BODY ── */}
      <div className={styles.profileBody}>

        {/* Personal Details */}
        <div className={styles.sectionDivider}>
          <div className={styles.sectionDividerIcon}><User size={16} color="#228B22" /></div>
          <h2 className={styles.sectionDividerTitle}>Personal Details</h2>
        </div>
        <div className={styles.detailCard}>
          <div className={styles.infoGrid}>
            <InfoRow icon={Fingerprint} label="National ID"        value={emp.national_id}         mono />
            <InfoRow              label="Gender"                    value={emp.gender} />
            <InfoRow icon={Calendar} label="Date of Birth"         value={emp.date_of_birth ? new Date(emp.date_of_birth).toLocaleDateString('en-GB') : null} />
            <InfoRow              label="Marital Status"           value={emp.marital_status} />
            <InfoRow icon={Phone} label="Phone Number"            value={emp.personal_phone} />
            <InfoRow icon={Mail}  label="Email Address"           value={emp.personal_email} />
            <div className={styles.infoGridFull}>
              <InfoRow icon={MapPin} label="Physical Address"     value={emp.physical_address} />
            </div>
          </div>
        </div>

        {/* Employment Details */}
        <div className={styles.sectionDivider}>
          <div className={styles.sectionDividerIcon}><Briefcase size={16} color="#228B22" /></div>
          <h2 className={styles.sectionDividerTitle}>Employment Details</h2>
        </div>
        <div className={styles.detailCard}>
          <div className={styles.infoGrid}>
            <InfoRow icon={Building2} label="Department"          value={emp.dept_name || emp.dept_id} />
            <InfoRow               label="Position"               value={emp.position_title || emp.position_id} />
            <InfoRow icon={Calendar} label="Hire Date"            value={emp.hire_date ? new Date(emp.hire_date).toLocaleDateString('en-GB') : null} />
            <InfoRow               label="Employment Type"        value={emp.employment_type} />
            <InfoRow icon={Clock}  label="Shift Start"           value={emp.shift_start_time} />
            <InfoRow icon={Clock}  label="Shift End"             value={emp.shift_end_time} />
            <InfoRow icon={Monitor} label="PC / System Access"   value={emp.has_pc_access} />
            <InfoRow               label="Weekly Off Days"        value={emp.weekly_off_days} />
          </div>
        </div>

        {/* Financial & Bank */}
        <div className={styles.sectionDivider}>
          <div className={styles.sectionDividerIcon}><CreditCard size={16} color="#228B22" /></div>
          <h2 className={styles.sectionDividerTitle}>Financial &amp; Bank</h2>
        </div>
        <div className={styles.detailCard}>
          <div className={styles.infoGrid}>
            <InfoRow icon={DollarSign} label="Base Salary"
              value={emp.base_salary ? formatCurrency(emp.base_salary) : '—'}
              salary />
            <InfoRow label="Housing Allowance"        value={formatCurrency(emp.housing_allowance || 0)} />
            <InfoRow label="Transport Allowance"      value={formatCurrency(emp.transport_allowance || 0)} />
            <InfoRow label="Communication Allowance"  value={formatCurrency(emp.communication_allowance || 0)} />
            <InfoRow label="Overtime Rate"            value={emp.overtime_rate ? `×${emp.overtime_rate}` : '—'} />
            <InfoRow label="Bank Name"                value={emp.bank_name} />
            <div className={styles.infoGridFull}>
              <InfoRow icon={Hash} label="Bank Account Number"   value={emp.bank_account_number} mono />
            </div>
          </div>
        </div>

        {/* Emergency & Documents */}
        <div className={styles.sectionDivider}>
          <div className={styles.sectionDividerIcon}><AlertCircle size={16} color="#228B22" /></div>
          <h2 className={styles.sectionDividerTitle}>Emergency &amp; Documents</h2>
        </div>
        <div className={styles.detailCard}>
          <div className={styles.infoGrid}>
            <InfoRow icon={User}  label="Contact Name"  value={emp.emergency_contact_name} />
            <InfoRow icon={Phone} label="Contact Phone" value={emp.emergency_contact_phone} />
            <div className={styles.infoGridFull}>
              <InfoRow
                label="Uploaded Document"
                value={emp.document_path ? `📄 View Document (${emp.document_path.split('/').pop()})` : 'No document uploaded'}
                link={emp.document_path || null}
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
  const [notif, setNotif] = useState({ type: null, text: '' });

  const handleEditClick = (emp) => {
    if (onEdit) {
      onEdit(emp);
    } else {
      navigate('/hr/employees?tab=edit', { state: { prefillData: emp } });
    }
  };

  const showNotif = (type, text) => {
    setNotif({ type, text });
    setTimeout(() => setNotif({ type: null, text: '' }), 4000);
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
    // Rule 6: No window.confirm — inline action with in-app notification
    setUpdatingId(empId);
    try {
      await hrService.updateEmployeeStatus(empId, newStatus);
      playSuccessSound();
      setEmployees(prev => prev.map(e => e.employee_id === empId ? { ...e, employment_status: newStatus } : e));
      if (selected?.employee_id === empId) setSelected(prev => ({ ...prev, employment_status: newStatus }));
      showNotif('success', `Status updated to "${newStatus}" successfully.`);
    } catch {
      showNotif('error', 'Failed to update employment status.');
    } finally {
      setUpdatingId(null);
    }
  };

  /* ── Profile Detail View ── */
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

  /* ── Directory (Card Grid) View ── */
  return (
    <div className={styles.container}>

      {/* ── HEADER — Rules 2, 3, 11, 12 ── */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.badge}>
            <span className={styles.badgeDot} />
            <span className={styles.badgeTxt}>Documents &amp; Comms</span>
          </div>
          <h1 className={styles.pageTitle}>
            Employee <span>Directory</span>
          </h1>
          <p className={styles.pageSubtitle}>
            {loading ? 'Loading…' : `${employees.length} registered staff member${employees.length !== 1 ? 's' : ''} — click a card to view full details`}
          </p>
        </div>

        {/* Search — Rule 10, 14 */}
        <div className={styles.searchWrap}>
          <Search className={styles.searchIcon} size={16} />
          <input
            className={styles.searchInput}
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or ID…"
          />
        </div>
      </div>

      {/* ── IN-APP NOTIFICATION — Rule 6 ── */}
      {notif.text && (
        <div style={{
          padding: '14px 48px',
          fontWeight: 700,
          fontSize: 13,
          borderLeft: '6px solid',
          background: notif.type === 'success' ? '#E8F5E9' : '#FFEBEE',
          borderColor: notif.type === 'success' ? '#228B22' : '#D32F2F',
          color: notif.type === 'success' ? '#1B5E20' : '#C62828',
        }}>
          {notif.text}
        </div>
      )}

      {/* ── CARD GRID — Rules 3, 4, 8, 15 ── */}
      <div className={styles.gridArea}>
        {loading ? (
          <div className={styles.loading}>● Loading staff directory...</div>
        ) : employees.length === 0 ? (
          <div className={styles.emptyState}>No registered staff members found.</div>
        ) : (
          <div className={styles.cardGrid}>
            {employees.map(emp => {
              const photo = resolvePhoto(emp.profile_photo_path) || resolvePhoto(emp.user_photo);
              const initials = (emp.full_name || '?').charAt(0).toUpperCase();
              const bgColor = avatarColor(emp.full_name);

              return (
                <div key={emp.employee_id} className={styles.empCard} onClick={() => setSelected(emp)}>
                  <div className={styles.cardInner}>
                    {/* Top: avatar + name */}
                    <div className={styles.cardTop}>
                      {photo ? (
                        <img src={photo} alt={emp.full_name} className={styles.avatarImg} />
                      ) : (
                        <div className={styles.avatarInitial} style={{ background: bgColor }}>
                          {initials}
                        </div>
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className={styles.empCardName}>{emp.full_name}</div>
                        <div className={styles.empCardPosition}>{emp.position_title || emp.position_id || 'Staff'}</div>
                      </div>
                    </div>

                    {/* Meta rows */}
                    <div className={styles.cardMeta}>
                      <div className={styles.cardMetaRow}>
                        <Building2 size={12} />
                        {emp.dept_name || emp.dept_id || '—'}
                      </div>
                      <div className={styles.cardMetaRow}>
                        <Hash size={12} />
                        <span style={{ fontFamily: 'monospace', letterSpacing: '0.05em' }}>{emp.employee_id}</span>
                      </div>
                    </div>

                    {/* Footer: status + view link */}
                    <div className={styles.cardFooter}>
                      <span className={`${styles.statusBadge} ${getStatusClass(emp.employment_status)}`}>
                        <span className={styles.statusDot} style={{ background: getStatusDotColor(emp.employment_status) }} />
                        {emp.employment_status || 'Active'}
                      </span>
                      <div className={styles.viewLink}>
                        View Profile <ChevronRight size={14} />
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
