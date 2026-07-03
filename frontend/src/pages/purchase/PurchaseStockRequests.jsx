import React, { useState, useEffect } from 'react';
import { ClipboardList, Download, CheckCircle, XCircle, ShoppingCart } from 'lucide-react';
import { mockInventoryState } from '../../utils/storeTransactionService';
import { playSound } from '../../utils/purchaseSound';

const PurchaseStockRequests = () => {
  const [requests, setRequests] = useState([...mockInventoryState.m20Requisitions]);
  const [filterDept, setFilterDept] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  useEffect(() => {
    playSound('info');
  }, []);

  const handleApprove = (id) => {
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'Approved' } : r));
    playSound('success');
  };

  const handleReject = (id) => {
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'Rejected' } : r));
    playSound('success');
  };

  const handleConvertToPO = (id) => {
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'PO Created' } : r));
    playSound('success');
  };

  const filtered = requests.filter(r => 
    (filterDept === 'All' || r.department === filterDept) &&
    (filterStatus === 'All' || r.status === filterStatus)
  );

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: '#0f172a' }}>
            <ClipboardList color="#3b82f6" size={28} /> STOCK REQUESTS
          </h1>
          <p style={{ color: '#64748b', margin: '4px 0 0' }}>Internal requests for stock replenishment.</p>
        </div>
      </div>

      <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', padding: 16, marginBottom: 16, display: 'flex', gap: 16 }}>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>Department</label>
          <select value={filterDept} onChange={e => setFilterDept(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13 }}>
            <option>All</option>
            <option>Pharmacy</option>
            <option>Laboratory</option>
            <option>Ward A</option>
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>Status</label>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13 }}>
            <option>All</option>
            <option>Pending</option>
            <option>Approved</option>
            <option>Rejected</option>
            <option>PO Created</option>
          </select>
        </div>
      </div>

      <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              {['Request #', 'Item', 'Quantity', 'Requested By', 'Department', 'Status', 'Actions'].map(col => (
                <th key={col} style={{ padding: '12px 14px', textAlign: 'left', color: '#475569', fontWeight: 600, fontSize: 13 }}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(r => (
              <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '12px 14px', fontWeight: 600, color: '#0f172a' }}>{r.id}</td>
                <td style={{ padding: '12px 14px', color: '#0f172a' }}>{r.items?.[0]?.name || 'Various Items'}</td>
                <td style={{ padding: '12px 14px', color: '#475569' }}>{r.items?.[0]?.qty || '-'}</td>
                <td style={{ padding: '12px 14px', color: '#475569' }}>{r.requestedBy}</td>
                <td style={{ padding: '12px 14px', color: '#475569' }}>{r.department}</td>
                <td style={{ padding: '12px 14px' }}>
                  <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: r.status === 'Approved' ? '#dcfce7' : r.status === 'Rejected' ? '#fee2e2' : r.status === 'PO Created' ? '#ede9fe' : '#fef3c7', color: r.status === 'Approved' ? '#16a34a' : r.status === 'Rejected' ? '#dc2626' : r.status === 'PO Created' ? '#7c3aed' : '#d97706' }}>
                    {r.status}
                  </span>
                </td>
                <td style={{ padding: '12px 14px' }}>
                  {r.status === 'Pending' && (
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => handleApprove(r.id)} style={{ padding: '4px 8px', background: '#dcfce7', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}><CheckCircle size={14} /> Approve</button>
                      <button onClick={() => handleReject(r.id)} style={{ padding: '4px 8px', background: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}><XCircle size={14} /> Reject</button>
                    </div>
                  )}
                  {r.status === 'Approved' && (
                    <button onClick={() => handleConvertToPO(r.id)} style={{ padding: '4px 8px', background: '#ede9fe', color: '#7c3aed', border: '1px solid #ddd6fe', borderRadius: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}><ShoppingCart size={14} /> Convert to PO</button>
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

export default PurchaseStockRequests;
