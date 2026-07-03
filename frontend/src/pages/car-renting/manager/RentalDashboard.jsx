import React, { useState, useEffect } from 'react';
import { rentalState } from '../../../utils/rentalManagerState';
import CurrencyDisplay from '../../sales/components/CurrencyDisplay';
import { Car, Tractor, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

const RentalDashboard = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    const load = () => {
      const assets = rentalState.getAssets();
      const activeOrders = rentalState.getRentalOrders().filter(o => o.status === 'active');
      const maintenance = rentalState.getMaintenanceRecords().filter(m => m.status === 'in_progress');
      
      const fleetStats = {
          total: assets.length,
          cars: assets.filter(a => a.asset_type === 'car').length,
          agri: assets.filter(a => a.asset_type === 'agri_equipment').length,
          available: assets.filter(a => a.status === 'available').length,
          rented: assets.filter(a => a.status === 'rented').length,
          maintenance: assets.filter(a => a.status === 'maintenance').length
      };

      setData({ fleetStats, activeOrders, maintenance });
    };
    
    load();
    const unsub = rentalState.subscribe(load);
    return unsub;
  }, []);

  if (!data) return <div>Loading...</div>;

  return (
    <div style={{ padding: '24px', backgroundColor: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#0f172a', margin: '0 0 8px 0' }}>Dashboard Overview</h1>
        <p style={{ color: '#64748b', margin: 0 }}>High-level view of unified rental operations.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <StatCard icon={<Car color="#3b82f6" />} title="Cars Fleet" value={data.fleetStats.cars} />
        <StatCard icon={<Tractor color="#10b981" />} title="Agri Equipment" value={data.fleetStats.agri} />
        <StatCard icon={<CheckCircle color="#8b5cf6" />} title="Available Now" value={data.fleetStats.available} />
        <StatCard icon={<Clock color="#f59e0b" />} title="Active Rentals" value={data.fleetStats.rented} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ margin: '0 0 16px 0', color: '#1e293b' }}>Active Rentals ({data.activeOrders.length})</h3>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                {data.activeOrders.map(o => (
                    <li key={o.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}>
                        <div>
                            <div style={{ fontWeight: '500', color: '#334155' }}>{o.order_number}</div>
                            <div style={{ fontSize: '12px', color: '#64748b' }}>Ends: {new Date(o.end_datetime).toLocaleString()}</div>
                        </div>
                        <div style={{ fontWeight: '600', color: '#10b981' }}>
                            <CurrencyDisplay amountCents={o.total_cost_cents} />
                        </div>
                    </li>
                ))}
                {data.activeOrders.length === 0 && <li style={{ color: '#94a3b8' }}>No active rentals.</li>}
            </ul>
        </div>
        
        <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ margin: '0 0 16px 0', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}><AlertTriangle size={18} color="#ef4444" /> In Maintenance</h3>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                {data.maintenance.map(m => (
                    <li key={m.id} style={{ padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}>
                        <div style={{ fontWeight: '500', color: '#334155' }}>{m.description}</div>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>Started: {new Date(m.scheduled_date).toLocaleDateString()}</div>
                    </li>
                ))}
                {data.maintenance.length === 0 && <li style={{ color: '#10b981' }}>All clear! No assets in maintenance.</li>}
            </ul>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon, title, value }) => (
  <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '16px' }}>
    <div style={{ padding: '12px', backgroundColor: '#f8fafc', borderRadius: '8px' }}>{icon}</div>
    <div>
        <h3 style={{ fontSize: '14px', color: '#64748b', margin: '0 0 4px 0', fontWeight: '500' }}>{title}</h3>
        <div style={{ fontSize: '24px', fontWeight: '700', color: '#0f172a' }}>{value}</div>
    </div>
  </div>
);

export default RentalDashboard;
