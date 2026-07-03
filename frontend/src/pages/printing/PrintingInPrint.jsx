import React, { useState, useEffect } from 'react';
import { Printer, FastForward } from 'lucide-react';
import { printingState, updateJobStage } from '../../utils/printingTransactionService';
import { playSound } from '../../utils/printingSound';

const PrintingInPrint = () => {
  const [jobs, setJobs] = useState([]);
  const [filterMachine, setFilterMachine] = useState('All');

  const refreshJobs = () => setJobs([...printingState.jobs.filter(j => j.status === 'Printing')]);

  useEffect(() => {
    refreshJobs();
    playSound('info'); // "🖨️ Printing Stage Updated"
  }, []);

  const handleUpdate = (id, field, val) => {
    const job = printingState.jobs.find(j => j.id === id);
    if(job) job[field] = val;
    refreshJobs();
  };

  const handleComplete = (id) => {
    updateJobStage(id, 'Finishing');
    playSound('success');
    refreshJobs();
  };

  const filtered = jobs.filter(j => filterMachine === 'All' || j.machineAssigned === filterMachine);

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: '#0f172a' }}>
          <Printer color="#06b6d4" size={28} /> IN PRINTING
        </h1>
        <p style={{ color: '#64748b', margin: '4px 0 0' }}>Track jobs currently on press.</p>
      </div>

      <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', padding: 16, marginBottom: 16 }}>
        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>Filter by Machine</label>
        <select value={filterMachine} onChange={e => setFilterMachine(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13 }}>
          <option>All</option><option>Press A</option><option>Press B</option><option>Digital Printer 1</option><option>Wide Format</option>
        </select>
      </div>

      <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              {['Job #', 'Customer', 'Quantity', 'Machine', 'Operator', 'Started', 'Progress (%)', 'Est. Completion', 'Actions'].map(col => (
                <th key={col} style={{ padding: '12px 14px', textAlign: col === 'Quantity' ? 'right' : 'left', color: '#475569', fontWeight: 600, fontSize: 13 }}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(j => (
              <tr key={j.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '12px 14px', fontWeight: 700, color: '#0f172a' }}>{j.id}</td>
                <td style={{ padding: '12px 14px', color: '#0f172a' }}>{j.customerName}</td>
                <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 'bold' }}>{j.quantity.toLocaleString()}</td>
                <td style={{ padding: '12px 14px' }}>
                  <select value={j.machineAssigned || ''} onChange={(e) => handleUpdate(j.id, 'machineAssigned', e.target.value)} style={{ padding: '4px 8px', border: '1px solid #cbd5e1', borderRadius: 4, fontSize: 12 }}>
                    <option value="">Assign Machine</option><option>Press A</option><option>Press B</option><option>Digital Printer 1</option>
                  </select>
                </td>
                <td style={{ padding: '12px 14px', color: '#475569' }}>
                  <input placeholder="Operator" value={j.operator || ''} onChange={(e) => handleUpdate(j.id, 'operator', e.target.value)} style={{ width: 100, padding: '4px 8px', border: '1px solid #cbd5e1', borderRadius: 4, fontSize: 12 }} />
                </td>
                <td style={{ padding: '12px 14px', color: '#475569' }}>{j.printStarted || '-'}</td>
                <td style={{ padding: '12px 14px', width: 180 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input type="range" min="0" max="100" value={j.printProgress || 0} onChange={(e) => handleUpdate(j.id, 'printProgress', parseInt(e.target.value))} style={{ flex: 1, accentColor: '#06b6d4' }} />
                    <span style={{ fontSize: 12, fontWeight: 700, width: 30 }}>{j.printProgress || 0}%</span>
                  </div>
                </td>
                <td style={{ padding: '12px 14px', color: '#475569' }}>
                  <input type="datetime-local" value={j.estimatedPrintCompletion || ''} onChange={(e) => handleUpdate(j.id, 'estimatedPrintCompletion', e.target.value)} style={{ padding: '4px 8px', border: '1px solid #cbd5e1', borderRadius: 4, fontSize: 12 }} />
                </td>
                <td style={{ padding: '12px 14px' }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => { playSound('success'); }} style={{ padding: '4px 8px', background: '#f8fafc', color: '#475569', border: '1px solid #cbd5e1', borderRadius: 4, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Update</button>
                    <button onClick={() => handleComplete(j.id)} style={{ padding: '4px 8px', background: '#fae8ff', color: '#d946ef', border: '1px solid #f5d0fe', borderRadius: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600 }}><FastForward size={14} /> Finish</button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={9} style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>No jobs currently in Printing.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PrintingInPrint;
