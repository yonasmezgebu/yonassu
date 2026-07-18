import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link, useLocation } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
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

      // Determine dashboard based on role — no forced password change redirect
      if (user.roles?.includes('Admin')) navigate('/admin');
      else if (user.roles?.includes('CEO')) navigate('/ceo');
      else if (user.roles?.includes('Finance Manager')) navigate('/finance');
      else if (user.roles?.includes('Purchase')) navigate('/purchase');
      else if (user.roles?.includes('Pharmacy Store Keeper')) navigate('/pharmacy-store');
      else if (user.roles?.includes('General Store Keeper')) navigate('/general-store');
      else if (user.roles?.includes('Sales/Cashier')) navigate('/pharmacy-worker');
      else if (user.roles?.includes('Printing Supervisor')) navigate('/printing-manager');
      else if (user.roles?.includes('Market Team')) navigate('/purchase');
      else if (user.roles?.includes('Pharmacy Manager')) navigate('/pharmacy');
      else if (user.roles?.includes('Pharmacy Worker')) navigate('/pharmacy-worker');
      else if (user.roles?.includes('Car Renting Manager')) navigate('/car-renting');
      else if (user.roles?.includes('Sales Manager')) navigate('/tenders/manage');
      else if (user.roles?.includes('HR Manager')) navigate('/hr');
      else if (user.roles?.includes('Board Member')) navigate('/board');
      else if (user.roles?.includes('Employee')) navigate('/employee');
      else navigate('/');
    } catch (err) {
      setError(err.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className={styles.authContainer}>

      {/* ── Decorative dots & plus signs ── */}
      <div className={styles.dots}>
        <span style={{ top: '38%', left: '8%' }}>+</span>
        <span style={{ top: '55%', left: '22%', fontSize: '10px' }}>○</span>
        <span style={{ top: '62%', left: '60%', fontSize: '10px' }}>○</span>
        <span style={{ top: '44%', right: '10%' }}>+</span>
        <span style={{ top: '70%', right: '6%', fontSize: '10px' }}>○</span>
        <span style={{ top: '78%', left: '44%', fontSize: '8px' }}>○</span>
        <span style={{ top: '50%', right: '28%' }}>+</span>
        <span style={{ top: '35%', left: '50%', fontSize: '8px' }}>•</span>
        <span style={{ top: '68%', left: '14%', fontSize: '8px' }}>•</span>
        <span style={{ top: '80%', right: '20%', fontSize: '10px' }}>○</span>
      </div>

      {/* ── Centered form card ── */}
      <div className={styles.authCard}>
        <div className={styles.authHeader}>
          {/* Logo icon mark */}
          <div className={styles.logo}>
            <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="24" cy="24" r="24" fill="rgba(255,255,255,0.06)" />
              <text x="50%" y="54%" dominantBaseline="middle" textAnchor="middle"
                fill="#2ecc71" fontSize="26" fontWeight="800" fontFamily="Inter,sans-serif">
                S
              </text>
              <circle cx="32" cy="30" r="5" fill="#2ecc71" />
            </svg>
          </div>
          <h2>Sign in</h2>
          <p className={styles.subtitle}>Welcome back to SUTANA !!</p>
        </div>

        {error && <div className={styles.errorAlert}>{error}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label>Email or Phone Number</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Login"
              required
              className={styles.input}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Password</label>
            <div className={styles.passwordInputWrapper}>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Password"
                required
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

          <button type="submit" className={styles.btnPrimary} disabled={loading}>
            {loading ? 'Signing in...' : 'Login'}
          </button>
        </form>

        <div className={styles.registerSection}>
          <div className={styles.divider}><span>New here?</span></div>
          <Link to="/auth/register" className={styles.registerBtn}>
            🛍️ Register as a Customer
          </Link>
          <p className={styles.adminNote}>Admin &amp; staff accounts are created by an administrator.</p>
        </div>

        <Link to="/" className={styles.backHome}>
          ← Back to Home
        </Link>
      </div>

      {/* ── Wave bottom layers ── */}
      <div className={styles.waveSection}>
        <svg viewBox="0 0 1440 200" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
          <path d="M0,100 C200,160 400,40 600,100 C800,160 1000,40 1200,100 C1300,130 1380,110 1440,100 L1440,200 L0,200 Z"
            fill="rgba(100,140,150,0.18)" />
          <path d="M0,130 C180,80 360,170 540,130 C720,90 900,170 1080,130 C1200,105 1340,140 1440,130 L1440,200 L0,200 Z"
            fill="rgba(150,185,190,0.18)" />
          <path d="M0,160 C240,120 480,180 720,160 C960,140 1200,175 1440,160 L1440,200 L0,200 Z"
            fill="rgba(210,225,228,0.22)" />
          <path d="M0,180 C360,160 720,195 1080,178 C1260,169 1380,183 1440,180 L1440,200 L0,200 Z"
            fill="rgba(230,238,240,0.30)" />
        </svg>
      </div>

      {/* ── Footer copyright ── */}
      <div className={styles.footer}>
        <p>2024 © SUTANA. All rights reserved.</p>
        <p>Enterprise Management System</p>
      </div>
    </div>
  );
};
export default LoginPage;
