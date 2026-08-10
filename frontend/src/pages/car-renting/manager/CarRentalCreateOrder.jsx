import React, { useState, useEffect, useRef } from 'react';
import {
  Car, User, Phone, Mail, Calendar, CreditCard, Hash,
  Upload, ImagePlus, CheckCircle, ChevronDown,
  ArrowLeft, Loader2, X, Info, MapPin
} from 'lucide-react';
import api from '../../../services/apiClient';
import SegmentedSpinner from '../../../components/ui/SegmentedSpinner';

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
const CarRentalCreateOrder = ({ onBack, onSuccess }) => {
  const fileRef = useRef(null);

  const [cars, setCars] = useState([]);
  const [form, setForm] = useState({
    carId:           '',
    startDate:       '',
    endDate:         '',
    pickupLocation:  '',
    notes:           '',
    paymentMethod:   'Telebirr',
    paymentReference:'',
    customerName:    '',
    customerPhone:   '',
    customerEmail:   '',
  });
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

  /* ── Load available cars ── */
  useEffect(() => {
    api.get('/cars').then(res => {
      const list = Array.isArray(res.data) ? res.data : Array.isArray(res) ? res : [];
      setCars(list.filter(c => c.isAvailable !== false && c.status !== 'unavailable' && c.status !== 'maintenance'));
    }).catch(() => {});
  }, []);

  /* ── Auto-compute pricing ── */
  useEffect(() => {
    if (!form.startDate || !form.endDate || !form.carId) { setPricing(null); return; }
    const start = new Date(form.startDate), end = new Date(form.endDate);
    if (end <= start) { setPricing(null); return; }
    const days     = Math.max(1, Math.ceil((end - start) / 86400000));
    const car      = cars.find(c => String(c.id) === String(form.carId));
    const dailyRate = car ? parseFloat(car.dailyRate || car.daily_rate || car.pricePerDay || 0) : 0;
    setPricing({ days, dailyRate, total: days * dailyRate, carName: car ? `${car.brand} ${car.model}` : '' });
  }, [form.startDate, form.endDate, form.carId, cars]);

  const handleScreenshot = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setScreenshotFile(file);
    const reader = new FileReader();
    reader.onload = ev => setScreenshotPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const minDate = new Date().toISOString().split('T')[0];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.carId)          { toast('Please select a car.', 'error'); return; }
    if (!form.startDate)      { toast('Start date is required.', 'error'); return; }
    if (!form.endDate)        { toast('End date is required.', 'error'); return; }
    if (new Date(form.endDate) <= new Date(form.startDate)) { toast('End date must be after start date.', 'error'); return; }
    if (!form.customerName)   { toast('Customer name is required.', 'error'); return; }
    if (!form.customerPhone)  { toast('Customer phone is required.', 'error'); return; }
    if (!form.paymentReference && !screenshotFile) {
      toast('Provide a payment reference or upload a payment screenshot.', 'error'); return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (v !== '') formData.append(k, v); });
      formData.set('carId',   parseInt(form.carId));
      formData.set('isManual', 'true');
      if (screenshotFile) formData.append('paymentProof', screenshotFile);

      const res = await api.post('/rental-orders/manual', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.status === 'success' || res.status === 201 || res.id) {
        const orderNum = res.data?.orderNumber || res.orderNumber || '';
        toast(`Order ${orderNum} created successfully!`, 'success');
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

  const selectedCar = cars.find(c => String(c.id) === String(form.carId));

  return (
    <div style={{ minHeight: '100vh', background: C.white, fontFamily: 'Inter, sans-serif', color: C.darkGray }}>

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
            <div style={{ color: C.sage, fontSize: 12, fontWeight: 500 }}>Register a walk-in or phone-in rental booking</div>
          </div>
        </div>
      </div>

      {/* ── FORM ── */}
      <div style={{ maxWidth: 900, margin: '2rem auto', padding: '0 1.5rem 4rem' }}>
        <form onSubmit={handleSubmit}>

          {/* ══ SECTION 1: CUSTOMER ══ */}
          <div style={SECTION}>
            <h3 style={SECTION_TITLE}><User size={18} color={C.forestGreen} /> Customer Information</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={LABEL}><User size={12} /> Full Name *</label>
                <input value={form.customerName} onChange={e => setForm(f => ({ ...f, customerName: e.target.value }))}
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
            <div>
              <label style={LABEL}><Mail size={12} /> Email Address <span style={{ fontSize: 11, fontWeight: 600, color: C.textSec, marginLeft: 6, textTransform: 'none' }}>(optional)</span></label>
              <input value={form.customerEmail} onChange={e => setForm(f => ({ ...f, customerEmail: e.target.value }))}
                placeholder="customer@email.com" type="email"
                onFocus={() => setFocusedField('customerEmail')} onBlur={() => setFocusedField('')}
                style={fInput('customerEmail')} />
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
                  style={{ ...fInput('carId'), appearance: 'none', paddingRight: 36, cursor: 'pointer' }}
                  onFocus={() => setFocusedField('carId')} onBlur={() => setFocusedField('')}>
                  <option value="">— Choose an available vehicle —</option>
                  {cars.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.brand} {c.model} {c.year ? `(${c.year})` : ''} · {c.licensePlate || ''} · {parseFloat(c.dailyRate || c.daily_rate || c.pricePerDay || 0).toFixed(0)} ETB/day
                    </option>
                  ))}
                </select>
                <ChevronDown size={15} color={C.border} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              </div>
            </div>

            {/* Selected car preview */}
            {selectedCar && (
              <div style={{ padding: '12px 16px', background: C.lightGray, border: `1px solid ${C.border}`, borderLeft: `4px solid ${C.emerald}`, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 14, color: C.darkGreen }}>{selectedCar.brand} {selectedCar.model} {selectedCar.year && `(${selectedCar.year})`}</div>
                  <div style={{ fontSize: 12, color: C.textSec, marginTop: 2 }}>
                    Plate: <strong>{selectedCar.licensePlate || 'N/A'}</strong>&nbsp;·&nbsp;
                    Fuel: {selectedCar.fuelType || 'N/A'}&nbsp;·&nbsp;
                    Rate: <strong>{parseFloat(selectedCar.dailyRate || selectedCar.daily_rate || selectedCar.pricePerDay || 0).toFixed(2)} ETB/day</strong>
                  </div>
                </div>
                <div style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 700, color: C.forestGreen, background: C.white, border: `1px solid ${C.forestGreen}`, padding: '3px 9px' }}>
                  AVAILABLE
                </div>
              </div>
            )}

            {/* Dates */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={LABEL}><Calendar size={12} /> Start Date *</label>
                <input type="date" value={form.startDate} min={minDate}
                  onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                  onFocus={() => setFocusedField('startDate')} onBlur={() => setFocusedField('')}
                  style={fInput('startDate')} />
              </div>
              <div>
                <label style={LABEL}><Calendar size={12} /> End Date *</label>
                <input type="date" value={form.endDate} min={form.startDate || minDate}
                  onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
                  onFocus={() => setFocusedField('endDate')} onBlur={() => setFocusedField('')}
                  style={fInput('endDate')} />
              </div>
            </div>

            {/* Pickup location */}
            <div>
              <label style={LABEL}><MapPin size={12} /> Pickup Location <span style={{ fontSize: 11, fontWeight: 600, color: C.textSec, marginLeft: 6, textTransform: 'none' }}>(optional)</span></label>
              <input value={form.pickupLocation} onChange={e => setForm(f => ({ ...f, pickupLocation: e.target.value }))}
                placeholder="e.g. Addis Ababa Office, Airport, etc."
                onFocus={() => setFocusedField('pickupLocation')} onBlur={() => setFocusedField('')}
                style={fInput('pickupLocation')} />
            </div>
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
          <div style={{ ...SECTION, borderTop: `4px solid ${C.earthBrown}` }}>
            <h3 style={SECTION_TITLE}><CreditCard size={18} color={C.forestGreen} /> Payment Verification</h3>

            {/* Payment info banner */}
            <div style={{ padding: '14px 16px', background: C.lightGray, border: `1px solid ${C.border}`, marginBottom: '1.2rem', fontSize: 13, color: C.darkGray }}>
              <div style={{ fontWeight: 800, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Info size={14} color={C.emerald} /> Pay the total amount to SUTANA:
              </div>
              <div style={{ marginBottom: 4 }}>📱 <strong>Telebirr:</strong> 0901407032 (SUTANA WALLET)</div>
              <div>🏦 <strong>CBE Bank:</strong> 1000675227776 (SUTANA)</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem', marginBottom: '1.2rem' }}>
              <div>
                <label style={LABEL}><CreditCard size={12} /> Payment Method</label>
                <div style={{ position: 'relative' }}>
                  <select value={form.paymentMethod} onChange={e => setForm(f => ({ ...f, paymentMethod: e.target.value }))}
                    style={{ ...INPUT, appearance: 'none', paddingRight: 36, cursor: 'pointer', fontWeight: 600 }}>
                    <option value="Telebirr">📱 Telebirr</option>
                    <option value="CBE Bank">🏦 CBE Bank</option>
                    <option value="Cash">💵 Cash</option>
                    <option value="Awash Bank">🏦 Awash Bank</option>
                  </select>
                  <ChevronDown size={14} color={C.border} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                </div>
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
