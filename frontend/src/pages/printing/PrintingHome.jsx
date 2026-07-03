import React, { useState, useEffect } from 'react';
import { Layers, PenTool, Printer, Scissors, Truck, CheckCircle, Clock, DollarSign, Activity, CheckSquare, Package, User, Image, Box, PieChart } from 'lucide-react';
import { getDashboardSummary, printingState } from '../../utils/printingTransactionService';
import { playSound } from '../../utils/printingSound';
import { useNavigate } from 'react-router-dom';

const PrintingHome = () => {
  const [summary, setSummary] = useState(null);
  const [dispatchCount, setDispatchCount] = useState(0);
  const [activeDrivers, setActiveDrivers] = useState(0);

  useEffect(() => {
    setSummary(getDashboardSummary());
    setDispatchCount(printingState.jobs.filter(j => j.status === 'Ready for Delivery' || j.status === 'Delivery').length);
    setActiveDrivers(printingState.drivers.filter(d => d.status !== 'Off').length);
    playSound('info');
  }, []);

  if (!summary) return <div>Loading...</div>;

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: '0 0 24px', color: '#0f172a' }}>Printing Overview</h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 24 }}>
        <div style={{ background: '#eff6ff', padding: 20, borderRadius: 12, border: '1px solid #bfdbfe' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#1d4ed8', fontWeight: 600, marginBottom: 8 }}>
            <Activity size={18} /> Active Jobs
          </div>
          <div style={{ fontSize: 32, fontWeight: 'bold', color: '#1e3a8a' }}>{summary.totalActive}</div>
        </div>
        <div style={{ background: '#ecfdf5', padding: 20, borderRadius: 12, border: '1px solid #a7f3d0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#047857', fontWeight: 600, marginBottom: 8 }}>
            <CheckSquare size={18} /> Completed Today
          </div>
          <div style={{ fontSize: 32, fontWeight: 'bold', color: '#064e3b' }}>{summary.completedToday}</div>
        </div>
        <div style={{ background: '#fffbeb', padding: 20, borderRadius: 12, border: '1px solid #fde68a' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#b45309', fontWeight: 600, marginBottom: 8 }}>
            <Package size={18} /> Ready for Dispatch
          </div>
          <div style={{ fontSize: 32, fontWeight: 'bold', color: '#78350f' }}>{dispatchCount}</div>
        </div>
        <div style={{ background: '#f5f3ff', padding: 20, borderRadius: 12, border: '1px solid #ddd6fe' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#6d28d9', fontWeight: 600, marginBottom: 8 }}>
            <User size={18} /> Active Drivers
          </div>
          <div style={{ fontSize: 32, fontWeight: 'bold', color: '#4c1d95' }}>{activeDrivers}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
        <div style={{ background: 'white', padding: 24, borderRadius: 12, border: '1px solid #e2e8f0' }}>
          <h2 style={{ fontSize: 18, margin: '0 0 16px', color: '#0f172a' }}>Production Funnel</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { label: 'In Design', count: summary.inDesign, color: '#8b5cf6', icon: <Image size={16}/> },
              { label: 'Prepress (Pending Approval)', count: summary.pendingApproval, color: '#f59e0b', icon: <CheckSquare size={16}/> },
              { label: 'In Printing', count: summary.inPrinting, color: '#06b6d4', icon: <Printer size={16}/> },
              { label: 'Finishing', count: summary.finishing, color: '#d946ef', icon: <Box size={16}/> }
            ].map(stage => (
              <div key={stage.label} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 140, display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#475569' }}>
                  {stage.icon} {stage.label}
                </div>
                <div style={{ flex: 1, background: '#f1f5f9', height: 24, borderRadius: 12, overflow: 'hidden' }}>
                  <div style={{ width: `${Math.max(5, (stage.count / Math.max(1, summary.totalActive)) * 100)}%`, height: '100%', background: stage.color, transition: 'width 1s' }}></div>
                </div>
                <div style={{ width: 30, textAlign: 'right', fontWeight: 'bold', color: '#0f172a' }}>{stage.count}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: 'white', padding: 24, borderRadius: 12, border: '1px solid #e2e8f0' }}>
          <h2 style={{ fontSize: 18, margin: '0 0 16px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
            <PieChart size={20} color="#10b981" /> Monthly Snapshot
          </h2>
          <div style={{ textAlign: 'center', padding: '20px 0', borderBottom: '1px solid #f1f5f9' }}>
            <div style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>MTD REVENUE</div>
            <div style={{ fontSize: 36, fontWeight: 'bold', color: '#0f172a', margin: '8px 0' }}>${summary.totalRevenueMtd.toLocaleString()}</div>
            <div style={{ fontSize: 12, color: '#10b981', fontWeight: 600 }}>+12% vs last month</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrintingHome;
