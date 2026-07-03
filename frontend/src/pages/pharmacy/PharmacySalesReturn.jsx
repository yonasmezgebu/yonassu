import React, { useState } from 'react';
import { RefreshCcw, Search, ArrowRight, ShieldAlert, CheckCircle } from 'lucide-react';
import { submitNotification } from '../../utils/pharmacyNotifications';

const PharmacySalesReturn = () => {
  const [step, setStep] = useState(1);
  const [searchSale, setSearchSale] = useState('');
  const [saleFound, setSaleFound] = useState(null);
  
  const [returnItems, setReturnItems] = useState([]);
  const [refundMethod, setRefundMethod] = useState('');
  const [reason, setReason] = useState('');

  const handleSearch = () => {
    if (searchSale.trim()) {
      setSaleFound({
        id: searchSale,
        date: '2026-07-01',
        customer: 'Walk-in',
        items: [
          { id: 1, name: 'Paracetamol 500mg', originalQty: 2, price: 50 },
          { id: 2, name: 'Amoxicillin 250mg', originalQty: 1, price: 350 }
        ]
      });
      setReturnItems([
        { id: 1, name: 'Paracetamol 500mg', returnQty: 0, price: 50, condition: 'GOOD' },
        { id: 2, name: 'Amoxicillin 250mg', returnQty: 0, price: 350, condition: 'GOOD' }
      ]);
      setStep(3);
    }
  };

  const refundTotal = returnItems.reduce((sum, item) => sum + (item.returnQty * item.price), 0);

  const handleProcessReturn = () => {
    if (!reason || !refundMethod || refundTotal === 0) {
      alert('Please select items to return, provide a reason, and select a refund method.');
      return;
    }
    submitNotification('Return Processed', `Refund of $${refundTotal} issued via ${refundMethod}. Inventory updated.`);
    setStep(8);
  };

  return (
    <div style={{ padding: 24, fontFamily: "'Inter', sans-serif" }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 'bold', color: '#1e293b', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <RefreshCcw size={24} color="#f97316" /> SALES RETURN
          </h2>
          <p style={{ color: '#64748b', margin: 0 }}>🔗 Process Sales Returns (Manager Only)</p>
        </div>
        <div style={{ background: '#fef2f2', color: '#ef4444', padding: '8px 16px', borderRadius: 8, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 8 }}>
          <ShieldAlert size={20} /> Manager Authorization Active
        </div>
      </div>

      <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', padding: 24, maxWidth: 800 }}>
        {step === 1 && (
          <div>
            <h3 style={{ fontSize: 18, marginBottom: 16 }}>Step 2: Locate Original Sale</h3>
            <div style={{ display: 'flex', gap: 12 }}>
              <input 
                type="text" 
                placeholder="Enter Receipt Number..." 
                value={searchSale}
                onChange={e => setSearchSale(e.target.value)}
                style={{ flex: 1, padding: 12, borderRadius: 6, border: '1px solid #cbd5e1' }}
              />
              <button onClick={handleSearch} style={{ background: '#1e293b', color: 'white', padding: '0 24px', border: 'none', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Search size={18} /> Find Sale
              </button>
            </div>
          </div>
        )}

        {step === 3 && saleFound && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, padding: 16, background: '#f8fafc', borderRadius: 8 }}>
              <div>
                <strong>Receipt:</strong> {saleFound.id}<br/>
                <span style={{ color: '#64748b' }}>Date: {saleFound.date} | Customer: {saleFound.customer}</span>
              </div>
            </div>

            <h3 style={{ fontSize: 18, marginBottom: 16 }}>Step 3 & 4: Select Items & Verify Condition</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 24 }}>
              <thead style={{ background: '#f1f5f9' }}>
                <tr>
                  <th style={{ padding: 12, textAlign: 'left' }}>Item</th>
                  <th style={{ padding: 12, textAlign: 'center' }}>Original Qty</th>
                  <th style={{ padding: 12, textAlign: 'center' }}>Return Qty</th>
                  <th style={{ padding: 12, textAlign: 'left' }}>Condition</th>
                  <th style={{ padding: 12, textAlign: 'right' }}>Refund Amount</th>
                </tr>
              </thead>
              <tbody>
                {returnItems.map((item, idx) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: 12 }}>{item.name} <div style={{ color: '#64748b', fontSize: 12 }}>${item.price}/ea</div></td>
                    <td style={{ padding: 12, textAlign: 'center' }}>{saleFound.items[idx].originalQty}</td>
                    <td style={{ padding: 12, textAlign: 'center' }}>
                      <input 
                        type="number" 
                        min="0" 
                        max={saleFound.items[idx].originalQty}
                        value={item.returnQty}
                        onChange={e => {
                          const newQty = Math.min(Math.max(0, parseInt(e.target.value) || 0), saleFound.items[idx].originalQty);
                          const newItems = [...returnItems];
                          newItems[idx].returnQty = newQty;
                          setReturnItems(newItems);
                        }}
                        style={{ width: 60, padding: 4 }}
                      />
                    </td>
                    <td style={{ padding: 12 }}>
                      <select 
                        value={item.condition}
                        onChange={e => {
                          const newItems = [...returnItems];
                          newItems[idx].condition = e.target.value;
                          setReturnItems(newItems);
                        }}
                        style={{ padding: 4 }}
                      >
                        <option value="GOOD">GOOD (Return to stock)</option>
                        <option value="DAMAGED">DAMAGED (Write-off)</option>
                        <option value="EXPIRED">EXPIRED (Write-off)</option>
                      </select>
                    </td>
                    <td style={{ padding: 12, textAlign: 'right', fontWeight: 'bold' }}>
                      ${item.returnQty * item.price}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <h3 style={{ fontSize: 18, marginBottom: 16 }}>Step 5 & 6: Refund Details</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>Refund Method</label>
                <select value={refundMethod} onChange={e => setRefundMethod(e.target.value)} style={{ width: '100%', padding: 12, borderRadius: 6, border: '1px solid #cbd5e1' }}>
                  <option value="">Select Method...</option>
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Telbir">Telbir</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>Return Reason (Required)</label>
                <input type="text" value={reason} onChange={e => setReason(e.target.value)} placeholder="Why is the customer returning this?" style={{ width: '100%', padding: 12, borderRadius: 6, border: '1px solid #cbd5e1' }} />
              </div>
            </div>

            <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', padding: 24, borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ color: '#1d4ed8', fontWeight: 'bold' }}>Total Refund Amount</div>
                <div style={{ fontSize: 32, fontWeight: 'bold', color: '#1e3a8a' }}>${refundTotal.toFixed(2)}</div>
              </div>
              <button onClick={handleProcessReturn} style={{ background: '#f97316', color: 'white', padding: '16px 32px', borderRadius: 8, border: 'none', fontWeight: 'bold', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                PROCESS RETURN <ArrowRight size={20} />
              </button>
            </div>
          </div>
        )}

        {step === 8 && (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <CheckCircle size={64} color="#f97316" style={{ margin: '0 auto 16px' }} />
            <h2>Return Completed!</h2>
            <p style={{ color: '#64748b', marginBottom: 24 }}>Refund issued. Inventory updated. Return Note generated.</p>
            <button onClick={() => { setStep(1); setSearchSale(''); setSaleFound(null); }} style={{ padding: '12px 24px', background: '#1e293b', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer' }}>Process Another Return</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PharmacySalesReturn;
