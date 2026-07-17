import React, { useState } from 'react';
import { Inbox, Download, Check, X, ShoppingCart } from 'lucide-react';
import { purchaseState, createPurchaseOrder } from '../../utils/purchaseTransactionService';
import { submitNotification } from '../../utils/pharmacyNotifications';
import { useNavigate } from 'react-router-dom';

const PurchaseSupplierQuotations = () => {
  const [quotes, setQuotes] = useState(purchaseState.m6BidsAndQuotes.filter(q => q.source_type === 'RFQ'));
  const [filterRFQ, setFilterRFQ] = useState('');
  const [filterSupplier, setFilterSupplier] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const navigate = useNavigate();

  const handleAccept = (quote) => {
    try {
      // Mark as accepted
      const q = purchaseState.m6BidsAndQuotes.find(x => x.id === quote.id);
      if (q) q.status = 'Accepted';
      
      // Auto-convert to PO
      createPurchaseOrder({
        supplierName: quote.supplierName,
        item: quote.item,
        qty: quote.qty,
        unitPrice: quote.unitPrice,
        tax: 0,
        paymentTerms: 'Net 30',
        deliveryAddress: 'Main Store',
        shipMethod: 'Standard',
        m9Ref: '', // Will need finance approval to finalize in reality
        referenceId: quote.id
      });

      setQuotes(purchaseState.m6BidsAndQuotes.filter(x => x.source_type === 'RFQ'));
      submitNotification('✅ Quotation Accepted', '✅ Converted to Purchase Order', 'success.mp3');
      
      // Optionally navigate to PO page
      // navigate('/purchase/orders');
    } catch (e) { alert(e.message); }
  };

  const handleReject = (id) => {
    const reason = prompt('Enter reason for rejecting this quotation:');
    if (!reason) return;
    const q = purchaseState.m6BidsAndQuotes.find(x => x.id === id);
    if (q) q.status = 'Rejected';
    setQuotes(purchaseState.m6BidsAndQuotes.filter(x => x.source_type === 'RFQ'));
    submitNotification('❌ Quotation Rejected', '❌ Supplier Quotation Rejected', 'info.mp3');
  };

  const filtered = quotes.filter(q => 
    (filterStatus === 'All' || q.status === filterStatus) &&
    (!filterRFQ || q.referenceId.toLowerCase().includes(filterRFQ.toLowerCase())) &&
    (!filterSupplier || q.supplierName.toLowerCase().includes(filterSupplier.toLowerCase()))
  );

  const sorted = [...filtered].sort((a, b) => (a.qty * a.unitPrice) - (b.qty * b.unitPrice));

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: '#f59e0b' }}>
            <Inbox color="#f59e0b" size={28} /> SUPPLIER QUOTATIONS
          </h1>
          <p style={{ color: '#64748b', margin: '4px 0 0' }}>Compare quotations and convert winning quotes to Purchase Orders.</p>
        </div>
        <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', background: 'white', border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer', color: '#475569', fontWeight: 600 }}>
          <Download size={16} /> Export
        </button>
      </div>

      {/* Filters */}
      <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', padding: 16, marginBottom: 16, display: 'flex', gap: 16 }}>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>RFQ #</label>
          <input placeholder="Search RFQ..." value={filterRFQ} onChange={e => setFilterRFQ(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13 }} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>Supplier Name</label>
          <input placeholder="Search Supplier..." value={filterSupplier} onChange={e => setFilterSupplier(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13 }} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>Status</label>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13 }}>
            <option>All</option><option>Pending</option><option>Accepted</option><option>Rejected</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              {['Quote #', 'RFQ #', 'Supplier', 'Items', 'Unit Price', 'Total Cost', 'Delivery', 'Date', 'Status', 'Actions'].map(col => (
                <th key={col} style={{ padding: '12px 14px', textAlign: col.includes('Price') || col === 'Total Cost' ? 'right' : 'left', color: '#475569', fontWeight: 600, fontSize: 13 }}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((q, i) => {
              const isLowest = i === 0 && q.status === 'Pending';
              const totalCost = q.qty * q.unitPrice;
              return (
                <tr key={q.id} style={{ borderBottom: '1px solid #f1f5f9', background: isLowest ? '#fefce8' : 'transparent' }}>
                  <td style={{ padding: '12px 14px', fontWeight: 600, color: '#0f172a' }}>
                    {q.id}
                    {isLowest && <div style={{ fontSize: 10, color: '#ca8a04', fontWeight: 'bold' }}>⭐ Lowest Quote</div>}
                  </td>
                  <td style={{ padding: '12px 14px', color: '#22c55e', fontWeight: 500 }}>{q.referenceId}</td>
                  <td style={{ padding: '12px 14px', color: '#0f172a' }}>{q.supplierName}</td>
                  <td style={{ padding: '12px 14px', color: '#475569' }}>{q.item} <br/><span style={{fontSize:11}}>({q.qty} qty)</span></td>
                  <td style={{ padding: '12px 14px', textAlign: 'right', color: '#64748b' }}>ETB {q.unitPrice}</td>
                  <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 'bold', color: isLowest ? '#ca8a04' : '#0f172a' }}>ETB {totalCost.toLocaleString()}</td>
                  <td style={{ padding: '12px 14px', color: '#64748b' }}>{q.deliveryTerms}</td>
                  <td style={{ padding: '12px 14px', color: '#64748b' }}>{q.dateSubmitted}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: q.status === 'Accepted' ? '#dcfce7' : q.status === 'Rejected' ? '#fee2e2' : '#f1f5f9', color: q.status === 'Accepted' ? '#16a34a' : q.status === 'Rejected' ? '#dc2626' : '#475569' }}>
                      {q.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    {q.status === 'Pending' ? (
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => handleAccept(q)} style={{ padding: '6px 12px', background: '#dcfce7', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600 }} title="Accept & Create PO"><ShoppingCart size={14} /> Create PO</button>
                        <button onClick={() => handleReject(q.id)} style={{ padding: '6px', background: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 4, cursor: 'pointer' }} title="Reject Quote"><X size={16} /></button>
                      </div>
                    ) : <span style={{ fontSize: 12, color: '#94a3b8' }}>Processed</span>}
                  </td>
                </tr>
              );
            })}
            {sorted.length === 0 && <tr><td colSpan={10} style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>No quotations found.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PurchaseSupplierQuotations;
