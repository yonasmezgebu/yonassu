import React from 'react';
import { useNavigate } from 'react-router-dom';
import { UserCheck, DollarSign, FileText, ChevronRight } from 'lucide-react';

const CEOApprovalsHub = () => {
  const navigate = useNavigate();

  const approvalLinks = [
    {
      title: 'Employee Approval',
      description: 'Review and approve newly registered employees to activate their accounts.',
      icon: <UserCheck size={28} color="#10b981" />,
      bg: '#ecfdf5',
      path: '/ceo/employee-approvals'
    },
    {
      title: 'Salary Approval',
      description: 'Review monthly payroll summaries and approve or reject salary disbursements.',
      icon: <DollarSign size={28} color="#2563eb" />,
      bg: '#eff6ff',
      path: '/ceo/salary-approval'
    },
    {
      title: 'Fund Approvals (M9)',
      description: 'Review and approve pending fund requests and M9 tender requisitions.',
      icon: <FileText size={28} color="#eab308" />,
      bg: '#fefce8',
      path: '/ceo/tenders?tab=Fund Requests'
    }
  ];

  return (
    <div style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif", color: '#111827', maxWidth: 1000, margin: '0 auto', padding: '20px 0' }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0, color: '#111827' }}>Approvals Hub</h1>
        <p style={{ color: '#6B7280', fontSize: 15, margin: '6px 0 0' }}>
          Select an approval category below to review pending requests.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
        {approvalLinks.map((link, idx) => (
          <button
            key={idx}
            onClick={() => navigate(link.path)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              textAlign: 'left',
              padding: 24,
              background: '#fff',
              border: '1px solid #E5E7EB',
              borderRadius: 12,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              position: 'relative'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.borderColor = '#2563EB';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(37,99,235,0.1)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.borderColor = '#E5E7EB';
              e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 56, height: 56, borderRadius: 12, background: link.bg, marginBottom: 16 }}>
              {link.icon}
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 600, margin: '0 0 8px', color: '#111827' }}>
              {link.title}
            </h3>
            <p style={{ fontSize: 14, color: '#6B7280', margin: 0, lineHeight: 1.5 }}>
              {link.description}
            </p>
            <div style={{ position: 'absolute', top: 24, right: 24, color: '#9CA3AF' }}>
              <ChevronRight size={20} />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default CEOApprovalsHub;
