import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from '../../services/apiClient';
import { loadVatSafe, getVatForItem } from '../../services/vatService';
import authService from '../../services/authService';
import { PublicNav } from './PublicNavFooter';
import {
  Store, ShoppingCart, Search, Package, Plus, Minus, Trash2, X,
  CheckCircle, Star, Zap, TrendingUp, ArrowRight, Truck, Phone,
  Mail, FileText, Shield, Info, CreditCard, Box, ChevronDown,
  ChevronUp, Clock, Banknote, User, LogIn, UserPlus, AlignLeft,
  UploadCloud, AlertTriangle, Check, LogOut, ShieldAlert
} from 'lucide-react';
import retailStoreHero from '../../assets/hero-section/retail store.jpg';
import './LandingRedesign.css';
import './RetailStorePage.css';

/* ─── Constants ─────────────────────────────────────────────────── */
const HOW_TO_BUY = [
  { n: '1', title: 'Buy Direct (In-Stock)',   desc: 'Browse available products, add to cart, and check out instantly.',              icon: Package },
  { n: '2', title: 'Order from Supplier',     desc: 'Request out-of-stock items. We source directly from trusted suppliers.',        icon: Truck   },
];

const FAQS = [
  { q: 'How do supplier orders work?',          a: 'If an item is out of stock, you can still request it. We will confirm the price and delivery timeline from our suppliers before finalizing your order.' },
  { q: 'What is the wait time for supplier orders?', a: 'Supplier orders typically take 3-7 business days depending on availability and logistics.' },
  { q: 'What if a requested item is unavailable?', a: 'If we cannot source the item from our suppliers, your request will be cancelled and any deposits fully refunded.' },
];

/* ─── Component ─────────────────────────────────────────────────── */
const RetailStorePage = () => {
  const navigate  = useNavigate();
  const location  = useLocation();
  const [products,   setProducts]   = useState([]);
  const [categories, setCategories] = useState([]);
  const [search,     setSearch]     = useState('');
  const [catFilter,  setCatFilter]  = useState('all');
  const [loading,    setLoading]    = useState(true);
  const [user,       setUser]       = useState(null);

  const [cartOpen,       setCartOpen]       = useState(false);
  const [cartItems,      setCartItems]      = useState([]);
  const [vatCtx,         setVatCtx]         = useState(null);
  useEffect(() => { loadVatSafe().then(setVatCtx).catch(() => {}); }, []);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [placingOrder,   setPlacingOrder]   = useState(false);
  const [orderSuccess,   setOrderSuccess]   = useState(null);
  const [roleWarning,    setRoleWarning]    = useState(false);

  const [orderForm, setOrderForm] = useState({
    delivery_type:    'pickup',
    delivery_address: '',
    notes:            '',
    customer_name:    '',
    customer_email:   '',
    customer_phone:   '',
  });

  // ── Payment proof (payment ID OR screenshot — at least one required) ──
  const [paymentMethod,      setPaymentMethod]      = useState('bank_transfer');
  const [paymentRef,         setPaymentRef]         = useState('');
  const [paymentProofFile,   setPaymentProofFile]   = useState(null);
  const [paymentProofPreview,setPaymentProofPreview]= useState('');
  const [paymentError,       setPaymentError]       = useState('');
  const [formError,          setFormError]          = useState('');
  const [financeAccounts,    setFinanceAccounts]    = useState([]);
  const paymentProofInputRef = useRef(null);
  const submitErrorRef       = useRef(null);

  const loadFinanceAccounts = async () => {
    try {
      const result = await axios.get('/finance-bank');
      if (result && result.success && Array.isArray(result.data)) setFinanceAccounts(result.data);
      else if (Array.isArray(result)) setFinanceAccounts(result);
      else if (result && Array.isArray(result.data)) setFinanceAccounts(result.data);
    } catch (e) {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const r2 = await axios.get('/finance-bank', { headers: { Authorization: `Bearer ${token}` } });
          if (r2 && Array.isArray(r2.data)) setFinanceAccounts(r2.data);
          else if (Array.isArray(r2)) setFinanceAccounts(r2);
        } catch (e2) { console.error('[RetailStorePage] Finance accounts load failed:', e2.message); }
      }
    }
  };

  const scrollFormError = () => {
    setTimeout(() => {
      submitErrorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 50);
  };

  const handlePaymentProofChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setPaymentProofFile(file);
    setPaymentProofPreview(URL.createObjectURL(file));
    setPaymentError('');
    setFormError('');
  };

  const clearPaymentProof = () => {
    setPaymentProofFile(null);
    setPaymentProofPreview('');
    if (paymentProofInputRef.current) paymentProofInputRef.current.value = '';
  };

  const [openFaq, setOpenFaq] = useState(null);

  // ── On mount: load user, cart, products, categories; auto-open modal if returning from login
  useEffect(() => {
    let parsedUser = null;
    try {
      const raw = localStorage.getItem('user');
      if (raw) {
        parsedUser = JSON.parse(raw);
        setUser(parsedUser);
        setOrderForm(prev => ({
          ...prev,
          customer_name:  parsedUser.fullName  || parsedUser.full_name || '',
          customer_email: parsedUser.email     || '',
          customer_phone: parsedUser.phone     || '',
        }));
      }
    } catch {}

    axios.get('/retail/products')
      .then(r => setProducts(Array.isArray(r?.data?.products) ? r.data.products : []))
      .catch(() => {})
      .finally(() => setLoading(false));

    axios.get('/retail/categories')
      .then(r => setCategories(Array.isArray(r?.data) ? r.data : []))
      .catch(() => {});

    const parsedRoles = Array.isArray(parsedUser?.roles)
      ? parsedUser.roles.map(r => String(r).toLowerCase())
      : [];
    const isCustomerAccount = parsedRoles.includes('customer');

    if (parsedUser && isCustomerAccount) {
      const pendingProductId = location.state?.pendingRetailCartItem || sessionStorage.getItem('pendingRetailCartItem');
      const shouldOpenCart   = location.state?.openRetailCart || sessionStorage.getItem('openRetailCart') === 'true';

      const loadCartAndOpen = () => {
        axios.get('/retail/cart')
          .then(r => {
            const items = r?.data?.items || [];
            setCartItems(Array.isArray(items) ? items : []);
            if (shouldOpenCart) {
              sessionStorage.removeItem('openRetailCart');
              setCartOpen(true);
              window.history.replaceState({}, document.title);
            }
          })
          .catch(() => {
            if (shouldOpenCart) {
              sessionStorage.removeItem('openRetailCart');
              setCartOpen(true);
              window.history.replaceState({}, document.title);
            }
          });
      };

      if (pendingProductId) {
        sessionStorage.removeItem('pendingRetailCartItem');
        axios.post('/retail/cart/add', { product_id: pendingProductId, quantity: 1 })
          .then(() => loadCartAndOpen())
          .catch(() => loadCartAndOpen());
      } else {
        loadCartAndOpen();
      }
    } else {
      if (sessionStorage.getItem('openRetailCart') === 'true') {
        sessionStorage.removeItem('openRetailCart');
        sessionStorage.removeItem('pendingRetailCartItem');
      }
    }
    
    loadFinanceAccounts();
  }, [location]);

  const loadCart = () => {
    axios.get('/retail/cart')
      .then(r => setCartItems(Array.isArray(r?.data?.items) ? r.data.items : []))
      .catch(() => {});
  };

  const addToCart = async (product) => {
    setSelectedProduct(product);
    setOrderSuccess(null);
    if (!user) {
      sessionStorage.setItem('openRetailCart', 'true');
      sessionStorage.setItem('pendingRetailCartItem', product.id.toString());
      navigate('/login', { state: { from: '/services/retail' } });
      return;
    }
    const roles = Array.isArray(user?.roles) ? user.roles.map(r => String(r).toLowerCase()) : [];
    if (!roles.includes('customer')) {
      setRoleWarning(true);
      return;
    }
    try {
      await axios.post('/retail/cart/add', { product_id: product.id, quantity: 1 });
      loadCart();
      setCartOpen(true);
    } catch (err) {
      alert(err?.message || 'Failed to add to cart');
    }
  };

  const updateQty = async (itemId, newQty) => {
    if (newQty < 1) return removeItem(itemId);
    try {
      await axios.put('/retail/cart/item/' + itemId, { quantity: newQty });
      loadCart();
    } catch (_) {}
  };

  const removeItem = async (itemId) => {
    try {
      await axios.delete('/retail/cart/item/' + itemId);
      loadCart();
    } catch (_) {}
  };

  const placeOrder = async () => {
    const orderRoles = Array.isArray(user?.roles) ? user.roles.map(r => String(r).toLowerCase()) : [];
    if (!orderRoles.includes('customer')) {
      setRoleWarning(true);
      return;
    }
    if (cartItems.length === 0) return;
    const missing = [];
    if (!(orderForm.customer_name  || '').trim()) missing.push('Full Name');
    if (!(orderForm.customer_email || '').trim()) missing.push('Email');
    if (!(orderForm.customer_phone || '').trim()) missing.push('Phone Number');
    if (missing.length) {
      setFormError(`Please fill in: ${missing.join(', ')}`);
      scrollFormError();
      return;
    }
    const ref = paymentRef.trim();
    if (paymentMethod) {
      const acc = financeAccounts.find(a => String(a.id) === String(paymentMethod));
      if (acc && acc.account_type !== 'Cash') {
        if (!ref && !paymentProofFile) {
          setPaymentError('For Bank or Telebirr payments, please provide either a Reference ID or a Payment Receipt.');
          setFormError('For Bank or Telebirr payments, please provide either a Reference ID or a Payment Receipt.');
          scrollFormError();
          return;
        }
        if (ref && paymentProofFile) {
          setPaymentError('Please provide either a Reference ID OR a Payment Receipt, but not both.');
          setFormError('Please provide either a Reference ID OR a Payment Receipt, but not both.');
          scrollFormError();
          return;
        }
      }
    } else {
      setPaymentError('Please select a payment method.');
      setFormError('Please select a payment method.');
      scrollFormError();
      return;
    }
    
    setPlacingOrder(true);
    setPaymentError('');
    setFormError('');
    try {
      const formData = new FormData();
      Object.entries(orderForm).forEach(([k, v]) => {
        if (k === 'delivery_type') return;
        formData.append(k, v);
      });
      formData.append('delivery_type', orderForm.delivery_address ? 'delivery' : 'pickup');
      formData.append('payment_method', paymentMethod);
      formData.append('payment_ref', ref);
      if (paymentProofFile) formData.append('payment_proof', paymentProofFile);

      const res = await axios.post('/retail/orders/place', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const invoice = res.data?.data?.invoice_number || res.data?.invoice_number || 'N/A';
      setOrderSuccess(invoice);
      setCartItems([]);
      clearPaymentProof();
    } catch (err) {
      const msg = err?.message || 'Failed to place order. Please try again.';
      setFormError(msg);
      scrollFormError();
      alert(msg);
    } finally {
      setPlacingOrder(false);
    }
  };

  const filtered = products.filter(p => {
    const matchSearch = !search ||
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.category_name?.toLowerCase().includes(search.toLowerCase()) ||
      p.description?.toLowerCase().includes(search.toLowerCase());
    const matchCat = catFilter === 'all' || String(p.category_id) === String(catFilter);
    return matchSearch && matchCat && p.is_active !== 0 && p.is_active !== false;
  });

  const cartCount = cartItems.reduce((a, b) => a + (b.quantity || 0), 0);
  const cartTotal = cartItems.reduce((acc, item) => acc + (parseFloat(item.price) * item.quantity), 0);
  let cartVat = 0;
  if (vatCtx) {
    cartItems.forEach(item => {
      const r = getVatForItem(vatCtx, 'retail', item.product_id, parseFloat(item.price) * item.quantity);
      cartVat += r.vat;
    });
  }

  const imgSrc = (url) => {
    if (!url) return null;
    return url.startsWith('http') ? url : 'http://localhost:5000' + url;
  };

  return (
    <div className="rsp-root">
      <PublicNav />

      {/* ─── Hero Section ─── */}
      <div className="rsp-hero">
        <div className="rsp-hero-bg" style={{ backgroundImage: `url("${retailStoreHero}")` }} />
        <div className="rsp-hero-overlay" />
        <div className="rsp-hero-content">
          <div className="rsp-hero-badge">
            <Zap size={14} /> SUTANA RETAIL HUB
          </div>
          <h1 className="rsp-hero-title">
            Shop Premium <span>Commercial</span> Goods
          </h1>
          <p className="rsp-hero-sub">
            Direct access to high-quality supplies, materials, and specialized items tailored for modern enterprises.
          </p>
          <div className="rsp-hero-search-wrap">
            <div className="rsp-search">
              <Search size={18} color="rgba(255,255,255,0.8)" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search products..."
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* ─── Trust Strip ─── */}
      <div className="rsp-trust-strip">
        <div className="rsp-container">
          <div className="rsp-trust-inner">
            <div className="rsp-trust-item">
              <Shield size={18} /> Verified Quality <span>Products</span>
            </div>
            <div className="rsp-trust-item">
              <Truck size={18} /> Fast Nationwide <span>Delivery</span>
            </div>
            <div className="rsp-trust-item">
              <CheckCircle size={18} /> Secure <span>Payments</span>
            </div>
            <div className="rsp-trust-item">
              <Phone size={18} /> 24/7 Premium <span>Support</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Sticky Toolbar ─── */}
      <div className="rsp-toolbar">
        <div className="rsp-container">
          <div className="rsp-toolbar-inner">
            <span className="rsp-toolbar-label">Categories:</span>
            <button
              className={'rsp-cat-pill' + (catFilter === 'all' ? ' active' : '')}
              onClick={() => setCatFilter('all')}
            >
              All Products
            </button>
            {categories.map(c => (
              <button
                key={c.id}
                className={'rsp-cat-pill' + (String(catFilter) === String(c.id) ? ' active' : '')}
                onClick={() => setCatFilter(String(c.id))}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Product Grid ─── */}
      <div className="rsp-main">
        <div className="rsp-container">
          <h2 className="rsp-products-heading">
            {catFilter === 'all' ? 'Featured Selection' : categories.find(c => String(c.id) === catFilter)?.name || 'Products'}
          </h2>
          <p className="rsp-products-count">Showing {filtered.length} items</p>

          {loading ? (
            <div className="rsp-grid">
              {[1,2,3,4,5,6].map(i => <div key={i} className="rsp-shimmer" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="rsp-no-results">
              <Package size={48} color="hsl(var(--muted-foreground))" style={{ margin: '0 auto' }} />
              <h3>No products found</h3>
              <p>Try a different search term or category.</p>
            </div>
          ) : (
            <div className="rsp-grid">
              {filtered.map(p => (
                <div key={p.id} className="rsp-card">
                  <div className="rsp-card-img-wrap">
                    {imgSrc(p.product_image) ? (
                      <img src={imgSrc(p.product_image)} className="rsp-card-img" alt={p.name} />
                    ) : (
                      <Package size={44} color="hsl(var(--muted-foreground))" />
                    )}
                    {(p.stock_quantity !== null && p.stock_quantity !== undefined && p.stock_quantity <= 0) && (
                      <div className="rsp-card-oos">Out of Stock</div>
                    )}
                  </div>
                  <div className="rsp-card-body">
                    <span className="rsp-card-cat">{p.category_name || 'General'}</span>
                    <h3 className="rsp-card-name">{p.name}</h3>
                    {p.description && <p className="rsp-card-desc">{p.description}</p>}
                    <div className="rsp-card-footer">
                      <div>
                        <div className="rsp-price">{parseFloat(p.price || p.selling_price || 0).toLocaleString()} ETB</div>
                      </div>
                      <button
                        className="rsp-add-btn"
                        disabled={p.stock_quantity !== null && p.stock_quantity !== undefined && p.stock_quantity <= 0}
                        onClick={e => { e.stopPropagation(); addToCart(p); }}
                      >
                        <Plus size={16} /> Add to Cart
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Section: How to Buy ── */}
      <section className="rsp-section-muted">
        <div className="rsp-container">
          <div className="rsp-section-header">
            <span className="rsp-section-eyebrow">The Process</span>
            <h2 className="rsp-section-title">How to Buy</h2>
            <p className="rsp-section-sub">Two simple ways to get exactly what you need, with transparent sourcing and direct delivery.</p>
          </div>
          <div className="rsp-how-grid">
            {HOW_TO_BUY.map(step => (
              <div key={step.n} className="rsp-how-card">
                <div className="rsp-how-step">Step {step.n}</div>
                <div className="rsp-how-icon"><step.icon size={22} color="#ffffff" /></div>
                <h3 className="rsp-how-title">{step.title}</h3>
                <p className="rsp-how-desc">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section: Delivery & Payment ── */}
      <section className="rsp-section">
        <div className="rsp-container">
          <div className="rsp-dp-grid">
            <div className="rsp-dp-card">
              <h2 className="rsp-dp-head"><Truck size={20} /> Delivery & Pickup</h2>
              <div className="rsp-dp-row">
                <div className="rsp-dp-row-icon"><Truck size={18} color="#ffffff" /></div>
                <div>
                  <p className="rsp-dp-row-title">Standard Delivery</p>
                  <p className="rsp-dp-row-desc">Available in major areas. Fees calculated at checkout. Delivery within 1-2 business days for in-stock items.</p>
                </div>
              </div>
              <div className="rsp-dp-row">
                <div className="rsp-dp-row-icon"><Store size={18} color="#ffffff" /></div>
                <div>
                  <p className="rsp-dp-row-title">Store Pickup</p>
                  <p className="rsp-dp-row-desc">Free pickup from our main branch. Ready within 2 hours for in-stock items.</p>
                </div>
              </div>
            </div>
            <div className="rsp-dp-card">
              <h2 className="rsp-dp-head"><CreditCard size={20} /> Payment Options</h2>
              <div className="rsp-dp-row">
                <div className="rsp-dp-row-icon"><Banknote size={18} color="#ffffff" /></div>
                <div>
                  <p className="rsp-dp-row-title">Bank Transfer</p>
                  <p className="rsp-dp-row-desc">Direct transfer to our accounts (CBE, Awash, etc.)</p>
                </div>
              </div>
              <div className="rsp-dp-row">
                <div className="rsp-dp-row-icon"><CreditCard size={18} color="#ffffff" /></div>
                <div>
                  <p className="rsp-dp-row-title">Mobile Money</p>
                  <p className="rsp-dp-row-desc">Telebirr, CBE Birr, and other wallets supported.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section: FAQs ── */}
      <section className="rsp-section-muted">
        <div className="rsp-faq-container">
          <div className="rsp-section-header">
            <span className="rsp-section-eyebrow">Support</span>
            <h2 className="rsp-section-title">Common Questions</h2>
            <p className="rsp-section-sub">Find answers to the most frequently asked questions about our retail process.</p>
          </div>
          <div>
            {FAQS.map((f, i) => (
              <div key={i} className="rsp-faq-item">
                <button className="rsp-faq-btn" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                  <span>{f.q}</span>
                  {openFaq === i
                    ? <ChevronUp   size={18} color="hsl(var(--primary))" style={{ flexShrink: 0 }} />
                    : <ChevronDown size={18} color="hsl(var(--muted-foreground))" style={{ flexShrink: 0 }} />}
                </button>
                {openFaq === i && <div className="rsp-faq-ans">{f.a}</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Cart FAB ── */}
      {cartCount > 0 && (
        <button className="rsp-cart-fab" onClick={() => setCartOpen(true)} title="View Cart">
          <ShoppingCart size={24} />
          <span className="rsp-cart-badge">{cartCount > 99 ? '99+' : cartCount}</span>
        </button>
      )}

      {/* ─────────────── ORDER MODAL ─────────────── */}
      {cartOpen && (
        <div className="rsp-overlay" onClick={() => setCartOpen(false)}>
          <div className="rsp-modal" onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div className="rsp-modal-header">
              <div>
                <h3 className="rsp-modal-title">
                  <ShoppingCart size={22} /> Complete Your Order
                </h3>
                <p className="rsp-modal-subtitle">Review your items and provide shipping details</p>
              </div>
              <button className="rsp-close-btn" onClick={() => setCartOpen(false)}><X size={20} strokeWidth={2.5} /></button>
            </div>

            {/* ── SUCCESS ── */}
            {orderSuccess ? (
              <div className="rsp-success-body">
                <div className="rsp-success-icon-wrap">
                  <Check size={32} color="#ffffff" strokeWidth={3} />
                </div>
                <h3 className="rsp-success-title">Order Received!</h3>
                <p className="rsp-success-sub">
                  Invoice <strong>{orderSuccess}</strong> has been generated successfully.<br />
                  Our team will process it and reach out shortly.
                </p>
                <div className="rsp-success-actions">
                  <button className="rsp-view-orders-btn" onClick={() => navigate('/customer/orders')}>
                    <Package size={18} /> View My Orders
                  </button>
                  <button className="rsp-cancel-btn" onClick={() => { setOrderSuccess(null); setCartOpen(false); }}>
                    Continue Shopping
                  </button>
                </div>
                <p className="rsp-success-note">
                  Track this order in your Customer Dashboard under the Orders section.
                </p>
              </div>

            ) : (
              /* ── ORDER FORM ── */
              <form onSubmit={e => { e.preventDefault(); placeOrder(); }} noValidate>
                <div className="rsp-modal-body">

                  {/* Customer Info */}
                  <div className="rsp-customer-box">
                    <div className="rsp-section-divider">
                      <User size={14} /> Contact Details
                    </div>
                    <div className="rsp-form-row" style={{ marginTop: '1rem' }}>
                      <div className="rsp-form-group">
                        <label className="rsp-form-label">Full Name *</label>
                        <input
                          type="text"
                          className="rsp-form-input"
                          required
                          placeholder="Your full name"
                          value={orderForm.customer_name}
                          onChange={e => setOrderForm(prev => ({ ...prev, customer_name: e.target.value }))}
                        />
                      </div>
                      <div className="rsp-form-group">
                        <label className="rsp-form-label">Email Address *</label>
                        <input
                          type="email"
                          className="rsp-form-input"
                          required
                          placeholder="your@email.com"
                          value={orderForm.customer_email}
                          onChange={e => setOrderForm(prev => ({ ...prev, customer_email: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div className="rsp-form-group" style={{ marginTop: '0.75rem' }}>
                      <label className="rsp-form-label">Phone Number *</label>
                      <input
                        type="tel"
                        className="rsp-form-input"
                        required
                        placeholder="e.g. +251 911 000 000"
                        value={orderForm.customer_phone}
                        onChange={e => setOrderForm(prev => ({ ...prev, customer_phone: e.target.value }))}
                      />
                    </div>
                  </div>

                  {/* Cart Items */}
                  <div className="rsp-section-divider">
                    <Box size={14} /> Order Summary
                  </div>

                  {cartItems.length === 0 ? (
                    <div className="rsp-cart-empty">Your cart is empty. Add some items first!</div>
                  ) : (
                    <div>
                      {cartItems.map(item => (
                        <div key={item.id} className="rsp-ci">
                          <div className="rsp-ci-img">
                            {imgSrc(item.product_image)
                              ? <img src={imgSrc(item.product_image)} alt={item.name} />
                              : <Package size={22} color="hsl(var(--border))" />
                            }
                          </div>
                          <div className="rsp-ci-info">
                            <div className="rsp-ci-name">{item.name}</div>
                            <div className="rsp-ci-price">{parseFloat(item.price).toLocaleString()} ETB</div>
                            <div className="rsp-ci-ctrl">
                              <button type="button" className="rsp-ci-btn" onClick={() => updateQty(item.id, item.quantity - 1)}><Minus size={12} /></button>
                              <span className="rsp-ci-qty">{item.quantity}</span>
                              <button type="button" className="rsp-ci-btn" onClick={() => updateQty(item.id, item.quantity + 1)}><Plus size={12} /></button>
                              <button type="button" className="rsp-ci-remove" onClick={() => removeItem(item.id)} title="Remove item">
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Delivery Details */}
                  <div className="rsp-section-divider">
                    <Truck size={14} /> Delivery Logistics
                  </div>
                  <div className="rsp-form-group">
                    <label className="rsp-form-label">
                      Delivery Address <span>(Leave blank to pick up in-store)</span>
                    </label>
                    <input
                      className="rsp-form-input"
                      placeholder="e.g. Building A, Room 202, Wolaita Sodo University..."
                      value={orderForm.delivery_address}
                      onChange={e => setOrderForm({ ...orderForm, delivery_address: e.target.value })}
                    />
                  </div>
                  <div className="rsp-form-group">
                    <label className="rsp-form-label">
                      Special Instructions <span>(Optional)</span>
                    </label>
                    <textarea
                      className="rsp-form-input"
                      rows={2}
                      placeholder="e.g. Call before delivery, specific packaging requests, etc."
                      value={orderForm.notes}
                      onChange={e => setOrderForm({ ...orderForm, notes: e.target.value })}
                      style={{ resize: 'vertical' }}
                    />
                  </div>

                  {/* Payment Verification */}
                  <div className="rsp-section-divider">
                    <Banknote size={14} /> Payment Verification
                  </div>
                  
                  <div className="rsp-form-group" style={{ marginBottom: '1rem' }}>
                    <label className="rsp-form-label">Payment Method *</label>
                    <select
                      className="rsp-form-input"
                      value={paymentMethod}
                      onChange={e => {
                        setPaymentMethod(e.target.value);
                        setPaymentError('');
                        setFormError('');
                      }}
                    >
                      <option value="">Select Payment Method...</option>
                      {financeAccounts
                        .filter(a => a.account_type !== 'Cash')
                        .map(acc => (
                          <option key={acc.id} value={acc.id}>
                            {acc.account_name}{acc.account_number ? ` - ${acc.account_number}` : ''}{acc.bank_provider ? ` (${acc.bank_provider})` : ''}
                          </option>
                        ))}
                    </select>
                  </div>

                  {(() => {
                    const acc = financeAccounts.find(a => String(a.id) === String(paymentMethod));
                    if (acc && acc.account_type !== 'Cash') {
                      return (
                        <div style={{ background: 'rgba(0,0,0,0.02)', padding: '1rem', borderRadius: 8, border: '1px solid #e2e8f0', marginBottom: '1rem' }}>
                          <p style={{ margin: '0 0 0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>Please transfer to:</p>
                          <p style={{ margin: 0, fontSize: '0.85rem', color: '#555' }}>
                            <strong>Bank:</strong> {acc.bank_provider || acc.account_type || 'Bank'} <br/>
                            <strong>Account Name:</strong> {acc.account_name} <br/>
                            <strong>Account Number:</strong> {acc.account_number}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  })()}

                  {(() => {
                    const acc = financeAccounts.find(a => String(a.id) === String(paymentMethod));
                    if (acc && acc.account_type === 'Cash') return null;
                    return (
                      <>
                        <div className="rsp-form-group" style={{ marginBottom: '1rem' }}>
                          <label className="rsp-form-label">Transaction Reference</label>
                          <input
                            type="text"
                            className="rsp-form-input"
                            placeholder="e.g. FT123456789"
                            value={paymentRef}
                            onChange={e => { setPaymentRef(e.target.value); setPaymentError(''); setFormError(''); }}
                          />
                        </div>

                        <div className="rsp-form-group">
                          <label className="rsp-form-label">
                            <UploadCloud size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} /> 
                            Payment Screenshot <span style={{ fontWeight: 400 }}>(Optional if Transaction Reference is provided)</span>
                          </label>
                          <div
                            className={`rsp-upload-box${paymentProofFile ? ' has-file' : ''}`}
                            onClick={() => paymentProofInputRef.current && paymentProofInputRef.current.click()}
                            style={{ cursor: 'pointer' }}
                          >
                            {paymentProofPreview ? (
                              <img src={paymentProofPreview} alt="Payment proof" style={{ maxHeight: 90, maxWidth: '100%', objectFit: 'contain' }} />
                            ) : (
                              <>
                                <UploadCloud size={24} color={paymentProofFile ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))'} />
                                <span className="rsp-upload-label">Browse files (JPG/PNG/PDF)</span>
                              </>
                            )}
                          </div>
                          <input
                            ref={paymentProofInputRef}
                            type="file"
                            accept="image/*,.pdf"
                            style={{ display: 'none' }}
                            onChange={handlePaymentProofChange}
                          />
                          {paymentProofFile && (
                            <button type="button" onClick={clearPaymentProof} className="rsp-remove-proof">
                              <X size={14} /> Remove receipt
                            </button>
                          )}
                          {paymentError && <div className="rsp-payment-error"><AlertTriangle size={14} /> {paymentError}</div>}
                        </div>
                      </>
                    );
                  })()}

                  {/* Price Summary */}
                  <div className="rsp-price-summary">
                    <div className="rsp-section-divider" style={{ borderTop: 'none', paddingTop: 0, margin: '0 0 1rem' }}>
                      <Banknote size={14} /> Order Total
                    </div>
                    <div className="rsp-price-row">
                      <span>Subtotal ({cartCount} item{cartCount !== 1 ? 's' : ''})</span>
                      <span className="rsp-price-row-bold">{cartTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ETB</span>
                    </div>
                    <div className="rsp-price-row">
                      <span>VAT (15%)</span>
                      <span>{cartVat > 0 ? `${cartVat.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ETB` : '—'}</span>
                    </div>
                    <div className="rsp-price-total">
                      <span>Total Due</span>
                      <span>{(cartTotal + cartVat).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ETB</span>
                    </div>
                  </div>

                </div>

                {/* Error banner */}
                {formError && (
                  <div ref={submitErrorRef} className="rsp-error-banner">
                    <AlertTriangle size={18} style={{ flexShrink: 0 }} /> {formError}
                  </div>
                )}

                {/* Footer */}
                <div className="rsp-modal-footer">
                  <button type="button" className="rsp-cancel-btn" onClick={() => setCartOpen(false)}>Cancel</button>
                  <button type="submit" className="rsp-submit-btn" disabled={placingOrder || cartItems.length === 0}>
                    {placingOrder
                      ? <><span className="rsp-submit-spinner" /> Processing…</>
                      : <>Place Order <ArrowRight size={16} strokeWidth={2.5} /></>
                    }
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ─────────────── CUSTOMER-ONLY WARNING ─────────────── */}
      {roleWarning && (
        <div className="rsp-overlay" onClick={() => setRoleWarning(false)}>
          <div className="rsp-modal" onClick={e => e.stopPropagation()}>
            <div className="rsp-modal-header">
              <div>
                <h3 className="rsp-modal-title">
                  <ShieldAlert size={22} /> Customer Account Required
                </h3>
                <p className="rsp-modal-subtitle">Orders on the public store are for customer accounts only</p>
              </div>
              <button className="rsp-close-btn" onClick={() => setRoleWarning(false)}><X size={20} strokeWidth={2.5} /></button>
            </div>

            <div className="rsp-modal-body">
              <div className="rsp-role-warn-box">
                <div className="rsp-role-warn-icon">
                  <ShieldAlert size={40} color="#B45309" strokeWidth={2} />
                </div>
                <p className="rsp-role-warn-text">
                  You are currently signed in as <strong>{user?.fullName || user?.full_name || 'a staff account'}</strong>.
                </p>
                <p className="rsp-role-warn-text">
                  Adding to cart and placing orders here is only available to <strong>Customer</strong> accounts.
                  Please <strong>log out</strong> and sign in with your customer account to continue with this order.
                </p>
                {selectedProduct && (
                  <p className="rsp-role-warn-product">
                    Item: <strong>{selectedProduct.name}</strong> — <strong>{parseFloat(selectedProduct.price || 0).toLocaleString()} ETB</strong>
                  </p>
                )}
              </div>
            </div>

            <div className="rsp-modal-footer">
              <button type="button" className="rsp-cancel-btn" onClick={() => setRoleWarning(false)}>Not Now</button>
              <button type="button" className="rsp-submit-btn" onClick={() => authService.logout()}>
                <LogOut size={16} strokeWidth={2.5} /> Log Out &amp; Switch to Customer
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default RetailStorePage;