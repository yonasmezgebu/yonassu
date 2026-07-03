import React, { useState, useEffect } from 'react';
import { PenTool, CheckCircle, XCircle, Send } from 'lucide-react';
import { printingState, logApproval } from '../../utils/printingTransactionService';
import { playSound } from '../../utils/printingSound';

const PrintingDesignApproval = () => {
  const [jobs, setJobs] = useState([]);
  const [checklist, setChecklist] = useState({ brief: false, colors: false, fonts: false, layout: false, errors: false });
  const [activeJob, setActiveJob] = useState(null);

  const refresh = () => setJobs([...printingState.jobs.filter(j => j.status === 'Design')]);

  useEffect(() => {
    refresh();
    playSound('info'); // "🎨 Design Approval Requested"
  }, []);

  const isChecklistComplete = Object.values(checklist).every(v => v === true);

  const handleApprove = () => {
    if (!isChecklistComplete) { alert('Checklist incomplete.'); return; }
    if(window.confirm(`Approve design for ${activeJob}?`)) {
      logApproval('Design', activeJob, 'Approved', checklist, '');
      playSound('success');
      setChecklist({ brief: false, colors: false, fonts: false, layout: false, errors: false });
      setActiveJob(null);
      refresh();
    }
  };

  const handleReject = (type) => {
    const reason = prompt(`Enter mandatory reason for ${type}:`);
    if (reason) {
      logApproval('Design', activeJob, type, checklist, reason);
      playSound('success');
      setActiveJob(null);
      refresh();
    }
  };

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: '#0f172a' }}>
          <PenTool color="#f59e0b" size={28} /> DESIGN APPROVAL
        </h1>
        <p style={{ color: '#64748b', margin: '4px 0 0' }}>Formal sign-off gating designs before prepress.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Job List */}
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
                <tr key={j.id} onClick={() => setActiveJob(j.id)} style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer', background: activeJob === j.id ? '#fffbeb' : 'white' }}>
                  <td style={{ padding: '12px 14px', fontWeight: 700, color: '#0f172a' }}>{j.id} <br/><span style={{fontSize: 12, color: '#475569', fontWeight: 400}}>{j.customerName}</span></td>
                  <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                    <button style={{ padding: '6px 12px', background: '#f8fafc', color: '#475569', border: '1px solid #cbd5e1', borderRadius: 4, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Review</button>
                  </td>
                </tr>
              ))}
              {jobs.length === 0 && <tr><td colSpan={2} style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>No designs pending approval.</td></tr>}
            </tbody>
          </table>
        </div>

        {/* Approval Panel */}
        {activeJob ? (
          <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', padding: 24 }}>
            <h3 style={{ margin: '0 0 16px', color: '#0f172a', fontSize: 18 }}>Reviewing: {activeJob}</h3>
            
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6, padding: 16, marginBottom: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', marginBottom: 12 }}>Design Checklist</div>
              {Object.keys(checklist).map(k => (
                <label key={k} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, fontSize: 13, color: '#475569', cursor: 'pointer' }}>
                  <input type="checkbox" checked={checklist[k]} onChange={e => setChecklist({...checklist, [k]: e.target.checked})} />
                  {k === 'brief' ? 'Design meets brief' : k === 'colors' ? 'Colors correct' : k === 'fonts' ? 'Fonts correct' : k === 'layout' ? 'Layout correct' : 'No errors'}
                </label>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <button onClick={handleApprove} disabled={!isChecklistComplete} style={{ width: '100%', padding: '12px', background: isChecklistComplete ? '#10b981' : '#e2e8f0', color: isChecklistComplete ? 'white' : '#94a3b8', border: 'none', borderRadius: 6, cursor: isChecklistComplete ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontWeight: 600, fontSize: 14 }}>
                <CheckCircle size={18} /> Approve Design
              </button>
              
              <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={() => handleReject('Revision')} style={{ flex: 1, padding: '10px', background: '#fef3c7', color: '#d97706', border: '1px solid #fde68a', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>Req. Revision</button>
                <button onClick={() => handleReject('Rejected')} style={{ flex: 1, padding: '10px', background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>Reject</button>
              </div>

              <button onClick={() => { playSound('success'); alert('Sent to Client!'); }} style={{ width: '100%', padding: '10px', background: '#eff6ff', color: '#3b82f6', border: '1px solid #bfdbfe', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontWeight: 600, fontSize: 13 }}>
                <Send size={16} /> Send for Client Approval
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

export default PrintingDesignApproval;
