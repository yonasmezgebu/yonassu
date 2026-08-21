import React, { useState, useEffect, useRef } from 'react';
import Modal from '../../components/ui/Modal';
import apiClient from '../../services/apiClient';
const BACKEND_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1').replace('/api/v1', '');
const resolvePhoto = (url) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  const cleanUrl = url.startsWith('/') ? url : `/${url}`;
  return `${BACKEND_URL}${cleanUrl}`;
};
const AddUserModal = ({ isOpen, onClose, onSuccess, initialData = null }) => {
  const [formData, setFormData] = useState(initialData || {
    fullName: '',
    email: '',
    phone: '',
    departmentId: '',
    roleIds: [],
    is_employee: false
  });
  const [departments, setDepartments] = useState([]);
  const [rolesList, setRolesList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const photoInputRef = useRef(null);
  useEffect(() => {
    if (isOpen) {
      fetchDropdownData();
      setPhotoFile(null);
      setPhotoPreview(null);
    }
  }, [isOpen]);
  useEffect(() => {
    if (initialData) {
      setFormData({
        fullName: initialData.fullName || '',
        email: initialData.email || '',
        phone: initialData.phone || '',
        departmentId: initialData.departmentId || '',
        roleIds: initialData.roles ? initialData.roles.map(r => r.id || r) : [],
        is_employee: initialData.is_employee || false
      });
    } else {
      setFormData({
        fullName: '',
        email: '',
        phone: '',
        departmentId: departments.length > 0 ? departments[0].id : '',
        roleIds: [],
        is_employee: false
      });
    }
  }, [initialData, departments, isOpen]);
  const fetchDropdownData = async () => {
    try {
      const [deptRes, roleRes] = await Promise.all([
        apiClient.get('/users/departments'),
        apiClient.get('/users/roles')
      ]);
      setDepartments(deptRes.data?.departments || []);
      setRolesList(roleRes.data?.roles || []); 
    } catch (err) {
      console.error('Failed to fetch departments/roles', err);
    }
  };
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
  };
  const handleRoleChange = (e) => {
    const selectedRoleId = Number(e.target.value);
    setFormData(prev => {
      const newData = { ...prev, roleIds: [selectedRoleId] };
      // Try to auto-select department based on role name
      const selectedRole = rolesList.find(r => r.id === selectedRoleId);
      if (selectedRole) {
        // Find a matching department
        // e.g. "Pharmacy Manager" -> "Pharmacy"
        const matchingDept = departments.find(d => 
          selectedRole.name.toLowerCase().includes(d.name.toLowerCase()) || 
          d.name.toLowerCase().includes(selectedRole.name.toLowerCase().split(' ')[0])
        );
        if (matchingDept) {
          newData.departmentId = matchingDept.id;
        }
      }
      return newData;
    });
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (initialData) {
        // Build payload — only include fields that are non-empty
        // so blank input = "keep existing value" instead of overwriting
        const payload = {};
        if (formData.fullName && formData.fullName.trim())       payload.fullName     = formData.fullName.trim();
        if (formData.email    && formData.email.trim())          payload.email        = formData.email.trim();
        if (formData.phone    && formData.phone.trim())          payload.phone        = formData.phone.trim();
        if (formData.departmentId)                               payload.departmentId = formData.departmentId;
        if (formData.roleIds  && formData.roleIds.length > 0)    payload.roleIds      = formData.roleIds;
        if (formData.password && formData.password.trim())       payload.password     = formData.password.trim();
        payload.is_employee = formData.is_employee;

        await apiClient.put(`/users/${initialData.id}`, payload);

        // Upload photo if a new one was selected
        if (photoFile) {
          setPhotoUploading(true);
          const fd = new FormData();
          fd.append('photo', photoFile);
          await apiClient.post(`/users/${initialData.id}/profile-photo`, fd);
          setPhotoUploading(false);
        }
      } else {
        await apiClient.post('/users', formData);
      }
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to save user');
    } finally {
      setLoading(false);
      setPhotoUploading(false);
    }
  };
  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={initialData ? 'Edit User' : 'Add New User'}
    >
      <form onSubmit={handleSubmit}>
        {error && <div className="error-message mb-4" style={{color: 'red'}}>{error}</div>}
        {/* Profile Photo Upload (Edit mode only) */}
        {initialData && (
          <div className="form-group mb-4" style={{ textAlign: 'center' }}>
            <div
              style={{
                width: 80, height: 80, borderRadius: '50%', margin: '0 auto 8px',
                background: (photoPreview || resolvePhoto(initialData.profile_photo)) ? 'transparent' : 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 28, fontWeight: 700, color: 'white',
                cursor: 'pointer', position: 'relative', overflow: 'hidden',
                boxShadow: '0 4px 12px rgba(59,130,246,0.25)', border: '3px solid #e2e8f0'
              }}
              onClick={() => photoInputRef.current?.click()}
              title="Click to change profile photo"
            >
              {photoPreview || resolvePhoto(initialData.profile_photo) ? (
                <img src={photoPreview || resolvePhoto(initialData.profile_photo)} alt="Avatar"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
              ) : (
                (initialData.fullName || initialData.full_name || '?').charAt(0).toUpperCase()
              )}
            </div>
            <input
              type="file" ref={photoInputRef} accept="image/jpeg,image/png,image/webp"
              style={{ display: 'none' }}
              onChange={e => {
                const f = e.target.files[0];
                if (!f) return;
                setPhotoFile(f);
                setPhotoPreview(URL.createObjectURL(f));
              }}
            />
          </div>
        )}
        <div className="form-group mb-4">
          <label>Full Name</label>
          <input 
            type="text" 
            name="fullName" 
            value={formData.fullName} 
            onChange={handleChange} 
            required={!initialData}
            placeholder={initialData ? 'Leave blank to keep current name' : ''}
            className="w-full"
            style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem', borderRadius: '4px', border: '1px solid #ddd' }}
          />
        </div>
        <div className="grid-2 gap-4 mb-4" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <div className="form-group">
            <label>Email</label>
            <input 
              type="email" 
              name="email" 
              value={formData.email} 
              onChange={handleChange} 
              required={!initialData}
              placeholder={initialData ? 'Leave blank to keep current email' : ''}
              style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem', borderRadius: '4px', border: '1px solid #ddd' }}
            />
          </div>
          <div className="form-group">
            <label>Phone Number</label>
            <input 
              type="text" 
              name="phone" 
              value={formData.phone} 
              onChange={handleChange} 
              required={!initialData}
              placeholder={initialData ? 'Leave blank to keep current phone' : ''}
              style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem', borderRadius: '4px', border: '1px solid #ddd' }}
            />
          </div>
        </div>
        <div className="grid-2 gap-4 mb-4" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <div className="form-group">
            <label>Department</label>
            <select 
              name="departmentId" 
              value={formData.departmentId} 
              onChange={handleChange}
              required
              style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem', borderRadius: '4px', border: '1px solid #ddd' }}
            >
              <option value="">Select Department</option>
              {departments.map(dept => (
                <option key={dept.id} value={dept.id}>{dept.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>{initialData ? 'Change Password (leave blank to keep)' : 'Initial Password'}</label>
            <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
              <input 
                type={showPassword ? "text" : "password"} 
                name="password" 
                value={formData.password || ''} 
                onChange={handleChange} 
                required={!initialData} 
                minLength={8}
                style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem', borderRadius: '4px', border: '1px solid #ddd' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: '10px', top: '15px', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>
        </div>
        <div className="form-group mb-4">
          <label>Role</label>
          <select 
            name="roleIds" 
            value={formData.roleIds.length > 0 ? formData.roleIds[0] : ''} 
            onChange={handleRoleChange}
            required
            disabled={!formData.departmentId}
            style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem', borderRadius: '4px', border: '1px solid #ddd', background: !formData.departmentId ? '#f3f4f6' : 'white' }}
          >
            <option value="">{formData.departmentId ? 'Select Role' : 'Select Department First'}</option>
            {(() => {
              if (!formData.departmentId) return null;
              const deptId = Number(formData.departmentId);
              const filteredRoles = rolesList.filter(role => {
                const name = role.name.toLowerCase();
                // Always allow the universal "Employee" role for any department
                if (name === 'employee') return true;
                
                switch (deptId) {
                  case 1: return name.includes('admin') || name.includes('hr manager');
                  case 2: return name.includes('ceo') || name.includes('board');
                  case 3: return name.includes('finance') || name.includes('accountant') || name === 'cashier'; 
                  case 4: return name.includes('printing');
                  case 5: return name.includes('purchase');
                  case 6: return name.includes('sales');
                  case 7: return name.includes('store keeper') && !name.includes('pharmacy');
                  case 8: return name.includes('customer');
                  case 9: return name.includes('farm');
                  case 10: return name.includes('pharmacy');
                  case 11: return name.includes('car rent');
                  default: return true;
                }
              });
              return filteredRoles.map(role => (
                <option key={role.id} value={role.id}>{role.name}</option>
              ));
            })()}
          </select>
        </div>
        <div className="form-group mb-4" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input 
            type="checkbox" 
            name="is_employee" 
            id="is_employee"
            checked={formData.is_employee}
            onChange={handleChange}
            style={{ width: '18px', height: '18px' }}
          />
          <label htmlFor="is_employee" style={{ margin: 0, fontWeight: 600 }}>Onboarded as Employee</label>
        </div>
        <div className="modal-form-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
          <button type="button" onClick={onClose} disabled={loading} style={{ padding: '0.5rem 1rem', background: '#f3f4f6', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            Cancel
          </button>
          <button type="submit" disabled={loading} style={{ padding: '0.5rem 1rem', background: '#2563eb', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            {loading ? 'Saving...' : 'Save User'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
export default AddUserModal;
