import React, { useState } from 'react';
import { Calendar, Download, CheckCircle, XCircle, Clock, ArrowLeftRight } from 'lucide-react';
import { submitNotification } from '../../utils/pharmacyNotifications';

const PharmacyAttendance = () => {
  const [activeTab, setActiveTab] = useState('daily');
  const [selectedDate, setSelectedDate] = useState('2026-07-01');

  const [attendance, setAttendance] = useState([
    { id: 1, staff: 'Abebe Kebede', branch: 'Branch A', shiftStart: '08:00', shiftEnd: '17:00', arrivalTime: '07:55', departureTime: '', status: 'Present' },
    { id: 2, staff: 'Helen Tadesse', branch: 'Branch B', shiftStart: '09:00', shiftEnd: '18:00', arrivalTime: '09:15', departureTime: '', status: 'Late' },
    { id: 3, staff: 'Samuel Belay', branch: 'Branch A', shiftStart: '08:00', shiftEnd: '17:00', arrivalTime: '', departureTime: '', status: 'Absent' },
  ]);

  const handleMarkStatus = (id, newStatus, isLate = false) => {
    setAttendance(attendance.map(a => {
      if (a.id === id) {
        return { 
          ...a, 
          status: newStatus, 
          arrivalTime: newStatus === 'Absent' ? '' : (isLate ? '09:15' : '07:55') 
        };
      }
      return a;
    }));
    submitNotification('Attendance Marked', `Staff marked as ${newStatus}`);
  };

  const handleExport = () => {
    // Silent export — no sound
    console.log('Exporting attendance report...');
  };

  return (
    <div style={{ padding: 24, fontFamily: "'Inter', sans-serif" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 'bold', color: '#1e293b', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Calendar size={24} color="#0284c7" /> ATTENDANCE
          </h2>
          <p style={{ color: '#64748b', margin: 0 }}>🔗 Manage Staff Attendance</p>
        </div>
        <button onClick={handleExport} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#1e293b', color: 'white', padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer' }}>
          <Download size={18} /> Export Report
        </button>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 24, borderBottom: '1px solid #e2e8f0', paddingBottom: 12 }}>
        <button onClick={() => setActiveTab('daily')} style={{ padding: '8px 16px', border: 'none', background: activeTab === 'daily' ? '#0284c7' : 'transparent', color: activeTab === 'daily' ? 'white' : '#64748b', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}>Daily Marking</button>
        <button onClick={() => setActiveTab('weekly')} style={{ padding: '8px 16px', border: 'none', background: activeTab === 'weekly' ? '#0284c7' : 'transparent', color: activeTab === 'weekly' ? 'white' : '#64748b', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}>Weekly Report</button>
        <button onClick={() => setActiveTab('monthly')} style={{ padding: '8px 16px', border: 'none', background: activeTab === 'monthly' ? '#0284c7' : 'transparent', color: activeTab === 'monthly' ? 'white' : '#64748b', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}>Monthly Report</button>
      </div>

      {activeTab === 'daily' && (
        <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, alignItems: 'center' }}>
            <h3 style={{ margin: 0 }}>Date: <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} style={{ padding: 8, borderRadius: 6, border: '1px solid #cbd5e1', marginLeft: 8 }} /></h3>
            <div style={{ fontSize: 14, color: '#64748b' }}>Late Threshold: 15 mins</div>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <tr>
                <th style={{ padding: 12, color: '#475569' }}>Staff Member</th>
                <th style={{ padding: 12, color: '#475569' }}>Scheduled Shift</th>
                <th style={{ padding: 12, color: '#475569' }}>Actual Arrival</th>
                <th style={{ padding: 12, color: '#475569' }}>Current Status</th>
                <th style={{ padding: 12, color: '#475569', textAlign: 'right' }}>Marking Actions</th>
              </tr>
            </thead>
            <tbody>
              {attendance.map(a => (
                <tr key={a.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: 12, fontWeight: 'bold' }}>{a.staff} <div style={{ fontSize: 12, color: '#64748b', fontWeight: 'normal' }}>{a.branch}</div></td>
                  <td style={{ padding: 12 }}>{a.shiftStart} - {a.shiftEnd}</td>
                  <td style={{ padding: 12, color: a.status === 'Late' ? '#ef4444' : 'inherit', fontWeight: a.status === 'Late' ? 'bold' : 'normal' }}>
                    {a.arrivalTime || '--:--'}
                  </td>
                  <td style={{ padding: 12 }}>
                    <span style={{ 
                      padding: '4px 8px', borderRadius: 4, fontSize: 12, fontWeight: 'bold',
                      background: a.status === 'Present' ? '#dcfce7' : a.status === 'Late' ? '#fef08a' : '#fee2e2', 
                      color: a.status === 'Present' ? '#166534' : a.status === 'Late' ? '#854d0e' : '#991b1b' 
                    }}>
                      {a.status}
                    </span>
                  </td>
                  <td style={{ padding: 12, textAlign: 'right', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <button onClick={() => handleMarkStatus(a.id, 'Present')} style={{ padding: '6px 12px', background: '#10b981', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <CheckCircle size={16} /> Present
                    </button>
                    <button onClick={() => handleMarkStatus(a.id, 'Late', true)} style={{ padding: '6px 12px', background: '#eab308', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Clock size={16} /> Late
                    </button>
                    <button onClick={() => handleMarkStatus(a.id, 'Absent')} style={{ padding: '6px 12px', background: '#ef4444', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <XCircle size={16} /> Absent
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {(activeTab === 'weekly' || activeTab === 'monthly') && (
        <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', padding: 24, textAlign: 'center', color: '#64748b' }}>
          <Calendar size={48} style={{ margin: '0 auto 16px', color: '#cbd5e1' }} />
          <h3>Historical Report View</h3>
          <p>This view displays a grid of all staff across the selected {activeTab} period.</p>
        </div>
      )}
    </div>
  );
};

export default PharmacyAttendance;
