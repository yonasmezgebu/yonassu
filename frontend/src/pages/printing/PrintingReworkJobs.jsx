import React, { useState, useEffect } from 'react';
import { RotateCcw, UserCheck, TrendingUp, AlertOctagon } from 'lucide-react';
import { printingState, generateId, updateJobStage } from '../../utils/printingTransactionService';
import { playSound } from '../../utils/printingSound';

const REWORK_TYPES = ['Re-print', 'Re-cut', 'Re-bind', 'Re-package', 'Manual Fix'];

const PrintingReworkJobs = () => {
  const [reworks, setReworks] = useState([]);
  const [toast, setToast] = useState(null);
  const [assignModal, setAssignModal] = useState({ open: false, id: null });
  const [progressModal, setProgressModal] = useState({ open: false, id: null, progress: 0 });

  const refresh = () => setReworks([...printingState.reworkJobs]);

  useEffect(() => { refresh(); playSound('info'); }, []);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  const handleAssign = (e) => {
    e.preventDefault();
    const data = new FormData(e.target);
    const rw = printingState.reworkJobs.find(r => r.id === assignModal.id);
    if (rw) {
      rw.assignedTo = data.get('assignedTo');
      rw.type = data.get('reworkType');
      rw.expectedCompletion = data.get('expectedCompletion');
      rw.startedDate = new Date().toISOString();
      rw.status = 'In Progress';
      playSound('info');
      showToast(`🔄 Rework Assigned — Job #${rw.originalJobId}`);
    }
    setAssignModal({ open: false, id: null });
    refresh();
  };

  const handleUpdateProgress = (id, percent) => {
    const rw = printingState.reworkJobs.find(r => r.id === id);
    if (rw) { rw.progress = percent; rw.status = percent >= 100 ? 'Completed' : 'In Progress'; }
    setProgressModal({ open: false, id: null, progress: 0 });
    playSound('success');
    showToast(`📊 Rework Progress Updated.`);
    refresh();
  };

  const handleComplete = (id) => {
    if (!window.confirm('Mark this rework as complete? The job will be returned to Inspection.')) return;
    const rw = printingState.reworkJobs.find(r => r.id === id);
    if (rw) {
      rw.status = 'Completed';
      updateJobStage(rw.originalJobId, 'QC Rework'); // Return to inspection queue
      playSound('success');
      showToast(`✅ Rework Completed — Job #${rw.originalJobId} returned to Inspection.`);
    }
    refresh();
  };

  const handleEscalate = (id) => {
    const rw = printingState.reworkJobs.find(r => r.id === id);
    if (rw) {
      rw.status = 'Escalated';
      playSound('info');
      showToast(`🚨 Escalated to Supervisor — Job #${rw.originalJobId}`);
    }
    refresh();
  };

  const statusColor = (s) => {
    if (s === 'Pending') return { bg: '#f1f5f9', color: '#475569' };
    if (s === 'In Progress') return { bg: '#eff6ff', color: '#2563eb' };
    if (s === 'Completed') return { bg: '#ecfdf5', color: '#059669' };
    if (s === 'Escalated') return { bg: '#fef2f2', color: '#dc2626' };
    return { bg: '#f1f5f9', color: '#475569' };
  };

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif", position: 'relative' }}>
      {toast && (
        <div style={{ position: 'fixed', top: 20, right: 24, zIndex: 9999, background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1e40af', padding: '14px 20px', borderRadius: 8, fontWeight: 600, fontSize: 14, boxShadow: '0 4px 20px rgba(0,0,0,0.12)' }}>
          {toast}
        </div>
      )}

      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: '#0f172a' }}>
          <RotateCcw color="#8b5cf6" size={28} /> REWORK JOBS
        </h1>
        <p style={{ color: '#64748b', margin: '4px 0 0' }}>Track and manage all jobs requiring remediation before re-inspection.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: 20 }}>
        {reworks.map(rw => {
          const sc = statusColor(rw.status);
          const defect = printingState.defectReports.find(d => d.id === rw.defectId);
          return (
            <div key={rw.id} style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>{rw.id}</div>
                  <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>Original Job: <strong>{rw.originalJobId}</strong></div>
                </div>
                <span style={{ padding: '4px 10px', borderRadius: 12, fontSize: 11, fontWeight: 700, background: sc.bg, color: sc.color }}>{rw.status}</span>
              </div>

              <div style={{ background: '#f8fafc', borderRadius: 6, padding: 12, marginBottom: 14, fontSize: 13, color: '#475569' }}>
                <p style={{ margin: '0 0 6px' }}><strong>Defect Type:</strong> {defect?.type || 'N/A'}</p>
                <p style={{ margin: '0 0 6px' }}><strong>Rework Type:</strong> <span style={{ background: '#e0e7ff', color: '#4338ca', padding: '2px 8px', borderRadius: 4, fontWeight: 600 }}>{rw.type || 'Not Assigned'}</span></p>
                <p style={{ margin: '0 0 6px' }}><strong>Assigned To:</strong> {rw.assignedTo || 'Unassigned'}</p>
                {rw.expectedCompletion && <p style={{ margin: 0 }}><strong>ETA:</strong> {new Date(rw.expectedCompletion).toLocaleDateString()}</p>}
              </div>

              {/* Progress Bar */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#64748b', marginBottom: 4 }}>
                  <span>Progress</span><span>{rw.progress || 0}%</span>
                </div>
                <div style={{ height: 8, background: '#e2e8f0', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: '#8b5cf6', width: `${rw.progress || 0}%`, transition: 'width 0.4s' }}></div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {rw.status === 'Pending' && (
                  <button onClick={() => setAssignModal({ open: true, id: rw.id })} style={{ flex: 1, padding: '8px', background: '#eff6ff', color: '#3b82f6', border: '1px solid #bfdbfe', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                    <UserCheck size={14} /> Assign Rework
                  </button>
                )}
                {rw.status === 'In Progress' && (
                  <button onClick={() => setProgressModal({ open: true, id: rw.id, progress: rw.progress || 0 })} style={{ flex: 1, padding: '8px', background: '#f5f3ff', color: '#7c3aed', border: '1px solid #ddd6fe', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                    <TrendingUp size={14} /> Update Progress
                  </button>
                )}
                {(rw.status === 'In Progress') && (
                  <button onClick={() => handleComplete(rw.id)} style={{ flex: 1, padding: '8px', background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                    ✅ Mark Complete
                  </button>
                )}
                {rw.status !== 'Completed' && rw.status !== 'Escalated' && (
                  <button onClick={() => handleEscalate(rw.id)} style={{ padding: '8px', background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <AlertOctagon size={14} /> Escalate
                  </button>
                )}
              </div>
            </div>
          );
        })}
        {reworks.length === 0 && <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', padding: 40, textAlign: 'center', color: '#94a3b8', gridColumn: '1/-1' }}>No rework jobs pending.</div>}
      </div>

      {/* Assign Modal */}
      {assignModal.open && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', padding: 24, borderRadius: 8, width: 400, boxShadow: '0 20px 40px rgba(0,0,0,0.15)' }}>
            <h3 style={{ margin: '0 0 16px', color: '#0f172a', fontSize: 18 }}>Assign Rework</h3>
            <form onSubmit={handleAssign}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Rework Type</label>
                <select name="reworkType" required style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: 6 }}>
                  {REWORK_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Assign To</label>
                <input name="assignedTo" required style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: 6, boxSizing: 'border-box' }} placeholder="Technician name..." />
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Expected Completion</label>
                <input name="expectedCompletion" type="datetime-local" required style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: 6, boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button type="button" onClick={() => setAssignModal({ open: false, id: null })} style={{ flex: 1, padding: '10px', background: '#f8fafc', color: '#475569', border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
                <button type="submit" style={{ flex: 1, padding: '10px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 700 }}>Assign</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Progress Modal */}
      {progressModal.open && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', padding: 24, borderRadius: 8, width: 360, boxShadow: '0 20px 40px rgba(0,0,0,0.15)' }}>
            <h3 style={{ margin: '0 0 16px', color: '#0f172a', fontSize: 18 }}>Update Progress</h3>
            <div style={{ marginBottom: 10 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>Progress: <strong>{progressModal.progress}%</strong></label>
              <input type="range" min={0} max={100} step={5} value={progressModal.progress} onChange={e => setProgressModal({...progressModal, progress: Number(e.target.value)})} style={{ width: '100%', marginTop: 8 }} />
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
              <button onClick={() => setProgressModal({ open: false, id: null, progress: 0 })} style={{ flex: 1, padding: '10px', background: '#f8fafc', color: '#475569', border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
              <button onClick={() => handleUpdateProgress(progressModal.id, progressModal.progress)} style={{ flex: 1, padding: '10px', background: '#8b5cf6', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 700 }}>Save Progress</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrintingReworkJobs;
