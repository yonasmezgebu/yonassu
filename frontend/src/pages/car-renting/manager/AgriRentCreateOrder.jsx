import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Tractor, User, Phone, Mail, MapPin, Ruler, Sprout, Calendar, 
  CreditCard, Hash, Upload, ImagePlus, CheckCircle, ChevronDown,
  ArrowLeft, Loader2, X, Info, AlertTriangle, Clock, CheckSquare,
  Wrench, Ban, RefreshCw
} from 'lucide-react';
import api from '../../../services/apiClient';
import authService from '../../../services/authService';
import { PublicNav } from '../../LandingPage/PublicNavFooter';
import SegmentedSpinner from '../../../components/ui/SegmentedSpinner';
import { loadVatSafe, getVatForItem } from '../../../services/vatService';
import './AgriRentCreateOrder.css';

/* ─────────────── COLOR TOKENS ─────────────── */
const C = {
  forestGreen:  '#228B22',
  darkGreen:    '#1B5E20',
  emerald:      '#2E8B57',
  sage:         '#A5D6A7',
  earthBrown:   '#8D6E63',
  skyBlue:      '#87CEEB',
  white:        '#FFFFFF',
  lightGray:    '#F5F5F5',
  darkGray:     '#424242',
  red:          '#C62828',
  orange:       '#E65100',
  amber:        '#FF8F00',
  border:       '#8D6E63',
  textSec:      '#616161',
};

const INPUT_STYLE = {
  width: '100%', padding: '11px 14px', 
  border: `1.5px solid ${C.border}`, borderRadius: 0,
  fontSize: 14, outline: 'none', transition: 'border-color 0.15s',
  background: C.white, color: C.darkGray, boxSizing: 'border-box', fontFamily: 'Inter, sans-serif'
};
const LABEL_STYLE = {
  display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5,
  fontWeight: 700, color: C.textSec, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em'
};
const SECTION_STYLE = {
  background: C.white, borderRadius: 0, padding: '1.6rem',
  marginBottom: '1.2rem',
  border: `1px solid ${C.border}`, borderTop: `4px solid ${C.forestGreen}`
};
const SECTION_TITLE = {
  margin: '0 0 1.2rem', fontSize: 15, fontWeight: 800, color: C.darkGreen,
  display: 'flex', alignItems: 'center', gap: 8, paddingBottom: '0.85rem',
  borderBottom: `1px solid ${C.lightGray}`
};

/* ── Machine status helpers ── */
const getMachineStatus = (tractor) => {
  if (!tractor) return null;
  const av = (tractor.availability || tractor.availabilityStatus || '').toLowerCase();
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
    message: 'This machine is available. You can book it immediately.',
  },
  booked: {
    label: 'CURRENTLY BOOKED',
    color: C.orange,
    bg: '#FFF3E0',
    border: C.amber,
    icon: Clock,
    message: null, // built dynamically with bookingEndDate
  },
  maintenance: {
    label: 'UNDER MAINTENANCE',
    color: C.red,
    bg: '#FFEBEE',
    border: C.red,
    icon: Wrench,
    message: 'This machine is under maintenance and cannot be booked right now. Please select a different machine.',
  },
};

const AgriRentCreateOrder = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isManager = window.location.pathname.includes('/manager/');
  const fileRef = useRef(null);

  const [tractors, setTractors] = useState([]);
  const [financeAccounts, setFinanceAccounts] = useState([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);

  const [form, setForm] = useState({
    tractorId: location.state?.tractorId || '',
    startDate: '', endDate: '',
    fieldLocation: '', fieldSizeHectares: '', farmingPurpose: 'Plowing',
    specialInstructions: '',
    paymentMethod: '',   // will be set once accounts load
    paymentReference: '',
    customerName: location.state?.customerName || '',
    customerPhone: location.state?.customerPhone || '',
    customerEmail: location.state?.customerEmail || '',
  });

  const [scheduleLater, setScheduleLater] = useState(!!location.state?.waitlistId);
  const [queueConfirmed, setQueueConfirmed] = useState(false);   // explicit confirmation for booked
  const [screenshotFile, setScreenshotFile] = useState(null);
  const [screenshotPreview, setScreenshotPreview] = useState(null);
  const [pricing, setPricing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState('');

  // Global toast helper
  const toast = (msg, type = 'info') => {
    window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: msg, type } }));
  };

  /* ── Load tractors (with availability) ── */
  useEffect(() => {
    api.get('/tractors').then(res => {
      if (res.status === 'success') {
        const list = Array.isArray(res.data) ? res.data : [];
        setTractors(list);
      }
    }).catch(() => {});
  }, []);

  /* ── Load Finance Accounts for payment methods ── */
  useEffect(() => {
    setLoadingAccounts(true);
    api.get('/finance-bank').then(res => {
      const accounts = Array.isArray(res.data) ? res.data : (res?.data?.data || []);
      const active = accounts.filter(a => a.status !== 'Inactive');
      setFinanceAccounts(active);
      // Default to first active account if none selected yet
      if (active.length > 0 && !form.paymentMethod) {
        setForm(f => ({ ...f, paymentMethod: active[0].id.toString() }));
      }
      setLoadingAccounts(false);
    }).catch(() => {
      // If finance accounts fail to load, fall back to basic options
      setFinanceAccounts([]);
      setLoadingAccounts(false);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Autofill customer info for non-manager ── */
  useEffect(() => {
    if (!isManager) {
      const user = authService.getUser?.() || authService.getCurrentUser?.() || {};
      if (user) {
        setForm(f => ({
          ...f,
          customerName: user.fullName || user.full_name || '',
          customerPhone: user.phone || '',
          customerEmail: user.email || ''
        }));
      }
    }
  }, [isManager]);

  /* ── Price estimation ── */
  useEffect(() => {
    if (!form.startDate || !form.endDate || !form.tractorId) { setPricing(null); return; }
    const start = new Date(form.startDate), end = new Date(form.endDate);
    if (end <= start) { setPricing(null); return; }
    const days = Math.max(1, Math.ceil((end - start) / 86400000));
    const tractor = tractors.find(t => t.id === parseInt(form.tractorId));
    const dailyRate = tractor ? parseFloat(tractor.dailyRate || tractor.daily_rate || 0) : 0;
    setPricing({ days, dailyRate, total: days * dailyRate, tractorName: tractor?.name });
  }, [form.startDate, form.endDate, form.tractorId, tractors]);

  const [vatCtx, setVatCtx] = useState(null);
  useEffect(() => { loadVatSafe().then(setVatCtx).catch(() => {}); }, []);
  const pricingVat = vatCtx && pricing ? getVatForItem(vatCtx, 'agrirent', parseInt(form.tractorId || 0), pricing.total).vat : 0;
  const pricingTotal = pricing ? pricing.total + pricingVat : 0;

  const handleScreenshot = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setScreenshotFile(file);
    const reader = new FileReader();
    reader.onload = ev => setScreenshotPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  /* ── Derived machine state ── */
  const selectedTractor = tractors.find(t => t.id === parseInt(form.tractorId));
  const machineStatus = getMachineStatus(selectedTractor);
  const statusCfg = machineStatus ? STATUS_CONFIG[machineStatus] : null;

  // When machine is booked, auto-set schedule later
  useEffect(() => {
    if (machineStatus === 'booked') {
      setScheduleLater(true);
    } else if (machineStatus === 'available') {
      if (!location.state?.waitlistId) setScheduleLater(false);
      setQueueConfirmed(false);
    }
  }, [machineStatus]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Selected finance account details ── */
  const selectedAccount = financeAccounts.find(a => a.id.toString() === form.paymentMethod);
  const isManagerCash = isManager && form.paymentMethod === '__cash__';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!authService.isAuthenticated()) { navigate('/login'); return; }

    if (!form.tractorId) { toast('Please select a machine to hire.', 'error'); return; }

    // Block maintenance
    if (machineStatus === 'maintenance') {
      toast('This machine is under maintenance. Please choose a different machine.', 'error');
      return;
    }

    // If booked, require queue confirmation
    if (machineStatus === 'booked' && !queueConfirmed) {
      toast('Please confirm you want to join the queue for this machine.', 'error');
      return;
    }

    if (!scheduleLater && !form.startDate) { toast('Hire start date is required.', 'error'); return; }
    if (!scheduleLater && !form.endDate) { toast('Hire end date is required.', 'error'); return; }
    if (!scheduleLater && new Date(form.endDate) <= new Date(form.startDate)) { toast('End date must be after start date.', 'error'); return; }
    if (isManager && !form.customerName) { toast('Customer name is required.', 'error'); return; }
    if (isManager && !form.customerPhone) { toast('Customer phone is required.', 'error'); return; }
    if (!scheduleLater && !isManagerCash && !form.paymentReference && !screenshotFile) {
      toast('Please provide either a Payment Reference or upload a Payment Screenshot.', 'error');
      return;
    }

    setLoading(true);
    try {
      const endpoint = isManager ? '/agrirent-orders/manual' : '/agrirent-orders';
      const formData = new FormData();

      Object.entries(form).forEach(([k, v]) => { if (v !== '') formData.append(k, v); });
      formData.set('tractorId', parseInt(form.tractorId));

      // Resolve payment method from selected finance account
      if (selectedAccount) {
        formData.set('paymentMethod', selectedAccount.account_type === 'Bank' ? 'Bank' :
          selectedAccount.account_type === 'Mobile Wallet' ? 'Telebirr' : 'Cash');
        formData.set('paymentAccountName', selectedAccount.account_name || '');
        formData.set('paymentAccountNumber', selectedAccount.account_number || '');
        formData.set('paymentProvider', selectedAccount.bank_provider || '');
        formData.set('paymentAccountType', selectedAccount.account_type || '');
        formData.set('paymentAccountId', selectedAccount.id);
      } else if (isManagerCash) {
        formData.set('paymentMethod', 'Cash');
      }

      if (scheduleLater) {
        formData.set('scheduleLater', 'true');
        if (location.state?.waitlistId) formData.set('waitlistId', location.state.waitlistId);
      }
      if (form.fieldSizeHectares) formData.set('fieldSizeHectares', parseFloat(form.fieldSizeHectares));
      if (screenshotFile) formData.append('paymentScreenshot', screenshotFile);

      const res = await api.post(endpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.status === 'success' || res.status === 201) {
        const orderNum = res.data?.orderNumber || '';
        const queueMsg = scheduleLater
          ? `Order ${orderNum} queued! Dates will be assigned when the machine is free.`
          : `Order ${orderNum} submitted successfully!`;
        toast(queueMsg, 'success');
        setLoading(false);
        setTimeout(() => {
          if (isManager) navigate('/car-renting/manager/agri-orders');
          else navigate('/customer/farming-orders');
        }, 1800);
      }
    } catch (err) {
      toast(err?.message || 'Failed to submit order. Please try again.', 'error');
      setLoading(false);
    }
  };

  const fInput = (field) => ({
    ...INPUT_STYLE,
    borderColor: focusedField === field ? C.forestGreen : C.border,
    background: focusedField === field ? '#FBFCFB' : C.white
  });

  /* ── Booked-until label ── */
  const bookedUntilLabel = selectedTractor?.bookingEndDate
    ? new Date(selectedTractor.bookingEndDate).toLocaleDateString('en-ET', { year: 'numeric', month: 'long', day: 'numeric' })
    : 'a future date';

  return (
    <>
      {!isManager && <PublicNav />}
      <div className="arco-page" style={{
        minHeight: '100vh',
        background: C.white,
        paddingTop: isManager ? '1.5rem' : '90px',
        paddingBottom: '3rem',
        width: '100%'
      }}>
        <div style={{ maxWidth: 860, margin: '0 auto', padding: '0 1.5rem' }}>

          {/* Page Header */}
          <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={() => window.history.back()}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 38, height: 38, borderRadius: 0, border: `1.5px solid ${C.border}`,
                background: C.lightGray, cursor: 'pointer', color: C.darkGray,
                boxShadow: `0 3px 0 ${C.border}`, flexShrink: 0,
                transition: 'all 0.1s'
              }}
              onMouseDown={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(3px)'; }}
              onMouseUp={e => { e.currentTarget.style.boxShadow = `0 3px 0 ${C.border}`; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              <ArrowLeft size={17} />
            </button>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 0, background: C.white,
                  border: `2px solid ${C.darkGreen}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: `0 3px 0 ${C.forestGreen}`
                }}>
                  <Tractor size={20} color={C.darkGreen} />
                </div>
                <div>
                  <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: C.darkGray, fontFamily: 'Inter, sans-serif' }}>
                    {isManager ? 'Create AgriRent Order' : 'Hire Agricultural Equipment'}
                  </h1>
                  <p style={{ margin: 0, fontSize: 13, color: C.textSec, marginTop: 2 }}>
                    Fill in the details below to {isManager ? 'register a rental' : 'book your machine'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            {/* ── CUSTOMER INFO ── */}
            {isManager && (
              <div style={SECTION_STYLE}>
                <h3 style={SECTION_TITLE}>
                  <User size={18} color={C.forestGreen} /> Customer Information
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={LABEL_STYLE}><User size={12} /> Full Name *</label>
                    <input value={form.customerName} onChange={e => setForm(f => ({ ...f, customerName: e.target.value }))}
                      placeholder="Customer full name"
                      onFocus={() => setFocusedField('customerName')} onBlur={() => setFocusedField('')}
                      style={fInput('customerName')} />
                  </div>
                  <div>
                    <label style={LABEL_STYLE}><Phone size={12} /> Phone *</label>
                    <input value={form.customerPhone} onChange={e => setForm(f => ({ ...f, customerPhone: e.target.value }))}
                      placeholder="09xxxxxxxx"
                      onFocus={() => setFocusedField('customerPhone')} onBlur={() => setFocusedField('')}
                      style={fInput('customerPhone')} />
                  </div>
                </div>
                <div>
                  <label style={LABEL_STYLE}><Mail size={12} /> Email (Optional)</label>
                  <input value={form.customerEmail} onChange={e => setForm(f => ({ ...f, customerEmail: e.target.value }))}
                    placeholder="customer@email.com" type="email"
                    onFocus={() => setFocusedField('customerEmail')} onBlur={() => setFocusedField('')}
                    style={fInput('customerEmail')} />
                </div>
              </div>
            )}

            {/* ── MACHINE & SCHEDULE ── */}
            <div style={SECTION_STYLE}>
              <h3 style={SECTION_TITLE}>
                <Tractor size={18} color={C.emerald} /> Machine & Hire Schedule
              </h3>

              <div style={{ marginBottom: '1rem' }}>
                <label style={LABEL_STYLE}><Tractor size={12} /> Select Machine *</label>
                <div style={{ position: 'relative' }}>
                  <select value={form.tractorId} onChange={e => setForm(f => ({ ...f, tractorId: e.target.value }))}
                    style={{ ...fInput('tractorId'), appearance: 'none', paddingRight: 36, cursor: 'pointer' }}
                    onFocus={() => setFocusedField('tractorId')} onBlur={() => setFocusedField('')}>
                    <option value="">— Choose a machine —</option>
                    {tractors.map(t => {
                      const st = getMachineStatus(t);
                      const statusTag = st === 'available' ? '✅ Available' : st === 'booked' ? '🔴 Booked' : '🔧 Maintenance';
                      return (
                        <option key={t.id} value={t.id}>
                          {t.name} · {t.tractorType || 'Standard'} · {parseFloat(t.dailyRate || t.daily_rate || 0).toFixed(0)} ETB/day · {statusTag}
                        </option>
                      );
                    })}
                  </select>
                  <ChevronDown size={15} color={C.border} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                </div>
              </div>

              {/* ── Machine Status Banner ── */}
              {selectedTractor && statusCfg && (() => {
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
                          {selectedTractor.name} · {selectedTractor.tractorType || 'Agricultural Machine'} · <strong>{parseFloat(selectedTractor.dailyRate || selectedTractor.daily_rate || 0).toFixed(2)} ETB/day</strong>
                        </span>
                      </div>
                      <p style={{ margin: 0, fontSize: 13, color: C.darkGray, lineHeight: 1.5 }}>
                        {machineStatus === 'booked'
                          ? `This machine is currently hired out and is expected to be free by ${bookedUntilLabel}. You can join the queue — we will notify you and finalize dates once it returns.`
                          : statusCfg.message}
                      </p>

                      {/* Queue confirmation checkbox for BOOKED machines */}
                      {machineStatus === 'booked' && (
                        <div style={{
                          marginTop: 12, padding: '10px 14px',
                          background: queueConfirmed ? '#E8F5E9' : C.white,
                          border: `1px solid ${queueConfirmed ? C.forestGreen : C.amber}`,
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
                              I understand this machine is currently booked.{' '}
                              <strong style={{ color: C.forestGreen }}>Add me to the queue</strong> — dates will be set once the machine is available.
                            </span>
                          </label>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Date inputs — disabled for maintenance or unconfirmed queue */}
              {machineStatus !== 'maintenance' && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={LABEL_STYLE}>
                        <Calendar size={12} /> Start Date
                        {scheduleLater && <span style={{ color: C.amber, fontWeight: 600, fontSize: 11, textTransform: 'none', marginLeft: 4 }}>— to be set later</span>}
                      </label>
                      <input type="date" value={form.startDate} min={minDate} disabled={scheduleLater}
                        onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                        onFocus={() => setFocusedField('startDate')} onBlur={() => setFocusedField('')}
                        style={{ ...fInput('startDate'), opacity: scheduleLater ? 0.45 : 1 }} />
                    </div>
                    <div>
                      <label style={LABEL_STYLE}>
                        <Calendar size={12} /> End Date
                        {scheduleLater && <span style={{ color: C.amber, fontWeight: 600, fontSize: 11, textTransform: 'none', marginLeft: 4 }}>— to be set later</span>}
                      </label>
                      <input type="date" value={form.endDate} min={form.startDate || minDate} disabled={scheduleLater}
                        onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
                        onFocus={() => setFocusedField('endDate')} onBlur={() => setFocusedField('')}
                        style={{ ...fInput('endDate'), opacity: scheduleLater ? 0.45 : 1 }} />
                    </div>
                  </div>

                  {/* Waitlist tag for available machines if coming from request */}
                  {isManager && machineStatus === 'available' && location.state?.waitlistId && (
                    <div style={{ marginTop: '1rem', padding: '0.9rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                      <span style={{ fontSize: 11, fontWeight: 800, color: C.forestGreen, background: '#E8F5E9', border: `1px solid ${C.forestGreen}`, padding: '3px 9px' }}>
                        FROM AVAILABILITY REQUEST
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* ── PRICE ESTIMATE ── */}
            {pricing && !scheduleLater && (
              <div style={{
                borderRadius: 0, padding: '1.4rem', marginBottom: '1.2rem',
                background: C.white, border: `1px solid ${C.border}`, borderBottom: `4px solid ${C.darkGreen}`
              }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.textSec, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
                  Price Estimate
                </div>
                <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                  {[
                    { label: 'Daily Rate', value: `${pricing.dailyRate.toFixed(2)} ETB` },
                    { label: 'Total Days', value: `${pricing.days} days` },
                    { label: 'VAT Amount', value: `${pricingVat.toFixed(2)} ETB` },
                    { label: 'Total (incl. VAT)', value: `${pricingTotal.toFixed(2)} ETB`, large: true },
                  ].map(({ label, value, large }) => (
                    <div key={label}>
                      <div style={{ fontSize: 11, color: C.textSec, fontWeight: 600, marginBottom: 4 }}>{label}</div>
                      <div style={{ fontSize: large ? 26 : 17, fontWeight: large ? 900 : 700, color: C.darkGreen }}>{value}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── FIELD DETAILS ── */}
            {machineStatus !== 'maintenance' && (
              <div style={SECTION_STYLE}>
                <h3 style={SECTION_TITLE}>
                  <Sprout size={18} color={C.earthBrown} /> Field Details
                  <span style={{ fontSize: 11, fontWeight: 600, color: C.textSec, marginLeft: 'auto' }}>Optional</span>
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={LABEL_STYLE}><MapPin size={12} /> Location</label>
                    <input value={form.fieldLocation} onChange={e => setForm(f => ({ ...f, fieldLocation: e.target.value }))}
                      placeholder="e.g. Harar Zone"
                      onFocus={() => setFocusedField('fieldLocation')} onBlur={() => setFocusedField('')}
                      style={fInput('fieldLocation')} />
                  </div>
                  <div>
                    <label style={LABEL_STYLE}><Ruler size={12} /> Field Size (ha)</label>
                    <input type="number" step="0.1" value={form.fieldSizeHectares} onChange={e => setForm(f => ({ ...f, fieldSizeHectares: e.target.value }))}
                      placeholder="e.g. 2.5"
                      onFocus={() => setFocusedField('fieldSize')} onBlur={() => setFocusedField('')}
                      style={fInput('fieldSize')} />
                  </div>
                  <div>
                    <label style={LABEL_STYLE}><Sprout size={12} /> Farming Purpose</label>
                    <div style={{ position: 'relative' }}>
                      <select value={form.farmingPurpose} onChange={e => setForm(f => ({ ...f, farmingPurpose: e.target.value }))}
                        style={{ ...fInput('farmingPurpose'), appearance: 'none', paddingRight: 36, cursor: 'pointer' }}>
                        {['Plowing', 'Harvesting', 'Seeding', 'Tilling', 'Spraying', 'Other'].map(v => (
                          <option key={v} value={v}>{v}</option>
                        ))}
                      </select>
                      <ChevronDown size={14} color={C.border} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                    </div>
                  </div>
                </div>
                <div>
                  <label style={LABEL_STYLE}>Special Instructions</label>
                  <textarea value={form.specialInstructions} onChange={e => setForm(f => ({ ...f, specialInstructions: e.target.value }))}
                    rows={2} maxLength={500} placeholder="Any special requirements..."
                    onFocus={() => setFocusedField('instructions')} onBlur={() => setFocusedField('')}
                    style={{ ...fInput('instructions'), resize: 'vertical' }} />
                </div>
              </div>
            )}

            {/* ── PAYMENT SECTION — only if not schedule-later (queued) ── */}
            {!scheduleLater && machineStatus !== 'maintenance' && (
              <div style={{ ...SECTION_STYLE, borderTop: `4px solid ${C.earthBrown}` }}>
                <h3 style={SECTION_TITLE}>
                  <CreditCard size={18} color={C.forestGreen} /> Payment Verification
                </h3>

                {/* Payment Account selection — from Finance */}
                <div style={{ marginBottom: '1.2rem' }}>
                  <label style={LABEL_STYLE}>
                    <CreditCard size={12} /> Payment Account *
                    {loadingAccounts && <RefreshCw size={11} color={C.textSec} style={{ marginLeft: 4, animation: 'spin 1s linear infinite' }} />}
                  </label>

                  {loadingAccounts ? (
                    <div style={{ ...INPUT_STYLE, color: C.textSec, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Loader2 size={14} /> Loading payment accounts…
                    </div>
                  ) : (
                    <div style={{ position: 'relative' }}>
                      <select
                        value={form.paymentMethod}
                        onChange={e => setForm(f => ({ ...f, paymentMethod: e.target.value }))}
                        style={{ ...INPUT_STYLE, appearance: 'none', paddingRight: 36, cursor: 'pointer', fontWeight: 600 }}
                      >
                        {financeAccounts.length === 0 && (
                          <option value="">— No active accounts found —</option>
                        )}
                        {financeAccounts.map(acc => {
                          const icon = acc.account_type === 'Bank' ? '🏦' : acc.account_type === 'Mobile Wallet' ? '📱' : '💵';
                          return (
                            <option key={acc.id} value={acc.id.toString()}>
                              {icon} {acc.account_name}
                              {acc.account_number ? ` — ${acc.account_number}` : ''}
                              {acc.bank_provider ? ` (${acc.bank_provider})` : ''}
                            </option>
                          );
                        })}
                        {/* Manager can always pay cash */}
                        {isManager && <option value="__cash__">💵 Cash (Walk-In)</option>}
                      </select>
                      <ChevronDown size={14} color={C.border} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                    </div>
                  )}
                </div>

                {/* Payment instructions from selected account */}
                {selectedAccount && (
                  <div style={{ padding: '14px 16px', borderRadius: 0, background: C.lightGray, border: `1px solid ${C.border}`, marginBottom: '1.2rem', fontSize: 13, color: C.darkGray }}>
                    <div style={{ fontWeight: 800, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Info size={14} color={C.emerald} /> Pay the total amount to SUTANA using:
                    </div>
                    {selectedAccount.account_type === 'Mobile Wallet' && (
                      <div>📱 <strong>{selectedAccount.bank_provider || 'Mobile Wallet'}:</strong> {selectedAccount.account_number || 'N/A'} ({selectedAccount.account_name})</div>
                    )}
                    {selectedAccount.account_type === 'Bank' && (
                      <div>🏦 <strong>{selectedAccount.bank_provider || 'Bank'}:</strong> {selectedAccount.account_number || 'N/A'} — {selectedAccount.account_name}{selectedAccount.branch ? `, ${selectedAccount.branch}` : ''}</div>
                    )}
                    {selectedAccount.account_type === 'Cash' && (
                      <div>💵 <strong>Cash</strong> payable at office ({selectedAccount.account_name})</div>
                    )}
                  </div>
                )}

                {!isManagerCash && (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem', marginBottom: '1.2rem' }}>
                      <div>
                        <label style={LABEL_STYLE}><Hash size={12} /> Transaction Reference <span style={{ fontSize: 11, fontWeight: 600, color: C.textSec, marginLeft: 4 }}>— optional if screenshot provided</span></label>
                        <input value={form.paymentReference} onChange={e => setForm(f => ({ ...f, paymentReference: e.target.value }))}
                          placeholder="e.g. FT123456789"
                          onFocus={() => setFocusedField('payRef')} onBlur={() => setFocusedField('')}
                          style={fInput('payRef')} />
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1.2rem' }}>
                      <div style={{ flex: 1, height: 1, background: C.border }} />
                      <span style={{ fontSize: 11, fontWeight: 800, color: C.darkGray, padding: '4px 10px', border: `1px solid ${C.border}`, borderRadius: 0, background: C.lightGray }}>
                        OR
                      </span>
                      <div style={{ flex: 1, height: 1, background: C.border }} />
                    </div>

                    <div>
                      <label style={LABEL_STYLE}>
                        <ImagePlus size={12} /> Payment Screenshot
                        <span style={{ fontSize: 11, fontWeight: 600, color: C.textSec, marginLeft: 4 }}>— optional if reference provided</span>
                      </label>

                      {screenshotPreview ? (
                        <div style={{ position: 'relative', borderRadius: 0, overflow: 'hidden', border: `2px solid ${C.forestGreen}`, maxWidth: 280 }}>
                          <img src={screenshotPreview} alt="Payment" style={{ width: '100%', display: 'block', maxHeight: 180, objectFit: 'cover' }} />
                          <button type="button" onClick={() => { setScreenshotFile(null); setScreenshotPreview(null); if (fileRef.current) fileRef.current.value = ''; }}
                            style={{ position: 'absolute', top: 8, right: 8, width: 26, height: 26, borderRadius: 0, border: 'none', background: 'rgba(0,0,0,0.8)', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <X size={13} />
                          </button>
                          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '8px 12px', background: C.white, color: C.forestGreen, borderTop: `1px solid ${C.forestGreen}`, fontSize: 11, fontWeight: 800 }}>
                            SCREENSHOT UPLOADED
                          </div>
                        </div>
                      ) : (
                        <div
                          onClick={() => fileRef.current?.click()}
                          style={{
                            border: `2px dashed ${C.border}`, borderRadius: 0, padding: '1.5rem',
                            textAlign: 'center', cursor: 'pointer', background: C.lightGray,
                            transition: 'all 0.15s', maxWidth: 360
                          }}
                          onMouseOver={e => { e.currentTarget.style.borderColor = C.forestGreen; e.currentTarget.style.background = C.white; }}
                          onMouseOut={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.background = C.lightGray; }}
                        >
                          <Upload size={22} color={C.darkGray} style={{ marginBottom: 8, display: 'block', margin: '0 auto 8px' }} />
                          <div style={{ fontSize: 13, fontWeight: 700, color: C.darkGray }}>Click to upload screenshot</div>
                          <div style={{ fontSize: 11, color: C.textSec, marginTop: 4 }}>PNG, JPG, WEBP — max 5MB</div>
                        </div>
                      )}
                      <input ref={fileRef} type="file" accept="image/*" onChange={handleScreenshot} style={{ display: 'none' }} />
                    </div>
                  </>
                )}

                {isManagerCash && (
                  <div style={{ padding: '14px 16px', background: '#FFF8E1', border: `1px solid ${C.amber}`, fontSize: 13, color: C.darkGray }}>
                    <div style={{ fontWeight: 800, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Info size={14} color={C.amber} /> Cash Payment
                    </div>
                    Cash payments are accepted directly at the office. No reference or screenshot needed.
                  </div>
                )}
              </div>
            )}

            {/* ── Queue-only note when scheduled later ── */}
            {scheduleLater && machineStatus !== 'maintenance' && (
              <div style={{ ...SECTION_STYLE, borderTop: `4px solid ${C.amber}`, background: '#FFFDE7' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <Clock size={22} color={C.amber} style={{ flexShrink: 0 }} />
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 14, color: C.orange, marginBottom: 6 }}>Queued Order — Payment & Dates Set Later</div>
                    <p style={{ margin: 0, fontSize: 13, color: C.darkGray, lineHeight: 1.6 }}>
                      This order will be placed in the queue. No payment is required now. Once the machine becomes available, the manager will contact the customer to confirm the exact hire dates and collect payment at that time.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ── ACTIONS ── */}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', alignItems: 'center', paddingTop: '0.5rem' }}>
              <button type="button" onClick={() => window.history.back()} style={{
                padding: '12px 24px', border: `1.5px solid ${C.darkGray}`, borderRadius: 0,
                background: C.white, cursor: 'pointer', fontSize: 14, color: C.darkGray, fontWeight: 800,
                boxShadow: `0 3px 0 ${C.darkGray}`, transition: 'all 0.1s'
              }}
              onMouseDown={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(3px)'; }}
              onMouseUp={e => { e.currentTarget.style.boxShadow = `0 3px 0 ${C.darkGray}`; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                CANCEL
              </button>

              {/* Block submit button for maintenance machines */}
              {machineStatus === 'maintenance' ? (
                <div style={{ padding: '12px 24px', border: `1px solid ${C.red}`, background: '#FFEBEE', color: C.red, fontSize: 14, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Ban size={16} /> NOT BOOKABLE — UNDER MAINTENANCE
                </div>
              ) : (
                <button type="submit" disabled={loading || (machineStatus === 'booked' && !queueConfirmed)} style={{
                  padding: '12px 32px', border: `1px solid ${C.darkGreen}`, borderRadius: 0,
                  background: loading || (machineStatus === 'booked' && !queueConfirmed) ? '#9E9E9E' : scheduleLater ? C.amber : C.forestGreen,
                  color: C.white, cursor: (loading || (machineStatus === 'booked' && !queueConfirmed)) ? 'not-allowed' : 'pointer',
                  fontSize: 14, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8,
                  boxShadow: (loading || (machineStatus === 'booked' && !queueConfirmed)) ? 'none' : `0 4px 0 ${scheduleLater ? C.orange : C.darkGreen}`,
                  transition: 'all 0.1s'
                }}
                onMouseDown={e => { if (!loading){ e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(4px)'; } }}
                onMouseUp={e => { if (!loading){ e.currentTarget.style.boxShadow = `0 4px 0 ${scheduleLater ? C.orange : C.darkGreen}`; e.currentTarget.style.transform = 'translateY(0)'; } }}
                >
                  {loading ? (
                    <><SegmentedSpinner size={16} /> PROCESSING…</>
                  ) : scheduleLater ? (
                    <><Clock size={16} /> {isManager ? 'ADD TO QUEUE' : 'JOIN AVAILABILITY QUEUE'}</>
                  ) : (
                    <><Tractor size={16} /> {isManager ? 'CREATE ORDER' : 'SUBMIT HIRE REQUEST'}</>
                  )}
                </button>
              )}
            </div>
          </form>

          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    </>
  );
};

export default AgriRentCreateOrder;
