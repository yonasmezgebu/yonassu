import React, { useState, useEffect } from 'react';
import { rentalState } from '../../../utils/rentalManagerState';
import SalesDataTable from '../../sales/components/SalesDataTable';
import CurrencyDisplay from '../../sales/components/CurrencyDisplay';

const RentalReport = () => {
  const [data, setData] = useState(null);
  const [filters, setFilters] = useState({ dateFrom: '', dateTo: '', assetType: '' });

  useEffect(() => {
    const load = () => {
        const result = rentalState.generateRentalReport({
            dateFrom: filters.dateFrom,
            dateTo: filters.dateTo,
            assetType: filters.assetType,
            groupBy: ['customer']
        });
        setData(result);
        rentalState.notify('RENTAL_REPORT');
    };
    load();
    return rentalState.subscribe(load);
  }, [filters]);

  if (!data) return <div>Loading...</div>;

  const columns = [
    { header: 'Customer', accessor: 'name' },
    { header: 'Completed Rentals', accessor: 'rentals' },
    { header: 'Total Revenue', render: (row) => <CurrencyDisplay amountCents={row.revenue} /> },
  ];

  return (
    <div style={{ padding: '24px', backgroundColor: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#0f172a', margin: '0 0 8px 0' }}>Rental Report</h1>
        <p style={{ color: '#64748b', margin: 0 }}>High-level rental volume and customer metrics.</p>
      </div>

      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', backgroundColor: 'white', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Asset Type</label>
              <select style={inputStyle} value={filters.assetType} onChange={e => setFilters({...filters, assetType: e.target.value})}>
                  <option value="">All Types</option>
                  <option value="car">Car Rentals</option>
                  <option value="agri_equipment">Agri Equipment</option>
              </select>
          </div>
          <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>From Date</label>
              <input type="date" style={inputStyle} value={filters.dateFrom} onChange={e => setFilters({...filters, dateFrom: e.target.value})} />
          </div>
          <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>To Date</label>
              <input type="date" style={inputStyle} value={filters.dateTo} onChange={e => setFilters({...filters, dateTo: e.target.value})} />
          </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
          <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '14px', color: '#64748b' }}>Total Completed Rentals</div>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#0f172a' }}>{data.metrics.totalRentals}</div>
          </div>
          <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '14px', color: '#64748b' }}>Total Revenue</div>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#10b981' }}><CurrencyDisplay amountCents={data.metrics.totalRevenueCents} /></div>
          </div>
          <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '14px', color: '#64748b' }}>Total Rental Days (Billed)</div>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#3b82f6' }}>{data.metrics.totalRentalDays} Days</div>
          </div>
      </div>

      <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ marginTop: 0 }}>Revenue by Customer</h3>
          <SalesDataTable data={data.groupings.customer.sort((a,b) => b.revenue - a.revenue)} columns={columns} searchPlaceholder="Search customers..." />
      </div>
    </div>
  );
};
const inputStyle = { padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' };
export default RentalReport;
