import React, { useState, useEffect } from 'react';
import { Cpu, Wrench, CheckCircle } from 'lucide-react';
import { printingState } from '../../utils/printingTransactionService';
import { playSound } from '../../utils/printingSound';

const PrintingMachineAllocation = () => {
  const [machines, setMachines] = useState([]);
  const [filterType, setFilterType] = useState('All');

  const refresh = () => setMachines([...printingState.machines]);

  useEffect(() => {
    refresh();
    playSound('info'); // "🖨️ Machine Status Changed"
  }, []);

  const handleStatusChange = (m, newStatus) => {
    if (newStatus === 'Under Maintenance') {
      const reason = prompt('Enter maintenance reason and estimated return date:');
      if (!reason) return;
    }
    
    if (window.confirm(`Change ${m.name} status to ${newStatus}?`)) {
      const target = printingState.machines.find(x => x.id === m.id);
      if (target) {
        target.status = newStatus;
        if (newStatus === 'Under Maintenance' && target.currentJob) {
          alert(`Warning: Job ${target.currentJob} was unassigned due to maintenance. Please reschedule.`);
          const job = printingState.jobs.find(j => j.id === target.currentJob);
          if (job) job.machineAssigned = null;
          target.currentJob = null;
        }
        if (newStatus === 'Available') target.currentJob = null;
      }
      playSound('success');
      refresh();
    }
  };

  const filtered = machines.filter(m => filterType === 'All' || m.type === filterType);

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: '#0f172a' }}>
          <Cpu color="#ef4444" size={28} /> MACHINE ALLOCATION
        </h1>
        <p style={{ color: '#64748b', margin: '4px 0 0' }}>Manage physical press resources. Status updates cascade to the schedule.</p>
      </div>

      <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', padding: 16, marginBottom: 16 }}>
        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>Filter by Type</label>
        <select value={filterType} onChange={e => setFilterType(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13 }}>
          <option>All</option><option>Offset</option><option>Digital</option><option>Large Format</option>
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
        {filtered.map(m => (
          <div key={m.id} style={{ background: 'white', borderRadius: 10, border: '1px solid #e2e8f0', padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <h3 style={{ margin: '0 0 4px', color: '#0f172a', fontSize: 18 }}>{m.name}</h3>
                <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>{m.type}</div>
              </div>
              <span style={{ padding: '4px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700, background: m.status === 'Available' ? '#dcfce7' : m.status === 'In Use' ? '#eff6ff' : '#fee2e2', color: m.status === 'Available' ? '#16a34a' : m.status === 'In Use' ? '#2563eb' : '#dc2626' }}>
                {m.status}
              </span>
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 13, color: '#475569', marginBottom: 4 }}><strong>Current Job:</strong> {m.currentJob ? <span style={{ color: '#2563eb' }}>{m.currentJob}</span> : 'None'}</div>
              <div style={{ fontSize: 13, color: '#475569' }}><strong>Utilization:</strong> {m.status === 'In Use' ? '100%' : '0%'}</div>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              {m.status !== 'Available' && (
                <button onClick={() => handleStatusChange(m, 'Available')} style={{ flex: 1, padding: '8px', background: '#ecfdf5', color: '#10b981', border: '1px solid #a7f3d0', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, fontSize: 12, fontWeight: 600 }}><CheckCircle size={14} /> Release</button>
              )}
              {m.status !== 'Under Maintenance' && (
                <button onClick={() => handleStatusChange(m, 'Under Maintenance')} style={{ flex: 1, padding: '8px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, fontSize: 12, fontWeight: 600 }}><Wrench size={14} /> Maintenance</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PrintingMachineAllocation;
