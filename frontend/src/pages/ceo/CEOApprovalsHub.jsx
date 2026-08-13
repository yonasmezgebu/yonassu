import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserCheck, DollarSign, FileText, ChevronRight, Package, Clock } from 'lucide-react';
import apiClient from '../../services/apiClient';

const CEOApprovalsHub = () => {
  const navigate = useNavigate();
  const [storeCount, setStoreCount] = useState(null);

  useEffect(() => {
    apiClient.get('/ceo/store-updates/pending')
      .then(res => setStoreCount(Array.isArray(res?.data?.updates) ? res.data.updates.length : 0))
      .catch(() => setStoreCount(0));
  }, []);

  const approvalLinks = [
    {
      title: 'Employee Approval',
      description: 'Review and approve newly registered employees to activate their accounts.',
      icon: <UserCheck size={28} color="#10b981" />,
      bg: '#ecfdf5',
      accentColor: '#10b981',
      path: '/ceo/employee-approvals',
      count: null
    },
    {
      title: 'Salary Approval',
      description: 'Review monthly payroll summaries and approve or reject salary disbursements.',
      icon: <DollarSign size={28} color="#2563eb" />,
      bg: '#eff6ff',
      accentColor: '#2563eb',
      path: '/ceo/salary-approval',
      count: null
    },
    {
      title: 'Fund Approvals (M9)',
      description: 'Review and approve pending fund requests and M9 tender requisitions.',
      icon: <FileText size={28} color="#eab308" />,
      bg: '#fefce8',
      accentColor: '#eab308',
      path: '/ceo/tenders?tab=Fund Requests',
      count: null
    },
    {
      title: 'Store Approvals',
      description: 'Review and approve pending inventory update requests from the General Store.',
      icon: <Package size={28} color="#f97316" />,
      bg: '#fff7ed',
      accentColor: '#f97316',
      path: '/ceo/store-approvals',
      count: storeCount
    },
    {
      title: 'Pharmacy Approvals',
      description: 'Review and approve pharmacy procurements, deliveries, and stock updates.',
      icon: <Package size={28} color="#10B981" />,
      bg: '#D1FAE5',
      accentColor: '#10B981',
      path: '/ceo/pharmacy-hub',
      count: null
    }
  ];

  return (
    <div style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif", color: '#111827', maxWidth: 1100, margin: '0 auto', padding: '20px 0' }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0, color: '#111827' }}>Approvals Hub</h1>
        <p style={{ color: '#6B7280', fontSize: 15, margin: '6px 0 0' }}>
          Select an approval category below to review pending requests.
        </p>
      </div>

      {/* Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
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
              borderRadius: 14,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              position: 'relative',
              borderTop: `3px solid ${link.accentColor}`
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.borderColor = link.accentColor;
              e.currentTarget.style.boxShadow = `0 8px 24px ${link.accentColor}22`;
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.borderColor = '#E5E7EB';
              e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderTopColor = link.accentColor;
            }}
          >
            {/* Pending count badge */}
            {link.count !== null && link.count > 0 && (
              <div style={{
                position: 'absolute', top: 16, right: 16,
                background: '#EF4444', color: '#fff',
                borderRadius: '9999px', minWidth: 26, height: 26,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 700, padding: '0 8px'
              }}>
                {link.count}
              </div>
            )}

            {/* Icon */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 56, height: 56, borderRadius: 12,
              background: link.bg, marginBottom: 16
            }}>
              {link.icon}
            </div>

            {/* Title */}
            <h3 style={{ fontSize: 17, fontWeight: 600, margin: '0 0 8px', color: '#111827' }}>
              {link.title}
            </h3>

            {/* Description */}
            <p style={{ fontSize: 14, color: '#6B7280', margin: 0, lineHeight: 1.6, flex: 1 }}>
              {link.description}
            </p>

            {/* Footer */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              width: '100%', marginTop: 20, paddingTop: 16,
              borderTop: '1px solid #F3F4F6'
            }}>
              {link.count !== null ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: link.count > 0 ? '#EF4444' : '#10B981', fontWeight: 600 }}>
                  <Clock size={14} />
                  {link.count === null ? '...' : link.count === 0 ? 'All clear' : `${link.count} waiting`}
                </span>
              ) : (
                <span style={{ fontSize: 13, color: '#9CA3AF' }}>Click to review</span>
              )}
              <ChevronRight size={18} color={link.accentColor} />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default CEOApprovalsHub;
