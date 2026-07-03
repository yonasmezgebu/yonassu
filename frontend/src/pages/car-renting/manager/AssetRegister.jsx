import React, { useState, useEffect } from 'react';
import { rentalState } from '../../../utils/rentalManagerState';
import SalesDataTable from '../../sales/components/SalesDataTable';
import SalesStatusBadge from '../../sales/components/SalesStatusBadge';
import CurrencyDisplay from '../../sales/components/CurrencyDisplay';
import { useNavigate } from 'react-router-dom';

const AssetRegister = () => {
  const [assets, setAssets] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const load = () => {
        setAssets(rentalState.getAssets());
        rentalState.notify('ASSET_REGISTER');
    };
    load();
    return rentalState.subscribe(load);
  }, []);

  const columns = [
    { header: 'Type', render: (row) => row.asset_type === 'car' ? 'Car' : 'Agri' },
    { header: 'Identifier', accessor: 'identifier' },
    { header: 'Name / Model', render: (row) => `${row.name} (${row.year})` },
    { header: 'Category', accessor: 'category' },
    { header: 'Daily Rate', render: (row) => <CurrencyDisplay amountCents={row.daily_rate_cents} /> },
    { header: 'Status', render: (row) => <SalesStatusBadge status={row.status} /> },
  ];

  return (
    <div style={{ padding: '24px', backgroundColor: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#0f172a', margin: '0 0 8px 0' }}>Asset Register</h1>
            <p style={{ color: '#64748b', margin: 0 }}>Full inventory of vehicles and equipment.</p>
        </div>
        <button onClick={() => navigate('/car-renting/manager/assets/new')} style={{ padding: '10px 16px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
            + Add Asset
        </button>
      </div>

      <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <SalesDataTable data={assets} columns={columns} searchPlaceholder="Search by identifier or model..." />
      </div>
    </div>
  );
};

export default AssetRegister;
