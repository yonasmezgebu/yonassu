import React, { useState, useEffect } from 'react';
import { CheckSquare, CheckCircle, FileText } from 'lucide-react';
import { printingState, logApproval } from '../../utils/printingTransactionService';
import { playSound } from '../../utils/printingSound';

const PrintingJobCompletionApproval = () => {
  const [jobs, setJobs] = useState([]);
  const [checklist, setChecklist] = useState({ printed: false, defects: false, colors: false, finishing: false, packaging: false, quantity: false });
  const [activeJob, setActiveJob] = useState(null);

  const refresh = () => setJobs([...printingState.jobs.filter(j => j.status === 'Delivery')]);

  useEffect(() => {
    refresh();
    playSound('info'); // "✅ Job Completion Approved"
  }, []);

  const isChecklistComplete = Object.values(checklist).every(v => v === true);

  const handleApprove = () => {
    if (!isChecklistComplete) { alert('Checklist incomplete.'); return; }
    if(window.confirm(`Mark Job ${activeJob} as COMPLETED? This will auto-generate Final Invoice and Completion Certificate.`)) {
      logApproval('Completion', activeJob, 'Approved', checklist, '');
      playSound('success');
      alert(`Job ${activeJob} Completed. Certificates Generated.`);
      setChecklist({ printed: false, defects: false, colors: false, finishing: false, packaging: false, quantity: false });
      setActiveJob(null);
      refresh();
    }
  };

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: '#0f172a' }}>
          <CheckSquare color="#22c55e" size={28} /> JOB COMPLETION
        </h1>
        <p style={{ color: '#64748b', margin: '4px 0 0' }}>Final administrative sign-off gating the terminal COMPLETED state.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '12px 14px', textAlign: 'left', color: '#475569', fontWeight: 600, fontSize: 13 }}>Job # / Client</th>
                <th style={{ padding: '12px 14px', textAlign: 'right', color: '#475569', fontWeight: 600, fontSize: 13 }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map(j => (
                <tr key={j.id} onClick={() => setActiveJob(j.id)} style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer', background: activeJob === j.id ? '#f0fdf4' : 'white' }}>
                  <td style={{ padding: '12px 14px', fontWeight: 700, color: '#0f172a' }}>{j.id} <br/><span style={{fontSize: 12, color: '#475569', fontWeight: 400}}>{j.customerName}</span></td>
                  <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                    <span style={{ padding: '4px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700, background: '#f1f5f9', color: '#475569' }}>{j.status}</span>
                  </td>
                </tr>
              ))}
              {jobs.length === 0 && <tr><td colSpan={2} style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>No jobs pending completion.</td></tr>}
            </tbody>
          </table>
        </div>

        {activeJob ? (
          <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', padding: 24 }}>
            <h3 style={{ margin: '0 0 16px', color: '#0f172a', fontSize: 18 }}>Final Sign-off: {activeJob}</h3>
            
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6, padding: 16, marginBottom: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', marginBottom: 12 }}>Quality Checklist</div>
              {Object.keys(checklist).map(k => (
                <label key={k} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, fontSize: 13, color: '#475569', cursor: 'pointer' }}>
                  <input type="checkbox" checked={checklist[k]} onChange={e => setChecklist({...checklist, [k]: e.target.checked})} />
                  {k === 'printed' ? 'All items printed' : k === 'defects' ? 'No defects' : k === 'colors' ? 'Colors correct' : k === 'finishing' ? 'Finishing complete' : k === 'packaging' ? 'Packaging done' : 'Quantity matches order'}
                </label>
              ))}
            </div>

            <button onClick={handleApprove} disabled={!isChecklistComplete} style={{ width: '100%', padding: '12px', background: isChecklistComplete ? '#22c55e' : '#e2e8f0', color: isChecklistComplete ? 'white' : '#94a3b8', border: 'none', borderRadius: 6, cursor: isChecklistComplete ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontWeight: 600, fontSize: 14 }}>
              <CheckCircle size={18} /> Approve Job Completion
            </button>
            <p style={{ margin: '12px 0 0', fontSize: 12, color: '#64748b', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}><FileText size={14} /> Auto-generates Invoice & Certificate</p>
          </div>
        ) : (
          <div style={{ background: 'white', borderRadius: 8, border: '1px dashed #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
            Select a delivered job to sign-off
          </div>
        )}
      </div>
    </div>
  );
};

export default PrintingJobCompletionApproval;
