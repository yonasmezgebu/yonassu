import React, { useState, useEffect } from 'react';
import { PenTool, Upload, CheckCircle } from 'lucide-react';
import { printingState, updateJobStage, updateDesignProgress } from '../../utils/printingTransactionService';
import { playSound } from '../../utils/printingSound';

const PrintingDesign = () => {
  const [jobs, setJobs] = useState([]);
  const [filterDesigner, setFilterDesigner] = useState('All');

  const refreshJobs = () => setJobs([...printingState.jobs.filter(j => j.status === 'Design')]);

  useEffect(() => {
    refreshJobs();
    playSound('info'); // "🎨 Design Stage Updated"
  }, []);

  const handleProgressChange = (id, val) => {
    updateDesignProgress(id, parseInt(val));
    refreshJobs();
  };

  const handleUpload = (id) => {
    playSound('success');
    alert(`File uploaded and attached to ${id}`);
    // Simulate attaching file
    const job = printingState.jobs.find(j => j.id === id);
    if(job) job.files.push({ name: `design_final_${id}.pdf`, status: 'Pending' });
    refreshJobs();
  };

  const handleComplete = (id) => {
    updateJobStage(id, 'Prepress');
    playSound('success');
    refreshJobs();
  };

  const filtered = jobs.filter(j => filterDesigner === 'All' || j.assignedDesigner === filterDesigner);
  const designers = ['All', ...new Set(jobs.map(j => j.assignedDesigner).filter(Boolean))];

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: '#0f172a' }}>
          <PenTool color="#8b5cf6" size={28} /> IN DESIGN
        </h1>
        <p style={{ color: '#64748b', margin: '4px 0 0' }}>Track jobs currently in the design stage.</p>
      </div>

      <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', padding: 16, marginBottom: 16 }}>
        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>Assigned Designer</label>
        <select value={filterDesigner} onChange={e => setFilterDesigner(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13 }}>
          {designers.map(d => <option key={d}>{d}</option>)}
        </select>
      </div>

      <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              {['Job #', 'Customer', 'Job Type', 'Assigned Designer', 'Started Date', 'Deadline', 'Progress (%)', 'Actions'].map(col => (
                <th key={col} style={{ padding: '12px 14px', textAlign: 'left', color: '#475569', fontWeight: 600, fontSize: 13 }}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(j => (
              <tr key={j.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '12px 14px', fontWeight: 700, color: '#0f172a' }}>{j.id}</td>
                <td style={{ padding: '12px 14px', color: '#0f172a' }}>{j.customerName}</td>
                <td style={{ padding: '12px 14px', color: '#475569' }}>{j.jobType}</td>
                <td style={{ padding: '12px 14px', color: '#8b5cf6', fontWeight: 600 }}>{j.assignedDesigner || 'Unassigned'}</td>
                <td style={{ padding: '12px 14px', color: '#475569' }}>{j.startedDesignDate || '-'}</td>
                <td style={{ padding: '12px 14px', color: '#dc2626', fontWeight: 600 }}>{new Date(j.deadline).toLocaleDateString()}</td>
                <td style={{ padding: '12px 14px', width: 200 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <input type="range" min="0" max="100" value={j.designProgress || 0} onChange={(e) => handleProgressChange(j.id, e.target.value)} style={{ flex: 1, accentColor: '#8b5cf6' }} />
                    <span style={{ fontSize: 12, fontWeight: 700, width: 30 }}>{j.designProgress || 0}%</span>
                  </div>
                </td>
                <td style={{ padding: '12px 14px' }}>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <button onClick={() => handleUpload(j.id)} style={{ padding: '4px 8px', background: '#f8fafc', color: '#475569', border: '1px solid #cbd5e1', borderRadius: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600 }}><Upload size={14} /> Upload Design</button>
                    <button onClick={() => handleComplete(j.id)} style={{ padding: '4px 8px', background: '#ede9fe', color: '#7c3aed', border: '1px solid #ddd6fe', borderRadius: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600 }}><CheckCircle size={14} /> Complete (Prepress)</button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={8} style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>No jobs currently in design.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PrintingDesign;
