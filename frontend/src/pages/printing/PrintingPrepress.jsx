import React, { useState, useEffect } from 'react';
import { CheckSquare, AlertTriangle, Send, Check } from 'lucide-react';
import { printingState, approvePrepress, updateJobStage } from '../../utils/printingTransactionService';
import { playSound } from '../../utils/printingSound';

const PrintingPrepress = () => {
  const [jobs, setJobs] = useState([]);
  const [checklists, setChecklists] = useState({});
  const [fixNotes, setFixNotes] = useState({});

  const refreshJobs = () => {
    const prepressJobs = printingState.jobs.filter(j => j.status === 'Prepress');
    setJobs([...prepressJobs]);
    
    // Initialize checklists if not present
    const initChecks = { ...checklists };
    prepressJobs.forEach(j => {
      if (!initChecks[j.id]) {
        initChecks[j.id] = { bleed: false, res: false, color: false, fonts: false, size: false };
      }
    });
    setChecklists(initChecks);
  };

  useEffect(() => {
    refreshJobs();
    playSound('info'); // "📄 File Check Updated"
  }, []);

  const toggleCheck = (jobId, field) => {
    setChecklists(prev => ({
      ...prev,
      [jobId]: { ...prev[jobId], [field]: !prev[jobId][field] }
    }));
  };

  const isAllChecked = (jobId) => {
    const checks = checklists[jobId];
    return checks && checks.bleed && checks.res && checks.color && checks.fonts && checks.size;
  };

  const handleApprove = (id) => {
    approvePrepress(id);
    playSound('success');
    refreshJobs();
  };

  const handleRequestFix = (id) => {
    if (!fixNotes[id]) {
      alert("Please provide notes for the requested fix.");
      return;
    }
    // Update audit trail and send back to Design
    updateJobStage(id, 'Design', `Prepress: Needs Fix - ${fixNotes[id]}`);
    playSound('success');
    setFixNotes(prev => ({...prev, [id]: ''}));
    refreshJobs();
  };

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: '#0f172a' }}>
          <CheckSquare color="#f59e0b" size={28} /> FILE CHECK / PREPRESS
        </h1>
        <p style={{ color: '#64748b', margin: '4px 0 0' }}>Quality-check design files. All checks must pass before sending to print.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
        {jobs.map(j => {
          const checks = checklists[j.id] || {};
          const passed = isAllChecked(j.id);
          const file = j.files && j.files.length > 0 ? j.files[j.files.length - 1].name : 'No file attached';

          return (
            <div key={j.id} style={{ background: 'white', borderRadius: 10, border: '1px solid #e2e8f0', padding: 20, display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', gap: 20 }}>
              
              {/* Job Info */}
              <div>
                <div style={{ fontSize: 18, fontWeight: 'bold', color: '#0f172a', marginBottom: 8 }}>{j.id}</div>
                <div style={{ fontSize: 13, color: '#475569', marginBottom: 4 }}><strong>Customer:</strong> {j.customerName}</div>
                <div style={{ fontSize: 13, color: '#475569', marginBottom: 4 }}><strong>Type:</strong> {j.jobType}</div>
                <div style={{ fontSize: 13, color: '#475569', marginBottom: 12 }}><strong>File:</strong> <a href="#" style={{ color: '#3b82f6' }}>{file}</a></div>
                <div style={{ display: 'inline-block', padding: '4px 10px', background: passed ? '#dcfce7' : '#fef3c7', color: passed ? '#16a34a' : '#d97706', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
                  {passed ? 'Ready for Print' : 'Pending Checklist'}
                </div>
              </div>

              {/* Checklist */}
              <div style={{ background: '#f8fafc', padding: 16, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <h4 style={{ margin: '0 0 12px', fontSize: 13, color: '#475569', textTransform: 'uppercase' }}>Mandatory Checklist</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {[
                    { key: 'bleed', label: 'Bleed Checked' },
                    { key: 'res', label: 'Resolution Checked (300dpi+)' },
                    { key: 'color', label: 'Color Mode Checked (CMYK)' },
                    { key: 'fonts', label: 'Fonts Embedded/Outlined' },
                    { key: 'size', label: 'Final Size Correct' }
                  ].map(c => (
                    <label key={c.key} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer', color: checks[c.key] ? '#16a34a' : '#475569', fontWeight: checks[c.key] ? 600 : 400 }}>
                      <input type="checkbox" checked={checks[c.key] || false} onChange={() => toggleCheck(j.id, c.key)} style={{ accentColor: '#16a34a', width: 16, height: 16 }} />
                      {c.label}
                    </label>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <button 
                  onClick={() => handleApprove(j.id)}
                  disabled={!passed}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px', background: passed ? '#16a34a' : '#e2e8f0', color: passed ? 'white' : '#94a3b8', border: 'none', borderRadius: 6, cursor: passed ? 'pointer' : 'not-allowed', fontWeight: 600 }}
                >
                  <Check size={16} /> Approve File
                </button>
                <button 
                  disabled={!passed}
                  onClick={() => { updateJobStage(j.id, 'Printing'); playSound('success'); refreshJobs(); }}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px', background: passed ? '#0891b2' : '#e2e8f0', color: passed ? 'white' : '#94a3b8', border: 'none', borderRadius: 6, cursor: passed ? 'pointer' : 'not-allowed', fontWeight: 600 }}
                >
                  <Send size={16} /> Send to Print
                </button>

                <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '4px 0' }} />
                
                <div>
                  <input 
                    placeholder="Notes for Designer..." 
                    value={fixNotes[j.id] || ''} 
                    onChange={(e) => setFixNotes(p => ({...p, [j.id]: e.target.value}))} 
                    style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 12, marginBottom: 8, boxSizing: 'border-box' }} 
                  />
                  <button 
                    onClick={() => handleRequestFix(j.id)}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '8px', background: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: 12 }}
                  >
                    <AlertTriangle size={14} /> Request Fix
                  </button>
                </div>
              </div>
              
            </div>
          );
        })}
        {jobs.length === 0 && <div style={{ padding: 40, background: 'white', borderRadius: 8, textAlign: 'center', color: '#94a3b8', border: '1px solid #e2e8f0' }}>No jobs currently in Prepress.</div>}
      </div>
    </div>
  );
};

export default PrintingPrepress;
