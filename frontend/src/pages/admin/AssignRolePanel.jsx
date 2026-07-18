import React, { useState, useEffect } from 'react';
import Modal from '../../components/ui/Modal';
import adminService from '../../services/adminService';
import apiClient from '../../services/apiClient';

/**
 * AssignRolePanel
 *
 * Handles Step 2 of the two-step onboarding model:
 *  - Displays roles the logged-in user is authorized to assign
 *  - Enforces Employee precondition gate visually (and backed by API)
 *  - Shows branch selector for branch-scoped roles (Pharmacy Worker, Store Manager → Pharmacy Store)
 *  - Allows CEO to create a custom role (when createCustomRole=true)
 *  - Shows current role assignments with a Revoke button
 */
const AssignRolePanel = ({ user, createCustomRole, currentUserRoles, onClose, onSuccess }) => {
  const [allRoles, setAllRoles] = useState([]);
  const [branches, setBranches] = useState([]);
  const [currentAssignments, setCurrentAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Assignment form state
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [selectedSubRole, setSelectedSubRole] = useState('');

  // Custom role form state
  const [customRoleName, setCustomRoleName] = useState('');
  const [customRoleDesc, setCustomRoleDesc] = useState('');
  const [customBranchScoped, setCustomBranchScoped] = useState(false);
  const [customAssignUserId, setCustomAssignUserId] = useState('');
  const [customBranchId, setCustomBranchId] = useState('');
  const [allUsers, setAllUsers] = useState([]);

  // Derive current user's authority
  const isAdmin = currentUserRoles.includes('Admin');
  const isCEO = currentUserRoles.includes('CEO');
  const isHRManager = currentUserRoles.includes('HR Manager');
  const isPharmacyManager = currentUserRoles.includes('Pharmacy Manager');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [rolesRes, branchesRes] = await Promise.all([
        apiClient.get('/users/roles'),
        adminService.getBranches().catch(() => ({ data: [] }))
      ]);
      const fetchedRoles = rolesRes.data?.roles || [];
      const fetchedBranches = branchesRes.data || branchesRes.data?.data || [];
      setAllRoles(fetchedRoles);
      setBranches(Array.isArray(fetchedBranches) ? fetchedBranches : []);

      if (user && user.id) {
        // Load current role assignments for this user
        const userRes = await apiClient.get(`/users/${user.id}`);
        setCurrentAssignments(userRes.data?.data?.user?.roles || []);
      }

      if (createCustomRole) {
        // Load employees for the assignment dropdown
        const usersRes = await adminService.getUsers({ page: 1, limit: 100 });
        const employees = (usersRes.data?.users || []).filter(u => u.is_employee);
        setAllUsers(employees);
      }
    } catch (err) {
      setError('Failed to load data: ' + (err.message || ''));
    } finally {
      setLoading(false);
    }
  };

  /**
   * Filter roles by what the current user is allowed to assign.
   * This mirrors the backend authority matrix (so UI is accurate without being the sole gate).
   */
  const getAssignableRoles = () => {
    if (isAdmin) return allRoles;
    return allRoles.filter(role => {
      if (role.isPreExisting) return false;
      if (isCEO && ['HR Manager', 'Pharmacy Store Keeper', 'General Store Keeper'].includes(role.name)) return true;
      if (isHRManager && [
        'Employee', 'Finance Manager', 'Accountant', 'Cashier', 'Admin',
        'Pharmacy Manager', 'Car Rental Manager', 'Printing Supervisor',
        'Sales Manager', 'Purchase Manager'
      ].includes(role.name)) return true;
      if (isPharmacyManager && role.name === 'Pharmacy Worker') return true;
      return false;
    });
  };

  const assignableRoles = getAssignableRoles();

  const selectedRole = allRoles.find(r => String(r.id) === String(selectedRoleId));
  const needsBranch = selectedRole && (selectedRole.branchScoped || selectedRole.branch_scoped);
  const hasSubRoles = selectedRole && selectedRole.subRoles && selectedRole.subRoles.length > 0;

  const handleAssignRole = async (e) => {
    e.preventDefault();
    setError('');
    if (!selectedRoleId) { setError('Please select a role.'); return; }
    if (needsBranch && !selectedBranchId) { setError('Please select a branch for this role.'); return; }

    setSubmitting(true);
    try {
      await adminService.assignRole(
        user.id,
        parseInt(selectedRoleId),
        selectedBranchId ? parseInt(selectedBranchId) : null,
        selectedSubRole || null
      );
      onSuccess(`Role "${selectedRole?.name}" assigned to ${user.full_name || user.fullName} successfully!`);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to assign role.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRevokeRole = async (roleId, roleName) => {
    if (!window.confirm(`Remove the "${roleName}" role from this user?`)) return;
    try {
      await adminService.revokeRole(user.id, roleId);
      // Refresh current assignments
      const userRes = await apiClient.get(`/users/${user.id}`);
      setCurrentAssignments(userRes.data?.data?.user?.roles || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to revoke role.');
    }
  };

  const handleCreateCustomRole = async (e) => {
    e.preventDefault();
    setError('');
    if (!customRoleName.trim()) { setError('Please enter a role name.'); return; }
    setSubmitting(true);
    try {
      await adminService.createCustomRole({
        name: customRoleName.trim(),
        description: customRoleDesc,
        branchScoped: customBranchScoped,
        assignToUserId: customAssignUserId ? parseInt(customAssignUserId) : null,
        branchId: customBranchId ? parseInt(customBranchId) : null
      });
      onSuccess(`Custom role "${customRoleName}" created successfully!`);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to create custom role.');
    } finally {
      setSubmitting(false);
    }
  };

  const modalTitle = createCustomRole
    ? '✦ Create Custom Role (CEO Only)'
    : `🔑 Assign Role — ${user?.full_name || user?.fullName}`;

  return (
    <Modal isOpen={true} onClose={onClose} title={modalTitle}>
      {loading ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>Loading role data...</div>
      ) : createCustomRole ? (
        /* ── Custom Role Creation Form ── */
        <form onSubmit={handleCreateCustomRole}>
          {error && <div style={errorStyle}>{error}</div>}
          <InfoBox>
            🟡 <strong>CEO Only</strong>: Create a brand-new custom role that can then be assigned to any existing Employee.
          </InfoBox>
          <FormGroup label="Role Name *">
            <input
              type="text"
              value={customRoleName}
              onChange={e => setCustomRoleName(e.target.value)}
              placeholder="e.g. Regional Coordinator"
              required
              style={inputStyle}
            />
          </FormGroup>
          <FormGroup label="Description">
            <textarea
              value={customRoleDesc}
              onChange={e => setCustomRoleDesc(e.target.value)}
              rows={2}
              placeholder="Brief description of responsibilities..."
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </FormGroup>
          <FormGroup label="">
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={customBranchScoped}
                onChange={e => setCustomBranchScoped(e.target.checked)}
              />
              <span>Branch-scoped role (user will be tied to a specific branch)</span>
            </label>
          </FormGroup>
          <FormGroup label="Immediately Assign To (Employee)">
            <select value={customAssignUserId} onChange={e => setCustomAssignUserId(e.target.value)} style={inputStyle}>
              <option value="">— Select employee (optional) —</option>
              {allUsers.map(u => (
                <option key={u.id} value={u.id}>{u.full_name || u.fullName} ({u.email})</option>
              ))}
            </select>
          </FormGroup>
          {customBranchScoped && customAssignUserId && (
            <FormGroup label="Branch">
              <select value={customBranchId} onChange={e => setCustomBranchId(e.target.value)} style={inputStyle} required>
                <option value="">Select branch</option>
                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </FormGroup>
          )}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" onClick={onClose} style={cancelBtnStyle} disabled={submitting}>Cancel</button>
            <button type="submit" style={submitBtnStyle(false)} disabled={submitting}>
              {submitting ? 'Creating...' : '✦ Create Role'}
            </button>
          </div>
        </form>
      ) : (
        /* ── Role Assignment Form ── */
        <div>
          {error && <div style={errorStyle}>{error}</div>}

          {/* Employee Precondition Gate Notice */}
          {!user?.is_employee && (
            <div style={gateStyle}>
              <span style={{ fontSize: '1.5rem' }}>🔒</span>
              <div>
                <strong>Employee onboarding required</strong>
                <p style={{ margin: '4px 0 0', fontSize: '0.875rem', color: '#92400e' }}>
                  This user must first be onboarded as an <strong>Employee</strong> by HR Manager or CEO before any job role can be assigned.
                </p>
              </div>
            </div>
          )}

          {/* Current Role Assignments */}
          {currentAssignments.length > 0 && (
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                Current Roles
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {currentAssignments.map((role) => (
                  <div key={role.id} style={rolePillStyle}>
                    <span>{role.name}</span>
                    {role.branch_name && (
                      <span style={{ fontSize: '0.7rem', color: '#6b7280', marginLeft: '4px' }}>@{role.branch_name}</span>
                    )}
                    <button
                      onClick={() => handleRevokeRole(role.id, role.name)}
                      style={revokeBtnStyle}
                      title="Remove this role"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Assign New Role Form */}
          {user?.is_employee ? (
            <form onSubmit={handleAssignRole}>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
                Assign New Role
              </div>
              <FormGroup label="Role *">
                <select
                  value={selectedRoleId}
                  onChange={e => { setSelectedRoleId(e.target.value); setSelectedBranchId(''); setSelectedSubRole(''); }}
                  required
                  style={inputStyle}
                >
                  <option value="">— Select a role to assign —</option>
                  {assignableRoles.map(role => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                      {role.branchScoped ? ' (branch-scoped)' : ''}
                    </option>
                  ))}
                </select>
                {assignableRoles.length === 0 && (
                  <div style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: '4px' }}>
                    No roles available for your authority level.
                  </div>
                )}
              </FormGroup>

              {/* Sub-role picker */}
              {hasSubRoles && (
                <FormGroup label="Sub-Role *">
                  <select
                    value={selectedSubRole}
                    onChange={e => setSelectedSubRole(e.target.value)}
                    required
                    style={inputStyle}
                  >
                    <option value="">— Select sub-role —</option>
                    {selectedRole.subRoles.map(sr => (
                      <option key={sr} value={sr}>{sr}</option>
                    ))}
                  </select>
                </FormGroup>
              )}

              {/* Branch selector (for branch-scoped roles) */}
              {needsBranch && (
                <FormGroup label="Branch *">
                  <select
                    value={selectedBranchId}
                    onChange={e => setSelectedBranchId(e.target.value)}
                    required
                    style={inputStyle}
                  >
                    <option value="">— Select branch —</option>
                    {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                  <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '4px' }}>
                    This role is branch-scoped. The user will only have access to resources in the selected branch.
                  </div>
                </FormGroup>
              )}



              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" onClick={onClose} style={cancelBtnStyle} disabled={submitting}>Cancel</button>
                <button type="submit" style={submitBtnStyle(false)} disabled={submitting || !selectedRoleId}>
                  {submitting ? 'Assigning...' : '🔑 Assign Role'}
                </button>
              </div>
            </form>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <button type="button" onClick={onClose} style={cancelBtnStyle}>Close</button>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
};

// ── Helpers ──────────────────────────────────────────────────────────────────

const FormGroup = ({ label, children }) => (
  <div style={{ marginBottom: '1rem' }}>
    {label && <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.35rem' }}>{label}</label>}
    {children}
  </div>
);

const InfoBox = ({ children }) => (
  <div style={{ background: '#fefce8', border: '1px solid #fde047', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1rem', fontSize: '0.875rem', color: '#713f12', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
    {children}
  </div>
);

const inputStyle = {
  width: '100%',
  padding: '0.55rem 0.75rem',
  borderRadius: '8px',
  border: '1px solid #e5e7eb',
  background: '#f9fafb',
  fontSize: '0.875rem',
  color: '#111827',
  outline: 'none',
  boxSizing: 'border-box'
};

const errorStyle = {
  background: '#fef2f2',
  border: '1px solid #fecaca',
  borderRadius: '8px',
  padding: '0.75rem 1rem',
  color: '#dc2626',
  fontSize: '0.875rem',
  marginBottom: '1rem'
};

const gateStyle = {
  background: '#fffbeb',
  border: '1px solid #fbbf24',
  borderRadius: '10px',
  padding: '1rem',
  marginBottom: '1.25rem',
  display: 'flex',
  gap: '12px',
  alignItems: 'flex-start'
};

const rolePillStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  background: '#e0e7ff',
  color: '#3730a3',
  borderRadius: '9999px',
  padding: '4px 10px',
  fontSize: '0.8125rem',
  fontWeight: 600
};

const revokeBtnStyle = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  color: '#6366f1',
  fontWeight: 700,
  fontSize: '1rem',
  padding: '0 2px',
  lineHeight: 1,
  borderRadius: '50%'
};

const cancelBtnStyle = {
  padding: '0.55rem 1.1rem',
  background: '#f9fafb',
  color: '#374151',
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  fontWeight: 500,
  fontSize: '0.875rem',
  cursor: 'pointer'
};

const submitBtnStyle = (disabled) => ({
  padding: '0.55rem 1.25rem',
  background: disabled ? '#d1d5db' : '#111827',
  color: '#ffffff',
  border: 'none',
  borderRadius: '8px',
  fontWeight: 600,
  fontSize: '0.875rem',
  cursor: disabled ? 'not-allowed' : 'pointer'
});

export default AssignRolePanel;
