import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { loadVatSafe, getVatForItem } from '../../services/vatService';
import './CustomerPharmacyPortal.css';

const API = '/api/pharmacy-sales';
const fmt = (n) => `ETB ${parseFloat(n || 0).toLocaleString('en-ET', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const statusColor = (s) => ({ 'PENDING': '#d97706', 'APPROVED': '#059669', 'REJECTED': '#dc2626', 'SHIPPED': '#2563eb' }[s] || '#64748b');

export default function CustomerCharmacyPortal() {
  const [tab, setTab] = useState('browse');
  const [drugs, setDrugs] = useState([]);
  const [branches, setBranches] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [customer, setCustomer] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('customer_token'));
  const [cart, setCart] = useState([]);
  const [trackCode, setTrackCode] = useState('');
  const [trackResult, setTrackResult] = useState(null);
  const [prescriptions, setPrescriptions] = useState([]);
  const [orderSuccess, setOrderSuccess] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Central VAT config (CEO Tax & VAT service)
  const [vatCtx, setVatCtx] = useState(null);
  useEffect(() => { loadVatSafe().then(setVatCtx).catch(() => {}); }, []);

  // Auth
  const [loginForm, setLoginForm] = useState({ phone: '', password: '' });
  const [regForm, setRegForm] = useState({ full_name: '', phone: '', password: '', email: '' });
  const [authError, setAuthError] = useState('');

  // Prescription form
  const [rxForm, setRxForm] = useState({ branch_id: '', drug_name_text: '', special_instructions: '', quantity_requested: 1, file_url: '' });
  const [rxSuccess, setRxSuccess] = useState(null);

  // Checkout
  const [deliveryType, setDeliveryType] = useState('WALK_IN'); // WALK_IN | DELIVERY
  const [checkoutBranch, setCheckoutBranch] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');

  useEffect(() => {
    loadDrugs();
    loadBranches();
    if (token) loadPrescriptions();
  }, [token]);

  // Auto-fill customer info on customer-portal login
  useEffect(() => {
    const saved = localStorage.getItem('customer_data');
    if (saved && token) setCustomer(JSON.parse(saved));
  }, [token]);

  // Also pre-fill login form from main app user (if staff/registered user is already logged in)
  useEffect(() => {
    const mainUser = localStorage.getItem('user');
    if (mainUser && !token) {
      try {
        const u = JSON.parse(mainUser);
        setLoginForm(prev => ({
          ...prev,
          phone: u.phone || prev.phone,
        }));
        setRegForm(prev => ({
          ...prev,
          full_name: u.full_name || u.name || prev.full_name,
          email: u.email || prev.email,
          phone: u.phone || prev.phone,
        }));
      } catch {}
    }
  }, []);

  const loadDrugs = async (q = '') => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/drugs`, { params: { search: q } });
      setDrugs(res.data.data || []);
    } catch { }
    setLoading(false);
  };

  const loadBranches = async () => {
    try {
      const res = await axios.get(`${API}/branches`);
      setBranches(res.data.data || []);
    } catch { }
  };

  const loadPrescriptions = async () => {
    let all = [];
    if (token) {
      try {
        const res = await axios.get(`${API}/prescriptions`, { headers: { Authorization: `Bearer ${token}` } });
        all = [...(res.data.data || [])];
      } catch { }
    }
    
    // Also fetch requests from the main app pharmacy (PharmacyHealthPage orders)
    const mainToken = localStorage.getItem('token');
    if (mainToken) {
      try {
        const res = await axios.get(`http://localhost:5000/api/pharmacy/requests/my-requests`, {
          headers: { Authorization: `Bearer ${mainToken}` }
        });
        const reqs = res.data.data || [];
        
        const existingRefs = new Set(all.map(r => r.reference_code || r.request_number));

        const mapped = reqs.map(r => ({
          id: `req_${r.id}`,
          reference_code: r.request_number,
          branch_name: 'Main Pharmacy',
          status: r.status,
          created_at: r.requested_at,
          drug_name: r.medication_name,
          quantity_requested: r.quantity,
          total_amount: r.total_amount,
          delivery_option: r.delivery_option,
          delivery_address: r.delivery_address,
          file_url: r.prescription_image,
        })).filter(r => !existingRefs.has(r.reference_code));
        all = [...all, ...mapped];
      } catch { }
    }
    
    // Sort combined list descending
    all.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    setPrescriptions(all);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      const res = await axios.post(`${API}/customer/login`, loginForm);
      const t = res.data.token;
      localStorage.setItem('customer_token', t);
      localStorage.setItem('customer_data', JSON.stringify(res.data.data));
      setToken(t);
      setCustomer(res.data.data);
      setTab('browse');
    } catch (err) {
      setAuthError(err.response?.data?.message || 'Login failed');
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      await axios.post(`${API}/customer/register`, regForm);
      setTab('login');
      setAuthError('Registered! Please log in.');
    } catch (err) {
      setAuthError(err.response?.data?.message || 'Registration failed');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('customer_token');
    localStorage.removeItem('customer_data');
    setToken(null);
    setCustomer(null);
    setPrescriptions([]);
    setCart([]);
    setTab('browse');
  };

  const handleSubmitRx = async (e) => {
    e.preventDefault();
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.post(`${API}/prescriptions`, rxForm, { headers });
      setRxSuccess(res.data.data);
      setRxForm({ branch_id: '', drug_name_text: '', special_instructions: '', quantity_requested: 1, file_url: '' });
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit prescription');
    }
  };

  const handleTrack = async (e) => {
    e.preventDefault();
    setTrackResult(null);
    try {
      const res = await axios.get(`${API}/prescriptions/track/${trackCode}`);
      setTrackResult(res.data.data);
    } catch (err) {
      setTrackResult({ error: err.response?.data?.message || 'Prescription not found' });
    }
  };

  // Cart operations
  const addToCart = (drug) => {
    setCart(c => {
      const ex = c.find(i => i.id === drug.id);
      if (ex) return c.map(i => i.id === drug.id ? { ...i, qty: i.qty + 1 } : i);
      return [...c, { ...drug, qty: 1 }];
    });
  };

  const updateQty = (id, qty) => {
    if (qty < 1) return removeFromCart(id);
    setCart(c => c.map(i => i.id === id ? { ...i, qty } : i));
  };

  const removeFromCart = (id) => setCart(c => c.filter(i => i.id !== id));

  const cartTotals = cart.reduce((acc, item) => {
    const sub = item.unit_price * item.qty;
    const vat = vatCtx ? getVatForItem(vatCtx, 'pharmacy', item.id, sub).vat : 0;
    return { subtotal: acc.subtotal + sub, vat: acc.vat + vat, total: acc.total + sub + vat };
  }, { subtotal: 0, vat: 0, total: 0 });

  const needsRx = cart.some(i => i.requires_prescription);

  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [paymentReference, setPaymentReference] = useState('');

  const handleCheckout = async () => {
    if (!token) { setCheckoutError('Please log in to place an order.'); return; }
    if (cart.length === 0) { setCheckoutError('Your cart is empty.'); return; }
    if (!checkoutBranch) { setCheckoutError('Please select a branch.'); return; }
    if (paymentMethod !== 'CASH' && !paymentReference.trim()) { setCheckoutError('Reference number is required for digital payments.'); return; }

    setSubmitting(true);
    setCheckoutError('');
    try {
      const res = await axios.post(`${API}/customer/orders`, {
        branch_id: parseInt(checkoutBranch),
        items: cart.map(i => ({ drug_id: i.id, quantity: i.qty })),
        delivery_type: deliveryType,
        delivery_address: deliveryAddress || null,
        paymentMethod: paymentMethod,
        paymentReference: paymentMethod !== 'CASH' ? paymentReference : null,
      }, { headers: { Authorization: `Bearer ${token}` } });
      setOrderSuccess(res.data.data);
      setCart([]);
      setPaymentReference('');
      setPaymentMethod('CASH');
    } catch (err) {
      setCheckoutError(err.response?.data?.message || 'Failed to place order');
    }
    setSubmitting(false);
  };

  const statusColor = (s) => {
    const m = { SUBMITTED: '#f59e0b', READY_FOR_PICKUP: '#2563eb', FULFILLED: '#059669', CANCELLED: '#dc2626', PENDING_VERIFICATION: '#7c3aed' };
    return m[s] || '#6b7280';
  };

  const cartCount = cart.reduce((a, i) => a + i.qty, 0);

  return (
    <div className="cp-portal">
      {/* ── Header ── */}
      <header className="cp-header">
        <div className="cp-header-inner">
          <div className="cp-brand">
            <div className="cp-brand-icon">💊</div>
            <div>
              <div className="cp-brand-name">SUTANA Pharmacy</div>
              <div className="cp-brand-sub">Ethiopia's trusted healthcare partner</div>
            </div>
          </div>

          <nav className="cp-nav">
            {[
              { id: 'browse', label: '🔍 Medicines' },
              { id: 'cart', label: `🛒 Cart${cartCount > 0 ? ` (${cartCount})` : ''}` },
              { id: 'prescriptions', label: '📋 Prescriptions' },
              { id: 'track', label: '📍 Track Order' },
            ].map(({ id, label }) => (
              <button key={id} className={`cp-nav-btn ${tab === id ? 'active' : ''}`} onClick={() => setTab(id)}>
                {label}
                {id === 'cart' && cartCount > 0 && <span className="cp-cart-badge">{cartCount}</span>}
              </button>
            ))}
          </nav>

          <div className="cp-auth-area">
            {token ? (
              <div className="cp-user-pill">
                <div className="cp-user-avatar">{(customer?.name || 'U')[0].toUpperCase()}</div>
                <div>
                  <span style={{ fontWeight: 600, display: 'block' }}>{customer?.name || 'My Account'}</span>
                  {customer?.email && <span style={{ fontSize: 11, color: '#6b7280' }}>{customer.email}</span>}
                </div>
                <button className="cp-logout-btn" onClick={handleLogout}>Sign Out</button>
              </div>
            ) : (
              <>
                <button className="cp-btn-outline" onClick={() => setTab('login')}>Log In</button>
                <button className="cp-btn-primary" onClick={() => setTab('register')}>Register</button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="cp-main">

        {/* ── BROWSE TAB ── */}
        {tab === 'browse' && (
          <div>
            <div className="cp-hero">
              <h2>Your Health, Delivered</h2>
              <p>Search over 10,000 medicines and healthcare products from SUTANA Pharmacy</p>
              <div className="cp-search-row">
                <input
                  className="cp-search"
                  placeholder="🔍  Search by drug name, strength, or category…"
                  value={search}
                  onChange={e => { setSearch(e.target.value); loadDrugs(e.target.value); }}
                />
              </div>
            </div>

            {loading ? (
              <div className="cp-loading">⏳ Loading medicines…</div>
            ) : (
              <div className="cp-drug-grid">
                {drugs.length === 0 && <p className="cp-empty">No medicines found for "{search}".</p>}
                {drugs.map(d => {
                  const inCart = cart.find(i => i.id === d.id);
                  return (
                    <div key={d.id} className="cp-drug-card">
                      <div className="cp-drug-header">
                        {d.drug_image || d.cover_image ? (
                          <img
                            src={`http://localhost:5000${d.drug_image || d.cover_image}`}
                            alt={d.name}
                            style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 8, border: '1px solid rgba(71,85,105,0.4)' }}
                            onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }}
                          />
                        ) : null}
                        <div className="cp-drug-icon" style={{ display: d.drug_image || d.cover_image ? 'none' : 'flex' }}>💊</div>
                        {d.requires_prescription && <span className="cp-rx-badge">Rx Required</span>}
                      </div>
                      <div className="cp-drug-name">{d.name}</div>
                      {d.strength && <div className="cp-drug-strength">{d.strength} · {d.unit}</div>}
                      {d.category && <span className="cp-drug-cat">{d.category}</span>}
                      {d.therapeutic_use && <p className="cp-drug-use">{d.therapeutic_use}</p>}
                      <div className="cp-drug-footer">
                        <div>
                          <div className="cp-drug-price">
                            {fmt(d.unit_price)}
                            {d.vat_rate > 0 && <small> +{d.vat_rate}% VAT</small>}
                          </div>
                        </div>
                        {d.requires_prescription ? (
                          <button className="cp-btn-rx" onClick={() => setTab('prescriptions')}>Submit Rx</button>
                        ) : inCart ? (
                          <span className="cp-in-cart-badge">✓ In Cart ({inCart.qty})</span>
                        ) : (
                          <button className="cp-btn-primary" style={{ fontSize: 12, padding: '7px 14px' }} onClick={() => addToCart(d)}>Add to Cart</button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── CART / CHECKOUT TAB ── */}
        {tab === 'cart' && (
          <div>
            {orderSuccess ? (
              <div className="cp-card cp-order-success">
                <div className="icon">🎉</div>
                <h2>Order Placed Successfully!</h2>
                <p>Your order has been received and is being prepared.</p>
                <p>Show this code at the pharmacy or quote it for delivery:</p>
                <div className="cp-order-code">{orderSuccess.sale_code}</div>
                <p style={{ fontSize: 12, color: '#6b7280', marginTop: 8 }}>
                  Total Amount: <strong>{fmt(orderSuccess.total_amount)}</strong>
                </p>
                <button className="cp-btn-primary" style={{ marginTop: 24, padding: '12px 32px' }}
                  onClick={() => { setOrderSuccess(null); setTab('browse'); }}>
                  Continue Shopping
                </button>
              </div>
            ) : (
              <div className="cp-checkout-layout">
                {/* Left: Cart Items */}
                <div className="cp-cart-section">
                  <div className="cp-cart-header">
                    <h2>Your Cart</h2>
                    {cart.length > 0 && (
                      <button className="cp-btn-ghost" style={{ fontSize: 12 }} onClick={() => setCart([])}>Clear All</button>
                    )}
                  </div>

                  {cart.length === 0 ? (
                    <div className="cp-card cp-empty-cart">
                      <div className="cp-empty-icon">🛒</div>
                      <h3>Your cart is empty</h3>
                      <p>Browse our medicines and add items to your cart</p>
                      <button className="cp-btn-primary" style={{ marginTop: 20 }} onClick={() => setTab('browse')}>Browse Medicines</button>
                    </div>
                  ) : (
                    cart.map(item => (
                      <div key={item.id} className="cp-cart-item">
                        <div className="cp-cart-item-icon">💊</div>
                        <div className="cp-cart-item-info">
                          <div className="cp-cart-item-name">{item.name}</div>
                          <div className="cp-cart-item-price">{fmt(item.unit_price)} each{item.vat_rate > 0 ? ` + ${item.vat_rate}% VAT` : ''}</div>
                        </div>
                        <div className="cp-qty-ctrl">
                          <button className="cp-qty-btn" onClick={() => updateQty(item.id, item.qty - 1)}>−</button>
                          <span className="cp-qty-num">{item.qty}</span>
                          <button className="cp-qty-btn" onClick={() => updateQty(item.id, item.qty + 1)}>+</button>
                        </div>
                        <div className="cp-cart-item-total">{fmt(item.unit_price * item.qty)}</div>
                        <button className="cp-remove-btn" onClick={() => removeFromCart(item.id)}>×</button>
                      </div>
                    ))
                  )}
                </div>

                {/* Right: Order Summary */}
                {cart.length > 0 && (
                  <div className="cp-summary-card">
                    <h3>Order Summary</h3>

                    <div className="cp-section-label">Pickup or Delivery</div>
                    <div className="cp-delivery-types">
                      {[
                        { id: 'WALK_IN', icon: '🏪', label: 'Walk-In Pickup' },
                        { id: 'DELIVERY', icon: '🚚', label: 'Delivery' },
                      ].map(t => (
                        <div key={t.id} className={`cp-delivery-type ${deliveryType === t.id ? 'active' : ''}`}
                          onClick={() => setDeliveryType(t.id)}>
                          <div className="icon">{t.icon}</div>
                          <div className="label">{t.label}</div>
                        </div>
                      ))}
                    </div>

                    {deliveryType === 'DELIVERY' && (
                      <div className="cp-input-group">
                        <label className="cp-input-label">Delivery Address *
                          <input className="cp-input" placeholder="Street, Area, City" value={deliveryAddress}
                            onChange={e => setDeliveryAddress(e.target.value)} />
                        </label>
                      </div>
                    )}

                    <div className="cp-divider" />

                    <div className="cp-section-label">Branch</div>
                    <select className="cp-input" value={checkoutBranch} onChange={e => setCheckoutBranch(e.target.value)}>
                      <option value="">Select Branch *</option>
                      {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>

                    <div className="cp-divider" />

                    {needsRx && (
                      <div className="cp-rx-warning">
                        ⚠️ Your cart contains prescription-only drugs. Our pharmacist will verify your prescription before processing.
                      </div>
                    )}

                    {!token && (
                      <div className="cp-rx-warning" style={{ color: '#1d4ed8', background: 'rgba(37,99,235,0.06)', borderColor: 'rgba(37,99,235,0.2)' }}>
                        🔐 <button className="cp-link" onClick={() => setTab('login')}>Log in</button> to place your order. Your cart will be saved.
                      </div>
                    )}

                    <div className="cp-divider" />

                    <div className="cp-section-label">Payment Method</div>
                    <div className="cp-delivery-types">
                      {[
                        { id: 'CASH', label: 'Cash on Delivery' },
                        { id: 'Bank Transfer', label: 'Bank Transfer' },
                        { id: 'Telebirr', label: 'Telebirr' },
                      ].map(t => (
                        <div key={t.id} className={`cp-delivery-type ${paymentMethod === t.id ? 'active' : ''}`}
                          onClick={() => setPaymentMethod(t.id)}
                          style={{ padding: '8px 12px', fontSize: 12 }}>
                          <div className="label">{t.label}</div>
                        </div>
                      ))}
                    </div>

                    {paymentMethod !== 'CASH' && (
                      <div className="cp-input-group" style={{ marginTop: 10 }}>
                        <label className="cp-input-label">Reference Number *
                          <input className="cp-input" placeholder="Enter transaction reference" value={paymentReference}
                            onChange={e => setPaymentReference(e.target.value)} />
                        </label>
                      </div>
                    )}

                    <div className="cp-divider" />

                    <div className="cp-summary-row"><span>Subtotal</span><span>{fmt(cartTotals.subtotal)}</span></div>
                    <div className="cp-summary-row"><span>VAT</span><span>{fmt(cartTotals.vat)}</span></div>
                    <div className="cp-summary-total">
                      <span>Total</span><span>{fmt(cartTotals.total)}</span>
                    </div>

                    {checkoutError && <div className="cp-alert error" style={{ marginTop: 14 }}>{checkoutError}</div>}

                    <button className="cp-btn-success" style={{ marginTop: 18 }}
                      disabled={submitting || cart.length === 0 || !token}
                      onClick={handleCheckout}>
                      {submitting ? 'Placing Order…' : `✅ Place Order — ${fmt(cartTotals.total)}`}
                    </button>

                    <p style={{ fontSize: 11, color: '#9ca3af', textAlign: 'center', marginTop: 10 }}>
                      {paymentMethod === 'CASH' ? 'Payment collected at pickup / upon delivery' : 'Your payment will be verified by finance'}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── PRESCRIPTIONS TAB ── */}
        {tab === 'prescriptions' && (
          <div className="cp-rx-tab">
            <div className="cp-section-title">📋 Submit a Prescription</div>
            <div className="cp-rx-layout">
              <div className="cp-card">
                <h3>New Prescription Request</h3>
                {rxSuccess ? (
                  <div className="cp-success-box">
                    <div className="cp-success-icon">✅</div>
                    <h4>Prescription Submitted!</h4>
                    <p>Your reference code:</p>
                    <div className="cp-ref-code">{rxSuccess.reference_code}</div>
                    <p className="cp-ref-hint">Save this code to track your prescription status.</p>
                    <button className="cp-btn-primary" onClick={() => setRxSuccess(null)}>Submit Another</button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmitRx} className="cp-rx-form">
                    <label>Branch <span className="req">*</span>
                      <select value={rxForm.branch_id} onChange={e => setRxForm(f => ({ ...f, branch_id: e.target.value }))} required>
                        <option value="">Select branch</option>
                        {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                      </select>
                    </label>
                    <label>Medicine Name (if known)
                      <input placeholder="e.g. Amoxicillin 500mg" value={rxForm.drug_name_text}
                        onChange={e => setRxForm(f => ({ ...f, drug_name_text: e.target.value }))} />
                    </label>
                    <label>Quantity Requested
                      <input type="number" min="1" value={rxForm.quantity_requested}
                        onChange={e => setRxForm(f => ({ ...f, quantity_requested: parseInt(e.target.value) }))} />
                    </label>
                    <label>Prescription File URL <span className="req">*</span>
                      <input placeholder="https://… or ask staff to scan" value={rxForm.file_url} required
                        onChange={e => setRxForm(f => ({ ...f, file_url: e.target.value }))} />
                    </label>
                    <label>Special Instructions
                      <textarea rows="3" placeholder="Any notes for the pharmacist"
                        value={rxForm.special_instructions}
                        onChange={e => setRxForm(f => ({ ...f, special_instructions: e.target.value }))} />
                    </label>
                    <button type="submit" className="cp-btn-primary cp-btn-full">Submit Prescription</button>
                    {!token && <p className="cp-hint">💡 <button className="cp-link" onClick={() => setTab('login')}>Log in</button> to track your submission history.</p>}
                  </form>
                )}
              </div>

              {token && (
                <div className="cp-card">
                  <h3>My Submissions</h3>
                  {prescriptions.length === 0 ? (
                    <p className="cp-empty" style={{ paddingTop: 20 }}>No prescriptions submitted yet.</p>
                  ) : (
                    <div className="cp-rx-list">
                      {prescriptions.map(rx => (
                        <div key={rx.id} className="cp-rx-item" onClick={() => setSelectedOrder(rx)} style={{ cursor: 'pointer', transition: 'all 0.2s ease' }} onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseOut={e => e.currentTarget.style.transform = 'none'}>
                          <div className="cp-rx-ref">{rx.reference_code}</div>
                          <div className="cp-rx-meta">
                            <span>{rx.branch_name}</span>
                            <span style={{ color: statusColor(rx.status), fontWeight: 700 }}>{rx.status?.replace(/_/g, ' ')}</span>
                          </div>
                          <div className="cp-rx-date">{new Date(rx.created_at).toLocaleDateString()}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── TRACK TAB ── */}
        {tab === 'track' && (
          <div>
            <div className="cp-card cp-card-center">
              <div className="cp-track-icon">📍</div>
              <h2>Track Your Order / Prescription</h2>
              <p>Enter your reference code to check the current status</p>
              <form onSubmit={handleTrack} className="cp-track-form">
                <input className="cp-track-input" placeholder="e.g. RX-20260705-AB12 or ORD-…"
                  value={trackCode} onChange={e => setTrackCode(e.target.value)} required />
                <button type="submit" className="cp-btn-primary">Track Now</button>
              </form>
              {trackResult && !trackResult.error && (
                <div className="cp-track-result">
                  <div className="cp-status-badge" style={{ background: statusColor(trackResult.status) }}>
                    {trackResult.status?.replace(/_/g, ' ')}
                  </div>
                  <p><strong>Branch:</strong> {trackResult.branch_name}</p>
                  <p><strong>Submitted:</strong> {new Date(trackResult.created_at).toLocaleString()}</p>
                  {trackResult.status === 'READY_FOR_PICKUP' && (
                    <div className="cp-pickup-notice">🎉 Your prescription is ready! Please come to {trackResult.branch_name}.</div>
                  )}
                </div>
              )}
              {trackResult?.error && <div className="cp-error-box">❌ {trackResult.error}</div>}
            </div>
          </div>
        )}

        {/* ── LOGIN TAB ── */}
        {tab === 'login' && (
          <div className="cp-auth-tab">
            <div className="cp-auth-card">
              <h2>Welcome Back</h2>
              <p className="subtitle">Sign in to manage your orders & prescriptions</p>
              {authError && <div className={`cp-auth-msg ${authError.includes('success') || authError.includes('Registered') ? 'success' : 'error'}`}>{authError}</div>}
              <form onSubmit={handleLogin}>
                <label>Phone Number
                  <input type="tel" placeholder="09XXXXXXXX" value={loginForm.phone}
                    onChange={e => setLoginForm(f => ({ ...f, phone: e.target.value }))} required />
                </label>
                <label>Password
                  <input type="password" value={loginForm.password}
                    onChange={e => setLoginForm(f => ({ ...f, password: e.target.value }))} required />
                </label>
                <button type="submit" className="cp-btn-primary cp-btn-full">Sign In</button>
              </form>
              <p className="cp-switch">Don't have an account? <button className="cp-link" onClick={() => setTab('register')}>Register now</button></p>
            </div>
          </div>
        )}

        {/* ── REGISTER TAB ── */}
        {tab === 'register' && (
          <div className="cp-auth-tab">
            <div className="cp-auth-card">
              <h2>Create Account</h2>
              <p className="subtitle">Join SUTANA Pharmacy for faster service</p>
              {authError && <div className="cp-auth-msg error">{authError}</div>}
              <form onSubmit={handleRegister}>
                <label>Full Name <span className="req">*</span>
                  <input placeholder="Your full name" value={regForm.full_name}
                    onChange={e => setRegForm(f => ({ ...f, full_name: e.target.value }))} required />
                </label>
                <label>Phone Number <span className="req">*</span>
                  <input type="tel" placeholder="09XXXXXXXX" value={regForm.phone}
                    onChange={e => setRegForm(f => ({ ...f, phone: e.target.value }))} required />
                </label>
                <label>Email (optional)
                  <input type="email" placeholder="email@example.com" value={regForm.email}
                    onChange={e => setRegForm(f => ({ ...f, email: e.target.value }))} />
                </label>
                <label>Password <span className="req">*</span>
                  <input type="password" placeholder="Choose a strong password" value={regForm.password}
                    onChange={e => setRegForm(f => ({ ...f, password: e.target.value }))} required />
                </label>
                <button type="submit" className="cp-btn-primary cp-btn-full">Create Account</button>
              </form>
              <p className="cp-switch">Already registered? <button className="cp-link" onClick={() => setTab('login')}>Sign In</button></p>
            </div>
          </div>
        )}

      </main>

      {/* ── Order Detail Modal ── */}
      {selectedOrder && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setSelectedOrder(null)}>
          <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 550, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', overflow: 'hidden', display: 'flex', flexDirection: 'column', animation: 'cp-fade-in 0.2s ease-out' }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '24px 32px', background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#0f172a', fontWeight: 700 }}>Order Details</h3>
                <div style={{ fontSize: '0.875rem', color: '#64748b', marginTop: 4 }}>Ref: {selectedOrder.reference_code}</div>
              </div>
              <button onClick={() => setSelectedOrder(null)} style={{ background: 'transparent', border: 'none', fontSize: 24, cursor: 'pointer', color: '#94a3b8' }}>&times;</button>
            </div>
            
            <div style={{ padding: 32, flex: 1, overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, paddingBottom: 16, borderBottom: '1px dashed #cbd5e1' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', fontWeight: 600, marginBottom: 4 }}>Status</div>
                  <div style={{ color: statusColor(selectedOrder.status), fontWeight: 700, fontSize: '1.125rem' }}>{selectedOrder.status?.replace(/_/g, ' ')}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', fontWeight: 600, marginBottom: 4 }}>Date Submitted</div>
                  <div style={{ color: '#334155', fontWeight: 500 }}>{new Date(selectedOrder.created_at).toLocaleString()}</div>
                </div>
              </div>

              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', fontWeight: 600, marginBottom: 8 }}>Item Information</div>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 16 }}>
                  <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '1rem', marginBottom: 4 }}>{selectedOrder.drug_name || selectedOrder.drug_name_text || 'Prescription Request'}</div>
                  <div style={{ color: '#475569', fontSize: '0.875rem' }}>Quantity: <strong>{selectedOrder.quantity_requested || 1}</strong></div>
                  {selectedOrder.total_amount && <div style={{ color: '#059669', fontSize: '1rem', fontWeight: 700, marginTop: 8 }}>Total: {selectedOrder.total_amount} ETB</div>}
                </div>
              </div>

              {(selectedOrder.delivery_option || selectedOrder.branch_name) && (
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', fontWeight: 600, marginBottom: 8 }}>Fulfillment</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    {selectedOrder.branch_name && (
                      <div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Branch</div>
                        <div style={{ fontWeight: 500, color: '#334155' }}>{selectedOrder.branch_name}</div>
                      </div>
                    )}
                    {selectedOrder.delivery_option && (
                      <div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Type</div>
                        <div style={{ fontWeight: 500, color: '#334155', textTransform: 'capitalize' }}>{selectedOrder.delivery_option}</div>
                      </div>
                    )}
                    {selectedOrder.delivery_address && (
                      <div style={{ gridColumn: '1 / -1' }}>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Address</div>
                        <div style={{ fontWeight: 500, color: '#334155' }}>{selectedOrder.delivery_address}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {(selectedOrder.special_instructions || selectedOrder.file_url) && (
                <div>
                  <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', fontWeight: 600, marginBottom: 8 }}>Additional Details</div>
                  {selectedOrder.special_instructions && (
                    <div style={{ padding: 12, background: '#fffbeb', color: '#92400e', borderRadius: 6, fontSize: '0.875rem', marginBottom: 12 }}>
                      {selectedOrder.special_instructions}
                    </div>
                  )}
                  {selectedOrder.file_url && (
                    <a href={`http://localhost:5000${selectedOrder.file_url}`} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 16px', background: '#eff6ff', color: '#1d4ed8', borderRadius: 6, textDecoration: 'none', fontSize: '0.875rem', fontWeight: 500 }}>
                      <span>📎</span> View Attached Prescription
                    </a>
                  )}
                </div>
              )}
            </div>
            <div style={{ padding: '16px 32px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', textAlign: 'right' }}>
              <button className="cp-btn-primary" onClick={() => setSelectedOrder(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
