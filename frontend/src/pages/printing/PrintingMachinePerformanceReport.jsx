import React, { useState, useEffect } from 'react';
import { Cpu, Download, AlertTriangle } from 'lucide-react';
import { printingState } from '../../utils/printingTransactionService';
import { playSound } from '../../utils/printingSound';

const PrintingMachinePerformanceReport = () => {
  const [machines, setMachines] = useState([]);
  
  useEffect(() => {
    // Generate mock performance data for the machines based on state
    const reportData = printingState.machines.map(m => {
      const jobsRun = Math.floor(Math.random() * 50) + 10;
      const hoursInUse = Math.floor(Math.random() * 200) + 50;
      const downtimeHours = Math.floor(Math.random() * 20);
      const efficiency = Math.round((hoursInUse / (hoursInUse + downtimeHours)) * 100);
      return { ...m, jobsRun, hoursInUse, downtimeHours, efficiency, nextMaint: '2026-07-15' };
    });
    setMachines(reportData);
    playSound('info');
  }, []);

  const handleExport = () => {
    playSound('success');
    alert('Exported Machine Performance Report to Excel.');
  };

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, background: 'white', padding: 20, borderRadius: 8, border: '1px solid #e2e8f0' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: '#0f172a' }}>
            <Cpu color="#ef4444" size={28} /> MACHINE PERFORMANCE
          </h1>
          <p style={{ color: '#64748b', margin: '4px 0 0', fontSize: 14 }}>Aggregated efficiency metrics over selected period.</p>
        </div>
        <button onClick={handleExport} style={{ padding: '8px 16px', background: '#ef4444', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Download size={16} /> Export Excel
        </button>
      </div>

      <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              {['Machine', 'Type', 'Total Jobs Run', 'Hours In Use', 'Downtime (hrs)', 'Efficiency %', 'Next Maint.'].map(col => (
                <th key={col} style={{ padding: '12px 14px', textAlign: 'left', color: '#475569', fontWeight: 600, fontSize: 13 }}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {machines.map(m => (
              <tr key={m.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '12px 14px', fontWeight: 700, color: '#0f172a' }}>{m.name}</td>
                <td style={{ padding: '12px 14px', color: '#475569' }}>{m.type}</td>
                <td style={{ padding: '12px 14px', color: '#0f172a' }}>{m.jobsRun}</td>
                <td style={{ padding: '12px 14px', color: '#0f172a' }}>{m.hoursInUse}</td>
                <td style={{ padding: '12px 14px', color: m.downtimeHours > 10 ? '#ef4444' : '#475569' }}>{m.downtimeHours}</td>
                <td style={{ padding: '12px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 100, background: '#e2e8f0', height: 6, borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ width: `${m.efficiency}%`, background: m.efficiency > 90 ? '#10b981' : '#f59e0b', height: '100%' }}></div>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: m.efficiency > 90 ? '#10b981' : '#f59e0b' }}>{m.efficiency}%</span>
                  </div>
                </td>
                <td style={{ padding: '12px 14px', color: '#475569', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <AlertTriangle size={14} color="#f59e0b" /> {m.nextMaint}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PrintingMachinePerformanceReport;
