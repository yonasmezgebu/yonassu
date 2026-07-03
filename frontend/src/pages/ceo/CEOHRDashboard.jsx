import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, UserPlus, Clock, CheckCircle, AlertTriangle, 
  Calendar, FileText, Download, TrendingUp, DollarSign,
  Monitor, Shield, Mail, Bell
} from 'lucide-react';
import apiClient from '../../services/apiClient';
import { formatCurrency } from '../../utils/formatters';
import styles from './CEOHRDashboard.module.css';

const CEOHRDashboard = () => {
  const [activeTab, setActiveTab] = useState('attendance');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [payroll, setPayroll] = useState(null);
  const [calculating, setCalculating] = useState(false);
  const [approving, setApproving] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]);
  const [tick, setTick] = useState(0);
  const clockRef = useRef({});    // stable baseline timestamps per employee
  const maxDurRef = useRef({});   // highest duration shown per employee (prevents rollback)
  const dayRef = useRef(new Date().toDateString());
  useEffect(() => {
    const iv = setInterval(() => {
      const today = new Date().toDateString();
      if (dayRef.current !== today) {
        clockRef.current = {};
        maxDurRef.current = {};
        dayRef.current = today;
      }
      setTick(t => t+1);
    }, 1000);
    return () => clearInterval(iv);
  }, []);
  const [formData, setFormData] = useState({
    full_name: '',
    national_id: '',
    gender: 'Male',
    dept_id: '',
    position_id: '',
    base_salary: '',
    housing_allowance: '',
    transport_allowance: '',
    has_pc_access: 'No',
    shift_start_time: '08:00',
    shift_end_time: '17:00',
    phone: '',
    document: ''
  });

  useEffect(() => {
    fetchFormOptions();
    fetchAttendance();
  }, []);

  useEffect(() => {
    if (activeTab === 'employees') fetchEmployees();
    if (activeTab === 'attendance') fetchAttendance();
    if (activeTab === 'payroll') fetchPayroll();
    if (activeTab === 'notifications') fetchNotifications();
  }, [activeTab]);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/hr/etp/employees');
      setEmployees(res?.data || res || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/hr/etp/attendance/daily');
      const body = res?.data?.data || res?.data || res || {};
      setAttendance(body);
      // update clockRef baseline for any new employees not yet cached
      const empList = body?.employees || body?.data?.employees || [];
      empList.forEach(emp => {
        if (!clockRef.current[emp.employee_id] && (emp.clock_in || emp.last_seen))
          clockRef.current[emp.employee_id] = emp.clock_in || emp.last_seen;
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprovePayroll = async () => {
    try {
      setApproving(true);
      const m = payroll?.company?.month_number || new Date().getMonth() + 1;
      const y = payroll?.company?.year_number || new Date().getFullYear();
      await apiClient.post('/hr/etp/payroll/approve', { month: m, year: y, action: 'approve' });
      fetchPayroll();
    } catch (e) {
      alert(e.message || 'Failed to approve payroll');
    } finally {
      setApproving(false);
    }
  };

  const fetchPayroll = async () => {
    try {
      setLoading(true);
      const today = new Date();
      const m = today.getMonth() + 1;
      const y = today.getFullYear();
      // Try ETP payroll summary first
      try {
        const res = await apiClient.get(`/hr/etp/payroll/summary/${m}/${y}`);
        const body = res?.data?.data || res?.data || res || null;
        if (body && body.company) setPayroll(body); else setPayroll(null);
      } catch {
        // Fallback: old payroll endpoint
        const monthStr = `${y}-${String(m).padStart(2,'0')}`;
        const res2 = await apiClient.get(`/hr/payroll/${monthStr}`);
        const p = res2.data?.data?.payroll;
        if (p) {
          setPayroll({
            company: {
              company_gross_pay: p.total_gross || 0,
              company_net_pay: p.total_net || 0,
              total_deductions: (p.total_gross || 0) - (p.total_net || 0),
              approval_status: p.status || 'Draft',
              total_employees: p.employee_count || 0,
            },
            departments: [],
          });
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/hr/etp/notifications');
      setNotifications(res?.data?.data || res?.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFormOptions = async () => {
    try {
      const [deptRes, posRes] = await Promise.all([
        apiClient.get('/hr/etp/departments'),
        apiClient.get('/hr/etp/positions')
      ]);
      setDepartments(deptRes.data?.data || deptRes.data || []);
      setPositions(posRes.data?.data || posRes.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    try {
      await apiClient.post('/hr/etp/employees', formData);
      setShowAddModal(false);
      if (activeTab === 'employees') fetchEmployees();
    } catch (err) {
      alert('Error adding employee');
      console.error(err);
    }
  };

  const handleEditClick = (emp) => {
    setEditFormData({ ...emp });
    setShowEditModal(true);
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEditEmployee = async (e) => {
    e.preventDefault();
    try {
      await apiClient.put(`/hr/etp/employees/${editFormData.employee_id}`, editFormData);
      setShowEditModal(false);
      setEditFormData({});
      fetchEmployees();
    } catch (err) {
      alert('Error updating employee');
      console.error(err);
    }
  };

  const handleDeleteClick = (emp) => {
    setDeleteConfirm(emp);
  };

  const handleDeleteEmployee = async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    try {
      await apiClient.delete(`/hr/etp/employees/${deleteConfirm.employee_id}`);
      setDeleteConfirm(null);
      fetchEmployees();
    } catch (err) {
      alert('Error deleting employee');
      console.error(err);
    } finally {
      setDeleting(false);
    }
  };

  const renderTabs = () => (
    <div className={styles.tabContainer}>
      <button className={`${styles.tab} ${activeTab === 'attendance' ? styles.activeTab : ''}`} onClick={() => setActiveTab('attendance')}>
        <Clock size={18} /> Live Attendance
      </button>
      <button className={`${styles.tab} ${activeTab === 'employees' ? styles.activeTab : ''}`} onClick={() => setActiveTab('employees')}>
        <Users size={18} /> Directory
      </button>
      <button className={`${styles.tab} ${activeTab === 'payroll' ? styles.activeTab : ''}`} onClick={() => setActiveTab('payroll')}>
        <DollarSign size={18} /> Payroll
      </button>
      <button className={`${styles.tab} ${activeTab === 'notifications' ? styles.activeTab : ''}`} onClick={() => setActiveTab('notifications')}>
        <Bell size={18} /> Alerts
      </button>
    </div>
  );


  const renderEmployees = () => (
    <div className={styles.tabContent}>
      <div className={styles.actionRow}>
        <h3>Employee Directory</h3>
        <button className={styles.btnPrimary} onClick={() => setShowAddModal(true)}>
          <UserPlus size={16} /> Add Employee
        </button>
      </div>
      <div className={styles.tableWrapper}>
        <table className={styles.dataTable}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Department</th>
              <th>Position</th>
              <th>Status</th>
              <th>PC Access</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {employees.map(emp => (
              <tr key={emp.employee_id}>
                <td>{emp.employee_id}</td>
                <td><strong>{emp.full_name}</strong></td>
                <td>{emp.dept_name || emp.dept_id}</td>
                <td>{emp.position_title || emp.position_id}</td>
                <td><span className={`${styles.statusBadge} ${styles[emp.employment_status.toLowerCase()]}`}>{emp.employment_status}</span></td>
                <td>{emp.has_pc_access}</td>
                <td>
                  <button className={styles.btnIcon} title="Edit" onClick={() => handleEditClick(emp)}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </button>
                  <button className={styles.btnIcon} style={{color:'#ef4444'}} title="Terminate" onClick={() => handleDeleteClick(emp)}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderAttendance = () => {
    const empList = attendance?.employees || attendance?.data?.employees || [];
    const summary = attendance?.summary || attendance?.data?.summary || {};
    const date = attendance?.date || attendance?.data?.date || new Date().toISOString().split('T')[0];
    const calcDuration = (emp) => {
      const nowMs = Date.now();
      let totalSec = 0;
      if (Number(emp.net_work_hours)) totalSec += Number(emp.net_work_hours) * 3600;
      if ((emp.online_status||'') === 'Online') {
        if (emp.clock_in) {
          const [h1, m1] = emp.clock_in.split(':').map(Number);
          const ci = new Date(); ci.setHours(h1, m1, 0, 0);
          if (ci.getTime() < nowMs) totalSec = Math.max(totalSec, (nowMs - ci.getTime()) / 1000);
        } else if (emp.last_seen) {
          const eid = emp.employee_id;
          if (!clockRef.current[eid]) clockRef.current[eid] = emp.last_seen;
          const refTime = new Date(clockRef.current[eid]).getTime();
          if (refTime < nowMs) totalSec += (nowMs - refTime) / 1000;
        }
      }
      // Never show less than the highest value computed this day for this employee
      const eid = emp.employee_id;
      if (maxDurRef.current[eid] !== undefined) totalSec = Math.max(totalSec, maxDurRef.current[eid]);
      maxDurRef.current[eid] = totalSec;
      if (totalSec <= 0) return '00:00:00';
      const hrs = Math.floor(totalSec / 3600);
      const mins = Math.floor((totalSec % 3600) / 60);
      const secs = Math.floor(totalSec % 60);
      return `${String(hrs).padStart(2,'0')}:${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}`;
    };
    return (
      <div className={styles.tabContent}>
        <div className={styles.actionRow}>
          <h3>Real-time Attendance Monitor ({date})</h3>
          <div className={styles.statsRow}>
            <span className={styles.liveDot} style={{background:'#22c55e'}}/> Online: {summary?.online || 0}
            <span className={styles.liveDot} style={{background:'#eab308'}}/> Idle: {summary?.idle || 0}
            <span className={styles.liveDot} style={{background:'#ef4444'}}/> Offline: {summary?.offline || 0}
          </div>
        </div>
        <div className={styles.tableWrapper}>
          <table className={styles.dataTable}>
            <thead>
              <tr>
                <th>Date</th>
                <th>Employee</th>
                <th>Phone</th>
                <th>Department</th>
                <th>Duration</th>
                <th>Shift</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {empList.length === 0 ? (
                <tr><td colSpan={7} style={{textAlign:'center',padding:20,color:'#94a3b8'}}>No attendance data for today.</td></tr>
              ) : empList.map(emp => {
                const os = emp.online_status || 'Offline';
                const dur = calcDuration(emp);
                return (
                <tr key={emp.employee_id}>
                  <td style={{fontSize:12,color:'#64748b'}}>{date}</td>
                  <td><strong>{emp.full_name}</strong></td>
                  <td style={{fontSize:12,color:'#64748b'}}>{emp.phone || '-'}</td>
                  <td style={{fontWeight:600,color:'#1e293b'}}>{emp.dept_name || '-'}</td>
                  <td style={{fontWeight:700,color:'#0f172a'}}>{dur}</td>
                  <td style={{fontSize:12}}>{emp.shift_start_time || ''}-{emp.shift_end_time || ''}</td>
                  <td style={{textAlign:'center'}}>
                    <span style={{display:'inline-block',width:10,height:10,borderRadius:'50%',background:os==='Online'?'#22c55e':'#ef4444',marginRight:4,verticalAlign:'middle'}}/>
                    <span style={{fontWeight:700,fontSize:'0.85rem',textTransform:'capitalize',color:os==='Online'?'#22c55e':'#ef4444',verticalAlign:'middle'}}>{os.toLowerCase()}</span>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderPayroll = () => {
    if (!payroll) return (
      <div className={styles.tabContent}>
        <div className={styles.emptyState}>
          <FileText size={48} />
          <p>No payroll generated for this month yet.</p>
          <button className={styles.btnSecondary} disabled={calculating} onClick={async () => {
            setCalculating(true);
            try { await apiClient.post('/hr/etp/payroll/calculate', { month: new Date().getMonth()+1, year: new Date().getFullYear() }); fetchPayroll(); } catch(e) { alert('Payroll calculation failed'); }
            setCalculating(false);
          }}>{calculating ? 'Calculating...' : 'Calculate Now'}</button>
        </div>
      </div>
    );
    return (
      <div className={styles.tabContent}>
        <div className={styles.actionRow}>
          <h3>Payroll Summary</h3>
          {payroll?.company?.approval_status === 'Approved' || payroll?.company?.approval_status === 'Paid' ? (
            <span style={{background:'#d1fae5',color:'#065f46',padding:'6px 16px',borderRadius:6,fontWeight:600,fontSize:14,display:'inline-flex',alignItems:'center',gap:6}}>
              <CheckCircle size={16} /> {payroll.company.approval_status === 'Paid' ? 'Paid' : 'Approved'}
            </span>
          ) : (
            <button className={styles.btnPrimary} disabled={approving} onClick={handleApprovePayroll}><CheckCircle size={16} /> {approving ? 'Approving...' : 'Approve Payroll'}</button>
          )}
        </div>
        
        {payroll.company ? (
          <>
            <div className={styles.kpiGrid}>
              <div className={styles.kpiCard}>
                <div className={styles.kpiInfo}>
                  <p>Total Gross Pay</p>
                  <h3>{formatCurrency(payroll.company.company_gross_pay)}</h3>
                </div>
              </div>
              <div className={styles.kpiCard}>
                <div className={styles.kpiInfo}>
                  <p>Total Deductions</p>
                  <h3>{formatCurrency(payroll.company.total_deductions)}</h3>
                </div>
              </div>
              <div className={styles.kpiCard}>
                <div className={styles.kpiInfo}>
                  <p>Net Pay</p>
                  <h3 style={{color: '#0ea5e9'}}>{formatCurrency(payroll.company.company_net_pay)}</h3>
                </div>
              </div>
              <div className={styles.kpiCard}>
                <div className={styles.kpiInfo}>
                  <p>Status</p>
                  <h3>{payroll.company.approval_status}</h3>
                </div>
              </div>
            </div>

            <div className={styles.tableWrapper}>
              <table className={styles.dataTable}>
                <thead>
                  <tr>
                    <th>Department</th>
                    <th>Employees</th>
                    <th>Total Gross</th>
                    <th>Total Deductions</th>
                    <th>Total Net</th>
                  </tr>
                </thead>
                <tbody>
                  {payroll.departments?.map(d => (
                    <tr key={d.dept_id}>
                      <td><strong>{d.dept_name || d.dept_id}</strong></td>
                      <td>{d.employee_count}</td>
                      <td>{formatCurrency(d.total_gross_pay)}</td>
                      <td>{formatCurrency(d.total_deductions)}</td>
                      <td>{formatCurrency(d.total_net_pay)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className={styles.emptyState}>
            <FileText size={48} />
            <p>No payroll generated for this month yet.</p>
            <button className={styles.btnSecondary} disabled={calculating} onClick={async () => {
              setCalculating(true);
              try { await apiClient.post('/hr/etp/payroll/calculate', { month: new Date().getMonth()+1, year: new Date().getFullYear() }); fetchPayroll(); } catch(e) { alert('Payroll calculation failed'); }
              setCalculating(false);
            }}>{calculating ? 'Calculating...' : 'Calculate Now'}</button>
          </div>
        )}
      </div>
    );
  };

  const renderNotifications = () => (
    <div className={styles.tabContent}>
      <h3>HR Alert History</h3>
      <div className={styles.tableWrapper}>
        <table className={styles.dataTable}>
          <thead>
            <tr>
              <th>Date</th>
              <th>Priority</th>
              <th>Message</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {notifications.map(n => (
              <tr key={n.notification_id}>
                <td>{new Date(n.sent_date).toLocaleString()}</td>
                <td><span className={`${styles.statusBadge} ${styles[n.priority.toLowerCase()]}`}>{n.priority}</span></td>
                <td>{n.notification_message}</td>
                <td>{n.status}</td>
                <td>
                  {n.status === 'Pending' && (
                    <button className={styles.btnSmall} onClick={async () => {
                      await apiClient.patch(`/hr/etp/notifications/${n.notification_id}`);
                      fetchNotifications();
                    }}>Acknowledge</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  if (loading) return <div className={styles.loading}>Loading HR data...</div>;
  if (error) return <div className={styles.error}>{error}</div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Enterprise HR System</h1>
          <p className={styles.subtitle}>Comprehensive Workforce Management</p>
        </div>
      </div>
      
      {renderTabs()}

      <div className={styles.mainContent}>
        {loading ? (
          <div className={styles.loading}>Loading HR Data...</div>
        ) : (
          <>
            {activeTab === 'employees' && renderEmployees()}
            {activeTab === 'attendance' && renderAttendance()}
            {activeTab === 'payroll' && renderPayroll()}
            {activeTab === 'notifications' && renderNotifications()}
          </>
        )}
      </div>

      {showAddModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3>Add New Employee</h3>
              <button onClick={() => setShowAddModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleAddEmployee}>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label>Full Name</label>
                  <input required type="text" name="full_name" value={formData.full_name} onChange={handleInputChange} />
                </div>
                <div className={styles.formGroup}>
                  <label>National ID</label>
                  <input type="text" name="national_id" value={formData.national_id} onChange={handleInputChange} />
                </div>
                <div className={styles.formGroup}>
                  <label>Phone Number</label>
                  <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} />
                </div>
                <div className={styles.formGroup}>
                  <label>Employee Document / Link</label>
                  <input type="text" name="document" placeholder="Document URL or Reference" value={formData.document} onChange={handleInputChange} />
                </div>
                <div className={styles.formGroup}>
                  <label>Gender</label>
                  <select name="gender" value={formData.gender} onChange={handleInputChange}>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>Department</label>
                  <select required name="dept_id" value={formData.dept_id} onChange={handleInputChange}>
                    <option value="">Select Department</option>
                    {departments.map(d => <option key={d.dept_id} value={d.dept_id}>{d.dept_name}</option>)}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>Position</label>
                  <select required name="position_id" value={formData.position_id} onChange={handleInputChange}>
                    <option value="">Select Position</option>
                    {positions.map(p => <option key={p.position_id} value={p.position_id}>{p.position_title}</option>)}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>Base Salary (ETB)</label>
                  <input required type="number" min="0" name="base_salary" value={formData.base_salary} onChange={handleInputChange} />
                </div>
                <div className={styles.formGroup}>
                  <label>Housing Allowance</label>
                  <input type="number" min="0" name="housing_allowance" value={formData.housing_allowance} onChange={handleInputChange} />
                </div>
                <div className={styles.formGroup}>
                  <label>Transport Allowance</label>
                  <input type="number" min="0" name="transport_allowance" value={formData.transport_allowance} onChange={handleInputChange} />
                </div>
                <div className={styles.formGroup}>
                  <label>Has PC Access</label>
                  <select name="has_pc_access" value={formData.has_pc_access} onChange={handleInputChange}>
                    <option value="No">No (Manual Entry)</option>
                    <option value="Yes">Yes (PC Tracker)</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>Shift Start Time</label>
                  <input type="time" name="shift_start_time" value={formData.shift_start_time} onChange={handleInputChange} />
                </div>
                <div className={styles.formGroup}>
                  <label>Shift End Time</label>
                  <input type="time" name="shift_end_time" value={formData.shift_end_time} onChange={handleInputChange} />
                </div>
              </div>
              <div className={styles.modalActions}>
                <button type="button" className={styles.btnSecondary} onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className={styles.btnPrimary}>Save Employee</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3>Edit Employee</h3>
              <button onClick={() => { setShowEditModal(false); setEditFormData({}); }}>&times;</button>
            </div>
            <form onSubmit={handleEditEmployee}>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label>Full Name</label>
                  <input required type="text" name="full_name" value={editFormData.full_name || ''} onChange={handleEditInputChange} />
                </div>
                <div className={styles.formGroup}>
                  <label>National ID</label>
                  <input type="text" name="national_id" value={editFormData.national_id || ''} onChange={handleEditInputChange} />
                </div>
                <div className={styles.formGroup}>
                  <label>Phone Number</label>
                  <input type="tel" name="phone" value={editFormData.phone || ''} onChange={handleEditInputChange} />
                </div>
                <div className={styles.formGroup}>
                  <label>Employee Document / Link</label>
                  <input type="text" name="document" placeholder="Document URL or Reference" value={editFormData.document || ''} onChange={handleEditInputChange} />
                </div>
                <div className={styles.formGroup}>
                  <label>Gender</label>
                  <select name="gender" value={editFormData.gender || 'Male'} onChange={handleEditInputChange}>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>Department</label>
                  <select required name="dept_id" value={editFormData.dept_id || ''} onChange={handleEditInputChange}>
                    <option value="">Select Department</option>
                    {departments.map(d => <option key={d.dept_id} value={d.dept_id}>{d.dept_name}</option>)}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>Position</label>
                  <select required name="position_id" value={editFormData.position_id || ''} onChange={handleEditInputChange}>
                    <option value="">Select Position</option>
                    {positions.map(p => <option key={p.position_id} value={p.position_id}>{p.position_title}</option>)}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>Base Salary (ETB)</label>
                  <input required type="number" min="0" name="base_salary" value={editFormData.base_salary || ''} onChange={handleEditInputChange} />
                </div>
                <div className={styles.formGroup}>
                  <label>Housing Allowance</label>
                  <input type="number" min="0" name="housing_allowance" value={editFormData.housing_allowance || ''} onChange={handleEditInputChange} />
                </div>
                <div className={styles.formGroup}>
                  <label>Transport Allowance</label>
                  <input type="number" min="0" name="transport_allowance" value={editFormData.transport_allowance || ''} onChange={handleEditInputChange} />
                </div>
                <div className={styles.formGroup}>
                  <label>Has PC Access</label>
                  <select name="has_pc_access" value={editFormData.has_pc_access || 'No'} onChange={handleEditInputChange}>
                    <option value="No">No (Manual Entry)</option>
                    <option value="Yes">Yes (PC Tracker)</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>Shift Start Time</label>
                  <input type="time" name="shift_start_time" value={editFormData.shift_start_time || ''} onChange={handleEditInputChange} />
                </div>
                <div className={styles.formGroup}>
                  <label>Shift End Time</label>
                  <input type="time" name="shift_end_time" value={editFormData.shift_end_time || ''} onChange={handleEditInputChange} />
                </div>
              </div>
              <div className={styles.modalActions}>
                <button type="button" className={styles.btnSecondary} onClick={() => { setShowEditModal(false); setEditFormData({}); }}>Cancel</button>
                <button type="submit" className={styles.btnPrimary}>Update Employee</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent} style={{maxWidth:420}}>
            <div className={styles.modalHeader}>
              <h3>Confirm Termination</h3>
              <button onClick={() => setDeleteConfirm(null)} disabled={deleting}>&times;</button>
            </div>
            <p style={{padding:'16px 0',color:'#475569'}}>
              Are you sure you want to terminate <strong>{deleteConfirm.full_name}</strong> ({deleteConfirm.employee_id})? This will set their status to "Terminated".
            </p>
            <div className={styles.modalActions}>
              <button type="button" className={styles.btnSecondary} onClick={() => setDeleteConfirm(null)} disabled={deleting}>Cancel</button>
              <button type="button" className={styles.btnPrimary} style={{background:'#ef4444'}} onClick={handleDeleteEmployee} disabled={deleting}>
                {deleting ? 'Terminating...' : 'Terminate Employee'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CEOHRDashboard;
