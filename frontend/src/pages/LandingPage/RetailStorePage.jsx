import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from '../../services/apiClient';
import { PublicNav } from './PublicNavFooter';
import { Store, ShoppingCart, Search, Package, Plus, Minus, Trash2, X, CheckCircle, Star, Zap, TrendingUp, ArrowRight, Truck, Phone, Mail, FileText, Shield, Info, CreditCard, Box, ChevronDown, ChevronUp, Clock, Banknote, User, LogIn, UserPlus, AlignLeft } from 'lucide-react';
import retailStoreHero from '../../assets/hero-section/retail store.jpg';

const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');

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
  background: white;
  border-bottom: 1px solid #e4e6ea;
  padding: 14px 0;
  position: sticky;
  top: 68px;
  z-index: 100;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}
.rsp-toolbar-inner {
  max-width: 100%;
  margin: 0 auto;
  padding: 0 24px;
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
.rsp-search {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: transparent;
  border: 1px solid rgba(255,255,255,0.7);
  border-radius: 0;
  width: 100%;
  max-width: 600px;
  margin-top: 30px;
  transition: all 0.2s;
}
.rsp-search:focus-within { border-color: white; background: rgba(255,255,255,0.1); }
.rsp-search input { border: none; outline: none; flex: 1; font-size: 15px; color: white; background: transparent; font-family: inherit; }
.rsp-search input::placeholder { color: rgba(255,255,255,0.7); }
.rsp-cat-pill {
  padding: 7px 18px;
  border-radius: 0;
  border: 1.5px solid #e2e8f0;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  transition: all 0.2s;
  background: #f8fafc;
  color: #64748b;
  font-family: inherit;
}
.rsp-cat-pill:hover { background: #e2e8f0; color: #334155; }
.rsp-cat-pill.active { background: linear-gradient(135deg,#059669,#10b981); color: white; border-color: transparent; box-shadow: 0 4px 12px rgba(5,150,105,0.3); }

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
  background: white;
  border-radius: 0;
  overflow: hidden;
  border: 1px solid #e4e6ea;
  box-shadow: 0 1px 4px rgba(0,0,0,0.04);
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4,0,0.2,1);
  display: flex;
  flex-direction: column;
  animation: fadeUp 0.4s both;
}
.rsp-card:hover { box-shadow: 0 12px 32px rgba(0,0,0,0.1); transform: translateY(-4px); border-color: #c7e7dc; }
.rsp-card-img-wrap {
  position: relative;
  overflow: hidden;
  aspect-ratio: 4/3;
  background: linear-gradient(135deg, #f1f5f9, #e2e8f0);
  display: flex;
  align-items: center;
  justify-content: center;
}
.rsp-card-img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.5s; }
.rsp-card:hover .rsp-card-img { transform: scale(1.06); }
.rsp-card-badge {
  position: absolute;
  top: 12px;
  left: 12px;
  background: rgba(255,255,255,0.92);
  backdrop-filter: blur(6px);
  padding: 4px 12px;
  border-radius: 0;
  font-size: 11px;
  font-weight: 700;
  color: #0f172a;
  letter-spacing: 0.3px;
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
}
.rsp-card-body { padding: 18px 20px 20px; flex: 1; display: flex; flex-direction: column; }
.rsp-card-name { font-size: 15px; font-weight: 700; color: #0f172a; margin: 0 0 6px; line-height: 1.4; }
.rsp-card-desc { font-size: 12px; color: #64748b; margin: 0 0 16px; line-height: 1.5; flex: 1; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.rsp-card-footer { margin-top: auto; display: flex; align-items: center; justify-content: space-between; }
.rsp-price { font-size: 20px; font-weight: 800; color: #059669; }
.rsp-price-sub { font-size: 11px; color: #94a3b8; margin-top: 2px; }
.rsp-add-btn {
  background: linear-gradient(135deg,#0f172a,#1e293b);
  color: white;
  border: none;
  padding: 10px 16px;
  border-radius: 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 700;
  font-size: 13px;
  transition: all 0.2s;
  font-family: inherit;
}
.rsp-add-btn:hover:not(:disabled) { background: linear-gradient(135deg,#059669,#10b981); transform: scale(1.03); }
.rsp-add-btn:disabled { opacity: 0.45; cursor: not-allowed; }

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
    setPlacingOrder(true);
    try {
      const res = await axios.post('/retail/orders/place', {
        delivery_type: orderForm.delivery_address ? 'delivery' : 'pickup',
        ...orderForm
      });
      const invoice = res.data?.data?.invoice_number || res.data?.invoice_number || 'N/A';
      setOrderSuccess(invoice);
      setCartItems([]);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to place order');
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
        <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', margin: 0 }}>
              {catFilter === 'all' ? 'All Products' : categories.find(c => String(c.id) === catFilter)?.name || 'Products'}
            </h2>
            <p style={{ fontSize: 13, color: '#64748b', margin: '2px 0 0' }}>{filtered.length} item{filtered.length !== 1 ? 's' : ''} found</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#059669', fontWeight: 600 }}>
            <TrendingUp size={15} /> Live Stock
          </div>
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
        <div style={{ marginTop: 60, padding: '40px 0', borderTop: '1px solid #e2e8f0' }}>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>How to Buy</h2>
          <p style={{ fontSize: 15, color: '#64748b', marginBottom: 24 }}>Two simple ways to get what you need.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
            {HOW_TO_BUY.map(step => (
              <div key={step.n} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 0, padding: '24px' }}>
                <div style={{ width: 48, height: 48, borderRadius: 0, background: '#f8fafc', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                  <step.icon size={24} />
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>{step.n}. {step.title}</h3>
                <p style={{ fontSize: 14, color: '#64748b', margin: 0, lineHeight: 1.6 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Section: Delivery & Payment ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 40, marginTop: 40 }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}><Truck size={22} color="#059669"/> Delivery / Pickup</h2>
            <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 0, padding: 20 }}>
              <div style={{ marginBottom: 16 }}>
                <strong style={{ display: 'block', color: '#0f172a', marginBottom: 4 }}>Standard Delivery</strong>
                <span style={{ fontSize: 14, color: '#64748b' }}>Available in major areas. Fees calculated at checkout. Delivery within 1-2 business days for in-stock items.</span>
              </div>
              <div>
                <strong style={{ display: 'block', color: '#0f172a', marginBottom: 4 }}>Store Pickup</strong>
                <span style={{ fontSize: 14, color: '#64748b' }}>Free pickup from our main branch. Ready within 2 hours for in-stock items.</span>
              </div>
            </div>
          </div>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}><CreditCard size={22} color="#059669"/> Payment Methods</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'white', border: '1px solid #e2e8f0', borderRadius: 0, padding: 16 }}>
                <Banknote size={20} color="#3b82f6" />
                <div>
                  <strong style={{ display: 'block', color: '#0f172a', fontSize: 14 }}>Bank Transfer</strong>
                  <span style={{ fontSize: 13, color: '#64748b' }}>Direct transfer to our accounts (CBE, Awash, etc.)</span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'white', border: '1px solid #e2e8f0', borderRadius: 0, padding: 16 }}>
                <Clock size={20} color="#f59e0b" />
                <div>
                  <strong style={{ display: 'block', color: '#0f172a', fontSize: 14 }}>Mobile Money</strong>
                  <span style={{ fontSize: 13, color: '#64748b' }}>Telebirr, CBE Birr, and other wallets supported.</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Section: FAQs ── */}
        <div style={{ marginTop: 60, padding: '40px 0', borderTop: '1px solid #e2e8f0' }}>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', marginBottom: 24 }}>Frequently Asked Questions</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {FAQS.map((f, i) => (
              <div key={i} style={{ borderBottom: '1px solid #e2e8f0' }}>
                <button 
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  style={{ width: '100%', background: 'none', border: 'none', padding: '20px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 600, color: '#0f172a', fontSize: 16, cursor: 'pointer', textAlign: 'left' }}
                >
                  {f.q}
                  {openFaq === i ? <ChevronUp size={18} color="#059669" /> : <ChevronDown size={18} color="#64748b" />}
                </button>
                {openFaq === i && <div style={{ padding: '0 0 20px', color: '#64748b', fontSize: 15, lineHeight: 1.6 }}>{f.a}</div>}
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ── Trust, Legal & Contact ── */}
      <div style={{ background: '#0f172a', color: '#fff', padding: '60px 24px', position: 'relative', zIndex: 5 }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 32 }}>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: '#34d399' }}>Legal & Policies</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 13, color: '#94a3b8' }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}><Shield size={16} color="#34d399" style={{flexShrink:0, marginTop:2}} /> <div><strong>Terms of Service:</strong> Direct purchases can be returned within 3 days. Supplier orders are final sale once approved.</div></div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}><FileText size={16} color="#34d399" style={{flexShrink:0, marginTop:2}} /> <div><strong>Privacy Policy:</strong> Your contact and address details are used solely for order fulfillment.</div></div>
            </div>
          </div>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: '#fbbf24' }}>Disclaimer</h3>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 13, color: '#94a3b8' }}>
              <Info size={16} color="#fbbf24" style={{flexShrink:0, marginTop:2}} />
              <p style={{ margin: 0, lineHeight: 1.5 }}>Product availability, packaging, and final pricing may vary slightly for supplier orders compared to in-stock items. We always confirm details before billing.</p>
            </div>
          </div>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: '#34d399' }}>Store Support</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 14, color: '#94a3b8' }}>
              <a href="tel:+251911000000" style={{ color: '#94a3b8', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}><Phone size={16} color="#34d399" /> +251 911 000 000</a>
              <a href="mailto:store@sutana.com" style={{ color: '#94a3b8', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}><Mail size={16} color="#34d399" /> store@sutana.com</a>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, fontSize: 13 }}><Clock size={16} color="#34d399" /> Mon-Sat, 8AM - 8PM</div>
            </div>
          </div>
        </div>
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
              <form onSubmit={e => { e.preventDefault(); placeOrder(); }}>
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

                  {/* Price Summary */}
                  <div className="rsp-price-summary">
                    <div className="rsp-section-divider" style={{ borderTop: 'none', paddingTop: 0, marginTop: 0 }}>
                      <Banknote size={14} /> Price Summary
                    </div>
                    <div className="rsp-price-row">
                      <span>Subtotal ({cartCount} item{cartCount !== 1 ? 's' : ''})</span>
                      <span style={{ fontWeight: 700 }}>{cartTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ETB</span>
                    </div>
                    <div className="rsp-price-row rsp-price-total">
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>💰 Total Amount Due</span>
                      <span>{cartTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ETB</span>
                    </div>
                  </div>

                </div>

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