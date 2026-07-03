import React, { useState, useEffect } from 'react';
import { receiveNotification, triggerNotification } from '../../utils/ceoNotifications';
import { CheckCircle, Download, FileText, Filter } from 'lucide-react';

const CEOApprovedApprovals = () => {
  const [approvedItems] = useState([
    { id: 'M20-880', type: 'Pharmacy Request', dept: 'Pharmacy', date: '2026-06-20', approvedBy: 'CEO', digitalStamp: 'STP-9021', description: 'Emergency fluid bags' },
    { id: 'PR-899', type: 'Drug Procurement', dept: 'Store', date: '2026-06-22', approvedBy: 'CEO', digitalStamp: 'STP-9022', description: 'Syringes bulk order' },
    { id: 'TN-099', type: 'Tender Bid', dept: 'Procurement', date: '2026-06-15', approvedBy: 'CEO', digitalStamp: 'STP-9025', description: 'Ambulance maintenance contract' },
    { id: 'HR-990', type: 'Leave Request', dept: 'HR', date: '2026-06-23', approvedBy: 'HR Manager', digitalStamp: 'STP-9030', description: 'Maternity leave for Nurse Jane' },
  ]);

  const [filterDept, setFilterDept] = useState('All');
  const [filterType, setFilterType] = useState('All');
  const [viewDoc, setViewDoc] = useState(null);

  useEffect(() => {
    receiveNotification('Approved Items', `✅ ${approvedItems.length} Items Approved This Week - Summary Ready`);
    // eslint-disable-next-line
  }, []);

  const handleExport = () => {
    triggerNotification('Export Started', 'Exporting approved list as PDF...');
  };

  const types = ['Pharmacy Request', 'Drug Procurement', 'New Drug Request', 'Tender Bid', 'Fund Request', 'Purchase Order', 'Sales Report', 'Leave Request'];

  const filteredItems = approvedItems
    .filter(i => filterDept === 'All' || i.dept === filterDept)
    .filter(i => filterType === 'All' || i.type === filterType);

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <CheckCircle color="#22c55e" size={28}/> APPROVED ITEMS
          </h1>
          <p style={{ color: '#64748b', margin: 0 }}>Review all historically approved requests and records</p>
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
          <option value="Store">Store</option>
          <option value="Procurement">Procurement</option>
          <option value="HR">HR</option>
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
              <th style={{ padding: 12 }}>Approved Date</th>
              <th style={{ padding: 12 }}>Approved By</th>
              <th style={{ padding: 12 }}>Digital Stamp</th>
              <th style={{ padding: 12 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map(item => (
              <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: 12, fontWeight: 'bold', color: '#166534' }}>{item.id}</td>
                <td style={{ padding: 12 }}>{item.type}</td>
                <td style={{ padding: 12 }}>{item.dept}</td>
                <td style={{ padding: 12, color: '#475569', fontSize: 13 }}>{item.description}</td>
                <td style={{ padding: 12 }}>{item.date}</td>
                <td style={{ padding: 12, fontWeight: 'bold' }}>{item.approvedBy}</td>
                <td style={{ padding: 12 }}>
                  <span style={{ padding: '4px 8px', background: '#e2e8f0', borderRadius: 4, fontFamily: 'monospace', fontSize: 12 }}>{item.digitalStamp}</span>
                </td>
                <td style={{ padding: 12 }}>
                  <button onClick={() => setViewDoc(item)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: 4, cursor: 'pointer', fontSize: 13 }}>
                    <FileText size={14}/> View Doc
                  </button>
                </td>
              </tr>
            ))}
            {filteredItems.length === 0 && (
              <tr>
                <td colSpan="8" style={{ padding: 24, textAlign: 'center', color: '#64748b' }}>No approved items found.</td>
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
              <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}><FileText/> Document Viewer: {viewDoc.id}</h2>
              <button onClick={() => setViewDoc(null)} style={{ background: 'transparent', border: 'none', fontSize: 24, cursor: 'pointer' }}>&times;</button>
            </div>
            
            <div style={{ background: '#f8fafc', padding: 16, borderRadius: 8, border: '1px dashed #cbd5e1', marginBottom: 24 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div><strong>Type:</strong> {viewDoc.type}</div>
                <div><strong>Department:</strong> {viewDoc.dept}</div>
                <div><strong>Approved Date:</strong> {viewDoc.date}</div>
                <div><strong>Approved By:</strong> {viewDoc.approvedBy}</div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <strong>Description:</strong><br/>
                {viewDoc.description}
              </div>
              <div style={{ textAlign: 'center', padding: 16, background: '#dcfce7', color: '#166534', border: '2px solid #22c55e', borderRadius: 8, fontWeight: 'bold', fontSize: 18 }}>
                OFFICIAL DIGITAL STAMP: {viewDoc.digitalStamp}
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

export default CEOApprovedApprovals;
