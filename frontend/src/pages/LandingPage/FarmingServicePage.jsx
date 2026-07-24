import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { PublicNav } from './PublicNavFooter';
import authService from '../../services/authService';
import axios from '../../services/apiClient';
import { Search, Sprout, Leaf, MapPin, Package, X, ChevronDown, ChevronUp, Calendar, Info, ShoppingCart, Shield, Droplets, Wrench, FileText, Phone, Mail, PhoneCall, HelpCircle, Tractor, Clock, CreditCard, Wallet, Fuel, Upload, CheckCircle2 } from 'lucide-react';
import tractorService from '../../services/tractorService';
import PrescriptionViewer from '../shared/PrescriptionViewer';
import styles from './FarmingServicePage.module.css';
import farmingHero from '../../assets/hero-section/farming.jpg';

const TYPE_CONFIG = {
  seeds: { icon: <Sprout size={16} />, label: 'Seeds', color: '#d97706', bg: '#fffbeb' },
  fertilizers: { icon: <Droplets size={16} />, label: 'Fertilizers', color: '#059669', bg: '#ecfdf5' },
  tools: { icon: <Wrench size={16} />, label: 'Tools', color: '#2563eb', bg: '#eff6ff' },
  pesticides: { icon: <Shield size={16} />, label: 'Pesticides', color: '#dc2626', bg: '#fef2f2' },
  animal_feed: { icon: <Leaf size={16} />, label: 'Feed', color: '#7c3aed', bg: '#f5f3ff' },
  general: { icon: <Package size={16} />, label: 'General', color: '#64748b', bg: '#f1f5f9' },
};

const HOW_TO_HIRE = [
  { n: '1', title: 'Choose Machine', desc: 'Select from our fleet of well-maintained tractors and farm equipment above.', icon: Tractor },
  { n: '2', title: 'Call Sutana', desc: 'Dial our direct line to check availability for your required dates.', icon: PhoneCall },
  { n: '3', title: 'Confirm Details', desc: 'Provide your location, field size, and specific farming needs.', icon: MapPin },
  { n: '4', title: 'Driver Arrives', desc: 'Our experienced driver arrives with the equipment ready to work.', icon: Clock },
];

const AGRIRENT_FAQS = [
  { q: "How far in advance should I book?", a: "We recommend booking at least 3-5 days in advance during peak planting or harvesting seasons to ensure availability." },
  { q: "Is fuel included in the price?", a: "Fuel is typically not included in the rate. The machine arrives full, and you are responsible for fuel used during operation, or we can include it for an additional calculated fee." },
  { q: "Do I need to provide a driver?", a: "No. All our tractors and heavy machinery come with a trained, professional Sutana driver/operator. Self-drive is not permitted." },
  { q: "When do I pay for the service?", a: "A deposit is required to secure the booking. The remaining balance is paid upon completion of the work." },
];

function resolveImg(url) {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${axios.defaults.baseURL.replace('/api/v1', '')}${url}`;
}

const FarmingServicePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const fileRef = useRef(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [viewImage, setViewImage] = useState(null);
  const [openFaq, setOpenFaq] = useState(null);
  const [loading, setLoading] = useState(false);
  const [allProducts, setAllProducts] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [categories] = useState([]);
  const [expandedDesc, setExpandedDesc] = useState({});
  const [toast, setToast] = useState({ show: false, type: '', title: '', message: '' });

  // ── Auth / User ─────────────────────────────
  const [currentUser, setCurrentUser] = useState(null);

  // ── Order Modal State ─────────────────────────────
  const [orderModal, setOrderModal] = useState({ open: false, tractor: null });
  const [orderForm, setOrderForm] = useState({
    startDate: '', endDate: '',
    fieldLocation: '', fieldSizeHectares: '',
    farmingPurpose: '', specialInstructions: '',
    paymentMethod: 'Telebirr', paymentReference: ''
  });
  const [orderFile, setOrderFile] = useState(null);
  const [orderSubmitting, setOrderSubmitting] = useState(false);
  const [orderError, setOrderError] = useState('');
  const [orderSuccess, setOrderSuccess] = useState(null);
  const [financeAccounts, setFinanceAccounts] = useState([]);

  // ── Load finance accounts (same pattern as PharmacySalesForm) ─────────────
  const loadFinanceAccounts = async () => {
    try {
      // apiClient interceptor unwraps response.data → result = { success, data, summary }
      const result = await axios.get('/finance-bank');
      if (result && result.success && Array.isArray(result.data)) {
        setFinanceAccounts(result.data);
      } else if (Array.isArray(result)) {
        setFinanceAccounts(result);
      } else if (result && Array.isArray(result.data)) {
        setFinanceAccounts(result.data);
      }
    } catch (e) {
      // On public pages a 401 is silently rejected — that's OK when user IS logged in
      // but token was not sent. Try again with explicit token header.
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const result2 = await axios.get('/finance-bank', { headers: { Authorization: `Bearer ${token}` } });
          if (result2 && Array.isArray(result2.data)) setFinanceAccounts(result2.data);
          else if (Array.isArray(result2)) setFinanceAccounts(result2);
        } catch (e2) {
          console.error('[FarmingPage] Failed to load finance accounts:', e2.message);
        }
      } else {
        console.error('[FarmingPage] No token, cannot load finance accounts:', e.message);
      }
    }
  };

  useEffect(() => {
    const fetchPublicData = async () => {
      try {
        setLoading(true);
        const res = await tractorService.getAllPublicTractors();
        if (res.status === 'success') {
          setAllProducts(res.data);
          setSearchResults(res.data);
        }
      } catch (error) {
        console.error('Failed to fetch tractors', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPublicData();
  }, []);

  // Load current user on mount
  useEffect(() => {
    if (authService.isAuthenticated()) setCurrentUser(authService.getCurrentUser());
  }, []);

  // Auto-open modal after returning from login
  useEffect(() => {
    if (location.state?.openFarmingOrder && authService.isAuthenticated()) {
      const tractor = location.state.tractor;
      if (tractor) {
        const user = authService.getCurrentUser();
        setCurrentUser(user);
        setOrderModal({ open: true, tractor: tractor });
        setOrderForm({ startDate: '', endDate: '', fieldLocation: '', fieldSizeHectares: '', farmingPurpose: '', specialInstructions: '', paymentMethod: '', paymentReference: '' });
        setOrderFile(null);
        setOrderError('');
        setOrderSuccess(null);
        loadFinanceAccounts();
      }
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const handleSearch = () => {
    let filtered = allProducts;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(prod =>
        prod.name.toLowerCase().includes(query) ||
        (prod.description && prod.description.toLowerCase().includes(query)) ||
        (prod.tractor_type || prod.tractorType)?.toLowerCase().includes(query)
      );
    }
    setSearchResults(filtered);
  };

  useEffect(() => { handleSearch(); }, [searchQuery, selectedCategory]);

  const handleCategoryClick = (categoryId) => setSelectedCategory(selectedCategory === categoryId ? null : categoryId);

  const showToast = (type, title, message) => {
    setToast({ show: true, type, title, message });
    setTimeout(() => setToast({ show: false, type: '', title: '', message: '' }), 6000);
  };

  const openOrderModal = (product) => {
    if (!authService.isAuthenticated()) {
      navigate('/login', { state: { openFarmingOrder: true, tractor: product, from: '/services/farming' } });
      return;
    }
    const user = authService.getCurrentUser();
    setCurrentUser(user);
    setOrderModal({ open: true, tractor: product });
    setOrderForm({ startDate: '', endDate: '', fieldLocation: '', fieldSizeHectares: '', farmingPurpose: '', specialInstructions: '', paymentMethod: '', paymentReference: '' });
    setOrderFile(null);
    setOrderError('');
    setOrderSuccess(null);
    loadFinanceAccounts();
  };

  const closeOrderModal = () => {
    if (orderSubmitting) return;
    setOrderModal({ open: false, tractor: null });
    setOrderSuccess(null);
  };

  const totalDays = (() => {
    if (!orderForm.startDate || !orderForm.endDate) return 0;
    const diff = new Date(orderForm.endDate) - new Date(orderForm.startDate);
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  })();

  const dailyRate = parseFloat(orderModal.tractor?.daily_rate || orderModal.tractor?.dailyRate || 0);
  const totalAmount = dailyRate * totalDays;

  const handleOrderSubmit = async (e) => {
    e.preventDefault();
    if (totalDays <= 0) { setOrderError('End date must be after start date.'); return; }
    if (!orderForm.paymentMethod) { setOrderError('Please select a payment account / method.'); return; }
    if (!orderForm.paymentReference && !orderFile) { setOrderError('Please enter a payment reference or upload a screenshot.'); return; }
    setOrderSubmitting(true);
    setOrderError('');
    try {
      const fd = new FormData();
      fd.append('tractorId', orderModal.tractor.id);
      fd.append('startDate', orderForm.startDate);
      fd.append('endDate', orderForm.endDate);
      fd.append('fieldLocation', orderForm.fieldLocation);
      fd.append('fieldSizeHectares', orderForm.fieldSizeHectares);
      fd.append('farmingPurpose', orderForm.farmingPurpose);
      fd.append('specialInstructions', orderForm.specialInstructions);
      // paymentMethod stores the account ID; resolve to human-readable account name for backend
      const selectedAcc = financeAccounts.find(a => String(a.id) === String(orderForm.paymentMethod));
      fd.append('paymentMethod', selectedAcc ? selectedAcc.account_name : orderForm.paymentMethod);
      fd.append('paymentReference', orderForm.paymentReference);
      if (orderFile) fd.append('paymentScreenshot', orderFile);

      const res = await axios.post('/agrirent-orders', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      // apiClient interceptor returns response.data directly (res IS the data object)
      if (res.status === 'success') {
        setOrderSuccess(res.data);
        showToast('success', '\uD83C\uDF89 Order Submitted!', `Your AgriRent order #${res.data.orderNumber} is now pending confirmation. Our team will contact you shortly.`);
      } else if (res.data && res.data.status === 'success') {
        setOrderSuccess(res.data.data);
        showToast('success', '\uD83C\uDF89 Order Submitted!', `Your AgriRent order #${res.data.data.orderNumber} is now pending confirmation.`);
      } else {
        setOrderError('Failed to submit order. Please try again.');
      }
    } catch (err) {
      setOrderError(err.response?.data?.message || 'An error occurred. Please try again.');
    } finally {
      setOrderSubmitting(false);
    }
  };

  const handleImageClick = (imageUrl, name) => {
    const url = new URL(window.location);
    url.searchParams.set('viewImage', imageUrl); url.searchParams.set('imageName', name);
    window.history.pushState({}, '', url);
    setViewImage({ url: imageUrl, name });
  };

  const handleCloseViewer = () => {
    const url = new URL(window.location);
    url.searchParams.delete('viewImage'); url.searchParams.delete('imageName');
    window.history.pushState({}, '', url);
    setViewImage(null);
  };

  return (
    <div className={styles.pageWrapper}>
      <PublicNav />

      {/* Hero Section */}
      <section className={styles.heroSection}>
        <div 
          className={styles.heroBgZoom} 
          style={{ backgroundImage: `url(${farmingHero})` }}
        />
        <div className={styles.heroContent}>
          <h1>SUTANA Agri<span className={styles.goldText}>Rent</span></h1>
          
          <div className={styles.searchContainer}>
            <div className={styles.searchWrapper}>
              <Search className={styles.searchIcon} size={20} />
              <input 
                type="text" 
                placeholder="Search products by name or category..." 
                value={searchQuery} 
                onChange={e => setSearchQuery(e.target.value)} 
                onKeyDown={e => e.key === 'Enter' && handleSearch()} 
                className={styles.searchInput} 
              />
              <button className={styles.searchBtn} onClick={handleSearch}>Search</button>
            </div>
          </div>
        </div>
      </section>

      {/* Toast Notification Banner */}
      {toast.show && (
        <div style={{
          position: 'fixed', top: '80px', left: '50%', transform: 'translateX(-50%)',
          zIndex: 9999, minWidth: '340px', maxWidth: '560px',
          background: toast.type === 'success' ? '#f0fdf4' : '#fef2f2',
          border: `1.5px solid ${toast.type === 'success' ? '#86efac' : '#fca5a5'}`,
          borderRadius: '12px', padding: '1rem 1.5rem',
          boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
          display: 'flex', flexDirection: 'column', gap: '4px'
        }}>
          <p style={{ margin: 0, fontWeight: '700', fontSize: '15px', color: toast.type === 'success' ? '#15803d' : '#dc2626' }}>
            {toast.title}
          </p>
          <p style={{ margin: 0, fontSize: '13px', color: toast.type === 'success' ? '#166534' : '#991b1b' }}>
            {toast.message}
          </p>
        </div>
      )}

      {/* Main Content */}
      <section className={styles.mainContent}>
        {/* Categories */}
        <div className={styles.categoriesSection} style={{display: 'none'}}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Browse by Category</h2>
            {selectedCategory && <button className={styles.clearFilterBtn} onClick={() => setSelectedCategory(null)}>Clear Filter</button>}
          </div>
          {loading ? (
            <div className={styles.loadingGrid}>
              {[1,2,3,4,5,6].map(i => <div key={i} className={styles.skeleton} />)}
            </div>
          ) : (
            <div className={styles.categoryGrid}>
              {categories.map((cat) => {
                const tc = TYPE_CONFIG[cat.type] || TYPE_CONFIG.general;
                const isActive = selectedCategory === cat.id;
                return (
                  <div key={cat.id} className={`${styles.categoryCard} ${isActive ? styles.categoryCardActive : ''}`} onClick={() => handleCategoryClick(cat.id)} style={{ '--cat-bg': tc.bg, '--cat-color': tc.color }}>
                    {cat.cover_image && (
                      <div className={styles.catImageWrapper}>
                        <img src={resolveImg(cat.cover_image)} alt={cat.name} className={styles.catImage} />
                        <div className={styles.catImageOverlay} />
                      </div>
                    )}
                    <div className={styles.catContent}>
                      <div className={styles.catTypeBadge} style={{ background: tc.bg, color: tc.color }}>{tc.icon} {tc.label}</div>
                      <h3 className={styles.catName}>{cat.name}</h3>
                      <p className={`${styles.catDesc} ${expandedDesc[cat.id] ? styles.expanded : ''}`}>{cat.description}</p>
                      {cat.description?.length > 60 && (
                        <button className={styles.readMoreBtn} onClick={(e) => { e.stopPropagation(); setExpandedDesc(p => ({ ...p, [cat.id]: !p[cat.id] })); }}>
                          {expandedDesc[cat.id] ? 'Read Less' : 'Read More'}
                        </button>
                      )}
                      <div className={styles.catProductCount} style={{ display: 'none' }}>{allProducts.filter(p => p.category_id === cat.id).length} Products</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Products */}
        <div className={styles.productsSection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle} style={{ display: 'none' }}>
              {selectedCategory ? categories.find(c => c.id === selectedCategory)?.name || 'Products' : 'All Products'}
            </h2>
            <span className={styles.productCount} style={{ display: 'none' }}>{searchResults.length} product{searchResults.length !== 1 ? 's' : ''}</span>
          </div>

          {loading ? (
            <div className={styles.loadingGrid}>
              {[1,2,3,4,5,6].map(i => <div key={i} className={styles.skeleton} />)}
            </div>
          ) : searchResults.length === 0 ? (
            <div className={styles.noResults}>
              <Sprout size={56} />
              <h3>No products found</h3>
              <p>Try adjusting your search or selecting a different category.</p>
            </div>
          ) : (
            <div className={styles.productsGrid}>
              {searchResults.map((product) => {
                const cat = categories.find(c => c.id === product.category_id);
                const tc = cat ? TYPE_CONFIG[cat.type] || TYPE_CONFIG.general : TYPE_CONFIG.general;
                return (
                  <div key={product.id} className={styles.productCard} style={{ animationDelay: (searchResults.indexOf(product) * 0.07) + 's' }}>
                    {/* Image Section */}
                    <div className={styles.productImageWrapper}>
                      {product.image1 ? (
                        <img src={resolveImg(product.image1)} alt={product.name} className={styles.productImage} onClick={() => handleImageClick(product.image1, product.name)} />
                      ) : (
                        <div className={styles.productPlaceholder}><Tractor size={60} /></div>
                      )}
                      <div className={styles.productImageBadges}>
                        <span className={styles.typeBadge}><Tractor size={12}/> {product.tractor_type || product.tractorType || 'Tractor'}</span>
                        {product.availability !== 'Available' && <span className={styles.outOfStockBadge}>{product.availability}</span>}
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className={styles.productInfo}>
                      <h3 className={styles.productName}>{product.name}</h3>
                      <p className={styles.productCategory}>
                        <Fuel size={13}/> {product.fuel_type || product.fuelType || '—'} &bull; {product.transmission || '—'}
                      </p>
                      <div className={styles.cardFooter}>
                        <div>
                          <div className={styles.cardPrice}>ETB {parseFloat(product.daily_rate || product.dailyRate || 0).toLocaleString()}</div>
                          <div className={styles.cardPriceSub}>per day</div>
                        </div>
                        {product.availability === 'Available' ? (
                          <button onClick={() => openOrderModal(product)} className={styles.orderBtn}>
                            <ShoppingCart size={15} /> Order Now
                          </button>
                        ) : (
                          <button className={styles.orderBtn} disabled>
                            <X size={15} /> Unavailable
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ══════════════════════════════════════════════
              STATIC INFO SECTIONS — AgriRent Page
            ══════════════════════════════════════════════ */}

        {/* ── How to Hire ── */}
        <section style={{ background: 'linear-gradient(135deg,#f0fdf4 0%,#eff6ff 100%)', padding: '72px 24px' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 56 }}>
              <span style={{ display: 'inline-block', background: 'linear-gradient(135deg,#059669,#10b981)', color: '#fff', fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '6px 18px', borderRadius: 999, marginBottom: 14 }}>Simple Process</span>
              <h2 style={{ fontSize: 'clamp(26px,4vw,38px)', fontWeight: 900, color: '#0f172a', margin: '0 0 12px', letterSpacing: '-0.02em' }}>How to Hire a Machine</h2>
              <p style={{ fontSize: 16, color: '#64748b', maxWidth: 520, margin: '0 auto', lineHeight: 1.65 }}>Four easy steps to get your field work done. Fast, reliable, and professional.</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 20, position: 'relative' }}>
              {HOW_TO_HIRE.map((step, i) => (
                <div key={step.n} style={{ background: '#fff', borderRadius: 20, padding: '32px 24px', textAlign: 'center', boxShadow: '0 4px 24px rgba(0,0,0,0.06)', border: '1px solid rgba(5,150,105,0.1)', position: 'relative', transition: 'transform 0.25s', cursor: 'default' }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-6px)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'linear-gradient(135deg,#059669,#10b981)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px', boxShadow: '0 8px 20px rgba(5,150,105,0.3)' }}>
                    <step.icon size={26} color="#fff" />
                  </div>
                  <div style={{ position: 'absolute', top: 16, right: 16, width: 26, height: 26, borderRadius: '50%', background: 'linear-gradient(135deg,#0f172a,#1e293b)', color: '#fff', fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{step.n}</div>
                  <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>{step.title}</h3>
                  <p style={{ fontSize: 13, color: '#64748b', margin: 0, lineHeight: 1.6 }}>{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Requirements & Pricing ── */}
        <section style={{ background: '#fff', padding: '72px 24px' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(340px,1fr))', gap: 32 }}>
            {/* Service Coverage */}
            <div style={{ background: 'linear-gradient(135deg,#fef3c7,#fef9c3)', borderRadius: 24, padding: '40px 36px', border: '1px solid rgba(245,158,11,0.2)' }}>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: 'linear-gradient(135deg,#f59e0b,#fbbf24)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24, boxShadow: '0 8px 20px rgba(245,158,11,0.3)' }}>
                <MapPin size={28} color="#fff" />
              </div>
              <h3 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>Coverage & Details</h3>
              <p style={{ fontSize: 14, color: '#78716c', marginBottom: 24 }}>Important information about our service areas.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  { label: 'Coverage Area', value: 'Addis Ababa & surrounding farming zones' },
                  { label: 'Booking Method', value: 'Phone booking only. No online self-booking.' },
                  { label: 'Included Staff', value: 'Professional driver/operator always included' },
                ].map(r => (
                  <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, padding: '12px 16px', background: 'rgba(255,255,255,0.7)', borderRadius: 12, backdropFilter: 'blur(4px)' }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#92400e' }}>{r.label}</span>
                    <span style={{ fontSize: 13, color: '#78716c', textAlign: 'right', maxWidth: '55%' }}>{r.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Pricing */}
            <div style={{ background: 'linear-gradient(135deg,#eff6ff,#e0f2fe)', borderRadius: 24, padding: '40px 36px', border: '1px solid rgba(59,130,246,0.2)' }}>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: 'linear-gradient(135deg,#3b82f6,#0ea5e9)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24, boxShadow: '0 8px 20px rgba(59,130,246,0.3)' }}>
                <Wallet size={28} color="#fff" />
              </div>
              <h3 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>Pricing Structure</h3>
              <p style={{ fontSize: 14, color: '#475569', marginBottom: 24 }}>Flexible rates based on your specific farm needs.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  { label: 'Per Hour Rate', value: 'Available for short-term minor field work' },
                  { label: 'Daily Rate', value: 'Standard flat rate for full-day tractor usage' },
                  { label: 'Per Hectare', value: 'Priced by land size for plowing/harvesting' },
                  { label: 'Fuel Costs', value: 'Fuel is billed separately or supplied by client' },
                ].map(r => (
                  <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, padding: '12px 16px', background: 'rgba(255,255,255,0.7)', borderRadius: 12 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#1d4ed8' }}>{r.label}</span>
                    <span style={{ fontSize: 13, color: '#475569', textAlign: 'right', maxWidth: '55%' }}>{r.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── FAQs ── */}
        <section style={{ background: '#f8fafc', padding: '72px 24px' }}>
          <div style={{ maxWidth: 800, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
              <span style={{ display: 'inline-block', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '6px 18px', borderRadius: 999, marginBottom: 14 }}>FAQs</span>
              <h2 style={{ fontSize: 'clamp(24px,4vw,34px)', fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>Common Questions</h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {AGRIRENT_FAQS.map((f, i) => (
                <div key={i} style={{ background: openFaq === i ? 'linear-gradient(135deg,#f0fdf4,#eff6ff)' : '#fff', borderRadius: 16, border: `1px solid ${openFaq === i ? 'rgba(5,150,105,0.25)' : '#e2e8f0'}`, overflow: 'hidden', transition: 'all 0.25s ease' }}>
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    style={{ width: '100%', background: 'none', border: 'none', padding: '22px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 700, color: '#0f172a', fontSize: 15, cursor: 'pointer', textAlign: 'left', gap: 16 }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <span style={{ width: 30, height: 30, borderRadius: '50%', background: openFaq === i ? 'linear-gradient(135deg,#059669,#10b981)' : '#f1f5f9', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background 0.25s' }}>
                        <HelpCircle size={14} color={openFaq === i ? '#fff' : '#64748b'} />
                      </span>
                      {f.q}
                    </span>
                    {openFaq === i
                      ? <ChevronUp size={18} color="#059669" style={{ flexShrink: 0 }} />
                      : <ChevronDown size={18} color="#94a3b8" style={{ flexShrink: 0 }} />}
                  </button>
                  {openFaq === i && (
                    <div style={{ padding: '0 24px 22px 68px', color: '#475569', fontSize: 14, lineHeight: 1.7 }}>{f.a}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Trust, Legal & Contact ── */}
        <section style={{ background: 'linear-gradient(135deg,#0f172a 0%,#1e293b 100%)', padding: '72px 24px', position: 'relative', overflow: 'hidden' }}>
          {/* decorative glow */}
          <div style={{ position: 'absolute', top: -120, right: -120, width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle,rgba(5,150,105,0.18) 0%,transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: -80, left: -80, width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle,rgba(99,102,241,0.14) 0%,transparent 70%)', pointerEvents: 'none' }} />

          <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 1 }}>
            <div style={{ textAlign: 'center', marginBottom: 56 }}>
              <h2 style={{ fontSize: 'clamp(24px,4vw,34px)', fontWeight: 900, color: '#fff', margin: '0 0 10px', letterSpacing: '-0.02em' }}>Trust, Legal & Support</h2>
              <p style={{ fontSize: 15, color: '#94a3b8', margin: 0 }}>Transparent policies. Secure service. We are here to help your farm grow.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 24 }}>
              {/* Terms */}
              <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 20, padding: '32px 28px', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg,#059669,#10b981)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20, boxShadow: '0 6px 16px rgba(5,150,105,0.35)' }}>
                  <Shield size={22} color="#fff" />
                </div>
                <h3 style={{ fontSize: 17, fontWeight: 800, color: '#fff', marginBottom: 12 }}>Terms of Service</h3>
                <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.65, margin: 0 }}>
                  Hiring agreements are subject to equipment availability. Cancellations must be made at least 48 hours prior to the scheduled date to receive a full refund of the deposit. Drivers are responsible for machine operation; clients must ensure safe access to fields.
                </p>
              </div>

              {/* Privacy */}
              <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 20, padding: '32px 28px', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg,#3b82f6,#0ea5e9)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20, boxShadow: '0 6px 16px rgba(59,130,246,0.35)' }}>
                  <FileText size={22} color="#fff" />
                </div>
                <h3 style={{ fontSize: 17, fontWeight: 800, color: '#fff', marginBottom: 12 }}>Privacy Policy</h3>
                <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.65, margin: 0 }}>
                  We collect your farm location and contact details strictly to fulfill service requests. Your data is never sold to third parties. We use industry-standard security to ensure your personal information is protected.
                </p>
              </div>

              {/* Disclaimer */}
              <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 20, padding: '32px 28px', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg,#f59e0b,#fbbf24)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20, boxShadow: '0 6px 16px rgba(245,158,11,0.35)' }}>
                  <Info size={22} color="#fff" />
                </div>
                <h3 style={{ fontSize: 17, fontWeight: 800, color: '#fff', marginBottom: 12 }}>Disclaimer</h3>
                <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.65, margin: 0 }}>
                  Heavy machinery operation is subject to weather conditions. If severe rain or muddy fields make work unsafe or impossible, Sutana reserves the right to reschedule the service without penalty.
                </p>
              </div>
            </div>

            {/* Contact Strip - Primary Call to Action */}
            <div style={{ marginTop: 40, background: 'rgba(5,150,105,0.12)', borderRadius: 20, padding: '32px 36px', border: '1px solid rgba(5,150,105,0.3)', display: 'flex', flexWrap: 'wrap', gap: 32, justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#34d399', marginBottom: 6 }}>Ready to Hire?</div>
                <h3 style={{ fontSize: 20, fontWeight: 800, color: '#fff', margin: 0 }}>Call us directly to book a machine & driver.</h3>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                <a href="tel:+251911000000" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 28px', background: 'linear-gradient(135deg,#059669,#10b981)', borderRadius: 12, border: 'none', color: '#fff', textDecoration: 'none', fontSize: 16, fontWeight: 800, boxShadow: '0 4px 14px rgba(5,150,105,0.35)', transition: 'transform 0.2s' }}>
                  <Phone size={20} color="#fff" /> +251 911 000 000
                </a>
                <a href="mailto:agrirent@sutana.com" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 20px', background: 'rgba(255,255,255,0.08)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.15)', color: '#fff', textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>
                  <Mail size={18} color="#34d399" /> agrirent@sutana.com
                </a>
              </div>
            </div>
          </div>
        </section>
        {/* ── STATIC SECTIONS END ── */}
      </section>

      {/* ── AgriRent Order Modal — Printing-style ────────────────── */}
      {orderModal.open && (
        <div className="psp-overlay" onClick={closeOrderModal}>
          <div className="psp-modal" onClick={e => e.stopPropagation()}>

            {/* Header — identical to printing modal */}
            <div className="psp-modal-header">
              <div>
                <h3 className="psp-modal-title"><Tractor size={22} /> Hire Agricultural Machine</h3>
                <p className="psp-modal-subtitle">{orderModal.tractor?.name} — ETB {dailyRate.toLocaleString()}/day — Fill in all details below</p>
              </div>
              <button className="psp-close-btn" onClick={closeOrderModal}><X size={22} /></button>
            </div>

            {/* SUCCESS */}
            {orderSuccess ? (
              <div className="psp-success-body">
                <span className="psp-success-emoji">✅</span>
                <h3 className="psp-success-title">Order Placed Successfully!</h3>
                <p className="psp-success-sub">
                  Order <strong>{orderSuccess.orderNumber}</strong> has been received.<br />
                  Our team will contact you shortly to confirm the booking.
                </p>
                <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginTop: 8 }}>
                  <button className="psp-print-btn" onClick={() => {
                    const win = window.open('', '_blank', 'width=760,height=800');
                    const u = currentUser || {};
                    const userName = u.fullName || u.full_name || u.name || 'Customer';
                    win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>AgriRent Receipt – ${orderSuccess.orderNumber}</title>
<style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Helvetica Neue',Arial,sans-serif;background:#f5f5f5;padding:20px;color:#1a1a1a}.wrap{max-width:700px;margin:0 auto;background:white;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.12)}.hdr{background:linear-gradient(135deg,#1a2b4b,#0D7C66);padding:30px 36px;display:flex;justify-content:space-between;align-items:center}.hdr-l h1{color:#FFD700;font-size:20px;font-weight:900;margin-bottom:4px}.hdr-l p{color:rgba(255,255,255,0.7);font-size:12px}.ord-no{background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.3);padding:8px 16px;color:white;font-size:13px;font-weight:700;text-align:right}.ord-no span{display:block;font-size:10px;font-weight:400;color:rgba(255,255,255,0.6);margin-bottom:3px}.sbar{background:#0D7C66;padding:8px 36px;font-size:12px;font-weight:700;color:white}.body{padding:28px 36px}.sec-title{font-size:10px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;color:#94a3b8;margin-bottom:14px;padding-bottom:6px;border-bottom:2px solid #e2e8f0}.grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:24px}.cell{background:#f8fafc;border:1px solid #e2e8f0;padding:12px}.cell .lbl{font-size:9px;font-weight:700;letter-spacing:.5px;text-transform:uppercase;color:#94a3b8;margin-bottom:3px}.cell .val{font-size:14px;font-weight:700;color:#0f172a}.total{background:#f0fdf4;border:2px solid #86efac;padding:16px 20px;display:flex;justify-content:space-between;align-items:center;margin-bottom:24px}.total .lbl{font-size:12px;color:#166534;font-weight:700}.total .val{font-size:22px;font-weight:900;color:#059669}.ftr{background:#0f172a;padding:20px 36px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px}.ftr-l{color:rgba(255,255,255,0.6);font-size:11px;line-height:1.7}.ftr-r{color:rgba(255,255,255,0.4);font-size:11px}@media print{body{background:white;padding:0}.wrap{box-shadow:none}}</style></head><body>
<div class="wrap"><div class="hdr"><div class="hdr-l"><h1>🚜 SUTANA AgriRent</h1><p>Agricultural Equipment Hire — Addis Ababa, Ethiopia</p></div><div class="ord-no"><span>ORDER NO.</span>${orderSuccess.orderNumber}</div></div>
<div class="sbar">✅ ORDER RECEIVED — PENDING CONFIRMATION BY OUR TEAM</div>
<div class="body">
<p class="sec-title">Customer Information</p>
<div class="grid">
<div class="cell"><div class="lbl">Full Name</div><div class="val">${userName}</div></div>
<div class="cell"><div class="lbl">Email</div><div class="val">${u.email || '—'}</div></div>
<div class="cell"><div class="lbl">Phone</div><div class="val">${u.phone || '—'}</div></div>
<div class="cell"><div class="lbl">Order Date</div><div class="val">${new Date().toLocaleDateString('en-GB',{day:'2-digit',month:'long',year:'numeric'})}</div></div>
</div>
<p class="sec-title">Hired Machine</p>
<div class="grid">
<div class="cell"><div class="lbl">Machine</div><div class="val">${orderModal.tractor?.name || '—'}</div></div>
<div class="cell"><div class="lbl">Type</div><div class="val">${orderModal.tractor?.tractor_type || orderModal.tractor?.tractorType || '—'}</div></div>
<div class="cell"><div class="lbl">Start Date</div><div class="val">${orderForm.startDate}</div></div>
<div class="cell"><div class="lbl">End Date</div><div class="val">${orderForm.endDate}</div></div>
<div class="cell"><div class="lbl">Duration</div><div class="val">${totalDays} day${totalDays!==1?'s':''}</div></div>
<div class="cell"><div class="lbl">Daily Rate</div><div class="val">ETB ${dailyRate.toLocaleString()}</div></div>
${orderForm.fieldLocation?`<div class="cell"><div class="lbl">Field Location</div><div class="val">${orderForm.fieldLocation}</div></div>`:''}${orderForm.fieldSizeHectares?`<div class="cell"><div class="lbl">Field Size</div><div class="val">${orderForm.fieldSizeHectares} ha</div></div>`:''}${orderForm.farmingPurpose?`<div class="cell"><div class="lbl">Purpose</div><div class="val">${orderForm.farmingPurpose}</div></div>`:''}
</div>
<div class="total"><div class="lbl">TOTAL ESTIMATED AMOUNT</div><div class="val">ETB ${totalAmount.toLocaleString()}</div></div>
<p class="sec-title">Payment Info</p>
<div class="grid">
<div class="cell"><div class="lbl">Method</div><div class="val">${orderForm.paymentMethod}</div></div>
<div class="cell"><div class="lbl">Reference</div><div class="val">${orderForm.paymentReference||'Screenshot Uploaded'}</div></div>
</div>
${orderSuccess.orderNumber?`<p style="text-align:center;font-size:11px;color:#94a3b8;margin-top:20px;font-family:monospace;letter-spacing:3px;font-size:22px;color:#1a2b4b;background:#f1f5f9;padding:10px">${orderSuccess.orderNumber}</p>`:''}
</div>
<div class="ftr"><div class="ftr-l">SUTANA AgriRent &nbsp;|&nbsp; Addis Ababa, Ethiopia<br/>📞 +251 911 000 000 &nbsp;|&nbsp; ✉️ agrirent@sutana.com</div><div class="ftr-r">Printed: ${new Date().toLocaleString()}</div></div>
</div><script>window.onload=function(){window.print()}<\/script></body></html>`);
                    win.document.close();
                  }}>
                    <Tractor size={18} /> Print Receipt
                  </button>
                  <button style={{ padding: '12px 24px', background: '#f1f5f9', border: '2px solid #e2e8f0', borderRadius: 0, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', color: '#334155' }}
                    onClick={() => { closeOrderModal(); navigate('/customer'); }}>
                    My Orders
                  </button>
                </div>
                <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 20 }}>Track your order from <strong>Customer Portal → AgriRent Orders</strong></p>
              </div>

            ) : (
              <form onSubmit={handleOrderSubmit}>
                <div className="psp-modal-body">

                  {orderError && (
                    <div className="psp-error-box"><X size={15} /> {orderError}</div>
                  )}

                  {/* Customer Info — pre-filled read-only (same as printing page) */}
                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '16px' }}>
                    <div className="psp-section-divider" style={{ borderTop: 'none', paddingTop: 0, marginTop: 0 }}>
                      <Wallet size={14} /> Customer Information
                    </div>
                    <div className="psp-form-row">
                      <div className="psp-form-group">
                        <label className="psp-form-label">Full Name</label>
                        <input className="psp-form-input" value={currentUser?.fullName || currentUser?.full_name || currentUser?.name || ''} disabled />
                      </div>
                      <div className="psp-form-group">
                        <label className="psp-form-label">Email</label>
                        <input className="psp-form-input" value={currentUser?.email || ''} disabled />
                      </div>
                    </div>
                    <div className="psp-form-group" style={{ marginTop: 12 }}>
                      <label className="psp-form-label">Phone Number</label>
                      <input className="psp-form-input" value={currentUser?.phone || ''} disabled />
                    </div>
                  </div>

                  {/* Machine summary */}
                  <div style={{ background: '#ecfdf5', border: '1.5px solid #6ee7b7', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
                    <Tractor size={28} color="#059669" />
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 15, color: '#0f172a' }}>{orderModal.tractor?.name}</div>
                      <div style={{ fontSize: 12, color: '#059669', fontWeight: 600 }}>ETB {dailyRate.toLocaleString()}/day • {orderModal.tractor?.tractor_type || orderModal.tractor?.tractorType}</div>
                    </div>
                  </div>

                  {/* Rental Period */}
                  <div className="psp-section-divider"><Calendar size={14} /> Rental Period</div>
                  <div className="psp-form-row">
                    <div className="psp-form-group">
                      <label className="psp-form-label">Start Date *</label>
                      <input type="date" required className="psp-form-input" value={orderForm.startDate}
                        min={new Date().toISOString().split('T')[0]}
                        onChange={e => setOrderForm(p => ({ ...p, startDate: e.target.value }))} />
                    </div>
                    <div className="psp-form-group">
                      <label className="psp-form-label">End Date *</label>
                      <input type="date" required className="psp-form-input" value={orderForm.endDate}
                        min={orderForm.startDate || new Date().toISOString().split('T')[0]}
                        onChange={e => setOrderForm(p => ({ ...p, endDate: e.target.value }))} />
                    </div>
                  </div>
                  {totalDays > 0 && (
                    <div className="psp-price-summary">
                      <div className="psp-price-row"><span>{totalDays} day{totalDays !== 1 ? 's' : ''} × ETB {dailyRate.toLocaleString()}/day</span><span>ETB {totalAmount.toLocaleString()}</span></div>
                      <div className="psp-price-total" style={{ display: 'flex', justifyContent: 'space-between' }}><span>TOTAL ESTIMATED</span><span>ETB {totalAmount.toLocaleString()}</span></div>
                    </div>
                  )}

                  {/* Field Info */}
                  <div className="psp-section-divider"><MapPin size={14} /> Field Information</div>
                  <div className="psp-form-row">
                    <div className="psp-form-group">
                      <label className="psp-form-label">Field Location</label>
                      <input type="text" className="psp-form-input" placeholder="e.g. Bishoftu, East Shewa"
                        value={orderForm.fieldLocation} onChange={e => setOrderForm(p => ({ ...p, fieldLocation: e.target.value }))} />
                    </div>
                    <div className="psp-form-group">
                      <label className="psp-form-label">Field Size (Hectares)</label>
                      <input type="number" min="0" step="0.1" className="psp-form-input" placeholder="e.g. 2.5"
                        value={orderForm.fieldSizeHectares} onChange={e => setOrderForm(p => ({ ...p, fieldSizeHectares: e.target.value }))} />
                    </div>
                  </div>
                  <div className="psp-form-group">
                    <label className="psp-form-label">Farming Purpose</label>
                    <select className="psp-form-input" value={orderForm.farmingPurpose} onChange={e => setOrderForm(p => ({ ...p, farmingPurpose: e.target.value }))}>
                      <option value="">Select purpose…</option>
                      <option>Plowing</option><option>Planting / Seeding</option><option>Harvesting</option>
                      <option>Land Preparation</option><option>Irrigation</option><option>Other</option>
                    </select>
                  </div>

                  {/* Payment */}
                  <div className="psp-section-divider"><CreditCard size={14} /> Payment Proof</div>
                  <div className="psp-form-row">
                    <div className="psp-form-group">
                      <label className="psp-form-label">Payment Method *</label>
                      {financeAccounts.length === 0 ? (
                        <div style={{ padding: '10px', background: '#fef3c7', border: '1px solid #fbbf24', borderRadius: '4px', fontSize: '13px', color: '#92400e' }}>
                          ⏳ Loading payment accounts…
                        </div>
                      ) : (
                        <select required className="psp-form-input"
                          value={orderForm.paymentMethod}
                          onChange={e => {
                            const selectedId = e.target.value;
                            const acc = financeAccounts.find(a => String(a.id) === String(selectedId));
                            setOrderForm(p => ({
                              ...p,
                              paymentMethod: selectedId,
                              // Store account name for the order submission
                              paymentAccountName: acc ? acc.account_name : ''
                            }));
                          }}
                        >
                          <option value="">— Select Payment Account —</option>
                          {['Bank', 'Mobile Wallet', 'Cash'].map(type => {
                            const group = financeAccounts.filter(a => a.account_type === type && a.status === 'Active');
                            if (group.length === 0) return null;
                            return (
                              <optgroup key={type} label={type}>
                                {group.map(acc => (
                                  <option key={acc.id} value={acc.id}>
                                    {acc.account_name}{acc.account_number ? ` — ${acc.account_number}` : ''}{acc.bank_provider ? ` (${acc.bank_provider})` : ''}
                                  </option>
                                ))}
                              </optgroup>
                            );
                          })}
                        </select>
                      )}
                    </div>
                    <div className="psp-form-group">
                      <label className="psp-form-label">Transaction Reference</label>
                      <input type="text" className="psp-form-input" placeholder="e.g. TXN-123456"
                        value={orderForm.paymentReference} onChange={e => setOrderForm(p => ({ ...p, paymentReference: e.target.value }))} />
                    </div>
                  </div>

                  {/* Auto-fill account details panel */}
                  {orderForm.paymentMethod && (() => {
                    const acc = financeAccounts.find(a => String(a.id) === String(orderForm.paymentMethod));
                    if (!acc) return null;
                    return (
                      <div style={{ background: '#f0fdf4', padding: '12px 16px', borderRadius: '6px', border: '1.5px solid #4ade80', fontSize: '13px', color: '#166534', display: 'flex', gap: '12px', alignItems: 'flex-start', marginBottom: '4px' }}>
                        <Wallet size={18} color="#16a34a" style={{ flexShrink: 0, marginTop: 1 }} />
                        <div>
                          <div style={{ fontWeight: 700, marginBottom: '4px' }}>📋 Transfer Payment To:</div>
                          <div><strong>Account Name:</strong> {acc.account_name}</div>
                          {acc.account_number && <div><strong>Account Number:</strong> {acc.account_number}</div>}
                          {acc.bank_provider && <div><strong>Bank / Provider:</strong> {acc.bank_provider}</div>}
                          {acc.branch && <div><strong>Branch:</strong> {acc.branch}</div>}
                          <div style={{ marginTop: '6px', fontSize: '12px', color: '#15803d' }}>After payment, enter the transaction reference number above.</div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Screenshot upload — same as printing file upload */}
                  <div className="psp-form-group">
                    <label className="psp-form-label"><Upload size={14} /> Payment Screenshot <span>(optional if reference given)</span></label>
                    <div className={`psp-file-upload${orderFile ? ' has-file' : ''}`} onClick={() => fileRef.current?.click()}>
                      <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => setOrderFile(e.target.files[0] || null)} />
                      <Upload size={24} color={orderFile ? '#0D7C66' : '#94a3b8'} />
                      <p style={{ margin: '8px 0 4px', fontWeight: 700, color: orderFile ? '#0D7C66' : '#475569', fontSize: 14 }}>
                        {orderFile ? `✅ ${orderFile.name}` : 'Click to upload payment screenshot'}
                      </p>
                      <p style={{ margin: 0, fontSize: 12, color: '#94a3b8' }}>PNG, JPG, JPEG accepted</p>
                    </div>
                  </div>

                  {/* Special Instructions */}
                  <div className="psp-form-group">
                    <label className="psp-form-label">Special Instructions <span>(Optional)</span></label>
                    <textarea className="psp-form-input" rows={2} placeholder="Any specific requirements…"
                      value={orderForm.specialInstructions} onChange={e => setOrderForm(p => ({ ...p, specialInstructions: e.target.value }))}
                      style={{ resize: 'vertical' }} />
                  </div>

                </div>

                {/* Footer */}
                <div className="psp-modal-footer">
                  <button type="button" className="psp-cancel-btn" onClick={closeOrderModal} disabled={orderSubmitting}>Cancel</button>
                  <button type="submit" className="psp-submit-btn" disabled={orderSubmitting || totalDays <= 0}>
                    {orderSubmitting ? <><span className="psp-spinner" /> Submitting…</> : <><Tractor size={18} /> Submit Order</>}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {viewImage && <PrescriptionViewer imageUrl={viewImage.url} onClose={handleCloseViewer} />}

      <style>{`
        /* ── MODAL / OVERLAY ─────────────────────────────── */
        .psp-overlay {
          position:fixed;top:0;left:0;right:0;bottom:0;
          background:rgba(15,23,42,0.65);backdrop-filter:blur(4px);
          display:flex;align-items:flex-start;justify-content:center;
          z-index:9999;padding:40px 20px;overflow-y:auto;
        }
        .psp-modal {
          background:white;border-radius:0;width:100%;max-width:620px;
          margin:auto;box-shadow:0 25px 60px rgba(0,0,0,0.3);
          animation:psp-pop 0.3s ease;
        }
        @keyframes psp-pop {
          from { opacity: 0; transform: translateY(20px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .psp-modal-header {
          padding:24px 28px;border-bottom:1px solid #e2e8f0;
          display:flex;align-items:center;justify-content:space-between;
          background:linear-gradient(135deg,#1a2b4b,#0D7C66);
        }
        .psp-modal-title { margin:0;font-size:1.1rem;font-weight:800;color:#FFD700;display:flex;align-items:center;gap:10px; }
        .psp-modal-subtitle { font-size:0.8rem;color:rgba(255,255,255,0.7);margin:4px 0 0; }
        .psp-close-btn {
          background:rgba(255,255,255,0.15);border:none;color:white;
          cursor:pointer;display:flex;align-items:center;
          padding:8px;border-radius:8px;transition:all 0.2s;
        }
        .psp-close-btn:hover { background:rgba(255,255,255,0.3); }
        .psp-modal-body { padding:28px;display:flex;flex-direction:column;gap:18px; }
        .psp-form-group { display:flex;flex-direction:column;gap:8px; }
        .psp-form-label {
          font-weight:700;font-size:0.85rem;color:#1e293b;
          display:flex;align-items:center;gap:6px;
        }
        .psp-form-label span { font-weight:400;color:#94a3b8; }
        .psp-form-input {
          padding:12px 16px;border:2px solid #e2e8f0;width:100%;box-sizing:border-box;
          border-radius:0;font-size:0.95rem;background:white;
          color:#0f172a;transition:all 0.2s;font-family:inherit;outline:none;
        }
        .psp-form-input:focus { border-color:#0D7C66;box-shadow:0 0 0 3px rgba(13,124,102,0.1); }
        .psp-form-input:disabled { background:#f8fafc;color:#64748b;cursor:not-allowed; }
        .psp-form-row { display:grid;grid-template-columns:1fr 1fr;gap:16px; }
        @media(max-width:500px){ .psp-form-row { grid-template-columns:1fr; } }
        
        .psp-section-divider {
          font-size:0.75rem;font-weight:800;color:#1a2b4b;letter-spacing:1.5px;
          text-transform:uppercase;padding:8px 0 4px;border-top:2px solid #e2e8f0;
          margin-top:4px;display:flex;align-items:center;gap:8px;
        }
        .psp-section-divider::after { content:'';flex:1;height:1px;background:#e2e8f0; }
        
        .psp-file-upload {
          border:2px dashed #cbd5e1;border-radius:0;padding:24px;
          text-align:center;cursor:pointer;transition:all 0.3s;background:#f8fafc;
        }
        .psp-file-upload:hover { border-color:#0D7C66;background:#f0fdf4; }
        .psp-file-upload.has-file { border-color:#0D7C66;background:#f0fdf4;border-style:solid; }
        
        .psp-price-summary {
          background:linear-gradient(135deg,#f0fdf4,#dcfce7);
          border:2px solid #86efac;border-radius:0;padding:20px;
        }
        .psp-price-row { display:flex;justify-content:space-between;align-items:center;font-size:0.9rem;color:#166534;padding:4px 0; }
        .psp-price-total { font-size:1.3rem;font-weight:900;color:#15803d;border-top:2px solid #86efac;padding-top:12px;margin-top:8px; }
        
        .psp-modal-footer {
          padding:20px 28px;border-top:1px solid #e2e8f0;
          display:flex;justify-content:flex-end;gap:12px;background:#f8fafc;
        }
        .psp-cancel-btn {
          padding:12px 24px;background:white;border:2px solid #e2e8f0;
          border-radius:0;color:#475569;font-weight:700;
          cursor:pointer;transition:all 0.2s;font-family:inherit;
        }
        .psp-cancel-btn:hover { background:#f1f5f9; }
        .psp-submit-btn {
          padding:12px 28px;
          background:linear-gradient(135deg,#1a2b4b,#0D7C66);
          border:none;border-radius:0;color:white;
          font-weight:800;cursor:pointer;display:flex;
          align-items:center;gap:8px;transition:all 0.2s;
          font-family:inherit;font-size:1rem;
        }
        .psp-submit-btn:hover:not(:disabled) { transform:translateY(-1px);box-shadow:0 6px 20px rgba(13,124,102,0.4); }
        .psp-submit-btn:disabled { opacity:0.6;cursor:not-allowed; }
        .psp-spinner {
          display:inline-block;width:14px;height:14px;border:2px solid rgba(255,255,255,0.3);
          border-radius:50%;border-top-color:white;animation:spin 0.8s linear infinite;
        }
        @keyframes spin { to { transform:rotate(360deg); } }
        
        .psp-error-box {
          background:#fef2f2;border:1.5px solid #fca5a5;color:#dc2626;
          padding:12px 16px;font-size:13px;display:flex;align-items:center;gap:8px;border-radius:0;
        }
        .psp-success-body { padding:48px 32px;text-align:center;display:flex;flex-direction:column;align-items:center; }
        .psp-success-emoji { font-size:4rem;margin-bottom:16px;display:block;animation:psp-pop 0.5s cubic-bezier(0.175,0.885,0.32,1.275); }
        .psp-success-title { font-size:1.6rem;font-weight:900;color:#0f172a;margin:0 0 8px; }
        .psp-success-sub { color:#64748b;font-size:1rem;line-height:1.6;margin:0 0 24px; }
        .psp-print-btn {
          padding:12px 24px;background:linear-gradient(135deg,#1a2b4b,#0D7C66);
          border:none;border-radius:0;color:white;font-weight:800;
          cursor:pointer;display:flex;align-items:center;gap:8px;transition:all 0.2s;font-family:inherit;
        }
        .psp-print-btn:hover { transform:translateY(-1px);box-shadow:0 6px 20px rgba(13,124,102,0.4); }
      `}</style>
    </div>
  );
};

export default FarmingServicePage;
