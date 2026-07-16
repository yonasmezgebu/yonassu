import React, { useState, useEffect } from 'react';
import { Lock, ShieldAlert, Globe } from 'lucide-react';
import PharmacyHealthPublisher from './PharmacyHealthPublisher';
import apiClient from '../../services/apiClient';
import { useAuth } from '../../hooks/useAuth';

/**
 * PharmacyWorkerHealthPublisher
 * 
 * Shows the exact same Health Publisher page as the Pharmacy Manager,
 * BUT first checks whether this worker has post_permission = true.
 * If not, shows a locked screen. Workers need the manager to toggle permission.
 */
const PharmacyWorkerHealthPublisher = () => {
  const { user } = useAuth();
  const [status, setStatus] = useState('loading'); // 'loading' | 'allowed' | 'denied'

  useEffect(() => {
    checkPermission();
  }, []);

  const checkPermission = async () => {
    try {
      // Fetch list of workers and find the one matching the current user
      const res = await apiClient.get('/pharmacy/workers');
      const workers = res?.data || [];

      // Match by name (workers table may not have a user_id FK)
      const matched = workers.find(
        w =>
          w.name?.toLowerCase() === user?.name?.toLowerCase() ||
          w.id === user?.worker_id ||
          w.id === user?.id
      );

      if (!matched) {
        // If no worker record found for this user, allow if user is staff/manager
        setStatus('allowed');
        return;
      }

      if (matched.post_permission === true || matched.post_permission === 1) {
        setStatus('allowed');
      } else {
        setStatus('denied');
      }
    } catch (err) {
      console.error('Permission check failed:', err);
      // On error, be permissive — let through
      setStatus('allowed');
    }
  };

  if (status === 'loading') {
    return (
      <div style={{
        minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#f8fafc', fontFamily: "'Inter', sans-serif"
      }}>
        <div style={{ textAlign: 'center', color: '#94a3b8' }}>
          <Globe size={40} style={{ marginBottom: 12, color: '#cbd5e1' }} />
          <p style={{ fontWeight: 600, fontSize: 15 }}>Checking your access...</p>
        </div>
      </div>
    );
  }

  if (status === 'denied') {
    return (
      <div style={{
        minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#f8fafc', padding: 24, fontFamily: "'Inter', sans-serif"
      }}>
        <div style={{
          background: 'white', borderRadius: 20, border: '2px solid #fecaca',
          boxShadow: '0 8px 40px rgba(220,38,38,0.10)', padding: '48px 56px',
          textAlign: 'center', maxWidth: 480
        }}>
          {/* Red lock icon */}
          <div style={{
            width: 80, height: 80, borderRadius: '50%',
            background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 24px', border: '2px solid #fecaca'
          }}>
            <Lock size={36} color="#dc2626" />
          </div>

          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: '#fef2f2', color: '#dc2626', borderRadius: 20,
            padding: '4px 14px', fontSize: 12, fontWeight: 700, marginBottom: 16,
            border: '1px solid #fecaca'
          }}>
            <ShieldAlert size={14} /> Access Restricted
          </div>

          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', margin: '0 0 12px' }}>
            Health Publisher Locked
          </h2>
          <p style={{ color: '#64748b', fontSize: 14, lineHeight: 1.6, margin: '0 0 24px' }}>
            You don't currently have permission to publish health content.
            Please ask your <strong>Pharmacy Manager</strong> to enable your
            <strong> Post Permission</strong> toggle in the Staff / Workers management panel.
          </p>

          <div style={{
            background: '#fffbeb', borderRadius: 12, border: '1px solid #fde68a',
            padding: '14px 20px', textAlign: 'left'
          }}>
            <p style={{ margin: 0, fontSize: 13, color: '#92400e', fontWeight: 600 }}>
              💡 How to get access:
            </p>
            <ol style={{ margin: '8px 0 0', paddingLeft: 18, fontSize: 13, color: '#78350f', lineHeight: 1.8 }}>
              <li>Ask your Pharmacy Manager to log in</li>
              <li>Go to <strong>Staff → Workers</strong> section</li>
              <li>Find your name and toggle <strong>Post Permission</strong> ON</li>
              <li>Refresh this page</li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  // Permission granted — render the exact same page as Pharmacy Manager
  return <PharmacyHealthPublisher />;
};

export default PharmacyWorkerHealthPublisher;
