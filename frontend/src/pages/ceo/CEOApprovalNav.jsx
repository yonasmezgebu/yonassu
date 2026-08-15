import React from 'react';
import { useNavigate } from 'react-router-dom';
import { UserCheck, DollarSign, ArrowLeft } from 'lucide-react';

/**
 * mode = 'employee' → shows Employee Approval tab only
 * mode = 'salary'   → shows Salary Approval tab only
 * (default)         → shows both (fallback, not used currently)
 */
const CEOApprovalNav = ({ mode }) => {
  const navigate = useNavigate();

  const allLinks = {
    employee: { label: 'Employee Approval', path: '/ceo/employee-approvals', icon: <UserCheck size={16} /> },
    salary:   { label: 'Salary Approval',   path: '/ceo/salary-approval',    icon: <DollarSign size={16} /> },
  };

  const visibleLinks = mode ? [allLinks[mode]] : Object.values(allLinks);

  return (
    <>
      <style>{`
        .approval-topbar {
          display: flex; align-items: center; gap: 10px;
          margin-bottom: 20px; background: #fff;
          padding: 10px 16px; border-radius: 8px;
          border: 1px solid #E5E7EB; flex-wrap: wrap;
        }
        .approval-back-btn {
          display: flex; align-items: center; gap: 6px;
          padding: 6px 14px; border-radius: 6px; cursor: pointer;
          font-weight: 500; font-size: 13px;
          border: 1px solid #E5E7EB; background: #F9FAFB; color: #4B5563;
          transition: all 0.15s ease-in-out;
        }
        .approval-back-btn:hover {
          background: #F59E0B; color: #FFFFFF; border-color: #F59E0B;
          transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,.08);
        }
        .approval-divider {
          width: 1px; height: 24px; background: #E5E7EB; margin: 0 4px;
        }
        .nav-tab-active {
          display: flex; align-items: center; gap: 6px;
          padding: 6px 14px; border-radius: 6px;
          font-weight: 600; font-size: 13px;
          border: 1px solid #2563EB; background: #EFF6FF; color: #1E40AF;
          cursor: default;
        }
      `}</style>
      <div className="approval-topbar">
        {/* Back button */}
        <button className="approval-back-btn" onClick={() => navigate('/ceo/approvals')}>
          <ArrowLeft size={14} /> Back to Approvals Hub
        </button>

        <div className="approval-divider" />

        {/* Active page tab (read-only indicator) */}
        {visibleLinks.map(lnk => (
          <span key={lnk.path} className="nav-tab-active">
            {lnk.icon} {lnk.label}
          </span>
        ))}
      </div>
    </>
  );
};

export default CEOApprovalNav;

