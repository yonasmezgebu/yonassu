import React, { useState, useEffect } from 'react';
import { Clock, Filter, Phone, Play, PauseCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { triggerNotification, receiveNotification } from '../../utils/pharmacyNotifications';

const MOCK_DATA = [
  { id: 'RX-849102', patientName: 'Abebe Kebede', medicine: 'Amoxicillin 500mg', qty: 20, dateReceived: '2026-07-01', daysPending: 0, status: 'New', priority: 'Urgent' },
  { id: 'RX-849090', patientName: 'Fatima Ali', medicine: 'Lisinopril 10mg', qty: 30, dateReceived: '2026-06-29', daysPending: 2, status: 'In Progress', priority: 'Normal' },
  { id: 'RX-849081', patientName: 'John Smith', medicine: 'Ibuprofen 400mg', qty: 15, dateReceived: '2026-06-28', daysPending: 3, status: 'On Hold', priority: 'Normal' },
];

const PharmacyWorkerPendingPrescriptions = () => {
  const navigate = useNavigate();
  const [prescriptions, setPrescriptions] = useState(MOCK_DATA);
  const [sortBy, setSortBy] = useState('Oldest First');

  useEffect(() => {
    // Simulate receiving this notification when opening the page
    receiveNotification('⏳ Pending Prescriptions', 'Prescriptions Awaiting Action - Click to Review');
  }, []);

  const handleProcess = (rx) => {
    navigate('/pharmacy-worker/dispense', {
      state: { prefill: rx }
    });
  };

  const handleNotify = (rx) => {
    alert(`Calling/Messaging patient ${rx.patientName} at their registered phone number...`);
  };

  const handleHold = (rx) => {
    const reason = prompt(`Enter reason for putting ${rx.id} on hold:`);
    if (reason) {
      setPrescriptions(prev => prev.map(p => p.id === rx.id ? { ...p, status: 'On Hold' } : p));
      triggerNotification('Status Updated', `${rx.id} placed on hold.`, 'info');
    }
  };

  const sortedPrescriptions = [...prescriptions].sort((a, b) => {
    if (sortBy === 'Priority') {
      return a.priority === 'Urgent' ? -1 : 1;
    }
    // Oldest First
    return b.daysPending - a.daysPending;
  });

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: '#9a3412' }}>
            <Clock color="#f97316" size={28} /> PENDING PRESCRIPTIONS
          </h1>
          <p style={{ color: '#64748b', margin: '4px 0 0' }}>Document Model: Prescription List</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ position: 'relative' }}>
            <Filter size={16} style={{ position: 'absolute', left: 10, top: 10, color: '#64748b' }} />
            <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ padding: '8px 12px 8px 32px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13 }}>
              <option>Oldest First</option>
              <option>Priority</option>
            </select>
          </div>
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
              <th style={{ padding: '12px 16px', textAlign: 'left', color: '#475569', fontWeight: 600 }}>Pending</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', color: '#475569', fontWeight: 600 }}>Status</th>
              <th style={{ padding: '12px 16px', textAlign: 'right', color: '#475569', fontWeight: 600 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedPrescriptions.map(rx => (
              <tr key={rx.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '12px 16px', fontFamily: 'monospace', color: '#f97316', fontWeight: 600 }}>
                  {rx.id}
                  {rx.priority === 'Urgent' && <span style={{ marginLeft: 8, background: '#fee2e2', color: '#dc2626', padding: '2px 6px', borderRadius: 4, fontSize: 11 }}>URGENT</span>}
                </td>
                <td style={{ padding: '12px 16px', fontWeight: 500 }}>{rx.patientName}</td>
                <td style={{ padding: '12px 16px' }}>{rx.medicine}</td>
                <td style={{ padding: '12px 16px' }}>{rx.qty}</td>
                <td style={{ padding: '12px 16px', color: '#64748b' }}>{rx.dateReceived}</td>
                <td style={{ padding: '12px 16px', color: rx.daysPending > 2 ? '#dc2626' : '#64748b', fontWeight: rx.daysPending > 2 ? 'bold' : 'normal' }}>
                  {rx.daysPending} days
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ 
                    padding: '4px 8px', borderRadius: 4, fontSize: 12, fontWeight: 600,
                    background: rx.status === 'New' ? '#dcfce7' : rx.status === 'On Hold' ? '#fee2e2' : '#fef3c7',
                    color: rx.status === 'New' ? '#166534' : rx.status === 'On Hold' ? '#991b1b' : '#92400e'
                  }}>
                    {rx.status}
                  </span>
                </td>
                <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                    <button onClick={() => handleProcess(rx)} title="Process (Dispense)" style={{ background: '#f97316', color: 'white', border: 'none', padding: '6px', borderRadius: 4, cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                      <Play size={14} />
                    </button>
                    <button onClick={() => handleHold(rx)} title="Hold" style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', padding: '6px', borderRadius: 4, cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                      <PauseCircle size={14} />
                    </button>
                    <button onClick={() => handleNotify(rx)} title="Notify Patient" style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', padding: '6px', borderRadius: 4, cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                      <Phone size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PharmacyWorkerPendingPrescriptions;
