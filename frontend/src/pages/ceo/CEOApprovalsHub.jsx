import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserCheck, DollarSign, FileText, ChevronRight, Package, Clock, Truck, Printer, Award } from 'lucide-react';
import apiClient from '../../services/apiClient';

/* ─── Global Styles (Enterprise UI System) ──────────────────────────────── */
const GlobalStyles = () => (
  <style>{`
    :root {
      --color-primary: #2563EB;
      --color-primary-hover: #1D4ED8;
      --color-bg-page: #F5F6FA;
      --color-bg-card: #FFFFFF;
      --color-border: #E5E7EB;
      --color-text-primary: #111827;
      --color-text-secondary: #6B7280;
      --color-text-muted: #9CA3AF;
      --color-success: #16A34A;
      --color-success-bg: #DCFCE7;
      --color-danger: #DC2626;
      --color-danger-bg: #FEE2E2;
      --color-warning: #D97706;
      --color-warning-bg: #FEF3C7;
      --color-info: #0284C7;
      --color-info-bg: #E0F2FE;
      --font-family: 'Inter', 'Segoe UI', Roboto, -apple-system, sans-serif;
    }

    .ceo-hub-wrapper {
      padding: 24px;
      min-height: calc(100vh - 60px);
      box-sizing: border-box;
      background: var(--color-bg-page);
      font-family: var(--font-family);
      color: var(--color-text-primary);
    }
    
    .ceo-hub-container {
      max-width: 1024px; /* Narrower max-width for list view readability */
      margin: 0 auto;
    }

    .ceo-hub-header {
      margin-bottom: 32px;
    }

    .ceo-hub-title {
      font-size: 26px;
      font-weight: 800;
      margin: 0 0 8px 0;
      color: var(--color-text-primary);
      letter-spacing: -0.02em;
    }

    .ceo-hub-subtitle {
      font-size: 14px;
      color: var(--color-text-secondary);
      line-height: 1.5;
      margin: 0;
    }

    .ceo-hub-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .ceo-hub-row {
      background: var(--color-bg-card);
      border: 1px solid var(--color-border);
      border-radius: 10px;
      padding: 16px 24px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06);
      transition: all 150ms ease-in-out;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 20px;
      position: relative;
      text-align: left;
      width: 100%;
    }
    
    .ceo-hub-row:hover {
      box-shadow: 0 4px 12px rgba(0,0,0,0.08);
      transform: translateY(-1px);
      background: #F9FAFB;
      border-color: var(--color-text-muted);
    }

    .ceo-hub-icon-wrap {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 48px;
      height: 48px;
      border-radius: 10px;
      flex-shrink: 0;
    }

    .ceo-hub-content {
      flex: 1;
      min-width: 0;
    }

    .ceo-hub-row-title {
      font-size: 16px;
      font-weight: 700;
      color: var(--color-text-primary);
      margin: 0 0 4px 0;
    }

    .ceo-hub-row-desc {
      font-size: 14px;
      color: var(--color-text-secondary);
      line-height: 1.5;
      margin: 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .ceo-hub-meta {
      display: flex;
      align-items: center;
      gap: 24px;
      flex-shrink: 0;
    }

    .ceo-hub-badge {
      background: var(--color-danger);
      color: #FFFFFF;
      border-radius: 9999px;
      min-width: 24px;
      height: 24px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 700;
      padding: 0 8px;
      box-shadow: 0 2px 4px rgba(220,38,38,0.2);
    }

    .ceo-hub-status {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      font-weight: 600;
    }

    @media (max-width: 768px) {
      .ceo-hub-wrapper { padding: 16px; }
      .ceo-hub-row {
        flex-direction: column;
        align-items: flex-start;
        padding: 16px;
        gap: 12px;
      }
      .ceo-hub-row-desc {
        white-space: normal;
      }
      .ceo-hub-meta {
        width: 100%;
        justify-content: space-between;
        margin-top: 8px;
        padding-top: 12px;
        border-top: 1px solid var(--color-border);
      }
    }
  `}</style>
);

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
      icon: <UserCheck size={24} />,
      bg: 'var(--color-success-bg)',
      color: 'var(--color-success)',
      path: '/ceo/employee-approvals',
      count: null
    },
    {
      title: 'Salary Approval',
      description: 'Review monthly payroll summaries and approve or reject salary disbursements.',
      icon: <DollarSign size={24} />,
      bg: 'var(--color-info-bg)',
      color: 'var(--color-info)',
      path: '/ceo/salary-approval',
      count: null
    },
    {
      title: 'Finance Approvals (PCV)',
      description: 'Review and approve or reject petty cash vouchers submitted by Finance.',
      icon: <DollarSign size={24} />,
      bg: 'var(--color-danger-bg)',
      color: 'var(--color-danger)',
      path: '/ceo/finance-approvals',
      count: null
    },
    {
      title: 'Fund Approvals (M9)',
      description: 'Review and approve pending fund requests and M9 tender requisitions.',
      icon: <FileText size={24} />,
      bg: 'var(--color-warning-bg)',
      color: 'var(--color-warning)',
      path: '/ceo/approvals/tenders?tab=Fund Requests',
      count: null
    },
    {
      title: 'Store Approvals',
      description: 'Review and approve pending inventory update requests from the General Store.',
      icon: <Package size={24} />,
      bg: '#FFF7ED',
      color: '#F97316',
      path: '/ceo/store-approvals',
      count: storeCount
    },
    {
      title: 'Pharmacy Approvals',
      description: 'Review and approve pharmacy procurements, deliveries, and stock updates.',
      icon: <Package size={24} />,
      bg: 'var(--color-success-bg)',
      color: 'var(--color-success)',
      path: '/ceo/pharmacy-hub',
      count: null
    },
    {
      title: 'Tender Approvals',
      description: 'Review and approve pending tenders, bids, and large fund requests.',
      icon: <Award size={24} />,
      bg: '#ECFCCB',
      color: '#84CC16',
      path: '/ceo/approvals/tenders',
      count: null
    },
    {
      title: 'Agri & Car Rental Approvals',
      description: 'Review and approve agricultural equipment and car rental requests.',
      icon: <Truck size={24} />,
      bg: 'var(--color-info-bg)',
      color: 'var(--color-info)',
      path: '/ceo/approvals/agri-and-car-rental',
      count: null
    },
    {
      title: 'Printing Approvals',
      description: 'Review and approve internal printing, publishing, and branding requests.',
      icon: <Printer size={24} />,
      bg: '#F3E8FF',
      color: '#A855F7',
      path: '/ceo/approvals/printing',
      count: null
    }
  ];

  return (
    <div className="ceo-hub-wrapper">
      <GlobalStyles />
      <div className="ceo-hub-container">
        
        {/* Header */}
        <div className="ceo-hub-header">
          <h1 className="ceo-hub-title">Approvals Hub</h1>
          <p className="ceo-hub-subtitle">
            Select an approval category below to review pending requests.
          </p>
        </div>

        {/* List View */}
        <div className="ceo-hub-list">
          {approvalLinks.map((link, idx) => (
            <button
              key={idx}
              onClick={() => navigate(link.path)}
              className="ceo-hub-row"
              style={{ borderLeft: `4px solid ${link.color}` }}
            >
              {/* Icon */}
              <div className="ceo-hub-icon-wrap" style={{ background: link.bg, color: link.color }}>
                {link.icon}
              </div>

              {/* Text Content */}
              <div className="ceo-hub-content">
                <h3 className="ceo-hub-row-title">
                  {link.title}
                </h3>
                <p className="ceo-hub-row-desc">
                  {link.description}
                </p>
              </div>

              {/* Meta & Status */}
              <div className="ceo-hub-meta">
                {link.count !== null && link.count > 0 && (
                  <div className="ceo-hub-badge">
                    {link.count}
                  </div>
                )}
                
                {link.count !== null ? (
                  <span className="ceo-hub-status" style={{ color: link.count > 0 ? 'var(--color-danger)' : 'var(--color-success)' }}>
                    <Clock size={14} />
                    {link.count === 0 ? 'All clear' : `${link.count} waiting`}
                  </span>
                ) : (
                  <span className="ceo-hub-status" style={{ color: 'var(--color-text-muted)', fontWeight: 500 }}>
                    Review <ChevronRight size={16} />
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CEOApprovalsHub;
