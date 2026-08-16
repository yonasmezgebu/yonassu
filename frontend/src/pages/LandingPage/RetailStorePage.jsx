import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from '../../services/apiClient';
import { loadVatSafe, getVatForItem } from '../../services/vatService';
import { PublicNav } from './PublicNavFooter';
import { Store, ShoppingCart, Search, Package, Plus, Minus, Trash2, X, CheckCircle, Star, Zap, TrendingUp, ArrowRight, Truck, Phone, Mail, FileText, Shield, Info, CreditCard, Box, ChevronDown, ChevronUp, Clock, Banknote, User, LogIn, UserPlus, AlignLeft, UploadCloud, AlertTriangle } from 'lucide-react';
import retailStoreHero from '../../assets/hero-section/retail store.jpg';

const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Playfair+Display:wght@600;700;800&display=swap');

@keyframes fadeUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
@keyframes heroZoom { 0%{transform:scale(1)} 100%{transform:scale(1.15)} }
@keyframes shimmerAnim { 0%{background-position:-600px 0} 100%{background-position:600px 0} }
@keyframes slideIn { from{opacity:0;transform:translateX(20px)} to{opacity:1;transform:translateX(0)} }
@keyframes cartBounce { 0%,100%{transform:scale(1)} 50%{transform:scale(1.15)} }

.rsp-root {
  font-family: 'Inter', -apple-system, sans-serif;
  background: #f0f2f5;
  min-height: 100vh;
}

/* Hero */
.rsp-hero {
  width: 100%;
  position: relative;
  overflow: hidden;
  height: 420px;
  background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f4c35 100%);
}
.rsp-hero-orbs {
  position: absolute;
  inset: 0;
  overflow: hidden;
}
.rsp-hero-orb1 {
  position: absolute;
  width: 500px;
  height: 500px;
  border-radius: 0;
  background: radial-gradient(circle, rgba(59,130,246,0.25) 0%, transparent 70%);
  top: -150px; right: -100px;
}
.rsp-hero-orb2 {
  position: absolute;
  width: 400px;
  height: 400px;
  border-radius: 0;
  background: radial-gradient(circle, rgba(5,150,105,0.2) 0%, transparent 70%);
  bottom: -100px; left: -50px;
}
.rsp-hero-grid {
  position: absolute;
  inset: 0;
  background-image: linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
  background-size: 50px 50px;
}
.rsp-hero-content {
  position: relative;
  z-index: 10;
  max-width: 100%;
  margin: 0 auto;
  padding: 0 24px;
  height: 100%;
  display: flex;
  align-items: center;
  gap: 60px;
}
.rsp-hero-text { flex: 1; }
.rsp-hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: rgba(59,130,246,0.2);
  border: 1px solid rgba(59,130,246,0.4);
  backdrop-filter: blur(8px);
  padding: 6px 16px;
  border-radius: 0;
  font-size: 12px;
  font-weight: 700;
  color: #93c5fd;
  letter-spacing: 1px;
  text-transform: uppercase;
  margin-bottom: 20px;
}
.rsp-hero-title {
  font-size: clamp(32px, 5vw, 56px);
  font-weight: 900;
  color: white;
  margin: 0 0 16px;
  line-height: 1.1;
  letter-spacing: -1px;
}
.rsp-hero-title span { color: #34d399; }
.rsp-hero-sub {
  font-size: 18px;
  color: rgba(255,255,255,0.7);
  margin: 0 0 32px;
  max-width: 480px;
  line-height: 1.6;
}
.rsp-hero-stats {
  display: flex;
  gap: 32px;
  flex-wrap: wrap;
}
.rsp-hero-stat { text-align: left; }
.rsp-hero-stat-num { font-size: 28px; font-weight: 800; color: white; line-height: 1; }
.rsp-hero-stat-label { font-size: 12px; color: rgba(255,255,255,0.5); margin-top: 4px; font-weight: 500; }

/* Toolbar */
.rsp-toolbar {
  background: #FFFFFF;
  border-bottom: 1px solid #8D6E63;
  padding: 12px 0;
  position: sticky;
  top: 68px;
  z-index: 100;
}
.rsp-toolbar-inner {
  max-width: 100%;
  margin: 0 auto;
  padding: 0 24px;
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.rsp-search {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: transparent;
  border: 1px solid rgba(255,255,255,0.7);
  border-radius: 6px;
  width: 100%;
  max-width: 600px;
  margin-top: 30px;
  transition: all 0.15s ease;
}
.rsp-search:focus-within { border-color: white; background: rgba(255,255,255,0.1); }
.rsp-search input { border: none; outline: none; flex: 1; font-size: 15px; color: white; background: transparent; font-family: inherit; }
.rsp-search input::placeholder { color: rgba(255,255,255,0.7); }
.rsp-cat-pill {
  padding: 7px 16px;
  border-radius: 8px;
  border: 1px solid #8D6E63;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  transition: all 0.15s ease;
  background: #FFFFFF;
  color: #424242;
  font-family: inherit;
}
.rsp-cat-pill:hover { background: #F5F5F5; color: #1B5E20; border-color: #2E8B57; }
.rsp-cat-pill.active { background: #2E8B57; color: #FFFFFF; border-color: #2E8B57; }

/* Main */
.rsp-main {
  max-width: 100%;
  margin: 0 auto;
  padding: 32px 24px 100px;
}

/* Grid */
.rsp-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
}
.rsp-card {
  background: #FFFFFF;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #8D6E63;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  display: flex;
  flex-direction: column;
  animation: fadeUp 0.4s both;
}
.rsp-card:hover { box-shadow: 0 8px 24px rgba(0,0,0,0.08); transform: translateY(-2px); }
.rsp-card-img-wrap {
  position: relative;
  overflow: hidden;
  aspect-ratio: 4/3;
  background: #F5F5F5;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px 10px 0 0;
}
.rsp-card-img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.15s ease; border-radius: 10px 10px 0 0; }
.rsp-card:hover .rsp-card-img { transform: scale(1.03); }
.rsp-card-badge {
  position: absolute;
  top: 10px;
  left: 10px;
  background: rgba(255,255,255,0.95);
  backdrop-filter: blur(4px);
  padding: 3px 10px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 700;
  color: #1B5E20;
}
.rsp-card-oos {
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
  color: white;
  letter-spacing: 1px;
  border-radius: 10px 10px 0 0;
}
.rsp-card-body { padding: 16px 18px 18px; flex: 1; display: flex; flex-direction: column; }
.rsp-card-name {
  font-size: 16px;
  font-weight: 700;
  font-family: 'Playfair Display', Georgia, serif;
  color: #1B5E20;
  margin: 0 0 6px;
  line-height: 1.35;
  letter-spacing: 0.01em;
}
.rsp-card-desc {
  font-size: 12px;
  font-style: italic;
  color: #5D4037;
  margin: 0 0 14px;
  line-height: 1.65;
  flex: 1;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  letter-spacing: 0.02em;
}
.rsp-card-footer { margin-top: auto; display: flex; align-items: center; justify-content: space-between; }
.rsp-price {
  font-size: 17px;
  font-weight: 800;
  font-family: 'Playfair Display', Georgia, serif;
  color: #2E8B57;
  letter-spacing: 0.03em;
}
.rsp-price-sub { font-size: 10px; color: #6D4C41; margin-top: 2px; font-style: italic; letter-spacing: 0.04em; }
.rsp-add-btn {
  background: #2E8B57;
  color: #FFFFFF;
  border: none;
  padding: 8px 14px;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
  font-size: 13px;
  transition: all 0.15s ease;
  font-family: inherit;
}
.rsp-add-btn:hover:not(:disabled) { background: #1B5E20; transform: translateY(-1px); box-shadow: 0 2px 6px rgba(0,0,0,0.12); }
.rsp-add-btn:disabled { background: #F5F5F5; color: #8D6E63; border: 1px solid #8D6E63; cursor: not-allowed; }

/* Shimmer */
.rsp-shimmer {
  background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
  background-size: 600px 100%;
  animation: shimmerAnim 1.5s infinite;
  border-radius: 0;
  height: 320px;
}

/* Cart FAB */
.rsp-cart-fab {
  position: fixed;
  bottom: 32px;
  right: 32px;
  width: 64px;
  height: 64px;
  border-radius: 0;
  background: linear-gradient(135deg,#059669,#10b981);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 24px rgba(5,150,105,0.45);
  cursor: pointer;
  z-index: 100;
  transition: transform 0.2s;
  border: none;
  animation: cartBounce 2s ease-in-out infinite;
}
.rsp-cart-fab:hover { transform: scale(1.08); }
.rsp-cart-badge {
  position: absolute;
  top: -5px;
  right: -5px;
  background: #ef4444;
  color: white;
  width: 24px;
  height: 24px;
  border-radius: 0;
  font-size: 12px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid white;
}

/* Cart items list (now inside modal) */
.rsp-ci { display:flex;gap:14px;padding:16px 0;border-bottom:1px solid #f1f5f9;animation:slideIn 0.3s both; }
.rsp-ci-img { width:64px;height:64px;border-radius:0;object-fit:cover;background:#f1f5f9;flex-shrink:0;display:flex;align-items:center;justify-content:center; }
.rsp-ci-info { flex:1;min-width:0; }
.rsp-ci-name { font-size:14px;font-weight:600;color:#0f172a;margin:0 0 4px; }
.rsp-ci-price { font-size:13px;color:#059669;font-weight:700; }
.rsp-ci-ctrl { display:flex;align-items:center;gap:10px;margin-top:8px; }
.rsp-ci-btn { width:26px;height:26px;border-radius:0;border:1.5px solid #e2e8f0;background:white;display:flex;align-items:center;justify-content:center;cursor:pointer;color:#475569;transition:all 0.15s; }
.rsp-ci-btn:hover { background:#f1f5f9;border-color:#cbd5e1; }

/* ── MODAL / OVERLAY ─────────────────────────────── */
.rsp-overlay {
  position:fixed;top:0;left:0;right:0;bottom:0;
  background:rgba(15,23,42,0.65);backdrop-filter:blur(4px);
  display:flex;align-items:flex-start;justify-content:center;
  z-index:9999;padding:40px 20px;overflow-y:auto;
}
.rsp-modal {
  background:white;border-radius:0;width:100%;max-width:620px;
  margin:auto;box-shadow:0 25px 60px rgba(0,0,0,0.3);
  animation:psp-pop 0.3s ease;
}
@keyframes psp-pop { 0%{transform:scale(0.95);opacity:0} 100%{transform:scale(1);opacity:1} }
.rsp-modal-header {
  padding:24px 28px;border-bottom:1px solid #e2e8f0;
  display:flex;align-items:center;justify-content:space-between;
  background:linear-gradient(135deg,#1a2b4b,#0D7C66);
}
.rsp-modal-title { margin:0;font-size:1.1rem;font-weight:800;color:#FFD700;display:flex;align-items:center;gap:10px; }
.rsp-modal-subtitle { font-size:0.8rem;color:rgba(255,255,255,0.7);margin:4px 0 0; }
.rsp-close-btn {
  background:rgba(255,255,255,0.15);border:none;color:white;
  cursor:pointer;display:flex;align-items:center;
  padding:8px;border-radius:8px;transition:all 0.2s;
}
.rsp-close-btn:hover { background:rgba(255,255,255,0.3); }
.rsp-modal-body { padding:28px;display:flex;flex-direction:column;gap:18px; }
.rsp-form-group { display:flex;flex-direction:column;gap:8px; }
.rsp-form-label {
  font-weight:700;font-size:0.85rem;color:#1e293b;
  display:flex;align-items:center;gap:6px;
}
.rsp-form-label span { font-weight:400;color:#94a3b8; }
.rsp-form-input {
  padding:12px 16px;border:2px solid #e2e8f0;width:100%;box-sizing:border-box;
  border-radius:0;font-size:0.95rem;background:white;
  color:#0f172a;transition:all 0.2s;font-family:inherit;outline:none;
}
.rsp-form-input:focus { border-color:#059669;box-shadow:0 0 0 3px rgba(5,150,105,0.1); }
.rsp-form-input:disabled { background:#f8fafc;color:#64748b;cursor:not-allowed; }
.rsp-form-row { display:grid;grid-template-columns:1fr 1fr;gap:16px; }
@media(max-width:500px){ .rsp-form-row { grid-template-columns:1fr; } }

.rsp-section-divider {
  font-size:0.75rem;font-weight:800;color:#1a2b4b;letter-spacing:1.5px;
  text-transform:uppercase;padding:8px 0 4px;border-top:2px solid #e2e8f0;
  margin-top:4px;display:flex;align-items:center;gap:8px;
}
.rsp-section-divider::after { content:'';flex:1;height:1px;background:#e2e8f0; }

/* Price summary */
.rsp-price-summary {
  background:linear-gradient(135deg,#f0fdf4,#dcfce7);
  border:2px solid #86efac;border-radius:0;padding:20px;
}
.rsp-price-row { display:flex;justify-content:space-between;align-items:center;font-size:0.9rem;color:#166534;padding:4px 0; }
.rsp-price-total { font-size:1.3rem;font-weight:900;color:#15803d;border-top:2px solid #86efac;padding-top:12px;margin-top:8px; }

/* Modal footer */
.rsp-modal-footer {
  padding:20px 28px;border-top:1px solid #e2e8f0;
  display:flex;justify-content:flex-end;gap:12px;background:#f8fafc;
}
.rsp-cancel-btn {
  padding:12px 24px;background:white;border:2px solid #e2e8f0;
  border-radius:0;color:#475569;font-weight:700;
  cursor:pointer;transition:all 0.2s;font-family:inherit;
}
.rsp-cancel-btn:hover { background:#f1f5f9; }
.rsp-submit-btn {
  padding:12px 28px;
  background:linear-gradient(135deg,#1a2b4b,#0D7C66);
  border:none;border-radius:0;color:white;
  font-weight:800;cursor:pointer;display:flex;
  align-items:center;gap:8px;transition:all 0.2s;
  font-family:inherit;font-size:1rem;
}
.rsp-submit-btn:hover:not(:disabled) { transform:translateY(-1px);box-shadow:0 6px 20px rgba(13,124,102,0.4); }
.rsp-submit-btn:disabled { opacity:0.6;cursor:not-allowed; }

/* Success */
.rsp-success-body { padding:48px 28px;text-align:center; }
.rsp-success-emoji { font-size:72px;display:block;margin-bottom:16px;animation:psp-pop 0.5s; }
.rsp-success-title { font-size:1.4rem;font-weight:900;color:#059669;margin:0 0 8px; }
.rsp-success-sub { color:#64748b;margin:0 0 24px; }
.rsp-view-orders-btn {
  display:inline-flex;align-items:center;gap:8px;
  background:linear-gradient(135deg,#1a2b4b,#0D7C66);color:#fff;
  border:none;border-radius:0;padding:14px 32px;
  font-size:1rem;font-weight:800;cursor:pointer;
  transition:all 0.2s;font-family:inherit;
  box-shadow:0 4px 16px rgba(13,124,102,0.3);
}
.rsp-view-orders-btn:hover { transform:translateY(-2px);box-shadow:0 8px 24px rgba(13,124,102,0.45); }

@media (max-width: 768px) {
  .rsp-form-row { grid-template-columns: 1fr; }
  .rsp-hero-content { padding: 0 16px; gap: 0; }
  .rsp-hero-stats { gap: 20px; }
}
`;

const RetailStorePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  const [cartOpen, setCartOpen]         = useState(false);
  const [cartItems, setCartItems]       = useState([]);
  const [vatCtx, setVatCtx]             = useState(null);
  useEffect(() => { loadVatSafe().then(setVatCtx).catch(() => {}); }, []);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(null);

  const [orderForm, setOrderForm]       = useState({
    delivery_type: 'pickup',
    delivery_address: '',
    notes: '',
    customer_name: '',
    customer_email: '',
    customer_phone: '',
  });

  // ── Payment proof (payment ID OR screenshot — at least one required) ──
  const [paymentMethod, setPaymentMethod]    = useState('bank_transfer');
  const [paymentRef, setPaymentRef]          = useState('');
  const [paymentProofFile, setPaymentProofFile] = useState(null);
  const [paymentProofPreview, setPaymentProofPreview] = useState('');
  const [paymentError, setPaymentError]      = useState('');
  const [formError, setFormError]            = useState('');
  const paymentProofInputRef                 = useRef(null);
  const submitErrorRef                       = useRef(null);

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

  const HOW_TO_BUY = [
    { n: '1', title: 'Buy Direct (In-Stock)', desc: 'Browse available products, add to cart, and check out instantly.', icon: Package },
    { n: '2', title: 'Order from Supplier', desc: 'Request out-of-stock items. We source directly from trusted suppliers.', icon: Truck },
  ];

  const FAQS = [
    { q: 'How do supplier orders work?', a: 'If an item is out of stock, you can still request it. We will confirm the price and delivery timeline from our suppliers before finalizing your order.' },
    { q: 'What is the wait time for supplier orders?', a: 'Supplier orders typically take 3-7 business days depending on availability and logistics.' },
    { q: 'What if a requested item is unavailable?', a: 'If we cannot source the item from our suppliers, your request will be cancelled and any deposits fully refunded.' },
  ];

  // ── On mount: load user, cart, products, categories; auto-open modal if returning from login
  useEffect(() => {
    // 1. Read user from localStorage synchronously
    let parsedUser = null;
    try {
      const raw = localStorage.getItem('user');
      if (raw) {
        parsedUser = JSON.parse(raw);
        setUser(parsedUser);
        setOrderForm(prev => ({
          ...prev,
          customer_name: parsedUser.fullName || parsedUser.full_name || '',
          customer_email: parsedUser.email || '',
          customer_phone: parsedUser.phone || '',
        }));
      }
    } catch {}

    // 2. Load products and categories (public — no auth needed)
    axios.get('/retail/products')
      .then(r => setProducts(Array.isArray(r?.data?.products) ? r.data.products : []))
      .catch(() => {})
      .finally(() => setLoading(false));

    axios.get('/retail/categories')
      .then(r => setCategories(Array.isArray(r?.data) ? r.data : []))
      .catch(() => {});

    // 3. Handle pending cart items from before login, then auto-open modal
    if (parsedUser) {
      const pendingProductId = location.state?.pendingRetailCartItem || sessionStorage.getItem('pendingRetailCartItem');
      const shouldOpenCart = location.state?.openRetailCart || sessionStorage.getItem('openRetailCart') === 'true';
      
      const loadCartAndOpen = () => {
        axios.get('/retail/cart')
          .then(r => {
            const items = r?.data?.items || [];
            setCartItems(Array.isArray(items) ? items : []);
            if (shouldOpenCart) {
              sessionStorage.removeItem('openRetailCart');
              setCartOpen(true);
              // Clean up location state so a refresh doesn't trigger it again
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
        // User clicked "Add" before logging in — add the item now!
        sessionStorage.removeItem('pendingRetailCartItem');
        axios.post('/retail/cart/add', { product_id: pendingProductId, quantity: 1 })
          .then(() => loadCartAndOpen())
          .catch(() => loadCartAndOpen()); // Still load cart if add fails
      } else {
        // Normal load
        loadCartAndOpen();
      }
    } else {
      // Not logged in — still check the flag (shouldn't happen, but be safe)
      if (sessionStorage.getItem('openRetailCart') === 'true') {
        sessionStorage.removeItem('openRetailCart');
        sessionStorage.removeItem('pendingRetailCartItem');
      }
    }
  }, [location]); // Depend on location so return from login triggers it

  // Reload cart whenever user changes (e.g. login/logout)
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
    try {
      await axios.post('/retail/cart/add', { product_id: product.id, quantity: 1 });
      loadCart();
      setCartOpen(true);
    } catch (err) {
      const msg = err?.message || 'Failed to add to cart';
      alert(msg);
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
    if (cartItems.length === 0) return;
    // Manual validation (form uses noValidate so the button always responds)
    const missing = [];
    if (!(orderForm.customer_name || '').trim()) missing.push('Full Name');
    if (!(orderForm.customer_email || '').trim()) missing.push('Email');
    if (!(orderForm.customer_phone || '').trim()) missing.push('Phone Number');
    if (missing.length) {
      setFormError(`Please fill in: ${missing.join(', ')}`);
      scrollFormError();
      return;
    }
    // Payment proof — at least one of Payment ID or Screenshot is required
    const ref = paymentRef.trim();
    if (!ref && !paymentProofFile) {
      setPaymentError('Payment ID or Payment Screenshot is required — please provide at least one.');
      setFormError('Payment ID or Payment Screenshot is required — please provide at least one.');
      scrollFormError();
      return;
    }
    setPlacingOrder(true);
    setPaymentError('');
    setFormError('');
    try {
      const formData = new FormData();
      Object.entries(orderForm).forEach(([k, v]) => {
        if (k === 'delivery_type') return; // appended once below, computed from address
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
    cartItems.forEach((item) => {
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
      <style>{STYLES}</style>
      <PublicNav />

      {/* ─── Hero Section ─── */}
      <div className="rsp-hero">
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `url("${retailStoreHero}")`, backgroundSize: 'cover', backgroundPosition: 'center', animation: 'heroZoom 20s ease-in-out infinite alternate', zIndex: 0 }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(15,23,42,0.85) 0%, rgba(15,76,53,0.7) 100%)', zIndex: 1 }} />
        <div className="rsp-hero-grid" style={{ zIndex: 2 }} />
        <div className="rsp-hero-content" style={{ zIndex: 3 }}>
          <div className="rsp-hero-text">
            <h1 className="rsp-hero-title" style={{ textAlign: 'center' }}>
              Shop Premium <span>Commercial</span> Goods
            </h1>
          </div>
        </div>
        
        <div style={{ position: 'absolute', bottom: 24, left: 0, right: 0, zIndex: 4, display: 'flex', justifyContent: 'center', padding: '0 24px' }}>
          <div className="rsp-search" style={{ margin: 0 }}>
            <Search size={18} color="rgba(255,255,255,0.8)" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search products..."
            />
          </div>
        </div>
      </div>

      {/* ─── Sticky Toolbar ─── */}
      <div className="rsp-toolbar">
        <div className="rsp-toolbar-inner" style={{ maxWidth: '100%', width: '100%', margin: '0 auto', display: 'flex', gap: 10, padding: '0 24px' }}>
          <button
            className={'rsp-cat-pill' + (catFilter === 'all' ? ' active' : '')}
            onClick={() => setCatFilter('all')}
          >
            All
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

      {/* ─── Product Grid ─── */}
      <div className="rsp-main">
        <div style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1B5E20', margin: 0 }}>
            {catFilter === 'all' ? 'All Products' : categories.find(c => String(c.id) === catFilter)?.name || 'Products'}
          </h2>
        </div>

        {loading ? (
          <div className="rsp-grid">
            {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="rsp-shimmer" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 24px', background: 'white', borderRadius: 0, border: '1px solid #e2e8f0' }}>
            <Package size={56} color="#cbd5e1" style={{ marginBottom: 16 }} />
            <h3 style={{ fontSize: 20, color: '#0f172a', margin: '0 0 8px' }}>No products found</h3>
            <p style={{ color: '#64748b', margin: 0 }}>Try a different search term or category.</p>
          </div>
        ) : (
          <div className="rsp-grid">
            {filtered.map((p, i) => (
              <div key={p.id} className="rsp-card" style={{ animationDelay: i * 0.05 + 's' }}>
                <div className="rsp-card-img-wrap">
                  {imgSrc(p.product_image) ? (
                    <img src={imgSrc(p.product_image)} className="rsp-card-img" alt={p.name} />
                  ) : (
                    <Package size={44} color="#cbd5e1" />
                  )}
                  {(p.stock_quantity !== null && p.stock_quantity !== undefined && p.stock_quantity <= 0) && (
                    <div className="rsp-card-oos">OUT OF STOCK</div>
                  )}
                </div>
                <div className="rsp-card-body">
                  <h3 className="rsp-card-name">{p.name}</h3>
                  {p.description && <p className="rsp-card-desc">{p.description}</p>}
                  <div className="rsp-card-footer">
                    <div>
                      <div className="rsp-price">{parseFloat(p.price || p.selling_price || 0).toLocaleString()} ETB</div>
                    </div>
                    <button
                      className="rsp-add-btn"
                      disabled={p.stock_quantity !== null && p.stock_quantity !== undefined && p.stock_quantity <= 0}
                      onClick={(e) => { e.stopPropagation(); addToCart(p); }}
                    >
                      <ShoppingCart size={16} /> Add
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* ── Section: How to Buy ── */}
        <section style={{ background: '#F5F5F5', margin: '60px -24px 0', padding: '56px 24px', borderTop: '1px solid #228B22' }}>
          <style>{`
            .rsp-how-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px,1fr)); gap: 20px; }
            .rsp-how-card { background: #FFFFFF; border-radius: 12px; padding: 28px 22px; border: 1px solid #8D6E63; transition: transform 0.15s ease, box-shadow 0.15s ease; }
            .rsp-how-card:hover { transform: translateY(-3px); box-shadow: 0 8px 20px rgba(0,0,0,0.07); }
            .rsp-how-icon { width: 48px; height: 48px; border-radius: 10px; background: #2E8B57; display: flex; align-items: center; justify-content: center; margin-bottom: 16px; }
            .rsp-how-title { font-size: 16px; font-weight: 700; color: #1B5E20; margin: 0 0 8px; }
            .rsp-how-desc { font-size: 13px; color: #424242; margin: 0; line-height: 1.65; }
            @media (max-width: 600px) {
              .rsp-how-card { border: none; border-radius: 0; box-shadow: none; padding: 16px 0; border-bottom: 1px solid #E0E0E0; }
              .rsp-how-card:hover { transform: none; box-shadow: none; }
            }
          `}</style>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <h2 style={{ fontSize: 'clamp(20px,3vw,28px)', fontWeight: 800, color: '#1B5E20', marginBottom: 8 }}>How to Buy</h2>
            <p style={{ fontSize: 14, color: '#424242', marginBottom: 32 }}>Two simple ways to get what you need.</p>
            <div className="rsp-how-grid">
              {HOW_TO_BUY.map(step => (
                <div key={step.n} className="rsp-how-card">
                  <div className="rsp-how-icon"><step.icon size={22} color="#FFFFFF" /></div>
                  <h3 className="rsp-how-title">{step.title}</h3>
                  <p className="rsp-how-desc">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Section: Delivery & Payment ── */}
        <section style={{ background: '#FFFFFF', margin: '0 -24px', padding: '56px 24px' }}>
          <style>{`
            .rsp-dp-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px,1fr)); gap: 32px; }
            .rsp-dp-card { background: #FFFFFF; border-radius: 12px; padding: 28px 24px; border: 1px solid #8D6E63; }
            .rsp-dp-head { font-size: 18px; font-weight: 700; color: #1B5E20; margin: 0 0 20px; display: flex; align-items: center; gap: 8px; }
            .rsp-dp-row { display: flex; align-items: flex-start; gap: 12px; padding: 14px 16px; background: #F5F5F5; border-radius: 8px; margin-bottom: 10px; }
            .rsp-dp-row-icon { width: 36px; height: 36px; border-radius: 8px; background: #2E8B57; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
            .rsp-dp-row-title { font-size: 13px; font-weight: 700; color: #424242; margin: 0 0 3px; }
            .rsp-dp-row-desc { font-size: 12px; color: #424242; margin: 0; line-height: 1.5; }
            @media (max-width: 600px) {
              .rsp-dp-card { border: none; border-radius: 0; padding: 20px 0; }
              .rsp-dp-grid { gap: 0; }
            }
          `}</style>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <div className="rsp-dp-grid">
              <div className="rsp-dp-card">
                <h2 className="rsp-dp-head"><Truck size={20} color="#2E8B57" /> Delivery / Pickup</h2>
                <div className="rsp-dp-row">
                  <div className="rsp-dp-row-icon"><Truck size={18} color="#FFFFFF" /></div>
                  <div>
                    <p className="rsp-dp-row-title">Standard Delivery</p>
                    <p className="rsp-dp-row-desc">Available in major areas. Fees calculated at checkout. Delivery within 1-2 business days for in-stock items.</p>
                  </div>
                </div>
                <div className="rsp-dp-row">
                  <div className="rsp-dp-row-icon"><Package size={18} color="#FFFFFF" /></div>
                  <div>
                    <p className="rsp-dp-row-title">Store Pickup</p>
                    <p className="rsp-dp-row-desc">Free pickup from our main branch. Ready within 2 hours for in-stock items.</p>
                  </div>
                </div>
              </div>
              <div className="rsp-dp-card">
                <h2 className="rsp-dp-head"><CreditCard size={20} color="#2E8B57" /> Payment Methods</h2>
                <div className="rsp-dp-row">
                  <div className="rsp-dp-row-icon"><Banknote size={18} color="#FFFFFF" /></div>
                  <div>
                    <p className="rsp-dp-row-title">Bank Transfer</p>
                    <p className="rsp-dp-row-desc">Direct transfer to our accounts (CBE, Awash, etc.)</p>
                  </div>
                </div>
                <div className="rsp-dp-row">
                  <div className="rsp-dp-row-icon"><CreditCard size={18} color="#FFFFFF" /></div>
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
        <section style={{ background: '#F5F5F5', margin: '0 -24px', padding: '56px 24px' }}>
          <style>{`
            .rsp-faq-item { background: #FFFFFF; border-radius: 12px; margin-bottom: 10px; overflow: hidden; transition: box-shadow 0.15s ease; }
            .rsp-faq-item:hover { box-shadow: 0 4px 14px rgba(0,0,0,0.06); }
            .rsp-faq-btn { width: 100%; background: none; border: none; padding: 20px 22px; display: flex; justify-content: space-between; align-items: center; font-weight: 700; color: #424242; font-size: 15px; cursor: pointer; text-align: left; gap: 16px; font-family: inherit; transition: color 0.15s ease; }
            .rsp-faq-btn:hover { color: #1B5E20; }
            .rsp-faq-ans { font-size: 14px; color: #424242; line-height: 1.75; padding: 0 22px 20px; }
            @media (max-width: 600px) {
              .rsp-faq-item { border-radius: 0; box-shadow: none; border-bottom: 1px solid #E0E0E0; margin-bottom: 0; background: #F5F5F5; }
              .rsp-faq-item:hover { box-shadow: none; }
            }
          `}</style>
          <div style={{ maxWidth: 760, margin: '0 auto' }}>
            <h2 style={{ fontSize: 'clamp(20px,3vw,28px)', fontWeight: 800, color: '#1B5E20', textAlign: 'center', marginBottom: 36 }}>Common Questions</h2>
            <div>
              {FAQS.map((f, i) => (
                <div key={i} className="rsp-faq-item">
                  <button className="rsp-faq-btn" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                    <span>{f.q}</span>
                    {openFaq === i ? <ChevronUp size={18} color="#228B22" style={{ flexShrink: 0 }} /> : <ChevronDown size={18} color="#424242" style={{ flexShrink: 0 }} />}
                  </button>
                  {openFaq === i && <div className="rsp-faq-ans">{f.a}</div>}
                </div>
              ))}
            </div>
          </div>
        </section>

      </div>



      {/* ─────────────── ORDER MODAL ─────────────── */}
      {cartOpen && (
        <div className="rsp-overlay" onClick={() => setCartOpen(false)}>
          <div className="rsp-modal" onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div className="rsp-modal-header">
              <div>
                <h3 className="rsp-modal-title">
                  <ShoppingCart size={22} /> Place Retail Order
                </h3>
                <p className="rsp-modal-subtitle">
                  Review your items and fill in the details below
                </p>
              </div>
              <button className="rsp-close-btn" onClick={() => setCartOpen(false)}><X size={22} /></button>
            </div>

            {/* ── SUCCESS ── */}
            {orderSuccess ? (
              <div className="rsp-success-body">

                <span className="rsp-success-emoji">✅</span>
                <h3 className="rsp-success-title">Order Placed Successfully!</h3>
                <p className="rsp-success-sub">
                  Invoice <strong>{orderSuccess}</strong> has been received.<br />
                  Our sales team will confirm your order shortly.
                </p>
                <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button className="rsp-view-orders-btn" onClick={() => navigate('/customer/orders')}>
                    <Package size={20} /> View My Orders
                  </button>
                  <button
                    style={{ padding: '14px 32px', background: '#f1f5f9', border: '2px solid #e2e8f0', borderRadius: 0, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', color: '#334155' }}
                    onClick={() => { setOrderSuccess(null); setCartOpen(false); }}
                  >
                    Continue Shopping
                  </button>
                </div>
                <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 20 }}>
                  You can track your order anytime from <strong>Customer Portal → My Orders</strong>
                </p>
              </div>

            ) : (
              /* ── ORDER FORM ── */
              <form onSubmit={e => { e.preventDefault(); placeOrder(); }} noValidate>
                <div className="rsp-modal-body">

                  {/* Customer Info (pre-filled, read-only) */}
                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '16px', borderRadius: 0 }}>
                    <div className="rsp-section-divider" style={{ borderTop: 'none', paddingTop: 0, marginTop: 0 }}>
                      <User size={14} /> Customer Information
                    </div>
                    <div className="rsp-form-row">
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
                        <label className="rsp-form-label">Email *</label>
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
                    <div className="rsp-form-group" style={{ marginTop: 12 }}>
                      <label className="rsp-form-label">Phone Number *</label>
                      <input
                        type="text"
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
                    <Package size={14} /> Order Items
                  </div>

                  {cartItems.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>Your cart is empty</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {cartItems.map(item => (
                        <div key={item.id} className="rsp-ci">
                          <div className="rsp-ci-img">
                            {imgSrc(item.product_image)
                              ? <img src={imgSrc(item.product_image)} style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 0 }} alt={item.name} />
                              : <Package size={22} color="#cbd5e1" />
                            }
                          </div>
                          <div className="rsp-ci-info">
                            <div className="rsp-ci-name">{item.name}</div>
                            <div className="rsp-ci-price">{parseFloat(item.price).toLocaleString()} ETB</div>
                            <div className="rsp-ci-ctrl">
                              <button type="button" className="rsp-ci-btn" onClick={() => updateQty(item.id, item.quantity - 1)}><Minus size={12} /></button>
                              <span style={{ fontSize: 14, fontWeight: 700, minWidth: 20, textAlign: 'center' }}>{item.quantity}</span>
                              <button type="button" className="rsp-ci-btn" onClick={() => updateQty(item.id, item.quantity + 1)}><Plus size={12} /></button>
                              <button type="button" onClick={() => removeItem(item.id)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', borderRadius: 0, padding: 4 }}>
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Delivery Details */}
                  <div className="rsp-section-divider">
                    <Truck size={14} /> Delivery Details
                  </div>
                  <div className="rsp-form-group">
                    <label className="rsp-form-label"><ArrowRight size={14} /> Delivery Address <span>(Leave blank for pickup)</span></label>
                    <input
                      className="rsp-form-input"
                      placeholder="e.g. Building A, Room 202, Wolaita Sodo University..."
                      value={orderForm.delivery_address}
                      onChange={e => setOrderForm({ ...orderForm, delivery_address: e.target.value })}
                    />
                  </div>
                  <div className="rsp-form-group">
                    <label className="rsp-form-label"><AlignLeft size={14} /> Special Notes <span>(Optional)</span></label>
                    <textarea
                      className="rsp-form-input"
                      rows={3}
                      placeholder="e.g. Call before delivery, specific packaging requests, etc."
                      value={orderForm.notes}
                      onChange={e => setOrderForm({ ...orderForm, notes: e.target.value })}
                      style={{ resize: 'vertical' }}
                    />
                  </div>

                  {/* Payment Proof — Payment ID OR Screenshot (at least one required) */}
                  <div className="rsp-section-divider">
                    <Banknote size={14} /> Payment Proof
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div className="rsp-form-group">
                      <label className="rsp-form-label"><CreditCard size={14} /> Payment Method *</label>
                      <select
                        className="rsp-form-input"
                        value={paymentMethod}
                        onChange={e => setPaymentMethod(e.target.value)}
                        style={{
                          appearance: 'auto',
                          height: 'auto',
                          minHeight: 46,
                          padding: '12px 16px',
                          lineHeight: 1.4,
                          color: '#0f172a',
                          background: '#fff',
                          cursor: 'pointer',
                        }}
                      >
                        <option value="bank_transfer">Bank Transfer</option>
                        <option value="telebirr">Mobile Money (Telebirr)</option>
                      </select>
                    </div>
                    <div className="rsp-form-group">
                      <label className="rsp-form-label"><FileText size={14} /> Payment ID / Reference</label>
                      <input
                        type="text"
                        className="rsp-form-input"
                        placeholder="e.g. TRX-123456789"
                        value={paymentRef}
                        onChange={e => { setPaymentRef(e.target.value); if (paymentError) setPaymentError(''); setFormError(''); }}
                      />
                    </div>
                  </div>
                  <div className="rsp-form-group" style={{ marginTop: 10 }}>
                    <label className="rsp-form-label">
                      <UploadCloud size={14} /> Payment Screenshot
                      <span> (Enter a Payment ID above OR upload a screenshot — at least one is required)</span>
                    </label>
                    <div
                      onClick={() => paymentProofInputRef.current && paymentProofInputRef.current.click()}
                      style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        gap: 8, padding: '18px 12px', border: `2px dashed ${paymentProofFile ? '#0D7C66' : '#cbd5e1'}`,
                        background: paymentProofFile ? '#f0fdf4' : '#f8fafc', borderRadius: 0, cursor: 'pointer',
                        transition: 'border-color 0.15s ease', textAlign: 'center',
                      }}
                    >
                      {paymentProofPreview ? (
                        <img src={paymentProofPreview} alt="Payment proof" style={{ maxHeight: 90, maxWidth: '100%', objectFit: 'contain' }} />
                      ) : (
                        <>
                          <UploadCloud size={28} color={paymentProofFile ? '#0D7C66' : '#94a3b8'} />
                          <span style={{ fontSize: 12, color: '#64748b' }}>Click to upload JPG / PNG / PDF</span>
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
                      <button
                        type="button"
                        onClick={clearPaymentProof}
                        style={{ marginTop: 8, background: 'none', border: 'none', color: '#dc2626', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'inherit', padding: 0 }}
                      >
                        <X size={14} /> Remove screenshot
                      </button>
                    )}
                    {paymentError && (
                      <div style={{ color: '#dc2626', fontSize: 12, fontWeight: 600, marginTop: 6 }}>{paymentError}</div>
                    )}
                  </div>

                  {/* Price Summary */}
                  <div className="rsp-price-summary">
                    <div className="rsp-section-divider" style={{ borderTop: 'none', paddingTop: 0, marginTop: 0 }}>
                      <Banknote size={14} /> Price Summary
                    </div>
                    <div className="rsp-price-row">
                      <span>Subtotal ({cartCount} item{cartCount !== 1 ? 's' : ''})</span>
                      <span style={{ fontWeight: 700 }}>{cartTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ETB</span>
                    </div>
                    <div className="rsp-price-row">
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Banknote size={14} /> VAT Amount</span>
                      <span>{cartVat > 0 ? `${cartVat.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ETB` : '—'}</span>
                    </div>
                    <div className="rsp-price-row rsp-price-total">
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>Total Amount Due (incl. VAT)</span>
                      <span>{(cartTotal + cartVat).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ETB</span>
                    </div>
                  </div>

                </div>

                {/* Error banner — always visible above the buttons */}
                {formError && (
                  <div
                    ref={submitErrorRef}
                    style={{
                      margin: '0 28px 14px', padding: '12px 16px', background: '#fef2f2',
                      border: '2px solid #dc2626', borderLeft: '6px solid #dc2626', color: '#b91c1c',
                      fontWeight: 700, fontSize: '0.85rem', borderRadius: 0, display: 'flex', alignItems: 'center', gap: 8,
                    }}
                  >
                    <AlertTriangle size={18} style={{ flexShrink: 0 }} /> {formError}
                  </div>
                )}

                {/* Footer */}
                <div className="rsp-modal-footer">
                  <button type="button" className="rsp-cancel-btn" onClick={() => setCartOpen(false)}>Cancel</button>
                  <button type="submit" className="rsp-submit-btn" disabled={placingOrder || cartItems.length === 0}>
                    {placingOrder
                      ? <>Processing…</>
                      : <><ShoppingCart size={18} /> Confirm Order</>
                    }
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default RetailStorePage;