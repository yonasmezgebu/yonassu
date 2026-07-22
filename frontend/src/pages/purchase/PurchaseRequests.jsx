import React, { useState } from 'react';
import { FileText, Download, CheckCircle, XCircle, Clock, ShoppingCart, RotateCcw } from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { mockInventoryState } from '../../utils/storeTransactionService';
import { createTenderFromRequest, createRFQFromRequest } from '../../utils/purchaseTransactionService';
import { submitNotification } from '../../utils/pharmacyNotifications';

const statusBadge = {
  'Approved': { bg: '#dcfce7', color: '#166534' },
  'Pending': { bg: '#fef3c7', color: '#92400e' },
  'Hold': { bg: '#f1f5f9', color: '#475569' },
  'Rejected': { bg: '#fee2e2', color: '#991b1b' },
  'Tender Created': { bg: '#cffafe', color: '#164e63' },
  'RFQ Created': { bg: '#e0e7ff', color: '#3730a3' }
};

const PurchaseRequests = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const presetStatus = searchParams.get('status') || 'All';
  const [requests, setRequests] = useState([...mockInventoryState.m20Requisitions]);
  const [filterDept, setFilterDept] = useState('All');
  const [filterStatus, setFilterStatus] = useState(presetStatus);

  // Add dummy data for visual completeness since mockInventoryState was basic
  const enhancedRequests = requests.map((r, i) => ({
    ...r,
    department: r.department || (i % 2 === 0 ? 'Pharmacy' : 'Store'),
    item: r.item || 'Various Medical Supplies',
    qty: r.qty || (i * 10 + 50),
    requestedBy: r.requestedBy || 'Abebe Kebede',
    date: r.date || '2026-06-25',
    priority: r.priority || (i === 0 ? 'Urgent' : 'Normal')
  }));

  const handleAction = (reqId, actionType, req) => {
    let newStatus = '';
    try {
      if (actionType === 'Tender') {
        createTenderFromRequest(req);
        newStatus = 'Tender Created';
      } else if (actionType === 'RFQ') {
        createRFQFromRequest(req);
        newStatus = 'RFQ Created';
      } else if (actionType === 'Hold') {
        newStatus = 'Hold';
        submitNotification('⏸ Request put on Hold', '⏸ M20 Request Status Updated', 'info.mp3');
      } else if (actionType === 'Reject') {
        const reason = prompt('Enter rejection reason:');
        if (!reason) return;
        newStatus = 'Rejected';
        submitNotification('❌ Request Rejected', '❌ M20 Request Rejected', 'info.mp3');
      }
      
      const idx = mockInventoryState.m20Requisitions.findIndex(r => r.id === reqId);
      if (idx > -1) mockInventoryState.m20Requisitions[idx].status = newStatus;
      setRequests([...mockInventoryState.m20Requisitions]);
    } catch (e) { alert(e.message); }
  };

  const filtered = enhancedRequests.filter(r => 
    (filterDept === 'All' || r.department === filterDept) &&
    (filterStatus === 'All' || r.status.includes(filterStatus))
  );

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: '#3b82f6' }}>
            <FileText color="#3b82f6" size={28} /> PURCHASE REQUESTS (M20)
          </h1>
          <p style={{ color: '#64748b', margin: '4px 0 0' }}>Process requisitions from Pharmacy, Store, and other departments.</p>
          <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
            <button onClick={() => navigate('/purchase/requests')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: 13, transition: '0.2s' }}>
              <FileText size={16} /> Purchase Request
            </button>
            <button onClick={() => navigate('/purchase/orders')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: '#8b5cf6', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: 13, transition: '0.2s' }}>
              <ShoppingCart size={16} /> Purchase Order
            </button>
            <button onClick={() => navigate('/purchase/returns')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: '#ea580c', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: 13, transition: '0.2s' }}>
              <RotateCcw size={16} /> Purchase Return
            </button>
          </div>
        </div>
        <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', background: 'white', border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer', color: '#475569', fontWeight: 600 }}>
          <Download size={16} /> Export
        </button>
      </div>

      {/* Filters */}
      <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', padding: 16, marginBottom: 16, display: 'flex', gap: 16 }}>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>Department</label>
          <select value={filterDept} onChange={e => setFilterDept(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13 }}>
            <option>All</option><option>Pharmacy</option><option>Store</option><option>Printing</option>
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>Status</label>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13 }}>
            <option>All</option><option>Approved</option><option>Pending</option><option>Hold</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              {['Request #', 'Department', 'Items Requested', 'Qty', 'Requested By', 'Date', 'Priority', 'Status', 'Actions'].map(col => (
                <th key={col} style={{ padding: '12px 14px', textAlign: col === 'Qty' ? 'right' : 'left', color: '#475569', fontWeight: 600, fontSize: 13 }}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(r => (
              <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '12px 14px', fontWeight: 600, color: '#0f172a' }}>{r.id}</td>
                <td style={{ padding: '12px 14px', color: '#64748b' }}>{r.department}</td>
                <td style={{ padding: '12px 14px', color: '#0f172a', fontWeight: 500 }}>{r.item}</td>
                <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 'bold' }}>{r.qty}</td>
                <td style={{ padding: '12px 14px', color: '#64748b' }}>{r.requestedBy}</td>
                <td style={{ padding: '12px 14px', color: '#64748b' }}>{r.date}</td>
                <td style={{ padding: '12px 14px' }}>
                  <span style={{ padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 700, color: r.priority === 'Urgent' ? '#ef4444' : '#64748b', background: r.priority === 'Urgent' ? '#fef2f2' : '#f1f5f9' }}>{r.priority}</span>
                </td>
                <td style={{ padding: '12px 14px' }}>
                  <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: statusBadge[r.status]?.bg || '#f1f5f9', color: statusBadge[r.status]?.color || '#475569' }}>
                    {r.status}
                  </span>
                </td>
                <td style={{ padding: '12px 14px' }}>
                  {(r.status === 'Approved' || r.status === 'Pending') ? (
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => handleAction(r.id, 'Tender', r)} style={{ padding: '4px 8px', fontSize: 11, background: '#0891b2', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 600 }}>Create Tender</button>
                      <button onClick={() => handleAction(r.id, 'RFQ', r)} style={{ padding: '4px 8px', fontSize: 11, background: '#22c55e', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 600 }}>Create RFQ</button>
                      <button onClick={() => handleAction(r.id, 'Hold', r)} style={{ padding: '4px 8px', fontSize: 11, background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', borderRadius: 4, cursor: 'pointer', fontWeight: 600 }}>Hold</button>
                      <button onClick={() => handleAction(r.id, 'Reject', r)} style={{ padding: '4px 8px', fontSize: 11, background: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 4, cursor: 'pointer', fontWeight: 600 }}>Reject</button>
                    </div>
                  ) : (
                    <span style={{ fontSize: 12, color: '#94a3b8' }}>Processed</span>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={9} style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>No purchase requests found.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PurchaseRequests;
