import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import authService from '../../services/authService';
import styles from './RegisterPage.module.css';

const RegisterPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    role: 'Customer',   // Always Customer — only customers can self-register
  });
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
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
      const response = await authService.register(formData);
      setSuccessMsg(response?.message || 'Registration successful! Redirecting to login...');
      setTimeout(() => {
        const redirect = searchParams.get('redirect');
        navigate(redirect ? `/login?redirect=${encodeURIComponent(redirect)}` : '/login');
      }, 3000);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.message ||
        'Registration failed. Please check your details.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.authContainer}>
      <div className={styles.formArea}>


        {/* Error Notification */}
        {error && (
          <div className={`${styles.notification} ${styles.notificationError}`} role="status">
            <AlertCircle size={18} className={styles.notificationIcon} />
            <span>{error}</span>
          </div>
        )}

        {/* Success Notification */}
        {successMsg && (
          <div className={`${styles.notification} ${styles.notificationSuccess}`} role="status">
            <CheckCircle size={18} className={styles.notificationIcon} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form Card */}
        <div className={styles.formCard}>
          {/* Page title */}
          <div className={styles.formHeading}>
            <h2>Create Account</h2>
            <p>Register to manage your orders &amp; track status.</p>
            <div className={styles.headingAccent} />
          </div>

          {/* Customer-only badge */}
          <div className={styles.accountTypeBadgeWrapper}>
            <div className={styles.accountTypeBadge}>
              <span>🛍️</span> Customer Registration
            </div>
          </div>

          <form onSubmit={handleSubmit} className={styles.form} noValidate>

            <div className={styles.formGrid}>
              {/* Full Name */}
              <div className={styles.formGroup}>
                <label htmlFor="fullName">Full Name</label>
                <input
                  id="fullName"
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Misrak Tsehayneh"
                  required
                  autoComplete="name"
                  className={styles.input}
                />
              </div>

              {/* Email Address */}
              <div className={styles.formGroup}>
                <label htmlFor="email">Email Address</label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="user@example.com"
                  required
                  autoComplete="email"
                  className={styles.input}
                />
              </div>

              {/* Phone Number */}
              <div className={styles.formGroup}>
                <label htmlFor="phone">Phone Number</label>
                <input
                  id="phone"
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="09..."
                  required
                  pattern="^09[0-9]{8}$"
                  title="Must be a valid Ethiopian phone number starting with 09"
                  autoComplete="tel"
                  className={styles.input}
                />
              </div>

              {/* Password */}
              <div className={styles.formGroup}>
                <label htmlFor="password">Password</label>
                <div className={styles.passwordInputWrapper}>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Minimum 8 characters"
                    required
                    minLength={8}
                    autoComplete="new-password"
                    className={styles.input}
                  />
                  <button
                    type="button"
                    className={styles.passwordToggle}
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className={styles.formActions}>
              {!successMsg && (
                <button
                  type="submit"
                  className={`${styles.btnPrimary}${loading ? ' ' + styles.loading : ''}`}
                  disabled={loading}
                >
                  {loading ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                      <Loader2 size={18} className={styles.spinIcon} />
                      Creating Account...
                    </div>
                  ) : 'Create My Account'}
                </button>
              )}
            </div>
          </form>

          {/* Already have account? */}
          <div className={styles.loginSection}>
            <div className={styles.divider}><span>Already have an account?</span></div>
            <Link to="/login" className={styles.loginBtn}>
              Sign In
            </Link>
            <p className={styles.adminNote}>
              Admin &amp; staff accounts are created by an administrator.
            </p>
          </div>
        </div>

        {/* Back home */}
        <div className={styles.backHomeWrap}>
          <button
            type="button"
            onClick={() => navigate('/')}
            className={styles.backHome}
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
