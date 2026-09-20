import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, LogIn, Zap, Lightbulb, ArrowLeft, Compass } from 'lucide-react';
import styles from './NotFoundPage.module.css';

const SUGGESTIONS = [
  { label: 'Home', path: '/', icon: Home },
  { label: 'Login', path: '/login', icon: LogIn },
  { label: 'Services', path: '/services', icon: Zap },
  { label: 'About Us', path: '/about', icon: Lightbulb },
];

const NotFoundPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [countdown, setCountdown] = useState(15);

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
      <div className={styles.card}>
        <div className={styles.iconCircle}>
          <Compass size={44} />
        </div>

        <span className={styles.errorCode}>404</span>
        <h1 className={styles.title}>Page Not Found</h1>
        <p className={styles.subtitle}>
          The page <code className={styles.path}>{location.pathname}</code> doesn't exist or
          may have been moved. Let's get you back on track.
        </p>

        <div className={styles.suggestions}>
          <p className={styles.suggestLabel}>Maybe you were looking for:</p>
          <div className={styles.suggestionGrid}>
            {SUGGESTIONS.map(s => {
              const Icon = s.icon;
              return (
                <button
                  key={s.path}
                  className={styles.suggestionCard}
                  onClick={() => navigate(s.path)}
                >
                  <Icon size={18} />
                  <span>{s.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className={styles.actions}>
          <button className={styles.btnPrimary} onClick={() => navigate('/')}>
            <Home size={16} />
            Go Home
          </button>
          <button className={styles.btnSecondary} onClick={() => navigate(-1)}>
            <ArrowLeft size={16} />
            Go Back
          </button>
        </div>

        <p className={styles.redirectNotice}>
          Automatically redirecting to home in{' '}
          <span className={styles.countdown}>{countdown}s</span>
        </p>
      </div>
    </div>
  );
};

export default NotFoundPage;