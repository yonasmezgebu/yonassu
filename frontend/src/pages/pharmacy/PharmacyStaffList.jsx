import React, { useState } from 'react';
import { Download, Users } from 'lucide-react';
import { triggerNotification } from '../../utils/pharmacyNotifications';

const PharmacyStaffList = () => {
  const [filters, setFilters] = useState({ branch: 'All', role: 'All' });

  const mockStaff = [
    { id: 'STF-001', name: 'Abebe Kebede', role: 'Worker', branch: 'Branch A', phone: '0911223344', email: 'abebe@pharmacy.com', hireDate: '2023-01-15', salesCount: 145, salesAmount: 12500 },
    { id: 'STF-002', name: 'Helen Tadesse', role: 'Worker', branch: 'Branch B', phone: '0922334455', email: 'helen@pharmacy.com', hireDate: '2024-02-10', salesCount: 89, salesAmount: 8200 },
    { id: 'STF-003', name: 'Samuel Belay', role: 'Manager', branch: 'Branch A', phone: '0933445566', email: 'samuel@pharmacy.com', hireDate: '2022-05-20', salesCount: 12, salesAmount: 4500 },
  ];

  const handleExport = (format) => {
    triggerNotification('Export Successful', `Staff Directory exported as ${format}`, 'success');
  };

  return (
    <div style={{ padding: 24, fontFamily: "'Inter', sans-serif" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 'bold', color: '#1e293b', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Users size={24} color="#0284c7" /> STAFF LIST
          </h2>
          <p style={{ color: '#64748b', margin: 0 }}>🔗 View All Staff Directory</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => handleExport('PDF')} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#1e293b', color: 'white', padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer' }}>
            <Download size={18} /> Export PDF
          </button>
          <button onClick={() => handleExport('Excel')} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#0284c7', color: 'white', padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer' }}>
            <Download size={18} /> Export Excel
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 24, background: 'white', padding: 16, borderRadius: 8, border: '1px solid #e2e8f0' }}>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', fontSize: 12, color: '#64748b', marginBottom: 4 }}>Branch</label>
          <select value={filters.branch} onChange={e => setFilters({...filters, branch: e.target.value})} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #cbd5e1' }}>
            <option>All</option><option>Branch A</option><option>Branch B</option>
          </select>
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', fontSize: 12, color: '#64748b', marginBottom: 4 }}>Role</label>
          <select value={filters.role} onChange={e => setFilters({...filters, role: e.target.value})} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #cbd5e1' }}>
            <option>All</option><option>Worker</option><option>Manager</option>
          </select>
        </div>
      </div>

      <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
            <tr>
              <th style={{ padding: 12, color: '#475569' }}>Name</th>
              <th style={{ padding: 12, color: '#475569' }}>Role</th>
              <th style={{ padding: 12, color: '#475569' }}>Branch</th>
              <th style={{ padding: 12, color: '#475569' }}>Contact</th>
              <th style={{ padding: 12, color: '#475569' }}>Hire Date</th>
              <th style={{ padding: 12, color: '#475569' }}>Sales Performance</th>
            </tr>
          </thead>
          <tbody>
            {mockStaff.map(s => (
              <tr key={s.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: 12, fontWeight: 'bold' }}>{s.name}</td>
                <td style={{ padding: 12 }}>
                  <span style={{ padding: '4px 8px', borderRadius: 4, fontSize: 12, background: s.role === 'Manager' ? '#e0e7ff' : '#f1f5f9', color: s.role === 'Manager' ? '#3730a3' : '#475569' }}>
                    {s.role}
                  </span>
                </td>
                <td style={{ padding: 12 }}>{s.branch}</td>
                <td style={{ padding: 12 }}>
                  <div>{s.phone}</div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>{s.email}</div>
                </td>
                <td style={{ padding: 12 }}>{s.hireDate}</td>
                <td style={{ padding: 12 }}>
                  <div style={{ fontWeight: 'bold', color: '#10b981' }}>${s.salesAmount.toLocaleString()}</div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>{s.salesCount} txns</div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PharmacyStaffList;
