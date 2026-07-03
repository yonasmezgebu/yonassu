import React, { useState, useEffect } from 'react';
import { User, MapPin, Power } from 'lucide-react';
import { printingState } from '../../utils/printingTransactionService';
import { playSound } from '../../utils/printingSound';

const PrintingDriverAssignment = () => {
  const [drivers, setDrivers] = useState([]);

  const refresh = () => setDrivers([...printingState.drivers]);

  useEffect(() => {
    refresh();
    playSound('info');
  }, []);

  const handleToggleStatus = (id) => {
    const d = printingState.drivers.find(x => x.id === id);
    if(d) {
      if(d.status !== 'Off') {
        const reason = prompt('Reason for marking driver OFF (e.g. Sick, Vehicle Maint.):');
        if(reason) { d.status = 'Off'; d.reason = reason; }
      } else {
        d.status = 'Available';
        d.reason = '';
      }
      playSound('success');
      refresh();
    }
  };

  const handleTrack = () => {
    playSound('success');
    alert('Opening Live GPS Tracking Map (Mock Integration)');
  };

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: '#0f172a' }}>
          <User color="#8b5cf6" size={28} /> DRIVER ASSIGNMENT & ROSTER
        </h1>
        <p style={{ color: '#64748b', margin: '4px 0 0' }}>Manage delivery personnel availability and vehicle utilization.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
        {drivers.map(d => (
          <div key={d.id} style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', padding: 20, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <h3 style={{ margin: '0 0 4px', fontSize: 18, color: '#0f172a' }}>{d.name}</h3>
                <div style={{ fontSize: 13, color: '#64748b' }}>License: {d.license}</div>
              </div>
              <div style={{ padding: '4px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700, background: d.status === 'Off' ? '#fef2f2' : '#ecfdf5', color: d.status === 'Off' ? '#ef4444' : '#10b981' }}>
                {d.status}
              </div>
            </div>

            <div style={{ fontSize: 13, color: '#475569', marginBottom: 16, flex: 1, background: '#f8fafc', padding: 12, borderRadius: 6, border: '1px solid #f1f5f9' }}>
              <p style={{ margin: '0 0 8px' }}><strong>Vehicle:</strong> {d.vehicle}</p>
              <p style={{ margin: '0 0 8px' }}><strong>Phone:</strong> {d.phone}</p>
              <p style={{ margin: 0 }}><strong>Today's Load:</strong> {d.currentDeliveries} Deliveries</p>
              {d.reason && <p style={{ margin: '8px 0 0', color: '#ef4444' }}><strong>Off Reason:</strong> {d.reason}</p>}
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => handleToggleStatus(d.id)} style={{ flex: 1, padding: '8px', background: d.status === 'Off' ? '#ecfdf5' : '#fef2f2', color: d.status === 'Off' ? '#10b981' : '#ef4444', border: `1px solid ${d.status === 'Off' ? '#a7f3d0' : '#fecaca'}`, borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, fontSize: 12, fontWeight: 600 }}>
                <Power size={14} /> {d.status === 'Off' ? 'Mark Available' : 'Mark Off-Duty'}
              </button>
              <button onClick={handleTrack} disabled={d.status === 'Off'} style={{ flex: 1, padding: '8px', background: d.status === 'Off' ? '#f1f5f9' : '#eff6ff', color: d.status === 'Off' ? '#94a3b8' : '#3b82f6', border: `1px solid ${d.status === 'Off' ? '#e2e8f0' : '#bfdbfe'}`, borderRadius: 6, cursor: d.status === 'Off' ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, fontSize: 12, fontWeight: 600 }}>
                <MapPin size={14} /> Live Track
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PrintingDriverAssignment;
