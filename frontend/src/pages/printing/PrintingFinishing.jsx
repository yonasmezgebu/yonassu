import React, { useState, useEffect } from 'react';
import { Scissors, CheckSquare } from 'lucide-react';
import { printingState, updateJobStage } from '../../utils/printingTransactionService';
import { playSound } from '../../utils/printingSound';

const PrintingFinishing = () => {
  const [jobs, setJobs] = useState([]);

  const refreshJobs = () => setJobs([...printingState.jobs.filter(j => j.status === 'Finishing')]);

  useEffect(() => {
    refreshJobs();
    playSound('info'); // "✂️ Finishing Stage Updated"
  }, []);

  const handleComplete = (id) => {
    updateJobStage(id, 'Delivery');
    playSound('success');
    refreshJobs();
  };

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: '#0f172a' }}>
          <Scissors color="#d946ef" size={28} /> FINISHING
        </h1>
        <p style={{ color: '#64748b', margin: '4px 0 0' }}>Track jobs in post-print finishing.</p>
      </div>

      <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              {['Job #', 'Customer', 'Quantity', 'Finishing Type', 'Actions'].map(col => (
                <th key={col} style={{ padding: '12px 14px', textAlign: col === 'Quantity' ? 'right' : 'left', color: '#475569', fontWeight: 600, fontSize: 13 }}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {jobs.map(j => (
              <tr key={j.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '12px 14px', fontWeight: 700, color: '#0f172a' }}>{j.id}</td>
                <td style={{ padding: '12px 14px', color: '#0f172a' }}>{j.customerName}</td>
                <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 'bold' }}>{j.quantity.toLocaleString()}</td>
                <td style={{ padding: '12px 14px' }}>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {j.finishingOptions && j.finishingOptions.length > 0 ? (
                      j.finishingOptions.map(opt => (
                        <span key={opt} style={{ padding: '2px 8px', background: '#f3e8ff', color: '#9333ea', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>{opt}</span>
                      ))
                    ) : <span style={{ color: '#94a3b8', fontSize: 12 }}>None</span>}
                  </div>
                </td>
                <td style={{ padding: '12px 14px' }}>
                  <button onClick={() => handleComplete(j.id)} style={{ padding: '6px 12px', background: '#dcfce7', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600 }}><CheckSquare size={14} /> Move to Delivery</button>
                </td>
              </tr>
            ))}
            {jobs.length === 0 && <tr><td colSpan={5} style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>No jobs currently in Finishing.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PrintingFinishing;
