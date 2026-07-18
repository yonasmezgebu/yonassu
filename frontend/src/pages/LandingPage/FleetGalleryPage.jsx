import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Settings2, Fuel, Users, Package, 
  CarFront, CheckCircle2, Clock, AlertTriangle, ArrowRight, X,
  ChevronLeft, ChevronRight,
  Shield, FileText, Info, Phone, Mail, CreditCard, ChevronDown, ChevronUp, 
  MapPin, Key, Calendar, FileBadge, Wallet, HelpCircle,
  Car, PhoneCall, Image as ImageIcon
} from 'lucide-react';
import { PublicNav } from './ServicesPage';
import RentalAgreementModal from './RentalAgreementModal';
import carService from '../../services/carService';
import authService from '../../services/authService';
import styles from './FleetGalleryPage.module.css';
import carHero from '../../assets/hero-section/car rental.jpg';

const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  const baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1').replace('/api/v1', '');
  const safePath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${safePath}`;
};

const FleetGalleryPage = () => {
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [notifyModalOpen, setNotifyModalOpen] = useState(false);
  const [selectedCarForNotify, setSelectedCarForNotify] = useState(null);
  const [notifyFormData, setNotifyFormData] = useState({
    customerName: '',
    phone: '',
    email: '',
    message: ''
  });
  
  // Reservation Modal State
  const [reserveModalOpen, setReserveModalOpen] = useState(false);
  const [selectedCarForReserve, setSelectedCarForReserve] = useState(null);
  const [toast, setToast] = useState({ show: false, type: '', title: '', message: '' });
  
  const navigate = useNavigate();
  const isAuthenticated = authService.isAuthenticated();

  const [openFaq, setOpenFaq] = useState(null);

  const HOW_TO_RENT = [
    { n: 1, title: 'Choose Car', desc: 'Browse our fleet and select the vehicle that fits your needs.', icon: CarFront },
    { n: 2, title: 'Select Dates', desc: 'Provide your pickup and return dates.', icon: Calendar },
    { n: 3, title: 'Provide ID', desc: 'Submit a valid driver\'s license and ID/Passport.', icon: FileBadge },
    { n: 4, title: 'Pay Deposit', desc: 'Secure your booking by paying the required security deposit.', icon: Wallet },
    { n: 5, title: 'Pick Up', desc: 'Pick up the car from our location or request delivery.', icon: Key }
  ];

  const FAQS = [
    { q: 'Is there a mileage limit?', a: 'Most rentals include unlimited mileage within the city. For out-of-town trips, a generous daily limit applies. Check the specific car details.' },
    { q: 'What does the insurance cover?', a: 'All cars come with comprehensive insurance. However, a deductible applies in case of at-fault damage. The security deposit covers minor damages.' },
    { q: 'When do I get my deposit back?', a: 'Security deposits are refunded within 24-48 hours after returning the car in its original condition.' },
    { q: 'Are there late fees?', a: 'A grace period of 1 hour is allowed. Beyond that, an hourly charge applies, up to a full day\'s rate for delays over 4 hours.' }
  ];

  const showToast = (type, title, message, redirectDelay = 0) => {
    setToast({ show: true, type, title, message });
    if (redirectDelay) {
      setTimeout(() => navigate('/customer'), redirectDelay);
    } else {
      setTimeout(() => setToast({ show: false, type: '', title: '', message: '' }), 5000);
    }
  };

  useEffect(() => {
    fetchPublicCars();
  }, []);

  const fetchPublicCars = async () => {
    try {
      setLoading(true);
      const res = await carService.getPublicCars();
      if (res.status === 'success') {
        setCars(res.data);
      }
    } catch (error) {
      console.error('Failed to fetch fleet:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? cars.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === cars.length - 1 ? 0 : prev + 1));
  };

  const handleReserve = (car) => {
    if (!isAuthenticated) {
      navigate('/login');
    } else {
      setSelectedCarForReserve(car);
      setReserveModalOpen(true);
    }
  };

  const handleReservationSuccess = (orderData) => {
    setReserveModalOpen(false);
    showToast(
      'success',
      '🎉 Reservation Confirmed!',
      `Your order #${orderData.orderNumber} has been submitted. A manager will review it shortly. Redirecting to your dashboard...`,
      3000
    );
  };

  const handleNotify = (car) => {
    setSelectedCarForNotify(car);
    setNotifyModalOpen(true);
    setNotifyFormData({ customerName: '', phone: '', email: '', message: '' });
  };

  const handleNotifySubmit = async (e) => {
    e.preventDefault();
    try {
      await carService.submitNotifyRequest({
        carId: selectedCarForNotify.id,
        carName: selectedCarForNotify.name,
        carRate: selectedCarForNotify.dailyRate,
        carStatus: selectedCarForNotify.availability,
        ...notifyFormData
      });
      setNotifyModalOpen(false);
      showToast('success', '✅ Request Sent!', `We will notify you when ${selectedCarForNotify.name} becomes available.`);
    } catch (error) {
      console.error('Failed to submit notify request', error);
      showToast('error', '❌ Failed to Send', 'Something went wrong. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="public-page cnx-page">
        <PublicNav />
        <div className={styles.loadingContainer}>
          <div className={styles.loader}>Loading our fleet...</div>
        </div>
      </div>
    );
  }

  const currentCar = cars.length > 0 ? cars[currentIndex] : null;

  return (
    <div className="public-page cnx-page">
      <PublicNav />

      {/* ── Toast Notification Banner ── */}
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
      
      <div className={styles.heroSection} style={{ background: `linear-gradient(rgba(15, 23, 42, 0.7), rgba(15, 23, 42, 0.8)), url(${carHero}) center/cover no-repeat` }}>
        <div className={styles.heroContent}>
          <h1>Drive Your Dream —<br />Premium Cars for Every Journey</h1>
        </div>
      </div>

      {cars.length === 0 ? (
        <div className={styles.galleryContainer} style={{ minHeight: 'auto', paddingBottom: '1rem' }}>
          <div className={styles.emptyContainer} style={{ minHeight: '300px' }}>
            <CarFront size={64} />
            <h3>No vehicles available</h3>
            <p>We are currently updating our fleet. Please check back soon.</p>
          </div>
        </div>
      ) : (
        <div className={styles.galleryContainer}>
          <div className={styles.carouselContainer}>
            <button className={styles.navBtn} onClick={handlePrev}>
              <ChevronLeft size={28} />
            </button>

            <div className={styles.carCard}>
              {/* Left Section - Images */}
              <div className={styles.imageSection}>
                <div className={styles.mainImage}>
                  {currentCar.image1 ? (
                    <img src={getImageUrl(currentCar.image1)} alt={currentCar.name} />
                  ) : (
                    <div className={styles.imagePlaceholder}>
                      <ImageIcon size={48} />
                    </div>
                  )}
                </div>
                <div className={styles.thumbnailStrip}>
                  {[currentCar.image1, currentCar.image2, currentCar.image3].map((img, idx) => (
                    img ? (
                      <div key={idx} className={styles.thumbnail}>
                        <img src={getImageUrl(img)} alt={`${currentCar.name} view ${idx + 1}`} />
                      </div>
                    ) : (
                      <div key={idx} className={styles.thumbnail} style={{ background: '#e0e0e0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ImageIcon size={20} color="#999" />
                      </div>
                    )
                  ))}
                </div>
              </div>

              {/* Right Section - Details */}
              <div className={styles.detailsSection}>
                <div className={styles.carTitle}>
                  <h2>{currentCar.name}</h2>
                  <span className={`${styles.statusBadge} ${styles[currentCar.availability?.toLowerCase()] || styles.available}`}>
                    {currentCar.availability || 'Available'}
                  </span>
                </div>

                <div className={styles.priceSection}>
                  <span className={styles.price}>ETB {Number(currentCar.dailyRate).toLocaleString()}</span>
                  <span className={styles.perDay}>/ day</span>
                </div>

                <div className={styles.specsGrid}>
                  <div className={styles.spec}>
                    <Settings2 size={18} />
                    <span>{currentCar.transmission}</span>
                  </div>
                  <div className={styles.spec}>
                    <Fuel size={18} />
                    <span>{currentCar.fuelType}</span>
                  </div>
                  <div className={styles.spec}>
                    <Users size={18} />
                    <span>{currentCar.seats} Seats</span>
                  </div>
                  <div className={styles.spec}>
                    <Car size={18} />
                    <span>{currentCar.carType}</span>
                  </div>
                </div>

                <div className={styles.description}>
                  <p>{currentCar.description || 'A comfortable and reliable vehicle perfect for your needs.'}</p>
                </div>

                <div className={styles.actionButtons}>
                  {currentCar.availability === 'Available' ? (
                    <button className={styles.reserveBtn} onClick={() => handleReserve(currentCar)}>
                      Book Now
                    </button>
                  ) : (
                    <button className={styles.notifyBtn} onClick={() => handleNotify(currentCar)}>
                      <PhoneCall size={20} />
                      Contact for Availability
                    </button>
                  )}
                </div>
              </div>
            </div>

            <button className={styles.navBtn} onClick={handleNext}>
              <ChevronRight size={28} />
            </button>
          </div>

          <div className={styles.dotsContainer}>
            {cars.map((_, idx) => (
              <button
                key={idx}
                className={`${styles.dot} ${idx === currentIndex ? styles.activeDot : ''}`}
                onClick={() => setCurrentIndex(idx)}
              />
            ))}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════
            STATIC INFO SECTIONS — Car Rental Page
          ══════════════════════════════════════════════ */}

      {/* ── How to Rent ── */}
      <section style={{ background: 'linear-gradient(135deg,#f0fdf4 0%,#eff6ff 100%)', padding: '72px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <span style={{ display: 'inline-block', background: 'linear-gradient(135deg,#059669,#10b981)', color: '#fff', fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '6px 18px', borderRadius: 999, marginBottom: 14 }}>Simple Process</span>
            <h2 style={{ fontSize: 'clamp(26px,4vw,38px)', fontWeight: 900, color: '#0f172a', margin: '0 0 12px', letterSpacing: '-0.02em' }}>How to Rent a Car</h2>
            <p style={{ fontSize: 16, color: '#64748b', maxWidth: 520, margin: '0 auto', lineHeight: 1.65 }}>Five easy steps to get you behind the wheel — no hassle, no delays.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 20, position: 'relative' }}>
            {HOW_TO_RENT.map((step, i) => (
              <div key={step.n} style={{ background: '#fff', borderRadius: 20, padding: '32px 24px', textAlign: 'center', boxShadow: '0 4px 24px rgba(0,0,0,0.06)', border: '1px solid rgba(5,150,105,0.1)', position: 'relative', transition: 'transform 0.25s', cursor: 'default' }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-6px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
              >
                {/* connector line */}
                {i < HOW_TO_RENT.length - 1 && (
                  <div style={{ display: 'none' }} />
                )}
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
          {/* Requirements */}
          <div style={{ background: 'linear-gradient(135deg,#fef3c7,#fef9c3)', borderRadius: 24, padding: '40px 36px', border: '1px solid rgba(245,158,11,0.2)' }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: 'linear-gradient(135deg,#f59e0b,#fbbf24)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24, boxShadow: '0 8px 20px rgba(245,158,11,0.3)' }}>
              <FileBadge size={28} color="#fff" />
            </div>
            <h3 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>Rental Requirements</h3>
            <p style={{ fontSize: 14, color: '#78716c', marginBottom: 24 }}>What you need to bring on pickup day.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { label: 'Minimum Age', value: 'Must be 21 years or older' },
                { label: 'Driver\'s License', value: 'Valid license, held for at least 1 year' },
                { label: 'ID / Passport', value: 'Valid national ID or international passport' },
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
            <h3 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>Pricing & Rates</h3>
            <p style={{ fontSize: 14, color: '#475569', marginBottom: 24 }}>Transparent pricing, no hidden charges.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { label: 'Daily Rate', value: 'Per-car pricing — see fleet listings above' },
                { label: 'Weekly Discount', value: 'Available on request for 7+ day bookings' },
                { label: 'Security Deposit', value: 'Fully refundable within 24–48 hrs after return' },
                { label: 'Late Return Fee', value: 'Hourly charge after 1 hr grace; up to a full day rate' },
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

      {/* ── Pickup / Delivery & Payment ── */}
      <section style={{ background: 'linear-gradient(135deg,#f8fafc,#f0fdf4)', padding: '72px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(340px,1fr))', gap: 32 }}>
          {/* Pickup */}
          <div style={{ background: '#fff', borderRadius: 24, padding: '40px 36px', boxShadow: '0 4px 30px rgba(0,0,0,0.07)', border: '1px solid #e2e8f0' }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: 'linear-gradient(135deg,#8b5cf6,#a78bfa)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24, boxShadow: '0 8px 20px rgba(139,92,246,0.3)' }}>
              <MapPin size={28} color="#fff" />
            </div>
            <h3 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>Pickup & Delivery</h3>
            <p style={{ fontSize: 14, color: '#64748b', marginBottom: 28 }}>Flexible pickup options to suit your schedule.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                { icon: '🏢', label: 'Office Pickup', desc: 'Collect directly from our main Addis Ababa office during business hours. Free of charge.' },
                { icon: '🚗', label: 'Delivery Option', desc: 'We deliver to hotels and selected city locations for an additional fee.' },
                { icon: '🔄', label: 'Return Process', desc: 'Return to the agreed location on time. Early returns credited; late returns charged hourly.' },
              ].map(p => (
                <div key={p.label} style={{ display: 'flex', gap: 16, alignItems: 'flex-start', padding: '16px', background: '#f8fafc', borderRadius: 14 }}>
                  <span style={{ fontSize: 22, lineHeight: 1 }}>{p.icon}</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a', marginBottom: 4 }}>{p.label}</div>
                    <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.55 }}>{p.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment */}
          <div style={{ background: '#fff', borderRadius: 24, padding: '40px 36px', boxShadow: '0 4px 30px rgba(0,0,0,0.07)', border: '1px solid #e2e8f0' }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: 'linear-gradient(135deg,#059669,#10b981)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24, boxShadow: '0 8px 20px rgba(5,150,105,0.3)' }}>
              <CreditCard size={28} color="#fff" />
            </div>
            <h3 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>Payment Methods</h3>
            <p style={{ fontSize: 14, color: '#64748b', marginBottom: 28 }}>We accept multiple payment options for your convenience.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { flag: '🏦', name: 'Bank Transfer', detail: 'CBE, Awash, Dashen, Birhan Bank' },
                { flag: '📱', name: 'Mobile Money', detail: 'Telebirr, CBE Birr' },
                { flag: '💵', name: 'Cash', detail: 'Accepted for deposits and short-term rentals' },
                { flag: '💳', name: 'Card / POS', detail: 'Visa & Mastercard accepted at office' },
              ].map(m => (
                <div key={m.name} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: 20 }}>{m.flag}</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>{m.name}</div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>{m.detail}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQs ── */}
      <section style={{ background: '#fff', padding: '72px 24px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <span style={{ display: 'inline-block', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '6px 18px', borderRadius: 999, marginBottom: 14 }}>FAQs</span>
            <h2 style={{ fontSize: 'clamp(24px,4vw,34px)', fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>Common Questions</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {FAQS.map((f, i) => (
              <div key={i} style={{ background: openFaq === i ? 'linear-gradient(135deg,#f0fdf4,#eff6ff)' : '#f8fafc', borderRadius: 16, border: `1px solid ${openFaq === i ? 'rgba(5,150,105,0.25)' : '#e2e8f0'}`, overflow: 'hidden', transition: 'all 0.25s ease' }}>
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  style={{ width: '100%', background: 'none', border: 'none', padding: '22px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 700, color: '#0f172a', fontSize: 15, cursor: 'pointer', textAlign: 'left', gap: 16 }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <span style={{ width: 30, height: 30, borderRadius: '50%', background: openFaq === i ? 'linear-gradient(135deg,#059669,#10b981)' : '#e2e8f0', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background 0.25s' }}>
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
            <p style={{ fontSize: 15, color: '#94a3b8', margin: 0 }}>Transparent policies. Secure data. We are here when you need us.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 24 }}>
            {/* Terms */}
            <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 20, padding: '32px 28px', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg,#059669,#10b981)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20, boxShadow: '0 6px 16px rgba(5,150,105,0.35)' }}>
                <Shield size={22} color="#fff" />
              </div>
              <h3 style={{ fontSize: 17, fontWeight: 800, color: '#fff', marginBottom: 12 }}>Terms of Service</h3>
              <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.65, margin: 0 }}>
                Rental agreements are legally binding upon signature. Late returns beyond the 1-hour grace period incur hourly penalties. Cancellations made within 24 hours of pickup may forfeit the deposit. All agreements are governed by Ethiopian Commercial Law.
              </p>
            </div>

            {/* Privacy */}
            <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 20, padding: '32px 28px', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg,#3b82f6,#0ea5e9)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20, boxShadow: '0 6px 16px rgba(59,130,246,0.35)' }}>
                <FileText size={22} color="#fff" />
              </div>
              <h3 style={{ fontSize: 17, fontWeight: 800, color: '#fff', marginBottom: 12 }}>Privacy Policy</h3>
              <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.65, margin: 0 }}>
                Your ID, license, and payment information are collected solely for rental verification and billing. We do not sell or share your personal data with third parties. All records are securely stored and accessible only to authorized staff.
              </p>
            </div>

            {/* Disclaimer */}
            <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 20, padding: '32px 28px', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg,#f59e0b,#fbbf24)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20, boxShadow: '0 6px 16px rgba(245,158,11,0.35)' }}>
                <Info size={22} color="#fff" />
              </div>
              <h3 style={{ fontSize: 17, fontWeight: 800, color: '#fff', marginBottom: 12 }}>Disclaimer</h3>
              <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.65, margin: 0 }}>
                Vehicles must be returned with the same fuel level as at pickup. The renter is solely responsible for any damage, fines, or liability not covered by the included insurance. Insurance coverage details are specified in the signed rental agreement.
              </p>
            </div>
          </div>

          {/* Contact Strip */}
          <div style={{ marginTop: 40, background: 'rgba(5,150,105,0.12)', borderRadius: 20, padding: '32px 36px', border: '1px solid rgba(5,150,105,0.3)', display: 'flex', flexWrap: 'wrap', gap: 32, justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#34d399', marginBottom: 6 }}>Rental Support</div>
              <h3 style={{ fontSize: 20, fontWeight: 800, color: '#fff', margin: 0 }}>Need help? We are here for you.</h3>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
              <a href="tel:+251911000000" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 20px', background: 'rgba(255,255,255,0.08)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.15)', color: '#fff', textDecoration: 'none', fontSize: 14, fontWeight: 600, transition: 'background 0.2s' }}>
                <Phone size={18} color="#34d399" /> +251 911 000 000
              </a>
              <a href="mailto:rental@sutana.com" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 20px', background: 'rgba(255,255,255,0.08)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.15)', color: '#fff', textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>
                <Mail size={18} color="#34d399" /> rental@sutana.com
              </a>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 20px', background: 'rgba(255,255,255,0.06)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', fontSize: 14 }}>
                <PhoneCall size={18} color="#34d399" /> 24/7 Roadside Assist
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* ── STATIC SECTIONS END ── */}

      {notifyModalOpen && selectedCarForNotify && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2>Notify Me When Available</h2>
              <button onClick={() => setNotifyModalOpen(false)} className={styles.closeBtn}>
                <X size={24} />
              </button>
            </div>
            
            <div className={styles.modalCarInfo}>
              <strong>{selectedCarForNotify.name}</strong>
              <div>Status: {selectedCarForNotify.availability}</div>
              <div>Rate: ETB {Number(selectedCarForNotify.dailyRate).toLocaleString()}/day</div>
            </div>

            <form onSubmit={handleNotifySubmit} className={styles.modalForm}>
              <input
                type="text"
                placeholder="Your Full Name *"
                value={notifyFormData.customerName}
                onChange={e => setNotifyFormData({...notifyFormData, customerName: e.target.value})}
                required
              />
              <input
                type="tel"
                placeholder="Phone Number *"
                value={notifyFormData.phone}
                onChange={e => setNotifyFormData({...notifyFormData, phone: e.target.value})}
                required
              />
              <input
                type="email"
                placeholder="Email Address *"
                value={notifyFormData.email}
                onChange={e => setNotifyFormData({...notifyFormData, email: e.target.value})}
                required
              />
              <textarea
                placeholder="Optional Message"
                value={notifyFormData.message}
                onChange={e => setNotifyFormData({...notifyFormData, message: e.target.value})}
                rows="3"
              />
              <div className={styles.modalActions}>
                <button type="submit" className={styles.submitBtn}>Send Notification</button>
                <button type="button" onClick={() => setNotifyModalOpen(false)} className={styles.cancelBtn}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {reserveModalOpen && selectedCarForReserve && (
        <RentalAgreementModal 
          car={selectedCarForReserve} 
          isOpen={reserveModalOpen} 
          onClose={() => setReserveModalOpen(false)}
          onSuccess={handleReservationSuccess}
        />
      )}

    </div>
  );
};

export default FleetGalleryPage;