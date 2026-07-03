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

// 5.1 Company Overview
export const CompanyOverview = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetch = () => setData(boardAggregationService.getCompanyFinancials());
    fetch();
    return boardAggregationService.subscribe(fetch);
  }, []);

  if (!data) return null;

  return (
    <div style={{ padding: '24px', backgroundColor: '#f8fafc', minHeight: 'calc(100vh - 64px)' }}>
      <PageHeader title="Company Overview" description="High-level financial and operational summary." />
      
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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginBottom: '24px' }}>
        <Card title="Total Assets">
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#94a3b8' }}>
            {data.assets !== null ? <CurrencyDisplay amountCents={data.assets} /> : 'Data Unavailable'}
          </div>
          <div style={{ fontSize: '12px', color: '#cbd5e1', marginTop: '4px' }}>Finance module not fully integrated</div>
        </Card>
        <Card title="Total Liabilities">
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#94a3b8' }}>
            {data.liabilities !== null ? <CurrencyDisplay amountCents={data.liabilities} /> : 'Data Unavailable'}
          </div>
          <div style={{ fontSize: '12px', color: '#cbd5e1', marginTop: '4px' }}>Finance module not fully integrated</div>
        </Card>
        <Card title="Total Equity">
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#94a3b8' }}>
            {data.equity !== null ? <CurrencyDisplay amountCents={data.equity} /> : 'Data Unavailable'}
          </div>
          <div style={{ fontSize: '12px', color: '#cbd5e1', marginTop: '4px' }}>Finance module not fully integrated</div>
        </Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
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
    </div>
  );
};

// 5.2 Performance Summary
export const PerformanceSummary = () => {
  const [kpis, setKpis] = useState(null);
  const [depts, setDepts] = useState([]);

  useEffect(() => {
    const fetch = () => {
      setKpis(boardAggregationService.getKPIs());
      const raw = boardAggregationService.getDepartmentBreakdown();
      // Sort by profit margin approx
      raw.sort((a, b) => b.profit - a.profit);
      setDepts(raw);
    };
    fetch();
    return boardAggregationService.subscribe(fetch);
  }, []);

  if (!kpis) return null;

  return (
    <div style={{ padding: '24px', backgroundColor: '#f8fafc', minHeight: 'calc(100vh - 64px)' }}>
      <PageHeader title="Performance Summary" description="Key performance indicators and department rankings." />
      
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

      <Card title="Department Rankings (by Profit)">
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#64748b', fontSize: '13px' }}>
              <th style={{ padding: '12px 0' }}>Rank</th>
              <th>Department</th>
              <th>Revenue</th>
              <th>Profit</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {depts.map((d, idx) => (
              <tr key={d.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '16px 0', fontWeight: '700', color: '#0f172a' }}>#{idx + 1}</td>
                <td style={{ fontWeight: '600', color: '#3b82f6' }}>{d.dept}</td>
                <td><CurrencyDisplay amountCents={d.revenue} /></td>
                <td style={{ fontWeight: '700', color: d.profit >= 0 ? '#10b981' : '#ef4444' }}>
                  <CurrencyDisplay amountCents={d.profit} />
                </td>
                <td>{d.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
};

// 5.3 Key Alerts
export const KeyAlerts = () => {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    const fetch = () => setAlerts(boardAggregationService.getAlerts().filter(a => a.status === 'active'));
    fetch();
    return boardAggregationService.subscribe(fetch);
  }, []);

  const getSeverityStyle = (sev) => {
    if (sev === 'critical') return { bg: '#fef2f2', border: '#fca5a5', text: '#b91c1c', icon: <XCircle size={20} color="#b91c1c" /> };
    if (sev === 'warning') return { bg: '#fffbeb', border: '#fcd34d', text: '#d97706', icon: <AlertTriangle size={20} color="#d97706" /> };
    return { bg: '#eff6ff', border: '#bfdbfe', text: '#1d4ed8', icon: <ShieldAlert size={20} color="#1d4ed8" /> };
  };

  return (
    <div style={{ padding: '24px', backgroundColor: '#f8fafc', minHeight: 'calc(100vh - 64px)' }}>
      <PageHeader title="Key Alerts" description="Automated system alerts requiring executive attention." />
      
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

// 5.4 CEO Performance
export const CEOPerformance = () => {
  const [review, setReview] = useState(null);

  useEffect(() => {
    const fetch = () => setReview(boardAggregationService.getCEOReview());
    fetch();
    return boardAggregationService.subscribe(fetch);
  }, []);

  if (!review) return null;

  return (
    <div style={{ padding: '24px', backgroundColor: '#f8fafc', minHeight: 'calc(100vh - 64px)' }}>
      <PageHeader title="CEO Performance" description={`Review period: ${review.review_period}`} />
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px', marginBottom: '24px' }}>
        <Card title="Current CEO">
          <div style={{ fontSize: '28px', fontWeight: '800', color: '#0f172a', marginBottom: '16px' }}>{review.ceo_name}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ fontSize: '48px', fontWeight: '800', color: '#10b981', lineHeight: 1 }}>{review.performance_score}</div>
            <div style={{ fontSize: '14px', color: '#64748b' }}>Overall Score<br/>(out of 5.0)</div>
          </div>
        </Card>
        
        <Card title="Quarterly Actuals vs Target">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            {Object.entries(review.quarterly_actuals).map(([q, data]) => (
              <div key={q} style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '14px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '12px' }}>{q}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: '#475569' }}>Actual:</span>
                  <span style={{ fontWeight: '700', color: data.actual >= data.target ? '#10b981' : '#ef4444' }}>{data.actual}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#475569' }}>Target:</span>
                  <span style={{ fontWeight: '600', color: '#0f172a' }}>{data.target}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <Card title="Key Achievements" icon={<CheckCircle size={16} color="#10b981" />}>
          <ul style={{ margin: 0, paddingLeft: '20px', color: '#334155', lineHeight: 1.6 }}>
            {review.achievements.map((a, i) => <li key={i} style={{ marginBottom: '8px' }}>{a}</li>)}
          </ul>
        </Card>
        <Card title="Areas for Improvement" icon={<AlertTriangle size={16} color="#f59e0b" />}>
          <ul style={{ margin: 0, paddingLeft: '20px', color: '#334155', lineHeight: 1.6 }}>
            {review.improvement_areas.map((a, i) => <li key={i} style={{ marginBottom: '8px' }}>{a}</li>)}
          </ul>
        </Card>
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
