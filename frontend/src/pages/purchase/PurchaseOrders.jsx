import React, { useState } from 'react';
import { ShoppingCart, Download, Plus, Send, AlertTriangle } from 'lucide-react';
import { purchaseState, createPurchaseOrder } from '../../utils/purchaseTransactionService';
import { submitNotification } from '../../utils/pharmacyNotifications';

const PurchaseOrders = () => {
  const [orders, setOrders] = useState([...purchaseState.purchaseOrders]);
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterSupplier, setFilterSupplier] = useState('');
  const [showModal, setShowModal] = useState(false);

  // Form state
  const [supplierName, setSupplierName] = useState('');
  const [item, setItem] = useState('');
  const [qty, setQty] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [m9Ref, setM9Ref] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleCreatePO = (e) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      createPurchaseOrder({
        supplierName, item, qty: parseInt(qty, 10), unitPrice: parseFloat(unitPrice),
        tax: 0, paymentTerms: 'Net 30', deliveryAddress: 'Main Store', shipMethod: 'Truck',
        deliveryDate, m9Ref
      });
      setOrders([...purchaseState.purchaseOrders]);
      setShowModal(false);
    } catch (e) {
      setErrorMsg(e.message); // Displays "Server Rejected: M9 Fund Request..."
    }
  };

  const filtered = orders.filter(o => 
    (filterStatus === 'All' || o.status === filterStatus) &&
    (!filterSupplier || o.supplierName.toLowerCase().includes(filterSupplier.toLowerCase()))
  );

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: '#8b5cf6' }}>
            <ShoppingCart color="#8b5cf6" size={28} /> PURCHASE ORDERS
          </h1>
          <p style={{ color: '#64748b', margin: '4px 0 0' }}>Create and track POs sent to suppliers.</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => setShowModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', background: '#8b5cf6', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>
            <Plus size={16} /> Create PO
          </button>
          <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', background: 'white', border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer', color: '#475569', fontWeight: 600 }}>
            <Download size={16} /> Export
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', padding: 16, marginBottom: 16, display: 'flex', gap: 16 }}>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>Supplier Name</label>
          <input placeholder="Search Supplier..." value={filterSupplier} onChange={e => setFilterSupplier(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13 }} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>Status</label>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13 }}>
            <option>All</option><option>Draft</option><option>Sent</option><option>Confirmed</option><option>Received</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              {['PO #', 'Date', 'Supplier', 'Item', 'Qty', 'Unit Price', 'Total Amount', 'Status', 'M9 Ref'].map(col => (
                <th key={col} style={{ padding: '12px 14px', textAlign: col.includes('Price') || col === 'Qty' || col === 'Total Amount' ? 'right' : 'left', color: '#475569', fontWeight: 600, fontSize: 13 }}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(o => (
              <tr key={o.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '12px 14px', fontWeight: 600, color: '#0f172a' }}>{o.id}</td>
                <td style={{ padding: '12px 14px', color: '#64748b' }}>{o.dateCreated}</td>
                <td style={{ padding: '12px 14px', color: '#0f172a', fontWeight: 500 }}>{o.supplierName}</td>
                <td style={{ padding: '12px 14px', color: '#475569' }}>{o.item}</td>
                <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 'bold' }}>{o.qty}</td>
                <td style={{ padding: '12px 14px', textAlign: 'right', color: '#64748b' }}>${o.unitPrice}</td>
                <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 'bold', color: '#0f172a' }}>${(o.qty * o.unitPrice).toLocaleString()}</td>
                <td style={{ padding: '12px 14px' }}>
                  <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: o.status === 'Sent' ? '#eff6ff' : o.status === 'Received' ? '#dcfce7' : '#f1f5f9', color: o.status === 'Sent' ? '#2563eb' : o.status === 'Received' ? '#16a34a' : '#475569' }}>
                    {o.status}
                  </span>
                </td>
                <td style={{ padding: '12px 14px', color: '#8b5cf6', fontWeight: 600, fontSize: 12 }}>{o.m9Ref || '-'}</td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={9} style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>No purchase orders found.</td></tr>}
          </tbody>
        </table>
      </div>

      {/* Add Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: 'white', borderRadius: 12, padding: 24, width: '100%', maxWidth: 600 }}>
            <h2 style={{ margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: 8, color: '#8b5cf6' }}><ShoppingCart size={20} /> Create Purchase Order</h2>
            
            {errorMsg && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10, color: '#991b1b', fontSize: 13 }}>
                <AlertTriangle size={18} /> {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreatePO}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div><label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Supplier Name *</label>
                <input value={supplierName} onChange={e => setSupplierName(e.target.value)} required style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: 6, boxSizing: 'border-box' }} /></div>
                <div><label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Item / Purchase Details *</label>
                <input value={item} onChange={e => setItem(e.target.value)} required style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: 6, boxSizing: 'border-box' }} /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div><label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Quantity *</label>
                <input type="number" value={qty} onChange={e => setQty(e.target.value)} required style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: 6, boxSizing: 'border-box' }} /></div>
                <div><label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Unit Price *</label>
                <input type="number" step="0.01" value={unitPrice} onChange={e => setUnitPrice(e.target.value)} required style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: 6, boxSizing: 'border-box' }} /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
                <div><label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Delivery Date *</label>
                <input type="date" value={deliveryDate} onChange={e => setDeliveryDate(e.target.value)} required style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: 6, boxSizing: 'border-box' }} /></div>
                <div><label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Fund Request # (M9) Reference</label>
                <input value={m9Ref} onChange={e => setM9Ref(e.target.value)} placeholder="e.g., M9-001" style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: 6, boxSizing: 'border-box', background: '#f8fafc' }} /></div>
              </div>
              
              <div style={{ background: '#f8fafc', padding: 16, borderRadius: 8, marginBottom: 24, textAlign: 'right', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: 13, color: '#64748b' }}>Total Amount</div>
                <div style={{ fontSize: 24, fontWeight: 'bold', color: '#0f172a' }}>
                  ${(parseFloat(qty||0) * parseFloat(unitPrice||0)).toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ padding: '10px 16px', background: 'white', border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 24px', background: '#8b5cf6', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>
                  <Send size={16} /> Send to Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchaseOrders;
