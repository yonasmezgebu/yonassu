import React, { useState } from 'react';
import { AlertTriangle, Download, Flag, Trash2 } from 'lucide-react';
import { receiveNotification } from '../../utils/pharmacyNotifications';

const MOCK_EXPIRING = [
  { name: 'Ciprofloxacin', batchNumber: 'BTH-004', expiryDate: '2026-07-10', daysRemaining: 9, quantity: 30, unitPrice: 22.00 },
  { name: 'Azithromycin', batchNumber: 'BTH-011', expiryDate: '2026-07-20', daysRemaining: 19, quantity: 60, unitPrice: 18.00 },
  { name: 'Cough Syrup', batchNumber: 'BTH-007', expiryDate: '2026-07-25', daysRemaining: 24, quantity: 12, unitPrice: 12.00 },
  { name: 'Vitamin C', batchNumber: 'BTH-019', expiryDate: '2026-08-15', daysRemaining: 45, quantity: 200, unitPrice: 3.50 },
  { name: 'Iron Tablets', batchNumber: 'BTH-022', expiryDate: '2026-09-01', daysRemaining: 62, quantity: 80, unitPrice: 6.00 },
];

const getBucket = (days) => {
  if (days <= 7) return '7 days';
  if (days <= 14) return '14 days';
  if (days <= 30) return '30 days';
  return '60 days';
};

const PharmacyWorkerExpiringMedicines = () => {
  const [bucket, setBucket] = useState('All');
  const [flagged, setFlagged] = useState([]);

  // Trigger info notification on page load
  React.useEffect(() => {
    receiveNotification('⚠️ Medicines Expiring Soon', 'Expiry Alert - Click to Review');
  }, []);

  const filtered = MOCK_EXPIRING.filter(item => bucket === 'All' || getBucket(item.daysRemaining) === bucket);

  const handleReport = (item) => {
    alert(`Escalation sent to Pharmacy Manager: ${item.name} (${item.batchNumber}) expires on ${item.expiryDate}.`);
  };

  const handleMarkDisposal = (item) => {
    const confirm = window.confirm(`Flag ${item.name} (${item.batchNumber}) for disposal? This will route into the Stock Adjustment (Expiry Write-off) workflow.`);
    if (confirm) setFlagged(prev => [...prev, item.batchNumber]);
  };

  const urgencyColor = (days) => {
    if (days <= 7) return '#dc2626';
    if (days <= 14) return '#ea580c';
    if (days <= 30) return '#d97706';
    return '#ca8a04';
  };

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: '#991b1b' }}>
            <AlertTriangle color="#ef4444" size={28} /> EXPIRING MEDICINES
          </h1>
          <p style={{ color: '#64748b', margin: '4px 0 0' }}>Document Model: Expiry Report</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: 'white', border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer', color: '#475569', fontSize: 13 }}>
            <Download size={15} /> Export PDF
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', padding: 16, marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {['All', '7 days', '14 days', '30 days', '60 days'].map(b => (
            <button key={b} onClick={() => setBucket(b)} style={{
              padding: '7px 18px', borderRadius: 6, border: '2px solid', cursor: 'pointer', fontSize: 13, fontWeight: 600,
              background: bucket === b ? '#ef4444' : 'white',
              borderColor: bucket === b ? '#ef4444' : '#e2e8f0',
              color: bucket === b ? 'white' : '#64748b'
            }}>
              {b === 'All' ? 'All' : `≤ ${b}`}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ background: '#fef2f2', borderBottom: '1px solid #fecaca' }}>
              {['Medicine Name', 'Batch #', 'Expiry Date', 'Days Remaining', 'Qty at Risk', 'Value at Risk', 'Actions'].map(col => (
                <th key={col} style={{ padding: '11px 16px', textAlign: 'left', color: '#7f1d1d', fontWeight: 600, fontSize: 13 }}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((item, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #f1f5f9', background: flagged.includes(item.batchNumber) ? '#fef9c3' : 'white' }}>
                <td style={{ padding: '12px 16px', fontWeight: 600 }}>{item.name}</td>
                <td style={{ padding: '12px 16px', fontFamily: 'monospace', color: '#64748b' }}>{item.batchNumber}</td>
                <td style={{ padding: '12px 16px' }}>{item.expiryDate}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ fontWeight: 700, color: urgencyColor(item.daysRemaining), background: `${urgencyColor(item.daysRemaining)}15`, padding: '4px 8px', borderRadius: 4, fontSize: 13 }}>
                    {item.daysRemaining} days
                  </span>
                </td>
                <td style={{ padding: '12px 16px', fontWeight: 500 }}>{item.quantity}</td>
                <td style={{ padding: '12px 16px', fontWeight: 600 }}>${(item.quantity * item.unitPrice).toFixed(2)}</td>
                <td style={{ padding: '12px 16px' }}>
                  {flagged.includes(item.batchNumber) ? (
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#92400e', background: '#fef3c7', padding: '4px 8px', borderRadius: 4 }}>
                      Flagged for Disposal
                    </span>
                  ) : (
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => handleReport(item)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 10px', background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a', borderRadius: 4, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                        <Flag size={12} /> Report
                      </button>
                      <button onClick={() => handleMarkDisposal(item)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 10px', background: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca', borderRadius: 4, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                        <Trash2 size={12} /> Mark Disposal
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PharmacyWorkerExpiringMedicines;
