import React, { useState, useEffect } from 'react';
import hrService from '../../services/hrService';
import { formatDate, formatCurrency } from '../../utils/formatters';
import { Clock, FileText, User, Download, MapPin, Phone, Mail, CreditCard, Heart, Calendar, Users, Briefcase, DollarSign, Building, Shield } from 'lucide-react';
import styles from './EmployeePortal.module.css';

const LEAVE_TYPES = ['Sick Leave', 'Annual Leave', 'Personal Leave', 'Maternity Leave', 'Other'];

const EmployeePortal = () => {
  const [profile, setProfile] = useState(null);
  const [attendance, setAttendance] = useState(null);
  const [myLeaves, setMyLeaves] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaveForm, setLeaveForm] = useState({ leave_type: 'Sick Leave', start_date: '', end_date: '', reason: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [profRes, attRes, leaveRes, docRes] = await Promise.all([
        hrService.etp.getMyProfile(),
        hrService.etp.getMyAttendancePortal(),
        hrService.etp.getMyLeaves(),
        hrService.etp.getMyDocuments(),
      ]);
      setProfile(profRes?.data || null);
      setAttendance(attRes?.data || null);
      setMyLeaves(leaveRes?.data?.leaves || []);
      setDocuments(docRes?.data?.documents || []);
    } catch (err) {
      console.error('Failed to fetch portal data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmitLeave = async (e) => {
    e.preventDefault();
    if (!profile) return;
    setSubmitting(true);
    try {
      await hrService.etp.createLeave({ ...leaveForm, employee_id: profile.employee_id });
      setShowLeaveModal(false);
      setLeaveForm({ leave_type: 'Sick Leave', start_date: '', end_date: '', reason: '' });
      fetchData();
    } catch (err) {
      alert('Failed to submit leave request');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className={styles.loading}>Loading employee portal...</div>;
  }

  if (!profile) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.pageTitle}>Employee Portal</h1>
          <p className={styles.pageSubtitle}>Self-service portal</p>
        </div>
        <div className={styles.errorState}>
          <p>No employee profile linked to your account. Contact HR to link your profile.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.pageTitle}>Employee Portal</h1>
          <p className={styles.pageSubtitle}>Welcome, {profile.full_name}</p>
        </div>
      </div>

      <div className={styles.profileCard}>
        <div className={styles.profileHeader}>
          <User size={40} />
          <div>
            <h2 className={styles.profileName}>{profile.full_name}</h2>
            <p className={styles.profileMeta}>{profile.position_title || 'Position not set'} · {profile.dept_name || profile.dept_id}</p>
          </div>
        </div>
        <div className={styles.detailsGrid}>
          <div className={styles.detailSection}>
            <h3 className={styles.sectionTitle}><User size={14} /> Personal Info</h3>
            <div className={styles.detailRow}><span className={styles.detailLabel}><Mail size={13} /> Email</span><span>{profile.personal_email}</span></div>
            <div className={styles.detailRow}><span className={styles.detailLabel}><Phone size={13} /> Phone</span><span>{profile.personal_phone || '-'}</span></div>
            <div className={styles.detailRow}><span className={styles.detailLabel}><MapPin size={13} /> Address</span><span>{profile.physical_address || '-'}</span></div>
            <div className={styles.detailRow}><span className={styles.detailLabel}><Calendar size={13} /> DOB</span><span>{profile.date_of_birth ? formatDate(profile.date_of_birth) : '-'}</span></div>
            <div className={styles.detailRow}><span className={styles.detailLabel}><Heart size={13} /> Gender</span><span>{profile.gender || '-'}</span></div>
            <div className={styles.detailRow}><span className={styles.detailLabel}><Users size={13} /> Marital Status</span><span>{profile.marital_status || '-'}</span></div>
            <div className={styles.detailRow}><span className={styles.detailLabel}><CreditCard size={13} /> National ID</span><span>{profile.national_id || '-'}</span></div>
          </div>
          <div className={styles.detailSection}>
            <h3 className={styles.sectionTitle}><Briefcase size={14} /> Employment</h3>
            <div className={styles.detailRow}><span className={styles.detailLabel}>Employee ID</span><span>{profile.employee_id}</span></div>
            <div className={styles.detailRow}><span className={styles.detailLabel}>Department</span><span>{profile.dept_name || profile.dept_id}</span></div>
            <div className={styles.detailRow}><span className={styles.detailLabel}>Position</span><span>{profile.position_title || '-'}</span></div>
            <div className={styles.detailRow}><span className={styles.detailLabel}>Manager</span><span>{profile.manager_name || '-'}</span></div>
            <div className={styles.detailRow}><span className={styles.detailLabel}>Status</span><span>{profile.employment_status}</span></div>
            <div className={styles.detailRow}><span className={styles.detailLabel}>Hire Date</span><span>{profile.hire_date ? formatDate(profile.hire_date) : '-'}</span></div>
            <div className={styles.detailRow}><span className={styles.detailLabel}>Employment Type</span><span>{profile.employment_type || '-'}</span></div>
          </div>
          <div className={styles.detailSection}>
            <h3 className={styles.sectionTitle}><DollarSign size={14} /> Compensation</h3>
            <div className={styles.detailRow}><span className={styles.detailLabel}>Base Salary</span><span>{formatCurrency(profile.base_salary || 0)}</span></div>
            <div className={styles.detailRow}><span className={styles.detailLabel}>Housing Allowance</span><span>{formatCurrency(profile.housing_allowance || 0)}</span></div>
            <div className={styles.detailRow}><span className={styles.detailLabel}>Transport Allowance</span><span>{formatCurrency(profile.transport_allowance || 0)}</span></div>
            <div className={styles.detailRow}><span className={styles.detailLabel}>Communication Allow.</span><span>{formatCurrency(profile.communication_allowance || 0)}</span></div>
          </div>
          <div className={styles.detailSection}>
            <h3 className={styles.sectionTitle}><Building size={14} /> Emergency Contact & Bank</h3>
            <div className={styles.detailRow}><span className={styles.detailLabel}>Name</span><span>{profile.emergency_contact_name || '-'}</span></div>
            <div className={styles.detailRow}><span className={styles.detailLabel}>Phone</span><span>{profile.emergency_contact_phone || '-'}</span></div>
            <div className={styles.detailRow}><span className={styles.detailLabel}>Bank</span><span>{profile.bank_name || '-'}</span></div>
            <div className={styles.detailRow}><span className={styles.detailLabel}>Account</span><span>{profile.bank_account_number ? `****${profile.bank_account_number.slice(-4)}` : '-'}</span></div>
            <div className={styles.detailRow}><span className={styles.detailLabel}>Contract End</span><span>{profile.contract_end_date ? formatDate(profile.contract_end_date) : 'Open'}</span></div>
          </div>
        </div>
      </div>

      <div className={styles.grid}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <Clock size={18} />
            <h2 className={styles.cardTitle}>Today's Attendance</h2>
          </div>
          <div className={styles.attendanceInfo}>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Status</span>
              <span className={styles.infoValue}>{attendance?.attendance_status || 'Not Recorded'}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Work Hours</span>
              <span className={styles.infoValue}>{parseFloat(attendance?.net_work_hours || 0).toFixed(1)}h</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Date</span>
              <span className={styles.infoValue}>{attendance?.attendance_date ? formatDate(attendance.attendance_date) : '-'}</span>
            </div>
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <FileText size={18} />
            <h2 className={styles.cardTitle}>Quick Info</h2>
          </div>
          <div className={styles.attendanceInfo}>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Base Salary</span>
              <span className={styles.infoValue}>{formatCurrency(profile.base_salary || 0)}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Department</span>
              <span className={styles.infoValue}>{profile.dept_name || profile.dept_id}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Employment Type</span>
              <span className={styles.infoValue}>{profile.employment_type || '-'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <FileText size={18} />
          <h2 className={styles.cardTitle}>My Leave Requests</h2>
          <button className={styles.addBtn} onClick={() => setShowLeaveModal(true)}>+ New Request</button>
        </div>
        {myLeaves.length > 0 ? (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Leave Type</th>
                  <th>Start</th>
                  <th>End</th>
                  <th>Days</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {myLeaves.map((lr, idx) => (
                  <tr key={idx}>
                    <td>{lr.leave_type}</td>
                    <td>{formatDate(lr.start_date)}</td>
                    <td>{formatDate(lr.end_date)}</td>
                    <td className={styles.daysCell}>{lr.total_days || '-'}</td>
                    <td><span className={`${styles.statusBadge} ${styles[lr.status?.toLowerCase()]}`}>{lr.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className={styles.emptyText}>No leave requests found.</p>
        )}
      </div>

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <Download size={18} />
          <h2 className={styles.cardTitle}>My Documents</h2>
        </div>
        {documents.length > 0 ? (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Document Name</th>
                  <th>Type</th>
                  <th>Uploaded</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc, idx) => (
                  <tr key={idx}>
                    <td>{doc.doc_name}</td>
                    <td>{doc.doc_type}</td>
                    <td>{doc.upload_date ? formatDate(doc.upload_date) : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className={styles.emptyText}>No documents available.</p>
        )}
      </div>

      {showLeaveModal && (
        <div className={styles.modalOverlay} onClick={() => setShowLeaveModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>New Leave Request</h2>
              <button className={styles.closeBtn} onClick={() => setShowLeaveModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmitLeave}>
              <div className={styles.modalBody}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Leave Type</label>
                  <select className={styles.formInput} value={leaveForm.leave_type} onChange={e => setLeaveForm({ ...leaveForm, leave_type: e.target.value })}>
                    {LEAVE_TYPES.map(lt => <option key={lt} value={lt}>{lt}</option>)}
                  </select>
                </div>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Start Date</label>
                    <input type="date" className={styles.formInput} value={leaveForm.start_date} onChange={e => setLeaveForm({ ...leaveForm, start_date: e.target.value })} required />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>End Date</label>
                    <input type="date" className={styles.formInput} value={leaveForm.end_date} onChange={e => setLeaveForm({ ...leaveForm, end_date: e.target.value })} required />
                  </div>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Reason</label>
                  <textarea className={styles.formInput} rows={3} value={leaveForm.reason} onChange={e => setLeaveForm({ ...leaveForm, reason: e.target.value })} required />
                </div>
              </div>
              <div className={styles.modalActions}>
                <button type="button" className={styles.cancelBtn} onClick={() => setShowLeaveModal(false)}>Cancel</button>
                <button type="submit" className={styles.submitBtn} disabled={submitting}>{submitting ? 'Submitting...' : 'Submit Request'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeePortal;
