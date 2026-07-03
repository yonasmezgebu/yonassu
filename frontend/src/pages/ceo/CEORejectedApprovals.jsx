import React, { useState, useEffect } from 'react';
import { receiveNotification, triggerNotification } from '../../utils/ceoNotifications';
import { XCircle, Download, FileText, Filter } from 'lucide-react';

const CEORejectedApprovals = () => {
  const [rejectedItems] = useState([
    { id: 'M9-770', type: 'Fund Request', dept: 'Finance', date: '2026-06-18', rejectedBy: 'CEO', reason: 'Budget limit exceeded for Q2', description: 'Advance payment for new software' },
    { id: 'PO-440', type: 'Purchase Order', dept: 'Purchase', date: '2026-06-21', rejectedBy: 'CEO', reason: 'Found cheaper alternative supplier', description: 'Office chairs and desks' },
    { id: 'F3-110', type: 'New Drug Request', dept: 'Pharmacy', date: '2026-06-24', rejectedBy: 'Pharmacy Head', reason: 'Drug not approved by local authorities', description: 'Requested experimental painkiller' },
  ]);

  const [filterDept, setFilterDept] = useState('All');
  const [filterType, setFilterType] = useState('All');
  const [viewDoc, setViewDoc] = useState(null);

  useEffect(() => {
    receiveNotification('Rejected Items', `❌ ${rejectedItems.length} Items Rejected This Week - Review Reasons`);
    // eslint-disable-next-line
  }, []);

  const handleExport = () => {
    triggerNotification('Export Started', 'Exporting rejected items list as PDF...');
  };

  const types = ['Pharmacy Request', 'Drug Procurement', 'New Drug Request', 'Tender Bid', 'Fund Request', 'Purchase Order', 'Sales Report', 'Leave Request'];

  const filteredItems = rejectedItems
    .filter(i => filterDept === 'All' || i.dept === filterDept)
    .filter(i => filterType === 'All' || i.type === filterType);

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <XCircle color="#ef4444" size={28}/> REJECTED ITEMS
          </h1>
          <p style={{ color: '#64748b', margin: 0 }}>Review historically rejected requests and reasons</p>
        </div>
        <button onClick={handleExport} style={{ padding: '8px 16px', background: 'white', border: '1px solid #cbd5e1', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
          <Download size={16}/> Export List
        </button>
      </div>

      {/* FILTERS */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24, background: 'white', padding: 16, borderRadius: 8, border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Filter size={16} color="#64748b"/> <span style={{ fontWeight: 'bold', fontSize: 14 }}>Filters:</span>
        </div>
        <select value={filterDept} onChange={e => setFilterDept(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6 }}>
          <option value="All">All Departments</option>
          <option value="Pharmacy">Pharmacy</option>
          <option value="Finance">Finance</option>
          <option value="Purchase">Purchase</option>
        </select>
        <select value={filterType} onChange={e => setFilterType(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6 }}>
          <option value="All">All Types</option>
          {types.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {/* MAIN TABLE */}
      <div style={{ background: 'white', padding: 16, borderRadius: 8, border: '1px solid #e2e8f0' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ background: '#f8fafc' }}>
            <tr>
              <th style={{ padding: 12 }}>ID</th>
              <th style={{ padding: 12 }}>Type</th>
              <th style={{ padding: 12 }}>Department</th>
              <th style={{ padding: 12 }}>Description</th>
              <th style={{ padding: 12 }}>Rejected Date</th>
              <th style={{ padding: 12 }}>Rejected By</th>
              <th style={{ padding: 12 }}>Reason</th>
              <th style={{ padding: 12 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map(item => (
              <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: 12, fontWeight: 'bold', color: '#991b1b' }}>{item.id}</td>
                <td style={{ padding: 12 }}>{item.type}</td>
                <td style={{ padding: 12 }}>{item.dept}</td>
                <td style={{ padding: 12, color: '#475569', fontSize: 13 }}>{item.description}</td>
                <td style={{ padding: 12 }}>{item.date}</td>
                <td style={{ padding: 12, fontWeight: 'bold' }}>{item.rejectedBy}</td>
                <td style={{ padding: 12, color: '#ef4444' }}>{item.reason}</td>
                <td style={{ padding: 12 }}>
                  <button onClick={() => setViewDoc(item)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: 4, cursor: 'pointer', fontSize: 13 }}>
                    <FileText size={14}/> View Doc
                  </button>
                </td>
              </tr>
            ))}
            {filteredItems.length === 0 && (
              <tr>
                <td colSpan="8" style={{ padding: 24, textAlign: 'center', color: '#64748b' }}>No rejected items found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* DOCUMENT MODAL */}
      {viewDoc && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60 }}>
          <div style={{ background: 'white', padding: 24, borderRadius: 8, width: 600 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: 16, marginBottom: 16 }}>
              <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}><FileText/> Rejected Document: {viewDoc.id}</h2>
              <button onClick={() => setViewDoc(null)} style={{ background: 'transparent', border: 'none', fontSize: 24, cursor: 'pointer' }}>&times;</button>
            </div>
            
            <div style={{ background: '#f8fafc', padding: 16, borderRadius: 8, border: '1px dashed #cbd5e1', marginBottom: 24 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div><strong>Type:</strong> {viewDoc.type}</div>
                <div><strong>Department:</strong> {viewDoc.dept}</div>
                <div><strong>Rejected Date:</strong> {viewDoc.date}</div>
                <div><strong>Rejected By:</strong> {viewDoc.rejectedBy}</div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <strong>Description:</strong><br/>
                {viewDoc.description}
              </div>
              <div style={{ padding: 16, background: '#fee2e2', color: '#991b1b', border: '1px solid #f87171', borderRadius: 8 }}>
                <strong>Rejection Reason:</strong><br/>
                {viewDoc.reason}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setViewDoc(null)} style={{ padding: '8px 24px', background: '#0f172a', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CEORejectedApprovals;
