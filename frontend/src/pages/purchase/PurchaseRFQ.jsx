import React, { useState } from 'react';
import { File, Download, Plus, Send, CheckCircle } from 'lucide-react';
import { purchaseState } from '../../utils/purchaseTransactionService';
import { submitNotification } from '../../utils/pharmacyNotifications';

const PurchaseRFQ = () => {
  const [rfqs, setRfqs] = useState([...purchaseState.rfqs]);
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterItem, setFilterItem] = useState('');
  const [showModal, setShowModal] = useState(false);

  // Form state
  const [item, setItem] = useState('');
  const [qty, setQty] = useState('');
  const [spec, setSpec] = useState('');
  const [deliveryDeadline, setDeliveryDeadline] = useState('');
  const [responseDeadline, setResponseDeadline] = useState('');
  const [suppliers, setSuppliers] = useState('');

  const handlePostRFQ = (e) => {
    e.preventDefault();
    const newRecord = {
      id: `RFQ-${Date.now().toString().slice(-4)}`,
      dateCreated: new Date().toISOString().slice(0, 10),
      item, qty: parseInt(qty, 10), spec, deliveryDeadline, responseDeadline,
      status: 'Open',
      suppliersSentTo: suppliers.split(',').map(s => s.trim()).filter(Boolean)
    };
    purchaseState.rfqs.push(newRecord);
    setRfqs([...purchaseState.rfqs]);
    setShowModal(false);
    submitNotification('📄 New RFQ Created', '📄 New RFQ - Click to View', 'success.mp3');
  };

  const filtered = rfqs.filter(r => 
    (filterStatus === 'All' || r.status === filterStatus) &&
    (!filterItem || r.item.toLowerCase().includes(filterItem.toLowerCase()))
  );

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: '#22c55e' }}>
            <File color="#22c55e" size={28} /> REQUEST FOR QUOTATION
          </h1>
          <p style={{ color: '#64748b', margin: '4px 0 0' }}>Manage RFQs for non-tender procurement.</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => setShowModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', background: '#22c55e', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>
            <Plus size={16} /> Create RFQ
          </button>
          <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', background: 'white', border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer', color: '#475569', fontWeight: 600 }}>
            <Download size={16} /> Export
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', padding: 16, marginBottom: 16, display: 'flex', gap: 16 }}>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>Status</label>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13 }}>
            <option>All</option><option>Open</option><option>Closed</option>
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>Search Item</label>
          <input placeholder="Search Item..." value={filterItem} onChange={e => setFilterItem(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13 }} />
        </div>
      </div>

      {/* Table */}
      <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              {['RFQ #', 'Date Created', 'Item / Service', 'Qty', 'Spec', 'Response Deadline', 'Delivery Deadline', 'Status'].map(col => (
                <th key={col} style={{ padding: '12px 14px', textAlign: col === 'Qty' ? 'right' : 'left', color: '#475569', fontWeight: 600, fontSize: 13 }}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(r => (
              <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '12px 14px', fontWeight: 600, color: '#0f172a' }}>{r.id}</td>
                <td style={{ padding: '12px 14px', color: '#64748b' }}>{r.dateCreated}</td>
                <td style={{ padding: '12px 14px', color: '#0f172a', fontWeight: 500 }}>{r.item}</td>
                <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 'bold' }}>{r.qty}</td>
                <td style={{ padding: '12px 14px', color: '#64748b', fontSize: 13, maxWidth: 200 }}><div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.spec}</div></td>
                <td style={{ padding: '12px 14px', color: '#ea580c', fontWeight: 500 }}>{r.responseDeadline}</td>
                <td style={{ padding: '12px 14px', color: '#64748b' }}>{r.deliveryDeadline}</td>
                <td style={{ padding: '12px 14px' }}>
                  <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: r.status === 'Open' ? '#dcfce7' : '#f1f5f9', color: r.status === 'Open' ? '#16a34a' : '#475569' }}>
                    {r.status}
                  </span>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={8} style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>No RFQs found.</td></tr>}
          </tbody>
        </table>
      </div>

      {/* Add Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: 'white', borderRadius: 12, padding: 24, width: '100%', maxWidth: 600 }}>
            <h2 style={{ margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: 8, color: '#22c55e' }}><File size={20} /> Create New RFQ</h2>
            <form onSubmit={handlePostRFQ}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 16 }}>
                <div><label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Item/Services Required *</label>
                <input value={item} onChange={e => setItem(e.target.value)} required style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: 6, boxSizing: 'border-box' }} /></div>
                <div><label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Quantity *</label>
                <input type="number" value={qty} onChange={e => setQty(e.target.value)} required style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: 6, boxSizing: 'border-box' }} /></div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Specifications</label>
                <textarea value={spec} onChange={e => setSpec(e.target.value)} rows={2} style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: 6, boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div><label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Response Deadline *</label>
                <input type="date" value={responseDeadline} onChange={e => setResponseDeadline(e.target.value)} required style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: 6, boxSizing: 'border-box' }} /></div>
                <div><label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Delivery Deadline *</label>
                <input type="date" value={deliveryDeadline} onChange={e => setDeliveryDeadline(e.target.value)} required style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: 6, boxSizing: 'border-box' }} /></div>
              </div>
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Select Suppliers to Send To (comma separated names)</label>
                <input value={suppliers} onChange={e => setSuppliers(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: 6, boxSizing: 'border-box' }} placeholder="Supplier A, Supplier B" />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ padding: '10px 16px', background: 'white', border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 24px', background: '#22c55e', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>
                  <Send size={16} /> Send RFQ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchaseRFQ;
