import React, { useState, useContext, useEffect } from 'react';
import { Monitor, ShoppingCart, Plus, Trash2, Printer, CheckCircle } from 'lucide-react';
import { WorkerAuthContext } from './PharmacyWorkerDashboard';
import { createIssueNote, createCRV } from '../../utils/storeTransactionService';
import { submitNotification } from '../../utils/pharmacyNotifications';

// Mock catalog for POS
const MOCK_PRODUCTS = [
  { id: 'MED-001', name: 'Amoxicillin', strength: '500mg', form: 'Tablet', price: 15.00 },
  { id: 'MED-002', name: 'Paracetamol', strength: '500mg', form: 'Tablet', price: 5.00 },
  { id: 'MED-003', name: 'Ibuprofen', strength: '400mg', form: 'Tablet', price: 8.50 },
  { id: 'MED-004', name: 'Cough Syrup', strength: '100ml', form: 'Syrup', price: 12.00 },
];

const PharmacyWorkerPOS = () => {
  const { hasManagerPermission } = useContext(WorkerAuthContext);
  const [cart, setCart] = useState([]);
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [submitted, setSubmitted] = useState(null);

  const [customerDetails, setCustomerDetails] = useState({ name: '', phone: '', bankName: '', accountHolder: '', accountNumber: '', telebirrNumber: '' });

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const updateQty = (id, newQty) => {
    if (newQty < 1) return;
    setCart(prev => prev.map(item => item.id === id ? { ...item, qty: newQty } : item));
  };

  const removeFromCart = (id) => setCart(prev => prev.filter(item => item.id !== id));

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const total = Math.max(0, subtotal - discount);

  const handleCheckout = (e) => {
    e.preventDefault();
    if (!hasManagerPermission) return;
    if (cart.length === 0) return alert('Cart is empty.');

    try {
      // 1. Generate M22 Issue Note (bypass M20 req for pharmacy POS)
      const m22Lines = cart.map(item => ({ itemName: `${item.name} ${item.strength} ${item.form}`, qtyToIssue: item.qty, batchNumber: '' }));
      const m22Record = createIssueNote('Customers (Walk-in)', '', '', m22Lines, true);

      // 2. Generate CRV Payment Receipt
      const crvRecord = createCRV(paymentMethod, total, `POS Sale M22-${m22Record.id}`, customerDetails);

      setSubmitted({ m22: m22Record, crv: crvRecord, cart, subtotal, discount, total, date: new Date().toISOString() });
      submitNotification('💳 POS Sale Completed', 'Sale Completed - Click to View');
      } catch (err) { alert(err.message);
    }
  };

  if (submitted) {
    return (
      <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
        <div style={{ maxWidth: 800, margin: '0 auto', background: 'white', borderRadius: 12, border: '2px solid #10b981', padding: 32 }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <CheckCircle size={56} color="#10b981" />
            <h2 style={{ fontSize: 22, fontWeight: 'bold', color: '#065f46', margin: '12px 0 4px' }}>POS Checkout Successful</h2>
            <p style={{ color: '#64748b' }}>Inventory decremented (M22) and Payment recorded (CRV).</p>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
            <div style={{ background: '#f0fdf4', padding: 16, borderRadius: 8, border: '1px dashed #6ee7b7' }}>
              <h4 style={{ margin: '0 0 8px', color: '#047857' }}>Payment details (CRV)</h4>
              <div style={{ fontSize: 13 }}><strong>CRV #:</strong> <span style={{ fontFamily: 'monospace' }}>{submitted.crv.id}</span></div>
              <div style={{ fontSize: 13 }}><strong>Method:</strong> {submitted.crv.paymentMethod}</div>
              <div style={{ fontSize: 13 }}><strong>Amount:</strong> ${submitted.total.toFixed(2)}</div>
            </div>
            <div style={{ background: '#f8fafc', padding: 16, borderRadius: 8, border: '1px dashed #cbd5e1' }}>
              <h4 style={{ margin: '0 0 8px', color: '#475569' }}>Issue details (M22)</h4>
              <div style={{ fontSize: 13 }}><strong>M22 #:</strong> <span style={{ fontFamily: 'monospace' }}>{submitted.m22.id}</span></div>
              <div style={{ fontSize: 13 }}><strong>Destination:</strong> {submitted.m22.destination}</div>
            </div>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, marginBottom: 16 }}>
            <thead><tr style={{ background: '#f1f5f9' }}>
              <th style={{ padding: '8px', textAlign: 'left' }}>Item</th>
              <th style={{ padding: '8px', textAlign: 'center' }}>Qty</th>
              <th style={{ padding: '8px', textAlign: 'right' }}>Price</th>
              <th style={{ padding: '8px', textAlign: 'right' }}>Total</th>
            </tr></thead>
            <tbody>
              {submitted.cart.map((item, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '8px' }}>{item.name} {item.strength}</td>
                  <td style={{ padding: '8px', textAlign: 'center' }}>{item.qty}</td>
                  <td style={{ padding: '8px', textAlign: 'right' }}>${item.price.toFixed(2)}</td>
                  <td style={{ padding: '8px', textAlign: 'right' }}>${(item.price * item.qty).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button onClick={() => window.print()} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', background: 'white', border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer' }}>
              <Printer size={15} /> Print Receipt
            </button>
            <button onClick={() => { setSubmitted(null); setCart([]); setCustomerDetails({ name: '', phone: '', bankName: '', accountHolder: '', accountNumber: '', telebirrNumber: '' }); }} style={{ padding: '10px 24px', background: '#0f172a', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
              New Sale
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: '#047857' }}>
          <Monitor color="#10b981" size={28} /> POS SYSTEM
        </h1>
        <p style={{ color: '#64748b', margin: '4px 0 0' }}>Document Model: M22 + CRV</p>
      </div>

      <fieldset disabled={!hasManagerPermission} style={{ border: 'none', padding: 0, margin: 0, opacity: hasManagerPermission ? 1 : 0.6 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: 24 }}>
          
          {/* Left: Product Catalog */}
          <div>
            <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', padding: 20 }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 15 }}>Product Catalog</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {MOCK_PRODUCTS.map(product => (
                  <div key={product.id} onClick={() => addToCart(product)} style={{ border: '1px solid #cbd5e1', borderRadius: 8, padding: 12, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{product.name}</div>
                      <div style={{ fontSize: 12, color: '#64748b' }}>{product.strength} - {product.form}</div>
                    </div>
                    <div style={{ fontWeight: 'bold', color: '#10b981' }}>${product.price.toFixed(2)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Cart & Checkout */}
          <form onSubmit={handleCheckout} style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: 20, borderBottom: '1px solid #e2e8f0' }}>
              <h3 style={{ margin: 0, fontSize: 15, display: 'flex', alignItems: 'center', gap: 8 }}>
                <ShoppingCart size={18} /> Current Cart
              </h3>
            </div>
            
            <div style={{ padding: 20, flex: 1, minHeight: 200 }}>
              {cart.length === 0 ? (
                <div style={{ color: '#94a3b8', textAlign: 'center', marginTop: 40, fontSize: 14 }}>Cart is empty</div>
              ) : (
                cart.map(item => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, borderBottom: '1px dashed #e2e8f0', paddingBottom: 12 }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{item.name}</div>
                      <div style={{ fontSize: 12, color: '#64748b' }}>${item.price.toFixed(2)}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <input type="number" value={item.qty} onChange={(e) => updateQty(item.id, parseInt(e.target.value))} style={{ width: 50, padding: '4px', textAlign: 'center', border: '1px solid #cbd5e1', borderRadius: 4 }} />
                      <div style={{ fontWeight: 'bold', fontSize: 13, width: 60, textAlign: 'right' }}>${(item.price * item.qty).toFixed(2)}</div>
                      <button type="button" onClick={() => removeFromCart(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 4 }}><Trash2 size={16} /></button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div style={{ padding: 20, background: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 8 }}>
                <span style={{ color: '#64748b' }}>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 16 }}>
                <span style={{ color: '#64748b' }}>Discount</span>
                <input type="number" value={discount} onChange={e => setDiscount(parseFloat(e.target.value) || 0)} style={{ width: 60, padding: 4, textAlign: 'right', border: '1px solid #cbd5e1', borderRadius: 4 }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18, fontWeight: 'bold', marginBottom: 16 }}>
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Payment Method *</label>
                <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: 6 }}>
                  <option>Cash</option>
                  <option>Bank Transfer</option>
                  <option>Telebirr</option>
                </select>
              </div>

              {/* Conditional Payment Fields */}
              {paymentMethod === 'Cash' && (
                <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                  <input required value={customerDetails.name} onChange={e => setCustomerDetails({...customerDetails, name: e.target.value})} placeholder="Customer Name" style={{ width: '50%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 12 }} />
                  <input required value={customerDetails.phone} onChange={e => setCustomerDetails({...customerDetails, phone: e.target.value})} placeholder="Phone" style={{ width: '50%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 12 }} />
                </div>
              )}
              {paymentMethod === 'Bank Transfer' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
                  <input required value={customerDetails.bankName} onChange={e => setCustomerDetails({...customerDetails, bankName: e.target.value})} placeholder="Bank Name" style={{ padding: '8px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 12 }} />
                  <input required value={customerDetails.accountHolder} onChange={e => setCustomerDetails({...customerDetails, accountHolder: e.target.value})} placeholder="Account Holder" style={{ padding: '8px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 12 }} />
                  <input required value={customerDetails.accountNumber} onChange={e => setCustomerDetails({...customerDetails, accountNumber: e.target.value})} placeholder="Account Number" style={{ padding: '8px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 12 }} />
                  <input required value={customerDetails.phone} onChange={e => setCustomerDetails({...customerDetails, phone: e.target.value})} placeholder="Phone" style={{ padding: '8px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 12 }} />
                </div>
              )}
              {paymentMethod === 'Telebirr' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8, marginBottom: 16 }}>
                  <input required value={customerDetails.telebirrNumber} onChange={e => setCustomerDetails({...customerDetails, telebirrNumber: e.target.value})} placeholder="Telebirr Number" style={{ padding: '8px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 12 }} />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input required value={customerDetails.name} onChange={e => setCustomerDetails({...customerDetails, name: e.target.value})} placeholder="Full Name" style={{ width: '50%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 12 }} />
                    <input required value={customerDetails.phone} onChange={e => setCustomerDetails({...customerDetails, phone: e.target.value})} placeholder="Phone" style={{ width: '50%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 12 }} />
                  </div>
                </div>
              )}

              <button type="submit" style={{ width: '100%', padding: '12px', background: '#10b981', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 15, fontWeight: 600 }}>
                Checkout & Record Sale
              </button>
            </div>
          </form>
        </div>
      </fieldset>
    </div>
  );
};

export default PharmacyWorkerPOS;
