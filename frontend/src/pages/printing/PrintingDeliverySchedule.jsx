import React, { useState, useEffect } from 'react';
import { Calendar, Truck, AlertTriangle } from 'lucide-react';
import { printingState, checkDriverConflict } from '../../utils/printingTransactionService';
import { playSound } from '../../utils/printingSound';

const PrintingDeliverySchedule = () => {
  const [deliveries, setDeliveries] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [viewMode, setViewMode] = useState('Day');

  const refresh = () => {
    setDeliveries([...printingState.deliveries.filter(d => d.status === 'Scheduled' || d.status === 'Dispatched')]);
    setDrivers([...printingState.drivers]);
  };

  useEffect(() => {
    refresh();
    playSound('info'); // "📅 Delivery Schedule Updated"
  }, []);

  const handleReschedule = (delId) => {
    const newDate = prompt('Enter new date/time (YYYY-MM-DDTHH:MM):');
    if (!newDate) return;
    
    const del = printingState.deliveries.find(d => d.id === delId);
    if(del && del.driverId) {
      if(checkDriverConflict(del.driverId, newDate)) {
        if(!window.confirm('⚠️ Driver is already booked within 2 hours of this time. Proceed anyway?')) return;
      }
      del.scheduleDate = newDate;
      playSound('success');
      alert('Delivery rescheduled.');
      refresh();
    }
  };

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: '#0f172a' }}>
            <Calendar color="#3b82f6" size={28} /> DELIVERY SCHEDULE
          </h1>
          <p style={{ color: '#64748b', margin: '4px 0 0' }}>Visual planning calendar for outbound logistics.</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {['Day', 'Week', 'Month'].map(m => (
            <button key={m} onClick={() => setViewMode(m)} style={{ padding: '6px 16px', background: viewMode === m ? '#3b82f6' : '#fff', color: viewMode === m ? '#fff' : '#64748b', border: `1px solid ${viewMode === m ? '#3b82f6' : '#cbd5e1'}`, borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>{m}</button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 24 }}>
        {/* Driver List Sidebar */}
        <div style={{ width: 250, background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', padding: 16 }}>
          <h3 style={{ fontSize: 14, color: '#0f172a', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 6 }}><Truck size={16} /> Active Drivers</h3>
          {drivers.map(d => (
            <div key={d.id} style={{ padding: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6, marginBottom: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{d.name}</div>
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{d.vehicle}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 6, fontSize: 11, fontWeight: 600, color: d.status === 'Off' ? '#ef4444' : '#10b981' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: d.status === 'Off' ? '#ef4444' : '#10b981' }}></span> {d.status}
              </div>
            </div>
          ))}
        </div>

        {/* Schedule Grid */}
        <div style={{ flex: 1, background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', padding: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {deliveries.map(del => {
              const driver = drivers.find(d => d.id === del.driverId);
              return (
                <div key={del.id} style={{ border: '1px solid #bfdbfe', borderRadius: 8, padding: 16, background: '#eff6ff', position: 'relative' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#3b82f6', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}><Calendar size={12} /> {del.scheduleDate}</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>Job: {del.jobId || 'N/A'}</div>
                  <div style={{ fontSize: 13, color: '#475569', marginBottom: 12 }}>Driver: {driver ? driver.name : 'Unassigned'}</div>
                  
                  <button onClick={() => handleReschedule(del.id)} style={{ padding: '6px', background: 'white', color: '#3b82f6', border: '1px solid #bfdbfe', borderRadius: 4, cursor: 'pointer', fontSize: 11, fontWeight: 600, width: '100%' }}>Reschedule</button>
                  
                  {checkDriverConflict(del.driverId, del.scheduleDate) && (
                    <div style={{ position: 'absolute', top: -8, right: -8, background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', borderRadius: 4, padding: '4px 8px', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <AlertTriangle size={12} /> Conflict
                    </div>
                  )}
                </div>
              );
            })}
            {deliveries.length === 0 && <div style={{ color: '#94a3b8', gridColumn: '1/-1', textAlign: 'center', padding: 40 }}>No scheduled deliveries for this view.</div>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrintingDeliverySchedule;
