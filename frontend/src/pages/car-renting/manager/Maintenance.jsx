import React, { useState, useEffect } from 'react';
import { rentalState } from '../../../utils/rentalManagerState';
import SalesDataTable from '../../sales/components/SalesDataTable';
import SalesStatusBadge from '../../sales/components/SalesStatusBadge';
import CurrencyDisplay from '../../sales/components/CurrencyDisplay';

const Maintenance = () => {
  const [records, setRecords] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [assets, setAssets] = useState([]);
  
  // Form State
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
      asset_id: '', type: 'routine', description: '', cost_cents: '', scheduled_date: new Date().toISOString().substring(0, 10), status: 'scheduled'
  });

  useEffect(() => {
    const load = () => {
        const asts = rentalState.getAssets();
        setAssets(asts);

        const recs = rentalState.getMaintenanceRecords().map(r => ({
            ...r,
            asset_name: asts.find(a => a.id === r.asset_id)?.name || 'Unknown'
        }));
        
        setRecords(recs.sort((a,b) => new Date(b.scheduled_date) - new Date(a.scheduled_date)));

        // Upcoming Alerts: scheduled date within next 7 days and status != completed
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        const nextWeekIso = nextWeek.toISOString().substring(0, 10);
        const todayIso = new Date().toISOString().substring(0, 10);

        setAlerts(recs.filter(r => r.status !== 'completed' && r.scheduled_date.substring(0,10) >= todayIso && r.scheduled_date.substring(0,10) <= nextWeekIso));
        
        rentalState.notify('PAGE_LOAD'); // Silent
    };
    load();
    return rentalState.subscribe(load);
  }, []);

  const handleSubmit = (e) => {
      e.preventDefault();
      rentalState.createMaintenance({
          ...formData,
          cost_cents: formData.cost_cents ? Math.round(parseFloat(formData.cost_cents) * 100) : 0,
      });
      setShowModal(false);
      rentalState.notify('MAINTENANCE_REQ');
  };

  const handleComplete = (id) => {
      if(window.confirm("Mark maintenance as completed? This will return the asset to 'available' status.")) {
          rentalState.completeMaintenance(id);
          rentalState.notify('MAINTENANCE_UPDATED');
      }
  };

  const columns = [
    { header: 'Asset', accessor: 'asset_name' },
    { header: 'Type', accessor: 'type', render: (row) => <span style={{ textTransform: 'capitalize' }}>{row.type}</span> },
    { header: 'Description', accessor: 'description' },
    { header: 'Scheduled Date', render: (row) => new Date(row.scheduled_date).toLocaleDateString() },
    { header: 'Cost', render: (row) => <CurrencyDisplay amountCents={row.cost_cents} /> },
    { header: 'Status', render: (row) => <SalesStatusBadge status={row.status} /> },
    { header: 'Actions', render: (row) => (
        row.status !== 'completed' ? 
        <button onClick={() => handleComplete(row.id)} style={{ padding: '4px 8px', background: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Complete</button>
        : null
    )}
  ];

  return (
    <div style={{ padding: '24px', backgroundColor: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#0f172a', margin: '0 0 8px 0' }}>Maintenance Records</h1>
            <p style={{ color: '#64748b', margin: 0 }}>Schedule and track fleet maintenance and repairs.</p>
        </div>
        <button onClick={() => setShowModal(true)} style={{ padding: '10px 16px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
            + Log Maintenance
        </button>
      </div>

      {alerts.length > 0 && (
          <div style={{ backgroundColor: '#fff7ed', border: '1px solid #fdba74', padding: '16px', borderRadius: '8px', marginBottom: '24px' }}>
              <h3 style={{ color: '#c2410c', margin: '0 0 8px 0' }}>Upcoming Maintenance Alerts (7 Days)</h3>
              <ul style={{ margin: 0, paddingLeft: '20px', color: '#9a3412' }}>
                  {alerts.map(a => (
                      <li key={a.id}>{a.asset_name} - {a.type} on {new Date(a.scheduled_date).toLocaleDateString()}</li>
                  ))}
              </ul>
          </div>
      )}

      <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <SalesDataTable data={records} columns={columns} searchPlaceholder="Search descriptions..." />
      </div>

      {/* Modal - Basic implementation */}
      {showModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
              <div style={{ backgroundColor: 'white', padding: '32px', borderRadius: '12px', width: '500px' }}>
                  <h2 style={{ marginTop: 0 }}>Schedule Maintenance</h2>
                  <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div>
                          <label>Asset</label>
                          <select style={inputStyle} value={formData.asset_id} onChange={e => setFormData({...formData, asset_id: e.target.value})} required>
                              <option value="">Select Asset...</option>
                              {assets.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                          </select>
                      </div>
                      <div>
                          <label>Type</label>
                          <select style={inputStyle} value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                              <option value="routine">Routine Service</option>
                              <option value="repair">Repair</option>
                          </select>
                      </div>
                      <div>
                          <label>Description</label>
                          <input style={inputStyle} type="text" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} required />
                      </div>
                      <div>
                          <label>Status</label>
                          <select style={inputStyle} value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                              <option value="scheduled">Scheduled (Asset Remains Available)</option>
                              <option value="in_progress">In Progress (Asset moved to Maintenance)</option>
                          </select>
                      </div>
                      <div style={{ display: 'flex', gap: '16px', marginTop: '16px' }}>
                          <button type="submit" style={{ flex: 1, padding: '10px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px' }}>Save</button>
                          <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, padding: '10px', background: '#e2e8f0', color: '#475569', border: 'none', borderRadius: '6px' }}>Cancel</button>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};
const inputStyle = { width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1', marginTop: '4px' };
export default Maintenance;
