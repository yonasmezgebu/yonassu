import React, { useState, useEffect } from 'react';
import { rentalState } from '../../../utils/rentalManagerState';
import SalesDataTable from '../../sales/components/SalesDataTable';
import CurrencyDisplay from '../../sales/components/CurrencyDisplay';

const PerformanceReport = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    const load = () => {
        // Asset level profitability: Revenue vs Maintenance Cost
        const report = rentalState.generateRentalReport({ groupBy: ['asset'] });
        const maintenance = rentalState.getMaintenanceRecords();
        const assets = rentalState.getAssets();

        const rows = assets.map(a => {
            const rev = report.groupings.asset.find(g => g.key === a.id)?.revenue || 0;
            const cost = maintenance.filter(m => m.asset_id === a.id).reduce((sum, m) => sum + m.cost_cents, 0);
            
            return {
                id: a.id,
                name: a.name,
                type: a.asset_type === 'car' ? 'Car' : 'Agri',
                revenue: rev,
                cost: cost,
                profit: rev - cost
            };
        });

        setData(rows.sort((a,b) => b.profit - a.profit));
        rentalState.notify('PERFORMANCE_REPORT');
    };
    
    load();
    return rentalState.subscribe(load);
  }, []);

  const columns = [
    { header: 'Asset', accessor: 'name' },
    { header: 'Type', accessor: 'type' },
    { header: 'Total Revenue', render: (row) => <CurrencyDisplay amountCents={row.revenue} /> },
    { header: 'Maintenance Cost', render: (row) => <div style={{ color: '#ef4444' }}>- <CurrencyDisplay amountCents={row.cost} /></div> },
    { header: 'Net Profit', render: (row) => <div style={{ color: row.profit >= 0 ? '#10b981' : '#ef4444', fontWeight: 'bold' }}><CurrencyDisplay amountCents={row.profit} /></div> },
  ];

  return (
    <div style={{ padding: '24px', backgroundColor: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#0f172a', margin: '0 0 8px 0' }}>Performance Report</h1>
        <p style={{ color: '#64748b', margin: 0 }}>Asset-level profitability (Revenue vs Maintenance Costs).</p>
      </div>

      <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <SalesDataTable data={data} columns={columns} searchPlaceholder="Search asset performance..." />
      </div>
    </div>
  );
};

export default PerformanceReport;
