import React, { useState, useEffect } from 'react';
import { Calendar, Download, Printer, Filter, CheckCircle, XCircle, Clock } from 'lucide-react';
import { getStoreAttendance, markStoreAttendance, getStoreStaff } from '../../utils/storeApi';
import { storeSuccess } from '../../utils/storeNotifications';

const StoreAttendance = () => {
  const [records, setRecords] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  const load = async () => {
    setLoading(true);
    try {
      const [a, s] = await Promise.all([getStoreAttendance(), getStoreStaff()]);
      setRecords(a.data || []);
      setStaffList(s.data || []);
    } catch {}
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const handleMark = async (staffId, status) => {
    let reason = '';
    if (status === 'Absent') { reason = window.prompt('Enter reason for absence:') || ''; if (reason === null) return; }
    try {
      await markStoreAttendance({ staff_id: staffId, attendance_date: date, status, reason });
      storeSuccess('Attendance Updated', 'Attendance Recorded', `Marked as ${status}.`);
      load();
    } catch {}
  };

  const todayRecords = records.filter(r => r.attendance_date === date);
  const presentCount = todayRecords.filter(a => a.status === 'Present' || a.status === 'Late').length;
  const absentCount = todayRecords.filter(a => a.status === 'Absent').length;
  const lateCount = todayRecords.filter(a => a.status === 'Late').length;
  const percentage = staffList.length ? Math.round((presentCount / staffList.length) * 100) : 0;

  if (loading) return <div style={{ padding: 24, fontFamily: "'Inter', sans-serif" }}>Loading...</div>;

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: '#166534' }}>
            <Calendar color="#22c55e" size={28} /> ATTENDANCE
          </h1>
          <p style={{ color: '#64748b', margin: '4px 0 0' }}>Document Model: Attendance Record</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => window.print()} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: 'white', border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer', fontSize: 14 }}>
            <Printer size={15} /> Print
          </button>
          <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#0f172a', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 14 }}>
            <Download size={15} /> Export PDF/Excel
          </button>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        <div style={{ background: '#f0fdf4', padding: 20, borderRadius: 10, border: '1px solid #bbf7d0' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#166534', marginBottom: 8 }}>PRESENT (TODAY)</div>
          <div style={{ fontSize: 32, fontWeight: 'bold', color: '#15803d' }}>{presentCount}</div>
        </div>
        <div style={{ background: '#fee2e2', padding: 20, borderRadius: 10, border: '1px solid #fecaca' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#991b1b', marginBottom: 8 }}>ABSENT (TODAY)</div>
          <div style={{ fontSize: 32, fontWeight: 'bold', color: '#b91c1c' }}>{absentCount}</div>
        </div>
        <div style={{ background: '#fef3c7', padding: 20, borderRadius: 10, border: '1px solid #fde68a' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#92400e', marginBottom: 8 }}>LATE ARRIVALS</div>
          <div style={{ fontSize: 32, fontWeight: 'bold', color: '#b45309' }}>{lateCount}</div>
        </div>
        <div style={{ background: '#eff6ff', padding: 20, borderRadius: 10, border: '1px solid #bfdbfe' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#1d4ed8', marginBottom: 8 }}>ATTENDANCE %</div>
          <div style={{ fontSize: 32, fontWeight: 'bold', color: '#2563eb' }}>{percentage}%</div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20, background: 'white', padding: 16, borderRadius: 8, border: '1px solid #e2e8f0', alignItems: 'center' }}>
        <Filter size={15} color="#64748b" />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label style={{ fontSize: 13, color: '#64748b' }}>Date:</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 14 }} />
        </div>
      </div>
      <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#f1f5f9' }}>
              <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 700, color: '#475569' }}>Staff Member</th>
              <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 700, color: '#475569' }}>Role</th>
              <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 700, color: '#475569' }}>Current Status</th>
              <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 700, color: '#475569' }}>Mark Attendance</th>
            </tr>
          </thead>
          <tbody>
            {staffList.map(s => {
              const att = todayRecords.find(r => r.staff_id === s.id);
              return (
                <tr key={s.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>{s.full_name}</div>
                    <div style={{ fontSize: 11, color: '#64748b', fontFamily: 'monospace' }}>{s.staff_no}</div>
                  </td>
                  <td style={{ padding: '12px 14px', color: '#475569' }}>{s.role}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: att?.status === 'Present' ? '#dcfce7' : att?.status === 'Late' ? '#fef3c7' : att?.status === 'Absent' ? '#fee2e2' : '#f1f5f9', color: att?.status === 'Present' ? '#166534' : att?.status === 'Late' ? '#92400e' : att?.status === 'Absent' ? '#991b1b' : '#475569' }}>
                      {att?.status || 'Not Marked'}
                    </span>
                    {att?.reason && <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>Note: {att.reason}</div>}
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => handleMark(s.id, 'Present')} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', background: 'white', color: '#166534', border: '1px solid #bbf7d0', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                        <CheckCircle size={14} /> Present
                      </button>
                      <button onClick={() => handleMark(s.id, 'Late')} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', background: 'white', color: '#92400e', border: '1px solid #fde68a', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                        <Clock size={14} /> Late
                      </button>
                      <button onClick={() => handleMark(s.id, 'Absent')} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', background: 'white', color: '#991b1b', border: '1px solid #fecaca', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                        <XCircle size={14} /> Absent
                      </button>
                      <button onClick={() => handleMark(s.id, 'Leave')} style={{ padding: '6px 12px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>
                        Leave
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {staffList.length === 0 && <tr><td colSpan={4} style={{ padding: 24, textAlign: 'center', color: '#94a3b8' }}>No staff found</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StoreAttendance;