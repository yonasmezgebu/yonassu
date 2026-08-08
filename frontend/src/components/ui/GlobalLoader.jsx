import React, { useState, useEffect } from 'react';
import SegmentedSpinner from './SegmentedSpinner';

// Simple event target for API loading state
export const apiLoadingEvents = new EventTarget();

const GlobalLoader = () => {
  const [loadingCount, setLoadingCount] = useState(0);

  useEffect(() => {
    const handleStart = () => setLoadingCount((c) => c + 1);
    const handleStop = () => setLoadingCount((c) => Math.max(0, c - 1));

    apiLoadingEvents.addEventListener('start', handleStart);
    apiLoadingEvents.addEventListener('stop', handleStop);

    return () => {
      apiLoadingEvents.removeEventListener('start', handleStart);
      apiLoadingEvents.removeEventListener('stop', handleStop);
    };
  }, []);

  if (loadingCount === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 16,
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 99999,
      background: '#ffffff',
      padding: '8px 16px',
      borderRadius: 999,
      boxShadow: '0 4px 12px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05)',
      display: 'flex',
      alignItems: 'center',
      gap: 12
    }}>
      <SegmentedSpinner size={20} color="#2563EB" />
      <span style={{ fontSize: 13, fontWeight: 600, color: '#374151', letterSpacing: '0.02em' }}>
        Processing...
      </span>
    </div>
  );
};

export default GlobalLoader;
