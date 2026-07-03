import React, { useState, useEffect } from 'react';
import { Package, Send, Printer, UserPlus } from 'lucide-react';
import { printingState, updateJobStage, assignDriver } from '../../utils/printingTransactionService';
import { playSound } from '../../utils/printingSound';

const PrintingReadyForDispatch = () => {
  const [jobs, setJobs] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [driverModal, setDriverModal] = useState({ open: false, jobId: '' });

  const refresh = () => {
    setJobs([...printingState.jobs.filter(j => j.status === 'Ready for Delivery' || j.status === 'Delivery')]);
    setDrivers([...printingState.drivers.filter(d => d.status !== 'Off')]);
  };

  useEffect(() => {
    refresh();
    playSound('info'); // "📦 Jobs Ready for Dispatch"
  }, []);

  const handleDispatchNow = (jobId) => {
    if(window.confirm(`Mark Job ${jobId} as dispatched immediately? (e.g. for walk-in pickup)`)) {
      updateJobStage(jobId, 'Delivery');
      // Create a mock delivery record with no driver
      const id = `DEL-${Math.floor(Math.random()*10000)}`;
      printingState.deliveries.push({ id, jobId, driverId: null, scheduleDate: new Date().toISOString(), status: 'Dispatched' });
      playSound('success');
      refresh();
    }
  };

  const handleAssignDriver = (e) => {
    e.preventDefault();
    const data = new FormData(e.target);
    const driverId = data.get('driverId');
    const schedDate = data.get('scheduleDate');
    try {
      const delId = `DEL-${Math.floor(Math.random()*10000)}`;
      assignDriver(driverId, delId, schedDate);
      const del = printingState.deliveries.find(d => d.id === delId);
      if(del) del.jobId = driverModal.jobId; // Map the job
      
      updateJobStage(driverModal.jobId, 'Delivery');
      playSound('success');
      alert(`Driver ${driverId} assigned for ${schedDate}.`);
      setDriverModal({ open: false, jobId: '' });
      refresh();
    } catch (err) {
      alert(err.message);
    }
  };

  const handlePrintManifest = () => {
    playSound('success');
    alert('Dispatch Manifest PDF Generated.');
  };

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: '#0f172a' }}>
          <Package color="#f59e0b" size={28} /> READY FOR DISPATCH
        </h1>
        <p style={{ color: '#64748b', margin: '4px 0 0' }}>Logistics staging queue between finished goods and outbound dispatch.</p>
      </div>

      <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <th style={{ padding: '12px 14px', textAlign: 'left', color: '#475569', fontWeight: 600, fontSize: 13 }}>Job # / Client</th>
              <th style={{ padding: '12px 14px', textAlign: 'left', color: '#475569', fontWeight: 600, fontSize: 13 }}>Contact</th>
              <th style={{ padding: '12px 14px', textAlign: 'left', color: '#475569', fontWeight: 600, fontSize: 13 }}>Ready Date</th>
              <th style={{ padding: '12px 14px', textAlign: 'left', color: '#475569', fontWeight: 600, fontSize: 13 }}>Status</th>
              <th style={{ padding: '12px 14px', textAlign: 'right', color: '#475569', fontWeight: 600, fontSize: 13 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map(j => (
              <tr key={j.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '12px 14px', fontWeight: 700, color: '#0f172a' }}>{j.id} <br/><span style={{fontSize: 12, color: '#475569', fontWeight: 400}}>{j.customerName}</span></td>
                <td style={{ padding: '12px 14px', color: '#475569' }}>{j.customerPhone}</td>
                <td style={{ padding: '12px 14px', color: '#475569' }}>{j.completedDate || 'Just Now'}</td>
                <td style={{ padding: '12px 14px' }}>
                  <span style={{ padding: '4px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700, background: j.status === 'Delivery' ? '#fef3c7' : '#e0e7ff', color: j.status === 'Delivery' ? '#d97706' : '#4f46e5' }}>
                    {j.status === 'Delivery' ? 'Dispatched / En Route' : 'Waiting for Dispatch'}
                  </span>
                </td>
                <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                    <button onClick={handlePrintManifest} style={{ padding: '6px', background: '#f8fafc', color: '#475569', border: '1px solid #cbd5e1', borderRadius: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600 }}><Printer size={14} /> Manifest</button>
                    {j.status !== 'Delivery' && (
                      <>
                        <button onClick={() => setDriverModal({ open: true, jobId: j.id })} style={{ padding: '6px', background: '#eff6ff', color: '#3b82f6', border: '1px solid #bfdbfe', borderRadius: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600 }}><UserPlus size={14} /> Assign Driver</button>
                        <button onClick={() => handleDispatchNow(j.id)} style={{ padding: '6px', background: '#ecfdf5', color: '#10b981', border: '1px solid #a7f3d0', borderRadius: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600 }}><Send size={14} /> Dispatch Now</button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {jobs.length === 0 && <tr><td colSpan={5} style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>No jobs waiting for dispatch.</td></tr>}
          </tbody>
        </table>
      </div>

      {driverModal.open && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', padding: 24, borderRadius: 8, width: 400, border: '1px solid #e2e8f0', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <h3 style={{ margin: '0 0 16px', color: '#0f172a', fontSize: 18 }}>Assign Driver to {driverModal.jobId}</h3>
            <form onSubmit={handleAssignDriver}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Select Driver</label>
                <select name="driverId" required style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: 6 }}>
                  <option value="">Choose...</option>
                  {drivers.map(d => <option key={d.id} value={d.id}>{d.name} ({d.vehicle})</option>)}
                </select>
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Schedule Date & Time</label>
                <input type="datetime-local" name="scheduleDate" required style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: 6, boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button type="button" onClick={() => setDriverModal({ open: false, jobId: '' })} style={{ flex: 1, padding: '10px', background: '#f8fafc', color: '#475569', border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
                <button type="submit" style={{ flex: 1, padding: '10px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>Assign & Dispatch</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrintingReadyForDispatch;
