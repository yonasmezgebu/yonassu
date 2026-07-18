import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { PublicNav } from './PublicNavFooter';
import authService from '../../services/authService';
import axios from '../../services/apiClient';
import { Search, Sprout, Leaf, MapPin, Package, X, ChevronDown, ChevronUp, Calendar, Info, ShoppingCart, Star, Shield, Truck, Droplets, Wrench, FileText, Phone, Mail, PhoneCall, HelpCircle, Tractor, Clock, CreditCard, FileBadge, Wallet } from 'lucide-react';
import RentalAgreementModal from './RentalAgreementModal';
import carService from '../../services/carService';
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
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedDesc, setExpandedDesc] = useState({});
  const [expandedUsage, setExpandedUsage] = useState({});
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [reserveModalOpen, setReserveModalOpen] = useState(false);
  const [toast, setToast] = useState({ show: false, type: '', title: '', message: '' });
  const [viewImage, setViewImage] = useState(null);
  const [openFaq, setOpenFaq] = useState(null);

  useEffect(() => {
    const fetchPublicData = async () => {
      try {
        setLoading(true);
        const [catRes, prodRes] = await Promise.all([
          axios.get('/farming/categories'),
          axios.get('/farming/products')
        ]);
        if (catRes.status === 'success') setCategories(catRes.data.filter(c => c.is_active));
        if (prodRes.status === 'success') {
          const activeProds = prodRes.data.filter(p => p.is_active);
          setAllProducts(activeProds);
          setSearchResults(activeProds);
        }
      } catch (error) {
        console.error('Failed to fetch farming data', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPublicData();
  }, []);

  useEffect(() => {
    if (location.state?.orderProduct && authService.isAuthenticated()) {
      setSelectedProduct(location.state.orderProduct);
      setIsModalOpen(true);
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const handleSearch = () => {
    let filtered = allProducts;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(prod =>
        prod.name.toLowerCase().includes(query) ||
        (prod.description && prod.description.toLowerCase().includes(query)) ||
        prod.category_name?.toLowerCase().includes(query)
      );
    }
    if (selectedCategory) filtered = filtered.filter(prod => prod.category_id === selectedCategory);
    setSearchResults(filtered);
  };

  useEffect(() => { handleSearch(); }, [searchQuery, selectedCategory]);

  const handleCategoryClick = (categoryId) => setSelectedCategory(selectedCategory === categoryId ? null : categoryId);

  const showToast = (type, title, message, redirectDelay = 0) => {
    setToast({ show: true, type, title, message });
    if (redirectDelay) {
      setTimeout(() => navigate('/customer'), redirectDelay);
    } else {
      setTimeout(() => setToast({ show: false, type: '', title: '', message: '' }), 5000);
    }
  };

  const handleReserve = (product) => {
    if (!authService.isAuthenticated()) {
      navigate('/login');
    } else {
      setSelectedProduct({
        id: product.id,
        name: product.name,
        dailyRate: product.price,
        image1: product.product_image,
        availability: product.stock_quantity > 0 ? 'Available' : 'Out of Stock'
      });
      setReserveModalOpen(true);
    }
  };

  const handleReservationSuccess = (orderData) => {
    setReserveModalOpen(false);
    showToast(
      'success',
      '🎉 Reservation Confirmed!',
      `Your machinery rental #${orderData.orderNumber || orderData.id} has been submitted.`,
      3000
    );
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
                  <div key={product.id} className={styles.productCard}>
                    {/* Image Section */}
                    <div className={styles.productImageWrapper}>
                      {product.product_image ? (
                        <img src={resolveImg(product.product_image)} alt={product.name} className={styles.productImage} onClick={() => handleImageClick(product.product_image, product.name)} />
                      ) : (
                        <div className={styles.productPlaceholder}><Leaf size={40} /></div>
                      )}
                      <div className={styles.productImageBadges}>
                        <span className={styles.typeBadge} style={{ background: tc.bg, color: tc.color }}>{tc.icon} {tc.label}</span>
                        {product.stock_quantity <= product.reorder_level && product.stock_quantity > 0 && (
                          <span className={styles.lowStockBadge}>Low Stock</span>
                        )}
                        {product.stock_quantity <= 0 && <span className={styles.outOfStockBadge}>Out of Stock</span>}
                      </div>
                      <div className={styles.priceTag}>
                        <span className={styles.priceCurrency}>ETB</span>
                        <span className={styles.priceValue}>{parseFloat(product.price).toFixed(2)}</span>
                        <span style={{fontSize: '11px', opacity: 0.8, marginLeft: '4px'}}>/day</span>
                      </div>
                    </div>

                    {/* Info Section */}
                    <div className={styles.productInfo}>
                      <h3 className={styles.productName}>{product.name}</h3>
                      {cat && <span className={styles.productCategory}>{tc.icon} {cat.name}</span>}

                      {/* Description */}
                      {product.description && (
                        <p className={styles.productDesc}>{product.description.length > 100 ? product.description.substring(0, 100) + '...' : product.description}</p>
                      )}

                      {/* Usage Instructions (expandable) */}
                      {product.usage_instructions && (
                        <div className={styles.usageSection}>
                          <button className={styles.usageToggle} onClick={() => setExpandedUsage(p => ({ ...p, [product.id]: !p[product.id] }))}>
                            <Info size={14} /> How to Use {expandedUsage[product.id] ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </button>
                          {expandedUsage[product.id] && (
                            <div className={styles.usageContent}>{product.usage_instructions}</div>
                          )}
                        </div>
                      )}

                      <a href="tel:+251911000000" className={styles.orderBtn} style={{ textDecoration: 'none' }}>
                        <PhoneCall size={16} /> {product.stock_quantity > 0 ? 'Call to Hire' : 'Unavailable'}
                      </a>
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

      {/* Order Modal */}
      {reserveModalOpen && selectedProduct && (
        <RentalAgreementModal 
          car={selectedProduct} 
          isOpen={reserveModalOpen} 
          onClose={() => setReserveModalOpen(false)}
          onSuccess={handleReservationSuccess}
        />
      )}

      {viewImage && <PrescriptionViewer imageUrl={viewImage.url} onClose={handleCloseViewer} />}
    </div>
  );
};

export default FarmingServicePage;
