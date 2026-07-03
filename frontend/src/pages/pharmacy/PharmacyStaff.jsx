import React, { useState } from 'react';
import { Users, Plus, Shield, ToggleLeft, ToggleRight, Calendar, Settings } from 'lucide-react';
import { submitNotification } from '../../utils/pharmacyNotifications';

const PharmacyStaff = () => {
  const [staff, setStaff] = useState([
    { id: 'STF-001', name: 'Abebe Kebede', role: 'Worker', branch: 'Branch A', phone: '0911223344', postPermission: true, hireDate: '2023-01-15' },
    { id: 'STF-002', name: 'Helen Tadesse', role: 'Worker', branch: 'Branch B', phone: '0922334455', postPermission: false, hireDate: '2024-02-10' },
  ]);

  const togglePermission = (id, currentStatus, name) => {
    if (window.confirm(`You are toggling ${name}'s post permission ${currentStatus ? 'OFF' : 'ON'}. Confirm?`)) {
      setStaff(staff.map(s => s.id === id ? { ...s, postPermission: !s.postPermission } : s));
      submitNotification('Permission Updated', `Post permission for ${name} is now ${currentStatus ? 'OFF' : 'ON'}.`);
    }
  };

  const handleAddStaff = () => {
    submitNotification('Staff Added', 'New staff member added successfully. Permission defaulted to OFF.');
  };

  return (
    <div style={{ padding: 24, fontFamily: "'Inter', sans-serif" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 'bold', color: '#1e293b', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Users size={24} color="#0284c7" /> STAFF MANAGEMENT
          </h2>
          <p style={{ color: '#64748b', margin: 0 }}>🔗 Manage Staff, Permissions & Schedules (Manager Only)</p>
        </div>
        <button onClick={handleAddStaff} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#1e293b', color: 'white', padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer' }}>
          <Plus size={18} /> Add New Staff
        </button>
      </div>

      <div style={{ display: 'flex', gap: 24 }}>
        {/* Left: Staff List & Permissions */}
        <div style={{ flex: 2, background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', padding: 24 }}>
          <h3 style={{ marginTop: 0, marginBottom: 16 }}>Staff Directory & Permissions</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <tr>
                <th style={{ padding: 12, color: '#475569' }}>Name</th>
                <th style={{ padding: 12, color: '#475569' }}>Role / Branch</th>
                <th style={{ padding: 12, color: '#475569', textAlign: 'center' }}>Post Permission</th>
                <th style={{ padding: 12, color: '#475569', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {staff.map(s => (
                <tr key={s.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: 12 }}>
                    <strong>{s.name}</strong>
                    <div style={{ fontSize: 12, color: '#64748b' }}>ID: {s.id} • {s.phone}</div>
                  </td>
                  <td style={{ padding: 12 }}>
                    {s.role}
                    <div style={{ fontSize: 12, color: '#64748b' }}>{s.branch}</div>
                  </td>
                  <td style={{ padding: 12, textAlign: 'center' }}>
                    <button 
                      onClick={() => togglePermission(s.id, s.postPermission, s.name)}
                      style={{ 
                        background: 'transparent', 
                        border: 'none', 
                        cursor: 'pointer', 
                        color: s.postPermission ? '#10b981' : '#cbd5e1',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        width: '100%'
                      }}
                    >
                      {s.postPermission ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                      <span style={{ fontSize: 12, fontWeight: 'bold' }}>{s.postPermission ? 'ON' : 'OFF'}</span>
                    </button>
                  </td>
                  <td style={{ padding: 12, textAlign: 'right' }}>
                    <button style={{ padding: '6px 12px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer' }}>
                      <Settings size={16} /> Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Right: Leave & Schedules */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', padding: 24 }}>
            <h3 style={{ marginTop: 0, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Calendar size={18} /> Leave Requests
            </h3>
            <div style={{ border: '1px solid #fef08a', background: '#fef9c3', padding: 12, borderRadius: 8, marginBottom: 12 }}>
              <div style={{ fontWeight: 'bold', color: '#854d0e' }}>Abebe Kebede - Sick Leave</div>
              <div style={{ fontSize: 12, color: '#a16207', marginBottom: 8 }}>July 5 - July 7</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button style={{ flex: 1, padding: 6, background: '#10b981', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Approve</button>
                <button style={{ flex: 1, padding: 6, background: '#ef4444', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Reject</button>
              </div>
            </div>
          </div>
          
          <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', padding: 24 }}>
            <h3 style={{ marginTop: 0, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Calendar size={18} /> Weekly Schedule
            </h3>
            <button style={{ width: '100%', padding: 12, background: '#f1f5f9', border: '1px dashed #cbd5e1', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold', color: '#475569' }}>
              + Assign Shift
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PharmacyStaff;
