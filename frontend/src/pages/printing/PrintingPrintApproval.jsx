import React, { useState, useEffect } from 'react';
import { Printer, CheckCircle, Mail } from 'lucide-react';
import { printingState, logApproval } from '../../utils/printingTransactionService';
import { playSound } from '../../utils/printingSound';

const PrintingPrintApproval = () => {
  const [jobs, setJobs] = useState([]);
  const [checklist, setChecklist] = useState({ colors: false, registration: false, smudges: false, paper: false, finishing: false });
  const [activeJob, setActiveJob] = useState(null);

  const refresh = () => setJobs([...printingState.jobs.filter(j => j.status === 'Prepress' || j.status === 'Awaiting Test Print')]);

  useEffect(() => {
    refresh();
    playSound('info'); // "🖨️ Print Approval Requested"
  }, []);

  const isChecklistComplete = Object.values(checklist).every(v => v === true);

  const handleApprove = () => {
    if (!isChecklistComplete) { alert('Checklist incomplete.'); return; }
    if(window.confirm(`Release ${activeJob} to printing production?`)) {
      logApproval('Print', activeJob, 'Approved', checklist, '');
      playSound('success');
      setChecklist({ colors: false, registration: false, smudges: false, paper: false, finishing: false });
      setActiveJob(null);
      refresh();
    }
  };

  const handleSendTest = () => {
    playSound('success');
    alert(`Test Print sent to client for ${activeJob}. Status updated to Awaiting Test Print.`);
    const j = printingState.jobs.find(x => x.id === activeJob);
    if(j) j.status = 'Awaiting Test Print';
    setActiveJob(null);
    refresh();
  };

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: '#0f172a' }}>
          <Printer color="#06b6d4" size={28} /> PRINT APPROVAL
        </h1>
        <p style={{ color: '#64748b', margin: '4px 0 0' }}>Final sign-off releasing job to physical production.</p>
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
                <tr key={j.id} onClick={() => setActiveJob(j.id)} style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer', background: activeJob === j.id ? '#ecfeff' : 'white' }}>
                  <td style={{ padding: '12px 14px', fontWeight: 700, color: '#0f172a' }}>{j.id} <br/><span style={{fontSize: 12, color: '#475569', fontWeight: 400}}>{j.customerName}</span></td>
                  <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                    <span style={{ padding: '4px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700, background: '#f1f5f9', color: '#475569', marginRight: 8 }}>{j.status}</span>
                  </td>
                </tr>
              ))}
              {jobs.length === 0 && <tr><td colSpan={2} style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>No jobs pending print release.</td></tr>}
            </tbody>
          </table>
        </div>

        {activeJob ? (
          <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', padding: 24 }}>
            <h3 style={{ margin: '0 0 16px', color: '#0f172a', fontSize: 18 }}>Release Checklist: {activeJob}</h3>
            
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6, padding: 16, marginBottom: 20 }}>
              {Object.keys(checklist).map(k => (
                <label key={k} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, fontSize: 13, color: '#475569', cursor: 'pointer' }}>
                  <input type="checkbox" checked={checklist[k]} onChange={e => setChecklist({...checklist, [k]: e.target.checked})} />
                  {k === 'colors' ? 'Colors match design' : k === 'registration' ? 'Registration correct' : k === 'smudges' ? 'No smudges/errors' : k === 'paper' ? 'Paper correct' : 'Finishing matches spec'}
                </label>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <button onClick={handleApprove} disabled={!isChecklistComplete} style={{ width: '100%', padding: '12px', background: isChecklistComplete ? '#06b6d4' : '#e2e8f0', color: isChecklistComplete ? 'white' : '#94a3b8', border: 'none', borderRadius: 6, cursor: isChecklistComplete ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontWeight: 600, fontSize: 14 }}>
                <CheckCircle size={18} /> Approve Print Release
              </button>
              
              <button onClick={handleSendTest} style={{ width: '100%', padding: '10px', background: '#ecfeff', color: '#0891b2', border: '1px solid #cffafe', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontWeight: 600, fontSize: 13 }}>
                <Mail size={16} /> Send Test Print to Client
              </button>
            </div>
          </div>
        ) : (
          <div style={{ background: 'white', borderRadius: 8, border: '1px dashed #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
            Select a job to review
          </div>
        )}
      </div>
    </div>
  );
};

export default PrintingPrintApproval;
