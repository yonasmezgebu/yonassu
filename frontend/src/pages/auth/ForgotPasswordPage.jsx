import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import authService from '../../services/authService';
import styles from './ForgotPasswordPage.module.css';
const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: '', message: '' });
    try {
      await authService.requestPasswordReset(email);
      setStatus({ type: 'success', message: 'Password reset link has been sent to your email.' });
      setEmail('');
    } catch (err) {
      setStatus({ type: 'error', message: err.response?.data?.message || 'Failed to send reset link.' });
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className={styles.authContainer}>
      <div className={styles.authCard}>
        <div className={styles.authHeader}>
          <div className={styles.logo}>SUTANA</div>
          <h2>Forgot Password</h2>
          <p className={styles.subtitle}>Enter your email address and we'll send you a link to reset your password.</p>
        </div>
        {status.message && (
          <div className={`${styles.errorAlert}`} style={{ background: status.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : undefined, color: status.type === 'success' ? '#10b981' : undefined, borderColor: status.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : undefined }}>
            {status.message}
          </div>
        )}
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label>Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@sutana.com"
              required
              className={styles.input}
            />
          </div>
          <button type="submit" className={styles.btnPrimary} disabled={loading || status.type === 'success'}>
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>
        <button
          type="button"
          onClick={() => window.history.back()}
          className={styles.backHome}
        >
          ← Back to Login
        </button>
      </div>
    </div>
  );
};
export default ForgotPasswordPage;
