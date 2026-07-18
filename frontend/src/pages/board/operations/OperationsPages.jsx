import React, { useState, useEffect } from 'react';
import { boardAggregationService } from '../../../utils/boardAggregationService';
import { Building, MapPin, Users, FileText, CheckCircle, ShieldAlert, Scale, GitBranch } from 'lucide-react';
import CurrencyDisplay from '../../sales/components/CurrencyDisplay';

const PageHeader = ({ title, description }) => (
  <div style={{ marginBottom: '24px' }}>
    <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', margin: '0 0 8px 0' }}>{title}</h1>
    <p style={{ color: '#64748b', margin: 0 }}>{description}</p>
  </div>
);



// 5.15 Audit Reports
export const AuditReports = () => {
  return (
    <div style={{ padding: '24px', backgroundColor: '#f8fafc', minHeight: 'calc(100vh - 64px)' }}>
      <PageHeader title="Audit Reports" description="Internal and external audit findings and management responses." />
      <div style={{ padding: '48px', backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
        <FileText size={48} color="#94a3b8" style={{ margin: '0 auto 16px' }} />
        <h3 style={{ fontSize: '18px', color: '#0f172a', margin: '0 0 8px' }}>No Active Audits</h3>
        <p style={{ color: '#64748b', maxWidth: '400px', margin: '0 auto 24px' }}>
          No audit engagements or findings are currently open for review.
        </p>
      </div>
    </div>
  );
};
