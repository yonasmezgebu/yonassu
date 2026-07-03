import React, { useState, useEffect } from 'react';
import { Truck, Send, CheckCircle } from 'lucide-react';
import { printingState, updateJobStage } from '../../utils/printingTransactionService';
import { playSound } from '../../utils/printingSound';

const STAGES = ['Pending', 'Design', 'Prepress', 'Printing', 'Finishing', 'Delivery', 'Completed'];

const PrintingOrderTracking = () => {
  const [jobs, setJobs] = useState([]);

  useEffect(() => {
    setJobs([...printingState.jobs]);
    playSound('info');
  }, []);

  const handleSendStatus = () => {
    playSound('success');
    alert('Templated status update sent to customer via Notification Service.');
  };

  const handleAction = (id, newStage) => {
    if(window.confirm(`Mark Job ${id} as ${newStage}?`)) {
      updateJobStage(id, newStage);
      playSound('success');
      setJobs([...printingState.jobs]);
    }
  };

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: '#0f172a' }}>
          <Truck color="#10b981" size={28} /> ORDER TRACKING (UNIFIED)
        </h1>
        <p style={{ color: '#64748b', margin: '4px 0 0' }}>Customer-facing timeline aggregating status across all departments.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {jobs.filter(j => j.status !== 'Cancelled').map(j => {
          const currentIdx = STAGES.indexOf(j.status);
          
          return (
            <div key={j.id} style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', padding: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                  <h3 style={{ margin: '0 0 4px', fontSize: 18, color: '#0f172a' }}>{j.id} <span style={{ color: '#64748b', fontWeight: 400, fontSize: 14 }}>— {j.customerName}</span></h3>
                  <div style={{ fontSize: 13, color: '#475569' }}>Est. Delivery: <strong>{j.deadline}</strong></div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={handleSendStatus} style={{ padding: '8px 16px', background: '#eff6ff', color: '#3b82f6', border: '1px solid #bfdbfe', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600 }}><Send size={16} /> Send Update</button>
                  {j.status === 'Delivery' && <button onClick={() => handleAction(j.id, 'Completed')} style={{ padding: '8px 16px', background: '#ecfdf5', color: '#10b981', border: '1px solid #a7f3d0', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600 }}><CheckCircle size={16} /> Mark Completed</button>}
                  {j.status === 'Finishing' && <button onClick={() => handleAction(j.id, 'Delivery')} style={{ padding: '8px 16px', background: '#fef3c7', color: '#d97706', border: '1px solid #fde68a', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600 }}><Truck size={16} /> Mark Delivered</button>}
                </div>
              </div>

              {/* Timeline */}
              <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingTop: 16 }}>
                <div style={{ position: 'absolute', top: 28, left: 20, right: 20, height: 4, background: '#e2e8f0', zIndex: 0 }}></div>
                <div style={{ position: 'absolute', top: 28, left: 20, width: `${(currentIdx / (STAGES.length - 1)) * 100}%`, height: 4, background: '#10b981', zIndex: 1, transition: 'width 0.5s' }}></div>
                
                {STAGES.map((s, idx) => {
                  const passed = idx <= currentIdx;
                  const active = idx === currentIdx;
                  return (
                    <div key={s} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2, width: 80 }}>
                      <div style={{ width: 20, height: 20, borderRadius: '50%', background: active ? 'white' : passed ? '#10b981' : '#e2e8f0', border: `4px solid ${passed ? '#10b981' : '#e2e8f0'}`, marginBottom: 8 }}></div>
                      <div style={{ fontSize: 11, fontWeight: active ? 700 : 600, color: active ? '#0f172a' : passed ? '#475569' : '#94a3b8', textAlign: 'center' }}>{s}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PrintingOrderTracking;
