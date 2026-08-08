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
  if (path.startsWith('http')) return path;
  const cleanPath = path.replace(/\\/g, '/').replace(/^\/?api\/v1\//, '').replace(/^\//, '');
  return `${BACKEND_URL}/${cleanPath}`;
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

  // Lightbox state — null = closed, {url, label, isPdf} = open
  const [lightbox, setLightbox] = React.useState(null);
  const [lightboxError, setLightboxError] = React.useState(null);

  const openLightbox = async (url, label) => {
    if (!url) return;
    // Quick probe so we catch 404 before opening the viewer
    try {
      const r = await fetch(url, { method: 'HEAD' });
      if (!r.ok) {
        setLightboxError(`"${label}" — file not found on server (${r.status}). Re-upload the document to fix this.`);
        return;
      }
    } catch (_) { /* network error — open anyway, let the browser show the error */ }
    const isPdf = url.toLowerCase().endsWith('.pdf');
    const isImage = url.match(/\.(jpeg|jpg|gif|png|webp)$/i) != null;
    const type = isPdf ? 'pdf' : isImage ? 'image' : 'other';
    
    setLightbox({ url, label, type });
  };

  const InfoRow = ({ icon: Icon, label, value, mono, salary, link, onClick }) => (
    <div className={styles.infoItem}>
      <span className={styles.infoLabel}>{label}</span>
      <span className={`${styles.infoValue} ${mono ? styles.infoValueMono : ''} ${salary ? styles.infoValueSalary : ''}`}>
        {Icon && <Icon size={13} />}
        {onClick && value ? (
          <button
            onClick={onClick}
            style={{
              background: 'none', border: 'none', padding: 0,
              color: '#2563EB', fontWeight: 500, fontSize: 'inherit',
              cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 3,
              fontFamily: 'inherit'
            }}
          >{value}</button>
        ) : link && value ? (
          <a href={link} target="_blank" rel="noreferrer" className={styles.infoValueLink}>{value}</a>
        ) : (value || '—')}
      </span>
    </div>
  );


  return (
    <>
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

        {/* Education & Documents */}
        <div className={styles.sectionDivider}>
          <div className={styles.sectionDividerIcon}><AlertCircle size={16} color="#228B22" /></div>
          <h2 className={styles.sectionDividerTitle}>Education &amp; Documents</h2>
        </div>
        <div className={styles.detailCard}>
          <div className={styles.infoGrid}>
            <InfoRow icon={User}  label="Education Level"  value={emp.education_level} />
            <InfoRow icon={User}  label="Field of Study" value={emp.field_of_study} />
            <div className={styles.infoGridFull}>
              {emp.document_path ? (
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Uploaded Document</span>
                  <span className={styles.infoValue}>
                    {/* Opens document directly in a new browser tab */}
                    <a
                      href={resolvePhoto(emp.document_path)}
                      target="_blank"
                      rel="noreferrer"
                      title="Open document in new browser tab"
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 7,
                        background: '#f0f9ff', border: '1.5px solid #bae6fd',
                        borderRadius: 8, padding: '5px 12px',
                        textDecoration: 'none', color: '#0369a1',
                        fontWeight: 600, fontSize: 13,
                      }}
                    >
                      <span style={{ fontSize: 18 }}>
                        {/\.(pdf)$/i.test(emp.document_path) ? '📄' :
                         /\.(jpe?g|png|gif|webp)$/i.test(emp.document_path) ? '🖼️' : '📎'}
                      </span>
                      {emp.document_path.split(/[\/\\]/).pop()}
                      <span style={{ fontSize: 11, opacity: 0.7 }}>↗</span>
                    </a>
                  </span>
                </div>
              ) : (
                <InfoRow label="Uploaded Document" value="No document uploaded" />
              )}
            </div>

            {/* ID Photos — lightbox buttons */}
            {(emp.id_photo_front || emp.id_photo_back) && (
              <div className={styles.infoGridFull} style={{ marginTop: 8 }}>
                <div style={{
                  display: 'flex', gap: 12, flexWrap: 'wrap', padding: '12px 0'
                }}>
                  {emp.id_photo_front ? (
                    <div
                      onClick={() => openLightbox(resolvePhoto(emp.id_photo_front), 'ID Photo — Front')}
                      style={{
                        cursor: 'pointer',
                        border: '2px solid #E5E7EB',
                        borderRadius: 10,
                        overflow: 'hidden',
                        width: 140,
                        transition: 'border-color 150ms, box-shadow 150ms',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor='#2563EB'; e.currentTarget.style.boxShadow='0 4px 12px rgba(37,99,235,0.18)'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor='#E5E7EB'; e.currentTarget.style.boxShadow='0 1px 4px rgba(0,0,0,0.06)'; }}
                    >
                      <img
                        src={resolvePhoto(emp.id_photo_front)}
                        alt="ID Front"
                        style={{ width: '100%', height: 90, objectFit: 'cover', display: 'block' }}
                      />
                      <div style={{
                        padding: '6px 8px', fontSize: 11, fontWeight: 500,
                        color: '#6B7280', background: '#F9FAFB',
                        borderTop: '1px solid #E5E7EB', textAlign: 'center'
                      }}>ID Front 🔍</div>
                    </div>
                  ) : (
                    <div style={{
                      width: 140, height: 118, border: '2px dashed #E5E7EB',
                      borderRadius: 10, display: 'flex', flexDirection: 'column',
                      alignItems: 'center', justifyContent: 'center',
                      color: '#9CA3AF', fontSize: 12, gap: 4
                    }}>
                      <span style={{ fontSize: 24 }}>🪪</span>
                      <span>No Front ID</span>
                    </div>
                  )}

                  {emp.id_photo_back ? (
                    <div
                      onClick={() => openLightbox(resolvePhoto(emp.id_photo_back), 'ID Photo — Back')}
                      style={{
                        cursor: 'pointer',
                        border: '2px solid #E5E7EB',
                        borderRadius: 10,
                        overflow: 'hidden',
                        width: 140,
                        transition: 'border-color 150ms, box-shadow 150ms',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor='#2563EB'; e.currentTarget.style.boxShadow='0 4px 12px rgba(37,99,235,0.18)'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor='#E5E7EB'; e.currentTarget.style.boxShadow='0 1px 4px rgba(0,0,0,0.06)'; }}
                    >
                      <img
                        src={resolvePhoto(emp.id_photo_back)}
                        alt="ID Back"
                        style={{ width: '100%', height: 90, objectFit: 'cover', display: 'block' }}
                      />
                      <div style={{
                        padding: '6px 8px', fontSize: 11, fontWeight: 500,
                        color: '#6B7280', background: '#F9FAFB',
                        borderTop: '1px solid #E5E7EB', textAlign: 'center'
                      }}>ID Back 🔍</div>
                    </div>
                  ) : (
                    <div style={{
                      width: 140, height: 118, border: '2px dashed #E5E7EB',
                      borderRadius: 10, display: 'flex', flexDirection: 'column',
                      alignItems: 'center', justifyContent: 'center',
                      color: '#9CA3AF', fontSize: 12, gap: 4
                    }}>
                      <span style={{ fontSize: 24 }}>🪪</span>
                      <span>No Back ID</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>

    {/* Error toast for broken document links */}
    {lightboxError && (
      <div
        onClick={() => setLightboxError(null)}
        style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 24,
        }}
      >
        <div
          onClick={e => e.stopPropagation()}
          style={{
            background: '#1F2937', borderRadius: 12, padding: '28px 32px',
            maxWidth: 440, width: '100%', textAlign: 'center',
            boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
            border: '1px solid rgba(239,68,68,0.3)',
          }}
        >
          <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
          <div style={{ color: '#F9FAFB', fontWeight: 600, fontSize: 15, marginBottom: 8 }}>Document Not Found</div>
          <div style={{ color: '#9CA3AF', fontSize: 13, lineHeight: 1.6 }}>{lightboxError}</div>
          <button
            onClick={() => setLightboxError(null)}
            style={{
              marginTop: 20, padding: '8px 24px',
              background: '#EF4444', border: 'none', borderRadius: 8,
              color: '#fff', fontWeight: 600, fontSize: 13, cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >OK</button>
        </div>
      </div>
    )}

    {/* Lightbox / Document viewer */}
    {lightbox && (
      <div
        onClick={() => setLightbox(null)}
        style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(0,0,0,0.82)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '24px',
          backdropFilter: 'blur(6px)',
        }}
      >
        <div
          onClick={e => e.stopPropagation()}
          style={{
            position: 'relative',
            background: '#111827',
            borderRadius: 12,
            boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
            width: lightbox.type === 'pdf' ? 'min(92vw, 900px)' : 'auto',
            maxWidth: lightbox.type === 'pdf' ? 'min(92vw, 900px)' : '90vw',
            maxHeight: '92vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 16px', gap: 12,
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            color: '#F9FAFB', fontSize: 13, fontWeight: 500,
            flexShrink: 0,
          }}>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {lightbox.label || 'Document'}
            </span>
            <button
              onClick={() => setLightbox(null)}
              style={{
                background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: 6,
                minWidth: 28, height: 28, cursor: 'pointer', color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18, lineHeight: 1, fontFamily: 'inherit', flexShrink: 0,
              }}
              aria-label="Close"
            >✕</button>
          </div>

          {/* Content — PDF or Image */}
          {lightbox.type === 'pdf' ? (
            <iframe
              src={lightbox.url}
              title={lightbox.label || 'Document'}
              style={{
                width: '100%',
                height: 'calc(92vh - 100px)',
                border: 'none',
                background: '#fff',
                display: 'block',
              }}
            />
          ) : lightbox.type === 'image' ? (
            <img
              src={lightbox.url}
              alt={lightbox.label || 'Document'}
              onError={e => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.parentNode.innerHTML = `
                  <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;
                    height:280px;color:#9CA3AF;gap:12px;padding:24px;text-align:center">
                    <span style="font-size:48px">📄</span>
                    <span style="font-size:14px;font-weight:500;color:#F9FAFB">File not found on server</span>
                    <span style="font-size:12px;color:#6B7280">The file may have been moved or deleted.<br/>
                    Re-upload the document in Edit Employee to fix this.</span>
                  </div>`;
              }}
              style={{
                maxWidth: '88vw',
                maxHeight: 'calc(92vh - 100px)',
                objectFit: 'contain',
                display: 'block',
                margin: '0 auto',
              }}
            />
          ) : (
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              height: '300px', padding: '24px', textAlign: 'center', color: '#E5E7EB'
            }}>
              <span style={{ fontSize: 48, marginBottom: 16 }}>📁</span>
              <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Preview not available</div>
              <div style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 24, maxWidth: 320 }}>
                This file type cannot be previewed in the browser. Please download it to view the contents.
              </div>
              <a
                href={lightbox.url}
                download
                target="_blank"
                rel="noreferrer"
                style={{
                  background: '#2563EB', color: '#fff', padding: '8px 24px',
                  borderRadius: 6, textDecoration: 'none', fontSize: 13, fontWeight: 600
                }}
              >
                Download File
              </a>
            </div>
          )}

          {/* Footer */}
          <div style={{
            padding: '10px 16px',
            borderTop: '1px solid rgba(255,255,255,0.1)',
            display: 'flex', justifyContent: 'flex-end', gap: 16,
            flexShrink: 0,
          }}>
            <a
              href={lightbox.url}
              target="_blank"
              rel="noreferrer"
              style={{ color: '#93C5FD', fontSize: 12, textDecoration: 'none', fontWeight: 500 }}
            >↗ Open in Tab</a>
            <a
              href={lightbox.url}
              download
              target="_blank"
              rel="noreferrer"
              style={{ color: '#60A5FA', fontSize: 12, textDecoration: 'none', fontWeight: 500 }}
            >⬇ Download</a>
          </div>
        </div>
      </div>
    )}
    </>
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
