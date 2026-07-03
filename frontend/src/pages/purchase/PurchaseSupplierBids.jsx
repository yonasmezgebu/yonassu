import React, { useState } from 'react';
import { Inbox, Download, Check, X, ShieldAlert } from 'lucide-react';
import { purchaseState, acceptBid } from '../../utils/purchaseTransactionService';
import { submitNotification } from '../../utils/pharmacyNotifications';

const PurchaseSupplierBids = () => {
  const [bids, setBids] = useState(purchaseState.m6BidsAndQuotes.filter(b => b.source_type === 'Tender'));
  const [filterTender, setFilterTender] = useState('');
  const [filterSupplier, setFilterSupplier] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');

  const handleAccept = (id) => {
    try {
      acceptBid(id);
      setBids(purchaseState.m6BidsAndQuotes.filter(b => b.source_type === 'Tender'));
      submitNotification('✅ Bid Accepted', '✅ Supplier Bid Accepted Successfully', 'success.mp3');
    } catch (e) {
      alert(e.message); // This will pop the "Cannot accept without CEO approval" error
    }
  };

  const handleReject = (id) => {
    const reason = prompt('Enter reason for rejecting this bid:');
    if (!reason) return;
    const bid = purchaseState.m6BidsAndQuotes.find(b => b.id === id);
    if (bid) bid.status = 'Rejected';
    setBids(purchaseState.m6BidsAndQuotes.filter(b => b.source_type === 'Tender'));
    submitNotification('❌ Bid Rejected', '❌ Supplier Bid Rejected', 'info.mp3');
  };

  // Filter
  const filtered = bids.filter(b => 
    (filterStatus === 'All' || b.status === filterStatus) &&
    (!filterTender || b.referenceId.toLowerCase().includes(filterTender.toLowerCase())) &&
    (!filterSupplier || b.supplierName.toLowerCase().includes(filterSupplier.toLowerCase()))
  );

  // Auto-sort by Total Cost Low -> High
  const sorted = [...filtered].sort((a, b) => (a.qty * a.unitPrice) - (b.qty * b.unitPrice));

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: '#059669' }}>
            <Inbox color="#059669" size={28} /> SUPPLIER BIDS (M6)
          </h1>
          <p style={{ color: '#64748b', margin: '4px 0 0' }}>Review and act on supplier bids submitted against open tenders.</p>
        </div>
        <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', background: 'white', border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer', color: '#475569', fontWeight: 600 }}>
          <Download size={16} /> Export
        </button>
      </div>

      {/* CEO Gate Notice */}
      <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10, color: '#92400e', fontSize: 13 }}>
        <ShieldAlert size={18} />
        <strong>CEO Approval Required:</strong> You cannot finalize [Accept Bid] unless the corresponding Tender has a recorded CEO Approval.
      </div>

      {/* Filters */}
      <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', padding: 16, marginBottom: 16, display: 'flex', gap: 16 }}>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>Tender #</label>
          <input placeholder="Search Tender..." value={filterTender} onChange={e => setFilterTender(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13 }} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>Supplier Name</label>
          <input placeholder="Search Supplier..." value={filterSupplier} onChange={e => setFilterSupplier(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13 }} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>Status</label>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13 }}>
            <option>All</option><option>Pending</option><option>Accepted</option><option>Rejected</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              {['Bid #', 'Tender #', 'Supplier', 'Items', 'Unit Price', 'Total Cost', 'Delivery', 'Date', 'Status', 'Actions'].map(col => (
                <th key={col} style={{ padding: '12px 14px', textAlign: col.includes('Price') || col === 'Total Cost' ? 'right' : 'left', color: '#475569', fontWeight: 600, fontSize: 13 }}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((b, i) => {
              const isLowest = i === 0 && b.status === 'Pending';
              const totalCost = b.qty * b.unitPrice;
              return (
                <tr key={b.id} style={{ borderBottom: '1px solid #f1f5f9', background: isLowest ? '#f0fdf4' : 'transparent' }}>
                  <td style={{ padding: '12px 14px', fontWeight: 600, color: '#0f172a' }}>
                    {b.id}
                    {isLowest && <div style={{ fontSize: 10, color: '#16a34a', fontWeight: 'bold' }}>⭐ Lowest Bid</div>}
                  </td>
                  <td style={{ padding: '12px 14px', color: '#0891b2', fontWeight: 500 }}>{b.referenceId}</td>
                  <td style={{ padding: '12px 14px', color: '#0f172a' }}>{b.supplierName}</td>
                  <td style={{ padding: '12px 14px', color: '#475569' }}>{b.item} <br/><span style={{fontSize:11}}>({b.qty} qty)</span></td>
                  <td style={{ padding: '12px 14px', textAlign: 'right', color: '#64748b' }}>${b.unitPrice}</td>
                  <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 'bold', color: isLowest ? '#16a34a' : '#0f172a' }}>${totalCost.toLocaleString()}</td>
                  <td style={{ padding: '12px 14px', color: '#64748b' }}>{b.deliveryTime}</td>
                  <td style={{ padding: '12px 14px', color: '#64748b' }}>{b.dateSubmitted}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: b.status === 'Accepted' ? '#dcfce7' : b.status === 'Rejected' ? '#fee2e2' : '#f1f5f9', color: b.status === 'Accepted' ? '#16a34a' : b.status === 'Rejected' ? '#dc2626' : '#475569' }}>
                      {b.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    {b.status === 'Pending' ? (
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => handleAccept(b.id)} style={{ padding: '6px', background: '#dcfce7', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: 4, cursor: 'pointer' }} title="Accept Bid"><Check size={16} /></button>
                        <button onClick={() => handleReject(b.id)} style={{ padding: '6px', background: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 4, cursor: 'pointer' }} title="Reject Bid"><X size={16} /></button>
                      </div>
                    ) : <span style={{ fontSize: 12, color: '#94a3b8' }}>Processed</span>}
                  </td>
                </tr>
              );
            })}
            {sorted.length === 0 && <tr><td colSpan={10} style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>No bids found.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PurchaseSupplierBids;
