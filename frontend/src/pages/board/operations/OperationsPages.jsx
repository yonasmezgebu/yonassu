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

// 5.19 Branch Overview
export const BranchOverview = () => {
  const [branches, setBranches] = useState([]);

  useEffect(() => {
    const fetch = () => setBranches(boardAggregationService.getBranches());
    fetch();
    return boardAggregationService.subscribe(fetch);
  }, []);

  return (
    <div style={{ padding: '24px', backgroundColor: '#f8fafc', minHeight: 'calc(100vh - 64px)' }}>
      <PageHeader title="Branch Overview" description="Physical branch network and high-level assignments." />
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
        {branches.map(b => (
          <div key={b.id} style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '8px', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' }}>
                <Building size={24} />
              </div>
              <div>
                <div style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>{b.name}</div>
                <div style={{ fontSize: '13px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={12} /> {b.location}</div>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #f1f5f9', paddingTop: '16px', fontSize: '14px' }}>
              <span style={{ color: '#64748b' }}>Manager ID:</span>
              <span style={{ fontWeight: '600', color: '#0f172a' }}>{b.manager_id}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// 5.20 Department Overview
export const DepartmentOverview = () => {
  const [depts, setDepts] = useState([]);

  useEffect(() => {
    const fetch = () => setDepts(boardAggregationService.getDepartments());
    fetch();
    return boardAggregationService.subscribe(fetch);
  }, []);

  return (
    <div style={{ padding: '24px', backgroundColor: '#f8fafc', minHeight: 'calc(100vh - 64px)' }}>
      <PageHeader title="Department Overview" description="Headcount and budget allocation by department." />
      
      <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#64748b', fontSize: '13px' }}>
              <th style={{ padding: '16px 24px' }}>Department</th>
              <th>Head Employee ID</th>
              <th>Employee Count</th>
              <th>Annual Budget</th>
            </tr>
          </thead>
          <tbody>
            {depts.map(d => (
              <tr key={d.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '16px 24px', fontWeight: '600', color: '#0f172a' }}>{d.name}</td>
                <td style={{ color: '#475569', fontSize: '14px' }}>{d.head_employee_id}</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Users size={16} color="#64748b" /> 
                    <span style={{ fontWeight: '600' }}>{d.employee_count}</span>
                  </div>
                </td>
                <td style={{ fontWeight: '700', color: '#0f172a' }}><CurrencyDisplay amountCents={d.budget_cents} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// 5.21 Structure Review
export const StructureReview = () => {
  // Simplified org chart representation for the spec
  return (
    <div style={{ padding: '24px', backgroundColor: '#f8fafc', minHeight: 'calc(100vh - 64px)' }}>
      <PageHeader title="Structure Review" description="Organizational reporting lines and hierarchy." />
      <div style={{ padding: '48px', backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
        <GitBranch size={48} color="#94a3b8" style={{ margin: '0 auto 16px' }} />
        <h3 style={{ fontSize: '18px', color: '#0f172a', margin: '0 0 8px' }}>Board of Directors & CEO</h3>
        <p style={{ color: '#64748b', maxWidth: '400px', margin: '0 auto 24px' }}>
          Interactive Org Chart component will map OrgStructureNode hierarchies here.
        </p>
      </div>
    </div>
  );
};

// 5.22 Audit Logs (Read Only)
export const AuditLogsReadOnly = () => {
  // Uses mock data since we haven't built the full system AuditLog yet, but strictly read-only.
  const logs = [
    { id: 1, user: 'Admin', action: 'Update Sales Target', time: new Date().toISOString(), ip: '192.168.1.5' },
    { id: 2, user: 'Cashier 1', action: 'Process Sale SL-002', time: new Date(Date.now()-3600000).toISOString(), ip: '192.168.1.10' },
  ];

  return (
    <div style={{ padding: '24px', backgroundColor: '#f8fafc', minHeight: 'calc(100vh - 64px)' }}>
      <PageHeader title="System Audit Logs" description="Strictly read-only view of system-wide administrative actions." />
      <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#64748b', fontSize: '13px' }}>
              <th style={{ padding: '16px 24px' }}>Time</th>
              <th>User</th>
              <th>Action</th>
              <th>IP Address</th>
            </tr>
          </thead>
          <tbody>
            {logs.map(l => (
              <tr key={l.id} style={{ borderBottom: '1px solid #f1f5f9', fontSize: '14px', color: '#475569' }}>
                <td style={{ padding: '16px 24px' }}>{new Date(l.time).toLocaleString()}</td>
                <td style={{ fontWeight: '600', color: '#0f172a' }}>{l.user}</td>
                <td>{l.action}</td>
                <td><code style={{ backgroundColor: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>{l.ip}</code></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// 5.23 Compliance Status
export const ComplianceStatus = () => {
  const [records, setRecords] = useState([]);

  useEffect(() => {
    const fetch = () => setRecords(boardAggregationService.getComplianceRecords());
    fetch();
    return boardAggregationService.subscribe(fetch);
  }, []);

  const getStatusDisplay = (status) => {
    if (status === 'compliant') return <span style={{ color: '#10b981', fontWeight: '700', backgroundColor: '#ecfdf5', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', textTransform: 'uppercase' }}>Compliant</span>;
    if (status === 'warning') return <span style={{ color: '#d97706', fontWeight: '700', backgroundColor: '#fffbeb', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', textTransform: 'uppercase' }}>Warning</span>;
    return <span style={{ color: '#dc2626', fontWeight: '700', backgroundColor: '#fef2f2', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', textTransform: 'uppercase' }}>Non-Compliant</span>;
  };

  return (
    <div style={{ padding: '24px', backgroundColor: '#f8fafc', minHeight: 'calc(100vh - 64px)' }}>
      <PageHeader title="Compliance Status" description="Regulatory checks, scores, and compliance tracking across departments." />
      
      <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#64748b', fontSize: '13px' }}>
              <th style={{ padding: '16px 24px' }}>Department ID</th>
              <th>Compliance Type</th>
              <th>Score (out of 100)</th>
              <th>Last Checked</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {records.map(r => (
              <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '16px 24px', fontWeight: '600', color: '#0f172a' }}>{r.department_id}</td>
                <td style={{ textTransform: 'capitalize', color: '#475569' }}>{r.compliance_type}</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '60px', height: '6px', backgroundColor: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${r.score}%`, backgroundColor: r.score > 80 ? '#10b981' : (r.score > 60 ? '#f59e0b' : '#ef4444') }} />
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: '600' }}>{r.score}</span>
                  </div>
                </td>
                <td style={{ fontSize: '14px', color: '#64748b' }}>{r.last_checked_at}</td>
                <td>{getStatusDisplay(r.status)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// 5.24 Legal Reports
export const LegalReports = () => {
  const [records, setRecords] = useState([]);

  useEffect(() => {
    const fetch = () => setRecords(boardAggregationService.getLegalRecords());
    fetch();
    return boardAggregationService.subscribe(fetch);
  }, []);

  return (
    <div style={{ padding: '24px', backgroundColor: '#f8fafc', minHeight: 'calc(100vh - 64px)' }}>
      <PageHeader title="Legal Reports" description="Ongoing litigation, contracts, and regulatory filings." />
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '24px' }}>
        {records.map(r => (
          <div key={r.id} style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569' }}>
                  <Scale size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', marginBottom: '4px' }}>{r.title}</div>
                  <div style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.05em' }}>Type: {r.type}</div>
                </div>
              </div>
              <span style={{ padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', backgroundColor: r.status === 'active' ? '#ecfdf5' : '#fffbeb', color: r.status === 'active' ? '#059669' : '#d97706' }}>
                {r.status}
              </span>
            </div>
            
            <div style={{ padding: '16px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
              <div style={{ fontSize: '13px', color: '#475569', marginBottom: '8px' }}><span style={{ fontWeight: '600' }}>Filed Date:</span> {r.filed_date}</div>
              <div style={{ fontSize: '13px', color: '#475569' }}>
                <span style={{ fontWeight: '600' }}>Documents:</span> {r.related_documents.join(', ')}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

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
