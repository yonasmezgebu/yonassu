import React, { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';
import { useAuth } from '../../hooks/useAuth';

const BACKEND_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1').replace('/api/v1', '');
const resolvePhoto = (url) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  const clean = url.startsWith('/') ? url : `/${url}`;
  return `${BACKEND_URL}${clean}`;
};

const inputStyle = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: 8,
  border: '1px solid #cbd5e1',
  fontSize: 14,
  color: '#1e293b',
  outline: 'none',
  boxSizing: 'border-box',
  background: 'white'
};
const disabledInputStyle = { ...inputStyle, background: '#f8fafc', color: '#94a3b8', cursor: 'not-allowed' };
const labelStyle = { display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: '#374151' };
const Alert = ({ type, text }) => (
  <div style={{
    padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 14,
    background: type === 'error' ? '#fee2e2' : '#dcfce7',
    color: type === 'error' ? '#dc2626' : '#16a34a',
    border: `1px solid ${type === 'error' ? '#fca5a5' : '#86efac'}`
  }}>
    {type === 'error' ? '⚠️ ' : '✅ '}{text}
  </div>
);

const UserProfile = () => {
  const { user: authUser, updateUser } = useAuth();

  // --- Password Gate ---
  const [gatePassword, setGatePassword] = useState('');
  const [gateLoading, setGateLoading] = useState(false);
  const [gateError, setGateError] = useState('');
  const [unlocked, setUnlocked] = useState(false);

  // --- Profile form ---
  const [profile, setProfile] = useState({ fullName: '', email: '', phone: '' });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMsg, setProfileMsg] = useState({ type: '', text: '' });

  // --- Password change form ---
  const [pwdForm, setPwdForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdMsg, setPwdMsg] = useState({ type: '', text: '' });

  // Fetch own profile via /auth/me after unlocking
  useEffect(() => {
    if (!unlocked) return;
    const fetchMe = async () => {
      try {
        const res = await apiClient.get('/auth/me');
        const u = res?.data?.data?.user || res?.data?.data || {};
        setProfile({
          fullName: u.fullName || u.full_name || '',
          email: u.email || '',
          phone: u.phone || ''
        });
      } catch {
        setProfileMsg({ type: 'error', text: 'Failed to load profile data' });
      }
    };
    fetchMe();
  }, [unlocked]);

  const handleGateSubmit = async (e) => {
    e.preventDefault();
    setGateLoading(true);
    setGateError('');
    try {
      await apiClient.post('/auth/verify-password', { password: gatePassword });
      setUnlocked(true);
    } catch (err) {
      setGateError(err.response?.data?.message || 'Incorrect password. Please try again.');
    } finally {
      setGateLoading(false);
    }
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileMsg({ type: '', text: '' });
    try {
      await apiClient.put(`/users/${authUser.id}`, profile);
      updateUser({ fullName: profile.fullName, email: profile.email });
      setProfileMsg({ type: 'success', text: 'Profile updated successfully!' });
    } catch (err) {
      setProfileMsg({ type: 'error', text: err.response?.data?.message || 'Failed to update profile.' });
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSave = async (e) => {
    e.preventDefault();
    setPwdMsg({ type: '', text: '' });
    if (pwdForm.newPassword !== pwdForm.confirmPassword) {
      setPwdMsg({ type: 'error', text: 'New passwords do not match.' });
      return;
    }
    if (pwdForm.newPassword.length < 8) {
      setPwdMsg({ type: 'error', text: 'Password must be at least 8 characters.' });
      return;
    }
    setPwdLoading(true);
    try {
      await apiClient.post('/auth/change-password', {
        currentPassword: pwdForm.currentPassword,
        newPassword: pwdForm.newPassword
      });
      setPwdMsg({ type: 'success', text: 'Password changed successfully!' });
      setPwdForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setPwdMsg({ type: 'error', text: err.response?.data?.message || 'Failed to change password.' });
    } finally {
      setPwdLoading(false);
    }
  };

  const card = {
    background: 'white',
    padding: 28,
    borderRadius: 14,
    boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
    marginBottom: 24
  };

  // ─── Password Gate (locked state) ───────────────────────────────────────────
  if (!unlocked) {
    return (
      <div style={{ maxWidth: 420, margin: '60px auto', padding: '0 16px' }}>
        <div style={card}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%', background: '#eff6ff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px', fontSize: 28
            }}>🔐</div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1e293b', marginBottom: 6 }}>Confirm Your Identity</h2>
            <p style={{ color: '#64748b', fontSize: 14 }}>Enter your current password to access your profile settings.</p>
          </div>
          {gateError && <Alert type="error" text={gateError} />}
          <form onSubmit={handleGateSubmit}>
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Current Password</label>
              <input
                type="password"
                value={gatePassword}
                onChange={(e) => setGatePassword(e.target.value)}
                style={inputStyle}
                placeholder="Enter your password"
                autoFocus
                required
              />
            </div>
            <button
              type="submit"
              disabled={gateLoading}
              style={{
                width: '100%', padding: '11px', borderRadius: 8,
                background: gateLoading ? '#93c5fd' : '#3b82f6',
                color: 'white', border: 'none', fontWeight: 600,
                fontSize: 15, cursor: gateLoading ? 'not-allowed' : 'pointer'
              }}
            >
              {gateLoading ? 'Verifying...' : 'Verify & Continue'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ─── Profile Settings (unlocked state) ──────────────────────────────────────
  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '20px 16px' }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 52, height: 52, borderRadius: '50%', overflow: 'hidden',
            background: '#3b82f6', display: 'flex', alignItems: 'center',
            justifyContent: 'center', flexShrink: 0
          }}>
            {resolvePhoto(authUser?.profilePhoto)
              ? <img src={resolvePhoto(authUser.profilePhoto)} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <span style={{ color: 'white', fontWeight: 700, fontSize: 20 }}>{(authUser?.fullName || 'U')[0].toUpperCase()}</span>
            }
          </div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1e293b', margin: 0 }}>My Profile</h1>
            <p style={{ color: '#64748b', fontSize: 14, margin: 0 }}>Manage your personal information</p>
          </div>
        </div>
      </div>

      {/* Personal Information */}
      <div style={card}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', marginBottom: 20, paddingBottom: 12, borderBottom: '1px solid #f1f5f9' }}>
          Personal Information
        </h2>
        {profileMsg.text && <Alert type={profileMsg.type} text={profileMsg.text} />}
        <form onSubmit={handleProfileSave}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <label style={labelStyle}>Full Name</label>
              <input
                type="text"
                value={profile.fullName}
                onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                style={inputStyle}
                required
              />
            </div>
            <div>
              <label style={labelStyle}>Email Address</label>
              <input
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                style={inputStyle}
                required
              />
            </div>
            <div>
              <label style={labelStyle}>Phone Number</label>
              <input
                type="text"
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                style={inputStyle}
                placeholder="09xxxxxxxx"
              />
            </div>
            <div>
              <label style={labelStyle}>Role(s)</label>
              <input
                type="text"
                value={authUser?.roles?.join(', ') || ''}
                style={disabledInputStyle}
                disabled
              />
              <span style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginTop: 4 }}>Role is managed by Admin.</span>
            </div>
          </div>
          <button
            type="submit"
            disabled={profileLoading}
            style={{
              padding: '10px 24px', borderRadius: 8,
              background: profileLoading ? '#93c5fd' : '#3b82f6',
              color: 'white', border: 'none', fontWeight: 600,
              fontSize: 14, cursor: profileLoading ? 'not-allowed' : 'pointer'
            }}
          >
            {profileLoading ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>

      {/* Change Password */}
      <div style={card}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', marginBottom: 20, paddingBottom: 12, borderBottom: '1px solid #f1f5f9' }}>
          Change Password
        </h2>
        {pwdMsg.text && <Alert type={pwdMsg.type} text={pwdMsg.text} />}
        <form onSubmit={handlePasswordSave}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <label style={labelStyle}>Current Password</label>
              <input
                type="password"
                value={pwdForm.currentPassword}
                onChange={(e) => setPwdForm({ ...pwdForm, currentPassword: e.target.value })}
                style={inputStyle}
                required
              />
            </div>
            <div>
              <label style={labelStyle}>New Password</label>
              <input
                type="password"
                value={pwdForm.newPassword}
                onChange={(e) => setPwdForm({ ...pwdForm, newPassword: e.target.value })}
                style={inputStyle}
                required
                minLength={8}
              />
            </div>
            <div>
              <label style={labelStyle}>Confirm New Password</label>
              <input
                type="password"
                value={pwdForm.confirmPassword}
                onChange={(e) => setPwdForm({ ...pwdForm, confirmPassword: e.target.value })}
                style={inputStyle}
                required
                minLength={8}
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={pwdLoading}
            style={{
              padding: '10px 24px', borderRadius: 8,
              background: 'white', color: '#1e293b',
              border: '1px solid #cbd5e1', fontWeight: 600,
              fontSize: 14, cursor: pwdLoading ? 'not-allowed' : 'pointer'
            }}
          >
            {pwdLoading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default UserProfile;
