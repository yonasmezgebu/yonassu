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
      max-width: 1536px;
      margin: 0 auto;
    }

    .ceo-hub-title {
      font-size: 28px;
      font-weight: 700;
      margin: 0 0 8px 0;
      color: var(--color-text-primary);
    }

    .ceo-hub-subtitle {
      font-size: 16px;
      color: var(--color-text-secondary);
      line-height: 1.5;
      margin: 0;
    }

    .ceo-hub-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 20px;
      margin-top: 32px;
    }

    .ceo-hub-card {
      background: var(--color-bg-card);
      border: 1px solid var(--color-border);
      border-radius: 10px;
      padding: 24px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06);
      transition: all 150ms ease-in-out;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      position: relative;
      text-align: left;
      width: 100%;
    }
    
    .ceo-hub-card:hover {
      box-shadow: 0 4px 12px rgba(0,0,0,0.08);
      transform: translateY(-1px);
    }

    .ceo-hub-card-title {
      font-size: 16px;
      font-weight: 600;
      color: var(--color-text-primary);
      margin: 0 0 8px 0;
    }

    .ceo-hub-card-desc {
      font-size: 14px;
      color: var(--color-text-secondary);
      line-height: 1.5;
      margin: 0;
      flex: 1;
    }

    .ceo-hub-badge {
      position: absolute;
      top: 16px;
      right: 16px;
      background: var(--color-danger);
      color: #FFFFFF;
      border-radius: 9999px;
      min-width: 24px;
      height: 24px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 600;
      padding: 0 8px;
    }

    .ceo-hub-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      margin-top: 20px;
      padding-top: 16px;
      border-top: 1px solid var(--color-border);
    }

    @media (max-width: 1024px) {
      .ceo-hub-wrapper { padding: 16px; }
    }
    @media (max-width: 480px) {
      .ceo-hub-wrapper { padding: 12px; }
      .ceo-hub-grid { grid-template-columns: 1fr; gap: 16px; }
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
      path: '/ceo/tenders?tab=Fund Requests',
      count: null
    },
    {
      title: 'Store Approvals',
      description: 'Review and approve pending inventory update requests from the General Store.',
      icon: <Package size={24} />,
      bg: '#fff7ed', // specific orange bg
      color: '#f97316',
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
      bg: '#ecfccb', // lime bg
      color: '#84cc16',
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
      bg: '#f3e8ff', // purple bg
      color: '#a855f7',
      path: '/ceo/approvals/printing',
      count: null
    }
  ];

  return (
    <div className="ceo-hub-wrapper">
      <GlobalStyles />
      <div className="ceo-hub-container">
        
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <h1 className="ceo-hub-title">Approvals Hub</h1>
          <p className="ceo-hub-subtitle">
            Select an approval category below to review pending requests.
          </p>
        </div>

        {/* Cards Grid */}
        <div className="ceo-hub-grid">
          {approvalLinks.map((link, idx) => (
            <button
              key={idx}
              onClick={() => navigate(link.path)}
              className="ceo-hub-card"
              style={{ borderTop: `3px solid ${link.color}`, background: 'var(--color-bg-card)' }}
              onMouseOver={(e) => {
                e.currentTarget.style.borderColor = link.color;
                e.currentTarget.style.boxShadow = `0 8px 24px ${link.color}22`;
                e.currentTarget.style.backgroundColor = 'var(--color-bg-page)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-border)';
                e.currentTarget.style.borderTopColor = link.color;
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)';
                e.currentTarget.style.backgroundColor = 'var(--color-bg-card)';
              }}
            >
              {/* Pending count badge */}
              {link.count !== null && link.count > 0 && (
                <div className="ceo-hub-badge">
                  {link.count}
                </div>
              )}

              {/* Icon */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 48, height: 48, borderRadius: 10,
                background: link.bg, color: link.color, marginBottom: 16
              }}>
                {link.icon}
              </div>

              {/* Title */}
              <h3 className="ceo-hub-card-title">
                {link.title}
              </h3>

              {/* Description */}
              <p className="ceo-hub-card-desc">
                {link.description}
              </p>

              {/* Footer */}
              <div className="ceo-hub-footer">
                {link.count !== null ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: link.count > 0 ? 'var(--color-danger)' : 'var(--color-success)', fontWeight: 600 }}>
                    <Clock size={14} />
                    {link.count === null ? '...' : link.count === 0 ? 'All clear' : `${link.count} waiting`}
                  </span>
                ) : (
                  <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>Click to review</span>
                )}
                <ChevronRight size={18} color={link.color} />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CEOApprovalsHub;
