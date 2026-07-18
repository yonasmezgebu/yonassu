import React from 'react';
import { FileText } from 'lucide-react';

const StoreReports = () => {
  return (
    <div style={{ padding: '32px', backgroundColor: '#f8fafc', minHeight: 'calc(100vh - 64px)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
        <div style={{ width: '52px', height: '52px', borderRadius: '12px', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <FileText size={26} color="#3b82f6" />
        </div>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: '800', color: '#0f172a', margin: 0 }}>Reports</h1>
          <p style={{ color: '#64748b', margin: '4px 0 0 0', fontSize: '14px' }}>View all store and inventory reports.</p>
        </div>
      </div>

      <div style={{ backgroundColor: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '48px', textAlign: 'center' }}>
        <FileText size={56} color="#dbeafe" style={{ margin: '0 auto 16px' }} />
        <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a', margin: '0 0 8px' }}>Reports Module</h2>
        <p style={{ color: '#64748b', maxWidth: '400px', margin: '0 auto' }}>
          This module is under development. Comprehensive reporting tools will be available here soon.
        </p>
      </div>
    </div>
  );
};

export default StoreReports;
