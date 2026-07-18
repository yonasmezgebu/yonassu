import React, { useState, useEffect, useCallback } from 'react';
import adminService from '../../services/adminService';
import apiClient from '../../services/apiClient';
import { formatDate } from '../../utils/formatters';
import styles from './UserManagement.module.css';
import AddUserModal from './AddUserModal';
import AssignRolePanel from './AssignRolePanel';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [assignPanelUser, setAssignPanelUser] = useState(null);
  const [currentUserRoles, setCurrentUserRoles] = useState([]);

  // Filters
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showDeleted, setShowDeleted] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Feedback
  const [toast, setToast] = useState(null);

  useEffect(() => {
    // Get current user's roles from local storage/auth context
    const stored = localStorage.getItem('user');
    if (stored) {
      try {
        const u = JSON.parse(stored);
        setCurrentUserRoles(u.roles || []);
      } catch { /* noop */ }
    }
    fetchUsers();
  }, [page, roleFilter, statusFilter, showDeleted]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await adminService.getUsers({
        search,
        roleId: roleFilter,
        statusId: statusFilter,
        page,
        limit: 10,
        includeDeleted: showDeleted
      });
      setUsers(response.data?.users || []);
      setTotalPages(response.data?.pagination?.totalPages || 1);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const handleStatusChange = async (userId, newStatus) => {
    if (!window.confirm(`Are you sure you want to ${newStatus === 'inactive' ? 'deactivate' : 'restore'} this user?`)) return;
    try {
      await adminService.updateUserStatus(userId, { status: newStatus });
      showToast(newStatus === 'inactive' ? 'User deactivated.' : 'User restored.');
      fetchUsers();
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to update user status.', 'error');
    }
  };

  const handlePromoteToEmployee = async (user) => {
    if (!window.confirm(`Onboard "${user.fullName || user.full_name}" as an Employee?`)) return;
    try {
      await adminService.promoteToEmployee(user.id);
      showToast('User successfully onboarded as Employee!');
      fetchUsers();
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to promote user.', 'error');
    }
  };

  const handleExport = async () => {
    try {
      const blob = await adminService.exportUsers({ search, roleId: roleFilter, statusId: statusFilter, includeDeleted: showDeleted });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `users_export_${new Date().getTime()}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      showToast('Export failed.', 'error');
    }
  };

  // Role visibility: which actions can the current user perform?
  const isCEO = currentUserRoles.includes('CEO');
  const isAdmin = currentUserRoles.includes('Admin');
  const isHRManager = currentUserRoles.includes('HR Manager');
  const isPharmacyManager = currentUserRoles.includes('Pharmacy Manager');
  const canPromoteToEmployee = isAdmin || isHRManager || isCEO;
  const canAssignRoles = isAdmin || isHRManager || isCEO || isPharmacyManager;
  const canCreateCustomRole = isAdmin || isCEO;

  const getEmployeeBadge = (user) => {
    if (user.is_employee) {
      return <span className={`${styles.badge} ${styles.employeeBadge}`} title="Onboarded Employee">👷 Employee</span>;
    }
    return <span className={`${styles.badge} ${styles.nonEmployeeBadge}`} title="Not yet onboarded as Employee">Not Onboarded</span>;
  };

  return (
    <div className={styles.userManagement}>
      {/* Toast Notification */}
      {toast && (
        <div className={`${styles.toast} ${styles[toast.type]}`}>
          {toast.type === 'error' ? '❌' : '✅'} {toast.message}
        </div>
      )}

      {/* Header */}
      <div className={styles.sectionHeader}>
        <div>
          <h2>User Management</h2>
          <p>Manage system access, roles, and employee onboarding</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button className={styles.btnSecondary} onClick={handleExport}>
            ↓ Export CSV
          </button>
          {canCreateCustomRole && (
            <button
              className={`${styles.btnSecondary} ${styles.btnCeo}`}
              onClick={() => setAssignPanelUser({ createCustomRole: true })}
            >
              ✦ Create Custom Role
            </button>
          )}
          <button className={styles.btnPrimary} onClick={() => { setSelectedUser(null); setShowAddModal(true); }}>
            + Add New User
          </button>
        </div>
      </div>

      {/* Role Hierarchy Legend */}
      <div className={styles.hierarchyBanner}>
        <div className={styles.hierarchyItem}>
          <span className={styles.hierarchyBadge} style={{ background: '#dbeafe', color: '#1e40af' }}>Step 1</span>
          <span>HR Manager or CEO onboards user as <strong>Employee</strong></span>
        </div>
        <span className={styles.hierarchyArrow}>→</span>
        <div className={styles.hierarchyItem}>
          <span className={styles.hierarchyBadge} style={{ background: '#dcfce7', color: '#166534' }}>Step 2</span>
          <span>Authorized role assigns a <strong>Job Role</strong> to the Employee</span>
        </div>
        <span className={styles.hierarchyArrow}>→</span>
        <div className={styles.hierarchyItem}>
          <span className={styles.hierarchyBadge} style={{ background: '#fef9c3', color: '#854d0e' }}>Branch</span>
          <span>Pharmacy Worker & Store Keepers require a <strong>branch selection</strong></span>
        </div>
      </div>

      {/* Filters */}
      <div className={styles.filterBar}>
        <form onSubmit={handleSearchSubmit} className={styles.searchForm}>
          <input
            type="text"
            className={styles.filterInput}
            placeholder="Search name, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="submit" className={styles.btnSecondary}>Search</button>
        </form>
        <select className={styles.filterInput} value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
          <option value="">All Roles</option>
          <option value="">Employee</option>
          <option value="">HR Manager</option>
          <option value="">Finance Manager</option>
          <option value="">Pharmacy Manager</option>
          <option value="">Pharmacy Worker</option>
          <option value="">Sales Manager</option>
          <option value="">Pharmacy Store Keeper</option>
          <option value="">General Store Keeper</option>
          <option value="">Customer</option>
        </select>
        <select className={styles.filterInput} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="1">Active</option>
          <option value="2">Inactive</option>
        </select>
        <label className={styles.checkboxLabel}>
          <input type="checkbox" checked={showDeleted} onChange={(e) => setShowDeleted(e.target.checked)} />
          Show Deleted
        </label>
      </div>

      {/* Table */}
      <div className={styles.tableContainer}>
        {loading ? (
          <div className={styles.loading}>Loading users...</div>
        ) : (
          <table className={styles.dataTable}>
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Department</th>
                <th>Employee Status</th>
                <th>Roles</th>
                <th>Status</th>
                <th>Last Login</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} style={{ opacity: user.deleted_at ? 0.6 : 1 }}>
                  <td>
                    <div className={styles.userCell}>
                      <div className={styles.avatarSmall} style={{
                        background: user.is_employee
                          ? 'linear-gradient(135deg, #059669, #10b981)'
                          : 'linear-gradient(135deg, #9ca3af, #d1d5db)'
                      }}>
                        {user.fullName ? user.fullName.charAt(0) : (user.full_name ? user.full_name.charAt(0) : '?')}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: '#111827' }}>
                          {user.fullName || user.full_name} {user.deleted_at && <span style={{ color: '#ef4444' }}>(Deleted)</span>}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>#{user.id}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ color: '#374151' }}>{user.email}</td>
                  <td style={{ color: '#6b7280' }}>{user.department_name || user.department || '—'}</td>
                  <td>{getEmployeeBadge(user)}</td>
                  <td>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {user.roles && user.roles.map((role, idx) => (
                        <span key={idx} className={`${styles.badge} ${styles.roleBadge}`} title={role.branch_name ? `Branch: ${role.branch_name}` : ''}>
                          {role.name || role}
                          {role.branch_name && <span style={{ fontSize: '0.65rem', opacity: 0.75 }}> @{role.branch_name}</span>}
                        </span>
                      ))}
                      {(!user.roles || user.roles.length === 0) && (
                        <span style={{ color: '#9ca3af', fontSize: '0.8rem' }}>No roles</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className={`${styles.badge} ${styles.statusBadge} ${styles[(user.status_name || user.status) === 'active' ? 'active' : 'inactive']}`}>
                      {user.status_name || user.status}
                    </span>
                  </td>
                  <td style={{ color: '#6b7280', fontSize: '0.8rem' }}>{formatDate(user.lastLogin || user.last_login)}</td>
                  <td>
                    <div className={styles.actionBtns}>
                      {!user.deleted_at ? (
                        <>
                          {/* Step 1: Promote to Employee */}
                          {canPromoteToEmployee && !user.is_employee && (
                            <button
                              className={`${styles.btnIcon} ${styles.promoteBtn}`}
                              title="Onboard as Employee (Step 1)"
                              onClick={() => handlePromoteToEmployee(user)}
                            >
                              👷 Onboard
                            </button>
                          )}
                          {/* Step 2: Assign / Manage Roles */}
                          {canAssignRoles && (
                            <button
                              className={`${styles.btnIcon} ${!user.is_employee ? styles.disabledBtn : styles.assignBtn}`}
                              title={!user.is_employee ? 'User must be onboarded as Employee first' : 'Assign / Manage Roles'}
                              onClick={() => user.is_employee && setAssignPanelUser(user)}
                              disabled={!user.is_employee}
                            >
                              🔑 Roles
                            </button>
                          )}
                          <button className={styles.btnIcon} title="Edit Profile" onClick={() => { setSelectedUser(user); setShowAddModal(true); }}>
                            ✏️ Edit
                          </button>
                          <button
                            className={`${styles.btnIcon} ${styles.delete}`}
                            title="Deactivate"
                            onClick={() => handleStatusChange(user.id, 'inactive')}
                          >
                            🗑 Delete
                          </button>
                        </>
                      ) : (
                        <button
                          className={styles.btnSecondary}
                          title="Restore"
                          onClick={() => handleStatusChange(user.id, 'active')}
                        >
                          ↩ Restore
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className={styles.pagination}>
          <button className={styles.btnSecondary} disabled={page === 1} onClick={() => setPage(page - 1)}>Prev</button>
          <span>Page {page} of {totalPages}</span>
          <button className={styles.btnSecondary} disabled={page === totalPages} onClick={() => setPage(page + 1)}>Next</button>
        </div>
      )}

      {/* Add/Edit User Modal */}
      <AddUserModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => { fetchUsers(); showToast('User saved successfully!'); }}
        initialData={selectedUser}
      />

      {/* Assign Role Panel */}
      {assignPanelUser && (
        <AssignRolePanel
          user={assignPanelUser.createCustomRole ? null : assignPanelUser}
          createCustomRole={!!assignPanelUser.createCustomRole}
          currentUserRoles={currentUserRoles}
          onClose={() => setAssignPanelUser(null)}
          onSuccess={(message) => {
            setAssignPanelUser(null);
            showToast(message || 'Role operation successful!');
            fetchUsers();
          }}
        />
      )}
    </div>
  );
};

export default UserManagement;
