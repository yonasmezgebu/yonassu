import React, { useState } from 'react';
import { triggerNotification } from '../../utils/ceoNotifications';
import { Car, Download, Eye, CheckCircle } from 'lucide-react';

const CEOCarRental = () => {
  const [activeTab, setActiveTab] = useState('Rentals');

  const [vehicles] = useState([
    { id: 'V-001', type: 'Ambulance', plate: 'MED-1234', status: 'Available', lastService: '2026-05-10' },
    { id: 'V-002', type: 'Transport Van', plate: 'SUT-9988', status: 'Rented', lastService: '2026-06-01' },
    { id: 'V-003', type: 'Executive Car', plate: 'CEO-001', status: 'Available', lastService: '2026-06-15' },
  ]);

  const [rentals] = useState([
    { id: 'RNT-8001', customer: 'General Hospital', vehicle: 'V-002 (Transport Van)', duration: '5 Days', amount: 500, status: 'Active', startDate: '2026-06-28' },
    { id: 'RNT-8002', customer: 'John Doe', vehicle: 'V-001 (Ambulance)', duration: '1 Day', amount: 150, status: 'Completed', startDate: '2026-06-25' },
  ]);

  const [viewDetail, setViewDetail] = useState(null);

  const activeRentals = rentals.filter(r => r.status === 'Active').length;
  const availableVehicles = vehicles.filter(v => v.status === 'Available').length;
  const totalRevenue = rentals.reduce((sum, r) => sum + r.amount, 0);

  const handleExport = () => {
    triggerNotification('Export Started', `Exporting Car Rental ${activeTab} Report as PDF...`);
  };

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Car color="#eab308"/> CAR & AMBULANCE RENTAL
          </h1>
          <p style={{ color: '#64748b', margin: 0 }}>🔗 Monitor Fleet Utilization and Rental Income</p>
        </div>
        <button onClick={handleExport} style={{ padding: '8px 16px', background: 'white', border: '1px solid #cbd5e1', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
          <Download size={16}/> Export Report
        </button>
      </div>

      {/* SUMMARY CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        <div style={{ background: '#e0e7ff', padding: 16, borderRadius: 8, border: '1px solid #c7d2fe' }}>
          <div style={{ fontSize: 13, color: '#3730a3', fontWeight: 'bold' }}>Active Rentals</div>
          <div style={{ fontSize: 24, fontWeight: 'bold', color: '#4338ca' }}>{activeRentals}</div>
        </div>
        <div style={{ background: '#dcfce7', padding: 16, borderRadius: 8, border: '1px solid #bbf7d0' }}>
          <div style={{ fontSize: 13, color: '#166534', fontWeight: 'bold' }}>Available Vehicles</div>
          <div style={{ fontSize: 24, fontWeight: 'bold', color: '#15803d' }}>{availableVehicles} / {vehicles.length}</div>
        </div>
        <div style={{ background: 'white', padding: 16, borderRadius: 8, border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: 13, color: '#64748b', fontWeight: 'bold' }}>Total Revenue (MTD)</div>
          <div style={{ fontSize: 24, fontWeight: 'bold', color: '#0f172a' }}>${totalRevenue.toLocaleString()}</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {['Rentals', 'Fleet Status'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{ padding: '10px 20px', borderRadius: 6, border: 'none', background: activeTab === tab ? '#0f172a' : 'white', color: activeTab === tab ? 'white' : '#64748b', cursor: 'pointer', fontWeight: 'bold', border: activeTab === tab ? 'none' : '1px solid #e2e8f0' }}>
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'Rentals' && (
        <div style={{ background: 'white', padding: 16, borderRadius: 8, border: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: 16 }}>Rental Agreements</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ background: '#f8fafc' }}>
              <tr>
                <th style={{ padding: 12 }}>Booking ID</th>
                <th style={{ padding: 12 }}>Customer</th>
                <th style={{ padding: 12 }}>Vehicle</th>
                <th style={{ padding: 12 }}>Duration</th>
                <th style={{ padding: 12 }}>Amount</th>
                <th style={{ padding: 12 }}>Start Date</th>
                <th style={{ padding: 12 }}>Status</th>
                <th style={{ padding: 12 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rentals.map(r => (
                <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: 12, fontWeight: 'bold' }}>{r.id}</td>
                  <td style={{ padding: 12 }}>{r.customer}</td>
                  <td style={{ padding: 12 }}>{r.vehicle}</td>
                  <td style={{ padding: 12 }}>{r.duration}</td>
                  <td style={{ padding: 12, fontWeight: 'bold' }}>${r.amount}</td>
                  <td style={{ padding: 12 }}>{r.startDate}</td>
                  <td style={{ padding: 12 }}>
                    <span style={{ padding: '4px 8px', borderRadius: 4, fontSize: 12, fontWeight: 'bold', background: r.status === 'Active' ? '#e0e7ff' : '#dcfce7', color: r.status === 'Active' ? '#4338ca' : '#166534' }}>
                      {r.status}
                    </span>
                  </td>
                  <td style={{ padding: 12 }}>
                    <button onClick={() => setViewDetail({ type: 'Rental', data: r })} style={{ background: '#f1f5f9', border: 'none', padding: '6px 12px', borderRadius: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Eye size={14}/> View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'Fleet Status' && (
        <div style={{ background: 'white', padding: 16, borderRadius: 8, border: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: 16 }}>Fleet Status</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ background: '#f8fafc' }}>
              <tr>
                <th style={{ padding: 12 }}>Vehicle ID</th>
                <th style={{ padding: 12 }}>Type</th>
                <th style={{ padding: 12 }}>License Plate</th>
                <th style={{ padding: 12 }}>Last Service</th>
                <th style={{ padding: 12 }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {vehicles.map(v => (
                <tr key={v.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: 12, fontWeight: 'bold' }}>{v.id}</td>
                  <td style={{ padding: 12 }}>{v.type}</td>
                  <td style={{ padding: 12 }}>{v.plate}</td>
                  <td style={{ padding: 12 }}>{v.lastService}</td>
                  <td style={{ padding: 12 }}>
                    <span style={{ padding: '4px 8px', borderRadius: 4, fontSize: 12, fontWeight: 'bold', background: v.status === 'Available' ? '#dcfce7' : '#fee2e2', color: v.status === 'Available' ? '#166534' : '#991b1b' }}>
                      {v.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* VIEW DETAILS MODAL */}
      {viewDetail && viewDetail.type === 'Rental' && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: 'white', padding: 24, borderRadius: 12, width: 500 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ margin: 0 }}>Rental Details: {viewDetail.data.id}</h2>
              <button onClick={() => setViewDetail(null)} style={{ background: 'transparent', border: 'none', fontSize: 24, cursor: 'pointer' }}>&times;</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24, padding: 16, background: '#f8fafc', borderRadius: 8 }}>
              <div><strong>Customer:</strong> {viewDetail.data.customer}</div>
              <div><strong>Vehicle:</strong> {viewDetail.data.vehicle}</div>
              <div><strong>Start Date:</strong> {viewDetail.data.startDate}</div>
              <div><strong>Duration:</strong> {viewDetail.data.duration}</div>
              <div><strong>Total Amount:</strong> ${viewDetail.data.amount}</div>
              <div><strong>Status:</strong> {viewDetail.data.status}</div>
            </div>

            <button onClick={() => setViewDetail(null)} style={{ padding: '8px 16px', background: '#0f172a', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', width: '100%' }}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CEOCarRental;
