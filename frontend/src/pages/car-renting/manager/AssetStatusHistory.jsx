import React, { useState, useEffect } from 'react';
import { rentalState } from '../../../utils/rentalManagerState';
import SalesDataTable from '../../sales/components/SalesDataTable';

const AssetStatusHistory = () => {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const load = () => {
        const h = rentalState.getAssetStatusHistory();
        const assets = rentalState.getAssets();
        
        const enriched = h.map(record => ({
            ...record,
            asset_name: assets.find(a => a.id === record.asset_id)?.name || 'Unknown'
        }));
        
        setHistory(enriched.sort((a,b) => new Date(b.changed_at) - new Date(a.changed_at)));
        rentalState.notify('HISTORY_READY');
    };
    load();
    return rentalState.subscribe(load);
  }, []);

  const getBadge = (status) => {
      let color = '#64748b';
      if (status === 'available') color = '#10b981';
      if (status === 'rented') color = '#3b82f6';
      if (status === 'maintenance') color = '#f59e0b';
      return <span style={{ padding: '4px 8px', borderRadius: '4px', backgroundColor: `${color}20`, color, fontSize: '12px', fontWeight: '600', textTransform: 'uppercase' }}>{status}</span>;
  };

  const columns = [
    { header: 'Date/Time', render: (row) => new Date(row.changed_at).toLocaleString() },
    { header: 'Asset', accessor: 'asset_name' },
    { header: 'Transition', render: (row) => <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>{getBadge(row.previous_status)} <span>→</span> {getBadge(row.new_status)}</div> },
    { header: 'Trigger Reason', accessor: 'reason' },
    { header: 'User', accessor: 'changed_by' }
  ];

  return (
    <div style={{ padding: '24px', backgroundColor: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#0f172a', margin: '0 0 8px 0' }}>Asset Status History</h1>
        <p style={{ color: '#64748b', margin: 0 }}>Immutable audit log of all asset state transitions.</p>
      </div>

      <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <SalesDataTable data={history} columns={columns} searchPlaceholder="Search history logs..." />
      </div>
    </div>
  );
};

export default AssetStatusHistory;
