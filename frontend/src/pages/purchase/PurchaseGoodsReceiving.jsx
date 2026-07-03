import React, { useState } from 'react';
import { Truck, Download, Check, AlertCircle } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { purchaseState, receivePO } from '../../utils/purchaseTransactionService';
import { submitNotification } from '../../utils/pharmacyNotifications';

const PurchaseGoodsReceiving = () => {
  const [searchParams] = useSearchParams();
  const presetStatus = searchParams.get('status') || 'All';
  // Mock M19 data (since storeTransactionService only mocks inventory increment, we mock the M19 list for the UI view)
  const [m19Records, setM19Records] = useState([
    { id: 'M19-2026-081', poRef: 'PO-5001', supplier: 'Global Pharma Supplies', item: 'Paracetamol 500mg', qtyReceived: 1000, qtyExpected: 1000, date: '2026-06-28', receivedBy: 'Store Manager', quality: 'Passed', status: 'Pending' },
    { id: 'M19-2026-082', poRef: 'PO-5002', supplier: 'Ethio Medical Distributors', item: 'Surgical Masks', qtyReceived: 450, qtyExpected: 500, date: '2026-06-29', receivedBy: 'Pharmacy Staff', quality: 'Passed', status: 'Received' }
  ]);

  const [filterStatus, setFilterStatus] = useState(presetStatus);
  const [filterPO, setFilterPO] = useState('');

  const handleConfirm = (id, poRef) => {
    // 1. Mark M19 as Received
    const recs = [...m19Records];
    const rec = recs.find(r => r.id === id);
    if (rec) rec.status = 'Received';
    setM19Records(recs);

    // 2. Update PO Status
    receivePO(poRef);
    
    submitNotification('📥 Goods Received', '📥 Goods Received - Click to View', 'success.mp3');
  };

  const handleReportIssue = (id) => {
    const reason = prompt('Enter the discrepancy or quality issue:');
    if (!reason) return;
    
    const recs = [...m19Records];
    const rec = recs.find(r => r.id === id);
    if (rec) rec.status = 'Rejected';
    setM19Records(recs);

    submitNotification('⚠ Issue Reported', '⚠ Notification sent to supplier regarding discrepancy', 'info.mp3');
  };

  const filtered = m19Records.filter(r => 
    (filterStatus === 'All' || r.status === filterStatus) &&
    (!filterPO || r.poRef.toLowerCase().includes(filterPO.toLowerCase()))
  );

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: '#06b6d4' }}>
            <Truck color="#06b6d4" size={28} /> GOODS RECEIVING (M19)
          </h1>
          <p style={{ color: '#64748b', margin: '4px 0 0' }}>Monitor physical receipt of goods and update PO statuses.</p>
        </div>
        <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', background: 'white', border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer', color: '#475569', fontWeight: 600 }}>
          <Download size={16} /> Export
        </button>
      </div>

      <div style={{ background: '#e0f2fe', border: '1px solid #bae6fd', borderRadius: 8, padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10, color: '#0369a1', fontSize: 13 }}>
        <AlertCircle size={18} />
        <strong>Note:</strong> M19 records are created automatically when the Store/Pharmacy physically receives the goods. Use this view to confirm receipt and close out the corresponding Purchase Order.
      </div>

      {/* Filters */}
      <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', padding: 16, marginBottom: 16, display: 'flex', gap: 16 }}>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>PO #</label>
          <input placeholder="Search PO..." value={filterPO} onChange={e => setFilterPO(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13 }} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>Status</label>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13 }}>
            <option>All</option><option>Pending</option><option>Received</option><option>Rejected</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              {['Receiving #', 'PO #', 'Supplier', 'Items Received', 'Received / Expected', 'Difference', 'Date', 'Received By', 'Status', 'Actions'].map(col => (
                <th key={col} style={{ padding: '12px 14px', textAlign: col.includes('Expected') || col === 'Difference' ? 'right' : 'left', color: '#475569', fontWeight: 600, fontSize: 13 }}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(r => {
              const diff = r.qtyReceived - r.qtyExpected;
              return (
                <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px 14px', fontWeight: 600, color: '#0f172a' }}>{r.id}</td>
                  <td style={{ padding: '12px 14px', color: '#8b5cf6', fontWeight: 500 }}>{r.poRef}</td>
                  <td style={{ padding: '12px 14px', color: '#0f172a' }}>{r.supplier}</td>
                  <td style={{ padding: '12px 14px', color: '#475569' }}>{r.item}</td>
                  <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 'bold' }}>{r.qtyReceived} / {r.qtyExpected}</td>
                  <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 'bold', color: diff < 0 ? '#dc2626' : '#16a34a' }}>
                    {diff === 0 ? '-' : diff}
                  </td>
                  <td style={{ padding: '12px 14px', color: '#64748b' }}>{r.date}</td>
                  <td style={{ padding: '12px 14px', color: '#64748b' }}>{r.receivedBy}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: r.status === 'Received' ? '#dcfce7' : r.status === 'Rejected' ? '#fee2e2' : '#f1f5f9', color: r.status === 'Received' ? '#16a34a' : r.status === 'Rejected' ? '#dc2626' : '#475569' }}>
                      {r.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    {r.status === 'Pending' ? (
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => handleConfirm(r.id, r.poRef)} style={{ padding: '6px 12px', background: '#06b6d4', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600 }} title="Confirm & Close PO"><Check size={14} /> Confirm</button>
                        <button onClick={() => handleReportIssue(r.id)} style={{ padding: '6px 12px', background: 'white', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 4, cursor: 'pointer', fontWeight: 600 }} title="Report Discrepancy">Issue</button>
                      </div>
                    ) : <span style={{ fontSize: 12, color: '#94a3b8' }}>Processed</span>}
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && <tr><td colSpan={10} style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>No goods receiving records found.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PurchaseGoodsReceiving;
