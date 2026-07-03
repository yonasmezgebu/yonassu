import React, { useState } from 'react';
import { submitNotification, receiveNotification, triggerNotification } from '../../utils/ceoNotifications';
import { Award, CheckCircle, XCircle, Clock, Download, Eye, Plus, Users, FileText } from 'lucide-react';

const CEOTenderFull = () => {
  const [activeTab, setActiveTab] = useState('All Tenders');

  const [tenders, setTenders] = useState([
    {
      id: 'TN-100', item: 'Amoxicillin 500mg', dept: 'Pharmacy', qty: 5000, openDate: '2026-06-01', closeDate: '2026-06-30',
      status: 'CLOSED - AWAITING CEO', bidsCount: 3, type: 'Drug Procurement'
    },
    {
      id: 'TN-101', item: 'Paracetamol 500mg', dept: 'Pharmacy', qty: 10000, openDate: '2026-06-15', closeDate: '2026-07-15',
      status: 'OPEN FOR BIDS', bidsCount: 1, type: 'Drug Procurement'
    },
    {
      id: 'TN-102', item: 'Office Equipment', dept: 'Finance', qty: 10, openDate: '2026-05-01', closeDate: '2026-06-01',
      status: 'AWARDED', bidsCount: 5, type: 'Equipment'
    },
    {
      id: 'TN-103', item: 'Agricultural Machinery', dept: 'Agri Rental', qty: 3, openDate: '2026-07-01', closeDate: '2026-07-31',
      status: 'OPEN FOR BIDS', bidsCount: 0, type: 'Equipment'
    },
  ]);

  const [bids] = useState({
    'TN-100': [
      { id: 'BID-02', supplier: 'PharmaPlus', pricePerUnit: 2.50, totalCost: 12500, date: '2026-06-29', docs: 'Quote_PharmaPlus.pdf' },
      { id: 'BID-03', supplier: 'HealthCorp', pricePerUnit: 2.10, totalCost: 10500, date: '2026-06-28', docs: 'Quote_HealthCorp.pdf' },
      { id: 'BID-01', supplier: 'MediSupplies', pricePerUnit: 2.80, totalCost: 14000, date: '2026-06-25', docs: 'Quote_MediSupplies.pdf' },
    ],
    'TN-102': [
      { id: 'BID-10', supplier: 'TechOffice', pricePerUnit: 800, totalCost: 8000, date: '2026-05-20', docs: 'Quote_TechOffice.pdf' },
      { id: 'BID-11', supplier: 'EquipMart', pricePerUnit: 750, totalCost: 7500, date: '2026-05-22', docs: 'Quote_EquipMart.pdf' },
    ]
  });

  const [viewTender, setViewTender] = useState(null);
  const [rejectId, setRejectId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [newTender, setNewTender] = useState({
    item: '', dept: 'Pharmacy', qty: '', openDate: '', closeDate: '', type: 'Drug Procurement', terms: ''
  });

  const handleApproveLowest = (tender) => {
    setTenders(tenders.map(t => t.id === tender.id ? { ...t, status: 'AWARDED' } : t));
    const lowest = [...bids[tender.id]].sort((a, b) => a.totalCost - b.totalCost)[0];
    submitNotification('Tender Awarded', `Tender ${tender.id} awarded to ${lowest.supplier} (lowest bid: $${lowest.totalCost.toLocaleString()}). M9 Fund Request generated. Finance notified.`);
    setViewTender(null);
  };

  const handleRejectAll = () => {
    if (!rejectReason) return alert('Reason is required');
    setTenders(tenders.map(t => t.id === rejectId ? { ...t, status: 'REJECTED' } : t));
    receiveNotification('Tender Bids Rejected', `All bids for Tender ${rejectId} rejected: ${rejectReason}. Re-tendering may be required.`);
    setRejectId(null);
    setRejectReason('');
    setViewTender(null);
  };

  const handleCreateTender = () => {
    if (!newTender.item || !newTender.qty || !newTender.openDate || !newTender.closeDate) return alert('All required fields must be filled.');
    const id = `TN-${Math.floor(Math.random() * 900) + 200}`;
    setTenders([...tenders, {
      id, item: newTender.item, dept: newTender.dept, qty: parseInt(newTender.qty),
      openDate: newTender.openDate, closeDate: newTender.closeDate, status: 'OPEN FOR BIDS', bidsCount: 0, type: newTender.type
    }]);
    submitNotification('Tender Published', `Tender ${id} for "${newTender.item}" published. Suppliers can now submit bids.`);
    setNewTender({ item: '', dept: 'Pharmacy', qty: '', openDate: '', closeDate: '', type: 'Drug Procurement', terms: '' });
    setShowCreateModal(false);
  };

  const handleExport = () => {
    triggerNotification('Export Started', `Exporting Complete Tender Register as PDF...`);
  };

  const filteredTenders = activeTab === 'All Tenders' ? tenders
    : activeTab === 'Open' ? tenders.filter(t => t.status === 'OPEN FOR BIDS')
    : activeTab === 'Awaiting CEO' ? tenders.filter(t => t.status.includes('AWAITING'))
    : activeTab === 'Awarded' ? tenders.filter(t => t.status === 'AWARDED')
    : tenders.filter(t => t.status === 'REJECTED');

  const getStatusStyle = (status) => {
    if (status === 'AWARDED') return { bg: '#dcfce7', col: '#166534' };
    if (status === 'REJECTED') return { bg: '#fee2e2', col: '#991b1b' };
    if (status.includes('AWAITING')) return { bg: '#fef3c7', col: '#b45309' };
    return { bg: '#e0e7ff', col: '#4338ca' };
  };

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Award color="#f59e0b" size={28}/> TENDER MANAGEMENT (Full)
          </h1>
          <p style={{ color: '#64748b', margin: 0 }}>🔗 Complete Tender Lifecycle — Open, Review Bids, Award &amp; Track</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={handleExport} style={{ padding: '8px 16px', background: 'white', border: '1px solid #cbd5e1', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <Download size={16}/> Export
          </button>
          <button onClick={() => setShowCreateModal(true)} style={{ padding: '8px 16px', background: '#0f172a', color: 'white', border: 'none', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <Plus size={16}/> Create Tender
          </button>
        </div>
      </div>

      {/* SUMMARY CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        <div style={{ background: 'white', padding: 16, borderRadius: 8, border: '1px solid #e2e8f0', cursor: 'pointer' }} onClick={() => setActiveTab('All Tenders')}>
          <div style={{ fontSize: 13, color: '#64748b', fontWeight: 'bold' }}>Total Tenders</div>
          <div style={{ fontSize: 28, fontWeight: 'bold', color: '#0f172a' }}>{tenders.length}</div>
        </div>
        <div style={{ background: '#e0e7ff', padding: 16, borderRadius: 8, border: '1px solid #c7d2fe', cursor: 'pointer' }} onClick={() => setActiveTab('Open')}>
          <div style={{ fontSize: 13, color: '#3730a3', fontWeight: 'bold' }}>Open for Bids</div>
          <div style={{ fontSize: 28, fontWeight: 'bold', color: '#4338ca' }}>{tenders.filter(t => t.status === 'OPEN FOR BIDS').length}</div>
        </div>
        <div style={{ background: '#fef9c3', padding: 16, borderRadius: 8, border: '1px solid #fef08a', cursor: 'pointer' }} onClick={() => setActiveTab('Awaiting CEO')}>
          <div style={{ fontSize: 13, color: '#854d0e', fontWeight: 'bold' }}>Awaiting Your Decision</div>
          <div style={{ fontSize: 28, fontWeight: 'bold', color: '#ca8a04' }}>{tenders.filter(t => t.status.includes('AWAITING')).length}</div>
        </div>
        <div style={{ background: '#dcfce7', padding: 16, borderRadius: 8, border: '1px solid #bbf7d0', cursor: 'pointer' }} onClick={() => setActiveTab('Awarded')}>
          <div style={{ fontSize: 13, color: '#166534', fontWeight: 'bold' }}>Awarded</div>
          <div style={{ fontSize: 28, fontWeight: 'bold', color: '#15803d' }}>{tenders.filter(t => t.status === 'AWARDED').length}</div>
        </div>
      </div>

      {/* FILTER TABS */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {['All Tenders', 'Open', 'Awaiting CEO', 'Awarded', 'Rejected'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{ padding: '10px 16px', borderRadius: 6, border: activeTab === tab ? 'none' : '1px solid #e2e8f0', background: activeTab === tab ? '#0f172a' : 'white', color: activeTab === tab ? 'white' : '#64748b', cursor: 'pointer', fontWeight: 'bold', fontSize: 13 }}>
            {tab}
          </button>
        ))}
      </div>

      {/* TENDERS TABLE */}
      <div style={{ background: 'white', padding: 16, borderRadius: 8, border: '1px solid #e2e8f0' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ background: '#f8fafc' }}>
            <tr>
              <th style={{ padding: 12 }}>Tender No.</th>
              <th style={{ padding: 12 }}>Item / Description</th>
              <th style={{ padding: 12 }}>Dept</th>
              <th style={{ padding: 12 }}>Type</th>
              <th style={{ padding: 12 }}>Qty</th>
              <th style={{ padding: 12 }}>Open / Close Date</th>
              <th style={{ padding: 12 }}>Bids</th>
              <th style={{ padding: 12 }}>Status</th>
              <th style={{ padding: 12 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredTenders.map(t => (
              <tr key={t.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: 12, fontWeight: 'bold' }}>{t.id}</td>
                <td style={{ padding: 12 }}>{t.item}</td>
                <td style={{ padding: 12 }}>{t.dept}</td>
                <td style={{ padding: 12 }}><span style={{ background: '#f1f5f9', padding: '2px 8px', borderRadius: 4, fontSize: 12 }}>{t.type}</span></td>
                <td style={{ padding: 12, fontWeight: 'bold' }}>{t.qty}</td>
                <td style={{ padding: 12, fontSize: 12 }}>{t.openDate} → {t.closeDate}</td>
                <td style={{ padding: 12 }}><span style={{ background: '#e2e8f0', padding: '2px 8px', borderRadius: 12, fontWeight: 'bold' }}>{t.bidsCount}</span></td>
                <td style={{ padding: 12 }}>
                  <span style={{ padding: '4px 8px', borderRadius: 4, fontSize: 12, fontWeight: 'bold', background: getStatusStyle(t.status).bg, color: getStatusStyle(t.status).col }}>
                    {t.status}
                  </span>
                </td>
                <td style={{ padding: 12 }}>
                  <button onClick={() => setViewTender(t)} style={{ background: '#0f172a', color: 'white', border: 'none', padding: '6px 12px', borderRadius: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}>
                    <Eye size={14}/> {bids[t.id] ? 'Review Bids' : 'View Details'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* TENDER DETAIL + BIDS MODAL */}
      {viewTender && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: 'white', padding: 24, borderRadius: 12, width: 900, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
                Tender: {viewTender.id}
                <span style={{ padding: '4px 8px', borderRadius: 4, fontSize: 14, fontWeight: 'bold', background: getStatusStyle(viewTender.status).bg, color: getStatusStyle(viewTender.status).col }}>{viewTender.status}</span>
              </h2>
              <button onClick={() => setViewTender(null)} style={{ background: 'transparent', border: 'none', fontSize: 24, cursor: 'pointer' }}>&times;</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24, padding: 16, background: '#f8fafc', borderRadius: 8 }}>
              <div><strong>Item:</strong> {viewTender.item}</div>
              <div><strong>Department:</strong> {viewTender.dept}</div>
              <div><strong>Quantity:</strong> {viewTender.qty}</div>
              <div><strong>Type:</strong> {viewTender.type}</div>
              <div><strong>Open Date:</strong> {viewTender.openDate}</div>
              <div><strong>Close Date:</strong> {viewTender.closeDate}</div>
            </div>

            {bids[viewTender.id] ? (
              <>
                <h3 style={{ borderBottom: '2px solid #e2e8f0', paddingBottom: 8, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Users size={18}/> Submitted Bids (Auto-Sorted by Lowest Total Cost)
                </h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', marginBottom: 24 }}>
                  <thead style={{ background: '#f8fafc' }}>
                    <tr>
                      <th style={{ padding: 12 }}>Rank</th>
                      <th style={{ padding: 12 }}>Supplier Name</th>
                      <th style={{ padding: 12 }}>Date Submitted</th>
                      <th style={{ padding: 12 }}>Price/Unit</th>
                      <th style={{ padding: 12 }}>Total Cost</th>
                      <th style={{ padding: 12 }}>Documents</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...bids[viewTender.id]].sort((a, b) => a.totalCost - b.totalCost).map((bid, index) => (
                      <tr key={bid.id} style={{ borderBottom: '1px solid #f1f5f9', background: index === 0 ? '#f0fdf4' : 'transparent' }}>
                        <td style={{ padding: 12 }}>
                          {index === 0 ? (
                            <span style={{ background: '#22c55e', color: 'white', padding: '4px 8px', borderRadius: 12, fontSize: 12, fontWeight: 'bold' }}>1️⃣ LOWEST ✅</span>
                          ) : (
                            <span style={{ padding: '4px 8px', color: '#64748b', fontWeight: 'bold' }}>#{index + 1}</span>
                          )}
                        </td>
                        <td style={{ padding: 12, fontWeight: index === 0 ? 'bold' : 'normal', color: index === 0 ? '#166534' : 'inherit' }}>{bid.supplier}</td>
                        <td style={{ padding: 12 }}>{bid.date}</td>
                        <td style={{ padding: 12 }}>${bid.pricePerUnit.toFixed(2)}</td>
                        <td style={{ padding: 12, fontWeight: 'bold', fontSize: index === 0 ? 16 : 14, color: index === 0 ? '#166534' : 'inherit' }}>${bid.totalCost.toLocaleString()}</td>
                        <td style={{ padding: 12 }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#3b82f6', cursor: 'pointer', fontSize: 13 }}>
                            <FileText size={14}/> {bid.docs}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            ) : (
              <div style={{ padding: 24, textAlign: 'center', color: '#64748b', background: '#f8fafc', borderRadius: 8, marginBottom: 24 }}>
                No bids received yet for this tender.
              </div>
            )}

            {viewTender.status === 'CLOSED - AWAITING CEO' && bids[viewTender.id] && (
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', borderTop: '1px solid #e2e8f0', paddingTop: 24 }}>
                <button onClick={() => { setRejectId(viewTender.id); }} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '10px 20px', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 'bold' }}>
                  <XCircle size={16}/> REJECT ALL BIDS
                </button>
                <button onClick={() => handleApproveLowest(viewTender)} style={{ background: '#22c55e', color: 'white', border: 'none', padding: '10px 20px', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 'bold' }}>
                  <CheckCircle size={16}/> AWARD TO LOWEST BIDDER
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CREATE TENDER MODAL */}
      {showCreateModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: 'white', padding: 24, borderRadius: 12, width: 600 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ margin: 0 }}>Create New Tender</h2>
              <button onClick={() => setShowCreateModal(false)} style={{ background: 'transparent', border: 'none', fontSize: 24, cursor: 'pointer' }}>&times;</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 'bold', marginBottom: 6 }}>Item Description *</label>
                <input value={newTender.item} onChange={e => setNewTender({...newTender, item: e.target.value})} placeholder="e.g. Amoxicillin 500mg" style={{ width: '100%', padding: 10, border: '1px solid #cbd5e1', borderRadius: 4 }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 'bold', marginBottom: 6 }}>Department</label>
                <select value={newTender.dept} onChange={e => setNewTender({...newTender, dept: e.target.value})} style={{ width: '100%', padding: 10, border: '1px solid #cbd5e1', borderRadius: 4 }}>
                  <option>Pharmacy</option><option>Store</option><option>Finance</option><option>Purchase</option><option>Car Rental</option><option>Agri Rental</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 'bold', marginBottom: 6 }}>Tender Type</label>
                <select value={newTender.type} onChange={e => setNewTender({...newTender, type: e.target.value})} style={{ width: '100%', padding: 10, border: '1px solid #cbd5e1', borderRadius: 4 }}>
                  <option>Drug Procurement</option><option>Equipment</option><option>Services</option><option>Construction</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 'bold', marginBottom: 6 }}>Quantity Required *</label>
                <input type="number" value={newTender.qty} onChange={e => setNewTender({...newTender, qty: e.target.value})} placeholder="e.g. 5000" style={{ width: '100%', padding: 10, border: '1px solid #cbd5e1', borderRadius: 4 }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 'bold', marginBottom: 6 }}>Open Date *</label>
                <input type="date" value={newTender.openDate} onChange={e => setNewTender({...newTender, openDate: e.target.value})} style={{ width: '100%', padding: 10, border: '1px solid #cbd5e1', borderRadius: 4 }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 'bold', marginBottom: 6 }}>Closing Date *</label>
                <input type="date" value={newTender.closeDate} onChange={e => setNewTender({...newTender, closeDate: e.target.value})} style={{ width: '100%', padding: 10, border: '1px solid #cbd5e1', borderRadius: 4 }} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 'bold', marginBottom: 6 }}>Terms & Conditions</label>
                <textarea value={newTender.terms} onChange={e => setNewTender({...newTender, terms: e.target.value})} placeholder="e.g. Standard 30-day delivery, ISO medical standards required..." style={{ width: '100%', height: 80, padding: 10, border: '1px solid #cbd5e1', borderRadius: 4 }}></textarea>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowCreateModal(false)} style={{ padding: '10px 20px', background: '#f1f5f9', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleCreateTender} style={{ padding: '10px 20px', background: '#22c55e', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 'bold' }}>
                <Plus size={16}/> Publish Tender
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REJECT MODAL */}
      {rejectId && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60 }}>
          <div style={{ background: 'white', padding: 24, borderRadius: 8, width: 400 }}>
            <h3>Reject All Bids for {rejectId}</h3>
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

export default CEOTenderFull;
