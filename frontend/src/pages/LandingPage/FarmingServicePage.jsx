import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { PublicNav } from './PublicNavFooter';
import authService from '../../services/authService';
import axios from '../../services/apiClient';
import { Search, Sprout, Leaf, MapPin, Package, X, ChevronDown, ChevronUp, Calendar, Info, ShoppingCart, Shield, Droplets, Wrench, FileText, Phone, Mail, PhoneCall, HelpCircle, Tractor, Clock, CreditCard, Wallet, Fuel, Upload, CheckCircle2 } from 'lucide-react';
import tractorService from '../../services/tractorService';
import PrescriptionViewer from '../shared/PrescriptionViewer';
import { loadVatSafe, getVatForItem, fmtPct } from '../../services/vatService';
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

// Turn a finance_account row into the real payment-method name that Live Income
// verification should display (Telebirr / CBE Bank / Cash) — never the account
// name ('sutana' is shared by every account in the DB).
function resolvePaymentMethodName(acc) {
  if (!acc) return '';
  const type = String(acc.account_type || '').toLowerCase();
  const provider = String(acc.bank_provider || '').trim();
  const name = String(acc.account_name || '').toLowerCase();
  if (name.includes('cash') || type === 'cash') return 'Cash';
  if (type === 'mobile wallet') return provider ? `Mobile / ${provider}` : 'Mobile / Telebirr';
  if (type === 'bank' || type === 'savings' || type.includes('saving')) {
    return provider ? `${provider} Bank` : 'Bank Transfer';
  }
  return provider ? `${provider} Bank` : (acc.account_name || 'Bank');
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
  const [vatCtx, setVatCtx] = useState(null);
  useEffect(() => { loadVatSafe().then(setVatCtx).catch(() => {}); }, []);

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
  const rentalSubtotal = dailyRate * totalDays;
  const vatCalc = getVatForItem(vatCtx, 'agrirent', orderModal.tractor?.id, rentalSubtotal);
  const totalAmount = rentalSubtotal + vatCalc.vat;

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
      // paymentMethod stores the account ID; resolve to the real payment-method
      // name so Live Income verification shows Telebirr / CBE Bank / Cash.
      const selectedAcc = financeAccounts.find(a => String(a.id) === String(orderForm.paymentMethod));
      fd.append('paymentMethod', selectedAcc ? resolvePaymentMethodName(selectedAcc) : orderForm.paymentMethod);
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
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700;800&display=swap');`}</style>

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
              <Tractor size={56} />
              <h3>No machinery found</h3>
              <p>We couldn't find any equipment matching your search. Please try adjusting your search criteria.</p>
            </div>
          ) : (
            <div className={styles.productsGrid}>
              {searchResults.map((product) => {
                const cat = categories.find(c => c.id === product.category_id);
                const tc = cat ? TYPE_CONFIG[cat.type] || TYPE_CONFIG.general : TYPE_CONFIG.general;
                return (
                  <div key={product.id} className={styles.productCard} style={{ animationDelay: (searchResults.indexOf(product) * 0.07) + 's' }}>
                    {/* Image */}
                    <div className={styles.productImageWrapper}>
                      {product.image1 ? (
                        <img src={resolveImg(product.image1)} alt={product.name} className={styles.productImage} onClick={() => handleImageClick(product.image1, product.name)} />
                      ) : (
                        <div className={styles.productPlaceholder}><Tractor size={60} /></div>
                      )}
                      {product.availability !== 'Available' && (
                        <span className={styles.outOfStockBadge} style={{ position: 'absolute', top: 10, left: 10 }}>{product.availability}</span>
                      )}
                    </div>

                    {/* Card Body */}
                    <div className={styles.productInfo} style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

                      {/* Name */}
                      <h3 className={styles.productName} style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 17, letterSpacing: '0.01em', lineHeight: 1.3, marginBottom: 8 }}>
                        {product.name}
                      </h3>

                      {/* Spec row */}
                      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
                        {product.fuel_type || product.fuelType ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#5D4037', fontStyle: 'italic', letterSpacing: '0.02em' }}>
                            <Fuel size={11} /> {product.fuel_type || product.fuelType}
                          </span>
                        ) : null}
                        {product.transmission ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#5D4037', fontStyle: 'italic', letterSpacing: '0.02em' }}>
                            <Wrench size={11} /> {product.transmission}
                          </span>
                        ) : null}
                      </div>

                      {/* Price and Category Row */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16 }}>
                        <div>
                          <div className={styles.cardPrice} style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 800, letterSpacing: '0.03em' }}>
                            ETB {parseFloat(product.daily_rate || product.dailyRate || 0).toLocaleString()}
                          </div>
                          <div style={{ fontSize: 10, color: '#6D4C41', fontStyle: 'italic', letterSpacing: '0.04em', marginTop: 2 }}>per day · operator included</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#F5F5F5', padding: '6px 10px', borderRadius: 8 }}>
                          <Tractor size={12} color="#2E8B57" />
                          <span style={{ fontSize: 10, color: '#2E8B57', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                            {product.tractor_type || product.tractorType || 'Tractor'}
                          </span>
                        </div>
                      </div>

                      {/* Button — full width */}
                      {product.availability === 'Available' ? (
                        <button
                          onClick={() => openOrderModal(product)}
                          className={styles.orderBtn}
                          style={{ width: '100%', justifyContent: 'center', gap: 8, padding: '10px 16px', marginTop: 'auto' }}
                        >
                          <Calendar size={15} /> Reserve Machine
                        </button>
                      ) : (
                        <button
                          className={styles.orderBtn}
                          style={{ width: '100%', justifyContent: 'center', background: '#6B8E23', gap: 8, padding: '10px 16px', marginTop: 'auto' }}
                          onClick={() => window.location.href = 'tel:+251911000000'}
                        >
                          <Phone size={15} /> Contact When Available
                        </button>
                      )}

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
        <section className="fsp-section fsp-bg-muted">
          <div className="fsp-container">
            <div className="fsp-section-header">
              <h2 className="fsp-section-title">How to Hire a Machine</h2>
              <p className="fsp-section-subtitle">Four easy steps to get your field work done. Fast, reliable, and professional.</p>
            </div>
            <div className="fsp-grid-4">
              {HOW_TO_HIRE.map((step) => (
                <div key={step.n} className="fsp-card fsp-text-center">
                  <div className="fsp-icon-box">
                    <step.icon size={24} color="currentColor" />
                  </div>
                  <h3 className="fsp-card-title">{step.title}</h3>
                  <p className="fsp-card-desc">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Requirements & Pricing ── */}
        <section className="fsp-section">
          <div className="fsp-container">
            <div className="fsp-grid-2">
              {/* Service Coverage */}
              <div className="fsp-card">
                <div className="fsp-icon-box"><MapPin size={24} color="currentColor" /></div>
                <h3 className="fsp-card-title">Coverage &amp; Details</h3>
                <p className="fsp-card-desc">Important information about our service areas.</p>
                <div className="fsp-list">
                  {[
                    { label: 'Coverage Area', value: 'Addis Ababa & surrounding farming zones' },
                    { label: 'Booking Method', value: 'Phone booking only. No online self-booking.' },
                    { label: 'Included Staff', value: 'Professional driver/operator always included' },
                  ].map(r => (
                    <div key={r.label} className="fsp-list-item">
                      <span className="fsp-list-label">{r.label}</span>
                      <span className="fsp-list-value">{r.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pricing */}
              <div className="fsp-card">
                <div className="fsp-icon-box"><Wallet size={24} color="currentColor" /></div>
                <h3 className="fsp-card-title">Pricing Structure</h3>
                <p className="fsp-card-desc">Flexible rates based on your specific farm needs.</p>
                <div className="fsp-list">
                  {[
                    { label: 'Per Hour Rate', value: 'Available for short-term minor field work' },
                    { label: 'Daily Rate', value: 'Standard flat rate for full-day tractor usage' },
                    { label: 'Per Hectare', value: 'Priced by land size for plowing/harvesting' },
                    { label: 'Fuel Costs', value: 'Fuel is billed separately or supplied by client' },
                  ].map(r => (
                    <div key={r.label} className="fsp-list-item">
                      <span className="fsp-list-label">{r.label}</span>
                      <span className="fsp-list-value">{r.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── FAQs ── */}
        <section className="fsp-section fsp-bg-muted">
          <div className="fsp-container fsp-container-sm">
            <h2 className="fsp-section-title fsp-text-center" style={{ marginBottom: '2.5rem' }}>Common Questions</h2>
            <div className="fsp-accordion">
              {AGRIRENT_FAQS.map((f, i) => (
                <div key={i} className="fsp-accordion-item">
                  <button className="fsp-accordion-btn" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                    <span>{f.q}</span>
                    {openFaq === i
                      ? <ChevronUp size={20} color="currentColor" />
                      : <ChevronDown size={20} color="currentColor" />}
                  </button>
                  {openFaq === i && (
                    <div className="fsp-accordion-content">{f.a}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── STATIC SECTIONS END ── */}
      </section>

      {/* ── AgriRent Order Modal — Master Design Style ────────────────── */}

      {/* ── AgriRent Order Modal — Master Design Style ────────────────── */}
      {orderModal.open && (
        <div className="fsp-overlay" onClick={closeOrderModal}>
          <div className="fsp-modal" onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div className="fsp-modal-header">
              <div>
                <h3 className="fsp-modal-title"><Tractor size={22} /> Hire Agricultural Machine</h3>
                <p className="fsp-modal-subtitle">{orderModal.tractor?.name} — ETB {dailyRate.toLocaleString()}/day — Fill in all details below</p>
              </div>
              <button className="fsp-close-btn" onClick={closeOrderModal}><X size={22} /></button>
            </div>

            {/* SUCCESS */}
            {orderSuccess ? (
              <div className="fsp-success">
                <span className="fsp-success-icon">✅</span>
                <h3 className="fsp-success-title">Order Placed Successfully!</h3>
                <p className="fsp-success-sub">
                  Order <strong>{orderSuccess.orderNumber}</strong> has been received.<br />
                  Our team will contact you shortly to confirm the booking.
                </p>
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button className="fsp-btn-primary" onClick={() => {
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
${orderSuccess.orderNumber?`<p style="font-family:monospace;letter-spacing:3px;font-size:22px;color:#1a2b4b;background:#f1f5f9;padding:10px;text-align:center">${orderSuccess.orderNumber}</p>`:''}
</div>
<div class="ftr"><div class="ftr-l">SUTANA AgriRent &nbsp;|&nbsp; Addis Ababa, Ethiopia<br/>+251 911 000 000 &nbsp;|&nbsp; agrirent@sutana.com</div><div class="ftr-r">Printed: ${new Date().toLocaleString()}</div></div>
</div><script>window.onload=function(){window.print()}<\/script></body></html>`);
                    win.document.close();
                  }}>
                    <Tractor size={18} /> Print Receipt
                  </button>
                  <button className="fsp-btn-outline" onClick={() => { closeOrderModal(); navigate('/customer'); }}>
                    My Orders
                  </button>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))', marginTop: '1.25rem' }}>Track your order from <strong>Customer Portal → AgriRent Orders</strong></p>
              </div>

            ) : (
              <form onSubmit={handleOrderSubmit}>
                <div className="fsp-modal-body">

                  {orderError && (
                    <div className="fsp-error"><X size={15} /> {orderError}</div>
                  )}

                  {/* Customer Info — pre-filled read-only */}
                  <div style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))', padding: '1rem', borderRadius: 'var(--radius)' }}>
                    <div className="fsp-section-div" style={{ marginBottom: '1rem' }}>
                      <Wallet size={14} /> Customer Information
                    </div>
                    <div className="fsp-form-row">
                      <div className="fsp-form-group">
                        <label className="fsp-form-label">Full Name</label>
                        <input className="fsp-input" value={currentUser?.fullName || currentUser?.full_name || currentUser?.name || ''} disabled />
                      </div>
                      <div className="fsp-form-group">
                        <label className="fsp-form-label">Email</label>
                        <input className="fsp-input" value={currentUser?.email || ''} disabled />
                      </div>
                    </div>
                    <div className="fsp-form-group" style={{ marginTop: '1rem' }}>
                      <label className="fsp-form-label">Phone Number</label>
                      <input className="fsp-input" value={currentUser?.phone || ''} disabled />
                    </div>
                  </div>

                  {/* Machine summary */}
                  <div style={{ background: 'hsl(var(--primary) / 0.08)', border: '1px solid hsl(var(--primary) / 0.2)', padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', borderRadius: 'var(--radius)' }}>
                    <Tractor size={28} color="hsl(var(--primary))" />
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '1rem', color: 'hsl(var(--foreground))' }}>{orderModal.tractor?.name}</div>
                      <div style={{ fontSize: '0.875rem', color: 'hsl(var(--primary))', fontWeight: 600 }}>ETB {dailyRate.toLocaleString()}/day • {orderModal.tractor?.tractor_type || orderModal.tractor?.tractorType}</div>
                    </div>
                  </div>

                  {/* Rental Period */}
                  <div className="fsp-section-div"><Calendar size={14} /> Rental Period</div>
                  <div className="fsp-form-row">
                    <div className="fsp-form-group">
                      <label className="fsp-form-label">Start Date *</label>
                      <input type="date" required className="fsp-input" value={orderForm.startDate}
                        min={new Date().toISOString().split('T')[0]}
                        onChange={e => setOrderForm(p => ({ ...p, startDate: e.target.value }))} />
                    </div>
                    <div className="fsp-form-group">
                      <label className="fsp-form-label">End Date *</label>
                      <input type="date" required className="fsp-input" value={orderForm.endDate}
                        min={orderForm.startDate || new Date().toISOString().split('T')[0]}
                        onChange={e => setOrderForm(p => ({ ...p, endDate: e.target.value }))} />
                    </div>
                  </div>
                  {totalDays > 0 && (
                    <div className="fsp-price-box">
                      <div className="fsp-price-row"><span>{totalDays} day{totalDays !== 1 ? 's' : ''} × ETB {dailyRate.toLocaleString()}/day</span><span>ETB {rentalSubtotal.toLocaleString()}</span></div>
                      <div className="fsp-price-row"><span>VAT ({fmtPct(vatCalc.rate)})</span><span>ETB {vatCalc.vat.toLocaleString()}</span></div>
                      <div className="fsp-price-total"><span>TOTAL ESTIMATED (incl. VAT)</span><span>ETB {totalAmount.toLocaleString()}</span></div>
                    </div>
                  )}

                  {/* Field Info */}
                  <div className="fsp-section-div"><MapPin size={14} /> Field Information</div>
                  <div className="fsp-form-row">
                    <div className="fsp-form-group">
                      <label className="fsp-form-label">Field Location</label>
                      <input type="text" className="fsp-input" placeholder="e.g. Bishoftu, East Shewa"
                        value={orderForm.fieldLocation} onChange={e => setOrderForm(p => ({ ...p, fieldLocation: e.target.value }))} />
                    </div>
                    <div className="fsp-form-group">
                      <label className="fsp-form-label">Field Size (Hectares)</label>
                      <input type="number" min="0" step="0.1" className="fsp-input" placeholder="e.g. 2.5"
                        value={orderForm.fieldSizeHectares} onChange={e => setOrderForm(p => ({ ...p, fieldSizeHectares: e.target.value }))} />
                    </div>
                  </div>
                  <div className="fsp-form-group">
                    <label className="fsp-form-label">Farming Purpose</label>
                    <select className="fsp-input" value={orderForm.farmingPurpose} onChange={e => setOrderForm(p => ({ ...p, farmingPurpose: e.target.value }))}>
                      <option value="">Select purpose…</option>
                      <option>Plowing</option><option>Planting / Seeding</option><option>Harvesting</option>
                      <option>Land Preparation</option><option>Irrigation</option><option>Other</option>
                    </select>
                  </div>

                  {/* Payment */}
                  <div className="fsp-section-div"><CreditCard size={14} /> Payment Proof</div>
                  <div className="fsp-form-row">
                    <div className="fsp-form-group">
                      <label className="fsp-form-label">Payment Method *</label>
                      {financeAccounts.length === 0 ? (
                        <div style={{ padding: '0.75rem', background: '#fef3c7', border: '1px solid #fbbf24', borderRadius: 'var(--radius)', fontSize: '0.875rem', color: '#92400e' }}>
                          ⏳ Loading payment accounts…
                        </div>
                      ) : (
                        <select required className="fsp-input"
                          value={orderForm.paymentMethod}
                          onChange={e => {
                            const selectedId = e.target.value;
                            const acc = financeAccounts.find(a => String(a.id) === String(selectedId));
                            setOrderForm(p => ({
                              ...p,
                              paymentMethod: selectedId,
                              paymentAccountName: acc ? resolvePaymentMethodName(acc) : ''
                            }));
                          }}
                        >
                          <option value="">— Select Payment Account —</option>
                          {['Bank', 'Mobile Wallet'].map(type => {
                            const group = financeAccounts.filter(a => a.account_type === type && a.status === 'Active');
                            if (group.length === 0) return null;
                            return (
                              <optgroup key={type} label={type}>
                                {group.map(acc => (
                                  <option key={acc.id} value={acc.id}>
                                    {resolvePaymentMethodName(acc)}{acc.account_number ? ` — ${acc.account_number}` : ''}
                                  </option>
                                ))}
                              </optgroup>
                            );
                          })}
                        </select>
                      )}
                    </div>
                    <div className="fsp-form-group">
                      <label className="fsp-form-label">Transaction Reference</label>
                      <input type="text" className="fsp-input" placeholder="e.g. TXN-123456"
                        value={orderForm.paymentReference} onChange={e => setOrderForm(p => ({ ...p, paymentReference: e.target.value }))} />
                    </div>
                  </div>

                  {/* Auto-fill account details panel */}
                  {orderForm.paymentMethod && (() => {
                    const acc = financeAccounts.find(a => String(a.id) === String(orderForm.paymentMethod));
                    if (!acc) return null;
                    return (
                      <div style={{ background: 'hsl(var(--primary) / 0.07)', padding: '0.75rem 1rem', borderRadius: 'var(--radius)', border: '1px solid hsl(var(--primary) / 0.2)', fontSize: '0.875rem', color: 'hsl(var(--foreground))', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                        <Wallet size={18} color="hsl(var(--primary))" style={{ flexShrink: 0, marginTop: 1 }} />
                        <div>
                          <div style={{ fontWeight: 700, marginBottom: '0.5rem', color: 'hsl(var(--primary))' }}>Transfer Payment To:</div>
                          <div><strong>Method:</strong> {resolvePaymentMethodName(acc)}</div>
                          {acc.account_number && <div><strong>Account Number:</strong> {acc.account_number}</div>}
                          {acc.bank_provider && <div><strong>Bank / Provider:</strong> {acc.bank_provider}</div>}
                          {acc.branch && <div><strong>Branch:</strong> {acc.branch}</div>}
                          <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))' }}>After payment, enter the transaction reference number above.</div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Screenshot upload */}
                  <div className="fsp-form-group">
                    <label className="fsp-form-label"><Upload size={14} /> Payment Screenshot <span>(optional if reference given)</span></label>
                    <div className={`fsp-upload${orderFile ? ' has-file' : ''}`} onClick={() => fileRef.current?.click()}>
                      <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => setOrderFile(e.target.files[0] || null)} />
                      <Upload size={24} color={orderFile ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))'} />
                      <p style={{ margin: '0.5rem 0 0.25rem', fontWeight: 700, color: orderFile ? 'hsl(var(--primary))' : 'hsl(var(--foreground))', fontSize: '0.875rem' }}>
                        {orderFile ? `✅ ${orderFile.name}` : 'Click to upload payment screenshot'}
                      </p>
                      <p style={{ margin: 0, fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))' }}>PNG, JPG, JPEG accepted</p>
                    </div>
                  </div>

                  {/* Special Instructions */}
                  <div className="fsp-form-group">
                    <label className="fsp-form-label">Special Instructions <span>(Optional)</span></label>
                    <textarea className="fsp-input" rows={2} placeholder="Any specific requirements…"
                      value={orderForm.specialInstructions} onChange={e => setOrderForm(p => ({ ...p, specialInstructions: e.target.value }))}
                      style={{ resize: 'vertical', minHeight: '5rem' }} />
                  </div>

                </div>

                {/* Footer */}
                <div className="fsp-modal-footer">
                  <button type="button" className="fsp-btn-outline" onClick={closeOrderModal} disabled={orderSubmitting}>Cancel</button>
                  <button type="submit" className="fsp-btn-primary" disabled={orderSubmitting || totalDays <= 0}>
                    {orderSubmitting ? <>⏳ Submitting…</> : <><Tractor size={18} /> Submit Order</>}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

      )}

      {viewImage && <PrescriptionViewer imageUrl={viewImage.url} onClose={handleCloseViewer} />}

      <style>{`
        /* ── FSP Standard Component Classes (Master Design System) ── */
        .fsp-section { padding: 4rem 1.5rem; }
        .fsp-bg-muted { background-color: hsl(var(--muted)); }
        .fsp-container { width: 100%; max-width: 1280px; margin: 0 auto; }
        .fsp-container-sm { max-width: 768px; }
        .fsp-text-center { text-align: center; }
        
        .fsp-section-header { text-align: center; margin-bottom: 3rem; }
        .fsp-section-title { font-size: clamp(1.875rem, 4vw, 2.25rem); font-weight: 800; color: hsl(var(--primary)); line-height: 1.1; margin-bottom: 1rem; letter-spacing: -0.02em; }
        .fsp-section-subtitle { font-size: 1.125rem; color: hsl(var(--muted-foreground)); max-width: 600px; margin: 0 auto; }
        
        .fsp-grid-4 { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1.5rem; }
        .fsp-grid-2 { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 2rem; }
        
        .fsp-card { background-color: hsl(var(--background)); border: 1px solid hsl(var(--border)); border-radius: var(--radius); padding: 2rem; transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .fsp-card:hover { transform: translateY(-4px); box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1); }
        
        .fsp-icon-box { width: 3rem; height: 3rem; background-color: hsl(var(--primary)); color: hsl(var(--primary-foreground)); border-radius: 0.5rem; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 1.25rem; }
        .fsp-card-title { font-size: 1.25rem; font-weight: 700; color: hsl(var(--foreground)); margin-bottom: 0.75rem; }
        .fsp-card-desc { font-size: 0.875rem; color: hsl(var(--muted-foreground)); line-height: 1.625; }
        
        .fsp-list { display: flex; flex-direction: column; gap: 0.75rem; margin-top: 1.5rem; }
        .fsp-list-item { display: flex; justify-content: space-between; align-items: flex-start; padding: 0.75rem 1rem; background-color: hsl(var(--muted)); border-radius: 0.5rem; gap: 1rem; }
        .fsp-list-label { font-size: 0.875rem; font-weight: 700; color: hsl(var(--primary)); flex-shrink: 0; }
        .fsp-list-value { font-size: 0.875rem; color: hsl(var(--foreground)); text-align: right; }
        
        .fsp-accordion { display: flex; flex-direction: column; gap: 1rem; }
        .fsp-accordion-item { background-color: hsl(var(--background)); border: 1px solid hsl(var(--border)); border-radius: var(--radius); overflow: hidden; transition: box-shadow 0.2s ease; }
        .fsp-accordion-item:hover { box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05); }
        .fsp-accordion-btn { width: 100%; background: none; border: none; padding: 1.25rem 1.5rem; display: flex; justify-content: space-between; align-items: center; font-size: 1rem; font-weight: 700; color: hsl(var(--foreground)); cursor: pointer; text-align: left; transition: color 0.2s ease; }
        .fsp-accordion-btn:hover { color: hsl(var(--primary)); }
        .fsp-accordion-content { padding: 0 1.5rem 1.25rem; font-size: 0.875rem; color: hsl(var(--muted-foreground)); line-height: 1.625; }
        
        /* ── Order Modal ─────────────────────────────── */
        .fsp-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); display: flex; align-items: flex-start; justify-content: center; z-index: 9999; padding: 90px 1rem 2rem; overflow-y: auto; }
        .fsp-modal { background: hsl(var(--background)); border-radius: var(--radius); width: 100%; max-width: 640px; margin: auto; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); animation: fsp-pop 0.3s cubic-bezier(0.16,1,0.3,1); display: flex; flex-direction: column; }
        @keyframes fsp-pop { from { opacity: 0; transform: translateY(20px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
        
        .fsp-modal-header { padding: 1.5rem 2rem; border-bottom: 1px solid hsl(var(--border)); display: flex; justify-content: space-between; align-items: center; background: hsl(var(--primary)); color: hsl(var(--primary-foreground)); border-top-left-radius: var(--radius); border-top-right-radius: var(--radius); }
        .fsp-modal-title { font-size: 1.25rem; font-weight: 800; display: flex; align-items: center; gap: 0.5rem; margin: 0; }
        .fsp-modal-subtitle { font-size: 0.875rem; color: hsl(var(--primary-foreground) / 0.8); margin: 0.25rem 0 0; }
        .fsp-close-btn { background: rgba(255,255,255,0.15); border: none; color: inherit; cursor: pointer; padding: 0.5rem; border-radius: 0.5rem; transition: background 0.2s; display: flex; }
        .fsp-close-btn:hover { background: rgba(255,255,255,0.3); }
        
        .fsp-modal-body { padding: 2rem; display: flex; flex-direction: column; gap: 1.5rem; }
        .fsp-modal-footer { padding: 1.5rem 2rem; border-top: 1px solid hsl(var(--border)); display: flex; justify-content: flex-end; gap: 1rem; background: hsl(var(--muted)); border-bottom-left-radius: var(--radius); border-bottom-right-radius: var(--radius); }
        
        .fsp-form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        .fsp-form-group { display: flex; flex-direction: column; gap: 0.5rem; }
        .fsp-form-label { font-size: 0.875rem; font-weight: 700; color: hsl(var(--foreground)); display: flex; align-items: center; gap: 0.5rem; }
        .fsp-form-label span { font-weight: 400; color: hsl(var(--muted-foreground)); }
        
        .fsp-input { width: 100%; padding: 0.75rem 1rem; border: 1px solid hsl(var(--border)); border-radius: var(--radius); background: hsl(var(--background)); font-size: 0.875rem; color: hsl(var(--foreground)); transition: all 0.2s ease; min-height: 3rem; appearance: auto; box-sizing: border-box; }
        .fsp-input:focus { outline: none; border-color: hsl(var(--primary)); box-shadow: 0 0 0 2px hsl(var(--primary) / 0.2); }
        .fsp-input:disabled { background: hsl(var(--muted)); color: hsl(var(--muted-foreground)); cursor: not-allowed; }
        
        .fsp-section-div { font-size: 0.75rem; font-weight: 800; color: hsl(var(--primary)); letter-spacing: 0.05em; text-transform: uppercase; display: flex; align-items: center; gap: 0.75rem; }
        .fsp-section-div::after { content: ''; flex: 1; height: 1px; background: hsl(var(--border)); }
        
        .fsp-upload { border: 2px dashed hsl(var(--border)); border-radius: var(--radius); padding: 1.5rem; text-align: center; cursor: pointer; transition: all 0.2s; background: hsl(var(--muted)); }
        .fsp-upload:hover { border-color: hsl(var(--primary)); background: hsl(var(--primary) / 0.05); }
        .fsp-upload.has-file { border-color: hsl(var(--primary)); background: hsl(var(--primary) / 0.05); border-style: solid; }
        
        .fsp-price-box { background: hsl(var(--primary) / 0.05); border: 1px solid hsl(var(--primary) / 0.2); border-radius: var(--radius); padding: 1.25rem; }
        .fsp-price-row { display: flex; justify-content: space-between; font-size: 0.875rem; color: hsl(var(--foreground)); padding: 0.25rem 0; }
        .fsp-price-total { display: flex; justify-content: space-between; font-size: 1.125rem; font-weight: 800; color: hsl(var(--primary)); border-top: 1px solid hsl(var(--primary) / 0.2); padding-top: 0.75rem; margin-top: 0.5rem; }
        
        .fsp-btn-outline { padding: 0.75rem 1.5rem; background: transparent; border: 1px solid hsl(var(--border)); border-radius: var(--radius); font-weight: 600; cursor: pointer; transition: background 0.2s; }
        .fsp-btn-outline:hover { background: hsl(var(--muted)); }
        .fsp-btn-primary { padding: 0.75rem 1.5rem; background: hsl(var(--primary)); color: hsl(var(--primary-foreground)); border: none; border-radius: var(--radius); font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 0.5rem; transition: background 0.2s; }
        .fsp-btn-primary:hover:not(:disabled) { background: hsl(var(--primary) / 0.9); }
        .fsp-btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
        
        .fsp-error { background: #fef2f2; border: 1px solid #fca5a5; color: #dc2626; padding: 1rem; border-radius: var(--radius); font-size: 0.875rem; display: flex; align-items: center; gap: 0.5rem; }
        
        .fsp-success { padding: 3rem 2rem; text-align: center; display: flex; flex-direction: column; align-items: center; }
        .fsp-success-icon { font-size: 4rem; margin-bottom: 1.5rem; animation: fsp-pop 0.5s cubic-bezier(0.175,0.885,0.32,1.275); }
        .fsp-success-title { font-size: 1.5rem; font-weight: 800; color: hsl(var(--foreground)); margin-bottom: 0.5rem; }
        .fsp-success-sub { color: hsl(var(--muted-foreground)); font-size: 1rem; margin-bottom: 2rem; line-height: 1.5; }
        
        @media (max-width: 600px) {
          .fsp-form-row { grid-template-columns: 1fr; }
          .fsp-modal { max-height: calc(100vh - 100px); }
        }
      `}</style>
    </div>
  );
};

export default FarmingServicePage;
