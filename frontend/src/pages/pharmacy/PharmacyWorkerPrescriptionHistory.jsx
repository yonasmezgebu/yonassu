import React, { useState, useEffect } from 'react';
import { Archive, Download, Printer, Filter } from 'lucide-react';
import { triggerNotification, receiveNotification } from '../../utils/pharmacyNotifications';

const MOCK_HISTORY = [
  { id: 'RX-840001', patientName: 'Solomon Tadesse', medicine: 'Amoxicillin 500mg', qty: 20, dateReceived: '2026-06-15', dateCompleted: '2026-06-15', status: 'Completed', processedBy: 'Abebe Kebede' },
  { id: 'RX-840015', patientName: 'Hana Belay', medicine: 'Ciprofloxacin 500mg', qty: 14, dateReceived: '2026-06-18', dateCompleted: '2026-06-19', status: 'Completed', processedBy: 'Abebe Kebede' },
  { id: 'RX-840022', patientName: 'Dawit Getachew', medicine: 'Paracetamol 500mg', qty: 30, dateReceived: '2026-06-20', dateCompleted: '2026-06-20', status: 'Completed', processedBy: 'Martha Yohannes' },
  { id: 'RX-840040', patientName: 'Tigist Assefa', medicine: 'Azithromycin 250mg', qty: 6, dateReceived: '2026-06-25', dateCompleted: '2026-06-26', status: 'Completed', processedBy: 'Abebe Kebede' }
];

const PharmacyWorkerPrescriptionHistory = () => {
  const [history, setHistory] = useState(MOCK_HISTORY);

  useEffect(() => {
    // Simulate report ready
    receiveNotification('📊 Prescription History Ready', 'History Report - Click to View');
  }, []);

  const handleExport = () => {
    triggerNotification('Export Started', 'Downloading PDF...', 'info');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: '#334155' }}>
            <Archive color="#64748b" size={28} /> PRESCRIPTION HISTORY
          </h1>
          <p style={{ color: '#64748b', margin: '4px 0 0' }}>Document Model: Prescription Log</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={handleExport} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: 'white', border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer', color: '#475569' }}>
            <Download size={16} /> Export PDF
          </button>
          <button onClick={handlePrint} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: 'white', border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer', color: '#475569' }}>
            <Printer size={16} /> Print Log
          </button>
        </div>
      </div>

      <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', padding: 20, marginBottom: 16 }}>
        <h3 style={{ margin: '0 0 16px', fontSize: 15, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Filter size={16} color="#64748b" /> Filter Records
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr auto', gap: 16, alignItems: 'end' }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>Date Range</label>
            <input type="date" style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13, boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>Patient Name</label>
            <input placeholder="Search name" style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13, boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>Medicine Name</label>
            <input placeholder="Search medicine" style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13, boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>Status</label>
            <select style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13, boxSizing: 'border-box' }}>
              <option>All</option>
              <option>Completed</option>
              <option>Processed</option>
              <option>Pending</option>
            </select>
          </div>
          <button style={{ padding: '8px 24px', background: '#0f172a', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 500, height: 35 }}>
            Apply Filters
          </button>
        </div>
      </div>

      <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <th style={{ padding: '12px 16px', textAlign: 'left', color: '#475569', fontWeight: 600 }}>RX #</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', color: '#475569', fontWeight: 600 }}>Patient Name</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', color: '#475569', fontWeight: 600 }}>Medicine</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', color: '#475569', fontWeight: 600 }}>Qty</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', color: '#475569', fontWeight: 600 }}>Received</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', color: '#475569', fontWeight: 600 }}>Completed</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', color: '#475569', fontWeight: 600 }}>Status</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', color: '#475569', fontWeight: 600 }}>Processed By</th>
            </tr>
          </thead>
          <tbody>
            {history.map(rx => (
              <tr key={rx.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '12px 16px', fontFamily: 'monospace', color: '#64748b', fontWeight: 600 }}>{rx.id}</td>
                <td style={{ padding: '12px 16px', fontWeight: 500 }}>{rx.patientName}</td>
                <td style={{ padding: '12px 16px' }}>{rx.medicine}</td>
                <td style={{ padding: '12px 16px' }}>{rx.qty}</td>
                <td style={{ padding: '12px 16px', color: '#64748b' }}>{rx.dateReceived}</td>
                <td style={{ padding: '12px 16px', color: '#64748b' }}>{rx.dateCompleted}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ padding: '4px 8px', borderRadius: 4, fontSize: 12, fontWeight: 600, background: '#dcfce7', color: '#166534' }}>
                    {rx.status}
                  </span>
                </td>
                <td style={{ padding: '12px 16px', color: '#475569' }}>{rx.processedBy}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PharmacyWorkerPrescriptionHistory;
