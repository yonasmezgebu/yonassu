import React, { useState, useEffect } from 'react';
import { CheckSquare, AlertTriangle, Send, Check } from 'lucide-react';
import { printingState, approvePrepress, updateJobStage } from '../../utils/printingTransactionService';
import { playSound } from '../../utils/printingSound';
import { StageStyles } from './printingStageStyles';
import StageNav from './StageNav';

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
    <div className="stg-root" style={{ margin: '-24px', minHeight: 'calc(100vh - 64px)' }}>
      <StageStyles />
      <StageNav current="prepress" />
      <div className="stg-head">
        <h1 className="stg-title">
          <CheckSquare color="#D97706" /> FILE CHECK / PREPRESS
        </h1>
        <p className="stg-sub">Quality-check design files. All checks must pass before sending to print.</p>
      </div>

      <div className="stg-card-grid">
        {jobs.map(j => {
          const checks = checklists[j.id] || {};
          const passed = isAllChecked(j.id);
          const file = j.files && j.files.length > 0 ? j.files[j.files.length - 1].name : 'No file attached';

          return (
            <div key={j.id} className="stg-job-card">

              {/* Job Info */}
              <div>
                <div className="stg-job-id">{j.id}</div>
                <div className="stg-job-meta"><strong>Customer:</strong> {j.customerName}</div>
                <div className="stg-job-meta"><strong>Type:</strong> {j.jobType}</div>
                <div className="stg-job-file"><strong>File:</strong> <a href="#">{file}</a></div>
                <span className="stg-pill" style={{ background: passed ? '#DCFCE7' : '#FEF3C7', color: passed ? '#16A34A' : '#D97706' }}>
                  {passed ? 'Ready for Print' : 'Pending Checklist'}
                </span>
              </div>

              {/* Checklist */}
              <div className="stg-checklist">
                <h4 className="stg-check-title">Mandatory Checklist</h4>
                <div className="stg-check-grid">
                  {[
                    { key: 'bleed', label: 'Bleed Checked' },
                    { key: 'res', label: 'Resolution Checked (300dpi+)' },
                    { key: 'color', label: 'Color Mode Checked (CMYK)' },
                    { key: 'fonts', label: 'Fonts Embedded/Outlined' },
                    { key: 'size', label: 'Final Size Correct' }
                  ].map(c => (
                    <label key={c.key} className={`stg-check-item${checks[c.key] ? ' stg-checked' : ''}`}>
                      <input type="checkbox" checked={checks[c.key] || false} onChange={() => toggleCheck(j.id, c.key)} />
                      {c.label}
                    </label>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="stg-actions-col">
                <button
                  onClick={() => handleApprove(j.id)}
                  disabled={!passed}
                  className="stg-btn stg-btn--success stg-btn--block"
                >
                  <Check size={16} /> Approve File
                </button>
                <button
                  disabled={!passed}
                  onClick={() => { updateJobStage(j.id, 'Printing'); playSound('success'); refreshJobs(); }}
                  className="stg-btn stg-btn--cyan stg-btn--block"
                >
                  <Send size={16} /> Send to Print
                </button>

                <hr className="stg-divider" />

                <div>
                  <input
                    placeholder="Notes for Designer..."
                    value={fixNotes[j.id] || ''}
                    onChange={(e) => setFixNotes(p => ({...p, [j.id]: e.target.value}))}
                    className="stg-textarea"
                    style={{ marginBottom: 8 }}
                  />
                  <button
                    onClick={() => handleRequestFix(j.id)}
                    className="stg-btn stg-btn--soft-red stg-btn--block"
                  >
                    <AlertTriangle size={14} /> Request Fix
                  </button>
                </div>
              </div>

            </div>
          );
        })}
        {jobs.length === 0 && <div className="stg-empty stg-empty--card">No jobs currently in Prepress.</div>}
      </div>
    </div>
  );
};

export default PrintingPrepress;
