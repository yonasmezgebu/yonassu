import React, { useState, useEffect } from 'react';
import { rentalState } from '../../../utils/rentalManagerState';
import SalesDataTable from '../../sales/components/SalesDataTable';
import CurrencyDisplay from '../../sales/components/CurrencyDisplay';

const AssetUtilization = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    const load = () => {
        // We use the shared aggregation engine, grouped by asset
        const report = rentalState.generateRentalReport({ groupBy: ['asset'] });
        const assets = rentalState.getAssets();

        // The engine gives us completed orders. 
        // To compute true utilization rate, we need a period. Let's assume period = since purchase date to today
        const rows = assets.map(a => {
            const stat = report.groupings.asset.find(g => g.key === a.id) || { revenue: 0, rental_days: 0, rentals: 0 };
            
            const daysSincePurchase = Math.max(1, Math.ceil((new Date() - new Date(a.purchase_date)) / (1000*60*60*24)));
            const utilizationRate = ((stat.rental_days / daysSincePurchase) * 100).toFixed(1);
            
            return {
                id: a.id,
                name: a.name,
                type: a.asset_type === 'car' ? 'Car' : 'Agri',
                total_rental_days: stat.rental_days,
                utilization_rate: utilizationRate,
                total_revenue: stat.revenue,
                avg_revenue_per_day: stat.rental_days > 0 ? stat.revenue / stat.rental_days : 0
            };
        });

        setData(rows.sort((a,b) => b.utilization_rate - a.utilization_rate));
        rentalState.notify('UTILIZATION_READY');
    };
    
    load();
    return rentalState.subscribe(load);
  }, []);

  const columns = [
    { header: 'Asset', accessor: 'name' },
    { header: 'Type', accessor: 'type' },
    { header: 'Total Rental Days', accessor: 'total_rental_days' },
    { header: 'Utilization Rate', render: (row) => `${row.utilization_rate}%` },
    { header: 'Total Revenue', render: (row) => <CurrencyDisplay amountCents={row.total_revenue} /> },
    { header: 'Avg Rev / Day', render: (row) => <CurrencyDisplay amountCents={row.avg_revenue_per_day} /> },
  ];

  return (
    <div style={{ padding: '24px', backgroundColor: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#0f172a', margin: '0 0 8px 0' }}>Asset Utilization</h1>
        <p style={{ color: '#64748b', margin: 0 }}>Analyze fleet efficiency, rental days, and revenue generation.</p>
      </div>

      <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <SalesDataTable data={data} columns={columns} searchPlaceholder="Search asset..." />
      </div>
    </div>
  );
};

export default AssetUtilization;
