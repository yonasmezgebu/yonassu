import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Tractor, User, Phone, Mail, MapPin, Ruler, Sprout, Calendar, 
  CreditCard, Hash, Upload, ImagePlus, CheckCircle, ChevronDown,
  ArrowLeft, Loader2, X, Info
} from 'lucide-react';
import api from '../../../services/apiClient';
import authService from '../../../services/authService';
import { PublicNav } from '../../LandingPage/PublicNavFooter';

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
  red:          '#F44336',
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

const AgriRentCreateOrder = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isManager = window.location.pathname.includes('/manager/');
  const fileRef = useRef(null);

  const [tractors, setTractors] = useState([]);
  const [form, setForm] = useState({
    tractorId: location.state?.tractorId || '',
    startDate: '', endDate: '',
    fieldLocation: '', fieldSizeHectares: '', farmingPurpose: 'Plowing',
    specialInstructions: '',
    paymentMethod: 'Telebirr', paymentReference: '',
    // Manager-only fields
    customerName: '', customerPhone: '', customerEmail: '',
  });
  const [screenshotFile, setScreenshotFile] = useState(null);
  const [screenshotPreview, setScreenshotPreview] = useState(null);
  const [pricing, setPricing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState('');

  // Global toast helper
  const toast = (msg, type = 'info') => {
    window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: msg, type } }));
  };

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

  useEffect(() => {
    api.get('/tractors').then(res => {
      if (res.status === 'success') {
        const list = Array.isArray(res.data) ? res.data : [];
        setTractors(list);
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!form.startDate || !form.endDate || !form.tractorId) { setPricing(null); return; }
    const start = new Date(form.startDate), end = new Date(form.endDate);
    if (end <= start) { setPricing(null); return; }
    const days = Math.max(1, Math.ceil((end - start) / 86400000));
    const tractor = tractors.find(t => t.id === parseInt(form.tractorId));
    const dailyRate = tractor ? parseFloat(tractor.dailyRate || tractor.daily_rate || 0) : 0;
    setPricing({ days, dailyRate, total: days * dailyRate, tractorName: tractor?.name });
  }, [form.startDate, form.endDate, form.tractorId, tractors]);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!authService.isAuthenticated()) { navigate('/login'); return; }

    if (!form.tractorId) { toast('Please select a machine to hire.', 'error'); return; }
    if (!form.startDate || !form.endDate) { toast('Hire start and end dates are required.', 'error'); return; }
    if (new Date(form.endDate) <= new Date(form.startDate)) { toast('End date must be after start date.', 'error'); return; }
    if (isManager && !form.customerName) { toast('Customer name is required.', 'error'); return; }
    if (isManager && !form.customerPhone) { toast('Customer phone is required.', 'error'); return; }
    if (!form.paymentReference && !screenshotFile) {
      toast('Please provide either a Payment Reference or upload a Payment Screenshot.', 'error');
      return;
    }

    setLoading(true);
    try {
      const endpoint = isManager ? '/agrirent-orders/manual' : '/agrirent-orders';
      const formData = new FormData();

      Object.entries(form).forEach(([k, v]) => { if (v !== '') formData.append(k, v); });
      formData.set('tractorId', parseInt(form.tractorId));
      if (form.fieldSizeHectares) formData.set('fieldSizeHectares', parseFloat(form.fieldSizeHectares));
      if (screenshotFile) formData.append('paymentScreenshot', screenshotFile);

      const res = await api.post(endpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.status === 'success' || res.status === 201) {
        const orderNum = res.data?.orderNumber || '';
        toast(`Order ${orderNum} submitted successfully!`, 'success');
        setLoading(false);
        setTimeout(() => {
          if (isManager) navigate('/car-renting/manager/agri-orders');
          else navigate('/agrirent/my-orders');
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

  const selectedTractor = tractors.find(t => t.id === parseInt(form.tractorId));

  return (
    <>
      {!isManager && <PublicNav />}
      <div style={{
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
            {/* ── CUSTOMER INFO (Manager always shows, public user sees read-only) ── */}
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
                    <option value="">— Choose an available machine —</option>
                    {tractors.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.name} · {t.tractorType || 'Standard'} · {parseFloat(t.dailyRate || t.daily_rate || 0).toFixed(0)} ETB/day
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={15} color={C.border} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                </div>
              </div>

              {selectedTractor && (
                <div style={{ padding: '12px 16px', borderRadius: 0, background: C.lightGray, border: `1px solid ${C.border}`, borderLeft: `4px solid ${C.emerald}`, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 14, color: C.darkGreen }}>{selectedTractor.name}</div>
                    <div style={{ fontSize: 12, color: C.textSec, marginTop: 2 }}>{selectedTractor.tractorType || 'Agricultural Machine'} · <strong>{parseFloat(selectedTractor.dailyRate || selectedTractor.daily_rate || 0).toFixed(2)} ETB/day</strong></div>
                  </div>
                  <div style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 700, color: C.forestGreen, background: C.white, border: `1px solid ${C.forestGreen}`, padding: '3px 9px', borderRadius: 0 }}>
                    AVAILABLE
                  </div>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={LABEL_STYLE}><Calendar size={12} /> Start Date *</label>
                  <input type="date" value={form.startDate} min={minDate}
                    onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                    onFocus={() => setFocusedField('startDate')} onBlur={() => setFocusedField('')}
                    style={fInput('startDate')} />
                </div>
                <div>
                  <label style={LABEL_STYLE}><Calendar size={12} /> End Date *</label>
                  <input type="date" value={form.endDate} min={form.startDate || minDate}
                    onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
                    onFocus={() => setFocusedField('endDate')} onBlur={() => setFocusedField('')}
                    style={fInput('endDate')} />
                </div>
              </div>
            </div>

            {/* ── PRICE ESTIMATE ── */}
            {pricing && (
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
                    { label: 'Total Amount', value: `${pricing.total.toFixed(2)} ETB`, large: true },
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

            {/* ── PAYMENT SECTION ── */}
            <div style={{ ...SECTION_STYLE, borderTop: `4px solid ${C.earthBrown}` }}>
              <h3 style={SECTION_TITLE}>
                <CreditCard size={18} color={C.forestGreen} /> Payment Verification
              </h3>

              <div style={{ padding: '14px 16px', borderRadius: 0, background: C.lightGray, border: `1px solid ${C.border}`, marginBottom: '1.2rem', fontSize: 13, color: C.darkGray }}>
                <div style={{ fontWeight: 800, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Info size={14} color={C.emerald} /> Pay the total amount to SUTANA:
                </div>
                <div style={{ marginBottom: 4 }}>📱 <strong>Telebirr:</strong> 0901407032 (SUTANA WALLET)</div>
                <div>🏦 <strong>CBE Bank:</strong> 1000675227776 (SUTANA)</div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem', marginBottom: '1.2rem' }}>
                <div>
                  <label style={LABEL_STYLE}><CreditCard size={12} /> Payment Method</label>
                  <div style={{ position: 'relative' }}>
                    <select value={form.paymentMethod} onChange={e => setForm(f => ({ ...f, paymentMethod: e.target.value }))}
                      style={{ ...INPUT_STYLE, appearance: 'none', paddingRight: 36, cursor: 'pointer', fontWeight: 600 }}>
                      <option value="Telebirr">📱 Telebirr</option>
                      <option value="CBE Bank">🏦 CBE Bank</option>
                      {isManager && <option value="Cash">💵 Cash</option>}
                    </select>
                    <ChevronDown size={14} color={C.border} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                  </div>
                </div>
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
            </div>

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
              <button type="submit" disabled={loading} style={{
                padding: '12px 32px', border: `1px solid ${C.darkGreen}`, borderRadius: 0,
                background: loading ? C.border : C.forestGreen,
                color: C.white, cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: 14, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8,
                boxShadow: loading ? 'none' : `0 4px 0 ${C.darkGreen}`,
                transition: 'all 0.1s'
              }}
              onMouseDown={e => { if(!loading){ e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(4px)'; } }}
              onMouseUp={e => { if(!loading){ e.currentTarget.style.boxShadow = `0 4px 0 ${C.darkGreen}`; e.currentTarget.style.transform = 'translateY(0)'; } }}
              >
                {loading ? (
                  <><Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite' }} /> PROCESSING...</>
                ) : (
                  <><Tractor size={16} /> {isManager ? 'CREATE ORDER' : 'SUBMIT HIRE REQUEST'}</>
                )}
              </button>
            </div>
          </form>

          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    </>
  );
};

export default AgriRentCreateOrder;

