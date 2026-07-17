import React, { useState, useEffect } from 'react';
import { Users, Download, Printer, Filter } from 'lucide-react';
import { getStoreStaff, toggleStoreStaffStatus } from '../../utils/storeApi';
import { storeSuccess } from '../../utils/storeNotifications';

const StoreStaffList = () => {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => getStoreStaff().then(r => { setStaff(r.data || []); setLoading(false); }).catch(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const handleToggle = async (id) => {
    const s = staff.find(x => x.id === id);
    const oldStatus = s?.status;
    try {
      const r = await toggleStoreStaffStatus(id);
      setStaff(staff.map(st => st.id === id ? { ...st, status: r.data.status } : st));
      storeSuccess('Staff List Updated', 'Staff Record Changed', `${s?.full_name} is now ${r.data.status}.`);
    } catch { setStaff(staff.map(st => st.id === id ? { ...st, status: oldStatus } : st)); }
  };

  if (loading) return <div style={{ padding: 24, fontFamily: "'Inter', sans-serif" }}>Loading...</div>;

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: '#0369a1' }}>
            <Users color="#0ea5e9" size={28} /> STAFF LIST
          </h1>
          <p style={{ color: '#64748b', margin: '4px 0 0' }}>Document Model: Staff Record</p>
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
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20, background: 'white', padding: 16, borderRadius: 8, border: '1px solid #e2e8f0', alignItems: 'center' }}>
        <Filter size={15} color="#64748b" />
        <select style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 14 }}>
          <option>All Roles</option>
        </select>
        <select style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 14 }}>
          <option>All Statuses</option>
        </select>
      </div>
      <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#f0f9ff' }}>
              {['Full Name', 'Role', 'Contact', 'Hire Date', 'Performance', 'Assigned Tasks', 'Status', 'Actions'].map(h => (
                <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 700, color: '#0369a1', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {staff.map(s => (
              <tr key={s.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '12px 14px' }}>
                  <div style={{ fontWeight: 600, color: '#0f172a' }}>{s.full_name}</div>
                  <div style={{ fontSize: 11, color: '#64748b', fontFamily: 'monospace' }}>{s.staff_no}</div>
                </td>
                <td style={{ padding: '12px 14px', fontWeight: 500 }}>{s.role}</td>
                <td style={{ padding: '12px 14px', color: '#475569' }}>{s.phone || '—'}</td>
                <td style={{ padding: '12px 14px', color: '#64748b' }}>{s.hire_date ? new Date(s.hire_date).toLocaleDateString() : '—'}</td>
                <td style={{ padding: '12px 14px' }}>
                  <span style={{ padding: '3px 8px', borderRadius: 12, fontSize: 11, fontWeight: 700, background: s.performance === 'Excellent' ? '#dcfce7' : s.performance === 'Good' ? '#eff6ff' : '#fee2e2', color: s.performance === 'Excellent' ? '#166534' : s.performance === 'Good' ? '#1d4ed8' : '#991b1b' }}>{s.performance}</span>
                </td>
                <td style={{ padding: '12px 14px', fontWeight: 700, color: '#0f172a' }}>{s.assigned_tasks}</td>
                <td style={{ padding: '12px 14px' }}>
                  <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: s.status === 'Active' ? '#dcfce7' : '#f1f5f9', color: s.status === 'Active' ? '#166534' : '#475569' }}>{s.status}</span>
                </td>
                <td style={{ padding: '12px 14px' }}>
                  <button onClick={() => handleToggle(s.id)} style={{ padding: '6px 12px', background: 'white', border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>
                    {s.status === 'Active' ? 'Deactivate' : 'Activate'}
                  </button>
                </td>
              </tr>
            ))}
            {staff.length === 0 && <tr><td colSpan={8} style={{ padding: 24, textAlign: 'center', color: '#94a3b8' }}>No staff records found</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StoreStaffList;