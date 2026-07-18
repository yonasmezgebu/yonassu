import React from 'react';
import { Lock } from 'lucide-react';

const StoreAuditTrail = () => {
  return (
    <div style={{ padding: '32px', backgroundColor: '#f8fafc', minHeight: 'calc(100vh - 64px)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
        <div style={{ width: '52px', height: '52px', borderRadius: '12px', backgroundColor: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Lock size={26} color="#10b981" />
        </div>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: '800', color: '#0f172a', margin: 0 }}>Audit Trail</h1>
          <p style={{ color: '#64748b', margin: '4px 0 0 0', fontSize: '14px' }}>Log of administrative and operational actions.</p>
        </div>
      </div>

      <div style={{ backgroundColor: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '48px', textAlign: 'center' }}>
        <Lock size={56} color="#d1fae5" style={{ margin: '0 auto 16px' }} />
        <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a', margin: '0 0 8px' }}>Audit Trail Module</h2>
        <p style={{ color: '#64748b', maxWidth: '400px', margin: '0 auto' }}>
          This module is under development. A detailed history of user actions and operations will appear here soon.
        </p>
      </div>
    </div>
  );
};

export default StoreAuditTrail;
