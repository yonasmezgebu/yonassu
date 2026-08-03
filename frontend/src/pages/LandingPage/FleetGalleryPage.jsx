import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
  const location = useLocation();
  const isAuthenticated = authService.isAuthenticated();

  // Auto-open modal after returning from login
  useEffect(() => {
    if (location.state?.openCarRentalOrder && authService.isAuthenticated()) {
      const car = location.state.car;
      if (car) {
        setSelectedCarForReserve(car);
        setReserveModalOpen(true);
      }
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

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
      navigate('/login', { state: { from: location.pathname, openCarRentalOrder: true, car: car } });
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
          <h1>Premium Cars for Every Journey</h1>
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
                      Reserve Car
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
      <section style={{ background: '#F5F5F5', padding: '72px 24px', borderTop: '1px solid #228B22' }}>
        <style>{`
          .fgp-how-grid { display: grid; grid-template-columns: repeat(auto-fit,minmax(180px,1fr)); gap: 20px; }
          .fgp-how-card { background: #FFFFFF; border-radius: 12px; padding: 28px 20px; text-align: center; border: 1px solid #8D6E63; transition: transform 0.15s ease, box-shadow 0.15s ease; cursor: default; }
          .fgp-how-card:hover { transform: translateY(-4px); box-shadow: 0 8px 24px rgba(0,0,0,0.08); }
          .fgp-how-icon { width: 52px; height: 52px; border-radius: 50%; background: #2E8B57; display: flex; align-items: center; justify-content: center; margin: 0 auto 14px; }
          .fgp-how-title { font-size: 15px; font-weight: 700; color: #424242; margin-bottom: 6px; }
          .fgp-how-desc { font-size: 13px; color: #424242; margin: 0; line-height: 1.6; }
          @media (max-width: 600px) {
            .fgp-how-card { border: none; box-shadow: none; padding: 16px 8px; }
            .fgp-how-card:hover { transform: none; box-shadow: none; }
          }
          .fgp-info-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 32px; }
          .fgp-info-card { background: #FFFFFF; border-radius: 12px; padding: 36px 32px; border: 1px solid #8D6E63; transition: box-shadow 0.15s ease, transform 0.15s ease; }
          .fgp-info-card:hover { box-shadow: 0 6px 20px rgba(0,0,0,0.07); transform: translateY(-2px); }
          .fgp-info-icon { width: 48px; height: 48px; border-radius: 10px; background: #2E8B57; display: flex; align-items: center; justify-content: center; margin-bottom: 18px; }
          .fgp-info-title { font-size: 20px; font-weight: 800; color: #1B5E20; margin: 0 0 6px; }
          .fgp-info-sub { font-size: 14px; color: #424242; margin: 0 0 22px; }
          .fgp-row { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; padding: 12px 14px; border-radius: 8px; background: #F5F5F5; margin-bottom: 8px; }
          .fgp-row-label { font-size: 13px; font-weight: 700; color: #1B5E20; flex-shrink: 0; }
          .fgp-row-val { font-size: 13px; color: #424242; text-align: right; }
          .fgp-pickup-row { display: flex; gap: 14px; align-items: flex-start; padding: 12px 14px; border-radius: 8px; background: #F5F5F5; margin-bottom: 8px; }
          .fgp-pickup-label { font-weight: 700; font-size: 14px; color: #424242; margin-bottom: 2px; }
          .fgp-pickup-desc { font-size: 13px; color: #424242; line-height: 1.5; }
          @media (max-width: 600px) {
            .fgp-info-card { border: none; box-shadow: none; padding: 20px 0; }
            .fgp-info-card:hover { transform: none; box-shadow: none; }
            .fgp-info-grid { gap: 4px; }
          }
          .fgp-faq-item { background: #FFFFFF; border-radius: 12px; margin-bottom: 10px; overflow: hidden; transition: box-shadow 0.15s ease; }
          .fgp-faq-item:hover { box-shadow: 0 4px 14px rgba(0,0,0,0.06); }
          .fgp-faq-btn { width: 100%; background: none; border: none; padding: 20px 24px; display: flex; justify-content: space-between; align-items: center; font-weight: 700; color: #424242; font-size: 15px; cursor: pointer; text-align: left; gap: 16px; font-family: inherit; transition: color 0.15s ease; }
          .fgp-faq-btn:hover { color: #1B5E20; }
          .fgp-faq-ans { font-size: 14px; color: #424242; line-height: 1.75; padding: 0 24px 20px; }
        `}</style>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 style={{ fontSize: 'clamp(22px,4vw,32px)', fontWeight: 800, color: '#1B5E20', margin: '0 0 10px' }}>How to Rent a Car</h2>
            <p style={{ fontSize: 15, color: '#424242', maxWidth: 500, margin: '0 auto', lineHeight: 1.65 }}>Five easy steps to get you behind the wheel — no hassle, no delays.</p>
          </div>
          <div className="fgp-how-grid">
            {HOW_TO_RENT.map((step) => (
              <div key={step.n} className="fgp-how-card">
                <div className="fgp-how-icon">
                  <step.icon size={24} color="#FFFFFF" />
                </div>
                <h3 className="fgp-how-title">{step.title}</h3>
                <p className="fgp-how-desc">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing & Pickup (merged) ── */}
      <section style={{ background: '#FFFFFF', padding: '72px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div className="fgp-info-grid">
            <div className="fgp-info-card">
              <div className="fgp-info-icon"><Wallet size={24} color="#FFFFFF" /></div>
              <h3 className="fgp-info-title">Pricing &amp; Rates</h3>
              <p className="fgp-info-sub">Transparent pricing — no hidden charges.</p>
              {[
                { label: 'Daily Rate', value: 'Per-car pricing — see fleet listings above' },
                { label: 'Weekly Discount', value: 'Available on request for 7+ day bookings' },
                { label: 'Security Deposit', value: 'Fully refundable within 24–48 hrs after return' },
                { label: 'Late Return Fee', value: 'Hourly charge after 1 hr grace; up to a full day rate' },
              ].map(r => (
                <div key={r.label} className="fgp-row">
                  <span className="fgp-row-label">{r.label}</span>
                  <span className="fgp-row-val">{r.value}</span>
                </div>
              ))}
            </div>
            <div className="fgp-info-card">
              <div className="fgp-info-icon"><MapPin size={24} color="#FFFFFF" /></div>
              <h3 className="fgp-info-title">Pickup &amp; Delivery</h3>
              <p className="fgp-info-sub">Flexible options to suit your schedule.</p>
              {[
                { icon: '🏢', label: 'Office Pickup', desc: 'Collect from our main Addis Ababa office during business hours. Free of charge.' },
                { icon: '🚗', label: 'Delivery Option', desc: 'We deliver to hotels and selected city locations for an additional fee.' },
                { icon: '🔄', label: 'Return Process', desc: 'Return to the agreed location on time. Early returns credited; late returns charged hourly.' },
              ].map(p => (
                <div key={p.label} className="fgp-pickup-row">
                  <span style={{ fontSize: 20, flexShrink: 0 }}>{p.icon}</span>
                  <div>
                    <div className="fgp-pickup-label">{p.label}</div>
                    <div className="fgp-pickup-desc">{p.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Common Questions ── */}
      <section style={{ background: '#F5F5F5', padding: '72px 24px' }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(22px,4vw,32px)', fontWeight: 800, color: '#1B5E20', textAlign: 'center', marginBottom: 40 }}>Common Questions</h2>
          <div>
            {FAQS.map((f, i) => (
              <div key={i} className="fgp-faq-item">
                <button className="fgp-faq-btn" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                  <span>{f.q}</span>
                  {openFaq === i
                    ? <ChevronUp size={18} color="#228B22" style={{ flexShrink: 0 }} />
                    : <ChevronDown size={18} color="#424242" style={{ flexShrink: 0 }} />}
                </button>
                {openFaq === i && (
                  <div className="fgp-faq-ans">{f.a}</div>
                )}
              </div>
            ))}
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