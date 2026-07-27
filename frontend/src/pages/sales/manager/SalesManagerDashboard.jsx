import React, { useState, useEffect } from 'react';
import { salesState, formatCents } from '../../../utils/salesManagerState';
import { Activity, Clock, CreditCard, Users, TrendingUp, Target, Package } from 'lucide-react';
import CurrencyDisplay from '../components/CurrencyDisplay';
import SalesDataTable from '../components/SalesDataTable';

const SalesManagerDashboard = () => {
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    // Simulate fetch
    setSummary(salesState.getDashboardSummary());
    salesState.notify('PAGE_LOAD');
  }, []);

  if (!summary) return <div style={{ padding: '24px' }}>Loading dashboard...</div>;

  const topProductsColumns = [
    { label: 'Product Name', field: 'name' },
    { label: 'Units Sold', field: 'qtySold' },
  ];

  return (
    <div style={{ padding: '24px', backgroundColor: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ marginBottom: '24px' }}>
        <p style={{ color: '#64748b', margin: 0 }}>Overview of sales performance, orders, and customer credit.</p>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: 0, border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ color: '#64748b', fontSize: '14px', fontWeight: '500' }}>Today's Sales</span>
            <Activity size={20} color="#3b82f6" />
          </div>
          <CurrencyDisplay amountCents={summary.todaySalesCents} style={{ fontSize: '28px', fontWeight: '700', color: '#0f172a' }} />
        </div>

        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: 0, border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ color: '#64748b', fontSize: '14px', fontWeight: '500' }}>MTD Revenue</span>
            <TrendingUp size={20} color="#10b981" />
          </div>
          <CurrencyDisplay amountCents={summary.revenueMtdCents} style={{ fontSize: '28px', fontWeight: '700', color: '#0f172a' }} />
          <div style={{ marginTop: '8px', fontSize: '12px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
             <ArrowUpIcon /> {summary.revenueGrowthPct}% vs last month
          </div>
        </div>

        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: 0, border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ color: '#64748b', fontSize: '14px', fontWeight: '500' }}>Outstanding Credit</span>
            <CreditCard size={20} color="#ef4444" />
          </div>
          <CurrencyDisplay amountCents={summary.outstandingCreditCents} style={{ fontSize: '28px', fontWeight: '700', color: '#dc2626' }} />
        </div>

        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: 0, border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ color: '#64748b', fontSize: '14px', fontWeight: '500' }}>Pending Orders</span>
            <Clock size={20} color="#f59e0b" />
          </div>
          <span style={{ fontSize: '28px', fontWeight: '700', color: '#0f172a' }}>{summary.pendingOrders}</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        {/* Monthly Target Progress */}
        <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: 0, border: '1px solid #e2e8f0' }}>
           <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#0f172a', margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
             <Target size={20} color="#8b5cf6" /> Sales Target (MTD)
           </h2>
           <div style={{ marginBottom: '16px' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
               <span color="#475569">Achieved: <CurrencyDisplay amountCents={summary.salesTarget.achievedCents} /></span>
               <span color="#64748b">Target: <CurrencyDisplay amountCents={summary.salesTarget.targetCents} /></span>
             </div>
             <div style={{ height: '12px', backgroundColor: '#f1f5f9', borderRadius: 0, overflow: 'hidden' }}>
                <div style={{ 
                  height: '100%', 
                  backgroundColor: '#8b5cf6', 
                  width: `${Math.min(100, (summary.salesTarget.achievedCents / summary.salesTarget.targetCents) * 100)}%`,
                  transition: 'width 1s ease-in-out'
                }} />
             </div>
           </div>
        </div>

        {/* Top Products */}
        <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: 0, border: '1px solid #e2e8f0' }}>
           <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#0f172a', margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
             <Package size={20} color="#0ea5e9" /> Top Products Today
           </h2>
           <SalesDataTable 
             columns={topProductsColumns} 
             data={summary.topProductsToday} 
             keyField="productId" 
             searchable={false}
           />
        </div>
      </div>
    </div>
  );
};

const ArrowUpIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="19" x2="12" y2="5"></line>
    <polyline points="5 12 12 5 19 12"></polyline>
  </svg>
);

export default SalesManagerDashboard;
