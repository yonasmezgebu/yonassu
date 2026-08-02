import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
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
    role: 'Customer',
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

  const isEmployee = formData.role === 'Employee';

  return (
    <div className={styles.authContainer}>

      {/* ════════════════════════════════════════
          LEFT PANEL — Forest Green brand panel
      ════════════════════════════════════════ */}
      <div className={styles.leftPanel}>
        <div className={styles.brandBlock}>

          {/* Brand logo */}
          <div className={styles.brandLogo}>
            <div className={styles.logoMark}>
              <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16 4 C10 4 6 8 6 14 C6 20 10 24 16 28 C22 24 26 20 26 14 C26 8 22 4 16 4 Z"
                  fill="#228B22"/>
                <path d="M16 10 C14 12 12 15 16 18 C20 15 18 12 16 10 Z"
                  fill="#ffffff"/>
                <text x="50%" y="56%" dominantBaseline="middle" textAnchor="middle"
                  fill="#ffffff" fontSize="10" fontWeight="800" fontFamily="Inter,sans-serif">
                  S
                </text>
              </svg>
            </div>
            <div>
              <div className={styles.brandName}>SUTANA</div>
              <div className={styles.brandTagline}>Enterprise Management System</div>
            </div>
          </div>

          {/* Hero text */}
          <div className={styles.heroText}>
            <h1>
              Create Your<br/>
              <span>SUTANA</span> Account
            </h1>
            <p>
              Join SUTANA's enterprise platform — manage your orders,
              track service status and stay connected.
            </p>

            {/* Feature list */}
            <ul className={styles.featureList}>
              <li><span className={styles.featureDot}></span>Track orders &amp; requests in real time</li>
              <li><span className={styles.featureDot}></span>Access all SUTANA services digitally</li>
              <li><span className={styles.featureDot}></span>Secure, role-based account access</li>
              <li><span className={styles.featureDot}></span>24/7 enterprise support</li>
            </ul>
          </div>
        </div>

        {/* Left panel footer */}
        <div className={styles.leftFooter}>
          <p>© 2024 SUTANA. All rights reserved.</p>
          <p>Enterprise Management System</p>
        </div>
      </div>

      {/* ════════════════════════════════════════
          RIGHT PANEL — White form panel
      ════════════════════════════════════════ */}
      <div className={styles.rightPanel}>

        {/* Top bar strip — Rule 12: flush to top */}
        <div className={styles.rightTopBar}>
          <span className={styles.topBarBrand}>SUTANA Portal</span>
          <nav className={styles.topBarNav}>
            <Link to="/">Home</Link>
            <Link to="/login">Sign In</Link>
          </nav>
        </div>

        {/* Form area — Rule 13: proper padding, not touching top bar */}
        <div className={styles.formArea}>

          {/* Page title — Rule 16: plain text, NOT a bold color header container */}
          <div className={styles.pageTitle}>
            <h2>
              {isEmployee ? 'Create Employee Account' : 'Create Customer Account'}
            </h2>
            <p>
              {isEmployee
                ? 'Register to access the employee self-service portal.'
                : 'Join SUTANA — manage your orders, track status & more.'}
            </p>
            <div className={styles.titleAccent} />
          </div>

          {/* ── In-App Error Notification (Rule 6: no browser alert) ── */}
          {error && (
            <div className={`${styles.notification} ${styles.notificationError}`} role="status">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {/* ── In-App Success Notification (Rule 6: no browser alert) ── */}
          {successMsg && (
            <div className={`${styles.notification} ${styles.notificationSuccess}`} role="status">
              <CheckCircle size={18} />
              <span>{successMsg}</span>
            </div>
          )}

          {/* ── Form card — Rule 3: sharp corners ── */}
          <div className={styles.formCard}>
            <form onSubmit={handleSubmit} className={styles.form} noValidate>

              {/* Account Type toggle — Rule 1, 8: sharp buttons */}
              <div className={styles.formGrid}>
                <div className={`${styles.formGroup} ${styles.formGroupFull}`}>
                  <label>Account Type</label>
                  <div className={styles.roleToggleGroup}>
                    <button
                      type="button"
                      className={`${styles.roleBtn} ${formData.role === 'Customer' ? styles.roleBtnActive : ''}`}
                      onClick={() => setFormData({ ...formData, role: 'Customer' })}
                    >
                      🛍️ Customer
                    </button>
                    <button
                      type="button"
                      className={`${styles.roleBtn} ${formData.role === 'Employee' ? styles.roleBtnActive : ''}`}
                      onClick={() => setFormData({ ...formData, role: 'Employee' })}
                    >
                      👨‍💼 Employee
                    </button>
                  </div>
                </div>

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
                </div>

                {/* Show password checkbox */}
                <div className={`${styles.formGroup} ${styles.formGroupFull}`}>
                  <label className={styles.showPasswordLabel} style={{ textTransform: 'none', letterSpacing: 'normal' }}>
                    <input
                      type="checkbox"
                      checked={showPassword}
                      onChange={() => setShowPassword(!showPassword)}
                      className={styles.showPasswordCheck}
                    />
                    Show password
                  </label>
                </div>
              </div>

              {/* Form actions */}
              <div className={styles.formActions}>
                {!successMsg && (
                  <button
                    type="submit"
                    className={`${styles.btnPrimary}${loading ? ' ' + styles.loading : ''}`}
                    disabled={loading}
                  >
                    {loading ? 'Creating Account...' : 'Create My Account'}
                  </button>
                )}
              </div>
            </form>

            {/* Already have account? */}
            <div className={styles.loginSection}>
              <div className={styles.divider}><span>Already have an account?</span></div>
              <Link to="/login" className={styles.registerBtn}>
                Sign In
              </Link>
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

        {/* Right panel footer */}
        <div className={styles.rightFooter}>
          <p>© 2024 SUTANA Enterprise Management System</p>
          <div className={styles.footerLinks}>
            <a href="#">Privacy</a>
            <a href="#">Terms</a>
            <a href="#">Support</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
