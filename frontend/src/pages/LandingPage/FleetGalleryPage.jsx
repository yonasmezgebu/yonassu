import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Settings2, Fuel, Users, Package, 
  CarFront, CheckCircle2, Clock, AlertTriangle, ArrowRight, X,
  ChevronLeft, ChevronRight,
  Shield, FileText, Info, Phone, Mail, CreditCard, ChevronDown, ChevronUp, 
  MapPin, Key, Calendar, FileBadge, Wallet, HelpCircle, Bell,
  Car, Image as ImageIcon, Building2, RefreshCw, ShieldAlert, LogOut, Wrench
} from 'lucide-react';
import { PublicNav } from './ServicesPage';
import RentalAgreementModal from './RentalAgreementModal';
import carService from '../../services/carService';
import authService from '../../services/authService';
import axios from '../../services/apiClient';
import styles from './FleetGalleryPage.module.css';
import carHero from '../../assets/hero-section/car rental.jpg';

const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  const baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1').replace('/api/v1', '');
  const safePath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${safePath}`;
};

const getCarStatus = (availability) => {
  const av = (availability || '').trim().toLowerCase();
  if (av === 'maintenance' || av === 'in maintenance') return 'Maintenance';
  if (av === 'booked' || av === 'rented' || av === 'out') return 'Booked';
  return 'Available';
};

const renderCarStatusBadge = (availability) => {
  const status = getCarStatus(availability);
  if (status === 'Available') {
    return (
      <span className={styles.availableBadge}>
        <CheckCircle2 size={12} strokeWidth={2.5} /> Available
      </span>
    );
  }
  if (status === 'Booked') {
    return (
      <span className={styles.bookedBadge}>
        <Clock size={12} strokeWidth={2.5} /> Booked
      </span>
    );
  }
  return (
    <span className={styles.maintenanceBadge}>
      <Wrench size={12} strokeWidth={2.5} /> Maintenance
    </span>
  );
};

const renderModalStatusBadge = (availability) => {
  const status = getCarStatus(availability);
  if (status === 'Available') {
    return (
      <span style={{ background: '#DCFCE7', color: '#16A34A', padding: '2px 10px', borderRadius: 9999, fontSize: 12, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        <CheckCircle2 size={12} strokeWidth={2.5} /> Available
      </span>
    );
  }
  if (status === 'Booked') {
    return (
      <span style={{ background: '#FEF3C7', color: '#B45309', padding: '2px 10px', borderRadius: 9999, fontSize: 12, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        <Clock size={12} strokeWidth={2.5} /> Booked
      </span>
    );
  }
  return (
    <span style={{ background: '#FEE2E2', color: '#B91C1C', padding: '2px 10px', borderRadius: 9999, fontSize: 12, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      <Wrench size={12} strokeWidth={2.5} /> Maintenance
    </span>
  );
};

const FleetGalleryPage = () => {
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [notifyModalOpen, setNotifyModalOpen] = useState(false);
  const [selectedCarForNotify, setSelectedCarForNotify] = useState(null);
  const [notifyFormData, setNotifyFormData] = useState({
    fullName: '', phone: '', email: '', driverName: '', driverLicense: '', pickupLocation: '', message: ''
  });
  const [notifySubmitting, setNotifySubmitting] = useState(false);
  const [notifyError, setNotifyError] = useState('');
  const [notifySuccess, setNotifySuccess] = useState(null);
  
  // Reservation Modal State
  const [reserveModalOpen, setReserveModalOpen] = useState(false);
  const [selectedCarForReserve, setSelectedCarForReserve] = useState(null);
  const [toast, setToast] = useState({ show: false, type: '', title: '', message: '' });
  const [roleWarning, setRoleWarning] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = authService.isAuthenticated();
  const currentUser = authService.getCurrentUser();

  // Auto-open modal after returning from login
  useEffect(() => {
    if (location.state?.openCarRentalOrder && authService.isAuthenticated()) {
      const car = location.state.car;
      if (car) {
        if (!authService.hasRole('customer')) {
          setRoleWarning(true);
        } else {
          setSelectedCarForReserve(car);
          setReserveModalOpen(true);
        }
      }
      window.history.replaceState({}, document.title);
    }
    if (location.state?.openCarWaitlist && authService.isAuthenticated()) {
      const car = location.state.car;
      if (car) {
        if (!authService.hasRole('customer')) {
          setRoleWarning(true);
        } else {
          const user = authService.getCurrentUser();
          setSelectedCarForNotify(car);
          setNotifyFormData({
            fullName: user?.fullName || user?.full_name || user?.name || '',
            phone: user?.phone || '',
            email: user?.email || '',
            driverName: '',
            driverLicense: '',
            pickupLocation: '',
            message: ''
          });
          setNotifyError('');
          setNotifySuccess(null);
          setNotifyModalOpen(true);
        }
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
      return;
    }
    if (!authService.hasRole('customer')) {
      setRoleWarning(true);
      return;
    }
    setSelectedCarForReserve(car);
    setReserveModalOpen(true);
  };

  const handleReservationSuccess = (orderData) => {
    setReserveModalOpen(false);
    showToast(
      'success',
      'Reservation Confirmed!',
      `Your order #${orderData.orderNumber} has been submitted. A manager will review it shortly. Redirecting to your dashboard...`,
      3000
    );
  };

  const handleNotify = (car) => {
    if (!authService.isAuthenticated()) {
      navigate('/login', { state: { from: location.pathname, openCarWaitlist: true, car: car } });
      return;
    }
    if (!authService.hasRole('customer')) {
      setRoleWarning(true);
      return;
    }
    const user = authService.getCurrentUser();
    setSelectedCarForNotify(car);
    setNotifyFormData({
      fullName: user?.fullName || user?.full_name || user?.name || '',
      phone: user?.phone || '',
      email: user?.email || '',
      driverName: '',
      driverLicense: '',
      pickupLocation: '',
      message: ''
    });
    setNotifyError('');
    setNotifySuccess(null);
    setNotifyModalOpen(true);
  };

  const handleNotifySubmit = async (e) => {
    e.preventDefault();
    if (!notifyFormData.fullName.trim()) { setNotifyError('Please enter your full name.'); return; }
    if (!/^09\d{8}$/.test((notifyFormData.phone || '').replace(/\D/g, ''))) {
      setNotifyError('Please enter a valid Ethiopian phone number (format 09xxxxxxxx) so we can reach you.');
      return;
    }
    setNotifySubmitting(true);
    setNotifyError('');
    try {
      const res = await axios.post('/car-waitlist', {
        carId: selectedCarForNotify.id,
        customerName: notifyFormData.fullName,
        customerPhone: notifyFormData.phone,
        customerEmail: notifyFormData.email,
        driverName: notifyFormData.driverName,
        driverLicense: notifyFormData.driverLicense,
        pickupLocation: notifyFormData.pickupLocation,
        message: notifyFormData.message,
      });
      if (res?.status === 'success') {
        setNotifySuccess(res.data);
        showToast('success', 'You are on the list!', res.data?.message || 'We will call and notify you as soon as this vehicle is free.');
      } else {
        setNotifyError(res?.message || 'Failed to join the list. Please try again.');
      }
    } catch (err) {
      setNotifyError(err?.response?.data?.message || err?.message || 'An error occurred. Please try again.');
    } finally {
      setNotifySubmitting(false);
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {toast.type === 'success'
              ? <CheckCircle2 size={22} color="#15803d" style={{ flexShrink: 0 }} />
              : <AlertTriangle size={22} color="#dc2626" style={{ flexShrink: 0 }} />}
            <div>
              <p style={{ margin: 0, fontWeight: '700', fontSize: '15px', color: toast.type === 'success' ? '#15803d' : '#dc2626' }}>
                {toast.title}
              </p>
              <p style={{ margin: 0, fontSize: '13px', color: toast.type === 'success' ? '#166534' : '#991b1b' }}>
                {toast.message}
              </p>
            </div>
          </div>
        </div>
      )}
      
      <div className={styles.heroSection} style={{ 
        position: 'relative', 
        minHeight: '460px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: `url(${carHero}) center/cover no-repeat`,
        width: '100%'
      }}>
        {/* Dark overlay to make text readable */}
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.55)' }} />
        
        {/* Text content */}
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', padding: '0 20px' }}>
          <h1 style={{
            fontSize: 'clamp(36px, 6vw, 64px)',
            fontWeight: 900,
            color: '#ffffff',
            lineHeight: 1.15,
            letterSpacing: '-0.02em',
            textShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
            margin: 0
          }}>
            Premium Cars for<br />Every Journey
          </h1>
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
          <div className={styles.productsGrid}>
            {cars.map((car) => {
              const carStatus = getCarStatus(car.availability);
              return (
                <div key={car.id} className={styles.productCard}>
                  {/* Image */}
                  <div className={styles.productImageWrapper}>
                    {car.image1 ? (
                      <img src={getImageUrl(car.image1)} alt={car.name} className={styles.productImage} />
                    ) : (
                      <div className={styles.productPlaceholder}><ImageIcon size={60} /></div>
                    )}
                    {renderCarStatusBadge(car.availability)}
                  </div>

                  {/* Card Body */}
                  <div className={styles.productInfo} style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                    {/* Name */}
                    <h3 className={styles.productName} style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 17, letterSpacing: '0.01em', lineHeight: 1.3, marginBottom: 8 }}>
                      {car.name}
                    </h3>

                    {/* Spec row */}
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
                      {car.fuelType && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#5D4037', fontStyle: 'italic', letterSpacing: '0.02em' }}>
                          <Fuel size={11} /> {car.fuelType}
                        </span>
                      )}
                      {car.transmission && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#5D4037', fontStyle: 'italic', letterSpacing: '0.02em' }}>
                          <Settings2 size={11} /> {car.transmission}
                        </span>
                      )}
                    </div>

                    {/* Price and Category Row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16 }}>
                      <div>
                        <div className={styles.cardPrice} style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 800, letterSpacing: '0.03em' }}>
                          ETB {Number(car.dailyRate).toLocaleString()}
                        </div>
                        <div style={{ fontSize: 10, color: '#6D4C41', fontStyle: 'italic', letterSpacing: '0.04em', marginTop: 2 }}>per day</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#F5F5F5', padding: '6px 10px', borderRadius: 8 }}>
                        <Car size={12} color="#2E8B57" />
                        <span style={{ fontSize: 10, color: '#2E8B57', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                          {car.carType || 'Car'}
                        </span>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className={styles.cardActions} style={{ marginTop: 'auto' }}>
                      {carStatus === 'Available' ? (
                        <button className={styles.orderBtn} onClick={() => handleReserve(car)}>
                          Reserve Machine
                        </button>
                      ) : carStatus === 'Booked' ? (
                        <button className={styles.notifyBtn} onClick={() => handleNotify(car)} style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                          <Bell size={18} /> Contact When Available
                        </button>
                      ) : (
                        <button className={styles.maintenanceBtn} onClick={() => handleNotify(car)} style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                          <Wrench size={18} /> Under Maintenance · Notify Me
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════
            STATIC INFO SECTIONS — Car Rental Page
          ══════════════════════════════════════════════ */}

      <style>{`
        /* ── Root Design Tokens ── */
        .fgp-root {
          --fgp-bg: 0 0% 100%;
          --fgp-fg: 222.2 84% 4.9%;
          --fgp-primary: 142.1 76.2% 36.3%;
          --fgp-primary-fg: 355.7 100% 97.3%;
          --fgp-primary-dark: 142.4 71.8% 29.2%;
          --fgp-muted: 210 40% 96.1%;
          --fgp-muted-fg: 215.4 16.3% 46.9%;
          --fgp-border: 214.3 31.8% 91.4%;
          --fgp-accent: 142.1 76.2% 36.3%;
          --fgp-radius: 0.75rem;
          --fgp-radius-sm: 0.5rem;
          --fgp-shadow-sm: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
          --fgp-shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
          --fgp-shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
        }

        /* ── Global Reset (scoped) ── */
        .fgp-section *, .fgp-section *::before, .fgp-section *::after {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        /* ── Section Base ── */
        .fgp-section {
          padding: 5rem 1.5rem;
          font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }
        .fgp-section-light { background-color: hsl(var(--fgp-muted)); }
        .fgp-section-white { background-color: hsl(var(--fgp-bg)); }

        /* ── Container ── */
        .fgp-container {
          width: 100%;
          max-width: 1280px;
          margin-left: auto;
          margin-right: auto;
        }
        .fgp-container-narrow {
          width: 100%;
          max-width: 800px;
          margin-left: auto;
          margin-right: auto;
        }

        /* ── Section Header ── */
        .fgp-section-header {
          text-align: center;
          margin-bottom: 3.5rem;
        }
        .fgp-section-label {
          display: inline-block;
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: hsl(var(--fgp-primary));
          margin-bottom: 0.75rem;
        }
        .fgp-section-title {
          font-size: clamp(1.875rem, 4vw, 2.5rem);
          font-weight: 700;
          line-height: 1.2;
          letter-spacing: -0.02em;
          color: hsl(var(--fgp-fg));
          margin-bottom: 1rem;
        }
        .fgp-section-sub {
          font-size: 1rem;
          line-height: 1.625;
          color: hsl(var(--fgp-muted-fg));
          max-width: 36rem;
          margin-left: auto;
          margin-right: auto;
        }

        /* ─────────────── HOW TO RENT STEPS ─────────────── */
        .fgp-how-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 1.5rem;
        }
        .fgp-how-card {
          background-color: hsl(var(--fgp-bg));
          border: 1px solid hsl(var(--fgp-border));
          border-radius: var(--fgp-radius);
          padding: 2rem 1.5rem;
          text-align: center;
          box-shadow: var(--fgp-shadow-sm);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          cursor: default;
        }
        .fgp-how-card:hover {
          transform: translateY(-4px);
          box-shadow: var(--fgp-shadow-lg);
        }
        .fgp-how-icon {
          width: 3.5rem;
          height: 3.5rem;
          border-radius: 9999px;
          background-color: hsl(var(--fgp-primary));
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1.25rem;
          flex-shrink: 0;
        }
        .fgp-how-step-num {
          font-size: 0.6875rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: hsl(var(--fgp-primary));
          margin-bottom: 0.375rem;
        }
        .fgp-how-title {
          font-size: 1rem;
          font-weight: 700;
          color: hsl(var(--fgp-fg));
          margin-bottom: 0.5rem;
          line-height: 1.3;
        }
        .fgp-how-desc {
          font-size: 0.875rem;
          color: hsl(var(--fgp-muted-fg));
          line-height: 1.625;
        }

        /* ─────────────── INFO GRID (Pricing + Pickup) ─────────────── */
        .fgp-info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 2rem;
        }
        .fgp-info-card {
          background-color: hsl(var(--fgp-bg));
          border: 1px solid hsl(var(--fgp-border));
          border-radius: var(--fgp-radius);
          padding: 2.5rem 2rem;
          box-shadow: var(--fgp-shadow-sm);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .fgp-info-card:hover {
          transform: translateY(-4px);
          box-shadow: var(--fgp-shadow-md);
        }
        .fgp-info-icon {
          width: 3rem;
          height: 3rem;
          border-radius: 0.625rem;
          background-color: hsl(var(--fgp-primary));
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1.25rem;
          flex-shrink: 0;
        }
        .fgp-info-title {
          font-size: 1.25rem;
          font-weight: 700;
          color: hsl(var(--fgp-fg));
          margin-bottom: 0.375rem;
          line-height: 1.3;
        }
        .fgp-info-sub {
          font-size: 0.875rem;
          color: hsl(var(--fgp-muted-fg));
          margin-bottom: 1.5rem;
          line-height: 1.5;
        }

        /* Pricing rows */
        .fgp-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 1rem;
          padding: 0.75rem 1rem;
          border-radius: var(--fgp-radius-sm);
          background-color: hsl(var(--fgp-muted));
          margin-bottom: 0.5rem;
          border-bottom: 1px solid hsl(var(--fgp-border));
        }
        .fgp-row:last-child { border-bottom: none; }
        .fgp-row-label {
          font-size: 0.875rem;
          font-weight: 600;
          color: hsl(var(--fgp-fg));
          flex-shrink: 0;
        }
        .fgp-row-val {
          font-size: 0.875rem;
          color: hsl(var(--fgp-muted-fg));
          text-align: right;
          line-height: 1.5;
        }

        /* Pickup rows */
        .fgp-pickup-row {
          display: flex;
          gap: 1rem;
          align-items: flex-start;
          padding: 1rem;
          border-radius: var(--fgp-radius-sm);
          background-color: hsl(var(--fgp-muted));
          margin-bottom: 0.5rem;
          transition: background-color 0.15s ease;
        }
        .fgp-pickup-row:hover { background-color: hsl(var(--fgp-border)); }
        .fgp-pickup-emoji {
          font-size: 1.375rem;
          flex-shrink: 0;
          line-height: 1;
          margin-top: 0.125rem;
        }
        .fgp-pickup-label {
          font-size: 0.9375rem;
          font-weight: 700;
          color: hsl(var(--fgp-fg));
          margin-bottom: 0.25rem;
        }
        .fgp-pickup-desc {
          font-size: 0.875rem;
          color: hsl(var(--fgp-muted-fg));
          line-height: 1.5;
        }

        /* ─────────────── FAQ ─────────────── */
        .fgp-faq-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .fgp-faq-item {
          background-color: hsl(var(--fgp-bg));
          border: 1px solid hsl(var(--fgp-border));
          border-radius: var(--fgp-radius);
          overflow: hidden;
          transition: box-shadow 0.2s ease;
        }
        .fgp-faq-item:hover { box-shadow: var(--fgp-shadow-md); }
        .fgp-faq-btn {
          width: 100%;
          background: none;
          border: none;
          padding: 1.25rem 1.5rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-weight: 600;
          color: hsl(var(--fgp-fg));
          font-size: 1rem;
          line-height: 1.5;
          cursor: pointer;
          text-align: left;
          gap: 1rem;
          font-family: inherit;
          transition: background-color 0.15s ease, color 0.15s ease;
        }
        .fgp-faq-btn:hover { background-color: hsl(var(--fgp-muted)); }
        .fgp-faq-btn:focus {
          outline: none;
          box-shadow: inset 0 0 0 2px hsl(var(--fgp-primary) / 0.35);
        }
        .fgp-faq-icon { flex-shrink: 0; color: hsl(var(--fgp-primary)); }
        .fgp-faq-ans {
          font-size: 0.9375rem;
          color: hsl(var(--fgp-muted-fg));
          line-height: 1.75;
          padding: 0 1.5rem 1.25rem;
          border-top: 1px solid hsl(var(--fgp-border));
        }

        /* ─────────────── RESPONSIVE ─────────────── */
        @media (max-width: 768px) {
          .fgp-section { padding: 3rem 1rem; }
          .fgp-section-header { margin-bottom: 2.5rem; }
          .fgp-how-grid { gap: 1rem; }
          .fgp-how-card {
            border: none;
            box-shadow: none;
            padding: 1.25rem 0.75rem;
            border-bottom: 1px solid hsl(var(--fgp-border));
            border-radius: 0;
          }
          .fgp-how-card:last-child { border-bottom: none; }
          .fgp-how-card:hover { transform: none; box-shadow: none; }
          .fgp-info-grid { gap: 1rem; }
          .fgp-info-card {
            border: none;
            box-shadow: none;
            padding: 1.5rem 0;
            border-bottom: 1px solid hsl(var(--fgp-border));
            border-radius: 0;
          }
          .fgp-info-card:last-child { border-bottom: none; }
          .fgp-info-card:hover { transform: none; box-shadow: none; }
        }
      `}</style>

      {/* ── How to Rent ── */}
      <section className="fgp-section fgp-section-light fgp-root">
        <div className="fgp-container">
          <div className="fgp-section-header">
            <span className="fgp-section-label">Simple Process</span>
            <h2 className="fgp-section-title">How to Rent a Car</h2>
            <p className="fgp-section-sub">Five easy steps to get you behind the wheel — no hassle, no delays.</p>
          </div>
          <div className="fgp-how-grid">
            {HOW_TO_RENT.map((step) => (
              <div key={step.n} className="fgp-how-card">
                <div className="fgp-how-icon">
                  <step.icon size={22} color="#ffffff" />
                </div>
                <div className="fgp-how-step-num">Step {step.n}</div>
                <h3 className="fgp-how-title">{step.title}</h3>
                <p className="fgp-how-desc">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing & Pickup ── */}
      <section className="fgp-section fgp-section-white fgp-root">
        <div className="fgp-container">
          <div className="fgp-section-header">
            <span className="fgp-section-label">Transparent & Flexible</span>
            <h2 className="fgp-section-title">Pricing & Pickup Details</h2>
            <p className="fgp-section-sub">Clear rates and convenient pickup options — everything you need to know before you book.</p>
          </div>
          <div className="fgp-info-grid">

            {/* Pricing Card */}
            <div className="fgp-info-card">
              <div className="fgp-info-icon"><Wallet size={22} color="#ffffff" /></div>
              <h3 className="fgp-info-title">Pricing & Rates</h3>
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

            {/* Pickup Card */}
            <div className="fgp-info-card">
              <div className="fgp-info-icon"><MapPin size={22} color="#ffffff" /></div>
              <h3 className="fgp-info-title">Pickup & Delivery</h3>
              <p className="fgp-info-sub">Flexible options to suit your schedule.</p>
              {[
                { icon: Building2, label: 'Office Pickup', desc: 'Collect from our main Addis Ababa office during business hours. Free of charge.' },
                { icon: Car, label: 'Delivery Option', desc: 'We deliver to hotels and selected city locations for an additional fee.' },
                { icon: RefreshCw, label: 'Return Process', desc: 'Return to the agreed location on time. Early returns credited; late returns charged hourly.' },
              ].map(p => (
                <div key={p.label} className="fgp-pickup-row">
                  <span className="fgp-pickup-emoji">
                    <p.icon size={20} color="hsl(var(--fgp-primary))" />
                  </span>
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
      <section className="fgp-section fgp-section-light fgp-root">
        <div className="fgp-container-narrow">
          <div className="fgp-section-header">
            <span className="fgp-section-label">Support</span>
            <h2 className="fgp-section-title">Common Questions</h2>
            <p className="fgp-section-sub">Everything you need to know about renting with us.</p>
          </div>
          <div className="fgp-faq-list">
            {FAQS.map((f, i) => (
              <div key={i} className="fgp-faq-item">
                <button className="fgp-faq-btn" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                  <span>{f.q}</span>
                  <span className="fgp-faq-icon">
                    {openFaq === i
                      ? <ChevronUp size={20} />
                      : <ChevronDown size={20} />}
                  </span>
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
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Bell size={22} /> Contact When Available</h2>
              <button onClick={() => setNotifyModalOpen(false)} className={styles.closeBtn}>
                <X size={24} />
              </button>
            </div>
            
            <div className={styles.modalCarInfo}>
              <strong>{selectedCarForNotify.name}</strong>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>Status:</span>
                {renderModalStatusBadge(selectedCarForNotify.availability)}
              </div>
              <div>Rate: ETB {Number(selectedCarForNotify.dailyRate).toLocaleString()}/day</div>
            </div>

            {selectedCarForNotify.bookingEndDate && (
              <div style={{
                display: 'flex', alignItems: 'flex-start', gap: '0.6rem',
                background: '#eff6ff', border: '1.5px solid #bfdbfe', borderLeft: '4px solid #2563eb',
                borderRadius: '8px', padding: '0.7rem 0.9rem', margin: '0.75rem 0 0.25rem',
              }}>
                <Calendar size={16} style={{ marginTop: 2, color: '#2563eb', flexShrink: 0 }} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: '14px', color: '#1e3a8a' }}>
                    Back on {new Date(selectedCarForNotify.bookingEndDate).toLocaleDateString('en-US', {
                      timeZone: 'UTC', weekday: 'short', year: 'numeric', month: 'long', day: 'numeric'
                    })}
                  </div>
                  <div style={{ fontSize: '12px', color: '#1e40af', marginTop: 2 }}>
                    This vehicle is rented until that date. Leave your details and we will call you the moment it is returned.
                  </div>
                </div>
              </div>
            )}

            {notifySuccess ? (
              <div style={{ textAlign: 'center', padding: '2rem 0.5rem 1.25rem' }}>
                <Bell size={72} color="#2563eb" strokeWidth={1.6} />
                <h3 style={{ margin: '0.75rem 0 0.4rem', fontSize: '20px', fontWeight: 800, color: '#1e3a8a' }}>
                  You are on the list!
                </h3>
                <p style={{ margin: 0, fontSize: '14px', color: '#475569', lineHeight: 1.6 }}>
                  We saved your contact details for <strong>{selectedCarForNotify.name}</strong>.<br />
                  Our team will call you the moment it is free.
                </p>
                <button
                  type="button"
                  onClick={() => { setNotifyModalOpen(false); setNotifySuccess(null); setNotifyError(''); }}
                  className={styles.submitBtn}
                  style={{ marginTop: '1.25rem', display: 'inline-flex', alignItems: 'center', gap: 8 }}
                >
                  <CheckCircle2 size={18} /> Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleNotifySubmit} className={styles.modalForm}>
                {notifyError && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 8, background: '#fef2f2',
                    border: '1.5px solid #fca5a5', color: '#991b1b', padding: '0.6rem 0.8rem',
                    fontSize: '13px', fontWeight: 600, marginBottom: '0.75rem',
                  }}>
                    <AlertTriangle size={15} style={{ flexShrink: 0 }} /> {notifyError}
                  </div>
                )}

                <input
                  type="text"
                  placeholder="Your Full Name *"
                  value={notifyFormData.fullName}
                  onChange={e => setNotifyFormData({...notifyFormData, fullName: e.target.value})}
                  required
                />
                <input
                  type="tel"
                  placeholder="Phone Number (09xxxxxxxx) *"
                  value={notifyFormData.phone}
                  onChange={e => setNotifyFormData({...notifyFormData, phone: e.target.value})}
                  required
                />
                <input
                  type="email"
                  placeholder="Email Address"
                  value={notifyFormData.email}
                  onChange={e => setNotifyFormData({...notifyFormData, email: e.target.value})}
                />
                <input
                  type="text"
                  placeholder="Driver Name (if different from you)"
                  value={notifyFormData.driverName}
                  onChange={e => setNotifyFormData({...notifyFormData, driverName: e.target.value})}
                />
                <input
                  type="text"
                  placeholder="Driver License Number (optional)"
                  value={notifyFormData.driverLicense}
                  onChange={e => setNotifyFormData({...notifyFormData, driverLicense: e.target.value})}
                />
                <input
                  type="text"
                  placeholder="Preferred Pickup Location (optional)"
                  value={notifyFormData.pickupLocation}
                  onChange={e => setNotifyFormData({...notifyFormData, pickupLocation: e.target.value})}
                />
                <textarea
                  placeholder="Message (optional)"
                  value={notifyFormData.message}
                  onChange={e => setNotifyFormData({...notifyFormData, message: e.target.value})}
                  rows="3"
                />
                <div className={styles.modalActions}>
                  <button type="submit" disabled={notifySubmitting} className={styles.submitBtn}>
                    {notifySubmitting ? 'Submitting…' : <><Bell size={18} /> Notify Me When Available</>}
                  </button>
                  <button type="button" onClick={() => setNotifyModalOpen(false)} className={styles.cancelBtn}>Cancel</button>
                </div>
              </form>
            )}
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

      {roleWarning && (
        <div onClick={() => setRoleWarning(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: '1.5rem' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: '1rem', maxWidth: '28rem', width: '100%', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', padding: '2.5rem 2rem', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 6, background: 'linear-gradient(90deg, #2563EB, #fbbf24, #a855f7)' }} />
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem', color: '#2563EB' }}>
              <ShieldAlert size={48} strokeWidth={1.8} />
            </div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#111827', margin: '0 0 0.75rem' }}>Customer Account Required</h2>
            <p style={{ fontSize: '0.9rem', color: '#4b5563', margin: '0 0 1.75rem', lineHeight: 1.625 }}>
              You are currently signed in as <strong>{currentUser?.fullName || currentUser?.full_name || currentUser?.name || 'a staff account'}</strong>.
              Reserving a car is available only to <strong>Customer</strong> accounts.
              Please <strong>log out</strong> and sign in with your customer account to continue with this order.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxWidth: '18rem', margin: '0 auto' }}>
              <button type="button" onClick={() => authService.logout()} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', borderRadius: '0.5rem', border: 'none', background: '#2563EB', color: '#fff', fontSize: '0.9375rem', fontWeight: 700, cursor: 'pointer' }}>
                <LogOut size={16} /> Log Out &amp; Switch to Customer
              </button>
              <button type="button" onClick={() => setRoleWarning(false)} style={{ padding: '0.75rem 1.5rem', borderRadius: '0.5rem', border: '1px solid #e5e7eb', background: '#f3f4f6', color: '#111827', fontSize: '0.9375rem', fontWeight: 600, cursor: 'pointer' }}>Not Now</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default FleetGalleryPage;