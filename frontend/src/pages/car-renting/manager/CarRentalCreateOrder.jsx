import React, { useState, useEffect, useRef } from 'react';
import {
  Car, User, Phone, Mail, Calendar, CreditCard, Hash,
  Upload, ImagePlus, CheckCircle, ChevronDown,
  ArrowLeft, Loader2, X, Info, MapPin, Clock, Wrench, FileText
} from 'lucide-react';
import api from '../../../services/apiClient';
import SegmentedSpinner from '../../../components/ui/SegmentedSpinner';
import './CarRentalCreateOrder.css';

/* ─────────────── COLOR TOKENS ─────────────── */
const C = {
  forestGreen: '#228B22',
  darkGreen:   '#1B5E20',
  emerald:     '#2E8B57',
  sage:        '#A5D6A7',
  earthBrown:  '#8D6E63',
  white:       '#FFFFFF',
  lightGray:   '#F5F5F5',
  darkGray:    '#424242',
  red:         '#F44336',
  border:      '#8D6E63',
  textSec:     '#616161',
};

/* ── Image URL helper (matches FleetManager/AgriRent) ── */
const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  const base = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1').replace('/api/v1', '');
  return `${base}${path.startsWith('/') ? path : '/' + path}`;
};
const carLabel = (car) => car ? `${car.name}` : '';
const carRate = (car) => parseFloat(car?.dailyRate || car?.daily_rate || car?.pricePerDay || 0) || 0;

/* ── Machine status helpers ── */
const getMachineStatus = (car) => {
  if (!car) return null;
  const av = (car.availability || car.availabilityStatus || '').toLowerCase();
  if (av === 'maintenance' || av === 'in maintenance') return 'maintenance';
  if (av === 'booked' || av === 'rented' || av === 'out') return 'booked';
  return 'available';
};

const STATUS_CONFIG = {
  available: {
    label: 'AVAILABLE',
    color: C.forestGreen,
    bg: '#E8F5E9',
    border: C.forestGreen,
    icon: CheckCircle,
    message: 'This vehicle is available. You can book it immediately.',
  },
  booked: {
    label: 'CURRENTLY BOOKED',
    color: '#E65100',
    bg: '#FFF3E0',
    border: '#FF8F00',
    icon: Clock,
    message: null,
  },
  maintenance: {
    label: 'UNDER MAINTENANCE',
    color: C.red,
    bg: '#FFEBEE',
    border: C.red,
    icon: Wrench,
    message: 'This vehicle is under maintenance and cannot be booked right now. Please select a different vehicle.',
  },
};

const INPUT = {
  width: '100%', padding: '11px 14px',
  border: `1.5px solid ${C.border}`, borderRadius: 0,
  fontSize: 14, outline: 'none', transition: 'border-color 0.15s',
  background: C.white, color: C.darkGray, boxSizing: 'border-box',
  fontFamily: 'Inter, sans-serif',
};
const LABEL = {
  display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5,
  fontWeight: 700, color: C.textSec, marginBottom: 6,
  textTransform: 'uppercase', letterSpacing: '0.04em',
};
const SECTION = {
  background: C.white, borderRadius: 0, padding: '1.6rem', marginBottom: '1.2rem',
  border: `1px solid ${C.border}`, borderTop: `4px solid ${C.forestGreen}`,
};
const SECTION_TITLE = {
  margin: '0 0 1.2rem', fontSize: 15, fontWeight: 800, color: C.darkGreen,
  display: 'flex', alignItems: 'center', gap: 8, paddingBottom: '0.85rem',
  borderBottom: `1px solid ${C.lightGray}`,
};

/* ─────────────── MAIN COMPONENT ─────────────── */
const resolveAccountMethod = (acc) => {
  if (!acc) return '';
  const type = String(acc.account_type || '').toLowerCase();
  const provider = String(acc.bank_provider || '').trim();
  const name = String(acc.account_name || '').toLowerCase();
  if (name.includes('cash') || type === 'cash') return 'Cash';
  if (type.includes('wallet') || type.includes('mobile') || type.includes('telebirr')) return 'Telebirr';
  if (type.includes('bank') || type.includes('saving')) return provider ? `${provider} Bank` : 'Bank';
  return provider ? `${provider} Bank` : (acc.account_name || 'Bank');
};

const CarRentalCreateOrder = ({ onBack, onSuccess, waitlistState }) => {
  const fileRef = useRef(null);

  const [cars, setCars] = useState([]);
  const [financeAccounts, setFinanceAccounts] = useState([]);
  const [form, setForm] = useState({
    carId:           waitlistState?.carId ? String(waitlistState.carId) : '',
    startDate:       waitlistState?.startDate || '',
    endDate:         waitlistState?.endDate || '',
    pickupLocation:  waitlistState?.pickupLocation || '',
    notes:           waitlistState?.notes || '',
    paymentMethod:   'Telebirr',
    paymentReference:'',
    paymentAccountId:'', paymentAccountName:'', paymentAccountNumber:'', paymentProvider:'', paymentAccountType:'',
    customerName:    waitlistState?.customerName || '',
    customerPhone:   waitlistState?.customerPhone || '',
    customerEmail:   waitlistState?.customerEmail || '',
    driverName:      waitlistState?.driverName || waitlistState?.customerName || '',
    driverLicense:   waitlistState?.driverLicense || '',
  });
  const [scheduleLater, setScheduleLater] = useState(
    waitlistState?.carAvailability
      ? waitlistState.carAvailability.toLowerCase() !== 'available'
      : !!waitlistState?.waitlistId
  );
  const [queueConfirmed, setQueueConfirmed] = useState(false);
  const [screenshotFile,    setScreenshotFile]    = useState(null);
  const [screenshotPreview, setScreenshotPreview] = useState(null);
  const [pricing,           setPricing]           = useState(null);
  const [loading,           setLoading]           = useState(false);
  const [focusedField,      setFocusedField]      = useState('');
  const [toasts,            setToasts]            = useState([]);

  /* ── Toast helper ── */
  const toast = (message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts(p => [...p, { id, message, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4500);
  };

  /* ── Load cars (all of them — schedule-later holds can target a booked car) ── */
  useEffect(() => {
    api.get('/cars').then(res => {
      const list = Array.isArray(res.data) ? res.data : Array.isArray(res) ? res : [];
      setCars(list);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    api.get('/finance-bank').then(res => {
      const list = Array.isArray(res) ? res : (res && Array.isArray(res.data) ? res.data : []);
      setFinanceAccounts(list);
    }).catch(() => {});
  }, []);

  /* ── Auto-compute pricing ── */
  useEffect(() => {
    if (scheduleLater || !form.startDate || !form.endDate || !form.carId) { setPricing(null); return; }
    const start = new Date(form.startDate), end = new Date(form.endDate);
    if (end <= start) { setPricing(null); return; }
    const days     = Math.max(1, Math.ceil((end - start) / 86400000));
    const car      = cars.find(c => String(c.id) === String(form.carId));
    const dailyRate = carRate(car);
    setPricing({ days, dailyRate, total: days * dailyRate, carName: carLabel(car) });
  }, [form.startDate, form.endDate, form.carId, cars, scheduleLater]);

  const handleScreenshot = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setScreenshotFile(file);
    const reader = new FileReader();
    reader.onload = ev => setScreenshotPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleAccountSelect = (id) => {
    if (id === '__cash__') {
      setForm(f => ({ ...f, paymentAccountId: id, paymentMethod: 'Cash', paymentAccountName: '', paymentAccountNumber: '', paymentProvider: '', paymentAccountType: '' }));
      return;
    }
    const acc = financeAccounts.find(a => String(a.id) === String(id));
    setForm(f => ({
      ...f,
      paymentAccountId: id,
      paymentMethod: acc ? resolveAccountMethod(acc) : f.paymentMethod,
      paymentAccountName: acc?.account_name || '',
      paymentAccountNumber: acc?.account_number || '',
      paymentProvider: acc?.bank_provider || '',
      paymentAccountType: acc?.account_type || ''
    }));
  };

  const minDate = new Date().toISOString().split('T')[0];

  /* ── Derived machine state ── */
  const selectedCar = cars.find(c => String(c.id) === String(form.carId));
  const machineStatus = getMachineStatus(selectedCar);
  const statusCfg = machineStatus ? STATUS_CONFIG[machineStatus] : null;
  const bookedUntilLabel = selectedCar?.bookingEndDate
    ? new Date(selectedCar.bookingEndDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : 'Unknown Date';

  // Auto-set schedule later based on status
  useEffect(() => {
    if (machineStatus === 'booked') {
      setScheduleLater(true);
    } else if (machineStatus === 'available') {
      setScheduleLater(false);
      setQueueConfirmed(false);
    }
  }, [machineStatus]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.carId)          { toast('Please select a vehicle.', 'error'); return; }

    // Block maintenance
    if (machineStatus === 'maintenance') {
      toast('This vehicle is under maintenance. Please choose a different vehicle.', 'error');
      return;
    }

    // If booked, require queue confirmation
    if (machineStatus === 'booked' && !queueConfirmed) {
      toast('Please confirm you want to join the queue for this vehicle.', 'error');
      return;
    }

    if (!scheduleLater && !form.startDate)      { toast('Start date is required.', 'error'); return; }
    if (!scheduleLater && !form.endDate)        { toast('End date is required.', 'error'); return; }
    if (!scheduleLater && new Date(form.endDate) <= new Date(form.startDate)) { toast('End date must be after start date.', 'error'); return; }
    if (!form.customerName)   { toast('Customer name is required.', 'error'); return; }
    if (!form.customerPhone)  { toast('Customer phone is required.', 'error'); return; }
    if (!scheduleLater && form.paymentMethod !== 'Cash' && !form.paymentReference && !screenshotFile) {
      toast('Provide a payment reference or upload a payment screenshot.', 'error'); return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (v !== '') formData.append(k, v); });
      formData.set('carId',   parseInt(form.carId));
      formData.set('isManual', 'true');
      if (waitlistState?.customerId) formData.set('customerId', waitlistState.customerId);
      if (scheduleLater) {
        formData.set('scheduleLater', 'true');
      }
      if (waitlistState?.waitlistId) formData.set('waitlistId', waitlistState.waitlistId);
      if (!formData.get('driverLicense')) formData.set('driverLicense', form.driverLicense?.trim() || 'N/A');
      if (!formData.get('driverName')) formData.set('driverName', form.driverName?.trim() || form.customerName);
      if (screenshotFile) formData.append('paymentProof', screenshotFile);

      const res = await api.post('/rental-orders/manual', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.status === 'success' || res.status === 201 || res.id) {
        const orderNum = res.data?.orderNumber || res.orderNumber || '';
        toast(scheduleLater ? 'Reservation created — set dates once the car is available.' : `Order ${orderNum} created successfully!`, 'success');
        setLoading(false);
        setTimeout(() => onSuccess && onSuccess(), 1500);
      } else {
        throw new Error(res.message || 'Order creation failed.');
      }
    } catch (err) {
      toast(err?.response?.data?.message || err?.message || 'Failed to create order. Please try again.', 'error');
      setLoading(false);
    }
  };

  const fInput = field => ({
    ...INPUT,
    borderColor: focusedField === field ? C.forestGreen : C.border,
    background:  focusedField === field ? '#FBFCFB' : C.white,
  });

  return (
    <div className="crco-page" style={{ minHeight: '100vh', background: C.white, fontFamily: 'Inter, sans-serif', color: C.darkGray }}>

      {/* ── TOAST CONTAINER ── */}
      <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {toasts.map(t => (
          <div key={t.id} style={{ background: t.type === 'success' ? '#4CAF50' : t.type === 'error' ? '#F44336' : C.darkGreen, color: '#fff', padding: '12px 18px', boxShadow: '4px 4px 0px rgba(0,0,0,0.25)', fontSize: 13, fontWeight: 600, minWidth: 240, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
            <span>{t.message}</span>
            <button onClick={() => setToasts(p => p.filter(x => x.id !== t.id))} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 16 }}>×</button>
          </div>
        ))}
      </div>

      {/* ── TOP BANNER ── */}
      <div style={{ background: C.darkGreen, borderBottom: `3px solid ${C.earthBrown}`, padding: '0 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: 64 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button
            onClick={onBack}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 16px', background: 'rgba(255,255,255,0.12)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)', fontWeight: 700, fontSize: 13, cursor: 'pointer', boxShadow: '0 3px 0 rgba(0,0,0,0.3)' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.22)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; }}
          >
            <ArrowLeft size={15} /> Back to Orders
          </button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <Car size={22} color={C.sage} />
              <span style={{ color: '#fff', fontWeight: 800, fontSize: 17 }}>New Manual Car Rental Order</span>
            </div>
            <div style={{ color: C.sage, fontSize: 12, fontWeight: 500 }}>
              {waitlistState?.waitlistId
                ? 'Converting the customer availability request into a car rental order (dates set once the vehicle is free)'
                : 'Register a walk-in or phone-in rental booking'}
            </div>
          </div>
        </div>
      </div>

      {/* ── FORM ── */}
      <div style={{ maxWidth: 900, margin: '2rem auto', padding: '0 1.5rem 4rem' }}>
        <form onSubmit={handleSubmit}>

          {/* ══ SECTION 1: CUSTOMER & DRIVER ══ */}
          <div style={SECTION}>
            <h3 style={SECTION_TITLE}><User size={18} color={C.forestGreen} /> Customer & Driver Information</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={LABEL}><User size={12} /> Full Name *</label>
                <input value={form.customerName} onChange={e => {
                  const val = e.target.value;
                  setForm(f => ({
                    ...f,
                    customerName: val,
                    driverName: !f.driverName || f.driverName === f.customerName ? val : f.driverName
                  }));
                }}
                  placeholder="Customer full name"
                  onFocus={() => setFocusedField('customerName')} onBlur={() => setFocusedField('')}
                  style={fInput('customerName')} />
              </div>
              <div>
                <label style={LABEL}><Phone size={12} /> Phone Number *</label>
                <input value={form.customerPhone} onChange={e => setForm(f => ({ ...f, customerPhone: e.target.value }))}
                  placeholder="09xxxxxxxx"
                  onFocus={() => setFocusedField('customerPhone')} onBlur={() => setFocusedField('')}
                  style={fInput('customerPhone')} />
              </div>
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={LABEL}><Mail size={12} /> Email Address <span style={{ fontSize: 11, fontWeight: 600, color: C.textSec, marginLeft: 6, textTransform: 'none' }}>(optional)</span></label>
              <input value={form.customerEmail} onChange={e => setForm(f => ({ ...f, customerEmail: e.target.value }))}
                placeholder="customer@email.com" type="email"
                onFocus={() => setFocusedField('customerEmail')} onBlur={() => setFocusedField('')}
                style={fInput('customerEmail')} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', paddingTop: '0.85rem', borderTop: `1px dashed #E0E0E0` }}>
              <div>
                <label style={LABEL}><User size={12} /> Driver Name <span style={{ fontSize: 11, fontWeight: 600, color: C.textSec, marginLeft: 6, textTransform: 'none' }}>(optional, defaults to customer)</span></label>
                <input value={form.driverName} onChange={e => setForm(f => ({ ...f, driverName: e.target.value }))}
                  placeholder={form.customerName || "Driver full name"}
                  onFocus={() => setFocusedField('driverName')} onBlur={() => setFocusedField('')}
                  style={fInput('driverName')} />
              </div>
              <div>
                <label style={LABEL}><FileText size={12} /> Driver License Number <span style={{ fontSize: 11, fontWeight: 600, color: C.textSec, marginLeft: 6, textTransform: 'none' }}>(optional, defaults to N/A)</span></label>
                <input value={form.driverLicense} onChange={e => setForm(f => ({ ...f, driverLicense: e.target.value }))}
                  placeholder="e.g. DL-1234567 or N/A"
                  onFocus={() => setFocusedField('driverLicense')} onBlur={() => setFocusedField('')}
                  style={fInput('driverLicense')} />
              </div>
            </div>
          </div>

          {/* ══ SECTION 2: VEHICLE & DATES ══ */}
          <div style={SECTION}>
            <h3 style={SECTION_TITLE}><Car size={18} color={C.emerald} /> Vehicle & Rental Schedule</h3>

            {/* Car selector */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={LABEL}><Car size={12} /> Select Vehicle *</label>
              <div style={{ position: 'relative' }}>
                <select value={form.carId} onChange={e => setForm(f => ({ ...f, carId: e.target.value }))}
                  disabled={!!waitlistState?.waitlistId}
                  style={{ ...fInput('carId'), appearance: 'none', paddingRight: 36, cursor: waitlistState?.waitlistId ? 'not-allowed' : 'pointer', opacity: waitlistState?.waitlistId ? 0.75 : 1 }}
                  onFocus={() => setFocusedField('carId')} onBlur={() => setFocusedField('')}>
                  <option value="">— Choose a vehicle —</option>
                  {cars
                    .map(c => {
                      const st = getMachineStatus(c);
                      const statusTag = st === 'available' ? '✅ Available' : st === 'booked' ? '🔴 Booked' : '🔧 Maintenance';
                      return (
                        <option key={c.id} value={c.id}>
                          {carLabel(c)} · {c.carType || ''} · {carRate(c).toFixed(0)} ETB/day · {statusTag}
                        </option>
                      );
                    })}
                </select>
                <ChevronDown size={15} color={C.border} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              </div>
            </div>

            {/* ── Machine Status Banner ── */}
            {selectedCar && statusCfg && (() => {
              const Icon = statusCfg.icon;
              return (
                <div style={{
                  padding: '14px 18px', marginBottom: '1rem',
                  background: statusCfg.bg,
                  border: `1.5px solid ${statusCfg.border}`,
                  borderLeft: `5px solid ${statusCfg.border}`,
                  display: 'flex', alignItems: 'flex-start', gap: 12
                }}>
                  <Icon size={22} color={statusCfg.color} style={{ flexShrink: 0, marginTop: 1 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                      <span style={{ fontWeight: 900, fontSize: 13, color: statusCfg.color, letterSpacing: '0.05em' }}>
                        {statusCfg.label}
                      </span>
                      <span style={{ fontSize: 12, color: C.textSec, fontWeight: 600 }}>
                        {selectedCar.name} · {selectedCar.carType || 'Car'} · <strong>{carRate(selectedCar).toFixed(2)} ETB/day</strong>
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: 13, color: C.darkGray, lineHeight: 1.5 }}>
                      {machineStatus === 'booked'
                        ? `This vehicle is currently hired out and is expected to be free by ${bookedUntilLabel}. You can join the queue — we will notify you and finalize dates once it returns.`
                        : statusCfg.message}
                    </p>

                    {/* Queue confirmation checkbox for BOOKED machines */}
                    {machineStatus === 'booked' && (
                      <div style={{
                        marginTop: 12, padding: '10px 14px',
                        background: queueConfirmed ? '#E8F5E9' : C.white,
                        border: `1px solid ${queueConfirmed ? C.forestGreen : '#FF8F00'}`,
                        display: 'flex', alignItems: 'center', gap: 10
                      }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13, fontWeight: 700, color: C.darkGray }}>
                          <input
                            type="checkbox"
                            checked={queueConfirmed}
                            onChange={e => {
                              setQueueConfirmed(e.target.checked);
                              if (e.target.checked) setScheduleLater(true);
                            }}
                            style={{ width: 17, height: 17, accentColor: C.forestGreen }}
                          />
                          <span>
                            I understand this vehicle is currently booked.{' '}
                            <strong style={{ color: C.forestGreen }}>Add me to the queue</strong> — dates will be set once it is available.
                          </span>
                        </label>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Dates (Hidden entirely for maintenance) */}
            {machineStatus !== 'maintenance' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={LABEL}><Calendar size={12} /> Start Date {scheduleLater && <span style={{ fontSize: 11, fontWeight: 600, color: C.textSec, textTransform: 'none' }}>— later</span>}</label>
                  <input type="date" value={form.startDate} min={minDate} disabled={scheduleLater}
                    onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                    onFocus={() => setFocusedField('startDate')} onBlur={() => setFocusedField('')}
                    style={{ ...fInput('startDate'), opacity: scheduleLater ? 0.55 : 1 }} />
                </div>
                <div>
                  <label style={LABEL}><Calendar size={12} /> End Date {scheduleLater && <span style={{ fontSize: 11, fontWeight: 600, color: C.textSec, textTransform: 'none' }}>— later</span>}</label>
                  <input type="date" value={form.endDate} min={form.startDate || minDate} disabled={scheduleLater}
                    onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
                    onFocus={() => setFocusedField('endDate')} onBlur={() => setFocusedField('')}
                    style={{ ...fInput('endDate'), opacity: scheduleLater ? 0.55 : 1 }} />
                </div>
              </div>
            )}

            {/* Waitlist tag for available machines if coming from request */}
            {selectedCar?.availability === 'Available' && waitlistState?.waitlistId && (
              <div style={{ marginBottom: '1rem', padding: '0.9rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: C.forestGreen, background: '#E8F5E9', border: `1px solid ${C.forestGreen}`, padding: '3px 9px' }}>
                  FROM AVAILABILITY REQUEST
                </span>
              </div>
            )}
            
            {/* Schedule-later toggle (only if car is NOT available) */}
            {selectedCar?.availability !== 'Available' && (
              <div style={{ marginBottom: '1rem', background: scheduleLater ? '#E8F5E9' : C.lightGray, border: `1px solid ${scheduleLater ? C.forestGreen : C.border}`, padding: '0.9rem 1rem', display: 'flex', alignItems: 'center', gap: 10 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, fontWeight: 700, color: C.darkGray }}>
                  <input type="checkbox" checked={scheduleLater} onChange={e => setScheduleLater(e.target.checked)} style={{ width: 16, height: 16, accentColor: C.forestGreen }} />
                  Vehicle still rented — set dates later
                </label>
                {waitlistState?.waitlistId && (
                  <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 800, color: C.forestGreen, background: '#fff', border: `1px solid ${C.forestGreen}`, padding: '3px 9px' }}>
                    FROM AVAILABILITY REQUEST
                  </span>
                )}
              </div>
            )}

            {/* Pickup location */}
            {machineStatus !== 'maintenance' && (
              <div>
                <label style={LABEL}><MapPin size={12} /> Pickup Location <span style={{ fontSize: 11, fontWeight: 600, color: C.textSec, marginLeft: 6, textTransform: 'none' }}>(optional)</span></label>
                <input value={form.pickupLocation} onChange={e => setForm(f => ({ ...f, pickupLocation: e.target.value }))}
                  placeholder="e.g. Addis Ababa Office, Airport, etc."
                  onFocus={() => setFocusedField('pickupLocation')} onBlur={() => setFocusedField('')}
                  style={fInput('pickupLocation')} />
              </div>
            )}
          </div>

          {/* ── PRICE ESTIMATE ── */}
          {pricing && (
            <div style={{ borderRadius: 0, padding: '1.4rem', marginBottom: '1.2rem', background: C.white, border: `1px solid ${C.border}`, borderBottom: `4px solid ${C.darkGreen}` }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.textSec, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                <CheckCircle size={14} color={C.forestGreen} /> Price Estimate — {pricing.carName}
              </div>
              <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                {[
                  { label: 'Daily Rate',    value: `${pricing.dailyRate.toFixed(2)} ETB` },
                  { label: 'Total Days',    value: `${pricing.days} days` },
                  { label: 'Total Amount',  value: `${pricing.total.toFixed(2)} ETB`, large: true },
                ].map(({ label, value, large }) => (
                  <div key={label}>
                    <div style={{ fontSize: 11, color: C.textSec, fontWeight: 600, marginBottom: 4 }}>{label}</div>
                    <div style={{ fontSize: large ? 26 : 17, fontWeight: large ? 900 : 700, color: C.darkGreen }}>{value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ══ SECTION 3: NOTES ══ */}
          <div style={{ ...SECTION, borderTop: `4px solid ${C.earthBrown}` }}>
            <h3 style={SECTION_TITLE}>Additional Notes <span style={{ fontSize: 11, fontWeight: 600, color: C.textSec, marginLeft: 'auto', textTransform: 'none' }}>Optional</span></h3>
            <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              rows={3} maxLength={600} placeholder="Special requirements, instructions, or remarks..."
              onFocus={() => setFocusedField('notes')} onBlur={() => setFocusedField('')}
              style={{ ...fInput('notes'), resize: 'vertical' }} />
          </div>

          {/* ══ SECTION 4: PAYMENT ══ */}
          {scheduleLater ? (
            <div style={{ ...SECTION, borderTop: `4px solid ${C.forestGreen}`, background: '#F0FAF0' }}>
              <h3 style={SECTION_TITLE}><CreditCard size={18} color={C.forestGreen} /> Payment — Collected Later</h3>
              <p style={{ margin: 0, fontSize: 13, color: C.darkGray, lineHeight: 1.6 }}>
                <strong>Reservation is on hold.</strong> No payment is collected now. When the vehicle is free and you ({waitlistState?.customerName || 'the customer'}) set the rental dates, the order will be finalized, the invoice issued, and payment followed up then.
              </p>
            </div>
          ) : (
            <div style={{ ...SECTION, borderTop: `4px solid ${C.earthBrown}` }}>
              <h3 style={SECTION_TITLE}><CreditCard size={18} color={C.forestGreen} /> Payment Verification</h3>

              {/* Payment info banner */}
              <div style={{ padding: '14px 16px', background: C.lightGray, border: `1px solid ${C.border}`, marginBottom: '1.2rem', fontSize: 13, color: C.darkGray }}>
                <div style={{ fontWeight: 800, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Info size={14} color={C.emerald} /> Select the account the customer paid into:
                </div>
                {financeAccounts.length === 0 ? (
                  <div style={{ color: C.textSec }}>⏳ Loading payment accounts…</div>
                ) : (
                  <div style={{ position: 'relative' }}>
                    <select value={form.paymentAccountId} onChange={e => handleAccountSelect(e.target.value)}
                      style={{ ...INPUT, appearance: 'none', paddingRight: 36, cursor: 'pointer', fontWeight: 600 }}>
                      <option value="">— Select Payment Account —</option>
                      {['Bank', 'Mobile Wallet'].map(type => {
                        const group = financeAccounts.filter(a => a.account_type === type && a.status === 'Active');
                        if (group.length === 0) return null;
                        return (
                          <optgroup key={type} label={type}>
                            {group.map(acc => (
                              <option key={acc.id} value={acc.id}>
                                {resolveAccountMethod(acc)}{acc.account_number ? ` — ${acc.account_number}` : ''}
                              </option>
                            ))}
                          </optgroup>
                        );
                      })}
                      <option value="__cash__">💵 Cash</option>
                    </select>
                    <ChevronDown size={14} color={C.border} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                  </div>
                )}
                {(() => {
                  const acc = financeAccounts.find(a => String(a.id) === String(form.paymentAccountId));
                  if (!acc) return null;
                  return (
                    <div style={{ marginTop: 10 }}>
                      <div><strong>Method:</strong> {resolveAccountMethod(acc)}</div>
                      {acc.account_number && <div><strong>Account Number:</strong> {acc.account_number}</div>}
                      {acc.bank_provider && <div><strong>Bank / Provider:</strong> {acc.bank_provider}</div>}
                    </div>
                  );
                })()}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem', marginBottom: '1.2rem' }}>
                <div>
                  <label style={LABEL}><CreditCard size={12} /> Payment Method</label>
                  <input readOnly value={form.paymentMethod || ''} placeholder="Choose an account above"
                    style={{ ...INPUT, background: C.lightGray, fontWeight: 600 }} />
                </div>
                <div>
                  <label style={LABEL}><Hash size={12} /> Transaction Reference <span style={{ fontSize: 11, fontWeight: 600, color: C.textSec, marginLeft: 4, textTransform: 'none' }}>— optional if screenshot provided</span></label>
                  <input value={form.paymentReference} onChange={e => setForm(f => ({ ...f, paymentReference: e.target.value }))}
                    placeholder="e.g. FT123456789"
                    onFocus={() => setFocusedField('payRef')} onBlur={() => setFocusedField('')}
                    style={fInput('payRef')} />
                </div>
              </div>

              {/* OR divider */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1.2rem' }}>
                <div style={{ flex: 1, height: 1, background: C.border }} />
                <span style={{ fontSize: 11, fontWeight: 800, color: C.darkGray, padding: '4px 10px', border: `1px solid ${C.border}`, background: C.lightGray }}>OR</span>
                <div style={{ flex: 1, height: 1, background: C.border }} />
              </div>

              {/* Screenshot upload */}
              <div>
                <label style={LABEL}>
                  <ImagePlus size={12} /> Payment Screenshot
                  <span style={{ fontSize: 11, fontWeight: 600, color: C.textSec, marginLeft: 4, textTransform: 'none' }}>— optional if reference provided</span>
                </label>
                {screenshotPreview ? (
                  <div style={{ position: 'relative', overflow: 'hidden', border: `2px solid ${C.forestGreen}`, maxWidth: 280 }}>
                    <img src={screenshotPreview} alt="Payment" style={{ width: '100%', display: 'block', maxHeight: 180, objectFit: 'cover' }} />
                    <button type="button" onClick={() => { setScreenshotFile(null); setScreenshotPreview(null); if (fileRef.current) fileRef.current.value = ''; }}
                      style={{ position: 'absolute', top: 8, right: 8, width: 26, height: 26, border: 'none', background: 'rgba(0,0,0,0.8)', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <X size={13} />
                    </button>
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '8px 12px', background: C.white, color: C.forestGreen, borderTop: `1px solid ${C.forestGreen}`, fontSize: 11, fontWeight: 800 }}>
                      ✓ SCREENSHOT UPLOADED
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => fileRef.current?.click()}
                    style={{ border: `2px dashed ${C.border}`, padding: '1.5rem', textAlign: 'center', cursor: 'pointer', background: C.lightGray, transition: 'all 0.15s', maxWidth: 360 }}
                    onMouseOver={e => { e.currentTarget.style.borderColor = C.forestGreen; e.currentTarget.style.background = C.white; }}
                    onMouseOut={e  => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.background = C.lightGray; }}
                  >
                    <Upload size={22} color={C.darkGray} style={{ marginBottom: 8, display: 'block', margin: '0 auto 8px' }} />
                    <div style={{ fontSize: 13, fontWeight: 700, color: C.darkGray }}>Click to upload screenshot</div>
                    <div style={{ fontSize: 11, color: C.textSec, marginTop: 4 }}>PNG, JPG, WEBP — max 5MB</div>
                  </div>
                )}
                <input ref={fileRef} type="file" accept="image/*" onChange={handleScreenshot} style={{ display: 'none' }} />
              </div>
            </div>
          )}

          {/* ══ ACTION BUTTONS ══ */}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', alignItems: 'center', paddingTop: '0.5rem' }}>
            <button type="button" onClick={onBack}
              style={{ padding: '12px 24px', border: `1.5px solid ${C.darkGray}`, background: C.white, cursor: 'pointer', fontSize: 14, color: C.darkGray, fontWeight: 800, boxShadow: `0 3px 0 ${C.darkGray}`, transition: 'all 0.1s' }}
              onMouseDown={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(3px)'; }}
              onMouseUp={e => { e.currentTarget.style.boxShadow = `0 3px 0 ${C.darkGray}`; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              CANCEL
            </button>
            <button type="submit" disabled={loading}
              style={{ padding: '12px 36px', border: `1px solid ${C.darkGreen}`, background: loading ? C.border : C.forestGreen, color: C.white, cursor: loading ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8, boxShadow: loading ? 'none' : `0 4px 0 ${C.darkGreen}`, transition: 'all 0.1s' }}
              onMouseDown={e => { if (!loading) { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(4px)'; } }}
              onMouseUp={e => { if (!loading) { e.currentTarget.style.boxShadow = `0 4px 0 ${C.darkGreen}`; e.currentTarget.style.transform = 'translateY(0)'; } }}
            >
              {loading
                ? <><SegmentedSpinner size={16} /> CREATING ORDER...</>
                : <><Car size={16} /> CREATE RENTAL ORDER</>
              }
            </button>
          </div>
        </form>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default CarRentalCreateOrder;
