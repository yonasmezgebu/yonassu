import React, { useState, useEffect } from 'react';
import { rentalState } from '../../../utils/rentalManagerState';
import SalesStatusBadge from '../../sales/components/SalesStatusBadge';

const OrderTracking = () => {
  const [activeOrders, setActiveOrders] = useState([]);
  const [scheduleDate, setScheduleDate] = useState(new Date().toISOString().substring(0, 10));
  const [dailySchedule, setDailySchedule] = useState([]);

  useEffect(() => {
    const load = () => {
        const raw = rentalState.getRentalOrders();
        const assets = rentalState.getAssets();
        const customers = rentalState.getCustomers();
        
        const enrich = (o) => ({
            ...o,
            asset_name: assets.find(a => a.id === o.asset_id)?.name || 'Unknown',
            customer_name: customers.find(c => c.id === o.customer_id)?.name || 'Unknown'
        });

        // 1. Active Orders real-time view
        setActiveOrders(raw.filter(o => o.status === 'active').map(enrich));

        // 2. Daily Schedule (Due out / Due back on selected date)
        const targetDay = scheduleDate;
        const sched = raw.map(enrich).filter(o => {
            const sDay = o.start_datetime.substring(0, 10);
            const eDay = o.end_datetime.substring(0, 10);
            return sDay === targetDay || eDay === targetDay;
        });
        setDailySchedule(sched);
        
        // Notify tracking updated silently
        rentalState.notify('PAGE_LOAD'); // We don't want audio on every keystroke, so silent info.
    };
    load();
    return rentalState.subscribe(load);
  }, [scheduleDate]);

  return (
    <div style={{ padding: '24px', backgroundColor: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#0f172a', margin: '0 0 8px 0' }}>Order Tracking</h1>
        <p style={{ color: '#64748b', margin: 0 }}>Real-time active rentals and daily dispatch schedule.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          
          <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ margin: '0 0 16px 0' }}>Active Fleet on the Road ({activeOrders.length})</h3>
              <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                  {activeOrders.map(o => (
                      <li key={o.id} style={{ padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px', marginBottom: '8px' }}>
                          <div style={{ fontWeight: '600' }}>{o.asset_name}</div>
                          <div style={{ fontSize: '13px', color: '#64748b' }}>Customer: {o.customer_name}</div>
                          <div style={{ fontSize: '12px', marginTop: '4px', color: '#334155' }}>
                              Return Due: {new Date(o.end_datetime).toLocaleString()}
                          </div>
                      </li>
                  ))}
                  {activeOrders.length === 0 && <div style={{ color: '#94a3b8' }}>No active rentals.</div>}
              </ul>
          </div>

          <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ margin: 0 }}>Daily Schedule</h3>
                  <input type="date" value={scheduleDate} onChange={e => { setScheduleDate(e.target.value); rentalState.notify('TRACKING_UPDATED'); }} style={{ padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
              </div>

              <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                  {dailySchedule.map(o => {
                      const isOut = o.start_datetime.substring(0, 10) === scheduleDate;
                      const isBack = o.end_datetime.substring(0, 10) === scheduleDate;
                      return (
                          <li key={o.id} style={{ padding: '12px', borderLeft: `4px solid ${isBack ? '#ef4444' : '#3b82f6'}`, backgroundColor: '#f8fafc', marginBottom: '8px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                  <span style={{ fontWeight: '600' }}>{o.asset_name}</span>
                                  <SalesStatusBadge status={o.status} />
                              </div>
                              <div style={{ fontSize: '13px', color: '#475569', marginTop: '4px' }}>
                                  {isOut && <span style={{ color: '#3b82f6' }}>↑ Pick-up today</span>}
                                  {isOut && isBack && ' | '}
                                  {isBack && <span style={{ color: '#ef4444' }}>↓ Return due today</span>}
                              </div>
                          </li>
                      )
                  })}
                  {dailySchedule.length === 0 && <div style={{ color: '#94a3b8' }}>No activities scheduled for this date.</div>}
              </ul>
          </div>

      </div>
    </div>
  );
};

export default OrderTracking;
