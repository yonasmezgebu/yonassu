import React, { useState, useEffect } from 'react';
import { rentalState } from '../../../utils/rentalManagerState';
import { Car, Tractor } from 'lucide-react';

const FleetManagement = () => {
  const [stats, setStats] = useState({ car: {}, agri: {} });

  useEffect(() => {
    const load = () => {
        const assets = rentalState.getAssets();
        
        const compute = (type) => {
            const filtered = assets.filter(a => a.asset_type === type);
            return {
                total: filtered.length,
                available: filtered.filter(a => a.status === 'available').length,
                rented: filtered.filter(a => a.status === 'rented').length,
                maintenance: filtered.filter(a => a.status === 'maintenance').length,
                retired: filtered.filter(a => a.status === 'retired').length,
            };
        };

        setStats({
            car: compute('car'),
            agri: compute('agri_equipment')
        });
        
        rentalState.notify('FLEET_OVERVIEW');
    };
    load();
    return rentalState.subscribe(load);
  }, []);

  const FleetCard = ({ title, icon, data }) => (
      <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <div style={{ padding: '12px', backgroundColor: '#eff6ff', borderRadius: '8px' }}>{icon}</div>
              <h2 style={{ margin: 0, fontSize: '20px', color: '#1e293b' }}>{title}</h2>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ padding: '16px', backgroundColor: '#f8fafc', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#0f172a' }}>{data.total || 0}</div>
                  <div style={{ fontSize: '13px', color: '#64748b' }}>Total Fleet</div>
              </div>
              <div style={{ padding: '16px', backgroundColor: '#ecfdf5', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#10b981' }}>{data.available || 0}</div>
                  <div style={{ fontSize: '13px', color: '#059669' }}>Available</div>
              </div>
              <div style={{ padding: '16px', backgroundColor: '#fff7ed', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#f59e0b' }}>{data.rented || 0}</div>
                  <div style={{ fontSize: '13px', color: '#d97706' }}>Rented Out</div>
              </div>
              <div style={{ padding: '16px', backgroundColor: '#fef2f2', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#ef4444' }}>{data.maintenance || 0}</div>
                  <div style={{ fontSize: '13px', color: '#dc2626' }}>In Maintenance</div>
              </div>
          </div>
      </div>
  );

  return (
    <div style={{ padding: '24px', backgroundColor: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#0f172a', margin: '0 0 8px 0' }}>Fleet Management</h1>
        <p style={{ color: '#64748b', margin: 0 }}>Aggregate status counts by asset type.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          <FleetCard title="Car Rental Fleet" icon={<Car color="#3b82f6" size={28} />} data={stats.car} />
          <FleetCard title="Agri Equipment Fleet" icon={<Tractor color="#10b981" size={28} />} data={stats.agri} />
      </div>
    </div>
  );
};

export default FleetManagement;
