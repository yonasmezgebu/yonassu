import React, { useState } from 'react';
import { RotateCcw, Download, Plus, Send, FileText, ShoppingCart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { purchaseState, createReturnNote } from '../../utils/purchaseTransactionService';

const PurchaseReturns = () => {
  const navigate = useNavigate();
  const [returns, setReturns] = useState([...purchaseState.returns]);
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterReason, setFilterReason] = useState('All');
  const [showModal, setShowModal] = useState(false);

  // Form state
  const [poRef, setPoRef] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [item, setItem] = useState('');
  const [qty, setQty] = useState('');
  const [reason, setReason] = useState('Damaged Goods');
  const [authNumber, setAuthNumber] = useState('');
  const [method, setMethod] = useState('Ship');

  const handleCreateReturn = (e) => {
    e.preventDefault();
    createReturnNote({ poRef, supplierName, item, qty: parseInt(qty, 10), reason, authNumber, method });
    setReturns([...purchaseState.returns]);
    setShowModal(false);
  };

  const filtered = returns.filter(r => 
    (filterStatus === 'All' || r.status === filterStatus) &&
    (filterReason === 'All' || r.reason === filterReason)
  );

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: '#ea580c' }}>
            <RotateCcw color="#ea580c" size={28} /> PURCHASE RETURNS
          </h1>
          <p style={{ color: '#64748b', margin: '4px 0 0' }}>Manage return of goods and trigger inventory/financial adjustments.</p>
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
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => setShowModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', background: '#ea580c', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>
            <Plus size={16} /> Create Return
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
            <option>All</option><option>Pending</option><option>Authorized</option><option>Shipped</option><option>Completed</option>
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>Reason</label>
          <select value={filterReason} onChange={e => setFilterReason(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13 }}>
            <option>All</option><option>Damaged Goods</option><option>Wrong Items</option><option>Quality Issue</option><option>Expired/Expiring</option><option>Overstock</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              {['Return #', 'Date', 'PO #', 'Supplier', 'Item', 'Qty', 'Reason', 'Auth #', 'Method', 'Status'].map(col => (
                <th key={col} style={{ padding: '12px 14px', textAlign: col === 'Qty' ? 'right' : 'left', color: '#475569', fontWeight: 600, fontSize: 13 }}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(r => (
              <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '12px 14px', fontWeight: 600, color: '#0f172a' }}>{r.id}</td>
                <td style={{ padding: '12px 14px', color: '#64748b' }}>{r.date}</td>
                <td style={{ padding: '12px 14px', color: '#8b5cf6', fontWeight: 500 }}>{r.poRef}</td>
                <td style={{ padding: '12px 14px', color: '#0f172a' }}>{r.supplierName}</td>
                <td style={{ padding: '12px 14px', color: '#475569' }}>{r.item}</td>
                <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 'bold' }}>{r.qty}</td>
                <td style={{ padding: '12px 14px', color: '#dc2626' }}>{r.reason}</td>
                <td style={{ padding: '12px 14px', color: '#64748b', fontFamily: 'monospace' }}>{r.authNumber || 'Pending'}</td>
                <td style={{ padding: '12px 14px', color: '#64748b' }}>{r.method}</td>
                <td style={{ padding: '12px 14px' }}>
                  <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: r.status === 'Completed' ? '#dcfce7' : r.status === 'Shipped' ? '#e0f2fe' : '#f1f5f9', color: r.status === 'Completed' ? '#16a34a' : r.status === 'Shipped' ? '#0369a1' : '#475569' }}>
                    {r.status}
                  </span>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={10} style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>No return records found.</td></tr>}
          </tbody>
        </table>
      </div>

      {/* Add Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: 'white', borderRadius: 12, padding: 24, width: '100%', maxWidth: 600 }}>
            <h2 style={{ margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: 8, color: '#ea580c' }}><RotateCcw size={20} /> Create Return Note</h2>
            <form onSubmit={handleCreateReturn}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div><label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>PO Reference # *</label>
                <input value={poRef} onChange={e => setPoRef(e.target.value)} required style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: 6, boxSizing: 'border-box' }} /></div>
                <div><label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Supplier Name *</label>
                <input value={supplierName} onChange={e => setSupplierName(e.target.value)} required style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: 6, boxSizing: 'border-box' }} /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 16 }}>
                <div><label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Item to Return *</label>
                <input value={item} onChange={e => setItem(e.target.value)} required style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: 6, boxSizing: 'border-box' }} /></div>
                <div><label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Quantity *</label>
                <input type="number" value={qty} onChange={e => setQty(e.target.value)} required style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: 6, boxSizing: 'border-box' }} /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 24 }}>
                <div><label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Reason *</label>
                <select value={reason} onChange={e => setReason(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: 6 }} required>
                  <option>Damaged Goods</option><option>Wrong Items</option><option>Quality Issue</option><option>Expired/Expiring</option><option>Overstock</option>
                </select></div>
                <div><label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Return Auth #</label>
                <input value={authNumber} onChange={e => setAuthNumber(e.target.value)} placeholder="(Optional)" style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: 6, boxSizing: 'border-box' }} /></div>
                <div><label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Method</label>
                <select value={method} onChange={e => setMethod(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: 6 }}>
                  <option>Ship</option><option>In-person</option><option>Courier</option>
                </select></div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ padding: '10px 16px', background: 'white', border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 24px', background: '#ea580c', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>
                  <Send size={16} /> Process Return
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchaseReturns;
