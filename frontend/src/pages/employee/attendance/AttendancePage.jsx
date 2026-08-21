import React, { useState, useEffect } from 'react';
import { employeePortalState, SESSION_EMPLOYEE_ID } from '../../../utils/employeePortalState';
import { Clock, Play, Square, Coffee, CheckCircle, AlertTriangle, CalendarDays } from 'lucide-react';
import { playSound } from '../../../services/notificationManager';

const PageHeader = ({ title, description }) => (
  <div style={{ marginBottom: '24px' }}>
    <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', margin: '0 0 8px 0' }}>{title}</h1>
    <p style={{ color: '#64748b', margin: 0 }}>{description}</p>
  </div>
);

export const AttendancePage = () => {
  const [record, setRecord] = useState(null);
  const [history, setHistory] = useState([]);
  const [balances, setBalances] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [time, setTime] = useState(new Date().toLocaleTimeString());
  
  const [leaveForm, setLeaveForm] = useState({
    leave_type: 'annual',
    start_date: '',
    end_date: '',
    reason: ''
  });

  const fetchState = () => {
    const today = new Date().toISOString().split('T')[0];
    setRecord(employeePortalState.getAttendanceRecord(SESSION_EMPLOYEE_ID, today));
    setHistory(employeePortalState.getAllAttendance(SESSION_EMPLOYEE_ID));
    setBalances(employeePortalState.getLeaveBalances(SESSION_EMPLOYEE_ID));
    setLeaveRequests(employeePortalState.getLeaveRequests(SESSION_EMPLOYEE_ID));
  };

  useEffect(() => {
    fetchState();
    const interval = setInterval(() => setTime(new Date().toLocaleTimeString()), 1000);
    const unsub = employeePortalState.subscribe(fetchState);
    return () => {
      clearInterval(interval);
      unsub();
    };
  }, []);

  const handleCheckIn = () => {
    try { employeePortalState.checkIn(SESSION_EMPLOYEE_ID); playSound('success'); }
    catch (e) { playSound('error'); alert(e.message); }
  };
  
  const handleCheckOut = () => {
    try { employeePortalState.checkOut(SESSION_EMPLOYEE_ID); playSound('closed'); }
    catch (e) { playSound('error'); alert(e.message); }
  };

  const handleBreak = () => {
    try {
      const openBreak = record?.breaks.find(b => !b.end_at);
      if (openBreak) employeePortalState.endBreak(SESSION_EMPLOYEE_ID);
      else employeePortalState.startBreak(SESSION_EMPLOYEE_ID);
      playSound('info');
    } catch (e) { playSound('error'); alert(e.message); }
  };

  const submitLeave = (e) => {
    e.preventDefault();
    try {
      employeePortalState.requestLeave(SESSION_EMPLOYEE_ID, leaveForm);
      playSound('request');
      setLeaveForm({ leave_type: 'annual', start_date: '', end_date: '', reason: '' });
    } catch(e) { playSound('error'); alert(e.message); }
  };

  const isCheckedIn = record?.check_in_at && !record?.check_out_at;
  const isCheckedOut = record?.check_out_at;
  const openBreak = record?.breaks.find(b => !b.end_at);

  return (
    <div style={{ padding: '24px', backgroundColor: '#f8fafc', minHeight: 'calc(100vh - 64px)' }}>
      <PageHeader title="Attendance & Leave" description="Manage your daily check-ins and leave requests." />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
        
        {/* Check In Panel */}
        <div style={{ backgroundColor: 'white', padding: '32px', borderRadius: '12px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
          <h2 style={{ fontSize: '32px', fontWeight: '800', color: '#0f172a', margin: '0 0 24px', fontFamily: 'monospace' }}>{time}</h2>
          
          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginBottom: '24px' }}>
            {!isCheckedIn && !isCheckedOut && (
              <button onClick={handleCheckIn} style={{ padding: '12px 24px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <Play size={20} /> Check In
              </button>
            )}
            
            {isCheckedIn && (
              <>
                <button onClick={handleBreak} style={{ padding: '12px 24px', backgroundColor: openBreak ? '#f59e0b' : '#f8fafc', color: openBreak ? 'white' : '#0f172a', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: '700', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <Coffee size={20} /> {openBreak ? 'End Break' : 'Start Break'}
                </button>
                <button onClick={handleCheckOut} style={{ padding: '12px 24px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <Square size={20} /> Check Out
                </button>
              </>
            )}
            
            {isCheckedOut && (
              <div style={{ padding: '12px 24px', backgroundColor: '#f1f5f9', color: '#475569', borderRadius: '8px', fontWeight: '700', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle size={20} /> Checked out for today
              </div>
            )}
          </div>

          <div style={{ fontSize: '14px', color: '#64748b' }}>
            {record?.check_in_at && <div>Checked in at: {new Date(record.check_in_at).toLocaleTimeString()}</div>}
            {record?.check_out_at && <div>Checked out at: {new Date(record.check_out_at).toLocaleTimeString()}</div>}
          </div>
        </div>

        {/* Leave Balances & Form */}
        <div style={{ backgroundColor: 'white', padding: '32px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CalendarDays size={18} /> Leave Balances
          </h3>
          <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
            {balances.map(b => (
              <div key={b.leave_type} style={{ flex: 1, backgroundColor: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                <div style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', fontWeight: '700', marginBottom: '4px' }}>{b.leave_type}</div>
                <div style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>{b.days_allocated - b.days_used} <span style={{ fontSize: '12px', fontWeight: '600', color: '#64748b' }}>left</span></div>
              </div>
            ))}
          </div>

          <form onSubmit={submitLeave} style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '16px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
            <h4 style={{ margin: '0 0 8px', fontSize: '14px', color: '#0f172a' }}>Request Leave</h4>
            <select required value={leaveForm.leave_type} onChange={e => setLeaveForm({...leaveForm, leave_type: e.target.value})} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
              <option value="annual">Annual Leave</option>
              <option value="sick">Sick Leave</option>
              <option value="emergency">Emergency</option>
            </select>
            <div style={{ display: 'flex', gap: '12px' }}>
              <input type="date" required value={leaveForm.start_date} onChange={e => setLeaveForm({...leaveForm, start_date: e.target.value})} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
              <input type="date" required value={leaveForm.end_date} onChange={e => setLeaveForm({...leaveForm, end_date: e.target.value})} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
            </div>
            <input type="text" required placeholder="Reason" value={leaveForm.reason} onChange={e => setLeaveForm({...leaveForm, reason: e.target.value})} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
            <button type="submit" style={{ padding: '8px', backgroundColor: '#0f172a', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}>Submit Request</button>
          </form>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <h3 style={{ padding: '16px 24px', margin: 0, borderBottom: '1px solid #f1f5f9', fontSize: '16px', fontWeight: '700' }}>Attendance History</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', color: '#64748b' }}>
                <th style={{ padding: '12px 24px' }}>Date</th>
                <th>Status</th>
                <th>Check In</th>
              </tr>
            </thead>
            <tbody>
              {history.map(h => (
                <tr key={h.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px 24px' }}>{h.date}</td>
                  <td>
                    <span style={{ 
                      padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase',
                      backgroundColor: h.status === 'present' ? '#ecfdf5' : (h.status === 'absent' ? '#fef2f2' : '#f8fafc'),
                      color: h.status === 'present' ? '#10b981' : (h.status === 'absent' ? '#ef4444' : '#64748b')
                    }}>
                      {h.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td>{h.check_in_at ? new Date(h.check_in_at).toLocaleTimeString() : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <h3 style={{ padding: '16px 24px', margin: 0, borderBottom: '1px solid #f1f5f9', fontSize: '16px', fontWeight: '700' }}>Leave Requests</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', color: '#64748b' }}>
                <th style={{ padding: '12px 24px' }}>Type</th>
                <th>Dates</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {leaveRequests.map(r => (
                <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px 24px', textTransform: 'capitalize' }}>{r.leave_type}</td>
                  <td>{r.start_date} to {r.end_date}</td>
                  <td>
                    <span style={{ 
                      padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase',
                      backgroundColor: r.status === 'approved' ? '#ecfdf5' : (r.status === 'rejected' ? '#fef2f2' : '#fffbeb'),
                      color: r.status === 'approved' ? '#10b981' : (r.status === 'rejected' ? '#ef4444' : '#d97706')
                    }}>
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
