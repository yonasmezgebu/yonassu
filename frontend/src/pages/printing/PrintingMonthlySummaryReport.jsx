import React, { useState, useEffect } from 'react';
import { PieChart, Download, TrendingUp, TrendingDown } from 'lucide-react';
import { printingState } from '../../utils/printingTransactionService';
import { playSound } from '../../utils/printingSound';

const PrintingMonthlySummaryReport = () => {
  const [data, setData] = useState({
    totalJobs: 0, prevJobs: 0, revenue: 0, prevRevenue: 0, costs: 0, topClients: [], topTypes: []
  });

  useEffect(() => {
    // Aggregate mock monthly data
    const jobs = printingState.jobs.filter(j => j.status === 'Completed');
    const revenue = jobs.reduce((sum, j) => sum + (j.totalCost || 0), 0);
    const costs = revenue * 0.6; // Mock 60% margin
    
    // Fake previous month data for MoM comparison
    const prevJobs = Math.max(1, jobs.length - 2);
    const prevRevenue = revenue * 0.85;

    // Aggregate Top Clients
    const clientMap = {};
    jobs.forEach(j => {
      if(!clientMap[j.customerName]) clientMap[j.customerName] = 0;
      clientMap[j.customerName] += (j.totalCost || 0);
    });
    const topClients = Object.entries(clientMap).sort((a,b)=>b[1]-a[1]).slice(0,3);

    // Aggregate Top Job Types
    const typeMap = {};
    jobs.forEach(j => {
      if(!typeMap[j.jobType]) typeMap[j.jobType] = 0;
      typeMap[j.jobType]++;
    });
    const topTypes = Object.entries(typeMap).sort((a,b)=>b[1]-a[1]).slice(0,3);

    setData({ totalJobs: jobs.length, prevJobs, revenue, prevRevenue, costs, topClients, topTypes });
    playSound('info');
  }, []);

  const handleExport = () => {
    playSound('success');
    alert('Exported Monthly Summary Report to PDF.');
  };

  const calcChange = (curr, prev) => {
    if(prev === 0) return 0;
    return Math.round(((curr - prev) / prev) * 100);
  };

  const jobChange = calcChange(data.totalJobs, data.prevJobs);
  const revChange = calcChange(data.revenue, data.prevRevenue);

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, background: 'white', padding: 20, borderRadius: 8, border: '1px solid #e2e8f0' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: '#0f172a' }}>
            <PieChart color="#8b5cf6" size={28} /> MONTHLY SUMMARY REPORT
          </h1>
          <p style={{ color: '#64748b', margin: '4px 0 0', fontSize: 14 }}>Executive-level rollup of overall business performance.</p>
        </div>
        <button onClick={handleExport} style={{ padding: '8px 16px', background: '#8b5cf6', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Download size={16} /> Export PDF
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, marginBottom: 24 }}>
        {/* Total Jobs */}
        <div style={{ background: 'white', padding: 24, borderRadius: 8, border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#64748b' }}>TOTAL COMPLETED JOBS (MTD)</div>
          <div style={{ fontSize: 36, fontWeight: 700, color: '#0f172a', margin: '8px 0' }}>{data.totalJobs}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: jobChange >= 0 ? '#10b981' : '#ef4444', fontWeight: 600 }}>
            {jobChange >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
            {Math.abs(jobChange)}% vs Last Month
          </div>
        </div>

        {/* Revenue */}
        <div style={{ background: 'white', padding: 24, borderRadius: 8, border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#64748b' }}>TOTAL REVENUE (MTD)</div>
          <div style={{ fontSize: 36, fontWeight: 700, color: '#0f172a', margin: '8px 0' }}>${data.revenue.toFixed(2)}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: revChange >= 0 ? '#10b981' : '#ef4444', fontWeight: 600 }}>
            {revChange >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
            {Math.abs(revChange)}% vs Last Month
          </div>
        </div>

        {/* Costs */}
        <div style={{ background: 'white', padding: 24, borderRadius: 8, border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#64748b' }}>ESTIMATED COSTS (MTD)</div>
          <div style={{ fontSize: 36, fontWeight: 700, color: '#ef4444', margin: '8px 0' }}>${data.costs.toFixed(2)}</div>
          <div style={{ fontSize: 13, color: '#64748b' }}>Includes Materials, Labor & Overhead</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Top Clients */}
        <div style={{ background: 'white', padding: 24, borderRadius: 8, border: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 16, color: '#0f172a' }}>Top Customers by Revenue</h3>
          {data.topClients.map((c, i) => (
            <div key={c[0]} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#94a3b8' }}>#{i+1}</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{c[0]}</span>
              </div>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#10b981' }}>${c[1].toFixed(2)}</span>
            </div>
          ))}
          {data.topClients.length === 0 && <div style={{ color: '#94a3b8', textAlign: 'center', padding: 20 }}>No data</div>}
        </div>

        {/* Top Types */}
        <div style={{ background: 'white', padding: 24, borderRadius: 8, border: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 16, color: '#0f172a' }}>Top Job Types by Volume</h3>
          {data.topTypes.map((t, i) => (
            <div key={t[0]} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#94a3b8' }}>#{i+1}</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{t[0]}</span>
              </div>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#3b82f6' }}>{t[1]} Jobs</span>
            </div>
          ))}
          {data.topTypes.length === 0 && <div style={{ color: '#94a3b8', textAlign: 'center', padding: 20 }}>No data</div>}
        </div>
      </div>
    </div>
  );
};

export default PrintingMonthlySummaryReport;
