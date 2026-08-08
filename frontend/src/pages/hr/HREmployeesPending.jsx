import React, { useState, useEffect } from 'react';
import ceoService from '../../services/ceoService';
import { UserCheck, CheckCircle, XCircle, Search, Clock, Eye } from 'lucide-react';

const HREmployeesPending = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  const fetchPending = async () => {
    try {
      setLoading(true);
      const res = await ceoService.getPendingEmployeeRegistrations();
      setEmployees(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleApprove = async (id) => {
    try {
      await ceoService.approveEmployeeRegistration(id);
      fetchPending();
    } catch (err) {
      console.error('Approve error', err);
      alert('Failed to approve registration.');
    }
  };

  const handleReject = async (id) => {
    if (!rejectReason.trim()) return alert('Please enter a rejection reason.');
    try {
      await ceoService.rejectEmployeeRegistration(id, rejectReason);
      setRejectingId(null);
      setRejectReason('');
      fetchPending();
    } catch (err) {
      console.error('Reject error', err);
      alert('Failed to reject registration.');
    }
  };

  const filtered = employees.filter(e => 
    e.full_name?.toLowerCase().includes(search.toLowerCase()) || 
    e.employee_id?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: '#0f172a' }}>
            <UserCheck color="#10b981" size={28}/> EMPLOYEE REGISTRATIONS AWAITING APPROVAL
          </h1>
          <p style={{ color: '#64748b', margin: 0, marginTop: 4 }}>Review all newly registered employees before HR finalizes their profile</p>
        </div>
      </div>

      {/* FILTERS */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24, background: 'white', padding: 16, borderRadius: 8, border: '1px solid #e2e8f0', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, background: '#f1f5f9', padding: '8px 12px', borderRadius: 6 }}>
          <Search size={16} color="#64748b" />
          <input 
            type="text" 
            placeholder="Search by name or ID..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: 14 }}
          />
        </div>
        <div style={{ color: '#64748b', fontSize: 14, fontWeight: 'bold' }}>
          Total Pending: <span style={{ color: '#f59e0b' }}>{employees.length}</span>
        </div>
      </div>

      {/* MAIN TABLE */}
      <div style={{ background: 'white', padding: 16, borderRadius: 8, border: '1px solid #e2e8f0', overflowX: 'auto' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>Loading pending registrations...</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 14 }}>
            <thead style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
              <tr>
                <th style={{ padding: '12px 16px', color: '#475569' }}>Employee</th>
                <th style={{ padding: '12px 16px', color: '#475569' }}>Department</th>
                <th style={{ padding: '12px 16px', color: '#475569' }}>Position</th>
                <th style={{ padding: '12px 16px', color: '#475569' }}>Hire Date</th>
                <th style={{ padding: '12px 16px', color: '#475569' }}>Salary</th>
                <th style={{ padding: '12px 16px', color: '#475569', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(emp => (
                <React.Fragment key={emp.employee_id}>
                  <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '16px' }}>
                      <div style={{ fontWeight: 'bold', color: '#0f172a' }}>{emp.full_name}</div>
                      <div style={{ fontSize: 12, color: '#64748b' }}>{emp.employee_id} | {emp.personal_phone || 'No Phone'}</div>
                    </td>
                    <td style={{ padding: '16px', color: '#334155' }}>
                      <span style={{ background: '#f1f5f9', padding: '4px 8px', borderRadius: 4 }}>{emp.dept_name || 'N/A'}</span>
                    </td>
                    <td style={{ padding: '16px', color: '#334155' }}>{emp.position_title || 'N/A'}</td>
                    <td style={{ padding: '16px', color: '#334155' }}>{emp.hire_date ? new Date(emp.hire_date).toLocaleDateString() : 'N/A'}</td>
                    <td style={{ padding: '16px', color: '#334155', fontWeight: 600 }}>{Number(emp.base_salary).toLocaleString()} ETB</td>
                    <td style={{ padding: '16px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                        <button 
                          onClick={() => {
                            setExpandedId(expandedId === emp.employee_id ? null : emp.employee_id);
                            if (rejectingId === emp.employee_id) setRejectingId(null);
                          }}
                          style={{ padding: '8px 12px', background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}
                        >
                          <Eye size={16}/> {expandedId === emp.employee_id ? 'Hide Details' : 'Details'}
                        </button>
                        <button 
                          onClick={() => handleApprove(emp.employee_id)}
                          style={{ padding: '8px 12px', background: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}
                        >
                          <CheckCircle size={16}/> Approve
                        </button>
                        <button 
                          onClick={() => {
                            setRejectingId(rejectingId === emp.employee_id ? null : emp.employee_id);
                            if (expandedId === emp.employee_id) setExpandedId(null);
                          }}
                          style={{ padding: '8px 12px', background: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}
                        >
                          <XCircle size={16}/> {rejectingId === emp.employee_id ? 'Cancel' : 'Reject'}
                        </button>
                      </div>
                    </td>
                  </tr>
                  
                  {/* Rejection Form Row */}
                  {rejectingId === emp.employee_id && (
                    <tr style={{ background: '#fef2f2' }}>
                      <td colSpan="6" style={{ padding: '16px', borderBottom: '1px solid #fecaca' }}>
                        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                          <span style={{ color: '#991b1b', fontWeight: 600 }}>Reason for rejection:</span>
                          <input 
                            type="text" 
                            value={rejectReason} 
                            onChange={e => setRejectReason(e.target.value)} 
                            placeholder="e.g. Incomplete information, salary exceeds band..."
                            style={{ flex: 1, padding: '8px 12px', border: '1px solid #fca5a5', borderRadius: 6, outline: 'none' }}
                            autoFocus
                          />
                          <button 
                            onClick={() => handleReject(emp.employee_id)}
                            style={{ padding: '8px 16px', background: '#dc2626', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}
                          >
                            Confirm Rejection
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                  
                  {/* Details Expansion Row */}
                  {expandedId === emp.employee_id && (
                    <tr style={{ background: '#f8fafc' }}>
                      <td colSpan="6" style={{ padding: '20px', borderBottom: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', fontSize: 13, color: '#334155' }}>
                          <div><strong>National ID:</strong> {emp.national_id || 'N/A'}</div>
                          <div><strong>Date of Birth:</strong> {emp.date_of_birth ? new Date(emp.date_of_birth).toLocaleDateString() : 'N/A'}</div>
                          <div><strong>Gender:</strong> {emp.gender || 'N/A'}</div>
                          <div><strong>Marital Status:</strong> {emp.marital_status || 'N/A'}</div>
                          
                          <div><strong>Personal Email:</strong> {emp.personal_email || 'N/A'}</div>
                          <div><strong>Physical Address:</strong> {emp.physical_address || 'N/A'}</div>
                          <div><strong>Emergency Contact:</strong> {emp.emergency_contact_name || 'N/A'} <br/><span style={{color: '#64748b'}}>({emp.emergency_contact_phone || 'N/A'})</span></div>
                          <div><strong>Employment Type:</strong> {emp.employment_type || 'N/A'}</div>
                          
                          <div><strong>Base Salary:</strong> {Number(emp.base_salary).toLocaleString()} ETB</div>
                          <div><strong>Housing Allowance:</strong> {Number(emp.housing_allowance).toLocaleString()} ETB</div>
                          <div><strong>Transport Allowance:</strong> {Number(emp.transport_allowance).toLocaleString()} ETB</div>
                          
                          <div><strong>Bank Name:</strong> {emp.bank_name || 'N/A'}</div>
                          <div><strong>Bank Account:</strong> {emp.bank_account_number || 'N/A'}</div>
                          
                          <div><strong>Shift Time:</strong> {emp.shift_start_time || 'N/A'} - {emp.shift_end_time || 'N/A'}</div>
                          <div><strong>PC Access:</strong> {emp.has_pc_access || 'No'}</div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
              
              {filtered.length === 0 && !loading && (
                <tr>
                  <td colSpan="6" style={{ padding: '32px 16px', textAlign: 'center', color: '#64748b' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                      <Clock size={48} color="#cbd5e1" />
                      <div>No pending employee registrations waiting for approval.</div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default HREmployeesPending;
