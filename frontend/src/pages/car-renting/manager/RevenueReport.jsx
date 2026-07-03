import React, { useState, useEffect } from 'react';
import { rentalState } from '../../../utils/rentalManagerState';
import SalesDataTable from '../../sales/components/SalesDataTable';
import CurrencyDisplay from '../../sales/components/CurrencyDisplay';
import { TrendingUp, TrendingDown } from 'lucide-react';

const RevenueReport = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    const load = () => {
        const result = rentalState.generateRentalReport({
            groupBy: ['type', 'time']
        });
        setData(result);
        rentalState.notify('REVENUE_REPORT');
    };
    load();
    return rentalState.subscribe(load);
  }, []);

  if (!data) return null;

  const carRev = data.groupings.type.find(t => t.key === 'car')?.revenue || 0;
  const agriRev = data.groupings.type.find(t => t.key === 'agri_equipment')?.revenue || 0;
  
  const timeData = data.groupings.time.sort((a,b) => a.key.localeCompare(b.key));

  return (
    <div style={{ padding: '24px', backgroundColor: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#0f172a', margin: '0 0 8px 0' }}>Revenue Report</h1>
        <p style={{ color: '#64748b', margin: 0 }}>Financial splits and monthly trends.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
          <div style={{ backgroundColor: '#eff6ff', padding: '24px', borderRadius: '12px', border: '1px solid #bfdbfe' }}>
              <div style={{ fontSize: '14px', color: '#1e3a8a', fontWeight: '600' }}>Car Rental Revenue</div>
              <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#1d4ed8' }}><CurrencyDisplay amountCents={carRev} /></div>
          </div>
          <div style={{ backgroundColor: '#ecfdf5', padding: '24px', borderRadius: '12px', border: '1px solid #a7f3d0' }}>
              <div style={{ fontSize: '14px', color: '#064e3b', fontWeight: '600' }}>Agri Equipment Revenue</div>
              <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#047857' }}><CurrencyDisplay amountCents={agriRev} /></div>
          </div>
      </div>

      <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ marginTop: 0 }}>Monthly Trend</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {timeData.map(t => (
                  <div key={t.key} style={{ display: 'flex', justifyContent: 'space-between', padding: '16px', borderBottom: '1px solid #f1f5f9' }}>
                      <span style={{ fontWeight: '600', color: '#334155' }}>{t.key}</span>
                      <span style={{ fontWeight: 'bold', color: '#10b981' }}><CurrencyDisplay amountCents={t.revenue} /> ({t.rentals} rentals)</span>
                  </div>
              ))}
              {timeData.length === 0 && <div style={{ color: '#94a3b8' }}>No completed orders to show.</div>}
          </div>
      </div>
    </div>
  );
};

export default RevenueReport;
