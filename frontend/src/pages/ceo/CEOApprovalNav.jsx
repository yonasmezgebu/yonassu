import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { UserCheck, DollarSign, FileText } from 'lucide-react';

const CEOApprovalNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isFund = location.pathname.includes('/tenders') && location.search.includes('Fund Requests');

  const links = [
    { label: 'Employee Approval', path: '/ceo/employee-approvals', icon: <UserCheck size={16} /> },
    { label: 'Salary Approval', path: '/ceo/salary-approval', icon: <DollarSign size={16} /> },
    { label: 'Fund Approvals', path: '/ceo/tenders?tab=Fund Requests', icon: <FileText size={16} />, isActive: isFund }
  ];

  return (
    <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', background: '#fff', padding: '10px 16px', borderRadius: '8px', border: '1px solid #E5E7EB', flexWrap: 'wrap' }}>
      {links.map((lnk, idx) => {
        const active = lnk.isActive !== undefined ? lnk.isActive : location.pathname === lnk.path;
        return (
          <button
            key={idx}
            onClick={() => navigate(lnk.path)}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '6px 14px', borderRadius: '6px', cursor: 'pointer',
              border: active ? '1px solid #2563EB' : '1px solid #E5E7EB',
              background: active ? '#EFF6FF' : '#F9FAFB',
              color: active ? '#1E40AF' : '#4B5563',
              fontWeight: 500, fontSize: '13px',
              transition: 'all 0.15s'
            }}
          >
            {lnk.icon} {lnk.label}
          </button>
        );
      })}
    </div>
  );
};

export default CEOApprovalNav;
