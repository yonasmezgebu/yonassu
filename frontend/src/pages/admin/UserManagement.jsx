import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import adminService from '../../services/adminService';
import apiClient from '../../services/apiClient';
import { formatDate } from '../../utils/formatters';
import styles from './UserManagement.module.css';
import AddUserModal from './AddUserModal';
import AssignRolePanel from './AssignRolePanel';
import Modal from '../../components/ui/Modal';
import { playSound } from '../../services/notificationManager';

const BACKEND_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1').replace('/api/v1', '');
const resolvePhoto = (url) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  const cleanUrl = url.startsWith('/') ? url : `/${url}`;
  return `${BACKEND_URL}${cleanUrl}`;
};

const UserManagement = () => {
  const location = useLocation();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [assignPanelUser, setAssignPanelUser] = useState(null);
  const [currentUserRoles, setCurrentUserRoles] = useState([]);

  // Filters
  const [search, setSearch] = useState(() => location.state?.dashSearchTerm || '');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showDeleted, setShowDeleted] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageInput, setPageInput] = useState('');

  // Feedback
  const [toast, setToast] = useState(null);
  const [confirmBox, setConfirmBox] = useState(null);

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
    playSound(type === 'error' ? 'error' : 'success');
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchUsers = async (params = {}) => {
    setLoading(true);
    try {
      const response = await adminService.getUsers({
        search,
        roleId: roleFilter,
        statusId: statusFilter,
        page,
        limit: 10,
        includeDeleted: showDeleted,
        ...params
      });
      setUsers(response.data?.users || []);
      setTotalPages(response.data?.pagination?.totalPages || 1);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (page === 1) {
        fetchUsers({ page: 1 });
      } else {
        setPage(1);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  useEffect(() => {
    const handleDashSearch = (e) => {
      setSearch(e.detail || '');
    };
    window.addEventListener('dashboardSearch', handleDashSearch);
    return () => window.removeEventListener('dashboardSearch', handleDashSearch);
  }, []);

  const goToPage = (e) => {
    e.preventDefault();
    const p = parseInt(pageInput, 10);
    if (!Number.isNaN(p) && p >= 1 && p <= totalPages) {
      setPage(p);
    }
    setPageInput('');
  };

  const handleToggleActive = (userId, currentStatus) => {
    const newStatusId = String(currentStatus).toLowerCase() === 'active' ? 2 : 1; // 1 = active, 2 = inactive
    const action = newStatusId === 2 ? 'deactivate' : 'activate';
    setConfirmBox({
      message: `Are you sure you want to ${action} this user?`,
      danger: newStatusId === 2,
      onConfirm: async () => {
        try {
          await adminService.updateUser(userId, { statusId: newStatusId });
          showToast(`User ${action}d successfully.`);
          setUsers((prevUsers) => prevUsers.map(u => 
            u.id === userId ? { ...u, status_id: newStatusId, status_name: newStatusId === 1 ? 'Active' : 'Inactive' } : u
          ));
        } catch (error) {
          showToast(error.response?.data?.message || `Failed to ${action} user.`, 'error');
        }
      }
    });
  };

  const handleDelete = (userId) => {
    setConfirmBox({
      message: 'Are you sure you want to delete this user?',
      danger: true,
      onConfirm: async () => {
        try {
          await adminService.updateUserStatus(userId, { status: 'inactive' });
          showToast('User deleted.');
          setUsers((prevUsers) => prevUsers.map(u => 
            u.id === userId ? { ...u, deleted_at: new Date().toISOString() } : u
          ));
        } catch (error) {
          showToast(error.response?.data?.message || 'Failed to delete user.', 'error');
        }
      }
    });
  };

  const handleRestore = (userId) => {
    setConfirmBox({
      message: 'Are you sure you want to restore this deleted user?',
      danger: false,
      onConfirm: async () => {
        try {
          await adminService.updateUserStatus(userId, { status: 'active' });
          showToast('User restored.');
          setUsers((prevUsers) => prevUsers.map(u => 
            u.id === userId ? { ...u, deleted_at: null, status_id: 1, status_name: 'Active' } : u
          ));
        } catch (error) {
          showToast(error.response?.data?.message || 'Failed to restore user.', 'error');
        }
      }
    });
  };

  const handlePromoteToEmployee = (user) => {
    setConfirmBox({
      message: `Onboard "${user.fullName || user.full_name}" as an Employee?`,
      danger: false,
      onConfirm: async () => {
        try {
          await adminService.promoteToEmployee(user.id);
          showToast('User successfully onboarded as Employee!');
          fetchUsers();
        } catch (error) {
          showToast(error.response?.data?.message || 'Failed to promote user.', 'error');
        }
      }
    });
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
                      {resolvePhoto(user.profile_photo) ? (
                        <div className={styles.avatarSmall}>
                          <img src={resolvePhoto(user.profile_photo)} alt={user.fullName || user.full_name || 'avatar'} />
                        </div>
                      ) : (
                        <div className={styles.avatarSmall} style={{
                          background: user.is_employee
                            ? 'linear-gradient(135deg, #059669, #10b981)'
                            : 'linear-gradient(135deg, #9ca3af, #d1d5db)'
                        }}>
                          {user.fullName ? user.fullName.charAt(0) : (user.full_name ? user.full_name.charAt(0) : '?')}
                        </div>
                      )}
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
                    <label
                      className={styles.toggleSwitch}
                      style={user.deleted_at ? { opacity: 0.45, pointerEvents: 'none' } : { cursor: 'pointer' }}
                      title={user.deleted_at ? 'User is deleted' : ((user.status_name || user.status) === 'active' ? 'Click to deactivate' : 'Click to activate')}
                      onClick={(e) => {
                        if (user.deleted_at) return;
                        e.preventDefault();
                        const currentStatus = user.status_name || user.status;
                        handleToggleActive(user.id, currentStatus);
                      }}
                    >
                      <input
                        type="checkbox"
                        className={styles.toggleInput}
                        checked={String(user.status_name || user.status).toLowerCase() === 'active'}
                        readOnly
                        disabled={!!user.deleted_at}
                      />
                      <span className={styles.toggleSlider}></span>
                      <span className={styles.toggleLabel}>
                        {user.deleted_at ? 'deleted' : (user.status_name || user.status)}
                      </span>
                    </label>
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
                          {(isAdmin || isCEO) && (
                            <button
                              className={`${styles.btnIcon} ${styles.delete}`}
                              title="Delete user"
                              onClick={() => handleDelete(user.id)}
                            >
                              🗑 Delete
                            </button>
                          )}
                        </>
                      ) : (
                        <>
                          {(isAdmin || isCEO) && (
                            <button
                              className={styles.btnSecondary}
                              title="Restore deleted user"
                              onClick={() => handleRestore(user.id)}
                            >
                              ↩ Restore
                            </button>
                          )}
                        </>
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
          <form onSubmit={goToPage} className={styles.pageJump}>
            <input
              type="number"
              min="1"
              max={totalPages}
              value={pageInput}
              onChange={e => setPageInput(e.target.value)}
              placeholder="Page #"
              className={styles.pageInput}
              title="Enter a page number and press Enter to jump"
            />
            <button type="submit" className={styles.btnSecondary} title="Go to page">Go</button>
          </form>
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

      {/* In-app Confirmation */}
      {confirmBox && (
        <Modal isOpen onClose={() => setConfirmBox(null)} title="Confirm Action">
          <p className={styles.confirmText}>{confirmBox.message}</p>
          <div className={styles.confirmActions}>
            <button className={styles.btnSecondary} onClick={() => setConfirmBox(null)}>Cancel</button>
            <button
              className={confirmBox.danger ? styles.btnDanger : styles.btnPrimary}
              onClick={() => {
                const fn = confirmBox.onConfirm;
                setConfirmBox(null);
                if (fn) fn();
              }}
            >
              Confirm
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default UserManagement;
