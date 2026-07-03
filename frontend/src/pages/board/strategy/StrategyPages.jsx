import React, { useState, useEffect } from 'react';
import { boardAggregationService } from '../../../utils/boardAggregationService';
import { Target, Shield, AlertTriangle, ShieldAlert, AlertCircle, Clock, CheckCircle } from 'lucide-react';

const PageHeader = ({ title, description }) => (
  <div style={{ marginBottom: '24px' }}>
    <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', margin: '0 0 8px 0' }}>{title}</h1>
    <p style={{ color: '#64748b', margin: 0 }}>{description}</p>
  </div>
);

// 5.6 Strategy Progress
export const StrategyProgress = () => {
  const [goals, setGoals] = useState([]);

  useEffect(() => {
    const fetch = () => setGoals(boardAggregationService.getStrategicGoals());
    fetch();
    return boardAggregationService.subscribe(fetch);
  }, []);

  return (
    <div style={{ padding: '24px', backgroundColor: '#f8fafc', minHeight: 'calc(100vh - 64px)', fontFamily: "'Inter', sans-serif" }}>
      <PageHeader title="Strategy Progress" description="Track progress against primary strategic goals. Computed projections determine status." />
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '24px' }}>
        {goals.map(goal => {
          const progressPct = Math.min(100, (goal.current_value / goal.target_value) * 100);
          
          return (
            <div key={goal.id} style={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Target size={18} color="#3b82f6" />
                  {goal.description}
                </h3>
                {goal.status === 'on_track' ? (
                  <span style={{ backgroundColor: '#ecfdf5', color: '#059669', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px', textTransform: 'uppercase' }}><CheckCircle size={12} /> On Track</span>
                ) : (
                  <span style={{ backgroundColor: '#fef2f2', color: '#dc2626', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px', textTransform: 'uppercase' }}><AlertTriangle size={12} /> Behind</span>
                )}
              </div>

              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>
                  <span>{goal.current_value.toLocaleString()} {goal.unit}</span>
                  <span>{goal.target_value.toLocaleString()} {goal.unit}</span>
                </div>
                <div style={{ height: '8px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${progressPct}%`, backgroundColor: goal.status === 'on_track' ? '#10b981' : '#f59e0b', transition: 'width 0.5s ease' }} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#64748b' }}>
                <span>Started: {goal.start_date}</span>
                <span>Target: {goal.target_date}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// 5.7 Risk Overview
export const RiskOverview = () => {
  const [risks, setRisks] = useState([]);

  useEffect(() => {
    const fetch = () => setRisks(boardAggregationService.getRisks());
    fetch();
    return boardAggregationService.subscribe(fetch);
  }, []);

  const getSeverityStyle = (sev) => {
    if (sev === 'critical') return { color: '#dc2626', icon: <ShieldAlert size={16} /> };
    if (sev === 'high') return { color: '#ea580c', icon: <AlertTriangle size={16} /> };
    if (sev === 'medium') return { color: '#d97706', icon: <AlertCircle size={16} /> };
    return { color: '#059669', icon: <Clock size={16} /> };
  };

  // Group risks by category
  const categorized = risks.reduce((acc, r) => {
    if (!acc[r.category]) acc[r.category] = [];
    acc[r.category].push(r);
    return acc;
  }, {});

  return (
    <div style={{ padding: '24px', backgroundColor: '#f8fafc', minHeight: 'calc(100vh - 64px)' }}>
      <PageHeader title="Risk Overview" description="Enterprise risk register with mitigation status and severity tracking." />
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
        {['financial', 'operational', 'compliance', 'strategic'].map(cat => (
          <div key={cat} style={{ backgroundColor: 'white', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
            <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>{cat} Risks</div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a' }}>{categorized[cat]?.length || 0}</div>
          </div>
        ))}
      </div>

      <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#64748b', fontSize: '13px' }}>
              <th style={{ padding: '16px 24px' }}>Risk Title</th>
              <th>Category</th>
              <th>Severity</th>
              <th>Owner</th>
              <th>Mitigation Plan</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {risks.map(r => {
              const style = getSeverityStyle(r.severity);
              return (
                <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '16px 24px', fontWeight: '600', color: '#0f172a' }}>
                    <div style={{ marginBottom: '4px' }}>{r.title}</div>
                    <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '400' }}>{r.description}</div>
                  </td>
                  <td style={{ textTransform: 'capitalize', color: '#475569', fontSize: '14px' }}>{r.category}</td>
                  <td style={{ color: style.color, fontWeight: '700', textTransform: 'uppercase', fontSize: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {style.icon} {r.severity}
                    </div>
                  </td>
                  <td style={{ fontSize: '14px', color: '#475569' }}>{r.owner}</td>
                  <td style={{ fontSize: '13px', color: '#64748b', maxWidth: '250px' }}>{r.mitigation_plan}</td>
                  <td>
                    <span style={{ 
                      backgroundColor: r.status === 'open' ? '#f1f5f9' : '#ecfdf5', 
                      color: r.status === 'open' ? '#475569' : '#059669', 
                      padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase' 
                    }}>
                      {r.status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
