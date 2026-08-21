import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import ceoService from '../../services/ceoService';
import CEOApprovalNav from '../ceo/CEOApprovalNav';
import { UserCheck, CheckCircle, XCircle, Search, Clock, Eye, ZoomIn, X } from 'lucide-react';
import SegmentedSpinner from '../../components/ui/SegmentedSpinner';

// Derive the uploads root from the backend origin (same host as the API).
// In dev Vite proxies /uploads → backend; in prod the API URL is already absolute.
const BACKEND_ORIGIN = (() => {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
  try { return new URL(apiUrl).origin; } catch { return 'http://localhost:5000'; }
})();

// Build the correct URL for a stored file path (e.g., "uploads\\hr\\id-photos\\file.jpg")
const buildFileUrl = (path) => {
  if (!path) return null;
  // Normalize backslashes → forward slashes
  const normalized = path.replace(/\\/g, '/');
  // If already a full URL, return as-is
  if (normalized.startsWith('http')) return normalized;
  // Strip any accidental leading slash so we can safely prepend origin + /
  const clean = normalized.replace(/^\/+/, '');
  return `${BACKEND_ORIGIN}/${clean}`;
};

const GlobalStyles = () => (
  <style>{`
    :root {
      --color-primary:#2563EB; --color-primary-hover:#1D4ED8;
      --color-bg-page:#F5F6FA; --color-bg-card:#FFFFFF; --color-border:#E5E7EB;
      --color-text-primary:#111827; --color-text-secondary:#6B7280; --color-text-muted:#9CA3AF;
      --color-success:#16A34A; --color-success-bg:#DCFCE7;
      --color-danger:#DC2626; --color-danger-bg:#FEE2E2;
      --color-warning:#D97706; --color-warning-bg:#FEF3C7;
      --color-info:#0284C7; --color-info-bg:#E0F2FE;
      --color-gold:#F59E0B;
    }
    .page-container { padding: 24px; background: var(--color-bg-page); min-height: 100vh; font-family: 'Inter', Segoe UI, Roboto, sans-serif; color: var(--color-text-primary); }
    .page-title { font-size: 24px; font-weight: 600; margin: 0; color: var(--color-text-primary); line-height: 1.3; display: flex; align-items: center; gap: 8px; }
    .page-subtitle { color: var(--color-text-secondary); margin: 4px 0 0; font-size: 14px; font-weight: 400; line-height: 1.5; }
    
    .card { background: var(--color-bg-card); border: 1px solid var(--color-border); border-radius: 10px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,.06); transition: all 150ms ease; margin-bottom: 20px; }
    .card:hover { box-shadow: 0 4px 12px rgba(0,0,0,.08); transform: translateY(-1px); }
    
    .btn { height: 36px; padding: 0 16px; border-radius: 8px; font-size: 14px; font-weight: 500; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 8px; transition: all 150ms ease-in-out; border: 1px solid transparent; outline: none; }
    .btn:disabled { opacity: 0.5; cursor: not-allowed; }
    
    .btn-primary { background: var(--color-success); color: white; }
    .btn-primary:hover:not(:disabled) { background: var(--color-gold); color: white; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,.08); }
    
    .btn-danger { background: var(--color-danger); color: white; }
    .btn-danger:hover:not(:disabled) { background: var(--color-gold); color: white; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,.08); }
    
    .btn-ghost { background: var(--color-bg-page); border: 1px solid var(--color-border); color: var(--color-text-secondary); }
    .btn-ghost:hover:not(:disabled) { background: var(--color-gold); color: white; border-color: var(--color-gold); transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,.08); }

    .btn-outline-danger { background: var(--color-danger-bg); border: 1px solid var(--color-danger); color: var(--color-danger); }
    .btn-outline-danger:hover:not(:disabled) { background: var(--color-gold); color: white; border-color: var(--color-gold); transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,.08); }

    .btn-outline-success { background: var(--color-success-bg); border: 1px solid var(--color-success); color: var(--color-success); }
    .btn-outline-success:hover:not(:disabled) { background: var(--color-gold); color: white; border-color: var(--color-gold); transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,.08); }
    
    .table-container { width: 100%; overflow-x: auto; min-width: 700px; background: var(--color-bg-card); border-radius: 10px; border: 1px solid var(--color-border); box-shadow: 0 1px 3px rgba(0,0,0,.06); }
    .table-container:hover { box-shadow: 0 4px 12px rgba(0,0,0,.08); transform: translateY(-1px); }
    
    table { width: 100%; border-collapse: collapse; text-align: left; font-size: 14px; }
    th { background: #F9FAFB; padding: 12px 16px; color: var(--color-text-muted); font-size: 12px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.03em; border-bottom: 2px solid var(--color-border); }
    td { padding: 14px 16px; border-bottom: 1px solid var(--color-border); color: var(--color-text-primary); }
    tr { transition: background 150ms ease; }
    tbody tr:hover { background: #F9FAFB; }
    
    .badge { display: inline-flex; align-items: center; justify-content: center; padding: 2px 10px; border-radius: 9999px; font-size: 12px; font-weight: 500; white-space: nowrap; }
    
    .input-field { height: 36px; border-radius: 8px; border: 1px solid var(--color-border); padding: 0 12px; outline: none; transition: all 150ms ease; font-size: 14px; background: var(--color-bg-card); color: var(--color-text-primary); }
    .input-field:focus { border-color: var(--color-primary); box-shadow: 0 0 0 3px rgba(37,99,235,.1); }
    
    .modal-overlay { position: fixed; inset: 0; z-index: 9999; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; padding: 16px; }
    .modal-content { background: var(--color-bg-card); padding: 32px; border-radius: 12px; width: 100%; max-width: 400px; box-shadow: 0 20px 40px rgba(0,0,0,0.2); }
    
    @media (max-width: 1024px) {
      .page-container { padding: 16px; }
    }
    @media (max-width: 768px) {
      .page-container { padding: 12px; }
    }
  `}</style>
);

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
    <div className="page-container">
      <GlobalStyles />
      {isCeo && <CEOApprovalNav mode="employee" />}

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
                className="btn btn-ghost" style={{ flex: 1 }}
              >
                Cancel
              </button>
              <button 
                onClick={() => handleApprove(confirmApproveId)}
                disabled={approving}
                className="btn btn-primary" style={{ flex: 1 }}
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
          <h1 className="page-title">
            <UserCheck color="#10b981" size={28}/> EMPLOYEE REGISTRATIONS AWAITING APPROVAL
          </h1>
          <p className="page-subtitle">Review all newly registered employees before HR finalizes their profile</p>
        </div>
      </div>

      {/* FILTERS */}
      <div className="card" style={{ display: 'flex', gap: 16, marginBottom: 24, alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, background: '#f1f5f9', padding: '8px 12px', borderRadius: 6 }}>
          <Search size={16} color="#64748b" />
          <input 
            type="text" 
            placeholder="Search by name or ID..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field" style={{ border: 'none', background: 'transparent', width: '100%', padding: 0 }}
          />
        </div>
        <div style={{ color: '#64748b', fontSize: 14, fontWeight: 'bold' }}>
          Total Pending: <span style={{ color: '#f59e0b' }}>{employees.length}</span>
        </div>
      </div>

      {/* MAIN TABLE */}
      <div className="table-container">
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
                          className="btn btn-ghost"
                        >
                          <Eye size={16}/> {expandedId === emp.employee_id ? 'Hide Details' : 'Details'}
                        </button>
                        <button 
                          onClick={() => setConfirmApproveId(emp.employee_id)}
                          className="btn btn-outline-success"
                        >
                          <CheckCircle size={16}/> Approve
                        </button>
                        <button 
                          onClick={() => {
                            setRejectingId(rejectingId === emp.employee_id ? null : emp.employee_id);
                            if (expandedId === emp.employee_id) setExpandedId(null);
                          }}
                          className="btn btn-outline-danger"
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
                            className="input-field" style={{ flex: 1 }}
                            autoFocus
                          />
                          <button 
                            onClick={() => handleReject(emp.employee_id)}
                            className="btn btn-danger"
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
