import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styles from './NotFoundPage.module.css';

const SUGGESTIONS = [
  { label: 'Home', path: '/', icon: '🏠' },
  { label: 'Login', path: '/login', icon: '🔐' },
  { label: 'Services', path: '/services', icon: '⚡' },
  { label: 'About Us', path: '/about', icon: '💡' },
];

const NotFoundPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [countdown, setCountdown] = useState(15);
  const [dots, setDots] = useState('');

  // Animated dots
  useEffect(() => {
    const dotsTimer = setInterval(() => {
      setDots(d => (d.length >= 3 ? '' : d + '.'));
    }, 500);
    return () => clearInterval(dotsTimer);
  }, []);

  // Auto-redirect countdown
  useEffect(() => {
    if (countdown <= 0) {
      navigate('/');
      return;
    }
    const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown, navigate]);

  return (
    <div className={styles.page}>
      {/* Animated background orbs */}
      <div className={styles.orb1} />
      <div className={styles.orb2} />
      <div className={styles.orb3} />

      {/* Floating particles */}
      {[...Array(12)].map((_, i) => (
        <div key={i} className={styles.particle} style={{ '--i': i }} />
      ))}

      <div className={styles.content}>
        {/* Glitch 404 */}
        <div className={styles.errorCode} data-text="404">
          <span>4</span>
          <span className={styles.zeroWrapper}>
            <span className={styles.zero}>0</span>
            <span className={styles.zeroGlow}>0</span>
          </span>
          <span>4</span>
        </div>

        {/* Status line */}
        <div className={styles.statusLine}>
          <span className={styles.statusDot} />
          <code className={styles.statusText}>
            GET {location.pathname} — <span className={styles.statusCode}>404 Not Found</span>
          </code>
        </div>

        <h1 className={styles.title}>Page Not Found</h1>
        <p className={styles.subtitle}>
          The page you're looking for has gone on an adventure{dots} or maybe it
          never existed. Either way, we couldn't find it.
        </p>

        {/* Quick suggestions */}
        <div className={styles.suggestions}>
          <p className={styles.suggestLabel}>Maybe you were looking for:</p>
          <div className={styles.suggestionGrid}>
            {SUGGESTIONS.map(s => (
              <button
                key={s.path}
                className={styles.suggestionCard}
                onClick={() => navigate(s.path)}
              >
                <span className={styles.suggestionIcon}>{s.icon}</span>
                <span>{s.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Action buttons */}
        <div className={styles.actions}>
          <button className={styles.btnPrimary} onClick={() => navigate('/')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            Go Home
          </button>
          <button className={styles.btnSecondary} onClick={() => navigate(-1)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Go Back
          </button>
        </div>

        {/* Auto-redirect notice */}
        <p className={styles.redirectNotice}>
          Automatically redirecting to home in{' '}
          <span className={styles.countdown}>{countdown}s</span>
        </p>
      </div>
    </div>
  );
};

export default NotFoundPage;
