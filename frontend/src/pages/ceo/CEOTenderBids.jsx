import React, { useState } from 'react';
import { submitNotification, receiveNotification, triggerNotification } from '../../utils/ceoNotifications';
import { Award, CheckCircle, XCircle, Download, Eye } from 'lucide-react';

const CEOTenderBids = () => {
  const [tenders, setTenders] = useState([
    { id: 'TN-100', item: 'Amoxicillin 500mg', qty: 5000, closeDate: '2026-06-30', status: 'CLOSED - AWAITING CEO', bidsCount: 3 },
    { id: 'TN-101', item: 'Paracetamol 500mg', qty: 10000, closeDate: '2026-07-15', status: 'OPEN FOR BIDS', bidsCount: 1 },
  ]);

  // Mock bids data for a specific tender, intentionally unordered to test auto-sort
  const [bids] = useState({
    'TN-100': [
      { id: 'BID-02', supplier: 'PharmaPlus', pricePerUnit: 2.50, totalCost: 12500, date: '2026-06-29' },
      { id: 'BID-03', supplier: 'HealthCorp', pricePerUnit: 2.10, totalCost: 10500, date: '2026-06-28' }, // Lowest
      { id: 'BID-01', supplier: 'MediSupplies', pricePerUnit: 2.80, totalCost: 14000, date: '2026-06-25' },
    ]
  });

  const [viewTender, setViewTender] = useState(null);
  const [rejectId, setRejectId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const handleApproveLowest = (tender) => {
    setTenders(tenders.map(t => t.id === tender.id ? { ...t, status: 'AWARDED' } : t));
    submitNotification('Tender Awarded', `Tender ${tender.id} awarded to lowest bidder. Purchase & Finance notified.`);
    setViewTender(null);
  };

  const handleRejectAll = () => {
    if (!rejectReason) return alert('Reason is required');
    setTenders(tenders.map(t => t.id === rejectId ? { ...t, status: 'REJECTED' } : t));
    receiveNotification('Tender Bids Rejected', `All bids for ${rejectId} rejected: ${rejectReason}`);
    setRejectId(null);
    setRejectReason('');
    setViewTender(null);
  };

  const handleExport = () => {
    triggerNotification('Export Started', 'Exporting Tender Bids Report as PDF...');
  };

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Award color="#84cc16"/> TENDER BIDS (M7)
          </h1>
          <p style={{ color: '#64748b', margin: 0 }}>🔗 Review Bids and Award Closed Tenders</p>
        </div>
        <button onClick={handleExport} style={{ padding: '8px 16px', background: 'white', border: '1px solid #cbd5e1', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
          <Download size={16}/> Export Report
        </button>
      </div>

      <div style={{ background: 'white', padding: 16, borderRadius: 8, border: '1px solid #e2e8f0' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ background: '#f8fafc' }}>
            <tr>
              <th style={{ padding: 12 }}>Tender Number</th>
              <th style={{ padding: 12 }}>Item Description</th>
              <th style={{ padding: 12 }}>Qty Required</th>
              <th style={{ padding: 12 }}>Closing Date</th>
              <th style={{ padding: 12 }}>Bids Received</th>
              <th style={{ padding: 12 }}>Status</th>
              <th style={{ padding: 12 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {tenders.map(t => (
              <tr key={t.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: 12, fontWeight: 'bold' }}>{t.id}</td>
                <td style={{ padding: 12 }}>{t.item}</td>
                <td style={{ padding: 12, fontWeight: 'bold' }}>{t.qty}</td>
                <td style={{ padding: 12 }}>{t.closeDate}</td>
                <td style={{ padding: 12 }}><span style={{ background: '#e2e8f0', padding: '2px 8px', borderRadius: 12, fontWeight: 'bold' }}>{t.bidsCount}</span></td>
                <td style={{ padding: 12 }}>
                  <span style={{ padding: '4px 8px', borderRadius: 4, fontSize: 12, fontWeight: 'bold', background: t.status === 'AWARDED' ? '#dcfce7' : t.status === 'REJECTED' ? '#fee2e2' : t.status === 'CLOSED - AWAITING CEO' ? '#fef3c7' : '#e0e7ff', color: t.status === 'AWARDED' ? '#166534' : t.status === 'REJECTED' ? '#991b1b' : t.status === 'CLOSED - AWAITING CEO' ? '#b45309' : '#4338ca' }}>
                    {t.status}
                  </span>
                </td>
                <td style={{ padding: 12 }}>
                  <button onClick={() => setViewTender(t)} style={{ background: '#0f172a', color: 'white', border: 'none', padding: '6px 12px', borderRadius: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Eye size={14}/> View Bids
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* TENDER BIDS MODAL */}
      {viewTender && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: 'white', padding: 24, borderRadius: 12, width: 800, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ margin: 0 }}>Review Tender: {viewTender.id}</h2>
              <button onClick={() => setViewTender(null)} style={{ background: 'transparent', border: 'none', fontSize: 24, cursor: 'pointer' }}>&times;</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24, padding: 16, background: '#f8fafc', borderRadius: 8 }}>
              <div><strong>Item Description:</strong> {viewTender.item}</div>
              <div><strong>Quantity Required:</strong> {viewTender.qty}</div>
              <div><strong>Closing Date:</strong> {viewTender.closeDate}</div>
              <div><strong>Status:</strong> {viewTender.status}</div>
              <div style={{ gridColumn: '1 / -1' }}><strong>Terms:</strong> Standard 30-day delivery terms apply. Must meet ISO medical standards.</div>
            </div>

            <h3 style={{ borderBottom: '2px solid #e2e8f0', paddingBottom: 8, marginBottom: 16 }}>Submitted Bids (Auto-Sorted by Lowest Cost)</h3>
            
            {bids[viewTender.id] ? (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', marginBottom: 24 }}>
                <thead style={{ background: '#f8fafc' }}>
                  <tr>
                    <th style={{ padding: 12 }}>Rank</th>
                    <th style={{ padding: 12 }}>Supplier</th>
                    <th style={{ padding: 12 }}>Date Submitted</th>
                    <th style={{ padding: 12 }}>Price/Unit</th>
                    <th style={{ padding: 12 }}>Total Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {[...bids[viewTender.id]].sort((a, b) => a.totalCost - b.totalCost).map((bid, index) => (
                    <tr key={bid.id} style={{ borderBottom: '1px solid #f1f5f9', background: index === 0 ? '#f0fdf4' : 'transparent' }}>
                      <td style={{ padding: 12 }}>
                        {index === 0 ? (
                          <span style={{ background: '#22c55e', color: 'white', padding: '4px 8px', borderRadius: 12, fontSize: 12, fontWeight: 'bold' }}>1️⃣ LOWEST COST ✅</span>
                        ) : (
                          <span style={{ padding: '4px 8px', color: '#64748b', fontWeight: 'bold' }}>#{index + 1}</span>
                        )}
                      </td>
                      <td style={{ padding: 12, fontWeight: index === 0 ? 'bold' : 'normal', color: index === 0 ? '#166534' : 'inherit' }}>{bid.supplier}</td>
                      <td style={{ padding: 12 }}>{bid.date}</td>
                      <td style={{ padding: 12 }}>${bid.pricePerUnit.toFixed(2)}</td>
                      <td style={{ padding: 12, fontWeight: 'bold', color: index === 0 ? '#166534' : 'inherit', fontSize: index === 0 ? 16 : 14 }}>${bid.totalCost.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={{ padding: 24, textAlign: 'center', color: '#64748b', background: '#f8fafc', borderRadius: 8, marginBottom: 24 }}>
                No bids received for this tender yet.
              </div>
            )}

            {viewTender.status === 'CLOSED - AWAITING CEO' && bids[viewTender.id] && (
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', borderTop: '1px solid #e2e8f0', paddingTop: 24 }}>
                <button onClick={() => setRejectId(viewTender.id)} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '10px 20px', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 'bold' }}>
                  <XCircle size={16}/> REJECT ALL BIDS
                </button>
                <button onClick={() => handleApproveLowest(viewTender)} style={{ background: '#22c55e', color: 'white', border: 'none', padding: '10px 20px', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 'bold' }}>
                  <CheckCircle size={16}/> APPROVE LOWEST BID
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* REJECT MODAL */}
      {rejectId && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60 }}>
          <div style={{ background: 'white', padding: 24, borderRadius: 8, width: 400 }}>
            <h3>Reject All Bids</h3>
            <textarea placeholder="Enter rejection reason (required)..." value={rejectReason} onChange={e => setRejectReason(e.target.value)} style={{ width: '100%', height: 100, padding: 8, marginBottom: 16, border: '1px solid #cbd5e1', borderRadius: 4 }}></textarea>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button onClick={() => setRejectId(null)} style={{ padding: '8px 16px', background: '#f1f5f9', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleRejectAll} style={{ padding: '8px 16px', background: '#ef4444', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Confirm Reject</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CEOTenderBids;
