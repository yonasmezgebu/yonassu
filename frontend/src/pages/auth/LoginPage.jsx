import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link, useLocation } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import authService from '../../services/authService';
import styles from './LoginPage.module.css';

const LoginPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const user = await authService.login(formData);
      const redirect = searchParams.get('redirect');
      if (redirect) {
        navigate(redirect);
        return;
      }

      const from = location.state?.from?.pathname || location.state?.from;
      if (from) {
        navigate(from, { state: location.state });
        return;
      }

      const userRoles = user.roles?.map(r => r.toLowerCase()) || [];

      if (userRoles.includes('admin')) navigate('/admin');
      else if (userRoles.includes('ceo')) navigate('/ceo');
      else if (userRoles.includes('finance manager') || userRoles.includes('finance')) navigate('/finance');
      else if (userRoles.includes('purchase') || userRoles.includes('market team')) navigate('/purchase');
      else if (userRoles.includes('pharmacy store keeper')) navigate('/pharmacy-store');
      else if (userRoles.includes('general store keeper')) navigate('/general-store');
      else if (userRoles.includes('sales/cashier') || userRoles.includes('pharmacy worker')) navigate('/pharmacy-worker');
      else if (userRoles.includes('printing supervisor') || userRoles.includes('printing manager')) navigate('/printing-manager');
      else if (userRoles.includes('pharmacy manager')) navigate('/pharmacy');
      else if (userRoles.includes('car renting manager')) navigate('/car-renting');
      else if (userRoles.includes('sales manager')) navigate('/sales/overview');
      else if (userRoles.includes('hr manager')) navigate('/hr');
      else if (userRoles.includes('board member')) navigate('/board');
      else if (userRoles.includes('employee')) navigate('/employee');
      else if (userRoles.includes('customer')) navigate('/customer');
      else navigate('/');
    } catch (err) {
      setError(err.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.authContainer}>

      {/* ════════════════════════════════════════
          LEFT PANEL — Forest Green brand panel
      ════════════════════════════════════════ */}
      <div className={styles.leftPanel}>
        {/* Brand block */}
        <div className={styles.brandBlock}>
          <div className={styles.brandLogo}>
            <div className={styles.logoMark}>
              {/* SUTANA leaf / S mark */}
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
              Welcome to <span>SUTANA</span><br/>
              Enterprise System
            </h1>
            <p>
              SUTANA Enterprise Management System — a comprehensive platform
              built for SUTANA's enterprise operations and
              consultancy services.
            </p>
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

        {/* Top bar strip */}
        <div className={styles.rightTopBar}>
          <span className={styles.topBarBrand}>SUTANA Portal</span>
          <nav className={styles.topBarNav}>
            <Link to="/">Home</Link>
            <Link to="/auth/register">Register</Link>
          </nav>
        </div>

        {/* Scrollable form area */}
        <div className={styles.formArea}>

          {/* ── In-App Notification (Rule 6: no alert, use in-app notification) ── */}
          {error && (
            <div className={`${styles.notification} ${styles.notificationError}`} role="status">
              <AlertCircle size={18} className={styles.notificationIcon} />
              <span>{error}</span>
            </div>
          )}

          {/* ── Form card ── */}
          <div className={styles.formCard}>
            <div className={styles.formHeading}>
              <h2>Sign In</h2>
              <p>Enter your credentials to access the system.</p>
              <div className={styles.headingAccent} />
            </div>

            <form onSubmit={handleSubmit} className={styles.form} noValidate>
              {/* Username / Email */}
              <div className={styles.formGroup}>
                <label htmlFor="username">Email or Username</label>
                <input
                  id="username"
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Enter your email or username"
                  required
                  autoComplete="username"
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
                    placeholder="Enter your password"
                    required
                    autoComplete="current-password"
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

              {/* Remember me + Forgot password row */}
              <div className={styles.rememberRow}>
                <label className={styles.rememberLabel}>
                  <input type="checkbox" />
                  Remember me
                </label>
                <Link to="/auth/forgot-password" className={styles.forgotLink}>
                  Forgot password?
                </Link>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                className={`${styles.btnPrimary}${loading ? ' ' + styles.loading : ''}`}
                disabled={loading}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            {/* Register section */}
            <div className={styles.registerSection}>
              <div className={styles.divider}><span>New to SUTANA?</span></div>
              <Link to="/auth/register" className={styles.registerBtn}>
                Register as a Customer
              </Link>
              <p className={styles.adminNote}>
                Admin &amp; staff accounts are created by an administrator.
              </p>
            </div>
          </div>

          {/* Back home link */}
          <div className={styles.backHomeWrap}>
            <Link to="/" className={styles.backHome}>
              ← Back to Home
            </Link>
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

export default LoginPage;
