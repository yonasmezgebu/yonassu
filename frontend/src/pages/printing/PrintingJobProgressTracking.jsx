import React, { useState, useEffect } from 'react';
import { BarChart, Clock } from 'lucide-react';
import { printingState } from '../../utils/printingTransactionService';
import { playSound } from '../../utils/printingSound';

const PrintingJobProgressTracking = () => {
  const [jobs, setJobs] = useState([]);

  useEffect(() => {
    setJobs([...printingState.jobs.filter(j => j.status !== 'Completed' && j.status !== 'Cancelled')]);
  }, []);

  const handleUpdate = (id) => {
    const val = prompt('Update total hours spent on this job:');
    if (val && !isNaN(val)) {
      playSound('success');
      alert(`Hours updated for Job ${id}.`);
    }
  };

  const getOverallProgress = (status) => {
    const map = { 'Pending': 5, 'Design': 20, 'Prepress': 40, 'Printing': 65, 'Finishing': 85, 'Delivery': 95, 'Completed': 100 };
    return map[status] || 0;
  };

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: '#0f172a' }}>
          <BarChart color="#10b981" size={28} /> JOB PROGRESS TRACKING
        </h1>
        <p style={{ color: '#64748b', margin: '4px 0 0' }}>Cross-stage aggregated view calculating holistic lifecycle completion.</p>
      </div>

      <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              {['Job #', 'Customer', 'Current Stage', 'Overall % Complete', 'Logged Hours', 'Actions'].map(col => (
                <th key={col} style={{ padding: '12px 14px', textAlign: 'left', color: '#475569', fontWeight: 600, fontSize: 13 }}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {jobs.map(j => {
              const pct = getOverallProgress(j.status);
              return (
                <tr key={j.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px 14px', fontWeight: 700, color: '#0f172a' }}>{j.id}</td>
                  <td style={{ padding: '12px 14px', color: '#0f172a' }}>{j.customerName}</td>
                  <td style={{ padding: '12px 14px', color: '#10b981', fontWeight: 600 }}>{j.status}</td>
                  <td style={{ padding: '12px 14px', width: 300 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ flex: 1, height: 8, background: '#e2e8f0', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: '#10b981' }}></div>
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 700, width: 40 }}>{pct}%</span>
                    </div>
                  </td>
                  <td style={{ padding: '12px 14px', color: '#475569', fontWeight: 600 }}>0 hrs</td>
                  <td style={{ padding: '12px 14px' }}>
                    <button onClick={() => handleUpdate(j.id)} style={{ padding: '6px 12px', background: '#f8fafc', color: '#475569', border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600 }}><Clock size={14} /> Log Hours</button>
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

export default PrintingJobProgressTracking;
