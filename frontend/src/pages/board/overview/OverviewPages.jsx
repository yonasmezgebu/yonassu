import React, { useState, useEffect } from 'react';
import { boardAggregationService } from '../../../utils/boardAggregationService';
import CurrencyDisplay from '../../sales/components/CurrencyDisplay';
import {
  TrendingUp, Users, Building, ShieldAlert, CheckCircle, 
  AlertTriangle, XCircle, FileText, Target, Activity, Printer
} from 'lucide-react';

const PageHeader = ({ title, description, actions }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px' }}>
    <div>
      <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', margin: '0 0 8px 0' }}>{title}</h1>
      <p style={{ color: '#64748b', margin: 0 }}>{description}</p>
    </div>
    {actions && <div>{actions}</div>}
  </div>
);

const Card = ({ children, title, icon }) => (
  <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px' }}>
    {title && (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: '#64748b', fontWeight: '600' }}>
        {icon} <span>{title}</span>
      </div>
    )}
    {children}
  </div>
);

// 5.1 Executive Overview (Combined)
export const ExecutiveOverview = () => {
  const [data, setData] = useState(null);
  const [kpis, setKpis] = useState(null);
  const [depts, setDepts] = useState([]);
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    const fetch = () => {
      setData(boardAggregationService.getCompanyFinancials());
      setKpis(boardAggregationService.getKPIs());
      const raw = boardAggregationService.getDepartmentBreakdown();
      raw.sort((a, b) => b.profit - a.profit);
      setDepts(raw);
      setAlerts(boardAggregationService.getAlerts().filter(a => a.status === 'active'));
    };
    fetch();
    return boardAggregationService.subscribe(fetch);
  }, []);

  if (!data || !kpis) return null;

  const getSeverityStyle = (sev) => {
    if (sev === 'critical') return { bg: '#fef2f2', border: '#fca5a5', text: '#b91c1c', icon: <XCircle size={20} color="#b91c1c" /> };
    if (sev === 'warning') return { bg: '#fffbeb', border: '#fcd34d', text: '#d97706', icon: <AlertTriangle size={20} color="#d97706" /> };
    return { bg: '#eff6ff', border: '#bfdbfe', text: '#1d4ed8', icon: <ShieldAlert size={20} color="#1d4ed8" /> };
  };

  return (
    <div style={{ padding: '24px', backgroundColor: '#f8fafc', minHeight: 'calc(100vh - 64px)' }}>
      <PageHeader title="Executive Overview" description="Combined high-level financial, operational summary, and key alerts." />
      
      {/* --- Section: Financial & Operational --- */}
      <h2 style={{ fontSize: '18px', color: '#0f172a', marginBottom: '16px' }}>Financial & Operational Status</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginBottom: '24px' }}>
        <Card title="Total Revenue" icon={<TrendingUp size={16} color="#10b981" />}>
          <div style={{ fontSize: '28px', fontWeight: '800', color: '#0f172a' }}>
            <CurrencyDisplay amountCents={data.revenue} />
          </div>
        </Card>
        <Card title="Total Expenses" icon={<TrendingUp size={16} color="#ef4444" style={{ transform: 'scaleY(-1)' }} />}>
          <div style={{ fontSize: '28px', fontWeight: '800', color: '#0f172a' }}>
            <CurrencyDisplay amountCents={data.expenses} />
          </div>
        </Card>
        <Card title="Net Profit" icon={<Activity size={16} color="#3b82f6" />}>
          <div style={{ fontSize: '28px', fontWeight: '800', color: data.profit >= 0 ? '#10b981' : '#ef4444' }}>
            <CurrencyDisplay amountCents={data.profit} />
          </div>
        </Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginBottom: '32px' }}>
        <Card title="Total Employees" icon={<Users size={16} />}>
          <div style={{ fontSize: '28px', fontWeight: '800', color: '#0f172a' }}>{data.employeeCount}</div>
        </Card>
        <Card title="Active Departments" icon={<Building size={16} />}>
          <div style={{ fontSize: '28px', fontWeight: '800', color: '#0f172a' }}>{data.departmentCount}</div>
        </Card>
        <Card title="Branch Network" icon={<Target size={16} />}>
          <div style={{ fontSize: '28px', fontWeight: '800', color: '#0f172a' }}>{data.branchCount}</div>
        </Card>
      </div>

      {/* --- Section: Performance --- */}
      <h2 style={{ fontSize: '18px', color: '#0f172a', marginBottom: '16px' }}>Performance Indicators</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '32px' }}>
        <Card title="Revenue Growth">
          <div style={{ fontSize: '28px', fontWeight: '800', color: '#10b981' }}>+{kpis.revenueGrowthPct}%</div>
          <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>Year over Year</div>
        </Card>
        <Card title="Profit Margin">
          <div style={{ fontSize: '28px', fontWeight: '800', color: '#3b82f6' }}>{kpis.profitMarginPct}%</div>
          <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>Consolidated Net Margin</div>
        </Card>
        <Card title="Employee Performance">
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#94a3b8' }}>
            {kpis.employeePerformanceScore || 'Not yet tracked'}
          </div>
          <div style={{ fontSize: '12px', color: '#cbd5e1', marginTop: '4px' }}>Requires HR system integration</div>
        </Card>
        <Card title="Customer Satisfaction">
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#94a3b8' }}>
            {kpis.customerSatisfactionScore || 'Not yet tracked'}
          </div>
          <div style={{ fontSize: '12px', color: '#cbd5e1', marginTop: '4px' }}>Requires CSAT survey integration</div>
        </Card>
      </div>

      {/* --- Section: Key Alerts --- */}
      <h2 style={{ fontSize: '18px', color: '#0f172a', marginBottom: '16px' }}>Key Alerts</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {alerts.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <CheckCircle size={48} style={{ margin: '0 auto 16px' }} />
            <div style={{ fontSize: '18px', fontWeight: '600' }}>All clear</div>
            <p>No active alerts at this time.</p>
          </div>
        ) : alerts.map(alert => {
          const style = getSeverityStyle(alert.severity);
          return (
            <div key={alert.id} style={{ backgroundColor: style.bg, border: `1px solid ${style.border}`, borderRadius: '12px', padding: '20px', display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
              <div style={{ marginTop: '2px' }}>{style.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <div style={{ fontSize: '16px', fontWeight: '700', color: style.text }}>{alert.title}</div>
                  <div style={{ fontSize: '13px', color: '#64748b' }}>{new Date(alert.created_at).toLocaleString()}</div>
                </div>
                <div style={{ fontSize: '14px', color: '#475569', marginBottom: '12px' }}>{alert.description}</div>
                <div style={{ display: 'flex', gap: '16px', fontSize: '12px', fontWeight: '600', color: '#64748b' }}>
                  <span>Source: {alert.source_entity_type} ({alert.source_entity_id})</span>
                  <span style={{ textTransform: 'uppercase' }}>Category: {alert.category.replace('_', ' ')}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};



// 5.5 Department Summary
export const DepartmentSummary = () => {
  const [depts, setDepts] = useState([]);

  useEffect(() => {
    const fetch = () => setDepts(boardAggregationService.getDepartmentBreakdown());
    fetch();
    return boardAggregationService.subscribe(fetch);
  }, []);

  return (
    <div style={{ padding: '24px', backgroundColor: '#f8fafc', minHeight: 'calc(100vh - 64px)' }}>
      <PageHeader title="Department Summary" description="Comprehensive breakdown of all departments by revenue, expenses, and profit." />
      
      <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#64748b', fontSize: '13px' }}>
              <th style={{ padding: '16px 24px' }}>Department</th>
              <th>Revenue</th>
              <th>Expenses</th>
              <th>Net Profit</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {depts.map(d => (
              <tr key={d.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '16px 24px', fontWeight: '600', color: '#0f172a' }}>{d.dept}</td>
                <td><CurrencyDisplay amountCents={d.revenue} /></td>
                <td><CurrencyDisplay amountCents={d.expenses} /></td>
                <td style={{ fontWeight: '700', color: d.profit >= 0 ? '#10b981' : '#ef4444' }}>
                  <CurrencyDisplay amountCents={d.profit} />
                </td>
                <td style={{ fontSize: '18px' }}>{d.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ marginTop: '16px', display: 'flex', gap: '24px', fontSize: '13px', color: '#64748b' }}>
        <div>✅ Profitable & within budget</div>
        <div>⚠️ Profitable but over budget</div>
        <div>❌ Operating at a loss</div>
      </div>
    </div>
  );
};
