import React, { useState } from 'react';
import { Users, Download, Printer, Filter } from 'lucide-react';
import { storeSuccess } from '../../utils/storeNotifications';

const mockStaff = [
  { id: 'STF-001', name: 'Abebe Kebede', role: 'Store Manager', contact: '+251911234567', hire: '2020-01-15', performance: 'Excellent', tasks: 2, status: 'Active' },
  { id: 'STF-002', name: 'Selamawit Tadesse', role: 'Store Worker', contact: '+251922345678', hire: '2023-05-10', performance: 'Good', tasks: 5, status: 'Active' },
  { id: 'STF-003', name: 'Dawit Mekonnen', role: 'Store Worker', contact: '+251933456789', hire: '2024-02-01', performance: 'Needs Improvement', tasks: 0, status: 'Inactive' },
];

const StoreStaffList = () => {
  const [staff, setStaff] = useState(mockStaff);

  const toggleStatus = (id) => {
    setStaff(s => s.map(st => {
      if (st.id === id) {
        const newStatus = st.status === 'Active' ? 'Inactive' : 'Active';
        storeSuccess(`👥 Staff List Updated`, '👥 Staff Record Changed', `${st.name} is now ${newStatus}.`);
        return { ...st, status: newStatus };
      }
      return st;
    }));
  };

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
          <option>Store Manager</option>
          <option>Store Worker</option>
        </select>
        <select style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 14 }}>
          <option>All Statuses</option>
          <option>Active</option>
          <option>Inactive</option>
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
                  <div style={{ fontWeight: 600, color: '#0f172a' }}>{s.name}</div>
                  <div style={{ fontSize: 11, color: '#64748b', fontFamily: 'monospace' }}>{s.id}</div>
                </td>
                <td style={{ padding: '12px 14px', fontWeight: 500 }}>{s.role}</td>
                <td style={{ padding: '12px 14px', color: '#475569' }}>{s.contact}</td>
                <td style={{ padding: '12px 14px', color: '#64748b' }}>{s.hire}</td>
                <td style={{ padding: '12px 14px' }}>
                  <span style={{ padding: '3px 8px', borderRadius: 12, fontSize: 11, fontWeight: 700, background: s.performance === 'Excellent' ? '#dcfce7' : s.performance === 'Good' ? '#eff6ff' : '#fee2e2', color: s.performance === 'Excellent' ? '#166534' : s.performance === 'Good' ? '#1d4ed8' : '#991b1b' }}>{s.performance}</span>
                </td>
                <td style={{ padding: '12px 14px', fontWeight: 700, color: '#0f172a' }}>{s.tasks}</td>
                <td style={{ padding: '12px 14px' }}>
                  <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: s.status === 'Active' ? '#dcfce7' : '#f1f5f9', color: s.status === 'Active' ? '#166534' : '#475569' }}>{s.status}</span>
                </td>
                <td style={{ padding: '12px 14px' }}>
                  <button onClick={() => toggleStatus(s.id)} style={{ padding: '6px 12px', background: 'white', border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>
                    {s.status === 'Active' ? 'Deactivate' : 'Activate'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StoreStaffList;
