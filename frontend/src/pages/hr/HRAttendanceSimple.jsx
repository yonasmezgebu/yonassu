import React, { useState, useEffect } from 'react';
import hrService from '../../services/hrService';
import { Check, X } from 'lucide-react';

const HRAttendanceSimple = () => {
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [attendance, setAttendance] = useState({});

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setLoading(true);
        const res = await hrService.etp.listEmployees({ limit: 100 });
        setEmployees(res.data?.data || []);
      } catch (err) {
        console.error('Failed to fetch employees:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchEmployees();
  }, []);

  const markAttendance = (empId, status) => {
    setAttendance(prev => ({ ...prev, [empId]: status }));
  };

  const filtered = employees.filter(e =>
    (e.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (e.dept_name || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ padding: 0, fontFamily: "'Inter', sans-serif" }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 24px 0 24px', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '26px', fontWeight: '700', margin: '0 0 6px 0', color: '#111827' }}>Daily Attendance</h2>
          <p style={{ color: '#6b7280', margin: 0, fontSize: '15px' }}>Mark employees as present or absent for today.</p>
        </div>
        <input
          type="text"
          placeholder="Search employee..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ padding: '10px 16px', border: '1px solid #d1d5db', borderRadius: '8px', minWidth: '250px', outline: 'none', fontSize: '14px' }}
        />
      </div>

      {/* Table — full width, no radius */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>Loading sheet...</div>
      ) : (
        <div style={{ borderTop: '1px solid #e5e7eb', overflow: 'hidden', width: '100%' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', backgroundColor: 'white' }}>
            <thead style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
              <tr>
                <th style={{ padding: '14px 16px', color: '#64748b', fontWeight: '600', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Employee Name</th>
                <th style={{ padding: '14px 16px', color: '#64748b', fontWeight: '600', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Department</th>
                <th style={{ padding: '14px 16px', color: '#64748b', fontWeight: '600', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'center' }}>Mark Attendance</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={3} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: '15px' }}>No employees found</td>
                </tr>
              ) : (
                filtered.map(emp => {
                  const status = attendance[emp.employee_id];
                  return (
                    <tr
                      key={emp.employee_id}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        backgroundColor: status === 'present' ? '#f0fdf4' : status === 'absent' ? '#fef2f2' : 'white'
                      }}
                    >
                      <td style={{ padding: '14px 16px', fontWeight: '600', color: '#111827' }}>{emp.full_name}</td>
                      <td style={{ padding: '14px 16px', color: '#4b5563' }}>{emp.dept_name || 'N/A'}</td>
                      <td style={{ padding: '14px 16px', display: 'flex', gap: '12px', justifyContent: 'center', alignItems: 'center' }}>
                        {/* Present */}
                        <button
                          onClick={() => markAttendance(emp.employee_id, 'present')}
                          title="Present"
                          style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            width: '36px', height: '36px', borderRadius: '50%',
                            border: 'none', cursor: 'pointer',
                            backgroundColor: status === 'present' ? '#22c55e' : '#e5e7eb',
                            color: status === 'present' ? 'white' : '#9ca3af',
                            transition: 'all 0.2s'
                          }}
                        >
                          <Check size={18} strokeWidth={3} />
                        </button>
                        {/* Absent */}
                        <button
                          onClick={() => markAttendance(emp.employee_id, 'absent')}
                          title="Absent"
                          style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            width: '36px', height: '36px', borderRadius: '50%',
                            border: 'none', cursor: 'pointer',
                            backgroundColor: status === 'absent' ? '#ef4444' : '#e5e7eb',
                            color: status === 'absent' ? 'white' : '#9ca3af',
                            transition: 'all 0.2s'
                          }}
                        >
                          <X size={18} strokeWidth={3} />
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
    </div>
  );
};

export default HRAttendanceSimple;
