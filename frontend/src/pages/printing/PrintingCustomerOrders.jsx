import React, { useState, useEffect } from 'react';
import { FileText, PlusCircle, Send, XCircle } from 'lucide-react';
import { printingState, convertOrderToJob } from '../../utils/printingTransactionService';
import { playSound } from '../../utils/printingSound';

const PrintingCustomerOrders = () => {
  const [orders, setOrders] = useState([]);
  const [filterStatus, setFilterStatus] = useState('All');

  const refresh = () => setOrders([...printingState.orders]);

  useEffect(() => {
    refresh();
    playSound('info'); // "📝 New Customer Order Received"
  }, []);

  const handleCreateJob = (id) => {
    if (window.confirm('Convert this order into an active Job Order?')) {
      const jobId = convertOrderToJob(id);
      playSound('success');
      alert(`Job ${jobId} created and linked successfully.`);
      refresh();
    }
  };

  const handleUpdateStatus = (id, e) => {
    const o = printingState.orders.find(x => x.id === id);
    if (o) o.status = e.target.value;
    playSound('success');
    refresh();
  };

  const handleSendConf = () => {
    playSound('success');
    alert('Order Confirmation Sent via Notification Service.');
  };

  const handleCancel = (id) => {
    const reason = prompt('Enter cancellation reason:');
    if (reason) {
      const o = printingState.orders.find(x => x.id === id);
      if (o) {
        o.status = 'Cancelled';
        if (o.jobId) alert(`Warning: Job ${o.jobId} is linked to this order. Please cancel the job separately if needed.`);
      }
      playSound('success');
      refresh();
    }
  };

  const filtered = orders.filter(o => filterStatus === 'All' || o.status === filterStatus);

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: '#0f172a' }}>
            <FileText color="#8b5cf6" size={28} /> CUSTOMER ORDERS
          </h1>
          <p style={{ color: '#64748b', margin: '4px 0 0' }}>Commercial sales records before they enter the production pipeline.</p>
        </div>
        <button style={{ padding: '8px 16px', background: '#8b5cf6', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
          Export PDF
        </button>
      </div>

      <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', padding: 16, marginBottom: 16 }}>
        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>Filter Status</label>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6 }}>
          <option>All</option><option>New</option><option>In Progress</option><option>Completed</option><option>Cancelled</option>
        </select>
      </div>

      <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              {['Order #', 'Customer', 'Items', 'Amount/Bal', 'Delivery', 'Status', 'Actions'].map(col => (
                <th key={col} style={{ padding: '12px 14px', textAlign: 'left', color: '#475569', fontWeight: 600, fontSize: 13 }}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(o => (
              <tr key={o.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '12px 14px', fontWeight: 700, color: '#0f172a' }}>{o.id} <br/><span style={{fontSize: 11, color: '#94a3b8'}}>{o.date}</span></td>
                <td style={{ padding: '12px 14px', color: '#0f172a' }}>{o.customerName} <br/><span style={{fontSize: 11, color: '#64748b'}}>{o.contact}</span></td>
                <td style={{ padding: '12px 14px', color: '#475569' }}>{o.items}</td>
                <td style={{ padding: '12px 14px' }}>
                  <div style={{ fontWeight: 600, color: '#0f172a' }}>${o.totalAmount}</div>
                  <div style={{ fontSize: 12, color: o.balanceDue > 0 ? '#ef4444' : '#10b981' }}>Bal: ${o.balanceDue}</div>
                </td>
                <td style={{ padding: '12px 14px', color: '#475569' }}>{o.deliveryDate}</td>
                <td style={{ padding: '12px 14px' }}>
                  <select value={o.status} onChange={(e) => handleUpdateStatus(o.id, e)} style={{ padding: '4px', border: '1px solid #cbd5e1', borderRadius: 4, fontSize: 12, background: o.status === 'New' ? '#fef3c7' : '#f8fafc' }}>
                    <option>New</option><option>In Progress</option><option>Completed</option><option>Cancelled</option>
                  </select>
                  {o.jobId && <div style={{ fontSize: 11, color: '#3b82f6', marginTop: 4, fontWeight: 700 }}>Linked: {o.jobId}</div>}
                </td>
                <td style={{ padding: '12px 14px' }}>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {!o.jobId && o.status !== 'Cancelled' && (
                      <button onClick={() => handleCreateJob(o.id)} style={{ padding: '6px', background: '#ecfdf5', color: '#10b981', border: '1px solid #a7f3d0', borderRadius: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600 }}><PlusCircle size={14} /> Create Job</button>
                    )}
                    <button onClick={handleSendConf} style={{ padding: '6px', background: '#eff6ff', color: '#3b82f6', border: '1px solid #bfdbfe', borderRadius: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600 }}><Send size={14} /> Confirm</button>
                    {o.status !== 'Cancelled' && (
                      <button onClick={() => handleCancel(o.id)} style={{ padding: '6px', background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', borderRadius: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600 }}><XCircle size={14} /> Cancel</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={7} style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>No orders found.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PrintingCustomerOrders;
