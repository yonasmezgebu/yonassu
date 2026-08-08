import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import ceoService from '../../services/ceoService';
import CEOApprovalNav from '../ceo/CEOApprovalNav';
import { UserCheck, CheckCircle, XCircle, Search, Clock, Eye, ZoomIn, X } from 'lucide-react';
import SegmentedSpinner from '../../components/ui/SegmentedSpinner';

// Build the correct URL for a stored file path (e.g., "uploads\\hr\\id-photos\\file.jpg")
const buildFileUrl = (path) => {
  if (!path) return null;
  // Normalize backslashes → forward slashes
  const normalized = path.replace(/\\/g, '/');
  // If already a full URL, return as-is
  if (normalized.startsWith('http')) return normalized;
  // Strip any leading /api/v1 prefix that may have been incorrectly stored
  const clean = normalized.replace(/^\/?(api\/v1\/)?/, '');
  return `/${clean}`;
};

const HREmployeesPending = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [lightbox, setLightbox] = useState(null); // { url, label }
  const [confirmApproveId, setConfirmApproveId] = useState(null);
  const [approving, setApproving] = useState(false);


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
      setApproving(true);
      await ceoService.approveEmployeeRegistration(id);
      setConfirmApproveId(null);
      fetchPending();
    } catch (err) {
      console.error('Approve error', err);
      alert('Failed to approve registration.');
    } finally {
      setApproving(false);
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

  const location = useLocation();
  const isCeo = location.pathname.includes('/ceo/');

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      {isCeo && <CEOApprovalNav />}

      {/* ── LIGHTBOX POPUP ── */}
      {lightbox && (
        <div
          onClick={() => setLightbox(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.85)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            cursor: 'zoom-out',
          }}
        >
          <div style={{ position: 'absolute', top: 20, right: 24, color: 'white', cursor: 'pointer' }}
            onClick={() => setLightbox(null)}>
            <X size={32} />
          </div>
          <div style={{ fontSize: 13, color: '#cbd5e1', marginBottom: 12, letterSpacing: 1 }}>{lightbox.label}</div>
          <img
            src={lightbox.url}
            alt={lightbox.label}
            onClick={e => e.stopPropagation()}
            style={{
              maxWidth: '90vw', maxHeight: '80vh',
              borderRadius: 10, boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
              objectFit: 'contain', background: '#1e293b',
            }}
          />
        </div>
      )}

      {/* ── CONFIRM APPROVE MODAL ── */}
      {confirmApproveId && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{ background: 'white', padding: 32, borderRadius: 12, width: 400, boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
              <CheckCircle size={48} color="#10b981" />
            </div>
            <h3 style={{ margin: '0 0 12px', fontSize: 20, fontWeight: 'bold', color: '#0f172a', textAlign: 'center' }}>Confirm Approval</h3>
            <p style={{ margin: '0 0 24px', color: '#64748b', fontSize: 14, textAlign: 'center', lineHeight: '1.5' }}>
              Are you sure you want to approve this employee registration? This action will notify HR to proceed with finalizing the profile.
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button 
                onClick={() => setConfirmApproveId(null)}
                style={{ flex: 1, padding: '10px 16px', background: '#f1f5f9', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, color: '#475569' }}
              >
                Cancel
              </button>
              <button 
                onClick={() => handleApprove(confirmApproveId)}
                disabled={approving}
                style={{ flex: 1, padding: '10px 16px', background: '#10b981', color: 'white', border: 'none', borderRadius: 8, cursor: approving ? 'not-allowed' : 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: approving ? 0.75 : 1 }}
              >
                {approving
                  ? <><SegmentedSpinner size={16} color="#fff" trackColor="rgba(255,255,255,0.3)" speed={1.2} /> Approving…</>
                  : 'Confirm Approve'}
              </button>
            </div>
          </div>
        </div>
      )}

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
                          onClick={() => setConfirmApproveId(emp.employee_id)}
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
                          <div><strong>Education Level:</strong> {emp.education_level || 'N/A'} <br/><span style={{color: '#64748b'}}>({emp.field_of_study || 'N/A'})</span></div>
                          <div><strong>Institution:</strong> {emp.institution_name || 'N/A'} {emp.graduation_year ? `(${emp.graduation_year})` : ''}</div>
                          <div><strong>Employment Type:</strong> {emp.employment_type || 'N/A'}</div>
                          
                          <div><strong>Base Salary:</strong> {Number(emp.base_salary).toLocaleString()} ETB</div>
                          <div><strong>Housing Allowance:</strong> {Number(emp.housing_allowance).toLocaleString()} ETB</div>
                          <div><strong>Transport Allowance:</strong> {Number(emp.transport_allowance).toLocaleString()} ETB</div>
                          
                          <div><strong>Bank Name:</strong> {emp.bank_name || 'N/A'}</div>
                          <div><strong>Bank Account:</strong> {emp.bank_account_number || 'N/A'}</div>
                          
                          <div><strong>Shift Time:</strong> {emp.shift_start_time || 'N/A'} - {emp.shift_end_time || 'N/A'}</div>
                          <div><strong>PC Access:</strong> {emp.has_pc_access || 'No'}</div>
                          
                          {(emp.id_photo_front || emp.id_photo_back || emp.document_path) && (
                            <div style={{ gridColumn: '1 / -1', marginTop: 12, paddingTop: 12, borderTop: '1px solid #e2e8f0' }}>
                              <strong style={{ display: 'block', marginBottom: 10 }}>📎 Documents &amp; ID Photos:</strong>
                              <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                                {emp.id_photo_front && (() => {
                                  const url = buildFileUrl(emp.id_photo_front);
                                  return (
                                    <div>
                                      <div style={{ fontSize: 11, color: '#64748b', marginBottom: 6, fontWeight: 600 }}>ID Front</div>
                                      <div
                                        onClick={() => setLightbox({ url, label: `ID Front — ${emp.full_name}` })}
                                        style={{ cursor: 'zoom-in', position: 'relative', display: 'inline-block' }}
                                        title="Click to view full size"
                                      >
                                        <img
                                          src={url}
                                          alt="ID Front"
                                          onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }}
                                          style={{ height: 110, borderRadius: 8, border: '2px solid #bfdbfe', objectFit: 'contain', background: '#f8fafc', display: 'block' }}
                                        />
                                        <div style={{ display: 'none', height: 110, width: 140, borderRadius: 8, border: '2px dashed #e2e8f0', background: '#f1f5f9', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 12, flexDirection: 'column', gap: 4 }}>
                                          <ZoomIn size={20} color="#94a3b8" />
                                          Image not found
                                        </div>
                                        <div style={{ position: 'absolute', bottom: 4, right: 4, background: 'rgba(0,0,0,0.5)', borderRadius: 4, padding: '2px 6px' }}>
                                          <ZoomIn size={12} color="white" />
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })()}
                                {emp.id_photo_back && (() => {
                                  const url = buildFileUrl(emp.id_photo_back);
                                  return (
                                    <div>
                                      <div style={{ fontSize: 11, color: '#64748b', marginBottom: 6, fontWeight: 600 }}>ID Back</div>
                                      <div
                                        onClick={() => setLightbox({ url, label: `ID Back — ${emp.full_name}` })}
                                        style={{ cursor: 'zoom-in', position: 'relative', display: 'inline-block' }}
                                        title="Click to view full size"
                                      >
                                        <img
                                          src={url}
                                          alt="ID Back"
                                          onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }}
                                          style={{ height: 110, borderRadius: 8, border: '2px solid #bfdbfe', objectFit: 'contain', background: '#f8fafc', display: 'block' }}
                                        />
                                        <div style={{ display: 'none', height: 110, width: 140, borderRadius: 8, border: '2px dashed #e2e8f0', background: '#f1f5f9', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 12, flexDirection: 'column', gap: 4 }}>
                                          <ZoomIn size={20} color="#94a3b8" />
                                          Image not found
                                        </div>
                                        <div style={{ position: 'absolute', bottom: 4, right: 4, background: 'rgba(0,0,0,0.5)', borderRadius: 4, padding: '2px 6px' }}>
                                          <ZoomIn size={12} color="white" />
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })()}
                                {emp.document_path && (
                                  <div>
                                    <div style={{ fontSize: 11, color: '#64748b', marginBottom: 6, fontWeight: 600 }}>Additional Doc</div>
                                    <a
                                      href={buildFileUrl(emp.document_path)}
                                      target="_blank" rel="noreferrer"
                                      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: '#e2e8f0', borderRadius: 6, textDecoration: 'none', color: '#1e293b', fontSize: 13, fontWeight: 600 }}
                                    >
                                      View Document
                                    </a>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
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
