import React, { useState, useEffect } from 'react';
import { rentalState } from '../../../utils/rentalManagerState';

const AvailabilityCalendar = () => {
  const [scheduleDate, setScheduleDate] = useState(new Date().toISOString().substring(0, 10));
  const [data, setData] = useState([]);

  useEffect(() => {
    const load = () => {
        const assets = rentalState.getAssets();
        const orders = rentalState.getRentalOrders().filter(o => ['pending', 'confirmed', 'active'].includes(o.status));
        const targetDate = new Date(scheduleDate);

        // Compute status for the specific target date
        const rows = assets.map(a => {
            // Is it booked on this date?
            const booking = orders.find(o => {
                if (o.asset_id !== a.id) return false;
                const s = new Date(o.start_datetime);
                const e = new Date(o.end_datetime);
                return (targetDate >= new Date(s.setHours(0,0,0,0)) && targetDate <= new Date(e.setHours(23,59,59,999)));
            });

            // If booked, the state on this date is the order status
            // If not booked, but current live status is maintenance, assume maintenance
            let dateStatus = 'available';
            let label = 'Available';
            
            if (booking) {
                dateStatus = booking.status === 'active' ? 'rented' : 'pending';
                label = `Booked (${booking.order_number})`;
            } else if (a.status === 'maintenance') {
                dateStatus = 'maintenance';
                label = 'In Maintenance';
            }

            return {
                id: a.id,
                name: a.name,
                type: a.asset_type === 'car' ? 'Car' : 'Agri',
                status: dateStatus,
                label: label
            };
        });

        setData(rows);
        rentalState.notify('CALENDAR_UPDATED');
    };
    load();
    return rentalState.subscribe(load);
  }, [scheduleDate]);

  const getBadgeColor = (status) => {
      switch(status) {
          case 'available': return { bg: '#dcfce7', text: '#166534' };
          case 'rented': return { bg: '#fee2e2', text: '#991b1b' };
          case 'pending': return { bg: '#fef3c7', text: '#92400e' };
          case 'maintenance': return { bg: '#f1f5f9', text: '#475569' };
          default: return { bg: '#f3f4f6', text: '#374151' };
      }
  };

  return (
    <div style={{ padding: '24px', backgroundColor: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#0f172a', margin: '0 0 8px 0' }}>Availability Calendar</h1>
            <p style={{ color: '#64748b', margin: 0 }}>View fleet availability for any specific date.</p>
        </div>
        <input 
            type="date" 
            value={scheduleDate} 
            onChange={e => setScheduleDate(e.target.value)} 
            style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '16px' }}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
          {data.map(item => {
              const colors = getBadgeColor(item.status);
              return (
                  <div key={item.id} style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{item.type}</div>
                      <div style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b', margin: '4px 0 16px 0' }}>{item.name}</div>
                      <div style={{ display: 'inline-block', padding: '6px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: '600', backgroundColor: colors.bg, color: colors.text }}>
                          {item.label}
                      </div>
                  </div>
              );
          })}
      </div>
    </div>
  );
};

export default AvailabilityCalendar;
