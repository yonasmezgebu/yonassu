import React, { useState } from 'react';
import { Printer, Search, Download, Mail, CheckCircle } from 'lucide-react';
import { submitNotification } from '../../utils/pharmacyNotifications';

const MOCK_RECEIPTS = [
  { id: 'RCP-001', customerName: 'Abebe Kebede', items: 'Amoxicillin 500mg x20', totalAmount: 300.00, paymentMethod: 'Cash', date: '2026-07-01' },
  { id: 'RCP-002', customerName: 'Fatima Ali', items: 'Paracetamol 500mg x30', totalAmount: 150.00, paymentMethod: 'Telebirr', date: '2026-07-01' },
  { id: 'RCP-003', customerName: 'Solomon T.', items: 'Ibuprofen 400mg x10', totalAmount: 85.00, paymentMethod: 'Bank Transfer', date: '2026-06-30' },
];

const PharmacyWorkerPrintReceipt = () => {
  const [search, setSearch] = useState('');
  const [printed, setPrinted] = useState(null);

  const filtered = MOCK_RECEIPTS.filter(r =>
    r.id.toLowerCase().includes(search.toLowerCase()) ||
    r.customerName.toLowerCase().includes(search.toLowerCase()) ||
    r.date.includes(search)
  );

  const handlePrint = (receipt) => {
    setPrinted(receipt);
    submitNotification('🧾 Receipt Printed', 'Receipt Reprinted - Click to View');
    setTimeout(() => window.print(), 300);
  };

  const handleEmail = (receipt) => {
    alert(`Receipt ${receipt.id} has been emailed to ${receipt.customerName}'s registered email address.`);
    submitNotification('🧾 Receipt Sent', 'Receipt Reprinted - Click to View');
  };

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: '#0f172a' }}>
          <Printer color="#475569" size={28} /> PRINT RECEIPT
        </h1>
        <p style={{ color: '#64748b', margin: '4px 0 0' }}>Document Model: Receipt — No permission required</p>
      </div>

      {/* Search Bar */}
      <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', padding: 20, marginBottom: 16 }}>
        <div style={{ position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: 14, top: 12, color: '#94a3b8' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by Receipt #, Customer Name, or Date..."
            style={{ width: '100%', padding: '10px 12px 10px 42px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 14, boxSizing: 'border-box' }}
          />
        </div>
      </div>

      {/* Results Table */}
      <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <th style={{ padding: '12px 16px', textAlign: 'left', color: '#475569', fontWeight: 600 }}>Receipt #</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', color: '#475569', fontWeight: 600 }}>Customer Name</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', color: '#475569', fontWeight: 600 }}>Items Purchased</th>
              <th style={{ padding: '12px 16px', textAlign: 'right', color: '#475569', fontWeight: 600 }}>Total Amount</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', color: '#475569', fontWeight: 600 }}>Payment Method</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', color: '#475569', fontWeight: 600 }}>Date</th>
              <th style={{ padding: '12px 16px', textAlign: 'right', color: '#475569', fontWeight: 600 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: '#94a3b8' }}>No receipts found for your search.</td>
              </tr>
            ) : filtered.map(receipt => (
              <tr key={receipt.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontWeight: 600, color: '#475569' }}>{receipt.id}</td>
                <td style={{ padding: '12px 16px', fontWeight: 500 }}>{receipt.customerName}</td>
                <td style={{ padding: '12px 16px', color: '#64748b' }}>{receipt.items}</td>
                <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600 }}>${receipt.totalAmount.toFixed(2)}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ padding: '3px 8px', background: '#f1f5f9', borderRadius: 4, fontSize: 12, fontWeight: 500 }}>{receipt.paymentMethod}</span>
                </td>
                <td style={{ padding: '12px 16px', color: '#64748b' }}>{receipt.date}</td>
                <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                    <button onClick={() => handlePrint(receipt)} title="Print Receipt" style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 10px', background: '#0f172a', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}>
                      <Printer size={12} /> Print
                    </button>
                    <button onClick={() => handleEmail(receipt)} title="Email Receipt" style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 10px', background: 'white', border: '1px solid #cbd5e1', borderRadius: 4, cursor: 'pointer', fontSize: 12, color: '#475569' }}>
                      <Mail size={12} /> Email
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

export default PharmacyWorkerPrintReceipt;
