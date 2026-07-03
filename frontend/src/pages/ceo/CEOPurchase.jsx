import React, { useState } from 'react';
import { submitNotification, receiveNotification, triggerNotification } from '../../utils/ceoNotifications';
import { ShoppingCart, CheckCircle, XCircle, Download, User, ArrowRight } from 'lucide-react';

const CEOPurchase = () => {
  const [requests, setRequests] = useState([
    { id: 'PR-1001', dept: 'Pharmacy', by: 'Pharm Manager', item: 'Amoxicillin 500mg', qty: 1000, amt: 5000, date: '2026-07-01', status: 'PENDING' },
    { id: 'PR-1002', dept: 'Store', by: 'Store Manager', item: 'Office Supplies', qty: 50, amt: 500, date: '2026-07-01', status: 'PENDING' },
  ]);

  const [orders, setOrders] = useState([
    { id: 'PO-501', dept: 'Pharmacy', supplier: 'PharmaCorp', item: 'Paracetamol', qty: 5000, amt: 2500, status: 'Completed', date: '2026-06-25' },
    { id: 'PO-502', dept: 'Car Rental', supplier: 'AutoParts Ltd', item: 'Tires Set', qty: 40, amt: 12000, status: 'Ordered', date: '2026-06-28' },
  ]);

  const [rejectId, setRejectId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [viewSupplier, setViewSupplier] = useState(null);

  const handleApprovePR = (pr) => {
    setRequests(requests.map(r => r.id === pr.id ? { ...r, status: 'APPROVED' } : r));
    const newPO = {
      id: `PO-${Math.floor(Math.random() * 1000) + 600}`,
      dept: pr.dept,
      supplier: 'To Be Assigned',
      item: pr.item,
      qty: pr.qty,
      amt: pr.amt,
      status: 'Approved',
      date: new Date().toISOString().split('T')[0]
    };
    setOrders([newPO, ...orders]);
    submitNotification('Purchase Request Approved', `PR ${pr.id} approved. PO ${newPO.id} generated.`);
  };

  const handleRejectPR = () => {
    if (!rejectReason) return alert('Reason is required');
    setRequests(requests.map(r => r.id === rejectId ? { ...r, status: 'REJECTED' } : r));
    receiveNotification('Purchase Request Rejected', `PR ${rejectId} rejected: ${rejectReason}`);
    setRejectId(null);
    setRejectReason('');
  };

  const handleExport = () => {
    triggerNotification('Export Started', 'Exporting Purchase Orders as PDF...');
  };

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0 }}>🛒 PURCHASE MANAGEMENT</h1>
          <p style={{ color: '#64748b', margin: 0 }}>🔗 Manage All Purchases</p>
        </div>
        <button onClick={handleExport} style={{ padding: '8px 16px', background: 'white', border: '1px solid #cbd5e1', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
          <Download size={16}/> Export Report
        </button>
      </div>

      {/* PURCHASE REQUESTS (PENDING APPROVAL) */}
      <div style={{ background: 'white', padding: 16, borderRadius: 8, border: '1px solid #e2e8f0', marginBottom: 24 }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <ShoppingCart size={18} color="#3b82f6" /> Pending Purchase Requests
        </h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ background: '#f8fafc' }}>
            <tr>
              <th style={{ padding: 12 }}>PR Number</th>
              <th style={{ padding: 12 }}>Department</th>
              <th style={{ padding: 12 }}>Requested By</th>
              <th style={{ padding: 12 }}>Item</th>
              <th style={{ padding: 12 }}>Qty</th>
              <th style={{ padding: 12 }}>Est. Amount</th>
              <th style={{ padding: 12 }}>Date</th>
              <th style={{ padding: 12 }}>Status</th>
              <th style={{ padding: 12 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {requests.map(r => (
              <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: 12, fontWeight: 'bold' }}>{r.id}</td>
                <td style={{ padding: 12 }}>{r.dept}</td>
                <td style={{ padding: 12 }}>{r.by}</td>
                <td style={{ padding: 12 }}>{r.item}</td>
                <td style={{ padding: 12 }}>{r.qty}</td>
                <td style={{ padding: 12, fontWeight: 'bold' }}>${r.amt}</td>
                <td style={{ padding: 12 }}>{r.date}</td>
                <td style={{ padding: 12 }}>
                  <span style={{ padding: '4px 8px', borderRadius: 4, fontSize: 12, fontWeight: 'bold', background: r.status === 'APPROVED' ? '#dcfce7' : r.status === 'REJECTED' ? '#fee2e2' : '#fef3c7', color: r.status === 'APPROVED' ? '#166534' : r.status === 'REJECTED' ? '#991b1b' : '#b45309' }}>
                    {r.status}
                  </span>
                </td>
                <td style={{ padding: 12 }}>
                  {r.status === 'PENDING' && (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => handleApprovePR(r)} style={{ background: '#22c55e', color: 'white', border: 'none', padding: '6px 12px', borderRadius: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <CheckCircle size={14}/> Approve
                      </button>
                      <button onClick={() => setRejectId(r.id)} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '6px 12px', borderRadius: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <XCircle size={14}/> Reject
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ALL PURCHASE ORDERS */}
      <div style={{ background: 'white', padding: 16, borderRadius: 8, border: '1px solid #e2e8f0' }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: 16 }}>All Purchase Orders</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ background: '#f8fafc' }}>
            <tr>
              <th style={{ padding: 12 }}>PO Number</th>
              <th style={{ padding: 12 }}>Department</th>
              <th style={{ padding: 12 }}>Supplier</th>
              <th style={{ padding: 12 }}>Item</th>
              <th style={{ padding: 12 }}>Qty</th>
              <th style={{ padding: 12 }}>Total</th>
              <th style={{ padding: 12 }}>Status Pipeline</th>
              <th style={{ padding: 12 }}>Date</th>
              <th style={{ padding: 12 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(o => (
              <tr key={o.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: 12, fontWeight: 'bold' }}>{o.id}</td>
                <td style={{ padding: 12 }}>{o.dept}</td>
                <td style={{ padding: 12 }}>{o.supplier}</td>
                <td style={{ padding: 12 }}>{o.item}</td>
                <td style={{ padding: 12 }}>{o.qty}</td>
                <td style={{ padding: 12, fontWeight: 'bold' }}>${o.amt}</td>
                <td style={{ padding: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#64748b' }}>
                    <span style={{ color: o.status !== 'Pending Approval' ? '#3b82f6' : '#94a3b8' }}>Appr</span>
                    <ArrowRight size={12}/>
                    <span style={{ color: ['Ordered', 'Received', 'Completed'].includes(o.status) ? '#3b82f6' : '#94a3b8' }}>Ord</span>
                    <ArrowRight size={12}/>
                    <span style={{ color: ['Received', 'Completed'].includes(o.status) ? '#3b82f6' : '#94a3b8' }}>Recv</span>
                    <ArrowRight size={12}/>
                    <span style={{ color: o.status === 'Completed' ? '#22c55e' : '#94a3b8', fontWeight: o.status === 'Completed' ? 'bold' : 'normal' }}>Comp</span>
                  </div>
                </td>
                <td style={{ padding: 12 }}>{o.date}</td>
                <td style={{ padding: 12 }}>
                  <button onClick={() => setViewSupplier(o.supplier)} style={{ background: '#f1f5f9', border: 'none', padding: '6px 12px', borderRadius: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <User size={14}/> Supplier
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* REJECT MODAL */}
      {rejectId && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'white', padding: 24, borderRadius: 8, width: 400 }}>
            <h3>Reject PR {rejectId}</h3>
            <textarea placeholder="Enter rejection reason (required)..." value={rejectReason} onChange={e => setRejectReason(e.target.value)} style={{ width: '100%', height: 100, padding: 8, marginBottom: 16, border: '1px solid #cbd5e1', borderRadius: 4 }}></textarea>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button onClick={() => setRejectId(null)} style={{ padding: '8px 16px', background: '#f1f5f9', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleRejectPR} style={{ padding: '8px 16px', background: '#ef4444', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Submit</button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW SUPPLIER MODAL */}
      {viewSupplier && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'white', padding: 24, borderRadius: 8, width: 400 }}>
            <h3>Supplier Details</h3>
            <div style={{ padding: 16, background: '#f8fafc', borderRadius: 8, marginBottom: 16 }}>
              <p><strong>Name:</strong> {viewSupplier}</p>
              <p><strong>Contact:</strong> +251 900 112233</p>
              <p><strong>Bank Details:</strong> CBE 1000123456789</p>
              <p><strong>Past POs:</strong> 4</p>
            </div>
            <button onClick={() => setViewSupplier(null)} style={{ padding: '8px 16px', background: '#f1f5f9', border: 'none', borderRadius: 4, cursor: 'pointer', width: '100%' }}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CEOPurchase;
