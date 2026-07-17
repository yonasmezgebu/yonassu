import React, { useState } from 'react';
import { submitNotification, receiveNotification, triggerNotification } from '../../utils/ceoNotifications';
import { Users, User, Download, CheckCircle, XCircle, Calendar } from 'lucide-react';
import HRDepartments from '../hr/HRDepartments';

const CEOHR = () => {
  const [activeTab, setActiveTab] = useState('Employees');

  // Seeded 14 employees
  const [employees] = useState([
    { id: 'EMP-001', name: 'John Doe', dept: 'Pharmacy', role: 'Manager', branch: 'Main', hireDate: '2024-01-15', status: 'Active', salary: 5000 },
    { id: 'EMP-002', name: 'Jane Smith', dept: 'Pharmacy', role: 'Pharmacist', branch: 'Main', hireDate: '2025-03-10', status: 'Active', salary: 3000 },
    { id: 'EMP-003', name: 'Alice Brown', dept: 'Car Rental', role: 'Manager', branch: 'Main', hireDate: '2023-11-01', status: 'On Leave', salary: 4500 },
    { id: 'EMP-004', name: 'Bob White', dept: 'Store', role: 'Manager', branch: 'Main', hireDate: '2022-05-20', status: 'Active', salary: 4000 },
    { id: 'EMP-005', name: 'Charlie Green', dept: 'Finance', role: 'Manager', branch: 'Main', hireDate: '2024-08-12', status: 'Active', salary: 5500 },
    { id: 'EMP-006', name: 'Diana Prince', dept: 'HR', role: 'Manager', branch: 'Main', hireDate: '2023-01-05', status: 'Active', salary: 4800 },
    { id: 'EMP-007', name: 'Eve Black', dept: 'Purchase', role: 'Manager', branch: 'Main', hireDate: '2025-01-20', status: 'Active', salary: 4600 },
    { id: 'EMP-008', name: 'Frank Gray', dept: 'Printing', role: 'Manager', branch: 'Main', hireDate: '2024-04-14', status: 'Active', salary: 3800 },
    { id: 'EMP-009', name: 'Grace Hill', dept: 'Agri Rental', role: 'Manager', branch: 'Main', hireDate: '2023-09-09', status: 'Active', salary: 4200 },
    { id: 'EMP-010', name: 'Henry Ford', dept: 'Car Rental', role: 'Driver', branch: 'Main', hireDate: '2025-06-01', status: 'Active', salary: 2000 },
    { id: 'EMP-011', name: 'Ivy Stone', dept: 'Pharmacy', role: 'Cashier', branch: 'Main', hireDate: '2026-02-15', status: 'Active', salary: 1500 },
    { id: 'EMP-012', name: 'Jack Daniels', dept: 'Store', role: 'Clerk', branch: 'Main', hireDate: '2025-11-11', status: 'Active', salary: 1800 },
    { id: 'EMP-013', name: 'Karen Page', dept: 'Finance', role: 'Accountant', branch: 'Main', hireDate: '2024-07-22', status: 'Active', salary: 3500 },
    { id: 'EMP-014', name: 'Leo Messi', dept: 'Printing', role: 'Operator', branch: 'Main', hireDate: '2026-01-10', status: 'Active', salary: 2200 },
  ]);

  const [leaveRequests, setLeaveRequests] = useState([
    { id: 'LR-301', name: 'Jane Smith', dept: 'Pharmacy', type: 'Annual', start: '2026-07-10', end: '2026-07-20', days: 10, status: 'PENDING' },
    { id: 'LR-302', name: 'Alice Brown', dept: 'Car Rental', type: 'Sick', start: '2026-07-01', end: '2026-07-05', days: 5, status: 'APPROVED' },
  ]);

  const [rejectId, setRejectId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [viewEmployee, setViewEmployee] = useState(null);

  const handleApproveLeave = (req) => {
    setLeaveRequests(leaveRequests.map(r => r.id === req.id ? { ...r, status: 'APPROVED' } : r));
    submitNotification('Leave Request Approved', `Leave for ${req.name} approved. Employee status will update to On Leave on start date.`);
  };

  const handleRejectLeave = () => {
    if (!rejectReason) return alert('Reason is required');
    setLeaveRequests(leaveRequests.map(r => r.id === rejectId ? { ...r, status: 'REJECTED' } : r));
    receiveNotification('Leave Request Rejected', `LR ${rejectId} rejected: ${rejectReason}`);
    setRejectId(null);
    setRejectReason('');
  };

  const handleExport = () => {
    triggerNotification('Export Started', `Exporting HR ${activeTab} Report as PDF...`);
  };

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0 }}>👥 HUMAN RESOURCES</h1>
          <p style={{ color: '#64748b', margin: 0 }}>🔗 Manage HR & Payroll Across All Departments</p>
        </div>
        <button onClick={handleExport} style={{ padding: '8px 16px', background: 'white', border: '1px solid #cbd5e1', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
          <Download size={16}/> Export Report
        </button>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {['Employees', 'Departments', 'Leave Requests', 'Payroll', 'Attendance'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{ padding: '10px 20px', borderRadius: 6, border: 'none', background: activeTab === tab ? '#0f172a' : 'white', color: activeTab === tab ? 'white' : '#64748b', cursor: 'pointer', fontWeight: 'bold', border: activeTab === tab ? 'none' : '1px solid #e2e8f0' }}>
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'Employees' && (
        <div style={{ background: 'white', padding: 16, borderRadius: 8, border: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: 16 }}>All Employees ({employees.length})</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ background: '#f8fafc' }}>
              <tr>
                <th style={{ padding: 12 }}>EMP ID</th>
                <th style={{ padding: 12 }}>Name</th>
                <th style={{ padding: 12 }}>Department</th>
                <th style={{ padding: 12 }}>Role</th>
                <th style={{ padding: 12 }}>Branch</th>
                <th style={{ padding: 12 }}>Status</th>
                <th style={{ padding: 12 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees.map(e => (
                <tr key={e.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: 12, fontWeight: 'bold' }}>{e.id}</td>
                  <td style={{ padding: 12 }}>{e.name}</td>
                  <td style={{ padding: 12 }}>{e.dept}</td>
                  <td style={{ padding: 12 }}>{e.role}</td>
                  <td style={{ padding: 12 }}>{e.branch}</td>
                  <td style={{ padding: 12 }}>
                    <span style={{ padding: '4px 8px', borderRadius: 4, fontSize: 12, fontWeight: 'bold', background: e.status === 'Active' ? '#dcfce7' : '#fee2e2', color: e.status === 'Active' ? '#166534' : '#991b1b' }}>
                      {e.status}
                    </span>
                  </td>
                  <td style={{ padding: 12 }}>
                    <button onClick={() => setViewEmployee(e)} style={{ background: '#f1f5f9', border: 'none', padding: '6px 12px', borderRadius: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <User size={14}/> Profile
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'Departments' && (
        <div style={{ background: 'white', padding: 16, borderRadius: 8, border: '1px solid #e2e8f0', minHeight: '600px' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: 16 }}>Departments Management</h3>
          <div style={{ height: 'calc(100% - 40px)', overflow: 'auto' }}>
            <HRDepartments />
          </div>
        </div>
      )}

      {activeTab === 'Leave Requests' && (
        <div style={{ background: 'white', padding: 16, borderRadius: 8, border: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: 16 }}>Leave Requests</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ background: '#f8fafc' }}>
              <tr>
                <th style={{ padding: 12 }}>LR #</th>
                <th style={{ padding: 12 }}>Employee Name</th>
                <th style={{ padding: 12 }}>Department</th>
                <th style={{ padding: 12 }}>Dates</th>
                <th style={{ padding: 12 }}>Days</th>
                <th style={{ padding: 12 }}>Status</th>
                <th style={{ padding: 12 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {leaveRequests.map(r => (
                <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: 12, fontWeight: 'bold' }}>{r.id}</td>
                  <td style={{ padding: 12 }}>{r.name}</td>
                  <td style={{ padding: 12 }}>{r.dept}</td>
                  <td style={{ padding: 12 }}>{r.start} to {r.end}</td>
                  <td style={{ padding: 12 }}>{r.days}</td>
                  <td style={{ padding: 12 }}>
                    <span style={{ padding: '4px 8px', borderRadius: 4, fontSize: 12, fontWeight: 'bold', background: r.status === 'APPROVED' ? '#dcfce7' : r.status === 'REJECTED' ? '#fee2e2' : '#fef3c7', color: r.status === 'APPROVED' ? '#166534' : r.status === 'REJECTED' ? '#991b1b' : '#b45309' }}>
                      {r.status}
                    </span>
                  </td>
                  <td style={{ padding: 12 }}>
                    {r.status === 'PENDING' && (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => handleApproveLeave(r)} style={{ background: '#22c55e', color: 'white', border: 'none', padding: '6px 12px', borderRadius: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <CheckCircle size={14}/> Approve
                        </button>
                        <button onClick={() => setRejectId(r.id)} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '6px 12px', borderRadius: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <XCircle size={14}/> Reject
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'Payroll' && (
        <div style={{ background: 'white', padding: 16, borderRadius: 8, border: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: 16 }}>Payroll Summary (Read-Only)</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ background: '#f8fafc' }}>
              <tr>
                <th style={{ padding: 12 }}>Employee Name</th>
                <th style={{ padding: 12 }}>Department</th>
                <th style={{ padding: 12 }}>Base Salary</th>
                <th style={{ padding: 12 }}>Deductions</th>
                <th style={{ padding: 12 }}>Net Pay</th>
              </tr>
            </thead>
            <tbody>
              {employees.map(e => (
                <tr key={e.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: 12 }}>{e.name}</td>
                  <td style={{ padding: 12 }}>{e.dept}</td>
                  <td style={{ padding: 12 }}>${e.salary}</td>
                  <td style={{ padding: 12 }}>${e.salary * 0.1}</td>
                  <td style={{ padding: 12, fontWeight: 'bold' }}>${e.salary * 0.9}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'Attendance' && (
        <div style={{ background: 'white', padding: 16, borderRadius: 8, border: '1px solid #e2e8f0', textAlign: 'center', color: '#64748b' }}>
          <Calendar size={48} style={{ opacity: 0.5, marginBottom: 16 }}/>
          <h3>Unified Attendance View</h3>
          <p>This view dynamically pulls from the individual department attendance modules.</p>
        </div>
      )}

      {/* REJECT MODAL */}
      {rejectId && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'white', padding: 24, borderRadius: 8, width: 400 }}>
            <h3>Reject Leave {rejectId}</h3>
            <textarea placeholder="Enter rejection reason (required)..." value={rejectReason} onChange={e => setRejectReason(e.target.value)} style={{ width: '100%', height: 100, padding: 8, marginBottom: 16, border: '1px solid #cbd5e1', borderRadius: 4 }}></textarea>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button onClick={() => setRejectId(null)} style={{ padding: '8px 16px', background: '#f1f5f9', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleRejectLeave} style={{ padding: '8px 16px', background: '#ef4444', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Submit</button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW PROFILE MODAL */}
      {viewEmployee && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'white', padding: 24, borderRadius: 8, width: 500 }}>
            <h3 style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: 16, marginBottom: 16 }}>Employee Profile</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
              <div><strong>Name:</strong> {viewEmployee.name}</div>
              <div><strong>ID:</strong> {viewEmployee.id}</div>
              <div><strong>Department:</strong> {viewEmployee.dept}</div>
              <div><strong>Role:</strong> {viewEmployee.role}</div>
              <div><strong>Hire Date:</strong> {viewEmployee.hireDate}</div>
              <div><strong>Status:</strong> {viewEmployee.status}</div>
            </div>
            
            <h4 style={{ marginBottom: 8 }}>Performance Summary</h4>
            <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8, marginBottom: 24 }}>
              Task Completion Rate: 95%<br/>
              Attendance Rate: 98%<br/>
              Punctuality: 100%
            </div>

            <button onClick={() => setViewEmployee(null)} style={{ padding: '8px 16px', background: '#f1f5f9', border: 'none', borderRadius: 4, cursor: 'pointer', width: '100%' }}>Close Profile</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CEOHR;
