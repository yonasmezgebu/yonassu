import React, { useState } from 'react';
import { ShoppingCart, Search, CreditCard, CheckCircle, Printer, Mail, Plus } from 'lucide-react';
import { submitNotification } from '../../utils/pharmacyNotifications';

const PharmacyPOS = () => {
  const [step, setStep] = useState(1);
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentDetails, setPaymentDetails] = useState({});

  const mockInventory = [
    { id: 1, name: 'Paracetamol 500mg', category: 'Painkillers', price: 50, stock: 100 },
    { id: 2, name: 'Amoxicillin 250mg', category: 'Antibiotics', price: 350, stock: 45 },
    { id: 3, name: 'Vitamin C', category: 'Supplements', price: 30, stock: 200 },
  ];

  const addToCart = (item) => {
    const existing = cart.find(c => c.id === item.id);
    if (existing) {
      if (existing.qty < item.stock) {
        setCart(cart.map(c => c.id === item.id ? { ...c, qty: c.qty + 1 } : c));
      }
    } else {
      setCart([...cart, { ...item, qty: 1 }]);
    }
  };

  const updateQty = (id, newQty) => {
    const item = mockInventory.find(i => i.id === id);
    if (newQty > 0 && newQty <= item.stock) {
      setCart(cart.map(c => c.id === id ? { ...c, qty: newQty } : c));
    }
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

  const handleProcessPayment = () => {
    submitNotification('Payment Processed', 'Transaction completed successfully. Model 22 Generated.');
    setStep(4); // Completion
  };

  return (
    <div style={{ padding: 24, fontFamily: "'Inter', sans-serif" }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 24, fontWeight: 'bold', color: '#1e293b', margin: 0 }}>💳 POINT OF SALE</h2>
        <p style={{ color: '#64748b', margin: 0 }}>🔗 Process Walk-in Sales</p>
      </div>

      <div style={{ display: 'flex', gap: 24 }}>
        {/* Left Side: Steps 1 & 3 */}
        <div style={{ flex: 2, background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', padding: 24 }}>
          {step === 1 && (
            <div>
              <h3 style={{ fontSize: 18, marginBottom: 16 }}>Step 1: Select Products</h3>
              <div style={{ position: 'relative', marginBottom: 24 }}>
                <Search size={20} style={{ position: 'absolute', left: 12, top: 10, color: '#64748b' }} />
                <input 
                  type="text" 
                  placeholder="Scan barcode or search by name..." 
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{ width: '100%', padding: '10px 10px 10px 40px', borderRadius: 6, border: '1px solid #cbd5e1' }}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
                {mockInventory.map(item => (
                  <div key={item.id} style={{ border: '1px solid #e2e8f0', padding: 16, borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 'bold' }}>{item.name}</div>
                      <div style={{ fontSize: 12, color: '#64748b' }}>{item.category} • Stock: {item.stock}</div>
                      <div style={{ color: '#10b981', fontWeight: 'bold', marginTop: 4 }}>${item.price}</div>
                    </div>
                    <button onClick={() => addToCart(item)} style={{ background: '#0284c7', color: 'white', border: 'none', padding: '8px 12px', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Plus size={16} /> Add
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h3 style={{ fontSize: 18, marginBottom: 16 }}>Step 3: Payment</h3>
              <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
                {['Cash', 'Bank Transfer', 'Telbir'].map(method => (
                  <button 
                    key={method}
                    onClick={() => setPaymentMethod(method)}
                    style={{ flex: 1, padding: 16, border: paymentMethod === method ? '2px solid #0284c7' : '1px solid #e2e8f0', background: paymentMethod === method ? '#f0f9ff' : 'white', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}
                  >
                    {method}
                  </button>
                ))}
              </div>

              {paymentMethod === 'Cash' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div><label>Amount Received</label><input type="number" defaultValue={cartTotal} style={{ width: '100%', padding: 8, marginTop: 4 }} /></div>
                  <div><label>Recipient Name</label><input type="text" style={{ width: '100%', padding: 8, marginTop: 4 }} /></div>
                  <div><label>Phone</label><input type="text" style={{ width: '100%', padding: 8, marginTop: 4 }} /></div>
                </div>
              )}

              {paymentMethod === 'Bank Transfer' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div><label>Bank Name</label><input type="text" style={{ width: '100%', padding: 8, marginTop: 4 }} /></div>
                  <div><label>Account Holder</label><input type="text" style={{ width: '100%', padding: 8, marginTop: 4 }} /></div>
                  <div><label>Account Number</label><input type="text" style={{ width: '100%', padding: 8, marginTop: 4 }} /></div>
                  <div><label>Reference No</label><input type="text" style={{ width: '100%', padding: 8, marginTop: 4 }} /></div>
                </div>
              )}

              {paymentMethod === 'Telbir' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div><label>Telbir Number</label><input type="text" style={{ width: '100%', padding: 8, marginTop: 4 }} /></div>
                  <div><label>Full Name</label><input type="text" style={{ width: '100%', padding: 8, marginTop: 4 }} /></div>
                  <div><label>Transaction ID</label><input type="text" style={{ width: '100%', padding: 8, marginTop: 4 }} /></div>
                </div>
              )}

              {paymentMethod && (
                <button onClick={handleProcessPayment} style={{ width: '100%', marginTop: 24, padding: 16, background: '#10b981', color: 'white', fontWeight: 'bold', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 16 }}>
                  PROCESS PAYMENT (${cartTotal.toFixed(2)})
                </button>
              )}
            </div>
          )}

          {step === 4 && (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <CheckCircle size={64} color="#10b981" style={{ margin: '0 auto 16px' }} />
              <h2>Transaction Complete!</h2>
              <p style={{ color: '#64748b', marginBottom: 24 }}>Inventory updated. CRV and Model 22 generated.</p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 16 }}>
                <button style={{ padding: '12px 24px', background: '#0284c7', color: 'white', border: 'none', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}><Printer size={18} /> Print Receipt</button>
                <button style={{ padding: '12px 24px', background: '#e2e8f0', color: '#1e293b', border: 'none', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}><Mail size={18} /> Email Receipt</button>
              </div>
              <button onClick={() => { setStep(1); setCart([]); setPaymentMethod(''); }} style={{ marginTop: 32, padding: '12px 24px', background: 'transparent', color: '#0284c7', border: '1px solid #0284c7', borderRadius: 8, cursor: 'pointer' }}>New Transaction</button>
            </div>
          )}
        </div>

        {/* Right Side: Step 2 Cart */}
        <div style={{ flex: 1, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: 16, borderBottom: '1px solid #e2e8f0', background: 'white', borderRadius: '8px 8px 0 0' }}>
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}><ShoppingCart size={20} /> Current Cart</h3>
          </div>
          <div style={{ padding: 16, flex: 1, overflowY: 'auto' }}>
            {cart.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#94a3b8', marginTop: 40 }}>Cart is empty</p>
            ) : (
              cart.map(item => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid #e2e8f0' }}>
                  <div>
                    <div style={{ fontWeight: 'bold' }}>{item.name}</div>
                    <div style={{ color: '#64748b', fontSize: 12 }}>${item.price} each</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <input type="number" value={item.qty} onChange={(e) => updateQty(item.id, parseInt(e.target.value))} style={{ width: 60, padding: 4 }} />
                    <div style={{ fontWeight: 'bold' }}>${item.price * item.qty}</div>
                  </div>
                </div>
              ))
            )}
          </div>
          <div style={{ padding: 16, background: 'white', borderTop: '1px solid #e2e8f0', borderRadius: '0 0 8px 8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, fontSize: 18, fontWeight: 'bold' }}>
              <span>Total:</span>
              <span>${cartTotal.toFixed(2)}</span>
            </div>
            {step === 1 && cart.length > 0 && (
              <button onClick={() => setStep(3)} style={{ width: '100%', padding: 12, background: '#0f172a', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 'bold' }}>
                PROCEED TO PAYMENT
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PharmacyPOS;
