import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link, useLocation } from 'react-router-dom';
import { AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react';
import authService from '../../services/authService';
import styles from './LoginPage.module.css';
import sutanaLogo from '../../assets/drop_down/sutana_logo.jpg';

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
      const userRoles = user.roles?.map(r => r.toLowerCase()) || [];
      const hasRole = (...roles) => roles.some(r => userRoles.includes(r.toLowerCase()));
      const isOnlyEmployee = userRoles.length > 0 && userRoles.every(r =>
        ['employee', 'customer'].includes(r)
      );

      // Pure employees are always sent to /employee — never redirect them elsewhere
      if (isOnlyEmployee && hasRole('employee')) {
        navigate('/employee');
        return;
      }

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

      // Route by role — isOnlyEmployee already handled above (returned early to /employee)
      if (hasRole('admin')) navigate('/admin');
      else if (hasRole('ceo')) navigate('/ceo');
      else if (hasRole('finance manager', 'finance')) navigate('/finance');
      else if (hasRole('purchase', 'purchase manager', 'market team')) navigate('/purchase');
      else if (hasRole('pharmacy store keeper')) navigate('/pharmacy-store');
      else if (hasRole('general store keeper')) navigate('/general-store');
      else if (hasRole('sales/cashier', 'pharmacy worker')) navigate('/pharmacy-worker');
      else if (hasRole('printing supervisor', 'printing manager')) navigate('/printing-manager');
      else if (hasRole('pharmacy manager')) navigate('/pharmacy');
      else if (hasRole('car renting manager')) navigate('/car-renting');
      else if (hasRole('sales manager')) navigate('/sales/overview');
      else if (hasRole('hr manager')) navigate('/hr');
      else if (hasRole('board member')) navigate('/board');
      else if (hasRole('employee')) navigate('/employee');
      else if (hasRole('customer')) navigate('/customer');
      else navigate('/');
    } catch (err) {
      setError(err.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.authContainer}>
      <div className={styles.formArea}>

        {/* ── In-App Notification ── */}
        {error && (
          <div className={`${styles.notification} ${styles.notificationError}`} role="status">
            <AlertCircle size={18} className={styles.notificationIcon} />
            <span>{error}</span>
          </div>
        )}

        {/* ── Form card ── */}
        <div className={styles.formCard}>

          {/* Logo + Brand Name — side by side, inside the card */}
          <div className={styles.brandHeader}>
            <img src={sutanaLogo} alt="SUTANA Logo" className={styles.logoImg} />
            <div className={styles.brandTitle}>SUTANA</div>
          </div>

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
              {loading ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <style>{`@keyframes loginSpin { 100% { transform: rotate(360deg); } }`}</style>
                  <Loader2 size={18} style={{ animation: 'loginSpin 1s linear infinite' }} />
                  Signing in...
                </div>
              ) : 'Sign In'}
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
    </div>
  );
};

export default LoginPage;
