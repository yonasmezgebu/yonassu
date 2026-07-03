import React, { useState, useEffect } from 'react';
import { Activity, Printer, Download, Calendar } from 'lucide-react';
import { printingState } from '../../utils/printingTransactionService';
import { playSound } from '../../utils/printingSound';

const PrintingDailyProductionReport = () => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [stats, setStats] = useState({ completed: [], inProgress: [], byStage: {}, byMachine: {} });

  const generateReport = () => {
    const completed = printingState.jobs.filter(j => j.status === 'Completed' && j.completedDate === date);
    const inProgress = printingState.jobs.filter(j => j.status !== 'Completed' && j.status !== 'Cancelled');
    
    const byStage = {
      Design: inProgress.filter(j => j.status === 'Design').length,
      Prepress: inProgress.filter(j => j.status === 'Prepress').length,
      Printing: inProgress.filter(j => j.status === 'Printing').length,
      Finishing: inProgress.filter(j => j.status === 'Finishing').length,
      Delivery: inProgress.filter(j => j.status === 'Delivery' || j.status === 'Ready for Delivery').length
    };

    const byMachine = {};
    printingState.machines.forEach(m => { byMachine[m.name] = 0; });
    inProgress.forEach(j => {
      if(j.machineAssigned && byMachine[j.machineAssigned] !== undefined) byMachine[j.machineAssigned]++;
    });

    setStats({ completed, inProgress, byStage, byMachine });
  };

  useEffect(() => {
    generateReport();
    playSound('info');
  }, [date]);

  const handleExport = () => {
    playSound('success');
    alert(`Exported Daily Production Report for ${date} to PDF.`);
  };

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, background: 'white', padding: 20, borderRadius: 8, border: '1px solid #e2e8f0' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: '#0f172a' }}>
            <Activity color="#0ea5e9" size={28} /> DAILY PRODUCTION REPORT
          </h1>
          <p style={{ color: '#64748b', margin: '4px 0 0', fontSize: 14 }}>SUTANA PRINTING SYSTEM • Generated: {new Date().toLocaleString()}</p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, color: '#475569' }} />
          <button onClick={handleExport} style={{ padding: '8px 16px', background: '#0ea5e9', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Download size={16} /> Export PDF
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20, marginBottom: 24 }}>
        <div style={{ background: 'white', padding: 20, borderRadius: 8, border: '1px solid #e2e8f0' }}>
          <div style={{ color: '#64748b', fontSize: 13, fontWeight: 600 }}>JOBS COMPLETED TODAY</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: '#10b981', margin: '8px 0' }}>{stats.completed.length}</div>
          <div style={{ fontSize: 12, color: '#94a3b8' }}>Target: 10/day ({Math.round((stats.completed.length/10)*100)}%)</div>
        </div>
        <div style={{ background: 'white', padding: 20, borderRadius: 8, border: '1px solid #e2e8f0' }}>
          <div style={{ color: '#64748b', fontSize: 13, fontWeight: 600 }}>TOTAL IN PROGRESS</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: '#3b82f6', margin: '8px 0' }}>{stats.inProgress.length}</div>
          <div style={{ fontSize: 12, color: '#94a3b8' }}>Active jobs across all stages</div>
        </div>
        <div style={{ background: 'white', padding: 20, borderRadius: 8, border: '1px solid #e2e8f0' }}>
          <div style={{ color: '#64748b', fontSize: 13, fontWeight: 600 }}>ACTIVE MACHINES</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: '#f59e0b', margin: '8px 0' }}>{Object.values(stats.byMachine).filter(v => v>0).length} / {Object.keys(stats.byMachine).length}</div>
          <div style={{ fontSize: 12, color: '#94a3b8' }}>Currently utilized</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 20 }}>
        {/* Stage Breakdown */}
        <div style={{ background: 'white', padding: 20, borderRadius: 8, border: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 15, color: '#0f172a' }}>WIP by Stage</h3>
          {Object.entries(stats.byStage).map(([stage, count]) => (
            <div key={stage} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}>
              <span style={{ color: '#475569', fontWeight: 500 }}>{stage}</span>
              <span style={{ color: '#0f172a', fontWeight: 700 }}>{count}</span>
            </div>
          ))}
        </div>

        {/* Completed List */}
        <div style={{ background: 'white', padding: 20, borderRadius: 8, border: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 15, color: '#0f172a' }}>Completed Jobs Register ({date})</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                <th style={{ padding: '8px 12px', textAlign: 'left', color: '#64748b' }}>Job #</th>
                <th style={{ padding: '8px 12px', textAlign: 'left', color: '#64748b' }}>Client</th>
                <th style={{ padding: '8px 12px', textAlign: 'left', color: '#64748b' }}>Type</th>
              </tr>
            </thead>
            <tbody>
              {stats.completed.map(j => (
                <tr key={j.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '8px 12px', fontWeight: 600, color: '#0f172a' }}>{j.id}</td>
                  <td style={{ padding: '8px 12px', color: '#475569' }}>{j.customerName}</td>
                  <td style={{ padding: '8px 12px', color: '#475569' }}>{j.jobType}</td>
                </tr>
              ))}
              {stats.completed.length === 0 && <tr><td colSpan={3} style={{ padding: 20, textAlign: 'center', color: '#94a3b8' }}>No jobs completed on this date.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PrintingDailyProductionReport;
