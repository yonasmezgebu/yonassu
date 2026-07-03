import React, { useState, useEffect } from 'react';
import { submitNotification, receiveNotification, triggerNotification } from '../../utils/ceoNotifications';
import { Clock, Download, CheckCircle, XCircle, PauseCircle, Filter } from 'lucide-react';

const CEOPendingApprovals = () => {
  const [pendingItems, setPendingItems] = useState([
    { id: 'M20-881', type: 'Pharmacy Request', dept: 'Pharmacy', date: '2026-06-25', days: 5, priority: 'High', description: 'Monthly stock refill for Branch A' },
    { id: 'PR-902', type: 'Drug Procurement', dept: 'Store', date: '2026-06-27', days: 3, priority: 'Normal', description: 'Paracetamol batch restock' },
    { id: 'F3-112', type: 'New Drug Request', dept: 'Pharmacy', date: '2026-06-29', days: 1, priority: 'High', description: 'Urgent requested antibiotic XYZ' },
    { id: 'TN-100', type: 'Tender Bid', dept: 'Procurement', date: '2026-06-20', days: 10, priority: 'Normal', description: 'Office Equipment supply contract' },
    { id: 'M9-775', type: 'Fund Request', dept: 'Finance', date: '2026-06-28', days: 2, priority: 'High', description: 'Advance payment for Tender TN-100' },
    { id: 'PO-442', type: 'Purchase Order', dept: 'Purchase', date: '2026-06-29', days: 1, priority: 'Normal', description: 'Printing materials order' },
    { id: 'SL-881', type: 'Sales Report', dept: 'Sales', date: '2026-06-30', days: 0, priority: 'Normal', description: 'Weekly sales audit clearance' },
    { id: 'HR-992', type: 'Leave Request', dept: 'HR', date: '2026-06-24', days: 6, priority: 'Normal', description: 'Annual leave for Dr. Smith' },
  ]);

  const [filterDept, setFilterDept] = useState('All');
  const [filterType, setFilterType] = useState('All');

  useEffect(() => {
    receiveNotification('Pending Approvals', `⏳ ${pendingItems.length} Pending Approvals Awaiting Your Decision`);
    // eslint-disable-next-line
  }, []);

  const handleAction = (id, actionType) => {
    if (actionType === 'APPROVE') {
      submitNotification('Item Approved', `Item ${id} successfully approved.`);
      setPendingItems(prev => prev.filter(item => item.id !== id));
    } else if (actionType === 'REJECT') {
      receiveNotification('Item Rejected', `Item ${id} was rejected.`);
      setPendingItems(prev => prev.filter(item => item.id !== id));
    } else if (actionType === 'WAIT') {
      receiveNotification('Item Put on Hold', `Item ${id} status updated to WAIT.`);
    }
  };

  const handleExport = () => {
    triggerNotification('Export Started', 'Exporting pending approvals list as PDF...');
  };

  const filteredItems = pendingItems
    .filter(i => filterDept === 'All' || i.dept === filterDept)
    .filter(i => filterType === 'All' || i.type === filterType)
    .sort((a, b) => new Date(a.date) - new Date(b.date)); // Default sort Oldest first

  // Quick View Stats
  const getStats = (typeStr) => pendingItems.filter(i => i.type === typeStr);
  const types = ['Pharmacy Request', 'Drug Procurement', 'New Drug Request', 'Tender Bid', 'Fund Request', 'Purchase Order', 'Sales Report', 'Leave Request'];

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Clock color="#f59e0b" size={28}/> PENDING APPROVALS
          </h1>
          <p style={{ color: '#64748b', margin: 0 }}>Review all items awaiting your final decision</p>
        </div>
        <button onClick={handleExport} style={{ padding: '8px 16px', background: 'white', border: '1px solid #cbd5e1', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
          <Download size={16}/> Export List
        </button>
      </div>

      {/* QUICK VIEW SUB-TABLE */}
      <div style={{ background: 'white', padding: 16, borderRadius: 8, border: '1px solid #e2e8f0', marginBottom: 24 }}>
        <h3 style={{ margin: '0 0 12px 0', fontSize: 16 }}>Quick View: Pending Approvals Overview</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {types.map(t => {
            const items = getStats(t);
            const oldest = items.length > 0 ? items.sort((a, b) => new Date(a.date) - new Date(b.date))[0].date : 'N/A';
            return (
              <div key={t} style={{ padding: 12, border: '1px solid #e2e8f0', borderRadius: 6, background: '#f8fafc' }}>
                <div style={{ fontSize: 12, color: '#64748b', fontWeight: 'bold' }}>{t}</div>
                <div style={{ fontSize: 20, fontWeight: 'bold', color: items.length > 0 ? '#b45309' : '#0f172a' }}>{items.length}</div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>Oldest: {oldest}</div>
              </div>
            );
          })}
        </div>
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
          <option value="Finance">Finance</option>
          <option value="Purchase">Purchase</option>
          <option value="Sales">Sales</option>
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
              <th style={{ padding: 12 }}>Date</th>
              <th style={{ padding: 12 }}>Days Pending</th>
              <th style={{ padding: 12 }}>Priority</th>
              <th style={{ padding: 12 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map(item => (
              <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: 12, fontWeight: 'bold' }}>{item.id}</td>
                <td style={{ padding: 12 }}>{item.type}</td>
                <td style={{ padding: 12 }}>{item.dept}</td>
                <td style={{ padding: 12, color: '#475569', fontSize: 13 }}>{item.description}</td>
                <td style={{ padding: 12 }}>{item.date}</td>
                <td style={{ padding: 12 }}>
                  <span style={{ color: item.days > 5 ? '#ef4444' : '#f59e0b', fontWeight: 'bold' }}>{item.days} days</span>
                </td>
                <td style={{ padding: 12 }}>
                  <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 12, background: item.priority === 'High' ? '#fee2e2' : '#f1f5f9', color: item.priority === 'High' ? '#ef4444' : '#64748b' }}>
                    {item.priority}
                  </span>
                </td>
                <td style={{ padding: 12 }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => handleAction(item.id, 'APPROVE')} style={{ padding: '6px', background: '#dcfce7', color: '#166534', border: 'none', borderRadius: 4, cursor: 'pointer' }} title="Approve">
                      <CheckCircle size={16}/>
                    </button>
                    <button onClick={() => handleAction(item.id, 'WAIT')} style={{ padding: '6px', background: '#fef3c7', color: '#b45309', border: 'none', borderRadius: 4, cursor: 'pointer' }} title="Wait/Hold">
                      <PauseCircle size={16}/>
                    </button>
                    <button onClick={() => handleAction(item.id, 'REJECT')} style={{ padding: '6px', background: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: 4, cursor: 'pointer' }} title="Reject">
                      <XCircle size={16}/>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredItems.length === 0 && (
              <tr>
                <td colSpan="8" style={{ padding: 24, textAlign: 'center', color: '#64748b' }}>No pending approvals found for the selected filters.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CEOPendingApprovals;
