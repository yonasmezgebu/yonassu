import React, { useState, useEffect, useRef } from 'react';
import apiClient from '../../services/apiClient';
import {
  Truck, User, Mail, Phone, Building2, Tag, MapPin, FileText,
  CheckCircle2, Clock, ChevronRight, AlertCircle, Loader2,
  ShieldCheck, Star, Package, ArrowRight
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

/* ─── Styles ─────────────────────────────────────────────── */
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

  .bs-page {
    padding: 32px;
    background: #F5F5F5;
    min-height: calc(100vh - 60px);
    box-sizing: border-box;
    font-family: 'Inter', sans-serif;
    color: #333;
  }
  @media (max-width: 720px) { .bs-page { padding: 16px; } }

  /* Hero Banner */
  .bs-hero {
    background: linear-gradient(135deg, #1B5E20 0%, #228B22 60%, #2E8B57 100%);
    border-radius: 20px;
    padding: 48px 40px;
    color: #fff;
    display: flex;
    align-items: center;
    gap: 32px;
    margin-bottom: 32px;
    position: relative;
    overflow: hidden;
  }
  .bs-hero::before {
    content: '';
    position: absolute;
    top: -60px; right: -60px;
    width: 260px; height: 260px;
    border-radius: 50%;
    background: rgba(255,255,255,0.06);
  }
  .bs-hero::after {
    content: '';
    position: absolute;
    bottom: -80px; left: 30%;
    width: 200px; height: 200px;
    border-radius: 50%;
    background: rgba(255,255,255,0.04);
  }
  .bs-hero-icon {
    width: 80px; height: 80px;
    background: rgba(255,255,255,0.15);
    border-radius: 20px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
    backdrop-filter: blur(8px);
    border: 1.5px solid rgba(255,255,255,0.2);
  }
  .bs-hero-text h1 {
    font-size: 2rem; font-weight: 800;
    margin: 0 0 8px; letter-spacing: -0.02em;
  }
  .bs-hero-text p {
    margin: 0; opacity: 0.85; font-size: 1rem; line-height: 1.6;
    max-width: 560px;
  }
  @media (max-width: 640px) {
    .bs-hero { flex-direction: column; padding: 28px 20px; }
    .bs-hero-text h1 { font-size: 1.4rem; }
  }

  /* Benefits strip */
  .bs-benefits {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 16px;
    margin-bottom: 32px;
  }
  .bs-benefit {
    background: #fff;
    border: 1px solid #E0E0E0;
    border-radius: 12px;
    padding: 20px;
    display: flex; align-items: flex-start; gap: 12px;
    transition: box-shadow 0.2s, transform 0.2s;
  }
  .bs-benefit:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.08); transform: translateY(-2px); }
  .bs-benefit-icon {
    width: 40px; height: 40px; border-radius: 10px;
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  }
  .bs-benefit h4 { margin: 0 0 4px; font-size: 0.875rem; font-weight: 700; color: #1B5E20; }
  .bs-benefit p { margin: 0; font-size: 0.78rem; color: #666; line-height: 1.5; }

  /* Card */
  .bs-card {
    background: #fff;
    border: 1px solid #E0E0E0;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  }
  .bs-card-header {
    background: linear-gradient(90deg, #f1f8f1 0%, #fff 100%);
    border-bottom: 1px solid #E8F5E9;
    padding: 24px 28px;
    display: flex; align-items: center; gap: 12px;
  }
  .bs-card-header h2 { margin: 0; font-size: 1.25rem; font-weight: 700; color: #1B5E20; }
  .bs-card-header p { margin: 4px 0 0; font-size: 0.85rem; color: #6B8E23; }

  /* Form grid */
  .bs-form { padding: 28px; }
  .bs-section-label {
    font-size: 0.7rem; font-weight: 700; letter-spacing: 0.12em;
    color: #6B8E23; text-transform: uppercase;
    margin: 0 0 16px;
    display: flex; align-items: center; gap: 8px;
  }
  .bs-section-label::after {
    content: ''; flex: 1; height: 1px; background: #E8F5E9;
  }
  .bs-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
  @media (max-width: 640px) { .bs-grid-2 { grid-template-columns: 1fr; } }
  .bs-field { margin-bottom: 0; }
  .bs-field-full { margin-bottom: 16px; }
  .bs-label {
    display: flex; align-items: center; gap: 6px;
    font-size: 0.82rem; font-weight: 600; color: #424242;
    margin-bottom: 6px;
  }
  .bs-readonly-box {
    background: #F9FBE7;
    border: 1px solid #DCE775;
    border-radius: 8px;
    padding: 11px 14px;
    font-size: 0.9rem; color: #33691E;
    font-weight: 500;
    display: flex; align-items: center; gap: 8px;
    position: relative;
  }
  .bs-readonly-badge {
    position: absolute; right: 10px; top: 50%; transform: translateY(-50%);
    background: #DCEDC8; color: #33691E;
    font-size: 0.65rem; font-weight: 700; padding: 2px 8px;
    border-radius: 20px; letter-spacing: 0.08em;
  }

  /* ── Profile Avatar ── */
  .bs-avatar-wrap {
    display: flex;
    align-items: center;
    gap: 20px;
    background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
    border: 1.5px solid #bbf7d0;
    border-radius: 16px;
    padding: 20px 24px;
    margin-bottom: 20px;
  }
  .bs-avatar {
    width: 72px; height: 72px;
    border-radius: 50%;
    background: linear-gradient(135deg, #228B22 0%, #2E8B57 100%);
    display: flex; align-items: center; justify-content: center;
    font-size: 1.75rem; font-weight: 800;
    color: #fff;
    flex-shrink: 0;
    box-shadow: 0 4px 14px rgba(34,139,34,0.35);
    letter-spacing: -0.02em;
    position: relative;
    overflow: hidden;
  }
  .bs-avatar::after {
    content: '';
    position: absolute;
    top: 0; left: -60%;
    width: 50%; height: 100%;
    background: rgba(255,255,255,0.18);
    transform: skewX(-15deg);
  }
  .bs-avatar-img {
    width: 100%; height: 100%; object-fit: cover; border-radius: 50%;
  }
  .bs-avatar-info { flex: 1; min-width: 0; }
  .bs-avatar-name {
    font-size: 1.1rem; font-weight: 700; color: #14532d;
    margin: 0 0 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .bs-avatar-role {
    font-size: 0.8rem; color: #16a34a; font-weight: 500;
    background: #dcfce7; padding: 2px 10px; border-radius: 20px;
    display: inline-block;
  }
  .bs-input, .bs-select, .bs-textarea {
    width: 100%; box-sizing: border-box;
    border: 1px solid #8D6E63;
    border-radius: 8px;
    padding: 11px 14px;
    font-size: 0.9rem;
    font-family: 'Inter', sans-serif;
    color: #333;
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
    background: #fff;
  }
  .bs-input:focus, .bs-select:focus, .bs-textarea:focus {
    border-color: #2E8B57;
    box-shadow: 0 0 0 3px rgba(46,139,87,0.12);
  }
  .bs-textarea { resize: vertical; min-height: 100px; }

  /* Category chips */
  .bs-category-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 8px;
    margin-bottom: 16px;
  }
  .bs-category-chip {
    border: 1.5px solid #E0E0E0;
    border-radius: 8px;
    padding: 10px 12px;
    cursor: pointer;
    font-size: 0.82rem; font-weight: 600;
    color: #555;
    display: flex; align-items: center; gap: 6px;
    transition: all 0.15s;
    background: #fff;
  }
  .bs-category-chip:hover { border-color: #2E8B57; color: #2E8B57; background: #F1F8F1; }
  .bs-category-chip.selected { border-color: #2E8B57; background: #E8F5E9; color: #1B5E20; font-weight: 700; }

  /* Submit area */
  .bs-submit-row {
    display: flex; justify-content: flex-end; align-items: center;
    gap: 16px; padding: 20px 28px;
    border-top: 1px solid #F0F0F0;
    background: #FAFAFA;
  }
  .bs-btn-primary {
    background: #2E8B57;
    color: #fff;
    border: none; border-radius: 8px;
    padding: 12px 32px;
    font-size: 0.9rem; font-weight: 700;
    cursor: pointer;
    display: flex; align-items: center; gap: 8px;
    transition: background 0.2s, transform 0.15s, box-shadow 0.15s;
    font-family: 'Inter', sans-serif;
  }
  .bs-btn-primary:hover:not(:disabled) { background: #1B5E20; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(30,94,32,0.25); }
  .bs-btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

  /* Success Profile View */
  .bs-profile-view { padding: 28px; }
  .bs-profile-banner {
    background: linear-gradient(135deg, #E8F5E9, #F1F8F1);
    border: 1px solid #A5D6A7;
    border-radius: 12px;
    padding: 20px 24px;
    display: flex; align-items: center; gap: 16px;
    margin-bottom: 28px;
  }
  .bs-profile-banner h3 { margin: 0 0 4px; font-size: 1.1rem; font-weight: 700; color: #1B5E20; }
  .bs-profile-banner p { margin: 0; font-size: 0.85rem; color: #388E3C; }
  .bs-profile-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }
  @media (max-width: 640px) { .bs-profile-grid { grid-template-columns: 1fr; } }
  .bs-profile-item {
    border: 1px solid #E0E0E0;
    border-radius: 10px;
    padding: 16px;
    background: #FAFAFA;
  }
  .bs-profile-item-label {
    font-size: 0.72rem; font-weight: 700;
    text-transform: uppercase; letter-spacing: 0.1em;
    color: #6B8E23; margin: 0 0 6px;
  }
  .bs-profile-item-value {
    font-size: 0.95rem; font-weight: 600; color: #222;
    display: flex; align-items: center; gap: 6px;
  }
  .bs-status-badge {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 0.78rem; font-weight: 700;
  }
  .bs-status-active { background: #E8F5E9; color: #2E7D32; }
  .bs-status-inactive { background: #FFF3E0; color: #E65100; }

  /* Toast */
  .bs-toast {
    position: fixed; bottom: 24px; right: 24px; z-index: 9999;
    padding: 14px 20px;
    border-radius: 12px;
    font-size: 0.9rem; font-weight: 600;
    display: flex; align-items: center; gap: 10px;
    box-shadow: 0 8px 24px rgba(0,0,0,0.15);
    animation: bs-slide-in 0.3s ease;
    max-width: 380px;
  }
  .bs-toast-success { background: #1B5E20; color: #fff; }
  .bs-toast-error   { background: #C62828; color: #fff; }
  @keyframes bs-slide-in {
    from { transform: translateX(110%); opacity: 0; }
    to   { transform: translateX(0); opacity: 1; }
  }

  /* Spinner */
  .bs-spinner { display: flex; justify-content: center; align-items: center; padding: 60px; }
`;

const CATEGORIES = [
  { label: 'Medicine & Pharmacy', icon: '💊' },
  { label: 'Stationery & Office', icon: '📎' },
  { label: 'Printing Materials', icon: '🖨️' },
  { label: 'Food & Agriculture', icon: '🌾' },
  { label: 'Electronics & IT', icon: '💻' },
  { label: 'Construction', icon: '🏗️' },
  { label: 'Furniture', icon: '🪑' },
  { label: 'Cleaning & Hygiene', icon: '🧹' },
  { label: 'Vehicle & Equipment', icon: '🚜' },
  { label: 'Textile & Uniforms', icon: '👕' },
  { label: 'Other', icon: '📦' },
];

const BENEFITS = [
  { icon: <ShieldCheck size={20} color="#2E8B57" />, bg: '#E8F5E9', title: 'Verified Listings', desc: 'Your profile appears in our official supplier directory' },
  { icon: <Star size={20} color="#d97706" />, bg: '#FEF3C7', title: 'Direct Outreach', desc: 'Purchase managers contact you directly for purchasing' },
  { icon: <Package size={20} color="#6B8E23" />, bg: '#F0F4E8', title: 'All Categories', desc: 'Register under any product or service category' },
  { icon: <CheckCircle2 size={20} color="#0284c7" />, bg: '#E0F2FE', title: 'Instant Activation', desc: 'Profile goes live immediately after registration' },
];

/* ─── Main Component ─────────────────────────────────────── */
const CustomerBecomeSupplier = () => {
  const [supplierProfile, setSupplierProfile] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  
  const { user } = useAuth();

  const [form, setForm] = useState({
    company_name: '',
    category: '',
    business_address: '',
    description: '',
  });

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4500);
  };

  useEffect(() => {
    const init = async () => {
      try {
        const [profileRes, supplierRes] = await Promise.all([
          apiClient.get('/customer/profile'),
          apiClient.get('/suppliers/me'),
        ]);
        const customer = profileRes.data?.data?.customer || profileRes.data?.customer || {};
        setUserProfile(customer);
        setSupplierProfile(supplierRes.data?.data || null);
      } catch (err) {
        console.error('Init error:', err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.category) { showToast('Please select a product/service category.', 'error'); return; }
    if (!form.business_address.trim()) { showToast('Business address is required.', 'error'); return; }

    setSubmitting(true);
    try {
      const res = await apiClient.post('/suppliers', form);
      setSupplierProfile(res.data?.data);
      showToast('You are now registered as a supplier! Companies can contact you to purchase your products.');
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed. Please try again.';
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const fmt = (val) => val || '—';

  if (loading) {
    return (
      <>
        <style>{STYLES}</style>
        <div className="bs-page">
          <div className="bs-spinner"><SegmentedSpinner size={36} /></div>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </>
    );
  }

  return (
    <>
      <style>{STYLES}</style>
      <div className="bs-page">
        {/* Hero */}
        <div className="bs-hero">
          <div className="bs-hero-icon">
            <Truck size={40} color="#fff" />
          </div>
          <div className="bs-hero-text">
            <h1>{supplierProfile ? 'My Supplier Profile' : 'Become a Supplier'}</h1>
            <p>
              {supplierProfile
                ? 'Your supplier profile is live. Purchase managers can see and contact you for procurement needs.'
                : 'Register as a supplier to appear in our official supplier directory. Purchase managers will reach out to you directly for products and services.'}
            </p>
          </div>
        </div>

        {/* Benefits (only on registration form) */}
        {!supplierProfile && (
          <div className="bs-benefits">
            {BENEFITS.map((b, i) => (
              <div className="bs-benefit" key={i}>
                <div className="bs-benefit-icon" style={{ background: b.bg }}>{b.icon}</div>
                <div>
                  <h4>{b.title}</h4>
                  <p>{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Main Card */}
        <div className="bs-card">
          {supplierProfile ? (
            /* ── Read-only profile view ── */
            <>
              <div className="bs-card-header">
                <CheckCircle2 size={22} color="#2E8B57" />
                <div>
                  <h2>Supplier Profile</h2>
                  <p>Your information visible to Purchase Managers</p>
                </div>
              </div>
              <div className="bs-profile-view">
                <div className="bs-profile-banner">
                  <ShieldCheck size={36} color="#2E8B57" />
                  <div>
                    <h3>Profile Active</h3>
                    <p>You are listed in the Supplier Directory. Expect direct outreach from the Purchase Department.</p>
                  </div>
                </div>

                <div className="bs-profile-grid">
                  <div className="bs-profile-item">
                    <p className="bs-profile-item-label">Full Name</p>
                    <div className="bs-profile-item-value" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {supplierProfile.profile_photo ? (
                        <img src={supplierProfile.profile_photo} alt={supplierProfile.full_name} style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }} />
                      ) : (
                        <User size={15} color="#6B8E23" />
                      )}
                      {fmt(supplierProfile.full_name)}
                    </div>
                  </div>
                  <div className="bs-profile-item">
                    <p className="bs-profile-item-label">Email</p>
                    <p className="bs-profile-item-value"><Mail size={15} color="#6B8E23" />{fmt(supplierProfile.email)}</p>
                  </div>
                  <div className="bs-profile-item">
                    <p className="bs-profile-item-label">Phone</p>
                    <p className="bs-profile-item-value"><Phone size={15} color="#6B8E23" />{fmt(supplierProfile.phone)}</p>
                  </div>
                  <div className="bs-profile-item">
                    <p className="bs-profile-item-label">Company Name</p>
                    <p className="bs-profile-item-value"><Building2 size={15} color="#6B8E23" />{fmt(supplierProfile.company_name)}</p>
                  </div>
                  <div className="bs-profile-item">
                    <p className="bs-profile-item-label">Category</p>
                    <p className="bs-profile-item-value"><Tag size={15} color="#6B8E23" />{fmt(supplierProfile.category)}</p>
                  </div>
                  <div className="bs-profile-item">
                    <p className="bs-profile-item-label">Status</p>
                    <p className="bs-profile-item-value">
                      <span className={`bs-status-badge ${supplierProfile.status === 'Active' ? 'bs-status-active' : 'bs-status-inactive'}`}>
                        <CheckCircle2 size={12} />
                        {supplierProfile.status}
                      </span>
                    </p>
                  </div>
                  <div className="bs-profile-item" style={{ gridColumn: '1 / -1' }}>
                    <p className="bs-profile-item-label">Business Address</p>
                    <p className="bs-profile-item-value"><MapPin size={15} color="#6B8E23" />{fmt(supplierProfile.business_address)}</p>
                  </div>
                  {supplierProfile.description && (
                    <div className="bs-profile-item" style={{ gridColumn: '1 / -1' }}>
                      <p className="bs-profile-item-label">Description</p>
                      <p className="bs-profile-item-value" style={{ display: 'block', fontWeight: 500, fontSize: '0.875rem', color: '#444' }}>
                        {supplierProfile.description}
                      </p>
                    </div>
                  )}
                  <div className="bs-profile-item">
                    <p className="bs-profile-item-label">Registered On</p>
                    <p className="bs-profile-item-value"><Clock size={15} color="#6B8E23" />
                      {supplierProfile.created_at ? new Date(supplierProfile.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}
                    </p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* ── Registration form ── */
            <>
              <div className="bs-card-header">
                <Truck size={22} color="#2E8B57" />
                <div>
                  <h2>Supplier Registration</h2>
                  <p>Your account details are auto-filled — just add your business information</p>
                </div>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="bs-form">
                  {/* Auto-filled section */}
                  <p className="bs-section-label"><User size={13} />Account Details (Auto-filled)</p>

                  {/* ── Profile Avatar Block ── */}
                  {(() => {
                    const fullName = userProfile?.name || userProfile?.full_name || '';
                    const initials = fullName.trim().split(' ').filter(Boolean).map(w => w[0].toUpperCase()).slice(0, 2).join('') || '?';
                    const baseUrl = (import.meta.env.VITE_API_URL || '').replace(/\/api\/v1\/?$/, '');
                    const rawPic = userProfile?.profile_picture || user?.profilePhoto;
                    const picUrl = rawPic
                      ? (rawPic.startsWith('http') ? rawPic : `${baseUrl}${rawPic.startsWith('/') ? rawPic : `/${rawPic}`}`)
                      : null;
                    return (
                      <div className="bs-avatar-wrap">
                        <div className="bs-avatar">
                          {picUrl
                            ? <img src={picUrl} alt="Profile" className="bs-avatar-img" />
                            : initials
                          }
                        </div>
                        <div className="bs-avatar-info">
                          <p className="bs-avatar-name">{fullName || 'Your Name'}</p>
                          <span className="bs-avatar-role">Customer</span>
                        </div>
                      </div>
                    );
                  })()}
                  <div className="bs-grid-2" style={{ marginBottom: 24 }}>
                    <div className="bs-field">
                      <p className="bs-label"><User size={14} />Full Name</p>
                      <div className="bs-readonly-box">
                        {userProfile?.name || userProfile?.full_name || '—'}
                        <span className="bs-readonly-badge">AUTO</span>
                      </div>
                    </div>
                    <div className="bs-field">
                      <p className="bs-label"><Mail size={14} />Email</p>
                      <div className="bs-readonly-box">
                        {userProfile?.email || '—'}
                        <span className="bs-readonly-badge">AUTO</span>
                      </div>
                    </div>
                    <div className="bs-field">
                      <p className="bs-label"><Phone size={14} />Phone</p>
                      <div className="bs-readonly-box">
                        {userProfile?.phone || '—'}
                        <span className="bs-readonly-badge">AUTO</span>
                      </div>
                    </div>
                  </div>

                  {/* Business section */}
                  <p className="bs-section-label"><Building2 size={13} />Business Details</p>
                  <div className="bs-field-full">
                    <p className="bs-label"><Building2 size={14} />Company / Business Name <span style={{ color: '#999', fontWeight: 400 }}>(optional — leave blank if individual)</span></p>
                    <input
                      className="bs-input"
                      placeholder="e.g. AT Traders PLC, Almaz Supplies..."
                      value={form.company_name}
                      onChange={e => setForm(f => ({ ...f, company_name: e.target.value }))}
                    />
                  </div>

                  <div className="bs-field-full">
                    <p className="bs-label"><Tag size={14} />Product / Service Category <span style={{ color: '#C62828' }}>*</span></p>
                    <div className="bs-category-grid">
                      {CATEGORIES.map(cat => (
                        <div
                          key={cat.label}
                          className={`bs-category-chip ${form.category === cat.label ? 'selected' : ''}`}
                          onClick={() => setForm(f => ({ ...f, category: cat.label }))}
                        >
                          <span>{cat.icon}</span>
                          {cat.label}
                        </div>
                      ))}
                    </div>
                    {/* Also allow free-text override */}
                    <input
                      className="bs-input"
                      placeholder="Or type a custom category..."
                      value={form.category}
                      onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                      style={{ marginTop: 8 }}
                    />
                  </div>

                  <div className="bs-field-full">
                    <p className="bs-label"><MapPin size={14} />Business Address <span style={{ color: '#C62828' }}>*</span></p>
                    <input
                      className="bs-input"
                      placeholder="e.g. Bole, Addis Ababa, Ethiopia"
                      value={form.business_address}
                      onChange={e => setForm(f => ({ ...f, business_address: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="bs-field-full">
                    <p className="bs-label"><FileText size={14} />Description <span style={{ color: '#999', fontWeight: 400 }}>(optional)</span></p>
                    <textarea
                      className="bs-textarea"
                      placeholder="Briefly describe what you can supply — e.g. 'We supply pharmaceutical products and medical consumables wholesale...'"
                      value={form.description}
                      onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="bs-submit-row">
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#888', flexGrow: 1 }}>
                    Your profile will be immediately visible to Purchase Managers.
                  </p>
                  <button className="bs-btn-primary" type="submit" disabled={submitting}>
                    {submitting ? <SegmentedSpinner size={16} /> : <ArrowRight size={16} />}
                    {submitting ? 'Registering...' : 'Register as Supplier'}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`bs-toast bs-toast-${toast.type}`}>
          {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          {toast.msg}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
};

export default CustomerBecomeSupplier;
