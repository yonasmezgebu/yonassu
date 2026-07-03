import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import authService from '../../services/authService';
import styles from './RegisterPage.module.css';
const RegisterPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [formData, setFormData] = useState({ fullName: '', email: '', phone: '', password: '', role: 'Customer' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await authService.register(formData);
      const redirect = searchParams.get('redirect');
      navigate(redirect ? `/login?redirect=${encodeURIComponent(redirect)}` : '/login');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Registration failed. Please check your details.');
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className={styles.authContainer}>
      <div className={styles.authCard}>
        <div className={styles.authHeader}>
          <div className={styles.logo}>SUTANA</div>
          <h2>{formData.role === 'Employee' ? 'Create Employee Account' : 'Create Customer Account'}</h2>
          <p className={styles.subtitle}>{formData.role === 'Employee' ? 'Register to access the employee self-service portal.' : 'Join SUTANA — manage your orders, track status & more.'}</p>
        </div>

        {error && <div className={styles.errorAlert}>{error}</div>}
        
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label>Account Type</label>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
              <button type="button" onClick={() => setFormData({ ...formData, role: 'Customer' })}
                style={{ flex: 1, padding: '0.6rem', borderRadius: '6px', border: formData.role === 'Customer' ? '2px solid #2563eb' : '1px solid #d1d5db', background: formData.role === 'Customer' ? '#eff6ff' : '#fff', color: formData.role === 'Customer' ? '#2563eb' : '#374151', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem' }}>
                🛍️ Customer
              </button>
              <button type="button" onClick={() => setFormData({ ...formData, role: 'Employee' })}
                style={{ flex: 1, padding: '0.6rem', borderRadius: '6px', border: formData.role === 'Employee' ? '2px solid #059669' : '1px solid #d1d5db', background: formData.role === 'Employee' ? '#f0fdf4' : '#fff', color: formData.role === 'Employee' ? '#059669' : '#374151', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem' }}>
                👨‍💼 Employee
              </button>
            </div>
          </div>
          <div className={styles.formGroup}>
            <label>Full Name</label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="Misrak Tsehayneh"
              required
              className={styles.input}
            />
          </div>
          <div className={styles.formGroup}>
            <label>Email Address</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="user@example.com"
              required
              className={styles.input}
            />
          </div>
          <div className={styles.formGroup}>
            <label>Phone Number</label>
            <input
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="09..."
              required
              pattern="^09[0-9]{8}$"
              title="Must be a valid Ethiopian phone number starting with 09"
              className={styles.input}
            />
          </div>
          <div className={styles.formGroup}>
            <label>Password</label>
            <div className={styles.passwordInputWrapper}>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Minimum 8 characters"
                required
                minLength={8}
                className={styles.input}
              />
              <button
                type="button"
                className={styles.passwordToggle}
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>
          <button type="submit" className={styles.btnPrimary} disabled={loading}>
            {loading ? 'Creating Account...' : 'Create My Account'}
          </button>
        </form>
        
        <div className={styles.registerSection}>
          <div className={styles.divider}><span>Already a user?</span></div>
          <Link to="/login" className={styles.registerBtn}>
            Sign In
          </Link>
          <p className={styles.adminNote}>
            Are you staff? Your account is created by an administrator — <Link to="/login" className={styles.loginLink}>Sign in here</Link>.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate('/')}
          className={styles.backHome}
        >
          ← Back to Home
        </button>
      </div>
    </div>
  );
};
export default RegisterPage;
