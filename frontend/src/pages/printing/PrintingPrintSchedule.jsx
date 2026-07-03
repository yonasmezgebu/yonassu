import React, { useState, useEffect } from 'react';
import { Calendar, AlertCircle } from 'lucide-react';
import { printingState, assignMachine } from '../../utils/printingTransactionService';
import { playSound } from '../../utils/printingSound';

const PrintingPrintSchedule = () => {
  const [machines, setMachines] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [selectedMachine, setSelectedMachine] = useState('');
  const [selectedJob, setSelectedJob] = useState('');

  const refresh = () => {
    setMachines([...printingState.machines]);
    setJobs([...printingState.jobs.filter(j => j.status === 'Printing' || j.status === 'Prepress')]);
  };

  useEffect(() => {
    refresh();
  }, []);

  const handleSchedule = () => {
    if (!selectedJob || !selectedMachine) return;
    
    // Conflict Detection
    const machine = printingState.machines.find(m => m.name === selectedMachine);
    if (machine && machine.status === 'Under Maintenance') {
      alert(`Error: ${machine.name} is Under Maintenance.`);
      return;
    }
    if (machine && machine.currentJob && machine.currentJob !== selectedJob) {
      if(!window.confirm(`Warning: ${machine.name} is currently running ${machine.currentJob}. Schedule anyway (Conflict)?`)) {
        return;
      }
      playSound('info'); // "📅 Schedule Conflict Detected"
    }

    try {
      assignMachine(selectedJob, machine.id);
      playSound('success');
      alert(`Scheduled ${selectedJob} to ${machine.name}`);
      refresh();
    } catch (e) {
      alert(e.message);
    }
  };

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: '#0f172a' }}>
          <Calendar color="#f97316" size={28} /> PRINT SCHEDULE
        </h1>
        <p style={{ color: '#64748b', margin: '4px 0 0' }}>Assign jobs to machines. Warns on double-booking and prevents maintenance assignment.</p>
      </div>

      <div style={{ background: 'white', borderRadius: 10, border: '1px solid #e2e8f0', padding: 24, marginBottom: 24 }}>
        <h3 style={{ margin: '0 0 16px', color: '#0f172a', fontSize: 16 }}>Schedule Job</h3>
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>Select Job (Prepress/Printing)</label>
            <select value={selectedJob} onChange={e => setSelectedJob(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: 6 }}>
              <option value="">-- Select Job --</option>
              {jobs.map(j => <option key={j.id} value={j.id}>{j.id} - {j.customerName} ({j.priority})</option>)}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>Select Machine</label>
            <select value={selectedMachine} onChange={e => setSelectedMachine(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: 6 }}>
              <option value="">-- Select Machine --</option>
              {machines.map(m => <option key={m.id} value={m.name} disabled={m.status === 'Under Maintenance'}>{m.name} {m.status === 'Under Maintenance' ? '(Maintenance)' : ''}</option>)}
            </select>
          </div>
          <button onClick={handleSchedule} style={{ padding: '10px 24px', background: '#f97316', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>
            Schedule
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        {machines.map(m => (
          <div key={m.id} style={{ background: m.status === 'Under Maintenance' ? '#fef2f2' : 'white', borderRadius: 8, border: `1px solid ${m.status === 'Under Maintenance' ? '#fecaca' : '#e2e8f0'}`, padding: 16 }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 16, color: '#0f172a', display: 'flex', justifyContent: 'space-between' }}>
              {m.name}
              {m.status === 'Under Maintenance' && <AlertCircle size={16} color="#dc2626" />}
            </h3>
            {m.currentJob ? (
              <div style={{ padding: 12, background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 6, fontSize: 13 }}>
                <div style={{ fontWeight: 700, color: '#1d4ed8', marginBottom: 4 }}>{m.currentJob}</div>
                <div style={{ color: '#475569' }}>Running</div>
              </div>
            ) : (
              <div style={{ padding: 12, border: '1px dashed #cbd5e1', borderRadius: 6, fontSize: 13, color: '#94a3b8', textAlign: 'center' }}>
                {m.status === 'Under Maintenance' ? 'Out of Service' : 'Idle / Open Slot'}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PrintingPrintSchedule;
